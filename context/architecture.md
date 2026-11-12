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
| Products, affiliate links | Postgres `products` | Edited in the owner hub; visitors get `toPublic` fields only |
| Clicks, conversions | Postgres `clicks`, `conversions` | Product snapshot kept; 90-day click retention (daily cron) |
| Owners, passwords, passkeys, sessions, recovery codes, invites, audit log | Postgres | Passwords (migration 6), session and recovery secrets stored only as hashes |
| Short storefront copy | Postgres `site_text` (migration 5) | Key/value; a missing row means the default in `shared/siteText.ts` |
| Articles | `content/articles/*.md` in git | Compiled to `shared/generated/articles.ts` (gitignored) by `scripts/articles.ts` |
| Product images | Cloudinary | Signed direct uploads into one folder |
| Mascot art, share image | `public/` | Static assets |

## Public pages (Worker-rendered)

`run_worker_first` in `wrangler.jsonc` sends `/`, `/articles`, `/articles/*`, `/robots.txt` and `/sitemap.xml` to the Worker (`worker/routes/pages.ts`). It reads the built `index.html` through the `ASSETS` binding and fills in the title, description, canonical URL, Open Graph/Twitter tags, JSON-LD, a `<noscript>` text version, and a `<script type="application/json" id="rh-initial">` payload (site text plus the products the page shows). The React app reads that payload (`src/lib/initialData.ts`), so the first render makes no API call; later in-app navigation uses the API. In production the rendered HTML is cached in `caches.default` for 60 seconds; a database error still renders the page with defaults, uncached. Outside production, pages are `noindex` and `robots.txt` disallows everything. The site origin is `PASSKEY_ORIGIN` in production and the request origin elsewhere.

HTML responses get the page security headers from `worker/lib/pageHeaders.ts` (identical to `public/_headers`, enforced by a unit test); API responses keep the locked-down API CSP. Local development omits the page CSP because Vite's hot-reload preamble is an inline script.

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
