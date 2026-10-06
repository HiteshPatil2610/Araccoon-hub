# Araccoon Hub — changes to bring the UI closer to the video

## Scope and evidence

Prepared 4 October 2026; implementation completed in the local workspace on the same date. The sections below preserve the design rationale and proposed refinements. The implementation status records what was actually changed and verified. The existing artwork is retained; the storefront now uses optimized versions of the four new mascot poses.

## Implementation status

- Integrated crossed-arm hero, box-holding picks mascot, card presenter, and heart-hand closing mascot.
- Created alpha-preserving WebP delivery assets (approximately 1.05 MB total); original PNGs remain available.
- Refined hero typography, compact metadata, disc size, mascot crop, and once-per-load entrance timing. Latest desktop/mobile captures: `hero-poster-text.jpg` and `hero-poster-text-mobile.jpg`.
- The box mascot is now inside the clipped black surface, following the user's placement correction: its visible bottom ends exactly at the rounded section boundary rather than extending into the white story panel. The earlier seam-crossing proposal below is superseded by this correction.
- Replaced the divider perforations with repeated raccoon-mask motifs and tied its red appearance to the hero stage exiting.
- Preserved white story/closing surfaces and readable navigation in both catalog themes.
- Kept the card presenter visible on mobile, with a separate live product card and unobstructed controls.
- The presenter now pops out of a pale red circular portrait frame: the head/ears extend above the rim, while a responsive CSS crop keeps the lower body within the curved bottom and removes the detached presenting paw outside the frame. The front lower rim overlays the clothing, and mobile spacing leaves room for the ears below the product card. This replaces the rejected fade/glow/oval treatment. The original image remains intact.
- Removed continuous sticker spinning from these editorial sections and permanent `will-change` from entrance wrappers.
- Tightened the story heading to 800ms with restrained tracking and one entrance per load, avoiding temporary desktop line wrapping.
- Made reduced-motion preference updates reactive while the page is open. Scrambled labels cancel and resolve immediately, featured cards swap without translation/blur/rotation, and CSS entrance delays are removed.
- Fixed search/sort intrinsic-width overflow at 320px. Search can wrap its clear button while the sort control shrinks to the viewport.
- Browse now uses a uniform responsive product grid; the Bento/Classic toggle and size variants were removed at the user's request.
- Quick view has a 320ms fade/lift/scale entrance and a shorter exit, keeping its content, focus trap and scroll lock until the exit completes.
- Moved the hero's raccoon-pattern strap to the mascot's bottom edge in the foreground. Repeated motifs scroll continuously right in a seamless 28-second loop, stopping for reduced motion. Removed the previous scroll-driven strap shift and hero-image parallax to keep the crop covered.
- Hero wordmark now reveals individual letters from narrow/faint to full width and brightness in fixed slots (55ms stagger, 850ms transform). This approximates the visible reference rather than claiming its original implementation. Category links are compact editorial metadata, with four short shopping captions above the title and the Hub label centered over the disc. The stable accessible heading remains “Raccoon Hub: small finds, big everyday upgrades.” Reduced motion resolves letters immediately.
- Retained the catalog between story and closing; shopping controls are not faded away or reordered. No timed scrolling or artificial character morph was introduced.

**Verification:** production TypeScript/client/Worker build passed. The sandbox blocked native Vite dependency loading; the same configured build passed through approved execution outside the sandbox. Browser checks used the isolated fixture server at `http://127.0.0.1:5174`, not the real catalog: reviewed 320/375/768/1440px viewports, both themes, hero/story/closing poses, mobile menu, browse focus, quick-view opening/Escape, search clearing, zero products, one featured product, multiple featured products, and catalog failure/retry. Document widths matched viewport client widths after the narrow-screen fix (311/366/759/1431px with scrollbar). Reduced-motion handling was reviewed in source; OS-level reduced-motion emulation was not available in this browser tool. Existing large-chunk build warning remains for the separate 3D preview route. No deployment or real catalog writes were performed.

Final design captures are stored under `context/ui-screenshots/video-inspired/`; the fixture product images and titles in those captures are QA placeholders.

