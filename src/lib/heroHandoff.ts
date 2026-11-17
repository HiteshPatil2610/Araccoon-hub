const clamp = (value: number, max = 1) => Math.max(0, Math.min(max, value));

export interface HandoffGeometry {
  heroTop: number;
  heroHeight: number;
  reducedMotion: boolean;
}

/** The foreground character follows the page while the rest of the hero moves more slowly. */
export function heroHandoff({ heroTop, heroHeight, reducedMotion }: HandoffGeometry) {
  const scroll = clamp(-heroTop, heroHeight);
  if (reducedMotion) return { lag: 0 };
  // Preserve the foreground/background speed relationship at every breakpoint.
  const lagRatio = .57;
  return { lag: scroll * lagRatio };
}
