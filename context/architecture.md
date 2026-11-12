# Architecture — Araccoon Hub

Updated 3 November 2026 (pages, site text and articles added; earlier sections from 3 October 2026).

## Runtime

- React 19, React Router, Vite 8, Tailwind 4; Bebas Neue and Archivo are bundled locally via @fontsource.
- Cloudflare Worker serves static assets and the Hono API, and renders the public pages (see below). PostgreSQL is reached through Hyperdrive. The owner bundle and Recharts load on owner routes.
- `src/lib/api.ts` is the HTTP boundary; shared types and Zod schemas live in `shared/`. The server remains authoritative for validation and authorization.
- `src/pages/Storefront.tsx` owns discovery and quick view. `src/components/ProductCard.tsx` is the catalog card; `ProductImage.tsx` provides stable image fallbacks. The featured board uses `src/lib/catalog.ts`.
- `src/admin/` contains password and passkey sign-in, products/editor, reporting, overview, account/security and audit activity. Existing draft, archive, duplication, bulk operations, account invitations and conversion recording remain supported.
- `Dialog.tsx` and `useDialog.ts` provide labelled modals, initial focus, keyboard containment, inert background, Escape, scroll lock and focus return. Pending writes disable dismissal. Confirmations initially focus Cancel.

## Storage model

| Data | Source of truth | Notes |
| --- | --- | --- |
| Products, affiliate links | Postgres `products` | Edited in the owner hub; visitors get `toPublic` fields only (including the optional `pick_note`, migration 7) |
| Clicks, conversions | Postgres `clicks`, `conversions` | Product snapshot kept; 90-day click retention (daily cron) |
| Owners, passwords, passkeys, sessions, recovery codes, invites, audit log | Postgres | Passwords (migration 6), session and recovery secrets stored only as hashes |
| Collections | Postgres `collections`, `collection_products` (migration 8) | Slug is set from the title at creation and never changes; finds are ordered by `position`; deleting a product removes it from its collections |
| Short storefront copy | Postgres `site_text` (migration 5) | Key/value; a missing row means the default in `shared/siteText.ts` |
| Articles | `content/articles/*.md` in git | Compiled to `shared/generated/articles.ts` (gitignored) by `scripts/articles.ts` |
| Product images | Cloudinary | Signed direct uploads into one folder |
| Mascot art, share image | `public/` | Static assets |

## Public pages (Worker-rendered)

`run_worker_first` in `wrangler.jsonc` sends `/`, `/articles`, `/articles/*`, `/find/*`, `/collections/*`, `/robots.txt` and `/sitemap.xml` to the Worker (`worker/routes/pages.ts`). It reads the built `index.html` through the `ASSETS` binding and fills in the title, description, canonical URL, Open Graph/Twitter tags, JSON-LD, a `<noscript>` text version, and a `<script type="application/json" id="rh-initial">` payload (site text plus the products the page shows). The React app reads that payload (`src/lib/initialData.ts`), so the first render makes no API call; later in-app navigation uses the API. In production the rendered HTML is cached in `caches.default` for 60 seconds; a database error still renders the page with defaults, uncached. The home page also carries a `<link rel="preload">` for the hero mascot image (`PageMeta.preloadImage`), and `index.html` preloads the two first-screen fonts, so they start downloading before the scripts run. Outside production, pages are `noindex` and `robots.txt` disallows everything. The site origin is `PASSKEY_ORIGIN` in production and the request origin elsewhere.

HTML responses get the page security headers from `worker/lib/pageHeaders.ts` (identical to `public/_headers`, enforced by a unit test); API responses keep the locked-down API CSP. Local development omits the page CSP because Vite's hot-reload preamble is an inline script.

## Shareable finds

Each published find has an address `/find/<title-slug>-<first 8 id characters>` (`shared/finds.ts`). Only the id part identifies it, so links survive title edits; the canonical link always names the current address. The Worker renders it as the storefront (same embedded catalog) with the find's title, description (the pick note, else its description), image as the share image, and a noscript block whose Amazon link is the tracked `/r/:id`. An unknown, draft or archived find returns 404 with `noindex` and the app shows the storefront with a message. In the app, `/find/:slug` is a child route of `/`, so the storefront stays mounted and the quick view is derived from the address: opening one pushes the address (scroll and filters kept), closing goes Back when it was opened in the app and replaces with `/` when the visitor arrived by link. Quick views on article pages stay local state but share the same link. The sitemap lists published finds when the database answers.