The continuation pass rechecked the desktop story composition and a deliberately long featured title at 375px: the live card and presenter remain separate, controls are visible, and settled document width matches the client width (1431px desktop / 366px mobile). New captures: `story-collage-1440-light.jpg` and `story-card-375-long-title.jpg`. Reduced-motion preference changes are implemented and source-reviewed; OS preference switching still requires a manual check.

Reference: the approximately nine-second CINE DAILY / Deadpool website video previously analyzed. Comparison is based on the current `src/pages/Storefront.tsx`, `src/components/StorefrontSections.tsx`, `src/components/SiteChrome.tsx`, `src/components/cine.tsx`, `src/index.css`, and existing `public/art` cutouts.

The saved `context/ui-screenshots/fixture-desktop-preview.jpg` depicts an older cream/lime, two-column design that differs from current source. It is not used as proof of the current rendered appearance. The original analysis was source-based; subsequent implementation browser checks are recorded above.

## Main conclusion

The current source already implements much of the reference: black/red hero, centered disc, giant condensed title, cutout mascot, dark picks panel, light editorial story, central information card, persistent contrast-aware navigation, tracking reveals, and scrambled closing labels. A wholesale rebuild is unnecessary. The most meaningful remaining changes are better pose-specific mascot artwork, controlled section overlap, tighter composition, and coordinated motion.

## Prioritized change list

| Priority | Area | Current evidence | Proposed change | Main files |
| --- | --- | --- | --- | --- |
| P1 | Mascot art | Four rendered viewpoints: hero, side, turn, rear | Replace viewpoint variations with intentional hero/transition/closing poses; retain one consistent character design | `public/art`, `StorefrontSections.tsx` |
| P1 | Hero framing | Red disc, oversized Raccoon title, flank slogans, cutout already present | Make the mascot and title the dominant poster composition; simplify surrounding copy and tune overlap | `Storefront.tsx`, `index.css` |
| P1 | Dark-to-white seam | Dark inner container clips overflow; picks mascot ends at bottom | Create a controlled foreground mascot layer that crosses the seam without clipping | `StorefrontSections.tsx`, `Storefront.tsx`, `index.css` |
| P1 | Closing pose | Closing uses rear-view artwork | Use a friendly front-facing heart-hand pose under the title | `StorefrontSections.tsx` |
| P1 | Transition choreography | Separate entrance observers plus progressive CSS scroll timelines | Coordinate transitions by section progress, with a static fallback and reduced-motion path | `cine.tsx`, `index.css` |
| P2 | Divider | Perforated film strip already changes red after 80px scroll | Replace anonymous perforations with a simple repeated raccoon-mask motif and tie appearance to the seam | `cine.tsx`, `Storefront.tsx`, `index.css` |
| P2 | Hero pace | Title runs for 1500ms; art 1200ms with delayed entrance | Shorten and synchronize the entrance so the full poster reads promptly | `Storefront.tsx`, `cine.tsx` |
| P2 | Editorial composition | Oversized curated heading and central find card already present | Refine spacing, title line breaks, side-image arrangement, and mascot overlap | `StorefrontSections.tsx`, `index.css` |
| P2 | White contrast | Story/closing inherit theme background | Preserve deliberate dark-to-white contrast in the reference-led presentation, while making an explicit theme decision | `index.css`, `SiteChrome.tsx` |
| P2 | Mobile adaptation | Existing stacked layouts; story mascot hidden below 640px | Keep a smaller intentional mascot presence and avoid overlap with controls | `index.css` |
| P3 | Details | Crosshair backdrops, spinning stickers, various reveals | Reduce competing decorative movement; prioritize the visible reference effects | `cine.tsx`, `index.css` |

## 1. Hero: refine the existing poster layout

