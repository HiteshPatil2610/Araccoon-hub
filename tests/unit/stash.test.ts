import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LIST_NAME, LIST_ITEMS_MAX, LIST_MAX, NAME_MAX, cleanName, createList, deleteList, parseLists, renameList, savedIds, toggleInList, uniqueName,
} from '../../src/lib/stash';
import { matchShared, parseSharedList, sharedListPath } from '../../src/lib/stashShare';

const id = (n: number) => `${String(n).padStart(8, '0')}-0000-4000-8000-000000000000`;

test('stored lists are read defensively and always leave somewhere to save', () => {
  for (const raw of [null, '', 'not json', '{"lists":"x"}', '{"lists":[]}', JSON.stringify({ lists: [{ id: 'BAD ID', name: 'x', ids: [] }] })]) {
    const state = parseLists(raw);
    assert.equal(state.lists.length, 1, String(raw));
    assert.equal(state.lists[0]!.name, DEFAULT_LIST_NAME);
    assert.equal(state.last, state.lists[0]!.id);
  }
  const state = parseLists(JSON.stringify({
    last: 'gone',
    lists: [
      { id: 'a1', name: '  Gift‮ ideas  ', ids: [id(1), 7, '<script>', id(1), id(2)] },
      { id: 'a1', name: 'Duplicate id', ids: [] },
      { id: 'b2', name: '   ', ids: [] },
      { id: 'c3', name: 'Desk', ids: 'nope' },
    ],
  }));
  assert.deepEqual(state.lists, [{ id: 'a1', name: 'Gift ideas', ids: [id(1), id(2)] }, { id: 'c3', name: 'Desk', ids: [] }]);
  assert.equal(state.last, 'a1', 'a missing last list falls back to the first');
  const many = parseLists(JSON.stringify({ lists: Array.from({ length: LIST_MAX + 5 }, (_, i) => ({ id: `l${i}`, name: `L${i}`, ids: [] })) }));
  assert.equal(many.lists.length, LIST_MAX);
});

test('the older single stash becomes the first list', () => {
  const state = parseLists(null, JSON.stringify([id(3), id(4)]));
  assert.deepEqual(state.lists, [{ id: 'stash', name: DEFAULT_LIST_NAME, ids: [id(3), id(4)] }]);
  assert.deepEqual(parseLists(null, 'broken').lists[0]!.ids, []);
  const existing = JSON.stringify({ lists: [{ id: 'x', name: 'Mine', ids: [] }], last: 'x' });
  assert.equal(parseLists(existing, JSON.stringify([id(3)])).lists[0]!.name, 'Mine', 'lists win over the old stash');
});

test('a find can be in several lists, toggles per list, and the last list used is remembered', () => {
  let state = parseLists(null);
  state = createList(state, 'Gift ideas', 'g1')!;
  state = toggleInList(state, 'stash', id(1));
  state = toggleInList(state, 'g1', id(1));
  state = toggleInList(state, 'g1', id(2));
  assert.deepEqual(state.lists.map(l => l.ids), [[id(1)], [id(2), id(1)]]);
  assert.equal(state.last, 'g1');
  assert.deepEqual([...savedIds(state)].sort(), [id(1), id(2)]);
  state = toggleInList(state, 'g1', id(1));
  assert.deepEqual(state.lists[1]!.ids, [id(2)]);
  assert.ok(savedIds(state).has(id(1)), 'still saved in the other list');
  assert.equal(toggleInList(state, 'nope', id(1)), state, 'unknown list: no change');
  assert.equal(toggleInList(state, 'g1', 'not-an-id'), state);
  let full = createList(parseLists(null), 'Full', 'f1', Array.from({ length: LIST_ITEMS_MAX }, (_, i) => id(i + 10)))!;
  full = toggleInList(full, 'f1', id(999));
  assert.equal(full.lists[1]!.ids.length, LIST_ITEMS_MAX);
  assert.equal(full.lists[1]!.ids[0], id(999));
});

test('list names are plain, short and unique; renaming and deleting', () => {
  assert.equal(cleanName('  a\u0000b \n\t c​ '), 'ab c');
  assert.equal(cleanName('x'.repeat(200)).length, NAME_MAX);
  assert.equal(cleanName(42), '');
  let state = createList(parseLists(null), 'Desk', 'd1')!;
  assert.equal(uniqueName(state, 'desk'), 'desk 2');
  state = createList(state, 'Desk', 'd2')!;
  assert.equal(state.lists[2]!.name, 'Desk 2');
  assert.equal(createList(state, 'Again', 'd1'), null, 'ids are unique');
  state = renameList(state, 'd2', 'Gifts');
  assert.equal(state.lists[2]!.name, 'Gifts');
  assert.equal(renameList(state, 'd2', '   '), state, 'an empty name is refused');
  assert.equal(renameList(state, 'd1', 'Desk').lists[1]!.name, 'Desk', 'keeping its own name is fine');
  state = deleteList(state, 'd1');
  assert.deepEqual(state.lists.map(l => l.id), ['stash', 'd2']);
  const emptied = deleteList(deleteList(state, 'stash'), 'd2');
  assert.deepEqual(emptied.lists.map(l => l.name), [DEFAULT_LIST_NAME], 'there is always one list');
  let capped = parseLists(null);
  for (let i = 1; i < LIST_MAX; i++) capped = createList(capped, `L${i}`, `l${i}`)!;
  assert.equal(capped.lists.length, LIST_MAX);
  assert.equal(createList(capped, 'One more', 'extra'), null);
});

test('a shared link carries the name and short find ids, and reads back safely', () => {
  const path = sharedListPath('Gift ideas & more', [id(1), id(2), id(1)]);
  assert.ok(path.startsWith('/stash/shared?'));
  const back = parseSharedList(path.slice(path.indexOf('?')));
  assert.deepEqual(back, { name: 'Gift ideas & more', keys: ['00000001', '00000002'] });
  assert.deepEqual(parseSharedList('?finds=zzzz.00000001..ABCDEF12.1234&name='), { name: 'Shared list', keys: ['00000001', 'abcdef12'] });
  assert.equal(parseSharedList(`?name=${'n'.repeat(500)}`).name.length, NAME_MAX);
  const products = [{ id: id(2) }, { id: id(1) }];
  assert.deepEqual(matchShared(products, ['00000001', 'ffffffff', '00000002']), { finds: [{ id: id(1) }, { id: id(2) }], missing: 1 });
});
