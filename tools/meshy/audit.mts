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
import { writeFileSync, mkdirSync, readdirSync, readFileSync, copyFileSync, existsSync } from 'node:fs';
const [OUT, LIST = 'finn,sol,clara,lumi', QUICK = ''] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const LIMIT = { kit: 12, poke: 25, hairtone: 30, skintone: 30, eyes: 6, fold: 400, hole: 10, bite: 10, rag: 15, tear: 8, glow: 40, far: 40, face: 20, grip: 6, mouth: 12, lid: 8, stray: 12 };   // (11 Nov 2026: glow, far and face in pixels; grip in cm from the nearer hand)   // (fold: the inside of a top or trousers looks like the outside, same colour and light: only a large inside-out patch shows)   // pixels in a 360 x 480 picture
// (10 Nov 2026, owner: "chạy và sửa quá chậm") 'merge': the friends audited side by side, one process each, into
// <out>/part-<id> (tools/meshy/make_character.ps1); this joins their cases and pictures into one summary
function summarize(cs: any[]) { const keys = Object.keys(LIMIT), fail = cs.filter(c => keys.some(k => c[k] > LIMIT[k]));
  const lines = [`audit ${new Date().toISOString()} cases ${cs.length} failing ${fail.length}`];
  for (const k of keys) lines.push(`${k}: ${cs.filter(c => c[k] > LIMIT[k]).length} cases over ${LIMIT[k]} px, worst ${Math.max(0, ...cs.map(c => c[k] || 0))}`);
  for (const id of [...new Set(cs.map(c => c.id))]) for (const kind of [...new Set(cs.map(c => c.kind))]) {
    const f = fail.filter(c => c.id === id && c.kind === kind); if (f.length) lines.push(`${id} ${kind}: ` + f.map(c => `${c.pose}/${c.view} ` + keys.filter(k => c[k] > LIMIT[k]).map(k => `${k} ${c[k]}`).join(' ')).join('; '));
  }
  writeFileSync(`${OUT}/summary.txt`, lines.join('\n') + '\n'); writeFileSync(`${OUT}/cases.json`, JSON.stringify(cs)); console.log(lines.join('\n')); }
