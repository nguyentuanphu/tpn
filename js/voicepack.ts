import { voicePackSignature } from './voice-index.js';
// The voice pack downloading to the device (split from js/voice.js in round R item 12, so it is fetched only when the
// download starts, not before the title screen: PERF-001). js/voice.js starts it once the pack's list has arrived.
import { settings, saveSettings, profiles, autoPackOn } from './state.js';
import { events } from './core/events.js';
import { T } from './i18n.js';
import { featureOn } from './custom.js';
import { voiceStore, storeKey } from './voicestore.js';

let PACK = null, packEmit = e => { }, hereArea = () => null, packStarted = false;
let manualSave: Promise<number> | null = null;
const manualListeners = new Set<(done: number, total: number) => void>();
export const refreshPack = () => { checkPack().catch(() => { }); };
// Keep the pack on the device by itself: a few seconds after the game opens (every time it opens), the voice cache is
// checked against the list, and any file not there yet (first visit, a new pack, or a phone that cleared space) is
// downloaded quietly. A small bar shows it (js/packbar.js); every line then plays with the recorded voice, offline too.
// (round R item 12, owner 10 Oct: "wifi should automatically, ask user to allow download over mobile") only the
// languages this family's children hear are downloaded; a small core (the start, home, Làng Sen, the menus, the Simple
// screen, the commonest game lines) comes first on any connection, then on Wi-Fi the rest area by area (voices/areas.json,
// made by tools/make-voice-pack.mts): the place the child is in, the places they have been, games, stories, festivals,
// the other places. On mobile data a grown-up is asked first (press and hold); the answer is kept, and Grown-ups can
// change it. A line not downloaded yet still plays its recording from the internet (and is kept).
export function startPack(pack, emit, here) {
  const changed = PACK && PACK !== pack;
  PACK = pack; packEmit = emit; hereArea = here;
  if (changed) { areaRevision++; AREAS = null; areasTried = null; groupOfHash = null; }
  // (an address that can't keep files, like http://192.168.… on a phone: the voices still play, from the internet)
  if (!('caches' in window)) { setTimeout(() => packEmit({ state: 'nostore', total: packFiles().length }), 3000); return; }
  // (31 Oct 2026 AEDT) voices online unless the whole pack is kept here; recordings kept the old way still move into bundles
  if (!autoPackOn()) { valleyBuilt().then(() => voiceStore('sv-voices').migrate()).catch(() => { }); return; }
  if (packStarted) { if (changed) checkPack().catch(() => { }); return; }
  packStarted = true;
  setTimeout(() => { checkPack().catch(() => { }); }, 6000);
  let againT: ReturnType<typeof setTimeout> | 0 = 0; const again = () => { if (mayFetchRest()) close(); clearTimeout(againT); againT = setTimeout(() => checkPack().catch(() => { }), 1500); };
  addEventListener('online', again);
  try { const c = navigator.connection; if (c && c.addEventListener) c.addEventListener('change', again); } catch (e) { } // (onto Wi-Fi: the rest goes on)
  events.on('LanguageChanged', again); // (a new language, or both spoken: its core, then its areas)
  events.on('SettingsChanged', again);
}
// the languages this device's children hear: the game's language, and the other one too when both are spoken
export const packLangs = () => { const L = [settings.lang === 'vi' ? 'vi' : 'en']; if (settings.bilingual) L.push(L[0] === 'vi' ? 'en' : 'vi'); return L; };

