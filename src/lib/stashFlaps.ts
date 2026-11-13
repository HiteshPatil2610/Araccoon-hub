// "Box flaps" into and out of Your lists (`/stash`), picked by the owner on 13 November 2026 (replacing
// the ribbon drop of the day before). Two crimson flaps close from the top and bottom like the raccoon's
// box, a wordmark split across the seam (YOUR STASH going in), the page changes behind them, and they open
// again. A fixed overlay animated with the Web Animations API, like the theme curtain (`.stash-flaps`).

export type StashDirection = 'in' | 'out';

/** Phase lengths in milliseconds: close, hold with the wordmark whole, open. */
export const FLAPS_TIMING = { close: 430, hold: 230, open: 470 } as const;

const EASE = 'cubic-bezier(.72, 0, .28, 1)';

const isStash = (path: string) => path.replace(/\/+$/, '') === '/stash';

/** Whether moving between two addresses enters or leaves Your lists; null when it does neither. */
export function stashDirection(from: string, to: string): StashDirection | null {
  if (isStash(to)) return isStash(from) ? null : 'in';
  if (isStash(from) && !to.startsWith('/stash/')) return 'out';
  return null;
}

/** The wordmark on the flaps: white first word, black second word. */
export function flapWords(direction: StashDirection, to: string): [string, string] {
  if (direction === 'in') return ['Your', ' stash'];
  return to === '/' || to.startsWith('/find/') ? ['The', ' finds'] : ['Raccoon', ' Hub'];
}

/** The stash page's back button: Back to the page the visitor came from, else the storefront. */
export function stashBack(previous: string | null, canGoBack: boolean): { to: string; viaHistory: boolean; label: string } {
  if (!canGoBack || previous === null || isStash(previous)) return { to: '/', viaHistory: false, label: 'Go to the home page' };
  const label = previous === '/' || previous.startsWith('/find/') ? 'Back to the finds'
    : previous.startsWith('/articles') ? 'Back to the journal'
    : previous.startsWith('/collections/') ? 'Back to the collection'
    : previous.startsWith('/stash/shared') ? 'Back to the shared list'
    : 'Back to the previous page';
  return { to: previous, viaHistory: true, label };
}

export interface FlapsOptions {
  words: [string, string];
  /** Only the opening, for Back/Forward, where the page has already changed. */
  revealOnly?: boolean;
  doc?: Document;
}

/**
 * Closes the flaps, calls `swap` (the navigation) once while the screen is covered and waits for it, then
 * opens them. `swap` always runs exactly once, even if an animation fails, and the overlay is always removed.
 */
export async function runStashFlaps(swap: () => unknown, options: FlapsOptions): Promise<void> {
  const doc = options.doc ?? document;
  let swapped = false;
  const doSwap = async () => {
    if (swapped) return;
    swapped = true;
    await swap();
  };

  const overlay = doc.createElement('div');
  overlay.className = 'stash-flaps';
  overlay.setAttribute('aria-hidden', 'true');
  // Each flap holds the whole wordmark centred on the screen and shows only its own half of it.
  const flaps = (['top', 'bottom'] as const).map(side => {
    const flap = doc.createElement('div');
    flap.className = `stash-flaps__flap stash-flaps__flap--${side}`;
    const inner = doc.createElement('div');
    inner.className = 'stash-flaps__inner';
    const mark = doc.createElement('span');
    mark.className = 'stash-flaps__mark';
    const second = doc.createElement('span');
    second.className = 'stash-flaps__dark';
    second.textContent = options.words[1];
    mark.append(options.words[0], second);
    inner.append(mark);
    flap.append(inner);
    overlay.append(flap);
    return { flap, away: side === 'top' ? 'translateY(-101%)' : 'translateY(101%)' };
  });
  doc.body.append(overlay);

  try {
    const { close, hold, open } = FLAPS_TIMING;
    // Shut straight away for Back/Forward: an animation only applies once the browser starts it.
    if (options.revealOnly) for (const { flap } of flaps) flap.style.transform = 'none';
    else {
      const opts = { duration: close, easing: EASE, fill: 'both' as const };
      await Promise.all(flaps.map(({ flap, away }) => flap.animate([{ transform: away }, { transform: 'none' }], opts).finished));
    }
    await doSwap();
    const opts = { duration: open, delay: hold, easing: EASE, fill: 'both' as const };
    await Promise.all(flaps.map(({ flap, away }) => flap.animate([{ transform: 'none' }, { transform: away }], opts).finished));
  } catch {
    /* animation cancelled or unsupported: the page still changes below */
  } finally {
    await doSwap();
    overlay.remove();
  }
}
