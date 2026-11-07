// (owner, 3 Nov 2026 AEDT, v1.08 voices-aside) the voice lists without the voices put aside in voices-aside/.
// The male English and Vietnamese recordings (voices/en/m, voices/vi/m) were moved to voices-aside/voices/..., so the
// lists the game reads (voices/manifest*.json) no longer name them, and voices/areas.json counts only the files that
// are still published. Chinese and Hindi keep their one voice. The groups of voices/areas.json are kept as they are.
//
//   node tools/voices-aside.mts          rewrite voices/manifest*.json and the sizes in voices/areas.json
//   node tools/voices-aside.mts --check  only say whether they still name a voice that was put aside (exit 1 if so)
//
// To bring the male voices back, see voices-aside/README.md (move the folders back, then record or rebuild the lists
// with SV_ASIDE_VOICES=1 node tools/make-voice-pack.mts --engine azure).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import manifests from './voice-manifests.cts';
const isVoiceManifests = (m: unknown): m is VoiceManifests => typeof m === 'object' && m !== null && 'splitManifest' in m;
if (!isVoiceManifests(manifests)) throw new Error('tools/voice-manifests.cts did not load');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), DIR = path.join(ROOT, 'voices');
const ASIDE: Record<string, string[]> = { en: ['m'], vi: ['m'] };
const check = process.argv.includes('--check');
const man = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8'));
const other = new Map<string, string>();
for (const [L, hs] of Object.entries(man.other || {})) for (const h of String(hs).split(' ')) if (h) other.set(h, L);
const langOf = (h: string) => man.langOf?.[h] || other.get(h) || 'en';
let named = 0;
for (const [h, slots] of Object.entries(man.lines) as [string, string][]) {
  const gone = ASIDE[langOf(h)] || [];
  const kept = [...String(slots)].filter(s => !gone.includes(s)).join('');
  if (kept !== slots) { named++; if (kept) man.lines[h] = kept; else delete man.lines[h]; }
}
for (const [L, slots] of Object.entries(ASIDE)) {
  if (man.cast?.[L]) { const c = man.cast[L].filter((s: string) => !slots.includes(s)); if (c.length !== man.cast[L].length) named++; man.cast[L] = c; }
  for (const s of slots) if (man.voices?.[L]?.[s]) { named++; delete man.voices[L][s]; }
}
if (check) { console.log(named ? `voices/manifest.json still names ${named} voice entries that were put aside` : 'voices/manifest.json names only the published voices'); process.exit(named ? 1 : 0); }
for (const [lang, shard] of Object.entries(manifests.splitManifest(man))) fs.writeFileSync(path.join(DIR, `manifest-${lang}.json`), JSON.stringify(shard));
fs.writeFileSync(path.join(DIR, 'manifest.json'), JSON.stringify(man));
// the areas' sizes: only the files that are still published
const areas = JSON.parse(fs.readFileSync(path.join(DIR, 'areas.json'), 'utf8'));
const size: Record<string, Record<string, number>> = {};
for (const [a, hs] of Object.entries(areas.groups) as [string, string][]) {
  const z: Record<string, number> = size[a] = {};
  for (const h of hs.split(' ')) { if (!h || !man.lines[h]) continue; const L = langOf(h); for (const s of man.lines[h]) { try { z[L] = (z[L] || 0) + fs.statSync(path.join(DIR, L, s, h + '.mp3')).size; } catch { } } }
}
areas.size = size;
fs.writeFileSync(path.join(DIR, 'areas.json'), JSON.stringify(areas));
console.log(`Removed ${named} entries of voices put aside; voices/manifest*.json and voices/areas.json rewritten.`);
