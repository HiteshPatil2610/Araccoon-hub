import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createTestContext, integrationSkipReason, VALID_PRODUCT, FAKE_CLOUD, type TestContext, type Browser } from '../support/testApp';

const WEBHOOK_SECRET = 'whsec_test_0123456789abcdef0123456789';

function csvRows(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let f = ''; let q = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (q) { if (ch === '"' && s[i + 1] === '"') { f += '"'; i++; } else if (ch === '"') q = false; else f += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { row.push(f); f = ''; }
    else if (ch === '\r' && s[i + 1] === '\n') { row.push(f); rows.push(row); row = []; f = ''; i++; } else f += ch;
  }
  row.push(f); rows.push(row);
  return rows;
}

describe('store: products, outbound links, analytics, exports, conversions', { skip: integrationSkipReason }, () => {
  let t: TestContext;
  let owner: Browser;

  before(async () => {
    mock.method(console, 'error', () => {});
    t = await createTestContext({ WEBHOOK_SECRET });
    owner = (await t.setupOwner()).browser;
  });
  after(async () => { mock.restoreAll(); await t?.close(); });
  beforeEach(async () => {
    await t.db.query('DELETE FROM conversions');
    await t.db.query('DELETE FROM clicks');
    await t.db.query('DELETE FROM products');
  });

  const create = async (patch: Record<string, unknown> = {}) => {
    const res = await owner.post('/api/admin/products', { ...VALID_PRODUCT, ...patch });
    assert.equal(res.status, 201, res.text);
    return res.body;
  };

  it('publishing and editing one field preserve omitted copy, ratings, tags and catalog settings', async () => {
    const product = await create({description:'Material: Steel',rating:4.2,reviewCount:27,badge:'Useful',featured:true,status:'draft',sortOrder:42,affiliateTag:'custom-21',subId:'desk'});
    const published = await owner.patch(`/api/admin/products/${product.id}`, {status:'published'});
    assert.equal(published.status, 200, published.text);
    for (const key of ['description', 'rating', 'reviewCount', 'badge', 'featured', 'sortOrder', 'affiliateTag', 'subId', 'imageUrl', 'imagePublicId', 'affiliateUrl']) {
      assert.equal(published.body[key], product[key], key);
    }
    const edited = await owner.patch(`/api/admin/products/${product.id}`, {description:'Material: Alloy steel'});
    assert.equal(edited.status, 200, edited.text);
    assert.equal(edited.body.description, 'Material: Alloy steel');
    for (const key of ['status', 'rating', 'reviewCount', 'badge', 'featured', 'sortOrder', 'affiliateTag', 'subId', 'imageUrl', 'imagePublicId', 'affiliateUrl']) {
      assert.equal(edited.body[key], published.body[key], key);
    }
  });

  it('accepts .com and .in Amazon links (incl. short links) and normalizes to https', async test => {
    test.mock.method(globalThis, 'fetch', async () => new Response(null, {status:302,headers:{location:'https://www.amazon.in/dp/B0TEST0001'}}));
    for (const url of ['https://www.amazon.in/dp/B0X1', 'amazon.com/dp/B0X2', 'http://www.amazon.in/gp/product/B0X3', 'https://amzn.to/3abc', 'https://amzn.in/d/abc']) {
      const p = await create({ affiliateUrl: url });
      assert.match(p.affiliateUrl, /^https:\/\//);
      assert.equal(p.linkHealthy, true);
    }
  });

  it('rejects untrusted destinations and bad fields with per-field messages and no write', async () => {
    for (const url of ['https://amazon.com.evil.example/dp/1', 'https://evilamazon.in/x', 'https://evil.example/amzn.to/x', 'https://sub.amzn.to/x',
      'https://u:p@www.amazon.in/x', 'https://www.amazon.in:8443/x', 'javascript:alert(1)', 'https://www.amazon.de/dp/1']) {
      const res = await owner.post('/api/admin/products', { ...VALID_PRODUCT, affiliateUrl: url });
      assert.equal(res.status, 400, url);
      assert.ok(res.body.fields?.affiliateUrl, url);
    }
    for (const patch of [{ title: '' }, { title: 'x'.repeat(201) }, { rating: 7 }, { reviewCount: -1 }, { featured: 'yes' },
      { imageUrl: 'data:image/png;base64,AA' }, { imageUrl: 'https://evil.example/a.png', imagePublicId: 'araccoon-hub/products/x' }, { isAdmin: true }]) {
      const res = await owner.post('/api/admin/products', { ...VALID_PRODUCT, ...patch });
      assert.equal(res.status, 400, JSON.stringify(patch));
    }
    assert.equal((await owner.get('/api/admin/products')).body.length, 0);
  });

  it('serves only published products to visitors and never exposes affiliate URLs', async () => {
    const pub = await create({ title: 'Visible' });
    await create({ title: 'Hidden draft', status: 'draft' });
    const list = await t.browser().get('/api/products');
    assert.deepEqual(list.body.map((p: any) => p.title), ['Visible']);
    assert.ok(!('affiliateUrl' in list.body[0]));
    assert.equal(list.body[0].store, 'amazon.in');
    assert.equal((await t.browser().get(`/api/products/${pub.id}`)).status, 200);
    const search = await t.browser().get(`/api/products?search=${encodeURIComponent("%_' OR 1=1 --")}`);
    assert.equal(search.body.length, 0);
  });

  it('redirects with the right store tag, counts beacon + fallback once, and excludes owner test clicks', async () => {
    const p = await create();
    const visitor = t.browser();
    const ck = crypto.randomUUID();
    const beacon = await visitor.post('/api/track', { productId: p.id, clickKey: ck, utmSource: 'instagram' });
    assert.equal(beacon.status, 200);
    const dest = new URL(beacon.body.destinationUrl);
    assert.equal(dest.hostname, 'www.amazon.in');
    assert.equal(dest.searchParams.get('tag'), 'test-21');
    const r = await visitor.get(`/r/${p.id}?ck=${ck}`);
    assert.equal(r.status, 302);
    const com = await create({ affiliateUrl: 'https://www.amazon.com/dp/B0COM' });
    const r2 = await visitor.get(`/r/${com.id}`);
    assert.equal(new URL(r2.headers.get('location')!).searchParams.get('tag'), 'test-20');
    await owner.get(`/r/${p.id}`);
    const { rows } = await t.db.query<{ is_owner: boolean }>('SELECT is_owner FROM clicks ORDER BY occurred_at');
    assert.deepEqual(rows.map(r => r.is_owner), [false, false, true]);
  });

  it('replaces other affiliate tags on saves and on legacy visitor links', async test => {
    const p = await create({ affiliateUrl: 'https://www.amazon.in/dp/B0TEST0001?tag=someone-21&ascsubtag=old&th=1' });
    assert.equal(new URL(p.affiliateUrl).searchParams.get('tag'), 'test-21');
    await t.db.query('UPDATE products SET affiliate_url = $1 WHERE id = $2', ['https://amzn.to/legacy', p.id]);
    const network = test.mock.method(globalThis, 'fetch', async () => new Response(null, {status:302,headers:{location:'https://www.amazon.in/dp/B0TEST0001?tag=someone-21&th=1'}}));
    const visitor = t.browser();
    const beacon = await visitor.post('/api/track', { productId: p.id, clickKey: crypto.randomUUID() });
    assert.equal(beacon.status, 200, beacon.text);
    assert.equal(new URL(beacon.body.destinationUrl).searchParams.get('tag'), 'test-21');
    const redirect = await visitor.get(`/r/${p.id}`);
    assert.equal(redirect.status, 302);
    assert.equal(new URL(redirect.headers.get('location')!).searchParams.get('tag'), 'test-21');
    assert.equal(network.mock.callCount(), 2);
  });

  it('expands short links on manual save and honors the owner tag override', async test => {
    test.mock.method(globalThis, 'fetch', async () => new Response(null, {status:302,headers:{location:'https://www.amazon.in/dp/B0TEST0001?tag=someone-21'}}));
    const p = await create({ affiliateUrl: 'https://amzn.to/example', affiliateTag: 'campaign-21', subId: 'my-campaign' });
    const saved = new URL(p.affiliateUrl);
    assert.equal(saved.hostname, 'www.amazon.in');
    assert.equal(saved.searchParams.get('tag'), 'campaign-21');
    assert.equal(saved.searchParams.get('ascsubtag'), 'my-campaign');
    const edited = await owner.patch(`/api/admin/products/${p.id}`, { affiliateUrl: 'https://www.amazon.in/dp/B0TEST0001?tag=other-21', affiliateTag: 'second-21' });
    assert.equal(edited.status, 200);
    assert.equal(new URL(edited.body.affiliateUrl).searchParams.get('tag'), 'second-21');
    const tagOnly = await owner.patch(`/api/admin/products/${p.id}`, { affiliateTag: null, subId: null });
    assert.equal(tagOnly.status, 200);
    assert.equal(new URL(tagOnly.body.affiliateUrl).searchParams.get('tag'), 'test-21');
    assert.equal(new URL(tagOnly.body.affiliateUrl).searchParams.has('ascsubtag'), false);
  });

  it('never redirects to a stored destination that fails the current policy', async () => {
    const { rows } = await t.db.query<{ id: string }>(
      `INSERT INTO products (title, category, image_url, affiliate_url) VALUES ('Legacy', 'X', 'https://img.example/a.png', 'https://example.invalid/phish') RETURNING id`
    );
    const r = await t.browser().get(`/r/${rows[0]!.id}`);
    assert.equal(r.status, 404);
    assert.equal(r.headers.get('location'), null);
    const list = await owner.get('/api/admin/products');
    assert.equal(list.body[0].linkHealthy, false, 'owner sees the broken link');
  });

  it('analytics use local (IST) dates, compare to the previous period, and exclude owner clicks', async () => {
    const p = await create();
    const ins = (at: Date, owner = false) => t.db.query(
      `INSERT INTO clicks (product_id, product_title, category, occurred_at, device, destination_url, visitor_hash, is_owner)
       VALUES ($1, 'Desk Lamp', 'Desk & Office', $2, 'Mobile', 'https://www.amazon.in/x', $3, $4)`, [p.id, at, crypto.randomUUID(), owner]);
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const [y, m, d] = today.split('-').map(Number);
    const istMidnight = new Date(Date.UTC(y!, m! - 1, d!) - 5.5 * 3600_000);
    await ins(new Date(istMidnight.getTime() + 60_000));            // today IST
    await ins(new Date(istMidnight.getTime() - 60_000));            // yesterday IST
    await ins(new Date(istMidnight.getTime() - 10 * 86_400_000));   // previous 7-day period
    await ins(new Date(istMidnight.getTime() + 120_000), true);     // owner test click
    await t.db.query(`INSERT INTO conversions (product_id, product_title, occurred_at, source) VALUES ($1, 'Desk Lamp', $2, 'manual')`,
      [p.id, new Date(istMidnight.getTime() + 3600_000 - 365 * 86_400_000)]); // a year ago, same day

    const s = (await owner.get('/api/admin/analytics?days=7')).body;
    assert.equal(s.range.timezone, 'Asia/Kolkata');
    assert.equal(s.byDay.length, 7);
    assert.equal(s.byDay.at(-1).date, today);
    assert.equal(s.byDay.at(-1).clicks, 1);
    assert.equal(s.byDay.at(-2).clicks, 1);
    assert.equal(s.totals.clicks, 2);
    assert.equal(s.totals.conversions, 0, "last year's conversion is outside the range");
    assert.equal(s.totals.previousPeriodClicks, 1);
    assert.equal(s.topProducts[0].clicks, 2);
    assert.equal((await t.browser().get('/api/stats')).body.clicksToday, 1);
  });

  it('exports every click in range as spreadsheet-safe CSV', async () => {
    const p = await create();
    const hostile = ['=1+1', '+SUM(A1)', '-2', '@cmd', ' =x', 'a,b', 'say "hi"', 'l1\r\nl2'];
    for (let i = 0; i < 80; i++) {
      await t.db.query(
        `INSERT INTO clicks (product_id, product_title, category, device, referrer, utm_source, destination_url) VALUES ($1, $2, $3, 'Desktop', $4, $5, 'https://www.amazon.in/x')`,
        [p.id, hostile[i % 8], hostile[(i + 1) % 8], hostile[(i + 2) % 8], hostile[(i + 3) % 8]]);
    }
    const res = await owner.get('/api/admin/analytics/export?days=30');
    assert.equal(res.status, 200);
    const rows = csvRows(res.text);
    assert.equal(rows.length, 81);
    assert.ok(rows.every(r => r.length === rows[0]!.length));
    for (const r of rows.slice(1)) for (const cell of r) assert.ok(!/^\s*[=+\-@]/.test(cell), cell);
  });

  it('bulk actions, duplicate and image cleanup when the last reference is deleted', async () => {
    const a = await create({ title: 'A' });
    const b = await create({ title: 'B', imageUrl: `https://res.cloudinary.com/${FAKE_CLOUD}/image/upload/v1/araccoon-hub/products/b`, imagePublicId: 'araccoon-hub/products/b' });
    const dup = await owner.post(`/api/admin/products/${a.id}/duplicate`);
    assert.equal(dup.body.status, 'draft');
    assert.equal((await owner.post('/api/admin/products/bulk', { ids: [a.id, b.id], action: 'archive' })).body.affected, 2);
    assert.equal((await t.browser().get('/api/products')).body.length, 0);
    t.images.destroyed.length = 0;
    await owner.del(`/api/admin/products/${a.id}`);
    assert.deepEqual(t.images.destroyed, [], 'lamp image still used by the duplicate');
    await owner.del(`/api/admin/products/${b.id}`);
    assert.deepEqual(t.images.destroyed, ['araccoon-hub/products/b']);
  });

  it('webhook: signed raw body, replay window, idempotent eventId, reference checks', async () => {
    const p = await create();
    const sign = (raw: string, ts = Math.floor(Date.now() / 1000)) => ({
      'content-type': 'application/json', 'x-webhook-timestamp': String(ts),
      'x-webhook-signature': `sha256=${crypto.createHmac('sha256', WEBHOOK_SECRET).update(`${ts}.${raw}`).digest('hex')}`,
    });
    const raw = JSON.stringify({ eventId: 'evt-1', productId: p.id, amountCents: 250 });
    const hook = (body: string, headers: Record<string, string>) => t.browser().request('POST', '/api/webhooks/conversion', { raw: body, headers, origin: null });
    const results = await Promise.all(Array.from({ length: 5 }, () => hook(raw, sign(raw))));
    assert.equal(results.filter(r => r.status === 201).length, 1);
    assert.ok(results.filter(r => r.status === 200).every(r => r.body.duplicate));
    assert.equal((await hook(raw.replace('250', '999'), sign(raw))).status, 401, 'tampered body');
    assert.equal((await hook(raw, sign(raw, Math.floor(Date.now() / 1000) - 900))).status, 401, 'stale');
    const bad = JSON.stringify({ eventId: 'evt-2', productId: crypto.randomUUID() });
    assert.equal((await hook(bad, sign(bad))).status, 422);
    const { rows } = await t.db.query('SELECT * FROM conversions');
    assert.equal(rows.length, 1);
  });

  it('analytics reset requires typing RESET and clears clicks + conversions together', async () => {
    const p = await create();
    await t.browser().get(`/r/${p.id}`);
    assert.equal((await owner.post('/api/admin/analytics/reset', { confirm: 'yes' })).status, 400);
    assert.equal((await owner.post('/api/admin/analytics/reset', { confirm: 'RESET' })).status, 200);
    assert.equal((await t.db.query('SELECT 1 FROM clicks')).rowCount, 0);
  });
});
