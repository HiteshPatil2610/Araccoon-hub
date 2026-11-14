import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HERO_CUES as C } from '../../src/lib/heroCues';

const TITLE_LETTERS = 'Raccoon'.length;
const LETTER_DURATION = 1400; // .poster-title__reveal in src/index.css

test('the disc grows from where the dot landed, after a short rest', () => {
  assert.equal(C.disc, C.dot + C.dotDrop + C.dotSettle);
  assert.ok(C.dotSettle >= 100 && C.dotSettle <= 300);
  assert.ok(C.glowOut >= C.disc && C.glowOut + 900 <= C.disc + C.discGrow, 'the dot light hands over to the disc while it grows');
});

test('the eyes are alone before the dot, and gone before the face is fully coloured', () => {
  assert.ok(C.blink < C.dot);
  assert.ok(C.dot >= 300, 'eyes-only pause');
  assert.ok(C.eyesOut > C.colour, 'eyes stay into the early colour fill');
  assert.ok(C.eyesOut + 500 <= C.colour + C.colourFill, 'no doubled eyes once the artwork is in full colour');
});

test('the reveal follows the intended order', () => {
  const order = [C.dot, C.disc, C.colour, C.title, C.hub, C.captions, C.year, C.nav, C.story, C.cta, C.badge, C.wave];
  for (let i = 1; i < order.length; i++) assert.ok(order[i]! >= order[i - 1]!, `cue ${i} starts before cue ${i - 1}`);
  assert.ok(C.mascot + 200 <= C.dot, 'the silhouette is solid before the dot enters, so the dot passes behind it');
  assert.ok(C.title > C.disc && C.title < C.disc + C.discGrow, 'title starts while the disc is still growing');
  assert.equal(C.lights, C.title, 'the black opening lifts as the title begins');
  assert.equal(C.strip, C.nav);
  assert.ok(C.nav >= C.disc + C.discGrow, 'navigation waits for the disc and mascot');
});

test('the recurring title wave waits for the whole entrance', () => {
  const lastLetterDone = C.title + (TITLE_LETTERS - 1) * C.letterStep + LETTER_DURATION;
  assert.ok(C.wave >= lastLetterDone);
  assert.ok(C.wave >= C.badge + 800);
});

test('the actions are usable within about four seconds', () => {
  assert.ok(C.cta + 800 <= 4100);
});
