// Chibi characters whose face is the child's own photo.
import { THREE, toon, glow, blobShadow, outline, P, merge, toonSmooth } from './gfx.js';
import { GLIDERS, settings } from './state.js';
import { customFace, familyOwnFace, onFamilyPhotos } from './custom.js';
import { wearing, BOY_OF } from './content/shop.js';

const gParts = {
  head: new THREE.SphereGeometry(.5, 32, 24),
  hairCap: new THREE.SphereGeometry(.54, 32, 18, 0, Math.PI * 2, 0, Math.PI * .55),
  hairBack: new THREE.SphereGeometry(.53, 24, 18, Math.PI, Math.PI, 0, Math.PI * .8),
  lock: new THREE.SphereGeometry(.15, 14, 10), bun: new THREE.SphereGeometry(.17, 12, 10), tie: new THREE.TorusGeometry(.1, .035, 8, 16),
  spike: new THREE.ConeGeometry(.14, .4, 6),
  body: new THREE.CylinderGeometry(.27, .36, .62, 16),
  skirt: new THREE.ConeGeometry(.55, .55, 18, 1, true),
  aodai: new THREE.CylinderGeometry(.26, .4, .95, 16),
  arm: new THREE.CylinderGeometry(.075, .07, .42, 8), hand: new THREE.SphereGeometry(.085, 10, 8),
  leg: new THREE.CylinderGeometry(.09, .085, .36, 8), shoe: new THREE.SphereGeometry(.12, 10, 8),
  belt: new THREE.TorusGeometry(.33, .04, 6, 20),
  nonla: new THREE.ConeGeometry(.82, .5, 24, 1, false), cap: new THREE.SphereGeometry(.56, 20, 12, 0, Math.PI * 2, 0, Math.PI * .45), brim: new THREE.CylinderGeometry(.3, .3, .04, 16, 1, false, 0, Math.PI),
  crown: new THREE.CylinderGeometry(.26, .3, .22, 8, 1, true), ear: new THREE.CapsuleGeometry(.08, .38, 4, 8), petal: new THREE.SphereGeometry(.09, 8, 6)
};
// (TypeScript, r86) the head's shapes, and the face and glider made just below
const G: typeof gParts & { face?: THREE.BufferGeometry, glider?: THREE.BufferGeometry } = gParts;
G.face = (() => {
  const g = new THREE.SphereGeometry(.508, 40, 28, 0, Math.PI, 0, Math.PI);
  const p = g.attributes.position, uv = g.attributes.uv, k = .47;
  for (let i = 0; i < p.count; i++) uv.setXY(i, .5 + p.getX(i) / (2 * k), .5 + (p.getY(i) + .03) / (2 * k));
  uv.needsUpdate = true; return g;
})();
G.glider = (() => {
  const s = new THREE.Shape(); s.moveTo(-1.3, 0); s.quadraticCurveTo(0, .55, 1.3, 0); s.lineTo(.9, -.15); s.quadraticCurveTo(0, .2, -.9, -.15); s.closePath();
  return new THREE.ShapeGeometry(s, 12);
})();

export function drawDefaultFace(x, S, look, mood = 'smile') {
  // Picture-book face: big clear eyes with a sparkle, soft brows, rosy cheeks and a small smile.
  x.save(); x.fillStyle = look.skin; x.fillRect(0, 0, S, S);
  x.fillStyle = look.hair; x.beginPath(); x.ellipse(S * .5, S * .02, S * .6, S * .2, 0, 0, Math.PI * 2); x.fill();
  x.restore(); drawFeatures(x, S, look, mood);
}
// Just the eyes, brows, cheeks and mouth (painted straight onto the head, so the skin shading matches).
export function drawFeatures(x, S, look, mood = 'smile') {
  x.save();
  [.36, .64].forEach(cx => {
    x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx * S, S * .55, S * .085, S * .075, 0, 0, 7); x.fill();
    x.fillStyle = '#3a2418'; x.beginPath(); x.arc(cx * S, S * .56, S * .06, 0, 7); x.fill();
    x.fillStyle = '#120a08'; x.beginPath(); x.arc(cx * S, S * .56, S * .03, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(cx * S + S * .022, S * .535, S * .02, 0, 7); x.fill();
    x.strokeStyle = '#2b1a14'; x.lineWidth = S * .02; x.lineCap = 'round'; x.beginPath(); x.ellipse(cx * S, S * .55, S * .088, S * .078, 0, Math.PI * 1.08, Math.PI * 1.92); x.stroke();
    x.strokeStyle = look.hair; x.lineWidth = S * .022; x.beginPath(); x.moveTo(S * (cx - .07), S * .44); x.quadraticCurveTo(S * cx, S * .41, S * (cx + .07), S * .44); x.stroke();
  });
  x.fillStyle = 'rgba(240,110,110,.4)'; [.24, .76].forEach(cx => { x.beginPath(); x.ellipse(cx * S, S * .67, S * .065, S * .04, 0, 0, 7); x.fill(); });
  x.fillStyle = '#a3485a'; x.beginPath();
  if (mood === 'o') x.arc(S * .5, S * .72, S * .035, 0, Math.PI * 2); else { x.moveTo(S * .44, S * .69); x.quadraticCurveTo(S * .5, S * .77, S * .56, S * .69); x.closePath(); }
  x.fill(); x.restore();
}
// Painted faces (no photo) are shared by every villager with the same hair and skin, at 256 px: phones
// (iPhones above all) have a small budget for pictures, and when it runs out new ones come out black.
const paintedFaces = {};
export function faceTexture(look, photo?) {
  if (!photo) {
    const k = look.hair + look.skin;
    if (!paintedFaces[k]) { const S = 256, c = document.createElement('canvas'); c.width = c.height = S; drawFeatures(c.getContext('2d'), S, look); paintedFaces[k] = new THREE.CanvasTexture(c); paintedFaces[k].colorSpace = THREE.SRGBColorSpace; }
    return paintedFaces[k];
  }
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const finish = () => {
    x.globalCompositeOperation = 'destination-in';
    const g = x.createRadialGradient(S / 2, S / 2, S * .42, S / 2, S / 2, S * .5); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S); x.globalCompositeOperation = 'source-over'; tex.needsUpdate = true;
  };
  drawFeatures(x, S, look); tex.needsUpdate = true;
  if (photo) { const im = new Image(); im.onload = () => { x.clearRect(0, 0, S, S); x.drawImage(im, 0, 0, S, S); finish(); }; im.src = photo; }
  return tex;
}
// Every character with an outline; the game hides outlines on far-away characters to keep phones fast.
export const OUTLINED = [];
const avatarCache = {};
export function avatarURL(p) {
  // (audit, 9 Oct) the result goes into <img src="…">: only a plain base64 picture or a simple file path of our own
  if (p.photo && (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(p.photo) || /^[\w\/.-]+\.(png|jpe?g|webp)$/i.test(p.photo))) return p.photo;
  const k = p.look.hair + p.look.skin;
  if (!avatarCache[k]) { const c = document.createElement('canvas'); c.width = c.height = 160; drawDefaultFace(c.getContext('2d'), 160, p.look); avatarCache[k] = c.toDataURL(); }
  return avatarCache[k];
}

