// (Meshy production, 10 Nov 2026) The villagers' auditor: the same gate as audit.mts (which is for the four friends and
// their clothes), for the named villagers, whole Meshy models on their own painted faces with mood pieces. Each villager
// is drawn by the game itself where it stands in the valley (js/main.ts wears models/villager-<id>.glb near a child):
//   worn     the model must be worn (not the code person): 1 when it is not
//   eyes     every closed mood (blink, happy) from the front, three-quarters and the sides: no eye white (pale,
//            colourless pixels where the open eye's white was, beside its dark iris) may be left; the same rule as audit.mts
//   unseen   the face pieces cover under 400 px of a head picture (the villager was not in the picture: it passes nothing)
//   mouth    front view: how far the mood mouth (what changes from smile to surprised, below the eyes) lies under the eyes
//            (what changes from smile to blink), in hundredths of the eyes' width: Bom's mouth on his collar (10 Nov)
//   size     models/villager-<id>.glb over 500 KB
// It also keeps pose pictures (idle, walk, wave, cheer, sit; front and back) for the review sheets.
//   cd tests; SV_URL=http://localhost:<port>/ node ../tools/meshy/audit_villager.mts <out dir> ba,bom,... [quick]
//   node ../tools/meshy/audit_villager.mts <out dir> merge   (joins <out>/part-<id> runs, as audit.mts merge)
import { createRequire } from 'node:module';
import { open, clear } from '../../tests/harness.mts';
const { chromium } = createRequire(new URL('../../tests/package.json', import.meta.url))('playwright');
import { writeFileSync, mkdirSync, readdirSync, readFileSync, copyFileSync, existsSync, statSync } from 'node:fs';
const [OUT, LIST = 'ba', QUICK = ''] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const LIMIT = { worn: 0, unseen: 0, eyes: 6, shut: 6, lid: 8, lips: 12, mouth: 100, size: 500, hdsize: 2500 };   // (lid, lips: 13 Nov 2026, from audit.mts's face pass (branch meshy-audit-coverage): a shut lid paler than the skin round it; each mood's mouth shape)   // (shut: 12 Nov 2026, dark or white pixels left in the eye areas while shut, any side)   // (hdsize: models/villager-<id>-hd.glb, worn near a child, 11 Nov 2026)   // (unseen: the face pieces cover under 400 px of a head picture: nothing was looked at, 10 Nov)
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
const ids = LIST.split(',');
const sizes: Record<string, number> = {}, hdsizes: Record<string, number> = {}; for (const id of ids) { const f = new URL(`../../models/villager-${id}.glb`, import.meta.url), fh = new URL(`../../models/villager-${id}-hd.glb`, import.meta.url); sizes[id] = existsSync(f) ? Math.round(statSync(f).size / 1024) : 99999; hdsizes[id] = existsSync(fh) ? Math.round(statSync(fh).size / 1024) : 0; }
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
  let cur: any = null; const useModel = () => { if (cur) { A.showStill(cur, false); if (cur.model && !cur._hd) cur.model.obj.visible = true; } };
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
  for (const id of LIST.split(',')) {
    const n = G.npcs.find((x: any) => x.id === id); if (!n) { cases.push({ id, pose: 'find', view: '-', worn: 1, eyes: 0 }); continue; }
    h.place(n.obj.position.x + 2, n.obj.position.z + 2);
    for (let k = 0; k < 240 && n._vm !== 'worn' && n._vm !== 'code'; k++) await w(500);   // (up to 2 min: 24 s was too short on a busy machine)
    if (n._vm !== 'worn') { cases.push({ id, pose: 'wear', view: String(n._vm), worn: 1, eyes: 0 }); continue; }
    const av = n.A; cur = av;
    // (10 Nov 2026: villagers stand by houses, trees and stalls; seen from the child's side these hid the face, so the eye
    // check passed on a wall, and hiding them hid the lights too) the villager is moved, as it stands, into a stage of its
    // own with copies of the valley's lights, and looked at from its own front
    const stage = new THREE.Scene(); stage.fog = top.fog; stage.environment = top.environment; top.updateMatrixWorld(true);
    top.traverse((o: any) => { if (!o.isLight || !o.visible) return; const c = o.clone(false); o.getWorldPosition(c.position); stage.add(c); if (o.target) { c.target = new THREE.Object3D(); o.target.getWorldPosition(c.target.position); stage.add(c.target); } });
    const home = av.root.parent; stage.attach(av.root);
    av.life = null; A.animate(av, 'idle', 1); av.root.updateMatrixWorld(true);   // (the idle pose first: it turns the body back, and a front taken before it was three-quarters)
    const fd = new THREE.Vector3(0, 0, 1).applyQuaternion((av.rig || av.root).getWorldQuaternion(new THREE.Quaternion()));
    const faceDir = (M: any, fb: any) => { M.obj.updateMatrixWorld(true); let hb: any = null, fm: any = null; M.obj.traverse((o: any) => { if (o.isBone && o.name === 'head') hb = o; if (o.isMesh && /^face-smile/.test(o.material && o.material.name || '')) fm = o; }); if (!hb || !fm) return fb; const c = new THREE.Box3().setFromObject(fm, true).getCenter(new THREE.Vector3()), h = hb.getWorldPosition(new THREE.Vector3()), d = c.sub(h); d.y = 0; return d.lengthSq() > 1e-6 ? Math.atan2(d.x, d.z) : fb; };   // (11 Nov 2026: the face's own front, from the head to its face pieces: the body and its root turn to the child while the review waits)
    const yaw = faceDir(av.model, Math.atan2(fd.x, fd.z));
    // (11 Nov 2026) both models: the high-detail one (near, id-hd) and the light one (far, id)
    for (const [tg, M] of ([['', av.model], ['-hd', av.modelHD]] as [string, any][])) { if (!M) continue; A.showHD(av, M === av.modelHD);
      let hb: any = null; M.obj.traverse((o: any) => { if (o.isBone && o.name === 'head') hb = o; });
      G.paused = true;   // (the valley's own update would turn the villager and change its mood between pictures)
      // (and the code person's own parts must be the hidden ones: count what is drawn of each)
      let codeOn = 0; av.rig.traverse((o: any) => { if (o.isMesh && o.visible && !M.obj.getObjectById(o.id)) { let p = o, vis = true; while (p && p !== av.root) { if (!p.visible) vis = false; p = p.parent; } if (vis) codeOn++; } });
      if (codeOn) cases.push({ id: id + tg, pose: 'code-parts', view: String(codeOn), worn: 1, eyes: 0 });
      const setMood = (m: string) => { if (av.life) { av.life.mood = m; av.life.blink = av.life.t + 60; av.life.glance = av.life.t + 60; av.life.feel = ''; } M.follow(m); };
      const frame = (s: number, k: number, hd: boolean) => {   // head (k .86 of the height, close) or whole villager
        av.root.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(M.obj, true), Hh = box.max.y - box.min.y, c = box.getCenter(new THREE.Vector3());
        const at = hd ? (hb ? hb.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, .1, 0)) : new THREE.Vector3(c.x, box.min.y + Hh * k, c.z)) : c, dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).applyAxisAngle(new THREE.Vector3(0, 1, 0), s);
        const cam = new THREE.PerspectiveCamera(28, W / H, .05, 200); cam.position.copy(at).addScaledVector(dir, Hh * (hd ? .75 : 2.1)); cam.lookAt(at); cam.updateMatrixWorld(true); return cam;
      };
      // eyes (audit.mts's rule): the open eye's whites are found in the smile, under the face pieces only, and must be gone shut
      av.life = null; A.animate(av, 'idle', 1);
      for (const s of (QUICK ? [0, .4, .7] : [0, .4, -.4, .7, -.7, 1.2, -1.2])) {   // (±.4, 12 Nov 2026: where the far eye shows beside the nose)
        const cam = frame(s, .86, true), solo = new THREE.Scene(), par = stage;
        const saved: any[] = []; M.obj.traverse((o: any) => { if (o.isMesh) saved.push([o, o.material, o.visible]); });
        setMood('smile'); saved.forEach(([o, m, v]: any) => { o.visible = v && /^face-/.test(m.name || ''); if (o.visible) o.material = flat; });
        solo.add(av.root); av.root.updateMatrixWorld(true); const Pf = read(solo, cam); par.add(av.root); av.root.updateMatrixWorld(true);
        saved.forEach(([o, m, v]: any) => { o.material = m; o.visible = v; });
        { let fp = 0; for (let i = 0; i < N; i++) if (Pf[i * 4 + 3]) fp++; if (fp < 400) cases.push({ id: id + tg, pose: 'seen', view: String(s), worn: 0, eyes: 0, unseen: 1, facePx: fp }); }
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
          cases.push({ id: id + tg, pose: m, view: String(s), worn: 0, eyes: k });
          if (k > LIMIT.eyes) pics[`${id}${tg}-face-${m}-${s}-eyes`] = png(C, f);
        }
        // (13 Nov 2026, audit.mts's 'lid' and 'mouth' rules, ported) lid: a shut eye (blink, happy) must be the skin round it,
        // its lash line apart: a pixel in the eye area (the smile's whites grown 8 px) about as bright as the skin (not more than
        // .1 darker) but .12 less saturated than the skin's median in a ring 8 to 16 px round it is a pale rim or flat lid patch
        { const eye8 = new Uint8Array(N), ring16 = new Uint8Array(N);
          for (let i = 0; i < N; i++) if (white[i]) { const x = i % W, y = (i / W) | 0; for (let dy = -16; dy <= 16; dy++) for (let dx = -16; dx <= 16; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const d = Math.max(Math.abs(dx), Math.abs(dy)); if (d <= 8) eye8[yy * W + xx] = 1; else ring16[yy * W + xx] = 1; } }
          for (const m of ['blink', 'happy']) { setMood(m); const C = read(stage, cam), fl = new Uint8Array(N); let kl = 0; const sv: number[] = [], ss: number[] = [];
            for (let i = 0; i < N; i++) if (ring16[i] && !eye8[i] && mine(i)) { const [v, sa] = hsv(C, i); if (v > .35) { sv.push(v); ss.push(sa); } }
            sv.sort((a, b) => a - b); ss.sort((a, b) => a - b); const skv = sv[sv.length >> 1] || 1, sks = ss[ss.length >> 1] || 0;
            for (let i = 0; i < N; i++) { if (!eye8[i] || !mine(i) || i >= N - W * 10) continue; const [v, sa] = hsv(C, i); if (v > skv - .1 && sa < sks - .12) { fl[i] = 1; kl++; } }
            const seen = new Uint8Array(N), st: number[] = [];   // (specks under 4 touching pixels are the lash's soft edge)
            for (let i = 0; i < N; i++) { if (!fl[i] || seen[i]) continue; const grp: number[] = []; st.push(i); seen[i] = 1;
              while (st.length) { const j = st.pop()!; grp.push(j); const x = j % W, y = (j / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const q = yy * W + xx; if (fl[q] && !seen[q]) { seen[q] = 1; st.push(q); } } }
              if (grp.length < 4) for (const j of grp) { fl[j] = 0; kl--; } }
            cases.push({ id: id + tg, pose: m, view: String(s), worn: 0, eyes: 0, lid: kl }); if (kl > LIMIT.lid || QUICK) pics[`${id}${tg}-face-${m}-${s}-lid`] = png(C, fl); }
          setMood('smile'); }
        // lips: from the front and ±.4/±.7 the lips are pixels in a box between the nose tip and the chin, judged against the
        // villager's own skin there (pinker, redder or clearly darker); moods that keep the painted mouth must show the smile's
        // lips, 'o' and 'excited' a roundish oval that is not the smile's (excited the larger), 'sad' corners lower than its middle
        if (Math.abs(s) < 1) {
          let mx0 = W, mx1 = -1, my1 = -1; for (let i = 0; i < N; i++) if (white[i]) { const x = i % W, y = (i / W) | 0; mx0 = Math.min(mx0, x); mx1 = Math.max(mx1, x); my1 = my1 < 0 ? y : Math.min(my1, y); }
          const ew = mx1 - mx0, mcx = (mx0 + mx1) / 2, mbox = (i: number) => { const x = i % W, y = (i / W) | 0; return ew > 8 && Math.abs(x - mcx) <= ew * .27 && y < my1 - ew * .3 && y > my1 - ew * .52; };   // (round 24: from .3 below the whites, not .22: Bác Ba's and Mai's nose tips lay in the box)   // (villagers .52, not .62: their eyes sit higher and wider, and .62 reached the chin's edge and the neck's shade, Lan's front o and sad)
          const pk = (px: Uint8Array, i: number) => (px[i * 4 + 2] - px[i * 4 + 1]) / Math.max(1, px[i * 4]), vv = (px: Uint8Array, i: number) => Math.max(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]) / 255, rd = (px: Uint8Array, i: number) => (px[i * 4] - px[i * 4 + 1]) / Math.max(1, px[i * 4]);
          let skPk = 0, skV = 0, skRd = 0;
          const lips = (px: Uint8Array) => { const L = new Uint8Array(N); let n = 0; if (ew <= 8) return { L, n }; for (let i = 0; i < N; i++) { if (!mbox(i) || !mine(i)) continue; if (pk(px, i) > skPk + .09 || (vv(px, i) < skV - .2 && rd(px, i) > skRd - .02) || rd(px, i) > skRd + .08) { L[i] = 1; n++; } } return { L, n }; };   // (round 24: darker counts only if not less red than the skin: Bác Ba's grey moustache lay in the box)
          const near = (L: Uint8Array, i: number, d: number) => { const x = i % W, y = (i / W) | 0; for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && L[yy * W + xx]) return true; } return false; };
          const groups = (L: Uint8Array) => { const seen = new Uint8Array(N), out: number[][] = [], st: number[] = [];
            for (let i = 0; i < N; i++) { if (!L[i] || seen[i]) continue; const g: number[] = []; st.push(i); seen[i] = 1;
              while (st.length) { const j = st.pop()!; g.push(j); const x = j % W, y = (j / W) | 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const q = yy * W + xx; if (L[q] && !seen[q]) { seen[q] = 1; st.push(q); } } }
              out.push(g); } return out.sort((a, b) => b.length - a.length); };
          setMood('smile'); const C0 = read(stage, cam);
          { const ps: number[] = [], vs: number[] = [], rs: number[] = []; for (let i = 0; i < N; i++) if (mbox(i) && mine(i)) { ps.push(pk(C0, i)); vs.push(vv(C0, i)); rs.push(rd(C0, i)); } const md = (a: number[]) => a.sort((x, y) => x - y)[a.length >> 1] || 0; skPk = md(ps); skV = md(vs); skRd = md(rs); }
          const SM = lips(C0), mArea: Record<string, number> = {}, mCase: Record<string, any> = {};
          if (SM.n) for (const m of ['blink', 'half', 'happy', 'sad', 'smile', 'o', 'excited', 'lookL', 'lookR']) {
            setMood(m); const C = read(stage, cam), ML = lips(C), fm = new Uint8Array(N); let km = 0;
            if (['blink', 'half', 'happy', 'lookL', 'lookR', 'smile'].includes(m)) { for (let i = 0; i < N; i++) if ((ML.L[i] && !near(SM.L, i, 1)) || (SM.L[i] && !near(ML.L, i, 1))) { fm[i] = 1; km++; } }
            else { const gs = groups(ML.L), g0 = gs[0] || []; let bad = !g0.length;
              for (const g of gs.slice(1)) for (const j of g) { fm[j] = 1; km++; }
              let same = 0; for (const j of g0) if (near(SM.L, j, 1)) same++; let gx0 = W, gx1 = 0, gy0 = H, gy1 = 0; for (const j of g0) { const x = j % W, y = (j / W) | 0; gx0 = Math.min(gx0, x); gx1 = Math.max(gx1, x); gy0 = Math.min(gy0, y); gy1 = Math.max(gy1, y); }
              const w = gx1 - gx0 + 1, hh = gy1 - gy0 + 1;
              if (g0.length && same > g0.length * .85 && Math.abs(g0.length - SM.n) < SM.n * .2) bad = true;
              if (m === 'o' || m === 'excited') { if (hh / w < .55 || hh / w > 1.6 || g0.length < Math.PI / 4 * w * hh * .6) bad = true; mArea[m] = g0.length; }
              if (m === 'sad' && g0.length) { const col = (a: number, b2: number) => { let sy = 0, c = 0; for (const j of g0) { const x = j % W; if (x >= gx0 + w * a && x <= gx0 + w * b2) { sy += (j / W) | 0; c++; } } return c ? sy / c : 0; }; if ((col(0, .2) + col(.8, 1)) / 2 >= col(.4, .6)) bad = true; }
              if (bad) for (const j of g0) { if (!fm[j]) { fm[j] = 1; km++; } } }
            const r: any = { id: id + tg, pose: m, view: String(s), worn: 0, eyes: 0, lips: km }; cases.push(r); mCase[m] = [r, C, fm, ML.L];
            if (km > LIMIT.lips || QUICK) pics[`${id}${tg}-face-${m}-${s}-lips`] = png(C, fm); }
          if (mArea.o && mArea.excited && mArea.excited < mArea.o * 1.15 && mCase.excited) { const [r, C, fm, EL] = mCase.excited; for (let i = 0; i < N; i++) if (EL[i] && !fm[i]) { fm[i] = 1; r.lips++; } pics[`${id}${tg}-face-excited-${s}-lips`] = png(C, fm); }
          setMood('smile'); }
        // (12 Nov 2026, owner circled the far shut eye by the nose from three-quarters and the side on most villagers, while
        // the rule above passed: it looks for whites only, and only under the face pieces, which are drawn from the front)
        // shut: the model's own eye areas in 3D (its eye boxes without their outer 30 % and top 20 %, where temple hair and
        // fringes lie: Bông, Mai; skin-marked, front half, hidden by the nose as the face is)
        // must show no dark or white pixel while the eyes are shut, besides the lash line the lid piece draws
        { const bm: any[] = []; M.obj.traverse((o: any) => { if (o.isMesh && o.visible && o.material && o.material.userData && o.material.userData.kitU && !/^face-/.test(o.material.name || '')) bm.push(o); });
          if (bm.length) {
            const mask = (o: any) => { const u = o.material.userData.kitU, m = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, side: THREE.FrontSide });
              m.onBeforeCompile = (sh: any) => { sh.uniforms.uDq = { value: u.deq.value }; sh.uniforms.uEA = { value: u.eyeA.value }; sh.uniforms.uEB = { value: u.eyeB.value };
                sh.vertexShader = 'uniform mat4 uDq;\nvarying vec3 vQ_;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvQ_ = (uDq * vec4(position, 1.0)).xyz;');
                sh.fragmentShader = 'uniform vec4 uEA;\nuniform vec4 uEB;\nvarying vec3 vQ_;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\nbool e_ = vColor.r > .5 && vQ_.z > 0.0 && ((vQ_.x > uEA.x + (uEA.y - uEA.x) * .3 && vQ_.x < uEA.y && vQ_.y > uEA.z && vQ_.y < uEA.z + (uEA.w - uEA.z) * .8) || (vQ_.x > uEB.x && vQ_.x < uEB.y - (uEB.y - uEB.x) * .3 && vQ_.y > uEB.z && vQ_.y < uEB.z + (uEB.w - uEB.z) * .8));\ngl_FragColor = vec4(e_ ? vec3(1.0) : vec3(0.0), 1.0);'); };
              return m; };
            const sv: any[] = []; M.obj.traverse((o: any) => { if (o.isMesh) sv.push([o, o.material, o.visible]); });
            sv.forEach(([o, m, v]: any) => { if (bm.includes(o)) o.material = mask(o); else o.visible = false; });
            const MK = read(stage, cam); sv.forEach(([o, m, v]: any) => { o.material = m; o.visible = v; });
            for (const m of ['blink', 'happy']) {
              setMood(m); const C = read(stage, cam);
              const vis = sv.map(([o]: any) => o.visible); sv.forEach(([o, mm]: any, j: number) => { o.visible = vis[j] && /^face-/.test(mm.name || ''); }); solo.add(av.root); av.root.updateMatrixWorld(true); const LP = read(solo, cam); par.add(av.root); av.root.updateMatrixWorld(true); sv.forEach(([o]: any, j: number) => { o.visible = vis[j]; });   // (the pieces shown in this mood, not the smile's)
              const lash = new Uint8Array(N); for (let i = 0; i < N; i++) if (LP[i * 4 + 3] > 40 && hsv(LP, i)[0] < .45) { const x = i % W, y = (i / W) | 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) lash[yy * W + xx] = 1; } }
              const f = new Uint8Array(N); let k = 0, area = 0;
              for (let i = 0; i < N; i++) { if (MK[i * 4] < 128 || MK[i * 4 + 3] < 128) continue; area++; if (lash[i]) continue; const [v, sa] = hsv(C, i); if (v < .35 || (v > .82 && sa < .16)) { f[i] = 1; k++; } }
              cases.push({ id: id + tg, pose: m, view: String(s), worn: 0, eyes: 0, shut: k, shutArea: area });
              if (k > LIMIT.shut || QUICK) pics[`${id}${tg}-face-${m}-${s}-shut`] = png(C, f);
            }
            setMood('smile');
          } }
        if (s === 0) {   // the mouth's place, front only
          setMood('smile'); const S0 = read(stage, cam); setMood('blink'); const SB = read(stage, cam); setMood('o'); const SS = read(stage, cam); setMood('smile');
          const df = (a: Uint8Array, b: Uint8Array, i: number) => Math.abs(a[i * 4] - b[i * 4]) + Math.abs(a[i * 4 + 1] - b[i * 4 + 1]) + Math.abs(a[i * 4 + 2] - b[i * 4 + 2]) > 40;
          let ex0 = W, ex1 = -1, ey = 0, en = 0; for (let i = 0; i < N; i++) if (df(S0, SB, i)) { const x = i % W, y = (i / W) | 0; ex0 = Math.min(ex0, x); ex1 = Math.max(ex1, x); ey += y; en++; }
          if (en > 20) { ey /= en; let my = 0, mn = 0; const f = new Uint8Array(N);
            for (let i = 0; i < N; i++) { const y = (i / W) | 0; if (y < ey - 4 && df(S0, SS, i)) { my += y; mn++; f[i] = 1; } }   // (the buffer is upside down: below the eyes is a smaller y)
            const gap = mn > 10 ? Math.round((ey - my / mn) / Math.max(1, ex1 - ex0) * 100) : 0;
            cases.push({ id: id + tg, pose: 'surprised', view: 'mouth', worn: 0, eyes: 0, mouth: gap }); if (gap > LIMIT.mouth || QUICK) pics[`${id}${tg}-face-mouth-${gap}`] = png(SS, f); }
        }
        tags.forEach(o => { o.visible = true; });
      }
      setMood('smile');
    }
    A.showHD(av, false); const M = av.modelHD || av.model; A.showHD(av, !!av.modelHD);   // (the poses: the high-detail model)
    const frame = (s: number) => { av.root.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(M.obj, true), Hh = box.max.y - box.min.y, c = box.getCenter(new THREE.Vector3()), dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).applyAxisAngle(new THREE.Vector3(0, 1, 0), s);
      const cam = new THREE.PerspectiveCamera(28, W / H, .05, 200); cam.position.copy(c).addScaledVector(dir, Hh * 2.1); cam.lookAt(c); cam.updateMatrixWorld(true); return cam; };
    // poses for the sheets (no counts): the villagers' own animations, front and back
    for (const [pn, st, sp, frames] of [['idle', 'idle', 0, 1], ['walk', 'walk', 3, 9], ['wave', 'wave', 0, 3], ['cheer', 'cheer', 0, 3], ['sit', 'sit', 0, 2]] as [string, string, number, number][]) {
      if (QUICK && pn !== 'idle' && pn !== 'walk') continue;
      av.life = null; for (let f = 0; f <= frames; f++) A.animate(av, st, 10 + f * .05, sp);   // (life reset: the valley's time made the first frame not fresh)
      M.follow('smile');
      for (const [vn, s] of [['front', 0], ['back', Math.PI]] as [string, number][]) pics[`${id}-pose-${pn}-${vn}`] = png(read(stage, frame(s)), null);
    }
    A.showHD(av, false); home.attach(av.root); av.life = null; A.animate(av, 'idle', 1); G.paused = false;
  }
  return { cases, pics };
}, [LIST, QUICK, LIMIT] as any);
for (const id of ids) res.cases.push({ id, pose: 'file', view: 'models', worn: 0, eyes: 0, size: sizes[id], hdsize: hdsizes[id] });
for (const [k, v] of Object.entries(res.pics as Record<string, string>)) writeFileSync(`${OUT}/${k}.png`, Buffer.from(v.split(',')[1], 'base64'));
summarize(res.cases);
await b.close();
