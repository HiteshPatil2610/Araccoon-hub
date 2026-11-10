import { Hono } from 'hono';
import { ipKey, limit, type AppEnv, type Ctx } from '../app';
import { listProducts, toPublic } from '../repo/products';
import { getSiteText } from '../repo/siteText';
import { escapeHtml, renderPage, type PageMeta } from '../lib/html';
import { ARTICLES } from '../../shared/generated/articles';
import { articlePath, formatArticleDate, type Article } from '../../shared/articles';
import { DEFAULT_SITE_TEXT, type SiteText } from '../../shared/siteText';
import { findBySlug, findPath } from '../../shared/finds';
import { COLLECTION_SLUG, collectionPath, type CollectionSummary, type PublicCollection } from '../../shared/collections';
import { getPublicCollection, listPublicCollections } from '../repo/collections';
import { formatProductCopy } from '../../shared/productCopy';
import type { PublicProduct } from '../../shared/types';

// Public pages are served by the Worker (see run_worker_first in wrangler.jsonc)
// so their first HTML already carries the real title, description, share
// tags, structured data and the data the page needs. The React app then
// renders from that data without waiting on the API.

export const SHARE_IMAGE = '/og-image.jpg';
const SHARE_IMAGE_ALT = 'Raccoon Hub: the raccoon mascot in a hoodie and headphones, arms crossed, beside the words Raccoon Hub';
// The home page's largest first-screen image (the same file Cutout name="hero" renders).
const HERO_ART = '/art/video-concept/raccoon-hero-crossed-arms.webp';
const PAGE_TTL_SECONDS = 60;

export const pageRoutes = new Hono<AppEnv>();

