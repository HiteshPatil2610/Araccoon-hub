import type { Db } from '../db/db';
import type { Product, PublicProduct, ProductStatus } from '../../shared/types';
import type { ProductInput } from '../../shared/schemas';
import { normalizeAffiliateUrl } from '../../shared/urlPolicy';

interface Row {
  id: string; title: string; description: string; category: string; rating: string; review_count: number;
  image_url: string; image_public_id: string | null; affiliate_url: string; affiliate_tag: string | null;
  sub_id: string | null; badge: string | null; featured: boolean; status: ProductStatus; sort_order: number;
  created_at: Date; updated_at: Date;
}

function storeOf(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host === 'amzn.in' ? 'amazon.in' : host === 'amzn.to' ? 'amazon.com' : host;
  } catch {
    return 'amazon.com';
  }
}

export function toPublic(r: Row): PublicProduct {
  return {
    id: r.id, title: r.title, description: r.description, category: r.category,
    rating: Number(r.rating), reviewCount: r.review_count, imageUrl: r.image_url,
    badge: r.badge, featured: r.featured, store: storeOf(r.affiliate_url), createdAt: r.created_at.toISOString(),
  };
}

export function toProduct(r: Row, allowedHosts: readonly string[]): Product {
  return {
    ...toPublic(r),
    imagePublicId: r.image_public_id, affiliateUrl: r.affiliate_url, affiliateTag: r.affiliate_tag,
    subId: r.sub_id, status: r.status, sortOrder: r.sort_order, updatedAt: r.updated_at.toISOString(),
    linkHealthy: normalizeAffiliateUrl(r.affiliate_url, allowedHosts) !== null,
  };
}

const ORDER = 'ORDER BY featured DESC, sort_order ASC, created_at DESC';

function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, ch => `\\${ch}`);
}

export async function listProducts(db: Db, f: { statuses: ProductStatus[]; category?: string; search?: string; featuredOnly?: boolean; limit?: number }) {
  const where = ['status = ANY($1)'];
  const values: unknown[] = [f.statuses];
  if (f.category) {
    values.push(f.category);
    where.push(`lower(category) = lower($${values.length})`);
  }
  if (f.featuredOnly) where.push('featured');
  if (f.search) {
    values.push(`%${escapeLike(f.search)}%`);
    const p = `$${values.length}`;
    where.push(`(title ILIKE ${p} ESCAPE '\\' OR description ILIKE ${p} ESCAPE '\\' OR category ILIKE ${p} ESCAPE '\\')`);
  }
  values.push(Math.min(f.limit ?? 1000, 1000));
  const { rows } = await db.query<Row>(`SELECT * FROM products WHERE ${where.join(' AND ')} ${ORDER} LIMIT $${values.length}`, values);
  return rows;
}

export async function getProduct(db: Db, id: string): Promise<Row | undefined> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
  const { rows } = await db.query<Row>('SELECT * FROM products WHERE id = $1', [id]);
  return rows[0];
}

const COLUMNS: Record<keyof ProductInput, string> = {
  title: 'title', description: 'description', category: 'category', rating: 'rating', reviewCount: 'review_count',
  imageUrl: 'image_url', imagePublicId: 'image_public_id', affiliateUrl: 'affiliate_url', affiliateTag: 'affiliate_tag',
  subId: 'sub_id', badge: 'badge', featured: 'featured', status: 'status', sortOrder: 'sort_order',
};

export async function insertProduct(db: Db, input: ProductInput): Promise<Row> {
  const keys = Object.keys(COLUMNS) as (keyof ProductInput)[];
  const cols = keys.map(k => COLUMNS[k]);
  const { rows } = await db.query<Row>(
    `INSERT INTO products (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
    keys.map(k => input[k] ?? null)
  );
  return rows[0]!;
}

export async function updateProduct(db: Db, id: string, patch: Partial<ProductInput>): Promise<Row | undefined> {
  const keys = (Object.keys(patch) as (keyof ProductInput)[]).filter(k => patch[k] !== undefined);
  if (!keys.length) return getProduct(db, id);
  const sets = keys.map((k, i) => `${COLUMNS[k]} = $${i + 2}`);
  const { rows } = await db.query<Row>(
    `UPDATE products SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING *`,
    [id, ...keys.map(k => patch[k])]
  );
  return rows[0];
}

export async function countImageRefs(db: Db, publicId: string): Promise<number> {
  const { rows } = await db.query<{ n: string }>('SELECT count(*) AS n FROM products WHERE image_public_id = $1', [publicId]);
  return Number(rows[0]!.n);
}
