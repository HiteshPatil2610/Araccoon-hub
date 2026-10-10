import { useRef, type CSSProperties, type ReactNode } from 'react';
import { descriptionSummary } from '../../shared/productCopy';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
import { Blurb, FilmStrip, HERO_CUES, IndexBadge, Reveal, SectionLabel, StatDisc, Sticker, UnfoldText, Viewfinder, useHeroEntrance, usePrefersReducedMotion } from './cine';
import { useStoryEntrance } from '../lib/useStoryEntrance';
import { ProductImage } from './ProductImage';
import { storeLabel } from './ProductCard';
import { CATEGORIES, type PublicProduct } from '../../shared/types';

/* The storefront's editorial sections, modelled on the reference feature page:
   Picks ("production" curtain), Story ("directed by" + booking card) and Closing ("in theaters"). */

const pad = (n: number) => String(n).padStart(2, '0');
const added = (iso: string) => new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' });

const MASCOT_ART = {
  hero: 'raccoon-hero-crossed-arms',
  box: 'raccoon-picks-box',
  presenter: 'raccoon-story-card-presenter',
  heart: 'raccoon-closing-heart',
} as const;

/** Keep the placement fixed while the artwork grows upward from its bottom anchor. */
function HeroArt({ children }: { children: ReactNode }) {
  const ready = useHeroEntrance();
  return <div className={`cd-hero__art ${ready !== false ? 'cd-hero__art--shown' : ''}`}
    style={{ '--mascot-delay': `${HERO_CUES.mascot}ms` } as CSSProperties}>{children}</div>;
}

/** Pose-specific decorative cutouts; the live product card remains a separate interactive layer. */
export function Cutout({ name, className, delay = 200, distance = 56, scroll = false }: { name: keyof typeof MASCOT_ART; className: string; delay?: number; distance?: number; scroll?: boolean }) {
  const art = <img src={`/art/video-concept/${MASCOT_ART[name]}.webp`} alt="" decoding="async" loading={name === 'hero' ? 'eager' : 'lazy'} fetchPriority={name === 'hero' ? 'high' : 'auto'} draggable={false} />;
  if (name === 'hero') return (
    <div className={`cd-cutout ${className}`} data-morph="type">
      <HeroArt>{art}</HeroArt>
    </div>
  );
  return (
    scroll ? <div className={`cd-cutout ${className}`}><div className="cd-picks__art">{art}</div></div> :
    <Reveal effect="rise" distance={distance} delay={delay} duration={850} once className={`cd-cutout ${className}`} morph="type">
      {art}
    </Reveal>
  );
}

/** +1 when the carousel moved forward (including wrap-around), -1 when it moved back. */
function useDirection(index: number, length: number) {
  const prev = useRef(index);
  const dir = useRef(1);
  if (prev.current !== index) {
    const fwd = (prev.current + 1) % Math.max(length, 1) === index;
    const back = (prev.current - 1 + length) % Math.max(length, 1) === index;
    dir.current = fwd ? 1 : back ? -1 : Math.sign(index - prev.current) || 1;
    prev.current = index;
  }
  return dir.current;
}

