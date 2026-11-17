import { z } from 'zod';
import { MAX_SPECS, SPEC_NAME_MAX, SPEC_VALUE_MAX, TIERS, specKey } from './productFacts';

// Request schemas shared by the admin form and the API. The API is
// authoritative; the form uses the same rules for instant feedback.

const text = (max: number) => z.string().trim().max(max, `Must be at most ${max} characters.`);
const token = (max: number) => z.string().trim().max(max).regex(/^[A-Za-z0-9._-]*$/, 'Only letters, numbers, dot, dash and underscore.');

export const productInputSchema = z.strictObject({
  title: text(200).min(1, 'Title is required.'),
  description: text(2000).default(''),
  category: text(60).min(1, 'Category is required.'),
  rating: z.number().finite().min(0).max(5).multipleOf(0.1).default(5),
  reviewCount: z.number().int().min(0).max(100_000_000).default(0),
  imageUrl: z.string().trim().url().max(2048).refine(v => v.startsWith('https://'), 'Image must be an https URL.'),
  // Cloudinary public ids are folder paths: araccoon-hub/products/<name>
  imagePublicId: z.string().trim().max(255)
    .regex(/^[A-Za-z0-9_-]+(\/[A-Za-z0-9._-]+)*$/, 'Invalid image reference.')
    .refine(v => !v.split('/').includes('..'), 'Invalid image reference.')
    .nullable().default(null),
  affiliateUrl: z.string().trim().min(1, 'Amazon link is required.').max(2048),
  affiliateTag: token(64).nullable().default(null),
  subId: token(64).nullable().default(null),
  badge: text(40).nullable().default(null),
  // The owner's own words on why this find made the cut; empty means none.
  pickNote: text(280).transform(v => v || null).nullable().default(null),
  // Structured facts for filtering and comparing finds; all optional (see productFacts.ts).
  brand: text(60).transform(v => v || null).nullable().default(null),
  productType: text(40).transform(v => v || null).nullable().default(null),
  tier: z.enum(TIERS).nullable().default(null),
  specs: z.array(z.strictObject({
    name: text(SPEC_NAME_MAX).min(1, 'Every spec needs a name.'),
    value: text(SPEC_VALUE_MAX).min(1, 'Every spec needs a value.'),
  })).max(MAX_SPECS, `At most ${MAX_SPECS} specs.`)
    .refine(list => new Set(list.map(s => specKey(s.name))).size === list.length, 'Each spec name can be used once.')
    .default([]),
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  sortOrder: z.number().int().min(-1_000_000).max(1_000_000).default(0),
});
export type ProductInput = z.infer<typeof productInputSchema>;

// Zod defaults inside .partial() still run for omitted fields. PATCH must only
// touch supplied keys; create-time defaults would otherwise erase saved copy.
const productPatchFields = Object.fromEntries(Object.entries(productInputSchema.shape).map(([key, schema]) => [
  key, (schema instanceof z.ZodDefault ? schema.removeDefault() : schema).optional(),
])) as unknown as { [K in keyof ProductInput]: z.ZodOptional<z.ZodType<ProductInput[K]>> };
export const productPatchSchema = z.strictObject(productPatchFields);
export type ProductPatch = z.infer<typeof productPatchSchema>;

const trackingToken = z.string().trim().max(100).regex(/^[A-Za-z0-9._~ -]*$/);

export const trackClickSchema = z.strictObject({
  productId: z.uuid(),
  clickKey: z.uuid().optional(),
  utmSource: trackingToken.optional(),
  utmMedium: trackingToken.optional(),
  utmCampaign: trackingToken.optional(),
  referrer: z.string().max(2048).optional(),
});

export const bulkActionSchema = z.strictObject({
  ids: z.array(z.uuid()).min(1).max(200),
  action: z.enum(['publish', 'draft', 'archive', 'feature', 'unfeature', 'delete']),
});

export const manualConversionSchema = z.strictObject({
  productId: z.uuid(),
  clickId: z.uuid().optional(),
  amountCents: z.number().int().min(0).max(100_000_000).optional(),
  note: text(200).optional(),
  occurredAt: z.iso.datetime().optional(),
});

export const webhookConversionSchema = z.strictObject({
  eventId: z.string().regex(/^[A-Za-z0-9._:-]{1,128}$/),
  productId: z.uuid(),
  clickId: z.uuid().optional(),
  amountCents: z.number().int().min(0).max(100_000_000).optional(),
});
