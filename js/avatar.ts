// Chibi characters whose face is the child's own photo.
import { THREE, toon, glow, blobShadow, outline, P, merge, toonSmooth } from './gfx.js';
import { GLIDERS, settings, profiles, FRIEND_MIGRATE } from './state.js';
import { customFace, familyOwnFace, onFamilyPhotos } from './custom.js';
import { wearing, BOY_OF } from './content/shop.js';
// (v1.08b friends) the friends' 3D models (js/friend-model.ts) are not in the first download: that file loads when a child
// with a friend is first built, and fills these in; until then the code person in the friend's colours is drawn
// (v1.08b friends) the friends' data (js/content/friends.ts) loads as Who's playing opens, not in the first download:
// it moves every old save once, and from then on a child is drawn as their friend
let friendLook = (l: any) => l;
export const FRIEND_DATA = FRIEND_MIGRATE; // (the loaded file is FRIEND_DATA.lib)
let friendsP: Promise<typeof import('./content/friends.js')> = null;
export const friendsReady = () => friendsP || (friendsP = import('./content/friends.js').then(F => {
  FRIEND_DATA.lib = F; friendLook = F.friendLook; FRIEND_MIGRATE.fn = F.migrateFriend; profiles.forEach(p => F.migrateFriend(p)); return F; }));
export const FRIEND_MODELS: { ready?: (id: string) => boolean, load?: (id: string) => Promise<boolean>, attach?: (A, id: string, skin: string, wear?: { item?: boolean, shoes?: boolean }) => any, faceParts?: (it) => THREE.BufferGeometry[] } = {};
export const loadFriendModels = (id: string): Promise<boolean> => FRIEND_MODELS.load ? FRIEND_MODELS.load(id)
  : import('./friend-model.js').then(m => { Object.assign(FRIEND_MODELS, { ready: m.friendModelReady, load: m.loadFriendModel, attach: m.attachFriendModel, faceParts: m.faceParts }); return m.loadFriendModel(id as any); }).catch(() => false);
