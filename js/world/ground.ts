// Part of the open world (js/world.ts re-exports everything here): roads, rivers and water distances, heightAt and surfaceAt.
// (v1.07, owner 2 Nov 2026 AEDT) moved out of js/world.ts unchanged.
import { P } from '../gfx.js';
import { clamp, dist2, lerp, smooth, fbm } from '../util.js';
import * as MAP from '../content/map.js';
import { BAMBOO, BRIDGES, CHINA, CITIES, COAST, EDGE, FESTGROUNDS, FLATS, FP_GRID, HOME, INDIA, LAKE, LEVELS, LOTS, MTN, PADDIES, PD_NEAR, PLATEAU, PLAYGROUND, PONDS, RAMP, RELIEF_SEGMENTS, RIVERS, SADDLES, VILLAGE, WATER, bridgeAcross, bridgeAlong, bridgeAt, bridgeBox, fpKey, levelAt, pondDist } from './places.js';
import type { SvRoad } from './places.js';

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
export const RV_R = 32, RV_GRID = new Map(), RV_NEAR = { id: null };
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

// the ground as it was before the level land was widened (the same while the world is being built)
export function oldHeightAt(x, z) { const w = WIDE; WIDE = 0; try { return heightAt(x, z); } finally { WIDE = w; } }

// (v1.07 split) the other parts of the world change these four through here (a name imported from this file cannot be
// assigned there): the sites set PADS once, createWorld turns HERITAGE_GROUNDS_ON on, the reshaping sets WIDE and RB_ON
export function setGround(k: 'WIDE' | 'PADS' | 'RB_ON' | 'HERITAGE_GROUNDS_ON', v) { if (k === 'WIDE') WIDE = v; else if (k === 'PADS') PADS = v; else if (k === 'RB_ON') RB_ON = v; else HERITAGE_GROUNDS_ON = v; }
