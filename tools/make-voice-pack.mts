// Makes the offline voice pack with ElevenLabs: every line the game speaks, saved as small MP3 files in
// voices/. The game plays these instead of the device voice, with no internet needed, and keeps the whole
// pack on the device after the first visit (so nothing has to be downloaded again).
//
// The cast (one voice per language and slot):
//   English     – a woman (f) and a man (m)      every English line is made twice
//   Tiếng Việt  – a woman (f) and a man (m)      every Vietnamese line is made twice
//   中文 Chinese – a man (m)                      the Chinese learning words and sayings
//   हिन्दी Hindi  – a man (m)                      the Hindi learning words and sayings
// Men, boys and grandpas in the game use the man's voice, everyone else the woman's.
//
//   node tools/make-voice-pack.mts --count                  how many characters the whole pack needs (no key)
//   node tools/make-voice-pack.mts --key sk_... --dry       the same, plus what your plan has left
//   node tools/make-voice-pack.mts --key sk_...             make (or finish) the pack
//   choose voices: --voice-en-f <id> --voice-en-m <id> --voice-vi-f <id> --voice-vi-m <id> --voice-zh-m <id> --voice-hi-m <id>
//   other options: --model <id> (default eleven_flash_v2_5)  --limit <n> (make only n files now)  --force
//
// Microsoft Azure instead of ElevenLabs (same cast, same voices/ folder, same offline use):
//   node tools/make-voice-pack.mts --engine azure --count                         cost only
//   node tools/make-voice-pack.mts --engine azure --key <KEY 1> --region <e.g. australiaeast>
//   voices default to en-AU Natasha / William, vi-VN Hoài My / Nam Minh, zh-CN Yunxi, hi-IN Madhur;
//   change with --voice-en-f en-AU-FreyaNeural etc. The free (F0) tier allows about 20 requests a minute,
//   so it goes slowly by itself (--per-minute 180 on a paid S0 resource makes it faster).
// It checks the account's remaining credits first and stops if there are not enough (use --force to go
// anyway). Files that already exist are skipped, so you can stop it and run it again later, or next month.
// Keep the key secret: it is only used for this run and is never written into the game.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import manifests from './voice-manifests.cts';
import { collectLines, collectTemplates, partText, NUMBERS, areaOfLine, areaOfFile, readWhere, GROUPS, dynamicSays, corePri, nonCoreArea } from './voice-lines.mts';
// (TypeScript sees nothing of a CommonJS file's module.exports: checked once here, then it has its own type)
const isVoiceManifests = (m: unknown): m is VoiceManifests => typeof m === 'object' && m !== null && 'splitManifest' in m;
if (!isVoiceManifests(manifests)) throw new Error('tools/voice-manifests.cts did not load');
const { splitManifest } = manifests;

