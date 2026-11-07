// (v1.08e nature, owner 6 Nov 2026 AEDT: "blender all the animals, trees, flowers ...") The trees, flowers, reeds, farm
// crops, farm props and My House decorations made in Blender (tools/blender/world-nature.py, models/world/*.glb) take the
// code shapes' place near the child.
// - Loaded after the start (js/main.ts afterStart): nothing here is in the first download (check startup).
// - A marked shape (js/nature-tag.ts natureModel) keeps its mesh, its material, its place and its draw: only its geometry
//   is changed to the model's (worldModelParts of the shared kit, js/modelkit.ts), so instanced trees stay one draw per
//   tile, areas that sleep hide it as before, and taps (js/fun.ts) and colliders are untouched. The solid map always reads
//   the code shape (userData.codeGeo, js/solids.ts), so it is the same whether a model is drawn or not.
// - Near (a child within NEAR m of the shape's bounds) the model is drawn; far again (past FAR m) the code shape comes
//   back, so far trees stay light (check battery, perf). A model that cannot load leaves the code shape for good.
// - The farm's crops ask for their stage's model (natureGeo) and are drawn with it once it is here.
import { THREE } from './gfx.js';
import { loadWorldModel, worldModelParts, worldModelFailed } from './modelkit.js';
import { setNatureHook } from './nature-tag.js';

type Shape = THREE.Mesh & { userData: { natureModel?: string, codeGeo?: THREE.BufferGeometry, natureOn?: boolean } };
type Hero = { pos: { x: number, z: number } };
const geos = new Map<string, THREE.BufferGeometry>(), asked = new Set<string>();
const shapes: { o: Shape, name: string, seen: boolean, age: number }[] = [];
const crops = new Map<string, { at: { x: number, z: number }, ready: (() => void)[] }>();
export const NEAR = 70, FAR = 110, CLOSE = 25;
// (owner, 6 Nov 2026 AEDT: "Detailed up close") the many-copy kinds also have a close-up model, "<name>-hd", drawn within
// CLOSE m of a child; the few ones (crops, farm props, My House) are detailed already and have none
const ONE = /^(carrot|strawberry|tomato|corn|sunflower|pumpkin|farm-|decor-)/;
export const hdOf = (name: string) => ONE.test(name) ? null : name + '-hd';
export const natureStats = { swaps: 0, back: 0, loaded: 0, failed: 0 };

