// The voices kept as a few big bundles with one index (js/voicestore.ts; owner, 31 Oct 2026 AEDT: the installed app
// stayed white for about 30 s with thousands of single recordings kept): every recording comes back byte for byte,
// recordings kept the old way move into bundles and their single files go only once the bundle is saved, small bundles
// merge, and a full device loses nothing.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createVoiceStore } from '../../js/voicestore.ts';
const BASE = 'https://game.test/';
function fakeCache({ full = () => false } = {}) {
  const stored = new Map(), abs = u => new URL(typeof u === 'string' ? u : u.url, BASE).href;
  return { stored, cache: { match: async u => stored.get(abs(u))?.clone(), put: async (u, r) => { if (full(abs(u))) throw Error('quota'); stored.set(abs(u), r.clone()); },
    delete: async u => stored.delete(abs(u)), keys: async () => [...stored.keys()].map(url => ({ url })) } };
}
const bytes = (n, fill) => new Uint8Array(n).fill(fill).buffer;
const make = cache => createVoiceStore('sv-voices', { open: async () => cache, base: () => BASE, notify: () => { }, later: 0 });

test('recordings come back byte for byte from their bundle, and the store opens again with them', async () => {
  const { stored, cache } = fakeCache(), s = make(cache);
  for (let i = 0; i < 50; i++) await s.add(`voices/vi/a/h${i}.mp3`, bytes(1000 + i, i));
  await s.flush();
  const files = [...stored.keys()].filter(u => !u.endsWith('index.json'));
  assert.ok(files.every(u => u.includes('/voices/__store/b')), 'only bundles, no single files');
  assert.equal(files.length, 1, 'fifty small recordings make one bundle');
  const again = make(cache); assert.equal(await again.count(), 50);
  for (const i of [0, 17, 49]) { const r = await again.get(`voices/vi/a/h${i}.mp3`); const b = new Uint8Array(await r.arrayBuffer()); assert.equal(b.length, 1000 + i); assert.ok(b.every(x => x === i)); }
  assert.equal(await again.get('voices/vi/a/missing.mp3'), null);
});

test('recordings kept the old way move into bundles, each single file deleted only after its bundle is saved', async () => {
  const { stored, cache } = fakeCache();
  for (let i = 0; i < 90; i++) await cache.put(`voices/en/a/o${i}.mp3`, new Response(bytes(500, 7)));
  const s = make(cache); assert.equal(await s.count(), 90, 'old single files still count as kept');
  assert.equal(await s.migrate(async () => { }), 90);
  assert.equal([...stored.keys()].filter(u => u.endsWith('.mp3')).length, 0, 'no single files left');
  assert.equal(await s.count(), 90);
  assert.equal((await (await s.get('voices/en/a/o42.mp3')).arrayBuffer()).byteLength, 500);
});

test('a full device keeps every recording waiting and never reports one saved that was not', async () => {
  let full = true; const { stored, cache } = fakeCache({ full: u => full && u.includes('/__store/b') }), s = make(cache);
  await s.add('voices/vi/a/x.mp3', bytes(10, 1));
  await assert.rejects(s.flush());
  assert.equal([...stored.keys()].length, 0, 'no index points at a bundle that was never saved');
  full = false; await s.flush();
  assert.equal(await make(cache).count(), 1, 'written once there is room');
});

test('many small bundles (lines played one at a time) merge into one, and the old ones go', async () => {
  const { stored, cache } = fakeCache(), s = make(cache);
  for (let i = 0; i < 12; i++) { await s.add(`voices/vi/a/p${i}.mp3`, bytes(2000, i)); await s.flush(); }
  assert.equal([...stored.keys()].filter(u => u.includes('/__store/b')).length, 12);
  await s.migrate(async () => { });
  assert.equal([...stored.keys()].filter(u => u.includes('/__store/b')).length, 1, 'merged into one bundle');
  for (let i = 0; i < 12; i++) assert.ok(new Uint8Array(await (await s.get(`voices/vi/a/p${i}.mp3`)).arrayBuffer()).every(x => x === i));
});

test('a recording forgotten (a newer one replaces it) is no longer kept, and its empty bundle goes', async () => {
  const { stored, cache } = fakeCache(), s = make(cache);
  await s.add('voices/vi/a/old.mp3', bytes(100, 3)); await s.flush();
  await s.forget('voices/vi/a/old.mp3'); await s.tidy();
  assert.equal(await s.has('voices/vi/a/old.mp3'), false);
  assert.equal([...stored.keys()].filter(u => u.includes('/__store/b')).length, 0);
});
