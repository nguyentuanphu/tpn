// The open world: terrain, water, sky with day and night, trees, the Lotus Village,
// shrines, towers, hidden Leafies and everything you can walk up to and use.
import { pushOutOfSolids } from './solids.js';
import { THREE, toon, toonVC, toonSmooth, glow, P, merge, sprite, blobShadow } from './gfx.js';
import { clamp, lerp, smooth, fbm, seeded, dist2 } from './util.js';
import { T } from './i18n.js';
import { houseVillage } from './houses.js';
import { settings } from './state.js';
import { CUSTOM } from './custom.js';

import { keptFloats, rememberFloats } from './worldmemo.js';
import * as MAP from './content/map.js';

// (round T) every position comes from js/content/map.js: the exports below are built from it, so the files that
// import them (VILLAGE, TOWN, CITIES, RIVER, BRIDGE…) need no change, and moving a place there moves everything in it
export const MAP_VERSION = MAP.MAP_VERSION;
// (round T) the family's Studio map content ("world": land, buildings, moves; "npcs": villagers) is stamped with the layout
// it was made on (CUSTOM.world.map; none means 'C'). On a different layout it is put aside (parked), never applied at the
// wrong spot: Studio lists it to place again (G.parked, js/main.js).
export const STUDIO_ON_MAP = MAP.onThisMap(CUSTOM.world && typeof CUSTOM.world === 'object' ? CUSTOM.world.map : null);
export const PARKED = STUDIO_ON_MAP ? null : { map: (CUSTOM.world && CUSTOM.world.map) || 'C', world: CUSTOM.world || null, npcs: CUSTOM.npcs || null };
export const SIZE = MAP.WORLD.size, HALF = SIZE / 2, WATER = MAP.WORLD.water;
const MTN = MAP.WORLD.mountains, EDGE = MAP.WORLD.edge, SADDLES = MAP.SADDLES, RELIEF = MAP.RELIEF, COAST = MAP.WORLD.coast, RAMP = MAP.WORLD.ramp;

// Only nearby ridge segments can change the terrain. The 1.5-width boxes include the full 1.4-width falloff.
const RELIEF_SEGMENTS = RELIEF.map(R => ({ R, segments: R.pts.slice(0, -1).map(([ax, az], i) => {
  const [bx, bz] = R.pts[i + 1], dx = bx - ax, dz = bz - az, pad = R.w * 1.5;
  return { ax, az, dx, dz, len2: dx * dx + dz * dz, x0: Math.min(ax, bx) - pad, x1: Math.max(ax, bx) + pad, z0: Math.min(az, bz) - pad, z1: Math.max(az, bz) + pad };
}) }));
const PL = id => MAP.PLACES.find(p => p.id === id);
// a circle place { x, z, r, h }, a box place { x, z, x0, x1, z0, z1, h, roadZ }
/** a round place of the map: its middle, and its size and ground height where the map gives them */
type SvCircle = { x: number, z: number, r?: number, h?: number };
const circle = (id: string): SvCircle => { const p = PL(id), [x, z] = MAP.anchorOf(id), o: SvCircle = { x, z }; if (p.r != null) o.r = p.r; if (p.h != null) o.h = p.h; return o; };
const box = id => { const p = PL(id), [x, z] = MAP.anchorOf(id); return { x, z, x0: x - p.w, x1: x + p.w, z0: z - p.d, z1: z + p.d, h: p.h, roadZ: z + p.street.roadZ }; };
export const PLATEAU = circle('plateau');
export const VILLAGE = circle('village');
export const PADDIES = circle('paddies');
export const LAKE = circle('lake');
export const BAMBOO = circle('bamboo');
export const APOSTLES = circle('apostles'); // the Twelve Apostles (js/regionsites.js): kept free of trees
export const ULURU = circle('uluru');
export const HOIAN = circle('hoian');   // Hội An (round T: its landmark for now; the old town comes later)
// the home island in the middle of the river (round T, Concept D): an ellipse round its anchor
export const ISLAND = (() => { const p = PL('island'); return { x: p.at[0], z: p.at[1], rx: p.rx, rz: p.rz }; })();
// festival grounds (js/vnfun.js): the buffalo pushing ring north of Bắc Ninh, the bull-race field west of Sài Gòn; kept free of trees
export const FESTGROUNDS = { choitrau: circle('choitrau'), duabo: circle('duabo') };
export const HOME = circle('home');   // Sunny Farm: house, field, barn and Mr. Bear's market
export const PLAYGROUND = circle('playground');   // the park on Two Homes Street, where kids from Australia and Vietnam play
export const TOWN = box('town');   // Two Homes Street: Bà Rịa meets a Sydney suburb
export const MARKET = box('market');    // Chợ Ba Miền: the Three Regions market (north, central, south Vietnam)
export const AUSSIE = box('aussie'); // Aussie Corner: milk bar, fish and chips, ice-cream van, playground
// Cities around the valley: each a paved square with a welcome gate, landmarks, a game host and food kiosks (js/cities.js)
// gates: where the roads come in (the first is the main gate); the main street runs straight through
/** a city: its square (the corners are added just below), gates and look */
export type SvCity = { id: string, cc: string, x: number, z: number, w: number, d: number, h: number, icon: string, name: unknown, gates: number[][], layout?: { toward: number }, x0?: number, x1?: number, z0?: number, z1?: number };
export const CITIES = MAP.PLACES.filter(p => p.kind === 'city').map((p): SvCity => { const [x, z] = p.at;
  return { id: p.id, cc: p.cc, x, z, w: p.w, d: p.d, h: p.h, icon: p.icon, name: p.name, gates: p.gates.map(([dx, dz]) => [x + dx, z + dz]) }; });
CITIES.forEach(c => Object.assign(c, { x0: c.x - c.w, x1: c.x + c.w, z0: c.z - c.d, z1: c.z + c.d }));
const FLATS: { x0?: number, x1?: number, z0?: number, z1?: number, h: number, family?: boolean }[] = [TOWN, MARKET, AUSSIE, ...CITIES];
// the places whose ground is one flat level (see the hard rule at the end of heightAt): circles and boxes
type SvLevel = { x?: number, z?: number, r?: number, h: number, x0: number, x1: number, z0: number, z1: number };
let LEVELS: SvLevel[] = null;
// the level of the village or city at (x, z), or null outside them (roads crossing a place run at its level)
export function levelAt(x, z) { if (LEVELS) for (const A of LEVELS) { if (A.r ? dist2(x, z, A.x, A.z) <= A.r : x >= A.x0 && x <= A.x1 && z >= A.z0 && z <= A.z1) return A.h; } return null; }
// building lots along the roads out of each city (js/suburbs.js builds on them): levelled ground, no trees
export const LOTS = [];
// (round R story) bà Huệ and ông Nghi's yard (js/yard.js): its own levelled plot on the slope behind the north row of
// Two Homes Street, facing the street (+z), clear of the river; nothing else is built on it and no trees grow there
// (round T: an offset from Two Homes Street in the map, so it moves with the street)
export const YARD = (() => { const p = PL('yard'), [x, z] = MAP.anchorOf('yard'); return { x, z, w: p.w, d: p.d, rot: p.rot, h: p.h }; })();
LOTS.push({ city: 'yard', k: 0, ...YARD });
// Level ground under every building, stall and landmark (filled in by levelUnderBuildings once the world is built):
// each one gets a flat patch at the height it was placed at, easing back to the hillside over a few metres, so
// whatever is added later always stands on its own level land. Kept in a 16 m grid so looking one up is quick.
export const FOOTPRINTS = [];
const FP_GRID = new Map(), fpKey = (i, j) => i * 4096 + j;
function fpAdd(F) { FOOTPRINTS.push(F); for (let i = Math.floor((F.x0 - F.pad) / 16); i <= Math.floor((F.x1 + F.pad) / 16); i++) for (let j = Math.floor((F.z0 - F.pad) / 16); j <= Math.floor((F.z1 + F.pad) / 16); j++) { const k = fpKey(i, j); if (!FP_GRID.has(k)) FP_GRID.set(k, []); FP_GRID.get(k).push(F); } }
// the rivers (round T: the main river splits round the home island; Sông Hàn comes in from the east), and RIVER, the
// raft's line down the river (js/ferry.js)
export const RIVERS = MAP.WATERS.filter(w => w.kind === 'river').map(w => ({ id: w.id, w: w.w || 1, tone: w.tone || null, pts: w.pts.map(p => p.slice()) }));   // (round T2: w = width against the main river's, tone = a tinted surface)
// (round T2) small round lakes and ponds (Hồ Gươm in Hà Nội, the billabong by Uluru): { id, x, z, r }
export const PONDS = MAP.WATERS.filter(w => w.kind === 'pond').map(w => { const [x, z] = w.at || MAP.anchorOf(w.place).map((v, i) => v + ((w.off || [0, 0])[i])); return { id: w.id, x, z, r: w.r, islet: w.islet || 0, depth: w.depth || 2.4 }; });
// how far (x, z) is from the deep middle of the nearest pond (0 inside it), and which pond
export function pondDist(x, z) { let best = 1e9; PD_NEAR.id = null; for (const P of PONDS) { const dc = dist2(x, z, P.x, P.z); if (dc < P.islet + .8) continue; const d = Math.max(0, dc - P.r * (P.depth < 1.5 ? 1 : .62)); /* (owner, 29 Oct AEDT) a shallow pond's water reaches its radius */ if (d < best) { best = d; PD_NEAR.id = P.id; } } return best; }
const PD_NEAR = { id: null };
export const RIVER = (() => { const out = []; for (const id of [].concat(MAP.BOATS.find(b => b.id === 'raft').water)) RIVERS.find(r => r.id === id).pts.forEach((p, i) => { if (!(out.length && i === 0)) out.push(p.slice()); }); return out; })();
export const CHINA = circle('china');  // (4.5 m: the road up from Đà Nẵng stays under 8 %)    // China Town: lanterns, tiled roofs, a pagoda and a little Great Wall
export const INDIA = circle('india');  // (5.5 m: the road from the Brisbane junction stays under 8 %)  // India Village: colourful houses, a little Taj Mahal, rangoli and marigolds
LEVELS = [VILLAGE, HOME, CHINA, INDIA].map((C): SvLevel => ({ x: C.x, z: C.z, r: C.r, h: C.h, x0: C.x - C.r, x1: C.x + C.r, z0: C.z - C.r, z1: C.z + C.r }))
  .concat([TOWN, MARKET, AUSSIE, ...CITIES].map((B): SvLevel => ({ h: B.h, x0: B.x0, x1: B.x1, z0: B.z0, z1: B.z1 })));
// Bridges (round T: along the x or the z axis, from the map): { id, axis, a0, a1, c, w, h, … }, plus the old x0/x1/z
// (or z0/z1/x) names. BRIDGE and DRAGON are the two of today, by their old names.
/** a bridge: the map's bridge, its span along its axis, and the bank box worked out the first time it is needed */
export type SvBridge = { id: string, axis: string, a0: number, a1: number, c: number, w: number, h: number, bankOut?: number, over?: string, style?: string,
  name?: string[], landmark?: string, foot?: unknown, x?: number, z?: number, x0?: number, x1?: number, z0?: number, z1?: number, bank?: ReturnType<typeof bridgeBox> };
