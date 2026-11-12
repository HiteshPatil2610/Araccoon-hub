import { z } from 'zod';
import type { PublicProduct } from './types';

// Collections: owner-made themed lists of finds, each with its own page at /collections/<slug>.

export type CollectionStatus = 'draft' | 'published';
export const MAX_COLLECTION_PRODUCTS = 60;

/** What the storefront lists: published collections that have at least one published find. */
export interface CollectionSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  productCount: number;
  /** Image of the first find, for the card and link previews. */
  coverImageUrl: string | null;
}

/** A collection page: the summary plus its published finds, in the owner's order. */
export interface PublicCollection extends CollectionSummary {
  products: PublicProduct[];
}

/** Full record for the owner hub. `productIds` keeps the owner's order and may include unpublished finds. */
export interface Collection {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: CollectionStatus;
  sortOrder: number;
  productIds: string[];
  updatedAt: string;
}

const text = (max: number) => z.string().trim().max(max, `Must be at most ${max} characters.`);

export const collectionInputSchema = z.strictObject({
  title: text(80).min(1, 'Title is required.'),
  description: text(300).default(''),
  status: z.enum(['draft', 'published']).default('draft'),
  sortOrder: z.number().int().min(-1_000_000).max(1_000_000).default(0),
  productIds: z.array(z.uuid()).max(MAX_COLLECTION_PRODUCTS, `A collection holds at most ${MAX_COLLECTION_PRODUCTS} finds.`)
    .refine(ids => new Set(ids.map(id => id.toLowerCase())).size === ids.length, 'A find can only be listed once.')
    .default([]),
});
export type CollectionInput = z.infer<typeof collectionInputSchema>;

// PATCH only touches supplied keys, so create-time defaults are removed (same reason as productPatchSchema).
const patchFields = Object.fromEntries(Object.entries(collectionInputSchema.shape).map(([key, schema]) => [
  key, (schema instanceof z.ZodDefault ? schema.removeDefault() : schema).optional(),
])) as unknown as { [K in keyof CollectionInput]: z.ZodOptional<z.ZodType<CollectionInput[K]>> };
export const collectionPatchSchema = z.strictObject(patchFields);
export type CollectionPatch = z.infer<typeof collectionPatchSchema>;

export const COLLECTION_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const collectionPath = (slug: string) => `/collections/${slug}`;
