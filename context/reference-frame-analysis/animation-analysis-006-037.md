# Reference animation analysis — frames 006–037

Analyzed 6 October 2026. This is an analysis document; no project UI or animation code was changed for this task.

## Evidence and limits

Source folder: `C:\Users\Hitesh Patil\Downloads\ezgif-60e56e59371f24aa-jpg`.

All 32 images, `ezgif-frame-006.jpg` through `ezgif-frame-037.jpg`, were inspected in chronological, labeled contact sheets. Frames 006, 008, 009, 011, 014, 015, 020, 027, 031, and 037 were also inspected individually. Enlarged crops and pixel comparisons were used for the small strap pattern and first title letter. The originals were left unchanged.

The frames are 1440 × 1080. The black rounded presentation panel stays approximately at x=72–1369 and y=135–946. The gray area surrounding it belongs to the reference presentation. It is not evidence that a website should have those margins on every screen.

These JPEGs have no usable animation timestamps. Frame numbers establish order, but do not establish seconds, playback speed, original easing curves, or the export interval. Similar successive frames may be held or repeated samples. This analysis does not assign invented millisecond timings to the reference.

**Observed** describes visible changes. **Reconstruction** describes a practical way to reproduce them, rather than claiming knowledge of the original source code or animation library.

## What the sequence does

This is a layered hero entrance. Narrow, dim title letters expand from left to right. The character appears while that expansion is still running, growing and moving upward from the lower center. A red circle grows and brightens behind the character and title. The navigation descends into the panel, the four actor captions resolve progressively, and the strip, metadata, story copy, and buttons arrive at overlapping times. By the final frames, most elements have settled and the strip pattern continues traveling.

The visual effect comes from **overlap, changing width and opacity, and a stable final composition**. It does not depend on making every object bounce or move continuously.

## Sequence by phase

| Frames | Visible state | Role in the entrance |
|---|---|---|
| 006–008 | Dim, narrow D, then E and later letter traces. The character is just becoming visible by 008. | Establish the word before revealing the whole composition. |
| 009–014 | More title letters widen and brighten. Character rises/grows. Red backdrop becomes visible. Actor-caption characters begin resolving. Header enters from above and is initially clipped. | Build several layers together, with the title leading. |
| 015–020 | Title expansion continues. Circle approaches its final size. Character grows closer to its final footprint. Header settles downward. Tilted strip and right-hand year become legible; lower story content starts appearing. | Establish the full poster layout before the typography finishes. |
| 021–027 | Actor captions continue resolving, genre pills gain contrast, story copy becomes readable, and the booking control and graphic badge appear more clearly. | Add information and actions after the main visual hierarchy is established. |
| 028–031 | Title and captions approach their final widths/spacing and brightness. Character and circle are nearly settled; controls are readable. Strip pattern keeps moving. | Ease into the completed composition. |
| 032–037 | Small final changes in typography and controls; no major new scene. Leftward strip travel remains visible. | Hold the hero with a restrained moving detail. |

The boundaries overlap; they are not separate cuts or waits for each preceding animation to finish.

## Element-by-element findings

### 1. Large DEADPOOL title

**Observed:** Each letter begins much narrower than its final form and dimmer against the black surface. The sequence progresses D → E → A → D → P → O → O → L. Earlier letters are still widening as later ones start. Their vertical size and baseline remain approximately stable. The first D's left edge stays near x=116 while its right edge moves right. This is expansion within a reserved letter area, rather than the whole word sliding in from the left.

A fixed crop around the first D provides supporting measurements. Visible bounds use columns containing more than 100 pixels above a threshold of 40% of the crop's brightest intensity, with a minimum threshold of 8. JPEG compression and thresholding make these approximate visible bounds, not font metrics.

| Frame | D left edge | D right edge | Visible width | Brightest mean RGB intensity in crop, 0–255 |
|---|---:|---:|---:|---:|
| 006 | 116 | 129 | 14 px | 30 |
| 009 | 116 | 175 | 60 px | 125 |
| 014 | 116 | 206 | 91 px | 191 |
| 020 | 116 | 234 | 119 px | 250 |
| 027 | 116 | 250 | 135 px | 255 |
| 037 | 116 | 254 | 139 px | 255 |

The D is already about one tenth of its final visible width in frame 006. This range therefore does **not** prove that the original starts as a perfectly straight one-pixel line. It shows a compressed glyph. The shrinking amount of expansion toward the end is consistent with an ease-out entrance.

