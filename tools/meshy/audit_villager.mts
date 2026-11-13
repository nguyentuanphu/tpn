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
const LIMIT = { worn: 0, unseen: 0, eyes: 6, mouth: 100, oldmouth: 20, lookstill: 0, lid: 8, mshape: 12, stray: 12, size: 500 };   // (13 Nov 2026, from audit.mts's face pass, meshy-audit-coverage 6f0f226ee: 'lid' a shut eye paler than the skin round it; 'mshape' each mood's mouth shape)   // (unseen: the face pieces cover under 400 px of a head picture: nothing was looked at, 10 Nov)
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
      // (13 Nov 2026, audit.mts's 'lid', seen by eye on Sol at three-quarters) a shut eye must be the skin round it, its lash
      // line apart: a pixel in the eye area (the smile's eye whites grown 8 px) about as bright as the skin (not more than .1
      // darker) but .12 less saturated than the skin's median in a ring 8 to 16 px round it is a pale rim or a flat lid patch
      // (first run on the regional six: r064's earrings, the white patch at her ear and r045's hat lay under the face grid
      // as "eye whites" and counted, 61-128 px) only the whites the shut eye really covers: changed from smile to blink
      setMood('blink'); const CB = read(stage, cam); setMood('smile');
      const eye8 = new Uint8Array(N), ring16 = new Uint8Array(N);
      for (let i = 0; i < N; i++) if (white[i] && Math.abs(O[i * 4] - CB[i * 4]) + Math.abs(O[i * 4 + 1] - CB[i * 4 + 1]) + Math.abs(O[i * 4 + 2] - CB[i * 4 + 2]) > 60) { const x = i % W, y = (i / W) | 0; for (let dy = -16; dy <= 16; dy++) for (let dx = -16; dx <= 16; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const d = Math.max(Math.abs(dx), Math.abs(dy)); if (d <= 8) eye8[yy * W + xx] = 1; else ring16[yy * W + xx] = 1; } }
      for (const m of ['blink', 'happy']) {
        setMood(m); const C = read(stage, cam), f = new Uint8Array(N); let k = 0;
        for (let i = 0; i < N; i++) { if (!grow[i]) continue; const [v, sa] = hsv(C, i); if (v > .8 && sa < .18) { f[i] = 1; k++; } }
        const fl = new Uint8Array(N); let kl = 0; { const sv: number[] = [], ss: number[] = [];
          for (let i = 0; i < N; i++) if (ring16[i] && !eye8[i] && mine(i)) { const [v, sa] = hsv(C, i); if (v > .35) { sv.push(v); ss.push(sa); } }
          sv.sort((a, b) => a - b); ss.sort((a, b) => a - b); const skv = sv[sv.length >> 1] || 1, sks = ss[ss.length >> 1] || 0;
          for (let i = 0; i < N; i++) { if (!eye8[i] || !mine(i) || i >= N - W * 10) continue; const [v, sa] = hsv(C, i); if (v > skv - .1 && sa < sks - .12) { fl[i] = 1; kl++; } }
          const seen = new Uint8Array(N), st: number[] = [];   // (specks under 4 touching pixels are the lash's soft edge)
          for (let i = 0; i < N; i++) { if (!fl[i] || seen[i]) continue; const grp: number[] = []; st.push(i); seen[i] = 1;
            while (st.length) { const j = st.pop()!; grp.push(j); const x = j % W, y = (j / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const q = yy * W + xx; if (fl[q] && !seen[q]) { seen[q] = 1; st.push(q); } } }
            if (grp.length < 4) for (const j of grp) { fl[j] = 0; kl--; } } }
        cases.push({ id, pose: m, view: String(s), worn: 0, eyes: k, lid: kl });
        if (k > LIMIT.eyes) pics[`${id}-face-${m}-${s}-eyes`] = png(C, f);
        if (kl > LIMIT.lid || QUICK) pics[`${id}-face-${m}-${s}-lid`] = png(C, fl);
      }
      if (Math.abs(s) < 1) {
        /* (13 Nov 2026, audit.mts's 'mouth' as 'mshape') the lips are the pixels in a box below the smile's eye whites (between
           the nose tip, .22 of the eyes' span below them, and the chin, .62; within .27 of the span either side of the middle)
           pinker, redder or clearly darker than the skin's median there. Moods that keep the painted mouth must show the smile's
           lips; 'o' and 'excited' a roundish oval (height .55 to 1.6 of its width, filling .6 of its ellipse) that is not the
           smile's mouth, with no second patch, 'excited' larger than 'o'; 'sad' corners lower than its middle */
        let mx0 = W, mx1 = -1, my1 = -1; for (let i = 0; i < N; i++) if (white[i]) { const x = i % W, y = (i / W) | 0; mx0 = Math.min(mx0, x); mx1 = Math.max(mx1, x); my1 = my1 < 0 ? y : Math.min(my1, y); }
        const ew = mx1 - mx0, mcx = (mx0 + mx1) / 2; let mbox = (i: number) => { const x = i % W, y = (i / W) | 0; return ew > 8 && Math.abs(x - mcx) <= ew * .27 && y < my1 - ew * .22 && y > my1 - ew * .62; };
        const pk = (px: Uint8Array, i: number) => (px[i * 4 + 2] - px[i * 4 + 1]) / Math.max(1, px[i * 4]), vv = (px: Uint8Array, i: number) => Math.max(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]) / 255, rd = (px: Uint8Array, i: number) => (px[i * 4] - px[i * 4 + 1]) / Math.max(1, px[i * 4]);
        let skPk = 0, skV = 0, skRd = 0;
        const lips = (px: Uint8Array) => { const L = new Uint8Array(N); let n = 0; if (ew <= 8) return { L, n }; for (let i = 0; i < N; i++) { if (!mbox(i) || !mine(i)) continue; if (pk(px, i) > skPk + .09 || vv(px, i) < skV - .2 || rd(px, i) > skRd + .08) { L[i] = 1; n++; } } return { L, n }; };
        const near = (L: Uint8Array, i: number, d: number) => { const x = i % W, y = (i / W) | 0; for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && L[yy * W + xx]) return true; } return false; };
        const groups = (L: Uint8Array) => { const seen = new Uint8Array(N), out: number[][] = [], st: number[] = [];
          for (let i = 0; i < N; i++) { if (!L[i] || seen[i]) continue; const g: number[] = []; st.push(i); seen[i] = 1;
            while (st.length) { const j = st.pop()!; g.push(j); const x = j % W, y = (j / W) | 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const q = yy * W + xx; if (L[q] && !seen[q]) { seen[q] = 1; st.push(q); } } }
            out.push(g); } return out.sort((a, b) => b.length - a.length); };
        setMood('smile'); const C0 = read(stage, cam);
        { const ps: number[] = [], vs: number[] = [], rs: number[] = []; for (let i = 0; i < N; i++) if (mbox(i) && mine(i)) { ps.push(pk(C0, i)); vs.push(vv(C0, i)); rs.push(rd(C0, i)); } const md = (a: number[]) => a.sort((x, y) => x - y)[a.length >> 1] || 0; skPk = md(ps); skV = md(vs); skRd = md(rs); }
        // (first run on the regional six: the grown-ups' pink noses (r057, r074) and r045's blush lay in the friends' box and
        // counted as a second mouth, 88-1273 px, round clean "o" mouths) the box's top is moved down to just above the smile's
        // lips: the lowest patch on screen of 10 px or more, its top plus .08 of the eyes' span
        const bestL = new Uint8Array(N); let mtop = 1e9, mbot = -1e9, mxl = 1e9, mxr = -1e9; { const gs = groups(lips(C0).L).filter(g => g.length >= 10); let best: number[] | null = null, by = 1e9;
          for (const g of gs) { let sy = 0; for (const j of g) sy += (j / W) | 0; if (sy / g.length < by) { by = sy / g.length; best = g; } }
          if (best) { for (const j of best) bestL[j] = 1; let t = 0, u = 1e9; for (const j of best) { t = Math.max(t, (j / W) | 0); u = Math.min(u, (j / W) | 0); mxl = Math.min(mxl, j % W); mxr = Math.max(mxr, j % W); } mtop = t + ew * .08; mbot = u - ew * .3; } }
        // (second run: the box's foot, the friends' chin at .62, cut the grown-ups' large excited and "o" mouths in half (r057,
        // r074) and took the chin's shadow and r064's hair below it) the foot is .3 of the span under the smile's lips, and
        // only the face grid's own pixels count
        const mbox0 = mbox; mbox = (i: number) => { if (mtop > 1e8) return mbox0(i); const y = (i / W) | 0; const x = i % W; return ew > 8 && x >= mxl - ew * .15 && x <= mxr + ew * .15 && y < mtop && y > mbot && !!Pf[i * 4 + 3]; };   // (third run: at three-quarters the mouth is not half way between the eyes' outer edges: the box cut the "o" in half; it is the smile's lips, .15 of the span wider either side)   // (the buffer's rows run upwards: above on screen is a larger row)
        // (14 Nov 2026, audit.mts's 'stray', meshy-audit-coverage 24815e71d) a mood may change only the eyes and the mouth: a
        // pixel of the villager outside the eye zone (each eye's box round its whites, joined through the iris, pupil and
        // lashes, wider by 35% each way, at least 6 px) and the mouth box (3 px wider), that differs from the smile picture
        // by .08 from every pixel within 1 px, is a stray change (a skin patch over hair or a brow while shut, a lash piece on
        // the cheek, a dot on the nose); groups under 4 px left out
        let eyeZ: Uint8Array | null = null; { const seen = new Uint8Array(N), st: number[] = [];
          for (let i = 0; i < N; i++) { if (!white[i] || seen[i]) continue; let x0 = W, x1 = 0, y0 = H, y1 = 0, n = 0; st.push(i); seen[i] = 1;
            while (st.length) { const q = st.pop()!; n++; const x = q % W, y = (q / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
              for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const r2 = yy * W + xx; if ((white[r2] || (dark[r2] && Math.abs(xx - (i % W)) < 60 && Math.abs(yy - ((i / W) | 0)) < 50)) && !seen[r2]) { seen[r2] = 1; st.push(r2); } } }
            if (n < 6) continue; if (!eyeZ) eyeZ = new Uint8Array(N); const mx = Math.max(6, (x1 - x0) * .35), my = Math.max(6, (y1 - y0) * .35);
            for (let y = Math.max(0, Math.floor(y0 - my)); y <= Math.min(H - 1, Math.ceil(y1 + my)); y++) for (let x = Math.max(0, Math.floor(x0 - mx)); x <= Math.min(W - 1, Math.ceil(x1 + mx)); x++) eyeZ[y * W + x] = 1; } }
        const stray = (C: Uint8Array, ML: Uint8Array) => { const fs = new Uint8Array(N); let ks = 0; if (!eyeZ) return { fs, ks };
          for (let i = 0; i < N; i++) { if (eyeZ[i] || !mine(i) || i >= N - W * 10) continue; const x = i % W, y = (i / W) | 0;
            if (near(ML, i, 3) || near(SM.L, i, 3)) continue;   // (the mood's own mouth, bigger than the smile's: the excited "o")
            if (mtop < 1e8 && x >= mxl - ew * .15 - 3 && x <= mxr + ew * .15 + 3 && y <= mtop + 3 && y >= mbot - 3) continue;
            let best = 9; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const q = (yy * W + xx) * 4; best = Math.min(best, Math.hypot(C[i * 4] - C0[q], C[i * 4 + 1] - C0[q + 1], C[i * 4 + 2] - C0[q + 2]) / 255); }
            if (best > .08) { fs[i] = 1; ks++; } }
          for (const g of groups(fs)) if (g.length < 4) for (const j of g) { fs[j] = 0; ks--; }
          return { fs, ks }; };
        const SM = lips(C0), mArea: Record<string, number> = {}, mCase: Record<string, any> = {};
        if (SM.n) for (const m of ['blink', 'half', 'happy', 'lookL', 'lookR', 'o', 'excited', 'sad']) {
          setMood(m); const C = read(stage, cam), ML = lips(C), fm = new Uint8Array(N); let km = 0;
          // (fourth run: blush, the nose's highlight and the hair's edge by the chin, the same in the smile, counted as a second mouth) a pixel the mood does not change counts only when it is the smile's own lips
          const chg = (i: number) => Math.abs(C[i * 4] - C0[i * 4]) + Math.abs(C[i * 4 + 1] - C0[i * 4 + 1]) + Math.abs(C[i * 4 + 2] - C0[i * 4 + 2]) > 30 || near(bestL, i, 1);
          if (!['o', 'excited', 'sad'].includes(m)) { for (let i = 0; i < N; i++) if (((ML.L[i] && !near(SM.L, i, 1)) || (SM.L[i] && !near(ML.L, i, 1))) && chg(i)) { fm[i] = 1; km++; } }
          else { const gs = groups(ML.L), g0 = gs[0] || []; let bad = !g0.length;
            for (const g of gs.slice(1)) for (const j of g) if (chg(j)) { fm[j] = 1; km++; }
            let same = 0; for (const j of g0) if (near(SM.L, j, 1)) same++; let gx0 = W, gx1 = 0, gy0 = H, gy1 = 0; for (const j of g0) { const x = j % W, y = (j / W) | 0; gx0 = Math.min(gx0, x); gx1 = Math.max(gx1, x); gy0 = Math.min(gy0, y); gy1 = Math.max(gy1, y); }
            const w = gx1 - gx0 + 1, hh = gy1 - gy0 + 1;
            if (g0.length && same > g0.length * .85 && Math.abs(g0.length - SM.n) < SM.n * .2) bad = true;
            if (m === 'o' || m === 'excited') { if (hh / w < .55 || hh / w > 1.6 || g0.length < Math.PI / 4 * w * hh * .6) bad = true; mArea[m] = g0.length; }
            if (m === 'sad' && g0.length) { const col = (a: number, b2: number) => { let sy = 0, c = 0; for (const j of g0) { const x = j % W; if (x >= gx0 + w * a && x <= gx0 + w * b2) { sy += (j / W) | 0; c++; } } return c ? sy / c : 0; };
              if ((col(0, .2) + col(.8, 1)) / 2 >= col(.4, .6)) bad = true; }   // (the buffer's rows run upwards: a corner lower on screen has the smaller row)
            if (bad) for (const j of g0) { if (!fm[j]) { fm[j] = 1; km++; } } }
          const ST = stray(C, ML.L);
          const r: any = { id, pose: m, view: String(s), worn: 0, eyes: 0, mshape: km, stray: ST.ks }; cases.push(r); mCase[m] = [r, C, fm, ML.L];
          if (ST.ks > LIMIT.stray || QUICK) pics[`${id}-face-${m}-${s}-stray`] = png(C, ST.fs);
          if (km > LIMIT.mshape || QUICK) pics[`${id}-face-mshape-${m}-${s}`] = png(C, fm);
        }
        if (mArea.o && mArea.excited && mArea.excited < mArea.o * 1.15 && mCase.excited) { const [r, C, fm, EL] = mCase.excited; for (let i = 0; i < N; i++) if (EL[i] && !fm[i]) { fm[i] = 1; r.mshape++; } pics[`${id}-face-mshape-excited-${s}`] = png(C, fm); }   // (excited: as open as 'o' or less)
        setMood('smile');
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
          if (m === 'o') { const XS: number[] = [], YS: number[] = []; for (let i = 0; i < N; i++) { const y = (i / W) | 0; if (Pf[i * 4 + 3] && y < eyy - 6 && df(S0, SM, i)) { XS.push(i % W); YS.push(y); } }
            if (XS.length) { XS.sort((a, b) => a - b); YS.sort((a, b) => a - b); const q = (A: number[], f: number) => A[Math.min(A.length - 1, Math.floor(A.length * f))];   // (12 Nov 2026: the 5th to 95th percentile, not the extremes: a few stray changed pixels on r045's three-quarter view stretched the box over her blushed cheek, counted 628 with a clean mouth)
              x0 = q(XS, .05); x1 = q(XS, .95); y0 = q(YS, .05); y1 = q(YS, .95); } }
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
