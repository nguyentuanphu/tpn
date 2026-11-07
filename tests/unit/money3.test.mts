// The sums of the v1.08 money games (owner's plan 3 Nov 2026 AEDT, part D; js/games/moneylogic3.ts): counting up the
// change, weeks of saving, the smallest note that pays, the fewest coins, chores that make a goal, a picnic within a
// budget, needs before wants, price tags in order and which home a coin or note is from.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../../js/games/moneylogic3.js';

test('counting up the change from the price to the money paid', () => {
  // $3.40 paid with a $5 note: 20c, 20c, $1 … up to $5
  const steps = L.countUp(340, 500, [10, 20, 50, 100, 200]);
  assert.deepEqual(steps.map(s => s.at).at(-1), 500);
  assert.equal(steps.reduce((s, x) => s + x.coin, 0), 160);
  assert.deepEqual(L.countUp(500, 500, [10]), []);
  assert.equal(L.countUp(600, 500, [10]), null);
  assert.equal(L.countUp(335, 500, [10, 20]), null);   // 5c cannot be made from 10c and 20c
  // đồng: 23.000 paid with 50.000
  assert.equal(L.countUp(23000, 50000, [1000, 2000, 5000, 10000, 20000]).reduce((s, x) => s + x.coin, 0), 27000);
});

test('weeks of saving for a toy', () => {
  assert.equal(L.weeksToSave(500, 100), 5);
  assert.equal(L.weeksToSave(450, 100), 5);   // the last week tops it up
  assert.equal(L.weeksToSave(500, 100, 200), 3);   // already saved counts
  assert.equal(L.weeksToSave(100, 100, 300), 0);
  assert.equal(L.weeksToSave(100, 0), Infinity);
  assert.deepEqual(L.savingWeeks(300, 100), [0, 100, 200, 300]);
  assert.deepEqual(L.savingWeeks(60000, 15000, 15000), [15000, 30000, 45000, 60000]);
});

test('the smallest note that pays', () => {
  assert.equal(L.smallestCover(740, [200, 500, 1000, 2000]), 1000);
  assert.equal(L.smallestCover(500, [200, 500, 1000]), 500);
  assert.equal(L.smallestCover(5000, [1000, 2000]), null);
  assert.equal(L.smallestCover(35000, [100000, 50000, 20000]), 50000);
});

test('the fewest coins and notes', () => {
  assert.equal(L.fewest(380, 'AUD', [10, 20, 50, 100, 200]), 5);   // $2 + $1 + 50c + 20c + 10c
  assert.equal(L.fewest(60, 'AUD', [10, 20, 50]), 2);
  assert.equal(L.fewest(35000, 'VND', [5000, 10000, 20000]), 3);
  assert.equal(L.fewest(15, 'AUD', [10, 20]), null);
});

test('chores that earn the goal exactly', () => {
  const pays = [50, 100, 150, 200];
  const pick = L.choresFor(250, pays);
  assert.equal(pick.reduce((s, i) => s + pays[i], 0), 250);
  assert.equal(pick.length, 2);
  assert.deepEqual(L.choresFor(200, pays), [3]);   // the fewest chores
  assert.equal(L.choresFor(600, pays), null);
  assert.equal(L.choresFor(25, pays), null);
});

test('a picnic within the budget, group by group', () => {
  const groups = [[200, 300], [100, 150], [50, 250]];
  assert.equal(L.cheapestPicnic(groups), 350);
  assert.equal(L.canFinish(150, groups.slice(1)), true);
  assert.equal(L.canFinish(149, groups.slice(1)), false);
  assert.equal(L.canFinish(0, []), true);
});

test('needs before wants', () => {
  assert.deepEqual(L.afterNeeds(1000, [200, 300], [400, 600, 500]), { left: 500, fit: [0, 2] });
  assert.deepEqual(L.afterNeeds(500, [200, 300], [100]), { left: 0, fit: [] });
  assert.equal(L.afterNeeds(400, [200, 300], [100]), null);
});

test('price tags in order, and the two homes of money', () => {
  assert.deepEqual(L.tagOrder([300, 100, 200]), [1, 2, 0]);
  assert.deepEqual(L.tagOrder([150, 150, 50]), [2, 0, 1]);
  assert.equal(L.homeOf('AUD', 200), 'AUD');
  assert.equal(L.homeOf('VND', 20000), 'VND');
  assert.equal(L.homeOf('AUD', 20000), null);   // there is no $200 note
  assert.equal(L.homeOf('VND', 500), null);
});
