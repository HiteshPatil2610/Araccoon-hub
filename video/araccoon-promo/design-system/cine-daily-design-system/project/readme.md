# Cine Daily Design System

**Cine Daily** is a cinematic film-news / editorial web concept: long-scroll feature pages for a single film (release date, cast, production facts, booking). The only product surface is the **marketing/feature website** (desktop, ~1280–1440px).

## Sources
- `uploads/From Klickpin.com- Bookmark these creative honeymoon plan ideas ….mp4` — a 9s, 720×1171 screen-recording of a "CINE✚DAILY" Deadpool III concept site scrolling from dark hero → production → light "Directed by" story → "In theaters". No codebase, Figma, or font files were provided; every value here is measured by eye from video frames (`scraps/f0–f9.png`).

## Index
- `styles.css` — entry; imports `tokens/*.css`
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `effects.css`, `motion.css`
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand)
- `components/` — React primitives (see below), one card per folder
- `ui_kits/website/` — feature-page recreation (`index.html` + JSX screens)
- `assets/` — `logo-cinedaily-dark-ref.png`, `logo-cinedaily-light-ref.png` (low-res crops from the video; reference only)
- `thumbnail.html`, `SKILL.md`

## Components
- **core/** — Icon, Button, IconButton, Tag
- **editorial/** — Wordmark, Headline, SectionLabel, StatDisc, PullQuote, IndexBadge, Rating, AvatarStack
- **navigation/** — NavBar, SlideIndex, ArrowPair
- **cards/** — BookingCard, MediaFrame, FilmStrip, StickerBadge
- **motion/** — Reveal, TrackingReveal, ScrambleText

No source component library existed, so this set is derived from every distinct element visible in the video.
**Intentional additions:** Reveal / TrackingReveal / ScrambleText (codify the video's motion as reusable wrappers); Icon (Lucide wrapper — source icon set unknown); Wordmark (plain-type stand-in for the logo).

## CONTENT FUNDAMENTALS
- **Voice:** fan-magazine editorial — punchy, factual, a little breathless. Headlines end in "!" sparingly: "RELEASE DATE, CAST, AND EVERYTHING ABOUT THE FILM!"
- **Casing:** ALL CAPS for every headline, name, number and nav item. Body blurbs are sentence case.
- **Structure tics:** blurbs are numbered "PART A . / PART B . / PART C ." with a gap before the text; eyebrow labels end with a trailing " ." ("RELEASE DATE .", "X-MEN ."). Indices zero-padded (01, 02, "GALLERY 07/32"). Brackets frame meta: "[2024]", "RELEASE [MAY 3, 2024]".
- **Person:** third person, no "I/we"; CTAs are imperative and short: "BOOK NOW", "Book Now →".
- **Content:** names, dates, runtimes, formats as hero data ("TRAILER 1:47"", "IMAX 6", "MAY 3"). Quotes are paraphrased news ("Hugh Jackman said he really was done playing…").
- **Emoji:** never. Unicode used: ★ ratings, “ quote mark, · separators.

## VISUAL FOUNDATIONS
- **Color:** three-note palette — near-black `#0A0A0A`, white, and one crimson `#C8202F`. Greys only for muted second lines and card tiles (`#2A2A2A`, `#1C1C1C`). A hot-pink edge (`#E2457E`) appears only on the dark→light section seam. Pages sit in a rounded frame on a warm grey desk `#CEC7C4` in presentation shots.
- **Type:** condensed grotesque display (Bebas Neue sub) at enormous sizes — the film title spans the full width (~300px) with line-height ~.8. Secondary: small geometric sans (Archivo sub), 11px uppercase with very wide tracking (.32–.42em) for nav/eyebrows; 11–12px regular for blurbs. Huge/tiny contrast is the core motif.
- **Layout:** symmetric, centre-axis compositions. A hairline crosshair + large faint circle ("viewfinder") sits behind every section; the subject cut-out stands on the centre line, overlapping the title. Content hugs the corners: label + blurb bottom-left, CTA + sticker bottom-right, numbers 01–04 spread to the edges. Gutter ~56px; nav ~96px tall, **fixed** and transparent — it cross-fades white↔black as dark/light sections pass under it.
- **Backgrounds:** flat black or flat white — no gradients except the film strip and red sticker. Imagery is **transparent cut-out key art** (people/objects) layered over type and a solid red disc; film stills are red/black graded, often warm-dark.
- **Motifs:** red disc behind subject; tilted perforated film-strip band (dark in hero, red in production); circular stat discs; round tilted sticker; chamfered (clipped-corner) stills that interlock.
- **Corners:** pills and circles everywhere (buttons, tags, icon buttons, discs). Cards 22px radius, inner tiles 16px, page frame 18px, stills ~4px or chamfered.
- **Cards:** BookingCard is the only card — `#2A2A2A`, 22px radius, soft deep shadow, no border, red notch medallion on top edge, red bar CTA.
- **Borders:** 1–1.5px hairlines — white on dark (outline pills/icons), black on light. Section dividers 1px rgba(0,0,0,.08).
- **Shadows:** minimal; soft long drop for the card and cut-outs only. No inner shadows.
- **Transparency/blur:** very little — muted social dots, highlight capsule in quotes; a soft blur on off-screen corner discs during transitions. No glassmorphism.
- **Motion:** see MOTION below.
- **Hover:** outline pills invert fill (white→black text); red → lighter red; icon circles get a faint fill. **Press:** slight scale (.97) / darker red.
- **Imagery vibe:** high-contrast, saturated red + black, warm; no grain, no B&W except avatar portraits (greyscale).

## MOTION
Slow, cinematic, scroll-driven. Every section choreographs its entrance; nothing loops except the sticker.
- **Tokens** (`tokens/motion.css` + `effects.css`): `--ease-cine` (.7,0,.2,1) for all moves; `--ease-pop` (.34,1.45,.55,1) — slight overshoot — only for discs, stickers, the nav diamond; `--ease-curtain` for section hand-offs. Durations 700–1500ms; stagger `--stagger-step` 120ms.
- **Tracking collapse** (signature): titles and names start widely tracked (~.3–.5em) and faded to ~25–30%, then collapse to tight Bebas spacing while brightening — `TrackingReveal`. Used on the hero title, cast names, "DIRECTED BY SHAWN LEVY", "DEADPOOL III".
- **Scramble decode**: dates/numbers resolve from random glyphs ("PEC 4 → MAY 3", "5479 → 2024") — `ScrambleText`.
- **Entrances** (`Reveal`): rise (cut-outs 120–140px, blurbs 24–30px), pop (red disc, stat discs staggered 120ms), spin (sticker), blur-in (carousel headlines on slide change), mask wipe (pull-quote), wipe-x (film strip, hairline dividers), slide-left/right (side columns, chamfered stills from their edges).
- **Hero cue sheet (ms):** nav 0 · cast 0–240 · title 100 · disc 150 · meta 200 · III 250 · strip 400 · cut-out 450 · year 700 · story label 800 · Book now 900 · sticker 1000. Others in `ui_kits/website/Shared.jsx › CUE`.
- **Section transitions:** on first scroll the hero film strip turns dark→red and tilts further (−1° → −2.4°). Production is a dark "curtain" with rounded bottom corners and a 3px pink seam that overlaps the light Story section (`--curtain-overlap` 48px) and scrolls away to reveal it. Fixed nav cross-fades tone (320ms).
- **Replay:** entrances replay when a section re-enters the viewport. `prefers-reduced-motion` renders final states.
- **Hover/press** stay quick (160ms): pill inverts, red lightens, press scales .97.

## ICONOGRAPHY
- Source icons are thin-stroke line icons (search, user, ↗ arrow, map pin) inside hairline circles; social icons are tiny glyphs in grey dots. Exact set unknown → **substituted with Lucide** (CDN `lucide-static@0.452.0`, via `Icon` component, CSS-mask so it inherits colour). Flagged substitution.
- The menu icon is two right-aligned lines (long over short) in a solid disc — built in CSS in IconButton.
- Long hairline arrows (→ over ←) in ArrowPair are drawn as simple strokes.
- No emoji. ★ for ratings. No icon font, no PNG icons were available.
- **Logo:** no vector logo provided. Only low-res crops from the video exist in `assets/`; components render plain-type "CINE DAILY". Please supply the real mark.

## Fonts (substitutions — flagged)
- Display → **Bebas Neue** (Google Fonts); body/labels → **Archivo**. Loaded via Google Fonts `@import` in `tokens/fonts.css`. Supply original font files to replace.
