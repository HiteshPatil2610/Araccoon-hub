# Hero entrance implementation — 6 October 2026

Applies the observed overlap and visual vocabulary from [frames 006–037](animation-analysis-006-037.md) to the Raccoon Hub hero. The JPEGs do not establish durations, so the timings below are chosen for this project.

## Shared cue sheet

Times are relative to the common start signal. Before it starts, fonts and hero art are allowed to load for up to 1200ms. Two animation frames establish the initial hidden state. Failed or slow assets do not block the entrance indefinitely.

| Element | Starts | Behavior / duration |
|---|---:|---|
| RACCOON | 60ms, then 100ms per letter | Fixed letter slots; each glyph widens from 10% to full width over 1800ms and fades over 1500ms. Last letter completes at 2460ms. |
| Raccoon image | 180ms | Scale 0.72 → 1 and 6% vertical rise over 2000ms, with a 1700ms full-image fade; bottom-center anchor. Desktop placement spans the stage and lower hero area, in front of the title and strap, clipped at the hero bottom. |
| Red circle | 320ms | Scale and opacity, 1800ms / 1500ms. Centering remains on a separate wrapper. Retains the previously requested chest-level origin. |
| Four captions | 320 / 400 / 480 / 560ms | 48ms character stagger; narrowed letters settle from a small right offset over 1300ms with a 1050ms fade. |
| HUB | 360ms | 100ms character stagger; same supporting-text reveal. |
| Header | 450ms | 1400ms downward arrival of individual logo/navigation/utility controls. Keyboard focus or scrolling completes it immediately; it does not replay on blur or section changes. |
| Strap and year | 680ms | Full-width strap and year fade over 1000ms. Strap motifs start their existing rightward motion during the fade. |
| Categories and catalog count | 450ms | Entire metadata row uses the navbar's 1400ms downward/fade entrance. Labels are ordinary whole text, with no character stagger. Responsive travel distance uses the current navigation height; hover underlines remain. Count updates do not restart the row animation. |
| Story copy | 1150ms | 18px rise and fade over 900ms. |
| Browse CTA | 1250ms | 12px rise, modest growth, and fade over 1000ms. Keyboard focus shows it immediately. |
| New badge | 1370ms | 12px rise, growth, and fade over 950ms; fixed graphic tilt. |
| Recurring title wave | 2900ms, then 120ms per letter | Existing lift/stretch/settle animation retained, beginning after the entrance and pausing offscreen. |

## Deliberate project adaptations

- The strap still scrolls **right**, preserving the requested direction. Following the latest image-placement request, at widths ≥1200px the mascot is now **in front** of the strap, extending to the hero bottom as in the reference. Its flat edge is clipped at that boundary. On narrower screens, the image remains inside the poster stage in front of the strap, with copy and actions below to prevent overlap.
- The circle retains the user's chest-origin expansion. The reference frames establish growth/fade but do not prove its exact origin.
- The recurring kinetic wave is retained as requested; the analyzed frames only establish the initial title reveal.
- Desktop story copy occupies the left side of the mascot, with actions on the right; a separate composition wrapper anchors the image independently of either text block. Natural image proportions are preserved. Category actions, catalog loading, quick view, and other section entrances remain in place. Hero cues use one context; other section reveals still use their visibility observers.

## Motion and interaction handling

Reduced-motion preferences resolve all hero layers immediately, remove entrance delays, and disable the recurring wave and marquee. Changes to the preference while the page is open are handled reactively. Header controls are animated individually so the fixed mobile-menu panel never inherits their entrance transform. Header focus, category focus, and CTA focus make controls visible immediately.

## Verification

Passed: production TypeScript/client/Worker build; initial render checks for the shared hidden navigation/title/text/circle/strip/mascot state and accessible labels; navbar outside the entrance context remains unaffected; timing check confirms the recurring wave begins after the last title letter finishes. Port 3010 returns the updated animation modules and hero WebP successfully. Reduced-motion and focus handling were reviewed in source. Browser playback and viewport screenshots were unavailable in this session, so visual fidelity is not claimed as browser-verified.

## Image-placement refinement

The stage height is shared through a CSS variable. The desktop image begins near the title's upper glyph edge (18% of stage height, 24% on wide screens), and extends across the strip to 6px below the hero boundary. Only its inner artwork scales/translates; the outer positioning and crop remain stationary. This replaces the old generic 76% growth/32px rise and stage-only crop. The wider raccoon silhouette requires its own responsive size rather than copying Deadpool's aspect ratio. The entrance remains tied to the shared asset-ready clock and does not restart with catalog updates.

Verification for this refinement: production build/typecheck passed. Initial-render checks passed for the composition anchor, hidden shared entrance, eager hero image, preserved title/categories/actions, and visible fallback outside the entrance context. Port 3010 returned HTTP 200 for the page, updated layout/motion modules, stylesheet, and image; response contents confirmed the new composition and motion styles. Reduced-motion final-state overrides were reviewed in source. Browser playback and viewport screenshots remain unavailable; final visual matching is not browser-verified.

## Permanent foreground correction

The hero mascot now has a static z-index of 10 at every breakpoint, above the stage and hero foot. The stage forms its own background stacking context, so title/strip animation transforms cannot escape above the mascot. Its inner art stays fully opaque: a 650ms bottom-to-top clip reveal replaces the long fade that let the title show through. Scale/rise and the shared 180ms start remain. Reduced motion removes the clip immediately; pointer-events remain disabled on the decorative cutout. This supersedes the previous mobile foreground-strap adaptation and the image fade.

## Reference image entrance restored

The bottom-to-top clip reveal was removed following feedback that it did not match the analyzed image entrance. The entire raccoon now starts hidden at 72% scale and 6% below its final position, then grows/rises over 2000ms and fades over 1700ms, beginning at the shared 180ms cue. Transitions are enabled on the shown state so mounting establishes a clean hidden pose without animating toward it. The permanent foreground z-index of 10 and isolated background stage are retained at every breakpoint. No z-index or depth animation occurs. This supersedes the opaque reveal in the preceding correction; reduced motion still resolves immediately to the final image.
