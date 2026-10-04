import type { PublicProduct } from '../../shared/types';

/** The board shows only explicit featured records, newest first with a stable tie-break. */
export function featuredProducts(products: readonly PublicProduct[]): PublicProduct[] {
  return products.filter(p => p.featured && p.imageUrl.trim()).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)).slice(0, 3);
}
