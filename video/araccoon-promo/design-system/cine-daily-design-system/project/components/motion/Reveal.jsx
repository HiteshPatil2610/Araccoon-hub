import React from 'react';
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export function useReveal(ref, { once = false, threshold = 0.2, replayKey } = {}) {
  const [inView, setIn] = React.useState(false);
  const [armed, setArmed] = React.useState(true);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setIn(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio >= Math.min(threshold, .99)) { setIn(true); if (once) io.disconnect(); }
      else if (!e.isIntersecting && !once) setIn(false);
    }, { threshold: [0, threshold] });
    io.observe(el); return () => io.disconnect();
  }, [once, threshold]);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    setArmed(false); let b; const a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setArmed(true)); });
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b); };
  }, [replayKey]);
  return reduced() || (inView && armed);
}
const HIDDEN = {
  fade: () => ({ opacity: 0 }),
  rise: d => ({ opacity: 0, t: 'translateY(' + d + 'px)' }),
  drop: d => ({ opacity: 0, t: 'translateY(' + (-d) + 'px)' }),
  'slide-left': d => ({ opacity: 0, t: 'translateX(' + (-d) + 'px)' }),
  'slide-right': d => ({ opacity: 0, t: 'translateX(' + d + 'px)' }),
  pop: () => ({ opacity: 0, t: 'scale(.6)' }),
  spin: () => ({ opacity: 0, t: 'rotate(-120deg) scale(.6)' }),
  blur: () => ({ opacity: 0, t: 'scale(1.04)', f: 'blur(12px)' }),
  mask: () => ({ clip: 'inset(100% 0 0 0)' }),
  'wipe-x': () => ({ clip: 'inset(0 100% 0 0)' }),
};
export function Reveal({ effect = 'rise', delay = 0, duration = 900, distance = 60, rotate = 0, restRotate = 0, once = false, threshold = 0.2, replayKey, as = 'div', style, children }) {
  const ref = React.useRef(null);
  const shown = useReveal(ref, { once, threshold, replayKey });
  const h = (HIDDEN[effect] || HIDDEN.rise)(distance);
  const ease = effect === 'pop' || effect === 'spin' ? 'var(--ease-pop)' : 'var(--ease-cine)';
  const rest = restRotate ? 'rotate(' + restRotate + 'deg)' : 'none';
  const T = as;
  const s = shown
    ? { opacity: 1, transform: rest, filter: 'none', clipPath: h.clip ? 'inset(0 0 0 0)' : undefined, transition: ['transform', 'opacity', 'filter', 'clip-path'].map(p => p + ' ' + duration + 'ms ' + ease + ' ' + delay + 'ms').join(',') }
    : { opacity: h.opacity ?? 1, transform: ((h.t || '') + ' rotate(' + (restRotate + rotate) + 'deg)').trim(), filter: h.f || 'none', clipPath: h.clip, transition: 'none' };
  return <T ref={ref} style={{ willChange: 'transform, opacity', ...style, ...s }}>{children}</T>;
}
