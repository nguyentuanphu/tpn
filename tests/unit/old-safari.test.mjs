// (owner, 29 Oct 2026 AEDT: an iPad stopped at "The game could not finish loading") Safari before 16.4 (an iPad Air 2
// stays on iPadOS 15) cannot read a regular expression with lookbehind, (?<= or (?<!, nor a class `static {` block:
// one of them anywhere the game loads stops the whole game from starting. None may come back.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = new URL('../../', import.meta.url);
// (vendor/anthropic-sdk.mjs loads only when a grown-up turns on the AI chat, never at the start: it is left out)
const shipped = execFileSync('git', ['ls-files', 'js', 'home', 'vendor', 'sw.ts'], { cwd: root, encoding: 'utf8' }).split('\n')
  .filter(f => /\.(ts|js|mjs)$/.test(f) && !/\.d\.ts$/.test(f) && f !== 'vendor/anthropic-sdk.mjs');

test('no lookbehind and no class static blocks in anything the game or the family website loads', () => {
  const bad = [];
  for (const f of shipped) {
    const text = fs.readFileSync(new URL(f, root), 'utf8');
    text.split('\n').forEach((line, i) => { if (/\(\?<[=!]/.test(line) || /\bstatic\s*\{/.test(line)) bad.push(`${f}:${i + 1}`); });
  }
  assert.deepEqual(bad, []);
});

test('the caption still splits a long line after each sentence, as it did with lookbehind', () => {
  const split = text => text.replace(/([.!?。…])\s+/g, '$1\u0001').split('\u0001');
  for (const t of ['One. Two! Three? Four… Five。 Six', 'No stop here', 'Mr. Bear  went home.  Then slept'])
    assert.deepEqual(split(t), t.split(/(?<=[.!?。…])\s+/), t);
});

test('no built-in that Safari 15 lacks, outside a guard (AbortSignal.timeout, toSorted, Object.groupBy, withResolvers)', () => {
  const bad = [];
  for (const f of shipped) {
    const text = fs.readFileSync(new URL(f, root), 'utf8');
    text.split('\n').forEach((line, i) => { if (/AbortSignal\.timeout\(|\.toSorted\(|\.toReversed\(|\.toSpliced\(|Object\.groupBy\(|Map\.groupBy\(|Promise\.withResolvers\(|Array\.fromAsync\(/.test(line)) bad.push(`${f}:${i + 1}`); });
  }
  assert.deepEqual(bad, []);
});
