# Amazon API activation boundary

Status: dormant scaffold. `provider.ts` deliberately fails; it is not an authenticated Amazon client.

The active provider is selected explicitly in `../../composition.ts`. Credentials do not select providers. The active `amazon-page` provider fetches bounded product HTML and extracts available details. `owner-content` remains in source. Future API activation should replace the selected provider explicitly; there is no automatic fallback.

Before activation:

1. Verify the current official Creators API authentication, credentials, supported marketplaces, resources, content license, and quotas for this account.
2. Implement a server-only `client.ts`, `auth.ts`, and `mapResponse.ts`, backed by mocked documented responses and later live credential tests. Do not assume a single API key is sufficient.
3. Extend the common preview contract with permitted image references, field provenance, and `fetchedAt`/`expiresAt`. Keep API content separate from independently authored owner content. Implement server-owned previews and source snapshots before accepting API preview selections in product writes.
4. Add an append-only migration for provider-managed snapshots and expiry, plus public display/refresh rules and required attribution. The current `product_content_sources` table records owner assertions at assisted creation; it is not an API cache or proof of licensing.
5. Update the preview route's explicit not-ready guard and add the API-specific draft acceptance path. Existing draft provenance accepts `owner-content` and `amazon-page`; do not relabel those records as API content.
6. Configure Worker secrets and gitignored local values matching the verified credential scheme. Never expose them to React, logs, or source control.
7. Replace the import/export in `composition.ts` with `createAmazonApiProvider` only after authentication, content lifetime, and integration checks pass.
8. Remove the page adapter if desired, while preserving normal manual editing. Confirm API failures return errors without another provider or page download being invoked.

Approved Amazon short links are expanded by `../../resolveProductUrl.ts` for previews and manual saves. This reads redirect headers only. The selected page provider then fetches the canonical product page during preview. The affiliate link policy replaces pasted tracking tags with the configured owner's tag.

References:

- [Official API introduction](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction)
- [Project design and migration plan](../../../../../context/product-url-import-plan.md)
- [Implemented first release](../../../../../context/product-url-assistance.md)
