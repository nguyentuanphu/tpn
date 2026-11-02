// Part of the open world (js/world.ts re-exports everything here): levelling the ground under buildings, widening level land, road beds.
// (v1.07, owner 2 Nov 2026 AEDT) moved out of js/world.ts unchanged.
import { THREE, P } from '../gfx.js';
import { CUSTOM } from '../custom.js';
import { keptFloats, rememberFloats } from '../worldmemo.js';
import { FLATS, FOOTPRINTS, FP_GRID, HALF, STUDIO_ON_MAP, WATER, fpAdd, fpKey } from './places.js';
import { heightAt, riverDist, roadDist, setGround } from './ground.js';
import { PLOTS, plotBox } from './sites.js';

export function levelUnderBuildings(world, scene) {
  // remember how far above the ground everything small stands (people, tags, animals, props), to move it with the ground
  const keep = [];
  if (scene) for (const o of scene.children) {
    if (o === world.terrain || o.isLight || o.isInstancedMesh || !o.position) continue;
    if (o.isMesh && o.geometry && !o.userData.plotId) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); if (o.geometry.boundingSphere.radius > 6) continue; }
    keep.push([o, heightAt(o.position.x, o.position.z)]);
  }
  const want = [];
  for (const b of world.boxes) { if (b.room || b.x1 - b.x0 > 40 || b.z1 - b.z0 > 40) continue; want.push({ x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 }); }
  for (const c of world.colliders) if (c.r >= 2.5 && c.r <= 12) want.push({ x0: c.x - c.r * .8, x1: c.x + c.r * .8, z0: c.z - c.r * .8, z1: c.z + c.r * .8 });
  let n = 0;
  for (const F of want) {
    const cx = (F.x0 + F.x1) / 2, cz = (F.z0 + F.z1) / 2, h = heightAt(cx, cz);
    if (h < WATER + .6 || riverDist(cx, cz) < 12) continue;
    const corners = [[F.x0, F.z0], [F.x1, F.z0], [F.x0, F.z1], [F.x1, F.z1]].map(([x, z]) => heightAt(x, z));
    if (Math.max(...corners.map(v => Math.abs(v - h))) < .25) continue; // already flat enough
    const rd = roadDist(cx, cz), half = rd.road ? rd.road.w / 2 : 0, room = rd.d - half - Math.max(F.x1 - F.x0, F.z1 - F.z0) / 2;
    F.pad = Math.max(1.2, Math.min(4, room - 1)); F.h = h; fpAdd(F); n++;
  }
  // (round T3) the spare plots by the cities were chosen from the map alone: one that a building, its levelled ground, a
  // collider or anything standing (35 cm to 1.6 m up) has since landed on is dropped (the Memory Villages' are kept clear by design)
  const stands = [];
  if (scene) { scene.updateMatrixWorld(true); const bb = new THREE.Box3();
    scene.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o === world.terrain || !o.visible || o.userData.plots) return;
      for (let q = o; q; q = q.parent) { const u = q.userData || {}; if (u.road || u.walk || u.avatar || u.moving) return; }
      bb.setFromObject(o); if (bb.max.y - bb.min.y > .3 && bb.max.x - bb.min.x < 40 && bb.max.z - bb.min.z < 40) stands.push(bb.clone()); }); }   // (not the sky, the sea or the ground)
  for (let i = PLOTS.length - 1; i >= PLOTS.spareFrom; i--) { const P = PLOTS[i]; if (P.occupied) continue; // its remembered home is supposed to stand here
    const B = plotBox(P), y = heightAt(P.x, P.z);
    const hit = (x0, x1, z0, z1) => x1 > B.x0 && x0 < B.x1 && z1 > B.z0 && z0 < B.z1;
    if (FOOTPRINTS.some(F => !F.plot && hit(F.x0 - F.pad, F.x1 + F.pad, F.z0 - F.pad, F.z1 + F.pad)) || world.boxes.some(b => !b.room && hit(b.x0, b.x1, b.z0, b.z1))
      || world.colliders.some(c => c.r >= .3 && hit(c.x - c.r, c.x + c.r, c.z - c.r, c.z + c.r))
      || stands.some(b => hit(b.min.x, b.max.x, b.min.z, b.max.z) && b.min.y < y + 1.6 && b.max.y > y + .35)) PLOTS.splice(i, 1);
  }
  // (round T3) each garden plot: level at the height of the lane just in front of it, easing back over its sides
  for (const P of PLOTS) { const B = plotBox(P), fx = Math.sin(P.rot), fz = Math.cos(P.rot);
    const h = heightAt(P.x + fx * (P.d / 2 + .4), P.z + fz * (P.d / 2 + .4)); P.h = h;
    fpAdd({ ...B, pad: .25, h, plot: P.id }); n++; }   // (pad: half the 0.5 m gap between two plots, so one never tilts the next)
  // reshape the terrain where anything changed
  const t = world.terrain; if (!t || !n) return n;
  const pa = t.geometry.attributes.position;
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i), z = pa.getZ(i), list = FP_GRID.get(fpKey(Math.floor(x / 16), Math.floor(z / 16)));
    if (list && list.length) pa.setY(i, heightAt(x, z));
  }
  pa.needsUpdate = true; t.geometry.computeVertexNormals(); t.geometry.computeBoundingSphere();
  for (const [o, h0] of keep) { const d = heightAt(o.position.x, o.position.z) - h0; if (Math.abs(d) > .02 && Math.abs(d) < 6) o.position.y += d; }
  return n;
}

