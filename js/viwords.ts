// Vietnamese words inside English lines (round R, owner: "bánh khọt" or "nước mía" said by the English voice can't be
// understood). viRuns() cuts an English line into pieces, [['en', 'Buy some '], ['vi', 'bánh khọt'], ['en', '?']], so
// dish names, place names and people's names are spoken by the Vietnamese voice and everything else stays English.
// Used by the game (js/voice.js, device and online voices) and by tools/make-voice-pack.mts (recorded voices).
//   · a word with Vietnamese letters (đ, ơ, ư, ă, â, ê, ô or a tone mark) is Vietnamese;
//   · a plain word right next to one (only spaces between) joins it when it is a Vietnamese syllable that is not also
//     an everyday English word: "Hội An", "Bắc Ninh", "Phố Hai Quê", "Bác 2";
//   · a few well-known names have no marks at all ("Nha Trang", "Sa Pa").
const MARK = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
const SYLL = new Set(('an ba bi ca cau canh cha chai chi chim cho co con cu da dinh em gia gian hai hoa kem kim kinh lang lon long ly mai mi minh '
  + 'mua nao nghe nghen nghi ngoan ngon nha ninh phong phu quan ra re ru sanh sao ta tam thoi thu thung tim tinh tranh tre trong trung tui xa xe xin').split(' '));
// plain words that join only when written with a capital (as a name): lower case they are English
const CAPS_ONLY = new Set(['an', 'long', 'mai', 'em', 'con', 'ta', 'trong', 'kim', 'lang', 'mi', 're']);
const NAMES = /\b(Nha Trang|Sa Pa|Sapa|Vung Tau|Ha Long|Hoi An|Da Nang|Hue|Pho|Banh Mi)\b/g;
// words with marks that are not Vietnamese (Chinese pinyin such as "Xiè xie")
const NOT_VI = /^(xi[eè]|xiè|n[ǐi]h[ǎa]o)$/i;
const core = w => w.replace(/^[^\p{L}\d]+|[^\p{L}\d]+$/gu, '');
const isVi = w => { const c = core(w); return !!c && MARK.test(c) && !NOT_VI.test(c) && !/[ǎǐǒǔǖǘǚǜāēīōū]/.test(c); };
const joins = w => { const c = core(w); if (!c) return false;
  if (/^\d+$/.test(c)) return true; const l = c.toLowerCase(); return SYLL.has(l) && (!CAPS_ONLY.has(l) || c[0] !== l[0]); };
export const hasVi = text => MARK.test(text) || (NAMES.lastIndex = 0, NAMES.test(text));

