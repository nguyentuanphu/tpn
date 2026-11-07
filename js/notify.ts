// Push notifications for grown-ups, the game's side (v1.08 notifications, owner plan docs/plans/push-notifications.md).
//   · Grown-ups → Notifications: turn on (the browser asks, the device subscribes, its choices go to the website), a
//     switch for each kind, quiet hours, bedtime-story days, turn off. On an iPhone or iPad it first says to add the game
//     to the Home Screen (Web Push works only there, iOS 16.4 and later). While the website has no keys, or the device
//     cannot do Web Push, it says so and nothing can be turned on.
//   · The lines about the children (weekly summary, skill balance, game of the week, achievements) are written here, on
//     the device, into the cache "sv-notify"; the service worker reads them when a push arrives (sw.ts). They never go to
//     the website and never carry a child's name (all children together).
//   · A tap on a notification opens the game with ?open=<where> (or tells an open game): this opens the right screen.
// The rules (kinds, quiet hours, bundling, texts) are js/content/notify.ts.
import { T } from './i18n.js';
import { settings, saveSettings, profiles } from './state.js';
import { KINDS, cleanPrefs, BED_DAYS_MAX, type Prefs, type LocalLines, type Text, type KindId } from './content/notify.js';
import { weekSummary, aestDate } from './content/parents.js';
import { GAME_INFO, AREAS } from './content/activities.js';
import { GAMES } from './games/registry.js';
import { canStartGame } from './games/frame.js';
import { heldGame } from './content/secondset.js';
import { pic } from './art.js';
import { esc } from './util.js';

type PushState = { on?: boolean, prefs?: Partial<Prefs>, endpoint?: string, synced?: number, snap?: Snap };
type Snap = { week: string, words: number, shrines: number, played: Record<string, number> };
export const LOCAL_CACHE = 'sv-notify', LOCAL_FILE = '__sv-notify.json';
const st = (): PushState => { const s = settings as unknown as { push?: PushState }; if (!s.push || typeof s.push !== 'object') s.push = {}; return s.push; };
const tz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Sydney'; } catch { return 'Australia/Sydney'; } };
const testerId = () => { try { return (window.__sv && (window.__sv as unknown as { tester?: unknown }).tester && localStorage.getItem('sv2_playerid')) || ''; } catch { return ''; } };
export const prefsNow = (): Prefs => cleanPrefs({ ...(st().prefs || {}), tz: tz(), lang: settings.lang === 'vi' ? 'vi' : 'en', tester: testerId() || undefined });

// ---------- can this device do it? ----------
export const iosDevice = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
const standalone = () => ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true) || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
export const needsHomeScreen = () => iosDevice() && !standalone();
const canPush = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
let server: Promise<{ on: boolean, key?: string }> | null = null;
const serverState = () => server || (server = fetch('api/push', { cache: 'no-store' }).then(r => r.ok ? r.json() : { on: false }).catch(() => { server = null; return { on: false }; }));
const keyBytes = (k: string) => { const s = atob(k.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - k.length % 4) % 4)); return Uint8Array.from(s, c => c.charCodeAt(0)); };
const post = (body: unknown) => fetch('api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

async function subscription(): Promise<PushSubscription | null> { try { const reg = await navigator.serviceWorker.ready; return await reg.pushManager.getSubscription(); } catch { return null; } }
/** turn on: the browser's question, the subscription, the choices to the website */
export async function turnOn(): Promise<'on' | 'homescreen' | 'unsupported' | 'serveroff' | 'denied' | 'failed'> {
  if (needsHomeScreen()) return 'homescreen';
  if (!canPush()) return 'unsupported';
  const s = await serverState(); if (!s.on || !s.key) return 'serveroff';
  const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission().catch(() => 'denied');
  if (perm !== 'granted') return 'denied';
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(s.key) });
    const r = await post({ sub: sub.toJSON(), prefs: prefsNow() }); if (!r.ok) return 'failed';
    const p = st(); p.on = true; p.endpoint = sub.endpoint; p.synced = Date.now(); saveSettings();
    await writeLocalLines();
    return 'on';
  } catch { return 'failed'; }
}
export async function turnOff() {
  const sub = await subscription(), p = st();
  if (sub) { await post({ stop: sub.endpoint }).catch(() => { }); await sub.unsubscribe().catch(() => { }); }
  else if (p.endpoint) await post({ stop: p.endpoint }).catch(() => { });
  p.on = false; delete p.endpoint; saveSettings();
}
/** the choices changed (or the language or time zone): tell the website, when it is on */
export async function sync() {
  const p = st(); if (!p.on) return;
  const sub = await subscription(); if (!sub) return;
  const r = await post({ sub: sub.toJSON(), prefs: prefsNow() }).catch(() => null);
  if (r && r.ok) { p.synced = Date.now(); saveSettings(); }
}