**Reconstruction:** Reserve each letter's final width, animate an inner glyph from small `scaleX` to 1 with a left-side transform origin, and increase opacity. Offset the starts by letter index. Keep the title's layout stable, so the expanding letters do not push adjacent letters or the mascot sideways. This would reproduce the visible effect without requiring font-width changes or a 3D rotation.

**What is unproven:** The exact initial scale, opacity curve, perspective, animation library, and CSS-versus-font implementation. The frames do not show a recurring lift/stretch wave after the entrance. Raccoon Hub's existing recurring kinetic wave is a separate requested addition.

### 2. Central character cutout

**Observed:** The pose stays the same. In 008–009 the character is faint and occupies a smaller footprint near the bottom. Across 011–027, its head moves upward and its shoulders spread outward as brightness increases. The head is roughly near y=535 in 009 and near y=400 by the settled composition. The image continues down to the panel's bottom, where it is cropped cleanly by the panel boundary.

Both upward movement and growth are visible. Describing this as only a fade, or only a vertical slide, would miss part of the effect. There is no visible arm movement or change of pose.

**Reconstruction:** Combine opacity with modest uniform scale and an upward translation, using a bottom-center anchor and a clipped outer panel. This can be done with a static transparent image; the footage does not require an animated character asset.

**Layering detail:** The character is in front of the title and the strip. Its torso interrupts the strip pattern at the center and extends below the strip into the lower information area. In this reference, the strip is not covering the character's bottom cut.

### 3. Red disc behind the character

**Observed:** A faint red backdrop becomes discernible around 011–014. Its footprint expands and its red becomes stronger through the middle frames, reaching a centered disc roughly 500 px across in the final composition. It remains behind the white title and the character; there is no sideways travel toward the right edge.

Its visible top is around y=324 in the settled layout. Much of its lower area is obscured by the character, so the pictures do not prove a specific bottom clipping mask or the precise point from which it expands.

**Reconstruction:** Put the disc in a static centered positioning wrapper. Animate scale and opacity on a child. This separates centering from the entrance transform and prevents the disc drifting when it expands.

**What is unproven:** A chest-level transform origin, an exact zero-radius starting point, a radial clip-path versus a scale transform, or a visible spring overshoot. Those can be deliberate adaptations, but are not facts established by this range.

### 4. III label above the disc

**Observed:** The three-bar label appears dimly above the backdrop, then brightens and settles a small distance downward. In the final composition it is centered near x=720 and overlaps the disc's top area. It occupies a different vertical level from the main title.

**Reconstruction:** A short opacity/vertical-settle entrance is sufficient. The bars' simple shape makes independent character timing difficult to establish from these JPEGs. Do not claim that the reference proves a three-character stagger here. Raccoon Hub's HUB stagger is a compatible adaptation.

### 5. Four actor captions above the title

**Observed:** RYAN REYNOLDS, KARAN SONI, EMMA CORRIN, and HUGH JACKMAN become readable progressively, with early letters clearer than later ones. Their intermediate state has thin, dim characters and conspicuously open spacing. The word groups also settle toward their final horizontal positions: for example, the left caption starts farther right than its final left alignment.

These captions take longer to finish than merely showing the first few title letters. By approximately 031–037 they read as compact, solid labels.

**Reconstruction:** Use per-character opacity/width or rotation-to-face changes, combined with restrained tracking reduction and/or a short horizontal settle of the group. Do not reproduce them using only a whole-word opacity fade. Conversely, do not assume they use exactly the large title's fixed-left-origin transform; their word-group movement differs.

**Purpose:** The four small labels balance the wide title and give the center character room. For Raccoon Hub, four short shopping captions can serve the same compositional role.

### 6. Header: logo, navigation, utility circles

**Observed:** The header is initially outside or clipped by the top edge. Around 011–014, only the lower parts of the logo and utility circles are visible. They move down into the black panel together and reach their final inset by the later frames. The panel boundary itself does not move.

The navigation retains its small, spaced uppercase appearance, with a red active marker. There is no evidence in this range of a menu opening, hover state, or navigation transition.

**Reconstruction:** Translate a header group downward from a negative vertical offset inside an overflow-clipped container. A fade may soften the arrival, but the directly visible evidence is downward movement and top-edge clipping.

### 7. Genre pills and release metadata

