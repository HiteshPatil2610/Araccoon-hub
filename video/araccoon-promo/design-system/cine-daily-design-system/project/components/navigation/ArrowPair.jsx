import React from 'react';
const Arrow = ({ dir, color, onClick, offset }) => <button aria-label={dir} onClick={onClick} style={{ background: 'none', border: 0, padding: '4px 0', cursor: 'pointer', marginLeft: offset, display: 'block' }}>
  <svg width="58" height="8" viewBox="0 0 58 8" fill="none" style={{ display: 'block', transform: dir === 'prev' ? 'scaleX(-1)' : 'none' }}><path d="M0 4H56M56 4L52 1M56 4L52 7" stroke={color} strokeWidth="1.2" /></svg>
</button>;
export function ArrowPair({ onPrev, onNext, tone = 'light', style }) {
  const fg = tone === 'dark' ? '#fff' : '#0a0a0a';
  return <div style={{ display: 'inline-flex', flexDirection: 'column', ...style }}>
    <Arrow dir="next" color="var(--accent)" onClick={onNext} offset={32} />
    <Arrow dir="prev" color={fg} onClick={onPrev} offset={0} />
  </div>;
}
