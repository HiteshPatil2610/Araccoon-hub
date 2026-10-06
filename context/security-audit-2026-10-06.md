# Security assessment — 6 October 2026

## Result and scope

Completed a source review and local adversarial testing of the React storefront, Hono API, passkey authentication, recovery, owner administration, product management, outbound redirects, analytics, webhooks, configuration, and dependency lockfile. Fixed the issues listed below. Existing UI edits were preserved.

Verification: **55 tests passed, 0 failed, 0 skipped**, across 9 suites using real PostgreSQL and software WebAuthn credentials with real ES256 signatures. TypeScript and the production build passed. `npm audit --json` reported **0 known vulnerabilities** across 323 dependencies at assessment time. The public build's 21 text files were checked against 9 configured secret values: no matches, and no `.env`, `.dev.vars`, `.pem`, or `.key` files in the public client directory.

This is a local application assessment, not a certification that every vulnerability has been found. No deployed URL was provided; production account permissions, TLS, Cloudflare rules, remote database grants, backups, and actual third-party settings were not inspected. The checked-in Hyperdrive ID is a placeholder. No live systems were attacked, migrated, or deployed.

## Findings fixed

Severity describes the potential impact under the conditions stated; findings came from code review, with regression tests validating the resulting protections. An exploit against the original deployed site was not demonstrated.

| Finding | Severity | Previous behavior and fix |
|---|---|---|
| Passkey authorization happened after insertion | High | An authenticated caller could submit a registration challenge for another owner; the credential was saved before the account mismatch was rejected. Registration now checks a server-assigned context before saving, locks/checks the owner, and commits atomically. |
| Registration challenges interchangeable across ceremonies | High | Setup, invitation acceptance, and authenticated passkey addition shared generic registration challenges. Challenges now bind to `setup`, the exact hashed invitation token, or the current owner. Existing unbound registration attempts are invalidated by migration 2. |
| Invitation consumed before verification, without recipient binding | Medium | Failed registration burned a valid invitation and the verification path did not bind its recipient to the challenge owner. Invitation, owner email, challenge, and credential are now checked within one transaction; failed verification rolls back. |
| Disabled account could finish pending invitation | Medium | Registration did not re-check the owner's disabled state. Registration locks the owner and rejects a disabled account before adding a credential. |
| Concurrent first-owner completion | Medium | A passkey-count check outside the insertion transaction could allow two pre-issued setup attempts to finish. A transaction advisory lock serializes setup completion and re-checks that setup is open. |
| Concurrent deletion of last two passkeys | Medium | Two deletion transactions could both see two keys and remove both. An owner-row lock serializes counting and deletion, retaining at least one credential. |
| Concurrent recovery-code replacement | Medium | Concurrent deletion/insertion could leave multiple recovery-code sets. Owner-row locking serializes replacement to one set of ten codes; an earlier response can become stale if another replacement finishes later. |
| Passkey counter could regress during concurrent sign-in | Medium | Concurrent assertions could overwrite a newer counter with a stale update. Counter updates now compare the stored counter with the value verified; a conflicting sign-in receives 409 and must retry. |
| Body-size limit bypass | High (availability) | Ordinary API limits checked only caller-supplied Content-Length; webhooks read the entire body before checking JavaScript string length. Middleware now counts actual streamed bytes before parsing, cancels oversized bodies, and applies 100 KiB API / 64 KiB webhook limits, including multibyte content and misleading headers. |
| Redis outages allowed public database writes | Medium | Click recording and redirects failed open on limiter outages. These paths now return 503 before database work when rate limits cannot be checked. Health and authentication-state reads now have explicit limits. This trades some availability for bounded database write exposure. |
| Malformed Redis responses could weaken limits | Medium | Null counts coerced to zero and expiry errors were ignored. Counts must be positive safe integers, the response must contain both commands, and expiry results/errors are checked. |
| Unbounded external/database connection wait | Medium | Redis, Turnstile, Cloudinary cleanup and initial DB connections lacked explicit deadlines. Added five-second fetch/connection deadlines; existing database statement/query limits remain. |
| Weak production configuration accepted | Medium | Development/shared secrets and insecure or mismatched origin settings could pass startup checks. Production now rejects the development default, identical session/recovery secrets, short setup tokens, non-HTTPS/mismatched passkey origins, and insecure Redis URLs. Length checks do not prove randomness: generate independent random secrets. |
| Private early-error headers incomplete | Low | Requests rejected before no-store middleware could lack private cache headers. Authentication/admin responses now receive no-store even for early errors; API responses also receive a restrictive CSP, frame denial, and production HSTS. Existing static-site headers remain. |
| Malformed identifiers caused internal errors | Low | Some invalid UUID-shaped product IDs reached PostgreSQL and some administrative UUID routes accepted arbitrary strings. Product reads now validate UUID structure; destructive UUID routes validate before querying, producing 404/400 instead of 500. |
| Release tests could silently omit database coverage | Medium (assurance) | Missing/failed local PostgreSQL setup skipped the integration suites while the command succeeded. Added `npm run test:security`, which requires the database suites, and made deployment use it. Ordinary `npm test` retains its documented developer-friendly skip behavior. |

