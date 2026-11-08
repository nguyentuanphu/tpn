// Shared 3D helpers: cel-shaded materials, geometry merging, emoji sprites.
import * as THREE from '../vendor/three.module.js';
export { THREE };

// "Summer afternoon" look: flat, painterly colours with soft two-tone light and shade, like an
// illustrated picture book. Everything uses the same few shading bands so the whole valley matches.
// (The names "toon" are kept so the rest of the code reads the same.)
const bands = (() => {
  const d = new Uint8Array([150, 205, 238, 255]);
  const t = new THREE.DataTexture(d, d.length, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true; return t;
})();
const PBR_ONLY = ['roughness', 'metalness', 'envMapIntensity', 'clearcoat'];
const clean = extra => { const o = Object.assign({}, extra || {}); PBR_ONLY.forEach(k => delete o[k]); return o; };
const matCache = {};
export function toon(color, extra?) {
  const key = extra ? null : color;
  if (key && matCache[key]) return matCache[key];
  const m = new THREE.MeshToonMaterial(Object.assign({ color: new THREE.Color(color), gradientMap: bands }, clean(extra)));
  if (key) { matCache[key] = m; m.userData.shared = true; }
  return m;
}
// vertex-coloured models are faceted like cut paper (trees, rocks, houses)
export const toonVC = (extra?) => new THREE.MeshToonMaterial(Object.assign({ vertexColors: true, gradientMap: bands, flatShading: true }, clean(extra)));
export const toonSmooth = (extra?) => new THREE.MeshToonMaterial(Object.assign({ vertexColors: true, gradientMap: bands }, clean(extra)));
export const glow = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });

// Merge several (geometry, colour, matrix) parts into one vertex-coloured geometry.
const _m = new THREE.Matrix4(), _c = new THREE.Color();
const _r = new THREE.Matrix4(), _s = new THREE.Matrix4();
export function P(geo, color, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) {
  const sc = typeof scl === 'number' ? [scl, scl, scl] : scl;
  // A hip roof is a 4-sided cone turned 45° (so its base is a square) and then stretched to the building. Stretching
  // has to come after the turn, or the base becomes a slanted diamond and the roof sits crooked on a long building.
  if (geo.type === 'ConeGeometry' && geo.parameters.radialSegments === 4 && !rot[0] && !rot[2] && sc[0] !== sc[2]) {
    _r.makeRotationY(rot[1]); _s.makeScale(...(sc as [number, number, number])); _m.makeTranslation(...(pos as [number, number, number])).multiply(_s).multiply(_r);
  } else _m.compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...sc));
  const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(_m);
  return { g, color };
}
// (v1.08e places) a code shape that a Blender model (models/world/<name>.glb) takes over when a child comes near:
// js/modelkit.ts picks this list up after the start (nothing is loaded here). opts: as modelFor, plus outline [width,
// colour] for the model (the same edge as the code shape) and carry (the code shape's own children, such as a clock face
// or a turning wheel, move onto the model so they stay seen).
// (v1.08 startup, PERF-001) afterGameStart(): resolves when the valley's game has started (js/main.ts, with its other
// after-the-start parts), so the Blender model code (js/modelkit.ts, the GLTF loader) and the models are not in the first
// download. A page with no valley booting (Sparkle Studio, a check's page) gets it at once.
let gameStart: Promise<void> | null = null, gameStartDone: (() => void) | null = null;
export const gameBooting = () => { if (!gameStart) gameStart = new Promise<void>(r => { gameStartDone = r; }); };
export const gameStarted = () => { if (gameStartDone) gameStartDone(); else gameStart = Promise.resolve(); };
export const afterGameStart = (): Promise<void> => gameStart || Promise.resolve();
export const WORLD_TAGS: [any, string, any][] = [];
export const worldTag = <T>(obj: T, name: string, opts: any = {}): T => { WORLD_TAGS.push([obj, name, opts]); return obj; };
// a short name for a merged shape (houses, stalls: one model for every copy of the same shape): from its corners and colours
export function geoKey(g: THREE.BufferGeometry) {
  let h = 2166136261; const add = (a: ArrayLike<number>) => { for (let i = 0; i < a.length; i++) h = Math.imul(h ^ Math.round(a[i] * 100), 16777619); };
  add(g.attributes.position.array); if (g.attributes.color) add(g.attributes.color.array);
  return (h >>> 0).toString(36);
}
export function merge(parts) {
  let n = 0; parts.forEach(p => n += p.g.attributes.position.count);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  for (const p of parts) {
    // (v1.08e places) a part with no colour keeps the colours in its own corners (a Blender prop: js/festivals.ts)
    const a = p.g.attributes.position, b = p.g.attributes.normal, vc = p.color == null ? p.g.attributes.color : null; if (!vc) _c.set(p.color);
    for (let i = 0; i < a.count; i++, o++) {
      pos[o * 3] = a.getX(i); pos[o * 3 + 1] = a.getY(i); pos[o * 3 + 2] = a.getZ(i);
      nor[o * 3] = b.getX(i); nor[o * 3 + 1] = b.getY(i); nor[o * 3 + 2] = b.getZ(i);
      if (vc) { col[o * 3] = vc.getX(i); col[o * 3 + 1] = vc.getY(i); col[o * 3 + 2] = vc.getZ(i); } else { col[o * 3] = _c.r; col[o * 3 + 1] = _c.g; col[o * 3 + 2] = _c.b; }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeBoundingSphere();
  return g;
}

import { artSVG } from './art.js';
const emojiMats = {};
export function emojiMat(ch) {
  if (!emojiMats[ch]) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.font = '100px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 64, 72);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    // the game's own drawn picture replaces the emoji as soon as it has loaded (js/art.js)
    const a = artSVG(ch);
    if (a) { const img = new Image(); img.onload = () => { x.clearRect(0, 0, 128, 128); x.drawImage(img, 8, 8, 112, 112); t.needsUpdate = true; }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(a); }
    emojiMats[ch] = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }); emojiMats[ch].userData.shared = true;
  }
  return emojiMats[ch];
}
export function sprite(ch, size = 1) { const s = new THREE.Sprite(emojiMat(ch)); s.scale.setScalar(size); return s; }

