/* @ds-bundle: {"format":4,"namespace":"CineDailyDesignSystem_53d08c","components":[{"name":"BookingCard","sourcePath":"components/cards/BookingCard.jsx"},{"name":"FilmStrip","sourcePath":"components/cards/FilmStrip.jsx"},{"name":"MediaFrame","sourcePath":"components/cards/MediaFrame.jsx"},{"name":"StickerBadge","sourcePath":"components/cards/StickerBadge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"AvatarStack","sourcePath":"components/editorial/AvatarStack.jsx"},{"name":"Headline","sourcePath":"components/editorial/Headline.jsx"},{"name":"IndexBadge","sourcePath":"components/editorial/IndexBadge.jsx"},{"name":"PullQuote","sourcePath":"components/editorial/PullQuote.jsx"},{"name":"Rating","sourcePath":"components/editorial/Rating.jsx"},{"name":"SectionLabel","sourcePath":"components/editorial/SectionLabel.jsx"},{"name":"StatDisc","sourcePath":"components/editorial/StatDisc.jsx"},{"name":"Wordmark","sourcePath":"components/editorial/Wordmark.jsx"},{"name":"Reveal","sourcePath":"components/motion/Reveal.jsx"},{"name":"ScrambleText","sourcePath":"components/motion/ScrambleText.jsx"},{"name":"TrackingReveal","sourcePath":"components/motion/TrackingReveal.jsx"},{"name":"ArrowPair","sourcePath":"components/navigation/ArrowPair.jsx"},{"name":"NavBar","sourcePath":"components/navigation/NavBar.jsx"},{"name":"SlideIndex","sourcePath":"components/navigation/SlideIndex.jsx"}],"sourceHashes":{"components/cards/BookingCard.jsx":"62727ecccd52","components/cards/FilmStrip.jsx":"30f689ce2807","components/cards/MediaFrame.jsx":"520af56208ba","components/cards/StickerBadge.jsx":"d359cd83cbef","components/core/Button.jsx":"a763dc2f3887","components/core/Icon.jsx":"b5de17ff7a5a","components/core/IconButton.jsx":"dc400a3eb91a","components/core/Tag.jsx":"7edea858a890","components/editorial/AvatarStack.jsx":"c3e62b53a504","components/editorial/Headline.jsx":"4d703350b8af","components/editorial/IndexBadge.jsx":"155f1e0cbb48","components/editorial/PullQuote.jsx":"52747942e5e0","components/editorial/Rating.jsx":"9c2fec9687ad","components/editorial/SectionLabel.jsx":"80b45b9faddd","components/editorial/StatDisc.jsx":"ef7b8de9ada4","components/editorial/Wordmark.jsx":"f11ff8c70679","components/motion/Reveal.jsx":"b6892ec9044b","components/motion/ScrambleText.jsx":"db786aede286","components/motion/TrackingReveal.jsx":"9ab3e088639d","components/navigation/ArrowPair.jsx":"d4978892d6be","components/navigation/NavBar.jsx":"a0923c734116","components/navigation/SlideIndex.jsx":"ffa6029c28c6","ui_kits/website/Hero.jsx":"526b129384ee","ui_kits/website/InTheaters.jsx":"b999212ed952","ui_kits/website/Production.jsx":"d08866557453","ui_kits/website/Shared.jsx":"b2e89f975053","ui_kits/website/Story.jsx":"3e4f50bd453f","ui_kits/website/image-slot.js":"fff26d081c8d"},"inlinedExternals":[],"unexposedExports":[{"name":"useReveal","sourcePath":"components/motion/Reveal.jsx"}]} */

(() => {

const __ds_ns = (window.CineDailyDesignSystem_53d08c = window.CineDailyDesignSystem_53d08c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/cards/FilmStrip.jsx
try { (() => {
function FilmStrip({
  tilt = -1.6,
  holes = 48,
  height = 46,
  tone = 'red',
  style
}) {
  const red = tone === 'red';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: height + 30,
      overflow: 'hidden',
      pointerEvents: 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '-5%',
      right: '-5%',
      top: 15,
      height,
      backgroundColor: red ? 'var(--cd-red-500)' : '#151515',
      backgroundImage: 'linear-gradient(180deg,rgba(0,0,0,.14),rgba(0,0,0,0) 60%)',
      transform: `rotate(${tilt}deg)`,
      transition: 'background-color var(--dur-slow) var(--ease-cine), transform var(--dur-slow) var(--ease-cine)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px'
    }
  }, Array.from({
    length: holes
  }, (_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 13,
      height: 8,
      borderRadius: '4px 4px 6px 6px',
      background: red ? '#0a0a0a' : '#e8e8e8',
      flex: 'none',
      transition: 'background var(--dur-slow)'
    }
  }))));
}
Object.assign(__ds_scope, { FilmStrip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/FilmStrip.jsx", error: String((e && e.message) || e) }); }

// components/cards/MediaFrame.jsx
try { (() => {
function MediaFrame({
  src,
  shape = 'rect',
  width = 180,
  height = 220,
  cut = 26,
  label = 'Still',
  radius = 4,
  tint = false,
  style
}) {
  const clip = shape === 'chamfer' ? `polygon(${cut}px 0,100% 0,100% calc(100% - ${cut}px),calc(100% - ${cut}px) 100%,0 100%,0 ${cut}px)` : shape === 'circle' ? 'circle(50%)' : 'none';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      flex: 'none',
      clipPath: clip,
      borderRadius: shape === 'rect' ? radius : 0,
      overflow: 'hidden',
      position: 'relative',
      background: src ? `center/cover url(${src})` : 'linear-gradient(160deg,#3a0d12,#0a0a0a)',
      ...style
    }
  }, tint && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--accent)',
      mixBlendMode: 'multiply',
      opacity: .45
    }
  }), !src && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 10,
      bottom: 8,
      fontFamily: 'var(--font-sans)',
      fontSize: 9,
      letterSpacing: '.32em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,.6)'
    }
  }, label));
}
Object.assign(__ds_scope, { MediaFrame });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/MediaFrame.jsx", error: String((e && e.message) || e) }); }

// components/cards/StickerBadge.jsx
try { (() => {
function StickerBadge({
  text = 'NEW',
  src,
  size = 84,
  index,
  spin = true,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      ...style
    }
  }, index != null && /*#__PURE__*/React.createElement("span", {
    style: {
      width: size * .42,
      height: size * .42,
      borderRadius: '50%',
      border: '1.3px solid #0a0a0a',
      background: '#fff',
      color: '#0a0a0a',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: size * .18,
      marginRight: -size * .12,
      zIndex: 1
    }
  }, String(index).padStart(2, '0')), /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: src ? `center/cover url(${src})` : 'radial-gradient(circle at 35% 30%,var(--cd-red-400),var(--cd-red-700))',
      border: '3px solid var(--cd-ink-700)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: 'var(--font-display)',
      fontSize: size * .26,
      transform: 'rotate(-12deg)',
      animation: spin ? 'none' : 'none'
    }
  }, !src && text));
}
Object.assign(__ds_scope, { StickerBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/StickerBadge.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function Icon({
  name = 'arrow-up-right',
  size = 18,
  color = 'currentColor',
  style
}) {
  const url = `https://unpkg.com/lucide-static@0.452.0/icons/${name}.svg`;
  return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      display: 'inline-block',
      flex: 'none',
      width: size,
      height: size,
      background: color,
      WebkitMask: `url(${url}) center/contain no-repeat`,
      mask: `url(${url}) center/contain no-repeat`,
      ...style
    }
  });
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function Button({
  variant = 'outline',
  tone = 'dark',
  size = 'md',
  icon = 'arrow-up-right',
  children,
  onClick,
  disabled,
  style
}) {
  const [h, setH] = React.useState(false);
  const [p, setP] = React.useState(false);
  const dark = tone === 'dark';
  const fs = size === 'sm' ? 16 : size === 'lg' ? 26 : 21;
  const pad = size === 'sm' ? '6px 14px 5px' : size === 'lg' ? '12px 26px 10px' : '9px 20px 7px';
  let s = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    fontFamily: 'var(--font-display)',
    fontSize: fs,
    lineHeight: 1,
    letterSpacing: '.01em',
    textTransform: 'uppercase',
    borderRadius: 'var(--radius-pill)',
    padding: pad,
    cursor: disabled ? 'default' : 'pointer',
    border: '1.5px solid transparent',
    transition: 'background var(--dur-fast), color var(--dur-fast), transform var(--dur-fast)',
    transform: p && !disabled ? 'scale(.97)' : 'none',
    opacity: disabled ? .4 : 1
  };
  if (variant === 'outline') s = {
    ...s,
    background: h ? dark ? '#fff' : '#0a0a0a' : 'transparent',
    color: h ? dark ? '#0a0a0a' : '#fff' : dark ? '#fff' : '#0a0a0a',
    borderColor: dark ? 'var(--outline-on-dark)' : 'var(--outline-on-light)'
  };
  if (variant === 'solid') s = {
    ...s,
    background: p ? 'var(--accent-press)' : h ? 'var(--accent-hover)' : 'var(--accent)',
    color: 'var(--on-accent)'
  };
  if (variant === 'ghost') s = {
    ...s,
    background: 'transparent',
    color: dark ? '#fff' : '#0a0a0a',
    textDecoration: h ? 'underline' : 'none',
    textUnderlineOffset: 4
  };
  if (variant === 'bar') s = {
    ...s,
    width: '100%',
    justifyContent: 'space-between',
    borderRadius: 'var(--radius-s)',
    fontFamily: 'var(--font-sans)',
    fontSize: 12,
    textTransform: 'none',
    letterSpacing: 0,
    padding: '12px 16px',
    background: p ? 'var(--accent-press)' : h ? 'var(--accent-hover)' : 'var(--accent)',
    color: '#fff'
  };
  return /*#__PURE__*/React.createElement("button", {
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => {
      setH(false);
      setP(false);
    },
    onMouseDown: () => setP(true),
    onMouseUp: () => setP(false),
    style: {
      ...s,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      whiteSpace: 'nowrap'
    }
  }, children), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: variant === 'bar' ? 14 : fs * .7
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/cards/BookingCard.jsx
try { (() => {
const tile = {
  background: 'var(--cd-ink-800)',
  borderRadius: 'var(--radius-m)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  padding: 10,
  color: '#fff'
};
const cap = {
  fontFamily: 'var(--font-sans)',
  fontSize: 8,
  letterSpacing: '.32em',
  textTransform: 'uppercase',
  opacity: .8
};
const val = {
  fontFamily: 'var(--font-display)',
  fontSize: 16,
  lineHeight: 1,
  textAlign: 'center'
};
function BookingCard({
  kicker = 'Film',
  title = 'Film Title',
  cinema = 'El Capitan Theatre',
  date = 'May 29',
  time = '9:30 PM',
  mapSrc,
  onBook,
  onMap,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 240,
      background: 'var(--surface-card-dark)',
      borderRadius: 'var(--radius-l)',
      padding: '28px 14px 14px',
      position: 'relative',
      boxShadow: 'var(--shadow-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -18,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: 'var(--accent)',
      border: '3px solid var(--surface-card-dark)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "ticket",
    size: 15
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...cap,
      fontSize: 9
    }
  }, kicker), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 32,
      lineHeight: .9
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onMap,
    style: {
      ...tile,
      aspectRatio: '1',
      background: mapSrc ? `center/cover url(${mapSrc})` : 'repeating-linear-gradient(35deg,#1c1c1c 0 7px,#262626 7px 9px)',
      cursor: onMap ? 'pointer' : 'default',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "map-pin",
    size: 18,
    style: {
      marginBottom: 'auto',
      marginTop: 18
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: cap
  }, "Map")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...tile,
      aspectRatio: '1'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)',
      fontSize: 8
    }
  }, "\u25BC"), /*#__PURE__*/React.createElement("span", {
    style: cap
  }, "Cinema"), /*#__PURE__*/React.createElement("span", {
    style: val
  }, cinema)), /*#__PURE__*/React.createElement("div", {
    style: tile
  }, /*#__PURE__*/React.createElement("span", {
    style: cap
  }, "Date"), /*#__PURE__*/React.createElement("span", {
    style: val
  }, date)), /*#__PURE__*/React.createElement("div", {
    style: tile
  }, /*#__PURE__*/React.createElement("span", {
    style: cap
  }, "Time"), /*#__PURE__*/React.createElement("span", {
    style: val
  }, time))), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "bar",
    icon: "arrow-right",
    onClick: onBook,
    style: {
      marginTop: 4
    }
  }, "Book Now"));
}
Object.assign(__ds_scope, { BookingCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/BookingCard.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function IconButton({
  icon = 'search',
  variant = 'outline',
  tone = 'dark',
  size,
  label,
  onClick,
  style
}) {
  const [h, setH] = React.useState(false);
  const dark = tone === 'dark';
  const d = size || (variant === 'menu' ? 48 : 38);
  let s = {
    width: d,
    height: d,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: '1.3px solid transparent',
    padding: 0,
    transition: 'background var(--dur-base), color var(--dur-base), border-color var(--dur-base), transform var(--dur-fast)'
  };
  if (variant === 'outline') s = {
    ...s,
    background: h ? dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.06)' : 'transparent',
    borderColor: dark ? 'var(--outline-on-dark)' : 'var(--outline-on-light)',
    color: dark ? '#fff' : '#0a0a0a'
  };
  if (variant === 'menu') s = {
    ...s,
    background: dark ? '#fff' : '#0a0a0a',
    color: dark ? '#0a0a0a' : '#fff',
    transform: h ? 'scale(1.06)' : 'none'
  };
  if (variant === 'accent') s = {
    ...s,
    background: h ? 'var(--accent-hover)' : 'var(--accent)',
    color: '#fff'
  };
  if (variant === 'muted') s = {
    ...s,
    background: dark ? 'var(--cd-ink-600)' : 'var(--cd-gray-200)',
    color: dark ? '#fff' : '#0a0a0a'
  };
  const inner = variant === 'menu' ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 1.6,
      background: 'currentColor',
      borderRadius: 2
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 13,
      height: 1.6,
      background: 'currentColor',
      borderRadius: 2
    }
  })) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: Math.round(d * .45)
  });
  return /*#__PURE__*/React.createElement("button", {
    "aria-label": label || icon,
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      ...s,
      ...style
    }
  }, inner);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function Tag({
  children,
  tone = 'dark',
  active = false,
  onClick,
  style
}) {
  const dark = tone === 'dark';
  const fg = dark ? '#fff' : '#0a0a0a';
  return /*#__PURE__*/React.createElement("span", {
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-display)',
      fontSize: 13,
      lineHeight: 1,
      letterSpacing: '.02em',
      textTransform: 'uppercase',
      padding: '5px 11px 4px',
      borderRadius: 'var(--radius-pill)',
      border: `1px solid ${dark ? 'rgba(255,255,255,.7)' : '#0a0a0a'}`,
      background: active ? fg : 'transparent',
      color: active ? dark ? '#0a0a0a' : '#fff' : fg,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background var(--dur-fast)',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/editorial/AvatarStack.jsx
try { (() => {
function AvatarStack({
  items = [],
  size = 26,
  gap = 6,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap,
      ...style
    }
  }, items.map((it, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    title: it.name,
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      flex: 'none',
      background: it.src ? `center/cover url(${it.src})` : it.color || 'var(--cd-ink-500)',
      filter: it.src && it.mono !== false ? 'grayscale(1)' : 'none'
    }
  })));
}
Object.assign(__ds_scope, { AvatarStack });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/editorial/AvatarStack.jsx", error: String((e && e.message) || e) }); }

// components/editorial/Headline.jsx
try { (() => {
const SIZES = {
  mega: 'var(--type-mega)',
  xl: 120,
  l: 88,
  m: 48,
  s: 32,
  xs: 24,
  '2xs': 18
};
function Headline({
  size = 'l',
  tone = 'light',
  muted = false,
  as = 'h2',
  align,
  children,
  style
}) {
  const T = as;
  const color = tone === 'dark' ? muted ? 'var(--text-on-dark-muted)' : '#fff' : muted ? 'var(--cd-ink-600)' : '#0a0a0a';
  return /*#__PURE__*/React.createElement(T, {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: SIZES[size] || size,
      lineHeight: 'var(--lh-display)',
      letterSpacing: 'var(--reveal-track, var(--ls-display))',
      transition: 'letter-spacing var(--reveal-dur, 0ms) var(--ease-cine) var(--reveal-delay, 0ms)',
      textTransform: 'uppercase',
      color,
      textAlign: align,
      textWrap: 'balance',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Headline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/editorial/Headline.jsx", error: String((e && e.message) || e) }); }

// components/editorial/IndexBadge.jsx
try { (() => {
function IndexBadge({
  n = 1,
  tone = 'dark',
  size = 38,
  style
}) {
  const dark = tone === 'dark';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      border: `1.3px solid ${dark ? '#fff' : '#0a0a0a'}`,
      background: dark ? 'transparent' : '#fff',
      color: dark ? '#fff' : '#0a0a0a',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: size * .42,
      lineHeight: 1,
      flex: 'none',
      ...style
    }
  }, String(n).padStart(2, '0'));
}
Object.assign(__ds_scope, { IndexBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/editorial/IndexBadge.jsx", error: String((e && e.message) || e) }); }

// components/editorial/PullQuote.jsx
try { (() => {
function PullQuote({
  children,
  tone = 'dark',
  highlight,
  link = true,
  style
}) {
  const dark = tone === 'dark';
  return /*#__PURE__*/React.createElement("figure", {
    style: {
      margin: 0,
      display: 'grid',
      gridTemplateColumns: '14px 2px 1fr',
      gap: 10,
      color: dark ? '#fff' : '#0a0a0a',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 16,
      lineHeight: 1
    }
  }, "\u201C"), /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'var(--accent)',
      height: '45%'
    }
  }), /*#__PURE__*/React.createElement("blockquote", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 18,
      lineHeight: 1.25,
      textTransform: 'uppercase'
    }
  }, children, highlight && /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'rgba(255,255,255,.18)',
      padding: '0 4px',
      marginLeft: 4
    }
  }, highlight), link && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      textAlign: 'right',
      color: 'var(--accent)',
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-up-right",
    size: 14
  }))));
}
Object.assign(__ds_scope, { PullQuote });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/editorial/PullQuote.jsx", error: String((e && e.message) || e) }); }

