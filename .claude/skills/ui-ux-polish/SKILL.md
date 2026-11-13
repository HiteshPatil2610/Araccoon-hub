---
name: ui-ux-polish
description: Audit-and-fix playbook for the small UI/UX details a senior designer notices (interaction feedback, motion, wayfinding, states, accessibility to WCAG 2.2 AA, touch ergonomics, type and spacing rhythm, catalog browsing). Use when asked to polish, review or "make nicer" a page or component of Araccoon Hub, or to audit the public pages at desktop and 375 px in both themes. Defers to the Cine Daily design system in context/ui-context.md.
---

# UI/UX polish — audit and fix

A checklist of checkable heuristics plus a browser workflow. Output is a **prioritised findings list for the owner**, not silent edits.

## Ground rules (read first)

1. **The design system wins.** `context/ui-context.md` and the tokens in `src/index.css` (`--cd-*`, semantic tokens, `--space-*`, `--radius-*`, `--ease-*`, `--dur-*`) are authoritative. Palette is near-black `#0A0A0A`, white, crimson `#C8202F` (pink `#E2457E` only at the hero seam). Fonts are Bebas Neue (display, caps) and Archivo (body). A finding never adds a colour, font, shadow style or radius that is not already a token; if a fix truly needs one, say so and update `ui-context.md` first, with the owner's OK.
2. **Respect the 60/30/10 split** (page colour / opposite / crimson). New crimson is the scarcest resource: spend it on state (hover, focus, saved, live), not decoration.
3. **Keep the hero and story choreography** and the theme curtain intact unless asked. Editable copy goes through `useSiteText()`.
4. **No dark patterns.** No fake urgency, prices, stock or ratings (see `context/project-overview.md`, out of scope).
5. **Owner chooses.** Present findings first. Where a visual or motion change has several reasonable designs, show options as small looping samples (an Artifact page) before building.
6. Do not touch `/admin` unless asked.

## Workflow

1. **Inventory.** List the routes and states to check: default, hover, focus-visible, active/pressed, disabled, loading, empty, error, long content, one item, many items. Read the component source for each so you know which states exist.
2. **Start the dev site** with the `web-alt` launch config (port 5175) via `preview_start`. If the pane reports `hidden`, timers and animations are throttled: override `document.visibilityState`, or pause animations with `document.getAnimations().forEach(a => { a.pause(); a.currentTime = t })` to inspect a frame (or `a.finish()` to see the end state). If screenshots come back cropped or zoomed after resizing, open a fresh tab (`tabs_create`) and resize that one.
   In a git worktree: copy `.env` and `.env.local` from the main checkout (without reading them) or the Worker returns 500, and run `npm ci` there; an empty `node_modules` makes Vite refuse the parent repo's font files (403 on `/@fs/…`), so the page falls back to Arial.
