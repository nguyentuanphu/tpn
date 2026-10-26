// (#350, r85) Ô Ăn Quan: a player whose five squares are empty puts one seed back in each from their own pile, and
// borrows what is short from the other player, giving it back at the end (js/games/vietnam.js refill, repay). The
// capture rules have their own test (tests/unit/oanquan.test.mjs, PR #358). Runs the game's own code without a browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import {refill,repay} from '../../js/games/oanquan-core.js';
const plain=x=>JSON.parse(JSON.stringify(x));
const state = (s0, s1) => ({ seeds: Array(12).fill(0), big: [false, false, false, false, false, false, true, false, false, false, false, false], score: [s0, s1] });
const total = s => s.seeds.reduce((a, b) => a + b, 0) + s.big.filter(Boolean).length * 10 + s.score[0] + s.score[1];

test('enough in the pile: five seeds from your own pile, nothing borrowed', () => {
  const s = state(8, 3), t = total(s), r = refill(s, 0);
  assert.deepEqual(r, { n: 5, borrow: 0 }); assert.deepEqual(s.seeds.slice(1, 6), [1, 1, 1, 1, 1]); assert.deepEqual(s.score, [3, 3]); assert.equal(total(s), t);
});

test('a short pile borrows the rest from the other player, and it goes back at the end', () => {
  const s = state(2, 9), t = total(s), r = refill(s, 0);
  assert.deepEqual(r, { n: 5, borrow: 3 }); assert.deepEqual(s.score, [0, 6]); assert.deepEqual(plain(s.owe), [3, 0]); assert.equal(total(s), t, 'no seed made from nothing');
  s.score[0] = 7; repay(s); assert.deepEqual(s.score, [4, 9]); assert.deepEqual(plain(s.owe), [0, 0]);
});

test('the top player borrows too; with nothing left anywhere no seeds go out', () => {
  const s = state(1, 0), r = refill(s, 1);
  assert.deepEqual(r, { n: 1, borrow: 1 }); assert.deepEqual(s.seeds.slice(7, 12), [1, 0, 0, 0, 0]); assert.deepEqual(s.score, [0, 0]);
  const e = state(0, 0); assert.deepEqual(refill(e, 0), { n: 0, borrow: 0 }); assert.deepEqual(e.seeds.slice(1, 6), [0, 0, 0, 0, 0]);
});

test('a debt bigger than what is left gives back only what there is', () => {
  const s = state(0, 0); s.owe = [4, 0]; s.score = [2, 10]; repay(s); assert.deepEqual(s.score, [0, 12]);
});
