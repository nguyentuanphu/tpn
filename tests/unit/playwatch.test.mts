// The auto play check's plan for a game (js/games/playwatch.js) and the saved tester policies (js/content/autoplay.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { playWatch, setPlan, tell } from '../../js/games/playwatch.js';
import { revertOf, apAllowed } from '../../js/content/autoplay.js';

test('a closing game clears only its own plan and allowance', () => {
  const first = () => null, second = () => null;
  const endFirst = setPlan(first, 36), endSecond = setPlan(second, 80);
  endFirst();
  assert.equal(playWatch.plan, second); assert.equal(playWatch.maxActions, 80);
  endSecond();
  assert.equal(playWatch.plan, null); assert.equal(playWatch.maxActions, 0);
});

test('an allowance that is not a positive count of taps counts as none', () => {
  for (const bad of [undefined, null, -3, 0, NaN, Infinity, '40', {}]) { const end = setPlan(() => null, bad); assert.equal(playWatch.maxActions, 0, String(bad)); end(); }
});

test('a broken listener never breaks the game', () => {
  playWatch.on = () => { throw new Error('listener'); };
  assert.doesNotThrow(() => tell('right'));
  playWatch.on = null;
});

test('an older or damaged saved policy falls back to the safe choices', () => {
  assert.equal(revertOf({ revert: 42 }), 'progress');
  assert.equal(revertOf({ revert: 'keep', policies: { d1: { revert: 'autoplay' } } }, 'd1'), 'autoplay');
  assert.equal(revertOf(null), 'progress');
  assert.equal(apAllowed(true, { devices: [7, 'd1'] }, 'd1'), true);
  assert.equal(apAllowed(true, { devices: [7] }, 'd1'), true, 'a list with no device ids is an empty list: every device');
  assert.equal(apAllowed(true, { policies: { d1: { autoplay: false } } }, 'd1'), false);
});
