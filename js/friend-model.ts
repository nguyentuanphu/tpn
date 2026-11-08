// (v1.08b friends) The four friends' light 3D models (models/<id>.glb, made by tools/make-friends.mts from the Blender
// script). They load only after a child starts playing, never in the first download (check startup); until a model has
// arrived (or when it cannot load: an old phone, no network on the very first start) the child is drawn by the code
// builder in that friend's colours (js/avatar.ts), so the game never stops.
// The model does not play its own moves: each frame its joints copy the turns of the code person's joints (same names:
// torso, head, armL, elbowL, legL, kneeL ...), so walking, jumping, riding (seatRider) and the films' poses work as before,
// and the hats, necklaces and backs the code person wears sit on the model.
import { THREE, P, personLook, outlineSkinned } from './gfx.js';
import type { FriendId } from './content/friends.js';

type Loaded = { scene: THREE.Object3D, clone: (o: THREE.Object3D) => THREE.Object3D };
/** (v1.08e) a "lit-" part whose gallery light is in its corner colours: lit mostly by them (emissive), a little by the valley */
function litCorners(name: string) {
  const m = new THREE.MeshToonMaterial({ name, vertexColors: true, emissive: '#fff0dc', emissiveIntensity: .9, color: '#8a8070' });
  m.userData.cornerLight = true;
  m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_COLOR\ntotalEmissiveRadiance *= vColor.rgb;\n#endif'); };
  return m;
}
const ready: Record<string, Loaded> = {}, loading: Record<string, Promise<boolean>> = {}, failed = new Set<string>();
let bands: THREE.Texture = null;
export const friendModelReady = (id: string) => !!ready[id];
export const friendModelFailed = (id: string) => failed.has(id);
export const FRIEND_MODEL_URL = (id: string) => `models/${id}.glb`;
// (v1.08e faces, part 2) the high-detail model of a friend is loaded by the key "<id>-hd" (models/<id>-hd.glb): only the
// child's own friend, after the start (js/player.ts); the light model stays for far away, other children and the fallback
export const HD = (id: string) => id + '-hd';
/** load a friend's model (once); resolves true when it is ready, false when it could not load */
export function loadFriendModel(id: FriendId | `${FriendId}-hd`): Promise<boolean> {
  if (!id) return Promise.resolve(false);
  if (ready[id]) return Promise.resolve(true);
  if (failed.has(id)) return Promise.resolve(false);
  return loading[id] || (loading[id] = (async () => {
    try {
      const [{ GLTFLoader }, { MeshoptDecoder }, { clone }] = await Promise.all([import('../vendor/GLTFLoader.js'), import('../vendor/meshopt_decoder.module.js'), import('../vendor/SkeletonUtils.js')]);
      const l = new GLTFLoader(); l.setMeshoptDecoder(MeshoptDecoder);
      const g = await l.loadAsync(FRIEND_MODEL_URL(id));
      if (!bands) { const d = new Uint8Array([90, 170, 255]); bands = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); bands.minFilter = bands.magFilter = THREE.NearestFilter; bands.needsUpdate = true; }
      // the picture-book look: toon shading in a few bands, colours from the corners; skin in one colour (set per child)
      const mats = new Map();
      g.scene.traverse((o: any) => { if (!o.isMesh) return; o.frustumCulled = false; o.castShadow = true;
        const m = o.material, name = m.name || '';
        // (v1.08e faces, part 2) a high-detail model's parts carry their painted picture (m.map) instead of corner colours
        // (v1.08e, owner 6 Nov: "skin-shade": the skin's corners carry its soft form shading, times the child's skin tone)
        if (!mats.has(m)) mats.set(m, name.startsWith('skin') ? new THREE.MeshToonMaterial({ name, color: '#f6c7a5', gradientMap: bands, vertexColors: name.startsWith('skin-shade') && !!(o.geometry && o.geometry.attributes.color) })
          // (v1.08e villagers) "lit-": the gallery's studio light is baked into the picture, so it is drawn mostly by its own light
          // (emissive), with a little of the valley's light on top, so day and night still show
          : name.startsWith('lit-') && m.map ? new THREE.MeshToonMaterial({ name, map: m.map, emissiveMap: m.map, emissive: '#fff0dc', emissiveIntensity: .9, color: '#8a8070', gradientMap: bands }) // (owner, 6 Nov: brighter, warmer)
          // (v1.08e, Release 6 Nov: no picture, the clothes crisp) the light is baked into the corner colours: drawn the same way
          : name.startsWith('lit-') ? litCorners(name)
          : m.map ? new THREE.MeshToonMaterial({ name, map: m.map, gradientMap: bands }) : new THREE.MeshToonMaterial({ name, vertexColors: true, gradientMap: bands }));
        if (/^cloth-(hat|hair)/.test(name)) mats.get(m).side = THREE.DoubleSide; // (v1.08e villagers) a hat is a thin shell, and a lock of hair a thin card: both sides drawn
        o.material = personLook(mats.get(m)); }); // (v1.08e faces, part 2) the people's soft ramp and rim light
      ready[id] = { scene: g.scene, clone };
      return true;
    } catch (e) { failed.add(id); console.warn('friend model', id, e && e.message); return false; }
  })());
}
// the code person's mood → the model's face
// (v1.08e faces) and the soft-lid faces' new ones: 'half' (the lids half down, either side of a blink), 'lookL' and 'lookR'
// (the eyes to one side); a model made before them shows its nearest face instead (NEAR)
const MOOD = { smile: 'face-smile', blink: 'face-blink', happy: 'face-happy', o: 'face-surprised', curious: 'face-curious', excited: 'face-excited', sad: 'face-sad', shy: 'face-shy',
  half: 'face-half', lookL: 'face-lookL', lookR: 'face-lookR', sleep: 'face-blink' };
