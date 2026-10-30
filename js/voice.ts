import { createVoiceIndex, voiceLanguages } from './voice-index.js';
// Talking voice in English and Vietnamese using the device's own natural voices.
// Premium/enhanced/neural voices are picked first; grown-ups can choose a voice in settings.
import { settings, saveSettings, profiles } from './state.js';
import { ac, unlockers } from './audio.js';
import { swapNames } from './i18n.js';
import { packHash, lineHash, partText } from './packhash.js';
import { events, managementEvidence } from './core/events.js';
import { viRuns, mixed } from './viwords.js';
import { mixedVoiceFragments } from './voice-fragments.js';
import { CUSTOM } from './custom.js';

let all = [];
const BAD = /compact|eloquence|novelty|whisper|bad news|bells|boing|bubbles|cellos|zarvox|trinoids|albert|jester|organ|superstar|wobble|grandpa|grandma|rocko|reed|eddy|flo\b|sandy|shelley|fred|junior|ralph|kathy|good news|hysterical|deranged|pipe/i;
function score(v) {
  const n = v.name.toLowerCase(); let s = 0;
  if (/premium/.test(n)) s += 60; if (/enhanced/.test(n)) s += 50; if (/neural|natural|online/.test(n)) s += 55; if (/siri/.test(n)) s += 40;
  if (/google/.test(n)) s += 30; if (/samantha|ava|allison|zoe|serena|karen|jenny|aria|libby|sonia|emma|nicky|linh|an\b|hoaimy|namminh/.test(n)) s += 12;
  if (BAD.test(n)) s -= 80; if (v.localService === false) s += 5; return s;
}
function load() {
  try { all = window.speechSynthesis ? speechSynthesis.getVoices() : []; } catch (e) { all = []; }
  listeners.forEach(f => f());
}
const listeners = new Set<() => void>();
export const onVoices = (f: () => void): (() => void) => { listeners.add(f); return () => { listeners.delete(f); }; };
if (window.speechSynthesis) { load(); try { speechSynthesis.addEventListener('voiceschanged', load); } catch (e) { } }

export function voicesFor(lang) {
  const re = new RegExp('^' + (lang || 'en'), 'i');   // en, vi, zh (Chinese), hi (Hindi)
  const unique = [];
  const seen = new Map();
  for (const v of all.filter(v => re.test(v.lang))) {
    const key = `${v.name.replace(/\s*\((?:enhanced|premium|compact|standard)\)$/i, '').trim().toLowerCase()}:${v.lang.toLowerCase()}`;
    const old = seen.get(key);
    if (!old || score(v) > score(old) || (score(v) === score(old) && v.localService && !old.localService)) {
      if (old) unique[unique.indexOf(old)] = v;
      else unique.push(v);
      seen.set(key, v);
    }
  }
  return unique.sort((a, b) => score(b) - score(a) || (Number(/en[-_](au|us)/i.test(b.lang)) - Number(/en[-_](au|us)/i.test(a.lang))));
}
export function voiceFor(lang) {
  const list = voicesFor(lang), want = lang === 'vi' ? settings.voiceVi : lang === 'en' ? settings.voiceEn : null;
  return (want && list.find(v => v.name === want)) || list[0] || null;
}
export const hasVietnamese = () => voicesFor('vi').length > 0;

// Voice styles change how the device voice sounds: natural, a cute cartoon friend, or a calm grandparent.
export const VOICE_STYLES = [
  { id: 'natural', icon: '🙂', name: () => (settings.lang === 'vi' ? 'Tự nhiên' : 'Natural'), rate: 1, pitch: 1 },
  { id: 'cute', icon: '🐣', name: () => (settings.lang === 'vi' ? 'Dễ thương' : 'Cute'), rate: 1.06, pitch: 1.35 },
  { id: 'grandpa', icon: '👴', name: () => (settings.lang === 'vi' ? 'Ông bà' : 'Grandparent'), rate: .88, pitch: .82 }
];
const style = () => VOICE_STYLES.find(v => v.id === settings.voiceStyle) || VOICE_STYLES[0];

