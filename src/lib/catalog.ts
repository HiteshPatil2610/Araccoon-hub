import type { PublicProduct } from '../../shared/types';

/** The board shows only explicit featured records, newest first with a stable tie-break. */
export function featuredProducts(products: readonly PublicProduct[]): PublicProduct[] {
  return products.filter(p => p.featured && p.imageUrl.trim()).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)).slice(0, 3);
}

/**
 * A random find for "Surprise me": never the one already open, and none twice until
 * every other find has had its turn. `seen` is updated in place.
 */
export function pickSurprise<T extends { id: string }>(pool: readonly T[], seen: Set<string>, currentId: string | null = null, random: () => number = Math.random): T | null {
  if (currentId) seen.add(currentId); // the open find has been seen too, however it was opened
  const others = pool.filter(p => p.id !== currentId);
  if (!others.length) return null;
  let fresh = others.filter(p => !seen.has(p.id));
  if (!fresh.length) {
    seen.clear();
    fresh = others;
  }
  const pick = fresh[Math.min(fresh.length - 1, Math.floor(random() * fresh.length))]!;
  seen.add(pick.id);
  return pick;
}
