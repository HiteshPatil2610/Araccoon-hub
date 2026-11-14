/** One cue sheet for the home hero entrance ("night reveal"). Every value is milliseconds from the shared start signal.
    Order: eyes alone, crimson dot drops behind the unseen silhouette and lands, dot grows into the disc, mascot fills with colour,
    title, supporting details, navigation and film strip, then the description and actions. */
export const HERO_CUES = {
  // The eyes are already lit before the clock starts; they blink once while alone.
  blink: 150,
  dot: 350, dotDrop: 650, dotSettle: 150,
  disc: 1150, discGrow: 1300,
  // A soft light travels with the dot and outlines the silhouette from behind; the growing disc takes over from it.
  glowOut: 1350,
  // The silhouette is in place before the dot arrives, so the dot passes behind the mascot.
  mascot: 100, colour: 1550, colourFill: 900, eyesOut: 1750,
  // The black opening lifts to the theme's own hero background as the title begins.
  lights: 1750,
  title: 1750, letterStep: 90,
  hub: 2150, captions: 2450, year: 2550,
  nav: 2750, strip: 2750,
  story: 3100, cta: 3250, badge: 3400,
  wave: 4400, waveStep: 120, waveAnchor: 3,
} as const;
