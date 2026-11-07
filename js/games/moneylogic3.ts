// The sums of the v1.08 money games (owner's plan 3 Nov 2026 AEDT, part D; js/games/money3.ts): counting up the change,
// weeks of saving, the smallest note that pays, the fewest coins, chores that earn an amount exactly, a picnic within a
// budget and needs before wants. Pure functions with no screen and no saved state, so tests/unit/money3.test.mts can
// check every one. Amounts are whole numbers in the smallest unit: cents for AUD, đồng for VND. Game coins only.
import { DENOMS, makeChange } from './moneylogic.js';

/** counting up from the price to the money paid, the shop assistant's way: each coin given and the total said after it
 *  (biggest coin that still fits each time); [] when nothing is owed, null when it cannot be made from these coins */
export function countUp(price: number, paid: number, coins: number[]): { coin: number; at: number }[] | null {
  if (paid < price) return null;
  const vals = coins.slice().sort((a, b) => b - a), out: { coin: number; at: number }[] = [];
  let at = price;
  while (at < paid) { const c = vals.find(v => at + v <= paid); if (!c) return null; at += c; out.push({ coin: c, at }); }
  return out;
}

/** how many weeks of saving until the toy can be bought (what is already saved counts) */
export const weeksToSave = (price: number, perWeek: number, saved = 0): number => perWeek > 0 ? Math.max(0, Math.ceil((price - saved) / perWeek)) : Infinity;
/** what the piggy bank holds after each week: [saved, saved + w, …] until it reaches the price */
export const savingWeeks = (price: number, perWeek: number, saved = 0): number[] => Array.from({ length: weeksToSave(price, perWeek, saved) + 1 }, (_, k) => saved + perWeek * k);

/** the smallest note or coin in the wallet that pays the price on its own; null when none is enough */
export function smallestCover(price: number, wallet: number[]): number | null {
  const ups = wallet.filter(v => v >= price).sort((a, b) => a - b);
  return ups.length ? ups[0] : null;
}

/** the fewest coins and notes that make an amount from the kinds on offer (null when it cannot be made) */
export function fewest(amount: number, code: string, kinds: number[]): number | null {
  const r = makeChange(amount, code, kinds);
  return r ? r.length : null;
}

/** chores that earn exactly the goal: the indexes of the pays to pick (each chore once), or null; the fewest chores first */
export function choresFor(goal: number, pays: number[]): number[] | null {
  let best: number[] | null = null;
  const go = (i: number, left: number, pick: number[]) => {
    if (left === 0) { if (!best || pick.length < best.length) best = pick.slice(); return; }
    if (i >= pays.length || left < 0) return;
    pick.push(i); go(i + 1, left - pays[i], pick); pick.pop();
    go(i + 1, left, pick);
  };
  go(0, goal, []);
  return best;
}

/** a picnic picked group by group: can what is left still pay for the cheapest thing of every group still to choose? */
export const canFinish = (left: number, groupsLeft: number[][]): boolean => groupsLeft.reduce((s, g) => s + Math.min(...g), 0) <= left;
/** the cheapest picnic (one from each group), the least money it needs */
export const cheapestPicnic = (groups: number[][]): number => groups.reduce((s, g) => s + Math.min(...g), 0);

/** needs before wants: does the money pay for every need, and which wants still fit in what is left? */
export function afterNeeds(budget: number, needs: number[], wants: number[]): { left: number; fit: number[] } | null {
  const left = budget - needs.reduce((s, v) => s + v, 0);
  if (left < 0) return null;
  return { left, fit: wants.map((w, i) => w <= left ? i : -1).filter(i => i >= 0) };
}

/** prices from cheapest to dearest: the order the tags go in (indexes) */
export const tagOrder = (prices: number[]): number[] => prices.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[1]);

/** which home a coin or note belongs to (AUD or VND), from its key in DENOMS; null when it is not real money */
export function homeOf(code: string, v: number): string | null {
  return (DENOMS[code] || []).some(d => d.v === v) ? code : null;
}
