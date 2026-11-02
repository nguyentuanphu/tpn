// Shared pieces for the tale films in this folder (films batch, owner 13 Oct AEDT: "every story becomes a 3D film like
// Thánh Gióng and Cây khế"): the sets (a Vietnamese village, a forest, the palace, night and the moon, the sea, heaven
// above the clouds, the Australian bush, a Chinese and an Indian village), the people, and the animals the valley's own
// models do not have (lion, tiger, mouse, monkey, toad, carp, snake, jackal, a long dragon). Everything faces +z, stands
// on y = 0 and is drawn with the film's shared paint (js/film.js), so it is thrown away with its page.
// The valley's animals (js/animals.js: kitty, bunny, joey, emu, elephant, buffalo, chicken, puppy, pig, sheep, koala,
// crane, peacock…) come with animal(); they move their legs when moved (S.move), like in the valley.
import { SETS as L, PROPS as Pp, LOOK, G3, io, lin, mesh, mat } from '../../film.js';
import { THREE, P, glow } from '../../gfx.js';
import { filmAnimal, tickAnimal } from '../../animals.js';
import { buildOwl } from '../../avatar.js';

export { L, Pp, LOOK, G3, io, lin, THREE, P, mesh, mat };
export const PI = Math.PI, H = PI / 2;
const { S: Sp, Cyl, Cone, Box } = G3;
const Cap = (r, l, s = 10) => new THREE.CapsuleGeometry(r, l, 4, s);

// ---------- people ----------
export const VILLAGER = (style, color, hat = 'nonla', hairStyle = 'buns', skin = '#d8a070') => LOOK({ style, color, hat, hairStyle, skin });
export const KID = (style, color, hairStyle = 'short', hat = 'none') => LOOK({ style, color, hairStyle, hat, skin: '#e0aa80' });
export const ELDER = (style, color, hair = '#e8e8e8') => LOOK({ style, color, hairStyle: 'buns', hair, skin: '#e0aa80' });
export const KINGLOOK = (color = '#e8b62a') => LOOK({ style: 'tunic', color, hat: 'crown', skin: '#e0aa80' });
export const FAIRY = (color = '#ffc8e8') => LOOK({ style: 'aodai', color, hairStyle: 'long', back: 'wings', skin: '#f2c8a0' });
// Bụt, the kind old fairy man: white tunic, white hair
export const BUT = LOOK({ style: 'tunic', color: '#f4f0e8', hairStyle: 'short', hair: '#f4f4f4', skin: '#e8b890' });

// ---------- moving with the film ----------
// things on the water bob up and down with the waves
export function afloat(S, model, x, z, yaw = 0) {
  const g = new THREE.Group(); g.add(model); S.add(g, x, -.3, z, yaw);
  S.every((dt, time) => { model.position.y = Math.sin(time * 1.5 + x) * .08; model.rotation.z = Math.sin(time * 1.1) * .035; });
  return g;
}
// put an actor into a moving thing (a boat, an animal); 'yaw' is relative to it
export function board(a, parent, pos, yaw = 0, scale) { parent.add(a.o); a.o.position.set(...pos); a.o.rotation.set(0, yaw, 0); if (scale) a.o.scale.setScalar(scale); }
// turn a thing to face a point, then move it there (an animal walking, a bird flying)
export function go(S, o, t, dur, to, e = lin, arc = 0) {
  S.at(t, () => { const dx = to[0] - o.position.x, dz = to[2] - o.position.z; if (Math.abs(dx) + Math.abs(dz) > .01) o.rotation.y = Math.atan2(dx, dz); });
  return S.move(o, t, dur, to, e, arc);
}
// turn a thing to face a point (or an angle)
export const turn = (S, o, t, to, dur = .4) => { let y0, y1; return S.tw(t, dur, (k, first) => { if (first) { y0 = o.rotation.y; y1 = Array.isArray(to) ? Math.atan2(to[0] - o.position.x, to[1] - o.position.z) : to; let d = ((y1 - y0 + PI * 3) % (PI * 2)) - PI; y1 = y0 + d; } o.rotation.y = y0 + (y1 - y0) * k; }); };
// a happy hop (or n hops)
export const hop = (S, o, t, n = 1, h = .5, each = .45) => { for (let i = 0; i < n; i++) S.tw(t + i * each, each, k => { o.position.y = Math.sin(k * PI) * h; }, lin); return t + n * each; };
// someone speaks: the mouth moves and the hands talk
export const speak = (S, a, t, dur) => { S.talk(a, t, dur); S.do(a, t, 'talk', dur); return t + dur; };
// a flat coloured ground patch (a road, a yard, a pond)
export const flat = (w, d, color, y = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-H), mat(color)); m.position.y = y; return m; };
// a glowing thing (a sun, a lamp, the moon) that fog does not grey
export const shine = (S, geo, color, x, y, z, op = .95) => { const m = new THREE.Mesh(geo, glow(color, op)); m.material.userData.film = true; m.material.fog = false; return S.add(m, x, y, z); };

