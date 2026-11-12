# Code standards — Araccoon Hub

Updated 3 November 2026. These describe how the existing code is written; follow them so new code reads like the code around it.

## Language and tooling

- TypeScript everywhere, strict (`tsconfig.base.json`). Separate projects for the client (`tsconfig.app.json`: `src`, `shared`), the Worker (`tsconfig.worker.json`: `worker`, `shared`) and Node tooling (`tsconfig.node.json`: `scripts`, `tests`, `vite.config.ts`).
- ES modules, Node 24+. No ESLint or Prettier is configured: match the surrounding style (2-space indent, single quotes, semicolons, trailing commas in multi-line literals).
- Build and dev use Vite's runner config loader (`--configLoader runner`); keep it.
- Do not hand-edit generated files: `shared/generated/` (from `scripts/articles.ts`) and `worker-configuration.d.ts` (from `wrangler types`; if you regenerate it, make sure local `.env` secret names do not leak into it).

## Structure and boundaries

- `shared/`: types, Zod schemas and pure helpers used by both client and Worker. No DOM or Worker APIs.
- `worker/`: Hono app. `routes/` (HTTP), `repo/` (SQL), `lib/` (integrations, crypto, HTML), `auth/`, `db/` (connection, migrations). Routes validate input and call repos; repos only talk SQL.
- `src/`: React app. `pages/` (public routes), `admin/` (owner hub, lazy-loaded), `components/`, `lib/` (hooks, API client, state).
- `src/lib/api.ts` is the only place the client calls `fetch` for the API.
- `content/articles/`: Markdown articles, compiled at build.

## API and data rules

- Validate every request body with a shared Zod schema (`body(c, schema)`); use `z.strictObject` so unknown fields are rejected. The server is authoritative; the client reuses the same schema for instant feedback.
- SQL uses `$n` placeholders only. Never build SQL from strings.
- Owner routes use `requireOwner()`; state changes are rate-limited (`limit(c, 'owner-write', ownerId, …)`) and audited (`audit(c, 'thing.action', …)`). Audit entries hold owner ids and targets, never secrets or emails.
- Schema changes are new numbered entries in `worker/db/migrations.ts`; never edit an applied migration.
- Errors: throw `fail(status, message, fields?)`; the app returns `{ error, fields, correlationId }`. Never leak stack traces.
- Visitor responses never include affiliate URLs or other owner-only fields (`toPublic`).
- Anything embedded in HTML goes through `escapeHtml` or `serializeInitialData`.

## Security invariants (do not weaken)

Owner sign-in by passkey or email + password (hashed as described in `architecture.md`; never stored or logged in plain text); HttpOnly SameSite=Strict session cookie with hashed tokens; exact `Origin` check on state-changing API calls; strict CSP with no inline scripts in production (`public/_headers` and `worker/lib/pageHeaders.ts` must match; a test checks this); trusted Amazon hosts for outbound links; rate limits that fail closed on sensitive routes; 100 KB request bodies; no secrets in the repo or in client code.

## Frontend conventions

- Reuse the Cine Daily primitives in `src/components/cine.tsx` and the tokens in `src/index.css`; no new colours or fonts without updating `ui-context.md`.
- Accessible by default: labelled controls, `aria-invalid`/`aria-describedby` for field errors, focus management in dialogs (`Dialog`), reduced-motion support, no emoji.
- Lazy-load anything owner-only or heavy (`page(async () => import(...))` in `src/main.tsx`).
- Keep the hero/story animation layout intact; editable copy goes through `useSiteText()`, not hard-coded strings.

## Comments

Comment the *why* (a constraint, a security reason, a non-obvious contract) in a line or two. Do not narrate what the code does. Match the comment density of the file you are editing.

## Tests

- `node:test` with `assert/strict`. Unit tests in `tests/unit/`, integration tests (real API against a throwaway Postgres) in `tests/integration/` using `tests/support/testApp.ts`.
- New routes get integration tests covering auth, validation and the happy path; security-relevant code gets negative tests.
- Before handing work over: `npm run typecheck`, `npm test`, `npm run build` must pass.

## Commits

Small, descriptive commit messages (imperative summary line, body explaining what and why). Never commit `.env*` (except `.env.example`), `.localdb/`, `dist/`, `shared/generated/` or poster exports.
