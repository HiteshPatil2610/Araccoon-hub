# Architecture — Araccoon Hub

Updated 3 October 2026 after source inspection.

## Runtime

- React 19, React Router, Vite 8, Tailwind 4; Syne and Space Grotesk are bundled locally.
- Cloudflare Worker serves static assets and the Hono API. PostgreSQL is reached through Hyperdrive. The owner bundle and Recharts load on owner routes.
- `src/lib/api.ts` is the HTTP boundary; shared types and Zod schemas live in `shared/`. The server remains authoritative for validation and authorization.
- `src/pages/Storefront.tsx` owns discovery and quick view. `src/components/ProductCard.tsx` is the catalog card; `ProductImage.tsx` provides stable image fallbacks. The featured board uses `src/lib/catalog.ts`.
- `src/admin/` contains passkey sign-in, products/editor, reporting, overview, account/security and audit activity. Existing draft, archive, duplication, bulk operations, account invitations and conversion recording remain supported.
- `Dialog.tsx` and `useDialog.ts` provide labelled modals, initial focus, keyboard containment, inert background, Escape, scroll lock and focus return. Pending writes disable dismissal. Confirmations initially focus Cancel.

## Security boundaries retained

Owner authentication uses passkeys, server-side HttpOnly cookie sessions and one-time recovery codes, not passwords or browser JWT storage. Recovery sessions are limited to enrolling a replacement passkey. Origin checks, bot checks, rate limits, server validation and trusted Amazon destination policy remain enforced independently of UI controls.

Images use signed direct Cloudinary uploads and the existing server/preset restrictions. Client guidance and preflight checks retain the 8 MB limit and JPG/PNG/WEBP/GIF formats. Upload byte progress is real XHR progress, not elapsed-time estimates. No upload security mechanism was removed.

Outbound actions reserve a tab synchronously, request tracking with a shared click key, and fall back to `/r/:id` after the existing 4-second tracking timeout/error. Server deduplication and owner test-click exclusion remain intact. Visitor-facing data does not expose stored affiliate URLs.

## Reporting contracts

Reports support 7/30/90-day UI selections backed by server queries, calendar dates in the configured timezone, previous-period comparisons, recorded conversion events and daily anonymous identities. `generatedAt` is report construction time. The response now includes the existing configured `retentionDays`; it adds no new data collection.

The recent table is the latest 50 retained clicks across history, independent of report selection. Conversion management loads the latest 200 records. The existing CSV endpoint exports a **rolling** selected number of days, up to 50,000 rows, with ISO/UTC timestamps and spreadsheet formula protection. This differs from the calendar-date report boundary and is labelled explicitly. No full-period recent-table search or new reporting API was invented.

## Verification tooling

`npm run build` and `npm run dev` use Vite's runner config loader because bundling native Tailwind dependencies failed on Windows with the default loader. `npm test` uses an isolated disposable PostgreSQL cluster and never loads application secrets. `scripts/ui-fixture-preview.mjs` serves built assets and isolated QA responses on loopback port 5174; it has no database or external upload/tracking integration and is not deployed.
