import { Hono } from 'hono';
import { fail, ipKey, limit, type AppEnv } from '../app';
import { audit } from '../lib/audit';
import { hmacHex, safeEqual } from '../lib/crypto';
import { webhookConversionSchema } from '../../shared/schemas';

// Optional conversion intake (disabled unless WEBHOOK_SECRET is set).
// Contract (defined by this app — wire your own relay/script to it):
//   POST /api/webhooks/conversion, JSON body ≤ 64 KB:
//     { "eventId": "<unique>", "productId": "<uuid>", "clickId"?: "<uuid>", "amountCents"?: 123 }
//   X-Webhook-Timestamp: <unix seconds, within ±5 min>
//   X-Webhook-Signature: sha256=<hex HMAC-SHA256(WEBHOOK_SECRET, "<timestamp>.<raw body>")>
// Repeat deliveries of an eventId return 200 {duplicate:true} and never double count.
const MAX_BYTES = 64 * 1024;
const TOLERANCE_S = 300;

export const webhookRoutes = new Hono<AppEnv>();

webhookRoutes.post('/conversion', async (c) => {
  await limit(c, 'webhook', ipKey(c), 30, 60);
  const secret = c.get('deps').config.webhookSecret;
  if (!secret) fail(503, 'Webhook endpoint is not configured.');
  const raw = await c.req.text();
  if (raw.length > MAX_BYTES) fail(413, 'Payload too large.');
  const ts = c.req.header('x-webhook-timestamp') ?? '';
  const sig = /^sha256=([0-9a-f]{64})$/i.exec(c.req.header('x-webhook-signature')?.trim() ?? '')?.[1]?.toLowerCase();
  const fresh = /^\d{1,12}$/.test(ts) && Math.abs(Date.now() / 1000 - Number(ts)) <= TOLERANCE_S;
  if (!sig || !fresh || !safeEqual(sig, await hmacHex(secret, `${ts}.${raw}`))) {
    fail(401, 'Invalid or expired signature.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    fail(400, 'Invalid JSON.');
  }
  const input = webhookConversionSchema.parse(parsed);
  const db = c.get('db');
  const { rows: products } = await db.query<{ id: string; title: string }>('SELECT id, title FROM products WHERE id = $1', [input.productId]);
  if (!products[0]) fail(422, 'Unknown product.');
  if (input.clickId) {
    const { rows } = await db.query<{ product_id: string | null }>('SELECT product_id FROM clicks WHERE id = $1', [input.clickId]);
    if (!rows[0] || rows[0].product_id !== input.productId) fail(422, 'clickId does not belong to this product.');
  }
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO conversions (product_id, product_title, click_id, source, external_event_id, amount_cents)
     VALUES ($1, $2, $3, 'webhook', $4, $5)
     ON CONFLICT (source, external_event_id) DO NOTHING RETURNING id`,
    [products[0].id, products[0].title, input.clickId ?? null, input.eventId, input.amountCents ?? null]
  );
  if (!rows[0]) {
    const existing = await db.query<{ id: string }>(`SELECT id FROM conversions WHERE source = 'webhook' AND external_event_id = $1`, [input.eventId]);
    return c.json({ ok: true, duplicate: true, conversionId: existing.rows[0]?.id }, 200);
  }
  await audit(c, 'conversion.webhook', 'success', rows[0].id, null);
  return c.json({ ok: true, conversionId: rows[0].id }, 201);
});
