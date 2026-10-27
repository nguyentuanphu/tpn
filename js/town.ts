// Two Homes Street (Phố Hai Quê): a neighbourhood where Bà Rịa meets a Sydney suburb.
// On one side: narrow Vietnamese tube houses with balconies and water tanks, a French-style villa and
// Cô Tam's family sugarcane juice cart (Cô Tam teaches at the trường cấp 2 and helps there after school); Bác 2, Bác 3 and Bác 4 play cards, and anh Ba and Con Vật play Tiến Lên, under the gum tree by the gate. On the other side: an Australian
// weatherboard house with a front porch, a brick house, a Hills hoist, and the park where kids play
// folk games. Built from simple flat-coloured shapes in the "summer afternoon" style.
import { THREE, toon, toonVC, P, merge, sprite, outline } from './gfx.js';
import { houseTube, houseVilla, houseCottage } from './houses.js';
import { T, nm, onLang, registerName } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { heightAt, TOWN, PLAYGROUND } from './world.js';
import { buildAvatar, nameAvatar } from './avatar.js';
import { dist2 } from './util.js';
import { addPole, addDrop } from './powerlines.js';

export const Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const Cyl = (r1, r2, h, s = 8) => new THREE.CylinderGeometry(r1, r2, h, s);
// A gable roof: ridge along x, slopes down to the front (+z) and back (-z).
export function gable(parts, w, d, h, y0, col, endCol) {
  const L = Math.hypot(d / 2, h) + .45, a = Math.atan2(h, d / 2);
  parts.push(P(Box(w + .7, .16, L), col, [0, y0 + h / 2, d / 4 + .1], [a, 0, 0]), P(Box(w + .7, .16, L), col, [0, y0 + h / 2, -d / 4 - .1], [-a, 0, 0]));
  const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(0, h); sh.lineTo(-d / 2, 0);
  const tri = new THREE.ExtrudeGeometry(sh, { depth: .12, bevelEnabled: false });
  [-1, 1].forEach(sx => parts.push(P(tri, endCol, [sx * (w / 2) - (sx > 0 ? .12 : 0), y0, 0], [0, Math.PI / 2, 0])));
}
// A hip roof (four slopes) over a w × d footprint.
export const hip = (parts, w, d, h, y0, col) => parts.push(P(new THREE.ConeGeometry(Math.SQRT1_2, 1, 4), col, [0, y0 + h / 2, 0], [0, Math.PI / 4, 0], [w + .9, h, d + .9]));
// A window on a wall facing +z at (x, y, z).
export function win(parts, x, y, z, w = 1.2, h = 1.3, frame = '#f4efe2', glass = '#5d8e94', shutters = null) {
  parts.push(P(Box(w + .24, h + .24, .08), frame, [x, y, z]), P(Box(w, h, .1), glass, [x, y, z + .02]), P(Box(w + .3, .1, .2), frame, [x, y - h / 2 - .12, z + .06]));
  if (shutters) [-1, 1].forEach(sx => parts.push(P(Box(w / 2, h + .1, .08), shutters, [x + sx * (w * .75 + .1), y, z + .04])));
}