**Observed:** Small outlined pills occupy the upper-left metadata row; a small release label is aligned to the right. The pills are faint around 021–022 and clearer by 027–031. These elements have a quieter arrival than the title and character. They do not demand attention with a large overshoot.

**Reconstruction:** A delayed fade or subtle settle is enough. Their small size and compressed pixels do not support an exact character-by-character animation claim. Category links and live catalog count are the Raccoon Hub equivalents.

### 8. Vertical year

**Observed:** The rotated [2024] label appears along the right side around 015–020 and becomes brighter. Its vertical orientation is part of the final layout, not evidence of a rotating entrance.

**Reconstruction:** Keep its rotation fixed on a positioning wrapper, then fade the content. Avoid inventing a spin to match this evidence.

### 9. Tilted patterned strip

**Observed:** By 015–016, the strip is becoming visible across the panel, sloping slightly upward toward the right. Its repeated light motifs brighten with the dark band. The whole band remains in place, while the printed pattern changes horizontal position. There is no visible roll, moving roll shadow, or traveling left-to-right laying edge.

The enlarged left-hand crops show that the repeat moves **left** in this range. Normalized pixel matching of the unobstructed patch at x=160–440 and y=754–790 gives approximately −4 px between 027→028, 028→029, 030→031, 031→032, 033→034, 034→035, and 036→037. The 032→033 interval is about −8 px; 029→030 and 035→036 are visually held samples. This supports the direction, but the uneven samples do not establish a speed in pixels per second.

**Reconstruction:** Fade in the complete tilted band while running horizontal translation on a separate inner repeating track. Use duplicated matching repeats for a seamless loop. A loop reset is not shown within these 32 frames, so its seamlessness remains an implementation recommendation.

**Adaptation distinction:** Raccoon Hub's rightward scrolling strap, foreground crop coverage, and sweep-and-snap entrance were user-directed project choices. They differ from this reference. No changes to them were made for this analysis.

### 10. Lower story block, booking CTA, and graphic badge

**Observed:** The lower-left story marker/copy becomes visible after the main scene starts forming, roughly 017–021 onward, and grows clearer through the later frames. The outlined BOOK NOW control appears later and becomes solid/readable around 023–029. The adjacent graphic badge also brightens and grows into its lower-right placement.

The badge carries an angled graphic. These samples do not convincingly prove a continuous spin: an angled final graphic alone is not evidence of rotation. A partial outline is visible behind/beside it late in the sequence, but its purpose and interaction cannot be determined from these frames.

**Reconstruction:** Bring story copy in with a restrained opacity/short-rise entrance; fade and slightly scale the action group into its final position. Keep the shopping action recognizable and avoid another large movement competing with the character.

### 11. Faint guides and composition

**Observed:** Faint circular and hairline guides sit behind the scene. They become easier to see as the entrance resolves, while remaining low contrast. The dominant relationships stay constant: logo left, navigation centered, utility controls right; metadata above the title; disc and character centered; story left and actions right below the strip.

The title is roughly y=394–690 and spans most of the panel's width. The central cutout blocks parts of the middle letters deliberately. The white title remains identifiable from its outer letters and overall silhouette. This creates depth through overlap rather than through shadows on every element.

**Reconstruction:** Keep the guide graphics decorative and behind the content. Reserve the central column for the mascot; align the surrounding text to predictable edges. Use thin lines and clear type-size hierarchy instead of filling every gap with decoration.

## Layer order visible in the reference

From back to front:

1. Black panel and faint guide graphics.
2. Red disc behind the principal title.
3. Large title and supporting metadata/text, in their respective layout areas.
4. Tilted patterned band below the title.
5. Central character, which occludes the title and the band.
6. Header and lower controls occupy separate areas; their mutual stacking order cannot be established where they do not overlap.

The rounded panel clips its contents at the outer boundary. A foreground strap used to conceal a mascot's cropped torso would require a different layer order from the reference, and should be documented as an intentional project adaptation.

## Per-frame inspection ledger

Each row records the most useful visible state, rather than claiming every tiny change is a separate animation.

