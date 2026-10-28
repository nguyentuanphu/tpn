// The family's own content pack, made with Sparkle Studio on the grown-up's computer (studio/): content/custom.json,
// published with the game. Read once at start (offline it comes from the saved copy). Everything in it is optional:
//   message  { en, vi }                  a note from the grown-ups, shown once a day when the children start playing
//   names    { id: { en, vi } }          default names for villagers (a name changed on the device still wins)
//   faces    { id: { photo, skin } }     default photo faces (photo = 'family:<name>', see below; a face set on the device wins)
//   tales    [ { id, flag, en, vi, pages: [[pictures, en, vi], …] } ]   the family's own stories (Stories shelf)
//   quiz     [ { q: [en, vi], pic, answers: [[en, vi], …], right } ]   the Family Quiz game (Learning shelf)
//   defaults { restMins }                a starting value for settings the device hasn't chosen yet
//   ads      { enabled, perDay, items }  the family's own ads (js/ads.js); nothing shows unless enabled is true
//   activities { id: { area, little, hide } }   the Simple screen's areas: move a game, open it to under-5s, hide it (js/content/activities.js)
//   music    [ { id, file, en, vi, tags } ]   the family's recordings (round N; file = 'content/music/….mp3'; tags: lullaby, tet, midautumn, christmas, diwali, ausday, vn, kids)
//   album    [ { id, photo, en, vi, place } ]   family photos that become postcards (js/familycards.js; photo = 'family:<name>')
//   missions [ { id, en, vi, who } ]   family missions written in Studio (round S; js/parents.js: the child sees them, a grown-up ticks ✓)
//   releases { id: { on, start, days, newDays } }   Sparkle Studio's Ra mắt (Releases) page (round R): see liveRule below
//   festivals { id: { on, date, buildup } }          Sparkle Studio's Festivals page (round R): see js/festivals.js
//   looks    { chi | jack | ruby: { style, color, hair, hairStyle, skin } }   Studio's Story characters page: how they look in
//                                         the lantern story's chapter 3 (js/content/chapter3sydney.js lookOf; missing keeps the usual)
//   plots    { <plot id>: { type, name: [en, vi], owner: { name, line: [en, vi] }, color } }   Studio's Memory Villages page: a
//                                         home the family remembers on a garden plot, by the plot's id (PLOTS in js/content/map.js,
//                                         or a spare plot sp_<city>_<n>); not built by the game yet (asked of World)
//   (r81) every section Studio's content pages save live (LIVE_SECTIONS below) may come from /api/live instead, and wins
//   features { id: true|false }           things in the valley switched on or off from Studio (owner, round R: kept in the game,
//                                         shown only when switched on). powerPoles: Phố Hai Quê's power poles and wires (off)
let data:Record<string,any> = {};
// (Analytics & Infra, 10 Oct) never more than a few seconds: a connection that never answers must not keep the game from
// starting (the service worker already answers with the saved copy after 1.5 s)
try {
  const ac = typeof AbortController === 'function' ? new AbortController() : null, t = ac && setTimeout(() => ac.abort(), 4000);
  const r = await fetch('content/custom.json', { cache: 'no-cache', signal: ac ? ac.signal : undefined });
  if (r.ok) data = await r.json();
  clearTimeout(t);
} catch (e) { /* offline and never saved, or no answer: no content pack */ }
/** @type {Record<string, any>} the family's content pack (content/custom.json), checked field by field where it is used */
export const CUSTOM:Record<string,any> = data && typeof data === 'object' ? data : {};
const LIVE_KEY = 'sv2_live', liveFns:Array<()=>void> = [];
let LIVE:Record<string,any> = {}; try { LIVE = JSON.parse(localStorage.getItem(LIVE_KEY) || '{}') || {}; } catch (e) { LIVE = {}; }
export const onLive = f => liveFns.push(f);
// The optional management client reads only the receipt metadata, never this public content body.
// This keeps a fetch that finishes before the game starts counting from losing its application evidence.
let lastManagementApplication = null;
export const managementApplication = () => lastManagementApplication;
// (r81, owner 17 Oct AEDT) the content pages are live too: LIVE.content's sections (Message, Missions, Quiz, Our stories,
// Villagers, Story characters, Memory Villages, Simple screen, Defaults, Ads settings, photo links) take the place of the
// same ones in content/custom.json, which stays the fallback for a section Studio never saved live. The copy kept on this
// device is used before any screen reads them; the website's answer replaces it as soon as it comes (screens that read
// once at start get it the next time the game opens; Message and Missions follow onLive).
export const LIVE_SECTIONS = ['message', 'missions', 'quiz', 'tales', 'names', 'genders', 'faces', 'looks', 'plots', 'activities', 'defaults', 'features', 'ads', 'album'];
const BASE = { ...CUSTOM };
const useContent = c => { for (const k of LIVE_SECTIONS) { const v = c && typeof c === 'object' ? c[k] : undefined; if (v && typeof v === 'object') CUSTOM[k] = v; else if (k in BASE) CUSTOM[k] = BASE[k]; else delete CUSTOM[k]; } };
useContent(LIVE.content);
const str = v => typeof v === 'string' ? v.slice(0, 600) : '';
// only well-formed pieces are used, so a hand-edited file can't break the game
export const customTales = () => (Array.isArray(CUSTOM.tales) ? CUSTOM.tales : []).filter(t => t && t.id && Array.isArray(t.pages) && t.pages.length)
  .map(t => ({ id: 'my_' + String(t.id).replace(/[^\w-]/g, '').slice(0, 30), flag: str(t.flag) || '💛', en: str(t.en) || 'Our story', vi: str(t.vi) || 'Truyện của nhà mình', pages: t.pages.filter(p => Array.isArray(p)).map(p => [str(p[0]) || '📖', str(p[1]), str(p[2]) || str(p[1])]) }));
