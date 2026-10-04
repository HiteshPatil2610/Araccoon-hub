import React from 'react';
const SIZES = { mega: 'var(--type-mega)', xl: 120, l: 88, m: 48, s: 32, xs: 24, '2xs': 18 };
export function Headline({ size = 'l', tone = 'light', muted = false, as = 'h2', align, children, style }) {
  const T = as;
  const color = tone === 'dark' ? (muted ? 'var(--text-on-dark-muted)' : '#fff') : (muted ? 'var(--cd-ink-600)' : '#0a0a0a');
  return <T style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: SIZES[size] || size, lineHeight: 'var(--lh-display)', letterSpacing: 'var(--reveal-track, var(--ls-display))', transition: 'letter-spacing var(--reveal-dur, 0ms) var(--ease-cine) var(--reveal-delay, 0ms)', textTransform: 'uppercase', color, textAlign: align, textWrap: 'balance', ...style }}>{children}</T>;
}