Object.assign(globalThis, { document: { documentElement: {} }, localStorage: { getItem: () => null, setItem: () => { } } }); // i18n.js expects a browser
const { swapNames } = await import('../js/i18n.js');
const { LEARN } = await import('../js/words2.js');
const { packHash, lineHash } = await import('../js/packhash.js');
const { viRuns, mixed, mixedSsml } = await import('../js/viwords.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = <D = undefined,>(k: string, d?: D): string | D => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const flag = k => process.argv.includes('--' + k);
const ENGINE = arg('engine', 'eleven');
const KEY = arg('key', ENGINE === 'azure' ? process.env.AZURE_SPEECH_KEY : (process.env.ELEVEN_KEY || process.env.ELEVENLABS_API_KEY));
const REGION = arg('region', process.env.AZURE_SPEECH_REGION || '');
const AZ_VOICES = { en: { f: 'en-AU-NatashaNeural', m: 'en-AU-WilliamNeural' }, vi: { f: 'vi-VN-HoaiMyNeural', m: 'vi-VN-NamMinhNeural' }, zh: { m: 'zh-CN-YunxiNeural' }, hi: { m: 'hi-IN-MadhurNeural' } };
const MODEL = arg('model', 'eleven_flash_v2_5');
const API = arg('api', 'https://api.elevenlabs.io/v1'); // --api is only for testing with a pretend server
// credits per character: Flash and Turbo models cost half a credit, Multilingual v2 and v3 a whole one
const RATE = /flash|turbo/i.test(MODEL) ? .5 : 1;

// which voices each language gets
const CAST = { en: ['f', 'm'], vi: ['f', 'm'], zh: ['m'], hi: ['m'] };
const LANG_NAME = { en: 'English', vi: 'Vietnamese', zh: 'Chinese', hi: 'Hindi' };

// ---------- what to say ----------
// (round R item 12) every line also gets the area it downloads with (tools/voice-lines.mts areaOfLine)
const jobs = [], where = readWhere(), heard = (lang, text) => where[lang + '|' + text];
// a line and its translation download together: the area either was heard in. A line in a file that holds many places
// (js/cities.js, js/heritage.js…) that was not heard while playing goes with the nearest line in the same file that was
// (within a few screens of code: the places' lines are written together), else with 'world'.
const pairs = collectLines().map(l => {
  const from = l.from.split(','), en = swapNames(l.en, 'en'), vi = swapNames(l.vi, 'vi');
  const areas = [areaOfLine(from, heard('en', en)), areaOfLine(from, heard('vi', vi))].sort((a, b) => (a === 'core' ? -1 : b === 'core' ? 1 : 0) || (+GROUPS.includes(a) - +GROUPS.includes(b)));
  return { l, from, en, vi, area: areas[0] };
});
{
  const src = {}, at = p => { if (p.from.length !== 1) return -1; const f = p.from[0], t = src[f] || (src[f] = fs.readFileSync(path.join(ROOT, f), 'utf8')); return t.indexOf(p.l.en.slice(0, 40)); };
  const placed = {}; for (const p of pairs) if (!GROUPS.includes(p.area)) { const i = at(p); if (i >= 0) (placed[p.from[0]] = placed[p.from[0]] || []).push([i, p.area]); }
  for (const p of pairs) {
    if (p.area !== 'world' || !placed[p.from[0]]) continue;
    const i = at(p); if (i < 0) continue;
    const near = placed[p.from[0]].map(([j, a]) => [Math.abs(j - i), a]).sort((x, y) => x[0] - y[0])[0];
    if (near && near[0] < 4000) p.area = near[1];
  }
}
for (const p of pairs) { const pri = corePri(p.from), alt = pri >= 40 ? 'games' : nonCoreArea(p.from); jobs.push({ lang: 'en', text: p.en, area: p.area, pri, alt }); jobs.push({ lang: 'vi', text: p.vi, area: p.area, pri, alt }); } // exactly what the game says (js/voice.js speak)
for (const [lang, L] of Object.entries(LEARN)) for (const w of L.words) jobs.push({ lang, text: w[3], area: 'games' });
// Chinese and Hindi sayings taught at the kiosks (js/cities.js: [words, meaning en, meaning vi, 'zh' | 'hi'])
{
  const src = fs.readFileSync(path.join(ROOT, 'js/cities.js'), 'utf8'), re = /\['([^'\\]+)', '(?:[^'\\]|\\.)*', '(?:[^'\\]|\\.)*', '(zh|hi)'\]/g; let m;
  while ((m = re.exec(src))) jobs.push({ lang: m[2], text: m[1], area: m[2] === 'zh' ? 'china' : 'india' });
}
// (round R item 12) lines with changing words, recorded as parts: the fixed pieces, the words the code names for a gap,
// and the numbers 0–100 (the game puts them together: js/voice.js playParts). The templates go into the manifest.
const TPL = { en: [], vi: [] };
// the test players' names (tests/harness.mjs) are a child's name: never recorded, even if a harvested line had one
const CHILD = /\b(Na|Bin|Kiwi)\b/;
const tplRe = pieces => new RegExp('^\\s*' + pieces.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*')).join('(.+?)') + '\\s*$', 'u');
const tplParts = [];
for (const t of collectTemplates()) {
  const pieces = t.pieces.map(p => swapNames(p, t.lang)), area = areaOfFile(t.from);
  if (!pieces.some(p => /\p{L}/u.test(p))) continue;
  TPL[t.lang].push(pieces); tplParts.push({ lang: t.lang, pieces, re: tplRe(pieces), area });
  const pri = corePri([t.from]), alt = 'world';
  for (const p of pieces) { const x = partText(p); if (x) jobs.push({ lang: t.lang, text: x, area, part: true, pri, alt }); }
  for (const opts of t.fills) for (const w of opts) jobs.push({ lang: t.lang, text: swapNames(w, t.lang), area, part: true, pri, alt });
}
for (const lang of ['en', 'vi']) for (const n of NUMBERS) jobs.push({ lang, text: n, area: +n <= 20 ? 'core' : 'games', part: true, pri: 0 });
// lines built while playing (names, numbers, colours…), collected by tools/voice-harvest.mts or sent from devices via Sparkle Studio
try {
  for (const l of JSON.parse(fs.readFileSync(new URL('./voice-extra.json', import.meta.url), 'utf8'))) {
    if (!l || !CAST[l.lang] || !l.text) continue;
    const text = String(l.text);
    jobs.push({ lang: l.lang, text, area: areaOfLine([], heard(l.lang, text)), pri: 40, alt: 'games' });
    // a harvested line made from a template gives the words that filled its gaps (a colour, a dish, a place): recorded as parts
    for (const t of tplParts) { if (t.lang !== l.lang) continue; const m = t.re.exec(text); if (!m) continue; for (const w of m.slice(1)) { const x = partText(w); if (x && !CHILD.test(x) && x.length < 60) jobs.push({ lang: l.lang, text: x, area: t.area, part: true, pri: 39, alt: 'world' }); } break; }
  }
} catch (e) { }
// (Play reading trial, owner 11 Oct 2026 AEDT) the reading games' words, letter names and sounds, đánh vần lines and sentences
// (js/content/reading.js), in the language being read; English sounds ("/s/") are made from their phonetic spelling below
const READING = await import('../js/content/reading.js');
for (const l of READING.readingLines()) jobs.push({ lang: l.lang, text: l.text, area: 'games', pri: 40, alt: 'games' });
const readingSsml = (j, v) => { const L = /^\/(\w+)\/$/.exec(j.lang === 'en' ? j.text : ''), ipa = L && READING.SOUND_IPA[L[1]]; return ipa ? `<speak version='1.0' xml:lang='en-AU'><voice name='${v}'><phoneme alphabet='ipa' ph='${ipa}'>${L[1]}</phoneme></voice></speak>` : null; };
// one job per recording; a line used in several areas downloads with the first it is needed in (the core first)
const RANK = a => a === 'core' ? 0 : a === 'world' ? 3 : GROUPS.includes(a) ? 2 : 1;
const uniq = new Map(); jobs.forEach(j => { const h = lineHash(j.lang, j.text), o = uniq.get(h); if (!o || RANK(j.area) < RANK(o.area)) uniq.set(h, j); });
// the core stays 5–8 MB per language (round R item 12): its lines in order (the start first), and once a language's
// core is over CORE_MB the rest go to their own area. Recorded files count their real size, new ones an estimate.
const CORE_MB = 7;
{
  const sizeOf = (h, j) => { let n = 0; for (const sl of CAST[j.lang]) { try { n += fs.statSync(path.join(ROOT, 'voices', j.lang, sl, h + '.mp3')).size; } catch (e) { n += 2400 + j.text.length * 900; } } return n; };
  const used = {};
  for (const [h, j] of [...uniq.entries()].filter(([, j]) => j.area === 'core').sort((a, b) => (a[1].pri ?? 40) - (b[1].pri ?? 40))) {
    const n = sizeOf(h, j);
    if ((used[j.lang] || 0) + n > CORE_MB * 1048576) { j.area = j.alt || 'world'; continue; }
    used[j.lang] = (used[j.lang] || 0) + n;
  }
}
const list = [...uniq.entries()];

// Read-only catalogue for another recording provider: includes dynamic lines, reading and reusable parts.
if (flag('inventory')) {
  console.log(JSON.stringify({ version: 1, lines: list.map(([id, j]) => ({ id, lang: j.lang, text: j.text, area: j.area, part: !!j.part })) }));
  process.exit(0);
}

// ---------- the cost ----------
const PACK_DIR = path.join(ROOT, 'voices'), MAN = path.join(PACK_DIR, 'manifest.json');
function saveManifest(man) {
  fs.mkdirSync(PACK_DIR, { recursive: true });
  for (const [lang, shard] of Object.entries(splitManifest(man))) fs.writeFileSync(path.join(PACK_DIR, `manifest-${lang}.json`), JSON.stringify(shard));
  fs.writeFileSync(MAN, JSON.stringify(man));
}
// the manifest's `other`: { vi: 'hash hash …', zh: …, hi: … } for every line not in English (English is the default)
const otherOf = list => { const o: Record<string, string[]> = {}; for (const [h, j] of list) if (j.lang !== 'en') (o[j.lang] = o[j.lang] || []).push(h); return Object.fromEntries(Object.entries(o).map(([L, hs]) => [L, hs.join(' ')])); };
const files = list.flatMap(([h, j]) => CAST[j.lang].map(s => [s, h, j]));
const chars = files.reduce((a, [, , j]) => a + j.text.length, 0);
const missing = files.filter(([s, h, j]) => !fs.existsSync(path.join(PACK_DIR, j.lang, s, h + '.mp3')));
const need = missing.reduce((a, [, , j]) => a + j.text.length, 0);
console.log('The voice pack, by language:');
for (const L of Object.keys(CAST)) {
  const ls = list.filter(([, j]) => j.lang === L), c = ls.reduce((a, [, j]) => a + j.text.length, 0);
  console.log(`  ${LANG_NAME[L].padEnd(10)} ${String(ls.length).padStart(5)} lines × ${CAST[L].length} voice${CAST[L].length > 1 ? 's' : ' '} (${CAST[L].map(s => s === 'f' ? 'woman' : 'man').join(' + ')}) = ${String(c * CAST[L].length).padStart(7)} characters`);
}
if (ENGINE === 'azure') {
  const usd = n => (n / 1e6 * 16).toFixed(2);
  console.log(`  In all: ${files.length} files, ${chars} characters. Azure neural voices: US$16 per million characters, so about US$${usd(chars)}; the free F0 tier gives 500,000 characters a month, so it fits in ${Math.ceil(chars / 500000)} free month(s).`);
  console.log(`  Still to make: ${missing.length} files, ${need} characters (about US$${usd(need)}, or free on F0). On F0 (about 20 requests a minute) that takes about ${Math.ceil(missing.length / 18 / 60)} hour(s); stop and run again any time.`);
} else {
console.log(`  In all: ${files.length} files, ${chars} characters = about ${Math.ceil(chars * RATE)} ElevenLabs credits with ${MODEL}${RATE < 1 ? ` (${chars} with a Multilingual model)` : ''}.`);
console.log(`  Still to make: ${missing.length} files, ${need} characters (about ${Math.ceil(need * RATE)} credits).`);
}
console.log(`  Size: about ${Math.round(chars * 0.075 * 4 / 1024)} MB of MP3 (32 kbps).`);
// ---------- (round R item 12) the areas ----------
// voices/areas.json: which lines download with which area (place ids, plus core, games, stories, festivals, world) and
// how big each area is per language, so the game can download the core first and the rest area by area on Wi-Fi.
// It is read only while the pack is downloading, so the list fetched at start-up (manifest.json) stays small.
function writeAreas(man, dry?: boolean) {
  const groups = {}, size = {};
  for (const [h, j] of list) {
    if (!man.lines[h]) continue;
    (groups[j.area] = groups[j.area] || []).push(h);
    const z = size[j.area] = size[j.area] || {};
    for (const sl of man.lines[h]) { try { z[j.lang] = (z[j.lang] || 0) + fs.statSync(path.join(PACK_DIR, j.lang, sl, h + '.mp3')).size; } catch (e) { } }
  }
  const order = Object.keys(groups).sort((a, b) => (a === 'core' ? -1 : b === 'core' ? 1 : 0) || a.localeCompare(b));
  if (!dry) fs.writeFileSync(path.join(PACK_DIR, 'areas.json'), JSON.stringify({ made: man.made, groups: Object.fromEntries(order.map(a => [a, groups[a].join(' ')])), size: Object.fromEntries(order.map(a => [a, size[a]])) }));
  const mb = n => ((n || 0) / 1048576).toFixed(1);
  console.log('Areas (MB of recordings: English, Vietnamese, Chinese, Hindi):');
  for (const a of order) console.log(`  ${a.padEnd(10)} ${String(groups[a].length).padStart(5)} lines  en ${mb(size[a].en).padStart(5)}  vi ${mb(size[a].vi).padStart(5)}  zh ${mb(size[a].zh)}  hi ${mb(size[a].hi)}`);
}
if (flag('areas-only')) { writeAreas(JSON.parse(fs.readFileSync(MAN, 'utf8'))); process.exit(0); } // (voices/areas.json alone, while a recording run owns the manifest)
if (flag('sizes')) { writeAreas(JSON.parse(fs.readFileSync(MAN, 'utf8')), true); process.exit(0); } // (only print the areas' sizes)
if (flag('areas')) {
  // rewrite the templates and the areas for the recordings already made (no key needed)
  const man = JSON.parse(fs.readFileSync(MAN, 'utf8')); man.tpl = TPL; man.areas = 1;
  saveManifest(man); writeAreas(man); process.exit(0);
}
// (round R item 12) the coverage check (tests: voicecover): every line the game can speak has its recordings, in the
// pack's list and in an area; what can't be listed in advance is counted with its reason
if (flag('cover')) {
  const man = JSON.parse(fs.readFileSync(MAN, 'utf8')), areas = JSON.parse(fs.readFileSync(path.join(PACK_DIR, 'areas.json'), 'utf8'));
  const inArea = new Set(Object.values(areas.groups).flatMap(hs => String(hs).split(' ')));
  const bad = [];
  for (const [h, j] of list) {
    const want = CAST[j.lang].filter(sl => !String(man.lines[h] || '').includes(sl) || !fs.existsSync(path.join(PACK_DIR, j.lang, sl, h + '.mp3')));
    if (want.length) bad.push(`not recorded (${j.lang} ${want.join('')}${j.part ? ', a part' : ''}): ${j.text.slice(0, 80)}`);
    else if (!inArea.has(h)) bad.push(`in no area (${j.lang}): ${j.text.slice(0, 80)}`);
  }
  const tpl = (man.tpl && (man.tpl.en || []).length + (man.tpl.vi || []).length) || 0;
  if (!tpl) bad.push('the manifest lists no templates (run --areas)');
  const dyn = dynamicSays(), parts = list.filter(([, j]) => j.part).length;
  const res = { lines: list.length - parts, parts, templates: tpl, areas: Object.keys(areas.groups).length,
    reasons: { 'built while playing (say with a variable): collected by tools/voice-harvest.mts into tools/voice-extra.json': dyn.length, 'a child\'s, friend\'s or pet\'s name: shown, never recorded or spoken (HANDOFF rule 11)': 'every gap that is a name' }, bad };
  console.log(JSON.stringify(res));
  process.exit(bad.length ? 1 : 0);
}
if (flag('count')) process.exit(0);
if (!KEY) { console.error(ENGINE === 'azure' ? 'Add your Azure Speech key and region: --key <KEY 1> --region <Location/Region>. Use --count to see the cost without a key.' : 'Add your key: --key sk_... (or set ELEVEN_KEY). Use --count to see the cost without a key.'); process.exit(1); }
if (ENGINE === 'azure') { await azure(); process.exit(0); }
const H = { 'xi-api-key': KEY };
const get = async p => { const r = await fetch(API + p, { headers: H }); if (r.status === 401) { console.error('ElevenLabs did not accept the key (401). Check it on elevenlabs.io → API Keys, and that it may use Text to Speech, Voices and User.'); process.exit(3); } if (!r.ok) throw new Error(p + ' ' + r.status + ' ' + (await r.text()).slice(0, 200)); return r.json(); };
const sub = await get('/user/subscription');
const left = sub.character_limit - sub.character_count;
console.log(`Your ElevenLabs plan "${sub.tier}": ${left} of ${sub.character_limit} credits left this month.`);
if (flag('dry')) process.exit(0);
if (need * RATE > left && !flag('force')) { console.error(`Not enough credits left (need about ${Math.ceil(need * RATE)}). Upgrade the plan, wait for the monthly reset, or run with --limit to make part of it now.`); process.exit(2); }

// ---------- which voices ----------
const old = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, 'utf8')) : null;
let library = null;
async function pickVoice(lang, gender) {
  const want = arg(`voice-${lang}-${gender}`) || (old && old.voices && old.voices[lang] && old.voices[lang][gender] && old.voices[lang][gender].id);
  library = library || (await get('/voices')).voices;
  if (want) { const v = library.find(v => v.voice_id === want); return { id: want, name: v ? v.name : want }; }
  const score = v => {
    const L = v.labels || {}; let s = 0;
    if ((L.gender || '').toLowerCase() !== (gender === 'f' ? 'female' : 'male')) return -1;
    const langs = (v.verified_languages || []).map(x => x.language);
    if (langs.includes(lang) || (L.language || '').toLowerCase().startsWith(lang)) s += 20;
    if (lang === 'en' && /austral/i.test(L.accent || '')) s += 4;
    if (/vietnam/i.test(L.accent || '') && lang === 'vi') s += 8; if (/chinese|mandarin/i.test(L.accent || '') && lang === 'zh') s += 8; if (/hindi|indian/i.test(L.accent || '') && lang === 'hi') s += 8;
    if (/young|middle/i.test(L.age || '')) s += 2;
    if (/warm|friendly|child|narrat|soft|pleasant|upbeat|story/i.test((L.description || '') + (L.descriptive || '') + (L.use_case || '') + (v.description || ''))) s += 3;
    return s;
  };
  const best = library.map(v => [score(v), v]).filter(x => x[0] >= 0).sort((a, b) => b[0] - a[0])[0];
  if (!best) throw new Error(`No ${gender === 'f' ? 'female' : 'male'} voice found for ${LANG_NAME[lang]}; pass --voice-${lang}-${gender} <id>`);
  if (best[0] < 20 && lang !== 'en') console.warn(`  (no voice in your library is marked as ${LANG_NAME[lang]}; using ${best[1].name}. For a native speaker, add one from the ElevenLabs Voice Library and pass --voice-${lang}-${gender} <id>.)`);
  return { id: best[1].voice_id, name: best[1].name };
}
const voices: Record<string, Record<string, { id: string, name: string }>> = {};
for (const [L, slots] of Object.entries(CAST)) { voices[L] = {}; for (const s of slots) voices[L][s] = await pickVoice(L, s); }
console.log('Voices:'); for (const [L, v] of Object.entries(voices)) console.log(`  ${LANG_NAME[L]}: ` + Object.entries(v).map(([s, x]) => `${s === 'f' ? 'woman' : 'man'} ${x.name} (${x.id})`).join(', '));

