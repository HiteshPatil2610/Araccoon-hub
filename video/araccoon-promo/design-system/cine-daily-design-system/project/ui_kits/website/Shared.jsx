const DS = new Proxy({}, { get: (_, k) => (window.CineDailyDesignSystem_53d08c || {})[k] || (({ children, style, as }) => React.createElement(as || 'div', { style }, children)) });
const FILM = {
  title: 'Deadpool', numeral: 'III', year: '2024', release: 'May 3, 2024',
  genres: ['Action', 'Comedy', 'Sci-fi'],
  cast: ['Ryan Reynolds', 'Karan Soni', 'Emma Corrin', 'Hugh Jackman'],
  director: 'Shawn Levy',
};
/* Entrance choreography (ms delays) — mirrored in readme › Motion */
const CUE = {
  hero: { nav: 0, meta: 200, disc: 150, numeral: 250, cast: 0, title: 100, year: 700, strip: 400, cutout: 450, story: 800, cta: 900, sticker: 1000 },
  production: { studio: 0, discs: 150, still: 450, quote: 300, social: 700 },
  story: { directed: 0, by: 300, director: 150, release: 500, pager: 200, headline: 0, side: 300, stills: 400, card: 250, cutout: 600 },
  theaters: { label: 0, title: 100, dates: 500, cutout: 300 },
};
const Viewfinder = ({ tone = 'dark', circle = 640, top = '50%' }) => {
  const line = tone === 'dark' ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)';
  return <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, borderLeft: '1px solid ' + line }} />
    <div style={{ position: 'absolute', left: 0, right: 0, top, borderTop: '1px solid ' + line }} />
    <div style={{ position: 'absolute', left: '50%', top, width: circle, height: circle, transform: 'translate(-50%,-50%)', borderRadius: '50%', border: '1px solid ' + line }} />
  </div>;
};
const Blurb = ({ part, children, tone = 'light', width = 280 }) => <p style={{ margin: 0, maxWidth: width, display: 'grid', gridTemplateColumns: '66px 1fr', fontFamily: 'var(--font-sans)', fontSize: 11, lineHeight: 1.45, color: tone === 'dark' ? '#fff' : '#0a0a0a' }}><span>PART {part} .</span><span>{children}</span></p>;
Object.assign(window, { DS, FILM, CUE, Viewfinder, Blurb });
