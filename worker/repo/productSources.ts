import type { Db } from '../db/db';
import type { ProductInput } from '../../shared/schemas';
import { identifyProductUrl, type ProductIdentity, type OwnerContentSource } from '../../shared/productImport';
import { insertProduct } from './products';

export async function findProductIdentity(db: Db, identity: ProductIdentity, allowedHosts: readonly string[]) {
  // Include legacy/manual full URLs without rewriting existing records.
  const { rows } = await db.query<{ id: string; title: string; affiliate_url: string }>(
    'SELECT id, title, affiliate_url FROM products WHERE affiliate_url ILIKE $1 ORDER BY created_at, id', [`%${identity.asin}%`]);
  const found = rows.find(row => {
    const parsed = identifyProductUrl(row.affiliate_url, allowedHosts);
    return parsed?.asin === identity.asin && parsed.marketplace === identity.marketplace;
  }) ?? null;
  return found ? { id: found.id, title: found.title } : null;
}

export async function insertAssistedDraft(db: Db, input: ProductInput, source: OwnerContentSource, identity: ProductIdentity, ownerId: string, allowedHosts: readonly string[]) {
  return db.tx(async tx => {
    // Serializes assisted creates for the same marketplace/ASIN, including retries.
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${identity.marketplace}:${identity.asin}`]);
    if (await findProductIdentity(tx, identity, allowedHosts)) return null;
    const row = await insertProduct(tx, { ...input, status: 'draft' });
    await tx.query(`INSERT INTO product_content_sources
      (product_id, marketplace, asin, provider, source_url, asserted_by, content_authorized)
      VALUES ($1, $2, $3, $4, $5, $6, true)`,
    [row.id, identity.marketplace, identity.asin, source.provider, source.sourceUrl ?? null, ownerId]);
    return row;
  });
}
