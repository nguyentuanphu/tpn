// (Meshy production, 8 Nov 2026) In-game review pictures of Meshy people, drawn by the game itself (not Blender).
// Every person must pass these before going on the branch (owner, 8 Nov 2026: Blender renders hid problems the game showed).
//   cd tests; node ../tools/meshy/game_shots.mts <out dir> faces  finn,sol,clara,lumi   (friends, high detail and light)
//   cd tests; node ../tools/meshy/game_shots.mts <out dir> village mai,ba               (named villagers in the valley)
//   cd tests; node ../tools/meshy/game_shots.mts <out dir> village r045@vn-schoolgirl   (a regional villager by its file, worn by a crowd person of that role)
//   cd tests; node ../tools/meshy/game_shots.mts <out dir> tones  lumi                  (one friend in four skin tones)
// faces: every mood (smile blink half happy o sad lookL lookR excited) front and three-quarter, plus the back of the
// head and neck from three sides. Writes <id>[-hd]-<mood>-front|tq.png and <id>[-hd]-neck-back-<angle>.png, and a
// review sheet <id>-review.png per person (row 1 smile/blink front and three-quarter and the back; row 2 the moods).
// Look at every sheet: eyes open and closed, brows, lids, cheeks, neck, ears, hairline, hair back, clothes edges.
import { createRequire } from 'node:module';
import { open, clear } from '../../tests/harness.mts';
const { chromium } = createRequire(new URL('../../tests/package.json', import.meta.url))('playwright');   // (installed under tests/)
import { writeFileSync, mkdirSync } from 'node:fs';
const [OUT, MODE = 'faces', LIST = 'finn,sol,clara,lumi'] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
// (10 Nov 2026: on a busy machine the page took over 30 s to load: 3 min limits)
const nc = b.newContext.bind(b); b.newContext = async (o: any) => { const c = await nc(o); c.setDefaultNavigationTimeout(180000); c.setDefaultTimeout(180000); return c; };
const P = await open(b, { w: 900, h: 700, fast: false }); await clear(P.page);
const shots: Record<string, string> = await P.page.evaluate(async ([MODE, LIST, BARE, HIDE]) => {
  const G = (window as any).__sv, A = await import(String('/js/avatar.js')), FM = await import(String('/js/friend-model.js')), { THREE } = await import(String('/js/gfx.js'));
  const h = G.heroes[0], R = G.renderer, out: Record<string, string> = {};
  const w = (ms: number) => { dispatchEvent(new Event('pointermove')); document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; G.world.time = .42; return new Promise(res => setTimeout(res, ms)); };
  let top = h.av.root; while (top.parent) top = top.parent; G.world.time = .42;
  let SCN: any = null;   // (village: the villager alone in a scene of its own with the valley's lights)
  const grab = (name: string, cam: any, W = 480, H = 480) => {
    const rt = new THREE.WebGLRenderTarget(W, H); if (SCN) cam.layers.enableAll(); R.setRenderTarget(rt); R.clear(); R.render(SCN || top, cam);   // (a villager far from the valley's camera is on layer 1, js/main.ts: six of eleven came out blank)
    const px = new Uint8Array(W * H * 4); R.readRenderTargetPixels(rt, 0, 0, W, H, px); R.setRenderTarget(null);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'), im = x.createImageData(W, H);
    for (let y = 0; y < H; y++) im.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4); x.putImageData(im, 0, 0);
    out[name] = cv.toDataURL('image/png');
  };
  const headShot = (name: string, root: any, model: any, yaw: number, side: number, villager = false) => {
    root.updateMatrixWorld(true); let head: any = null; model.obj.traverse((o: any) => { if (o.isBone && o.name === 'head') head = o; });
    const box = new THREE.Box3().setFromObject(model.obj, true), Hh = box.max.y - box.min.y, bc = box.getCenter(new THREE.Vector3());
    const at = head ? head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, villager ? .1 : .12, 0)) : new THREE.Vector3(bc.x, box.min.y + Hh * .86, bc.z);   // (10 Nov 2026: villagers by their head bone too: a raised arm in the box put the head at the picture's foot)
    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).applyAxisAngle(new THREE.Vector3(0, 1, 0), side);
    const cam = new THREE.PerspectiveCamera(28, 1, .05, 200); cam.position.copy(at).addScaledVector(fwd, Hh * .75); cam.lookAt(at);
    const hid: any[] = []; if (HIDE === 'face') model.obj.traverse((o: any) => { if (o.isMesh && o.visible && /^face-/.test(o.material && o.material.name || '')) { hid.push(o); o.visible = false; } });   // (HIDE=face: the mood pieces hidden, to tell what the body shows under them)
    grab(name, cam); hid.forEach(o => { o.visible = true; });
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
    // (owner 8 Nov 2026: "check the eyes from the side") each mood from both sides, close
    for (const m of ['smile', 'blink', 'half', 'happy', 'sad', 'lookL', 'lookR']) { mood(av, M, m); for (const s of [1.2, -1.2]) headShot(`${t}-${m}-side${s > 0 ? 'L' : 'R'}`, av.root, M, 0, s); }
    top.remove(av.root);
  }
  // outfits: each of a friend's shop outfits (js/content/friends.ts SUIT_KINDS), full length, front, three-quarter, back
  if (MODE === 'outfits') for (const id of ids) {
    await A.loadFriendModels(id); await A.loadFriendModels(id + '-hd');
    for (const kind of ['everyday', 'aodai', 'festival', 'rain']) {
      const av: any = A.buildAvatar({ set: LOOK[id] || 'girl', friend: id, skin: '#f6c7a5', suit: `${id}-${kind}` }, null, { hd: true }); A.showHD(av, true);
      top.add(av.root); av.root.position.set(h.pos.x + 3, h.av.root.position.y, h.pos.z + 3); av.root.rotation.y = 0; A.animate(av, 'idle', 1); av.root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(av.modelHD.obj, true), c = box.getCenter(new THREE.Vector3()), Hh = box.max.y - box.min.y;
      for (const [s, nm] of [[0, 'front'], [.75, 'tq'], [Math.PI, 'back']] as [number, string][]) {
        const cam = new THREE.PerspectiveCamera(30, .75, .05, 100), dir = new THREE.Vector3(Math.sin(s), 0, Math.cos(s));
        cam.position.copy(c).addScaledVector(dir, Hh * 2.1); cam.position.y += Hh * .05; cam.lookAt(c); grab(`${id}-${kind}-${nm}`, cam, 360, 480);
      }
      top.remove(av.root);
    }
  }
  // poses (owner 9 Nov 2026: "khi di chuyển hay đưa tay lên xuống qua lại thì có bị gì không?"): each friend in two outfits
  // walking, running, arms up (cheer), waving, dancing, jumping, sitting and climbing, front and three-quarter, whole child
  if (MODE === 'poses') for (const id of ids) {
    await A.loadFriendModels(id); await A.loadFriendModels(id + '-hd');
    for (const kind of ['everyday', 'aodai']) {
      const av: any = A.buildAvatar({ set: LOOK[id] || 'girl', friend: id, skin: '#f6c7a5', suit: `${id}-${kind}` }, null, { hd: true }); A.showHD(av, true);
      if (HIDE) av.modelHD.obj.traverse((o: any) => { if (o.isMesh && new RegExp('^lit-g-(' + HIDE + ')').test(o.material && o.material.name || '')) o.visible = false; });
      top.add(av.root); av.root.position.set(h.pos.x + 3, h.av.root.position.y, h.pos.z + 3); av.root.rotation.y = 0;
      for (const [st, sp, frames] of [['walk', 3, 9], ['walk', 9, 14], ['cheer', 0, 3], ['wave', 0, 3], ['dance', 0, 5], ['air', 0, 2], ['sit', 0, 2], ['climb', 0, 4]] as [string, number, number][]) {
        av.life = null; for (let f = 0; f <= frames; f++) A.animate(av, st, 10 + f * .05, sp);
        av.root.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(av.modelHD.obj, true), c = box.getCenter(new THREE.Vector3()), Hh = Math.max(box.max.y - box.min.y, 1);
        for (const [s, nm] of [[.3, 'front'], [2.4, 'back']] as [number, string][]) {
          const cam = new THREE.PerspectiveCamera(30, .75, .05, 100), dir = new THREE.Vector3(Math.sin(s), 0, Math.cos(s));
          cam.position.copy(c).addScaledVector(dir, Hh * 2.1); cam.lookAt(c); grab(`${id}-${kind}-${st}${sp > 5 ? '-run' : ''}-${nm}`, cam, 360, 480);
        }
      }
      top.remove(av.root);
    }
  }
  // skirt: the driven skirt bones in the áo dài while walking (bone names, the code person's legs, the bones' turn)
  if (MODE === 'skirt') for (const id of ids) {
    await A.loadFriendModels(id); await A.loadFriendModels(id + '-hd');
    const av: any = A.buildAvatar({ set: LOOK[id] || 'girl', friend: id, skin: '#f6c7a5', suit: `${id}-aodai` }, null, { hd: true }); A.showHD(av, true);
    top.add(av.root); av.life = null; for (let f = 0; f <= 9; f++) A.animate(av, 'walk', 10 + f * .05, 3); av.root.updateMatrixWorld(true);
    const names: string[] = []; let sk: any = null; av.modelHD.obj.traverse((o: any) => { if (o.isBone) { names.push(o.name); if (o.name === 'skirtF') sk = o; } });
    out[id + ' bones'] = names.join(','); { let hb: any = null; av.modelHD.obj.traverse((o: any) => { if (o.isBone && o.name === 'helpArmL') hb = o; }); const a2: any = av.modelHD.obj; let arm: any = null; a2.traverse((o: any) => { if (o.isBone && o.name === 'armL') arm = o; }); out[id + ' helpArmL q'] = hb ? hb.quaternion.toArray().map((v: number) => v.toFixed(2)).join(' ') : 'none'; out[id + ' armL q'] = arm ? arm.quaternion.toArray().map((v: number) => v.toFixed(2)).join(' ') : 'none'; let wsk = 0; av.modelHD.obj.traverse((o: any) => { if (o.isSkinnedMesh && /top-long/.test(o.material.name || '')) wsk = o.skeleton.bones.map((b: any) => b.name).indexOf('helpArmL'); }); out[id + ' top skeleton helpArmL at'] = String(wsk); } out[id + ' legs'] = [av.legL && av.legL.rotation.x, av.legR && av.legR.rotation.x].map(v => v && v.toFixed(2)).join(' ');
    out[id + ' skirtF'] = sk ? sk.quaternion.toArray().map((v: number) => v.toFixed(2)).join(' ') + ' parent ' + (sk.parent && sk.parent.name) : 'none';
    let wsk = 0; av.modelHD.obj.traverse((o: any) => { if (o.isSkinnedMesh && /panels/.test(o.material.name || '')) wsk = o.skeleton.bones.map((b: any) => b.name).indexOf('skirtF'); }); out[id + ' panel skeleton has skirtF at'] = String(wsk);
    top.remove(av.root);
  }
  // cover: which parts of a dressed friend hide what lies under worn garments (uCover), for checking the hiding is on
  if (MODE === 'cover') for (const id of ids) {
    await A.loadFriendModels(id); await A.loadFriendModels(id + '-hd');
    const av: any = A.buildAvatar({ set: LOOK[id] || 'girl', friend: id, skin: '#f6c7a5', suit: `${id}-everyday` }, null, { hd: true }); A.showHD(av, true);
    av.modelHD.obj.traverse((o: any) => { if (o.isMesh) out[`${id} ${o.name} ${o.material.name}`] = JSON.stringify({ vis: o.visible, cover: o.material.userData.cover, u: o.material.userData.coverU && o.material.userData.coverU.value, vc: o.material.vertexColors, item: o.geometry.attributes.color && o.geometry.attributes.color.itemSize, arr: o.geometry.attributes.color && o.geometry.attributes.color.array.constructor.name, norm: o.geometry.attributes.color && o.geometry.attributes.color.normalized, a: o.geometry.attributes.color && Array.from(new Set(Array.from({ length: Math.min(4000, o.geometry.attributes.color.count) }, (_, i) => Math.round(o.geometry.attributes.color.getW(i) * 255)))).slice(0, 12) }); });
    // the hiding itself: every mask on, garments off: the body should show holes wherever any garment covers it
    top.add(av.root); av.root.position.set(h.pos.x + 3, h.av.root.position.y, h.pos.z + 3); av.root.rotation.y = 0; A.animate(av, 'idle', 1); av.root.updateMatrixWorld(true);
    av.modelHD.obj.traverse((o: any) => { if (o.isMesh && o.material.userData.coverU) o.material.userData.coverU.value = 255; if (o.isMesh && /^lit-g-/.test(o.material.name || '')) o.visible = false; });
    const box = new THREE.Box3().setFromObject(av.modelHD.obj, true), c = box.getCenter(new THREE.Vector3()), Hh = box.max.y - box.min.y;
    const cam = new THREE.PerspectiveCamera(30, .75, .05, 100); cam.position.copy(c).add(new THREE.Vector3(0, 0, Hh * 2.1)); cam.lookAt(c); grab(`${id}-holes`, cam, 360, 480);
    // and the trousers under the áo dài's panels alone (their bit 32)
    av.modelHD.obj.traverse((o: any) => { if (o.isMesh && /^lit-g-trousers/.test(o.material.name || '')) { o.visible = true; o.material.userData.coverU.value = 32; } else if (o.isMesh && /^(cloth-body|skin-)/.test(o.material.name || '')) o.visible = false; });
    for (const [s, nm] of [[0, 'f'], [1.57, 's']] as [number, string][]) { const cm = new THREE.PerspectiveCamera(30, .75, .05, 100); cm.position.copy(c).add(new THREE.Vector3(Math.sin(s) * Hh * 2.1, 0, Math.cos(s) * Hh * 2.1)); cm.lookAt(c); grab(`${id}-trousers-under-panels-${nm}`, cm, 360, 480); }
    top.remove(av.root);
  }
  // nape: the back of the neck up close, level and from a little below, standing, running and looking to each side
  if (MODE === 'nape') for (const id of ids) {
    await A.loadFriendModels(id); await A.loadFriendModels(id + '-hd');
    const av: any = A.buildAvatar({ set: LOOK[id] || 'girl', friend: id, skin: '#f6c7a5' }, null, { hd: true }); A.showHD(av, true);
    top.add(av.root); av.root.position.set(h.pos.x + 3, h.av.root.position.y, h.pos.z + 3); av.root.rotation.y = 0;
    const M = av.modelHD; let k = 0;
    for (const [state, t, look] of [['idle', 1, null], ['run', 1.3, null], ['idle', 2, 2.5], ['idle', 2.3, -2.5]] as [string, number, number | null][]) {
      A.setLookTarget(look == null ? null : { x: av.root.position.x + look, z: av.root.position.z + 1.2 });
      for (let f = 0; f < 6; f++) A.animate(av, state, t + f / 30); av.root.updateMatrixWorld(true);
      let head: any = null; M.obj.traverse((o: any) => { if (o.isBone && o.name === 'head') head = o; });
      const hp = head.getWorldPosition(new THREE.Vector3());
      for (const [dy, side] of [[0, Math.PI], [-.25, Math.PI], [0, 2.4], [0, -2.4]] as [number, number][]) {
        const fwd = new THREE.Vector3(Math.sin(side), 0, Math.cos(side)), cam = new THREE.PerspectiveCamera(30, 1, .02, 50);
        const at = hp.clone().add(new THREE.Vector3(0, -.03, 0)); cam.position.copy(at).addScaledVector(fwd, .55); cam.position.y += dy; cam.lookAt(at);
        grab(`${id}-nape-${k++}`, cam, 400, 400);
      }
    }
    A.setLookTarget(null); top.remove(av.root);
  }
  // motion: running and looking to each side, close on the neck and shoulders (a join must never open)
  if (MODE === 'motion') for (const id of ids) {
    await A.loadFriendModels(id); await A.loadFriendModels(id + '-hd');
    const av: any = A.buildAvatar({ set: LOOK[id] || 'girl', friend: id, skin: '#f6c7a5' }, null, { hd: true }); A.showHD(av, true);
    top.add(av.root); av.root.position.set(h.pos.x + 3, h.av.root.position.y, h.pos.z + 3); av.root.rotation.y = 0;
    const M = av.modelHD; let k = 0;
    for (const [state, t, look] of [['run', 1.1, null], ['run', 1.35, null], ['run', 1.6, null], ['idle', 2, 2.5], ['idle', 2.3, -2.5], ['cheer', 1.4, null]] as [string, number, number | null][]) {
      A.setLookTarget(look == null ? null : { x: av.root.position.x + look, z: av.root.position.z + 1.2 });
      for (let f = 0; f < 6; f++) A.animate(av, state, t + f / 30); av.root.updateMatrixWorld(true);
      for (const s of [0, 1.6, Math.PI]) headShot(`${id}-motion-${k}-${state}-${s.toFixed(1)}`, av.root, M, 0, s);
      k++;
    }
    A.setLookTarget(null); top.remove(av.root);
  }
  if (MODE === 'tones') for (const id of ids) {
    FM.setMeshyTones(true); await A.loadFriendModels(id); await A.loadFriendModels(id + '-hd');
    let i = 0;
    for (const tone of ['#f6c7a5', '#e0a47c', '#a86c48', '#5e3a26']) {
      const av: any = A.buildAvatar({ set: LOOK[id] || 'girl', friend: id, skin: tone }, null, { hd: true }); A.showHD(av, true);
      top.add(av.root); av.root.position.set(h.pos.x + 3, h.av.root.position.y, h.pos.z + 3); av.root.rotation.y = 0; A.animate(av, 'idle', 1); av.root.updateMatrixWorld(true);
      // (owner 9 Nov 2026: "chỉnh da trên meshy swimsuit trước") BARE=1: the swim body alone, every garment hidden, so the
      // skin is checked on all tones before any outfit
      if (BARE) av.modelHD.obj.traverse((o: any) => { const ms = o.material ? [].concat(o.material) : []; if (o.isMesh && ms.some((m: any) => /^lit-g-/.test(m.name || ''))) o.visible = false; });
      let head: any = null; av.modelHD.obj.traverse((o: any) => { if (o.isBone && o.name === 'head') head = o; });
      const at = head.getWorldPosition(new THREE.Vector3()); const cam = new THREE.PerspectiveCamera(30, 1, .05, 100); cam.position.copy(at).add(new THREE.Vector3(.9, -.35, 2.6)); cam.lookAt(at);
      grab(`${id}-tone-${i}`, cam, 360, 360);
      // (owner 9 Nov 2026, r59: the hands and the fronts of the legs kept their painted skin on dark tones) the whole child
      // too, front and back, so hands, fingers and legs are checked on every tone
      const box = new THREE.Box3().setFromObject(av.modelHD.obj, true), c = box.getCenter(new THREE.Vector3()), Hh = box.max.y - box.min.y;
      for (const [s, nm] of [[.35, 'front'], [Math.PI, 'back']] as [number, string][]) {
        const cf = new THREE.PerspectiveCamera(30, .75, .05, 100), dir = new THREE.Vector3(Math.sin(s), 0, Math.cos(s));
        cf.position.copy(c).addScaledVector(dir, Hh * 2.1); cf.lookAt(c); grab(`${id}-tonefull-${nm}-${i}`, cf, 360, 480);
      }
      i++; top.remove(av.root);
    }
    FM.setMeshyTones(false);
  }
  // (10 Nov 2026, regional pilot) <id>@<role>: a regional villager that is no NPC yet (models/villager-<id>.glb) is worn
  // by a crowd person whom the game would give that role's model (js/crowd-models.ts crowdRole), as the game will do once
  // the owner picks the role it replaces: the same height, light and code person under it as in play
  const regional = async (id: string, role: string) => {
    const CM = await import(String('/js/crowd-models.js')), p = new THREE.Vector3(); A.buildAllLate();
    const named = new Set(G.npcs.map((x: any) => x.obj)), mine = new Set(G.heroes.map((x: any) => x.av && x.av.root));
    // (the crowd's looks are drawn at random each load: some loads have no Australian boy, so the next best host is a crowd
    // person of the same age, the same height in play)
    const age = (r: string) => /grand/.test(r) ? 'elder' : /boy|girl/.test(r) ? 'kid' : 'adult';
    const free = (A.OUTLINED as any[]).filter(X => X.root.parent && X.painted && !X.late && !named.has(X.root) && !mine.has(X.root) && !X.root.userData.own && (!X.model || X.root.userData.villagerModel))
      .map(X => { X.root.getWorldPosition(p); return [X, CM.crowdRole(X.look || {}, X.height || 1, p.x, p.z)]; });
    const [c, hostRole] = free.find(([, r]) => r === role) || free.find(([, r]) => age(r) === age(role)) || [null, ''];
    if (!c) return null;
    c.root.getWorldPosition(p); h.place(p.x + 2, p.z + 2); const key = 'villager-' + id, ok = await A.loadFriendModels(key); await w(500);
    if (c.model) A.unwearVillagerModel(c);   // (the crowd's own gallery model, worn near the child)
    return { id, A: c, obj: c.root, host: hostRole, _vm: ok && A.wearVillagerModel(c, key) ? 'worn' : 'code' };
  };
  if (MODE === 'village') for (const spec of ids) {
    const [id, role] = spec.split('@');
    const n: any = role ? await regional(id, role) : G.npcs.find((x: any) => x.id === id); if (!n) { out[id + '-notfound'] = ''; continue; }
    if (!role) h.place(n.obj.position.x + 2, n.obj.position.z + 2); else console.log(id, 'worn by a crowd person of role', n.host);
    for (let k = 0; k < 80 && n._vm !== 'worn' && n._vm !== 'code'; k++) await w(200);
    if (n._vm !== 'worn') { out[id + '-notworn'] = ''; continue; }
    // (10 Nov 2026) houses, trees and stalls round a villager hid the face and body from the child's side, and hiding them
    // hid the group holding the lights too (a black picture): the villager is moved, as it stands, into a scene of its own
    // with copies of the valley's lights, and looked at from its own front; the far "still" copy (the old code person) is
    // never the one shown
    const solo = new THREE.Scene(); solo.background = new THREE.Color(0xbcd6ec);
    top.updateMatrixWorld(true); top.traverse((o: any) => { if (!o.isLight || !o.visible) return; const c = o.clone(false); o.getWorldPosition(c.position); solo.add(c); if (o.target) { c.target = new THREE.Object3D(); o.target.getWorldPosition(c.target.position); solo.add(c.target); } });
    const par = n.A.root.parent; A.showStill(n.A, false); solo.attach(n.A.root); SCN = solo;
    const fq = n.A.root.getWorldQuaternion(new THREE.Quaternion()), fd = new THREE.Vector3(0, 0, 1).applyQuaternion(fq), yaw = Math.atan2(fd.x, fd.z);
    // (10 Nov 2026, the 11 villagers on their own Meshy faces) every mood front and three-quarter, the eye moods from both
    // sides, the back from three sides, and the whole villager front, three-quarter and back in the valley's light
    for (const m of MOODS) { mood(n.A, n.A.model, m); for (const s of [0, .7]) headShot(`v-${id}-${m}-${s ? 'tq' : 'front'}`, n.A.root, n.A.model, yaw, s, true); }
    for (const m of ['smile', 'blink', 'lookL']) { mood(n.A, n.A.model, m); for (const s of [1.2, -1.2]) headShot(`v-${id}-${m}-side${s > 0 ? 'L' : 'R'}`, n.A.root, n.A.model, yaw, s, true); }
    mood(n.A, n.A.model, 'smile');
    for (const s of [Math.PI, 2.2, -2.2]) headShot(`v-${id}-neck-back-${s.toFixed(1)}`, n.A.root, n.A.model, yaw, s, true);
    { n.A.root.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(n.A.model.obj, true), c = box.getCenter(new THREE.Vector3()), Hh = box.max.y - box.min.y;
      for (const [nm, s] of [['front', 0], ['tq', .7], ['back', Math.PI]] as [string, number][]) {
        const dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).applyAxisAngle(new THREE.Vector3(0, 1, 0), s);
        const cf = new THREE.PerspectiveCamera(28, 360 / 480, .05, 200); cf.position.copy(c).addScaledVector(dir, Hh * 2.1); cf.lookAt(c); grab(`v-${id}-full-${nm}`, cf, 360, 480); } }
    par.attach(n.A.root); SCN = null;
  }
  return out;
}, [MODE, LIST, !!process.env.BARE, process.env.HIDE || ''] as any);   // (HIDE=shorts: that garment hidden in the poses, to tell which layer shows)
if (MODE === 'cover' || MODE === 'skirt') for (const [k, v] of Object.entries(shots)) if (!String(v).startsWith('data:')) console.log(k, v);
for (const [k, v] of Object.entries(shots)) { if (v) writeFileSync(`${OUT}/${k}.png`, Buffer.from(v.split(',')[1], 'base64')); else console.log('missing', k); }
console.log('shots', Object.keys(shots).length, 'in', OUT);
await b.close();
