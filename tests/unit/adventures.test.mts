// The daily adventure (owner plan 16 Oct 2026 AEDT, chat C): the list and the choosing (js/content/adventures.js)
// without a browser. The browser check `dailyadventure` (tests/run.mts) plays one in the game and checks that every
// step's `at` is really there in the valley.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ADVENTURES, BY_ID, FIRST_TEN, GIVERS, STEP_KINDS, HOME_PLACES, COINS, WEEK, WEEK_PRIZES, ADV_LINES, FIND_LITTLE, FIND_BIG,
  stepText, findCount, alsoOf, titleOf, pickAdventure, fits, record, newDay, advance, stamp, openWeekChest, rememberLine, sydneyDay, weekday, spokenLines } from '../../js/content/adventures.js';
import { BY_ID as STICKER } from '../../js/content/stickers.js';
import { FESTCAL } from '../../js/content/festcal.js';
import { PLACES, ROADS, anchorOf } from '../../js/content/map.js';
import { hasArt } from '../../js/art.js';

const both = a => Array.isArray(a) && a.length === 2 && a.every(x => typeof x === 'string' && x.trim().length > 0);
const words = s => s.trim().split(/\s+/).length;
const sentences = s => (s.match(/[.!?](\s|$)/g) || []).length;
const PLACE_IDS = new Set(PLACES.map(p => p.id));

test('the owner\'s first ten, twenty more and one for every festival in the game', () => {
  assert.deepEqual(FIRST_TEN, ['eggs', 'puppy', 'market', 'kite', 'cloud', 'ferry', 'lotus', 'buffalo', 'banhmi', 'lanterns']);
  assert.ok(ADVENTURES.filter(a => !a.festival).length >= 30, 'at least 10 + 20 everyday adventures');
  for (const F of FESTCAL) assert.ok(ADVENTURES.some(a => a.festival === F.id), 'a festival adventure for ' + F.id);
  assert.equal(BY_ID.lanterns.festival, 'midautumn', 'Lantern night is the Mid-Autumn festival\'s');
  assert.equal(Object.keys(BY_ID).length, ADVENTURES.length, 'ids are unique');
});

test('ADV-2: always 3 steps, each with a picture and a short line in both languages', () => {
  for (const a of ADVENTURES) {
    assert.equal(a.steps.length, 3, a.id);
    for (const s of a.steps) {
      assert.ok(STEP_KINDS.includes(s.kind), `${a.id}: kind ${s.kind}`);
      assert.ok(hasArt(s.icon), `${a.id}: ${s.icon} has a drawing in js/art.js`);
      for (const age of ['little', 'big']) {
        const [en, vi] = stepText(s, age);
        assert.ok(en && vi && !en.includes('{n}') && !vi.includes('{n}'), `${a.id}: ${s.kind} both languages`);
        assert.ok(words(en) <= 6, `${a.id}: "${en}" is at most 6 words`);
        assert.ok(words(vi) <= 9, `${a.id}: "${vi}" is short (Vietnamese counts each syllable)`);
      }
      if (s.kind === 'go') assert.ok(a.places.includes(s.place), `${a.id}: goes to ${s.place}, one of its places`);
      if (['find', 'give', 'talk', 'play'].includes(s.kind)) assert.match(s.at, /^[a-z0-9_]+\*?$/, `${a.id}: ${s.kind} has a target`);
      if (s.kind === 'find') {
        assert.ok(hasArt(s.thing.icon) && s.thing.en && s.thing.vi, `${a.id}: the thing to find`);
        assert.equal(findCount(s, 'little'), FIND_LITTLE, `${a.id}: under-5s find 3`);
        assert.equal(findCount(s, 'big'), FIND_BIG, `${a.id}: 5 and over find 5 (D12)`);
        const also = alsoOf(s, 'big'); if (also) assert.ok(hasArt(also.icon) && also.en && also.vi && also.n > 0, `${a.id}: the second thing`);
        assert.equal(alsoOf(s, 'little'), null, 'under-5s get one ask at a time');
      }
    }
    const kinds = a.steps.map(s => s.kind);
    if (kinds.includes('give')) assert.ok(kinds.indexOf('find') >= 0 && kinds.indexOf('find') < kinds.indexOf('give'), `${a.id}: finds before giving`);
  }
  assert.ok(ADVENTURES.some(a => a.steps.some(s => s.also)), 'D12: at least one two-part ask for big kids');
  assert.ok(ADVENTURES.some(a => a.steps.some(s => s.kind === 'cook')), 'a cooking adventure');
  for (const k of STEP_KINDS) assert.ok(ADVENTURES.some(a => a.steps.some(s => s.kind === k)), 'some adventure uses ' + k);
});