// Natural child proportions (about three heads tall). The head is built at a larger scale and
// shrunk, so the photo-face mapping and the hats stay simple.
const HEAD_SCALE = .54;
const bParts = {
  torso: new THREE.LatheGeometry([V2(.0, .6), V2(.13, .6), V2(.15, .66), V2(.152, .8), V2(.16, .92), V2(.168, .98), V2(.12, 1.03), V2(.05, 1.05), V2(0, 1.05)], 20),
  skirt: new THREE.CylinderGeometry(.15, .33, .36, 22, 1, true),
  aodai: new THREE.CylinderGeometry(.155, .24, .5, 20, 1, true),
  tunic: new THREE.CylinderGeometry(.155, .22, .24, 20, 1, true),
  hips: new THREE.CylinderGeometry(.155, .16, .14, 18),
  upperArm: new THREE.CapsuleGeometry(.05, .3, 4, 10), hand: new THREE.SphereGeometry(.064, 12, 10),
  sleeve: new THREE.CapsuleGeometry(.074, .12, 4, 12),
  leg: new THREE.CapsuleGeometry(.064, .42, 4, 10), pants: new THREE.CapsuleGeometry(.074, .42, 4, 10), shorts: new THREE.CapsuleGeometry(.08, .1, 4, 10),
  shoe: new THREE.CapsuleGeometry(.068, .1, 4, 12), sole: new THREE.CapsuleGeometry(.07, .11, 4, 12), neck: new THREE.CylinderGeometry(.05, .055, .08, 10),
  wing: new THREE.CircleGeometry(.3, 24), cape: new THREE.PlaneGeometry(.42, .62, 4, 6), hood: new THREE.SphereGeometry(.2, 16, 12, 0, Math.PI * 2, Math.PI * .3, Math.PI * .5)
};
// (TypeScript, r86) the body's shapes, and the shop clothes' and dragon wing's added below
const B: typeof bParts & { strap?: THREE.BufferGeometry, boot?: THREE.BufferGeometry, stripe?: THREE.BufferGeometry, dwing?: THREE.BufferGeometry, dwingL?: THREE.BufferGeometry } = bParts;
function V2(x, y) { return new THREE.Vector2(x, y); }
B.cape.translate(0, -.31, 0);
// (round S) shapes for the shop's clothes (shoe strap, boot, stripes, dragon wing)
Object.assign(B, { strap: new THREE.TorusGeometry(.055, .014, 6, 14), boot: new THREE.CylinderGeometry(.08, .075, .2, 12), stripe: new THREE.TorusGeometry(.16, .014, 6, 24) });
B.dwing = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(.42, .3); s.lineTo(.36, .02); s.lineTo(.44, -.12); s.lineTo(.26, -.08); s.lineTo(.22, -.24); s.closePath(); return new THREE.ShapeGeometry(s); })();
B.dwingL = B.dwing.clone().scale(-1, 1, 1); // (the left one, mirrored)
// necklaces sit round the neck and fall on the chest (torso coordinates: the neck is at y 1.08, the chest's front at z .14)
function neckParts(it) {
  const c = it.color, t = it.trim || it.color, ring = (r, k, n, col) => Array.from({ length: n }, (_, i) => { const a = Math.PI * (.15 + .7 * i / (n - 1)); return P(new THREE.SphereGeometry(r, 8, 6), typeof col === 'function' ? col(i) : col, [Math.cos(a) * .135 * k, 1.03 - Math.sin(a) * .07 * k, Math.sin(a) * .125 * k + .015]); });
  if (it.shape === 'beads') return ring(.022, 1, 11, c);
  if (it.shape === 'lei') return ring(.036, 1.05, 9, i => i % 2 ? t : c);
  if (it.shape === 'scarf') return [P(new THREE.TorusGeometry(.12, .045, 8, 18), c, [0, 1.03, 0], [Math.PI / 2, 0, 0], [1, .85, 1]), P(new THREE.BoxGeometry(.07, .2, .03), c, [.06, .92, .13], [0, 0, .15]), P(new THREE.BoxGeometry(.072, .02, .032), t, [.06, .86, .131], [0, 0, .15])];
  const chain = ring(.012, 1, 15, it.shape === 'medal' ? t : c);
  if (it.shape === 'medal') return [...chain, P(new THREE.CylinderGeometry(.05, .05, .015, 16), c, [0, .9, .145], [Math.PI / 2, 0, 0]), P(new THREE.BoxGeometry(.03, .06, .01), t, [0, .96, .14])];
  return [...chain, P(new THREE.SphereGeometry(.025, 8, 6), t, [-.017, .925, .145]), P(new THREE.SphereGeometry(.025, 8, 6), t, [.017, .925, .145]), P(new THREE.ConeGeometry(.035, .045, 8), t, [0, .9, .145], [Math.PI, 0, 0])]; // a heart locket
}
// the Bug Hunter badge: a round badge in the level's colour (a rainbow ring for the last) with a ladybird on it
const BADGE_COL = { lb1: '#c98a4a', lb2: '#c9d1d9', lb3: '#ffcf3a', lb4: '#ffffff' };
function badgeParts(id) {
  const x = .075, y = .86, z = .15, out = [P(new THREE.CylinderGeometry(.055, .055, .012, 18), BADGE_COL[id], [x, y, z], [Math.PI / 2, 0, 0])];
  if (id === 'lb4') ['#e8433a', '#ffb03a', '#ffd23f', '#5fd36a', '#3cc7e8', '#a66bff'].forEach((c, i) => out.push(P(new THREE.TorusGeometry(.05 - i * .002, .006, 4, 18, Math.PI / 3), c, [x, y, z + .007], [0, 0, i * Math.PI / 3])));
  out.push(P(new THREE.SphereGeometry(.03, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#e8332a', [x, y - .004, z + .006], [Math.PI / 2, 0, 0], [1, .55, 1.1]), P(new THREE.SphereGeometry(.014, 8, 6), '#2b2238', [x, y + .028, z + .008]));
  [[-.012, .006], [.012, .006], [-.01, -.014], [.01, -.014]].forEach(([dx, dy]) => out.push(P(new THREE.SphereGeometry(.006, 6, 4), '#2b2238', [x + dx, y + dy, z + .022])));
  return out;
}
// a little backpack or a turtle shell on the back
function backParts(it) {
  const c = it.color, t = it.trim || '#ffffff';
  // (the dome is turned to face backwards, and P scales before it turns: the dome's own y is its depth, its z the height)
  if (it.shape === 'shell') return [P(new THREE.SphereGeometry(.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), c, [0, .82, -.14], [-Math.PI / 2, 0, 0], [1.05, .75, 1.25]), P(new THREE.TorusGeometry(.2, .02, 6, 20), t, [0, .82, -.14], [0, 0, 0], [1.05, 1.25, 1]),
    // the plates sit on the dome (an ellipsoid .21 wide, .25 tall, .15 deep)
    ...[[0, .9], [-.08, .78], [.08, .78], [0, .68]].map(([x, y]) => P(new THREE.CylinderGeometry(.04, .04, .02, 6), t, [x, y, -.14 - .15 * Math.sqrt(Math.max(0, 1 - (x / .21) ** 2 - ((y - .82) / .25) ** 2)) - .005], [Math.PI / 2, 0, 0]))];
  return [P(new THREE.BoxGeometry(.26, .3, .13), c, [0, .82, -.2]), P(new THREE.BoxGeometry(.27, .1, .14), t, [0, .94, -.2]), P(new THREE.BoxGeometry(.16, .1, .04), t, [0, .74, -.275]),
    ...[-1, 1].map(s => P(new THREE.BoxGeometry(.03, .3, .03), c, [s * .09, .88, .02], [-.15, 0, 0]))];
}
// the shop's new hats (head coordinates: the head is built at radius .5)
const HAT_PARTS = {
  beanie: it => [P(new THREE.SphereGeometry(.56, 20, 12, 0, Math.PI * 2, 0, Math.PI * .5), it.color, [0, .06, -.02]), P(new THREE.TorusGeometry(.53, .06, 8, 24), it.trim, [0, .1, -.02], [Math.PI / 2 - .1, 0, 0]), P(new THREE.SphereGeometry(.12, 10, 8), it.trim, [0, .66, -.04])],
  bucket: it => [P(new THREE.CylinderGeometry(.4, .47, .3, 20), it.color, [0, .5, -.02]), P(new THREE.CylinderGeometry(.6, .72, .07, 22), it.color, [0, .35, -.02]), P(new THREE.CylinderGeometry(.475, .48, .05, 20), '#3a5a2a', [0, .4, -.02])],
  dino: it => [P(new THREE.SphereGeometry(.58, 20, 12, 0, Math.PI * 2, 0, Math.PI * .55), it.color, [0, .02, -.04], [-.25, 0, 0]), ...[0, 1, 2, 3, 4].map(i => P(new THREE.ConeGeometry(.08, .2, 6), it.trim, [0, .58 - i * i * .025, .25 - i * .19], [-.35 * i + .2, 0, 0]))],
  sunhat: it => [P(new THREE.CylinderGeometry(.8, .84, .04, 26), it.color, [0, .42, 0]), P(new THREE.CylinderGeometry(.34, .4, .26, 20), it.color, [0, .56, 0]), P(new THREE.CylinderGeometry(.405, .41, .07, 20), it.trim, [0, .47, 0]), P(new THREE.SphereGeometry(.08, 8, 6), it.trim, [.36, .48, .18])],
  // (a band round the front of the head just outside the hair (radius .46), tipped down at the front onto the hairline,
  // with five points standing on it and a jewel in the middle)
  tiara: it => { const r = .46, tip = .3, c = [0, .42, -.03], on = a => [Math.sin(a) * r, c[1] - Math.cos(a) * r * Math.sin(tip), c[2] + Math.cos(a) * r * Math.cos(tip)];
    return [P(new THREE.TorusGeometry(r, .03, 6, 26, Math.PI), it.color, c, [Math.PI / 2 + tip, 0, 0]),
      ...[-2, -1, 0, 1, 2].map(i => { const [x, y, z] = on(i * .42), hgt = i ? .15 : .24; return P(new THREE.ConeGeometry(.05, hgt, 6), it.color, [x, y + hgt / 2, z]); }),
      P(new THREE.OctahedronGeometry(.065), it.trim, (([x, y, z]) => [x, y + .06, z + .03])(on(0)))]; },
  // (owner, 12 Oct: tester rewards) the bug hunter's hat: a deerstalker-like cap with a magnifying glass on the brim
  sleuth: it => [P(new THREE.SphereGeometry(.55, 20, 12, 0, Math.PI * 2, 0, Math.PI * .5), it.color, [0, .1, -.02]), P(new THREE.BoxGeometry(.5, .05, .3), it.color, [0, .28, .52], [.25, 0, 0]),
    P(new THREE.TorusGeometry(.11, .025, 6, 18), '#5a4a3a', [.3, .45, .46]), P(new THREE.CircleGeometry(.1, 16), it.trim, [.3, .45, .47]), P(new THREE.BoxGeometry(.04, .16, .04), '#5a4a3a', [.38, .33, .46], [0, 0, .6])],
  catears: it => [P(new THREE.TorusGeometry(.47, .025, 6, 24, Math.PI), it.color, [0, .25, -.05], [0, 0, 0]), ...[-1, 1].flatMap(s => [P(new THREE.ConeGeometry(.13, .26, 4), it.color, [s * .3, .6, -.05], [0, Math.PI / 4, -s * .3]), P(new THREE.ConeGeometry(.07, .16, 4), it.trim, [s * .3, .58, .0], [0, Math.PI / 4, -s * .3])])]
};
const STYLE_LEGS = { dress: 'skin', shirt: 'shorts', aodai: 'pants:#ffffff', tunic: 'pants:#7a5236', overalls: 'pants', hoodie: 'pants:#3a5a8a' };
// (round S, owner plan 8 Oct) clothes from the shop (js/content/shop.js): a top takes the place of the outfit's own top
const TOP_STYLE = { tee: 'shirt', hoodie: 'hoodie', aodai: 'aodai', tunic: 'tunic', overalls: 'overalls', dress: 'dress' };

/** a person: the parts the animation turns, the face, and the far "still" copy (made when first needed) */
export type SvAvatar = { root: THREE.Group, rig: THREE.Group, skinMat: THREE.Material & { color: THREE.Color }, look: Record<string, string | number | boolean | undefined>,
  torso?: THREE.Group, head?: THREE.Group, legL?: THREE.Group, legR?: THREE.Group, armL?: THREE.Group, armR?: THREE.Group, glider?: THREE.Object3D,
  wings?: THREE.Group[], cape?: THREE.Mesh, faceMat?: THREE.MeshStandardMaterial, faceLegacy?: string, outlines?: unknown, skinParts?: { g: THREE.BufferGeometry, ranges: number[][] }[],
  still?: THREE.Group, stillLine?: THREE.Mesh, _still?: boolean, _ol?: boolean, anim?: (state: string, t: number, speed?: number) => void };
export function buildAvatar(look, photo?) {
  const root = new THREE.Group(), rig = new THREE.Group(); root.add(rig); root.userData.avatar = true;
  const shadow = blobShadow(); root.add(shadow); shadow.position.y = .03; shadow.scale.setScalar(.65);
  const W = wearing(look), bot = W.bottom, ft = W.feet; // (round S) shop clothes: each piece one merged shape
  const style = W.top ? TOP_STYLE[W.top.shape] || 'shirt' : look.style || 'shirt', col = W.top ? W.top.color : look.color || '#3b6fe0';
  const skin = toon(look.skin, { roughness: .6 }), hairM = toon(look.hair, { roughness: .45, metalness: .05 }), cloth = toon(col, { roughness: .92 });
  const white = toon('#ffffff', { roughness: .9 }), shoeM = toon(ft ? ft.color : look.shoe || '#7a4a35', { roughness: .45 }), soleM = toon('#fff8ee');
  const trim = toon(style === 'aodai' ? '#ffd84a' : '#f2d16b', { roughness: .7 });
  const A: SvAvatar = { root, rig, skinMat: skin, look };
  // legs (pivot at the hip)
  const legSpec = bot ? (bot.shape === 'shorts' ? 'shorts' : bot.shape === 'skirt' ? 'skin' : 'pants:' + bot.color) : STYLE_LEGS[style] || 'skin';
  const shortsCol = bot && bot.shape === 'shorts' ? bot.color : null;
  const legMat = legSpec === 'skin' ? skin : legSpec === 'shorts' ? skin : legSpec === 'pants' ? cloth : toon(legSpec.split(':')[1], { roughness: .9 });
  const mkLeg = sx => {
    const g = new THREE.Group(); g.position.set(sx, .6, 0);
    const l = new THREE.Mesh(legSpec.startsWith('pants') ? B.pants : B.leg, legMat); l.position.y = -.28; g.add(l);
    if (legSpec === 'shorts') { const sh = new THREE.Mesh(B.shorts, toon(shortsCol || (col === '#ffffff' ? '#3a5a8a' : '#2f3a5a'), { roughness: .9 })); sh.position.y = -.08; g.add(sh); }
    const sandal = ft && ft.shape === 'sandal'; // (round S) sandals: bare toes on a coloured sole with a strap; boots come up the leg
    const s = new THREE.Mesh(B.shoe, sandal ? skin : shoeM); s.rotation.x = Math.PI / 2; s.position.set(0, -.54, .05); if (sandal) s.scale.set(.9, .95, .8); g.add(s); const so = new THREE.Mesh(B.sole, sandal ? shoeM : soleM); so.rotation.x = Math.PI / 2; so.scale.set(1, 1, .45); so.position.set(0, -.585, .05); g.add(so);
    if (sandal) { const st = new THREE.Mesh(B.strap, shoeM); st.rotation.x = Math.PI / 2; st.position.set(0, -.53, .07); g.add(st); }
    if (ft && ft.shape === 'boot') { const bt = new THREE.Mesh(B.boot, shoeM); bt.position.set(0, -.45, 0); g.add(bt); }
    rig.add(g); return g;
  };
  A.legL = mkLeg(.08); A.legR = mkLeg(-.08);
  // body
  const torso = new THREE.Group(); rig.add(torso); A.torso = torso;
  const top = style === 'overalls' ? white : cloth;
  const t = new THREE.Mesh(B.torso, top); t.scale.set(1.12, 1, .82); torso.add(t);
  const hips = new THREE.Mesh(B.hips, bot && bot.shape !== 'shorts' && style !== 'dress' && style !== 'aodai' ? toon(bot.color, { roughness: .9 }) : style === 'dress' || style === 'aodai' ? cloth : legSpec === 'shorts' ? toon(shortsCol || '#2f3a5a', { roughness: .9 }) : legMat); hips.position.y = .6; hips.scale.set(1.05, 1, .85); torso.add(hips);
  if (style === 'dress') { const sk = new THREE.Mesh(B.skirt, cloth); sk.position.y = .5; torso.add(sk); const band = new THREE.Mesh(new THREE.TorusGeometry(.15, .018, 6, 24), white); band.rotation.x = Math.PI / 2; band.position.y = .68; torso.add(band); }
  if (style === 'aodai') { const ad = new THREE.Mesh(B.aodai, cloth); ad.position.y = .42; ad.scale.z = .75; torso.add(ad); const c = new THREE.Mesh(new THREE.CylinderGeometry(.055, .06, .06, 12), cloth); c.position.y = 1.06; torso.add(c); for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.012, 6, 5), trim); b.position.set(.04 + i * .025, 1.0 - i * .07, .13); torso.add(b); } }
  if (style === 'tunic') { const tu = new THREE.Mesh(B.tunic, cloth); tu.position.y = .52; torso.add(tu); const belt = new THREE.Mesh(new THREE.TorusGeometry(.162, .022, 6, 24), toon('#6a4026', { roughness: .5 })); belt.rotation.x = Math.PI / 2; belt.position.y = .66; belt.scale.z = .84; torso.add(belt); }
  if (style === 'overalls') { const bib = new THREE.Mesh(new THREE.BoxGeometry(.2, .2, .03), cloth); bib.position.set(0, .78, .125); torso.add(bib); [.07, -.07].forEach(x => { const st = new THREE.Mesh(new THREE.BoxGeometry(.03, .28, .03), cloth); st.position.set(x, .9, .1); st.rotation.x = -.25; torso.add(st); }); }
  if (style === 'hoodie') { const hd = new THREE.Mesh(B.hood, cloth); hd.position.set(0, 1.02, -.12); hd.rotation.x = 2.2; torso.add(hd); const pk = new THREE.Mesh(new THREE.BoxGeometry(.16, .07, .02), cloth); pk.position.set(0, .7, .13); torso.add(pk); }
  if (bot && bot.shape === 'skirt' && style !== 'dress') { const sk = new THREE.Mesh(B.skirt, toon(bot.color, { roughness: .8 })); sk.position.y = .5; if (bot.id === 'tutu') sk.scale.set(1.25, .6, 1.25), sk.position.y = .56; torso.add(sk); }
  if (W.top && W.top.trim) torso.add(new THREE.Mesh(merge([.72, .8, .88].map(y => P(B.stripe, W.top.trim, [0, y, 0], [Math.PI / 2, 0, 0], [1.12, .84, 1])).concat(W.top.shape === 'dress' ? [P(B.stripe, W.top.trim, [0, .34, 0], [Math.PI / 2, 0, 0], [2.1, 2.1, 1])] : [])), toonSmooth()));
  const neck = new THREE.Mesh(B.neck, skin); neck.position.y = 1.08; torso.add(neck);
  if (W.neck) torso.add(new THREE.Mesh(merge(neckParts(W.neck)), toonSmooth()));
  // (owner, 12 Oct: tester rewards) a tester's Bug Hunter badge on the chest (look.badge: lb1 to lb4), seen by friends too
  if (/^lb[1-4]$/.test(look.badge || '')) torso.add(new THREE.Mesh(merge(badgeParts(look.badge)), toonSmooth()));
  // arms (pivot at the shoulder)
  const longSleeve = style === 'hoodie' || style === 'aodai' || style === 'tunic';
  const mkArm = sx => {
    const g = new THREE.Group(); g.position.set(sx * .2, .99, 0);
    const a = new THREE.Mesh(B.upperArm, longSleeve ? (style === 'overalls' ? white : cloth) : skin); a.position.y = -.2; g.add(a);
    if (!longSleeve) { const sl = new THREE.Mesh(B.sleeve, top); sl.position.y = -.06; g.add(sl); }
    const h = new THREE.Mesh(B.hand, skin); h.scale.set(.85, 1, .7); h.position.y = -.42; g.add(h);
    g.rotation.z = sx * .12; torso.add(g); return g;
  };
  A.armL = mkArm(1); A.armR = mkArm(-1);
  // back accessories
  const bk = W.back; // (round S) the shop's backs: butterfly and dragon wings flap like the fairy wings
  if (look.back === 'wings' || (bk && (bk.shape === 'wings' || bk.shape === 'dragonwings'))) {
    const dragon = bk && bk.shape === 'dragonwings', wc = bk ? bk.color : '#e9d6ff';
    const wm = dragon ? toon(wc, { side: THREE.DoubleSide, roughness: .6 }) : new THREE.MeshStandardMaterial({ color: wc, emissive: bk && bk.id !== 'wings' ? wc : '#7a5aa8', emissiveIntensity: .25, transparent: true, opacity: .72, side: THREE.DoubleSide, roughness: .2, metalness: .1 });
    A.wings = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * .04, .9, -.13);
      const up = new THREE.Mesh(dragon ? (s > 0 ? B.dwing : B.dwingL) : B.wing, wm); up.scale.set(1, 1.3, 1); up.position.set(s * (dragon ? .04 : .22), .14, 0); up.rotation.z = -s * .5; g.add(up);
      if (!dragon) { const lo = new THREE.Mesh(B.wing, wm); lo.scale.set(.7, .9, 1); lo.position.set(s * .17, -.12, 0); lo.rotation.z = s * .5; g.add(lo); }
      torso.add(g); return g; });
  }
  if (bk && (bk.shape === 'backpack' || bk.shape === 'shell')) torso.add(new THREE.Mesh(merge(backParts(bk)), toonSmooth()));
  if (look.back === 'cape' || (bk && bk.shape === 'cape')) { // (a tester's detective cape is a cape too)
    const cape = new THREE.Mesh(B.cape, toon(bk ? bk.color : '#e8332a', { side: THREE.DoubleSide, roughness: .7 })); cape.position.set(0, 1.0, -.14); cape.rotation.x = .12; torso.add(cape); A.cape = cape;
    const clasp = new THREE.Mesh(new THREE.SphereGeometry(.025, 8, 6), toon('#ffcf3a', { metalness: .6, roughness: .3 })); clasp.position.set(0, 1.0, .12); torso.add(clasp);
  }
  // head (built big, then scaled down)
  const head = new THREE.Group(); head.position.y = 1.33; head.scale.setScalar(HEAD_SCALE); rig.add(head); A.head = head;
  const skull = new THREE.Mesh(G.head, skin); skull.scale.set(.95, 1.04, .98); head.add(skull);
  [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(.11, 10, 8), skin); e.scale.set(.5, 1, .8); e.position.set(s * .48, -.02, 0); head.add(e); });
  A.faceMat = new THREE.MeshStandardMaterial({ map: faceTexture(look, photo), transparent: true, alphaTest: .02, roughness: .62, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const face = new THREE.Mesh(G.face, A.faceMat); head.add(face);
  const hc = new THREE.Mesh(G.hairCap, hairM); hc.rotation.x = -.38; hc.position.set(0, .04, -.05); head.add(hc);
  const back = new THREE.Mesh(G.hairBack, hairM); back.scale.set(1.02, .9, 1.02); back.position.y = .02; head.add(back);
  // soft locks of fringe across the forehead
  for (let i = 0; i < 5; i++) { const a = (i - 2) * .32, l = new THREE.Mesh(G.lock, hairM); l.scale.set(.9, 1.25, .55); l.position.set(Math.sin(a) * .42, .32 - Math.abs(i - 2) * .03, Math.cos(a) * .33); l.rotation.set(-.75, a, (i - 2) * -.25); head.add(l); }
  if (look.hairStyle === 'long') { const hb = new THREE.Mesh(G.hairBack, hairM); hb.scale.set(1.04, 1.6, 1.05); hb.position.y = -.28; head.add(hb); }
  if (look.hairStyle === 'buns') [-1, 1].forEach(s => { const b = new THREE.Mesh(G.bun, hairM); b.scale.set(1, 1.5, 1); b.position.set(s * .5, -.08, -.15); b.rotation.z = s * .3; head.add(b); const tie = new THREE.Mesh(G.tie, toon(col)); tie.position.set(s * .44, .08, -.12); tie.rotation.y = Math.PI / 2; head.add(tie); });
  if (look.hairStyle === 'ponytail') { const pt = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .5, 4, 10), hairM); pt.position.set(0, -.15, -.58); pt.rotation.x = .35; head.add(pt); }
  if (look.hairStyle === 'spiky') for (let i = 0; i < 6; i++) { const sp = new THREE.Mesh(G.spike, hairM); sp.position.set((i - 2.5) * .15, .5, -.06 - Math.abs(i - 2.5) * .04); sp.rotation.set(-.3, 0, (2.5 - i) * .22); head.add(sp); }
  // hats
  const hat = new THREE.Group(); head.add(hat);
  // (r79) the girls' versions of the old shared hats (nonla_g, crown_g, bunny_g) are drawn like the old ones in their own colour
  const hid = BOY_OF[look.hat] || look.hat, hcol = (fallback) => (W.hat && W.hat.color) || fallback;
  if (hid === 'nonla') { const n = new THREE.Mesh(G.nonla, toon(hcol('#ecd9a0'), { roughness: .95 })); n.position.y = .62; hat.add(n); const st = new THREE.Mesh(new THREE.TorusGeometry(.5, .015, 4, 24), toon('#c94a4a')); st.rotation.x = Math.PI / 2; st.position.y = .44; hat.add(st); }
  if (look.hat === 'cap') { const c = new THREE.Mesh(G.cap, toon('#e8434a')); c.position.y = .08; hat.add(c); const b = new THREE.Mesh(G.brim, toon('#e8434a')); b.position.set(0, .24, .42); b.scale.set(1.2, 1, 1.6); hat.add(b); }
  if (hid === 'crown') { const c = new THREE.Mesh(G.crown, toon(hcol('#ffcf3a'), { side: THREE.DoubleSide, metalness: .7, roughness: .25 })); c.position.y = .6; hat.add(c); [0, 1, 2, 3, 4].forEach(i => { const g = new THREE.Mesh(new THREE.OctahedronGeometry(.045), toon(['#e8434a', '#3cc7e8', '#5fd39a'][i % 3], { metalness: .3, roughness: .2 })); g.position.set(Math.cos(i * 1.256) * .28, .62, Math.sin(i * 1.256) * .28); hat.add(g); }); }
  if (hid === 'bunny') [-1, 1].forEach(s => { const e = new THREE.Mesh(G.ear, toon(hcol('#ffffff'))); e.position.set(s * .22, .78, -.05); e.rotation.z = -s * .2; hat.add(e); const inner = new THREE.Mesh(G.ear, toon('#ffb3cf')); inner.scale.set(.55, .85, .5); inner.position.set(s * .22, .78, -.01); inner.rotation.z = -s * .2; hat.add(inner); });
  if (look.hat === 'flower') { for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(G.petal, toon(i % 2 ? '#ff7eb8' : '#ffd1e6')); p.position.set(.36 + Math.cos(i) * .1, .4 + Math.sin(i) * .1, .14); hat.add(p); } const c = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), toon('#ffd23f')); c.position.set(.36, .4, .18); hat.add(c); }
  if (look.hat === 'akubra') { const felt = toon('#8a5a32', { roughness: .9 }); const br = new THREE.Mesh(new THREE.CylinderGeometry(.66, .68, .05, 24), felt); br.position.y = .44; hat.add(br); const cr = new THREE.Mesh(new THREE.CylinderGeometry(.33, .38, .32, 20), felt); cr.position.y = .6; hat.add(cr); const band = new THREE.Mesh(new THREE.CylinderGeometry(.385, .39, .07, 20), toon('#3a2618')); band.position.y = .5; hat.add(band); }
  if (look.hat === 'khanran') { const band = new THREE.Mesh(new THREE.TorusGeometry(.43, .07, 8, 24), toon('#2b2238')); band.rotation.x = Math.PI / 2 - .15; band.position.y = .3; hat.add(band); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, d = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, .06), toon('#ffffff')); d.position.set(Math.cos(a) * .44, .3 + Math.sin(a) * .066, Math.sin(a) * .44); hat.add(d); } [-1, 1].forEach(s => { const tail = new THREE.Mesh(new THREE.BoxGeometry(.08, .28, .03), toon('#2b2238')); tail.position.set(s * .07, .2, -.44); tail.rotation.z = s * .3; hat.add(tail); }); }
  if (look.hat === 'silkcap') { const c = new THREE.Mesh(new THREE.SphereGeometry(.43, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon('#2b2238', { roughness: .5 })); c.position.y = .3; hat.add(c); const rim = new THREE.Mesh(new THREE.TorusGeometry(.42, .03, 6, 24), toon('#c62828')); rim.rotation.x = Math.PI / 2; rim.position.y = .31; hat.add(rim); const k = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), toon('#e8433a')); k.position.y = .76; hat.add(k); }
  if (look.hat === 'pagri') { const cl = toon('#ff9f1a', { roughness: .8 }); for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.36 - i * .07, .1, 8, 20), cl); r.rotation.x = Math.PI / 2; r.position.y = .42 + i * .12; hat.add(r); } const top = new THREE.Mesh(new THREE.SphereGeometry(.24, 12, 8), cl); top.position.y = .62; top.scale.y = .6; hat.add(top); const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.06), toon('#3cc7e8', { metalness: .3, roughness: .2 })); gem.position.set(0, .52, .4); hat.add(gem); }
  if (look.hat === 'bow') { const bm = toon(col === '#ffffff' ? '#ff5fa2' : col, { roughness: .5 }); [-1, 1].forEach(s => { const l = new THREE.Mesh(new THREE.ConeGeometry(.16, .3, 12), bm); l.rotation.z = s * Math.PI / 2; l.position.set(s * .16, .55, -.05); hat.add(l); }); const k = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), bm); k.position.set(0, .55, -.05); hat.add(k); }
  const nh = W.hat && HAT_PARTS[W.hat.shape]; if (nh) hat.add(new THREE.Mesh(merge(nh(W.hat)), toonSmooth())); // (round S) the shop's new hats
  // glider (hidden until gliding)
  const glider = new THREE.Group(); glider.visible = false; glider.position.y = 2.05;
  const gm = new THREE.Mesh(G.glider, toon(GLIDERS[look.glider || 0], { side: THREE.DoubleSide, roughness: .8 })); gm.rotation.x = -Math.PI / 2 + .25; glider.add(gm);
  [-.45, .45].forEach(x => { const r = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .9, 4), toon('#7a5236')); r.position.set(x, -.42, 0); r.rotation.z = x * .7; glider.add(r); });
  rig.add(glider); A.glider = glider;
  root.traverse(o => { if (o instanceof THREE.Mesh && o !== shadow) { o.castShadow = true; } });
  compact(A); // (battery round) each moving part one shape, before the outlines are made (one outline each, too)
  A.outlines = outline(rig, .011, '#6a4a3a'); OUTLINED.push(A);
  A.anim = (state, t, speed) => animate(A, state, t, speed);
  return A;
}

