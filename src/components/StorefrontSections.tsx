import { useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
import { Blurb, IndexBadge, Reveal, ScrambleText, SectionLabel, StatDisc, Sticker, TrackingReveal, Viewfinder } from './cine';
import { ProductImage } from './ProductImage';
import { storeLabel } from './ProductCard';
import { CATEGORIES, type PublicProduct } from '../../shared/types';

/* The storefront's editorial sections, modelled on the reference feature page:
   Picks ("production" curtain), Story ("directed by" + booking card) and Closing ("in theaters"). */

const pad = (n: number) => String(n).padStart(2, '0');
const added = (iso: string) => new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' });

/** Key-art cut-out from public/art/raccoon-<name>.webp: the crimson streetwear raccoon rendered by
    art/araccoon/scripts/site_render.py (front, side, three-quarter, rear). Decorative: it carries no information. */
export function Cutout({ name, className, delay = 450, distance = 120 }: { name: 'hero' | 'side' | 'turn' | 'rear'; className: string; delay?: number; distance?: number }) {
  return (
    <Reveal effect="rise" distance={distance} delay={delay} duration={1200} className={`cd-cutout ${className}`} morph="type">
      <img src={`/art/raccoon-${name}.webp`} alt="" decoding="async" draggable={false} />
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

/** Swaps its child when `id` changes: the old one leaves against the direction of travel, the new one arrives with it. */
function Swap({ id, dir, kind = 'swap', className, children }: { id: string; dir: number; kind?: 'swap' | 'deal'; className?: string; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait" custom={dir} initial={false}>
      <motion.div key={id} custom={dir} variants={kind === 'deal' ? deal : swap} initial="enter" animate="center" exit="exit" className={className}>
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

export function PicksSection({ total, picks, index, onIndex, onQuick }: CarouselProps & { total: number | null }) {
  const pick = picks[index];
  const dir = useDirection(index, picks.length);
  const step = (d: number) => picks.length && onIndex((index + d + picks.length) % picks.length);
  return (
    <section id="picks" className="cd-picks" data-nav-tone="dark" data-morph-root aria-labelledby="picks-title">
      <Viewfinder size="min(760px, 96vw)" top="62%" />
      <div className="cd-picks__grid">
        <Reveal effect="slide-left" distance={40} className="cd-picks__left" morph="move">
          <SectionLabel>Editor's picks</SectionLabel>
          <h2 id="picks-title" className="cd-lockup !text-[28px] !leading-none"><b>Raccoon</b><span>Hub</span></h2>
          <IndexBadge n={2} />
          <span className="cd-stars" aria-label="Hand-picked">★★★★<span>★</span></span>
        </Reveal>
        <div className="cd-picks__discs">
          <Reveal effect="pop" delay={150} morph><StatDisc label="Finds" value={total == null ? '—' : <ScrambleText text={pad(total)} charset="0123456789" />} /></Reveal>
          <Reveal effect="pop" delay={270} morph><StatDisc tone="accent" label="Picks" value={pad(picks.length)} /></Reveal>
          <Reveal effect="pop" delay={390} morph><StatDisc tone="dark" label="Aisles" value={pad(CATEGORIES.length)} /></Reveal>
        </div>
        <Reveal effect="slide-right" distance={40} delay={300} className="cd-quote" morph="move">
          {pick ? (
            <>
              <Swap id={pick.id} dir={dir}>
                <p className="cd-quote__text">{pick.title}</p>
                <p className="mt-3 text-xs text-[var(--cd-gray-300)] line-clamp-3">{pick.description}</p>
              </Swap>
              <button type="button" className="mt-3 inline-flex items-center gap-1 min-h-11 eyebrow text-white hover:text-[var(--cd-red-300)]" onClick={() => onQuick(pick)}>
                View details <ArrowUpRight className="w-4 h-4" aria-hidden="true" /><span className="sr-only">: {pick.title}</span>
              </button>
              {picks.length > 1 && (
                <div className="cd-dots" role="group" aria-label="Choose a pick">
                  {picks.map((p, i) => <button key={p.id} type="button" aria-current={i === index} aria-label={`Pick ${i + 1}: ${p.title}`} onClick={() => onIndex(i)} />)}
                </div>
              )}
            </>
          ) : (
            <p className="cd-quote__text">New picks land here as soon as the raccoon finds them.</p>
          )}
        </Reveal>
      </div>
      <Cutout name="side" className="cd-picks__raccoon" delay={450} />
      {picks.length > 1 && (
        <>
          <button type="button" data-morph className="cd-picks__nav cd-picks__nav--prev" onClick={() => step(-1)} aria-label="Previous pick"><ChevronLeft className="w-6 h-6" /></button>
          <button type="button" data-morph className="cd-picks__nav cd-picks__nav--next" onClick={() => step(1)} aria-label="Next pick"><ChevronRight className="w-6 h-6" /></button>
        </>
      )}
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
  const pick = picks[index];
  const dir = useDirection(index, picks.length);
  const others = picks.filter((_, i) => i !== index);
  const step = (d: number) => picks.length && onIndex((index + d + picks.length) % picks.length);
  return (
    <section id="story" className="cd-story" data-nav-tone="light" data-morph-root aria-labelledby="story-title">
      <Viewfinder size="min(760px, 96vw)" top="62%" light />
      <div className="cd-story__directed">
        <h2 id="story-title">
          <TrackingReveal from="0.4em" className="cd-story__big" morph="type">Curated</TrackingReveal>
          <Reveal effect="fade" delay={300} className="cd-story__by" morph="move">by</Reveal>
          <TrackingReveal from="0.4em" delay={150} className="cd-story__big" morph="type">The Raccoon</TrackingReveal>
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
        <Reveal effect="spin" delay={300} className="sticker-wrap hidden sm:inline-flex" morph><IndexBadge n={3} /><Sticker text="Pick" spin /></Reveal>
      </div>

      <div className="cd-story__grid">
        <Reveal effect="slide-left" distance={40} delay={300} className="cd-story__col" morph="move">
          <SectionLabel>{pick?.category ?? 'The idea'}</SectionLabel>
          <Blurb part="C">{pick ? pick.description : 'Desk essentials, clever gadgets and unexpected home finds, picked one at a time.'}</Blurb>
          <Stills items={[others[0], others[1]].filter((p): p is PublicProduct => !!p)} onQuick={onQuick} />
        </Reveal>
        <div className="cd-story__center">
          {pick && (
            <Reveal effect="rise" distance={40} delay={250} className="w-full flex justify-center" morph="move">
              <Swap id={pick.id} dir={dir} kind="deal" className="w-full flex justify-center"><FindCard pick={pick} n={index + 1} of={picks.length} onOpen={onOpen} onQuick={onQuick} pending={pending} /></Swap>
            </Reveal>
          )}
          <Cutout name="turn" className="cd-story__raccoon" delay={600} distance={140} />
        </div>
        <Reveal effect="slide-right" distance={40} delay={300} className="cd-story__col cd-story__col--r" morph="move">
          <SectionLabel>Opening on Amazon</SectionLabel>
          <Blurb part="D">Every find opens on Amazon in a new tab, where prices and availability are set. No accounts, no checkout here.</Blurb>
          <Stills items={[others[1], others[0]].filter((p): p is PublicProduct => !!p)} onQuick={onQuick} />
        </Reveal>
      </div>
    </section>
  );
}

export function ClosingSection({ total }: { total: number | null }) {
  return (
    <section className="cd-closing" data-nav-tone="light" data-morph-root aria-labelledby="closing-title">
      <Viewfinder size="min(680px, 92vw)" top="58%" light />
      <Reveal effect="fade" className="relative z-[1]"><span className="eyebrow !tracking-[.42em]">Now on Amazon</span></Reveal>
      <TrackingReveal from="0.3em" delay={100} morph="type"><h2 id="closing-title">Raccoon Hub</h2></TrackingReveal>
      <div className="cd-closing__dates" aria-hidden="true" data-morph="move">
        <span>{total == null ? '—' : <ScrambleText text={`${pad(total)} finds`} delay={500} />}</span>
        <span><ScrambleText text={String(new Date().getFullYear())} charset="0123456789" delay={600} /></span>
      </div>
      <Cutout name="rear" className="cd-closing__raccoon" delay={300} distance={140} />
    </section>
  );
}
