import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_COMPARE, comparable, compareRows, compareValue, parseCompare } from '../../src/lib/compare';
import type { Tier } from '../../shared/productFacts';

const find = (n: number, specs: [string, string][] = [['Weight', `${n}0 g`]], brand: string | null = null, tier: Tier | null = null) => ({
  id: `0000000${n}-0000-4000-8000-000000000000`, brand, tier, specs: specs.map(([name, value]) => ({ name, value })),
});

describe('compare', () => {
  it('lines specs up by name whatever the case or punctuation, complete rows first', () => {
    const rows = compareRows([
      find(1, [['Colour', 'Black'], ['Max DPI', '12,000'], ['Weight', '99 g']]),
      find(2, [['weight:', '54 g'], ['max-dpi', '12,000']]),
    ]);
    assert.deepEqual(rows.map(r => [r.name, r.values, r.differs]), [
      ['Max DPI', ['12,000', '12,000'], false],
      ['Weight', ['99 g', '54 g'], true],
      ['Colour', ['Black', null], true],
    ]);
  });

  it('puts brand and tier first and leaves them out when no find has one', () => {
    const rows = compareRows([find(1, undefined, 'Kestrel', 'premium'), find(2, undefined, 'Dabba', null)]);
    assert.deepEqual(rows.slice(0, 2).map(r => [r.key, r.values, r.differs]), [
      ['brand', ['Kestrel', 'Dabba'], true],
      ['tier', ['Premium', null], true],
    ]);
    assert.deepEqual(compareRows([find(1), find(2)]).map(r => r.key), ['spec:weight']);
  });

  it('treats values that differ only in case or outer spaces as the same', () => {
    const [weight] = compareRows([find(1, [['Weight', '99 G ']]), find(2, [['Weight', '99 g']])]);
    assert.equal(weight!.differs, false);
  });

  it('reads the address: order kept, unknown, repeated, malformed and spec-less finds dropped, four at most', () => {
    const finds = [find(1), find(2), find(3, []), find(4), find(5), find(6)];
    assert.ok(!comparable(finds[2]!));
    const picked = parseCompare('00000002.zzzzzzzz.00000001.00000002.00000003.0000000.00000009', finds);
    assert.deepEqual(picked.map(f => f.id[7]), ['2', '1']);
    assert.equal(parseCompare('00000001.00000002.00000004.00000005.00000006', finds).length, MAX_COMPARE);
    assert.deepEqual(parseCompare(null, finds), []);
    assert.deepEqual(parseCompare('', finds), []);
  });

  it('writes an address value that reads back to the same finds', () => {
    const finds = [find(1), find(2), find(4)];
    assert.equal(compareValue([finds[2]!, finds[0]!]), '00000004.00000001');
    assert.deepEqual(parseCompare(compareValue([finds[2]!, finds[0]!]), finds), [finds[2], finds[0]]);
  });
});
