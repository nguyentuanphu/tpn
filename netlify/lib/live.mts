import { parseReportingPolicy } from '../../js/core/reporting-policy.ts';
// Releases and festival changes that reach the children's devices at once (round R, owner: "instant, no deploy").
// Sparkle Studio online saves them here (Netlify Blobs store "live", key "live"); the game reads them from /api/live.
// Only well-formed values are kept, so nothing odd can reach a device.
// a release and a festival as Studio sends them and as they are kept (every field is checked again here)
export type Policy = { revert?: string, speed?: string, autoplay?: boolean };
export type Release = { on?: boolean, start?: string, since?: string, controlVersion?: number, days?: number, newDays?: number, devices?: string[],
  levels?: Record<string, string>, peeks?: string[], revert?: string, policies?: Record<string, Policy> };
export type Festival = { on?: boolean, date?: string, buildup?: number | string, deco?: number | string };
export type Live = { releases: Record<string, Release>, festivals: Record<string, Festival>, at?: string, by?: string };
const ID = /^[\w-]{1,40}$/, DATE = /^\d{4}-\d\d-\d\d$/, MD = /^\d\d-\d\d$/;
const int = (v, max) => Number.isInteger(+v) && +v >= 0 ? Math.min(max, +v) : undefined;
export function cleanLive(b: { releases?: Record<string, Release>, festivals?: Record<string, Festival> }): Live {
  const out: Live = { releases: {}, festivals: {} };
  for (const [id, r] of Object.entries((b && b.releases) || {})) {
    if (!ID.test(id) || !r || typeof r !== 'object') continue;
    const x: Release = {}; if (typeof r.on === 'boolean') x.on = r.on; if (DATE.test(r.start || '')) x.start = r.start; if (DATE.test(r.since || '')) x.since = r.since;
    if (id === 'wayfind' && r.controlVersion === 1) x.controlVersion = 1;
    const d = int(r.days, 3650), n = int(r.newDays, 365); if (d) x.days = d; if (n) x.newDays = n;
    // (owner, 12 Oct) only on these devices (the game's player ids, as in the players report), e.g. the auto play check
    if (Array.isArray(r.devices)) { const dv = [...new Set(r.devices.filter(v => typeof v === 'string' && /^[a-z0-9]{12}$/.test(v)))].slice(0, 50); if (dv.length) x.devices = dv; }
    // (owner, 12 Oct: tester reports) each ticked device's level (auto reports only, or with the ladybird), and the
    // releases testers see early (sneak peeks)
    if (r.levels && typeof r.levels === 'object') { const lv: Record<string, string> = {}; for (const [d, v] of Object.entries(r.levels).slice(0, 50)) if (/^[a-z0-9]{12}$/.test(d) && (v === 'auto' || v === 'ladybird')) lv[d] = v; if (Object.keys(lv).length) x.levels = lv; }
    if (Array.isArray(r.peeks)) { const pk = [...new Set(r.peeks.filter(v => typeof v === 'string' && ID.test(v)))].slice(0, 20); if (pk.length) x.peeks = pk; }
    // (owner, 13 Oct AEDT) the tester rule: what goes back when someone stops being a tester (js/content/autoplay.js REVERT)
    if (['keep', 'autoplay', 'progress'].includes(r.revert)) x.revert = r.revert;
    if (r.policies && typeof r.policies === 'object') { const policies: Record<string, Policy> = {}; for (const [device, value] of Object.entries(r.policies).slice(0, 50)) { if (!/^[a-z0-9]{12}$/.test(device) || !value || typeof value !== 'object') continue; const p: Policy = {}; if (['keep', 'autoplay', 'progress'].includes(value.revert)) p.revert = value.revert; if (['x1', 'x2', 'x3', 'x5', 'watch', 'fast'].includes(value.speed)) p.speed = value.speed; if (typeof value.autoplay === 'boolean') p.autoplay = value.autoplay; if (Object.keys(p).length) policies[device] = p; } if (Object.keys(policies).length) x.policies = policies; }
    if (Object.keys(x).length) out.releases[id] = x;
  }
  for (const [id, f] of Object.entries((b && b.festivals) || {})) {
    if (!ID.test(id) || !f || typeof f !== 'object') continue;
    const x: Festival = {}; if (typeof f.on === 'boolean') x.on = f.on; if (DATE.test(f.date || '') || MD.test(f.date || '')) x.date = f.date;
    const bu = int(f.buildup, 60); if (bu != null && f.buildup !== '' && f.buildup != null) x.buildup = bu;
    // (owner, 13 Oct) how much it decorates: 1 (as before), 2, 3, 5 (the default, so not kept) or 7 times
    if ([1, 2, 3, 7].includes(+f.deco)) x.deco = +f.deco;
    if (Object.keys(x).length) out.festivals[id] = x;
  }
  return out;
}
// (round R privacy, 9 Oct) what every device gets from /api/live: the rules and when they changed, never who changed them
export const publicLive = (v: Live | null, c: { content?: Record<string, unknown>, at?: string } | null) => { const o: { releases: Live['releases'], festivals: Live['festivals'], at?: string, content?: Record<string, unknown>, contentAt?: string } = { releases: (v && v.releases) || {}, festivals: (v && v.festivals) || {} }; if (v && v.at) o.at = v.at; if (c && c.content && Object.keys(c.content).length) { o.content = c.content; if (c.at) o.contentAt = c.at; } return o; };
export const readLive = async S => (await S.get('live', { type: 'json' }).catch(() => null)) || { releases: {}, festivals: {} };
export const saveLive = async (S, body, by) => { const v = { ...cleanLive(body), at: new Date().toISOString(), by: String(by || '').slice(0, 40) }; await S.setJSON('live', v); return v; };

