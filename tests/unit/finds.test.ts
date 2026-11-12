import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findBySlug, findIdPrefix, findPath, findSlug } from '../../shared/finds';

const ID = '1F168659-6387-4099-a348-57e51d12cfcf';

test('find slugs are readable, bounded and safe in a URL', () => {
  assert.equal(findSlug('Magnetic Levitating Desk Plant Pot'), 'magnetic-levitating-desk-plant-pot');
  assert.equal(findSlug('  Café "Déjà vu" <b>/../ 100% </b> '), 'cafe-deja-vu-b-100-b');
  assert.equal(findSlug('日本語 !!!'), '');
  const long = findSlug('word '.repeat(40));
  assert.ok(long.length <= 60 && !long.endsWith('-'), long);
});

test('find paths end in the first 8 id characters and survive a title with no usable letters', () => {
  assert.equal(findPath({ id: ID, title: 'Desk Lamp' }), '/find/desk-lamp-1f168659');
  assert.equal(findPath({ id: ID, title: '!!!' }), '/find/1f168659');
});

test('only the id part of a slug identifies the find', () => {
  assert.equal(findIdPrefix('desk-lamp-1f168659'), '1f168659');
  assert.equal(findIdPrefix('1f168659'), '1f168659');
  assert.equal(findIdPrefix('an-old-title-that-changed-1f168659'), '1f168659');
  for (const bad of [undefined, '', 'desk-lamp', 'desk-lamp-1f16865', 'desk-lamp-1F168659', 'x1f168659', "1f168659' OR 1=1", `${'a'.repeat(80)}-1f168659`]) {
    assert.equal(findIdPrefix(bad), null, String(bad));
  }
  const finds = [{ id: 'aaaaaaaa-0000-4000-8000-000000000000' }, { id: ID }];
  assert.equal(findBySlug(finds, 'renamed-1f168659'), finds[1]);
  assert.equal(findBySlug(finds, 'gone-deadbeef'), null);
  assert.equal(findBySlug(finds, undefined), null);
});