export function animate(A, state, t, speed = 0) {
  const ph = t * (7 + speed * 1.3), sw = Math.sin(ph) * Math.min(1, speed / 4);
  A.rig.rotation.set(0, 0, 0); A.rig.position.y = 0; A.glider.visible = false;
  A.legL.rotation.set(0, 0, 0); A.legR.rotation.set(0, 0, 0); A.armL.rotation.set(0, 0, .12); A.armR.rotation.set(0, 0, -.12);
  A.head.rotation.set(0, 0, 0); A.torso.rotation.set(0, 0, 0);
  if (A.wings) A.wings.forEach((w, i) => { w.rotation.y = (i ? -1 : 1) * (.3 + Math.sin(t * (state === 'glide' || state === 'air' ? 14 : 3)) * .25); });
  if (A.cape) A.cape.rotation.x = .12 + Math.min(.9, speed * .07) + Math.sin(t * 6) * .04;
  switch (state) {
    case 'walk':
      A.legL.rotation.x = sw * .75; A.legR.rotation.x = -sw * .75; A.armL.rotation.x = -sw * .65; A.armR.rotation.x = sw * .65;
      A.rig.position.y = Math.abs(Math.sin(ph)) * .04 * Math.min(1, speed / 4); A.torso.rotation.x = Math.min(.12, speed * .012); A.torso.rotation.y = sw * .08;
      break;
    case 'air': A.legL.rotation.x = .6; A.legR.rotation.x = -.2; A.armL.rotation.z = 1.3; A.armR.rotation.z = -1.3; break;
    case 'glide': A.glider.visible = true; A.armL.rotation.z = 2.8; A.armR.rotation.z = -2.8; A.legL.rotation.x = .25; A.legR.rotation.x = .1; A.rig.rotation.x = .12; A.rig.position.y = Math.sin(t * 2) * .04; break;
    case 'swim': A.rig.rotation.x = 1.15; A.rig.position.y = -.55; A.armL.rotation.x = Math.sin(t * 5) * 1.6; A.armR.rotation.x = -Math.sin(t * 5) * 1.6; A.legL.rotation.x = Math.sin(t * 8) * .4; A.legR.rotation.x = -Math.sin(t * 8) * .4; break;
    case 'climb': A.armL.rotation.x = -2.7 + Math.sin(t * 6) * .4; A.armR.rotation.x = -2.7 - Math.sin(t * 6) * .4; A.legL.rotation.x = Math.sin(t * 6) * .4; A.legR.rotation.x = -Math.sin(t * 6) * .4; break;
    case 'sit': A.legL.rotation.set(-1.45, 0, .08); A.legR.rotation.set(-1.45, 0, -.08); A.armL.rotation.set(-.55, 0, .2); A.armR.rotation.set(-.55, 0, -.2); break;   // (round R: a passenger seat, a bench)
    case 'ride': A.legL.rotation.set(-1.3, 0, .55); A.legR.rotation.set(-1.3, 0, -.55); A.rig.position.y = Math.abs(Math.sin(t * 7)) * .05 * Math.min(1, speed / 3); A.armL.rotation.x = -.7; A.armR.rotation.x = -.7; break;
    case 'cheer': A.armL.rotation.z = 2.8 + Math.sin(t * 10) * .2; A.armR.rotation.z = -2.8 - Math.sin(t * 10) * .2; A.rig.position.y = Math.abs(Math.sin(t * 8)) * .18; break;
    case 'wave': A.armR.rotation.z = -2.6 + Math.sin(t * 10) * .35; A.head.rotation.z = Math.sin(t * 3) * .1; break;
    case 'dance': {
      const b = t * 8.4;
      A.rig.position.y = Math.abs(Math.sin(b)) * .1; A.torso.rotation.y = Math.sin(b / 2) * .4; A.head.rotation.z = Math.sin(b / 2) * .18;
      A.armL.rotation.z = 1.6 + Math.sin(b) * .9; A.armR.rotation.z = -1.6 + Math.sin(b + 1.5) * .9; A.legL.rotation.x = Math.max(0, Math.sin(b)) * .5; A.legR.rotation.x = Math.max(0, -Math.sin(b)) * .5;
      break;
    }
    default: A.rig.position.y = Math.sin(t * 2) * .008; A.armL.rotation.z = .12 + Math.sin(t * 2) * .03; A.armR.rotation.z = -.12 - Math.sin(t * 2) * .03; A.head.rotation.y = Math.sin(t * .7) * .15;
  }
}