export const BRIDGES = MAP.BRIDGES.map((B): SvBridge => ({ ...B, ...(B.axis === 'z' ? { z0: B.a0, z1: B.a1, x: B.c } : { x0: B.a0, x1: B.a1, z: B.c }) }));
export const BRIDGE = BRIDGES.find(B => B.id === 'haique');   // the Harbour-style bridge carrying Two Homes Street over the river
export const DRAGON = BRIDGES.find(B => B.id === 'rong');   // Đà Nẵng's golden Dragon Bridge carrying the road east over the river
// along and across a bridge: how far along its axis, and how far off its middle line
export const bridgeAlong = (B, x, z) => B.axis === 'z' ? z : x;
export const bridgeAcross = (B, x, z) => B.axis === 'z' ? x - B.c : z - B.c;
// the bridge at (x, z), if any: within `across` of its middle line and from `before` metres before its start to `after`
// metres past its end (round T: one test for both axes; it used to be written out for each use)
export function bridgeAt(x, z, across = 0, before = 0, after = before) {
  for (const B of BRIDGES) { const u = bridgeAlong(B, x, z); if (Math.abs(bridgeAcross(B, x, z)) < across && u > B.a0 - before && u < B.a1 + after) return B; }
  return null;
}
// distance from (x, z) to a bridge's middle line
export const bridgeDist = (B, x, z) => { const u = bridgeAlong(B, x, z); return Math.hypot(Math.max(B.a0 - u, 0, u - B.a1), bridgeAcross(B, x, z)); };
// the box [x0, x1, z0, z1] covering a bridge from `a` to `b` along it and from `l` to `r` across it
export const bridgeBox = (B, a, b, l, r) => B.axis === 'z' ? { x0: B.c + l, x1: B.c + r, z0: a, z1: b } : { x0: a, x1: b, z0: B.c + l, z1: B.c + r };
// Roads: asphalt roads join every village and city; dirt roads link the quieter places to each other (the map has
// them and says why each runs where it does). Each has an id, a kind, its points and the place at each end (gates).
/** a road or path: its points, and its width, gates, loop and colour where it has them */
export type SvRoad = { id: string, kind: string, pts: number[][], w?: number, gates?: unknown[], loop?: boolean, tone?: string };
export const ROADS = MAP.ROADS.map(R => { const o: SvRoad = { id: R.id, kind: R.kind, pts: R.pts.map(p => p.slice()) }; if (R.gates) o.gates = R.gates.slice(); if (R.loop) o.loop = true; if (R.tone) o.tone = R.tone; return o; });
ROADS.forEach(R => { R.w = MAP.ROAD_WIDTH[R.kind]; }); // (rule R1: asphalt 6.4 m, dirt 3.4 m, footpath 1.6 m)
// HARD RULE: roads are straight lines joined by perfect circular curves (asphalt bends round a 24 m circle, dirt
// roads round 16 m, tighter only where two bends are close), and every road runs straight for its last 14 m into
// a village or city gate. A side road that ends on another road is joined back onto that road's new line.
{
  const STRAIGHT = 14;
  const fillet = (pts, R, gates) => {
    if (pts.length < 3) return pts.map(p => p.slice());
    const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), out = [pts[0].slice()], last = pts.length - 1;
    for (let i = 1; i < last; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i], [cx, cz] = pts[i + 1];
      const u1x = (bx - ax) / seg[i - 1], u1z = (bz - az) / seg[i - 1], u2x = (cx - bx) / seg[i], u2z = (cz - bz) / seg[i];
      const th = Math.acos(clamp(u1x * u2x + u1z * u2z, -1, 1)); if (th < .02) { out.push([bx, bz]); continue; }
      const half = Math.tan(th / 2);
      const room1 = i === 1 ? seg[0] - (gates[0] ? Math.min(STRAIGHT, seg[0] / 2) : 0) : seg[i - 1] / 2, room2 = i === last - 1 ? seg[i] - (gates[1] ? Math.min(STRAIGHT, seg[i] / 2) : 0) : seg[i] / 2;
      const t = Math.min(R * half, room1, room2); if (t < .3) { out.push([bx, bz]); continue; }
      const r = t / half, sg = u1x * u2z - u1z * u2x > 0 ? 1 : -1, p1x = bx - u1x * t, p1z = bz - u1z * t, p2x = bx + u2x * t, p2z = bz + u2z * t;
      const ccx = p1x - u1z * sg * r, ccz = p1z + u1x * sg * r;
      const a0 = Math.atan2(p1z - ccz, p1x - ccx); let da = Math.atan2(p2z - ccz, p2x - ccx) - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      const n = Math.max(2, Math.ceil(Math.abs(da) * r / Math.min(1.5, r * .1))); // (about one point every 1.5 m, closer on tight curves)
      for (let k = 0; k <= n; k++) { const a = a0 + da * k / n; out.push([ccx + Math.cos(a) * r, ccz + Math.sin(a) * r]); }
    }
    out.push(pts[last].slice()); return out.filter((p, i) => !i || Math.hypot(p[0] - out[i - 1][0], p[1] - out[i - 1][1]) > .05); // (no repeated points where two curves meet)
  };
  const near = (x, z, pts) => { let best = null, bd = 1e9; for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1), px = ax + dx * t, pz = az + dz * t, d = Math.hypot(x - px, z - pz); if (d < bd) { bd = d; best = [px, pz]; } } return { p: best, d: bd }; };
  // which road ends sit on another road (a junction), found on the lines as drawn
  const joins = ROADS.map(R => [0, 1].map(end => { if (R.loop || (R.gates || [])[end]) return null; const [x, z] = end ? R.pts[R.pts.length - 1] : R.pts[0]; const o = ROADS.find(O => O !== R && near(x, z, O.pts).d < 1.5); return o || null; }));
  // (round T) a road that closes on itself (the ring road): rounded at every corner, starting and ending in the middle of its first side
  for (const R of ROADS) { const rad = R.kind === 'asphalt' ? 24 : R.kind === 'dirt' ? 16 : 8;
    if (R.loop) { const p = R.pts, m = [(p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2]; R.pts = fillet([m, ...p.slice(1), p[0], m], rad, []); }
    else R.pts = fillet(R.pts, rad, R.gates || []); } // (footpaths bend round an 8 m circle: no step turns more than 8°)
  ROADS.forEach((R, k) => joins[k].forEach((O, end) => { if (!O) return; const i = end ? R.pts.length - 1 : 0, q = near(R.pts[i][0], R.pts[i][1], O.pts); if (q.d < 6) R.pts[i] = q.p; }));
}
// distance from (x, z) to the nearest road centre line, and that road (roadDist, below)
// (Round U, owner 11 Oct: "weeds still grow inside the asphalt road") how far (x, z) is from the edge of the nearest
// road or paved place street (the market's walking street, Aussie Corner's road, Two Homes Street, every city's main
// street: js/content/map.js MARKET_ROWS); negative on it. Everything that grows keeps off both.
let PLACE_STREETS = null;
export function edgeDist(x, z) {
  const rd = roadDist(x, z); let e = rd.road ? rd.d - rd.road.w / 2 : 99;
  if (!PLACE_STREETS) PLACE_STREETS = MAP.MARKET_ROWS.map(R => MAP.rowStreet(R.place)).filter(S => S && !S.plain);
  for (const S of PLACE_STREETS) { const t = Math.max(0, Math.min(S.len, (x - S.a[0]) * S.dx + (z - S.a[1]) * S.dz)); e = Math.min(e, Math.hypot(x - S.a[0] - S.dx * t, z - S.a[1] - S.dz * t) - S.w / 2); }
  return e;
}
// (17 Oct AEDT, PERF-001: start-up called this about 129,000 times, each time over all 362 road pieces, about 6.5 s
// of a tablet's start) the road pieces sit in a grid of 16 m cells; a call looks at the cells round (x, z), ring by
// ring outwards, and stops once no farther ring can hold anything nearer. Same answers as looking at every piece:
// on a tie the earlier road (and piece) in ROADS still wins. The grid is made again if ROADS ever changes.
const RD_CELL = 16, RD = { sig: [], cells: new Map(), segs: [], i0: 0, i1: -1, j0: 0, j1: -1, q: 0 };
function rdGrid() {
  let same = RD.sig.length === ROADS.length;
  for (let k = 0; same && k < ROADS.length; k++) { const g = RD.sig[k], R = ROADS[k]; same = g.R === R && g.p === R.pts && g.n === R.pts.length; }
  if (same) return RD;
  RD.sig = ROADS.map(R => ({ R, p: R.pts, n: R.pts.length })); RD.cells.clear(); RD.segs = []; RD.i0 = RD.j0 = 1e9; RD.i1 = RD.j1 = -1e9;
  ROADS.forEach(R => { for (let i = 0; i < R.pts.length - 1; i++) {
    const [ax, az] = R.pts[i], [bx, bz] = R.pts[i + 1], S = { ax, az, bx, bz, R, o: RD.segs.length, q: -1 }; RD.segs.push(S);
    const gi0 = Math.floor(Math.min(ax, bx) / RD_CELL), gi1 = Math.floor(Math.max(ax, bx) / RD_CELL), gj0 = Math.floor(Math.min(az, bz) / RD_CELL), gj1 = Math.floor(Math.max(az, bz) / RD_CELL);
    RD.i0 = Math.min(RD.i0, gi0); RD.i1 = Math.max(RD.i1, gi1); RD.j0 = Math.min(RD.j0, gj0); RD.j1 = Math.max(RD.j1, gj1);
    for (let gi = gi0; gi <= gi1; gi++) for (let gj = gj0; gj <= gj1; gj++) { const key = gi * 4096 + gj, L = RD.cells.get(key); if (L) L.push(S); else RD.cells.set(key, [S]); }
  } });
  return RD;
}
export function roadDist(x, z) {
  const G = rdGrid(); let best = 1e9, bo = 1e9, road = null; if (!G.segs.length) return { d: best, road };
  const q = ++G.q, ci = Math.floor(x / RD_CELL), cj = Math.floor(z / RD_CELL);
  const look = S => { if (S.q === q) return; S.q = q;
    const dx = S.bx - S.ax, dz = S.bz - S.az, t = clamp(((x - S.ax) * dx + (z - S.az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
    const d = Math.hypot(x - S.ax - dx * t, z - S.az - dz * t); if (d < best || (d === best && S.o < bo)) { best = d; bo = S.o; road = S.R; } };
  // every cell of ring r is at least (r - 1) * RD_CELL away from (x, z); once that passes the best, nothing nearer is left
  const far = Math.max(ci - G.i0, G.i1 - ci, cj - G.j0, G.j1 - cj);
  for (let r = 0; r <= far; r++) {
    if ((r - 1) * RD_CELL > best) break;
    for (let gi = ci - r; gi <= ci + r; gi++) { const edge = gi === ci - r || gi === ci + r;
      for (let gj = cj - r; gj <= cj + r; gj += edge ? 1 : 2 * r) { const L = G.cells.get(gi * 4096 + gj); if (L) for (const S of L) look(S); } }
  }
  return { d: best, road };
}

// distance from (x, z) to the middle line of the nearest river (round T: every river; looked up in a 16 m grid of the
// river pieces within RV_R of each cell, so it stays quick: anything farther than RV_R m from every river gives RV_R)
const RV_R = 32, RV_GRID = new Map(), RV_NEAR = { id: null };
// (round T2) a river of width w counts distances in its own widths: d / w, so a narrow river's banks are closer
for (const r of RIVERS) for (let i = 0; i < r.pts.length - 1; i++) { const [ax, az] = r.pts[i], [bx, bz] = r.pts[i + 1], S = { ax, az, bx, bz, id: r.id, k: 1 / r.w }, R = RV_R * Math.max(1, r.w);
  for (let gi = Math.floor((Math.min(ax, bx) - R) / 16); gi <= Math.floor((Math.max(ax, bx) + R) / 16); gi++) for (let gj = Math.floor((Math.min(az, bz) - R) / 16); gj <= Math.floor((Math.max(az, bz) + R) / 16); gj++) { const k = gi * 4096 + gj + 2048; if (!RV_GRID.has(k)) RV_GRID.set(k, []); RV_GRID.get(k).push(S); } }
export function riverDist(x, z) {
  const list = RV_GRID.get(Math.floor(x / 16) * 4096 + Math.floor(z / 16) + 2048); let best = RV_R; RV_NEAR.id = null; if (!list) return best;
  for (const S of list) { const dx = S.bx - S.ax, dz = S.bz - S.az, t = clamp(((x - S.ax) * dx + (z - S.az) * dz) / (dx * dx + dz * dz), 0, 1), d = Math.hypot(x - S.ax - dx * t, z - S.az - dz * t) * S.k; if (d < best) { best = d; RV_NEAR.id = S.id; } }
  return best;
}
// (round T) the water at (x, z), if any: the river's id within `pad` m of its middle line, 'lake' inside the lake's deep
// middle; and how far (x, z) is from open water (the river's middle line, or the lake's deep middle: 0 inside it)
export function waterAt(x, z, pad = 6) { if (riverDist(x, z) < pad) return RV_NEAR.id; if (dist2(x, z, LAKE.x, LAKE.z) < LAKE.r * .62) return 'lake'; if (pondDist(x, z) === 0) return PD_NEAR.id; return null; }
export function waterDist(x, z) { return Math.min(riverDist(x, z), Math.max(0, dist2(x, z, LAKE.x, LAKE.z) - LAKE.r * .62), pondDist(x, z)); }
// (17 Oct AEDT, PERF-001) a point clearly beyond r + fall is left as it is without working out the distance: the weight
// there is 0, so the answer is the same to the last bit
const flat = (h, x, z, c, r, fall, target) => { const R = r + fall, dx = x - c.x, dz = z - c.z; if (dx >= R || dx <= -R || dz >= R || dz <= -R) return h; return lerp(h, target, 1 - smooth(r, R, dist2(x, z, c.x, c.z))); };

// Height of the ground at (x, z). Used for the mesh and for walking, so they always agree.
// The level ground round every village, town and city reaches WIDE metres further than the places themselves, so
// there is always room to add new houses and buildings. It is switched on by widenFlatLand() once the whole world is
// built, so everything already there keeps exactly its place (only lifted or lowered onto the new ground).
let WIDE = 0, PADS = null, RB_ON = false, RB_COV = false, HERITAGE_GROUNDS_ON = false;
const RB_GRID = new Map(), RB_T = [], RB_D = new Float64Array(256), RB_Y = new Float64Array(256), RB_W = new Float64Array(256), RB_E = new Uint8Array(256), RB_P = new Uint8Array(256); // (past a road's very end there is no road)
// the road beds: [{ ax, az, bx, bz, ya, yb, hw }], registered by js/roads.js before it switches them on
export function setRoadBeds(segs) { RB_GRID.clear(); for (const S of segs) { const r = S.hw + 10; for (let i = Math.floor((Math.min(S.ax, S.bx) - r) / 8); i <= Math.floor((Math.max(S.ax, S.bx) + r) / 8); i++) for (let j = Math.floor((Math.min(S.az, S.bz) - r) / 8); j <= Math.floor((Math.max(S.az, S.bz) + r) / 8); j++) { const k = fpKey(i, j); if (!RB_GRID.has(k)) RB_GRID.set(k, []); RB_GRID.get(k).push(S); } } }
export function heightAt(x, z) {
  let h = 5 + fbm(x * .011, z * .011, 4) * 11 + fbm(x * .05 + 3, z * .05, 2) * 1.2;
  const mtn = smooth(MTN.z0, MTN.z1, z);
  if (mtn) h += mtn * (22 + fbm(x * .018 + 7, z * .018 - 3, 4) * 34); // (no mountains here: nothing to add, so no noise worked out)
  h += smooth(EDGE[0], EDGE[1], Math.max(Math.abs(x), -z)) * 45; // (round T: east, west and north; the south is the coast)
  if (h < 3) h = 3 - (3 - h) * .3; // (round T) the open ground never dips into the water by itself: only rivers, lakes and the sea are wet
  // a low ridge (the Great Dividing Range), lower at its pass
  for (const { R, segments } of RELIEF_SEGMENTS) { let d = 1e9; for (const S of segments) { if (x < S.x0 || x > S.x1 || z < S.z0 || z > S.z1) continue; const t = clamp(((x - S.ax) * S.dx + (z - S.az) * S.dz) / S.len2, 0, 1); d = Math.min(d, Math.hypot(x - S.ax - S.dx * t, z - S.az - S.dz * t)); }
    if (d > R.w * 1.5) continue; const top = R.pass ? lerp(R.pass.h, R.h, smooth(R.pass.w * .5, R.pass.w * 1.6, dist2(x, z, R.pass.at[0], R.pass.at[1]))) : R.h; h += top * (1 - smooth(R.w * .35, R.w * 1.4, d)); }
  // The Dawn Plateau, with a gentle ramp down to the south so little legs can walk off it.
  const dp = dist2(x, z, PLATEAU.x, PLATEAU.z);
  const base = h;
  if (dp < PLATEAU.r + 10) h = lerp(h, PLATEAU.h + fbm(x * .08, z * .08, 2) * .6, 1 - smooth(PLATEAU.r, PLATEAU.r + 10, dp)); // (farther: weight 0)
  if (dp > PLATEAU.r - 2 && z > PLATEAU.z) {
    const across = Math.abs(x - PLATEAU.x) / Math.max(1, dp);
    const w = smooth(.32, .16, across) * (1 - smooth(PLATEAU.r + RAMP - 12, PLATEAU.r + RAMP + 6, dp));
    h = lerp(h, lerp(PLATEAU.h, Math.max(base, 4), smooth(PLATEAU.r, PLATEAU.r + RAMP, dp)), w);
  }
  h = flat(h, x, z, VILLAGE, VILLAGE.r + WIDE, 16, VILLAGE.h);
  h = flat(h, x, z, HOME, HOME.r + WIDE * .8, 16, HOME.h);
  h = flat(h, x, z, PLAYGROUND, PLAYGROUND.r, 12, PLAYGROUND.h);
  h = flat(h, x, z, CHINA, Math.max(CHINA.r + WIDE, HERITAGE_GROUNDS_ON ? MAP.HERITAGE_GROUNDS.china.radius : 0), 18, CHINA.h);
  h = flat(h, x, z, INDIA, Math.max(INDIA.r + WIDE, HERITAGE_GROUNDS_ON ? MAP.HERITAGE_GROUNDS.india.radius : 0), 18, INDIA.h);
  h = flat(h, x, z, PADDIES, PADDIES.r, 12, PADDIES.h + (Math.floor((z - PADDIES.z) / 9) * .35));
  if (Math.abs(x - BAMBOO.x) < BAMBOO.r + 10 && Math.abs(z - BAMBOO.z) < BAMBOO.r + 10) h = flat(h, x, z, BAMBOO, BAMBOO.r - 10, 20, 5 + fbm(x * .03, z * .03, 2) * 2); // (farther: weight 0, no noise needed)
  const dl = dist2(x, z, LAKE.x, LAKE.z);
  h = lerp(h, -7, 1 - smooth(LAKE.r * .55, LAKE.r, dl));
  h = lerp(h, Math.min(h, 1.2), 1 - smooth(LAKE.r, LAKE.r + 14, dl));
  for (const F of FLATS) { const ox = Math.max(F.x0 - WIDE - x, 0, x - F.x1 - WIDE), oz = Math.max(F.z0 - WIDE - z, 0, z - F.z1 - WIDE), fall = WIDE ? 16 : 12; if (ox < fall && oz < fall) h = lerp(h, F.h, 1 - smooth(0, fall, Math.hypot(ox, oz))); }
  for (const L of LOTS) { // a level plot, easing back to the hillside over 4 m
    const dx = x - L.x, dz = z - L.z; if (Math.abs(dx) > 16 || Math.abs(dz) > 16) continue;
    const a = Math.abs(dx * Math.cos(L.rot) - dz * Math.sin(L.rot)) - L.w / 2, b = Math.abs(dx * Math.sin(L.rot) + dz * Math.cos(L.rot)) - L.d / 2, dd = Math.hypot(Math.max(a, 0), Math.max(b, 0));
    if (dd < 4) h = lerp(h, L.h, 1 - smooth(0, 4, dd));
  }
  // where the road from Sydney crosses the Dawn Plateau's ramp to Two Homes Street: a gentle saddle, so the road
  // meets the street at its own level by the gate (the street's west end used to be buried under the hillside)
  for (const S of SADDLES) { const [sx0, sx1, sz0, sz1] = S.box; if (!(x > sx0 && x < sx1 && z > sz0 && z < sz1)) continue;
    const SX = S.heights, [[ax, az], [bx, bz], [ex, ez]] = S.line;
    let sy = SX[SX.length - 1][1]; for (let i = 0; i < SX.length - 1; i++) if (x >= SX[i][0] && x <= SX[i + 1][0]) { const t = (x - SX[i][0]) / (SX[i + 1][0] - SX[i][0]); sy = SX[i][1] + (SX[i + 1][1] - SX[i][1]) * t * t * (3 - 2 * t); }
    const zc = x < bx ? bz + (bx - x) / (bx - ax) * (az - bz) : bz - (x - bx) / (ex - bx) * (bz - ez), across = Math.abs(z - zc);
    const w = (1 - smooth(6, z < zc ? 26 : 20, across)) * smooth(sx0, sx0 + 6, x) * (1 - smooth(sx1 - 6, sx1, x));
    h = lerp(h, sy, w);
  }
  // the festival grounds are level (their height is the natural height at their centre, worked out once)
  for (const F of Object.values(FESTGROUNDS)) {
    if (Math.abs(x - F.x) > 21 || Math.abs(z - F.z) > 21) continue; const d = dist2(x, z, F.x, F.z); if (d > 21 || F.h === null) continue;
    if (F.h === undefined) { F.h = null; F.h = heightAt(F.x, F.z); }
    h = lerp(h, F.h, 1 - smooth(15, 21, d));
  }
  // the lake stays a lake: level land round the market and farm used to spill into it (a sandy tongue the ferry drove over)
  if (dl < LAKE.r) h = lerp(h, Math.min(h, -7), 1 - smooth(LAKE.r * .62, LAKE.r * .82, dl));
  // shrines and the rocks with a Leafy under them stand on a small dry pad (one shrine stood in a pond)
  if (PADS) for (const S of PADS) { if (Math.abs(x - S.x) >= 7 || Math.abs(z - S.z) >= 7) continue; const d = dist2(x, z, S.x, S.z); if (d < 7) h = lerp(h, Math.max(h, WATER + 1.4), 1 - smooth(3.6, 7, d)); }
  // the southern coast: a sandy beach, then the sea (its edge waves gently)
  { const cz = COAST.z + Math.sin(x * .025) * 4 + Math.sin(x * .07 + 1) * 2; h = lerp(h, Math.min(h, 1), smooth(cz - 26, cz - 8, z)); h = lerp(h, COAST.sea, smooth(cz - 6, cz + 8, z)); }
  const dr = riverDist(x, z);
  // A shallow, even riverbed: keep the swimming channel below the 0.9 m threshold and the boat hulls clear.
  // Water level, bridge decks and banks stay at their authored elevations.
  h = lerp(h, WATER - MAP.WORLD.riverDepth, 1 - smooth(3.5, 11, dr));
  // (round T2) ponds: a round hollow with a gentle shore (after the places' flat ground, so a pond by a city stays wet)
  let dpd = 1e9; for (const P of PONDS) { if (Math.abs(x - P.x) > P.r + 8 || Math.abs(z - P.z) > P.r + 8) continue; const d = dist2(x, z, P.x, P.z); if (d > P.r + 8) continue; dpd = Math.min(dpd, d - P.r); h = lerp(h, Math.min(h, 1), 1 - smooth(P.r, P.r + 6, d)); h = lerp(h, -P.depth, 1 - (P.depth < 1.5 ? smooth(P.r - .5, P.r + 2.5, d) : smooth(P.r * .55, P.r, d))); /* (r89) a pond's own depth: Hồ Gươm is shallow enough to wade; (owner, 29 Oct AEDT: "Hồ Gươm is on dry land") a shallow pond's floor stays down to its edge, so the water reaches its radius: rising from half way left its outer third dry (a deep pond, the billabong, was already full) */ if (P.islet) h = lerp(h, WATER + .5, 1 - smooth(P.islet, P.islet + 1.6, d)); }
  // Raised banks either side of each bridge.
  if (dr > 7) for (const B of BRIDGES) { const K = B.bank || (B.bank = bridgeBox(B, B.a0 - 10, B.a1 + (B.bankOut || 16), -8, 8)); if (x <= K.x0 || x >= K.x1 || z <= K.z0 || z >= K.z1) continue; // (round T2: a quick box test first, 13 bridges now)
    if (levelAt(x, z) != null) continue;   // (Round U: a bank never reaches inside a village or city: places stay flat to their gates)
    const u = bridgeAlong(B, x, z), v = bridgeAcross(B, x, z); // (never over the river itself: boats pass under)
    // level ground at deck height at both ends, easing back to the natural hills further away; the river in the middle is left alone
    // (Round U: bankOut, a longer east bank where a junction is close to the deck's end: the Phố Hai Quê bridge and the ring road)
    const west = smooth(B.a0 + 8, B.a0 + 3, u), east = smooth(B.a1 - 8, B.a1 - 3, u) * (1 - smooth(B.a1 + (B.bankOut ? B.bankOut - 10 : 4), B.a1 + (B.bankOut || 16), u));
    const w = (1 - smooth(4, 8, Math.abs(v))) * (west + east);
    h = lerp(h, B.h - .2, clamp(w, 0, 1));
  }
  // road beds (js/roads.js): the ground under and beside every road is shaped to the road's own smooth height,
  // so the road never floats, never sinks into a bump, and walking on it is walking on the ground
  RB_COV = false;
  // (round T2: road beds never fill the lake or a pond either)
  if (RB_ON && dr > 6.5 && dl > LAKE.r * .82 && dpd > 0) { const list = RB_GRID.get(fpKey(Math.floor(x / 8), Math.floor(z / 8))); if (list) { // (never fills the river: bridges carry roads over it)
    // each road's nearest piece gives its height here; where two roads overlap (a junction) the higher one is the
    // one you see, so the ground follows that one
    let bd = 1e9, by = 0, bw = 0, cover = -1e9; RB_T.length = 0;
    for (const S of list) { const dx = S.bx - S.ax, dz = S.bz - S.az, t = clamp(((x - S.ax) * dx + (z - S.az) * dz) / (dx * dx + dz * dz || 1), 0, 1), d = Math.hypot(x - S.ax - dx * t, z - S.az - dz * t);
      if (!RB_T.includes(S.r)) { RB_T.push(S.r); RB_D[S.r] = 1e9; }
      if (d < RB_D[S.r]) { RB_D[S.r] = d; RB_Y[S.r] = S.ya + (S.yb - S.ya) * t; RB_W[S.r] = S.hw; RB_E[S.r] = (S.first && t === 0) || (S.last && t === 1) ? 1 : 0; RB_P[S.r] = S.tip ? 1 : 0; } }
    // (where a side road's tip lies on a through road, the through road's surface is the one that counts)
    let tipCover = -1e9;
    for (const r of RB_T) { if (RB_D[r] <= RB_W[r] + .25 && !RB_E[r]) { if (RB_P[r]) tipCover = Math.max(tipCover, RB_Y[r]); else cover = Math.max(cover, RB_Y[r]); } if (RB_D[r] < bd) { bd = RB_D[r]; by = RB_Y[r]; bw = RB_W[r]; } }
    if (cover === -1e9) cover = tipCover;
    RB_COV = cover > -1e9;
    // beside the road the ground eases back to the hillside; a deeper cutting or bank gets a wider, gentler slope
    if (cover > -1e9) h = cover - .03; else { const e = Math.min(10, Math.max(4, Math.abs(h - by) * 2)); if (bd < bw + e) h = lerp(h, by - .03, 1 - smooth(bw + .35, bw + e, bd)); }
  } }
  // HARD RULE: every village, town and city stands on one flat level, all the way across (only the river, the
  // lake, ponds, bridge banks and the road surface itself are left as they are); it eases back to the hills over 8 m
  if (!RB_COV && LEVELS && h >= WATER + .5 && dr >= 13 && dl >= LAKE.r + 4 && dpd >= 4) { let best = null, bo = 8; // the place it is in (or nearest to)
    for (const A of LEVELS) { if (x < A.x0 - 8 || x > A.x1 + 8 || z < A.z0 - 8 || z > A.z1 + 8) continue;
      const out = A.r ? Math.max(0, dist2(x, z, A.x, A.z) - A.r) : Math.hypot(Math.max(A.x0 - x, 0, x - A.x1), Math.max(A.z0 - z, 0, z - A.z1)); if (out < bo) { bo = out; best = A; } }
    if (best && !bridgeAt(x, z, 9, 12, 18)) h = lerp(h, best.h, 1 - smooth(0, 8, bo));
  }
  // level ground under every building (after the roads, except where a road actually is)
  if (FP_GRID.size && !RB_COV) { const list = FP_GRID.get(fpKey(Math.floor(x / 16), Math.floor(z / 16))); if (list) for (const F of list) {
    const ox = Math.max(F.x0 - x, 0, x - F.x1), oz = Math.max(F.z0 - z, 0, z - F.z1); if (ox > F.pad || oz > F.pad) continue;
    const d = Math.hypot(ox, oz); if (d < F.pad) h = lerp(h, F.h, 1 - smooth(0, F.pad, d));
  } }
  return h;
}

// (round T4a) what a child is walking on at (x, z) (y: their feet): 'wood' on a bridge deck or a pier, 'water' in the shallows,
// 'road' on asphalt or a town's paving, 'dirt' on a dirt road or footpath, 'sand' on the beach, else 'grass' (footsteps)
export function surfaceAt(x, z, y = null) {
  const h = heightAt(x, z);
  if (y != null && y > h + .4 && (bridgeAt(x, z, 4.5) || h < WATER + .15)) return 'wood';   // a bridge deck, or a pier over the water
  if (h < WATER + .15) return 'water';
  const rd = roadDist(x, z); if (rd.road && rd.d < rd.road.w / 2) return rd.road.kind === 'asphalt' ? 'road' : 'dirt';
  if (CITIES.some(c => x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1)) return 'road';
  if (h < 1.6 && z > COAST.z - 40) return 'sand';
  return 'grass';
}
export function regionAt(x, z) {
  if (dist2(x, z, PLATEAU.x, PLATEAU.z) < PLATEAU.r + 8 && heightAt(x, z) > PLATEAU.h - 2) return 'plateau'; // its top, from the map (round T lowered it to 8 m)
  for (const c of CITIES) if (x > c.x0 - 4 && x < c.x1 + 4 && z > c.z0 - 4 && z < c.z1 + 4) return c.id;
  if (dist2(x, z, VILLAGE.x, VILLAGE.z) < VILLAGE.r + 10) return 'village';
  if (MAP.inHeritageGrounds('china', x, z) || dist2(x, z, CHINA.x, CHINA.z) < CHINA.r + 8) return 'china';
  if (MAP.inHeritageGrounds('india', x, z) || dist2(x, z, INDIA.x, INDIA.z) < INDIA.r + 8) return 'india';
  if (dist2(x, z, HOME.x, HOME.z) < HOME.r + 6) return 'home';
  if (dist2(x, z, PADDIES.x, PADDIES.z) < PADDIES.r + 8) return 'paddies';
  if (x > TOWN.x0 - 3 && x < TOWN.x1 + 3 && z > TOWN.z0 - 3 && z < TOWN.z1 + 3) return 'town';
  if (x > MARKET.x0 - 3 && x < MARKET.x1 + 3 && z > MARKET.z0 - 3 && z < MARKET.z1 + 3) return 'market';
  if (x > AUSSIE.x0 - 3 && x < AUSSIE.x1 + 3 && z > AUSSIE.z0 - 3 && z < AUSSIE.z1 + 3) return 'aussie';
  if (dist2(x, z, HOIAN.x, HOIAN.z) < HOIAN.r + 6) return 'hoian';
  for (const V of MEMORY) if (x > V.x0 && x < V.x1 && z > V.z0 && z < V.z1) return V.id;   // (round T3) the Memory Villages
  if (dist2(x, z, LAKE.x, LAKE.z) < LAKE.r + 12) return 'lake';
  if (dist2(x, z, BAMBOO.x, BAMBOO.z) < BAMBOO.r + 6) return 'bamboo';
  if (z < MTN.region) return 'mountain';
  return 'meadow';
}
export const REGION_NAMES = {
  plateau: () => T('Dawn Plateau', 'Cao Nguyên Bình Minh'),
  village: () => T('Lotus Village', 'Làng Sen'),
  town: () => T('Two Homes Street', 'Phố Hai Quê'),
  market: () => T('Three Regions Market', 'Chợ Ba Miền'),
  aussie: () => T('Aussie Corner', 'Góc Nước Úc'),
  china: () => T('China Town', 'Làng Trung Hoa'),
  india: () => T('India Village', 'Làng Ấn Độ'),
  home: () => T('Sunny Farm', 'Nông Trại Nắng Mai'),
  paddies: () => T('Golden Rice Fields', 'Cánh Đồng Lúa Vàng'),
  lake: () => T('Mirror Lake', 'Hồ Gương'),
  hoian: () => T('Hội An', 'Hội An'),
  ...Object.fromEntries(MAP.PLACES.filter(p => p.kind === 'plots').map(p => [p.id, () => T(p.name[0], p.name[1])])),
  bamboo: () => T('Whispering Bamboo', 'Rừng Tre Thì Thầm'),
  mountain: () => T('Snowcap Peaks', 'Núi Tuyết Trắng'),
  meadow: () => T('Breezy Meadows', 'Đồng Cỏ Lộng Gió')
};
CITIES.forEach(c => { REGION_NAMES[c.id] = () => T(c.name[0], c.name[1]); });

// ---------- places of interest ----------
export const SHRINES = MAP.SHRINES.map(({ id, game, at }) => ({ id, game, x: at[0], z: at[1] }));
const TOWER_NAMES = { tw_plateau: () => T('Dawn Tower', 'Tháp Bình Minh'), tw_bamboo: () => T('Bamboo Tower', 'Tháp Rừng Tre'), tw_peaks: () => T('Peak Tower', 'Tháp Núi Tuyết'), tw_lake: () => T('Lake Tower', 'Tháp Hồ Gương') };
export const TOWERS = MAP.TOWERS.map(({ id, at }) => ({ id, x: at[0], z: at[1], name: TOWER_NAMES[id] || (() => id) }));
export const TOWER_H = 26, REVEAL_R = 130;
export const LEAFIES = MAP.LEAFIES.map(({ id, kind, at, inWater }) => ({ id, kind, x: Number(at[0]), z: Number(at[1]), ...(inWater ? { inWater } : {}) }));
PADS = [...SHRINES, ...LEAFIES.filter(l => l.kind === 'rock')];

// ---------- the world object ----------
// ---------- (round T3) garden plots: the Memory Villages' (from the map) and up to three spare ones by the roads out of each city ----------
// { id, village (or city), x, z, rot (the way the front faces), w (along the lane), d, address: [en, vi], h }. Each is also a
// lot (so trees and suburbs keep off it); once the roads are made it is levelled at the height of the lane in front of it
// (levelUnderBuildings). Families put the homes they remember on them later (Studio's Plots page); until then, a garden.
/** a Memory Village garden plot (js/plots.js); spareFrom: the first one no family has yet */
export const PLOTS: { id: string, village: string, x: number, z: number, rot: number, w: number, d: number, h?: number, address?: unknown, occupied?: boolean }[] & { spareFrom?: number } = [];
{
  const add = P => { const fx = Math.sin(P.rot), fz = Math.cos(P.rot), sx = Math.cos(P.rot), sz = -Math.sin(P.rot), hs = [];
    for (const u of [-.5, 0, .5]) for (const v of [-.5, 0, .5]) hs.push(heightAt(P.x + sx * P.w * u + fx * P.d * v, P.z + sz * P.w * u + fz * P.d * v));
    P.h = hs.reduce((p, q) => p + q, 0) / hs.length; PLOTS.push(P); LOTS.push({ city: 'plot', k: PLOTS.length - 1, x: P.x, z: P.z, rot: P.rot, w: P.w, d: P.d, h: P.h }); };
  for (const p of MAP.PLOTS) { const [ax, az] = MAP.anchorOf(p.village); add({ id: p.id, village: p.village, x: ax + p.off[0], z: az + p.off[1], rot: p.rot, w: p.w, d: p.d, address: p.address }); }
  PLOTS.spareFrom = PLOTS.length;
}
// (round T3) each Memory Village's area: its plots and lanes, 4 m round them
export const MEMORY = MAP.PLACES.filter(p => p.kind === 'plots').map(p => { const B = { id: p.id, x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 };
  for (const P of PLOTS) if (P.village === p.id) { B.x0 = Math.min(B.x0, P.x - 8); B.x1 = Math.max(B.x1, P.x + 8); B.z0 = Math.min(B.z0, P.z - 8); B.z1 = Math.max(B.z1, P.z + 8); } return B; });
export const plotBox = P => { const c = Math.abs(Math.cos(P.rot)), s = Math.abs(Math.sin(P.rot)), hx = (P.w * c + P.d * s) / 2, hz = (P.w * s + P.d * c) / 2; return { x0: P.x - hx, x1: P.x + hx, z0: P.z - hz, z1: P.z + hz }; };

// ---------- building lots round the cities ----------
// Walk out along each road from a city gate (10–70 m) and keep the first spots, on either side, that are
// dry, not too steep to level, clear of the road and of every other place. Two per city.
{
  const W = 10, D = 12, circles = [VILLAGE, CHINA, INDIA, HOME, PLAYGROUND, PLATEAU, PADDIES, LAKE];
  const clear = (x, z) => !FLATS.some(F => x > F.x0 - 6 && x < F.x1 + 6 && z > F.z0 - 6 && z < F.z1 + 6) && !circles.some(c => dist2(x, z, c.x, c.z) < c.r + 6)
    && !SHRINES.some(s => dist2(x, z, s.x, s.z) < 14) && !TOWERS.some(s => dist2(x, z, s.x, s.z) < 14) && !LEAFIES.some(s => dist2(x, z, s.x, s.z) < 8)
    && !bridgeAt(x, z, 16, 16) && riverDist(x, z) > 13 && !LOTS.some(L => dist2(x, z, L.x, L.z) < 15);
  for (const c of CITIES) {
    let n = 0;
    for (const [gx, gz] of c.gates) for (const R of ROADS) {
      if (n >= 2) break;
      const a = R.pts[0], b = R.pts[R.pts.length - 1];
      const pts = Math.hypot(a[0] - gx, a[1] - gz) < 1.5 ? R.pts : Math.hypot(b[0] - gx, b[1] - gz) < 1.5 ? R.pts.slice().reverse() : null; if (!pts) continue;
      let along = 0;
      for (let i = 0; i < pts.length - 1 && n < 2; i++) {
        const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / L, dz = (bz - az) / L;
        for (let t = 0; t < L && n < 2; t += 2) {
          const run = along + t; if (run < 10 || run > 60) continue;
          for (const side of n % 2 ? [1, -1] : [-1, 1]) {
            const off = R.w / 2 + 2.4 + D / 2, x = ax + dx * t - dz * off * side, z = az + dz * t + dx * off * side, rot = Math.atan2(dz * side, -dx * side);
            if (!clear(x, z)) continue;
            const fx = Math.sin(rot), fz = Math.cos(rot), sx = Math.cos(rot), sz = -Math.sin(rot), hs = [];
            let onRoad = false;
            for (const u of [-.5, 0, .5]) for (const v of [-.5, 0, .5]) { const px = x + sx * W * u + fx * D * v, pz = z + sz * W * u + fz * D * v; hs.push(heightAt(px, pz)); const r = roadDist(px, pz); if (r.d < r.road.w / 2 + 1.4) onRoad = true; }
            const lo = Math.min(...hs), hi = Math.max(...hs);
            if (onRoad || hi - lo > 3 || lo < WATER + 1.6) continue;
            LOTS.push({ city: c.id, k: n, x, z, rot, w: W, d: D, h: hs.reduce((p, q) => p + q, 0) / hs.length }); n++; break;
          }
        }
        along += L;
      }
    }
    // not enough room along the roads: try a ring just outside the city square, facing the city
    for (let k = 0; k < 96 && n < 2; k++) {
      const ang = (k % 48) / 48 * Math.PI * 2 + .3, rr = Math.max(c.w, c.d) + (k < 48 ? 10 : 17), x = c.x + Math.sin(ang) * rr, z = c.z + Math.cos(ang) * rr, rot = ang + Math.PI;
      if (!clear(x, z)) continue;
      const fx = Math.sin(rot), fz = Math.cos(rot), sx = Math.cos(rot), sz = -Math.sin(rot), hs = [];
      let onRoad = false;
      for (const u of [-.5, 0, .5]) for (const v of [-.5, 0, .5]) { const px = x + sx * W * u + fx * D * v, pz = z + sz * W * u + fz * D * v; hs.push(heightAt(px, pz)); const r = roadDist(px, pz); if (r.d < r.road.w / 2 + 1.4) onRoad = true; }
      const lo = Math.min(...hs), hi = Math.max(...hs);
      if (onRoad || hi - lo > 3 || lo < WATER + 1.6) continue;
      LOTS.push({ city: c.id, k: n, x, z, rot, w: W, d: D, h: hs.reduce((p, q) => p + q, 0) / hs.length }); n++;
    }
  }
}

// (round T3) up to three spare garden plots by the roads out of each city, 15–110 m from the gate, the front 1 m from the road's
// edge, kept clear like the lots (and off them)
{
  const W = 6, D = 7, circles = [VILLAGE, CHINA, INDIA, HOME, PLAYGROUND, PLATEAU, PADDIES, LAKE];
  const clear = (x, z) => !FLATS.some(F => x > F.x0 - 5 && x < F.x1 + 5 && z > F.z0 - 5 && z < F.z1 + 5) && !circles.some(c => dist2(x, z, c.x, c.z) < c.r + 6)
    && !SHRINES.some(s => dist2(x, z, s.x, s.z) < 10) && !TOWERS.some(s => dist2(x, z, s.x, s.z) < 10) && !LEAFIES.some(s => dist2(x, z, s.x, s.z) < 7)
    && !bridgeAt(x, z, 14, 14) && riverDist(x, z) > 13 && pondDist(x, z) > 8 && !LOTS.some(L => dist2(x, z, L.x, L.z) < (L.city === 'plot' ? 8 : 14));
  for (const c of CITIES) {
    let n = 0;
    for (const [gx, gz] of c.gates) for (const R of ROADS) {
      if (n >= 3) break; if (R.kind === 'footpath') continue;
      const a = R.pts[0], b = R.pts[R.pts.length - 1];
      const pts = Math.hypot(a[0] - gx, a[1] - gz) < 1.5 ? R.pts : Math.hypot(b[0] - gx, b[1] - gz) < 1.5 ? R.pts.slice().reverse() : null; if (!pts) continue;
      let along = 0;
      for (let i = 0; i < pts.length - 1 && n < 3; i++) {
        const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / L, dz = (bz - az) / L;
        for (let t = 0; t < L && n < 3; t += 2) {
          const run = along + t; if (run < 15 || run > 110) continue;
          for (const side of [1, -1]) {
            const off = R.w / 2 + 1 + D / 2, x = ax + dx * t - dz * off * side, z = az + dz * t + dx * off * side, rot = Math.atan2(dz * side, -dx * side);
            // (only where the road runs north–south or east–west: a plot is square to the map, so its box is the plot)
            if (Math.abs(Math.sin(rot * 2)) > .01 || !clear(x, z)) continue;
            const fx = Math.sin(rot), fz = Math.cos(rot), sx = Math.cos(rot), sz = -Math.sin(rot), hs = [];
            let bad = false;
            // (about every metre over the plot: a bend in the road can cut a corner between coarser samples)
            for (let u = -.5; u <= .5; u += 1 / 6) for (let v = -.5; v <= .5; v += 1 / 7) { const px = x + sx * W * u + fx * D * v, pz = z + sz * W * u + fz * D * v; hs.push(heightAt(px, pz)); const r = roadDist(px, pz); if (r.d < r.road.w / 2 + .6) bad = true; }
            const lo = Math.min(...hs), hi = Math.max(...hs);
            if (bad || hi - lo > 2.5 || lo < WATER + 1.6) continue;
            n++; const P = { id: `sp_${c.id}_${n}`, village: c.id, x, z, rot, w: W, d: D, address: [`Plot ${n}, ${c.name[0]}`, `Lô ${n}, ${c.name[1]}`], h: hs.reduce((p, q) => p + q, 0) / hs.length };
            PLOTS.push(P); LOTS.push({ city: 'plot', k: PLOTS.length - 1, x, z, rot, w: W, d: D, h: P.h }); break;
          }
        }
        along += L;
      }
    }
  }
}

// the ground as it was before the level land was widened (the same while the world is being built)
export function oldHeightAt(x, z) { const w = WIDE; WIDE = 0; try { return heightAt(x, z); } finally { WIDE = w; } }
export function createWorld(scene, quality) {
  // Generate the legacy housing/garden lots above on the original terrain first: saved home/plot IDs must not shift.
  // Then build the rendered terrain and all placed objects on the district's level heritage grounds.
  HERITAGE_GROUNDS_ON = true;
  const wParts = {
    colliders: [], boxes: [], platforms: [], stalls: [], walks: [], houses: [], plants: [], overcast: 0, interactables: [], updaters: [], lanterns: [], shrineMeshes: {}, towerMeshes: {}, leafyMeshes: {},
    time: .36
  };
  // (TypeScript, r86) what the valley's object gets after it is made: here, and by js/solids.js, js/roads.js, js/main.ts…
  type SvWorldMore = { underpassSolid?: Uint8Array, terrain?: THREE.Mesh, groundCover?: THREE.InstancedMesh[], critters?: unknown, fireflies?: unknown, buffalo?: { id: string, mesh: THREE.Mesh, shadow: THREE.Object3D, firstPersonHide?: THREE.Object3D[], home: number[], tx: number, tz: number, rider: unknown, yaw: number, back?: boolean }[],
    pots?: { x: number, z: number, [k: string]: unknown }[], statue?: { x: number, z: number, [k: string]: unknown },
    groundAt?: (x: number, z: number, y?: number) => number, platformAt?: (x: number, z: number, y?: number) => unknown, collide?: (pos: { x: number, y?: number, z: number }, r?: number) => unknown,
    update?: (dt: number, t: number) => void, updateSky?: (dt: number, camPos: THREE.Vector3, focus?: THREE.Vector3) => void, isNight?: () => boolean,
    waterMap?: (cv: HTMLCanvasElement) => void, setShrineDone?: (id: string, done: boolean) => void, setTowerDone?: (id: string, done: boolean) => void, hideLeafy?: (id: string) => void,
    solid?: Uint8Array, solidAt?: (x: number, z: number, y?: number) => boolean, solidGround?: (x: number, z: number) => number, solidStats?: import('./solids.js').SolidStats, busStops?: unknown[],
    familyBuilt?: unknown, familyEdits?: unknown, gates?: unknown[], heroesNear?: (x: number, z: number, r: number) => boolean, levelled?: unknown,
    priceTags?: unknown[], roadLines?: { kind: string, pts: number[][], [k: string]: unknown }[], roadTop?: Map<number, number> | null, roadside?: unknown, waterSites?: { id: string, x: number, z: number, r: number }[] };
  const W: typeof wParts & SvWorldMore = wParts;
  const rnd = seeded(20250921);

  // ---------- sky ----------
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position.z=gl_Position.w; }',
    fragmentShader: 'uniform vec3 top,hor,bot,sunDir,sunCol; varying vec3 vP; void main(){ float y=vP.y; vec3 c=y>0.?mix(hor,top,pow(clamp(y,0.,1.),.6)):mix(hor,bot,clamp(-y*4.,0.,1.)); float s=max(dot(vP,normalize(sunDir)),0.); c+=sunCol*(pow(s,600.)*1.6+pow(s,12.)*.25); gl_FragColor=vec4(c,1.); }'
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), skyMat); sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky);
  const starGeo = new THREE.BufferGeometry(); const sp = [];
  for (let i = 0; i < 700; i++) { const a = rnd() * Math.PI * 2, y = rnd() * .9 + .08, r = Math.sqrt(1 - y * y); sp.push(Math.cos(a) * r * 800, y * 800, Math.sin(a) * r * 800); }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const stars = new THREE.Points(starGeo, starMat); stars.frustumCulled = false; scene.add(stars);
  const moon = sprite('🌕', 40); scene.add(moon);

  scene.fog = new THREE.Fog(0xcfe8ff, 120, 420);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd9c79a, .8); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1); scene.add(sun); scene.add(sun.target);
  if (quality !== 'low') {
    sun.castShadow = true; const S = sun.shadow; S.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024);
    S.camera.left = S.camera.bottom = -28; S.camera.right = S.camera.top = 28; S.camera.near = 1; S.camera.far = 260; S.bias = -.0006; S.normalBias = .04;
  }
  scene.environmentIntensity = .35;

  const PAL: [number, THREE.Color, THREE.Color, THREE.Color, THREE.Color, number, number][] = [
    // t, top, horizon, bottom, sun colour, sun intensity, hemi intensity
    [0, '#0b1433', '#1d2b5a', '#10183a', '#7fa0ff', .15, .32],
    [.22, '#24306a', '#e78f6a', '#3a3f6a', '#ffb07a', .35, .45],
    [.3, '#3f8fd8', '#ffe2bc', '#a9d0ee', '#fff0d6', .9, .75],
    [.5, '#2d84d4', '#a8d4f0', '#a8d4f2', '#fff6e6', 1.05, .85],
    [.7, '#3a86d2', '#ffd9a8', '#a0c0e0', '#ffe6c0', .95, .78],
    [.78, '#3a3a7a', '#f08a5a', '#4a3f6a', '#ff9a6a', .4, .5],
    [.86, '#0b1433', '#1d2b5a', '#10183a', '#7fa0ff', .15, .32],
    [1, '#0b1433', '#1d2b5a', '#10183a', '#7fa0ff', .15, .32]
  ].map((r): [number, THREE.Color, THREE.Color, THREE.Color, THREE.Color, number, number] => [+r[0], new THREE.Color(r[1]), new THREE.Color(r[2]), new THREE.Color(r[3]), new THREE.Color(r[4]), +r[5], +r[6]]);
  const tmpA = new THREE.Color(), tmpB = new THREE.Color();
  W.isNight = () => W.time < .24 || W.time > .8;
  W.updateSky = (dt, camPos, focus = camPos) => {
    if (settings.alwaysDay) W.time = lerp(W.time, .42, Math.min(1, dt));
    else W.time = (W.time + dt / 600) % 1; // a full day lasts ten minutes
    const t = W.time; let i = 0; while (i < PAL.length - 2 && PAL[i + 1][0] <= t) i++;
    const a = PAL[i], b = PAL[i + 1], k = smooth(a[0], b[0], t);
    skyMat.uniforms.top.value.copy(a[1]).lerp(b[1], k);
    skyMat.uniforms.hor.value.copy(a[2]).lerp(b[2], k);
    skyMat.uniforms.bot.value.copy(a[3]).lerp(b[3], k);
    skyMat.uniforms.sunCol.value.copy(a[4]).lerp(b[4], k);
    scene.fog.color.copy(skyMat.uniforms.hor.value);
    const ang = (t - .25) * Math.PI * 2, sd = new THREE.Vector3(Math.cos(ang) * .8, Math.sin(ang), .35).normalize();
    skyMat.uniforms.sunDir.value.copy(sd);
    const day = sd.y > -.05;
    // the shadow box follows the player so nearby shadows stay crisp
    sun.position.copy(focus).addScaledVector(day ? sd : sd.clone().negate(), 120); sun.target.position.copy(focus);
    sun.color.copy(tmpA.copy(a[4]).lerp(b[4], k)); sun.intensity = lerp(a[5], b[5], k) * 1.55;
    hemi.intensity = lerp(a[6], b[6], k) * 1.25; scene.environmentIntensity = lerp(a[6], b[6], k) * .28;
    hemi.color.copy(tmpB.set('#ffffff').lerp(skyMat.uniforms.top.value, .18));
    // rainy weather (js/weather.js) greys the sky and softens the sun
    if (W.overcast > 0) {
      const o = W.overcast; skyMat.uniforms.top.value.lerp(tmpA.set('#8e9aa8'), o * .65); skyMat.uniforms.hor.value.lerp(tmpA.set('#b8c2cc'), o * .6);
      scene.fog.color.copy(skyMat.uniforms.hor.value); sun.intensity *= 1 - o * .55; hemi.intensity *= 1 - o * .2;
    }
    sky.position.copy(camPos); stars.position.copy(camPos);
    starMat.opacity = clamp(-sd.y * 4, 0, 1);
    moon.position.copy(camPos).addScaledVector(sd.clone().negate(), 700); moon.material.opacity = starMat.opacity;
    const night = clamp(-sd.y * 3 + .2, 0, 1);
    W.lanterns.forEach(m => { m.material.emissiveIntensity = .2 + night * 1.6; });
  };

  // ---------- terrain ----------
  const seg = Math.round(SIZE / (quality === 'low' ? 2.67 : 2)); // (about one point every 2 m, 2.7 m on low)
  const tg = new THREE.PlaneGeometry(SIZE, SIZE, seg, seg); tg.rotateX(-Math.PI / 2);
  const pa = tg.attributes.position, cols = new Float32Array(pa.count * 3), c = new THREE.Color();
  const C = { sand: new THREE.Color('#ecd6a4'), grassA: new THREE.Color('#7fbf8c'), grassB: new THREE.Color('#62a878'), dry: new THREE.Color('#e3cf9c'),
    rock: new THREE.Color('#d9cfba'), snow: new THREE.Color('#f6f8fb'), dirt: new THREE.Color('#e6d2a2'), paddy: new THREE.Color('#a7d67c'), bamboo: new THREE.Color('#6eae78'), deep: new THREE.Color('#cdb88e'), outback: new THREE.Color('#d98f58') };
  // (round T2) the slope from the next grid points east and south (already worked out), scaled to 1.5 m as before:
  // two more heightAt calls per point made the valley a quarter of a second slower to build
  const row = seg + 1, step = SIZE / seg, HS = new Float32Array(pa.count);
  // (owner, 30 Oct 2026 AEDT: "it loads too long") the ground's heights are kept on the device after the first start of
  // a build (js/worldmemo.ts) and read back: the same numbers, without working out every point again
  const keptHS = keptFloats('ground-start', pa.count);
  if (keptHS) HS.set(keptHS); else { for (let i = 0; i < pa.count; i++) HS[i] = heightAt(pa.getX(i), pa.getZ(i)); rememberFloats('ground-start', HS); }
  for (let i = 0; i < pa.count; i++) pa.setY(i, HS[i]);
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i), z = pa.getZ(i), h = HS[i];
    const ex = i % row < seg ? HS[i + 1] : HS[i - 1], sz = i < pa.count - row ? HS[i + row] : HS[i - row];
    const sl = (Math.abs(ex - h) + Math.abs(sz - h)) * 1.5 / step;
    const n = fbm(x * .03, z * .03, 2);
    c.copy(C.grassA).lerp(C.grassB, clamp(n + .5, 0, 1));
    if (n > .4) c.lerp(C.dry, clamp((n - .4) * 6, 0, 1)); // sandy patches between the grass, like a dry summer
    if (dist2(x, z, PADDIES.x, PADDIES.z) < PADDIES.r + 4) c.copy(C.paddy).lerp(C.grassB, ((Math.floor(x / 5) + Math.floor(z / 9)) & 1) * .25);
    if (dist2(x, z, BAMBOO.x, BAMBOO.z) < BAMBOO.r) c.lerp(C.bamboo, .5);
    const dv = dist2(x, z, VILLAGE.x, VILLAGE.z);
    if (dv < VILLAGE.r - 4 && (Math.abs(x - VILLAGE.x) < 3 || Math.abs(z - VILLAGE.z) < 3 || Math.abs(dv - 14) < 2.2)) c.copy(C.dirt);
    const dh = dist2(x, z, HOME.x, HOME.z);
    if (dh < HOME.r - 4 && (Math.abs(x - HOME.x) < 2 || Math.abs(z - HOME.z) < 2)) c.copy(C.dirt);
    // (round T3, Concept D) beyond the Great Dividing Range, round Uluru, the ground turns the orange-red of the outback
    { const ob = smooth(-174, -192, x) * smooth(-90, -60, z); if (ob > 0) c.lerp(C.outback, ob * .8); }   // (not under the bamboo forest or the snowy north)
    if (sl > 2.2) c.lerp(C.rock, clamp((sl - 2.2) / 1.5, 0, 1));
    if (h > 34) c.lerp(C.snow, clamp((h - 34) / 6, 0, 1));
    if (h < 1.6) c.copy(C.sand);
    if (h < -1.5) c.copy(C.deep);
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  tg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); tg.computeVertexNormals();
  // fine detail (grass blades, pebbles, soil) painted into a tiling texture and blended over the ground colours
  const dc = document.createElement('canvas'); dc.width = dc.height = 256; const dx = dc.getContext('2d');
  dx.fillStyle = '#f4f4f4'; dx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) { const v = 215 + Math.floor(Math.random() * 40); dx.fillStyle = `rgb(${v},${v},${v})`; const x = Math.random() * 256, y = Math.random() * 256; dx.fillRect(x, y, 1 + Math.random() * 2, 2 + Math.random() * 5); }
  for (let i = 0; i < 140; i++) { const v = 150 + Math.floor(Math.random() * 60); dx.fillStyle = `rgba(${v},${v},${v},.6)`; dx.beginPath(); dx.arc(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 0, Math.PI * 2); dx.fill(); }
  const dtex = new THREE.CanvasTexture(dc); dtex.wrapS = dtex.wrapT = THREE.RepeatWrapping; dtex.repeat.set(140, 140); dtex.anisotropy = 4;
  const terrain = new THREE.Mesh(tg, toonSmooth({ map: dtex })); terrain.receiveShadow = true; scene.add(terrain); W.terrain = terrain;

  // water with a soft moving shimmer
  const wc = document.createElement('canvas'); wc.width = wc.height = 128; const wx = wc.getContext('2d');
  wx.fillStyle = '#ffffff'; wx.fillRect(0, 0, 128, 128); wx.strokeStyle = 'rgba(160,220,255,.9)'; wx.lineWidth = 3;
  for (let i = 0; i < 14; i++) { const x0 = Math.random() * 128, y0 = Math.random() * 128; wx.beginPath(); wx.arc(x0, y0, 6 + Math.random() * 10, .2, 1.4); wx.stroke(); }
  const wtex = new THREE.CanvasTexture(wc); wtex.wrapS = wtex.wrapT = THREE.RepeatWrapping; wtex.repeat.set(60, 60); wtex.colorSpace = THREE.SRGBColorSpace;
  // (round T4a) the water map (paintWater, kept on the device like the map picture): each river, lake and the sea its own
  // colour, deeper water darker, and a white foam line that moves along every shore; until it is ready (the first start
  // paints it after the valley is built) the water is the plain blue of before. Still one plane, one draw.
  const WU = { uWaterMap: { value: new THREE.Texture() }, uReady: { value: 0 }, uTime: { value: 0 }, uSize: { value: SIZE } };
  const waterMat = new THREE.MeshStandardMaterial({ color: '#2f8fc8', map: wtex, transparent: true, opacity: .8, roughness: .08, metalness: .25 });
  waterMat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, WU);
    sh.vertexShader = 'varying vec2 vWXZ;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vWXZ = position.xz;');
    sh.fragmentShader = 'uniform sampler2D uWaterMap; uniform float uReady, uTime, uSize; varying vec2 vWXZ;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
  if (uReady > .5) {
    vec4 wm = texture2D(uWaterMap, clamp(vWXZ / uSize + .5, 0., 1.));
    diffuseColor.rgb *= pow(wm.rgb, vec3(2.2)) / pow(vec3(.184, .561, .784), vec3(2.2));
    float shore = clamp((wm.a - .2) / .8, 0., 1.), foam = smoothstep(.5, .95, shore) * (.55 + .45 * sin(uTime * 1.6 + shore * 14.));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.), foam * .7);
  }`);
  };
  waterMat.customProgramCacheKey = () => 'svwater';
  const water = new THREE.Mesh(new THREE.PlaneGeometry(SIZE + 400, SIZE + 400).rotateX(-Math.PI / 2), waterMat); water.position.y = WATER; scene.add(water);
  W.updaters.push((dt, t) => { wtex.offset.set(t * .01, t * .006); WU.uTime.value = t; });
  // (row 0 of the water picture is the north edge, as vWXZ reads it, so it is not flipped)
  W.waterMap = cv => { const tx = new THREE.CanvasTexture(cv); tx.minFilter = tx.magFilter = THREE.LinearFilter; tx.generateMipmaps = false; tx.flipY = false; WU.uWaterMap.value = tx; WU.uReady.value = 1; };

  // ---------- trees & plants (instanced) ----------
  const geos = {
    round: merge([P(new THREE.CylinderGeometry(.24, .38, 3.2, 6), '#7a5a3e', [0, 1.6, 0]), P(new THREE.CylinderGeometry(.1, .16, 1.8, 5), '#7a5a3e', [.6, 3, 0], [0, 0, -.6]), P(new THREE.CylinderGeometry(.1, .16, 1.6, 5), '#7a5a3e', [-.5, 2.9, .2], [.2, 0, .6]),
      P(new THREE.IcosahedronGeometry(2.2, 1), '#2f7f5f', [0, 4.5, 0]), P(new THREE.IcosahedronGeometry(1.7, 1), '#3a8d68', [1.5, 4.1, .6]), P(new THREE.IcosahedronGeometry(1.6, 1), '#276f55', [-1.4, 4.2, -.4]), P(new THREE.IcosahedronGeometry(1.4, 1), '#46a077', [.3, 5.9, .3])]),
    apple: merge([P(new THREE.CylinderGeometry(.3, .42, 2.6, 7), '#8a5a3b', [0, 1.3, 0]), P(new THREE.IcosahedronGeometry(2.2, 1), '#348a63', [0, 3.9, 0]),
      ...[[1.6, 4, .8], [-1.4, 3.6, 1], [.4, 4.4, -1.8], [-.6, 5.4, .9], [1.1, 3.1, -1.3]].map(p => P(new THREE.SphereGeometry(.32, 8, 6), '#e8433a', p))]),
    pine: merge([P(new THREE.CylinderGeometry(.25, .35, 2, 6), '#6e4a32', [0, 1, 0]), P(new THREE.ConeGeometry(2, 3.2, 8), '#25664f', [0, 3.2, 0]), P(new THREE.ConeGeometry(1.5, 2.6, 8), '#2c7558', [0, 4.8, 0]), P(new THREE.ConeGeometry(.9, 2, 8), '#348462', [0, 6.2, 0])]),
    snowpine: merge([P(new THREE.CylinderGeometry(.25, .35, 2, 6), '#6e4a32', [0, 1, 0]), P(new THREE.ConeGeometry(2, 3.2, 8), '#2f6a4f', [0, 3.2, 0]), P(new THREE.ConeGeometry(1.5, 2.6, 8), '#e9f2ff', [0, 4.8, 0]), P(new THREE.ConeGeometry(.9, 2, 8), '#ffffff', [0, 6.2, 0])]),
    bamboo: merge([[0, 0], [.7, .3], [-.5, .6], [.2, -.7], [-.7, -.3]].flatMap(([x, z], i) => {
      const hgt = 7 + (i % 3) * 1.6;
      return [P(new THREE.CylinderGeometry(.13, .15, hgt, 6), '#8cc65a', [x, hgt / 2, z]), P(new THREE.ConeGeometry(.9, 2.2, 6), '#5fae4a', [x, hgt + .4, z]),
        P(new THREE.TorusGeometry(.15, .04, 4, 8), '#6a9a3a', [x, hgt * .3, z], [Math.PI / 2, 0, 0]), P(new THREE.TorusGeometry(.15, .04, 4, 8), '#6a9a3a', [x, hgt * .6, z], [Math.PI / 2, 0, 0])];
    })),
    palm: merge([P(new THREE.CylinderGeometry(.2, .32, 5.5, 6), '#a07848', [.3, 2.7, 0], [0, 0, -.12]),
      ...[0, 1, 2, 3, 4, 5].map(i => P(new THREE.ConeGeometry(.5, 3.2, 4), i % 2 ? '#4fae4a' : '#3d9a42', [.6 + Math.cos(i) * 1.3, 5.3, Math.sin(i) * 1.3], [Math.PI / 2 - .5, i * 1.05, 0], [1, 1, .25])),
      P(new THREE.SphereGeometry(.25, 6, 5), '#7a5a2a', [.6, 5.2, .3]), P(new THREE.SphereGeometry(.25, 6, 5), '#7a5a2a', [.4, 5.1, -.3])]),
    bush: merge([P(new THREE.IcosahedronGeometry(1.1, 1), '#24654f', [0, .7, 0], [0, 0, 0], [1.2, .85, 1]), P(new THREE.IcosahedronGeometry(.8, 1), '#30785c', [.9, .55, .3])]),
    rock: merge([P(new THREE.DodecahedronGeometry(1, 0), '#e6dcc6', [0, .45, 0], [0, .5, 0], [1.5, .85, 1.15])])
  };
  const spots = { round: [], apple: [], pine: [], snowpine: [], bamboo: [], palm: [], bush: [], rock: [] };
  const appleTrees = [];
  const CLEAR = MAP.CLEARINGS.map(c => { const [ax, az] = c.at || MAP.anchorOf(c.place), [dx, dz] = c.off || [0, 0]; return { x: ax + dx, z: az + dz, r: c.r }; });
  const nearPOI = (x, z) => FLATS.some(F => x > F.x0 - 4 && x < F.x1 + 4 && z > F.z0 - 4 && z < F.z1 + 4) || LOTS.some(L => dist2(x, z, L.x, L.z) < 11) || CLEAR.some(c => dist2(x, z, c.x, c.z) < c.r) || dist2(x, z, APOSTLES.x, APOSTLES.z) < 15 || Object.values(FESTGROUNDS).some(f => dist2(x, z, f.x, f.z) < 17) || SHRINES.some(s => dist2(x, z, s.x, s.z) < 9) || TOWERS.some(s => dist2(x, z, s.x, s.z) < 10) || LEAFIES.some(s => dist2(x, z, s.x, s.z) < 5); // (5 m: a tree's trunk and leaves never stand over a Leafy's spot)
  for (let i = 0; i < 9000; i++) {
    const x = (rnd() - .5) * (SIZE - 30), z = (rnd() - .5) * (SIZE - 30), h = heightAt(x, z);
    if (h < 1.5 || nearPOI(x, z)) continue;
    const sl = Math.abs(heightAt(x + 2, z) - h) + Math.abs(heightAt(x, z + 2) - h);
    if (dist2(x, z, VILLAGE.x, VILLAGE.z) < VILLAGE.r + 4 || dist2(x, z, PADDIES.x, PADDIES.z) < PADDIES.r + 3 || dist2(x, z, HOME.x, HOME.z) < HOME.r + 4) continue;
    if (dist2(x, z, CHINA.x, CHINA.z) < CHINA.r + 6 || dist2(x, z, INDIA.x, INDIA.z) < INDIA.r + 6) continue;
    if (bridgeAt(x, z, 8, 14, 10) || roadDist(x, z).d < 4.5 || riverDist(x, z) < 10) continue; // keep roads and riverbanks clear
    const inPlat = dist2(x, z, PLATEAU.x, PLATEAU.z) < PLATEAU.r;
    if (inPlat && dist2(x, z, PLATEAU.x, PLATEAU.z) < 12) continue;
    const r = rnd();
    let type = null;
    if (dist2(x, z, BAMBOO.x, BAMBOO.z) < BAMBOO.r) type = r < .75 ? 'bamboo' : r < .85 ? 'bush' : null;
    else if (h > 30) type = sl < 4 && r < .35 ? 'snowpine' : r < .45 ? 'rock' : null;
    else if (z < MTN.pines) type = sl < 3 && r < .4 ? 'pine' : r < .5 ? 'rock' : null;
    else if (dist2(x, z, LAKE.x, LAKE.z) < LAKE.r + 22 && h < 5) type = r < .3 ? 'palm' : r < .38 ? 'bush' : null;
    else if (sl < 2.5) type = r < (inPlat ? .1 : .14) ? 'round' : r < .2 ? 'bush' : r < .225 ? 'rock' : r < .235 ? 'apple' : null;
    if (!type) continue;
    const lim = { round: 380, apple: 26, pine: 260, snowpine: 120, bamboo: 230, palm: 60, bush: 260, rock: 200 };
    if (spots[type].length >= (quality === 'low' ? lim[type] * .6 : lim[type])) continue;
    const s = type === 'rock' ? .5 + rnd() * 1.4 : .8 + rnd() * .5;
    spots[type].push([x, h - .1, z, rnd() * 6.28, s]);
    if (type === 'apple') appleTrees.push({ x, z });
    if (type !== 'bush') W.colliders.push({ x, z, r: type === 'rock' ? 1.1 * s : type === 'bamboo' ? 1 : .6 });
  }
  // A few apple trees right on the plateau so the cooking quest is easy to start.
  [[-.62, .12], [.69, .19], [-.25, -.69]].map(([dx, dz]) => [PLATEAU.x + dx * PLATEAU.r, PLATEAU.z + dz * PLATEAU.r]) // (round T: spread by the plateau's own size).forEach(([x, z]) => { spots.apple.push([x, heightAt(x, z) - .1, z, 0, 1]); appleTrees.push({ x, z }); W.colliders.push({ x, z, r: .6 }); });
  const o3 = new THREE.Object3D(), tint = new THREE.Color();
  // Each kind of tree is split into 100 m tiles of the map, so the tiles behind the camera (and outside the
  // sun's shadow area) are skipped instead of drawing every tree in the valley every frame (phones).
  const TILE = 100;
  for (const k in spots) {
    const tiles = new Map(), mat = toonVC();
    for (const s of spots[k]) { const key = Math.floor((s[0] + HALF) / TILE) + ',' + Math.floor((s[2] + HALF) / TILE); if (!tiles.has(key)) tiles.set(key, []); tiles.get(key).push(s); }
    for (const list of tiles.values()) {
      const im = new THREE.InstancedMesh(geos[k], mat, list.length); im.castShadow = k !== 'rock'; im.receiveShadow = true;
      list.forEach((s, i) => { o3.position.set(s[0], s[1], s[2]); o3.rotation.set(0, s[3], 0); o3.scale.setScalar(s[4]); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix); tint.setHSL(0, 0, .88 + rnd() * .12); im.setColorAt(i, tint); });
      im.computeBoundingSphere(); // so the camera can tell when a whole tile is out of view
      scene.add(im); im.userData.kind = k; im.userData.list = list; W.plants.push(im); // tappable (js/fun.js)
    }
  }
  appleTrees.forEach((t, i) => {
    let ready = 0;
    W.interactables.push({ id: 'apple' + i, x: t.x, z: t.z, r: 3.2, icon: '🍎', label: () => T('Shake tree', 'Rung cây'),
      act: (pl, game) => { const now = performance.now(); if (now < ready) { game.toast(pl, T('No apples yet. Come back later!', 'Chưa có táo. Lát nữa quay lại nhé!')); return; }
        ready = now + 90000; if (game.shakeTree) game.shakeTree(pl, t); else { game.give(pl, 'apple', 2); game.fx(t.x, heightAt(t.x, t.z) + 4, t.z, '🍎'); } } });
  });

  // grass tufts and flowers
  const nGrass = quality === 'low' ? 2500 : quality === 'high' ? 9000 : 6000;
  const blade = merge([0, 1, 2].map(i => P(new THREE.ConeGeometry(.12, .9, 3), '#ffffff', [Math.cos(i * 2.1) * .18, .4, Math.sin(i * 2.1) * .18], [Math.cos(i * 2.1) * .25, 0, Math.sin(i * 2.1) * .25])));
  const flower = merge([P(new THREE.CylinderGeometry(.03, .03, .6, 4), '#4f9e45', [0, .3, 0]), ...[0, 1, 2, 3, 4].map(i => P(new THREE.SphereGeometry(.13, 6, 4), '#ffffff', [Math.cos(i * 1.256) * .16, .62, Math.sin(i * 1.256) * .16])), P(new THREE.SphereGeometry(.09, 6, 4), '#ffd23f', [0, .66, 0])]);
  const gIm = new THREE.InstancedMesh(blade, toonVC(), nGrass), fIm = new THREE.InstancedMesh(flower, toonVC(), Math.floor(nGrass / 6));
  let gi = 0, fi = 0; const FC = ['#ff7eb8', '#ffffff', '#ffd23f', '#9a6bff', '#ff8a5a', '#7fd8ff'];
  for (let tries = 0; tries < nGrass * 6 && (gi < nGrass || fi < fIm.count); tries++) {
    const near = rnd() < .5; const x = near ? PLATEAU.x + (rnd() - .5) * 180 : (rnd() - .5) * (SIZE - 40), z = near ? PLATEAU.z + (rnd() - .5) * 180 : (rnd() - .5) * (SIZE - 40), h = heightAt(x, z);
    if (h < 1.8 || h > 30) continue;
    if (dist2(x, z, VILLAGE.x, VILLAGE.z) < VILLAGE.r - 6 || dist2(x, z, HOME.x, HOME.z) < HOME.r - 8 || dist2(x, z, CHINA.x, CHINA.z) < CHINA.r - 2 || dist2(x, z, INDIA.x, INDIA.z) < INDIA.r - 2) continue;
    if (edgeDist(x, z) < 1.5) continue; // nothing grows on a road, a place's street or their verge (G5/R4; Round U)
    o3.position.set(x, h - .05, z); o3.rotation.set(0, rnd() * 6, 0); o3.scale.setScalar(.45 + rnd() * .45); o3.updateMatrix();
    if (rnd() < .16 && fi < fIm.count) { fIm.setMatrixAt(fi, o3.matrix); fIm.setColorAt(fi++, tint.set(FC[Math.floor(rnd() * FC.length)])); }
    else if (gi < nGrass) { gIm.setMatrixAt(gi, o3.matrix); gIm.setColorAt(gi++, tint.setHSL(.26 + rnd() * .06, .55, .3 + rnd() * .1)); }
  }
  gIm.count = gi; fIm.count = fi; scene.add(gIm, fIm); W.groundCover = [gIm, fIm]; // (the roads check looks at them)

  // clouds: big soft painted cumulus with warm afternoon light on their edges
  const cloudTex = k => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'), r = seeded(77 + k);
    const blobs = Array.from({ length: 9 }, (_, i) => ({ x: 90 + i * 40 + r() * 30, y: 170 - Math.sin(i / 8 * Math.PI) * (60 + r() * 50), rad: 40 + r() * 45 }));
    const pass = (col, dy, grow) => { g.fillStyle = col; blobs.forEach(b => { g.beginPath(); g.arc(b.x, b.y + dy, b.rad * grow, 0, Math.PI * 2); g.fill(); }); g.fillRect(70, 170 + dy, 380, 40); };
    pass('#f0cfa0', 8, 1); pass('#fbe6c4', 0, .95); pass('#fff6e6', -10, .78);
    g.globalCompositeOperation = 'destination-out'; g.fillRect(0, 205, 512, 60);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const cloudTexs = [0, 1, 2].map(cloudTex);
  const clouds = [];
  for (let i = 0; i < 22; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexs[i % 3], transparent: true, depthWrite: false, fog: false }));
    const a = rnd() * Math.PI * 2, d = 330 + rnd() * 200, sc = 110 + rnd() * 90;
    m.position.set(Math.cos(a) * d, 45 + rnd() * 55, Math.sin(a) * d); m.scale.set(sc, sc / 2, 1); m.renderOrder = -1; scene.add(m); clouds.push(m);
  }
  W.updaters.push(dt => clouds.forEach(m => { m.position.x += dt * 1.2; if (m.position.x > 560) m.position.x = -560; }));

  // ---------- village ----------
  const V = VILLAGE;
  // village houses (nhà ba gian): wooden columns, tiled roofs with upturned corners, brick yards
  function house(x, z, rot, w = 7, d = 6, wall = '#efe0bf', roof = '#b9533c', palms = false) {
    const g = houseVillage({ w, d: d * .9, wall, tile: roof, palms }).obj;
    g.position.set(x, heightAt(x, z) - .05, z); g.rotation.y = rot; scene.add(g);
    W.colliders.push({ x, z, r: Math.max(w, d) * .62 });
    W.houses.push({ x, z, rot, d: Math.max(w, d) * 1.24, kind: 'village' });
    return g;
  }
  [[-18, -14, .5], [-4, -22, 0], [14, -20, -.3], [22, -4, -1.3], [20, 14, -2.2], [-20, 10, 1.6], [-14, 22, 2.4], [6, 24, 3.1]]
    .forEach(([dx, dz, r], i) => house(V.x + dx, V.z + dz, r + Math.PI, 6 + (i % 3), 5 + (i % 2), i % 3 === 1 ? '#f6dca0' : '#efe0bf', i % 2 ? '#b9533c' : '#a0442f', i % 3 === 0));
  // village gate (cổng làng) on the west side, facing the bridge
  {
    const gx = V.x - V.r + 2, gz = V.z, y = heightAt(gx, gz);
    const gate = new THREE.Mesh(merge([
      P(new THREE.BoxGeometry(1.2, 6, 1.2), '#e8dcc0', [0, 3, -4]), P(new THREE.BoxGeometry(1.2, 6, 1.2), '#e8dcc0', [0, 3, 4]),
      P(new THREE.BoxGeometry(1.8, .7, 10.5), '#b9533c', [0, 6.4, 0]), P(new THREE.BoxGeometry(2.4, .3, 11.5), '#8e3a2a', [0, 6.9, 0]),
      P(new THREE.BoxGeometry(.3, 1.2, 4), '#c9302c', [.75, 5.3, 0]), P(new THREE.BoxGeometry(.32, .9, 3.4), '#ffd23f', [.8, 5.3, 0])
    ]), toonVC()); gate.position.set(gx, y, gz); gate.userData.noCam = true; scene.add(gate);
    W.colliders.push({ x: gx, z: gz - 4, r: .9 }, { x: gx, z: gz + 4, r: .9 });
  }
  // the big banyan tree (cây đa) in the middle of the village
  {
    const y = heightAt(V.x, V.z);
    const banyan = new THREE.Mesh(merge([
      P(new THREE.CylinderGeometry(1.1, 1.8, 6, 9), '#7a5236', [0, 3, 0]),
      ...[[0, 8, 0, 4.5], [3.5, 7, 1.5, 3.2], [-3.5, 7.2, -1, 3.4], [1, 7.5, -3.5, 3], [-1.5, 7, 3.4, 3]].map(([x, yy, z, r]) => P(new THREE.IcosahedronGeometry(r, 1), '#3f8f3f', [x, yy, z])),
      ...[0, 1, 2, 3, 4, 5].map(i => P(new THREE.CylinderGeometry(.08, .08, 4, 4), '#8a6a4a', [Math.cos(i) * 3, 3.5, Math.sin(i) * 3]))
    ]), toonVC()); banyan.position.set(V.x + 6, y, V.z + 6); scene.add(banyan);
    W.colliders.push({ x: V.x + 6, z: V.z + 6, r: 2 });
  }
  // lotus pond
  {
    const px = V.x - 10, pz = V.z + 4, y = heightAt(px, pz) + .08;
    const pond = new THREE.Mesh(new THREE.CircleGeometry(5.2, 28).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: '#3aa0c8', shininess: 80 }));
    pond.position.set(px, y, pz); scene.add(pond);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(5.3, .35, 6, 28).rotateX(Math.PI / 2), toon('#b7ad98')); rim.position.set(px, y + .05, pz); scene.add(rim);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, r = 1 + (i % 4) * 1.1;
      const pad = new THREE.Mesh(new THREE.CircleGeometry(.7, 12, .3, 5.8).rotateX(-Math.PI / 2), toon('#3f9a45')); pad.position.set(px + Math.cos(a) * r, y + .05, pz + Math.sin(a) * r); scene.add(pad);
      if (i % 2 === 0) { const fl = new THREE.Mesh(merge([0, 1, 2, 3, 4, 5].map(k => P(new THREE.ConeGeometry(.18, .6, 4), k % 2 ? '#ffc0d8' : '#ff8ab8', [Math.cos(k) * .14, .25, Math.sin(k) * .14], [Math.cos(k) * .45, 0, Math.sin(k) * .45]))), toonVC()); fl.position.copy(pad.position); scene.add(fl); }
    }
    W.colliders.push({ x: px, z: pz, r: 5.4 });
  }
  // market stalls (chợ) with striped umbrellas
  const stall = (x, z, rot, col) => {
    const y = heightAt(x, z);
    const m = new THREE.Mesh(merge([
      P(new THREE.BoxGeometry(3.4, 1, 1.6), '#a9764a', [0, .5, 0]),
      ...[-1.5, 1.5].flatMap(px => [P(new THREE.CylinderGeometry(.08, .08, 3, 5), '#7a5236', [px, 1.5, -.7])]),
      P(new THREE.ConeGeometry(2.6, 1.1, 8), col, [0, 3.2, 0]),
      ...([[-1, '#e8433a'], [-.4, '#ffd23f'], [.3, '#ff9a2e'], [.9, '#4cbf5c']] satisfies [number, string][]).map(([px, cc]) => P(new THREE.SphereGeometry(.24, 8, 6), cc, [px, 1.15, .1]))
    ]), toonVC()); m.position.set(x, y, z); m.rotation.y = rot; scene.add(m);
    W.colliders.push({ x, z, r: 1.9 });
  };
  stall(V.x + 2, V.z - 10, 0, '#e8434a'); stall(V.x - 4, V.z - 11, .2, '#3d7fd6'); stall(V.x + 8, V.z - 9, -.3, '#ffb52e');
  // strings of red lanterns (đèn lồng)
  const lanternGeo = new THREE.SphereGeometry(.35, 10, 8); lanternGeo.scale(1, 1.2, 1);
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2, x = V.x + Math.cos(a) * 14, z = V.z + Math.sin(a) * 14, y = heightAt(x, z);
    if (i % 2 === 0) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 3.6, 5), toon('#7a5236')); pole.position.set(x, y + 1.8, z); scene.add(pole); W.colliders.push({ x, z, r: .3 }); }
    const l = new THREE.Mesh(lanternGeo, new THREE.MeshStandardMaterial({ roughness: .5, color: i % 3 === 2 ? '#ffcf3a' : '#e8332a', emissive: i % 3 === 2 ? '#ffb000' : '#ff3a1a', emissiveIntensity: .3 }));
    l.position.set(x, y + 3.4, z); scene.add(l); W.lanterns.push(l);
  }
  // Ô ăn quan board drawn on the ground, hopscotch squares, tug-of-war rope
  {
    const bx = V.x + 16, bz = V.z + 22;
    const board = new THREE.Mesh(merge([
      ...[0, 1, 2, 3, 4].flatMap(i => [P(new THREE.BoxGeometry(1.1, .06, 1.1), '#e9d6a8', [-2.4 + i * 1.2, 0, -.6]), P(new THREE.BoxGeometry(1.1, .06, 1.1), '#e9d6a8', [-2.4 + i * 1.2, 0, .6])]),
      P(new THREE.CylinderGeometry(1.2, 1.2, .06, 16, 1, false, 0, Math.PI), '#e9d6a8', [-3.1, 0, 0], [0, Math.PI, 0]),
      P(new THREE.CylinderGeometry(1.2, 1.2, .06, 16, 1, false, 0, Math.PI), '#e9d6a8', [3.1, 0, 0])
    ]), toonVC()); board.position.set(bx, heightAt(bx, bz) + .04, bz); scene.add(board);
    const hx = V.x - 18, hz = V.z - 2;
    const hop = new THREE.Mesh(merge([[0, 0], [0, 1.3], [-.65, 2.6], [.65, 2.6], [0, 3.9], [-.65, 5.2], [.65, 5.2], [0, 6.5]].map(([x, z], i) => P(new THREE.BoxGeometry(1.2, .05, 1.2), i % 2 ? '#ffffff' : '#ffe08a', [x, 0, z]))), toonVC());
    hop.position.set(hx, heightAt(hx, hz) + .04, hz); hop.rotation.y = Math.PI / 2; scene.add(hop);
    const rx = V.x + 2, rz = V.z + 18;
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 9, 6).rotateZ(Math.PI / 2), toon('#d9b26a')); rope.position.set(rx, heightAt(rx, rz) + .9, rz); scene.add(rope);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(.1, .5, .3), toon('#e8332a')); flag.position.set(rx, heightAt(rx, rz) + .6, rz); scene.add(flag);
  }
  // cooking pots: one on the plateau, one in the village
  W.pots = [{ x: PLATEAU.x - 4, z: PLATEAU.z + 8 }, { x: V.x - 2, z: V.z + 12 }].map(p => {
    const y = heightAt(p.x, p.z);
    const pot = new THREE.Mesh(merge([
      P(new THREE.SphereGeometry(.9, 12, 8, 0, Math.PI * 2, Math.PI * .35, Math.PI * .65), '#3a3a42', [0, 1.1, 0]),
      ...[0, 1, 2].map(i => P(new THREE.CylinderGeometry(.07, .07, 1.6, 4), '#5a4030', [Math.cos(i * 2.1) * .8, .6, Math.sin(i * 2.1) * .8], [Math.sin(i * 2.1) * .3, 0, -Math.cos(i * 2.1) * .3])),
      ...[0, 1, 2, 3, 4, 5].map(i => P(new THREE.BoxGeometry(.9, .2, .2), '#7a5236', [Math.cos(i) * .4, .1, Math.sin(i) * .4], [0, i, 0]))
    ]), toonVC()); pot.position.set(p.x, y, p.z); scene.add(pot);
    const fire = sprite('🔥', 1.1); fire.position.set(p.x, y + .5, p.z); scene.add(fire);
    W.updaters.push((dt, t) => { fire.scale.setScalar(1 + Math.sin(t * 9) * .1); });
    W.colliders.push({ x: p.x, z: p.z, r: 1.1 });
    return p;
  });
  // the Lotus Statue (trades Sparkle Orbs for extra hearts or stamina)
  W.statue = { x: V.x + 18, z: V.z - 2 };
  {
    const s = W.statue, y = heightAt(s.x, s.z);
    const st = new THREE.Mesh(merge([
      P(new THREE.CylinderGeometry(2, 2.4, 1, 8), '#c9c2b2', [0, .5, 0]),
      P(new THREE.CylinderGeometry(.7, 1.1, 3, 10), '#e6e0d0', [0, 2.5, 0]), P(new THREE.SphereGeometry(.7, 12, 10), '#e6e0d0', [0, 4.5, 0]),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => P(new THREE.ConeGeometry(.5, 1.6, 4), '#ffb3cf', [Math.cos(i * .785) * 1.2, 1.4, Math.sin(i * .785) * 1.2], [Math.cos(i * .785) * .7, 0, -Math.sin(i * .785) * .7]))
    ]), toonVC()); st.position.set(s.x, y, s.z); st.rotation.y = -Math.PI / 2; scene.add(st);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(1, .08, 6, 24), glow('#ffe58a')); halo.position.set(s.x, y + 4.6, s.z); halo.rotation.y = Math.PI / 2; scene.add(halo);
    W.updaters.push((dt, t) => { halo.rotation.x = Math.sin(t) * .2; });
    W.colliders.push({ x: s.x, z: s.z, r: 2.2 });
  }

  // ---------- bridges (the Dragon Bridge is built with the roads: js/roads.js) ----------
  for (const B of BRIDGES) {
    if (B.style === 'dragon') continue;
    const len = B.a1 - B.a0, y = B.h, hw = B.w / 2, steel = '#8d979c';
    // (round T) a plain road bridge: a deck on two stone piers, with white railings
    const plain = () => [P(new THREE.BoxGeometry(len + 2, .5, B.w), '#8a8f94', [0, -.25, 0]), P(new THREE.BoxGeometry(len + 2, .06, B.w - 2.2), '#b4b9bc', [0, .03, 0]),
      P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, hw - .5]), P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, -hw + .5]),
      ...[-1, 1].flatMap(sz => [P(new THREE.BoxGeometry(len + 2, .12, .14), '#f6f1e4', [0, .95, sz * hw]), ...Array.from({ length: Math.round(len / 2.5) + 1 }, (_, i) => P(new THREE.BoxGeometry(.16, .9, .16), '#f6f1e4', [-len / 2 - 1 + i * (len + 2) / Math.round(len / 2.5), .45, sz * hw]))]),
      ...[-.25, .25].map(f => P(new THREE.BoxGeometry(1.6, 12, B.w - 1), '#a8a296', [f * len, -6, 0]))];
    // A small "Sydney Harbour Bridge": a grey steel arch, hangers, stone pylons at each end and a road deck.
    const parts = B.style !== 'harbour' ? plain() : [
      P(new THREE.BoxGeometry(len + 2, .5, B.w), '#7d858a', [0, -.25, 0]), P(new THREE.BoxGeometry(len + 2, .06, B.w - 2.2), '#b4b9bc', [0, .03, 0]),
      P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, hw - .5]), P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, -hw + .5]),
      ...Array.from({ length: 7 }, (_, i) => P(new THREE.BoxGeometry(1.6, .08, .14), '#f6f1e4', [-len / 2 + 3 + i * (len - 6) / 6, .09, 0])),
      P(new THREE.BoxGeometry(len + 2, .9, .12), steel, [0, .45, hw]), P(new THREE.BoxGeometry(len + 2, .9, .12), steel, [0, .45, -hw]),
      ...[-.32, .32].map(f => P(new THREE.CylinderGeometry(.5, .7, 12, 6), '#9a948a', [f * len, -6, 0]))
    ];
    for (const sz of [-1, 1]) {
      parts.push(P(new THREE.TorusGeometry(len / 2 - 1, .35, 5, 28, Math.PI), steel, [0, -1.2, sz * (hw - .2)], [0, 0, 0], [1, .62, 1]));
      parts.push(P(new THREE.TorusGeometry(len / 2 - 1, .22, 5, 28, Math.PI), steel, [0, -2.4, sz * (hw - .2)], [0, 0, 0], [1, .62, 1]));
      for (let i = 1; i < 12; i++) { const t = i / 12, x = -len / 2 + 1 + t * (len - 2), a = Math.acos(Math.max(-1, Math.min(1, x / (len / 2 - 1)))), top = Math.sin(a) * (len / 2 - 1) * .62 - 1.2; if (top > 1) parts.push(P(new THREE.BoxGeometry(.12, top, .12), steel, [x, top / 2, sz * (hw - .2)])); }
      for (const ex of [-1, 1]) parts.push(P(new THREE.BoxGeometry(2.2, 7, 2.2), '#d8cdb6', [ex * (len / 2 + .6), 2.2, sz * (hw + .6)]), P(new THREE.BoxGeometry(2.6, .5, 2.6), '#c8bca2', [ex * (len / 2 + .6), 5.9, sz * (hw + .6)]));
    }
    // (round T2) the bridge landmarks over their real rivers
    const deck = (col = '#8a8f94', top = '#b4b9bc') => [P(new THREE.BoxGeometry(len + 2, .5, B.w), col, [0, -.25, 0]), P(new THREE.BoxGeometry(len + 2, .06, B.w - 2.2), top, [0, .03, 0]),
      P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, hw - .5]), P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, -hw + .5])];
    const piers = (col, n = 2) => Array.from({ length: n }, (_, i) => P(new THREE.BoxGeometry(1.8, 12, B.w - .6), col, [(n === 1 ? 0 : -.3 + .6 * i / (n - 1)) * len, -6, 0]));
    const STYLES = {
      // Long Biên (Hà Nội): a long dark-red steel truss on stone piers, the frames criss-crossing over the road
      longbien: () => { const p = [...deck('#6d6a66'), ...piers('#9c9284', 3)], rust = '#7a4a3a', n = Math.round(len / 3);
        for (const sz of [-1, 1]) { const zz = sz * (hw - .15);
          p.push(P(new THREE.BoxGeometry(len + 2, .3, .3), rust, [0, 4.6, zz]), P(new THREE.BoxGeometry(len + 2, .3, .3), rust, [0, .45, zz]));
          for (let i = 0; i <= n; i++) { const x = -len / 2 - 1 + i * (len + 2) / n; p.push(P(new THREE.BoxGeometry(.24, 4.3, .24), rust, [x, 2.5, zz]));
            if (i < n) { const dx = (len + 2) / n, l = Math.hypot(dx, 4.2), a = Math.atan2(4.2, dx); p.push(P(new THREE.BoxGeometry(l, .16, .16), rust, [x + dx / 2, 2.5, zz], [0, 0, (i % 2 ? 1 : -1) * a])); } } }
        for (let i = 0; i <= n; i += 2) p.push(P(new THREE.BoxGeometry(.2, .2, B.w), rust, [-len / 2 - 1 + i * (len + 2) / n, 4.6, 0]));
        return p; },
      // the Story Bridge (Brisbane): grey-blue steel, tall over its two piers and dipping to the middle, as a cantilever does
      story: () => { const p = [...deck('#6f7880'), ...piers('#a8a296')], st = '#5a6a7a', n = 12;
        for (const sz of [-1, 1]) { const zz = sz * (hw - .15), top = x => 1.6 + 5.4 * Math.pow(Math.abs(x) / (len / 2), 1.6) * (1 - .3 * smooth(len * .42, len * .5 + 1, Math.abs(x)));
          for (let i = 0; i < n; i++) { const xa = -len / 2 - 1 + i * (len + 2) / n, xb = xa + (len + 2) / n, ya = top(xa), yb = top(xb), l = Math.hypot(xb - xa, yb - ya);
            p.push(P(new THREE.BoxGeometry(l, .32, .32), st, [(xa + xb) / 2, (ya + yb) / 2, zz], [0, 0, Math.atan2(yb - ya, xb - xa)]), P(new THREE.BoxGeometry(.22, ya, .22), st, [xa, ya / 2, zz]));
            const dl = Math.hypot(xb - xa, ya), da = Math.atan2(ya, xb - xa); p.push(P(new THREE.BoxGeometry(dl, .14, .14), st, [(xa + xb) / 2, ya / 2, zz], [0, 0, (i < n / 2 ? -1 : 1) * da])); } }
        for (const f of [-.3, .3]) p.push(P(new THREE.BoxGeometry(.4, .4, B.w), st, [f * len, 6, 0]));
        return p; },
      // Princes Bridge (Melbourne): sandstone on three arches, a stone balustrade and green lamp posts
      princes: () => { const p = [P(new THREE.BoxGeometry(len + 2, .9, B.w + .4), '#c9b28a', [0, -.45, 0]), P(new THREE.BoxGeometry(len + 2, .06, B.w - 2.2), '#b4b9bc', [0, .03, 0]),
          P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, hw - .5]), P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, -hw + .5])];
        for (const sz of [-1, 1]) { p.push(P(new THREE.BoxGeometry(len + 2, .85, .3), '#d8c49a', [0, .45, sz * (hw + .05)]));
          for (let i = 0; i < 3; i++) { const cx = (-1 + i) * len / 3; p.push(P(new THREE.TorusGeometry(len / 6 - .4, .45, 5, 16, Math.PI), '#bfa67a', [cx, -4.4, sz * (hw - .3)], [0, 0, 0], [1, .8, 1])); }
          for (let i = 0; i <= 4; i++) { const x = -len / 2 + i * len / 4; p.push(P(new THREE.CylinderGeometry(.1, .14, 3, 6), '#2f5a3a', [x, 1.5, sz * (hw + .05)]), P(new THREE.SphereGeometry(.28, 8, 6), '#fff4c8', [x, 3.1, sz * (hw + .05)])); } }
        for (let i = 0; i < 4; i++) p.push(P(new THREE.BoxGeometry(2, 10, B.w), '#bfa67a', [(-1.5 + i) * len / 3, -5.6, 0]));
        return p; },
      // Chùa Cầu (Hội An): a little covered wooden footbridge with red posts, yellow walls and a tiled roof
      chuacau: () => { const p = [P(new THREE.BoxGeometry(len + 1, .4, B.w), '#8a5a3b', [0, -.2, 0])], n = Math.round(len / 2);
        for (const sz of [-1, 1]) { p.push(P(new THREE.BoxGeometry(len + 1, .7, .12), '#e8c03a', [0, .35, sz * (hw - .06)]));
          for (let i = 0; i <= n; i++) p.push(P(new THREE.BoxGeometry(.2, 2.4, .2), '#c0392b', [-len / 2 - .5 + i * (len + 1) / n, 1.2, sz * (hw - .1)]));
          p.push(P(new THREE.BoxGeometry(len + 2.4, .12, hw + .9), '#a24e3a', [0, 2.75, sz * (hw + .9) / 2 * .95], [sz * .5, 0, 0])); }
        p.push(P(new THREE.BoxGeometry(len + 2.6, .2, .3), '#5a3a2a', [0, 3.2, 0]), P(new THREE.BoxGeometry(1.2, 1.4, 1.2), '#f2c230', [0, 3.6, 0]), P(new THREE.ConeGeometry(1, .7, 4), '#a24e3a', [0, 4.6, 0], [0, Math.PI / 4, 0]));
        for (let i = 0; i < 2; i++) p.push(P(new THREE.BoxGeometry(1.4, 6, B.w + .2), '#9c8a6a', [(-.3 + .6 * i) * len, -3.2, 0]));
        return p; }
    };
    if (STYLES[B.style]) parts.length = 0, parts.push(...STYLES[B.style]());
    else if (B.style !== 'harbour') parts.length = 0, parts.push(...plain());
    const br = new THREE.Mesh(merge(parts), toonVC()); br.castShadow = true; br.receiveShadow = true; br.position.set(...(B.axis === 'z' ? [B.c, y, (B.a0 + B.a1) / 2] : [(B.a0 + B.a1) / 2, y, B.c]) satisfies [number, number, number]); if (B.axis === 'z') br.rotation.y = -Math.PI / 2; scene.add(br);
    // railings keep little explorers on the bridge
    W.boxes.push({ ...bridgeBox(B, B.a0, B.a1, hw - .1, hw + .3), bottom: y }, { ...bridgeBox(B, B.a0, B.a1, -hw - .3, -hw + .1), bottom: y });
    // (Round U, owner: no step where a road meets a bridge) the deck is walked on over the bridge itself; for 1.2 m past each
    // end (the apron) the road is held at the deck's height and its bed carries you on and off without a step (short enough
    // to leave room for the gentle climb to a junction close by: the Phố Hai Quê bridge and the ring road)
    W.platforms.push({ ...bridgeBox(B, B.a0, B.a1, -B.w / 2, B.w / 2), y: y + .1, bridge: B.id, apron: bridgeBox(B, B.a0 - 1.2, B.a1 + 1.2, -B.w / 2, B.w / 2) });
  }

  // ---------- shrines ----------
  const shrineBase = merge([
    P(new THREE.CylinderGeometry(3.4, 3.8, .6, 8), '#8f8a80', [0, .3, 0]), P(new THREE.CylinderGeometry(2.6, 3, .4, 8), '#a8a296', [0, .8, 0]),
    ...[0, 1, 2, 3].map(i => P(new THREE.BoxGeometry(.6, 3.2, .6), '#6e6a64', [Math.cos(i * 1.571 + .785) * 2.4, 2.2, Math.sin(i * 1.571 + .785) * 2.4])),
    P(new THREE.ConeGeometry(2.9, 1.6, 4), '#5e5a54', [0, 4.4, 0], [0, .785, 0])
  ]);
  SHRINES.forEach(s => {
    const y = heightAt(s.x, s.z);
    const g = new THREE.Group(); g.position.set(s.x, y - .1, s.z);
    const sb = new THREE.Mesh(shrineBase, toonVC({ roughness: .8 })); sb.castShadow = sb.receiveShadow = true; g.add(sb);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(.7, 0), glow('#ff9a3a')); core.position.y = 2.3; g.add(core);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, .06, 6, 30), glow('#ffb35a', .8)); ring.position.y = 2.3; ring.rotation.x = Math.PI / 2; g.add(ring);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, 60, 8, 1, true), glow('#ff9a3a', .18)); beam.position.y = 32; g.add(beam);
    scene.add(g); W.shrineMeshes[s.id] = { core, ring, beam };
    W.colliders.push(...[0, 1, 2, 3].map(i => ({ x: s.x + Math.cos(i * 1.571 + .785) * 2.4, z: s.z + Math.sin(i * 1.571 + .785) * 2.4, r: .5 })));
    W.updaters.push((dt, t) => { core.rotation.y += dt * 1.2; core.position.y = 2.3 + Math.sin(t * 2) * .15; ring.rotation.z += dt * .6; });
  });
  W.setShrineDone = (id, done) => {
    const m = W.shrineMeshes[id]; if (!m) return;
    const col = done ? '#5fe0ff' : '#ff9a3a';
    m.core.material.color.set(col); m.ring.material.color.set(done ? '#9ff0ff' : '#ffb35a'); m.beam.material.color.set(col); m.beam.visible = true;
  };

  // ---------- towers ----------
  TOWERS.forEach(tw => {
    const y = heightAt(tw.x, tw.z), H = TOWER_H;
    const legs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    const parts = [];
    legs.forEach(([a, b]) => parts.push(P(new THREE.BoxGeometry(.7, H, .7), '#5a5650', [a * 2.4, H / 2, b * 2.4])));
    for (let k = 1; k < 6; k++) parts.push(P(new THREE.BoxGeometry(5.6, .35, 5.6), '#6e6a64', [0, k * H / 6, 0]));
    parts.push(P(new THREE.CylinderGeometry(4.2, 3.6, .6, 10), '#7a766e', [0, H + .3, 0]));
    const body = new THREE.Mesh(merge(parts), toonVC({ roughness: .7, metalness: .15 })); body.castShadow = true;
    const panels = new THREE.Mesh(new THREE.BoxGeometry(4.2, H - 2, 4.2), glow('#ff9a3a', .22)); panels.position.y = H / 2;
    const top = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), glow('#ff9a3a')); top.position.y = H + 2.2;
    const g = new THREE.Group(); g.add(body, panels, top); g.position.set(tw.x, y - .2, tw.z); scene.add(g);
    W.towerMeshes[tw.id] = { panels, top, y: y - .2 };
    W.colliders.push({ x: tw.x, z: tw.z, r: 3.4, top: y - .2 + H + .6 });
    // the round roof is walkable all over (it used to push children out from the middle, off the edge)
    W.platforms.push({ x0: tw.x - 4.1, x1: tw.x + 4.1, z0: tw.z - 4.1, z1: tw.z + 4.1, cx: tw.x, cz: tw.z, r: 4.1, y: y - .2 + H + .6, tower: tw.id });
    W.updaters.push((dt, t) => { top.rotation.y += dt; top.position.y = H + 2.2 + Math.sin(t * 1.5) * .2; });
  });
  W.setTowerDone = (id, done) => { const m = W.towerMeshes[id]; if (!m) return; const c = done ? '#5fe0ff' : '#ff9a3a'; m.panels.material.color.set(c); m.top.material.color.set(c); };

  // ---------- Leafies (hidden little forest spirits) ----------
  const leafyRock = merge([P(new THREE.DodecahedronGeometry(.9, 0), '#b0aaa0', [0, .45, 0], [0, 0, 0], [1, .75, 1]), P(new THREE.ConeGeometry(.12, .5, 4), '#5fbf4a', [0, 1.25, 0], [0, 0, .3])]);
  LEAFIES.forEach(lf => {
    const y = heightAt(lf.x, lf.z);
    let obj;
    if (lf.kind === 'rock') { obj = new THREE.Mesh(leafyRock, toonVC()); obj.position.set(lf.x, y - .05, lf.z); }
    else { obj = sprite('✨', 1.3); obj.position.set(lf.x, y + 1.2, lf.z); W.updaters.push((dt, t) => { obj.material.rotation = t; obj.scale.setScalar(1.1 + Math.sin(t * 4 + lf.x) * .25); }); }
    scene.add(obj); W.leafyMeshes[lf.id] = obj;
  });
  W.hideLeafy = id => { const o = W.leafyMeshes[id]; if (o) o.visible = false; };

  // ---------- simple animals ----------
  const buffaloGeo = merge([
    P(new THREE.BoxGeometry(1.6, 1.3, 2.8), '#55555e', [0, 1.4, 0]), P(new THREE.BoxGeometry(1, 1, 1.1), '#4a4a52', [0, 1.7, 1.8]),
    ...[[.55, .9], [-.55, .9], [.55, -.9], [-.55, -.9]].map(([x, z]) => P(new THREE.CylinderGeometry(.18, .16, 1, 6), '#44444c', [x, .5, z])),
    P(new THREE.SphereGeometry(.12, 6, 5), '#ffffff', [.3, 1.9, 2.36]), P(new THREE.SphereGeometry(.12, 6, 5), '#ffffff', [-.3, 1.9, 2.36])
  ]);
  // A separate draw preserves the exterior but lets a rider see past the large storybook horns.
  const buffaloHorns = merge([P(new THREE.TorusGeometry(.7, .12, 5, 12, Math.PI), '#d8d0c0', [0, 2.2, 1.9])]);
  W.buffalo = [];
  [[PADDIES.x - 6, PADDIES.z + 4], [V.x - 26, V.z + 18]].forEach(([x, z], i) => {
    const m = new THREE.Mesh(buffaloGeo, toonVC()); m.position.set(x, heightAt(x, z), z); m.userData.moving = true; scene.add(m); // it wanders and rests: never part of the solid map (js/solids.js)
    const horns = new THREE.Mesh(buffaloHorns, m.material); m.add(horns);
    const sh = blobShadow(); sh.scale.setScalar(2.2); scene.add(sh);
    const b = { id: 'buffalo' + i, mesh: m, shadow: sh, firstPersonHide: [horns], home: [x, z], tx: x, tz: z, rider: null, yaw: 0 };
    W.buffalo.push(b);
    W.interactables.push({ id: b.id, get x() { return m.position.x; }, get z() { return m.position.z; }, r: 3, icon: '🐃', label: () => T('Ride buffalo', 'Cưỡi trâu'), visible: () => !b.rider, act: (pl, game) => game.mount(pl, b) });
  });
  W.updaters.push((dt, t) => W.buffalo.forEach(b => {
    if (b.rider) return;
    const m = b.mesh, dx = b.tx - m.position.x, dz = b.tz - m.position.z, d = Math.hypot(dx, dz);
    // (Round V, owner 13 Oct) after a ride it runs back home; from far away, out of every child's sight, it is simply home again
    if (b.back && d > 40 && !(W.heroesNear && W.heroesNear(m.position.x, m.position.z, 30))) { m.position.x = b.tx = b.home[0]; m.position.z = b.tz = b.home[1]; b.back = false; }
    else if (d < .5) { b.back = false; if (Math.random() < dt * .2) { b.tx = b.home[0] + (Math.random() - .5) * 16; b.tz = b.home[1] + (Math.random() - .5) * 16; } }
    else { const sp = b.back ? 3.2 : 1.2; b.yaw = Math.atan2(dx, dz); m.rotation.y = b.yaw; m.position.x += dx / d * dt * sp; m.position.z += dz / d * dt * sp; }
    // Grazing animals must respect the same walls as their riders. A later house or
    // landmark used to let them wander inside it, leaving no place to mount them.
    if (W.collide) {
      const x = m.position.x, z = m.position.z; W.collide(m.position, 1.1);
      if (Math.hypot(m.position.x - x, m.position.z - z) > .05) { b.tx = m.position.x; b.tz = m.position.z; }
    }
    m.position.y = heightAt(m.position.x, m.position.z); b.shadow.position.set(m.position.x, m.position.y + .05, m.position.z);
  }));
  // ducks on the lake and chickens in the village (just for company)
  const critters = [];
  for (let i = 0; i < 6; i++) { const s = sprite('🦆', 1.4); critters.push({ s, cx: LAKE.x + (Math.random() - .5) * 30, cz: LAKE.z + (Math.random() - .5) * 30, r: 3 + Math.random() * 4, a: Math.random() * 6, sp: .3 + Math.random() * .3, water: true }); }
  for (let i = 0; i < 5; i++) { const s = sprite(i % 2 ? '🐓' : '🐔', 1.1); critters.push({ s, cx: V.x - 8 + Math.random() * 20, cz: V.z - 20 + Math.random() * 8, r: 2 + Math.random() * 3, a: Math.random() * 6, sp: .4 }); }
  for (let i = 0; i < 14; i++) { const s = sprite('🦋', .7); critters.push({ s, cx: PLATEAU.x + (Math.random() - .5) * 160, cz: PLATEAU.z + (Math.random() - .5) * 160, r: 3, a: Math.random() * 6, sp: .8, fly: true }); }
  const fireflies = [];
  for (let i = 0; i < 40; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ color: '#fff7a0', transparent: true, opacity: 0, depthWrite: false, fog: false })); s.scale.setScalar(.25); const x = BAMBOO.x + (Math.random() - .5) * 80, z = BAMBOO.z + (Math.random() - .5) * 80; s.position.set(x, heightAt(x, z) + 1.5, z); scene.add(s); fireflies.push({ s, ox: x, oz: z, a: Math.random() * 6 }); }
  for (let i = 0; i < 30; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ color: '#fff7a0', transparent: true, opacity: 0, depthWrite: false, fog: false })); s.scale.setScalar(.25); const x = V.x + (Math.random() - .5) * 60, z = V.z + (Math.random() - .5) * 60; s.position.set(x, heightAt(x, z) + 1.5, z); scene.add(s); fireflies.push({ s, ox: x, oz: z, a: Math.random() * 6 }); }
  W.fireflies = fireflies;
  critters.forEach(c => { c.cx = clamp(c.cx, -HALF + 30, HALF - 30); c.cz = clamp(c.cz, -HALF + 30, HALF - 30); scene.add(c.s); c.s.userData.critter = c; });
  W.critters = critters;
  W.updaters.push((dt, t) => {
    critters.forEach(c => {
      c.a += dt * c.sp; const x = c.cx + Math.cos(c.a) * c.r, z = c.cz + Math.sin(c.a) * c.r;
      const g = c.water ? WATER + .4 : heightAt(x, z) + (c.fly ? 1.6 + Math.sin(t * 3 + c.r) * .5 : .5);
      c.s.position.set(x, c.water ? Math.max(g, heightAt(x, z) + .5) : g, z);
    });
    const night = W.isNight();
    fireflies.forEach(f => { f.a += dt; const on = night && !(f.caught > performance.now() / 1000); f.s.visible = on; f.s.material.opacity = on ? .6 + Math.sin(t * 3 + f.a * 3) * .4 : 0; f.s.position.x = f.ox + Math.sin(f.a * .7) * 2; f.s.position.z = f.oz + Math.cos(f.a * .5) * 2; });
  });

  // ---------- walking surface ----------
  // Ground height including bridges and tower tops (only if you are already above them).
  W.groundAt = (x, z, y = 1e9) => {
    let g = heightAt(x, z);
    for (const p of W.platforms) if (x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1 && (!p.r || Math.hypot(x - p.cx, z - p.cz) < p.r) && y >= p.y - 1.2) g = Math.max(g, p.y);
    // on a road: stand on the road surface (roads.js keeps it), unless you are well below it (under a bridge)
    if (W.roadTop) { const r = W.roadTop.get(Math.round(x * 2) * 8192 + Math.round(z * 2)); if (r != null && y >= r - 1.2) g = Math.max(g, r - .03); }
    return g;
  };
  W.platformAt = (x, z, y) => W.platforms.find(p => x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1 && (!p.r || Math.hypot(x - p.cx, z - p.cz) < p.r) && Math.abs(y - p.y) < .3);
  // Solid round things are sorted into a 16 m grid (rebuilt whenever one is added), so each step only checks
  // the few nearby ones instead of all ~1,500 (phones).
  const CELL = 16; let grid = null, gridN = -1, gridR = 0;
  const cellKey = (gx, gz) => (gx + 64) * 256 + (gz + 64);
  const buildGrid = () => {
    grid = new Map(); gridR = 0; gridN = W.colliders.length;
    for (const c of W.colliders) { gridR = Math.max(gridR, c.r); const k = cellKey(Math.floor(c.x / CELL), Math.floor(c.z / CELL)); let l = grid.get(k); if (!l) grid.set(k, l = []); l.push(c); }
    gridR += 1; // room for a collider that grows a little later
  };
  W.collide = (pos, r = .5) => {
    if (gridN !== W.colliders.length) buildGrid();
    const reach = r + gridR, x0 = Math.floor((pos.x - reach) / CELL), x1 = Math.floor((pos.x + reach) / CELL), z0 = Math.floor((pos.z - reach) / CELL), z1 = Math.floor((pos.z + reach) / CELL);
    for (let gx = x0; gx <= x1; gx++) for (let gz = z0; gz <= z1; gz++) {
      const l = grid.get(cellKey(gx, gz)); if (!l) continue;
      for (const c of l) {
        if (c.top != null && pos.y != null && pos.y >= c.top - .35) continue; // standing on top of it (a tower's roof)
        const dx = pos.x - c.x, dz = pos.z - c.z, m = c.r + r; if (dx * dx + dz * dz >= m * m) continue;
        const d = Math.hypot(dx, dz);
        if (d > 1e-4) { pos.x = c.x + dx / d * m; pos.z = c.z + dz / d * m; }
      }
    }
    // houses and walls: push out of the box the shortest way
    for (const b of W.boxes) {
      if (b.bottom != null && pos.y != null && pos.y + 1.6 < b.bottom) continue;
      if (pos.x < b.x0 - r || pos.x > b.x1 + r || pos.z < b.z0 - r || pos.z > b.z1 + r) continue;
      if (b.rot != null) {
        const co = Math.cos(b.rot), si = Math.sin(b.rot), dx = pos.x - b.cx, dz = pos.z - b.cz;
        let lx = co * dx - si * dz, lz = si * dx + co * dz;
        const hx = b.hw + r, hz = b.hd + r;
        if (Math.abs(lx) > hx || Math.abs(lz) > hz) continue;
        if (hx - Math.abs(lx) < hz - Math.abs(lz)) lx = (lx < 0 ? -1 : 1) * hx;
        else lz = (lz < 0 ? -1 : 1) * hz;
        pos.x = b.cx + co * lx + si * lz; pos.z = b.cz - si * lx + co * lz;
        continue;
      }
      const pen = [pos.x - (b.x0 - r), (b.x1 + r) - pos.x, pos.z - (b.z0 - r), (b.z1 + r) - pos.z], k = pen.indexOf(Math.min(...pen));
      if (k === 0) pos.x = b.x0 - r; else if (k === 1) pos.x = b.x1 + r; else if (k === 2) pos.z = b.z0 - r; else pos.z = b.z1 + r;
    }
    pushOutOfSolids(W, pos, r); // the solid map: walls, fences, rocks, kiosks… (js/solids.js)
    pos.x = clamp(pos.x, -HALF + 8, HALF - 8); pos.z = clamp(pos.z, -HALF + 8, HALF - 8);
  };
  W.update = (dt, t) => W.updaters.forEach(f => f(dt, t));
  return W;
}

// (round T4a) the water map: rgb the colour of the water at each spot of the valley (each river its own, deeper darker),
// alpha how near the shore it is (0.2 deep … 1 at the water's edge: the foam line). Painted once, kept on the device.
// (owner, 29 Oct AEDT: "Hồ Gươm should be in a lake but it is on dry land") the two ponds keep a hint of their real green, but
// read as water: the old jade green looked like grass from above
const WATER_COLOURS = { hong: '#a8714c', mekong1: '#8f8a58', mekong2: '#8f8a58', saigon_r: '#5f8c8f', brisbane_r: '#5f8f86', yarra: '#7a8462', murray: '#7c8660',
  hoguom: '#5fbcb6', billabong: '#4f8a84', lake: '#3fb0c6', sydney_harbour: '#2f7fbf', hoian_canal: '#4f9aa6', sea: '#2a7fc0' };
export function paintWater(size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const img = x.createImageData(size, size), d = img.data, step = SIZE / size;
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)), cols = {}, base = rgb('#2f8fc8');   // sRGB bytes, as the shader reads them
  for (const k in WATER_COLOURS) cols[k] = rgb(WATER_COLOURS[k]);
  // which water a spot belongs to: the lake and the ponds first (a river running into them stops at their shore), then the
  // nearest river, then the sea
  const which = (wx, wz) => { if (dist2(wx, wz, LAKE.x, LAKE.z) < LAKE.r + 3) return 'lake'; for (const P of PONDS) if (dist2(wx, wz, P.x, P.z) < P.r + 3) return P.id;
    if (riverDist(wx, wz) < 30 && RV_NEAR.id) return RV_NEAR.id; return wz > COAST.z - 30 ? 'sea' : null; };
  const col = new Float32Array(size * size * 3);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const wx = -HALF + (i + .5) * step, wz = -HALF + (j + .5) * step, h = heightAt(wx, wz), deep = Math.max(0, WATER - h);
    const w = which(wx, wz), cc = cols[w] || base, dk = 1 - clamp(deep / 7, 0, 1) * .3, k = j * size + i;
    col[k * 3] = cc[0] * dk; col[k * 3 + 1] = cc[1] * dk; col[k * 3 + 2] = cc[2] * dk;
    // (r89, owner: "the white thing over the bridge") a shallow pond (Ho Guom, .8 m) would be foam all over with a fixed
    // 1.5 m band, so a pond's band follows its own depth: only its edge is white
    const P = PONDS.find(q => q.id === w), band = P ? Math.min(1.5, P.depth * .3) : 1.5;
    d[k * 4 + 3] = (.2 + .8 * (h >= WATER ? 1 : 1 - smooth(0, band, deep))) * 255;   // alpha: how near the shore (the foam line)
  }
  // soften where two waters meet (a river into the sea, two channels joining): a small box blur of the colours, twice
  const tmp = new Float32Array(col.length), R = 2;
  for (let pass = 0; pass < 2; pass++) for (const [src, dst, dx, dy] of [[col, tmp, 1, 0], [tmp, col, 0, 1]] satisfies [Float32Array, Float32Array, number, number][]) for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    let r = 0, g = 0, bl = 0, n = 0; for (let o = -R; o <= R; o++) { const ii = i + o * dx, jj = j + o * dy; if (ii < 0 || jj < 0 || ii >= size || jj >= size) continue; const q = (jj * size + ii) * 3; r += src[q]; g += src[q + 1]; bl += src[q + 2]; n++; }
    const q = (j * size + i) * 3; dst[q] = r / n; dst[q + 1] = g / n; dst[q + 2] = bl / n;
  }
  for (let k = 0; k < size * size; k++) { d[k * 4] = col[k * 3]; d[k * 4 + 1] = col[k * 3 + 1]; d[k * 4 + 2] = col[k * 3 + 2]; }
  x.putImageData(img, 0, 0); return c;
}
// Paint a top-down picture of the world for the map and minimap.
export function paintMap(size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const img = x.createImageData(size, size), d = img.data, step = SIZE / size;
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const wx = -HALF + (i + .5) * step, wz = -HALF + (j + .5) * step, h = heightAt(wx, wz);
    const shade = clamp(1 + (heightAt(wx - 1, wz - 1) - h) * .12, .7, 1.25);
    let r, g, b;
    if (h < 0) { const k = clamp(-h / 7, 0, 1); r = 90 - k * 40; g = 175 - k * 50; b = 215 - k * 30; }
    else if (h < 1.6) { r = 232; g = 214; b = 160; }
    else if (h > 34) { r = 240; g = 245; b = 252; }
    else if (h > 22) { r = 150; g = 150; b = 138; }
    else { r = 112 + h * 2; g = 178 - h; b = 130; }
    if (dist2(wx, wz, VILLAGE.x, VILLAGE.z) < VILLAGE.r - 2) { r = 222; g = 196; b = 150; }
    if (dist2(wx, wz, PADDIES.x, PADDIES.z) < PADDIES.r) { r = 160; g = 214; b = 110; }
    if (dist2(wx, wz, CHINA.x, CHINA.z) < CHINA.r - 2) { r = 226; g = 190; b = 160; }
    if (dist2(wx, wz, INDIA.x, INDIA.z) < INDIA.r - 2) { r = 238; g = 200; b = 150; }
    if (dist2(wx, wz, BAMBOO.x, BAMBOO.z) < BAMBOO.r) { r *= .8; g *= .95; b *= .8; }
    for (const C of CITIES) if (wx > C.x0 && wx < C.x1 && wz > C.z0 && wz < C.z1) { r = 230; g = 214; b = 186; }
    { const rd = roadDist(wx, wz); if (rd.d < rd.road.w / 2 + .6) { if (rd.road.kind === 'asphalt') { r = 120; g = 124; b = 130; } else if (rd.road.kind === 'dirt') { r = 196; g = 158; b = 108; } else { r = 214; g = 186; b = 140; } } }
    if (wx > TOWN.x0 - 6 && wx < TOWN.x1 + 4 && Math.abs(wz - TOWN.roadZ) < 3.6) { r = 175; g = 180; b = 184; }
    else if ((wx > MARKET.x0 && wx < MARKET.x1 && Math.abs(wz - MARKET.roadZ) < 4) || (wx > AUSSIE.x0 && wx < AUSSIE.x1 && Math.abs(wz - AUSSIE.roadZ) < 3.6)) { r = 190; g = 186; b = 178; }
    else if (wx > TOWN.x0 - 2 && wx < TOWN.x1 && ((wz > TOWN.z0 && wz < TOWN.roadZ - 7) || (wz > TOWN.roadZ + 8 && wz < TOWN.z1 - 2 && (wx < TOWN.x0 + 6 || wx > TOWN.x1 - 12)))) { r = 236; g = 200; b = 160; }
    const o = (j * size + i) * 4; d[o] = clamp(r * shade, 0, 255); d[o + 1] = clamp(g * shade, 0, 255); d[o + 2] = clamp(b * shade, 0, 255); d[o + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  // the bridge
  const s = size / SIZE;
  for (const B of BRIDGES) { const r = bridgeBox(B, B.a0, B.a1, -2, 2); x.fillStyle = B.style === 'dragon' ? '#e8b51e' : '#a9764a'; x.fillRect((r.x0 + HALF) * s, (r.z0 + HALF) * s, (r.x1 - r.x0) * s, (r.z1 - r.z0) * s); }
  return c;
}

// Once everything is placed: level the ground under every building (world.boxes) and every big round thing
// (colliders of 2.5 m and more), then reshape the terrain there. The flat patch is the height the thing was placed
// at (the ground at its middle); the edge eases back over up to 4 m, less near a road so the road stays on the ground.
export function levelUnderBuildings(world, scene) {
  // remember how far above the ground everything small stands (people, tags, animals, props), to move it with the ground
  const keep = [];
  if (scene) for (const o of scene.children) {
    if (o === world.terrain || o.isLight || o.isInstancedMesh || !o.position) continue;
    if (o.isMesh && o.geometry && !o.userData.plotId) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); if (o.geometry.boundingSphere.radius > 6) continue; }
    keep.push([o, heightAt(o.position.x, o.position.z)]);
  }
  const want = [];
  for (const b of world.boxes) { if (b.room || b.x1 - b.x0 > 40 || b.z1 - b.z0 > 40) continue; want.push({ x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 }); }
  for (const c of world.colliders) if (c.r >= 2.5 && c.r <= 12) want.push({ x0: c.x - c.r * .8, x1: c.x + c.r * .8, z0: c.z - c.r * .8, z1: c.z + c.r * .8 });
  let n = 0;
  for (const F of want) {
    const cx = (F.x0 + F.x1) / 2, cz = (F.z0 + F.z1) / 2, h = heightAt(cx, cz);
    if (h < WATER + .6 || riverDist(cx, cz) < 12) continue;
    const corners = [[F.x0, F.z0], [F.x1, F.z0], [F.x0, F.z1], [F.x1, F.z1]].map(([x, z]) => heightAt(x, z));
    if (Math.max(...corners.map(v => Math.abs(v - h))) < .25) continue; // already flat enough
    const rd = roadDist(cx, cz), half = rd.road ? rd.road.w / 2 : 0, room = rd.d - half - Math.max(F.x1 - F.x0, F.z1 - F.z0) / 2;
    F.pad = Math.max(1.2, Math.min(4, room - 1)); F.h = h; fpAdd(F); n++;
  }
  // (round T3) the spare plots by the cities were chosen from the map alone: one that a building, its levelled ground, a
  // collider or anything standing (35 cm to 1.6 m up) has since landed on is dropped (the Memory Villages' are kept clear by design)
  const stands = [];
  if (scene) { scene.updateMatrixWorld(true); const bb = new THREE.Box3();
    scene.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o === world.terrain || !o.visible || o.userData.plots) return;
      for (let q = o; q; q = q.parent) { const u = q.userData || {}; if (u.road || u.walk || u.avatar || u.moving) return; }
      bb.setFromObject(o); if (bb.max.y - bb.min.y > .3 && bb.max.x - bb.min.x < 40 && bb.max.z - bb.min.z < 40) stands.push(bb.clone()); }); }   // (not the sky, the sea or the ground)
  for (let i = PLOTS.length - 1; i >= PLOTS.spareFrom; i--) { const P = PLOTS[i]; if (P.occupied) continue; // its remembered home is supposed to stand here
    const B = plotBox(P), y = heightAt(P.x, P.z);
    const hit = (x0, x1, z0, z1) => x1 > B.x0 && x0 < B.x1 && z1 > B.z0 && z0 < B.z1;
    if (FOOTPRINTS.some(F => !F.plot && hit(F.x0 - F.pad, F.x1 + F.pad, F.z0 - F.pad, F.z1 + F.pad)) || world.boxes.some(b => !b.room && hit(b.x0, b.x1, b.z0, b.z1))
      || world.colliders.some(c => c.r >= .3 && hit(c.x - c.r, c.x + c.r, c.z - c.r, c.z + c.r))
      || stands.some(b => hit(b.min.x, b.max.x, b.min.z, b.max.z) && b.min.y < y + 1.6 && b.max.y > y + .35)) PLOTS.splice(i, 1);
  }
  // (round T3) each garden plot: level at the height of the lane just in front of it, easing back over its sides
  for (const P of PLOTS) { const B = plotBox(P), fx = Math.sin(P.rot), fz = Math.cos(P.rot);
    const h = heightAt(P.x + fx * (P.d / 2 + .4), P.z + fz * (P.d / 2 + .4)); P.h = h;
    fpAdd({ ...B, pad: .25, h, plot: P.id }); n++; }   // (pad: half the 0.5 m gap between two plots, so one never tilts the next)
  // reshape the terrain where anything changed
  const t = world.terrain; if (!t || !n) return n;
  const pa = t.geometry.attributes.position;
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i), z = pa.getZ(i), list = FP_GRID.get(fpKey(Math.floor(x / 16), Math.floor(z / 16)));
    if (list && list.length) pa.setY(i, heightAt(x, z));
  }
  pa.needsUpdate = true; t.geometry.computeVertexNormals(); t.geometry.computeBoundingSphere();
  for (const [o, h0] of keep) { const d = heightAt(o.position.x, o.position.z) - h0; if (Math.abs(d) > .02 && Math.abs(d) < 6) o.position.y += d; }
  return n;
}

// Widen the level land round every village, town and city (see WIDE), after everything is placed: the ground is
// reshaped, and whatever stands where the ground changed (trees, signs, props, people, roads) moves up or down with
// it, keeping its place on the map.
export function widenFlatLand(world, scene, metres = 10) { reshapeGround(world, scene, () => { WIDE = metres; }, 'ground-wide-' + metres); }
// switch the road beds on (js/roads.js) and reshape the ground the same careful way
export function roadBedsOn(world, scene) { reshapeGround(world, scene, () => { RB_ON = true; }, 'ground-roadbeds'); }
// Change the ground (change() alters what heightAt returns), then reshape the terrain and move whatever stands where
// the ground changed (trees, signs, props, people, roads) up or down with it, so nothing shifts on the map.
function reshapeGround(world, scene, change, memo = '') {
  const keep = [], inst = [], roads = [];
  for (const o of scene.children) {
    if (o === world.terrain || o.isLight || !o.position) continue;
    if (o.userData.road) { roads.push(o); continue; }
    if (o.isInstancedMesh) { inst.push(o); continue; }
    if (o.isMesh && o.geometry) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); if (o.geometry.boundingSphere.radius > 45) continue; }
    keep.push([o, heightAt(o.position.x, o.position.z)]);
  }
  const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  const instOld = inst.map(o => { const a = []; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); p.setFromMatrixPosition(m4); a.push(heightAt(p.x, p.z)); } return a; });
  const roadOld = roads.map(o => { const pa = o.geometry.attributes.position, a = new Float32Array(pa.count); for (let i = 0; i < pa.count; i++) a[i] = heightAt(pa.getX(i), pa.getZ(i)); return a; });
  const topOld = world.roadTop ? [...world.roadTop.keys()].map(k => [k, heightAt(Math.round(k / 8192) / 2, (k - Math.round(k / 8192) * 8192) / 2)]) : [];
  change();
  const t = world.terrain;
  // (the ground's new heights: kept on the device after the first start of a build, js/worldmemo.ts)
  if (t) { const pa = t.geometry.attributes.position, kept = memo ? keptFloats(memo, pa.count) : null;
    if (kept) for (let i = 0; i < pa.count; i++) pa.setY(i, kept[i]);
    else { const ys = new Float32Array(pa.count); for (let i = 0; i < pa.count; i++) { ys[i] = heightAt(pa.getX(i), pa.getZ(i)); pa.setY(i, ys[i]); } if (memo) rememberFloats(memo, ys); } pa.needsUpdate = true; t.geometry.computeVertexNormals(); t.geometry.computeBoundingSphere(); }
  for (const [o, h0] of keep) { const d = heightAt(o.position.x, o.position.z) - h0; if (Math.abs(d) > .01) o.position.y += d; }
  inst.forEach((o, k) => { let ch = false; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); m4.decompose(p, q, sc); const d = heightAt(p.x, p.z) - instOld[k][i]; if (Math.abs(d) > .01) { p.y += d; m4.compose(p, q, sc); o.setMatrixAt(i, m4); ch = true; } } if (ch) { o.instanceMatrix.needsUpdate = true; o.computeBoundingSphere && o.computeBoundingSphere(); } });
  roads.forEach((o, k) => { const pa = o.geometry.attributes.position; let ch = false; for (let i = 0; i < pa.count; i++) { const d = heightAt(pa.getX(i), pa.getZ(i)) - roadOld[k][i]; if (Math.abs(d) > .01) { pa.setY(i, pa.getY(i) + d); ch = true; } } if (ch) { pa.needsUpdate = true; o.geometry.computeVertexNormals(); o.geometry.computeBoundingSphere(); } });
  for (const [k, h0] of topOld) { const d = heightAt(Math.round(k / 8192) / 2, (k - Math.round(k / 8192) * 8192) / 2) - h0; if (Math.abs(d) > .01) world.roadTop.set(k, world.roadTop.get(k) + d); }
}

// More level land drawn by the family in Sparkle Studio (content pack "world.land"): each rectangle becomes flat
// ground at the height of its middle, with the same gentle edge as the towns, ready for new houses.
for (const L of (STUDIO_ON_MAP && CUSTOM.world && Array.isArray(CUSTOM.world.land) ? CUSTOM.world.land : []).slice(0, 40)) {
  if (!L || ![L.x0, L.x1, L.z0, L.z1].every(v => typeof v === 'number' && isFinite(v))) continue;
  const x0 = Math.max(-HALF + 10, Math.min(L.x0, L.x1)), x1 = Math.min(HALF - 10, Math.max(L.x0, L.x1)), z0 = Math.max(-HALF + 10, Math.min(L.z0, L.z1)), z1 = Math.min(HALF - 10, Math.max(L.z0, L.z1));
  if (x1 - x0 < 2 || z1 - z0 < 2 || x1 - x0 > 120 || z1 - z0 > 120) continue;
  const h = typeof L.h === 'number' && isFinite(L.h) ? Math.max(1, Math.min(30, L.h)) : Math.max(1.2, heightAt((x0 + x1) / 2, (z0 + z1) / 2));
  FLATS.push({ x0, x1, z0, z1, h, family: true });
}