// Nhà ống: narrow, tall and colourful, with a roll-up shutter, balconies and a stainless water tank.
export function tubeHouse(color, floors = 3, w = 4.4, d = 10) {
  const p = [], fh = 3.1;
  p.push(P(Box(w, fh * floors, d), color, [0, fh * floors / 2, 0]));
  p.push(P(Box(w - .5, 2.5, .08), '#b9bfc4', [0, 1.3, d / 2 + .02]));
  for (let k = 0; k < 9; k++) p.push(P(Box(w - .5, .04, .1), '#9aa1a7', [0, .2 + k * .28, d / 2 + .05]));
  p.push(P(Box(w + .1, .25, .9), '#e9e2d2', [0, 2.75, d / 2 + .35]));
  for (let f = 1; f < floors; f++) {
    const y = f * fh;
    p.push(P(Box(w, .18, 1.2), '#ece5d6', [0, y + .05, d / 2 + .6]));
    p.push(P(Box(w, .9, .06), '#6f8f7a', [0, y + .55, d / 2 + 1.18]));
    for (let k = 0; k < 9; k++) p.push(P(Box(.05, .9, .05), '#6f8f7a', [-w / 2 + .25 + k * (w - .5) / 8, y + .55, d / 2 + 1.16]));
    win(p, 0, y + 1.6, d / 2 + .02, w * .55, 1.6, '#f4efe2', '#6a9aa2');
  }
  const top = fh * floors;
  p.push(P(Box(w + .2, .5, d + .2), '#efe8d8', [0, top + .25, 0]));
  p.push(P(Box(w + .4, .14, 2.2), '#c8644a', [0, top + .9, d / 2 - .6], [.5, 0, 0]));
  p.push(P(Cyl(.55, .55, 1.6, 12), '#d6dde0', [-w / 4, top + 1.3, -d / 4], [0, 0, Math.PI / 2]), P(Box(.2, .8, .2), '#a9b1b5', [-w / 4 - .5, top + .6, -d / 4]), P(Box(.2, .8, .2), '#a9b1b5', [-w / 4 + .5, top + .6, -d / 4]));
  return { geo: merge(p), w, d };
}
// A French-colonial villa, Bà Rịa style: ochre walls, green shutters, arches and a terracotta hip roof.
function frenchVilla(w = 10, d = 9) {
  const p = [], wall = '#e9c46a', trim = '#f6ead0', green = '#3f7d5c';
  p.push(P(Box(w, 3.2, d), wall, [0, 1.6, 0]), P(Box(w, 3, d), wall, [0, 4.7, 0]));
  p.push(P(Box(w + .2, .3, d + .2), trim, [0, 3.25, 0]), P(Box(w + .2, .3, d + .2), trim, [0, 6.25, 0]));
  // arcade across the front
  p.push(P(Box(w, .2, 2.2), trim, [0, 3.1, d / 2 + 1.1]), P(Box(w, .3, 2.2), '#d9c9a8', [0, .15, d / 2 + 1.1]));
  [-1, -1 / 3, 1 / 3, 1].forEach(t => p.push(P(Box(.45, 3, .45), trim, [t * (w / 2 - .25), 1.6, d / 2 + 2])));
  [-2 / 3, 0, 2 / 3].forEach(t => p.push(P(new THREE.TorusGeometry(1.25, .14, 4, 12, Math.PI), trim, [t * (w / 2 - .25), 1.85, d / 2 + 2.02])));
  p.push(P(Box(1.4, 2.3, .1), '#7a4a2e', [0, 1.2, d / 2 + .03]));
  [-3, 3].forEach(x => win(p, x, 1.7, d / 2 + .02, 1.1, 1.5, trim, '#5d8e94', green));
  [-3.2, 0, 3.2].forEach(x => win(p, x, 4.7, d / 2 + .02, 1.1, 1.6, trim, '#5d8e94', green));
  // balcony above the arcade
  p.push(P(Box(w, .8, .1), trim, [0, 3.7, d / 2 + 2.15]));
  for (let k = 0; k < 15; k++) p.push(P(Cyl(.06, .06, .7, 5), trim, [-w / 2 + .35 + k * (w - .7) / 14, 3.6, d / 2 + 2.15]));
  hip(p, w, d, 2.6, 6.4, '#c8644a');
  return { geo: merge(p), w, d: d + 2.3 };
}
// Australian weatherboard cottage: raised on stumps, pale boards, tin roof and a front verandah.
export function weatherboard(w = 9, d = 8, color = '#cfe0e6') {
  const p = [], lift = .7, wallH = 3;
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 1], [0, -1]]) p.push(P(Box(.3, lift, .3), '#9a8f84', [x * (w / 2 - .3), lift / 2, z * (d / 2 - .3)]));
  p.push(P(Box(w, wallH, d), color, [0, lift + wallH / 2, 0]));
  for (let k = 0; k < 11; k++) p.push(P(Box(w + .04, .04, d + .04), '#b3c7ce', [0, lift + .2 + k * .27, 0]));
  gable(p, w, d, 1.9, lift + wallH, '#9fb3bd', color);
  for (let k = 0; k < 10; k++) p.push(P(Box(.05, .05, d / 2 + .9), '#8aa0ab', [-w / 2 + .3 + k * (w - .6) / 9, lift + wallH + 1.05, d / 4 + .15], [Math.atan2(1.9, d / 2), 0, 0]));
  // verandah: deck, white posts, a skillion roof and steps
  p.push(P(Box(w, .2, 2.4), '#c9a77a', [0, lift, d / 2 + 1.2]));
  [-1, -1 / 3, 1 / 3, 1].forEach(t => p.push(P(Box(.16, 2.5, .16), '#ffffff', [t * (w / 2 - .1), lift + 1.25, d / 2 + 2.3])));
  p.push(P(Box(w + .3, .1, 2.8), '#b4c4cc', [0, lift + 2.65, d / 2 + 1.25], [.12, 0, 0]));
  p.push(P(Box(w, .5, .06), '#ffffff', [0, lift + .5, d / 2 + 2.35]));
  p.push(P(Box(1.4, .25, .5), '#c9a77a', [0, .35, d / 2 + 2.6]), P(Box(1.4, .25, .5), '#c9a77a', [0, .12, d / 2 + 3]));
  p.push(P(Box(1, 2.1, .08), '#b5483c', [0, lift + 1.05, d / 2 + .02]));
  [-2.6, 2.6].forEach(x => win(p, x, lift + 1.7, d / 2 + .02, 1.3, 1.3, '#ffffff', '#6a9aa2'));
  return { geo: merge(p), w, d: d + 3 };
}
// A red-brick house with a tiled roof and a small front porch, like many in western Sydney.
export function brickHouse(w = 8, d = 8) {
  const p = [];
  p.push(P(Box(w, 3, d), '#c9785a', [0, 1.5, 0]));
  for (let k = 0; k < 10; k++) p.push(P(Box(w + .03, .03, d + .03), '#e0a88c', [0, .3 * k + .15, 0]));
  hip(p, w, d, 2.2, 3, '#c0583e');
  p.push(P(Box(3, .2, 1.8), '#d9cdbd', [-1.6, .1, d / 2 + .9]), P(Box(.25, 2.6, .25), '#f4efe2', [-2.9, 1.4, d / 2 + 1.6]), P(Box(.25, 2.6, .25), '#f4efe2', [-.3, 1.4, d / 2 + 1.6]));
  p.push(P(Box(3.4, .15, 2.2), '#a24e3a', [-1.6, 2.75, d / 2 + .9], [.15, 0, 0]));
  p.push(P(Box(1, 2.1, .08), '#4f5d6a', [-1.6, 1.05, d / 2 + .02]));
  win(p, 2, 1.6, d / 2 + .02, 2, 1.3, '#f4efe2', '#6a9aa2');
  return { geo: merge(p), w, d: d + 1.8 };
}
// The house on stilts from the picture: living upstairs, an open breezy space below.
export function raisedHouse(w = 7.5, d = 7) {
  const p = [];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => p.push(P(Box(.25, 2.8, .25), '#b9b2a6', [x * (w / 2 - .3), 1.4, z * (d / 2 - .3)])));
  p.push(P(Box(w * .55, 2.6, d * .7), '#9a8a94', [-w * .2, 1.3, -d * .1]));
  p.push(P(Box(1, 2, .08), '#5a4a5a', [-w * .2, 1, d * .25 + .02]));
  p.push(P(Box(1.8, .1, 1), '#c8644a', [-w * .2, 2.3, d * .25 + .5], [.25, 0, 0]));
  p.push(P(Box(w, 3, d), '#efd9a6', [0, 2.8 + 1.5, 0]));
  win(p, .6, 4.4, d / 2 + .02, 2.6, 1.3, '#9ac7b4', '#9fd2ee');
  p.push(P(Box(2.2, .15, 1.4), '#d9cdb8', [-w / 2 - 1, 2.9, d / 4]), P(Box(2.2, .9, .06), '#5f9a7a', [-w / 2 - 1, 3.4, d / 4 + .7]));
  for (let k = 0; k < 8; k++) p.push(P(Box(.05, .9, .05), '#5f9a7a', [-w / 2 - 2 + k * .3, 3.4, d / 4 + .68]));
  gable(p, w, d, 1.8, 5.8, '#c8644a', '#efd9a6');
  return { geo: merge(p), w, d };
}

