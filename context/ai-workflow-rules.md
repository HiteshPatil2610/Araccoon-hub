# AI workflow rules — Araccoon Hub

Updated 3 November 2026. How an AI assistant (or any contributor) should work in this repository.

## Before starting

1. Read the context files in the order listed in `CLAUDE.md`.
2. Inspect the actual source before deciding anything; the code is authoritative over these documents. If they disagree, say so and fix the document.
3. Check `git status`. Do not overwrite or discard uncommitted work you did not make; mention it.

## Scoping

- Do what was asked. Keep changes focused; propose (do not silently do) unrelated refactors or new features.
- Respect the out-of-scope list in `project-overview.md` (no cart, prices, fake ratings, CMS, etc.) unless the owner explicitly changes scope, and then update that file first.
- When a request is ambiguous and the answer changes the work, ask one short question. Otherwise pick the sensible default and state it.
- Prefer the existing patterns and dependencies. Add a dependency only when it clearly earns its place, and prefer dev-only dependencies for build-time work.

## Delivery

- Work in small steps; type-check as you go.
- Add or update tests with every behaviour change (see `code-standards.md`).
- Verify user-visible changes in the running dev site (`npm run dev`, http://localhost:5173), including a phone-width check, and report what was and was not verified.
- Finish with `npm run typecheck`, `npm test` and `npm run build` passing. Report failures honestly with their output.

## Safety rules

- Never commit, push, deploy, run production migrations, or change GitHub settings without the owner's explicit go-ahead for that action.
- Never read out, commit or paste secrets from `.env` / `.env.local`; never put them in `worker-configuration.d.ts`.
- Do not weaken the security invariants in `code-standards.md` to make something work; find another way or ask.
- Do not add third-party media (screenshots of other sites, brand logos, copyrighted images or video) to the repo; it is public and open source.
- Destructive operations (history rewrites, deleting data, force pushes) need explicit approval and a backup first.

## Keeping context current

- After each meaningful change, add a dated entry to `progress-tracker.md`: what changed, how it was verified, and what is still unverified.
- If a change alters the architecture, scope, UI conventions or standards, update `architecture.md`, `project-overview.md`, `ui-context.md` or `code-standards.md` before continuing.
- Keep the README's commands and "Editing content" table accurate.

## Local environment notes

- Local database: `npm run db:local` (Postgres in `.localdb/`, port 54329), then `npm run db:migrate -- --target=dev` and `npm run db:seed`. An empty `DATABASE_URL_DEV` selects it.
- Owner sign-in locally needs `PASSKEY_ORIGIN` to match the dev URL (`http://localhost:5173`); otherwise the origin check rejects sign-in.
- Tests start their own disposable Postgres and never read `.env`.
