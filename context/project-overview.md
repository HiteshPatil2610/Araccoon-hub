# Project overview — Araccoon Hub

Updated 3 November 2026.

## What it is

Raccoon Hub ("Small finds. Big everyday upgrades.") is a curated Amazon affiliate storefront. Visitors browse hand-picked products and open them on Amazon in a new tab; the site earns through the Amazon Associates program. A private owner hub manages the catalog, the site's short copy, analytics and account security. The raccoon mascot and the Cine Daily look (near-black, white, one crimson) are the brand.

The project is public and source-available: code under PolyForm Noncommercial 1.0.0 (`LICENSE`), mascot and artwork under CC BY-NC 4.0 (`LICENSE-ART.md`). Others may use it only non-commercially; the owner keeps all commercial rights and may sell commercial licences. Releases before 4 November 2026 were MIT. Repository: https://github.com/HiteshPatil2610/Araccoon-hub (public).

## Goals

- A fast, distinctive storefront that makes finds easy to browse and open on Amazon.
- Honest affiliate behaviour: every outbound click is tracked, tagged and disclosed; no fake prices, ratings, stock or urgency.
- An owner hub one person can run without a CMS or paid editor.
- Secure by default (hashed passwords or passkeys, strict CSP, rate limits) and free-tier friendly to host.
- Search-engine and link-preview friendly public pages.

## Users

- **Visitors**: anonymous, no accounts. They browse, search, filter, open and share quick views, read articles and go to Amazon.
- **Owners**: one or more people who sign in with a password or passkey and manage products, site text and settings, and read reports.
- **Writers**: anyone with repo access who adds Markdown articles in `content/articles/`.

## Features in scope

| Area | Features |
| --- | --- |
| Storefront (`/`) | Hero, featured picks carousel, story section, catalog with search, category filter and sort, quick view with the owner's optional "Why we picked it" note, outbound notice |
| Journal (`/articles`, `/articles/<slug>`) | Markdown articles with cover image, reading time, and cards for listed products |
| Outbound links | `/r/:id` redirect and `/api/track` beacon; Associates tag rules; trusted Amazon hosts only |
| Owner hub (`/admin`) | Email + password or passkey sign-in, recovery codes, invites; Products (create, import from an Amazon link, edit, bulk, duplicate, images); Collections (create, order finds, publish); listing check (daily and on demand: flags finds whose Amazon listing returns "not found"); Site text; Analytics, CSV export, conversions; Activity log; Account and sessions |
| Discovery extras | "Surprise me" random find with the mascot; "Your stash" of saved finds (browser only); journal RSS feed (`/articles/feed.xml`) |
| Collections (`/collections/<slug>`) | Owner-made themed lists of finds, each with its own page, linked from the storefront above the catalog and listed in the sitemap |
| Shareable finds (`/find/<slug>`) | A link per find that opens its quick view on the storefront; Share button (device share sheet or copy link); Worker-rendered title, description and the find's image for link previews; listed in the sitemap |
| Search and sharing | Worker-rendered titles, descriptions, canonical links, Open Graph/Twitter tags, JSON-LD, `robots.txt`, `sitemap.xml`, share image |

## Out of scope (deliberately)

- Cart, checkout, payments, prices, discounts, stock, visitor accounts, server-side wishlists, newsletters, testimonials. (Since 10 November 2026 visitors can save finds to a "stash" kept only in their own browser: no account, nothing stored or reported on the server.)
- Live Amazon ratings or prices (ratings and review counts are owner-supplied and not shown publicly).
- A CMS such as WordPress (evaluated and declined in November 2026: the owner hub plus Markdown articles cover the need).
- Separate product detail pages. Products open in a quick view; since 10 November 2026 each find also has a shareable address (`/find/<title>-<id>`) that opens the storefront with that quick view, with its own title, description and preview image for link sharing.

## Hosting and services

Cloudflare Workers (static React assets + Hono API), Neon Postgres via Hyperdrive, Cloudinary (product images), Upstash Redis (rate limits), Cloudflare Turnstile (bot checks). All chosen to fit free tiers; see `README.md`.

## Status

Live at https://araccoon-hub.raccoon-26-io-2oo5.workers.dev/ (Cloudflare Workers; the address answered with HTTP 200 on 14 November 2026). See [progress-tracker.md](progress-tracker.md).
