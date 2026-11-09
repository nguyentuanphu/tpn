// (Meshy production, 9 Nov 2026; owner: "Why dont you build a tool like a designer auditor to audit all these points? I have
// been making and spotting your mistakes many times") The friends' auditor: the game draws every friend in every outfit,
// pose and view, and the faults are measured, not looked for by eye:
//   kit      the swim kit showing through a gap in the clothes, whatever colour the game paints it
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
const LIMIT = { kit: 12, poke: 25, hairtone: 30, skintone: 30, eyes: 6, fold: 400, hole: 10, tear: 8 };   // (fold: the inside of a top or trousers looks like the outside, same colour and light: only a large inside-out patch shows)   // pixels in a 360 x 480 picture
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
  const BIAS = [.002, .018, .026, .002];   // (js/friend-model.ts LAYER_BIAS: the game's depth order for layered clothes, measured as the player sees it)
  const NODISC = { value: 0 };   // (1: nothing hidden, for the holes check: what the friend would show with no hiding at all)
  const idMat = (orig: any, code: number, isBody: boolean, layer = -1) => {
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }); m.vertexColors = !!orig.vertexColors;
    const cu = orig.userData && orig.userData.coverU ? orig.userData.coverU : { value: 0 };
    m.onBeforeCompile = (sh: any) => { sh.uniforms.uCover = cu; sh.uniforms.uNoDisc = NODISC;
      sh.vertexShader = 'uniform float uCover;\nvarying float vCov;varying float vAny;\nvarying float vDz;\nvarying vec4 vMk;\nvarying float vKy;\n' + sh.vertexShader
        .replace('#include <color_vertex>', `#include <color_vertex>
vCov = 0.0; vAny = 0.0; vMk = vec4(1.0, 0.0, 0.0, 0.0); vKy = position.y;
#ifdef USE_COLOR_ALPHA
vMk = color; float cb_ = floor(color.a * 255.0 + .5);
for (int k = 0; k < 8; k++) { float p_ = exp2(float(k)); if (mod(floor(cb_ / p_), 2.0) > .5 && mod(floor(uCover / p_), 2.0) > .5) vCov = 1.0; }
vAny = vCov;
#endif`).replace('#include <project_vertex>', '#include <project_vertex>\n' + (layer >= 0 ? `mvPosition.xyz -= normalize(mvPosition.xyz) * ${BIAS[layer].toFixed(4)}; gl_Position = projectionMatrix * mvPosition;\n` : '')
          + (isBody && orig.userData && orig.userData.kitU && orig.userData.kitU.on.value > .5 ? `#ifdef USE_COLOR_ALPHA\nif (color.r < .5 && color.a * 255.0 < .5 && position.y < ${Number(orig.userData.kitU.neck.value).toFixed(4)}) { mvPosition.xyz -= normalize(mvPosition.xyz) * .012; gl_Position = projectionMatrix * mvPosition; }\n#endif\n` : '') + 'vDz = -mvPosition.z;');
      sh.fragmentShader = 'uniform float uNoDisc;\nvarying float vCov;varying float vAny;\nvarying float vDz;\nvarying vec4 vMk;\nvarying float vKy;\n' + sh.fragmentShader
        .replace('void main() {', 'void main() {\nif (uNoDisc < .5 && vCov > .999) discard;' +(isBody && orig.userData && orig.userData.kitU && orig.userData.kitU.on.value > .5 ? `\n#ifdef USE_COLOR_ALPHA\nif (uNoDisc < .5 && vMk.r < .5 && vMk.a * 255.0 > .5 && vKy > ${(Number(orig.userData.kitU.waist.value) - .25).toFixed(4)}) discard;\n#endif` : ''))   // (dressed: the game does not draw the swim kit either)
        .replace('#include <dithering_fragment>', `#include <dithering_fragment>
float code_ = ${code.toFixed(1)};
${isBody ? 'if (vMk.r < .5) code_ = vMk.a * 255.0 > .5 ? 2.0 : 3.0; else if (vAny < .01) code_ = 5.0; // (1 skin under the worn clothes, 5 skin no worn garment covers (face, hands: never a poke), 2 swim kit, 3 hair or eyes)' : ''}
${!isBody && code >= 20 && layer >= 0 && layer <= 1 ? 'if (!gl_FrontFacing) code_ += 100.0; // (a garment seen from inside: folded inside out, unless at an opening)' : ''}
float dm_ = clamp(vDz * 1000.0, 0.0, 65535.0);
gl_FragColor = vec4(code_ / 255.0, floor(dm_ / 256.0) / 255.0, mod(dm_, 256.0) / 255.0, 1.0);`); };
    m.customProgramCacheKey = () => 'audit-id-' + code + (isBody ? 'b' : '') + (m.vertexColors ? 'v' : '') + '-l' + layer + (isBody && orig.userData && orig.userData.kitU ? '-k' + orig.userData.kitU.on.value + '-' + orig.userData.kitU.neck.value : ''); return m;
  };
  const POSES: [string, string, number, number][] = [['rest', 'idle', 0, 1], ['walk', 'walk', 3, 9], ['run', 'walk', 9, 14], ['cheer', 'cheer', 0, 3], ['wave', 'wave', 0, 3], ['dance', 'dance', 0, 5], ['jump', 'air', 0, 2], ['sit', 'sit', 0, 2], ['climb', 'climb', 0, 4]];
  // (owner 9 Nov 2026: the auditor must be trustworthy) QUICK = 'selftest:<fault>': one friend, everyday, rest and cheer,
  // with a fault planted on purpose: the check for it must fire (kit: hiding and kit painting off; poke: body 4% bigger;
  // fold: a top drawn from inside; eyes: the eyes left open while counted as shut)
  const PLANT = String(QUICK).startsWith('selftest:') ? String(QUICK).slice(9) : '';
  const ONLY = String(QUICK).startsWith('poses:') ? String(QUICK).slice(6).split(',') : null;   // ('poses:sit,jump': just those, for a quick look at one fault)
  const poses = PLANT ? POSES.filter(p => ['rest', 'cheer'].includes(p[0])) : ONLY ? POSES.filter(p => ONLY.includes(p[0])) : QUICK ? POSES.filter(p => ['rest', 'walk', 'cheer'].includes(p[0])) : POSES;
  const LOOK: any = { finn: 'boy', sol: 'boy', clara: 'girl', lumi: 'girl' };
  const cases: any[] = [], pics: Record<string, string> = {}, HREF: Record<string, number[]> = {};
  for (const id of LIST.split(',')) {
    await A.loadFriendModels(id); await A.loadFriendModels(id + '-hd');
    for (const kind of (PLANT ? ['everyday'] : ['everyday', 'aodai', 'festival', 'rain'])) {
      FM.setMeshyTones(true);
      const av: any = A.buildAvatar({ set: LOOK[id] || 'girl', friend: id, skin: '#f6c7a5', suit: `${id}-${kind}` }, null, { hd: true }); A.showHD(av, true);
      top.add(av.root); av.root.position.set(h.pos.x + 3, h.av.root.position.y, h.pos.z + 3); av.root.rotation.y = 0;
      const M = av.modelHD, meshes: any[] = [];
      M.obj.traverse((o: any) => { if (o.isMesh) meshes.push(o); });
      const worn = meshes.filter(o => /^lit-g-/.test(o.material.name || '') && o.visible).map(o => o.material.name.slice(6));
      if (PLANT === 'kit') meshes.forEach((o: any) => { const u = o.material.userData; if (u.coverU && !/^lit-g-/.test(o.material.name || '')) u.coverU.value = 0; if (u.kitU) u.kitU.on.value = 0; });
      if (PLANT === 'poke') meshes.forEach((o: any) => { if (/^lit-g-(trousers|shorts|leggings)/.test(o.material.name || '')) { const u = o.material.userData; if (u.coverU) u.coverU.value = 0; o.scale.set(1.12, 1.03, 1.12); } });   // (the trousers swollen through the top)
      if (PLANT === 'fold') meshes.forEach((o: any) => { if (/^lit-g-(top|trousers|shorts|leggings|bodice|tunic)/.test(o.material.name || '')) { o.scale.x *= -1; } });   // (every top and trousers turned inside out by a mirror (the winding flips): far over the 400 px limit; the ID pictures draw both sides, so BackSide alone changed nothing)
      const solo = new THREE.Scene();   // (the ID pictures: the friend alone, nothing of the valley)
      for (const [pn, st, sp, frames] of poses) {
        av.life = null; for (let f = 0; f <= frames; f++) A.animate(av, st, 10 + f * .05, sp);
        av.root.updateMatrixWorld(true); M.follow(av.life && av.life.mood || 'smile');
        const box = new THREE.Box3().setFromObject(M.obj, true), c = box.getCenter(new THREE.Vector3()), Hh = Math.max(box.max.y - box.min.y, 1);
        for (const [s, vn] of [[0, 'front'], [.8, 'tq'], [Math.PI / 2, 'left'], [Math.PI, 'back'], [2.4, 'tqback'], [-Math.PI / 2, 'right']] as [number, string][]) {   // (three-quarter views too: the owner's pose sheets showed a fold under the arm the four straight views missed)
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
            if (o.visible) o.material = idMat(saved.find(x => x[0] === o)[1], g ? GCODE[g] : 1, isBody, g ? (RANK[g] ?? -1) : -1); });
          solo.add(av.root); av.root.updateMatrixWorld(true);
          const others: any[] = []; av.root.traverse((o: any) => { if (o.isMesh && !meshes.includes(o) && o.visible) { others.push(o); o.visible = false; } });   // (the code person's own parts and the ground ring: not the model)
          setPass(null); const Pall = read(solo, cam);
          NODISC.value = 1; const Pnd = read(solo, cam); NODISC.value = 0;   // (the same with nothing hidden: the holes check)
          // the face piece shown now (mood pieces lie over eyes and mouth; tone faults there are the eyes' own business: the eyes check)
          saved.forEach(([o, m, v]: any) => { o.material = m; o.visible = v; });
          meshes.forEach((o: any) => { const n = o.material.name || ''; const v0 = saved.find(x => x[0] === o)[2]; o.visible = v0 && n.startsWith('face-'); if (o.visible) o.material = idMat({}, 4, false); });
          const Pf = read(solo, cam);
          const Pg: Record<string, Uint8Array> = {}; for (const g of worn) { saved.forEach(([o, m, v]: any) => { o.material = m; o.visible = v; }); setPass(g); Pg[g] = read(solo, cam); }
          saved.forEach(([o, m, v]: any) => { o.material = m; o.visible = v; });
          others.forEach(o => { o.visible = true; }); top.add(av.root); av.root.updateMatrixWorld(true);
          // the faults
          const N = W * H, fk = new Uint8Array(N), fp = new Uint8Array(N), fh = new Uint8Array(N), fs = new Uint8Array(N);
          const dep = (px: Uint8Array, i: number) => (px[i * 4 + 1] * 256 + px[i * 4 + 2]) / 1000;
          const rankOf = (code0: number) => { const code = code0 >= 120 ? code0 - 100 : code0; return rankOf0(code); }; const rankOf0 = (code: number) => code === 1 ? -1 : code === 2 || code === 3 || code === 5 ? -9 : RANK[Object.keys(GCODE).find(k => GCODE[k] === code)] ?? 9;
          // reference colours of this picture: skin from the skin-marked body, hair from the top of the head
          let yTop = -1; for (let y = H - 1; y >= 0 && yTop < 0; y--) for (let x = 0; x < W; x++) { const i = y * W + x; if (Pall[i * 4 + 3] && ((Pall[i * 4] >= 1 && Pall[i * 4] <= 3) || Pall[i * 4] === 5)) { yTop = y; break; } }
          const sk: number[][] = [], hr: number[][] = [];
          for (let i = 0; i < N; i++) { if (!Pall[i * 4 + 3]) continue; const code = Pall[i * 4], col = [L[i * 4], L[i * 4 + 1], L[i * 4 + 2]];
            if (code === 1 || code === 5) sk.push(col); if ((code === 3 || code === 1 || code === 5) && yTop >= 0 && Math.floor(i / W) > yTop - H * .04) hr.push(col); }
          const med = (a: number[][]) => a.length ? [0, 1, 2].map(k => a.map(v => v[k]).sort((p, q) => p - q)[a.length >> 1]) : null;
          if (pn === 'rest' && vn === 'front' && hr.length) HREF[id] = med(hr);
          const skR = med(sk), hrR = HREF[id] || med(hr), dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) / 255;
          for (let i = 0; i < N; i++) {
            if (!Pall[i * 4 + 3]) continue; const code = Pall[i * 4];
            // (owner 9 Nov 2026, circled: dark patches in the sides of Sol's shirt, the swim kit painted in the trousers' colour showing
            // through a gap) any swim-kit pixel seen while dressed is a gap in the clothes, whatever colour the game paints it;
            // only its 2-pixel border is not judged (colours mix there)
            if (code === 2) { let edge2 = false; const x = i % W, y = (i / W) | 0; for (let dy = -2; dy <= 2 && !edge2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) { edge2 = true; break; } const j = yy * W + xx; if (!Pall[j * 4 + 3] || (Pall[j * 4] !== 2 && Pall[j * 4] < 20)) { edge2 = true; break; } } if (!edge2) fk[i] = 1; }
            const rc = rankOf(code);
            const inside = (q: Uint8Array, g: string) => { const x = i % W, y = (i / W) | 0, e_ = g === 'aodai-panels' ? 8 : 4; /* (the áo dài's slits: a leg stepping out through them is the dress, not a fault) */ for (const [dx, dy] of [[e_, 0], [-e_, 0], [0, e_], [0, -e_]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) return false; const j = yy * W + xx; if (!q[j * 4 + 3] || q[j * 4] % 100 !== GCODE[g]) return false; } return true; };
            if (rc > -9) for (const g of worn) { if (RANK[g] <= rc || RANK[g] >= 3) continue; const q = Pg[g]; if (!q[i * 4 + 3] || q[i * 4] % 100 !== GCODE[g] || !inside(q, g)) continue;
              if (dep(q, i) - dep(Pall, i) < .012) { fp[i] = 1; break; } }
            const edge = () => { const x = i % W, y = (i / W) | 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) return true; const j = yy * W + xx; if (!Pall[j * 4 + 3] || Pall[j * 4] !== code) return true; } return false; };   // (colours mix along a border: not judged there)
            if (((code >= 1 && code <= 3) || code === 5) && skR && hrR && !edge()) {
              const l = [L[i * 4], L[i * 4 + 1], L[i * 4 + 2]], d = [D[i * 4], D[i * 4 + 1], D[i * 4 + 2]], ch = dist(l, d) > .12;
              const mx = Math.max(...l), sat = mx ? (mx - Math.min(...l)) / mx : 0, ds = dist(l, skR), dh = dist(l, hrR);
              const lum = (a: number[]) => a[0] * .3 + a[1] * .59 + a[2] * .11;
              // (hair-like: by hue when hair and skin differ in hue (Lumi's leaves, Finn's black, Sol's brown), else by colour mix
              // without brightness (Clara's salmon hair by her pink skin): shaded skin is darker skin, not hair)
              const hue = (a: number[]) => { const [r, g, b] = a, M2 = Math.max(r, g, b), m2 = Math.min(r, g, b); if (M2 === m2) return 0; const d2 = M2 - m2; let hh = M2 === r ? (g - b) / d2 : M2 === g ? 2 + (b - r) / d2 : 4 + (r - g) / d2; hh *= 60; return hh < 0 ? hh + 360 : hh; };
              const hd = (a: number, b2: number) => { const x = Math.abs(a - b2) % 360; return x > 180 ? 360 - x : x; };
              const mix = (a: number[]) => { const t2 = a[0] + a[1] + a[2] + 1; return [a[0] / t2, a[1] / t2, a[2] / t2]; };
              const byHue = hd(hue(hrR), hue(skR)) > 20;
              const ambiguous = !byHue && dist(skR, hrR) < .25;   // (hair and skin of one colour, Clara's: the picture cannot tell them apart; her skin-mark sheet checks her hair)
              const satOf = (a: number[]) => { const M2 = Math.max(...a); return M2 ? (M2 - Math.min(...a)) / M2 : 0; };
              const hairlike = byHue ? hd(hue(l), hue(hrR)) < hd(hue(l), hue(skR)) * .5 : Math.hypot(...[0, 1, 2].map(k2 => mix(l)[k2] - mix(hrR)[k2])) < Math.hypot(...[0, 1, 2].map(k2 => mix(l)[k2] - mix(skR)[k2])) * .5 && satOf(l) > satOf(skR) * 1.1;   // (Clara: her hair is more strongly coloured than her skin; a shaded neck is not)
              if (!ambiguous && !Pf[i * 4 + 3] && lum(d) < lum(l) * .75 && mx > 64 && hairlike && sat > .2 && dist(skR, hrR) > .08) fh[i] = 1;   // (hair taking the tone darkens with it; eyes and lines barely move)
              if (!ch && ds < dh * .6 && ds < .18 && sat > .15 && code !== 3) fs[i] = 1;
            }
          }
          const ff = new Uint8Array(N);
          for (let i = 0; i < N; i++) { if (!Pall[i * 4 + 3] || Pall[i * 4] < 120) continue; const x = i % W, y = (i / W) | 0; let open_ = false;
            for (let dy = -6; dy <= 6 && !open_; dy += 2) for (let dx = -6; dx <= 6; dx += 2) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) { open_ = true; break; } const j = yy * W + xx; if (!Pall[j * 4 + 3] || Pall[j * 4] < 20) { open_ = true; break; } }
            if (!open_) ff[i] = 1; }
          // (holes: with the swim kit not drawn, a gap with nothing behind it would show the valley through the child)
          const fo = new Uint8Array(N);
          /* (10 Nov 2026: the valley between an arm and the side, and between the legs under a skirt, was counted: a hole is
             now only where the friend with nothing hidden would show something, so the hiding made a see-through gap) */
          for (let i = 0; i < N; i++) { if (Pall[i * 4 + 3] || !Pnd[i * 4 + 3]) continue; const x = i % W, y = (i / W) | 0; let enc = true;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let hit = false; for (let k = 1; k <= 6; k++) { const xx = x + dx * k, yy = y + dy * k; if (xx < 0 || yy < 0 || xx >= W || yy >= H) break; if (Pall[(yy * W + xx) * 4 + 3]) { hit = Pall[(yy * W + xx) * 4] !== 3; if (!hit) enc = false; break; } } /* (gaps between curls of hair are hair, not holes) */ if (!hit) { enc = false; break; } }
            if (enc) fo[i] = 1; }
          // (tears: a hole in a garment itself, seen in its picture alone: an empty pixel the garment closes round within 5 pixels
          // on all four sides; owner circled the dark inner layer showing through such holes in Sol's shirt)
          const ft = new Uint8Array(N);
          for (const g of worn) { if ((RANK[g] ?? 9) > 1) continue; const q = Pg[g]; const isG = (j: number) => q[j * 4 + 3] && q[j * 4] % 100 === GCODE[g];
            for (let i = 0; i < N; i++) { if (isG(i)) continue; const x = i % W, y = (i / W) | 0; let enc = true;
              let dg = 1e9;
              for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let hit = false; for (let k = 1; k <= 5; k++) { const xx = x + dx * k, yy = y + dy * k; if (xx < 0 || yy < 0 || xx >= W || yy >= H) break; if (isG(yy * W + xx)) { hit = true; dg = Math.min(dg, dep(q, yy * W + xx)); break; } } if (!hit) { enc = false; break; } }
              /* (10 Nov 2026: the gap under a hanging arm, seen from the side, was counted though the arm in front hides it: a tear
                 counts only where the finished picture shows something behind the garment there, or nothing) */
              if (enc && Pall[i * 4 + 3]) { const c_ = Pall[i * 4]; if (c_ === 3 || c_ === 5 || (c_ >= 20 && rankOf(c_) >= (RANK[g] ?? 9)) || dep(Pall, i) < dg - .005) enc = false; }   /* (hair, a hand or a braid tip, or the same or an outer garment in front: hidden) */   /* (hair lying over the shirt: the shirt is open under a braid) */
              if (enc) ft[i] = 1; } }
          const cnt = (a: Uint8Array) => a.reduce((s, v) => s + v, 0);
          const r = { id, kind, pose: pn, view: vn, kit: cnt(fk), poke: cnt(fp), hairtone: cnt(fh), skintone: cnt(fs), fold: cnt(ff), hole: cnt(fo), tear: cnt(ft) };
          cases.push(r);
          const bad = (Object.keys(LIMIT) as string[]).filter(k => r[k] > LIMIT[k]);
          if (bad.length) { const all = new Uint8Array(N); for (let i = 0; i < N; i++) all[i] = fk[i] | fp[i] | ff[i] | fo[i] | ft[i] | ((bad.includes('hairtone') || bad.includes('skintone')) ? (fh[i] | fs[i]) : 0);
            pics[`${id}-${kind}-${pn}-${vn}-${bad.join('+')}`] = png(bad.some(k => k.endsWith('tone')) ? D : L, all);
            const C = new Uint8Array(N * 4), PAL: Record<number, number[]> = { 1: [230, 60, 60], 2: [60, 90, 230], 3: [20, 20, 20] };   // (skin red, kit blue, hair black; garments by layer: inner green, tops yellow, outer purple)
            for (let i = 0; i < N; i++) { if (!Pall[i * 4 + 3]) { C.set([235, 235, 235, 255], i * 4); continue; } const code = Pall[i * 4], rk = rankOf(code);
              const col = PAL[code] || (rk === 0 ? [60, 190, 80] : rk === 1 ? [240, 210, 60] : rk === 2 ? [160, 80, 200] : [140, 140, 140]); C.set([...col, 255], i * 4); }
            pics[`${id}-${kind}-${pn}-${vn}-layers`] = png(C, null); }   // (the layers as they are: the fault picture shows where)
        }
      }
      FM.setMeshyTones(false); top.remove(av.root);
    }
  }
  // eyes: every closed or half-closed mood, close to the head from the front, three-quarters and the sides: no eye white
  // (pale, colourless pixels where the open eye's white was) may be left. The open eye's whites are found in the smile.
  const solo = new THREE.Scene();
  const head = (M: any) => { let hb: any = null; M.obj.traverse((o: any) => { if (o.isBone && o.name === 'head') hb = o; }); return hb; };
  for (const id of (PLANT && PLANT !== 'eyes' ? [] : LIST.split(','))) {
    const av: any = A.buildAvatar({ set: LOOK[id] || 'girl', friend: id, skin: '#f6c7a5' }, null, { hd: true }); A.showHD(av, true);
    top.add(av.root); av.root.position.set(h.pos.x + 3, h.av.root.position.y, h.pos.z + 3); av.root.rotation.y = 0; A.animate(av, 'idle', 1); av.root.updateMatrixWorld(true);
    const M = av.modelHD, hb = head(M); if (!hb) { top.remove(av.root); continue; }
    const box = new THREE.Box3().setFromObject(M.obj, true), Hh = box.max.y - box.min.y;
    const at = hb.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, .12, 0));
    const setMood = (m: string) => { if (av.life) { av.life.mood = m; av.life.blink = av.life.t + 60; av.life.glance = av.life.t + 60; av.life.feel = ''; } M.follow(m); };
    for (const s of [0, .7, -.7, 1.2, -1.2]) {
      const cam = new THREE.PerspectiveCamera(28, W / H, .05, 100), dir = new THREE.Vector3(Math.sin(s), 0, Math.cos(s));
      cam.position.copy(at).addScaledVector(dir, Hh * .75); cam.lookAt(at); cam.updateMatrixWorld(true);
      // (only on the face: under the face pieces, never the sky, a name label or the clouds)
      const saved = [] as any[]; M.obj.traverse((o: any) => { if (o.isMesh) saved.push([o, o.material, o.visible]); });
      setMood('smile'); saved.forEach(([o, m, v]: any) => { o.visible = v && /^face-/.test(m.name || ''); if (o.visible) o.material = idMat({}, 4, false); });
      solo.add(av.root); av.root.updateMatrixWorld(true); const Pf = read(solo, cam); top.add(av.root); av.root.updateMatrixWorld(true);
      saved.forEach(([o, m, v]: any) => { o.material = m; o.visible = v; });
      // (10 Nov 2026: Lumi's name label, white, lay over the top of her face piece and was counted as an eye white)
      const tags: any[] = []; av.root.traverse((o: any) => { if ((o.isSprite || o.isMesh) && o.visible && !saved.some(x => x[0] === o)) { tags.push(o); o.visible = false; } });
      const O = read(top, cam); top.remove(av.root); const Bk = read(top, cam); top.add(av.root); av.root.updateMatrixWorld(true);
      const mine = (i: number) => Math.abs(O[i * 4] - Bk[i * 4]) + Math.abs(O[i * 4 + 1] - Bk[i * 4 + 1]) + Math.abs(O[i * 4 + 2] - Bk[i * 4 + 2]) > 24;   // (a label or the valley in front of the face: the same with the friend gone)
      const N = W * H, white = new Uint8Array(N), hsv = (px: Uint8Array, i: number) => { const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2], mx = Math.max(r, g, b); return [mx / 255, mx ? (mx - Math.min(r, g, b)) / mx : 0]; };
      const dark = new Uint8Array(N); for (let i = 0; i < N; i++) { if (!Pf[i * 4 + 3]) continue; const [v] = hsv(O, i); if (v < .35) dark[i] = 1; }
      const nearDark = (i: number) => { const x = i % W, y = (i / W) | 0; for (let dy = -8; dy <= 8; dy += 2) for (let dx = -8; dx <= 8; dx += 2) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && dark[yy * W + xx]) return true; } return false; };
      for (let i = 0; i < N; i++) { if (!Pf[i * 4 + 3] || !mine(i) || i >= N - W * 10) continue;   /* (the picture's top rows, last in the read buffer: the friend's name label, never an eye in this head shot) */ const [v, sa] = hsv(O, i); if (v > .82 && sa < .16 && nearDark(i)) white[i] = 1; }   // (an eye's white lies by its dark iris: a cream collar under the face piece is not an eye)
      const grow = new Uint8Array(N); for (let i = 0; i < N; i++) if (white[i]) { const x = i % W, y = (i / W) | 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) grow[yy * W + xx] = 1; } }
      for (const m of ['blink', 'half', 'happy', 'sad']) {
        setMood(PLANT === 'eyes' ? 'smile' : m); const C = read(top, cam), f = new Uint8Array(N); let k = 0;
        for (let i = 0; i < N; i++) { if (!grow[i]) continue; const [v, sa] = hsv(C, i); if (m !== 'half' && m !== 'sad' ? (v > .8 && sa < .18) : false) { f[i] = 1; k++; } }
        const r = { id, kind: 'face', pose: m, view: String(s), kit: 0, poke: 0, hairtone: 0, skintone: 0, eyes: k }; cases.push(r);
        if (k > LIMIT.eyes) pics[`${id}-face-${m}-${s}-eyes`] = png(C, f);
      }
      tags.forEach(o => { o.visible = true; });
    }
    setMood('smile'); top.remove(av.root);
  }
  return { cases, pics };
}, [LIST, QUICK, LIMIT] as any);
for (const [k, v] of Object.entries(res.pics as Record<string, string>)) writeFileSync(`${OUT}/${k}.png`, Buffer.from(v.split(',')[1], 'base64'));
const cs: any[] = res.cases, keys = Object.keys(LIMIT);
const fail = cs.filter(c => keys.some(k => c[k] > LIMIT[k]));
const lines = [`audit ${new Date().toISOString()} cases ${cs.length} failing ${fail.length}`];
for (const k of keys) lines.push(`${k}: ${cs.filter(c => c[k] > LIMIT[k]).length} cases over ${LIMIT[k]} px, worst ${Math.max(0, ...cs.map(c => c[k] || 0))}`);
for (const id of [...new Set(cs.map(c => c.id))]) for (const kind of [...new Set(cs.map(c => c.kind))]) {
  const f = fail.filter(c => c.id === id && c.kind === kind); if (f.length) lines.push(`${id} ${kind}: ` + f.map(c => `${c.pose}/${c.view} ` + keys.filter(k => c[k] > LIMIT[k]).map(k => `${k} ${c[k]}`).join(' ')).join('; '));
}
writeFileSync(`${OUT}/summary.txt`, lines.join('\n') + '\n'); writeFileSync(`${OUT}/cases.json`, JSON.stringify(cs));
console.log(lines.join('\n'));
await b.close();
