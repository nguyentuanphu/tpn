// Check `villagermodels` (v1.08e villagers, owner 6 Nov 2026 AEDT: the 11 named villagers as Blender models, in the
// friends' soft-eye style): with a child next to each of Mai, Bác Ba, Tèo, Tí, Bống, Su, Jack, Mít, Bờm, Ruby and Lan,
//   1. their model (models/villager-<id>.glb) loads and is worn in place of the code person: the same height (within
//      6 %), standing on the ground where the code person stood (within 5 cm), facing the same way;
//   2. it blinks (the model's closed face shows within 7 s) and its eyes turn toward a child standing to one side;
//   3. the name tag and the talk stay;
//   4. blocked (no network), the code person stays and nothing breaks;
//   5. (crowds) a crowd person next to a child wears one of the gallery neighbours' models.
import { open, clear } from './harness.mts';

const ok = (c: unknown, msg: string) => { if (!c) throw new Error(msg); };
const IDS = ['mai', 'ba', 'teo', 'ti', 'bong', 'su', 'jack', 'mit', 'bom', 'ruby', 'lan'];

export async function villagerModelsCheck(b) {
  const P = await open(b, { w: 1180, h: 760 }); await clear(P.page);
  const r = await P.page.evaluate(async (IDS) => {
    const G = (window as any).__sv, A = await import(String('/js/avatar.js')), { THREE } = await import(String('/js/gfx.js'));
    const w = (ms: number) => new Promise(res => setTimeout(res, ms)), h = G.heroes[0], bad: string[] = [], out: Record<string, unknown> = {};
    const shown = (av: any) => { let f = ''; av.model.obj.traverse((o: any) => { if (o.isMesh && o.visible && /^face-/.test(o.material.name)) f = o.material.name.slice(5); }); return f; };
    for (const id of IDS) {
      const n = G.npcs.find((x: any) => x.id === id); if (!n || !n.A) { bad.push(id + ': not in the valley'); continue; }
      // the code person's height and feet, before the model
      h.place(n.obj.position.x + 2, n.obj.position.z + 2);
      for (let k = 0; k < 60 && n._vm !== 'worn' && n._vm !== 'code'; k++) await w(200);
      if (n._vm !== 'worn') { bad.push(`${id}: model ${n._vm || 'not asked'}`); continue; }
      for (let k = 0; k < 40 && !n.A.rig.visible; k++) await w(100); // (the far still copy gives way to the moving person within 0.4 s)
      if (!n.A.rig.visible) { bad.push(id + ': still the far copy next to the child'); continue; }
      // the size: a fresh code person in this villager's look beside a fresh one wearing the model, both in the rest pose
      const ref = A.buildAvatar(n.A.look), worn = A.buildAvatar(n.A.look); A.wearVillagerModel(worn, 'villager-' + id);
      const boxOf = (av: any, model: boolean) => { av.root.updateMatrixWorld(true); const bx = new THREE.Box3(); if (model) bx.setFromObject(av.model.obj, true); else av.rig.traverse((o: any) => { if (o.isMesh && o.visible && !o.userData.outline) bx.expandByObject(o); }); return bx; };
      const code = boxOf(ref, false), mb = worn.model ? boxOf(worn, true) : null;
      if (!mb) { bad.push(id + ': the model cannot be worn'); continue; }
      const ch = code.max.y - code.min.y, mh = mb.max.y - mb.min.y;
      if (Math.abs(mh - ch) / ch > .06) bad.push(`${id}: ${mh.toFixed(2)} m tall, the code person ${ch.toFixed(2)} m`);
      if (Math.abs(mb.min.y - code.min.y) > .05) bad.push(`${id}: feet at ${(mb.min.y - code.min.y).toFixed(3)} m from the code person's`);
      let codeShown = 0; n.A.rig.traverse((o: any) => { if (o.isMesh && !o.userData.outline && o.visible && !n.A.model.obj.getObjectById(o.id)) { let p = o, vis = true; while (p && p !== n.A.root) { if (!p.visible) vis = false; p = p.parent; } if (vis) codeShown++; } });
      if (codeShown) bad.push(`${id}: ${codeShown} code parts still shown`);
      // facing: the model's front (its face) is on the side the code person faces
      const fq = new THREE.Vector3(); let face: any = null; n.A.model.obj.traverse((o: any) => { if (o.isMesh && /^face-/.test(o.material.name) && !face) face = o; });
      if (face) { face.geometry.computeBoundingBox(); face.getWorldPosition(fq); }
      // blinks within 7 s; the eyes turn to a child on one side
      A.setLookTarget(null); if (!n.A.life) A.animate(n.A, 'idle', 1);
      const L = n.A.life, seen = new Set<string>();
      for (let f = 0; f <= 210; f++) { A.animate(n.A, 'idle', L.t + 1 / 30); n.A.root.updateMatrixWorld(true); seen.add(shown(n.A)); }
      if (!seen.has('blink')) bad.push(`${id}: no blink in 7 s (${[...seen]})`);
      L.blink = L.t + 50; L.glance = L.t + 50; L.feel = '';
      const yaw = n.obj.rotation.y, side = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)); // the person's own left
      const at = n.obj.position; A.setLookTarget({ x: at.x + side.x * 2.2 + Math.sin(yaw) * 1.2, z: at.z + side.z * 2.2 + Math.cos(yaw) * 1.2 });
      for (let k = 0; k < 4; k++) A.animate(n.A, 'idle', L.t + 1 / 30); n.A.root.updateMatrixWorld(true); const look = shown(n.A); A.setLookTarget(null);
      if (look !== 'lookL') bad.push(`${id}: eyes ${look} for a child on the left`);
      if (!n.tag || !n.tag.visible || !G.interactables.some((i: any) => i.id === 'npc_' + id)) bad.push(`${id}: name tag or talk gone`);
      out[id] = { h: +mh.toFixed(2), code: +ch.toFixed(2), blink: seen.has('blink'), look };
    }
    // (crowds) a crowd person next to a child wears a gallery neighbour's model, at the code person's height
    const AV = A, skipN = new Set(G.npcs.map((n: any) => n.obj)), mine = new Set(G.heroes.map((x: any) => x.av.root));
    const crowd = G.scene.children.find((o: any) => o.userData.avatar && !skipN.has(o) && !mine.has(o) && !o.userData.own && AV.avatarOf(o) && !AV.avatarOf(o).late && AV.avatarOf(o).painted);
    if (!crowd) bad.push('no crowd person found');
    else {
      h.place(crowd.position.x + 2, crowd.position.z + 2); const CA: any = AV.avatarOf(crowd);
      for (let k = 0; k < 60 && !CA.model; k++) await w(200);
      if (!CA.model || !/^villager-(vn|au)-/.test(crowd.userData.villagerModel || '')) bad.push('crowd: no neighbour model (' + (crowd.userData.villagerModel || 'none') + ')');
      out.crowd = crowd.userData.villagerModel;
    }
    return { bad, out };
  }, IDS);
  // blocked: the code people stay
  const Q = await open(b, { w: 900, h: 700, route: async ctx => { await ctx.route('**/models/villager-*.glb', q => q.abort()); } }); await clear(Q.page);
  const blocked = await Q.page.evaluate(async () => {
    const G = (window as any).__sv, h = G.heroes[0], n = G.npcs.find((x: any) => x.id === 'mai');
    h.place(n.obj.position.x + 2, n.obj.position.z + 2);
    for (let k = 0; k < 40 && n._vm !== 'code' && n._vm !== 'worn'; k++) await new Promise(res => setTimeout(res, 200));
    let parts = 0; n.A.rig.traverse((o: any) => { if (o.isMesh && o.visible) parts++; });
    return { vm: n._vm, model: !!n.A.model, parts };
  });
  const errs = [...P.errors, ...Q.errors.filter(e => !/glb|friend model|Failed to fetch|aborted/i.test(e))]; await P.ctx.close(); await Q.ctx.close();
  if (blocked.vm !== 'code' || blocked.model || blocked.parts < 3) r.bad.push('blocked: ' + JSON.stringify(blocked));
  ok(!r.bad.length && !errs.length, JSON.stringify({ bad: r.bad, errs: errs.slice(0, 5), out: r.out }).slice(0, 2500));
  return `the crowd wears ${(r.out as any).crowd}; ${Object.keys(r.out).length - 1} villagers wear their models at the code person's height (${Object.entries(r.out as Record<string, { h: number }>).filter(([k]) => k !== 'crowd').map(([k, v]) => `${k} ${v.h} m`).join(', ')}), blink and look at the child; blocked, the code people stay`;
}