export const customQuiz = () => (Array.isArray(CUSTOM.quiz) ? CUSTOM.quiz : []).filter(q => q && Array.isArray(q.q) && Array.isArray(q.answers) && q.answers.length >= 2 && q.right >= 0 && q.right < q.answers.length)
  .map(q => ({ q: [str(q.q[0]), str(q.q[1]) || str(q.q[0])], pic: str(q.pic), answers: q.answers.map(a => [str(a[0]), str(a[1]) || str(a[0])]), right: q.right | 0 }));
// ---------- family photos are family-only (owner, 9 Oct, round R privacy) ----------
// Photo faces and album photos are "family:<name>" (Sparkle Studio keeps them in the website's private store, never as
// public files). They are fetched from api/family/<name> with the family code a grown-up typed once on this device
// (Grown-ups → Children → Family photos; kept in its own place, never in a backup) and kept in the "sv-family" cache
// for offline days (the service worker never keeps them in the game's shared cache). With no code they are simply not
// shown: villagers keep their drawn faces and the postcards wait. A code the website no longer takes clears the copies.
// (Old packs that still name content/faces/… or content/album/… files keep working until Studio moves them.)
const FAMREF = /^family:([\w-]{24,64})$/, OLDFACE = /^content\/faces\/[\w.-]+\.(jpg|jpeg|png)$/, OLDALBUM = /^content\/album\/[\w.-]+\.jpg$/;
const FAM_KEY = 'sv2_familycode', FAM_CACHE = 'sv-family', famURL = new Map<string,string>(), famFns:Array<()=>void> = [];
export const familyCode = () => { try { return localStorage.getItem(FAM_KEY) || ''; } catch (e) { return ''; } };
export const onFamilyPhotos = f => famFns.push(f);
const photoOf = p => { const m = FAMREF.exec(p || ''); return m ? famURL.get(m[1]) || '' : p; };
export const familyRefs = () => { const out = new Set<string>(), add = p => { const m = FAMREF.exec(p || ''); if (m) out.add(m[1]); };
  for (const f of Object.values(CUSTOM.faces || {})) if(f&&typeof f==='object'&&'photo'in f)add(f.photo); for (const x of Array.isArray(CUSTOM.album) ? CUSTOM.album : []) add(x && x.photo); return [...out]; };
export const customAlbum = () => ([...(Array.isArray(CUSTOM.album) ? CUSTOM.album : []), ...Object.entries(ownFamilyPhotos()).filter(([id]) => id.startsWith('album_')).map(([id, p]) => ({ id, photo: p.image, en: 'Family photo', vi: 'Ảnh gia đình', place: 'home' }))]).filter(x => x && typeof x.photo === 'string' && (x.photo.startsWith('data:image/jpeg;base64,') || OLDALBUM.test(x.photo) || (FAMREF.test(x.photo) && photoOf(x.photo))))
  .slice(0, 60).map(x => ({ id: String(x.id || x.photo).replace(/[^\w-]/g, '').slice(0, 30) || 'photo', photo: photoOf(x.photo), en: str(x.en).slice(0, 120), vi: str(x.vi).slice(0, 120) || str(x.en).slice(0, 120), place: /^[a-z]{2,16}$/.test(x.place || '') ? x.place : 'home' }));