- Keep black surface → red disc → pale wordmark → foreground mascot as independent layers.
- Use the new crossed-arm raccoon as the hero. The existing image reads more as a close portrait than an expressive crossed-arm poster pose.
- Aim for the wordmark to cover roughly 85–95% of the stage width on desktop; adjust from the rendered result rather than enlarging blindly.
- Position the face near the center of the disc. Let the chest overlap the middle of the title while leaving enough letters visible to read “Raccoon.”
- Keep ears, eyes, and paws inside the useful crop. Crop at the waist using the section boundary, not at the face or elbows.
- Reduce the prominence of the flank slogans. The reference uses compact actor metadata rather than competing large slogans.
- Keep category chips accessible, but consider a compact category metadata row in the hero since the full filter set is already repeated in the catalog.
- Keep the short shop explanation at lower left and one “Browse the finds” action at lower right. Ensure the mascot cannot cover either.
- Revisit the large cutout shadow: the reference depth comes mostly from overlap. A subtle shadow or no added shadow may look cleaner with detailed new fur.

**Acceptance:** at the first settled desktop frame, viewers read the brand, see the raccoon’s expression, and find the browse action immediately.

## 2. Entrance animation: coordinate one short sequence

Suggested starting values, not measured values from the video:

| Layer | Suggested start | Suggested duration | Treatment |
| --- | --- | --- | --- |
| Header and fine metadata | 0–100ms | 350–500ms | Gentle fade |
| Wordmark | 80–120ms | 650–850ms | Tracking collapse plus opacity |
| Red disc | 100–150ms | 600–750ms | Restrained scale/fade |
| Raccoon | 180–250ms | 700–900ms | Rise about 40–70px with opacity |
| Supporting copy and CTA | 350–450ms | 400–600ms | Small rise/fade |

- Target a readable full composition within approximately 1.2 seconds.
- Avoid a visible overshoot on every layer; the poster should settle confidently.
- Prefer a once-per-load hero reveal over restarting long entrances every time the user scrolls back.
- Current `TrackingReveal` animates the whole wrapper. If individual letters are later animated, preserve a stable semantic heading and prevent text reflow.
- Use short scramble effects on secondary labels, not on the main shopping action.

## 3. Picks panel: adapt the production composition

- Keep the current brand lockup left, statistics center, and selected-product copy right.
- Keep real counts for finds, picks, and aisles; do not copy movie runtime/date content.
- Use the new three-quarter raccoon holding a delivery box as the transition pose. A side camera angle alone does not provide the same visual intention.
- Reduce empty vertical space if the current 640–780px desktop minimum makes the panel feel disconnected from the hero; assess this in a fresh browser capture.
- Keep circular previous/next controls only when there are multiple picks, as current code already does.
- Ensure the featured product remains usable and readable even with zero or one item.

## 4. Section seam: the strongest structural refinement

Current `.cd-dark__inner` has `overflow: hidden`, while the picks cutout sits inside it with `bottom: 0`. This limits a true mascot overlap into the light section.

- Keep clipping on the dark background surface, but place the seam-crossing mascot in a separate foreground wrapper that allows overflow.
- Let a paw or lower torso cross the rounded dark edge by a modest amount, approximately 40–90px as a first desktop trial.
- Keep the red/pink seam thin. Avoid turning the entire white section into a large glowing border.
- Establish explicit stacking: light story surface behind dark curtain edge; mascot above both; interactive controls above decorative art.
- Give the director-style headline clearance so the overlap cannot hide it.
- Avoid global overflow changes: they could expose unwanted horizontal scroll or break the hero crop.

## 5. Editorial story: polish rather than rebuild

- Keep **CURATED BY THE RACCOON** as the product-site equivalent of the director credit.
- On wide screens, arrange the two large text groups on one clear baseline with a much smaller “BY.” Allow deliberate line breaks at smaller widths.
- Preserve the white space before the centered selected-product headline.
- Keep the central dark find card and its red action bar. Real product images should remain neutral and recognizable rather than being heavily tinted red.
- Limit side imagery to a few carefully staggered chamfered tiles, matching the video’s collage rhythm.
- Let a small raccoon cutout overlap the lower-right area beside the card, while preserving the full clickable action and product information.
- Long product titles require a controlled two-line treatment; do not shrink every heading to accommodate an unusually long item.
- Avoid fake release dates, ratings, or popularity claims. Existing owner-supplied product data should remain the source of truth.

## 6. Closing: change the pose and coordinate the handoff