// ---------- the valley's animals ----------
export function animal(S, kind, x, z, yaw = 0, scale = 1) {
  const g = filmAnimal(kind); g.scale.setScalar(scale);
  g.traverse(o => { if (o.material && !o.material.userData.film) o.material.userData.shared = true; });
  g.userData.tick = animate(g); S.add(g, x, 0, z, yaw);
  return g;
}
// legs, tail and breathing as in the valley; userData.nod tips the head (+ down) on top of that
const animate = g => (dt, time) => { tickAnimal(g, dt, time); const r = g.userData.rig; if (r.filmScale) r.root.scale.multiply(r.filmScale); if (r.head && g.userData.nod) r.head.rotation.x += g.userData.nod; };

// ---------- animals the valley does not have (rigged like js/animals.js, so tickAnimal moves them) ----------
function rigged(build, o = {}) {
  const g = new THREE.Group(), root = new THREE.Group(); g.add(root);
  const r = Object.assign({ root, legs: [], ears: [], gait: 'walk', wag: 0, sway: 0, seed: Math.random() * 10, ph: 0, sp: 0, px: null, pz: null }, o);
  const piv = (parent, pos, parts) => { const p = new THREE.Group(); p.position.set(...pos); if (parts && parts.length) p.add(mesh(parts)); parent.add(p); return p; };
  build(root, r, piv);
  // tickAnimal resets its breathing scale every frame. Retain the authored animal size
  // separately, otherwise a tiny mouse becomes adult-sized and a lion shrinks.
  r.filmScale = root.scale.clone();
  g.userData.rig = r; g.userData.tick = animate(g); return g;
}
const eyes = (x, y, z, rr = .04) => [-1, 1].flatMap(s => [P(Sp(rr, 10, 8), '#1a1a1a', [s * x, y, z]), P(Sp(rr * .35, 6, 5), '#ffffff', [s * x + rr * .3, y + rr * .35, z + rr * .75])]);
const legs4 = (R, r, piv, c, hip, dx, dz, len, paw = c) => { for (const [x, z, ph] of [[dx, dz, 0], [-dx, dz, PI], [dx, -dz, PI], [-dx, -dz, 0]]) r.legs.push([piv(R, [x, hip, z], [P(Cap(len * .2, len * .7), c, [0, -len / 2, 0]), P(Sp(len * .22, 8, 6), paw, [0, -len + .03, .04], [0, 0, 0], [1, .6, 1.3])]), ph]); };
// a cat-like body (lion, tiger, jackal, mouse): body, head, ears, tail
function beast({ c, belly = c, len = 1, hip = .55, ears = 'round', mane = null, stripes = null, tailTuft = null, snout = .12, earC = c, s = 1, bushy = false }) {
  return rigged((R, r, piv) => {
    R.scale.setScalar(s);
    const parts = [P(Cap(.26 * len, .55 * len), c, [0, hip + .2, 0], [H, 0, 0]), P(Sp(.22 * len, 12, 9), belly, [0, hip + .12, .05], [0, 0, 0], [1, .7, 1.6])];
    if (stripes) for (let i = 0; i < 5; i++) parts.push(P(Box(.56 * len, .05, .07), stripes, [0, hip + .3, -.32 * len + i * .16 * len], [0, 0, 0], [1, 1, 1]));
    R.add(mesh(parts));
    const hp = [P(Sp(.24 * len, 14, 10), c, [0, 0, 0]), P(Sp(snout * len * 1.4, 10, 8), belly, [0, -.06 * len, .2 * len], [0, 0, 0], [1.1, .8, 1]), P(Sp(.035 * len, 6, 5), '#2a1a1a', [0, -.02 * len, .32 * len]), ...eyes(.1 * len, .06 * len, .19 * len, .035 * len)];
    if (stripes) hp.push(...[-1, 0, 1].map(i => P(Box(.04, .12, .04), stripes, [i * .08 * len, .19 * len, .08 * len])));
    if (ears === 'round') hp.push(...[-1, 1].map(k => P(Sp(.09 * len, 10, 8), earC, [k * .16 * len, .19 * len, -.02], [0, 0, 0], [1, 1, .4])));
    else if (ears === 'big') hp.push(...[-1, 1].map(k => P(Sp(.16 * len, 12, 9), earC, [k * .2 * len, .22 * len, -.04], [0, 0, 0], [1, 1, .3])));
    else hp.push(...[-1, 1].map(k => P(Cone(.07 * len, .2 * len, 5), earC, [k * .13 * len, .24 * len, 0], [0, 0, k * -.2])));
    if (mane) hp.unshift(...Array.from({ length: 12 }, (_, i) => { const a = i / 12 * PI * 2; return P(Sp(.13 * len, 8, 6), mane, [Math.cos(a) * .24 * len, Math.sin(a) * .24 * len, -.06 * len]); }));
    r.head = piv(R, [0, hip + .42 * len, .42 * len], hp);
    legs4(R, r, piv, c, hip, .16 * len, .28 * len, hip);
    const tl = [P(Cyl(.03 * len, .025 * len, .6 * len, 6), c, [0, 0, -.3 * len], [H * .7, 0, 0])];
    if (tailTuft) tl.push(P(Sp(.07 * len, 8, 6), tailTuft, [0, .2 * len, -.58 * len]));
    if (bushy) tl.splice(0, 1, P(Sp(.12 * len, 10, 8), c, [0, -.05, -.3 * len], [0, 0, 0], [1, 1, 2.6]), P(Sp(.07 * len, 8, 6), '#f4efe6', [0, -.08, -.6 * len]));
    r.tail = piv(R, [0, hip + .28, -.4 * len], tl); r.wag = 3;
  });
}
export const lion = () => beast({ c: '#e0a848', belly: '#f2d29a', mane: '#9a5a22', tailTuft: '#9a5a22', s: 1.5 });
export const tiger = () => beast({ c: '#ee8a2a', belly: '#fbf3e4', stripes: '#2a1a14', s: 1.45 });
export const jackal = (c = '#b08a5a') => beast({ c, belly: '#e8dcc8', ears: 'point', bushy: true, s: 1.1 });
export const mouse = (c = '#9a9aa8') => { const g = beast({ c, belly: '#e8e2e8', ears: 'big', earC: '#e8a8b8', s: .42, len: 1 }); g.userData.rig.tail.children[0].scale.set(.5, 1.6, .5); return g; };
export const cat = (c = '#f0a050') => beast({ c, belly: '#fbefe0', ears: 'point', s: .75 });
export const dog = (c = '#c08a50') => beast({ c, belly: '#f2e2c8', ears: 'round', s: .85 });
export const rat = () => mouse('#7a6a6a');
// a monkey: sits upright, long arms, a curly tail
export const monkey = () => rigged((R, r, piv) => {
  const c = '#8a5a32', f = '#f0c898';
  R.add(mesh([P(Cap(.2, .3), c, [0, .62, 0]), P(Sp(.15, 10, 8), f, [0, .6, .1], [0, 0, 0], [1, 1.1, .6])]));
  r.head = piv(R, [0, 1.05, .04], [P(Sp(.2, 14, 10), c, [0, 0, 0]), P(Sp(.15, 12, 9), f, [0, -.03, .1], [0, 0, 0], [1.1, 1, .7]), ...eyes(.07, .03, .2, .03), ...[-1, 1].map(s => P(Sp(.07, 8, 6), f, [s * .2, .02, 0], [0, 0, 0], [1, 1, .5]))]);
  for (const [x, ph] of [[.12, 0], [-.12, PI]]) r.legs.push([piv(R, [x, .4, 0], [P(Cap(.06, .25), c, [0, -.2, 0])]), ph]);
  r.arms = [-1, 1].map(s => piv(R, [s * .22, .82, 0], [P(Cap(.05, .35), c, [0, -.24, 0]), P(Sp(.06, 8, 6), f, [0, -.45, 0])]));
  r.tail = piv(R, [0, .45, -.18], [P(new THREE.TorusGeometry(.18, .03, 6, 14, PI * 1.5), c, [0, .18, -.1], [0, H, 0])]); r.sway = 1.5;
});
// a toad or a frog: squat, big eyes on top, hops
export const toad = (c = '#7a8a3a', spots = '#5a6a2a') => rigged((R, r, piv) => {
  R.add(mesh([P(Sp(.35, 14, 10), c, [0, .3, 0], [0, 0, 0], [1.2, .75, 1.1]), P(Sp(.28, 12, 9), '#e8dca0', [0, .22, .12], [0, 0, 0], [1, .6, 1]),
    ...[0, 1, 2, 3, 4].map(i => P(Sp(.05, 6, 5), spots, [Math.cos(i * 1.3) * .25, .5, Math.sin(i * 1.3) * .2 - .05])),
    ...[-1, 1].flatMap(s => [P(Sp(.1, 10, 8), c, [s * .17, .52, .2]), P(Sp(.06, 8, 6), '#fff8d0', [s * .19, .56, .27]), P(Sp(.035, 6, 5), '#1a1a1a', [s * .2, .57, .32])]),
    P(Box(.3, .02, .02), '#4a3020', [0, .32, .38])]));
  for (const [x, z, ph] of [[.3, .2, 0], [-.3, .2, 0], [.33, -.2, PI], [-.33, -.2, PI]]) r.legs.push([piv(R, [x, .18, z], [P(Sp(.11, 8, 6), c, [0, -.08, 0], [0, 0, 0], [1, .6, 1.6])]), ph, z < 0]);
  r.gait = 'hop';
});
// a carp: a fat golden fish with a fan tail (swims: the tail sways)
export const carp = (c = '#f0902a', fin = '#ffcf5a') => rigged((R, r, piv) => {
  R.add(mesh([P(Sp(.4, 14, 10), c, [0, 0, 0], [0, 0, 0], [.7, .8, 1.5]), P(Sp(.06, 8, 6), '#ffffff', [.17, .1, .4]), P(Sp(.06, 8, 6), '#ffffff', [-.17, .1, .4]), P(Sp(.035, 6, 5), '#1a1a1a', [.2, .1, .44]), P(Sp(.035, 6, 5), '#1a1a1a', [-.2, .1, .44]),
    P(Cone(.18, .4, 4), fin, [0, .35, -.05], [0, 0, 0], [.2, 1, 1]), ...[-1, 1].map(s => P(Cone(.1, .25, 4), fin, [s * .25, -.15, .15], [0, 0, s * 1.2], [.3, 1, 1])),
    ...[-1, 1].map(s => P(Cyl(.008, .008, .25, 4), '#c06a1a', [s * .1, -.08, .55], [.8, 0, s * .5]))]));
  r.tail = piv(R, [0, 0, -.55], [P(Cone(.3, .45, 4), fin, [0, 0, -.2], [-H, 0, 0], [1, 1, .2])]); r.sway = 5;
});
// a long snake (or the Rainbow Serpent, or a long Vietnamese dragon): a chain that swims along behind its head
export function serpent(S, { n = 16, r = .22, colors = ['#4a9a3a', '#6ab84a'], head = null, horns = false, y = .2, waveAmp = .4 } = {}) {
  const g = new THREE.Group(), segs = [];
  for (let i = 0; i < n; i++) { const k = 1 - i / n * .65, s = mesh([P(Sp(r * k, 10, 8), colors[i % colors.length], [0, 0, 0], [0, 0, 0], [1, 1, 1.3])]); g.add(s); segs.push(s); }
  const hd = mesh([P(Sp(r * 1.25, 12, 10), head || colors[0], [0, 0, .1], [0, 0, 0], [1, .85, 1.35]), ...eyes(r * .55, r * .5, r * 1.15, r * .25), P(Sp(r * .2, 6, 5), '#e8332a', [0, -r * .3, r * 1.5]),
    ...(horns ? [-1, 1].flatMap(s => [P(Cone(r * .2, r * 1.3, 5), '#ffd23f', [s * r * .5, r * 1.1, -.05], [-.5, 0, s * -.3]), P(Cyl(r * .04, r * .04, r * 2.4, 4), '#ffd23f', [s * r * 1.1, -r * .2, r * 1.2], [0, 0, s * 1.3])]) : [])]);
  g.add(hd); segs.unshift(hd);
  // the path its head has taken; each piece follows a little behind
  const trail = []; let wob = 0;
  g.userData.head = hd;
  g.userData.tick = (dt, time) => {
    wob += dt;
    // the path is filled in every r/2, so a big step (a slow phone, a jump in time) leaves no gaps in the body
    const p = hd.position.clone(), step = r * .5;
    if (!trail.length) trail.unshift(p);
    else { const d = p.distanceTo(trail[0]); if (d > step) { const from = trail[0].clone(); for (let j = 1, n = Math.min(60, Math.floor(d / step)); j <= n; j++) trail.unshift(from.clone().lerp(p, j * step / d)); } }
    if (trail.length > n * 3) trail.length = n * 3;
    for (let i = 1; i < segs.length; i++) { const q = trail[Math.min(trail.length - 1, i * 2)] || p; segs[i].position.set(q.x + Math.sin(wob * 4 + i * .7) * waveAmp * r * .5, q.y, q.z); }
  };
  // lay it straight behind its head (pointing +z) before it moves
  g.userData.lay = (x, z, dir = 0) => { hd.position.set(x, y, z); trail.length = 0; for (let i = n * 3; i >= 0; i--) trail.push(new THREE.Vector3(x - Math.sin(dir) * i * r * .5, y, z - Math.cos(dir) * i * r * .5)); trail.reverse(); for (let i = 1; i < segs.length; i++) segs[i].position.copy(trail[Math.min(trail.length - 1, i * 2)]); hd.rotation.y = dir; };
  S.add(g); // (S.add starts its tick)
  return g;
}
// the serpent's head goes somewhere (turns to face it)
export const slither = (S, sn, t, dur, to, arc = 0) => { const hd = sn.userData.head; S.at(t, () => { hd.rotation.y = Math.atan2(to[0] - hd.position.x, to[2] - hd.position.z); }); return S.move(hd, t, dur, to, lin, arc); };
export const owl = () => { const o = buildOwl(); o.remove(o.children[o.children.length - 1]); return o; };
// a bird of any colour, bigger than the film's little ones
export const bird = (c, s = 1) => { const b = Pp.bird(c); b.scale.setScalar(s); return b; };

