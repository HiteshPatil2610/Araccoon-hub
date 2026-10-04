import React from 'react';
export function StatDisc({ label, value, tone = 'light', size = 110, style }) {
  const bg = { light: '#fff', accent: 'var(--accent)', dark: 'var(--cd-ink-800)', outline: 'transparent' }[tone];
  const fg = tone === 'light' ? '#0a0a0a' : '#fff';
  return <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: fg, border: tone === 'outline' ? '1.3px solid rgba(255,255,255,.6)' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', textTransform: 'uppercase', flex: 'none', ...style }}>
    <span style={{ fontSize: size * .15, lineHeight: 1, transform: 'rotate(-8deg)' }}>{label}</span>
    <span style={{ fontSize: size * .36, lineHeight: 1 }}>{value}</span>
  </div>;
}
