import React from 'react';
import { useReveal } from './Reveal.jsx';
export function TrackingReveal({ from = '0.45em', to = 'var(--ls-display)', fromOpacity = 0.3, delay = 0, duration = 1300, once = false, threshold = 0.2, replayKey, as = 'div', style, children }) {
  const ref = React.useRef(null);
  const shown = useReveal(ref, { once, threshold, replayKey });
  const T = as;
  const tr = shown ? duration + 'ms' : '0ms';
  return <T ref={ref} style={{
    ...style,
    '--reveal-track': shown ? to : from, '--reveal-dur': tr, '--reveal-delay': delay + 'ms',
    letterSpacing: shown ? to : from,
    opacity: shown ? 1 : fromOpacity,
    transition: shown ? 'letter-spacing ' + tr + ' var(--ease-cine) ' + delay + 'ms, opacity ' + tr + ' var(--ease-cine) ' + delay + 'ms' : 'none',
  }}>{children}</T>;
}
