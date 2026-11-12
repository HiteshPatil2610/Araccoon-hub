import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RECENT_MAX, addRecent, newSince, parseRecent, parseVisit } from '../../src/lib/visits';
import { findOfTheDay, siteDay } from '../../src/lib/catalog';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

test('a stored last visit is read defensively', () => {
  assert.equal(parseVisit(null), null);
  assert.equal(parseVisit(''), null);
  assert.equal(parseVisit('not a date'), null);
  assert.equal(parseVisit('x'.repeat(200)), null);
  assert.equal(parseVisit('2026-11-01T10:00:00Z'), '2026-11-01T10:00:00.000Z');
});

test('new since the last visit: only later finds, and nothing on a first visit', () => {
  const finds = [
    { id: 'old', createdAt: '2026-10-01T00:00:00Z' },
    { id: 'same', createdAt: '2026-11-01T10:00:00Z' },
    { id: 'new', createdAt: '2026-11-05T00:00:00Z' },
  ];
  assert.deepEqual(newSince(finds, '2026-11-01T10:00:00.000Z').map(p => p.id), ['new']);
  assert.deepEqual(newSince(finds, null), [], 'first visit: everything would be new, so nothing is marked');
});

test('recently opened finds: damaged storage, newest first, no repeats, bounded', () => {
  assert.deepEqual(parseRecent(null), []);
  assert.deepEqual(parseRecent('nope'), []);
  assert.deepEqual(parseRecent(JSON.stringify([id(1), 3, '<b>', id(1), id(2)])), [id(1), id(2)]);
  let ids: string[] = [];
  ids = addRecent(ids, id(1));
  ids = addRecent(ids, id(2));
  ids = addRecent(ids, id(1));
  assert.deepEqual(ids, [id(1), id(2)], 'opening a find again moves it to the front');
  assert.deepEqual(addRecent(ids, 'not-an-id'), ids);
  const full = Array.from({ length: RECENT_MAX }, (_, i) => id(i + 10));
  const next = addRecent(full, id(99));
  assert.equal(next.length, RECENT_MAX);
  assert.equal(next[0], id(99));
  assert.equal(full.length, RECENT_MAX, 'the input list is not changed');
});

test('the site day follows India time, not the visitor clock', () => {
  assert.equal(siteDay(new Date('2026-11-12T18:29:00Z')), '2026-11-12');
  assert.equal(siteDay(new Date('2026-11-12T18:31:00Z')), '2026-11-13', 'after midnight in India');
});

test('find of the day: same for a given day, every find has a turn before any repeats, image required', () => {
  const finds = Array.from({ length: 5 }, (_, i) => ({ id: id(i), imageUrl: 'https://example.test/a.jpg' }));
  assert.equal(findOfTheDay([], '2026-11-12'), null);
  assert.equal(findOfTheDay([{ id: id(1), imageUrl: ' ' }], '2026-11-12'), null);
  assert.equal(findOfTheDay(finds, '2026-11-12'), findOfTheDay([...finds].reverse(), '2026-11-12'), 'display order does not matter');
  const days = ['2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16'];
  const picks = days.map(d => findOfTheDay(finds, d)!.id);
  assert.equal(new Set(picks).size, 5, 'five days, five different finds');
  assert.equal(findOfTheDay(finds, '2026-11-17')!.id, picks[0], 'then the cycle starts again');
});
