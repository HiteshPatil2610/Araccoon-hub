import { useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router';
import { ribbonDirection, ribbonWords, runStashRibbon } from './stashRibbon';

// Shared by every Navbar: the nav (and this hook) remounts with each page, but a ribbon outlives it.
let busy = false;
let lastPath: string | null = null;

const canAnimate = () =>
  typeof document !== 'undefined' && document.visibilityState === 'visible'
  && typeof Element !== 'undefined' && 'animate' in Element.prototype
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// requestAnimationFrame stops in a background tab; never let that hold the ribbon on screen.
const nextFrame = () => new Promise<void>(resolve => { requestAnimationFrame(() => resolve()); setTimeout(resolve, 100); });

/**
 * Plays the stash ribbon (`stashRibbon.ts`) for in-app links into and out of Your lists, whatever renders
 * them (nav button, Stash link, phone menu, "See your lists", logo, footer…), by catching the click before
 * React Router does. Back/Forward only get the second half: the page has already changed by then.
 * Links with a #section reload the page and are left alone; reduced motion and hidden tabs change at once.
 */
export function useStashRibbon() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.hash) return;
      const direction = ribbonDirection(window.location.pathname, url.pathname);
      if (!direction || !canAnimate()) return;
      e.preventDefault(); // React Router's Link skips its own navigation; its onClick (closing a menu) still runs
      if (busy) return;
      busy = true;
      // Start loading Your lists (a lazy route) while the ribbon unrolls; the router reuses this module.
      if (direction === 'in') void import('../pages/Stash').catch(() => {});
      const swap = async () => {
        // Wait for the lazy page to load and draw behind the ribbon, but never hold the screen for long.
        await Promise.race([navigate(url.pathname + url.search), new Promise(resolve => setTimeout(resolve, 1500))]);
        await nextFrame();
        await nextFrame();
      };
      void runStashRibbon(direction, swap, { words: ribbonWords(direction, url.pathname) }).finally(() => { busy = false; });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [navigate]);

  useLayoutEffect(() => {
    const previous = lastPath;
    lastPath = pathname;
    if (previous === null || navigationType !== 'POP' || busy) return;
    const direction = ribbonDirection(previous, pathname);
    if (!direction || !canAnimate()) return;
    busy = true;
    void runStashRibbon(direction, () => {}, { words: ribbonWords(direction, pathname), revealOnly: true }).finally(() => { busy = false; });
  }, [pathname, navigationType]);
}
