// Compiles content/articles/*.md into shared/generated/articles.ts.
//
//   npx tsx scripts/articles.ts            published articles only
//   npx tsx scripts/articles.ts --drafts   include drafts (local preview)
//
// Runs automatically before build, typecheck and test, and live while
// `npm run dev` is running (see vite.config.ts). Invalid content fails loudly
// with the file name, so a broken article never reaches production.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked, type Tokens } from 'marked';
import type { Article } from '../shared/articles';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ARTICLES_DIR = path.join(ROOT, 'content', 'articles');
const OUT_FILE = path.join(ROOT, 'shared', 'generated', 'articles.ts');

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Product links must go through product cards (tracked /r/ links with the
// right Associates tag), never raw Amazon URLs pasted into the text.
const AMAZON_HOST = /(^|\.)(amazon\.[a-z.]+|amzn\.[a-z]+|a\.co)$/i;

export class ArticleError extends Error {}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function checkUrl(raw: string, kind: 'link' | 'image'): string {
  const url = raw.trim();
  if (kind === 'link' && (url.startsWith('#') || url.startsWith('mailto:'))) return url;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ArticleError(`${kind === 'image' ? 'Image' : 'Link'} "${url}" must start with / or https://.`);
  }
  if (parsed.protocol !== 'https:' && !(kind === 'link' && parsed.protocol === 'http:')) {
    throw new ArticleError(`${kind === 'image' ? 'Image' : 'Link'} "${url}" must use https://.`);
  }
  if (kind === 'link' && AMAZON_HOST.test(parsed.hostname)) {
    throw new ArticleError(`Link "${url}" goes straight to Amazon. List the product's id under "products:" instead, so the link is tracked and tagged.`);
  }
  return parsed.toString();
}

