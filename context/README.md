# Project context

Updated 3 November 2026. These files describe **this Cloudflare Worker / React checkout**. Start with [`CLAUDE.md`](../CLAUDE.md) at the repo root, which sets the reading order.

Core files, in reading order:

1. [Project overview](project-overview.md) — product, goals, features and scope
2. [Architecture](architecture.md) — system structure, storage model and invariants
3. [Implemented UI](ui-context.md) — theme, typography and component conventions
4. [Code standards](code-standards.md) — implementation rules and conventions
5. [AI workflow rules](ai-workflow-rules.md) — workflow, scoping and delivery
6. [Progress and verification](progress-tracker.md) — current phase, changes, open questions, next steps

Reference material:

- [Screenshot manifest](ui-screenshots/README.md)
- [Product URL import implementation plan](product-url-import-plan.md) — scraping provider isolation, future API adapter, and manual cutover runbook (proposal)
- [Implemented product URL assistance](product-url-assistance.md) — owner-supplied content flow and current API preparation boundary
- [Responsive QA report](responsive-qa-report.md), [security audit (6 Oct 2026)](security-audit-2026-10-06.md), [video-inspired UI changes](video-inspired-ui-changes.md), [reference frame analysis](reference-frame-analysis/)

The current source, shared schemas, API services and server authorization are authoritative. If a document disagrees with the code, fix the document.
