// (Meshy companions, 11 Nov 2026, owner: "Cho anh xem cả 2 bay và bay nhanh như thế nào, chụp xa và gần và các angles ...
// Cả 2 múa lộn các kiểu thì ra sao?") Films of the child's companion moving in the game, drawn by the game itself.
//   cd tests; SV_URL=http://localhost:8777/ node ../tools/meshy/companion_film.mts <out dir> <kind> [far]
// The page's clock is held (Playwright clock) and stepped 1/15 s at a time, so every frame is one even step of game time
// however busy the machine is. Each frame has six views: near from the front, three-quarter, side and back (following the
// companion), the child's own game camera, and from 12 m away. Parts: hovering beside the still child, flying after the
// child walking, flying fast after the child running, a loop-the-loop, a spin. "far" swaps in the light model
// (creature-<kind>.glb) instead of the near one, to compare. Writes <out>/<kind>[-far].mp4 and its frames.
import { createRequire } from 'node:module';
import { open, clear } from '../../tests/harness.mts';
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const { chromium } = createRequire(new URL('../../tests/package.json', import.meta.url))('playwright');
const [OUT, KIND = 'firefly', LOD = ''] = process.argv.slice(2);
const FFMPEG = 'C:/Users/nguye/tools/ffmpeg/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe';
const name = KIND + (LOD === 'far' ? '-far' : ''), dir = `${OUT}/${name}-frames`; mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const _nc = b.newContext.bind(b); b.newContext = async (o: any) => { const c = await _nc(o); c.setDefaultNavigationTimeout(240000); c.setDefaultTimeout(240000); return c; };
const P = await open(b, { w: 900, h: 700, fast: false }); await clear(P.page);
P.page.on('pageerror', e => console.log('pageerror', e.message));
// the companion, its model (and the light one for "far"), no hat, level 1 as when first met
const setup = await P.page.evaluate(async ([kind, lod]) => {
  const G = (window as any).__sv, h = G.heroes[0], C = await import(String('/js/custom.js')), K = await import(String('/js/modelkit.js'));
  const go = () => { document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; }; go();
  C.CUSTOM.features = { ...(C.CUSTOM.features || {}), companionGrow: true };
  const L = h.profile.lanterns = h.profile.lanterns || {}; L.companion = kind; L.pet = L.pet || {}; L.pet.feeds = 0; L.pet.hat = null;
  const comps = G.lanterns.companions; comps.sync();
  let c: any = null; for (let i = 0; i < 200; i++) { go(); await new Promise(r => setTimeout(r, 200)); c = comps.of(h); if (c && c.model) break; }
  if (!c || !c.model) return { error: 'no model' };
  if (lod === 'far') { const m = await K.worldModel('creature-' + kind, { clip: 'idle' }); if (!m) return { error: 'no far model' };
    c.model.obj.parent.remove(c.model.obj); c.o.userData.body.add(m.obj); c.model = m; c.clip = ''; }
  (window as any).__film = { c, h, start: { x: h.pos.x, y: h.pos.y, z: h.pos.z, yaw: h.yaw } };
  let tris = 0; c.model.obj.traverse((o: any) => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  return { ok: true, tris: Math.round(tris), meshy: (() => { let p = false; c.model.obj.traverse((o: any) => { if (o.isMesh && /^meshy-/.test(o.material?.name || '')) p = true; }); return p; })() };
}, [KIND, LOD] as any);
console.log(name, JSON.stringify(setup)); if (!(setup as any).ok) process.exit(1);
await P.page.clock.install(); await P.page.clock.pauseAt(Date.now() + 2000);
const FPS = 15, STEP = 1000 / FPS;
// parts: [title, seconds, child's speed (m/s), trick]
const PARTS: [string, number, number, string][] = [['hover', 2, 0, ''], ['walk', 3, 2.5, ''], ['run', 3, 7, ''], ['loop', 2.2, 0, 'loop'], ['spin', 2.2, 0, 'spin']];
let n = 0;
for (const [title, secs, speed, trick] of PARTS) {
  await P.page.evaluate(([trick]) => { const F = (window as any).__film, G = (window as any).__sv; F.h.pos.set(F.start.x, F.start.y, F.start.z); F.h.yaw = F.start.yaw;
    if (trick) G.lanterns.companions.trick(F.h, trick); }, [trick] as any);
  for (let f = 0; f < secs * FPS; f++) {
    await P.page.clock.runFor(STEP);
    const url = await P.page.evaluate(async ([speed, title, dt]) => {
      const G = (window as any).__sv, F = (window as any).__film, { THREE } = await import(String('/js/gfx.js')), { c, h } = F;
      document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false;
      if (speed) { h.pos.x += Math.sin(h.yaw) * speed * dt; h.pos.z += Math.cos(h.yaw) * speed * dt; h.state = speed > 4 ? 'run' : 'walk'; }
      const R = G.renderer; let top = h.av.root; while (top.parent) top = top.parent;
      const o = c.o; o.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(c.model.obj, true), cc = box.getCenter(new THREE.Vector3()), rr = Math.max(.5, box.getSize(new THREE.Vector3()).length());
      const W = 300, cv = document.createElement('canvas'); cv.width = W * 3; cv.height = W * 2 + 28; const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height);
      const SRGB = new Uint8Array(256).map((_, i) => { const v = i / 255; return Math.round(255 * (v <= .0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - .055)); });
      const shot = (cam: any, col: number, row: number, label: string) => {
        const rt = new THREE.WebGLRenderTarget(W, W); R.setRenderTarget(rt); R.clear(); R.render(top, cam); const px = new Uint8Array(W * W * 4); R.readRenderTargetPixels(rt, 0, 0, W, W, px); R.setRenderTarget(null); rt.dispose();
        const im = x.createImageData(W, W); for (let yy = 0; yy < W; yy++) for (let xx = 0; xx < W; xx++) { const s = ((W - 1 - yy) * W + xx) * 4, d = (yy * W + xx) * 4; im.data[d] = SRGB[px[s]]; im.data[d + 1] = SRGB[px[s + 1]]; im.data[d + 2] = SRGB[px[s + 2]]; im.data[d + 3] = 255; }
        x.putImageData(im, col * W, 28 + row * W); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(col * W, 28 + row * W, 150, 20); x.fillStyle = '#fff'; x.font = '14px sans-serif'; x.fillText(label, col * W + 5, 28 + row * W + 15); };
      const near = (yaw: number) => { const fwd = new THREE.Vector3(Math.sin(o.rotation.y + yaw), .15, Math.cos(o.rotation.y + yaw)).normalize(), cam = new THREE.PerspectiveCamera(30, 1, .02, 200); cam.position.copy(cc).addScaledVector(fwd, rr * 1.9); cam.lookAt(cc); return cam; };
      shot(near(0), 0, 0, 'gần: trước'); shot(near(.8), 1, 0, 'gần: nghiêng'); shot(near(Math.PI / 2), 2, 0, 'gần: cạnh');
      shot(near(Math.PI), 0, 1, 'gần: sau');
      const gc = h.cam.clone(); gc.aspect = 1; gc.updateProjectionMatrix(); shot(gc, 1, 1, 'camera của bé');
      const far = new THREE.PerspectiveCamera(30, 1, .1, 400); far.position.set(h.pos.x + Math.cos(h.yaw) * 12, h.pos.y + 3, h.pos.z - Math.sin(h.yaw) * 12); far.lookAt(cc.x, cc.y - .6, cc.z); shot(far, 2, 1, 'xa 12 m');
      x.fillStyle = '#222'; x.font = 'bold 18px sans-serif'; x.fillText(`${c.kind}: ${title}  (clip ${c.clip || '?'})`, 8, 20);
      return cv.toDataURL('image/jpeg', .85);
    }, [speed, title, STEP / 1000] as any);
    writeFileSync(`${dir}/${String(n++).padStart(4, '0')}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(title, 'frames', n);
}
await b.close();
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${dir}/%04d.jpg`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', `${OUT}/${name}.mp4`]);
console.log('film', `${OUT}/${name}.mp4`, n, 'frames');
