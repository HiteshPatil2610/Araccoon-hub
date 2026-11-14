import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_SPECS, SPEC_NAME_MAX, SPEC_TEMPLATES, SPEC_VALUE_MAX, isTier, mergeSpecs, specKey, specTemplate } from '../../shared/productFacts';

describe('product facts', () => {
  it('matches spec names regardless of case, spacing and punctuation', () => {
    assert.equal(specKey('Max DPI'), specKey(' max-dpi: '));
    assert.notEqual(specKey('Weight'), specKey('Height'));
    assert.equal(specKey(' : '), '');
  });

  it('finds the usual rows for a known product type and none for an unknown one', () => {
    assert.deepEqual(specTemplate('mouse'), SPEC_TEMPLATES.Mouse);
    assert.deepEqual(specTemplate(' Power  Bank '), SPEC_TEMPLATES['Power bank']);
    assert.deepEqual(specTemplate('Teapot'), []);
    assert.deepEqual(specTemplate(''), []);
  });

  it('keeps every template inside the limits and free of repeated names', () => {
    for (const [type, rows] of Object.entries(SPEC_TEMPLATES)) {
      assert.ok(type.length <= 40, type);
      assert.ok(rows.length <= MAX_SPECS, type);
      assert.equal(new Set(rows.map(specKey)).size, rows.length, type);
      for (const row of rows) assert.ok(row.length <= SPEC_NAME_MAX, row);
    }
  });

  it('adds rows without changing or repeating the ones already there', () => {
    const current = [{ name: 'Weight', value: '99 g' }];
    const merged = mergeSpecs(current, [
      { name: 'weight:', value: '120 g' }, { name: 'Sensor:', value: ' HERO ' }, { name: '  ', value: 'x' }, { name: 'SENSOR', value: 'other' },
    ]);
    assert.deepEqual(merged, [{ name: 'Weight', value: '99 g' }, { name: 'Sensor', value: 'HERO' }]);
    assert.deepEqual(current, [{ name: 'Weight', value: '99 g' }]);
  });

  it('cuts long text to the limits and stops at the row limit', () => {
    const [row] = mergeSpecs([], [{ name: 'n'.repeat(100), value: 'v'.repeat(400) }]);
    assert.equal(row!.name.length, SPEC_NAME_MAX);
    assert.equal(row!.value.length, SPEC_VALUE_MAX);
    const many = Array.from({ length: 40 }, (_, i) => ({ name: `Row ${i}`, value: 'x' }));
    assert.equal(mergeSpecs([], many).length, MAX_SPECS);
  });

  it('accepts only the three tiers', () => {
    assert.ok(isTier('budget') && isTier('value') && isTier('premium'));
    assert.ok(!isTier('cheap') && !isTier(null) && !isTier(''));
  });
});
