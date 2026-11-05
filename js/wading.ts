// (v1.08e water, owner 6 Nov 2026 AEDT: "all the rivers are too deep; make them shallow, cute and friendlier") the
// friendly shallow water: splash rings round a wading child's legs, and little fish darting near the banks. Both are one
// InstancedMesh (one draw each), hidden when there is nothing to show, and loaded after the start (js/main.ts afterStart).
import { THREE, P, merge, toonVC } from './gfx.js';
import { RIVERS, PONDS, LAKE, WATER, heightAt } from './world.js';
import { seeded } from './util.js';

const RINGS = 24, FISH = 18, NEAR = 42;

export function createWading(G) {
  const { scene, world } = G;
  // ---------- splash rings ----------
  // additive white rings: an instance's colour fading to black fades the ring away, so no per-ring material is needed
  const ringMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false });
  const rings = new THREE.InstancedMesh(new THREE.RingGeometry(.78, 1, 24).rotateX(-Math.PI / 2), ringMat, RINGS);
  rings.frustumCulled = false; rings.renderOrder = 2; rings.userData.noSolid = true; rings.userData.noCam = true; rings.visible = false;
  const life = new Float32Array(RINGS), size = new Float32Array(RINGS), at = new Float32Array(RINGS * 2), m = new THREE.Matrix4(), c = new THREE.Color();
  for (let i = 0; i < RINGS; i++) { rings.setMatrixAt(i, m.makeScale(0, 0, 0)); rings.setColorAt(i, c.setRGB(0, 0, 0)); }
  scene.add(rings);
  let next = 0;
  world.splash = (x: number, z: number, s = .6) => { const i = next; next = (next + 1) % RINGS; life[i] = 1; size[i] = s; at[i * 2] = x; at[i * 2 + 1] = z; rings.visible = true; };

  // ---------- little fish near the banks ----------
  // where they live: shallow water (0.25-0.7 m) beside every river, pond and the lake, worked out once
  const rnd = seeded(1086), spots: number[][] = [];
  const wet = (x: number, z: number) => { const d = WATER - heightAt(x, z); return d > .25 && d < .7; };
  for (const R of RIVERS) for (let i = 0; i < R.pts.length - 1; i++) { const [ax, az] = R.pts[i], [bx, bz] = R.pts[i + 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
    for (let t = 6; t < L; t += 14) for (const side of [-1, 1]) for (let o = 3; o < 10; o += 1) { const x = ax + ux * t - uz * o * side, z = az + uz * t + ux * o * side; if (wet(x, z)) { spots.push([x, z, rnd() * 6.3]); break; } } }
  for (const W of [...PONDS, { x: LAKE.x, z: LAKE.z, r: LAKE.r }]) for (let a = 0; a < 6.28; a += .7) for (let k = 1; k > .3; k -= .08) { const x = W.x + Math.cos(a) * W.r * k, z = W.z + Math.sin(a) * W.r * k; if (wet(x, z)) { spots.push([x, z, rnd() * 6.3]); break; } }
  // a fish: a round little body, a fan tail and a dark eye, in our own colours (orange, gold or silver-blue)
  const body = merge([P(new THREE.SphereGeometry(.16, 8, 6), '#ffffff', [0, 0, 0], [0, 0, 0], [1, .7, .5]), P(new THREE.ConeGeometry(.1, .16, 4), '#ffffff', [-.2, 0, 0], [0, 0, Math.PI / 2], [1, 1, .3]),
    P(new THREE.SphereGeometry(.025, 5, 4), '#20283a', [.1, .03, .065]), P(new THREE.SphereGeometry(.025, 5, 4), '#20283a', [.1, .03, -.065])]);
  const fish = new THREE.InstancedMesh(body, toonVC(), FISH); fish.frustumCulled = false; fish.userData.noSolid = true; fish.userData.noCam = true; fish.visible = false;
  const tones = ['#ff8a3d', '#ffc44d', '#8fc3e8', '#ff6a5a'].map(t => new THREE.Color(t));
  for (let i = 0; i < FISH; i++) { fish.setColorAt(i, tones[i % tones.length]); fish.setMatrixAt(i, m.makeScale(0, 0, 0)); }
  scene.add(fish);
  let near: number[][] = [], pick = 0;
  const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pos = new THREE.Vector3(), scl = new THREE.Vector3(1, 1, 1);
  G.wading = { spots, rings, fish };

  world.updaters.push((dt: number, t: number) => {
    // rings: grow and fade over a second
    if (rings.visible) { let any = false;
      for (let i = 0; i < RINGS; i++) { if (life[i] <= 0) continue; life[i] = Math.max(0, life[i] - dt * 1.1); any = true; const k = 1 - life[i], r = size[i] * (.35 + k * 1.3);
        rings.setMatrixAt(i, m.makeScale(r, 1, r).setPosition(at[i * 2], WATER + .03, at[i * 2 + 1])); rings.setColorAt(i, c.setRGB(life[i], life[i], life[i])); }
      rings.instanceMatrix.needsUpdate = true; if (rings.instanceColor) rings.instanceColor.needsUpdate = true; if (!any) rings.visible = false; }
    // fish: every second, the spots nearest the child; each fish darts in a small loop round its spot, just under the top
    const h = G.heroes && G.heroes[0]; if (!h) return;
    if ((pick -= dt) <= 0) { pick = 1; const hx = h.pos.x, hz = h.pos.z; near = spots.filter(s => Math.abs(s[0] - hx) < NEAR && Math.abs(s[1] - hz) < NEAR).slice(0, FISH); fish.visible = near.length > 0; fish.count = near.length; }
    if (!fish.visible) return;
    for (let i = 0; i < near.length; i++) { const [sx, sz, ph] = near[i], a = t * .7 + ph, rr = 1.1 + Math.sin(ph * 3) * .4;
      pos.set(sx + Math.cos(a) * rr, WATER - .18 + Math.sin(t * 2 + ph) * .03, sz + Math.sin(a) * rr);
      q.setFromAxisAngle(up, -a - Math.PI / 2); scl.setScalar(1 + Math.sin(t * 9 + ph) * .04); fish.setMatrixAt(i, m.compose(pos, q, scl)); }
    fish.instanceMatrix.needsUpdate = true;
  });
}
