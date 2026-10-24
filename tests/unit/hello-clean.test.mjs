// The hello a device sends (netlify/lib/hello-clean.mts): kept only as the text or numbers the rules allow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { clean } from '../../netlify/lib/hello-clean.mts';
const NOW = Date.UTC(2026, 9, 14, 7);

test('a value that only looks like text after coercion is kept as text, never as itself', () => {
  const h = clean({ id: 'device000001', b: ['r75'], d: ['phone'], h: 12345678901, sid: 'a'.repeat(16), l: 'en' }, NOW);
  assert.equal(h?.build, 'r75'); assert.equal(h?.kind, 'phone'); assert.equal(h?.hid, '12345678901');
  for (const k of /** @type {const} */ (['id', 'hid', 'build', 'sid', 'kind', 'os', 'br', 'sc', 'lang'])) assert.equal(typeof h?.[k], 'string', k);
});

test('a list where a map of games was expected keeps no made-up games', () => {
  const h = clean({ id: 'device000001', days: [{ d: '2026-10-14', build: 'r75', g: [1, 2, 3], q: ['x'] }] }, NOW);
  assert.deepEqual(h?.days[0].games, {}); assert.deepEqual(h?.days[0].quits, {});
});

test('what is not a hello at all is dropped', () => {
  for (const bad of [null, 'device000001', 42, [], { id: 'short' }, { id: 12 }]) assert.equal(clean(bad, NOW), null, JSON.stringify(bad));
  assert.equal(clean({ id: ['device000001x'] }, NOW)?.id, 'device000001x', 'an id in a list is kept only as its text');
});

test('an ordinary hello keeps its build, session and day', () => {
  const h = clean({ id: 'device000001', b: 'r75', sid: 'b'.repeat(16), started: NOW - 1000, l: 'vi', d: 'tablet', os: 'iPadOS', br: 'Safari', sc: '820x1180', k: 2,
    days: [{ d: '2026-10-14', build: 'r75', m: 12, g: { maze: 2 }, c: { k1: { n: 'Na', a: 'big', m: 12, g: { maze: [1, 1, 0] } } } }] }, NOW);
  assert.equal(h?.build, 'r75'); assert.equal(h?.sid, 'b'.repeat(16)); assert.equal(h?.started, NOW - 1000); assert.equal(h?.lang, 'vi'); assert.equal(h?.kind, 'tablet');
  assert.deepEqual(h?.days.map(x => [x.d, x.build, x.mins, x.games.maze, x.kids.k1.g.maze]), [['2026-10-14', 'r75', 12, 2, [1, 1, 0]]]);
});

test('synthetic bot metadata is recognized and preserved in cleaned hello', () => {
  const h = clean({ id: 'device000001', b: 'r75', sid: 'c'.repeat(16), isRobot: true, traffic: 'synthetic_bot',
    days: [{ d: '2026-10-14', build: 'r75', m: 5 }] }, NOW);
  assert.equal(h?.isRobot, true);
  assert.equal(h?.traffic, 'synthetic_bot');
  const ok = clean({ id: 'device000001', fh: '0123456789abcdef', days: [{ d: '2026-10-14', build: 'v1.01', m: 3 }] }, NOW);
  assert.equal(ok?.fh, '0123456789abcdef');
  const bad = clean({ id: 'device000001', fh: 'K7M4-P9Q2', days: [{ d: '2026-10-14', build: 'v1.01', m: 3 }] }, NOW);
  assert.equal(bad?.fh, '');
});
