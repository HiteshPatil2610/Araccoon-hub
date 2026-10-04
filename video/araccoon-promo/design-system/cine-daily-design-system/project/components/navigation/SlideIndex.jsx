import React from 'react';
export function SlideIndex({ count = 4, active = 0, onChange, tone = 'light', spread = true, style }) {
  const fg = tone === 'dark' ? '#fff' : '#0a0a0a';
  return <div style={{ display: 'flex', justifyContent: spread ? 'space-between' : 'flex-start', gap: 40, ...style }}>
    {Array.from({ length: count }, (_, i) => <button key={i} onClick={() => onChange && onChange(i)} style={{ background: 'none', border: 0, padding: '0 0 6px', cursor: 'pointer', color: fg, opacity: i === active ? 1 : .75, fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1, position: 'relative' }}>
      {String(i + 1).padStart(2, '0')}
      <span style={{ position: 'absolute', left: 0, bottom: 0, height: 1.5, width: i === active ? 8 : 0, background: 'var(--accent)', transition: 'width var(--dur-base) var(--ease-cine)' }} />
    </button>)}
  </div>;
}
