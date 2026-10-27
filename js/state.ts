// @ts-check
import type { Profile, Farm, Settings } from '../types/save.js';
// Settings, player profiles and saving. Everything lives in localStorage on this device;
// grown-ups can export/import a backup file to move progress between devices.
import { BUILD } from './build.js';
import { managementEvidence } from './core/events.js';
import { sortClothes } from './content/shop.js';
const KEY_SETTINGS = 'sv2_settings', KEY_PROFILES = 'sv2_profiles';

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  /** @returns {boolean | 'held'} true when saved; 'held' when a newer game tab has taken over (nothing is written,
   * and that is not a full storage); false when the browser's storage is full or blocked */
  set(k, v) { if (held) return 'held'; try { localStorage.setItem(k, JSON.stringify(v)); mirrorSoon(); return true; } catch (e) { mirrorSoon(); return false; } }
};

// ---------- keeping progress safe on this device ----------
// The game's own saves (localStorage) are never touched by game updates. To be extra safe they are also
// copied to two other places on the device (IndexedDB and the "sv-save" cache, which updates never delete),
// and the browser is asked to keep this site's storage for good (so it is not cleared when space is low or
// the game is not opened for a while). If the main save is ever missing, the copy is put back by itself.
const SNAP_DB = 'sparkle-valley-save', SNAP_CACHE = 'sv-save', SNAP_URL = './__sv-save.json';
// (r89.1, owner 23 Oct AEDT) the device's own random number (js/players.js) goes into the copy too, so a game brought
// back from its copy is the same device in Sparkle Studio, not a new one
const KEY_DEVICE = 'sv2_playerid', DEVICE_ID = /^[a-z0-9]{12}$/;
const deviceId = () => { try { const v = localStorage.getItem(KEY_DEVICE) || ''; return DEVICE_ID.test(v) ? v : ''; } catch (e) { return ''; } };
const snapshot = () => ({ app: 'sparkle-valley', v: 2, saved: Date.now(), settings: store.get(KEY_SETTINGS, {}), profiles: store.get(KEY_PROFILES, null), farm: store.get('sv2_farm', null), device: deviceId() });
const idb = (mode: IDBTransactionMode) => new Promise<IDBObjectStore>((res, rej) => { const r = indexedDB.open(SNAP_DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('snap'); r.onsuccess = () => res(r.result.transaction('snap', mode).objectStore('snap')); r.onerror = () => rej(r.error); });
// If the main save was missing and its copy could not be read in time, the copies are left alone for this
// session (new progress goes under "new-…"), so a fresh start never overwrites the only good copy.
let mirrorLocked = false;
async function writeMirror() {
  if (held) return;
  const snap = snapshot(); if (!Array.isArray(snap.profiles) || !snap.profiles.length) return;
  const text = JSON.stringify(snap), day = new Date().toISOString().slice(0, 10);
  try {
    const st = await idb('readwrite');
    if (mirrorLocked) { st.put(JSON.stringify(Object.assign(snap, { fresh: true })), 'new-' + day); return; }
    st.put(text, 'latest'); st.put(text, 'day-' + day);
    // keep the last 10 daily copies
    const q = st.getAllKeys(); q.onsuccess = () => q.result.filter(k => /^day-/.test(String(k))).sort().slice(0, -10).forEach(k => st.delete(k));
  } catch (e) { }
  if (mirrorLocked) return;
  try { if ('caches' in self) { const c = await caches.open(SNAP_CACHE); await c.put(SNAP_URL, new Response(text, { headers: { 'Content-Type': 'application/json' } })); } } catch (e) { }
}
let mirrorT = null;
// (owner point 10, 16 Oct AEDT) one tab plays at a time. A game opened in another tab or window takes over; this older
// tab then stops saving, because its copy of the children's progress is older and its saves (play minutes, the spot,
// leaving the page) wrote over what the new tab had done. It asks the child to play there or to pick this tab again.
let held = false;
/** @returns {boolean} true once a newer tab of the game has taken over */
export const heldByOtherTab = () => held;
// (third AI's review R1, 16 Oct AEDT) only the game page claims the tab (js/main.js calls this): Studio online and any
// other page of the site that loads this file for the game's words or areas must not stop a child's game, and neither
// does the hidden copy of the game Studio opens (index.html?studio=1) to read the valley's buildings
let claimed = false;
export function claimTab() {
  if (claimed || /[?&]studio=1/.test(location.search)) return; claimed = true;
  try {
    const tabs = new BroadcastChannel('sv-tabs'), me = Math.random().toString(36).slice(2);
    tabs.onmessage = e => { if (e.data?.claim && e.data.claim !== me && !held) { held = true; if (mirrorT) clearTimeout(mirrorT); mirrorT = null; dispatchEvent(new CustomEvent('sv-held')); } };
    tabs.postMessage({ claim: me }); (tabs as BroadcastChannel & { unref?: () => void }).unref?.(); // (Node: an open channel must not keep a check running)
  } catch (e) { }
}
// (at most 2.5 s after a change, with whatever is newest then: a timer that restarted on every save could be put
// off again and again by frequent saves, and the copy fell behind)
function mirrorSoon() { if (mirrorT || held) return; mirrorT = setTimeout(() => { mirrorT = null; writeMirror(); }, 2500); }
async function readMirror() {
  const all = [];
  // the latest copy and the daily ones (in case the latest is damaged)
  try { const st = await idb('readonly'); const list = await new Promise<string[]>(r => { const q = st.getAll(); q.onsuccess = () => r(q.result || []); q.onerror = () => r([]); }); for (const t of list) try { all.push(JSON.parse(t)); } catch (e) { } } catch (e) { }
  try { if ('caches' in self) { const c = await caches.open(SNAP_CACHE), r = await c.match(SNAP_URL); if (r) all.push(await r.json()); } } catch (e) { }
  return all.filter(x => x && x.app === 'sparkle-valley' && Array.isArray(x.profiles) && x.profiles.length).sort((a, b) => (+!!a.fresh - +!!b.fresh) || b.saved - a.saved)[0] || null;
}
export let restoredFromCopy = false;
try {
  // the main save is missing (cleared by the browser, or the storage was wiped): bring back the newest copy
  if (!localStorage.getItem(KEY_PROFILES)) {
    const late: { yes?: boolean } = {}, snap = await Promise.race([readMirror(), new Promise(r => setTimeout(() => { late.yes = true; r(null); }, 8000))]);
    if (late.yes) mirrorLocked = true;
    if (snap) {
      localStorage.setItem(KEY_PROFILES, JSON.stringify(snap.profiles));
      if (snap.farm) localStorage.setItem('sv2_farm', JSON.stringify(snap.farm));
      if (snap.settings && !localStorage.getItem(KEY_SETTINGS)) localStorage.setItem(KEY_SETTINGS, JSON.stringify(snap.settings));
      if (typeof snap.device === 'string' && DEVICE_ID.test(snap.device) && !deviceId()) localStorage.setItem(KEY_DEVICE, snap.device);
      restoredFromCopy = true;
    }
  }
} catch (e) { }
// ask the browser to keep this site's data permanently (Chrome/Edge/Android grant it for installed apps,
// Safari and Firefox may ask or decide by themselves)
export let storagePersisted = null;
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => p ? true : navigator.storage.persist()).then(p => { storagePersisted = p; }).catch(() => { }); } catch (e) { }
setTimeout(writeMirror, 4000);