- Replace `Cutout name="rear"` in `ClosingSection` with front-facing heart-hand artwork. This is the clearest mismatch with the reference ending.
- Keep a centered compact Raccoon Hub heading above the mascot, with the counts/year as secondary labels.
- Have the title resolve first, then let the small labels briefly scramble and settle.
- A story-to-closing fade can imitate the reference, but the catalog currently sits between them. Do not fade away shopping controls or reorder useful content solely to reproduce a nine-second demo.
- If a continuous transformation is desired, use a short dedicated editorial transition before or after the catalog, with stable layout and normal scroll control.
- Treat matching mascot poses as a visual handoff, not as proof of a real character morph. Simple opacity/translation can be enough.

## 7. Motion architecture

- Current CSS already provides progressive scroll-linked title drift, mascot parallax, strip translation, and curtain scaling. Retain this foundation where supported.
- Animate wrappers for entrance and inner images for scroll movement so transforms do not compete.
- Tie strip color/tilt to hero exit or seam position rather than only `window.scrollY > 80`, which may fire at very different visual moments across viewports.
- Prefer subtle relative motion: the artwork need not rotate or float continuously to feel dimensional.
- Avoid permanent `will-change` on every revealed item; apply it narrowly if performance profiling shows a benefit.
- Coordinate a small number of important transitions instead of adding independent effects to every label.
- With reduced motion enabled, show the complete composition immediately; keep all text and actions available without scramble or parallax.

## 8. Theme and responsive decisions

- The reference relies on black → white contrast. Current dark theme turns the story and closing surfaces black too. Decide whether the editorial presentation should retain its white panels in both themes or whether dark mode intentionally differs from the reference.
- On mobile, keep the title/disc/mascot composition, but scale overlap down and place explanatory text and actions in normal flow.
- Keep full mascot ears and a recognizable face at 320–375px widths.
- Consider a compact story mascot rather than hiding it entirely below 640px, if space permits.
- Keep control targets at least 44px and preserve visible keyboard focus.
- Use a full, readable page without required scroll snapping or automatic timed progression.
- The portrait video contains a desktop-style website. It does not demonstrate a mobile layout to copy.

## 9. Generated raccoon asset direction

New artwork should retain the project's existing character identity: gray/brown fur, black eye mask, cream muzzle, charcoal hoodie, crimson details, and headphones around the neck.

Four pose-specific deliverables:

1. **Hero:** centered waist-up crossed-arm raccoon, confident friendly expression, open eyes.
2. **Picks / box:** matching three-quarter raccoon holding a plain delivery box, intended for the picks section and dark-to-white seam.
3. **Story / featured card:** matching raccoon gesturing toward the live product card. Keep the actual card in HTML so product content and actions remain usable.
4. **Closing:** matching waist-up raccoon with a slight head tilt and paws forming a heart. This replaces the rear-facing concept; no new back-view image is needed.

All four need real transparent backgrounds, clean ear/elbow edges, adequate padding, and lighting that reads on black and white. The circle, title, shadows, and live product card must remain separate webpage layers. These are raster illustrations, not a rigged model or an animation sequence. Consistency between generated poses must be reviewed before final integration.

Asset folder: `public/art/video-concept/`. New files are additive; existing `raccoon-*.webp` assets remain intact. `Cutout` now maps semantic pose names (`hero`, `box`, `presenter`, `heart`) to the corresponding new WebP assets. The placement table below lists the former slots for comparison.

### Deliverable paths and generation prompts

- Hero: `public/art/video-concept/raccoon-hero-crossed-arms.png`.
- Picks / box: `public/art/video-concept/raccoon-picks-box.png`.
- Story / featured card: `public/art/video-concept/raccoon-story-card-presenter.png`.
- Closing: `public/art/video-concept/raccoon-closing-heart.png`.
- Generated using the built-in image generation tool. Original PNGs are retained with transparency; sibling `.webp` files are the optimized assets used by the storefront.