// ---------- things ----------
export const bowl = Pp.bowl, basket = Pp.basket, sack = Pp.sack;
export const axe = (head = '#9aa0a8') => mesh([P(Cyl(.03, .03, .8, 6), '#8a5a32', [0, .4, 0]), P(Box(.25, .16, .04), head, [.1, .76, 0])]);
export const gourd = (s = 1) => { const m = mesh([P(Sp(.4, 14, 10), '#cfd88a', [0, .38, 0]), P(Sp(.26, 12, 9), '#cfd88a', [0, .82, 0]), P(Cyl(.04, .05, .18, 6), '#6a8a3a', [0, 1.1, 0])]); m.scale.setScalar(s); return m; };
export const mango = (c = '#f2b62a') => mesh([P(Sp(.14, 10, 8), c, [0, .14, 0], [0, 0, .3], [1, 1.25, .9]), P(Cyl(.01, .01, .06, 4), '#5a7a2a', [0, .3, 0])]);
export const pear = () => mesh([P(Sp(.12, 10, 8), '#d8d84a', [0, .1, 0]), P(Sp(.08, 10, 8), '#d8d84a', [0, .22, 0]), P(Cyl(.01, .01, .06, 4), '#6a4a2a', [0, .3, 0])]);
export const milkFruit = () => mesh([P(Sp(.16, 12, 10), '#9a6ab0', [0, .16, 0]), P(Cyl(.01, .01, .06, 4), '#5a7a2a', [0, .33, 0])]);
export const pot = Pp.pot;
export const bell = () => mesh([P(Sp(.07, 10, 8), '#ffcf33', [0, 0, 0], [0, 0, 0], [1, .9, 1]), P(Box(.12, .015, .015), '#c69a1a', [0, -.04, 0])]);
export const brush = () => mesh([P(Cyl(.02, .02, .5, 6), '#8a3a2a', [0, .25, 0]), P(Cone(.04, .12, 6), '#2a2a2a', [0, -.04, 0], [PI, 0, 0])]);
export const drum = () => mesh([P(Cyl(.35, .35, .45, 14), '#c62f2f', [0, .23, 0]), P(Cyl(.36, .36, .03, 14), '#f2e2c0', [0, .46, 0]), P(Cyl(.36, .36, .03, 14), '#f2e2c0', [0, 0, 0])]);
export const lute = () => mesh([P(Sp(.22, 12, 9), '#b8783a', [0, 0, 0], [0, 0, 0], [1, 1.2, .35]), P(Box(.06, .7, .04), '#7a4a22', [0, .5, 0]), P(Box(.12, .06, .06), '#5a3a1a', [0, .86, 0])]);
export const firecrackers = () => { const g = new THREE.Group(); for (let i = 0; i < 6; i++) g.add(mesh([P(Cyl(.035, .035, .16, 6), '#e8332a', [0, -i * .15, 0], [0, 0, H])])); g.add(mesh([P(Cyl(.008, .008, .9, 4), '#e8b62a', [0, -.38, 0])])); return g; };
export const pudding = () => { const g = new THREE.Group(); g.add(mesh([P(Sp(.4, 14, 10), '#9a5a2a', [0, .3, 0], [0, 0, 0], [1, .85, 1]), P(Sp(.38, 12, 8), '#fbf3e4', [0, .5, 0], [0, 0, 0], [1, .35, 1]), P(Sp(.07, 8, 6), '#e8332a', [0, .66, 0]),
  ...eyes(.13, .4, .33, .05), P(Box(.18, .03, .03), '#4a2a1a', [0, .24, .36])])); return g; };
