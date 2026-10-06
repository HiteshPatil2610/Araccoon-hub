import type { DescriptionPart } from './productCopy';

const number = '[±+−-]?\\d+(?:\\.\\d+)?';
const span = (unit: string) => `${number}(?:\\s*(?:${unit}))?(?:\\s*(?:to|[-–])\\s*${number})?\\s*(?:${unit})`;
const promotional = /\b(?:ultimate|unmatched|effortless|marvel|ergonomic comfort|strength and security|fluid motion|space[- ]saving|versatility|flexibility)\b/i;
const tidy = (text: string) => text.replace(/\s+/g, ' ').trim();
const measurements = (text: string, unit: RegExp, suffix: string) => {
  const raw = tidy(text.replace(unit, ''));
  const range = new RegExp(`^(${number})\\s*(?:to|[-–])\\s*(${number})$`).exec(raw);
  return `${range ? `${range[1]}–${range[2]}` : raw} ${suffix}`;
};

/** Extract specific source facts, never the benefit claim or its advertising heading. */
export function featureFacts(value: string): DescriptionPart[] {
  const rows: DescriptionPart[] = [];
  const add = (label: string, text: string | undefined) => {
    if (text && !rows.some(row => row.label === label)) rows.push({label, value:tidy(text)});
  };
  // A negative sentence must not turn into a positive feature claim.
  const sentences = value.match(/.*?[.!?](?=\s|$)|.+$/g) || [value];
  for (const sentence of sentences) {
    if (/\b(?:no|not|without|cannot|can't|doesn't|isn't)\b/i.test(sentence)) continue;
    const screen = new RegExp(`\\b(?:screens?|monitors?|displays?)\\b[^.;]{0,45}?(${span('inches?|["”]')})`, 'i').exec(sentence);
    add('Screen compatibility', screen ? measurements(screen[1]!, /inches?|["”]/gi, 'inches') : undefined);
    const load = new RegExp(`\\b(?:weighing|supports? (?:a )?(?:weight|load)(?: of)?|load capacity(?: of| is)?|weight capacity(?: of| is)?)\\s*(${span('kg|kilograms?')})`, 'i').exec(sentence);
    const supportedLoad = /\b(?:screens?|monitors?|displays?|supports?|load|capacity)\b/i.test(sentence);
    add(supportedLoad ? 'Supported weight' : 'Weight', load ? measurements(load[1]!, /kg|kilograms?/gi, 'kg') : undefined);
    const vesa = /\bVESA\s+(\d{2,3}\s*[x×]\s*\d{2,3}\s*mm(?:\s*(?:or|and|,|\/)\s*\d{2,3}\s*[x×]\s*\d{2,3}\s*mm)*)/i.exec(sentence);
    add('VESA mounting', vesa?.[1]?.replace(/\s*(?:or|and|,|\/)\s*/gi, ' · ').replace(/\s*[x×]\s*/g, ' × ').replace(/(\d)\s*mm/gi, '$1 mm'));
    for (const [word, label] of [['tilt', 'Tilt'], ['swivel', 'Swivel'], ['rotat(?:e|ion)', 'Rotation']] as const) {
      const angle = new RegExp(`\\b${word}\\b[^\\d.;±+−-]{0,30}(${span('°|degrees?')})`, 'i').exec(sentence)
        || new RegExp(`(${span('°|degrees?')})\\s+${word}\\b`, 'i').exec(sentence);
      add(label, angle ? measurements(angle[1]!, /°|degrees?/gi, '°').replace(' °', '°') : undefined);
    }
    for (const [word, label] of [['(?:C[- ](?:type )?)?clamp', 'Clamp desk thickness'], ['grom(?:met|ment)(?: hole)?', 'Grommet desk thickness']] as const) {
      const thickness = new RegExp(`\\b${word}\\b[^.;]{0,35}?(${span('cm')})`, 'i').exec(sentence);
      add(label, thickness ? measurements(thickness[1]!, /cm/gi, 'cm') : undefined);
    }
    if (/\bgas spring\b/i.test(sentence)) add('Mechanism', 'Gas spring');
    if (/\bremovable cable (?:clamps|clips)\b/i.test(sentence)) add('Cable management', sentence.match(/\bremovable cable (?:clamps|clips)\b/i)?.[0]);
    else if (/\b(?:concealed|integrated|built[- ]in) cable management\b/i.test(sentence)) add('Cable management', sentence.match(/\b(?:concealed|integrated|built[- ]in) cable management\b/i)?.[0]);
    const material = /\b(?:made (?:from|of)|crafted from)\s+(?:durable |premium |high[- ]quality )?([\w -]{2,35}?)(?=[,.;]|\s+(?:for|with|to|that|this)\b|$)/i.exec(sentence);
    add('Material', material?.[1]);
    const capacity = /\b(?:capacity(?: of| is)?|holds?|contains?)\s+(\d+(?:\.\d+)?\s*(?:ml|litres?|liters?|L))\b/i.exec(sentence);
    add('Capacity', capacity?.[1]);
    const power = /\b(?:power(?: output)?|output|rated power)(?:\s+(?:of|is))?\s*[:=-]?\s*(\d+(?:\.\d+)?\s*[kM]?W)\b/i.exec(sentence);
    add('Power', power?.[1]);
    const battery = /\b(?:battery(?: capacity)?)(?:\s+(?:of|is))?\s*[:=-]?\s*(\d[\d,]*\s*mAh)\b/i.exec(sentence);
    add('Battery capacity', battery?.[1]);
    const protection = /\bIP\d{2}\b/i.exec(sentence);
    add('Protection rating', protection?.[0]);
    if (/\b(?:folds? flat|foldable|folding design)\b/i.test(sentence)) add('Storage', 'Foldable');
    if (/\badjustable (?:viewing )?angle\b/i.test(sentence)) add('Adjustment', 'Adjustable viewing angle');
  }
  return rows;
}

/** Keep short source attributes; replace prose with atomic facts, dropping hype. */
export function compactParts(parts: DescriptionPart[], feature = false): DescriptionPart[] {
  return parts.flatMap(part => {
    const value = tidy(part.value);
    const hype = promotional.test(part.label || '') || /\b(?:incredible|ultimate|unmatched|bid farewell|say goodbye|bodyguard|master of|reclaim|effortless)\b/i.test(value);
    if (part.label && !hype && value.length <= 120 && !feature) return [{...part, value}];
    const extracted = featureFacts(value);
    if (extracted.length) return extracted;
    if (hype) return [];
    // Unfamiliar short specifications and practical instructions remain verbatim.
    if (value.length <= 120) return [{...part, value}];
    const first = value.match(/^.*?[.!?](?=\s|$)/)?.[0];
    return first && first.length <= 120 ? [{...part, value:first}] : [];
  });
}
