import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { runThemeCurtain } from './themeCurtain';

const KEY = 'araccoon_theme';

function storedDark(): boolean {
  return document.documentElement.classList.contains('dark');
}

/** Light/dark theme; a crimson curtain with the wordmark sweeps across and the theme flips behind it. */
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
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !e || document.hidden || typeof document.body.animate !== 'function') {
      setDark(next);
      return;
    }
    const root = document.documentElement;
    root.classList.add('theme-transitioning', next ? 'theme-going-dark' : 'theme-going-light');
    transitioning.current = true;
    void runThemeCurtain(() => flushSync(() => setDark(next))).finally(() => {
      transitioning.current = false;
      root.classList.remove('theme-transitioning', 'theme-going-dark', 'theme-going-light');
    });
  }, []);

  return { dark, toggle };
}
