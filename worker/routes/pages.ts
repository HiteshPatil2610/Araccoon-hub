import { Hono } from 'hono';
import { ipKey, limit, type AppEnv, type Ctx } from '../app';
import { listProducts, toPublic } from '../repo/products';
import { getSiteText } from '../repo/siteText';
import { escapeHtml, renderPage, type PageMeta } from '../lib/html';
import { ARTICLES } from '../../shared/generated/articles';
import { articlePath, formatArticleDate, type Article } from '../../shared/articles';
import { DEFAULT_SITE_TEXT, type SiteText } from '../../shared/siteText';
import type { PublicProduct } from '../../shared/types';

// Public pages are served by the Worker (see run_worker_first in wrangler.jsonc)
// so their first HTML already carries the real title, description, share
// tags, structured data and the data the page needs. The React app then
// renders from that data without waiting on the API.

export const SHARE_IMAGE = '/og-image.jpg';
const SHARE_IMAGE_ALT = 'Raccoon Hub: the raccoon mascot in a hoodie and headphones, arms crossed, beside the words Raccoon Hub';
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

type Rendered = { status: 200 | 404; meta: PageMeta; data: { siteText: SiteText; products?: PublicProduct[] }; noscript: string; cacheable: boolean };

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
async function loadData(c: Ctx, withProducts: boolean): Promise<{ siteText: SiteText; products: PublicProduct[] | null; ok: boolean }> {
  try {
    const db = c.get('db');
    const [siteText, rows] = await Promise.all([getSiteText(db), withProducts ? listProducts(db, { statuses: ['published'] }) : Promise.resolve(null)]);
    return { siteText, products: rows ? rows.map(toPublic) : null, ok: true };
  } catch (err) {
    console.error(`[${c.get('correlationId')}] page data unavailable: ${err instanceof Error ? err.message : err}`);
    return { siteText: DEFAULT_SITE_TEXT, products: null, ok: false };
  }
}

const organization = (c: Ctx) => ({ '@type': 'Organization', name: 'Raccoon Hub', url: `${siteOrigin(c)}/`, logo: absolute(c, '/favicon.svg') });

pageRoutes.get('/', (c) => servePage(c, async () => {
  const { siteText, products, ok } = await loadData(c, true);
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
      jsonLd: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Raccoon Hub', url: `${siteOrigin(c)}/`, description: siteText.seoDescription, publisher: organization(c) }],
    },
    data: products ? { siteText, products } : { siteText },
    noscript: [
      `<h1>Raccoon Hub</h1>`,
      `<p>${escapeHtml(siteText.heroBlurb)}</p>`,
      list.length ? `<h2>The current finds</h2><ul>${list.map(p => `<li><strong>${escapeHtml(p.title)}</strong> — ${escapeHtml(p.category)}</li>`).join('')}</ul>` : '',
      `<p>Turn on JavaScript to browse the finds and open them on Amazon. <a href="/articles">Read the journal</a>.</p>`,
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

pageRoutes.get('/sitemap.xml', (c) => {
  const latest = ARTICLES.map(a => a.updated ?? a.date).sort().at(-1);
  const urls = [
    { loc: `${siteOrigin(c)}/`, lastmod: undefined as string | undefined },
    { loc: `${siteOrigin(c)}/articles`, lastmod: latest },
    ...ARTICLES.filter(a => !a.draft).map(a => ({ loc: absolute(c, articlePath(a.slug)), lastmod: a.updated ?? a.date })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(u => `  <url><loc>${escapeHtml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
  c.header('Content-Type', 'application/xml; charset=utf-8');
  c.header('Cache-Control', 'public, max-age=3600');
  return c.body(body);
});
