# Progress tracker

## Current phase (3 November 2026)

Feature-complete for the open-source release; preparing first production deployment.

### Latest changes

| Date | Change | Verification |
| --- | --- | --- |
| 31 Oct 2026 | Open-sourced: MIT code, CC BY-NC 4.0 art, CONTRIBUTING and SECURITY; third-party media removed from history; repo public; private vulnerability reporting on | Typecheck, build, 127 tests |
| 3 Nov 2026 | Editable site text (table, API, owner hub page); Markdown articles with journal pages; Worker-rendered pages with embedded data, share tags, JSON-LD and noscript fallback; robots.txt, sitemap, share image (commit 59cfe17) | Typecheck, build, 142 tests; dev-site check of home, journal, article with product cards, phone width, robots and sitemap; site text read from the database onto the page |
| 3 Nov 2026 | Added `CLAUDE.md` and context files `project-overview.md`, `code-standards.md`, `ai-workflow-rules.md`; architecture updated | Docs only |

### Not yet verified

- The Site text editor was not clicked through in a browser (local `PASSKEY_ORIGIN` did not match the dev port); its API is covered by integration tests.
- The production page cache and `ASSETS` binding have only run in dev and tests, not on Cloudflare.

### Next steps

1. Fix the Neon dev password or keep using the local database (`DATABASE_URL_DEV=` in `.env.local`).
2. First deployment: Hyperdrive id in `wrangler.jsonc`, production secrets, `npm run db:migrate -- --target=prod`, `npm run deploy`.
3. After deploy: check link previews (share image), submit the sitemap to Google Search Console, measure Lighthouse on `/` and an article.
4. Write real articles in `content/articles/`.

### Open questions

- Custom domain? (Affects canonical URLs, passkey origin and Turnstile.)
- Should the share image be per-article when no cover image is set?

---

## Earlier record (3 October 2026)

Updated 3 October 2026. Implementation is in the current checkout; no deployment or commit was performed.

## Completed redesign batches

| Batch | Implemented result |
| --- | --- |
| Foundations | Shared lime/ink/cobalt tokens, readable field/button type, focus treatment, static grid, 420ms circular theme reveal, rapid-toggle cleanup, reduced-motion paths |
| Storefront | Real-featured curiosity board with deterministic selection, focused catalog CTA, labelled search, wrapping categories/filter summary, explicit layouts, image fallbacks, honest public data |
| Outbound | Cobalt actions, pending disabled controls and guarded dismissal; existing timeout/fallback/tab/deduplication logic retained |
| Owner | Responsive workspace navigation, grouped editor, accessible validation, recoverable drafts, submission guards, unsaved-change warning, honest upload states, exact-product safe confirmations, account error recovery |
| Reporting | Calendar/rolling-export scope labels, retention response metadata, independent requests, stale/zero/unavailable distinctions, accessible daily table, restrained charts, conversion confirmations |
| Documentation | Active architecture/UI context, this tracker, README and screenshot manifest |

## Executed verification

| Check | Outcome |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run build` | Passed using configured Vite runner loader; production Worker + client assets built |
| `npm test` | 37 passed, 0 failed; real API integration against disposable PostgreSQL, plus featured-board selection tests |
| Storefront 375 / 768 / 1440 × light / dark × Bento / Classic | 12 fixture combinations captured; no page horizontal overflow |
| Owner Products and Analytics 375 / 768 / 1440 × light / dark | 12 fixture combinations captured; no page horizontal overflow |
| 320px storefront stress | Passed horizontal-reflow measurement; long title and broken image fixtures |
| 320px Owner Products / Analytics | Passed horizontal-reflow measurements (clientWidth = scrollWidth = 311px, including 9px scrollbar) |
| Rendered solid text/action contrast | Sampled both themes: primary actions, selected layout, search field, main/secondary text; minimum 6.06:1. Evidence: `ui-screenshots/contrast-pairs.json`. This is not an exhaustive contrast audit. |
| Quick-view keyboard | Initial Close focus; Shift+Tab wraps to outbound action; Escape closes and returns to original quick-view button |
| Browse CTA | Focus moves to catalog-heading |
| Search/filter | No-results distinguished; clearing restores catalog; layout pressed states observed |
| Catalog failure/retry | Failure shown; Retry restores fixture products |
| Hero variants | One featured shows one slot; none shows no slots; source selector tests confirm cap/order/no mutation |
| Editor invalid submission | Associated field errors and first-invalid focus; empty fields keep values |
| Failed product save | Deliberate 503 observed; title, description, image/link remain; submit unlocks |
| Supported affiliate fields | Existing server-backed tag/sub-ID exposed and retained; final 320px failed-save check preserved both and focused the error summary |
| Unsaved changes | Close asks for discard; Cancel returns to retained form; safe initial focus |
| Product delete | Exact title, initial Cancel focus, Escape return; deliberate failed mutation retains confirmation and actionable error |
| Analytics | Successful zero differs from unavailable; failed initial report disables export; retry restores successful report; daily table available |
| Recovery failure | Fixture error displayed; email and code retained |
| Real file chooser, invalid type | Harmless text fixture rejected with format guidance |

Browser data source: local built-asset QA server on port 5174 with conspicuous “Fixture” product titles and zero report data. It has no database and deliberately rejects writes. Logo images are fixture placeholders, not product photography. No sample data was added to the real catalog. The real local development catalog on port 5173 returned an empty array and was checked separately. Fixture activity is not business activity.

The initial sandbox attempts at dev/test failed with process-spawn EPERM. Approved execution outside the sandbox allowed the tests/build to complete. Vite's default bundled config loader also failed to load a native Tailwind dependency; standard dev/build commands now explicitly use the runner loader.

## Verification limits and remaining usability work

- True 200% browser zoom: attempted native Ctrl+plus, but innerWidth/devicePixelRatio did not change in the in-app browser. No zoom pass is claimed.
- Reduced motion: CSS, MotionConfig, charts and theme code reviewed; runtime preference emulation was not available.
- Screen reader: DOM/AX labels and associated errors inspected, but NVDA/VoiceOver speech and live-region timing were not tested.
- Cloudinary: invalid chooser input checked; supported upload, retry, successful storage and saved-image association require configured service end-to-end checks. No success screenshot was fabricated.
- Live outbound opening, slow tracking and forced popup blocking were not exercised; existing server deduplication/destination security integration tests passed.
- Real authenticated owner browser flows, physical passkeys, production analytics, real mobile keyboards/touch, and a representative-user study remain manual acceptance work.
- The current real catalog has no products, so accurate photography and the populated curiosity board cannot be reviewed against real inventory yet.
- After fixture captures, returning to the real dev preview hit in-app browser/CDP timeouts on both the existing and a fresh tab. The server still returned HTTP 200. A final real-data saved screenshot was unavailable; earlier empty-catalog inspection and the saved fixture matrix are distinct evidence.
- The inherited calendar-report versus rolling-export boundary difference is now explicit; changing it would be separate reporting behavior work.

No supported function was replaced with a decorative placeholder. No new cart, checkout, prices, testimonials, newsletter, wishlist or fabricated business metrics were added.
