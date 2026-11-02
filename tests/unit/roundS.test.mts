// Round S (owner plan 8 Oct, ROUND-R items 5, 9, 11): Hội làng event times by age (AEST), the surprise limit per
// session, family missions, the weekly note, bedtime and the birthday.
import test from 'node:test';
import assert from 'node:assert/strict';
import { eventNow, eventTimes, lastEvent, nextPrize, earnsPrize, HL_PRIZES, HL_NEXT, EVENT_MIN, aestDay } from '../../js/content/hoilang.js';
import { pickSurprise, surpriseShown, surpriseFound, eligible, SESSION_MAX, FIRST_AFTER, GAP, SURPRISES, SP_KEEPSAKES } from '../../js/content/surprises.js';
import { addMission, tickMission, openMissions, cleanMissions, allMissions, removeMission, weekSummary, weekNote, danceDue, bedtimePhase, isBirthday, aestDate } from '../../js/content/parents.js';

// a moment given in AEST (UTC+10): 'YYYY-MM-DDTHH:MM'
const aest = s => Date.parse(s + ':00+10:00');

test('Hội làng: three events a day, 17:30 instead of 19:00 for under-5s', () => {
  assert.deepEqual(eventTimes(false), ['09:00', '16:00', '19:00']);
  assert.deepEqual(eventTimes(true), ['09:00', '16:00', '17:30']);
  assert.equal(EVENT_MIN, 15);
  for (const t of [...eventTimes(false), ...eventTimes(true)]) assert.ok(HL_NEXT[t], 'a recorded "next" line for ' + t);
});
test('Hội làng: on the AEST clock, late arrivals join for 15 minutes, then told the next one', () => {
  let e = eventNow(aest('2026-10-10T09:00'), false); assert.equal(e.on, true); assert.equal(e.at, '09:00'); assert.equal(e.left, 15 * 60);
  e = eventNow(aest('2026-10-10T09:14'), false); assert.equal(e.on, true); assert.equal(Math.round(e.left), 60);
  e = eventNow(aest('2026-10-10T09:15'), false); assert.equal(e.on, false); assert.deepEqual([e.next.at, Math.round(e.next.inMin)], ['16:00', 405]);
  assert.equal(lastEvent(aest('2026-10-10T09:20'), false), '09:00');
  // the evening one: 19:00 for big kids, 17:30 for under-5s
  assert.equal(eventNow(aest('2026-10-10T17:40'), true).on, true); assert.equal(eventNow(aest('2026-10-10T17:40'), false).on, false);
  assert.equal(eventNow(aest('2026-10-10T19:05'), false).at, '19:00'); assert.equal(eventNow(aest('2026-10-10T19:05'), true).on, false);
  // after the last one: tomorrow at 9
  e = eventNow(aest('2026-10-10T21:00'), false); assert.equal(e.next.at, '09:00'); assert.equal(e.next.tomorrow, true); assert.equal(Math.round(e.next.inMin), 12 * 60);
  // AEST, not the device's zone: 09:05 AEST is 23:05 UTC the day before
  assert.equal(eventNow(Date.parse('2026-10-09T23:05:00Z'), false).at, '09:00');
  // one key per event, so a prize is given once per event
  assert.notEqual(eventNow(aest('2026-10-10T09:01')).key, eventNow(aest('2026-10-11T09:01')).key);
  assert.equal(aestDay(aest('2026-10-10T00:01')), aestDay(aest('2026-10-10T23:59')));
});
test('Hội làng: prizes in order, once per event; under-5s for joining, big kids for a win', () => {
  assert.equal(nextPrize([]).id, HL_PRIZES[0].id);
  assert.equal(nextPrize(HL_PRIZES.slice(0, 2).map(x => x.id)).id, HL_PRIZES[2].id);
  assert.equal(nextPrize(HL_PRIZES.map(x => x.id)), null);
  assert.equal(earnsPrize({ joinedKey: 'k', little: true, won: false }), true);
  assert.equal(earnsPrize({ joinedKey: 'k', little: false, won: false }), false);
  assert.equal(earnsPrize({ joinedKey: 'k', little: false, won: true }), true);
  assert.equal(earnsPrize({ joinedKey: 'k', prizedKeys: ['k'], little: true }), false);
  assert.equal(earnsPrize({ joinedKey: null, little: true }), false);
});

