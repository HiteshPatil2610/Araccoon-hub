import { INITIAL_DATA_ID, serializeInitialData, type InitialData } from '../../shared/initialData';

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export interface PageMeta {
  title: string;
  description: string;
  /** Absolute canonical URL. */
  url: string;
  /** Absolute image URL for link previews. */
  image: string;
  imageAlt: string;
  type: 'website' | 'article';
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  /** Site path of an image the page shows first; fetched before the scripts that would otherwise discover it. */
  preloadImage?: string;
  /** Absolute URL of an RSS feed that feed readers should discover from this page. */
  feedUrl?: string;
  /** schema.org objects, written as JSON-LD. */
  jsonLd?: object[];
}

/** JSON for a <script type="application/ld+json"> (same escaping as the initial data). */
const ldJson = (data: object) => serializeInitialData(data as InitialData);

function headTags(meta: PageMeta, initial: InitialData): string {
  const tag = (attr: 'name' | 'property', key: string, value: string | undefined) =>
    value ? `<meta ${attr}="${key}" content="${escapeHtml(value)}">` : '';
  return [
    `<title>${escapeHtml(meta.title)}</title>`,
    tag('name', 'description', meta.description),
    `<link rel="canonical" href="${escapeHtml(meta.url)}">`,
    meta.noindex ? '<meta name="robots" content="noindex">' : '',
    meta.feedUrl ? `<link rel="alternate" type="application/rss+xml" title="Raccoon Hub journal" href="${escapeHtml(meta.feedUrl)}">` : '',
    meta.preloadImage ? `<link rel="preload" as="image" href="${escapeHtml(meta.preloadImage)}" fetchpriority="high">` : '',
    tag('property', 'og:site_name', 'Raccoon Hub'),
    tag('property', 'og:type', meta.type),
    tag('property', 'og:title', meta.title),
    tag('property', 'og:description', meta.description),
    tag('property', 'og:url', meta.url),
    tag('property', 'og:image', meta.image),
    tag('property', 'og:image:alt', meta.imageAlt),
    tag('property', 'article:published_time', meta.publishedTime),
    tag('property', 'article:modified_time', meta.modifiedTime),
    tag('name', 'twitter:card', 'summary_large_image'),
    tag('name', 'twitter:title', meta.title),
    tag('name', 'twitter:description', meta.description),
    tag('name', 'twitter:image', meta.image),
    ...(meta.jsonLd ?? []).map(d => `<script type="application/ld+json">${ldJson(d)}</script>`),
    `<script type="application/json" id="${INITIAL_DATA_ID}">${serializeInitialData(initial)}</script>`,
  ].filter(Boolean).join('\n    ');
}

/**
 * Fills the built index.html for one page: replaces the static title and
 * description, adds canonical/share/structured-data tags and the embedded
 * data, and puts a plain-HTML version of the content in <noscript>.
 */
export function renderPage(template: string, meta: PageMeta, initial: InitialData, noscriptHtml: string): string {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="description"[^>]*>\s*/i, '');
  const head = headTags(meta, initial);
  html = html.includes('</head>') ? html.replace('</head>', `    ${head}\n  </head>`) : `${head}\n${html}`;
  const fallback = `<noscript><div class="noscript-page">${noscriptHtml}</div></noscript>`;
  return /<div id="root"><\/div>/.test(html)
    ? html.replace(/<div id="root"><\/div>/, `<div id="root"></div>\n    ${fallback}`)
    : html.replace('</body>', `${fallback}\n</body>`);
}
