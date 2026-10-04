import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function SectionLabel({ children, tone = 'light', marker = true, trail = true, style }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-sans)', fontSize: 'var(--type-label)', fontWeight: 500, letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: tone === 'dark' ? '#fff' : '#0a0a0a', ...style }}>
    {marker && <span style={{ width: 15, height: 15, borderRadius: '50%', background: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flex: 'none' }}><Icon name="play" size={8} /></span>}
    <span>{children}{trail && ' .'}</span>
  </span>;
}