const NEAR = { 'face-half': 'face-blink', 'face-lookL': 'face-smile', 'face-lookR': 'face-smile' };
// (v1.08e faces, part 3: owner 6 Nov 2026 AEDT, "like a real 3D person") a model with a sculpted face has one face mesh,
// "face3d", whose moods are its shape keys (tools/blender/lumi-face3d.py): the rest shape smiles, one key is set at a time
// (a blink passes through 'half', as the face meshes did)
const KEY = { o: 'surprised', talk: 'open' };
const JOINTS = ['torso', 'head', 'armL', 'elbowL', 'armR', 'elbowR', 'legL', 'kneeL', 'legR', 'kneeR'];
export type FriendModel = { obj: THREE.Object3D, follow: (mood?: string, riding?: boolean) => void, skin: (hex: string) => void, item: boolean, boots: boolean, face3d?: any[] | null, readonly mood?: string };
// (v1.08d polish) what a model shows besides the body: the item in the hand once the friend's quest is done
// (js/friendquest.ts), and its own boots unless the child wears shoes from the shop (then the code person's shoes stay on)
export type FriendModelWear = { item?: boolean, shoes?: boolean };
/** a copy of the friend's model inside the code person's rig, following its joints. A: the code person (js/avatar.ts) */
export function attachFriendModel(A, id: string, skinHex: string, wear: FriendModelWear = {}, hd = false): FriendModel {
  const L = ready[hd ? HD(id) : id]; if (!L) return null;
  const obj = L.clone(L.scene); obj.name = 'friend-model';
  const bones: Record<string, THREE.Bone> = {}, faces: Record<string, THREE.Object3D[]> = {}, grips: THREE.Object3D[] = [], skinMats = [], face3: any[] = [];
  obj.traverse((o: any) => {
    if (o.isBone) bones[o.name] = o;
    if (o.isMesh) {
      const n = o.material.name || '';
      if (o.morphTargetDictionary && 'blink' in o.morphTargetDictionary) { face3.push(o); o.userData.face3d = true; }
      if (n.startsWith('face-')) (faces[n] = faces[n] || []).push(o);
      if (n.startsWith('skin')) { o.material = o.material.clone(); o.material.userData.person = false; personLook(o.material); skinMats.push(o.material); }
      if (n === 'skin-grip' || n === 'cloth-hands-grip') grips.push(o); // (the hands that hold handlebars: shown only when riding)
      if (n === 'cloth-item') o.visible = !!wear.item; // (v1.08d polish) the item in the hand: only once earned
      if (n === 'cloth-shoes') o.visible = !wear.shoes; // (v1.08d polish) the model's boots, unless shop shoes are worn
    }
  });
  A.rig.add(obj); A.rig.updateMatrixWorld(true);
  // (v1.08e faces, part 2) the same thin ink outline as the code people, bent by the model's bones (not on the faces);
  // each follows its part's visibility (the item in the hand, the riding hands) and hides far away with the others
  const lines: [THREE.Object3D, THREE.Object3D][] = [];
  obj.traverse((o: any) => { if (o.isSkinnedMesh && !o.userData.outline && !o.userData.face3d && !/^(face-|cloth-hat|cloth-hair)/.test(o.material.name || '')) lines.push([o, null]); }); // (no shell behind a thin hat, none on the face, none round the locks of hair: it poked out between them, Release 6 Nov)
  lines.forEach(l => { l[1] = outlineSkinned(l[0], .009); });
  if (Array.isArray(A.outlines)) A.outlines.push(...lines.map(l => l[1]));
  // the rest turn of each joint, the code person's and the model's (both in the rig's space)
  const rigQ = new THREE.Quaternion(), q = new THREE.Quaternion(), rest = {};
  const inRig = (o, out) => { o.getWorldQuaternion(out); return out.premultiply(rigQ.clone().invert()); };
  A.rig.getWorldQuaternion(rigQ);
  for (const j of JOINTS) if (A[j] && bones[j]) rest[j] = { c: inRig(A[j], new THREE.Quaternion()).invert(), b: inRig(bones[j], new THREE.Quaternion()) };
  const order = JOINTS.filter(j => rest[j]);
  let face = '', shown = 'smile';
  const follow = (mood = 'smile', riding = false) => {
    A.rig.getWorldQuaternion(rigQ); const inv = rigQ.clone().invert(), parentQ = new THREE.Quaternion();
    for (const j of order) {
      const b = bones[j], r = rest[j];
      A[j].getWorldQuaternion(q); q.premultiply(inv).multiply(r.c).multiply(r.b); // the code joint's turn from its rest, on the model's rest
      b.parent.getWorldQuaternion(parentQ); parentQ.premultiply(inv);
      b.quaternion.copy(parentQ.invert().multiply(q));
      b.updateMatrixWorld(true);
    }
    let f = MOOD[mood] || 'face-smile'; if (!faces[f]) f = NEAR[f] || 'face-smile';
    if (f !== face) { face = f; for (const [k, list] of Object.entries(faces)) list.forEach(o => { o.visible = k === f; }); }
    if (face3.length) {
      const key = KEY[mood] || mood;
      if (key !== shown) { shown = key; for (const o of face3) { const d = o.morphTargetDictionary, inf = o.morphTargetInfluences; for (const n in d) inf[d[n]] = n === key ? 1 : 0; } }
    }
    grips.forEach(o => { o.visible = riding; });
    for (const [o, h] of lines) if (h.visible !== o.visible && A._ol !== false) h.visible = o.visible;
  };
  const skin = (hex: string) => skinMats.forEach(m => m.color.set(hex));
  skin(skinHex); follow();
  // the joints are copied just before each drawing, after everything that moves the code person this frame (the walk, a
  // rider's seat, a film's pose): the renderer updates every object's place first, and this copy goes with the model's
  const own = obj.updateMatrixWorld.bind(obj);
  obj.updateMatrixWorld = (force?: boolean) => { if (A.rig.visible) follow(A.life && A.life.mood || 'smile'); own(force); };
  return { obj, follow, skin, item: !!wear.item, boots: !wear.shoes, face3d: face3.length ? face3 : null, get mood() { return face3.length ? shown : face.replace(/^face-/, ''); } };
}

