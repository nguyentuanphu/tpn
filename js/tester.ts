import { floatReportButton } from './tester-float.js';
// Tester reports on a tester device (owner, 12 Oct 2026 AEDT; brief docs/cores/tasks/tester-reports.md). Loaded only
// on the devices Studio's Releases page makes testers (switch `tester`, js/testergate.js); everywhere else nothing of it
// is downloaded. Once the tester accepts the agreement (shown once, both languages):
//   - the game reports by itself when something goes wrong (an error, a game or window that did not open or close, a
//     frozen or slow screen, a button off the screen, a line with no recording, a child stuck), each with a picture of
//     the screen, the last 30 seconds (taps, windows, where the child walked) and the device's details;
//   - the ladybird (level "ladybird"): tap = the screen is kept at that moment, then a kind, a spoken or typed note and
//     Send; long press = a quick report; a number = reports waiting to send; a tick = a problem you found is fixed;
//   - reports wait on the device while offline and send by themselves; the device asks how its reports are doing
//     (the fixed tick, the rewards in js/testerrewards.js), replays its fixed problems on a new version (the retest),
//     and on a new version runs the auto play check by itself at night or while charging, sending what it finds.
// PRIV-016: on a tester device that accepted, reports keep the players' names, ages and progress; nothing is sent
// before "I accept", and "Stop being a tester" (Settings) stops everything at once.
import { T, nm } from './i18n.js';
import { settings, profiles, farm } from './state.js';
import { BUILD, SHOWN } from './build.js';
import { el, esc } from './util.js';
import { pic } from './art.js';
import { modal, holdButton } from './popups.js';
import { say, voiceMisses } from './voice.js';
import { listen, canListen } from './listen.js';
import { setPeeks, liveRule } from './custom.js';
import { setProblemHook } from './players.js';
import { SFX } from './audio.js';
import * as C from './content/tester.js';
import { RELEASES } from './content/releases.js';
import { takeCopy, putCopyBack, hasCopy, dropCopy } from './keepcopy.js';
import { revertOf } from './content/autoplay.js';
import { easyName } from './content/devname.js';
import { unreachableControl, activeReportPanel, observeGameOpen, resizeDeliveryNotice, publicFixedVersion } from './tester-detection.js';
import { readReportQueue, persistReportQueue } from './report-outbox.js';

import type { SvMain } from './main.js';
import type { ReportEntry } from './report-outbox.js';
type Where = { area: string; place: string; game: string; window: string; x: number; z: number };
type Problem = { spoken?: boolean; k: string; title: string; status?: string; fixedIn?: string; n?: number; auto?: string; where?: Where };
type TesterStatus = { open?: Problem[]; mine?: Problem[]; retest?: Problem[]; reports?: number; helped?: number; peeks?: string[] };
type TesterGame = Pick<SvMain, 'heroes' | 'huds' | 'paused' | 'renderer' | 'regionOf'> & {
  playGame?: SvMain['playGame'] & { __tester?: boolean };
  tester?: TesterApi;
  autoplay?: { running(): boolean; attach?(body: HTMLElement, close: () => void): void; detach?(): void; stop?(): void; start?(items: unknown, speed: string): void; open?(): void };
  testerRewards?: { apply(status: TesterStatus): void; unmount(): void; corner(): void };
};
export type TesterApi = { level: string; openPanel: typeof openPanel; autoReport: typeof autoReport; refresh: typeof refresh; retest: typeof retest; nightly: typeof nightly; settings: typeof settingsRows; status(): TesterStatus | null; mountedAt(): number; unmount(): void };
type ReportPanel = HTMLElement & { close(): void; selectTab?(tab: string): void };
declare global {
  interface Window { __svTesterURL?: string }
  interface Navigator { deviceMemory?: number; getBattery?(): Promise<{ charging: boolean }> }
}
const sayLine = (pair: readonly string[]) => say(pair[0], pair[1]);

const KEY = { acc: 'sv2_tester', out: 'sv2_tester_out', st: 'sv2_tester_status', seen: 'sv2_tester_seen', ap: 'sv2_tester_ap', delivery: 'sv2_report_delivery', copy: 'sv2_tester_copy' };
const get = <V>(k: string, d: V): V => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const URL_ = () => window.__svTesterURL || 'api/tester';
const me = () => { try { return localStorage.getItem('sv2_playerid') || ''; } catch (e) { return ''; } };
const L = pair => T(pair[0], pair[1]);

let G: TesterGame | null = null, level = '', live = false;
const offs: (() => void)[] = [], log: [number, string, string][] = [], errors: string[] = [];
const want = new Set<(source: HTMLCanvasElement) => void>();
let lastGame = '', status: TesterStatus | null = get(KEY.st, null), panelOpening = false;
const sent = new Map(), counts = new Map(), reporting = new Map();
let automaticPicture = null;
// A detector scan can report several buttons. Share its composed-screen capture so
// cloning the interface for every report does not itself freeze play.
const autoShot = () => automaticPicture || (automaticPicture = shot().finally(() => { automaticPicture = null; }));

// ---------- what happened in the last 30 seconds ----------
const note = (k, s) => { const t = Date.now(); log.push([t, k, String(s || '').replace(/\s+/g, ' ').slice(0, 120)]); while (log.length && (t - log[0][0] > C.LIMITS.replay * 1000 || log.length > 400)) log.shift(); };
const labelOf = n => { const b = n && n.closest && n.closest('button, [role=button], a, .hcard, .sp-stop, .sp-catcard, .chip'); if (!b) return n && n.tagName ? n.tagName.toLowerCase() : ''; return (b.getAttribute('aria-label') || b.textContent || b.className || '').trim().slice(0, 40); };
const topWindow = () => { const w = [...document.querySelectorAll<HTMLElement>('.modal, .gl, .theatre, .storybook, .dialog')].filter(x => x.offsetParent || getComputedStyle(x).position === 'fixed').pop(); if (!w) return ''; const h = w.querySelector('h2, h3, .gl-title, .dname, b'); return (w.className.split(' ').slice(0, 2).join(' ') + (h ? ': ' + h.textContent.trim() : '')).slice(0, 80); };
const whereNow = () => { const h = G && G.heroes && G.heroes[0], open = document.querySelector('.gl'); return { area: String((G && G.regionOf && G.regionOf[0]) || 'valley'), place: '', game: open ? lastGame : '', window: topWindow(), x: h ? Math.round(h.pos.x) : 0, z: h ? Math.round(h.pos.z) : 0 }; };
const playersNow = () => (profiles || []).slice(0, 8).map(p => ({ name: nm(p.name || ''), age: p.age || '', coins: farm ? farm.coins : 0, stars: p.stars ? Object.keys(p.stars).length : 0, level: p.difficulty || '' }));
const osOf = (ua = navigator.userAgent) => /iPhone|iPod/.test(ua) ? 'iOS' : /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'iPadOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'macOS' : 'other';
const brOf = (ua = navigator.userAgent) => /Edg\//.test(ua) ? 'Edge' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /CriOS|Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'other';
let fpsNow = 0;
const devNow = () => ({ os: osOf(), br: brOf(), sc: `${innerWidth}x${innerHeight}`, lang: settings.lang, fps: Math.round(fpsNow), mem: navigator.deviceMemory || 0 });

