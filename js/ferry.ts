// Free ferries: a little blue ferry boat that goes round Mirror Lake stopping at four piers, two bamboo rafts
// that cross the river, and a river raft that runs up and down the river past the towns. On a boat with more
// than two stops the child chooses where to go, and the boat takes them straight there. Walk to the end of a pier and tap "Ride the ferry"; if the boat
// isn't there yet, you wait and hop on when it arrives. Tap "Get off" at any stop.
import { THREE, P, merge, toonVC, outline, sprite } from './gfx.js';
import { T, onLang } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { landmarkAt, BOATS } from './content/map.js';
import { WATER, LAKE, RIVER, BRIDGES, bridgeAt, bridgeDist, roadDist, CITIES, VILLAGE, TOWN, MARKET, CHINA, INDIA, HOME, AUSSIE, heightAt, regionAt, REGION_NAMES } from './world.js';
import { dist2 } from './util.js';

const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), C = (r1, r2, h, s = 10) => new THREE.CylinderGeometry(r1, r2, h, s);

function signTex(lines, w = 512, h = 128, bg = '#2f86c0') {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const draw = () => { g.fillStyle = bg; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 26); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#fff'; g.font = `bold ${h * .4}px Fredoka, "Baloo 2", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(lines(), w / 2, h * .54, w - 30); t.needsUpdate = true; };
  draw(); onLang(draw); return t;
}

function ferryBoat(flag = true) {
  const p = [];
  p.push(P(B(7, 1.1, 3), '#ffffff', [0, .55, 0]), P(B(7.2, .25, 3.2), '#2f86c0', [0, .05, 0]), P(new THREE.CylinderGeometry(1.5, 1.5, 1.1, 16, 1, false, 0, Math.PI), '#ffffff', [3.5, .55, 0], [0, Math.PI / 2, 0]));
  p.push(P(B(7.4, .15, 3.3), '#c98a4a', [0, 1.15, 0])); // deck rail top
  p.push(P(B(2.6, 1.8, 2.4), '#e8f6ff', [-1.8, 2.1, 0]), P(B(3, .25, 2.8), '#ff5a5a', [-1.8, 3.1, 0]));
  [-1, 1].forEach(s => p.push(P(B(.9, .7, .1), '#86cfe8', [-1.8, 2.3, s * 1.21])));
  p.push(P(C(.25, .3, 1.2), '#ffd23f', [-1.8, 3.8, 0]), P(C(.3, .3, .2), '#2b2238', [-1.8, 4.45, 0]));
  for (let i = 0; i < 6; i++) p.push(P(C(.04, .04, .6, 6), '#ffffff', [-.2 + i * .65, 1.45, 1.45]), P(C(.04, .04, .6, 6), '#ffffff', [-.2 + i * .65, 1.45, -1.45]));
  p.push(P(new THREE.TorusGeometry(.32, .1, 8, 16), '#ff5a5a', [1, 1.6, 1.52]));
  const m = new THREE.Mesh(merge(p), toonVC()); m.castShadow = true; outline(m, .03, '#2b3a4f');
  const g = new THREE.Group(); g.add(m);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .65), new THREE.MeshBasicMaterial({ map: signTex(() => T('⛴️ FREE FERRY', '⛴️ PHÀ MIỄN PHÍ')), transparent: true }));
  sign.position.set(-1.8, 2.75, 1.24); g.add(sign); const s2 = sign.clone(); s2.position.z = -1.24; s2.rotation.y = Math.PI; g.add(s2);
  if (flag) { const f = sprite('🚩', .9); f.position.set(-1.8, 5, 0); g.add(f); } // (round T2: the harbour ferry has none, so it passes under the Harbour Bridge)
  g.deck = 1.15; g.seats = [[1.4, .6], [1.4, -.6], [2.6, .5], [2.6, -.5]];
  return g;
}
function bambooRaft() {
  const p = [];
  for (let i = 0; i < 9; i++) p.push(P(C(.2, .2, 5, 8), i % 2 ? '#c9b45a' : '#b8a24a', [0, .25, -1.6 + i * .4], [0, 0, Math.PI / 2]));
  [-1.8, 1.8].forEach(x => p.push(P(B(.2, .15, 3.6), '#8a6a3a', [x, .5, 0])));
  [[-1.6, -1.3], [1.6, -1.3], [-1.6, 1.3], [1.6, 1.3]].forEach(([x, z]) => p.push(P(C(.06, .06, 1.6, 6), '#8a6a3a', [x, 1.3, z])));
  p.push(P(C(.05, .05, 3, 6), '#8a6a3a', [2.3, 1.6, 0], [0, 0, -.5])); // pole
  const m = new THREE.Mesh(merge(p), toonVC()); m.castShadow = true; outline(m, .03, '#4a3a2a');
  // the thatched roof is its own see-through-able piece: while a child rides, it fades so the camera can see them
  const roofMat = toonVC(); roofMat.transparent = true;
  const roof = new THREE.Mesh(merge([P(new THREE.ConeGeometry(2.6, 1, 4), '#d9b86a', [0, 2.5, 0], [0, Math.PI / 4, 0], [1.1, 1, .8])]), roofMat); // (round T2: 0.4 m lower, so it passes under every deck) roof.castShadow = true;
  const g = new THREE.Group(); g.add(m, roof); g.roof = roof;
  const lan = sprite('🏮', .7); lan.position.set(0, 2.2, 0); g.add(lan);
  g.deck = .5; g.seats = [[-.6, .5], [.6, -.5], [-.6, -.6], [.6, .6]];
  return g;
}