// ---------- the lines about the children, written on this device ----------
const both = (f: () => string): Text => { const keep = settings.lang; try { settings.lang = 'en'; const en = f(); settings.lang = 'vi'; const vi = f(); return { en, vi }; } finally { settings.lang = keep; } };
const monday = () => { const d = aestDate(), t = Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)), wd = new Date(t).getUTCDay(); return new Date(t - ((wd + 6) % 7) * 864e5).toISOString().slice(0, 10); };
const totals = () => {
  const played: Record<string, number> = {}; let words = 0, shrines = 0;
  for (const p of profiles as { words?: object, shrines?: object, stats?: { played?: Record<string, number> } }[]) {
    words += Object.keys(p.words || {}).length; shrines += Object.keys(p.shrines || {}).length;
    for (const [id, n] of Object.entries((p.stats && p.stats.played) || {})) played[id] = (played[id] || 0) + (+n || 0);
  }
  return { words, shrines, played };
};
const areaName = (key: string) => { const a = AREAS.find(x => x.key === key); return a ? both(() => a.name()) : { en: key, vi: key }; };
/** what this week's lines say; `now` lets the checks fix the week */
export function localLines(): LocalLines {
  const p = st(), now = totals(), week = monday();
  if (!p.snap || p.snap.week !== week) { p.snap = { week, words: now.words, shrines: now.shrines, played: now.played }; saveSettings(); }
  const base = p.snap, out: LocalLines = {};
  // (5) the weekly summary: every child together, never a name
  let min = 0, games = 0, days = 0;
  for (const pr of profiles as { stats?: { days?: Record<string, { min: number, games: number }> } }[]) { const s = weekSummary((pr.stats && pr.stats.days) || {}); min += s.min; games += s.games; days = Math.max(days, s.days); }
  const words = Math.max(0, now.words - base.words);
  out.weekly = min ? { en: `This week: ${min} minutes of play on ${days} of 7 days, ${games} games, ${words} new words.`, vi: `Tuần này: ${min} phút chơi trong ${days}/7 ngày, ${games} trò chơi, ${words} từ mới.` }
    : { en: 'No play in the valley this week. It will be there when you are ready.', vi: 'Tuần này chưa chơi trong thung lũng. Thung lũng luôn chờ khi cả nhà sẵn sàng.' };
  // (6) skill balance: which areas the games this week were in
  const area: Record<string, number> = {}; let n = 0;
  for (const [id, c] of Object.entries(now.played)) { const d = c - (base.played[id] || 0), a = GAME_INFO[id] && GAME_INFO[id][0]; if (d > 0 && a) { area[a] = (area[a] || 0) + d; n += d; } }
  const top = Object.entries(area).sort((a, b) => b[1] - a[1])[0];
  if (top && n >= 4 && top[1] / n >= .6) {
    const tryKey = ['words', 'numbers', 'vietnam', 'music', 'art', 'animals'].find(k => !area[k] && AREAS.some(x => x.key === k)) || 'words';
    const a = areaName(top[0]), b = areaName(tryKey);
    out.balance = { en: `Lots of ${a.en} this week: try ${b.en} next.`, vi: `Tuần này chơi nhiều ${a.vi}: tuần tới thử ${b.vi} nhé.` };
  } else if (n) out.balance = { en: `A good mix this week: games in ${Object.keys(area).length} different areas.`, vi: `Tuần này chơi đa dạng: trò chơi ở ${Object.keys(area).length} khu khác nhau.` };
  // (4) game of the week: for the youngest child's age, one they have played least, a new pick each week
  const little = (profiles as { age?: string }[]).some(x => x.age !== 'big');
  const cand = Object.keys(GAME_INFO).filter(id => GAMES[id] && (!little || GAME_INFO[id][1] <= 3) && !heldGame(id) && canStartGame(id, profiles as never[]))
    .sort((a, b) => (now.played[a] || 0) - (now.played[b] || 0) || (a < b ? -1 : 1)).slice(0, 8);
  if (cand.length) {
    const id = cand[Math.floor(Date.parse(week) / (7 * 864e5)) % cand.length], g = GAMES[id] as { name?: () => string };
    const name = g.name ? both(() => g.name()) : { en: id, vi: id }, a = areaName(GAME_INFO[id][0]);
    out.gotw = { en: `Game of the week: ${name.en} (${a.en}). Try it together.`, vi: `Trò chơi của tuần: ${name.vi} (${a.vi}). Cùng chơi thử nhé.` }; out.gotwId = id;
  }
  // (7) achievements: new words and sparkle shrines this week
  const sh = Math.max(0, now.shrines - base.shrines);
  if (words >= 10 || sh) out.achieve = { en: `New this week: ${words} words${sh ? ` and ${sh} sparkle shrines lit` : ''}.`, vi: `Mới trong tuần: ${words} từ${sh ? ` và thắp sáng ${sh} đền lấp lánh` : ''}.` };
  return out;
}
/** keep this week's lines where the service worker can read them (only when notifications are on) */
export async function writeLocalLines() {
  if (!st().on || !('caches' in window)) return;
  try { const c = await caches.open(LOCAL_CACHE); await c.put(new URL(LOCAL_FILE, document.baseURI).href, new Response(JSON.stringify(localLines()), { headers: { 'Content-Type': 'application/json' } })); } catch { }
}

