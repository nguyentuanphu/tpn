// Round T4b (finding your way): a picture signpost where two roads meet. One low, chunky post per junction of
// two asphalt or dirt roads (footpaths do not count), with one arrow board for every road leaving it: the picture
// of the next place along that road and its name, the child's language first and the other one under it.
// Everything comes from the road data at load time (js/content/map.js through js/world.js), never from written-down
// positions. All posts are one merged mesh and all boards one more, drawn into a single shared picture, so every
// signpost in the valley together costs two draws.
import { THREE, toonVC, P, merge } from './gfx.js';
import { onLang, both } from './i18n.js';
import { settings } from './state.js';
import { heightAt, roadDist, ROADS, WATER, PLOTS, plotBox } from './world.js';
import { withSitePlaces } from './content/activities.js';

const ATLAS = 1024, COLS = 4, CW = ATLAS / COLS;
const BOARD_L = 2.3, BOARD_H = .5, TIP = .35;   // a board's length, height and arrow tip (metres)

// the nearest point on a road's line to (x, z): which piece, how far along it, and the distance
const nearOn = (x, z, pts) => {
  let best = { d: 1e9, i: 0, t: 0 };
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))), d = Math.hypot(x - ax - dx * t, z - az - dz * t);
    if (d < best.d) best = { d, i, t };
  }
  return best;
};
const linePts = R => R.loop ? [...R.pts, R.pts[0]] : R.pts;

// every junction: a road end (with no gate) lying on another road; ends close together are one junction
export function findJunctions() {
  const roads = ROADS.filter(R => R.kind !== 'footpath'), out = [];
  for (const R of roads) {
    if (R.loop) continue;
    [0, 1].forEach(end => {
      if ((R.gates || [])[end]) return;
      const [x, z] = end ? R.pts[R.pts.length - 1] : R.pts[0];
      const O = roads.find(o => o !== R && nearOn(x, z, linePts(o)).d < 1.5); if (!O) return;
      let J = out.find(j => Math.hypot(j.x - x, j.z - z) < 10);
      if (!J) { J = { x, z, ways: [] }; out.push(J); }
      const add = (road, i, t, dir) => { if (!J.ways.some(w => w.road === road && w.dir === dir)) J.ways.push({ road, i, t, dir }); };
      add(R, end ? R.pts.length - 2 : 0, end ? 1 : 0, end ? -1 : 1);   // along the road that ends here, away from its end
      const q = nearOn(x, z, linePts(O)); add(O, q.i, q.t, 1); add(O, q.i, q.t, -1);   // and both ways along the road it meets
    });
  }
  return out;
}

// walk along a road from (piece i, fraction t) in one direction, a point every 2 m, at most 400 m; a loop goes round
function walk(road, i, t, dir, max = 400) {
  const pts = linePts(road), n = pts.length - 1, out = [];
  let [ax, az] = pts[i], [bx, bz] = pts[i + 1], x = ax + (bx - ax) * t, z = az + (bz - az) * t, k = dir > 0 ? i + 1 : i, gone = 0, laps = 0;
  while (gone < max) {
    if (k < 0 || k > n) { if (!road.loop || laps++ > 1) break; k = k < 0 ? n - 1 : 1; }
    const [tx, tz] = pts[k], d = Math.hypot(tx - x, tz - z);
    if (d < 2) { x = tx; z = tz; gone += d; k += dir > 0 ? 1 : -1; continue; }
    x += (tx - x) * 2 / d; z += (tz - z) * 2 / d; gone += 2; out.push([x, z, gone]);
  }
  return out;
}