/** one geometry for a model: its parts joined, colours as three numbers a corner (the toonVC material of the shape) */
async function geoOf(name: string): Promise<THREE.BufferGeometry | null> {
  if (geos.has(name)) return geos.get(name);
  const parts = await worldModelParts(name);
  if (!parts || !parts.length) { natureStats.failed++; return null; }
  const flat = parts.map(p => { const g = p.geometry.index ? p.geometry.toNonIndexed() : p.geometry; const out = new THREE.BufferGeometry();
    for (const k of ['position', 'normal', 'color']) { const a = g.getAttribute(k); if (!a) continue; const n = k === 'color' ? 3 : 3, arr = new Float32Array(a.count * n);
      for (let i = 0; i < a.count; i++) { arr[i * n] = a.getX(i); arr[i * n + 1] = a.getY(i); arr[i * n + 2] = a.getZ(i); }
      out.setAttribute(k, new THREE.BufferAttribute(arr, n)); }
    if (!out.getAttribute('color')) { const c = new Float32Array(out.getAttribute('position').count * 3).fill(1); out.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
    return out; });
  let geo = flat[0];
  if (flat.length > 1) { const n = flat.reduce((a, g) => a + g.getAttribute('position').count, 0); geo = new THREE.BufferGeometry();
    for (const k of ['position', 'normal', 'color']) { const arr = new Float32Array(n * 3); let o = 0; for (const g of flat) { const a = g.getAttribute(k) as THREE.BufferAttribute; if (a) arr.set(a.array as Float32Array, o); o += g.getAttribute('position').count * 3; } geo.setAttribute(k, new THREE.BufferAttribute(arr, 3)); } }
  geo.computeBoundingBox(); geo.computeBoundingSphere(); geo.name = 'nature:' + name;
  geos.set(name, geo); natureStats.loaded++; return geo;
}
const want = (name: string) => { if (asked.has(name) || worldModelFailed(name)) return; asked.add(name); void geoOf(name); };

const _s = new THREE.Sphere(), _b = new THREE.Box3();
/** how far the nearest child is from the shape's bounds (an InstancedMesh: all its copies), or -1 when not in the scene */
function gap(o: Shape, heroes: Hero[]) {
  let p: THREE.Object3D = o; while (p.parent) p = p.parent; if (!(p as THREE.Scene).isScene) return -1;
  if ((o as unknown as THREE.InstancedMesh).isInstancedMesh) { const im = o as unknown as THREE.InstancedMesh; if (!im.boundingSphere) im.computeBoundingSphere(); _s.copy(im.boundingSphere).applyMatrix4(o.matrixWorld); }
  else { const g = o.userData.codeGeo || o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); _s.copy(g.boundingSphere).applyMatrix4(o.matrixWorld); }
  let d = 1e9; for (const h of heroes) d = Math.min(d, Math.hypot(h.pos.x - _s.center.x, h.pos.z - _s.center.z) - _s.radius); return Math.max(0, d);
}
function show(o: Shape, model: boolean) {
  const im = o as unknown as THREE.InstancedMesh;
  if (model) { if (!o.userData.codeGeo) o.userData.codeGeo = o.geometry; o.geometry = geos.get(o.userData.natureModel); o.userData.natureOn = true; natureStats.swaps++; }
  else { o.geometry = o.userData.codeGeo; o.userData.natureOn = false; natureStats.back++; }
  if (im.isInstancedMesh) im.computeBoundingSphere(); // (the copies' bounds with the new shape: the camera skips a tile out of view)
}
/** four times a second: near shapes get their model, far ones their code shape back; shapes gone from the scene are let go */
export function tickNature(heroes: Hero[], near = NEAR, far = FAR) {
  if (!heroes.length) return;
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i], d = gap(s.o, heroes);
    if (d < 0) { if (s.seen || ++s.age > 40) shapes.splice(i, 1); continue; } // (taken away, e.g. a room rebuilt; or never added)
    s.seen = true;
    if (worldModelFailed(s.name)) { if (s.o.userData.natureOn) show(s.o, false); shapes.splice(i, 1); continue; }
    if (!s.o.userData.natureOn && d < near) { if (geos.has(s.name)) show(s.o, true); else want(s.name); }
    else if (s.o.userData.natureOn && d > far) show(s.o, false);
    // a single shape (a town's tree) wears its close-up model within CLOSE m; many copies get the close-up overlay (below)
    const hd = hdOf(s.name);
    if (hd && s.o.userData.natureOn && !(s.o as unknown as THREE.InstancedMesh).isInstancedMesh) {
      const g = geos.get(hd), light = geos.get(s.name);
      if (d < CLOSE) { if (g) { if (s.o.geometry !== g) s.o.geometry = g; } else want(hd); }
      else if (d > CLOSE + 8 && s.o.geometry === g) s.o.geometry = light;
    }
  }
  tickClose(heroes);
  for (const [name, c] of crops) {
    if (geos.has(name)) { crops.delete(name); c.ready.splice(0).forEach(f => f()); continue; }
    if (worldModelFailed(name)) { crops.delete(name); continue; }
    if (heroes.some(h => Math.hypot(h.pos.x - c.at.x, h.pos.z - c.at.z) < near)) want(name);
  }
}