if (LIST === 'merge') {
  const cs: any[] = [];
  for (const d of readdirSync(OUT).filter(d => d.startsWith('part-') && !d.includes('.'))) { const dir = `${OUT}/${d}`;
    if (!existsSync(`${dir}/cases.json`)) throw new Error(`audit part ${d} has no cases.json: it failed`);
    cs.push(...JSON.parse(readFileSync(`${dir}/cases.json`, 'utf8')));
    for (const f of readdirSync(dir).filter(f => f.endsWith('.png'))) copyFileSync(`${dir}/${f}`, `${OUT}/${f}`); }
  summarize(cs); process.exit(0);
}
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
  const BIAS = [.002, .018, .034, .012];   // (js/friend-model.ts LAYER_BIAS: the game's depth order for layered clothes, measured as the player sees it)
  const NODISC = { value: 0 };   // (1: nothing hidden, for the holes check: what the friend would show with no hiding at all)
  const idMat = (orig: any, code: number, isBody: boolean, layer = -1) => {
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }); m.vertexColors = !!orig.vertexColors;
    const cu = orig.userData && orig.userData.coverU ? orig.userData.coverU : { value: 0 };
    m.onBeforeCompile = (sh: any) => { sh.uniforms.uCover = cu; sh.uniforms.uNoDisc = NODISC; sh.uniforms.uDeq = (orig.userData && orig.userData.kitU && orig.userData.kitU.deq) || (orig.userData && orig.userData.deqU) || { value: new THREE.Matrix4() };
      sh.vertexShader = 'uniform mat4 uDeq;\nuniform float uCover;\nvarying float vCov;varying float vAny;\nvarying float vDz;\nvarying vec4 vMk;\nvarying float vKy;\nvarying float vWy;\n' + sh.vertexShader
        .replace('#include <color_vertex>', `#include <color_vertex>
vCov = 0.0; vAny = 0.0; vMk = vec4(1.0, 0.0, 0.0, 0.0); vKy = (uDeq * vec4(position, 1.0)).y;
#ifdef USE_COLOR_ALPHA
vMk = color; float cb_ = floor(color.a * 255.0 + .5);
for (int k = 0; k < 8; k++) { float p_ = exp2(float(k)); if (mod(floor(cb_ / p_), 2.0) > .5 && mod(floor(uCover / p_), 2.0) > .5) vCov = 1.0; }
vAny = vCov;
#endif`).replace('#include <project_vertex>', '#include <project_vertex>\n' + (orig.userData && orig.userData.plantInflate ? `mvPosition.xyz += normalize(normalMatrix * objectNormal) * ${Number(orig.userData.plantInflate).toFixed(4)}; gl_Position = projectionMatrix * mvPosition;\n` : '') + (layer >= 0 ? `mvPosition.xyz -= normalize(mvPosition.xyz) * ${BIAS[layer].toFixed(4)}; gl_Position = projectionMatrix * mvPosition;\n` : '')
          + (isBody && orig.userData && orig.userData.kitU && orig.userData.kitU.on.value > .5 ? `#ifdef USE_COLOR_ALPHA\nif (color.r < .5 && color.b < .5 && color.a * 255.0 < .5 && (uDeq * vec4(position, 1.0)).y < ${Number(orig.userData.kitU.neck.value).toFixed(4)}) { float hy_ = (uDeq * vec4(position, 1.0)).y; mvPosition.xyz -= normalize(mvPosition.xyz) * mix(.012, .07, smoothstep(${(Number(orig.userData.kitU.waist.value) + .25).toFixed(4)}, ${(Number(orig.userData.kitU.waist.value) + .12).toFixed(4)}, hy_)); gl_Position = projectionMatrix * mvPosition; }\n#endif\n` : '') + (PLANT === 'rag' && layer === 0 ? `{ vec3 rp_ = (uDeq * vec4(position, 1.0)).xyz; mvPosition.y += sin(rp_.x * 260.0 + rp_.z * 180.0) * .025; gl_Position = projectionMatrix * mvPosition; }\n` : '') + 'vDz = -mvPosition.z; vWy = (modelMatrix * vec4(transformed, 1.0)).y;');
      sh.fragmentShader = 'uniform float uNoDisc;\nvarying float vCov;varying float vAny;\nvarying float vDz;\nvarying vec4 vMk;\nvarying float vKy;\nvarying float vWy;\n' + sh.fragmentShader
        .replace('void main() {', 'void main() {\nif (uNoDisc < .5 && vCov > ' + (isBody ? '9.0' : '.999') + ') discard;' + (PLANT === 'bite' && layer <= 0 ? `\nif (uNoDisc < .5 && vWy > ${(PLANT_KNEE - .05).toFixed(3)} && vWy < ${(PLANT_KNEE + .05).toFixed(3)}) discard;` : '') + (!isBody && orig.userData && orig.userData.bootU && orig.userData.bootU.value > 0 ? `\nif (uNoDisc < .5 && vKy < ${Number(orig.userData.bootU.value).toFixed(4)}) discard;` : ''))   // (trousers inside worn boots are not drawn, as in the game)
        .replace('#include <dithering_fragment>', `#include <dithering_fragment>
float code_ = ${code.toFixed(1)};
${isBody ? 'if (vMk.r < .5) code_ = vMk.a * 255.0 > .5 || vMk.b > .5 ? 2.0 : 3.0; else if (vAny < .01) code_ = 5.0; else if (vCov > .5) code_ = 6.0; // (6: the body under worn clothes the game paints in their colour, js/friend-model.ts BODY_CUT)' + (orig.userData && orig.userData.kitU && orig.userData.kitU.bootTop && orig.userData.kitU.bootTop.value > 0 ? `\nif (vKy < ${(Number(orig.userData.kitU.bootTop.value) - .01).toFixed(4)}) code_ = ${GCODE.boots.toFixed(1)}; // (inside the boots the game paints the body in their colour: it counts as the boots)` : '') + ' // (1 skin under the worn clothes, 5 skin no worn garment covers (face, hands: never a poke), 2 swim kit, 3 hair or eyes)' : ''}
${!isBody && code >= 20 && layer >= 0 && layer <= 2 ? 'if (!gl_FrontFacing) code_ += 100.0; // (a garment seen from inside: folded inside out, unless at an opening)' : ''}
float dm_ = clamp(vDz * 1000.0, 0.0, 65535.0);
gl_FragColor = vec4(code_ / 255.0, floor(dm_ / 256.0) / 255.0, mod(dm_, 256.0) / 255.0, 1.0);`); };
    m.customProgramCacheKey = () => 'audit-id-' + PLANT + '-bt' + (orig.userData && orig.userData.kitU && orig.userData.kitU.bootTop ? orig.userData.kitU.bootTop.value : 0) + '-bc' + (orig.userData && orig.userData.bootU ? orig.userData.bootU.value : 0) + (orig.userData && orig.userData.plantInflate ? 'inf' : '') + code + (isBody ? 'b' : '') + (m.vertexColors ? 'v' : '') + '-l' + layer + (isBody && orig.userData && orig.userData.kitU ? '-k' + orig.userData.kitU.on.value + '-' + orig.userData.kitU.neck.value : ''); return m;
  };
  const POSES: [string, string, number, number][] = [['rest', 'idle', 0, 1], ['walk', 'walk', 3, 9], ['run', 'walk', 9, 14], ['cheer', 'cheer', 0, 3], ['wave', 'wave', 0, 3], ['dance', 'dance', 0, 5], ['jump', 'air', 0, 2], ['sit', 'sit', 0, 2], ['climb', 'climb', 0, 4], ['walk2', 'walk', 3, 14], ['run2', 'walk', 9, 18], ['dance2', 'dance', 0, 12], ['climb2', 'climb', 0, 10]];   // (10 Nov 2026: a second moment of each moving pose: one frame each hid what the next showed)
  // (owner 9 Nov 2026: the auditor must be trustworthy) QUICK = 'selftest:<fault>': one friend, everyday, rest and cheer,
  // with a fault planted on purpose: the check for it must fire (kit: hiding and kit painting off; poke: body 4% bigger;
  // fold: a top drawn from inside; eyes: the eyes left open while counted as shut)
  const TOK = String(QUICK).split(','), PLANT = TOK[0].startsWith('selftest:') ? TOK[0].slice(9) : '';
  let PLANT_KNEE = .3;   // (the bite plant: a band round the knee of the body and the trousers not drawn)
  const ONLY = String(QUICK).startsWith('poses:') ? String(QUICK).slice(6).split(',') : null;
  const ALLPICS = (!!ONLY && ONLY.includes('pics')) || !!PLANT;   // ('poses:sit,pics': the pictures and layers of every case, faults or not, to look at one by eye)   // ('poses:sit,jump': just those, for a quick look at one fault)
  const poses = PLANT ? POSES.filter(p => ['rest', 'cheer'].includes(p[0])) : ONLY ? POSES.filter(p => ONLY.includes(p[0])) : QUICK ? POSES.filter(p => ['rest', 'walk', 'cheer'].includes(p[0])) : POSES;
  /* (11 Nov 2026, what the auditor did not check yet) passes besides the high-detail model in day light:
       light    the light model (models/<id>.glb), drawn when the friend is more than 15 m from every child's camera
       evening  the light at sunset (world time .78), night (.92): every check, and 'glow': a part that does not darken
       night    with the light as the rest of the friend does (an emissive paint, an unlit face piece) or goes black
       item     the friend's item in the hand (look.fitems): 'grip', the item more than 6 cm from both hands
     A full round adds a short pass of each; 'poses:walk,light,pics' or 'selftest:poke,light' runs one alone. */
  type Pass = { tag: string, light?: boolean, time?: number, item?: boolean, poses: typeof POSES, views?: string[], kinds?: string[] };
  const MODS = ['light', 'evening', 'night', 'item'].filter(m => TOK.includes(m));
  const one = (m: string, ps: typeof POSES): Pass => ({ tag: m, light: m === 'light', time: m === 'evening' ? .78 : m === 'night' ? .92 : undefined, item: m === 'item', poses: ps });
  const PASSES: Pass[] = MODS.length ? MODS.map(m => one(m, poses))
    : PLANT || ONLY || QUICK ? [{ tag: '', poses }]
    : [{ tag: '', poses }, { ...one('light', POSES.filter(p => ['rest', 'walk', 'cheer'].includes(p[0]))) },
       { ...one('evening', POSES.filter(p => ['rest', 'walk'].includes(p[0]))), views: ['front', 'tq', 'back', 'hiback'] },
       { ...one('night', POSES.filter(p => ['rest', 'walk'].includes(p[0]))), views: ['front', 'tq', 'back', 'hiback'] },
       { ...one('item', POSES), kinds: ['everyday'], views: ['front', 'tq', 'left', 'back', 'right', 'hifront'] }];
  const W0 = G.world, setTime = (t: number, at: any) => { W0.time = t; if (W0.updateSky) W0.updateSky(0, at, at); };
  const PLANT_ON = { value: 1 };   // (the far plant: on for the planted picture, off for the clean one)
  const shaderPlant = (m: any, tag: string, vert: string, frag: string, fragEnd = '') => { if (!m || !m.isMaterial) return; const prev = m.onBeforeCompile, key = m.customProgramCacheKey;
    m.onBeforeCompile = (sh: any, r: any) => { if (prev) prev.call(m, sh, r); if (!sh.vertexShader.includes('#include <project_vertex>')) return; sh.uniforms.uPlantOn = PLANT_ON;
      sh.vertexShader = 'varying float vPlY;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n' + vert);
      sh.fragmentShader = 'varying float vPlY;\nuniform float uPlantOn;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n' + frag).replace('#include <dithering_fragment>', '#include <dithering_fragment>\n' + fragEnd); };
    m.customProgramCacheKey = () => (key ? key.call(m) : '') + '-plant' + tag; m.needsUpdate = true; };
  const LOOK: any = { finn: 'boy', sol: 'boy', clara: 'girl', lumi: 'girl' };
  const cases: any[] = [], pics: Record<string, string> = {}, HREF: Record<string, number[]> = {};
  for (const id of LIST.split(',')) {
    await A.loadFriendModels(id); await A.loadFriendModels(id + '-hd');
    for (const PS of PASSES)
    for (const kind of (PLANT ? ['everyday'] : (PS.kinds || ['everyday', 'aodai', 'festival', 'rain']).filter(k => !ONLY || !ONLY.some(o => /^(everyday|aodai|festival|rain)$/.test(o)) || ONLY.includes(k)))) {   // ('poses:jump,aodai': only that outfit)
      FM.setMeshyTones(true);
      const av: any = A.buildAvatar({ set: LOOK[id] || 'girl', friend: id, skin: '#f6c7a5', suit: `${id}-${kind}`, ...(PS.item ? { fitems: id } : {}) }, null, { hd: true }); A.showHD(av, !PS.light || PLANT === 'far');   // (the far plant: the high-detail model planted against itself unplanted, as no light model was clean on 11 Nov)
      top.add(av.root); av.root.position.set(h.pos.x + 3, h.av.root.position.y, h.pos.z + 3); av.root.rotation.y = 0; PLANT_KNEE = av.root.position.y + .3;   // (world height: the trousers carry no dequantization of their own)
      const M = PS.light && PLANT !== 'far' ? av.model : av.modelHD, meshes: any[] = [], KIND = kind + (PS.tag ? '@' + PS.tag : '');
      M.obj.traverse((o: any) => { if (o.isMesh) meshes.push(o); });
      const worn = meshes.filter(o => /^lit-g-/.test(o.material.name || '') && o.visible).map(o => o.material.name.slice(6));
      if (PLANT === 'kit') meshes.forEach((o: any) => { const u = o.material.userData; if (u.coverU && !/^lit-g-/.test(o.material.name || '')) u.coverU.value = 0; if (u.kitU) u.kitU.on.value = 0; });
      // (10 Nov 2026: o.scale never moved a skinned mesh, attached bind mode undoes it; the plant now pushes the trousers 3 cm out in the ID pictures)
      if (PLANT === 'poke' || PLANT === 'deep') meshes.forEach((o: any) => { if (/^lit-g-(trousers|shorts|leggings)/.test(o.material.name || '')) { const m = o.material, u = m.userData; if (u.coverU) u.coverU.value = 0; u.coverU = { value: 0 }; u.plantInflate = PLANT === 'deep' ? .05 : .03;   // (deep: 5 cm through a skirt, on a friend wearing one)
        // (10 Nov 2026: pokes count only where the game picture shows them, so the plant is pushed out in the game's own drawing too)
        const prev = m.onBeforeCompile, key = m.customProgramCacheKey;
        m.onBeforeCompile = (sh: any, r: any) => { if (prev) prev.call(m, sh, r); sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nmvPosition.xyz += normalize(normalMatrix * objectNormal) * ' + (PLANT === 'deep' ? '.05' : '.03') + '; gl_Position = projectionMatrix * mvPosition;'); };
        m.customProgramCacheKey = () => (key ? key.call(m) : '') + '-plantpoke'; m.needsUpdate = true; } });   // (the trousers swollen through the top, never hidden by it: their own cover value, which the game's dress() cannot set back, 10 Nov)
      if (PLANT === 'fold') meshes.forEach((o: any) => { if (/^lit-g-(top|trousers|shorts|leggings|bodice|tunic)/.test(o.material.name || '')) { o.scale.x *= -1; } });   // (every top and trousers turned inside out by a mirror (the winding flips): far over the 400 px limit; the ID pictures draw both sides, so BackSide alone changed nothing)
      /* (11 Nov 2026) plants for the new passes, each in the game's own drawing: far (light pass): the light model's legs
         below the knee not drawn; glow (night pass): the top drawn in one fixed colour, unlit, as an unlit face piece would be;
         grip (item pass): the item bound to the trunk instead of the hand, so it stays at the hip when the arm rises */
      if (PLANT === 'far' && PS.light) meshes.forEach((o: any) => shaderPlant(o.material, 'far', 'vPlY = (modelMatrix * vec4(transformed, 1.0)).y;', `if (uPlantOn > .5 && vPlY < ${PLANT_KNEE.toFixed(3)}) discard;`));
      if (PLANT === 'glow' && PS.time != null) meshes.forEach((o: any) => { if (/^lit-g-top/.test(o.material.name || '')) shaderPlant(o.material, 'glow', 'vPlY = 0.0;', '', 'gl_FragColor.rgb = vec3(.9, .6, .2);'); });
      const item = meshes.find((o: any) => o.material.name === 'cloth-item' && o.visible), elb: any[] = ['elbowL', 'elbowR'].map(n => { let b: any = null; M.obj.traverse((o: any) => { if (o.isBone && o.name === n) b = o; }); return b; });
      if (PLANT === 'grip' && item) { const g2 = item.geometry.clone(), si = g2.attributes.skinIndex, sw = g2.attributes.skinWeight, ti = item.skeleton.bones.findIndex((bn: any) => bn.name === 'torso');
        for (let i = 0; i < si.count; i++) { si.setXYZW(i, ti, 0, 0, 0); sw.setXYZW(i, 1, 0, 0, 0); } si.needsUpdate = sw.needsUpdate = true; item.geometry = g2; }
      /* (11 Nov 2026) grip, in the item pass: the item's middle, carried by the forearm it is held in (the elbow bone nearer to
         it in the rest pose), must stay where the hand holds it, and the item must keep its size (cm, the larger of the two) */
      const itemAt = () => { const v = new THREE.Vector3(), bb = new THREE.Box3(), cen = new THREE.Vector3(), pa = item.geometry.attributes.position; let n = 0; item.updateMatrixWorld(true);
        for (let i = 0; i < pa.count; i += 3) { v.fromBufferAttribute(pa, i); item.applyBoneTransform(i, v); v.applyMatrix4(item.matrixWorld); bb.expandByPoint(v); cen.add(v); n++; }
        return { c: cen.multiplyScalar(1 / n), d: bb.getSize(new THREE.Vector3()).length() }; };
      let gripRef: any = null;
      if (PS.item && item && elb[0] && elb[1]) { av.life = null; A.animate(av, 'idle', 10, 0); av.root.updateMatrixWorld(true); M.follow('smile'); const ia = itemAt();
        const k = elb[0].getWorldPosition(new THREE.Vector3()).distanceTo(ia.c) < elb[1].getWorldPosition(new THREE.Vector3()).distanceTo(ia.c) ? 0 : 1; gripRef = { k, local: elb[k].worldToLocal(ia.c.clone()), d: ia.d }; }
      const solo = new THREE.Scene();   // (the ID pictures: the friend alone, nothing of the valley)
      for (const [pn, st, sp, frames] of PS.poses) {
        av.life = null; for (let f = 0; f <= frames; f++) A.animate(av, st, 10 + f * .05, sp);
        av.root.updateMatrixWorld(true); M.follow(av.life && av.life.mood || 'smile');
        let gripNow = -1;
        if (PS.item) { if (!gripRef) gripNow = 99; else { const ia = itemAt(), want = elb[gripRef.k].localToWorld(gripRef.local.clone()); gripNow = Math.round(Math.max(want.distanceTo(ia.c), Math.abs(ia.d - gripRef.d)) * 100); }
          cases.push({ id, kind: KIND, pose: pn, view: 'hand', kit: 0, poke: 0, hairtone: 0, skintone: 0, grip: gripNow }); }
        const box = new THREE.Box3().setFromObject(M.obj, true), c = box.getCenter(new THREE.Vector3()), Hh = Math.max(box.max.y - box.min.y, 1);
        /* (10 Nov 2026, owner: what was missed) also the player's own view, from above and behind (and above in front), and close-ups
             of the legs and feet at twice the size, where small slivers hid at the usual size */
          for (const [s, vn, el, feet] of [[0, 'front', 0, 0], [.8, 'tq', 0, 0], [Math.PI / 2, 'left', 0, 0], [Math.PI, 'back', 0, 0], [2.4, 'tqback', 0, 0], [-Math.PI / 2, 'right', 0, 0], [Math.PI, 'hiback', .6, 0], [.4, 'hifront', .6, 0], [.4, 'feet', .15, 1], [Math.PI / 2, 'feetleft', .15, 1], [Math.PI + .4, 'feetback', .15, 1], [-Math.PI / 2, 'feetright', .15, 1]] as [number, string, number, number][]) { if (PS.views && !PS.views.includes(vn)) continue;   // (three-quarter views too: the owner's pose sheets showed a fold under the arm the four straight views missed)
          const cam = new THREE.PerspectiveCamera(30, W / H, .05, 100), dir = new THREE.Vector3(Math.sin(s) * Math.cos(el), Math.sin(el), Math.cos(s) * Math.cos(el));
          const at_ = feet ? new THREE.Vector3(c.x, box.min.y + Hh * .22, c.z) : c;
          cam.position.copy(at_).addScaledVector(dir, Hh * (feet ? 1.05 : 2.1)); cam.lookAt(at_); cam.updateMatrixWorld(true);
          // the looks: light tone and dark tone, in the valley
          const Lday = PS.time != null ? (setTime(.42, cam.position), read(top, cam)) : null; setTime(PS.time ?? .42, cam.position);
          M.skin('#f6c7a5'); const L = read(top, cam); M.skin('#5e3a26'); const D = read(top, cam); M.skin('#f6c7a5');
          // (10 Nov 2026: a falling leaf of the valley in front of Sol's arm counted as skin that kept its colour) the valley
          // alone, the friend taken out: where the picture is the same with and without the friend, something hides it there
          top.remove(av.root); const Bk = read(top, cam); top.add(av.root); av.root.updateMatrixWorld(true);
          const hidden = (i: number) => Math.abs(L[i * 4] - Bk[i * 4]) + Math.abs(L[i * 4 + 1] - Bk[i * 4 + 1]) + Math.abs(L[i * 4 + 2] - Bk[i * 4 + 2]) < 12;
          // the layers: everything, then each worn garment alone (faces hidden: see-through pieces over the face)
          const saved = meshes.map(o => [o, o.material, o.visible]);
          const setPass = (only: string | null) => meshes.forEach((o: any) => { const n = o.material.name || '', g = n.startsWith('lit-g-') ? n.slice(6) : '';
            const isBody = !g && !n.startsWith('face-') && !n.startsWith('cloth-item');
            const vis0 = saved.find(x => x[0] === o)[2];
            o.visible = vis0 && !n.startsWith('face-') && (only === null || g === only);
            if (o.visible) o.material = idMat(saved.find(x => x[0] === o)[1], n === 'cloth-item' ? 7 : g ? GCODE[g] : 1, isBody, g ? (RANK[g] ?? -1) : -1); });
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
          others.forEach(o => { o.visible = true; });
          /* (11 Nov 2026: Sol's light model had lost most of both arms, and no check saw it: every check compares the model with
             itself) far, in the light pass: the light model's outline against the high-detail model's in the same pose and view.
             A pixel one of them covers and the other has nothing within 2 pixels of is missing (or extra) far away. */
          const fx = new Uint8Array(W * H);
          if (PS.light && PLANT === 'far') { const FL = read(solo, cam); PLANT_ON.value = 0; const FH = read(solo, cam); PLANT_ON.value = 1; for (let i = 0; i < W * H; i++) if ((FL[i * 4 + 3] > 0) !== (FH[i * 4 + 3] > 0)) fx[i] = 1; }
          else if (PS.light) { const FL = read(solo, cam); M.obj.visible = false; av.modelHD.obj.visible = true; av.root.updateMatrixWorld(true); const FH = read(solo, cam); av.modelHD.obj.visible = false; M.obj.visible = true; av.root.updateMatrixWorld(true);
            const near2 = (q: Uint8Array, i: number) => { const x = i % W, y = (i / W) | 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && q[(yy * W + xx) * 4 + 3]) return true; } return false; };
            for (let i = 0; i < W * H; i++) { const a = FL[i * 4 + 3] > 0, b2 = FH[i * 4 + 3] > 0; if (a !== b2 && !near2(a ? FH : FL, i)) fx[i] = 1; } }
          top.add(av.root); av.root.updateMatrixWorld(true);
          // the faults
          const pokeBy: Record<string, number> = {};
          /* (10 Nov 2026: Finn's and Clara's thighs "through" the white áo dài trousers, running, were white in the game picture:
             the player sees the trousers there) a poke or a fold counts only where the game picture differs from the covering
             garment's own colour round it: the median of the first pixel of that garment in 8 directions within 14 px; with
             no such pixel near it cannot be judged and counts */
          const seenAs = (i: number, gc: number) => { const x = i % W, y = (i / W) | 0, ref: number[][] = [];
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) for (let k = 1; k <= 14; k++) { const xx = x + dx * k, yy = y + dy * k; if (xx < 0 || yy < 0 || xx >= W || yy >= H) break; const j = yy * W + xx; if (Pall[j * 4 + 3] && Pall[j * 4] === gc) { ref.push([L[j * 4], L[j * 4 + 1], L[j * 4 + 2]]); break; } }
            const far_ = ref.length < 2; if (far_) { const all_ = gcol(gc); if (!all_) return true; ref.length = 0; ref.push(all_, all_); }   // (none near, the inner layer drawn over all of it there: the garment's colour over the whole picture, with more tolerance for its shading)
            const m_ = [0, 1, 2].map(k => ref.map(v => v[k]).sort((p, q) => p - q)[ref.length >> 1]);
            return Math.hypot(L[i * 4] - m_[0], L[i * 4 + 1] - m_[1], L[i * 4 + 2] - m_[2]) / 255 >= (far_ ? .13 : .09); };
          const gcols: Record<number, number[] | null> = {}; const gcol = (gc: number) => { if (!(gc in gcols)) { const a: number[][] = []; for (let j = 0; j < N; j++) if (Pall[j * 4 + 3] && Pall[j * 4] === gc) a.push([L[j * 4], L[j * 4 + 1], L[j * 4 + 2]]); gcols[gc] = a.length > 30 ? [0, 1, 2].map(k => a.map(v => v[k]).sort((p, q) => p - q)[a.length >> 1]) : null; } return gcols[gc]; }; const N = W * H, fk = new Uint8Array(N), fp = new Uint8Array(N), fh = new Uint8Array(N), fs = new Uint8Array(N);
          /* (10 Nov 2026) the game paints the swim kit under worn clothes in their colours (js/friend-model.ts): a kit pixel is a
             fault only where it does not look like one of the worn garments */
          const kitAsCloth = (i: number) => worn.some(g => !seenAs(i, GCODE[g]));   // (like the garment beside it, or like it over the whole picture: a strip of shirt colour at the hem looked like the shirt)
          const dep = (px: Uint8Array, i: number) => (px[i * 4 + 1] * 256 + px[i * 4 + 2]) / 1000;
          const rankOf = (code0: number) => { const code = code0 >= 120 ? code0 - 100 : code0; return rankOf0(code); }; const rankOf0 = (code: number) => code === 1 || code === 6 ? -1 : code === 2 || code === 3 || code === 5 ? -9 : RANK[Object.keys(GCODE).find(k => GCODE[k] === code)] ?? 9;
          // reference colours of this picture: skin from the skin-marked body, hair from the top of the head
          let yTop = -1; for (let y = H - 1; y >= 0 && yTop < 0; y--) for (let x = 0; x < W; x++) { const i = y * W + x; if (Pall[i * 4 + 3] && ((Pall[i * 4] >= 1 && Pall[i * 4] <= 3) || Pall[i * 4] === 5)) { yTop = y; break; } }
          const sk: number[][] = [], hr: number[][] = [];
          for (let i = 0; i < N; i++) { if (!Pall[i * 4 + 3]) continue; const code = Pall[i * 4], col = [L[i * 4], L[i * 4 + 1], L[i * 4 + 2]];
            if (code === 1 || code === 5) sk.push(col); if ((code === 3 || code === 1 || code === 5) && yTop >= 0 && Math.floor(i / W) > yTop - H * .04) hr.push(col); }
          const med = (a: number[][]) => a.length ? [0, 1, 2].map(k => a.map(v => v[k]).sort((p, q) => p - q)[a.length >> 1]) : null;
          if (pn === 'rest' && vn === 'front' && hr.length) HREF[id + PS.tag] = med(hr);
          const skR = med(sk), hrR = HREF[id + PS.tag] || med(hr), dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) / 255;
          for (let i = 0; i < N; i++) {
            if (!Pall[i * 4 + 3]) continue; const code = Pall[i * 4];
            // (owner 9 Nov 2026, circled: dark patches in the sides of Sol's shirt, the swim kit painted in the trousers' colour showing
            // through a gap) any swim-kit pixel seen while dressed is a gap in the clothes, whatever colour the game paints it;
            // only its 2-pixel border is not judged (colours mix there)
            if (code === 2 && !kitAsCloth(i)) { let edge2 = false; const x = i % W, y = (i / W) | 0; for (let dy = -2; dy <= 2 && !edge2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) { edge2 = true; break; } const j = yy * W + xx; if (!Pall[j * 4 + 3] || (Pall[j * 4] !== 2 && Pall[j * 4] < 20)) { edge2 = true; break; } } if (!edge2) fk[i] = 1; }
            const rc = rankOf(code);
            const inside = (q: Uint8Array, g: string) => { const x = i % W, y = (i / W) | 0, e_ = g === 'aodai-panels' ? 8 : 4; /* (the áo dài's slits: a leg stepping out through them is the dress, not a fault) */ for (const [dx, dy] of [[e_, 0], [-e_, 0], [0, e_], [0, -e_]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) return false; const j = yy * W + xx; if (!q[j * 4 + 3] || q[j * 4] % 100 !== GCODE[g]) return false; } return true; };
            if (rc > -9) for (const g of worn) { if (RANK[g] <= rc || RANK[g] >= 3) continue; const q = Pg[g]; if (!q[i * 4 + 3] || q[i * 4] % 100 !== GCODE[g] || !inside(q, g)) continue;
              const dz_ = dep(q, i) - dep(Pall, i);
              /* (10 Nov 2026, owner: what was missed) a leg or the trousers in front of the OUTSIDE of a skirt or the áo dài's panels
                 came through it, however far: only the 1.2 cm rule (made for an arm well in front of a shirt) let a knee 3 cm
                 through a skirt pass. In front of their inside (seen at the opening) the leg is just under the skirt. */
              const deep_ = RANK[g] === 2 && (rc === 0 || rc === -1) && q[i * 4] < 100 && dz_ < .10;
              if ((dz_ < .012 || deep_) && seenAs(i, GCODE[g])) { fp[i] = 1; const nm_ = code === 1 || code === 5 ? 'skin' : code === 2 ? 'kit' : code === 3 ? 'hair' : (Object.keys(GCODE).find(k => GCODE[k] === code % 100) || String(code)) + (code >= 120 ? '(in)' : ''); pokeBy[nm_ + '>' + g] = (pokeBy[nm_ + '>' + g] || 0) + 1; break; } }   // (which layer shows through which garment: the case's pokeBy)
            const edge = () => { const x = i % W, y = (i / W) | 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) return true; const j = yy * W + xx; if (!Pall[j * 4 + 3] || Pall[j * 4] !== code) return true; } return false; };   // (colours mix along a border: not judged there)
            if (((code >= 1 && code <= 3) || code === 5) && skR && hrR && !edge() && !hidden(i)) {
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
          const ff = new Uint8Array(N), FOLD_SEEN = .09; let fold0 = 0;
          for (let i = 0; i < N; i++) { if (!Pall[i * 4 + 3] || Pall[i * 4] < 120 || rankOf(Pall[i * 4]) >= 2) continue; const x = i % W, y = (i / W) | 0; let open_ = false;   /* (the inside of a skirt or the áo dài's panels is seen at their openings: not a fold) */
            for (let dy = -6; dy <= 6 && !open_; dy += 2) for (let dx = -6; dx <= 6; dx += 2) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) { open_ = true; break; } const j = yy * W + xx; if (!Pall[j * 4 + 3] || Pall[j * 4] < 20) { open_ = true; break; } }
            if (open_) continue; fold0++;
            /* (10 Nov 2026, owner: "mặt trong cùng màu thì có thể là báo động giả") the game draws a garment's inside in its own
               colour and nearly its own light (baked, emissive .95): an inside patch that looks like the outside round it cannot
               be seen. It counts only where its colour in the game differs from the same garment's outside nearby (the median of
               the first outside pixel in 8 directions within 14 px); with no outside nearby it cannot be judged and counts. */
            if (!seenAs(i, Pall[i * 4] - 100)) continue;
            ff[i] = 1; }
          // (holes: with the swim kit not drawn, a gap with nothing behind it would show the valley through the child)
          const fo = new Uint8Array(N);
          /* (10 Nov 2026: the valley between an arm and the side, and between the legs under a skirt, was counted: a hole is
             now only where the friend with nothing hidden would show something, so the hiding made a see-through gap) */
          for (let i = 0; i < N; i++) { if (Pall[i * 4 + 3] || !Pnd[i * 4 + 3]) continue; const x = i % W, y = (i / W) | 0; let enc = true, hd0 = 1e9, hd1 = -1e9;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let hit = false; for (let k = 1; k <= 6; k++) { const xx = x + dx * k, yy = y + dy * k; if (xx < 0 || yy < 0 || xx >= W || yy >= H) break; if (Pall[(yy * W + xx) * 4 + 3]) { hit = Pall[(yy * W + xx) * 4] !== 3; if (!hit) enc = false; else { const d_ = dep(Pall, yy * W + xx); hd0 = Math.min(hd0, d_); hd1 = Math.max(hd1, d_); } break; } } /* (gaps between curls of hair are hair, not holes) */ if (!hit) { enc = false; break; } }
            if (enc && hd1 - hd0 > .05) enc = false;   /* (10 Nov 2026: its sides 5 cm apart in depth: the gap between the legs in a run, seen from the side, not a hole) */
            if (enc) fo[i] = 1; }
          /* (10 Nov 2026, owner circled bites out of the legs: the back of a bent knee, a calf under Lumi's skirt, that the holes
             check missed because they open to the valley on one side) a bite: something the friend would show with nothing
             hidden, here empty. Only the hiding of inner garments can make one now; its 2-pixel edge is not judged */
          const fb = new Uint8Array(N);
          for (let i = 0; i < N; i++) { if (Pall[i * 4 + 3] || !Pnd[i * 4 + 3] || Pnd[i * 4] === 3) continue; const x = i % W, y = (i / W) | 0; let inner = true;
            for (let dy = -2; dy <= 2 && inner; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H || !Pnd[(yy * W + xx) * 4 + 3]) { inner = false; break; } }
            if (inner && !fo[i]) fb[i] = 1; }
          /* (10 Nov 2026: a sitting child's seat, 1 cm smaller than the hidden trousers round it, counted 443 px of "bite" though
             it only makes the outline a little smaller) a bite counts where it is at least about 2.5 cm across, from the drawn
             friend to the valley (8 pixels; 14 in the leg close-ups, drawn twice as large) */
          const BW = feet ? 14 : 8, near_ = (i: number, want: (j: number) => boolean) => { const x = i % W, y = (i / W) | 0; for (let r_ = 1; r_ <= BW; r_++) for (let d_ = -r_; d_ <= r_; d_++) for (const [xx, yy] of [[x + d_, y - r_], [x + d_, y + r_], [x - r_, y + d_], [x + r_, y + d_]]) { if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; if (want(yy * W + xx)) return r_; } return BW + 1; };
          for (let i = 0; i < N; i++) if (fb[i] && near_(i, j => !!Pall[j * 4 + 3]) + near_(i, j => !Pnd[j * 4 + 3]) < BW) fb[i] = 0;
          // (tears: a hole in a garment itself, seen in its picture alone: an empty pixel the garment closes round within 5 pixels
          // on all four sides; owner circled the dark inner layer showing through such holes in Sol's shirt)
          const ft = new Uint8Array(N);
          for (const g of worn) { if ((RANK[g] ?? 9) > 1) continue; const q = Pg[g]; const isG = (j: number) => q[j * 4 + 3] && q[j * 4] % 100 === GCODE[g];
            for (let i = 0; i < N; i++) { if (isG(i)) continue; const x = i % W, y = (i / W) | 0; let enc = true;
              let dg = 1e9, dgx = -1e9;
              for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let hit = false; for (let k = 1; k <= 5; k++) { const xx = x + dx * k, yy = y + dy * k; if (xx < 0 || yy < 0 || xx >= W || yy >= H) break; if (isG(yy * W + xx)) { hit = true; dg = Math.min(dg, dep(q, yy * W + xx)); dgx = Math.max(dgx, dep(q, yy * W + xx)); break; } } if (!hit) { enc = false; break; } }
              if (enc && dgx - dg > .03) enc = false;   /* (10 Nov 2026: its sides 3 cm apart in depth: the gap between two legs of the trousers, a front and a back leg seen from the side, not a tear) */
              /* (10 Nov 2026: the gap under a hanging arm, seen from the side, was counted though the arm in front hides it: a tear
                 counts only where the finished picture shows something behind the garment there, or nothing) */
              if (enc && Pall[i * 4 + 3]) { const c_ = Pall[i * 4]; if (c_ === 3 || c_ === 5 || (c_ >= 20 && rankOf(c_) >= (RANK[g] ?? 9)) || dep(Pall, i) < dg - .005) enc = false; }   /* (hair, a hand or a braid tip, or the same or an outer garment in front: hidden) */   /* (hair lying over the shirt: the shirt is open under a braid) */
              if (enc) ft[i] = 1; } }
          /* (10 Nov 2026, owner circled ragged edges: trouser cuffs over the boot tops, Lumi's shirt side as she sat) a ragged
             edge: thin spikes and specks of one layer into another or into the valley. A pixel of a garment, of the boots or of
             the painted body with at most 12 of its own in the 7 x 7 round it (a straight edge has 21 or more, a corner about
             16) is a spike; hair, hands and the face (their own fine detail) are not judged, nor anything next to them */
          const fr = new Uint8Array(N);
          for (let i = 0; i < N; i++) { if (!Pall[i * 4 + 3]) continue; const c0 = Pall[i * 4], c_ = c0 >= 120 ? c0 - 100 : c0; if (!(c_ >= 20 || c_ === 6)) continue; const x = i % W, y = (i / W) | 0; let same = 0, near = 0, skip = false;
            for (let dy = -3; dy <= 3 && !skip; dy++) for (let dx = -3; dx <= 3; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) { skip = true; break; } const j = yy * W + xx; if (!Pall[j * 4 + 3]) continue; const cj = Pall[j * 4] >= 120 ? Pall[j * 4] - 100 : Pall[j * 4]; if (cj === 3 || cj === 5 || Pf[j * 4 + 3]) { skip = true; break; } if (cj === c_) { same++; if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) near++; } }
            if (!skip && same <= 12 && near >= 4) fr[i] = 1; }
          /* (round 77: most ragged counts left were single pixels where an outline steps, a coat's edge against the valley or a
             hem's staircase, too small to see; a spike is a few pixels together) only groups of 3 or more touching pixels count */
          { const seen = new Uint8Array(N), st: number[] = [];
            for (let i = 0; i < N; i++) { if (!fr[i] || seen[i]) continue; const grp: number[] = []; st.push(i); seen[i] = 1;
              while (st.length) { const j = st.pop()!; grp.push(j); const x = j % W, y = (j / W) | 0;
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const k = yy * W + xx; if (fr[k] && !seen[k]) { seen[k] = 1; st.push(k); } } }
              if (grp.length < 3) for (const j of grp) fr[j] = 0; } }   /* (a 1-pixel line along another layer's edge, the colours mixing there, is not a spike: Lumi's coat hem outlined by her trousers) */
          /* (11 Nov 2026) glow, in the evening and night passes: every part of the friend darkens with the light by about the
             same share (the median over the friend, from the same picture in day light; about .74 at night, the friends' painted
             light is mostly emissive). A patch 1.25 times that share and visibly brighter than it should be (an unlit or
             emissive part: at night it keeps nearly its day colour) glows in the dark; one under half of it goes black. Hidden pixels and the friend's 2-pixel outline (the valley behind mixes in) are not judged. */
          const fg = new Uint8Array(N); let glowR: number[] = [];
          if (Lday) { const lumA = (px: Uint8Array, i: number) => px[i * 4] * .3 + px[i * 4 + 1] * .59 + px[i * 4 + 2] * .11, rs: number[] = [], idx: number[] = [];
            for (let i = 0; i < N; i++) { if (!Pall[i * 4 + 3] || hidden(i)) continue; const x = i % W, y = (i / W) | 0; let rim = false;
              for (let dy = -2; dy <= 2 && !rim; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H || !Pall[(yy * W + xx) * 4 + 3]) { rim = true; break; } }
              if (rim) continue; rs.push((lumA(L, i) + 3) / (lumA(Lday, i) + 3)); idx.push(i); }
            const so = rs.slice().sort((p, q) => p - q), rm = so[so.length >> 1] || 1; glowR = [so[(so.length * .05) | 0], rm, so[(so.length * .95) | 0]].map(v => +(v || 0).toFixed(3));
            for (let k = 0; k < idx.length; k++) { const i = idx[k], ld = lumA(Lday, i), ln = lumA(L, i);
              if (PLANT === 'glow' && Pall[i * 4] % 100 < 20) continue;   // (the plant: only the clothes are judged, as the skin and hair glowed at night already on 11 Nov; the plant must be what is caught)
              if ((rs[k] > rm * 1.25 && ln - ld * rm > 15) || (rs[k] < rm * .5 && ld * rm - ln > 25)) fg[i] = 1; } }
          if (PS.item && vn === 'front' && (gripNow > LIMIT.grip || ALLPICS)) { const fi = new Uint8Array(N); for (let i = 0; i < N; i++) fi[i] = Pall[i * 4 + 3] && Pall[i * 4] === 7 ? 1 : 0; pics[`${id}-${KIND}-${pn}-hand-${gripNow > LIMIT.grip ? 'grip' : ''}`] = png(L, fi); }   // (the item painted magenta where it is)
          const cnt = (a: Uint8Array) => a.reduce((s, v) => s + v, 0);
          const r = { id, kind: KIND, pose: pn, view: vn, kit: cnt(fk), poke: cnt(fp), hairtone: cnt(fh), skintone: cnt(fs), fold: cnt(ff), fold0, pokeBy, hole: cnt(fo), bite: cnt(fb), rag: cnt(fr), tear: cnt(ft), glow: cnt(fg), glowR, far: cnt(fx) };
          cases.push(r);
          const bad = (Object.keys(LIMIT) as string[]).filter(k => r[k] > LIMIT[k]);
          if (bad.length || ALLPICS) { const all = new Uint8Array(N); for (let i = 0; i < N; i++) all[i] = fk[i] | fp[i] | ff[i] | fo[i] | fb[i] | fr[i] | ft[i] | fg[i] | fx[i] | ((bad.includes('hairtone') || bad.includes('skintone')) ? (fh[i] | fs[i]) : 0);
            pics[`${id}-${KIND}-${pn}-${vn}-${bad.join('+')}`] = png(bad.some(k => k.endsWith('tone')) ? D : L, all);
            const C = new Uint8Array(N * 4), PAL: Record<number, number[]> = { 1: [230, 60, 60], 2: [60, 90, 230], 3: [20, 20, 20] };   // (skin red, kit blue, hair black; garments by layer: inner green, tops yellow, outer purple)
            for (let i = 0; i < N; i++) { if (!Pall[i * 4 + 3]) { C.set([235, 235, 235, 255], i * 4); continue; } const code = Pall[i * 4], rk = rankOf(code);
              const col = PAL[code] || (rk === 0 ? [60, 190, 80] : rk === 1 ? [240, 210, 60] : rk === 2 ? [160, 80, 200] : [140, 140, 140]); C.set([...col, 255], i * 4); }
            pics[`${id}-${KIND}-${pn}-${vn}-layers`] = png(C, null); if (ALLPICS) pics[`${id}-${KIND}-${pn}-${vn}-look`] = png(L, null); }   // (the layers as they are: the fault picture shows where)
        }
      }
      FM.setMeshyTones(false); top.remove(av.root); setTime(.42, h.pos);
    }
  }
  // eyes: every closed or half-closed mood, close to the head from the front, three-quarters and the sides: no eye white
  // (pale, colourless pixels where the open eye's white was) may be left. The open eye's whites are found in the smile.
  const solo = new THREE.Scene();
  const head = (M: any) => { let hb: any = null; M.obj.traverse((o: any) => { if (o.isBone && o.name === 'head') hb = o; }); return hb; };
  for (const id of ((PLANT && PLANT !== 'eyes' && PLANT !== 'face' && PLANT !== 'mouth' && PLANT !== 'lid' && PLANT !== 'stray') || MODS.length ? [] : LIST.split(','))) {   // (not in the light, evening, night and item passes alone)
    const av: any = A.buildAvatar({ set: LOOK[id] || 'girl', friend: id, skin: '#f6c7a5' }, null, { hd: true }); A.showHD(av, true);
    top.add(av.root); av.root.position.set(h.pos.x + 3, h.av.root.position.y, h.pos.z + 3); av.root.rotation.y = 0; A.animate(av, 'idle', 1); av.root.updateMatrixWorld(true);
    const M = av.modelHD, hb = head(M); if (!hb) { top.remove(av.root); continue; }
    // (11 Nov 2026) the face plant: every mood piece drawn 3 mm behind where it lies, so the head comes through it
    if (PLANT === 'face') M.obj.traverse((o: any) => { if (o.isMesh && /^face-/.test(o.material.name || '')) shaderPlant(o.material, 'face', 'mvPosition.xyz += normalize(mvPosition.xyz) * .003; gl_Position = projectionMatrix * mvPosition; vPlY = 0.0;', ''); });
    const box = new THREE.Box3().setFromObject(M.obj, true), Hh = box.max.y - box.min.y;
    const at = hb.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, .12, 0));
    const setMood = (m: string) => { if (av.life) { av.life.mood = m; av.life.blink = av.life.t + 60; av.life.glance = av.life.t + 60; av.life.feel = ''; } M.follow(m); };
    const PUSH = { value: 0 };
    /* (12 Nov 2026) the mouth plant: in the blink, the head drawn in the skin's colour inside the mouth box (screen pixels),
       as a mood piece that wiped the painted mouth would; only the blink is judged, which is clean on every friend */
    const MB = { value: new THREE.Vector4(0, 0, 0, 0) }, MC = { value: new THREE.Vector3(1, .6, .4) }, MCs = { value: new THREE.Vector3(1, .6, .4) };
    M.obj.traverse((o: any) => { if (!o.isMesh || /^face-/.test(o.material.name || '')) return; const m = o.material, prev = m.onBeforeCompile, key = m.customProgramCacheKey;
      m.onBeforeCompile = (sh: any, r: any) => { if (prev) prev.call(m, sh, r); sh.uniforms.uPush = PUSH; sh.uniforms.uMB = MB; sh.uniforms.uMC = MC; sh.fragmentShader = 'uniform vec4 uMB;\nuniform vec3 uMC;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\nif (uMB.z > uMB.x && gl_FragCoord.x > uMB.x && gl_FragCoord.x < uMB.z && gl_FragCoord.y > uMB.y && gl_FragCoord.y < uMB.w) gl_FragColor.rgb = uMC;'); sh.vertexShader = 'uniform float uPush;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nmvPosition.xyz += normalize(mvPosition.xyz) * uPush; gl_Position = projectionMatrix * mvPosition;'); };
      m.customProgramCacheKey = () => (key ? key.call(m) : '') + '-push'; m.needsUpdate = true; });
    // (13 Nov 2026) the lid plant's band must show over the blink piece too: drawn only on the head, the piece covered it and 21 px showed
    if (PLANT === 'lid') M.obj.traverse((o: any) => { if (!o.isMesh || !/^face-/.test(o.material.name || '')) return; const m = o.material, prev = m.onBeforeCompile, key = m.customProgramCacheKey;
      m.onBeforeCompile = (sh: any, r: any) => { if (prev) prev.call(m, sh, r); sh.uniforms.uMB = MB; sh.uniforms.uMC = MC; sh.fragmentShader = 'uniform vec4 uMB;\nuniform vec3 uMC;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\nif (uMB.z > uMB.x && gl_FragCoord.x > uMB.x && gl_FragCoord.x < uMB.z && gl_FragCoord.y > uMB.y && gl_FragCoord.y < uMB.w) gl_FragColor = vec4(uMC, 1.0);'); };
      m.customProgramCacheKey = () => (key ? key.call(m) : '') + '-lidplant'; m.needsUpdate = true; });
    let MW: any = null, MHW = 0, MUP = 0, MDN = 0;   // ('mouth': the front view's mouth in 3D, and its box about it in pixels)
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
      // ('stray': the eye zone. 14 Nov: the whites grown 12 px left Lumi's big dark irises outside it; it is each eye's box
      // round its whites, wider by 35% of its size each way, at least 6 px)
      let eyeZ: Uint8Array | null = null; { const seen = new Uint8Array(N), st: number[] = [];
        for (let i = 0; i < N; i++) { if (!white[i] || seen[i]) continue; let x0 = W, x1 = 0, y0 = H, y1 = 0, n = 0; st.push(i); seen[i] = 1;
          while (st.length) { const q = st.pop()!; n++; const x = q % W, y = (q / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
            for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const r2 = yy * W + xx; if ((white[r2] || (dark[r2] && Math.abs(xx - (i % W)) < 60 && Math.abs(yy - ((i / W) | 0)) < 50)) && !seen[r2]) { seen[r2] = 1; st.push(r2); } } }   // (through the iris, pupil and lashes joined to the whites: Lumi's whites lie on one side of her iris)
          if (n < 6) continue; if (!eyeZ) eyeZ = new Uint8Array(N); const mx = Math.max(6, (x1 - x0) * .35), my = Math.max(6, (y1 - y0) * .35);
          for (let y = Math.max(0, Math.floor(y0 - my)); y <= Math.min(H - 1, Math.ceil(y1 + my)); y++) for (let x = Math.max(0, Math.floor(x0 - mx)); x <= Math.min(W - 1, Math.ceil(x1 + mx)); x++) eyeZ[y * W + x] = 1; } }
      const eye8 = new Uint8Array(N), ring16 = new Uint8Array(N);   // ('lid': the eye area and the skin round it)
      for (let i = 0; i < N; i++) if (white[i]) { const x = i % W, y = (i / W) | 0; for (let dy = -16; dy <= 16; dy++) for (let dx = -16; dx <= 16; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const d = Math.max(Math.abs(dx), Math.abs(dy)); if (d <= 8) eye8[yy * W + xx] = 1; else ring16[yy * W + xx] = 1; } }
      /* (11 Nov 2026, what the auditor did not check yet: the other moods and the mouth) face: every mood's piece must be seen
         where it lies. The game draws it just on top of the head (polygon offset); where the head or the body still comes
         through, the painted face under it shows (the smile's mouth under an open "o", an eye's outline under a closed one).
         The same picture with the head and body drawn 4 mm further back is what it should look like; a pixel of the piece
         that differs from it (colour .1) is a fault, unless something lies well in front of the piece there (4 mm or more:
         hair, a hand). (Drawing the piece over everything instead drew its far side over the nose: false alarms.) */
      saved.forEach(([o, m, v]: any) => { o.visible = v && !/^face-/.test(m.name || ''); if (o.visible) o.material = idMat(m, 1, false); });
      solo.add(av.root); av.root.updateMatrixWorld(true); const Pb = read(solo, cam); top.add(av.root); av.root.updateMatrixWorld(true);
      saved.forEach(([o, m, v]: any) => { o.material = m; o.visible = v; });
      const dep = (px: Uint8Array, i: number) => (px[i * 4 + 1] * 256 + px[i * 4 + 2]) / 1000;
      /* (12 Nov 2026, the mouth's own shape per mood) 'mouth': from the front and three-quarters, the lips are the red
         pixels in a box below the smile's eye whites, between their outer edges. Moods that keep the painted mouth (blink,
         half, happy, lookL, lookR) must show the smile's lips (pixels of one and not the other, 1 px apart, count);
         'o' and 'excited' a roundish rose oval (height .55 to 1.6 of its width, filling .6 of its ellipse) that is not the
         smile's mouth, with no old lip left beside it (red pixels not joined to the oval count), 'excited' larger than 'o';
         'sad' a mouth whose corners lie lower than its middle. A shape that fails counts the whole mouth's pixels. */
      const mouthOn = Math.abs(s) < 1 && PLANT !== 'eyes';
      let mx0 = W, mx1 = -1, my1 = -1; if (mouthOn) for (let i = 0; i < N; i++) if (white[i]) { const x = i % W, y = (i / W) | 0; mx0 = Math.min(mx0, x); mx1 = Math.max(mx1, x); my1 = my1 < 0 ? y : Math.min(my1, y); }
      /* (first run, Sol: his orange-red skin passed a plain "red" test and the box reached his shirt: 17600 px) the lips are
         judged against the friend's own skin in the box: pinker (blue over green, for its red) or clearly darker; the box lies
         between the nose tip (.22 of the eyes' span below their whites) and the chin (.62), and within .27 of the span
         either side of the middle (no blush on the cheeks) */
      const ew = mx1 - mx0, mcx = (mx0 + mx1) / 2;
      let bx0 = 0, bx1 = -1, by0 = 0, by1 = -1; if (ew > 8) { bx0 = mcx - ew * .27; bx1 = mcx + ew * .27; by0 = my1 - ew * .62; by1 = my1 - ew * .22; }
      /* (13 Nov, Lumi rebuilt: her big eyes put the box's top through her mouth, and its foot below her chin) from the
         front, the box's height comes from the face's own shape: down the face's middle column from under the eyes, the nose
         tip is the nearest point and the chin is where the head ends or steps back 2 cm; the mouth lies from a quarter of
         the way from the nose tip to the chin down to just above the chin */
      if (s === 0 && ew > 8) { const xc = Math.round(mcx); let nz = -1, nd = 1e9;
        for (let y = my1 - 2; y > my1 - ew * 1.2 && y > 0; y--) { const j = y * W + xc; if (!Pb[j * 4 + 3]) break; const d = dep(Pb, j); if (d < nd) { nd = d; nz = y; } }
        if (nz > 0) { let cz = -1, prev = nd; for (let y = nz - 1; y > 0; y--) { const j = y * W + xc; if (!Pb[j * 4 + 3] || dep(Pb, j) > prev + .02) { cz = y + 1; break; } prev = dep(Pb, j); }
          if (cz > 0 && nz - cz > 6) { by1 = nz - (nz - cz) * .25; by0 = cz + (nz - cz) * .04; } } }
      /* (13 Nov 2026, Sol rebuilt, three-quarters: only the near eye's white is seen, so a box under the eyes' span lay on
         that eye's blush) away from the front, the box is where the front view's mouth lies in 3D, projected into this view */
      if (s !== 0 && MW) { const p = MW.clone().project(cam), px = (p.x + 1) / 2 * W, py = (p.y + 1) / 2 * H; bx0 = px - MHW; bx1 = px + MHW; by0 = py - MDN; by1 = py + MUP; }
      const mbox = (i: number) => { const x = i % W, y = (i / W) | 0; return bx1 > bx0 && x >= bx0 && x <= bx1 && y > by0 && y < by1; };
      const pk = (px: Uint8Array, i: number) => (px[i * 4 + 2] - px[i * 4 + 1]) / Math.max(1, px[i * 4]), vv = (px: Uint8Array, i: number) => Math.max(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]) / 255;
      let skPk = 0, skV = 0, skRd = 0, dF = 9;   // (13 Nov, Lumi: her short face put the box's foot below the chin, on the dark green hair behind it, taken as her mouth: only the face's own surface counts, no more than 2.5 cm behind the box's median depth; in the front view only, which places the mouth: turned, the face's depth runs across the box and this cut Sol's mouth in two)
      const rd = (px: Uint8Array, i: number) => (px[i * 4] - px[i * 4 + 1]) / Math.max(1, px[i * 4]);   // (second run: Sol's lips are only redder than his skin, green .34 of red against .47)
      const lips = (px: Uint8Array) => { const L = new Uint8Array(N); let n = 0; if (bx1 <= bx0) return { L, n };
        for (let i = 0; i < N; i++) { if (!mbox(i) || !mine(i) || (s === 0 && (!Pb[i * 4 + 3] || dep(Pb, i) > dF + .025))) continue; if (pk(px, i) > skPk + .09 || vv(px, i) < skV - .2 || rd(px, i) > skRd + .08) { L[i] = 1; n++; } } return { L, n }; };
      const near = (L: Uint8Array, i: number, d: number) => { const x = i % W, y = (i / W) | 0; for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && L[yy * W + xx]) return true; } return false; };
      const groups = (L: Uint8Array) => { const seen = new Uint8Array(N), out: number[][] = [], st: number[] = [];
        for (let i = 0; i < N; i++) { if (!L[i] || seen[i]) continue; const g: number[] = []; st.push(i); seen[i] = 1;
          while (st.length) { const j = st.pop()!; g.push(j); const x = j % W, y = (j / W) | 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const q = yy * W + xx; if (L[q] && !seen[q]) { seen[q] = 1; st.push(q); } } }
          out.push(g); } return out.sort((a, b) => b.length - a.length); };
      setMood('smile'); const C0 = mouthOn ? read(top, cam) : null;
      if (C0) { { const ds: number[] = []; for (let i = 0; i < N; i++) if (mbox(i) && Pb[i * 4 + 3]) ds.push(dep(Pb, i)); ds.sort((a, b) => a - b); dF = ds[ds.length >> 1] ?? 9; }
        const ps: number[] = [], vs: number[] = [], rs: number[] = []; for (let i = 0; i < N; i++) if (mbox(i) && mine(i) && (s !== 0 || (Pb[i * 4 + 3] && dep(Pb, i) <= dF + .025))) { ps.push(pk(C0, i)); vs.push(vv(C0, i)); rs.push(rd(C0, i)); } const md = (a: number[]) => a.sort((x, y) => x - y)[a.length >> 1] || 0; skPk = md(ps); skV = md(vs); skRd = md(rs);
        let n = 0, sr = 0, sg = 0, sb = 0; for (let i = 0; i < N; i++) if (mbox(i) && mine(i) && Math.abs(rd(C0, i) - skRd) < .03) { sr += C0[i * 4]; sg += C0[i * 4 + 1]; sb += C0[i * 4 + 2]; n++; } if (n) MC.value.set(sr / n / 255, sg / n / 255, sb / n / 255); MCs.value.copy(MC.value); }   // (the skin: the box's median, mostly skin)
      const SM = C0 ? lips(C0) : { L: new Uint8Array(N), n: 0 }; let SMm: Uint8Array | null = null;
      if (s === 0 && SM.n) { SMm = new Uint8Array(N); let best: number[] | null = null, by = 1e9; for (const g of groups(SM.L)) { if (g.length < 10) continue; let sy = 0; for (const j of g) sy += (j / W) | 0; if (sy / g.length < by) { by = sy / g.length; best = g; } } if (best) for (const j of best) SMm[j] = 1; }   // (the smile's mouth: its lowest lip patch)
      /* (13 Nov, Lumi rebuilt: her faint smile's lowest lip patch was hair below her chin, and the box at three-quarters went
         to her cheek) the box itself is placed in 3D: its middle in the front view, at the depth of the head there */
      if (s === 0 && bx1 > bx0) { const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2, ds: number[] = []; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const j = (Math.round(cy) + dy) * W + Math.round(cx) + dx; if (j >= 0 && j < N && Pb[j * 4 + 3]) ds.push(dep(Pb, j)); }
        if (ds.length) { ds.sort((a, b) => a - b); const dz = ds[ds.length >> 1], d3 = new THREE.Vector3((cx + .5) / W * 2 - 1, (cy + .5) / H * 2 - 1, -1).unproject(cam).sub(cam.position).normalize();
          MW = cam.position.clone().addScaledVector(d3, dz / d3.dot(cam.getWorldDirection(new THREE.Vector3()))); MHW = (bx1 - bx0) / 2; MUP = by1 - cy; MDN = cy - by0; } } const mArea: Record<string, number> = {}, mCase: Record<string, any> = {};
      for (const m of (PLANT === 'eyes' ? ['blink', 'half', 'happy', 'sad'] : PLANT === 'mouth' || PLANT === 'lid' ? ['blink'] : PLANT === 'stray' ? ['lookL'] : ['blink', 'half', 'happy', 'sad', 'smile', 'o', 'excited', 'lookL', 'lookR'])) {
        MB.value.set(0, 0, 0, 0); if (PLANT === 'mouth' && m === 'blink') { MB.value.set(mcx - ew * .27, my1 - ew * .62, mcx + ew * .27, my1 - ew * .22); }
        if (PLANT === 'stray' && m === 'lookL' && ew > 8) { const ny = (my1 + by1) / 2; MB.value.set(mcx - 4, ny - 4, mcx + 4, ny + 4); MC.value.set(.25, .12, .08); }   // (the stray plant: a dark dot on the nose in the glance, as Sol's mood mouth on his nostril)
        if (PLANT === 'lid' && m === 'blink') { MB.value.set(mx0 + ew * .05, my1 - 2, mx0 + ew * .3, my1 + 2); MC.value.copy(MCs.value).lerp(new THREE.Vector3(1, 1, 1), .45); }   // (the lid plant: a pale band under the first eye, as Sol's rim)
        setMood(PLANT === 'eyes' ? 'smile' : m); const C = read(top, cam), f = new Uint8Array(N); let k = 0;
        if (['blink', 'half', 'happy', 'sad'].includes(m)) for (let i = 0; i < N; i++) { if (!grow[i]) continue; const [v, sa] = hsv(C, i); if (m !== 'half' && m !== 'sad' ? (v > .8 && sa < .18) : false) { f[i] = 1; k++; } }
        /* (13 Nov 2026, seen by eye on Sol at three-quarters, passed by 'eyes' and 'face') 'lid': a shut eye (blink, happy)
           must be the skin round it, its lash line apart: a pale rim under the lash or a lighter flat lid patch is a pixel
           in the eye area (the smile's eye whites grown 8 px) about as bright as the skin (not more than .1 darker: the lash
           and freckles are) but paler (.12 less saturated; Sol's rim: s .55 against his skin's .78, v .89 against .93) than
           the skin's median in a ring 8 to 16 px round it (dark pixels, the lash, brows and hair, left out of both) */
        const fl = new Uint8Array(N); let kl = 0;
        if (m === 'blink' || m === 'happy' || m === 'excited') { const sv: number[] = [], ss: number[] = [];
          for (let i = 0; i < N; i++) if (ring16[i] && !eye8[i] && mine(i)) { const [v, sa] = hsv(C, i); if (v > .35) { sv.push(v); ss.push(sa); } }
          sv.sort((a, b) => a - b); ss.sort((a, b) => a - b); const skv = sv[sv.length >> 1] || 1, sks = ss[ss.length >> 1] || 0;
          for (let i = 0; i < N; i++) { if (!eye8[i] || !mine(i) || i >= N - W * 10) continue; const [v, sa] = hsv(C, i); if (v > skv - .1 && sa < sks - .12) { fl[i] = 1; kl++; } }
          const seen = new Uint8Array(N), st: number[] = [];   // (specks under 4 touching pixels are the lash's soft edge)
          for (let i = 0; i < N; i++) { if (!fl[i] || seen[i]) continue; const grp: number[] = []; st.push(i); seen[i] = 1;
            while (st.length) { const j = st.pop()!; grp.push(j); const x = j % W, y = (j / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const q = yy * W + xx; if (fl[q] && !seen[q]) { seen[q] = 1; st.push(q); } } }
            if (grp.length < 4) for (const j of grp) { fl[j] = 0; kl--; } } }
        PUSH.value = .004; const T = read(top, cam); PUSH.value = 0;   // (what it should look like: the head and body 4 mm further back, so the piece wins over the skin just under it, never over the nose or a lock of hair in front)
        const vis = saved.map(([o]: any) => o.visible); saved.forEach(([o, mt]: any) => { o.visible = o.visible && /^face-/.test(mt.name || ''); if (o.visible) o.material = idMat({}, 4, false); });
        solo.add(av.root); av.root.updateMatrixWorld(true); const Pm = read(solo, cam); top.add(av.root); av.root.updateMatrixWorld(true);
        saved.forEach(([o, mt]: any, j: number) => { o.material = mt; o.visible = vis[j]; });
        const fc = new Uint8Array(N); let kf = 0;
        for (let i = 0; i < N; i++) { if (!Pm[i * 4 + 3] || !mine(i) || i >= N - W * 10) continue;
          if (Math.hypot(C[i * 4] - T[i * 4], C[i * 4 + 1] - T[i * 4 + 1], C[i * 4 + 2] - T[i * 4 + 2]) / 255 < .1) continue;
          if (Pb[i * 4 + 3] && dep(Pb, i) < dep(Pm, i) - .004) continue;
          /* (first run: hundreds of pixels a case in the side views, all along the face's profile, where the piece wraps round
             the far cheek and the nose or cheek hides it, as any surface hides what lies behind its edge) not judged where the
             piece is seen edge on: more than 2 mm deeper or nearer from one pixel to the next (about 1 mm a pixel: over 63 degrees) */
          { const x = i % W; let graze = false; for (const j of [i - 1, i + 1, i - W, i + W]) { if (j < 0 || j >= N || (j === i - 1 && x === 0) || (j === i + 1 && x === W - 1) || !Pm[j * 4 + 3]) continue; if (Math.abs(dep(Pm, j) - dep(Pm, i)) > .002) graze = true; } if (graze) continue; }
          fc[i] = 1; kf++; }
        /* (second run: only specks left, 1 to 3 pixels where a lock of Finn's fringe lies within 4 mm of his cheek) only
           groups of 4 or more touching pixels count */
        { const seen = new Uint8Array(N), st: number[] = [];
          for (let i = 0; i < N; i++) { if (!fc[i] || seen[i]) continue; const grp: number[] = []; st.push(i); seen[i] = 1;
            while (st.length) { const j = st.pop()!; grp.push(j); const x = j % W, y = (j / W) | 0;
              for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const q = yy * W + xx; if (fc[q] && !seen[q]) { seen[q] = 1; st.push(q); } } }
            if (grp.length < 4) for (const j of grp) { fc[j] = 0; kf--; } } }
        const fm = new Uint8Array(N); let km = 0, ML = { L: new Uint8Array(N), n: 0 }, why = '';
        if (mouthOn && SM.n) { ML = lips(C);
          if (['blink', 'half', 'happy', 'lookL', 'lookR', 'smile'].includes(m)) { for (let i = 0; i < N; i++) if ((ML.L[i] && !near(SM.L, i, s ? 2 : 1)) || (SM.L[i] && !near(ML.L, i, s ? 2 : 1))) { fm[i] = 1; km++; } if (km) why = 'not as the smile (the mouth, or a mood piece edge over the cheek: the blink lid of Lumi at three-quarters, 13 Nov)'; }
          else {
            /* (13 Nov 2026, friends' new mouths: Sol's 'o' a dark rose oval, his 'sad' a brown arc, with faint ends of the old
               smile left either side) the shape is judged on the mouth's core, the pixels well apart from the skin (.2 darker,
               or .25 redder, or .2 pinker); the faint lip pixels not within 3 px of that core (its paler rim) are old lips left beside it, and
               only they are marked. With no core (the smile's faint lips only: the mood piece missing) the whole lips are. */
            const core = new Uint8Array(N); let nc = 0; for (let i = 0; i < N; i++) if (ML.L[i] && (vv(C, i) < skV - .2 || rd(C, i) > skRd + .25 || pk(C, i) > skPk + .2)) { core[i] = 1; nc++; }
            const gs = groups(nc > 12 ? core : ML.L), g0 = gs[0] || []; let bad = !g0.length; why += `[lips ${ML.n} core ${nc} groups ${gs.map(g => g.length).slice(0, 4).join('/')} skin v ${skV.toFixed(2)} rd ${skRd.toFixed(2)} pk ${skPk.toFixed(2)}] `;
            const in0 = new Uint8Array(N); for (const j of g0) in0[j] = 1;
            /* (second run, three-quarters: the cheek's blush lies in the box and was marked as old lips) old lips count only
               where the smile's mouth was: its lowest patch of 10 px or more (the blush is higher, on the cheek) */
            if (!SMm) { SMm = new Uint8Array(N); let best: number[] | null = null, by = 1e9; for (const g of groups(SM.L)) { if (g.length < 10) continue; let sy = 0; for (const j of g) sy += (j / W) | 0; if (sy / g.length < by) { by = sy / g.length; best = g; } } if (best) for (const j of best) SMm[j] = 1; }
            for (let i = 0; i < N; i++) if (ML.L[i] && !near(in0, i, 3) && near(SMm, i, 2)) { fm[i] = 1; km++; }   // (old lips left beside the new mouth)
            let same = 0; for (const j of g0) if (near(SM.L, j, 1)) same++; let gx0 = W, gx1 = 0, gy0 = H, gy1 = 0; for (const j of g0) { const x = j % W, y = (j / W) | 0; gx0 = Math.min(gx0, x); gx1 = Math.max(gx1, x); gy0 = Math.min(gy0, y); gy1 = Math.max(gy1, y); }
            const w = gx1 - gx0 + 1, hh = gy1 - gy0 + 1;   // (13 Nov: no correction for the turn: from three-quarters the mouth on the round face looks as wide as from the front; dividing by the cosine failed Sol's excited, h/w .51)
            if (g0.length && same > g0.length * .85 && Math.abs(g0.length - SM.n) < SM.n * .2) { bad = true; why += 'smile '; }   // (still the smile's mouth: the mood piece is missing)
            // (13 Nov: the shape is judged from the front only: turned, the nostril came into the box and split the mouth's core, and the turn changes the shape; the other views judge old lips left and a mouth that did not change)
            if (s === 0 && (m === 'o' || m === 'excited')) { if (hh / w < .55 || hh / w > 1.6 || g0.length < Math.PI / 4 * (gx1 - gx0 + 1) * hh * (s ? .5 : .6)) { bad = true; why += `round h/w ${(hh / w).toFixed(2)} fill ${(g0.length / (Math.PI / 4 * (gx1 - gx0 + 1) * hh)).toFixed(2)} `; } mArea[m] = g0.length; }
            if (s === 0 && m === 'sad' && g0.length) { const col = (a: number, b2: number) => { let sy = 0, c = 0; for (const j of g0) { const x = j % W; if (x >= gx0 + w * a && x <= gx0 + w * b2) { sy += (j / W) | 0; c++; } } return c ? sy / c : 0; };
              if ((col(0, .2) + col(.8, 1)) / 2 >= col(.4, .6)) { bad = true; why += `sad corners ${col(0, .2).toFixed(1)} ${col(.8, 1).toFixed(1)} middle ${col(.4, .6).toFixed(1)} `; } }   // (the buffer's rows run upwards: a corner lower on screen has the smaller row)
            if (bad) for (const j of g0) { if (!fm[j]) { fm[j] = 1; km++; } } } }
        /* (14 Nov 2026, owner: villagers and pets fail mostly at the face, eyes, sockets and nose) 'stray': a mood may change
           only the eyes and the mouth. A pixel of the friend (mood piece or head: the game's shut-eye paint is on the head) outside the eye zone and
           the mouth box (3 px wider), on the friend, that differs from the smile picture by .08 from every pixel within 1 px
           (the head moves a little with breathing) is a stray change: the mood mouth drawn on a nostril (Sol, Finn), a lid
           patch lying on the cheek over the blush (Lumi), a flat skin patch over the brows (villagers). Groups under 4 px
           are left out. Not judged on the smile itself, nor where the eyes or mouth were not found. */
        const fs = new Uint8Array(N); let ks = 0;
        if (C0 && m !== 'smile' && eyeZ) { for (let i = 0; i < N; i++) { if (!Pb[i * 4 + 3] || eyeZ[i] || !mine(i) || i >= N - W * 10) continue;   // (on the head and body, not only the mood piece: the game's shut-eye paint changes the head itself)
            const x = i % W, y = (i / W) | 0; if (bx1 > bx0 && x >= bx0 - 3 && x <= bx1 + 3 && y >= by0 - 3 && y <= by1 + 3) continue;
            let best = 9; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const q = (yy * W + xx) * 4; best = Math.min(best, Math.hypot(C[i * 4] - C0[q], C[i * 4 + 1] - C0[q + 1], C[i * 4 + 2] - C0[q + 2]) / 255); }
            if (best > .08) { fs[i] = 1; ks++; } }
          for (const g of groups(fs)) if (g.length < 4) for (const j of g) { fs[j] = 0; ks--; } }
        const r: any = { id, kind: 'face', pose: m, view: String(s), kit: 0, poke: 0, hairtone: 0, skintone: 0, eyes: k, face: kf, mouth: km, lid: kl, stray: ks, mouthWhy: why.trim() };
        if (ks > LIMIT.stray || (ALLPICS && C0 && m !== 'smile')) pics[`${id}-face-${m}-${s}-stray${ks > LIMIT.stray ? '' : '-look'}`] = png(C, fs); cases.push(r); mCase[m] = [r, C, fm, ML.L];
        if (k > LIMIT.eyes) pics[`${id}-face-${m}-${s}-eyes`] = png(C, f);
        if (kl > LIMIT.lid || (ALLPICS && (m === 'blink' || m === 'happy' || m === 'excited'))) pics[`${id}-face-${m}-${s}-lid${kl > LIMIT.lid ? '' : '-look'}`] = png(C, fl);
        if (kf > LIMIT.face || ALLPICS) { pics[`${id}-face-${m}-${s}-${kf > LIMIT.face ? 'face' : 'look'}`] = png(C, fc); }
        if (km > LIMIT.mouth || (ALLPICS && mouthOn)) pics[`${id}-face-${m}-${s}-mouth${km > LIMIT.mouth ? '' : '-look'}`] = png(C, fm);
      }
      if (mArea.o && mArea.excited && mArea.excited < mArea.o * 1.15 && mCase.excited) { const [r, C, fm, EL] = mCase.excited; for (let i = 0; i < N; i++) if (EL[i] && !fm[i]) { fm[i] = 1; r.mouth++; }
        pics[`${id}-face-excited-${s}-mouth`] = png(C, fm); }   // (excited: as open as 'o' or less)
      tags.forEach(o => { o.visible = true; });
    }
    setMood('smile'); top.remove(av.root);
  }
  return { cases, pics };
}, [LIST, QUICK, LIMIT] as any);
for (const [k, v] of Object.entries(res.pics as Record<string, string>)) writeFileSync(`${OUT}/${k}.png`, Buffer.from(v.split(',')[1], 'base64'));
summarize(res.cases);
await b.close();
