import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STASH_MAX, parseStash, toggleStash } from '../../src/lib/stash';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

test('a stored stash is read defensively: only well-formed, unique ids survive', () => {
  assert.deepEqual(parseStash(null), []);
  assert.deepEqual(parseStash(''), []);
  assert.deepEqual(parseStash('not json'), []);
  assert.deepEqual(parseStash('{"a":1}'), []);
  assert.deepEqual(parseStash(JSON.stringify([id(1), 7, null, '<script>', id(1), 'x'.repeat(5000), id(2)])), [id(1), id(2)]);
  assert.equal(parseStash(JSON.stringify(Array.from({ length: STASH_MAX + 20 }, (_, i) => id(i)))).length, STASH_MAX);
});

test('toggling saves newest first, removes on the second press and keeps the stash bounded', () => {
  let ids: string[] = [];
  ids = toggleStash(ids, id(1));
  ids = toggleStash(ids, id(2));
  assert.deepEqual(ids, [id(2), id(1)]);
  assert.deepEqual(toggleStash(ids, id(1)), [id(2)]);
  const full = Array.from({ length: STASH_MAX }, (_, i) => id(i));
  const next = toggleStash(full, id(999));
  assert.equal(next.length, STASH_MAX);
  assert.equal(next[0], id(999));
  assert.ok(!next.includes(id(STASH_MAX - 1)), 'the oldest entry makes room');
  assert.deepEqual(full.length, STASH_MAX, 'the input list is not changed');
});