// ---- close up: the copies of an InstancedMesh within CLOSE m of a child are drawn by one small InstancedMesh of the
// close-up model for each kind (one more draw for each kind near the child), and shrink to a point where they were (their
// place kept, so the copies' bounds and the camera's skipping stay true). The solid map reads the copies' first places
// (userData.codeMatrices, js/solids.ts), so a copy shown close up still blocks a child as before.
type Slot = { src: THREE.InstancedMesh, i: number };
const close = new Map<string, { mesh: THREE.InstancedMesh, slots: Slot[], key: string }>();
export const CLOSE_MAX = 40;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _sc = new THREE.Vector3(), _c = new THREE.Color(), _tiny = new THREE.Vector3(1e-4, 1e-4, 1e-4);
const firstPlaces = (im: THREE.InstancedMesh) => (im.userData.codeMatrices || (im.userData.codeMatrices = new Float32Array(im.instanceMatrix.array as Float32Array))) as Float32Array;
function restore(sl: Slot) { const a = firstPlaces(sl.src); _m.fromArray(a, sl.i * 16); sl.src.setMatrixAt(sl.i, _m); sl.src.instanceMatrix.needsUpdate = true; }
function tickClose(heroes: Hero[]) {
  const byKind = new Map<string, { d: number, sl: Slot }[]>();
  for (const s of shapes) {
    const im = s.o as unknown as THREE.InstancedMesh, hd = hdOf(s.name);
    if (!hd || !im.isInstancedMesh || !s.o.userData.natureOn || worldModelFailed(hd)) continue;
    if (gap(s.o, heroes) > CLOSE) continue;
    const a = firstPlaces(im), list = byKind.get(hd) || [];
    for (let i = 0; i < im.count; i++) {
      const x = a[i * 16 + 12], z = a[i * 16 + 14]; let d = 1e9;
      for (const h of heroes) d = Math.min(d, Math.hypot(h.pos.x - x, h.pos.z - z));
      if (d < CLOSE) list.push({ d, sl: { src: im, i } });
    }
    byKind.set(hd, list);
  }
  for (const [hd, c] of close) if (!byKind.has(hd)) byKind.set(hd, []);
  for (const [hd, list] of byKind) {
    if (list.length && !geos.has(hd)) { want(hd); continue; }
    list.sort((a, b) => a.d - b.d); const take = list.slice(0, CLOSE_MAX).map(x => x.sl);
    const key = take.map(t => t.src.id + ':' + t.i).join(','), c = close.get(hd);
    if (c && c.key === key) continue;
    if (c) for (const sl of c.slots) if (!take.some(t => t.src === sl.src && t.i === sl.i)) restore(sl);
    if (!take.length) { if (c) { c.mesh.count = 0; c.slots = []; c.key = ''; } continue; }
    let o = c && c.mesh;
    if (!o) { const src = take[0].src; o = new THREE.InstancedMesh(geos.get(hd), src.material, CLOSE_MAX); o.castShadow = src.castShadow; o.receiveShadow = src.receiveShadow;
      Object.assign(o.userData, { noSolid: true, natureClose: hd, noCam: src.userData.noCam, kind: src.userData.kind, list: [] }); src.parent.add(o);
      if (src.userData.kind && plants && plants.includes(src)) plants.push(o); // (a tree up close can still be tapped, js/fun.ts)
      close.set(hd, { mesh: o, slots: [], key: '' }); }
    const C = close.get(hd); o.count = take.length; o.userData.list = [];
    take.forEach((sl, j) => {
      const a = firstPlaces(sl.src); _m.fromArray(a, sl.i * 16); o.setMatrixAt(j, _m);
      if (sl.src.instanceColor) { sl.src.getColorAt(sl.i, _c); o.setColorAt(j, _c); }
      o.userData.list[j] = sl.src.userData.list ? sl.src.userData.list[sl.i] : null;
      _m.decompose(_v, _q, _sc); _m.compose(_v, _q, _tiny); sl.src.setMatrixAt(sl.i, _m); sl.src.instanceMatrix.needsUpdate = true;
    });
    o.instanceMatrix.needsUpdate = true; if (o.instanceColor) o.instanceColor.needsUpdate = true; o.computeBoundingSphere();
    C.slots = take; C.key = key;
  }
}
export const natureClose = () => [...close.entries()].map(([name, c]) => ({ name, count: c.mesh.count }));
let plants: THREE.Object3D[] = null;

/** the checks: every marked shape with its model now, and every crop stage loaded */
export async function natureAll(names: string[] = []) {
  await Promise.all([...new Set([...shapes.map(s => s.name), ...shapes.map(s => hdOf(s.name)).filter(Boolean), ...names])].map(n => geoOf(n)));
  for (const s of shapes) if (geos.has(s.name) && !s.o.userData.natureOn) show(s.o, true);
}
export const natureShapes = () => shapes.map(s => ({ name: s.name, on: !!s.o.userData.natureOn, instanced: !!(s.o as unknown as THREE.InstancedMesh).isInstancedMesh }));
export const natureGeoReady = (name: string) => geos.get(name) || null;

export function startNature(G: { heroes: Hero[], solidsReady?: Promise<unknown>, world?: { plants?: THREE.Object3D[] } }, updaters: ((dt: number) => void)[], quality = 'auto') {
  plants = (G.world && G.world.plants) || null;
  const near = quality === 'low' ? 40 : NEAR, far = quality === 'low' ? 70 : FAR;
  setNatureHook({
    mark: (o, name) => { shapes.push({ o: o as Shape, name, seen: false, age: 0 }); },
    geo: (name, at, ready) => { const g = geos.get(name); if (g) return g; if (worldModelFailed(name)) return null;
      const c = crops.get(name) || { at, ready: [] }; if (!c.ready.includes(ready)) c.ready.push(ready); if (c.ready.length > 12) c.ready.shift(); crops.set(name, c); return null; }
  });
  // (the solid map of the valley is made from the code shapes first; the swaps start after it, js/solids.ts)
  let go = false, acc = 0; void Promise.resolve(G.solidsReady).then(() => { go = true; }, () => { go = true; });
  updaters.push(dt => { acc += dt; if (acc < .25 || !go) return; acc = 0; tickNature(G.heroes, near, far); });
  void loadWorldModel; // (the kit's loader: worldModelParts uses it)
}
