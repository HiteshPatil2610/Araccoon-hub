import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContext, integrationSkipReason, VALID_PRODUCT, type TestContext, type Browser } from '../support/testApp';
import { INITIAL_DATA_ID, type InitialData } from '../../shared/initialData';

function embedded(html: string): InitialData {
  const m = new RegExp(`<script type="application/json" id="${INITIAL_DATA_ID}">([\\s\\S]*?)</script>`).exec(html);
  assert.ok(m, 'page embeds initial data');
  return JSON.parse(m[1]!);
}

describe('collections', { skip: integrationSkipReason }, () => {
  let t: TestContext;
  let owner: Browser;

  before(async () => {
    mock.method(console, 'error', () => {});
    t = await createTestContext();
    owner = (await t.setupOwner()).browser;
  });
  after(async () => { mock.restoreAll(); await t?.close(); });
  beforeEach(async () => {
    await t.db.query('DELETE FROM collections');
    await t.db.query('DELETE FROM products');
  });

  const product = async (patch: Record<string, unknown> = {}) => {
    const res = await owner.post('/api/admin/products', { ...VALID_PRODUCT, ...patch });
    assert.equal(res.status, 201, res.text);
    return res.body;
  };
  const collection = async (input: Record<string, unknown>) => {
    const res = await owner.post('/api/admin/collections', input);
    assert.equal(res.status, 201, res.text);
    return res.body;
  };

  it('only owners can manage collections, and writes need the site origin', async () => {
    const visitor = t.browser();
    assert.equal((await visitor.get('/api/admin/collections')).status, 401);
    assert.equal((await visitor.post('/api/admin/collections', { title: 'Nope' })).status, 401);
    assert.equal((await owner.request('POST', '/api/admin/collections', { body: { title: 'Nope' }, origin: 'https://evil.example' })).status, 403);
    assert.equal((await owner.get('/api/admin/collections')).body.length, 0);
  });

  it('creates with a stable unique slug, validates input and keeps the chosen order', async () => {
    const a = await product({ title: 'Lamp' });
    const b = await product({ title: 'Tray' });

    const first = await collection({ title: '  Desk Upgrades!  ', productIds: [b.id, a.id] });
    assert.equal(first.slug, 'desk-upgrades');
    assert.equal(first.title, 'Desk Upgrades!');
    assert.equal(first.status, 'draft');
    assert.deepEqual(first.productIds, [b.id, a.id]);
    assert.equal((await collection({ title: 'Desk upgrades' })).slug, 'desk-upgrades-2');
    assert.equal((await collection({ title: '日本語' })).slug, 'collection');

    for (const [bad, field] of [
      [{ title: '' }, 'title'],
      [{ title: 'x'.repeat(81) }, 'title'],
      [{ title: 'T', description: 'x'.repeat(301) }, 'description'],
      [{ title: 'T', status: 'archived' }, 'status'],
      [{ title: 'T', productIds: [a.id, a.id] }, 'productIds'],
      [{ title: 'T', productIds: ['not-an-id'] }, 'productIds'],
      [{ title: 'T', productIds: ['00000000-0000-4000-8000-000000000000'] }, 'productIds'],
    ] as const) {
      const res = await owner.post('/api/admin/collections', bad);
      assert.equal(res.status, 400, `${field}: ${res.text}`);
      assert.ok(res.body.fields[field] || Object.keys(res.body.fields).some(k => k.startsWith(field)), `${field}: ${res.text}`);
    }
    assert.equal((await owner.post('/api/admin/collections', { title: 'T', slug: 'mine' })).status, 400, 'unknown fields are refused');
    assert.equal((await owner.get('/api/admin/collections')).body.length, 3, 'failed creates leave nothing behind');

    // Renaming keeps the address; editing one field leaves the rest alone.
    const renamed = await owner.patch(`/api/admin/collections/${first.id}`, { title: 'Desk kit' });
    assert.equal(renamed.status, 200, renamed.text);
    assert.equal(renamed.body.slug, 'desk-upgrades');
    assert.deepEqual(renamed.body.productIds, [b.id, a.id]);
    const reordered = await owner.patch(`/api/admin/collections/${first.id}`, { productIds: [a.id, b.id] });
    assert.deepEqual(reordered.body.productIds, [a.id, b.id]);
    assert.equal(reordered.body.title, 'Desk kit');
    const broken = await owner.patch(`/api/admin/collections/${first.id}`, { productIds: [a.id, '00000000-0000-4000-8000-000000000000'] });
    assert.equal(broken.status, 400);
    assert.deepEqual((await owner.get('/api/admin/collections')).body.find((c: any) => c.id === first.id).productIds, [a.id, b.id], 'a refused edit changes nothing');

    assert.equal((await owner.patch('/api/admin/collections/not-an-id', { title: 'X' })).status, 404);
    assert.equal((await owner.del(`/api/admin/collections/${first.id}`)).status, 200);
    assert.equal((await owner.del(`/api/admin/collections/${first.id}`)).status, 404);
    assert.equal((await owner.get('/api/admin/products')).body.length, 2, 'deleting a collection keeps its finds');
    const actions = (await owner.get('/api/admin/activity')).body.map((e: any) => e.action);
    for (const action of ['collection.create', 'collection.update', 'collection.delete']) assert.ok(actions.includes(action), action);
  });

  it('shows visitors only published collections with published finds, without affiliate URLs', async () => {
    const live = await product({ title: 'Lamp' });
    const draft = await product({ title: 'Secret draft', status: 'draft' });
    const second = await product({ title: 'Tray' });
    const shown = await collection({ title: 'Desk upgrades', description: 'Small <b>fixes</b>.', status: 'published', sortOrder: 2, productIds: [draft.id, second.id, live.id] });
    await collection({ title: 'Hidden draft list', productIds: [live.id] });
    await collection({ title: 'Only drafts inside', status: 'published', productIds: [draft.id] });
    await collection({ title: 'Empty', status: 'published' });
    const earlier = await collection({ title: 'First up', status: 'published', sortOrder: 1, productIds: [live.id] });

    const list = await t.browser().get('/api/collections');
    assert.equal(list.status, 200);
    assert.deepEqual(list.body.map((c: any) => c.slug), [earlier.slug, shown.slug]);
    assert.equal(list.body[1].productCount, 2);
    assert.equal(list.body[1].coverImageUrl, second.imageUrl);
    assert.ok(!('updatedAt' in list.body[1]));

    const one = await t.browser().get(`/api/collections/${shown.slug}`);
    assert.equal(one.status, 200);
    assert.deepEqual(one.body.products.map((p: any) => p.title), ['Tray', 'Lamp']);
    assert.ok(!('affiliateUrl' in one.body.products[0]));
    assert.ok(!one.text.includes('Secret draft'));
    for (const slug of ['hidden-draft-list', 'only-drafts-inside', 'empty', 'no-such', 'UPPER', "x' OR 1=1", 'a'.repeat(200)]) {
      assert.equal((await t.browser().get(`/api/collections/${encodeURIComponent(slug)}`)).status, 404, slug);
    }

    // Removing a find from the store removes it from its collections.
    assert.equal((await owner.post('/api/admin/products/bulk', { ids: [second.id], action: 'delete' })).status, 200);
    assert.deepEqual((await t.browser().get(`/api/collections/${shown.slug}`)).body.products.map((p: any) => p.title), ['Lamp']);
  });

  it('renders a collection page, lists collections on the home page and in the sitemap', async () => {
    const lamp = await product({ title: 'Lamp' });
    const shown = await collection({ title: 'Desk <i>upgrades</i>', description: 'Small "fixes" & finds.', status: 'published', productIds: [lamp.id] });
    const hidden = await collection({ title: 'Hidden draft list', productIds: [lamp.id] });

    const res = await t.browser().get(`/collections/${shown.slug}?utm_source=share`);
    assert.equal(res.status, 200);
    const html = res.text;
    assert.equal((html.match(/<title>/g) ?? []).length, 1);
    assert.ok(html.includes('<title>Desk &lt;i&gt;upgrades&lt;/i&gt; — Raccoon Hub</title>'));
    assert.ok(html.includes(`<link rel="canonical" href="http://localhost/collections/${shown.slug}">`));
    assert.ok(html.includes('<meta name="description" content="Small &quot;fixes&quot; &amp; finds.">'));
    assert.ok(html.includes(`<meta property="og:image" content="${lamp.imageUrl}">`));
    assert.match(html, /"@type":"CollectionPage"/);
    assert.ok(!html.includes('<i>upgrades</i>'), 'owner text is escaped');
    assert.ok(!html.includes('amazon.in/dp'), 'no affiliate URL in the page');
    assert.equal((html.match(/<\/script>/g) ?? []).length, (html.match(/<script/g) ?? []).length);
    const data = embedded(html);
    assert.equal(data.collection?.slug, shown.slug);
    assert.deepEqual(data.collection?.products.map(p => p.id), [lamp.id]);

    for (const gone of [`/collections/${hidden.slug}`, '/collections/no-such', '/collections/UPPER', `/collections/${'a'.repeat(200)}`]) {
      const missing = await t.browser().get(gone);
      assert.equal(missing.status, 404, gone);
      assert.match(missing.text, /<meta name="robots" content="noindex">/);
      assert.ok(!missing.text.includes('Hidden draft list'));
    }

    const home = await t.browser().get('/');
    assert.deepEqual(embedded(home.text).collections?.map(c => c.slug), [shown.slug]);
    assert.ok(home.text.includes(`<a href="/collections/${shown.slug}">Desk &lt;i&gt;upgrades&lt;/i&gt;</a>`));

    const sitemap = await t.browser().get('/sitemap.xml');
    assert.ok(sitemap.text.includes(`<loc>http://localhost/collections/${shown.slug}</loc>`));
    assert.ok(!sitemap.text.includes(hidden.slug));
  });
});
