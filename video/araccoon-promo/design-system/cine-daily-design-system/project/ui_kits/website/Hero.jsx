function Hero({ onBook, stripRed }) {
  const { Tag, Headline, Button, SectionLabel, FilmStrip, StickerBadge, Reveal, TrackingReveal } = DS;
  const [genre, setGenre] = React.useState(0);
  const c = CUE.hero;
  return <section id="hero" data-screen-label="01 Hero" style={{ position: 'relative', height: 800, background: 'var(--cd-black)', color: '#fff', overflow: 'hidden' }}>
    <Viewfinder circle={700} top="56%" />
    <div style={{ height: 'var(--nav-height)' }} />
    <Reveal effect="fade" delay={c.meta} style={{ position: 'relative', zIndex: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 var(--page-gutter)' }}>
      <div style={{ display: 'flex', gap: 6 }}>{FILM.genres.map((g, i) => <Tag key={g} active={i === genre} onClick={() => setGenre(i)}>{g}</Tag>)}</div>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 14 }}>RELEASE [{FILM.release.toUpperCase()}]</span>
    </Reveal>
    <Reveal effect="pop" delay={c.disc} duration={1000} style={{ position: 'absolute', left: '50%', top: 196, width: 440, height: 440, marginLeft: -220, borderRadius: '50%', background: 'var(--accent)' }} />
    <Reveal effect="drop" distance={40} delay={c.numeral} style={{ position: 'absolute', left: 0, right: 0, top: 160, display: 'flex', justifyContent: 'center', zIndex: 2 }}><Headline size={96} tone="dark" as="div">{FILM.numeral}</Headline></Reveal>
    <div style={{ position: 'absolute', left: 'var(--page-gutter)', right: 'var(--page-gutter)', top: 214, display: 'grid', gridTemplateColumns: '1fr 1fr 360px 1fr 1fr', zIndex: 2 }}>
      {FILM.cast.slice(0, 2).map((n, i) => <TrackingReveal key={n} from="0.5em" delay={c.cast + i * 80}><Headline size={34} tone="dark" as="div">{n}</Headline></TrackingReveal>)}<span />
      {FILM.cast.slice(2).map((n, i) => <TrackingReveal key={n} from="0.5em" delay={c.cast + (i + 2) * 80}><Headline size={34} tone="dark" as="div" align={i ? 'right' : 'left'}>{n}</Headline></TrackingReveal>)}
    </div>
    <TrackingReveal from="0.32em" fromOpacity={0.25} delay={c.title} duration={1500} style={{ position: 'absolute', left: 40, right: 70, top: 266, zIndex: 2, display: 'flex', justifyContent: 'center', whiteSpace: 'nowrap' }}>
      <Headline size={330} tone="dark" as="h1" align="center" style={{ lineHeight: .8 }}>{FILM.title}</Headline>
    </TrackingReveal>
    <Reveal effect="fade" delay={c.year} style={{ position: 'absolute', right: 30, top: 440, zIndex: 2 }}><span style={{ display: 'block', transform: 'rotate(90deg)', fontFamily: 'var(--font-display)', fontSize: 28 }}>[{FILM.year}]</span></Reveal>
    <Reveal effect="wipe-x" delay={c.strip} duration={1100} style={{ position: 'absolute', left: 0, right: 0, top: 590, zIndex: 2 }}>
      <FilmStrip tone={stripRed ? 'red' : 'dark'} tilt={stripRed ? -2.4 : -1} holes={52} />
    </Reveal>
    <Reveal effect="rise" distance={120} delay={c.cutout} duration={1200} style={{ position: 'absolute', left: '50%', bottom: 0, width: 300, height: 190, marginLeft: -150, zIndex: 4 }}>
      <image-slot id="hero-cutout" shape="rect" fit="contain" placeholder="Key-art cut-out (transparent PNG)"></image-slot>
    </Reveal>
    <Reveal effect="rise" distance={30} delay={c.story} style={{ position: 'absolute', left: 'var(--page-gutter)', bottom: 44, zIndex: 5, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel tone="dark" trail={false}>{FILM.title} {FILM.numeral} story</SectionLabel>
      <Blurb part="A" tone="dark" width={270}>Wolverine joins the "merc with a mouth" in the third installment of the {FILM.title} film franchise…</Blurb>
    </Reveal>
    <div style={{ position: 'absolute', right: 'var(--page-gutter)', bottom: 40, zIndex: 5, display: 'flex', alignItems: 'center', gap: 36 }}>
      <Reveal effect="rise" distance={30} delay={c.cta}><Button tone="dark" onClick={onBook}>Book now</Button></Reveal>
      <Reveal effect="spin" delay={c.sticker} duration={1000}><StickerBadge index={1} text="MERC" size={84} /></Reveal>
    </div>
  </section>;
}
window.Hero = Hero;
