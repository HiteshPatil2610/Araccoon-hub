# Implemented UI — Araccoon Hub

Updated 3 October 2026. The Cine Daily design system (handoff bundle in the repo root) replaced the brutalist theme. Current source is authoritative; the attached brief's old component names, password auth and 14-day reporting assumptions do not describe this app.

## Identity and foundations

Cine Daily: a three-note palette of near-black `#0A0A0A`, white and crimson `#C8202F`, with a pink `#E2457E` seam only where the dark hero hands off to the catalog. Bebas Neue (all-caps display, very large) and Archivo (body; 11px uppercase eyebrows with .32em tracking) are self-hosted via @fontsource because the CSP allows fonts from self only. `src/index.css` holds the design-system primitives (`--cd-*`, spacing, radii, easing, durations) and the semantic theme tokens: white page / black page in dark mode, inverted fill for selected states (`sun`), crimson for live/positive emphasis (`mint`) and actions (`primary`), a pale red tint for warnings (`coral`). Pills and circles for controls, 22px panels with hairline edges, no hard shadows. Editorial and motion primitives (Reveal, TrackingReveal, ScrambleText, SectionLabel, Blurb, IndexBadge, Sticker, Viewfinder, FilmStrip) live in `src/components/cine.tsx`; entrances replay on re-entry and render their final state under reduced motion. The storefront has a fixed nav that is transparent over the black hero (viewfinder, red disc, mega tracking title, film strip that turns red on scroll, featured picks on white discs) and solid below it. The owner hub uses a black rail in both themes. No emoji.

The circular theme reveal is 420ms and anchored to the control. Rapid toggles are guarded; rejected transitions clean up their classes. Reduced motion and unavailable View Transitions switch immediately. MotionConfig respects the user's preference, CSS suppresses nonessential motion, and chart entrance animations are disabled. Runtime reduced-motion emulation was unavailable; see the verification limits.

## Storefront

Header includes identity, Browse, Owner Hub and a named theme control, plus a keyboard skip link. Search lives beside catalog discovery rather than competing with header navigation. The hero promise is “Small finds. Big everyday upgrades.” Its curiosity board draws only explicitly featured records with nonempty image URLs, newest first with ID ties, maximum three. Narrow screens show one preview; none/one/two records adapt without filler cards. Every preview opens the existing quick-view dialog. The Browse CTA scrolls to and focuses the catalog heading, respecting reduced motion.

Categories wrap and expose pressed state. Active filter text and a single Clear filters action appear together; result count is announced politely. Sorting labels reflect the actual criterion, including owner-supplied review counts. Named Bento and Classic buttons preserve current filters and focus. Bento retains wider spans without dense visual reordering; narrow grids use one column. Images use contain, with stable unavailable-image fallbacks. Public rating displays were removed because they are owner-supplied, not live Amazon ratings. Real owner badges remain part of the supported product model.

Catalog loading, empty catalog, no matches and request failure are distinct. Failure includes Retry; a genuinely empty catalog does not offer Clear filters. Browsing has no analytics dependency. Quick view preserves filters/layout, has a stable image fallback, readable description and a cobalt outbound action. Existing outbound timeout, tab reservation and deduplication remain. Pending actions are guarded and visibly disabled; opening, opened and blocked-tab recovery have different messages. No price, discount, stock, purchase or popularity data was added.

## Owner workspace and forms

Desktop uses the existing navigation rail; mobile/tablet use wrapping navigation above the workspace with storefront return, theme and sign-out controls. Products and Analytics remain primary work areas, while the supported Overview, Activity and Account destinations are retained. NavLink identifies the current destination programmatically. No password screen was introduced: sign-in/recovery use existing passkey and recovery-code services.

The editor groups product details, image, Amazon destination and display details, reuses the API/shared schemas, and focuses the first invalid field. Existing server-backed optional Associates tag/sub-ID values are editable and preserved when saving. Field errors are associated via aria-invalid/aria-describedby and a summary announces validation. Failed saves preserve entered values and unlock submission. A synchronous guard prevents duplicate saves; close/cancel/Escape are blocked while writing or uploading. Closing a changed draft opens a safe unsaved-changes confirmation; no persistence across reloads is promised.

The image chooser is keyboard-accessible and displays actual formats/8 MB guidance. Selected/uploading/failed/stored states differ. Only a successful response sets the stored reference and “Image uploaded. Save the product to apply it.” Selecting/replacing/typing a URL clears stale success feedback. XHR uses actual byte progress and a 60-second timeout; object URLs are revoked. Other product fields survive upload failure. Successful real storage was not browser-verified.

Product deletion names the exact product or selected count, focuses Cancel, prevents concurrent deletion, blocks dismissal while pending and preserves the dialog with an inline error on failure. No Undo was invented. Duplicate, bulk and account actions retain supported behavior with submission guards. Account rename failures retain their values; account confirmation errors are inside the modal. Failed sign-out does not falsely present a completed server logout.

## Reporting

Analytics is a refreshed snapshot, not “live.” Calendar period, timezone, generated time, retention metadata, visitor-day definition and recorded conversion meaning are explicit. Summary and conversion requests settle independently. Initial failures show unavailable values (dashes), not zero; refresh failures retain the previous report with a warning. Request sequencing prevents slow older periods overwriting newer selections.

Charts have units and an accessible daily-count table; animation is disabled. Summary panels stack on narrow screens and tables have contained horizontal scrolling. Recent activity and conversion records show their actual 50/200-record scopes. CSV remains the real server-backed rolling-period export, with its 50,000-row cap and difference from calendar dates disclosed. Spreadsheet protections were retained. Zero activity follows a successful response; it is never substituted for failed responses.

## Verification status

The 24 requested 375/768/1440 viewport/theme/layout combinations were browser-checked and captured using clearly named isolated QA fixtures; each had scrollWidth equal to clientWidth. The real local catalog was empty and its empty state was checked. Keyboard dialog checks, filter/no-results recovery, catalog Retry, editor validation/save failure, unsaved-change cancellation, delete cancellation/failure, analytics zero/unavailable/retry and invalid file selection were checked. See [progress tracker](progress-tracker.md) and [screenshots](ui-screenshots/README.md).

No full WCAG conformance claim is made. True 200% browser zoom, assistive-technology announcements, real device touch/keyboard behavior, successful external upload/storage, actual passkey device prompts, runtime reduced motion, forced popup blocking/slow tracking and production end-to-end activity remain unverified. A representative-user usability study has not been conducted.