// ---------- the picture of the screen ----------
// (the 3D view keeps no picture between frames, so it is copied right after the next frame is drawn; the window on top
// is written underneath as words)
function copyFrame(): HTMLCanvasElement {
  const src = G.renderer?.domElement, copy = document.createElement('canvas');
  if (src?.width && src.height) { copy.width = src.width; copy.height = src.height; try { copy.getContext('2d').drawImage(src, 0, 0); } catch { /* the context may be lost while a report opens */ } }
  return copy;
}
function framePicture<R>(capture: (source: HTMLCanvasElement) => Promise<R>, fallback: R): Promise<R> {
  return new Promise(resolve => {
    let done = false;
    const finish = (source: HTMLCanvasElement) => { if (done) return; done = true; want.delete(finish); clearTimeout(timer); capture(source).then(resolve, () => resolve(fallback)); };
    const timer = setTimeout(() => finish(copyFrame()), 1500);
    want.add(finish);
  });
}
const shot = (sceneOnly = false) => framePicture(async source => { const m = await import('./screencapture.js'); return m.captureScreen(source, { sceneOnly }); }, '');
const shotPair = () => framePicture(async source => {
  const m = await import('./screencapture.js');
  return { full: await m.captureScreen(source), scene: await m.captureScreen(source, { sceneOnly: true }) };
}, { full: '', scene: '' });

// ---------- sending ----------
const clientId = () => [...crypto.getRandomValues(new Uint8Array(16))].map(n => n.toString(16).padStart(2, '0')).join('');
let queueStorageError = false;
const queue = () => { let state;try {state=readReportQueue(localStorage.getItem(KEY.out));}catch {state={ok:false,rows:[]};}queueStorageError=!state.ok;const rows=state.rows;let changed=false;for(const row of rows)if(!row.clientId){row.clientId=clientId();changed=true;}if(changed&&!keep(rows))queueStorageError=true;return rows; };
function keep(list) { try {return persistReportQueue(localStorage,KEY.out,list).ok;}catch {return false;} }
function enqueue(r) { const q=queue();r.clientId ||= clientId();if(queueStorageError||q.length>=C.LIMITS.queue||!keep([...q,r])){toast(T('Could not save this report. Keep this window open and try again.', 'Chưa lưu được báo cáo này. Giữ cửa sổ này và thử lại nhé.'));return null;}delivery(r.clientId,{state:'queued'});paintCount();flush();return r.clientId; }
function delivery(id, result) { const all = get(KEY.delivery, {}); all[id] = { ...result, at: Date.now() }; const entries = Object.entries(all).slice(-120); put(KEY.delivery, Object.fromEntries(entries)); dispatchEvent(new CustomEvent('sv-report-delivery')); }
export const reportDelivery = id => get(KEY.delivery, {})[id] || { state: 'queued' };
export const reportingState = () => ({ enabled: live, queued: queue().length, sending: flushing });
export const retryReports = () => flush();
export async function sendAutoplayReport(rep) {
  if (!live) return { state: 'disabled', ids: [] };
  const ids = [];let failed=false;
  for (const d of rep.done || []) if (d.problems?.length) { const id = await autoReport('autoplay', `${d.name || d.key}: ${d.problems.join('; ')}`.slice(0, 200), { area: 'autoplay', place: '', game: d.g === 'games' ? d.key : '', window: d.g || '', x: 0, z: 0 }); if (id) ids.push(id);else failed=true; }
  return { state: failed?'storage-failed':ids.length ? 'queued' : 'no-problems', ids };
}
type FlushSummary = { state: 'disabled' | 'offline' | 'empty' | 'sent' | 'retry' | 'storage'; sent: number; queued: number };
const REPORT_TIMEOUT_MS = 15000;
const offline = () => navigator.onLine === false;
let flushing = false, flushJob: Promise<FlushSummary> | null = null;
let lastFlush: FlushSummary | null = null;
function flush(): Promise<FlushSummary> {
  if (flushJob) return flushJob;
  const result = (state: FlushSummary['state'], sent = 0): FlushSummary => ({ state, sent, queued: queue().length });
  if (!live || navigator.onLine === false) {
    lastFlush = result(live ? 'offline' : 'disabled');
    dispatchEvent(new Event('sv-report-queue'));
    return Promise.resolve(lastFlush);
  }
  const rows = queue();
  if (queueStorageError || !rows.length) {
    lastFlush = result(queueStorageError ? 'storage' : 'empty');
    dispatchEvent(new Event('sv-report-queue'));
    return Promise.resolve(lastFlush);
  }
  flushing = true;
  flushJob = Promise.resolve().then(async () => {
    let sent = 0;
    const attempted = new Set<string>();
    while (live && navigator.onLine !== false) {
      const r = queue().find(row => !attempted.has(row.clientId));
      if (!r) return result(sent ? 'sent' : 'empty', sent);
      attempted.add(r.clientId);
      delivery(r.clientId, { state: 'sending' });
      const abort = new AbortController(), timer = setTimeout(() => abort.abort(), REPORT_TIMEOUT_MS);
      try {
        const res = await fetch(URL_(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r), signal: abort.signal });
        if (!res.ok) {
          delivery(r.clientId, { state: 'retry', status: res.status });
          if ([400, 413].includes(res.status)) continue;
          return result('retry', sent);
        }
        const receipt: unknown = await res.json();
        if (!receipt || typeof receipt !== 'object' || !('ok' in receipt) || receipt.ok !== true || !('rid' in receipt) || typeof receipt.rid !== 'string' || !receipt.rid) {
          delivery(r.clientId, { state: 'retry' }); return result('retry', sent);
        }
        delivery(r.clientId, { state: 'sent', rid: receipt.rid, problem: 'k' in receipt && typeof receipt.k === 'string' ? receipt.k : '' });
        sent++;
        // Re-read after the receipt: reports queued during a request remain intact.
        const q = queue(), k = q.findIndex(x => x.clientId === r.clientId);
        if (k >= 0) { q.splice(k, 1); if (!keep(q)) return result('storage', sent); }
        paintCount();
      } catch {
        delivery(r.clientId, { state: 'retry' }); return result(offline() ? 'offline' : 'retry', sent);
      } finally { clearTimeout(timer); }
    }
    return result(live ? 'offline' : 'disabled', sent);
  }).then(result => {
    // A rejected individual report must stay visible even if later reports were sent.
    lastFlush = result.queued && (result.state === 'sent' || result.state === 'empty') ? { ...result, state: 'retry' } : result;
    if (result.sent) void refresh();
    return lastFlush;
  }).finally(() => { flushing = false; flushJob = null; paintCount(); dispatchEvent(new Event('sv-report-queue')); });
  dispatchEvent(new Event('sv-report-queue'));
  return flushJob;
}

const body = (kind, extra) => {
  const reporter = kind === 'auto' ? { type: 'auto' } : extra && extra.reporter ? extra.reporter : { type: 'unknown' };
  return { id: me(), b: BUILD, kind, where: whereNow(), errors: errors.slice(-C.LIMITS.errors), log: log.map(([t, k, s]) => [Math.round((t - Date.now()) / 100) / 10, k, s]), dev: devNow(), players: playersNow(), reporter, at: Date.now(), ...extra };
};

