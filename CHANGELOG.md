# Changelog

Notable changes to Araccoon Hub. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added (compare in collections, 14 November 2026)

- **Compare on collection pages:** when a collection has at least two finds with specs, visitors can pick two to four of them and see brand, tier and specs side by side. Rows that differ are marked, "Only show what differs" hides the rest, and the choice is kept in the address (`?compare=`), so a comparison can be shared. A collection such as "Mice" is how the owner decides what can be compared.
- `npm run db:seed` adds nine invented sample finds (mice, keyboards, headphones, one per tier) and a sample collection for each type to dev databases.

### Added (product facts, 14 November 2026)

- **Brand, product type, tier and specs** on each find (all optional; migration 10). The tier (Budget, Value for money, Premium) is the owner's judgement, not a price. Specs are name and value rows, with the usual row names offered for common product types so finds of one type can be lined up later.
- **Tier filter** on the storefront (shown once any find has a tier, kept in the address as `?tier=`), and the tier, brand and product type shown in Quick View. Search also matches brand and product type.
- The product editor has a **Compare details** section, and can add specification rows fetched from an Amazon page.

### Changed (UI/UX polish, 13 November 2026)

- **Phones:** finds show two to a row in compact cards, and the category filters are one row you can swipe sideways, so the first finds appear much sooner.
- **Easier to find your way:** the nav marks the Journal and Stash pages you are on; section links and "Browse the finds" from other pages go straight to that part of the storefront without reloading; the 404 page and the end of an article offer next steps.
- **Search:** your search stays in the address (reload or share it), the phone keyboard closes on Enter, and there is one clear button instead of two.
- **Feedback:** messages slide in gently and stay while you point at or focus them, and deleting a stash list can be undone.
- **Accessibility and finish:** a visible focus ring on the sort control, keyboard focus kept clear of the fixed nav, a quieter result count for screen readers, no stuck hover colours after a tap, a phone browser bar that matches the theme, evenly wrapped headings, and the owner's badge in Quick View.
- Added a project skill, `.claude/skills/ui-ux-polish`, with the checklist used for this pass.

### Changed (colour balance)

- **Theme switch:** the new theme now bleeds out from the toggle like ink in water, replacing the expanding circle.
- **Menu button:** on phones it stays in place and its two lines fold into a cross.
- **Product cards:** simpler cards that open Quick View first. A click anywhere on a card opens its Quick View, where the Amazon button now lives; the card's save button moved to the image's top-right; the "Pick" sticker, number badges and the card's Amazon button were removed.
- **Colour balance:** about 60% page colour, 30% its opposite and 10% crimson in both themes. In light mode the hero, picks and footer are now white; in dark mode product cards and the story section are white; the footer wordmark sits on a crimson band.

### Changed (licence)

- **Code licence changed from MIT to PolyForm Noncommercial 1.0.0.** Commercial use now needs a licence from the author. Copies taken before this change (up to commit `75551df`) remain under MIT. Contributors grant the author the right to use their contributions commercially (see CONTRIBUTING.md).

### Added

- **Stash button in the nav:** a bookmark beside the theme toggle with the number of saved finds leads to Your lists; saving a find makes it flash crimson, flip its bookmark and roll the count up (just the count under reduced motion). It replaces the "Your stash n" pill beside Surprise me. On Your lists it turns into a home button that goes back to the page the visitor came from.
- **Box flaps into and out of Your lists:** two crimson flaps close from the top and bottom with YOUR STASH across the seam while the page changes, then open again; the same on the way out.
- **Find of the day:** the raccoon's pick at the top of the catalog, the same find for everyone, a new one daily. ("New since last visit" and "Pick up where you left off" were added and removed again the same day.)
- **Stash lists:** visitors can keep several named lists of finds ("Gift ideas", "Desk setup"…), put a find in more than one, and share a list as a link; the recipient can save a copy. All kept only in the visitor's browser (`/stash`, `/stash/shared`).
- **Browse inside Quick View:** previous/next arrows on the photo, arrow keys and swipes step through the finds the page shows, with a count, and a "More like this" row of up to four other finds (same category first) opens them in place.
- **Surprise me:** a random find with the mascot, plus mascot art on the empty-search panel and the 404 page.
- **Your stash:** visitors can save finds; the list is kept only in their browser.
- **Journal RSS feed** at `/articles/feed.xml`.
- **Listing check:** a daily (and on-demand) check that flags finds whose Amazon listing returns "not found" in the owner hub (migration 9).
- **Collections:** owner-made themed lists of finds with their own pages (`/collections/<slug>`), managed in a new owner hub page, linked from the storefront and listed in the sitemap (migration 8).
- **Shareable finds:** every find has its own link (`/find/<title>-<id>`) that opens its quick view, with its own title, description and preview image, a Share button, and an entry in the sitemap.
- **Why we picked it:** an optional owner note (up to 280 characters) on each find, edited in the product editor and shown at the top of Quick View (migration 7, `products.pick_note`).
- The home page preloads the hero mascot image and the two first-screen fonts.
- Code of conduct, issue and pull request templates, CODEOWNERS, Dependabot config and this changelog.
- [Public-repo checklist](docs/OPEN_SOURCE_CHECKLIST.md) with the maintainer's remaining manual steps.

### Changed

- Blender and poster art scripts find their folders relative to the repo instead of a fixed local path, and fall back to bundled fonts when Windows fonts are missing.

### Removed

- Blender render logs (they held local paths) from version control; they are now ignored.
- The promo video's design-system handoff folder (`video/araccoon-promo/design-system/`) from the repository; it is kept private.

## [0.1.0] - 2026-11-03

First public release.

### Added

- Storefront with hero, featured picks, story section, catalog search, category filter, sort and quick view.
- Tracked, tagged outbound Amazon links (`/r/:id`, `/api/track`) limited to trusted Amazon hosts.
- Owner hub: passkey sign-in, recovery codes, invites; products (create, import from an Amazon link, edit, bulk actions, images); analytics with CSV export and conversions; activity log; account and sessions.
- Editable site text stored in the database and edited in the owner hub.
- Markdown articles in `content/articles/`, compiled at build into journal pages.
- Worker-rendered pages with embedded data, share tags, JSON-LD, `robots.txt`, `sitemap.xml` and a share image.
- MIT licence for code, CC BY-NC 4.0 for the mascot and artwork; contributing guide and security policy.
- CI: typecheck, tests, build and `npm audit` on every push and pull request.

[Unreleased]: https://github.com/HiteshPatil2610/Araccoon-hub/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/HiteshPatil2610/Araccoon-hub/releases/tag/v0.1.0
