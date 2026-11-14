import type { ProductSpec } from './productCopy';

// Structured facts about a find (brand, product type, tier, comparable specs).
// They exist so finds of the same type can be filtered and lined up side by side.

export const TIERS = ['budget', 'value', 'premium'] as const;
export type Tier = typeof TIERS[number];

/** The owner's judgement of where a find sits, never a price. */
export const TIER_LABELS: Record<Tier, string> = {
  budget: 'Budget',
  value: 'Value for money',
  premium: 'Premium',
};

export const isTier = (v: unknown): v is Tier => typeof v === 'string' && (TIERS as readonly string[]).includes(v);

export const MAX_SPECS = 24;
export const SPEC_NAME_MAX = 60;
export const SPEC_VALUE_MAX = 200;

/** The usual rows for common product types, so two finds of one type get the same row names. */
export const SPEC_TEMPLATES: Record<string, readonly string[]> = {
  Mouse: ['Connection', 'Sensor', 'Max DPI', 'Polling rate', 'Buttons', 'Weight', 'Battery life', 'Hand'],
  Keyboard: ['Layout', 'Switches', 'Connection', 'Backlight', 'Hot-swappable', 'Battery life', 'Weight'],
  Headphones: ['Style', 'Connection', 'Noise cancelling', 'Driver size', 'Battery life', 'Microphone', 'Weight'],
  Earbuds: ['Connection', 'Noise cancelling', 'Battery life', 'Battery life with case', 'Water resistance', 'Microphone'],
  Monitor: ['Screen size', 'Resolution', 'Panel', 'Refresh rate', 'Response time', 'Ports', 'Stand'],
  'Power bank': ['Capacity', 'Max output', 'Ports', 'Fast charging', 'Weight'],
  Charger: ['Max output', 'Ports', 'Fast charging', 'Cable included'],
  Speaker: ['Connection', 'Output power', 'Battery life', 'Water resistance', 'Weight'],
  'Desk lamp': ['Brightness', 'Colour temperature', 'Dimming', 'Power source', 'Mount'],
  Webcam: ['Resolution', 'Frame rate', 'Field of view', 'Microphone', 'Connection'],
};

/** Row names match when they differ only in case, spacing or punctuation ("Max DPI" = "max-dpi"). */
export function specKey(name: string): string {
  return name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

export function specTemplate(productType: string): readonly string[] {
  const key = specKey(productType);
  if (!key) return [];
  const match = Object.keys(SPEC_TEMPLATES).find(t => specKey(t) === key);
  return match ? SPEC_TEMPLATES[match]! : [];
}

/**
 * Adds rows to a spec list without touching the rows already there: a name that is already
 * present (see specKey) is skipped, long text is cut to the limits and the list stops at MAX_SPECS.
 */
export function mergeSpecs(current: readonly ProductSpec[], additions: readonly ProductSpec[]): ProductSpec[] {
  const out = current.map(s => ({ ...s }));
  const seen = new Set(out.map(s => specKey(s.name)).filter(Boolean));
  for (const add of additions) {
    if (out.length >= MAX_SPECS) break;
    const name = add.name.trim().replace(/:$/, '').slice(0, SPEC_NAME_MAX).trim();
    const key = specKey(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ name, value: add.value.trim().slice(0, SPEC_VALUE_MAX).trim() });
  }
  return out;
}