// the game reports by itself (the same thing at the same place once in 10 minutes, counted meanwhile)
// (more: extra fields; more.log, the auto play check's last steps, goes before the tester's own log)
export async function autoReport(kind: string, detail: string, where?: Where, more: Record<string, unknown> = {}) {
  if (!live) return; const w = where || whereNow(), k = C.keyOf(kind, detail, w.game || w.window || w.area);
  counts.set(k, (counts.get(k) || 0) + 1); const last = sent.get(k);
  if (last && Date.now() - last.at < C.LIMITS.sameAgain) return last.id;
  if (reporting.has(k)) return reporting.get(k);
  const n = counts.get(k); counts.set(k, 0); note('report', kind + ' ' + detail);
  const pending = (async () => {
    const b = body('auto', { auto: kind, detail: String(detail || '').slice(0, 200), where: w, shot: await autoShot(), count: n });
    if (Array.isArray(more.log)) b.log = more.log.concat(b.log).slice(-300);
    const id = enqueue(b); if (id) sent.set(k, { at: Date.now(), id }); else counts.set(k, n + (counts.get(k) || 0));
    return id;
  })();
  reporting.set(k, pending);
  try { return await pending; } finally { reporting.delete(k); }
}

// ---------- watching for problems ----------
function watch() {
  const on = (t: EventTarget, k: string, f: EventListener, o: boolean | AddEventListenerOptions = false) => { t.addEventListener(k, f, o); offs.push(() => t.removeEventListener(k, f, o)); };
  // errors in the game's own code
  const err = (msg: string, file = '', line: number | string = 0) => { if (resizeDeliveryNotice(String(msg || ''))) return; const f = String(file || '').split('/').pop().split('?')[0]; if (f && !/\.m?js$/.test(f)) return; const s = `${String(msg || 'error').slice(0, 120)} @ ${f || '?'}:${line || 0}`; errors.push(s); if (errors.length > C.LIMITS.errors) errors.shift(); note('error', s); autoReport('error', s); };
  on(window, 'error', (e: ErrorEvent) => err(e.message, e.filename, e.lineno));
  on(window, 'unhandledrejection', (e: PromiseRejectionEvent) => { const r = e.reason, m = /\/([\w.-]+\.m?js):(\d+)/.exec(String(r && r.stack || '')); err(r && r.message || String(r), m ? m[1] : 'promise.js', m ? m[2] : 0); });
  // taps, and windows that do not close
  on(document, 'pointerdown', (e: PointerEvent) => note('tap', `${labelOf(e.target)} @${Math.round(e.clientX)},${Math.round(e.clientY)}`), true);
  on(document, 'click', (e: MouseEvent) => {
    if (!(e.target instanceof Element)) return;
    const b = e.target.closest && e.target.closest('.x, .gl-x, [data-a=close], .close, #qDone'); if (!b) return;
    const box = b.closest<HTMLElement>('.modal, .gl, .theatre, .storybook'); if (!box) return; const what = labelOf(b) + ' ' + (box.className || '').split(' ').slice(0, 2).join(' ');
    setTimeout(() => { if (document.contains(box) && !box.classList.contains('out') && box.offsetParent !== null) autoReport('noclose', what); }, C.LIMITS.closeWait * 1000);
  }, true);
  // windows opening and closing
  const mo = new MutationObserver(list => { for (const r of list) { r.addedNodes.forEach(n => n instanceof Element && n.classList && /\b(modal|gl|theatre|storybook|dialog)\b/.test(n.className) && note('open', (n.className + ' ' + ((n.querySelector && n.querySelector('h2, .dname, .gl-title')) || {}).textContent).slice(0, 80))); r.removedNodes.forEach(n => n instanceof Element && n.classList && /\b(modal|gl|theatre|storybook)\b/.test(n.className) && note('close', n.className.slice(0, 40))); } });
  mo.observe(document.body, { childList: true }); offs.push(() => mo.disconnect());
  // games that do not open
  if (G.playGame && !G.playGame.__tester) {
    const pg = G.playGame, pending = new Set<() => void>();
    G.playGame = Object.assign(function (this: TesterGame, ...args: Parameters<NonNullable<TesterGame['playGame']>>) {
      const [i, id] = args;
      const requested = String(id || ''); lastGame = requested; note('game', requested);
      // The game rejects a second launch while another activity is open: not a failed open.
      const cancel = document.querySelector('.gl:not(.out)') ? null : observeGameOpen(requested, () => { if (live) autoReport('noopen', requested); }, {wait:C.LIMITS.openWait * 1000});
      if (cancel) pending.add(cancel);
      const timer = setTimeout(() => { if (cancel) pending.delete(cancel); }, C.LIMITS.openWait * 1000 + 10);
      try { return pg.apply(this, args); } catch (error) { cancel?.(); pending.delete(cancel); clearTimeout(timer); throw error; }
    }, { __tester:true });
    offs.push(() => { pending.forEach(cancel => cancel()); pending.clear(); G.playGame = pg; });
  }
  // a child stuck (js/players.js watchHero)
  setProblemHook((kind, key) => { if (kind === 'stuck') autoReport('stuck', key); }); offs.push(() => setProblemHook(null));
  // frames: frozen (no frame for 2 s while on screen) and slow (under 20 a second for 10 s)
  let lastF = performance.now(), frames = 0, since = performance.now(), raf = 0;
  // (#261, a 3.4 s freeze on Windows Chrome that a probe could not reproduce) each freeze report says why the frames
  // stopped: the game's own code running long (a long task), or the browser not drawing while the window was resized,
  // left or hidden. The report itself and how reports are grouped are unchanged.
  const longs = [], winAt = [];
  let po: PerformanceObserver | null = null;
  try { po = new PerformanceObserver(l => { for (const e of l.getEntries()) { longs.push([e.startTime, e.duration]); if (longs.length > 20) longs.shift(); } }); po.observe({ type: 'longtask' }); offs.push(() => po?.disconnect()); } catch (e) { }
  const windowEvents: [EventTarget, string][] = [[window, 'resize'], [window, 'blur'], [window, 'focus'], [document, 'visibilitychange']];
  for (const [t, k] of windowEvents) on(t, k, () => { winAt.push([performance.now(), k]); if (winAt.length > 20) winAt.shift(); });
  const why = (from, to) => {
    if (po && typeof po.takeRecords === 'function') {
      try { for (const e of po.takeRecords()) { longs.push([e.startTime, e.duration]); if (longs.length > 20) longs.shift(); } } catch { }
    }
    const ran = longs.filter(([a, d]) => a + d > from && a < to).reduce((m, [, d]) => Math.max(m, d), 0), seen = [...new Set(winAt.filter(([a]) => a > from - 500 && a < to).map(([, k]) => k))];
    return `longest script ${Math.round(ran)} ms; window: ${seen.join(', ') || 'no change'}; focus ${document.hasFocus() ? 'yes' : 'no'}`; };
  // (r90, #474 #487 #488: a "freeze" of 57 s with no script running while the share sheet or print window was up) a gap in
  // which the window lost the focus or went out of sight is the phone pausing the game, not the game stuck: not reported
  const away = (from: number, to: number) => winAt.some(([at, k]) => at > from - 500 && at < to && /blur|visibilitychange|pagehide|freeze/.test(k));
  const tick = t => { if (!live) return; const gap = t - lastF; if (gap > C.LIMITS.freeze * 1000 && document.visibilityState === 'visible' && performance.now() - mounted > 15000 && !away(lastF, t)) { note('freeze', why(lastF, t)); autoReport('freeze', `${(gap / 1000).toFixed(1)} s`); }
    lastF = t; frames++; if (t - since > C.LIMITS.slowFor * 1000) { fpsNow = frames * 1000 / (t - since); if (fpsNow < C.LIMITS.slowFps && document.visibilityState === 'visible' && performance.now() - mounted > 15000 && !away(since, t)) autoReport('slow', `${Math.round(fpsNow)} frames a second`); frames = 0; since = t; }
    raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick); offs.push(() => cancelAnimationFrame(raf));
  const resetFrames = () => { lastF=performance.now();since=performance.now();frames=0; };
  on(document, 'visibilitychange', resetFrames);
  on(window,'pagehide',resetFrames); on(window,'pageshow',resetFrames);
  on(document,'freeze',resetFrames); on(document,'resume',resetFrames);
  // every 5 s: a button off the screen, a line with no recording, where the child walked
  let misses = new Set(voiceMisses().map(m => m[0] + '|' + m[1])), lastPos = '';
  const every = setInterval(() => {
    const top = activeReportPanel(document);
    // (r90, #382-#399: "offscreen" on an iPhone 430x517) while a text field has the focus the phone's keyboard covers half
    // the screen and the window's buttons are out of sight only for that time: not a problem to report
    const typing = document.activeElement instanceof HTMLElement && document.activeElement.matches('input, textarea, select, [contenteditable="true"]');
    if (!typing) for (const b of document.querySelectorAll('.modal button, .hud button, .gl button, .dialog button')) {
      if (unreachableControl(b, top)) autoReport('offscreen', labelOf(b));
    }
    const now = voiceMisses(); for (const [lang, text] of now) { const k = lang + '|' + text; if (!misses.has(k)) { misses.add(k); autoReport('novoice', `${lang}: ${String(text).slice(0, 100)}`); } }
    const h = G.heroes && G.heroes[0]; if (h) { const p = `${(G.regionOf && G.regionOf[0]) || 'valley'} ${Math.round(h.pos.x)},${Math.round(h.pos.z)}`; if (p !== lastPos) { lastPos = p; note('walk', p); } }
  }, 5000); offs.push(() => clearInterval(every));
  on(window, 'online', () => flush());
  const fl = setInterval(() => flush(), 60e3); offs.push(() => clearInterval(fl));
}
let mounted = 0;

