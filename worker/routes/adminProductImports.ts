import { Hono } from 'hono';
import { body, fail, limit, type AppEnv } from '../app';
import { requireOwner } from '../auth/sessions';
import { audit } from '../lib/audit';
import { identifyProductUrl, productImportRequestSchema, assistedProductDraftSchema } from '../../shared/productImport';
import { applyAssociateTag } from '../lib/affiliateLinks';
import { normalizeAffiliateUrl } from '../../shared/urlPolicy';
import { findProductIdentity, insertAssistedDraft } from '../repo/productSources';
import { toProduct } from '../repo/products';
import { resolveProductUrl } from '../lib/productImport/resolveProductUrl';

export const adminProductImportRoutes = new Hono<AppEnv>();
adminProductImportRoutes.use('*', requireOwner());

adminProductImportRoutes.post('/preview', async c => {
  const ownerId = c.get('session')!.ownerId;
  await limit(c, 'product-import', ownerId, 5, 60);
  const input = await body(c, productImportRequestSchema);
  const { config, productImporter } = c.get('deps');
  if (!productImporter || !['owner-content', 'amazon-page'].includes(productImporter.id)) fail(503, 'The selected import provider is not ready. Manual product editing is available.');
  const { url, identity } = await resolveProductUrl(input.url, config.allowedHosts);
  const preview = await productImporter.preview({ ...input, url: applyAssociateTag(url, config) }, identity);
  const duplicate = await findProductIdentity(c.get('db'), identity, config.allowedHosts);
  await audit(c, 'product.import_preview', 'success', identity.asin);
  return c.json({ ...preview, duplicate });
});

adminProductImportRoutes.post('/draft', async c => {
  const ownerId = c.get('session')!.ownerId;
  await limit(c, 'owner-write', ownerId, 60, 60);
  const { product, source } = await body(c, assistedProductDraftSchema);
  const { config, images, productImporter } = c.get('deps');
  if (!productImporter || !['owner-content', 'amazon-page'].includes(productImporter.id)) fail(503, 'Product import is not active.');
  if (source.provider !== productImporter.id) fail(400, 'Prepare a new preview before saving this imported product.');
  const identity = identifyProductUrl(product.affiliateUrl, config.allowedHosts);
  if (!identity) fail(400, 'Use a full Amazon product URL.', { affiliateUrl: 'A full product link with a 10-character ASIN is required.' });
  if (product.imagePublicId && !images.isOwnImage(product.imageUrl, product.imagePublicId)) {
    fail(400, 'Please check the image.', { imageUrl: 'The uploaded image could not be verified. Upload it again.' });
  }
  const input = { ...product, affiliateUrl: applyAssociateTag(normalizeAffiliateUrl(product.affiliateUrl, config.allowedHosts)!, config, product.affiliateTag, product.subId),
    imageUrl: product.imagePublicId ? images.deliveryUrl(product.imagePublicId) : product.imageUrl, status: 'draft' as const };
  const row = await insertAssistedDraft(c.get('db'), input, source, identity, ownerId, config.allowedHosts);
  if (!row) fail(409, 'This product is already in your catalog. Open the existing product to edit it.');
  await audit(c, 'product.import_draft', 'success', row.id);
  return c.json(toProduct(row, config.allowedHosts), 201);
});