export const settings: Settings = Object.assign({
  lang: 'en',            // 'en' | 'vi'
  currency: 'AUD',       // 'AUD' | 'VND', used only when curPinned (otherwise it follows the language: js/money.js curCode)
  curPinned: false,
  sound: true, music: true, voice: true,
  tapSounds: true,       // (feel and sound, owner 16 Oct AEDT) the soft sound when a button is pressed (js/feel.js)
  voiceEn: '', voiceVi: '',
  bilingual: false,      // speak the other language too, after a short pause
  twoView: 'auto',       // two players: 'face' (each half turned to its own end), 'side' (both one way), 'auto' = face on touch screens
  alwaysDay: false,
  screenFit: 'auto', // (owner, 13 Oct AEDT) 'auto': a Home Screen app fits the space it is given; 'fill': the whole screen; 'fit': always fit (js/main.js vh)
  quality: 'auto',       // 'auto' | 'low' | 'high' | 'max' (battery round: 'high' is Pretty at 60 frames a second, 'max' Pretty+ as fast as the screen)
  camSpeed: 1,
  camMode: 'easy',       // 'easy' = fixed high view (best for little ones) | 'free' = drag to look around
  reportNames: true,     // the children's first names in Studio's play report (round L; off: "child 1, child 2")
  countPlayers: true,    // say an anonymous hello to the game's website, so the family knows how many children play (js/players.js)
  familyVoice: true,     // play the grown-up's recordings when there are some
  familyPitch: 0,        // speaking pitch matched to the recordings (0 = not set)
  voiceRate: 1, voicePitch: 1,
  voiceControl: true,    // show the 🎤 "talk to the game" button where speech recognition exists
  aiKey: '',             // optional Anthropic API key so villagers can chat freely (grown-ups only)
  aiOn: false,
  online: false          // (round R privacy, 9 Oct) playing with friends online: off until a grown-up turns it on in Grown-ups (devices that played before start off too)
}, store.get(KEY_SETTINGS, {}));
// (round R privacy, 9 Oct, owner: "no voice keys on children's devices") voices are made in Studio only: an online voice
// key saved by an older version, and its engine and voice choices, are deleted from this device
const OLD_VOICE = ['tts', 'ttsKey', 'elevenVoice', 'googleVoiceEn', 'googleVoiceVi', 'azureRegion', 'azureVoiceEn', 'azureVoiceVi'];
const dropOldVoice = () => { let n = 0; for (const k of OLD_VOICE) if (k in settings) { delete settings[k]; n++; } return n; };
// (bug #32, owner 11 Oct) festival decorations are set in Sparkle Studio only: an old saved choice on this device is ignored
const dropOldFestival = () => { if (!('festival' in settings)) return 0; delete settings.festival; return 1; };
if (dropOldVoice() | dropOldFestival()) store.set(KEY_SETTINGS, settings);
// fewer moving effects: Calm mode, or the device's own "Reduce motion" setting (round I accessibility rule A11Y-001)
export const reduceMotion = () => !!settings.calm || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
export const saveSettings = () => store.set(KEY_SETTINGS, settings);

