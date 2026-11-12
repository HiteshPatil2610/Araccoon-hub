import { z } from 'zod';

// Short storefront copy the owner can edit in the hub. Each key has a built-in
// default, so a required slot is never empty: a missing or reset value falls
// back to the default below. Optional slots (the announcement) default to empty,
// which hides them. Keys are letters only (the site_text table enforces it).
export const SITE_TEXT_GROUPS = ['Announcement', 'Home page', 'Footer', 'Search results'] as const;
export type SiteTextGroup = typeof SITE_TEXT_GROUPS[number];

type Field = {
  group: SiteTextGroup;
  label: string;
  help: string;
  max: number;
  multiline: boolean;
  default: string;
  /** Optional slots may be left empty; empty hides them on the site. */
  optional?: boolean;
  /** A link: a site path such as /articles or a full https:// address. */
  link?: boolean;
};

export const SITE_TEXT_FIELDS = {
  announcement: {
    group: 'Announcement',
    label: 'Announcement',
    help: 'A short message in a banner at the bottom of the storefront and journal, e.g. "Prime Day picks are live". Leave empty to hide the banner.',
    max: 120,
    multiline: false,
    default: '',
    optional: true,
  },
  announcementLink: {
    group: 'Announcement',
    label: 'Announcement link',
    help: 'Optional. Where the banner goes when clicked: a page on this site such as /articles, or a full https:// address.',
    max: 200,
    multiline: false,
    default: '',
    optional: true,
    link: true,
  },
  heroLineA: {
    group: 'Home page',
    label: 'Hero tagline 1',
    help: 'First short line left of "Hub" in the hero.',
    max: 24,
    multiline: false,
    default: 'Small finds.',
  },
  heroLineB: {
    group: 'Home page',
    label: 'Hero tagline 2',
    help: 'Second line left of "Hub".',
    max: 24,
    multiline: false,
    default: 'Hand-picked.',
  },
  heroLineC: {
    group: 'Home page',
    label: 'Hero tagline 3',
    help: 'First line right of "Hub".',
    max: 24,
    multiline: false,
    default: 'Clever objects.',
  },
  heroLineD: {
    group: 'Home page',
    label: 'Hero tagline 4',
    help: 'Second line right of "Hub".',
    max: 24,
    multiline: false,
    default: 'Everyday upgrades.',
  },
  heroBlurb: {
    group: 'Home page',
    label: 'Hero introduction',
    help: 'The short paragraph under "The Raccoon story" in the hero.',
    max: 220,
    multiline: true,
    default: 'Desk essentials, clever gadgets and unexpected home finds, hand-picked. Find your next favourite, then view it on Amazon.',
  },
  emptyCatalog: {
    group: 'Home page',
    label: 'Empty catalog message',
    help: 'The heading shown in the catalog when no products are published yet.',
    max: 60,
    multiline: false,
    default: 'New finds are on the way.',
  },
  footerIdea: {
    group: 'Footer',
    label: 'Footer: the idea',
    help: 'One line about the site, in the footer.',
    max: 160,
    multiline: true,
    default: 'A small internet treasure map of clever objects and useful oddities.',
  },
  seoTitle: {
    group: 'Search results',
    label: 'Search title',
    help: 'The home page title in search results and browser tabs. About 60 characters.',
    max: 70,
    multiline: false,
    default: 'Raccoon Hub — small finds, everyday upgrades',
  },
  seoDescription: {
    group: 'Search results',
    label: 'Search description',
    help: 'The summary under the title in search results and link previews. About 150 characters.',
    max: 160,
    multiline: true,
    default: 'Raccoon Hub — clever objects, useful oddities and little upgrades, hand-picked from Amazon.',
  },
} as const satisfies Record<string, Field>;

export type SiteTextKey = keyof typeof SITE_TEXT_FIELDS;
export type SiteText = Record<SiteTextKey, string>;

export const SITE_TEXT_KEYS = Object.keys(SITE_TEXT_FIELDS) as SiteTextKey[];

export const DEFAULT_SITE_TEXT = Object.fromEntries(
  SITE_TEXT_KEYS.map(k => [k, SITE_TEXT_FIELDS[k].default]),
) as SiteText;

export const isSiteTextKey = (key: string): key is SiteTextKey => Object.hasOwn(SITE_TEXT_FIELDS, key);

/** The field definition with the optional flags visible to TypeScript. */
export const siteTextField = (key: SiteTextKey): Field => SITE_TEXT_FIELDS[key];

/** Stored values over defaults; unknown keys and blank values are ignored. */
export function mergeSiteText(stored: Record<string, string>): SiteText {
  const out = { ...DEFAULT_SITE_TEXT };
  for (const [key, value] of Object.entries(stored)) {
    if (isSiteTextKey(key) && value.trim()) out[key] = value;
  }
  return out;
}

// One line of plain text: no control characters or line breaks.
const PLAIN = /^[^\p{Cc}]*$/u;
const line = (max: number) => z.string().trim().min(1, 'Enter some text, or reset to the default.').max(max, `Use ${max} characters or fewer.`)
  .regex(PLAIN, 'Use plain text on one line.');
// Optional slots: empty clears the slot (stored as a reset).
const optionalLine = (max: number) => z.string().trim().max(max, `Use ${max} characters or fewer.`)
  .regex(PLAIN, 'Use plain text on one line.');
// A site path (not protocol-relative, no backslashes) or an https:// address.
export const SAFE_LINK = /^(?:\/(?![/\\])[^\s\\]*|https:\/\/[^\s/\\]+(?:\/[^\s\\]*)?)$/;
const optionalLink = (max: number) => optionalLine(max)
  .refine(v => !v || SAFE_LINK.test(v), 'Use a site path such as /articles or a full https:// address.');

function fieldSchema(key: SiteTextKey) {
  const f = siteTextField(key);
  const base = f.link ? optionalLink(f.max) : f.optional ? optionalLine(f.max) : line(f.max);
  return base.transform(v => v || null).nullable().optional();
}

/** PUT body: a value sets the text, null (or empty, for optional slots) resets it to the default. */
export type SiteTextPatch = Partial<Record<SiteTextKey, string | null>>;
export const siteTextPatchSchema: z.ZodType<SiteTextPatch> = z.strictObject(
  Object.fromEntries(SITE_TEXT_KEYS.map(k => [k, fieldSchema(k)])),
) as unknown as z.ZodType<SiteTextPatch>;

export interface SiteTextState {
  values: SiteText;
  /** Keys the owner has changed from the default. */
  customized: SiteTextKey[];
  updatedAt: string | null;
}
