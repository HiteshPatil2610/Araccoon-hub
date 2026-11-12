// Theme switch "ink bleed": the new theme spreads from the toggle like ink dropped in water, with a
// ragged, marbled edge, stray islands and holes. It is an animated SVG used as the CSS mask of the
// View Transition's new snapshot. A soft radial gradient grows from the toggle; fractal noise is added
// to it and the sum is cut at a threshold, so the edge comes out fractal instead of round. A little
// displacement bends the gradient into lobes first. The SVG animates itself (SMIL): no script per frame.

/** Length of the reveal in milliseconds (the View Transition is held open this long). */
export const INK_DURATION = 1300;

// The SVG's own clock finishes early, at this share of INK_DURATION, and then holds a fully covered
// frame. Its animation runs on the image's clock, which can start a little after the transition's, so
// the slack keeps the transition from ending (and snapping) before the ink has finished.
const INK_FINISH = 0.95;

// The mask is drawn at a fraction of the screen size and stretched to fit: the ink edge is soft by
// nature, and a smaller filter area keeps the noise affordable on large screens.
const SCALE = 0.45;

// Visible where 0.7 * gradient + 0.6 * noise + offset clears the threshold (see the filter). The
// growing gradient carries the spread; on its own it leaves stubborn patches wherever the noise is low,
// so in the last part the offset rises and floods every remaining gap quickly and evenly.
const REACH_FACTOR = 2.64;

/**
 * A data URL for the mask SVG. `x`/`y` is where the ink starts (the toggle's centre) in CSS pixels;
 * `seed` changes the ink pattern so no two switches look the same.
 */
export function inkMaskUrl(x: number, y: number, width: number, height: number, seed: number): string {
  return `url("data:image/svg+xml,${encodeURIComponent(inkSvg(x, y, width, height, seed))}")`;
}

/** The mask SVG itself (black = new theme shown). Exported for inspection and tests. */
export function inkSvg(x: number, y: number, width: number, height: number, seed: number): string {
  const w = Math.max(1, Math.round(width * SCALE));
  const h = Math.max(1, Math.round(height * SCALE));
  const cx = (x * SCALE).toFixed(1);
  const cy = (y * SCALE).toFixed(1);
  const size = Math.max(w, h);
  const corner = Math.hypot(Math.max(x * SCALE, w - x * SCALE), Math.max(y * SCALE, h - y * SCALE));
  const reach = Math.ceil(corner * REACH_FACTOR);
  const frequency = (3.2 / size).toFixed(5);
  const bend = Math.round(size * 0.08);
  // Draw past every edge: the displacement pulls pixels in from up to `bend` away, and empty space there
  // would otherwise leave a thin uncovered strip along the sides of the screen.
  const pad = bend * 2;
  const dur = `${Math.round(INK_DURATION * INK_FINISH)}ms`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
    + '<defs>'
    + `<radialGradient id="g" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="1">`
    + '<stop offset="0" stop-color="#000" stop-opacity="1"/><stop offset="1" stop-color="#000" stop-opacity="0"/>'
    // A steady spread that eases off as the flood below takes over.
    + `<animate attributeName="r" from="1" to="${reach}" dur="${dur}" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".3 .1 .6 1"/>`
    + '</radialGradient>'
    + `<filter id="ink" filterUnits="userSpaceOnUse" x="${-pad}" y="${-pad}" width="${w + 2 * pad}" height="${h + 2 * pad}" color-interpolation-filters="sRGB">`
    + `<feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="5" seed="${seed}" result="noise"/>`
    + `<feDisplacementMap in="SourceGraphic" in2="noise" scale="${bend}" xChannelSelector="R" yChannelSelector="G" result="bent"/>`
    // Noise red channel becomes alpha, then: alpha = 0.7 * gradient + 0.6 * noise - 0.3 ...
    + '<feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0" result="noiseAlpha"/>'
    + '<feComposite in="bent" in2="noiseAlpha" operator="arithmetic" k1="0" k2="0.7" k3="0.6" k4="-0.3" result="sum">'
    // The flood: from 75% of the way the offset climbs, accelerating, until even an empty, noiseless
    // pixel clears the threshold (0.6 > 0.46). Measured coverage over the timeline (three seeds, 1440x900):
    // 15% -> 3%, 45% -> ~42%, 75% -> ~85%, 85% -> ~99%, 92% -> 100%, so the last gaps close quickly at the end.
    + `<animate attributeName="k4" values="-0.3;-0.3;0.6" keyTimes="0;.75;1" dur="${dur}" fill="freeze" calcMode="spline" keySplines="0 0 1 1;.6 0 .95 .5"/>`
    + '</feComposite>'
    // ... cut steeply around 0.43, keeping a hair of softness so the edge is anti-aliased.
    + '<feComponentTransfer in="sum"><feFuncR type="linear" slope="0"/><feFuncG type="linear" slope="0"/><feFuncB type="linear" slope="0"/>'
    + '<feFuncA type="linear" slope="30" intercept="-13.4"/></feComponentTransfer>'
    + '</filter>'
    + '</defs>'
    + `<rect x="${-pad}" y="${-pad}" width="${w + 2 * pad}" height="${h + 2 * pad}" fill="url(#g)" filter="url(#ink)"/>`
    // Safety net for the final frame only: the flood has already covered everything by then.
    + `<rect width="${w}" height="${h}" fill="#000" opacity="0">`
    + `<set attributeName="opacity" to="1" begin="${dur}" fill="freeze"/>`
    + '</rect>'
    + '</svg>';
}
