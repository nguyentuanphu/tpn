// See-through things (bug #33, world core): when a house, stall, tree or other solid thing stands between the camera
// and a child, the camera stays where it is and that thing fades to see-through, so the child can still see their
// character. The camera (js/player.js) calls mark() once per frame for each child; the main loop calls step() once per
// frame to fade things out and back in. Nothing is moved or changed for good: a faded thing gets its own copy of the
// material (so the other houses of the same kind stay solid), and goes back to the shared one when it is clear again.
import { THREE } from './gfx.js';
import { VENDORS } from './vendors.js';
const SELLERS = new Map(VENDORS.map(v => [v.id, v]));

// How see-through things in the way become: the share of their normal opacity that is left (owner, 10 Oct AEST: "try
// 80-90%" see-through, so 0.15). One number to tune.
export const SEE_THROUGH_OPACITY = .15;
const FADE_SPEED = 5;    // opacity changes per second (about a fifth of a second to fade)
const MIN_R = .7;        // smaller meshes (lamps, signs, parts of a stall) are not worth testing
const MAX_R = 120;       // bigger ones are the land and sky
const REFRESH_MS = 8000; // how often the list of things that can be in the way is rebuilt

export function createSeeThrough(G) {
  const scene = G.scene, ray = new THREE.Raycaster(), dir = new THREE.Vector3(), from = new THREE.Vector3(), sph = new THREE.Sphere();
  const marked = new Set();            // roots (and tree ids) in the way this frame
  const fading = new Map();            // root -> { parts: [{ o, orig, mat }], a }
  const ghosts = new Map();            // 'tileId:i' -> { im, i, mesh, mat, m, a }
  const rootCache = new WeakMap();     // mesh -> its thing (the whole house, not one wall)
  const partsCache = new WeakMap();    // root -> its meshes
  const instance = new THREE.Matrix4();
  const dims = new WeakMap();          // tree geometry -> { h, r }
  const originals = new WeakMap();    // temporary fade copies must not exclude an occluder on refresh
  let cands = [], at = -1e9;

  const isHero = o => G.heroes.some(h => h.av.root.getObjectById(o.id));
  const isPerson = o => { for (let p = o; p && p !== scene; p = p.parent) if (p.userData.avatar) return true; return isHero(o); };
  const collect = () => {
    cands = [];
    scene.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || o.userData.outline || o.userData.noCam || o.userData.road || o.userData.roomShape || o === G.world.terrain || !o.visible) return; // (a room's walls and floor are one shape: never fade the whole room)
      const mt = originals.get(o) || o.material;
      if (!mt || Array.isArray(mt) || (mt.transparent && mt.opacity < .98 && !o.userData.camOccluder) || mt.side === THREE.BackSide) return;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      sph.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
      if (sph.radius < MIN_R || sph.radius > MAX_R || isPerson(o)) return;
      cands.push({ o, x: sph.center.x, y: sph.center.y, z: sph.center.z, r: sph.radius });
    });
  };
  // the whole house or stall (the top-level shape in the scene), unless that is huge: then just the one mesh
  const rootOf = o => {
    let r = rootCache.get(o); if (r) return r;
    r = o; while (r.parent && r.parent !== scene) r = r.parent;
    let n = 0; r.traverse(c => { if (c.isMesh) n++; });
    if (n > 400 || r.isInstancedMesh) r = o;
    rootCache.set(o, r); return r;
  };
  const partsOf = r => {
    let parts = partsCache.get(r); if (parts) return parts;
    parts = []; r.traverse(c => { if (c.isMesh && !c.isInstancedMesh && !isPerson(c)) parts.push(c); });
    partsCache.set(r, parts); return parts;
  };
  const near = (c, a, b, len2) => { // is the sphere within its radius (and a little) of the segment a-b?
    let t = len2 ? ((c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y) + (c.z - a.z) * (b.z - a.z)) / len2 : 0; t = Math.max(0, Math.min(1, t));
    return Math.hypot(c.x - a.x - (b.x - a.x) * t, c.y - a.y - (b.y - a.y) * t, c.z - a.z - (b.z - a.z) * t) < c.r + .3;
  };

  // called by the camera for each child: a = where the child is (head height), b = where the camera wants to be
  function mark(a, b) {
    const now = performance.now(); if (now - at > REFRESH_MS) { at = now; collect(); }
    dir.subVectors(b, a); const len = dir.length(); if (len < .5) return; dir.divideScalar(len);
    const len2 = len * len, list = cands.filter(c => near(c, a, b, len2));
    if (list.length) {
      from.copy(a).addScaledVector(dir, .15); ray.set(from, dir); ray.far = len;
      const objs = list.map(c => c.o), mats = [...new Set(objs.map(o => o.material))];
      mats.forEach(m => { m._side = m.side; m.side = THREE.DoubleSide; }); // walls seen from inside count too
      for (const hit of ray.intersectObjects(objs, false)) marked.add(rootOf(hit.object));
      mats.forEach(m => { m.side = m._side; });
    }
    // trees are instanced (one shape drawn many times): the tree in the way is swapped for a see-through copy
    for (const im of G.world.plants) {
      if (!im.userData.list) continue;
      if (!im.boundingSphere) im.computeBoundingSphere();
      if (!near({ ...im.boundingSphere.center, r: im.boundingSphere.radius }, a, b, len2)) continue;
      let d = dims.get(im.geometry);
      if (!d) { im.geometry.computeBoundingBox(); const bb = im.geometry.boundingBox; d = { h: bb.max.y, bottom: bb.min.y, r: Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2 }; dims.set(im.geometry, d); }
      if (d.h - d.bottom < .7) continue;
      im.userData.list.forEach((s, i) => {
        const sc = s[4], rad = d.r * sc * .8 + .2;
        if (Math.abs(s[0] - a.x) > len + rad || Math.abs(s[2] - a.z) > len + rad) return;
        const vx = b.x - a.x, vz = b.z - a.z, l2 = vx * vx + vz * vz; let t = l2 ? ((s[0] - a.x) * vx + (s[2] - a.z) * vz) / l2 : 0; t = Math.max(0, Math.min(1, t));
        if (Math.hypot(a.x + vx * t - s[0], a.z + vz * t - s[2]) > rad) return;
        // Terrain reshaping moves the instance matrix, not its original planting list.
        // Use the live height (or the saved matrix while it is a ghost), so raised/lowered trees still fade.
        const key = im.id + ':' + i, ghost = ghosts.get(key);
        if (ghost) instance.copy(ghost.m); else im.getMatrixAt(i, instance);
        const baseY = instance.elements[13], scaleY = Math.hypot(instance.elements[4], instance.elements[5], instance.elements[6]);
        const y = a.y + (b.y - a.y) * t; if (y < baseY + d.bottom * scaleY - .5 || y > baseY + d.h * scaleY) return;
        marked.add(key);
      });
    }
  }

  // When approaching a seller, keep the seller visible as well as the child. A canopy can hide the seller while
  // leaving the child unobstructed. Only the nearest stall within 7 m adds a ray; people themselves never fade.
  const stallHead = new THREE.Vector3();
  function markNearStall(a, camera) {
    let closest = null, best = 49;
    for (const s of G.world.stalls || []) { const d = (s.x-a.x)**2+(s.z-a.z)**2; if (d < best) { best=d; closest=s; } }
    if (!closest) return;
    const seller = SELLERS.get(closest.id), back = closest.d/2+.4;
    const x = seller?.x ?? closest.x-Math.sin(closest.face||0)*back;
    const z = seller?.z ?? closest.z-Math.cos(closest.face||0)*back;
    stallHead.set(x, G.world.groundAt(x,z)+1.5, z); mark(stallHead,camera);
  }

  const startFade = root => {
    const parts = partsOf(root).map(o => ({ o, orig: o.material }));
    const e = { parts: [], a: 1 };
    for (const q of parts) {
      if (q.o.userData.outline) { e.parts.push({ o: q.o, outline: true }); continue; }
      if (!q.orig || Array.isArray(q.orig)) continue;
      originals.set(q.o, q.orig);
      const mat = q.orig.clone(); mat.transparent = true; mat.depthWrite = false; q.o.material = mat;
      e.parts.push({ o: q.o, orig: q.orig, mat, base: q.orig.opacity });
    }
    fading.set(root, e); return e;
  };
  const endFade = (root, e) => { for (const q of e.parts) { if (q.outline) q.o.visible = true; else { q.o.material = q.orig; originals.delete(q.o); q.mat.dispose(); } } fading.delete(root); };
  const setFade = (e, a) => { e.a = a; for (const q of e.parts) { if (q.outline) q.o.visible = a > .7; else q.mat.opacity = q.base * a; } };

  const startGhost = key => {
    const [id, i] = key.split(':'), im = G.world.plants.find(m => m.id === +id); if (!im) return null;
    const m = new THREE.Matrix4(); im.getMatrixAt(+i, m);
    const mat = im.material.clone(); mat.transparent = true; mat.depthWrite = false; mat.opacity = 1;
    const mesh = new THREE.Mesh(im.geometry, mat); mesh.matrixAutoUpdate = false; mesh.matrix.copy(m); mesh.matrixWorld.copy(m); mesh.castShadow = im.castShadow; mesh.userData.noCam = true;
    scene.add(mesh);
    const hide = new THREE.Matrix4().makeScale(0, 0, 0); im.setMatrixAt(+i, hide); im.instanceMatrix.needsUpdate = true;
    const g = { im, i: +i, mesh, mat, m, a: 1 }; ghosts.set(key, g); return g;
  };
  const endGhost = (key, g) => { g.im.setMatrixAt(g.i, g.m); g.im.instanceMatrix.needsUpdate = true; scene.remove(g.mesh); g.mat.dispose(); ghosts.delete(key); };

  // once per frame, after every child's camera has been worked out
  function step(dt) {
    const k = Math.min(1, dt * FADE_SPEED) * (1 - SEE_THROUGH_OPACITY);
    for (const r of marked) {
      if (typeof r === 'string') { if (!ghosts.has(r)) startGhost(r); continue; }
      if (!fading.has(r)) startFade(r);
    }
    for (const [root, e] of [...fading]) {
      const want = marked.has(root) ? SEE_THROUGH_OPACITY : 1;
      const a = want < e.a ? Math.max(want, e.a - k) : Math.min(want, e.a + k);
      if (a >= 1) endFade(root, e); else setFade(e, a);
    }
    for (const [key, g] of [...ghosts]) {
      const want = marked.has(key) ? SEE_THROUGH_OPACITY : 1;
      g.a = want < g.a ? Math.max(want, g.a - k) : Math.min(want, g.a + k);
      if (g.a >= 1) endGhost(key, g); else g.mat.opacity = g.a;
    }
    marked.clear();
  }

  return { mark, markNearStall, step, marked, rootOf, SEE_THROUGH_OPACITY, active: () => fading.size + ghosts.size };
}
