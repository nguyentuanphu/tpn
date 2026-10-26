// Festivals on real dates (round R, owner, 8 Oct): every festival in js/content/festcal.js, worked out from the device's
// own calendar every year (js/lunar.js), no internet needed.
//   · Build-up: a party festival decorates its own places for 3 weeks before, a little more each week (stage 1 three
//     weeks out, 2 two weeks out, 3 in the last week, 4 on the day). A quiet day shows only a few days before, gently.
//   · Each festival keeps to its own places, so two can run at once (Halloween in Aussie Corner while Diwali is in India).
//   · On the day: 08:00 a greeting and a present at the festival table, 15:00 the festival game, 18:30 the evening show
//     (17:30 when an under-5 is playing): fireworks, lantern parade or lights.
//   · Halloween: smiling pumpkins at doors; knock for "Trick or treat!", five treats make a pumpkin lantern keepsake.
//   · Grown-ups: Sparkle Studio switches a festival off, moves its date or changes its build-up (CUSTOM.festivals, live
//     from the website), or schedules it on its Releases page (fest_<id>: a start date and how many days); on the device,
//     the grown-ups' press-and-hold setting can follow the calendar, show one festival or none.
//   · (owner, 10 Oct) Only in season or when an admin schedules one: children never start a festival; whole places are
//     decorated along their streets (js/festdecor.js, which also tells a child about a festival from the calendar).
// The decorations are the valley's own 3D things (lanterns, bunting, pumpkins, trees, lamps), never pictures.
import { THREE, P, merge, toonVC, outline } from './gfx.js';
import { T } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { settings, saveProfiles, farm, saveFarm, reduceMotion } from './state.js';
import { heightAt, WATER, VILLAGE, CHINA, INDIA, AUSSIE, TOWN, MARKET, HOME, HOIAN, CITIES } from './world.js';
import { FEAST } from './data.js';
import { FESTCAL, DAY_PLAN, BUILDUP, GROUPS } from './content/festcal.js';
import { lunarDay, easter, nthWeekday } from './lunar.js';
import {festivalVisible} from './content/festival-visibility.js';
import {publicFestivals,onPublicFestivals,startPublicFestivals} from './festival-live.js';
const ruleOf=(id:string)=>publicFestivals()?publicFestivals().festivals[id]:festivalRule(id);
import { festivalRule, liveRule, releaseNew, onLive } from './custom.js';

const DAY = 864e5;
const at0 = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const parse = s => { const d = new Date(s + 'T00:00:00'); return Number.isNaN(+d) ? null : d; };
const pad = n => String(n).padStart(2, '0');
// ---------- dates ----------
// the first day of a festival in a given year (a grown-up's moved date wins)
export function festDate(F, year) {
  const r = ruleOf(F.id);
  if (r && typeof r.date === 'string') { if (/^\d{4}-\d\d-\d\d$/.test(r.date)) { if (+r.date.slice(0, 4) === year) return parse(r.date); } else if (/^\d\d-\d\d$/.test(r.date)) return parse(`${year}-${r.date}`); }
  const w = F.when;
  if (w.lunar) { const s = lunarDay(w.lunar[0], w.lunar[1], year); return s ? parse(s) : null; }
  if (w.date) return parse(`${year}-${pad(w.date[0])}-${pad(w.date[1])}`);
  if (w.easter != null) { const d = parse(easter(year)); return d && new Date(+d + w.easter * DAY); }
  if (w.nth) return parse(nthWeekday(year, w.nth[0], w.nth[1], w.nth[2]));
  if (w.table) return w.table[year] ? parse(w.table[year]) : null;
  return null;
}
const enabled = F => {const publicState=publicFestivals();return publicState?publicState.enabled.includes(F.id):festivalVisible(festivalRule(F.id),liveRule('fest_'+F.id));};
const buildupOf = F => { const r = ruleOf(F.id); return r && r.buildup >= 0 ? Math.min(60, r.buildup) : BUILDUP[F.kind] || 3; };
// the next time it happens on or after today: { F, start, end, daysTo (0 = today), on (it is on today) }
export function nextOf(F, now = new Date()) {
  const today = at0(now);
  for (const y of [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]) {
    const st = festDate(F, y); if (!st) continue;
    const end = new Date(+st + (F.days || 1) * DAY);
    if (end > today) return { F, start: st, end, daysTo: Math.max(0, Math.round((+st - +today) / DAY)), on: st <= today };
  }
  return null;
}
// every festival in date order, the soonest first (the calendar page)
export const upcoming = (now = new Date()) => FESTCAL.filter(enabled).map(F => nextOf(F, now)).filter(Boolean).sort((a, b) => +a.start - +b.start);
const byId = id => FESTCAL.find(F => F.id === id);
let previewing = null;   // a grown-up's preview from Sparkle Studio (?festival=<id>), this session only
let scheduled: (festival:unknown,now:Date)=>boolean = () => false; // (an admin's schedule in Studio, fest_<id>: js/festdecor.js, once a child plays)
// what decorates the valley now: each festival in its build-up or on its day, with how far along (stage 1–4)
export function activeFestivals(now = new Date()) {
  const pickOne = settings.festival || 'auto', out = [];
  if (pickOne !== 'none') {
    if (pickOne !== 'auto' && byId(pickOne)) out.push({ F: byId(pickOne), stage: 4, daysTo: 0, on: true });
    else {
      for (const n of upcoming(now)) {
        const b = buildupOf(n.F); if (n.daysTo > b) continue;
        out.push({ ...n, stage: n.on ? 4 : n.F.kind === 'quiet' ? 2 : n.daysTo <= 7 ? 3 : n.daysTo <= 14 ? 2 : 1 });
      }
      for (const F of FESTCAL) if (scheduled(F, now)) { const k = out.findIndex(a => a.F.id === F.id), v = { F, stage: 4, daysTo: 0, on: true, admin: true }; if (k >= 0) out[k] = v; else out.push(v); }
    }
  }
  if (previewing && byId(previewing)) { const k = out.findIndex(a => a.F.id === previewing); const v = { F: byId(previewing), stage: 4, daysTo: 0, on: true }; if (k >= 0) out[k] = v; else out.push(v); }
  return out.filter(a=>enabled(a.F));
}
// (older code and saves call this: the one festival that is on today, or null)
export function festivalToday(d = new Date()) { const a = activeFestivals(d).filter(x => x.on); return a.length ? a[0].F.id : null; }
export const FESTIVALS = Object.fromEntries(FESTCAL.map(F => [F.id, { ...F, name: () => T(F.en, F.vi) }]));
// a time of day like '18:30' on today's date
const todayAt = (hm, now = new Date()) => { const [h, m] = hm.split(':').map(Number); const d = new Date(now); d.setHours(h, m, 0, 0); return d; };
export const showTime = little => { const p = DAY_PLAN.find(x => x.what === 'show'); return (little && p.little) || p.at; };

// ---------- where ----------
// (round T) Hội An is a site for now (a circle, no streets): it gets the ring of pieces round its middle; Vũng Tàu is a city
type FestivalPlace={x?:number;z?:number;x0?:number;x1?:number;z0?:number;z1?:number;r?:number;roadZ?:number;h?:number};
const PLACES = ():Record<string,FestivalPlace> => ({ village: VILLAGE, china: CHINA, india: INDIA, aussie: AUSSIE, town: TOWN, market: MARKET, home: HOME, hoian: HOIAN, ...Object.fromEntries(CITIES.map(c => [c.id, c])) });
const centre = o => o.x != null ? { x: o.x, z: o.z } : { x: (o.x0 + o.x1) / 2, z: (o.z0 + o.z1) / 2 };