| Frame | Inspection note |
|---|---|
| 006 | Mostly empty black panel; first D is a dim, very narrow glyph. |
| 007 | D wider/brighter; next letter trace appears at its reserved position. |
| 008 | E begins resolving; further title traces and a very faint lower-center character are visible. |
| 009 | D/E clearer; A and next D still narrow; character recognizable; first caption traces appear. |
| 010 | Expansion advances along the word; character gains size and contrast; captions remain partial. |
| 011 | More title letters visible; faint disc/center label; header portions enter at the clipped top edge. |
| 012 | Very similar sampled state to 011; no distinct new event. |
| 013 | Title and character progress; header continues descending; caption characters resolve. |
| 014 | Both O positions visible as compressed glyphs; disc clearer; logo still clipped near the top. |
| 015 | Last L becomes discernible; strip and year begin appearing; character and disc grow brighter. |
| 016 | Full title can be read, though letters are still narrower/dimmer than final; strip clearer. |
| 017 | Header farther inside panel; lower story traces appear; title and character continue settling. |
| 018 | Very similar sampled state to 017; entrance remains in progress. |
| 019 | Captions contain more letters; story copy gains contrast; character approaches its final footprint. |
| 020 | First D almost full brightness; right-hand title letters still finishing; disc strong; strip motifs clear. |
| 021 | Action/badge traces become easier to distinguish; story text clearer; caption stagger continues. |
| 022 | Genre-pill row becoming discernible; main composition nearly built; smaller controls still faint. |
| 023 | Booking outline and badge gain contrast; title/captions continue widening and resolving. |
| 024 | Very similar sampled state to 023; no distinct new event. |
| 025 | Lower controls more readable; disc and character close to settled; caption spacing still resolving. |
| 026 | Genre pills and captions clearer; strip remains active; lower copy has stronger contrast. |
| 027 | Most information readable; title still makes small width changes; graphic badge established. |
| 028 | Small typography settling; pattern moves left relative to 027. |
| 029 | Near-final hero; leftward pattern progression continues. |
| 030 | Visually held sample close to 029, including the measured strip patch. |
| 031 | Header and captions largely settled; title nearly final; clear lower actions. |
| 032 | Subtle final changes; strip continues moving left. |
| 033 | Near-identical layout; greater pattern displacement than the preceding sampled interval. |
| 034 | Settled composition, with minor title/control changes and continued strip travel. |
| 035 | First D almost final width; strip still active; no new scene. |
| 036 | Visually held sample close to 035, including the measured strip patch. |
| 037 | Completed hero within this range; title, character, disc, and captions settled; strip has moved again. |

## How to carry this understanding into Raccoon Hub

These are design implications, not changes performed in this task:

- Let RACCOON's per-letter width-and-opacity entrance lead; preserve final letter slots and the left-edge expansion. A visible glyph compression is supported more strongly than the previously rejected straight-line effect.
- Start the raccoon and circle while the title is still entering. Waiting until the title or strap finishes would lose the overlap visible here.
- Animate image opacity, growth, and rise together. Keep the bottom crop deliberate. A strap in front to conceal the crop is a project-specific requirement.
- Keep disc centering separate from its scale/fade transform. Do not infer the disc's origin from the existing project implementation.
- Use HUB and the four short shopping captions as smaller supporting accents. Give them less visual force than RACCOON.
- Keep category and catalog metadata, navigation, story copy, and browse CTA readable in the settled state. They should complete the layout, not compete with its focal point.
- If matching these frames more closely becomes the goal, a full-width strip fade with inner marquee movement is supported by the reference. The recent snap entrance is a separate concept.
- Preserve the user's requested recurring kinetic typography as an additional behavior, with a resting interval; this range only verifies the entrance.
- For implementation, use separate wrappers for layout positioning, entrance transforms, and continuous motion. Resolve to the final layout immediately for reduced motion. Accessibility handling is a recommendation; it cannot be inferred from screenshots.

## What this range cannot establish

No section change, scrolling transition, footer motion, hover animation, click behavior, modal entrance/exit, loading state, responsive layout, or animation replay policy is demonstrated by 006–037. There is no basis here for specifying those as observed reference behavior. The images also cannot prove the original JavaScript library, exact font family, source asset type, or whether this was recorded from a live website versus a motion mockup.

## Visual evidence

The labeled sheets cover every requested image. Reading order is left-to-right, then top-to-bottom.

- [Frames 006–013](frames-006-013.jpg)
- [Frames 014–021](frames-014-021.jpg)
- [Frames 022–029](frames-022-029.jpg)
- [Frames 030–037](frames-030-037.jpg)
- [Enlarged strap and badge comparisons](strap-and-badge-details.jpg)
- [Supporting width, intensity, and displacement measurements](measurements.json)

The crops enlarge existing pixels for comparison; they do not recover missing detail. The primary evidence remains the original JPEG files in the source folder.
