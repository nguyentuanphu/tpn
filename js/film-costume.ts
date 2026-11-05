// The costume kit in the films (round v1.08c, blender helper): the period clothes, hair and headwear of the old tales, the same
// ids and colours as the Blender kit (tools/blender/costumes.py, renders in docs/characters-v108/costumes/). A tale's look names
// its costume with LOOK({ style, kit: '<id>' }): the style is the base shape the valley's builder makes (js/avatar.ts), and the
// kit adds the rest on top (a yếm, a váy, a sash, a khăn, armour, a crown, wide sleeves). Loaded with the films only.
import { THREE, P, merge, toonSmooth } from './gfx.js';

type Part = { g: unknown, color: string };
type Look = Record<string, any>;
type Kit = { base: (L: Look) => Look, dress: (A: any, L: Look) => void, headwear?: string[] };

const PI = Math.PI, H = PI / 2;
const Cyl = (rt: number, rb: number, h: number, s = 20, open = false, t0 = 0, tl = PI * 2) => new THREE.CylinderGeometry(rt, rb, h, s, 1, open, t0, tl);
const Sph = (r: number, ws = 14, hs = 10, p0 = 0, pl = PI * 2, t0 = 0, tl = PI) => new THREE.SphereGeometry(r, ws, hs, p0, pl, t0, tl);
const Tor = (r: number, t: number, arc = PI * 2) => new THREE.TorusGeometry(r, t, 6, 24, arc);
const Box = (x: number, y: number, z: number) => new THREE.BoxGeometry(x, y, z);
const Cone = (r: number, h: number, s = 12, open = false) => new THREE.ConeGeometry(r, h, s, 1, open);
function add(to: any, parts: Part[]) { if (!to || !parts.length) return; const m = new THREE.Mesh(merge(parts), toonSmooth({ roughness: .8 })); to.add(m); return m; }
// the kit's colours (the same as costumes.py)
const C = { skirt: '#2b2422', sash: '#e8b84a', yem: '#e0603a', trim: '#5e3a26', khan: '#3e302a', van: '#3a2a22', xep: '#22202a', iron: '#6a7480', gold: '#d4a23a', red: '#b8332a', jade: '#3f8a6f', cream: '#efe6d2', white: '#f4efe2' };
// áo nâu is brown: a film's own colour picks one of the kit's browns, so the people of a tale still look different
const BROWNS = ['#7a5034', '#6a4a32', '#8a6a4a', '#5e4636', '#9a7a52', '#4e3a2c'];
const brown = (c: string) => BROWNS[[...String(c)].reduce((a, ch) => a + ch.charCodeAt(0), 0) % BROWNS.length];
const bare = (L: Look) => !L.hat || L.hat === 'none';

