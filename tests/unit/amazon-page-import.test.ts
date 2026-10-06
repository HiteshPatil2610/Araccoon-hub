import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractAmazonPage, amazonImage } from '../../worker/lib/productImport/providers/amazonPage/extract';
import { createAmazonPageProvider } from '../../worker/lib/productImport/providers/amazonPage/provider';
import { applyImportFields, productImportRequestSchema, productImportPreviewSchema } from '../../shared/productImport';

const html = readFileSync(new URL('../fixtures/product-import/amazon-page.html', import.meta.url), 'utf8');
const identity = { marketplace: 'amazon.in' as const, asin: 'B0TEST0001', canonicalUrl: 'https://www.amazon.in/dp/B0TEST0001' };
const response = (body: string) => new Response(body, { headers: { 'content-type': 'text/html' } });

test('extracts title, description, features, specs, category and main image without unrelated content', () => {
  const result = extractAmazonPage(html, identity);
  assert.equal(result.suggestions.title, 'Adjustable & Foldable Desk Stand');
  assert.equal(result.suggestions.category, 'Desk & Office');
  assert.equal(result.suggestions.imageUrl, 'https://m.media-amazon.com/images/I/fixture-large.jpg');
  assert.match(result.suggestions.description!, /A compact stand/);
  assert.match(result.suggestions.description!, /Colour: Black/);
  assert.match(result.suggestions.description!, /Brand: Fixture Brand/);
  assert.doesNotMatch(result.suggestions.description!, /Item model number/);
  assert.doesNotMatch(result.suggestions.description!, /not product copy|Unrelated/);
  assert.deepEqual(result.details.features, ['Adjustable viewing angle', 'Folds flat for storage']);
  assert.equal(result.details.brand, 'Fixture Brand');
  assert.equal(result.details.model, 'ST-1');
});

test('monitor arms retain overview attributes and compatibility ranges instead of becoming monitors', () => {
  const page = readFileSync(new URL('../fixtures/product-import/monitor-arm.html', import.meta.url), 'utf8');
  const result = extractAmazonPage(page, {marketplace:'amazon.in',asin:'B0CH4X2FVM',canonicalUrl:'https://www.amazon.in/dp/B0CH4X2FVM'});
  const text = result.suggestions.description!;
  for (const fact of ['Mounting Type: Tabletop Mount', 'Movement Type: Rotate, Swivel, Tilt, Articulating', 'Brand: HEYMIX LIFE', 'Material: Alloy Steel', 'Colour: Black', 'Screen compatibility: 13–32 inches', 'Supported weight: 2–9 kg', '75 × 75 mm · 100 × 100 mm', 'Tilt: -45–90°', 'Grommet desk thickness: 1–7.8 cm']) assert.ok(text.includes(fact), fact);
  assert.doesNotMatch(text, /Display:|200Hz|QHD|IPS/);
});

test('generic imports retain unfamiliar technical attributes from both tables and matching JSON-LD', () => {
  const page = `<h1 id="productTitle">Example Storage Box</h1>
    <table id="productDetails_techSpec_section_2"><tr><th>Lid Mechanism</th><td>Snap lock</td></tr><tr><th>Capacity</th><td>12 L</td></tr></table>
    <script type="application/ld+json">{"@type":"Product","sku":"B0TEST0001","additionalProperty":[{"name":"Stacking Limit","value":3,"unitText":"boxes"}]}</script>`;
  const result = extractAmazonPage(page, identity);
  assert.match(result.suggestions.description!, /Lid Mechanism: Snap lock\nCapacity: 12 L\nStacking Limit: 3 boxes/);
});

test('uses matching structured metadata and never takes a related product', () => {
  const page = `<script type="application/ld+json">{"@graph":[{"@type":"Product","sku":"OTHER00001","name":"Wrong"},{"@type":"Product","sku":"B0TEST0001","name":"Right","description":"<b>Useful</b> <script>bad()</script> copy","image":"https://m.media-amazon.com/images/I/fixture.jpg"}]}</script>`;
  // Escaped script close tags are required in valid JSON-LD embedded in HTML.
  const result = extractAmazonPage(page.replace('</script> copy', '<\\/script> copy'), identity);
  assert.equal(result.suggestions.title, 'Right');
  assert.equal(result.suggestions.description, 'Useful copy');
  assert.equal(result.suggestions.imageUrl, 'https://m.media-amazon.com/images/I/fixture.jpg');
});