test('every place is a real place that a road reaches; every new child can have one', () => {
  const nearRoad = id => { const a = anchorOf(id); return a && ROADS.some(R => R.pts.some(([x, z]) => Math.hypot(x - a[0], z - a[1]) < 80)); };
  for (const a of ADVENTURES) for (const p of a.places) {
    assert.ok(PLACE_IDS.has(p), `${a.id}: ${p} is a place in js/content/map.js`);
    assert.ok(nearRoad(p), `${a.id}: a road reaches ${p}`);
  }
  for (const p of HOME_PLACES) assert.ok(PLACE_IDS.has(p), p);
  const fresh = ADVENTURES.filter(a => !a.festival && fits(a, { age: 'little', visited: {} }));
  assert.ok(fresh.length >= 3, 'a new child has adventures on the home island');
  for (const F of FESTCAL) assert.ok(ADVENTURES.some(a => a.festival === F.id && fits(a, { visited: {} })), F.id + ' has one on the home island');
});

test('ADV-4: every reward is a real sticker and 10 coins (owner, 16 Oct AEDT)', () => {
  for (const a of ADVENTURES) {
    assert.ok(STICKER[a.reward.sticker], `${a.id}: sticker ${a.reward.sticker} is in chat B's list`);
    assert.equal(a.reward.coins, COINS);
  }
  assert.equal(COINS, 10);
});

test('ADV-3: a giver with a picture says it in at most 2 sentences; no child\'s name is ever spoken', () => {
  for (const a of ADVENTURES) {
    const g = GIVERS[a.giver]; assert.ok(g && hasArt(g.icon) && g.en && g.vi, `${a.id}: giver ${a.giver}`);
    assert.ok(both(a.say) && both(a.miss), `${a.id}: both languages`);
    for (const l of [...a.say, ...a.miss]) assert.ok(sentences(l) <= 2, `${a.id}: "${l}" is at most 2 sentences`);
    assert.ok(hasArt(a.icon), a.id + ' icon');
  }
  for (const l of spokenLines()) { assert.ok(both(l), JSON.stringify(l)); for (const s of l) assert.ok(!/\{|\}|name/i.test(s), `no name: ${s}`); }
  for (const k of Object.keys(ADV_LINES)) assert.ok(both(ADV_LINES[k]), k);
  for (const w of WEEK_PRIZES) assert.ok(hasArt(w.icon) && w.en && w.vi && (w.hat || w.pet), JSON.stringify(w));
  const names = Object.fromEntries(FESTCAL.map(F => [F.id, [F.en, F.vi]]));
  for (const a of ADVENTURES) assert.ok(both(titleOf(a, names)), a.id + ' has a title');
});

