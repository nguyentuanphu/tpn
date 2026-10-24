// Tester reports (owner, 12 Oct 2026 AEDT; brief docs/cores/tasks/tester-reports.md). A tester device (Studio's Releases
// page: switch `tester`, every device or the ticked ones) sends what went wrong, by itself or from the ladybird; the
// reports are kept here (Netlify Blobs store "testers") and grouped into problems, one per kind, detail and place, with a
// count, the devices and versions that met it and a status Studio sets: new → fixing → fixed in rNN → confirmed / back,
// or not a bug, or the same as another. Tester devices ask for their own problems' status (the fixed tick, the retest
// and the rewards). (PRIV-016) only devices the switch covers are heard; reports keep the players' names because the
// tester accepted that; nothing here is ever public.
import { createHash } from 'node:crypto';
import { BUILD_RE, buildRank } from './build-number.mts';

export const TLIMITS = { size: 320000, device: 60, ip: 150, problems: 3000, keepDays: 60, reportsPerProblem: 20, note: 600, log: 300, errors: 20 };
const ID = /^[a-z0-9]{12}$/, KINDS = ['broken', 'looks', 'words', 'sound', 'idea', 'auto'], AUTOS = ['error', 'noopen', 'noclose', 'freeze', 'slow', 'offscreen', 'novoice', 'stuck', 'autoplay'];
export const STATUSES = ['new', 'fixing', 'fixed', 'confirmed', 'back', 'notbug', 'dup'];
// (r89.1, owner 23 Oct AEDT) a build is r and a whole number, or one with a point release (r89.1); builds compare as numbers
const BUILD = BUILD_RE, PK = /^[a-f0-9]{16}$/;
const day = t => new Intl.DateTimeFormat('en-CA', { timeZone:'Australia/Sydney', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date(t));
const txt = (v, n) => typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n) : '';
const num = (v, lo, hi) => Number.isFinite(+v) ? Math.max(lo, Math.min(hi, +v)) : undefined;
const sha = s => createHash('sha1').update(s).digest('hex').slice(0, 16);
const rnd = () => createHash('sha1').update(String(Math.random()) + Date.now()).digest('hex').slice(0, 16);

// is this device a tester? (the release rule saved by Studio: { on, devices, levels, peeks })
export function testerRule(live) { const r = live && live.releases && live.releases.tester; return r && typeof r === 'object' ? r : null; }
export function isTester(live, id) {
  const r = testerRule(live); if (!r || r.on !== true || !ID.test(id || '')) return false;
  const list = Array.isArray(r.devices) ? r.devices : []; return !list.length || list.includes(id);
}

// a report as it is kept: every field checked (type, size, range: PRIV-003)
export function cleanReport(b, now = Date.now()) {
  if (!b || typeof b !== 'object' || !ID.test(b.id || '')) return null;
  const kind = KINDS.includes(b.kind) ? b.kind : null; if (!kind) return null;
  const auto = kind === 'auto' ? (AUTOS.includes(b.auto) ? b.auto : null) : null; if (kind === 'auto' && !auto) return null;
  const w = b.where && typeof b.where === 'object' ? b.where : {};
  // Device profiles do not identify the person submitting a report.
  const rep = b.reporter && typeof b.reporter === 'object' ? b.reporter : null;
  const reporter = kind === 'auto'
    ? { type: 'auto', name: auto || 'detector' }
    : rep && rep.type === 'player' && txt(rep.name, 30)
      ? { type: 'player', name: txt(rep.name, 30) }
      : { type: 'unknown', name: '' };
  const r = {
    clientId: /^[a-f0-9]{32}$/.test(b.clientId || '') ? b.clientId : '', id: b.id, at: now, b: BUILD.test(b.b || '') ? b.b : '', kind, auto, detail: txt(b.detail, 200), note: txt(b.note, TLIMITS.note), spoken: b.spoken === true,
    where: { area: txt(w.area, 60), place: txt(w.place, 60), game: txt(w.game, 60), window: txt(w.window, 80), x: num(w.x, -5000, 5000), z: num(w.z, -5000, 5000) },
    join: PK.test(b.join || '') ? b.join : '',
    errors: (Array.isArray(b.errors) ? b.errors : []).slice(-TLIMITS.errors).map(e => txt(e, 200)).filter(Boolean),
    log: (Array.isArray(b.log) ? b.log : []).slice(-TLIMITS.log).filter(e => Array.isArray(e)).map(([t, k, s]) => [num(t, -600, 600) || 0, txt(k, 12), txt(s, 120)]),
    dev: (d => ({ os: txt(d.os, 20), br: txt(d.br, 20), sc: txt(d.sc, 12), lang: txt(d.lang, 4), fps: num(d.fps, 0, 240), mem: num(d.mem, 0, 64), label: txt(d.label, 40) }))(b.dev && typeof b.dev === 'object' ? b.dev : {}),
    players: (Array.isArray(b.players) ? b.players : []).slice(0, 8).filter(p => p && typeof p === 'object').map(p => ({ name: txt(p.name, 30), age: txt(p.age, 10), coins: num(p.coins, 0, 1e7), stars: num(p.stars, 0, 1e5), level: txt(p.level, 20) })),
    reporter,
    count: num(b.count, 1, 999) || 1
  };
  const shot = typeof b.shot === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(b.shot) ? b.shot : '';
  return { r, shot };
}
// the problem a report belongs to: the game's own reports by kind, detail and place; a tester's note is its own problem
// unless they joined an open one ("Already reported → add to it")
export function problemKey(r) {
  if (r.join) return r.join;
  if (r.kind === 'auto') return sha(['auto', r.auto, r.detail.replace(/\d+(\.\d+)?/g, '#'), r.where.game || r.where.window || r.where.area].join('|'));
  return sha(['note', r.id, r.at, r.note].join('|'));
}
const titleOf = r => r.kind === 'auto' ? `${r.auto}: ${r.detail || r.where.game || r.where.window || r.where.area}`.slice(0, 120) : (r.note || r.detail || r.kind).slice(0, 120);