// ---------- the picture of the 3D view, right after a frame ----------
function hookRender() {
  const R = G.renderer; if (!R || R.render.__tester) return; const orig = R.render;
  let waitingForFrameEnd = false;
  R.render = Object.assign(function (this: NonNullable<TesterGame['renderer']>, ...a: Parameters<typeof orig>) {
    const out = orig.apply(this, a);
    // Portrait previews render offscreen; split-screen worlds need both passes.
    // Copy after the complete frame, before the browser clears its drawing buffer.
    if (want.size && R.getRenderTarget() === null && !waitingForFrameEnd) {
      waitingForFrameEnd = true;
      queueMicrotask(() => { waitingForFrameEnd = false; if (want.size) { const source = copyFrame(); for (const receive of [...want]) receive(source); } });
    }
    return out;
  }, { __tester: true });
  offs.push(() => { R.render = orig; });
}

// ---------- what is new to test (r90, owner 23 Oct AEDT) ----------
// "Any release or new game for tester should be shown as a list within the ladybug icon": the releases this device sees
// early (ticked in Studio, or starting within the 7 days testers see ahead) are listed at the top of the ladybird's
// panel, with Play for a game; a small dot on the ladybird while one is not seen yet. No pop-up at the start any more.
type NewsItem = { id: string, en: string, vi: string, game?: string, start?: string };
function testerNews(): NewsItem[] {
  const ids = new Set<string>([...((status && Array.isArray(status.peeks)) ? status.peeks : []), ...C.peeksOf(liveRule('tester'))]);
  const now = Date.now();
  for (const r of RELEASES) { const x = liveRule(r.id); const st = x && typeof x.start === 'string' ? new Date(x.start + 'T00:00:00').getTime() : NaN; if (st > now && st - now <= 7 * 864e5) ids.add(r.id); }
  return [...ids].map(id => RELEASES.find(r => r.id === id)).filter(r => !!r).map(r => { const x = liveRule(r.id); return { id: r.id, en: r.en, vi: r.vi, game: r.game, start: x && typeof x.start === 'string' ? x.start : undefined }; });
}
const NEWS_SEEN = 'sv2_tester_news';
const newsUnseen = () => { let seen: string[] = []; try { seen = JSON.parse(localStorage.getItem(NEWS_SEEN) || '[]'); } catch (e) { } return testerNews().filter(n => !seen.includes(n.id)).length; };
const markNewsSeen = () => { try { localStorage.setItem(NEWS_SEEN, JSON.stringify(testerNews().map(n => n.id))); } catch (e) { } paintCount(); };
function newsHTML() {
  const list = testerNews(); if (!list.length) return '';
  const when = (s?: string) => { if (!s) return T('to test now', 'thử ngay'); const d = new Date(s + 'T00:00:00'); return T(`for everyone from ${d.getDate()}/${d.getMonth() + 1}`, `mọi người có từ ${d.getDate()}/${d.getMonth() + 1}`); };
  return `<details class="tp-news" open><summary>${pic('🐞')} ${T(`New to test (${list.length})`, `Mới để thử (${list.length})`)}</summary><div class="tp-news-list">${list.map(n => `<div class="tp-news-row"><span><b>${esc(T(n.en, n.vi))}</b><small>${when(n.start)}</small></span>${n.game ? `<button class="btn" data-try="${esc(n.game)}">${T('Play', 'Chơi')}</button>` : ''}</div>`).join('')}</div></details>`;
}

// ---------- the ladybird and the tester mark ----------
const paintCount = () => { dispatchEvent(new Event('sv-report-queue')); const n = queue().length, fixed = fixedToSee().length, fresh = newsUnseen(); document.querySelectorAll('.z-lb').forEach(b => { b.querySelector<HTMLElement>('.lb-n').textContent = n ? String(n) : ''; b.querySelector<HTMLElement>('.lb-n').hidden = !n; const ok = b.querySelector<HTMLElement>('.lb-ok'); ok.hidden = !fixed; if (fixed) ok.textContent = String(fixed); const nw = b.querySelector<HTMLElement>('.lb-new'); if (nw) nw.hidden = !fresh; }); };
const fixedToSee = () => { const seen = get(KEY.seen, {}); return ((status && status.mine) || []).filter(p => ['fixed', 'confirmed'].includes(p.status) && !seen[p.k]); };
function addUI() {
  const floatingSeats = new Set<number>();
  // (each player's HUD gets the mark under its clock and, at the ladybird level, the ladybird with the zoom buttons; also
  // the HUDs made after this: the game starts after the title screen)
  const ensure = () => (G.huds || []).forEach((hud, i) => {
    const ck = hud.q && hud.q('.zoom'); if (ck && !ck.querySelector('.testermark')) { const mk = el('span', 'testermark', `${pic('🐞')}<span>${T('Tester', 'Người thử')} · ${SHOWN}</span>`); mk.setAttribute('aria-hidden', 'true'); ck.appendChild(mk); offs.push(() => mk.remove()); }
    if (level !== 'ladybird') return;
    const z = hud.q && hud.q('.zoomer'); if (!z || floatingSeats.has(i)) return;
    const b = el('button', 'z-lb', `${pic('🐞')}<i class="lb-n" hidden></i><i class="lb-ok" hidden>✓</i><i class="lb-new" hidden></i><kbd class="kb">L</kbd>`); b.setAttribute('aria-label', T('Report a problem (hold: quick report)', 'Báo lỗi (giữ: báo nhanh)'));
    floatingSeats.add(i);
    offs.push(floatReportButton(b as HTMLButtonElement, z, i, signal => { void openPanel(i, fixedToSee().length ? 'fixed' : 'tester', signal); }, () => { void quickReport('quick'); })); paintCount();
  });
  ensure(); const ev = setInterval(ensure, 1000); offs.push(() => clearInterval(ev));
  const key = e => { if ((e.key === 'l' || e.key === 'L') && !e.target.closest('input, textarea') && !document.querySelector<ReportPanel>('.modal.tpanel')) openPanel(0); };
  addEventListener('keydown', key); offs.push(() => removeEventListener('keydown', key));
  paintCount();
}
export async function quickReport(detail: string = 'quick'): Promise<void> {
  SFX.tap && SFX.tap();
  const hero = G?.heroes?.[0];
  const activePlayerName = hero?.profile?.name ? nm(hero.profile.name) : '';
  const reporterAttribution = activePlayerName ? { type: 'player', name: activePlayerName } : { type: 'unknown' };
  const snapshot = body('broken', { note: T('Quick report: something was wrong just now', 'Báo nhanh: vừa có gì đó không ổn'), detail, reporter: reporterAttribution });
  const s = await shot();
  enqueue({ ...snapshot, shot: s });
  toast(L(C.TESTER_LINES.waiting));
}
function toast(s) { const t = el('div', 'testertoast', esc(s)); document.body.appendChild(t); setTimeout(() => t.classList.add('out'), 2200); setTimeout(() => t.remove(), 2600); }

