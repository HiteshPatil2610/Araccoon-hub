/** Small deterministic language parser: shorten names and organize source facts without generating claims. */
import { compactParts } from './featureFacts';
export type ProductSpec = { name: string; value: string };
export type DescriptionPart = { label?: string; value: string };
const tidy = (text: string) => text.replace(/[\u200e\u200f]/g, '').replace(/\s+/g, ' ').trim();
const unbold = (text: string) => text.replace(/\*\*/g, '');
const unique = (values: string[]) => values.filter((value, i, all) => all.findIndex(other => other.toLowerCase().replace(/\s+/g, '') === value.toLowerCase().replace(/\s+/g, '')) === i);
const sentences = (value: string) => value.match(/.*?[.!?](?=\s|$)|.+$/g)?.map(tidy).filter(Boolean) || [value];
// Never turn a long source sentence into a cut-off word or partial specification.
const shorten = (value: string, limit: number) => {
  if (value.length <= limit) return value;
  let complete = '';
  for (const sentence of sentences(value)) {
    const next = complete ? `${complete} ${sentence}` : sentence;
    if (next.length > limit) break;
    complete = next;
  }
  if (complete.trim()) return complete.trim();
  return `${value.slice(0, limit - 1).replace(/\s+\S*$/, '').trim()}…`;
};