// a device sends a report: { ok, k, rid, status } or { error, status } (403 not a tester, 429 too many, 400 bad)
export async function addReport(S, live, body, now = Date.now(), ipk = '') {
  const c = cleanReport(body, now); if (!c) return { error: 'bad report', status: 400 };
  const { r, shot } = c; if (!isTester(live, r.id)) return { error: 'not a tester', status: 403 };
  const receiptKey = r.clientId ? `receipt/${r.id}/${r.clientId}` : '';
  if (receiptKey) { const receipt = await S.get(receiptKey, { type: 'json' }); if (receipt) return receipt; }
  const d = day(now), qd = `q/${d}/d/${r.id}`, qi = `q/${d}/i/${ipk || 'x'}`;
  const nd = (+(await S.get(qd)) || 0) + 1, ni = (+(await S.get(qi)) || 0) + 1;
  if (nd > TLIMITS.device || ni > TLIMITS.ip) return { error: 'too many reports today', status: 429 };
  await S.set(qd, String(nd)); await S.set(qi, String(ni));
  const rid = rnd(), k = problemKey(r);
  await S.setJSON(`r/${rid}`, { ...r, rid, k, shot: !!shot }); if (shot) await S.set(`shot/${rid}`, shot);
  let p = await S.get(`p/${k}`, { type: 'json' });
  if (!p) {
    if (r.join) return { error: 'no such problem', status: 400 };
    p = { k, kind: r.kind, auto: r.auto, title: titleOf(r), where: r.where, firstAt: now, n: 0, devices: [], builds: [], reports: [], status: 'new', kinds: {}, spoken: false };
  }
  if (p.status === 'fixed' || p.status === 'confirmed') { if (r.b && p.fixedIn && buildRank(r.b) >= buildRank(p.fixedIn)) p.status = 'back'; }
  p.n += r.count; p.lastAt = now; p.kinds[r.kind] = (p.kinds[r.kind] || 0) + 1; if (r.spoken) p.spoken = true;
  if (!p.devices.includes(r.id)) p.devices.push(r.id); if (r.b && !p.builds.includes(r.b)) p.builds.push(r.b);
  p.reports = [...p.reports, rid].slice(-TLIMITS.reportsPerProblem); p.devices = p.devices.slice(-200); p.builds = p.builds.slice(-20);
  if (r.kind !== 'auto' && p.kind === 'auto') p.title = titleOf(r) + ' (' + p.title + ')';
  await S.setJSON(`p/${k}`, p);
  const t = (await S.get(`t/${r.id}`, { type: 'json' })) || { id: r.id, firstAt: now, reports: 0, mine: [], helped: [] };
  t.reports++; t.lastAt = now; t.label = r.dev.label || t.label || ''; t.players = r.players.map(p => p.name).filter(Boolean).slice(0, 8); t.os = r.dev.os; t.b = r.b;
  if (!t.mine.includes(k)) t.mine = [...t.mine, k].slice(-300);
  t.kinds = t.kinds || {}; t.kinds[k] = r.kind;
  await S.setJSON(`t/${r.id}`, t);
  const receipt = { ok: true, k, rid, status: p.status, at:now }; if (receiptKey) await S.setJSON(receiptKey, receipt); return receipt;
}

