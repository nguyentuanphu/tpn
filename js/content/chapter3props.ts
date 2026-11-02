// Things chapter 3 of the lantern story (Sydney) shows in the valley (js/content/chapter3sydney.js) and in its festival
// film (js/content/chapter3films.js): the Opera House and the coloured light on its sails, the Harbour Bridge (film), a
// little green and gold ferry, a gum tree and a sleepy koala. Toon shapes, small (G9), friendly (G8).
import { THREE, P, merge, toonVC, glow } from '../gfx.js';

const H = Math.PI / 2;
// the Opera House's sails, as in js/regions.js (x, z, size, turn): the valley's model and the film use the same ones
export const SAILS = [[-4.5, 1, 1.15, 0], [-2, .8, 1, 0], [.2, .6, .8, 0], [3.5, 0, 1, Math.PI], [5.6, .2, .8, Math.PI]];
const sailGeo = (s, grow = 1) => new THREE.ConeGeometry(2.4 * s * grow, 5 * s * grow, 12, 1, true, 0, Math.PI);
// the whole Opera House (the film): its base, steps and white sails
export function buildOperaHouse() {
  const p = [P(new THREE.BoxGeometry(16, 1.6, 10), '#cdb89a', [0, .8, 0]), P(new THREE.BoxGeometry(16, .3, 2), '#d9c9aa', [0, .15, 6])];
  for (const [x, z, s, rot] of SAILS) p.push(P(sailGeo(s), '#f4f1ea', [x, 1.6 + 2.2 * s, z], [-.35, rot, 0]));
  const g = new THREE.Group(); const m = new THREE.Mesh(merge(p), toonVC()); m.castShadow = true; g.add(m); return g;
}
// coloured light on the sails: a glowing shell just over each sail; tint(t) cycles the colours (the light show)
const SHOW = ['#ff5fa2', '#5fb6ff', '#a66bff', '#ffd23f', '#5fd36a'];
export function buildSailLights() {
  const g = new THREE.Group(), mats = [];
  SAILS.forEach(([x, z, s, rot], i) => { const m = glow(SHOW[i % SHOW.length], .55); m.depthWrite = false; m.side = THREE.DoubleSide; mats.push(m);
    const sh = new THREE.Mesh(sailGeo(s, 1.04), m); sh.position.set(x, 1.6 + 2.2 * s, z); sh.rotation.set(-.35, rot, 0); g.add(sh); });
  g.userData.tint = t => mats.forEach((m, i) => m.color.set(SHOW[(Math.floor(t * .6) + i) % SHOW.length]));
  return g;
}
// the Harbour Bridge, "the Coathanger" (the film's backdrop): a steel arch over a flat deck, with two stone towers
export function buildHarbourBridge() {
  const p = [P(new THREE.BoxGeometry(30, .5, 2.4), '#8a8f96', [0, 3, 0])];
  for (let i = 0; i <= 16; i++) { const t = i / 16, x = -14 + t * 28, y = 3 + Math.sin(t * Math.PI) * 7; p.push(P(new THREE.BoxGeometry(1.9, .45, 2.2), '#7a8088', [x, y, 0], [0, 0, Math.cos(t * Math.PI) * -.65]));
    if (i % 2 === 0 && i > 0 && i < 16) p.push(P(new THREE.CylinderGeometry(.08, .08, y - 3, 4), '#9aa0a8', [x, (y + 3) / 2, 0])); }
  for (const x of [-15, 15]) p.push(P(new THREE.BoxGeometry(2.4, 6, 3), '#d8c9aa', [x, 3, 0]));
  const g = new THREE.Group(); g.add(new THREE.Mesh(merge(p), toonVC())); return g;
}
// a little green and gold Sydney ferry (about 3 m)
export function buildFerry() {
  const p = [P(new THREE.BoxGeometry(3, .6, 1.2), '#2f8a3a', [0, .3, 0]), P(new THREE.BoxGeometry(2.2, .7, 1), '#ffd23f', [0, .95, 0]), P(new THREE.BoxGeometry(2.3, .12, 1.1), '#2f8a3a', [0, 1.36, 0]),
    ...[-.7, 0, .7].map(x => P(new THREE.BoxGeometry(.4, .3, 1.02), '#5fb6ff', [x, 1, 0])), P(new THREE.CylinderGeometry(.12, .12, .5, 8), '#2f8a3a', [.4, 1.6, 0])];
  const g = new THREE.Group(); g.add(new THREE.Mesh(merge(p), toonVC())); return g;
}
// a gum tree: a pale trunk and soft grey-green leaves
export function buildGumTree(s = 1) {
  const p = [P(new THREE.CylinderGeometry(.18 * s, .26 * s, 3.6 * s, 8), '#e8e4dc', [0, 1.8 * s, 0])];
  [[0, 4, 0, 1.3], [.8, 3.6, .3, .9], [-.7, 3.7, -.2, .9]].forEach(([x, y, z, r]) => p.push(P(new THREE.SphereGeometry(r * s, 10, 8), '#7fa88a', [x * s, y * s, z * s], [0, 0, 0], [1, .8, 1])));
  const g = new THREE.Group(); g.add(new THREE.Mesh(merge(p), toonVC())); return g;
}
// a sleepy, smiling koala hugging a branch (about 0.6 m)
export function buildKoala() {
  const grey = '#9a9a9e', p = [P(new THREE.SphereGeometry(.26, 12, 10), grey, [0, 0, 0], [0, 0, 0], [1, 1.1, .9]), P(new THREE.SphereGeometry(.2, 12, 10), grey, [0, .3, .06]),
    ...[-1, 1].map(s => P(new THREE.SphereGeometry(.1, 10, 8), '#b8b8bc', [s * .17, .42, .02])), ...[-1, 1].map(s => P(new THREE.SphereGeometry(.05, 8, 6), '#ffd6e0', [s * .17, .42, .07])),
    P(new THREE.SphereGeometry(.06, 8, 6), '#3a3a42', [0, .27, .24], [0, 0, 0], [1, .8, .8]), ...[-1, 1].map(s => P(new THREE.SphereGeometry(.025, 6, 5), '#1a1a1a', [s * .07, .34, .22])),
    P(new THREE.SphereGeometry(.12, 10, 8), '#e8e4dc', [0, -.02, .16], [0, 0, 0], [1, 1.2, .5])];
  const g = new THREE.Group(); g.add(new THREE.Mesh(merge(p), toonVC())); return g;
}
