import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import manifests from '../../tools/voice-manifests.cts';
import { createVoiceIndex, voiceLanguages, voicePackSignature } from '../../js/voice-index.js';
const all = JSON.parse(fs.readFileSync(new URL('../../voices/manifest.json', import.meta.url)));
const shards = manifests.splitManifest(all);
const response = j => ({ ok: true, json: async () => j });
test('language shards preserve every line, gender and template without duplicating lines', () => {
  assert.deepEqual(Object.assign({}, ...Object.values(shards).map(j => j.lines)), all.lines);
  assert.equal(Object.values(shards).reduce((n, j) => n + Object.keys(j.lines).length, 0), Object.keys(all.lines).length);
  for (const [lang, j] of Object.entries(shards)) {
    assert.deepEqual(j.tpl[lang], all.tpl[lang] || []);
    assert.deepEqual(JSON.parse(fs.readFileSync(new URL(`../../voices/manifest-${lang}.json`, import.meta.url))), JSON.parse(JSON.stringify(j)));
  }
});
test('every advertised recording exists in its language and slot', () => {
  const missing = [];
  for (const [lang, shard] of Object.entries(shards)) {
    for (const [hash, slots] of Object.entries(shard.lines)) {
      for (const slot of slots) {
        const file = new URL(`../../voices/${lang}/${slot}/${hash}.mp3`, import.meta.url);
        if (!fs.existsSync(file)) missing.push(`${lang}/${slot}/${hash}.mp3`);
      }
    }
  }
  assert.deepEqual(missing, [], 'Manifests must advertise real files, not pending recordings');
});
test('only selected languages are requested; bilingual and explicit learning languages join safely', async () => {
  const calls = [], index = createVoiceIndex(async url => { calls.push(url); return response(shards[url.match(/manifest-(\w+)/)[1]]); }, () => {});
  await Promise.all(voiceLanguages({ lang: 'en' }).map(index.load));
  assert.deepEqual(calls, ['voices/manifest-en.json']);
  await Promise.all(voiceLanguages({ lang: 'vi', bilingual: true }).map(index.load));
  await index.load('hi');
  assert.deepEqual(calls, ['voices/manifest-en.json', 'voices/manifest-vi.json', 'voices/manifest-hi.json']);
});
test('concurrent requests deduplicate, failures retry and background refresh wins stale fetch', async () => {
  let release, calls = 0, pack;
  const index = createVoiceIndex(() => { calls++; return new Promise(r => { release = r; }); }, j => { pack = j; });
  const a = index.load('en'), b = index.load('en'); assert.equal(calls, 1);
  const fresh = { ...shards.en, signature: 'new', lines: { newer: 'fm' } };
  assert.equal(index.refresh(shards.vi), false);
  index.refresh(fresh); release(response(shards.en)); await Promise.all([a, b]);
  assert.deepEqual(pack.lines, fresh.lines);
  assert.equal(pack.signatures.en, 'new');
  let fail = true;
  const retry = createVoiceIndex(async () => { if (fail) throw Error('offline'); return response(shards.vi); }, () => {});
  await assert.rejects(retry.load('vi')); fail = false; await retry.load('vi'); assert.equal(retry.has('vi'), true);
});
test('a different language or recording date does not invalidate an existing saved language', () => {
  const updated = manifests.splitManifest({ ...all, made: '2099-01-01', lines: { ...all.lines, newEnglish: 'fm' } });
  assert.equal(updated.vi.signature, shards.vi.signature);
  assert.notEqual(updated.en.signature, shards.en.signature);
});
test('an old offline aggregate can seed only the selected language without fetching all languages', async () => {
  let result, reads = 0;
  const index = createVoiceIndex(async () => { throw Error('offline'); }, j => { result = j; }, async () => { reads++; return all; });
  await index.load('vi');
  assert.equal(reads, 1);
  assert.deepEqual(result.lines, shards.vi.lines);
  assert.deepEqual(Object.keys(result.signatures), ['vi']);
});

test('offline completion ignores unselected EN/VI but includes explicitly loaded learning-language recordings', () => {
  const pack = { signatures: { en: 'english', vi: 'vietnamese' } };
  assert.equal(voicePackSignature(pack, ['en']), 'en:english');
  assert.equal(voicePackSignature({ signatures: { en: 'english' } }, ['en']), voicePackSignature(pack, ['en']));
  pack.signatures.hi = 'hindi';
  assert.equal(voicePackSignature(pack, ['en']), 'en:english|hi:hindi');
  assert.equal(voicePackSignature({ lines: { test: 'fm' }, version: 2, made: 'test' }, ['en']), '1:2:test');
});
