import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heroPosterScale } from '../../src/lib/heroTypography';

test('poster retains its visual weight across portrait, desktop and wide short stages', () => {
  for (const [stage, glyph] of [[596, 220], [562, 351], [1065, 625], [576, 625]]) {
    const height = glyph! * heroPosterScale(stage!, glyph!);
    assert.ok(Math.abs(height / stage! - .62) < .001);
  }
});

test('poster scaling is bounded on narrow phones and extreme aspect ratios', () => {
  assert.equal(heroPosterScale(400, 80), 1.85);
  assert.equal(heroPosterScale(200, 900), .5);
  assert.equal(heroPosterScale(0, 100), 1);
  assert.equal(heroPosterScale(500, 0), 1);
  assert.equal(heroPosterScale(NaN, 100), 1);
});
