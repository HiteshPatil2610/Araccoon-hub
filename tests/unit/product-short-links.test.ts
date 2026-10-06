import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveProductUrl } from '../../worker/lib/productImport/resolveProductUrl';
import { ApiError } from '../../worker/app';

const hosts = ['amazon.in', 'amazon.com', 'amzn.to', 'amzn.in', 'amzn.eu', 'a.co'];
const full = 'https://www.amazon.in/gp/aw/d/B0TEST0001?tag=owner-21';
const redirect = (location: string) => new Response(null, { status: 302, headers: { location } });

test('direct product links never make network requests', async t => {
  const network = t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected fetch'); });
  assert.equal((await resolveProductUrl(full, hosts)).identity.asin, 'B0TEST0001');
  assert.equal(network.mock.callCount(), 0);
});

test('expands each approved short-link host without fetching the product page', async t => {
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    calls.push(url);
    assert.equal(options.redirect, 'manual');
    assert.ok(options.signal);
    return redirect(full);
  });
  for (const host of ['amzn.to', 'amzn.in', 'amzn.eu', 'a.co']) {
    const result = await resolveProductUrl(`https://${host}/abc`, hosts);
    assert.equal(result.url, full);
    assert.equal(result.identity.marketplace, 'amazon.in');
  }
  assert.equal(calls.length, 4);
  assert.ok(calls.every(url => !url.includes('amazon.in')));
});

test('follows relative redirect chains and preserves destination tracking parameters', async t => {
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    calls.push(url);
    return calls.length === 1 ? redirect('/expanded') : redirect(full);
  });
  assert.equal((await resolveProductUrl('https://amzn.in/abc', hosts)).url, full);
  assert.deepEqual(calls, ['https://amzn.in/abc', 'https://amzn.in/expanded']);
});

test('rejects unsafe redirect destinations before requesting them', async t => {
  for (const bad of ['https://127.0.0.1/private', 'https://169.254.169.254/', 'https://amazon.in.evil.example/dp/B0TEST0001',
    'https://sub.amazon.in/private', 'http://www.amazon.in/dp/B0TEST0001', 'https://u:p@amazon.in/dp/B0TEST0001', 'https://amazon.in:8443/dp/B0TEST0001']) {
    const network = t.mock.method(globalThis, 'fetch', async () => redirect(bad));
    await assert.rejects(resolveProductUrl('https://amzn.in/abc', hosts), (error: unknown) => error instanceof ApiError && error.status === 400);
    assert.equal(network.mock.callCount(), 1);
    network.mock.restore();
  }
});

test('rejects a host that is not enabled in the configured allowlist', async t => {
  const network = t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected fetch'); });
  await assert.rejects(resolveProductUrl('https://a.co/abc', ['amazon.in', 'amzn.in']));
  assert.equal(network.mock.callCount(), 0);
});

test('bounds redirect loops and redirect counts', async t => {
  const loop = t.mock.method(globalThis, 'fetch', async () => redirect('https://amzn.in/abc'));
  await assert.rejects(resolveProductUrl('https://amzn.in/abc', hosts), (error: unknown) => error instanceof ApiError && /loop/.test(error.fields?.url ?? ''));
  assert.equal(loop.mock.callCount(), 1);
  loop.mock.restore();
  let counter = 0;
  const chain = t.mock.method(globalThis, 'fetch', async () => redirect(`https://amzn.in/step-${++counter}`));
  await assert.rejects(resolveProductUrl('https://amzn.in/abc', hosts), (error: unknown) => error instanceof ApiError && /too many redirects/.test(error.fields?.url ?? ''));
  assert.equal(chain.mock.callCount(), 5);
});

test('returns a useful error for a non-redirect, missing destination, or timeout', async t => {
  for (const response of [new Response('blocked', { status: 403 }), new Response(null, { status: 302 })]) {
    const network = t.mock.method(globalThis, 'fetch', async () => response);
    await assert.rejects(resolveProductUrl('https://amzn.in/abc', hosts), (error: unknown) => error instanceof ApiError && error.status === 400);
    network.mock.restore();
  }
  t.mock.method(globalThis, 'fetch', async () => { throw new DOMException('Timed out', 'TimeoutError'); });
  await assert.rejects(resolveProductUrl('https://amzn.in/abc', hosts), (error: unknown) => error instanceof ApiError && error.status === 502);
});
