// (Meshy production, 10 Nov 2026) The villagers' auditor: the same gate as audit.mts (which is for the four friends and
// their clothes), for the named villagers, whole Meshy models on their own painted faces with mood pieces. Each villager
// is drawn by the game itself where it stands in the valley (js/main.ts wears models/villager-<id>.glb near a child):
//   worn     the model must be worn (not the code person): 1 when it is not
//   eyes     every closed mood (blink, happy) from the front, three-quarters and the sides: no eye white (pale,
//            colourless pixels where the open eye's white was, beside its dark iris) may be left; the same rule as audit.mts
//   unseen   the face pieces cover under 400 px of a head picture (the villager was not in the picture: it passes nothing)
//   mouth    front view: how far the mood mouth (what changes from smile to surprised, below the eyes) lies under the eyes
//            (what changes from smile to blink), in hundredths of the eyes' width: Bom's mouth on his collar (10 Nov)
//   oldmouth front and both three-quarters (owner 11 Nov 2026: "con mắt, mũi và miệng đều có vấn đề", the sad and "o"
//            faces showed a second mouth: the painted smile stayed under the new one): pixels round the mood mouth that
//            are as dark as a mouth line, lip-coloured (red over green), and did not change from the smile face (the old
//            mouth still showing)
//   lookstill front view (12 Nov 2026: every look piece was empty for a whole round and nothing said so; the eyes never
//            moved): the look-left and look-right moods that change under 5% as many pixels as the blink does (an empty
//            piece changes none; a sound look on r050's wide eyes changes about a tenth: 15%, the first guess, failed it)
//   size     models/villager-<id>.glb over 500 KB
// It also keeps pose pictures (idle, walk, wave, cheer, sit; front and back) for the review sheets.
//   cd tests; SV_URL=http://localhost:<port>/ node ../tools/meshy/audit_villager.mts <out dir> ba,bom,... [quick]
//   ... audit_villager.mts <out dir> r045@vn-schoolgirl,r050@vn-grandma   (regional people by their file, worn by a crowd person of that role)
//   node ../tools/meshy/audit_villager.mts <out dir> merge   (joins <out>/part-<id> runs, as audit.mts merge)
import { createRequire } from 'node:module';
import { open, clear } from '../../tests/harness.mts';
const { chromium } = createRequire(new URL('../../tests/package.json', import.meta.url))('playwright');
import { writeFileSync, mkdirSync, readdirSync, readFileSync, copyFileSync, existsSync, statSync } from 'node:fs';
const [OUT, LIST = 'ba', QUICK = ''] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const LIMIT = { worn: 0, unseen: 0, eyes: 6, mouth: 100, oldmouth: 20, lookstill: 0, size: 500 };   // (unseen: the face pieces cover under 400 px of a head picture: nothing was looked at, 10 Nov)
function summarize(cs: any[]) { const keys = Object.keys(LIMIT), fail = cs.filter(c => keys.some(k => c[k] > LIMIT[k]));
  const lines = [`audit ${new Date().toISOString()} cases ${cs.length} failing ${fail.length}`];
  for (const k of keys) lines.push(`${k}: ${cs.filter(c => c[k] > LIMIT[k]).length} cases over ${LIMIT[k]}, worst ${Math.max(0, ...cs.map(c => c[k] || 0))}`);
  for (const id of [...new Set(cs.map(c => c.id))]) { const f = fail.filter(c => c.id === id); if (f.length) lines.push(`${id}: ` + f.map(c => `${c.pose}/${c.view} ` + keys.filter(k => c[k] > LIMIT[k]).map(k => `${k} ${c[k]}`).join(' ')).join('; ')); }
  writeFileSync(`${OUT}/summary.txt`, lines.join('\n') + '\n'); writeFileSync(`${OUT}/cases.json`, JSON.stringify(cs)); console.log(lines.join('\n')); }
