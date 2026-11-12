import type { Db } from '../db/db';
import { identifyProductUrl } from '../../shared/productImport';
import type { ListingStatus } from '../../shared/types';

// Checks whether a find's Amazon listing still exists, so the owner hub can flag removed ones.
// It only ever reports to the owner: nothing is unpublished automatically, and anything
// short of a clear answer is recorded as "unknown" rather than guessed.

/** Finds checked per run. Each is one request (plus at most two redirects), well inside the Worker subrequest limit. */
export const LINK_CHECK_BATCH = 10;
const MARKETPLACES = ['amazon.in', 'amazon.com'] as const;
const HEADERS = { Accept: 'text/html', 'Accept-Language': 'en-IN,en;q=0.8', 'User-Agent': 'AraccoonHub/0.1 (owner listing check)' };

/**
 * "gone" only when Amazon answers 404 for the exact product page; "ok" when the page
 * loads; "unknown" for everything else (short links, bot checks, errors, timeouts).
 */
export async function checkListing(affiliateUrl: string, transport: typeof fetch): Promise<ListingStatus> {
  // Only a validated marketplace and ASIN may decide the network target; the tagged affiliate URL is never requested.
  const identity = identifyProductUrl(affiliateUrl, MARKETPLACES);
  if (!identity) return 'unknown';
  let url = identity.canonicalUrl;
  try {
    const signal = AbortSignal.timeout(8_000);
    for (let hop = 0; hop < 3; hop++) {
      const res = await transport(url, { redirect: 'manual', headers: HEADERS, signal });
      await res.body?.cancel();
      if (res.status === 404) return 'gone';
      if (res.status >= 200 && res.status < 300) return 'ok';
      if (![301, 302, 303, 307, 308].includes(res.status)) return 'unknown';
      const location = res.headers.get('location');
      const next = location ? identifyProductUrl(new URL(location, url).href, [identity.marketplace]) : null;
      // A redirect anywhere other than the same product (a search page, another item) says nothing certain.
      if (!next || next.asin !== identity.asin) return 'unknown';
      url = new URL(location!, url).href;
    }
  } catch {
    /* network error or timeout */
  }
  return 'unknown';
}

/** Checks the published finds that have waited longest and stores each result. */
export async function checkListings(db: Db, transport: typeof fetch, limit = LINK_CHECK_BATCH): Promise<Record<ListingStatus | 'checked', number>> {
  const { rows } = await db.query<{ id: string; affiliate_url: string }>(
    `SELECT id, affiliate_url FROM products WHERE status = 'published' ORDER BY link_checked_at ASC NULLS FIRST, created_at ASC LIMIT $1`, [limit]);
  const result = { checked: 0, ok: 0, gone: 0, unknown: 0 };
  for (const row of rows) {
    const status = await checkListing(row.affiliate_url, transport);
    // Guarded by the URL it was checked against: an edit made meanwhile keeps its fresh, unchecked state.
    await db.query('UPDATE products SET link_status = $2, link_checked_at = now() WHERE id = $1 AND affiliate_url = $3', [row.id, status, row.affiliate_url]);
    result.checked++;
    result[status]++;
  }
  return result;
}
