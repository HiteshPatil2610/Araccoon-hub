import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../../worker/server';
import { loadConfig } from '../../worker/config';
import { memoryLimiter, upstashLimiter, type RateLimiter } from '../../worker/lib/ratelimit';
import { fakeImages, ORIGIN } from '../support/testApp';
import { turnstileVerifier } from '../../worker/lib/turnstile';
import type { Db } from '../../worker/db/db';

function harness(limiter: RateLimiter = memoryLimiter()) {
  let queries = 0;
  const db: Db = { query: async () => { queries++; return { rows: [], rowCount: 0 }; }, tx: async fn => fn(db) };
  const app = buildApp({ config: loadConfig({ ENVIRONMENT: 'test' }), limiter, human: { verify: async () => false }, images: fakeImages(), openDb: () => db });
  return { app, queries: () => queries };
}

describe('hostile requests and infrastructure failures', () => {
  it('handles a concurrent request burst while enforcing the shared IP limit', async () => {
    const { app, queries } = harness();
    const results = await Promise.all(Array.from({ length: 150 }, () => app.request('/api/health', { headers: { 'cf-connecting-ip': '203.0.113.99' } })));
    assert.equal(results.filter(r => r.status === 200).length, 60);
    assert.equal(results.filter(r => r.status === 429).length, 90);
    assert.equal(queries(), 60);
    assert.ok(results.filter(r => r.status === 429).every(r => Number(r.headers.get('retry-after')) > 0));
  });

  it('rejects insecure production origins and development or shared secrets', () => {
    const production = {
      ENVIRONMENT: 'production', SESSION_SECRET: 'a'.repeat(48), RECOVERY_CODE_PEPPER: 'b'.repeat(48),
      PASSKEY_RP_ID: 'example.com', PASSKEY_ORIGIN: 'https://example.com',
      TURNSTILE_SECRET_KEY: 's', TURNSTILE_SITE_KEY: 'k', UPSTASH_REDIS_REST_URL: 'https://redis.example', UPSTASH_REDIS_REST_TOKEN: 't',
    };
    assert.equal(loadConfig(production).environment, 'production');
    for (const override of [
      { SESSION_SECRET: production.RECOVERY_CODE_PEPPER },
      { SESSION_SECRET: 'development-only-secret-do-not-use-in-production-0000' },
      { PASSKEY_ORIGIN: 'http://example.com' }, { PASSKEY_RP_ID: 'evil.example' },
      { PASSKEY_ORIGIN: 'https://example.com/path' }, { UPSTASH_REDIS_REST_URL: 'http://redis.example' },
      { OWNER_SETUP_TOKEN: 'guessable' },
    ]) assert.throws(() => loadConfig({ ...production, ...override }));
  });

  it('bounds actual request bytes without a length header, with a forged header and with multibyte text', async () => {
    const { app, queries } = harness();
    for (const path of ['/api/auth/login/options', '/api/webhooks/conversion']) {
      for (const length of [undefined, '1']) {
        const headers: Record<string, string> = { origin: ORIGIN };
        if (length) headers['content-length'] = length;
        const res = await app.request(path, { method: 'POST', headers, body: JSON.stringify({ text: '💥'.repeat(30_000) }) });
        assert.equal(res.status, 413, `${path} content-length=${length}`);
        assert.ok(res.headers.get('content-security-policy'));
        if (path.includes('/auth/')) assert.equal(res.headers.get('cache-control'), 'no-store');
      }
    }
    assert.equal(queries(), 0, 'no database work for oversized requests');
  });

  it('cancels oversized streaming bodies before reading the whole stream', async () => {
    const { app } = harness();
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({ pull(controller) { controller.enqueue(new Uint8Array(65_536)); }, cancel() { cancelled = true; } });
    const req = new Request(`${ORIGIN}/api/track`, { method: 'POST', headers: { origin: ORIGIN }, body: stream, duplex: 'half' } as RequestInit);
    assert.equal((await app.request(req)).status, 413);
    assert.equal(cancelled, true);
  });

  it('rejects malformed JSON, unknown fields and cross-origin writes without database work', async () => {
    const { app, queries } = harness();
    assert.equal((await app.request('/api/auth/login/options', { method: 'POST', headers: { origin: ORIGIN }, body: '{' })).status, 400);
    assert.equal((await app.request('/api/auth/login/options', { method: 'POST', headers: { origin: ORIGIN }, body: '{"admin":true}' })).status, 400);
    for (const origin of ['https://evil.example', 'null', `${ORIGIN}.evil.example`]) {
      assert.equal((await app.request('/api/admin/products', { method: 'POST', headers: { origin }, body: '{}' })).status, 403);
    }
    assert.equal(queries(), 0);
  });

  it('rejects malformed UUIDs as a 404 without querying PostgreSQL', async () => {
    const { app, queries } = harness();
    for (const id of ['-'.repeat(36), 'a'.repeat(36), "x' OR 1=1--"]) {
      assert.equal((await app.request(`/api/products/${encodeURIComponent(id)}`)).status, 404);
    }
    assert.equal(queries(), 0);
  });

  it('fails closed for authentication, click writes and health when Redis is down', async () => {
    const { app, queries } = harness({ hit: async () => { throw new Error('simulated outage'); } });
    for (const [path, method] of [['/api/auth/login/options', 'POST'], ['/api/track', 'POST'], ['/r/abc', 'GET'], ['/api/health', 'GET']]) {
      const res = await app.request(path!, { method, headers: { origin: ORIGIN }, ...(method === 'POST' ? { body: '{}' } : {}) });
      assert.equal(res.status, 503);
      assert.ok(!(await res.text()).includes('simulated outage'));
    }
    assert.equal(queries(), 0);
  });

  it('rejects corrupt Redis counts and failed expiry commands', async () => {
    for (const data of [[{ result: null }, { result: 1 }], [{ result: -1 }, { result: 1 }], [{ result: '1' }, { result: 1 }], [{ result: 1 }, { error: 'denied' }], [{ result: 1 }]]) {
      const limiter = upstashLimiter('https://redis.example', 'test', (async (_url, options) => {
        assert.ok(options?.signal, 'outbound requests have a deadline');
        return Response.json(data);
      }) as typeof fetch);
      await assert.rejects(limiter.hit('test', 10, 60));
    }
  });

  it('does not accept success JSON from a failed Turnstile HTTP response', async () => {
    const human = turnstileVerifier('secret', (async (_url, options) => {
      assert.ok(options?.signal);
      return Response.json({ success: true }, { status: 500 });
    }) as typeof fetch);
    assert.equal(await human.verify('token', null), false);
  });
});
