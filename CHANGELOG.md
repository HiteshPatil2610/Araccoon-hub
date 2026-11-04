# Changelog

Notable changes to Araccoon Hub. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed (licence)

- **Code licence changed from MIT to PolyForm Noncommercial 1.0.0.** Commercial use now needs a licence from the author. Copies taken before this change (up to commit `75551df`) remain under MIT. Contributors grant the author the right to use their contributions commercially (see CONTRIBUTING.md).

### Added

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
