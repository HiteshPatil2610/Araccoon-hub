# Araccoon Hub

A curated Amazon affiliate storefront ("Small finds. Big everyday upgrades.") with a private owner hub for products, analytics and security. The Cine Daily interface (near-black, white and one crimson; Bebas Neue + Archivo) uses real featured catalog records, Bento and Classic layouts, and passkey authentication.

**Open source:** the code is [MIT licensed](LICENSE); the raccoon mascot and artwork are [CC BY-NC 4.0](LICENSE-ART.md). Contributions are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md).

See [UI context](context/ui-context.md), [architecture](context/architecture.md), and [verification/progress](context/progress-tracker.md).

| Part | Technology | Free tier |
|---|---|---|
| Website + API | Cloudflare Workers (static React assets + Hono API in one Worker) | 100k API requests/day; static pages unlimited |
| Database | Neon Postgres via Cloudflare Hyperdrive | 1 GB, 100 CU-hours/month |
| Product images | Cloudinary (signed direct uploads, auto re-encoding) | 25 credits/month |
| Rate limits | Upstash Redis (REST) | 500k commands/month |
| Bot check | Cloudflare Turnstile | Unlimited |
| Owner sign-in | Passkeys (WebAuthn) + one-time recovery codes | Built in, no service |

## Local development

Requires Node 24+ and, for the local database and tests, PostgreSQL binaries on `PATH` (or `PG_BIN`). No paid accounts are needed for local development: copy `.env.example` to `.env`, leave the service keys empty and use the local database.

```bash
npm install
npm run db:local                      # start a local Postgres in .localdb/ (skip if DATABASE_URL_DEV is set)
npm run db:migrate -- --target=dev
npm run db:seed                       # sample products (dev databases only)
npm run dev                           # http://localhost:5173
```

- Secrets live in `.env` (see `.env.example`); local overrides go in `.env.local` (both gitignored).
- `.env.local` should contain `ENVIRONMENT=development`. Optionally add `DEV_LOGIN_TOKEN=<random>` to get a development-only sign-in box on `/admin/login`. The server refuses it unless `ENVIRONMENT=development` (production config ignores the token, and a test checks this).
- Owner hub: `http://localhost:5173/admin`. Passkeys work on `localhost` in modern browsers.

| Command | What it does |
|---|---|
| `npm run dev` | Vite + the Worker in the real `workerd` runtime, pointed at the dev database |
| `npm run typecheck` | Strict TypeScript for client, Worker and tests |
| `npm test` | Unit and integration tests against a throwaway Postgres cluster (never `.env`); visibly skips integration suites if PostgreSQL is unavailable |
| `npm run test:security` | Full suite including adversarial security tests; fails if PostgreSQL integration tests cannot run |
| `npm run build` | Type-check and production build |
| `npm run db:migrate -- --target=dev\|prod` | Apply versioned migrations (you must name the target) |
| `npm run deploy` | Type-check, mandatory security/integration tests, build, `wrangler deploy` |

## First deployment

1. Fill in `.env` (all values from the setup guide) and run `npx wrangler login`.
2. Create the database connection: `npx wrangler hyperdrive create araccoon-hub-db --connection-string="<DATABASE_URL>"` and paste the returned id into `wrangler.jsonc` → `hyperdrive[0].id`.
3. Migrate production: `npm run db:migrate -- --target=prod`.
4. Upload secrets (one at a time, paste each value when prompted):
   `SESSION_SECRET RECOVERY_CODE_PEPPER OWNER_EMAIL OWNER_SETUP_TOKEN PASSKEY_RP_ID PASSKEY_ORIGIN TURNSTILE_SITE_KEY TURNSTILE_SECRET_KEY CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET CLOUDINARY_UPLOAD_PRESET UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN AMAZON_ASSOCIATE_TAG`
   → `npx wrangler secret put <NAME>`. For production, `PASSKEY_RP_ID` = your host (e.g. `araccoon-hub.<you>.workers.dev`) and `PASSKEY_ORIGIN` = `https://` + that host. Add the same host to the Turnstile widget.
