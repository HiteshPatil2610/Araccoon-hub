# Progress tracker

## Current phase (3 November 2026)

Feature-complete for the public (source-available) release; preparing first production deployment.

### Latest changes

| Date | Change | Verification |
| --- | --- | --- |
| 31 Oct 2026 | Open-sourced: MIT code, CC BY-NC 4.0 art, CONTRIBUTING and SECURITY; third-party media removed from history; repo public; private vulnerability reporting on | Typecheck, build, 127 tests |
| 3 Nov 2026 | Editable site text (table, API, owner hub page); Markdown articles with journal pages; Worker-rendered pages with embedded data, share tags, JSON-LD and noscript fallback; robots.txt, sitemap, share image (commit 59cfe17) | Typecheck, build, 142 tests; dev-site check of home, journal, article with product cards, phone width, robots and sitemap; site text read from the database onto the page |
| 3 Nov 2026 | Added `CLAUDE.md` and context files `project-overview.md`, `code-standards.md`, `ai-workflow-rules.md`; architecture updated | Docs only |
| 3 Nov 2026 | Open-source docs: code of conduct, issue/PR templates, CODEOWNERS, Dependabot, changelog, README badges and quick start, `art/README.md`, `docs/OPEN_SOURCE_CHECKLIST.md` (maintainer to-dos); art and video scripts made portable (no fixed local paths, font and Chrome fallbacks); render logs untracked; personal path removed from a reference doc | Typecheck, build, tests; Python scripts syntax-checked, Blender renders not re-run |
| 4 Nov 2026 | Code licence MIT → PolyForm Noncommercial 1.0.0 (README, CONTRIBUTING contributor grant, LICENSE-ART, PR template, changelog, overview); promo design-system folder removed from the repo and ignored; repo git email set to GitHub no-reply; local dev uses Turnstile test keys and in-memory rate limits | Typecheck, build, tests |
| 6 Nov 2026 | Preserved the tablet and phone mascot scale in the scroll handoff so responsive sizing is not replaced by the desktop rule | CSS source reviewed; browser, typecheck, tests and build not run |
| 6 Nov 2026 | Removed the picks section's bottom clearance so its mascot cut reaches the rounded dark-block edge and is masked at the seam | CSS source reviewed; browser, typecheck, tests and build not run |
| 6 Nov 2026 | Kept the gray filmstrip behind the foreground hero mascot, anchored the mascot cut to the hero edge, and let the red picks divider mask it during normal page scroll | Source reviewed; browser, typecheck, tests and build not run |
| 8 Nov 2026 | 3D mascot matched to the landing hero art in a new `art/araccoon/araccoon_character_v2.blend` (original file untouched): crimson accents and lights saved into the file, eyes opened with amber iris and pupil (iris/pupil faces were never assigned), smug lid tilt, wider upturned smile, pullover look (zip, necklace and chest straps hidden, not deleted), hood behind the neck, matte crimson seam piping, new crossed-arms forearms with cuffs, paws and claws (`AR_CrossedArms` collection; pocket hands hidden); `fur.py` grows forearm fur on the crossed arms when present | EEVEE preview renders in live Blender; Cycles fur hero render run from a scratch copy of the pipeline; `site_hero.png` and the site WebPs not replaced |
| 9 Nov 2026 | New-laptop setup checked: Node 26, PostgreSQL 18, packages, `.env`/`.env.local` and `.localdb/` (6 products, migrations current) all present. PostgreSQL 18 `bin` added to the user PATH, so `db:local` works without `PG_BIN`. Recovered a stuck local cluster: after an app restart an autovacuum worker died (0xC0000142), the postmaster then hit Windows error 487 and hung; fixed by ending that cluster's postgres processes (only those whose command line points at `.localdb`) and rerunning `db:local` | Dev site: storefront, API, journal article and owner sign-in return 200 with 6 products; typecheck clean; 142/142 tests pass |
| 9 Nov 2026 | **Email + password sign-in** next to passkeys: migration 6 (`owners.password_hash`), `worker/lib/password.ts` (PBKDF2-SHA256 100k + salt + pepper), `POST /api/auth/password-login`, `POST /api/auth/setup/password` (first-run setup with a password), `PUT/DELETE /api/admin/password`; recovery sessions may set a new password; last passkey removable when a password exists; `npm run owner:password` for lockouts. Sign-in page now has Email & password / Passkey tabs and a clearly explained **Developer sign-in** box. Local dev DB: old passkey, 10 recovery codes, sessions and challenges erased (owner, products and settings kept). **Removed unused parts:** `/raccoon-preview` page, `RaccoonModel.ts`, `three`/`@types/three`, `vite.preview.config.ts`, `public/raccoon-mascot.jpg`, `public/art/raccoon-rear.webp` and `raccoon-turn.webp`, `art/araccoon/` (incl. the uncommitted v2 .blend) and `art/samurai/`. `scripts/dev.ts` runs Vite through Node without a shell (no DEP0190 warning) | Typecheck clean; 151/151 tests and `test:security` pass (9 new password tests); build has no large-chunk warning; dev site checked: setup screen, sign-in tabs, Developer sign-in, Account → Password card, `/raccoon-preview` now 404. Password sign-in in the browser not exercised with a real password (owner sets their own); covered by integration tests |
| 9 Nov 2026 | **Site text reworked** to fields the owner actually uses, grouped into Announcement / Home page / Footer / Search results. Removed: story text (only shown with no featured picks), "Opening on Amazon" and "Footer: good to know" (now fixed wording in the components; old database rows are ignored). Added: optional **announcement** banner with optional link (bottom of storefront and journal, visitor can close it for the visit; link must be a site path or `https://`), the four **hero taglines**, and the **empty-catalog** heading. Optional slots may be left empty (empty hides them) | Typecheck clean; 152/152 tests (new link-safety and optional-slot tests); build clean; dev site: editor sections, unsafe link rejected with a message, announcement and 24-character tagline saved and shown, banner close works; test values reset afterwards. Hero taglines checked by measurement at 839 px, not by screenshot; phone width not checked |