const WEAR = <T extends THREE.Object3D>(o: T) => { o.userData.wear = true; return o; }; // (v1.08b) a hat, necklace or back: kept on a friend's model

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
// (v1.08b friends, plan docs/plans/new-friends-characters.md: the villagers in the friends' style) smaller shining eyes set
// a little lower and closer (a warm brown iris, two sparkles, a soft lash), soft round cheeks, and seven moods like the
// friends': smile, 'blink', 'happy' (rainbow eyes, an open smile), 'o' (surprised), 'curious' (one brow up, a small
// round mouth), 'sad' (brows tipped, a small frown) and 'shy' (eyes looking down, rosy cheeks, a little smile).
export function drawFeatures(x, S, look, mood = 'smile') {
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  const ey = .565, dot = (cx, cy, r) => { x.beginPath(); x.arc(cx * S, cy * S, r * S, 0, Math.PI * 2); x.fill(); };
  [.375, .625].forEach(cx => {
    const out = cx < .5 ? -1 : 1;
    if (mood === 'blink' || mood === 'happy' || mood === 'shy') {
      x.strokeStyle = '#2b1a14'; x.lineWidth = S * .022; x.beginPath();
      if (mood === 'happy') { x.moveTo(S * (cx - .065), S * (ey + .02)); x.quadraticCurveTo(S * cx, S * (ey - .055), S * (cx + .065), S * (ey + .02)); }
      else { const dy = mood === 'shy' ? .02 : 0; x.moveTo(S * (cx - .07), S * (ey + dy)); x.quadraticCurveTo(S * cx, S * (ey + dy + .045), S * (cx + .07), S * (ey + dy)); }
      x.stroke();
      if (mood !== 'happy') { x.beginPath(); x.moveTo(S * (cx + out * .07), S * ey); x.lineTo(S * (cx + out * .09), S * (ey - .015)); x.stroke(); }
    } else {
      const big = mood === 'o' ? 1.1 : 1, rx = .074 * big, ry = .07 * big;
      x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx * S, ey * S, S * rx, S * ry, 0, 0, Math.PI * 2); x.fill();
      const lookX = mood === 'curious' ? .012 : 0, g = x.createRadialGradient((cx + lookX) * S, (ey + .024) * S, S * .004, (cx + lookX) * S, (ey + .01) * S, S * .056);
      g.addColorStop(0, '#9a6236'); g.addColorStop(.65, '#5a341c'); g.addColorStop(1, '#2e180c');
      x.fillStyle = g; dot(cx + lookX, ey + .01, .054 * (mood === 'o' ? .85 : 1));
      x.fillStyle = '#120a08'; dot(cx + lookX, ey + .013, .026 * (mood === 'o' ? .8 : 1));
      x.fillStyle = '#fff'; dot(cx + lookX + .021, ey - .014, .018); dot(cx + lookX - .017, ey + .033, .009);
      x.strokeStyle = '#3a2418'; x.lineWidth = S * .016; x.beginPath(); x.ellipse(cx * S, ey * S, S * (rx + .003), S * (ry + .002), 0, Math.PI * 1.08, Math.PI * 1.92); x.stroke();
      x.beginPath(); x.moveTo(S * (cx + out * .072), S * (ey - .024)); x.lineTo(S * (cx + out * .09), S * (ey - .044)); x.stroke();
    }
    // brows: soft, in the hair colour; tipped up in the middle when sad, one raised when curious
    const by = mood === 'o' ? .43 : .455, tip = mood === 'sad' ? -out * .02 : 0, up = mood === 'curious' && out > 0 ? -.025 : 0;
    x.strokeStyle = look.hair; x.lineWidth = S * .02; x.beginPath(); x.moveTo(S * (cx - .055), S * (by + .01 - tip + up)); x.quadraticCurveTo(S * cx, S * (by - .02 + up), S * (cx + .055), S * (by + .01 + tip + up)); x.stroke();
  });
  // soft round cheeks (bigger and rosier when shy or happy)
  const rosy = mood === 'shy' ? .62 : mood === 'happy' ? .55 : .45;
  [.25, .75].forEach(cx => {
    const g = x.createRadialGradient(cx * S, .67 * S, 0, cx * S, .67 * S, .095 * S);
    g.addColorStop(0, `rgba(240,110,120,${rosy})`); g.addColorStop(1, 'rgba(240,110,120,0)');
    x.fillStyle = g; x.fillRect((cx - .1) * S, .57 * S, .2 * S, .2 * S);
  });
  x.fillStyle = '#a3485a'; x.strokeStyle = '#a3485a'; x.lineWidth = S * .016;
  if (mood === 'o') { x.beginPath(); x.ellipse(S * .5, S * .72, S * .026, S * .034, 0, 0, Math.PI * 2); x.fill(); }
  else if (mood === 'curious') { x.beginPath(); x.ellipse(S * .515, S * .715, S * .018, S * .02, 0, 0, Math.PI * 2); x.fill(); }
  else if (mood === 'sad') { x.beginPath(); x.moveTo(S * .455, S * .73); x.quadraticCurveTo(S * .5, S * .695, S * .545, S * .73); x.stroke(); }
  else if (mood === 'happy') {
    x.beginPath(); x.moveTo(S * .44, S * .685); x.quadraticCurveTo(S * .5, S * .78, S * .56, S * .685); x.closePath(); x.fill();
    x.fillStyle = '#ef8a92'; x.beginPath(); x.ellipse(S * .5, S * .74, S * .026, S * .014, 0, 0, Math.PI * 2); x.fill();
  } else { const w = mood === 'shy' ? .035 : .05; x.beginPath(); x.moveTo(S * (.5 - w), S * .69); x.quadraticCurveTo(S * .5, S * .75, S * (.5 + w), S * .69); x.closePath(); x.fill(); }
  x.restore();
}
// Painted faces (no photo) are shared by every villager with the same hair and skin, at 256 px: phones
// (iPhones above all) have a small budget for pictures, and when it runs out new ones come out black.
// (v1.08; v1.08b: seven moods, 3 by 3 on one 512 px picture) The moods are painted side by side on one picture;
// each person gets their own copy of it (same picture, sent to the graphics once) showing their mood's quarter, so a
// blink moves the view and makes no new picture (check longplaymem).
const paintedFaces = {};
// (v1.08b) seven moods on one 512 px picture, 3 by 3 (the last two squares are empty)
export const MOODS = ['smile', 'blink', 'happy', 'o', 'curious', 'sad', 'shy'];
export function setFaceMood(tex: THREE.Texture, mood: string) { const i = Math.max(0, MOODS.indexOf(mood)); tex.offset.set((i % 3) / 3, (2 - Math.floor(i / 3)) / 3); }
export function faceTexture(look, photo?, mood = 'smile') {
  if (!photo) {
    const k = look.hair + look.skin;
    if (!paintedFaces[k]) {
      const S = 512 / 3, c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
      MOODS.forEach((m, i) => { x.save(); x.translate((i % 3) * S, Math.floor(i / 3) * S); x.beginPath(); x.rect(0, 0, S, S); x.clip(); drawFeatures(x, S, look, m); x.restore(); });
      paintedFaces[k] = new THREE.CanvasTexture(c); paintedFaces[k].colorSpace = THREE.SRGBColorSpace;
    }
    const t = paintedFaces[k].clone(); t.repeat.set(1 / 3, 1 / 3); setFaceMood(t, mood); return t;
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
// (v1.08b friends) round pictures of the friends' models in each skin tone, made on this device (js/friend-view.ts)
const PORTRAITS: Record<string, string> = {};
export const setPortrait = (id: string, skin: string, url: string) => { if (url) PORTRAITS[id + skin] = url; };
export function avatarURL(p) {
  // (audit, 9 Oct) the result goes into <img src="…">: only a plain base64 picture or a simple file path of our own
  if (p.photo && (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(p.photo) || /^[\w\/.-]+\.(png|jpe?g|webp)$/i.test(p.photo))) return p.photo;
  const L = friendLook(p.look), k = L.hair + L.skin; // (v1.08b friends) the friend's hair in the child's skin tone
  if (L.friend && PORTRAITS[L.friend + L.skin]) return PORTRAITS[L.friend + L.skin]; // (the model's portrait, once made: js/friend-view.ts)
  if (!avatarCache[k]) { const c = document.createElement('canvas'); c.width = c.height = 160; drawDefaultFace(c.getContext('2d'), 160, L); avatarCache[k] = c.toDataURL(); }
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
  // (v1.08, owner 2 Nov 2026 AEDT: "nhân vật đẹp, có hồn và uyển chuyển hơn", "làm hết, cả dáng người") arms and legs
  // in two parts each, bending at the elbow and the knee; a mitten hand with a thumb
  upperArm: new THREE.CapsuleGeometry(.052, .13, 4, 10), foreArm: new THREE.CapsuleGeometry(.047, .12, 4, 10), hand: new THREE.SphereGeometry(.064, 12, 10), thumb: new THREE.SphereGeometry(.026, 8, 6),
  sleeve: new THREE.CapsuleGeometry(.074, .12, 4, 12),
  thigh: new THREE.CapsuleGeometry(.067, .17, 4, 10), shin: new THREE.CapsuleGeometry(.06, .16, 4, 10),
  pantsThigh: new THREE.CapsuleGeometry(.077, .17, 4, 10), pantsShin: new THREE.CapsuleGeometry(.071, .16, 4, 10), shorts: new THREE.CapsuleGeometry(.08, .1, 4, 10),
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
  still?: THREE.Group, stillLine?: THREE.Mesh, _still?: boolean, _ol?: boolean, anim?: (state: string, t: number, speed?: number) => void,
  // (v1.08) the knees, elbows and swinging hair, and what the animation remembers between frames
  kneeL?: THREE.Group, kneeR?: THREE.Group, elbowL?: THREE.Group, elbowR?: THREE.Group, tail?: THREE.Group, painted?: boolean, life?: AvatarLife,
  model?: import('./friend-model.js').FriendModel, height?: number, late?: boolean, lateFace?: unknown, latePhoto?: unknown, lateThen?: (() => void)[] };
type AvatarLife = { t: number, st: string, chg: number, land: number, ph: number, blink: number, mood: string, seed: number };
export function buildAvatar(look, photo?, opts?: { code?: boolean, into?: SvAvatar }) {
  const friendId = look && look.friend, useModel = !!friendId && !(opts && opts.code) && !!FRIEND_MODELS.ready && FRIEND_MODELS.ready(friendId);
  if (friendId && !useModel && !(opts && opts.code)) loadFriendModels(friendId); // (v1.08b: the next build uses the model)
  look = friendLook(look); // (v1.08b friends) a child is drawn as their friend (Finn, Sol, Clara or Lumi); villagers stay as they are
  const into = opts && opts.into, root = into ? into.root : new THREE.Group(), rig = new THREE.Group(); root.add(rig); root.userData.avatar = true; // (v1.08d valley: into, a stand-in made by lateAvatar)
  const shadow = blobShadow(); root.add(shadow); shadow.position.y = .03; shadow.scale.setScalar(.65);
  const W = wearing(look), bot = W.bottom, ft = W.feet; // (round S) shop clothes: each piece one merged shape
  const style = W.top ? TOP_STYLE[W.top.shape] || 'shirt' : look.style || 'shirt', col = W.top ? W.top.color : look.color || '#3b6fe0';
  const skin = toon(look.skin, { roughness: .6 }), hairM = toon(look.hair, { roughness: .45, metalness: .05 }), cloth = toon(col, { roughness: .92 });
  const white = toon('#ffffff', { roughness: .9 }), shoeM = toon(ft ? ft.color : look.shoe || '#7a4a35', { roughness: .45 }), soleM = toon('#fff8ee');
  const trim = toon(style === 'aodai' ? '#ffd84a' : '#f2d16b', { roughness: .7 });
  const A: SvAvatar = into ? Object.assign(into, { rig, skinMat: skin, look }) : { root, rig, skinMat: skin, look };
  // legs (pivot at the hip)
  const legSpec = look.legs ? 'pants:' + look.legs : bot ? (bot.shape === 'shorts' ? 'shorts' : bot.shape === 'skirt' ? 'skin' : 'pants:' + bot.color) : STYLE_LEGS[style] || 'skin';
  const shortsCol = bot && bot.shape === 'shorts' ? bot.color : null;
  const legMat = legSpec === 'skin' ? skin : legSpec === 'shorts' ? skin : legSpec === 'pants' ? cloth : toon(legSpec.split(':')[1], { roughness: .9 });
  // (v1.08) the thigh turns at the hip, the shin at the knee (y -.27); the shoe is on the shin, so it stays at y -.54
  const mkLeg = sx => {
    const g = new THREE.Group(), pants = legSpec.startsWith('pants'); g.position.set(sx, .6, 0);
    const th = new THREE.Mesh(pants ? B.pantsThigh : B.thigh, legMat); th.position.y = -.12; g.add(th);
    if (legSpec === 'shorts') { const sh = new THREE.Mesh(B.shorts, toon(shortsCol || (col === '#ffffff' ? '#3a5a8a' : '#2f3a5a'), { roughness: .9 })); sh.position.y = -.08; g.add(sh); }
    const knee = new THREE.Group(); knee.position.y = -.27; g.add(knee);
    const sn = new THREE.Mesh(pants ? B.pantsShin : B.shin, legMat); sn.position.y = -.12; knee.add(sn);
    const sandal = ft && ft.shape === 'sandal'; // (round S) sandals: bare toes on a coloured sole with a strap; boots come up the leg
    const s = new THREE.Mesh(B.shoe, sandal ? skin : shoeM); s.rotation.x = Math.PI / 2; s.position.set(0, -.27, .05); if (sandal) s.scale.set(.9, .95, .8); knee.add(s); const so = new THREE.Mesh(B.sole, sandal ? shoeM : soleM); so.rotation.x = Math.PI / 2; so.scale.set(1, 1, .45); so.position.set(0, -.315, .05); knee.add(so);
    if (sandal) { const st = new THREE.Mesh(B.strap, shoeM); st.rotation.x = Math.PI / 2; st.position.set(0, -.26, .07); knee.add(st); }
    if (ft && ft.shape === 'boot') { const bt = new THREE.Mesh(B.boot, shoeM); bt.position.set(0, -.18, 0); knee.add(bt); }
    rig.add(g); return [g, knee];
  };
  [A.legL, A.kneeL] = mkLeg(.08); [A.legR, A.kneeR] = mkLeg(-.08);
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
  if (W.neck) torso.add(WEAR(new THREE.Mesh(merge(neckParts(W.neck)), toonSmooth())));
  // (owner, 12 Oct: tester rewards) a tester's Bug Hunter badge on the chest (look.badge: lb1 to lb4), seen by friends too
  if (/^lb[1-4]$/.test(look.badge || '')) torso.add(WEAR(new THREE.Mesh(merge(badgeParts(look.badge)), toonSmooth())));
  // arms (pivot at the shoulder)
  const longSleeve = style === 'hoodie' || style === 'aodai' || style === 'tunic';
  // (v1.08) the upper arm turns at the shoulder, the forearm at the elbow (y -.2); the hand stays at y -.42 when straight
  const mkArm = sx => {
    const g = new THREE.Group(), armM = longSleeve ? cloth : skin; g.position.set(sx * .2, .99, 0);
    const a = new THREE.Mesh(B.upperArm, armM); a.position.y = -.1; g.add(a);
    if (!longSleeve) { const sl = new THREE.Mesh(B.sleeve, top); sl.position.y = -.06; g.add(sl); }
    const elbow = new THREE.Group(); elbow.position.y = -.2; g.add(elbow);
    const f = new THREE.Mesh(B.foreArm, armM); f.position.y = -.09; elbow.add(f);
    const h = new THREE.Mesh(B.hand, skin); h.scale.set(.85, 1, .7); h.position.y = -.22; elbow.add(h);
    const th = new THREE.Mesh(B.thumb, skin); th.scale.set(1, 1.3, 1); th.position.set(-sx * .045, -.19, .03); th.rotation.z = sx * .5; elbow.add(th);
    g.rotation.z = sx * .12; torso.add(g); return [g, elbow];
  };
  [A.armL, A.elbowL] = mkArm(1); [A.armR, A.elbowR] = mkArm(-1);
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
  if (bk && (bk.shape === 'backpack' || bk.shape === 'shell')) torso.add(WEAR(new THREE.Mesh(merge(backParts(bk)), toonSmooth())));
  if (look.back === 'cape' || (bk && bk.shape === 'cape')) { // (a tester's detective cape is a cape too)
    const cape = new THREE.Mesh(B.cape, toon(bk ? bk.color : '#e8332a', { side: THREE.DoubleSide, roughness: .7 })); cape.position.set(0, 1.0, -.14); cape.rotation.x = .12; torso.add(cape); A.cape = cape;
    const clasp = new THREE.Mesh(new THREE.SphereGeometry(.025, 8, 6), toon('#ffcf3a', { metalness: .6, roughness: .3 })); clasp.position.set(0, 1.0, .12); torso.add(WEAR(clasp));
  }
  // head (built big, then scaled down)
  // (v1.08b friends, WORLD-011) heights: a child 1.6, a grown-up 2.0, a grandparent 1.8 (look.age: 'adult', 'elder' or Studio's 'old'); a
  // grown-up's head is a little smaller for their height, as the gallery's neighbours
  const AGE = { adult: [1.25, .8], elder: [1.125, .86], old: [1.125, .86] }[look.age] || [1, 1]; A.height = AGE[0]; rig.scale.setScalar(AGE[0]);
  const head = new THREE.Group(); head.position.y = 1.33; head.scale.setScalar(HEAD_SCALE * AGE[1]); rig.add(head); A.head = head;
  const skull = new THREE.Mesh(G.head, skin); skull.scale.set(.95, 1.04, .98); head.add(skull);
  [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(.11, 10, 8), skin); e.scale.set(.5, 1, .8); e.position.set(s * .48, -.02, 0); head.add(e); });
  A.painted = !photo; // (v1.08) a painted face blinks and smiles; a photo face stays as it is
  A.faceMat = new THREE.MeshStandardMaterial({ map: faceTexture(look, photo), transparent: true, alphaTest: .02, roughness: .62, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const face = new THREE.Mesh(G.face, A.faceMat); head.add(face);
  const hc = new THREE.Mesh(G.hairCap, hairM); hc.rotation.x = -.38; hc.position.set(0, .04, -.05); head.add(hc);
  const back = new THREE.Mesh(G.hairBack, hairM); back.scale.set(1.02, .9, 1.02); back.position.y = .02; head.add(back);
  // soft locks of fringe across the forehead
  // (v1.08b) felt-look hair: the locks in front a shade lighter than the cap, like the friends' felt hair
  const hairL = toon('#' + new THREE.Color(look.hair).offsetHSL(0, .02, .045).getHexString(), { roughness: .5 });
  for (let i = 0; i < 5; i++) { const a = (i - 2) * .32, l = new THREE.Mesh(G.lock, hairL); l.scale.set(.9, 1.25, .55); l.position.set(Math.sin(a) * .42, .32 - Math.abs(i - 2) * .03, Math.cos(a) * .33); l.rotation.set(-.75, a, (i - 2) * -.25); head.add(l); }
  // (v1.08) long hair and the ponytail hang from their own pivot, so they swing as the child moves
  const hang = (x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); head.add(g); A.tail = g; return g; };
  if (look.hairStyle === 'long') { const hb = new THREE.Mesh(G.hairBack, hairM); hb.scale.set(1.04, 1.6, 1.05); hb.position.y = -.43; hang(0, .15, 0).add(hb); }
  if (look.hairStyle === 'buns') [-1, 1].forEach(s => { const b = new THREE.Mesh(G.bun, hairM); b.scale.set(1, 1.5, 1); b.position.set(s * .5, -.08, -.15); b.rotation.z = s * .3; head.add(b); const tie = new THREE.Mesh(G.tie, toon(col)); tie.position.set(s * .44, .08, -.12); tie.rotation.y = Math.PI / 2; head.add(tie); });
  if (look.hairStyle === 'ponytail') { const pt = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .5, 4, 10), hairM); pt.position.set(0, -.23, -.08); pt.rotation.x = .35; hang(0, .08, -.5).add(pt); }
  if (look.hairStyle === 'spiky') for (let i = 0; i < 6; i++) { const sp = new THREE.Mesh(G.spike, i % 2 ? hairL : hairM); sp.position.set((i - 2.5) * .15, .5, -.06 - Math.abs(i - 2.5) * .04); sp.rotation.set(-.3, 0, (2.5 - i) * .22); head.add(sp); }
  // hats
  const hat = new THREE.Group(); head.add(hat);
  // (r79) the girls' versions of the old shared hats (nonla_g, crown_g, bunny_g) are drawn like the old ones in their own colour
  const hid = BOY_OF[look.hat] || look.hat, hcol = (fallback) => (W.hat && W.hat.color) || fallback;
  if (hid === 'nonla') { const n = new THREE.Mesh(G.nonla, toon(hcol('#ecd9a0'), { roughness: .95 })); n.position.y = .62; hat.add(n); const st = new THREE.Mesh(new THREE.TorusGeometry(.5, .015, 4, 24), toon('#c94a4a')); st.rotation.x = Math.PI / 2; st.position.y = .44; hat.add(st); }
  if (look.hat === 'cap') { const c = new THREE.Mesh(G.cap, toon('#e8434a')); c.position.y = .08; hat.add(c); const b = new THREE.Mesh(G.brim, toon('#e8434a')); b.position.set(0, .24, .42); b.scale.set(1.2, 1, 1.6); hat.add(b); }
  if (hid === 'crown') { const c = new THREE.Mesh(G.crown, toon(hcol('#ffcf3a'), { side: THREE.DoubleSide, metalness: .7, roughness: .25 })); c.position.y = .6; hat.add(c); [0, 1, 2, 3, 4].forEach(i => { const g = new THREE.Mesh(new THREE.OctahedronGeometry(.045), toon(['#e8434a', '#3cc7e8', '#5fd39a'][i % 3], { metalness: .3, roughness: .2 })); g.position.set(Math.cos(i * 1.256) * .28, .62, Math.sin(i * 1.256) * .28); hat.add(g); }); }
  if (hid === 'bunny') [-1, 1].forEach(s => { const e = new THREE.Mesh(G.ear, toon(hcol('#ffffff'))); e.position.set(s * .22, .78, -.05); e.rotation.z = -s * .2; hat.add(e); const inner = new THREE.Mesh(G.ear, toon('#ffb3cf')); inner.scale.set(.55, .85, .5); inner.position.set(s * .22, .78, -.01); inner.rotation.z = -s * .2; hat.add(inner); });
  if (look.hat === 'flower') { for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(G.petal, toon(i % 2 ? '#ff7eb8' : '#ffd1e6')); p.position.set(.36 + Math.cos(i) * .1, .4 + Math.sin(i) * .1, .14); hat.add(p); } const c = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), toon('#ffd23f')); c.position.set(.36, .4, .18); hat.add(c); }
  // (v1.08b story) the install gift's Home hat: a little house with a red roof, a door and a chimney
  if (look.hat === 'homehat') { const wall = new THREE.Mesh(new THREE.BoxGeometry(.5, .3, .44), toon('#ffe8b0')); wall.position.y = .56; hat.add(wall); const roof = new THREE.Mesh(new THREE.ConeGeometry(.44, .3, 4), toon('#e8434a', { roughness: .6 })); roof.rotation.y = Math.PI / 4; roof.position.y = .86; hat.add(roof); const door = new THREE.Mesh(new THREE.BoxGeometry(.12, .17, .02), toon('#8a5a32')); door.position.set(0, .5, .23); hat.add(door); const ch = new THREE.Mesh(new THREE.BoxGeometry(.07, .16, .07), toon('#b5523a')); ch.position.set(.14, .92, -.06); hat.add(ch); }
  if (look.hat === 'akubra') { const felt = toon('#8a5a32', { roughness: .9 }); const br = new THREE.Mesh(new THREE.CylinderGeometry(.66, .68, .05, 24), felt); br.position.y = .44; hat.add(br); const cr = new THREE.Mesh(new THREE.CylinderGeometry(.33, .38, .32, 20), felt); cr.position.y = .6; hat.add(cr); const band = new THREE.Mesh(new THREE.CylinderGeometry(.385, .39, .07, 20), toon('#3a2618')); band.position.y = .5; hat.add(band); }
  if (look.hat === 'khanran') { const band = new THREE.Mesh(new THREE.TorusGeometry(.43, .07, 8, 24), toon('#2b2238')); band.rotation.x = Math.PI / 2 - .15; band.position.y = .3; hat.add(band); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, d = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, .06), toon('#ffffff')); d.position.set(Math.cos(a) * .44, .3 + Math.sin(a) * .066, Math.sin(a) * .44); hat.add(d); } [-1, 1].forEach(s => { const tail = new THREE.Mesh(new THREE.BoxGeometry(.08, .28, .03), toon('#2b2238')); tail.position.set(s * .07, .2, -.44); tail.rotation.z = s * .3; hat.add(tail); }); }
  if (look.hat === 'silkcap') { const c = new THREE.Mesh(new THREE.SphereGeometry(.43, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon('#2b2238', { roughness: .5 })); c.position.y = .3; hat.add(c); const rim = new THREE.Mesh(new THREE.TorusGeometry(.42, .03, 6, 24), toon('#c62828')); rim.rotation.x = Math.PI / 2; rim.position.y = .31; hat.add(rim); const k = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), toon('#e8433a')); k.position.y = .76; hat.add(k); }
  if (look.hat === 'pagri') { const cl = toon('#ff9f1a', { roughness: .8 }); for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.36 - i * .07, .1, 8, 20), cl); r.rotation.x = Math.PI / 2; r.position.y = .42 + i * .12; hat.add(r); } const top = new THREE.Mesh(new THREE.SphereGeometry(.24, 12, 8), cl); top.position.y = .62; top.scale.y = .6; hat.add(top); const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.06), toon('#3cc7e8', { metalness: .3, roughness: .2 })); gem.position.set(0, .52, .4); hat.add(gem); }
  if (look.hat === 'bow') { const bm = toon(col === '#ffffff' ? '#ff5fa2' : col, { roughness: .5 }); [-1, 1].forEach(s => { const l = new THREE.Mesh(new THREE.ConeGeometry(.16, .3, 12), bm); l.rotation.z = s * Math.PI / 2; l.position.set(s * .16, .55, -.05); hat.add(l); }); const k = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), bm); k.position.set(0, .55, -.05); hat.add(k); }
  const nh = W.hat && HAT_PARTS[W.hat.shape]; if (nh) hat.add(new THREE.Mesh(merge(nh(W.hat)), toonSmooth())); // (round S) the shop's new hats
  // (v1.08b friends) glasses and the star mask, on the face in front of the eyes (head coordinates: the eyes at x ±.12, y -.09)
  if (W.face && FRIEND_MODELS.faceParts) head.add(WEAR(new THREE.Mesh(merge(FRIEND_MODELS.faceParts(W.face)), toonSmooth()))); // (drawn by js/friend-model.ts, loaded with the friends)
  else if (W.face) loadFriendModels('');
  // glider (hidden until gliding)
  const glider = new THREE.Group(); glider.visible = false; glider.position.y = 2.05;
  const gm = new THREE.Mesh(G.glider, toon(GLIDERS[look.glider || 0], { side: THREE.DoubleSide, roughness: .8 })); gm.rotation.x = -Math.PI / 2 + .25; glider.add(gm);
  [-.45, .45].forEach(x => { const r = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .9, 4), toon('#7a5236')); r.position.set(x, -.42, 0); r.rotation.z = x * .7; glider.add(r); });
  rig.add(glider); A.glider = glider;
  root.traverse(o => { if (o instanceof THREE.Mesh && o !== shadow) { o.castShadow = true; } });
  // (v1.08b friends) with the friend's model ready, the code person keeps only what the child wears (hats, necklace, badge,
  // back, glider); the model, added below, follows its joints
  if (useModel) {
    [hat, ...(A.wings || []), A.cape].forEach(g => g && g.traverse(o => { o.userData.wear = true; }));
    if (ft) [A.kneeL, A.kneeR].forEach(k => k && k.children.forEach(o => { if (o instanceof THREE.Mesh && o.geometry !== B.shin && o.geometry !== B.pantsShin) o.userData.wear = true; })); // (v1.08d polish) shop shoes stay on the model
    const drop = []; rig.traverse(o => { if (o instanceof THREE.Mesh && !o.userData.wear) { let p = o.parent; while (p && p !== glider) p = p.parent; if (!p) drop.push(o); } });
    drop.forEach(o => o.parent.remove(o));
  }
  compact(A); // (battery round) each moving part one shape, before the outlines are made (one outline each, too)
  A.outlines = outline(rig, .011, '#6a4a3a'); OUTLINED.push(A);
  A.anim = (state, t, speed) => animate(A, state, t, speed);
  // (v1.08d polish) the friend's item in the hand once their quest is done (look.fitems), and the shop's shoes on the model
  if (useModel) { A.model = FRIEND_MODELS.attach(A, friendId, look.skin, { item: typeof look.fitems === 'string' && look.fitems.split(' ').includes(friendId), shoes: !!ft }); A.root.userData.friendModel = friendId; }
  return A;
}

