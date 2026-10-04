import React from 'react';
import { Icon } from './Icon.jsx';
export function IconButton({ icon = 'search', variant = 'outline', tone = 'dark', size, label, onClick, style }) {
  const [h, setH] = React.useState(false);
  const dark = tone === 'dark';
  const d = size || (variant === 'menu' ? 48 : 38);
  let s = { width: d, height: d, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1.3px solid transparent', padding: 0, transition: 'background var(--dur-base), color var(--dur-base), border-color var(--dur-base), transform var(--dur-fast)' };
  if (variant === 'outline') s = { ...s, background: h ? (dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.06)') : 'transparent', borderColor: dark ? 'var(--outline-on-dark)' : 'var(--outline-on-light)', color: dark ? '#fff' : '#0a0a0a' };
  if (variant === 'menu') s = { ...s, background: dark ? '#fff' : '#0a0a0a', color: dark ? '#0a0a0a' : '#fff', transform: h ? 'scale(1.06)' : 'none' };
  if (variant === 'accent') s = { ...s, background: h ? 'var(--accent-hover)' : 'var(--accent)', color: '#fff' };
  if (variant === 'muted') s = { ...s, background: dark ? 'var(--cd-ink-600)' : 'var(--cd-gray-200)', color: dark ? '#fff' : '#0a0a0a' };
  const inner = variant === 'menu'
    ? <span style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}><span style={{ width: 20, height: 1.6, background: 'currentColor', borderRadius: 2 }} /><span style={{ width: 13, height: 1.6, background: 'currentColor', borderRadius: 2 }} /></span>
    : <Icon name={icon} size={Math.round(d * .45)} />;
  return <button aria-label={label || icon} onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ ...s, ...style }}>{inner}</button>;
}