// (r89: the hourly tester-issues robot got 504 for the list from 22 Oct) the store is read many at a time, never one by one
// (as Analytics, netlify/lib/players.mts): hundreds of problems one after another ran past the function's time limit
const POOL = 16;
async function readJSON(S, keys: string[]) { const out = new Array(keys.length); let i = 0; await Promise.all(Array.from({ length: Math.min(POOL, keys.length) }, async () => { while (i < keys.length) { const j = i++; out[j] = await S.get(keys[j], { type: 'json' }); } })); return out; }
const all = async (S, prefix, cap = 5000) => { const out = []; let cursor; do { const l = await S.list({ prefix, cursor }); for (const b of l.blobs) out.push(b.key); cursor = l.cursor; } while (cursor && out.length < cap); return out; };
const short = p => ({ k: p.k, kind: p.kind, auto: p.auto, title: p.title, where: p.where, n: p.n, devices: p.devices.length, builds: p.builds, firstAt: p.firstAt, lastAt: p.lastAt, status: p.status, fixedIn: p.fixedIn || '', dupOf: p.dupOf || '', issue: p.issue || 0, spoken: !!p.spoken, kinds: p.kinds });
export async function problems(S) {
  const out = (await readJSON(S, await all(S, 'p/'))).filter(Boolean).map(short);
  return out.sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
}
// the weekly star: the device whose reports helped most in the last 7 days
export const starOf = (testers, now = Date.now()) => { let best = null, n = 0; for (const t of testers) { const c = (t.helped || []).filter(h => now - h.at < 7 * 864e5).length; if (c > n) { n = c; best = t.id; } } return best; };
export async function testers(S, now = Date.now()) {
  const out = (await readJSON(S, await all(S, 't/'))).filter(Boolean);
  const star = starOf(out, now);
  return out.map(t => ({ id: t.id, label: t.label || '', players: t.players || [], os: t.os || '', b: t.b || '', firstAt: t.firstAt, lastAt: t.lastAt, reports: t.reports || 0, helped: (t.helped || []).length, star: t.id === star, accepted: t.accepted || 0 })).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
}
// the daily summary: new, fixed and open, and the problems the most testers met
export function summary(list, now = Date.now()) {
  const today = day(now), on = (t, d) => t && day(t) === d;
  const open = list.filter(p => ['new', 'fixing', 'back'].includes(p.status));
  return { day: today, new: list.filter(p => on(p.firstAt, today)).length, fixed: list.filter(p => p.status === 'fixed' && on(p.fixedAt || p.lastAt, today)).length, open: open.length,
    top: [...open].sort((a, b) => b.devices - a.devices || b.n - a.n).slice(0, 5).map(p => ({ k: p.k, title: p.title, devices: p.devices, n: p.n })) };
}
export async function overview(S, now = Date.now()) { const list = await problems(S); return { problems: list, testers: await testers(S, now), summary: summary(list, now) }; }
// one problem with its reports (Studio's details: notes, players, errors, the replay as steps; the screenshots by `shot`)
export async function problem(S, k) {
  if (!PK.test(k || '')) return null; const p = await S.get(`p/${k}`, { type: 'json' }); if (!p) return null;
  const reports = (await readJSON(S, p.reports.map(rid => `r/${rid}`))).filter(Boolean);
  return { ...short(p), devices: p.devices, reports };
}
export const shotOf = async (S, rid) => /^[a-f0-9]{16}$/.test(rid || '') ? await S.get(`shot/${rid}`) : null;
// Studio sets a problem's status: { status, fixedIn: 'v1.01' (older: 'rNN'), dupOf: k, issue: n }; fixed and confirmed count as help for
// every device that reported it (the badges, the coins and the weekly star)
export async function setProblem(S, k, b, now = Date.now()) {
  if (!PK.test(k || '')) return null; const p = await S.get(`p/${k}`, { type: 'json' }); if (!p || !b || typeof b !== 'object') return null;
  if (STATUSES.includes(b.status)) p.status = b.status;
  if (BUILD.test(b.fixedIn || '')) { p.fixedIn = b.fixedIn; if (!b.status) p.status = 'fixed'; }
  if (b.status === 'fixed') p.fixedAt = now;
  if (PK.test(b.dupOf || '') && b.dupOf !== k) { p.dupOf = b.dupOf; p.status = 'dup';
    const q = await S.get(`p/${b.dupOf}`, { type: 'json' }); if (q) { q.n += p.n; q.devices = [...new Set([...q.devices, ...p.devices])]; q.reports = [...q.reports, ...p.reports].slice(-TLIMITS.reportsPerProblem); await S.setJSON(`p/${b.dupOf}`, q); } }
  if (Number.isInteger(b.issue) && b.issue > 0) p.issue = b.issue;
  await S.setJSON(`p/${k}`, p);
  if (['fixed', 'confirmed'].includes(p.status)) for (const id of p.devices) {
    const t = await S.get(`t/${id}`, { type: 'json' }); if (!t) continue;
    t.helped = t.helped || []; if (!t.helped.some(h => h.k === k)) { t.helped.push({ k, at: now, kind: (t.kinds || {})[k] || p.kind }); await S.setJSON(`t/${id}`, t); }
  }
  return short(p);
}
// a tester device asks how its reports are doing: { mine, open, helped, kinds, star, retest }
//   mine: its problems' status (the fixed tick), open: the problems still open (the "already reported" hint),
//   retest: its problems fixed in this version or before (the device replays them), helped: reports that helped
export async function deviceStatus(S, live, id, build, now = Date.now()) {
  if (!isTester(live, id)) return null;
  const t = (await S.get(`t/${id}`, { type: 'json' })) || { id, mine: [], helped: [] }, mine = [];
  const minek = (t.mine || []).slice(-100), mp = await readJSON(S, minek.map(k => `p/${k}`));
  for (const [i, k] of minek.entries()) { const p = mp[i]; if (p) mine.push({ k, title: p.title, status: p.status, fixedIn: p.fixedIn || '', kind: (t.kinds || {})[k] || p.kind, auto: p.auto || '', where: p.where, spoken: !!p.spoken }); }
  const list = await problems(S), b = Math.max(0, buildRank(build));
  const open = list.filter(p => ['new', 'fixing', 'back'].includes(p.status)).slice(0, 200).map(p => ({ k: p.k, title: p.title, where: p.where, n: p.n }));
  const retest = mine.filter(p => p.status === 'fixed' && p.fixedIn && b >= buildRank(p.fixedIn) && p.kind === 'auto');
  const star = starOf((await readJSON(S, await all(S, 't/'))).filter(Boolean), now) === id;
  return { mine, open, retest, helped: (t.helped || []).length, helpedKinds: [...new Set((t.helped || []).map(h => h.kind))], reports: t.reports || 0, star, peeks: Array.isArray((testerRule(live) || {}).peeks) ? testerRule(live).peeks : [] };
}
// a tester device tells: accepted the agreement, or a retest result (fixed: still fixed → confirmed; not: back)
export async function deviceSays(S, live, b, now = Date.now()) {
  if (!b || !isTester(live, b.id)) return false;
  const t = (await S.get(`t/${b.id}`, { type: 'json' })) || { id: b.id, firstAt: now, reports: 0, mine: [], helped: [] };
  if (b.accepted === true) { t.accepted = now; t.label = txt((b.dev || {}).label, 40) || t.label || ''; await S.setJSON(`t/${b.id}`, t); return true; }
  if (PK.test(b.k || '') && typeof b.fixed === 'boolean' && (t.mine || []).includes(b.k)) {
    const p = await S.get(`p/${b.k}`, { type: 'json' }); if (!p || !['fixed', 'confirmed', 'back'].includes(p.status)) return false;
    p.status = b.fixed ? 'confirmed' : 'back'; p.checkedAt = now; await S.setJSON(`p/${b.k}`, p);
    if (b.fixed) await setProblem(S, b.k, {}, now); return true;
  }
  return false;
}
// housekeeping: reports and screenshots older than 60 days, counters older than 2 days
export async function tidy(S, now = Date.now()) {
  const old = day(now - TLIMITS.keepDays * 864e5), q = day(now - 2 * 864e5); let n = 0;
  for (const k of await all(S, 'q/')) if (k.slice(2, 12) < q) { await S.delete(k); n++; }
  for (const k of await all(S, 'r/')) { const r = await S.get(k, { type: 'json' }); if (r && day(r.at) < old) { await S.delete(k); await S.delete('shot/' + r.rid); n++; } }
  for (const key of await all(S, 'receipt/')) { const receipt = await S.get(key, { type:'json' }); if (!receipt?.at || day(receipt.at) < old) { await S.delete(key); n++; } }
  return n;
}
