// Lists every line the game speaks (English + Tiếng Việt), with the character who says it, so a voice
// pack can be made. Usage: node tools/voice-lines.mts > tools/voice-lines.json
// Lines that contain a child's name or other changing words (`${…}`) can't be recorded in advance, so the game
// speaks a fixed version instead (round F: dialog lines [shown en, shown vi, spoken en, spoken vi]).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// (v1.07 split-code) js/ui/ holds the parts of js/ui.js
const files = [...fs.readdirSync(path.join(ROOT, 'js')).map(f => 'js/' + f), ...fs.readdirSync(path.join(ROOT, 'js/games')).map(f => 'js/games/' + f), ...fs.readdirSync(path.join(ROOT, 'js/content')).map(f => 'js/content/' + f), ...fs.readdirSync(path.join(ROOT, 'js/content/films')).map(f => 'js/content/films/' + f),
  ...fs.readdirSync(path.join(ROOT, 'js/ui')).map(f => 'js/ui/' + f),
  // (v1.07 split) js/main/ holds the parts of js/main.js
  ...fs.readdirSync(path.join(ROOT, 'js/main')).map(f => 'js/main/' + f)].filter(f => f.endsWith('.js'));
// (v1.07 split) the parts of js/main.js (js/main/*.js) count as js/main.js, so their lines keep their place in the core
const mainPart = (f: string) => /^js\/main\/[\w-]+\.js$/.test(f) ? 'js/main.js' : f;
const VI = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
// a quoted string without ${…}
const Q = String.raw`(?:'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|\x60(?:[^\x60\\$]|\\.|\$(?!\{))*\x60)`;
const unq = s => s.slice(1, -1).replace(/\\(['"\x60\\])/g, '$1').replace(/\\n/g, ' ');
// spoken contexts: say/sayAsync/api.say(en, vi), dialog lines [[en, vi]], story pages [pic, en, vi],
// how-to cards S(pic, en, vi), facts and lines arrays
const PATTERNS = [
  new RegExp(String.raw`\b(?:say|sayAsync|api\.say|\.say)\(\s*(${Q})\s*,\s*(${Q})`, 'g'),
  new RegExp(String.raw`\[\s*(${Q})\s*,\s*(${Q})\s*\]`, 'g'),
  new RegExp(String.raw`\[\s*${Q}\s*,\s*(${Q})\s*,\s*(${Q})\s*\]`, 'g'),
  new RegExp(String.raw`\bS\(\s*${Q}\s*,\s*(${Q})\s*,\s*(${Q})\s*\)`, 'g'),
  // a speech-box line that shows a name but speaks recordable words: [`…${name}…`, `…`, 'say en', 'say vi']
  new RegExp(String.raw`\[\s*\x60[^\x60]*\x60\s*,\s*\x60[^\x60]*\x60\s*,\s*(${Q})\s*,\s*(${Q})\s*\]`, 'g'),
  new RegExp(String.raw`\b(?:fact|story|hint|about)\s*:\s*\[\s*(${Q})\s*,\s*(${Q})`, 'g'),
  // the child's turn in a film (js/content/films.js): S.help(time, en, vi, …)
  new RegExp(String.raw`\bS\.help\(\s*[^,]+,\s*(${Q})\s*,\s*(${Q})`, 'g'),
  // (films batch, 13 Oct) a narration line inside a film: S.say(time, en, vi)
  new RegExp(String.raw`\bS\.say\(\s*[^,]+,\s*(${Q})\s*,\s*(${Q})`, 'g'),
  // what someone says as a story step starts (js/content/chapters.js): tale: [pictures, who, en, vi]
  new RegExp(String.raw`\btale\s*:\s*\[\s*${Q}\s*,\s*${Q}\s*,\s*(${Q})\s*,\s*(${Q})\s*\]`, 'g')
];
// the story's speech boxes show the child's name but say the line without it (js/lanterns.js unnamed)
const unnamed = s => s.replace(/,?\s*\{name\}/g, '');
export function collectLines() {
const seen = new Map();
for (const f of files) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const re of PATTERNS) {
    re.lastIndex = 0; let m;
    while ((m = re.exec(src))) {
      const en = unq(m[1]).trim(), vi = unq(m[2]).trim();
      if (!en || !vi || en.length < 2) continue;
      if (/^[a-z]{2}:/.test(en) || /^[a-z]{2}:/.test(vi)) continue; // wiki page keys, not speech
      if (!VI.test(vi) && en === vi) continue;             // not a translation pair
      if (/^[\p{Emoji}\s✓✕+−=]+$/u.test(en)) continue;     // pictures only
      if (en.split(/\s+/).length < 2 && !/[!?.]$/.test(en)) continue; // single-word labels are not speech
      for (const [e, v] of f === 'js/content/chapters.js' && /\{name\}/.test(en + vi) ? [[unnamed(en), unnamed(vi)]] : [[en, vi]]) {
        const key = e + '\u0000' + v;
        if (!seen.has(key)) seen.set(key, { en: e, vi: v, files: new Set() });
        seen.get(key).files.add(f);
      }
    }
  }
}
// names spoken on their own (round I, the Simple screen says what a child taps): games, tales and the places a child
// can fly to; one word is enough here, and a name that is the same in both languages (Uluru) is still said in each
const NAME = new RegExp(String.raw`\b(?:name|title)\s*:\s*\(\)\s*=>\s*T\(\s*(${Q})\s*,\s*(${Q})\s*\)`, 'g');
for (const f of files.filter(f => f.startsWith('js/games/') || f === 'js/learn.js' || f === 'js/main.js' || f === 'js/content/activities.js')) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8'); NAME.lastIndex = 0; let m;
  while ((m = NAME.exec(src))) {
    const en = unq(m[1]).trim(), vi = unq(m[2]).trim(); if (!en || !vi || !/\p{L}/u.test(en)) continue;
    const key = en + '\u0000' + vi;
    if (!seen.has(key)) seen.set(key, { en, vi, files: new Set() });
    seen.get(key).files.add(f);
  }
}
return [...seen.values()].map(l => ({ en: l.en, vi: l.vi, from: [...l.files].join(',') }));
}

