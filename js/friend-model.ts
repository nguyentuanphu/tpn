// (v1.08b friends) The four friends' light 3D models (models/<id>.glb, made by tools/make-friends.mts from the Blender
// script). They load only after a child starts playing, never in the first download (check startup); until a model has
// arrived (or when it cannot load: an old phone, no network on the very first start) the child is drawn by the code
// builder in that friend's colours (js/avatar.ts), so the game never stops.
// The model does not play its own moves: each frame its joints copy the turns of the code person's joints (same names:
// torso, head, armL, elbowL, legL, kneeL ...), so walking, jumping, riding (seatRider) and the films' poses work as before,
// and the hats, necklaces and backs the code person wears sit on the model.
import { THREE } from './gfx.js';
import type { FriendId } from './content/friends.js';

type Loaded = { scene: THREE.Object3D, clone: (o: THREE.Object3D) => THREE.Object3D };
const ready: Partial<Record<FriendId, Loaded>> = {}, loading: Partial<Record<FriendId, Promise<boolean>>> = {}, failed = new Set<string>();
let bands: THREE.Texture = null;
export const friendModelReady = (id: string) => !!ready[id];
export const friendModelFailed = (id: string) => failed.has(id);
export const FRIEND_MODEL_URL = (id: string) => `models/${id}.glb`;
/** load a friend's model (once); resolves true when it is ready, false when it could not load */
export function loadFriendModel(id: FriendId): Promise<boolean> {
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
        if (!mats.has(m)) mats.set(m, name.startsWith('skin') ? new THREE.MeshToonMaterial({ name, color: '#f6c7a5', gradientMap: bands })
          : new THREE.MeshToonMaterial({ name, vertexColors: true, gradientMap: bands }));
        o.material = mats.get(m); });
      ready[id] = { scene: g.scene, clone };
      return true;
    } catch (e) { failed.add(id); console.warn('friend model', id, e && e.message); return false; }
  })());
}
// the code person's mood → the model's face
const MOOD = { smile: 'face-smile', blink: 'face-blink', happy: 'face-happy', o: 'face-surprised', curious: 'face-curious', excited: 'face-excited', sad: 'face-sad', shy: 'face-shy' };
const JOINTS = ['torso', 'head', 'armL', 'elbowL', 'armR', 'elbowR', 'legL', 'kneeL', 'legR', 'kneeR'];
export type FriendModel = { obj: THREE.Object3D, follow: (mood?: string, riding?: boolean) => void, skin: (hex: string) => void };
/** a copy of the friend's model inside the code person's rig, following its joints. A: the code person (js/avatar.ts) */
export function attachFriendModel(A, id: string, skinHex: string): FriendModel {
  const L = ready[id]; if (!L) return null;
  const obj = L.clone(L.scene); obj.name = 'friend-model';
  const bones: Record<string, THREE.Bone> = {}, faces: Record<string, THREE.Object3D[]> = {}, grips: THREE.Object3D[] = [], skinMats = [];
  obj.traverse((o: any) => {
    if (o.isBone) bones[o.name] = o;
    if (o.isMesh) {
      const n = o.material.name || '';
      if (n.startsWith('face-')) (faces[n] = faces[n] || []).push(o);
      if (n.startsWith('skin')) { o.material = o.material.clone(); skinMats.push(o.material); }
      if (n === 'skin-grip') grips.push(o);
    }
  });
  A.rig.add(obj); A.rig.updateMatrixWorld(true);
  // the rest turn of each joint, the code person's and the model's (both in the rig's space)
  const rigQ = new THREE.Quaternion(), q = new THREE.Quaternion(), rest = {};
  const inRig = (o, out) => { o.getWorldQuaternion(out); return out.premultiply(rigQ.clone().invert()); };
  A.rig.getWorldQuaternion(rigQ);
  for (const j of JOINTS) if (A[j] && bones[j]) rest[j] = { c: inRig(A[j], new THREE.Quaternion()).invert(), b: inRig(bones[j], new THREE.Quaternion()) };
  const order = JOINTS.filter(j => rest[j]);
  let face = '';
  const follow = (mood = 'smile', riding = false) => {
    A.rig.getWorldQuaternion(rigQ); const inv = rigQ.clone().invert(), parentQ = new THREE.Quaternion();
    for (const j of order) {
      const b = bones[j], r = rest[j];
      A[j].getWorldQuaternion(q); q.premultiply(inv).multiply(r.c).multiply(r.b); // the code joint's turn from its rest, on the model's rest
      b.parent.getWorldQuaternion(parentQ); parentQ.premultiply(inv);
      b.quaternion.copy(parentQ.invert().multiply(q));
      b.updateMatrixWorld(true);
    }
    const f = MOOD[mood] || 'face-smile';
    if (f !== face) { face = f; for (const [k, list] of Object.entries(faces)) list.forEach(o => { o.visible = k === f; }); }
    grips.forEach(o => { o.visible = riding; });
  };
  const skin = (hex: string) => skinMats.forEach(m => m.color.set(hex));
  skin(skinHex); follow();
  // the joints are copied just before each drawing, after everything that moves the code person this frame (the walk, a
  // rider's seat, a film's pose): the renderer updates every object's place first, and this copy goes with the model's
  const own = obj.updateMatrixWorld.bind(obj);
  obj.updateMatrixWorld = (force?: boolean) => { if (A.rig.visible) follow(A.life && A.life.mood || 'smile'); own(force); };
  return { obj, follow, skin };
}
