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
export function toon(color, extra) {
  const key = extra ? null : color;
  if (key && matCache[key]) return matCache[key];
  const m = new THREE.MeshToonMaterial(Object.assign({ color: new THREE.Color(color), gradientMap: bands }, clean(extra)));
  if (key) { matCache[key] = m; m.userData.shared = true; }
  return m;
}
// vertex-coloured models are faceted like cut paper (trees, rocks, houses)
export const toonVC = extra => new THREE.MeshToonMaterial(Object.assign({ vertexColors: true, gradientMap: bands, flatShading: true }, clean(extra)));
export const toonSmooth = extra => new THREE.MeshToonMaterial(Object.assign({ vertexColors: true, gradientMap: bands }, clean(extra)));
export const glow = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });

// Merge several (geometry, colour, matrix) parts into one vertex-coloured geometry.
const _m = new THREE.Matrix4(), _c = new THREE.Color();
const _r = new THREE.Matrix4(), _s = new THREE.Matrix4();
export function P(geo, color, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) {
  const sc = typeof scl === 'number' ? [scl, scl, scl] : scl;
  // A hip roof is a 4-sided cone turned 45° (so its base is a square) and then stretched to the building. Stretching
  // has to come after the turn, or the base becomes a slanted diamond and the roof sits crooked on a long building.
  if (geo.type === 'ConeGeometry' && geo.parameters.radialSegments === 4 && !rot[0] && !rot[2] && sc[0] !== sc[2]) {
    _r.makeRotationY(rot[1]); _s.makeScale(...sc); _m.makeTranslation(...pos).multiply(_s).multiply(_r);
  } else _m.compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...sc));
  const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(_m);
  return { g, color };
}
export function merge(parts) {
  let n = 0; parts.forEach(p => n += p.g.attributes.position.count);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  for (const p of parts) {
    const a = p.g.attributes.position, b = p.g.attributes.normal; _c.set(p.color);
    for (let i = 0; i < a.count; i++, o++) {
      pos[o * 3] = a.getX(i); pos[o * 3 + 1] = a.getY(i); pos[o * 3 + 2] = a.getZ(i);
      nor[o * 3] = b.getX(i); nor[o * 3 + 1] = b.getY(i); nor[o * 3 + 2] = b.getZ(i);
      col[o * 3] = _c.r; col[o * 3 + 1] = _c.g; col[o * 3 + 2] = _c.b;
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
  return add.map(o => { const h = new THREE.Mesh(o.geometry, m); h.userData.outline = true; h.raycast = () => { }; o.add(h); return h; });
}
