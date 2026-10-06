import { createElement } from 'react';
import { descriptionParts } from '../../shared/productCopy';

/** Text-only rendering; React escapes every value and listing HTML is never executed. */
export function ProductDescription({ text, className = '' }: { text: string; className?: string }) {
  const parts = descriptionParts(text);
  const paragraphs = parts.filter(p => !p.label).map((part, i) => createElement('p', { key: `copy-${i}` }, part.value));
  const specs = parts.filter(p => p.label).map((part, i) => createElement('div', {
    key: `spec-${i}`, className: 'grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] gap-3 border-b border-line pb-2 last:border-b-0',
  },
  createElement('dt', null, createElement('strong', { className: 'font-bold' }, part.label)),
  createElement('dd', { className: 'min-w-0 text-muted-fg' }, part.value)));
  return createElement('div', { className: `min-w-0 space-y-3 text-sm leading-relaxed [overflow-wrap:anywhere] ${className}` },
    specs.length ? createElement('dl', { className: 'space-y-2' }, ...specs) : null, ...paragraphs);
}