// ---------- decorations: the valley's own 3D things ----------
const mat = toonVC(), nightMat = new THREE.MeshBasicMaterial({ vertexColors: true });
const Sph = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h), Cyl = (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s), Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
// a string of little flags (or lanterns, or friendly bats) hanging between two posts, with a gentle sag
function bunting(a, b, cols, kind = 'flag', wall = false, supports = null) {
  const parts = [], glows = [];
  const [ax, ay, az] = a, [bx, by, bz] = b, n = Math.max(4, Math.round(Math.hypot(bx - ax, bz - az) / (kind === 'lantern' ? 1 : .7))), yaw = Math.atan2(bx - ax, bz - az);
  if (!wall) for (const [x, y, z] of [a, b]) { const key=x.toFixed(3)+','+z.toFixed(3),ground=heightAt(x,z),from=supports?.get(key)??ground; if(y>from+.02)parts.push(P(Cyl(.06,from>ground+.02?.06:.08,y-from,6),'#8a6a4a',[x,(y+from)/2,z]));if(supports)supports.set(key,Math.max(y,from)); }
  for (let i = 1; i < n; i++) {
    const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = ay + (by - ay) * t - Math.sin(t * Math.PI) * .7, c = cols[i % cols.length];
    if (kind === 'lantern') { parts.push(P(Cyl(.012, .012, .25, 3), '#3a2a20', [x, y - .1, z])); glows.push(P(Sph(.15, 8, 6), c, [x, y - .3, z], [0, 0, 0], [1, 1.25, 1]), P(Cyl(.08, .08, .05, 8), '#ffd23f', [x, y - .1, z])); }
    else if (kind === 'bat') parts.push(P(Box(.36, .12, .03), '#4a3a6a', [x, y - .12, z], [0, yaw + Math.PI / 2, 0]), P(Sph(.07), '#4a3a6a', [x, y - .1, z]));
    else parts.push(P(new THREE.ConeGeometry(.16, .32, 3), c, [x, y - .16, z], [Math.PI, yaw, 0]));
  }
  const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector3(ax + (bx - ax) * t, ay + (by - ay) * t - Math.sin(t * Math.PI) * .7, az + (bz - az) * t)); }
  parts.push(P(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, .012, 3, false), '#3a2a20'));
  return { parts, glows };
}
// a round, smiling pumpkin (two round eyes and a big smile: friendly, never scary); its face glows at night
const pumpkin = (x, y, z, s = 1, rot = 0) => {
  const parts = [], glows = [];
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; parts.push(P(Sph(.28 * s, 10, 8), k % 2 ? '#f08a24' : '#f59a32', [x + Math.cos(a) * .12 * s, y + .26 * s, z + Math.sin(a) * .12 * s], [0, 0, 0], [.8, .9, .8])); }
  parts.push(P(Cyl(.04 * s, .06 * s, .16 * s, 6), '#4f7a2a', [x, y + .56 * s, z], [.2, 0, .15]));
  const fx = Math.sin(rot), fz = Math.cos(rot), fr = .37 * s;
  for (const e of [-1, 1]) glows.push(P(Sph(.06 * s, 8, 6), '#ffd23f', [x + fx * fr + fz * e * .11 * s, y + .33 * s, z + fz * fr - fx * e * .11 * s], [0, 0, 0], [1, 1, .4]));
  glows.push(P(new THREE.TorusGeometry(.1 * s, .025 * s, 4, 10, Math.PI), '#ffd23f', [x + fx * fr, y + .2 * s, z + fz * fr], [0, rot, Math.PI]));
  return { parts, glows };
};
// (owner, 13 Oct: many more decorations) four pieces every theme shares, in the theme's own colours, so a street of
// 5x the pieces never looks like one piece over and over: a lantern post, a pennant pole, a flower tub, a garland arch
function shared(theme, k, x, y, z, rot) {
  const parts = [], glows = [], cols = (THEME_BUNTING[theme] || [['#ff4f9a', '#ffd23f']])[0], c = j => cols[j % cols.length];
  if (k === 0) { parts.push(P(Cyl(.04, .05, 2.1, 5), '#5a4a3a', [x, y + 1.05, z]), P(Box(.7, .05, .05), '#5a4a3a', [x, y + 2.05, z], [0, rot, 0]));
    for (const s of [-1, 1]) { const lx = x + Math.cos(rot) * .3 * s, lz = z - Math.sin(rot) * .3 * s; glows.push(P(Sph(.16, 8, 6), c(s > 0 ? 0 : 1), [lx, y + 1.78, lz], [0, 0, 0], [1, 1.25, 1])); } }
  else if (k === 1) { parts.push(P(Cyl(.03, .03, 2.4, 4), '#c9d0d4', [x, y + 1.2, z]));
    for (let j = 0; j < 3; j++) parts.push(P(new THREE.ConeGeometry(.16, .5, 3), c(j), [x + Math.sin(rot + Math.PI / 2) * .26, y + 2.15 - j * .42, z + Math.cos(rot + Math.PI / 2) * .26], [0, rot, Math.PI / 2])); }
  else if (k === 2) { parts.push(P(Box(.7, .35, .4), '#8a5a3a', [x, y + .17, z], [0, rot, 0]));
    for (let j = 0; j < 5; j++) parts.push(P(Sph(.12, 6, 5), c(j), [x + Math.cos(rot) * (j - 2) * .14, y + .45 + (j % 2) * .08, z - Math.sin(rot) * (j - 2) * .14])); }
  else { for (const s of [-1, 1]) parts.push(P(Cyl(.035, .035, 1.9, 4), '#6a4a3a', [x + Math.cos(rot) * .6 * s, y + .95, z - Math.sin(rot) * .6 * s]));
    for (let j = 0; j <= 6; j++) { const t = j / 6, a = t * Math.PI, px = Math.cos(a) * .6, py = 1.9 + Math.sin(a) * .35; glows.push(P(Sph(.09, 6, 5), c(j), [x + Math.cos(rot) * px, y + py, z - Math.sin(rot) * px])); } }
  return { parts, glows };
}
// one decoration piece of a theme: of every 6 spots, 3 carry the theme's own pieces and 3 the shared ones
function piece(theme, i, x, y, z, rot) {
  const slot = i % 6, round = Math.floor(i / 6);
  return slot >= 3 ? shared(theme, (round + slot) % 4, x, y, z, rot) : own(theme, round * 3 + slot, x, y, z, rot);
}
// one of the theme's own pieces at (x, y, z); i picks among them; rot faces it
function own(theme, i, x, y, z, rot) {
  const parts = [], glows = [], add = r => { parts.push(...r.parts); glows.push(...r.glows); };
  const pot = (col, flowers) => { parts.push(P(Cyl(.32, .24, .45, 10), '#b8643a', [x, y + .22, z])); flowers.forEach((c, k) => { const a = k * 2.4; parts.push(P(Sph(.13, 6, 5), c, [x + Math.cos(a) * .2, y + .62 + (k % 2) * .12, z + Math.sin(a) * .2])); }); parts.push(P(Sph(.26, 8, 6), col, [x, y + .55, z])); };
  const balloons = cols => cols.forEach((c, k) => { const a = k * 2.1, bx = x + Math.cos(a) * .25, bz = z + Math.sin(a) * .25, h = 1.9 + (k % 3) * .25; parts.push(P(Cyl(.008, .008, h, 3), '#ffffff', [bx, y + h / 2, bz]), P(Sph(.22, 10, 8), c, [bx, y + h + .2, bz], [0, 0, 0], [1, 1.2, 1])); });
  switch (theme) {
    case 'tet':
      if (i % 3 === 0) { parts.push(P(Cyl(.06, .1, 1.4, 6), '#6a4a3a', [x, y + .7, z]), P(Cyl(.34, .26, .4, 10), '#c62828', [x, y + .2, z])); for (let k = 0; k < 10; k++) { const a = k * 2.4, r = .25 + (k % 3) * .18; parts.push(P(Sph(.12, 6, 5), k % 4 ? '#ffb3c8' : '#ffffff', [x + Math.cos(a) * r, y + 1.35 + (k % 4) * .12, z + Math.sin(a) * r])); } }   // hoa đào in a red pot
      else if (i % 3 === 1) pot('#ffd23f', ['#ffe066', '#ffd23f', '#ffe066', '#ffcf3a']);   // hoa mai
      else { parts.push(P(Box(.6, .9, .05), '#c62828', [x, y + 1.2, z], [0, rot, 0]), P(Cyl(.03, .03, 1.8, 4), '#6a4a3a', [x, y + .9, z])); glows.push(P(Box(.36, .5, .06), '#ffd23f', [x, y + 1.2, z], [0, rot, 0])); }   // a red câu đối banner
      break;
    case 'lanterns':
      if (i % 2) { parts.push(P(Cyl(.03, .03, 1.7, 4), '#6a4a3a', [x, y + .85, z])); glows.push(P(new THREE.OctahedronGeometry(.36, 0), i % 4 === 1 ? '#ff4a3a' : '#ffd23f', [x, y + 1.9, z], [0, rot, Math.PI / 4], [1, 1, .25])); }   // a star lantern (đèn ông sao) on a stick
      else { parts.push(P(Cyl(.03, .03, 1.2, 4), '#6a4a3a', [x, y + .6, z])); glows.push(P(Sph(.3, 10, 8), '#ff7a3a', [x, y + 1.4, z], [0, 0, 0], [1, 1.2, 1]), P(Cyl(.12, .12, .06, 8), '#ffd23f', [x, y + 1.78, z])); }
      break;
    case 'pumpkins': {
      // (owner, 13 Oct: "all types of decorations including skeletons, spider webs") eight kinds, all friendly: smiling
      // pumpkins, a waving skeleton, a spider web with a little purple spider, a smiling ghost, a black cat, a cauldron of
      // green bubbles, a scarecrow, a witch's hat; never scary (round faces, big eyes, smiles)
      const k = i % 8, fx = Math.sin(rot), fz = Math.cos(rot), sx = Math.cos(rot), sz = -Math.sin(rot), at = (u, h, f = 0) => [x + sx * u + fx * f, y + h, z + sz * u + fz * f];
      if (k === 0) { add(pumpkin(x, y, z, 1.4, rot)); add(pumpkin(x + .5, y, z + .4, .6, rot)); }
      else if (k === 1) { // a friendly skeleton waving, bones white, a round smiling skull
        parts.push(P(Sph(.24), '#f6f2e6', at(0, 1.55)), P(Cyl(.04, .04, .55, 5), '#f6f2e6', at(0, 1.05)));
        for (let j = 0; j < 3; j++) parts.push(P(Box(.36 - j * .04, .04, .08), '#f6f2e6', at(0, 1.22 - j * .11), [0, rot, 0]));
        parts.push(P(Cyl(.03, .03, .5, 5), '#f6f2e6', at(-.22, 1.42), [0, rot, -.9]), P(Cyl(.03, .03, .45, 5), '#f6f2e6', at(.2, .98), [0, rot, .25]));
        for (const s of [-1, 1]) parts.push(P(Cyl(.035, .035, .7, 5), '#f6f2e6', at(s * .09, .4)), P(Sph(.05, 6, 4), '#2a2a3a', at(s * .08, 1.6, .2)));
        parts.push(P(new THREE.TorusGeometry(.07, .015, 3, 8, Math.PI), '#2a2a3a', at(0, 1.48, .21), [0, rot, Math.PI])); }
      else if (k === 2) { // a spider web between two posts, a little purple spider with big eyes
        for (const s of [-1, 1]) parts.push(P(Cyl(.035, .04, 1.8, 5), '#6a4a3a', at(s * .6, .9)));
        for (let j = 0; j < 8; j++) { const a = j / 8 * Math.PI * 2; parts.push(P(Cyl(.008, .008, .58, 3), '#e8e8f0', at(Math.cos(a) * .28, 1.25 + Math.sin(a) * .28), [0, rot, a + Math.PI / 2])); }
        for (const r of [.14, .28, .42]) parts.push(P(new THREE.TorusGeometry(r, .008, 3, 8), '#e8e8f0', at(0, 1.25), [0, rot, 0]));
        parts.push(P(Sph(.09, 6, 5), '#7a4aa0', at(.12, 1.18, .03))); for (const s of [-1, 1]) glows.push(P(Sph(.03, 5, 4), '#ffffff', at(.12 + s * .04, 1.21, .1)));
        for (let j = 0; j < 4; j++) for (const s of [-1, 1]) parts.push(P(Cyl(.01, .01, .16, 3), '#4a3a6a', at(.12 + s * .1, 1.18 - (j - 1.5) * .04, .03), [0, rot, s * 1.2])); }
      else if (k === 3) { // a smiling ghost: a white sheet, big dark eyes and a round "oo" mouth, floating a little
        parts.push(P(Sph(.32), '#ffffff', at(0, 1.25), [0, 0, 0], [1, 1.1, 1]), P(new THREE.ConeGeometry(.36, .7, 10, 1, true), '#ffffff', at(0, .85), [0, 0, 0]));
        for (const s of [-1, 1]) parts.push(P(Sph(.06, 6, 5), '#2a2a3a', at(s * .1, 1.32, .27), [0, 0, 0], [1, 1.3, .6]));
        parts.push(P(Sph(.05, 6, 5), '#2a2a3a', at(0, 1.16, .29), [0, 0, 0], [1, 1, .5])); }
      else if (k === 4) { // a black cat sitting with its tail up, yellow eyes that glow at night
        parts.push(P(Sph(.2), '#2a2a34', at(0, .22), [0, 0, 0], [1, 1.2, .9]), P(Sph(.15), '#2a2a34', at(0, .55, .05)));
        for (const s of [-1, 1]) { parts.push(P(new THREE.ConeGeometry(.05, .1, 4), '#2a2a34', at(s * .08, .7, .05))); glows.push(P(Sph(.03, 5, 4), '#ffd23f', at(s * .055, .57, .18))); }
        parts.push(P(Cyl(.025, .02, .5, 4), '#2a2a34', at(-.18, .45, -.12), [0, rot, .5])); }
      else if (k === 5) { // a cauldron of green bubbles on three legs
        parts.push(P(new THREE.SphereGeometry(.32, 10, 6, 0, Math.PI * 2, Math.PI * .35, Math.PI * .65), '#2a2a34', at(0, .42)), P(new THREE.TorusGeometry(.26, .04, 4, 12), '#3a3a44', at(0, .5), [Math.PI / 2, 0, 0]));
        for (let j = 0; j < 3; j++) { const a = j / 3 * Math.PI * 2; parts.push(P(Cyl(.03, .03, .25, 4), '#3a3a44', [x + Math.cos(a) * .2, y + .12, z + Math.sin(a) * .2])); }
        glows.push(P(Cyl(.24, .24, .03, 10), '#5fd36a', at(0, .52))); for (let j = 0; j < 3; j++) glows.push(P(Sph(.06 + j * .02, 6, 4), '#8af07a', at((j - 1) * .1, .6 + j * .06))); }
      else if (k === 6) { // a scarecrow with a pumpkin head and a straw hat
        parts.push(P(Cyl(.04, .04, 1.7, 5), '#6a4a3a', at(0, .85)), P(Cyl(.03, .03, 1.1, 5), '#6a4a3a', at(0, 1.25), [0, rot, Math.PI / 2]), P(Box(.42, .5, .2), '#5a7ad0', at(0, 1.15), [0, rot, 0]));
        add(pumpkin(x, y + 1.42, z, .55, rot)); parts.push(P(Cyl(.3, .32, .04, 10), '#d8b45a', at(0, 1.78)), P(Cyl(.14, .17, .16, 10), '#d8b45a', at(0, 1.86))); }
      else { // a purple witch's hat on a pole, and a bowl of sweets
        parts.push(P(Cyl(.03, .03, 1.3, 4), '#6a4a3a', at(0, .65)), P(Cyl(.28, .28, .03, 12), '#5a3a8a', at(0, 1.32)), P(new THREE.ConeGeometry(.16, .45, 10), '#5a3a8a', at(0, 1.56), [0, 0, .15]));
        parts.push(P(Cyl(.17, .17, .05, 10), '#ff8a1a', at(0, 1.36)), P(Cyl(.2, .15, .25, 10), '#7a4aa0', at(.5, .12)));
        ['#ff7a2a', '#ffd23f', '#ffffff', '#ff4f9a'].forEach((c, j) => parts.push(P(Sph(.06, 6, 5), c, at(.5 + (j - 1.5) * .07, .28)))); }
      break; }
    case 'xmas':
      if (i % 3 === 0) { for (let k = 0; k < 3; k++) parts.push(P(new THREE.ConeGeometry(.9 - k * .25, .9, 10), '#2f7a3a', [x, y + .8 + k * .55, z])); parts.push(P(Cyl(.1, .12, .4, 6), '#6a4a3a', [x, y + .2, z])); glows.push(P(new THREE.OctahedronGeometry(.18, 0), '#ffd23f', [x, y + 2.35, z])); for (let k = 0; k < 9; k++) { const a = k * 2.3, r = .65 - (k % 3) * .2; glows.push(P(Sph(.07, 6, 5), ['#ff4a3a', '#ffd23f', '#3cc7e8'][k % 3], [x + Math.cos(a) * r, y + .8 + (k % 3) * .55, z + Math.sin(a) * r])); } }
      else ['#e8433a', '#3a78c8', '#ffd23f'].forEach((c, k) => parts.push(P(Box(.36 - k * .06, .3 - k * .04, .36 - k * .06), c, [x + (k - 1) * .4, y + .15 - k * .02, z]), P(Box(.38 - k * .06, .05, .06), '#ffffff', [x + (k - 1) * .4, y + .32 - k * .04, z])));
      break;
    case 'eggs': ['#ff9ab8', '#7fd6d0', '#ffd23f', '#c6a8f0'].forEach((c, k) => { if ((i + k) % 2) parts.push(P(Sph(.2, 10, 8), c, [x + (k - 1.5) * .35, y + .25, z], [0, 0, 0], [1, 1.35, 1]), P(new THREE.TorusGeometry(.2, .02, 4, 14), '#ffffff', [x + (k - 1.5) * .35, y + .25, z], [Math.PI / 2, 0, 0])); }); break;
    case 'hearts': if (i % 2) pot('#ff6b8a', ['#ff4f6a', '#ff9ab8', '#ffffff']); else { parts.push(P(Cyl(.03, .03, 1.6, 4), '#6a4a3a', [x, y + .8, z])); for (const s of [-1, 1]) parts.push(P(Sph(.2, 10, 8), '#ff4f6a', [x + s * .14, y + 1.75, z])); parts.push(P(new THREE.ConeGeometry(.3, .4, 4), '#ff4f6a', [x, y + 1.5, z], [Math.PI, Math.PI / 4, 0])); } break;
    case 'diyas': for (let k = 0; k < 4; k++) { const dx = (k - 1.5) * .45; parts.push(P(Cyl(.14, .08, .1, 10), '#b8643a', [x + dx, y + .05, z])); glows.push(P(new THREE.ConeGeometry(.05, .16, 6), '#ffb43a', [x + dx, y + .18, z])); } parts.push(P(new THREE.TorusGeometry(.5, .07, 5, 16), '#ff9a2e', [x, y + .03, z + .6], [Math.PI / 2, 0, 0])); break;   // clay lamps and a marigold ring
    case 'colours': ['#ff4f9a', '#ffd23f', '#3cc7e8', '#5fd36a', '#ff9f43', '#9a6af0'].forEach((c, k) => { const a = k / 6 * Math.PI * 2; parts.push(P(new THREE.ConeGeometry(.22, .22, 10), c, [x + Math.cos(a) * .5, y + .11, z + Math.sin(a) * .5])); }); break;   // little hills of colour powder
    case 'poppies': parts.push(P(Cyl(.03, .03, 1.1, 4), '#6a4a3a', [x, y + .55, z]), P(new THREE.TorusGeometry(.32, .06, 6, 16), '#3a6a2a', [x, y + 1.2, z], [0, rot, 0])); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; parts.push(P(Sph(.09, 6, 5), '#d8202a', [x + Math.cos(a) * .32 * Math.cos(rot), y + 1.2 + Math.sin(a) * .32, z - Math.cos(a) * .32 * Math.sin(rot)])); } break;   // a quiet wreath of poppies
    case 'ochre': parts.push(P(Box(1.0, 1.0, .06), '#8a3a1a', [x, y + .9, z], [0, rot, 0]), P(Cyl(.03, .03, .9, 4), '#5a3a2a', [x, y + .45, z])); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, r = .12 + (k % 3) * .12; parts.push(P(Sph(.035, 5, 4), ['#ffd23f', '#ffffff', '#e8a04a'][k % 3], [x + Math.sin(rot) * .04 + Math.cos(rot) * Math.cos(a) * r, y + .9 + Math.sin(a) * r, z + Math.cos(rot) * .04 - Math.sin(rot) * Math.cos(a) * r])); } break;   // a dot painting
    case 'harmony': case 'kids': case 'sparkle': balloons(theme === 'harmony' ? ['#ff9a2e', '#ffb35a', '#ff8a1a'] : ['#ff4f9a', '#ffd23f', '#3cc7e8', '#5fd36a']); break;
    case 'clean': [['#3a78c8', '#ffd23f'], ['#5a8a3a', '#e8433a']].forEach((c, k) => parts.push(P(Box(.5, .8, .5), '#3a3d40', [x + k * .65, y + .4, z]), P(Box(.54, .08, .54), c[1], [x + k * .65, y + .84, z]))); break;   // recycling and rubbish bins
    case 'kitchen': parts.push(P(Cyl(.45, .4, .25, 14), '#c9a05a', [x, y + .12, z]), P(Cyl(.4, .4, .02, 14), '#5aaee0', [x, y + .24, z])); glows.push(P(Sph(.12, 8, 6), '#ffb43a', [x, y + .3, z], [0, rot, 0], [1, .6, 2.2])); break;   // a basin with a golden carp
    case 'dragonboat': parts.push(P(Box(.5, .25, 2.4), '#c62828', [x, y + .12, z], [0, rot, 0]), P(Sph(.2, 8, 6), '#2f9a4a', [x + Math.sin(rot) * 1.3, y + .4, z + Math.cos(rot) * 1.3])); break;
    case 'teacher': parts.push(P(Box(.7, .5, .04), '#fff3c4', [x, y + .9, z], [0, rot, 0]), P(Cyl(.03, .03, .8, 4), '#6a4a3a', [x, y + .4, z])); pot('#ffb3c8', ['#ff4f6a', '#ffffff', '#ffd23f']); break;
    default: { // flags: red with a gold star (Vietnam), green and gold (Australia), on poles
      const vn = theme === 'flags-vn';
      parts.push(P(Cyl(.03, .03, 2.2, 4), '#c9d0d4', [x, y + 1.1, z]), P(Box(.04, .45, .7), vn ? '#d8202a' : '#2f8a3a', [x, y + 1.95, z + .35], [0, rot, 0]));
      if (vn) glows.push(P(new THREE.OctahedronGeometry(.1, 0), '#ffd23f', [x + .03, y + 1.95, z + .35]));
      else parts.push(P(Box(.045, .15, .7), '#ffd23f', [x, y + 1.95, z + .35], [0, rot, 0]));
    }
  }
  return { parts, glows };
}
const THEME_BUNTING = { tet: [['#c62828', '#ffd23f'], 'lantern'], lanterns: [['#ff7a3a', '#ffd23f', '#ff4a3a'], 'lantern'], pumpkins: [['#ff8a1a', '#7a4aa0', '#4a3a6a'], 'bat'], xmas: [['#e8433a', '#2f7a3a', '#ffd23f'], 'flag'],
  eggs: [['#ff9ab8', '#7fd6d0', '#ffd23f', '#c6a8f0'], 'flag'], hearts: [['#ff4f6a', '#ff9ab8', '#ffffff'], 'flag'], diyas: [['#ff9a2e', '#ffd23f', '#e8433a'], 'lantern'], colours: [['#ff4f9a', '#ffd23f', '#3cc7e8', '#5fd36a', '#9a6af0'], 'flag'],
  'flags-vn': [['#d8202a', '#ffd23f'], 'flag'], 'flags-au': [['#2f8a3a', '#ffd23f'], 'flag'], harmony: [['#ff9a2e', '#ffb35a'], 'flag'], kids: [['#ff4f9a', '#ffd23f', '#3cc7e8', '#5fd36a'], 'flag'], sparkle: [['#ffd23f', '#3cc7e8', '#ff4f9a'], 'lantern'],
  dragonboat: [['#c62828', '#2f9a4a', '#ffd23f'], 'flag'], teacher: [['#ff9ab8', '#ffffff', '#ffd23f'], 'flag'], kitchen: [['#c62828', '#ffd23f'], 'lantern'], ochre: [['#8a3a1a', '#ffd23f', '#1d1d1d'], 'flag'] };