// ---------- make the files ----------
const man = { version: 2, model: MODEL, made: new Date().toISOString().slice(0, 10), cast: CAST, voices, lines: {}, other: {}, tpl: TPL, areas: 1 };
const save = () => saveManifest(man);
man.other = otherOf(list); // (the lines that are not English, per language; English is the default)
// what exists on disk is the truth
for (const [h, j] of list) for (const s of CAST[j.lang]) if (fs.existsSync(path.join(PACK_DIR, j.lang, s, h + '.mp3'))) man.lines[h] = (man.lines[h] || '') + s;
const limit = +arg('limit', 1e9);
let done = 0, used = 0;
async function make([slot, h, j]) {
  const v = voices[j.lang][slot];
  for (let attempt = 0; attempt < 5; attempt++) {
    const r = await fetch(`${API}/text-to-speech/${v.id}?output_format=mp3_22050_32`, {
      method: 'POST', headers: { ...H, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: j.text, model_id: MODEL, language_code: j.lang, voice_settings: { stability: .5, similarity_boost: .8, style: .2, use_speaker_boost: true } })
    });
    if (r.status === 429 || r.status >= 500) { await new Promise(res => setTimeout(res, 1500 * (attempt + 1))); continue; }
    if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)} — "${j.text.slice(0, 40)}"`);
    const dir = path.join(PACK_DIR, j.lang, slot); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, h + '.mp3'), Buffer.from(await r.arrayBuffer()));
    man.lines[h] = (man.lines[h] || '').replace(slot, '') + slot; used += j.text.length; done++;
    if (done % 20 === 0) { save(); console.log(`${done}/${Math.min(missing.length, limit)} files, ${used} characters`); }
    return;
  }
  throw new Error('Too many retries: ' + j.text.slice(0, 40));
}
const queue = missing.slice(0, limit);
await Promise.all(Array.from({ length: 3 }, async () => { while (queue.length) await make(queue.shift()); }));
save(); writeAreas(man);
console.log(`Finished: ${done} new files (${used} characters). The pack is in voices/ — include that folder when you publish the game (./build-netlify.sh does).`);

// ---------- Microsoft Azure ----------
async function azure() {
  if (!REGION) { console.error('Add the region too: --region <the Location/Region of your Speech resource, e.g. australiaeast or southeastasia>.'); process.exit(1); }
  const AZ = arg('api', `https://${REGION}.tts.speech.microsoft.com`), perMin = +arg('per-minute', 18);
  // check the key and region with one short line
  const voices: Record<string, Record<string, { id: string, name: string }>> = {}; for (const [L, slots] of Object.entries(CAST)) { voices[L] = {}; for (const sl of slots) voices[L][sl] = { id: arg(`voice-${L}-${sl}`, AZ_VOICES[L][sl]), name: arg(`voice-${L}-${sl}`, AZ_VOICES[L][sl]) }; }
  console.log('Voices:'); for (const [L, v] of Object.entries(voices)) console.log(`  ${LANG_NAME[L]}: ` + Object.entries(v).map(([sl, x]) => `${sl === 'f' ? 'woman' : 'man'} ${x.id}`).join(', '));
  const xml = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // (owner, 24 Oct AEDT: "the goat goes baa baa but the voice reads bee ay ay") animal sounds a voice would spell out as
  // letters are said as they sound; the caption keeps the written word
  const sounds = (t, lang) => lang === 'en' ? t.replace(/\b(Baa+|BAA+|baa+)\b/g, w => `<sub alias="bah">${w}</sub>`) : t;
  const LOCALE = { en: 'en-AU', vi: 'vi-VN', zh: 'zh-CN', hi: 'hi-IN' };
  const man = { version: 2, engine: 'azure', made: new Date().toISOString().slice(0, 10), cast: CAST, voices, lines: {}, other: otherOf(list), tpl: TPL, areas: 1 };
  const save = () => saveManifest(man);
  for (const [h, j] of list) { for (const sl of CAST[j.lang]) if (fs.existsSync(path.join(PACK_DIR, j.lang, sl, h + '.mp3'))) man.lines[h] = (man.lines[h] || '') + sl; }
  const limit = +arg('limit', 1e9), queue = missing.slice(0, limit), gap = 60000 / perMin;
  let done = 0, used = 0, next = Date.now();
  // (round R item 12) a few requests at once (--parallel, default 3): each waits its turn, so the rate stays --per-minute,
  // but a slow answer no longer holds up the next one
  const one = async ([slot, h, j]) => {
    const wait = next - Date.now(); next = Math.max(next, Date.now()) + gap; if (wait > 0) await new Promise(r => setTimeout(r, wait));
    const v = voices[j.lang][slot].id;
    // (round R) Vietnamese names and dishes inside an English line are said by the Vietnamese voice of the same man or woman
    const ssml = readingSsml(j, v) || (j.lang === 'en' && mixed(j.text) ? mixedSsml(viRuns(j.text), v, voices.vi[slot].id) : `<speak version='1.0' xml:lang='${LOCALE[j.lang]}'><voice name='${v}'>${sounds(xml(j.text), j.lang)}</voice></speak>`); // (Play reading trial: readingSsml)
    for (let attempt = 0; ; attempt++) {
      let r;
      // a dropped connection (socket closed, timeout) is tried again, like a busy server, instead of stopping the run
      try { r = await fetch(`${AZ}/cognitiveservices/v1`, { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': KEY, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3', 'User-Agent': 'sparkle-valley-voice-pack' }, body: ssml }); var buf = r.ok ? Buffer.from(await r.arrayBuffer()) : null; }
      catch (e) { if (attempt < 6) { await new Promise(res => setTimeout(res, 5000 * (attempt + 1))); continue; } save(); throw e; }
      if (r.status === 401 || r.status === 403) { console.error('Azure did not accept the key or region (' + r.status + '). Copy KEY 1 and the Location/Region from the Speech resource\'s "Keys and Endpoint" page.'); save(); process.exit(3); }
      if ((r.status === 429 || r.status >= 500) && attempt < 6) { await new Promise(res => setTimeout(res, 5000 * (attempt + 1))); continue; }
      if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)} — "${j.text.slice(0, 40)}"`);
      const dir = path.join(PACK_DIR, j.lang, slot); fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, h + '.mp3'), buf);
      man.lines[h] = (man.lines[h] || '').replace(slot, '') + slot; used += j.text.length; done++;
      if (done % 20 === 0) { save(); console.log(`${done}/${queue.length} files, ${used} characters`); }
      break;
    }
  };
  const work = queue.slice();
  await Promise.all(Array.from({ length: Math.max(1, +arg('parallel', 3)) }, async () => { while (work.length) await one(work.shift()); }));
  // the old all-English recordings of those lines are not needed once both of their new ones are made
  let gone = 0;
  for (const [h, j] of list) if (j.lang === 'en' && h !== packHash('en', j.text) && CAST.en.every(sl => fs.existsSync(path.join(PACK_DIR, 'en', sl, h + '.mp3'))))
    for (const sl of CAST.en) { const f = path.join(PACK_DIR, 'en', sl, packHash('en', j.text) + '.mp3'); if (fs.existsSync(f)) { fs.unlinkSync(f); gone++; } }
  save(); writeAreas(man);
  console.log(`Finished: ${done} new files (${used} characters)${gone ? `, ${gone} old all-English files of mixed lines removed` : ''}. The pack is in voices/ — include that folder when you publish the game (./build-netlify.sh does).`);
}
