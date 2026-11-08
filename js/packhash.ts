import { mixed, enMixed } from './viwords.js';
// A short name for a spoken line in the offline voice pack (the same in the game and in the pack maker).
export function packHash(lang, text) {
  const s = lang + '|' + String(text).replace(/\s+/g, ' ').trim();
  let a = 0x811c9dc5, b = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 0x01000193) >>> 0; b = Math.imul(b ^ c, 0x5bd1e995) >>> 0; b ^= b >>> 15; }
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}
// (round R) an English line with Vietnamese words is recorded with both voices (js/viwords.js) under its own name, so a
// device that kept the old all-English recording fetches the new one instead of playing the old file it has saved
// (v1.08 aussie-voice) and a Vietnamese line with English words (enRuns) the same way: 'vi+en'
export const lineHash = (lang, text) => lang === 'en' && mixed(text) ? packHash('en+vi', text) : lang === 'vi' && enMixed(text) ? packHash('vi+en', text) : packHash(lang, text);
// (round R item 12) a line with changing words is recorded as parts (tools/voice-lines.mts): the words of a fixed piece
// worth saying on their own, with no leading punctuation; '' when it has no letter (the same in the game and the tools)
export const partText = p => { const t = String(p).replace(/\s+/g, ' ').replace(/^[\s.,!?:;…'"“”()\-–—]+/, '').trim(); return /\p{L}/u.test(t) ? t : ''; };