// whether male voice recordings are enabled (off by default)
export const packMale = () => settings.voiceMale === true;
// 'wifi', 'mobile' or 'off'. iPhones, iPads and most computers can't tell: a computer counts as Wi-Fi (or a cable), a
// phone or tablet as mobile data, so a grown-up is asked once (owner, 10 Oct)
export function packNet() {
  if (navigator.onLine === false) return 'off';
  const c = navigator.connection, t = c && c.type;
  if (c && c.saveData) return 'mobile';
  if (t === 'wifi' || t === 'ethernet') return 'wifi';
  if (t === 'cellular' || t === 'wimax' || t === 'bluetooth') return 'mobile';
  let touch = false; try { touch = matchMedia('(pointer: coarse)').matches; } catch (e) { }
  return touch ? 'mobile' : 'wifi';
}
// may the rest (beyond the core) download now? On Wi-Fi yes; on mobile data only once a grown-up said yes
const mayFetchRest = () => packNet() === 'wifi' || settings.packCell === true;
// a grown-up's answer to "download the rest on mobile data?": yes (kept), or not now (asked again in a week)
export function allowMobilePack(yes) {
  if (yes) { settings.packCell = true; delete settings.packAskAt; } else { settings.packCell = false; settings.packAskAt = Date.now(); }
  saveSettings(); if (yes) checkPack().catch(() => { });
}
const askDue = () => settings.packCell !== true && (settings.packCell !== false || Date.now() - (settings.packAskAt || 0) > 7 * 864e5);
let AREAS = null, areasTried = null, areaRevision = 0;
const loadAreas = () => {
  if (areasTried) return areasTried;
  const revision = areaRevision;
  return areasTried = fetch('voices/areas.json').then(r => r.ok ? r.json() : null).then(j => {
    if (revision === areaRevision) AREAS = j && j.groups ? j : null;
  }).catch(() => { }).finally(() => { if (revision === areaRevision && !AREAS) areasTried = null; });
}; // (tried again next time if it failed)
let groupOfHash = null;
// which area each line downloads with; a line not listed (added later in Studio) goes with 'world'. With no areas list
// (an older pack) everything is the core, as before.
function groupOf(h) {
  if (!AREAS) return 'core';
  if (!groupOfHash) { groupOfHash = new Map(); for (const [g, hs] of Object.entries(AREAS.groups)) for (const x of String(hs).split(' ')) if (x) groupOfHash.set(x, g); }
  return groupOfHash.get(h) || 'world';
}
const NOT_PLACES = ['core', 'games', 'stories', 'festivals', 'world'];
// the order the areas download in: the core, where the child is, where the children have been, the games, stories and
// festivals, the other places, and last the lines that belong nowhere in particular
export function packOrder() {
  const all = AREAS ? Object.keys(AREAS.groups) : ['core'], out = [], add = g => { if (all.includes(g) && !out.includes(g)) out.push(g); };
  add('core'); const here = hereArea(); if (here) add(here);
  const seen = {}; for (const p of profiles || []) for (const k of Object.keys((p && p.visited) || {})) seen[k] = (seen[k] || 0) + 1;
  Object.keys(seen).sort((a, b) => seen[b] - seen[a]).forEach(add);
  ['games', 'stories', 'festivals'].forEach(add);
  all.filter(g => !NOT_PLACES.includes(g)).forEach(add); add('world'); all.forEach(add);
  return out;
}
let checking = false, recheck = false;
// (battery round, owner 12 Oct AEDT: "my phone gets very hot") the download is spread out: nothing while the valley is
// being built (the busiest seconds of a start), then 6 files at a time with a short rest between (longer once the small
// core is in), so the phone's radio and processor are never kept flat out
const PACK_REST = { core: 150, rest: 400 };
const valleyBuilt = async () => { for (let i = 0; i < 240 && !(window.__sv && window.__sv.bootTimes); i++) await new Promise(r => setTimeout(r, 500)); };
const rest = ms => new Promise(r => setTimeout(r, ms));
async function checkPack() {
  if (!PACK) return;
  if (manualSave) { recheck = true; return; }
  if (checking) { recheck = true; return; }
  checking = true; recheck = false;
  if (mayFetchRest()) close();
  const manifest = PACK, langs = packLangs(), languageChanged = () => manifest !== PACK || langs.join() !== packLangs().join();
  try {
    await valleyBuilt();
    if (PACK.signatures && langs.some(L => !PACK.signatures[L])) return; // Wait for every selected index before marking it saved.
    // (31 Oct 2026 AEDT) kept as a few big bundles (js/voicestore.ts); recordings kept the old way move into them first
    const store = voiceStore('sv-voices'); await store.migrate();
    // (round O, owner: "does it load the voice pack every time? it should be once, unless there are new voices") once
    // the whole pack is on the device, a start only looks at 16 files picked at random, says nothing and downloads
    // nothing; the full check (listing every file) runs only for a new pack, or when a file has gone missing
    const quick = async list => { const pick = list.length <= 64 ? list : Array.from({ length: 16 }, () => list[Math.floor(Math.random() * list.length)]); return (await Promise.all(pick.map(u => store.has(u)))).every(Boolean); };
    if (packIsSaved(langs) && await quick(packFiles(null, langs))) { packEmit({ state: 'ready', quiet: true, known: true, total: packFiles(null, langs).length }); return; }
    await loadAreas();
    // a pack made by area whose list could not be fetched (a bad connection): nothing is downloaded until it can be,
    // so a phone on mobile data never takes the whole pack by mistake
    if (PACK.areas && !AREAS) return;
    const order = packOrder(), core = packFiles(['core'], langs);
    // only the core is wanted for now (mobile data, no yes yet) and it is all here: nothing to show, maybe a question
    if (!mayFetchRest() && settings.packCore === packSig() + '|' + langs.join('') && await quick(core)) { packEmit({ state: 'ready', quiet: true, known: true, core: true, total: core.length }); askRest().catch(() => { }); return; }
    const have = await store.keys(), abs = u => storeKey(u);
    const missingOf = gs => packFiles(gs, langs).filter(u => !have.has(abs(u)));
    const want = mayFetchRest() ? order : ['core'];
    // (r63, owner: the bar showed 108 %) the files to fetch are fixed now: a language or setting changed while it runs
    // (both languages switched on, say) used to add files to an area's list that the total never counted
    const pending = new Set(missingOf(want));
    let total = pending.size, done = 0;
    const fullTotal = new Set(packFiles(want, langs)).size, savedBefore = fullTotal - total;
    const progress = () => ({ done, total, saved: savedBefore + done, fullTotal });
    if (!total) { if (languageChanged()) return; donePack(want, langs); packEmit({ state: 'ready', quiet: true, total: packFiles(want, langs).length, core: want.length === 1 }); if (want.length === 1) askRest().catch(() => { }); return; }
    if (navigator.onLine === false) { packEmit({ state: 'waiting', left: total }); return; }
    packEmit({ state: 'loading', ...progress() });
    // one area at a time, the next chosen again after each (the child may have walked somewhere new meanwhile)
    const left = new Set(want);
    while (left.size) {
      const g = packOrder().find(x => left.has(x)) || [...left][0]; left.delete(g);
      if (g !== 'core' && !mayFetchRest()) break; // (left the Wi-Fi: the rest waits)
      const miss = missingOf([g]).filter(u => pending.has(u));
      for (let i = 0; i < miss.length; i += 6) {
        if (manualSave) return; // the explicit job takes over after this batch
        if (languageChanged()) return; // finish only the current batch, then start the new selected language
        if (g !== 'core' && !mayFetchRest()) break;
        await Promise.all(miss.slice(i, i + 6).map(async u => { try { const r = await fetch(u); if (r.ok) { await store.add(u, await r.arrayBuffer()); have.add(abs(u)); pending.delete(u); done = Math.min(total, done + 1); } } catch (e) { } }));
        packEmit({ state: 'loading', ...progress(), area: g });
        if (offline()) { packEmit({ state: 'waiting', left: total - done }); return; } // goes on when the internet is back
        await rest(g === 'core' ? PACK_REST.core : PACK_REST.rest);
      }
      if (languageChanged()) return;
      await store.flush(); // (each area is written as it finishes)
      if (g === 'core' && !missingOf(['core']).length) settings.packCore = packSig() + '|' + langs.join('');
    }
    if (!missingOf(want).length) { donePack(want, langs); packEmit({ state: 'ready', core: want.length === 1 }); if (want.length === 1) askRest().catch(() => { }); }
    else if (!mayFetchRest() && !missingOf(['core']).length) { saveSettings(); packEmit({ state: 'ready', core: true }); askRest().catch(() => { }); }
    else packEmit({ state: 'waiting', left: missingOf(want).length });
  } finally {
    await voiceStore('sv-voices').flush().catch(() => { }); // (what came in so far is kept, whatever stopped the download)
    checking = false;
    // A language/connection/settings event during an in-flight request must not be lost.
    if (!manualSave && (recheck || languageChanged())) { recheck = false; setTimeout(() => checkPack().catch(() => { }), 0); }
  }
}
function donePack(want, langs) {
  if (want.length === 1) settings.packCore = packSig() + '|' + langs.join('');
  else { settings.packSaved = packSig(); settings.packLangs = langs.join(''); settings.packCore = packSig() + '|' + langs.join(''); }
  saveSettings();
}
// the whole pack is here for these languages (a device that saved it before round R item 12 kept every language)
const packIsSaved = langs => settings.packSaved === packSig() && (!settings.packLangs || langs.every(L => settings.packLangs.includes(L)));
// on mobile data with the core done: ask a grown-up about the rest (js/packbar.js shows the question)
async function askRest() {
  // (owner, 16 Oct) Studio can turn the question off: the rest of the voices then come on Wi-Fi only
  if (!featureOn('explain_voiceAsk', true)) return;
  if (mayFetchRest() || !askDue() || packNet() === 'off') return;
  const rest = packOrder().filter(g => g !== 'core'); if (!rest.length) return;
  // how much is still to come (a device that kept an older pack has most of it already)
  const all = packFiles(rest); if (!all.length) return;
  const have = await voiceStore('sv-voices').keys(), miss = all.filter(u => !have.has(storeKey(u))).length;
  if (!miss) return;
  let bytes = 0; for (const g of rest) for (const L of packLangs().concat(['zh', 'hi'])) bytes += (AREAS && AREAS.size && AREAS.size[g] && AREAS.size[g][L]) || 0;
  packEmit({ state: 'ask', mb: Math.max(1, Math.round(bytes * miss / all.length / 1048576)) });
}
const packSig = () => voicePackSignature(PACK, packLangs()) + (packMale() ? ':m' : '');
// the files of the pack in these areas (all areas when none are named), in the children's own languages (Chinese and
// Hindi only come with the places and games that speak them)
// (read fresh each time: the connection can drop while the pack downloads)
const offline = () => navigator.onLine === false;
function packFiles(groups?: string[], mine = packLangs()) {
  const urls = [], langs = ['en', 'vi', 'zh', 'hi'], want = groups && new Set(groups);
  // (round R) which language each line is in: `other` lists the lines that are not English, space-separated per
  // language (half the size of the old `langOf`, which named every line's language; older packs still have that)
  const other = new Map(); for (const [L, hs] of Object.entries(PACK.other || {})) for (const h of String(hs).split(' ')) if (h) other.set(h, L);
  const langOf = h => (PACK.langOf && PACK.langOf[h]) || other.get(h) || (PACK.other ? 'en' : null);
  const maleEnabled = packMale();
  for (const [h, slots] of Object.entries(PACK.lines)) {
    if (want && !want.has(groupOf(h))) continue;
    const L1 = langOf(h);
    for (const s of typeof slots === 'string' || Array.isArray(slots) ? slots : []) {
      // Skip male voice files if male voices are not enabled
      if (s === 'm' && !maleEnabled) continue;
      for (const L of L1 ? [L1] : langs) if (!(L === 'en' || L === 'vi') || mine.includes(L)) urls.push(`voices/${L}/${s}/${h}.mp3`);
    }
  }
  const first = 'voices/' + mine[0] + '/'; urls.sort((a, b) => b.startsWith(first) - a.startsWith(first));
  return urls;
}
// Download every file of the pack so it plays with no internet (Grown-ups → "Save voices for offline")
export async function savePackOffline(progress?: (done: number, total: number) => void) {
  if (progress) manualListeners.add(progress);
  if (!manualSave) manualSave = (async () => {
    // This task belongs to the voice service, never to a settings window. Reopening
    // the window joins the same job; closing/redrawing it cannot stop the work.
    while (checking) await rest(25);
    if (!PACK) return 0;
    const store = voiceStore('sv-voices'), urls = packFiles(); await store.migrate();
    let n = 0;
    const notify = () => {
      packEmit({state:'loading',done:n,total:urls.length,saved:n,fullTotal:urls.length});
      for (const f of manualListeners) try { f(n,urls.length); } catch (e) { }
    };
    notify();
    for (let i = 0; i < urls.length; i += 6) {
      await Promise.all(urls.slice(i, i + 6).map(async u => { if (await store.has(u)) { n++; return; } try { const r = await fetch(u); if (r.ok) { await store.add(u, await r.arrayBuffer()); n++; } } catch (e) { } }));
      notify();
      if (offline()) break;
      await rest(PACK_REST.core);
    }
    await store.flush();
    if (n === urls.length) packEmit({state:'ready',total:n});
    else packEmit({state:'waiting',left:urls.length-n});
    return n;
  })().finally(() => { manualSave = null; if (autoPackOn()) refreshPack(); });
  try { return await manualSave; }
  finally { if (progress) manualListeners.delete(progress); }
}