// The wise owl guide.
export function buildOwl() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(.9, 20, 16), toon('#a0724a')); body.scale.set(1, 1.2, .9); body.position.y = 1.1; g.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(.65, 16, 12), toon('#f2dcb0')); belly.scale.set(1, 1.2, .6); belly.position.set(0, 1, .45); g.add(belly);
  [-1, 1].forEach(s => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.27, 14, 10), toon('#ffffff')); eye.position.set(s * .3, 1.75, .62); g.add(eye);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), toon('#2b1a2e')); pu.position.set(s * .3, 1.75, .85); g.add(pu);
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(.15, .45, 5), toon('#7a5236')); tuft.position.set(s * .55, 2.35, 0); tuft.rotation.z = -s * .4; g.add(tuft);
    const wing = new THREE.Mesh(new THREE.SphereGeometry(.4, 12, 10), toon('#7a5236')); wing.scale.set(.4, 1, .8); wing.position.set(s * .85, 1.1, 0); g.add(wing);
  });
  const beak = new THREE.Mesh(new THREE.ConeGeometry(.12, .3, 6), toon('#ffb52e')); beak.rotation.x = Math.PI / 2; beak.position.set(0, 1.5, .9); g.add(beak);
  const glasses = new THREE.Mesh(new THREE.TorusGeometry(.3, .03, 6, 20), toon('#3a2a20')); glasses.position.set(.3, 1.75, .66); g.add(glasses);
  const g2 = glasses.clone(); g2.position.x = -.3; g.add(g2);
  compactRigidGuide(g);
  const sh = blobShadow(); sh.scale.setScalar(1.6); g.add(sh);
  return g;
}

