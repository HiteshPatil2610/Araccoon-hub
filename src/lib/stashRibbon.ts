// "Ribbon drop" into and out of Your lists (`/stash`), picked by the owner on 12 November 2026.
// In: a crimson bookmark ribbon unrolls down out of the nav's stash button, widens until it covers the
// screen (a bookmark notch at its foot), the page changes behind it, and the ribbon lifts off the top.
// Out: the ribbon drops from the top, the page changes, and it rolls back up into the stash button.
// A fixed overlay animated with the Web Animations API, like the theme curtain (`.stash-ribbon`).

export type RibbonDirection = 'in' | 'out';

/** Phase lengths in milliseconds. */
export const RIBBON_TIMING = { unroll: 560, drop: 430, hold: 170, lift: 470, roll: 560 } as const;

const EASE = 'cubic-bezier(.72, 0, .28, 1)';
const UNROLL = 'cubic-bezier(.3, 0, .2, 1)';

const isStash = (path: string) => path.replace(/\/+$/, '') === '/stash';

/** Whether moving between two addresses enters or leaves Your lists; null when it does neither. */
export function ribbonDirection(from: string, to: string): RibbonDirection | null {
  if (isStash(to)) return isStash(from) ? null : 'in';
  if (isStash(from) && !to.startsWith('/stash/')) return 'out';
  return null;
}

/** The wordmark on the ribbon: white first word, black second word. */
export function ribbonWords(direction: RibbonDirection, to: string): [string, string] {
  if (direction === 'in') return ['Your', ' stash'];
  return to === '/' || to.startsWith('/find/') ? ['The', ' finds'] : ['Raccoon', ' Hub'];
}

type Box = { left: number; right: number; top: number; bottom: number };

export interface RibbonOptions {
  words: [string, string];
  /** Only the second half, for Back/Forward, where the page has already changed. */
  revealOnly?: boolean;
  doc?: Document;
  size?: () => { width: number; height: number };
  /** The stash button, measured when needed (it is a different element after the page changes). */
  origin?: () => Box | null;
}

const shape = (left: number, right: number, height: number, notch: number) =>
  `polygon(${left}px 0px, ${right}px 0px, ${right}px ${height}px, ${(left + right) / 2}px ${height - notch}px, ${left}px ${height}px)`;

/**
 * Plays the ribbon and calls `swap` (the navigation) once while the screen is covered, waiting for it.
 * `swap` always runs exactly once, even if an animation fails, and the overlay is always removed.
 */
export async function runStashRibbon(direction: RibbonDirection, swap: () => unknown, options: RibbonOptions): Promise<void> {
  const doc = options.doc ?? document;
  const size = options.size ?? (() => ({ width: window.innerWidth, height: window.innerHeight }));
  const origin = options.origin ?? (() => doc.querySelector('.stash-nav')?.getBoundingClientRect() ?? null);
  let swapped = false;
  const doSwap = async () => {
    if (swapped) return;
    swapped = true;
    await swap();
  };

  const ribbon = doc.createElement('div');
  ribbon.className = 'stash-ribbon';
  ribbon.setAttribute('aria-hidden', 'true');
  const mark = doc.createElement('span');
  mark.className = 'stash-ribbon__mark';
  const second = doc.createElement('span');
  second.className = 'stash-ribbon__dark';
  second.textContent = options.words[1];
  mark.append(options.words[0], second);
  ribbon.append(mark);
  doc.body.append(ribbon);

  try {
    const { width, height } = size();
    const notch = Math.min(64, Math.max(24, Math.round(width * 0.06)));
    const full = shape(-2, width + 2, height + notch + 2, notch);
    const offTop = `translateY(-${height + notch + 4}px)`;
    // A narrow ribbon hanging from the stash button (or the top middle when there is none).
    const narrow = (to: 'button' | 'half') => {
      const box = origin();
      const middle = box ? (box.left + box.right) / 2 : width / 2;
      const half = box ? Math.max(10, (box.right - box.left) * 0.35) : 16;
      // Clamped: while the nav is still sliding in on page load the button is above the screen.
      const length = to === 'half' ? height * 0.55 : box ? Math.min(height * 0.3, Math.max(0, (box.top + box.bottom) / 2)) : 0;
      return shape(middle - half, middle + half, length, Math.min(10, length / 3));
    };
    const { unroll, drop, hold, lift, roll } = RIBBON_TIMING;

    if (options.revealOnly) {
      ribbon.style.clipPath = full;
    } else if (direction === 'in') {
      // Each stretch eased on its own: unrolling down, then widening.
      const opts = { duration: unroll, easing: 'linear', fill: 'both' as const };
      await Promise.all([
        ribbon.animate([{ clipPath: narrow('button'), easing: UNROLL }, { clipPath: narrow('half'), offset: 0.4, easing: EASE }, { clipPath: full }], opts).finished,
        mark.animate([{ transform: 'translateY(-6vh)', opacity: 0, offset: 0 }, { transform: 'translateY(-6vh)', opacity: 0, offset: 0.45 }, { transform: 'none', opacity: 1 }], opts).finished,
      ]);
    } else {
      const opts = { duration: drop, easing: EASE, fill: 'both' as const };
      await Promise.all([
        ribbon.animate([{ clipPath: full, transform: offTop }, { clipPath: full, transform: 'none' }], opts).finished,
        mark.animate([{ opacity: 0 }, { opacity: 1 }], opts).finished,
      ]);
    }

    await doSwap();

    if (direction === 'in') {
      const opts = { duration: lift, delay: hold, easing: EASE, fill: 'both' as const };
      await ribbon.animate([{ clipPath: full, transform: 'none' }, { clipPath: full, transform: offTop }], opts).finished;
    } else {
      const opts = { duration: roll, delay: hold, easing: 'linear', fill: 'both' as const };
      await Promise.all([
        ribbon.animate([{ clipPath: full, opacity: 1, easing: EASE }, { clipPath: narrow('half'), opacity: 1, offset: 0.55, easing: UNROLL }, { clipPath: narrow('button'), opacity: 0 }], opts).finished,
        mark.animate([{ opacity: 1 }, { opacity: 0, offset: 0.3 }, { opacity: 0 }], opts).finished,
      ]);
    }
  } catch {
    /* animation cancelled or unsupported: the page still changes below */
  } finally {
    await doSwap();
    ribbon.remove();
  }
}