const CINE = [0.7, 0, 0.2, 1] as const;
const swap = {
  enter: (d: number) => ({ opacity: 0, x: d * 56, filter: 'blur(10px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: CINE } },
  exit: (d: number) => ({ opacity: 0, x: d * -56, filter: 'blur(10px)', transition: { duration: 0.32, ease: CINE } }),
};
const deal = {
  enter: (d: number) => ({ opacity: 0, x: d * 90, rotate: d * 6, scale: 0.96 }),
  center: { opacity: 1, x: 0, rotate: 0, scale: 1, transition: { duration: 0.65, ease: CINE } },
  exit: (d: number) => ({ opacity: 0, x: d * -90, rotate: d * -6, scale: 0.96, transition: { duration: 0.3, ease: CINE } }),
};
const instantSwap = {
  enter: { opacity: 1, x: 0, rotate: 0, scale: 1, filter: 'none' },
  center: { opacity: 1, x: 0, rotate: 0, scale: 1, filter: 'none', transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

/** Swaps its child when `id` changes: the old one leaves against the direction of travel, the new one arrives with it. */
function Swap({ id, dir, kind = 'swap', className, children }: { id: string; dir: number; kind?: 'swap' | 'deal'; className?: string; children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <AnimatePresence mode="wait" custom={dir} initial={false}>
      <motion.div key={id} custom={dir} variants={reducedMotion ? instantSwap : kind === 'deal' ? deal : swap} initial="enter" animate="center" exit="exit" className={className}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

interface CarouselProps {
  picks: PublicProduct[];
  index: number;
  onIndex: (i: number) => void;
  onQuick: (p: PublicProduct) => void;
}

function ScrollCue({ start = 0, className = '', children }: { start?: number; className?: string; children: ReactNode }) {
  return <div className={`cd-scroll-cue ${className}`} style={{ '--cue-start': start } as CSSProperties}>{children}</div>;
}

export function PicksSection({ total, picks, index, onIndex, onQuick }: CarouselProps & { total: number | null }) {
  const pick = picks[index];
  const dir = useDirection(index, picks.length);
  const step = (d: number) => picks.length && onIndex((index + d + picks.length) % picks.length);
  return (
    <section id="picks" className="cd-picks" data-nav-tone="dark" data-morph-root aria-labelledby="picks-title">
      <div className="cd-picks__divider"><FilmStrip red tilt={-2} direction="left" holes={80} /></div>
      <Viewfinder size="min(560px, 88vw)" top="58%" />
      <div className="cd-picks__grid">
        <ScrollCue className="cd-picks__left">
          <SectionLabel>Editor's picks</SectionLabel>
          <h2 id="picks-title" className="cd-lockup !text-[28px] !leading-none"><b>Raccoon</b><span>Hub</span></h2>
          <ScrollCue start={.25} className="cd-picks__index">
            <IndexBadge n={2} />
            <span className="cd-stars" aria-label="Hand-picked">★★★★<span>★</span></span>
          </ScrollCue>
        </ScrollCue>
        <div className="cd-picks__discs">
          <ScrollCue start={.05}><StatDisc label="Finds" value={total == null ? '—' : pad(total)} /></ScrollCue>
          <ScrollCue start={.16}><StatDisc tone="accent" label="Picks" value={pad(picks.length)} /></ScrollCue>
          <ScrollCue start={.27}><StatDisc tone="dark" label="Aisles" value={pad(CATEGORIES.length)} /></ScrollCue>
        </div>
        <div className="cd-quote">
          {pick ? (
            <>
              <Swap id={pick.id} dir={dir}>
                <ScrollCue start={.28} className="cd-scroll-cue--focus"><p className="cd-quote__text">{pick.title}</p></ScrollCue>
                <ScrollCue start={.45} className="cd-scroll-cue--focus"><p className="mt-3 text-xs text-[var(--cd-gray-300)] line-clamp-3">{descriptionSummary(pick.description)}</p></ScrollCue>
              </Swap>
              <ScrollCue start={.55}>
              <button type="button" className="mt-3 inline-flex items-center gap-1 min-h-11 eyebrow text-white hover:text-[var(--cd-red-300)]" onClick={() => onQuick(pick)}>
                View details <ArrowUpRight className="w-4 h-4" aria-hidden="true" /><span className="sr-only">: {pick.title}</span>
              </button>
              {picks.length > 1 && (
                <div className="cd-dots" role="group" aria-label="Choose a pick">
                  {picks.map((p, i) => <button key={p.id} type="button" aria-current={i === index} aria-label={`Pick ${i + 1}: ${p.title}`} onClick={() => onIndex(i)} />)}
                </div>
              )}
              </ScrollCue>
            </>
          ) : (
            <ScrollCue start={.28}><p className="cd-quote__text">New picks land here as soon as the raccoon finds them.</p></ScrollCue>
          )}
        </div>
      </div>
      <div className="cd-picks__lower">
        <Cutout name="box" className="cd-picks__raccoon" scroll />
        {picks.length > 1 && (
          <>
            <button type="button" data-morph className="cd-picks__nav cd-picks__nav--prev" onClick={() => step(-1)} aria-label="Previous pick"><ChevronLeft className="w-6 h-6" /></button>
            <button type="button" data-morph className="cd-picks__nav cd-picks__nav--next" onClick={() => step(1)} aria-label="Next pick"><ChevronRight className="w-6 h-6" /></button>
          </>
        )}
      </div>
    </section>
  );
}

function FindCard({ pick, n, of, onOpen, onQuick, pending }: { pick: PublicProduct; n: number; of: number; onOpen: (p: PublicProduct) => void; onQuick: (p: PublicProduct) => void; pending: boolean }) {
  return (
    <article className="cd-find-card" aria-label={`Find ${n} of ${of}: ${pick.title}`}>
      <span className="cd-find-card__notch" aria-hidden="true"><Ticket className="w-4 h-4" /></span>
      <span className="cd-find-card__kicker">Find {pad(n)}/{pad(of)}</span>
      <h3 className="cd-find-card__title">{pick.title}</h3>
      <div className="cd-find-card__tiles">
        <button type="button" className="cd-tile cd-tile--img" onClick={() => onQuick(pick)} aria-label={`View details: ${pick.title}`}>
          <ProductImage src={pick.imageUrl} title={pick.title} compact />
        </button>
        <div className="cd-tile aspect-square"><span className="text-red text-[8px]" aria-hidden="true">▼</span><span className="cd-tile__cap">Aisle</span><span className="cd-tile__val">{pick.category}</span></div>
        <div className="cd-tile"><span className="cd-tile__cap">Store</span><span className="cd-tile__val">{storeLabel(pick.store)}</span></div>
        <div className="cd-tile"><span className="cd-tile__cap">Added</span><span className="cd-tile__val">{added(pick.createdAt)}</span></div>
      </div>
      <button type="button" disabled={pending} className="btn btn-primary btn-bar mt-1" onClick={() => onOpen(pick)}>
        View on {storeLabel(pick.store)} <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </article>
  );
}

function Stills({ items, onQuick }: { items: PublicProduct[]; onQuick: (p: PublicProduct) => void }) {
  if (!items.length) return null;
  return (
    <div className="cd-stills">
      {items.slice(0, 2).map((p, i) => (
        <Reveal key={p.id} effect={i ? 'slide-left' : 'rise'} distance={50} delay={400 + i * 120} className={`cd-still-frame ${i ? 'cd-still-frame--b' : 'cd-still-frame--a'}`} morph>
          <button type="button" className="w-full h-full bg-white" onClick={() => onQuick(p)} aria-label={`View details: ${p.title}`}>
            <ProductImage src={p.imageUrl} title={p.title} compact />
          </button>
        </Reveal>
      ))}
    </div>
  );
}

export function StorySection({ picks, index, onIndex, onQuick, onOpen, pending }: CarouselProps & { onOpen: (p: PublicProduct) => void; pending: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  useStoryEntrance(sectionRef, titleRef, reducedMotion);
  const pick = picks[index];
  const dir = useDirection(index, picks.length);
  const others = picks.filter((_, i) => i !== index);
  const step = (d: number) => picks.length && onIndex((index + d + picks.length) % picks.length);
  return (
    <section ref={sectionRef} id="story" className="cd-story" data-nav-tone="light" data-morph-root aria-labelledby="story-title">
      <Viewfinder size="min(760px, 96vw)" top="62%" />
      <div className="cd-story__directed" ref={titleRef}>
        <h2 id="story-title">
          <span className="sr-only">Curated by Raccoon</span>
          <UnfoldText text="Curated" className="cd-story__big cd-story__big--curated" />
          <UnfoldText text="by" start={.08} end={.7} className="cd-story__by" />
          <UnfoldText text="Raccoon" start={.14} end={1} className="cd-story__big cd-story__big--name" />
        </h2>
      </div>
      <div className="cd-story__index" aria-hidden="true"><span>01</span><span>02</span><span>03</span><span>04</span></div>

      <div className="cd-story__head" aria-live="polite" data-morph="move">
        {pick ? (
          <Swap id={pick.id} dir={dir}><h3>{pick.title}: everything about the find!</h3></Swap>
        ) : (
          <h3>Small finds, big everyday upgrades!</h3>
        )}
        {picks.length > 1 && (
          <div className="cd-arrows" role="group" aria-label="Browse picks">
            <button type="button" onClick={() => step(1)} aria-label="Next pick"><svg viewBox="0 0 60 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M0 6h58M52 1l6 5-6 5" /></svg></button>
            <button type="button" onClick={() => step(-1)} aria-label="Previous pick"><svg viewBox="0 0 60 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M60 6H2M8 1 2 6l6 5" /></svg></button>
          </div>
        )}
      </div>

      <div className="cd-story__aside">
        {picks.length > 1 ? (
          <div className="cd-avatars" data-morph="move" role="group" aria-label="Jump to a pick">
            {picks.map((p, i) => <button key={p.id} type="button" aria-current={i === index} aria-label={`Pick ${i + 1}: ${p.title}`} onClick={() => onIndex(i)}><ProductImage src={p.imageUrl} title={p.title} compact /></button>)}
          </div>
        ) : <span />}
        <Reveal effect="fade" delay={200} once className="sticker-wrap hidden sm:inline-flex" morph><IndexBadge n={3} /><Sticker text="Pick" /></Reveal>
      </div>

      <div className="cd-story__grid">
        <Reveal effect="fade" delay={450} once className="cd-story__col" morph="move">
          <SectionLabel>{pick?.category ?? 'The idea'}</SectionLabel>
          <Blurb part="C">{pick ? descriptionSummary(pick.description) : 'Desk essentials, clever gadgets and unexpected home finds, picked one at a time.'}</Blurb>
          <Stills items={[others[0], others[1]].filter((p): p is PublicProduct => !!p)} onQuick={onQuick} />
        </Reveal>
        <div className="cd-story__center">
          {pick && (
            <Reveal effect="rise" distance={40} delay={250} className="w-full flex justify-center" morph="move">
              <Swap id={pick.id} dir={dir} kind="deal" className="w-full flex justify-center"><FindCard pick={pick} n={index + 1} of={picks.length} onOpen={onOpen} onQuick={onQuick} pending={pending} /></Swap>
            </Reveal>
          )}
          <Cutout name="presenter" className="cd-story__raccoon" delay={300} distance={48} />
        </div>
        <Reveal effect="fade" delay={550} once className="cd-story__col cd-story__col--r" morph="move">
          <SectionLabel>Opening on Amazon</SectionLabel>
          <Blurb part="D">Every find opens on Amazon in a new tab, where prices and availability are set. No accounts, no checkout here.</Blurb>
          <Stills items={[others[1], others[0]].filter((p): p is PublicProduct => !!p)} onQuick={onQuick} />
        </Reveal>
      </div>
    </section>
  );
}
