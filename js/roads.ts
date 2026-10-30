// Roads between the villages and cities: an asphalt main road with a dashed white centre line, dirt
// roads to the quieter places, Đà Nẵng's golden Dragon Bridge where the road crosses the river, and a
// golden welcome gate (cổng chào) at the entrance of every village and city.
import { THREE, toonVC, P, merge, outline } from './gfx.js';
import { T, onLang } from './i18n.js';
import { SFX } from './audio.js';
import { heightAt, levelAt, riverDist, roadDist, edgeDist, ROADS, CITIES, TOWN, AUSSIE, DRAGON, WATER, REGION_NAMES, setRoadBeds, roadBedsOn, bridgeAt, bridgeBox, PADDIES, PLOTS, plotBox } from './world.js';
import { settings } from './state.js';
import { featureOn } from './custom.js';
import { remember } from './worldmemo.js';
import { ROAD_TONES } from './content/map.js';
// HARD RULE (owner, round 30): the steepest a road may climb: asphalt 8 %, dirt 12 % (checked by `roadshape`)
export const ROAD_GRADE = { asphalt: .08, dirt: .12, footpath: .15 };

// a long strip texture: asphalt with a dashed centre line, packed dirt with wheel tracks, or a footpath of packed
// earth with flat stepping stones
// (round T4a) `style`: 'vn' a yellow centre dash (Vietnam), 'au' white dashes with concrete kerbs (Australia), 'brick' and
// 'paving' for town streets; anything else the white lines of before. Dirt roads are Bà Rịa's red earth (đất đỏ).
export function roadTexture(kind, tint = null, style = null) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
  if (style === 'brick' || style === 'paving') {
    const brick = style === 'brick'; g.fillStyle = brick ? '#9c5a40' : '#9a958c'; g.fillRect(0, 0, 64, 256);
    for (let y = 0; y < 256; y += 8) for (let x = -16; x < 64; x += 16) { const ox = (y / 8) % 2 ? 8 : 0, v = Math.random() * 18 - 9;
      g.fillStyle = brick ? `rgb(${190 + v},${104 + v},${74 + v})` : `rgb(${196 + v},${190 + v},${178 + v})`; g.fillRect(x + ox + 1, y + 1, 14, 6); }
    g.fillStyle = brick ? '#e2d6c0' : '#d8d2c6'; g.fillRect(0, 0, 3, 256); g.fillRect(61, 0, 3, 256); // the kerb stones along both edges
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }
  if (kind === 'footpath') {
    g.fillStyle = '#d8b98a'; g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 500; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,245,220,.14)' : 'rgba(110,80,50,.1)'; g.fillRect(Math.random() * 64, Math.random() * 256, 2, 2); }
    for (let y = 8; y < 256; y += 32) { const x = 14 + (y / 32 % 2) * 10; g.fillStyle = '#bfb4a2'; g.beginPath(); g.ellipse(x + 12, y + 10, 13, 9, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(x + 10, y + 8, 8, 4, 0, 0, 7); g.fill(); }
  } else if (kind !== 'dirt') { // 'asphalt', or 'plain' asphalt without lines (for junctions)
    // Concept D: darker Australian asphalt and grey Vietnamese asphalt. Keep the region's
    // red/orange tint (ROAD-014), gently enough that it does not turn the asphalt pink or tan.
    const base = style === 'au' ? '#45484c' : style === 'vn' ? '#5f6266' : '#6f747a';
    g.fillStyle = tint ? '#' + new THREE.Color(base).lerp(new THREE.Color(tint), style === 'au' ? .06 : style === 'vn' ? .10 : .32).getHexString() : base; g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 500; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.08)'; g.fillRect(Math.random() * 64, Math.random() * 256, 2, 2); }
    if (kind === 'asphalt' && style === 'au') { // concrete kerbs, a white edge line inside them, white centre dashes
      g.fillStyle = '#d4cfc4'; g.fillRect(0, 0, 4, 256); g.fillRect(60, 0, 4, 256); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(4, 0, 1, 256); g.fillRect(59, 0, 1, 256);
      g.fillStyle = '#f2eee2'; g.fillRect(6, 0, 2, 256); g.fillRect(56, 0, 2, 256); g.fillRect(30, 20, 4, 90); g.fillRect(30, 148, 4, 90);
    } else if (kind === 'asphalt') {
      if (style === 'vn') { g.fillStyle = '#cfcac0'; g.fillRect(0, 0, 2, 256); g.fillRect(62, 0, 2, 256); }
      g.fillStyle = '#e9e4d4'; g.fillRect(2, 0, 3, 256); g.fillRect(59, 0, 3, 256);
      g.fillStyle = style === 'vn' ? '#f2c230' : '#f6f1e4'; g.fillRect(30, 20, 4, 90); g.fillRect(30, 148, 4, 90); }
  } else {
    g.fillStyle = style === 'outback' ? '#d9792e' : '#c0764a'; g.fillRect(0, 0, 64, 256); // (round T4a, Concept D) Bà Rịa's warm red earth; (#34) near Uluru the orange outback
    for (let i = 0; i < 700; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,225,190,.12)' : 'rgba(90,40,20,.12)'; g.fillRect(Math.random() * 64, Math.random() * 256, 2 + Math.random() * 2, 2); }
    g.fillStyle = 'rgba(110,55,30,.28)'; g.fillRect(14, 0, 7, 256); g.fillRect(43, 0, 7, 256); // the two darker wheel tracks
    g.fillStyle = '#b9b0a0'; for (let y = 6; y < 256; y += 22) { g.fillRect(0, y, 3, 5); g.fillRect(61, y + 11, 3, 5); } // edging stones
    g.fillStyle = 'rgba(110,160,80,.5)'; g.fillRect(29, 0, 6, 256); // a little grass down the middle
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}

