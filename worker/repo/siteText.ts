import type { Db } from '../db/db';
import { isSiteTextKey, mergeSiteText, type SiteText, type SiteTextKey, type SiteTextPatch, type SiteTextState } from '../../shared/siteText';

type Row = { key: string; value: string; updated_at: Date | string };

export async function getSiteTextState(db: Db): Promise<SiteTextState> {
  const { rows } = await db.query<Row>('SELECT key, value, updated_at FROM site_text');
  const known = rows.filter(r => isSiteTextKey(r.key));
  const latest = known.reduce<string | null>((max, r) => {
    const at = new Date(r.updated_at).toISOString();
    return !max || at > max ? at : max;
  }, null);
  return {
    values: mergeSiteText(Object.fromEntries(known.map(r => [r.key, r.value]))),
    customized: known.map(r => r.key as SiteTextKey),
    updatedAt: latest,
  };
}

export async function getSiteText(db: Db): Promise<SiteText> {
  return (await getSiteTextState(db)).values;
}

/** Applies a patch in one transaction; returns the keys that changed. */
export async function updateSiteText(db: Db, patch: SiteTextPatch, ownerId: string): Promise<SiteTextKey[]> {
  const entries = Object.entries(patch).filter((e): e is [SiteTextKey, string | null] => e[1] !== undefined && isSiteTextKey(e[0]));
  if (!entries.length) return [];
  await db.tx(async (t) => {
    for (const [key, value] of entries) {
      if (value === null) {
        await t.query('DELETE FROM site_text WHERE key = $1', [key]);
      } else {
        await t.query(
          `INSERT INTO site_text (key, value, updated_by) VALUES ($1, $2, $3)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()`,
          [key, value, ownerId],
        );
      }
    }
  });
  return entries.map(([key]) => key);
}