test('rejects CAPTCHA, missing details and wrong ASIN instead of inventing content', () => {
  for (const page of ['<title>Robot Check</title>', '<form action="/errors/validateCaptcha"></form>', '<h1>Unavailable</h1>', html.replace('value="B0TEST0001"', 'value="B0OTHER001"')]) {
    assert.throws(() => extractAmazonPage(page, identity));
  }
  const partial = extractAmazonPage('<h1 id="productTitle">Only a title</h1>', identity);
  assert.deepEqual(partial.suggestions, { title: 'Only a title' });
});

test('image policy rejects external, credentialed and executable URLs', () => {
  for (const bad of ['https://evil.example/a.jpg', 'http://m.media-amazon.com/a.jpg', 'https://m.media-amazon.com.evil.example/a.jpg', 'https://u:p@m.media-amazon.com/a.jpg', 'https://m.media-amazon.com/a.svg', 'javascript:alert(1)']) assert.equal(amazonImage(bad), undefined);
});

test('fetches only the canonical product URL and emits a valid preview', async () => {
  const calls: string[] = [];
  const provider = createAmazonPageProvider(async (url, options) => {
    calls.push(String(url));
    assert.equal(options?.redirect, 'manual');
    assert.ok(options?.signal);
    return response(html);
  });
  const result = await provider.preview(productImportRequestSchema.parse({ url: identity.canonicalUrl + '?tag=owner-21' }), identity);
  assert.deepEqual(calls, [identity.canonicalUrl]);
  assert.equal(result.provider, 'amazon-page');
  assert.equal(result.affiliateUrl, identity.canonicalUrl + '?tag=owner-21');
  assert.equal(productImportPreviewSchema.safeParse({ ...result, duplicate: null }).success, true);
});

test('rejects unsafe redirects, wrong variants, server errors, non-HTML, large pages and network failures', async () => {
  const responses = [
    new Response(null, { status: 302, headers: { location: 'https://127.0.0.1/x' } }),
    new Response(null, { status: 302, headers: { location: 'https://www.amazon.in/dp/B0OTHER001' } }),
    new Response(null, { status: 403 }), new Response('{}', { headers: { 'content-type': 'application/json' } }),
    new Response('large', { headers: { 'content-type': 'text/html', 'content-length': String(5 * 1024 * 1024) } }),
    response('x'.repeat(4 * 1024 * 1024 + 1)),
  ];
  for (const res of responses) {
    let calls = 0;
    const provider = createAmazonPageProvider(async () => { calls++; return res; });
    await assert.rejects(provider.preview(productImportRequestSchema.parse({ url: identity.canonicalUrl }), identity));
    assert.equal(calls, 1);
  }
  await assert.rejects(createAmazonPageProvider(async () => { throw new Error('Timeout'); }).preview(productImportRequestSchema.parse({ url: identity.canonicalUrl }), identity), /Could not fetch/);
});

test('bounds redirects and accepts a same-product mobile redirect', async () => {
  let count = 0;
  const provider = createAmazonPageProvider(async () => ++count === 1
    ? new Response(null, { status: 302, headers: { location: '/gp/aw/d/B0TEST0001' } }) : response(html));
  assert.equal((await provider.preview(productImportRequestSchema.parse({ url: identity.canonicalUrl }), identity)).suggestions.title, 'Adjustable & Foldable Desk Stand');
  count = 0;
  const loop = createAmazonPageProvider(async () => { count++; return new Response(null, {status:302,headers:{location:identity.canonicalUrl}}); });
  await assert.rejects(loop.preview(productImportRequestSchema.parse({ url: identity.canonicalUrl }), identity));
  assert.equal(count, 4);
});

test('applying a fetched image clears an old upload ID, while unselected fields stay intact', async () => {
  const preview = { ...await createAmazonPageProvider(async () => response(html)).preview(productImportRequestSchema.parse({ url: identity.canonicalUrl }), identity), duplicate: null };
  const current = { title: 'My title', description: 'My copy', category: 'Quirky Finds', affiliateUrl: identity.canonicalUrl, imageUrl: 'https://img.example/old.jpg', imagePublicId: 'old-upload', status: 'published' };
  const merged = applyImportFields(current, preview, { title: false, description: true, category: false, affiliateUrl: true, imageUrl: true });
  assert.equal(merged.title, current.title);
  assert.equal(merged.imageUrl, preview.suggestions.imageUrl);
  assert.equal(merged.imagePublicId, null);
  assert.equal(merged.status, 'draft');
  assert.equal(applyImportFields(current, preview, { title: false, description: false, category: false, affiliateUrl: false }).imagePublicId, 'old-upload');
});