export const blobShadow = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 4, 32, 32, 32); g.addColorStop(0, 'rgba(20,40,20,.45)'); g.addColorStop(1, 'rgba(20,40,20,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false });
  const geo = new THREE.CircleGeometry(.7, 24).rotateX(-Math.PI / 2);
  return () => new THREE.Mesh(geo, mat);
})();

// (v1.08e faces, part 2: owner 6 Nov 2026 AEDT "better refinement") the people's look: a smoother ramp of five soft bands
// (more depth than the valley's four) and a soft warm rim light on the edges turned away from the camera, so a person
// stands out from the grass and the walls. One shader for every person (no new picture, no extra draw).
const personBands = (() => {
  const d = new Uint8Array([128, 166, 200, 228, 246, 255]);
  const t = new THREE.DataTexture(d, d.length, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true; return t;
})();
export const RIM = { color: new THREE.Color('#fff1d6'), strength: .24 };
const rimUniforms = { uRimCol: { value: RIM.color }, uRim: { value: RIM.strength } };
export function personLook(m) {
  if (!m || !m.isMeshToonMaterial || m.userData.person) return m;
  m.userData.person = true; m.gradientMap = personBands;
  const before = m.onBeforeCompile; // (a material's own change goes first: the friend models' corner light, js/friend-model.ts)
  m.onBeforeCompile = (sh, r) => {
    if (before) before.call(m, sh, r);
    Object.assign(sh.uniforms, rimUniforms);
    sh.fragmentShader = 'uniform vec3 uRimCol;\nuniform float uRim;\n' + sh.fragmentShader.replace('#include <opaque_fragment>',
      'float rimK = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);\noutgoingLight += uRimCol * uRim * smoothstep(.55, 1.0, rimK);\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => 'person' + (m.userData.cornerLight ? '-corner' : ''); m.needsUpdate = true; return m;
}
/** an outline for a skinned model (the friends' Blender models): the same inverted hull, bent by the same bones */
export function outlineSkinned(o, width = .011, color = '#6a4a3a') {
  const key = 'skin' + width + color; let m = outlineMats[key];
  if (!m) { m = outlineMats[key] = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide }); m.userData.shared = true;
    m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normalize(normal) * ${width.toFixed(4)};`); };
    m.customProgramCacheKey = () => 'outlineSkin' + key; }
  const h = new THREE.SkinnedMesh(o.geometry, m); h.bind(o.skeleton, o.bindMatrix); h.frustumCulled = false; h.userData.outline = true; h.raycast = () => { };
  h.position.copy(o.position); h.quaternion.copy(o.quaternion); h.scale.copy(o.scale); o.parent.add(h); return h;
}

// Soft ink outline (inverted hull) for the picture-book look. Returns the outline meshes so far-away
// characters can hide theirs. Transparent meshes (faces, glass wings, shadows) are skipped.
const outlineMats = {};
export function outline(obj, width = .011, color = '#6a4a3a') {
  const key = width + color;
  let m = outlineMats[key];
  if (!m) {
    m = outlineMats[key] = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide }); m.userData.shared = true;
    m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normalize(normal) * ${width.toFixed(4)};`); };
    m.customProgramCacheKey = () => 'outline' + key;
  }
  const add = [];
  obj.traverse(o => { if (o.isMesh && !o.userData.outline && !o.material.transparent && o.geometry.attributes.normal) add.push(o); });
  // (v1.08) a bending limb's outline bends with it (js/avatar.ts bendMat): its own material, the same knee
  return add.map(o => { const u = o.userData.bend; let h: THREE.Mesh;
    if (u) {
      const bm = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
      bm.onBeforeCompile = sh => { sh.uniforms.uBend = u; sh.vertexShader = 'attribute float bendW;\nuniform mat4 uBend;\n' + sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normalize(normal) * ${width.toFixed(4)};\nif (bendW > .5) transformed = (uBend * vec4(transformed, 1.)).xyz;`); };
      bm.customProgramCacheKey = () => 'outlineBend' + key;
      h = new THREE.Mesh(o.geometry, bm); h.onBeforeRender = o.onBeforeRender;
    } else h = new THREE.Mesh(o.geometry, m);
    h.userData.outline = true; h.raycast = () => { }; o.add(h); return h; });
}
