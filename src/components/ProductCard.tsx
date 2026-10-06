import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Eye } from 'lucide-react';
import { IndexBadge, Sticker } from './cine';
import type { PublicProduct } from '../../shared/types';
import { descriptionSummary } from '../../shared/productCopy';

export function storeLabel(store: string) {
  return store === 'amazon.in' ? 'Amazon.in' : store === 'amazon.com' ? 'Amazon' : store;
}

export function ProductCard({ product, index, onOpen, onQuickView, pending }: {
  product: PublicProduct; index: number; pending?: boolean;
  onOpen: (p: PublicProduct) => void; onQuickView: (p: PublicProduct) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.9, delay: (index % 4) * 0.12, ease: [0.7, 0, 0.2, 1] }}
      className="group panel relative flex flex-col justify-between p-3 min-w-0"
      data-morph
      aria-labelledby={`p-${product.id}`}
    >
      <div>
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
          <IndexBadge n={index + 1} className="absolute top-3 left-3 bg-white text-ink" />
          {product.featured && <Sticker text="Pick" className="absolute top-2 right-2 !w-16 !h-16 !text-lg" />}
          <button type="button" onClick={() => onQuickView(product)}
            className="absolute bottom-3 right-3 inline-flex items-center gap-2 px-4 min-h-11 rounded-full bg-ink text-white eyebrow !tracking-[.2em] hover:bg-red transition-colors"
            aria-label={`Quick view: ${product.title}`}>
            <Eye className="w-3.5 h-3.5" aria-hidden="true" /> Quick view
          </button>
        </div>
        <div className="flex items-center gap-2 mb-2 flex-wrap px-1">
          <span className="eyebrow text-muted-fg">{product.category} .</span>
          {product.badge && <span className="chip !bg-red !border-red !text-white">{product.badge}</span>}
        </div>
        <h3 id={`p-${product.id}`} className="px-1 line-clamp-2 text-[28px]">
          {product.title}
        </h3>
        <p className="px-1 text-sm mt-2 leading-relaxed text-muted-fg line-clamp-2">{descriptionSummary(product.description)}</p>
      </div>
      <div className="mt-4">
        <button type="button" disabled={pending} onClick={() => onOpen(product)} className="btn btn-primary btn-bar">
          View on {storeLabel(product.store)} <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </motion.article>
  );
}
