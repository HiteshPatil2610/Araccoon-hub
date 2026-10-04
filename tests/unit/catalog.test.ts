import { test } from 'node:test';
import assert from 'node:assert/strict';
import { featuredProducts } from '../../src/lib/catalog';
import type { PublicProduct } from '../../shared/types';

const product = (id: string, overrides: Partial<PublicProduct> = {}): PublicProduct => ({
  id, title: id, description: '', category: 'Desk & Office', rating: 0, reviewCount: 0,
  imageUrl: 'https://example.test/product.jpg', featured: true, badge: null,
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
