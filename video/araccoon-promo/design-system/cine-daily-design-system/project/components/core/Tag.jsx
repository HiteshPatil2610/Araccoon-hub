import React from 'react';
export function Tag({ children, tone = 'dark', active = false, onClick, style }) {
  const dark = tone === 'dark';
  const fg = dark ? '#fff' : '#0a0a0a';
  return <span onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)', fontSize: 13, lineHeight: 1, letterSpacing: '.02em', textTransform: 'uppercase', padding: '5px 11px 4px', borderRadius: 'var(--radius-pill)', border: `1px solid ${dark ? 'rgba(255,255,255,.7)' : '#0a0a0a'}`, background: active ? fg : 'transparent', color: active ? (dark ? '#0a0a0a' : '#fff') : fg, cursor: onClick ? 'pointer' : 'default', transition: 'background var(--dur-fast)', ...style }}>{children}</span>;
}
