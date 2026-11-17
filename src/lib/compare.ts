import type { PublicProduct } from '../../shared/types';
import { TIER_LABELS, specKey } from '../../shared/productFacts';

// Side-by-side comparison of the finds in one collection. The choice travels in the address
// (?compare=<8-character ids joined by dots>, the same short ids as /find/ addresses), so a
// comparison can be shared or reloaded; nothing is stored anywhere.

export const MAX_COMPARE = 4;
export const COMPARE_PARAM = 'compare';
const KEY = /^[0-9a-f]{8}$/;
const keyOf = (id: string) => id.slice(0, 8).toLowerCase();

type Find = Pick<PublicProduct, 'id' | 'brand' | 'tier' | 'specs'>;

/** Only finds with specs have something to line up. */
export const comparable = (find: Pick<PublicProduct, 'specs'>) => find.specs.length > 0;

/** The finds an address names, in its order: unknown, repeated and incomparable ones are dropped. */
export function parseCompare<T extends Find>(value: string | null, finds: readonly T[]): T[] {
  const byKey = new Map(finds.filter(comparable).map(f => [keyOf(f.id), f]));
  const keys = [...new Set((value ?? '').toLowerCase().split('.').filter(k => KEY.test(k)))];
  return keys.flatMap(k => { const f = byKey.get(k); return f ? [f] : []; }).slice(0, MAX_COMPARE);
}

export const compareValue = (finds: readonly Pick<Find, 'id'>[]) => finds.map(f => keyOf(f.id)).join('.');

export interface CompareRow {
  key: string;
  name: string;
  /** One value per find, in the finds' order; null when that find does not list it. */
  values: (string | null)[];
  /** The finds do not all say the same thing (a missing value counts as different). */
  differs: boolean;
}

const row = (key: string, name: string, values: (string | null)[]): CompareRow => ({
  key, name, values, differs: new Set(values.map(v => v?.trim().toLowerCase() ?? null)).size > 1,
});

/**
 * Brand and tier, then every spec any of the finds lists. Spec names match through specKey
 * ("Max DPI" = "max-dpi"); rows every find fills come first, each group in order of first appearance.
 */
export function compareRows(finds: readonly Find[]): CompareRow[] {
  const facts = [
    row('brand', 'Brand', finds.map(f => f.brand)),
    row('tier', 'Tier', finds.map(f => (f.tier ? TIER_LABELS[f.tier] : null))),
  ].filter(r => r.values.some(Boolean));

  const names = new Map<string, string>();
  for (const f of finds) for (const s of f.specs) { const k = specKey(s.name); if (k && !names.has(k)) names.set(k, s.name); }
  const specs = [...names].map(([k, name]) => row(`spec:${k}`, name, finds.map(f => f.specs.find(s => specKey(s.name) === k)?.value ?? null)));
  const complete = (r: CompareRow) => r.values.every(v => v !== null);
  return [...facts, ...specs.filter(complete), ...specs.filter(r => !complete(r))];
}
