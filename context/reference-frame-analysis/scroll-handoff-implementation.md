# Hero scroll effect

The former Picks and Story storefront sections have been removed. The hero now hands directly to the catalog; the hero's own scroll layering remains.

- The desktop hero occupies at least one viewport vertically. The category row, hero footer, title and background move at 43% of the foreground mascot's scroll speed, approximating the measured 481/207 displacement ratio. The mascot remains anchored to the bottom of the stage, with responsive top placement and a short bottom mask.
- The hero disc and glow stay centered behind the mascot. The HUB word follows the central C (fourth character, index 3), sharing its 5.6-second loop, delay, peak timing and visibility state. Travel scales with the measured C height but is capped at 12px upward and 5px downward.
- A passive, frame-coalesced listener updates CSS variables without rerendering the catalog. Resize observation refreshes artwork placement. Reverse scrolling restores the same positions.
- Reduced motion disables the scroll lag and kinetic animation.
