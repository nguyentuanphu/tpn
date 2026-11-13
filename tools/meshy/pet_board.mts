// (13 Nov 2026, the owner's approval gate: "chỉ đưa bản tốt nhất") boards of a pet for review before asking the owner:
// every picture drawn at 1024 px on an open stage of flat grass with the game's own lights, the pet's near (HD) model
// in the game, each move asked for as the game asks (rig want).
//   cd tests; SV_URL=http://localhost:8777/ node ../tools/meshy/pet_board.mts <out dir> <kind>
// Writes <out>/<kind>/<mood>-<view>.jpg (1024 px) and boards <out>/<kind>-face-<mood>.jpg (8 views, 4 x 2 at 512 px) and
// <out>/<kind>-body.jpg (poses, neck, back of the head). Face views: straight, +-.4, +-.7, both sides, from above and
// below. Moods: open (idle), shut (sleep), happy (its happy move), sad, surprised, cheer.
import { createRequire } from 'node:module';
import { open, clear } from '../../tests/harness.mts';
import { writeFileSync, mkdirSync } from 'node:fs';
const { chromium } = createRequire(new URL('../../tests/package.json', import.meta.url))('playwright');
const [OUT, KIND = 'puppy'] = process.argv.slice(2);
mkdirSync(`${OUT}/${KIND}`, { recursive: true });
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const _nc = b.newContext.bind(b); b.newContext = async (o: any) => { const c = await _nc(o); c.setDefaultNavigationTimeout(240000); c.setDefaultTimeout(240000); return c; };
const P = await open(b, { w: 900, h: 700, fast: false }); await clear(P.page);
const setup = await P.page.evaluate(async ([kind]) => {
  const G = (window as any).__sv, h = G.heroes[0];
  const go = () => { document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; }; go();
  h.profile.pets = [{ kind, name: '' }]; G.pets.sync();
  let L: any = null; for (let i = 0; i < 300; i++) { go(); await new Promise(r => setTimeout(r, 200)); L = G.pets.live()[0]; const r = L && L.obj.userData.rig; if (r && r.model && r.hd) break; }
  const r = L && L.obj.userData.rig; if (!r || !r.model) return { error: 'no model' };
  (window as any).__brd = { L, h, t: 100 };
  const { CREATURE_HAPPY } = await import(String('/js/creatures.js'));
  return { ok: true, happy: CREATURE_HAPPY[kind] || 'hop' };
}, [KIND] as any);
console.log(KIND, JSON.stringify(setup)); if (!(setup as any).ok) process.exit(1);
await P.page.clock.install(); await P.page.clock.pauseAt(Date.now() + 2000);
// pose: [name, clip, seconds into the clip]
const happy = (setup as any).happy;
const MOODS: [string, string, number][] = [['open', 'idle', .6], ['shut', 'sleep', 1.0], ['happy', happy, .9], ['sad', 'sad', 1.0], ['surprised', 'surprised', .4], ['cheer', 'cheer', .5]];
const FACE: [string, number, number][] = [['straight', 0, 0], ['left.4', .4, 0], ['right.4', -.4, 0], ['left.7', .7, 0], ['right.7', -.7, 0], ['sideL', 1.57, 0], ['sideR', -1.57, 0], ['above', 0, .45], ['below', 0, -.4]];
const BODY: [string, string, number, string][] = [['idle-side', 'idle', .6, 'side'], ['idle-tq', 'idle', .6, 'tq'], ['sit-tq', 'sit', 2, 'tq'], ['beg-tq', 'beg', .8, 'tq'],
  ['run-side', 'run', .2, 'side'], ['jump-side', 'jump', .55, 'side'], ['bounce-side', 'bounce', .3, 'side'], ['scratch-tq', 'scratch', .5, 'tq'],
  ['dig-side', 'dig', .3, 'side'], ['sleep-tq', 'sleep', 1, 'tq'], ['neck-side', 'idle', 2.2, 'neck'], ['head-back', 'idle', .6, 'back']];
