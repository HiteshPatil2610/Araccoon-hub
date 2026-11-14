import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { X } from 'lucide-react';
import type { PublicProduct } from '../../shared/types';
import { COMPARE_PARAM, MAX_COMPARE, comparable, compareRows, compareValue, parseCompare } from '../lib/compare';
import { ProductImage } from './ProductImage';

/**
 * "Compare" on a collection page: the visitor picks up to four of the collection's finds and sees
 * their brand, tier and specs side by side. Rendered only when at least two finds have specs.
 */
export function CompareFinds({ finds, onOpen }: { finds: readonly PublicProduct[]; onOpen: (find: PublicProduct) => void }) {
  const [params, setParams] = useSearchParams();
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const candidates = useMemo(() => finds.filter(comparable), [finds]);
  const value = params.get(COMPARE_PARAM);
  const picked = useMemo(() => parseCompare(value, finds), [value, finds]);
  const rows = useMemo(() => compareRows(picked), [picked]);

  if (candidates.length < 2) return null;

  const pick = (next: readonly PublicProduct[]) => {
    const search = new URLSearchParams(params);
    if (next.length) search.set(COMPARE_PARAM, compareValue(next)); else search.delete(COMPARE_PARAM);
    setParams(search, { replace: true, preventScrollReset: true });
  };
  const toggle = (find: PublicProduct) => pick(picked.some(p => p.id === find.id) ? picked.filter(p => p.id !== find.id) : [...picked, find]);
  const full = picked.length >= MAX_COMPARE;
  const shown = onlyDifferences ? rows.filter(r => r.differs) : rows;
  const status = picked.length === 0 ? '' : picked.length === 1 ? `1 find picked. Pick one more to compare.` : `Comparing ${picked.length} finds.`;

  return (
    <section className="compare" aria-labelledby="compare-heading">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id="compare-heading" className="text-4xl sm:text-5xl leading-none">Compare</h2>
          <p className="mt-2 text-sm text-muted-fg">Pick two to four finds to see them side by side.</p>
        </div>
        {picked.length > 0 && <button type="button" className="btn btn-ghost !px-2" onClick={() => pick([])}>Clear</button>}
      </div>

      <div className="category-row py-4 flex flex-wrap items-center gap-2" role="group" aria-label="Finds to compare">
        {candidates.map(find => {
          const on = picked.some(p => p.id === find.id);
          return (
            <button key={find.id} type="button" aria-pressed={on} disabled={!on && full} onClick={() => toggle(find)} className={`btn ${on ? 'btn-mint' : ''}`}>
              <span className="compare__pick">{find.title}</span>
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted-fg" role="status">{status}{full && ` That is the most that fit; remove one to pick another.`}</p>

      {picked.length >= 2 && (
        <>
          <label className="mt-4 inline-flex items-center gap-3 min-h-11 text-sm font-bold cursor-pointer">
            <input type="checkbox" className="w-5 h-5 accent-[var(--primary)]" checked={onlyDifferences} onChange={e => setOnlyDifferences(e.target.checked)} />
            Only show what differs
          </label>
          {/* Focusable so keyboard users can scroll a table wider than the screen. */}
          <div className="compare__scroll panel mt-2" role="region" aria-label="Comparison table" tabIndex={0}>
            <table className="compare__table" style={{ minWidth: `${8 + picked.length * 10}rem` }}>
              <thead>
                <tr>
                  <td className="compare__corner" />
                  {picked.map(find => (
                    <th key={find.id} scope="col">
                      <div className="compare__find">
                        <span className="compare__image"><ProductImage src={find.imageUrl} title={find.title} compact className="w-full h-full object-contain p-[8%]" /></span>
                        <button type="button" className="compare__title" onClick={() => onOpen(find)} aria-label={`Quick view: ${find.title}`}>{find.title}</button>
                        <button type="button" className="compare__remove" onClick={() => toggle(find)} aria-label={`Remove ${find.title} from the comparison`}><X className="w-4 h-4" aria-hidden="true" /></button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map(r => (
                  <tr key={r.key} className={r.differs ? 'is-different' : undefined}>
                    <th scope="row">{r.name}{r.differs && <span className="sr-only"> (differs)</span>}</th>
                    {r.values.map((v, i) => <td key={picked[i]!.id}>{v ?? <span className="text-muted-fg" aria-label="Not listed">—</span>}</td>)}
                  </tr>
                ))}
                {shown.length === 0 && <tr><th scope="row" colSpan={picked.length + 1} className="!text-muted-fg !font-normal">These finds list the same details.</th></tr>}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-fg">Rows with a red mark differ between these finds. Details are as noted by Raccoon Hub; check the product page before buying.</p>
        </>
      )}
    </section>
  );
}
