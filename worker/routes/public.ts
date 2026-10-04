import { Hono } from 'hono';
import { z } from 'zod';
import { body, fail, ipKey, limit, type AppEnv, type Ctx } from '../app';
import { getProduct, listProducts, toPublic } from '../repo/products';
import { trackClickSchema } from '../../shared/schemas';
import { isShortLink, normalizeAffiliateUrl } from '../../shared/urlPolicy';
import { clientCountry, normalizeReferrer, parseDevice, reportDate, visitorHash } from '../lib/request';
import { readSession } from '../auth/sessions';
import type { Config } from '../config';

type ProductRow = NonNullable<Awaited<ReturnType<typeof getProduct>>>;

/** Final outbound URL, or null if the stored destination fails the trusted-host policy. */
export function buildDestination(product: ProductRow, config: Config, utm: { source?: string; medium?: string; campaign?: string }): string | null {
  const normalized = normalizeAffiliateUrl(product.affiliate_url, config.allowedHosts);
  if (!normalized) return null;
  const url = new URL(normalized);
  if (isShortLink(url.hostname)) return normalized; // short links already carry the tag
  if (!url.searchParams.has('tag')) {
    const host = url.hostname.replace(/^www\./, '');
    const base = Object.keys(config.associateTags).find(h => h !== '*' && (host === h || host.endsWith(`.${h}`)));
    const tag = product.affiliate_tag ?? (base ? config.associateTags[base] : config.associateTags['*']);
    if (tag) url.searchParams.set('tag', tag);
  }
  if (product.sub_id) url.searchParams.set('ascsubtag', product.sub_id);
  if (utm.source) url.searchParams.set('utm_source', utm.source);
  if (utm.medium) url.searchParams.set('utm_medium', utm.medium);
  if (utm.campaign) url.searchParams.set('utm_campaign', utm.campaign);
  return url.toString();
}

async function recordClick(c: Ctx, product: ProductRow, destination: string, extra: {
  referrer: string; utmSource?: string; utmMedium?: string; utmCampaign?: string; clickKey?: string;
}): Promise<string> {
  const { config } = c.get('deps');
  const db = c.get('db');
  const isOwner = (await readSession(c)) !== null; // owner test clicks are excluded from reports
  const day = reportDate(config.reportTimezone);
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO clicks (product_id, product_title, category, referrer, device, country, utm_source, utm_medium,
       utm_campaign, destination_url, visitor_hash, client_event_id, is_owner)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (client_event_id) DO NOTHING RETURNING id`,
    [product.id, product.title, product.category, extra.referrer, parseDevice(c.req.header('user-agent') ?? null),
      clientCountry(c.req.raw), extra.utmSource ?? null, extra.utmMedium ?? null, extra.utmCampaign ?? null,
      destination, await visitorHash(config.sessionSecret, c.req.raw, day), extra.clickKey ?? null, isOwner]
  );
  if (rows[0]) return rows[0].id;
  const existing = await db.query<{ id: string }>('SELECT id FROM clicks WHERE client_event_id = $1', [extra.clickKey]);
  return existing.rows[0]!.id;
}

const utmParam = z.string().trim().max(100).regex(/^[A-Za-z0-9._~ -]*$/).optional().catch(undefined);
const searchParams = z.object({
  category: z.string().trim().max(60).optional(),
  search: z.string().trim().max(100).optional(),
  featured: z.enum(['true', 'false']).optional(),
});

export const publicRoutes = new Hono<AppEnv>();

publicRoutes.get('/api/health', async (c) => {
  await c.get('db').query('SELECT 1');
  return c.json({ ok: true });
});

publicRoutes.get('/api/products', async (c) => {
  await limit(c, 'catalog', ipKey(c), 300, 60, true);
  const q = searchParams.parse(c.req.query());
  const rows = await listProducts(c.get('db'), {
    statuses: ['published'],
    category: q.category && q.category !== 'All' ? q.category : undefined,
    search: q.search || undefined,
    featuredOnly: q.featured === 'true',
  });
  c.header('Cache-Control', 'public, max-age=30');
  return c.json(rows.map(toPublic));
});

publicRoutes.get('/api/products/:id', async (c) => {
  await limit(c, 'catalog', ipKey(c), 300, 60, true);
  const row = await getProduct(c.get('db'), c.req.param('id'));
  if (!row || row.status !== 'published') fail(404, 'Product not found.');
  return c.json(toPublic(row));
});

// Short outbound link: records the click, then 302s to Amazon. Also the
// fallback when the browser beacon fails (same clickKey → counted once).
publicRoutes.get('/r/:id', async (c) => {
  await limit(c, 'redirect', ipKey(c), 60, 60, true);
  const row = await getProduct(c.get('db'), c.req.param('id'));
  const { config } = c.get('deps');
  const destination = row && row.status === 'published'
    ? buildDestination(row, config, { source: utmParam.parse(c.req.query('utm_source')), medium: utmParam.parse(c.req.query('utm_medium')), campaign: utmParam.parse(c.req.query('utm_campaign')) })
    : null;
  if (!row || !destination) fail(404, 'This link is not available.');
  const ck = z.uuid().safeParse(c.req.query('ck'));
  await recordClick(c, row, destination, {
    referrer: normalizeReferrer(c.req.header('referer')),
    utmSource: utmParam.parse(c.req.query('utm_source')),
    utmMedium: utmParam.parse(c.req.query('utm_medium')),
    utmCampaign: utmParam.parse(c.req.query('utm_campaign')),
    clickKey: ck.success ? ck.data : undefined,
  });
  c.header('Cache-Control', 'no-store');
  c.header('Referrer-Policy', 'no-referrer');
  return c.redirect(destination, 302);
});

// Beacon used by the storefront before opening the destination in a new tab.
publicRoutes.post('/api/track', async (c) => {
  await limit(c, 'track', ipKey(c), 120, 60, true);
  const input = await body(c, trackClickSchema);
  const row = await getProduct(c.get('db'), input.productId);
  const { config } = c.get('deps');
  const utm = { source: input.utmSource || 'storefront', medium: input.utmMedium || 'product_card', campaign: input.utmCampaign || undefined };
  const destination = row && row.status === 'published' ? buildDestination(row, config, utm) : null;
  if (!row || !destination) fail(404, 'This link is not available.');
  const clickId = await recordClick(c, row, destination, {
    referrer: normalizeReferrer(input.referrer), utmSource: utm.source, utmMedium: utm.medium, utmCampaign: utm.campaign, clickKey: input.clickKey,
  });
  return c.json({ clickId, destinationUrl: destination });
});

// Tiny public counter for the storefront ("N finds opened today").
let statsCache: { value: number; expires: number; day: string } | null = null;
publicRoutes.get('/api/stats', async (c) => {
  await limit(c, 'stats', ipKey(c), 60, 60, true);
  const { config } = c.get('deps');
  const day = reportDate(config.reportTimezone);
  if (!statsCache || statsCache.expires < Date.now() || statsCache.day !== day) {
    const { rows } = await c.get('db').query<{ n: string }>(
      `SELECT count(*) AS n FROM clicks
        WHERE occurred_at >= now() - interval '2 days' AND NOT is_owner
          AND to_char(occurred_at AT TIME ZONE $1, 'YYYY-MM-DD') = $2`,
      [config.reportTimezone, day]
    );
    statsCache = { value: Number(rows[0]!.n), expires: Date.now() + 60_000, day };
  }
  c.header('Cache-Control', 'public, max-age=60');
  return c.json({ clicksToday: statsCache.value });
});

export function resetStatsCache() {
  statsCache = null;
}
