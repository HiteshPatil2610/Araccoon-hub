import { useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router';
import { flapWords, runStashFlaps, stashDirection, type StashDirection } from './stashFlaps';

// Shared by every Navbar: the nav (and this hook) remounts with each page, but the flaps outlive it.
let busy = false;
let lastPath: string | null = null;
let previousPath: string | null = null;

/**
 * The in-app page shown before `current`, when known (for the stash page's home button). During the first
 * render of a new page the nav's effect has not run yet, so the page just left is still `lastPath`.
 */
export const cameFrom = (current: string) => (lastPath !== null && lastPath !== current ? lastPath : previousPath);

const canAnimate = () =>
  typeof document !== 'undefined' && document.visibilityState === 'visible'
  && typeof Element !== 'undefined' && 'animate' in Element.prototype
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// requestAnimationFrame stops in a background tab; never let that hold the flaps shut.
const nextFrame = () => new Promise<void>(resolve => { requestAnimationFrame(() => resolve()); setTimeout(resolve, 100); });

/** Resolves once the address has moved off `from` (Back resolves before the page changes), or after `ms`. */
async function addressLeaves(from: string, ms: number) {
  const end = Date.now() + ms;
  while (window.location.pathname === from && Date.now() < end) await nextFrame();
}

/**
 * Changes page with the box flaps (`stashFlaps.ts`): closes them, runs `go` (a navigation, or Back),
 * waits for the new page to draw behind them (never more than 1.5s), then opens them. Without motion it
 * just runs `go`. Ignored while flaps are already playing.
 */
export function playStashFlaps(direction: StashDirection, to: string, go: () => unknown) {
  if (busy) return;
  if (!canAnimate()) { void go(); return; }
  busy = true;
  // Start loading Your lists (a lazy route) while the flaps close; the router reuses this module.
  if (direction === 'in') void import('../pages/Stash').catch(() => {});
  const from = window.location.pathname;
  const swap = async () => {
    await Promise.race([Promise.resolve(go()), new Promise(resolve => setTimeout(resolve, 1500))]);
    await addressLeaves(from, 1500);
    await nextFrame();
    await nextFrame();
  };
  void runStashFlaps(swap, { words: flapWords(direction, to) }).finally(() => { busy = false; });
}

/**
 * Plays the box flaps for in-app links into and out of Your lists, whatever renders them (nav button,
 * Stash link, phone menu, "See your lists", logo, footer…), by catching the click before React Router
 * does. Back/Forward only get the opening: the page has already changed by then. Links with a #section
 * reload the page and are left alone; reduced motion and hidden tabs change at once.
 */
export function useStashFlaps() {
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
      const direction = stashDirection(window.location.pathname, url.pathname);
      if (!direction || !canAnimate()) return;
      e.preventDefault(); // React Router's Link skips its own navigation; its onClick (closing a menu) still runs
      playStashFlaps(direction, url.pathname, () => navigate(url.pathname + url.search));
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [navigate]);

  useLayoutEffect(() => {
    const previous = lastPath;
    if (pathname === previous) return; // StrictMode runs effects twice in development
    previousPath = previous;
    lastPath = pathname;
    if (previous === null || navigationType !== 'POP' || busy) return;
    const direction = stashDirection(previous, pathname);
    if (!direction || !canAnimate()) return;
    busy = true;
    void runStashFlaps(() => {}, { words: flapWords(direction, pathname), revealOnly: true }).finally(() => { busy = false; });
  }, [pathname, navigationType]);
}
