import React from 'react';
import { Wordmark } from '../editorial/Wordmark.jsx';
import { IconButton } from '../core/IconButton.jsx';
export function NavBar({ tone = 'dark', items = ['Top casts', 'Production', 'Box office', 'IMAX 6'], active = 0, onNavigate, onMenu, logoSrc, style }) {
  const dark = tone === 'dark';
  const fg = dark ? '#fff' : '#0a0a0a';
  return <nav style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', height: 'var(--nav-height)', padding: '0 var(--page-gutter)', color: fg, transition: 'color var(--dur-base) var(--ease-cine)', ...style }}>
    {logoSrc ? <img src={logoSrc} alt="Cine Daily" style={{ height: 34 }} /> : <Wordmark tone={tone} size={32} />}
    <ul style={{ display: 'flex', gap: 22, listStyle: 'none', margin: 0, padding: 0, alignItems: 'center' }}>
      {items.map((it, i) => <React.Fragment key={it}>
        {i > 0 && <li aria-hidden="true" style={{ width: 3, height: 3, borderRadius: '50%', background: fg, opacity: .8, transition: 'background var(--dur-base)' }} />}
        <li onClick={() => onNavigate && onNavigate(i)} style={{ position: 'relative', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500, letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', whiteSpace: 'nowrap', cursor: 'pointer', opacity: i === active ? 1 : .82, transition: 'opacity var(--dur-base)' }}>
          {it}<span style={{ position: 'absolute', left: '50%', top: 22, width: 7, height: 7, background: 'var(--accent)', transform: 'translateX(-50%) rotate(45deg) scale(' + (i === active ? 1 : 0) + ')', borderRadius: 1, transition: 'transform var(--dur-base) var(--ease-pop)' }} />
        </li>
      </React.Fragment>)}
    </ul>
    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
      <IconButton icon="search" tone={tone} />
      <IconButton icon="user" tone={tone} />
      <IconButton variant="menu" tone={tone} onClick={onMenu} style={{ marginLeft: 10 }} />
    </div>
  </nav>;
}
