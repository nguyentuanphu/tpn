// (Meshy production, 9 Nov 2026; owner: "Why dont you build a tool like a designer auditor to audit all these points? I have
// been making and spotting your mistakes many times") The friends' auditor: the game draws every friend in every outfit,
// pose and view, and the faults are measured, not looked for by eye:
//   kit      the grey swim kit showing while dressed
//   poke     the body or an inner garment showing where a worn outer garment should cover it, less than 1.2 cm in front of
//            that garment (ID and depth pictures of each layer alone; an arm well in front of the shirt is not a fault)
//   hairtone hair-coloured pixels that change with the skin tone (hair tinted like skin: Clara's braids, Sol's curls)
//   skintone skin-coloured pixels that do not change with the skin tone (hands, feet, legs left painted)
// Each fault is painted magenta on the picture of that case; a summary lists every case with its counts.
//   cd tests; node ../tools/meshy/audit.mts <out dir> [finn,sol,clara,lumi] [quick]
// quick: rest, walk and cheer only. A round goes to the owner only when every count is under its limit (see LIMIT).
import { createRequire } from 'node:module';
import { open, clear } from '../../tests/harness.mts';
const { chromium } = createRequire(new URL('../../tests/package.json', import.meta.url))('playwright');
import { writeFileSync, mkdirSync } from 'node:fs';
const [OUT, LIST = 'finn,sol,clara,lumi', QUICK = ''] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const LIMIT = { kit: 12, poke: 25, hairtone: 30, skintone: 30 };   // pixels in a 360 x 480 picture
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const P = await open(b, { w: 900, h: 700, fast: false }); await clear(P.page);
const res: any = await P.page.evaluate(async ([LIST, QUICK, LIMIT]) => {
  const G = (window as any).__sv, A = await import(String('/js/avatar.js')), FM = await import(String('/js/friend-model.js')), { THREE } = await import(String('/js/gfx.js'));
  const h = G.heroes[0], R = G.renderer; G.world.time = .42;
  let top = h.av.root; while (top.parent) top = top.parent;
  const W = 360, H = 480, rt = new THREE.WebGLRenderTarget(W, H);
  const read = (scene: any, cam: any) => { R.setRenderTarget(rt); R.setClearColor(0x000000, 0); R.clear(); R.render(scene, cam); const px = new Uint8Array(W * H * 4); R.readRenderTargetPixels(rt, 0, 0, W, H, px); R.setRenderTarget(null); return px; };
  const png = (px: Uint8Array, flags: Uint8Array | null) => {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'), im = x.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) { const s = ((H - 1 - y) * W + i) * 4, d = (y * W + i) * 4; const f = flags && flags[(H - 1 - y) * W + i];
      im.data[d] = f ? 255 : px[s]; im.data[d + 1] = f ? 0 : px[s + 1]; im.data[d + 2] = f ? 255 : px[s + 2]; im.data[d + 3] = 255; }
    x.putImageData(im, 0, 0); return cv.toDataURL('image/png');
  };
  // ID + depth materials: R = layer code, G/B = depth from the camera in mm; the cover hiding (js/friend-model.ts) kept
  const RANK: Record<string, number> = { trousers: 0, shorts: 0, leggings: 0, 'top-short': 1, 'top-long': 1, 'tunic-long': 1, bodice: 1, skirt: 2, 'aodai-panels': 2, bib: 2, boots: 3 };
  const GCODE: Record<string, number> = {}; Object.keys(RANK).forEach((k, i) => { GCODE[k] = 20 + i; });
  const idMat = (orig: any, code: number, isBody: boolean) => {
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }); m.vertexColors = !!orig.vertexColors;
    const cu = orig.userData && orig.userData.coverU ? orig.userData.coverU : { value: 0 };
    m.onBeforeCompile = (sh: any) => { sh.uniforms.uCover = cu;
      sh.vertexShader = 'uniform float uCover;\nvarying float vCov;\nvarying float vDz;\nvarying vec4 vMk;\n' + sh.vertexShader
        .replace('#include <color_vertex>', `#include <color_vertex>
vCov = 0.0; vMk = vec4(1.0, 0.0, 0.0, 0.0);
#ifdef USE_COLOR_ALPHA
vMk = color; float cb_ = floor(color.a * 255.0 + .5);
for (int k = 0; k < 8; k++) { float p_ = exp2(float(k)); if (mod(floor(cb_ / p_), 2.0) > .5 && mod(floor(uCover / p_), 2.0) > .5) vCov = 1.0; }
#endif`).replace('#include <project_vertex>', '#include <project_vertex>\nvDz = -mvPosition.z;');
      sh.fragmentShader = 'varying float vCov;\nvarying float vDz;\nvarying vec4 vMk;\n' + sh.fragmentShader
        .replace('void main() {', 'void main() {\nif (vCov > .999) discard;')
        .replace('#include <dithering_fragment>', `#include <dithering_fragment>
float code_ = ${code.toFixed(1)};
${isBody ? 'if (vMk.r < .5) code_ = vMk.a * 255.0 > .5 ? 2.0 : 3.0; // (1 skin, 2 swim kit (under some garment), 3 hair or eyes)' : ''}
float dm_ = clamp(vDz * 1000.0, 0.0, 65535.0);
gl_FragColor = vec4(code_ / 255.0, floor(dm_ / 256.0) / 255.0, mod(dm_, 256.0) / 255.0, 1.0);`); };
    m.customProgramCacheKey = () => 'audit-id-' + code + (isBody ? 'b' : '') + (m.vertexColors ? 'v' : ''); return m;
  };
  const POSES: [string, string, number, number][] = [['rest', 'idle', 0, 1], ['walk', 'walk', 3, 9], ['run', 'walk', 9, 14], ['cheer', 'cheer', 0, 3], ['wave', 'wave', 0, 3], ['dance', 'dance', 0, 5], ['jump', 'air', 0, 2], ['sit', 'sit', 0, 2], ['climb', 'climb', 0, 4]];
  const poses = QUICK ? POSES.filter(p => ['rest', 'walk', 'cheer'].includes(p[0])) : POSES;
  const LOOK: any = { finn: 'boy', sol: 'boy', clara: 'girl', lumi: 'girl' };
  const cases: any[] = [], pics: Record<string, string> = {};
  for (const id of LIST.split(',')) {
    await A.loadFriendModels(id); await A.loadFriendModels(id + '-hd');
    for (const kind of ['everyday', 'aodai', 'festival', 'rain']) {
      FM.setMeshyTones(true);
      const av: any = A.buildAvatar({ set: LOOK[id] || 'girl', friend: id, skin: '#f6c7a5', suit: `${id}-${kind}` }, null, { hd: true }); A.showHD(av, true);
      top.add(av.root); av.root.position.set(h.pos.x + 3, h.av.root.position.y, h.pos.z + 3); av.root.rotation.y = 0;
      const M = av.modelHD, meshes: any[] = [];
      M.obj.traverse((o: any) => { if (o.isMesh) meshes.push(o); });
      const worn = meshes.filter(o => /^lit-g-/.test(o.material.name || '') && o.visible).map(o => o.material.name.slice(6));
      const solo = new THREE.Scene();   // (the ID pictures: the friend alone, nothing of the valley)
      for (const [pn, st, sp, frames] of poses) {
        av.life = null; for (let f = 0; f <= frames; f++) A.animate(av, st, 10 + f * .05, sp);
        av.root.updateMatrixWorld(true); M.follow(av.life && av.life.mood || 'smile');
        const box = new THREE.Box3().setFromObject(M.obj, true), c = box.getCenter(new THREE.Vector3()), Hh = Math.max(box.max.y - box.min.y, 1);
        for (const [s, vn] of [[0, 'front'], [Math.PI / 2, 'left'], [Math.PI, 'back'], [-Math.PI / 2, 'right']] as [number, string][]) {
          const cam = new THREE.PerspectiveCamera(30, W / H, .05, 100), dir = new THREE.Vector3(Math.sin(s), 0, Math.cos(s));
          cam.position.copy(c).addScaledVector(dir, Hh * 2.1); cam.lookAt(c); cam.updateMatrixWorld(true);
          // the looks: light tone and dark tone, in the valley
          M.skin('#f6c7a5'); const L = read(top, cam); M.skin('#5e3a26'); const D = read(top, cam); M.skin('#f6c7a5');
          // the layers: everything, then each worn garment alone (faces hidden: see-through pieces over the face)
          const saved = meshes.map(o => [o, o.material, o.visible]);
          const setPass = (only: string | null) => meshes.forEach((o: any) => { const n = o.material.name || '', g = n.startsWith('lit-g-') ? n.slice(6) : '';
            const isBody = !g && !n.startsWith('face-') && !n.startsWith('cloth-item');
            const vis0 = saved.find(x => x[0] === o)[2];
            o.visible = vis0 && !n.startsWith('face-') && (only === null || g === only);
            if (o.visible) o.material = idMat(saved.find(x => x[0] === o)[1], g ? GCODE[g] : 1, isBody); });
          solo.add(av.root); av.root.updateMatrixWorld(true);
          const others: any[] = []; av.root.traverse((o: any) => { if (o.isMesh && !meshes.includes(o) && o.visible) { others.push(o); o.visible = false; } });   // (the code person's own parts and the ground ring: not the model)
          setPass(null); const Pall = read(solo, cam);
          const Pg: Record<string, Uint8Array> = {}; for (const g of worn) { saved.forEach(([o, m, v]: any) => { o.material = m; o.visible = v; }); setPass(g); Pg[g] = read(solo, cam); }
          saved.forEach(([o, m, v]: any) => { o.material = m; o.visible = v; });
          others.forEach(o => { o.visible = true; }); top.add(av.root); av.root.updateMatrixWorld(true);
          // the faults
          const N = W * H, fk = new Uint8Array(N), fp = new Uint8Array(N), fh = new Uint8Array(N), fs = new Uint8Array(N);
          const dep = (px: Uint8Array, i: number) => (px[i * 4 + 1] * 256 + px[i * 4 + 2]) / 1000;
          const rankOf = (code: number) => code === 1 || code === 2 ? -1 : code === 3 ? -9 : RANK[Object.keys(GCODE).find(k => GCODE[k] === code)] ?? 9;
          // reference colours of this picture: skin from the skin-marked body, hair from the top of the head
          let yTop = -1; for (let y = H - 1; y >= 0 && yTop < 0; y--) for (let x = 0; x < W; x++) { const i = y * W + x; if (Pall[i * 4 + 3] && Pall[i * 4] >= 1 && Pall[i * 4] <= 3) { yTop = y; break; } }
          const sk: number[][] = [], hr: number[][] = [];
          for (let i = 0; i < N; i++) { if (!Pall[i * 4 + 3]) continue; const code = Pall[i * 4], col = [L[i * 4], L[i * 4 + 1], L[i * 4 + 2]];
            if (code === 1) sk.push(col); if ((code === 3 || code === 1) && yTop >= 0 && Math.floor(i / W) > yTop - H * .04) hr.push(col); }
          const med = (a: number[][]) => a.length ? [0, 1, 2].map(k => a.map(v => v[k]).sort((p, q) => p - q)[a.length >> 1]) : null;
          const skR = med(sk), hrR = med(hr), dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) / 255;
          for (let i = 0; i < N; i++) {
            if (!Pall[i * 4 + 3]) continue; const code = Pall[i * 4];
            if (code === 2) { const l = [L[i * 4], L[i * 4 + 1], L[i * 4 + 2]], mx = Math.max(...l); if (mx > 60 && (mx - Math.min(...l)) / mx < .18) fk[i] = 1; }   // (the kit is grey; a skin ankle under a trouser hem is not kit)
            const rc = rankOf(code);
            if (rc > -9) for (const g of worn) { if (RANK[g] <= rc || RANK[g] >= 3) continue; const q = Pg[g]; if (!q[i * 4 + 3] || q[i * 4] !== GCODE[g]) continue;
              if (dep(q, i) - dep(Pall, i) < .012) { fp[i] = 1; break; } }
            if (code >= 1 && code <= 3 && skR && hrR) {
              const l = [L[i * 4], L[i * 4 + 1], L[i * 4 + 2]], d = [D[i * 4], D[i * 4 + 1], D[i * 4 + 2]], ch = dist(l, d) > .12;
              const mx = Math.max(...l), sat = mx ? (mx - Math.min(...l)) / mx : 0, ds = dist(l, skR), dh = dist(l, hrR);
              const lum = (a: number[]) => a[0] * .3 + a[1] * .59 + a[2] * .11;
              if (lum(d) < lum(l) * .75 && mx > 64 && dh < ds * .8 && sat > .15 && dist(skR, hrR) > .08) fh[i] = 1;   // (hair taking the tone darkens with it; eyes and lines barely move)
              if (!ch && ds < dh * .6 && ds < .18 && sat > .15 && code !== 3) fs[i] = 1;
            }
          }
          const cnt = (a: Uint8Array) => a.reduce((s, v) => s + v, 0);
          const r = { id, kind, pose: pn, view: vn, kit: cnt(fk), poke: cnt(fp), hairtone: cnt(fh), skintone: cnt(fs) };
          cases.push(r);
          const bad = (Object.keys(LIMIT) as string[]).filter(k => r[k] > LIMIT[k]);
          if (bad.length) { const all = new Uint8Array(N); for (let i = 0; i < N; i++) all[i] = fk[i] | fp[i] | ((bad.includes('hairtone') || bad.includes('skintone')) ? (fh[i] | fs[i]) : 0);
            pics[`${id}-${kind}-${pn}-${vn}-${bad.join('+')}`] = png(bad.some(k => k.endsWith('tone')) ? D : L, all); }
        }
      }
      FM.setMeshyTones(false); top.remove(av.root);
    }
  }
  return { cases, pics };
}, [LIST, QUICK, LIMIT] as any);
for (const [k, v] of Object.entries(res.pics as Record<string, string>)) writeFileSync(`${OUT}/${k}.png`, Buffer.from(v.split(',')[1], 'base64'));
const cs: any[] = res.cases, keys = Object.keys(LIMIT);
const fail = cs.filter(c => keys.some(k => c[k] > LIMIT[k]));
const lines = [`audit ${new Date().toISOString()} cases ${cs.length} failing ${fail.length}`];
for (const k of keys) lines.push(`${k}: ${cs.filter(c => c[k] > LIMIT[k]).length} cases over ${LIMIT[k]} px, worst ${Math.max(0, ...cs.map(c => c[k]))}`);
for (const id of [...new Set(cs.map(c => c.id))]) for (const kind of [...new Set(cs.map(c => c.kind))]) {
  const f = fail.filter(c => c.id === id && c.kind === kind); if (f.length) lines.push(`${id} ${kind}: ` + f.map(c => `${c.pose}/${c.view} ` + keys.filter(k => c[k] > LIMIT[k]).map(k => `${k} ${c[k]}`).join(' ')).join('; '));
}
writeFileSync(`${OUT}/summary.txt`, lines.join('\n') + '\n'); writeFileSync(`${OUT}/cases.json`, JSON.stringify(cs));
console.log(lines.join('\n'));
await b.close();
