// The đình (village communal house) of Làng Sen (round R, story chapter 1): where the first lantern is hung. A raised
// stone base with steps, wooden pillars, red doors and a big two-tier tiled roof with upturned corners. Faces +z, sits on
// y = 0, about 9 x 6 m. Used in the valley (js/lanterns.js) and in the chapter's festival film (js/content/films.js).
import { THREE, P, merge, toonVC, glow } from './gfx.js';

const H = Math.PI / 2;
export function buildDinh() {
  const g = new THREE.Group(), parts = [];
  const stone = '#b9ad98', wood = '#6a3e24', red = '#a8281e', tile = '#5a3a2e', tile2 = '#6e4636', plaster = '#efe3c8', gold = '#d8a83a';
  // base and steps
  parts.push(P(new THREE.BoxGeometry(9.4, .6, 6.4), stone, [0, .3, 0]), P(new THREE.BoxGeometry(3, .2, .8), stone, [0, .1, 3.6]), P(new THREE.BoxGeometry(3, .2, .5), stone, [0, .3, 3.35]));
  // back and side walls, front doors between the pillars
  parts.push(P(new THREE.BoxGeometry(8, 2.6, .25), plaster, [0, 1.9, -2.4]), ...[-1, 1].map(s => P(new THREE.BoxGeometry(.25, 2.6, 4.6), plaster, [s * 3.9, 1.9, -.2])));
  for (let i = 0; i < 4; i++) parts.push(P(new THREE.BoxGeometry(1.5, 2.2, .12), i % 3 === 0 ? wood : red, [-2.7 + i * 1.8, 1.7, 2.05]));
  for (let i = 0; i < 6; i++) parts.push(P(new THREE.CylinderGeometry(.16, .18, 2.8, 10), wood, [-3.9 + i * 1.56, 2, 2.6]));
  // beams
  parts.push(P(new THREE.BoxGeometry(8.6, .3, .3), wood, [0, 3.35, 2.6]), P(new THREE.BoxGeometry(8.6, .3, .3), wood, [0, 3.35, -2.4]));
  // two-tier roof: a wide lower roof and a smaller upper one, each a stretched four-sided cone, with upturned corners
  parts.push(P(new THREE.ConeGeometry(6.4, 1.6, 4), tile, [0, 4.25, .1], [0, Math.PI / 4, 0], [1.25, 1, .85]));
  parts.push(P(new THREE.BoxGeometry(6.2, .6, 3.4), tile2, [0, 5.1, .1]));
  parts.push(P(new THREE.ConeGeometry(4.6, 1.5, 4), tile, [0, 6.1, .1], [0, Math.PI / 4, 0], [1.2, 1, .7]));
  parts.push(P(new THREE.BoxGeometry(6.6, .22, .3), tile2, [0, 6.85, .1]));
  for (const [x, z] of [[-5.6, 2.9], [5.6, 2.9], [-5.6, -2.7], [5.6, -2.7]]) parts.push(P(new THREE.ConeGeometry(.22, 1.1, 5), tile2, [x, 3.75, z], [0, 0, x > 0 ? -1.05 : 1.05]));
  for (const x of [-3.4, 3.4]) parts.push(P(new THREE.ConeGeometry(.18, .9, 5), tile2, [x, 7.15, .1], [0, 0, x > 0 ? -.9 : .9]));
  // the ridge ornament: two dragons facing a moon (lưỡng long chầu nguyệt), drawn simply
  parts.push(P(new THREE.SphereGeometry(.32, 12, 10), gold, [0, 7.3, .1]));
  for (const s of [-1, 1]) parts.push(P(new THREE.CapsuleGeometry(.12, .9, 4, 8), gold, [s * .85, 7.15, .1], [0, 0, s * H * .8]));
  // a name board over the middle door
  parts.push(P(new THREE.BoxGeometry(1.8, .5, .08), red, [0, 3.0, 2.8]), P(new THREE.BoxGeometry(1.5, .3, .09), gold, [0, 3.0, 2.82]));
  const m = new THREE.Mesh(merge(parts), toonVC()); m.castShadow = true; g.add(m);
  // the lantern hooks under the front eave (lanterns hang here when lit)
  g.userData.hooks = [-3.1, -1.55, 0, 1.55, 3.1].map(x => new THREE.Vector3(x, 3.0, 3.1));
  return g;
}

// a red paper lantern (đèn lồng) with gold caps and a tassel; lit = it glows
export function buildLantern(lit = false, color = '#d8301e') {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(.32, 14, 10), lit ? glow(color) : new THREE.MeshToonMaterial({ color }));
  body.scale.set(1, 1.15, 1); g.add(body);
  const cap = new THREE.MeshToonMaterial({ color: '#e8b62a' });
  for (const y of [.36, -.36]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .08, 10), cap); c.position.y = y; g.add(c); }
  const tassel = new THREE.Mesh(new THREE.CylinderGeometry(.02, .05, .4, 6), cap); tassel.position.y = -.6; g.add(tassel);
  const string = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .4, 4), cap); string.position.y = .58; g.add(string);
  g.userData.body = body;
  return g;
}
