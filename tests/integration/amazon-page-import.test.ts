import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createTestContext, integrationSkipReason, VALID_PRODUCT, type TestContext, type Browser } from '../support/testApp';
import { createAmazonPageProvider } from '../../worker/lib/productImport/providers/amazonPage/provider';
import { formatProductCopy } from '../../shared/productCopy';

const html = readFileSync(new URL('../fixtures/product-import/amazon-page.html', import.meta.url), 'utf8');
const root = '/api/admin/product-imports';
describe('automatic Amazon product details', { skip: integrationSkipReason }, () => {
  let ctx: TestContext; let owner: Browser;
  before(async () => { ctx = await createTestContext({}, createAmazonPageProvider()); owner = (await ctx.setupOwner()).browser; });
  after(async () => { await ctx?.close(); });
  beforeEach(async () => { await ctx.db.query('DELETE FROM products'); });

  it('expands a short link, fetches details without manual inputs, saves a draft and detects duplicate', async t => {
    const network = t.mock.method(globalThis, 'fetch', async (url: string) => url.includes('amzn.to')
      ? new Response(null, {status:302,headers:{location:'https://www.amazon.in/dp/B0TEST0001?tag=someone-21'}})
      : new Response(html, {headers:{'content-type':'text/html'}}));
    const result = await owner.post(`${root}/preview`, {url:'https://amzn.to/example'});
    assert.equal(result.status, 200, result.text);
    assert.equal(result.body.provider, 'amazon-page');
    assert.equal(result.body.suggestions.title, 'Adjustable & Foldable Desk Stand');
    assert.match(result.body.suggestions.description, /Adjustment: Adjustable viewing angle/);
    assert.equal(new URL(result.body.affiliateUrl).searchParams.get('tag'), 'test-21');
    assert.equal(network.mock.callCount(), 2);
    assert.equal((await ctx.db.query('SELECT id FROM products')).rowCount, 0);
    const product = { ...VALID_PRODUCT, ...result.body.suggestions, imagePublicId: null, affiliateUrl: result.body.affiliateUrl, status: 'published' };
    const saved = await owner.post(`${root}/draft`, {product,source:{provider:'amazon-page',sourceUrl:result.body.sourceUrl,contentAuthorized:true}});
    assert.equal(saved.status, 201, saved.text);
    assert.equal(saved.body.status, 'draft');
    assert.equal(saved.body.imageUrl, result.body.suggestions.imageUrl);
    assert.equal((await ctx.db.query('SELECT provider FROM product_content_sources')).rows[0]?.provider, 'amazon-page');
    const duplicate = await owner.post(`${root}/preview`, {url:product.affiliateUrl});
    assert.equal(duplicate.status, 200, duplicate.text);
    assert.equal(duplicate.body.duplicate?.id, saved.body.id);
  });

  it('returns an actionable blocked-page error without creating products', async t => {
    t.mock.method(globalThis, 'fetch', async () => new Response('<title>Robot Check</title>', {headers:{'content-type':'text/html'}}));
    const result = await owner.post(`${root}/preview`, {url:VALID_PRODUCT.affiliateUrl});
    assert.equal(result.status, 502);
    assert.match(result.body.error, /verification page/);
    assert.equal((await ctx.db.query('SELECT id FROM products')).rowCount, 0);
    assert.equal((await ctx.browser().post(`${root}/preview`, {url:VALID_PRODUCT.affiliateUrl})).status, 401);
  });

  it('preserves monitor-arm attributes through import, persistence and storefront formatting', async t => {
    const arm = readFileSync(new URL('../fixtures/product-import/monitor-arm.html', import.meta.url), 'utf8');
    t.mock.method(globalThis, 'fetch', async () => new Response(arm, {headers:{'content-type':'text/html'}}));
    const preview = await owner.post(`${root}/preview`, {url:'https://www.amazon.in/dp/B0CH4X2FVM'});
    assert.equal(preview.status, 200, preview.text);
    const product = {...VALID_PRODUCT, ...preview.body.suggestions, imagePublicId:null, affiliateUrl:preview.body.affiliateUrl};
    const saved = await owner.post(`${root}/draft`, {product,source:{provider:'amazon-page',sourceUrl:preview.body.sourceUrl,contentAuthorized:true}});
    assert.equal(saved.status, 201, saved.text);
    const published = await owner.patch(`/api/admin/products/${saved.body.id}`, {status:'published'});
    assert.equal(published.status, 200, published.text);
    const catalog = await ctx.browser().get(`/api/products/${saved.body.id}`);
    assert.equal(catalog.status, 200, catalog.text);
    const copy = formatProductCopy(catalog.body.title, catalog.body.description);
    assert.equal(copy.description, preview.body.suggestions.description);
    for (const label of ['Mounting Type', 'Movement Type', 'Brand', 'Material', 'Colour', 'Screen compatibility', 'Supported weight', 'VESA mounting', 'Tilt', 'Swivel', 'Rotation', 'Clamp desk thickness', 'Grommet desk thickness']) {
      assert.ok(copy.description.includes(`${label}:`), label);
    }
    assert.doesNotMatch(copy.description, /Display:|13-inch/);
  });
});
