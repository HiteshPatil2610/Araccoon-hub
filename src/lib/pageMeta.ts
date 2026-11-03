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
