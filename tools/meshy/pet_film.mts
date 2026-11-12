// (Meshy pets, 13 Nov 2026, owner: "Kiểm tra kỹ khi chạy nhảy và các kiểu chưa", then "Quay phim pet") Films of a pet
// moving in the game, drawn by the game itself, as companion_film.mts does for the companions.
//   cd tests; SV_URL=http://localhost:8777/ node ../tools/meshy/pet_film.mts <out dir> <kind>
// The page's clock is held (Playwright clock) and the world is stepped 1/15 s at a time, so every frame is one even step
// of game time however busy the machine is. Each frame has six views: near from the front, three-quarter, side and back
// (following the pet), the child's own game camera, and from 12 m away. Parts: standing beside the still child, following
// the child walking, running after the child running, then each of the pet's own moves asked for as the game asks
// (jump, bounce, sit, beg, roll, scratch, dig, swim, sleep; a move the model lacks is skipped). Writes <out>/<kind>.mp4.
import { createRequire } from 'node:module';
import { open, clear } from '../../tests/harness.mts';
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const { chromium } = createRequire(new URL('../../tests/package.json', import.meta.url))('playwright');
const [OUT, KIND = 'puppy'] = process.argv.slice(2);
const FFMPEG = 'C:/Users/nguye/tools/ffmpeg/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe';
const dir = `${OUT}/${KIND}-frames`; mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const _nc = b.newContext.bind(b); b.newContext = async (o: any) => { const c = await _nc(o); c.setDefaultNavigationTimeout(240000); c.setDefaultTimeout(240000); return c; };
const P = await open(b, { w: 900, h: 700, fast: false }); await clear(P.page);
P.page.on('pageerror', e => console.log('pageerror', e.message));
// the child's one pet, its near (HD) model, no hat
const setup = await P.page.evaluate(async ([kind]) => {
  const G = (window as any).__sv, h = G.heroes[0];
  const go = () => { document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; }; go();
  // (an open place: at the spawn the owl and its speech bubble stood in front of the game's camera)
  const yard = G.interactables && G.interactables.find((x: any) => x.id === 'petyard'); if (yard && h.place) h.place(yard.x + 6, yard.z + 6);
  h.profile.pets = [{ kind, name: '' }]; G.pets.sync();
  let L: any = null; for (let i = 0; i < 300; i++) { go(); await new Promise(r => setTimeout(r, 200)); L = G.pets.live()[0]; const r = L && L.obj.userData.rig; if (r && r.model && r.hd) break; }
  const r = L && L.obj.userData.rig; if (!r || !r.model) return { error: 'no model' };
  (window as any).__film = { L, h, start: { x: h.pos.x, y: h.pos.y, z: h.pos.z, yaw: h.yaw } };
  const has = ['jump', 'bounce', 'sit', 'beg', 'roll', 'scratch', 'dig', 'swim', 'sleep'].filter(c => r.model.has && r.model.has(c));
  return { ok: true, hd: !!r.hd, has };
}, [KIND] as any);
console.log(KIND, JSON.stringify(setup)); if (!(setup as any).ok) process.exit(1);
await P.page.clock.install(); await P.page.clock.pauseAt(Date.now() + 2000);   // (holds the page's own loop: the frames below step the world)
const FPS = 15, STEP = 1000 / FPS;
// parts: [title, seconds, child's speed (m/s), the pet's wished move]
const PARTS: [string, number, number, string][] = [['đứng', 2, 0, ''], ['đi theo', 3, 2.5, ''], ['chạy theo', 3, 7, ''],
  ...(setup as any).has.map((m: string) => [m, m === 'jump' ? 1.4 : 2.6, 0, m] as [string, number, number, string])];