if (LIST === 'merge') {
  const cs: any[] = [];
  for (const d of readdirSync(OUT).filter(d => d.startsWith('part-') && !d.includes('.'))) { const dir = `${OUT}/${d}`;
    if (!existsSync(`${dir}/cases.json`)) throw new Error(`audit part ${d} has no cases.json: it failed`);
    cs.push(...JSON.parse(readFileSync(`${dir}/cases.json`, 'utf8')));
    for (const f of readdirSync(dir).filter(f => f.endsWith('.png'))) copyFileSync(`${dir}/${f}`, `${OUT}/${f}`); }
  summarize(cs); process.exit(0);
}
const ids = LIST.split(',').map(s => s.split('@')[0]);
const sizes: Record<string, number> = {}; for (const id of ids) { const f = new URL(`../../models/villager-${id}.glb`, import.meta.url); sizes[id] = existsSync(f) ? Math.round(statSync(f).size / 1024) : 99999; }
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
// (10 Nov 2026: on a busy machine (other chats' audits at 100% CPU) the page took over 30 s to load: 3 min limits, three tries)
const nc = b.newContext.bind(b); b.newContext = async (o: any) => { const c = await nc(o); c.setDefaultNavigationTimeout(180000); c.setDefaultTimeout(180000); return c; };
let P: any = null; for (let t = 0; t < 3 && !P; t++) { try { P = await open(b, { w: 900, h: 700, fast: false }); } catch (e) { console.error('open failed, try', t + 1, String(e).slice(0, 120)); if (t === 2) throw e; } }
await clear(P.page);
const res: any = await P.page.evaluate(async ([LIST, QUICK, LIMIT]) => {
  const G = (window as any).__sv, A = await import(String('/js/avatar.js')), { THREE } = await import(String('/js/gfx.js'));
  const h = G.heroes[0], R = G.renderer;
  const w = (ms: number) => { dispatchEvent(new Event('pointermove')); document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; G.world.time = .42; return new Promise(res => setTimeout(res, ms)); };
  let top = h.av.root; while (top.parent) top = top.parent; G.world.time = .42;
  const W = 360, H = 480, rt = new THREE.WebGLRenderTarget(W, H), N = W * H;
  // (10 Nov 2026: a villager standing still shows the far "still" copy, the old code person (js/main.ts showStill), even
  // near the camera here: the first round audited that copy, not the Meshy model. Every picture shows the model.)
  let cur: any = null; const useModel = () => { if (cur) { A.showStill(cur, false); if (cur.model) cur.model.obj.visible = true; } };
  const read = (scene: any, cam: any) => { useModel(); cam.layers.enableAll(); R.setRenderTarget(rt);   // (a villager far from the valley's camera is on layer 1, js/main.ts: six of eleven came out blank and passed)
  R.setClearColor(0x000000, 0); R.clear(); R.render(scene, cam); const px = new Uint8Array(N * 4); R.readRenderTargetPixels(rt, 0, 0, W, H, px); R.setRenderTarget(null); return px; };
  const png = (px: Uint8Array, flags: Uint8Array | null) => {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'), im = x.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) { const s = ((H - 1 - y) * W + i) * 4, d = (y * W + i) * 4; const f = flags && flags[(H - 1 - y) * W + i];
      im.data[d] = f ? 255 : px[s]; im.data[d + 1] = f ? 0 : px[s + 1]; im.data[d + 2] = f ? 255 : px[s + 2]; im.data[d + 3] = 255; }
    x.putImageData(im, 0, 0); return cv.toDataURL('image/png');
  };
  const flat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const cases: any[] = [], pics: Record<string, string> = {};
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
  const headYaw = (M: any, guess: number) => {   // (10 Nov 2026: a crowd host turns its head to look at the child: the face's own direction, head bone to the smile piece's middle)
    let hb: any = null; const c = new THREE.Vector3(); let k = 0;
    M.obj.updateMatrixWorld(true); M.obj.traverse((o: any) => { if (o.isBone && o.name === 'head') hb = o; if (o.isMesh && (o.material && o.material.name) === 'face-smile') { c.add(new THREE.Box3().setFromObject(o, true).getCenter(new THREE.Vector3())); k++; } });
    if (!hb || !k) return guess; c.divideScalar(k); const h = hb.getWorldPosition(new THREE.Vector3()); return Math.atan2(c.x - h.x, c.z - h.z); };
  const faceYaw = (av: any, M: any, guess: number) => {   // (10 Nov 2026: a crowd host's rig and root both missed r045's facing by about .6: read it from the model's own shoulders, the side nearest the guess)
    let aL: any = null, aR: any = null; M.obj.traverse((o: any) => { if (o.isBone && o.name === 'armL') aL = o; if (o.isBone && o.name === 'armR') aR = o; });
    if (!aL || !aR) return guess; av.root.updateMatrixWorld(true); const d = aL.getWorldPosition(new THREE.Vector3()).sub(aR.getWorldPosition(new THREE.Vector3()));
    const y1 = Math.atan2(-d.z, d.x), y2 = y1 + Math.PI, df = (a: number) => Math.abs(Math.atan2(Math.sin(a - guess), Math.cos(a - guess)));
    return df(y1) < df(y2) ? y1 : y2; };
  for (const spec of LIST.split(',')) {
    const [id, role] = spec.split('@');
    const n: any = role ? await regional(id, role) : G.npcs.find((x: any) => x.id === id); if (!n) { cases.push({ id, pose: 'find', view: role || '-', worn: 1, eyes: 0 }); continue; }
    if (!role) h.place(n.obj.position.x + 2, n.obj.position.z + 2); else { cases.push({ id, pose: 'host', view: n.host, worn: 0, eyes: 0 }); n.A.life = null; A.animate(n.A, 'idle', 1); }   // (a crowd host may be sitting: stood up before its facing is read)
    for (let k = 0; k < 240 && n._vm !== 'worn' && n._vm !== 'code'; k++) await w(500);   // (up to 2 min: 24 s was too short on a busy machine)
    if (n._vm !== 'worn') { cases.push({ id, pose: 'wear', view: String(n._vm), worn: 1, eyes: 0 }); continue; }
    const av = n.A; cur = av; const M = av.model;
    // (10 Nov 2026: villagers stand by houses, trees and stalls; seen from the child's side these hid the face, so the eye
    // check passed on a wall, and hiding them hid the lights too) the villager is moved, as it stands, into a stage of its
    // own with copies of the valley's lights, and looked at from its own front
    const stage = new THREE.Scene(); top.updateMatrixWorld(true);
    top.traverse((o: any) => { if (!o.isLight || !o.visible) return; const c = o.clone(false); o.getWorldPosition(c.position); stage.add(c); if (o.target) { c.target = new THREE.Object3D(); o.target.getWorldPosition(c.target.position); stage.add(c.target); } });
    const home = av.root.parent; stage.attach(av.root);
    const fd = new THREE.Vector3(0, 0, 1).applyQuaternion((role ? av.rig : av.root).getWorldQuaternion(new THREE.Quaternion())), yaw0 = Math.atan2(fd.x, fd.z), yaw = role ? faceYaw(av, M, yaw0) : yaw0   /* (a crowd host turns its rig, not its root; and the shoulders say where the model faces) */;
    let hb: any = null; M.obj.traverse((o: any) => { if (o.isBone && o.name === 'head') hb = o; });
    G.paused = true;   // (the valley's own update would turn the villager and change its mood between pictures)
    // (and the code person's own parts must be the hidden ones: count what is drawn of each)
    let codeOn = 0; av.rig.traverse((o: any) => { if (o.isMesh && o.visible && !M.obj.getObjectById(o.id)) { let p = o, vis = true; while (p && p !== av.root) { if (!p.visible) vis = false; p = p.parent; } if (vis) codeOn++; } });
    if (codeOn) cases.push({ id, pose: 'code-parts', view: String(codeOn), worn: 1, eyes: 0 });
    const setMood = (m: string) => { if (av.life) { av.life.mood = m; av.life.blink = av.life.t + 60; av.life.glance = av.life.t + 60; av.life.feel = ''; } M.follow(m); };
    let hyaw = yaw;
    const frame = (s: number, k: number, hd: boolean) => {   // head (k .86 of the height, close) or whole villager
      av.root.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(M.obj, true), Hh = box.max.y - box.min.y, c = box.getCenter(new THREE.Vector3());
      const at = hd ? (hb ? hb.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, .1, 0)) : new THREE.Vector3(c.x, box.min.y + Hh * k, c.z)) : c, dir = new THREE.Vector3(Math.sin(hd ? hyaw : yaw), 0, Math.cos(hd ? hyaw : yaw)).applyAxisAngle(new THREE.Vector3(0, 1, 0), s);
      const cam = new THREE.PerspectiveCamera(28, W / H, .05, 200); cam.position.copy(at).addScaledVector(dir, Hh * (hd ? .75 : 2.1)); cam.lookAt(at); cam.updateMatrixWorld(true); return cam;
    };
    // eyes (audit.mts's rule): the open eye's whites are found in the smile, under the face pieces only, and must be gone shut
    av.life = null; A.animate(av, 'idle', 1); setMood('smile'); hyaw = role ? headYaw(M, yaw) : yaw;
    for (const s of (QUICK ? [0, .7] : [0, .7, -.7, 1.2, -1.2])) {
      const cam = frame(s, .86, true), solo = new THREE.Scene(), par = stage;
      const saved: any[] = []; M.obj.traverse((o: any) => { if (o.isMesh) saved.push([o, o.material, o.visible]); });
      setMood('smile'); saved.forEach(([o, m, v]: any) => { o.visible = v && /^face-/.test(m.name || ''); if (o.visible) o.material = flat; });
      solo.add(av.root); av.root.updateMatrixWorld(true); const Pf = read(solo, cam); par.add(av.root); av.root.updateMatrixWorld(true);
      saved.forEach(([o, m, v]: any) => { o.material = m; o.visible = v; });
      { let fp = 0; for (let i = 0; i < N; i++) if (Pf[i * 4 + 3]) fp++; if (fp < 400) cases.push({ id, pose: 'seen', view: String(s), worn: 0, eyes: 0, unseen: 1, facePx: fp }); }
      const tags: any[] = []; av.root.traverse((o: any) => { if ((o.isSprite || o.isMesh) && o.visible && !saved.some(x => x[0] === o)) { tags.push(o); o.visible = false; } });
      const O = read(stage, cam); par.remove(av.root); const Bk = read(stage, cam); par.add(av.root); av.root.updateMatrixWorld(true);
      const mine = (i: number) => Math.abs(O[i * 4] - Bk[i * 4]) + Math.abs(O[i * 4 + 1] - Bk[i * 4 + 1]) + Math.abs(O[i * 4 + 2] - Bk[i * 4 + 2]) > 24;
      const hsv = (px: Uint8Array, i: number) => { const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2], mx = Math.max(r, g, b); return [mx / 255, mx ? (mx - Math.min(r, g, b)) / mx : 0]; };
      const dark = new Uint8Array(N); for (let i = 0; i < N; i++) { if (!Pf[i * 4 + 3]) continue; if (hsv(O, i)[0] < .35) dark[i] = 1; }
      const nearDark = (i: number) => { const x = i % W, y = (i / W) | 0; for (let dy = -8; dy <= 8; dy += 2) for (let dx = -8; dx <= 8; dx += 2) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && dark[yy * W + xx]) return true; } return false; };
      const white = new Uint8Array(N); for (let i = 0; i < N; i++) { if (!Pf[i * 4 + 3] || !mine(i) || i >= N - W * 10) continue; const [v, sa] = hsv(O, i); if (v > .82 && sa < .16 && nearDark(i)) white[i] = 1; }
      const grow = new Uint8Array(N); for (let i = 0; i < N; i++) if (white[i]) { const x = i % W, y = (i / W) | 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) grow[yy * W + xx] = 1; } }
      for (const m of ['blink', 'happy']) {
        setMood(m); const C = read(stage, cam), f = new Uint8Array(N); let k = 0;
        for (let i = 0; i < N; i++) { if (!grow[i]) continue; const [v, sa] = hsv(C, i); if (v > .8 && sa < .18) { f[i] = 1; k++; } }
        cases.push({ id, pose: m, view: String(s), worn: 0, eyes: k });
        if (k > LIMIT.eyes) pics[`${id}-face-${m}-${s}-eyes`] = png(C, f);
      }
      if (s === 0) {   // the mouth's place, front only
        setMood('smile'); const S0 = read(stage, cam); setMood('blink'); const SB = read(stage, cam); setMood('o'); const SS = read(stage, cam); setMood('smile');
        const df = (a: Uint8Array, b: Uint8Array, i: number) => Math.abs(a[i * 4] - b[i * 4]) + Math.abs(a[i * 4 + 1] - b[i * 4 + 1]) + Math.abs(a[i * 4 + 2] - b[i * 4 + 2]) > 40;
        let ex0 = W, ex1 = -1, ey = 0, en = 0; for (let i = 0; i < N; i++) if (df(S0, SB, i)) { const x = i % W, y = (i / W) | 0; ex0 = Math.min(ex0, x); ex1 = Math.max(ex1, x); ey += y; en++; }
        if (en > 20) { ey /= en; let my = 0, mn = 0; const f = new Uint8Array(N);
          for (let i = 0; i < N; i++) { const y = (i / W) | 0; if (y < ey - 4 && df(S0, SS, i)) { my += y; mn++; f[i] = 1; } }   // (the buffer is upside down: below the eyes is a smaller y)
          const gap = mn > 10 ? Math.round((ey - my / mn) / Math.max(1, ex1 - ex0) * 100) : 0;
          cases.push({ id, pose: 'surprised', view: 'mouth', worn: 0, eyes: 0, mouth: gap }); if (gap > LIMIT.mouth || QUICK) pics[`${id}-face-mouth-${gap}`] = png(SS, f); }
      }
      if (s === 0 || Math.abs(s) === .7) {   // (11 Nov 2026) the old painted mouth must be gone under the "o" and sad mouths
        const lum = (P: Uint8Array, i: number) => P[i * 4] * .3 + P[i * 4 + 1] * .59 + P[i * 4 + 2] * .11;
        const inner = (i: number) => { const x = i % W, y = (i / W) | 0; for (let dy = -3; dy <= 3; dy += 3) for (let dx = -3; dx <= 3; dx += 3) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H || !Pf[(yy * W + xx) * 4 + 3]) return false; } return true; };   // (not the face's outline: its edge pixels against the dark background)
        setMood('smile'); const S0 = read(stage, cam); setMood('blink'); const SB = read(stage, cam);
        const df = (a: Uint8Array, b: Uint8Array, i: number) => Math.abs(a[i * 4] - b[i * 4]) + Math.abs(a[i * 4 + 1] - b[i * 4 + 1]) + Math.abs(a[i * 4 + 2] - b[i * 4 + 2]) > 30;
        let ey = 0, en = 0; for (let i = 0; i < N; i++) if (df(S0, SB, i)) { ey += (i / W) | 0; en++; }
        let x0 = W, x1 = -1, y0 = H, y1 = -1;   // (the mouth's place: what the "o" face changes, on the face, below the eyes; sad changes the eyes too)
        for (const m of ['o', 'sad']) {
          setMood(m); const SM = read(stage, cam); if (en < 20) break; const eyy = ey / en;
          if (m === 'o') for (let i = 0; i < N; i++) { const y = (i / W) | 0; if (Pf[i * 4 + 3] && y < eyy - 6 && df(S0, SM, i)) { const x = i % W; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
          if (x1 < 0) { cases.push({ id, pose: m, view: String(s), worn: 0, eyes: 0, oldmouth: 99 }); continue; }   // (no mouth change at all)
          const mx = Math.round((x1 - x0) * .3), my = Math.max(6, Math.round((y1 - y0) * .4)), L: number[] = [];
          for (let y = Math.max(0, y0 - my); y <= Math.min(H - 1, y1 + my); y++) for (let x = Math.max(0, x0 - mx); x <= Math.min(W - 1, x1 + mx); x++) if (Pf[(y * W + x) * 4 + 3]) L.push(lum(S0, y * W + x));
          L.sort((a, b) => a - b); const skin = L[Math.floor(L.length * .7)] || 0, f = new Uint8Array(N); let k = 0;
          for (let y = Math.max(0, y0 - my); y <= Math.min(H - 1, y1 + my); y++) for (let x = Math.max(0, x0 - mx); x <= Math.min(W - 1, x1 + mx); x++) {
            const i = y * W + x; if (inner(i) && !df(S0, SM, i) && lum(SM, i) < skin - 22 && lum(S0, i) < skin - 22 && Math.abs(S0[i * 4] - SM[i * 4]) < 12 && S0[i * 4] - S0[i * 4 + 1] > 30) { f[i] = 1; k++; } }   // (12 Nov 2026: and lip-coloured, red over green: dark hair at the face's edge (r045) and a helmet strap by the chin (r057) were counted, 40-242, with clean mouths)
          cases.push({ id, pose: m, view: String(s), worn: 0, eyes: 0, oldmouth: k }); if (k > LIMIT.oldmouth || QUICK) pics[`${id}-face-oldmouth-${m}-${s}`] = png(SM, f);
        }
        setMood('smile');
        if (s === 0 && en >= 20) {   // (12 Nov 2026) the look moods must move the eyes
          let still = 0; for (const m of ['lookL', 'lookR']) { setMood(m); const SL = read(stage, cam); let n = 0; for (let i = 0; i < N; i++) if (df(S0, SL, i)) n++; if (n < en * .05) still++; }
          cases.push({ id, pose: 'look', view: '0', worn: 0, eyes: 0, lookstill: still }); setMood('smile');
        }
      }
      tags.forEach(o => { o.visible = true; });
    }
    setMood('smile');
    // poses for the sheets (no counts): the villagers' own animations, front and back
    for (const [pn, st, sp, frames] of [['idle', 'idle', 0, 1], ['walk', 'walk', 3, 9], ['wave', 'wave', 0, 3], ['cheer', 'cheer', 0, 3], ['sit', 'sit', 0, 2]] as [string, string, number, number][]) {
      if (QUICK && pn !== 'idle' && pn !== 'walk') continue;
      av.life = null; for (let f = 0; f <= frames; f++) A.animate(av, st, 10 + f * .05, sp);   // (life reset: the valley's time made the first frame not fresh)
      M.follow('smile');
      for (const [vn, s] of [['front', 0], ['back', Math.PI]] as [string, number][]) pics[`${id}-pose-${pn}-${vn}`] = png(read(stage, frame(s, 0, false)), null);
    }
    home.attach(av.root); av.life = null; A.animate(av, 'idle', 1); G.paused = false;
  }
  return { cases, pics };
}, [LIST, QUICK, LIMIT] as any);
for (const id of ids) res.cases.push({ id, pose: 'file', view: 'models', worn: 0, eyes: 0, size: sizes[id] });
for (const [k, v] of Object.entries(res.pics as Record<string, string>)) writeFileSync(`${OUT}/${k}.png`, Buffer.from(v.split(',')[1], 'base64'));
summarize(res.cases);
await b.close();
