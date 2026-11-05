// Push notifications for grown-ups: the server side (v1.08 notifications, owner plan docs/plans/push-notifications.md).
// Netlify Blobs store "push":
//   s/<id>          { endpoint, keys, prefs, sent: { messageKey: ms }, at, seen }   one device that turned it on
//   config          { news: { en, vi, from, to } }                                   Studio's "new this week" text
//   stats/<monday>  { sent: { kind: n }, opened: { kind: n } }                        counts per week, for Studio
// Privacy (owner, 2 Nov 2026 AEDT: no child's data beyond what the game already sends): a record holds only the push
// address, the kinds a grown-up chose, quiet hours, the bedtime days, the family's time zone and language, and (only on
// a tester device, which already sends reports) its tester id. Nothing about a child: the device writes those lines
// itself (sw.ts). The rules (kinds, quiet hours, bundling, texts) are js/content/notify.ts.
import crypto from 'node:crypto';
import { cleanPrefs, plan, payloadOf, studioSwitch, KIND_IDS, addDays, localOf, isQuiet, TEXTS, type KindId, type Prefs, type Text } from '../../js/content/notify.ts';
import { calendar, whatsNew, countLine } from '../../js/content/releasecal.ts';
import { sendPush, goodEndpoint, type Subscription, type Vapid } from './webpush.mts';

export type Rec = { endpoint: string, keys: { p256dh: string, auth: string }, prefs: Prefs, sent: Record<string, number>, at: number, seen: number };
type Store = { get: (k: string, o?: { type: 'json' }) => Promise<any>, setJSON: (k: string, v: unknown) => Promise<unknown>, delete: (k: string) => Promise<unknown>, list: (o: { prefix: string, cursor?: string }) => Promise<{ blobs: { key: string }[], cursor?: string }> };
export const PLIMITS = { subs: 20000, body: 4000, keepSentDays: 60, inviteGapMin: 10 };
export const idOf = (endpoint: string) => crypto.createHash('sha256').update(String(endpoint)).digest('hex').slice(0, 24);
const ID = /^[a-f0-9]{24}$/;
const txt = (v: unknown, n: number) => typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n) : '';
/** the week a time is in (its Monday, Sydney time), the key of Studio's counts */
export const weekOf = (ms: number) => { const l = localOf(ms, 'Australia/Sydney'); return addDays(l.date, -((l.wd + 6) % 7)); };

