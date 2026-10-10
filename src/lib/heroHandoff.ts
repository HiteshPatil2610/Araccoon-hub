const clamp = (value: number, max = 1) => Math.max(0, Math.min(max, value));

export interface HandoffGeometry {
  heroTop: number;
  heroHeight: number;
  picksTop: number;
  boxTop: number;
  viewportHeight: number;
  viewportWidth: number;
  reducedMotion: boolean;
}

/** The character follows the page; these offsets slow the surrounding hero down. */
export function heroHandoff({ heroTop, heroHeight, picksTop, boxTop, viewportHeight, reducedMotion }: HandoffGeometry) {
  const scroll = clamp(-heroTop, heroHeight);
  if (reducedMotion) return { lag: 0, picks: 1, box: 1, divider: scroll > 0 ? 1 : 0 };
  const height = Math.max(1, viewportHeight);
  // Preserve the foreground/background speed relationship at every breakpoint.
  const lagRatio = .57;
  return {
    lag: scroll * lagRatio,
    divider: clamp(scroll / 56),
    picks: clamp((height - picksTop - 24) / (height * .35)),
    box: clamp((height - boxTop) / Math.min(200, height * .28)),
  };
}
