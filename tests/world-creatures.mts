// Check `worldcreatures` (v1.08e creatures, owner 6 Nov 2026 AEDT): the animals, pets and companions made in Blender.
//   1. every creature model (models/world/creature-<kind>.glb) is there, small (15-200 KB), and loads;
//   2. it stands on the ground at the code shape's size and faces the same way (+z), so hit areas stay true (a Meshy
//      companion: the owner's own height, its middle on the code shape's middle);
//   3. it plays its clips: idle, walk (companions: fly), its happy move, follow, cheer and the moods sad, surprised and
//      sleep, and they move its bones; it has a face (two eyes, a closed-eye arc each) and blinks in idle;
//   4. in the valley, an animal near the child changes to its model, and the child's companion gets its model;
//   5. when the models are blocked (no network), the code shapes stay and nothing breaks.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { open } from './harness.mts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ok = (c: unknown, msg: string) => { if (!c) throw new Error(msg); };
const ANIMALS = ['puppy', 'kitty', 'bunny', 'panda', 'joey', 'calf', 'cow', 'sheep', 'pig', 'unicorn', 'chicken', 'bear', 'koala', 'platypus', 'penguin', 'emu', 'turtle', 'elephant', 'crane', 'bull', 'buffalo', 'peacock'];
const COMPANIONS = ['firefly', 'dragon'];
// (Meshy pets, 10 Nov 2026) kinds made with Meshy (js/creatures.ts MESHY_CREATURES, tools/meshy/fit_animal.py): a far model
// and a near one (-hd), bigger than the Blender ones (Meshy's painted picture and its 9k-triangle shape: up to 400 and
// 800 KB, 21,000 triangles with the eyelid pieces: see the triangle rule below), and a painted face whose eyes shut with lid pieces (bones shut0/1,
// joy0/1) instead of the Blender face's eye, lid and upper-lid bones. Everything else is checked the same way.
// (a kind is checked as Meshy when its near model is installed: until the owner approves, the branch keeps the Blender one)
const MESHY = ['puppy', 'dragon', 'firefly'].filter(k => fs.existsSync(path.join(ROOT, 'models/world', `creature-${k}-hd.glb`)));
const SPECBOX: Record<string, any> = {}; try { for (const [k, v] of Object.entries<any>(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/blender/creatures-spec.json'), 'utf8')).companions)) SPECBOX[k] = v.box; } catch { }
const HEIGHT: Record<string, number> = {}; for (const k of MESHY) try { HEIGHT[k] = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/meshy/animal_joints', `${k}.json`), 'utf8')).height; } catch { }

export async function worldCreaturesCheck(b) {
  for (const k of [...ANIMALS, ...COMPANIONS]) {
    const f = path.join(ROOT, 'models/world', `creature-${k}.glb`);
    ok(fs.existsSync(f), `${k}: models/world/creature-${k}.glb is missing (node tools/make-creatures.mts)`);
    const kb = fs.statSync(f).size / 1024, hi = MESHY.includes(k) ? 400 : 200; ok(kb >= 8 && kb <= hi, `${k}: ${Math.round(kb)} KB, outside 8-${hi} KB`);
    if (MESHY.includes(k)) { const h = path.join(ROOT, 'models/world', `creature-${k}-hd.glb`); ok(fs.existsSync(h), `${k}: the near model creature-${k}-hd.glb is missing`);
      const hk = fs.statSync(h).size / 1024; ok(hk >= 8 && hk <= 800, `${k}: near model ${Math.round(hk)} KB, outside 8-800 KB`); }
  }
  // 1-3: each model beside its code shape
  const P = await open(b, { w: 1180, h: 820 });
  try {
    const res = await P.page.evaluate(async ({ ANIMALS, COMPANIONS, MESHY, HEIGHT, SPECBOX }) => {
      const { THREE } = await import(String('/js/gfx.js')), A = await import(String('/js/animals.js')), C = await import(String('/js/companion.js')), K = await import(String('/js/modelkit.js')), CR = await import(String('/js/creatures.js'));
      const bad: string[] = [], info: Record<string, unknown> = {};
      const box = (o: any) => { o.updateMatrixWorld(true); const bx = new THREE.Box3(); o.traverse((m: any) => { if (m.isMesh && m.visible !== false) { if (m.isSkinnedMesh) { m.computeBoundingBox(); bx.union(m.boundingBox.clone().applyMatrix4(m.matrixWorld)); } else bx.expandByObject(m); } }); return bx; };
      for (const k of [...ANIMALS, ...COMPANIONS]) {
        const comp = COMPANIONS.includes(k), m = await K.worldModel(CR.creatureModelName(k));
        if (!m) { bad.push(k + ': did not load'); continue; }
        const code = comp ? C.buildCompanion(k).userData.look : A.filmAnimal(k).userData.rig.root;
        const cb = box(code), mb = box(m.obj), cs = cb.getSize(new THREE.Vector3()), ms = mb.getSize(new THREE.Vector3());
        const size = Math.max(cs.x, cs.y, cs.z);
        let tris = 0; m.obj.traverse((o: any) => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
        info[k] = { tris: Math.round(tris), h: [+cs.y.toFixed(2), +ms.y.toFixed(2)], foot: [+cb.min.y.toFixed(3), +mb.min.y.toFixed(3)] };
        // (12 Nov 2026 AEDT) a Meshy light model: up to 21,000 triangles. Its shut and happy lids need a fine grid (a coarse one
        // let the painted lashes show through, Sparkle 9k body + lids = 19,913); its cost is held by the 400 KB file limit above,
        // and the near model the game shows beside the child has about 38,000. A 7k body to fit 16,000 broke her shut-eye line.
        const maxT = MESHY.includes(k) ? 21000 : 9500; if (tris < 1500 || tris > maxT) bad.push(`${k}: ${Math.round(tris)} triangles (1,500-${maxT})`);
        // the same size (each side within 12 %), the same place, standing on the ground like the code shape
        // (owner, 6 Nov 2026 AEDT, "cuter proportions": bigger heads, chubbier bodies, shorter legs, "the sizes the game uses for
        // touching them adjusted") the height stays the code shape's (within 12 %); width and length may change by up to 30 %
        // (owner, 11 Nov 2026 AEDT) a Meshy companion has the owner's own size (tools/meshy/animal_joints/<kind>.json
        // "height": the dragon a small standing dragon of 0.45 m when first met, as its sheet draws it, not the code's flat
        // dragon with 0.8 m wings) and flies with its middle on the code shape's middle (tools/meshy/fit_animal.py)
        if (comp && MESHY.includes(k)) { const want = HEIGHT[k]; if (!want || Math.abs(ms.y - want) > .12 * want) bad.push(`${k}: height ${ms.y.toFixed(2)} vs the owner's ${want}`);
          const cm = mb.getCenter(new THREE.Vector3()), sb = SPECBOX[k], sc = sb ? new THREE.Vector3().fromArray(sb.min).add(new THREE.Vector3().fromArray(sb.max)).multiplyScalar(.5) : null;   // (its middle on the companion's box in tools/blender/creatures-spec.json, which the fit uses: for Sparkle the code shape's look is only her head, her glow and halo are outside it)
          if (!sc || cm.distanceTo(sc) > .12 * want) bad.push(`${k}: middle at ${cm.toArray().map((v: number) => v.toFixed(3))}, the companion box's at ${sc ? sc.toArray().map((v: number) => v.toFixed(3)) : '?'}`); }
        else {
          for (const ax of ['x', 'y', 'z']) { const tol = ax === 'y' ? .12 : .3; if (Math.abs(ms[ax] - cs[ax]) > Math.max(tol * cs[ax], .04 * size)) bad.push(`${k}: ${ax} size ${ms[ax].toFixed(2)} vs code ${cs[ax].toFixed(2)}`); }
          if (Math.abs(mb.min.y - cb.min.y) > .04 * size) bad.push(`${k}: feet at ${mb.min.y.toFixed(3)}, code shape at ${cb.min.y.toFixed(3)} (floating or sinking)`);
        }
        const cc = cb.getCenter(new THREE.Vector3()), mc = mb.getCenter(new THREE.Vector3());
        if (!(comp && MESHY.includes(k)) && (Math.abs(mc.z - cc.z) > .08 * size || Math.abs(mc.x - cc.x) > .08 * size)) bad.push(`${k}: not where the code shape stands (or facing another way)`);
        // its clips, and that they move it
        const t = (await K.loadWorldModel(CR.creatureModelName(k))) as any, names = t.clips.map((c: any) => c.name);
        const want = (comp ? ['idle', 'fly', 'flap', 'follow', 'cheer'] : ['idle', 'walk', CR.CREATURE_HAPPY[k], 'follow', 'cheer']).concat(['sad', 'surprised', 'sleep']);
        for (const w of want) if (!names.includes(w)) bad.push(`${k}: no clip ${w} (has ${names.join(',')})`);
        let skinned: any = null; m.obj.traverse((o: any) => { if (o.isSkinnedMesh) skinned = o; });
        if (!skinned) { bad.push(k + ': no skeleton'); continue; }
        const pose = () => skinned.skeleton.bones.map((bn: any) => bn.quaternion.toArray().concat(bn.position.toArray()).map((v: number) => v.toFixed(3)).join()).join('|');
        for (const w of want.slice(1)) { m.play(w, 0); K.tickWorldModels(.01); const p0 = pose(); K.tickWorldModels(.23); if (pose() === p0) bad.push(`${k}: clip ${w} does not move`); }
        // the face: two eyes that blink in idle (shut a moment at 1.2 s), and shut asleep
        const bone = (n: string) => skinned.skeleton.bones.find((bn: any) => bn.name === n);
        if (MESHY.includes(k)) {   // (the painted face: the shut lids grow over the eyes for a blink in idle and stay asleep)
          if (!bone('shut0') || !bone('shut1') || !bone('joy0')) bad.push(`${k}: no eyelid pieces`);
          else { m.play('idle', 0); K.tickWorldModels(.01); const open = bone('shut0').scale.y; K.tickWorldModels(1.05); let shut = 0; for (let i = 0; i < 12; i++) { K.tickWorldModels(1 / 60); shut = Math.max(shut, bone('shut0').scale.y); }
            if (!(open < .05 && shut > .8)) bad.push(`${k}: does not blink (lid ${open.toFixed(2)} then ${shut.toFixed(2)})`);
            m.play('sleep', 0); K.tickWorldModels(.01); K.tickWorldModels(.3); if (!(bone('shut0').scale.y > .8 && bone('shut1').scale.y > .8)) bad.push(`${k}: eyes not shut asleep`); }
        } else if (!bone('eye0') || !bone('eye1') || !bone('lid0')) bad.push(`${k}: no face (eyes ${!!bone('eye0')},${!!bone('eye1')})`);
        else {
          m.play('idle', 0); K.tickWorldModels(.01); const open = bone('eye0').scale.y; K.tickWorldModels(1.05); let shut = 1; for (let i = 0; i < 12; i++) { K.tickWorldModels(1 / 60); shut = Math.min(shut, bone('eye0').scale.y); }
          if (!(open > .8 && shut < .3)) bad.push(`${k}: does not blink (eye ${open.toFixed(2)} then ${shut.toFixed(2)})`);
          // (owner via Release, 6 Nov 2026 AEDT) soft eyes with an upper lid that comes all the way down when it blinks
          const ul = bone('ulid0'); if (!ul) bad.push(`${k}: no upper eyelid`);
          else { m.play('idle', 0); K.tickWorldModels(.01); const p0 = ul.position.clone(); K.tickWorldModels(1.05); let far = 0; for (let i = 0; i < 12; i++) { K.tickWorldModels(1 / 60); far = Math.max(far, ul.position.distanceTo(p0)); } if (!(far > .005)) bad.push(`${k}: the eyelid does not come down to blink`); }
          m.play('sleep', 0); K.tickWorldModels(.01); K.tickWorldModels(.3); if (!(bone('eye0').scale.y < .2 && bone('lid0').scale.y > .8)) bad.push(`${k}: eyes not shut asleep`);
        }
        m.stop();
      }
      return { bad, info };
    }, { ANIMALS, COMPANIONS, MESHY, HEIGHT, SPECBOX });
    ok(!res.bad.length, res.bad.join('; '));
    // 4: in the valley, an animal near the child, and the child's companion
    const live = await P.page.evaluate(async () => {
      const G = (window as any).__sv; if (G.areas && G.areas.all) await G.areas.all();
      const animals: any[] = []; G.scene.traverse((o: any) => { if (o.userData && o.userData.rig && o.userData.rig.root && o.parent === G.scene) animals.push(o); });
      if (!animals.length) return { err: 'no animal in the valley' };
      const a = animals[0], h = G.heroes[0]; h.pos.x = a.position.x + 2.5; h.pos.z = a.position.z + 2.5;
      const L = h.profile.lanterns = h.profile.lanterns || {}; L.companion = 'dragon';
      const comps = G.lanterns && G.lanterns.companions; if (comps) comps.sync();
      for (let i = 0; i < 200; i++) {
        const c = comps && comps.of(h);
        if (a.userData.rig.model && (!comps || (c && c.model))) break;
        await new Promise(r => setTimeout(r, 100));
      }
      const c = comps && comps.of(h);
      return { kind: a.userData.rig.kind, model: !!a.userData.rig.model, rootHidden: a.userData.rig.root.visible === false, clip: a.userData.rig.clip, comp: comps ? !!(c && c.model && c.o.userData.look.visible === false) : 'no companions', count: animals.length };
    });
    ok(!live.err, live.err);
    ok(live.model && live.rootHidden, `the ${live.kind} near the child did not change to its model: ${JSON.stringify(live)}`);
    ok(live.comp === true || live.comp === 'no companions', `the child's companion did not get its model: ${JSON.stringify(live)}`);
    ok(!P.errors.length, P.errors.join('; '));
    console.log('  worldcreatures: 24 models', JSON.stringify(res.info.puppy), 'valley:', JSON.stringify(live));
  } finally { await P.ctx.close(); }
  // 5: the models blocked: the code shapes stay
  const Q = await open(b, { w: 390, h: 844, touch: true, route: async ctx => { await ctx.route('**/models/world/creature-*.glb', r => r.abort()); } });
  try {
    const off = await Q.page.evaluate(async () => {
      const G = (window as any).__sv; if (G.areas && G.areas.all) await G.areas.all();
      const animals: any[] = []; G.scene.traverse((o: any) => { if (o.userData && o.userData.rig && o.userData.rig.root && o.parent === G.scene) animals.push(o); });
      if (!animals.length) return { err: 'no animal in the valley' };
      const a = animals[0], h = G.heroes[0]; h.pos.x = a.position.x + 2.5; h.pos.z = a.position.z + 2.5;
      for (let i = 0; i < 60 && !a.userData.rig.asked; i++) await new Promise(r => setTimeout(r, 100));
      await new Promise(r => setTimeout(r, 2500));
      return { asked: !!a.userData.rig.asked, model: !!a.userData.rig.model, root: a.userData.rig.root.visible !== false };
    });
    ok(!off.err, off.err);
    ok(off.asked && !off.model && off.root, `blocked models: the code shape should stay: ${JSON.stringify(off)}`);
    const errs = Q.errors.filter(e => !/creature-|world model/.test(e));
    ok(!errs.length, errs.join('; '));
  } finally { await Q.ctx.close(); }
}