// ---------- a voice for each character ----------
// When a character talks (dialog), their title tells us who they are: grandparents speak a little lower
// and slower, kids higher, aunties and uncles get a woman's or a man's voice. If the device has several
// voices for the language they are shared out by character, so neighbours don't all sound the same.
let speaker = null;
export const setSpeaker = name => { speaker = name ? String(name) : null; };
const FEMALE = /^(Bà|Cô|O|Dì|Chị|Mợ|Thím|Mrs|Ms|Miss|Aunty|Auntie|Grandma|Nana|Nanna|Big Sister|Sister|Lady|Madam)(?=[\s.]|$)/iu, MALE = /^(Ông|Chú|Bác|Anh|Cậu|Dượng|Mr|Uncle|Grandpa|Pop|Big Brother|Brother|Sir)(?=[\s.]|$)/iu;
const OLD = /^(Bà|Ông|Grandma|Grandpa|Nana|Nanna|Pop)(?=[\s.]|$)/iu;
const KIDS_F = /^(?:(?:Bé|Em|Little|Út)\s+)?(Tí|Bống|Mít|Lan|Ruby|Chloe|Bông|Hà|Trà|Na|Mai|Linh|Thảo|Vy|Ngọc|Hoa|Lily|Mia|Ava|Priya|Mei|Ling)(?=[\s.!,]|$)/iu;
// a villager's voice can also be set by name (Sparkle Studio → Villagers): { 'Bé Hà': 'f', 'Tí': 'm' }
let GENDERS = {};
export const setVoiceGenders = g => { GENDERS = g && typeof g === 'object' ? g : {}; };
setVoiceGenders(CUSTOM.genders);
export function speakerKind(name = speaker) {
  if (!name) return null;
  const n = name.trim(), old = OLD.test(n), set = GENDERS[n] || GENDERS[n.replace(/^(Bé|Em|Little|Út)\s+/iu, '')];
  const gender = set === 'f' || set === 'm' ? set : FEMALE.test(n) ? 'f' : MALE.test(n) ? 'm' : KIDS_F.test(n) ? 'f' : 'm';
  const kid = !FEMALE.test(n) && !MALE.test(n) && !/owl|cú|bầu|gourd|cloud|mây|davo|gazza/i.test(n);
  let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { gender, old, kid, seed: h };
}
const FEMALE_VOICE = /female|woman|linh|hoaimy|an\b|mai|lan|samantha|karen|catherine|zoe|ava|allison|serena|jenny|aria|libby|sonia|emma|natasha|nicky|susan|victoria|google .*(vi|tiếng)/i;
const MALE_VOICE = /\bmale\b|namminh|\bnam\b|minh|daniel|lee|james|thomas|aaron|gordon|william|ryan|liam|duc|đức/i;
function speakerVoice(lang, kind) {
  const list = voicesFor(lang); if (!kind || list.length < 2) return null;
  const want = lang === 'vi' ? settings.voiceVi : settings.voiceEn;
  const g = list.filter(v => kind.gender === 'm' ? MALE_VOICE.test(v.name) && !/female/i.test(v.name) : FEMALE_VOICE.test(v.name) && !MALE_VOICE.test(v.name));
  const pool = g.length ? g : list.slice(0, 4);
  // keep the grown-up's chosen voice for the main narrator-like characters, share the rest out
  return pool.find(v => v.name === want && kind.seed % 2 === 0) || pool[kind.seed % pool.length];
}
// (owner, 24 Oct AEDT) an animal sound the device's voice would spell out as letters ("bee ay ay") is said as it sounds
const SAID = (text, lang) => lang === 'en' ? String(text).replace(/\b[Bb]aa+\b/g, 'bah') : text;
function utter(text, lang) {
  const u = new SpeechSynthesisUtterance(SAID(text, lang));
  const kind = speakerKind();
  const v = speakerVoice(lang, kind) || voiceFor(lang);
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = { vi: 'vi-VN', zh: 'zh-CN', hi: 'hi-IN' }[lang] || 'en-AU';
  // A touch slower than normal and at natural pitch sounds the most human; grown-ups can fine-tune both.
  const st = style();
  u.rate = (lang === 'vi' ? .95 : .97) * (settings.voiceRate || 1) * st.rate;
  u.pitch = Math.min(2, (settings.familyVoice && settings.familyPitch && st.id === 'natural' ? settings.familyPitch : (settings.voicePitch || 1)) * st.pitch); u.volume = 1;
  if (kind) {
    if (kind.old) { u.rate *= .9; u.pitch *= .86; }
    else if (kind.kid) { u.rate *= 1.04; u.pitch = Math.min(2, u.pitch * 1.22); }
    else if (kind.gender === 'm') u.pitch *= .92; else u.pitch = Math.min(2, u.pitch * 1.05);
  }
  return u;
}
// Device speech, as a promise that resolves when the line has been spoken.
// Long lines are split at sentence ends: some phones cut long utterances off or rush them.
function deviceSpeak(text, lang, my, localVoice:SpeechSynthesisVoice|null=null) {
  const observed=managementEvidence.begin('voice.result',{source:'device',language:lang});
  if (!window.speechSynthesis) {observed({outcome:'failed'});return Promise.resolve();}
  try { speechSynthesis.resume(); } catch (e) { }
  const parts = String(text).match(/[^.!?。…]+[.!?。…]*\s*/g) || [text];
  let chunks = []; for (const p of parts) { const last = chunks.length - 1; if (last >= 0 && (chunks[last] + p).length < 160) chunks[last] += p; else chunks.push(p); }
  // (round R, owner: "bánh khọt" and "nước mía" said by the English voice can't be understood) the Vietnamese words of an
  // English line are said by the phone's Vietnamese voice when it has one
  chunks = chunks.map(c => [lang, c]);
  if (!localVoice && lang === 'en' && mixed(text) && voicesFor('vi').length) chunks = chunks.flatMap(([, c]) => viRuns(c)).filter(([, c]) => /[\p{L}\d]/u.test(c));
  return new Promise<void>(res => {
    let left = chunks.length, ended = false, failed = false;
    const end = (outcome='success') => { if (!ended) { ended = true; observed({outcome:my!==seq?'cancelled':outcome}); res(); } };
    chunks.forEach(([l, c]) => { const u = utter(c.trim(), l); if(localVoice){u.voice=localVoice;u.lang=localVoice.lang;} u.onend = () => { if (--left <= 0) end(failed?'failed':'success'); }; u.onerror = () => { failed=true; if(--left<=0)end('failed'); }; try { speechSynthesis.speak(u); } catch (e) { end('failed'); } });
    // in case the device never reports the end
    setTimeout(() => end('unknown'), 1500 + String(text).length * 95);
    const poll = setInterval(() => { if (my !== seq) { clearInterval(poll); end('cancelled'); } if (ended) clearInterval(poll); }, 200);
  });
}
let seq = 0;
// say('Hello', 'Xin chào') speaks the current language (and the other one too in bilingual mode).
// listeners that show captions for every spoken line (even when the voice is switched off)
export const spoken = [];
// A real sound can carry its own accessible caption without a second voice spelling the sound aloud.
export function captionOnly(en: string, vi?: string): void { const t = swapNames(settings.lang === 'vi' ? (vi ?? en) : en, settings.lang); spoken.forEach(f => { try { f(t); } catch (e) { } }); }
export function say(en, vi) { captionOnly(en, vi); speak(en, vi); }
// The same, but resolves when it has finished speaking (used by the How-to-play films).
export function sayAsync(en, vi) { return speak(en, vi); }
// (owner, 13 Oct: soft music under the story films) how many lines are being spoken now; the theatre lowers its music
// while it is more than 0
const activeSpeech = new Set<object>(), talkers = new Set<(speaking: number) => void>();
export const onSpeaking = f => { talkers.add(f); return () => talkers.delete(f); };
const told = () => talkers.forEach(f => { try { f(activeSpeech.size); } catch (e) { } });
async function speak(en, vi) {
  if (!settings.voice) return;
  const ticket = {}; activeSpeech.add(ticket); told();
  try { return await speakNow(en, vi); } finally { activeSpeech.delete(ticket); told(); }
}
async function speakNow(en, vi) {
  en = swapNames(en, 'en'); vi = swapNames(vi, 'vi');
  const my = ++seq;
  try { speechSynthesis.cancel(); } catch (e) { }
  stopPlayback();
  if (!PACK || !voiceLanguages(settings).every(l => voiceIndex.has(l))) { await waitPack(); if (my !== seq) return; }
  // a family recording of exactly this line wins over any other voice
  if (settings.familyVoice) {
    const ph = FAMILY_PHRASES.find(p => p.en === en || p.vi === vi);
    if (ph && hasClip(settings.lang, ph.id)) { await playClip(settings.lang, ph.id, my); return; }
  }
  const parts = [settings.lang === 'vi' ? ['vi', vi ?? en] : ['en', en]];
  if (settings.bilingual && vi != null && en !== vi) parts.push(settings.lang === 'vi' ? ['en', en] : ['vi', vi]);
  for (const [lang, text] of parts) {
    if (my !== seq) return;
    if (window.__svVoiceLog) window.__svVoiceLog(lang, text, !!packSlot(lang, text)); // for tools/voice-harvest.mts
    try { if (await playPack(lang, text, my)) continue; } catch (e) { }
    if (my !== seq) return;
    // (round R item 12) a line with changing words (a number, an item, a name) is put together from its recorded parts
    try { if (await playParts(lang, text, my)) continue; } catch (e) { }
    if (my !== seq) return;
    // Not recorded as a whole: recorded sentences inside it still play from the pack; only the rest uses another voice.
    const bits = sentences(text);
    if (PACK && bits.length > 1 && bits.some(b => packSlot(lang, b) || tplMatch(lang, b))) {
      for (const b of bits) {
        if (my !== seq) return;
        let ok: unknown = false; try { ok = await playPack(lang, b, my) || await playParts(lang, b, my); } catch (e) { }
        if (!ok) { noteMiss(lang, b); await otherVoice(b, lang, my); }
      }
      continue;
    }
    noteMiss(lang, text);
    await otherVoice(text, lang, my);
  }
}
// ---------- (round R item 12) lines put together from recorded parts ----------
// The pack lists the templates of lines with changing words (manifest `tpl`, from tools/voice-lines.mts): the fixed
// pieces are recorded on their own, and so are the numbers 0–100 and the words that fill a gap. A line that matches a
// template plays its pieces and gaps in order. A gap with no recording that is a name (a child's, a friend's, a pet's)
// is left out: names are never recorded and never spoken by another voice (HANDOFF rule 11); any other word with no
// recording is said by the phone's voice and noted as missing.
let TPLS = null;
const esc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function tplMatch(lang, text) {
  if (!PACK || !PACK.tpl || !PACK.tpl[lang]) return null;
  TPLS = TPLS && TPLS.pack === PACK ? TPLS : { pack: PACK };
  const list = TPLS[lang] || (TPLS[lang] = PACK.tpl[lang].map(ps => ({ ps, w: ps.join('').replace(/[^\p{L}]/gu, '').length, re: new RegExp('^\\s*' + ps.map(p => esc(p).replace(/\s+/g, '\\s*')).join('(.+?)') + '\\s*$', 'u') })).filter(t => t.w > 1).sort((a, b) => b.w - a.w));
  const t = String(text).replace(/\s+/g, ' ').trim();
  for (const x of list) {
    const m = x.re.exec(t); if (!m) continue;
    const parts = [];
    x.ps.forEach((p, i) => { const q = partText(p); if (q) parts.push([0, q]); if (i < m.length - 1) { const f = m[i + 1].replace(/^[\s.,!?:;…'"“”()]+|[\s,:;'"“”()]+$/g, ''); if (/[\p{L}\d]/u.test(f)) parts.push([1, f]); } });
    // only worth it when every fixed piece is recorded
    if (parts.some(([k]) => !k) && parts.every(([k, q]) => k || packSlot(lang, q))) return parts;
  }
  return null;
}
// a gap word that is someone's name: one of this device's children, or one or two capitalised words with no recording
const isName = w => (profiles || []).some(p => p && p.name && (p.name === w || p.name.replace(/^(Bé|Em|Little|Út)\s+/iu, '') === w)) || /^\p{Lu}[\p{L}'’-]*(\s\p{Lu}[\p{L}'’-]*)?$/u.test(w);
async function playParts(lang, text, my) {
  const parts = tplMatch(lang, text); if (!parts) return false;
  for (const [, q] of parts) {
    if (my !== seq) return true;
    let ok: unknown = false; try { ok = await playPack(lang, q, my); } catch (e) { }
    if (ok || isName(q)) continue;
    noteMiss(lang, q); await otherVoice(q, lang, my);
  }
  return true;
}
// (for the checks: what a line would be made of)
export const lineParts = (lang, text) => tplMatch(lang, swapNames(text, lang));
const sentences = text => (String(text).match(/[^.!?。…]+[.!?。…]*\s*/g) || [text]).map(t => t.trim()).filter(Boolean);
// (round R privacy, 9 Oct) no recording: the phone's own voice, never an online speech service
async function otherVoice(text, lang, my) { await deviceSpeak(text, lang, my); }
// Lines the game had to say without a recording are noted on this device (most-said first). Grown-ups can send
// the list to Sparkle Studio (it travels inside the backup file), which records them for the next pack.
const MISS_KEY = 'sv2_voicemiss';
let misses = null;
const loadMisses = () => { if (!misses) { try { misses = JSON.parse(localStorage.getItem(MISS_KEY) || '[]'); } catch (e) { misses = []; } } return misses; };
let missTimer: ReturnType<typeof setTimeout> | 0 = 0;
function noteMiss(lang, text) {
  if (!PACK || !text || /^[\d\s.,!?]+$/.test(text)) return;
  const L = loadMisses(), f = L.find(m => m[0] === lang && m[1] === text);
  if (f) f[2]++; else { L.push([lang, text, 1]); if (L.length > 600) { L.sort((a, b) => b[2] - a[2]); L.length = 500; } }
  clearTimeout(missTimer); missTimer = setTimeout(() => { try { localStorage.setItem(MISS_KEY, JSON.stringify(L)); } catch (e) { } }, 2000);
}
export const voiceMisses = () => loadMisses().slice().sort((a, b) => b[2] - a[2]);
export function forgetVoiceMisses(lines) {
  if (!lines.length) return;
  const sent = new Set(lines.map(m => `${m[0]}|${m[1]}`));
  const remaining = loadMisses().filter(m => !sent.has(`${m[0]}|${m[1]}`));
  misses = remaining;
  clearTimeout(missTimer);
  try { localStorage.setItem(MISS_KEY, JSON.stringify(remaining)); } catch (e) { }
}
export const clearVoiceMisses = () => { misses = []; try { localStorage.removeItem(MISS_KEY); } catch (e) { } };
// Speak one string in a fixed language (letter names, etc.).
export function sayIn(lang, text) {
  if (!settings.voice) return;
  if (window.__svVoiceLog) window.__svVoiceLog(lang, text, !!packSlot(lang, text));
  const my = ++seq;
  try { speechSynthesis.cancel(); } catch (e) { }
  stopPlayback();
  if (!voiceIndex.has(lang)) { waitPack([lang]).then(() => { if (my === seq) sayInLoaded(lang, text, my); }); return; }
  sayInLoaded(lang, text, my);
}
function sayInLoaded(lang, text, my) {
  if (packSlot(lang, text)) { playPack(lang, text, my).then(ok => { if (!ok && my === seq) deviceSpeak(text, lang, my); }).catch(() => deviceSpeak(text, lang, my)); return; }
  deviceSpeak(text, lang, my);
}
// the phone's own voice only (Grown-ups → Advanced → Phone voice ▶), so the chosen voice is really heard
export function sayDevice(lang, text) { const my = ++seq; try { speechSynthesis.cancel(); } catch (e) { } stopPlayback(); activeSpeech.clear(); told(); return deviceSpeak(text, lang, my); }
/** Parent-written words use an explicitly local OS voice; cloud-backed browser voices are excluded too. */
export async function sayPrivateFamilyLine(lang:string,text:string){
 if(!settings.voice)return false;
 hush();
 const voices=voicesFor(lang).filter(voice=>voice.localService===true);
 const chosen=voices.find(voice=>voice.name===(lang==='vi'?settings.voiceVi:settings.voiceEn))||voices[0];
 if(!chosen)return false;
 const my=seq,ticket={};activeSpeech.add(ticket);told();
 try{await deviceSpeak(text,lang,my,chosen);return true;}finally{activeSpeech.delete(ticket);told();}
}
export function hush() { seq++; try { speechSynthesis.cancel(); } catch (e) { } stopPlayback(); activeSpeech.clear(); told(); }

// ---------- Family voice: real recordings of a grown-up ----------
// A grown-up records the game's most-used lines. Those lines are then played in their real voice,
// and everything else is spoken by the device voice with its pitch moved towards theirs.
// (round R privacy, 9 Oct, owner: "never clone children's voices") the recordings stay on this device: no voice is copied.
export const FAMILY_PHRASES = [
  { id: 'hello', en: "Hello! Let's play!", vi: 'Xin chào! Cùng chơi nào!' },
  { id: 'great', en: 'Great job!', vi: 'Giỏi quá!' },
  { id: 'welldone', en: 'Well done!', vi: 'Làm tốt lắm!' },
  { id: 'clever', en: 'Yes! Clever!', vi: 'Đúng rồi! Thông minh quá!' },
  { id: 'super', en: 'Super!', vi: 'Tuyệt vời!' },
  { id: 'gotit', en: 'You got it!', vi: 'Con làm được rồi!' },
  { id: 'tryagain', en: 'Try again!', vi: 'Thử lại nhé!' },
  { id: 'didit', en: 'You did it!', vi: 'Con giỏi lắm, con làm xong rồi!' },
  { id: 'whatnext', en: 'What comes next?', vi: 'Tiếp theo là gì nhỉ?' },
  { id: 'lookdress', en: 'You look wonderful!', vi: 'Con trông tuyệt quá!' },
  { id: 'love', en: 'I love you! Have fun!', vi: 'Bố mẹ thương con! Chơi vui nhé!' }
];
const clips = {}; // `${lang}:${id}` -> { data: ArrayBuffer, type, decoded? }
let dbp = null;
function db() {
  if (!dbp) dbp = new Promise((res, rej) => { try { const r = indexedDB.open('sparkle-valley-voice', 1); r.onupgradeneeded = () => r.result.createObjectStore('clips'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
  return dbp;
}
const tx = async (mode, f) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('clips', mode), st = t.objectStore('clips'); const r = f(st); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); };
export async function loadClips() {
  try {
    const d = await db();
    await new Promise<void>(res => {
      const req = d.transaction('clips').objectStore('clips').openCursor();
      req.onsuccess = async () => {
        const c = req.result; if (!c) return res();
        const v = c.value; // stored as {data, type}; older saves stored a Blob
        if (v && v.data) clips[c.key] = { data: v.data, type: v.type };
        else if (v && v.arrayBuffer) v.arrayBuffer().then(data => { clips[c.key] = { data, type: v.type }; });
        c.continue();
      };
      req.onerror = res;
    });
  } catch (e) { }
}
export const hasClip = (lang, id) => !!clips[lang + ':' + id];
export const clipCount = () => Object.keys(clips).length;
export const clipCountFor = lang => FAMILY_PHRASES.filter(p => clips[lang + ':' + p.id]).length;
// Saved as a plain ArrayBuffer: Safari on older iPhones cannot always store Blobs in IndexedDB.
export async function saveClip(lang, id, blob) {
  const data = await blob.arrayBuffer(), key = lang + ':' + id;
  await tx('readwrite', st => st.put({ data, type: blob.type || 'audio/wav' }, key));
  clips[key] = { data, type: blob.type || 'audio/wav' };
}
export async function deleteClip(lang, id) { await tx('readwrite', st => st.delete(lang + ':' + id)); delete clips[lang + ':' + id]; }
let playing = null;
// Played through Web Audio, which (once unlocked by the first tap) can play at any time, even on iPhone.
// Returns a promise that resolves when the clip has finished (or false if there is no clip).
export function playClip(lang, id, my = null) {
  const c = clips[lang + ':' + id]; if (!c) return false;
  // A family line inherits its narration token; a direct preview replaces the current voice.
  if (my == null) { my = ++seq; activeSpeech.clear(); told(); }
  const observed=managementEvidence.begin('voice.result',{source:'family',language:lang});
  if (my !== seq) { observed({outcome:'cancelled'}); return Promise.resolve(); }
  stopPlayback();
  if (c.decoded) return playBuffer(c.decoded,1,'family',lang,observed);
  return decode(c.data).then(buf => { c.decoded = buf; if (my === seq) return playBuffer(buf,1,'family',lang,observed); observed({outcome:'cancelled'}); }).catch(() => { observed({outcome:'failed'}); });
}
// (a decoder that never answers falls back to the plain player after 5 s)
function decode(data) { const a = ac(); return a ? Promise.race([a.decodeAudioData(data.slice(0)), new Promise((_, no) => setTimeout(() => no(new Error('slow decode')), 5000))]) : Promise.reject(new Error('no audio')); }
// A plain audio player, primed by the first tap (audio.js), for when Web Audio is asleep on iPhone.
const SILENT = (() => { const b = new Uint8Array(46), v = new DataView(b.buffer), w = (o, t) => [...t].forEach((c, i) => { b[o + i] = c.charCodeAt(0); }); // a tiny silent WAV
  w(0, 'RIFF'); v.setUint32(4, 38, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, 2, true);
  return 'data:audio/wav;base64,' + btoa(String.fromCharCode(...b)); })();
let player = null, primed = false;
let cancelUrlPlayback = null;
let cancelBufferObservation:(()=>void)|null=null;
function stopPlayback() {
  cancelBufferObservation?.();cancelBufferObservation=null;
  const source = playing; playing = null;
  try { source?.stop(); } catch (e) { }
  if (cancelUrlPlayback) cancelUrlPlayback();
  try { player?.pause(); } catch (e) { }
}
unlockers.push(() => {
  if (primed) return;
  try {
    player = player || new Audio();
    if (player.src && player.src !== SILENT && !player.paused) { primed = true; return; }
    player.src = SILENT;
    const p = player.play();
    if (p) p.then(() => { primed = true; if (player.src === SILENT) player.pause(); }).catch(() => { });
  } catch (e) { }
});
function playUrl(url, rate = 1, language=settings.lang, observed=managementEvidence.begin('voice.result',{source:'recorded',language})) {
  player = player || (typeof Audio !== 'undefined' ? new Audio() : null);
  if (!player) { observed({outcome:'failed'}); return Promise.resolve(false); }
  if (cancelUrlPlayback) cancelUrlPlayback();
  // (owner, 13 Oct: some films did not start by themselves) a recording the phone never starts, or that stalls, used to
  // leave the line "speaking" for ever, so the story's page never turned: it gives up after 6 s without a start, and a
  // started one ends at its own length plus 1.5 s at the latest
  return new Promise(res => {
    let done = false, t0 = null, t1 = null;
    const end = (ok,outcome=ok?'success':'failed') => { if (done) return; done = true; observed({outcome}); clearTimeout(t0); clearTimeout(t1); if (cancelUrlPlayback === cancel) { cancelUrlPlayback = null; player.onended = player.onerror = player.onplaying = player.onloadedmetadata = null; } res(ok); };
    const cancel = () => { try { player.pause(); } catch (e) { } end(true,'cancelled'); };
    cancelUrlPlayback = cancel;
    t0 = setTimeout(() => { try { player.pause(); } catch (e) { } end(false); }, 6000);
    const applyRate = () => {
      try {
        player.defaultPlaybackRate = rate;
        player.playbackRate = rate;
        player.preservesPitch = player.mozPreservesPitch = player.webkitPreservesPitch = rate === 1;
      } catch (e) { }
    };
    try {
      player.pause(); player.src = url; applyRate();
      player.onloadedmetadata = applyRate;
      player.onended = () => end(true); player.onerror = () => end(false);
      player.onplaying = () => { applyRate(); clearTimeout(t0); const d = player.duration; t1 = setTimeout(() => end(true,'unknown'), ((isFinite(d) && d > 0 ? d / rate : 30) + 1.5) * 1000); };
      player.play().catch(() => end(false));
    } catch (e) { end(false); }
  });
}
// why the recorded voice did or did not play last time (Grown-ups shows it, to help find phone problems)
export const voiceDiag = { pack: 'loading', lastMiss: '', audio: '', recording: '' };
function playBuffer(buf, rate = 1, source='recorded', language=settings.lang, observed=managementEvidence.begin('voice.result',{source,language})) {
  const a = ac(); if (!a) { observed({outcome:'failed'}); return Promise.resolve(); }
  stopPlayback();
  const s = a.createBufferSource(); s.buffer = buf; s.playbackRate.value = rate; s.connect(a.destination);
  try { s.start(); } catch(error) { observed({outcome:'failed'}); throw error; } playing = s;
  return new Promise<void>(res => {
    let done=false;
    const finish=(outcome:string)=>{if(done)return;done=true;observed({outcome});if(cancelBufferObservation===cancel)cancelBufferObservation=null;res();};
    const cancel=()=>finish('cancelled');cancelBufferObservation=cancel;
    s.onended=()=>finish('success');
    // Keep the original watchdog resolution; lack of onended is an unknown observation.
    setTimeout(()=>finish('unknown'),buf.duration/rate*1000+400);
  });
}

// ---------- Offline voice pack (voices/, made with tools/make-voice-pack.mts) ----------
// Every line recorded once with a natural voice. Grandparents play a little slower and deeper, children a
// little higher; men use the man's voice when the pack has one.
let PACK = null;
export const voicePack = () => PACK;
// Lines asked for before the list has arrived (slow phone networks at start-up) wait for it, so they are spoken
// with the recorded voice too instead of the phone's own voice.
let packTried = false;
// Fetch after a click has applied the language choice, or after the valley is ready.
// Keyboard speech requests its index directly; pointerdown must not fetch the previous language.
let packReady = null;
const voiceIndex = createVoiceIndex(url => fetch(url), pack => { PACK = pack; voiceDiag.pack = 'ok'; autoSavePack(); }, async () => {
  try { const cached = await (await caches.open('sv-voices')).match('voices/manifest.json'); return cached ? await cached.json() : null; } catch (e) { return null; }
});
const loadPack = (langs = voiceLanguages(settings)) => {
  packReady = Promise.all(langs.map(lang => voiceIndex.load(lang).catch(() => {
    voiceDiag.pack = navigator.onLine === false ? 'offline' : 'missing';
    if (!PACK) packEmit({ state: 'nopack' });
  }))).finally(() => { packTried = true; });
  return packReady;
};
navigator.serviceWorker?.addEventListener('message', e => {
  if (e.data?.type === 'SV_VOICE_LANGUAGE_MANIFEST') voiceIndex.refresh(e.data.manifest);
});
addEventListener('click', () => loadPack(), { once: true, passive: true });
// Language/settings changes fetch only the newly selected index. Saved MP3s are kept.
for (const ev of ['LanguageChanged', 'SettingsChanged']) events.on(ev, () => { if (packReady) loadPack(); });
{ const t0 = Date.now(), wait = setInterval(() => { const g = window.__sv; if (packReady) return clearInterval(wait); if ((g && g.bootTimes) || Date.now() - t0 > 30000) { clearInterval(wait); setTimeout(() => { if (settings.voice || settings.autoPack !== false) loadPack(); }, 3000); } }, 500); }
const waitPack = async (langs = voiceLanguages(settings)) => {
  if (PACK && langs.every(l => voiceIndex.has(l))) return;
  let timer;
  try { await Promise.race([loadPack(langs), new Promise(r => { timer = setTimeout(r, 12000); })]); } finally { clearTimeout(timer); }
};
const packListeners = []; let packLast = null;
export const onPackProgress = f => { packListeners.push(f); if (packLast) try { f(packLast); } catch (x) { } }; // (a late listener hears where it is now)
const packEmit = e => { packLast = e; packListeners.forEach(f => { try { f(e); } catch (x) { } }); };
// (round R item 12) the downloading itself is in js/voicepack.js, loaded only when it starts (a few seconds after the
// first tap), so the files fetched before the title screen stay as small as they were (PERF-001)
let packMod = null;
const voicePackMod = () => packMod || (packMod = import('./voicepack.js'));
// the area the child is in (a place id from the event bus, never a position): its voices download first
let hereArea = null;
events.on('PlayerEnteredVillage', e => { const a = String(e && e.villageId || '').split(':')[1]; if (a) hereArea = a; });
let hanoiService: ReturnType<typeof import('./hanoi-pack.js').createHanoiPack> | null = null;
let hanoiLoading: Promise<NonNullable<typeof hanoiService>> | null = null;
const hanoiSelected=()=>settings.voiceViVariant==='leminh';
// (31 Oct 2026 AEDT) recordings waiting to be written into a bundle (js/voicestore.ts) are written when the page goes away
addEventListener('pagehide', () => { import('./voicestore.js').then(m => m.voiceStore('sv-voices').flush()).catch(() => { }); hanoiService?.flush?.().catch(() => { }); });
const hanoiPack=()=>hanoiLoading||(hanoiLoading=Promise.all([import('./hanoi-pack.js'),voicePackMod()]).then(([m,p])=>hanoiService=m.createHanoiPack({allowed:()=>hanoiSelected()&&(settings.packCell===true||p.packNet()==='wifi'),emit:packEmit})));
const resumeHanoi=()=>{if(hanoiSelected())void hanoiPack().then(p=>p.download()).catch(()=>{});};
let hanoiAutoScheduled=false;
function autoSavePack() {
  voicePackMod().then(m => m.startPack(PACK, packEmit, () => hereArea)).catch(() => { });
  if(hanoiSelected()&&!hanoiAutoScheduled){hanoiAutoScheduled=true;const ready=()=>{if(!hanoiSelected()){hanoiAutoScheduled=false;return;}if(!window.__sv?.bootTimes){setTimeout(ready,1000);return;}resumeHanoi();};setTimeout(ready,6000);}
}
addEventListener('online',resumeHanoi);
events.on('SettingsChanged',resumeHanoi);
try{navigator.connection?.addEventListener('change',resumeHanoi);}catch{}
export async function chooseVietnamesePack(choice:string){settings.voiceViVariant=choice==='leminh'?'leminh':'standard';saveSettings();resumeHanoi();}
export async function hanoiPackInfo(){const m=await(await hanoiPack()).load();return m?{bytes:m.bytes,lines:Object.keys(m.lines).length}:null;}
export async function downloadHanoiPack(){settings.voiceViVariant='leminh';settings.packCell=true;saveSettings();return(await hanoiPack()).download();}
export async function previewHanoiVoice(){
  ++previewRequest;previewSlot=null;hush();const my=seq,ticket={};activeSpeech.add(ticket);told();
  try{await waitPack(['vi']);return await playPack('vi','Xin chào! Chào mừng con đến Thung Lũng Lấp Lánh.',my,true);}
  finally{activeSpeech.delete(ticket);told();}
}

// a grown-up's answer to "download the rest on mobile data?" (js/packbar.js, Grown-ups)
export const allowMobilePack = yes => voicePackMod().then(m => {m.allowMobilePack(yes);if(yes)resumeHanoi();}).catch(() => { });
// an English line with Vietnamese words has its own recording with both voices (js/packhash.js lineHash); an older pack
// without it still plays its all-English recording
const packKey = (lang, text) => { if (!PACK) return null; const h = lineHash(lang, text); if (PACK.lines[h]) return h; const o = packHash(lang, text); return PACK.lines[o] ? o : null; };
let previewSlot = null, previewRequest = 0;
const packSlot = (lang, text) => {
  const has = PACK && PACK.lines[packKey(lang, text)];
  if (!has) return null;
  if (previewSlot && has.includes(previewSlot)) return previewSlot;
  const k = speakerKind();
  // Female recordings cover every character until a grown-up deliberately downloads male recordings.
  if (k && k.gender === 'm' && settings.voiceMale === true && has.includes('m')) return 'm';
  return has.includes('f') ? 'f' : has[0];
};
export async function previewPackVoice(slot) {
  const request = ++previewRequest;
  previewSlot = slot === 'm' ? 'm' : 'f';
  // say() is fire-and-forget; clearing the slot after it selected the female default
  // before the asynchronous manifest lookup could choose the requested recording.
  try { await sayAsync('Hello! Welcome to Sparkle Valley.', 'Xin chào! Chào mừng con đến Thung Lũng Lấp Lánh.'); }
  finally { if (request === previewRequest) previewSlot = null; }
}
// (round P, owner: "the 3 voice styles sound the same") the recordings play for almost every line, so the style changes
// them too: Cute a little higher and quicker, Grandparent lower and slower (playing faster or slower moves the pitch)
const STYLE_RATE = { natural: 1, cute: 1.22, grandpa: .82 };
const packRate = slot => { const k = speakerKind(), st = STYLE_RATE[settings.voiceStyle] || 1; if (!k) return st; let r = k.old ? .9 : k.kid ? 1.1 : 1; if (k.gender === 'm' && slot === 'f') r *= .86; return r * st; };
type MixedRecordingPart = { key: string; url: string; rate: number; pauseAfter: number; hanoi: boolean };

// Decode the whole plan before playing any part. A missing/corrupt fragment can therefore fall back to the
// existing complete recording without repeating the first half of a sentence or using device speech.
async function mixedRecording(text: string, my?: number): Promise<AudioBuffer | null> {
  if (!hanoiSelected() || previewSlot || !packSlot('en', text)) return null;
  const fragments = mixedVoiceFragments(text);
  if (!fragments?.length) return null;
  const context = ac();
  if (!context) return null;
  const active = () => hanoiSelected() && !previewSlot && (my === undefined || my === seq);
  const service = await hanoiPack(), plan: MixedRecordingPart[] = [];
  for (const fragment of fragments) {
    if (!active()) return null;
    if (fragment.lang === 'vi') {
      // Optional fragment IDs are reviewed public speech; they need no redundant default-Vietnamese recording.
      const url = await service.recording(lineHash('vi', fragment.text));
      if (!url) return null;
      plan.push({ key: 'fpt-leminh-v1|' + url, url, rate: STYLE_RATE[settings.voiceStyle] || 1, pauseAfter: fragment.pauseAfter, hanoi: true });
    } else {
      const slot = packSlot('en', fragment.text);
      if (!slot) return null;
      plan.push({ key: 'pack|' + slot + '|en|' + fragment.text, url: packUrl('en', fragment.text, slot), rate: packRate(slot), pauseAfter: fragment.pauseAfter, hanoi: false });
    }
  }
  const key = 'mixed-leminh|' + JSON.stringify(plan.map(part => [part.key, part.rate, part.pauseAfter]));
  const cached = mem.get(key);
  if (cached) return cached;
  const buffers: AudioBuffer[] = [];
  for (const part of plan) {
    if (!active()) return null;
    let buffer = mem.get(part.key) as AudioBuffer | undefined;
    if (!buffer) {
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 8000);
      try {
        const response = part.hanoi ? await service.audio(part.url, controller.signal) : await fetch(part.url, { signal: controller.signal });
        if (!response?.ok) return null;
        buffer = await decode(await response.arrayBuffer()) as AudioBuffer;
      } catch { return null; }
      finally { clearTimeout(timer); }
      mem.set(part.key, buffer);
      if (mem.size > 120) mem.delete(mem.keys().next().value);
    }
    buffers.push(buffer);
  }
  if (!active()) return null;
  // A single decoded source keeps cancellation and music ducking atomic across language switches. DecodeAudioData
  // resamples into this context; the explicit ratio also handles a cached recording with another sample rate.
  const frames = buffers.map((buffer, i) => Math.ceil(buffer.duration * context.sampleRate / plan[i].rate));
  const pauses = plan.map(part => Math.round(part.pauseAfter * context.sampleRate / 1000));
  const total = frames.reduce((sum, frames, i) => sum + frames + pauses[i], 0);
  const channels = Math.max(...buffers.map(buffer => buffer.numberOfChannels));
  const joined = context.createBuffer(channels, total, context.sampleRate);
  for (let channel = 0; channel < channels; channel++) {
    const output = joined.getChannelData(channel);
    let offset = 0;
    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i], input = buffer.getChannelData(Math.min(channel, buffer.numberOfChannels - 1));
      const ratio = buffer.sampleRate * plan[i].rate / context.sampleRate;
      for (let frame = 0; frame < frames[i]; frame++) {
        const position = Math.min(input.length - 1, frame * ratio), before = Math.floor(position), fraction = position - before;
        output[offset + frame] = input[before] + (input[Math.min(before + 1, input.length - 1)] - input[before]) * fraction;
      }
      offset += frames[i] + pauses[i];
    }
  }
  mem.set(key, joined);
  if (mem.size > 120) mem.delete(mem.keys().next().value);
  return joined;
}
export async function warmVoiceLine(en: string, vi?: string) {
  try {
    await waitPack();
    // Keep the complete recording warm as a fallback as well as the selected mixed-language recording.
    if (hanoiSelected() && !previewSlot) await mixedRecording(en);
    const pairs: [string, string][] = [['en', en]];
    if (vi) pairs.push(['vi', vi]);
    for (const [lang, text] of pairs) {
      const slot = packSlot(lang, text);
      if (!slot) continue;
      const hanoi=lang==='vi'&&hanoiSelected()?await(await hanoiPack()).recording(packKey(lang,text)||lineHash(lang,text)):null;
      const k = hanoi?'fpt-leminh-v1|'+hanoi:'pack|' + slot + '|' + lang + '|' + text;
      if (mem.has(k)) continue;
      const r = hanoi?await(await hanoiPack()).audio(hanoi):await fetch(packUrl(lang, text, slot));
      if (!r?.ok) continue;
      const buf = await decode(await r.arrayBuffer());
      mem.set(k, buf);
      if (mem.size > 120) mem.delete(mem.keys().next().value);
    }
  } catch (e) { }
}
// Download every file of the pack so it plays with no internet (Grown-ups → "Save voices for offline")
export async function resumePackDownload() {
  await waitPack();
  const m = await voicePackMod();
  if (PACK) m.startPack(PACK, packEmit, () => hereArea);
  m.refreshPack();
}
export async function savePackOffline(progress?: (done: number, total: number) => void) {
  settings.autoPack = true; saveSettings();
  await resumePackDownload();
  const standard=(await voicePackMod()).savePackOffline(progress);
  if(hanoiSelected()){const[n,h]=await Promise.all([standard,downloadHanoiPack()]);return n+h;}
  return standard;
}
export const packUrl = (lang, text, slot) => `voices/${lang}/${slot}/${packKey(lang, text) || lineHash(lang, text)}.mp3`;
async function playPack(lang, text, my, forceHanoi=false, skipHanoi=false) {
  if (my !== seq) return true;
  const slot = packSlot(lang, text); if (!slot) return false;
  if (lang === 'en' && !forceHanoi && !skipHanoi && hanoiSelected() && !previewSlot) {
    const recording = await mixedRecording(text, my);
    if (my !== seq) return true;
    if (recording) {
      const context = ac();
      if (context && context.state !== 'running' && !document.hidden) {
        try { await Promise.race([context.resume(), new Promise(resolve => setTimeout(resolve, 250))]); } catch { }
      }
      if (my !== seq) return true;
      if (context?.state === 'running') {
        voiceDiag.recording = 'Default English + FPT Neo · FPT.AI-VITs · leminh';
        voiceDiag.audio = 'running';
        await playBuffer(recording,1,'recorded',lang);
        return true;
      }
      // Until Web Audio is unlocked, retain the complete recording's existing HTML audio fallback.
    }
  }
  const hanoi=!skipHanoi&&lang==='vi'&&!previewSlot&&(forceHanoi||hanoiSelected())?await(await hanoiPack()).recording(packKey(lang,text)||lineHash(lang,text)):null;
  if(my!==seq)return true;
  if(forceHanoi&&!hanoi)return false;
  const observed=managementEvidence.begin('voice.result',{source:'recorded',language:lang});
  const fallback=()=>hanoi&&!forceHanoi?playPack(lang,text,my,false,true):false;
  voiceDiag.recording=hanoi?'FPT Neo · FPT.AI-VITs · leminh':'Default recorded voices';
  const k = hanoi?'fpt-leminh-v1|'+hanoi:'pack|' + slot + '|' + lang + '|' + text;
  const url = hanoi||packUrl(lang, text, slot), rate=hanoi?(STYLE_RATE[settings.voiceStyle]||1):packRate(slot), a = ac();
  const response=async(signal?:AbortSignal)=>hanoi?(await hanoiPack()).audio(hanoi,signal):fetch(url,signal?{signal}:undefined);
  const urlPlayback=async()=>{
    if(!hanoi)return playUrl(url,rate,lang,observed);
    const r=await response();if(!r){observed({outcome:'failed'});return false;}const blob=URL.createObjectURL(await r.blob());
    try{return await playUrl(blob,rate,lang,observed);}finally{URL.revokeObjectURL(blob);}
  };
  if (a && a.state !== 'running' && typeof document !== 'undefined' && !document.hidden) {
    try { await Promise.race([a.resume(), new Promise(r => setTimeout(r, 250))]); } catch (e) { }
  }
  // Web Audio asleep (iPhone before a tap took, or after a call): the plain player plays the same recording
  if (!a || a.state !== 'running') { voiceDiag.audio = a ? a.state : 'none'; if (await urlPlayback()) return true; voiceDiag.lastMiss = 'audio ' + voiceDiag.audio; return fallback(); }
  let buf = mem.get(k);
  if (!buf) {
    // (a slow phone network: the line is given up after 8 s, never waited for for ever)
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, tm = ctl && setTimeout(() => ctl.abort(), 8000);
    let data; try { const r = await response(ctl?.signal); if (!r?.ok) { voiceDiag.lastMiss = 'file ' + (r?.status||'unavailable');observed({outcome:'failed'}); return fallback(); } data = await r.arrayBuffer(); } catch (e) { voiceDiag.lastMiss = 'file slow';observed({outcome:my!==seq?'cancelled':'failed'}); return fallback(); } finally { clearTimeout(tm); }
    try { buf = await decode(data); } catch (e) { if (my !== seq) {observed({outcome:'cancelled'});return true;} voiceDiag.lastMiss = 'decode'; return urlPlayback(); }
    mem.set(k, buf); if (mem.size > 120) mem.delete(mem.keys().next().value);
  }
  if (my !== seq) { observed({outcome:'cancelled'}); return true; }
  if (a.state !== 'running') {
    try { await Promise.race([a.resume(), new Promise(r => setTimeout(r, 200))]); } catch (e) { }
    if (a.state !== 'running') return urlPlayback();
  }
  voiceDiag.audio = 'running'; await playBuffer(buf, rate,'recorded',lang,observed); return true;
}

// ---------- Recorded lines kept in memory ----------
// (round R privacy, 9 Oct, owner: "no voice keys on children's devices") voices are made in Studio only. The device
// never calls a speech service: a line with no recording uses the phone's own voice and is noted as missing for Studio.
const mem = new Map(); // pack file -> decoded AudioBuffer (most recent ~120 lines)
// (round R privacy, 9 Oct) the old natural-voice cache from a grown-up's own key is not needed any more (a no-op once gone)
try { if (window.indexedDB) indexedDB.deleteDatabase('sparkle-valley-tts'); } catch (e) { }

// Estimate how high or low a recorded voice is (average pitch in Hz) using autocorrelation.
export async function estimatePitch(blob) {
  try {
    const AC = new (window.AudioContext || window.webkitAudioContext)();
    const buf = await AC.decodeAudioData(await blob.arrayBuffer()); const d = buf.getChannelData(0), sr = buf.sampleRate, N = 2048, found = [];
    for (let s = 0; s + N < d.length; s += N) {
      let rms = 0; for (let i = 0; i < N; i++) rms += d[s + i] * d[s + i]; if (Math.sqrt(rms / N) < .02) continue;
      // find the strongest repeat after the correlation first dips below zero (skips the trivial short lags)
      let best = 0, bestLag = 0, dipped = false;
      for (let lag = Math.floor(sr / 500); lag < Math.floor(sr / 70); lag++) {
        let c = 0; for (let i = 0; i < N - lag; i++) c += d[s + i] * d[s + i + lag];
        if (!dipped) { if (c < 0) dipped = true; continue; }
        if (c > best) { best = c; bestLag = lag; }
      }
      if (bestLag) found.push(sr / bestLag);
    }
    AC.close && AC.close();
    if (!found.length) return null;
    found.sort((a, b) => a - b); return found[Math.floor(found.length / 2)];
  } catch (e) { return null; }
}
// Device voices sit around 200 Hz; move the speaking pitch towards the recorded voice.
export function pitchFromHz(hz) { return hz ? Math.max(.55, Math.min(1.5, Math.pow(hz / 200, .8))) : 1.08; }