// ---------- a tap on a notification ----------
type Game = { heroes?: unknown[], paused?: boolean, playGame?: (i: number, id: string, from: string) => void, openGamesHub?: (i: number) => void, openPad?: (i: number, tab?: string) => void, mode?: string };
export function openFromNotification(G: Game, open: string, gameId = '') {
  const w = window as unknown as { __svNotifyOpened?: string[] }; (w.__svNotifyOpened = w.__svNotifyOpened || []).push(open);
  post({ opened: open }).catch(() => { });
  if (open === 'gotw' && gameId && GAMES[gameId] && canStartGame(gameId, profiles as never[]) && !heldGame(gameId)) return G.playGame && G.playGame(0, gameId, 'hub');
  if (open === 'festival' || open === 'event') return G.openPad && G.openPad(0, 'cal');
  if (open === 'weekly' || open === 'achieve') return import('./report.js').then(m => profiles[0] && m.openReport(profiles[0]));
  if (open === 'invite') return G.openPad && (G.mode === 'online' || G.mode === 'solo') && G.openPad(0, 'friend');
  if (open === 'tester' || open === 'home' || open === 'life') return;
  return G.openGamesHub && G.openGamesHub(0);
}
/** at start: write this week's lines, follow a tap that opened the game, listen for taps while it is open, keep the
 *  website's copy of the choices current (language, time zone) */
export function startNotify(G: Game) {
  const ready = (f: () => void) => { let n = 0; const t = setInterval(() => { if ((G.heroes && G.heroes.length && !document.querySelector('.title, .who')) || ++n > 240) { clearInterval(t); if (G.heroes && G.heroes.length) f(); } }, 500); };
  const u = new URL(location.href), open = u.searchParams.get('open');
  if (open) { const game = u.searchParams.get('game') || ''; u.searchParams.delete('open'); u.searchParams.delete('game'); history.replaceState(history.state, '', u.href); ready(() => openFromNotification(G, open, game)); }
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'SV_NOTIFY_OPEN') ready(() => openFromNotification(G, String(e.data.open || ''), String(e.data.game || ''))); });
  const p = st(); if (!p.on) return;
  writeLocalLines(); setInterval(writeLocalLines, 30 * 60e3);
  if (!p.synced || Date.now() - p.synced > 7 * 864e5) sync();
}