// A side road that ends on another road stops at that road's edge (instead of painting its lines over it).
function segDist(x, z, pts) { let best = 1e9; for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return best; }
function trimmed(R) {
  let pts = R.pts.map(p => p.slice());
  if (R.loop) return pts; // (round T: a road that closes on itself has no ends)
  for (const end of [0, 1]) {
    if ((R.gates || [])[end]) continue;
    const [x, z] = end ? pts[pts.length - 1] : pts[0];
    const other = ROADS.find(o => o !== R && segDist(x, z, o.pts) < 1.5); if (!other) continue;
    let cut = other.w / 2 - .15; if (end) pts.reverse();
    while (pts.length > 2 && Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) <= cut) { cut -= Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]); pts.shift(); }
    const [ax, az] = pts[0], [bx, bz] = pts[1], L = Math.hypot(bx - ax, bz - az) || 1; pts[0] = [ax + (bx - ax) / L * Math.min(cut, L * .9), az + (bz - az) / L * Math.min(cut, L * .9)];
    if (end) pts.reverse();
  }
  return pts;
}
// Each road is a smooth line sampled every metre with one smooth height along it: the ground under the whole width
// (its highest point), averaged over several metres so the road never humps or steps, level from side to side,
// and exactly on the bridge decks. Roads meeting another road take its height at the joint and ease into their own.
// The ground under and beside the road is then shaped to that height (world.js road beds), so the road, its edges
// and the walking surface always agree.
function denseLine(R) {
  const src = trimmed(R), pts = [];
  for (let i = 0; i < src.length - 1; i++) { const [ax, az] = src[i], [bx, bz] = src[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 1)); for (let k = 0; k < n; k++) pts.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]); }
  pts.push(src[src.length - 1]); return pts;
}
// the deck height at (x, z), over the deck or its apron; DECK_CORE says whether it was over the deck itself
let DECK_CORE = false;
const deckAt = (world, x, z) => { for (const p of world.platforms) { const b = p.apron || p; if (!p.tower && x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) { DECK_CORE = x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1; return p.y; } } return null; };
function profile(R, world, pts, anchors = null) {
  const hw = R.w / 2, deck = [], apron = [], base = pts.map(([x, z], i) => {
    const [px, pz] = pts[Math.max(0, i - 1)], [nx, nz] = pts[Math.min(pts.length - 1, i + 1)], L = Math.hypot(nx - px, nz - pz) || 1, ux = -(nz - pz) / L, uz = (nx - px) / L;
    // a real bridge deck: the deck is well above the ground under it (near the ends the bank is the ground)
    // (30 Oct AEDT, faster first start) the ground is asked only where its answer is used
    const d = deckAt(world, x, z), onDeck = d != null && DECK_CORE && heightAt(x, z) < d - 1; deck.push(onDeck); if (onDeck) return d;
    // (Round U, owner: "different elevation when connecting roads or bridges") over the deck's apron at each end the road
    // is held at the deck's own height, so it meets the deck without a step (it keeps its bed: the ground follows it)
    if (d != null) { apron[i] = true; return d; }
    // inside a village or city the level rule below sets this point, so the ground is not asked
    if (levelAt(x, z) != null && riverDist(x, z) > 13 && !bridgeAt(x, z, 9, 12, 18)) return 0;
    let y = -1e9; for (const s of [-1, -.5, 0, .5, 1]) y = Math.max(y, heightAt(x + ux * hw * s, z + uz * hw * s)); return y;
  });
  // HARD RULE: inside a village or city the road runs at the place's own level (places are flat); on a bridge, on its deck
  const lvl = pts.map(([x, z], i) => { if (deck[i]) return null; const L = levelAt(x, z); return L != null && riverDist(x, z) > 13 && !bridgeAt(x, z, 9, 12, 18) ? L : null; });
  lvl.forEach((L, i) => { if (L != null) base[i] = L; });
  if (anchors) anchors.forEach((y, i) => { base[i] = y; });
  const n = pts.length, deepIn = lvl.map((L, i) => { if (L == null) return false; for (let k = -6; k <= 6; k++) { const j = i + k; if (j >= 0 && j < n && lvl[j] == null) return false; } return true; }); // (the outer 6 m eases in)
  const gates = R.gates || [], gateEnd = i => (gates[0] && i < 2) || (gates[1] && i > n - 3);
  // (r63, owner: "the gate of Hà Nội is blocked") a road's end at a gate meets the place at the place's own level, even
  // where a river or bridge nearby keeps the level rule off: the road used to stop at the hillside's height, half a metre
  // below Hà Nội's square (a ledge nobody could step up) and over a metre above Brisbane's
  // (a bridge deck right after the gate, like Cầu Rồng at Đà Nẵng, keeps the end at the ground so the ramp stays gentle)
  const endY = ([x, z], near) => { const L = levelAt(x, z); return L != null && !near.some(i => deck[i]) ? L : heightAt(x, z); }, span = k => Array.from({ length: Math.min(n, 14) }, (_, j) => k ? n - 1 - j : j);
  if (gates[0] && !deck[0]) base[0] = base[1] = endY(pts[0], span(0)); if (gates[1] && !deck[n - 1]) base[n - 1] = base[n - 2] = endY(pts[n - 1], span(1));
  const fixed = i => deck[i] || apron[i] || deepIn[i] || gateEnd(i) || (lvl[i] != null && (i < 2 || i > n - 3)) || (anchors && anchors.has(i)); // (a road's end at a gate is always at the ground there)
  // HARD RULE: the road is always smooth: a long, gentle average of the ground…
  let ys = base.slice();
  const avg = (W, passes) => { for (let it = 0; it < passes; it++) ys = ys.map((y, i) => { if (fixed(i)) return base[i]; let s = 0, w = 0; for (let k = -W; k <= W; k++) { const j = Math.max(0, Math.min(n - 1, i + k)), wk = W + 1 - Math.abs(k); s += ys[j] * wk; w += wk; } return s / w; }); };
  avg(10, 6);
  // …never steeper than 8 % (dirt roads 12 %: owner's R3), worked out from both directions from the fixed parts…
  // (where two fixed parts are too close for that, the whole stretch between them shares the climb evenly)
  const G = ROAD_GRADE[R.kind] || ROAD_GRADE.dirt, seg = i => Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]), Gs = new Float64Array(n).fill(G);
  { let f0 = -1, run = 0; for (let i = 0; i < n; i++) { if (i) run += seg(i); if (!fixed(i)) continue; if (f0 >= 0 && i - f0 > 1) { const need = Math.abs(base[i] - base[f0]) / (run || 1) * 1.02; if (need > G) { for (let k = f0 + 1; k <= i; k++) Gs[k] = need; (globalThis.__steepRoads = globalThis.__steepRoads || []).push({ road: ROADS.indexOf(R), from: pts[f0].map(Math.round), to: pts[i].map(Math.round), y0: +base[f0].toFixed(2), y1: +base[i].toFixed(2), run: +run.toFixed(1), need: +(need * 100).toFixed(1) }); } } f0 = i; run = 0; } }
  const step = i => seg(i) * Gs[i];
  const limit = () => { for (let pass = 0; pass < 3; pass++) {
    for (let i = 1; i < n; i++) if (!fixed(i)) ys[i] = Math.min(ys[i - 1] + step(i), Math.max(ys[i - 1] - step(i), ys[i]));
    for (let i = n - 2; i >= 0; i--) if (!fixed(i)) ys[i] = Math.min(ys[i + 1] + step(i + 1), Math.max(ys[i + 1] - step(i + 1), ys[i]));
  } };
  limit();
  // …and every change of slope rounded off
  avg(4, 4); limit(); avg(2, 2); limit();
  return { ys, deck, apron, fixed: pts.map((_, i) => fixed(i)) };
}
function ribbonGeo(R, pts, ys) {
  const pos = [], uv = [], idx = [], hw = R.w / 2; let along = 0;
  pts.forEach(([x, z], i) => {
    const [px, pz] = pts[Math.max(0, i - 1)], [nx, nz] = pts[Math.min(pts.length - 1, i + 1)];
    let dx = nx - px, dz = nz - pz; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    if (i) along += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    for (const s of [-1, -.5, 0, .5, 1]) { pos.push(x - dz * hw * s, ys[i] + .035, z + dx * hw * s); uv.push((s + 1) / 2, along / (R.kind === 'asphalt' ? 9 : R.kind === 'dirt' ? 7 : 3)); }
    if (i) { const a = (i - 1) * 5; for (let c = 0; c < 4; c++) idx.push(a + c, a + c + 1, a + c + 5, a + c + 1, a + c + 6, a + c + 5); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}
// all roads: profiles, joints matched, road beds registered and switched on (the ground is reshaped), then the ribbons
function buildRoads(G, mats) {
  // (owner, 30 Oct 2026 AEDT: "it loads too long") the finished heights of every road are kept on the device
  // (js/worldmemo.ts): on the next start of the same build they are read back instead of worked out (about a third of
  // the start-up time on a phone); the result is the same numbers, so the roads and the ground under them are the same
  const lines = ROADS.map(R => denseLine(R)), memo = G.roadMemo;
  const restored = Array.isArray(memo) && memo.length === ROADS.length && memo.every((k, i) => k && Array.isArray(k.ys) && k.ys.length === lines[i].length);
  const { scene, world } = G, all = ROADS.map((R, i) => { const pts = lines[i], k = restored ? memo[i] : null; return { R, pts, extraFix: new Map<number, number>(), jEnd: k ? k.jEnd : [false, false], ...(k ? { ys: k.ys, deck: k.deck, apron: k.apron, fixed: k.fixed } : profile(R, world, pts)) }; });
  if (!restored) {
  // a road whose end meets another road takes that road's exact surface height wherever the two overlap; its own
  // smooth, gentle profile is then worked out again around those fixed points (twice, so joints settle)
  const yOn = (B, x, z) => { let bd = 1e9, by = 0; for (let j = 0; j < B.pts.length - 1; j++) { const [ax, az] = B.pts[j], [bx, bz] = B.pts[j + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))), d = Math.hypot(x - ax - dx * t, z - az - dz * t); if (d < bd) { bd = d; by = B.ys[j] + (B.ys[j + 1] - B.ys[j]) * t; } } return { d: bd, y: by }; };
  // a short road from a through road to a gate: the through road dips to the gate's level where they meet
  all.forEach((A, ai) => { const g = A.R.gates || [], n = A.pts.length; if (n > 16 || !!g[0] === !!g[1]) return;
    const jEnd = g[0] ? 1 : 0, [x, z] = A.pts[jEnd ? n - 1 : 0], gy = A.ys[jEnd ? 0 : n - 1];
    all.forEach((B, bi) => { if (bi === ai || yOn(B, x, z).d > B.R.w / 2 + 1.2) return; B.extraFix = B.extraFix || new Map();
      B.pts.forEach((p, j) => { if (Math.hypot(p[0] - x, p[1] - z) < B.R.w / 2 + A.R.w / 2 + 2) B.extraFix.set(j, gy); }); });
  });
  // (Round U, owner: no steps where roads and bridges join) a bridge that ends close to a junction: the through road there
  // rises or dips just enough that the side road can climb from the deck to it within its grade (the Phố Hai Quê bridge
  // ends 12 m from the ring road)
  all.forEach((A, ai) => { const n = A.pts.length, G = ROAD_GRADE[A.R.kind] || ROAD_GRADE.dirt;
    [0, 1].forEach(end => {
      const [x, z] = A.pts[end ? n - 1 : 0]; let B = null, bd = 1e9; all.forEach((C, ci) => { if (ci === ai) return; const q = yOn(C, x, z); if (q.d < C.R.w / 2 + 1.2 && q.d < bd) { bd = q.d; B = C; } });
      if (!B) return;
      let run = 0, k0 = -1; for (let k = 1; k < n; k++) { const i = end ? n - 1 - k : k, j = end ? i + 1 : i - 1; run += Math.hypot(A.pts[i][0] - A.pts[j][0], A.pts[i][1] - A.pts[j][1]); if (run > 30) break; if (A.apron[i] || A.deck[i]) { k0 = i; break; } }
      if (k0 < 0) return;
      const reach = B.R.w / 2 + A.R.w / 2 + 1, room = Math.max(1, run - reach), Y = A.ys[k0], here = yOn(B, x, z).y, lo = Y - G * room * .95, hi = Y + G * room * .95;
      if (here >= lo - .05 && here <= hi + .05) return;   // (a few centimetres are not worth bending the through road for)
      const want = here < lo ? lo : hi; B.extraFix = B.extraFix || new Map();
      B.pts.forEach((p, j) => { if (Math.hypot(p[0] - x, p[1] - z) < B.R.w / 2 + A.R.w / 2 + 2) B.extraFix.set(j, want); });
    });
  });
  all.forEach(A => { if (A.extraFix) Object.assign(A, profile(A.R, world, A.pts, A.extraFix)); });
  for (let round = 0; round < 2; round++) all.forEach((A, ai) => {
    const n = A.pts.length, anchors = new Map(A.extraFix || []);
    [0, 1].forEach(end => {
      const [x, z] = A.pts[end ? n - 1 : 0];
      let B = null, bd = 1e9; all.forEach((C, ci) => { if (ci === ai) return; const q = yOn(C, x, z); if (q.d < C.R.w / 2 + 1.2 && q.d < bd) { bd = q.d; B = C; } });
      if (!B) return;
      (A.jEnd = A.jEnd || [false, false])[end] = true;
      const reach = B.R.w / 2 + A.R.w / 2 + 1;
      for (let k = 0; k < n; k++) { const i = end ? n - 1 - k : k, q = yOn(B, A.pts[i][0], A.pts[i][1]); if (q.d > reach || A.deck[i]) break; anchors.set(i, q.y); }
    });
    if (anchors.size) Object.assign(A, profile(A.R, world, A.pts, anchors));
  });
  remember('roads', all.map(A => ({ ys: A.ys, deck: A.deck, apron: A.apron, fixed: A.fixed, jEnd: A.jEnd })));
  }
  const segs = [];
  for (const A of all) for (let i = 0; i < A.pts.length - 1; i++) if (!A.deck[i] && !A.deck[i + 1]) segs.push({ r: all.indexOf(A), tip: !!A.jEnd && ((A.jEnd[0] && i < 4) || (A.jEnd[1] && i > A.pts.length - 6)), first: i === 0, last: i === A.pts.length - 2, ax: A.pts[i][0], az: A.pts[i][1], bx: A.pts[i + 1][0], bz: A.pts[i + 1][1], ya: A.ys[i], yb: A.ys[i + 1], hw: A.R.w / 2 });
  setRoadBeds(segs); roadBedsOn(world, scene);
  world.roadLines = all.map(A => ({ kind: A.R.kind, pts: A.pts, ys: A.ys, deck: A.deck, fixed: A.fixed })); // for the tests
  world.roadTop = null; // walking on a road is walking on the ground now (bridge decks are platforms)
  // (round T2) one shared material per road colour, so tinting adds no draw calls of its own (round T4a: with the region's
  // markings: a yellow centre dash in Vietnam, kerbs in Australia)
  const toned = {}, matFor = R => { const t = R.kind === 'asphalt' && ROAD_TONES[R.tone]; if (!t) return mats[R.kind]; return toned[t] || (toned[t] = new THREE.MeshToonMaterial({ map: roadTexture('asphalt', t, R.tone === 'vn' || R.tone === 'au' ? R.tone : null), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); };
  // (#34, Concept D) a dirt road out round Uluru is the orange-red of the outback, like the ground there (js/world.ts)
  let outbackMat = null; const outback = pts => { const [x, z] = pts[Math.floor(pts.length / 2)] || [0, 0]; return x < -174 && z > -90; };
  const matOf = A => A.R.kind === 'dirt' && outback(A.pts) ? outbackMat || (outbackMat = new THREE.MeshToonMaterial({ map: roadTexture('dirt', null, 'outback'), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })) : matFor(A.R);
  for (const A of all) { const m = new THREE.Mesh(ribbonGeo(A.R, A.pts, A.ys), matOf(A)); m.receiveShadow = true; m.userData.road = true; scene.add(m); }
}

// HARD RULE: road edges are soft, with flowers growing alongside. A soft verge fades from the road into the grass on
// both sides, and little clumps of flowers line the roads (never on a building, a gate, water or another road). Made
// once everything else stands (main.js), drawn road by road and only near a player, so phones stay quick.
export function plantRoadside(G) {
  const { scene, world } = G, lines = world.roadLines || [];
  const free = (x, z, pad) => !world.colliders.some(c => c.r > 0 && Math.hypot(c.x - x, c.z - z) < c.r + pad) && !world.boxes.some(b => x > b.x0 - pad && x < b.x1 + pad && z > b.z0 - pad && z < b.z1 + pad);
  const vergeMat = toonVC({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 }); // (drawn just in front of the ground)
  // one flower: a stem, a ring of petals (tinted per flower) and a yellow middle; about 20 triangles
  const petalsG = new THREE.CircleGeometry(.13, 6); petalsG.rotateX(-Math.PI / 2); petalsG.translate(0, .36, 0);
  const stemG = merge([P(new THREE.CylinderGeometry(.012, .016, .36, 3), '#4f9a3c', [0, .18, 0]), P(new THREE.CylinderGeometry(.045, .045, .03, 5), '#ffd23f', [0, .375, 0]), P(new THREE.ConeGeometry(.05, .12, 3), '#5fb04a', [.05, .1, 0], [0, 0, -.6])]);
  const stemMat = toonVC(), petalMat = new THREE.MeshToonMaterial({ color: '#ffffff', side: THREE.DoubleSide });
  const COLS = ['#ff7eb8', '#ffd23f', '#ffffff', '#b58cff', '#ff6b5a', '#ffa64d'].map(c => new THREE.Color(c));
  const dense = settings.quality === 'low' ? 2.8 : 1.6, groups = [];
  lines.forEach((L, k) => {
    const R = ROADS[k], hw = R.w / 2, n = L.pts.length; if (n < 2) return;
    // the soft verge: from the road's edge out 1.1 m, gravel-coloured at the road and fading into the grass
    const pos = [], col = [], idx = [], vc = new THREE.Color(R.kind === 'asphalt' ? '#ddd2ad' : R.kind === 'dirt' ? '#dcb47a' : '#e2c99c'); let v = 0;
    const VERGE = R.kind === 'footpath' ? [[hw - .05, 1], [hw + .25, .7], [hw + .5, 0]] : [[hw - .08, 1], [hw + .6, .75], [hw + 1.5, 0]]; // (R12: a footpath's blend is 0.5 m)
    for (let i = 0; i < n; i++) {
      const [px, pz] = L.pts[Math.max(0, i - 1)], [nx, nz] = L.pts[Math.min(n - 1, i + 1)], D = Math.hypot(nx - px, nz - pz) || 1, ux = -(nz - pz) / D, uz = (nx - px) / D, [x, z] = L.pts[i];
      for (const sd of [-1, 1]) for (const [o, a] of VERGE) {
        const X = x + ux * sd * o, Z = z + uz * sd * o, Y = heightAt(X, Z) + (o < hw ? .07 : .12); // (the ground as it finally is; the terrain mesh is coarser, so a little above)
        pos.push(X, L.deck[i] ? L.ys[i] + .02 : Y, Z); col.push(vc.r, vc.g, vc.b, L.deck[i] ? 0 : a);
      }
      if (i) { const a = v - 6; for (const base of [0, 3]) { const p = a + base, q = v + base; idx.push(p, p + 1, q, p + 1, q + 1, q, p + 1, p + 2, q + 1, p + 2, q + 2, q + 1); } }
      v += 6;
    }
    const vg = new THREE.BufferGeometry(); vg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); vg.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); vg.setIndex(idx); vg.computeVertexNormals();
    const verge = new THREE.Mesh(vg, vergeMat); verge.renderOrder = 1; verge.receiveShadow = true; verge.userData.noCam = true; scene.add(verge);
    // the flowers
    const spots = []; let along = 0, next = Math.random() * dense;
    for (let i = 1; i < n; i++) {
      along += Math.hypot(L.pts[i][0] - L.pts[i - 1][0], L.pts[i][1] - L.pts[i - 1][1]); if (along < next || L.deck[i]) continue; next = along + dense * (.7 + Math.random() * .6);
      if (i < 6 || i > n - 7) continue; // not right at a gate or a joint
      const [px, pz] = L.pts[i - 1], [x, z] = L.pts[i], D = Math.hypot(x - px, z - pz) || 1, ux = -(z - pz) / D, uz = (x - px) / D;
      for (const sd of [-1, 1]) { if (Math.random() < .15) continue;
        const o = hw + 1.7 + Math.random() * 1.4, cx = x + ux * sd * o, cz = z + uz * sd * o;
        if (edgeDist(cx, cz) < 1.1 || riverDist(cx, cz) < 6 || !free(cx, cz, .5)) continue;   // (Round U: off places' streets too)
        const c = COLS[Math.floor(Math.random() * COLS.length)], m = 2 + Math.floor(Math.random() * 3);
        for (let f = 0; f < m; f++) { const fx = cx + (Math.random() - .5) * .9, fz = cz + (Math.random() - .5) * .9, fy = heightAt(fx, fz); if (fy < WATER + .4) continue; spots.push([fx, fy, fz, 1.6 + Math.random() * .8, Math.random() * 6.28, c]); }
      }
    }
    if (!spots.length) return;
    const stems = new THREE.InstancedMesh(stemG, stemMat, spots.length), heads = new THREE.InstancedMesh(petalsG, petalMat, spots.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
    let cxs = 0, czs = 0;
    spots.forEach(([x, y, z, s, r, c], j) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r); m4.compose(ps.set(x, y - .02, z), q, sc.set(s, s, s)); stems.setMatrixAt(j, m4); heads.setMatrixAt(j, m4); heads.setColorAt(j, c); cxs += x; czs += z; });
    for (const M of [stems, heads]) { M.computeBoundingSphere(); M.userData.noCam = true; scene.add(M); }
    groups.push({ meshes: [stems, heads], spots });
  });
  // (#34, Concept D) along the main roads: red lamp posts and bougainvillea on the Vietnam side, orange lamp posts and gum
  // trees on the Australian side; one merged mesh for each, so the draw calls stay the same
  const lampVN = [], lampAU = [], bushes = [], gums = [], benches = [];
  // (check plots) never on a garden plot kept for a future building
  const plotFree = (x, z, pad) => !PLOTS.some(P => { const B = plotBox(P); return x > B.x0 - pad && x < B.x1 + pad && z > B.z0 - pad && z < B.z1 + pad; });
  lines.forEach((L, k) => {
    const R = ROADS[k], n = L.pts.length; if (R.kind !== 'asphalt' || (R.tone !== 'vn' && R.tone !== 'au') || n < 12) return;
    const hw = R.w / 2, vn = R.tone === 'vn'; let along = 0, nextLamp = 12, nextPlant = 20, nextBench = 32, side = 1;
    for (let i = 1; i < n - 6; i++) {
      along += Math.hypot(L.pts[i][0] - L.pts[i - 1][0], L.pts[i][1] - L.pts[i - 1][1]); if (i < 6 || L.deck[i]) continue;
      const [px, pz] = L.pts[i - 1], [x, z] = L.pts[i], D = Math.hypot(x - px, z - pz) || 1, ux = -(z - pz) / D, uz = (x - px) / D;
      const at = (o, sd, pad) => { const cx = x + ux * sd * o, cz = z + uz * sd * o; return edgeDist(cx, cz) >= 1.1 && riverDist(cx, cz) >= 5 && heightAt(cx, cz) > WATER + .5 && free(cx, cz, pad) && plotFree(cx, cz, pad) && roadDist(cx, cz).d > hw - .1 ? [cx, heightAt(cx, cz), cz] : null; };
      if (along >= nextLamp) { const q = at(hw + 1.4, side, .6); if (q) { (vn ? lampVN : lampAU).push(q); world.colliders.push({ x: q[0], z: q[2], r: .22 }); nextLamp = along + 24; side = -side; } }
      if (!vn && along >= nextBench) { const q = at(hw + 2, side, .8); if (q) { benches.push([q[0], q[1], q[2], Math.atan2(-ux * side, -uz * side)]); world.colliders.push({ x: q[0], z: q[2], r: .7 }); nextBench = along + 52; } }
      if (along >= nextPlant) { const q = at(hw + (vn ? 2.2 : 3.6), -side, vn ? .9 : 1.4); if (q) { (vn ? bushes : gums).push(q); world.colliders.push({ x: q[0], z: q[2], r: vn ? .5 : .45 }); nextPlant = along + (vn ? 34 : 46); } }
    }
  });
  const place = (parts, list, mat) => { if (!list.length) return null; const all = []; list.forEach(([x, y, z], j) => parts.forEach(p => { const g = p.g.clone(); g.rotateY(j * 1.7); g.translate(x, y, z); all.push({ g, color: p.color }); })); const m = new THREE.Mesh(merge(all), mat); m.castShadow = true; m.userData.noSolid = true; scene.add(m); return m; }; // (their colliders keep children out; added after the solid map, they would change its saved copy's key)
  const lampGeo = col => ([P(new THREE.CylinderGeometry(.07, .1, 4, 6), col, [0, 2, 0]), P(new THREE.CylinderGeometry(.05, .05, .9, 5), col, [.38, 3.9, 0], [0, 0, Math.PI / 2]),
    P(new THREE.ConeGeometry(.22, .22, 8), col, [.8, 3.82, 0]), P(new THREE.SphereGeometry(.13, 8, 6), '#fff4c2', [.8, 3.68, 0]), P(new THREE.CylinderGeometry(.16, .2, .25, 6), '#7a7a7a', [0, .12, 0])]);
  const bushGeo = ([P(new THREE.IcosahedronGeometry(.6, 1), '#4f8f3e', [0, .55, 0], [0, 0, 0], [1.2, .9, 1]), ...[[.35, .9, .2], [-.3, .85, -.25], [.05, 1.05, -.1], [-.2, .7, .4], [.4, .6, -.3]].map(([x, y, z]) => P(new THREE.IcosahedronGeometry(.2, 0), '#e0328c', [x, y, z]))]);
  const gumGeo = ([P(new THREE.CylinderGeometry(.16, .28, 5.4, 6), '#e9e1d2', [0, 2.7, 0]), P(new THREE.CylinderGeometry(.09, .13, 2.2, 5), '#e9e1d2', [.6, 4.6, 0], [0, 0, -.6]),
    ...[[0, 6, 0, 1.5], [1.3, 5.5, .4, 1.1], [-.9, 5.7, -.5, 1.2]].map(([a, b, c, r]) => P(new THREE.IcosahedronGeometry(r, 1), '#7a9a6a', [a, b, c]))]);
  const solidMat = toonVC(); place(lampGeo('#b3261e'), lampVN, solidMat); place(lampGeo('#e07b26'), lampAU, solidMat); place(bushGeo, bushes, solidMat); place(gumGeo, gums, solidMat);
  // (#34 Concept D, owner plan 30 Oct AEDT) paddy dikes (bờ ruộng): low earth paths along the rice terraces' steps (every 9 m)
  // and across them, with shallow water glinting in each field; children walk along them (no solid, nothing to climb)
  const dikes = [], pools = [], R = (PADDIES.r || 16) - 1.5, inside = (x, z) => Math.hypot(x - PADDIES.x, z - PADDIES.z) < R;
  for (let k = -1; k <= 1; k++) { const z = PADDIES.z + k * 9, half = Math.sqrt(Math.max(0, R * R - (z - PADDIES.z) ** 2)); if (half > 2) dikes.push(P(new THREE.BoxGeometry(half * 2, .3, .7), '#a8834f', [PADDIES.x, Math.max(heightAt(PADDIES.x, z - .5), heightAt(PADDIES.x, z + .5)) + .1, z])); }
  for (const zc of [-13.5, -4.5, 4.5, 13.5].map(o => PADDIES.z + o)) for (const x of [-8, 0, 8].map(o => PADDIES.x + o)) if (inside(x, zc - 4) && inside(x, zc + 4)) dikes.push(P(new THREE.BoxGeometry(.6, .26, 8.3), '#a8834f', [x, heightAt(x, zc) + .1, zc]));
  for (let zc = PADDIES.z - 13.5; zc < PADDIES.z + 14; zc += 9) for (const xc of [-12, -4, 4, 12]) { const x = PADDIES.x + xc; if (!inside(x - 3.4, zc) || !inside(x + 3.4, zc) || !inside(x, zc - 3.8) || !inside(x, zc + 3.8)) continue; pools.push(P(new THREE.PlaneGeometry(7.2, 8.1), '#7cc3d6', [x, heightAt(x, zc) + .05, zc], [-Math.PI / 2, 0, 0])); }
  if (dikes.length) { const m = new THREE.Mesh(merge(dikes), toonVC()); m.receiveShadow = true; m.userData.noSolid = true; scene.add(m); }
  if (pools.length) { const m = new THREE.Mesh(merge(pools), toonVC({ transparent: true, opacity: .55, depthWrite: false })); m.userData.noSolid = true; scene.add(m); }
  // (#34 Concept D) a park bench with a green bin beside it along the Australian main roads, facing the road
  const benchParts = [P(new THREE.BoxGeometry(1.5, .08, .45), '#8a5a34', [0, .45, 0]), P(new THREE.BoxGeometry(1.5, .4, .07), '#8a5a34', [0, .72, -.22], [-.15, 0, 0]),
    ...[[-.65, -.15], [.65, -.15], [-.65, .15], [.65, .15]].map(([x, z]) => P(new THREE.BoxGeometry(.07, .45, .07), '#3d3d3d', [x, .22, z])),
    P(new THREE.CylinderGeometry(.24, .2, .75, 10), '#2f7d4a', [1.15, .38, 0]), P(new THREE.CylinderGeometry(.26, .26, .08, 10), '#256a3c', [1.15, .79, 0])];
  const seats = benches.map(([x, y, z, yaw]) => benchParts.map(p => { const g = p.g.clone(); g.rotateY(yaw); g.translate(x, y, z); return { g, color: p.color }; })).flat();
  if (seats.length) { const m = new THREE.Mesh(merge(seats), toonVC()); m.castShadow = true; m.userData.noSolid = true; scene.add(m); }
  // (#34 Concept D) round basket boats (thúng chai) pulled up on Vũng Tàu's beach and floating just off it
  const boats = [], boatParts = [P(new THREE.SphereGeometry(.85, 14, 7, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), '#7a5530', [0, .55, 0]), P(new THREE.TorusGeometry(.85, .06, 6, 18), '#4a3218', [0, .55, 0], [Math.PI / 2, 0, 0]),
    P(new THREE.CylinderGeometry(.03, .03, 1.6, 5), '#9a7448', [.3, .65, .1], [0, 0, 1.1]), P(new THREE.BoxGeometry(.25, .04, .12), '#9a7448', [.98, .95, .1], [0, 0, 1.1])];
  for (const [x, z] of [[186, 187], [190, 189], [204, 189], [192, 199], [200, 201]]) { const h = heightAt(x, z), dry = h > WATER + .05;
    if (dry && h > WATER + 1.6 || !free(x, z, 1.2) || !plotFree(x, z, 1)) continue;
    const y = dry ? h - .5 : WATER - .45, yaw = (x * 7 + z) % 6.3; boats.push(...boatParts.map(p => { const g = p.g.clone(); g.rotateY(yaw); g.translate(x, y, z); return { g, color: p.color }; }));
    if (dry) world.colliders.push({ x, z, r: .9 }); }
  if (boats.length) { const m = new THREE.Mesh(merge(boats), toonVC()); m.castShadow = true; m.userData.noSolid = true; scene.add(m); }
  // only roads near a player show their flowers
  let t0 = 0; world.updaters.push(dt => { if ((t0 -= dt) > 0) return; t0 = .5;
    for (const g of groups) { const S = g.meshes[0].boundingSphere, on = G.heroes.some(h => Math.hypot(h.pos.x - S.center.x, h.pos.z - S.center.z) < S.radius + 70); g.meshes.forEach(M => M.visible = on); } });
  return { count: groups.reduce((a, g) => a + g.spots.length, 0), lamps: lampVN.length + lampAU.length, bushes: bushes.length, gums: gums.length, dikes: dikes.length, pools: pools.length, benches: benches.length, boats: boats.length / 4 };
}

