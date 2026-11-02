// (Voice & Audio, 12 Oct) tools/voice-daily.mts: the daily voice workflow keeps only inbox lines the game itself has;
// a line that may carry a friend's or pet's name is held, never added to the voice list (HANDOFF rule 11)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
test('voice-daily: game lines pass, a pet name is held, nothing else changes', () => {
  const extra = path.join(ROOT, 'tools/voice-extra.json'), summary = path.join(ROOT, 'tools/voice-daily.json');
  const before = fs.readFileSync(extra, 'utf8'), hadSummary = fs.existsSync(summary) ? fs.readFileSync(summary, 'utf8') : null;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vd-')), inbox = path.join(dir, 'inbox.json');
  fs.writeFileSync(inbox, JSON.stringify([
    { lang: 'en', text: 'Your friend has a different valley. Ask a grown-up to update the game.', n: 3 },
    { lang: 'en', text: 'Good night, Biscuit!', n: 2 },
    { lang: 'vi', text: 'Ngủ ngon nhé, Mướp!', n: 1 },
    { lang: 'fr', text: 'Bonjour', n: 1 }]));
  try {
    const out = execFileSync(process.execPath, ['tools/voice-daily.mts', '--inbox', inbox], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const s = JSON.parse(fs.readFileSync(summary, 'utf8'));
    assert.equal(s.inbox, 4, out);
    assert.equal(s.held, 2, out); // the two lines with a pet's name
    assert.equal(s.added, 0, out); // the game's own line is recorded from the code already
    assert.equal(fs.readFileSync(extra, 'utf8'), before); // the voice list is untouched
    assert.ok(!fs.readFileSync(summary, 'utf8').includes('Biscuit')); // held lines are never written down
  } finally {
    fs.writeFileSync(extra, before);
    if (hadSummary === null) fs.rmSync(summary, { force: true }); else fs.writeFileSync(summary, hadSummary);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
