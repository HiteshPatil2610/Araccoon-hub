import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FLAPS_TIMING, flapWords, runStashFlaps, stashBack, stashDirection } from '../../src/lib/stashFlaps';

type Step = { el: string; delay: number; duration: number; frames: Keyframe[] };

/** Just enough of a DOM for the flaps: elements that record their animations and removal. */
function fakeDocument(animate: () => Promise<void>) {
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
      steps.push({ el: this.className, delay: Number(opts.delay ?? 0), duration: Number(opts.duration), frames });
      log.push('animate');
      return { finished: animate() };
    }
  }
  const body = { append(el: FakeEl) { attached.add(el); log.push('attached'); } };
  const doc = { body, createElement: () => new FakeEl() } as unknown as Document;
  return { doc, attached, log, steps };
}

const words: [string, string] = ['Your', ' stash'];

test('the flaps play only when entering or leaving Your lists', () => {
  assert.equal(stashDirection('/', '/stash'), 'in');
  assert.equal(stashDirection('/find/lamp-12345678', '/stash'), 'in');
  assert.equal(stashDirection('/stash/shared', '/stash'), 'in');
  assert.equal(stashDirection('/stash', '/'), 'out');
  assert.equal(stashDirection('/stash/', '/articles'), 'out');
  assert.equal(stashDirection('/stash', '/stash'), null);
  assert.equal(stashDirection('/stash', '/stash/shared'), null);
  assert.equal(stashDirection('/', '/articles'), null);
  assert.equal(stashDirection('/', '/stash/shared'), null);
  assert.deepEqual(flapWords('in', '/stash'), ['Your', ' stash']);
  assert.deepEqual(flapWords('out', '/'), ['The', ' finds']);
  assert.deepEqual(flapWords('out', '/find/lamp-12345678'), ['The', ' finds']);
  assert.deepEqual(flapWords('out', '/articles'), ['Raccoon', ' Hub']);
});

test('the stash page home button goes back where the visitor came from, else to the storefront', () => {
  assert.deepEqual(stashBack('/', true), { to: '/', viaHistory: true, label: 'Back to the finds' });
  assert.deepEqual(stashBack('/find/lamp-12345678', true), { to: '/find/lamp-12345678', viaHistory: true, label: 'Back to the finds' });
  assert.equal(stashBack('/articles/welcome', true).label, 'Back to the journal');
  assert.equal(stashBack('/collections/desk', true).label, 'Back to the collection');
  assert.equal(stashBack('/stash/shared', true).label, 'Back to the shared list');
  assert.equal(stashBack('/admin', true).label, 'Back to the previous page');
  const home = { to: '/', viaHistory: false, label: 'Go to the home page' };
  assert.deepEqual(stashBack(null, true), home, 'opened /stash directly');
  assert.deepEqual(stashBack('/articles', false), home, 'no earlier page in this tab');
  assert.deepEqual(stashBack('/stash', true), home);
});

test('both flaps close, the page changes once behind them, then they open and the overlay is removed', async () => {
  const { doc, attached, log, steps } = fakeDocument(async () => {});
  let swaps = 0;
  await runStashFlaps(async () => { await Promise.resolve(); swaps++; log.push('swap'); }, { doc, words });
  assert.equal(swaps, 1);
  assert.equal(attached.size, 0);
  assert.deepEqual(log, ['attached', 'animate', 'animate', 'swap', 'animate', 'animate', 'removed']);
  const [top, bottom] = steps;
  assert.match(top!.el, /--top/);
  assert.equal(top!.frames[0]!.transform, 'translateY(-101%)', 'the top flap comes down from above');
  assert.equal(bottom!.frames[0]!.transform, 'translateY(101%)', 'the bottom flap comes up from below');
  assert.ok(steps.slice(0, 2).every(s => s.frames[1]!.transform === 'none' && s.duration === FLAPS_TIMING.close));
});

test('the flaps open only after the hold, and the page change is awaited first', async () => {
  let navigated = false;
  const { doc, steps } = fakeDocument(async () => {});
  await runStashFlaps(async () => { await new Promise(r => setTimeout(r, 5)); navigated = true; }, { doc, words });
  assert.equal(navigated, true);
  const opening = steps.slice(2);
  assert.equal(opening.length, 2);
  assert.ok(opening.every(s => s.delay === FLAPS_TIMING.hold && s.duration === FLAPS_TIMING.open && s.frames[0]!.transform === 'none'));
});

test('the flaps still change the page and clean up when an animation fails', async () => {
  const { doc, attached } = fakeDocument(() => Promise.reject(new DOMException('aborted', 'AbortError')));
  let swaps = 0;
  await runStashFlaps(() => { swaps++; }, { doc, words });
  assert.equal(swaps, 1);
  assert.equal(attached.size, 0);
});

test('Back/Forward start with the flaps shut and only open them', async () => {
  const { doc, log, steps } = fakeDocument(async () => {});
  const made: { className: string; style: Record<string, string> }[] = [];
  const create = doc.createElement.bind(doc);
  doc.createElement = ((tag: string) => { const el = create(tag) as unknown as (typeof made)[number]; made.push(el); return el; }) as typeof doc.createElement;
  await runStashFlaps(() => { log.push('swap'); }, { doc, words, revealOnly: true });
  assert.deepEqual(made.filter(e => e.className.includes('__flap')).map(e => e.style.transform), ['none', 'none'], 'shut before anything animates');
  assert.deepEqual(log, ['attached', 'swap', 'animate', 'animate', 'removed']);
  assert.ok(steps.every(s => s.delay === FLAPS_TIMING.hold && s.frames[0]!.transform === 'none'));
});