export function productName(raw: string): string {
  let name = tidy(raw).replace(/\{\s*smart\s*choice\s*\}|\[\s*(?:smart\s*choice|amazon'?s?\s*choice)\s*\]/gi, '').trim();
  name = tidy(name.split(/\s*\|\s*/)[0]!);
  // Listing specs follow commas and screen-size phrases; model and generation remain in the name.
  name = name.split(/,\s*/)[0]!;
  const metric = name.search(/\s+\d+(?:\.\d+)?\s*(?:[- ]?inch(?:es)?\b|["”]|\(\d+(?:\.\d+)?\s*cm\))/i);
  if (metric > 0) name = name.slice(0, metric);
  // Remove a trailing product-type/spec block only after a recognizable model token.
  const type = name.search(/\s+(?:(?:QHD|FHD|UHD|IPS|OLED|\d+\s*Hz|gaming|wireless|wired|RGB|AI)\s+)*(?:monitor|mouse|keyboard|headphones|earbuds|laptop|smartphone|tablet|smartwatch|speaker|camera|projector)\b/i);
  const accessoryName = /\b(?:monitor|mouse|laptop|phone|tablet)\s+(?:arm|stand|mount|riser|holder|case|cover|pad)\b/i.test(name);
  if (!accessoryName && type > 0 && /\b(?:[a-z][\w-]*\d[\w-]*|\d[\w-]*[a-z][\w-]*|\d{3,5})\b/i.test(name.slice(0, type))) name = name.slice(0, type);
  return tidy(name).slice(0, 200) || tidy(raw).slice(0, 200);
}

/** Handles newline specs as well as legacy bullet/pipe-heavy imported paragraphs. */
export function descriptionParts(description: string): DescriptionPart[] {
  return description.replace(/\r/g, '').split(/\n|\s*[•●]\s*|\s+\|\s+/).map(unbold).map(tidy).filter(Boolean).map(value => {
    const match = /^([^:]{2,80}):\s*(.+)$/.exec(value);
    return match ? { label: match[1]!.replace(/^[\[【]\s*|\s*[\]】]$/g, '').trim(), value: match[2]!.trim() } : { value };
  });
}

export function formatProductCopy(rawTitle: string, description: string, specifications: ProductSpec[] = [], features: string[] = []) {
  const title = productName(rawTitle);
  const rawParts = descriptionParts(description);
  const parts = compactParts(rawParts);
  const rows: DescriptionPart[] = [];
  const add = (label: string, raw: string | undefined) => {
    if (!raw) return;
    const value = shorten(tidy(unbold(raw)).replace(/[.;\s]+$/, ''), 180);
    if (!value || rows.some(row => row.label?.toLowerCase() === label.toLowerCase())) return;
    rows.push({ label, value });
  };
  const featureParts = compactParts(features.flatMap(descriptionParts), true);
  const facts = [...specifications.map(s => ({ label: s.name.replace(/:$/, ''), value: s.value })), ...parts, ...featureParts.filter(p => p.label)];
  const field = (pattern: RegExp) => facts.find(p => p.label && pattern.test(p.label))?.value;
  const source = tidy([rawTitle, description, ...specifications.map(s => `${s.name}: ${s.value}`), ...features].join(' '));
  // Product nouns in accessories describe compatibility, not the accessory's own specifications.
  const head = rawTitle.split(/[|,]/)[0]!;
  const accessory = /\b(?:monitor|screen|display|mouse|laptop|phone|tablet|headphone)\s+(?:arm|stand|mount|riser|bracket|holder|adapter|adaptor|case|cover|sleeve|protector|cable|pad)\b/i.test(head)
    || (/\b(?:arm|stand|mount|riser|bracket|holder|adapter|adaptor|case|cover|sleeve|protector|cable|pad)\b/i.test(head) && !/\b(?:monitor|mouse)\b.*\bwith\b/i.test(head));
  const ownDisplay = field(/^(?:display|screen size)$/i);
  const monitor = !accessory && (/\bmonitor\b/i.test(rawTitle)
    || (Boolean(ownDisplay) && /(?:refresh rate|\d+\s*hz)/i.test(source) && /\b(?:QHD|FHD|IPS|OLED)\b/i.test(source))
    || (/\d+\s*hz/i.test(rawTitle) && /\b(?:QHD|FHD|IPS|OLED)\b/i.test(rawTitle)));
  const excluded = /^(?:manufacturer|item model number|model(?: name| number)?|asin|customer reviews|best sellers rank|date first available)$/i;
  const serialize = (entries: DescriptionPart[]) => {
    const lines: string[] = [];
    for (const p of entries) {
      const line = p.label ? `${p.label}: ${p.value}` : p.value;
      if (lines.join('\n').length + line.length + 1 > 2000) continue;
      lines.push(line);
    }
    return { title, description: lines.join('\n') };
  };
  // Specialized extraction adds useful prose facts; it must not discard other source attributes.
  const finish = (covered: RegExp) => {
    for (const fact of facts) {
      if (fact.label && !excluded.test(fact.label) && !covered.test(fact.label)) add(fact.label, fact.value);
    }
    return serialize(rows);
  };
  if (monitor) {
    const size = source.match(/\b(\d+(?:\.\d+)?)\s*(?:[- ]?inch(?:es)?\b|["”])/i);
    const resolution = source.match(/\b(?:WQHD|QHD|FHD|UHD|4K|8K|\d{3,4}\s*[x×]\s*\d{3,4})\b/i);
    const panel = source.match(/\b(?:IPS|OLED|VA|TN)\b/i);
    add('Display', [size ? `${size[1]}-inch` : '', resolution?.[0], panel?.[0]].filter(Boolean).join(' '));
    add('Refresh rate', (field(/^refresh rate$/i) || source).match(/\b\d{2,3}(?:\.\d+)?\s*Hz\b/i)?.[0]);
    const responseSource = field(/^response time$/i) || features.find(f => /response time/i.test(f)) || description;
    add('Response time', (responseSource || source).match(/\b\d+(?:\.\d+)?\s*ms\b(?:\s*\([^)]{1,25}\))?/i)?.[0]);
    const gamut = [...source.matchAll(/\b\d+(?:\.\d+)?%\s*(?:sRGB|DCI[- ]?P3|Adobe\s*RGB)\b/gi)].map(m => m[0]);
    add('Colour coverage', unique(gamut).map(value => value.replace(/%\s*/, '% ')).join(' · '));
    const ports = field(/^(?:connectivity|ports)$/i) || features.map(f => descriptionParts(f)).flat().find(p => /^(?:connectivity|ports)$/i.test(p.label || ''))?.value;
    add('Connectivity', ports || unique([...source.matchAll(/\b(?:\d\s*[x×]\s*)?(?:HDMI|DisplayPort|DP|USB[- ]?[AC])\s*\d?(?:\.\d)?(?:\s*TMDS)?/gi)].map(m => m[0])).join(' · '));
    const sync = [...source.matchAll(/\b(?:AMD\s*FreeSync(?:\s*Premium(?:\s*Pro)?)?|NVIDIA\s*G[- ]?SYNC(?:\s*Compatible)?|VESA\s*Adaptive\s*Sync)\b/gi)].map(m => m[0]);
    add('Adaptive sync', unique(sync).join(' · '));
    const adjustments = [...source.matchAll(/\b(?:tilt|swivel|pivot|height\s*adjust(?:able|ment)?)\b/gi)].map(m => m[0].toLowerCase());
    add('Adjustability', [...new Set(adjustments)].join(' · '));
    const warranty = field(/^warranty$/i);
    add('Warranty', warranty?.split(/\s+(?:brand|screen size|resolution):/i)[0] || source.match(/\b\d+\s*years?\s*(?:limited\s*)?warranty\b/i)?.[0]);
    add('Brightness', source.match(/\b\d{2,4}\s*nits\b/i)?.[0]);
    if (rows.length >= 2) return finish(/^(?:display|screen size|resolution|panel(?: type)?|refresh rate|response time|colour coverage|visual experience|connectivity|ports|adaptive sync|adjustability|warranty|brightness)$/i);
  }
  rows.length = 0;
  const mouse = !accessory && (/\bmouse\b/i.test(rawTitle)
    || /\b(?:gaming|wireless|wired|optical)\s+mouse\b/i.test(description + ' ' + features.join(' '))
    || (/\bsensor\b/i.test(source) && /\b(?:IPS|report rate|tracking speed)\b/i.test(source)));
  if (mouse) {
    const hero = /\bHERO\b/i.test(source) && /\boptical sensor\b/i.test(source);
    add('Sensor', field(/^sensor$/i) || (hero ? 'HERO optical sensor' : source.match(/\b(?:optical|laser) sensor\b/i)?.[0]));
    // Require the full unit; old imported text can end mid-word, e.g. "12,000 D".
    add('Sensitivity', field(/^(?:sensitivity|dpi)$/i) || source.match(/\b(?:up to\s+)?\d[\d,]*(?:\.\d+)?\s*DPI\b/i)?.[0]);
    add('Tracking speed', field(/^tracking speed$/i) || source.match(/\b\d+(?:\.\d+)?\s*IPS\b/i)?.[0]);
    const wireless = source.match(/\bLIGHTSPEED\s+Wireless\b/i)?.[0];
    add('Connection', field(/^connection$/i) || wireless || field(/^connectivity(?: technology)?$/i));
    add('Report rate', field(/^(?:report|polling) rate$/i) || source.match(/\b\d+(?:\.\d+)?\s*ms\s+report rate\b/i)?.[0].replace(/\s+report rate$/i, ''));
    const battery = source.match(/\b(?:up to\s+)?\d[\d,]*\s*hours\b/i)?.[0];
    const batteryParagraph = [...rawParts, ...features.flatMap(descriptionParts)].find(p => /\b\d[\d,]*\s*hours\b/i.test(p.value))?.value || '';
    const mode = batteryParagraph.match(/\bPerformance mode\b/i)?.[0];
    const batteryRate = batteryParagraph.match(/\b\d+(?:\.\d+)?\s*ms\s+report rate\b/i)?.[0];
    add('Battery life', field(/^battery life$/i) || (battery ? [battery, mode, batteryRate].filter(Boolean).join(' · ') : undefined));
    add('Power', field(/^(?:power|battery type)$/i) || source.match(/\b(?:one|\d+)\s+AA(?:A)?\s+batter(?:y|ies)\b/i)?.[0]);
    add('Weight', field(/^(?:item )?weight$/i) || source.match(/\b\d+(?:\.\d+)?\s*(?:grams|g)\b/i)?.[0]);
    add('Buttons', field(/^(?:buttons|number of buttons)$/i) || source.match(/\b\d+\s+(?:programmable\s+)?buttons\b/i)?.[0]);
    add('Receiver storage', field(/^receiver storage$/i) || source.match(/\bbuilt[- ]in\s+(?:nano\s+)?receiver storage\b/i)?.[0]);
    add('Colour', field(/^colou?r$/i));
    add('Warranty', field(/^warranty$/i));
    if (rows.length >= 2) return finish(/^(?:sensor|sensitivity|dpi|tracking speed|connection|connectivity(?: technology)?|(?:report|polling) rate|battery life|power|battery type|(?:item )?weight|buttons|number of buttons|receiver storage|colou?r|warranty)$/i);
  }
  // Category-independent path: source table attributes take priority over marketing prose.
  rows.length = 0;
  const seen = new Set<string>();
  const result: DescriptionPart[] = [];
  const labelled = [...facts.filter(p => p.label), ...featureParts.filter(p => !p.label).map((p, i) => ({label:`Feature ${i + 1}`, value:p.value}))];
  const prose = parts.filter(p => !p.label);
  for (const part of [...labelled, ...prose]) {
    if (part.label && excluded.test(part.label)) continue;
    const value = tidy(part.value);
    const key = `${part.label || ''}:${value}`.toLowerCase();
    if (seen.has(key) || !value) continue;
    seen.add(key);
    // Different attributes can legitimately share a value (e.g. movement and installation).
    if (part.label && result.some(existing => existing.label?.toLowerCase() === part.label!.toLowerCase())) continue;
    if (!part.label && result.some(existing => existing.value.toLowerCase() === value.toLowerCase())) continue;
    result.push({ ...(part.label ? { label: part.label } : {}), value: shorten(value, part.label ? 300 : 400) });
  }
  return serialize(result);
}

export function descriptionSummary(description: string): string {
  return descriptionParts(description).slice(0, 3).map(p => p.value).join(' · ');
}