// Clothing: a style plus any colour. Dresses and shirt-and-shorts work for girls and boys alike.
export const STYLES = ['dress', 'shirt', 'aodai', 'tunic', 'overalls', 'hoodie'];
export const OUTFIT_COLORS = ['#ff5fa2', '#a66bff', '#3cc7e8', '#ffd23f', '#e8434a', '#5fd39a', '#ff9f43', '#3b6fe0', '#ffffff'];
export const HATS = ['none', 'crown', 'cap', 'bunny', 'flower', 'bow', 'nonla'];
export const BACKS = ['none', 'wings', 'cape'];
export const HAIR = ['#1d1412', '#3b2618', '#6b4226', '#c98b4a', '#e8c26a', '#a8432a'];
export const SKIN = ['#ffe3d1', '#f6c7a5', '#e0aa80', '#b47a55', '#7a4e33'];
export const HAIRSTYLES = ['buns', 'short', 'long', 'ponytail', 'spiky'];
export const GLIDERS = ['#e7c37a', '#ff7eb8', '#5fd3ff', '#8be07a', '#b48cff'];

// A child's profile (one per child on this device): types/save.d.ts
function newProfile(i: number): Profile {
  return {
    id: 'k' + Date.now().toString(36) + Math.floor(Math.random() * 1000),
    name: '',
    photo: null,
    age: 'little',           // 'little' (under 5: everything spoken, can't lose) or 'big' (5 to 8: harder, real opponents)
    difficulty: 'easy',      // 'easy' | 'medium' | 'hard'
    look: { style: i === 0 ? 'dress' : 'shirt', color: i === 0 ? '#ff5fa2' : '#3b6fe0', hat: i === 0 ? 'bow' : 'cap', back: i === 0 ? 'wings' : 'cape', hair: HAIR[0], hairStyle: i === 0 ? 'buns' : 'short', skin: SKIN[1], glider: 0 },
    created: Date.now()
  };
}
// p: a saved profile (any age of save)
export function normalizeProfile(p: Record<string, any>): Profile {
  const d = {
    hearts: 3, staminaMax: 1, orbs: 0, leafies: {}, shrines: {}, towers: {}, discovered: {},
    inv: { apple: 3, rice: 2 }, owned: { hats: ['none'], gliders: [0] },
    stickers: [], levels: {}, wins: {}, quests: {}, tales: {}, taleReads: {}, glider: false, album: [],
    pos: null, dishes: {}, stats: { games: 0, steps: 0 }
  };
  const o = Object.assign({} as Profile, d, p); // (filled in by the defaults and the save just below)
  if (!o.age) o.age = 'little';
  if (!['easy', 'medium', 'hard'].includes(o.difficulty)) o.difficulty = o.age === 'big' ? 'medium' : 'easy';
  // older saves stored a fixed outfit; turn it into style + colour
  const L = o.look = Object.assign({ style: 'shirt', color: '#3b6fe0', hat: 'none', back: 'none', hair: HAIR[0], hairStyle: 'short', skin: SKIN[1], glider: 0 }, p.look || {});
  if (L.outfit) { L.style = { tunic: 'tunic', aodai: 'aodai', dress: 'dress', overalls: 'overalls', hoodie: 'hoodie', sunny: 'dress' }[L.outfit] || 'shirt'; L.color = { tunic: '#3d7fd6', aodai: '#e8435a', dress: '#ff7eb8', overalls: '#5bbf6a', hoodie: '#9a6bff', sunny: '#ffb52e' }[L.outfit] || L.color; delete L.outfit; }
  for (const k of ['leafies', 'shrines', 'towers', 'discovered', 'inv', 'levels', 'wins', 'quests', 'dishes', 'stats', 'tales', 'taleReads']) o[k] = Object.assign({}, d[k], p[k] || {});
  o.owned = Object.assign({ hats: ['none'], gliders: [0] }, p.owned || {});
  if (!o.owned.hats.includes(o.look.hat)) o.owned.hats.push(o.look.hat);
  // (r79, owner 16 Oct: "boy wears boys clothes") clothes of the other set come off and are wrapped as gift boxes; things
  // that were for both sets become the child's own set's version (js/content/shop.js)
  sortClothes(o);
  if (!Array.isArray(o.stickers)) o.stickers = [];
  if (!Array.isArray(o.album)) o.album = [];
    // (r90, owner 23 Oct) migration: treat existing profile.tales[id] === true as 1 read
  for (const [tid, val] of Object.entries(o.tales)) {
    if (val && (o.taleReads[tid] == null || o.taleReads[tid] === 0)) o.taleReads[tid] = 1;
  }
  o.learn = normalizeLearn(p.learn); // (r79 learning, chat 2) what each child missed most, games that showed the hand
  return o;
}