// motorbikes parked on Two Homes Street's footpath: [x, z, turn, model] (js/traffic.js puts them there)
export const TOWN_PARKED = [];
export function createTown(G) {
  // (round T) every position is an offset from the street's anchor in the map (js/content/map.js), so the street moves with it
  const X = dx => TOWN.x + dx, Z = dz => TOWN.z + dz;
  const { scene, world } = G, y0 = TOWN.h, RZ = TOWN.roadZ, N = Z(-15), S = Z(1); // front lines of the north and south houses
  const mat = toonVC();
  const put = (geo, x, z, rot = 0, collide = null) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, heightAt(x, z), z); m.rotation.y = rot; m.castShadow = m.receiveShadow = true; scene.add(m);
    if (collide) world.boxes.push(collide);
    return m;
  };
  const house = (b, x, front, south = false) => {
    const z = south ? front + b.d / 2 : front - b.d / 2;
    put(b.geo, x, z + (south ? 0 : 0), south ? Math.PI : 0, { x0: x - b.w / 2, x1: x + b.w / 2, z0: z - b.d / 2 + (south ? 0 : 0), z1: z + b.d / 2 });
  };

  // ---------- the road, footpaths, lines and a zebra crossing ----------
  const g = [], x0 = X(-26), x1 = X(12), L = x1 - x0, cx = (x0 + x1) / 2;
  g.push(P(Box(L, .06, 7), '#b4b9bc', [cx, .03, RZ]));
  g.push(P(Box(L, .07, 5.5), '#e8d5a8', [cx, .035, RZ - 6.25]), P(Box(L, .07, 3.6), '#e8d5a8', [cx, .035, RZ + 5.3])); // the north footpath is wide: shop fronts open onto it
  g.push(P(Box(L, .08, .16), '#f6f1e4', [cx, .05, RZ - 3.2]), P(Box(L, .08, .16), '#f6f1e4', [cx, .05, RZ + 3.2]));
  for (let x = x0 + 2; x < x1 - 2; x += 4) if (Math.abs(x - X(-4)) > 3) g.push(P(Box(1.8, .08, .16), '#f6f1e4', [x, .05, RZ]));
  for (let k = -3; k <= 3; k++) g.push(P(Box(.6, .08, 5.6), '#f6f1e4', [X(-4) + k * 1.1, .055, RZ]));
  const road = new THREE.Mesh(merge(g), mat); road.position.y = y0; road.receiveShadow = true; scene.add(road);

  // ---------- houses ----------
  // storybook houses (js/houses.js) are whole models; the older ones get the same soft outline
  const place = (b, x, front, south = false) => {
    const z = south ? front + b.d / 2 : front - b.d / 2;
    b.obj.position.set(x, heightAt(x, z), z); b.obj.rotation.y = south ? Math.PI : 0; scene.add(b.obj);
    world.boxes.push({ x0: x - b.w / 2, x1: x + b.w / 2, z0: z - b.d / 2, z1: z + b.d / 2 });
    world.houses.push({ x, z, rot: b.obj.rotation.y, d: b.d, kind: b.kind || 'tube' });
  };
  const houseOld = (b, x, front, south, kind) => { house(b, x, front, south); const m = scene.children[scene.children.length - 1]; outline(m, .03, '#4a3a3f'); if (kind) world.houses.push({ x, z: south ? front + b.d / 2 : front - b.d / 2, rot: south ? Math.PI : 0, d: b.d, kind }); };
  // Bà Rịa side (north): tube houses with shops downstairs, then the French villa
  // (x 12–18 is the Huệ Nghi shop and x 17.5–23 on the south side is house number 8, both built in js/cities.js)
  place(houseTube({ wall: '#f6c8a8', floors: 3, d: 7.4, sign: ['Sweet soup · Chè', 'Chè'] }), X(-11.9), N);
  place(houseTube({ wall: '#f6e09a', floors: 2, d: 7.4, sign: ['Sand & Stone', 'Cát · Đá'] }), X(-7.4), N);
  const villa = Object.assign(houseVilla(), { kind: 'villa' }); place(villa, X(.3), N - 1.2);
  // Bác Sơn's house: west of the bridge tower, with its door and garden path open to the footpath
  houseOld(brickHouse(7, 8), X(9.6), N - 2.5, false, 'brick');
  // Sydney side (south)
  houseOld(raisedHouse(), X(-18.5), S + 1.5, true, 'raised');
  place(Object.assign(houseCottage({ yard: false }), { kind: 'cottage' }), X(13), S + 4.5, true);
  // garden walls and fences
  const fence = [];
  fence.push(P(Box(10, 1, .25), '#f6ead0', [X(.3), .5, N - .6]), P(Box(.5, 1.6, .5), '#f6ead0', [X(-.9), .8, N - .6]), P(Box(.5, 1.6, .5), '#f6ead0', [X(1.5), .8, N - .6]));
  for (let k = 0; k < 12; k++) if (k < 5 || k > 6) fence.push(P(Box(.12, .9, .12), '#ffffff', [X(8.6) + k * .8, .45, S + .6]));
  fence.push(P(Box(3.6, .1, .1), '#ffffff', [X(10.4), .75, S + .6]), P(Box(3.6, .1, .1), '#ffffff', [X(15.6), .75, S + .6]));
  fence.push(P(Box(.25, 1, .25), '#c0392b', [X(10.3), .5, S + .4]), P(Box(.5, .4, .4), '#c0392b', [X(10.3), 1.1, S + .4]));       // letterbox
  fence.push(P(Box(1.3, .7, .3), '#b5654a', [X(6.75), .35, N - .5]), P(Box(3.9, .7, .3), '#b5654a', [X(11.15), .35, N - .5]));   // low brick fence with a gap for the path to Bác Sơn's door
  const fm = new THREE.Mesh(merge(fence), mat); fm.position.y = y0; fm.castShadow = true; scene.add(fm);
  world.boxes.push({ x0: X(-4.7), x1: X(-1.1), z0: N - .8, z1: N - .4 }, { x0: X(1.7), x1: X(5.3), z0: N - .8, z1: N - .4 });

  // ---------- street lamps, and power poles (owner, round R: the poles are switched off for now but kept; when Studio's
  // "powerPoles" switch is on they stand here and js/powerlines.js wires them to each other and to the tube houses) ----------
  // spaced so none stands in front of a door on the south side (house 8's door at x 20.3 was blocked by one)
  for (let x = X(-23); x <= X(18); x += 8) addPole(world, x, y0, S - .7);
  addDrop(X(-11.9), y0 + 8.6, N); addDrop(X(.3), y0 + 6.2, N - 1.4);   // (power into two tube houses across the road)
  const pp = [];
  for (const [x, side] of [[X(-16), -1], [X(-3), -1], [X(6), -1], [X(-4), 1], [X(4), 1]]) {
    const z = side < 0 ? N + .9 : S - 1.4;
    pp.push(P(Cyl(.09, .12, 6.2, 6), '#6f7a66', [x, 3.1, z]));
    pp.push(P(new THREE.TorusGeometry(.7, .05, 4, 10, Math.PI * .7), '#6f7a66', [x, 6.2, z + side * -.6], [0, Math.PI / 2, 0]));
    pp.push(P(new THREE.SphereGeometry(.28, 8, 6), '#e8e6dc', [x, 6.5, z - side * 1.2], [0, 0, 0], [1, .45, 1.4]));
    world.colliders.push({ x, z, r: .3 });
  }
  const pm = new THREE.Mesh(merge(pp), mat); pm.castShadow = true; pm.position.y = y0; scene.add(pm);

  // ---------- trees: jacaranda and gum trees (Sydney), banana and star-fruit trees (Bà Rịa) ----------
  const tree = (x, z, kind) => {
    const t = [];
    if (kind === 'jacaranda') { t.push(P(Cyl(.25, .4, 3.4, 6), '#6b5040', [0, 1.7, 0])); [[0, 4.6, 0, 2.2, '#9c7fd6'], [1.6, 4.2, .5, 1.6, '#b39ce6'], [-1.5, 4.3, -.3, 1.7, '#8a6cc8'], [.2, 5.8, .2, 1.3, '#c3b0ee']].forEach(([a, b, c, r, col]) => t.push(P(new THREE.IcosahedronGeometry(r, 1), col, [a, b, c], [0, 0, 0], [1, .8, 1]))); }
    if (kind === 'gum') { t.push(P(Cyl(.18, .32, 6, 6), '#e9e1d2', [0, 3, 0]), P(Cyl(.1, .14, 2.4, 5), '#e9e1d2', [.7, 5, 0], [0, 0, -.6])); [[0, 6.6, 0, 1.6], [1.4, 6, .4, 1.2], [-1, 6.2, -.5, 1.3]].forEach(([a, b, c, r]) => t.push(P(new THREE.IcosahedronGeometry(r, 0), '#7f9a6a', [a, b, c], [0, 0, 0], [1.2, .7, 1.2]))); }
    if (kind === 'banana') { t.push(P(Cyl(.15, .22, 2.6, 6), '#9aa65a', [0, 1.3, 0])); for (let k = 0; k < 6; k++) t.push(P(Box(.5, .05, 2.2), k % 2 ? '#5fa860' : '#4e9a52', [Math.cos(k) * .9, 2.7, Math.sin(k) * .9], [-.5 * Math.sin(k), -k, .5 * Math.cos(k)])); }
    if (kind === 'frangipani') { t.push(P(Cyl(.14, .22, 2, 6), '#8a7a6a', [0, 1, 0])); [[0, 2.4, 0, 1], [.7, 2.2, .3, .7]].forEach(([a, b, c, r]) => t.push(P(new THREE.IcosahedronGeometry(r, 1), '#4f9a62', [a, b, c]))); for (let k = 0; k < 8; k++) t.push(P(new THREE.SphereGeometry(.12, 5, 4), '#fff6dc', [Math.cos(k) * .7, 2.9 + (k % 3) * .1, Math.sin(k) * .7])); }
    put(merge(t), x, z); world.colliders.push({ x, z, r: kind === 'banana' ? .4 : .5 });
  };
  tree(X(-12.5), Z(11.5), 'jacaranda'); tree(X(5), Z(19), 'jacaranda'); tree(X(18), Z(-17), 'gum'); tree(X(19), Z(13), 'gum'); tree(X(-27.4), Z(-16), 'gum');
  tree(X(-20), Z(-22), 'banana'); tree(X(-21.6), Z(-20.4), 'banana'); tree(X(15.6), Z(-22), 'frangipani'); tree(X(-14), Z(18), 'frangipani');

  // ---------- little things that make it feel lived in ----------
  const bits = [];
  // scooters parked on the footpath
  const scooter = (x, z, col, rot) => [P(Box(.25, .5, 1.5), col, [x, .55, z], [0, rot, 0]), P(Cyl(.28, .28, .14, 10), '#2f3336', [x, .28, z + .6], [0, rot, Math.PI / 2]), P(Cyl(.28, .28, .14, 10), '#2f3336', [x, .28, z - .6], [0, rot, Math.PI / 2]), P(Box(.3, .14, .7), '#3a3030', [x, .85, z - .2], [0, rot, 0]), P(Box(.7, .06, .06), '#9aa', [x, 1.2, z + .7], [0, rot, 0])];
  // (round R: the real motorbikes of js/vehicles.js now stand here, placed by js/traffic.js)
  TOWN_PARKED.push([X(-17.7), N + 2.4, 0, 'honda67'], [X(-16.5), N + 2.6, .1, 'cub'], [X(-6.4), N + 2.8, -.1, 'dream']);
  // wheelie bins on the kerb (red lid for rubbish, yellow lid for recycling)
  [[X(9.3), '#d9483a'], [X(10.2), '#e8c03a']].forEach(([x, lid]) => bits.push(P(Box(.7, 1, .7), '#3c5a44', [x, .5, S - .2]), P(Box(.76, .1, .8), lid, [x, 1.05, S - .2])));
  [[X(4.6), '#d9483a']].forEach(([x, lid]) => bits.push(P(Box(.7, 1, .7), '#3c5a44', [x, .5, N + .3]), P(Box(.76, .1, .8), lid, [x, 1.05, N + .3])));
  // Hills hoist clothes line in the backyard
  const hx = X(13), hz = S + 17.5;
  bits.push(P(Cyl(.06, .06, 2.4, 6), '#b8bcbf', [hx, 1.2, hz]));
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; bits.push(P(Box(2.6, .05, .05), '#b8bcbf', [hx + Math.cos(a) * 1.3, 2.3, hz + Math.sin(a) * 1.3], [0, -a, 0])); }
  [['#ff7eb8', .7], ['#7fd8ff', -.6], ['#ffd23f', 1.4]].forEach(([c, o], k) => bits.push(P(Box(.6, .7, .04), c, [hx + o, 1.9, hz + (k - 1) * .8])));
  // lanterns strung along the balconies
  for (let k = 0; k < 9; k++) bits.push(P(new THREE.SphereGeometry(.22, 8, 6), k % 3 === 2 ? '#ffcf3a' : '#e8332a', [X(-18) + k * 1.4, 3.2 - Math.sin(k / 8 * Math.PI) * .4, N + 1.6], [0, 0, 0], [1, 1.3, 1]));
  bits.push(P(Cyl(.02, .02, 12, 3), '#5a3a2a', [X(-12.4), 3.35, N + 1.6], [0, 0, Math.PI / 2]));
  // the park: grass edging, a swing set and a slide
  bits.push(P(Box(1.2, .06, 1.2), '#c9a77a', [X(3), .03, Z(17.5)]));
  [[X(1.4), Z(17.5)], [X(4.6), Z(17.5)]].forEach(([x, z]) => bits.push(P(Box(.12, 2.6, .12), '#e8433a', [x, 1.3, z - .8], [.25, 0, 0]), P(Box(.12, 2.6, .12), '#e8433a', [x, 1.3, z + .8], [-.25, 0, 0])));
  bits.push(P(Cyl(.06, .06, 3.4, 6), '#e8433a', [X(3), 2.5, Z(17.5)], [0, 0, Math.PI / 2]));
  [X(2.3), X(3.7)].forEach(x => bits.push(P(Box(.04, 1.6, .04), '#666', [x, 1.7, Z(17.5)]), P(Box(.5, .06, .25), '#3a78c8', [x, .9, Z(17.5)])));
  bits.push(P(Box(.8, .1, 3.2), '#ffd23f', [X(-8), 1, Z(19)], [-.55, 0, 0]), P(Box(.8, 2, .8), '#3cc7e8', [X(-8), 1, Z(17.2)]), P(Box(.06, 2.4, .06), '#e8e8e8', [X(-8.4), 1.2, Z(17.2)]), P(Box(.06, 2.4, .06), '#e8e8e8', [X(-7.6), 1.2, Z(17.2)]));
  world.colliders.push({ x: X(3), z: Z(17.5), r: 1.5 }, { x: X(-8), z: Z(17.8), r: 1.2 });
  // chú Thuận and mợ Phương's sand and stone shop: a heap of yellow sand and one of grey stones by the door, and sacks
  bits.push(P(new THREE.ConeGeometry(.5, .55, 9), '#e2c27a', [X(-9.15), .27, N + .65]), P(new THREE.DodecahedronGeometry(.42, 0), '#8f8f8a', [X(-5.65), .25, N + .65], [0, .4, 0], [1, .6, 1]));
  [[X(-8.7), .35], [X(-6), .25]].forEach(([x, dz]) => bits.push(P(Box(.45, .3, .3), '#e9e2cc', [x, .15, N + .3 + dz])));
  world.colliders.push({ x: X(-9.15), z: N + .65, r: .5 }, { x: X(-5.65), z: N + .65, r: .45 });
  // O Thương and dượng Dũng's baby clothes, on a rack under the raised house
  bits.push(P(Box(.06, 1.5, .06), '#d0d0d0', [X(-16.4), .75, S + 1.1]), P(Box(.06, 1.5, .06), '#d0d0d0', [X(-15), .75, S + 1.1]), P(Box(1.5, .05, .05), '#d0d0d0', [X(-15.7), 1.48, S + 1.1]));
  ['#ff9ec4', '#8fd3ff', '#ffe27a', '#b9f0a8'].forEach((c, k) => bits.push(P(Box(.3, .38, .04), c, [X(-16.2) + k * .33, 1.2, S + 1.1]), P(Box(.42, .1, .045), c, [X(-16.2) + k * .33, 1.36, S + 1.1])));
  world.colliders.push({ x: X(-15.7), z: S + 1.1, r: .7 });
  // cậu Tâm's little truck, parked at the kerb outside the villa (the family run trucks and sell phones)
  {
    const t = [P(Box(3.2, 1.3, 1.5), '#3a78c8', [-.5, 1.05, 0]), P(Box(1.2, 1.1, 1.45), '#f2f2f2', [1.6, .95, 0]), P(Box(.05, .5, 1.2), '#9fd3e8', [2.21, 1.2, 0]), P(Box(4.4, .2, 1.4), '#4a4a4a', [.1, .35, 0])];
    [[-1.4, .75], [-1.4, -.75], [1.5, .75], [1.5, -.75]].forEach(([x, z]) => t.push(P(Cyl(.32, .32, .2, 12), '#2f3336', [x, .32, z], [Math.PI / 2, 0, 0])));
    const tm = new THREE.Mesh(merge(t), mat); tm.position.set(X(4.2), y0, Z(-8.5)); tm.castShadow = true; scene.add(tm);
    world.boxes.push({ x0: X(1.9), x1: X(6.5), z0: Z(-9.3), z1: Z(-7.7) });
  }
  const bm = new THREE.Mesh(merge(bits), mat); bm.position.y = y0; bm.castShadow = true; scene.add(bm);
  // shop boards in both languages
  const board = (text, x, y, z, rot = 0, w = 2.4) => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g2 = c.getContext('2d');
    const draw = () => { g2.fillStyle = '#c0392b'; g2.fillRect(0, 0, 256, 64); g2.strokeStyle = '#ffd23f'; g2.lineWidth = 4; g2.strokeRect(3, 3, 250, 58); g2.font = 'bold 30px Fredoka, "Baloo 2", sans-serif'; g2.fillStyle = '#fff'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText(T(text[0], text[1]), 128, 34, 238); };
    draw(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; onLang(() => { draw(); t.needsUpdate = true; });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.y = rot; scene.add(m);
  };
  board(['Phones · Trucks', 'Điện thoại · Xe tải'], X(.3), y0 + 1.55, N - .45, 0, 2.6);
  board(['Baby clothes', 'Quần áo em bé'], X(-15.7), y0 + 1.95, S + 1.1, Math.PI, 1.8);
  world.boxes.push({ x0: X(8.1), x1: X(10.6), z0: S - .6, z1: S + .2 });

  // ---------- the sugarcane juice cart (nước mía) where Cô Tam, a secondary-school teacher, helps after school ----------
  const cart = [], kx = X(-3.1), kz = N + 1.6;
  cart.push(P(Box(2.4, .9, 1), '#3a7fc2', [0, .75, 0]), P(Box(2.4, .9, .9), '#d6eef6', [0, 1.65, -.05]), P(Box(2.5, .08, 1.1), '#f4f4f4', [0, 2.12, 0]));
  cart.push(P(Cyl(.32, .32, .1, 12), '#2f3336', [-.9, .32, .55], [Math.PI / 2, 0, 0]), P(Cyl(.32, .32, .1, 12), '#2f3336', [.9, .32, .55], [Math.PI / 2, 0, 0]));
  cart.push(P(Box(.7, .6, .6), '#c8ccd0', [.7, 2.45, 0]), P(Cyl(.32, .32, .1, 12), '#8a9095', [.7, 2.5, .36], [Math.PI / 2, 0, 0]));
  for (let k = 0; k < 8; k++) cart.push(P(Cyl(.05, .05, 2.6, 5), k % 2 ? '#7a5a6a' : '#8a6a5a', [-1.5 - (k % 3) * .12, 1.3, -.3 + k * .09], [0, 0, .12 + k * .02]));
  cart.push(P(Cyl(.03, .03, 3, 4), '#8a8a8a', [-.3, 2.6, -.2]), P(new THREE.ConeGeometry(1.9, .7, 10), '#e84a3a', [-.3, 4, -.2]), P(new THREE.ConeGeometry(1.95, .25, 10), '#ffffff', [-.3, 3.68, -.2]));
  for (let k = 0; k < 3; k++) cart.push(P(Cyl(.09, .07, .25, 8), '#f3e9a8', [-.5 + k * .3, 2.3, .3]));
  put(merge(cart), kx, kz); world.colliders.push({ x: kx, z: kz, r: 1.3 });
  const stools = [];
  [[-1.7, 1.3, '#e0453a'], [1.6, 1.4, '#3a78c8'], [2, .4, '#e0453a']].forEach(([dx, dz, c]) => stools.push(P(Cyl(.22, .26, .4, 8), c, [kx + dx, .2, kz + dz])));
  stools.push(P(Box(.6, .45, .6), '#3a78c8', [kx + 1.9, .22, kz + 1.9]));
  const sm = new THREE.Mesh(merge(stools), mat); sm.position.y = y0; sm.castShadow = true; scene.add(sm);
  // the card corner: two low tables under the gum tree by the street's gate, off the footpath so it stays clear.
  // Bác 2, Bác 3 and Bác 4 play Snap at one; anh Ba and Con Vật play Tiến Lên (southern style) at the other.
  const cardTable = (cx, cz) => {
    const t = [P(Box(1.2, .5, .9), '#8a5a3b', [0, .25, 0]), P(Box(1.3, .05, 1), '#a07048', [0, .52, 0]), P(Box(1.5, .02, 1.2), '#2f7a4a', [0, .555, 0])];
    [[-1, 0], [1, 0], [0, -.9], [0, .9]].forEach(([dx, dz], k) => t.push(P(Cyl(.2, .24, .35, 8), k % 2 ? '#e0453a' : '#3a78c8', [dx, .17, dz])));
    for (let k = 0; k < 6; k++) t.push(P(Box(.18, .01, .26), k % 2 ? '#ffffff' : '#f4f0e6', [-.3 + k * .12, .57 + k * .002, (k % 2) * .1], [0, k * .4, 0]));
    t.push(P(Box(.3, .02, .4), '#c0392b', [.35, .57, -.2]));
    const m = new THREE.Mesh(merge(t), mat); m.position.set(cx, heightAt(cx, cz), cz); m.castShadow = true; scene.add(m);
    world.colliders.push({ x: cx, z: cz, r: 1.6 });
  };
  const cxT = X(-23.6), czT = Z(-12.8), cxL = X(-23.4), czL = Z(-17.8);
  cardTable(cxT, czT); cardTable(cxL, czL);

  // ---------- people ----------
  const people = [];
  const person = (look, x, z, face, sit = false) => {
    const A = buildAvatar(Object.assign({ back: 'none', glider: 0 }, look), null);
    A.root.position.set(x, heightAt(x, z), z); A.root.rotation.y = face; scene.add(A.root);
    if (sit) { A.legL.rotation.x = A.legR.rotation.x = -1.45; A.rig.position.y = -.22; A.root.userData.seated = true; }   // (Round V) seated at the card table: the day plan leaves them there
    people.push(A); return A;
  };
  const L2 = (style, color, hair, hairStyle, hat = 'none', skin = '#e8b48c') => ({ style, color, hair, hairStyle, hat, skin });
  const sau = person(L2('aodai', '#d94a6a', '#1d1412', 'long', 'nonla'), kx, kz - 1.1, 0);
  const players = [
    person(L2('shirt', '#ffffff', '#2a2a2a', 'short'), cxT - 1, czT, Math.PI / 2, true),
    person(L2('tunic', '#5b7fbf', '#8a8a8a', 'short'), cxT + 1, czT, -Math.PI / 2, true),
    person(L2('aodai', '#7a4a8a', '#cfcfcf', 'buns'), cxT, czT - .9, 0, true),
    person(L2('hoodie', '#ff9f43', '#1d1412', 'spiky', 'cap'), cxT, czT + .9, Math.PI, true),
    // the Tiến Lên table: anh Ba and his friend Con Vật (the stool facing the street is for the child)
    person(L2('shirt', '#2f7a4a', '#1d1412', 'short'), cxL - 1, czL, Math.PI / 2, true),
    person(L2('hoodie', '#3a78c8', '#1d1412', 'spiky'), cxL + 1, czL, -Math.PI / 2, true)
  ];
  players[5].root.scale.setScalar(.82);
  ['Bác 2', 'Bác 3', 'Bác 4', 'Bi', 'Anh Ba', 'Con Vật'].forEach((n, k) => nameAvatar(players[k], n)); nameAvatar(sau, 'Cô Tam');
  // teenagers kicking a shuttlecock (đá cầu) in the park
  const ring = [[X(-3), Z(14.5)], [X(0), Z(13)], [X(-.5), Z(16.5)]];
  const teens = ring.map(([x, z], k) => person(L2(['shirt', 'overalls', 'dress'][k], ['#3cc7e8', '#5fd39a', '#ff7eb8'][k], '#1d1412', ['spiky', 'short', 'ponytail'][k], 'none', '#e0aa80'), x, z, 0));
  teens.forEach((A, k) => { const c = ring.reduce((a, b) => [a[0] + b[0] / 3, a[1] + b[1] / 3], [0, 0]); A.root.rotation.y = Math.atan2(c[0] - ring[k][0], c[1] - ring[k][1]); world.colliders.push({ x: ring[k][0], z: ring[k][1], r: .4 }); });
  const cau = new THREE.Mesh(merge([P(Cyl(.12, .12, .06, 8), '#e8433a', [0, 0, 0]), ...[0, 1, 2, 3].map(k => P(Box(.05, .3, .12), ['#ffd23f', '#5fd39a', '#3cc7e8', '#ff7eb8'][k], [Math.cos(k * 1.57) * .06, .17, Math.sin(k * 1.57) * .06], [0, k * 1.57, 0]))]), mat);
  scene.add(cau);
  people.forEach(A => world.colliders.push({ x: A.root.position.x, z: A.root.position.z, r: .35 }));

  // name tags and chatter bubbles
  const tag = (text, x, y, z) => {
    registerName(text);
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g2 = c.getContext('2d');
    const draw = () => { g2.clearRect(0, 0, 256, 64); g2.fillStyle = 'rgba(40,40,40,.55)'; g2.beginPath(); g2.roundRect(8, 10, 240, 46, 23); g2.fill();
      g2.font = 'bold 30px Fredoka, "Baloo 2", sans-serif'; g2.fillStyle = '#fff'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText(nm(text), 128, 34, 228); };
    draw();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; onLang(() => { draw(); t.needsUpdate = true; });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(3, .75, 1); s.position.set(x, y, z); scene.add(s); return s;
  };
  tag('Cô Tam 🥤', kx, y0 + 2.6, kz - 1.1);
  // the card players: Bác 2, Bác 3 and Bác 4 (and Bi from the villa watching)
  const yT = heightAt(cxT, czT), yL = heightAt(cxL, czL);
  tag('Bác 2', cxT - 1, yT + 2.05, czT); tag('Bác 3', cxT + 1, yT + 2.05, czT); tag('Bác 4', cxT, yT + 2.35, czT - .9);
  tag('Anh Ba', cxL - 1, yL + 2.05, czL); tag('Con Vật', cxL + 1, yL + 1.8, czL);
  tag('Anh Tuấn 🏸', X(-1.2), y0 + 2.6, Z(14.7));
  const bubble = sprite('💬', .9); bubble.visible = false; scene.add(bubble);
  const CHATTER = ['🃏', '😆', '🎉', '🤔', '💬'];

  // ---------- things to do ----------
  const I = (id, x, z, r, icon, label, act) => G.interactables.push({ id, x, z, r, icon, label, act, bubble: icon });
  I('nuocmia', kx, kz + 1.8, 3, '🥤', () => T('Sugarcane juice', 'Nước mía'), h => G.townTalk(h, 'sau'));
  I('cards', cxT + 1.9, czT + .4, 2.6, '🃏', () => T('Card game', 'Đánh bài'), h => G.townTalk(h, 'tu'));
  I('tienlen', cxL + 1.9, czL + .4, 2.6, '🎴', () => T('Tiến Lên with anh Ba and Con Vật', 'Tiến Lên với anh Ba và Con Vật'), h => G.townTalk(h, 'tienlen'));
  I('dacau', X(-1.2), Z(13), 3.2, '🏸', () => T('Shuttlecock kicking', 'Đá cầu'), h => G.townTalk(h, 'tuan'));

  // ---------- life: a sugarcane press turning, card players chatting, the shuttlecock flying ----------
  let hop = 0, from = 0, to = 1, chatT = 2;
  world.updaters.push((dt, t) => {
    if (!G.heroes.some(h => dist2(h.pos.x, h.pos.z, X(-4), Z(-3)) < 75)) return;
    sau.armR.rotation.x = -1 + Math.sin(t * 3) * .5; sau.rig.position.y = Math.sin(t * 2) * .02;
    players.forEach((A, k) => { A.armR.rotation.x = -.9 + Math.sin(t * 1.3 + k * 2) * .3; A.head && (A.head.rotation.y = Math.sin(t * .7 + k) * .3); });
    // shuttlecock: arcs from one teen to the next; whoever receives it kicks
    hop += dt / 1.1;
    if (hop >= 1) { hop = 0; from = to; to = (to + 1 + (Math.random() < .3 ? 1 : 0)) % 3; if (to === from) to = (to + 1) % 3; const A = teens[from]; A.legR.rotation.x = -1; setTimeout(() => { A.legR.rotation.x = 0; }, 250); }
    const a = ring[from], b = ring[to], hgt = Math.sin(hop * Math.PI) * 3.2;
    cau.position.set(a[0] + (b[0] - a[0]) * hop, y0 + .6 + hgt, a[1] + (b[1] - a[1]) * hop); cau.rotation.z = hop * 6;
    chatT -= dt;
    if (chatT < 0) { chatT = 2.5 + Math.random() * 3; const A = players[Math.floor(Math.random() * players.length)]; bubble.material = sprite(CHATTER[Math.floor(Math.random() * CHATTER.length)]).material; bubble.position.copy(A.root.position).add(new THREE.Vector3(0, 2, 0)); bubble.visible = true; setTimeout(() => { bubble.visible = false; }, 1400); }
  });
  return { villa };
}
