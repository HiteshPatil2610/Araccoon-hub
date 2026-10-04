import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

const KEY = 'araccoon_theme';

function storedDark(): boolean {
  return document.documentElement.classList.contains('dark');
}

/** Light/dark theme with the circular View Transition reveal from the click point. */
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
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduced || !e) {
      setDark(next);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const root = document.documentElement;
    root.style.setProperty('--x', `${r.left + r.width / 2}px`);
    root.style.setProperty('--y', `${r.top + r.height / 2}px`);
    root.classList.add('theme-transitioning', next ? 'theme-going-dark' : 'theme-going-light');
    transitioning.current = true;
    doc.startViewTransition(() => flushSync(() => setDark(next))).finished.catch(() => {}).finally(() => {
      transitioning.current = false;
      root.classList.remove('theme-transitioning', 'theme-going-dark', 'theme-going-light');
    });
  }, []);

  return { dark, toggle };
}