export function createFerries(G) {
  const { scene, world } = G;
  const pier = (sx, sz, ex, ez) => { // wooden pier from (sx,sz) on land to (ex,ez) over water; walkable
    // (owner, 18 Oct AEDT: "the boat docks are too far drop off the ground") it starts at the ground's height on the bank
    // and comes down in steps to the water, never below the ground under it, so no pier hangs under a high bank
    const dx = ex - sx, dz = ez - sz, L = Math.hypot(dx, dz), a = Math.atan2(dx, dz), y0 = WATER + .6, parts = [], ux = dx / L, uz = dz / L;
    const ks = []; for (let k = 0; k < L - .45; k += .55) ks.push(k); ks.push(L);
    const ys = []; ks.forEach((k, i) => ys.push(Math.max(y0, i ? ys[i - 1] - .88 : heightAt(sx, sz) - .04, heightAt(sx + ux * k, sz + uz * k) - .04)));   // (steps of at most 0.88 m from the bank's edge: a child steps up 1.2 m; on land its top is 3 cm over the ground, flush with the road it starts on, ROAD-017)
    const y = ys[ys.length - 1];
    ks.forEach((k, i) => { const t = Math.max(.14, ys[i] - (ys[i + 1] ?? ys[i]) + .14); parts.push(P(B(2.6, t, .5), i % 2 ? '#a87a4a' : '#b88a5a', [0, ys[i] - y - t / 2 + .07, k])); });   // (a step is solid down to the next one)
    ks.forEach((k, i) => { if (i % 4 && i < ks.length - 1) return; const h = ys[i] - WATER + 1.7; [-1.2, 1.2].forEach(x => parts.push(P(C(.13, .13, h, 6), '#7a5236', [x, ys[i] - y - h / 2 + .1, k]))); });
    const m = new THREE.Mesh(merge(parts), toonVC()); m.position.set(sx, y, sz); m.rotation.y = a; m.receiveShadow = true; scene.add(m);
    ks.forEach((k, i) => { const px = sx + ux * k, pz = sz + uz * k, q = ys[i] > y + .01 ? .3 : 1.1; // (small squares on the steps, so each holds its own step's height)
      for (const o of q < 1 ? [-.8, 0, .8] : [0]) world.platforms.push({ x0: px + uz * o - q, x1: px + uz * o + q, z0: pz - ux * o - q, z1: pz - ux * o + q, y: ys[i] + .07 }); });
    return { tip: { x: ex, z: ez, y: y + .07 }, land: { x: sx, z: sz }, a }; // (round T2: the land end, for the `boats` check)
  };

  // a boat that drives along a path of points, stopping at some of them
  const ferries = [];
  function makeFerry({ model, path, loop, stops, speed }) {
    model.traverse(o => { o.userData.noCam = true; }); // a moving boat never pushes the camera in (it ended up inside the raft's roof)
    scene.add(model);
      // Start at the first stop's path index, not path[0], so F.at and F.seg are consistent
      const startIdx = stops[0].i;
      const F = { model, path, loop, stops, speed, seg: startIdx, k: 0, dir: 1, wait: 4, at: startIdx, riders: new Set(), waiting: new Set() };
      model.position.set(path[startIdx].x, WATER, path[startIdx].z);
      ferries.push(F); return F;
    }
  const stopAt = F => F.wait > 0 ? F.stops.find(s => s.i === F.at) : null;

  // ---------- Mirror Lake: four piers, one ferry going round ----------
  const R = LAKE.r;
  // (round T: where the piers stand comes from the map; their names stay here)
  const DOCK_NAMES = { north: () => T('North Beach', 'Bãi Bắc'), village: () => T('Lotus Village', 'Làng Sen'), danang: () => T('Đà Nẵng', 'Đà Nẵng'), island: () => T('Home Island', 'Đảo Nhà') };
  const DOCKS = BOATS.find(b => b.id === 'lakeferry').docks.map(d => ({ a: d.a, name: DOCK_NAMES[d.id] || (() => '') }));
  const [reefX, reefZ] = landmarkAt('reef'), REEF_A = Math.atan2(reefZ - LAKE.z, reefX - LAKE.x) * 180 / Math.PI; // keep clear of the coral reef
  const lakePath = [], lakeStops = [];
  for (let a = 100; a < 460; a += 6) {
    const ang = a % 360, near = DOCKS.find(d => Math.abs(d.a - ang) < 3);
    const off = Math.abs(((ang - REEF_A + 540) % 360) - 180);
    const r = off < 28 ? R * (.48 + off / 28 * .2) : R * .68;
    const rad = ang * Math.PI / 180;
    if (near) lakeStops.push({ i: lakePath.length, name: near.name, dock: near });
    lakePath.push({ x: LAKE.x + Math.cos(rad) * r, z: LAKE.z + Math.sin(rad) * r });
  }
  DOCKS.forEach(d => {
    const rad = d.a * Math.PI / 180, cx = Math.cos(rad), cz = Math.sin(rad);
    // the pier starts where the ground is above water
    let rs = R * .7; while (rs < R * 1.1 && heightAt(LAKE.x + cx * rs, LAKE.z + cz * rs) < WATER + .5) rs += .5;
    d.pier = pier(LAKE.x + cx * (rs + 1), LAKE.z + cz * (rs + 1), LAKE.x + cx * R * .72, LAKE.z + cz * R * .72);
  });
  const lakeFerry = makeFerry({ model: ferryBoat(), path: lakePath, loop: true, stops: lakeStops, speed: 6.5 });

  // ---------- the river: two bamboo rafts crossing back and forth ----------
  // Each crossing is picked on the river where it is open water well away from both bridges (a raft under the
  // Dragon Bridge left the camera inside the deck: nothing to see), and as close as possible to a town or village,
  // so each bank's stop is a real place you can find on the map.
  const PLACES = [...CITIES.map(c => ({ x: c.x, z: c.z, name: () => T(c.name[0], c.name[1]) })), { x: VILLAGE.x, z: VILLAGE.z, name: () => T('Lotus Village', 'Làng Sen') },
    { x: (TOWN.x0 + TOWN.x1) / 2, z: TOWN.roadZ, name: () => T('Two Homes Street', 'Phố Hai Quê') }, { x: (MARKET.x0 + MARKET.x1) / 2, z: MARKET.roadZ, name: () => T('Three Regions Market', 'Chợ Ba Miền') },
    { x: CHINA.x, z: CHINA.z, name: () => T('China Town', 'Phố Tàu') }, { x: INDIA.x, z: INDIA.z, name: () => T('India Village', 'Làng Ấn Độ') }, { x: HOME.x, z: HOME.z, name: () => T('Sunny Farm', 'Nông Trại Nắng') }, { x: (AUSSIE.x0 + AUSSIE.x1) / 2, z: AUSSIE.roadZ, name: () => T('Aussie Corner', 'Góc nước Úc') }];
  const nearest = (x, z) => { let b = null, bd = 1e9; for (const p of PLACES) { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; b = p; } } return [b, bd]; };
  const bridgeD = (x, z) => Math.min(...BRIDGES.map(B => bridgeDist(B, x, z)));
  const cands = [];
  for (let i = 1; i < RIVER.length - 1; i++) for (let t = .1; t < .95; t += .1) {
    const [ax, az] = RIVER[i], [bx, bz] = RIVER[i + 1], x = ax + (bx - ax) * t, z = az + (bz - az) * t;
    if (bridgeD(x, z) < 34 || Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 16 || heightAt(x, z) > WATER - .5) continue;
    cands.push({ i, x, z, d: nearest(x, z)[1] });
  }
  cands.sort((a, b) => a.d - b.d);
  const CROSS = (BOATS.find(b => b.id === 'crossing') || { count: 0 }).count; // (round T2: none; every bank has bridges and the raft line)
  const picks = []; if (CROSS) for (const c of cands) { if (picks.every(p => Math.hypot(p.x - c.x, p.z - c.z) > 60)) picks.push(c); if (picks.length === CROSS) break; }
  picks.forEach(({ i, x, z }) => {
    const [x0, z0] = RIVER[i], [x1, z1] = RIVER[i + 1];
    let dx = x1 - x0, dz = z1 - z0; const l = Math.hypot(dx, dz); dx /= l; dz /= l;
    const px = -dz, pz = dx; // across the river
    const bank = s => { let k = 0; while (k < 30 && heightAt(x + px * s * k, z + pz * s * k) < WATER + .5) k += .5; return k; };
    const kA = bank(-1), kB = bank(1);
    const pa = pier(x - px * (kA + 2), z - pz * (kA + 2), x - px * (kA - 1.2), z - pz * (kA - 1.2));
    const pb = pier(x + px * (kB + 2), z + pz * (kB + 2), x + px * (kB - 1.2), z + pz * (kB - 1.2));
    const ends = [{ x: x - px * (kA - 2.6), z: z - pz * (kA - 2.6) }, { x: x + px * (kB - 2.6), z: z + pz * (kB - 2.6) }];
    const path = []; for (let k = 0; k <= 10; k++) path.push({ x: ends[0].x + (ends[1].x - ends[0].x) * k / 10, z: ends[0].z + (ends[1].z - ends[0].z) * k / 10 });
    const side = s => Math.abs(px) > Math.abs(pz) ? (px * s > 0 ? T('east bank', 'bờ Đông') : T('west bank', 'bờ Tây')) : (pz * s > 0 ? T('south bank', 'bờ Nam') : T('north bank', 'bờ Bắc'));
    const placeOf = (bx, bz) => { const [p, d] = nearest(bx, bz); if (p && d < 90) return p.name; const rg = REGION_NAMES[regionAt(bx, bz)]; return rg || (() => ''); };
    const pA = placeOf(x - px * (kA + 10), z - pz * (kA + 10)), pB = placeOf(x + px * (kB + 10), z + pz * (kB + 10));
    const names = [() => pA() + ' · ' + side(-1), () => pB() + ' · ' + side(1)];
    makeFerry({ model: bambooRaft(), path, loop: false, speed: 3.2, stops: [{ i: 0, name: names[0], dock: { pier: pa } }, { i: path.length - 1, name: names[1], dock: { pier: pb } }] });
  });

  // ---------- the river raft line: up and down the river, stopping by the towns (passes under both bridges) ----------
  {
    const path = []; for (let i = 1; i < RIVER.length - 1; i++) { const [ax, az] = RIVER[i], [bx, bz] = RIVER[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / 4); for (let k = 0; k < n; k++) path.push({ x: ax + (bx - ax) * k / n, z: az + (bz - az) * k / n }); }
    const wet = path.filter(p => heightAt(p.x, p.z) < WATER - .6); path.length = 0; path.push(...wet);
    const under = (x, z) => !!bridgeAt(x, z, 18, 18);
    const stops = [];
    const byRiver = PLACES.map(pl => ({ pl, d: Math.min(...path.map(p => Math.hypot(p.x - pl.x, p.z - pl.z))) })).sort((a, b) => a.d - b.d).map(o => o.pl); // the towns nearest the river first
    for (const pl of byRiver) {
      let bi = -1, bd = 1e9; path.forEach((p, i) => { const d = Math.hypot(p.x - pl.x, p.z - pl.z); if (d < bd && !under(p.x, p.z) && i > 1 && i < path.length - 2) { bd = d; bi = i; } });
      if (bi < 0 || bd > 75 || stops.some(s => Math.abs(s.i - bi) < 6)) continue;
      const p = path[bi], q = path[bi + 1], dx = q.x - p.x, dz = q.z - p.z, l = Math.hypot(dx, dz) || 1; let px = -dz / l, pz = dx / l;
      if ((pl.x - p.x) * px + (pl.z - p.z) * pz < 0) { px = -px; pz = -pz; } // the bank on the town's side
      let k = 0; while (k < 30 && heightAt(p.x + px * k, p.z + pz * k) < WATER + .5) k += .5;
      if (k >= 30) continue;
      { const lx = p.x + px * (k + 2), lz = p.z + pz * (k + 2), rd = roadDist(lx, lz); if (!rd.road || rd.d > rd.road.w / 2 + 3) continue; } // (round T2, RIVER-006: a stop only where its pier joins a road or path)
      const dock = { pier: pier(p.x + px * (k + 2), p.z + pz * (k + 2), p.x + px * (k - 1.2), p.z + pz * (k - 1.2)) };
      path[bi] = { x: p.x + px * (k - 2.6), z: p.z + pz * (k - 2.6) }; // the raft pulls in beside the pier
      stops.push({ i: bi, name: pl.name, dock });
    }
    // (round T2, Concept D) a stop by every bridge the raft passes under: the map gives each pier's land end (a footpath
    // joins it to the road); the raft pulls in beside the pier's far end
    for (const bs of BOATS.find(b => b.id === 'raft').bridgeStops || []) { const B = BRIDGES.find(B => B.id === bs.bridge); if (!B) continue;
      const [lx, lz] = bs.at; let bi = -1, bd = 1e9; path.forEach((p, i) => { const d = Math.hypot(p.x - lx, p.z - lz); if (d < bd && i > 1 && i < path.length - 2) { bd = d; bi = i; } });
      if (bi < 0) continue; for (let k = stops.length; k--;) if (Math.abs(stops[k].i - bi) < 6) stops.splice(k, 1); // (a town's stop right there gives way to the bridge's)
      const p = path[bi], dx = p.x - lx, dz = p.z - lz, l = Math.hypot(dx, dz) || 1, reach = Math.max(2, l - 2.6);
      const dock = { pier: pier(lx, lz, lx + dx / l * (reach - 1.4), lz + dz / l * (reach - 1.4)) };
      path[bi] = { x: lx + dx / l * reach, z: lz + dz / l * reach };
      stops.push({ i: bi, name: () => T(B.name[0], B.name[1]), dock, bridge: B.id });
    }
    stops.sort((a, b) => a.i - b.i);
    if (stops.length >= 3) { const f = makeFerry({ model: bambooRaft(), path, loop: false, stops, speed: 4.2 }); f.line = true; f.at = stops[0].i; f.seg = stops[0].i; const p0 = path[stops[0].i]; f.model.position.set(p0.x, WATER, p0.z); }
  }

  // ---------- boats between two piers (round T2: the Sydney Harbour ferry, under the Harbour Bridge to the island; round
  // T3: the Sài Gòn boat down Sông Sài Gòn and along the coast to Vũng Tàu): from one pier along `via` to the other ----------
  for (const HF of BOATS.filter(b => b.piers)) {
    const [A, Bp] = HF.piers, path = [], pts = [A.to, ...(HF.via || []), Bp.to];
    for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 4)); for (let k = 0; k < n; k++) path.push({ x: ax + (bx - ax) * k / n, z: az + (bz - az) * k / n }); }
    path.push({ x: Bp.to[0], z: Bp.to[1] });
    const stopOf = (P0, i) => ({ i, name: () => T(P0.name[0], P0.name[1]), dock: { pier: pier(P0.at[0], P0.at[1], P0.to[0] + Math.sign(P0.at[0] - P0.to[0]) * 1.4, P0.to[1] + Math.sign(P0.at[1] - P0.to[1]) * 1.4) } });
    const f = makeFerry({ model: ferryBoat(false), path, loop: false, stops: [stopOf(A, 0), stopOf(Bp, path.length - 1)], speed: 5 }); f.harbour = true; f.boat = HF.id;
  }

  // ---------- riding ----------
  const _q = new THREE.Vector3();
  function board(h, F) {
    if (h.carry) return;
    F.waiting.delete(h); F.riders.add(h); h.ferry = F; SFX.whoosh(); const seat = F.model.seats[[...F.riders].indexOf(h) % F.model.seats.length];
    const stopName = () => { const s = stopAt(F); return s ? s.name() : ''; };
    h.carryIt = { icon: '🚶', label: () => stopAt(F) ? T('Get off here: ', 'Xuống ở đây: ') + stopName() : h.dest && !h.offNext ? T('Going to ', 'Đang đến ') + h.dest.name() : h.offNext ? T('Getting off at the next stop', 'Xuống ở bến sau') : T('Get off at the next stop', 'Xuống ở bến sau'),
      act: () => { if (stopAt(F)) leave(h, F); else { h.offNext = true; SFX.tap(); G.toast(h, T('OK! You will get off at the next stop.', 'Được rồi! Con sẽ xuống ở bến sau.')); } } };
    h.cancelCarry = () => { F.riders.delete(h); h.carry = null; h.ferry = null; h.carryIt = null; h.offNext = false; h.dest = null; aim(F); };
    h.carry = () => {
      const m = F.model; _q.set(seat[0], m.deck, seat[1]).applyMatrix4(m.matrixWorld);
      return { x: _q.x, y: _q.y, z: _q.z, yaw: m.rotation.y + Math.PI / 2, state: 'idle', rest: true };
    };
    // where to? with more than two stops the child chooses, and the boat goes straight there (the rider steps off by
    // themselves when it arrives); with two stops it is the other bank
    const here = stopAt(F), others = F.stops.filter(s => s !== here);
    if (others.length === 1) { h.dest = others[0]; say(`All aboard! Next stop: ${others[0].name()}.`, `Lên thuyền nào! Bến tới: ${others[0].name()}.`); return; }
    say('All aboard! Where would you like to go?', 'Lên thuyền nào! Con muốn đi đâu?');
    if (G.dialog) G.dialog(T('Where to?', 'Đi đâu?'), [['Choose your stop. The boat will take you straight there!', 'Chọn bến con muốn đến. Thuyền sẽ chở con thẳng tới đó!']], others.map(s => ['⛵ ' + s.name(), '⛵ ' + s.name()]))
      .then(k => { if (k >= 0 && F.riders.has(h)) { h.dest = others[k]; aim(F); G.toast(h, '⛵ ' + T('Going to ', 'Đang đến ') + others[k].name()); } });
  }
  // the boat heads for the nearest stop a rider asked for (in its own direction of travel for the lake ferry)
  function aim(F) {
    const dests = [...F.riders].map(h => h.dest).filter(Boolean); if (!dests.length) { F.target = null; return; }
    const n = F.path.length, pos = F.wait > 0 ? F.at : F.seg, dist = s => F.loop ? (s.i - pos + n) % n : Math.abs(s.i - pos);
    F.target = dests.reduce((a, b) => dist(b) < dist(a) ? b : a);
    if (!F.loop && F.target.i !== pos) F.dir = F.target.i > pos ? 1 : -1;
    if (F.wait > 0 && stopAt(F) !== F.target) F.wait = Math.min(F.wait, 1.5); // off we go
  }
  function leave(h, F) {
    const s = stopAt(F); if (!s) return;
    const tip = s.dock.pier.tip, a = s.dock.pier.a;
    h.cancelCarry(); h.cancelCarry = null;
    // step onto the end of the pier, facing the shore
    h.place(tip.x - Math.sin(a) * 1.4, tip.z - Math.cos(a) * 1.4, world.groundAt(tip.x - Math.sin(a) * 1.4, tip.z - Math.cos(a) * 1.4, tip.y + .5)); h.yaw = a + Math.PI; SFX.jump();   // (on its step, where the pier climbs the bank)
  }

  // board from each pier: tap to ride (or wait for the boat)
  ferries.forEach((F, fi) => F.stops.forEach((s, si) => {
    const tip = s.dock.pier.tip, a = s.dock.pier.a, x = tip.x - Math.sin(a) * 1.2, z = tip.z - Math.cos(a) * 1.2;
    const icon = sprite('⛴️', 1.4); icon.position.set(x, tip.y + 2.6, z); scene.add(icon);
    world.updaters.push((dt, t) => { icon.position.y = tip.y + 2.6 + Math.sin(t * 2 + fi + si) * .15; });
    G.interactables.push({ id: `ferry${fi}_${si}`, x, z, y: tip.y, r: 2.6, icon: '⛴️', visible: h => !h.carry,
      label: () => (stopAt(F) === s ? T('Ride the free ferry', 'Đi phà miễn phí') : F.waiting.size && [...F.waiting].some(w => w.waitStop === s) ? T('Waiting for the ferry…', 'Đang chờ phà…') : T('Wait for the free ferry', 'Chờ phà miễn phí')) + ' · ' + s.name(),
      act: h => {
        if (stopAt(F) === s) return board(h, F);
        h.waitStop = s; F.waiting.add(h); SFX.tap(); say('The ferry is coming. Wait here on the pier!', 'Phà đang đến. Đứng chờ ở cầu tàu nhé!');
      } });
  }));

  // ---------- moving the boats ----------
  world.updaters.push((dt, t) => {
    ferries.forEach(F => {
      const m = F.model;
      if (F.wait > 0) {
        F.wait -= dt;
        const s = stopAt(F);
        // children waiting on this pier hop on; riders who asked get off
        if (s) {
          F.waiting.forEach(h => { if (h.waitStop === s && dist2(h.pos.x, h.pos.z, s.dock.pier.tip.x, s.dock.pier.tip.z) < 5) board(h, F); else if (dist2(h.pos.x, h.pos.z, s.dock.pier.tip.x, s.dock.pier.tip.z) > 12) F.waiting.delete(h); });
          F.riders.forEach(h => { if (h.offNext || h.dest === s) { h.offNext = false; leave(h, F); } });
          if (F.target === s) aim(F);
        }
        if (F.wait <= 0) { F.seg = F.at; F.k = 0; }
      } else {
        const n = F.path.length;
        let i = F.seg, j = F.loop ? (i + 1) % n : i + F.dir;
        if (!F.loop && (j < 0 || j >= n)) { F.dir *= -1; j = i + F.dir; }
        const a = F.path[i], b = F.path[j], L = Math.hypot(b.x - a.x, b.z - a.z) || 1;
        F.k += F.speed * dt / L;
        if (F.k >= 1) {
          F.seg = j; F.k = 0;
          const st = F.stops.find(s => s.i === j);
          // going somewhere a rider chose: other stops are passed by (unless someone is waiting there)
          const skip = st && F.target && F.target !== st && ![...F.waiting].some(w => w.waitStop === st);
          if (st && !skip) {
            F.at = j; F.wait = F.loop ? 7 : 6; m.position.set(b.x, WATER, b.z);
            if ([...F.riders].length) { SFX.chime(); F.riders.forEach(h => G.toast(h, '⛴️ ' + st.name())); say(`${st.name()}!`, `${st.name()}!`); }
            if (!F.loop && (j === 0 || j === n - 1)) F.dir = j === 0 ? 1 : -1;
          }
          return;
        }
        m.position.set(a.x + (b.x - a.x) * F.k, WATER, a.z + (b.z - a.z) * F.k);
        const want = Math.atan2(b.x - a.x, b.z - a.z) - Math.PI / 2;
        let d = want - m.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); m.rotation.y += d * Math.min(1, dt * (F.loop ? 2 : 6));
      }
      if (m.roof) { const want = F.riders.size ? .28 : 1, mt = m.roof.material; mt.opacity += (want - mt.opacity) * Math.min(1, dt * 4); mt.depthWrite = mt.opacity > .95; }
      m.position.y = WATER + Math.sin(t * 1.6 + F.speed) * .06; m.rotation.z = Math.sin(t * 1.1) * .02;
      m.updateMatrixWorld();
    });
  });
  return { ferries, docks: DOCKS };
}
