Signature title entrance: letters start widely tracked and faded, then collapse to tight Bebas spacing — wrap any Headline (or plain text).
```jsx
<TrackingReveal from="0.35em" delay={100}><Headline size="mega" tone="dark" as="h1">Deadpool</Headline></TrackingReveal>
```
Works through Headline's `--reveal-track` hook; don't pass a letterSpacing override to the wrapped Headline.
