// (Meshy pets, 10 Nov 2026) The animals' auditor, like tools/meshy/audit.mts for the friends: the game's own model of each
// animal (near and far), every clip sampled over its whole loop, measured, not looked at:
//   stretch  triangles stretched more than 2.4 times (or squashed under a third of) their rest size: a weight pulling skin
//   tear     background seen through the body (an enclosed hole in the silhouette, from 8 sides, above and below) whose
//            rim lies close together in depth (a gap between a leg and the belly is far apart in depth: not a tear)
//   sink     the lowest point under the ground (more than 2 cm) in any clip; float: off the ground (3 cm) in a clip that
//            stands (idle, walk, follow, sad, sleep)
//   eyes     the painted eye (its dark pupil, its white sparkles) still seen while the eyes are shut (sleep) or happy
//   hat      a pet's hat (js/pets.ts putHat) more than 4 cm above the head or its middle inside the head
//   size     the near model over 800 KB, the far one over 400 KB
// Each fault is painted magenta on that case's picture; <out>/summary.txt lists the counts, <out>/cases.json every case.
//   cd tests; SV_URL=http://localhost:8777/ node ../tools/meshy/audit_pets.mts <out dir> [puppy,...] [quick|selftest]
// quick: three moments per clip and four sides. selftest: plants one fault of each kind on the first animal and fails
// unless every check catches its own plant (run it after any change to this file).
import { createRequire } from 'node:module';
import { open, clear } from '../../tests/harness.mts';
const { chromium } = createRequire(new URL('../../tests/package.json', import.meta.url))('playwright');
import { writeFileSync, mkdirSync, statSync } from 'node:fs';
const [OUT, LIST = 'puppy', MODE = ''] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const LIMIT = { stretch: 20, tear: 2, sink: 0, float: 0, eyes: 6, hat: 0 };
const SIZE = { near: 800, far: 400 };
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const _nc = b.newContext.bind(b); b.newContext = async (o: any) => { const c = await _nc(o); c.setDefaultNavigationTimeout(240000); c.setDefaultTimeout(600000); return c; };
const P = await open(b, { w: 900, h: 700, fast: false }); await clear(P.page);
P.page.on('pageerror', e => console.log('pageerror', e.message));
const kinds = LIST.split(',');
const res: any = await P.page.evaluate(async ([kinds, MODE, LIMIT]) => {
  const G = (window as any).__sv, MK = await import(String('/js/modelkit.js')), { THREE } = await import(String('/js/gfx.js'));
  const { clone } = await import(String('/vendor/SkeletonUtils.js')), PETS = await import(String('/js/pets.js'));
  const R = G.renderer, out: any = { cases: [], pics: {} }, S = 360;
  const quick = MODE === 'quick', self = MODE === 'selftest';
  const rt = new THREE.WebGLRenderTarget(S, S);
  const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 2.2));
  const read = (cam: any, over: any = null) => { scene.overrideMaterial = over; R.setRenderTarget(rt); R.setClearColor(0x000000, 0); R.clear(); R.render(scene, cam); const px = new Uint8Array(S * S * 4); R.readRenderTargetPixels(rt, 0, 0, S, S, px); R.setRenderTarget(null); scene.overrideMaterial = null; return px; };
  const SRGB = new Uint8Array(256).map((_, i) => { const v = i / 255; return Math.round(255 * (v <= .0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - .055)); });
  const png = (px: Uint8Array, flags: Uint8Array | null) => {
    const cv = document.createElement('canvas'); cv.width = S; cv.height = S; const x = cv.getContext('2d'), im = x.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let i = 0; i < S; i++) { const s = ((S - 1 - y) * S + i) * 4, d = (y * S + i) * 4, f = flags && flags[(S - 1 - y) * S + i];
      im.data[d] = f ? 255 : px[s + 3] ? SRGB[px[s]] : 200; im.data[d + 1] = f ? 0 : px[s + 3] ? SRGB[px[s + 1]] : 210; im.data[d + 2] = f ? 255 : px[s + 3] ? SRGB[px[s + 2]] : 220; im.data[d + 3] = 255; }
    x.putImageData(im, 0, 0); return cv.toDataURL('image/png');
  };
  // depth from the camera in mm, in red and green (skinning kept: a basic material, its colour replaced)
  const depthMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const PLANT = { value: 0 }, PLANTAT = { value: new THREE.Vector3() };
  depthMat.onBeforeCompile = (sh: any) => {
    sh.uniforms.uPlant = PLANT; sh.uniforms.uPlantAt = PLANTAT;
    sh.vertexShader = 'varying float vDz;\nvarying vec3 vW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvDz = -mvPosition.z;\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'varying float vDz;\nvarying vec3 vW;\nuniform float uPlant;\nuniform vec3 uPlantAt;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\nif (uPlant > .5 && distance(vW, uPlantAt) < .045) discard;\nfloat mm = clamp(vDz * 1000.0, 0.0, 65000.0);\ngl_FragColor = vec4(floor(mm / 256.0) / 255.0, mod(mm, 256.0) / 255.0, 1.0, 1.0);');
  };
  const depthAt = (px: Uint8Array, i: number) => (px[i * 4] * 256 + px[i * 4 + 1]) / 1000;
  // enclosed background in the silhouette, its rim close in depth
  const tears = (px: Uint8Array) => {
    const n = S * S, bg = new Uint8Array(n), seen = new Uint8Array(n), flags = new Uint8Array(n); let count = 0;
    for (let i = 0; i < n; i++) bg[i] = px[i * 4 + 3] ? 0 : 1;
    const st: number[] = [];
    for (let i = 0; i < S; i++) for (const j of [i, (S - 1) * S + i, i * S, i * S + S - 1]) if (bg[j] && !seen[j]) { seen[j] = 1; st.push(j); }
    while (st.length) { const j = st.pop()!, x = j % S, y = (j / S) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const u = x + dx, v = y + dy; if (u < 0 || v < 0 || u >= S || v >= S) continue; const k = v * S + u; if (bg[k] && !seen[k]) { seen[k] = 1; st.push(k); } } }
    for (let i = 0; i < n; i++) if (bg[i] && !seen[i]) {   // (a hole: its pixels and the depths round it)
      const cells: number[] = [], rim: number[] = []; seen[i] = 1; st.push(i);
      while (st.length) { const j = st.pop()!; cells.push(j); const x = j % S, y = (j / S) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const u = x + dx, v = y + dy; if (u < 0 || v < 0 || u >= S || v >= S) continue; const k = v * S + u;
          if (bg[k]) { if (!seen[k]) { seen[k] = 1; st.push(k); } } else rim.push(depthAt(px, k)); } }
      if (cells.length < 4 || !rim.length) continue;
      rim.sort((a, b) => a - b); const spread = rim[Math.floor(rim.length * .9)] - rim[Math.floor(rim.length * .1)];
      if (spread > .03) continue;   // (the gap between two parts: a leg in front of the belly, an ear beside the cheek)
      count += cells.length; for (const c of cells) flags[c] = 1;
    }
    return { count, flags };
  };
  const _v = new THREE.Vector3(), _w = new THREE.Vector3();
  const skinned = (m: any, outArr: Float32Array) => { const pos = m.geometry.attributes.position; m.updateMatrixWorld(true); m.skeleton.update();   // (the bone matrices are otherwise only updated when drawn)
    for (let i = 0; i < pos.count; i++) { _v.fromBufferAttribute(pos, i); (m.applyBoneTransform || m.boneTransform).call(m, i, _v); _v.applyMatrix4(m.matrixWorld); outArr[i * 3] = _v.x; outArr[i * 3 + 1] = _v.y; outArr[i * 3 + 2] = _v.z; } };
  for (const kind of kinds) for (const lod of ['near', 'far']) {
    const name = 'creature-' + kind + (lod === 'near' ? '-hd' : ''), t = await MK.loadWorldModel(name);
    if (!t) { out.cases.push({ kind, lod, clip: '-', missing: 1 }); continue; }
    const obj = clone(t.scene); scene.add(obj); obj.updateMatrixWorld(true);
    const body = (() => { let best: any = null; obj.traverse((o: any) => { if (o.isSkinnedMesh && /^meshy-/.test(o.material.name) && !/-(shut|joy)\d$/.test(o.material.name) && (!best || o.geometry.attributes.position.count > best.geometry.attributes.position.count)) best = o; }); return best; })();
    const bone = (n: string) => obj.getObjectByName(n);
    const mixer = new THREE.AnimationMixer(obj);
    const idx = body.geometry.index.array, nv = body.geometry.attributes.position.count;
    const rest = new Float32Array(nv * 3), now = new Float32Array(nv * 3);
    body.skeleton.pose(); skinned(body, rest);
    let lo = 1e9, hi = -1e9; for (let i = 1; i < rest.length; i += 3) { lo = Math.min(lo, rest[i]); hi = Math.max(hi, rest[i]); }
    const Hh = hi - lo, c0 = new THREE.Box3().setFromBufferAttribute(new THREE.BufferAttribute(rest, 3)).getCenter(new THREE.Vector3());
    const restLen = new Float32Array(idx.length);
    const elen = (a: Float32Array, i: number, j: number) => Math.hypot(a[i * 3] - a[j * 3], a[i * 3 + 1] - a[j * 3 + 1], a[i * 3 + 2] - a[j * 3 + 2]);
    for (let k = 0; k < idx.length; k += 3) for (let e = 0; e < 3; e++) restLen[k + e] = elen(rest, idx[k + e], idx[k + (e + 1) % 3]);
    const clips = t.clips.map((c: any) => c.name);
    const views: [string, number, number][] = quick ? [['front', 0, .1], ['side', Math.PI / 2, .1], ['back', Math.PI, .1], ['tq', .8, .3]]
      : [...[0, 1, 2, 3, 4, 5, 6, 7].map(k => ['y' + k * 45, k * Math.PI / 4, .12] as [string, number, number]), ['above', .3, 2.5], ['below', .3, -2.5]];
    const plants = self && kind === kinds[0] && lod === 'near' ? ['none', 'stretch', 'tear', 'eyes', 'sink'] : ['none'];
    for (const plant of plants) for (const clip of (plant === 'none' ? clips : plant === 'eyes' ? ['sleep'] : ['idle'])) {
      const c = t.clips.find((x: any) => x.name === clip); mixer.stopAllAction(); const a = mixer.clipAction(c); a.reset().play();
      const moments = quick || plant !== 'none' ? [.15, .5, .85] : [0, .17, .33, .5, .67, .83];
      for (const f of moments) {
        mixer.setTime(c.duration * f); obj.position.set(0, 0, 0); obj.updateMatrixWorld(true);
        if (plant === 'stretch') { bone('knee0').scale.setScalar(2.6); obj.updateMatrixWorld(true); }
        if (plant === 'sink') { bone('body').position.y -= Hh * .08; obj.updateMatrixWorld(true); }
        const hidden: any[] = []; if (plant === 'eyes') obj.traverse((o: any) => { if (o.isMesh && /-(shut|joy)\d$/.test(o.material.name)) { o.visible = false; hidden.push(o); } });
        PLANT.value = plant === 'tear' ? 1 : 0; PLANTAT.value.set(c0.x + Hh * .3, c0.y, c0.z);
        const cs: any = { kind, lod, clip, t: +f.toFixed(2), plant, stretch: 0, tear: 0, sink: 0, float: 0, eyes: 0, hat: 0, worst: '' };
        // stretch and the ground
        skinned(body, now); let minY = 1e9;
        for (let i = 1; i < now.length; i += 3) minY = Math.min(minY, now[i]);
        for (let k = 0; k < idx.length; k += 3) { let worst = 1;
          for (let e = 0; e < 3; e++) { const r0 = restLen[k + e]; if (r0 < 1e-5) continue; const r = elen(now, idx[k + e], idx[k + (e + 1) % 3]) / r0; worst = Math.max(worst, r, 1 / Math.max(r, 1e-3)); }
          if (worst > 2.4) cs.stretch++; }
        const ground = minY - lo;   // (the model stands on y 0 at rest)
        if (ground < -.02) cs.sink = Math.round(-ground * 1000);
        if (['idle', 'walk', 'follow', 'sad', 'sleep'].includes(clip) && ground > .03) cs.float = Math.round(ground * 1000);
        // tears from every side (the silhouette in depth colours)
        const box = new THREE.Box3().setFromObject(obj, true), cc = box.getCenter(new THREE.Vector3()), r = box.getSize(new THREE.Vector3()).length();
        let worstPic: any = null;
        for (const [vn, yaw, up] of views) {
          const cam = new THREE.PerspectiveCamera(30, 1, .02, 50), dir = new THREE.Vector3(Math.sin(yaw), up, Math.cos(yaw)).normalize();
          cam.position.copy(cc).addScaledVector(dir, r * 1.9); cam.lookAt(cc);
          const d = read(cam, depthMat), tr = tears(d);
          if (tr.count > cs.tear) { cs.tear = tr.count; cs.worst = vn; worstPic = { cam, flags: tr.flags }; }
        }
        // the eyes, while shut or happy: dark pupils or white sparkles where the eyes are
        const s0 = bone('shut0'), s1 = bone('shut1');
        const shutOn = s0 && (s0.getWorldScale(_w).x > .5 || bone('joy0').getWorldScale(_w).x > .5);
        if (s0 && s1 && shutOn) {
          const e0 = s0.getWorldPosition(new THREE.Vector3()), e1 = s1.getWorldPosition(new THREE.Vector3()), mid = e0.clone().add(e1).multiplyScalar(.5), er = e0.distanceTo(e1) * .36;
          const hb = bone('head'), fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(hb.getWorldQuaternion(new THREE.Quaternion())); fwd.y = 0; fwd.normalize();
          const cam = new THREE.PerspectiveCamera(30, 1, .01, 20); cam.position.copy(mid).addScaledVector(fwd, er * 9); cam.lookAt(mid); cam.updateMatrixWorld(true);
          const px = read(cam), flags = new Uint8Array(S * S);
          for (const e of [e0, e1]) { const p = e.clone().project(cam), q = e.clone().add(new THREE.Vector3(er, 0, 0).applyQuaternion(cam.quaternion)).project(cam);
            const cx = (p.x + 1) / 2 * S, cy = (p.y + 1) / 2 * S, rr = Math.abs(q.x - p.x) / 2 * S;
            for (let y = Math.max(0, Math.floor(cy - rr)); y < Math.min(S, cy + rr); y++) for (let x = Math.max(0, Math.floor(cx - rr)); x < Math.min(S, cx + rr); x++) {
              if ((x - cx) ** 2 + (y - cy) ** 2 > rr * rr) continue; const i = (y * S + x) * 4; if (!px[i + 3]) continue;
              const L = (.3 * px[i] + .59 * px[i + 1] + .11 * px[i + 2]) / 255, sat = Math.max(px[i], px[i + 1], px[i + 2]) - Math.min(px[i], px[i + 1], px[i + 2]);
              if (L < .012 || (L > .8 && sat < 25)) { cs.eyes++; flags[y * S + x] = 1; } } }   // (linear light: .012 is the pupil's near-black)
          if (cs.eyes > (LIMIT as any).eyes) out.pics[`${kind}-${lod}-${clip}-${cs.t}-${plant}-eyes`] = png(px, flags);
        }
        hidden.forEach(o => { o.visible = true; });
        if (worstPic && cs.tear > (LIMIT as any).tear) { const px = read(worstPic.cam); out.pics[`${kind}-${lod}-${clip}-${cs.t}-${plant}-tear-${cs.worst}`] = png(px, worstPic.flags); }
        if (cs.stretch > (LIMIT as any).stretch && !out.pics[`${kind}-${lod}-${clip}-stretch`]) {
          const cam = new THREE.PerspectiveCamera(30, 1, .02, 50); cam.position.copy(cc).add(new THREE.Vector3(r * 1.3, r * .4, r * 1.3)); cam.lookAt(cc);
          out.pics[`${kind}-${lod}-${clip}-${cs.t}-${plant}-stretch`] = png(read(cam), null); }
        if (plant === 'stretch') bone('knee0').scale.setScalar(1);
        out.cases.push(cs);
      }
    }
    // the hat: on the head, in the rest pose
    if (lod === 'near') { mixer.stopAllAction(); body.skeleton.pose(); obj.updateMatrixWorld(true);
      const holder = new THREE.Group(); scene.add(holder); scene.remove(obj); holder.add(obj);
      const hat = PETS.putHat(holder, 'crown') || await new Promise(r => setTimeout(() => r(PETS.putHat(holder, 'crown')), 1500));
      if (hat) { holder.updateMatrixWorld(true); const hb = new THREE.Box3().setFromObject(hat as any), hc = hb.getCenter(new THREE.Vector3());
        const ray = new THREE.Raycaster(new THREE.Vector3(hc.x, hb.max.y + .5, hc.z), new THREE.Vector3(0, -1, 0)); const hits = ray.intersectObject(body, false);
        const top = hits.length ? hits[0].point.y : -1e9, gap = hb.min.y - top;
        const cs: any = { kind, lod, clip: 'hat', t: 0, plant: 'none', stretch: 0, tear: 0, sink: 0, float: 0, eyes: 0, hat: (gap > .04 || hc.y < top) ? Math.round(gap * 1000) || 1 : 0 };
        out.cases.push(cs);
        const cam = new THREE.PerspectiveCamera(30, 1, .02, 50); const bx = new THREE.Box3().setFromObject(holder), cc = bx.getCenter(new THREE.Vector3()), r = bx.getSize(new THREE.Vector3()).length();
        cam.position.copy(cc).add(new THREE.Vector3(r * .9, r * .5, r * 1.4)); cam.lookAt(cc); out.pics[`${kind}-hat`] = png(read(cam), null); }
      scene.remove(holder);
    } else scene.remove(obj);
  }
  return out;
}, [kinds, MODE, LIMIT] as any);
for (const [k, v] of Object.entries(res.pics)) writeFileSync(`${OUT}/${k}.png`, Buffer.from(String(v).split(',')[1], 'base64'));
const cs = res.cases, keys = Object.keys(LIMIT);
const real = cs.filter((c: any) => c.plant === 'none');
const fail = real.filter((c: any) => keys.some(k => c[k] > LIMIT[k]) || c.missing);
const lines = [`pets audit ${new Date().toISOString()} cases ${real.length} failing ${fail.length}`];
for (const k of keys) lines.push(`${k}: ${real.filter((c: any) => c[k] > LIMIT[k]).length} cases over ${LIMIT[k]}, worst ${Math.max(0, ...real.map((c: any) => c[k] || 0))}`);
for (const kind of kinds) for (const lod of ['near', 'far']) {
  const f = `../models/world/creature-${kind}${lod === 'near' ? '-hd' : ''}.glb`; let kb = 0; try { kb = Math.round(statSync(f).size / 1024); } catch { }
  lines.push(`size ${kind} ${lod}: ${kb} KB (limit ${SIZE[lod]})${kb > SIZE[lod] || !kb ? '  OVER' : ''}`);
  const ff = fail.filter((c: any) => c.kind === kind && c.lod === lod);
  if (ff.length) lines.push(`${kind} ${lod}: ` + ff.map((c: any) => `${c.clip}@${c.t} ` + keys.filter(k => c[k] > LIMIT[k]).map(k => `${k} ${c[k]}`).join(' ')).join('; '));
}
if (MODE === 'selftest') {
  const caught = (p: string, k: string) => cs.some((c: any) => c.plant === p && c[k] > LIMIT[k]);
  const r = { stretch: caught('stretch', 'stretch'), tear: caught('tear', 'tear'), eyes: caught('eyes', 'eyes'), sink: caught('sink', 'sink') };
  lines.push('selftest ' + Object.entries(r).map(([k, v]) => `${k} ${v ? 'caught' : 'MISSED'}`).join(', '));
  if (Object.values(r).some(v => !v)) process.exitCode = 3;
}
writeFileSync(`${OUT}/summary.txt`, lines.join('\n') + '\n'); writeFileSync(`${OUT}/cases.json`, JSON.stringify(cs));
console.log(lines.join('\n'));
if (fail.length && !process.exitCode) process.exitCode = 2;
await b.close();
