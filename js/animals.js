// Animal models with a body you can see moving: every kind has its own shape (a puppy is long with floppy
// ears and a wagging tail, a kitty is slim with pointed ears and a tail held up, a bunny hops with long ears,
// a joey hops upright on big feet with a thick tail…). Legs, head, ears and tail are separate parts, so they
// walk, hop, wag and look around. Each model faces +z and stands on y = 0.
//   animalModel(kind) → THREE.Group (children[0] = the animal, children[1] = its round shadow)
//   tickAnimals(dt, t, heroes) → moves every animal's legs, tail and head (speed comes from how it moved)
import { THREE, P, merge, toonVC, blobShadow } from './gfx.js';

const S = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h);
const Cap = (r, l, s = 10) => new THREE.CapsuleGeometry(r, l, 4, s);
const Cyl = (r1, r2, h, s = 10) => new THREE.CylinderGeometry(r1, r2, h, s);
const Cone = (r, h, s = 10) => new THREE.ConeGeometry(r, h, s);
const Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const Tor = (r, t, a = Math.PI * 2) => new THREE.TorusGeometry(r, t, 6, 14, a);
const H = Math.PI / 2;
const s0 = x => Math.sign(x);

const mat = toonVC({ roughness: .85 });
function mesh(parts) { const m = new THREE.Mesh(merge(parts), mat); m.castShadow = true; return m; }
function pivot(parent, pos, parts) { const g = new THREE.Group(); g.position.set(...pos); if (parts && parts.length) g.add(mesh(parts)); parent.add(g); return g; }
// two eyes with a light catch, so the face looks alive
const eyes = (x, y, z, r = .03, col = '#1a1a1a') => [-1, 1].flatMap(s => [P(S(r, 10, 8), col, [s * x, y, z]), P(S(r * .35, 6, 5), '#ffffff', [s * x + r * .3, y + r * .35, z + r * .75])]);

// rig = { root (the moving body), legs: [[pivot, phase]], head, ears, tail, gait, wag, … }
function make(kind, build, shadow) {
  const g = new THREE.Group(), root = new THREE.Group(); g.add(root);
  const sh = blobShadow(); sh.scale.setScalar(shadow); g.add(sh);
  const rig = { kind, root, legs: [], ears: [], gait: 'walk', wag: 0, sway: 0, seed: Math.random() * 10, ph: 0, sp: 0, px: null, pz: null };
  build(root, rig);
  g.userData.rig = rig; g.userData.moving = true; LIVE.add(g); // (an animal wanders: never part of the solid map, js/solids.js, even if it stands still while the map is made)
  return g;
}

