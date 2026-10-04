import React from 'react';
import { useReveal } from './Reveal.jsx';
const scramble = (text, p, set) => text.split('').map((c, i) => (c === ' ' || i < Math.floor(p * text.length)) ? c : set[Math.floor(Math.random() * set.length)]).join('');
export function ScrambleText({ text = '', duration = 900, delay = 0, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', once = false, threshold = 0.2, replayKey, as = 'span', style }) {
  const ref = React.useRef(null);
  const shown = useReveal(ref, { once, threshold, replayKey });
  const [out, setOut] = React.useState(text);
  React.useEffect(() => {
    if (!shown) { setOut(scramble(text, 0, charset)); return; }
    let raf, last = 0; const t0 = performance.now() + delay;
    const tick = now => {
      const p = Math.max(0, Math.min(1, (now - t0) / duration));
      if (now - last > 45 || p === 1) { setOut(p === 1 ? text : scramble(text, p, charset)); last = now; }
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, text]);
  const T = as;
  return <T ref={ref} aria-label={text} style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{out}</T>;
}
