import { Hono } from 'hono';
import { z } from 'zod';
import { body, fail, limit, type AppEnv, type Ctx } from '../app';
import { requireOwner } from '../auth/sessions';
import { audit } from '../lib/audit';
import { reportDate } from '../lib/request';
import { serializeCsv } from '../../shared/csv';
import { manualConversionSchema } from '../../shared/schemas';
import type { AnalyticsSummary, ClickRecord } from '../../shared/types';
import { resetStatsCache } from './public';

export const adminAnalyticsRoutes = new Hono<AppEnv>();
adminAnalyticsRoutes.use('*', requireOwner());

const ownerKey = (c: Ctx) => c.get('session')!.ownerId;
const rangeQuery = z.object({ days: z.coerce.number().int().min(1).max(730).default(30) });

/** The last `days` local dates (oldest first) in the reporting timezone. */
function dayKeys(timeZone: string, days: number): string[] {
  const keys: string[] = [];
  for (let back = 0; keys.length < days; back += 12) {
    const key = reportDate(timeZone, new Date(Date.now() - back * 3600_000));
    if (!keys.includes(key)) keys.push(key);
  }
  return keys.reverse();
}

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);

adminAnalyticsRoutes.get('/', async (c) => {
  await limit(c, 'owner-analytics', ownerKey(c), 60, 60);
  const { days } = rangeQuery.parse(c.req.query());
  const { config } = c.get('deps');
  const tz = config.reportTimezone;
  const db = c.get('db');
  const keys = dayKeys(tz, days);
  const from = keys[0]!;
  const to = keys[keys.length - 1]!;
  // Range = local dates [from, to]; previous period = the same length before it.
  const inRange = `occurred_at >= ($2::text::date - 1)::timestamptz AND to_char(occurred_at AT TIME ZONE $1::text, 'YYYY-MM-DD') BETWEEN $2::text AND $3::text`;
  const params = [tz, from, to];

  const [totals, prev, byDayClicks, byDayConv, top, breakdown, recent] = await Promise.all([
    db.query<{ clicks: string; visitors: string; conversions: string }>(
      `SELECT (SELECT count(*) FROM clicks WHERE NOT is_owner AND ${inRange}) AS clicks,
              (SELECT count(DISTINCT visitor_hash) FROM clicks WHERE NOT is_owner AND ${inRange}) AS visitors,
              (SELECT count(*) FROM conversions WHERE ${inRange}) AS conversions`, params),
    db.query<{ n: string }>(
      `SELECT count(*) AS n FROM clicks WHERE NOT is_owner
         AND occurred_at >= ($2::text::date - $3::int - 1)::timestamptz
         AND to_char(occurred_at AT TIME ZONE $1::text, 'YYYY-MM-DD')
             BETWEEN to_char($2::text::date - $3::int, 'YYYY-MM-DD') AND to_char($2::text::date - 1, 'YYYY-MM-DD')`,
      [tz, from, days]),
    db.query<{ d: string; n: string }>(
      `SELECT to_char(occurred_at AT TIME ZONE $1::text, 'YYYY-MM-DD') AS d, count(*) AS n FROM clicks
        WHERE NOT is_owner AND ${inRange} GROUP BY 1`, params),
    db.query<{ d: string; n: string }>(
      `SELECT to_char(occurred_at AT TIME ZONE $1::text, 'YYYY-MM-DD') AS d, count(*) AS n FROM conversions
        WHERE ${inRange} GROUP BY 1`, params),
    db.query<{ product_id: string | null; title: string; image_url: string | null; clicks: string; conversions: string }>(
      `SELECT t.product_id, coalesce(p.title, max(t.title)) AS title, p.image_url,
              sum(t.clicks) AS clicks, sum(t.conversions) AS conversions
         FROM (SELECT product_id, product_title AS title, count(*) AS clicks, 0 AS conversions
                 FROM clicks WHERE NOT is_owner AND ${inRange} GROUP BY product_id, product_title
               UNION ALL
               SELECT product_id, product_title, 0, count(*) FROM conversions WHERE ${inRange} GROUP BY product_id, product_title) t
         LEFT JOIN products p ON p.id = t.product_id
        GROUP BY t.product_id, p.title, p.image_url
        ORDER BY sum(t.clicks) DESC, sum(t.conversions) DESC LIMIT 20`, params),
    db.query<{ dim: string; key: string; n: string }>(
      `SELECT dim, key, n FROM (
         SELECT 'category' AS dim, category AS key, count(*) AS n FROM clicks WHERE NOT is_owner AND ${inRange} GROUP BY category
         UNION ALL SELECT 'device', device, count(*) FROM clicks WHERE NOT is_owner AND ${inRange} GROUP BY device
         UNION ALL SELECT 'referrer', referrer, count(*) FROM clicks WHERE NOT is_owner AND ${inRange} GROUP BY referrer
         UNION ALL SELECT 'country', coalesce(country, '??'), count(*) FROM clicks WHERE NOT is_owner AND ${inRange} GROUP BY country
       ) b ORDER BY n DESC`, params),
    db.query<RecentRow>(
      `SELECT * FROM clicks WHERE NOT is_owner ORDER BY occurred_at DESC LIMIT 50`),
  ]);

  const clicks = Number(totals.rows[0]!.clicks);
  const conversions = Number(totals.rows[0]!.conversions);
  const clickMap = new Map(byDayClicks.rows.map(r => [r.d, Number(r.n)]));
  const convMap = new Map(byDayConv.rows.map(r => [r.d, Number(r.n)]));
  const dims: AnalyticsSummary['breakdowns'] = { category: [], device: [], referrer: [], country: [] };
  for (const r of breakdown.rows) {
    const list = dims[r.dim as keyof typeof dims];
    if (list.length < 10) list.push({ key: r.key, clicks: Number(r.n), percentage: pct(Number(r.n), clicks) });
  }

  const summary: AnalyticsSummary = {
    retentionDays: config.clickRetentionDays,
    range: { from, to, days, timezone: tz },
    generatedAt: new Date().toISOString(),
    totals: {
      clicks,
      visitorDays: Number(totals.rows[0]!.visitors),
      conversions,
      conversionRate: pct(conversions, clicks),
      clicksToday: clickMap.get(to) ?? 0,
      previousPeriodClicks: Number(prev.rows[0]!.n),
    },
    byDay: keys.map(date => ({ date, clicks: clickMap.get(date) ?? 0, conversions: convMap.get(date) ?? 0 })),
    topProducts: top.rows.map(r => ({
      productId: r.product_id, title: r.title, imageUrl: r.image_url,
      clicks: Number(r.clicks), conversions: Number(r.conversions),
      conversionRate: pct(Number(r.conversions), Number(r.clicks)),
    })),
    breakdowns: dims,
    recentClicks: recent.rows.map(toClickRecord),
  };
  return c.json(summary);
});