// components/editorial/Rating.jsx
try { (() => {
function Rating({
  value = 4,
  max = 5,
  size = 13,
  tone = 'dark',
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    "aria-label": `${value} of ${max}`,
    style: {
      display: 'inline-flex',
      gap: 2,
      fontSize: size,
      lineHeight: 1,
      ...style
    }
  }, Array.from({
    length: max
  }, (_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      color: i < value ? 'var(--rating-on)' : tone === 'dark' ? '#fff' : 'var(--cd-gray-300)'
    }
  }, "\u2605")));
}
Object.assign(__ds_scope, { Rating });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/editorial/Rating.jsx", error: String((e && e.message) || e) }); }

// components/editorial/SectionLabel.jsx
try { (() => {
function SectionLabel({
  children,
  tone = 'light',
  marker = true,
  trail = true,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--type-label)',
      fontWeight: 500,
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: tone === 'dark' ? '#fff' : '#0a0a0a',
      ...style
    }
  }, marker && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 15,
      height: 15,
      borderRadius: '50%',
      background: 'var(--accent)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "play",
    size: 8
  })), /*#__PURE__*/React.createElement("span", null, children, trail && ' .'));
}
Object.assign(__ds_scope, { SectionLabel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/editorial/SectionLabel.jsx", error: String((e && e.message) || e) }); }

// components/editorial/StatDisc.jsx
try { (() => {
function StatDisc({
  label,
  value,
  tone = 'light',
  size = 110,
  style
}) {
  const bg = {
    light: '#fff',
    accent: 'var(--accent)',
    dark: 'var(--cd-ink-800)',
    outline: 'transparent'
  }[tone];
  const fg = tone === 'light' ? '#0a0a0a' : '#fff';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: bg,
      color: fg,
      border: tone === 'outline' ? '1.3px solid rgba(255,255,255,.6)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      textTransform: 'uppercase',
      flex: 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: size * .15,
      lineHeight: 1,
      transform: 'rotate(-8deg)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: size * .36,
      lineHeight: 1
    }
  }, value));
}
Object.assign(__ds_scope, { StatDisc });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/editorial/StatDisc.jsx", error: String((e && e.message) || e) }); }

// components/editorial/Wordmark.jsx
try { (() => {
function Wordmark({
  tone = 'dark',
  size = 30,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: size,
      lineHeight: 1,
      letterSpacing: '-.01em',
      color: tone === 'dark' ? '#fff' : '#0a0a0a',
      whiteSpace: 'nowrap',
      transition: 'color var(--dur-base) var(--ease-cine)',
      ...style
    }
  }, "CINE DAILY");
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/editorial/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/motion/Reveal.jsx
try { (() => {
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
function useReveal(ref, {
  once = false,
  threshold = 0.2,
  replayKey
} = {}) {
  const [inView, setIn] = React.useState(false);
  const [armed, setArmed] = React.useState(true);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIn(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio >= Math.min(threshold, .99)) {
        setIn(true);
        if (once) io.disconnect();
      } else if (!e.isIntersecting && !once) setIn(false);
    }, {
      threshold: [0, threshold]
    });
    io.observe(el);
    return () => io.disconnect();
  }, [once, threshold]);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setArmed(false);
    let b;
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setArmed(true));
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, [replayKey]);
  return reduced() || inView && armed;
}
const HIDDEN = {
  fade: () => ({
    opacity: 0
  }),
  rise: d => ({
    opacity: 0,
    t: 'translateY(' + d + 'px)'
  }),
  drop: d => ({
    opacity: 0,
    t: 'translateY(' + -d + 'px)'
  }),
  'slide-left': d => ({
    opacity: 0,
    t: 'translateX(' + -d + 'px)'
  }),
  'slide-right': d => ({
    opacity: 0,
    t: 'translateX(' + d + 'px)'
  }),
  pop: () => ({
    opacity: 0,
    t: 'scale(.6)'
  }),
  spin: () => ({
    opacity: 0,
    t: 'rotate(-120deg) scale(.6)'
  }),
  blur: () => ({
    opacity: 0,
    t: 'scale(1.04)',
    f: 'blur(12px)'
  }),
  mask: () => ({
    clip: 'inset(100% 0 0 0)'
  }),
  'wipe-x': () => ({
    clip: 'inset(0 100% 0 0)'
  })
};
function Reveal({
  effect = 'rise',
  delay = 0,
  duration = 900,
  distance = 60,
  rotate = 0,
  restRotate = 0,
  once = false,
  threshold = 0.2,
  replayKey,
  as = 'div',
  style,
  children
}) {
  const ref = React.useRef(null);
  const shown = useReveal(ref, {
    once,
    threshold,
    replayKey
  });
  const h = (HIDDEN[effect] || HIDDEN.rise)(distance);
  const ease = effect === 'pop' || effect === 'spin' ? 'var(--ease-pop)' : 'var(--ease-cine)';
  const rest = restRotate ? 'rotate(' + restRotate + 'deg)' : 'none';
  const T = as;
  const s = shown ? {
    opacity: 1,
    transform: rest,
    filter: 'none',
    clipPath: h.clip ? 'inset(0 0 0 0)' : undefined,
    transition: ['transform', 'opacity', 'filter', 'clip-path'].map(p => p + ' ' + duration + 'ms ' + ease + ' ' + delay + 'ms').join(',')
  } : {
    opacity: h.opacity ?? 1,
    transform: ((h.t || '') + ' rotate(' + (restRotate + rotate) + 'deg)').trim(),
    filter: h.f || 'none',
    clipPath: h.clip,
    transition: 'none'
  };
  return /*#__PURE__*/React.createElement(T, {
    ref: ref,
    style: {
      willChange: 'transform, opacity',
      ...style,
      ...s
    }
  }, children);
}
Object.assign(__ds_scope, { useReveal, Reveal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/motion/Reveal.jsx", error: String((e && e.message) || e) }); }

// components/motion/ScrambleText.jsx
try { (() => {
const scramble = (text, p, set) => text.split('').map((c, i) => c === ' ' || i < Math.floor(p * text.length) ? c : set[Math.floor(Math.random() * set.length)]).join('');
function ScrambleText({
  text = '',
  duration = 900,
  delay = 0,
  charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  once = false,
  threshold = 0.2,
  replayKey,
  as = 'span',
  style
}) {
  const ref = React.useRef(null);
  const shown = __ds_scope.useReveal(ref, {
    once,
    threshold,
    replayKey
  });
  const [out, setOut] = React.useState(text);
  React.useEffect(() => {
    if (!shown) {
      setOut(scramble(text, 0, charset));
      return;
    }
    let raf,
      last = 0;
    const t0 = performance.now() + delay;
    const tick = now => {
      const p = Math.max(0, Math.min(1, (now - t0) / duration));
      if (now - last > 45 || p === 1) {
        setOut(p === 1 ? text : scramble(text, p, charset));
        last = now;
      }
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, text]);
  const T = as;
  return /*#__PURE__*/React.createElement(T, {
    ref: ref,
    "aria-label": text,
    style: {
      fontVariantNumeric: 'tabular-nums',
      ...style
    }
  }, out);
}
Object.assign(__ds_scope, { ScrambleText });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/motion/ScrambleText.jsx", error: String((e && e.message) || e) }); }

// components/motion/TrackingReveal.jsx
try { (() => {
function TrackingReveal({
  from = '0.45em',
  to = 'var(--ls-display)',
  fromOpacity = 0.3,
  delay = 0,
  duration = 1300,
  once = false,
  threshold = 0.2,
  replayKey,
  as = 'div',
  style,
  children
}) {
  const ref = React.useRef(null);
  const shown = __ds_scope.useReveal(ref, {
    once,
    threshold,
    replayKey
  });
  const T = as;
  const tr = shown ? duration + 'ms' : '0ms';
  return /*#__PURE__*/React.createElement(T, {
    ref: ref,
    style: {
      ...style,
      '--reveal-track': shown ? to : from,
      '--reveal-dur': tr,
      '--reveal-delay': delay + 'ms',
      letterSpacing: shown ? to : from,
      opacity: shown ? 1 : fromOpacity,
      transition: shown ? 'letter-spacing ' + tr + ' var(--ease-cine) ' + delay + 'ms, opacity ' + tr + ' var(--ease-cine) ' + delay + 'ms' : 'none'
    }
  }, children);
}
Object.assign(__ds_scope, { TrackingReveal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/motion/TrackingReveal.jsx", error: String((e && e.message) || e) }); }

// components/navigation/ArrowPair.jsx
try { (() => {
const Arrow = ({
  dir,
  color,
  onClick,
  offset
}) => /*#__PURE__*/React.createElement("button", {
  "aria-label": dir,
  onClick: onClick,
  style: {
    background: 'none',
    border: 0,
    padding: '4px 0',
    cursor: 'pointer',
    marginLeft: offset,
    display: 'block'
  }
}, /*#__PURE__*/React.createElement("svg", {
  width: "58",
  height: "8",
  viewBox: "0 0 58 8",
  fill: "none",
  style: {
    display: 'block',
    transform: dir === 'prev' ? 'scaleX(-1)' : 'none'
  }
}, /*#__PURE__*/React.createElement("path", {
  d: "M0 4H56M56 4L52 1M56 4L52 7",
  stroke: color,
  strokeWidth: "1.2"
})));
function ArrowPair({
  onPrev,
  onNext,
  tone = 'light',
  style
}) {
  const fg = tone === 'dark' ? '#fff' : '#0a0a0a';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      ...style
    }
  }, /*#__PURE__*/React.createElement(Arrow, {
    dir: "next",
    color: "var(--accent)",
    onClick: onNext,
    offset: 32
  }), /*#__PURE__*/React.createElement(Arrow, {
    dir: "prev",
    color: fg,
    onClick: onPrev,
    offset: 0
  }));
}
Object.assign(__ds_scope, { ArrowPair });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/ArrowPair.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavBar.jsx
try { (() => {
function NavBar({
  tone = 'dark',
  items = ['Top casts', 'Production', 'Box office', 'IMAX 6'],
  active = 0,
  onNavigate,
  onMenu,
  logoSrc,
  style
}) {
  const dark = tone === 'dark';
  const fg = dark ? '#fff' : '#0a0a0a';
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      height: 'var(--nav-height)',
      padding: '0 var(--page-gutter)',
      color: fg,
      transition: 'color var(--dur-base) var(--ease-cine)',
      ...style
    }
  }, logoSrc ? /*#__PURE__*/React.createElement("img", {
    src: logoSrc,
    alt: "Cine Daily",
    style: {
      height: 34
    }
  }) : /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    tone: tone,
    size: 32
  }), /*#__PURE__*/React.createElement("ul", {
    style: {
      display: 'flex',
      gap: 22,
      listStyle: 'none',
      margin: 0,
      padding: 0,
      alignItems: 'center'
    }
  }, items.map((it, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: it
  }, i > 0 && /*#__PURE__*/React.createElement("li", {
    "aria-hidden": "true",
    style: {
      width: 3,
      height: 3,
      borderRadius: '50%',
      background: fg,
      opacity: .8,
      transition: 'background var(--dur-base)'
    }
  }), /*#__PURE__*/React.createElement("li", {
    onClick: () => onNavigate && onNavigate(i),
    style: {
      position: 'relative',
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      opacity: i === active ? 1 : .82,
      transition: 'opacity var(--dur-base)'
    }
  }, it, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: '50%',
      top: 22,
      width: 7,
      height: 7,
      background: 'var(--accent)',
      transform: 'translateX(-50%) rotate(45deg) scale(' + (i === active ? 1 : 0) + ')',
      borderRadius: 1,
      transition: 'transform var(--dur-base) var(--ease-pop)'
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      justifyContent: 'flex-end',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "search",
    tone: tone
  }), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "user",
    tone: tone
  }), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    variant: "menu",
    tone: tone,
    onClick: onMenu,
    style: {
      marginLeft: 10
    }
  })));
}
Object.assign(__ds_scope, { NavBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SlideIndex.jsx
try { (() => {
function SlideIndex({
  count = 4,
  active = 0,
  onChange,
  tone = 'light',
  spread = true,
  style
}) {
  const fg = tone === 'dark' ? '#fff' : '#0a0a0a';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: spread ? 'space-between' : 'flex-start',
      gap: 40,
      ...style
    }
  }, Array.from({
    length: count
  }, (_, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => onChange && onChange(i),
    style: {
      background: 'none',
      border: 0,
      padding: '0 0 6px',
      cursor: 'pointer',
      color: fg,
      opacity: i === active ? 1 : .75,
      fontFamily: 'var(--font-display)',
      fontSize: 18,
      lineHeight: 1,
      position: 'relative'
    }
  }, String(i + 1).padStart(2, '0'), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      bottom: 0,
      height: 1.5,
      width: i === active ? 8 : 0,
      background: 'var(--accent)',
      transition: 'width var(--dur-base) var(--ease-cine)'
    }
  }))));
}
Object.assign(__ds_scope, { SlideIndex });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SlideIndex.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Hero.jsx
try { (() => {
function Hero({
  onBook,
  stripRed
}) {
  const {
    Tag,
    Headline,
    Button,
    SectionLabel,
    FilmStrip,
    StickerBadge,
    Reveal,
    TrackingReveal
  } = DS;
  const [genre, setGenre] = React.useState(0);
  const c = CUE.hero;
  return /*#__PURE__*/React.createElement("section", {
    id: "hero",
    "data-screen-label": "01 Hero",
    style: {
      position: 'relative',
      height: 800,
      background: 'var(--cd-black)',
      color: '#fff',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Viewfinder, {
    circle: 700,
    top: "56%"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 'var(--nav-height)'
    }
  }), /*#__PURE__*/React.createElement(Reveal, {
    effect: "fade",
    delay: c.meta,
    style: {
      position: 'relative',
      zIndex: 3,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 var(--page-gutter)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, FILM.genres.map((g, i) => /*#__PURE__*/React.createElement(Tag, {
    key: g,
    active: i === genre,
    onClick: () => setGenre(i)
  }, g))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 14
    }
  }, "RELEASE [", FILM.release.toUpperCase(), "]")), /*#__PURE__*/React.createElement(Reveal, {
    effect: "pop",
    delay: c.disc,
    duration: 1000,
    style: {
      position: 'absolute',
      left: '50%',
      top: 196,
      width: 440,
      height: 440,
      marginLeft: -220,
      borderRadius: '50%',
      background: 'var(--accent)'
    }
  }), /*#__PURE__*/React.createElement(Reveal, {
    effect: "drop",
    distance: 40,
    delay: c.numeral,
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 160,
      display: 'flex',
      justifyContent: 'center',
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement(Headline, {
    size: 96,
    tone: "dark",
    as: "div"
  }, FILM.numeral)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 'var(--page-gutter)',
      right: 'var(--page-gutter)',
      top: 214,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 360px 1fr 1fr',
      zIndex: 2
    }
  }, FILM.cast.slice(0, 2).map((n, i) => /*#__PURE__*/React.createElement(TrackingReveal, {
    key: n,
    from: "0.5em",
    delay: c.cast + i * 80
  }, /*#__PURE__*/React.createElement(Headline, {
    size: 34,
    tone: "dark",
    as: "div"
  }, n))), /*#__PURE__*/React.createElement("span", null), FILM.cast.slice(2).map((n, i) => /*#__PURE__*/React.createElement(TrackingReveal, {
    key: n,
    from: "0.5em",
    delay: c.cast + (i + 2) * 80
  }, /*#__PURE__*/React.createElement(Headline, {
    size: 34,
    tone: "dark",
    as: "div",
    align: i ? 'right' : 'left'
  }, n)))), /*#__PURE__*/React.createElement(TrackingReveal, {
    from: "0.32em",
    fromOpacity: 0.25,
    delay: c.title,
    duration: 1500,
    style: {
      position: 'absolute',
      left: 40,
      right: 70,
      top: 266,
      zIndex: 2,
      display: 'flex',
      justifyContent: 'center',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(Headline, {
    size: 330,
    tone: "dark",
    as: "h1",
    align: "center",
    style: {
      lineHeight: .8
    }
  }, FILM.title)), /*#__PURE__*/React.createElement(Reveal, {
    effect: "fade",
    delay: c.year,
    style: {
      position: 'absolute',
      right: 30,
      top: 440,
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      transform: 'rotate(90deg)',
      fontFamily: 'var(--font-display)',
      fontSize: 28
    }
  }, "[", FILM.year, "]")), /*#__PURE__*/React.createElement(Reveal, {
    effect: "wipe-x",
    delay: c.strip,
    duration: 1100,
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 590,
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement(FilmStrip, {
    tone: stripRed ? 'red' : 'dark',
    tilt: stripRed ? -2.4 : -1,
    holes: 52
  })), /*#__PURE__*/React.createElement(Reveal, {
    effect: "rise",
    distance: 120,
    delay: c.cutout,
    duration: 1200,
    style: {
      position: 'absolute',
      left: '50%',
      bottom: 0,
      width: 300,
      height: 190,
      marginLeft: -150,
      zIndex: 4
    }
  }, /*#__PURE__*/React.createElement("image-slot", {
    id: "hero-cutout",
    shape: "rect",
    fit: "contain",
    placeholder: "Key-art cut-out (transparent PNG)"
  })), /*#__PURE__*/React.createElement(Reveal, {
    effect: "rise",
    distance: 30,
    delay: c.story,
    style: {
      position: 'absolute',
      left: 'var(--page-gutter)',
      bottom: 44,
      zIndex: 5,
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    tone: "dark",
    trail: false
  }, FILM.title, " ", FILM.numeral, " story"), /*#__PURE__*/React.createElement(Blurb, {
    part: "A",
    tone: "dark",
    width: 270
  }, "Wolverine joins the \"merc with a mouth\" in the third installment of the ", FILM.title, " film franchise\u2026")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 'var(--page-gutter)',
      bottom: 40,
      zIndex: 5,
      display: 'flex',
      alignItems: 'center',
      gap: 36
    }
  }, /*#__PURE__*/React.createElement(Reveal, {
    effect: "rise",
    distance: 30,
    delay: c.cta
  }, /*#__PURE__*/React.createElement(Button, {
    tone: "dark",
    onClick: onBook
  }, "Book now")), /*#__PURE__*/React.createElement(Reveal, {
    effect: "spin",
    delay: c.sticker,
    duration: 1000
  }, /*#__PURE__*/React.createElement(StickerBadge, {
    index: 1,
    text: "MERC",
    size: 84
  }))));
}
window.Hero = Hero;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/InTheaters.jsx
try { (() => {
function InTheaters() {
  const {
    Headline,
    Reveal,
    TrackingReveal,
    ScrambleText
  } = DS;
  const c = CUE.theaters;
  return /*#__PURE__*/React.createElement("section", {
    id: "theaters",
    "data-screen-label": "04 In theaters",
    style: {
      position: 'relative',
      height: 800,
      background: '#fff',
      overflow: 'hidden',
      borderTop: 'var(--hairline)'
    }
  }, /*#__PURE__*/React.createElement(Viewfinder, {
    tone: "light",
    circle: 680,
    top: "56%"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 'var(--nav-height)',
      borderBottom: 'var(--hairline)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      textAlign: 'center',
      marginTop: 80
    }
  }, /*#__PURE__*/React.createElement(Reveal, {
    effect: "fade",
    delay: c.label
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      letterSpacing: '.42em',
      textTransform: 'uppercase'
    }
  }, "In theaters")), /*#__PURE__*/React.createElement(TrackingReveal, {
    from: "0.3em",
    delay: c.title,
    style: {
      marginTop: 14,
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(Headline, {
    size: 170,
    align: "center",
    as: "h2"
  }, FILM.title, " ", FILM.numeral)), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 600,
      margin: '20px auto 0',
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(Headline, {
    size: 36,
    as: "div"
  }, /*#__PURE__*/React.createElement(ScrambleText, {
    text: "MAY 3",
    delay: c.dates
  })), /*#__PURE__*/React.createElement(Headline, {
    size: 36,
    as: "div"
  }, /*#__PURE__*/React.createElement(ScrambleText, {
    text: FILM.year,
    delay: c.dates + 100,
    charset: "0123456789"
  })))), /*#__PURE__*/React.createElement(Reveal, {
    effect: "rise",
    distance: 140,
    delay: c.cutout,
    duration: 1200,
    style: {
      position: 'absolute',
      left: '50%',
      bottom: 0,
      width: 360,
      height: 300,
      marginLeft: -180
    }
  }, /*#__PURE__*/React.createElement("image-slot", {
    id: "theaters-cutout",
    shape: "rect",
    fit: "contain",
    placeholder: "Key-art cut-out (transparent PNG)"
  })));
}
window.InTheaters = InTheaters;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/InTheaters.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Production.jsx
try { (() => {
function Production() {
  const {
    SectionLabel,
    IndexBadge,
    Rating,
    StatDisc,
    PullQuote,
    IconButton,
    Reveal
  } = DS;
  const c = CUE.production;
  return /*#__PURE__*/React.createElement("section", {
    id: "production",
    "data-screen-label": "02 Production",
    style: {
      position: 'relative',
      zIndex: 2,
      height: 660,
      background: 'var(--cd-black)',
      color: '#fff',
      overflow: 'hidden',
      borderRadius: '0 0 var(--radius-frame) var(--radius-frame)',
      boxShadow: '0 3px 0 var(--cd-pink-500)'
    }
  }, /*#__PURE__*/React.createElement(Viewfinder, {
    circle: 620,
    top: "58%"
  }), /*#__PURE__*/React.createElement(Reveal, {
    effect: "slide-left",
    distance: 50,
    delay: c.studio,
    style: {
      position: 'absolute',
      left: 'var(--page-gutter)',
      top: 90,
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    tone: "dark",
    trail: false
  }, "Production"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      fontFamily: 'var(--font-display)',
      fontSize: 34,
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'var(--accent)',
      padding: '2px 6px 0'
    }
  }, "MARVEL"), /*#__PURE__*/React.createElement("span", {
    style: {
      padding: '2px 6px 0',
      border: '1px solid rgba(255,255,255,.6)'
    }
  }, "STUDIOS")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 60,
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(IndexBadge, {
    n: 2
  }), /*#__PURE__*/React.createElement(Rating, {
    value: 4
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 110,
      display: 'flex',
      justifyContent: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Reveal, {
    effect: "pop",
    delay: c.discs
  }, /*#__PURE__*/React.createElement(StatDisc, {
    label: "Trailer",
    value: '1:47"'
  })), /*#__PURE__*/React.createElement(Reveal, {
    effect: "pop",
    delay: c.discs + 120
  }, /*#__PURE__*/React.createElement(StatDisc, {
    tone: "accent",
    label: "IMAX",
    value: "6"
  })), /*#__PURE__*/React.createElement(Reveal, {
    effect: "pop",
    delay: c.discs + 240
  }, /*#__PURE__*/React.createElement(StatDisc, {
    tone: "dark",
    label: "May",
    value: "3"
  }))), /*#__PURE__*/React.createElement(Reveal, {
    effect: "rise",
    distance: 140,
    rotate: 10,
    restRotate: -4,
    delay: c.still,
    duration: 1200,
    style: {
      position: 'absolute',
      left: '50%',
      top: 260,
      width: 240,
      height: 300,
      marginLeft: -120
    }
  }, /*#__PURE__*/React.createElement("image-slot", {
    id: "prod-still",
    shape: "rounded",
    radius: "6",
    placeholder: "Costume / prop still"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 'var(--page-gutter)',
      top: 120,
      width: 210,
      display: 'flex',
      flexDirection: 'column',
      gap: 70
    }
  }, /*#__PURE__*/React.createElement(Reveal, {
    effect: "mask",
    delay: c.quote,
    duration: 1000
  }, /*#__PURE__*/React.createElement(PullQuote, {
    highlight: "'Logan'."
  }, "Hugh Jackman said he really was done playing the character of Logan/Wolverine after 2017's")), /*#__PURE__*/React.createElement(Reveal, {
    effect: "fade",
    delay: c.social,
    style: {
      display: 'flex',
      gap: 6,
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    variant: "muted",
    icon: "instagram",
    size: 22
  }), /*#__PURE__*/React.createElement(IconButton, {
    variant: "muted",
    icon: "facebook",
    size: 22
  }), /*#__PURE__*/React.createElement(IconButton, {
    variant: "muted",
    icon: "youtube",
    size: 22
  }))));
}
window.Production = Production;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Production.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Shared.jsx
try { (() => {
const DS = new Proxy({}, {
  get: (_, k) => (window.CineDailyDesignSystem_53d08c || {})[k] || (({
    children,
    style,
    as
  }) => React.createElement(as || 'div', {
    style
  }, children))
});
const FILM = {
  title: 'Deadpool',
  numeral: 'III',
  year: '2024',
  release: 'May 3, 2024',
  genres: ['Action', 'Comedy', 'Sci-fi'],
  cast: ['Ryan Reynolds', 'Karan Soni', 'Emma Corrin', 'Hugh Jackman'],
  director: 'Shawn Levy'
};
/* Entrance choreography (ms delays) — mirrored in readme › Motion */
const CUE = {
  hero: {
    nav: 0,
    meta: 200,
    disc: 150,
    numeral: 250,
    cast: 0,
    title: 100,
    year: 700,
    strip: 400,
    cutout: 450,
    story: 800,
    cta: 900,
    sticker: 1000
  },
  production: {
    studio: 0,
    discs: 150,
    still: 450,
    quote: 300,
    social: 700
  },
  story: {
    directed: 0,
    by: 300,
    director: 150,
    release: 500,
    pager: 200,
    headline: 0,
    side: 300,
    stills: 400,
    card: 250,
    cutout: 600
  },
  theaters: {
    label: 0,
    title: 100,
    dates: 500,
    cutout: 300
  }
};
const Viewfinder = ({
  tone = 'dark',
  circle = 640,
  top = '50%'
}) => {
  const line = tone === 'dark' ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)';
  return /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: 0,
      bottom: 0,
      borderLeft: '1px solid ' + line
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      top,
      borderTop: '1px solid ' + line
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top,
      width: circle,
      height: circle,
      transform: 'translate(-50%,-50%)',
      borderRadius: '50%',
      border: '1px solid ' + line
    }
  }));
};
const Blurb = ({
  part,
  children,
  tone = 'light',
  width = 280
}) => /*#__PURE__*/React.createElement("p", {
  style: {
    margin: 0,
    maxWidth: width,
    display: 'grid',
    gridTemplateColumns: '66px 1fr',
    fontFamily: 'var(--font-sans)',
    fontSize: 11,
    lineHeight: 1.45,
    color: tone === 'dark' ? '#fff' : '#0a0a0a'
  }
}, /*#__PURE__*/React.createElement("span", null, "PART ", part, " ."), /*#__PURE__*/React.createElement("span", null, children));
Object.assign(window, {
  DS,
  FILM,
  CUE,
  Viewfinder,
  Blurb
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Shared.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Story.jsx
try { (() => {
const SLIDES = [['Deadpool III: Release date, cast, and', 'everything about the film!'], ['Who returns for the', 'third installment?'], ['Inside the multiverse', 'with Wolverine'], ['Premiere night at', 'El Capitan Theatre']];
function Story({
  onBooked,
  booked
}) {
  const {
    Headline,
    SectionLabel,
    SlideIndex,
    AvatarStack,
    ArrowPair,
    StickerBadge,
    BookingCard,
    MediaFrame,
    Reveal,
    TrackingReveal
  } = DS;
  const [s, setS] = React.useState(0);
  const c = CUE.story;
  return /*#__PURE__*/React.createElement("section", {
    id: "story",
    "data-screen-label": "03 Story",
    style: {
      position: 'relative',
      zIndex: 1,
      height: 1080,
      marginTop: 'calc(-1 * var(--curtain-overlap))',
      paddingTop: 'var(--curtain-overlap)',
      background: '#fff',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Viewfinder, {
    tone: "light",
    circle: 680,
    top: "62%"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: '40px var(--page-gutter) 0',
      display: 'grid',
      gridTemplateColumns: 'auto auto 1fr',
      alignItems: 'end',
      gap: 28
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TrackingReveal, {
    from: "0.3em",
    delay: c.directed
  }, /*#__PURE__*/React.createElement(Headline, {
    size: 128,
    as: "h2"
  }, "Directed")), /*#__PURE__*/React.createElement(Reveal, {
    effect: "fade",
    delay: c.release
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginTop: 18,
      fontSize: 9,
      letterSpacing: '.42em',
      textTransform: 'uppercase'
    }
  }, "Gallery 07/32"))), /*#__PURE__*/React.createElement(Reveal, {
    effect: "pop",
    delay: c.by,
    style: {
      marginBottom: 80
    }
  }, /*#__PURE__*/React.createElement(Headline, {
    size: 40,
    as: "div"
  }, "by")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Reveal, {
    effect: "rise",
    distance: 24,
    delay: c.release,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginLeft: 180
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Release date"), /*#__PURE__*/React.createElement(Blurb, {
    part: "B",
    width: 420
  }, FILM.title, " 3 is scheduled to be released in the United States on May 3, 2024. It was previously scheduled for September 6 of that year, and then November 8.")), /*#__PURE__*/React.createElement(TrackingReveal, {
    from: "0.3em",
    delay: c.director,
    style: {
      textAlign: 'right',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(Headline, {
    size: 128,
    as: "div",
    align: "right"
  }, FILM.director)))), /*#__PURE__*/React.createElement(Reveal, {
    effect: "wipe-x",
    duration: 1200,
    delay: c.pager,
    style: {
      borderTop: 'var(--hairline)',
      margin: '28px 0 0'
    }
  }), /*#__PURE__*/React.createElement(Reveal, {
    effect: "fade",
    delay: c.pager,
    style: {
      position: 'relative',
      padding: '18px var(--page-gutter)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr'
    }
  }, /*#__PURE__*/React.createElement(SlideIndex, {
    count: 2,
    active: s < 2 ? s : -1,
    onChange: setS,
    style: {
      width: 210
    },
    spread: true
  }), /*#__PURE__*/React.createElement(SlideIndex, {
    count: 2,
    active: s >= 2 ? s - 2 : -1,
    onChange: i => setS(i + 2),
    style: {
      width: 210,
      marginLeft: 'auto'
    },
    spread: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      textAlign: 'center',
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Reveal, {
    effect: "blur",
    replayKey: s,
    duration: 800,
    delay: c.headline
  }, /*#__PURE__*/React.createElement(Headline, {
    size: 48,
    align: "center"
  }, SLIDES[s][0]), /*#__PURE__*/React.createElement(Headline, {
    size: 48,
    align: "center",
    muted: true
  }, SLIDES[s][1])), /*#__PURE__*/React.createElement(Reveal, {
    effect: "fade",
    delay: c.side
  }, /*#__PURE__*/React.createElement(ArrowPair, {
    style: {
      marginTop: 22
    },
    onNext: () => setS((s + 1) % 4),
    onPrev: () => setS((s + 3) % 4)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 90,
      top: 520,
      display: 'flex',
      gap: 6
    }
  }, [{
    color: '#3a3a3a'
  }, {
    color: '#6a6a6a'
  }, {
    color: 'var(--accent)'
  }, {
    color: '#8c7a70'
  }].map((it, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: i,
    effect: "pop",
    delay: c.side + i * 90
  }, /*#__PURE__*/React.createElement(AvatarStack, {
    items: [it]
  })))), /*#__PURE__*/React.createElement(Reveal, {
    effect: "spin",
    delay: c.side,
    duration: 1000,
    style: {
      position: 'absolute',
      right: 70,
      top: 490
    }
  }, /*#__PURE__*/React.createElement(StickerBadge, {
    index: 3,
    text: "MERC"
  })), /*#__PURE__*/React.createElement(Reveal, {
    effect: "slide-left",
    distance: 40,
    delay: c.side,
    style: {
      position: 'absolute',
      left: 90,
      top: 640,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "X-Men"), /*#__PURE__*/React.createElement(Blurb, {
    part: "C"
  }, FILM.title, ", AKA Wade Wilson, AKA the Merc with a Mouth, first made his debut in the much-maligned X-Men Origins: Wolverine.")), /*#__PURE__*/React.createElement(Reveal, {
    effect: "slide-right",
    distance: 40,
    delay: c.side,
    style: {
      position: 'absolute',
      right: 90,
      top: 640,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Premiering"), /*#__PURE__*/React.createElement(Blurb, {
    part: "D"
  }, "The film was initially announced for September 6, 2024, but it later changed, being pushed back to November 8, 2024\u2026")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 150,
      top: 830
    }
  }, /*#__PURE__*/React.createElement(Reveal, {
    effect: "slide-left",
    distance: 80,
    delay: c.stills,
    style: {
      position: 'absolute',
      left: 70,
      top: 0
    }
  }, /*#__PURE__*/React.createElement(MediaFrame, {
    shape: "chamfer",
    width: 114,
    height: 160,
    label: "Still 01"
  })), /*#__PURE__*/React.createElement(Reveal, {
    effect: "slide-left",
    distance: 80,
    delay: c.stills + 120,
    style: {
      position: 'absolute',
      left: 0,
      top: 120
    }
  }, /*#__PURE__*/React.createElement(MediaFrame, {
    shape: "chamfer",
    width: 114,
    height: 140,
    label: "Still 02"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 330,
      top: 830
    }
  }, /*#__PURE__*/React.createElement(Reveal, {
    effect: "slide-right",
    distance: 80,
    delay: c.stills,
    style: {
      position: 'absolute',
      left: 0,
      top: 0
    }
  }, /*#__PURE__*/React.createElement(MediaFrame, {
    shape: "chamfer",
    width: 114,
    height: 160,
    label: "Still 03"
  })), /*#__PURE__*/React.createElement(Reveal, {
    effect: "slide-right",
    distance: 80,
    delay: c.stills + 120,
    style: {
      position: 'absolute',
      left: 70,
      top: 120
    }
  }, /*#__PURE__*/React.createElement(MediaFrame, {
    shape: "chamfer",
    width: 114,
    height: 140,
    label: "Still 04"
  }))), /*#__PURE__*/React.createElement(Reveal, {
    effect: "rise",
    distance: 100,
    delay: c.card,
    duration: 1100,
    style: {
      position: 'absolute',
      left: '50%',
      top: 740,
      marginLeft: -120,
      zIndex: 3
    }
  }, /*#__PURE__*/React.createElement(BookingCard, {
    title: FILM.title + ' ' + FILM.numeral,
    date: "May 29",
    time: "9:30",
    onBook: onBooked
  })), booked && /*#__PURE__*/React.createElement(Reveal, {
    effect: "pop",
    style: {
      position: 'absolute',
      left: '50%',
      top: 690,
      marginLeft: -92,
      zIndex: 4,
      fontFamily: 'var(--font-display)',
      fontSize: 20,
      background: '#0a0a0a',
      color: '#fff',
      padding: '8px 16px 6px',
      borderRadius: 999,
      whiteSpace: 'nowrap'
    }
  }, "Seat booked \xB7 Row F"), /*#__PURE__*/React.createElement(Reveal, {
    effect: "rise",
    distance: 80,
    delay: c.cutout,
    style: {
      position: 'absolute',
      left: '50%',
      bottom: 0,
      width: 220,
      height: 160,
      marginLeft: 140,
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement("image-slot", {
    id: "story-cutout",
    shape: "rect",
    fit: "contain",
    placeholder: "Cut-out"
  })));
}
window.Story = Story;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Story.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/image-slot.js
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).
/* BEGIN USAGE */
/**
 * <image-slot> — user-fillable image placeholder.
 *
 * Drop this into a deck, mockup, or page wherever a design needs an image.
 * You control the slot's shape; it sizes to its container by default. When the search_stock_photos tool
 * is available, prefill the slot by default — write the photo's URL into
 * src (with credit/credit-href); the user can still fill or replace it
 * by dragging an image file onto it (or clicking to browse). The dropped
 * image persists across reloads via a .image-slots.state.json sidecar —
 * same read-via-fetch / write-via-window.omelette pattern as
 * design_canvas.jsx, so the filled slot shows on share links, downloaded
 * zips, and PPTX export. Outside the omelette runtime the slot is read-only.
 *
 * The sidecar is a SIBLING of the HTML file that uses this component: the
 * read is a document-relative fetch, and the host resolves the bridge's
 * sidecar writes into the previewed file's directory to match (same
 * contract as design_canvas.jsx). Pages in the same directory share one
 * sidecar; keep slot ids distinct across them.
 *
 * Attributes:
 *   id           Persistence key. REQUIRED for the drop to survive reload —
 *                every slot on the page needs a distinct id.
 *   shape        'rect' | 'rounded' | 'circle' | 'pill'   (default 'rounded')
 *                'circle' applies 50% border-radius; on a non-square slot
 *                that's an ellipse — set equal width and height for a true
 *                circle.
 *   radius       Corner radius in px for 'rounded'.       (default 12)
 *   mask         Any CSS clip-path value. Overrides `shape` — use this for
 *                hexagons, blobs, arbitrary polygons.
 *   fit          Initial framing baseline: cover | contain.   (default 'cover')
 *                cover starts the image filling the frame (overflow cropped);
 *                contain starts it fully visible (letterboxed). Either way the
 *                user can always pan/scale from there — double-click, or the
 *                Edit control, enters reframe mode (drag to move, scroll or
 *                corner-handles to scale; Escape / click-out commits). The
 *                crop persists alongside the image in the sidecar.
 *   placeholder  Empty-state caption.                      (default 'Drop an image')
 *   src          Optional initial/fallback image URL. Prefill it with a real
 *                photo via search_stock_photos when that tool is available
 *                (set credit/credit-href from the result). A user drop
 *                overrides it; clearing the drop reveals src again.
 *   credit       Attribution text shown as a small overlay at the
 *                bottom-left of the filled slot. REQUIRED whenever src
 *                points at any Unsplash host (images.unsplash.com,
 *                plus.unsplash.com, …): an Unsplash src with no credit
 *                renders an error tile INSTEAD of the photo (Unsplash
 *                terms forbid showing their photos unattributed). Use the
 *                exact form 'Photo by {photographer name} on Unsplash' —
 *                the overlay then links the name to credit-href and
 *                'Unsplash' to the Unsplash homepage, and links back to
 *                unsplash.com automatically get the required utm referral
 *                params appended at render time. The credit belongs to
 *                the src image, so it only shows while src is what's
 *                displayed — a user-dropped image hides it.
 *   credit-href  Link for the photographer's name in the credit overlay
 *                (their Unsplash profile URL from the stock-photo search
 *                results). http(s) URLs only — anything else renders the
 *                name as plain text.
 *
 * Sizing: the slot fills its container by default (width/height 100%).
 * Put it in a sized wrapper — absolutely positioned, a grid cell, a fixed
 * frame — and it takes exactly that box. When the parent's height is
 * indefinite (ordinary flow), it falls back to full width at a 3:2 aspect
 * ratio instead of collapsing. In a shrink-to-fit parent (a float,
 * width:max-content, an unsized absolute wrapper), percentages have
 * nothing to resolve against — size the slot or its wrapper explicitly
 * there. For a fixed-size slot, set
 * width/height on the element itself (inline style), which overrides the
 * default. When
 * layering content above a slot (full-bleed layouts), make the overlay
 * click-through — pointer-events: none on scrims/text plates, re-enabled
 * on interactive children — so the slot's hover controls stay reachable.
 * Keep the slot's bottom-left corner visually clear as well: the credit
 * overlay renders there, and a dark fade or text plate covering it hides
 * the attribution Unsplash's terms require — end the fade above that
 * corner, or keep it nearly transparent where the credit sits.
 *
 * Usage:
 *   <div style="position:relative;width:100%;height:100%">      <!-- full-bleed: -->
 *     <image-slot id="bg" shape="rect"></image-slot>            <!-- fills the wrapper -->
 *   </div>
 *   <image-slot id="hero"   style="width:800px;height:450px" shape="rounded" radius="20"
 *               placeholder="Drop a hero image"></image-slot>
 *   <image-slot id="avatar" style="width:120px;height:120px" shape="circle"></image-slot>
 *   <image-slot id="kite"   style="width:300px;height:300px"
 *               mask="polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"></image-slot>
 */
/* END USAGE */

(() => {
  const STATE_FILE = '.image-slots.state.json';

  // Unsplash terms require visible attribution wherever their photos
  // display, and every link back to unsplash.com must carry utm referral
  // params. Two render-time rules enforce that here:
  //  - an Unsplash-src slot with NO credit attribute renders an error
  //    tile INSTEAD of the photo (an uncredited Unsplash photo on screen
  //    is itself the terms violation, so it never renders bare);
  //  - rendered credit links pointing at unsplash.com get the referral
  //    params appended when absent (credit-href values live in page
  //    content that can't be edited after the fact).
  // Keep the utm_source value in sync with UTM_SOURCE in
  // platform/web-agent/unsplash.ts — this file is a project-local
  // artifact and cannot import it (equality is pinned by tests).
  const UNSPLASH_HOMEPAGE_HREF = 'https://unsplash.com/?utm_source=claude_design&utm_medium=referral';
  // Host rule mirrors the hotlink validator that admits Unsplash srcs into
  // pages in the first place (cdn$ in unsplash.ts: apex or any subdomain)
  // — Unsplash+ results serve from plus.unsplash.com, not just images.*,
  // and an admitted-but-uncredited photo must error whatever unsplash
  // host it rides on.
  // Trailing-dot FQDNs (images.unsplash.com.) are the same host to the
  // browser but would miss the regex — strip one dot so the check fails
  // CLOSED (unrecognized-but-real Unsplash srcs must error, not render).
  const isUnsplashHost = u => {
    try {
      return /(^|\.)unsplash\.com$/.test(new URL(u, document.baseURI).hostname.replace(/\.$/, ''));
    } catch {
      return false;
    }
  };
  // Render-time referral normalization for links back to Unsplash:
  // appends utm_source/utm_medium when absent, preserves every existing
  // query param, never overwrites an existing utm_source, and passes
  // non-Unsplash URLs through untouched. Input is an ABSOLUTE validated
  // http(s) URL (the credit render funnel resolves + validates first).
  const withReferral = href => {
    try {
      const u = new URL(href);
      if (!/(^|\.)unsplash\.com$/.test(u.hostname.replace(/\.$/, ''))) {
        return href;
      }
      if (!u.searchParams.has('utm_source')) {
        u.searchParams.set('utm_source', 'claude_design');
      }
      if (!u.searchParams.has('utm_medium')) {
        u.searchParams.set('utm_medium', 'referral');
      }
      return u.toString();
    } catch (e) {
      return href;
    }
  };
  // 2× a ~600px slot in a 1920-wide deck — retina-sharp without making the
  // sidecar enormous. A 1200px WebP at q=0.85 is ~150-300KB.
  const MAX_DIM = 1200;
  // Raster formats only. SVG is excluded (can carry script; createImageBitmap
  // on SVG blobs is inconsistent). GIF is excluded because the canvas
  // re-encode keeps only the first frame, so an animated GIF would silently
  // go still — better to reject than surprise.
  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

  // ── Shared sidecar store ────────────────────────────────────────────────
  // One fetch + immediate write-on-change for every <image-slot> on the
  // page. Reads via fetch() so viewing works anywhere the HTML and sidecar
  // are served together; writes go through window.omelette.writeFile, which
  // the host allowlists to *.state.json basenames only.
  const subs = new Set();
  let slots = {};
  // ids explicitly cleared before the sidecar fetch resolved — otherwise
  // the merge below can't tell "never set" from "just deleted" and would
  // resurrect the sidecar's stale value.
  const tombstones = new Set();
  let loaded = false;
  let loadP = null;
  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE).then(r => r.ok ? r.json() : null).then(j => {
      // Merge: sidecar loses to any in-memory change that raced ahead of
      // the fetch (drop or clear) so neither is clobbered by hydration.
      if (j && typeof j === 'object') {
        const merged = Object.assign({}, j, slots);
        // A framing-only write that raced ahead of hydration must not
        // drop a user image that's only on disk — inherit u from the
        // sidecar for any in-memory entry that lacks one.
        for (const k in slots) {
          if (merged[k] && !merged[k].u && j[k]) {
            merged[k].u = typeof j[k] === 'string' ? j[k] : j[k].u;
          }
        }
        for (const id of tombstones) delete merged[id];
        slots = merged;
      }
      tombstones.clear();
    }).catch(() => {}).then(() => {
      loaded = true;
      subs.forEach(fn => fn());
    });
    return loadP;
  }

  // Serialize writes so two near-simultaneous drops on different slots
  // can't reorder at the backend and leave the sidecar with only the
  // first. A save requested mid-flight just marks dirty and re-fires on
  // completion with the then-current slots.
  let saving = false;
  let saveDirty = false;
  // Unload-time flush: save()'s serialization defers a mid-RTT re-fire to a
  // .then that never runs in an unloading document, silently dropping a
  // pagehide commit. Post the current slots immediately instead — content
  // is a superset snapshot of any in-flight save's, the write is a
  // whole-file last-writer-wins replace, and postMessage FIFO delivers it
  // to the host after the in-flight one, so a backend-side reorder at
  // worst reproduces the dropped-commit outcome this flush improves on.
  // Guarded on the initial sidecar read: pre-hydration slots can miss
  // other slots' persisted entries, and flushing it would clobber them —
  // that narrow case stays best-effort (the in-memory merge in load()
  // cannot happen in an unloading document anyway).
  function flushNow() {
    if (!loaded) return;
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    try {
      Promise.resolve(w(STATE_FILE, JSON.stringify(slots))).catch(() => {});
    } catch (e) {}
  }
  function save() {
    if (saving) {
      saveDirty = true;
      return;
    }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots))).catch(() => {}).then(() => {
      saving = false;
      if (saveDirty) {
        saveDirty = false;
        save();
      }
    });
  }
  const S_MAX = 5;
  const clampS = s => Math.max(1, Math.min(S_MAX, s));

  // Normalize a stored slot value. Pre-reframe sidecars stored a bare
  // data-URL string; newer ones store {u, s, x, y}. Either shape is valid.
  function getSlot(id) {
    const v = slots[id];
    if (!v) return null;
    return typeof v === 'string' ? {
      u: v,
      s: 1,
      x: 0,
      y: 0
    } : v;
  }
  function setSlot(id, val) {
    if (!id) return;
    if (val) {
      slots[id] = val;
      tombstones.delete(id);
    } else {
      delete slots[id];
      if (!loaded) tombstones.add(id);
    }
    subs.forEach(fn => fn());
    // A drop is rare + high-value — write immediately so nav-away can't lose
    // it. Gate on the initial read so we don't overwrite a sidecar we haven't
    // merged yet; the merge in load() keeps this change once the read lands.
    if (loaded) save();else load().then(save);
  }

  // ── Image downscale ─────────────────────────────────────────────────────
  // Encode through a canvas so the sidecar carries resized bytes, not the
  // raw upload. Longest side is capped at 2× the slot's rendered width
  // (retina) and at MAX_DIM. WebP keeps alpha and is ~10× smaller than PNG
  // for photos, so there's no need for per-image format picking.
  async function toDataUrl(file, targetW) {
    const bitmap = await createImageBitmap(file);
    try {
      const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)) || MAX_DIM);
      const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL('image/webp', 0.85);
    } finally {
      bitmap.close && bitmap.close();
    }
  }

  // ── Custom element ──────────────────────────────────────────────────────
  const stylesheet =
  // Fill the container by default: slots are usually placed inside a
  // sized wrapper (a hero frame, a grid cell, an inset:0 layer) and are
  // expected to take that box — a fixed intrinsic size would render as
  // a small tile in the corner of a full-bleed wrapper instead.
  // aspect-ratio is the companion fallback that keeps a bare slot
  // visible when the parent's height is indefinite: height:100%
  // resolves to auto there, and the ratio then derives height from
  // width instead of letting the slot collapse to zero height.
  // Explicit width/height on the element override all of this.
  // color:inherit (not a fixed near-black): the placeholder chrome —
  // empty-state icon/caption (currentColor) and the dashed ring — must
  // read on dark decks too, and the slide's own text color is the one
  // color guaranteed to contrast with the slide background. The soft
  // look comes from opacity on those parts, not from a baked-in alpha.
  ':host{display:block;position:relative;' + '  font:13px/1.3 system-ui,-apple-system,sans-serif;' + '  width:100%;height:100%;aspect-ratio:3/2}' + '.empty .cap,.empty .sub{opacity:.75}' + '.frame{position:absolute;inset:0;overflow:hidden;background:rgba(127,127,127,.08)}' +
  // .frame img (clipped) and .spill (unclipped ghost + handles) share the
  // same left/top/width/height in frame-%, computed by _applyView(), so the
  // inside-mask crop and the outside-mask spill stay pixel-aligned.
  '.frame img{position:absolute;max-width:none;transform:translate(-50%,-50%);' + '  -webkit-user-drag:none;user-select:none;touch-action:none}' +
  // Reframe mode (double-click): the full image spills past the mask. The
  // spill layer is sized to the IMAGE bounds so its corners are where the
  // resize handles belong. The ghost <img> inside is translucent; the real
  // clipped <img> underneath shows the opaque in-mask crop.
  // popover=manual promotes the spill to the top layer on reframe, so it is
  // not clipped by any overflow:hidden / clip-path / scroll-container
  // ancestor (a plain z-index can't escape overflow clipping). UA popover
  // defaults (inset:0;margin:auto) are reset; _applyView sets viewport px.
  '.spill{position:fixed;margin:0;inset:auto;border:0;padding:0;background:transparent;' + '  overflow:visible;transform:translate(-50%,-50%);z-index:1;cursor:grab;touch-action:none}' + ':host([data-panning]) .spill{cursor:grabbing}' + '.spill .ghost{position:absolute;inset:0;width:100%;height:100%;opacity:.35;' + '  pointer-events:none;-webkit-user-drag:none;user-select:none;' + '  box-shadow:0 0 0 1px rgba(0,0,0,.2),0 12px 32px rgba(0,0,0,.2)}' + '.spill .handle{position:absolute;width:12px;height:12px;border-radius:50%;' + '  background:#fff;box-shadow:0 0 0 1.5px #c96442,0 1px 3px rgba(0,0,0,.3);' + '  transform:translate(-50%,-50%)}' + '.spill .handle[data-c=nw]{left:0;top:0;cursor:nwse-resize}' + '.spill .handle[data-c=ne]{left:100%;top:0;cursor:nesw-resize}' + '.spill .handle[data-c=sw]{left:0;top:100%;cursor:nesw-resize}' + '.spill .handle[data-c=se]{left:100%;top:100%;cursor:nwse-resize}' + ':host([data-reframe]){z-index:10}' + ':host([data-reframe]) .frame{box-shadow:0 0 0 2px #c96442}' + '.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' + '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' + '  cursor:pointer;user-select:none}' + '.empty svg{opacity:.45}' + '.empty .cap{max-width:90%;font-weight:500;letter-spacing:.01em}' + '.empty .sub{font-size:11px}' + '.empty .sub u{text-underline-offset:2px}' + '.empty:hover .sub{opacity:1}' + ':host([data-over]) .frame{outline:2px solid #c96442;outline-offset:-2px;' + '  background:rgba(201,100,66,.10)}' + '.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed currentColor;' + '  opacity:.35;transition:border-color .12s,opacity .12s}' + ':host([data-over]) .ring{border-color:#c96442;opacity:1}' + ':host([data-filled]) .ring{display:none}' +
  // Controls overlay INSIDE the frame, pinned to the top-right corner, so
  // a full-bleed slot in an overflow:hidden container still shows them
  // (the old below-mask placement got clipped). Credit sits bottom-left,
  // so top-right avoids collision. The blurred pill background keeps them
  // legible over the image.
  // The UA [popover] base rule styles the element in EVERY state (only
  // display:none is gated on :not(:popover-open), and the display:flex
  // below overrides that) — so the UA resets live HERE, like .spill's,
  // or the ordinary hover-state strip renders as a bordered Canvas box
  // centered by margin:auto. inset:auto precedes top/right (shorthand).
  '.ctl{position:absolute;inset:auto;top:8px;right:8px;margin:0;border:0;padding:0;' + '  background:transparent;overflow:visible;' + '  display:flex;gap:6px;opacity:0;pointer-events:none;transition:opacity .12s;z-index:2;' + '  white-space:nowrap}' +
  // While reframing, the spill owns the top layer and would swallow every
  // click on the in-frame controls. Promoting .ctl into the top layer
  // ABOVE the spill (shown after it — later popovers stack higher) keeps
  // Edit-as-toggle and Replace clickable mid-reframe. _applyView pins it
  // to the frame's top-right in viewport px (translateX(-100%)
  // right-aligns against the computed left edge); inset:auto clears the
  // base rule's top/right so the inline left/top position it alone.
  '.ctl:popover-open{position:fixed;inset:auto;transform:translateX(-100%)}' + ':host([data-filled][data-editable]:hover) .ctl,:host([data-reframe]) .ctl' + '  {opacity:1;pointer-events:auto}' + '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;' + '  background:rgba(0,0,0,.65);color:#fff;font:11px/1 system-ui,-apple-system,sans-serif;' + '  backdrop-filter:blur(6px)}' + '.ctl button:hover{background:rgba(0,0,0,.8)}' + '.err{position:absolute;left:8px;bottom:8px;right:8px;color:#b3261e;font-size:11px;' + '  background:rgba(255,255,255,.85);padding:4px 6px;border-radius:5px;pointer-events:none}' +
  // Replacement in flight: after a src swap the browser keeps painting
  // the PREVIOUS image until the new one decodes, so a Replace would
  // flash the old photo and then pop. Hide the stale frame (visibility,
  // not display — _applyView geometry still applies) and spin until the
  // new image reports in (load/error clears data-swapping).
  ':host([data-swapping]) .frame img{visibility:hidden}' + '.loading{position:absolute;inset:0;display:none;align-items:center;' + '  justify-content:center;pointer-events:none}' + ':host([data-swapping]) .loading{display:flex}' + '.loading::after{content:"";width:22px;height:22px;border-radius:50%;' + '  border:2px solid rgba(127,127,127,.25);border-top-color:currentColor;' + '  animation:om-slot-spin .7s linear infinite}' + '@keyframes om-slot-spin{to{transform:rotate(360deg)}}' +
  // Reduced motion: the static two-tone ring still reads as "working".
  '@media (prefers-reduced-motion:reduce){.loading::after{animation:none}}' + '.credit{position:absolute;left:6px;bottom:6px;max-width:calc(100% - 12px);display:none;' + '  padding:3px 7px;border-radius:5px;background:rgba(0,0,0,.55);color:#fff;' + '  font:10px/1.2 system-ui,-apple-system,sans-serif;text-decoration:none;' + '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;backdrop-filter:blur(6px)}' +
  // The credit is a SPAN holding one or two <a>s (Unsplash's prescribed
  // form links the photographer AND Unsplash) — anchors style inline so
  // the overlay reads as one line of text.
  '.credit a{color:inherit;text-decoration:none}' + '.credit a:hover,.credit a:focus-visible{text-decoration:underline}' + ':host([data-filled][data-credit]) .credit{display:block}' +
  // Exports must ship JUST the image — no hover controls, no credit chip
  // (the host marks <html data-om-exporting> for the capture window; the
  // page-level hide script can't reach shadow DOM, this rule can).
  ':host-context([data-om-exporting]) .ctl,' + ':host-context([data-om-exporting]) .credit{display:none !important}' +
  // Print must ship just the image too: the hover-gated controls can be
  // mid-hover when print() fires, and the credit chip is screen chrome —
  // the same rule the capture window gets, keyed on print media instead
  // of the host's data-om-exporting mark (the print path sets no mark).
  '@media print{.ctl,.credit{display:none !important}}' +
  // No export-window mask rules here on purpose: the export capture
  // releases the replacement mask by REMOVING data-swapping (the
  // shadow-root pass in pages/export/shared.ts HIDE_EXPORT_CHROME_SCRIPT)
  // — attribute removal works in every engine (:host-context is
  // Chromium-only), is scoped by construction to slots actually
  // mid-swap, and hides the spinner through the same gate. A masked img
  // would otherwise be silently dropped from PPTX decks (the capture
  // walk skips visibility:hidden imgs).
  // Attribution error tile: REPLACES the photo when an Unsplash src has
  // no credit attribute — rendering the photo uncredited is the terms
  // violation, so the photo must not appear at all.
  // Calm and neutral on purpose (review feedback): the tile informs the
  // user; the fix instructions are machine-facing (usage docblock, tool
  // description, and the turn-end scan's bounce copy name the attributes
  // for the agent).
  '.attr-error{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;' + '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' + '  background:#f2f1ef;color:#6e6c66;user-select:none;' + '  font:13px/1.45 system-ui,-apple-system,sans-serif}' + '.attr-error svg{opacity:.55}' + '.attr-error .cap{max-width:92%;font-weight:500;letter-spacing:.01em}' + ':host([data-attribution-error]) .attr-error{display:flex}' + ':host([data-attribution-error]) .ring{display:none}';
  const icon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' + 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' + '<path d="m21 15-5-5L5 21"/></svg>';
  const warnIcon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' + 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + '<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>' + '<path d="M12 9v4"/><path d="M12 17h.01"/></svg>';
  class ImageSlot extends HTMLElement {
    static get observedAttributes() {
      return ['shape', 'radius', 'mask', 'fit', 'placeholder', 'src', 'id', 'credit', 'credit-href'];
    }

    /** Duplicate-slide hook (called by deck-stage, see its
     *  _remintDuplicateIds): copy this id's stored image, if any, under a
     *  freshly minted key and return that key — so a duplicated slide's
     *  slot keeps its dropped photo instead of reverting to the
     *  placeholder. 'isFree' is the caller's uniqueness check (document
     *  ids); candidates must ALSO be unused in the sidecar, which can
     *  hold keys from other pages sharing the project root. (An EMPTY
     *  slot on another page leaves no sidecar entry, so its id is not
     *  detectable here — a minted key can collide with it and that slot
     *  would show this photo. Same blast radius as two pages reusing an
     *  id by hand, which the shared sidecar already permits.) Returns null
     *  when no id could be minted (caller strips the id, today's
     *  behavior). */
    static cloneSlot(fromId, isFree) {
      if (typeof fromId !== 'string' || !fromId) return null;
      // Pre-hydration the store can't veto candidates or source the copy
      // — degrade to the strip (today's behavior) rather than mint
      // against keys we can't see yet. Any rendered (= droppable) slot
      // means load() has already settled.
      if (!loaded) return null;
      const stem = fromId.replace(/-\d+$/, '') || fromId;
      for (let n = 2; n < 100; n++) {
        const toId = stem + '-' + n;
        if (toId === fromId) continue;
        if (slots[toId] !== undefined) {
          // Reuse a key holding this exact value (bytes AND crop) if no
          // live element here owns it — a duplicate op the host refused
          // after minting leaves such a key behind, and reusing keeps
          // refused retries from accumulating one orphaned copy per
          // attempt. Full equality (not just bytes) so a byte-identical
          // key another PAGE owns with its own crop is stepped past, not
          // adopted or rewritten. (Entries without .u never match.)
          const prev = getSlot(toId);
          const cur = getSlot(fromId);
          if (!(prev && cur && prev.u && prev.u === cur.u && prev.s === cur.s && prev.x === cur.x && prev.y === cur.y && (typeof isFree !== 'function' || isFree(toId)))) continue;
          return toId;
        }
        if (typeof isFree === 'function' && !isFree(toId)) continue;
        const v = getSlot(fromId);
        if (v) setSlot(toId, Object.assign({}, v));
        return toId;
      }
      return null;
    }
    constructor() {
      super();
      // clonable: rail thumbnails deep-clone slides and carry this shadow
      // along; reuse an already-cloned root so upgrade-after-clone works.
      // (Deliberately NOT serializable — a getHTML consumer would embed
      // multi-MB sidecar data-URLs into serialized page HTML.)
      const root = this.shadowRoot || this.attachShadow({
        mode: 'open',
        clonable: true
      });
      // .spill and .ctl sit OUTSIDE .frame so overflow:hidden + border-radius
      // on the frame (circle, pill, rounded) can't clip them.
      root.innerHTML = '<style>' + stylesheet + '</style>' + '<div class="frame" part="frame">' + '  <img part="image" alt="" draggable="false" style="display:none">' + '  <div class="empty" part="empty">' + icon + '    <div class="cap"></div>' + '    <div class="sub">or <u>browse files</u></div></div>' + '  <div class="attr-error" part="attribution-error">' + warnIcon + '    <div class="cap">This photo needs attribution</div></div>' + '  <div class="loading" part="loading"></div>' + '  <div class="ring" part="ring"></div>' + '</div>' +
      // Outside .frame, like .spill/.ctl — the frame's overflow:hidden +
      // border-radius/clip-path would cut the credit off on circle/pill/mask.
      // A SPAN, not an <a>: the prescribed Unsplash credit holds two links
      // (photographer + Unsplash), built per-render in _render().
      '<span class="credit" part="credit"></span>' + '<div class="spill" popover="manual" data-dc-edit-transparent>' + '  <img class="ghost" alt="" draggable="false">' + '  <div class="handle" data-c="nw"></div><div class="handle" data-c="ne"></div>' + '  <div class="handle" data-c="sw"></div><div class="handle" data-c="se"></div>' + '</div>' +
      // data-dc-edit-transparent: the DC editor's edit-mode picker lets
      // clicks through for chrome marked with it (EDIT_TRANSPARENT_SEL)
      // — without it, Replace/Edit clicks in Edit mode are swallowed by
      // element selection and the controls look dead.
      '<div class="ctl" popover="manual" data-dc-edit-transparent><button data-act="replace" title="Replace image">Replace</button>' + '  <button data-act="edit" title="Reframe image">Edit</button></div>' + '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._ring = root.querySelector('.ring');
      this._img = root.querySelector('.frame img');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._spill = root.querySelector('.spill');
      this._ctl = root.querySelector('.ctl');
      this._credit = root.querySelector('.credit');
      this._attrError = root.querySelector('.attr-error');
      // Credit clicks open the link, not browse/reframe.
      this._credit.addEventListener('click', e => e.stopPropagation());
      this._credit.addEventListener('dblclick', e => e.stopPropagation());
      this._ghost = root.querySelector('.ghost');
      this._err = null;
      this._input = root.querySelector('input');
      this._depth = 0;
      this._gen = 0;
      // Encode-in-flight marker (the owning _ingest generation): while set,
      // the same-src "nothing in flight" clear in _render must not fire —
      // the stored value still points at the OLD image until the encode
      // lands, so that clear would unmask the stale image mid-replace.
      this._swapGen = 0;
      // Render-owned swap in flight: set when _render assigns a new src,
      // cleared only by the img's own load/error (or the empty branch).
      // img.complete CANNOT stand in for this — setting src only QUEUES
      // the current-request swap (a microtask), so synchronously after an
      // assignment, complete still reports the OLD settled request. The
      // pick path does exactly that: the host sets src, credit, and
      // credit-href back-to-back in one task, and renders #2/#3 would
      // read the stale complete === true and drop the mask one render
      // after it was set.
      this._loadPending = false;
      // See _render's empty branch: a transient attribution-error wipe of a
      // showing image must make the follow-up render a replacement (spinner),
      // not a first fill (blank frame).
      this._hidShowing = false;
      this._view = {
        s: 1,
        x: 0,
        y: 0
      };
      this._subFn = () => this._render();
      // Shadow-DOM listeners live with the shadow DOM — bound once here so
      // disconnect/reconnect (e.g. React remount) doesn't stack handlers.
      this._empty.addEventListener('click', () => this._input.click());
      root.addEventListener('click', e => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (!act) return;
        // The hidden controls are opacity-0 but still tabbable — without
        // this gate a keyboard user could drive them on a read-only share
        // link (mirrors the dblclick handler's editable gate).
        if (!this.hasAttribute('data-editable')) return;
        if (act === 'replace') {
          this._exitReframe(true);
          // Host-owned picker (Unsplash modal; it also offers local import).
          this.dispatchEvent(new CustomEvent('image-slot:pick', {
            bubbles: true,
            composed: true,
            detail: {
              id: this.id || null
            }
          }));
        }
        if (act === 'edit') {
          if (!this._reframes()) return;
          if (this.hasAttribute('data-reframe')) this._exitReframe(true);else this._enterReframe();
        }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
      // naturalWidth/Height aren't known until load — re-apply so the cover
      // baseline is computed from real dimensions, not the 100%×100% fallback.
      // load/error also release the replacement-in-flight mask (via the
      // single discipline in _releaseMask): the swap is only revealed once
      // the new image can actually paint (on error the frame shows its
      // background, same as a fresh slot with a broken src).
      this._img.addEventListener('load', () => {
        this._loadPending = false;
        this._releaseMask(true);
        this._applyView();
      });
      this._img.addEventListener('error', () => {
        this._loadPending = false;
        this._releaseMask(true);
      });
      // Gated only on editable — any filled slot can be repositioned/scaled,
      // regardless of fit. Share links (no writeFile) stay static.
      this.addEventListener('dblclick', e => {
        if (!this.hasAttribute('data-editable') || !this._reframes()) return;
        e.preventDefault();
        if (this.hasAttribute('data-reframe')) this._exitReframe(true);else this._enterReframe();
      });
      // Pan + resize both originate on the spill layer. A handle pointerdown
      // drives an aspect-locked resize anchored at the opposite corner; any
      // other pointerdown on the spill pans. Offsets are frame-% so a
      // reframed slot survives responsive resize / PPTX export.
      this._spill.addEventListener('pointerdown', e => {
        if (e.button !== 0 || !this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        e.stopPropagation();
        this._spill.setPointerCapture(e.pointerId);
        const rect = this.getBoundingClientRect();
        const fw = rect.width || 1,
          fh = rect.height || 1;
        const corner = e.target.getAttribute && e.target.getAttribute('data-c');
        let move;
        if (corner) {
          // Resize about the OPPOSITE corner. Viewport-px throughout (rect
          // fw/fh, not clientWidth) so the math survives a transform:scale()
          // ancestor — deck_stage renders slides scaled-to-fit.
          const iw = this._img.naturalWidth || 1,
            ih = this._img.naturalHeight || 1;
          const contain = (this.getAttribute('fit') || 'cover').toLowerCase() === 'contain';
          const base = contain ? Math.min(fw / iw, fh / ih) : Math.max(fw / iw, fh / ih);
          const sx = corner.includes('e') ? 1 : -1;
          const sy = corner.includes('s') ? 1 : -1;
          const s0 = this._view.s;
          const w0 = iw * base * s0,
            h0 = ih * base * s0;
          const cx0 = (50 + this._view.x) / 100 * fw;
          const cy0 = (50 + this._view.y) / 100 * fh;
          const ox = cx0 - sx * w0 / 2,
            oy = cy0 - sy * h0 / 2;
          const diag0 = Math.hypot(w0, h0);
          const ux = sx * w0 / diag0,
            uy = sy * h0 / diag0;
          move = ev => {
            const proj = (ev.clientX - rect.left - ox) * ux + (ev.clientY - rect.top - oy) * uy;
            const s = clampS(s0 * proj / diag0);
            const d = diag0 * s / s0;
            this._view.s = s;
            this._view.x = (ox + ux * d / 2) / fw * 100 - 50;
            this._view.y = (oy + uy * d / 2) / fh * 100 - 50;
            this._clampView();
            this._applyView();
          };
        } else {
          this.setAttribute('data-panning', '');
          const start = {
            px: e.clientX,
            py: e.clientY,
            x: this._view.x,
            y: this._view.y
          };
          move = ev => {
            this._view.x = start.x + (ev.clientX - start.px) / fw * 100;
            this._view.y = start.y + (ev.clientY - start.py) / fh * 100;
            this._clampView();
            this._applyView();
          };
        }
        const up = () => {
          try {
            this._spill.releasePointerCapture(e.pointerId);
          } catch {}
          this._spill.removeEventListener('pointermove', move);
          this._spill.removeEventListener('pointerup', up);
          this._spill.removeEventListener('pointercancel', up);
          this.removeAttribute('data-panning');
          this._dragUp = null;
        };
        // Stashed so _exitReframe (Escape / outside-click mid-drag) can
        // tear the capture + listeners down synchronously.
        this._dragUp = up;
        this._spill.addEventListener('pointermove', move);
        this._spill.addEventListener('pointerup', up);
        this._spill.addEventListener('pointercancel', up);
      });
      // Wheel zoom stays available inside reframe mode as a trackpad nicety —
      // zooms toward the cursor (offset' = cursor·(1-k) + offset·k).
      this.addEventListener('wheel', e => {
        if (!this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        const r = this.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width * 100 - 50;
        const cy = (e.clientY - r.top) / r.height * 100 - 50;
        const prev = this._view.s;
        const next = clampS(prev * Math.pow(1.0015, -e.deltaY));
        if (next === prev) return;
        const k = next / prev;
        this._view.s = next;
        this._view.x = cx * (1 - k) + this._view.x * k;
        this._view.y = cy * (1 - k) + this._view.y * k;
        this._clampView();
        this._applyView();
      }, {
        passive: false
      });
    }
    connectedCallback() {
      // Warn once per page — an id-less slot works for the session but
      // cannot persist, and two id-less slots would share nothing.
      if (!this.id && !ImageSlot._warned) {
        ImageSlot._warned = true;
        console.warn('<image-slot> without an id will not persist its dropped image.');
      }
      this.addEventListener('dragenter', this);
      this.addEventListener('dragover', this);
      this.addEventListener('dragleave', this);
      this.addEventListener('drop', this);
      subs.add(this._subFn);
      // The host may inject window.omelette.writeFile AFTER the first render;
      // re-render on hover so the editable-gated controls reliably appear.
      this.addEventListener('pointerenter', this._subFn);
      // width%/height% in _applyView encode the frame aspect at call time —
      // a host resize (responsive grid, pane divider) would stretch the
      // image until the next _render. Re-render on size change: _render()
      // re-seeds _view from stored before clamp/apply, so a shrink→grow
      // cycle round-trips instead of ratcheting x/y toward the narrower
      // frame's clamp range.
      this._ro = new ResizeObserver(() => this._render());
      this._ro.observe(this);
      load();
      this._render();
    }
    disconnectedCallback() {
      subs.delete(this._subFn);
      this.removeEventListener('pointerenter', this._subFn);
      this.removeEventListener('dragenter', this);
      this.removeEventListener('dragover', this);
      this.removeEventListener('dragleave', this);
      this.removeEventListener('drop', this);
      if (this._ro) {
        this._ro.disconnect();
        this._ro = null;
      }
      // commit=false: a disconnect is not a user intent — committing here
      // would persist whatever half-finished drag a React remount or DOM
      // splice happened to interrupt. Deliberate exits commit on their own
      // paths (Escape/click-out/toggle), and unloads commit via pagehide.
      this._exitReframe(false);
    }
    _enterReframe() {
      if (this.hasAttribute('data-reframe')) return;
      this.setAttribute('data-reframe', '');
      this._signalReframe(true);
      // Best-effort commit when the document unloads mid-reframe (a host
      // navigation racing the enter signal, a manual reload, tab close):
      // the sidecar write rides the host bridge, which outlives this
      // document, so the crop survives even though the mode dies with the
      // DOM. Held on the instance so _exitReframe detaches exactly what
      // was attached.
      this._pagehide = () => {
        this._exitReframe(true);
        flushNow();
      };
      window.addEventListener('pagehide', this._pagehide);
      // Promote spill to the top layer, then keep it pinned over the frame:
      // scroll/resize cover the common cases, and a per-frame rect check
      // catches layout shifts that fire neither (an image above finishing
      // load, streamed DOM pushing the slot down, an ancestor transform
      // change) so the overlay can't detach from the frame.
      try {
        this._spill.showPopover();
      } catch {}
      // After the spill, so the controls stack above it in the top layer.
      try {
        this._ctl.showPopover();
      } catch {}
      this._reposition = () => {
        if (this.hasAttribute('data-reframe')) this._applyView();
      };
      window.addEventListener('scroll', this._reposition, true);
      window.addEventListener('resize', this._reposition);
      this._lastRect = '';
      this._watch = () => {
        if (!this.hasAttribute('data-reframe')) return;
        const r = this.getBoundingClientRect();
        const key = r.left + ',' + r.top + ',' + r.width + ',' + r.height;
        if (key !== this._lastRect) {
          this._lastRect = key;
          this._applyView();
        }
        this._watchId = requestAnimationFrame(this._watch);
      };
      this._watchId = requestAnimationFrame(this._watch);
      this._applyView();
      // Close on click outside (the spill handler stopPropagation()s so
      // in-image drags don't reach this) and on Escape. Listeners are held
      // on the instance so _exitReframe / disconnectedCallback can detach
      // exactly what was attached.
      this._outside = e => {
        if (e.composedPath && e.composedPath().includes(this)) return;
        this._exitReframe(true);
      };
      this._esc = e => {
        if (e.key === 'Escape') this._exitReframe(true);
      };
      document.addEventListener('pointerdown', this._outside, true);
      document.addEventListener('keydown', this._esc, true);
    }
    _exitReframe(commit) {
      if (!this.hasAttribute('data-reframe')) return;
      if (this._dragUp) this._dragUp();
      this.removeAttribute('data-reframe');
      this.removeAttribute('data-panning');
      if (this._outside) document.removeEventListener('pointerdown', this._outside, true);
      if (this._esc) document.removeEventListener('keydown', this._esc, true);
      this._outside = this._esc = null;
      if (this._reposition) {
        window.removeEventListener('scroll', this._reposition, true);
        window.removeEventListener('resize', this._reposition);
        this._reposition = null;
      }
      if (this._watchId) {
        cancelAnimationFrame(this._watchId);
        this._watchId = 0;
      }
      if (this._pagehide) {
        window.removeEventListener('pagehide', this._pagehide);
        this._pagehide = null;
      }
      try {
        this._spill.hidePopover();
      } catch {}
      try {
        this._ctl.hidePopover();
      } catch {}
      this._ctl.style.left = '';
      this._ctl.style.top = '';
      if (commit) this._commitView();
      this._signalReframe(false);
    }

    // Reframe state lives only in this DOM until commit, invisible to the
    // host's dirty signals — announce enter/exit so the host can hold
    // auto-reloads for exactly the gesture (the guest bundle forwards
    // image-slot:reframe to the host as imageSlotReframe). Dispatched on
    // the element (composed, so it escapes shadow roots) while connected;
    // a disconnected exit (disconnectedCallback) falls back to document so
    // the host still hears it.
    _signalReframe(active) {
      const target = this.isConnected ? this : document;
      target.dispatchEvent(new CustomEvent('image-slot:reframe', {
        bubbles: true,
        composed: true,
        detail: {
          active: active,
          id: this.id || null
        }
      }));
    }

    // Public: host's "Import from computer" calls this to run local browse.
    openFilePicker() {
      this._exitReframe(true);
      this._input.click();
    }

    // A src write is a newer intent for this slot's content — the host
    // pick path (setImageSlotImage) or an agent edit — so it must win
    // over any encode still in flight from an earlier drop: left live,
    // that encode lands later, passes _ingest's gen guard, and its
    // setSlot silently overwrites the pick (the stored value shadows
    // src in _render). Bumping _gen kills the encode before its own
    // _swapGen clear runs, so clear the dead claim here too — otherwise
    // _releaseMask (gated on !_swapGen) never fires and the pick's
    // spinner is stranded. src ONLY: the pick sets credit/credit-href
    // in the same task, and clearing _swapGen on those would let the
    // same-src branch unmask the old image mid-encode.
    attributeChangedCallback(name, oldVal, newVal) {
      if (name === 'src' && oldVal !== newVal) {
        this._gen++;
        this._swapGen = 0;
      }
      if (this.shadowRoot) this._render();
    }

    // handleEvent — one listener object for all four drag events keeps the
    // add/remove symmetric and the depth counter correct.
    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        // Without preventDefault the browser never fires 'drop'.
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        // dragenter/leave fire for every descendant crossing — count depth
        // so hovering the icon inside the empty state doesn't flicker.
        if (--this._depth <= 0) {
          this._depth = 0;
          this.removeAttribute('data-over');
        }
      } else if (e.type === 'drop') {
        e.preventDefault();
        e.stopPropagation();
        this._depth = 0;
        this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }
    async _ingest(file) {
      this._setError(null);
      if (!file || ACCEPT.indexOf(file.type) < 0) {
        this._setError('Drop a PNG, JPEG, WebP, or AVIF image.');
        return;
      }
      // toDataUrl can take hundreds of ms on a large photo. A Clear or a
      // newer drop during that window would be clobbered when this await
      // resumes — bump + capture a generation so stale encodes bail.
      const gen = ++this._gen;
      // Replacing a shown image: surface the swap through the encode too,
      // not just the decode — otherwise the old photo sits there with no
      // feedback while the canvas re-encode runs. An empty slot keeps its
      // placeholder (no spinner) until the encode lands, as before.
      // _swapGen guards the mask against re-renders DURING the encode
      // (pointerenter, ResizeObserver, another slot's store write): the
      // stored value still resolves to the old image there, so _render's
      // same-src clear would otherwise unmask it mid-replace.
      if (this.hasAttribute('data-filled')) {
        this.setAttribute('data-swapping', '');
        this._swapGen = gen;
      }
      try {
        const w = this.clientWidth || this.offsetWidth || MAX_DIM;
        const url = await toDataUrl(file, w);
        if (gen !== this._gen) return;
        // Only exit reframe once the new image is in hand — a rejected type
        // or decode failure leaves the in-progress crop untouched.
        this._exitReframe(false);
        // Clear BEFORE setSlot: its synchronous re-render must see no
        // pending encode, so a byte-identical re-upload (same data URL, no
        // load event coming) still clears the mask via the complete branch.
        this._swapGen = 0;
        const val = {
          u: url,
          s: 1,
          x: 0,
          y: 0
        };
        setSlot(this.id || '', val);
        // Keep a session-local copy for id-less slots so the drop still
        // shows, even though it cannot persist.
        if (!this.id) {
          this._local = val;
          this._render();
        }
      } catch (err) {
        if (gen !== this._gen) return;
        this._swapGen = 0;
        // Reveal the kept old image — unless another replacement (a
        // remote pick's src swap) is still in flight, in which case the
        // mask stays until THAT image settles (its load/error releases).
        this._releaseMask();
        this._setError('Could not read that image.');
        console.warn('<image-slot> ingest failed:', err);
      }
    }
    _setError(msg) {
      if (this._err) {
        this._err.remove();
        this._err = null;
      }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err';
      d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => {
        if (this._err === d) {
          d.remove();
          this._err = null;
        }
      }, 3000);
    }

    // Reframing (pan/resize) is available on any filled slot — the user can
    // always reposition/scale. `fit` only sets the initial baseline (see
    // _geom): contain starts fully-visible, cover starts frame-filling.
    _reframes() {
      return this.hasAttribute('data-filled');
    }

    // The single release discipline for the replacement-in-flight mask
    // (data-swapping). The mask comes off only when BOTH hold:
    //  - no encode is pending (_swapGen) — mid-encode the stored value
    //    still resolves to the old image, so any reveal paints it;
    //  - the frame img has settled on its current src — an unsettled src
    //    means some replacement is still in flight (e.g. a remote pick),
    //    whoever started it, and revealing would paint the previous
    //    frame. The load/error listeners pass settled=true (the event IS
    //    the settlement signal, per spec complete is true by then);
    //    other callers rely on the complete flag (covers loaded AND
    //    failed).
    // Every release path funnels through here EXCEPT _render's empty
    // branch (the img is being cleared — nothing will ever settle).
    _releaseMask(settled) {
      if (!this._swapGen && !this._loadPending && (settled || this._img.complete)) {
        this.removeAttribute('data-swapping');
      }
    }

    // Baseline geometry, shared by clamp/apply/resize. `base` is the scale at
    // view-scale s=1: cover = fill the frame (overflow on the looser axis),
    // contain = fit fully inside (letterboxed). Zooming a contain image past
    // s where it overflows naturally becomes a crop. Null until the img has
    // loaded (naturalWidth is 0 before that) or when the slot has no layout
    // box — ResizeObserver fires with a 0×0 rect under display:none, and
    // clamping against a degenerate 1×1 frame would silently pull the stored
    // pan toward zero.
    _geom() {
      const iw = this._img.naturalWidth,
        ih = this._img.naturalHeight;
      const fw = this.clientWidth,
        fh = this.clientHeight;
      if (!iw || !ih || !fw || !fh) return null;
      const contain = (this.getAttribute('fit') || 'cover').toLowerCase() === 'contain';
      const base = contain ? Math.min(fw / iw, fh / ih) : Math.max(fw / iw, fh / ih);
      return {
        iw,
        ih,
        fw,
        fh,
        base
      };
    }
    _clampView() {
      // Pan range on each axis is half the overflow past the frame edge.
      const g = this._geom();
      if (!g) return;
      const mx = Math.max(0, (g.iw * g.base * this._view.s / g.fw - 1) * 50);
      const my = Math.max(0, (g.ih * g.base * this._view.s / g.fh - 1) * 50);
      this._view.x = Math.max(-mx, Math.min(mx, this._view.x));
      this._view.y = Math.max(-my, Math.min(my, this._view.y));
    }
    _applyView() {
      const g = this._geom();
      // Top-layer controls: pin to the frame's top-right in viewport px
      // (the same 8px inset as the in-frame layout; unscaled — top-layer UI
      // reads as chrome, not page content). BEFORE the geometry branch:
      // placement needs only the frame rect, and a not-yet-loaded or broken
      // src must not leave the promoted strip floating unpositioned. Gated
      // on the popover actually being open: without the Popover API,
      // showPopover() threw (swallowed in _enterReframe), .ctl stays in
      // its in-frame absolute layout, and viewport-px coordinates would
      // shove it off-frame — and matches(':popover-open') itself throws
      // there (unknown pseudo-class), hence the try/catch.
      if (this.hasAttribute('data-reframe')) {
        let onTop = false;
        try {
          onTop = this._ctl.matches(':popover-open');
        } catch {}
        if (onTop) {
          const r = this.getBoundingClientRect();
          this._ctl.style.left = r.right - 8 + 'px';
          this._ctl.style.top = r.top + 8 + 'px';
        }
      }
      if (!g) {
        // Dimensions not known yet (before img load) — centered fit so there
        // is no flash of an unpositioned image before the geometry lands.
        const contain = (this.getAttribute('fit') || 'cover').toLowerCase() === 'contain';
        this._img.style.width = '100%';
        this._img.style.height = '100%';
        this._img.style.left = '50%';
        this._img.style.top = '50%';
        this._img.style.objectFit = contain ? 'contain' : 'cover';
        return;
      }
      // Baseline (cover-fill or contain-fit) × view scale. Width/height and
      // left/top are all frame-% — depends only on the frame aspect ratio, so
      // a responsive resize keeps the same crop. The spill layer mirrors the
      // same box so its corners = image corners.
      const k = g.base * this._view.s;
      const w = g.iw * k / g.fw * 100 + '%';
      const h = g.ih * k / g.fh * 100 + '%';
      const l = 50 + this._view.x + '%';
      const t = 50 + this._view.y + '%';
      this._img.style.width = w;
      this._img.style.height = h;
      this._img.style.left = l;
      this._img.style.top = t;
      this._img.style.objectFit = '';
      if (this.hasAttribute('data-reframe')) {
        // Top-layer spill: position in viewport px over the frame. The top
        // layer escapes ancestor transforms entirely, so EVERY term must be
        // in viewport units: getBoundingClientRect gives the frame's scaled
        // origin AND size, and the rect/layout ratio rescales the ghost —
        // sizing from layout px alone renders it 1/scale too large under a
        // scaled deck slide. Inner ghost + handles stay box-relative.
        const r = this.getBoundingClientRect();
        const sx = g.fw ? r.width / g.fw : 1;
        const sy = g.fh ? r.height / g.fh : 1;
        this._spill.style.width = g.iw * k * sx + 'px';
        this._spill.style.height = g.ih * k * sy + 'px';
        this._spill.style.left = r.left + (50 + this._view.x) / 100 * r.width + 'px';
        this._spill.style.top = r.top + (50 + this._view.y) / 100 * r.height + 'px';
      }
    }
    _commitView() {
      const v = {
        s: this._view.s,
        x: this._view.x,
        y: this._view.y
      };
      if (this._userUrl) v.u = this._userUrl;
      // Framing-only (no u) persists too so an author-src slot remembers its
      // crop; clearing the sidecar still falls through to src=.
      if (this.id) setSlot(this.id, v);else {
        this._local = v;
      }
    }
    _render() {
      // Shape / mask. Presets use border-radius so the dashed ring can
      // follow the rounded outline; clip-path is only applied for an
      // explicit `mask` (the ring is hidden there since a rectangle
      // dashed border chopped by an arbitrary polygon looks broken).
      const mask = this.getAttribute('mask');
      const shape = (this.getAttribute('shape') || 'rounded').toLowerCase();
      let radius = '';
      if (shape === 'circle') radius = '50%';else if (shape === 'pill') radius = '9999px';else if (shape === 'rounded') {
        const n = parseFloat(this.getAttribute('radius'));
        radius = (Number.isFinite(n) ? n : 12) + 'px';
      }
      this._frame.style.borderRadius = mask ? '' : radius;
      this._frame.style.clipPath = mask || '';
      this._ring.style.borderRadius = mask ? '' : radius;
      this._ring.style.display = mask ? 'none' : '';

      // Controls and reframe entry gate on this so share links stay read-only.
      const editable = !!(window.omelette && window.omelette.writeFile);
      this.toggleAttribute('data-editable', editable);
      this._sub.style.display = editable ? '' : 'none';

      // Content. The sidecar is also writable by the agent's write_file
      // tool, so its value isn't guaranteed canvas-originated — only accept
      // data:image/ URLs from it. The `src` attribute is author-controlled
      // (Claude wrote it into the HTML) so it passes through unchanged.
      let stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u && !/^data:image\//i.test(stored.u)) stored = null;
      const srcAttr = this.getAttribute('src') || '';
      this._userUrl = stored && stored.u || null;
      const url = this._userUrl || srcAttr;
      // Don't clobber an in-flight reframe with a store-triggered re-render.
      if (!this.hasAttribute('data-reframe')) {
        this._view = {
          s: stored && Number.isFinite(stored.s) ? clampS(stored.s) : 1,
          x: stored && Number.isFinite(stored.x) ? stored.x : 0,
          y: stored && Number.isFinite(stored.y) ? stored.y : 0
        };
      }
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop an image';
      // Toggle via style.display — the [hidden] attribute alone loses to
      // the display:flex / display:block rules in the stylesheet above.
      // An Unsplash src with no credit attribute must NOT render — showing
      // the photo uncredited is the Unsplash-terms violation itself. The
      // error tile replaces the photo until the credit is written. A
      // user-dropped image is the user's own content and always renders.
      // Trimmed: credit is agent/user-editable content, and a whitespace-
      // only value must count as missing — otherwise it would suppress the
      // error tile AND render an empty credit box (no text, no links),
      // exactly the unattributed state this gate exists to prevent.
      const credit = (this.getAttribute('credit') || '').trim();
      const attrError = !!(!credit && !this._userUrl && srcAttr && isUnsplashHost(srcAttr));
      this.toggleAttribute('data-attribution-error', attrError);
      if (url && !attrError) {
        const prev = this._img.getAttribute('src');
        if (prev !== url) {
          // Replacing an already-shown image: mark the swap BEFORE setting
          // src so the stale frame is never revealed (see the data-swapping
          // stylesheet rules). First fill (prev empty) keeps the existing
          // placeholder-until-load behavior — no spinner. _hidShowing
          // covers the pick path's transient attribution-error wipe: prev
          // is gone, but an image WAS showing, so this is a replacement.
          if (prev || this._hidShowing) this.setAttribute('data-swapping', '');
          // Mark the swap BEFORE assigning src: complete keeps reporting
          // the old settled request until the browser's
          // update-the-image-data microtask runs, so same-task re-renders
          // (the pick path's credit/credit-href setAttributes) need this
          // flag, not complete, to know a load is in flight.
          this._loadPending = true;
          this._img.src = url;
          this._ghost.src = url;
        } else {
          // Same-src re-render — release if settled, so an ingest-set
          // spinner can't stick after a byte-identical re-upload (same
          // data URL, no further load event ever fires).
          this._releaseMask();
        }
        this._hidShowing = false;
        this._img.style.display = 'block';
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
        this._clampView();
        this._applyView();
      } else {
        this.removeAttribute('data-swapping');
        // The src is being removed — no load/error will ever fire for it.
        this._loadPending = false;
        // A transient attribution-error wipe of a showing image happens on
        // the pick path: the host sets src one setAttribute before credit,
        // so render N hides the old image (attrError) and render N+1
        // restores a URL. Remember the wipe so that restore renders as a
        // replacement (spinner), not a first fill (blank frame).
        this._hidShowing = attrError && !!this._img.getAttribute('src');
        this._img.style.display = 'none';
        this._img.removeAttribute('src');
        this._ghost.removeAttribute('src');
        // The error tile owns the blocked-photo state; .empty stays for
        // the genuinely-empty slot.
        this._empty.style.display = attrError ? 'none' : 'flex';
        this.removeAttribute('data-filled');
      }

      // Credit belongs to the author src, so a user drop hides it.
      // textContent + the http(s)-only funnel keep external strings inert.
      const showCredit = !!(url && credit && !this._userUrl && !attrError);
      this._credit.textContent = '';
      if (showCredit) {
        // Validate once (resolved against the document, http(s) only),
        // then append the terms-required utm referral params to links
        // that point back at unsplash.com.
        let href = '';
        const rawHref = this.getAttribute('credit-href') || '';
        if (rawHref) {
          try {
            const u = new URL(rawHref, document.baseURI);
            if (u.protocol === 'http:' || u.protocol === 'https:') {
              href = withReferral(u.href);
            }
          } catch {}
        }
        const mkLink = (text, linkHref) => {
          const a = document.createElement('a');
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
          a.setAttribute('href', linkHref);
          a.textContent = text;
          return a;
        };
        // Unsplash's prescribed credit is TWO links — the photographer's
        // name to their profile (credit-href) and 'Unsplash' to the
        // homepage. Render that split whenever the text has the canonical
        // shape; other text keeps the legacy single-link rendering.
        const m = /^Photo by (.+) on Unsplash$/.exec(credit);
        if (m) {
          this._credit.appendChild(document.createTextNode('Photo by '));
          this._credit.appendChild(href ? mkLink(m[1], href) : document.createTextNode(m[1]));
          this._credit.appendChild(document.createTextNode(' on '));
          this._credit.appendChild(mkLink('Unsplash', UNSPLASH_HOMEPAGE_HREF));
        } else if (href) {
          this._credit.appendChild(mkLink(credit, href));
        } else {
          this._credit.textContent = credit;
        }
      }
      this.toggleAttribute('data-credit', showCredit);
    }
  }
  if (!customElements.get('image-slot')) {
    customElements.define('image-slot', ImageSlot);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/image-slot.js", error: String((e && e.message) || e) }); }

__ds_ns.BookingCard = __ds_scope.BookingCard;

__ds_ns.FilmStrip = __ds_scope.FilmStrip;

__ds_ns.MediaFrame = __ds_scope.MediaFrame;

__ds_ns.StickerBadge = __ds_scope.StickerBadge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.AvatarStack = __ds_scope.AvatarStack;

__ds_ns.Headline = __ds_scope.Headline;

__ds_ns.IndexBadge = __ds_scope.IndexBadge;

__ds_ns.PullQuote = __ds_scope.PullQuote;

__ds_ns.Rating = __ds_scope.Rating;

__ds_ns.SectionLabel = __ds_scope.SectionLabel;

__ds_ns.StatDisc = __ds_scope.StatDisc;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.Reveal = __ds_scope.Reveal;

__ds_ns.ScrambleText = __ds_scope.ScrambleText;

__ds_ns.TrackingReveal = __ds_scope.TrackingReveal;

__ds_ns.ArrowPair = __ds_scope.ArrowPair;

__ds_ns.NavBar = __ds_scope.NavBar;

__ds_ns.SlideIndex = __ds_scope.SlideIndex;

})();
