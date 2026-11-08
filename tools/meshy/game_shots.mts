// (Meshy production, 8 Nov 2026) In-game review pictures of Meshy people, drawn by the game itself (not Blender).
// Every person must pass these before going on the branch (owner, 8 Nov 2026: Blender renders hid problems the game showed).
//   cd tests; node ../tools/meshy/game_shots.mts <out dir> faces  finn,sol,clara,lumi   (friends, high detail and light)
//   cd tests; node ../tools/meshy/game_shots.mts <out dir> village mai,ba               (named villagers in the valley)
//   cd tests; node ../tools/meshy/game_shots.mts <out dir> tones  lumi                  (one friend in four skin tones)
// faces: every mood (smile blink half happy o sad lookL lookR excited) front and three-quarter, plus the back of the
// head and neck from three sides. Writes <id>[-hd]-<mood>-front|tq.png and <id>[-hd]-neck-back-<angle>.png, and a
// review sheet <id>-review.png per person (row 1 smile/blink front and three-quarter and the back; row 2 the moods).
// Look at every sheet: eyes open and closed, brows, lids, cheeks, neck, ears, hairline, hair back, clothes edges.
import { chromium } from 'playwright';
import { open, clear } from '../../tests/harness.mts';
import { writeFileSync, mkdirSync } from 'node:fs';
const [OUT, MODE = 'faces', LIST = 'finn,sol,clara,lumi'] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const P = await open(b, { w: 900, h: 700, fast: false }); await clear(P.page);
const shots: Record<string, string> = await P.page.evaluate(async ([MODE, LIST]) => {
  const G = (window as any).__sv, A = await import(String('/js/avatar.js')), FM = await import(String('/js/friend-model.js')), { THREE } = await import(String('/js/gfx.js'));
  const h = G.heroes[0], R = G.renderer, out: Record<string, string> = {};
  const w = (ms: number) => { dispatchEvent(new Event('pointermove')); document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; G.world.time = .42; return new Promise(res => setTimeout(res, ms)); };
  let top = h.av.root; while (top.parent) top = top.parent; G.world.time = .42;
  const grab = (name: string, cam: any, W = 480, H = 480) => {
    const rt = new THREE.WebGLRenderTarget(W, H); R.setRenderTarget(rt); R.clear(); R.render(top, cam);
    const px = new Uint8Array(W * H * 4); R.readRenderTargetPixels(rt, 0, 0, W, H, px); R.setRenderTarget(null);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'), im = x.createImageData(W, H);
    for (let y = 0; y < H; y++) im.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4); x.putImageData(im, 0, 0);
    out[name] = cv.toDataURL('image/png');
  };
  const headShot = (name: string, root: any, model: any, yaw: number, side: number, villager = false) => {
    root.updateMatrixWorld(true); let head: any = null; model.obj.traverse((o: any) => { if (o.isBone && o.name === 'head') head = o; });
    const box = new THREE.Box3().setFromObject(model.obj, true), Hh = box.max.y - box.min.y, bc = box.getCenter(new THREE.Vector3());
    const at = head && !villager ? head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, .12, 0)) : new THREE.Vector3(bc.x, box.min.y + Hh * .86, bc.z);
    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).applyAxisAngle(new THREE.Vector3(0, 1, 0), side);
    const cam = new THREE.PerspectiveCamera(28, 1, .05, 200); cam.position.copy(at).addScaledVector(fwd, Hh * .75); cam.lookAt(at); grab(name, cam);
  };
  const mood = (av: any, M: any, m: string) => { if (av.life) { av.life.mood = m; av.life.blink = av.life.t + 60; av.life.glance = av.life.t + 60; av.life.feel = ''; } M.follow(m); };
  const MOODS = ['smile', 'blink', 'half', 'happy', 'o', 'sad', 'lookL', 'lookR', 'excited'];
  const LOOK: any = { finn: 'boy', sol: 'boy', clara: 'girl', lumi: 'girl' };
  const ids = LIST.split(',');
  if (MODE === 'faces') for (const id of ids) for (const hd of [false, true]) {
    await A.loadFriendModels(id); if (hd) await A.loadFriendModels(id + '-hd');
    const av: any = A.buildAvatar({ set: LOOK[id] || 'girl', friend: id, skin: '#f6c7a5' }, null, { hd }), M = hd ? av.modelHD : av.model; if (!M) continue;
    if (hd) A.showHD(av, true);
    top.add(av.root); av.root.position.set(h.pos.x + 3, h.av.root.position.y, h.pos.z + 3); av.root.rotation.y = 0; A.animate(av, 'idle', 1);
    const t = id + (hd ? '-hd' : '');
    for (const m of MOODS) { mood(av, M, m); for (const s of [0, .7]) headShot(`${t}-${m}-${s ? 'tq' : 'front'}`, av.root, M, 0, s); }
    mood(av, M, 'smile'); for (const s of [Math.PI, 2.2, -2.2]) headShot(`${t}-neck-back-${s.toFixed(1)}`, av.root, M, 0, s);
    top.remove(av.root);
  }
  if (MODE === 'tones') for (const id of ids) {
    FM.setMeshyTones(true); await A.loadFriendModels(id); await A.loadFriendModels(id + '-hd');
    let i = 0;
    for (const tone of ['#f6c7a5', '#e0a47c', '#a86c48', '#5e3a26']) {
      const av: any = A.buildAvatar({ set: LOOK[id] || 'girl', friend: id, skin: tone }, null, { hd: true }); A.showHD(av, true);
      top.add(av.root); av.root.position.set(h.pos.x + 3, h.av.root.position.y, h.pos.z + 3); av.root.rotation.y = 0; A.animate(av, 'idle', 1); av.root.updateMatrixWorld(true);
      let head: any = null; av.modelHD.obj.traverse((o: any) => { if (o.isBone && o.name === 'head') head = o; });
      const at = head.getWorldPosition(new THREE.Vector3()); const cam = new THREE.PerspectiveCamera(30, 1, .05, 100); cam.position.copy(at).add(new THREE.Vector3(.9, -.35, 2.6)); cam.lookAt(at);
      grab(`${id}-tone-${i++}`, cam, 360, 360); top.remove(av.root);
    }
    FM.setMeshyTones(false);
  }
  if (MODE === 'village') for (const id of ids) {
    const n = G.npcs.find((x: any) => x.id === id); if (!n) continue;
    h.place(n.obj.position.x + 2, n.obj.position.z + 2);
    for (let k = 0; k < 80 && n._vm !== 'worn' && n._vm !== 'code'; k++) await w(200);
    if (n._vm !== 'worn') { out[id + '-notworn'] = ''; continue; }
    const yaw = Math.atan2(h.pos.x - n.obj.position.x, h.pos.z - n.obj.position.z);
    for (const m of ['smile', 'blink', 'happy']) { mood(n.A, n.A.model, m); for (const s of [0, .7]) headShot(`v-${id}-${m}-${s ? 'tq' : 'front'}`, n.A.root, n.A.model, yaw, s, true); }
    for (const s of [Math.PI, 2.2]) headShot(`v-${id}-neck-back-${s.toFixed(1)}`, n.A.root, n.A.model, yaw, s, true);
  }
  return out;
}, [MODE, LIST] as any);
for (const [k, v] of Object.entries(shots)) { if (v) writeFileSync(`${OUT}/${k}.png`, Buffer.from(v.split(',')[1], 'base64')); else console.log('missing', k); }
console.log('shots', Object.keys(shots).length, 'in', OUT);
await b.close();
