// Part of the open world (js/world.ts re-exports everything here): painting the map and water pictures.
// (v1.07, owner 2 Nov 2026 AEDT) moved out of js/world.ts unchanged.
import { P } from '../gfx.js';
import { dist2, clamp, smooth } from '../util.js';
import { AUSSIE, BAMBOO, BRIDGES, CHINA, CITIES, COAST, HALF, INDIA, LAKE, MARKET, PADDIES, PONDS, SIZE, TOWN, VILLAGE, WATER, bridgeBox } from './places.js';
import { RV_NEAR, heightAt, riverDist, roadDist } from './ground.js';

const WATER_COLOURS = { hong: '#a8714c', mekong1: '#8f8a58', mekong2: '#8f8a58', saigon_r: '#5f8c8f', brisbane_r: '#5f8f86', yarra: '#7a8462', murray: '#7c8660',
  hoguom: '#5fbcb6', billabong: '#4f8a84', lake: '#3fb0c6', sydney_harbour: '#2f7fbf', hoian_canal: '#4f9aa6', sea: '#2a7fc0' };
// (#36, 31 Oct AEDT) both pictures are painted a few rows at a time (js/worldcache.ts slices them between frames, so the
// first start does not freeze for seconds as the child walks in); paintWater/paintMap still paint all at once
const runAll = (g: Generator<unknown, HTMLCanvasElement>) => { let r = g.next(); while (!r.done) r = g.next(); return r.value; };
export function paintWater(size = 256) { return runAll(paintWaterRows(size)); }
export function* paintWaterRows(size = 256): Generator<unknown, HTMLCanvasElement> {
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
    if (i === 0 && j && !(j & 7)) yield;
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
export function paintMap(size = 256) { return runAll(paintMapRows(size)); }
export function* paintMapRows(size = 256): Generator<unknown, HTMLCanvasElement> {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const img = x.createImageData(size, size), d = img.data, step = SIZE / size;
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    if (i === 0 && j && !(j & 7)) yield;
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
