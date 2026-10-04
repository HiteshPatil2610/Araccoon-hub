import React from 'react';
export function MediaFrame({ src, shape = 'rect', width = 180, height = 220, cut = 26, label = 'Still', radius = 4, tint = false, style }) {
  const clip = shape === 'chamfer' ? `polygon(${cut}px 0,100% 0,100% calc(100% - ${cut}px),calc(100% - ${cut}px) 100%,0 100%,0 ${cut}px)` : shape === 'circle' ? 'circle(50%)' : 'none';
  return <div style={{ width, height, flex: 'none', clipPath: clip, borderRadius: shape === 'rect' ? radius : 0, overflow: 'hidden', position: 'relative', background: src ? `center/cover url(${src})` : 'linear-gradient(160deg,#3a0d12,#0a0a0a)', ...style }}>
    {tint && <div style={{ position: 'absolute', inset: 0, background: 'var(--accent)', mixBlendMode: 'multiply', opacity: .45 }} />}
    {!src && <span style={{ position: 'absolute', left: 10, bottom: 8, fontFamily: 'var(--font-sans)', fontSize: 9, letterSpacing: '.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)' }}>{label}</span>}
  </div>;
}