// the welcome sign on a gate: big words that follow the language
function gateSign(text, w, h, bg = '#c62828', fg = '#ffe27a') {
  const c = document.createElement('canvas'); c.width = 768; c.height = Math.round(768 * h / w); const g = c.getContext('2d');
  const draw = () => {
    const s = typeof text === 'function' ? text() : Array.isArray(text) ? T(text[0], text[1]) : text;
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(10, 10, c.width - 20, c.height - 20);
    let size = c.height * .5; g.font = `bold ${size}px Fredoka, "Baloo 2", sans-serif`;
    while (g.measureText(s).width > c.width - 60 && size > 12) { size -= 2; g.font = `bold ${size}px Fredoka, "Baloo 2", sans-serif`; }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, c.width / 2, c.height / 2 + 3);
  };
  draw();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (typeof text !== 'string') onLang(() => { draw(); t.needsUpdate = true; });
  const m = new THREE.MeshBasicMaterial({ map: t }), grp = new THREE.Group();
  const a = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), b = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); b.rotation.y = Math.PI; a.position.z = .13; b.position.z = -.13;
  a.userData.camOccluder = b.userData.camOccluder = true;
  grp.add(a, b); return grp;
}

// A golden cổng chào: two round golden pillars with lotus tops, a curved golden roof and a red sign.
export function goldenGate(scene, world, x, z, rot, text, span = 8) {
  const gold = '#f2c230', deep = '#d49a12', red = '#c62828', hs = span / 2, H = 6;
  const parts = [];
  for (const s of [-1, 1]) {
    parts.push(P(new THREE.CylinderGeometry(.75, .9, .6, 12), '#b9a27a', [s * hs, .3, 0]));
    parts.push(P(new THREE.CylinderGeometry(.48, .55, H, 14), gold, [s * hs, H / 2 + .5, 0]));
    for (let k = 0; k < 3; k++) parts.push(P(new THREE.TorusGeometry(.55, .1, 6, 16), deep, [s * hs, 1.5 + k * 1.6, 0], [Math.PI / 2, 0, 0]));
    parts.push(P(new THREE.SphereGeometry(.7, 12, 8), gold, [s * hs, H + 1.3, 0], [0, 0, 0], [1, .8, 1]));
    parts.push(P(new THREE.ConeGeometry(.35, .9, 10), deep, [s * hs, H + 2.1, 0]));
  }
  parts.push(P(new THREE.BoxGeometry(span + 1.6, .55, 1.3), gold, [0, H + .3, 0]));
  parts.push(P(new THREE.BoxGeometry(span + 2.6, .35, 1.9), deep, [0, H + .85, 0]));
  // the roof curls up at both ends, like a temple roof
  for (const s of [-1, 1]) parts.push(P(new THREE.ConeGeometry(.35, 1.4, 6), gold, [s * (hs + 1.4), H + 1.3, 0], [0, 0, s * -.9]));
  parts.push(P(new THREE.BoxGeometry(span * .55, .5, .9), red, [0, H + 1.35, 0]), P(new THREE.SphereGeometry(.5, 10, 8), '#ff5a3a', [0, H + 1.85, 0]));
  const m = new THREE.Mesh(merge(parts), toonVC()); m.position.set(x, heightAt(x, z) - .1, z); m.rotation.y = rot; m.castShadow = true; scene.add(m); outline(m, .025, '#6a4a10');
  const sg = gateSign(text, span - .6, 1.5, red, '#ffe27a'); sg.position.set(0, H - .7, 0); m.add(sg);
  // pillars are solid; you walk between them
  for (const s of [-1, 1]) world.colliders.push({ x: x + Math.cos(rot) * s * hs, z: z - Math.sin(rot) * s * hs, r: .9 });
  return m;
}

