// Trường Học Vui, the Fun Learning School (Học vui phase 4, owner's plan 1 Nov 2026 AEDT, docs/learn-tab/PLAN.md):
// a cheerful one-storey school at the west end of Two Homes Street, on the Sydney (south) side of the island road where
// the street begins. Pastel walls, a red-tiled roof, a name board in both languages over the door, a small paved yard
// with a hopscotch and the Vietnamese flag on its pole. Cô Tam stands at the door: tapping her says hello and opens
// the Học vui (Fun learning) tab of the Play hub, the same page as the Play tab (PLAN.md "The school").
// Cô Tam also helps at her family's sugarcane juice cart after school (js/town.ts), and the cart needs her there all
// day (its juice, the dialog, the day plan), so the school has its own copy of her: the same look, the same name and
// the same family photo face (nameAvatar), standing at the school door: "Cô Tam at school".
// Where it stands comes from the map (js/content/map.ts TOWN_SCHOOL, an offset from the street's anchor); before it is
// built the spot is checked with the valley's own placement rule (G.goodSpot: dry land, no house, wall, tree or
// collider) and kept off every road and its verge (edgeDist, roadDist: HANDOFF G5/R4); if the valley changed and the
// spot is taken, the nearest free spot a few metres along the road is used instead.
import { THREE, toonVC, P, merge, outline } from './gfx.js';
import { gable, win, Box, Cyl } from './town.js';
import { T, nm, onLang, registerName } from './i18n.js';
import { heightAt, edgeDist, roadDist, TOWN, WATER } from './world.js';
import { buildAvatar, nameAvatar } from './avatar.js';
import { dialog } from './popups.js';
import { openGamesHub } from './ui.js';
import { dist2 } from './util.js';
import { TOWN_SCHOOL } from './content/map.js';

/** the school's place: the building's middle (x, z), its size, the yard in front (north, -z) and where Cô Tam stands */
import { SCHOOL } from './content/school-place.js';
// (v1.08 maths) the 21 new maths games and the 7 numbers games switched on in v1.08 are found at the school
const MATHS_AT_SCHOOL = ['numline', 'tenframe', 'dice', 'evenodd', 'measure', 'beforeafter', 'halves', 'mx_bonds', 'mx_takeaway', 'mx_skip', 'mx_patterns', 'mx_shapehunt', 'mx_symmetry', 'mx_heavy', 'mx_full', 'mx_pizza', 'mx_graph',
  'mx_calendar', 'mx_quarter', 'mx_sudoku', 'mx_bigger', 'mx_doubles', 'mx_tens', 'mx_missing', 'mx_solids3d', 'mx_leftright', 'mx_sprint', 'mx_grouping'];
export { SCHOOL };
export const SCHOOL_GREETING = ['Welcome to the Fun Learning School! Shall we learn something fun today?', 'Chào mừng con đến Trường Học Vui! Hôm nay mình học điều gì vui nhé?'];