function bindReportViewport(panel: HTMLElement) {
  const viewport = visualViewport;
  const sync = () => {
    panel.style.setProperty('--report-height', `${viewport?.height || innerHeight}px`);
    panel.style.setProperty('--report-width', `${viewport?.width || innerWidth}px`);
    panel.style.setProperty('--report-left', `${viewport?.offsetLeft || 0}px`);
    panel.style.setProperty('--report-top', `${viewport?.offsetTop || 0}px`);
  };
  sync(); addEventListener('resize', sync); viewport?.addEventListener('resize', sync); viewport?.addEventListener('scroll', sync);
  const observer = new MutationObserver(() => { if (!panel.isConnected) clean(); });
  const clean = () => { removeEventListener('resize', sync); viewport?.removeEventListener('resize', sync); viewport?.removeEventListener('scroll', sync); observer.disconnect(); panel.dispatchEvent(new Event('sv-report-cleanup')); };
  observer.observe(document.body, { childList: true }); panel.addEventListener('sv-modal-close', clean, { once: true });
}

// the panel: the picture is taken first, then a kind, a spoken or typed note, Send; or "Already reported → add to it"
export async function openPanel(i = 0, initialTab = 'tester', signal?: AbortSignal) {
  const existing=document.querySelector<ReportPanel>('.modal.tpanel');
  if(existing){existing.selectTab?.(initialTab);return existing;}
  if (!live || panelOpening) return;
  panelOpening=true; let pic0,scenePic;
  try { const pictures = await shotPair(); pic0 = pictures.full; scenePic = pictures.scene; } finally {panelOpening=false;}
  if(!live||signal?.aborted)return;
  // Capture what the reporter saw, then clear competing control trays for the form.
  document.querySelector<HTMLElement & { close?(): void }>('.audio-tray')?.close?.();
  document.querySelectorAll('.zoomer.open').forEach(x=>x.classList.remove('open'));
  const where=whereNow();
  const was = G.paused; G.paused = true; SFX.tap && SFX.tap();
  const near = ((status && status.open) || []).filter(p => p.where && ((where.game && p.where.game === where.game) || (where.window && p.where.window === where.window) || (!where.game && !where.window && p.where.area === where.area && Math.hypot((p.where.x || 0) - where.x, (p.where.z || 0) - where.z) < 25))).slice(0, 3);
  let kind = 'broken', spoken = false, selectedShot = pic0;
  const m: ReportPanel = modal('tpanel reporting-form' + (G.heroes[i]?.profile.age === 'little' ? ' little' : ''), `<div class="tp-head"><span class="tp-lb">${pic('🐞')}</span><h2>${T('Report a problem', 'Báo lỗi')}</h2><button class="x" aria-label="${T('Close', 'Đóng')}">✕</button></div>
    ${newsHTML()}
    <div class="actions"><button class="btn tp-retry">${T('Retry queued reports', 'Gửi lại báo cáo đang chờ')}</button></div><p class="note tp-delivery" role="status" aria-live="polite">${T(`${queue().length} reports queued. Sent reports are in My reports.`, `${queue().length} báo cáo đang chờ. Báo cáo đã gửi nằm trong Báo cáo của tôi.`)}</p>
    <label class="tog"><input type="checkbox" class="tp-full" checked> ${T('Include the complete interface', 'Kèm toàn bộ giao diện')}</label><button class="tp-picture-open" type="button" aria-label="${T('View captured picture', 'Xem ảnh đã chụp')}"><img class="tp-shot" alt="" src="${pic0}"><span>${T('View captured picture', 'Xem ảnh đã chụp')}</span></button>
    ${near.length ? `<div class="tp-near"><b>${T('Already reported here', 'Đã có người báo ở đây')}</b>${near.map(p => `<div class="tp-old"><span>${esc(p.title)} <small>· ${p.n}×</small></span><button class="btn" data-join="${esc(p.k)}">${T('Same problem: add to it', 'Cùng lỗi: báo thêm')}</button></div>`).join('')}</div>` : ''}
    <div class="tp-kinds">${C.KINDS.map(k => `<button class="tp-k ${k.id === kind ? 'on' : ''}" data-k="${k.id}" aria-pressed="${k.id === kind}">${pic(k.icon)}<span>${T(k.en, k.vi)}</span></button>`).join('')}</div>
    <div class="tp-note"><textarea maxlength="600" rows="3" placeholder="${T('What happened? What did you expect?', 'Chuyện gì xảy ra? Bạn mong điều gì?')}"></textarea>${canListen() ? `<button class="btn tp-mic" aria-label="${T('Say it', 'Nói')}">${pic('🎤')} ${T('Say it', 'Nói')}</button>` : ''}</div>
    <div class="actions"><button class="btn primary tp-send">${T('Send', 'Gửi')}</button></div>`);
  bindReportViewport(m);
  const card = m.querySelector<HTMLElement>('.card'), ta = card.querySelector<HTMLTextAreaElement>('textarea');
  markNewsSeen(); card.querySelectorAll<HTMLButtonElement>('[data-try]').forEach(b => b.onclick = () => { m.close(); G.paused = was; G.playGame?.(i, b.dataset.try, 'tester'); });
  const full = card.querySelector<HTMLInputElement>('.tp-full');
  full.onchange = () => { selectedShot = full.checked ? pic0 : scenePic; card.querySelector<HTMLImageElement>('.tp-shot').src = selectedShot; };
  const reportBody = el('div','testing-report'), autoBody = el('div','testing-auto'), fixedBody: HTMLDivElement = el('div','testing-fixed'); fixedBody.id='testing-fixed'; fixedBody.setAttribute('role','tabpanel'); fixedBody.hidden=true;
  const head = card.querySelector('.tp-head');
  [...card.children].filter(child => child !== head).forEach(child => reportBody.appendChild(child));
  const tabs: HTMLDivElement = el('div','testing-tabs', `<button class="btn" data-test-tab="tester" role="tab">${T('Tester','Người thử')}</button><button class="btn" data-test-tab="autoplay" role="tab">${T('Auto play','Tự chơi')}</button>${fixedToSee().length ? `<button class="btn" data-test-tab="fixed" role="tab">${T('Fixed', 'Đã sửa')} (${fixedToSee().length})</button>` : ''}`);
  tabs.setAttribute('role','tablist'); reportBody.id='testing-report'; autoBody.id='testing-autoplay';
  reportBody.setAttribute('role','tabpanel'); autoBody.setAttribute('role','tabpanel'); autoBody.hidden=true;
  const reportActions=reportBody.querySelector('.tp-send').closest('.actions');reportActions.classList.add('testing-actions');
  card.append(tabs,reportBody,autoBody,fixedBody,reportActions);
  const close = () => { G.autoplay?.detach?.(); m.close(); G.paused = was; };
  // On a busy screen the first tap's capture can finish before native double-click
  // arrives. Cancel only that untouched form; never discard an edited report.
  let interacted = false;
  const touched = () => { interacted = true; };
  const cancelUntouched = () => { if (signal?.reason === 'reset' && !interacted) close(); };
  card.addEventListener('pointerdown', touched, true); card.addEventListener('input', touched, true);
  signal?.addEventListener('abort', cancelUntouched, { once: true });
  m.addEventListener('sv-report-cleanup', () => { signal?.removeEventListener('abort', cancelUntouched); card.removeEventListener('pointerdown', touched, true); card.removeEventListener('input', touched, true); }, { once: true });
  card.querySelector<HTMLButtonElement>('.x').onclick = close;
  const selectTab = tab => {
    const fixedTab = tabs.querySelector('[data-test-tab="fixed"]');
    if (fixedTab) fixedTab.textContent = T('Fixed', 'Đã sửa') + ' (' + fixedToSee().length + ')';
    reportBody.hidden=tab!=='tester'; autoBody.hidden=tab!=='autoplay'; fixedBody.hidden=tab!=='fixed'; reportActions.hidden=tab!=='tester';
    head.querySelector('h2').textContent=tab==='tester'?T('Report a problem','Báo lỗi'):tab==='fixed'?T('Fixed, please check','Đã sửa, con thử lại nhé'):T('Auto play','Tự chơi');
    tabs.querySelectorAll('button').forEach(b=>{const on=b.dataset.testTab===tab;b.classList.toggle('primary',on);b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;b.id='testing-tab-'+b.dataset.testTab;const target=b.dataset.testTab==='tester'?reportBody:b.dataset.testTab==='fixed'?fixedBody:autoBody;b.setAttribute('aria-controls',target.id);target.setAttribute('aria-labelledby',b.id);});
    if (tab==='autoplay') {
      if (G.autoplay?.attach) G.autoplay.attach(autoBody,close);
      else autoBody.textContent=T('Auto play is not enabled on this device.','Tự chơi chưa được bật trên máy này.');
    }
    if (tab==='fixed') {
      const list = fixedToSee(), seen = get(KEY.seen, {});
      fixedBody.innerHTML = `<div class="tm-head actions"><button class="btn primary tp-all-fixed">${T('All fixed', 'Tất cả đã hết lỗi')}</button></div><div class="tm-list">${list.length ? list.map(p => `<div class="tm-row s-fixed"><b>${esc(p.title)}</b><small class="tm-coins">+${C.COINS.helped + (p.spoken ? C.COINS.spoken : 0)} ${pic('🪙')}</small><div class="actions"><button class="btn primary" data-fok='1' data-fk='${esc(p.k)}'>${T('Yes, fixed', 'Đã hết lỗi')}</button><button class="btn" data-fok='0' data-fk='${esc(p.k)}'>${T('Still wrong', 'Vẫn còn lỗi')}</button></div></div>`).join('') : `<p class="note">${T('Nothing waiting to be checked.', 'Không còn lỗi nào cần kiểm tra.')}</p>`}</div>`;
      fixedBody.querySelector<HTMLButtonElement>('.tp-all-fixed')?.addEventListener('click', () => {
        list.forEach(p => { seen[p.k] = 1; tell({ k: p.k, fixed: true }); });
        put(KEY.seen, seen); paintCount(); selectTab('tester');
      });
      fixedBody.querySelectorAll<HTMLButtonElement>('[data-fok]').forEach(b => b.onclick = () => {
        const k = b.dataset.fk, ok = b.dataset.fok === '1';
        seen[k] = 1; put(KEY.seen, seen); paintCount(); tell({ k, fixed: ok });
        selectTab(fixedToSee().length ? 'fixed' : 'tester');
      });
    }
  };
  tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>selectTab(b.dataset.testTab));
  tabs.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const buttons=[...tabs.querySelectorAll<HTMLButtonElement>('[data-test-tab]')],current=buttons.findIndex(b=>b.getAttribute('aria-selected')==='true');const n=e.key==='Home'?0:e.key==='End'?buttons.length-1:(current+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;selectTab(buttons[n].dataset.testTab);buttons[n].focus();}};
  m.selectTab=selectTab;
  selectTab(initialTab);
  const retry = card.querySelector<HTMLButtonElement>('.tp-retry'), deliveryStatus = card.querySelector<HTMLElement>('.tp-delivery');
  const paintDelivery = () => {
    const n = queue().length;
    retry.disabled = flushing;
    retry.textContent = flushing ? T('Sending…', 'Đang gửi…') : T('Retry queued reports', 'Gửi lại báo cáo đang chờ');
    deliveryStatus.textContent = queueStorageError ? T('Could not read saved reports. Your draft stays here.', 'Chưa đọc được báo cáo đã lưu. Nội dung đang viết vẫn ở đây.')
      : navigator.onLine === false ? T(`${n} reports saved on this device. They will send when online.`, `${n} báo cáo đã lưu trên máy này. Báo cáo sẽ gửi khi có mạng.`)
      : flushing ? T(`Sending saved reports. ${n} waiting.`, `Đang gửi báo cáo đã lưu. Còn ${n} báo cáo.`)
      : n ? T(`${n} reports still waiting. Try again.`, `${n} báo cáo còn đang chờ. Thử gửi lại nhé.`)
      : lastFlush?.sent ? T(`Reports sent: ${lastFlush.sent}. Nothing waiting.`, `Đã gửi ${lastFlush.sent} báo cáo. Không còn báo cáo chờ.`)
      : T('No reports waiting to send. Sent reports are in My reports.', 'Không có báo cáo chờ gửi. Báo cáo đã gửi nằm trong Báo cáo của tôi.');
  };
  const cleanDelivery = () => { for (const event of ['sv-report-queue', 'sv-report-delivery', 'online', 'offline']) removeEventListener(event, paintDelivery); removed.disconnect(); };
  const removed = new MutationObserver(() => { if (!m.isConnected) cleanDelivery(); });
  removed.observe(document.body, { childList: true });
  for (const event of ['sv-report-queue', 'sv-report-delivery', 'online', 'offline']) addEventListener(event, paintDelivery);
  m.addEventListener('sv-modal-close', cleanDelivery, { once: true });
  retry.onclick = async () => { const result = await flush(); if (!result.queued && !result.sent) toast(T('No reports waiting to send.', 'Không có báo cáo chờ gửi.')); };
  card.querySelector<HTMLButtonElement>('.tp-picture-open').onclick = () => {
    const picture: ReportPanel = modal('tp-picture' + (m.classList.contains('little') ? ' little' : ''), `<div class="tp-head"><h2>${T('Captured picture', 'Ảnh đã chụp')}</h2><button class="x" aria-label="${T('Close', 'Đóng')}">✕</button></div><div class="tp-picture-body"><img alt="${T('Captured game picture', 'Ảnh trò chơi đã chụp')}" src="${selectedShot}"></div>`);
    bindReportViewport(picture);
    picture.querySelector<HTMLButtonElement>('.x').onclick = () => { picture.close(); card.querySelector<HTMLButtonElement>('.tp-picture-open').focus(); };
  };
  paintDelivery();
  card.querySelectorAll<HTMLButtonElement>('.tp-k').forEach(b => b.onclick = () => { kind = b.dataset.k; card.querySelectorAll<HTMLButtonElement>('.tp-k').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }); SFX.tap && SFX.tap(); });
  const mic = card.querySelector<HTMLButtonElement>('.tp-mic'); if (mic) mic.onclick = async () => { mic.disabled = true; const heard = await listen({ onPartial: t => { ta.value = t; } }); mic.disabled = false; if (heard && heard[0] !== '\u0000') { ta.value = (ta.value && ta.value !== heard ? ta.value + ' ' : '') + heard; spoken = true; } };
  const hero = G?.heroes?.[i];
  const activePlayerName = hero?.profile?.name ? nm(hero.profile.name) : '';
  const reporterAttribution = activePlayerName ? { type: 'player', name: activePlayerName } : { type: 'unknown' };
  const send = join => { if(!enqueue(body(kind, { note: ta.value.trim(), spoken, shot: selectedShot, where, join: join || '', reporter: reporterAttribution })))return; close(); toast(join ? L(C.TESTER_LINES.already) : L(C.TESTER_LINES.waiting)); sayLine(join ? C.TESTER_LINES.already : C.TESTER_LINES.waiting); };
  card.querySelector<HTMLButtonElement>('.tp-send').onclick = () => send('');
  card.querySelectorAll<HTMLButtonElement>('[data-join]').forEach(b => b.onclick = () => send(b.dataset.join));
  return m;
}
// "Fixed in rNN: please check" with Yes, fixed / Still wrong
const tell = b => fetch(URL_(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: me(), ...b }) }).catch(() => { });