test('surprises: at most 3 a session, spaced out, nothing new while one waits', () => {
  let st = { shown: 0, lastAt: -1e9, pending: null };
  const ctx = (play, more = {}) => ({ play, rnd: .5, ...more });
  assert.equal(pickSurprise(st, ctx(FIRST_AFTER - 1)), null, 'not straight away');
  let play = FIRST_AFTER, ids = [];
  for (let k = 0; k < 10; k++) {
    const id = pickSurprise(st, ctx(play, { done: Object.fromEntries(ids.map(i => [i, true])) }));
    if (id) { ids.push(id); st = surpriseShown(st, id, play); assert.equal(pickSurprise(st, ctx(play + GAP * 3)), null, 'waits while one is pending (never missed)'); st = surpriseFound(st); }
    assert.equal(pickSurprise(st, ctx(play + GAP - 1)), null, 'spaced out');
    play += GAP;
  }
  assert.equal(ids.length, SESSION_MAX); assert.equal(new Set(ids).size, ids.length, 'no repeats in a session');
});
test('surprises: timely ones first, each only when it can be enjoyed', () => {
  const st = { shown: 0, lastAt: -1e9, pending: null };
  assert.equal(pickSurprise(st, { play: 999, afterRain: true, rnd: 0 }), 'rainbow');
  assert.equal(pickSurprise(st, { play: 999, night: true, rnd: 0 }), 'stars');
  assert.equal(pickSurprise(st, { play: 999, mapPieces: 3, rnd: .9 }), 'chest');
  const ids = c => eligible(c).map(s => s.id);
  assert.ok(!ids({}).includes('rainbow') && !ids({}).includes('stars') && !ids({}).includes('lotus') && !ids({}).includes('chest'));
  assert.ok(ids({ nearPond: true }).includes('lotus'));
  assert.ok(!ids({ mapToday: true }).includes('map'), 'one map piece a day');
  assert.ok(!ids({ mapPieces: 3 }).includes('map') && !ids({ mapPieces: 3, chest: true }).includes('chest'));
  for (const s of SURPRISES) assert.ok(s.sticker || s.keepsake || s.id === 'map', s.id + ' gives a sticker or a keepsake');
  for (const s of SURPRISES) if (s.keepsake) assert.ok(SP_KEEPSAKES[s.keepsake], s.keepsake);
  for (const s of SURPRISES) assert.ok(s.say[0] && s.say[1] && s.en && s.vi, s.id + ' in both languages');
});

test('family missions: write, show to the child, tick once behind the gate', () => {
  let L = addMission([], { en: 'Help set the table', vi: 'Giúp dọn bàn ăn' }, 1000);
  L = addMission(L, { en: 'Feed the fish', vi: '', who: 'kid2' }, 2000);
  assert.equal(L.length, 2); assert.equal(L[0].vi, 'Feed the fish', 'one language fills the other');
  assert.deepEqual(openMissions(L, 'kid1').map(m => m.en), ['Help set the table']);
  assert.equal(openMissions(L, 'kid2').length, 2);
  let r = tickMission(L, L[1].id, 'kid1'); assert.equal(r.rewarded, true); L = r.list;
  assert.equal(openMissions(L, 'kid1').length, 0); assert.equal(openMissions(L, 'kid2').length, 2, 'ticked for one child only');
  r = tickMission(L, L[1].id, 'kid1'); assert.equal(r.rewarded, false, 'no second reward');
  r = tickMission(L, L[0].id, 'kid1'); assert.equal(r.rewarded, false, "not this child's mission");
  assert.equal(removeMission(L, L[0].id).length, 1);
  assert.equal(addMission([], { en: '  ' }).length, 0);
  assert.equal(cleanMissions([{ en: '<b>x</b>' }, null, { vi: 'Tưới cây' }]).map(m => m.en).join('|'), 'bx/b|Tưới cây');
  const all = allMissions([], [{ id: 'tbl', en: 'Set the table', vi: 'Dọn bàn' }], { s_tbl: { kid1: 5 } });
  assert.equal(all[0].id, 's_tbl'); assert.equal(all[0].studio, true); assert.equal(openMissions(all, 'kid1').length, 0); assert.equal(openMissions(all, 'kid3').length, 1);
});
test('weekly note from the play report days', () => {
  const days = { '2026-10-10': { min: 50, games: 6 }, '2026-10-08': { min: 20, games: 2 }, '2026-10-02': { min: 10, games: 1 } };
  const s = weekSummary(days, '2026-10-10');
  assert.deepEqual([s.min, s.games, s.days, s.best, s.was, s.trend], [70, 8, 2, '2026-10-10', 10, 'more']);
  const note = weekNote(s, 'Na', ['Ô ăn quan', 'Ô ăn quan']);
  assert.ok(note.every(l => l[0] && l[1])); assert.match(note[0][0], /Na played 70 minutes on 2 of the last 7 days/);
  assert.ok(note.some(l => /45 minutes/.test(l[0])));
  assert.equal(weekSummary({}, '2026-10-10').trend, 'none');
});
test('dance break, bedtime and birthday on the AEST clock', () => {
  assert.equal(danceDue(19.9, 0), false); assert.equal(danceDue(20, 0), true); assert.equal(danceDue(39, 20), false);
  const at = s => bedtimePhase(aest('2026-10-10T' + s), '19:30').phase;
  assert.deepEqual(['12:00', '19:21', '19:30', '19:35', '19:37', '23:00', '05:59', '06:00'].map(at), ['day', 'soon', 'bed', 'bed', 'night', 'night', 'night', 'day']);
  assert.equal(bedtimePhase(Date.now(), '').phase, 'off');
  assert.equal(isBirthday('10-10', aest('2026-10-10T07:00')), true);
  assert.equal(isBirthday('10-10', Date.parse('2026-10-09T15:00:00Z')), true, 'AEST: 1 am on the 10th');
  assert.equal(isBirthday('10-11', aest('2026-10-10T23:59')), false);
  assert.equal(isBirthday('02-29', aest('2027-02-28T09:00')), true);
  assert.equal(isBirthday('', aest('2027-02-28T09:00')), false);
  assert.equal(aestDate(aest('2026-12-31T23:30')), '2026-12-31');
});