// (v1.08, owner 2 Nov 2026 AEDT: "đẹp, có hồn và uyển chuyển hơn") How a person moves. Each frame the state gives a
// target pose (every joint's turn, the lift and a squash); the joints then glide towards it instead of jumping, softly
// for a moment after the state changes (walk to stand, landing) and almost at once otherwise, so a walk keeps its swing.
// The knees and elbows bend, the hips sway, the head stays steady and looks round (or at the child close by), the
// chest breathes, hair and capes swing, jumps stretch and landings squash, and a painted face blinks and smiles.
// What the game sets on a joint after this (films, riders' hands on the handlebars) still wins, and fades out smoothly.
const JOINTS = ['legL', 'legR', 'kneeL', 'kneeR', 'armL', 'armR', 'elbowL', 'elbowR', 'head', 'torso', 'rig', 'tail'];
const JI: Record<string, number> = Object.fromEntries(JOINTS.map((j, i) => [j, i * 3]));
const LIFT = JOINTS.length * 3, SQUASH = LIFT + 1, POSE = new Float32Array(LIFT + 2);
const put = (j: string, x: number, y = 0, z = 0) => { const i = JI[j]; POSE[i] = x; POSE[i + 1] = y; POSE[i + 2] = z; };
const add = (j: string, x: number, y = 0, z = 0) => { const i = JI[j]; POSE[i] += x; POSE[i + 1] += y; POSE[i + 2] += z; };
// the child the villagers turn to look at (set by the player each frame)
const lookAt = { on: false, x: 0, z: 0, self: null as SvAvatar | null }, _wp = new THREE.Vector3();
export function setLookTarget(p: { x: number, z: number } | null, self?: SvAvatar) { lookAt.on = !!p; if (p) { lookAt.x = p.x; lookAt.z = p.z; lookAt.self = self || null; } }

