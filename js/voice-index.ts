// Independent language requests: a slow or refreshed index must not replace another language.
export const voiceLanguages = settings => settings.bilingual ? [settings.lang === 'vi' ? 'vi' : 'en', settings.lang === 'vi' ? 'en' : 'vi'] : [settings.lang === 'vi' ? 'vi' : 'en'];
export function createVoiceIndex(fetcher, changed, cachedLegacy = async () => null) {
  const loaded = new Map(), pending = new Map(), revisions = new Map();
  const valid = (lang, j) => j && j.lines && j.language === lang && !Array.isArray(j.lines);
  const publish = () => {
    const pack = { version: 2, lines: {}, other: {}, tpl: {}, cast: {}, voices: {}, signatures: {}, areas: 0 };
    for (const [lang, j] of loaded) {
      Object.assign(pack.lines, j.lines); Object.assign(pack.tpl, j.tpl); Object.assign(pack.cast, j.cast); Object.assign(pack.voices, j.voices);
      if (lang !== 'en') pack.other[lang] = Object.keys(j.lines).join(' ');
      pack.signatures[lang] = j.signature || `${j.version}:${j.made}:${Object.keys(j.lines).length}`;
      if (j.areas) pack.areas = j.areas;
    }
    // (v1.08b platform) Opus copies: only when every loaded language has them (tools/make-voice-opus.mts)
    (pack as any).formats = loaded.size && [...loaded.values()].every(j => Array.isArray(j.formats) && j.formats.includes('opus')) ? ['mp3', 'opus'] : ['mp3'];
    changed(pack);
  };
  const accept = (lang, j) => {
    if (!valid(lang, j)) return false;
    revisions.set(lang, (revisions.get(lang) || 0) + 1); loaded.set(lang, j); publish(); return true;
  };
  const load = lang => {
    if (!['en', 'vi', 'zh', 'hi'].includes(lang) || loaded.has(lang)) return Promise.resolve();
    if (pending.has(lang)) return pending.get(lang);
    const revision = revisions.get(lang) || 0;
    const p = fetcher(`voices/manifest-${lang}.json`).then(r => r.ok ? r.json() : null).catch(() => null).then(async j => {
      if (!valid(lang, j)) j = legacyLanguage(await cachedLegacy(), lang);
      return j;
    }).then(j => {
      if ((revisions.get(lang) || 0) !== revision) return;
      if (!valid(lang, j)) throw new Error(`Missing ${lang} voice index`);
      accept(lang, j);
    }).finally(() => pending.delete(lang));
    pending.set(lang, p); return p;
  };
  // Refresh only languages already requested by this page; other tabs may use another language.
  return { load, has: lang => loaded.has(lang), refresh: j => (loaded.has(j?.language) || pending.has(j?.language)) && accept(j.language, j) };
}

// Migration is cache-only: an older offline install may have the aggregate but no language indexes yet.
export function legacyLanguage(man, lang) {
  if (!man?.lines) return null;
  const other = new Map();
  for (const [L, hashes] of Object.entries(man.other || {})) for (const h of String(hashes).split(' ')) if (h) other.set(h, L);
  const lines = Object.fromEntries(Object.entries(man.lines).filter(([h]) => (man.langOf?.[h] || other.get(h) || 'en') === lang));
  return { ...man, language: lang, lines, other: lang === 'en' ? {} : { [lang]: Object.keys(lines).join(' ') }, tpl: { [lang]: man.tpl?.[lang] || [] } };
}
// (v1.08b platform, brief part 1) Opus (about half the size) when the pack has Opus copies and this browser plays it;
// MP3 otherwise. Chosen once on a device and kept (sv2_voiceFmt); a device that already keeps MP3 recordings stays on
// MP3 (js/voice.ts settleVoiceFormat), so nothing is downloaded twice.
const opusPlays = () => { try { return typeof Audio !== 'undefined' && !!new Audio().canPlayType('audio/ogg; codecs="opus"'); } catch (e) { return false; } };
// (v1.08c voices, offline levels) a level chosen in Grown-ups may move a device from MP3 to Opus: only when the pack has
// Opus copies and this browser plays them. Returns whether the device is on Opus now.
export const opusPossible = pack => !!(pack && Array.isArray(pack.formats) && pack.formats.includes('opus')) && opusPlays();
export function moveToOpus(pack) {
  const has = !!(pack && Array.isArray(pack.formats) && pack.formats.includes('opus'));
  if (!has || !opusPlays()) return false;
  try { localStorage.setItem('sv2_voiceFmt', 'opus'); } catch (e) { return false; }
  return true;
}
export function voiceFormatFor(pack) {
  const has = !!(pack && Array.isArray(pack.formats) && pack.formats.includes('opus'));
  let f = null; try { f = localStorage.getItem('sv2_voiceFmt'); } catch (e) { }
  if (!f && has) { f = opusPlays() ? 'opus' : 'mp3'; try { localStorage.setItem('sv2_voiceFmt', f); } catch (e) { } }
  return f === 'opus' && has ? 'opus' : 'mp3';
}
// Ignore unselected EN/VI indexes, but include an explicitly requested learning language in offline completion.
export function voicePackSignature(pack, languages) {
  if (!pack.signatures) return Object.keys(pack.lines).length + ':' + (pack.version || 1) + ':' + (pack.made || '');
  const wanted = [...languages, ...['zh', 'hi'].filter(lang => pack.signatures[lang])];
  return wanted.map(lang => lang + ':' + (pack.signatures[lang] || 'pending')).join('|');
}