// where a way leads: the place the road reaches first, whether it passes it, ends at its gate, or turns off at the
// next junction towards it (one junction on, so the ring road's boards name the towns its side roads go to);
// a landmark only when no place is on the way. Never a place within 14 m of this junction.
function nextPlace(J, way, places, landmarks, junctions, depth = 0) {
  const path = walk(way.road, way.i, way.t, way.dir, 1500); if (path.length < 3) return null;
  const tops = places.filter(p => !p.under && Math.hypot(p.x - J.x, p.z - J.z) >= 14);
  let best = null;
  const offer = (p, s) => { if (p && (!best || s < best.s)) best = { p, s }; };
  // a place the road passes
  for (const p of tops) for (const [x, z, s] of path) if (Math.hypot(p.x - x, p.z - z) < 22) { offer(p, s); break; }
  // the place at the road's end (its gate or the town it stops in)
  const end = path[path.length - 1], ended = !way.road.loop && end[2] < 1500 - 2;
  if (ended) { let near = null, nd = 45; for (const p of tops) { const d = Math.hypot(p.x - end[0], p.z - end[1]); if (d < nd) { nd = d; near = p; } } offer(near, end[2]); }
  // the next junction on the way: where its side road leads
  if (!depth) for (const K of junctions) {
    if (K === J) continue;
    const hit = path.find(([x, z]) => Math.hypot(K.x - x, K.z - z) < 6); if (!hit || (best && best.s <= hit[2])) continue;
    for (const w of K.ways) if (w.road !== way.road) { const d = nextPlace(K, w, places, landmarks, junctions, 1); if (d) offer(d.place, hit[2]); }
  }
  if (!best) for (const l of landmarks) { if (Math.hypot(l.x - J.x, l.z - J.z) < 14) continue; for (const [x, z, s] of path) if (Math.hypot(l.x - x, l.z - z) < 22) { offer(l, s); break; } }
  if (!best) return null;
  return { place: best.p, angle: Math.atan2(path[1][1] - J.z, path[1][0] - J.x), far: best.s };
}

// a spot by the junction that is off every road, dry, off every garden plot and clear of anything solid already
// standing there: tried in a ring of growing sizes round the corner
function postSpot(J, colliders, BOXES) {
  for (const r of [6, 7.5, 9, 11, 13]) for (let a = 0; a < 16; a++) {
    const ang = (a + .5) / 16 * Math.PI * 2, x = J.x + Math.cos(ang) * r, z = J.z + Math.sin(ang) * r, q = roadDist(x, z);
    if (q.d <= (q.road ? q.road.w / 2 : 0) + 1.2 || heightAt(x, z) <= WATER + .3) continue;
    // Reserve the full arrow reach plus a solid-grid cell, not just the post: raised plot ground can meet a board.
    const clearance = .15 + BOARD_L + TIP + .5;
    if (BOXES.some(B => x > B.x0 - clearance && x < B.x1 + clearance && z > B.z0 - clearance && z < B.z1 + clearance)) continue;
    if (colliders.some(c => Math.hypot(c.x - x, c.z - z) < c.r + .9)) continue;
    return { x, z };
  }
  return null;
}

