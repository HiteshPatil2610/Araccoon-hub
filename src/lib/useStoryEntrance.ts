import { useLayoutEffect, type RefObject } from 'react';

/** The heading opens while it travels from the bottom edge into the readable part of the viewport. */
export function storyEntranceProgress(top: number, height: number, viewportHeight: number, reducedMotion = false) {
  if (reducedMotion) return 1;
  const start = viewportHeight - 24;
  const end = Math.min(viewportHeight * .6, viewportHeight - height - 72);
  return Math.max(0, Math.min(1, (start - top) / Math.max(120, start - end)));
}

/** Scrub the entrance in both directions using the heading's current viewport position. */
export function useStoryEntrance(sectionRef: RefObject<HTMLElement | null>, titleRef: RefObject<HTMLElement | null>, reducedMotion: boolean) {
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const title = titleRef.current;
    if (!section || !title) return;
    let frame = 0;
    let disposed = false;
    const update = () => {
      frame = 0;
      const rect = title.getBoundingClientRect();
      const progress = storyEntranceProgress(rect.top, rect.height, window.innerHeight, reducedMotion);
      section.style.setProperty('--story-entry', progress.toFixed(5));
      section.toggleAttribute('data-entry-complete', progress >= 1);
    };
    const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(title);
    void document.fonts.ready.then(schedule);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      section.style.removeProperty('--story-entry');
      section.removeAttribute('data-entry-complete');
    };
  }, [sectionRef, titleRef, reducedMotion]);
}
