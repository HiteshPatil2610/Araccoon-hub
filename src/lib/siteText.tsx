import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';
import { initialData } from './initialData';
import { DEFAULT_SITE_TEXT, mergeSiteText, type SiteText } from '../../shared/siteText';

type Ctx = { text: SiteText; replace: (next: SiteText) => void };
const SiteTextContext = createContext<Ctx>({ text: DEFAULT_SITE_TEXT, replace: () => {} });

/**
 * Owner-editable storefront copy. Starts from the text embedded in the page
 * (or the built-in defaults) so nothing waits on the network; without
 * embedded text it fetches once and swaps in the owner's version.
 */
export function SiteTextProvider({ children }: { children: ReactNode }) {
  const embedded = initialData().siteText;
  const [text, setText] = useState<SiteText>(() => mergeSiteText(embedded ?? {}));

  useEffect(() => {
    if (embedded) return;
    let live = true;
    api.siteText().then(t => { if (live) setText(mergeSiteText(t)); }).catch(() => { /* keep defaults */ });
    return () => { live = false; };
  }, [embedded]);

  const replace = useCallback((next: SiteText) => setText(mergeSiteText(next)), []);
  const value = useMemo(() => ({ text, replace }), [text, replace]);
  return <SiteTextContext.Provider value={value}>{children}</SiteTextContext.Provider>;
}

export const useSiteText = () => useContext(SiteTextContext).text;
/** Lets the owner hub show saved changes on the storefront without a reload. */
export const useReplaceSiteText = () => useContext(SiteTextContext).replace;