// ---------- how my reports are doing ----------
export async function refresh() {
  if (!live || navigator.onLine === false) return status;
  try { const r = await fetch(`${URL_()}?id=${encodeURIComponent(me())}&b=${BUILD}`, { cache: 'no-store' }); if (r.ok && /json/.test(r.headers.get('content-type') || '')) { status = await r.json(); put(KEY.st, status); } } catch (e) { }
  paintCount(); if (G.testerRewards && status) G.testerRewards.apply(status);
  return status;
}

// ---------- the retest: a fixed problem replayed on the new version ----------
async function retest() {
  if (!live || !status || !Array.isArray(status.retest)) return; const done = get(KEY.seen, {});
  for (const p of status.retest) {
    const tag = 'rt:' + p.k + ':' + BUILD; if (done[tag]) continue;
    if (G.paused || document.querySelector('.gl, .modal, .theatre, .storybook')) return; // (only when the child is free)
    const game = p.where && p.where.game, before = errors.length; let again = false;
    if (game && G.playGame) { G.playGame(0, game, 'replay'); await new Promise(r => setTimeout(r, 8000)); again = !document.querySelector('.gl') || errors.length > before; document.querySelector<HTMLElement>('.gl .gl-x')?.click(); }
    else if (p.auto === 'error') { await new Promise(r => setTimeout(r, 8000)); again = errors.slice(before).some(e => p.title.includes(e.split(' @ ')[0].slice(0, 40))); }
    else continue; // (a problem that cannot be replayed by itself waits for the tester's Yes or Still wrong)
    done[tag]=1;put(KEY.seen,done);tell({ k: p.k, fixed: !again }); note('retest', p.k + (again ? ' came back' : ' fixed'));
  }
}

