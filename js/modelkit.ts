// (v1.08e, owner 6 Nov 2026 AEDT: animals, trees, flowers, pets, companions, vehicles, landmarks and buildings, food and
// festival props, farm and My House remade in Blender, loaded near the child) The shared kit every v1.08e helper uses.
// - A model is models/world/<name>.glb (meshopt, vertex colours, about 50-200 KB), made by tools/blender/world-*.py.
// - The code shape stays as the fallback: it is drawn until the model has arrived, and for good when it cannot load (an
//   old phone, no network), so the game never stops and the checks that count shapes keep working.
// - modelFor(fallback, name) puts the model in the fallback's place the first time a child comes within reach
//   (wakeWorldModels, four times a second from js/main.ts), at most a few each time so a frame never stalls.
// - Models with moves (animals, pets, companions, vehicles' wheels) carry their clips; play(name) starts one.
// - Many copies of one thing (trees, flowers, crops): worldModelParts(name) gives its geometry and material for one
//   InstancedMesh, the way the code trees are drawn today.
// Nothing here is in the first download: js/main.ts loads it after the start (check startup).
import { THREE, WORLD_TAGS, outline } from './gfx.js';

type Template = { scene: THREE.Object3D, clips: THREE.AnimationClip[] };
export type WorldModel = { obj: THREE.Object3D, play: (clip: string, fade?: number) => void, stop: () => void, has?: (clip: string) => boolean };
type Wait = { fallback: THREE.Object3D, name: string, opts: ModelOpts, done?: (m: WorldModel | null) => void };
export type ModelOpts = { scale?: number, y?: number, turn?: number, keep?: boolean, clip?: string, shadow?: boolean };

const ready = new Map<string, Template>(), loading = new Map<string, Promise<Template | null>>(), failed = new Set<string>();
const WAIT: Wait[] = [], mixers: THREE.AnimationMixer[] = [];
let bands: THREE.Texture = null, tools: Promise<any[]> = null;
export const WORLD_MODEL_URL = (name: string) => `models/world/${name}.glb`;
export const worldModelReady = (name: string) => ready.has(name);
export const worldModelFailed = (name: string) => failed.has(name);
export const worldModelsWaiting = () => WAIT.length;

const toon = (name: string, skin = false) => {
  if (!bands) { const d = new Uint8Array([90, 170, 255]); bands = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); bands.minFilter = bands.magFilter = THREE.NearestFilter; bands.needsUpdate = true; }
  return skin ? new THREE.MeshToonMaterial({ name, color: '#f6c7a5', gradientMap: bands }) : new THREE.MeshToonMaterial({ name, vertexColors: true, gradientMap: bands });
};
// (Meshy pets, 10 Nov 2026) a Meshy animal ("meshy-" material, tools/meshy/fit_animal.py): its picture has its light
// painted in, so it is drawn like the Meshy friends (js/friend-model.ts baked()): mostly by its own painted light, a
// little smooth valley light on top (no toon bands: they drew hard stripes across the fur), both sides
// The shut and happy eyelids (meshy-<kind>-shut0, -joy1 ...) lie just over the painted eyes: drawn on top of the face
// (polygon offset), as the friends' mood pieces are
const meshyMat = (name: string, map: THREE.Texture, transparent = false) => { const lid = /-(shut\d|joy\d|mouth)$/.test(name);   // (the open mouth piece too, 11 Nov 2026)
  return new THREE.MeshLambertMaterial({ name, map, transparent, alphaTest: transparent ? .01 : 0, depthWrite: !transparent, emissiveMap: map, emissive: '#ffffff', emissiveIntensity: .95, color: '#262524', side: lid ? THREE.FrontSide : THREE.DoubleSide, polygonOffset: lid, polygonOffsetFactor: lid ? -2 : 0, polygonOffsetUnits: lid ? -4 : 0 }); };
/** load a model once; resolves null when it cannot load (the fallback stays) */
export function loadWorldModel(name: string): Promise<Template | null> {
  if (ready.has(name)) return Promise.resolve(ready.get(name));
  if (failed.has(name)) return Promise.resolve(null);
  if (!loading.has(name)) loading.set(name, (async () => {
    try {
      tools = tools || Promise.all([import('../vendor/GLTFLoader.js'), import('../vendor/meshopt_decoder.module.js'), import('../vendor/SkeletonUtils.js')]);
      const [{ GLTFLoader }, { MeshoptDecoder }] = await tools;
      const l = new GLTFLoader(); l.setMeshoptDecoder(MeshoptDecoder);
      const g = await l.loadAsync(WORLD_MODEL_URL(name));
      // the picture-book look of the friends (js/friend-model.ts): toon bands, colours from the corners
      const mats = new Map();
      g.scene.traverse((o: any) => { if (!o.isMesh) return; const m = o.material, n = (m && m.name) || '';
        if (!mats.has(m)) mats.set(m, n.startsWith('meshy-') && m.map ? meshyMat(n, m.map, m.transparent) : toon(n, n.startsWith('skin'))); o.material = mats.get(m); });
      const t = { scene: g.scene, clips: g.animations || [] }; ready.set(name, t); return t;
    } catch (e) { failed.add(name); console.warn('world model', name, e && e.message); return null; }
  })());
  return loading.get(name);
}
async function make(name: string, opts: ModelOpts = {}): Promise<WorldModel | null> {
  const t = await loadWorldModel(name); if (!t) return null;
  const [, , { clone }] = await tools;
  const obj = t.clips.length ? clone(t.scene) : t.scene.clone(true);
  obj.traverse((o: any) => { if (o.isMesh) { o.castShadow = opts.shadow !== false; if (o.isSkinnedMesh) o.frustumCulled = false; } });
  if (opts.scale) obj.scale.setScalar(opts.scale);
  if (opts.y) obj.position.y = opts.y; if (opts.turn) obj.rotation.y = opts.turn;
  let mixer: THREE.AnimationMixer = null, cur: THREE.AnimationAction = null;
  const play = (clip: string, fade = .25) => { const c = THREE.AnimationClip.findByName(t.clips, clip); if (!c) return;
    if (!mixer) { mixer = new THREE.AnimationMixer(obj); mixers.push(mixer); }
    const a = mixer.clipAction(c); if (a === cur) return; a.reset().fadeIn(fade).play(); if (cur) cur.fadeOut(fade); cur = a; };
  const stop = () => { if (cur) cur.fadeOut(.2); cur = null; };
  const has = (clip: string) => !!THREE.AnimationClip.findByName(t.clips, clip);   // (Meshy pets: the moves only some models have)
  const m = { obj, play, stop, has }; if (opts.clip) play(opts.clip); return m;
}
/** a model on its own, now (a shop picture, a film): null when it cannot load */
export const worldModel = (name: string, opts: ModelOpts = {}) => make(name, opts);
/** put the model in the fallback's place when a child first comes near; the fallback is hidden, not removed (opts.keep:
 * it stays visible, the model added beside it) */
