const SLIDES = [
  ['Deadpool III: Release date, cast, and', 'everything about the film!'],
  ['Who returns for the', 'third installment?'],
  ['Inside the multiverse', 'with Wolverine'],
  ['Premiere night at', 'El Capitan Theatre'],
];
function Story({ onBooked, booked }) {
  const { Headline, SectionLabel, SlideIndex, AvatarStack, ArrowPair, StickerBadge, BookingCard, MediaFrame, Reveal, TrackingReveal } = DS;
  const [s, setS] = React.useState(0);
  const c = CUE.story;
  return <section id="story" data-screen-label="03 Story" style={{ position: 'relative', zIndex: 1, height: 1080, marginTop: 'calc(-1 * var(--curtain-overlap))', paddingTop: 'var(--curtain-overlap)', background: '#fff', overflow: 'hidden' }}>
    <Viewfinder tone="light" circle={680} top="62%" />
    <div style={{ position: 'relative', padding: '40px var(--page-gutter) 0', display: 'grid', gridTemplateColumns: 'auto auto 1fr', alignItems: 'end', gap: 28 }}>
      <div><TrackingReveal from="0.3em" delay={c.directed}><Headline size={128} as="h2">Directed</Headline></TrackingReveal><Reveal effect="fade" delay={c.release}><span style={{ display: 'block', marginTop: 18, fontSize: 9, letterSpacing: '.42em', textTransform: 'uppercase' }}>Gallery 07/32</span></Reveal></div>
      <Reveal effect="pop" delay={c.by} style={{ marginBottom: 80 }}><Headline size={40} as="div">by</Headline></Reveal>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
        <Reveal effect="rise" distance={24} delay={c.release} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginLeft: 180 }}><SectionLabel>Release date</SectionLabel><Blurb part="B" width={420}>{FILM.title} 3 is scheduled to be released in the United States on May 3, 2024. It was previously scheduled for September 6 of that year, and then November 8.</Blurb></Reveal>
        <TrackingReveal from="0.3em" delay={c.director} style={{ textAlign: 'right', whiteSpace: 'nowrap' }}><Headline size={128} as="div" align="right">{FILM.director}</Headline></TrackingReveal>
      </div>
    </div>
    <Reveal effect="wipe-x" duration={1200} delay={c.pager} style={{ borderTop: 'var(--hairline)', margin: '28px 0 0' }} />
    <Reveal effect="fade" delay={c.pager} style={{ position: 'relative', padding: '18px var(--page-gutter)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <SlideIndex count={2} active={s < 2 ? s : -1} onChange={setS} style={{ width: 210 }} spread />
      <SlideIndex count={2} active={s >= 2 ? s - 2 : -1} onChange={i => setS(i + 2)} style={{ width: 210, marginLeft: 'auto' }} spread />
    </Reveal>
    <div style={{ position: 'relative', textAlign: 'center', marginTop: 10 }}>
      <Reveal effect="blur" replayKey={s} duration={800} delay={c.headline}>
        <Headline size={48} align="center">{SLIDES[s][0]}</Headline>
        <Headline size={48} align="center" muted>{SLIDES[s][1]}</Headline>
      </Reveal>
      <Reveal effect="fade" delay={c.side}><ArrowPair style={{ marginTop: 22 }} onNext={() => setS((s + 1) % 4)} onPrev={() => setS((s + 3) % 4)} /></Reveal>
    </div>
    <div style={{ position: 'absolute', left: 90, top: 520, display: 'flex', gap: 6 }}>
      {[{ color: '#3a3a3a' }, { color: '#6a6a6a' }, { color: 'var(--accent)' }, { color: '#8c7a70' }].map((it, i) => <Reveal key={i} effect="pop" delay={c.side + i * 90}><AvatarStack items={[it]} /></Reveal>)}
    </div>
    <Reveal effect="spin" delay={c.side} duration={1000} style={{ position: 'absolute', right: 70, top: 490 }}><StickerBadge index={3} text="MERC" /></Reveal>
    <Reveal effect="slide-left" distance={40} delay={c.side} style={{ position: 'absolute', left: 90, top: 640, display: 'flex', flexDirection: 'column', gap: 12 }}><SectionLabel>X-Men</SectionLabel><Blurb part="C">{FILM.title}, AKA Wade Wilson, AKA the Merc with a Mouth, first made his debut in the much-maligned X-Men Origins: Wolverine.</Blurb></Reveal>
    <Reveal effect="slide-right" distance={40} delay={c.side} style={{ position: 'absolute', right: 90, top: 640, display: 'flex', flexDirection: 'column', gap: 12 }}><SectionLabel>Premiering</SectionLabel><Blurb part="D">The film was initially announced for September 6, 2024, but it later changed, being pushed back to November 8, 2024…</Blurb></Reveal>
    <div style={{ position: 'absolute', left: 150, top: 830 }}>
      <Reveal effect="slide-left" distance={80} delay={c.stills} style={{ position: 'absolute', left: 70, top: 0 }}><MediaFrame shape="chamfer" width={114} height={160} label="Still 01" /></Reveal>
      <Reveal effect="slide-left" distance={80} delay={c.stills + 120} style={{ position: 'absolute', left: 0, top: 120 }}><MediaFrame shape="chamfer" width={114} height={140} label="Still 02" /></Reveal>
    </div>
    <div style={{ position: 'absolute', right: 330, top: 830 }}>
      <Reveal effect="slide-right" distance={80} delay={c.stills} style={{ position: 'absolute', left: 0, top: 0 }}><MediaFrame shape="chamfer" width={114} height={160} label="Still 03" /></Reveal>
      <Reveal effect="slide-right" distance={80} delay={c.stills + 120} style={{ position: 'absolute', left: 70, top: 120 }}><MediaFrame shape="chamfer" width={114} height={140} label="Still 04" /></Reveal>
    </div>
    <Reveal effect="rise" distance={100} delay={c.card} duration={1100} style={{ position: 'absolute', left: '50%', top: 740, marginLeft: -120, zIndex: 3 }}>
      <BookingCard title={FILM.title + ' ' + FILM.numeral} date="May 29" time="9:30" onBook={onBooked} />
    </Reveal>
    {booked && <Reveal effect="pop" style={{ position: 'absolute', left: '50%', top: 690, marginLeft: -92, zIndex: 4, fontFamily: 'var(--font-display)', fontSize: 20, background: '#0a0a0a', color: '#fff', padding: '8px 16px 6px', borderRadius: 999, whiteSpace: 'nowrap' }}>Seat booked · Row F</Reveal>}
    <Reveal effect="rise" distance={80} delay={c.cutout} style={{ position: 'absolute', left: '50%', bottom: 0, width: 220, height: 160, marginLeft: 140, zIndex: 1 }}><image-slot id="story-cutout" shape="rect" fit="contain" placeholder="Cut-out"></image-slot></Reveal>
  </section>;
}
window.Story = Story;
