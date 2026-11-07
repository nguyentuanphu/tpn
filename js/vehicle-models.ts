// (v1.08e vehicles, owner 6 Nov 2026 AEDT: every vehicle remade in Blender, loaded near the child) The Blender model of
// a vehicle from js/vehicles.ts, put in place of its code shape. Loaded after the start (js/vehicles.ts wear), never in
// the first download.
import { THREE } from './gfx.js';
import { modelFor } from './modelkit.js';

// models/world/veh-<id>.glb (tools/blender/world-vehicles.py, from these very code shapes, so the size, the seat and the
// wheels are where the code puts them). wear(v) asks js/modelkit.ts to swap it in when a child first comes near: the code
// body is hidden, each model wheel (and moving part) goes inside its code wheel, so it turns as the code turns it, and the
// model's named points (seat, handleL/R, pedalL/R ...) become the vehicle's seat, grips and feet. Until the model has
// arrived, or for good when it cannot load, the code shape stays. Only the toy look (the friends' picture-book look):
// the older children's real look and a vehicle in its own colours (args) keep their code shapes.
// (a hidden code wheel keeps turning, empty, with the model wheel inside it: no corners to draw, but the attributes the
// rest of the game reads)
const EMPTY = new THREE.BufferGeometry();
EMPTY.setAttribute('position', new THREE.Float32BufferAttribute([], 3)); EMPTY.setAttribute('normal', new THREE.Float32BufferAttribute([], 3)); EMPTY.setAttribute('color', new THREE.Float32BufferAttribute([], 3));
EMPTY.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 0); EMPTY.boundingBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()); EMPTY.userData.shared = true;
const POINTS: [string, string, number?][] = [['seat', 'seat'], ['seat2', 'passenger'], ['wheelAt', 'wheelAt'], ['handleL', 'grips', 0], ['handleR', 'grips', 1],
  ['pedalL', 'feet', 0], ['pedalR', 'feet', 1], ['handle2L', 'pgrips', 0], ['handle2R', 'pgrips', 1], ['pedal2L', 'pfeet', 0], ['pedal2R', 'pfeet', 1]];
function hideOwn(n, keep) {   // the code meshes of one moving part (not the parts hanging from it)
  if (n.isMesh) { n.userData.codeGeo = n.geometry; n.geometry = EMPTY; n.children.forEach(c => { if (c.userData.outline) c.visible = false; }); return; }
  n.children.forEach(c => { if (c.isMesh && !keep.has(c)) { c.visible = false; c.userData.swapped = true; } }); // (Release, v1.08e: swapped, the code part still counts in the solid map, js/solids.ts, so its saved copy matches on the next start)
}
// (owner, 6 Nov 2026 AEDT: "stylised real") each kind of surface its own look: glossy paint, matte rubber and seats,
// shiny chrome, see-through glass; the colours are in the corners (tools/blender/world-vehicles.py)
const LOOKS = {
  paint: { metalness: .15, roughness: .32 }, matte: { metalness: 0, roughness: .82 }, chrome: { metalness: .85, roughness: .22 },
  glass: { metalness: .3, roughness: .05, transparent: true, opacity: .62, depthWrite: false }, wheel: { metalness: .3, roughness: .55 },
};
const looks = new Map<string, THREE.Material>();
function lookOf(name: string) {
  const k = LOOKS[name] ? name : 'paint';
  if (!looks.has(k)) { const m = new THREE.MeshStandardMaterial({ vertexColors: true, ...LOOKS[k] }); m.name = k; m.userData.shared = true; looks.set(k, m); }
  return looks.get(k);
}
export function dress(root) {
  root.traverse(n => { if (!n.isMesh) return; const k = (n.material && n.material.name) || 'paint'; n.material = lookOf(k); if (k === 'glass') { n.castShadow = false; n.renderOrder = 1; } });
}
export function fitModel(v, m) {
  dress(m.obj);
  const o = v.o, root = m.obj, keep = new Set([o.userData && o.userData.load].filter(Boolean)), _p = new THREE.Vector3();
  root.updateMatrixWorld(true);
  for (const [name, key, i] of POINTS) {   // the named points, in the vehicle's own space
    const e = root.getObjectByName(name), dst = i == null ? v[key] : v[key] && v[key][i]; if (!e || !dst) continue;
    e.getWorldPosition(_p); o.worldToLocal(_p); dst[0] = _p.x; dst[1] = _p.y; dst[2] = _p.z;
  }
  const parts = [];
  root.traverse(n => { if (/^wheel\d+$/.test(n.name) || (n.name && o.userData && o.userData[n.name] && o.userData[n.name].isObject3D)) parts.push(n); });
  for (const n of parts) {
    const code = /^wheel/.test(n.name) ? v.wheels[+n.name.slice(5)] : o.userData[n.name]; if (!code) continue;
    hideOwn(code, keep); code.add(n); n.position.set(0, 0, 0); n.quaternion.identity(); n.userData.fromModel = true;
  }
  v.model = m; return v;
}
export function wearModel(v, done?: (v) => void) {
  const body = v.o.getObjectByName('codeBody'); if (!body) return;
  modelFor(body, 'veh-' + v.id, {}, m => { if (m) fitModel(v, m); if (done) done(v); });
}