export const customName = id => { const n = CUSTOM.names && CUSTOM.names[id]; return n && typeof n === 'object' ? n : null; };
const ownFamilyPhotos = ():Record<string,{image?:string}> => { try { return { ...JSON.parse(localStorage.getItem('sv2_familyphotos') || '{}'), ...(globalThis.__svFamilyPhotos || {}) }; } catch { return {}; } };
if (typeof addEventListener === 'function') addEventListener('sv-family-photos', () => famFns.forEach(f => { try { f(); } catch {} }));
export const familyOwnFace = id => { const photo = ownFamilyPhotos()[id]?.image; return photo ? { photo } : null; };
export const customFace = id => { const own = ownFamilyPhotos()[id]; if (own?.image) return { photo: own.image }; const f = CUSTOM.faces && CUSTOM.faces[id]; if (!f || typeof f.photo !== 'string') return null; if (OLDFACE.test(f.photo)) return f; const u = FAMREF.test(f.photo) && photoOf(f.photo); return u ? { ...f, photo: u } : null; };
// the game itself (not Studio's pages that borrow its modules); the game run from SparkleStudio.exe (/studio/game/) asks
// the exe on the same computer, which needs no code
const inGame = typeof location !== 'undefined' && /^https?:/.test(location.protocol) && typeof document !== 'undefined' && document.title !== 'Sparkle Studio' && !/\/studio\/(?!game\/)/.test(location.pathname);
const fromExe = () => typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /\/studio\/game\//.test(location.pathname);
const famKey = n => new URL('__family/' + n, location.href).href; // (the cache's own key, never the api address)
const famCache = () => typeof caches !== 'undefined' ? caches.open(FAM_CACHE).catch(() => null) : Promise.resolve(null);
async function famFromCache(names) {
  const c = await famCache(); if (!c) return;
  for (const n of names) if (!famURL.has(n)) { const r = await c.match(famKey(n)).catch(() => null); if (r) famURL.set(n, URL.createObjectURL(await r.blob())); }
}
export async function clearFamilyPhotos() { famURL.forEach(u => URL.revokeObjectURL(u)); famURL.clear(); try { if (typeof caches !== 'undefined') await caches.delete(FAM_CACHE); } catch (e) { } famFns.forEach(f => { try { f(); } catch (e) { } }); }
// fetch what this device does not have yet: { ok, n, bad } (bad: the website did not take the code)
export async function refreshFamilyPhotos({ all = false } = {}) {
  const code = familyCode(), names = familyRefs(); if (!names.length) return { ok: true, n: 0 };
  if (!code && !fromExe()) return { ok: false, n: famURL.size, nocode: true };
  const c = await famCache(); let got = 0, bad = false;
  // one photo is always asked for (even when all are kept), so a code that was changed in Studio is noticed
  const want = names.filter(n => all || !famURL.has(n)), list = want.length ? want : names.slice(0, 1);
  for (const n of list) {
    let r; try { r = await fetch('api/family/' + n, { headers: code ? { 'x-family-code': code } : {}, cache: 'no-store' }); } catch (e) { break; } // offline: the kept copies stay
    if (r.status === 401 && code) { bad = true; break; }
    if (!r.ok || !/^image\//.test(r.headers.get('content-type') || '')) continue;
    const b = await r.blob(); if (c) await c.put(famKey(n), new Response(b, { headers: { 'Content-Type': b.type || 'image/jpeg' } })).catch(() => { });
    if (famURL.has(n)) URL.revokeObjectURL(famURL.get(n)); famURL.set(n, URL.createObjectURL(b)); got++;
  }
  if (bad) { await clearFamilyPhotos(); return { ok: false, n: 0, bad: true }; }
  if (got) famFns.forEach(f => { try { f(); } catch (e) { } });
  return { ok: true, n: names.filter(n => famURL.has(n)).length, of: names.length };
}
export async function setFamilyCode(code) {
  const c = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 40);
  try { if (c) localStorage.setItem(FAM_KEY, c); else localStorage.removeItem(FAM_KEY); } catch (e) { }
  if (!c) { await clearFamilyPhotos(); return { ok: true, n: 0, cleared: true }; }
  return refreshFamilyPhotos({ all: true });
}
export const familyPhotoCount = () => ({ have: familyRefs().filter(n => famURL.has(n)).length, of: familyRefs().length });
// at start: the kept copies at once (a moment at most), then the rest from the website without waiting
if (inGame && familyRefs().length && (familyCode() || fromExe())) {
  await Promise.race([famFromCache(familyRefs()), new Promise(r => setTimeout(r, 1500))]).catch(() => { });
  setTimeout(() => refreshFamilyPhotos().catch(() => { }), 2500);
}
// ---------- Releases, festivals and (r81) the content pages, live from the website (round R, owner: "instant, no deploy") ----------
// Sparkle Studio's Ra mắt (Releases) and Festivals pages save to the website (Netlify Blobs, /api/live). The game asks
// for them when it opens, without waiting (a slow or missing connection never delays the start), keeps a copy for
// offline days, and uses the copy straight away next time; festivals change as soon as the answer arrives.
// A release rule: { on: true|false, start: 'YYYY-MM-DD' (from this day), days: N (on for N days only), newDays: N (a
// "New" badge and a "New!" moment for N days) }. A rule from the website wins over one in content/custom.json.
// (Switching something off never takes away what a child already has: games played and places found stay theirs.)
// Reuse this already-needed request for the game's initial public festival snapshot.
// It remains asynchronous: missing live settings never hold up the title or world.
export const liveBoot:Promise<Record<string,any>|null>|null = typeof fetch === 'function' && typeof location !== 'undefined' && /^https?:/.test(location.protocol) && !/\/studio\//.test(location.pathname) && document.title !== 'Sparkle Studio'
 ? fetch('api/live', { cache: 'no-store' }).then(r => r.ok && /json/.test(r.headers.get('content-type') || '') ? r.json() : null).then(j => {
    if (!j || typeof j !== 'object' || Array.isArray(j)) return null; const was = JSON.stringify(LIVE), wasC = JSON.stringify(LIVE.content || null); LIVE = j; useContent(j.content);
    if (wasC !== JSON.stringify(j.content || null) && inGame && familyRefs().length && (familyCode() || fromExe())) refreshFamilyPhotos().catch(() => { });
    let kept = false;
    try { localStorage.setItem(LIVE_KEY, JSON.stringify(j)); kept = true; } catch (e) { }
    const m = j.management;
    if (m && typeof m.scopeKey === 'string' && /^(global|device:[a-z0-9]{12}|feature:[a-z0-9_-]{1,60})$/.test(m.scopeKey) && Number.isSafeInteger(m.revision) && m.revision > 0 && /^[0-9a-f]{64}$/.test(m.effectiveHash || '')) {
      const stamp = new Date().toISOString();
      lastManagementApplication = { scopeKey: m.scopeKey, revision: m.revision, effectiveHash: m.effectiveHash,
        fetchedAt: stamp, appliedAt: kept ? stamp : null, result: kept ? 'applied' : 'rejected', reasonCode: kept ? 'none' : 'storage_failure' };
      if (typeof dispatchEvent === 'function' && typeof CustomEvent === 'function') dispatchEvent(new CustomEvent('sv-management-config-applied', { detail: lastManagementApplication }));
    }
    if (JSON.stringify(j) !== was) liveFns.forEach(f => { try { f(); } catch (e) { } });
    return j;
  }).catch(() => null) : null;
