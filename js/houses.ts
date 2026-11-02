// Storybook houses: rounded edges, a soft ink outline and real details (tiles, shutters, balconies,
// plants). Used on Two Homes Street and in Lotus Village. Each builder returns { obj, w, d }: the
// model (front facing +z) and its footprint for collisions.
import { THREE, toonVC, P, merge, outline } from './gfx.js';
import { settings } from './state.js';
import { onLang } from './i18n.js';

export function rbox(w, h, d, r = .08, s = 2) {
  r = Math.min(r, w / 2, h / 2, d / 2);
  const g = new THREE.BoxGeometry(w, h, d, s * 2, s * 2, s * 2), p = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
  const ix = w / 2 - r, iy = h / 2 - r, iz = d / 2 - r;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    c.set(Math.max(-ix, Math.min(ix, v.x)), Math.max(-iy, Math.min(iy, v.y)), Math.max(-iz, Math.min(iz, v.z)));
    const n = v.clone().sub(c); if (n.lengthSq() > 1e-9) n.setLength(r);
    v.copy(c).add(n); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
// ---------- houses ----------
// A sloped roof plane centred at (0, yc, zc), tilted by ang about x, with tile rows (across) or tin ribs (down the slope).
function slope(p, w, L, yc, zc, ang, col, rib, kind = 'tiles') {
  p.push(P(rbox(w, .18, L, .06), col, [0, yc, zc], [ang, 0, 0]));
  if (kind === 'tiles') for (let t = -L / 2 + .3; t < L / 2 - .1; t += .42) p.push(P(new THREE.CylinderGeometry(.075, .075, w, 6).rotateZ(Math.PI / 2).translate(0, .12, t), rib, [0, yc, zc], [ang, 0, 0]));
  else for (let x = -w / 2 + .15; x < w / 2; x += .28) p.push(P(new THREE.CylinderGeometry(.04, .04, L, 5).rotateX(Math.PI / 2).translate(x, .1, 0), rib, [0, yc, zc], [ang, 0, 0]));
}
function gableRoof(p, w, d, h, y0, col, rib, kind) {
  const L = Math.hypot(d / 2, h) + .55, a = Math.atan2(h, d / 2);
  [-1, 1].forEach(s => slope(p, w, L, y0 + h / 2 + .05, s * (d / 4 + .14), s * a, col, rib, kind));
}
function shutterWin(p, x, y, z, w, h, frame, glass, sh, arch = false) {
  p.push(P(rbox(w + .3, h + .3, .14, .05), frame, [x, y, z]), P(rbox(w, h, .12, .03), glass, [x, y, z + .03]));
  p.push(P(rbox(.06, h, .14, .02), frame, [x, y, z + .07]), P(rbox(w, .06, .14, .02), frame, [x, y + h * .1, z + .07]));
  if (arch) p.push(P(new THREE.CylinderGeometry(w / 2 + .15, w / 2 + .15, .14, 16, 1, false, 0, Math.PI), frame, [x, y + h / 2 + .1, z], [Math.PI / 2, Math.PI / 2, 0]));
  p.push(P(rbox(w + .5, .12, .32, .04), frame, [x, y - h / 2 - .14, z + .1]));
  if (sh) [-1, 1].forEach(s => { p.push(P(rbox(w * .52, h + .12, .1, .04), sh, [x + s * (w * .78 + .08), y, z + .06])); for (let k = 0; k < 7; k++) p.push(P(Box(w * .44, .03, .05), '#2e5c44', [x + s * (w * .78 + .08), y - h / 2 + .2 + k * (h - .3) / 6, z + .12])); });
}
const Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const flowers = (p, x, y, z, w, cols = ['#ff6fae', '#ff9fd0', '#ffd23f', '#e8433a']) => { p.push(P(rbox(w, .35, .4, .08), '#b5643c', [x, y, z])); for (let i = 0; i < w * 5; i++) p.push(P(new THREE.IcosahedronGeometry(.13 + (i % 3) * .03, 0), i % 4 === 3 ? '#4f9a4a' : cols[i % cols.length], [x - w / 2 + .1 + (i * .2) % w, y + .25 + (i % 2) * .1, z + ((i * 7) % 3 - 1) * .08])); };
const bush = (p, x, y, z, s, c = '#5fa04e', c2 = '#ff6fae') => { for (let i = 0; i < 6; i++) p.push(P(new THREE.IcosahedronGeometry(s * (.5 + (i % 3) * .15), 1), i === 5 ? c2 : c, [x + Math.cos(i * 2.1) * s * .5, y + s * .4 + (i % 2) * s * .3, z + Math.sin(i * 2.1) * s * .4])); };

// 1. Bà Rịa tube house: mint facade, shop on the ground floor, two balconies full of plants, rooftop terrace
export function houseTube({ wall = '#9fd8c8', floors = 3, w = 4.4, d = 9, sign = null } = {}) {
  const p = [], fh = 3, trim = '#fff6e6', rail = '#3f7d6a';
  p.push(P(rbox(w, fh * floors, d, .12), wall, [0, fh * floors / 2, 0]));
  for (let f = 1; f < floors; f++) p.push(P(rbox(w + .1, .25, d + .1, .08), trim, [0, fh * f, 0]));
  // shop: half-open roller shutter, counter with jars, awning
  p.push(P(rbox(w - .6, 2.5, .2, .05), '#3d3640', [0, 1.3, d / 2 - .05]));
  p.push(P(rbox(w - .6, 1.0, .12, .03), '#c9cfd4', [0, 2.05, d / 2 + .05])); for (let k = 0; k < 6; k++) p.push(P(Box(w - .6, .03, .14), '#9aa1a7', [0, 1.6 + k * .16, d / 2 + .08]));
  p.push(P(rbox(w - 1.4, .7, .7, .08), '#d9a066', [0, .35, d / 2 + .3])); for (let i = 0; i < 4; i++) p.push(P(new THREE.CylinderGeometry(.14, .14, .3, 10), ['#ffcf5a', '#e8433a', '#7ac0e8', '#8ad66a'][i], [-1 + i * .66, .85, d / 2 + .35]));
  for (let i = 0; i < 6; i++) p.push(P(rbox((w + .4) / 6, .1, 1.4, .03), i % 2 ? '#ffffff' : '#e8433a', [-w / 2 - .2 + (i + .5) * (w + .4) / 6, 2.85, d / 2 + .6], [.35, 0, 0]));
  for (let f = 1; f < floors; f++) {
    const y = f * fh;
    p.push(P(rbox(w + .1, .2, 1.3, .06), trim, [0, y + .05, d / 2 + .6]));
    p.push(P(rbox(w + .1, .1, .1, .03), rail, [0, y + 1.05, d / 2 + 1.22]));
    for (let k = 0; k < 13; k++) p.push(P(new THREE.CylinderGeometry(.03, .03, .9, 6), rail, [-w / 2 + .1 + k * w / 12, y + .6, d / 2 + 1.22]));
    shutterWin(p, 0, y + 1.6, d / 2 + .04, w * .5, 1.8, trim, '#7fb8c4', '#4f8f74');
    flowers(p, -w / 2 + .7, y + .32, d / 2 + .95, 1.1); flowers(p, w / 2 - .7, y + .32, d / 2 + .95, 1.1, ['#ff4f9a', '#ff86c0', '#fff']);
  }
  // bougainvillea spilling down the side, AC unit, rooftop tiles and water tank
  for (let i = 0; i < 4 * floors; i++) p.push(P(new THREE.IcosahedronGeometry(.28 + (i % 3) * .08, 0), i % 3 ? '#ff4f9a' : '#4f9a4a', [w / 2 + .05, fh * (floors - .4) - i * .35, d / 2 + .9 - (i % 4) * .25]));
  p.push(P(rbox(.9, .55, .45, .06), '#f2f2f2', [-w / 2 + .8, fh * (floors - 1) + 2.6, d / 2 + .3]));
  const top = fh * floors; p.push(P(rbox(w + .2, .4, d + .2, .1), trim, [0, top + .2, 0]));
  slope(p, w + .5, 2.6, top + 1.0, d / 2 - 1.0, .55, '#d0603f', '#b84e34'); for (let k = 0; k < 9; k++) p.push(P(new THREE.CylinderGeometry(.03, .03, .8, 6), trim, [-w / 2 + .1 + k * w / 8, top + .8, -d / 2 + .1]));
  p.push(P(new THREE.CylinderGeometry(.55, .55, 1.6, 16), '#dfe6ea', [-w / 4, top + 1.4, -d / 4], [0, 0, Math.PI / 2]));
  const g = finish(p);
  if (sign) g.add(signMesh(sign, w - .3, .62, [0, 3.62, d / 2 + 1.3], '#e8433a'));
  return { obj: g, w, d: d + 2.6 };
}
// 2. Vũng Tàu French villa: butter-yellow walls, white mouldings, green louvred shutters, arched windows, terracotta roof
export function houseVilla() {
  const p = [], w = 10, d = 8, wall = '#f3cf72', trim = '#fffaf0', roof = '#d6693f', dark = '#b4502f';
  p.push(P(rbox(w, 3.2, d, .14), wall, [0, 1.6, 0]), P(rbox(w - .4, 3, d - .4, .14), wall, [0, 4.7, 0]));
  p.push(P(rbox(w + .3, .3, d + .3, .1), trim, [0, 3.25, 0]), P(rbox(w + .1, .3, d + .1, .1), trim, [0, 6.2, 0]));
  [-1, 1].forEach(s => p.push(P(rbox(.35, 6.2, .35, .08), trim, [s * (w / 2 - .1), 3.1, d / 2 - .1])));
  // porch with columns and a balcony
  p.push(P(rbox(4.4, .35, 2.4, .08), '#e8dcc4', [0, .18, d / 2 + 1.2]));
  [-1.9, 1.9].forEach(x => { p.push(P(new THREE.CylinderGeometry(.2, .24, 3, 14), trim, [x, 1.7, d / 2 + 2.1])); p.push(P(rbox(.55, .2, .55, .05), trim, [x, 3.2, d / 2 + 2.1])); });
  p.push(P(rbox(4.6, .25, 2.6, .08), trim, [0, 3.35, d / 2 + 1.2]));
  for (let k = 0; k < 13; k++) p.push(P(new THREE.CylinderGeometry(.06, .08, .7, 8), trim, [-2.1 + k * .35, 3.85, d / 2 + 2.35]));
  p.push(P(rbox(4.6, .12, .16, .04), trim, [0, 4.25, d / 2 + 2.35]));
  p.push(P(rbox(1.4, 2.5, .14, .06), '#4f8f74', [0, 1.4, d / 2 + .02]), P(new THREE.CylinderGeometry(.7, .7, .14, 16, 1, false, 0, Math.PI), '#4f8f74', [0, 2.65, d / 2 + .02], [Math.PI / 2, Math.PI / 2, 0]));
  [-3.4, 3.4].forEach(x => shutterWin(p, x, 1.7, d / 2 + .04, 1.1, 1.6, trim, '#7fb8c4', '#4f8f74', true));
  [-3.4, 0, 3.4].forEach(x => shutterWin(p, x, 4.8, d / 2 - .16, 1.1, 1.6, trim, '#7fb8c4', '#4f8f74', true));
  // hip roof with ribs
  p.push(P(new THREE.ConeGeometry(Math.SQRT1_2, 1, 4), roof, [0, 6.35 + 1.2, 0], [0, Math.PI / 4, 0], [w + .8, 2.4, d + .8]));
  p.push(P(rbox(.7, 1.3, .7, .1), trim, [2.6, 8.2, -1]), P(rbox(.85, .15, .85, .05), dark, [2.6, 8.9, -1]));
  bush(p, -4, 0, d / 2 + 1.2, 1.1, '#5fa04e', '#ffffff'); bush(p, 4, 0, d / 2 + 1.2, 1.1, '#5fa04e', '#ff6fae');
  return { obj: finish(p), w, d: d + 2.4 };
}
// 3. Sydney weatherboard cottage: duck-egg boards, red tin roof, bullnose verandah, lace, picket fence, jacaranda
export function houseCottage({ yard = true, wall: wallC = '#cfe6ee' } = {}) {
  const p = [], w = 9, d = 8, lift = .6, wall = wallC, trim = '#ffffff', roof = '#c8483a';
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => p.push(P(rbox(.35, lift, .35, .05), '#a89a8a', [x * (w / 2 - .3), lift / 2, z * (d / 2 - .3)])));
  p.push(P(rbox(w, 3, d, .1), wall, [0, lift + 1.5, 0]));
  for (let k = 0; k < 12; k++) p.push(P(rbox(w + .06, .07, d + .06, .03), '#b9d3dc', [0, lift + .14 + k * .25, 0]));
  gableRoof(p, w + .9, d, 2, lift + 3, roof, '#a83a2e', 'tin');
  const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(0, 2); sh.closePath();
  [-1, 1].forEach(s => p.push(P(new THREE.ExtrudeGeometry(sh, { depth: .1, bevelEnabled: false }), trim, [s * w / 2 - (s > 0 ? .1 : 0), lift + 3, 0], [0, Math.PI / 2, 0])));
  p.push(P(new THREE.CylinderGeometry(.12, .12, w + 1, 8), '#a83a2e', [0, lift + 5, 0], [0, 0, Math.PI / 2]));
  // bullnose verandah: curved roof, white posts, lace brackets, deck and steps
  p.push(P(rbox(w, .2, 2.6, .05), '#d4b48a', [0, lift, d / 2 + 1.3]));
  const bull = new THREE.CylinderGeometry(2.4, 2.4, w + .3, 24, 1, true, 0, Math.PI / 2); bull.rotateZ(Math.PI / 2);
  p.push(P(bull, roof, [0, lift + 2.4, d / 2 - .1], [0, 0, 0], [1, .45, 1.1]));
  for (let i = 0; i < 4; i++) { const x = -w / 2 + .2 + i * (w - .4) / 3; p.push(P(rbox(.16, 2.6, .16, .04), trim, [x, lift + 1.3, d / 2 + 2.5])); [-1, 1].forEach(s => { if ((i === 0 && s < 0) || (i === 3 && s > 0)) return; p.push(P(new THREE.TorusGeometry(.35, .05, 6, 12, Math.PI / 2), trim, [x + s * .35, lift + 2.25, d / 2 + 2.5], [0, 0, s > 0 ? Math.PI / 2 : 0])); }); }
  for (let k = 0; k < 30; k++) p.push(P(Box(.05, .7, .05), trim, [-w / 2 + .2 + k * (w - .4) / 29, lift + .45, d / 2 + 2.5]));
  p.push(P(rbox(w - .2, .08, .1, .03), trim, [0, lift + .8, d / 2 + 2.5]));
  p.push(P(rbox(1.6, .25, .55, .05), '#d4b48a', [0, .4, d / 2 + 2.85]), P(rbox(1.6, .25, .55, .05), '#d4b48a', [0, .14, d / 2 + 3.3]));
  p.push(P(rbox(1.1, 2.2, .1, .04), '#c8483a', [0, lift + 1.1, d / 2 + .03]), P(new THREE.SphereGeometry(.06, 8, 6), '#ffd23f', [.35, lift + 1.1, d / 2 + .1]));
  [-2.8, 2.8].forEach(x => shutterWin(p, x, lift + 1.7, d / 2 + .04, 1.4, 1.4, trim, '#86bfd0', null));
  if (yard) {
  // picket fence and letterbox
  for (let k = 0; k < 34; k++) { const x = -w / 2 - 1 + k * .33; if (Math.abs(x) < .9) continue; p.push(P(Box(.12, .9, .06), trim, [x, .45, d / 2 + 5])); p.push(P(new THREE.ConeGeometry(.085, .16, 4), trim, [x, .98, d / 2 + 5], [0, Math.PI / 4, 0])); }
  p.push(P(rbox(w + 2, .08, .06, .02), trim, [0, .7, d / 2 + 4.96]), P(rbox(w + 2, .08, .06, .02), trim, [0, .25, d / 2 + 4.96]));
  p.push(P(rbox(.12, 1.1, .12, .03), '#7a5236', [1.4, .55, d / 2 + 5.3]), P(rbox(.5, .4, .7, .1), '#e8433a', [1.4, 1.2, d / 2 + 5.3]));
  // jacaranda
  p.push(P(new THREE.CylinderGeometry(.18, .26, 3, 8), '#7a5a46', [w / 2 + 1.6, 1.5, d / 2 + 3]));
  for (let i = 0; i < 9; i++) p.push(P(new THREE.IcosahedronGeometry(.8 + (i % 3) * .2, 1), i % 4 ? '#a98be0' : '#c2a8f0', [w / 2 + 1.6 + Math.cos(i * 1.9) * 1.1, 3.4 + (i % 3) * .45, d / 2 + 3 + Math.sin(i * 1.9) * 1]));
  }
  bush(p, -w / 2 + .5, 0, d / 2 + 3.2, .9, '#5fa04e', '#ff6fae');
  return { obj: finish(p), w, d: d + 3.4 };
}
// 4. Traditional village house (nhà ba gian): wooden columns, upturned tiled eaves, brick yard, water jar, areca palms
export function houseVillage({ w = 9, d = 5.5, wall = '#efe0bf', tile = '#b9553a', palms = true } = {}) {
  const p = [], wood = '#9a6440', dark = '#8e3d2a';
  p.push(P(rbox(w + 1.6, .45, d + 2.4, .08), '#c9a48a', [0, .22, .4]));
  p.push(P(rbox(w, 2.6, d, .08), wall, [0, 1.75, -.3]));
  for (let i = 0; i < 6; i++) p.push(P(new THREE.CylinderGeometry(.16, .18, 2.9, 10), wood, [-w / 2 + .2 + i * (w - .4) / 5, 1.85, d / 2 + .5]));
  [-w / 3.1, 0, w / 3.1].forEach(x => { p.push(P(rbox(1.9, 2.1, .1, .04), wood, [x, 1.5, d / 2 - .25])); for (let k = 0; k < 5; k++) p.push(P(Box(.05, 2, .12), '#6f4630', [x - .76 + k * .38, 1.5, d / 2 - .2])); });
  // roof: big tiled gable with upturned dragon-tail corners
  const h = 2.6, y0 = 3.2, D = d + 2.2;
  gableRoof(p, w + 1.8, D, h, y0, tile, dark, 'tiles');
  // the gable ends are closed in with wall (they used to be open, and the roof looked like two loose boards)
  {
    const sh = new THREE.Shape(); sh.moveTo(-D / 2 + .25, 0); sh.lineTo(D / 2 - .25, 0); sh.lineTo(0, h - .12); sh.closePath();
    const tri = new THREE.ExtrudeGeometry(sh, { depth: .16, bevelEnabled: false });
    [-1, 1].forEach(sx => p.push(P(tri, wall, [sx * w / 2 - (sx > 0 ? .16 : 0), y0 - .02, 0], [0, Math.PI / 2, 0])));
    p.push(P(Box(w, .3, d), wall, [0, y0 - .05, -.3]));
  }
  p.push(P(rbox(w + 2.2, .35, .4, .12), dark, [0, y0 + h + .1, 0]));
  [-1, 1].forEach(s => { p.push(P(new THREE.ConeGeometry(.22, .9, 8), dark, [s * (w / 2 + 1.05), y0 + h + .45, 0], [0, 0, s * -.5])); [-1, 1].forEach(z => p.push(P(new THREE.ConeGeometry(.16, .7, 8), dark, [s * (w / 2 + .95), y0 + .2, z * (D / 2)], [z * .6, 0, s * -.9]))); });
  // yard: water jar, rice-drying mat, areca palms, potted kumquat
  p.push(P(new THREE.SphereGeometry(.6, 16, 12), '#7a5236', [w / 2 + .1, .9, d / 2 + 1.8], [0, 0, 0], [1, 1.1, 1]), P(new THREE.CylinderGeometry(.5, .5, .1, 16), '#3b6fa0', [w / 2 + .1, 1.5, d / 2 + 1.8]));
  p.push(P(new THREE.CylinderGeometry(1, 1, .05, 24), '#d9b86a', [-2, .48, d / 2 + 2.6]));
  if (palms) [-1, 1].forEach(s => { const x = s * (w / 2 + 2); p.push(P(new THREE.CylinderGeometry(.12, .16, 6, 8), '#9a8a6a', [x, 3, -1])); for (let i = 0; i < 7; i++) p.push(P(new THREE.ConeGeometry(.25, 2.2, 4), '#4f9a4a', [x + Math.cos(i * .9) * .9, 6.1 - Math.abs(Math.sin(i * .9)) * .3, -1 + Math.sin(i * .9) * .9], [Math.sin(i * .9) * 1.2, 0, -Math.cos(i * .9) * 1.2])); });
  p.push(P(new THREE.CylinderGeometry(.35, .28, .5, 12), '#c97a4a', [-w / 2 + .3, .7, d / 2 + 2]));
  for (let i = 0; i < 8; i++) p.push(P(new THREE.IcosahedronGeometry(.28, 0), i % 3 ? '#4f9a4a' : '#ffa52a', [-w / 2 + .3 + Math.cos(i) * .3, 1.3 + (i % 3) * .2, d / 2 + 2 + Math.sin(i) * .3]));
  return { obj: finish(p), w: w + 1.6, d: d + 2.4 };
}
const MAT = toonVC();
function finish(p) {
  const g = new THREE.Group(), m = new THREE.Mesh(merge(p), MAT); m.castShadow = m.receiveShadow = true; g.add(m); outline(m, .03, '#4a3a3f');
  return g;
}
// A shop sign: text is [English, Tiếng Việt] and follows the language.
function signMesh(text, w, h, pos, bg) {
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w); const x = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const draw = () => { const s = Array.isArray(text) ? text[settings.lang === 'vi' ? 1 : 0] : text; x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#fff'; x.font = `bold ${c.height * .58}px Fredoka, "Baloo 2", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, c.width / 2, c.height * .55, c.width * .94); t.needsUpdate = true; };
  draw(); onLang(draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t })); m.position.set(...pos); return m;
}