export const fishBasket = () => mesh([P(Cyl(.26, .2, .34, 10), '#c9a25a', [0, .17, 0]), P(Sp(.18, 10, 8), '#9ab8c8', [0, .34, 0], [0, 0, 0], [1, .3, 1])]);
export const fruitTree = (fruit = '#e8432a', s = 1, n = 9) => {
  const g = new THREE.Group();
  g.add(mesh([P(Cyl(.2, .3, 2.2, 8), '#7a5236', [0, 1.1, 0]), ...[0, 1, 2, 3, 4, 5].map(i => P(Sp(1, 10, 8), i % 2 ? '#4f9e42' : '#5fae4a', [Math.cos(i * 1.05) * (i ? .95 : 0), 2.9 + (i % 3) * .3, Math.sin(i * 1.05) * (i ? .95 : 0)]))]));
  const fruits = []; for (let i = 0; i < n; i++) { const a = i * 2.39, d = 1.3 + (i % 3) * .2, f = mesh([P(Sp(.13, 10, 8), fruit, [0, 0, 0])]); f.position.set(Math.cos(a) * d, 2.2 + (i % 4) * .25, Math.sin(a) * d); g.add(f); fruits.push(f); }
  g.userData.fruits = fruits; g.scale.setScalar(s); return g;
};
// a gum tree (eucalyptus): a pale tall trunk and loose grey-green leaves
export const gumTree = (s = 1) => { const m = mesh([P(Cyl(.18, .3, 4, 8), '#e8dcc8', [0, 2, 0]), P(Cyl(.08, .12, 1.6, 6), '#e8dcc8', [.5, 3.6, 0], [0, 0, -.6]), P(Cyl(.08, .12, 1.4, 6), '#e8dcc8', [-.4, 3.8, .2], [.3, 0, .6]),
  ...[0, 1, 2, 3, 4, 5, 6].map(i => P(Sp(.9, 9, 7), i % 2 ? '#8aa86a' : '#9ab878', [Math.cos(i * .9) * 1.1, 4.3 + (i % 3) * .4, Math.sin(i * .9) * 1.1], [0, 0, 0], [1, .6, 1]))]); m.scale.setScalar(s); return m; };