test('D2: one a day, the same all day, only unlocked places, no repeat within 7 days, festivals on their day', () => {
  const visited = Object.fromEntries(PLACES.map(p => [p.id, true]));
  const ctx = { day: 20740, child: 'p1', age: 'little', visited };
  assert.equal(pickAdventure(ctx), pickAdventure(ctx), 'the same child gets the same one all day');
  const kids = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map(c => pickAdventure({ ...ctx, child: c }))); assert.ok(kids.size > 1, 'children get different ones');
  // 7 days in a row: never the same one twice
  const r = record({}); const got = [];
  for (let d = 0; d < 14; d++) { newDay(r, { ...ctx, day: 20740 + d }); got.push(r.id); }
  for (let i = 0; i < got.length; i++) for (let j = i + 1; j < Math.min(got.length, i + 7); j++) assert.notEqual(got[i], got[j], `day ${i} and ${j}`);
  assert.ok(got.every(id => !BY_ID[id].festival), 'no festival adventure on an ordinary day');
  // a new child: only the home island
  for (let d = 0; d < 20; d++) { const id = pickAdventure({ ...ctx, day: 20000 + d, visited: {} }); assert.ok(BY_ID[id].places.every(p => HOME_PLACES.includes(p)), id); }
  // with the village visited too
  const v = { village: true }; for (let d = 0; d < 30; d++) { const id = pickAdventure({ ...ctx, day: 20000 + d, visited: v }); assert.ok(BY_ID[id].places.every(p => HOME_PLACES.includes(p) || p === 'village'), id); }
  // a festival day
  assert.equal(pickAdventure({ ...ctx, festival: 'midautumn' }), 'lanterns');
  assert.equal(pickAdventure({ ...ctx, festival: 'tet', visited: {} }), 'fest_tet');
  assert.equal(pickAdventure({ ...ctx, festival: 'midautumn', visited: {} }), 'fest_midautumn', 'Lotus Village not visited yet: the street\'s Mid-Autumn one');
  // every one given lately: the one given longest ago, never nothing
  const all = ADVENTURES.filter(a => !a.festival).map((a, k) => ({ id: a.id, day: 20740 - k % 5 }));
  assert.ok(pickAdventure({ ...ctx, history: all }));
});

test('ADV-5 and D10: stamps only fill up, a missed day takes none away, 7 open the week chest', () => {
  const r = record({});
  for (const d of [100, 101, 103, 106]) { newDay(r, { day: d, child: 'x', visited: {} }); advance(r); advance(r); assert.ok(advance(r)); stamp(r, d); }
  assert.equal(r.stamps.length, 4, 'four days played, two missed: four stamps, none taken away');
  stamp(r, 106); assert.equal(r.stamps.length, 4, 'one stamp a day');
  for (const d of [110, 111]) stamp(r, d);
  assert.equal(stamp(r, 112), true, 'the seventh fills the card');
  const prize = openWeekChest(r, { hats: [], pets: ['puppy'] });
  assert.equal(prize.hat, 'party'); assert.equal(r.stamps.length, 0, 'a fresh card'); assert.equal(r.chests, 1);
  for (let k = 0; k < 7; k++) stamp(r, 200 + k);
  assert.equal(openWeekChest(r, { hats: [], pets: [] }).pet, 'kitty', 'then a pet');
  const r2 = record({ adventure: { prizes: WEEK_PRIZES.map(w => w.hat || w.pet), stamps: [1, 2, 3, 4, 5, 6, 7] } });
  assert.equal(openWeekChest(r2).coins, 50, 'every prize had: coins, never nothing');
  assert.equal(record({ adventure: { stamps: [1, 2, 3, 4, 5, 6, 7, 8, 9] } }).stamps.length, WEEK);
  assert.equal(record({ adventure: 'rubbish' }).stamps.length, 0, 'an odd save is mended');
});

test('D11: Grandpa Owl remembers yesterday\'s adventure (never with a name)', () => {
  const r = record({}); newDay(r, { day: 300, child: 'x', visited: {} }); const id = r.id; stamp(r, 300);
  assert.deepEqual(rememberLine(r, 301), BY_ID[id].miss);
  assert.equal(rememberLine(r, 300), null, 'not the same day');
  assert.equal(rememberLine(r, 303), null, 'only the day after');
  r.told = 301; assert.equal(rememberLine(r, 301), null, 'said once');
});

test('the day is the Sydney date; "first play" keeps one adventure all through a play', () => {
  // 16 Oct 2026 23:30 AEDT = 12:30 UTC; 17 Oct 00:30 AEDT = 13:30 UTC
  const a = sydneyDay(Date.UTC(2026, 9, 16, 12, 30)), b = sydneyDay(Date.UTC(2026, 9, 16, 13, 30));
  assert.equal(b - a, 1, 'midnight in Sydney (AEDT) turns the day');
  assert.equal(sydneyDay(Date.UTC(2026, 9, 16, 18, 0), 6), a, 'with the 6 am start, 5 am is still the day before');
  assert.equal(weekday(sydneyDay(Date.UTC(2026, 9, 16, 2, 0))), 5, '16 Oct 2026 is a Friday');
  assert.equal(weekday(sydneyDay(Date.UTC(2026, 5, 15, 2, 0))), 1, '15 Jun 2026 (AEST) is a Monday');
});