// (round R item 12, owner 10 Oct: "wifi should automatically, ask user to allow download over mobile") the core voices
// are on the device; on mobile data the rest waits for a grown-up: a small card asks, and Yes needs a press and hold so
// a little one can't say yes by accident. Not now asks again in a week; Grown-ups → voices can change it any time.
let card = null, cancelCardHold = () => { };
export function askCard(mb) {
  if (card || mayFetchRest() || packNet() === 'off') return;
  card = document.createElement('div'); card.className = 'packask'; card.setAttribute('role', 'dialog');
  // (owner, 16 Oct: explanations small; it had covered the goal card) low on the screen, above Jump and Run, and short
  card.style.cssText = 'position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 184px);transform:translateX(-50%);z-index:70;width:min(340px,calc(100% - 32px));box-sizing:border-box;padding:10px 12px;border-radius:16px;background:rgba(255,255,255,.96);box-shadow:0 6px 24px rgba(60,30,90,.25);color:#3a2a20;font:600 14px/1.35 var(--font);text-align:center';
  const p = document.createElement('p'); p.style.margin = '0 0 8px'; p.style.textAlign = 'center';
  p.textContent = T(`Download the other voices on mobile data? About ${mb} MB (Wi-Fi does it by itself).`, `Tải các giọng còn lại bằng dữ liệu di động? Khoảng ${mb} MB (có Wi-Fi sẽ tự tải).`);
  const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap';
  const btn = (text, bg) => { const b = document.createElement('button'); b.type = 'button'; b.style.cssText = `position:relative;overflow:hidden;min-height:48px;min-width:120px;flex:1 1 130px;padding:6px 12px;border:0;border-radius:12px;font:700 14px/1.2 var(--font);color:#fff;background:${bg};touch-action:none`; b.innerHTML = '<span style="position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(255,255,255,.35)"></span><span style="position:relative"></span>'; b.lastChild.textContent = text; return b; };
  const yes = btn(T('Grown-ups: hold for Yes', 'Người lớn: giữ để đồng ý'), 'var(--purple, #8a5cf6)'), no = btn(T('Not now', 'Để sau'), '#9a8aa8');
  const fill = yes.firstChild; let t: ReturnType<typeof setTimeout> | 0 = 0; if (!(fill instanceof HTMLElement)) return;
  const stop = () => { clearTimeout(t); fill.style.transition = 'none'; fill.style.width = '0'; };
  cancelCardHold = stop;
  yes.addEventListener('pointerdown', ev => { ev.preventDefault(); fill.style.transition = 'width 1.2s linear'; fill.style.width = '100%'; t = setTimeout(() => { close(); allowMobilePack(true); }, 1200); });
  for (const k of ['pointerup', 'pointerleave', 'pointercancel']) yes.addEventListener(k, stop);
  yes.addEventListener('contextmenu', ev => ev.preventDefault());
  no.onclick = () => { close(); allowMobilePack(false); };
  row.append(yes, no); card.append(p, row); document.body.appendChild(card);
}
const close = () => { if (card) { cancelCardHold(); cancelCardHold = () => { }; card.remove(); card = null; } };