interface RecentRow {
  id: string; product_id: string | null; product_title: string; category: string; occurred_at: Date; referrer: string;
  device: ClickRecord['device']; country: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null;
}
const toClickRecord = (r: RecentRow): ClickRecord => ({
  id: r.id, productId: r.product_id, productTitle: r.product_title, category: r.category,
  occurredAt: r.occurred_at.toISOString(), referrer: r.referrer, device: r.device, country: r.country,
  utmSource: r.utm_source, utmMedium: r.utm_medium, utmCampaign: r.utm_campaign,
});

// Spreadsheet-safe CSV of every click in the range (owner clicks excluded).
const EXPORT_MAX_ROWS = 50_000;
adminAnalyticsRoutes.get('/export', async (c) => {
  await limit(c, 'owner-export', ownerKey(c), 10, 60);
  const { days } = rangeQuery.parse(c.req.query());
  const { rows } = await c.get('db').query<RecentRow>(
    `SELECT * FROM clicks WHERE NOT is_owner AND occurred_at >= now() - make_interval(days => $1)
      ORDER BY occurred_at DESC LIMIT $2`, [days, EXPORT_MAX_ROWS + 1]
  );
  const truncated = rows.length > EXPORT_MAX_ROWS;
  const header = ['Click ID', 'Time (UTC)', 'Product', 'Category', 'Device', 'Country', 'Referrer', 'UTM source', 'UTM medium', 'UTM campaign'];
  const lines = rows.slice(0, EXPORT_MAX_ROWS).map(r => [
    r.id, r.occurred_at.toISOString(), r.product_title, r.category, r.device, r.country ?? '', r.referrer,
    r.utm_source ?? '', r.utm_medium ?? '', r.utm_campaign ?? '',
  ]);
  await audit(c, 'analytics.export', 'success', `${days}d:${lines.length}`);
  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="araccoon_clicks_${days}d_${new Date().toISOString().slice(0, 10)}.csv"`);
  c.header('X-Export-Rows', String(lines.length));
  if (truncated) c.header('X-Export-Truncated', 'true');
  return c.body(`﻿${serializeCsv([header, ...lines])}`);
});

adminAnalyticsRoutes.get('/conversions', async (c) => {
  const { rows } = await c.get('db').query<{ id: string; product_id: string | null; product_title: string; occurred_at: Date; source: string; amount_cents: number | null; note: string | null }>(
    `SELECT id, product_id, product_title, occurred_at, source, amount_cents, note FROM conversions ORDER BY occurred_at DESC LIMIT 200`
  );
  return c.json(rows.map(r => ({
    id: r.id, productId: r.product_id, productTitle: r.product_title, occurredAt: r.occurred_at.toISOString(),
    source: r.source, amountCents: r.amount_cents, note: r.note,
  })));
});

adminAnalyticsRoutes.post('/conversions', async (c) => {
  await limit(c, 'owner-write', ownerKey(c), 60, 60);
  const input = await body(c, manualConversionSchema);
  const db = c.get('db');
  const { rows: products } = await db.query<{ id: string; title: string }>('SELECT id, title FROM products WHERE id = $1', [input.productId]);
  if (!products[0]) fail(404, 'Product not found.');
  if (input.clickId) {
    const { rows } = await db.query<{ product_id: string | null }>('SELECT product_id FROM clicks WHERE id = $1', [input.clickId]);
    if (!rows[0] || rows[0].product_id !== input.productId) fail(422, 'That click does not belong to this product.');
  }
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO conversions (product_id, product_title, click_id, occurred_at, source, amount_cents, note)
     VALUES ($1, $2, $3, coalesce($4::timestamptz, now()), 'manual', $5, $6) RETURNING id`,
    [products[0].id, products[0].title, input.clickId ?? null, input.occurredAt ?? null, input.amountCents ?? null, input.note ?? null]
  );
  await audit(c, 'conversion.manual', 'success', rows[0]!.id);
  return c.json({ id: rows[0]!.id }, 201);
});

adminAnalyticsRoutes.delete('/conversions/:id', async (c) => {
  await limit(c, 'owner-write', ownerKey(c), 60, 60);
  const { rowCount } = await c.get('db').query(`DELETE FROM conversions WHERE id = $1 AND source = 'manual'`, [c.req.param('id')]);
  if (!rowCount) fail(404, 'Manual conversion not found.');
  await audit(c, 'conversion.delete', 'success', c.req.param('id'));
  return c.json({ ok: true });
});

// Destructive: requires typing RESET. Clears clicks and conversions together.
adminAnalyticsRoutes.post('/reset', async (c) => {
  await limit(c, 'owner-reset', ownerKey(c), 3, 3600);
  await body(c, z.strictObject({ confirm: z.literal('RESET') }));
  await c.get('db').tx(async (t) => {
    await t.query('DELETE FROM conversions');
    await t.query('DELETE FROM clicks');
  });
  resetStatsCache();
  await audit(c, 'analytics.reset', 'success');
  return c.json({ ok: true });
});