// ---------- (round R item 12) lines with changing words, recorded as parts ----------
// say(`You found ${P.name}! Say hello!`, `…`): the fixed pieces ("You found", "Say hello!") are recorded on their own,
// and so are the words that can fill a gap when the code names them (`${w ? 'blue' : 'red'}`) and the numbers 0–100.
// The game finds the template a line was made from (manifest `tpl`) and plays the pieces in order; a gap filled with a
// child's, friend's or pet's name is never recorded, so it is left out of what is spoken (HANDOFF rule 11).
// read a JS string or template literal starting at src[i]: { end, pieces, exprs } (pieces.length = exprs.length + 1)
// a string in the code: where it ends, its fixed pieces and the ${…} between them
type Lit = { end: number, pieces: string[], exprs: string[] };
function readLit(src: string, i: number): Lit | null {
  const q = src[i]; if (q !== "'" && q !== '"' && q !== '`') return null;
  let j = i + 1, cur = ''; const pieces = [], exprs = [];
  while (j < src.length) {
    const c = src[j];
    if (c === '\\') { const n = src[j + 1]; cur += n === 'n' ? ' ' : n; j += 2; continue; }
    if (c === q) { pieces.push(cur); return { end: j + 1, pieces, exprs }; }
    if (q !== '`' && c === '\n') return null;
    if (q === '`' && c === '$' && src[j + 1] === '{') {
      let k = j + 2, depth = 1; const start = k;
      while (k < src.length && depth) {
        const d = src[k];
        if (d === "'" || d === '"' || d === '`') { const r = readLit(src, k); if (!r) return null; k = r.end; continue; }
        if (d === '{') depth++; else if (d === '}') depth--;
        k++;
      }
      exprs.push(src.slice(start, k - 1)); pieces.push(cur); cur = ''; j = k; continue;
    }
    cur += c; j++;
  }
  return null;
}
// the words of a piece that are worth saying on their own (js/packhash.js, shared with the game)
export { partText } from '../js/packhash.js';
// words a gap can be filled with that the code names: the two sides of a ternary (`${w ? 'blue' : 'red'}`)
const fillWords = expr => { const out = [], re = /[?:]\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g; let m; while ((m = re.exec(expr))) { const t = m[1].slice(1, -1).trim(); if (/\p{L}/u.test(t) && !/^[a-z_]+$/.test(t) || /\s/.test(t)) out.push(t); } return out; };
const SAY = /\b(?:say|sayAsync|api\.say|\.say)\(\s*/g;
// every say(en, vi) whose English or Vietnamese is a template literal with ${…}: { lang, pieces, fills, from }
export function collectTemplates() {
  const out = [], seen = new Set();
  for (const f of files) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8'); SAY.lastIndex = 0; let m;
    while ((m = SAY.exec(src))) {
      const a = readLit(src, SAY.lastIndex); if (!a) continue;
      let k = a.end; while (/\s/.test(src[k])) k++; if (src[k] !== ',') continue; k++; while (/\s/.test(src[k])) k++;
      const b = readLit(src, k); if (!b) continue;
      if (!a.exprs.length && !b.exprs.length) continue; // a plain line: collectLines() has it
      const both: [string, Lit][] = [['en', a], ['vi', b]];
      for (const [lang, L] of both) {
        if (!L.pieces.some(p => /\p{L}/u.test(p))) continue;
        const key = lang + '\u0000' + L.pieces.join('\u0001');
        if (seen.has(key)) continue; seen.add(key);
        out.push({ lang, pieces: L.pieces, fills: L.exprs.map(fillWords), from: f });
      }
    }
  }
  return out;
}
// say(…) calls whose words are not written in the call (a variable, a list, a function): their lines are built while
// playing, so tools/voice-harvest.mts collects them into tools/voice-extra.json; counted for the coverage check
export function dynamicSays() {
  const out = [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8'); SAY.lastIndex = 0; let m;
    while ((m = SAY.exec(src))) { const c = src[SAY.lastIndex]; if (c === "'" || c === '"' || c === '`' || c === ')') continue; if (/function\s+$|=>\s*$/.test(src.slice(Math.max(0, m.index - 12), m.index))) continue; out.push(f + ':' + (src.slice(0, m.index).split('\n').length)); }
  }
  return out;
}
// numbers said on their own ("4!", "You rolled 4") are recorded once each, 0–100
export const NUMBERS = Array.from({ length: 101 }, (_, i) => String(i));

