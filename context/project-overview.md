# Project overview — Araccoon Hub

Updated 3 November 2026.

## What it is

Raccoon Hub ("Small finds. Big everyday upgrades.") is a curated Amazon affiliate storefront. Visitors browse hand-picked products and open them on Amazon in a new tab; the site earns through the Amazon Associates program. A private owner hub manages the catalog, the site's short copy, analytics and account security. The raccoon mascot and the Cine Daily look (near-black, white, one crimson) are the brand.

The project is open source: code under MIT (`LICENSE`), mascot and artwork under CC BY-NC 4.0 (`LICENSE-ART.md`). Repository: https://github.com/HiteshPatil2610/Araccoon-hub (public).

## Goals

- A fast, distinctive storefront that makes finds easy to browse and open on Amazon.
- Honest affiliate behaviour: every outbound click is tracked, tagged and disclosed; no fake prices, ratings, stock or urgency.
- An owner hub one person can run without a CMS or paid editor.
- Secure by default (passkeys, strict CSP, rate limits) and free-tier friendly to host.
- Search-engine and link-preview friendly public pages.

## Users

- **Visitors**: anonymous, no accounts. They browse, search, filter, open quick views, read articles and go to Amazon.
- **Owners**: one or more people with passkeys who manage products, site text and settings, and read reports.
- **Writers**: anyone with repo access who adds Markdown articles in `content/articles/`.

## Features in scope

| Area | Features |
| --- | --- |
| Storefront (`/`) | Hero, featured picks carousel, story section, catalog with search, category filter and sort, quick view, outbound notice |
| Journal (`/articles`, `/articles/<slug>`) | Markdown articles with cover image, reading time, and cards for listed products |
| Outbound links | `/r/:id` redirect and `/api/track` beacon; Associates tag rules; trusted Amazon hosts only |
| Owner hub (`/admin`) | Passkey sign-in, recovery codes, invites; Products (create, import from an Amazon link, edit, bulk, duplicate, images); Site text; Analytics, CSV export, conversions; Activity log; Account and sessions |
| Search and sharing | Worker-rendered titles, descriptions, canonical links, Open Graph/Twitter tags, JSON-LD, `robots.txt`, `sitemap.xml`, share image |

## Out of scope (deliberately)

- Cart, checkout, payments, prices, discounts, stock, wishlists, visitor accounts, newsletters, testimonials.
- Live Amazon ratings or prices (ratings and review counts are owner-supplied and not shown publicly).
- A CMS such as WordPress (evaluated and declined in November 2026: the owner hub plus Markdown articles cover the need).
- Product detail pages with their own URLs (products open in a quick view).

## Hosting and services

Cloudflare Workers (static React assets + Hono API), Neon Postgres via Hyperdrive, Cloudinary (product images), Upstash Redis (rate limits), Cloudflare Turnstile (bot checks). All chosen to fit free tiers; see `README.md`.

## Status

Built and tested locally; not yet confirmed deployed (the Hyperdrive id in `wrangler.jsonc` is still a placeholder). See [progress-tracker.md](progress-tracker.md).