// ---------- pieces worn on the head (the head's own units: a ball of radius .5, the face towards +z) ----------
const HEAD: Record<string, (L: Look) => Part[]> = {
  // khăn mỏ quạ: a dark cloth over the head and down the cheeks, its front edge pinched to a crow's-beak point, tied under the chin
  khanmoquat: () => [P(Sph(.6, 20, 12, H + .95, PI * 2 - 1.9, 0, PI * .72), C.khan, [0, .02, -.02]), P(Sph(.6, 20, 6, 0, PI * 2, 0, PI * .26), C.khan, [0, .02, -.02]),
    P(Cone(.16, .3, 4), C.khan, [0, .46, .44], [H + .5, 0, 0], [1, 1, .35]), P(Sph(.07), C.khan, [0, -.5, .32]), P(Box(.05, .16, .02), C.khan, [.04, -.6, .34], [0, 0, .3])],
  // khăn vấn: a long cloth wound into a soft ring round the head
  khanvan: () => [P(Tor(.5, .1), C.van, [0, .2, -.02], [H - .2, 0, 0]), P(Tor(.46, .09), '#4a3a2e', [0, .32, -.04], [H - .25, 0, 0])],
  // khăn xếp: a ready-folded black turban, neat folds and a closed top
  khanxep: () => [0, 1, 2].map(i => P(Tor(.5 - i * .015, .07), C.xep, [0, .12 + i * .11, 0], [H - .05 * (i % 2), 0, 0])).concat([P(Cyl(.46, .48, .05), C.xep, [0, .4, 0]), P(Box(.5, .02, .02), '#3a3646', [0, .25, .5], [0, 0, .2])]),
  // khăn đầu rìu: a cloth wound round the head, the knot standing up over the forehead like an axe head
  khandaurriu: () => [P(Tor(.5, .08), C.van, [0, .2, 0], [H - .1, 0, 0]), P(Sph(.5, 16, 8, 0, PI * 2, 0, PI * .4), C.van, [0, .12, 0]), P(Box(.26, .18, .05), C.van, [0, .48, .42], [-.5, 0, 0]), P(Sph(.06), C.van, [0, .36, .5])],
  // a general's helmet: an iron dome, a gold rim, a spike and a red plume
  warhelm: () => [P(Sph(.58, 18, 10, 0, PI * 2, 0, PI * .52), C.iron, [0, .04, 0]), P(Tor(.57, .035), C.gold, [0, .06, 0], [H, 0, 0]), P(Cone(.04, .22), C.gold, [0, .72, 0]),
    P(Sph(.12), C.red, [0, .74, -.2], [0, 0, 0], [.7, .7, 1.8]), P(Box(.08, .3, .2), C.iron, [.55, -.08, 0]), P(Box(.08, .3, .2), C.iron, [-.55, -.08, 0])],
  // mũ miện: a black cap, a gold band, a flat board on top with hanging beads in front and behind
  mien: () => {
    const p = [P(Cyl(.46, .5, .32), C.xep, [0, .32, 0]), P(Tor(.5, .03), C.gold, [0, .18, 0], [H, 0, 0]), P(Box(1.0, .03, .62), C.xep, [0, .5, 0]), P(Box(1.02, .012, .64), C.gold, [0, .52, 0])];
    for (let i = 0; i < 7; i++) for (const z of [.3, -.3]) for (let k = 0; k < 3; k++) p.push(P(Sph(.03, 6, 4), k % 2 ? '#c62f2f' : '#f2d16b', [-.42 + i * .14, .46 - k * .08, z]));
    return p;
  },
  // mũ phượng: a gold band with upright points and rubies, a phoenix in front, two wings at the sides
  phoenix: () => {
    const p = [P(Tor(.5, .04), C.gold, [0, .26, 0], [H - .08, 0, 0]), P(Sph(.09), C.gold, [0, .48, .44], [0, 0, 0], [1, 1.4, .6]), P(Box(.04, .16, .32), C.gold, [.5, .4, 0], [.4, 0, 0]), P(Box(.04, .16, .32), C.gold, [-.5, .4, 0], [.4, 0, 0])];
    for (let i = 0; i < 7; i++) { const a = -1.2 + i * .4; p.push(P(Cone(.035, .16, 6), C.gold, [Math.sin(a) * .48, .38, Math.cos(a) * .48]), P(Sph(.03, 6, 4), '#c62f2f', [Math.sin(a) * .48, .47, Math.cos(a) * .48])); }
    return p;
  },
  // a settler's sun bonnet: a soft hood round the back of the head, a brim framing the face, a ribbon under the chin
  bonnet: () => [P(Sph(.6, 18, 12, H + 1.3, PI * 2 - 2.6, 0, PI * .7), C.white, [0, .04, -.04]), P(Tor(.56, .07, PI * 1.1), C.white, [0, .02, .24], [0, 0, -PI * .05], [1, 1.1, .6]), P(Box(.05, .2, .02), '#6f8fb0', [0, -.52, .3])],
  // a small cap over a topknot with a gold pin (a man's hanfu)
  guan: () => [P(Cyl(.1, .13, .14), C.xep, [0, .62, -.05]), P(Cyl(.012, .012, .38), C.gold, [0, .64, -.05], [0, 0, H])],
};
// hair the kit adds to the valley's 'short' hair: a topknot, a high bun with a hairpin, a long braid
const HAIR: Record<string, (L: Look) => Part[]> = {
  topknot: L => [P(Sph(.15), L.hair, [0, .56, -.06]), P(Tor(.1, .025), '#b8463a', [0, .46, -.06], [H, 0, 0])],
  highbun: L => [P(Sph(.2), L.hair, [0, .4, -.32]), P(Cyl(.014, .014, .62), C.gold, [0, .42, -.32], [0, 0, H - .3]), P(Sph(.05, 8, 6), '#f6a5b6', [.3, .5, -.3])],
  braid: L => { const p: Part[] = []; for (let i = 0; i < 7; i++) p.push(P(Sph(.1 - i * .006, 8, 6), L.hair, [(i % 2 ? .02 : -.02), -.15 - i * .16, -.46 - i * .02])); p.push(P(Sph(.06, 8, 6), '#d63a6a', [0, -1.28, -.6])); return p; },
};

