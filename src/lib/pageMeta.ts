import { useEffect } from 'react';

function setMeta(selector: string, attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.append(el);
  }
  el.content = value;
}

/**
 * Keeps the tab title and description right after in-app navigation. The
 * Worker already writes them into the HTML for the first load and crawlers.
 */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    if (description) {
      setMeta('meta[name="description"]', 'name', 'description', description);
      setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    }
  }, [title, description]);
}

/**
 * Tells search engines not to index the current page (e.g. the 404 page, which the
 * static host serves with status 200). Removes the tag again when the page unmounts,
 * unless the Worker already put one there (non-production pages are all noindex).
 */
export function useNoIndex() {
  useEffect(() => {
    if (document.head.querySelector('meta[name="robots"]')) return;
    const el = document.createElement('meta');
    el.name = 'robots';
    el.content = 'noindex';
    document.head.append(el);
    return () => el.remove();
  }, []);
}
