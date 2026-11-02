// (Round U, owner 11 Oct: animals with homes) Lotus Village's hens have a coop: at dusk they walk into it and come back
// out in the morning; the ducks on the lake gather in the middle for the night; the village dog trots after a child who
// comes to visit, and goes back home when they leave. Loaded after the title (js/main.js).
import { THREE, toonVC, P, merge } from './gfx.js';
import { roadDist, edgeDist, heightAt } from './world.js';

export function createAnimalHomes(G) {
  const { scene, world } = G, L = G.lotus || {}, animals = L.animals || [];
  const hens = animals.filter(a => a.m.userData.rig && a.m.userData.rig.kind === 'chicken'), dog = animals.find(a => a.m.userData.rig && a.m.userData.rig.kind === 'puppy');
  const critHens = (world.critters || []).filter(c => !c.water && !c.fly), ducks = (world.critters || []).filter(c => c.water);
  hens.forEach(a => { a.day = a.home.slice(); a.dayWander = a.wander; });
  critHens.forEach(c => { c.day = [c.cx, c.cz, c.r]; }); ducks.forEach(c => { c.day = [c.cx, c.cz, c.r]; });
  // the coop: on free ground near the hens, off the roads
  const free = (x, z) => { const rd = roadDist(x, z); if (rd.road && rd.d < rd.road.w / 2 + 1.5) return false; if (edgeDist(x, z) < 1) return false; const p = { x, z }; world.collide(p, 1.2); return Math.hypot(p.x - x, p.z - z) < .01; };
  let coop = null;
  if (hens.length) {
    const cx = hens.reduce((s, a) => s + a.day[0], 0) / hens.length, cz = hens.reduce((s, a) => s + a.day[1], 0) / hens.length;
    for (let r = 2; r < 14 && !coop; r += 1) for (let k = 0; k < 16 && !coop; k++) { const x = cx + Math.sin(k * Math.PI / 8) * r, z = cz + Math.cos(k * Math.PI / 8) * r; if (free(x, z)) coop = { x, z }; }
    if (coop) {
      const y = heightAt(coop.x, coop.z), m = new THREE.Mesh(merge([P(new THREE.BoxGeometry(1.6, 1, 1.2), '#b5793f', [0, .5, 0]), P(new THREE.ConeGeometry(1.2, .7, 4), '#8a3a2a', [0, 1.35, 0], [0, Math.PI / 4, 0]), P(new THREE.BoxGeometry(.45, .5, .05), '#3a2414', [0, .3, .61]), P(new THREE.BoxGeometry(.7, .06, .5), '#d9b26a', [0, .05, .9], [-.4, 0, 0])]), toonVC());
      const fx = cx - coop.x, fz = cz - coop.z, fl = Math.hypot(fx, fz) || 1;   // (its door faces the hens' yard)
      m.position.set(coop.x, y, coop.z); m.rotation.y = Math.atan2(fx, fz); scene.add(m); coop.mesh = m; coop.col = { x: coop.x, z: coop.z, r: .9 }; world.colliders.push(coop.col); coop.door = [coop.x + fx / fl * 1.7, coop.z + fz / fl * 1.7];
    }
  }
  const lake = ducks.length ? [ducks.reduce((s, c) => s + c.day[0], 0) / ducks.length, ducks.reduce((s, c) => s + c.day[1], 0) / ducks.length] : null;
  let night = null; const dogHome = dog ? dog.home.slice() : null;
  // (batch rollout) Studio switch 'animalHomes': off or not started yet, no coop and the animals keep their day places
  // (nothing for a child to keep: it is the valley's own life)
  world.updaters.push((dt) => {
    const live = !G.keep || G.keep('animalHomes'); if (coop && coop.mesh) { coop.mesh.visible = live; coop.col.r = live ? .9 : 0; }
    const n = live && world.isNight();
    if (n !== night) { night = n;
      hens.forEach(a => { if (n && coop) { a.home = coop.door.slice(); a.wander = .01; a.tx = coop.door[0]; a.tz = coop.door[1]; a.wait = 0; } else { a.home = a.day.slice(); a.wander = a.dayWander; a.m.visible = true; a.inside = false; } });
      critHens.forEach(c => { if (!n) { c.s.visible = true; c.inside = false; } });
    }
    // hens (3D) go in at the coop door; the little ones (pictures) walk over too
    if (coop) for (const a of hens) if (n && !a.inside && Math.hypot(a.m.position.x - coop.door[0], a.m.position.z - coop.door[1]) < .6) { a.inside = true; a.m.visible = false; }
    for (const c of critHens) { const [hx, hz, hr] = n && coop ? [coop.door[0], coop.door[1], 0] : c.day, k = Math.min(1, dt * .4); c.cx += (hx - c.cx) * k; c.cz += (hz - c.cz) * k; c.r += (hr - c.r) * k; if (n && coop && Math.hypot(c.cx - hx, c.cz - hz) < .5) { c.inside = true; c.s.visible = false; } }
    // ducks: together in the middle of the lake at night
    if (lake) for (const c of ducks) { const [hx, hz, hr] = n ? [lake[0], lake[1], 1.2] : c.day, k = Math.min(1, dt * .3); c.cx += (hx - c.cx) * k; c.cz += (hz - c.cz) * k; c.r += (hr - c.r) * k; }
    // the village dog follows a child who comes near (not far from its home), and goes back when they leave
    if (dog) { const h = live && G.heroes.find(h => Math.hypot(h.pos.x - dog.m.position.x, h.pos.z - dog.m.position.z) < (dog.following === h ? 16 : 9) && Math.hypot(h.pos.x - dogHome[0], h.pos.z - dogHome[1]) < 30);
      if (h) { dog.home = [h.pos.x, h.pos.z]; dog.wander = 1.5; dog.speed = 2.2; dog.following = h; if (Math.hypot(dog.tx - h.pos.x, dog.tz - h.pos.z) > 2.5) { dog.tx = h.pos.x - 1; dog.tz = h.pos.z - 1; dog.wait = 0; } } else if (dog.following) { dog.home = dogHome.slice(); dog.wander = 3; dog.speed = .9; dog.following = null; dog.tx = dogHome[0]; dog.tz = dogHome[1]; dog.wait = 0; } }
  });
  G.animalHomes = { coop, hens, critHens, ducks, dog, lake };
  return G.animalHomes;
}