## Listing check

`worker/lib/linkCheck.ts` asks Amazon whether a find's listing still exists. It requests only the clean product page built from a validated marketplace and ASIN (never the tagged affiliate URL, so no click is attributed), follows at most two redirects and only to the same product, and records `ok` (page loads), `gone` (HTTP 404) or `unknown` (short links, bot checks, errors, timeouts, redirects elsewhere) in `products.link_status` / `link_checked_at` (migration 9). It runs after the daily maintenance for the 10 published finds checked longest ago, and on demand from `POST /api/admin/products/check-links` (owner, 6 runs an hour, audited). Changing a product's Amazon link clears the result. The result is owner-only (`Product.listing`), shown as a chip in Products and a banner on the Overview; nothing is unpublished automatically.

## Visitor extras

- **Surprise me** (`pickSurprise` in `src/lib/catalog.ts`): a random find from the filtered list (or the whole catalog when the filters match nothing), never the open one and none twice until all were shown; it opens the find's `/find/` address with `surprise` in the navigation state.
- **Browsing in Quick View** (`neighbours`, `relatedFinds` in `src/lib/catalog.ts`, wired in `ProductOverlays` through `browse`, `pool` and `onShow`): previous/next through the list the page shows, wrapping, and a "More like this" row from the page's finds (the whole catalog on the storefront). On the storefront each step replaces the `/find/` address and keeps the `inApp` navigation state, so closing still returns in one step.
- **Stash lists** (`src/lib/stash.ts`, `src/components/ListPicker.tsx`, `src/pages/Stash.tsx`): named lists of saved find ids in `localStorage` (`araccoon_lists`: `{ lists: [{ id, name, ids }], last }`; at most 20 lists of 100 finds, names plain text up to 60 characters with control and direction-override characters removed, all validated on read). A find can be in several lists; `last` is the list used most recently and receives one-tap saves. The older single stash (`araccoon_stash`) seeds the first list, "Your stash", and is removed at the first change; the keys of the removed return-visit features (`araccoon_last_visit`, `araccoon_recent`) are deleted on first read. Shared between components through `useSyncExternalStore` and between tabs through the `storage` event; `onFindSaved` tells listeners (the nav's stash button) when this tab adds a find to a list (`addedFind`). Nothing is sent to the server. `/stash` and `/stash/shared` are client routes served by the static app shell (not Worker-rendered, so link previews show the site's general card and no visitor-written text), `noindex`, and disallowed in the production `robots.txt`.
- **Shared lists** (`src/lib/stashShare.ts`): the link carries the list: `/stash/shared?name=<name>&finds=<8-character id prefixes joined by dots>` (the same short ids as `/find/` addresses, at most 100). It is a snapshot: later edits to the sender's list are not shared. The page matches the prefixes against the published catalog, keeps the sender's order, counts unknown ones, and "Save a copy" creates a list with that name in the recipient's browser. Outbound clicks from these pages are tracked as `stash`/`stash_card` and `shared_list`/`shared_list_card`.
- **Find of the day** (`findOfTheDay`, `siteDay` in `src/lib/catalog.ts`): the day is taken in Asia/Kolkata so every visitor shares it; finds with an image are put in a fixed order by an FNV-1a hash of their id and take turns by day number, so none repeats until all have had a day (adding or removing finds reshuffles the cycle). Computed in the browser; no server state.
- **Journal feed**: `GET /articles/feed.xml` (RSS 2.0, published articles, summaries only), advertised with a `<link rel="alternate">` on journal pages (`PageMeta.feedUrl`).

## Collections

