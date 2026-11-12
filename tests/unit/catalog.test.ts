import { test } from 'node:test';
import assert from 'node:assert/strict';
import { featuredProducts, pickSurprise } from '../../src/lib/catalog';
import type { PublicProduct } from '../../shared/types';

const product = (id: string, overrides: Partial<PublicProduct> = {}): PublicProduct => ({
  id, title: id, description: '', category: 'Desk & Office', rating: 0, reviewCount: 0,
  imageUrl: 'https://example.test/product.jpg', featured: true, badge: null, pickNote: null,
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
