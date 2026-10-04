import React from 'react';
export function Rating({ value = 4, max = 5, size = 13, tone = 'dark', style }) {
  return <span aria-label={`${value} of ${max}`} style={{ display: 'inline-flex', gap: 2, fontSize: size, lineHeight: 1, ...style }}>
    {Array.from({ length: max }, (_, i) => <span key={i} style={{ color: i < value ? 'var(--rating-on)' : (tone === 'dark' ? '#fff' : 'var(--cd-gray-300)') }}>★</span>)}
  </span>;
}
