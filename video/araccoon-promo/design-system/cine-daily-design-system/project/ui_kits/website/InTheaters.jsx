function InTheaters() {
  const { Headline, Reveal, TrackingReveal, ScrambleText } = DS;
  const c = CUE.theaters;
  return <section id="theaters" data-screen-label="04 In theaters" style={{ position: 'relative', height: 800, background: '#fff', overflow: 'hidden', borderTop: 'var(--hairline)' }}>
    <Viewfinder tone="light" circle={680} top="56%" />
    <div style={{ height: 'var(--nav-height)', borderBottom: 'var(--hairline)' }} />
    <div style={{ position: 'relative', textAlign: 'center', marginTop: 80 }}>
      <Reveal effect="fade" delay={c.label}><span style={{ fontSize: 10, letterSpacing: '.42em', textTransform: 'uppercase' }}>In theaters</span></Reveal>
      <TrackingReveal from="0.3em" delay={c.title} style={{ marginTop: 14, whiteSpace: 'nowrap' }}><Headline size={170} align="center" as="h2">{FILM.title} {FILM.numeral}</Headline></TrackingReveal>
      <div style={{ width: 600, margin: '20px auto 0', display: 'flex', justifyContent: 'space-between' }}>
        <Headline size={36} as="div"><ScrambleText text="MAY 3" delay={c.dates} /></Headline>
        <Headline size={36} as="div"><ScrambleText text={FILM.year} delay={c.dates + 100} charset="0123456789" /></Headline>
      </div>
    </div>
    <Reveal effect="rise" distance={140} delay={c.cutout} duration={1200} style={{ position: 'absolute', left: '50%', bottom: 0, width: 360, height: 300, marginLeft: -180 }}><image-slot id="theaters-cutout" shape="rect" fit="contain" placeholder="Key-art cut-out (transparent PNG)"></image-slot></Reveal>
  </section>;
}
window.InTheaters = InTheaters;
