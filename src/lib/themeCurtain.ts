// Theme switch "crimson curtain": a crimson panel with the RACCOON HUB wordmark sweeps in from the
// left until it covers the screen, the theme flips behind it, and the panel carries on out to the
// right, uncovering the new theme. It is a plain fixed overlay animated with the Web Animations API
// (styles in index.css, `.theme-curtain`), so it needs no View Transitions and the page is never seen
// half in one theme and half in the other.

/** Phase lengths in milliseconds: sweep in, hold with the wordmark on screen, sweep out. */
export const CURTAIN_TIMING = { cover: 430, hold: 170, reveal: 470 } as const;

const EASE = 'cubic-bezier(.72, 0, .28, 1)';

/**
 * Plays the curtain and calls `swap` once while the screen is covered. `swap` is always called
 * exactly once, even if the animation fails or is cancelled, and the overlay is always removed.
 */
export async function runThemeCurtain(swap: () => void, doc: Document = document): Promise<void> {
  let swapped = false;
  const doSwap = () => {
    if (!swapped) {
      swapped = true;
      swap();
    }
  };
  const curtain = doc.createElement('div');
  curtain.className = 'theme-curtain';
  curtain.setAttribute('aria-hidden', 'true');
  const mark = doc.createElement('span');
  mark.className = 'theme-curtain__mark';
  const hub = doc.createElement('span');
  hub.className = 'theme-curtain__hub';
  hub.textContent = ' Hub';
  mark.append('Raccoon', hub);
  curtain.append(mark);
  doc.body.append(curtain);
  try {
    const { cover, hold, reveal } = CURTAIN_TIMING;
    const options = { duration: cover, easing: EASE, fill: 'both' as const };
    await Promise.all([
      curtain.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], options).finished,
      mark.animate([{ transform: 'translateX(-6vw)', opacity: 0 }, { transform: 'none', opacity: 1 }], options).finished,
    ]);
    doSwap();
    const out = { duration: reveal, delay: hold, easing: EASE, fill: 'both' as const };
    await Promise.all([
      curtain.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 0 100%)' }], out).finished,
      mark.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(6vw)', opacity: 0 }], out).finished,
    ]);
  } catch {
    /* animation cancelled or unsupported — the theme still changes below */
  } finally {
    doSwap();
    curtain.remove();
  }
}