const BUILD = {
  puppy: (R, r) => {
    const fur = '#c98b4a', dark = '#7a4f2a', cream = '#f2dcb8';
    R.add(mesh([P(Cap(.19, .4), fur, [0, .42, 0], [H, 0, 0]), P(S(.17), cream, [0, .38, .2], [0, 0, 0], [1, 1, .8]), P(S(.13), dark, [0, .55, -.08], [0, 0, 0], [1.1, .5, 1.4])]));
    r.head = pivot(R, [0, .62, .3], [P(S(.17), fur, [0, .05, .03]), P(Cap(.085, .1), cream, [0, -.02, .17], [H, 0, 0]), P(S(.042), '#222', [0, .02, .28]), P(Box(.06, .015, .05), '#ff7d8f', [0, -.08, .21]), ...eyes(.07, .09, .15)]);
    for (const s of [-1, 1]) { const e = pivot(r.head, [s * .13, .13, 0], [P(Cap(.055, .13), dark, [s * .02, -.1, 0], [0, 0, s * .2], [1, 1, .55])]); e.rotation.z = s * .35; r.ears.push(e); }
    r.tail = pivot(R, [0, .52, -.3], [P(Cap(.03, .2), fur, [0, .1, -.05], [-.5, 0, 0]), P(S(.04), cream, [0, .22, -.11])]); r.wag = 14;
    for (const [x, z, ph] of [[.1, .17, 0], [-.1, .17, Math.PI], [.1, -.17, Math.PI], [-.1, -.17, 0]]) r.legs.push([pivot(R, [x, .32, z], [P(Cap(.045, .2), fur, [0, -.14, 0]), P(S(.055), cream, [0, -.29, .02], [0, 0, 0], [1, .7, 1.3])]), ph]);
  },
  kitty: (R, r) => {
    const fur = '#ff9f43', stripe = '#c96a1e', white = '#fff4e6';
    R.add(mesh([P(Cap(.14, .36), fur, [0, .38, 0], [H, 0, 0]), P(S(.11), white, [0, .33, .19]),
      ...[-.14, -.02, .1].map(z => P(Box(.2, .035, .05), stripe, [0, .515, z]))]));
    r.head = pivot(R, [0, .58, .27], [P(S(.15), fur, [0, 0, 0], [0, 0, 0], [1.12, .95, 1]), P(S(.07), white, [.05, -.05, .1]), P(S(.07), white, [-.05, -.05, .1]), P(Cone(.022, .03, 3), '#ff7d9a', [0, -.01, .155], [-H, 0, 0]),
      ...[-1, 1].flatMap(s => [P(S(.036, 10, 8), '#5fbf4f', [s * .065, .035, .12]), P(Box(.012, .04, .01), '#111', [s * .065, .035, .152])]),
      ...[-1, 1].flatMap(s => [-.015, .015].map(dy => P(Box(.16, .006, .006), '#ffffff', [s * .12, -.035 + dy, .12], [0, 0, s * dy * 6]))),
      ...[-1, 1].flatMap(s => [P(Cone(.065, .14, 4), fur, [s * .095, .15, -.01], [0, Math.PI / 4, s * -.2]), P(Cone(.035, .08, 4), '#ffb3c6', [s * .093, .14, .012], [0, Math.PI / 4, s * -.2])])]);
    r.tail = pivot(R, [0, .45, -.25], [P(Cap(.03, .36), fur, [0, .2, -.05], [-.25, 0, 0]), P(S(.035), stripe, [0, .4, -.1])]); r.sway = 2;
    for (const [x, z, ph] of [[.08, .14, 0], [-.08, .14, Math.PI], [.08, -.14, Math.PI], [-.08, -.14, 0]]) r.legs.push([pivot(R, [x, .3, z], [P(Cap(.035, .2), fur, [0, -.14, 0]), P(S(.042), white, [0, -.27, .01])]), ph]);
  },
  bunny: (R, r) => {
    const fur = '#f6f3ee', pink = '#ffb3c6';
    R.add(mesh([P(S(.21), fur, [0, .24, -.03], [0, 0, 0], [1, .92, 1.2]), P(S(.12), fur, [.13, .16, -.12]), P(S(.12), fur, [-.13, .16, -.12]), P(S(.075), '#ffffff', [0, .27, -.29])]));
    r.head = pivot(R, [0, .42, .17], [P(S(.14), fur, [0, 0, 0], [0, 0, 0], [1, .95, 1.05]), P(S(.026), pink, [0, -.01, .135]), P(S(.05), '#ffffff', [.035, -.04, .1]), P(S(.05), '#ffffff', [-.035, -.04, .1]), ...eyes(.08, .03, .09, .032)]);
    for (const s of [-1, 1]) { const e = pivot(r.head, [s * .05, .11, -.02], [P(Cap(.036, .22), fur, [0, .15, 0], [0, 0, 0], [1, 1, .55]), P(Box(.03, .2, .01), pink, [0, .15, .02])]); e.rotation.z = s * -.12; r.ears.push(e); }
    for (const [x, z, ph] of [[.07, .1, 0], [-.07, .1, 0]]) r.legs.push([pivot(R, [x, .12, z], [P(Cap(.03, .06), fur, [0, -.06, .01])]), ph]);
    for (const x of [.13, -.13]) r.legs.push([pivot(R, [x, .06, -.08], [P(Box(.07, .05, .2), fur, [0, -.03, .02])]), Math.PI, true]);
    r.gait = 'hop';
  },
  panda: (R, r) => {
    const w = '#f7f7f2', k = '#262626';
    R.add(mesh([P(S(.26), w, [0, .33, -.02], [0, 0, 0], [1, .9, 1.22]), P(S(.27), k, [0, .34, .15], [0, 0, 0], [1.03, .93, .52]), P(S(.05), w, [0, .37, -.33])]));
    r.head = pivot(R, [0, .56, .3], [P(S(.2), w), P(S(.08), w, [0, -.06, .15], [0, 0, 0], [1, .8, .8]), P(S(.035), k, [0, -.04, .22]),
      ...[-1, 1].flatMap(s => [P(S(.07), k, [s * .15, .15, -.01]), P(S(.06), k, [s * .08, .03, .16], [0, 0, s * -.5], [1, 1.35, .45]), P(S(.02), '#ffffff', [s * .08, .045, .185])])]);
    for (const [x, z, ph] of [[.14, .17, 0], [-.14, .17, Math.PI], [.14, -.18, Math.PI], [-.14, -.18, 0]]) r.legs.push([pivot(R, [x, .25, z], [P(Cap(.075, .12), k, [0, -.1, 0])]), ph]);
    r.waddle = .12;
  },
  joey: (R, r) => {
    const fur = '#c98a5a', belly = '#ecc9a0', dark = '#7a4a2a';
    R.add(mesh([P(S(.2), fur, [0, .5, 0], [0, 0, 0], [.9, 1.3, 1]), P(S(.15), belly, [0, .46, .09], [0, 0, 0], [.8, 1.1, .6]), P(S(.11), fur, [.12, .3, -.01]), P(S(.11), fur, [-.12, .3, -.01])]));
    r.head = pivot(R, [0, .84, .06], [P(S(.13), fur, [0, 0, 0], [0, 0, 0], [.9, 1, 1.15]), P(S(.07), belly, [0, -.04, .12], [0, 0, 0], [.9, .8, 1.25]), P(S(.026), '#222', [0, -.02, .2]), ...eyes(.06, .04, .085)]);
    for (const s of [-1, 1]) { const e = pivot(r.head, [s * .06, .1, -.03], [P(Cap(.035, .15), fur, [0, .1, 0], [0, 0, 0], [1, 1, .55]), P(Box(.025, .12, .01), '#e8a98a', [0, .1, .02])]); e.rotation.z = s * -.25; r.ears.push(e); }
    for (const s of [-1, 1]) r.legs.push([pivot(R, [s * .08, .6, .13], [P(Cap(.025, .1), fur, [0, -.06, .03], [.5, 0, 0])]), 0, false, true]);
    for (const s of [-1, 1]) r.legs.push([pivot(R, [s * .12, .22, 0], [P(Cap(.045, .12), fur, [0, -.1, .02]), P(Box(.07, .05, .3), dark, [0, -.2, .09])]), Math.PI, true]);
    r.tail = pivot(R, [0, .3, -.14], [P(Cap(.055, .42), fur, [0, -.1, -.25], [-1.25, 0, 0])]); r.sway = .6;
    r.gait = 'hop'; r.upright = true;
  },
  calf: (R, r) => {
    const grey = '#5e5a57', light = '#8a8480', horn = '#d9cfbf';
    R.add(mesh([P(Cap(.22, .44), grey, [0, .55, 0], [H, 0, 0]), P(S(.15), grey, [0, .62, .25])]));
    r.head = pivot(R, [0, .62, .42], [P(Cap(.12, .12), grey, [0, -.02, .08], [H + .3, 0, 0]), P(S(.1), light, [0, -.1, .2], [0, 0, 0], [1.1, .8, .9]), P(S(.02), '#222', [.04, -.09, .29]), P(S(.02), '#222', [-.04, -.09, .29]), ...eyes(.09, .04, .14),
      ...[-1, 1].flatMap(s => [P(Cap(.035, .1), grey, [s * .16, .03, .02], [0, 0, s * 1.3], [1, 1, .6]), P(Cone(.03, .16, 6), horn, [s * .11, .09, -.02], [0, 0, s * -1.1])])]);
    for (const [x, z, ph] of [[.12, .24, 0], [-.12, .24, Math.PI], [.12, -.24, Math.PI], [-.12, -.24, 0]]) r.legs.push([pivot(R, [x, .42, z], [P(Cap(.06, .26), grey, [0, -.19, 0]), P(Cyl(.06, .065, .06, 8), '#2a2522', [0, -.38, 0])]), ph]);
    r.tail = pivot(R, [0, .65, -.4], [P(Cap(.018, .3), grey, [0, -.15, -.03]), P(S(.04), '#2a2522', [0, -.32, -.03])]); r.sway = 1.2; r.swing = true;
  },
  cow: (R, r) => {
    const w = '#ffffff', k = '#2b2b2b', pink = '#ffb3c6';
    R.add(mesh([P(Cap(.32, .62), w, [0, .86, 0], [H, 0, 0]), P(S(.14), pink, [0, .52, -.22], [0, 0, 0], [1, .7, 1]),
      ...[[.28, .95, .1, .2], [-.27, .9, -.25, .18], [.1, 1.17, -.3, .16], [-.22, .82, .35, .15], [.25, .75, -.35, .14]].map(([x, y, z, s]) => P(S(s), k, [x, y, z], [0, 0, 0], [x > 0 ? .4 : .4, 1, 1.2]))]));
    r.head = pivot(R, [0, .98, .55], [P(Cap(.14, .2), w, [0, -.04, .1], [H + .35, 0, 0]), P(S(.1), k, [.05, .06, .05]), P(S(.13), pink, [0, -.14, .26], [0, 0, 0], [1.15, .75, .8]), P(S(.022), '#7a3a4a', [.05, -.13, .36]), P(S(.022), '#7a3a4a', [-.05, -.13, .36]), ...eyes(.11, .06, .14, .032),
      ...[-1, 1].flatMap(s => [P(Cap(.05, .1), w, [s * .2, .04, .04], [0, 0, s * 1.3], [1, 1, .5]), P(Cone(.035, .16, 6), '#efe6cf', [s * .12, .17, .02], [0, 0, s * -.6])])]);
    for (const [x, z, ph] of [[.18, .36, 0], [-.18, .36, Math.PI], [.18, -.36, Math.PI], [-.18, -.36, 0]]) r.legs.push([pivot(R, [x, .62, z], [P(Cap(.075, .42), w, [0, -.28, 0]), P(Cyl(.075, .08, .08, 8), '#3a3330', [0, -.57, 0])]), ph]);
    r.tail = pivot(R, [0, 1.0, -.58], [P(Cap(.02, .55), w, [0, -.28, -.02]), P(S(.06), k, [0, -.58, -.02], [0, 0, 0], [1, 1.5, 1])]); r.sway = 1; r.swing = true;
  },
  sheep: (R, r) => {
    const wool = '#f4f1ea', face = '#3a302c';
    const puffs = [P(S(.3), wool, [0, .62, 0], [0, 0, 0], [1, .9, 1.3])];
    for (let i = 0; i < 16; i++) { const a = i * 2.4, y = .62 + Math.sin(i * 1.7) * .16, z = -.3 + (i / 15) * .6; puffs.push(P(S(.13 + (i % 3) * .02, 8, 6), wool, [Math.cos(a) * .24, y + .05, z])); }
    R.add(mesh(puffs));
    r.head = pivot(R, [0, .72, .42], [P(S(.13), face, [0, 0, .04], [0, 0, 0], [.85, 1, 1.3]), P(S(.08), wool, [0, .11, -.02]), ...eyes(.065, .03, .14, .025, '#f2e6c8'),
      ...[-1, 1].map(s => P(Cap(.035, .1), face, [s * .13, .03, 0], [0, 0, s * 1.35], [1, 1, .55]))]);
    for (const [x, z, ph] of [[.13, .22, 0], [-.13, .22, Math.PI], [.13, -.22, Math.PI], [-.13, -.22, 0]]) r.legs.push([pivot(R, [x, .42, z], [P(Cap(.04, .3), face, [0, -.21, 0])]), ph]);
    r.tail = pivot(R, [0, .6, -.42], [P(S(.08, 8, 6), wool)]); r.wag = 6;
  },
  pig: (R, r) => {
    const pink = '#ffa8c5', dark = '#ff86ad';
    R.add(mesh([P(S(.32), pink, [0, .45, 0], [0, 0, 0], [1, .85, 1.35])]));
    r.head = pivot(R, [0, .5, .42], [P(S(.2), pink), P(Cyl(.09, .09, .08, 14), dark, [0, -.03, .19], [H, 0, 0]), P(S(.022), '#a8506a', [.035, -.03, .235]), P(S(.022), '#a8506a', [-.035, -.03, .235]), ...eyes(.08, .06, .15, .028),
      ...[-1, 1].map(s => P(Cone(.075, .14, 3), pink, [s * .1, .16, .02], [.75, 0, s * -.2]))]);
    for (const [x, z, ph] of [[.15, .22, 0], [-.15, .22, Math.PI], [.15, -.22, Math.PI], [-.15, -.22, 0]]) r.legs.push([pivot(R, [x, .26, z], [P(Cap(.06, .12), pink, [0, -.1, 0]), P(Cyl(.06, .062, .05, 8), '#8a4a5a', [0, -.22, 0])]), ph]);
    r.tail = pivot(R, [0, .55, -.43], [P(Tor(.05, .018, Math.PI * 1.6), dark, [0, 0, -.02], [0, H, 0])]); r.wag = 9;
  },
  unicorn: (R, r) => {
    const w = '#ffffff', gold = '#ffd23f', mane = ['#ff7eb8', '#ffd23f', '#5fd3ff', '#b38cff', '#7be38f'];
    R.add(mesh([P(Cap(.26, .62), w, [0, 1.05, 0], [H, 0, 0])]));
    r.head = pivot(R, [0, 1.22, .42], [P(Cap(.13, .34), w, [0, .17, .08], [.45, 0, 0]), P(Cap(.11, .26), w, [0, .42, .28], [1.25, 0, 0]), P(S(.1), '#f2e6f0', [0, .34, .45]), P(S(.02), '#a07a9a', [.04, .35, .54]), P(S(.02), '#a07a9a', [-.04, .35, .54]),
      ...eyes(.09, .48, .3, .032), P(Cone(.04, .42, 8), gold, [0, .7, .26], [.35, 0, 0]),
      ...[-1, 1].map(s => P(Cone(.04, .12, 6), w, [s * .07, .6, .18], [-.1, 0, s * -.2])),
      ...mane.map((c, i) => P(S(.075, 8, 6), c, [0, .58 - i * .1, .12 - i * .06]))]);
    for (const [x, z, ph] of [[.16, .4, 0], [-.16, .4, Math.PI], [.16, -.4, Math.PI], [-.16, -.4, 0]]) r.legs.push([pivot(R, [x, .85, z], [P(Cap(.065, .62), w, [0, -.4, 0]), P(Cyl(.07, .075, .08, 8), gold, [0, -.81, 0])]), ph]);
    r.tail = pivot(R, [0, 1.15, -.6], mane.map((c, i) => P(Cone(.06, .4, 6), c, [(i - 2) * .025, -.2, -.05 - i * .02], [Math.PI - .4, 0, (i - 2) * .12]))); r.sway = 1.4; r.swing = true;
  },
  chicken: (R, r) => {
    const w = '#ffffff', y = '#ffb52e', red = '#e8332a';
    R.add(mesh([P(S(.24), w, [0, .36, 0], [0, 0, 0], [1, .95, 1.2]), P(S(.12), w, [0, .45, -.24], [.6, 0, 0], [.8, 1.2, .6]), ...[-1, 1].map(s => P(S(.13), '#f2efe8', [s * .2, .38, -.02], [0, 0, 0], [.35, .8, 1.1]))]));
    r.head = pivot(R, [0, .56, .18], [P(S(.13), w), P(Cone(.045, .1, 6), y, [0, -.01, .15], [H, 0, 0]), P(S(.05), red, [0, .12, .02], [0, 0, 0], [.6, 1, 1.5]), P(S(.035), red, [0, -.08, .1], [0, 0, 0], [.6, 1.2, .6]), ...eyes(.07, .03, .08, .025)]);
    for (const [x, ph] of [[.07, 0], [-.07, Math.PI]]) r.legs.push([pivot(R, [x, .16, 0], [P(Cyl(.018, .018, .16, 5), y, [0, -.08, 0]), P(Box(.08, .015, .1), y, [0, -.16, .03])]), ph]);
    r.peck = true;
  },
  bear: (R, r) => {
    const fur = '#8a5a3b', muz = '#d9b58a';
    R.add(mesh([P(Cap(.36, .5), fur, [0, .72, 0], [H, 0, 0])]));
    r.head = pivot(R, [0, .95, .55], [P(S(.27), fur), P(S(.13), muz, [0, -.06, .22], [0, 0, 0], [1.1, .85, .8]), P(S(.045), '#222', [0, -.02, .32]), ...eyes(.11, .08, .2), ...[-1, 1].map(s => P(S(.09), fur, [s * .2, .22, -.02]))]);
    for (const [x, z, ph] of [[.2, .3, 0], [-.2, .3, Math.PI], [.2, -.3, Math.PI], [-.2, -.3, 0]]) r.legs.push([pivot(R, [x, .5, z], [P(Cap(.11, .28), fur, [0, -.26, 0])]), ph]);
  }
};
Object.assign(BUILD, {
  koala: (R, r) => {
    const fur = '#9a9a9e', light = '#e8e6e2', nose = '#2a2a2e';
    R.add(mesh([P(S(.24), fur, [0, .36, 0], [0, 0, 0], [1, 1.15, .95]), P(S(.15), light, [0, .34, .14], [0, 0, 0], [.9, 1.1, .5])]));
    r.head = pivot(R, [0, .7, .06], [P(S(.2), fur, [0, 0, 0], [0, 0, 0], [1.15, 1, 1]), P(S(.07), nose, [0, -.02, .19], [0, 0, 0], [.8, 1.15, .7]), ...eyes(.08, .04, .16, .028),
      ...[-1, 1].flatMap(s => [P(S(.12), fur, [s * .2, .12, -.02], [0, 0, 0], [1, 1, .45]), P(S(.08), light, [s * .2, .12, .01], [0, 0, 0], [1, 1, .35])])]);
    for (const s of [-1, 1]) r.legs.push([pivot(R, [s * .16, .42, .12], [P(Cap(.06, .14), fur, [0, -.08, .04], [.6, 0, 0])]), 0, false, true]);
    for (const s of [-1, 1]) r.legs.push([pivot(R, [s * .14, .2, .02], [P(Cap(.07, .1), fur, [0, -.1, .05])]), Math.PI]);
    r.waddle = .08; r.slow = true;
  },
  platypus: (R, r) => {
    const fur = '#6b4a32', bill = '#3a3a3e';
    R.add(mesh([P(Cap(.13, .34), fur, [0, .15, 0], [H, 0, 0], [1.2, 1, .8]), P(Box(.32, .05, .28), fur, [0, .1, -.38])]));
    r.head = pivot(R, [0, .17, .26], [P(S(.12), fur, [0, 0, 0], [0, 0, 0], [1.1, .85, 1]), P(Box(.2, .04, .2), bill, [0, -.02, .16], [0, 0, 0], [1, 1, 1]), ...eyes(.06, .04, .07, .022)]);
    for (const [x, z, ph] of [[.14, .14, 0], [-.14, .14, Math.PI], [.14, -.14, Math.PI], [-.14, -.14, 0]]) r.legs.push([pivot(R, [x, .1, z], [P(Box(.1, .03, .1), bill, [s0(x) * .03, -.07, .02])]), ph]);
    r.tail = pivot(R, [0, .1, -.28], [P(Box(.26, .04, .24), fur, [0, 0, -.12])]); r.sway = 1.2; r.waddle = .15;
  },
  penguin: (R, r) => {
    const blue = '#3d5f8a', w = '#ffffff';
    R.add(mesh([P(S(.17), blue, [0, .25, 0], [0, 0, 0], [1, 1.35, .95]), P(S(.13), w, [0, .23, .06], [0, 0, 0], [1, 1.35, .7])]));
    r.head = pivot(R, [0, .48, .02], [P(S(.11), blue), P(Cone(.03, .1, 6), '#2a2a2e', [0, -.02, .12], [H, 0, 0]), ...eyes(.05, .03, .08, .02, '#f2f2f2'), ...eyes(.05, .03, .085, .01)]);
    for (const s of [-1, 1]) r.legs.push([pivot(R, [s * .16, .32, 0], [P(Box(.03, .2, .09), blue, [0, -.08, 0])]), 0, false, true]);
    for (const [x, ph] of [[.06, 0], [-.06, Math.PI]]) r.legs.push([pivot(R, [x, .05, .03], [P(Box(.07, .02, .1), '#ffb3c6', [0, -.03, .03])]), ph]);
    r.waddle = .3;
  },
  emu: (R, r) => {
    const f = '#6a5a4a', skin = '#5f86b0';
    R.add(mesh([P(S(.32), f, [0, .95, 0], [0, 0, 0], [.85, .8, 1.25])]));
    r.head = pivot(R, [0, 1.05, .3], [P(Cap(.05, .5), skin, [0, .3, .02]), P(S(.08), f, [0, .6, .04]), P(Cone(.03, .12, 6), '#3a3a3e', [0, .58, .14], [H, 0, 0]), ...eyes(.05, .62, .08, .018)]);
    for (const [x, ph] of [[.1, 0], [-.1, Math.PI]]) r.legs.push([pivot(R, [x, .75, 0], [P(Cyl(.035, .03, .72, 6), '#8a7a6a', [0, -.36, 0]), P(Box(.12, .02, .16), '#8a7a6a', [0, -.72, .05])]), ph]);
    r.tail = pivot(R, [0, .95, -.38], [P(S(.12), f, [0, 0, -.04])]); r.sway = .8;
  },
  turtle: (R, r) => {
    const shell = '#5a7a4a', skin = '#8aa070', dark = '#3f5a34';
    R.add(mesh([P(new THREE.SphereGeometry(.42, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), shell, [0, .08, 0], [0, 0, 0], [1, .55, 1.25]), ...[[0, .27, 0], [.18, .23, .15], [-.18, .23, .15], [.18, .23, -.18], [-.18, .23, -.18]].map(([x, y, z]) => P(S(.1, 8, 6), dark, [x, y, z], [0, 0, 0], [1, .35, 1])), P(Cyl(.44, .44, .06, 18), '#c9b88a', [0, .07, 0], [0, 0, 0], [1, 1, 1.25])]));
    r.head = pivot(R, [0, .12, .52], [P(S(.11), skin, [0, .02, .06], [0, 0, 0], [.9, .8, 1.2]), ...eyes(.06, .06, .12, .022)]);
    for (const [x, z, ph] of [[.32, .3, 0], [-.32, .3, Math.PI], [.3, -.3, Math.PI], [-.3, -.3, 0]]) r.legs.push([pivot(R, [x, .08, z], [P(S(.09, 8, 6), skin, [s0(x) * .04, -.03, 0], [0, 0, 0], [1.3, .5, 1])]), ph]);
    r.slow = true;
  },
  elephant: (R, r) => {
    const g = '#9a9aa2', d = '#7d7d86';
    R.add(mesh([P(S(.7), g, [0, 1.35, 0], [0, 0, 0], [1, .9, 1.3])]));
    r.head = pivot(R, [0, 1.55, .78], [P(S(.42), g), P(Cap(.11, .7), d, [0, -.55, .3], [.3, 0, 0]), P(Cone(.05, .3, 6), '#f4efe2', [.2, -.28, .3], [1.1, 0, 0]), P(Cone(.05, .3, 6), '#f4efe2', [-.2, -.28, .3], [1.1, 0, 0]), ...eyes(.2, .08, .34, .04)]);
    for (const s of [-1, 1]) { const e = pivot(r.head, [s * .36, .05, -.08], [P(S(.38), d, [s * .12, -.05, 0], [0, 0, 0], [.25, 1, .9])]); r.ears.push(e); }
    for (const [x, z, ph] of [[.32, .5, 0], [-.32, .5, Math.PI], [.32, -.5, Math.PI], [-.32, -.5, 0]]) r.legs.push([pivot(R, [x, .95, z], [P(Cyl(.18, .2, .95, 10), g, [0, -.47, 0]), P(Cyl(.21, .21, .06, 10), '#f4efe2', [0, -.93, .02])]), ph]);
    r.tail = pivot(R, [0, 1.45, -.9], [P(Cap(.03, .5), d, [0, -.25, -.04])]); r.sway = 1; r.swing = true; r.slow = true;
  },
  crane: (R, r) => {
    const w = '#f6f6f2', grey = '#9aa0a8', red = '#e8332a';
    R.add(mesh([P(S(.26), grey, [0, 1.05, 0], [0, 0, 0], [.75, .7, 1.3]), P(S(.18), '#2a2a2e', [0, 1.05, -.32], [0, 0, 0], [.7, .6, 1])]));
    r.head = pivot(R, [0, 1.15, .25], [P(Cap(.04, .55), grey, [0, .3, .05], [.15, 0, 0]), P(S(.07), red, [0, .63, .1]), P(Cone(.025, .22, 6), '#3a3a3e', [0, .6, .24], [H, 0, 0]), ...eyes(.04, .65, .13, .015)]);
    for (const [x, ph] of [[.07, 0], [-.07, Math.PI]]) r.legs.push([pivot(R, [x, .85, 0], [P(Cyl(.022, .02, .85, 6), '#4a4a4e', [0, -.42, 0])]), ph]);
    r.peck = true; r.slow = true;
  },
  bull: (R, r) => { // a brown southern bull (bò), with short horns and a hump
    const f = '#9a5a32', d = '#6a3a1e', light = '#e8c9a0';
    R.add(mesh([P(Cap(.3, .6), f, [0, .86, 0], [H, 0, 0]), P(S(.2), f, [0, 1.12, .26], [0, 0, 0], [1, .8, 1.2])]));
    r.head = pivot(R, [0, .98, .55], [P(Cap(.13, .2), f, [0, -.04, .1], [H + .35, 0, 0]), P(S(.12), light, [0, -.14, .26], [0, 0, 0], [1.1, .75, .8]), ...eyes(.11, .06, .14, .03),
      ...[-1, 1].flatMap(s => [P(Cap(.05, .1), f, [s * .2, .04, .04], [0, 0, s * 1.3], [1, 1, .5]), P(Cone(.035, .2, 6), '#efe6cf', [s * .13, .17, .02], [0, 0, s * -.9])])]);
    for (const [x, z, ph] of [[.18, .36, 0], [-.18, .36, Math.PI], [.18, -.36, Math.PI], [-.18, -.36, 0]]) r.legs.push([pivot(R, [x, .62, z], [P(Cap(.075, .42), f, [0, -.28, 0]), P(Cyl(.075, .08, .08, 8), d, [0, -.57, 0])]), ph]);
    r.tail = pivot(R, [0, 1.0, -.58], [P(Cap(.02, .55), f, [0, -.28, -.02]), P(S(.06), d, [0, -.58, -.02], [0, 0, 0], [1, 1.5, 1])]); r.sway = 1; r.swing = true;
  },
  buffalo: (R, r) => { // a friendly water buffalo (con trâu): grey, wide curved horns, big eyes (Lotus Village's cart)
    const f = '#5a5f6a', d = '#3f434c', light = '#8a8f9a', horn = '#e8dcc0';
    R.add(mesh([P(Cap(.36, .7), f, [0, .9, 0], [H, 0, 0]), P(S(.24), f, [0, 1.1, .3], [0, 0, 0], [1, .8, 1.1])]));
    r.head = pivot(R, [0, 1.0, .66], [P(Cap(.15, .22), f, [0, -.04, .1], [H + .4, 0, 0]), P(S(.14), light, [0, -.15, .28], [0, 0, 0], [1.1, .75, .8]), P(S(.025), d, [.05, -.15, .4]), P(S(.025), d, [-.05, -.15, .4]), ...eyes(.12, .07, .16, .035),
      ...[-1, 1].flatMap(s => [P(Cap(.05, .12), f, [s * .23, .02, .04], [0, 0, s * 1.4], [1, 1, .5]), P(Tor(.2, .045, Math.PI * .9), horn, [s * .2, .16, -.02], [H, 0, s > 0 ? -.2 : Math.PI + .2])])]);
    for (const [x, z, ph] of [[.22, .42, 0], [-.22, .42, Math.PI], [.22, -.42, Math.PI], [-.22, -.42, 0]]) r.legs.push([pivot(R, [x, .64, z], [P(Cap(.09, .42), f, [0, -.3, 0]), P(Cyl(.09, .095, .08, 8), d, [0, -.6, 0])]), ph]);
    r.tail = pivot(R, [0, 1.0, -.68], [P(Cap(.02, .55), f, [0, -.28, -.02]), P(S(.06), d, [0, -.58, -.02], [0, 0, 0], [1, 1.5, 1])]); r.sway = 1; r.swing = true;
  },
  peacock: (R, r) => {
    const blue = '#1f5fbf', green = '#2f9a6a';
    R.add(mesh([P(S(.22), blue, [0, .5, 0], [0, 0, 0], [.85, 1, 1.15])]));
    r.head = pivot(R, [0, .78, .15], [P(Cap(.06, .2), blue, [0, .05, 0]), P(S(.08), blue, [0, .2, .04]), P(Cone(.02, .08, 6), '#d9c9a0', [0, .19, .13], [H, 0, 0]), ...[-1, 0, 1].map(k => P(S(.02, 6, 5), blue, [k * .03, .34, .02])), ...eyes(.04, .22, .07, .015)]);
    const fan = [];
    for (let i = 0; i < 13; i++) { const a = (i / 12 - .5) * 2.6; fan.push(P(Box(.12, .9, .02), green, [Math.sin(a) * .45, .45 + Math.cos(a) * .45, 0], [0, 0, -a]), P(S(.06, 8, 6), '#ffd23f', [Math.sin(a) * .82, .45 + Math.cos(a) * .82, .02]), P(S(.035, 8, 6), blue, [Math.sin(a) * .82, .45 + Math.cos(a) * .82, .05])); }
    r.tail = pivot(R, [0, .5, -.22], fan); r.tail.rotation.x = -.25; r.sway = .7;
    for (const [x, ph] of [[.07, 0], [-.07, Math.PI]]) r.legs.push([pivot(R, [x, .3, 0], [P(Cyl(.02, .02, .3, 5), '#c9b08a', [0, -.15, 0])]), ph]);
  }
});
const SHADOW = { buffalo: 1.5, bull: 1.35, koala: .6, platypus: .6, penguin: .45, emu: .9, turtle: 1, elephant: 2, crane: .8, peacock: .8, puppy: .7, kitty: .6, bunny: .55, panda: .75, joey: .6, calf: .9, cow: 1.35, sheep: 1, pig: .95, unicorn: 1.35, chicken: .5, bear: 1.3 };

