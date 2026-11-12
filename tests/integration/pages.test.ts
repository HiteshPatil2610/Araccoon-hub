import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContext, integrationSkipReason, VALID_PRODUCT, type TestContext, type Browser } from '../support/testApp';
import { INITIAL_DATA_ID, type InitialData } from '../../shared/initialData';
import { DEFAULT_SITE_TEXT } from '../../shared/siteText';
import { ARTICLES } from '../../shared/generated/articles';

function embedded(html: string): InitialData {
  const m = new RegExp(`<script type="application/json" id="${INITIAL_DATA_ID}">([\\s\\S]*?)</script>`).exec(html);
  assert.ok(m, 'page embeds initial data');
  return JSON.parse(m[1]!);
}

describe('site text and Worker-rendered pages', { skip: integrationSkipReason }, () => {
  let t: TestContext;
  let owner: Browser;

  before(async () => {
    mock.method(console, 'error', () => {});
    t = await createTestContext();
    owner = (await t.setupOwner()).browser;
  });
  after(async () => { mock.restoreAll(); await t?.close(); });
  beforeEach(async () => {
    await t.db.query('DELETE FROM site_text');
    await t.db.query('DELETE FROM products');
  });

  it('only owners can read or change site text, and writes need the site origin', async () => {
    const visitor = t.browser();
    assert.equal((await visitor.get('/api/admin/site-text')).status, 401);
    assert.equal((await visitor.request('PUT', '/api/admin/site-text', { body: { heroBlurb: 'Hacked' } })).status, 401);
    const crossSite = await owner.request('PUT', '/api/admin/site-text', { body: { heroBlurb: 'Hi' }, origin: 'https://evil.example' });
    assert.equal(crossSite.status, 403);
    assert.deepEqual((await t.db.query('SELECT * FROM site_text')).rows, []);
  });

  it('saves, validates, audits and resets site text', async () => {
    const start = await owner.get('/api/admin/site-text');
    assert.equal(start.status, 200, start.text);
    assert.deepEqual(start.body.values, DEFAULT_SITE_TEXT);
    assert.deepEqual(start.body.customized, []);

    for (const bad of [{ heroBlurb: 'x'.repeat(221) }, { heroBlurb: '   ' }, { heroBlurb: 'two\nlines' }, { unknownKey: 'x' }]) {
      const res = await owner.request('PUT', '/api/admin/site-text', { body: bad });
      assert.equal(res.status, 400, JSON.stringify(bad));
    }

    const saved = await owner.request('PUT', '/api/admin/site-text', { body: { heroBlurb: '  New hero text.  ', seoTitle: 'Raccoon Hub — fresh finds' } });
    assert.equal(saved.status, 200, saved.text);
    assert.equal(saved.body.values.heroBlurb, 'New hero text.');
    assert.deepEqual([...saved.body.customized].sort(), ['heroBlurb', 'seoTitle']);
    assert.equal((await t.browser().get('/api/site-text')).body.heroBlurb, 'New hero text.');

    const audit = await t.db.query<{ target: string }>(`SELECT target FROM audit_events WHERE action = 'site_text.update'`);
    assert.equal(audit.rows.length, 1);
    assert.match(audit.rows[0]!.target, /heroBlurb/);

    const reset = await owner.request('PUT', '/api/admin/site-text', { body: { heroBlurb: null } });
    assert.equal(reset.status, 200, reset.text);
    assert.equal(reset.body.values.heroBlurb, DEFAULT_SITE_TEXT.heroBlurb);
    assert.deepEqual(reset.body.customized, ['seoTitle']);

    assert.equal((await owner.request('PUT', '/api/admin/site-text', { body: { announcementLink: 'javascript:alert(1)' } })).status, 400);
    const shown = await owner.request('PUT', '/api/admin/site-text', { body: { announcement: 'Prime Day picks are live', announcementLink: '/articles' } });
    assert.equal(shown.status, 200, shown.text);
    assert.equal((await t.browser().get('/api/site-text')).body.announcement, 'Prime Day picks are live');
    const cleared = await owner.request('PUT', '/api/admin/site-text', { body: { announcement: '', announcementLink: '' } });
    assert.equal(cleared.status, 200, cleared.text);
    assert.equal(cleared.body.values.announcement, '');
    assert.deepEqual(cleared.body.customized, ['seoTitle']);
  });

  it('renders the home page with its title, share tags, page headers and the published catalog', async () => {
    await owner.request('PUT', '/api/admin/site-text', { body: { seoTitle: 'Finds & "oddities" <today>', seoDescription: 'Hand-picked.' } });
    const live = await owner.post('/api/admin/products', { ...VALID_PRODUCT, title: 'Lamp </script><script>alert(1)</script>' });
    assert.equal(live.status, 201, live.text);
    const draft = await owner.post('/api/admin/products', { ...VALID_PRODUCT, title: 'Secret draft', status: 'draft' });
    assert.equal(draft.status, 201, draft.text);

    const res = await t.browser().get('/?category=Desk%20%26%20Office');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /^text\/html/);
    assert.match(res.headers.get('content-security-policy') ?? '', /script-src 'self' https:\/\/challenges\.cloudflare\.com/);
    assert.equal(res.headers.get('x-page-cache'), 'MISS');

    const html = res.text;
    assert.equal((html.match(/<title>/g) ?? []).length, 1);
    assert.match(html, /<title>Finds &amp; &quot;oddities&quot; &lt;today&gt;<\/title>/);
    assert.ok(!html.includes('static description'));
    assert.match(html, /<link rel="canonical" href="http:\/\/localhost\/">/);
    assert.match(html, /<meta property="og:image" content="http:\/\/localhost\/og-image\.jpg">/);
    assert.match(html, /<meta name="robots" content="noindex">/, 'non-production pages stay out of search');
    assert.match(html, /application\/ld\+json/);
    assert.match(html, /<noscript>/);

    // The product title cannot break out of the embedded JSON.
    assert.equal((html.match(/<\/script>/g) ?? []).length, (html.match(/<script/g) ?? []).length);
    const data = embedded(html);
    assert.equal(data.siteText?.seoTitle, 'Finds & "oddities" <today>');
    assert.deepEqual(data.products?.map(p => p.title), ['Lamp </script><script>alert(1)</script>']);
    assert.ok(!('affiliateUrl' in (data.products?.[0] ?? {})), 'visitors never see affiliate URLs');
  });

  it('serves articles, a 404 for unknown ones, robots.txt and the sitemap', async () => {
    const list = await t.browser().get('/articles');
    assert.equal(list.status, 200);
    assert.match(list.text, /<title>Journal — Raccoon Hub<\/title>/);

    const first = ARTICLES[0];
    if (first) {
      const page = await t.browser().get(`/articles/${first.slug}`);
      assert.equal(page.status, 200);
      assert.match(page.text, /<meta property="og:type" content="article">/);
      assert.match(page.text, /"@type":"BlogPosting"/);
    }

    const missing = await t.browser().get('/articles/no-such-article');
    assert.equal(missing.status, 404);
    assert.match(missing.text, /<meta name="robots" content="noindex">/);

    const robots = await t.browser().get('/robots.txt');
    assert.equal(robots.status, 200);
    assert.match(robots.text, /Disallow: \//, 'test and dev sites block crawlers');

    const sitemap = await t.browser().get('/sitemap.xml');
    assert.equal(sitemap.status, 200);
    assert.match(sitemap.headers.get('content-type') ?? '', /application\/xml/);
    assert.match(sitemap.text, /<loc>http:\/\/localhost\/articles<\/loc>/);
    for (const a of ARTICLES.filter(x => !x.draft)) assert.ok(sitemap.text.includes(`/articles/${a.slug}</loc>`), a.slug);
  });
});