A collection is a titled, ordered list of products (`shared/collections.ts`, `worker/repo/collections.ts`, `worker/routes/collections.ts`). Visitors only ever see a collection that is published **and** has at least one published find; drafts, empty lists and unpublished finds inside a list are filtered in SQL, and responses use `toPublic` like the catalog. `GET /api/collections` lists summaries (title, count, first find's image); `GET /api/collections/:slug` returns one with its finds. Owner routes under `/api/admin/collections` (list, create, patch, delete) are validated with the shared schema, rate-limited and audited; a list naming an unknown product is refused and nothing is written. The Worker renders `/collections/<slug>` with the collection embedded (`InitialData.collection`), its description and first image for link previews, and 404 + `noindex` when it is not visible. The home and find pages embed the summaries (`InitialData.collections`); the storefront shows them as links above the catalog search and hides the block when there are none or they cannot be loaded. Owner hub page: `src/admin/Collections.tsx`.

## Content editing

- Site text: `GET /api/site-text` (public), `GET`/`PUT /api/admin/site-text` (owner, validated, audited; `null` resets a field). Owner hub page `src/admin/SiteText.tsx`, grouped into Announcement, Home page, Footer and Search results; storefront reads it through `useSiteText()`. Fields are defined in `shared/siteText.ts`: the four hero taglines, hero introduction, empty-catalog heading, footer line, search title and description are required (empty is refused; reset restores the default). The announcement and its link are optional (empty hides the bottom banner, `Announcement` in `SiteChrome.tsx`); the link must be a site path or an `https://` address. Rows for removed keys are ignored.
- Articles: Markdown with strict front matter. The compiler escapes raw HTML, requires alt text, rejects `#` headings and direct Amazon links; products are referenced by id and rendered as cards with tracked links (`utm_source=article`). Drafts compile only in dev. It runs before build, typecheck and test, and live in dev through a Vite plugin.

## Invariants

- Visitors never receive affiliate URLs; every outbound click goes through `/api/track` or `/r/:id`.
- Embedded JSON and HTML are escaped (`serializeInitialData`, `escapeHtml`); articles never contain raw HTML.
- The server validates and authorizes everything; client checks are only for feedback.
- Pages must render (with defaults) when the database is down.

## Security boundaries retained

Owner authentication offers email + password and passkeys side by side, with server-side HttpOnly cookie sessions and one-time recovery codes; no browser JWT storage. Passwords are optional per owner, at least 12 characters, and stored only as PBKDF2-SHA256 (100 000 iterations, the Workers maximum) over an HMAC of the password with `RECOVERY_CODE_PEPPER`, with a random salt per password (`worker/lib/password.ts`). Password sign-in requires Turnstile, is rate-limited per IP and per account, and gives the same error and work for unknown emails. Changing a password needs the current one and revokes other sessions. First-owner setup (`OWNER_SETUP_TOKEN`) can create the account with a password or a passkey and closes once any owner has either. Recovery sessions are limited to enrolling a replacement passkey or setting a new password. An owner can remove their last passkey only if they have a password, and their password only if they have a passkey. `npm run owner:password -- --target=dev|prod` resets a password directly in the database when locked out. The development-only token sign-in is shown on the sign-in page with instructions only when `ENVIRONMENT=development` and `DEV_LOGIN_TOKEN` are set. Origin checks, bot checks, rate limits, server validation and trusted Amazon destination policy remain enforced independently of UI controls.

Images use signed direct Cloudinary uploads and the existing server/preset restrictions. Client guidance and preflight checks retain the 8 MB limit and JPG/PNG/WEBP/GIF formats. Upload byte progress is real XHR progress, not elapsed-time estimates. No upload security mechanism was removed.

Outbound actions reserve a tab synchronously, request tracking with a shared click key, and fall back to `/r/:id` after the existing 4-second tracking timeout/error. Server deduplication and owner test-click exclusion remain intact. Visitor-facing data does not expose stored affiliate URLs.

## Reporting contracts

Reports support 7/30/90-day UI selections backed by server queries, calendar dates in the configured timezone, previous-period comparisons, recorded conversion events and daily anonymous identities. `generatedAt` is report construction time. The response now includes the existing configured `retentionDays`; it adds no new data collection.

The recent table is the latest 50 retained clicks across history, independent of report selection. Conversion management loads the latest 200 records. The existing CSV endpoint exports a **rolling** selected number of days, up to 50,000 rows, with ISO/UTC timestamps and spreadsheet formula protection. This differs from the calendar-date report boundary and is labelled explicitly. No full-period recent-table search or new reporting API was invented.

## Verification tooling

`npm run build` and `npm run dev` use Vite's runner config loader because bundling native Tailwind dependencies failed on Windows with the default loader. `npm test` uses an isolated disposable PostgreSQL cluster and never loads application secrets. `scripts/ui-fixture-preview.mjs` serves built assets and isolated QA responses on loopback port 5174; it has no database or external upload/tracking integration and is not deployed.
