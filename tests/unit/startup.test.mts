// (Analytics & Infra, 11 Oct, #36) each start's timings travel in the hello and show in the Analytics report:
// strictly checked, at most 6 a day, a device's usual start-up and the median by kind of device
import test from 'node:test';
import assert from 'node:assert/strict';
import { clean, hello, report } from '../../netlify/lib/players.mts';
const mem = () => { const m = new Map(); return { get: async (k, o) => m.has(k) ? (o && o.type === 'json' ? JSON.parse(m.get(k)) : m.get(k)) : null, set: async (k, v) => { m.set(k, String(v)); }, setJSON: async (k, v) => { m.set(k, JSON.stringify(v)); }, delete: async k => { m.delete(k); }, list: async ({ prefix = '' } = {}) => ({ blobs: [...m.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }), _m: m }; };


const NOW = Date.UTC(2026, 9, 11, 2, 0, 0), D = '2026-10-11';
const body = (id, kind, st) => ({ id, h: 'h' + id, b: 'r57', l: 'en', k: 1, d: kind, os: 'iPadOS', br: 'Safari', sc: '820x1180', days: [{ d: D, m: 5, g: {}, t: 0, o: 0, st }] });

test('start timings are checked: numbers capped, odd rows and step names dropped, at most 6 a day', () => {
  const b = clean(body('abcdefghij12', 'tablet', [[1800, 20000, 21000, 1, 'things'], [1, 2, 3, 0, 'Bad Name!'], 'x', [9e9, -5, 'z', 'yes', 'world'], ...Array(8).fill([1, 2, 3, 1, 'roads'])]), NOW);
  const st = b.days[0].starts;
  assert.equal(st.length, 6);
  assert.deepEqual(st[0], [1800, 20000, 21000, 1, 'things']);
  assert.deepEqual(st[1], [1, 2, 3, 0, '']);                 // a step name that is not a plain word is dropped
  assert.deepEqual(st[2], [6e5, 0, 0, 1, 'world']);          // capped at 10 minutes, nothing negative, any truthy = 1
  // an older device that sends no starts is fine
  assert.deepEqual(clean(body('abcdefghij13', 'phone', undefined), NOW).days[0].starts, []);
  // (v1.07 startup) a newer row also says when a child could first play and how long they waited after Go, capped the same way
  assert.deepEqual(clean(body('abcdefghij14', 'phone', [[900, 9000, 9500, 1, 'world', 3200, 9e9]]), NOW).days[0].starts[0], [900, 9000, 9500, 1, 'world', 3200, 6e5]);
});

test('the report shows each device\'s usual start-up and the median by kind of device', async () => {
  const S = mem();
  await hello(S, body('tablet00001a', 'tablet', [[2000, 20000, 21500, 1, 'things'], [2100, 22000, 23000, 1, 'things'], [5000, 30000, 31000, 0, 'world']]), NOW);
  await hello(S, body('tablet00002b', 'tablet', [[1500, 14000, 15000, 1, 'world']]), NOW);
  await hello(S, body('computer0003', 'computer', [[500, 5000, 5600, 1, 'world']]), NOW);
  const r = await report(S, NOW), dev = id => r.devices.find(d => d.id === id);
  const t = dev('tablet00001a').startup;
  assert.equal(t.n, 3); assert.equal(t.ready, 22); assert.equal(t.readyFirst, 30); assert.equal(t.slowest, 'things');
  assert.equal(dev('computer0003').startup.ready, 5);
  assert.deepEqual(r.startup.tablet, { devices: 2, ready: 22 });
  assert.deepEqual(r.startup.computer, { devices: 1, ready: 5 });
});

test('(v1.07 startup) the report shows when a child could first play, per device and by kind of device', async () => {
  const S = mem();
  await hello(S, body('phone000001a', 'phone', [[900, 9000, 9500, 1, 'world', 3000, 0], [900, 9000, 9500, 1, 'world', 5000, 1200], [900, 9000, 9500, 1, 'world', 4000, 0]]), NOW);
  await hello(S, body('phone000002b', 'phone', [[900, 11000, 11500, 1, 'roads']]), NOW);
  const r = await report(S, NOW), dev = id => r.devices.find(d => d.id === id);
  assert.equal(dev('phone000001a').startup.play, 4); assert.equal(dev('phone000002b').startup.play, undefined);
  assert.deepEqual(r.startup.phone, { devices: 2, ready: 11, play: 4 });
});
