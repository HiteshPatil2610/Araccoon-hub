import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContext, integrationSkipReason, VALID_PRODUCT, type TestContext, type Browser } from '../support/testApp';

const root = '/api/admin/product-imports';
describe('owner-supplied product assistance', { skip: integrationSkipReason }, () => {
  let ctx: TestContext;
  let owner: Browser;
  before(async () => { ctx = await createTestContext(); owner = (await ctx.setupOwner()).browser; });
  after(async () => { await ctx?.close(); });
  beforeEach(async () => { await ctx.db.query('DELETE FROM products'); });
  const source = { provider: 'owner-content', sourceUrl: 'https://brand.example/lamp', contentAuthorized: true };

  it('authenticates and rejects cross-origin requests', async () => {
    assert.equal((await ctx.browser().post(`${root}/preview`, { url: VALID_PRODUCT.affiliateUrl })).status, 401);
    assert.equal((await owner.post(`${root}/preview`, { url: VALID_PRODUCT.affiliateUrl }, { origin: 'https://evil.example' })).status, 403);
  });

  it('expands short links and checks duplicates without writing a product', async t => {
    const created = await owner.post('/api/admin/products', VALID_PRODUCT);
    assert.equal(created.status, 201);
    const network = t.mock.method(globalThis, 'fetch', async () => new Response(null, {
      status: 302, headers: { location: 'https://www.amazon.in/dp/B0TEST0001?tag=owner-21' },
    }));
    const preview = await owner.post(`${root}/preview`, { url: 'https://amzn.to/example', title: 'My title' });
    assert.equal(preview.status, 200, preview.text);
    assert.equal(preview.body.identity.asin, 'B0TEST0001');
    assert.equal(preview.body.affiliateUrl, 'https://www.amazon.in/dp/B0TEST0001?tag=test-21');
    assert.deepEqual(preview.body.duplicate, { id: created.body.id, title: VALID_PRODUCT.title });
    assert.equal(network.mock.callCount(), 1);
    assert.equal((await ctx.db.query('SELECT id FROM products')).rowCount, 1);
  });

  it('returns bounded owner copy and detects legacy full-link duplicates without writing', async () => {
    const created = await owner.post('/api/admin/products', VALID_PRODUCT);
    assert.equal(created.status, 201);
    const preview = await owner.post(`${root}/preview`, { url: 'https://amazon.in/gp/product/B0TEST0001?tag=mine-21', title: 'Desk lamp', features: ['Adjustable angle'] });
    assert.equal(preview.status, 200, preview.text);
    assert.deepEqual(preview.body.duplicate, { id: created.body.id, title: VALID_PRODUCT.title });
    assert.equal(preview.body.suggestions.description, 'Adjustable angle');
    assert.equal(preview.headers.get('cache-control'), 'no-store');
    assert.equal((await ctx.db.query('SELECT id FROM products')).rowCount, 1);
  });

  it('forces draft on the server, records owner assertion, then allows normal publication', async () => {
    const saved = await owner.post(`${root}/draft`, { product: { ...VALID_PRODUCT, status: 'published' }, source });
    assert.equal(saved.status, 201, saved.text);
    assert.equal(saved.body.status, 'draft');
    assert.deepEqual((await ctx.browser().get('/api/products')).body, []);
    const records = await ctx.db.query<{ provider: string; asin: string; source_url: string }>('SELECT * FROM product_content_sources');
    assert.equal(records.rows[0]?.asin, 'B0TEST0001');
    assert.equal(records.rows[0]?.provider, 'owner-content');
    assert.equal(records.rows[0]?.source_url, source.sourceUrl);
    const published = await owner.patch(`/api/admin/products/${saved.body.id}`, { status: 'published' });
    assert.equal(published.status, 200);
    const publicList = await ctx.browser().get('/api/products');
    assert.equal(publicList.body.length, 1);
    assert.ok(!('sourceUrl' in publicList.body[0]));
    await owner.del(`/api/admin/products/${saved.body.id}`);
    assert.equal((await ctx.db.query('SELECT product_id FROM product_content_sources')).rowCount, 0);
  });

  it('rejects missing assertions, malformed identity, and forged Cloudinary references without writes', async () => {
    for (const payload of [
      { product: VALID_PRODUCT, source: { ...source, contentAuthorized: false } },
      { product: { ...VALID_PRODUCT, affiliateUrl: 'https://amazon.in/s?k=lamp' }, source },
      { product: { ...VALID_PRODUCT, imageUrl: 'https://other.example/image.png' }, source },
    ]) assert.equal((await owner.post(`${root}/draft`, payload)).status, 400);
    assert.equal((await ctx.db.query('SELECT id FROM products')).rowCount, 0);
  });

  it('serializes repeated assisted saves and preserves per-marketplace identity', async () => {
    const results = await Promise.all([owner.post(`${root}/draft`, { product: VALID_PRODUCT, source }), owner.post(`${root}/draft`, { product: VALID_PRODUCT, source })]);
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    assert.equal((await ctx.db.query('SELECT id FROM products')).rowCount, 1);
    const otherMarket = await owner.post(`${root}/draft`, { product: { ...VALID_PRODUCT, affiliateUrl: 'https://www.amazon.com/dp/B0TEST0001' }, source });
    assert.equal(otherMarket.status, 201, otherMarket.text);
  });

  it('rate-limits preview bursts without creating products', async () => {
    const responses = await Promise.all(Array.from({ length: 6 }, () => owner.post(`${root}/preview`, { url: VALID_PRODUCT.affiliateUrl })));
    const limited = responses.filter(r => r.status === 429);
    assert.ok(limited.length > 0);
    assert.ok(limited[0]!.headers.get('retry-after'));
    assert.equal((await ctx.db.query('SELECT id FROM products')).rowCount, 0);
  });
});
