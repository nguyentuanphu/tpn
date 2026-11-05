// Part of the open world (js/world.ts re-exports everything here): regions, shrines, towers, Leafies, garden plots and building lots.
// (v1.07, owner 2 Nov 2026 AEDT) moved out of js/world.ts unchanged.
import { P } from '../gfx.js';
import { dist2 } from '../util.js';
import { T } from '../i18n.js';
import * as MAP from '../content/map.js';
import { AUSSIE, BAMBOO, CHINA, CITIES, FLATS, HOIAN, HOME, INDIA, LAKE, LOTS, MARKET, MTN, PADDIES, PLATEAU, PLAYGROUND, TOWN, VILLAGE, WATER, bridgeAt, pondDist } from './places.js';
import { ROADS, heightAt, riverDist, roadDist, setGround } from './ground.js';

// (v1.08d s2vn) the small new areas of Season 2 (js/s2vn.ts adds each open one: its id, middle and radius)
export const EXTRA_REGIONS: { id: string; x: number; z: number; r: number }[] = [];
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
  for (const R of EXTRA_REGIONS) if (dist2(x, z, R.x, R.z) < R.r) return R.id;
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
setGround('PADS', [...SHRINES, ...LEAFIES.filter(l => l.kind === 'rock')]);

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
