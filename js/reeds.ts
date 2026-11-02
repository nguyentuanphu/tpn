// (round T4a) Reeds along the river banks and round the lakes, and water hyacinth floating in the quiet waters (the
// Mekong channels, the Hội An canal, the Yarra and the Murray, the ponds and the billabong). Each kind is one instanced
// mesh, so all of them together are two draws. Reeds are under 1.4 m, so the solid map leaves them out (a child walks
// through them), and they keep clear of roads, bridges, piers, places, garden plots and anything to tap.
import { THREE, toonVC, P, merge } from './gfx.js';
import { RIVERS, PONDS, LAKE, LOTS, WATER, heightAt, roadDist, bridgeAt, levelAt } from './world.js';
import { seeded, dist2 } from './util.js';

const QUIET = new Set(['mekong1', 'mekong2', 'hoian_canal', 'yarra', 'murray']);   // slow waters where hyacinth floats (no boat runs on them)

export function createReeds(G) {
  const { scene } = G, rnd = seeded(20261011), reeds = [], lilies = [];
  const piers = []; for (const F of (G.ferries && G.ferries.ferries) || []) for (const s of F.stops || []) { const l = s.dock && s.dock.pier && s.dock.pier.land; if (l) piers.push(l); }
  const free = (x, z) => { const rd = roadDist(x, z); if (rd.road && rd.d < rd.road.w / 2 + 2.5) return false;
    if (bridgeAt(x, z, 12, 8) || levelAt(x, z) !== null || piers.some(p => dist2(x, z, p.x, p.z) < 8)) return false;
    if (G.world.platforms.some(b => x > b.x0 - 2 && x < b.x1 + 2 && z > b.z0 - 2 && z < b.z1 + 2)) return false;   // every pier and deck, end to end
    if (LOTS.some(L => dist2(x, z, L.x, L.z) < 9) || G.interactables.some(it => Number.isFinite(it.x) && dist2(x, z, it.x, it.z) < 3)) return false;
    return Math.abs(x) < 236 && Math.abs(z) < 236; };
  // from a point in the water, walk out along (ux, uz) to the shore: the first spot at least 5 cm above the water
  const shore = (x, z, ux, uz, max) => { for (let d = 0; d < max; d += .5) { const px = x + ux * d, pz = z + uz * d; if (heightAt(px, pz) > WATER + .05) return [px, pz]; } return null; };
  const bank = (x, z, ux, uz, max, quiet) => {
    const s = shore(x, z, ux, uz, max); if (!s) return;
    if (rnd() < .5) { const j = rnd() * 1.2, px = s[0] + ux * j, pz = s[1] + uz * j, h = heightAt(px, pz); if (h < WATER + .9 && free(px, pz)) reeds.push([px, h, pz, rnd() * 6.3, .8 + rnd() * .5]); }
    if (quiet && rnd() < .3) { const j = 1 + rnd() * 1.5, px = s[0] - ux * j, pz = s[1] - uz * j; if (heightAt(px, pz) < WATER - .3 && free(px, pz)) lilies.push([px, WATER + .04, pz, rnd() * 6.3, .8 + rnd() * .5]); }
  };
  for (const R of RIVERS) {
    const quiet = QUIET.has(R.id);
    for (let i = 0; i < R.pts.length - 1; i++) { const [ax, az] = R.pts[i], [bx, bz] = R.pts[i + 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
      for (let t = 0; t < L; t += 3) { const x = ax + ux * t, z = az + uz * t; if (heightAt(x, z) > WATER - .3) continue;
        bank(x, z, -uz, ux, 20 * R.w, quiet); bank(x, z, uz, -ux, 20 * R.w, quiet); } }
  }
  // round the lake and every pond (hyacinth in the ponds; the lake ferry's water stays open)
  for (const W of [{ x: LAKE.x, z: LAKE.z, r: LAKE.r, quiet: false }, ...PONDS.map(p => ({ ...p, quiet: true }))])
    for (let a = 0; a < Math.PI * 2; a += 3 / W.r) bank(W.x, W.z, Math.cos(a), Math.sin(a), W.r * 1.2, W.quiet);

  const blade = (x, z, h, lean, c) => P(new THREE.ConeGeometry(.06, h, 4), c, [x, h / 2, z], [lean, 0, -lean]);
  const reedGeo = merge([blade(0, 0, 1.25, .05, '#6f9a4a'), blade(.18, .08, 1.05, -.12, '#7fae52'), blade(-.15, .1, .95, .14, '#5f8c40'), blade(.06, -.17, 1.15, .1, '#88b45c'),
    blade(-.1, -.12, .85, -.16, '#6f9a4a'), P(new THREE.CylinderGeometry(.05, .05, .22, 6), '#7a4e2c', [.02, 1.08, .02]), P(new THREE.CylinderGeometry(.045, .045, .2, 6), '#6e4426', [-.12, .92, .1])]);
  const lilyGeo = merge([P(new THREE.CylinderGeometry(.42, .42, .03, 10), '#4f9a52', [0, 0, 0]), P(new THREE.CylinderGeometry(.3, .3, .03, 9), '#5fae5c', [.45, 0, .2]),
    P(new THREE.SphereGeometry(.13, 8, 6), '#b07ad8', [.05, .12, 0]), P(new THREE.SphereGeometry(.1, 8, 6), '#c99ae8', [.15, .16, .06])]);
  const out = [];
  for (const [geo, list, name] of [[reedGeo, reeds, 'reeds'], [lilyGeo, lilies, 'hyacinth']]) {
    if (!list.length) continue;
    const mesh = new THREE.InstancedMesh(geo, toonVC(), list.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    list.forEach(([x, y, z, rot, s], i) => { q.setFromAxisAngle(up, rot); m.compose(new THREE.Vector3(x, name === 'reeds' ? y - .05 : y, z), q, new THREE.Vector3(s, s, s)); mesh.setMatrixAt(i, m); });
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.userData[name] = true; scene.add(mesh); out.push(mesh);
  }
  return { reeds: reeds.length, hyacinth: lilies.length, meshes: out };
}
