# Cine Daily — feature site UI kit
Recreation of the single film-feature page seen in the source video (Deadpool III concept). One long scroll, four screens:
1. **Hero** (dark) — fixed nav, genre tags, cast row, mega title over red disc, film strip, cut-out key art, Book Now.
2. **Production** (dark) — red film strip, studio block, 3 stat discs, pull-quote, social dots; rounded bottom with pink edge.
3. **Story** (light) — "Directed by", slide pager + headline carousel (ArrowPair), blurbs, chamfered stills, BookingCard.
4. **In theaters** (light) — light nav, centered title, date flanks, cut-out.

Motion: every element enters via `Reveal` / `TrackingReveal` / `ScrambleText` with delays from `CUE` in Shared.jsx; entrances replay when a section re-enters the viewport. Fixed nav cross-fades dark↔light per section; hero film strip turns red + tilts on first scroll; Production (dark, rounded, pink edge) overlaps Story as a curtain.

Interactions: nav items scroll to sections; genre tags toggle; Book Now → Story; arrows/pager cycle headlines; BookingCard → "Seat booked".
Imagery is left as `<image-slot>` placeholders — the source's character art is third-party IP. Drop your own transparent PNG cut-outs.
Files: `Shared.jsx` (film data, Viewfinder, Blurb), `Hero.jsx`, `Production.jsx`, `Story.jsx`, `InTheaters.jsx`.
