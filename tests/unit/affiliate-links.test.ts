import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyAssociateTag, prepareAffiliateLink } from '../../worker/lib/affiliateLinks';

const config = { allowedHosts: ['amazon.in', 'amazon.com', 'amzn.to'], associateTags: { 'amazon.in': 'mine-21', 'amazon.com': 'mine-20' } };

test('replaces all pasted tags and removes previous affiliate tracking while keeping variant parameters', () => {
  const url = new URL(applyAssociateTag('https://www.amazon.in/dp/B0TEST0001?tag=other-21&tag=duplicate-21&ascsubtag=other&linkId=old&th=1&psc=1', config));
  assert.deepEqual(url.searchParams.getAll('tag'), ['mine-21']);
  assert.equal(url.searchParams.has('ascsubtag'), false);
  assert.equal(url.searchParams.has('linkId'), false);
  assert.equal(url.searchParams.get('th'), '1');
  assert.equal(url.searchParams.get('psc'), '1');
  assert.equal(new URL(applyAssociateTag('https://www.amazon.com/dp/B0TEST0001?tag=other-20', config)).searchParams.get('tag'), 'mine-20');
});

test('owner override and sub-ID take precedence; missing configuration does not invent a tag', () => {
  const url = new URL(applyAssociateTag('https://www.amazon.in/dp/B0TEST0001?tag=other-21&ascsubtag=old', config, 'campaign-21', 'my-campaign'));
  assert.equal(url.searchParams.get('tag'), 'campaign-21');
  assert.equal(url.searchParams.get('ascsubtag'), 'my-campaign');
  assert.equal(new URL(applyAssociateTag('https://amazon.in/dp/B0TEST0001?tag=existing-21', { ...config, associateTags: {} })).searchParams.get('tag'), 'existing-21');
  assert.equal(new URL(applyAssociateTag('https://amazon.in/dp/B0TEST0001', { ...config, associateTags: { '*': 'fallback-21' } })).searchParams.get('tag'), 'fallback-21');
});

test('expands a short link before replacing another affiliate tag', async t => {
  const network = t.mock.method(globalThis, 'fetch', async () => new Response(null, {status:302,headers:{location:'https://www.amazon.in/dp/B0TEST0001?tag=other-21&th=1'}}));
  const url = new URL((await prepareAffiliateLink('https://amzn.to/example', config))!);
  assert.equal(url.searchParams.get('tag'), 'mine-21');
  assert.equal(url.searchParams.get('th'), '1');
  assert.equal(network.mock.callCount(), 1);
});
