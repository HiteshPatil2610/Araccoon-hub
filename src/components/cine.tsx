import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { Play } from 'lucide-react';

/* Cine Daily primitives: scroll-choreographed entrances and the small editorial pieces of the design system. */

const prefersReduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** True while the element is in view (replays on re-entry unless `once`). Reduced motion is always "shown". */
export function useReveal<T extends Element>(ref: React.RefObject<T | null>, { once = false, threshold = 0.2 } = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e!.isIntersecting && e!.intersectionRatio >= Math.min(threshold, 0.99)) { setInView(true); if (once) io.disconnect(); }
      else if (!e!.isIntersecting && !once) setInView(false);
    }, { threshold: [0, threshold] });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, once, threshold]);
  return prefersReduced() || inView;
}

type Effect = 'fade' | 'rise' | 'drop' | 'slide-left' | 'slide-right' | 'pop' | 'spin' | 'blur' | 'mask' | 'wipe-x';
const HIDDEN: Record<Effect, (d: number) => { opacity?: number; t?: string; f?: string; clip?: string }> = {
  fade: () => ({ opacity: 0 }),
  rise: d => ({ opacity: 0, t: `translateY(${d}px)` }),
  drop: d => ({ opacity: 0, t: `translateY(${-d}px)` }),
  'slide-left': d => ({ opacity: 0, t: `translateX(${-d}px)` }),
  'slide-right': d => ({ opacity: 0, t: `translateX(${d}px)` }),
  pop: () => ({ opacity: 0, t: 'scale(.6)' }),
  spin: () => ({ opacity: 0, t: 'rotate(-120deg) scale(.6)' }),
  blur: () => ({ opacity: 0, t: 'scale(1.04)', f: 'blur(12px)' }),
  mask: () => ({ clip: 'inset(100% 0 0 0)' }),
  'wipe-x': () => ({ clip: 'inset(0 100% 0 0)' }),
};

/** Entrance wrapper. `pop`/`spin` use the overshoot ease; everything else the cinematic ease. */
/** `morph` opts the element into useLayoutMorph: smooth moves when the viewport changes size
    ("move" = position only, "type" = uniform scale for display type and cut-outs, true = box scale). */
type Morph = boolean | 'move' | 'type';
const morphAttr = (m?: Morph) => (m ? { 'data-morph': m === true ? '' : m } : {});