// ---------- the costumes ----------
// (body parts are in the body's own units: hips at y .6, chest to 1.0, neck 1.08, the front towards +z)
const yem = (c: string, wide = .13) => P(Box(wide, wide, .02), c, [0, .84, .145], [0, 0, PI / 4], [1, 1.25, 1]);
const sash = (c: string, y = .67, ends = true) => [P(Tor(.17, .022), c, [0, y, 0], [H, 0, 0], [1, .84, 1])].concat(ends ? [P(Box(.03, .22, .012), c, [.04, y - .12, .16], [.1, 0, .05]), P(Box(.03, .2, .012), c, [.0, y - .11, .165], [.1, 0, -.04])] : []);
const robeToFeet = (c: string, r = .26) => P(Cyl(.235, r, .2, 20, true), c, [0, .08, 0]);
const longSkirt = (c: string, top = .5, rt = .17, rb = .27) => P(Cyl(rt, rb, top, 20, true), c, [0, top / 2, 0]);
const collar = (c: string) => P(Cyl(.06, .066, .07, 14), c, [0, 1.07, 0]);
const crossCollar = (c: string) => [P(Box(.03, .3, .015), c, [-.03, .92, .15], [0, 0, .6]), P(Box(.03, .16, .015), c, [.06, .99, .14], [0, 0, -.6])];
function sleeves(A: any, c: string, r = .1) { for (const e of [A.elbowL, A.elbowR]) add(e, [P(Cone(r, .2, 14, true), c, [0, -.17, 0], [PI, 0, 0])]); }
function recolour(o: any, from: string, to: string) {
  const f = new THREE.Color(from); o && o.traverse((m: any) => { const mt = m.material; if (mt && mt.color && !mt.vertexColors && mt.color.equals(f)) { m.material = mt.clone(); m.material.color.set(to); } });
}
const under = (L: Look, o: Look) => Object.assign({}, L, o);
const withHat = (L: Look, hw: string, replace: string[] = []) => bare(L) || replace.includes(L.hat) ? { hat: 'none', kitHat: hw } : {};

