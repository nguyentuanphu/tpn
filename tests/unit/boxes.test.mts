// Mystery boxes, collectibles and family rankings (round S, owner plan 8 Oct: Round R Part 2 item 10): one free box a
// day by the AEST clock, one more for a finished quest (at most one a day), a second one of anything becomes stars,
// and only big kids at Medium or Hard get them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { aestDay, eligible, boxState, ready, earn, questStep, questCount, take, roll, openBox, COLLECTIBLES, KINDS, RARITY, BOARDS, scores, rank, MAX_WAITING } from '../../js/content/boxes.js';

const at = iso => aestDay(Date.parse(iso));
test('the day is the AEST day (as js/kidplay.js)', () => {
  assert.equal(at('2026-10-09T13:59:00Z'), at('2026-10-09T00:00:00Z'), '23:59 AEST is still the same day');
  assert.equal(at('2026-10-09T14:00:00Z'), at('2026-10-09T00:00:00Z') + 1, 'midnight AEST (14:00 UTC) starts a new day');
  assert.equal(at('2026-10-08T14:00:00Z'), at('2026-10-09T13:00:00Z'), '00:00 to 23:00 AEST on 9 Oct');
});
test('who gets boxes: 5 to 8 at Medium or Hard', () => {
  assert.ok(eligible({ age: 'big', difficulty: 'medium' })); assert.ok(eligible({ age: 'big', difficulty: 'hard' }));
  assert.ok(!eligible({ age: 'big', difficulty: 'easy' })); assert.ok(!eligible({ age: 'little', difficulty: 'hard' })); assert.ok(!eligible(null));
});
test('one free box a day', () => {
  const p = {}, B = boxState(p), d = at('2026-10-09T01:00:00Z');
  assert.equal(ready(B, d), 1); assert.equal(take(B, d), 'free'); assert.equal(ready(B, d), 0); assert.equal(take(B, d), null, 'no second free box today');
  assert.equal(ready(B, d + 1), 1, 'a new one tomorrow');
});
test('one more box for a finished quest, at most one a day; boxes are never sold', () => {
  const p = {}, B = boxState(p), d = 100;
  assert.equal(questStep(B, d, 3), false, 'the first look only remembers');
  assert.equal(questStep(B, d, 3), false, 'nothing finished');
  assert.equal(questStep(B, d, 4), true, 'a quest finished'); assert.equal(B.waiting, 1);
  assert.equal(questStep(B, d, 5), false, 'only one a day'); assert.equal(B.waiting, 1);
  assert.equal(questStep(B, d, 4), false, 'switching which story to follow earns nothing');
  assert.equal(ready(B, d), 2); take(B, d); take(B, d); assert.equal(ready(B, d), 0);
  assert.equal(questStep(B, d + 1, 6), true, 'tomorrow another');
  for (let k = 2; k < 10; k++) earn(B, d + k); assert.ok(B.waiting <= MAX_WAITING, 'waiting boxes are capped');
  assert.equal(questCount({ lanterns: { done: { a: 1, b: 1 } }, yard: { done: { c: 1 } } }, 4), 7);
});
test('duplicates become stars', () => {
  const p = {}, d = 7, first = openBox(p, d, 0);
  assert.equal(first.from, 'free'); assert.equal(first.dup, false); assert.equal(first.stars, 0); assert.equal(p.collect[first.item.id], 1);
  assert.equal(openBox(p, d, 0), null, 'no box left');
  boxState(p).waiting = 1; const again = openBox(p, d, 0);
  assert.equal(again.item.id, first.item.id); assert.equal(again.dup, true); assert.equal(again.stars, RARITY[again.item.rare].stars);
  assert.equal(p.boxes.stars, again.stars); assert.equal(p.collect[first.item.id], 2); assert.equal(p.boxes.opened, 2);
});
test('collectibles: fairies, dragons, stickers and decorations, rarer things less often', () => {
  assert.deepEqual(KINDS.map(k => k.id), ['fairy', 'dragon', 'sticker', 'deco']);
  for (const k of KINDS) assert.ok(COLLECTIBLES.filter(c => c.kind === k.id).length >= 5, k.id);
  assert.equal(new Set(COLLECTIBLES.map(c => c.id)).size, COLLECTIBLES.length);
  for (const c of COLLECTIBLES) assert.ok(c.en && c.vi && RARITY[c.rare], c.id);
  const n = {}; for (let i = 0; i < 2000; i++) { const c = roll(i / 2000); n[c.rare] = (n[c.rare] || 0) + 1; }
  assert.ok(n.common > n.rare && n.rare > n.magic && n.magic > 0, JSON.stringify(n));
  assert.ok(roll(0) && roll(.999999), 'every number picks something');
});
test('rankings: the family on this device, four boards', () => {
  assert.deepEqual(BOARDS.map(b => b.id), ['stars', 'collect', 'kind', 'learn']);
  const a = { wins: { x: 4, y: 1 }, quests: { owl: true, seen_owl: true, played_x: true }, tales: { t: 1 }, stickers: ['a'], words: { w: 1 }, pets: [1] };
  const s = scores(a); assert.equal(s.stars, 3 + 1 + 1 + 1, 'stars from wins, tales, and the owl quest (seen_ and played_ do not count)');
  assert.equal(s.collect, 1); assert.equal(s.kind, 1); assert.equal(s.learn, 2);
  for (const v of Object.values(scores({}))) assert.equal(v, 0, 'an empty profile scores 0');
  const r = rank([{ id: 1 }, a, { id: 3 }], 'stars'); assert.equal(r[0].p, a); assert.deepEqual(r.slice(1).map(x => x.p.id), [1, 3], 'ties keep their order');
});
