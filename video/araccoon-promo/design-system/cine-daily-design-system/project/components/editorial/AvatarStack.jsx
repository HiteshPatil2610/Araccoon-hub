import React from 'react';
export function AvatarStack({ items = [], size = 26, gap = 6, style }) {
  return <div style={{ display: 'flex', gap, ...style }}>
    {items.map((it, i) => <span key={i} title={it.name} style={{ width: size, height: size, borderRadius: '50%', flex: 'none', background: it.src ? `center/cover url(${it.src})` : (it.color || 'var(--cd-ink-500)'), filter: it.src && it.mono !== false ? 'grayscale(1)' : 'none' }} />)}
  </div>;
}
