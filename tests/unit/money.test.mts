// The money games' sums (round S, owner plan 8 Oct, item 7; js/games/moneylogic.js): the real coins and notes of both
// currencies, adding up, giving change, the cheaper price, the three jars, money that grows while it waits, fair trades.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../../js/games/moneylogic.js';

// a fixed "random" for repeatable prices
const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length]; };

test('the real coins and notes', () => {
  assert.deepEqual(M.DENOMS.AUD.map(d => d.v), [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]);
  assert.deepEqual(M.DENOMS.AUD.filter(d => d.kind === 'coin').map(d => d.label), ['5c', '10c', '20c', '50c', '$1', '$2']);
  assert.deepEqual(M.DENOMS.AUD.filter(d => d.kind === 'note').map(d => d.label), ['$5', '$10', '$20', '$50', '$100']);
  // Vietnamese money in the game: notes only, 1.000 to 500.000
  assert.deepEqual(M.DENOMS.VND.map(d => d.v), [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000]);
  assert.ok(M.DENOMS.VND.every(d => d.kind === 'note'));
  assert.equal(M.artKey('AUD', 50), 'aud50'); assert.equal(M.denom('VND', 20000).art, 'vnd20000');
  assert.ok(M.isMoney('AUD', 200) && !M.isMoney('AUD', 300) && !M.isMoney('VND', 500));
  assert.equal(M.step('AUD'), 5); assert.equal(M.step('VND'), 1000);
});

test('sums in both currencies', () => {
  assert.equal(M.total([200, 100, 50, 20, 5]), 375);                       // $3.75
  assert.equal(M.total([{ v: 1000 }, { v: 500 }, 200]), 1700);             // $17
  assert.equal(M.total([500000, 200000, 20000, 1000]), 721000);            // 721.000đ
  assert.equal(M.total([]), 0);
});

test('change-making: fewest coins and notes, exact', () => {
  assert.deepEqual(M.makeChange(385, 'AUD'), [200, 100, 50, 20, 10, 5]);
  assert.deepEqual(M.makeChange(1500, 'AUD'), [1000, 500]);
  assert.deepEqual(M.makeChange(37000, 'VND'), [20000, 10000, 5000, 2000]);
  assert.deepEqual(M.makeChange(0, 'AUD'), []);
  assert.equal(M.makeChange(3, 'AUD'), null);                              // no 1c or 2c coins
  assert.equal(M.makeChange(1500, 'VND'), null);                           // no 500đ note
  // a till with only some coins: still exact, the fewest that can make it
  assert.deepEqual(M.makeChange(400, 'AUD', [100]), [100, 100, 100, 100]);
  assert.deepEqual(M.makeChange(6000, 'VND', [2000, 5000]), [2000, 2000, 2000]);
  assert.deepEqual(M.makeChange(9000, 'VND', [2000, 5000]), [5000, 2000, 2000]);
  assert.equal(M.makeChange(30, 'AUD', [20, 50]), null);
  // every amount a shop game can ask for can be given back
  for (let c = 5; c <= 5000; c += 5) assert.equal(M.total(M.makeChange(c, 'AUD')), c);
  for (let d = 1000; d <= 500000; d += 1000) assert.equal(M.total(M.makeChange(d, 'VND')), d);
});

test('giving change in the shop', () => {
  assert.equal(M.changeDue(370, 500), 130);
  assert.equal(M.changeDue(500, 500), 0);
  assert.equal(M.changeDue(800, 500), null);                               // not enough handed over
  assert.equal(M.payWith(370, 'AUD'), 500); assert.equal(M.payWith(370, 'AUD', 1), 1000);
  assert.equal(M.payWith(37000, 'VND'), 50000); assert.equal(M.payWith(37000, 'VND', 1), 100000);
  assert.equal(M.payWith(1000000, 'VND'), null);
  assert.equal(M.payWith(10000, 'AUD', 5), 10000);                         // never past the biggest note
});

test('which is cheaper', () => {
  assert.equal(M.cheaper(120, 95), 1); assert.equal(M.cheaper(95, 120), 0); assert.equal(M.cheaper(100, 100), 0);
  assert.equal(M.cheapest([105, 95, 120]), 1);
  assert.equal(M.cheapest([15000, 9000, 9000]), 1);
  assert.ok(M.fits([200, 150], 350) && !M.fits([200, 155], 350));
  const ps = M.distinctPrices(3, 50, 300, 5, seq(.1, .1, .5, .9));
  assert.equal(new Set(ps).size, 3); assert.ok(ps.every(p => p >= 50 && p <= 300 && p % 5 === 0));
  assert.equal(M.priceIn(1000, 20000, 1000, () => .999), 20000);
  assert.equal(M.priceIn(1000, 20000, 1000, () => 0), 1000);
});

test('Ba Hũ: Save, Spend and Share', () => {
  assert.deepEqual(M.splitJars(3, [1, 1, 1]), [1, 1, 1]);
  assert.deepEqual(M.splitJars(1000, [5, 3, 2], 100), [500, 300, 200]);    // $10 as $5, $3, $2
  assert.deepEqual(M.splitJars(120000, [2, 1, 1], 10000), [60000, 30000, 30000]); // half to Save
  assert.deepEqual(M.splitJars(7, [1, 1, 1]), [3, 2, 2]);                  // what doesn't divide goes to Save
  for (const [a, p, u] of [[1000, [5, 3, 2], 100], [10, [6, 3, 1], 1], [600, [1, 1, 1], 100], [120000, [2, 1, 1], 10000]]) assert.equal(M.total(M.splitJars(a, p, u)), a);
  assert.equal(M.splitJars(250, [1, 1, 1], 100), null);                    // not whole coins
});

test('Wait and Grow: simple interest', () => {
  assert.equal(M.perDay(10, 10), 1); assert.equal(M.perDay(20, 20), 4);
  assert.equal(M.grown(5, 20, 3), 8);
  assert.deepEqual(M.growth(2, 50, 2), [2, 3, 4]);
  assert.deepEqual(M.growth(20, 10, 5), [20, 22, 24, 26, 28, 30]);
  // the same amount every day (simple, not compound), and always more after waiting
  const g = M.growth(10, 20, 3); assert.ok(g.every((x, i) => !i || x - g[i - 1] === 2));
  assert.ok(g[3] > g[0]);
});

test('Đổi Hàng: fair trades', () => {
  const W = { '🥚': 1, '🌽': 2, '🐟': 3 };
  assert.equal(M.worth(['🥚', '🌽'], W), 3);
  assert.ok(M.fairTrade(['🥚', '🌽'], ['🐟'], W));
  assert.ok(!M.fairTrade(['🌽', '🌽'], ['🐟'], W));
  assert.equal(M.tradeGap(['🥚'], ['🐟'], W), 2);
  assert.equal(M.tradeGap(['🌽', '🌽'], ['🐟'], W), -1);
});

test('answers near the right one', () => {
  const a = M.nearAnswers(5000, 1000, seq(0));
  assert.equal(a.length, 3); assert.ok(a.includes(5000)); assert.deepEqual(a, a.slice().sort((x, y) => x - y));
  assert.ok(M.nearAnswers(1, 1).every(x => x > 0));
});