const pick = (kind, id) => { const a = LIVE[kind] && LIVE[kind][id], b = CUSTOM[kind] && CUSTOM[kind][id]; return a && typeof a === 'object' ? a : b && typeof b === 'object' ? b : null; };
export const liveRule = id => pick('releases', id);
export const festivalRule = id => pick('festivals', id);
const DAY = 864e5, dayOf = s => { const d = new Date(String(s) + 'T00:00:00'); return isNaN(+d) ? null : d; };
// is a release on today? (def: what it is when Studio never set it)
// (owner, 12 Oct: tester reports) the releases a tester device sees early ("Tester preview"), set by js/tester.js
// (rollout, owner 13 Oct AEDT: "testers see each batch a week early") a tester device also sees a release whose start
// date is at most `early` days away, without anyone ticking it (js/tester.js passes 7; 0 on every other device)
let PEEKS = [], EARLY = 0; export const setPeeks = (list, early = 0) => { PEEKS = Array.isArray(list) ? list.slice() : []; EARLY = Math.max(0, +early || 0); };
export const isPeek = id => PEEKS.includes(id);
export function releaseOn(id, def = true, now = new Date()) {
  if (PEEKS.includes(id)) return true;
  const r = liveRule(id); if (!r) return def;
  if (r.on === false) return false;
  const st = r.start && dayOf(r.start);
  if (st && now < st) return EARLY > 0 && now >= new Date(+st - EARLY * DAY);
  if (st && r.days > 0 && now >= new Date(+st + r.days * DAY)) return false;
  return r.on === true ? true : def;
}
// a "New" badge: within newDays of its start (or of the day it was switched on)
export function releaseNew(id, now = new Date()) {
  const r = liveRule(id); if (!r || !(r.newDays > 0) || !releaseOn(id, true, now)) return false;
  const st = dayOf(r.start || r.since); return !!st && now >= st && now < new Date(+st + r.newDays * DAY);
}
// a valley thing switched on or off in Studio (a release rule, or CUSTOM.features), or its default when Studio never set it
export const featureOn = (id, def = true) => { if (id === 'wayfind') { const r = liveRule(id); return !!(r && r.controlVersion === 1 && r.on === true && releaseOn(id, false)); } if (liveRule(id)) return releaseOn(id, def); const f = CUSTOM.features; return f && typeof f[id] === 'boolean' ? f[id] : def; };