export function createSignposts(G) {
  const { scene, world } = G, places = (withSitePlaces(G.PLACES) || []).filter(p => p.name), landmarks = (G.LANDMARKS || []).filter(l => l.name);
  const posts = [];
  const junctions = findJunctions(), boxes = PLOTS.map(p => plotBox(p));   // (the plots are laid out by now)
  for (const J of junctions) {
    const spot = postSpot(J, world.colliders, boxes); if (!spot) continue;
    const boards = [];
    for (const w of J.ways) { const b = nextPlace(J, w, places, landmarks, junctions); if (b && !boards.some(o => o.place === b.place)) boards.push(b); }
    if (!boards.length) continue;
    posts.push({ ...spot, y: heightAt(spot.x, spot.z), boards: boards.slice(0, 4) });
  }
  if (!posts.length) return { posts };
  // the posts: a round wooden post with a little roof cap, all merged into one mesh
  const parts = [];
  for (const s of posts) {
    const h = 1.95 + s.boards.length * .6;   // (the boards start above a child's head: only the post is solid, js/solids.js)
    parts.push(P(new THREE.CylinderGeometry(.13, .16, h, 8), '#8a5a34', [s.x, s.y + h / 2, s.z]));
    parts.push(P(new THREE.ConeGeometry(.3, .28, 8), '#c0392b', [s.x, s.y + h + .12, s.z]));
    parts.push(P(new THREE.CylinderGeometry(.3, .34, .16, 8), '#6e4a2c', [s.x, s.y + .08, s.z]));
    world.colliders.push({ x: s.x, z: s.z, r: .4 });   // solid like a post
  }
  const postMesh = new THREE.Mesh(merge(parts), toonVC()); postMesh.castShadow = true; postMesh.userData.noCam = true; scene.add(postMesh);
  // the boards: one shared picture, a cell for every board; a board is an arrow pointing along its road
  const all = posts.flatMap(s => s.boards), rows = Math.ceil(all.length / COLS), CH = Math.min(96, Math.floor(ATLAS / Math.max(1, rows)));
  const cv = document.createElement('canvas'); cv.width = ATLAS; cv.height = Math.max(64, rows * CH);
  const g = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const draw = () => {
    g.clearRect(0, 0, cv.width, cv.height);
    all.forEach((b, k) => {
      const cx = (k % COLS) * CW, cy = Math.floor(k / COLS) * CH, [en, vi] = both(b.place.name), main = settings.lang === 'vi' ? vi : en, other = settings.lang === 'vi' ? en : vi;
      g.fillStyle = '#fff4d6'; g.fillRect(cx, cy, CW, CH);
      g.strokeStyle = '#7a4a26'; g.lineWidth = 6; g.strokeRect(cx + 3, cy + 3, CW - 6, CH - 6);
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#3b2558';
      g.font = `${Math.round(CH * .5)}px sans-serif`; g.fillText(b.place.icon || '', cx + CH * .55, cy + CH / 2);
      const tx = cx + CH * 1.05 + (CW - CH * 1.15) / 2, tw = CW - CH * 1.2;
      g.font = `bold ${Math.round(CH * .34)}px Fredoka, "Baloo 2", sans-serif`; g.fillText(main, tx, cy + CH * (main === other ? .5 : .36), tw);
      if (main !== other) { g.fillStyle = '#7a6a8a'; g.font = `${Math.round(CH * .24)}px Fredoka, "Baloo 2", sans-serif`; g.fillText(other, tx, cy + CH * .72, tw); }
    });
    tex.needsUpdate = true;
  };
  draw(); onLang(draw);
  // each board: a box-ended arrow standing on edge; the picture is mapped on both faces (mirrored on the back so the
  // words read the right way from either side), the tip in plain board colour
  const pos = [], uv = [], idx = [];
  let k = 0;
  for (const s of posts) s.boards.forEach((b, j) => {
    const y0 = s.y + 1.7 + j * .6, ca = Math.cos(b.angle), sa = Math.sin(b.angle), cell = all.indexOf(b), u0 = (cell % COLS) * CW / ATLAS, u1 = u0 + CW / ATLAS;
    const v1 = 1 - Math.floor(cell / COLS) * CH / cv.height, v0 = v1 - CH / cv.height, tipU = u0 + 2 / ATLAS, tipV = v0 + 2 / cv.height;
    const at = (l, h, side) => [s.x + ca * l - sa * side * .03, y0 + h, s.z + sa * l + ca * side * .03];
    for (const side of [1, -1]) {
      const base = pos.length / 3, L0 = .15, L1 = .15 + BOARD_L;
      [[L0, 0], [L1, 0], [L1, BOARD_H], [L0, BOARD_H], [L1 + TIP, BOARD_H / 2]].forEach(([l, h]) => pos.push(...at(l, h, side)));
      const a = side > 0 ? [u0, u1] : [u1, u0];
      uv.push(a[0], v0, a[1], v0, a[1], v1, a[0], v1, tipU, tipV);
      if (side > 0) idx.push(base, base + 1, base + 2, base, base + 2, base + 3, base + 1, base + 4, base + 2);
      else idx.push(base, base + 2, base + 1, base, base + 3, base + 2, base + 1, base + 2, base + 4);
    }
    k++;
  });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const boardMesh = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ map: tex, side: THREE.FrontSide })); boardMesh.userData.noCam = true; scene.add(boardMesh);
  return { posts, meshes: [postMesh, boardMesh], texture: tex };
}
