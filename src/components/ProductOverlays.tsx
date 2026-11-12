import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Bookmark, CheckCircle2, Dices, ExternalLink, Share2, X } from 'lucide-react';
import { Dialog } from './Dialog';
import { ProductImage } from './ProductImage';
import { storeLabel } from './ProductCard';
import { ProductDescription } from './ProductDescription';
import { SectionLabel } from './cine';
import type { OutboundSource, useOutbound } from '../lib/outbound';
import type { PublicProduct } from '../../shared/types';
import { findPath } from '../../shared/finds';
import { useToast } from './Toasts';
import { useStash } from '../lib/stash';

/** Quick-view dialog and the "Opening Amazon" notice, shared by every page that lists products. */
export function ProductOverlays({ quick, onCloseQuick, outbound, from, surprise = false, onSurprise }: {
  quick: PublicProduct | null; onCloseQuick: () => void; outbound: ReturnType<typeof useOutbound>; from?: OutboundSource;
  /** The find was chosen by "Surprise me"; `onSurprise` swaps in another one. */
  surprise?: boolean; onSurprise?: () => void;
}) {
  const toast = useToast();
  const stash = useStash();
  // Phones and tablets get the device share sheet; elsewhere the link is copied.
  const share = async (find: PublicProduct) => {
    const url = `${window.location.origin}${findPath(find)}`;
    try {
      if (typeof navigator.share === 'function' && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: find.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast('success', 'Link copied. Paste it anywhere to share this find.');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return; // the visitor closed the share sheet
      toast('error', `Could not copy the link: ${url}`);
    }
  };
  return (
    <>
      <Dialog open={quick !== null} onClose={onCloseQuick} title={quick?.title ?? ''} wide animated>
        {quick && (
          <div className="grid sm:grid-cols-2 gap-6 min-w-0">
            <div className="cd-still aspect-square"><ProductImage src={quick.imageUrl} title={quick.title} className="w-full h-full object-contain p-[8%]" /></div>
            <div className="flex flex-col min-w-0">
              {surprise && (
                <p className="surprise-note" role="status">
                  <img src="/art/video-concept/raccoon-picks-box-720.webp" alt="" width={604} height={720} decoding="async" draggable={false} />
                  <span className="eyebrow text-red">The raccoon dug this one out for you</span>
                </p>
              )}
              <SectionLabel className="text-muted-fg">{quick.category}</SectionLabel>
              {quick.pickNote && (
                <figure className="pick-note">
                  <figcaption className="eyebrow text-red">Why we picked it</figcaption>
                  <blockquote className="mt-2">{quick.pickNote}</blockquote>
                </figure>
              )}
              <ProductDescription text={quick.description} className="mt-4 mb-6" />
              <button type="button" disabled={outbound.state?.status === 'opening'} className="btn btn-primary btn-bar mt-auto" onClick={() => { void outbound.open(quick, from); onCloseQuick(); }}>
                View on {storeLabel(quick.store)} <ArrowUpRight className="w-4 h-4" />
              </button>
              <p className="mt-2 text-xs text-muted-fg">Opens Amazon in a new tab. Prices are set by Amazon.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={`btn ${stash.ids.includes(quick.id) ? 'btn-mint' : ''}`} aria-pressed={stash.ids.includes(quick.id)} title="Kept in this browser only" onClick={() => stash.toggle(quick.id)}>
                  <Bookmark className="w-4 h-4" aria-hidden="true" fill={stash.ids.includes(quick.id) ? 'currentColor' : 'none'} /> {stash.ids.includes(quick.id) ? 'In your stash' : 'Save to stash'}
                </button>
                <button type="button" className="btn" onClick={() => void share(quick)}><Share2 className="w-4 h-4" aria-hidden="true" /> Share this find</button>
                {surprise && onSurprise && <button type="button" className="btn" onClick={onSurprise}><Dices className="w-4 h-4" aria-hidden="true" /> Another one</button>}
              </div>
            </div>
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