export const showName = F => ({ fireworks: ['fireworks', 'pháo hoa'], lanterns: ['lantern parade', 'rước đèn'], parade: ['parade', 'diễu hành'], lights: ['light show', 'trình diễn ánh sáng'] })[F.show] || ['evening', 'buổi tối'];

export function createFestivals(G) {
  const { scene, world } = G, W = world;
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.4, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const group = new THREE.Group(); scene.add(group); group.userData.noSolid = true; // (decorations come and go with the dates: never part of the solid map)
  const bursts = [], tables = [], doors = [];
  let active = [], glowMeshes = [];
  const free = (x, z, r = 1) => heightAt(x, z) > WATER + .3 && !W.colliders.some(c => c.r > 0 && c.top == null && Math.hypot(c.x - x, c.z - z) < c.r + r) && !W.boxes.some(b => x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r);
  // (owner, 10 Oct) the street spots: js/festdecor.js, loaded once a child plays (PERF-001), then the decorations are built
  let D = null, loadingD = null, waitD = false;
  const loadD = () => loadingD || (loadingD = import('./festdecor.js').then(m => { D = { ...m.createDecor(free), tell: m.tell, decoOf: m.decoOf, FRAC: m.FRAC }; scheduled = m.scheduled; build(); }).catch(e => { loadingD = null; console.warn('festdecor', e); window.svModuleGone?.(e); }));
  const streetSpots = (key, o) => D ? D.streetSpots(key, o) : [];
  const unhook = list => { list.forEach(it => { const k = G.interactables.indexOf(it); if (k >= 0) G.interactables.splice(k, 1); }); list.length = 0; };
  // (owner, 13 Oct: 5x the decorations) the decorations are drawn in 12 m patches: the ones nearest the children first,
  // each within NEAR (farther ones are lost in the haze), with outlines only within CLOSE, and never more than BUDGET
  // triangles and CALLS draw calls in all (PERF-003: Lotus Village stays within its budget on a festival day, whatever the amount in Studio)
  const CELL = 12, NEAR = 85, CLOSE = 30, BUDGET = 60000, CALLS = 16, places3 = [], placed = [];
  const tris = m => m && m.geometry ? (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3 : 0;
  const addMeshes = (parts, glows, at?:{x:number;z:number;r?:number}) => {
    const box = at ? new THREE.Group() : group; if (at) { box.userData.at = at; group.add(box); places3.push(box); }
    if (parts.length) { const m = new THREE.Mesh(merge(parts), mat); m.castShadow = true; outline(m, .012, '#3a2a20'); box.add(m); if (at) { box.userData.lines = m.children.filter(c => c instanceof THREE.Mesh); box.userData.tri = tris(m); box.userData.lineTri = box.userData.lines.reduce((a, l) => a + tris(l), 0); } }
    if (glows.length) { const g = new THREE.Mesh(merge(glows), mat); box.add(g); glowMeshes.push(g); if (at) box.userData.tri = (box.userData.tri || 0) + tris(g); }
  };
  // a place's pieces, grouped into patches
  const addItems = items => { const cells = new Map();
    for (const it of items) { placed.push({ x: it.x, z: it.z, kind: it.kind }); }
    for (const it of items) { const k = Math.floor(it.x / CELL) + ',' + Math.floor(it.z / CELL); if (!cells.has(k)) cells.set(k, []); cells.get(k).push(it); }
    for (const list of cells.values()) { const x = list.reduce((a, q) => a + q.x, 0) / list.length, z = list.reduce((a, q) => a + q.z, 0) / list.length, r = Math.max(...list.map(q => Math.hypot(q.x - x, q.z - z)));
      addMeshes(list.flatMap(q => q.parts), list.flatMap(q => q.glows), { x, z, r }); } };
  const near = () => { let used = 0, calls = 0;
    places3.map(b => { const { x, z, r } = b.userData.at; return [Math.min(...G.heroes.map(h => Math.hypot(h.pos.x - x, h.pos.z - z))) - r, b]; }).sort((a, b) => a[0] - b[0]).forEach(([d, b]) => {
      const lines = d < CLOSE, cost = (b.userData.tri || 0) + (lines ? b.userData.lineTri || 0 : 0), n = b.children.length + (lines ? (b.userData.lines || []).length : 0);
      b.visible = d < NEAR && used + cost <= BUDGET && calls + n <= CALLS; if (b.visible) { used += cost; calls += n; } (b.userData.lines || []).forEach(l => { l.visible = lines; }); });
    drawn = used; drawnCalls = calls; };
  let drawn = 0, drawnCalls = 0;
  let nearT = 0; W.updaters.push(dt => { if ((nearT -= dt) > 0 || !places3.length) return; nearT = .5; near(); });
  // the houses of a place (each gets a piece by its door and a garland along its front)
  const housesOf = o => { const e = o.w && o.d ? 20 : 0; return (W.houses || []).filter(hs => o.x0 != null ? hs.x > o.x0 - e && hs.x < o.x1 + e && hs.z > o.z0 - e && hs.z < o.z1 + e : Math.hypot(hs.x - o.x, hs.z - o.z) < (o.r || 24)); };
  const build = () => {
    // (festdecor loads once a child is in the valley, not behind the title screen)
    if (!D) { active = activeFestivals(); if (G.heroes.length) loadD(); else if (!waitD) { waitD = true; W.updaters.push(() => { if (G.heroes.length && !loadingD) loadD(); }); } return; }
    group.traverse(o => { if (o instanceof THREE.Mesh && o.geometry && !o.userData.outline) o.geometry.dispose(); });
    group.clear(); places3.length = 0; placed.length = 0; bursts.length = 0; glowMeshes = []; unhook(tables); unhook(doors);
    active = activeFestivals();
    D.begin();const supports=new Map(),drawBunting=(a,b,cols,kind,wall=false)=>bunting(a,b,cols,kind,wall,supports);
    for (const A of active) if (A.F.id === 'halloween' && A.on) doorSpots(A.F).forEach(q => D.claim(q));
    const places = PLACES(), taken = new Set(), hunts = [];
    for (const A of active) {
      const F = A.F, full = D.FRAC[A.stage] || 0, m = D.decoOf(F);
      F.where.forEach((key, w) => {
        const o = places[key]; if (!o) return; const c = centre(o);
        if (taken.has(key + F.theme)) return; taken.add(key + F.theme);
        // (owner, 10 Oct) the whole place, along its streets (js/festdecor.js); without streets, a ring round the middle
        // (owner, 13 Oct) 5x by default: pieces, strings across the streets and every house front (Studio sets the amount)
        const [bc, bk] = THEME_BUNTING[F.theme] || [['#ff4f9a', '#ffd23f'], 'flag'], q = D.decorate(key, o, F, A, piece, drawBunting, bc, bk, housesOf(o)), items = q || [];
        const put = (x, z, r, kind = 'piece') => items.push({ x, z, kind, parts: r.parts, glows: r.glows });
        if (!q) {
          // (strings first, on three rings so their posts never share ground, then the pieces round them)
          const nb = F.kind === 'quiet' ? 0 : Math.max(0, A.stage - 1) * 2 * m;
          let hung = 0;
          for (let j = 0, k = 0; j < nb && k < 90 * m; k++) { const a = k * 1.7 + w, r = 10 + (k % 3) * 4, x1 = c.x + Math.cos(a) * r, z1 = c.z + Math.sin(a) * r, x2 = c.x + Math.cos(a + .9) * r, z2 = c.z + Math.sin(a + .9) * r;
            if (!free(x1, z1, .6) || !free(x2, z2, .6) || !D.fits({ x: x1, z: z1 }, 'support') || !D.fits({ x: x2, z: z2 }, 'support') || Math.hypot(x1 - x2, z1 - z2) < 4) continue; D.claim({ x: x1, z: z1 }, 'support'); D.claim({ x: x2, z: z2 }, 'support'); hung++; put((x1 + x2) / 2, (z1 + z2) / 2, drawBunting([x1, heightAt(x1, z1) + 3.2, z1], [x2, heightAt(x2, z2) + 3.2, z2], bc, bk), 'string'); j++; }
          // (as along the streets) a strand that does not fit becomes a piece on clear ground, so the amount stays
          const n = Math.round((F.kind === 'quiet' ? 6 : 16) * full * m) + (nb - hung);
          let laid = 0;
          for (let i = 0, k = 0; i < n && k < 240 * m; k++) { const a = k * 2.399 + w, r = 7 + (k * .618 % 1) * 2.2 * (4 + m), x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
            if (!free(x, z, 1.1) || !D.claim({ x, z })) continue; put(x, z, piece(F.theme, i, x, heightAt(x, z), z, a + Math.PI)); i++; laid++; }
          D.note({ place: key, festival: F.id, ring: true, requested: n - (nb - hung) + nb, placed: laid + hung, relocated: nb - hung, unplaced: n - laid });
        }
        // the festival table, on the day, in its first place
        if (A.on && w === 0) {
          let x = c.x - 3, z = c.z + 3; for (let k = 0; k < 40 && !(free(x, z, 1.4) && D.claim({ x, z })); k++) { x = c.x + Math.cos(k) * (4 + k * .5); z = c.z + Math.sin(k) * (4 + k * .5); }
          const y = heightAt(x, z), parts = []; parts.push(P(Box(1.8, .08, .9), '#c9a05a', [x, y + .8, z]), ...[[-.8, -.35], [.8, -.35], [-.8, .35], [.8, .35]].map(([dx, dz]) => P(Cyl(.04, .04, .8, 5), '#8a6a4a', [x + dx, y + .4, z + dz])), P(Box(1.9, .5, .02), '#ffffff', [x, y + .55, z + .45]));
          const tq = piece(F.theme, 1, x + .5, y + .84, z, 0); items.push({ x, z, kind: 'table', parts: parts.concat(tq.parts), glows: tq.glows });
          const it = { id: 'festival_' + F.id, x, z, r: 3.2, icon: F.icon, label: () => T(F.en, F.vi), act: h => visit(h, F) }; tables.push(it); G.interactables.push(it);
        }
        addItems(items);
        // (owner, 13 Oct) the festival hunt, in the last week and on the day: five things among the first place's pieces
        // (batch rollout) Studio switch 'festHunt': off or not started yet, no hunt unless a child playing already hunted
        if (w === 0 && (A.on || A.stage >= 3) && (!G.keep || G.keep('festHunt'))) hunts.push({ F, year: (A.start || new Date()).getFullYear(), at: c,
          spots: items.filter(q => q.kind === 'piece').map(q => { const a = Math.atan2(q.x - c.x, q.z - c.z) + 1.2, x = q.x + Math.sin(a) * .9, z = q.z + Math.cos(a) * .9; return { x, z }; }).filter(q => free(q.x, q.z, .4)) });
      });
      if (F.id === 'halloween' && A.on) halloweenDoors(F);
    }
    // (owner, 13 Oct: "scattered all over the place") the festival nearest its day also decorates the rest of the valley:
    // every other village and city at the amount of before, pieces beside every road (one every 60 / amount metres: 12 m at 5x)
    // and every house outside the places;
    // quiet days and "as before" stay in their own places
    const spread = active.filter(a => a.F.kind !== 'quiet' && D.decoOf(a.F) > 1).sort((a, b) => (b.on - a.on) || a.daysTo - b.daysTo)[0];
    if (spread) {
      const F = spread.F, m = D.decoOf(F), [bc, bk] = THEME_BUNTING[F.theme] || [['#ff4f9a', '#ffd23f'], 'flag'], frac = D.FRAC[spread.stage] || 0;
      const used = new Set(active.flatMap(a => a.F.where));
      for (const [key, o] of Object.entries(places)) { if (used.has(key)) continue; const q = D.decorate(key, o, F, spread, piece, drawBunting, bc, bk, [], 1); if (q) addItems(q); }
      const inside = (x, z) => Object.values(places).some(o => o.x0 != null ? x > o.x0 - 6 && x < o.x1 + 6 && z > o.z0 - 6 && z < o.z1 + 6 : Math.hypot(x - o.x, z - o.z) < (o.r || 24) + 6);
      const road = D.roadSpots(Math.round(60 / m), inside).filter((q, k) => (k % 4) < Math.round(frac * 4)).filter(q => D.claim(q));
      addItems(road.map((q, i) => { const r = piece(F.theme, i, q.x, heightAt(q.x, q.z), q.z, q.a); return { x: q.x, z: q.z, kind: 'road', parts: r.parts, glows: r.glows }; }));
      // and every house outside the places (the suburbs, the homes along the roads): a piece by its door and a garland
      const out = (W.houses || []).filter(hs => !inside(hs.x, hs.z)).filter((hs, k) => (k % 4) < Math.round(frac * 4));
      addItems(D.fronts(out).flatMap((q, i) => { const r = piece(F.theme, i + 2, q.x, heightAt(q.x, q.z), q.z, q.a), [[x1, z1], [x2, z2]] = q.g, y = Math.min(heightAt(x1, z1), heightAt(x2, z2)) + 2.6, g = drawBunting([x1, y, z1], [x2, y, z2], bc, bk, true);
        return [...(D.claim(q) ? [{ x: q.x, z: q.z, kind: 'road', parts: r.parts, glows: r.glows }] : []), { x: (x1 + x2) / 2, z: (z1 + z2) / 2, kind: 'string', parts: g.parts, glows: g.glows }]; }));
    }
    wasNight = null; nightLights(); if (G.heroes.length) near();
    if (hunts.length || H) loadH().then(h => h && h.set(hunts));
  };
  // the festival hunt (js/festhunt.js), loaded only while one is on
  let H = null, loadingH = null;
  const spark = () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#fff3a0', transparent: true, depthWrite: false })); s.scale.setScalar(.8); return s; };
  const loadH = () => H ? Promise.resolve(H) : loadingH || (loadingH = import('./festhunt.js').then(m => (H = m.createHunt(G, spark))).catch(e => { loadingH = null; console.warn('festhunt', e); window.svModuleGone?.(e); return null; }));
  // lamps, lanterns and pumpkin faces shine at night (full colour, unshaded), and look painted by day
  let wasNight = null;
  const nightLights = () => { const n = W.isNight(); if (n === wasNight) return; wasNight = n; glowMeshes.forEach(g => { g.material = n ? nightMat : mat; }); };

  // ---------- Halloween: trick or treat ----------
  // the doors that get a trick-or-treat pumpkin (reserved before the decorations take the ground, so nothing stands on them)
  const doorSpots = F => { const places = PLACES(), boxes = F.where.map(k => places[k]).filter(Boolean).map(o => o.x0 != null ? o : { x0: o.x - (o.r || 30), x1: o.x + (o.r || 30), z0: o.z - (o.r || 30), z1: o.z + (o.r || 30) });
    return (W.houses || []).filter(hs => boxes.some(b => hs.x > b.x0 && hs.x < b.x1 && hs.z > b.z0 && hs.z < b.z1)).slice(0, 14).map(hs => {
      const fx = Math.sin(hs.rot), fz = Math.cos(hs.rot), d = hs.d || 6; return { hs, x: hs.x + fx * (d * .5 + 1.2) + fz * .9, z: hs.z + fz * (d * .5 + 1.2) - fx * .9 }; }); };
  const halloweenDoors = F => {
    const parts = [], glows = [];
    doorSpots(F).forEach(({ hs, x, z }, k) => {
      const q = pumpkin(x, heightAt(x, z), z, .8, hs.rot); parts.push(...q.parts); glows.push(...q.glows); placed.push({ x, z, kind: 'pumpkin' });
      const it = { id: 'trick_' + k, x, z, r: 2.4, icon: '🎃', label: () => T('Trick or treat!', 'Cho kẹo hay bị ghẹo!'), act: h => trickOrTreat(h, 'h' + Math.round(hs.x) + '_' + Math.round(hs.z)) };
      doors.push(it); G.interactables.push(it);
    });
    addMeshes(parts, glows);
  };
  const trickOrTreat = async (h, key) => {
    const p = h.profile, today = new Date().toDateString();
    p.halloween = p.halloween && p.halloween.day === today ? p.halloween : { day: today, doors: [], treats: 0 };
    if (p.halloween.doors.includes(key)) { G.toast(h, T('You already knocked here today. Try another house!', 'Nhà này con gõ rồi. Thử nhà khác nhé!')); return; }
    p.halloween.doors.push(key); p.halloween.treats++; SFX.ding && SFX.ding();
    say('Trick or treat! Here is a sweet for you!', 'Cho kẹo hay bị ghẹo! Kẹo của con đây!');
    G.toast(h, `🍬 ${p.halloween.treats} / 5`);
    if (p.halloween.treats === 5) {
      p.keepsakes = Array.isArray(p.keepsakes) ? p.keepsakes : []; if (!p.keepsakes.includes('pumpkin')) p.keepsakes.push('pumpkin');
      G.giveSticker(p); saveProfiles(); G.celebrate && G.celebrate(h);
      await G.reward('🎃', T('A pumpkin lantern of your own!', 'Đèn bí ngô của riêng con!'), T('Put it in your house to light it up.', 'Đặt trong nhà cho sáng lung linh nhé.'));
    } else saveProfiles();
  };

  // ---------- the festival table ----------
  const festivalDialog=(F,lines:string[][],choices?:string[][])=>{const answer=G.dialog(T(F.en,F.vi),lines,choices);const panel=document.querySelector<HTMLElement>('.dialog:not(.out)');if(panel)panel.dataset.festivalOwner=F.id;return answer;};
  const little = () => G.heroes.some(h => h.profile && h.profile.age !== 'big');
  const visit = async (h, F) => {
    if(!enabled(F))return;
    const p = h.profile, today = new Date().toDateString(), preview = previewing === F.id;
    p.festivals = p.festivals || {};
    await festivalDialog(F,F.lines);if(!enabled(F))return;
    if (p.festivals[F.id] !== today) {
      p.festivals[F.id] = today;
      const t = F.treat && FEAST.find(x => x.id === F.treat);
      if (t) { p.dishes = p.dishes || {}; p.dishes[F.treat] = (p.dishes[F.treat] || 0) + 1; G.toast(h, `+1 ${t.icon} ${t.name()}`); }
      else { farm.coins += 10; saveFarm(); G.toast(h, '🧧 +' + G.fmt(10)); SFX.coin(); }
      const st = G.giveSticker(p); saveProfiles();
      G.celebrate && G.celebrate(h);
      await G.reward(F.icon, T(F.en, F.vi), st ? T('A festival present and a sticker!', 'Quà lễ hội và một hình dán!') : T('A festival present!', 'Quà lễ hội!'));
    }
    // the festival game opens at 15:00 (any time when visiting from the calendar)
    if (!preview && new Date() < todayAt('15:00')) { const sn = showName(F); await festivalDialog(F, [[`The festival game starts at 3 o'clock${F.show !== 'none' ? `, and the ${sn[0]} at ${showTime(little())}` : ''}. Come back then!`, `Trò chơi lễ hội bắt đầu lúc 3 giờ chiều${F.show !== 'none' ? `, ${sn[1]} lúc ${showTime(little())}` : ''}. Nhớ quay lại nhé!`, 'The festival game starts at three o’clock. Come back then!', 'Trò chơi lễ hội bắt đầu lúc ba giờ chiều. Nhớ quay lại nhé!']]); return; }   // (shows the times, speaks a recorded line)
    const k = await festivalDialog(F, [[`Shall we play a festival game?`, `Mình chơi một trò ngày lễ nhé?`]], [['🎉 Yes!', '🎉 Có!'], ['👋 Later', '👋 Để sau']]);
    // (audit, 9 Oct) the Family Quiz only exists once the family has written one in Studio: otherwise a feelings game
    if (k === 0 && F.game) { const { GAMES } = await import('./games/frame.js'); G.playGame(h.i, GAMES[F.game] ? F.game : 'feelings', 'replay'); }
  };

  // ---------- the evening show, on the real clock ----------
  let fwT = 0, showT = 0, tick = 0, toldShow = '';
  const showing = () => { const now = new Date(), st = todayAt(showTime(little()), now); return active.filter(a => a.on && a.F.show && a.F.show !== 'none' && (showT > 0 || (now >= st && now < new Date(+st + 20 * 60e3)))); };
  W.updaters.push(dt => {
    if (!active.length) return;
    if ((tick -= dt) <= 0) { tick = 5; nightLights();
      // five minutes before the show, tell the children
      const now = new Date();
      for (const a of active.filter(x => x.on && x.F.show && x.F.show !== 'none')) { const st = todayAt(showTime(little()), now), key = a.F.id + now.toDateString(); if (now >= new Date(+st - 5 * 60e3) && now < st && toldShow !== key) { toldShow = key; const sn = showName(a.F); G.heroes.forEach(h => G.toast(h, `${a.F.icon} ${T(`The ${sn[0]} starts at ${showTime(little())}!`, `${sn[1]} bắt đầu lúc ${showTime(little())}!`)}`)); } }
    }
    if (showT > 0) showT -= dt;
    const shows = showing(); if (!shows.length || reduceMotion()) return;
    if ((fwT -= dt) > 0) return;
    const A = shows[Math.floor(Math.random() * shows.length)], F = A.F, o = PLACES()[F.where[0]]; if (!o) return; const c = centre(o), fire = F.show === 'fireworks';
    fwT = fire ? .5 + Math.random() * .7 : .25;
    const x = c.x + (Math.random() - .5) * (fire ? 30 : 16), z = c.z + (Math.random() - .5) * (fire ? 30 : 16), y = heightAt(c.x, c.z) + (fire ? 22 + Math.random() * 10 : 2 + Math.random() * 3);
    const col = F.theme === 'pumpkins' ? ['#ff8a1a', '#9a6af0', '#5fd36a'][Math.floor(Math.random() * 3)] : ['#ff4f9a', '#ffd23f', '#3cc7e8', '#5fd36a', '#ff9f43'][Math.floor(Math.random() * 5)];
    const n = fire ? 16 : 3;
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(fire ? 1.3 : .8);
      const a = i / n * Math.PI * 2, e = (Math.random() - .5) * 1.2; s.position.set(x, y, z); group.add(s);
      bursts.push({ s, v: fire ? new THREE.Vector3(Math.cos(a) * 7, Math.sin(e) * 7, Math.sin(a) * 7) : new THREE.Vector3((Math.random() - .5) * .6, 1.2, (Math.random() - .5) * .6), life: fire ? 1.4 : 4, grav: fire ? 4 : 0 });
    }
    if (fire && G.heroes.some(h => Math.hypot(h.pos.x - x, h.pos.z - z) < 80)) SFX.pop(Math.floor(Math.random() * 5));
  });
  W.updaters.push(dt => { for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i]; b.life -= dt; b.v.y -= dt * b.grav; b.s.position.addScaledVector(b.v, dt); b.s.material.opacity = Math.max(0, Math.min(1, b.life / 1.4)); if (b.life <= 0) { group.remove(b.s); b.s.material.dispose(); bursts.splice(i, 1); } } });
  build();
  const refresh=()=>{build();document.querySelectorAll<HTMLElement&{_autoClose?:()=>void}>('[data-festival-owner]').forEach(panel=>{const F=byId(panel.dataset.festivalOwner);if(!F||!enabled(F))panel._autoClose?.();});};
  onPublicFestivals(refresh);startPublicFestivals();
  onLive(refresh);   // a grown-up changed a festival in Studio: show it straight away
  // the decorations change at midnight (a new week's stage, a new festival)
  let dayKey = new Date().toDateString(), dayT = 0; W.updaters.push(dt => { if ((dayT -= dt) > 0) return; dayT = 30; const k = new Date().toDateString(); if (k !== dayKey) { dayKey = k; build(); } });
  return {
    rebuild: build,
    distribution: () => D ? D.distribution() : [],
    // (checks) where every drawn piece, string and table stands, across the whole valley
    items: () => placed.map(q => ({ ...q })),
    // (checks) the spots along a place's streets, and each active festival's places
    streetSpots: key => { const o = PLACES()[key]; return o ? streetSpots(key, o).map(q => ({ x: q.x, z: q.z })) : []; },
    plan: (key, id, stage) => { const o = PLACES()[key], F = byId(id); return o && F && D ? D.plan(key, o, F, stage) : []; },
    count: (key, id, stage) => { const o = PLACES()[key], F = byId(id); return o && F && D ? D.count(key, o, F, stage, housesOf(o)) : null; },
    places3: () => places3.map(b => ({ ...b.userData.at, visible: b.visible, tri: b.userData.tri })),
    drawn: () => ({ tris: drawn, calls: drawnCalls }), budget: { tris: BUDGET, calls: CALLS },
    hunt: () => H,
    roadSpots: m => D ? D.roadSpots(Math.round(60 / m), () => false).length : 0,
    active: () => active,
    current: () => { const a = active.find(x => x.on); return a ? a.F.id : null; },
    // (owner, 10 Oct; 11 Oct, #32: nothing sends a child to a festival) a child taps a festival on the calendar: it is told
    // about (on today, decorations going up, or days to go), nothing starts and nobody travels. Only a grown-up's Preview
    // link from Studio (an admin) takes the child to a festival, once.
    visit: async (i, id) => {
      const h = G.heroes[i], F = byId(id); if (!h || !F || !enabled(F)) return;
      const pv = new URLSearchParams(location.search).get('festival');
      if (pv === id && !G._festPreviewed) { G._festPreviewed = true; previewing = id; build(); }
      else { await loadD();if(!enabled(F))return;const answer=D.tell(G, h, F, active.find(a => a.F.id === id), nextOf(F, new Date()));const panel=document.querySelector<HTMLElement>('.dialog:not(.out)');if(panel)panel.dataset.festivalOwner=F.id;return answer; }
      const it = tables.find(t => t.id === 'festival_' + id);
      if (it) await G.landBy(h, it.x, it.z);
      showT = 14; SFX.chime && SFX.chime();
      for (let k = 0; k < 600 && document.querySelector('.storybook, .reward, .modal'); k++) await new Promise(r => setTimeout(r, 200));
      await new Promise(r => setTimeout(r, 900)); showT = 14;
      if (it) visit(h, byId(id));
    },
    list: () => FESTCAL.filter(enabled).map(F => ({ id: F.id, icon: F.icon, name: T(F.en, F.vi), today: active.some(a => a.on && a.F.id === F.id), isNew: releaseNew('fest_' + F.id) })),
    upcoming: () => upcoming(),
    groups: GROUPS,
    showTime: () => showTime(little()),
    // a greeting when a session starts during a festival (08:00 onwards)
    greet: h => { const a = active.find(x => x.on); if (!a || new Date() < todayAt('08:00')) return; const F = a.F; setTimeout(() => { if(!enabled(F))return; G.toast(h, `${F.icon} ${T("It's ", 'Hôm nay là ')}${T(F.en, F.vi)}!`); say(F.lines[0][0], F.lines[0][1]); }, 2500); }   // (a fixed line, so the recorded voice says it)
  };
}
