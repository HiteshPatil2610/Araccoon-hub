import { it } from 'node:test';
import assert from 'node:assert/strict';
import { api, HttpError } from '../../src/lib/api';

const request = { url: 'https://www.amazon.in/dp/B000000000', title: '', description: '', features: [] };
const preview = {
  provider: 'owner-content',
  identity: { marketplace: 'amazon.in', asin: 'B000000000', canonicalUrl: request.url },
  affiliateUrl: request.url, suggestions: {}, provenance: 'owner-supplied', warnings: [], duplicate: null,
};

it('rejects malformed import previews before they reach the rendering panel', async t => {
  const invalid = [[], {}, { ...preview, identity: undefined }, { ...preview, warnings: undefined }, { ...preview, suggestions: null }];
  for (const payload of invalid) {
    const mock = t.mock.method(globalThis, 'fetch', async () => Response.json(payload));
    await assert.rejects(api.previewProductImport(request, new AbortController().signal), (error: unknown) =>
      error instanceof HttpError && error.status === 502 && /incomplete product preview/.test(error.message));
    mock.mock.restore();
  }
});

it('accepts a complete preview and preserves its product identity', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json(preview));
  assert.deepEqual(await api.previewProductImport(request, new AbortController().signal), preview);
});

it('preserves the preview server error for inline display', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Product imports are unavailable in this UI preview.' }, { status: 503 }));
  await assert.rejects(api.previewProductImport(request, new AbortController().signal), (error: unknown) =>
    error instanceof HttpError && error.status === 503 && /unavailable/.test(error.message));
});