// ---------- the content pages, live at once (owner, 17 Oct AEDT, r81: "go live without Publish") ----------
// Message, Missions, Quiz, Our stories, Villagers (names, voices and photo links), Story characters, Memory Villages,
// Simple screen, Defaults and Ads settings: Studio saves them here (Netlify Blobs store "live", key "content") and every
// device gets them from /api/live. A section kept here wins over the same one in content/custom.json; a section never
// saved here leaves custom.json's in use. Only these sections and their own keys are kept, every text has a limit, and
// the whole answer stays small, because it goes to every device each time the game opens.
export const LIVE_SECTIONS = ['message', 'missions', 'quiz', 'tales', 'names', 'genders', 'faces', 'looks', 'plots', 'activities', 'defaults', 'features', 'ads', 'album', 'itemAvailability', 'reportingPolicy'];
export const CONTENT_MAX = 200 * 1024;
export class LiveError extends Error { declare why: string; declare where: string; declare n: number; constructor(why: string, where: string, n: number) { super(why + ' ' + where); this.why = why; this.where = where; this.n = n; } }
const BAD_KEY = new Set(['__proto__', 'constructor', 'prototype']);
const KEY = k => typeof k === 'string' && k.length >= 1 && k.length <= 60 && !BAD_KEY.has(k) && !/[\u0000-\u001f<>"]/.test(k);
const HEX = /^#[0-9a-f]{6}$/i, FAMPHOTO = /^family:[\w-]{24,64}$/;
// a text: control characters taken out (new lines kept), never longer than n letters (longer is refused, not cut)
const txt = (v, n, where) => { if (v == null) return undefined; if (typeof v !== 'string') return undefined; const s = v.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim(); if ([...s].length > n) throw new LiveError('long', where, n); return s; };
const pair = (v, n, where) => Array.isArray(v) ? [txt(v[0], n, where) || '', txt(v[1], n, where) || ''] : undefined;
const put = (o, k, v) => { if (v !== undefined && v !== '') o[k] = v; };
const entries = <T,>(o: Record<string, T> | undefined, max: number): [string, T][] => o && typeof o === 'object' && !Array.isArray(o) ? Object.entries(o).filter(([k]) => KEY(k)).slice(0, max) : [];
const list = (v, max) => Array.isArray(v) ? v.filter(x => x && typeof x === 'object').slice(0, max) : [];
// the content sections' own shapes (two languages: [English, Vietnamese])
type Words = { en?: string, vi?: string };
type Pair = [string, string];
type Face = { photo?: string, skin?: string };
type Look = { style?: string, color?: string, hair?: string, skin?: string, hairStyle?: string };
type Plot = { type?: string, name?: Pair, color?: string, owner?: { name?: string, line?: Pair } };
type Activity = { area?: string, little?: boolean, hide?: boolean };
type Ad = { image?: string, by?: string, en?: string, vi?: string, link?: string, where?: string[], active?: boolean };
const CLEAN = {
  message: v => { const o = {}; if (v && typeof v === 'object') { put(o, 'en', txt(v.en, 600, 'message')); put(o, 'vi', txt(v.vi, 600, 'message')); } return o; },
  missions: v => list(v, 12).map(m => { const o: Words & { id?: string, who?: string } = {}; put(o, 'id', /^[\w-]{1,40}$/.test(m.id || '') ? m.id : undefined); put(o, 'en', txt(m.en, 200, 'missions')); put(o, 'vi', txt(m.vi, 200, 'missions')); put(o, 'who', txt(m.who, 60, 'missions')); return o; }).filter(m => m.id && (m.en || m.vi)),
  quiz: v => list(v, 60).map(q => { const answers = (Array.isArray(q.answers) ? q.answers : []).filter(Array.isArray).slice(0, 6).map(a => pair(a, 120, 'quiz'));
    const o = { q: pair(q.q, 300, 'quiz'), answers, right: Number.isInteger(q.right) ? q.right : -1 }; put(o, 'pic', txt(q.pic, 200, 'quiz')); return o; }).filter(q => q.q && (q.q[0] || q.q[1]) && q.answers.length >= 2 && q.right >= 0 && q.right < q.answers.length),
  tales: v => list(v, 30).map(t => { const o: Words & { id?: string, flag?: string, pages?: string[][] } = {}; put(o, 'id', /^[\w-]{1,40}$/.test(String(t.id || '')) ? String(t.id) : undefined); put(o, 'flag', txt(t.flag, 16, 'tales')); put(o, 'en', txt(t.en, 120, 'tales')); put(o, 'vi', txt(t.vi, 120, 'tales'));
    o.pages = (Array.isArray(t.pages) ? t.pages : []).filter(Array.isArray).slice(0, 40).map(p => [txt(p[0], 200, 'tales') || '', txt(p[1], 600, 'tales') || '', txt(p[2], 600, 'tales') || '']); return o; }).filter(t => t.id && t.pages.length),
  names: (v: Record<string, Words>) => Object.fromEntries(entries(v, 400).map(([k, n]): [string, Words] => { const o: Words = {}; if (n && typeof n === 'object') { put(o, 'en', txt(n.en, 60, 'names')); put(o, 'vi', txt(n.vi, 60, 'names')); } return [k, o]; }).filter(([, o]) => o.en || o.vi)),
  genders: v => Object.fromEntries(entries(v, 800).filter(([, g]) => g === 'f' || g === 'm')),
  // photo links only: the photo itself is already in the private family store (or an old content/faces file)
  faces: (v: Record<string, Face>) => Object.fromEntries(entries(v, 400).map(([k, f]): [string, Face] => { const o: Face = {}; if (f && typeof f === 'object' && (FAMPHOTO.test(f.photo || '') || /^content\/faces\/[\w.-]+\.(jpg|jpeg|png)$/.test(f.photo || ''))) { o.photo = f.photo; if (HEX.test(f.skin || '')) o.skin = f.skin; } return [k, o]; }).filter(([, o]) => o.photo)),
  looks: (v: Record<string, Look>) => Object.fromEntries(entries(v, 3).filter(([k]) => ['chi', 'jack', 'ruby'].includes(k)).map(([k, L]) => { const o: Look = {}; if (L && typeof L === 'object') { put(o, 'style', txt(L.style, 20, 'looks')); for (const c of ['color', 'hair', 'skin']) if (HEX.test(L[c] || '')) o[c] = L[c]; put(o, 'hairStyle', txt(L.hairStyle, 20, 'looks')); } return [k, o]; }).filter(([, o]) => Object.keys(o).length)),
  plots: (v: Record<string, Plot>) => Object.fromEntries(entries(v, 200).map(([k, p]) => { const o: Plot = {}; if (p && typeof p === 'object') { put(o, 'type', txt(p.type, 30, 'plots')); put(o, 'name', pair(p.name, 80, 'plots')); if (HEX.test(p.color || '')) o.color = p.color;
    if (p.owner && typeof p.owner === 'object') { const w: Plot['owner'] = {}; put(w, 'name', txt(p.owner.name, 60, 'plots')); put(w, 'line', pair(p.owner.line, 200, 'plots')); if (Object.keys(w).length) o.owner = w; } } return [k, o]; }).filter(([, o]) => Object.keys(o).length)),
  activities: (v: Record<string, Activity>) => Object.fromEntries(entries(v, 400).map(([k, a]) => { const o: Activity = {}; if (a && typeof a === 'object') { if (/^[a-z]{2,20}$/.test(a.area || '')) o.area = a.area; if (typeof a.little === 'boolean') o.little = a.little; if (a.hide === true) o.hide = true; } return [k, o]; }).filter(([, o]) => Object.keys(o).length)),
  reportingPolicy: v => { const policy=parseReportingPolicy(v);if(!policy)throw new LiveError('invalid','reportingPolicy',0);return policy; },
  itemAvailability: v => Object.fromEntries(Object.entries(v && typeof v === 'object' && !Array.isArray(v) ? v : {}).filter(([key,value]) => /^(game|story):[a-z0-9][a-z0-9_-]{0,59}$/.test(key) && typeof value === 'boolean').slice(0,2000)),
  defaults: v => Object.fromEntries(entries(v, 30).filter(([, d]) => typeof d === 'boolean' || (typeof d === 'number' && Number.isFinite(d) && d >= 0 && d <= 1000) || (typeof d === 'string' && /^[\w-]{1,10}$/.test(d)))),
  features: v => Object.fromEntries(entries(v, 200).filter(([k, f]) => /^[\w-]{1,40}$/.test(k) && typeof f === 'boolean')),
  // the settings of the family's ads; a picture is a file of the game (content/ads/) and still comes with Publish
  ads: v => { const o: { enabled: boolean, perDay: number, items?: Ad[] } = { enabled: !!(v && v.enabled === true), perDay: Math.max(0, Math.min(10, (v && v.perDay) | 0)) };
    o.items = list(v && v.items, 30).map(x => { const i: Ad = {}; if (/^content\/ads\/[\w.-]+\.(jpg|jpeg|png)$/.test(x.image || '')) i.image = x.image; put(i, 'by', txt(x.by, 60, 'ads')); put(i, 'en', txt(x.en, 120, 'ads')); put(i, 'vi', txt(x.vi, 120, 'ads'));
      if (/^https:\/\/[^\s"'<>]{1,300}$/.test(x.link || '')) i.link = x.link; if (Array.isArray(x.where)) i.where = x.where.filter(w => w === 'boards' || w === 'gameend'); if (x.active === false) i.active = false; return i; }); return o; },
  album: v => list(v, 60).map(x => { const o: Words & { id?: string, photo?: string, place?: string } = {}; put(o, 'id', /^[\w-]{1,40}$/.test(x.id || '') ? x.id : undefined); if (FAMPHOTO.test(x.photo || '') || /^content\/album\/[\w.-]+\.jpg$/.test(x.photo || '')) o.photo = x.photo; put(o, 'en', txt(x.en, 120, 'album')); put(o, 'vi', txt(x.vi, 120, 'album')); if (/^[a-z]{2,16}$/.test(x.place || '')) o.place = x.place; return o; }).filter(x => x.photo)
};
// only the sections named here; a section that is null is taken off (custom.json's is used again). Throws LiveError
// ('long' with the section, or 'big' with the size) instead of keeping something too big.
export function cleanContent(b) {
  const out: Record<string, unknown> = {};
  for (const k of LIVE_SECTIONS) if (b && Object.prototype.hasOwnProperty.call(b, k)) out[k] = b[k] === null ? null : CLEAN[k](b[k]);
  return out;
}
export const contentSize = c => Buffer.byteLength(JSON.stringify(c || {}));
export const readContent = async S => { const c = await S.get('content', { type: 'json' }).catch(() => null); return c && typeof c === 'object' && c.content && typeof c.content === 'object' ? c : { content: {} }; };
// saves the sections sent and keeps the others as they were
export const saveContent = async (S, body, by) => {
  const now = await readContent(S), sent = cleanContent(body && body.content), next = { ...now.content };
  for (const [k, v] of Object.entries(sent)) { if (v === null) delete next[k]; else next[k] = v; }
  const size = contentSize(next); if (size > CONTENT_MAX) throw new LiveError('big', 'content', Math.ceil(size / 1024));
  const v = { content: next, at: new Date().toISOString(), by: String(by || '').slice(0, 40) }; await S.setJSON('content', v); return v;
};
