import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function PullQuote({ children, tone = 'dark', highlight, link = true, style }) {
  const dark = tone === 'dark';
  return <figure style={{ margin: 0, display: 'grid', gridTemplateColumns: '14px 2px 1fr', gap: 10, color: dark ? '#fff' : '#0a0a0a', ...style }}>
    <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, lineHeight: 1 }}>“</span>
    <span style={{ background: 'var(--accent)', height: '45%' }} />
    <blockquote style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1.25, textTransform: 'uppercase' }}>
      {children}{highlight && <span style={{ background: 'rgba(255,255,255,.18)', padding: '0 4px', marginLeft: 4 }}>{highlight}</span>}
      {link && <span style={{ display: 'block', textAlign: 'right', color: 'var(--accent)', marginTop: 4 }}><Icon name="arrow-up-right" size={14} /></span>}
    </blockquote>
  </figure>;
}
