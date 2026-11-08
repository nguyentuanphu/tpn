// The festival decorations' pieces (v1.08 startup, PERF-001: split from js/festivals.ts): the code pieces, the strings
// of flags and lanterns, the Blender props and their colour slots. Loaded with js/festdecor.ts once a child is in the
// valley and a festival is near (js/festivals.ts loadD), so they are not in the first download.
import { THREE, P } from './gfx.js';
import { heightAt } from './world.js';
import { PROPS, PROP_NAMES, FEST_MODELS } from './festivals.js';

// (v1.08g) the colour slots of a model: corners painted pure red, blue or green take the festival's colours (pal[0..2]),
// at the brightness the painted light gave them
const SLOTS: Record<string, { i: number[], k: number[] }[]> = {};
function findSlots(name: string, g: THREE.BufferGeometry) {
  const c = g.getAttribute('color'); if (!c) return;
  const out = [{ i: [], k: [] }, { i: [], k: [] }, { i: [], k: [] }];
  for (let i = 0; i < c.count; i++) { const r = c.getX(i), gg = c.getY(i), b = c.getZ(i);
    if (r > .04 && gg < .002 && b < .002) { out[0].i.push(i); out[0].k.push(r); } else if (b > .04 && r < .002 && gg < .002) { out[1].i.push(i); out[1].k.push(b); } else if (gg > .04 && r < .002 && b < .002) { out[2].i.push(i); out[2].k.push(gg); } }
  if (out.some(o => o.i.length)) SLOTS[name] = out;
}
const _pm = new THREE.Matrix4(), _pq = new THREE.Quaternion(), _py = new THREE.Vector3(0, 1, 0), _pc = new THREE.Color();
export const prop = (name: string, x: number, y: number, z: number, rot = 0, s = 1, pal: string[] = null) => { const g = PROPS[name]; if (!g) return null;
  _pm.compose(new THREE.Vector3(x, y, z), _pq.setFromAxisAngle(_py, rot), new THREE.Vector3(s, s, s)); const out = g.clone().applyMatrix4(_pm);
  const sl = SLOTS[name], col = out.getAttribute('color') as THREE.BufferAttribute;
  if (sl && col) sl.forEach((o, j) => { _pc.set((pal && pal[j % pal.length]) || ['#ff4f9a', '#ffd23f', '#3cc7e8'][j]); o.i.forEach((i, n) => col.setXYZ(i, _pc.r * o.k[n], _pc.g * o.k[n], _pc.b * o.k[n])); });
  return { g: out, color: null }; };
export async function loadProps(names: string[] = PROP_NAMES) { const K = await import('./modelkit.js');
  await Promise.all(names.filter(n => !PROPS[n] && !K.worldModelFailed(n)).map(async n => { const r = await K.worldModelParts(n); if (r && r[0]) { const g = r[0].geometry.index ? r[0].geometry.toNonIndexed() : r[0].geometry; PROPS[n] = g; findSlots(n, g); } })); }