/** a subscription as the browser gives it, checked (the address must be a real push service) */
export function cleanSub(s: unknown, extraHost?: string): Subscription | null {
  const o = s as Subscription; if (!o || typeof o !== 'object' || !o.keys) return null;
  const p = String(o.keys.p256dh || ''), a = String(o.keys.auth || '');
  if (!goodEndpoint(o.endpoint, extraHost) || Buffer.from(p, 'base64url').length !== 65 || Buffer.from(a, 'base64url').length < 16 || p.length > 100 || a.length > 40) return null;
  return { endpoint: String(o.endpoint), keys: { p256dh: p, auth: a } };
}
/** turn on, or change the choices (the same device keeps its record and what it was already sent) */
export async function subscribe(S: Store, body: { sub?: unknown, prefs?: unknown }, now: number, extraHost?: string) {
  const sub = cleanSub(body && body.sub, extraHost); if (!sub) return { ok: false, status: 400, error: 'bad subscription' };
  const id = idOf(sub.endpoint), old: Rec | null = await S.get('s/' + id, { type: 'json' }).catch(() => null);
  if (!old) { const { blobs } = await S.list({ prefix: 's/' }); if (blobs.length >= PLIMITS.subs) return { ok: false, status: 503, error: 'full' }; }
  const rec: Rec = { ...sub, prefs: cleanPrefs(body.prefs as Partial<Prefs>), sent: (old && old.sent) || {}, at: (old && old.at) || now, seen: now };
  await S.setJSON('s/' + id, rec); return { ok: true, id, prefs: rec.prefs };
}
export async function unsubscribe(S: Store, endpoint: unknown) { if (typeof endpoint !== 'string') return false; await S.delete('s/' + idOf(endpoint)); return true; }
/** count a kind opened (a tap on a notification: only the kind, never who) */
export async function opened(S: Store, kind: unknown, now: number) {
  if (!KIND_IDS.includes(kind as KindId)) return false;
  const k = 'stats/' + weekOf(now), s = (await S.get(k, { type: 'json' }).catch(() => null)) || { sent: {}, opened: {} };
  s.opened[kind as string] = (s.opened[kind as string] || 0) + 1; await S.setJSON(k, s); return true;
}
async function countSent(S: Store, kinds: KindId[], now: number) {
  const k = 'stats/' + weekOf(now), s = (await S.get(k, { type: 'json' }).catch(() => null)) || { sent: {}, opened: {} };
  for (const x of kinds) s.sent[x] = (s.sent[x] || 0) + 1; await S.setJSON(k, s);
}
/** Studio: the last 8 weeks' counts and how many devices have it on, per kind */
export async function stats(S: Store, now: number) {
  const weeks = [...Array(8)].map((_, i) => weekOf(now - i * 7 * 864e5));
  const rows = await Promise.all(weeks.map(async w => ({ week: w, ...((await S.get('stats/' + w, { type: 'json' }).catch(() => null)) || { sent: {}, opened: {} }) })));
  const recs = await allRecs(S), on: Record<string, number> = {}; for (const r of recs) for (const k of KIND_IDS) if (r.prefs.kinds[k]) on[k] = (on[k] || 0) + 1;
  return { devices: recs.length, kindsOn: on, weeks: rows, config: await readConfig(S) };
}
export type Config = { news?: Text & { from: string, to: string } };
export async function readConfig(S: Store): Promise<Config> { return (await S.get('config', { type: 'json' }).catch(() => null)) || {}; }
/** Studio's "new this week" text: shown in Saturday messages from `from` to `to` (dates, empty = this week only) */
export async function saveConfig(S: Store, b: { news?: { en?: string, vi?: string, from?: string, to?: string } }, now: number) {
  const D = /^\d{4}-\d\d-\d\d$/, n = b && b.news, c: Config = {};
  if (n && (txt(n.en, 200) || txt(n.vi, 200))) { const from = D.test(n.from || '') ? n.from : weekOf(now); c.news = { en: txt(n.en, 200), vi: txt(n.vi, 200), from, to: D.test(n.to || '') ? n.to : addDays(from, 6) }; }
  await S.setJSON('config', c); return c;
}
async function allRecs(S: Store): Promise<(Rec & { id: string })[]> {
  const keys: string[] = []; let cursor: string | undefined;
  do { const r = await S.list({ prefix: 's/', ...(cursor ? { cursor } : {}) }); keys.push(...r.blobs.map(b => b.key)); cursor = r.cursor; } while (cursor && keys.length < PLIMITS.subs);
  const out = []; for (const k of keys) { const r = await S.get(k, { type: 'json' }).catch(() => null); if (r && r.endpoint) out.push({ ...r, prefs: cleanPrefs(r.prefs), sent: r.sent || {}, id: k.slice(2) }); }
  return out;
}
/** a kind Studio switched off for everyone (Releases page, switch push_<kind>: Off, or a schedule not started or over) */
export function studioOffOf(live: { releases?: Record<string, { on?: boolean, start?: string, days?: number }> } | null, now: number) {
  return (k: KindId) => {
    const r = live && live.releases && live.releases[studioSwitch(k)]; if (!r) return false;
    if (r.on === false) return true;
    const st = r.start && Date.parse(r.start + 'T00:00:00+10:00');
    if (st && now < st) return true;
    return !!(st && r.days > 0 && now >= st + r.days * 864e5);
  };
}
/** Studio's switches as the devices get them (/api/live): the revisioned configuration when it is active, else "live" */
export async function readSwitches(L: Store | null) {
  if (!L) return null;
  const projected = await L.get('management-live', { type: 'json' }).catch(() => null), m = projected && projected.management;
  if (m && m.scopeKey === 'global' && Number.isSafeInteger(m.revision) && m.revision > 0) return { releases: projected.releases || {} };
  return (await L.get('live', { type: 'json' }).catch(() => null)) || { releases: {} };
}
/** a tester's problems marked fixed that this device was not told about yet */
async function testerFixed(T: Store | null, rec: Rec): Promise<string[]> {
  if (!T || !rec.prefs.tester) return [];
  const t = await T.get('t/' + rec.prefs.tester, { type: 'json' }).catch(() => null), out: string[] = [];
  for (const k of ((t && t.mine) || []).slice(-100)) { if (rec.sent['tfix:' + k]) continue; const p = await T.get('p/' + k, { type: 'json' }).catch(() => null); if (p && p.status === 'fixed') out.push(k); }
  return out;
}
/** (v1.08b story) Saturday's "Tuần này có gì mới" written from the release calendar (js/content/releasecal.ts, with
 *  the owner's moves from the live content) when Studio set no text of its own for this week; null when nothing opened */
