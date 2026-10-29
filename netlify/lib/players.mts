// How many children play, and (round L) what each one plays, for the grown-ups' report in Sparkle Studio.
// Each device makes up a random id the first time (js/players.js) and now and then says "hello": the build, the
// language, how many children's profiles it has, minutes played and which games and stories were played since
// the last hello. (round R privacy, 9 Oct: said exactly) What is kept: per child the first name the family gave the
// profile (letters only, up to 20) and the age group (under 5, or 5 and up), minutes, games, places in the valley and
// stories; per device its kind, system, browser, screen size, build and language, and the town, state and country
// Netlify works out from the connection; errors in the game's own code, stuck spots and smoothness; (11 Oct, #36) how
// long each start took (up to 6 a day: ms to the game's code, to a built valley and to its first picture, whether it
// came from the device's saved copy, the slowest building step's name); (battery round, 12 Oct) what drawing cost: minutes
// measured, frames drawn while playing and their seconds, ms spent, draws, sharpness, slow (idle) minutes, minutes on
// battery and battery used, minutes charging,
// where the browser tells it; lines that had no recording. Never kept: surnames, photos, voices, anything a child typed, GPS, or the connection's address (IP).
// A grown-up can switch it all off (Grown-ups → Analytics and backup → Analytics).
// It is kept in Netlify Blobs (store "players"):
//   d/<day>/<id>   that device on that day          dev/<id>   the day it was first seen
//   sum/<day>      a finished day, added up (the d/ records of days older than 60 days are removed)
//   seen/<hello>   a hello already counted (a device re-sends what it isn't sure arrived; the copy is ignored)
// Offline play is not lost: the device keeps an outbox of its minutes and games per day and sends it when it is
// online again, so each day is counted as the day it was played.
//   line/<hash>    a line of the game's text that devices had to say with the machine voice (Sparkle Studio's
//                  "missing lines inbox": the grown-up records them, and the next voice pack has them)
//   vq/<day>/…     (round R privacy) how many such lines came that day from one device, one connection and in all:
//                  10 a hello, 30 a device a day, 60 a connection a day and 200 new lines a day, so nobody can flood
//                  the inbox (and the Azure budget spent recording it)
import { createHash } from 'crypto';
import { isBuild, buildRank } from './build-number.mts';
// what a device sends is checked in netlify/lib/hello-clean.mts (type-checked); the store below keeps only that
import { ID, WORD, NAME, LINES, day, int, obj, counts, words, bat, batAdd, clean } from './hello-clean.mts';
import type { KidDay, Start } from './hello-clean.mts';
export { LINES, clean };

// what is kept: a device's "still here" (live/<id>), a device on a day (d/<day>/<id>), a finished day added up (sum/<day>)
type Session = { on: boolean, at: number, build: string };
type DayRecord = { hellos: number, isNew?: boolean, mins: number, kids: number, tales: number, online: number, app?: boolean, lang: string, kind: string,
  build: string, builds?: Record<string, boolean>, games: Counts, hours?: Counts, children?: Record<string, KidDay>, errs?: Counts, stuck?: Counts, quits?: Counts,
  fps?: number[], starts?: Start[], bat?: number[] };
// a line devices had to say with the machine voice (line/<hash>)
type LineRecord = { lang: string, text: string, n: number, first: string, last?: string };
type LiveRecord = { on: boolean, at: number, kid?: string, sessions?: Record<string, Session> };
type Counts = Record<string, number>;
type DevDay = { mins: number, tales: number, games: Counts, hours: Counts, kids: Record<string, KidDay>, errs: Counts, stuck: Counts, quits: Counts,
  fps: number[], starts: Start[], bat: number[] };
type DaySum = { date: string, ids: string[], newDevices: number, mins: number, games: Counts, langs: Counts, builds: Counts, kinds: Counts,
  app: number, kids: number, tales: number, online: number, dev: Record<string, DevDay> };
// one device and one child over the 30 days of the report
type Kid = { key: string, name: string, age: string, mins: number, simpleMins: number, tales: number, games: Record<string, number[]>, places: Counts };
type Dev = { id: string, mins: number, days: number, tales: number, kids: Record<string, Kid>, errs: number, stuck: number, fps: number[], last?: string,
  bat?: number[], starts?: Start[] };

