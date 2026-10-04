import React from 'react';
export function StickerBadge({ text = 'NEW', src, size = 84, index, spin = true, style }) {
  return <div style={{ display: 'inline-flex', alignItems: 'center', ...style }}>
    {index != null && <span style={{ width: size * .42, height: size * .42, borderRadius: '50%', border: '1.3px solid #0a0a0a', background: '#fff', color: '#0a0a0a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: size * .18, marginRight: -size * .12, zIndex: 1 }}>{String(index).padStart(2, '0')}</span>}
    <div style={{ width: size, height: size, borderRadius: '50%', background: src ? `center/cover url(${src})` : 'radial-gradient(circle at 35% 30%,var(--cd-red-400),var(--cd-red-700))', border: '3px solid var(--cd-ink-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontSize: size * .26, transform: 'rotate(-12deg)', animation: spin ? 'none' : 'none' }}>{!src && text}</div>
  </div>;
}