**Hero prompt:** Use case: stylized-concept. Asset type: transparent website hero mascot cutout for Araccoon Hub. Create one exceptionally polished cinematic 3D anthropomorphic raccoon, front-facing waist-up, arms crossed confidently with both paws visible, mischievous friendly smile, eyes open and engaging, rounded ears fully inside frame. Gray brown dense realistic fur, distinct black raccoon eye mask, cream muzzle, expressive amber eyes. Wearing a charcoal streetwear hoodie with subtle crimson seams and drawstrings and black over-ear headphones resting around neck with crimson accent rings. Premium animated-feature character quality, detailed groomed fur, clean believable paws, tailored fabric. Soft studio key light with restrained crimson rim lighting; clear facial definition and enough fill to read equally on black and white. Centered portrait composition with transparent padding around ears and elbows, entire waist-up silhouette inside canvas. Actual transparent alpha background. No lettering, logo, weapons, superhero costume, background, circle, ground plane, cast background shadow, border or watermark. One character only. Intended to overlap a giant webpage wordmark; do not bake in text or backdrop.

**Closing prompt:** Use case: stylized-concept. Asset type: transparent closing-section mascot cutout. Reference image role: character identity reference from the newly generated crossed-arm raccoon; create a new pose of exactly the same raccoon with same fur colors, amber eyes, face proportions, charcoal hoodie with crimson piping and drawstrings, and black headphones with red rings around neck. Primary request: centered front-facing waist-up raccoon, both furry paws held together at chest making a clearly recognizable heart shape with thumbs and fingers, sweet friendly confident smile, slight head tilt. Premium cinematic 3D animated-feature render, realistic groomed fur and tailored hoodie, studio key lighting with subtle red rim and enough fill for black and white webpage surfaces. Entire ears, shoulders and elbows inside frame with transparent breathing room. Actual transparent alpha background. One character only, no backdrop or ground shadow, no text, logo, weapon, circle, UI, watermark. Keep identity matched to reference; change only pose and expression as needed. Character should read as a friendly curator mascot for Araccoon Hub.

## Implementation order and verification

### Mascot gallery and placement map

These are the four selected concept assets. The box is part of the picks illustration. For the card pose, the raccoon presents the separate live product card rather than a baked-in screenshot of a card.

| Existing slot | New asset | Intended placement |
| --- | --- | --- |
| `Cutout name="hero"` | `raccoon-hero-crossed-arms.png` | Centered in front of the red disc and large wordmark |
| `Cutout name="side"` | `raccoon-picks-box.png` | Picks panel, with box/paw crossing the section seam |
| `Cutout name="turn"` | `raccoon-story-card-presenter.png` | To the right of the featured card, presenting it toward the left |
| `Cutout name="rear"` | `raccoon-closing-heart.png` | Front-facing closing scene; replaces the back-view idea |

#### Hero — crossed arms

![Crossed-arm raccoon hero](E:/Personal-Projects/Araccoon-hub/public/art/video-concept/raccoon-hero-crossed-arms.png)

#### Picks — raccoon with delivery box

![Raccoon holding a delivery box](E:/Personal-Projects/Araccoon-hub/public/art/video-concept/raccoon-picks-box.png)

#### Story — raccoon presenting the featured card

![Raccoon gesturing toward the featured card](E:/Personal-Projects/Araccoon-hub/public/art/video-concept/raccoon-story-card-presenter.png)

#### Closing — heart with hands

![Raccoon forming a heart with its paws](E:/Personal-Projects/Araccoon-hub/public/art/video-concept/raccoon-closing-heart.png)

### Additional generation prompts

**Box prompt:** Use case: stylized-concept. Generate a new transparent website mascot asset using the provided image solely as character identity reference. Same cinematic 3D raccoon, gray-brown groomed fur, black eye mask, cream muzzle, amber eyes, charcoal hoodie with crimson piping and drawstrings, black headphones with red rings around neck. Pose: friendly three-quarter view toward viewer, holding a plain kraft cardboard delivery box at waist with both paws, delighted confident expression. Medium portrait crop from fully visible ears to upper thighs; box and paws fully visible; fluffy striped tail curves at side. Premium animated-feature render, detailed fur and fabric, soft studio key light and restrained crimson rim light, readable on white or black. Single character, one box only, no lettering or branding on box, no text, watermark, backdrop, floor, ground shadow or UI. Real transparent alpha background, generous clear margin around ears, elbows, box and tail. Keep visual identity matching reference. Intended for Araccoon Hub picks section and overlapping a dark-to-white boundary.