// (v1.08b friends) glasses and a mask (head coordinates: the eyes sit at x ±.12, y -.09, the face's front at z .49)
export function faceParts(it) {
  const c = it.color, y = -.08, z = .5;
  if (it.shape === 'mask') { const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .09 : .2; const px = Math.cos(a) * r, py = Math.sin(a) * r + .1; i ? st.lineTo(px, py) : st.moveTo(px, py); }
    return [P(new THREE.CapsuleGeometry(.07, .2, 4, 10), c, [0, y, z - .02], [0, 0, Math.PI / 2], [1, .9, .45]), P(new THREE.ShapeGeometry(st), c, [0, y + .06, z + .015])]; }
  const ring = it.shape === 'roundglasses' ? new THREE.TorusGeometry(.085, .016, 6, 20) : new THREE.TorusGeometry(.08, .022, 4, 4);
  const out = [-1, 1].flatMap(s => [P(ring, c, [s * .12, y, z], [0, 0, it.shape === 'roundglasses' ? 0 : Math.PI / 4], it.shape === 'roundglasses' ? [1, 1, 1] : [1.25, .9, 1]),
    P(new THREE.BoxGeometry(.14, .02, .02), c, [s * .27, y + .02, z - .1], [0, s * .9, 0])]);
  if (it.shape === 'glasses') [-1, 1].forEach(s => out.push(P(new THREE.CircleGeometry(.075, 4), c, [s * .12, y, z - .002], [0, 0, Math.PI / 4], [1.25, .9, 1])));
  out.push(P(new THREE.BoxGeometry(.07, .018, .018), c, [0, y + .01, z + .005]));
  return out;
}
