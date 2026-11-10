// (Meshy pets, 10 Nov 2026) In-game pictures of the pets and companions, drawn by the game itself.
//   cd tests; SV_URL=http://localhost:8777/ node ../tools/meshy/pet_shots.mts <out dir> [close|follow|all] [kinds]
// close:  each kind on its own beside the child, every clip (idle walk happy cheer sad surprised sleep; companions fly
//         follow flap), from the front, three-quarter, side, back and above. Writes <kind>-<clip>-<view>.png.
// follow: the child walks with each pet (two at a time) and the companion; the game's own camera, near and far.
//         Writes follow-<kinds>-<n>.png.
import { createRequire } from 'node:module';
import { open, clear } from '../../tests/harness.mts';
const { chromium } = createRequire(new URL('../../tests/package.json', import.meta.url))('playwright');
import { writeFileSync, mkdirSync } from 'node:fs';
const PETS = ['puppy', 'kitty', 'bunny', 'panda', 'joey', 'calf'], BUDDIES = ['firefly', 'dragon'];
const [OUT, MODE = 'all', LIST = [...PETS, ...BUDDIES].join(',')] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const kinds = LIST.split(',');
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
// (the machine is shared with the people auditor: give the page longer to load than the harness's 30 s)
const _nc = b.newContext.bind(b); b.newContext = async (o: any) => { const c = await _nc(o); c.setDefaultNavigationTimeout(240000); c.setDefaultTimeout(240000); return c; };
const P = await open(b, { w: 900, h: 700, fast: false }); await clear(P.page);
P.page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('page', m.type(), m.text().slice(0, 300)); }); P.page.on('pageerror', e => console.log('pageerror', e.message));
const save = (shots: Record<string, string>) => { for (const [k, v] of Object.entries(shots)) if (v) writeFileSync(`${OUT}/${k}.png`, Buffer.from(v.split(',')[1], 'base64')); else console.log('missing', k); return Object.keys(shots).length; };
let n = 0;
if (MODE === 'close' || MODE === 'all') n += save(await P.page.evaluate(async ([kinds, BUDDIES]) => {
  const G = (window as any).__sv, MK = await import(String('/js/modelkit.js')), { THREE } = await import(String('/js/gfx.js')), { clone } = await import(String('/vendor/SkeletonUtils.js'));
  const h = G.heroes[0], R = G.renderer, out: Record<string, string> = {};
  const w = (ms: number) => { document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; G.world.time = .42; return new Promise(res => setTimeout(res, ms)); };
  let top = h.av.root; while (top.parent) top = top.parent;
  const SRGB = new Uint8Array(256).map((_, i) => { const v = i / 255; return Math.round(255 * (v <= .0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - .055)); });
  const grab = (name: string, cam: any, W = 400, H = 400) => {
    const rt = new THREE.WebGLRenderTarget(W, H); R.setRenderTarget(rt); R.clear(); R.render(top, cam);   // (a plain target keeps linear colours: turned to sRGB below, as the screen shows them)
    const px = new Uint8Array(W * H * 4); R.readRenderTargetPixels(rt, 0, 0, W, H, px); R.setRenderTarget(null); rt.dispose();
    for (let i = 0; i < px.length; i++) if ((i & 3) !== 3) px[i] = SRGB[px[i]];   // (8-bit, a little banding in the darks)
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'), im = x.createImageData(W, H);
    for (let y = 0; y < H; y++) im.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4); x.putImageData(im, 0, 0);
    out[name] = cv.toDataURL('image/png');
  };
  const SCALE: any = { puppy: 1.3, kitty: 1.45, bunny: 1.55, panda: 1.35, joey: 1.4, calf: 1.25 };
  const HAPPY: any = { puppy: 'wag', kitty: 'hop', bunny: 'hop', panda: 'hop', joey: 'hop', calf: 'wag' };
  for (const kind of kinds) {
    const base = kind.replace(/-hd$/, ''), buddy = BUDDIES.includes(base), t = await MK.loadWorldModel('creature-' + kind);   // (puppy-hd: the near model)
    if (!t) { out[kind + '-notloaded'] = ''; continue; }
    // (its own clock: each clip shown at a set moment of its loop, not wherever the game's clock had got to)
    const m = { obj: clone(t.scene) }, mixer = new THREE.AnimationMixer(m.obj); m.obj.traverse((o: any) => { if (o.isSkinnedMesh) o.frustumCulled = false; });
    const pose = (clip: string, at: number) => { const c = t.clips.find((x: any) => x.name === clip); if (!c) return false; mixer.stopAllAction(); mixer.clipAction(c).reset().play(); mixer.setTime(c.duration * at); return true; };
    m.obj.scale.multiplyScalar(buddy ? 1 : SCALE[base] || 1.3);
    const x0 = h.pos.x + 3, z0 = h.pos.z + 3, y0 = (G.world.groundAt ? G.world.groundAt(x0, z0, h.pos.y + 1) : h.pos.y) + (buddy ? 1.2 : 0);
    m.obj.position.set(x0, y0, z0); m.obj.rotation.y = 0; top.add(m.obj);
    const clips = buddy ? ['idle', 'fly', 'follow', 'flap', 'cheer', 'sad', 'surprised', 'sleep'] : ['idle', 'walk', HAPPY[base] || 'hop', 'cheer', 'sad', 'surprised', 'sleep'];
    for (const clip of clips) {
      if (!pose(clip, clip === 'sleep' || clip === 'sad' ? .5 : .3)) continue; await w(60); m.obj.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(m.obj, true), c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()), r = Math.max(size.x, size.y, size.z);
      const views: [string, number, number][] = clip === 'idle' ? [['front', 0, .15], ['tq', .75, .2], ['side', H(), .1], ['back', Math.PI, .2], ['top', .5, 1.1], ['face', 0, .05]] : [['front', 0, .15], ['tq', .75, .2], ['side', H(), .1], ['face', 0, .05], ['facetq', .7, .05]];
      for (const [nm, yaw, up] of views) {
        const cam = new THREE.PerspectiveCamera(30, 1, .02, 100), dir = new THREE.Vector3(Math.sin(yaw), up, Math.cos(yaw)).normalize();
        const at = nm.startsWith('face') ? new THREE.Vector3(c.x, box.max.y - size.y * .3, box.max.z - size.z * .2) : c;
        cam.position.copy(at).addScaledVector(dir, nm.startsWith('face') ? r * 1.1 : r * 2.4); cam.lookAt(at); grab(`${kind}-${clip}-${nm}`, cam);
      }
    }
    top.remove(m.obj);
  }
  function H() { return Math.PI / 2; }
  return out;
}, [kinds, BUDDIES] as any));
if (MODE === 'follow' || MODE === 'all') {
  const pets = kinds.filter(k => PETS.includes(k.replace(/-hd$/, ''))).map(k => k.replace(/-hd$/, '')), pairs: string[][] = [];
  for (let i = 0; i < pets.length; i += 2) pairs.push(pets.slice(i, i + 2));
  const buddies = kinds.filter(k => BUDDIES.includes(k));
  for (let i = 0; i < Math.max(pairs.length, buddies.length); i++) {
    const pair = pairs[i] || [], bud = buddies[i] || null, tag = [...pair, bud].filter(Boolean).join('-');
    await P.page.evaluate(async ([pair, bud]) => {
      const G = (window as any).__sv, h = G.heroes[0];
      h.profile.pets = pair.map((kind: string) => ({ kind, name: '' })); G.pets.sync(); G.pets.refreshInteractables && G.pets.refreshInteractables();
      h.profile.lanterns = h.profile.lanterns || {}; h.profile.lanterns.companion = bud || null;
      document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; G.world.time = .42;
    }, [pair, bud] as any);
    await P.page.waitForTimeout(3000);
    // walk: the child moves on in small steps (the game's camera follows), pictures while walking and after stopping
    let k = 0;
    for (const [steps, dir] of [[14, 0], [10, 1.6], [0, 0]] as [number, number][]) {
      await P.page.evaluate(async ([steps, dir]) => {
        const G = (window as any).__sv, h = G.heroes[0];
        for (let s = 0; s < steps; s++) { h.yaw = dir; h.place(h.pos.x + Math.sin(dir) * .35, h.pos.z + Math.cos(dir) * .35); await new Promise(r => setTimeout(r, 60)); }
      }, [steps, dir] as any);
      await P.page.waitForTimeout(steps ? 200 : 1500);
      await P.page.evaluate(() => document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()));
      await P.page.screenshot({ path: `${OUT}/follow-${tag}-${k++}.png` }); n++;
    }
  }
}
console.log('shots', n, 'in', OUT);
await b.close();
