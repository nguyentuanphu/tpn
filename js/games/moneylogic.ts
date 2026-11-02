// The money games' sums (round S, owner plan 8 Oct, item 7): which coins and notes there are, adding them up, giving
// change, the cheaper of two prices, splitting into the three jars, money that grows while it waits and fair trades.
// Pure functions with no screen and no saved state, so tests/unit/money.test.mts can check every one of them.
// Amounts are whole numbers in the smallest unit: cents for AUD, đồng for VND. Game coins only, never real money.

// the real coins and notes (owner: AUD 5c to $100; VND notes only, 1.000 to 500.000, since coins are no longer used)
const LIST = {
  AUD: [[5, 'coin', '5c'], [10, 'coin', '10c'], [20, 'coin', '20c'], [50, 'coin', '50c'], [100, 'coin', '$1'], [200, 'coin', '$2'],
    [500, 'note', '$5'], [1000, 'note', '$10'], [2000, 'note', '$20'], [5000, 'note', '$50'], [10000, 'note', '$100']],
  VND: [[1000, 'note', '1.000'], [2000, 'note', '2.000'], [5000, 'note', '5.000'], [10000, 'note', '10.000'], [20000, 'note', '20.000'],
    [50000, 'note', '50.000'], [100000, 'note', '100.000'], [200000, 'note', '200.000'], [500000, 'note', '500.000']]
};
export const CODES = ['AUD', 'VND'];
// the drawing's name in js/art.js for a coin or note ('aud50', 'vnd20000')
export const artKey = (code, v) => code.toLowerCase() + v;
export const DENOMS = Object.fromEntries(CODES.map(c => [c, LIST[c].map(([v, kind, label]) => ({ v, kind, label, art: artKey(c, v) }))]));
export const denom = (code, v) => (DENOMS[code] || []).find(d => d.v === v) || null;
export const isMoney = (code, v) => !!denom(code, v);
// the smallest step a price can take: 5 cents, or 1.000 đồng
export const step = code => code === 'VND' ? 1000 : 5;

// add up a handful of money (numbers, or { v } objects)
export const total = list => list.reduce((s, x) => s + (typeof x === 'number' ? x : x.v), 0);
// what is left to give back; null when the money handed over is not enough
export const changeDue = (price, paid) => paid >= price ? paid - price : null;
// the fewest coins and notes that make an amount, biggest first (both currencies are "canonical", so taking the
// biggest that fits each time is always the fewest); only from the given values when a till holds just some of them;
// null when it can't be made exactly
export function makeChange(amount, code, only = null) {
  if (!(amount >= 0) || amount % 1) return null;
  const vals = (only || DENOMS[code].map(d => d.v)).slice().sort((a, b) => b - a), out = [];
  let left = amount;
  for (const v of vals) while (left >= v) { out.push(v); left -= v; }
  if (!left) return out;
  // a till without the right small coins: try the slow way (a small search, amounts in games are small)
  return exact(amount, vals);
}
function exact(amount, vals) {
  const best = new Map([[0, []]]);
  const lo = Math.min(...vals); if (amount > lo * 400) return null;
  for (let a = lo; a <= amount; a++) { let pick = null; for (const v of vals) { const p = best.get(a - v); if (p && (!pick || p.length + 1 < pick.length)) pick = [v, ...p]; } if (pick) best.set(a, pick); }
  const r = best.get(amount); return r ? r.sort((a, b) => b - a) : null;
}
// the one note or coin a customer hands over: the smallest single one that covers the price (or the next one up)
export function payWith(price, code, bigger = 0) {
  const ups = DENOMS[code].map(d => d.v).filter(v => v >= price);
  return ups.length ? ups[Math.min(ups.length - 1, bigger)] : null;
}

// which is cheaper: the index of the smallest price (the first one when two are the same)
export const cheapest = prices => prices.reduce((k, p, i) => p < prices[k] ? i : k, 0);
export const cheaper = (a, b) => a <= b ? 0 : 1;
// does a basket fit the money we have?
export const fits = (prices, budget) => total(prices) <= budget;

// Ba Hũ: split earnings into the Save, Spend and Share jars by parts (e.g. [5, 3, 2], or [1, 1, 1] for "the same in
// each"), in whole units; anything that doesn't divide evenly goes to Save
export function splitJars(amount, parts = [1, 1, 1], unit = 1) {
  const units = Math.floor(amount / unit), sum = parts.reduce((s, p) => s + p, 0);
  if (!sum || units * unit !== amount) return null;
  const out = parts.map(p => Math.floor(units * p / sum));
  out[0] += units - out.reduce((s, x) => s + x, 0);
  return out.map(x => x * unit);
}

// Wait and Grow (simple interest, shown as a growing plant): the same few extra coins every day while it waits
export const perDay = (saved, ratePct) => Math.round(saved * ratePct / 100);
export const grown = (saved, ratePct, days) => saved + perDay(saved, ratePct) * days;
// what each day looks like, from planting to picking: [saved, saved + k, saved + 2k, …]
export const growth = (saved, ratePct, days) => Array.from({ length: days + 1 }, (_, d) => grown(saved, ratePct, d));

// Đổi Hàng: a trade is fair when what you give is worth what you get
export const worth = (items, values) => items.reduce((s, k) => s + (values[k] || 0), 0);
export const fairTrade = (give, get, values) => worth(give, values) === worth(get, values);
// what more the give-pile needs: > 0 add more, < 0 too much, 0 fair
export const tradeGap = (give, get, values) => worth(get, values) - worth(give, values);

// a random whole price between lo and hi in steps (rnd is Math.random, or a seeded one in tests)
export const priceIn = (lo, hi, by, rnd = Math.random) => lo + by * Math.floor(rnd() * (Math.floor((hi - lo) / by) + 1));
// two or three different prices, so there is always one cheapest
export function distinctPrices(n, lo, hi, by, rnd = Math.random) {
  const out = []; let guard = 0;
  while (out.length < n && guard++ < 200) { const p = priceIn(lo, hi, by, rnd); if (!out.includes(p)) out.push(p); }
  while (out.length < n) out.push(out[out.length - 1] + by);
  return out;
}
// three answers for "how much altogether?": the right one and two near it (never below one step)
export function nearAnswers(right, by, rnd = Math.random) {
  const near = [right - 2 * by, right - by, right + by, right + 2 * by].filter(v => v > 0);
  for (let i = near.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [near[i], near[j]] = [near[j], near[i]]; }
  return [right, ...near.slice(0, 2)].sort((a, b) => a - b);
}
