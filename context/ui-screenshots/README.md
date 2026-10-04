# Redesign verification captures

Date: 3 October 2026. All `fixture-*` images use the isolated built-asset QA server on loopback port 5174. Product names are labelled Fixture; raccoon-logo images are test placeholders. Zero analytics are test responses, not measured business activity. No real catalog records were written.

`matrix.json` records the 24 primary combinations, actual viewport width, theme, document clientWidth/scrollWidth and storefront selected controls. In every primary capture, document scrollWidth equals clientWidth. Captures are full-page JPEGs unless the filename describes a dialog.

## Main matrix

- `fixture-storefront-{375|768|1440}-{light|dark}-{bento|classic}.jpg`
- `fixture-products-{375|768|1440}-{light|dark}.jpg`
- `fixture-analytics-{375|768|1440}-{light|dark}.jpg` — zero activity fixture

## Scenario captures

- `fixture-quick-view-1440-light.jpg`
- `fixture-editor-errors-375-light.jpg`
- `fixture-save-failed-375-light.jpg`
- `fixture-delete-confirmation-375-light.jpg`
- `fixture-delete-failed-375-light.jpg`
- `fixture-analytics-unavailable-375-light.jpg`
- `fixture-analytics-zero-table-375-light.jpg`
- `fixture-catalog-failed-375-light.jpg`
- `fixture-storefront-320-light.jpg`, `fixture-no-results-320-light.jpg`
- `fixture-one-featured-320-light.jpg`, `fixture-no-featured-320-light.jpg`
- `fixture-sign-in-375-dark.jpg`, `fixture-recovery-failed-375-dark.jpg`
- `fixture-editor-errors-320-light-final.jpg`, `fixture-save-failed-320-light-final.jpg` — final editor and supported affiliate fields
- `fixture-desktop-preview.jpg` — final 1440px viewport composition

`contrast-pairs.json` contains sampled rendered solid text/action colors and calculated WCAG contrast ratios in both themes; minimum 6.06:1. It does not audit every hover, opacity, image or focus state.

The primary matrix is refreshed after implementation refinements. Scenario captures show the exercised state and may precede final small typography/fallback refinements. Sticky headers are rendered at the capture's current scroll position in older scenario full-page images; this is a capture artifact. Final matrix captures start at scrollY=0. Successful real upload and production outbound screenshots were unavailable and are not represented by fixture success images.

See [progress tracker](../progress-tracker.md) for executed checks and limitations.

The real empty catalog was inspected at the beginning of browser verification. Returning to the real dev tab for a saved final capture hit in-app browser/CDP timeouts, including a fresh tab; no final real-data screenshot is claimed. The local dev server still returned HTTP 200 to a direct read check.