// These guides sway as a whole. Their opaque pieces share lighting; one coloured mesh keeps the same triangles.
// The shadow is added afterwards so the film builders can still remove the last child.
function compactRigidGuide(root: THREE.Group) {
  root.updateMatrixWorld(true);
  const parts: { m: THREE.Mesh<THREE.BufferGeometry, THREE.MeshToonMaterial>; c: THREE.Color }[] = [];
  for (const child of root.children) {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshToonMaterial && !child.material.transparent && !child.material.map) parts.push({ m: child, c: child.material.color });
  }
  if (parts.length < 2) return;
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const one = new THREE.Mesh(bake(parts, inv, true), compactMat(THREE.FrontSide));
  parts.forEach(({m}) => root.remove(m)); root.add(one);
}

// A gourd-shaped collector who loves Leafies.
export function buildGourd() {
  const g = new THREE.Group();
  const lo = new THREE.Mesh(new THREE.SphereGeometry(.9, 18, 14), toon('#e2b84a')); lo.position.y = .9; g.add(lo);
  const hi = new THREE.Mesh(new THREE.SphereGeometry(.6, 18, 14), toon('#e8c45a')); hi.position.y = 2.1; g.add(hi);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, .4, 6), toon('#6a8a3a')); stem.position.y = 2.8; g.add(stem);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(.25, 8, 6), toon('#5fbf4a')); leaf.scale.set(1.4, .3, .8); leaf.position.set(.25, 2.9, 0); g.add(leaf);
  [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), toon('#2b1a2e')); e.position.set(s * .2, 2.15, .55); g.add(e); });
  const m = new THREE.Mesh(new THREE.TorusGeometry(.12, .03, 6, 12, Math.PI), toon('#a33b52')); m.rotation.z = Math.PI; m.position.set(0, 1.98, .57); g.add(m);
  compactRigidGuide(g);
  const sh = blobShadow(); sh.scale.setScalar(1.8); g.add(sh);
  return g;
}
export const spriteGlow = c => glow(c);