// ---------- the auto play check by itself, on a new version (at night or while charging) ----------
async function nightly() {
  const ap = get<{ sent?: number; ran?: string }>(KEY.ap, {}); const rep = get('sv2_autoplay_report', null);
  // Recover legacy reports into the same receipt-backed outbox as a current run.
  if (rep && rep.build && rep.at && !rep.reportIds?.length && ap.sent !== rep.at) {
    const result = await sendAutoplayReport(rep);
    if (result.state !== 'disabled') { rep.reportIds = result.ids; rep.reportState = result.state; put('sv2_autoplay_report', rep); ap.sent = rep.at; put(KEY.ap, ap); await flush(); }
  }
  if (ap.ran === BUILD) return;
  const charging = await (navigator.getBattery ? navigator.getBattery().then(b => b.charging).catch(() => false) : Promise.resolve(false)), h = new Date().getHours();
  if (!charging && !(h >= 0 && h < 6)) return;
  if (Date.now() - lastInput < 120e3 || G.paused) return; // (only when nobody is playing)
  ap.ran = BUILD; put(KEY.ap, ap);
  if (!G.autoplay) { const m = await import('./autoplay.js'); m.mountAutoplay(G); }
  if (G.autoplay && G.autoplay.start && !G.autoplay.running()) G.autoplay.start(null, 'fast');
}
let lastInput = Date.now();

