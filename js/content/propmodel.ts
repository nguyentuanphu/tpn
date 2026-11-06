// (v1.08g props, owner 6 Nov 2026 AEDT) The Blender model of a story or street prop in its code shape's place
// (models/world/<name>.glb, tools/blender/world-props.py). In the valley it comes when a child is near (worldTag, read by
// js/modelkit.ts); in a film (now) it comes at once, as the film has no child walking near it. The code shape stays as
// the fallback: drawn until the model has arrived, and for good when it cannot load.
import { THREE, worldTag } from '../gfx.js';

export function propModel<T extends THREE.Object3D>(fallback: T, name: string, now = false): T {
  if (!now) return worldTag(fallback, name);
  import('../modelkit.js').then(async K => {
    const m = await K.worldModel(name);
    if (!m || !fallback.parent) return;
    m.obj.position.copy(fallback.position); m.obj.quaternion.copy(fallback.quaternion); m.obj.scale.copy(fallback.scale);
    m.obj.traverse(o => { o.userData.noSolid = true; });
    m.obj.userData.fallback = fallback; m.obj.userData.worldTag = name; fallback.userData.model = m;
    fallback.parent.add(m.obj); fallback.visible = false;
  }).catch(() => { });
  return fallback;
}
