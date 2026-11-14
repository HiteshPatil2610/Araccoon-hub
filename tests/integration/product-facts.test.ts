import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContext, integrationSkipReason, VALID_PRODUCT, type TestContext, type Browser } from '../support/testApp';

describe('product facts: brand, product type, tier and specs', { skip: integrationSkipReason }, () => {
  let t: TestContext;
  let owner: Browser;

  before(async () => {
    mock.method(console, 'error', () => {});
    t = await createTestContext();
    owner = (await t.setupOwner()).browser;
  });
  after(async () => { mock.restoreAll(); await t?.close(); });
  beforeEach(async () => { await t.db.query('DELETE FROM products'); });

  const create = async (patch: Record<string, unknown> = {}) => {
    const res = await owner.post('/api/admin/products', { ...VALID_PRODUCT, ...patch });
    assert.equal(res.status, 201, res.text);
    return res.body;
  };
  const facts = (p: Record<string, unknown>) => [p.brand, p.productType, p.tier, p.specs];
  const specs = [{ name: 'Max DPI', value: '12,000' }, { name: 'Weight', value: '99 g' }];

  it('are optional and stored as entered', async () => {
    assert.deepEqual(facts(await create()), [null, null, null, []]);
    const mouse = await create({ brand: '  Logitech ', productType: 'Mouse', tier: 'value', specs });
    assert.deepEqual(facts(mouse), ['Logitech', 'Mouse', 'value', specs]);
  });

  it('are refused when invalid, naming the field, and nothing is written', async () => {
    for (const [patch, field] of [
      [{ tier: 'cheap' }, 'tier'],
      [{ brand: 'x'.repeat(61) }, 'brand'],
      [{ productType: 'x'.repeat(41) }, 'productType'],
      [{ specs: [{ name: 'Weight', value: '' }] }, 'specs'],
      [{ specs: [{ name: 'Weight', value: '99 g' }, { name: ' weight: ', value: '101 g' }] }, 'specs'],
      [{ specs: Array.from({ length: 25 }, (_, i) => ({ name: `Row ${i}`, value: 'x' })) }, 'specs'],
      [{ specs: [{ name: 'Weight', value: '99 g', unit: 'g' }] }, 'specs'],
    ] as const) {
      const bad = await owner.post('/api/admin/products', { ...VALID_PRODUCT, ...patch });
      assert.equal(bad.status, 400, `${field}: ${bad.text}`);
      // Errors inside a spec row are keyed by their path, e.g. "specs.0.value".
      assert.ok(Object.keys(bad.body.fields).some(k => k === field || k.startsWith(`${field}.`)), `${field}: ${bad.text}`);
    }
    const { rows } = await t.db.query('SELECT 1 FROM products');
    assert.equal(rows.length, 0);
  });

  it('survive unrelated edits and can be changed or cleared one at a time', async () => {
    const mouse = await create({ brand: 'Logitech', productType: 'Mouse', tier: 'value', specs });
    const retitled = await owner.patch(`/api/admin/products/${mouse.id}`, { title: 'Renamed' });
    assert.deepEqual(facts(retitled.body), ['Logitech', 'Mouse', 'value', specs]);
    const changed = await owner.patch(`/api/admin/products/${mouse.id}`, { tier: null, brand: '', specs: [specs[1]] });
    assert.equal(changed.status, 200, changed.text);
    assert.deepEqual(facts(changed.body), [null, 'Mouse', null, [specs[1]]]);
    const emptied = await owner.patch(`/api/admin/products/${mouse.id}`, { specs: [] });
    assert.deepEqual(emptied.body.specs, []);
  });

  it('are copied on duplicate, shown to visitors and searchable by the owner', async () => {
    const mouse = await create({ brand: 'Logitech', productType: 'Mouse', tier: 'premium', specs });
    const copy = await owner.post(`/api/admin/products/${mouse.id}/duplicate`, {});
    assert.equal(copy.status, 201, copy.text);
    assert.deepEqual(facts(copy.body), ['Logitech', 'Mouse', 'premium', specs]);

    const list = await t.browser().get('/api/products');
    assert.equal(list.status, 200, list.text);
    assert.equal(list.body.length, 1, 'the copy is a draft');
    assert.deepEqual(facts(list.body[0]), ['Logitech', 'Mouse', 'premium', specs]);

    for (const term of ['logitech', 'mouse']) {
      const found = await owner.get(`/api/admin/products?search=${term}`);
      assert.equal(found.body.length, 2, term);
    }
    const none = await owner.get('/api/admin/products?search=razer');
    assert.equal(none.body.length, 0);
  });
});