// ---------- the agreement, the Settings rows ----------
const accepted = () => { const a = get(KEY.acc, null); return !!(a && a.at && !a.stopped); };
function agreement() {
  if (document.querySelector('.modal.tagree')) return;
  const A = C.AGREEMENT, m = modal('tagree', `<div class="tp-head"><span class="tp-lb">${pic('🐞')}</span><h2>${L(A.title)}</h2></div>
    <p>${L(A.intro)}</p><ul class="tg-list">${A.points.map(p => `<li>${esc(L(p))}</li>`).join('')}</ul>
    <div class="actions"><button class="btn primary tg-yes">${L(A.accept)}</button><button class="btn tg-no">${L(A.later)}</button></div>`);
  const card = m.querySelector('.card');
  card.querySelector('.tg-yes').onclick = () => { put(KEY.acc, { at: Date.now(), b: BUILD }); takeCopy(KEY.copy); m.close(); tell({ accepted: true, dev: { label: '' } }); start(); sayLine(C.TESTER_LINES.welcome); };
  card.querySelector('.tg-no').onclick = () => { m.close(); };
}
// the Settings card (js/ui.js openQuick) shows a Tester section on a tester device
export function settingsRows(box, redraw) {
  if (!box) return; const on = accepted(), q = queue().length, st = status || {};
  const policy = revertOf(liveRule('tester'), me());
  const retention = policy === 'keep'
    ? T('This device keeps progress after testing.', 'Máy này giữ tiến bộ sau khi thử nghiệm.')
    : policy === 'autoplay'
      ? T('Autoplay restores coins and game progress after each run. Clothes, badges, stickers and grown-up settings stay; manual play stays.', 'Tự chơi trả lại xu và tiến bộ sau mỗi lượt. Quần áo, huy hiệu, nhãn dán và cài đặt người lớn vẫn giữ; chơi bằng tay vẫn giữ.')
      : T('Coins and game progress return to the saved starting point when tester mode ends, including manual play. Clothes, badges, stickers and grown-up settings stay.', 'Xu và tiến bộ trở về điểm đã lưu khi thôi làm người thử, kể cả chơi bằng tay. Quần áo, huy hiệu, nhãn dán và cài đặt người lớn vẫn giữ.');
  // (owner, 13 Oct AEDT: "tidy up the tester section ... tidier and smarter design") one card: who this device is, the
  // reports as three chips, three big tiles, and "Stop being a tester" held down on its own at the bottom
  const tile = (k, ic, en, vi, sub = '') => `<button class="tst-tile" data-t="${k}"><span class="tst-ic">${pic(ic)}</span><b>${T(en, vi)}</b>${sub ? `<small>${sub}</small>` : ''}</button>`;
  box.innerHTML = `<div class="qs-sec qs-tester">${on ? `
    <div class="tst-head"><span class="tst-lb">${pic('🐞')}</span><div><b>${T('You are a tester', 'Con là người thử')}</b><small>${esc(SHOWN)}${me() ? ' · ' + esc(easyName(me(), settings.lang)) : ''}</small></div></div>
    <div class="tst-stats"><span class="tst-chip"><b>${st.reports || 0}</b>${T('sent', 'đã gửi')}</span><span class="tst-chip ok"><b>${st.helped || 0}</b>${T('helped fix', 'giúp sửa')}</span>${q ? `<span class="tst-chip wait"><b>${q}</b>${T('waiting to send', 'chờ gửi')}</span>` : ''}</div>
    <div class="tst-tiles">${tile('mine', '📋', 'My reports', 'Báo cáo của tôi')}${tile('ap', '🤖', 'Auto play', 'Tự chơi', T('Plays the game by itself to find problems', 'Tự chơi game để tìm lỗi'))}${G.testerRewards ? tile('corner', '🏆', "Tester's Corner", 'Góc người thử', T('Badges and stickers', 'Huy hiệu và nhãn dán')) : ''}</div>
    <button class="btn tst-stop hold" data-hold="stop"><span class="ring"></span>${T('Hold to stop being a tester', 'Giữ để thôi làm người thử')}</button>
    <p class="note">${retention}</p>` : `
    <div class="tst-head"><span class="tst-lb">${pic('🐞')}</span><div><b>${T('Sparkle Lab', 'Phòng thử Sparkle')}</b><small>${T('Help find problems: report what looks wrong, and earn badges.', 'Giúp tìm lỗi: báo những gì không ổn, và nhận huy hiệu.')}</small></div></div>
    <button class="btn primary" data-t="join">${T('Become a tester', 'Làm người thử')}</button>`}</div>`;
  const act = { join: () => { const a = get<{ stopped?: number }>(KEY.acc, {}); delete a.stopped; put(KEY.acc, a); agreement(); },
    stop: () => { put(KEY.acc, { ...get(KEY.acc, {}), stopped: Date.now() }); if (G.autoplay && G.autoplay.stop) G.autoplay.stop(); stop(); putBack(); redraw && redraw(); },
    mine: () => showMine(), corner: () => G.testerRewards && G.testerRewards.corner(),
    ap: async () => { if (!G.autoplay) { const m = await import('./autoplay.js'); m.mountAutoplay(G); } if (G.autoplay && G.autoplay.open) G.autoplay.open(); } };
  box.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { SFX.tap && SFX.tap(); act[b.dataset.t](); });
  const h = box.querySelector('[data-hold="stop"]'); if (h) holdButton(h, () => { SFX.tap && SFX.tap(); act.stop(); });
}
const STATUS_WORDS = { new: ['New', 'Mới'], fixing: ['Being fixed', 'Đang sửa'], fixed: ['Fixed', 'Đã sửa'], confirmed: ['Fixed and checked', 'Đã sửa và kiểm tra'], back: ['Came back', 'Bị lại'], notbug: ['Not a problem', 'Không phải lỗi'], dup: ['Same as another', 'Trùng lỗi khác'] };
function showMine() {
  const list = ((status && status.mine) || []).slice().reverse(), waiting = queue();
  const m = modal('tpanel tmine', `<div class="tp-head"><span class="tp-lb">${pic('🐞')}</span><h2>${T('My reports', 'Báo cáo của tôi')}</h2><button class="x" aria-label="${T('Close', 'Đóng')}">✕</button></div>
    ${waiting.length ? `<p class="note">${T(`${waiting.length} waiting to send`, `${waiting.length} đang chờ gửi`)}</p>` : ''}
    <div class="tm-list">${list.length ? list.map(p => `<div class="tm-row s-${esc(p.status)}"><b>${esc(p.title)}</b><small>${L(STATUS_WORDS[p.status] || ['', ''])}${publicFixedVersion(p.fixedIn) ? ' · ' + esc(publicFixedVersion(p.fixedIn)) : ''}</small></div>`).join('') : `<p class="note">${T('Nothing yet. Tap the ladybird when something looks wrong.', 'Chưa có gì. Chạm vào con bọ rùa khi thấy gì không ổn.')}</p>`}</div>`);
  m.querySelector('.x').onclick = () => m.close();
}

// ---------- starting and stopping ----------
function start() {
  if (live || !accepted()) return; live = true; mounted = performance.now();
  if (!hasCopy(KEY.copy)) takeCopy(KEY.copy); // (a tester from before 13 Oct: progress from now on goes back when they stop)
  hookRender(); watch(); addUI();
  const inp = () => { lastInput = Date.now(); }; addEventListener('pointerdown', inp, true); addEventListener('keydown', inp, true); offs.push(() => { removeEventListener('pointerdown', inp, true); removeEventListener('keydown', inp, true); });
  setPeeks(C.peeksOf(liveRule('tester')), 7);   // (rollout, owner 13 Oct AEDT) and each batch 7 days before its start
  import('./testerrewards.js').then(m => m.mountRewards(G, () => status)).then(() => refresh()).catch(() => refresh());
  const rf = setInterval(refresh, 10 * 60e3); offs.push(() => clearInterval(rf));
  setTimeout(() => { flush(); retest(); }, 20000);
  const nt = setInterval(nightly, 5 * 60e3); offs.push(() => clearInterval(nt)); setTimeout(nightly, 30000);
}
// (owner, 13 Oct AEDT) the progress from when this device became a tester goes back when they stop being one, in place
// (no restart); badges, stickers and clothes stay. Studio's tester rule `revert: 'autoplay'` instead puts back only what
// each auto play run did (js/autoplay.js), so nothing goes back here.
function putBack() {
  if (revertOf(liveRule('tester'), me()) !== 'progress' || !hasCopy(KEY.copy)) { dropCopy(KEY.copy); return; }
  if (putCopyBack(KEY.copy, G)) { const m = T('Progress is back as it was before testing. Badges and stickers stay.', 'Tiến bộ đã trở lại như trước khi thử. Huy hiệu và nhãn dán vẫn giữ.'); (G.huds || []).forEach(h => h.toast && h.toast(m)); }
}
function stop() { live = false; offs.splice(0).forEach(f => { try { f(); } catch (e) { } }); setPeeks([]); if (G.testerRewards) G.testerRewards.unmount(); }

// js/testergate.js: this device is a tester at this level ('' = no longer)
export function mountTester(game: TesterGame, lv: string) {
  G = game; level = lv;
  G.tester = { level, openPanel, autoReport, refresh, retest, nightly, settings: settingsRows, status: () => status, mountedAt: () => mounted, unmount: () => { stop(); delete G.tester; } };
  // (the agreement waits until a child is in the valley, not over the title screen)
  if (accepted()) start(); else if (!(get(KEY.acc, null) || {}).stopped) { const wait = setInterval(() => { if (!G.tester) return clearInterval(wait); if (G.heroes && G.heroes.length && !G.paused) { clearInterval(wait); setTimeout(agreement, 1200); } }, 500); }
}