/** The site's public origin: the configured passkey origin (verified https) in production, else wherever it is running. */
const siteOrigin = (c: Ctx) => new URL(c.get('deps').config.environment === 'production' ? c.get('deps').config.passkey.origin : c.req.url).origin;
const absolute = (c: Ctx, path: string) => (/^https:\/\//.test(path) ? path : `${siteOrigin(c)}${path}`);
const isProduction = (c: Ctx) => c.get('deps').config.environment === 'production';

let templateCache: string | null = null;

async function template(c: Ctx): Promise<string> {
  if (templateCache) return templateCache;
  const { assets } = c.get('deps');
  if (!assets) throw new Error('The ASSETS binding is not configured.');
  const res = await assets.fetch(new Request(new URL('/', c.req.url)));
  if (!res.ok) throw new Error(`index.html could not be loaded (${res.status}).`);
  const html = await res.text();
  if (isProduction(c)) templateCache = html; // fixed per deploy; dev keeps Vite's live version
  return html;
}

export function resetPageTemplateCache() {
  templateCache = null;
}

type Rendered = { status: 200 | 404; meta: PageMeta; data: { siteText: SiteText; products?: PublicProduct[]; collections?: CollectionSummary[]; collection?: PublicCollection }; noscript: string; cacheable: boolean };

/** Serves a page from the edge cache, or renders and caches it. Query strings never vary the HTML. */
async function servePage(c: Ctx, render: () => Promise<Rendered>) {
  const { pageCache } = c.get('deps');
  const key = new Request(new URL(c.req.path, siteOrigin(c)).toString());
  const hit = await pageCache?.match(key);
  if (hit) {
    const res = new Response(hit.body, hit);
    res.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    res.headers.set('X-Page-Cache', 'HIT');
    return res;
  }

  await limit(c, 'page', ipKey(c), 300, 60, true);
  const page = await render();
  let html: string;
  try {
    html = renderPage(await template(c), page.meta, page.data, page.noscript);
  } catch (err) {
    console.error(`[${c.get('correlationId')}] page template unavailable: ${err instanceof Error ? err.message : err}`);
    return c.html('<!doctype html><meta charset="utf-8"><title>Raccoon Hub</title><p>The site is briefly unavailable. Please try again in a moment.</p>', 503, { 'Retry-After': '30', 'Cache-Control': 'no-store' });
  }
  const res = new Response(html, {
    status: page.status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate', 'X-Page-Cache': 'MISS' },
  });
  if (pageCache && page.cacheable && page.status === 200) {
    const stored = res.clone();
    stored.headers.set('Cache-Control', `public, max-age=${PAGE_TTL_SECONDS}`);
    const put = pageCache.put(key, stored).catch(err => console.error(`[${c.get('correlationId')}] page cache put failed: ${err}`));
    try { c.executionCtx.waitUntil(put); } catch { await put; }
  }
  return res;
}

/** Site text and catalog; a database outage still renders the page (with defaults, uncached). */
async function loadData(c: Ctx, withProducts: boolean, withCollections = false): Promise<{ siteText: SiteText; products: PublicProduct[] | null; collections: CollectionSummary[] | null; ok: boolean }> {
  try {
    const db = c.get('db');
    const [siteText, rows, collections] = await Promise.all([
      getSiteText(db),
      withProducts ? listProducts(db, { statuses: ['published'] }) : Promise.resolve(null),
      withCollections ? listPublicCollections(db) : Promise.resolve(null),
    ]);
    return { siteText, products: rows ? rows.map(toPublic) : null, collections: collections ? collections.map(({ updatedAt: _updatedAt, ...summary }) => summary) : null, ok: true };
  } catch (err) {
    console.error(`[${c.get('correlationId')}] page data unavailable: ${err instanceof Error ? err.message : err}`);
    return { siteText: DEFAULT_SITE_TEXT, products: null, collections: null, ok: false };
  }
}

const organization = (c: Ctx) => ({ '@type': 'Organization', name: 'Raccoon Hub', url: `${siteOrigin(c)}/`, logo: absolute(c, '/favicon.svg') });

pageRoutes.get('/', (c) => servePage(c, async () => {
  const { siteText, products, collections, ok } = await loadData(c, true, true);
  const list = (products ?? []).slice(0, 60);
  return {
    status: 200,
    cacheable: ok,
    meta: {
      title: siteText.seoTitle,
      description: siteText.seoDescription,
      url: `${siteOrigin(c)}/`,
      image: absolute(c, SHARE_IMAGE),
      imageAlt: SHARE_IMAGE_ALT,
      type: 'website',
      noindex: !isProduction(c),
      preloadImage: HERO_ART,
      jsonLd: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Raccoon Hub', url: `${siteOrigin(c)}/`, description: siteText.seoDescription, publisher: organization(c) }],
    },
    data: products ? { siteText, products, collections: collections ?? [] } : { siteText },
    noscript: [
      `<h1>Raccoon Hub</h1>`,
      `<p>${escapeHtml(siteText.heroBlurb)}</p>`,
      list.length ? `<h2>The current finds</h2><ul>${list.map(p => `<li><strong>${escapeHtml(p.title)}</strong> — ${escapeHtml(p.category)}</li>`).join('')}</ul>` : '',
      collections?.length ? `<h2>Collections</h2><ul>${collections.map(col => `<li><a href="${collectionPath(col.slug)}">${escapeHtml(col.title)}</a></li>`).join('')}</ul>` : '',
      `<p>Turn on JavaScript to browse the finds and open them on Amazon. <a href="/articles">Read the journal</a>.</p>`,
      `<p>As an Amazon Associate I earn from qualifying purchases.</p>`,
    ].join(''),
  };
}));

/** One line of plain text for a description tag: the first `max` characters, cut at a word. */
function summary(text: string, max = 200): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length)}…`;
}

// A find's own address. The page is the storefront (same embedded catalog) and the
// app opens that find's quick view; only the head tags and the noscript text differ.
pageRoutes.get('/find/:slug', (c) => servePage(c, async () => {
  const { siteText, products, collections, ok } = await loadData(c, true, true);
  const find = products ? findBySlug(products, c.req.param('slug')) : null;
  const data = products ? { siteText, products, collections: collections ?? [] } : { siteText };
  if (!find) {
    return {
      status: 404, cacheable: false, data,
      meta: { title: 'Find not available — Raccoon Hub', description: 'This find is no longer on Raccoon Hub.', url: `${siteOrigin(c)}/`, image: absolute(c, SHARE_IMAGE), imageAlt: SHARE_IMAGE_ALT, type: 'website', noindex: true },
      noscript: '<h1>This find is no longer available</h1><p><a href="/">See the current finds</a></p>',
    };
  }
  const copy = formatProductCopy(find.title, find.description);
  const description = summary(find.pickNote || copy.description || siteText.seoDescription);
  const url = `${siteOrigin(c)}${findPath({ id: find.id, title: copy.title })}`;
  return {
    status: 200,
    cacheable: ok,
    meta: {
      title: `${copy.title} — Raccoon Hub`, description, url, image: find.imageUrl, imageAlt: copy.title, type: 'website', noindex: !isProduction(c),
      jsonLd: [{ '@context': 'https://schema.org', '@type': 'WebPage', name: copy.title, description, url, primaryImageOfPage: find.imageUrl, isPartOf: { '@type': 'WebSite', name: 'Raccoon Hub', url: `${siteOrigin(c)}/` } }],
    },
    data,
    noscript: [
      `<h1>${escapeHtml(copy.title)}</h1>`,
      `<p>${escapeHtml(find.category)}</p>`,
      find.pickNote ? `<p><strong>Why we picked it:</strong> ${escapeHtml(find.pickNote)}</p>` : '',
      copy.description ? `<p>${escapeHtml(copy.description)}</p>` : '',
      `<p><a href="/r/${find.id}" rel="nofollow sponsored">View on Amazon</a> · <a href="/">See all finds</a></p>`,
      `<p>As an Amazon Associate I earn from qualifying purchases.</p>`,
    ].join(''),
  };
}));

// A collection's own page: its title, description and finds, with the first find's image for link previews.
pageRoutes.get('/collections/:slug', (c) => servePage(c, async () => {
  const slug = c.req.param('slug');
  let siteText = DEFAULT_SITE_TEXT;
  let found: Awaited<ReturnType<typeof getPublicCollection>>;
  let ok = true;
  try {
    const db = c.get('db');
    [siteText, found] = await Promise.all([getSiteText(db), slug.length <= 70 && COLLECTION_SLUG.test(slug) ? getPublicCollection(db, slug) : Promise.resolve(undefined)]);
  } catch (err) {
    console.error(`[${c.get('correlationId')}] page data unavailable: ${err instanceof Error ? err.message : err}`);
    ok = false;
  }
  if (!ok) {
    // The database is down: let the app try the API rather than claim the collection is gone.
    return {
      status: 200, cacheable: false, data: { siteText },
      meta: { title: 'Collection — Raccoon Hub', description: siteText.seoDescription, url: `${siteOrigin(c)}${collectionPath(slug)}`, image: absolute(c, SHARE_IMAGE), imageAlt: SHARE_IMAGE_ALT, type: 'website', noindex: true },
      noscript: '<h1>Collection</h1><p>This page is briefly unavailable. <a href="/">See the current finds</a></p>',
    };
  }
  if (!found) {
    return {
      status: 404, cacheable: false, data: { siteText },
      meta: { title: 'Collection not available — Raccoon Hub', description: 'This collection is not on Raccoon Hub.', url: `${siteOrigin(c)}/`, image: absolute(c, SHARE_IMAGE), imageAlt: SHARE_IMAGE_ALT, type: 'website', noindex: true },
      noscript: '<h1>This collection is not available</h1><p><a href="/">See the current finds</a></p>',
    };
  }
  const collection: PublicCollection = { ...found.summary, products: found.products.map(toPublic) };
  const names = collection.products.map(p => formatProductCopy(p.title, p.description).title);
  const description = summary(collection.description || `${collection.productCount} hand-picked finds: ${names.join(', ')}.`);
  const url = `${siteOrigin(c)}${collectionPath(collection.slug)}`;
  const cover = collection.coverImageUrl;
  return {
    status: 200,
    cacheable: true,
    meta: {
      title: `${collection.title} — Raccoon Hub`, description, url, image: cover ?? absolute(c, SHARE_IMAGE), imageAlt: cover ? `${collection.title}: ${names[0]}` : SHARE_IMAGE_ALT, type: 'website', noindex: !isProduction(c),
      jsonLd: [{
        '@context': 'https://schema.org', '@type': 'CollectionPage', name: collection.title, description, url,
        isPartOf: { '@type': 'WebSite', name: 'Raccoon Hub', url: `${siteOrigin(c)}/` },
        mainEntity: { '@type': 'ItemList', numberOfItems: collection.productCount, itemListElement: collection.products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: names[i], url: absolute(c, findPath({ id: p.id, title: names[i]! })) })) },
      }],
    },
    data: { siteText, collection },
    noscript: [
      `<h1>${escapeHtml(collection.title)}</h1>`,
      collection.description ? `<p>${escapeHtml(collection.description)}</p>` : '',
      `<ul>${collection.products.map((p, i) => `<li><a href="${findPath({ id: p.id, title: names[i]! })}">${escapeHtml(names[i]!)}</a> — ${escapeHtml(p.category)}</li>`).join('')}</ul>`,
      `<p><a href="/">See all finds</a></p>`,
      `<p>As an Amazon Associate I earn from qualifying purchases.</p>`,
    ].join(''),
  };
}));

pageRoutes.get('/articles', (c) => servePage(c, async () => {
  const { siteText } = await loadData(c, false);
  const title = 'Journal — Raccoon Hub';
  const description = 'Roundups, notes from use and small-upgrade ideas from Raccoon Hub.';
  return {
    status: 200,
    cacheable: true,
    meta: {
      title, description, url: `${siteOrigin(c)}/articles`, image: absolute(c, SHARE_IMAGE), imageAlt: SHARE_IMAGE_ALT, type: 'website', noindex: !isProduction(c),
      jsonLd: [{
        '@context': 'https://schema.org', '@type': 'Blog', name: 'Raccoon Hub journal', url: `${siteOrigin(c)}/articles`, publisher: organization(c),
        blogPost: ARTICLES.map(a => ({ '@type': 'BlogPosting', headline: a.title, url: absolute(c, articlePath(a.slug)), datePublished: a.date })),
      }],
    },
    data: { siteText },
    noscript: `<h1>Journal</h1><ul>${ARTICLES.map(a => `<li><a href="${articlePath(a.slug)}">${escapeHtml(a.title)}</a> — ${escapeHtml(a.description)}</li>`).join('')}</ul>`,
  };
}));

pageRoutes.get('/articles/:slug', (c) => servePage(c, async () => {
  const article = ARTICLES.find(a => a.slug === c.req.param('slug'));
  const { siteText, products, ok } = await loadData(c, !!article?.products.length);
  if (!article) {
    return {
      status: 404, cacheable: false, data: { siteText },
      meta: { title: 'Not found — Raccoon Hub', description: 'This page does not exist.', url: `${siteOrigin(c)}${c.req.path}`, image: absolute(c, SHARE_IMAGE), imageAlt: SHARE_IMAGE_ALT, type: 'website', noindex: true },
      noscript: '<h1>Nothing here</h1><p><a href="/articles">See all articles</a></p>',
    };
  }
  const wanted = new Set(article.products);
  const featured = products?.filter(p => wanted.has(p.id.toLowerCase()));
  return {
    status: 200,
    cacheable: ok,
    meta: articleMeta(c, article),
    data: featured ? { siteText, products: featured } : { siteText },
    noscript: `<article><h1>${escapeHtml(article.title)}</h1><p>${formatArticleDate(article.date)}</p>${article.html}</article>`,
  };
}));

function articleMeta(c: Ctx, a: Article): PageMeta {
  const url = absolute(c, articlePath(a.slug));
  const image = absolute(c, a.image ?? SHARE_IMAGE);
  return {
    title: `${a.title} — Raccoon Hub`, description: a.description, url, image, imageAlt: a.image ? a.imageAlt : SHARE_IMAGE_ALT,
    type: 'article', noindex: a.draft || !isProduction(c),
    publishedTime: a.date, modifiedTime: a.updated ?? undefined,
    jsonLd: [{
      '@context': 'https://schema.org', '@type': 'BlogPosting', headline: a.title, description: a.description,
      datePublished: a.date, dateModified: a.updated ?? a.date, image, url, mainEntityOfPage: url,
      author: organization(c), publisher: organization(c),
    }],
  };
}

pageRoutes.get('/robots.txt', (c) => {
  c.header('Cache-Control', 'public, max-age=3600');
  if (!isProduction(c)) return c.text('# Not the live site: keep it out of search results.\nUser-agent: *\nDisallow: /\n');
  return c.text([
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /r/',
    '',
    `Sitemap: ${siteOrigin(c)}/sitemap.xml`,
    '',
  ].join('\n'));
});

pageRoutes.get('/sitemap.xml', async (c) => {
  // Finds are listed when the database answers; an outage still serves the rest of the sitemap.
  let finds: { loc: string; lastmod: string | undefined }[] = [];
  try {
    const [rows, collections] = await Promise.all([listProducts(c.get('db'), { statuses: ['published'] }), listPublicCollections(c.get('db'))]);
    finds = collections.map(col => ({ loc: absolute(c, collectionPath(col.slug)), lastmod: col.updatedAt.slice(0, 10) }));
    finds.push(...rows.map(r => ({ loc: absolute(c, findPath({ id: r.id, title: formatProductCopy(r.title, r.description).title })), lastmod: r.updated_at.toISOString().slice(0, 10) })));
  } catch (err) {
    console.error(`[${c.get('correlationId')}] sitemap finds unavailable: ${err instanceof Error ? err.message : err}`);
  }
  const latest = ARTICLES.map(a => a.updated ?? a.date).sort().at(-1);
  const urls = [
    { loc: `${siteOrigin(c)}/`, lastmod: undefined as string | undefined },
    { loc: `${siteOrigin(c)}/articles`, lastmod: latest },
    ...ARTICLES.filter(a => !a.draft).map(a => ({ loc: absolute(c, articlePath(a.slug)), lastmod: a.updated ?? a.date })),
    ...finds,
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(u => `  <url><loc>${escapeHtml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
  c.header('Content-Type', 'application/xml; charset=utf-8');
  c.header('Cache-Control', 'public, max-age=3600');
  return c.body(body);
});