export const KIT: Record<string, Kit> = {
  // áo tứ thân over a yếm, váy đụp to the ankle, a sash; the khăn mỏ quạ (or the long hair of a fairy, a young woman)
  'vn-tuthan': { base: L => under(L, Object.assign({ style: 'aodai' }, L.hairStyle === 'long' ? {} : Object.assign(withHat(L, 'khanmoquat'), bare(L) ? { hairStyle: 'short' } : {}))),
    dress: (A, L) => add(A.torso, [longSkirt(C.skirt, .44, .17, .25), yem(L.kc || C.yem), P(Box(.014, .26, .012), C.trim, [.07, .86, .15], [0, 0, -.3]), P(Box(.014, .26, .012), C.trim, [-.07, .86, .15], [0, 0, .3]), ...sash(C.sash)]) },
  'vn-khanvan': { base: L => under(L, Object.assign({ style: 'aodai' }, withHat(L, 'khanvan'), bare(L) ? { hairStyle: 'short' } : {})),
    dress: (A, L) => add(A.torso, [longSkirt(C.skirt, .44, .17, .25), yem(L.kc || '#f0d9a8'), ...sash('#7fae5e')]) },
  // yếm and váy đụp: bare shoulders and arms
  'vn-yem': { base: L => under(L, { style: 'shirt', color: L.skin }),
    dress: (A, L) => { recolour(A.legL, '#2f3a5a', C.skirt); recolour(A.legR, '#2f3a5a', C.skirt);
      add(A.torso, [longSkirt(L.kc || '#3a2e2a', .62, .17, .28), P(Box(.17, .17, .02), L.own || C.yem, [0, .82, .14], [0, 0, PI / 4], [1, 1.2, 1]), P(Tor(.07, .008), '#e86a6a', [0, 1.06, 0], [H - .3, 0, 0]), ...sash('#7fae5e', .62)]); } },
  // áo the: a long dark gauze tunic, a high collar, white trousers, the khăn xếp
  'vn-aothe': { base: L => under(L, Object.assign({ style: 'aodai' }, withHat(L, 'khanxep'), bare(L) ? { hairStyle: 'short' } : {})),
    dress: (A, L) => add(A.torso, [collar('#3a3646'), ...[0, 1, 2].map(i => P(Sph(.012, 6, 4), C.gold, [.04, 1.0 - i * .06, .14]))]) },
  // áo nâu: a short brown jacket, a red sash, the khăn đầu rìu (or the nón lá the film gives)
  'vn-aonau': { base: L => under(L, Object.assign({ style: 'tunic', color: brown(L.color) }, withHat(L, 'khandaurriu'), bare(L) ? { hairStyle: 'short' } : {})),
    dress: (A) => add(A.torso, [...sash('#b8463a', .66), ...[0, 1, 2].map(i => P(Sph(.012, 6, 4), '#4e3a2c', [0, .92 - i * .08, .15]))]) },
  // a village boy: áo cánh and a topknot (chỏm)
  'vn-boy': { base: L => under(L, { style: 'tunic', hairStyle: 'short', kitHair: 'topknot' }), dress: (A) => add(A.torso, sash('#b8463a', .66, false)) },
  // khố: a loincloth with front and back flaps, bare chest, a woven arm band, a topknot
  'vn-kho': { base: L => under(L, { style: 'shirt', color: L.skin, hairStyle: 'short', kitHair: 'topknot' }),
    dress: (A, L) => { const k = L.kc || '#8a5a36'; recolour(A.legL, '#2f3a5a', k); recolour(A.legR, '#2f3a5a', k);
      add(A.torso, [P(Cyl(.165, .17, .14), k, [0, .6, 0], [0, 0, 0], [1.05, 1, .88]), P(Box(.13, .22, .02), k, [0, .47, .15]), P(Box(.13, .2, .02), k, [0, .48, -.15]), P(Tor(.17, .012), '#c9a36a', [0, .66, 0], [H, 0, 0], [1.05, .88, 1])]);
      for (const a of [A.armL, A.armR]) add(a, [P(Tor(.055, .012), '#c9a36a', [0, -.12, 0], [H, 0, 0])]); } },
  // giáp: an iron breastplate with a gold chest mirror, plates over the hips, shoulder guards, the helmet
  'vn-armour': { base: L => under(L, Object.assign({ style: 'tunic' }, withHat(L, 'warhelm', ['silkcap']))),
    dress: (A) => { add(A.torso, [P(Cyl(.178, .172, .27, 20), C.iron, [0, .82, 0], [0, 0, 0], [1.12, 1, .86]), P(Cyl(.055, .055, .012, 16), C.gold, [0, .86, .155], [H, 0, 0]), P(Cyl(.2, .25, .16, 10, true), C.iron, [0, .5, 0], [0, 0, 0], [1, 1, .9]), P(Tor(.18, .02), C.gold, [0, .66, 0], [H, 0, 0], [1.1, .86, 1])]);
      for (const a of [A.armL, A.armR]) add(a, [P(Sph(.08, 12, 8, 0, PI * 2, 0, PI * .6), C.iron, [0, .01, 0], [0, 0, 0], [1.2, .9, 1.15])]); } },
  // hoàng bào: a long robe to the feet, a gold emblem, a jade belt hung low, wide sleeves, the mũ miện
  'vn-king': { base: L => under(L, Object.assign({ style: 'aodai' }, withHat(L, 'mien', ['crown']), { hairStyle: 'short' })),
    dress: (A, L) => { add(A.torso, [robeToFeet(L.color), collar(C.red), P(Cyl(.06, .06, .012, 18), C.gold, [0, .86, .155], [H, 0, 0]), P(Tor(.2, .018), C.jade, [0, .62, .02], [H + .2, 0, 0], [1.05, .9, 1])]); sleeves(A, L.color); } },
  'vn-queen': { base: L => under(L, Object.assign({ style: 'aodai' }, withHat(L, 'phoenix', ['crown']))),
    dress: (A, L) => { add(A.torso, [robeToFeet(L.color), collar(C.gold), P(Cyl(.05, .05, .012, 18), C.gold, [0, .86, .155], [H, 0, 0]), ...sash(C.gold, .68)]); sleeves(A, L.color); } },
  // colonial Australia: a cream shirt, a waistcoat in the film's colour, a red neckerchief (the akubra stays)
  'au-colonial-m': { base: L => under(L, { style: 'tunic', color: C.cream }),
    dress: (A, L) => add(A.torso, [P(Cyl(.174, .168, .26, 20, false, .35, PI * 2 - .7), L.color, [0, .82, 0], [0, 0, 0], [1.13, 1, .85]), P(Tor(.07, .022), '#c0392b', [0, 1.05, 0], [H, 0, 0]), P(Cone(.05, .08, 3), '#c0392b', [0, .99, .1], [PI, 0, 0])]) },
  'au-colonial-f': { base: L => under(L, Object.assign({ style: 'dress' }, withHat(L, 'bonnet'))),
    dress: (A, L) => add(A.torso, [P(Cyl(.2, .34, .34, 20, true), L.color, [0, .17, 0]), P(Cyl(.17, .36, .56, 12, true, -.5, 1.0), C.white, [0, .38, .01]), P(Tor(.06, .02), C.white, [0, 1.05, 0], [H, 0, 0])]) },
  // China: hanfu with a crossed collar, a sash, wide sleeves; a high bun with a hairpin, or a topknot with a small cap
  'cn-hanfu-f': { base: L => under(L, { style: 'aodai', hairStyle: L.hairStyle === 'long' ? 'long' : 'short', kitHair: L.hairStyle === 'long' ? '' : 'highbun' }),
    dress: (A, L) => { add(A.torso, [robeToFeet(L.color), ...crossCollar(C.white), ...sash(C.sash, .8)]); sleeves(A, L.color, .12); } },
  'cn-hanfu-m': { base: L => under(L, Object.assign({ style: 'aodai', hairStyle: 'short' }, bare(L) ? { kitHair: 'topknot', kitHat: 'guan' } : {})),
    dress: (A, L) => { add(A.torso, [robeToFeet(L.color), ...crossCollar(C.white), ...sash(C.skirt, .66)]); sleeves(A, L.color); } },
  // India: a sari with its end over the left shoulder and a gold border, a braid and a bindi; a dhoti and kurta with a saffron scarf, the pagri
  'in-sari': { base: L => under(L, { style: 'aodai', hairStyle: 'short', kitHair: 'braid' }),
    dress: (A, L) => { add(A.torso, [robeToFeet(L.color), P(Box(.1, .6, .014), L.color, [-.02, .86, .155], [0, 0, -.6]), P(Box(.012, .6, .016), C.gold, [-.07, .84, .16], [0, 0, -.6]), P(Box(.12, .5, .014), L.color, [.1, .76, -.15], [0, 0, .2]), P(Tor(.25, .015), C.gold, [0, .02, 0], [H, 0, 0])]);
      add(A.head, [P(Sph(.03, 8, 6), '#c62f2f', [0, .16, .49])]); } },
  'in-dhoti': { base: L => under(L, Object.assign({ style: 'tunic' }, bare(L) ? { hat: 'pagri' } : {})),
    dress: (A, L) => { recolour(A.legL, '#7a5236', '#f6f1e6'); recolour(A.legR, '#7a5236', '#f6f1e6');
      add(A.torso, [P(Cyl(.22, .26, .24, 20, true), L.color, [0, .42, 0]), P(Tor(.13, .03, PI), '#e8a33a', [0, 1.0, 0], [H + .3, 0, PI], [1.2, 1.2, 1]), P(Box(.05, .3, .015), '#e8a33a', [.1, .85, .155]), P(Box(.05, .3, .015), '#e8a33a', [-.1, .85, .155])]); } },
};

/** the look the valley's builder makes for a kit costume (or the look itself when it names no kit) */
export function kitBase(L: Look) { const k = L.kit && KIT[L.kit]; return k ? k.base(L) : L; }
/** put the kit's pieces on a built actor: the clothes, then the hair and the headwear */
export function kitDress(A: any, L: Look, B: Look) {
  const k = L.kit && KIT[L.kit]; if (!k) return;
  B = Object.assign({}, B, { own: L.color }); k.dress(A, B);
  const hair = B.kitHair && HAIR[B.kitHair], hat = B.kitHat && HEAD[B.kitHat];
  add(A.head, [...(hair ? hair(B) : []), ...(hat ? hat(B) : [])]);
}
