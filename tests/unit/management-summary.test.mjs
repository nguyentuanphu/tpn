// (v1.07 studio) Studio's first page: one quick read of the day records only, and each finished day kept once
// (msum/<date>) so a later read takes one record per day. Synthetic in-memory store only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createManagementReadService } from '../../netlify/lib/management/read.mts';
import { hello } from '../../netlify/lib/players.mts';

const NOW = Date.parse('2026-10-26T12:00:00Z'), day = n => new Date(NOW - n * 864e5).toISOString().slice(0, 10);
const A = 'demo12345678', B = 'demo12345679', C = 'demo12345680';
function mem(entries = {}) {
  const m = new Map(Object.entries(entries)), reads = [];
  return { data: m, reads, get: async k => { reads.push(k); return m.get(k) ?? null; }, setJSON: async (k, v) => { m.set(k, JSON.parse(JSON.stringify(v))); },
    set: async (k, v) => { m.set(k, String(v)); }, delete: async k => { m.delete(k); },
    list: async ({ prefix = '' }) => ({ blobs: [...m.keys()].filter(k => k.startsWith(prefix)).sort().map(key => ({ key })) }) };
}
const rec = (extra = {}) => ({ mins: 10, tales: 0, games: { oanquan: 1 }, build: 'v1.06', builds: { 'v1.06': true }, kind: 'tablet', children: {}, ...extra });
const read = (store, extra = {}) => createManagementReadService({ playersStore: store, now: () => NOW, ...extra });

test('summary counts devices, new devices, minutes and versions from the day records only', async () => {
  const store = mem({
    ['d/' + day(0) + '/' + A]: rec({ mins: 20, errs: { boot: 2 } }),
    ['d/' + day(2) + '/' + B]: rec({ mins: 5, isNew: true, build: 'v1.05', builds: { 'v1.05': true } }),
    ['d/' + day(20) + '/' + C]: rec({ mins: 30, isNew: true }),
    ['d/' + day(20) + '/' + A]: rec({ mins: 7 }),
    ['dev/' + A]: day(40), ['dev/' + B]: day(2), ['dev/' + C]: day(20),
    ['info/' + A]: { first: day(40) }, ['label/' + A]: 'Family tablet', ['live/' + A]: { on: true, at: NOW }
  });
  const s = await read(store).summary({});
  assert.deepEqual({ ...s.today, versions: undefined }, { devicesToday: 1, devicesWeek: 2, devicesMonth: 3, newWeek: 1, newMonth: 2, devicesEver: 3,
    minsToday: 20, minsWeek: 25, minsMonth: 62, errorsWeek: 2, versions: undefined });
  assert.deepEqual(s.today.versions, { newest: 'v1.06', onNewest: 2, older: 1, list: [{ build: 'v1.06', devices: 2 }, { build: 'v1.05', devices: 1 }] });
  assert.equal(s.period.today, day(0)); assert.equal(s.period.weekFrom, day(6)); assert.equal(s.period.monthFrom, day(29));
  assert.ok(!store.reads.some(k => /^(info|label|live)\//.test(k)), 'the quick read never opens a device\'s details: ' + store.reads.filter(k => /^(info|label|live)\//.test(k)));
  assert.ok(!JSON.stringify(s).includes('Family tablet'), 'no device names in the summary');
});

test('summary says unknown, not zero, when no day was reported', async () => {
  const s = await read(mem({ ['dev/' + A]: day(90) })).summary({});
  for (const k of ['devicesToday', 'devicesWeek', 'devicesMonth', 'newWeek', 'minsToday', 'minsWeek', 'errorsWeek']) assert.equal(s.today[k], null, k);
  assert.equal(s.today.devicesEver, 1); assert.equal(s.reportingDays, 0);
});

test('a finished day is kept once and read back as one record; recent days and the tests without keepDays are never kept', async () => {
  const store = mem({ ['d/' + day(5) + '/' + A]: rec({ mins: 11 }), ['d/' + day(1) + '/' + B]: rec({ mins: 4 }) });
  const first = await read(store, { keepDays: true }).summary({});
  assert.ok(store.data.has('msum/' + day(5)), 'a day three or more days ago is kept');
  assert.ok(!store.data.has('msum/' + day(1)), 'yesterday is always read fresh');
  store.reads.length = 0; store.data.delete('d/' + day(5) + '/' + A); // proves the next read uses the kept record
  const again = await read(store, { keepDays: true }).summary({});
  assert.equal(again.today.minsWeek, first.today.minsWeek);
  assert.ok(store.reads.includes('msum/' + day(5)) && !store.reads.some(k => k.startsWith('d/' + day(5) + '/')));
  const plain = mem({ ['d/' + day(5) + '/' + A]: rec() }); await read(plain).overview({ from: day(6), to: day(0) });
  assert.ok(![...plain.data.keys()].some(k => k.startsWith('msum/')), 'without keepDays nothing is written');
});

test('overview gives the same numbers from a kept day as from the device records, with new and returning devices per day', async () => {
  const entries = { ['d/' + day(4) + '/' + A]: rec({ mins: 9, isNew: true }), ['d/' + day(4) + '/' + B]: rec({ mins: 3 }), ['info/' + A]: { first: day(4) }, ['info/' + B]: { first: day(30) } };
  const q = { from: day(6), to: day(0) }, fresh = await read(mem(entries)).overview(q), store = mem(entries);
  await read(store, { keepDays: true }).overview(q); const kept = await read(store, { keepDays: true }).overview(q);
  assert.deepEqual(kept.dailySeries, fresh.dailySeries); assert.deepEqual(kept.today, fresh.today);
  const d = fresh.dailySeries.find(x => x.date === day(4)); assert.equal(d.newDevices, 1); assert.equal(d.returningDevices, 1);
  assert.equal(fresh.dailySeries.find(x => x.date === day(5)).newDevices, null, 'a day with no report is unknown');
});

test('a late report for a finished day removes its kept record, so the next read adds it up again', async () => {
  const S = mem(), ID = 'device000001', old = day(4);
  await hello(S, { id: ID, h: 'batch00000000001', b: 'v1.06', sid: 'a'.repeat(16), started: NOW, l: 'en', d: 'phone', days: [{ d: old, build: 'v1.06', m: 5, g: {}, t: 0, o: 0 }] }, NOW);
  const first = await read(S, { keepDays: true }).summary({}); assert.ok(S.data.has('msum/' + old)); assert.equal(first.today.minsWeek, 5);
  await hello(S, { id: ID, h: 'batch00000000002', b: 'v1.06', sid: 'a'.repeat(16), started: NOW, l: 'en', d: 'phone', days: [{ d: old, build: 'v1.06', m: 7, g: {}, t: 0, o: 0 }] }, NOW + 1000);
  assert.ok(!S.data.has('msum/' + old), 'the late report removed the kept day');
  assert.equal((await read(S, { keepDays: true }).summary({})).today.minsWeek, 12);
});
