// Unit tests for the L0 core (architecture step 1): node --test tests/unit
import test from 'node:test';
import assert from 'node:assert/strict';
import { id, slug, isId, parse, kindOf } from '../../js/core/ids.js';
import { createBus, EVENT_NAMES } from '../../js/core/events.js';
import { stream, mulberry, hash32 } from '../../js/core/rng.js';
import { dist2, segDist, polyLength, polyDist, angleDiff, inBox, boxesOverlap, clamp } from '../../js/core/geo.js';

test('ids: Vietnamese names become ASCII slugs', () => {
  assert.equal(slug('Bà Năm'), 'ba-nam');
  assert.equal(slug('Hồ Gươm'), 'ho-guom');
  assert.equal(slug('Đà Nẵng'), 'da-nang');
  assert.equal(id('npc', 'village', 'Bà Năm'), 'npc:village/ba-nam');
  assert.equal(id('game', 'caro'), 'game:caro');
});
test('ids: parse, kind and validity', () => {
  assert.deepEqual(parse('bld:lotus/house-03'), { kind: 'bld', scope: ['lotus'], name: 'house-03' });
  assert.equal(kindOf('sticker:place/hue'), 'sticker');
  assert.equal(isId('Not An Id'), false); assert.equal(isId('a:b'), true); assert.equal(parse('x'), null);
  assert.throws(() => id('npc'), /bad id/); assert.throws(() => id('npc', '!!!'), /bad id/);
});
test('events: emit reaches listeners; off stops them; once fires once', () => {
  const bus = createBus(), got = [];
  const off = bus.on('ActivityStarted', p => got.push(p.activityId));
  bus.once('ActivityStarted', p => got.push('once:' + p.activityId));
  assert.equal(bus.emit('ActivityStarted', { activityId: 'act:caro/1' }), 2);
  off(); bus.emit('ActivityStarted', { activityId: 'act:caro/2' });
  assert.deepEqual(got, ['act:caro/1', 'once:act:caro/1']);
  assert.equal(bus.recent().length, 2);
});
test('events: a failing listener never stops the others; unknown names are refused', () => {
  const bus = createBus({ log: () => { } }), got = [];
  bus.on('LanguageChanged', () => { throw new Error('boom'); }); bus.on('LanguageChanged', p => got.push(p.lang));
  bus.emit('LanguageChanged', { lang: 'vi' }); assert.deepEqual(got, ['vi']);
  assert.throws(() => bus.emit('LangChanged', {}), /unknown event/); assert.throws(() => bus.on('Nope', () => { }), /unknown event/);
  assert.ok(EVENT_NAMES.includes('PlayerEnteredVillage'));
});
test('rng: named streams repeat and do not disturb each other', () => {
  const a = stream('lotus/hens'), b = stream('lotus/hens'); const xs = [a(), a(), a()];
  assert.deepEqual([b(), b(), b()], xs);
  const c = stream('lotus/dog'); assert.notEqual(c(), xs[0]);
  const r = stream('dice'); for (let i = 0; i < 200; i++) { const n = r.int(1, 6); assert.ok(n >= 1 && n <= 6 && Number.isInteger(n)); }
  assert.equal(stream('x').shuffle([1, 2, 3, 4]).sort().join(), '1,2,3,4');
  assert.equal(hash32('abc'), hash32('abc')); assert.equal(mulberry(5)(), mulberry(5)());
});
test('rng: the same numbers as the old util.seeded (the world looks the same)', () => {
  // util.seeded as it was before step 1, copied here
  const old = seed => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  for (const seed of [20250921, 77, 1, 0xffffffff]) { const a = old(seed), b = mulberry(seed); for (let i = 0; i < 100; i++) assert.equal(b(), a()); }
});
test('geo: distances, segments, polylines, boxes, angles', () => {
  assert.equal(dist2(0, 0, 3, 4), 5);
  assert.deepEqual(segDist(5, 3, 0, 0, 10, 0), { d: 3, t: .5 });
  assert.equal(polyLength([[0, 0], [3, 4], [3, 10]]), 11);
  assert.equal(polyDist(1, 1, [[0, 0], [10, 0]]), 1);
  assert.ok(Math.abs(angleDiff(Math.PI * .9, -Math.PI * .9) - Math.PI * .2) < 1e-9);
  assert.ok(inBox({ x0: 0, z0: 0, x1: 2, z1: 2 }, 1, 1)); assert.ok(!boxesOverlap({ x0: 0, z0: 0, x1: 1, z1: 1 }, { x0: 2, z0: 2, x1: 3, z1: 3 }));
  assert.equal(clamp(9, 0, 5), 5);
});