export function calendarNews(live: any, today: string): (Text & { from: string, to: string }) | null {
  const moves = live && live.content && live.content.releaseCalendar && live.content.releaseCalendar.moves;
  const W = whatsNew(calendar(moves), new Date(today + 'T12:00:00')); if (!W.thisWeek.length) return null;
  const [en, vi] = countLine(W.thisWeek), first = W.thisWeek[0];
  return { en: `New in Sparkle Valley this week: ${en}, like ${first.en}.`.slice(0, 200), vi: `Tuần này có gì mới ở Thung Lũng Lấp Lánh: ${vi}, như ${first.vi}.`.slice(0, 200), from: today, to: today };
}
/** the scheduled run (every 30 minutes): each family's due messages, sent once; devices that left are removed */
export async function run(S: Store, { vapid, live = null, testers = null, now = Date.now(), fetchFn = fetch }: { vapid: Vapid | null, live?: any, testers?: Store | null, now?: number, fetchFn?: typeof fetch }) {
  const res = { devices: 0, sent: 0, gone: 0, failed: 0, off: !vapid };
  if (!vapid) return res;
  const cfg = await readConfig(S), off = studioOffOf(live, now), today = localOf(now, 'Australia/Sydney').date;
  const news = cfg.news && cfg.news.from <= today && today <= cfg.news.to ? cfg.news : calendarNews(live, today);
  for (const rec of await allRecs(S)) {
    res.devices++;
    const fixed = await testerFixed(testers, rec);
    const msgs = plan({ now, prefs: rec.prefs, sent: rec.sent, studioOff: off, news, testerFixed: fixed.length });
    if (!msgs.length) continue;
    let gone = false, changed = false;
    for (const m of msgs) {
      const r = await sendPush(vapid, rec, payloadOf(m, rec.prefs.lang), { fetchFn, now }).catch(() => ({ ok: false, gone: false, status: 0 }));
      if (r.gone) { gone = true; break; }
      if (!r.ok) { res.failed++; continue; }
      res.sent++; changed = true;
      for (const k of [m.key, ...(m.also || []), ...(m.kinds.includes('tester') ? fixed.map(f => 'tfix:' + f) : [])]) rec.sent[k] = now;
      await countSent(S, m.kinds, now);
    }
    if (gone) { res.gone++; await S.delete('s/' + rec.id); continue; }
    if (changed) { const keep: Record<string, number> = {}; for (const [k, t] of Object.entries(rec.sent)) if (now - t < PLIMITS.keepSentDays * 864e5 || k.startsWith('tfix:')) keep[k] = t; rec.sent = keep; const { id, ...plain } = rec; await S.setJSON('s/' + id, plain); }
  }
  return res;
}
/** kind 11: a friend's family invites; only when that device has invites on, not in its quiet hours, at most every 10 minutes */
export async function invite(S: Store, to: unknown, { vapid, now = Date.now(), fetchFn = fetch, live = null }: { vapid: Vapid | null, now?: number, fetchFn?: typeof fetch, live?: any }) {
  if (!vapid || typeof to !== 'string' || !ID.test(to)) return { ok: false, status: vapid ? 400 : 503 };
  const rec: Rec | null = await S.get('s/' + to, { type: 'json' }).catch(() => null); if (!rec) return { ok: false, status: 404 };
  const prefs = cleanPrefs(rec.prefs), sent = rec.sent || {};
  const l = localOf(now, prefs.tz);
  if (!prefs.kinds.invite || studioOffOf(live, now)('invite') || isQuiet(l, prefs.quiet)) return { ok: true, held: true };
  if (now - (sent.invite || 0) < PLIMITS.inviteGapMin * 60e3) return { ok: true, held: true };
  const r = await sendPush(vapid, rec, payloadOf({ key: 'invite', slot: 'invite', kinds: ['invite'], title: TEXTS.inviteTitle, parts: { invite: TEXTS.invite }, open: 'invite', tag: 'sv-invite' }, prefs.lang), { fetchFn, now, ttl: 600, urgency: 'high' }).catch(() => ({ ok: false, gone: false, status: 0 }));
  if (r.gone) { await S.delete('s/' + to); return { ok: false, status: 410 }; }
  if (r.ok) { await S.setJSON('s/' + to, { ...rec, sent: { ...sent, invite: now } }); await countSent(S, ['invite'], now); }
  return { ok: r.ok, status: r.ok ? 200 : 502 };
}
