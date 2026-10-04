Scroll-triggered entrance wrapper (IntersectionObserver) — rise, pop, blur, mask-wipe etc. with the brand's cinematic easing; replays on re-entry.
```jsx
<Reveal effect="pop" delay={120}><StatDisc tone="accent" label="IMAX" value="6" /></Reveal>
<Reveal effect="blur" replayKey={slide}><Headline size="m">{title}</Headline></Reveal>
```
- `pop`/`spin` use `--ease-pop` (slight overshoot); everything else `--ease-cine`.
- Positioning styles go on `style`; Reveal owns `transform`/`opacity` — use `restRotate` for tilted items.
- Honors prefers-reduced-motion (renders final state).
