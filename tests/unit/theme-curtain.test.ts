import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURTAIN_TIMING, runThemeCurtain } from '../../src/lib/themeCurtain';

type Step = { delay: number; duration: number; frames: Keyframe[] };

/** Just enough of a DOM for the curtain: elements that record their animations and removal. */
function fakeDocument(animate: (el: unknown, frames: Keyframe[], opts: KeyframeAnimationOptions) => Promise<void>) {
  const attached = new Set<FakeEl>();
  const log: string[] = [];
  class FakeEl {
    className = '';
    textContent = '';
    children: unknown[] = [];
    steps: Step[] = [];
    setAttribute() {}
    append(...nodes: unknown[]) { this.children.push(...nodes); }
    remove() { attached.delete(this); log.push('removed'); }
    animate(frames: Keyframe[], opts: KeyframeAnimationOptions) {
      this.steps.push({ delay: Number(opts.delay ?? 0), duration: Number(opts.duration), frames });
      return { finished: animate(this, frames, opts) };
    }
  }
  const body = { append(el: FakeEl) { attached.add(el); log.push('attached'); } };
  const doc = { body, createElement: () => new FakeEl() } as unknown as Document;
  return { doc, attached, log };
}

test('the curtain covers, swaps the theme once behind it, then uncovers and removes itself', async () => {
  const { doc, attached, log } = fakeDocument(async () => {});
  let swaps = 0;
  await runThemeCurtain(() => { swaps++; log.push('swap'); }, doc);
  assert.equal(swaps, 1);
  assert.equal(attached.size, 0);
  assert.deepEqual(log, ['attached', 'swap', 'removed']);
});

test('the curtain still swaps the theme and cleans up when an animation fails', async () => {
  const { doc, attached } = fakeDocument(() => Promise.reject(new DOMException('aborted', 'AbortError')));
  let swaps = 0;
  await runThemeCurtain(() => { swaps++; }, doc);
  assert.equal(swaps, 1);
  assert.equal(attached.size, 0);
});

test('the swap happens only after the sweep in, and the sweep out waits for the hold', async () => {
  const seen: Step[] = [];
  let swapped = false;
  const { doc } = fakeDocument(async (_el, frames, opts) => {
    seen.push({ delay: Number(opts.delay ?? 0), duration: Number(opts.duration), frames });
    if (frames[0]?.clipPath === 'inset(0 100% 0 0)') assert.equal(swapped, false, 'swapped before covering');
  });
  await runThemeCurtain(() => { swapped = true; }, doc);
  const sweepOut = seen.find(s => s.frames[1]?.clipPath === 'inset(0 0 0 100%)');
  assert.ok(sweepOut);
  assert.equal(sweepOut.delay, CURTAIN_TIMING.hold);
  assert.equal(sweepOut.duration, CURTAIN_TIMING.reveal);
});