// ---------- a gate in the style of each place (the road passes between the two posts, 7.5 m apart) ----------
const B3 = (w, h, d) => new THREE.BoxGeometry(w, h, d), C3 = (r1, r2, h, n = 12) => new THREE.CylinderGeometry(r1, r2, h, n);
const roofCone = (w, h, d, color, y, z = 0) => P(new THREE.ConeGeometry(1, 1, 4), color, [0, y, z], [0, Math.PI / 4, 0], [w * .72, h, d * .72]);
const halfRing = (r, tube, color, y, segs = 24) => P(new THREE.TorusGeometry(r, tube, 8, segs, Math.PI), color, [0, y, 0]);
const STYLES = {
  // Hà Nội: an old city gate (ô quan), a thick wall with an arch and a little pavilion on top
  ohquan: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(B3(2.6, 5.4, 3), '#b9ab8e', [s * (hs + 1.1), 2.7, 0]), P(B3(2.8, .4, 3.2), '#9a8c70', [s * (hs + 1.1), .2, 0])]),
    P(B3(2 * hs + 5, 1.8, 3), '#b9ab8e', [0, 6.3, 0]), halfRing(hs, .35, '#a89a7c', 5.2),
    P(B3(4.6, 1.6, 2.4), '#9a3a2a', [0, 7.9, 0]), roofCone(6.4, 1.5, 3.6, '#6a4a2a', 9.3), roofCone(7.4, .7, 4.2, '#7a5634', 8.5),
    ...[-1, 1].map(s => P(new THREE.ConeGeometry(.25, 1, 6), '#6a4a2a', [s * 3.6, 9, 0], [0, 0, s * -.9]))
  ], sign: { y: 6.3, w: 5.4, h: 1.2, bg: '#a8302a', fg: '#ffe27a' }, posts: hs + 1.1, postR: 1.5 }),
  // Bắc Ninh: a village gate of old brick with a curved tiled roof
  kinhbac: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(B3(1.2, 5, 1.2), '#b45a3a', [s * hs, 2.5, 0]), P(B3(1.5, .3, 1.5), '#8a3a2a', [s * hs, 5.1, 0]), P(new THREE.SphereGeometry(.45, 10, 8), '#e8c86a', [s * hs, 5.6, 0])]),
    P(B3(2 * hs + 1.6, .6, 1.4), '#7a3a2a', [0, 5.3, 0]), roofCone(2 * hs + 3.4, 1.6, 3, '#8a4a2a', 6.5),
    ...[-1, 1].map(s => P(new THREE.ConeGeometry(.3, 1.2, 6), '#8a4a2a', [s * (hs + 2.2), 6.3, 0], [0, 0, s * -.9]))
  ], sign: { y: 4.4, w: 6, h: 1.1, bg: '#7a2a1a', fg: '#ffe27a' }, posts: hs }),
  // Hồ Chí Minh City: two white posts and a bright blue steel arch
  saigon: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(B3(.9, 6.2, .9), '#f4f4f0', [s * hs, 3.1, 0]), P(B3(1, .3, 1), '#3a78c8', [s * hs, 2, 0]), P(B3(1, .3, 1), '#3a78c8', [s * hs, 4, 0])]),
    halfRing(hs, .28, '#3a78c8', 6), halfRing(hs - .7, .12, '#ffd23f', 6)
  ], sign: { y: 5.3, w: 6.4, h: 1.1, bg: '#ffffff', fg: '#1f4f9a' }, posts: hs }),
  // (round T3) Vũng Tàu: white posts striped sea blue, a wave-blue arch and a little white sail on top
  seaside: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(B3(.8, 5.8, .8), '#ffffff', [s * hs, 2.9, 0]), P(B3(.9, .35, .9), '#2f9ad8', [s * hs, 1.4, 0]), P(B3(.9, .35, .9), '#2f9ad8', [s * hs, 3.2, 0]), P(B3(1.1, .3, 1.1), '#f2d27a', [s * hs, 5.9, 0])]),
    halfRing(hs, .26, '#2f9ad8', 5.8), P(new THREE.ConeGeometry(.9, 1.8, 3), '#ffffff', [0, 5.8 + hs + .7, 0], [0, 0, 0], [.4, 1, 1])
  ], sign: { y: 4.9, w: 6.4, h: 1.1, bg: '#ffffff', fg: '#1f6f9a' }, posts: hs }),
  // Sydney: a little steel coat-hanger arch between two stone pylons
  coathanger: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(B3(1.6, 3.6, 1.6), '#cfc6b0', [s * (hs + .4), 1.8, 0]), P(B3(1.9, .35, 1.9), '#b8ae96', [s * (hs + .4), 3.8, 0])]),
    halfRing(hs + .4, .3, '#8a949a', 2.4), halfRing(hs - .3, .14, '#8a949a', 2.4),
    ...[-2.4, -1.2, 0, 1.2, 2.4].map(x => P(B3(.08, 6 - Math.abs(x) * .55, .08), '#8a949a', [x, 2.4 + (6 - Math.abs(x) * .55) / 2 - .4, 0]))
  ], sign: { y: 3.4, w: 5.2, h: .9, bg: '#2f5f8a', fg: '#ffffff' }, posts: hs + .4, postR: 1.1 }),
  // Melbourne: green cast-iron posts and lacework arch
  iron: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(C3(.2, .26, 5.8), '#2f5a3a', [s * hs, 2.9, 0]), P(new THREE.SphereGeometry(.3, 10, 8), '#c9a24a', [s * hs, 6, 0])]),
    halfRing(hs, .1, '#2f5a3a', 5.2), halfRing(hs - .5, .07, '#2f5a3a', 5.2),
    ...Array.from({ length: 9 }, (_, k) => { const a = k / 8 * Math.PI; return P(new THREE.TorusGeometry(.22, .04, 4, 10), '#2f5a3a', [Math.cos(a) * (hs - .25), 5.2 + Math.sin(a) * (hs - .25), 0]); })
  ], sign: { y: 4.6, w: 5.4, h: .9, bg: '#f4ead2', fg: '#2f5a3a' }, posts: hs }),
  // Brisbane: a white Queenslander gate with lattice, a tin roof and a koala
  queenslander: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(B3(.5, 4.8, .5), '#f4f1e8', [s * hs, 2.4, 0]), ...[0, 1, 2].map(k => P(B3(.06, 1.2, .06), '#f4f1e8', [s * (hs + .4 + k * .25), 1.2, 0]))]),
    P(B3(2 * hs + 1, .4, .8), '#f4f1e8', [0, 4.8, 0]), roofCone(2 * hs + 2, 1, 2, '#9aa6ac', 5.5),
    P(new THREE.SphereGeometry(.42, 10, 8), '#9a9a9e', [hs - .2, 5.4, .2]), P(new THREE.SphereGeometry(.3, 10, 8), '#9a9a9e', [hs - .2, 5.95, .3]), P(new THREE.SphereGeometry(.12, 8, 6), '#3a3a3a', [hs - .2, 5.95, .58])
  ], sign: { y: 4.1, w: 5.4, h: .9, bg: '#2f7a4a', fg: '#ffffff' }, posts: hs }),
  // Aussie Corner: a rustic gate of logs with a hanging sign
  timber: hs => ({ parts: [
    ...[-1, 1].map(s => P(C3(.42, .48, 5.6, 9), '#8a5a3b', [s * hs, 2.8, 0])),
    P(C3(.36, .36, 2 * hs + 2, 9), '#7a4a2a', [0, 5.4, 0], [0, 0, Math.PI / 2]),
    ...[-1.2, 1.2].map(x => P(B3(.05, .8, .05), '#5a3a1a', [x, 4.85, 0]))
  ], sign: { y: 4.1, w: 4.4, h: 1, bg: '#7a4a2a', fg: '#ffd23f' }, posts: hs }),
  // China Town: a paifang, red pillars and green tiled roofs
  paifang: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(C3(.34, .4, 6.2), '#c0392b', [s * hs, 3.1, 0]), P(C3(.26, .3, 4.4), '#c0392b', [s * (hs + 1.8), 2.2, 0]), roofCone(2.2, .9, 1.6, '#2f7a4a', 4.8, 0), P(B3(.6, .5, .6), '#7a6a5a', [s * hs, .25, 0])].map((p, k) => k === 2 ? P(new THREE.ConeGeometry(1, 1, 4), '#2f7a4a', [s * (hs + 1.8), 4.8, 0], [0, Math.PI / 4, 0], [1.4, .8, 1.1]) : p)),
    P(B3(2 * hs + 4.4, .5, .6), '#c0392b', [0, 5.6, 0]), P(B3(2 * hs + 1.4, .35, .5), '#e8b830', [0, 4.6, 0]),
    roofCone(2 * hs + 4, 1.4, 2.4, '#2f7a4a', 6.6), ...[-1, 1].map(s => P(new THREE.ConeGeometry(.3, 1, 6), '#2f7a4a', [s * (hs + 2.6), 6.4, 0], [0, 0, s * -1]))
  ], sign: { y: 5.1, w: 3.6, h: .8, bg: '#e8b830', fg: '#a8202a' }, posts: hs }),
  // India Village: a sandstone arch with little domed pavilions (chhatris)
  mughal: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(B3(1.8, 6.4, 2), '#d9a066', [s * (hs + .9), 3.2, 0]), P(C3(.5, .5, 1, 8), '#e8c08a', [s * (hs + .9), 7.6, 0]), P(new THREE.SphereGeometry(.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#f4e8d0', [s * (hs + .9), 8.1, 0])]),
    halfRing(hs, .55, '#d9a066', 4.2), P(B3(2 * hs + 3.6, 1.4, 2), '#d9a066', [0, 6.9, 0]),
    P(new THREE.SphereGeometry(1.1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), '#f4e8d0', [0, 7.6, 0]), P(new THREE.ConeGeometry(.12, .7, 6), '#c9a24a', [0, 8.9, 0])
  ], sign: { y: 6.9, w: 6, h: 1, bg: '#ff9f43', fg: '#ffffff' }, posts: hs + .9, postR: 1.2 }),
  // Sunny Farm: a wooden farm gate with sunflowers
  farm: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(B3(.5, 4.4, .5), '#8a5a3b', [s * hs, 2.2, 0]), P(C3(.04, .04, 1.2, 5), '#4f9a4a', [s * (hs + .7), .6, .3]), P(new THREE.SphereGeometry(.3, 10, 8), '#ffd23f', [s * (hs + .7), 1.3, .3], [0, 0, 0], [1, 1, .4])]),
    P(B3(2 * hs + 1.2, .5, .5), '#8a5a3b', [0, 4.4, 0]), P(B3(2 * hs + 1.6, .2, .7), '#6a4a2a', [0, 4.75, 0])
  ], sign: { y: 3.6, w: 5, h: 1, bg: '#f6ead0', fg: '#7a4a2a' }, posts: hs }),
  // Two Homes Street: a Bà Rịa brick post and an Aussie timber post, one each side
  twohomes: hs => ({ parts: [
    P(B3(1.1, 5.6, 1.1), '#c0553a', [-hs, 2.8, 0]), P(new THREE.ConeGeometry(.8, .9, 4), '#f2c230', [-hs, 6.05, 0], [0, Math.PI / 4, 0]),
    P(B3(.8, 5.6, .8), '#f4f1e8', [hs, 2.8, 0]), P(B3(1.1, .25, 1.1), '#2f7a4a', [hs, 5.7, 0]),
    P(B3(hs, .45, .8), '#c0553a', [-hs / 2, 5.3, 0]), P(B3(hs, .45, .8), '#f4f1e8', [hs / 2, 5.3, 0])
  ], sign: { y: 4.5, w: 6.2, h: 1, bg: '#ffffff', fg: '#4a2a78' }, posts: hs })
};
export const GATE_STYLE = { hanoi: 'ohquan', bacninh: 'kinhbac', danang: 'golden', saigon: 'saigon', vungtau: 'seaside', sydney: 'coathanger', melbourne: 'iron', brisbane: 'queenslander', aussie: 'timber', china: 'paifang', india: 'mughal', home: 'farm', town: 'twohomes' };
// A welcome sign beside the road into a place (instead of a gate across it): two posts, a wide board in the place's gate
// colours with "Welcome to …" in both languages, a little roof and a box of flowers. It stands beside the road, 3.2 m
// from its edge to the board's middle and 4 m before the place, turned so the words face whoever comes in along the road.
export function welcomeSign(scene, world, x, z, rot, text, style, hw) {
  const make = STYLES[style], look = make ? make(3).sign : { bg: '#c62828', fg: '#ffe27a' };
  // (on the other side of the road where the first would cover a spare garden plot: a covered plot is dropped, js/world.ts)
  const W2 = 2.5, onPlot = (px, pz) => PLOTS.some(P => { const B = plotBox(P); return px > B.x0 - W2 - .5 && px < B.x1 + W2 + .5 && pz > B.z0 - 1 && pz < B.z1 + 1 || px > B.x0 - 1 && px < B.x1 + 1 && pz > B.z0 - W2 - .5 && pz < B.z1 + W2 + .5; });
  const side = onPlot(x - Math.cos(rot) * (hw + 3.2), z + Math.sin(rot) * (hw + 3.2)) && !onPlot(x + Math.cos(rot) * (hw + 3.2), z - Math.sin(rot) * (hw + 3.2)) ? -1 : 1;
  const sx = x - side * Math.cos(rot) * (hw + 3.2), sz = z + side * Math.sin(rot) * (hw + 3.2), y = heightAt(sx, sz);
  const parts = [P(new THREE.BoxGeometry(.28, 4.4, .28), '#7a5232', [-W2 - .1, 2.2, 0]), P(new THREE.BoxGeometry(.28, 4.4, .28), '#7a5232', [W2 + .1, 2.2, 0]),
    P(new THREE.BoxGeometry(W2 * 2 + .9, .2, .7), '#9a3b2a', [0, 4.45, 0]), P(new THREE.BoxGeometry(W2 * 2 + 1.1, .12, .9), '#6e2a1e', [0, 4.6, 0]),
    ...[-1, 1].map(s => P(new THREE.SphereGeometry(.24, 10, 8), '#ffd23f', [s * (W2 + .1), 4.85, 0])),
    P(new THREE.BoxGeometry(W2 * 2, .4, .6), '#8a5a34', [0, .22, .55]), ...[-2, -1.2, -.4, .4, 1.2, 2].map((o, k) => P(new THREE.SphereGeometry(.26, 8, 6), ['#ff5fa2', '#ffd23f', '#ff8a3d', '#c77dff', '#ff5fa2', '#ffd23f'][k], [o, .55, .55]))];
  const m = new THREE.Mesh(merge(parts), toonVC()); m.position.set(sx, y, sz); m.rotation.y = rot; m.castShadow = true; scene.add(m); outline(m, .02, '#4a3a2a');
  const sg = gateSign(text, W2 * 2, 1.9, look.bg, look.fg); sg.position.set(0, 3.15, 0); m.add(sg);
  for (const s of [-1, 1]) world.colliders.push({ x: sx + Math.cos(rot) * s * (W2 + .1), z: sz - Math.sin(rot) * s * (W2 + .1), r: .35 });
  return m;
}
export function localGate(scene, world, x, z, rot, text, style, span = 7.5) {
  const make = STYLES[style]; if (!make) return goldenGate(scene, world, x, z, rot, text, span);
  const hs = span / 2, g = make(hs);
  const m = new THREE.Mesh(merge(g.parts), toonVC()); m.position.set(x, heightAt(x, z) - .1, z); m.rotation.y = rot; m.castShadow = true; scene.add(m); outline(m, .022, '#4a3a2a');
  const sg = gateSign(text, g.sign.w, g.sign.h, g.sign.bg, g.sign.fg); sg.position.set(0, g.sign.y, 0); m.add(sg);
  for (const s of [-1, 1]) world.colliders.push({ x: x + Math.cos(rot) * s * g.posts, z: z - Math.sin(rot) * s * g.posts, r: g.postR || .8 });
  return m;
}

