import React from 'react';
export function IndexBadge({ n = 1, tone = 'dark', size = 38, style }) {
  const dark = tone === 'dark';
  return <span style={{ width: size, height: size, borderRadius: '50%', border: `1.3px solid ${dark ? '#fff' : '#0a0a0a'}`, background: dark ? 'transparent' : '#fff', color: dark ? '#fff' : '#0a0a0a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: size * .42, lineHeight: 1, flex: 'none', ...style }}>{String(n).padStart(2, '0')}</span>;
}
