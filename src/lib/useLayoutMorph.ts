import { useEffect } from 'react';

/**
 * Smooths layout jumps when the viewport changes size (breakpoints, maximise/restore, rotating a phone).
 *
 * Elements marked `data-morph` are measured relative to their nearest `[data-morph-root]` (a section), using
 * offset geometry so entrance/scroll transforms never skew the numbers. After every resize the new layout is
 * compared with the last one; anything that jumped is played from its old box to its new one (FLIP).
 *   data-morph="move"  — position only (body copy and controls: scaling would distort the type)
 *   data-morph="type"  — position plus uniform scale from the height change (display type, cut-outs in full-width boxes)
 *   data-morph         — position and box size (discs, cards)
 * Small per-frame changes from a slow drag are left alone, so fluid sizes still track the window directly.
 */
interface Box { x: number; y: number; w: number; h: number }

const JUMP_PX = 14;
const JUMP_SCALE = 0.06;
const DURATION = 560;
const EASE = 'cubic-bezier(.2,.8,.2,1)';

function box(el: HTMLElement, root: HTMLElement): Box | null {
  if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return null; // display: none (or detached)
  let x = 0, y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    const p = n.offsetParent as HTMLElement | null;
    if (!p || !root.contains(p) && p !== root) break;
    n = p;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

export function useLayoutMorph() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof Element.prototype.animate !== 'function') return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let last = new Map<HTMLElement, Box>();
    const running = new Map<HTMLElement, Animation>();
    let frame = 0;

    const measure = () => {
      const next = new Map<HTMLElement, Box>();
      for (const el of document.querySelectorAll<HTMLElement>('[data-morph]')) {
        const root = el.closest<HTMLElement>('[data-morph-root]');
        if (!root) continue;
        const b = box(el, root);
        if (b && b.w > 0 && b.h > 0) next.set(el, b);
      }
      return next;
    };

    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = measure();
        if (!reduced.matches) {
          for (const [el, now] of next) {
            const was = last.get(el);
            if (!was) {
              // newly shown at this size (e.g. flanks, inline nav links): fade it in rather than pop
              if (last.size) running.set(el, el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURATION, easing: EASE }));
              continue;
            }
            const dx = (was.x + was.w / 2) - (now.x + now.w / 2);
            const dy = (was.y + was.h / 2) - (now.y + now.h / 2);
            const mode = el.dataset.morph;
            const scaled = mode !== 'move';
            const sy = scaled ? was.h / now.h : 1;
            const sx = mode === 'type' ? sy : scaled ? was.w / now.w : 1;
            const jumped = Math.abs(dx) > JUMP_PX || Math.abs(dy) > JUMP_PX || Math.abs(sx - 1) > JUMP_SCALE || Math.abs(sy - 1) > JUMP_SCALE;
            if (!jumped) continue;
            running.get(el)?.cancel();
            const from = `translate(${dx}px, ${dy}px)` + (scaled ? ` scale(${sx}, ${sy})` : '');
            const a = el.animate([{ transform: from }, { transform: 'translate(0, 0)' }], { duration: DURATION, easing: EASE, composite: 'add' });
            running.set(el, a);
            a.onfinish = a.oncancel = () => { if (running.get(el) === a) running.delete(el); };
          }
        }
        last = next;
      });
    };

    // first snapshot once fonts and images have settled; refresh it whenever the DOM changes shape
    const snapshot = () => { last = measure(); };
    const t = window.setTimeout(snapshot, 600);
    void document.fonts?.ready.then(snapshot);
    let idle = 0;
    const mo = new MutationObserver(() => { clearTimeout(idle); idle = window.setTimeout(snapshot, 250); });
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      clearTimeout(idle);
      cancelAnimationFrame(frame);
      mo.disconnect();
      window.removeEventListener('resize', onResize);
      running.forEach(a => a.cancel());
    };
  }, []);
}