export function createRoads(G) {
  const { scene, world } = G;
  const mats = { asphalt: new THREE.MeshToonMaterial({ map: roadTexture('asphalt'), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), dirt: new THREE.MeshToonMaterial({ map: roadTexture('dirt'), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    footpath: new THREE.MeshToonMaterial({ map: roadTexture('footpath'), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }) };
  // the Dragon Bridge's deck first, so the road is laid on it rather than down in the river
  { const B = DRAGON; world.platforms.push({ ...bridgeBox(B, B.a0, B.a1, -B.w / 2, B.w / 2), y: B.h + .1, bridge: B.id, apron: bridgeBox(B, B.a0 - 1.2, B.a1 + 1.2, -B.w / 2, B.w / 2) }); }   // (Round U: an apron like every bridge, js/world.js)
  buildRoads(G, mats);
  // ---------- Đà Nẵng's Dragon Bridge (Cầu Rồng): a golden dragon arching along the road ----------
  // (round T: its model is drawn along the x axis, head at the far end; a bridge along z turns it, its mouth and its spray)
  {
    const B = DRAGON, len = B.a1 - B.a0, y = B.h, hw = B.w / 2, gold = '#f2c230';
    const mid = (B.a0 + B.a1) / 2, alongZ = B.axis === 'z', W = (lx, lz) => alongZ ? [B.c - lz, mid + lx] : [mid + lx, B.c + lz]; // (the model's own x, z to the valley's)
    const FWD = alongZ ? [0, 1] : [1, 0], SIDE = alongZ ? [-1, 0] : [0, 1];
    const parts = [P(new THREE.BoxGeometry(len + 2, .5, B.w), '#7d858a', [0, -.25, 0]), P(new THREE.BoxGeometry(len + 2, .08, B.w - 1.6), '#6f747a', [0, .03, 0])];
    for (const s of [-1, 1]) parts.push(P(new THREE.BoxGeometry(len + 2, .8, .12), '#e8e4d8', [0, .4, s * hw]));
    for (const px of [-.25, .25]) parts.push(P(new THREE.CylinderGeometry(.6, .8, 10, 8), '#9a948a', [px * len, -5, 0]));
    // the dragon: one long golden body arching over the road in waves (as on the real Cầu Rồng), thick at the neck
    // and thin at the tail, with scale bands, a row of orange spines, legs with claws where it touches the deck, a
    // proper head (snout, open jaw, horns, whiskers, flame mane) and a finned tail
    const hx = len / 2 + .2, gold2 = '#d9a21e', orange = '#e8761a';
    const bodyY = t => 1.2 + Math.pow(Math.abs(Math.sin(t * Math.PI * 2.5)), .8) * 4.4;
    const pts3 = []; for (let i = 0; i <= 60; i++) { const t = i / 60; pts3.push(new THREE.Vector3(-hx + t * (2 * hx), bodyY(t), Math.sin(t * Math.PI * 5) * .25)); }
    const curve = new THREE.CatmullRomCurve3(pts3), SEG = 220, RAD = 12, frames = curve.computeFrenetFrames(SEG, false);
    { // the body as one swept tube whose radius follows the dragon (thin tail → thick neck)
      const pos = [], idx = [], rOf = t => .22 + .55 * Math.min(1, t / .35) + .1 * Math.sin(t * 60);
      for (let i = 0; i <= SEG; i++) { const t = i / SEG, c = curve.getPointAt(t), N = frames.normals[i], Bn = frames.binormals[i], r = rOf(t);
        for (let j = 0; j < RAD; j++) { const a = j / RAD * Math.PI * 2; pos.push(c.x + r * (Math.cos(a) * N.x + Math.sin(a) * Bn.x), c.y + r * (Math.cos(a) * N.y + Math.sin(a) * Bn.y), c.z + r * (Math.cos(a) * N.z + Math.sin(a) * Bn.z)); } }
      for (let i = 0; i < SEG; i++) for (let j = 0; j < RAD; j++) { const a = i * RAD + j, b2 = i * RAD + (j + 1) % RAD, c2 = a + RAD, d2 = b2 + RAD; idx.push(a, c2, b2, b2, c2, d2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      parts.push(P(g, gold));
      for (let i = 6; i < SEG - 2; i += 7) { const t = i / SEG, c = curve.getPointAt(t), tg = curve.getTangentAt(t), r = rOf(t);
        const ring = new THREE.TorusGeometry(r * 1.02, .05, 4, 12); ring.lookAt(tg); parts.push(P(ring, gold2, [c.x, c.y, c.z]));
        // a spine on top every other band
        if (i % 14 === 6) parts.push(P(new THREE.ConeGeometry(.16 + r * .25, .5 + r * .6, 5), orange, [c.x, c.y + r * .95 + .2, c.z], [0, 0, -Math.atan2(tg.y, tg.x) * .6])); }
    }
    // legs with claws where the body comes down to the deck
    for (const t of [.2, .4, .6, .8]) { const c = curve.getPointAt(t); for (const s of [-1, 1]) { parts.push(P(new THREE.CylinderGeometry(.14, .2, c.y, 6), gold2, [c.x, c.y / 2, s * .55]));
      for (const k of [-1, 0, 1]) parts.push(P(new THREE.ConeGeometry(.07, .35, 4), '#f6e7b8', [c.x + .2 + k * .05, .1, s * .55 + k * .14], [0, 0, -Math.PI / 2])); } }
    { // the head, at the east end looking out to sea
      const H = curve.getPointAt(1), x0 = H.x, y0 = H.y;
      parts.push(P(new THREE.SphereGeometry(.85, 14, 10), gold, [x0 + .5, y0 + .1, 0], [0, 0, 0], [1.3, .85, .9]));               // skull
      parts.push(P(new THREE.BoxGeometry(1.5, .45, .8), gold, [x0 + 1.6, y0 + .05, 0], [0, 0, -.12]));                            // snout
      parts.push(P(new THREE.BoxGeometry(1.3, .22, .7), gold2, [x0 + 1.5, y0 - .45, 0], [0, 0, .35]));                            // open jaw
      parts.push(P(new THREE.BoxGeometry(.9, .08, .5), '#c0392b', [x0 + 1.45, y0 - .2, 0], [0, 0, .12]));                         // tongue
      for (const s of [-1, 1]) {
        parts.push(P(new THREE.SphereGeometry(.2, 8, 6), '#ffffff', [x0 + .95, y0 + .45, s * .38]), P(new THREE.SphereGeometry(.11, 8, 6), '#2b2238', [x0 + 1.07, y0 + .48, s * .44])); // eyes
        parts.push(P(new THREE.ConeGeometry(.12, 1.5, 6), '#f6e7b8', [x0 - .2, y0 + 1.05, s * .35], [0, 0, .9]));                 // horns swept back
        parts.push(P(new THREE.CylinderGeometry(.03, .015, 1.6, 4), orange, [x0 + 2.3, y0 - .25, s * .45], [s * .5, 0, 1.2]));    // whiskers
        parts.push(P(new THREE.SphereGeometry(.07, 6, 4), '#2b2238', [x0 + 2.33, y0 + .2, s * .16]));                             // nostrils
        for (let k = 0; k < 5; k++) parts.push(P(new THREE.ConeGeometry(.14, .9, 5), k % 2 ? orange : '#ffb020', [x0 - .4 - k * .12, y0 + .2 + Math.sin(k) * .3, s * (.55 + k * .05)], [s * -1.1, 0, 1.6 + k * .12])); // flame mane
      }
      for (let k = 0; k < 4; k++) parts.push(P(new THREE.ConeGeometry(.06, .22, 4), '#ffffff', [x0 + 1.2 + k * .2, y0 - .2, (k % 2 ? 1 : -1) * .26], [Math.PI, 0, 0])); // teeth
    }
    { const T0 = curve.getPointAt(0); parts.push(P(new THREE.ConeGeometry(.6, 1.4, 3), orange, [T0.x - .6, T0.y + .2, 0], [0, 0, Math.PI / 2], [1, 1, .3])); } // tail fin
    const br = new THREE.Mesh(merge(parts), toonVC()); br.position.set(alongZ ? B.c : mid, y, alongZ ? mid : B.c); if (alongZ) br.rotation.y = -Math.PI / 2; br.castShadow = true; scene.add(br); outline(br, .02, '#6a4a10');
    // fire, then water, from the dragon's mouth: every 40 s (as the real bridge does on weekend nights), or when tapped
    const mouth = new THREE.Vector3(...((m => [m[0], y + curve.getPointAt(1).y - .2, m[1]])(W(curve.getPointAt(1).x + 2.4, 0)))), NP = 70;
    const spray = new THREE.InstancedMesh(new THREE.SphereGeometry(.35, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: .85, depthWrite: false }), NP);
    spray.frustumCulled = false; spray.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NP * 3), 3); scene.add(spray);
    const pp = Array.from({ length: NP }, () => ({ life: 0, x: 0, y: 0, z: 0, vl: 0, vy: 0, vs: 0, fire: true })), m4 = new THREE.Matrix4(), col = new THREE.Color();
    let showT = -1, emitAcc = 0, idle = 25;
    const start = (at = 0) => { if (showT < 0) showT = at; };
    G.dragonShow = start;
    world.updaters.push((dt, t) => {
      if (showT < 0) { idle -= dt; if (idle <= 0) { idle = 40; start(); } }
      const near = G.heroes.some(h => Math.hypot(h.pos.x - mouth.x, h.pos.z - mouth.z) < 90);
      if (showT >= 0) {
        showT += dt; const fire = showT < 6, water = showT > 7.5 && showT < 13.5;
        if ((fire || water) && near) { emitAcc += dt * (fire ? 34 : 40);
          while (emitAcc > 1) { emitAcc--; const q = pp.find(o => o.life <= 0); if (!q) break; q.life = fire ? 1.1 : 1.6; q.fire = fire; q.x = mouth.x; q.y = mouth.y; q.z = mouth.z;
            q.vl = (fire ? 11 : 13) + Math.random() * 3; q.vy = fire ? 1 + Math.random() * 1.5 : 5 + Math.random() * 2; q.vs = (Math.random() - .5) * (fire ? 2.5 : 3.5); } }
        if (showT > 0 && showT < dt * 1.5 && near) { SFX.whoosh(); }
        if (showT > 7.5 && showT < 7.5 + dt * 1.5 && near) { SFX.splash(); }
        if (showT > 16) showT = -1;
      }
      let any = false;
      pp.forEach((q, i) => {
        if (q.life > 0) { any = true; q.life -= dt; q.x += (FWD[0] * q.vl + SIDE[0] * q.vs) * dt; q.y += q.vy * dt; q.z += (FWD[1] * q.vl + SIDE[1] * q.vs) * dt; q.vy += (q.fire ? 2 : -9.8) * dt; q.vl *= q.fire ? .97 : .995;
          const k = Math.max(0, q.life / (q.fire ? 1.1 : 1.6)), sc = q.fire ? .6 + (1 - k) * 2.2 : .45 + (1 - k) * .9;
          m4.makeScale(sc, sc, sc).setPosition(q.x, q.y, q.z); col.set(q.fire ? (k > .6 ? '#fff2a0' : k > .3 ? '#ffa020' : '#e0401a') : (k > .5 ? '#e8f8ff' : '#7fd0ff')); }
        else m4.makeScale(0, 0, 0);
        spray.setMatrixAt(i, m4); spray.setColorAt(i, col);
      });
      spray.visible = any; if (any) { spray.instanceMatrix.needsUpdate = true; spray.instanceColor.needsUpdate = true; }
    });
    G.interactables.push({ id: 'dragonshow', ...(([x, z]) => ({ x, z }))(W(len / 2 + 3, hw + 2.5)), r: 3, icon: '🐉', label: () => T('Ask the dragon to breathe fire and water', 'Nhờ rồng phun lửa và nước'), act: () => { start(0); SFX.tap(); } });
    world.boxes.push({ ...bridgeBox(B, B.a0, B.a1, hw - .1, hw + .3), bottom: y }, { ...bridgeBox(B, B.a0, B.a1, -hw - .3, -hw + .1), bottom: y });
    G.dragonBridge = br;
  }

  // ---------- golden welcome gates: one per village or city (Round U, owner 11 Oct: "one gate is enough") ----------
  // It stands across the place's main road where it comes in: a city's main gate (the first of its gates in the map),
  // otherwise the first road that names the place. Other roads come in through a plain opening.
  // (the gate stands on the road's end point and faces along the road, so you always drive through it)
  const mainEnd: Record<string, string> = {}; world.gates = [];
  for (const R of ROADS) (R.gates || []).forEach((idRaw, k) => {
    const id = String(idRaw || '');
    if (!id) return; const n = R.pts.length, [x, z] = R.pts[k ? n - 1 : 0], C = CITIES.find(c => c.id === id);
    const isMain = C ? Math.hypot(C.gates[0][0] - x, C.gates[0][1] - z) < 1.5 : !mainEnd[id];
    if (isMain && !mainEnd[id]) mainEnd[id] = R.id + ':' + k;
  });
  for (const R of ROADS) (R.gates || []).forEach((idRaw, k) => {
    const id = String(idRaw || '');
    if (!id || mainEnd[id] !== R.id + ':' + k) return;
    const n = R.pts.length, [x, z] = R.pts[k ? n - 1 : 0], [px, pz] = R.pts[k ? n - 2 : 1];
    // (owner, 31 Oct 2026 AEDT: "change all the gates to a welcome sign for each village, simple but noticeable; the gates
    // hidden and switched on and off in Studio") Studio's "gates" switch, off unless switched on, read when the valley is built
    const gate = featureOn('gates', false), rot = Math.atan2(x - px, z - pz), text = () => T('Welcome to ', 'Chào mừng đến ') + REGION_NAMES[id]();
    world.gates.push({ place: id, road: R.id, x, z, kind: gate ? 'gate' : 'sign' });
    if (gate) localGate(scene, world, x, z, rot, text, GATE_STYLE[id] || 'golden', Math.max(7.5, R.w + 2.3)); // (R7: the opening is the road plus more than 1 m each side)
    else welcomeSign(scene, world, x - (x - px) / Math.hypot(x - px, z - pz) * 4, z - (z - pz) / Math.hypot(x - px, z - pz) * 4, rot, text, GATE_STYLE[id] || 'golden', R.w / 2);
  });
  G.goldenGate = (x, z, r, t, span) => goldenGate(scene, world, x, z, r, t, span);
}

// Henry's road-safety request: explain the existing crossings without changing their roads or artwork.
// Signs stand beside the footpath approaches; the walking strip, doors and existing interactions stay clear.
export function createCrossings(G) {
  const { scene, world } = G, list = [], missing = [];
  const postGeometry = merge([P(new THREE.CylinderGeometry(.07, .07, 2.7, 8), '#6a4a3a', [0, 1.35, 0]), P(new THREE.CylinderGeometry(.18, .23, .12, 8), '#a8a296', [0, .06, 0])]), postMaterial = toonVC();
  const stopBoard = gateSign(['STOP', 'DỪNG'], 1.7, .9, '#d9483a', '#fff8e0'), watchBoard = gateSign(['LOOK · LISTEN', 'NHÌN · NGHE'], 2.4, .65, '#ffd23f', '#4a3a3f');
  // A clear footprint is insufficient: tall warning posts must also clear shop awnings/roofs.
  scene.updateMatrixWorld(true);
  const overheadMeshes=[];scene.traverse(o=>{if(o.isMesh)overheadMeshes.push(o);});
  const headRay=new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(0,1,0),.05,2.75);
  const headroom=(x,z)=>{headRay.ray.origin.set(x,heightAt(x,z)+.1,z);return !headRay.intersectObjects(overheadMeshes,false).some(hit=>{for(let o=hit.object;o;o=o.parent)if(!o.visible)return false;const m=(hit.object as THREE.Mesh).material;const mats=Array.isArray(m)?m:[m];return mats.some((mm): mm is THREE.Material => !!mm && mm.visible!==false && (mm.opacity??1)>.95);});};
  // Bubble width3.2 plus board width2.4 requires2.8m between their centres.
  const free = (x, z) => [[0, 0], [-1.25, 0], [1.25, 0], [0, -.25], [0, .25]].every(([dx, dz]) => G.goodSpot(x + dx, z + dz))
    && (d => !d.road || d.d > d.road.w / 2 + .5)(roadDist(x, z))
    && !((G.homes && G.homes.list) || []).some(h => h.door && Math.hypot(h.door.x - x, h.door.z - z) < 2.2)
    && G.interactables.every(it => !Number.isFinite(it.x) || Math.hypot(it.x - x, it.z - z) > (it.bubble ? 2.9 : 1.8))
    && [-1.25,0,1.25].every(dx=>headroom(x+dx,z));
  for (const [id, place] of [['town', TOWN], ['aussie', AUSSIE]] as const) {
    const crossing = { id, x: place.x - 4, z: place.roadZ, halfRoad: 3.5, signs: [] };
    for (const side of [-1, 1]) {
      let at = null;
      for (const offset of [4.6, 5, 5.4, 5.8, 6.2, 6.6, 7]) {
        for (const dx of [4.2, 4.6, 5, 5.4, 5.8, 6.2, 6.6, 7, 7.4, 7.8, 8.2, -4.2, -4.6, -5, -5.4, -5.8, -6.2, -6.6, -7, -7.4, -7.8, -8.2, 3.8, 3.4, 3, 2.6, 2.2, 1.8, -3.8, -3.4, -3, -2.6, -2.2, -1.8]) { const x = crossing.x + dx * -side, z = crossing.z + offset * side; if (free(x, z)) { at = { x, z }; break; } }
        if (at) break;
      }
      if (!at) { missing.push({ id, side }); continue; }
      const root = new THREE.Group(); root.userData.noSolid = root.userData.noCam = true; root.position.set(at.x, heightAt(at.x, at.z), at.z); root.rotation.y = side < 0 ? 0 : Math.PI;
      const post = new THREE.Mesh(postGeometry, postMaterial); post.castShadow = true; root.add(post);
      const stop = stopBoard.clone(true); stop.position.y = 2.3; root.add(stop);
      const watch = watchBoard.clone(true); watch.position.y = 1.5; root.add(watch); scene.add(root);
      const it = { id: 'crossing_' + id + '_' + (side < 0 ? 'north' : 'south'), x: at.x, z: at.z, r: 2.4, icon: '👣',
        label: () => T('Crossing: stop, look, listen', 'Sang đường: dừng, nhìn, nghe'),
        act: () => { SFX.tap(); return G.dialog(T('Stop, look and listen', 'Dừng, nhìn và nghe'), [['Stop at the kerb. Look and listen both ways. Cross with a grown-up when the road is clear. Keep looking as you cross.', 'Dừng ở mép đường. Nhìn và lắng nghe cả hai phía. Đi cùng người lớn khi đường đã vắng xe. Tiếp tục quan sát khi sang đường.']]); } };
      G.interactables.push(it); root.traverse((o: THREE.Object3D) => { if ((o as THREE.Mesh).isMesh) { o.userData.noSolid = o.userData.noCam = true; o.userData.it = it; (G.tapTargets = G.tapTargets || []).push(o); } });
      world.colliders.push({ x: at.x, z: at.z, r: .16 }); crossing.signs.push({ x: at.x, z: at.z, side, interaction: it.id });
    }
    list.push(crossing);
  }
  return (G.crossings = { list, missing });
}