// the building, front facing +z (turned to face the road when placed)
function schoolHouse(w, d) {
  const p = [], wallH = 3.2, base = .3, top = base + wallH, wall = '#ffe3a3', trim = '#fff6e4', pink = '#ff9ec4', mint = '#8fd9b8', tile = '#d4523a', tileDark = '#a93a2a';
  p.push(P(Box(w + .5, base, d + .5), '#cdbb9c', [0, base / 2, 0]));                       // stone base
  p.push(P(Box(w, wallH, d), wall, [0, base + wallH / 2, 0]));                               // pastel walls
  p.push(P(Box(w + .08, .45, d + .08), pink, [0, base + .22, 0]));                          // a pink skirting band
  p.push(P(Box(w + .12, .22, d + .12), trim, [0, top - .1, 0]));                            // the cream band under the eaves
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => p.push(P(Box(.32, wallH, .32), trim, [sx * (w / 2), base + wallH / 2, sz * (d / 2)]))));   // corner pillars
  // the red-tiled roof: two slopes, rows of tiles and a ridge
  const rh = 1.7; gable(p, w, d, rh, top, tile, wall);
  const a = Math.atan2(rh, d / 2);
  for (let k = 1; k <= 4; k++) { const s = k / 5; [-1, 1].forEach(sz => p.push(P(Box(w + .7, .07, .1), tileDark, [0, top + rh * (1 - s) + .12, sz * (d / 2 * s + .08)], [sz * a, 0, 0]))); }
  p.push(P(Box(w + .9, .2, .34), tileDark, [0, top + rh + .05, 0]));
  // the front: a raised panel over the door carrying the name board (the board itself is drawn on a canvas)
  p.push(P(Box(5.6, 1.5, .4), wall, [0, top + .55, d / 2 + .02]), P(Box(5.9, .22, .55), trim, [0, top + 1.32, d / 2 + .02]));
  // a blue double door with a cream frame, a little red canopy and two steps
  p.push(P(Box(2.2, 2.6, .1), trim, [0, base + 1.3, d / 2 + .03]), P(Box(.86, 2.35, .12), '#3f8fd8', [-.45, base + 1.18, d / 2 + .05]), P(Box(.86, 2.35, .12), '#3f8fd8', [.45, base + 1.18, d / 2 + .05]));
  p.push(P(Box(.08, .3, .14), '#ffd23f', [-.12, base + 1.2, d / 2 + .1]), P(Box(.08, .3, .14), '#ffd23f', [.12, base + 1.2, d / 2 + .1]));   // handles
  p.push(P(Box(2.9, .12, 1.2), tile, [0, base + 2.85, d / 2 + .6], [.18, 0, 0]));
  p.push(P(Box(2.6, .15, .5), '#d9cdb8', [0, .22, d / 2 + .5]), P(Box(2.6, .15, .5), '#d9cdb8', [0, .08, d / 2 + .9]));
  // big classroom windows, mint frames, and flower boxes under them
  [-3.1, 3.1].forEach(x => { win(p, x, base + 1.75, d / 2 + .02, 1.7, 1.3, mint, '#9fd2ee'); p.push(P(Box(1.7, .3, .35), pink, [x, base + .85, d / 2 + .2])); });
  [-3.6, -3.1, -2.6, 2.6, 3.1, 3.6].forEach((x, k) => p.push(P(new THREE.IcosahedronGeometry(.17, 0), ['#ff6fae', '#ffd23f', '#ffffff'][k % 3], [x, base + 1.08, d / 2 + .22])));
  // side windows and the back wall's windows (plain glass panes)
  [-1, 1].forEach(sx => [-1.3, 1.3].forEach(z => p.push(P(Box(.1, 1.2, 1.4), '#9fd2ee', [sx * (w / 2 + .03), base + 1.75, z]), P(Box(.12, 1.4, 1.6), mint, [sx * (w / 2 + .01), base + 1.75, z]))));
  [-2.5, 2.5].forEach(x => p.push(P(Box(1.6, 1.2, .1), '#9fd2ee', [x, base + 1.75, -d / 2 - .03])));
  // a little bell under the gable on the front panel
  p.push(P(new THREE.ConeGeometry(.22, .3, 8), '#ffb020', [0, top + 1.62, d / 2 + .1]), P(Box(.06, .2, .06), '#7a4a26', [0, top + 1.82, d / 2 + .1]));
  return merge(p);
}
// the yard in front: paving and a painted hopscotch (all flat: children walk over them)
function schoolYard(w, depth, hop) {
  const p = [];
  p.push(P(Box(w + 1, .06, depth), '#efe1c3', [0, .03, depth / 2]));
  for (let k = 0; k < 6; k++) { const twin = k === 2 || k === 4, cols = ['#ff7eb8', '#ffd23f', '#5fd39a', '#3cc7e8', '#9a6bff', '#ff8a5a'];
    (twin ? [-.36, .36] : [0]).forEach((dx, j) => p.push(P(Box(.66, .02, .66), cols[(k + j) % cols.length], [hop[0] + dx, .07, hop[1] + depth - .7 - k * .7]))); }
  return merge(p);
}
// the flag of Việt Nam: a red flag with a yellow five-pointed star, both sides
function flagGeo() {
  const sh = new THREE.Shape(); for (let k = 0; k < 10; k++) { const r = k % 2 ? .13 : .32, a = Math.PI / 2 + k * Math.PI / 5; (k ? sh.lineTo : sh.moveTo).call(sh, Math.cos(a) * r, Math.sin(a) * r); }
  const star = new THREE.ShapeGeometry(sh);
  return merge([P(Box(1.5, 1, .04), '#da251d', [.75, 0, 0]), P(star, '#ffcd00', [.75, 0, .03]), P(star, '#ffcd00', [.75, 0, -.03], [0, Math.PI, 0])]);
}
// the name board: the language a child plays in, big, and the other one under it (redrawn when the language changes)
function nameBoard(scene, x, y, z, rot) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
  const draw = () => {
    const main = T('Fun Learning School', 'Trường Học Vui'), other = T('Trường Học Vui', 'Fun Learning School');
    g.fillStyle = '#2f6fd0'; g.beginPath(); g.roundRect(0, 0, 512, 128, 18); g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 8; g.beginPath(); g.roundRect(6, 6, 500, 116, 14); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.font = 'bold 52px Fredoka, "Baloo 2", sans-serif'; g.fillText(main, 256, 52, 480);
    g.fillStyle = '#ffe9a8'; g.font = '30px Fredoka, "Baloo 2", sans-serif'; g.fillText(other, 256, 98, 460);
  };
  draw(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; onLang(() => { draw(); t.needsUpdate = true; });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.2), new THREE.MeshBasicMaterial({ map: t })); m.position.set(x, y, z); m.rotation.y = rot; scene.add(m); return m;
}
// a name over Cô Tam's head, in the chosen language (no picture: the name alone, like the other villagers' tags)
function nameTag(scene, name, x, y, z) {
  registerName(name);
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  const draw = () => { g.clearRect(0, 0, 256, 64); g.fillStyle = 'rgba(40,40,40,.55)'; g.beginPath(); g.roundRect(8, 10, 240, 46, 23); g.fill();
    g.font = 'bold 30px Fredoka, "Baloo 2", sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(nm(name), 128, 34, 228); };
  draw(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; onLang(() => { draw(); t.needsUpdate = true; });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(3, .75, 1); s.position.set(x, y, z); scene.add(s); return s;
}

/** is the school's ground free at (x, z)? every half metre of the building and its yard: dry, level land with nothing on
 *  it (G.goodSpot), and the whole of it clear of the roads and their verges */
function fits(G, x, z) {
  const x0 = x - SCHOOL.w / 2 - 1, x1 = x + SCHOOL.w / 2 + 1, z0 = z - SCHOOL.d / 2 - SCHOOL.yard, z1 = z + SCHOOL.d / 2 + .5;
  for (let px = x0; px <= x1 + 1e-6; px += .5) for (let pz = z0; pz <= z1 + 1e-6; pz += .5) {
    if (heightAt(px, pz) < WATER + .5 || !G.goodSpot(px, pz) || edgeDist(px, pz) < 1.5) return false;
    const rd = roadDist(px, pz); if (rd.road && rd.d < rd.road.w / 2 + 1.5) return false;
  }
  return true;
}

export function createSchool(G) {
  const { scene, world } = G;
  // the spot from the map, or the nearest free one a little along the road (west first: the street's houses are east)
  const tries = [[0, 0]]; for (let k = 1; k <= 8; k++) tries.push([-k * .5, 0], [k * .5, 0]); for (const dz of [1, 2]) tries.push([0, dz], [-1, dz], [1, dz]);
  const ok = tries.find(([dx, dz]) => fits(G, SCHOOL.x + dx, SCHOOL.z + dz));
  if (!ok) { console.warn('school: no free ground at Two Homes Street'); return null; }
  SCHOOL.x += ok[0]; SCHOOL.z += ok[1];
  const { x, z, w, d, yard } = SCHOOL, y0 = heightAt(x, z), rot = Math.PI;   // (front to -z: the road)
  const mat = toonVC();
  const house = new THREE.Mesh(schoolHouse(w, d), mat); house.position.set(x, y0, z); house.rotation.y = rot; house.castShadow = house.receiveShadow = true; scene.add(house);
  outline(house, .03, '#4a3a3f'); house.userData.school = true;
  const box = { x0: x - w / 2 - .25, x1: x + w / 2 + .25, z0: z - d / 2 - .25, z1: z + d / 2 + .25 }; world.boxes.push(box);
  // the yard (local +z is world -z, local +x is world -x: the hopscotch on the west side, away from Cô Tam)
  const yardM = new THREE.Mesh(schoolYard(w, yard, [3.6, 0]), mat); yardM.position.set(x, y0, SCHOOL.front - .02); yardM.rotation.y = rot; yardM.receiveShadow = true; scene.add(yardM);
  nameBoard(scene, x, y0 + 3.5 + .55, SCHOOL.front - .25, rot);
  // the flag pole in the yard's east corner, and its flag, which flutters a little
  const fx = x + w / 2 - .6, fz = SCHOOL.front - yard + 1.2;
  const pole = new THREE.Mesh(merge([P(Box(.7, .3, .7), '#d9cdb8', [0, .15, 0]), P(Cyl(.06, .07, 6.2, 8), '#c8ccd0', [0, 3.2, 0]), P(new THREE.SphereGeometry(.12, 8, 6), '#ffd23f', [0, 6.35, 0])]), mat);
  pole.position.set(fx, heightAt(fx, fz), fz); pole.castShadow = true; scene.add(pole);
  const flag = new THREE.Mesh(flagGeo(), mat); flag.position.set(fx + .05, pole.position.y + 5.6, fz); flag.rotation.y = rot; flag.userData.moving = true; scene.add(flag);   // (moves: never part of the solid map)
  world.colliders.push({ x: fx, z: fz, r: .4 });
  // the grass and flowers scattered over the valley keep off the floor and the yard
  for (const im of world.groundCover || []) {
    const m4 = new THREE.Matrix4(), zero = new THREE.Matrix4().makeScale(0, 0, 0); let hit = false;
    for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m4); const px = m4.elements[12], pz = m4.elements[14];
      if (px > x - w / 2 - .8 && px < x + w / 2 + .8 && pz > SCHOOL.front - yard - .3 && pz < z + d / 2 + .5) { im.setMatrixAt(i, zero); hit = true; } }
    if (hit) im.instanceMatrix.needsUpdate = true;
  }
  // Cô Tam at the door: the juice cart's Cô Tam (same look, name and face), facing the yard and the road
  const t = SCHOOL.teacher;
  const A = buildAvatar({ back: 'none', glider: 0, style: 'aodai', color: '#d94a6a', hair: '#1d1412', hairStyle: 'long', hat: 'nonla', skin: '#e8b48c' }, null);
  A.root.position.set(t.x, heightAt(t.x, t.z), t.z); A.root.rotation.y = rot; A.root.userData.schoolTeacher = true; scene.add(A.root);
  nameAvatar(A, 'Cô Tam', true, undefined);
  nameTag(scene, 'Cô Tam', t.x, A.root.position.y + 2.6, t.z);
  world.colliders.push({ x: t.x, z: t.z, r: .35 });
  // tap her: she says hello, then the Fun learning tab opens (the same Học vui page as the Play hub's tab)
  const talk = async h => {
    const k = await dialog('Cô Tam', [SCHOOL_GREETING], [['📚 Yes, let’s learn!', '📚 Học thôi!'], ['👋 Later', '👋 Để sau']]);
    if (k !== 0) return;
    openGamesHub.last = 'hocvui'; openGamesHub.scroll = 0;
    G.openGamesHub(h.i);
  };
  const s = SCHOOL.spot;
  const it = { id: 'school', x: s.x, z: s.z, r: 3, icon: '👩‍🏫', label: () => T('Fun learning with ' + nm('Cô Tam'), 'Học vui cùng Cô Tam'), act: h => talk(h) };
  G.interactables.push(it);
  // (v1.08 maths) the maths games' place in the valley for the map pin: Cô Tam's school (no place on the map moves); a game
  // that already has a place keeps it
  G.GAME_SPOT = G.GAME_SPOT || {};
  for (const id of MATHS_AT_SCHOOL) if (!G.GAME_SPOT[id]) G.GAME_SPOT[id] = 'school';
  // life: she gestures as she talks to the class, the flag flutters (only while a child is near)
  world.updaters.push((dt, time) => {
    if (!G.heroes.some(h => dist2(h.pos.x, h.pos.z, x, z) < 45)) return;
    A.armR.rotation.x = -.6 + Math.sin(time * 1.6) * .35; A.rig.position.y = Math.sin(time * 2) * .02;
    flag.rotation.y = rot + Math.sin(time * 2.3) * .12;
  });
  return { x, z, w, d, yard, front: SCHOOL.front, teacher: SCHOOL.teacher, spot: SCHOOL.spot, place: SCHOOL.place, house, yardMesh: yardM, flag, pole, avatar: A, it, box };
}
