import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, CheckCircle2, ChevronLeft, ChevronRight, Dices, ExternalLink, Share2, X } from 'lucide-react';
import { Dialog } from './Dialog';
import { ProductImage } from './ProductImage';
import { storeLabel } from './ProductCard';
import { ProductDescription } from './ProductDescription';
import { SectionLabel } from './cine';
import type { OutboundSource, useOutbound } from '../lib/outbound';
import type { PublicProduct } from '../../shared/types';
import { findPath } from '../../shared/finds';
import { TIER_LABELS } from '../../shared/productFacts';
import { useToast } from './Toasts';
import { QuickViewSave } from './ListPicker';
import { shareLink } from '../lib/share';
import { neighbours, relatedFinds } from '../lib/catalog';

/** Quick-view dialog and the "Opening Amazon" notice, shared by every page that lists products. */
export function ProductOverlays({ quick, onCloseQuick, outbound, from, surprise = false, onSurprise, browse, pool, onShow }: {
  quick: PublicProduct | null; onCloseQuick: () => void; outbound: ReturnType<typeof useOutbound>; from?: OutboundSource;
  /** The find was chosen by "Surprise me"; `onSurprise` swaps in another one. */
  surprise?: boolean; onSurprise?: () => void;
  /** The finds the visitor is browsing, in display order (previous / next), and where "More like this" draws from (defaults to `browse`). */
  browse?: readonly PublicProduct[]; pool?: readonly PublicProduct[];
  /** Shows another find in the open Quick View. Without it there is no stepping and no "More like this". */
  onShow?: (find: PublicProduct) => void;
}) {
  const toast = useToast();
  const root = useRef<HTMLDivElement>(null);
  const nav = quick && onShow && browse ? neighbours(browse, quick.id) : null;
  const more = quick && onShow ? relatedFinds(pool ?? browse ?? [], quick) : null;
  // Finds asked for but not shown yet: the address can update after the next key press, so steps count from the last one asked for.
  const requested = useRef<string[]>([]);
  // A "More like this" tile disappears when its find opens, so focus moves to the dialog instead of being lost.
  const jumped = useRef(false);
  const show = (find: PublicProduct, jump = false) => { jumped.current = jump; requested.current.push(find.id); onShow?.(find); };
  const quickId = quick?.id;
  useEffect(() => {
    const at = quickId ? requested.current.indexOf(quickId) : -1;
    requested.current = at < 0 ? [] : requested.current.slice(at + 1); // anything else (Back, Another one) starts afresh
    if (!quickId) return;
    root.current?.parentElement?.scrollTo({ top: 0 });
    if (jumped.current) root.current?.closest<HTMLElement>('[role=dialog]')?.focus();
    jumped.current = false;
  }, [quickId]);
  // The arrows, arrow keys and swipes step through the list.
  const step = useRef<(dir: -1 | 1) => void>(() => {});
  step.current = dir => {
    const from = requested.current.at(-1) ?? quickId;
    const around = from && browse ? neighbours(browse, from) : null;
    if (around) show(dir < 0 ? around.prev : around.next);
  };
  const stepping = nav !== null;
  useEffect(() => {
    if (!stepping) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.defaultPrevented || e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (!root.current?.closest('[role=dialog]')?.contains(target)) return;
      e.preventDefault();
      step.current(e.key === 'ArrowLeft' ? -1 : 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [stepping]);
  // Swipe on the photo (touch only): a mostly sideways drag of 48px or more steps.
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onSwipeEnd = (e: ReactPointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || e.pointerType !== 'touch') return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.5) step.current(dx > 0 ? -1 : 1);
  };
  const share = (find: PublicProduct) => shareLink(`${window.location.origin}${findPath(find)}`, find.title, toast, 'Link copied. Paste it anywhere to share this find.');
  return (
    <>
      <Dialog open={quick !== null} onClose={onCloseQuick} title={quick?.title ?? ''} wide animated>
        {quick && (
          <div ref={root}>
            <div className="quick-view">
              {surprise && (
                <p className="surprise-note quick-view__surprise" role="status">
                  <img src="/art/video-concept/raccoon-picks-box-720.webp" alt="" width={604} height={720} decoding="async" draggable={false} />
                  <span className="eyebrow text-red">The raccoon dug this one out for you</span>
                </p>
              )}
              {/* Image and actions stay in view while long descriptions scroll beside them. */}
              <div className="quick-view__aside">
                <div className={`cd-still aspect-square quick-view__frame ${nav ? 'quick-view__frame--steps' : ''}`}
                  onPointerDown={e => { if (nav && e.pointerType === 'touch') swipe.current = { x: e.clientX, y: e.clientY }; }}
                  onPointerUp={onSwipeEnd} onPointerCancel={() => { swipe.current = null; }}>
                  <ProductImage key={quick.id} src={quick.imageUrl} title={quick.title} className="w-full h-full object-contain p-[8%]" />
                  {nav && <>
                    <button type="button" className="quick-view__step quick-view__step--prev" onClick={() => step.current(-1)} aria-label={`Previous find: ${nav.prev.title}`}><ChevronLeft className="w-5 h-5" aria-hidden="true" /></button>
                    <button type="button" className="quick-view__step quick-view__step--next" onClick={() => step.current(1)} aria-label={`Next find: ${nav.next.title}`}><ChevronRight className="w-5 h-5" aria-hidden="true" /></button>
                    <span className="quick-view__count" aria-hidden="true">{nav.position} / {nav.total}</span>
                  </>}
                </div>
                {nav && <p className="sr-only" aria-live="polite">Find {nav.position} of {nav.total}: {quick.title}</p>}
                <div>
                  <button type="button" disabled={outbound.state?.status === 'opening'} className="btn btn-primary btn-bar" onClick={() => { void outbound.open(quick, from); onCloseQuick(); }}>
                    View on {storeLabel(quick.store)} <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <p className="mt-2 text-xs text-muted-fg">Opens Amazon in a new tab. Prices are set by Amazon.</p>
                </div>
                <div className="quick-view__actions">
                  <QuickViewSave key={quick.id} product={quick} />
                  <button type="button" className="btn" onClick={() => void share(quick)}><Share2 className="w-4 h-4" aria-hidden="true" /> Share this find</button>
                  {surprise && onSurprise && <button type="button" className="btn" onClick={onSurprise}><Dices className="w-4 h-4" aria-hidden="true" /> Another one</button>}
                </div>
              </div>
              <div className="quick-view__body">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <SectionLabel className="text-muted-fg">{quick.category}</SectionLabel>
                  {quick.badge && <span className="chip !bg-red !border-red !text-white">{quick.badge}</span>}
                  {quick.tier && <span className="chip">{TIER_LABELS[quick.tier]}</span>}
                </div>
                {(quick.brand || quick.productType) && (
                  <p className="mt-3 text-sm text-muted-fg">{[quick.brand, quick.productType].filter(Boolean).join(' · ')}</p>
                )}
                {quick.pickNote && (
                  <figure className="pick-note">
                    <figcaption className="eyebrow text-red">Why we picked it</figcaption>
                    <blockquote className="mt-2">{quick.pickNote}</blockquote>
                  </figure>
                )}
                <ProductDescription text={quick.description} className="mt-4" />
              </div>
            </div>
            {/* Outside the two columns, so the sticky image and actions never ride over it. */}
            {more && more.finds.length > 0 && (
              <section className="quick-view__more" aria-labelledby="quick-view-more">
                <h3 id="quick-view-more" className="eyebrow text-muted-fg">{more.similar ? 'More like this' : 'More finds'}</h3>
                <ul className="quick-view__more-list">
                  {more.finds.map(p => (
                    <li key={p.id}>
                      <button type="button" className="quick-view__tile" onClick={() => show(p, true)}>
                        <span className="cd-still quick-view__tile-image"><ProductImage src={p.imageUrl} title={p.title} compact className="w-full h-full object-contain p-[10%]" /></span>
                        <span className="quick-view__tile-title">{p.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </Dialog>

      <AnimatePresence>
        {outbound.state && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            role="status" className="fixed bottom-6 left-4 right-4 sm:left-auto sm:w-96 z-50 rounded-[var(--radius-l)] bg-ink-700 text-white shadow-[var(--shadow-card)] px-4 pb-4 pt-6">
            {/* BookingCard notch medallion */}
            <span className="absolute -top-[18px] left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-red border-[3px] border-ink-700 flex items-center justify-center" aria-hidden="true"><CheckCircle2 className="w-4 h-4" /></span>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="eyebrow text-[var(--cd-gray-300)]">
                  {outbound.state.status === 'opening' ? 'Opening Amazon…' : outbound.state.status === 'opened' ? 'Opened in a new tab' : 'Your browser blocked the new tab'}
                </p>
                <p className="font-display text-2xl leading-none mt-2 truncate">{outbound.state.product.title}</p>
                {outbound.state.status === 'blocked' && outbound.state.url && (
                  <a href={outbound.state.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-bar mt-3">
                    Open on Amazon <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <button type="button" disabled={outbound.state.status === 'opening'} onClick={outbound.dismiss} aria-label="Dismiss" className="icon-btn !border-white/40"><X className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