// ---------- Grown-ups → Notifications ----------
const DAYS: [string, string][] = [['Sun', 'CN'], ['Mon', 'T2'], ['Tue', 'T3'], ['Wed', 'T4'], ['Thu', 'T5'], ['Fri', 'T6'], ['Sat', 'T7']];
const hh = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export function notifyHTML(open: boolean) {
  const p = st(), pr = prefsNow(), isTester = !!testerId();
  const hours = (sel: number) => [...Array(24)].map((_, h) => `<option value="${h * 60}" ${h * 60 === sel ? 'selected' : ''}>${hh(h * 60)}</option>`).join('');
  return `<details class="gsec pushsec" data-sec="notify" ${open ? 'open' : ''}><summary><span class="gi">${pic('push:bell')}</span><b>${T('Notifications for grown-ups', 'Thông báo cho phụ huynh')}</b></summary><div class="gbody">
    <p class="note">${T('Short messages for you, never for your child: no child’s name, no “come back and play”, no streaks. With the usual choices: one on Saturday morning and one on Sunday evening.', 'Tin ngắn cho bạn, không bao giờ cho bé: không có tên bé, không giục “vào chơi đi”, không đếm chuỗi ngày. Với lựa chọn thường dùng: một tin sáng thứ Bảy và một tin tối Chủ nhật.')}</p>
    ${needsHomeScreen() ? `<div class="push-ios"><b>${pic('push:phone')} ${T('iPhone and iPad: add the game to the Home Screen first', 'iPhone và iPad: thêm trò chơi vào Màn hình chính trước')}</b><ol><li>${T('Open the game in Safari and tap the Share button.', 'Mở trò chơi trong Safari, bấm nút Chia sẻ.')}</li><li>${T('Choose “Add to Home Screen”.', 'Chọn “Thêm vào MH chính”.')}</li><li>${T('Open the game from its new icon, then turn notifications on here (iOS 16.4 or newer).', 'Mở trò chơi từ biểu tượng mới, rồi bật thông báo ở đây (iOS 16.4 trở lên).')}</li></ol></div>` : ''}
    <div class="push-state" id="gPushState"><p class="note">${p.on ? T('On for this device.', 'Đang bật trên máy này.') : T('Off for this device.', 'Đang tắt trên máy này.')}</p></div>
    <div class="push-btns"><button class="btn ${p.on ? 'ghost' : 'primary'} wide" id="gPushOn" data-on="${p.on ? 1 : 0}">${pic('push:bell')} ${p.on ? T('Turn notifications off', 'Tắt thông báo') : T('Turn notifications on', 'Bật thông báo')}</button></div>
    <h3>${T('What to send', 'Gửi những gì')}</h3>
    <div class="toggles push-kinds">${KINDS.filter(k => !k.testers || isTester).map(k => `<label class="tog"><input type="checkbox" data-pk="${k.id}" ${pr.kinds[k.id] ? 'checked' : ''}> <span><b>${esc(T(k.en, k.vi))}</b><small>${esc(T(k.hintEn, k.hintVi))}</small></span></label>`).join('')}</div>
    <h3>${T('Quiet hours', 'Giờ yên lặng')}</h3>
    <div class="push-quiet"><label>${T('From', 'Từ')} <select id="gPushFrom">${hours(pr.quiet.from)}</select></label><label>${T('to', 'đến')} <select id="gPushTo">${hours(pr.quiet.to)}</select></label></div>
    <label class="tog"><input type="checkbox" id="gPushSchool" ${pr.quiet.school ? 'checked' : ''}> ${T('Also quiet in school hours (Monday to Friday, 9:00 to 15:00)', 'Yên lặng cả giờ học (thứ Hai đến thứ Sáu, 9:00 đến 15:00)')}</label>
    <p class="note">${T(`Times are this device’s own: ${esc(pr.tz)}.`, `Giờ theo máy này: ${esc(pr.tz)}.`)}</p>
    <h3>${T('Bedtime story days (up to 2)', 'Ngày có truyện trước giờ ngủ (tối đa 2)')}</h3>
    <div class="seg pushdays">${DAYS.map((d, i) => `<button data-pd="${i}" class="${pr.bedDays.includes(i) ? 'on' : ''}" aria-pressed="${pr.bedDays.includes(i)}">${T(d[0], d[1])}</button>`).join('')}</div>
  </div></details>`;
}
export function bindNotify(card: Element, redraw: () => void, toast: (s: string) => void) {
  const sec = card.querySelector('.pushsec'); if (!sec) return;
  const p = st(), save = (f: (pr: Prefs) => void) => { const pr = prefsNow(); f(pr); p.prefs = { kinds: pr.kinds, quiet: pr.quiet, bedDays: pr.bedDays }; saveSettings(); sync(); };
  sec.querySelectorAll<HTMLInputElement>('[data-pk]').forEach(i => i.onchange = () => save(pr => { pr.kinds[i.dataset.pk as KindId] = i.checked; }));
  const from = sec.querySelector<HTMLSelectElement>('#gPushFrom'), to = sec.querySelector<HTMLSelectElement>('#gPushTo'), school = sec.querySelector<HTMLInputElement>('#gPushSchool');
  from.onchange = to.onchange = school.onchange = () => save(pr => { pr.quiet = { from: +from.value, to: +to.value, school: school.checked }; });
  sec.querySelectorAll<HTMLButtonElement>('[data-pd]').forEach(b => b.onclick = () => save(pr => {
    const d = +b.dataset.pd, has = pr.bedDays.includes(d);
    pr.bedDays = has ? pr.bedDays.filter(x => x !== d) : [...pr.bedDays, d].slice(-BED_DAYS_MAX);
    sec.querySelectorAll<HTMLButtonElement>('[data-pd]').forEach(x => { const on = pr.bedDays.includes(+x.dataset.pd); x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
  }));
  const state = sec.querySelector('#gPushState'), btn = sec.querySelector<HTMLButtonElement>('#gPushOn');
  const say = (en: string, vi: string) => { state.innerHTML = `<p class="note">${esc(T(en, vi))}</p>`; };
  if (!p.on) serverState().then(s => { if (!sec.isConnected) return; if (!canPush() && !needsHomeScreen()) { say('This browser cannot show notifications.', 'Trình duyệt này không hiện được thông báo.'); btn.disabled = true; } else if (!s.on) { say('Notifications are not switched on for the game’s website yet.', 'Trang web của trò chơi chưa bật thông báo.'); btn.disabled = true; } });
  btn.onclick = async () => {
    btn.disabled = true;
    if (p.on) { await turnOff(); toast(T('Notifications off.', 'Đã tắt thông báo.')); redraw(); return; }
    const r = await turnOn(); btn.disabled = false;
    if (r === 'on') { toast(T('Notifications on.', 'Đã bật thông báo.')); redraw(); return; }
    const msg: Record<string, [string, string]> = {
      homescreen: ['First add the game to the Home Screen (see above), then open it from there.', 'Hãy thêm trò chơi vào Màn hình chính (xem ở trên), rồi mở từ đó.'],
      unsupported: ['This browser cannot show notifications.', 'Trình duyệt này không hiện được thông báo.'],
      serveroff: ['Notifications are not switched on for the game’s website yet.', 'Trang web của trò chơi chưa bật thông báo.'],
      denied: ['Notifications are blocked for this game. Allow them in the browser’s or the device’s settings, then try again.', 'Thông báo đang bị chặn. Hãy cho phép trong cài đặt của trình duyệt hoặc của máy, rồi thử lại.'],
      failed: ['Could not turn on. Check the internet and try again.', 'Chưa bật được. Kiểm tra mạng rồi thử lại.'],
    };
    say(...msg[r]);
  };
}
