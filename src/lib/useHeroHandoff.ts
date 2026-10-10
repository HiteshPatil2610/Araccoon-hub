import { useLayoutEffect, type RefObject } from 'react';
import { heroHandoff } from './heroHandoff';

/** One frame-coalesced listener drives the handoff without rerendering the catalog. */
export function useHeroHandoff(ref: RefObject<HTMLDivElement | null>, reducedMotion: boolean) {
  useLayoutEffect(() => {
    const root = ref.current;
    const hero = root?.querySelector<HTMLElement>('.cd-hero');
    const stage = root?.querySelector<HTMLElement>('.cd-hero__stage');
    const picks = root?.querySelector<HTMLElement>('.cd-picks');
    const box = root?.querySelector<HTMLElement>('.cd-picks__raccoon');
    if (!root || !hero || !stage || !picks || !box) return;
    let frame = 0;
    let disposed = false;
    let measureStage = true;

    const update = () => {
      frame = 0;
      // Complete layout reads before changing styles. The outer box never animates.
      const heroRect = hero.getBoundingClientRect();
      const picksTop = picks.getBoundingClientRect().top;
      const boxTop = box.getBoundingClientRect().top;
      const stageHeight = measureStage ? stage.clientHeight : null;
      measureStage = false;
      const values = heroHandoff({
        heroTop: heroRect.top, heroHeight: heroRect.height, picksTop, boxTop,
        viewportHeight: window.innerHeight, viewportWidth: window.innerWidth, reducedMotion,
      });
      root.style.setProperty('--hero-scroll-lag', `${values.lag.toFixed(2)}px`);
      root.style.setProperty('--picks-progress', values.picks.toFixed(4));
      root.style.setProperty('--box-progress', values.box.toFixed(4));
      root.style.setProperty('--divider-progress', values.divider.toFixed(4));
      if (stageHeight !== null) root.style.setProperty('--hero-stage-used', `${stageHeight}px`);
    };
    const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(update); };
    const resize = () => { measureStage = true; schedule(); };
    update(); // Covers restored scroll positions before the first paint.
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', resize);
    const observer = new ResizeObserver(resize);
    observer.observe(hero);
    observer.observe(stage);
    observer.observe(picks);
    void document.fonts.ready.then(resize);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', resize);
      for (const property of ['--hero-scroll-lag', '--picks-progress', '--box-progress', '--divider-progress', '--hero-stage-used']) root.style.removeProperty(property);
    };
  }, [ref, reducedMotion]);
}