## Verification coverage

- Anonymous admin access, missing/cross-origin Origin headers, strict unknown-field rejection, malformed JSON, and malformed identifiers.
- Real passkey signatures, wrong WebAuthn origin, missing user verification, unknown credentials, challenge reuse, hashed session/recovery storage, server-side logout, disabled-account login, and recovery-session restrictions.
- Cross-owner and cross-token registration requests, failed invitation rollback, disabled pending invite, concurrent invite completion, concurrent first-owner setup, concurrent deletion, recovery-code regeneration and passkey sign-in counters.
- Oversized bodies with missing/forged Content-Length, multibyte text, and an indefinitely producing stream; oversized streams are cancelled before reading the complete body.
- Simulated Redis outage, invalid count/expiry results, and failed Turnstile HTTP responses that incorrectly contain success JSON. No actual outages were induced.
- A 150-request concurrent in-process health burst: 60 accepted, 90 rejected with HTTP 429 and Retry-After; only the accepted requests reached the DB stub. This verifies limiter behavior, not production throughput or distributed DDoS resistance.
- Product validation, trusted-host lookalikes/credentials/ports/schemes, draft visibility, redirect destination re-validation, owner-click exclusion, click deduplication, analytics dates, CSV formula neutralization, bulk actions and image-reference cleanup.
- Signed webhook verification, replay time window, event-id deduplication, and product/click reference matching.

## Re-running checks

```powershell
npm run test:security
npm run build
npm audit --json
```

PostgreSQL binaries must be on PATH / PG_BIN, or TEST_DATABASE_ADMIN_URL must point to a disposable local PostgreSQL server. Integration tests create uniquely named databases and never load application `.env` database credentials. External-service integrations use test doubles.

## Rollout requirements and remaining exposure

1. Apply **migration 2 before deploying this Worker** using `npm run db:migrate -- --target=prod` in the intended production environment. This was not executed during the assessment. It adds `registration_context` and expires pending registration attempts; users with such attempts must start again. Existing credentials/sessions are retained.
2. Confirm production has independent randomly generated SESSION_SECRET and RECOVERY_CODE_PEPPER (32+ characters), a random OWNER_SETUP_TOKEN (32+ characters while setup is needed), HTTPS PASSKEY_ORIGIN matching PASSKEY_RP_ID, and valid HTTPS Redis configuration. Remove the setup token after setup. New checks deliberately refuse unsafe configuration.
3. Configure the real Hyperdrive binding and deploy through the mandatory test gate. Review the built asset directory: `dist/client` is public. The Cloudflare plugin also writes a local `dist/araccoon_hub/.dev.vars` containing local secrets; keep the entire Worker build directory private and do not publish it as static content. It is outside the configured public asset directory and ignored by Git.
4. Verify actual Cloudflare static/API headers, TLS and hostname rules, Redis permissions, Turnstile hostname restrictions, the signed Cloudinary upload preset's formats/size restrictions, and database least-privilege grants. These controls are partly outside this repository.
5. Per-IP limits cannot stop distributed abuse or Cloudflare/Redis quota exhaustion. Verify edge-level WAF/rate limits, quota monitoring and alerts in the deployed account. Public catalog/statistics reads deliberately remain available if Redis fails; they retain bounded query/result behavior but can still create load during a Redis outage.
6. Account recovery revokes sessions but retains existing passkeys so a lost-device recovery does not automatically delete every device. Remove a lost or compromised credential explicitly in Settings. A stolen active full-owner cookie still grants owner access until revoked/expired; fresh passkey confirmation for highly sensitive settings would further reduce that exposure and requires a coordinated authentication/UI change.
7. Verify backup restoration and alerting operationally. Browser/device passkey compatibility, actual Cloudinary/Turnstile/Upstash behavior, runtime behavior in deployed workerd, and sustained/distributed load remain outside these in-process tests. The build retains a pre-existing warning about a >500 kB optional preview chunk; it is not a demonstrated security flaw.

The review used [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) and [OWASP denial-of-service guidance](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html) as reference material for authentication lifecycle and resource bounds.
