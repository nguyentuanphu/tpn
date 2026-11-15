// (sol-eyes, 15 Nov 2026) Sol's face the way the player sees it, for the new face-UV eyes against the old pieces.
//   cd tests; SV_URL=http://localhost:8797/ node ../tools/meshy/soleyes/shots.mts <out dir> <new|old> [device|close|both]
// old: models/sol-hd.glb is answered with the model as it was before (OLD_GLB, default the production model), same game code.
// device: the game's own camera at its own distance on a phone (390x844), a tablet (820x1180) and a computer (1280x800), as
//   tests/festival-models.mts shoots them; Sol stands where the child stands, turned to the camera by yaw 0, +-.4, +-.7,
//   in every mood. Writes <dev>-<mood>-y<yaw>.png (the head, cut out of the screen at its real size) and <dev>-full.png.
// close: 1024 px close-ups of the head, every mood at yaw -.7 .. .7 and both sides (like game_shots.mts gate).
import { createRequire } from 'node:module';
import { open, clear } from '../../../tests/harness.mts';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
const { chromium } = createRequire(new URL('../../../tests/package.json', import.meta.url))('playwright');
const [OUT, WHICH = 'new', WHAT = 'both'] = process.argv.slice(2);
const OLD_GLB = process.env.OLD_GLB || 'D:/WorkSpace/meshy/fitted/sol-own/sol-dressed-hd-packed.glb';
mkdirSync(OUT, { recursive: true });
const MOODS = ['smile', 'blink', 'half', 'happy', 'o', 'sad', 'lookL', 'lookR', 'excited'];
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const old = async (ctx: any) => { if (WHICH === 'old') await ctx.route('**/models/sol-hd.glb', (r: any) => r.fulfill({ body: readFileSync(OLD_GLB), contentType: 'model/gltf-binary' })); };
const setup = async (page: any) => page.evaluate(async () => {
  const G = (window as any).__sv, A = await import(String('/js/avatar.js'));
  await A.loadFriendModels('sol'); await A.loadFriendModels('sol-hd');
  const h = G.heroes[0], av: any = A.buildAvatar({ set: 'boy', friend: 'sol', skin: '#f6c7a5' }, null, { hd: true });
  A.showHD(av, true); G.scene.add(av.root);
  av.root.position.copy(h.av.root.position); A.animate(av, 'idle', 1); (window as any).__sol = av; await new Promise(r => setTimeout(r, 1500)); return !!av.modelHD;
});
const pose = async (page: any, m: string, yaw: number, cam: boolean) => page.evaluate(async ([m, yaw, cam]: any) => {
  const G = (window as any).__sv, av = (window as any).__sol, h = G.heroes[0], { THREE } = await import(String('/js/gfx.js'));
  document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; G.world.time = .42;
  h.av.root.visible = false; av.root.position.copy(h.av.root.position);
  // (the game's own culling and near/far model switch dropped Sol after a few shots: kept drawn, high detail)
  if (!av.root.parent) G.scene.add(av.root); av.root.visible = true; av.root.traverse((o: any) => o.layers.set(0)); av.modelHD.obj.visible = true; if (av.model) av.model.obj.visible = false; av._hd = true;
  const c = h.cam || G.camera; const dx = c.position.x - av.root.position.x, dz = c.position.z - av.root.position.z;
  av.root.rotation.y = Math.atan2(dx, dz) + yaw;
  if (av.life) { av.life.mood = m; av.life.blink = av.life.t + 60; av.life.glance = av.life.t + 60; av.life.feel = ''; } av.modelHD.follow(m);
  await new Promise(r => setTimeout(r, 350));
  if (!cam) return null;
  let head: any = null; av.modelHD.obj.traverse((o: any) => { if (o.isBone && o.name === 'head') head = o; });
  const p = head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, .12, 0)), q = p.clone().project(c), q2 = p.clone().add(new THREE.Vector3(0, .25, 0)).project(c);
  const r = G.renderer.domElement.getBoundingClientRect();
  return { x: r.left + (q.x + 1) / 2 * r.width, y: r.top + (1 - q.y) / 2 * r.height, s: Math.abs(q2.y - q.y) / 2 * r.height, dist: c.position.distanceTo(p) };
}, [m, yaw, cam]);
if (WHAT === 'device' || WHAT === 'both') for (const dev of [{ name: 'phone', w: 390, h: 844, touch: true }, { name: 'tablet', w: 820, h: 1180, touch: true }, { name: 'computer', w: 1280, h: 800, touch: false }]) {
  const P = await open(b, { w: dev.w, h: dev.h, touch: dev.touch, fast: false, pre: null, route: old }); await clear(P.page);
  if (!await setup(P.page)) throw new Error('no Sol HD model');
  let first = true;
  for (const m of MOODS) for (const yaw of [-.7, -.4, 0, .4, .7]) {
    const r: any = await pose(P.page, m, yaw, true);
    const half = Math.max(24, Math.round(r.s * 1.1));
    const clip = { x: Math.max(0, r.x - half), y: Math.max(0, r.y - half), width: half * 2, height: half * 2 };
    writeFileSync(`${OUT}/${dev.name}-${m}-y${yaw}.png`, await P.page.screenshot({ clip }));
    if (first) { writeFileSync(`${OUT}/${dev.name}-full.png`, await P.page.screenshot()); console.log(dev.name, 'camera distance', r.dist.toFixed(2), 'm, head', Math.round(r.s), 'px'); first = false; }
  }
  await P.ctx.close();
}
if (WHAT === 'close' || WHAT === 'both') {
  const P = await open(b, { w: 900, h: 700, fast: false, route: old }); await clear(P.page);
  await setup(P.page);
  const shots: Record<string, string> = await P.page.evaluate(async (MOODS: string[]) => {
    const G = (window as any).__sv, av = (window as any).__sol, h = G.heroes[0], R = G.renderer, { THREE } = await import(String('/js/gfx.js')), out: Record<string, string> = {};
    const top = G.scene; h.av.root.visible = false; G.paused = false; G.world.time = .42; if (!av.root.parent) G.scene.add(av.root); av.root.visible = true; av.modelHD.obj.visible = true; if (av.model) av.model.obj.visible = false; await new Promise(r => setTimeout(r, 400));
    av.root.position.set(h.pos.x + 3, h.av.root.position.y, h.pos.z + 3); av.root.rotation.y = 0;
    const M = av.modelHD;
    const grab = (name: string, cam: any, W = 1024, H = 1024) => {
      const rt = new THREE.WebGLRenderTarget(W, H); R.setRenderTarget(rt); R.clear(); R.render(top, cam);
      const px = new Uint8Array(W * H * 4); R.readRenderTargetPixels(rt, 0, 0, W, H, px); R.setRenderTarget(null); rt.dispose();
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d')!, im = x.createImageData(W, H);
      for (let y = 0; y < H; y++) im.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4); x.putImageData(im, 0, 0);
      out[name] = cv.toDataURL('image/png');
    };
    const shot = (name: string, side: number) => {
      av.root.updateMatrixWorld(true); let head: any = null; M.obj.traverse((o: any) => { if (o.isBone && o.name === 'head') head = o; });
      const box = new THREE.Box3().setFromObject(M.obj, true), Hh = box.max.y - box.min.y;
      const at = head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, .12, 0));
      const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), side);
      const cam = new THREE.PerspectiveCamera(28, 1, .05, 200); cam.position.copy(at).addScaledVector(fwd, Hh * .75); cam.lookAt(at); grab(name, cam);
    };
    for (const m of MOODS) {
      if (av.life) { av.life.mood = m; av.life.blink = av.life.t + 60; av.life.glance = av.life.t + 60; av.life.feel = ''; } M.follow(m);
      for (const s of [-1.2, -.7, -.4, 0, .4, .7, 1.2]) shot(`close-${m}-y${s}`, s);
    }
    return out;
  }, MOODS);
  for (const [k, v] of Object.entries(shots)) writeFileSync(`${OUT}/${k}.png`, Buffer.from(v.split(',')[1], 'base64'));
  await P.ctx.close();
}
console.log('done', OUT);
await b.close();
