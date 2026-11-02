// Finding room in the valley for something new (round R story: the đình of Làng Sen, the Huệ Nghi yard). Everything
// already standing near the place (houses, kiosks, stalls, trees, poles) is taken as its footprint on the ground; the
// flat, dry spot off the roads with the widest room round it wins, a little nearer the middle breaking ties.
import { THREE } from './gfx.js';
import { heightAt, roadDist, WATER } from './world.js';

// cx, cz: the middle to search round; rmax: how far out; need: room kept clear of roads, colliders and buttons;
// flatR: how far round the ground must be level; want: room beyond which more doesn't count
export function openSpot(G, { cx, cz, rmax, need = 6, flatR = 6, want = 10, levelTo = null, distW = .1 }) {
  const { scene, world } = G, near = [], bb = new THREE.Box3(), reach = rmax + 12;
  for (const o of scene.children) {
    if (!o.visible || o.isLight || o.isCamera || (o.userData && o.userData.noSolid)) continue;
    bb.setFromObject(o); if (bb.isEmpty()) continue;
    if (bb.max.x - bb.min.x > 40 || bb.max.z - bb.min.z > 40 || bb.max.y - bb.min.y < .4) continue; // the ground, the sky, the water, flat decals
    if (bb.max.x < cx - reach || bb.min.x > cx + reach || bb.max.z < cz - reach || bb.min.z > cz + reach) continue;
    near.push([bb.min.x, bb.max.x, bb.min.z, bb.max.z]);
  }
  const room = (x, z) => { let m = 99; for (const [x0, x1, z0, z1] of near) m = Math.min(m, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1))); return m; };
  const free = (x, z, r) => heightAt(x, z) > WATER + .4 && !world.colliders.some(c => c.r > 0 && c.top == null && Math.hypot(c.x - x, c.z - z) < c.r + r)
    && !world.boxes.some(b => x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) && (d => !d.road || d.d > d.road.w / 2 + r)(roadDist(x, z))
    && G.interactables.every(i => !Number.isFinite(i.x) || Math.hypot(i.x - x, i.z - z) > r);
  const flat = (x, z, r) => { const h0 = heightAt(x, z); if (levelTo != null && Math.abs(h0 - levelTo) > .3) return false; for (let a = 0; a < 8; a++) if (Math.abs(heightAt(x + Math.cos(a) * r, z + Math.sin(a) * r) - h0) > .6) return false; return true; };
  let best = -1, at = null;
  for (let k = 0; k < 1400; k++) {
    const a = k * 2.39996, d = 4 + k * (rmax / 1400), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    if (!free(x, z, need) || !flat(x, z, flatR)) continue;
    const score = Math.min(room(x, z), want) * 3 - d * distW;
    if (score > best) { best = score; at = [x, z]; }
  }
  return at && { x: at[0], z: at[1], room: room(at[0], at[1]) };
}

// how much room there is round (x, z): the distance to the nearest thing standing there (for the checks)
export function openRoom(G, x, z) {
  const bb = new THREE.Box3(); let m = 99;
  for (const o of G.scene.children) {
    if (!o.visible || o.isLight || o.isCamera || (o.userData && (o.userData.noSolid || o.userData.yard))) continue;
    bb.setFromObject(o); if (bb.isEmpty() || bb.max.x - bb.min.x > 40 || bb.max.z - bb.min.z > 40 || bb.max.y - bb.min.y < .4) continue;
    m = Math.min(m, Math.hypot(Math.max(bb.min.x - x, 0, x - bb.max.x), Math.max(bb.min.z - z, 0, z - bb.max.z)));
  }
  return m;
}
