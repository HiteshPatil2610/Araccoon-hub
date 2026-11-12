import { Eye } from 'lucide-react';
import type { PublicProduct } from '../../shared/types';
import { descriptionSummary } from '../../shared/productCopy';
import { ProductImage } from './ProductImage';

const dayLabel = (day: string) => {
  const [y = 1970, m = 1, d = 1] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
};

/** The raccoon's find of the day: one find for everyone, a different one tomorrow. The whole panel opens it. */
export function DailyFind({ find, day, onOpen }: { find: PublicProduct; day: string; onOpen: (p: PublicProduct) => void }) {
  return (
    <section className="daily-find panel paper" aria-labelledby="daily-find-title">
      <span className="cd-still daily-find__image"><ProductImage src={find.imageUrl} title={find.title} compact className="w-full h-full object-contain p-[10%]" /></span>
      <div className="daily-find__text">
        <p className="eyebrow text-red">The raccoon’s find of the day <span className="text-muted-fg">· {dayLabel(day)}</span></p>
        <h3 id="daily-find-title" className="daily-find__title">{find.title}</h3>
        <p className="text-sm leading-relaxed text-muted-fg line-clamp-2">{descriptionSummary(find.description)}</p>
        <div className="daily-find__foot">
          <button type="button" className="btn daily-find__open" onClick={() => onOpen(find)} aria-label={`Take a look: ${find.title}`}>
            <Eye className="w-4 h-4" aria-hidden="true" /> Take a look
          </button>
          <span className="text-xs text-muted-fg">A new one every day.</span>
        </div>
      </div>
      <img src="/art/video-concept/raccoon-picks-box-720.webp" alt="" width={604} height={720} loading="lazy" decoding="async" draggable={false} className="daily-find__mascot" />
    </section>
  );
}

/** Finds this browser opened on earlier visits, newest first. Kept only in this browser; Clear forgets them. */
export function RecentStrip({ finds, onOpen, onClear }: { finds: readonly PublicProduct[]; onOpen: (p: PublicProduct) => void; onClear: () => void }) {
  return (
    <section className="recent-finds" aria-labelledby="recent-finds-heading">
      <div className="flex items-center justify-between gap-3">
        <h3 id="recent-finds-heading" className="eyebrow text-muted-fg">Pick up where you left off</h3>
        <button type="button" className="btn btn-ghost !text-lg !px-2 !min-h-9" onClick={onClear} title="Forget these (kept in this browser only)">Clear</button>
      </div>
      <ul className="recent-finds__list">
        {finds.map(p => (
          <li key={p.id} className="min-w-0">
            <button type="button" className="recent-finds__tile" onClick={() => onOpen(p)}>
              <span className="cd-still recent-finds__image"><ProductImage src={p.imageUrl} title={p.title} compact className="w-full h-full object-contain p-[8%]" /></span>
              <span className="recent-finds__title">{p.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
