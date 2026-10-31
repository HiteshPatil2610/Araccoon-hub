/** Keep the poster's vertical weight tied to its stage, while its width fits the screen. */
export function heroPosterScale(stageHeight: number, glyphHeight: number) {
  if (!Number.isFinite(stageHeight) || !Number.isFinite(glyphHeight) || stageHeight <= 0 || glyphHeight <= 0) return 1;
  return Math.max(.5, Math.min(1.85, stageHeight * .62 / glyphHeight));
}