**Card presenter prompt:** Use case: stylized-concept. Asset: transparent raccoon cutout to stand immediately to the RIGHT of a real HTML featured-product card on Araccoon Hub website. Provided image is solely the character identity reference. Same cinematic 3D raccoon: gray-brown detailed fur, black eye mask, cream muzzle, amber eyes, charcoal hoodie with crimson seams and drawstrings, black headphones with red rings resting around neck. Pose: body in three-quarter orientation toward image LEFT, face looks warmly at viewer, one furry paw extended toward image LEFT with open upward palm presenting a product card that will be separately placed in website; other paw rests naturally near chest. Friendly clever smile. Frame fully visible ears through upper thighs, fully include presenting paw and elbow, some striped tail visible on right. Keep character centered with ample transparent margins, polished studio key lighting and subtle red rim. Match reference facial proportions and materials. Real transparent alpha background. Only one raccoon; do NOT draw any card, UI, text, panel, prop, backdrop, floor, ground shadow, watermark, or logo. The gesture is the card interaction; actual card remains separate and clickable in website.

### Implementation sequence

The initial card-presenter previews showed an apparent studio backdrop, so a simpler waist-up variant was generated and selected. The selected PNG's alpha channel was checked directly: sampled surrounding background pixels have alpha 0. Earlier variants are not project assets.

**Background-extraction prompt:** Remove the entire black/red studio backdrop and all surrounding red glow, replacing it with actual transparent alpha background. Preserve the raccoon's identity, fur, face, headphones, clothing, open palm presentation pose, tail, and exact proportions. Keep the complete character with clean fine fur alpha edges and clear transparent margin on all sides. No new backdrop, colored haze, ground shadow, text, or card. Character only isolated on genuine transparency. Do not alter the pose or add objects.

**Final card-presenter prompt:** Create a TRANSPARENT PNG CUTOUT, character only. Single waist-up cinematic 3D raccoon website mascot, centered, gray-brown detailed fur, black eye mask, cream muzzle, amber eyes. Charcoal hoodie with red piping and red drawstrings. Black headphones with red accent rings around neck. Friendly smile. Body turned slightly left, face toward viewer. Left side of image: one paw extended with open upward palm presenting an invisible website card; other paw near chest. Fully include ears, extended paw and elbows within canvas with clear padding. Premium animated-feature render with soft even studio lighting. No environment. NO BACKGROUND AT ALL: every pixel outside character silhouette must have zero alpha, transparent background. No studio gradient, glow, halo, atmosphere, floor, or shadow. No actual card, text, or logo. Waist-up only, not full body. Standalone character asset for compositing on a webpage.

1. Choose the new mascot poses and inspect transparency/crops.
2. Tune hero layout with the selected hero asset.
3. Fix dark-to-light seam layering.
4. Tune entrance timings and scroll handoff.
5. Refine story card collage and closing pose.
6. Verify mobile layouts, both themes, and reduced motion.

Before implementing, capture the current rendered storefront. After changes, compare at 375px, 768px, and 1440px widths. Check zero/one/multiple featured products, long titles, loading/error states, keyboard navigation, and click access around mascot overlaps. Record a short scroll capture to judge timing; static screenshots alone cannot validate motion.

The exact video easing, scroll mechanism, and letter-reveal technique remain unknown; recommended timings are design starting points. See implementation status above for the checks executed on the resulting UI.

## Latest footer update

The standalone closing section has been removed. The heart-hands raccoon now appears beside the footer information on desktop and below it on mobile, with its lower edge aligned to the disclosure divider. Earlier closing-section recommendations are retained as design history.

Footer refinement: the heart-hands raccoon and brand heading are now centered. Desktop information sits to the left with category links on the right; tablet and mobile layouts move the centered mascot beneath the text.

Story-to-Browse spacing: removed the 260px offset above the right-side thumbnails, reduced Story bottom padding to 32px, and made Browse top padding scale from 32px to 56px. Anchor clearance uses scroll-margin rather than extra visual padding.

Hero circle entry: replaced the opacity reveal with a 1200ms scale expansion from a chest-level origin. The larger red backdrop is clipped inside the hero stage behind the moving strap; reduced-motion preference shows the final state immediately.