function createMarked() {
  return new Marked({
    gfm: true,
    renderer: {
      // No raw HTML: show it as text instead of rendering it.
      html({ text }: Tokens.HTML | Tokens.Tag) {
        return escapeHtml(text);
      },
      heading({ tokens, depth }: Tokens.Heading) {
        if (depth === 1) throw new ArticleError('Use "##" for section headings; the title is the only top-level heading.');
        return `<h${depth}>${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
      link({ href, title, tokens }: Tokens.Link) {
        const url = checkUrl(href, 'link');
        const external = /^https?:/.test(url);
        const attrs = [`href="${escapeHtml(url)}"`, title ? `title="${escapeHtml(title)}"` : '', external ? 'rel="noopener noreferrer"' : ''].filter(Boolean).join(' ');
        return `<a ${attrs}>${this.parser.parseInline(tokens)}</a>`;
      },
      image({ href, text }: Tokens.Image) {
        const url = checkUrl(href, 'image');
        if (!text.trim()) throw new ArticleError(`Image "${href}" needs alt text: ![what it shows](${href}).`);
        return `<img src="${escapeHtml(url)}" alt="${escapeHtml(text)}" loading="lazy" decoding="async">`;
      },
      // An image on its own line becomes a figure; its "title" is the caption.
      paragraph({ tokens }: Tokens.Paragraph) {
        const only = tokens.length === 1 && tokens[0]!.type === 'image' ? tokens[0] as Tokens.Image : null;
        if (only) {
          const caption = only.title ? `<figcaption>${escapeHtml(only.title)}</figcaption>` : '';
          return `<figure>${this.parser.parseInline(tokens)}${caption}</figure>\n`;
        }
        return `<p>${this.parser.parseInline(tokens)}</p>\n`;
      },
    },
  });
}

type Front = Record<string, string | string[]>;

/** A small, strict subset of YAML front matter: `key: value`, `key: [a, b]`, and `- item` lists. */
export function parseFrontMatter(source: string): { front: Front; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
  if (!match) throw new ArticleError('Start the file with front matter between two "---" lines.');
  const front: Front = {};
  let listKey: string | null = null;
  for (const [i, rawLine] of match[1]!.split(/\r?\n/).entries()) {
    const line = rawLine.trimEnd();
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const item = /^\s+-\s+(.*)$/.exec(line) ?? /^-\s+(.*)$/.exec(line);
    if (item && listKey) {
      (front[listKey] as string[]).push(unquote(item[1]!));
      continue;
    }
    const kv = /^([a-zA-Z][a-zA-Z0-9]*):\s*(.*)$/.exec(line);
    if (!kv) throw new ArticleError(`Front matter line ${i + 1} is not "key: value": ${rawLine}`);
    const [, key, value] = kv as unknown as [string, string, string];
    if (key in front) throw new ArticleError(`Front matter has "${key}" twice.`);
    if (value === '') {
      front[key] = [];
      listKey = key;
    } else if (value.startsWith('[') && value.endsWith(']')) {
      front[key] = value.slice(1, -1).split(',').map(v => unquote(v.trim())).filter(Boolean);
      listKey = null;
    } else {
      front[key] = unquote(value);
      listKey = null;
    }
  }
  return { front, body: match[2]! };
}

function unquote(v: string) {
  const t = v.trim();
  return (t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")) ? t.slice(1, -1) : t;
}

const KNOWN = new Set(['title', 'description', 'date', 'updated', 'image', 'imageAlt', 'products', 'draft']);

export function parseArticle(slug: string, source: string): Article {
  if (!SLUG.test(slug)) throw new ArticleError(`File name "${slug}.md" must be lowercase words joined by dashes, e.g. best-desk-gadgets.md.`);
  const { front, body } = parseFrontMatter(source);
  for (const key of Object.keys(front)) {
    if (!KNOWN.has(key)) throw new ArticleError(`Unknown front matter field "${key}". Allowed: ${[...KNOWN].join(', ')}.`);
  }
  const str = (key: string, required: boolean, max: number): string | null => {
    const v = front[key];
    if (v === undefined || v === '') {
      if (required) throw new ArticleError(`Front matter needs "${key}".`);
      return null;
    }
    if (typeof v !== 'string') throw new ArticleError(`"${key}" must be a single value.`);
    if (v.length > max) throw new ArticleError(`"${key}" is ${v.length} characters; keep it to ${max}.`);
    return v;
  };
  const date = (key: string, required: boolean) => {
    const v = str(key, required, 10);
    if (v === null) return null;
    if (!DATE.test(v) || Number.isNaN(Date.parse(`${v}T00:00:00Z`))) throw new ArticleError(`"${key}" must be a date like 2026-11-03.`);
    return v;
  };

  const title = str('title', true, 120)!;
  const description = str('description', true, 200)!;
  const published = date('date', true)!;
  const updated = date('updated', false);
  if (updated && updated < published) throw new ArticleError('"updated" is earlier than "date".');
  const image = str('image', false, 2048);
  const imageAlt = str('imageAlt', false, 200) ?? '';
  if (image) {
    checkUrl(image, 'image');
    if (!imageAlt) throw new ArticleError('Add "imageAlt" describing the cover image.');
  }
  const products = front.products ?? [];
  if (!Array.isArray(products)) throw new ArticleError('"products" must be a list of product ids.');
  for (const id of products) {
    if (!UUID.test(id)) throw new ArticleError(`"${id}" is not a product id. Copy the id from the owner hub's product editor.`);
  }
  const draftRaw = str('draft', false, 5);
  if (draftRaw !== null && draftRaw !== 'true' && draftRaw !== 'false') throw new ArticleError('"draft" must be true or false.');

  if (!body.trim()) throw new ArticleError('The article has no text after the front matter.');
  const html = createMarked().parse(body, { async: false }) as string;
  const words = body.replace(/[#>*_`[\]()!-]/g, ' ').split(/\s+/).filter(Boolean).length;

  return {
    slug, title, description, date: published, updated, image, imageAlt,
    products: [...new Set(products.map(id => id.toLowerCase()))],
    html, readingMinutes: Math.max(1, Math.round(words / 200)), draft: draftRaw === 'true',
  };
}

/** Reads every article; newest first. Drafts are left out unless asked for. */
export function loadArticles(opts: { drafts?: boolean; dir?: string } = {}): Article[] {
  const dir = opts.dir ?? ARTICLES_DIR;
  if (!fs.existsSync(dir)) return [];
  const articles: Article[] = [];
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith('.md') || file.toLowerCase() === 'readme.md' || file.startsWith('_')) continue;
    const slug = file.slice(0, -3);
    try {
      const article = parseArticle(slug, fs.readFileSync(path.join(dir, file), 'utf8'));
      if (!article.draft || opts.drafts) articles.push(article);
    } catch (err) {
      throw new ArticleError(`content/articles/${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return articles.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

/** Writes the generated module; only touches the file when its content changes. */
export function writeArticlesModule(opts: { drafts?: boolean } = {}): number {
  const articles = loadArticles(opts);
  const code = `// Generated by scripts/articles.ts from content/articles/*.md. Do not edit.\nimport type { Article } from '../articles';\n\nexport const ARTICLES: Article[] = ${JSON.stringify(articles, null, 2)};\n`;
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
  if (current !== code) fs.writeFileSync(OUT_FILE, code);
  return articles.length;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const count = writeArticlesModule({ drafts: process.argv.includes('--drafts') });
    console.log(`articles: compiled ${count} article${count === 1 ? '' : 's'}`);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