// ---------- Batch rollout (owner, 13 Oct AEDT; docs/cores/FEATURES.md "Batch calendar") ----------
// A future start date can retain access for children who already used a feature.
// An explicit owner Off wins over that retention (the owner-approved explicit-off policy, owner 14 Oct). Usage
// history stays on the profile so re-enabling does not erase earned progress.
const today = () => new Date().toISOString().slice(0, 10);
const tried = p => p && p.tried && typeof p.tried === 'object' ? p.tried : null;
export const hasTried = (p, id) => { const t = tried(p); return !!(t && t[id]); };
// remember that a child used a feature; true when this is the first time (the caller saves the profiles)
export function markTried(p, id) { if (!p || hasTried(p, id)) return false; p.tried = tried(p) || {}; p.tried[id] = today(); return true; }
// (the children playing now, set by js/main.js when a session starts: for lists that have no child at hand, the games)
let PLAYERS = []; export const setPlayers = list => { PLAYERS = Array.isArray(list) ? list.filter(Boolean) : []; };
export const keptOn = (id, profiles = PLAYERS, def = true) => {
  if (id === 'wayfind') return featureOn(id, false);
  const rule = liveRule(id);
  if (rule?.on === false || (!rule && CUSTOM.features?.[id] === false)) return false;
  return featureOn(id, def) || (profiles || []).some(p => hasTried(p, id));
};
// what a save from before the rollout already shows a child used (nothing recorded profile.tried then)
export const MONEY_GAMES = ['heodat', 'coinnote', 'needwant', 'cheaper', 'lixi', 'bahu', 'shoplist', 'waitgrow', 'shopkeep', 'barter'];
const some = o => !!(o && typeof o === 'object' && Object.keys(o).length);
const TRACES = {
  surprises: p => some(p.surprises && p.surprises.found),
  mysteryBox: p => !!(p.boxes && p.boxes.opened > 0),
  collectibles: p => some(p.collect),
  hoilang: p => !!(p.hoilang && Array.isArray(p.hoilang.prizes) && p.hoilang.prizes.length),
  story_ch3: p => !!(p.lanterns && p.lanterns.chapters && p.lanterns.chapters.ch3),
  story_yard: p => some(p.yard && p.yard.done),
  yardHands: p => some(p.yard && p.yard.done),
  companionGrow: p => !!(p.lanterns && p.lanterns.pet && p.lanterns.pet.feeds > 0),
  saveGoal: p => !!(p.lanterns && p.lanterns.pet && Array.isArray(p.lanterns.pet.hats) && p.lanterns.pet.hats.length),
  jobs: p => some(p.jobsDone),
  houseGuide: p => !!p.houseGuideSeen,
  owlGuide: p => Array.isArray(p.owlLessons) && p.owlLessons.length > 0,
  sellersRemember: p => some(p.regulars),
  priceTags: p => some(p.regulars),
  festHunt: p => some(p.hunt) || some(p.festBadges),
  readingTrial: p => Object.keys(p.levels || {}).concat(Object.keys(p.wins || {})).some(k => /^rd_/.test(k))
};
// once per profile (profile.triedFrom marks it done); true when something was added
export function triedFromSave(p) {
  if (!p || p.triedFrom) return false; p.triedFrom = today();
  for (const [id, f] of Object.entries(TRACES)) { try { if (f(p)) markTried(p, id); } catch (e) { } }
  for (const g of MONEY_GAMES) if ((p.levels && p.levels[g]) || (p.wins && p.wins[g])) markTried(p, 'money_' + g);   // (a money game played)
  return true;
}
