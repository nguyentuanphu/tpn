// (v1.08g creatures, owner 6 Nov 2026 AEDT: "Cac con rong, con chim deu etc phai blender thiet dep"; pop-up: butterflies
// stay butterflies, add little birds) The valley's little flocks drawn with Blender models (models/world/flock-*.glb,
// tools/blender/world-flocks.py) in place of their 2D pictures: the village's little hens, the ducks on the lake and the
// farm pond, the farm pond's fish, Perth's black swans and the butterflies; and a new flock of little birds over the trees.
// - One InstancedMesh per kind (worldModelParts, js/modelkit.ts); every frame each copy goes where its picture is (the
//   pictures still move as before: js/world.ts, js/farm.ts, js/animalhomes.ts) and faces the way it moves, with a little
//   move of its own: hens peck, ducks and swans bob, fish wiggle, butterflies and birds flap (their wings are their own
//   InstancedMesh, mirrored for the other side).
// - A kind's model is fetched when a child first comes within NEAR m of one of its members; until then, and with no
//   network, the pictures stay. The pictures are hidden while the models draw, but stay in place for taps and stickers.
// - Loaded after the start (js/main.ts): nothing here is in the first download.
import { THREE } from './gfx.js';
import { worldModelParts, worldModelFailed } from './modelkit.js';
import { heightAt } from './world.js';
import { PLATEAU } from './world/places.js';

type Member = { s: THREE.Object3D, kind: string, c?: { inside?: boolean }, px?: number, pz?: number, yaw?: number, ph: number };
type Kind = { name: string, wing?: string, drop: number, members: Member[], mesh?: THREE.InstancedMesh, wingMesh?: THREE.InstancedMesh, asked?: boolean, tint?: THREE.Color[] };
const NEAR = 80;
export const flockStats = { kinds: 0, drawn: 0, failed: 0 };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _w = new THREE.Matrix4();

async function geo(name: string) { const r = await worldModelParts(name); if (!r || !r[0]) return null; return { g: r[0].geometry, mat: r[0].material }; }

