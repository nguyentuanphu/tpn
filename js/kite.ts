// The whistling kite (diều sáo): win the Kite Flying game and you get a kite that flies on a string above
// and behind you wherever you go. Like the kites of northern Vietnam it carries a little bamboo flute (sáo
// diều) that hums in the wind: the faster you run, the more often it sings. Switch it on and off in the
// Backpack. Tap the kite button there to make it whistle.
import { THREE, toonVC, P, merge } from './gfx.js';
import { tone } from './audio.js';
import { settings, reduceMotion } from './state.js';

function kiteModel() {
  const parts = [];
  // the sail: a diamond in two colours, like a butterfly kite at a village festival
  const sail = (pts, color) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.computeVertexNormals(); return P(g, color); };
  parts.push(sail([0, 1.4, 0, -1, 0, 0, 0, -1.6, 0, 0, 1.4, 0, 0, -1.6, 0, -1, 0, 0], '#e8433a'));
  parts.push(sail([0, 1.4, 0, 0, -1.6, 0, 1, 0, 0, 0, 1.4, 0, 1, 0, 0, 0, -1.6, 0], '#ffd23f'));
  parts.push(P(new THREE.CylinderGeometry(.03, .03, 3, 5), '#8a5a3b'), P(new THREE.CylinderGeometry(.03, .03, 2, 5), '#8a5a3b', [0, 0, 0], [0, 0, Math.PI / 2]));
  // the bamboo flute (sáo) tied across the top
  parts.push(P(new THREE.CylinderGeometry(.09, .09, 1.1, 8), '#c9a24a', [0, .85, -.12], [0, 0, Math.PI / 2]));
  for (const x of [-.32, 0, .32]) parts.push(P(new THREE.CylinderGeometry(.11, .11, .05, 8), '#7a4a2a', [x, .85, -.12], [0, 0, Math.PI / 2]));
  const m = new THREE.Mesh(merge(parts), toonVC()); m.material.side = THREE.DoubleSide;
  const kite = new THREE.Group(); kite.add(m);
  // a wiggly tail of little bows
  const tail = [];
  for (let k = 0; k < 7; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.32, .16, .02), new THREE.MeshToonMaterial({ color: k % 2 ? '#3cc7e8' : '#ff7eb8', side: THREE.DoubleSide })); b.position.y = -1.8 - k * .45; kite.add(b); tail.push(b); }
  kite.userData.tail = tail;
  return kite;
}

// the flute's voice: a soft, breathy hum that rises and falls with the wind
export function kiteWhistle(strength = 1) {
  if (!settings.sound) return;
  const base = 560 + Math.random() * 80, d = 1.4 + strength * .6, v = .045 * (reduceMotion() ? .5 : 1);
  tone(base, d, { to: base * 1.12, vib: 9, vibRate: 3.5, vol: v, attack: .35 });
  tone(base * 2, d * .9, { to: base * 2.2, vib: 14, vibRate: 3.5, vol: v * .35, attack: .4 });
  tone(base * 1.5, d * .7, { at: .3, to: base * 1.45, vib: 8, vibRate: 4, vol: v * .25, attack: .3 });
}

export function createKites(G) {
  const { scene, world } = G;
  let live = []; // { h, kite, line, pos, t }
  const K = {};
  K.sync = () => {
    live.forEach(L => { scene.remove(L.kite); scene.remove(L.line); }); live = [];
    G.heroes.forEach(h => {
      const p = h.profile; if (!p.kite || p.kiteOn === false) return;
      const kite = kiteModel(); kite.scale.setScalar(1.3); scene.add(kite);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: '#f4ead2' })); scene.add(line);
      const pos = new THREE.Vector3(h.pos.x, h.pos.y + 9, h.pos.z + 5);
      live.push({ h, kite, line, pos, t: 4 + Math.random() * 4 });
    });
  };
  K.whistle = h => { const L = live.find(L => L.h === h); kiteWhistle(1.2); return !!L; };
  const want = new THREE.Vector3();
  world.updaters.push((dt, t) => {
    for (const L of live) {
      // out in front and a little to the side, so the kite is on screen above the child (the camera is behind)
      const h = L.h, ahead = 7 + Math.min(3, (h.speed || 0) * .4), up = 6.5 + Math.sin(t * .7 + h.i) * 1;
      want.set(h.pos.x + Math.sin(h.yaw) * ahead + Math.cos(h.yaw) * 2.5 + Math.sin(t * .5) * 1.5, h.pos.y + up, h.pos.z + Math.cos(h.yaw) * ahead - Math.sin(h.yaw) * 2.5 + Math.cos(t * .4) * 1.2);
      L.pos.lerp(want, Math.min(1, dt * 1.6));
      L.kite.position.copy(L.pos);
      L.kite.lookAt(h.pos.x, h.pos.y + 1, h.pos.z); L.kite.rotateX(-.5); L.kite.rotateZ(Math.sin(t * 1.3 + h.i) * .25);
      L.kite.userData.tail.forEach((b, k) => { b.position.x = Math.sin(t * 4 - k * .7) * .25 * (k / 3); b.rotation.z = Math.sin(t * 5 - k) * .6; });
      // the string from the child's hand to the kite
      const a = L.line.geometry.attributes.position; a.setXYZ(0, h.pos.x + Math.cos(h.yaw) * .35, h.pos.y + 1.1, h.pos.z - Math.sin(h.yaw) * .35); a.setXYZ(1, L.pos.x, L.pos.y - .8, L.pos.z); a.needsUpdate = true; L.line.geometry.computeBoundingSphere();
      // the flute sings now and then, more often when running
      L.t -= dt * (1 + Math.min(2, (h.speed || 0) / 3));
      if (L.t <= 0) { L.t = 7 + Math.random() * 6; if (!G.paused && h === G.heroes[0]) kiteWhistle(Math.min(1, (h.speed || 0) / 5)); }
    }
  });
  return K;
}