async function shot(clip: string, at: number, views: [string, number, number, string?][], face: boolean) {
  return await P.page.evaluate(async ([clip, at, views, face]) => {
    const G = (window as any).__sv, F = (window as any).__brd, { THREE } = await import(String('/js/gfx.js')), { L, h } = F;
    document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false;
    const r = L.obj.userData.rig; if (!(r.model.has && r.model.has(clip))) return { missing: clip };
    // (from rest into the clip: the move asked for, the world stepped to the moment wanted)
    const dt = 1 / 30; for (let k = 0; k < Math.round((at + .35) / dt); k++) { L.want = clip; L.wantT = 5; L.obj.position.set(h.pos.x + 1.2, h.pos.y, h.pos.z + 1.2); L.obj.rotation.y = h.yaw; F.t += dt; G.world.update(dt, F.t); }
    let top = h.av.root; while (top.parent) top = top.parent;
    if (!F.stage) { const st = new THREE.Scene(); st.background = new THREE.Color(0xcfe3f2);
      top.traverse((q: any) => { if (q.isLight) { const c = q.clone(); if (q.target) { c.target = q.target.clone(); st.add(c.target); } st.add(c); } });
      const gr = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({ color: 0x7fb069 })); gr.rotation.x = -Math.PI / 2; st.add(gr); F.stage = st; F.ground = gr; }
    const o = L.obj, par = o.parent, st = F.stage; F.ground.position.set(o.position.x, o.position.y - .002, o.position.z); st.add(o); o.updateMatrixWorld(true);
    const hid: any[] = []; o.traverse((q: any) => { if (q.isSprite && q.visible) { q.visible = false; hid.push(q); } });
    const R = G.renderer, W = 1024, out: any = {};
    const SRGB = new Uint8Array(256).map((_, i) => { const v = i / 255; return Math.round(255 * (v <= .0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - .055)); });
    const grab = (cam: any) => { const rt = new THREE.WebGLRenderTarget(W, W, { samples: 4 }); R.setRenderTarget(rt); R.clear(); R.render(st, cam); const px = new Uint8Array(W * W * 4); R.readRenderTargetPixels(rt, 0, 0, W, W, px); R.setRenderTarget(null); rt.dispose();
      const cv = document.createElement('canvas'); cv.width = W; cv.height = W; const x = cv.getContext('2d')!; const im = x.createImageData(W, W);
      for (let yy = 0; yy < W; yy++) for (let xx = 0; xx < W; xx++) { const s = ((W - 1 - yy) * W + xx) * 4, d = (yy * W + xx) * 4; im.data[d] = SRGB[px[s]]; im.data[d + 1] = SRGB[px[s + 1]]; im.data[d + 2] = SRGB[px[s + 2]]; im.data[d + 3] = 255; }
      x.putImageData(im, 0, 0); return cv.toDataURL('image/jpeg', .92); };
    const model = r.model.obj, head = model.getObjectByName('head'), box = new THREE.Box3().setFromObject(model, true), cc = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()).length();
    const hq = head.getWorldQuaternion(new THREE.Quaternion()), fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(hq); fwd.y = 0; fwd.normalize();
    const bb = model.getObjectByName('body') || model, bfwd = new THREE.Vector3(0, 0, 1).applyQuaternion(bb.getWorldQuaternion(new THREE.Quaternion())); bfwd.y = 0; bfwd.normalize();   // (the body bone's own front: the pet's group turned as it followed, and side views showed its back)
    // (the face: the middle of the two eyes when the model has them as bones, else in front of the head bone)
    const e0 = model.getObjectByName('shut0'), e1 = model.getObjectByName('shut1');
    const fc = e0 && e1 ? e0.getWorldPosition(new THREE.Vector3()).add(e1.getWorldPosition(new THREE.Vector3())).multiplyScalar(.5) : head.getWorldPosition(new THREE.Vector3());
    const fr = e0 && e1 ? e0.getWorldPosition(new THREE.Vector3()).distanceTo(e1.getWorldPosition(new THREE.Vector3())) : size * .12;
    for (const [name, yaw, pitch, kind] of views as any[]) {
      const cam = new THREE.PerspectiveCamera(30, 1, .01, 100);
      if (face) { const dir = fwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw); dir.applyAxisAngle(new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize(), pitch); dir.normalize();
        cam.position.copy(fc).addScaledVector(dir, fr * 7.5); cam.lookAt(fc.clone().add(new THREE.Vector3(0, -fr * .2, 0))); }
      else { const a = kind === 'side' ? Math.PI / 2 : kind === 'back' ? Math.PI : kind === 'neck' ? 2.2 : .8; const dir = bfwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a); dir.y = kind === 'back' || kind === 'neck' ? .25 : .18; dir.normalize();
        const tgt = kind === 'back' || kind === 'neck' ? head.getWorldPosition(new THREE.Vector3()) : cc; cam.position.copy(tgt).addScaledVector(dir, kind === 'back' || kind === 'neck' ? size * .9 : size * 1.55); cam.lookAt(tgt); }
      cam.updateMatrixWorld(true); out[name] = grab(cam); }
    hid.forEach(q => { q.visible = true; }); par.add(o); o.updateMatrixWorld(true);
    return out;
  }, [clip, at, views, face] as any);
}
const save = (name: string, url: string) => writeFileSync(`${OUT}/${KIND}/${name}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
for (const [mood, clip, at] of MOODS) {
  let res: any = null; for (let a = 0; a < 3 && !res; a++) { try { res = await shot(clip, at, FACE as any, true); } catch (e) { console.log('retry', mood, String(e).slice(0, 80)); } }
  if (!res || res.missing) { console.log('missing', mood, clip); continue; }
  for (const [name] of FACE) save(`face-${mood}-${name}`, res[name]);
  console.log('face', mood);
}
for (const [name, clip, at, kind] of BODY) {
  let res: any = null; for (let a = 0; a < 3 && !res; a++) { try { res = await shot(clip, at, [[name, 0, 0, kind]] as any, false); } catch (e) { console.log('retry', name, String(e).slice(0, 80)); } }
  if (!res || res.missing) { console.log('missing', name, clip); continue; }
  save(`body-${name}`, res[name]); console.log('body', name);
}
await b.close();
console.log('board', `${OUT}/${KIND}`);
