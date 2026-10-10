import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storyEntranceProgress } from '../../src/lib/useStoryEntrance';

test('Story stays closed below the viewport and is complete when the heading is comfortably visible', () => {
  assert.equal(storyEntranceProgress(1000, 220, 900), 0);
  assert.equal(storyEntranceProgress(500, 220, 900), 1);
  assert.equal(storyEntranceProgress(-400, 220, 900), 1);
});

test('The unfolding follows scroll continuously instead of elapsed time', () => {
  const positions = [880, 820, 740, 660, 540];
  const progress = positions.map(top => storyEntranceProgress(top, 220, 900));
  assert.ok(progress[1]! > 0 && progress[1]! < 1);
  assert.ok(progress.every((value, i) => i === 0 || value > progress[i - 1]!));
});

test('Reverse scroll closes the title and re-entry replays the same sequence', () => {
  const down = [1000, 820, 740, 660, 500];
  const opening = down.map(top => storyEntranceProgress(top, 220, 900));
  const closing = [...down].reverse().map(top => storyEntranceProgress(top, 220, 900));
  assert.deepEqual(closing, [...opening].reverse());
  assert.equal(closing.at(-1), 0);
  assert.deepEqual(down.map(top => storyEntranceProgress(top, 220, 900)), opening);
});

test('Desktop, tablet, mobile and short viewports all have a usable entry range', () => {
  for (const [viewport, heading] of [[1080, 290], [900, 220], [1024, 120], [844, 90], [400, 90]]) {
    assert.equal(storyEntranceProgress(viewport! + 20, heading!, viewport!), 0);
    assert.equal(storyEntranceProgress(0, heading!, viewport!), 1);
    const partial = storyEntranceProgress(viewport! * .8, heading!, viewport!);
    assert.ok(partial > 0 && partial < 1);
  }
});

test('Reduced motion exposes the title immediately, even before it enters', () => {
  assert.equal(storyEntranceProgress(2000, 220, 900, true), 1);
});
