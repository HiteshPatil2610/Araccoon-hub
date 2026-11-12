import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { INK_DURATION, inkMaskUrl } from './inkReveal';

const KEY = 'araccoon_theme';

function storedDark(): boolean {
  return document.documentElement.classList.contains('dark');
}

/** Light/dark theme; the new theme bleeds out from the toggle like ink (View Transition + animated SVG mask). */
export function useTheme() {
  const [dark, setDark] = useState(storedDark);
  const transitioning = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem(KEY, dark ? 'dark' : 'light');
    } catch {
      /* storage unavailable (private mode) — theme still applies for this visit */
    }
  }, [dark]);

  const toggle = useCallback((e?: React.MouseEvent<HTMLElement>) => {
    if (transitioning.current) return;
    const next = !storedDark();
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void>; ready?: Promise<void> } };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduced || !e) {
      setDark(next);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const root = document.documentElement;
    const seed = Math.floor(Math.random() * 1000);
    root.style.setProperty('--theme-ink', inkMaskUrl(r.left + r.width / 2, r.top + r.height / 2, window.innerWidth, window.innerHeight, seed));
    root.style.setProperty('--theme-ink-duration', `${INK_DURATION}ms`);
    root.classList.add('theme-transitioning', next ? 'theme-going-dark' : 'theme-going-light');
    transitioning.current = true;
    const transition = doc.startViewTransition(() => flushSync(() => setDark(next)));
    // A transition can be skipped (e.g. the tab is hidden); the theme still changes, so ignore that rejection.
    transition.ready?.catch(() => {});
    transition.finished.catch(() => {}).finally(() => {
      transitioning.current = false;
      root.classList.remove('theme-transitioning', 'theme-going-dark', 'theme-going-light');
      root.style.removeProperty('--theme-ink');
    });
  }, []);

  return { dark, toggle };
}