export let profiles: Profile[] = store.get(KEY_PROFILES, null);
// (round P, owner: "remove the default characters and let a new user create their own") a new device starts with
// nobody: the Who's playing screen asks the child to make their own character first
if (!Array.isArray(profiles)) profiles = [];
profiles = profiles.map(normalizeProfile);

// ---------- the shared farm: coins, crops, animals, pets and daily jobs belong to everyone ----------
const KEY_FARM = 'sv2_farm';
export function newFarm(coins = 30) {
  return {
    coins,                       // money in "xu": 1 xu = 10c (AUD) = 2.000đ (VND)
    plots: Array.from({ length: 9 }, () => null),   // {crop, stage, wateredAt, growAt}
    seeds: { carrot: 99, strawberry: 2 },
    basket: {},                  // harvested and collected produce
    animals: [{ kind: 'chicken' }, { kind: 'cow' }], hay: 3, products: {}, lastProduce: Date.now(),
    pets: ['puppy'],
    jobs: { day: '', list: [] }, order: null
  };
}
export let farm: Farm = Object.assign(newFarm(), store.get(KEY_FARM, {}));
// carry over money from the first version of this build, where each child had a wallet
if (store.get(KEY_FARM, null) == null) { const w = profiles.reduce((a, p) => a + (p.wallet || 0), 0); if (w) farm.coins = w; }
export function resetFarm() { const keep = farm.coins; Object.assign(farm, newFarm(Math.min(keep, 30))); saveFarm(); }
export function saveFarm() { store.set(KEY_FARM, farm); }

let saveTimer = null;
export function saveProfiles(now = false) {
  clearTimeout(saveTimer);
  const go = () => {
    saveFarm();
    const saved = store.set(KEY_PROFILES, profiles);
    if (saved === true || saved === 'held') return;
    // Out of room: drop the oldest album photos and try again.
    for (const p of profiles) if (p.album.length) p.album.shift();
    store.set(KEY_PROFILES, profiles);
  };
  if (now) go(); else saveTimer = setTimeout(go, 800);
}
export const MAX_KIDS = 6;
/** @returns {Profile} */
export function addProfile() { const p = normalizeProfile(newProfile(profiles.length)); p.name = ''; profiles.push(p); return p; }
/** @param {string} id */
export function removeProfile(id) { const i = profiles.findIndex(p => p.id === id); if (i >= 0) profiles.splice(i, 1); saveProfiles(true); }

