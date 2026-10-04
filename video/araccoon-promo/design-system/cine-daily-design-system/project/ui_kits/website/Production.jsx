function Production() {
  const { SectionLabel, IndexBadge, Rating, StatDisc, PullQuote, IconButton, Reveal } = DS;
  const c = CUE.production;
  return <section id="production" data-screen-label="02 Production" style={{ position: 'relative', zIndex: 2, height: 660, background: 'var(--cd-black)', color: '#fff', overflow: 'hidden', borderRadius: '0 0 var(--radius-frame) var(--radius-frame)', boxShadow: '0 3px 0 var(--cd-pink-500)' }}>
    <Viewfinder circle={620} top="58%" />
    <Reveal effect="slide-left" distance={50} delay={c.studio} style={{ position: 'absolute', left: 'var(--page-gutter)', top: 90, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SectionLabel tone="dark" trail={false}>Production</SectionLabel>
      <span style={{ display: 'flex', fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 1 }}><span style={{ background: 'var(--accent)', padding: '2px 6px 0' }}>MARVEL</span><span style={{ padding: '2px 6px 0', border: '1px solid rgba(255,255,255,.6)' }}>STUDIOS</span></span>
      <div style={{ marginTop: 60, display: 'flex', flexDirection: 'column', gap: 16 }}><IndexBadge n={2} /><Rating value={4} /></div>
    </Reveal>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 110, display: 'flex', justifyContent: 'center', gap: 14 }}>
      <Reveal effect="pop" delay={c.discs}><StatDisc label="Trailer" value={'1:47"'} /></Reveal>
      <Reveal effect="pop" delay={c.discs + 120}><StatDisc tone="accent" label="IMAX" value="6" /></Reveal>
      <Reveal effect="pop" delay={c.discs + 240}><StatDisc tone="dark" label="May" value="3" /></Reveal>
    </div>
    <Reveal effect="rise" distance={140} rotate={10} restRotate={-4} delay={c.still} duration={1200} style={{ position: 'absolute', left: '50%', top: 260, width: 240, height: 300, marginLeft: -120 }}>
      <image-slot id="prod-still" shape="rounded" radius="6" placeholder="Costume / prop still"></image-slot>
    </Reveal>
    <div style={{ position: 'absolute', right: 'var(--page-gutter)', top: 120, width: 210, display: 'flex', flexDirection: 'column', gap: 70 }}>
      <Reveal effect="mask" delay={c.quote} duration={1000}><PullQuote highlight="'Logan'.">Hugh Jackman said he really was done playing the character of Logan/Wolverine after 2017's</PullQuote></Reveal>
      <Reveal effect="fade" delay={c.social} style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}><IconButton variant="muted" icon="instagram" size={22} /><IconButton variant="muted" icon="facebook" size={22} /><IconButton variant="muted" icon="youtube" size={22} /></Reveal>
    </div>
  </section>;
}
window.Production = Production;