Hero circle correction: separated the static centered positioning wrapper from the animated circle fill. Centering uses a conventional translate transform; expansion uses only scale on its child, keeping the red disc behind the mascot throughout the entrance.

Hero kinetic typography: RACCOON letters now perform a staggered lift, stretch, and settle wave after the original reveal. The wave repeats with a resting interval, pauses off-screen, and is disabled for reduced-motion preferences.

Hero supporting text now shares HUB's character-stagger entrance: five categories, live catalog count, and four flank captions. Longer labels use a shorter per-letter interval, preserve word spacing, retain accessible labels, and honor reduced-motion preferences.

RACCOON entrance refinement: each letter starts compressed horizontally to 4% at its own fixed left edge and expands rightward to its full width over 1000ms with staggered timing. The subsequent kinetic typography wave is unchanged.

Hero entrance based on frames 006–037 (6 October 2026): replaced the strap snap with a complete-band fade and coordinated all hero elements with one shared start. RACCOON expands each glyph from 10% width at its left edge, with a 100ms stagger and 1800ms expansion. The mascot fades, grows from 76%, and rises with a bottom-center anchor while the word is entering. Its static outer crop remains beneath the foreground strap. The disc scales and fades inside its centered wrapper; existing chest-level origin and stage clipping are retained. Navigation descends, supporting text resolves in staggered narrow-to-wide letters, and story/actions arrive later. The recurring kinetic wave starts at 2900ms, after the title entrance. Category hover underlines, rightward strap motion, responsive final placements, and scroll colour/tilt are retained as project choices. Reduced motion resolves to the final state and disables the text wave/marquee.

The shared clock waits for display fonts and hero-image decode, with a 1200ms maximum asset wait and cleanup on unmount. Catalog updates do not restart it; non-hero section reveals keep their own visibility triggers. Navbar focus/scroll completes its entrance immediately, and header transforms are applied to individual controls so the fixed mobile menu keeps its viewport anchor.

Implementation timings are chosen for this project, not measured video timestamps. See `reference-frame-analysis/hero-entry-implementation.md` for the cue sheet.

Verification: final build/typecheck, initial rendered state, accessible labels, navbar scope, wave-after-entrance timing, and port-3010 module/art checks passed. Reduced motion and keyboard handling were reviewed in source. Browser playback was unavailable in this session.

Metadata refinement (6 October 2026): the five hero category options and catalog count now enter together as a complete row using the navbar's shared hero-nav-arrive keyframes, 450ms delay, 1400ms duration, and responsive navigation-height travel. Their previous per-character stagger was removed. Plain labels preserve category actions, hover underlines, and live count updates; focus completes the entrance immediately, and reduced motion skips it. HUB and the four hero captions retain their character reveal.

Hero image refinement (6 October 2026): on desktop (≥1200px), the crossed-arm raccoon now extends from the title area across the strip to the hero bottom boundary, in front of both title and strip, matching the observed reference layer order. Story text and actions use side columns. The artwork enters from 72% scale and a 6% lower offset, grows/rises over 2000ms, and fades over 1700ms from the shared 180ms cue. Its outer crop remains fixed and natural proportions are preserved. Below 1200px, the stage crop and foreground strip hide the flat cut while copy/actions remain below. This supersedes the earlier stage-only desktop placement; the title wave and other entrance cues are retained.

Hero foreground correction (6 October 2026): the hero raccoon now stays above the title, disc, strap, and lower hero content at all screen sizes. The stage has its own background stacking context; the mascot keeps one permanent foreground layer. Its 1700ms transparency fade was replaced with a 650ms opaque bottom-to-top reveal while retaining growth/rise, preventing letters from showing through the character during entry. Reduced motion shows the image immediately. This supersedes the earlier smaller-screen strap-over-image layer order.

Reference mascot entrance restored (6 October 2026): removed the bottom-to-top wipe introduced in the foreground correction. The complete hero image again fades in while growing from 72% scale and rising from a 6% lower position, using the shared 180ms cue. Its fixed foreground plane and the separate background stage remain; stacking order does not change during entry. Reduced-motion handling is preserved.
