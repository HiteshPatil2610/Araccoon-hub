# Public-repo checklist

Updated 4 November 2026. What has been done to make Araccoon Hub a proper public, source-available project (code under PolyForm Noncommercial, art under CC BY-NC), and what the maintainer still has to do by hand (mostly GitHub settings that cannot live in the repo).

## Already in the repository

| Item | File |
| --- | --- |
| Code licence (PolyForm Noncommercial 1.0.0) | [`LICENSE`](../LICENSE), `"license": "PolyForm-Noncommercial-1.0.0"` in `package.json` |
| Artwork licence (CC BY-NC 4.0) and which files it covers | [`LICENSE-ART.md`](../LICENSE-ART.md) |
| Project introduction, quick start, badges, banner | [`README.md`](../README.md) |
| How to contribute | [`CONTRIBUTING.md`](../CONTRIBUTING.md) |
| Community rules (Contributor Covenant 2.1) | [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) |
| Private vulnerability reporting | [`SECURITY.md`](../SECURITY.md) |
| Release notes | [`CHANGELOG.md`](../CHANGELOG.md) |
| Bug and feature forms; blank issues off; security link | [`.github/ISSUE_TEMPLATE/`](../.github/ISSUE_TEMPLATE/) |
| Pull request checklist | [`.github/pull_request_template.md`](../.github/pull_request_template.md) |
| Automatic review requests | [`.github/CODEOWNERS`](../.github/CODEOWNERS) |
| Weekly dependency updates | [`.github/dependabot.yml`](../.github/dependabot.yml) |
| CI on every push and pull request (typecheck, tests, build, audit) | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
| Project context for contributors and AI assistants | [`CLAUDE.md`](../CLAUDE.md), [`context/`](../context/README.md) |
| Art sources and how to rebuild them | [`art/README.md`](../art/README.md) |
| No secrets, personal paths or third-party media in tracked files; third-party media removed from history | checked 3 Nov 2026 |
| Scripts work from any folder and on macOS/Linux (no fixed `E:/` or `C:/` paths) | `art/`, `video/` |

## Your to-do list (GitHub website)

Do these on https://github.com/HiteshPatil2610/Araccoon-hub while signed in. Time estimates are rough.

### 1. Repository front page (5 min)

- [ ] **About** (gear icon next to "About" on the repo page): add a description, e.g. *"Curated Amazon affiliate storefront on Cloudflare Workers + React, with a passkey-secured owner hub."*
- [ ] Add **topics**: `cloudflare-workers`, `react`, `hono`, `postgres`, `passkeys`, `webauthn`, `affiliate`, `storefront`, `typescript`, `vite`, `tailwindcss`.
- [ ] Add the website link once the site is deployed.
- [ ] **Settings → General → Social preview**: upload `public/og-image.jpg` (1200×630) so shared repo links show the raccoon.

### 2. Protect `main` (5 min)

- [ ] **Settings → Rules → Rulesets → New branch ruleset**, target `main`:
  - Require a pull request before merging (1 approval is optional for a solo maintainer; you can leave approvals at 0 and still get the PR flow).
  - Require status checks to pass: select **verify** (the CI job). It appears in the list after CI has run once on a PR.
  - Block force pushes.
- [ ] Add yourself to the bypass list if you want to keep pushing small fixes straight to `main`.

### 3. Security features (3 min)

**Settings → Code security** (or "Security & analysis"):

- [ ] Private vulnerability reporting: already on (check).
- [ ] **Dependabot alerts**: on.
- [ ] **Dependabot security updates**: on.
- [ ] **Secret scanning** and **Push protection**: on (free for public repos). Push protection blocks a commit that contains an API key.
- [ ] **Code scanning → Set up → Default** (CodeQL): on. Free for public repos and finds common security bugs in TypeScript.

### 4. Issues and labels (10 min)

- [ ] Make sure the labels `bug` and `enhancement` exist (the issue forms use them; GitHub creates them by default).
- [ ] Create `good first issue` and `help wanted` labels if missing.
- [ ] Open 3–5 small issues for newcomers and label them `good first issue`. Ideas: write a real article in `content/articles/`, add a test for an untested helper, improve an empty state's wording, add a phone-width screenshot to the docs.
- [ ] Optional: **Settings → General → Features → Discussions** for questions and ideas, so issues stay for bugs and planned work.

### 5. First release (5 min)

After the changes in the Unreleased section are merged:

- [ ] Move them into a dated version in `CHANGELOG.md` if you want them in 0.1.0, or leave them for 0.1.1.
- [ ] **Releases → Draft a new release**: tag `v0.1.0` on `main`, title "0.1.0 — first public release", and paste the 0.1.0 changelog section as the notes.
- [ ] From then on: add each change under **Unreleased** as it lands; when you release, rename the heading to the new version and date, bump `"version"` in `package.json`, tag `vX.Y.Z`.

### 6. Pull requests from Dependabot (ongoing)

- [ ] Once a week, review Dependabot's grouped PR. If CI is green, merge it. If it fails, read the log; major version bumps arrive as separate PRs and may need code changes.

## Decisions made (4 November 2026)

- **Code licence:** PolyForm Noncommercial 1.0.0. Others may use the code only non-commercially; the owner keeps commercial rights and may sell commercial licences. Earlier copies (up to commit `75551df`) stay MIT. Because of this the project is "source-available", not OSI "open source".
- **Art licence:** stays CC BY-NC 4.0. Companies may not use the mascot commercially.
- **`art/araccoon/` (3D Blender mascot) and `art/samurai/`:** removed on 9 November 2026 as unused by the site; still in older commits.
- **`video/araccoon-promo/design-system/`:** kept private. Removed from the repo and ignored; the local copy stays on the owner's machine. It is still in older commits unless history is rewritten.
- **Email:** this repo's git config now uses the GitHub no-reply address, so new commits don't show a personal email. Old commits keep the old one.

### Email: your steps on GitHub (2 min)

1. Go to https://github.com/settings/emails.
2. Turn on **Keep my email addresses private**.
3. Turn on **Block command line pushes that expose my email**.
4. Optional, for all your other repos too: `git config --global user.email 224592670+HiteshPatil2610@users.noreply.github.com`

### Commercial licence requests

People asking for commercial use will open an issue titled "Commercial licence" or contact you on GitHub. Agree the terms (price, scope, duration) in writing; a lawyer can draft a short licence agreement.

## Still needed for the live site (not licence specific)

- [ ] Fix the Neon dev password, or keep using the local database (`DATABASE_URL_DEV=` empty).
- [ ] First deployment: set the Hyperdrive id in `wrangler.jsonc`, add production secrets with `wrangler secret put`, then `npm run db:migrate -- --target=prod` and `npm run deploy`.
- [ ] Add the live URL to the repo **About** box and the README.

## Keeping it healthy

- Respond to new issues and PRs within about a week, even if only to say "thanks, will look soon".
- Keep `CHANGELOG.md`, `README.md` and `context/progress-tracker.md` current with each change.
- Never commit `.env*` files; if a secret is ever pushed, rotate it immediately (deleting the commit is not enough on a public repo).
