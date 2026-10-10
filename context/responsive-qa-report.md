# Responsive and theme verification

Checked on 8 October 2026. Existing reference animations and branding were preserved.

## Fixes

- `src/index.css`: constrained fields and panels, allowed narrow-screen button text to wrap, kept the mobile Picks circles in one row, provided separate 44px carousel-dot targets, and fitted the menu's decorative ring and links to short landscape viewports.
- `src/components/Dialog.tsx`: separated the fixed title/close area from the scrolling body, so long import and Quick View content cannot push the close button out of reach.
- `src/admin/Products.tsx`: used the stacked product rows below 1280px and aligned desktop header/row columns, including space for four 44px action buttons.
- `src/admin/Activity.tsx` and `src/admin/Settings.tsx`: stacked timestamps/actions beneath long content on phones instead of squeezing text between controls.
- `src/admin/Analytics.tsx`: stacked conversion date/commission fields on narrow phones, kept long breakdown labels from wrapping the count, and made the horizontal table region keyboard focusable.
- `src/admin/RecoveryCodes.tsx`: used one code column below 440px and allowed supporting text to wrap.
- `src/admin/SignIn.tsx`: gave alternate sign-in choices 44px-high targets.
- `src/components/StorefrontSections.tsx`, `src/components/SiteChrome.tsx`, and `src/index.css`: removed the Story section's forced-white editorial theme. Its background, text, grid, ambient wash, mascot disc and navigation now follow light/dark mode.
- `scripts/ui-fixture-preview.mjs`: expanded isolated synthetic QA fixtures with long titles/specifications, missing images, populated admin rows and simulated loading failures. This server never contacts the database; writes deliberately fail.

## Browser coverage

| Surface | Representative CSS viewport widths |
| --- | --- |
| Storefront, Story, Picks, catalog, footer, long Quick View | 320, 390, 768, 1024, 1440, 1920, 2560 |
| Populated admin overview, products, analytics, activity, account | 390, 768, 1024, 1440, 1920, 2560; additional 320px phone checks |
| Sign-in, incomplete invitation, not-found page, mascot studio | 320, 390, 768, 1024, 1440, 1920, 2560 |
| Product editor, discard/delete confirmation, passkey rename, conversion form | 320, 390, 768, 1024, 1440 |
| All routes above in short landscape | 844 × 390 |

The tested settled layouts have no page-level horizontal scrolling. Wide analytics tables intentionally scroll inside their labelled regions. Long product names and specification values wrap inside their containers. Desktop Story text remains clear of the mascot; mobile content stacks naturally. The footer heart mascot was visually confirmed in the active browser tab.

Interaction checks covered carousel buttons and keyboard activation, View Details/Quick View, search with no matches, sorting, import-preview application, discard/cancel, dialog Escape closure, focus wrapping and focus restoration. The reset confirmation was inspected and cancelled. Real database writes, passkey registration and destructive actions were not performed.

Additional states checked on a narrow phone: empty catalog, single featured item (no redundant carousel arrows), missing-image fallback, catalog failure/retry, analytics failure, and signed-out recovery form. Dark/light Story switching was verified on the live development server, including a 320px phone.

## Existing checks

- `npm run build`: passed, including TypeScript. Existing large-chunk warning for the mascot studio remains.
- `REQUIRE_INTEGRATION_TESTS=1 npm test`: **124 passed, 0 failed, 0 skipped**. Integration tests used disposable local PostgreSQL.
- `git diff --check`: passed; Git only reported line-ending conversion notices.

The first sandboxed test run could not initialise temporary PostgreSQL and skipped integration suites. The complete run above was repeated with the required permissions and no skipped suites.

## Evidence

Raw geometry checks and logs are local QA artifacts:

- `../.tmp/responsive-qa/geometry.json`
- `../.tmp/responsive-qa/final-checks.json`
- `../.tmp/responsive-qa/build.log`
- `../.tmp/responsive-qa/tests-full.log`
- `../.tmp/responsive-qa/menu-landscape.jpg`
- `../.tmp/responsive-qa/footer-phone.jpg`
- `../.tmp/responsive-qa/quick-view-phone.jpg`
- `../.tmp/theme-check/story-dark-desktop.jpg`
- `../.tmp/theme-check/story-dark-mobile.jpg`

Some immediate measurements capture entrance transforms that temporarily scale controls. Settled controls were rechecked. Background browser tabs did not consistently trigger intersection-observer reveals; final footer and theme visuals were checked in the active tab. Browser coverage used Codex's Chromium-based in-app browser rather than a cross-browser device lab.

The full development server remains running on port 3010. The isolated fixture server was stopped after verification.

## Reverted follow-up: hero crop and scroll alignment

This follow-up was reverted after feedback that it changed the original composition. The mascot is again an independent foreground layer, with the previous size, positioning and page-speed movement. The title, circle, captions, footer and monochrome strap retain their slower scroll movement. The original scroll-triggered red divider is preserved. Dark-mode and the earlier responsive fixes remain.

The `hero-alignment-*` screenshots and geometry describe the reverted attempt and are not evidence of the current layout.

## Mobile foreground handoff follow-up

The user requested a large foreground raccoon and the same scroll speed difference as desktop. The geometry calculation now uses the desktop 57% lag on phones and tablets. Below 1200px, the existing foreground image is 112% of the poster-stage height and extends across the monochrome strip. Footer padding reserves its overhang, with a short mask softening the image's lower edge. Desktop positioning remains unchanged.

Checked 320, 390, 520, 768, 1024, approximately 1200, and 1440px widths, plus 390 × 1000 and 844 × 390. No page-level horizontal overflow was observed. Settled Browse controls remain 44px high, and tablet/phone supporting copy clears the mascot. Short screens retain natural vertical scrolling. Phone and tablet measurements both showed 109.09px of mascot travel versus 46.91px of poster travel. Reverse scrolling restores zero lag and the hidden divider. The carousel changed to Logitech, View Details opened its specification dialog, and Escape dismissed it.

`npm run build` passed (the existing mascot-studio chunk warning remains). The focused hero and Story suites passed all 12 tests. These checks supplement the earlier full-suite result above; the full backend suite was not rerun for this follow-up.

Evidence: `.tmp/responsive-qa/mobile-handoff-geometry.json`, `mobile-handoff-phone-start.jpg`, `mobile-handoff-phone.jpg`, `mobile-handoff-tablet.jpg`, and `mobile-handoff-build.log`.

## Screen-size optimisation pass (10 October 2026)

An automated audit loaded every route (storefront, admin overview/products/analytics/activity/account, sign-in, not-found) at 320, 375, 414, 600, 768, 900, 1024, 1280, 1440, 1920 and 2560px plus 844 × 390 landscape. No page-level horizontal scrolling was found. Fixes for the remaining findings:

- Catalog grid adds a 5th column from 1700px and a 6th from 2300px (`--breakpoint-3xl`/`--breakpoint-4xl` in `src/index.css`), so cards stay ~340–385px instead of ~590px on 1920–2560px displays. Named rem breakpoints are required: arbitrary `min-[…px]` variants were emitted before `lg:` and lost the cascade.
- Story section on tablets (640–1023px): the find card spans the row and the two blurbs sit side by side instead of one narrow column.
- Find card kicker and tile captions raised from 8–9px to 10px.
- 44px-high targets for the storefront and admin header logo links and the product editor's "Feature" checkbox; product-list checkboxes get a 40 × 44px label hit area without changing their look.

`npm run build` passed; `npm test`: 125 passed, 0 failed.
