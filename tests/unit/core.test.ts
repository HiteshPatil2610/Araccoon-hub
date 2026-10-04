import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAffiliateUrl, parseHostList } from '../../shared/urlPolicy';
import { csvCell, serializeCsv } from '../../shared/csv';
import { loadConfig, parseAssociateTags, ConfigError } from '../../worker/config';
import { memoryLimiter, upstashLimiter } from '../../worker/lib/ratelimit';
import { productInputSchema } from '../../shared/schemas';

const HOSTS = parseHostList(undefined);

describe('trusted destination policy', () => {
  it('accepts approved stores and short links', () => {
    for (const u of ['https://www.amazon.in/dp/X', 'amazon.com/dp/X', 'https://amzn.in/d/x', 'https://amzn.to/x', 'http://smile.amazon.com/x']) {
      assert.match(normalizeAffiliateUrl(u, HOSTS) ?? '', /^https:\/\//, u);
    }
  });
  it('rejects lookalikes, credentials, ports, schemes, other stores and junk', () => {
    for (const u of ['https://amazon.in.evil.example', 'https://notamazon.com', 'https://x.amzn.to/a', 'https://a:b@amazon.in/', 'https://amazon.in:444/',
      'javascript:alert(1)', 'data:text/html,x', 'https://www.amazon.de/x', '', 'https://', 42, null, `https://amazon.in/${'a'.repeat(3000)}`]) {
      assert.equal(normalizeAffiliateUrl(u, HOSTS), null, String(u));
    }
  });
});

describe('csv', () => {
  it('quotes everything and neutralizes formula leaders', () => {
    assert.equal(csvCell('=1+1'), `"'=1+1"`);
    assert.equal(csvCell('  @x'), `"'  @x"`);
    assert.equal(csvCell('a"b'), '"a""b"');
    assert.equal(csvCell(null), '""');
    assert.equal(serializeCsv([['a', 1], ['b', 2]]), '"a","1"\r\n"b","2"');
  });
});

describe('config', () => {
  it('fails closed in production when secrets are missing', () => {
    assert.throws(() => loadConfig({ ENVIRONMENT: 'production' }), ConfigError);
    assert.throws(() => loadConfig({
      ENVIRONMENT: 'production', SESSION_SECRET: 'short', RECOVERY_CODE_PEPPER: 'short', PASSKEY_RP_ID: 'x', PASSKEY_ORIGIN: 'https://x',
      TURNSTILE_SECRET_KEY: 's', TURNSTILE_SITE_KEY: 'k', UPSTASH_REDIS_REST_URL: 'https://u', UPSTASH_REDIS_REST_TOKEN: 't',
    }), /32 characters/);
  });
  it('treats an unknown ENVIRONMENT as production', () => {
    assert.throws(() => loadConfig({ ENVIRONMENT: 'staging' }), ConfigError);
  });
  it('ignores DEV_LOGIN_TOKEN outside development', () => {
    assert.equal(loadConfig({ ENVIRONMENT: 'test', DEV_LOGIN_TOKEN: 'x' }).devLoginToken, null);
    assert.equal(loadConfig({ ENVIRONMENT: 'development', DEV_LOGIN_TOKEN: 'x' }).devLoginToken, 'x');
  });
  it('parses single and per-store associate tags', () => {
    assert.deepEqual(parseAssociateTags('me-21'), { '*': 'me-21' });
    assert.deepEqual(parseAssociateTags('amazon.in=me-21, www.amazon.com=me-20, bad=has space'), { 'amazon.in': 'me-21', 'amazon.com': 'me-20' });
  });
  it('rejects an invalid reporting timezone', () => {
    assert.throws(() => loadConfig({ ENVIRONMENT: 'test', REPORT_TIMEZONE: 'Mars/Base' }), /IANA/);
  });
});

describe('rate limiter', () => {
  it('memory limiter enforces the window', async () => {
    const l = memoryLimiter();
    const results = [];
    for (let i = 0; i < 4; i++) results.push((await l.hit('k', 3, 60)).ok);
    assert.deepEqual(results, [true, true, true, false]);
  });
  it('upstash limiter uses one pipelined INCR+EXPIRE and throws when the store is down', async () => {
    let sent: unknown;
    const ok = upstashLimiter('https://redis.example', 'tok', (async (_u: string, init: RequestInit) => {
      sent = JSON.parse(String(init.body));
      return new Response(JSON.stringify([{ result: 2 }, { result: 1 }]));
    }) as typeof fetch);
    assert.equal((await ok.hit('login:1.2.3.4', 1, 60)).ok, false);
    assert.equal((sent as string[][])[0]![0], 'INCR');
    const down = upstashLimiter('https://redis.example', 'tok', (async () => new Response('', { status: 500 })) as typeof fetch);
    await assert.rejects(down.hit('k', 1, 60));
  });
});

describe('product schema', () => {
  it('accepts one-decimal ratings and rejects unknown fields', () => {
    const base = { title: 'T', category: 'C', imageUrl: 'https://img.example/a.png', affiliateUrl: 'https://amazon.in/x' };
    for (const rating of [0, 3.3, 4.7, 5]) assert.equal(productInputSchema.safeParse({ ...base, rating }).success, true, String(rating));
    assert.equal(productInputSchema.safeParse({ ...base, rating: 4.75 }).success, false);
    assert.equal(productInputSchema.safeParse({ ...base, extra: 1 }).success, false);
  });
});
