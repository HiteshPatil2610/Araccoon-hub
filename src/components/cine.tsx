import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { Play } from 'lucide-react';

/* Cine Daily primitives: scroll-choreographed entrances and the small editorial pieces of the design system. */

const prefersReduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const subscribeMotion = (onChange: () => void) => {
  if (typeof matchMedia === 'undefined') return () => {};
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  preference.addEventListener('change', onChange);
  return () => preference.removeEventListener('change', onChange);
};
const serverMotionPreference = () => false;

/** Respond to preference changes while the page is open, including ongoing JS animations. */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeMotion, prefersReduced, serverMotionPreference);
}

/** True while the element is in view (replays on re-entry unless `once`). Reduced motion is always "shown". */
export function useReveal<T extends Element>(ref: React.RefObject<T | null>, { once = false, threshold = 0.2, enabled = true } = {}) {
  const reducedMotion = usePrefersReducedMotion();
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e!.isIntersecting && e!.intersectionRatio >= Math.min(threshold, 0.99)) { setInView(true); if (once) io.disconnect(); }
      else if (!e!.isIntersecting && !once) setInView(false);
    }, { threshold: [0, threshold] });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, once, threshold, enabled]);
  return reducedMotion || inView;
}

// These are chosen timings for our adaptation; the reference JPEGs do not contain timestamps.
export const HERO_CUES = {
  title: 60, letterStep: 100, wave: 2900, mascot: 180, disc: 320, hub: 360,
  nav: 450, strip: 680, captions: 320, story: 1150, cta: 1250, badge: 1370,
} as const;
const HeroEntranceContext = createContext<boolean | null>(null);
export const useHeroEntrance = () => useContext(HeroEntranceContext);

/** One painted initial state and shared clock, independent of catalog fetches and scroll position. */
export function HeroEntrance({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  useEffect(() => {
    let cancelled = false, firstFrame = 0, secondFrame = 0;
    const start = () => {
      if (cancelled || firstFrame) return;
      clearTimeout(deadline);
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => { if (!cancelled) setReady(true); });
      });
    };
    // Prefer loaded display fonts/art, but never let a slow asset hold the page indefinitely.
    const deadline = window.setTimeout(start, 1200);
    const art = new Image();
    art.src = '/art/video-concept/raccoon-hero-crossed-arms.webp';
    void Promise.allSettled([document.fonts?.ready, typeof art.decode === 'function' ? art.decode() : Promise.resolve()]).then(start);
    return () => { cancelled = true; clearTimeout(deadline); cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); };
  }, []);
  return <HeroEntranceContext.Provider value={ready || reducedMotion}>{children}</HeroEntranceContext.Provider>;
}

function useEntrance<T extends Element>(ref: React.RefObject<T | null>, { hero = false, once = false, threshold = 0.2 } = {}) {
  const cue = useHeroEntrance();
  const local = useReveal(ref, { once, threshold, enabled: !hero || cue === null });
  return hero && cue !== null ? cue : local;
}

/** Metadata uses the navbar's whole-group drop, with no per-character transforms. */
export function HeroMetadata({ children }: { children: ReactNode }) {
  const ready = useHeroEntrance();
  const reducedMotion = usePrefersReducedMotion();
  const [done, setDone] = useState(false);
  useEffect(() => { if (reducedMotion) setDone(true); }, [reducedMotion]);
  const intro = ready !== null && !done && !reducedMotion;
  return <div className={`cd-hero__meta ${intro ? 'cd-hero__meta--intro' : ''} ${intro && ready ? 'cd-hero__meta--shown' : ''}`}
    style={{ '--nav-entry-delay': `${HERO_CUES.nav}ms` } as CSSProperties}
    onFocusCapture={() => setDone(true)} onAnimationEnd={e => { if (e.animationName === 'hero-nav-arrive') setDone(true); }}>
    {children}
  </div>;
}