5. `npm run deploy`, open `https://<host>/admin/login` → **First-time setup** → your email + setup token → create your passkey → save the recovery codes. Setup closes permanently after this; then delete the `OWNER_SETUP_TOKEN` secret.
6. Add a second passkey (phone + laptop) under **Settings**.

## Security design (summary)

- **Owners**: passkeys only (phishing-resistant, no passwords). Server-side sessions in an HttpOnly, Secure, SameSite=Strict cookie; only a SHA-256 of the token is stored. Sign-out, sign-out-everywhere and disabling an owner take effect on the next request. First-owner setup needs `OWNER_EMAIL` + `OWNER_SETUP_TOKEN` and closes after the first passkey. Further owners join by single-use 48-hour invites. Recovery codes are one-time, stored as keyed HMACs, and a recovery session can only add a new passkey.
- **CSRF**: SameSite=Strict cookies plus an exact `Origin` check on every state-changing API call.
- **Trusted links**: product links must be `https` on `AFFILIATE_ALLOWED_HOSTS` (exact host or subdomain; short-link hosts exact). They're re-checked on every redirect, and visitors never see raw affiliate URLs. Per-store Associates tags are added automatically.
- **Validation**: shared zod schemas (unknown fields rejected), parameterized SQL, CHECK constraints in the database.
- **Abuse limits**: Upstash-backed per-IP/per-account/per-owner rate limits (sensitive routes fail closed if Redis is down), Turnstile on sign-in and recovery, 100 KB request bodies.
- **Analytics privacy**: visitors are anonymous. Visitor-days use a keyed daily hash, so no IP is stored. Owner test clicks are excluded. Clicks are kept for 90 days (daily cron).
- **Audit**: append-only activity log of every sign-in and change (owner ids only, no secrets).
- **Headers**: strict CSP (no inline scripts), HSTS, `frame-ancestors 'none'`, nosniff — see `public/_headers`.

## Project layout

```
shared/     types, zod schemas, URL policy, CSV (used by client and server)
worker/     Hono API: routes/, auth/, repo/, db/ (migrations), lib/ (rate limit, Turnstile, Cloudinary, crypto)
src/        React app: pages/ (storefront), admin/ (owner hub), components/, lib/
scripts/    dev, local database, migrations, seed
tests/      unit + integration (virtual passkey authenticator, throwaway Postgres)
```

As an Amazon Associate I earn from qualifying purchases.

## UI verification preview

`npm run build` uses Vite's runner config loader to avoid native plugin bundling issues on Windows. After building, `node scripts/ui-fixture-preview.mjs` serves **isolated QA fixtures** at `http://127.0.0.1:5174`. This test server has no database, does not upload to Cloudinary, and deliberately fails product writes. Its product labels and zero activity are test data, never real catalog or business records. It is not part of the Worker deployment. See the progress tracker for screenshot coverage and remaining manual checks.

## Running your own copy

You are welcome to fork this project and run your own storefront. Before you do:

- Use **your own** Amazon Associates tag (`AMAZON_ASSOCIATE_TAG`) and your own service accounts.
- Replace the Araccoon name and raccoon mascot with your own branding. The artwork may not be used commercially (see [LICENSE-ART.md](LICENSE-ART.md)).
- Keep the Amazon Associates disclosure on your site, as Amazon's program rules require.

## Contributing and security

- How to contribute: [CONTRIBUTING.md](CONTRIBUTING.md)
- Reporting a vulnerability: [SECURITY.md](SECURITY.md)

## License

- **Code:** [MIT](LICENSE) © 2026 Hitesh Patil
- **Raccoon mascot and artwork:** [CC BY-NC 4.0](LICENSE-ART.md) © 2026 Hitesh Patil