// Widen the level land round every village, town and city (see WIDE), after everything is placed: the ground is
// reshaped, and whatever stands where the ground changed (trees, signs, props, people, roads) moves up or down with
// it, keeping its place on the map.
export function widenFlatLand(world, scene, metres = 10) { reshapeGround(world, scene, () => { setGround('WIDE', metres); }, 'ground-wide-' + metres); }
// switch the road beds on (js/roads.js) and reshape the ground the same careful way
export function roadBedsOn(world, scene) { reshapeGround(world, scene, () => { setGround('RB_ON', true); }, 'ground-roadbeds'); }
// Change the ground (change() alters what heightAt returns), then reshape the terrain and move whatever stands where
// the ground changed (trees, signs, props, people, roads) up or down with it, so nothing shifts on the map.
function reshapeGround(world, scene, change, memo = '') {
  const keep = [], inst = [], roads = [];
  for (const o of scene.children) {
    if (o === world.terrain || o.isLight || !o.position) continue;
    if (o.userData.road) { roads.push(o); continue; }
    if (o.isInstancedMesh) { inst.push(o); continue; }
    if (o.isMesh && o.geometry) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); if (o.geometry.boundingSphere.radius > 45) continue; }
    keep.push([o, heightAt(o.position.x, o.position.z)]);
  }
  const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  const instOld = inst.map(o => { const a = []; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); p.setFromMatrixPosition(m4); a.push(heightAt(p.x, p.z)); } return a; });
  const roadOld = roads.map(o => { const pa = o.geometry.attributes.position, a = new Float32Array(pa.count); for (let i = 0; i < pa.count; i++) a[i] = heightAt(pa.getX(i), pa.getZ(i)); return a; });
  const topOld = world.roadTop ? [...world.roadTop.keys()].map(k => [k, heightAt(Math.round(k / 8192) / 2, (k - Math.round(k / 8192) * 8192) / 2)]) : [];
  change();
  const t = world.terrain;
  // (the ground's new heights: kept on the device after the first start of a build, js/worldmemo.ts)
  if (t) { const pa = t.geometry.attributes.position, kept = memo ? keptFloats(memo, pa.count) : null;
    if (kept) for (let i = 0; i < pa.count; i++) pa.setY(i, kept[i]);
    else { const ys = new Float32Array(pa.count); for (let i = 0; i < pa.count; i++) { ys[i] = heightAt(pa.getX(i), pa.getZ(i)); pa.setY(i, ys[i]); } if (memo) rememberFloats(memo, ys); } pa.needsUpdate = true; t.geometry.computeVertexNormals(); t.geometry.computeBoundingSphere(); }
  for (const [o, h0] of keep) { const d = heightAt(o.position.x, o.position.z) - h0; if (Math.abs(d) > .01) o.position.y += d; }
  inst.forEach((o, k) => { let ch = false; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); m4.decompose(p, q, sc); const d = heightAt(p.x, p.z) - instOld[k][i]; if (Math.abs(d) > .01) { p.y += d; m4.compose(p, q, sc); o.setMatrixAt(i, m4); ch = true; } } if (ch) { o.instanceMatrix.needsUpdate = true; o.computeBoundingSphere && o.computeBoundingSphere(); } });
  roads.forEach((o, k) => { const pa = o.geometry.attributes.position; let ch = false; for (let i = 0; i < pa.count; i++) { const d = heightAt(pa.getX(i), pa.getZ(i)) - roadOld[k][i]; if (Math.abs(d) > .01) { pa.setY(i, pa.getY(i) + d); ch = true; } } if (ch) { pa.needsUpdate = true; o.geometry.computeVertexNormals(); o.geometry.computeBoundingSphere(); } });
  for (const [k, h0] of topOld) { const d = heightAt(Math.round(k / 8192) / 2, (k - Math.round(k / 8192) * 8192) / 2) - h0; if (Math.abs(d) > .01) world.roadTop.set(k, world.roadTop.get(k) + d); }
}

// More level land drawn by the family in Sparkle Studio (content pack "world.land"): each rectangle becomes flat
// ground at the height of its middle, with the same gentle edge as the towns, ready for new houses.
for (const L of (STUDIO_ON_MAP && CUSTOM.world && Array.isArray(CUSTOM.world.land) ? CUSTOM.world.land : []).slice(0, 40)) {
  if (!L || ![L.x0, L.x1, L.z0, L.z1].every(v => typeof v === 'number' && isFinite(v))) continue;
  const x0 = Math.max(-HALF + 10, Math.min(L.x0, L.x1)), x1 = Math.min(HALF - 10, Math.max(L.x0, L.x1)), z0 = Math.max(-HALF + 10, Math.min(L.z0, L.z1)), z1 = Math.min(HALF - 10, Math.max(L.z0, L.z1));
  if (x1 - x0 < 2 || z1 - z0 < 2 || x1 - x0 > 120 || z1 - z0 > 120) continue;
  const h = typeof L.h === 'number' && isFinite(L.h) ? Math.max(1, Math.min(30, L.h)) : Math.max(1.2, heightAt((x0 + x1) / 2, (z0 + z1) / 2));
  FLATS.push({ x0, x1, z0, z1, h, family: true });
}
