Decode-style text entrance — random glyphs resolve left→right into the final string; used for dates and numbers ("MAY 3", "2024").
```jsx
<Headline size={36} as="div"><ScrambleText text="MAY 3" delay={400} /></Headline>
```
Keep it to short strings (≤12 chars); spaces are preserved.
