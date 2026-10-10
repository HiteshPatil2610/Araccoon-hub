import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { heroHandoff, type HandoffGeometry } from '../src/lib/heroHandoff';

const geometry: HandoffGeometry = {
  heroTop: 0, heroHeight: 1000, picksTop: 1000, boxTop: 1600,
  viewportHeight: 1000, viewportWidth: 1440, reducedMotion: false,
};
const scroll = (amount: number) => heroHandoff({ ...geometry,
  heroTop: -amount, picksTop: geometry.picksTop - amount, boxTop: geometry.boxTop - amount,
});

test('initial hero has no offset or red divider; the divider appears only on scrolling', () => {
  assert.deepEqual(scroll(0), { lag: 0, picks: 0, box: 0, divider: 0 });
  assert.equal(scroll(28).divider, .5);
  assert.equal(scroll(56).divider, 1);
});

test('desktop text travels approximately 2.3 times slower than the character', () => {
  const characterTravel = 481;
  const titleTravel = characterTravel - scroll(characterTravel).lag;
  assert.ok(Math.abs(titleTravel - 207) < 1);
});

test('Picks reveals before the lower artwork and progresses continuously', () => {
  assert.ok(scroll(180).picks > 0 && scroll(180).picks < 1);
  assert.equal(scroll(180).box, 0);
  assert.equal(scroll(600).picks, 1);
  assert.equal(scroll(600).box, 0);
  assert.equal(scroll(700).box, .5);
  assert.equal(scroll(800).box, 1);
});

test('reversing or jumping scroll restores the same geometry without a timer', () => {
  const first = scroll(200);
  scroll(800);
  assert.deepEqual(scroll(200), first);
  assert.deepEqual(scroll(0), { lag: 0, picks: 0, box: 0, divider: 0 });
  const end = scroll(3000);
  assert.ok(Math.abs(end.lag - 570) < .001);
  assert.deepEqual({ picks: end.picks, box: end.box, divider: end.divider }, { picks: 1, box: 1, divider: 1 });
});

test('phones and tablets preserve the desktop foreground/background scroll ratio', () => {
  const desktop = heroHandoff({ ...geometry, heroTop: -200 });
  const tablet = heroHandoff({ ...geometry, heroTop: -200, viewportWidth: 800 });
  const mobile = heroHandoff({ ...geometry, heroTop: -200, viewportWidth: 390 });
  assert.equal(desktop.lag, tablet.lag);
  assert.equal(desktop.lag, mobile.lag);
  assert.ok(Math.abs(mobile.lag - 114) < .001);
});

test('entry progress adapts to the current viewport height', () => {
  const resized = heroHandoff({ ...geometry, viewportHeight: 600, picksTop: 470 });
  assert.ok(resized.picks > 0 && resized.picks < 1);
});

test('reduced motion exposes content immediately; divider still waits for scrolling', () => {
  assert.deepEqual(heroHandoff({ ...geometry, reducedMotion: true }), { lag: 0, picks: 1, box: 1, divider: 0 });
  assert.deepEqual(heroHandoff({ ...geometry, heroTop: -800, reducedMotion: true }), { lag: 0, picks: 1, box: 1, divider: 1 });
});
