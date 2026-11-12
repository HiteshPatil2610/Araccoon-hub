import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Bookmark, Eye } from 'lucide-react';
import type { PublicProduct } from '../../shared/types';
import { descriptionSummary } from '../../shared/productCopy';
import { ListPicker, useSaveToList } from './ListPicker';

export function storeLabel(store: string) {
  return store === 'amazon.in' ? 'Amazon.in' : store === 'amazon.com' ? 'Amazon' : store;
}

/**
 * Catalog card. The whole card opens Quick View (the Amazon link lives there, so visitors see the find first):
 * the "Quick view" button's ::after covers the card, so a click anywhere lands on one real, focusable button.
 * The save button sits above that layer and opens "Save to a list" without opening Quick View.
 */
export function ProductCard({ product, index, onQuickView }: {
  product: PublicProduct; index: number; onQuickView: (p: PublicProduct) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const save = useSaveToList(product);
  const pickerId = `save-${product.id}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.9, delay: (index % 4) * 0.12, ease: [0.7, 0, 0.2, 1] }}
      className={`group panel paper product-card relative flex flex-col p-3 min-w-0 ${save.open ? 'product-card--picking' : ''}`}
      data-morph
      aria-labelledby={`p-${product.id}`}
    >
      <div className="cd-still relative w-full aspect-square max-h-80 mb-4">
        {failed ? (
          <span className="absolute inset-0 flex items-center justify-center eyebrow text-[var(--cd-ink-500)]">Image unavailable</span>
        ) : (
          <img
            src={product.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            onError={() => { setLoaded(true); setFailed(true); }}
            className={`w-full h-full object-contain p-[8%] ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        <button ref={save.trigger} type="button" onClick={e => { e.stopPropagation(); save.press(); }} aria-expanded={save.open} aria-controls={save.open ? pickerId : undefined}
          title="Lists are kept in this browser only"
          className={`stash-btn product-card__save absolute top-3 right-3 ${save.saved ? 'stash-btn--on' : ''}`}
          aria-label={save.saved ? `Saved in ${save.inLists.length === 1 ? `“${save.inLists[0]!.name}”` : `${save.inLists.length} lists`}. Change lists: ${product.title}` : `Save to a list: ${product.title}`}>
          <Bookmark className="w-4 h-4" aria-hidden="true" fill={save.saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      {save.open && (
        <div id={pickerId} className="product-card__picker">
          <ListPicker product={product} onClose={save.close} trigger={save.trigger} status={save.status} className="paper" />
        </div>
      )}
      <div className="flex items-center gap-2 mb-2 flex-wrap px-1">
        <span className="eyebrow text-muted-fg">{product.category} .</span>
        {product.badge && <span className="chip !bg-red !border-red !text-white">{product.badge}</span>}
      </div>
      <h3 id={`p-${product.id}`} className="px-1 line-clamp-2 text-[28px]">
        {product.title}
      </h3>
      <p className="px-1 text-sm mt-2 leading-relaxed text-muted-fg line-clamp-2">{descriptionSummary(product.description)}</p>
      <div className="mt-auto pt-4">
        <button type="button" onClick={() => onQuickView(product)} className="btn btn-bar product-card__open" aria-label={`Quick view: ${product.title}`}>
          <span className="inline-flex items-center gap-2"><Eye className="w-4 h-4" aria-hidden="true" /> Quick view</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </motion.article>
  );
}