export function Reveal({ effect = 'rise', delay = 0, duration = 900, distance = 60, once = false, as: T = 'div', className, style, morph, children }: {
  effect?: Effect; delay?: number; duration?: number; distance?: number; once?: boolean; as?: ElementType; className?: string; style?: CSSProperties; morph?: Morph; children?: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const shown = useReveal(ref, { once });
  const h = HIDDEN[effect](distance);
  const ease = effect === 'pop' || effect === 'spin' ? 'var(--ease-pop)' : 'var(--ease-cine)';
  const s: CSSProperties = shown
    ? { opacity: 1, transform: h.t ? 'none' : undefined, filter: h.f ? 'none' : undefined, clipPath: h.clip ? 'inset(0 0 0 0)' : undefined, transition:['transform', 'opacity', 'filter', 'clip-path'].map(p => `${p} ${duration}ms ${ease} ${delay}ms`).join(',') }
    : { opacity: h.opacity ?? 1, transform: h.t, filter: h.f, clipPath: h.clip, transition: 'none' };
  // A fully clipped element has no intersection area, so clip effects observe the outer box and clip an inner one.
  if (h.clip) return <T ref={ref} className={className} style={style} {...morphAttr(morph)}><div style={s}>{children}</div></T>;
  return <T ref={ref} className={className} style={{ willChange: 'transform, opacity', ...style, ...s }} {...morphAttr(morph)}>{children}</T>;
}

/** Signature move: wide, faded tracking collapses to tight Bebas spacing while brightening. */
export function TrackingReveal({ from = '0.45em', to = 'var(--ls-display)', fromOpacity = 0.3, delay = 0, duration = 1300, once = false, as: T = 'div', className, style, morph, children }: {
  from?: string; to?: string; fromOpacity?: number; delay?: number; duration?: number; once?: boolean; as?: ElementType; className?: string; style?: CSSProperties; morph?: Morph; children?: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const shown = useReveal(ref, { once });
  return <T ref={ref} className={className} {...morphAttr(morph)} style={{
    ...style,
    letterSpacing: shown ? to : from,
    opacity: shown ? 1 : fromOpacity,
    transition: shown ? `letter-spacing ${duration}ms var(--ease-cine) ${delay}ms, opacity ${duration}ms var(--ease-cine) ${delay}ms` : 'none',
  }}>{children}</T>;
}

const scramble = (text: string, p: number, set: string) =>
  text.split('').map((c, i) => (c === ' ' || i < Math.floor(p * text.length)) ? c : set[Math.floor(Math.random() * set.length)]).join('');

/** Dates and numbers resolve from random glyphs. Screen readers get the final text via aria-label. */
export function ScrambleText({ text, duration = 900, delay = 0, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', className }: {
  text: string; duration?: number; delay?: number; charset?: string; className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useReveal(ref, { once: true });
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (prefersReduced()) { setOut(text); return; }
    if (!shown) { setOut(scramble(text, 0, charset)); return; }
    let raf = 0, last = 0;
    const t0 = performance.now() + delay;
    const tick = (now: number) => {
      const p = Math.max(0, Math.min(1, (now - t0) / duration));
      if (now - last > 45 || p === 1) { setOut(p === 1 ? text : scramble(text, p, charset)); last = now; }
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, text, delay, duration, charset]);
  return <span ref={ref} className={className} aria-label={text} style={{ fontVariantNumeric: 'tabular-nums' }}><span aria-hidden="true">{out}</span></span>;
}

/** Eyebrow with a red play-dot marker and the trailing " ." tic. */
export function SectionLabel({ children, trail = true, className = '' }: { children: ReactNode; trail?: boolean; className?: string }) {
  return (
    <span className={`section-label eyebrow ${className}`}>
      <span className="section-label__marker" aria-hidden="true"><Play className="w-2 h-2 fill-current" /></span>
      <span>{children}{trail && ' .'}</span>
    </span>
  );
}

/** "PART A ." numbered blurb. */
export function Blurb({ part, children, className = '' }: { part: string; children: ReactNode; className?: string }) {
  return <p className={`blurb ${className}`}><span>PART {part} .</span><span>{children}</span></p>;
}

export function IndexBadge({ n, className = '' }: { n: number; className?: string }) {
  return <span className={`index-badge ${className}`} aria-hidden="true">{String(n).padStart(2, '0')}</span>;
}

export function Sticker({ text, spin = false, className = '', style }: { text: string; spin?: boolean; className?: string; style?: CSSProperties }) {
  return <span className={`sticker ${spin ? 'sticker--spin' : ''} ${className}`} style={{ transform: 'rotate(-12deg)', ...style }} aria-hidden="true">{text}</span>;
}

/** Hairline crosshair + faint circle behind a section. */
export function Viewfinder({ size = 640, top = '50%', light = false }: { size?: number | string; top?: string; light?: boolean }) {
  return (
    <div className="viewfinder" aria-hidden="true" style={{ '--vf-size': typeof size === 'number' ? `${size}px` : size, '--vf-top': top, ...(light ? { '--vf-line': 'rgba(0,0,0,.07)' } : {}) } as CSSProperties}>
      <span className="viewfinder__v" /><span className="viewfinder__h" /><span className="viewfinder__c" />
    </div>
  );
}

/** Tilted perforated band. Dark in the hero; turns red and tilts further once the page scrolls. */
export function FilmStrip({ red = false, tilt = -1, holes = 52 }: { red?: boolean; tilt?: number; holes?: number }) {
  return (
    <div className={`film-strip ${red ? 'film-strip--red' : ''}`} aria-hidden="true">
      <div className="film-strip__band" style={{ '--strip-tilt': `${tilt}deg` } as CSSProperties}>
        {Array.from({ length: holes }, (_, i) => <span key={i} />)}
      </div>
    </div>
  );
}

/** Round stat: small tilted label over a big value. */
export function StatDisc({ label, value, tone = 'light' }: { label: string; value: ReactNode; tone?: 'light' | 'accent' | 'dark' }) {
  return (
    <div className={`stat-disc stat-disc--${tone}`}>
      <span className="stat-disc__label">{label}</span>
      <span className="stat-disc__value">{value}</span>
    </div>
  );
}