export function modelFor(fallback: THREE.Object3D, name: string, opts: ModelOpts = {}, done?: (m: WorldModel | null) => void) {
  if (!fallback || failed.has(name)) { if (done) done(null); return; }
  WAIT.push({ fallback, name, opts, done });
}
const _p = new THREE.Vector3();
async function swap(w: Wait) {
  const m = await make(w.name, w.opts);
  if (!m || !w.fallback.parent) { if (w.done) w.done(m); return; }
  m.obj.position.add(w.fallback.position); m.obj.quaternion.premultiply(w.fallback.quaternion);
  if (!w.opts.scale) m.obj.scale.multiply(w.fallback.scale);
  w.fallback.parent.add(m.obj); if (!w.opts.keep) w.fallback.visible = false;
  m.obj.userData.fallback = w.fallback; w.fallback.userData.model = m;
  if (w.done) w.done(m);
}
/** swap the waiting models within r of any of the points, nearest first, at most max (js/main.ts, four times a second) */
export function wakeWorldModels(points: { x: number, z: number }[], r = 70, max = 3) {
  if (!WAIT.length || !points.length) return 0;
  const near: [number, number][] = [];
  WAIT.forEach((w, i) => { if (!w.fallback.parent) return; w.fallback.getWorldPosition(_p); let d = 1e9; for (const p of points) d = Math.min(d, Math.hypot(p.x - _p.x, p.z - _p.z)); if (d < r) near.push([d, i]); });
  near.sort((a, b) => a[0] - b[0]); const take = near.slice(0, max).map(([, i]) => i).sort((a, b) => b - a);
  for (const i of take) { const [w] = WAIT.splice(i, 1); void swap(w); }
  return take.length;
}
/** every waiting model at once (the checks; a flight's landing spot uses wakeWorldModels with a large max) */
export async function wakeAllWorldModels() { const all = WAIT.splice(0); await Promise.all(all.map(swap)); }
/** one geometry and material for an InstancedMesh of many copies (trees, flowers, crops); null when it cannot load */
export async function worldModelParts(name: string): Promise<{ geometry: THREE.BufferGeometry, material: THREE.Material }[] | null> {
  const t = await loadWorldModel(name); if (!t) return null;
  const out = []; t.scene.updateMatrixWorld(true);
  t.scene.traverse((o: any) => { if (o.isMesh && !o.isSkinnedMesh) { const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); out.push({ geometry: g, material: o.material }); } });
  return out;
}
/** the moves of every model with clips (js/main.ts world updater) */
export function tickWorldModels(dt: number) { for (const m of mixers) m.update(dt); }
/** js/main.ts: start the kit after the start */
export function startWorldModels(G: { heroes: { pos: { x: number, z: number } }[], world?: { updaters: ((dt: number) => void)[] } }, updaters: ((dt: number) => void)[]) {
  let acc = 0;
  updaters.push(dt => { tickWorldModels(dt); acc += dt; if (acc < .25) return; acc = 0; adoptWorldTags(); if (G.heroes.length) wakeWorldModels(G.heroes.map(h => h.pos), 70, 3); });
}
// (v1.08e places, a small kit change for Release) the code shapes tagged with worldTag (js/gfx.ts) wait for their model
// like modelFor; the model gets the code shape's outline, and the code shape's own children (opts.carry) move onto it
export function adoptWorldTags() {
  for (const [obj, name, opts] of WORLD_TAGS.splice(0)) modelFor(obj, name, opts, m => {
    if (!m) return; const fb = obj as THREE.Object3D;
    if (opts.outline) outline(m.obj, opts.outline[0], opts.outline[1]);
    if (opts.carry) for (const c of fb.children.slice()) if (!c.userData.outline) { c.userData.carried = true; m.obj.add(c); }
    m.obj.userData.worldTag = name; m.obj.userData.noSolid = true;   // (the solid map keeps the code shape: js/solids.ts)
    for (const k of ['walk', 'noCam']) if (fb.userData[k]) m.obj.userData[k] = fb.userData[k];
  });
}