export function createFlocks(G) {
  const { scene, world } = G, kinds: Record<string, Kind> = {};
  const K = (key: string, name: string, drop: number, wing?: string, tint?: string[]) => (kinds[key] = kinds[key] || { name, wing, drop, members: [], tint: tint && tint.map(c => new THREE.Color(c)) });
  // the pictures: drop = how far below the picture's middle the model's feet (or waterline) are
  K('hen', 'flock-hen', .5); K('rooster', 'flock-rooster', .5); K('duck', 'flock-duck', .38); K('fish', 'flock-fish', .1); K('clownfish', 'flock-clownfish', .1);
  K('swan', 'flock-swan', .42); K('butterfly', 'flock-butterfly', 0, 'flock-butterfly-wing', ['#ff9ac2', '#ffd23f', '#7fd0ff', '#b58cff', '#ff9f43', '#7ed67a']);
  const add = (kind: string, s: THREE.Object3D, c?: Member['c']) => { if (s) kinds[kind].members.push({ s, kind, c, ph: Math.random() * 6.28 }); };
  let hen = 0;
  for (const c of world.critters || []) add(c.water ? 'duck' : c.fly ? 'butterfly' : (hen++ % 2 ? 'rooster' : 'hen'), c.s, c);
  const F = G.farm; if (F) { (F.fish || []).forEach((f, k) => add(k % 2 ? 'fish' : 'clownfish', f.s)); add('duck', F.duck); }
  for (const s of world.swans || []) add('swan', s);
  // (pop-up) a new flock of little birds circling over the trees round home: no picture before, so only the models
  const birds = K('bird', 'flock-bird', 0, 'flock-bird-wing'), cx = PLATEAU.x, cz = PLATEAU.z;
  for (let i = 0; i < 9; i++) { const o = new THREE.Object3D(); o.userData.circle = { a: i * .7, r: 14 + (i % 3) * 5, h: 7 + (i % 4) * 1.5, sp: .35 + (i % 3) * .08 }; o.position.set(cx + Math.cos(i * .7) * 14, 0, cz + Math.sin(i * .7) * 14); birds.members.push({ s: o, kind: 'bird', ph: i }); }

  const near = (k: Kind) => k.members.some(m => G.heroes.some(h => Math.hypot(h.pos.x - m.s.position.x, h.pos.z - m.s.position.z) < NEAR));
  async function load(k: Kind) {
    k.asked = true; const [b, w] = await Promise.all([geo(k.name), k.wing ? geo(k.wing) : Promise.resolve(null)]);
    if (!b || (k.wing && !w)) { flockStats.failed++; return; }
    const make = (g: { g: THREE.BufferGeometry, mat: THREE.Material }, n: number) => { const im = new THREE.InstancedMesh(g.g, g.mat, n); im.castShadow = true; im.userData.noSolid = true; im.userData.flock = k.name; im.frustumCulled = true; scene.add(im); return im; };
    k.mesh = make(b, k.members.length); if (w) k.wingMesh = make(w, k.members.length * 2);
    if (k.tint) k.members.forEach((m, i) => { const c = k.tint[i % k.tint.length]; k.wingMesh.setColorAt(i * 2, c); k.wingMesh.setColorAt(i * 2 + 1, c); });
    flockStats.kinds++;
  }
  let t = 0;
  world.updaters.push((dt: number) => {
    t += dt;
    // (Perth's swans are made later, with Season 2's places: js/s2au-region.ts lists them in world.swans)
    const sw = world.swans || [], swan = kinds.swan; if (sw.length > swan.members.length && !swan.mesh) for (const q of sw.slice(swan.members.length)) add('swan', q);
    for (const k of Object.values(kinds)) {
      if (!k.members.length) continue;
      if (!k.mesh) { if (!k.asked && !worldModelFailed(k.name) && near(k)) void load(k); continue; }
      let n = 0;
      k.members.forEach((m, i) => {
        const s = m.s, cc = s.userData.circle;
        if (cc) { cc.a += dt * cc.sp; s.position.set(cx + Math.cos(cc.a) * cc.r, heightAt(cx, cz) + cc.h + Math.sin(t * 1.3 + i) * .5, cz + Math.sin(cc.a) * cc.r); }
        else s.visible = false;   // (the picture stays where it is, for taps)
        const gone = m.c && m.c.inside;
        const dx = s.position.x - (m.px ?? s.position.x), dz = s.position.z - (m.pz ?? s.position.z); m.px = s.position.x; m.pz = s.position.z;
        if (dx * dx + dz * dz > 1e-6) { const want = Math.atan2(dx, dz); let d = want - (m.yaw ?? want); d = Math.atan2(Math.sin(d), Math.cos(d)); m.yaw = (m.yaw ?? want) + d * Math.min(1, dt * 8); }
        const ph = t * 6 + m.ph; let pitch = 0, roll = 0, bob = 0;
        if (k.name === 'flock-hen' || k.name === 'flock-rooster') { pitch = Math.max(0, Math.sin(ph * .45)) ** 6 * .6; bob = Math.abs(Math.sin(ph)) * .02; }
        else if (k.name === 'flock-duck' || k.name === 'flock-swan') { bob = Math.sin(ph * .4) * .015; roll = Math.sin(ph * .3) * .05; }
        else if (k.name.includes('fish')) { m.yaw = (m.yaw || 0) + Math.sin(ph * 1.5) * .02; roll = Math.sin(ph * 1.5) * .15; }
        _p.set(s.position.x, s.position.y - k.drop + bob, s.position.z); _e.set(pitch, m.yaw || 0, roll, 'YXZ'); _q.setFromEuler(_e);
        _s.setScalar(gone ? 0 : 1); _m.compose(_p, _q, _s); k.mesh.setMatrixAt(i, _m);
        if (k.wingMesh) { const flap = Math.sin(t * (k.name === 'flock-bird' ? 18 : 10) + m.ph) * .9;
          for (const side of [1, -1]) { _e.set(0, 0, side * flap, 'XYZ'); _w.makeRotationFromEuler(_e); _w.premultiply(new THREE.Matrix4().makeScale(side, 1, 1)); _w.premultiply(_m); k.wingMesh.setMatrixAt(i * 2 + (side > 0 ? 0 : 1), _w); } }
        n++;
      });
      k.mesh.instanceMatrix.needsUpdate = true; k.mesh.computeBoundingSphere();
      if (k.wingMesh) { k.wingMesh.instanceMatrix.needsUpdate = true; if (k.wingMesh.instanceColor) k.wingMesh.instanceColor.needsUpdate = true; k.wingMesh.computeBoundingSphere(); }
      flockStats.drawn = n;
    }
  });
  G.flocks = { kinds, stats: flockStats };
  return G.flocks;
}
