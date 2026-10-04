import React from 'react';
export function Wordmark({ tone = 'dark', size = 30, style }) {
  return <span style={{ fontFamily: 'var(--font-display)', fontSize: size, lineHeight: 1, letterSpacing: '-.01em', color: tone === 'dark' ? '#fff' : '#0a0a0a', whiteSpace: 'nowrap', transition: 'color var(--dur-base) var(--ease-cine)', ...style }}>CINE DAILY</span>;
}
