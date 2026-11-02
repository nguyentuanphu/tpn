// Festival dates and live releases (round R): lunar dates for Vietnam, Easter and nth-Sunday rules, every festival
// has a date every year, and the website keeps only well-formed release and festival changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { lunarDay, easter, nthWeekday } from '../../js/lunar.js';
import { FESTCAL } from '../../js/content/festcal.js';
import { cleanLive } from '../../netlify/lib/live.mts';
import { makeLive } from '../../netlify/functions/live.mts';

test('Vietnamese lunar dates', () => {
  assert.deepEqual([2025, 2026, 2027, 2028, 2029].map(y => lunarDay(1, 1, y)), ['2025-01-29', '2026-02-17', '2027-02-06', '2028-01-26', '2029-02-13']);
  assert.equal(lunarDay(1, 1, 2030), '2030-02-02');   // Vietnam's calendar (UTC+7); China's is 3 Feb
  assert.equal(lunarDay(15, 8, 2026), '2026-09-25'); assert.equal(lunarDay(15, 8, 2027), '2027-09-15');
});
test('Easter and nth Sundays', () => {
  assert.equal(easter(2026), '2026-04-05'); assert.equal(easter(2027), '2027-03-28');
  assert.equal(nthWeekday(2026, 5, 0, 2), '2026-05-10'); assert.equal(nthWeekday(2026, 9, 0, 1), '2026-09-06');
});
test('every festival has a date from 2026 to 2032', () => {
  const pad = n => String(n).padStart(2, '0');
  for (const F of FESTCAL) for (let y = 2026; y <= 2032; y++) {
    const w = F.when, d = w.lunar ? lunarDay(w.lunar[0], w.lunar[1], y) : w.date ? `${y}-${pad(w.date[0])}-${pad(w.date[1])}` : w.easter != null ? easter(y) : w.nth ? nthWeekday(y, ...w.nth) : w.table[y];
    assert.match(String(d), /^\d{4}-\d\d-\d\d$/, `${F.id} ${y}`);
  }
  assert.equal(new Set(FESTCAL.map(F => F.id)).size, FESTCAL.length);
  for (const F of FESTCAL) assert.ok(F.lines.length && F.lines.every(l => l[0] && l[1]), F.id + ' lines');
});
test('live releases keep only well-formed values', async () => {
  const v = cleanLive({ releases: { traffic: { on: false, start: '2026-10-10', days: '5', newDays: 3 }, 'bad id!': { on: true }, x: { on: 'yes', start: 'soon' } }, festivals: { halloween: { on: true, date: '10-30', buildup: 14 }, tet: { date: 'tomorrow' } } });
  assert.deepEqual(v.releases, { traffic: { on: false, start: '2026-10-10', days: 5, newDays: 3 } });
  assert.deepEqual(v.festivals, { halloween: { on: true, date: '10-30', buildup: 14 } });
  // (owner, 13 Oct) each festival's decorations: as before, 2x, 3x or 7x kept; 5x is the default, anything else dropped
  assert.deepEqual(cleanLive({ festivals: { tet: { deco: 7 }, easter: { deco: '2' }, diwali: { deco: 5 }, holi: { deco: 9 }, anzac: { deco: 'lots' } } }).festivals, { tet: { deco: 7 }, easter: { deco: 2 } });
  const store = { get: async () => ({ releases: { a: { on: true } }, festivals: {} }) };
  const r = await makeLive({ liveStore: async () => store })(new Request('https://x/api/live'));
  assert.equal(r.status, 200); assert.deepEqual((await r.json()).releases, { a: { on: true } });
});