// ---------- (round R item 12) which area each line belongs to ----------
// The pack downloads area by area: a small core first (the start, home, Làng Sen, the menus, the Simple screen, the
// commonest game lines), then on Wi-Fi the place the child is in, the places they have been, and the rest. Areas are
// place ids (the game's regions: village, town, hanoi…), never positions; lines used everywhere go in games, stories,
// festivals or world. Where a line was heard while playing (tools/voice-where.json) wins over the file it is in.
export const GROUPS = ['core', 'games', 'stories', 'festivals', 'world'];
const FILE_AREA = {
  core: ['js/main.js', 'js/ui.js', 'js/simple.js', 'js/hud.js', 'js/content/activities.js', 'js/games/frame.js', 'js/kidplay.js', 'js/companion.js',
    'js/extras.js', 'js/commands.js', 'js/lotus.js', 'js/lanterns.js', 'js/dinh.js', 'js/content/chapters.js', 'js/farm.js', 'js/pets.js',
    'js/myhouse.js', 'js/popups.js'],
  village: ['js/chatter.js', 'js/folkshow.js'],
  town: ['js/town.js', 'js/yard.js', 'js/content/yard.js', 'js/homes.js'],
  aussie: ['js/suburbs.js'],
  lake: ['js/ferry.js'],
  hanoi: ['js/content/chapter2hanoi.js', 'js/content/chapter2props.js', 'js/content/chapter2films.js', 'js/content/chapter2text.js'], // (story chapter 2 happens in Hà Nội)
  sydney: ['js/content/chapter3sydney.js', 'js/content/chapter3props.js', 'js/content/chapter3films.js', 'js/content/chapter3text.js'], // (story chapter 3 happens in Sydney)
  games: ['js/howto.js', 'js/howto-player.js', 'js/learn.js', 'js/words.js', 'js/words2.js', 'js/symbols.js', 'js/vnfun.js', 'js/content/films.js', 'js/netgames.js', 'js/coop.js', 'js/twinchests.js'],
  stories: ['js/talesdata.js', 'js/tales-content.js', 'js/tales.js', 'js/story.js'],
  festivals: ['js/festivals.js', 'js/content/festcal.js', 'js/hoilang.js', 'js/content/hoilang.js', 'js/content/songs.js', 'js/songs.js', 'js/content/releases.js', 'js/festdecor.js']
};
// (v1.07 split-code) the parts of js/ui.js (js/ui/*.js) count as js/ui.js, so their lines keep their place in the core
const uiPart = (f: string) => /^js\/ui\/[\w-]+\.js$/.test(f) ? 'js/ui.js' : f;
const AREA_OF = new Map(Object.entries(FILE_AREA).flatMap(([a, fs]) => fs.map(f => [f, a])));
// how early a core line comes (the order of FILE_AREA.core: the start first): when the core is over its size, the
// last ones go to their own area instead (tools/make-voice-pack.mts CORE_MB); 40 = a line said in many games
export const corePri = fromFiles => Math.min(40, ...fromFiles.map(f => { const i = FILE_AREA.core.indexOf(mainPart(uiPart(f))); return i < 0 ? 40 : i; }));
// where a core line goes if the core is full: the area of its other files, else the games or the world
export const nonCoreArea = fromFiles => { const a = [...new Set(fromFiles.map(areaOfFile))].filter(x => x !== 'core').sort((x, y) => +(x === 'world') - +(y === 'world'))[0]; return a || (fromFiles.some(f => f.startsWith('js/games/')) ? 'games' : 'world'); };
export const areaOfFile = f => AREA_OF.get(mainPart(uiPart(f))) || (f.startsWith('js/games/') || f.startsWith('js/content/films/') ? 'games' : 'world'); // (the tale films go with the other films)
// the area of a line: the core wins (wherever else it is used), then where it was heard (the area most often, or a
// game), then its file
const RANK = a => a === 'core' ? 0 : a === 'world' ? 3 : GROUPS.includes(a) ? 2 : 1;
// heard: where it was heard while playing (tools/voice-where.json): in which games (g) and areas (a), how often
export function areaOfLine(fromFiles: string[], heard?: { g?: Record<string, number>, a?: Record<string, number> }): string {
  const byFile = [...new Set(fromFiles.map(areaOfFile))].sort((a, b) => RANK(a) - RANK(b));
  if (byFile[0] === 'core') return 'core';
  if (heard) {
    const games = Object.keys(heard.g || {}).length;
    if (games >= 3) return 'core'; // said in many games: one of the commonest lines
    const a = Object.entries(heard.a || {}).sort((x, y) => y[1] - x[1])[0];
    if (a) return a[0];
    if (games) return 'games';
  }
  return byFile[0] || 'world';
}
export function readWhere() { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/voice-where.json'), 'utf8')); } catch (e) { return {}; } }

if (process.argv[1] && process.argv[1].endsWith('voice-lines.mts')) {
const lines = collectLines();
const chars = lines.reduce((a, l) => a + l.en.length + l.vi.length, 0);
if (process.argv.includes('--count')) { console.log(JSON.stringify({ lines: lines.length, characters: chars, en: lines.reduce((a, l) => a + l.en.length, 0), vi: lines.reduce((a, l) => a + l.vi.length, 0) })); }
else console.log(JSON.stringify(lines, null, 1));
}
