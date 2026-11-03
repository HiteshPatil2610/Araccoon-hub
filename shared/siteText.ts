import { z } from 'zod';

// Short storefront copy the owner can edit in the hub. Each key has a built-in
// default, so the site never shows an empty slot: a missing or reset value
// falls back to the default below.
export const SITE_TEXT_FIELDS = {
  heroBlurb: {
    label: 'Hero introduction',
    help: 'The short paragraph under "The Raccoon story" in the hero.',
    max: 220,
    multiline: true,
    default: 'Desk essentials, clever gadgets and unexpected home finds, hand-picked. Find your next favourite, then view it on Amazon.',
  },
  storyBlurb: {
    label: 'Story text (no pick yet)',
    help: 'Shown in the story section while there are no featured finds.',
    max: 200,
    multiline: true,
    default: 'Desk essentials, clever gadgets and unexpected home finds, picked one at a time.',
  },
  amazonBlurb: {
    label: 'Opening on Amazon',
    help: 'Explains that finds open on Amazon.',
    max: 200,
    multiline: true,
    default: 'Every find opens on Amazon in a new tab, where prices and availability are set. No accounts, no checkout here.',
  },
  footerIdea: {
    label: 'Footer: the idea',
    help: 'One line about the site, in the footer.',
    max: 160,
    multiline: true,
    default: 'A small internet treasure map of clever objects and useful oddities.',
  },
  footerNote: {
    label: 'Footer: good to know',
    help: 'A short note in the footer.',
    max: 160,
    multiline: true,
    default: 'Prices and availability are shown on Amazon and may change.',
  },
  seoTitle: {
    label: 'Search title',
    help: 'The home page title in search results and browser tabs. About 60 characters.',
    max: 70,
    multiline: false,
    default: 'Raccoon Hub — small finds, everyday upgrades',
  },
  seoDescription: {
    label: 'Search description',
    help: 'The summary under the title in search results and link previews. About 150 characters.',
    max: 160,
    multiline: true,
    default: 'Raccoon Hub — clever objects, useful oddities and little upgrades, hand-picked from Amazon.',
  },
} as const;

export type SiteTextKey = keyof typeof SITE_TEXT_FIELDS;
export type SiteText = Record<SiteTextKey, string>;

export const SITE_TEXT_KEYS = Object.keys(SITE_TEXT_FIELDS) as SiteTextKey[];

export const DEFAULT_SITE_TEXT = Object.fromEntries(
  SITE_TEXT_KEYS.map(k => [k, SITE_TEXT_FIELDS[k].default]),
) as SiteText;

export const isSiteTextKey = (key: string): key is SiteTextKey => Object.hasOwn(SITE_TEXT_FIELDS, key);

/** Stored values over defaults; unknown keys and blank values are ignored. */
export function mergeSiteText(stored: Record<string, string>): SiteText {
  const out = { ...DEFAULT_SITE_TEXT };
  for (const [key, value] of Object.entries(stored)) {
    if (isSiteTextKey(key) && value.trim()) out[key] = value;
  }
  return out;
}

// One line of plain text: no control characters or line breaks.
const line = (max: number) => z.string().trim().min(1, 'Enter some text, or reset to the default.').max(max, `Use ${max} characters or fewer.`)
  .regex(/^[^\p{Cc}]*$/u, 'Use plain text on one line.');

/** PUT body: a value sets the text, null resets it to the default. */
export const siteTextPatchSchema = z.strictObject(
  Object.fromEntries(SITE_TEXT_KEYS.map(k => [k, line(SITE_TEXT_FIELDS[k].max).nullable().optional()])) as {
    [K in SiteTextKey]: z.ZodOptional<z.ZodNullable<z.ZodString>>
  },
);
export type SiteTextPatch = z.infer<typeof siteTextPatchSchema>;

export interface SiteTextState {
  values: SiteText;
  /** Keys the owner has changed from the default. */
  customized: SiteTextKey[];
  updatedAt: string | null;
}
