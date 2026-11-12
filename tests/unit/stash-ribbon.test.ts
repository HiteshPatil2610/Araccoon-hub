import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RIBBON_TIMING, ribbonDirection, ribbonWords, runStashRibbon, type RibbonDirection } from '../../src/lib/stashRibbon';

type Step = { delay: number; duration: number; frames: Keyframe[] };

/** Just enough of a DOM for the ribbon: elements that record their animations and removal. */
function fakeDocument(animate: (frames: Keyframe[], opts: KeyframeAnimationOptions) => Promise<void>) {
  const attached = new Set<FakeEl>();
  const log: string[] = [];
  const steps: Step[] = [];
  class FakeEl {
    className = '';
    textContent = '';
    style: Record<string, string> = {};
    setAttribute() {}
    append() {}
    remove() { attached.delete(this); log.push('removed'); }
    animate(frames: Keyframe[], opts: KeyframeAnimationOptions) {
      steps.push({ delay: Number(opts.delay ?? 0), duration: Number(opts.duration), frames });
      log.push(`animate ${this.className}`);
      return { finished: animate(frames, opts) };
    }
  }
  const body = { append(el: FakeEl) { attached.add(el); log.push('attached'); } };
  const doc = { body, createElement: () => new FakeEl() } as unknown as Document;
  return { doc, attached, log, steps };
}

const options = (doc: Document, revealOnly = false) => ({
  doc, revealOnly, words: ['Your', ' stash'] as [string, string],
  size: () => ({ width: 1280, height: 800 }),
  origin: () => ({ left: 1136, right: 1180, top: 26, bottom: 70 }),
});

test('the ribbon plays only when entering or leaving Your lists', () => {
  assert.equal(ribbonDirection('/', '/stash'), 'in');
  assert.equal(ribbonDirection('/find/lamp-12345678', '/stash'), 'in');
  assert.equal(ribbonDirection('/stash/shared', '/stash'), 'in');
  assert.equal(ribbonDirection('/stash', '/'), 'out');
  assert.equal(ribbonDirection('/stash/', '/articles'), 'out');
  assert.equal(ribbonDirection('/stash', '/stash'), null);
  assert.equal(ribbonDirection('/stash', '/stash/shared'), null);
  assert.equal(ribbonDirection('/', '/articles'), null);
  assert.equal(ribbonDirection('/', '/stash/shared'), null);
  assert.deepEqual(ribbonWords('in', '/stash'), ['Your', ' stash']);
  assert.deepEqual(ribbonWords('out', '/'), ['The', ' finds']);
  assert.deepEqual(ribbonWords('out', '/find/lamp-12345678'), ['The', ' finds']);
  assert.deepEqual(ribbonWords('out', '/articles'), ['Raccoon', ' Hub']);
});

for (const direction of ['in', 'out'] as RibbonDirection[]) {
  test(`going ${direction}, the page changes once behind the ribbon, which then leaves and removes itself`, async () => {
    const { doc, attached, log } = fakeDocument(async () => {});
    let swaps = 0;
    await runStashRibbon(direction, async () => { await Promise.resolve(); swaps++; log.push('swap'); }, options(doc));
    assert.equal(swaps, 1);
    assert.equal(attached.size, 0);
    const swapAt = log.indexOf('swap');
    assert.ok(log.slice(0, swapAt).some(l => l === 'animate stash-ribbon'), 'covered before the swap');
    assert.ok(log.slice(swapAt).some(l => l === 'animate stash-ribbon'), 'uncovered after the swap');
    assert.equal(log.at(-1), 'removed');
  });
}

test('the second half waits for the hold, and the page change is awaited first', async () => {
  let navigated = false;
  const { doc, steps } = fakeDocument(async () => {});
  await runStashRibbon('in', async () => { await new Promise(r => setTimeout(r, 5)); navigated = true; }, options(doc));
  assert.equal(navigated, true);
  const lift = steps.find(s => s.frames[0]?.transform === 'none' && String(s.frames[1]?.transform ?? '').startsWith('translateY(-'));
  assert.ok(lift);
  assert.equal(lift.delay, RIBBON_TIMING.hold);
  assert.equal(lift.duration, RIBBON_TIMING.lift);
  const unroll = steps[0]!;
  assert.match(String(unroll.frames[0]!.clipPath), /^polygon\(1142\.6px 0px, 1173\.4px 0px, 1173\.4px 48px/, 'starts as a narrow ribbon at the stash button');
});

test('the ribbon still changes the page and cleans up when an animation fails', async () => {
  const { doc, attached } = fakeDocument(() => Promise.reject(new DOMException('aborted', 'AbortError')));
  let swaps = 0;
  await runStashRibbon('out', () => { swaps++; }, options(doc));
  assert.equal(swaps, 1);
  assert.equal(attached.size, 0);
});

test('Back/Forward only uncover: the ribbon starts covering the screen', async () => {
  const { doc, steps, log } = fakeDocument(async () => {});
  await runStashRibbon('out', () => { log.push('swap'); }, options(doc, true));
  assert.equal(log.indexOf('swap'), 1, 'nothing animates before the (empty) swap');
  assert.ok(steps.every(s => s.delay === RIBBON_TIMING.hold));
});