export function animate(A, state, t, speed = 0) {
  const L: AvatarLife = A.life || (A.life = { t, st: state, chg: -9, land: -9, ph: 0, blink: t + 1 + Math.random() * 3, mood: 'smile', seed: Math.random() * 20 });
  const dt = t - L.t, fresh = !(dt > 0 && dt < .3); L.t = t; // first frame, a film jumping, a long pause: straight to the pose
  if (state !== L.st) { if (L.st === 'air' && state !== 'glide') L.land = t; L.st = state; L.chg = t; }
  if (fresh) { L.blink = t + 1 + Math.random() * 3; L.chg = -9; } else L.ph += dt * (7 + speed * 1.3);
  POSE.fill(0); put('armL', 0, 0, .12); put('armR', 0, 0, -.12); put('elbowL', -.12); put('elbowR', -.12);
  const s = Math.min(1, speed / 4), run = Math.max(0, Math.min(1, (speed - 5) / 4)), since = t - L.chg, sd = L.seed;
  let mood = 'smile';
  switch (state) {
    case 'walk': {
      const ph = L.ph, sw = Math.sin(ph) * s, back = Math.cos(ph);
      put('legL', sw * (.72 + .2 * run)); put('legR', -sw * (.72 + .2 * run));
      // the knee bends as the leg swings forward, and a little as the foot takes the weight
      put('kneeL', s * (.12 + (.45 + .55 * run) * Math.max(0, -back))); put('kneeR', s * (.12 + (.45 + .55 * run) * Math.max(0, back)));
      put('armL', -sw * (.6 + .35 * run), 0, .12 + .05 * run); put('armR', sw * (.6 + .35 * run), 0, -.12 - .05 * run);
      put('elbowL', -.25 - .55 * run - Math.max(0, -sw) * .25); put('elbowR', -.25 - .55 * run - Math.max(0, sw) * .25);
      POSE[LIFT] = s * (.035 + .045 * run) * (.5 + .5 * Math.cos(2 * ph)); // highest as the legs pass each other
      put('torso', Math.min(.12, speed * .012) + run * .08, -sw * .1, Math.sin(ph) * .035 * s);
      put('head', -Math.min(.12, speed * .012) * .5 - Math.cos(2 * ph) * .02 * s, sw * .07, -Math.sin(ph) * .03 * s);
      put('rig', 0, 0, Math.sin(ph) * .02 * s);
      put('tail', .15 * s + .1 * run - Math.cos(2 * ph) * .08 * s, 0, Math.sin(ph) * .22 * s);
      break;
    }
    case 'air': {
      put('legL', .3, 0, .04); put('legR', -.5, 0, -.04); put('kneeL', .75); put('kneeR', .7);
      put('armL', -.2, 0, 1.25); put('armR', -.2, 0, -1.25); put('elbowL', -.35); put('elbowR', -.35);
      put('tail', -.35); POSE[SQUASH] = .09 * Math.exp(-since * 7); break; // a stretch as the child leaves the ground
    }
    case 'glide': A.glider.visible = true; put('armL', 0, 0, 2.8); put('armR', 0, 0, -2.8); put('elbowL', -.1); put('elbowR', -.1); put('legL', .25); put('legR', .1); put('kneeL', .35); put('kneeR', .2);
      put('rig', .12); POSE[LIFT] = Math.sin(t * 2) * .04; put('tail', .5 + Math.sin(t * 9) * .08); break;
    case 'swim': put('rig', 1.15); POSE[LIFT] = -.55; put('armL', Math.sin(t * 5) * 1.6); put('armR', -Math.sin(t * 5) * 1.6); put('elbowL', -.3 - Math.max(0, Math.cos(t * 5)) * .5); put('elbowR', -.3 - Math.max(0, -Math.cos(t * 5)) * .5);
      put('legL', Math.sin(t * 8) * .4); put('legR', -Math.sin(t * 8) * .4); put('kneeL', .2 + Math.max(0, Math.sin(t * 8)) * .4); put('kneeR', .2 + Math.max(0, -Math.sin(t * 8)) * .4); put('head', -.6); put('tail', .9); break;
    case 'climb': put('armL', -2.7 + Math.sin(t * 6) * .4); put('armR', -2.7 - Math.sin(t * 6) * .4); put('elbowL', -.35 - Math.max(0, Math.sin(t * 6)) * .5); put('elbowR', -.35 - Math.max(0, -Math.sin(t * 6)) * .5);
      put('legL', -.2 - Math.max(0, Math.sin(t * 6)) * .7); put('legR', -.2 - Math.max(0, -Math.sin(t * 6)) * .7); put('kneeL', .3 + Math.max(0, Math.sin(t * 6)) * 1.1); put('kneeR', .3 + Math.max(0, -Math.sin(t * 6)) * 1.1); break;
    case 'sit': put('legL', -1.45, 0, .08); put('legR', -1.45, 0, -.08); put('kneeL', 1.35); put('kneeR', 1.35); put('armL', -.55, 0, .2); put('armR', -.55, 0, -.2); put('elbowL', -.5); put('elbowR', -.5); break; // (round R: a passenger seat, a bench)
    case 'ride': put('legL', -1.3, 0, .55); put('legR', -1.3, 0, -.55); put('kneeL', 1); put('kneeR', 1); POSE[LIFT] = Math.abs(Math.sin(t * 7)) * .05 * Math.min(1, speed / 3);
      put('armL', -.7, 0, .12); put('armR', -.7, 0, -.12); put('elbowL', -.4); put('elbowR', -.4); put('tail', .2, 0, Math.sin(t * 7) * .1 * Math.min(1, speed / 3)); break;
    case 'cheer': { const b = Math.abs(Math.sin(t * 8)), low = 1 - b;
      put('armL', 0, 0, 2.75 + Math.sin(t * 10) * .2); put('armR', 0, 0, -2.75 - Math.sin(t * 10) * .2); put('elbowL', -.25); put('elbowR', -.25);
      POSE[LIFT] = b * .18; put('legL', -low * .3); put('legR', -low * .3); put('kneeL', low * .55); put('kneeR', low * .55);
      POSE[SQUASH] = (b - .5) * .1; put('head', -.12); put('tail', -b * .4); mood = 'happy'; break; }
    case 'wave': put('armR', -.2, 0, -2.05); put('elbowR', -.1, 0, -.55 + Math.sin(t * 9) * .4); put('head', .02, .1, Math.sin(t * 3) * .1); put('torso', 0, 0, Math.sin(t * 3) * .03); mood = 'happy'; break;
    case 'dance': {
      const b = t * 8.4;
      POSE[LIFT] = Math.abs(Math.sin(b)) * .1; put('torso', 0, Math.sin(b / 2) * .4); put('head', 0, -Math.sin(b / 2) * .15, Math.sin(b / 2) * .18);
      put('armL', 0, 0, 1.6 + Math.sin(b) * .9); put('armR', 0, 0, -1.6 + Math.sin(b + 1.5) * .9); put('elbowL', -.6 - Math.sin(b) * .3); put('elbowR', -.6 - Math.sin(b + 1.5) * .3);
      put('legL', -Math.max(0, Math.sin(b)) * .5); put('legR', -Math.max(0, -Math.sin(b)) * .5); put('kneeL', Math.max(0, Math.sin(b)) * .9); put('kneeR', Math.max(0, -Math.sin(b)) * .9);
      put('tail', 0, 0, Math.sin(b / 2) * .4); mood = 'happy'; break;
    }
    default: { // standing: breathing, the weight shifting from foot to foot, looking round now and then
      const br = Math.sin(t * 2.1), shift = Math.sin(t * .45 + sd);
      POSE[LIFT] = br * .006 - Math.abs(shift) * .008; put('torso', br * .015); put('rig', 0, 0, shift * .025);
      put('armL', 0, 0, .12 + br * .03); put('armR', 0, 0, -.12 - br * .03);
      put('kneeL', Math.max(0, shift) * .14); put('kneeR', Math.max(0, -shift) * .14); put('legL', -Math.max(0, shift) * .07); put('legR', -Math.max(0, -shift) * .07);
      put('head', Math.sin(t * .23 + sd) * .05, .28 * Math.sin(t * .31 + sd) * Math.sin(t * .17 + sd * 2) + Math.sin(t * .7) * .06, Math.sin(t * .29 + sd * 3) * .05 - shift * .02);
      put('tail', 0, 0, -shift * .05);
      if (lookAt.on && lookAt.self !== A && A.root.parent) { // a villager turns their head to the child close by
        A.root.getWorldPosition(_wp); const dx = lookAt.x - _wp.x, dz = lookAt.z - _wp.z, d2 = dx * dx + dz * dz;
        if (d2 < 30 && d2 > .2) { let a = Math.atan2(dx, dz) - A.root.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); if (Math.abs(a) < 1.9) { const turn = Math.max(-1.1, Math.min(1.1, a)); add('head', 0, turn * .8 - POSE[JI.head + 1] * .7); add('torso', 0, turn * .2); } }
      }
    }
  }
  // landing: the knees give and the body squashes for a moment
  const ld = t - L.land;
  if (ld >= 0 && ld < .3 && state !== 'air') { const k = Math.sin(Math.PI * ld / .3); add('kneeL', k * .6); add('kneeR', k * .6); add('legL', -k * .3); add('legR', -k * .3); POSE[LIFT] -= k * .06; POSE[SQUASH] -= k * .1; add('tail', k * .3); }
  if (state !== 'glide') A.glider.visible = false;
  const k = fresh ? 1 : 1 - Math.exp(-dt * (since < .45 ? 10 : 38));
  for (let n = 0; n < JOINTS.length; n++) {
    const o = A[JOINTS[n]]; if (!o) continue;
    const r = o.rotation, i = n * 3; r.x += (POSE[i] - r.x) * k; r.y += (POSE[i + 1] - r.y) * k; r.z += (POSE[i + 2] - r.z) * k;
  }
  A.rig.position.y += (POSE[LIFT] - A.rig.position.y) * k;
  const sq = 1 + POSE[SQUASH], side = 1 / Math.sqrt(sq), H = A.height || 1; A.rig.scale.set(side * H, sq * H, side * H); // (v1.08b: H, a grown-up's height)
  if (A.wings) A.wings.forEach((w, i) => { w.rotation.y = (i ? -1 : 1) * (.3 + Math.sin(t * (state === 'glide' || state === 'air' ? 14 : 3)) * .25); });
  if (A.cape) A.cape.rotation.x += (.12 + Math.min(.9, speed * .07) + Math.sin(t * 6) * .04 + (state === 'air' ? .5 : 0) - A.cape.rotation.x) * (fresh ? 1 : 1 - Math.exp(-dt * 6));
  // the face: a blink every few seconds (now and then two), happy while cheering, waving and dancing
  if (A.painted && A.faceMat) {
    if (t > L.blink + .13) L.blink = t + 1.8 + Math.random() * 3.5 - (Math.random() < .15 ? 1.55 + Math.random() * .2 : 0);
    const want = !fresh && t >= L.blink && t < L.blink + .13 ? 'blink' : mood;
    if (want !== L.mood && A.faceMat.map) { L.mood = want; setFaceMood(A.faceMat.map, want); }
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
// (v1.08d polish, WORLD-011) the crowds (cities, homes, the regions, Asia, heritage games, hawkers, the festival, the folk
// show, children playing) at the new heights, as the named villagers: a grown-up 2.0, a grandparent 1.8 (grey or white
// hair), a child 1.6 (they no longer shrink a child by hand). A look with its own age keeps it.
export const crowdLook = (look, kid = false) => { if (!look || look.age || kid) return look; const h = /^#[0-9a-f]{6}$/i.test(look.hair || '') ? [1, 3, 5].map(i => parseInt(look.hair.slice(i, i + 2), 16)) : null;
  return { ...look, age: h && Math.max(...h) - Math.min(...h) < 20 && h[0] > 120 ? 'elder' : 'adult' }; };
export function nameAvatar(A, name, remember = true, stableId?) { // remember: false for people in a room that is torn down later
  if (!A || !name) return A; const legacy = baseOf(name), id = stableId || legacy; A.faceLegacy = legacy; if (remember) (NAMED[id] = NAMED[id] || []).push(A);
  const f = familyOwnFace(id) || familyOwnFace(legacy) || (settings.npcFaces || {})[legacy] || customFace(legacy); if (f) setFace(A, f);
  return A;
}
function setFace(A, f) {
  if (A.late) { A.lateFace = f; return; } // (v1.08d valley) a stand-in gets its face when it is built
  A.faceMat.map = f && f.photo ? faceTexture(A.look, f.photo) : faceTexture(A.look); A.faceMat.needsUpdate = true;
  A.painted = !(f && f.photo); if (A.life) A.life.mood = 'smile';
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
// (v1.08) A bending limb stays one shape: the thigh and the shin (the upper arm and the forearm, the head and its
// hanging hair) are baked together and the knee bends it in the shader (bendMat). So the new knees, elbows and
// swinging hair cost no extra draws (PERF-003) and no extra pictures.
// a limb's material: the corners on the knee's side are turned by the knee (uBend), in the shader, so a bending
// limb is one shape, one draw and no extra picture (a skinned shape's bones would be a picture each: check longplaymem)
function bendMat(side: number, u: { value: THREE.Matrix4 }) {
  const m = toonSmooth({ side });
  m.onBeforeCompile = sh => {
    sh.uniforms.uBend = u;
    sh.vertexShader = 'attribute float bendW;\nuniform mat4 uBend;\n' + sh.vertexShader
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nif (bendW > .5) objectNormal = mat3(uBend) * objectNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nif (bendW > .5) transformed = (uBend * vec4(transformed, 1.)).xyz;');
  };
  m.customProgramCacheKey = () => 'svbend' + side;
  return m;
}
const JOINED = [['legL', 'kneeL'], ['legR', 'kneeR'], ['armL', 'elbowL'], ['armR', 'elbowR'], ['head', 'tail']];
function compact(A) {
  const nodes = [A.rig, A.torso, A.head, A.legL, A.legR, A.armL, A.armR, A.glider, ...(A.wings || [])];
  A.rig.traverse(o => { if (o.isGroup && !nodes.includes(o)) nodes.push(o); });
  const kidOf = new Map(), joinedKid = new Set();
  for (const [p, c] of JOINED) if (A[p] && A[c]) { kidOf.set(A[p], A[c]); joinedKid.add(A[c]); }
  const pick = N => {
    const bySide: Record<string, THREE.Mesh<THREE.BufferGeometry, THREE.MeshToonMaterial>[]> = {};
    for (const m of N.children) {
      if (!m.isMesh || m.children.length || m === A.cape || !m.visible) continue;
      const mt = m.material;
      if (Array.isArray(mt) || !mt.isMeshToonMaterial || mt.transparent || mt.map || !m.geometry.attributes.normal) continue;
      if (!mt.vertexColors && !mt.color) continue;
      (bySide[mt.side] = bySide[mt.side] || []).push(m);
    }
    return bySide;
  };
  A.skinParts = [];
  for (const N of nodes) {
    if (joinedKid.has(N)) continue; // a knee, an elbow or hanging hair: baked with its parent below
    const kid = kidOf.get(N), bySide = pick(N), kidSide = kid ? pick(kid) : {};
    for (const side of new Set([...Object.keys(bySide), ...Object.keys(kidSide)])) {
      const list = bySide[side] || [], kl = kidSide[side] || [];
      if (list.length + kl.length < 2 && !kl.length) continue;
      N.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(N.matrixWorld).invert();
      const ranges = []; let at = 0;
      // (r86: the baked shape keeps each part's corners once, so a skin range counts the part's corners)
      const parts = [...list, ...kl].map(m => { const n = m.geometry.attributes.position.count; if (m.material === A.skinMat) ranges.push([at, n]); at += n; return { m, c: m.material.vertexColors && m.geometry.attributes.color ? null : m.material.color }; });
      const g = bake(parts, inv, true);
      let one: THREE.Mesh;
      if (kl.length) {
        // each corner remembers whether it belongs to the knee's side (1) or the hip's (0)
        const n0 = list.reduce((s, m) => s + m.geometry.attributes.position.count, 0), nv = g.attributes.position.count, w = new Float32Array(nv);
        for (let i = n0; i < nv; i++) w[i] = 1;
        g.setAttribute('bendW', new THREE.BufferAttribute(w, 1));
        kid.updateMatrix(); const rest = kid.matrix.clone().invert(), u = { value: new THREE.Matrix4() };
        one = new THREE.Mesh(g, bendMat(+side, u)); N.add(one);
        // just before it is drawn: how far the knee has turned since it was built
        one.onBeforeRender = () => { kid.updateMatrix(); u.value.multiplyMatrices(kid.matrix, rest); };
        one.userData.bend = u;
      } else { one = new THREE.Mesh(g, compactMat(+side)); N.add(one); }
      one.castShadow = true;
      // (r67) an arm keeps an empty marker where each of its parts was (the hand at y -0.42), so a rider's grip can still be found
      if (N === A.armL || N === A.armR) [[N, list, null], [N, kl, kid]].forEach(([G, l, from]) => l.forEach(m => { const k = new THREE.Object3D(); k.position.copy(m.position); if (from) k.position.add(from.position); k.quaternion.copy(m.quaternion); k.userData.part = true; G.add(k); }));
      list.forEach(m => N.remove(m)); kl.forEach(m => kid.remove(m));
      if (ranges.length) A.skinParts.push({ g, ranges });
    }
  }
}
// (v1.08) a copy of a person (the Bag's picture of the child): the copy's limbs bend as the person's do
export function cloneAvatarRoot(root: THREE.Object3D) { return root.clone(true); }
function recolorSkin(A) {
  const c = A.skinMat.color;
  for (const { g, ranges } of A.skinParts || []) { const C = g.attributes.color; for (const [a, n] of ranges) for (let i = a; i < a + n; i++) C.setXYZ(i, c.r, c.g, c.b); C.needsUpdate = true; }
}
// the moving person or the still copy (made the first time it is needed)
export function showStill(A, yes) {
  if (A.model) yes = false; // (v1.08b) a friend's model has no still copy: it is one of a few children
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

// (v1.08d valley, owner 5 Nov 2026 AEDT: "the valley building as the child walks") villagers far from every child are
// made as a stand-in: an empty group where they stand, with their look, their height and an animation that does
// nothing. The first time a child comes within reach (js/main.ts: wakeLateAvatars four times a second, and at once round
// a flight's landing spot) the real person is built into the same object and the same group, so everything that holds
// the villager (their place, their day, their talk, their name and face) keeps it. Only villagers whose makers use
// nothing but the group and anim before then are made this way (js/cities.ts, js/homes.ts, js/heritage.ts,
// js/regions.ts); the checks build them all before they play (G.areas.all).
const LATE: SvAvatar[] = [];
export function lateAvatar(look, photo = null): SvAvatar {
  const root = new THREE.Group(); root.userData.avatar = true;
  const AGE = { adult: 1.25, elder: 1.125, old: 1.125 }[look && look.age] || 1;
  const A: SvAvatar = { root, look, height: AGE, late: true, latePhoto: photo, anim: () => { } } as unknown as SvAvatar;
  LATE.push(A); return A;
}
export function buildLate(A: SvAvatar) {
  if (!A || !A.late) return; A.late = false; const i = LATE.indexOf(A); if (i >= 0) LATE.splice(i, 1);
  buildAvatar(A.look, A.latePhoto, { into: A });
  if (A.lateFace !== undefined) { const f = A.lateFace; A.lateFace = undefined; setFace(A, f); }
  for (const f of A.lateThen || []) f(); A.lateThen = undefined;
}
/** runs fn once the person is really built (at once for one that is) */
export function afterBuilt(A: SvAvatar, fn: () => void) { if (!A.late) fn(); else (A.lateThen = A.lateThen || []).push(fn); }
const _lp = new THREE.Vector3();
/** builds the stand-ins within r m of any of the points, at most max of them (the nearest first) */
export function wakeLateAvatars(points: { x: number, z: number }[], r = 60, max = 3) {
  if (!LATE.length || !points.length) return 0;
  const near: [number, SvAvatar][] = [];
  for (const A of LATE) { if (!A.root.parent) continue; A.root.getWorldPosition(_lp); let d = 1e9; for (const p of points) d = Math.min(d, Math.hypot(p.x - _lp.x, p.z - _lp.z)); if (d < r) near.push([d, A]); }
  near.sort((a, b) => a[0] - b[0]); let n = 0; for (const [, A] of near) { if (n >= max) break; buildLate(A); n++; }
  return n;
}
export const lateLeft = () => LATE.length;
export function buildAllLate() { while (LATE.length) buildLate(LATE[0]); }
/** where the stand-ins still waiting stand (for the checks) */
export function lateSpots() { return LATE.filter(A => A.root.parent).map(A => { A.root.getWorldPosition(_lp); return [Math.round(_lp.x), Math.round(_lp.z)]; }); }