export function viRuns(text) {
  text = String(text);
  if (!hasVi(text)) return [['en', text]];
  // words and the spaces between them; a "word" keeps its punctuation, which is cut off again below
  const parts = text.split(/(\s+)/), n = parts.length, vi = new Array(n).fill(false);
  for (let i = 0; i < n; i += 2) vi[i] = isVi(parts[i]);
  NAMES.lastIndex = 0; let m; while ((m = NAMES.exec(text))) { let at = 0; for (let i = 0; i < n; i++) { const end = at + parts[i].length; if (i % 2 === 0 && end > m.index && at < m.index + m[0].length) vi[i] = true; at = end; } }
  // plain syllables next to a Vietnamese word join it; a number joins only after one ("Bác 2"); punctuation stops a run
  const stops = w => /[,.!?;:…)"”]$/.test(w), opens = w => /^[("“]/.test(w);
  for (let changed = true; changed;) { changed = false;
    for (let i = 0; i < n; i += 2) { if (vi[i] || !joins(parts[i])) continue;
      const left = i >= 2 && vi[i - 2] && !stops(parts[i - 2]) && !opens(parts[i]), right = i + 2 < n && vi[i + 2] && !stops(parts[i]) && !opens(parts[i + 2]) && !/^\d+$/.test(core(parts[i]));
      if (left || right) { vi[i] = changed = true; } } }
  const out = [], push = (lang, s) => { if (!s) return; const last = out[out.length - 1]; if (last && last[0] === lang) last[1] += s; else out.push([lang, s]); };
  for (let i = 0; i < n; i++) {
    const w = parts[i];
    if (i % 2) { push(vi[i - 1] && vi[i + 1] && !/[^\p{L}\d]$/u.test(parts[i - 1]) && !/^[^\p{L}\d]/u.test(parts[i + 1]) ? 'vi' : 'en', w); continue; }
    if (!vi[i]) { push('en', w); continue; }
    // leading and trailing punctuation stays with the English voice
    const a = w.match(/^[^\p{L}\d]*/u)[0], z = w.slice(a.length).match(/[^\p{L}\d]*$/u)[0];
    push('en', a); push('vi', w.slice(a.length, w.length - z.length)); push('en', z);
  }
  return out.filter(([, s]) => s);
}
// true when a line really needs the Vietnamese voice somewhere
export const mixed = text => viRuns(text).some(([l]) => l === 'vi');
// The Azure SSML for an English line with Vietnamese words: the English voice, switching to the Vietnamese voice of the
// same man or woman for each Vietnamese piece. Each voice normally pads itself with up to a second of silence, so the
// pauses at the switches are set by hand: none before a piece, a breath after a comma, a full stop's pause after a sentence.
// runs: viRuns(text), or the same list sent by Sparkle Studio's page; prosody: e.g. 'rate="-3%" pitch="+0%"'.
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
// (v1.08 aussie-voice) base 'vi': a Vietnamese line with English words (enRuns), the same switches the other way round
export function mixedSsml(runs, enVoice, viVoice, prosody = '', base = 'en') {
  runs = runs.filter((r, i) => /[\p{L}\d]/u.test(r[1]) || i === runs.length - 1);
  const body = runs.map(([l, s], i) => {
    const end = s.trimEnd(), tail = i === runs.length - 1 ? '' : /[.!?…]["”')]?$/.test(end) ? '350ms' : /[,;:]$/.test(end) ? '180ms' : '40ms';
    return `<voice name="${l === 'vi' ? viVoice : enVoice}">${i ? '<mstts:silence type="Leading-exact" value="0ms"/>' : ''}${tail ? `<mstts:silence type="Tailing-exact" value="${tail}"/>` : ''}${prosody ? `<prosody ${prosody}>${esc(s)}</prosody>` : esc(s)}</voice>`;
  }).join('');
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${base === 'vi' ? 'vi-VN' : 'en-AU'}">${body}</speak>`;
}

// ---------- (v1.08 aussie-voice) English words inside a Vietnamese line ----------
// The owner, 3 Nov 2026 AEDT: the Aussie slang taught in Vietnamese ("G'day", "arvo", "brekkie") was read by the
// Vietnamese voice, so "G'day" came out as "gút dờ ay". enRuns() is the opposite of viRuns(): it cuts a Vietnamese line
// into pieces, [['vi', '"'], ['en', "G'day"], ['vi', '" nghĩa là gì?']], so the English words are said by the English
// (en-AU) voice and the rest stays Vietnamese. Used by the game (device voices), the pack maker and Sparkle Studio.
//   · a quoted piece ("…" or “…”) with no Vietnamese letters and a word that cannot be a Vietnamese syllable is English
//     (that is how the text marks English exactly: an example sentence is written in quotes);
//   · the Aussie slang the game teaches (js/words.ts AUSSIE_SLANG) and a few English words the lines use are English
//     anywhere in the line, unless the word could also be Vietnamese ("Ta", "Roo"): those only count inside quotes.
import { AUSSIE_SLANG } from './words.js';
// one Vietnamese syllable written without marks: an initial consonant, one to three vowels, a final consonant
const VI_SYLLABLE = /^(?:ngh|ng|nh|ch|gh|gi|kh|ph|qu|th|tr|[bcdđghklmnprstvx])?[aeiouy]{1,3}(?:ch|ng|nh|[cmnpt])?$/i;
const viShaped = (w: string) => { const c = w.replace(/[^\p{L}\d]/gu, ''); return !c || /^\d+$/.test(c) || MARK.test(c) || VI_SYLLABLE.test(c); };
// English said inside Vietnamese lines that is not slang: a greeting, the names of Aussie games, counting
export const EN_IN_VI_EXTRA = ['Hello', 'Snap', 'Noughts and Crosses', 'One, two, three', 'No worries', 'Good on ya', 'Vegemite', 'Tim Tam'];
// the slang words, and their example sentences, which the villagers say after "Ví dụ:" (js/regions.ts, js/chat-player.ts)
const slang = () => AUSSIE_SLANG.flatMap(s => [String(s[0]).replace(/[!?.]+$/, ''), String(s[4])]);
let LEX: RegExp | null = null;
const lexicon = () => LEX || (LEX = (() => {
  const words = [...new Set([...slang(), ...EN_IN_VI_EXTRA])].filter(w => w.split(/\s+/).length > 1 || !viShaped(w)).sort((a, b) => b.length - a.length);
  const pat = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/['’]/g, "['’]").replace(/,?\s+/g, ',?\\s+')).join('|');
  // (no lookbehind: older iPhones cannot run it) the letter before is taken as group 1 and left out again below
  return new RegExp(`(^|[^\\p{L}\\d'’])(${pat})(?![\\p{L}\\d'’])`, 'giu');
})());
const QUOTED = /(["“])([^"“”\n]+?)(["”])/g;
// quoted words of other languages the kiosks teach (Chinese pinyin with its tone marks, Hindi) are not English
const NOT_EN = /[ǎǐǒǔǖǘǚǜāēīōū]|\b(dhanyavaad|namaste)\b/i;
// a quoted slang word that could also be Vietnamese ("Ta", "Roo") is English too
const quotedSlang = (s: string) => slang().some(w => w.toLowerCase() === s.trim().replace(/[!?.]+$/, '').toLowerCase());
const englishQuote = (s: string) => quotedSlang(s) || !MARK.test(s) && !NOT_EN.test(s) && s.split(/[\s,.!?;:…()\-–—]+/).some(w => /^\p{L}[\p{L}'’]+$/u.test(w) && !viShaped(w));
/** A Vietnamese line cut into Vietnamese and English pieces (one ['vi', text] when it has no English). */
export function enRuns(text): Array<['vi' | 'en', string]> {
  text = String(text);
  const en = new Array(text.length).fill(false), mark = (a: number, b: number) => { for (let i = a; i < b; i++) en[i] = true; };
  QUOTED.lastIndex = 0; let m;
  while ((m = QUOTED.exec(text))) if (englishQuote(m[2])) mark(m.index + 1, m.index + 1 + m[2].length);
  const lex = lexicon(); lex.lastIndex = 0;
  while ((m = lex.exec(text))) mark(m.index + m[1].length, m.index + m[0].length);
  if (!en.includes(true)) return [['vi', text]];
  // punctuation and spaces at the edges of an English piece go with the Vietnamese voice, except "!" and "?" that end it
  for (let i = 0; i < text.length; i++) if (en[i] && (i === 0 || !en[i - 1])) { let j = i; while (j < text.length && en[j]) j++;
    let a = i; while (a < j && /[\s"“”,;:(]/.test(text[a])) en[a++] = false;
    let z = j; while (z > a && /[\s"“”,;:)]/.test(text[z - 1])) en[--z] = false; i = j; }
  const out: Array<['vi' | 'en', string]> = [];
  for (let i = 0; i < text.length; i++) { const l = en[i] ? 'en' : 'vi', last = out[out.length - 1]; if (last && last[0] === l) last[1] += text[i]; else out.push([l, text[i]]); }
  return out.filter(([, s]) => s);
}
/** true when a Vietnamese line has English words for the English voice */
export const enMixed = text => enRuns(text).some(([l]) => l === 'en');