const LIVE = new Set();
export function animalModel(kind) { const k = BUILD[kind] ? kind : 'puppy'; return make(k, BUILD[k], SHADOW[k] || .8); }

// walking legs, hopping, wagging tails, ears that bounce, heads that look around and a little breathing
// (films batch) an animal in a story film moves only with its film (js/content/films/kit.js calls tickAnimal itself)
export function filmAnimal(kind) { const g = animalModel(kind); LIVE.delete(g); return g; }
export function tickAnimals(dt, t, heroes = []) {
  for (const g of LIVE) {
    if (!g.parent) { g.userData.gone = (g.userData.gone || 0) + 1; if (g.userData.gone > 300) LIVE.delete(g); continue; }
    g.userData.gone = 0;
    const p = g.position;
    if (heroes.length && !heroes.some(h => Math.abs(h.pos.x - p.x) < 60 && Math.abs(h.pos.z - p.z) < 60)) continue; // nobody can see it
    tickAnimal(g, dt, t);
  }
}
export function tickAnimal(g, dt, t) {
  {
    const r = g.userData.rig, p = g.position;
    if (r.px == null) { r.px = p.x; r.pz = p.z; }
    const moved = Math.hypot(p.x - r.px, p.z - r.pz) / Math.max(dt, 1e-3); r.px = p.x; r.pz = p.z;
    r.sp += (Math.min(moved, 10) - r.sp) * Math.min(1, dt * 6);
    const run = Math.min(1, r.sp / 1.4), T = t + r.seed;
    r.ph += dt * (r.gait === 'hop' ? 4 + r.sp * 2.2 : 3 + r.sp * 4.5);
    const R = r.root;
    if (r.gait === 'hop') {
      const hop = Math.max(0, Math.sin(r.ph)) * run;
      R.position.y = hop * (r.upright ? .32 : .2);
      R.rotation.x = (r.upright ? -.25 : -.15) * hop * (Math.cos(r.ph) > 0 ? 1 : -.6);
      for (const [l, , back, arm] of r.legs) l.rotation.x = back ? -hop * .9 : arm ? .3 + hop * .4 : -hop * .6;
      r.ears.forEach((e, i) => e.rotation.x = -hop * .5 + Math.sin(T * 1.3 + i) * .05);
    } else {
      for (const [l, ph] of r.legs) l.rotation.x = Math.sin(r.ph + ph) * .65 * run;
      R.position.y = Math.abs(Math.sin(r.ph)) * .03 * run;
      R.rotation.z = r.waddle ? Math.sin(r.ph) * r.waddle * run : 0;
      r.ears.forEach((e, i) => e.rotation.x = Math.sin(r.ph * 2 + i) * .12 * run + Math.sin(T * 2.1 + i) * .04);
    }
    // breathing when still
    const breathe = 1 + Math.sin(T * 2.2) * .02 * (1 - run); R.scale.set(1, breathe, 1);
    if (r.head) {
      const look = (1 - run) * (Math.sin(T * .45) * .55 + Math.sin(T * 1.7) * .1);
      r.head.rotation.y = look;
      r.head.rotation.x = r.peck && run < .3 ? Math.max(0, Math.sin(T * 1.4)) ** 6 * .9 : Math.sin(r.ph * 2) * .06 * run;
    }
    if (r.tail) {
      if (r.wag) r.tail.rotation.y = Math.sin(T * r.wag) * (.35 + .25 * run);
      if (r.sway) { const s = Math.sin(T * r.sway) * .3; if (r.swing) r.tail.rotation.z = s; else r.tail.rotation.y = s; r.tail.rotation.x = r.swing ? Math.sin(T * r.sway * 1.3) * .1 : 0; }
    }
  }
}
