import React from 'react';
import { Icon } from './Icon.jsx';
export function Button({ variant = 'outline', tone = 'dark', size = 'md', icon = 'arrow-up-right', children, onClick, disabled, style }) {
  const [h, setH] = React.useState(false);
  const [p, setP] = React.useState(false);
  const dark = tone === 'dark';
  const fs = size === 'sm' ? 16 : size === 'lg' ? 26 : 21;
  const pad = size === 'sm' ? '6px 14px 5px' : size === 'lg' ? '12px 26px 10px' : '9px 20px 7px';
  let s = { display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontSize: fs, lineHeight: 1, letterSpacing: '.01em', textTransform: 'uppercase', borderRadius: 'var(--radius-pill)', padding: pad, cursor: disabled ? 'default' : 'pointer', border: '1.5px solid transparent', transition: 'background var(--dur-fast), color var(--dur-fast), transform var(--dur-fast)', transform: p && !disabled ? 'scale(.97)' : 'none', opacity: disabled ? .4 : 1 };
  if (variant === 'outline') s = { ...s, background: h ? (dark ? '#fff' : '#0a0a0a') : 'transparent', color: h ? (dark ? '#0a0a0a' : '#fff') : (dark ? '#fff' : '#0a0a0a'), borderColor: dark ? 'var(--outline-on-dark)' : 'var(--outline-on-light)' };
  if (variant === 'solid') s = { ...s, background: p ? 'var(--accent-press)' : h ? 'var(--accent-hover)' : 'var(--accent)', color: 'var(--on-accent)' };
  if (variant === 'ghost') s = { ...s, background: 'transparent', color: dark ? '#fff' : '#0a0a0a', textDecoration: h ? 'underline' : 'none', textUnderlineOffset: 4 };
  if (variant === 'bar') s = { ...s, width: '100%', justifyContent: 'space-between', borderRadius: 'var(--radius-s)', fontFamily: 'var(--font-sans)', fontSize: 12, textTransform: 'none', letterSpacing: 0, padding: '12px 16px', background: p ? 'var(--accent-press)' : h ? 'var(--accent-hover)' : 'var(--accent)', color: '#fff' };
  return <button disabled={disabled} onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => { setH(false); setP(false); }} onMouseDown={() => setP(true)} onMouseUp={() => setP(false)} style={{ ...s, ...style }}>
    <span style={{ whiteSpace: 'nowrap' }}>{children}</span>{icon && <Icon name={icon} size={variant === 'bar' ? 14 : fs * .7} />}
  </button>;
}