export const rock = (c = '#9a8f84', s = 1) => mesh([P(new THREE.DodecahedronGeometry(.5 * s), c, [0, .25 * s, 0], [.3, .6, 0], [1.3, .7, 1])]);
export const palmTree = (S, x, z, lean = .2, ry = 0) => L.palm(S, x, z, lean, ry);

// ---------- sets ----------
export const sky = (S, top = '#7cc8f0', bottom = '#e8f6ff') => S.sky(top, bottom);
// a Vietnamese village: houses, bamboo, a banyan, rice fields, a road
export function village(S, { house = [0, -6], paddy = true, hills = true } = {}) {
  S.sky('#7cc8f0', '#e8f6ff'); L.ground(S, '#8fcf6a'); if (hills) L.mountains(S, -110); L.sun(S, -60, 55, -170, 9);
  L.clouds(S, [[-40, 28, -90, 2], [30, 34, -110, 2.4]]);
  if (house) L.house(S, house[0], house[1]);
  L.bamboo(S, -9, -3); L.bamboo(S, 9.5, -4, '#5fae4a', 6); L.bamboo(S, -13, 5, '#5fae4a', 6, 6); L.bamboo(S, 13, 6, '#5fae4a', 8);
  L.banyan(S, -16, -12, 1.1); if (paddy) L.paddy(S, 20, 2, 10, 9);
  S.add(flat(60, 3, '#d8bf8a'), 0, .005, 9);
}
// a green forest: big trees all round, bamboo, soft light
export function forest(S, { dark = false } = {}) {
  S.sky(dark ? '#5a8a7a' : '#8ad0e0', dark ? '#c8e8d0' : '#e8f6e8'); L.ground(S, '#6fb85a');
  [[-8, -6], [7, -8], [-12, 2], [12, 0], [-4, -12], [3, -14], [-15, -9], [15, -10], [0, -20]].forEach(([x, z], i) => L.banyan(S, x, z, .7 + (i % 3) * .15));
  L.bamboo(S, -5, -4, '#5fae4a', 6, 6); L.bamboo(S, 5.5, -3, '#5fae4a', 5, 6);
  for (let i = 0; i < 10; i++) S.add(mesh([P(Sp(.5, 8, 6), i % 2 ? '#4f9e42' : '#5fae4a', [0, .3, 0], [0, 0, 0], [1.3, .7, 1])]), Math.cos(i * 2.4) * (6 + i % 3), 0, Math.sin(i * 2.4) * 4 - 4);
  if (dark) S.light(.7, .7);
}
// the palace yard, with red lanterns
export function palace(S) {
  S.sky('#7cc8f0', '#eaf6ff'); L.sun(S, 50, 50, -170, 8); L.clouds(S, [[-30, 28, -90, 2]]); L.ground(S, '#a8d88a'); L.palace(S);
  L.lantern(S, -5, 3.6, -5.6); L.lantern(S, 5, 3.6, -5.6);
}
// night: deep blue sky, stars, a low light
export function night(S, { moon = true, ground = '#4a6a4a' } = {}) {
  S.sky('#141a44', '#34406e'); S.light(.35, .45); if (ground) L.ground(S, ground);
  stars(S); if (moon) moonDisc(S, 30, 34, -90, 7);
}
export function stars(S, n = 60) {
  const g = new THREE.Group(), m = glow('#ffffff', .9); m.userData.film = true; m.fog = false;
  for (let i = 0; i < n; i++) { const a = i * 2.39, e = .25 + (i * 37 % 60) / 100, s = new THREE.Mesh(new THREE.OctahedronGeometry(.25 + (i % 3) * .12), m); s.position.set(Math.cos(a) * 150 * Math.cos(e), 150 * Math.sin(e), -Math.abs(Math.sin(a)) * 150 * Math.cos(e) - 20); g.add(s); }
  S.every((dt, time) => g.children.forEach((s, i) => { s.scale.setScalar(.7 + Math.sin(time * 2 + i) * .3); }));
  return S.add(g);
}
// the full moon (with a banyan's shadow on it)
export function moonDisc(S, x, y, z, r = 6) {
  const g = new THREE.Group(), m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), glow('#fff6c8', 1)); m.material.userData.film = true; m.material.fog = false; g.add(m);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(r * .35, 16), new THREE.MeshBasicMaterial({ color: '#d8cc98', fog: false })); sh.material.userData.film = true; sh.position.set(r * .2, -r * .15, r * 1.01); g.add(sh);
  return S.add(g, x, y, z);
}
// the moon's ground: pale and round, with a banyan (the moon tree)
export function moonGround(S) {
  S.sky('#0e1236', '#2a3062'); S.light(.6, .7); stars(S);
  S.add(mesh([P(Sp(30, 32, 20), '#e8e0b8', [0, -29.6, 0])]));
  for (let i = 0; i < 7; i++) S.add(mesh([P(Cyl(1 + i % 2, 1.2 + i % 2, .2, 16), '#d8cfa4', [0, 0, 0])]), Math.cos(i * 2.4) * 8, .3, Math.sin(i * 2.4) * 6 - 4);
}
// up in the sky above the clouds: a soft floor of cloud, the Jade Emperor's gate
export function heaven(S, { gate = true } = {}) {
  S.sky('#8ab8f8', '#fff4e0'); L.sun(S, 40, 30, -150, 10, '#fff6c0');
  const parts = []; for (let i = 0; i < 40; i++) { const a = i * 2.39, d = Math.sqrt(i) * 3.2; parts.push(P(Sp(2 + (i % 3) * .6, 10, 8), i % 2 ? '#ffffff' : '#f4f6ff', [Math.cos(a) * d, -1.2, Math.sin(a) * d], [0, 0, 0], [1.4, .55, 1.4])); }
  S.add(mesh(parts)); L.clouds(S, [[-30, 10, -60, 2.6], [26, 14, -70, 3]]);
  if (gate) { S.add(mesh([P(Box(9, .5, 1.6), '#c62f2f', [0, 5.4, 0]), P(Box(10, .4, 2), '#e8b62a', [0, 5.9, 0]), ...[-3.6, 3.6].map(x => P(Cyl(.35, .35, 5.4, 10), '#c62f2f', [x, 2.6, 0])), P(Box(2.4, 1, .2), '#e8b62a', [0, 4.6, .9])]), 0, 0, -10); }
}
// the open sea with a beach in front
export function seaside(S) { S.sky('#6fc0ee', '#d8f0ff'); L.sea(S); L.sun(S, 70, 45, -160, 9); S.add(flat(80, 14, '#f0d9a0', .02), 0, 0, 10); L.clouds(S, [[-40, 24, -100, 2.2], [30, 30, -110, 2.4]]); }
// a river between green banks
export function river(S) { S.sky('#7cc8f0', '#eaf7ff'); L.sun(S, -40, 40, -150, 8); L.sea(S, '#4fa8c8', -.3); S.add(flat(200, 60, '#8fcf6a', .05), 0, 0, -40); S.add(flat(200, 40, '#8fcf6a', .05), 0, 0, 26); L.bamboo(S, -9, -12); L.banyan(S, 10, -14, .8); L.mountains(S, -100); }
// the Australian bush: red earth, gum trees, rocks, a big red rock far away
export function bush(S, { dry = false, rockFar = true } = {}) {
  S.sky('#5ab0f0', '#fff0d8'); L.sun(S, 50, 45, -160, 10, dry ? '#ffe08a' : '#fff2a8'); L.ground(S, dry ? '#d89a5a' : '#c8a868');
  if (rockFar) S.add(mesh([P(Sp(20, 20, 10), '#c8603a', [0, 0, 0], [0, 0, 0], [2.4, .55, 1])]), 10, 0, -130);
  [[-9, -6], [8, -8], [-13, 3], [13, 1], [3, -13]].forEach(([x, z], i) => S.add(gumTree(.8 + (i % 2) * .25), x, 0, z));
  [[-4, -3], [5, -2.6], [-7, 4]].forEach(([x, z], i) => S.add(rock(i % 2 ? '#b8785a' : '#a8886a', 1 + i * .3), x, 0, z));
  for (let i = 0; i < 12; i++) S.add(mesh([P(Cone(.25, .6, 5), dry ? '#c8b85a' : '#9ab85a', [0, .3, 0])]), Math.cos(i * 2.1) * (5 + i % 4), 0, Math.sin(i * 2.1) * 3 + 2);
}
// a waterhole in the bush (Tiddalik's country, the emu's)
export const pond = (S, x, z, r = 3, c = '#5ab0d0') => S.add(mesh([P(Cyl(r, r, .06, 24), c, [0, .03, 0]), P(Cyl(r + .3, r + .3, .03, 24), '#c8a868', [0, .01, 0])]), x, 0, z);
// a Chinese village: houses with red doors and curved roofs, a willow, lanterns
export function chinaVillage(S) {
  S.sky('#86cdf0', '#f4f6ff'); L.ground(S, '#9ad07a'); L.mountains(S, -110, '#7a98a8'); L.sun(S, -50, 50, -170, 8);
  if (S.look) L.house(S, -7, -7, .2);
  else [[-7, -7, .2], [7, -7, -.2]].forEach(([x, z, ry]) => S.add(mesh([P(Box(5, 2.4, 3.4), '#f2e6d0', [0, 1.2, 0]), P(Box(1.2, 1.8, .1), '#c62f2f', [0, .9, 1.71]), P(Box(6.4, .3, 4.6), '#3a4a5a', [0, 2.55, 0]),
    P(Cone(4, 1.4, 4), '#3a4a5a', [0, 3.3, 0], [0, PI / 4, 0], [1.25, 1, .85]), ...[-1, 1].map(s => P(Cone(.25, 1, 5), '#3a4a5a', [s * 3.2, 2.7, 2.2], [-.5, 0, s * -.9]))]), x, 0, z, ry));
  L.lantern(S, -3, 2.6, -4.6); L.lantern(S, 3, 2.6, -4.6); L.banyan(S, -13, -2, .8); L.bamboo(S, 12, -2);
  S.add(flat(60, 3, '#d8c8a0'), 0, .005, 4);
}
// an Indian village: a white house with a flat roof, palms, a banyan, a well
export function indiaVillage(S, { well = true } = {}) {
  S.sky('#6ab8f0', '#fff4dc'); L.sun(S, 50, 50, -160, 10, '#fff0a0'); L.ground(S, '#c8b878');
  if (S.look) L.house(S, -6, -7, .2);
  else S.add(mesh([P(Box(5, 2.6, 3.6), '#f4ece0', [0, 1.3, 0]), P(Box(5.4, .3, 4), '#e8a85a', [0, 2.7, 0]), P(Box(1.1, 1.8, .1), '#3a6ab0', [0, .9, 1.81]), P(Box(.8, .7, .1), '#3a6ab0', [-1.6, 1.5, 1.81])]), -6, 0, -7, .2);
  L.palm(S, 8, -6, .3); L.palm(S, 11, -2, .4, 1); L.banyan(S, -13, -2, .9); L.mountains(S, -110, '#a8b0a0');
  if (well) S.add(mesh([P(Cyl(.9, .9, .9, 14), '#b8a890', [0, .45, 0]), P(Cyl(.7, .7, .92, 14), '#3a5a6a', [0, .46, 0]), ...[-1, 1].map(s => P(Cyl(.06, .06, 1.6, 6), '#7a5236', [s * .8, 1.2, 0])), P(Cyl(.05, .05, 1.8, 6), '#7a5236', [0, 1.95, 0], [0, 0, H])]), 4, 0, -3);
}
// the dry plain (the thirsty crow, the elephants): yellow grass, few trees
export function plain(S) { S.sky('#7ac0f0', '#fff0d0'); L.sun(S, 60, 50, -160, 11, '#fff0a0'); L.ground(S, '#d8c078'); L.mountains(S, -120, '#b8a888'); L.banyan(S, -12, -10, .9); L.palm(S, 10, -9, .3); }
// a mountain top (where the fairy lives, where the iron horse flew)
export function mountainTop(S) {
  S.sky('#86c8f0', '#f0f8ff'); L.sun(S, 40, 40, -150, 8);
  S.add(mesh([P(Cone(30, 14, 12), '#7aa86a', [0, -7, 0])])); L.mountains(S, -90, '#8aa8c0'); L.clouds(S, [[-20, 2, -30, 2], [20, 1, -40, 2.4], [0, -2, 30, 3]]);
  [[-4, -3], [4, -2], [-2, 3]].forEach(([x, z]) => L.blossom(S, x, z));
}
// a little kitchen (Ông Táo's): the stove of three stones with a pot on the fire
export function kitchen(S) {
  S.sky('#f2c88a', '#fff0d8'); S.add(flat(30, 30, '#c8a878'), 0, 0, 0);
  S.add(mesh([P(Box(14, 4, .3), '#e2c79a', [0, 2, -4]), P(Box(.3, 4, 10), '#e2c79a', [-6, 2, 1]), P(Box(.3, 4, 10), '#e2c79a', [6, 2, 1]), P(Box(1.6, 1, .1), '#5a3a22', [3, 2.4, -3.84])]));
  const fp = Pp.firePot(); S.add(fp, 0, 0, -2); return fp;
}
// rain falling from t0 (to t1) over an area w wide around [x, z]
export function rain(S, t0, t1 = 1e9, x = 0, z = 0, w = 20, n = 160) {
  const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: .7 }); m.userData.film = true;
  const geo = new THREE.CylinderGeometry(.015, .015, .5, 3); geo.userData.film = true;
  for (let i = 0; i < n; i++) { const d = new THREE.Mesh(geo, m); d.userData.p = [((i * 37) % 100) / 100 * w - w / 2, ((i * 53) % 100) / 100, ((i * 71) % 100) / 100 * w * .6 - w * .3]; g.add(d); }
  g.visible = false; S.add(g, x, 0, z); S.show(g, t0); if (t1 < 1e9) S.show(g, t1, false);
  S.every((dt, time) => { if (g.visible) g.children.forEach(d => { const [px, ph, pz] = d.userData.p, k = (time * 1.2 + ph) % 1; d.position.set(px, 12 * (1 - k), pz); }); });
  return g;
}
