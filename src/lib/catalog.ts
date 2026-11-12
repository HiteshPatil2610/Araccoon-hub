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

/** Today's date (YYYY-MM-DD) in the site's timezone, so every visitor shares the same "today". */
export function siteDay(now = new Date(), timeZone = 'Asia/Kolkata'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

// FNV-1a: a small stable hash, so the daily order does not follow the catalog's display order.
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}

/**
 * The raccoon's find of the day: the same find for everyone on a given day. Finds with an image
 * take turns in a fixed shuffled order, so none comes back until every other one has had its day.
 */
export function findOfTheDay<T extends { id: string; imageUrl: string }>(finds: readonly T[], day: string): T | null {
  const pool = finds.filter(p => p.imageUrl.trim()).sort((a, b) => hash(a.id) - hash(b.id) || a.id.localeCompare(b.id));
  if (!pool.length) return null;
  const [y = 1970, m = 1, d = 1] = day.split('-').map(Number);
  const n = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  return pool[((n % pool.length) + pool.length) % pool.length]!;
}