// a place name from the connection (Netlify's geo), cleaned
const place = s => String(s || '').normalize('NFC').replace(/[^\p{L}\p{N} .'-]/gu, '').slice(0, 40);
// Online now (round O, owner: Studio should show whether each device is playing right now): while the game is on the
// screen a device says "still here" every two minutes ({ id, live: 1, kid: the child's first name }), and "gone"
// when it is put away ({ id, live: 0 }); only the latest is kept, in live/<id>.
export async function live(S, b, now = Date.now()) {
  if (!b || !ID.test(b.id || '')) return false;
  const kid = NAME.test(String(b.kid || '')) ? String(b.kid || '').trim() : '';
  const key='live/'+b.id,old=await S.get(key,{type:'json'})||{},sessions: Record<string, Session>=old.sessions||{};
  const sid=/^[a-z0-9]{16}$/.test(b.sid||'')?b.sid:'legacy';
  sessions[sid]={on:!!b.live,at:now,build:isBuild(b.b)?b.b:'?'};
  const kept=Object.fromEntries(Object.entries(sessions).filter(([,s])=>now-s.at<LIVE_MS).sort((a,b)=>b[1].at-a[1].at).slice(0,16));
  await S.setJSON(key,{on:Object.values(kept).some(s=>s.on),at:now,kid,sessions:kept});
  return true;
}
export const LIVE_MS = 5 * 60e3; // no "still here" for five minutes: offline (the phone died, or lost the internet)
// opts.ip: a keyed hash of the connection (netlify/lib/guard.mts), only to count its lines per day
export async function hello(S, body, now = Date.now(), where: { city?: string, region?: string, country?: string } = {}, opts: { ip?: string } = {}) {
  if (body && body.live != null) return live(S, body, now);
  const d = clean(body, now); if (!d) return false;
  const today = day(now);
  if (d.hid && await S.get('seen/' + d.hid)) return true; // a copy of one already counted (its answer was lost): just confirm it
  // the first day this device was ever seen (an outbox can bring an earlier day than the one already known)
  const known = await S.get('dev/' + d.id), first = [known, ...d.days.map(x => x.d)].filter(Boolean).sort()[0] || today;
  if (first !== known) await S.set('dev/' + d.id, first);
  // the device itself: what it is, roughly where, first and last seen (round L)
  { const k = 'info/' + d.id, o = (await S.get(k, { type: 'json' })) || { first: first };
    const loc = { city: place(where.city), region: place(where.region), country: place(where.country).toUpperCase().slice(0, 3) };
    const rank=buildRank;
    const current=d.started?d.started>=(o.sessionStarted||0):!o.sessionStarted||rank(d.build)>=rank(o.build);
    Object.assign(o, {last:today,first:first<(o.first||first)?first:(o.first||first)});
    if(current)Object.assign(o,{kind:d.kind,app:d.app,os:d.os,br:d.br,sc:d.sc||o.sc||'',build:d.build,lang:d.lang,kids:d.kids,fh:d.fh||'',sessionStarted:d.started||o.sessionStarted||0});
    // Confirmation is evidence observed at least once, not a claim that an app cannot later be uninstalled.
    // Keep it independently of the latest session's browser/app context and stale concurrent hellos.
    if (d.install) { o.installation = o.installation === 'standalone' || d.install === 'standalone' ? 'standalone' : 'native'; o.installationSeen = o.installationSeen || today; }
    if (loc.country || loc.city) o.loc = loc;
    await S.setJSON(k, o); }
  for (const x of d.days) {
    const key = `d/${x.d}/${d.id}`, r = (await S.get(key, { type: 'json' })) || { hellos: 0, mins: 0, games: {}, tales: 0, online: 0 };
    r.hours = r.hours || {}; r.children = r.children || {}; r.errs = r.errs || {}; r.stuck = r.stuck || {}; r.quits = r.quits || {}; r.fps = r.fps || [0, 0, 0];
    for (const [h, n] of Object.entries(x.hours)) r.hours[h] = Math.min(60, (r.hours[h] || 0) + n);
    for (const f of ['errs', 'stuck', 'quits']) for (const [k, n] of Object.entries(x[f])) r[f][k] = (r[f][k] || 0) + n;
    r.fps = r.fps.map((v, i) => v + x.fps[i]);
    r.bat = batAdd(r.bat || [], x.bat); // (battery round)
    r.starts = (r.starts || []).concat(x.starts || []).slice(-12); // (#36) the day's starts, the newest kept
    for (const [k, c] of Object.entries(x.kids)) {
      const m = r.children[k] = r.children[k] || { n: '', a: c.a, m: 0, sm: 0, t: 0, g: {}, p: {} };
      m.n = c.n; m.a = c.a; m.m = Math.min(24 * 60, m.m + c.m); m.sm = Math.min(24 * 60, m.sm + c.sm); m.t += c.t;
      for (const [g, v] of Object.entries(c.g)) { const o = m.g[g] = m.g[g] || [0, 0, 0]; v.forEach((n, i) => { o[i] += n; }); }
      for (const [pl, n] of Object.entries(c.p)) m.p[pl] = (m.p[pl] || 0) + n;
    }
    r.isNew = x.d === first; r.hellos++; r.mins = Math.min(24 * 60, r.mins + x.mins); r.tales += x.tales; r.online = Math.min(24 * 60, r.online + x.online);
    for (const [g, n] of Object.entries(x.games)) r.games[g] = (r.games[g] || 0) + n;
    r.builds=r.builds||{...(r.build?{[r.build]:true}:{})};r.builds[x.build]=true;
    Object.assign(r, { build: x.build, lang: d.lang, kids: d.kids, kind: d.kind, app: d.app });
    await S.setJSON(key, r);
    if (x.d < today) await S.delete('sum/' + x.d); // a finished day that just got more play (from an outbox) is added up again
  }
  if (d.hid) await S.set('seen/' + d.hid, today); // only once it is all written
  if (d.lines.length) await addLines(S, d.id, opts.ip || '', d.lines, today);
  return true;
}
// the missing lines of one hello, within the day's limits for this device, this connection and new lines in all
async function addLines(S, id, ip, lines, today) {
  const num = async k => +(await S.get(k)) || 0;
  const kd = `vq/${today}/d/${id}`, ki = `vq/${today}/i/${ip || 'none'}`, kn = `vq/${today}/new`;
  let nd = await num(kd), ni = await num(ki), nn = await num(kn), took = 0;
  for (const [lang, text] of lines) {
    if (nd >= LINES.device || ni >= LINES.ip) break;
    const k = 'line/' + createHash('sha1').update(lang + '|' + text).digest('hex').slice(0, 16), had = await S.get(k, { type: 'json' });
    if (!had && nn >= LINES.newPerDay) continue;
    const o = had || { lang, text, n: 0, first: today }; o.n++; o.last = today; await S.setJSON(k, o);
    nd++; ni++; if (!had) nn++; took++;
  }
  if (took) { await S.set(kd, String(nd)); await S.set(ki, String(ni)); await S.set(kn, String(nn)); }
}

const add = (o: Counts, k: string, n = 1) => { o[k] = (o[k] || 0) + n; };
// (14 Oct AEDT: Studio's Analytics page timed out with 504) the store is read many at a time, never one by one: each
// read takes tens of ms, and the page has 10 s in all
const POOL = 16;
async function each<T, R>(list: T[], fn: (x: T, i: number) => Promise<R>, n = POOL): Promise<R[]> { const out = new Array(list.length); let i = 0; await Promise.all(Array.from({ length: Math.min(n, list.length) }, async () => { while (i < list.length) { const k = i++; out[k] = await fn(list[k], k); } })); return out; }
async function listAll(S, prefix) { const all = []; let cursor; do { const r = await S.list({ prefix, ...(cursor ? { cursor } : {}) }); all.push(...r.blobs); cursor = r.cursor; } while (cursor); return all; }
async function sumDay(S, date: string, keep: boolean): Promise<DaySum> {
  const saved = await S.get('sum/' + date, { type: 'json' }); if (saved) return saved;
  const blobs = await listAll(S, `d/${date}/`), s: DaySum = { date, ids: [], newDevices: 0, mins: 0, games: {}, langs: {}, builds: {}, kinds: {}, app: 0, kids: 0, tales: 0, online: 0, dev: {} };
  const recs = await each(blobs, (b): Promise<DayRecord | null> => S.get(b.key, { type: 'json' }));
  for (const [i, b] of blobs.entries()) {
    const r = recs[i]; if (!r) continue;
    s.ids.push(b.key.split('/')[2]); if (r.isNew) s.newDevices++; s.mins += r.mins; s.kids += r.kids; s.tales += r.tales; s.online += r.online || 0; if (r.app) s.app++;
    add(s.langs, r.lang); for(const version of Object.keys(r.builds||{[r.build]:true}))add(s.builds,version); add(s.kinds, r.kind); for (const [g, n] of Object.entries(r.games || {})) add(s.games, g, n);
    // round L: what this device did that day, kept with the day's sum (per child, hours, problems, smoothness)
    s.dev[b.key.split('/')[2]] = { mins: r.mins, tales: r.tales, games: r.games || {}, hours: r.hours || {}, kids: r.children || {}, errs: r.errs || {}, stuck: r.stuck || {}, quits: r.quits || {}, fps: r.fps || [0, 0, 0], starts: r.starts || [], bat: r.bat || [0, 0, 0, 0, 0, 0, 0, 0] };
  }
  if (keep) await S.setJSON('sum/' + date, s); // a finished day never changes again
  return s;
}

// the report for Sparkle Studio's Players page
export async function report(S, now = Date.now()) {
  const days = []; for (let i = 29; i >= 0; i--) days.push(day(now - i * 864e5));
  // The lifetime count does not depend on daily totals. Read it alongside the
  // bounded daily pool; no cached private report or stale active-version data.
  const countAll = async () => { let n = 0, cursor; do { const r = await S.list({ prefix: 'dev/', ...(cursor ? { cursor } : {}) }); n += r.blobs.length; cursor = r.cursor; } while (cursor); return n; };
  const [sums, allTime] = await Promise.all([each(days, (d, i) => sumDay(S, d, i < days.length - 1), 6), countAll()]);
  const uniq = list => new Set(list.flatMap(s => s.ids)).size, last = n => sums.slice(-n);
  const total = (list: DaySum[], f: 'games' | 'langs' | 'builds' | 'kinds') => { const o: Counts = {}; for (const s of list) for (const [k, v] of Object.entries(s[f])) add(o, k, v); return o; };
  const top = (o: Counts, n: number) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
  await tidy(S, now);
  const t = sums[sums.length - 1], w = last(7), deviceDays = sums.reduce((a, s) => a + s.ids.length, 0);
  const detail = await details(S, sums, now);
  return report0(now, sums, t, w, deviceDays, allTime, uniq, total, top, detail);
}
// tidy up: the day-by-day device records are only needed for 60 days (the sums stay), a hello's "already counted"
// mark as long, the daily line counts two days. (14 Oct AEDT) Once a day, and at most 2.5 s of it (what is left waits
// for the next day): it used to read every mark on every opening of the page
async function tidy(S, now) {
  const today = day(now), old = day(now - 60 * 864e5), yday = day(now - 2 * 864e5), stop = Date.now() + 2500;
  try { if (await S.get('tidy/last') === today) return; await S.set('tidy/last', today); } catch (e) { return; }
  const gone = async (prefix, isOld) => { try { const blobs = (await listAll(S, prefix)).filter(isOld); await each(blobs, async b => { if (Date.now() < stop) await S.delete(b.key); }); } catch (e) { } };
  await gone('d/', b => b.key.slice(2, 12) < old);
  await gone('vq/', b => b.key.slice(3, 13) < yday); // (the daily line counts)
  try { const blobs = await listAll(S, 'seen/'); await each(blobs, async b => { if (Date.now() >= stop) return; const v = await S.get(b.key); if (!v || v < old) await S.delete(b.key); }); } catch (e) { }
}
function report0(now, sums, t, w, deviceDays, allTime, uniq, total, top, detail) {
  return {
    made: new Date(now).toISOString(),
    today: { devices: t.ids.length, newDevices: t.newDevices, mins: t.mins },
    week: { devices: uniq(w), newDevices: w.reduce((a, s) => a + s.newDevices, 0), mins: w.reduce((a, s) => a + s.mins, 0) },
    month: { devices: uniq(sums), newDevices: sums.reduce((a, s) => a + s.newDevices, 0), mins: sums.reduce((a, s) => a + s.mins, 0) },
    allTime,
    perDay: sums.map(s => ({ date: s.date, devices: s.ids.length, newDevices: s.newDevices, mins: s.mins })),
    minsPerDevice: deviceDays ? Math.round(sums.reduce((a, s) => a + s.mins, 0) / deviceDays) : 0,
    kidsPerDevice: deviceDays ? +(sums.reduce((a, s) => a + s.kids, 0) / deviceDays).toFixed(1) : 0,
    games: top(total(sums, 'games'), 25), tales: sums.reduce((a, s) => a + s.tales, 0), onlineMins: sums.reduce((a, s) => a + s.online, 0),
    langs: total(w, 'langs'), builds: total(w, 'builds'), kinds: total(w, 'kinds'), app: w.reduce((a, s) => a + s.app, 0), weekDeviceDays: w.reduce((a, s) => a + s.ids.length, 0),
    ...detail
  };
}

// round L: the last 30 days per device and per child, when they play, where from, what went wrong, and suggestions
async function details(S, sums: DaySum[], now: number) {
  const infos = {}, labels = {};
  const lives: Record<string, LiveRecord> = {};
  await Promise.all(['info/', 'label/', 'live/'].map(async pre => { const blobs = (await listAll(S, pre)).slice(0, 2000);
    await each(blobs, async b => { const id = b.key.slice(pre.length); if (pre === 'info/') infos[id] = await S.get(b.key, { type: 'json' }); else if (pre === 'live/') lives[id] = await S.get(b.key, { type: 'json' }); else labels[id] = await S.get(b.key); }); }));
  const hours = Array(24).fill(0), places: Counts = {}, errs: Record<string, { n: number, devices: Set<string> }> = {}, stuck: Counts = {}, quits: Counts = {}, starts: Counts = {}, devs: Record<string, Dev> = {};
  for (const s of sums) for (const [id, x] of Object.entries(s.dev || {})) {
    const D = devs[id] = devs[id] || { id, mins: 0, days: 0, tales: 0, kids: {}, errs: 0, stuck: 0, fps: [0, 0, 0], last: s.date };
    D.mins += x.mins; D.days++; D.tales += x.tales; D.last = s.date; D.fps = D.fps.map((v, i) => v + ((x.fps || [])[i] || 0));
    D.bat = batAdd(D.bat || [], x.bat || []); // (battery round)
    D.starts = (D.starts || []).concat(x.starts || []).slice(-30); // (#36) the last 30 starts
    for (const [h, n] of Object.entries(x.hours || {})) hours[+h] += n;
    for (const [k, n] of Object.entries(x.errs || {})) { const e = errs[k] = errs[k] || { n: 0, devices: new Set() }; e.n += n; e.devices.add(id); D.errs += n; }
    for (const [k, n] of Object.entries(x.stuck || {})) { add(stuck, k, n); D.stuck += n; }
    for (const [k, n] of Object.entries(x.quits || {})) add(quits, k, n);
    for (const [k, n] of Object.entries(x.games || {})) add(starts, k, n);
    for (const [k, c] of Object.entries(x.kids || {})) {
      const K = D.kids[k] = D.kids[k] || { key: k, name: '', age: c.a, mins: 0, simpleMins: 0, tales: 0, games: {}, places: {} };
      if (c.n) K.name = c.n; K.age = c.a; K.mins += c.m; K.simpleMins += c.sm || 0; K.tales += c.t;
      for (const [g, v] of Object.entries(c.g || {})) { const o = K.games[g] = K.games[g] || [0, 0, 0]; v.forEach((n, i) => { o[i] += n; }); }
      for (const [pl, n] of Object.entries(c.p || {})) { add(K.places, pl, n); add(places, pl, n); }
    }
  }
  const top = (o: Counts, n: number) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
  const fpsOf = f => f[1] ? Math.round(f[0] / f[1]) : null;
  // (#36) a device's usual start-up: medians in seconds of the time to a built valley and to its first picture, for starts
  // from the device's saved copy (warm) and the others (first visits and updates), and its most common slowest step
  const med = a => { if (!a.length) return null; const v = a.slice().sort((x, y) => x - y); return Math.round(v[v.length >> 1] / 100) / 10; };
  const startupOf = st => { if (!st.length) return null; const w = st.filter(r => r[3]), c = st.filter(r => !r[3]), steps = {}; st.forEach(r => r[4] && add(steps, r[4]));
    return { n: st.length, ready: med(w.map(r => r[1])), readyFirst: med(c.map(r => r[1])), picture: med(st.map(r => r[2]).filter(Boolean)), slowest: top(steps, 1).map(x => x[0])[0] || '' }; };
  // (battery round, 12 Oct; names agreed with Studio on the board) a device's drawing and battery over the 30 days, `power`:
  // fps = frames a second while a child plays (idle, title and menu time left out), frameMs = ms of work a frame, draws =
  // draw calls a frame, ratio = sharpness (pixel ratio), mins = minutes measured, batteryPerHour = battery % used an hour
  // on battery (from 10 such minutes, only where the browser tells it: Chrome-based browsers; else null), charging = true
  // when it was mostly charging, idlePct = share of minutes drawn slowly because nothing moved; null = not reported yet
  const r1 = v => Math.round(v * 10) / 10;
  const powerOf = b => !b || !b[0] ? null : { fps: b[9] ? Math.round(b[1] / b[9]) : null, frameMs: b[1] ? r1(b[2] / b[1]) : null, draws: b[1] ? Math.round(b[3] / b[1]) : null,
    ratio: Math.round(b[4] / b[0]) / 100, mins: b[0], batteryPerHour: b[6] >= 10 ? r1(b[7] / 10 / b[6] * 60) : null, charging: b[8] > b[6], idlePct: Math.round(100 * b[5] / b[0]) };
  const devices = Object.keys({ ...infos, ...devs, ...lives }).map(id => { const I = infos[id] || {}, D: Omit<Dev, 'id'> = devs[id] || { mins: 0, days: 0, tales: 0, kids: {}, errs: 0, stuck: 0, fps: [0, 0, 0] };
    return { id, label: labels[id] || '', family: I.fh || '', kind: I.kind || '?', os: I.os || '?', br: I.br || '?', screen: I.sc || '', app: !!I.app, installation: I.installation === 'standalone' || I.app ? 'standalone' : I.installation === 'native' ? 'native' : '', installationSeen: I.installationSeen || '', build: I.build || '?', lang: I.lang || '?', loc: I.loc || null, first: I.first || '', last: I.last || D.last || '',
      online: !!(lives[id] && lives[id].on && now - lives[id].at < LIVE_MS), activeVersions:[...new Set(Object.values(lives[id]?.sessions||{}).filter(s=>s.on&&now-s.at<LIVE_MS).map(s=>s.build))],seenAt: lives[id] ? new Date(lives[id].at).toISOString() : '', playingNow: lives[id] && lives[id].on && now - lives[id].at < LIVE_MS ? lives[id].kid || '' : '',
      mins: D.mins, days: D.days, tales: D.tales, errors: D.errs, stuck: D.stuck, fps: fpsOf(D.fps), slowMins: D.fps[2], startup: startupOf(D.starts || []), power: powerOf(D.bat),
      kids: Object.values(D.kids).sort((a, b) => b.mins - a.mins).map(K => ({ ...K, games: Object.entries(K.games).sort((a, b) => b[1][0] - a[1][0]).slice(0, 10).map(([g, v]) => [g, ...v]), places: top(K.places, 8) })) }; })
    .sort((a, b) => +b.online - +a.online || (b.last || '').localeCompare(a.last || '') || b.mins - a.mins);
  const count = f => { const o = {}; for (const d of devices) if (d.days) add(o, f(d)); return o; };
  const problems = {
    errors: Object.entries(errs).sort((a, b) => b[1].n - a[1].n).slice(0, 15).map(([k, e]) => [k, e.n, e.devices.size]),
    stuck: top(stuck, 15),
    quits: Object.entries(quits).map(([g, n]): [string, number, number, number] => [g, n, starts[g] || n, Math.round(100 * n / Math.max(n, starts[g] || n))]).sort((a, b) => b[1] - a[1]).slice(0, 12),
    slow: devices.filter(d => d.fps != null && d.fps < 25).map(d => [d.id, d.label, d.fps, d.slowMins])
  };
  // things worth doing: Studio words them (with the games' and places' own names), most useful first
  const tips = [], who = d => ({ id: d.id, label: d.label, kind: d.kind, os: d.os, br: d.br });
  for (const [g, n, st, pct] of problems.quits) if (st >= 5 && pct >= 50) tips.push({ k: 'quit', g, n, st });
  for (const [where, n] of problems.stuck) if (n >= 3) tips.push({ k: 'stuck', where, n });
  for (const [e, n, dv] of problems.errors.slice(0, 3)) tips.push({ k: 'error', e, n, dv });
  for (const d of devices) if (d.fps != null && d.fps < 25) tips.push({ k: 'slow', d: who(d), fps: d.fps });
  const newest = Object.keys(count(d => d.build)).filter(isBuild).sort((a, b) => buildRank(a) - buildRank(b)).pop();
  for (const d of devices) if (d.days && newest && isBuild(d.build) && d.build !== newest) tips.push({ k: 'old', d: who(d), build: d.build, newest });
  const quiet = day(now - 7 * 864e5);
  for (const d of devices) if (d.last && d.last < quiet && d.days) tips.push({ k: 'quiet', d: who(d), last: d.last });
  for (const d of devices) for (const K of d.kids) if (K.age === 'little' && K.mins > 30 && K.simpleMins < K.mins * .2) tips.push({ k: 'simple', name: K.name, d: who(d) });
  // (#36) start-up by kind of device: the median time to a built valley over each kind's devices (seconds)
  const startup = {}; for (const k of ['phone', 'tablet', 'computer']) { const v = devices.filter(d => d.kind === k && d.startup).map(d => (d.startup.ready ?? d.startup.readyFirst) * 1000).filter(x => x > 0); if (v.length) startup[k] = { devices: v.length, ready: med(v) }; }
  // (battery round) by kind of device, `power`: the middle of each kind's devices
  const mid = a => { const v = a.filter(x => x != null).sort((x, y) => x - y); return v.length ? v[v.length >> 1] : null; };
  const power = {}; for (const k of ['phone', 'tablet', 'computer']) { const ds = devices.filter(d => d.kind === k && d.power); if (ds.length) power[k] = { devices: ds.length, fps: mid(ds.map(d => d.power.fps)), frameMs: mid(ds.map(d => d.power.frameMs)), draws: mid(ds.map(d => d.power.draws)), batteryPerHour: mid(ds.map(d => d.power.batteryPerHour)) }; }
  // (r80, owner 17 Oct AEDT) installations not seen for 30 days or more, by the version they last had
  const away = day(now - 30 * 864e5), away30 = {}; for (const d of devices) if (d.last && d.last < away) away30[d.build] = (away30[d.build] || 0) + 1;
  const famMap: Record<string, string[]> = {};
  for (const d of devices) if (d.family) (famMap[d.family] = famMap[d.family] || []).push(d.id);
  const famEntries = Object.entries(famMap).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const famLinked = famEntries.reduce((a, [, ids]) => a + ids.length, 0);
  const families = { count: famEntries.length, linkedDevices: famLinked, devicesPerFamily: famEntries.length ? +(famLinked / famEntries.length).toFixed(1) : 0, list: famEntries.slice(0, 50).map(([fh, ids]) => ({ fh, devices: ids.length, ids })) };
  const installations = { confirmed: devices.filter(d => !!d.installation).length, lastStandalone: devices.filter(d => d.app).length, unconfirmed: devices.filter(d => !d.installation).length };
  return { installations, away30, families, latestBuilds:count(d=>d.build),startup, power, onlineNow: devices.filter(d => d.online).length, hours, places: top(places, 15), devices:devices.slice(0,100), deviceListTotal:devices.length, deviceListLimit:100, os: count(d => d.os), browsers: count(d => d.br), locations: count(d => d.loc ? [d.loc.city, d.loc.region, d.loc.country].filter(Boolean).join(', ') : '?'), problems, tips: tips.slice(0, 20) };
}
// a name the family gives a device in Studio ("Na's iPad")
export async function setLabel(S, id, label) { if (!ID.test(id || '')) return false; const l = String(label || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 40); if (l) await S.set('label/' + id, l); else await S.delete('label/' + id); return true; }

// the missing lines inbox, most asked-for first
export async function inbox(S) {
  const blobs = (await listAll(S, 'line/')).slice(0, 2000), out = (await each(blobs, (b): Promise<LineRecord | null> => S.get(b.key, { type: 'json' }))).filter(Boolean);
  return out.sort((a, b) => b.n - a.n).slice(0, 600);
}
