import React from 'react';
export function FilmStrip({ tilt = -1.6, holes = 48, height = 46, tone = 'red', style }) {
  const red = tone === 'red';
  return <div style={{ position: 'relative', height: height + 30, overflow: 'hidden', pointerEvents: 'none', ...style }}>
    <div style={{ position: 'absolute', left: '-5%', right: '-5%', top: 15, height, backgroundColor: red ? 'var(--cd-red-500)' : '#151515', backgroundImage: 'linear-gradient(180deg,rgba(0,0,0,.14),rgba(0,0,0,0) 60%)', transform: `rotate(${tilt}deg)`, transition: 'background-color var(--dur-slow) var(--ease-cine), transform var(--dur-slow) var(--ease-cine)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
      {Array.from({ length: holes }, (_, i) => <span key={i} style={{ width: 13, height: 8, borderRadius: '4px 4px 6px 6px', background: red ? '#0a0a0a' : '#e8e8e8', flex: 'none', transition: 'background var(--dur-slow)' }} />)}
    </div>
  </div>;
}
