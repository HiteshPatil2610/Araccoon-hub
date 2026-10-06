import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { identifyProductUrl, applyImportFields, productImportRequestSchema } from '../../shared/productImport';
import { createOwnerContentProvider } from '../../worker/lib/productImport/providers/ownerContent';
import { createSelectedProductImportProvider } from '../../worker/lib/productImport/composition';
import { createAmazonApiProvider } from '../../worker/lib/productImport/providers/amazonApi/provider';

const hosts = ['amazon.in', 'amazon.com', 'amzn.to', 'amzn.in'];
const url = 'https://www.amazon.in/stand/dp/b0test0001?tag=my-tag-21';

test('URL identity normalizes exact supported hosts and preserves marketplace', () => {
  assert.deepEqual(identifyProductUrl(url, hosts), { marketplace: 'amazon.in', asin: 'B0TEST0001', canonicalUrl: 'https://www.amazon.in/dp/B0TEST0001' });
  assert.equal(identifyProductUrl('amazon.com/gp/product/B0TEST0001/ref=x', hosts)?.marketplace, 'amazon.com');
  for (const bad of ['https://www.amazon.in/dp/B0TEST00012', 'https://www.amazon.in/dp/B0TEST0001evil',
    'https://amazon.in.evil.example/dp/B0TEST0001', 'https://u:p@amazon.in/dp/B0TEST0001', 'https://amazon.in:8443/dp/B0TEST0001',
    'https://sub.amazon.in/dp/B0TEST0001', 'https://amzn.to/abc', 'https://amazon.in/s?k=B0TEST0001', 'https://127.0.0.1/dp/B0TEST0001']) {
    assert.equal(identifyProductUrl(bad, hosts), null, bad);
  }
});

test('owner-content preview never fetches pages or creates unsupported claims', async () => {
  const network = mock.method(globalThis, 'fetch', () => { throw new Error('Network access forbidden'); });
  try {
    assert.equal(createSelectedProductImportProvider().id, 'amazon-page');
    const provider = createOwnerContentProvider();
    const input = productImportRequestSchema.parse({ url, title: '  <b>Desk stand</b> ', features: [' Aluminium ', 'Adjustable angle'], sourceUrl: 'https://brand.example/stand' });
    const result = await provider.preview(input, identifyProductUrl(url, hosts)!);
    assert.equal(provider.id, 'owner-content');
    assert.deepEqual(result.suggestions, { title: 'Desk stand', description: 'Aluminium; Adjustable angle' });
    assert.equal(result.affiliateUrl, url);
    assert.equal(result.provenance, 'owner-supplied');
    assert.equal(result.sourceUrl, input.sourceUrl);
    assert.equal(network.mock.callCount(), 0);
    const partial = await createOwnerContentProvider().preview(productImportRequestSchema.parse({ url }), identifyProductUrl(url, hosts)!);
    assert.deepEqual(partial.suggestions, {});
    await assert.rejects(createAmazonApiProvider().preview(input, result.identity), /not configured or implemented/);
    assert.equal(network.mock.callCount(), 0);
  } finally { network.mock.restore(); }
});

test('selective merge preserves manual edits and affiliate overrides, and creates a draft', async () => {
  const preview = { ...await createOwnerContentProvider().preview(productImportRequestSchema.parse({ url, title: 'New title', description: 'New description' }), identifyProductUrl(url, hosts)!), duplicate: null };
  const current = { title: 'My edit', description: 'My copy', category: 'Home & Living', affiliateUrl: 'https://www.amazon.in/dp/B0TEST0002?tag=existing-21', affiliateTag: 'override-21', status: 'published', featured: true };
  const merged = applyImportFields(current, preview, { title: false, description: true, category: false, affiliateUrl: false });
  assert.equal(merged.title, 'My edit');
  assert.equal(merged.description, 'New description');
  assert.equal(merged.affiliateUrl, current.affiliateUrl);
  assert.equal(merged.affiliateTag, 'override-21');
  assert.equal(merged.status, 'draft');
  assert.equal(current.status, 'published');
});

test('request schema bounds supplied facts and rejects unsafe references', () => {
  for (const patch of [{ features: Array(6).fill('x') }, { title: 'x'.repeat(201) }, { category: 'Invented' },
    { sourceUrl: 'http://brand.example/x' }, { sourceUrl: 'https://u:p@brand.example/x' }, { provider: 'scraping' }]) {
    assert.equal(productImportRequestSchema.safeParse({ url, ...patch }).success, false);
  }
});