// Saving a backup opens the phone's share sheet when it can, so a grown-up can put the file straight
// into Google Drive or iCloud Drive ("Save to Files"). Otherwise the file is downloaded.
// Resolves to 'shared', 'downloaded' or 'cancelled'.
export async function exportBackup({ share = true } = {}) {
  const observed=managementEvidence.begin('backup.result',{operation:'export'});
  try {
  // Phones only allow some file types in the share sheet (not .json), so the backup is a plain .txt file.
  const name = 'sparkle-valley-backup-' + new Date().toISOString().slice(0, 10) + '.txt';
  // the lines this device had to say without a recording travel along, so Sparkle Studio can record them
  let voiceMissing = []; try { voiceMissing = JSON.parse(localStorage.getItem('sv2_voicemiss') || '[]'); } catch (e) { }
  // (audit, 9 Oct) keys and passwords stay on this device: a backup may be shared to a cloud drive
  const safe = Object.fromEntries(Object.entries(settings).filter(([k]) => !/key|pass|token|secret/i.test(k)));
  const text = JSON.stringify({ app: 'sparkle-valley', v: 2, saved: Date.now(), build: BUILD, settings: safe, profiles, farm, voiceMissing }, null, 1);
  const done = how => { settings.lastBackup = Date.now(); saveSettings(); return how; };
  if (share && navigator.canShare) {
    try {
      const file = new File([text], name, { type: 'text/plain' });
      if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); observed({outcome:'success',reasonCode:'none'}); return done('shared'); }
    } catch (e) { if (e && e.name === 'AbortError') {observed({outcome:'cancelled',reasonCode:'user_cancelled'});return 'cancelled';} }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  observed({outcome:'initiated',reasonCode:'none'}); return done('downloaded');
  } catch(error) {observed({outcome:'failed',reasonCode:'storage'});throw error;}
}
// Days since the last backup (Infinity if never).
export const backupAge = () => settings.lastBackup ? (Date.now() - settings.lastBackup) / 864e5 : Infinity;
export async function importBackup(file) {
  const observed=managementEvidence.begin('backup.result',{operation:'restore'});
  let reasonCode='invalid';
  try {
  const data = JSON.parse(await file.text());
  if (!data || data.app !== 'sparkle-valley' || !Array.isArray(data.profiles)) throw new Error('bad file');
  profiles.splice(0, profiles.length, ...data.profiles.map(normalizeProfile));
  Object.assign(settings, data.settings || {}); dropOldVoice(); dropOldFestival(); // (round R privacy, 9 Oct) an old backup brings no voice key back
  if (data.farm) Object.assign(farm, newFarm(), data.farm);
  const expected=JSON.parse(JSON.stringify({profiles,settings,farm}));reasonCode='storage';
  saveSettings(); saveProfiles(true);
  const confirmed=saveReadbackMatches(expected);observed({outcome:confirmed?'success':'failed',reasonCode:confirmed?'none':'storage'});
  } catch(error) {observed({outcome:'failed',reasonCode});throw error;}
}

// r79 learning (chat 2)
// (r79 learning, I2 and G2) a child's small learning record, from any age of save (stable data, owner rule on saves): what they missed most in
// each game, and which games already showed the hand. Anything odd is dropped, never the profile.
export function normalizeLearn(v) {
  const o = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const obj = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
  const miss = {}; for (const [g, m] of Object.entries(obj(o.miss))) { const row = {}; for (const [k, n] of Object.entries(obj(m))) if (Number.isFinite(+n) && +n > 0) row[k] = Math.min(9, Math.round(+n)); if (Object.keys(row).length) miss[g] = row; }
  const seen = {}; for (const [g, n] of Object.entries(obj(o.seen))) if (n) seen[g] = 1;
  return { v: 1, miss, seen };
}

export const getSnapshot = () => snapshot();

/** Confirms browser-local readback only; never reports save contents or an off-device backup. */
export function saveReadbackMatches(expected: {profiles?:unknown;settings?:unknown;farm?:unknown;device?:unknown}):boolean {
  try {const stored=snapshot();return ['profiles','settings','farm','device'].every(key=>!(key in expected)||JSON.stringify(stored[key])===JSON.stringify(expected[key]));}catch{return false;}
}
