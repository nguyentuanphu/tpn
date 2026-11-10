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
  const SCALE: any = { puppy: .6, kitty: 1.45, bunny: 1.55, panda: 1.35, joey: 1.4, calf: 1.25 };
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
    const clips = buddy ? ['idle', 'fly', 'follow', 'flap', 'cheer', 'sad', 'surprised', 'sleep'] : ['idle', 'walk', HAPPY[base] || 'hop', 'cheer', 'sad', 'surprised', 'sleep', ...['run', 'carry', 'jump', 'bounce', 'sit', 'beg', 'roll', 'scratch', 'swim', 'dig'].filter(c => t.clips.some((x: any) => x.name === c))];   // (a Meshy pet's own moves)
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
// skills (Meshy pets, 10 Nov 2026): the child's first pet's own skills in the game's camera: fetching the ball (thrown,
// carried back), digging, leading the way. Writes skill-<name>-<n>.png.
if (MODE === 'skills') {
  const shot = async (nm: string) => { await P.page.evaluate(() => document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove())); await P.page.screenshot({ path: `${OUT}/skill-${nm}.png` }); n++; };
  await P.page.evaluate(() => { const G = (window as any).__sv; G.paused = false; G.world.time = .42; });
  await P.page.waitForTimeout(4000);
  await P.page.evaluate(() => { const G = (window as any).__sv, h = G.heroes[0]; G.interactables.find((x: any) => x.id === 'fetch0').act(h); });
  for (const [k, ms] of [[0, 500], [1, 900], [2, 1200], [3, 1500]] as [number, number][]) { await P.page.waitForTimeout(ms); await shot('fetch-' + k); }
  await P.page.waitForTimeout(4000);
  await P.page.evaluate(() => { const G = (window as any).__sv, L = G.pets.live()[0]; L.task = { kind: 'dig', t: 0 }; });
  await P.page.waitForTimeout(800); await shot('dig-0'); await P.page.waitForTimeout(1500); await shot('dig-1'); await P.page.waitForTimeout(2000); await shot('dig-2');
  await P.page.evaluate(() => { const G = (window as any).__sv, h = G.heroes[0]; h.walkTo = { x: h.pos.x + 40, z: h.pos.z + 10, name: 'goal' }; G.interactables.find((x: any) => x.id === 'lead0').act(h); });
  await P.page.waitForTimeout(2500); await shot('lead-0'); await P.page.waitForTimeout(2500); await shot('lead-1');
}
// scenes (owner, 10 Nov 2026: "kiểm tra cho hết"): the pet at night, in the pet yard, the village dog (the same kind),
// the water rescue (which moves it plays) and two children side by side. Writes scene-<name>.png and prints what it found.
if (MODE === 'scenes') {
  const clean = () => P.page.evaluate(() => { document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); const G = (window as any).__sv; G.paused = false; });
  const shot = async (nm: string, pg = P.page) => { await pg.evaluate(() => document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove())); await pg.screenshot({ path: `${OUT}/scene-${nm}.png` }); n++; };
  const found: any = {};
  await clean(); await P.page.waitForTimeout(3000);
  // night
  found.night = await P.page.evaluate(async () => { const G = (window as any).__sv; const go = () => { document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; }; const iv = setInterval(go, 150); go(); (window as any).__unpause = iv; G.world.time = .9; await new Promise(r => setTimeout(r, 2500)); const L = G.pets.live()[0]; return { night: G.world.isNight(), clip: L.obj.userData.rig.clip, model: !!L.obj.userData.rig.model }; });
  await shot('night'); await P.page.evaluate(() => { (window as any).__sv.world.time = .42; });
  // the pet yard
  found.yard = await P.page.evaluate(async () => { const G = (window as any).__sv, S = await import(String('/js/state.js')), h = G.heroes[0];
    S.farm.petYard = [{ kind: 'puppy', name: 'Bông' }]; G.pets.syncYard(); const it = G.interactables.find((x: any) => x.id === 'petyard'); h.place(it.x + 3, it.z + 3);
    let m = false; for (let i = 0; i < 60 && !m; i++) { await new Promise(r => setTimeout(r, 200)); m = G.pets.yardMeshes().every((o: any) => o.userData.rig && o.userData.rig.model); }
    const o = G.pets.yardMeshes()[0]; return { model: m, scale: o && +o.scale.x.toFixed(2), clip: o && o.userData.rig.clip }; });
  await shot('yard');
  // the village dog: a puppy in the valley that is nobody's pet
  found.villageDog = await P.page.evaluate(async () => { const G = (window as any).__sv, h = G.heroes[0], mine = new Set([...G.pets.meshes(), ...G.pets.yardMeshes()]);
    const dogs: any[] = []; G.scene.traverse((o: any) => { if (o.userData && o.userData.rig && o.userData.rig.kind === 'puppy' && !mine.has(o)) dogs.push(o); });
    if (!dogs.length) return { none: true }; const d = dogs[0]; h.place(d.position.x + 2.5, d.position.z + 2.5);
    for (let i = 0; i < 150 && !d.userData.rig.model; i++) await new Promise(r => setTimeout(r, 200));
    return { asked: !!d.userData.rig.asked, near: +Math.hypot(h.pos.x - d.position.x, h.pos.z - d.position.z).toFixed(1), parent: d.parent && (d.parent.name || d.parent.type), count: dogs.length, model: !!d.userData.rig.model, hd: !!d.userData.rig.hd, scale: +d.scale.x.toFixed(2), clip: d.userData.rig.clip }; });
  await shot('village-dog');
  // the water rescue
  found.rescue = await P.page.evaluate(async () => { const G = (window as any).__sv, W = await import(String('/js/world.js')), h = G.heroes[0];
    let spot: any = null; for (let r = 6; r < 300 && !spot; r += 5) for (let k = 0; k < 48 && !spot; k++) { const a = k / 48 * Math.PI * 2, x = h.pos.x + Math.cos(a) * r, z = h.pos.z + Math.sin(a) * r;
      if (G.world.groundAt(x, z, 50) < W.WATER - .6) { for (const back of [4, 6, 8, 12]) { const sx = x - Math.cos(a) * back, sz = z - Math.sin(a) * back; if (!spot && G.world.groundAt(sx, sz, 50) > W.WATER + .2) spot = { x, z, sx, sz }; } } }
    if (!spot) return { none: true };
    h.place(spot.sx, spot.sz); await new Promise(r => setTimeout(r, 1500)); if (h.lastSafe && h.lastSafe.set) h.lastSafe.set(spot.sx, h.pos.y, spot.sz); h.place(spot.x, spot.z);
    const L = G.pets.live()[0]; if (!G.pets.rescue(h)) return { started: false };
    const clips = new Set<string>(); for (let i = 0; i < 90 && h.carry; i++) { await new Promise(r => setTimeout(r, 200)); clips.add(L.obj.userData.rig.clip); if (i === 55) (window as any).__rescueShot = true; }
    return { clips: [...clips], done: !h.carry }; });
  await shot('rescue-after');
  await P.page.evaluate(() => clearInterval((window as any).__unpause));
  console.log(JSON.stringify(found));
  // two children side by side (split screen)
  const Q = await open(b, { w: 1180, h: 820, mode: 'split', fast: false });
  await Q.page.evaluate(async () => { const G = (window as any).__sv; for (let i = 0; i < 100 && !(G.pets && G.pets.live && G.pets.live().length >= 2); i++) await new Promise(r => setTimeout(r, 100));
    document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; });
  await Q.page.waitForTimeout(6000);
  const two = await Q.page.evaluate(() => { const G = (window as any).__sv; return { heroes: G.heroes.length, pets: G.pets.live().map((L: any) => ({ hero: L.h.i, model: !!L.obj.userData.rig.model, d: +Math.hypot(L.obj.position.x - L.h.pos.x, L.obj.position.z - L.h.pos.z).toFixed(1) })),
    chips: [...document.querySelectorAll('.petrow')].map((r: any) => [...r.querySelectorAll('.chip')].filter((c: any) => !c.hidden).length) }; });
  console.log(JSON.stringify({ two }));
  await shot('two-children', Q.page); await Q.ctx.close();
}
console.log('shots', n, 'in', OUT);
await b.close();
