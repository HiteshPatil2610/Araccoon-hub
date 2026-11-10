import type { Db } from '../db/db';
import type { Collection, CollectionInput, CollectionStatus, CollectionSummary } from '../../shared/collections';
import { findSlug } from '../../shared/finds';
import { listProducts } from './products';

type ProductRow = Awaited<ReturnType<typeof listProducts>>[number];

interface Row {
  id: string; slug: string; title: string; description: string; status: CollectionStatus; sort_order: number;
  created_at: Date; updated_at: Date; product_ids: string[];
}

const toCollection = (r: Row): Collection => ({
  id: r.id, slug: r.slug, title: r.title, description: r.description, status: r.status, sortOrder: r.sort_order,
  productIds: r.product_ids, updatedAt: r.updated_at.toISOString(),
});

const WITH_IDS = `SELECT c.*, COALESCE(array_agg(cp.product_id::text ORDER BY cp.position) FILTER (WHERE cp.product_id IS NOT NULL), '{}') AS product_ids
  FROM collections c LEFT JOIN collection_products cp ON cp.collection_id = c.id`;

const isId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

/** Every collection with its find ids in the owner's order (owner hub). */
export async function listCollections(db: Db): Promise<Collection[]> {
  const { rows } = await db.query<Row>(`${WITH_IDS} GROUP BY c.id ORDER BY c.sort_order ASC, c.created_at ASC`);
  return rows.map(toCollection);
}

export async function getCollection(db: Db, id: string): Promise<Collection | undefined> {
  if (!isId(id)) return undefined;
  const { rows } = await db.query<Row>(`${WITH_IDS} WHERE c.id = $1 GROUP BY c.id`, [id]);
  return rows[0] && toCollection(rows[0]);
}

const SUMMARY = `SELECT c.id, c.slug, c.title, c.description, c.updated_at, count(p.id)::int AS product_count,
    (array_agg(p.image_url ORDER BY cp.position))[1] AS cover_image_url
  FROM collections c
  JOIN collection_products cp ON cp.collection_id = c.id
  JOIN products p ON p.id = cp.product_id AND p.status = 'published'
  WHERE c.status = 'published'`;

type SummaryRow = { id: string; slug: string; title: string; description: string; product_count: number; cover_image_url: string | null; updated_at?: Date };
const toSummary = (r: SummaryRow): CollectionSummary => ({
  id: r.id, slug: r.slug, title: r.title, description: r.description, productCount: r.product_count, coverImageUrl: r.cover_image_url,
});

/** Published collections that currently show at least one published find. */
export async function listPublicCollections(db: Db): Promise<(CollectionSummary & { updatedAt: string })[]> {
  const { rows } = await db.query<SummaryRow & { updated_at: Date }>(`${SUMMARY} GROUP BY c.id ORDER BY c.sort_order ASC, c.created_at ASC`);
  return rows.map(r => ({ ...toSummary(r), updatedAt: r.updated_at.toISOString() }));
}

/** One published collection and its published finds in order; undefined when it is missing, a draft or empty. */
export async function getPublicCollection(db: Db, slug: string): Promise<{ summary: CollectionSummary; products: ProductRow[] } | undefined> {
  const { rows } = await db.query<SummaryRow>(`${SUMMARY} AND c.slug = $1 GROUP BY c.id`, [slug]);
  if (!rows[0]) return undefined;
  const products = await db.query<ProductRow>(
    `SELECT p.* FROM collection_products cp JOIN products p ON p.id = cp.product_id
     WHERE cp.collection_id = $1 AND p.status = 'published' ORDER BY cp.position ASC`, [rows[0].id]);
  return { summary: toSummary(rows[0]), products: products.rows };
}

/** Replaces the collection's finds; returns false (and writes nothing more) if any id is not a product. */
async function setProducts(tx: Db, id: string, productIds: string[]): Promise<boolean> {
  await tx.query('DELETE FROM collection_products WHERE collection_id = $1', [id]);
  if (!productIds.length) return true;
  const { rowCount } = await tx.query(
    `INSERT INTO collection_products (collection_id, product_id, position)
     SELECT $1, p.id, t.ord FROM unnest($2::uuid[]) WITH ORDINALITY AS t(id, ord) JOIN products p ON p.id = t.id`,
    [id, productIds]);
  return rowCount === productIds.length;
}

/** A free slug from the title: "desk-upgrades", then "desk-upgrades-2" and so on. Fixed once created, so links stay stable. */
async function freeSlug(tx: Db, title: string): Promise<string> {
  const base = findSlug(title) || 'collection';
  const { rows } = await tx.query<{ slug: string }>('SELECT slug FROM collections WHERE slug = $1 OR slug LIKE $2', [base, `${base}-%`]);
  const taken = new Set(rows.map(r => r.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

export class UnknownProductError extends Error {}

export async function insertCollection(db: Db, input: CollectionInput): Promise<Collection> {
  const id = await db.tx(async (tx) => {
    // Serialises slug allocation so two creates with the same title cannot pick the same slug.
    await tx.query('SELECT pg_advisory_xact_lock($1)', [4_204_201_338]);
    const slug = await freeSlug(tx, input.title);
    const { rows } = await tx.query<{ id: string }>(
      'INSERT INTO collections (slug, title, description, status, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [slug, input.title, input.description, input.status, input.sortOrder]);
    if (!(await setProducts(tx, rows[0]!.id, input.productIds))) throw new UnknownProductError();
    return rows[0]!.id;
  });
  return (await getCollection(db, id))!;
}

const COLUMNS = { title: 'title', description: 'description', status: 'status', sortOrder: 'sort_order' } as const;

export async function updateCollection(db: Db, id: string, patch: Partial<CollectionInput>): Promise<Collection | undefined> {
  await db.tx(async (tx) => {
    const keys = (Object.keys(COLUMNS) as (keyof typeof COLUMNS)[]).filter(k => patch[k] !== undefined);
    const sets = keys.map((k, i) => `${COLUMNS[k]} = $${i + 2}`);
    await tx.query(`UPDATE collections SET ${[...sets, 'updated_at = now()'].join(', ')} WHERE id = $1`, [id, ...keys.map(k => patch[k])]);
    if (patch.productIds !== undefined && !(await setProducts(tx, id, patch.productIds))) throw new UnknownProductError();
  });
  return getCollection(db, id);
}

export async function deleteCollection(db: Db, id: string): Promise<boolean> {
  const { rowCount } = await db.query('DELETE FROM collections WHERE id = $1', [id]);
  return rowCount > 0;
}
