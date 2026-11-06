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
import { heightAt, WATER, EDGE, VILLAGE, CHINA, INDIA, AUSSIE, TOWN, MARKET, HOME, HOIAN, CITIES } from './world.js';
import { FEAST } from './data.js';
import { FESTCAL, DAY_PLAN, BUILDUP, GROUPS } from './content/festcal.js';
import { lunarDay, easter, nthWeekday } from './lunar.js';
import {festivalVisible,festivalScheduled} from './content/festival-visibility.js';
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
export const buildupOf = F => { const r = ruleOf(F.id); return r && r.buildup >= 0 ? Math.min(60, r.buildup) : BUILDUP[F.kind] || 3; };
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
const scheduled = (F,now:Date)=>festivalScheduled(liveRule('fest_'+F.id),F.days||1,now); // (an admin's schedule in Studio, fest_<id>: js/festdecor.js, once a child plays)
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
// (v1.08e places) Blender props (models/world/pr-*.glb, tools/blender/world-places.py) in place of some code pieces: their
// corners join the same patch merge, so the draws stay the same; until they arrive (or with no network) the code pieces stay
export const PROPS: Record<string, THREE.BufferGeometry> = {}, PROP_NAMES = ['pr-peach', 'pr-mai', 'pr-banhchung', 'pr-mamnguqua', 'pr-xmastree', 'pr-eggs', 'pr-starlantern', 'pr-lantern'];
// (v1.08g festivals, owner 6 Nov 2026 AEDT: "Go, but richer") each festival's own pieces and the four shared ones, made in
// Blender (models/world/fe-*.glb, tools/blender/world-festivals.py); a festival loads only its theme's models and the
// shared ones, when its decorations are built near a child. "-glow" models are the parts lit at night (drawn as glows).
export const FEST_MODELS: Record<string, string[]> = {
  shared: ['fe-lanternpost', 'fe-lanternpost-glow', 'fe-pennantpole', 'fe-flowertub', 'fe-arch', 'fe-arch-glow'],
  tet: ['fe-caudoi', 'fe-caudoi-glow'], pumpkins: ['fe-pumpkins', 'fe-pumpkins-glow', 'fe-skeleton', 'fe-web', 'fe-ghost', 'fe-cat', 'fe-cauldron', 'fe-cauldron-glow', 'fe-scarecrow', 'fe-witchhat'],
  xmas: ['fe-presents'], hearts: ['fe-heartpole', 'fe-pot'], diyas: ['fe-diyas', 'fe-diyas-glow'], colours: ['fe-colours'], poppies: ['fe-poppy'], ochre: ['fe-ochre'],
  harmony: ['fe-balloons'], kids: ['fe-balloons'], sparkle: ['fe-balloons'], clean: ['fe-bins'], kitchen: ['fe-carpbasin', 'fe-carpbasin-glow'], dragonboat: ['fe-dragonboat'],
  teacher: ['fe-teacher', 'fe-pot'], 'flags-vn': ['fe-flag-vn', 'fe-flag-vn-glow'], 'flags-au': ['fe-flag-au']
};
export const festivalPropsReady = () => Object.keys(PROPS);
export const showName = F => ({ fireworks: ['fireworks', 'pháo hoa'], lanterns: ['lantern parade', 'rước đèn'], parade: ['parade', 'diễu hành'], lights: ['light show', 'trình diễn ánh sáng'] })[F.show] || ['evening', 'buổi tối'];

