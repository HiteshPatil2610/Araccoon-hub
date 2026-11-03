# Open-source checklist

Updated 3 November 2026. What has been done to make Araccoon Hub a proper open-source project, and what the maintainer still has to do by hand (mostly GitHub settings that cannot live in the repo).

## Already in the repository

| Item | File |
| --- | --- |
| Code licence (MIT) | [`LICENSE`](../LICENSE), `"license": "MIT"` in `package.json` |
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

## Decisions only you can make

- **Personal email in history.** Your git author email is public in old commits. To hide it in future commits, turn on **Settings (your account) → Emails → Keep my email address private** and run `git config user.email <id>+HiteshPatil2610@users.noreply.github.com` (GitHub shows the exact address on that page). Old commits keep the old email unless history is rewritten again, which is not recommended now that the repo is public.
- **`reference_raccoon.webp`** in `art/araccoon/`: confirm it is your own image or freely licensed. If it came from someone else, remove it (and from history) like the other third-party media.
- **`video/araccoon-promo/design-system/cine-daily-design-system/`.** This folder is a recreation of the Cine Daily design system used for the promo video. Confirm you made it or are allowed to share it; if it copies someone else's product, remove it from the repo.
- **Art licence for forks.** CC BY-NC means companies cannot use the mascot commercially. If you would rather people could, switch to CC BY 4.0 in `LICENSE-ART.md`.
- **Maintainer contact.** Code-of-conduct reports currently go through a private advisory or your GitHub profile. Add a dedicated email to `CODE_OF_CONDUCT.md` and `SECURITY.md` if you prefer.

## Still needed for the live site (not open-source specific)

- [ ] Fix the Neon dev password, or keep using the local database (`DATABASE_URL_DEV=` empty).
- [ ] First deployment: set the Hyperdrive id in `wrangler.jsonc`, add production secrets with `wrangler secret put`, then `npm run db:migrate -- --target=prod` and `npm run deploy`.
- [ ] Add the live URL to the repo **About** box and the README.

## Keeping it healthy

- Respond to new issues and PRs within about a week, even if only to say "thanks, will look soon".
- Keep `CHANGELOG.md`, `README.md` and `context/progress-tracker.md` current with each change.
- Never commit `.env*` files; if a secret is ever pushed, rotate it immediately (deleting the commit is not enough on a public repo).
