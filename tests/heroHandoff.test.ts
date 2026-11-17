import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { heroHandoff, type HandoffGeometry } from '../src/lib/heroHandoff';

const geometry: HandoffGeometry = {
  heroTop: 0, heroHeight: 1000, reducedMotion: false,
};
const scroll = (amount: number) => heroHandoff({ ...geometry,
  heroTop: -amount,
});

test('initial hero has no scroll offset', () => {
  assert.deepEqual(scroll(0), { lag: 0 });
});

test('desktop text travels approximately 2.3 times slower than the character', () => {
  const characterTravel = 481;
  const titleTravel = characterTravel - scroll(characterTravel).lag;
  assert.ok(Math.abs(titleTravel - 207) < 1);
});

test('reversing or jumping scroll restores the same hero offset without a timer', () => {
  const first = scroll(200);
  scroll(800);
  assert.deepEqual(scroll(200), first);
  assert.deepEqual(scroll(0), { lag: 0 });
});

test('reduced motion disables the scroll offset', () => {
  assert.deepEqual(heroHandoff({ ...geometry, heroTop: -800, reducedMotion: true }), { lag: 0 });
});