type Effect = 'fade' | 'rise' | 'grow-rise' | 'drop' | 'slide-left' | 'slide-right' | 'pop' | 'spin' | 'blur' | 'mask' | 'wipe-x';
const HIDDEN: Record<Effect, (d: number) => { opacity?: number; t?: string; f?: string; clip?: string }> = {
  fade: () => ({ opacity: 0 }),
  rise: d => ({ opacity: 0, t: `translateY(${d}px)` }),
  'grow-rise': d => ({ opacity: 0, t: `translateY(${d}px) scale(.76)` }),
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

/** Fixed letter slots give the poster a narrow-to-solid reveal without text reflow. */
export function PosterTitle({ text, label, id }: { text: string; label: string; id: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const shown = useEntrance(ref, { hero: true, once: true });
  const active = useReveal(ref, { threshold: 0.05 });
  return <h1 ref={ref} id={id} aria-label={label} className={`poster-title ${shown ? 'poster-title--shown' : ''} ${active ? 'poster-title--active' : ''}`}>
    <span className="poster-title__letters" aria-hidden="true">
      {Array.from(text).map((letter, index) => <span key={index} className="poster-title__letter" style={{ '--letter-delay': `${HERO_CUES.title + index * HERO_CUES.letterStep}ms`, '--kinetic-delay': `${HERO_CUES.wave + index * 120}ms` } as CSSProperties}><span className="poster-title__reveal"><span className="poster-title__glyph">{letter}</span></span></span>)}
    </span>
  </h1>;
}

/** Reveal a word letter by letter while keeping one accessible text label. */
export function CharacterStagger({ text, delay = 180, stagger = 110 }: { text: string; delay?: number; stagger?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useEntrance(ref, { hero: true, once: true });
  return <span ref={ref} aria-label={text} className={`character-stagger ${shown ? 'character-stagger--shown' : ''}`}>
    {Array.from(text).map((letter, index) => <span key={index} aria-hidden="true" className="character-stagger__letter" style={{ '--character-delay': `${delay + index * stagger}ms` } as CSSProperties}>{letter === ' ' ? '\u00a0' : letter}</span>)}
  </span>;
}

/** Grow the hero backdrop from the mascot's chest; the stage masks its lower arc. */
export function HeroDisc() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useEntrance(ref, { hero: true, once: true });
  return <div ref={ref} className="cd-hero__disc-mask" aria-hidden="true">
    <div className="cd-hero__disc">
      <div className={`cd-hero__disc-fill ${shown ? 'cd-hero__disc-fill--expanded' : ''}`} style={{ '--disc-delay': `${HERO_CUES.disc}ms` } as CSSProperties} />
    </div>
  </div>;
}

export function Reveal({ effect = 'rise', delay = 0, duration = 900, distance = 60, once = false, hero = false, as: T = 'div', className, style, morph, children }: {
  effect?: Effect; delay?: number; duration?: number; distance?: number; once?: boolean; hero?: boolean; as?: ElementType; className?: string; style?: CSSProperties; morph?: Morph; children?: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const shown = useEntrance(ref, { hero, once });
  const h = HIDDEN[effect](distance);
  const ease = hero ? 'var(--ease-hero, var(--ease-cine))' : effect === 'pop' || effect === 'spin' ? 'var(--ease-pop)' : 'var(--ease-cine)';
  const s: CSSProperties = shown
    ? { opacity: 1, transform: h.t ? 'none' : undefined, filter: h.f ? 'none' : undefined, clipPath: h.clip ? 'inset(0 0 0 0)' : undefined, transition:['transform', 'opacity', 'filter', 'clip-path'].map(p => `${p} ${duration}ms ${ease} ${delay}ms`).join(',') }
    : { opacity: h.opacity ?? 1, transform: h.t, filter: h.f, clipPath: h.clip, transition: 'none' };
  // A fully clipped element has no intersection area, so clip effects observe the outer box and clip an inner one.
  if (h.clip) return <T ref={ref} className={className} style={style} {...morphAttr(morph)}><div style={s}>{children}</div></T>;
  return <T ref={ref} className={className} style={{ ...style, ...s }} {...morphAttr(morph)}>{children}</T>;
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
  const reducedMotion = usePrefersReducedMotion();
  const shown = useReveal(ref, { once: true });
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (reducedMotion) { setOut(text); return; }
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
  }, [shown, reducedMotion, text, delay, duration, charset]);
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

/** The entire hero band fades in while its independently animated pattern travels. */
export function FilmStrip({ red = false, tilt = -1, holes = 160, entrance = false }: { red?: boolean; tilt?: number; holes?: number; entrance?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useEntrance(ref, { hero: entrance, once: true, threshold: 0.05 });
  return (
    <div ref={ref} className={`film-strip ${red ? 'film-strip--red' : ''} ${entrance ? 'film-strip--entrance' : ''} ${shown ? 'film-strip--shown' : ''}`} style={{ '--strap-delay': `${HERO_CUES.strip}ms` } as CSSProperties} aria-hidden="true">
      <div className="film-strip__band" style={{ '--strip-tilt': `${tilt}deg`, '--strip-duration': `${holes * 28 / 52}s` } as CSSProperties}>
        <div className="film-strip__tape">
        <div className="film-strip__track">
          {[0, 1].map(copy => (
            <div key={copy} className="film-strip__repeat">
              {Array.from({ length: holes }, (_, i) => (
                <svg key={i} viewBox="0 0 24 18" fill="none" focusable="false">
                  <path fill="currentColor" d="M2 6 1 1l6 3c3-2 7-2 10 0l6-3-1 5c2 3 2 7-1 9-5 4-13 4-18 0C0 13 0 9 2 6Z" />
                  <path fill="var(--strip-eye, #151515)" d="m4 8 6 2-2 3-4-2Zm16 0-6 2 2 3 4-2Z" />
                </svg>
              ))}
            </div>
          ))}
        </div>
        </div>
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