3. **Four passes per page:** desktop 1440 light, desktop dark, 375×812 light, 375 dark (`resize_window` with `colorScheme`; the site's own toggle sets `.dark` on `<html>`, `localStorage` key holds the choice).
4. **Per pass, measure, don't eyeball** — run the probe script below; then tab through the page with the keyboard; then screenshot.
5. **Write findings** as `area · what · why (heuristic) · fix · effort S/M/L · risk`. Rank: high value + small effort first; accessibility failures (AA) above taste.
6. **Owner picks.** Offer options for anything visual/motion with more than one sensible answer.
7. **Implement** on a branch from `main`, one concern per change, matching surrounding code style. Re-run the four passes on touched pages. Then `npm run typecheck`, `npm test`, `npm run build`.
8. **Record**: dated entries in `context/ui-context.md` (what changed in the UI), `context/progress-tracker.md` (what and how verified) and `CHANGELOG.md` (Unreleased).

### Probe script (paste into `javascript_tool`)

```js
(() => {
  const out = { overflowX: document.documentElement.scrollWidth > innerWidth, small: [], noName: [], noFocusStyle: [] };
  for (const el of document.querySelectorAll('a[href],button,input,select,textarea,[role=button],[tabindex]:not([tabindex="-1"])')) {
    const r = el.getBoundingClientRect(); if (!r.width || getComputedStyle(el).visibility === 'hidden') continue;
    const name = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || el.value || '').trim();
    if (!name && !el.labels?.length) out.noName.push(el.outerHTML.slice(0, 90));
    // 24px is the WCAG 2.2 AA floor (2.5.8); this site's own target is 44px on touch.
    if ((r.width < 24 || r.height < 24) && getComputedStyle(el).display !== 'inline') out.small.push([Math.round(r.width), Math.round(r.height), name.slice(0, 40)]);
  }
  return out;
})()
```

Contrast: compute with the tokens, not by eye. Text ≥ 4.5:1 (≥ 3:1 at 24px+ or 18.66px bold), UI parts and focus rings ≥ 3:1 against what is next to them. Crimson `#C8202F` on white is 5.7:1, white on crimson 5.7:1, crimson on `#0A0A0A` is 3.5:1 (fine for large text, rings and icons; **not** for small body text).

## Checklist

Each item: **look for** → *why* → fix.

### 1. Feedback and state
- **Every press acknowledges within 100 ms** (colour, scale ≤ .97, or ripple of state) → *NN/g: under 0.1 s feels caused by the user.* Use `--dur-fast`; never scale an element whose `::after` is the hit area (see product cards).
- **Hover ≠ focus ≠ pressed ≠ selected** are each visible and distinct; selected uses the inverted fill (`sun`), not just colour → *state must not rely on colour alone (WCAG 1.4.1).*
- **Async actions** show pending state on the control that started them (disabled + label change), guard double submits, and settle to success or a recoverable error → *system status visibility (Nielsen #1).*
- **Waits:** < 1 s show nothing; 1–10 s skeleton or spinner after ~300–1000 ms grace; never stack spinner on skeleton → *NN/g response-time limits; a flash of loader is worse than none.*
- **Toasts** are for confirmations only, polite live region, ≥ 5 s and paused on hover/focus; errors that need action stay inline → *WCAG 2.2.1 Timing; Carbon/Primer toast guidance.*
- **Optimistic toggles** (save, stash) update instantly and explain where the thing went ("Saved to …") with a way to change it.

### 2. Motion
- **Durations:** micro 100–200 ms, small UI 200–300 ms, large/page 300–500 ms; exits ~20–30% faster than entrances → *Material 3 / HIG: motion should feel responsive, not decorative.* Use `--dur-*`.
- **Easing:** entrances decelerate (`--ease-out`), exits accelerate, on-screen moves use `--ease-cine`; avoid `linear` except for loops and progress.
- **Animate transform and opacity only**; no layout properties (width/height/top) in transitions → jank on phones.
- **Reduced motion:** `prefers-reduced-motion: reduce` swaps movement for an instant or opacity-only change; nothing essential is conveyed only by motion → *WCAG 2.3.3, HIG.*
- **Interruptible:** a second click mid-animation must not queue or break state (guard like the theme curtain).
- **One thing moves at a time** in a region; stagger lists by ≤ `--stagger-step` and cap total stagger ≈ 500 ms.

### 3. Wayfinding and navigation
- **You-are-here:** the current nav item has `aria-current="page"` and a visible marker → *NN/g: navigation must show location.*
- **Back works like the visitor expects:** dialogs opened from a link close with Back; filters, sort and scroll survive a round trip to a detail view → *Baymard: return users to their list position.*
- **Page titles** (`<title>`) are unique and front-load the page name; headings form an outline (one `h1`, no skipped levels).
- **Skip link** reaches main content and is visible on focus.
- **Long pages:** a way back up or to the catalog on phones after a long scroll; anchors land below the fixed nav (`scroll-margin-top: var(--nav-height)`) → *WCAG 2.4.11 Focus Not Obscured.*
- **404 and dead ends** always offer a next step (home, search, catalog).

### 4. Accessibility (WCAG 2.2 AA quick list)
- **Focus visible** on every control, ≥ 2px, ≥ 3:1 against both neighbours; the site uses a 2px crimson ring with offset. Check it on crimson, black and white surfaces (crimson on crimson disappears: switch to a white/black ring there).
- **Focus not obscured (2.4.11):** tabbing never puts the focused element under the fixed nav or a sticky bar → add `scroll-margin`/`scroll-padding-top`.
- **Target size (2.5.8):** ≥ 24×24 px, or 24 px spacing. House target on touch: 44×44.
- **Names:** icon-only buttons have an accessible name that says the action and object ("Save Lamp to a list"); toggles expose `aria-pressed`, disclosures `aria-expanded`.
- **Live regions** for result counts and async results; not for every keystroke (debounce ~500 ms).
- **Dialogs** label themselves, trap focus, close on Escape, return focus (already in `Dialog.tsx`; check new ones use it).
- **Images:** product photos have meaningful alt (title is fine); decorative mascots `alt=""`.
- **Dragging (2.5.7):** any swipe has a button alternative (Quick View arrows already do).
- **Zoom/reflow:** 320 px wide / 400% zoom has no horizontal scroll and no clipped text.

### 5. Touch and phone ergonomics
- **Primary actions in the thumb zone** (lower half) on phones when a screen has one main action; avoid tiny controls in top corners.
- **44 px targets with ≥ 8 px gaps**; adjacent destructive and safe actions are separated.
- **Hover-only affordances** have a touch equivalent; use `@media (hover: hover)` for hover effects so taps don't leave a sticky hover state.
- **Inputs:** `font-size ≥ 16px` (iOS zoom), correct `type`/`inputmode`/`enterkeyhint`, `autocomplete` where it applies.
- **`touch-action: manipulation`** on buttons to drop the double-tap delay; `-webkit-tap-highlight-color: transparent` only if a pressed state replaces it.
- **Safe areas:** fixed bottom UI respects `env(safe-area-inset-bottom)`.
- **Horizontal scrollers** show a peek of the next item and have snap points; no scrollbar-less dead ends on desktop (arrows or wheel).

### 6. Typography and spacing rhythm
- **Body measure** 45–75 characters; article body ≈ 65ch.
- **Line height:** body 1.45–1.6, display .86–1.0 (tokens); never tight leading on wrapped body text.
- **Wrapping:** `text-wrap: balance` on headings, `text-wrap: pretty` on short paragraphs to avoid orphans; no widowed single word on display titles at 375 px.
- **Spacing** uses the `--space-*` scale only; related items closer than unrelated ones (proximity, Gestalt); section gaps consistent across pages.
- **Numerals** in counts and badges use `font-variant-numeric: tabular-nums` so they don't jitter.
- **Truncation** keeps titles readable (2-line clamp) and the full text available (title attribute or the detail view).
- **Uppercase eyebrows** keep the .32em tracking from the system; don't track body text.

### 7. Empty, loading and error states
- **Distinct states:** loading, empty-because-new, empty-because-filtered and failed each have their own message → *NN/g empty states: say what happened, why, what to do next.*
- **Empty-because-filtered** names the active filters and offers one-tap clear; never show "no results" while still loading.
- **Errors** say what failed in plain words, keep the user's input, and offer Retry.
- **Skeletons** match final layout dimensions (no layout shift, CLS ≈ 0); images reserve their aspect ratio.

### 8. Forms and inputs
- **Labels** visible (placeholders are not labels); errors next to the field, linked with `aria-describedby`, `aria-invalid` set; validate on blur or submit, not per keystroke.
- **Submit by Enter** works; buttons say the outcome ("Add list", not "OK").
- **Search fields** have a clear (×) button, `type="search"`, and keep the query when coming back.
- **Limits** (max length) are shown before they bite, as a count near the limit.

### 9. Catalog and e-commerce browsing (Baymard)
- **Applied filters** are visible together with a clear-all; result count updates and is announced.
- **Sort and filter** are near the list and labelled with the actual criterion.
- **Whole card is the hit area**, with one clear primary action; secondary actions (save) are visibly separate and don't trigger the primary.
- **Card consistency:** image ratio, title lines and action position align across a row regardless of content length.
- **Outbound links** say where they go ("on Amazon") and open in a new tab with an icon or text cue → *don't surprise users with context switches.*
- **Collections and related items** give a next step after every detail view (More like this, Back to list).
- **Position memory:** returning from a detail view restores scroll and the opener gets focus.

### 10. Small finishing details
- `::selection` colours from the palette; `accent-color` for native checkboxes and radios; `color-scheme` set per theme so scrollbars and form controls match.
- `cursor: pointer` only on things that act; `cursor: default` on disabled.
- Favicon, `theme-color` meta that follows the theme, and the tab title updates per route.
- Focus ring and hover colour consistent across links, pills, discs and cards.
- External links and share/copy actions give feedback ("Link copied").
- Smooth scrolling only when reduced motion is off.

## Findings template

| # | Page/area | Finding | Why | Fix | Effort | Recommend |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Nav | … | WCAG 2.4.11 | `scroll-padding-top` | S | Do |

Sources: W3C *What's new in WCAG 2.2*; NN/g *Response times: 3 limits*, *Empty states*, *Visibility of system status*; Material 3 motion (duration/easing tokens); Apple HIG (44 pt targets, motion); Baymard product list and filtering research; Laws of UX (Fitts, Hick, Doherty threshold, proximity).