// A grown-up can give any villager a real face (Grown-ups → Character names → 📷). The photo goes on the face and
// the head, ears, hands and legs take the skin colour sampled from the photo, so the edge of the photo blends in.
const NAMED: Record<string, SvAvatar[]> = {}; // villager name -> their avatars
const baseOf = n => String(n).replace(/\s+[^\p{L}\p{N}]+$/u, '').trim();
export function nameAvatar(A, name, remember = true, stableId?) { // remember: false for people in a room that is torn down later
  if (!A || !name) return A; const legacy = baseOf(name), id = stableId || legacy; A.faceLegacy = legacy; if (remember) (NAMED[id] = NAMED[id] || []).push(A);
  const f = familyOwnFace(id) || familyOwnFace(legacy) || (settings.npcFaces || {})[legacy] || customFace(legacy); if (f) setFace(A, f);
  return A;
}
function setFace(A, f) {
  A.faceMat.map = f && f.photo ? faceTexture(A.look, f.photo) : faceTexture(A.look); A.faceMat.needsUpdate = true;
  if (A.skinMat) { A.skinMat.color.set(f && f.skin ? f.skin : A.look.skin); recolorSkin(A); }
  dropStill(A); // (battery round) the skin colour may have changed: a far copy is baked again when next needed
}