let n = 0;
for (const [title, secs, speed, move] of PARTS) {
  await P.page.evaluate(() => { const F = (window as any).__film, h = F.h; h.pos.set(F.start.x, F.start.y, F.start.z); h.yaw = F.start.yaw;
    F.L.obj.position.set(h.pos.x - Math.sin(h.yaw) * 1.7 + Math.cos(h.yaw) * .9, h.pos.y, h.pos.z - Math.cos(h.yaw) * 1.7 - Math.sin(h.yaw) * .9); });   // (the pet back beside the child: after the run it was far behind, and ran back through the next move)
  for (let f = 0; f < secs * FPS; f++) {
    const url = await P.page.evaluate(async ([speed, title, dt, move]) => {
      const G = (window as any).__sv, F = (window as any).__film, { THREE } = await import(String('/js/gfx.js')), { L, h } = F;
      document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false;
      for (let k = 0; k < 4; k++) { const d = dt / 4; if (speed) { h.pos.x += Math.sin(h.yaw) * speed * d; h.pos.z += Math.cos(h.yaw) * speed * d; }
        if (move) { L.want = move; L.wantT = .5; }   // (as the game wishes a move: js/pets.ts wish())
        F.t = (F.t || 100) + d; G.world.update(d, F.t); }
      const r = L.obj.userData.rig, R = G.renderer; let top = h.av.root; while (top.parent) top = top.parent;
      const o = L.obj; o.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(r.model.obj, true), cc = box.getCenter(new THREE.Vector3()), rr = Math.max(.5, box.getSize(new THREE.Vector3()).length());
      const hid: any[] = []; top.traverse((q: any) => { if (q.isSprite && q.visible) { q.visible = false; hid.push(q); } });   // (name tags and speech bubbles covered the near views)
      const W = 300, cv = document.createElement('canvas'); cv.width = W * 3; cv.height = W * 2 + 28; const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height);
      const SRGB = new Uint8Array(256).map((_, i) => { const v = i / 255; return Math.round(255 * (v <= .0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - .055)); });
      const shot = (cam: any, col: number, row: number, label: string) => {
        const rt = new THREE.WebGLRenderTarget(W, W); R.setRenderTarget(rt); R.clear(); R.render(top, cam); const px = new Uint8Array(W * W * 4); R.readRenderTargetPixels(rt, 0, 0, W, W, px); R.setRenderTarget(null); rt.dispose();
        const im = x.createImageData(W, W); for (let yy = 0; yy < W; yy++) for (let xx = 0; xx < W; xx++) { const s = ((W - 1 - yy) * W + xx) * 4, d = (yy * W + xx) * 4; im.data[d] = SRGB[px[s]]; im.data[d + 1] = SRGB[px[s + 1]]; im.data[d + 2] = SRGB[px[s + 2]]; im.data[d + 3] = 255; }
        x.putImageData(im, col * W, 28 + row * W); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(col * W, 28 + row * W, 150, 20); x.fillStyle = '#fff'; x.font = '14px sans-serif'; x.fillText(label, col * W + 5, 28 + row * W + 15); };
      const near = (yaw: number) => { const fwd = new THREE.Vector3(Math.sin(o.rotation.y + yaw), .2, Math.cos(o.rotation.y + yaw)).normalize(), cam = new THREE.PerspectiveCamera(30, 1, .02, 200); cam.position.copy(cc).addScaledVector(fwd, rr * 1.8); cam.lookAt(cc); return cam; };
      shot(near(0), 0, 0, 'gần: trước'); shot(near(.8), 1, 0, 'gần: nghiêng'); shot(near(Math.PI / 2), 2, 0, 'gần: cạnh');
      shot(near(Math.PI), 0, 1, 'gần: sau');
      const gc = new THREE.PerspectiveCamera(50, 1, .1, 400); gc.position.set(h.pos.x - Math.sin(h.yaw) * 6, h.pos.y + 3.2, h.pos.z - Math.cos(h.yaw) * 6); gc.lookAt(h.pos.x, h.pos.y + 1.4, h.pos.z); shot(gc, 1, 1, 'sau bé 6 m (như game)');
      const far = new THREE.PerspectiveCamera(30, 1, .1, 400); far.position.set(h.pos.x + Math.cos(h.yaw) * 12, h.pos.y + 3, h.pos.z - Math.sin(h.yaw) * 12); far.lookAt(cc.x, cc.y - .3, cc.z); shot(far, 2, 1, 'xa 12 m');
      hid.forEach(q => { q.visible = true; });
      x.fillStyle = '#222'; x.font = 'bold 18px sans-serif'; x.fillText(`${r.kind}: ${title}  (clip ${r.clip || '?'}, ${r.hd ? 'HD' : 'nhẹ'})`, 8, 20);
      return cv.toDataURL('image/jpeg', .85);
    }, [speed, title, STEP / 1000, move] as any);
    writeFileSync(`${dir}/${String(n++).padStart(4, '0')}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(title, 'frames', n);
}
await b.close();
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${dir}/%04d.jpg`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', `${OUT}/${KIND}.mp4`]);
console.log('film', `${OUT}/${KIND}.mp4`, n, 'frames');
