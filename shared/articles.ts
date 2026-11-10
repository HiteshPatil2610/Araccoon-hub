// Articles are Markdown files in content/articles/, compiled to
// shared/generated/articles.ts by scripts/articles.ts (at build, typecheck,
// test, and live during `npm run dev`). Nothing is fetched at runtime.

export interface Article {
  /** From the file name: content/articles/<slug>.md */
  slug: string;
  title: string;
  /** One or two sentences for search results, link previews and the article list. */
  description: string;
  /** ISO date (YYYY-MM-DD) the article was published. */
  date: string;
  /** ISO date of the last meaningful update, if any. */
  updated: string | null;
  /** Cover image: a site path (/art/...) or an https URL. */
  image: string | null;
  imageAlt: string;
  /** Product ids shown as cards under the article. Missing or unpublished ones are skipped. */
  products: string[];
  /** Body as sanitized HTML (raw HTML in the Markdown is escaped). */
  html: string;
  readingMinutes: number;
  /** Drafts appear only in local development. */
  draft: boolean;
}

/** The journal's RSS feed. */
export const ARTICLES_FEED_PATH = '/articles/feed.xml';

export const articlePath = (slug: string) => `/articles/${slug}`;

export function formatArticleDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
