import { z } from 'zod';
import { normalizeAffiliateUrl, isShortLink } from './urlPolicy';
import { CATEGORIES } from './types';
import { productInputSchema } from './schemas';

export type ProductIdentity = { marketplace: 'amazon.in' | 'amazon.com'; asin: string; canonicalUrl: string };

/** Parses supplied text only. Never resolves redirects or downloads product pages. */
export function identifyProductUrl(raw: string, allowedHosts: readonly string[]): ProductIdentity | null {
  const normalized = normalizeAffiliateUrl(raw, allowedHosts);
  if (!normalized) return null;
  const url = new URL(normalized);
  const marketplace = url.hostname.replace(/^www\./, '');
  if (marketplace !== 'amazon.in' && marketplace !== 'amazon.com') return null;
  const match = url.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([a-z0-9]{10})(?:\/|$)/i);
  if (!match) return null;
  const asin = match[1]!.toUpperCase();
  return { marketplace, asin, canonicalUrl: `https://www.${marketplace}/dp/${asin}` };
}

export function isProductShortLink(raw: string, allowedHosts: readonly string[]): boolean {
  const normalized = normalizeAffiliateUrl(raw, allowedHosts);
  return normalized ? isShortLink(new URL(normalized).hostname) : false;
}

const sourceUrl = z.string().trim().max(2048).url().refine(v => {
  const u = new URL(v);
  return u.protocol === 'https:' && !u.username && !u.password && !u.port;
}, 'Use an https source reference without credentials or a custom port.');

export const productImportRequestSchema = z.strictObject({
  url: z.string().trim().min(1).max(2048),
  title: z.string().trim().max(200).default(''),
  description: z.string().trim().max(2000).default(''),
  features: z.array(z.string().trim().min(1).max(200)).max(5).default([]),
  category: z.enum(CATEGORIES).optional(),
  sourceUrl: sourceUrl.optional(),
});
export type ProductImportRequest = z.infer<typeof productImportRequestSchema>;

export const ownerContentSourceSchema = z.strictObject({
  provider: z.enum(['owner-content', 'amazon-page']),
  sourceUrl: sourceUrl.optional(),
  contentAuthorized: z.literal(true, { error: 'Confirm that you may use the supplied content and image.' }),
});
export type OwnerContentSource = z.infer<typeof ownerContentSourceSchema>;
export const assistedProductDraftSchema = z.strictObject({
  product: productInputSchema,
  source: ownerContentSourceSchema,
});

export const productImportPreviewSchema = z.object({
  provider: z.enum(['owner-content', 'amazon-page', 'amazon-api']),
  identity: z.object({ marketplace: z.enum(['amazon.in', 'amazon.com']), asin: z.string(), canonicalUrl: z.string() }),
  affiliateUrl: z.string(),
  suggestions: z.object({ title: z.string().max(200).optional(), description: z.string().max(2000).optional(), category: z.enum(CATEGORIES).optional(), imageUrl: sourceUrl.optional() }),
  details: z.object({ brand: z.string().max(200).optional(), model: z.string().max(200).optional(), features: z.array(z.string().max(1000)).max(12), specifications: z.array(z.object({ name: z.string().max(80), value: z.string().max(500) })).max(40) }).optional(),
  provenance: z.enum(['owner-supplied', 'product-page', 'catalog-api']),
  sourceUrl: z.string().optional(),
  warnings: z.array(z.string()),
  duplicate: z.object({ id: z.string(), title: z.string() }).nullable(),
});
export type ProductImportPreview = z.infer<typeof productImportPreviewSchema>;

/** Keep any filled editor fields. Selecting replacements is an explicit owner action. */
export function applyImportFields<T extends { title: string; description: string; category: string; affiliateUrl: string; status: string }>(
  current: T, preview: ProductImportPreview, selected: { title: boolean; description: boolean; category: boolean; affiliateUrl: boolean; imageUrl?: boolean },
): T {
  return {
    ...current,
    ...(selected.title && preview.suggestions.title ? { title: preview.suggestions.title } : {}),
    ...(selected.description && preview.suggestions.description ? { description: preview.suggestions.description } : {}),
    ...(selected.category && preview.suggestions.category ? { category: preview.suggestions.category } : {}),
    ...(selected.affiliateUrl ? { affiliateUrl: preview.affiliateUrl } : {}),
    ...(selected.imageUrl && preview.suggestions.imageUrl ? { imageUrl: preview.suggestions.imageUrl, imagePublicId: null } : {}),
    status: 'draft',
  };
}
