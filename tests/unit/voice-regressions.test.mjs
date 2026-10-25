import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const voiceSource = fs.readFileSync(new URL('../../js/voice.ts', import.meta.url), 'utf8');

test('device voices collapse Standard and Enhanced Linh into one preferred option', () => {
  const script = `
    const voices = [
      { name: 'Linh (Standard)', lang: 'vi-VN', localService: true },
      { name: 'Linh (Enhanced)', lang: 'vi-VN', localService: false },
      { name: 'Linh (Enhanced)', lang: 'vi-VN', localService: false }
    ];
    globalThis.window = globalThis;
    globalThis.addEventListener = () => {};
    globalThis.document = { hidden: false, documentElement: { lang: 'vi' }, addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; } };
    globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
    globalThis.speechSynthesis = { getVoices: () => voices, addEventListener() {}, resume() {}, cancel() {}, speak() {} };
    globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    const { voicesFor } = await import('./js/voice.js');
    const result = voicesFor('vi').map(voice => voice.name);
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: new URL('../..', import.meta.url),
    encoding: 'utf8',
    timeout: 5000
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), ['Linh (Enhanced)']);
});

test('acknowledging missing voices cancels the pending stale persistence timer', () => {
  const fn = voiceSource.match(/export function forgetVoiceMisses\(lines\) \{[\s\S]*?\n\}/);
  assert.ok(fn, 'forgetVoiceMisses must remain exported');
  assert.match(fn[0], /clearTimeout\(missTimer\)/);
  assert.match(fn[0], /localStorage\.setItem\(MISS_KEY, JSON\.stringify\(remaining\)\)/);
  assert.ok(fn[0].indexOf('clearTimeout(missTimer)') < fn[0].indexOf('localStorage.setItem'), 'cancel stale writes before persisting the acknowledged list');
});
