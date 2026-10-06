import { Hono } from 'hono';
import { z } from 'zod';
import { body, fail, limit, type AppEnv, type Ctx } from '../app';
import { requireOwner } from '../auth/sessions';
import { audit } from '../lib/audit';
import { countImageRefs, getProduct, insertProduct, listProducts, toProduct, updateProduct } from '../repo/products';
import { bulkActionSchema, productInputSchema, productPatchSchema, type ProductPatch } from '../../shared/schemas';
import { normalizeAffiliateUrl } from '../../shared/urlPolicy';

export const adminProductRoutes = new Hono<AppEnv>();
adminProductRoutes.use('*', requireOwner());

const ownerKey = (c: Ctx) => c.get('session')!.ownerId;

/** Server-only checks on top of the shared schema: trusted link + image origin. */
function checkProduct(c: Ctx, input: ProductPatch): ProductPatch {
  const { config, images } = c.get('deps');
  const out = { ...input };
  if (input.affiliateUrl !== undefined) {
    const url = normalizeAffiliateUrl(input.affiliateUrl, config.allowedHosts);
    if (!url) {
      fail(400, 'Please check the highlighted fields.', {
        affiliateUrl: `Use an https link on: ${config.allowedHosts.join(', ')}.`,
      });
    }
    out.affiliateUrl = url;
  }
  if (input.imagePublicId) {
    if (!input.imageUrl || !images.isOwnImage(input.imageUrl, input.imagePublicId)) {
      fail(400, 'Please check the highlighted fields.', { imageUrl: 'The uploaded image could not be verified. Upload it again.' });
    }
    out.imageUrl = images.deliveryUrl(input.imagePublicId);
  }
  return out;
}

async function releaseImage(c: Ctx, publicId: string | null) {
  if (!publicId) return;
  if ((await countImageRefs(c.get('db'), publicId)) > 0) return;
  try {
    await c.get('deps').images.destroy(publicId);
  } catch (err) {
    console.error(`[${c.get('correlationId')}] image cleanup failed: ${err instanceof Error ? err.message : err}`);
  }
}

const listQuery = z.object({
  status: z.enum(['all', 'draft', 'published', 'archived']).default('all'),
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
});

adminProductRoutes.get('/', async (c) => {
  const q = listQuery.parse(c.req.query());
  const rows = await listProducts(c.get('db'), {
    statuses: q.status === 'all' ? ['draft', 'published', 'archived'] : [q.status],
    search: q.search || undefined,
    category: q.category || undefined,
  });
  const { allowedHosts } = c.get('deps').config;
  return c.json(rows.map(r => toProduct(r, allowedHosts)));
});

adminProductRoutes.post('/', async (c) => {
  await limit(c, 'owner-write', ownerKey(c), 60, 60);
  const input = productInputSchema.parse(checkProduct(c, productInputSchema.parse(await body(c, z.unknown()))));
  const row = await insertProduct(c.get('db'), input);
  await audit(c, 'product.create', 'success', row.id);
  return c.json(toProduct(row, c.get('deps').config.allowedHosts), 201);
});

adminProductRoutes.patch('/:id', async (c) => {
  await limit(c, 'owner-write', ownerKey(c), 60, 60);
  const patch = checkProduct(c, await body(c, productPatchSchema));
  const before = await getProduct(c.get('db'), c.req.param('id'));
  if (!before) fail(404, 'Product not found.');
  const row = await updateProduct(c.get('db'), before.id, patch);
  if (before.image_public_id && before.image_public_id !== row!.image_public_id) await releaseImage(c, before.image_public_id);
  await audit(c, 'product.update', 'success', before.id);
  return c.json(toProduct(row!, c.get('deps').config.allowedHosts));
});

adminProductRoutes.post('/:id/duplicate', async (c) => {
  await limit(c, 'owner-write', ownerKey(c), 60, 60);
  const src = await getProduct(c.get('db'), c.req.param('id'));
  if (!src) fail(404, 'Product not found.');
  const row = await insertProduct(c.get('db'), {
    title: `${src.title.slice(0, 190)} (copy)`, description: src.description, category: src.category,
    rating: Number(src.rating), reviewCount: src.review_count, imageUrl: src.image_url, imagePublicId: src.image_public_id,
    affiliateUrl: src.affiliate_url, affiliateTag: src.affiliate_tag, subId: src.sub_id, badge: src.badge,
    featured: false, status: 'draft', sortOrder: src.sort_order,
  });
  await audit(c, 'product.duplicate', 'success', row.id);
  return c.json(toProduct(row, c.get('deps').config.allowedHosts), 201);
});

adminProductRoutes.delete('/:id', async (c) => {
  await limit(c, 'owner-write', ownerKey(c), 60, 60);
  const { rows } = await c.get('db').query<{ id: string; image_public_id: string | null }>(
    'DELETE FROM products WHERE id = $1 RETURNING id, image_public_id', [z.uuid().parse(c.req.param('id'))]
  );
  if (!rows[0]) fail(404, 'Product not found.');
  await releaseImage(c, rows[0].image_public_id);
  await audit(c, 'product.delete', 'success', rows[0].id);
  return c.json({ ok: true });
});

adminProductRoutes.post('/bulk', async (c) => {
  await limit(c, 'owner-write', ownerKey(c), 60, 60);
  const { ids, action } = await body(c, bulkActionSchema);
  const db = c.get('db');
  let affected = 0;
  if (action === 'delete') {
    const { rows } = await db.query<{ image_public_id: string | null }>(
      'DELETE FROM products WHERE id = ANY($1) RETURNING image_public_id', [ids]
    );
    affected = rows.length;
    for (const r of rows) await releaseImage(c, r.image_public_id);
  } else {
    const set = {
      publish: "status = 'published'", draft: "status = 'draft'", archive: "status = 'archived'",
      feature: 'featured = true', unfeature: 'featured = false',
    }[action];
    affected = (await db.query(`UPDATE products SET ${set}, updated_at = now() WHERE id = ANY($1)`, [ids])).rowCount;
  }
  await audit(c, `product.bulk_${action}`, 'success', `${affected} product(s)`);
  return c.json({ affected });
});

// Signature for a direct browser → Cloudinary upload.
adminProductRoutes.post('/images/sign', async (c) => {
  await limit(c, 'upload', ownerKey(c), 30, 60);
  const { images } = c.get('deps');
  if (!images.configured) fail(503, 'Image uploads are not configured yet (Cloudinary keys).');
  return c.json(await images.signUpload());
});