### Local database troubleshooting (Windows)

- `pg_ctl not found` → add `C:\Program Files\PostgreSQL\18\bin` to the user PATH, or set `PG_BIN`.
- Connections hang, or `postgres.log` shows `error code 487` / `0xC0000142` → `pg_ctl -D .localdb/data stop -m fast`; if that times out, end the postgres processes started from `.localdb` (not the `postgresql-x64-18` service), then `npm run db:local`.
- `pre-existing shared memory block is still in use` → an orphaned worker from the old cluster is still alive; end it and start again.

### Not yet verified

- The Site text editor was not clicked through in a browser; `.env.local` now sets `PASSKEY_ORIGIN=http://localhost:5173` and the Developer sign-in works, so it can be. Its API is covered by integration tests.
- Two seeded sample products link to amazon.com while `AMAZON_ASSOCIATE_TAG` only has one (amazon.in) tag, so the Overview flags them as unopenable. Expected; add `amazon.com=<tag>` or edit/replace the samples.
- The production page cache and `ASSETS` binding have only run in dev and tests, not on Cloudflare.

### Next steps

1. Fix the Neon dev password or keep using the local database (`DATABASE_URL_DEV=` in `.env.local`).
2. First deployment: Hyperdrive id in `wrangler.jsonc`, production secrets, `npm run db:migrate -- --target=prod`, `npm run deploy`.
3. After deploy: check link previews (share image), submit the sitemap to Google Search Console, measure Lighthouse on `/` and an article.
4. Write real articles in `content/articles/`.
5. Work through the GitHub settings in `docs/OPEN_SOURCE_CHECKLIST.md` (About, topics, branch ruleset, security features, labels, v0.1.0 release).

### Open questions

- Custom domain? (Affects canonical URLs, passkey origin and Turnstile.)
- Should the share image be per-article when no cover image is set?
- Rewrite git history to remove the promo design-system folder from older commits? (Needs a force push.)

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
