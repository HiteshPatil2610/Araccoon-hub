import { test } from 'node:test';
import assert from 'node:assert/strict';
import { featuredProducts, findOfTheDay, neighbours, pickSurprise, relatedFinds, siteDay } from '../../src/lib/catalog';
import type { PublicProduct } from '../../shared/types';

const product = (id: string, overrides: Partial<PublicProduct> = {}): PublicProduct => ({
  id, title: id, description: '', category: 'Desk & Office', rating: 0, reviewCount: 0,
  imageUrl: 'https://example.test/product.jpg', featured: true, badge: null, pickNote: null, brand: null, productType: null, tier: null, specs: [],
  store: 'amazon.in', createdAt: '2026-10-03T00:00:00Z', ...overrides,
});
test('featured board excludes unfeatured and missing-image records without filling empty slots', () => {
  assert.deepEqual(featuredProducts([]), []);
  const only = product('only');
  assert.deepEqual(featuredProducts([product('hidden', { featured: false }), only, product('blank', { imageUrl: ' ' })]), [only]);
});
test('featured board caps at three, sorts by date and ID, and leaves API order intact', () => {
  const original = [product('b'), product('old', { createdAt: '2026-10-01T00:00:00Z' }), product('a'), product('new', { createdAt: '2026-10-04T00:00:00Z' })];
  assert.deepEqual(featuredProducts(original).map(p => p.id), ['new', 'a', 'b']);
  assert.deepEqual(original.map(p => p.id), ['b', 'old', 'a', 'new']);
});
test('surprise picks skip the open find and do not repeat until every other find was shown', () => {
  const pool = ['a', 'b', 'c', 'd'].map(id => product(id));
  const seen = new Set<string>();
  assert.equal(pickSurprise([], seen), null);
  assert.equal(pickSurprise([pool[0]!], seen, 'a'), null, 'nothing else to show');
  const round: string[] = [];
  let current: string | null = 'a';
  for (let i = 0; i < 3; i++) {
    current = pickSurprise(pool, seen, current)!.id;
    round.push(current);
  }
  assert.deepEqual([...round].sort(), ['b', 'c', 'd'], 'one full round without repeats');
  const next = pickSurprise(pool, seen, current)!;
  assert.notEqual(next.id, current, 'a new round never repeats the open find');
  assert.equal(pickSurprise(pool, new Set(), null, () => 0)!.id, 'a');
  assert.equal(pickSurprise(pool, new Set(), null, () => 0.999999)!.id, 'd');
  assert.equal(pickSurprise(pool, new Set(), null, () => 1)!.id, 'd', 'an out-of-range random value stays in bounds');
});

test('previous and next follow the browsing order and wrap at both ends', () => {
  const list = ['a', 'b', 'c'].map(id => product(id));
  const first = neighbours(list, 'a')!;
  assert.deepEqual([first.prev.id, first.next.id, first.position, first.total], ['c', 'b', 1, 3]);
  const last = neighbours(list, 'c')!;
  assert.deepEqual([last.prev.id, last.next.id, last.position], ['b', 'a', 3]);
  assert.equal(neighbours(list, 'missing'), null, 'a find outside the list gets no arrows');
  assert.equal(neighbours([list[0]!], 'a'), null, 'nothing to step to');
  const pair = neighbours(list.slice(0, 2), 'a')!;
  assert.deepEqual([pair.prev.id, pair.next.id], ['b', 'b']);
});
test('more like this puts the same category first, tops up with other finds and never repeats the open one', () => {
  const open = product('open', { category: 'Desk & Office' });
  const list = [
    product('tech', { category: 'Tech & Gadgets' }), open, product('desk1', { category: 'desk & office' }),
    product('home', { category: 'Home & Living' }), product('desk2', { category: 'Desk & Office' }), product('fun', { category: 'Fun & Novelty' }),
  ];
  const more = relatedFinds(list, open);
  assert.deepEqual(more.finds.map(p => p.id), ['desk1', 'desk2', 'tech', 'home']);
  assert.equal(more.similar, true);
  const lonely = relatedFinds([open, product('tech', { category: 'Tech & Gadgets' })], open);
  assert.deepEqual([lonely.finds.map(p => p.id), lonely.similar], [['tech'], false]);
  assert.deepEqual(relatedFinds([open], open).finds, []);
});
test('the site day follows India time, not the visitor clock', () => {
  assert.equal(siteDay(new Date('2026-11-12T18:29:00Z')), '2026-11-12');
  assert.equal(siteDay(new Date('2026-11-12T18:31:00Z')), '2026-11-13', 'after midnight in India');
});
test('find of the day: same for a given day, every find has a turn before any repeats, image required', () => {
  const finds = ['a', 'b', 'c', 'd', 'e'].map(id => product(id));
  assert.equal(findOfTheDay([], '2026-11-12'), null);
  assert.equal(findOfTheDay([product('x', { imageUrl: ' ' })], '2026-11-12'), null);
  assert.equal(findOfTheDay(finds, '2026-11-12'), findOfTheDay([...finds].reverse(), '2026-11-12'), 'display order does not matter');
  const days = ['2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16'];
  const picks = days.map(d => findOfTheDay(finds, d)!.id);
  assert.equal(new Set(picks).size, 5, 'five days, five different finds');
  assert.equal(findOfTheDay(finds, '2026-11-17')!.id, picks[0], 'then the cycle starts again');
});