// (battery round, owner 12 Oct AEDT, PERF-003) A person is 20 to 30 small parts, each one drawing; people were two
// thirds of the valley's draws. Far from every camera, a person standing still shows a "still" copy instead: every
// plain-coloured part baked, in its present pose, into one shape (its colours kept per corner), plus the face (a picture)
// and anything see-through as they are, and one baked outline. About 3 draws instead of 25; up close nothing changes.
// Baked in the person's own space, so it stands exactly where they stand. js/main.js chooses which copy shows.
let stillMat = null;
const _inv = new THREE.Matrix4(), _mm = new THREE.Matrix4(), _nm = new THREE.Matrix3(), _v = new THREE.Vector3();
const shown = (o, top) => { for (; o && o !== top; o = o.parent) if (!o.visible) return false; return true; };
// (r86, S3: less memory, #355) each part's corners are written once and its triangles kept as an index, as the part
// had them: the same triangles with the same colours and normals, in about a fifth of the memory (people were most of
// the valley's 530 MB of shapes, every triangle's corners written out separately)
function bake(list, inv, withColor) {
  let nv = 0, ni = 0; for (const { m } of list) { const g = m.geometry; nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = withColor ? new Float32Array(nv * 3) : null, tri = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let o = 0, q = 0;
  for (const { m, c } of list) {
    const g = m.geometry, P = g.attributes.position, N = g.attributes.normal, C = g.attributes.color, idx = g.index, o0 = o;
    _mm.multiplyMatrices(inv, m.matrixWorld); _nm.getNormalMatrix(_mm);
    if (idx) for (let k = 0; k < idx.count; k++) tri[q++] = o0 + idx.getX(k); else for (let k = 0; k < P.count; k++) tri[q++] = o0 + k;
    // (17 Oct AEDT, PERF-001: about 1.3 s of a tablet's start) plain arrays: the same sums as three.js's
    // Vector3.applyMatrix4, applyMatrix3 and normalize, in the same order, straight on the numbers (same results)
    const plain = A => A && !A.isInterleavedBufferAttribute && !A.normalized && A.itemSize === 3;
    if (plain(P) && plain(N) && (!col || c || plain(C))) {
      const pa = P.array, na = N.array, ca = C && C.array, e = _mm.elements, q3 = _nm.elements;
      for (let k = 0; k < P.count; k++, o++) {
        const i = k * 3, x = pa[i], y = pa[i + 1], z = pa[i + 2], w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
        pos[o * 3] = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w; pos[o * 3 + 1] = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w; pos[o * 3 + 2] = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
        const a = na[i], b = na[i + 1], d = na[i + 2], nx = q3[0] * a + q3[3] * b + q3[6] * d, ny = q3[1] * a + q3[4] * b + q3[7] * d, nz = q3[2] * a + q3[5] * b + q3[8] * d, s = 1 / (Math.sqrt(nx * nx + ny * ny + nz * nz) || 1);
        nor[o * 3] = nx * s; nor[o * 3 + 1] = ny * s; nor[o * 3 + 2] = nz * s;
        if (col) { if (c) { col[o * 3] = c.r; col[o * 3 + 1] = c.g; col[o * 3 + 2] = c.b; } else { col[o * 3] = ca[i]; col[o * 3 + 1] = ca[i + 1]; col[o * 3 + 2] = ca[i + 2]; } }
      }
      continue;
    }
    for (let k = 0; k < P.count; k++, o++) {
      _v.fromBufferAttribute(P, k).applyMatrix4(_mm); pos[o * 3] = _v.x; pos[o * 3 + 1] = _v.y; pos[o * 3 + 2] = _v.z;
      _v.fromBufferAttribute(N, k).applyMatrix3(_nm).normalize(); nor[o * 3] = _v.x; nor[o * 3 + 1] = _v.y; nor[o * 3 + 2] = _v.z;
      if (col) { if (c) { col[o * 3] = c.r; col[o * 3 + 1] = c.g; col[o * 3 + 2] = c.b; } else { col[o * 3] = C.getX(k); col[o * 3 + 1] = C.getY(k); col[o * 3 + 2] = C.getZ(k); } }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (col) g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(new THREE.BufferAttribute(tri, 1));
  g.computeBoundingSphere(); return g;
}
export function stillOf(A) {
  if (A.still) return A.still;
  if (!stillMat) { stillMat = toonSmooth({ side: THREE.DoubleSide }); stillMat.userData.shared = true; }
  A.root.updateMatrixWorld(true); _inv.copy(A.root.matrixWorld).invert();
  const solid = [], lines = [], keep = [], still = new THREE.Group(); still.userData.still = true;
  A.rig.traverse(m => {
    if (!m.isMesh || !shown(m, A.root) || !m.geometry.attributes.normal) return;
    if (m.userData.outline) { lines.push({ m }); return; }
    const mt = m.material;
    if (Array.isArray(mt) || mt.transparent || mt.map) { keep.push(m); return; }
    if (mt.vertexColors && m.geometry.attributes.color) solid.push({ m, c: null });
    else if (mt.color) solid.push({ m, c: mt.color });
    else keep.push(m);
  });
  if (solid.length) { const one = new THREE.Mesh(bake(solid, _inv, true), stillMat); one.castShadow = true; still.add(one); }
  for (const m of keep) { const c = new THREE.Mesh(m.geometry, m.material); _mm.multiplyMatrices(_inv, m.matrixWorld); _mm.decompose(c.position, c.quaternion, c.scale); c.renderOrder = m.renderOrder; still.add(c); }
  if (lines.length) { const ol = new THREE.Mesh(bake(lines, _inv, false), lines[0].m.material); ol.userData.outline = true; ol.visible = A._ol !== false; still.add(ol); A.stillLine = ol; }
  still.traverse(o => { o.raycast = () => { }; });
  still.visible = false; A.root.add(still); A.still = still; A.root.userData.still = still; // (js/main.js far-culling hides it with the person)
  return still;
}
// (battery round, PERF-003) Up close too: the plain-coloured parts that move together (the head with its hair and hat,
// each arm with its sleeve and hand, each leg with its shoe, the body with its clothes) become one shape each, their
// colours kept per corner, so a person is about 8 shapes (and 8 outlines) instead of 25. Nothing moves differently:
// each part stays in the same group the animation turns. The skin's parts remember where they are, so a photo face's
// skin colour (setFace) still colours them.
const compactMats = {};
const compactMat = side => compactMats[side] || (compactMats[side] = Object.assign(toonSmooth({ side }), { userData: { shared: true } }));
function compact(A) {
  const nodes = [A.rig, A.torso, A.head, A.legL, A.legR, A.armL, A.armR, A.glider, ...(A.wings || [])];
  A.rig.traverse(o => { if (o.isGroup && !nodes.includes(o)) nodes.push(o); });
  A.skinParts = [];
  for (const N of nodes) {
    const bySide: Record<string, THREE.Mesh<THREE.BufferGeometry, THREE.MeshToonMaterial>[]> = {};
    for (const m of N.children) {
      if (!m.isMesh || m.children.length || m === A.cape || !m.visible) continue;
      const mt = m.material;
      if (Array.isArray(mt) || !mt.isMeshToonMaterial || mt.transparent || mt.map || !m.geometry.attributes.normal) continue;
      if (!mt.vertexColors && !mt.color) continue;
      (bySide[mt.side] = bySide[mt.side] || []).push(m);
    }
    for (const [side, list] of Object.entries(bySide)) {
      if (list.length < 2) continue;
      N.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(N.matrixWorld).invert();
      const ranges = []; let at = 0;
      // (r86: the baked shape keeps each part's corners once, so a skin range counts the part's corners)
      const parts = list.map(m => { const n = m.geometry.attributes.position.count; if (m.material === A.skinMat) ranges.push([at, n]); at += n; return { m, c: m.material.vertexColors && m.geometry.attributes.color ? null : m.material.color }; });
      const one = new THREE.Mesh(bake(parts, inv, true), compactMat(+side)); one.castShadow = true;
      // (r67) an arm keeps an empty marker where each of its parts was (the hand at y -0.42), so a rider's grip can still be found
      if (N === A.armL || N === A.armR) list.forEach(m => { const k = new THREE.Object3D(); k.position.copy(m.position); k.quaternion.copy(m.quaternion); k.userData.part = true; N.add(k); });
      list.forEach(m => N.remove(m)); N.add(one);
      if (ranges.length) A.skinParts.push({ g: one.geometry, ranges });
    }
  }
}
function recolorSkin(A) {
  const c = A.skinMat.color;
  for (const { g, ranges } of A.skinParts || []) { const C = g.attributes.color; for (const [a, n] of ranges) for (let i = a; i < a + n; i++) C.setXYZ(i, c.r, c.g, c.b); C.needsUpdate = true; }
}
// the moving person or the still copy (made the first time it is needed)
export function showStill(A, yes) {
  if (!!A._still === yes) return; A._still = yes;
  if (yes) stillOf(A).visible = true; else if (A.still) A.still.visible = false;
  A.rig.visible = !yes;
}
export function dropStill(A) {
  if (!A.still) return; const was = A._still; showStill(A, false);
  A.still.children.forEach(c => { if (c.material === stillMat || c === A.stillLine) c.geometry.dispose(); });
  A.root.remove(A.still); A.still = null; A.stillLine = null; delete A.root.userData.still; if (was) showStill(A, true);
}
export function applyNpcFaces() { for (const [id, list] of Object.entries(NAMED)) list.forEach(A => setFace(A, familyOwnFace(id) || familyOwnFace(A.faceLegacy || id) || (settings.npcFaces || {})[A.faceLegacy || id] || customFace(A.faceLegacy || id) || null)); }
onFamilyPhotos(() => applyNpcFaces()); // (round R privacy) the family's photo faces arrive after the start, with the family code
export const namedVillagers = () => Object.keys(NAMED);