export function createFestivals(G) {
  const { scene, world } = G, W = world;
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.4, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const group = new THREE.Group(); scene.add(group); group.userData.noSolid = true; // (decorations come and go with the dates: never part of the solid map)
  const bursts = [], tables = [], doors = [];
  let active = [], glowMeshes = [], loadingProps = false;
  // (#797, tester on iPhone v1.06: "stuck, cannot walk up to some decorations" at Làng Sen (232, -12)) the ground is free
  // only where a child can walk up to it: inside the valley's edge (world.js EDGE), never past it, where pots and lamps
  // stood over the sea beyond the drawn ground and nobody could reach them
  const free = (x, z, r = 1) => Math.abs(x) <= EDGE - r && Math.abs(z) <= EDGE - r && heightAt(x, z) > WATER + .3 && !W.colliders.some(c => c.r > 0 && c.top == null && Math.hypot(c.x - x, c.z - z) < c.r + r) && !W.boxes.some(b => x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r);
  // (owner, 10 Oct) the street spots: js/festdecor.js, loaded once a child plays (PERF-001), then the decorations are built
  // (v1.08 startup, PERF-001) the decorations' pieces (js/festpieces.ts) come with it
  let D = null, loadingD = null, waitD = false, FP: typeof import('./festpieces.js') = null;
  const loadD = () => loadingD || (loadingD = Promise.all([import('./festdecor.js'), import('./festpieces.js')]).then(([m, fp]) => { FP = fp; D = { ...m.createDecor(free), tell: m.tell, decoOf: m.decoOf, FRAC: m.FRAC }; build();
    FP.loadProps(FP.propsFor(active)).then(() => { if (Object.keys(PROPS).length && active.length) build(); }).catch(e => console.warn('festival props', e && e.message)); }).catch(e => { loadingD = null; console.warn('festdecor', e); window.svModuleGone?.(e); }));
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
    // (v1.08g festivals) a festival that starts while playing: its models are fetched, then the decorations built again
    { const need = FP.propsFor(active); if (need.length && !loadingProps) { loadingProps = true; FP.loadProps(need).then(() => { loadingProps = false; if (FP.propsFor(active).length < need.length) build(); }, () => { loadingProps = false; }); } }
    D.begin();const supports=new Map(),drawBunting=(a,b,cols,kind,wall=false)=>FP.bunting(a,b,cols,kind,wall,supports);
    for (const A of active) if (A.F.id === 'halloween' && A.on) doorSpots(A.F).forEach(q => D.claim(q));
    const places = PLACES(), taken = new Set(), hunts = [];
    for (const A of active) {
      const F = A.F, full = D.FRAC[A.stage] || 0, m = D.decoOf(F);
      F.where.forEach((key, w) => {
        const o = places[key]; if (!o) return; const c = centre(o);
        if (taken.has(key + F.theme)) return; taken.add(key + F.theme);
        // (owner, 10 Oct) the whole place, along its streets (js/festdecor.js); without streets, a ring round the middle
        // (owner, 13 Oct) 5x by default: pieces, strings across the streets and every house front (Studio sets the amount)
        const [bc, bk] = FP.THEME_BUNTING[F.theme] || [['#ff4f9a', '#ffd23f'], 'flag'], q = D.decorate(key, o, F, A, FP.piece, drawBunting, bc, bk, housesOf(o)), items = q || [];
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
            if (!free(x, z, 1.1) || !D.claim({ x, z })) continue; put(x, z, FP.piece(F.theme, i, x, heightAt(x, z), z, a + Math.PI)); i++; laid++; }
          D.note({ place: key, festival: F.id, ring: true, requested: n - (nb - hung) + nb, placed: laid + hung, relocated: nb - hung, unplaced: n - laid });
        }
        // the festival table, on the day, in its first place
        if (A.on && w === 0) {
          let x = c.x - 3, z = c.z + 3; for (let k = 0; k < 40 && !(free(x, z, 1.4) && D.claim({ x, z })); k++) { x = c.x + Math.cos(k) * (4 + k * .5); z = c.z + Math.sin(k) * (4 + k * .5); }
          const y = heightAt(x, z), parts = []; parts.push(P(FP.Box(1.8, .08, .9), '#c9a05a', [x, y + .8, z]), ...[[-.8, -.35], [.8, -.35], [-.8, .35], [.8, .35]].map(([dx, dz]) => P(FP.Cyl(.04, .04, .8, 5), '#8a6a4a', [x + dx, y + .4, z + dz])), P(FP.Box(1.9, .5, .02), '#ffffff', [x, y + .55, z + .45]));
          if (F.theme === 'tet') { // (v1.08e places) bánh chưng and the mâm ngũ quả on the Tết table
            parts.push(FP.prop('pr-banhchung', x - .55, y + .84, z) || P(FP.Box(.26, .12, .26), '#3f8a3a', [x - .55, y + .9, z]), FP.prop('pr-mamnguqua', x - .05, y + .84, z - .1) || P(FP.Cyl(.28, .24, .05, 12), '#c62828', [x - .05, y + .87, z - .1])); }
          const tq = FP.piece(F.theme, 1, x + .5, y + .84, z, 0); items.push({ x, z, kind: 'table', parts: parts.concat(tq.parts), glows: tq.glows });
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
      const F = spread.F, m = D.decoOf(F), [bc, bk] = FP.THEME_BUNTING[F.theme] || [['#ff4f9a', '#ffd23f'], 'flag'], frac = D.FRAC[spread.stage] || 0;
      const used = new Set(active.flatMap(a => a.F.where));
      for (const [key, o] of Object.entries(places)) { if (used.has(key)) continue; const q = D.decorate(key, o, F, spread, FP.piece, drawBunting, bc, bk, [], 1); if (q) addItems(q); }
      const inside = (x, z) => Object.values(places).some(o => o.x0 != null ? x > o.x0 - 6 && x < o.x1 + 6 && z > o.z0 - 6 && z < o.z1 + 6 : Math.hypot(x - o.x, z - o.z) < (o.r || 24) + 6);
      const road = D.roadSpots(Math.round(60 / m), inside).filter((q, k) => (k % 4) < Math.round(frac * 4)).filter(q => D.claim(q));
      addItems(road.map((q, i) => { const r = FP.piece(F.theme, i, q.x, heightAt(q.x, q.z), q.z, q.a); return { x: q.x, z: q.z, kind: 'road', parts: r.parts, glows: r.glows }; }));
      // and every house outside the places (the suburbs, the homes along the roads): a piece by its door and a garland
      const out = (W.houses || []).filter(hs => !inside(hs.x, hs.z)).filter((hs, k) => (k % 4) < Math.round(frac * 4));
      addItems(D.fronts(out).flatMap((q, i) => { const r = FP.piece(F.theme, i + 2, q.x, heightAt(q.x, q.z), q.z, q.a), [[x1, z1], [x2, z2]] = q.g, y = Math.min(heightAt(x1, z1), heightAt(x2, z2)) + 2.6, g = drawBunting([x1, y, z1], [x2, y, z2], bc, bk, true);
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
      const q = FP.pumpkin(x, heightAt(x, z), z, .8, hs.rot); parts.push(...q.parts); glows.push(...q.glows); placed.push({ x, z, kind: 'pumpkin' });
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
    // (v1.08b story, owner 3 Nov 2026 AEDT: "tap a step to fly there") the calendar tab's timeline: a festival whose
    // decorations are up takes the child to its table (on the day) or the middle of its first place; false otherwise
    goTo: (i, id) => { const h = G.heroes[i], F = byId(id), A = active.find(a => a.F.id === id); if (!h || !F || !A || !enabled(F)) return false;
      const t = tables.find(q => q.id === 'festival_' + id), o = t || (F.where || []).map(k => PLACES()[k]).filter(Boolean).map(centre)[0]; if (!o) return false;
      G.travel(h, o.x - 1.5, o.z + 2); return true; },
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