// the models the festivals on now need (their themes and the shared pieces), not yet here
export const propsFor = (list: { F: { theme: string } }[]) => [...new Set([...PROP_NAMES, ...(list.length ? FEST_MODELS.shared : []), ...list.flatMap(a => FEST_MODELS[a.F.theme] || [])])].filter(n => !PROPS[n]);
const Sph = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h);
export const Cyl = (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s);
export const Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
// a string of little flags (or lanterns, or friendly bats) hanging between two posts, with a gentle sag
export function bunting(a, b, cols, kind = 'flag', wall = false, supports = null) {
  const parts = [], glows = [];
  const [ax, ay, az] = a, [bx, by, bz] = b, n = Math.max(4, Math.round(Math.hypot(bx - ax, bz - az) / (kind === 'lantern' ? 1 : .7))), yaw = Math.atan2(bx - ax, bz - az);
  if (!wall) for (const [x, y, z] of [a, b]) { const key=x.toFixed(3)+','+z.toFixed(3),ground=heightAt(x,z),from=supports?.get(key)??ground; if(y>from+.02)parts.push(P(Cyl(.06,from>ground+.02?.06:.08,y-from,6),'#8a6a4a',[x,(y+from)/2,z]));if(supports)supports.set(key,Math.max(y,from)); }
  for (let i = 1; i < n; i++) {
    const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = ay + (by - ay) * t - Math.sin(t * Math.PI) * .7, c = cols[i % cols.length];
    if (kind === 'lantern') { parts.push(P(Cyl(.012, .012, .25, 3), '#3a2a20', [x, y - .1, z])); glows.push(P(Sph(.15, 8, 6), c, [x, y - .3, z], [0, 0, 0], [1, 1.25, 1]), P(Cyl(.08, .08, .05, 8), '#ffd23f', [x, y - .1, z])); }
    else if (kind === 'bat') parts.push(P(Box(.36, .12, .03), '#4a3a6a', [x, y - .12, z], [0, yaw + Math.PI / 2, 0]), P(Sph(.07), '#4a3a6a', [x, y - .1, z]));
    else parts.push(P(new THREE.ConeGeometry(.16, .32, 3), c, [x, y - .16, z], [Math.PI, yaw, 0]));
  }
  const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector3(ax + (bx - ax) * t, ay + (by - ay) * t - Math.sin(t * Math.PI) * .7, az + (bz - az) * t)); }
  parts.push(P(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, .012, 3, false), '#3a2a20'));
  return { parts, glows };
}
// a round, smiling pumpkin (two round eyes and a big smile: friendly, never scary); its face glows at night
export const pumpkin = (x, y, z, s = 1, rot = 0) => {
  const parts = [], glows = [];
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; parts.push(P(Sph(.28 * s, 10, 8), k % 2 ? '#f08a24' : '#f59a32', [x + Math.cos(a) * .12 * s, y + .26 * s, z + Math.sin(a) * .12 * s], [0, 0, 0], [.8, .9, .8])); }
  parts.push(P(Cyl(.04 * s, .06 * s, .16 * s, 6), '#4f7a2a', [x, y + .56 * s, z], [.2, 0, .15]));
  const fx = Math.sin(rot), fz = Math.cos(rot), fr = .37 * s;
  for (const e of [-1, 1]) glows.push(P(Sph(.06 * s, 8, 6), '#ffd23f', [x + fx * fr + fz * e * .11 * s, y + .33 * s, z + fz * fr - fx * e * .11 * s], [0, 0, 0], [1, 1, .4]));
  glows.push(P(new THREE.TorusGeometry(.1 * s, .025 * s, 4, 10, Math.PI), '#ffd23f', [x + fx * fr, y + .2 * s, z + fz * fr], [0, rot, Math.PI]));
  return { parts, glows };
};
// (owner, 13 Oct: many more decorations) four pieces every theme shares, in the theme's own colours, so a street of
// 5x the pieces never looks like one piece over and over: a lantern post, a pennant pole, a flower tub, a garland arch
function shared(theme, k, x, y, z, rot) {
  const parts = [], glows = [], cols = (THEME_BUNTING[theme] || [['#ff4f9a', '#ffd23f']])[0], c = j => cols[j % cols.length];
  // (v1.08g festivals) the Blender pieces, repainted in the festival's colours
  const pal = [c(0), c(1), c(2)], name = ['fe-lanternpost', 'fe-pennantpole', 'fe-flowertub', 'fe-arch'][k];
  if (PROPS[name]) { parts.push(prop(name, x, y, z, rot, 1, pal)); if (PROPS[name + '-glow']) glows.push(prop(name + '-glow', x, y, z, rot, 1, [c(0), c(1), c(1)])); return { parts, glows }; }
  if (k === 0) { parts.push(P(Cyl(.04, .05, 2.1, 5), '#5a4a3a', [x, y + 1.05, z]), P(Box(.7, .05, .05), '#5a4a3a', [x, y + 2.05, z], [0, rot, 0]));
    for (const s of [-1, 1]) { const lx = x + Math.cos(rot) * .3 * s, lz = z - Math.sin(rot) * .3 * s; glows.push(P(Sph(.16, 8, 6), c(s > 0 ? 0 : 1), [lx, y + 1.78, lz], [0, 0, 0], [1, 1.25, 1])); } }
  else if (k === 1) { parts.push(P(Cyl(.03, .03, 2.4, 4), '#c9d0d4', [x, y + 1.2, z]));
    for (let j = 0; j < 3; j++) parts.push(P(new THREE.ConeGeometry(.16, .5, 3), c(j), [x + Math.sin(rot + Math.PI / 2) * .26, y + 2.15 - j * .42, z + Math.cos(rot + Math.PI / 2) * .26], [0, rot, Math.PI / 2])); }
  else if (k === 2) { parts.push(P(Box(.7, .35, .4), '#8a5a3a', [x, y + .17, z], [0, rot, 0]));
    for (let j = 0; j < 5; j++) parts.push(P(Sph(.12, 6, 5), c(j), [x + Math.cos(rot) * (j - 2) * .14, y + .45 + (j % 2) * .08, z - Math.sin(rot) * (j - 2) * .14])); }
  else { for (const s of [-1, 1]) parts.push(P(Cyl(.035, .035, 1.9, 4), '#6a4a3a', [x + Math.cos(rot) * .6 * s, y + .95, z - Math.sin(rot) * .6 * s]));
    for (let j = 0; j <= 6; j++) { const t = j / 6, a = t * Math.PI, px = Math.cos(a) * .6, py = 1.9 + Math.sin(a) * .35; glows.push(P(Sph(.09, 6, 5), c(j), [x + Math.cos(rot) * px, y + py, z - Math.sin(rot) * px])); } }
  return { parts, glows };
}
// one decoration piece of a theme: of every 6 spots, 3 carry the theme's own pieces and 3 the shared ones
export function piece(theme, i, x, y, z, rot) {
  const slot = i % 6, round = Math.floor(i / 6);
  return slot >= 3 ? shared(theme, (round + slot) % 4, x, y, z, rot) : own(theme, round * 3 + slot, x, y, z, rot);
}
// one of the theme's own pieces at (x, y, z); i picks among them; rot faces it
function own(theme, i, x, y, z, rot) {
  const parts = [], glows = [], add = r => { parts.push(...r.parts); glows.push(...r.glows); };
  const pot = (col, flowers) => { parts.push(P(Cyl(.32, .24, .45, 10), '#b8643a', [x, y + .22, z])); flowers.forEach((c, k) => { const a = k * 2.4; parts.push(P(Sph(.13, 6, 5), c, [x + Math.cos(a) * .2, y + .62 + (k % 2) * .12, z + Math.sin(a) * .2])); }); parts.push(P(Sph(.26, 8, 6), col, [x, y + .55, z])); };
  // (v1.08g festivals) a theme's own Blender piece (with its glow), if this festival's models are here
  const fe = (name: string, pal: string[] = null, dx = 0, dz = 0) => { if (!PROPS[name]) return false; const px = x + Math.cos(rot) * dx + Math.sin(rot) * dz, pz = z - Math.sin(rot) * dx + Math.cos(rot) * dz;
    parts.push(prop(name, px, y, pz, rot, 1, pal)); if (PROPS[name + '-glow']) glows.push(prop(name + '-glow', px, y, pz, rot, 1, pal)); return true; };
  const model = (() => { switch (theme) {
    case 'tet': return i % 3 === 2 && fe('fe-caudoi');
    case 'pumpkins': return fe(['fe-pumpkins', 'fe-skeleton', 'fe-web', 'fe-ghost', 'fe-cat', 'fe-cauldron', 'fe-scarecrow', 'fe-witchhat'][i % 8]);
    case 'xmas': return i % 3 !== 0 && fe('fe-presents');
    case 'hearts': return i % 2 ? fe('fe-pot', ['#ff6b8a', '#ff4f6a', '#ff9ab8']) : fe('fe-heartpole');
    case 'diyas': return fe('fe-diyas'); case 'colours': return fe('fe-colours'); case 'poppies': return fe('fe-poppy'); case 'ochre': return fe('fe-ochre');
    case 'harmony': return fe('fe-balloons', ['#ff9a2e', '#ffb35a', '#ff8a1a']); case 'kids': case 'sparkle': return fe('fe-balloons', ['#ff4f9a', '#3cc7e8', '#5fd36a']);
    case 'clean': return fe('fe-bins'); case 'kitchen': return fe('fe-carpbasin'); case 'dragonboat': return fe('fe-dragonboat');
    case 'teacher': return fe('fe-teacher') && (fe('fe-pot', ['#ffb3c8', '#ff4f6a', '#ffd23f'], .55, -.1) || true);
    case 'flags-vn': return fe('fe-flag-vn'); case 'flags-au': return fe('fe-flag-au');
    default: return false; } })();
  if (model) return { parts, glows };
  const balloons = cols => cols.forEach((c, k) => { const a = k * 2.1, bx = x + Math.cos(a) * .25, bz = z + Math.sin(a) * .25, h = 1.9 + (k % 3) * .25; parts.push(P(Cyl(.008, .008, h, 3), '#ffffff', [bx, y + h / 2, bz]), P(Sph(.22, 10, 8), c, [bx, y + h + .2, bz], [0, 0, 0], [1, 1.2, 1])); });
  switch (theme) {
    case 'tet':
      if (i % 3 === 0 && PROPS['pr-peach']) parts.push(prop('pr-peach', x, y, z, rot));   // hoa đào (Blender)
      else if (i % 3 === 1 && PROPS['pr-mai']) parts.push(prop('pr-mai', x, y, z, rot));   // hoa mai (Blender)
      else if (i % 3 === 0) { parts.push(P(Cyl(.06, .1, 1.4, 6), '#6a4a3a', [x, y + .7, z]), P(Cyl(.34, .26, .4, 10), '#c62828', [x, y + .2, z])); for (let k = 0; k < 10; k++) { const a = k * 2.4, r = .25 + (k % 3) * .18; parts.push(P(Sph(.12, 6, 5), k % 4 ? '#ffb3c8' : '#ffffff', [x + Math.cos(a) * r, y + 1.35 + (k % 4) * .12, z + Math.sin(a) * r])); } }   // hoa đào in a red pot
      else if (i % 3 === 1) pot('#ffd23f', ['#ffe066', '#ffd23f', '#ffe066', '#ffcf3a']);   // hoa mai
      else { parts.push(P(Box(.6, .9, .05), '#c62828', [x, y + 1.2, z], [0, rot, 0]), P(Cyl(.03, .03, 1.8, 4), '#6a4a3a', [x, y + .9, z])); glows.push(P(Box(.36, .5, .06), '#ffd23f', [x, y + 1.2, z], [0, rot, 0])); }   // a red câu đối banner
      break;
    case 'lanterns':
      if (i % 2 && PROPS['pr-starlantern']) { parts.push(P(Cyl(.03, .03, 1.7, 4), '#6a4a3a', [x, y + .85, z])); glows.push(prop('pr-starlantern', x, y + 1.9, z, rot)); }   // the star lantern (Blender)
      else if (!(i % 2) && PROPS['pr-lantern']) { parts.push(P(Cyl(.03, .03, 1.2, 4), '#6a4a3a', [x, y + .6, z])); glows.push(prop('pr-lantern', x, y + 1.4, z, rot)); }   // a round lantern (Blender)
      else if (i % 2) { parts.push(P(Cyl(.03, .03, 1.7, 4), '#6a4a3a', [x, y + .85, z])); glows.push(P(new THREE.OctahedronGeometry(.36, 0), i % 4 === 1 ? '#ff4a3a' : '#ffd23f', [x, y + 1.9, z], [0, rot, Math.PI / 4], [1, 1, .25])); }   // a star lantern (đèn ông sao) on a stick
      else { parts.push(P(Cyl(.03, .03, 1.2, 4), '#6a4a3a', [x, y + .6, z])); glows.push(P(Sph(.3, 10, 8), '#ff7a3a', [x, y + 1.4, z], [0, 0, 0], [1, 1.2, 1]), P(Cyl(.12, .12, .06, 8), '#ffd23f', [x, y + 1.78, z])); }
      break;
    case 'pumpkins': {
      // (owner, 13 Oct: "all types of decorations including skeletons, spider webs") eight kinds, all friendly: smiling
      // pumpkins, a waving skeleton, a spider web with a little purple spider, a smiling ghost, a black cat, a cauldron of
      // green bubbles, a scarecrow, a witch's hat; never scary (round faces, big eyes, smiles)
      const k = i % 8, fx = Math.sin(rot), fz = Math.cos(rot), sx = Math.cos(rot), sz = -Math.sin(rot), at = (u, h, f = 0) => [x + sx * u + fx * f, y + h, z + sz * u + fz * f];
      if (k === 0) { add(pumpkin(x, y, z, 1.4, rot)); add(pumpkin(x + .5, y, z + .4, .6, rot)); }
      else if (k === 1) { // a friendly skeleton waving, bones white, a round smiling skull
        parts.push(P(Sph(.24), '#f6f2e6', at(0, 1.55)), P(Cyl(.04, .04, .55, 5), '#f6f2e6', at(0, 1.05)));
        for (let j = 0; j < 3; j++) parts.push(P(Box(.36 - j * .04, .04, .08), '#f6f2e6', at(0, 1.22 - j * .11), [0, rot, 0]));
        parts.push(P(Cyl(.03, .03, .5, 5), '#f6f2e6', at(-.22, 1.42), [0, rot, -.9]), P(Cyl(.03, .03, .45, 5), '#f6f2e6', at(.2, .98), [0, rot, .25]));
        for (const s of [-1, 1]) parts.push(P(Cyl(.035, .035, .7, 5), '#f6f2e6', at(s * .09, .4)), P(Sph(.05, 6, 4), '#2a2a3a', at(s * .08, 1.6, .2)));
        parts.push(P(new THREE.TorusGeometry(.07, .015, 3, 8, Math.PI), '#2a2a3a', at(0, 1.48, .21), [0, rot, Math.PI])); }
      else if (k === 2) { // a spider web between two posts, a little purple spider with big eyes
        for (const s of [-1, 1]) parts.push(P(Cyl(.035, .04, 1.8, 5), '#6a4a3a', at(s * .6, .9)));
        for (let j = 0; j < 8; j++) { const a = j / 8 * Math.PI * 2; parts.push(P(Cyl(.008, .008, .58, 3), '#e8e8f0', at(Math.cos(a) * .28, 1.25 + Math.sin(a) * .28), [0, rot, a + Math.PI / 2])); }
        for (const r of [.14, .28, .42]) parts.push(P(new THREE.TorusGeometry(r, .008, 3, 8), '#e8e8f0', at(0, 1.25), [0, rot, 0]));
        parts.push(P(Sph(.09, 6, 5), '#7a4aa0', at(.12, 1.18, .03))); for (const s of [-1, 1]) glows.push(P(Sph(.03, 5, 4), '#ffffff', at(.12 + s * .04, 1.21, .1)));
        for (let j = 0; j < 4; j++) for (const s of [-1, 1]) parts.push(P(Cyl(.01, .01, .16, 3), '#4a3a6a', at(.12 + s * .1, 1.18 - (j - 1.5) * .04, .03), [0, rot, s * 1.2])); }
      else if (k === 3) { // a smiling ghost: a white sheet, big dark eyes and a round "oo" mouth, floating a little
        parts.push(P(Sph(.32), '#ffffff', at(0, 1.25), [0, 0, 0], [1, 1.1, 1]), P(new THREE.ConeGeometry(.36, .7, 10, 1, true), '#ffffff', at(0, .85), [0, 0, 0]));
        for (const s of [-1, 1]) parts.push(P(Sph(.06, 6, 5), '#2a2a3a', at(s * .1, 1.32, .27), [0, 0, 0], [1, 1.3, .6]));
        parts.push(P(Sph(.05, 6, 5), '#2a2a3a', at(0, 1.16, .29), [0, 0, 0], [1, 1, .5])); }
      else if (k === 4) { // a black cat sitting with its tail up, yellow eyes that glow at night
        parts.push(P(Sph(.2), '#2a2a34', at(0, .22), [0, 0, 0], [1, 1.2, .9]), P(Sph(.15), '#2a2a34', at(0, .55, .05)));
        for (const s of [-1, 1]) { parts.push(P(new THREE.ConeGeometry(.05, .1, 4), '#2a2a34', at(s * .08, .7, .05))); glows.push(P(Sph(.03, 5, 4), '#ffd23f', at(s * .055, .57, .18))); }
        parts.push(P(Cyl(.025, .02, .5, 4), '#2a2a34', at(-.18, .45, -.12), [0, rot, .5])); }
      else if (k === 5) { // a cauldron of green bubbles on three legs
        parts.push(P(new THREE.SphereGeometry(.32, 10, 6, 0, Math.PI * 2, Math.PI * .35, Math.PI * .65), '#2a2a34', at(0, .42)), P(new THREE.TorusGeometry(.26, .04, 4, 12), '#3a3a44', at(0, .5), [Math.PI / 2, 0, 0]));
        for (let j = 0; j < 3; j++) { const a = j / 3 * Math.PI * 2; parts.push(P(Cyl(.03, .03, .25, 4), '#3a3a44', [x + Math.cos(a) * .2, y + .12, z + Math.sin(a) * .2])); }
        glows.push(P(Cyl(.24, .24, .03, 10), '#5fd36a', at(0, .52))); for (let j = 0; j < 3; j++) glows.push(P(Sph(.06 + j * .02, 6, 4), '#8af07a', at((j - 1) * .1, .6 + j * .06))); }
      else if (k === 6) { // a scarecrow with a pumpkin head and a straw hat
        parts.push(P(Cyl(.04, .04, 1.7, 5), '#6a4a3a', at(0, .85)), P(Cyl(.03, .03, 1.1, 5), '#6a4a3a', at(0, 1.25), [0, rot, Math.PI / 2]), P(Box(.42, .5, .2), '#5a7ad0', at(0, 1.15), [0, rot, 0]));
        add(pumpkin(x, y + 1.42, z, .55, rot)); parts.push(P(Cyl(.3, .32, .04, 10), '#d8b45a', at(0, 1.78)), P(Cyl(.14, .17, .16, 10), '#d8b45a', at(0, 1.86))); }
      else { // a purple witch's hat on a pole, and a bowl of sweets
        parts.push(P(Cyl(.03, .03, 1.3, 4), '#6a4a3a', at(0, .65)), P(Cyl(.28, .28, .03, 12), '#5a3a8a', at(0, 1.32)), P(new THREE.ConeGeometry(.16, .45, 10), '#5a3a8a', at(0, 1.56), [0, 0, .15]));
        parts.push(P(Cyl(.17, .17, .05, 10), '#ff8a1a', at(0, 1.36)), P(Cyl(.2, .15, .25, 10), '#7a4aa0', at(.5, .12)));
        ['#ff7a2a', '#ffd23f', '#ffffff', '#ff4f9a'].forEach((c, j) => parts.push(P(Sph(.06, 6, 5), c, at(.5 + (j - 1.5) * .07, .28)))); }
      break; }
    case 'xmas':
      if (i % 3 === 0) { if (PROPS['pr-xmastree']) parts.push(prop('pr-xmastree', x, y, z, rot)); else { for (let k = 0; k < 3; k++) parts.push(P(new THREE.ConeGeometry(.9 - k * .25, .9, 10), '#2f7a3a', [x, y + .8 + k * .55, z])); parts.push(P(Cyl(.1, .12, .4, 6), '#6a4a3a', [x, y + .2, z])); } glows.push(P(new THREE.OctahedronGeometry(.18, 0), '#ffd23f', [x, y + 2.35, z])); for (let k = 0; k < 9; k++) { const a = k * 2.3, r = .65 - (k % 3) * .2; glows.push(P(Sph(.07, 6, 5), ['#ff4a3a', '#ffd23f', '#3cc7e8'][k % 3], [x + Math.cos(a) * r, y + .8 + (k % 3) * .55, z + Math.sin(a) * r])); } }
      else ['#e8433a', '#3a78c8', '#ffd23f'].forEach((c, k) => parts.push(P(Box(.36 - k * .06, .3 - k * .04, .36 - k * .06), c, [x + (k - 1) * .4, y + .15 - k * .02, z]), P(Box(.38 - k * .06, .05, .06), '#ffffff', [x + (k - 1) * .4, y + .32 - k * .04, z])));
      break;
    case 'eggs': if (PROPS['pr-eggs']) { parts.push(prop('pr-eggs', x, y, z, rot)); break; } ['#ff9ab8', '#7fd6d0', '#ffd23f', '#c6a8f0'].forEach((c, k) => { if ((i + k) % 2) parts.push(P(Sph(.2, 10, 8), c, [x + (k - 1.5) * .35, y + .25, z], [0, 0, 0], [1, 1.35, 1]), P(new THREE.TorusGeometry(.2, .02, 4, 14), '#ffffff', [x + (k - 1.5) * .35, y + .25, z], [Math.PI / 2, 0, 0])); }); break;
    case 'hearts': if (i % 2) pot('#ff6b8a', ['#ff4f6a', '#ff9ab8', '#ffffff']); else { parts.push(P(Cyl(.03, .03, 1.6, 4), '#6a4a3a', [x, y + .8, z])); for (const s of [-1, 1]) parts.push(P(Sph(.2, 10, 8), '#ff4f6a', [x + s * .14, y + 1.75, z])); parts.push(P(new THREE.ConeGeometry(.3, .4, 4), '#ff4f6a', [x, y + 1.5, z], [Math.PI, Math.PI / 4, 0])); } break;
    case 'diyas': for (let k = 0; k < 4; k++) { const dx = (k - 1.5) * .45; parts.push(P(Cyl(.14, .08, .1, 10), '#b8643a', [x + dx, y + .05, z])); glows.push(P(new THREE.ConeGeometry(.05, .16, 6), '#ffb43a', [x + dx, y + .18, z])); } parts.push(P(new THREE.TorusGeometry(.5, .07, 5, 16), '#ff9a2e', [x, y + .03, z + .6], [Math.PI / 2, 0, 0])); break;   // clay lamps and a marigold ring
    case 'colours': ['#ff4f9a', '#ffd23f', '#3cc7e8', '#5fd36a', '#ff9f43', '#9a6af0'].forEach((c, k) => { const a = k / 6 * Math.PI * 2; parts.push(P(new THREE.ConeGeometry(.22, .22, 10), c, [x + Math.cos(a) * .5, y + .11, z + Math.sin(a) * .5])); }); break;   // little hills of colour powder
    case 'poppies': parts.push(P(Cyl(.03, .03, 1.1, 4), '#6a4a3a', [x, y + .55, z]), P(new THREE.TorusGeometry(.32, .06, 6, 16), '#3a6a2a', [x, y + 1.2, z], [0, rot, 0])); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; parts.push(P(Sph(.09, 6, 5), '#d8202a', [x + Math.cos(a) * .32 * Math.cos(rot), y + 1.2 + Math.sin(a) * .32, z - Math.cos(a) * .32 * Math.sin(rot)])); } break;   // a quiet wreath of poppies
    case 'ochre': parts.push(P(Box(1.0, 1.0, .06), '#8a3a1a', [x, y + .9, z], [0, rot, 0]), P(Cyl(.03, .03, .9, 4), '#5a3a2a', [x, y + .45, z])); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, r = .12 + (k % 3) * .12; parts.push(P(Sph(.035, 5, 4), ['#ffd23f', '#ffffff', '#e8a04a'][k % 3], [x + Math.sin(rot) * .04 + Math.cos(rot) * Math.cos(a) * r, y + .9 + Math.sin(a) * r, z + Math.cos(rot) * .04 - Math.sin(rot) * Math.cos(a) * r])); } break;   // a dot painting
    case 'harmony': case 'kids': case 'sparkle': balloons(theme === 'harmony' ? ['#ff9a2e', '#ffb35a', '#ff8a1a'] : ['#ff4f9a', '#ffd23f', '#3cc7e8', '#5fd36a']); break;
    case 'clean': [['#3a78c8', '#ffd23f'], ['#5a8a3a', '#e8433a']].forEach((c, k) => parts.push(P(Box(.5, .8, .5), '#3a3d40', [x + k * .65, y + .4, z]), P(Box(.54, .08, .54), c[1], [x + k * .65, y + .84, z]))); break;   // recycling and rubbish bins
    case 'kitchen': parts.push(P(Cyl(.45, .4, .25, 14), '#c9a05a', [x, y + .12, z]), P(Cyl(.4, .4, .02, 14), '#5aaee0', [x, y + .24, z])); glows.push(P(Sph(.12, 8, 6), '#ffb43a', [x, y + .3, z], [0, rot, 0], [1, .6, 2.2])); break;   // a basin with a golden carp
    case 'dragonboat': parts.push(P(Box(.5, .25, 2.4), '#c62828', [x, y + .12, z], [0, rot, 0]), P(Sph(.2, 8, 6), '#2f9a4a', [x + Math.sin(rot) * 1.3, y + .4, z + Math.cos(rot) * 1.3])); break;
    case 'teacher': parts.push(P(Box(.7, .5, .04), '#fff3c4', [x, y + .9, z], [0, rot, 0]), P(Cyl(.03, .03, .8, 4), '#6a4a3a', [x, y + .4, z])); pot('#ffb3c8', ['#ff4f6a', '#ffffff', '#ffd23f']); break;
    default: { // flags: red with a gold star (Vietnam), green and gold (Australia), on poles
      const vn = theme === 'flags-vn';
      parts.push(P(Cyl(.03, .03, 2.2, 4), '#c9d0d4', [x, y + 1.1, z]), P(Box(.04, .45, .7), vn ? '#d8202a' : '#2f8a3a', [x, y + 1.95, z + .35], [0, rot, 0]));
      if (vn) glows.push(P(new THREE.OctahedronGeometry(.1, 0), '#ffd23f', [x + .03, y + 1.95, z + .35]));
      else parts.push(P(Box(.045, .15, .7), '#ffd23f', [x, y + 1.95, z + .35], [0, rot, 0]));
    }
  }
  return { parts, glows };
}
export const THEME_BUNTING = { tet: [['#c62828', '#ffd23f'], 'lantern'], lanterns: [['#ff7a3a', '#ffd23f', '#ff4a3a'], 'lantern'], pumpkins: [['#ff8a1a', '#7a4aa0', '#4a3a6a'], 'bat'], xmas: [['#e8433a', '#2f7a3a', '#ffd23f'], 'flag'],
  eggs: [['#ff9ab8', '#7fd6d0', '#ffd23f', '#c6a8f0'], 'flag'], hearts: [['#ff4f6a', '#ff9ab8', '#ffffff'], 'flag'], diyas: [['#ff9a2e', '#ffd23f', '#e8433a'], 'lantern'], colours: [['#ff4f9a', '#ffd23f', '#3cc7e8', '#5fd36a', '#9a6af0'], 'flag'],
  'flags-vn': [['#d8202a', '#ffd23f'], 'flag'], 'flags-au': [['#2f8a3a', '#ffd23f'], 'flag'], harmony: [['#ff9a2e', '#ffb35a'], 'flag'], kids: [['#ff4f9a', '#ffd23f', '#3cc7e8', '#5fd36a'], 'flag'], sparkle: [['#ffd23f', '#3cc7e8', '#ff4f9a'], 'lantern'],
  dragonboat: [['#c62828', '#2f9a4a', '#ffd23f'], 'flag'], teacher: [['#ff9ab8', '#ffffff', '#ffd23f'], 'flag'], kitchen: [['#c62828', '#ffd23f'], 'lantern'], ochre: [['#8a3a1a', '#ffd23f', '#1d1d1d'], 'flag'] };
