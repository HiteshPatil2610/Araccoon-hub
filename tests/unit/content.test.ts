import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ArticleError, loadArticles, parseArticle, parseFrontMatter } from '../../scripts/articles';
import { DEFAULT_SITE_TEXT, SITE_TEXT_FIELDS, mergeSiteText, siteTextPatchSchema } from '../../shared/siteText';
import { serializeInitialData } from '../../shared/initialData';
import { renderPage } from '../../worker/lib/html';
import { PAGE_HEADERS } from '../../worker/lib/pageHeaders';

const article = (front: string, body = 'Hello there.') => `---\n${front}\n---\n\n${body}\n`;
const BASE = 'title: A title\ndescription: A description.\ndate: 2026-11-03';

describe('articles', () => {
  it('parses front matter, lists and Markdown into safe HTML', () => {
    const a = parseArticle('desk-picks', article(`${BASE}\nproducts:\n  - 3F1C2A9E-1111-4B6A-9C3D-123456789ABC\nupdated: 2026-11-05`,
      '## Why\n\nSome **bold** text and <script>alert(1)</script>.\n\n![A lamp on a desk](/art/lamp.webp "The lamp")\n\n[More](/articles)'));
    assert.equal(a.title, 'A title');
    assert.equal(a.updated, '2026-11-05');
    assert.deepEqual(a.products, ['3f1c2a9e-1111-4b6a-9c3d-123456789abc']);
    assert.match(a.html, /<h2>Why<\/h2>/);
    assert.match(a.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.ok(!a.html.includes('<script'));
    assert.match(a.html, /<figure><img src="\/art\/lamp.webp" alt="A lamp on a desk" loading="lazy" decoding="async"><figcaption>The lamp<\/figcaption><\/figure>/);
    assert.equal(a.draft, false);
  });

  it('accepts inline lists and quoted values', () => {
    const { front } = parseFrontMatter(article(`title: "Quoted: yes"\nproducts: [a, 'b']`));
    assert.equal(front.title, 'Quoted: yes');
    assert.deepEqual(front.products, ['a', 'b']);
  });

  const rejects = (slug: string, source: string, pattern: RegExp) =>
    assert.throws(() => parseArticle(slug, source), (e: unknown) => e instanceof ArticleError && pattern.test(e.message));

  it('rejects content that would break the site or skip tracked links', () => {
    rejects('Bad Name', article(BASE), /lowercase words/);
    rejects('ok', article('title: Only a title'), /needs "description"/);
    rejects('ok', article(`${BASE}\nauthor: me`), /Unknown front matter field "author"/);
    rejects('ok', article(BASE.replace('2026-11-03', '03/11/2026')), /must be a date/);
    rejects('ok', article(`${BASE}\nproducts: [not-an-id]`), /not a product id/);
    rejects('ok', article(BASE, '# Second title'), /Use "##"/);
    rejects('ok', article(BASE, '![](/art/x.webp)'), /needs alt text/);
    rejects('ok', article(BASE, '[Buy](https://www.amazon.in/dp/B0TEST0001)'), /goes straight to Amazon/);
    rejects('ok', article(BASE, '[Buy](https://amzn.to/3abc)'), /goes straight to Amazon/);
    rejects('ok', article(BASE, '[x](javascript:alert(1))'), /must use https/);
    rejects('ok', article(`${BASE}\nimage: /art/x.webp`), /imageAlt/);
    rejects('ok', article(BASE, ''), /no text/);
  });

  it('keeps drafts out unless asked, newest first', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'articles-'));
    try {
      fs.writeFileSync(`${dir}/older.md`, article(BASE.replace('2026-11-03', '2026-01-01')));
      fs.writeFileSync(`${dir}/newer.md`, article(BASE));
      fs.writeFileSync(`${dir}/wip.md`, article(`${BASE}\ndraft: true`));
      fs.writeFileSync(`${dir}/_template.md`, 'ignored');
      fs.writeFileSync(`${dir}/README.md`, 'ignored');
      assert.deepEqual(loadArticles({ dir }).map(a => a.slug), ['newer', 'older']);
      assert.deepEqual(loadArticles({ dir, drafts: true }).map(a => a.slug), ['newer', 'wip', 'older']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('every article in content/articles compiles', () => {
    assert.doesNotThrow(() => loadArticles({ drafts: true }));
  });
});

describe('site text', () => {
  it('falls back to defaults for missing, blank and unknown keys', () => {
    const merged = mergeSiteText({ heroBlurb: 'Custom', footerNote: '  ', bogus: 'x' });
    assert.equal(merged.heroBlurb, 'Custom');
    assert.equal(merged.footerNote, DEFAULT_SITE_TEXT.footerNote);
    assert.ok(!('bogus' in merged));
  });

  it('validates lengths, one-line text, nulls and unknown keys', () => {
    assert.equal(siteTextPatchSchema.parse({ seoTitle: '  Hi  ' }).seoTitle, 'Hi');
    assert.equal(siteTextPatchSchema.parse({ seoTitle: null }).seoTitle, null);
    assert.ok(!siteTextPatchSchema.safeParse({ seoTitle: 'x'.repeat(SITE_TEXT_FIELDS.seoTitle.max + 1) }).success);
    assert.ok(!siteTextPatchSchema.safeParse({ footerIdea: 'a\tb' }).success);
    assert.ok(!siteTextPatchSchema.safeParse({ nope: 'x' }).success);
  });

  it('every default fits its own limit', () => {
    for (const [key, f] of Object.entries(SITE_TEXT_FIELDS)) assert.ok(f.default.length <= f.max, key);
  });
});

describe('page rendering', () => {
  const template = '<html><head><meta name="description" content="old"><title>Old</title></head><body><div id="root"></div></body></html>';
  const meta = { title: 'T <1>', description: 'D', url: 'https://x.test/', image: 'https://x.test/og.jpg', imageAlt: 'A', type: 'website' as const };

  it('replaces the static title and description and adds the fallback once', () => {
    const html = renderPage(template, meta, {}, '<p>fallback</p>');
    assert.equal((html.match(/<title>/g) ?? []).length, 1);
    assert.match(html, /<title>T &lt;1&gt;<\/title>/);
    assert.ok(!html.includes('content="old"'));
    assert.match(html, /<div id="root"><\/div>\s*<noscript><div class="noscript-page"><p>fallback<\/p><\/div><\/noscript>/);
  });

  it('embeds data that cannot close its script element', () => {
    const json = serializeInitialData({ siteText: { ...DEFAULT_SITE_TEXT, heroBlurb: '</script><!-- ' + String.fromCharCode(0x2028) + ' & done' } });
    assert.ok(!new RegExp('[<>&' + String.fromCharCode(0x2028) + ']').test(json));
    assert.equal(JSON.parse(json).siteText.heroBlurb, '</script><!-- ' + String.fromCharCode(0x2028) + ' & done');
  });

  it('page headers match public/_headers', () => {
    const file = fs.readFileSync(new URL('../../public/_headers', import.meta.url), 'utf8');
    for (const [name, value] of Object.entries(PAGE_HEADERS)) {
      assert.ok(file.includes(`  ${name}: ${value}\n`) || file.includes(`  ${name}: ${value}\r\n`), `${name} differs from public/_headers`);
    }
  });
});
