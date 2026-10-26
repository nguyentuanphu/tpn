import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lineHash} from '../js/packhash.js';
import {identity} from '../tools/fpt-recorder.mts';
import {reviewedMixedFragments, assertHanoiReceipt, missingHanoiUnits, MIXED_FRAGMENT_SOURCE} from '../tools/hanoi-pack-policy.mts';

const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
const CORE = ['tools/mixed-voice-inventory.mts', 'tools/hanoi-pack-policy.mts', 'js/voice-fragments.ts', 'js/viwords.ts', 'js/packhash.ts', 'js/i18n.js'];
const fragment = (text = 'bánh khọt') => ({id: lineHash('vi', text), lang: 'vi' as const, text, area: 'world', part: true as const, mixedFragment: MIXED_FRAGMENT_SOURCE, source: ['js/content/films/food.js']});
function sources() {
  const files = new Map([...CORE, 'js/content/films/food.ts'].map(file => [file, 'reviewed public source: ' + file]));
  const hashes: Record<string, string> = Object.fromEntries([...files].map(([file, text]) => [file, hash(text)]));
  const reads: string[] = [];
  return {files, hashes, reads, read: async (file: string) => {reads.push(file); const text = files.get(file); if (text === undefined) throw Error('Missing fixture source.'); return text;}};
}

test('reviewed optional Vietnamese fragments can extend the default inventory only with current exact source fingerprints', async () => {
  const f = sources(), a = fragment(), b = fragment('nước mía');
  const entries = await reviewedMixedFragments([a, b], f.hashes, new Set(), f.read);
  assert.deepEqual([...entries.keys()], [a.id, b.id]);
  assert.equal(entries.get(a.id)?.text, a.text);
  assert.equal(f.reads.filter(path => path === 'js/content/films/food.ts').length, 1, 'shared generated JS source resolves to its current TS source once');
  assert.equal((await reviewedMixedFragments(undefined, undefined, new Set(), f.read)).size, 0, 'old inventories keep their default-only policy');
});

test('unreviewed markers, hashes, private names, held units and arbitrary source paths never enlarge the optional pack', async () => {
  const a = fragment();
  for (const entries of [
    [{...a, mixedFragment: 'any-extra'}], [{...a, part: false}], [{...a, lang: 'en'}],
    [{...a, id: lineHash('vi', 'different words')}], [fragment('Hello Na')], [fragment('Hello {name}')],
    [{...a, source: []}], [{...a, source: ['../private/questions.ts']}], [{...a, source: ['temp/questions.js']}],
    [a, a], [{...a, text: a.text + '\u0000'}]
  ]) {
    const f = sources();
    await assert.rejects(reviewedMixedFragments(entries, f.hashes, new Set(), f.read));
  }
  const f = sources();
  await assert.rejects(reviewedMixedFragments([a], f.hashes, new Set([a.id]), f.read), /Unreviewed/);
});

test('editing a fragment source or its segmentation policy after review stops packaging', async () => {
  for (const file of ['js/content/films/food.ts', 'js/voice-fragments.ts', 'tools/hanoi-pack-policy.mts']) {
    const f = sources(); f.files.set(file, 'changed since review');
    await assert.rejects(reviewedMixedFragments([fragment()], f.hashes, new Set(), f.read), /source changed after review/);
  }
  const f = sources(); delete f.hashes['js/content/films/food.ts'];
  await assert.rejects(reviewedMixedFragments([fragment()], f.hashes, new Set(), f.read));
});

test('an optional reviewed fragment remains mandatory, while privacy-held names remain excluded from the coverage target', () => {
  const a = fragment(), held = new Set(['private-name']), allowed = new Set(['current-public', 'private-name', a.id]);
  assert.deepEqual(missingHanoiUnits(allowed, new Set(['current-public']), held), [a.id]);
  assert.deepEqual(missingHanoiUnits(allowed, new Set([a.id]), held), ['current-public']);
  assert.deepEqual(missingHanoiUnits(allowed, new Set(['current-public', a.id]), held), []);
});

test('staged recording receipts must match reviewed text identity, full bytes, checksum and finite decoded duration', () => {
  const line = fragment(), bytes = new TextEncoder().encode('synthetic receipt bytes, not an audio decode fixture');
  const receipt = {identity: identity(line), bytes: bytes.length, sha256: hash(bytes), duration: 1.25};
  assert.doesNotThrow(() => assertHanoiReceipt(line, receipt, bytes));
  const corrupt = bytes.slice(); corrupt[0] ^= 1;
  assert.throws(() => assertHanoiReceipt(line, receipt, corrupt), /Unverified/);
  assert.throws(() => assertHanoiReceipt(line, receipt, bytes.slice(1)), /Unverified/);
  assert.throws(() => assertHanoiReceipt({...line, text: 'unreviewed words'}, receipt, bytes), /text identity/);
  for (const replacement of [{...receipt, identity: 'wrong-provider-or-text'}, {...receipt, sha256: '0'.repeat(64)}, {...receipt, bytes: receipt.bytes + 1}, {...receipt, duration: 0}, {...receipt, duration: Infinity}])
    assert.throws(() => assertHanoiReceipt(line, replacement, bytes));
});
