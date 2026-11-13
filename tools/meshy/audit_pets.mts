// (Meshy pets, 10 Nov 2026) The animals' auditor, like tools/meshy/audit.mts for the friends: the game's own model of each
// animal (near and far), every clip sampled over its whole loop, measured, not looked at:
//   stretch  triangles stretched more than 2.4 times (or squashed under a third of) their rest size and by 1 cm or more: a
//            weight pulling skin. Limit 300 a case (was 120 before the puppy's own moves: running flaps the ears and
//            bends the ankles hard; looked at, r14, nothing to see). Earlier: limit 120 a case (10 Nov 2026, looked at every marked triangle of the puppy, r11): the neck
//            and chin when the head looks round, the ankles in the knee's band and the hind legs folded in sleep stretch
//            as skin does, with nothing to see; the underside lying on the ground (under 4 cm while asleep) is not counted.
//            Asleep (lying like a sphinx) the belly's sides and the folded hind legs stretch more: limit 800 for sleep,
//            after looking at its marked pictures (r11, final): no visible fault. The folded poses (sit, beg, scratch,
//            roll, sleep: hips, knees and the neck under a head held up) 900, after looking at r14's marked pictures
//   tear     background seen through the body (an enclosed hole in the silhouette, from 8 sides, above and below, and
//            level from each side) whose rim lies close together in depth (a gap between a leg and the belly is far
//            apart in depth: not a tear). Limit of this check: it sees holes right through to the background, not a tear
//            in one wall that shows the inside
//   sink     the lowest point under the ground (more than 2 cm) in any clip; float: off the ground (3 cm) in a clip that
//            stands (idle, walk, follow, sad, sleep)
//   eyes     the painted eye (its dark pupil, its white sparkles) still seen while the eyes are shut (sleep) or happy,
//            from the front, three-quarters and the side on both sides
//   mouth    the open mouth's piece more than 1.2 cm off the muzzle anywhere (it must lie on the face, not stick out)
//   flicker  the lids fighting the face for the same depth: texels in the eyes that change colour when the same moment
//            is drawn again with other near and far planes (the same picture, other depth values)
//   hat      every hat a pet can wear (js/kidplay.ts HATS) in every clip, put on as the game does (on the head bone):
//            its base more than 4 cm off the head, or the head more than 6 cm up through it
//   size     the near model over 800 KB, the far one over 400 KB
// Each fault is painted magenta on that case's picture; <out>/summary.txt lists the counts, <out>/cases.json every case.
//   cd tests; SV_URL=http://localhost:8777/ node ../tools/meshy/audit_pets.mts <out dir> [puppy,...] [quick|selftest]
// quick: three moments per clip and four sides. selftest: plants one fault of each kind on the first animal and fails
// unless every check catches its own plant (run it after any change to this file).
// (10 Nov 2026) On the Meshy puppy the tear plant is not caught: every thin part (ears, tail) lies against the body, so a
// hole cut in one shows the body behind it, not the background, and a tunnel through the trunk seen from any side has
// its rim on both walls (a gap, by the rule above). The tear check itself caught the real seams opening in sleep (r10,
// 22-59 px a case) before the weights were welded. Stretch, eyes and sink plants are caught.
import { createRequire } from 'node:module';
import { open, clear } from '../../tests/harness.mts';
const { chromium } = createRequire(new URL('../../tests/package.json', import.meta.url))('playwright');
import { writeFileSync, mkdirSync, statSync, readFileSync } from 'node:fs';
const [OUT, LIST = 'puppy', MODE = ''] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const LIMIT = { stretch: 300, tear: 6, sink: 0, float: 0, eyes: 6, hat: 0, flicker: 12, mouth: 0 };   // (tear 6: the Meshy puppy's own 4 px gap where an ear meets the cheek, in the rest pose too)
const SIZE = { near: 800, far: 400 };
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const _nc = b.newContext.bind(b); b.newContext = async (o: any) => { const c = await _nc(o); c.setDefaultNavigationTimeout(240000); c.setDefaultTimeout(600000); return c; };
// Geometry review can use the same game loader/materials without running the whole valley.
// Integration checks still use the normal game path by default.
const P = process.env.SV_MODEL_REVIEW === '1' ? await (async () => {
  const ctx = await b.newContext({ viewport: { width: 900, height: 700 } });
  const page = await ctx.newPage();
  await page.goto(new URL('/docs/meshy-farm-cloud/model-review.html', process.env.SV_URL || 'http://localhost:8777/').href);
  await page.waitForSelector('body[data-ready="true"]');
  return { ctx, page };
})() : await open(b, { w: 900, h: 700, fast: true });
await clear(P.page);
// Review tools drive their own poses/renders; stop the valley's background animation loop.
await P.page.evaluate(() => { window.requestAnimationFrame = () => 0; });
P.page.on('pageerror', e => console.log('pageerror', e.message));
const kinds = LIST.split(',');
const EYE_PROBES: Record<string, number[]> = {};
for (const k of kinds) { const a = JSON.parse(readFileSync(new URL(`./animal_joints/${k}.json`, import.meta.url), 'utf8')); if (a.auditEyeProbe) EYE_PROBES[k] = a.auditEyeProbe; }
const res: any = await P.page.evaluate(async ([kinds, MODE, LIMIT, EYE_PROBES]) => {
  const G = (window as any).__sv, MK = await import(String('/js/modelkit.js')), { THREE } = await import(String('/js/gfx.js'));
  const { clone } = await import(String('/vendor/SkeletonUtils.js')), PETS = await import(String('/js/pets.js'));
  const { PETS: PET_KINDS } = await import(String('/js/farm.js'));
  const R = G.renderer, out: any = { cases: [], pics: {} }, S = 360;
  const out_pics = (k: string, v: string) => { out.pics[k] = v; };
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
    sh.fragmentShader = 'varying float vDz;\nvarying vec3 vW;\nuniform float uPlant;\nuniform vec3 uPlantAt;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\nif (uPlant > .5 && distance(vW, uPlantAt) < .03) discard;   // (a torn tail: a hole through a thin part)\nfloat mm = clamp(vDz * 1000.0, 0.0, 65000.0);\ngl_FragColor = vec4(floor(mm / 256.0) / 255.0, mod(mm, 256.0) / 255.0, 1.0, 1.0);');
  };
  const DEBUG = { on: false, holes: [] as any[] };
  const depthAt = (px: Uint8Array, i: number) => (px[i * 4] * 256 + px[i * 4 + 1]) / 1000;
  // enclosed background in the silhouette, its rim close in depth
  const tears = (px: Uint8Array) => {
    const n = S * S, bg = new Uint8Array(n), seen = new Uint8Array(n), flags = new Uint8Array(n); let count = 0;
    for (let i = 0; i < n; i++) bg[i] = px[i * 4 + 3] ? 0 : 1;
    const st: number[] = [];
    for (let i = 0; i < S; i++) for (const j of [i, (S - 1) * S + i, i * S, i * S + S - 1]) if (bg[j] && !seen[j]) { seen[j] = 1; st.push(j); }
    while (st.length) { const j = st.pop()!, x = j % S, y = (j / S) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const u = x + dx, v = y + dy; if (u < 0 || v < 0 || u >= S || v >= S) continue; const k = v * S + u; if (bg[k] && !seen[k]) { seen[k] = 1; st.push(k); } } }
    for (let i = 0; i < n; i++) if (bg[i] && !seen[i]) {   // (a hole: its pixels and the depths round it)
      const cells: number[] = [], rim: number[] = [], rimAt: number[] = []; seen[i] = 1; st.push(i);
      while (st.length) { const j = st.pop()!; cells.push(j); const x = j % S, y = (j / S) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const u = x + dx, v = y + dy; if (u < 0 || v < 0 || u >= S || v >= S) continue; const k = v * S + u;
          if (bg[k]) { if (!seen[k]) { seen[k] = 1; st.push(k); } } else { rim.push(depthAt(px, k)); rimAt.push(k); } } }
      if (cells.length < 4 || !rim.length) continue;
      rim.sort((a, b) => a - b); const spread = rim[Math.floor(rim.length * .9)] - rim[Math.floor(rim.length * .1)];
      if (DEBUG.on) DEBUG.holes.push([cells.length, +spread.toFixed(3), +rim[0].toFixed(3), +rim[rim.length - 1].toFixed(3)]);
      // (the gap between two parts, a leg in front of the belly or an ear beside the cheek, has its near rim on one side
      // only; a hole in a surface, even right through the trunk to the far wall, has its near rim nearly all round)
      if (spread > .03) { let cx = 0, cy = 0; for (const c of cells) { cx += c % S; cy += (c / S) | 0; } cx /= cells.length; cy /= cells.length;
        const near = rim[0] + .03, bins = new Set<number>();
        for (let q = 0; q < rimAt.length; q++) { const k = rimAt[q]; if (depthAt(px, k) > near) continue; bins.add(Math.floor(((Math.atan2(((k / S) | 0) - cy, k % S - cx) + Math.PI) / (Math.PI * 2)) * 12) % 12); }
        if (bins.size < 10) continue; }
      count += cells.length; for (const c of cells) flags[c] = 1;
    }
    return { count, flags };
  };
  const _v = new THREE.Vector3(), _w = new THREE.Vector3();
  const skinned = (m: any, outArr: Float32Array) => { const pos = m.geometry.attributes.position; let top = m; while (top.parent) top = top.parent; top.updateMatrixWorld(true); m.skeleton.update();   // (the bones' world matrices first, then the bone matrices: both are otherwise only updated when drawn)
    for (let i = 0; i < pos.count; i++) { _v.fromBufferAttribute(pos, i); (m.applyBoneTransform || m.boneTransform).call(m, i, _v); _v.applyMatrix4(m.matrixWorld); outArr[i * 3] = _v.x; outArr[i * 3 + 1] = _v.y; outArr[i * 3 + 2] = _v.z; } };
  for (const kind of kinds) for (const lod of ['near', 'far']) {
    const name = 'creature-' + kind + (lod === 'near' ? '-hd' : ''), t = await MK.loadWorldModel(name);
    if (!t) { out.cases.push({ kind, lod, clip: '-', missing: 1 }); continue; }
    const obj = clone(t.scene); scene.add(obj); obj.updateMatrixWorld(true); obj.traverse((o: any) => { if (o.isSkinnedMesh) o.frustumCulled = false; });   // (as js/modelkit.ts: a skinned piece's box is its rest pose)
    const body = (() => { let best: any = null; obj.traverse((o: any) => { if (o.isSkinnedMesh && /^meshy-/.test(o.material.name) && !/-(shut|joy)\d$/.test(o.material.name) && (!best || o.geometry.attributes.position.count > best.geometry.attributes.position.count)) best = o; }); return best; })();
    if (!body) { out.cases.push({ kind, lod, clip: '-', plant: 'none', notMeshy: 1 }); scene.remove(obj); continue; }   // (not a Meshy model: Sparkle's far one is still the Blender one)
    const bone = (n: string) => obj.getObjectByName(n);
    const mixer = new THREE.AnimationMixer(obj);
    const idx = body.geometry.index.array, nv = body.geometry.attributes.position.count;
    const rest = new Float32Array(nv * 3), now = new Float32Array(nv * 3);
    // (the rest pose: the bones as loaded; skeleton.pose() rebuilds them from the inverse bind matrices, which gltfpack's
    // quantized positions turn into whole-number units)
    const REST = body.skeleton.bones.map((b: any) => [b.position.clone(), b.quaternion.clone(), b.scale.clone()]);
    const toRest = () => body.skeleton.bones.forEach((b: any, i: number) => { b.position.copy(REST[i][0]); b.quaternion.copy(REST[i][1]); b.scale.copy(REST[i][2]); });
    skinned(body, rest);
    // Patterned fur can be as black as a pupil. Probe actual eye-surface visibility instead:
    // closed lid meshes must occlude the original eye surface, independent of coat colour.
    const probe = EYE_PROBES[kind]; let eyeMask: any = null; let probeCenters: any[] = [];
    if (probe) {
      const eyes = [bone('shut0'), bone('shut1')].map(e => e.getWorldPosition(new THREE.Vector3()));
      probeCenters = eyes;
      const colors = new Float32Array(nv * 3);
      for (let i = 0; i < nv; i++) for (const e of eyes) {
        const dx = (rest[i * 3] - e.x) / probe[0], dy = (rest[i * 3 + 1] - e.y) / probe[1];
        if (dx * dx + dy * dy <= 1 && Math.abs(rest[i * 3 + 2] - e.z) < probe[2]) colors[i * 3] = 1;
      }
      if (!colors.some(v => v > 0)) throw new Error('Eye probe misses the anatomical eye');
      eyeMask = new THREE.BufferAttribute(rest.slice(), 3);
    }

    let lo = 1e9, hi = -1e9; for (let i = 1; i < rest.length; i += 3) { lo = Math.min(lo, rest[i]); hi = Math.max(hi, rest[i]); }
    const Hh = hi - lo, c0 = new THREE.Box3().setFromBufferAttribute(new THREE.BufferAttribute(rest, 3)).getCenter(new THREE.Vector3());
    const restLen = new Float32Array(idx.length);
    const elen = (a: Float32Array, i: number, j: number) => Math.hypot(a[i * 3] - a[j * 3], a[i * 3 + 1] - a[j * 3 + 1], a[i * 3 + 2] - a[j * 3 + 2]);
    for (let k = 0; k < idx.length; k += 3) for (let e = 0; e < 3; e++) restLen[k + e] = elen(rest, idx[k + e], idx[k + (e + 1) % 3]);
    const clips = t.clips.map((c: any) => c.name);
    const views: [string, number, number][] = (quick ? [['front', 0, .1], ['side', Math.PI / 2, .1], ['back', Math.PI, .1], ['tq', .8, .3]] as [string, number, number][]
      : [...[0, 1, 2, 3, 4, 5, 6, 7].map(k => ['y' + k * 45, k * Math.PI / 4, .12] as [string, number, number]), ['above', .3, 2.5], ['below', .3, -2.5]] as [string, number, number][])
      .concat([['levelR', Math.PI / 2, 0], ['levelL', -Math.PI / 2, 0]]);   // (level from each side too: a hole right through the trunk, seen a little from above, has a rim on both of its walls, far apart in depth, and reads as a gap)
    const plants = self ? (kind === kinds[0] && lod === 'near' ? ['stretch', 'tear', 'eyes', 'sink', 'mouth'] : []) : ['none'];   // (selftest: the plants only)
    for (const plant of plants) for (const clip of (plant === 'none' ? clips : plant === 'eyes' ? ['sleep'] : plant === 'mouth' ? ['wag'] : ['idle'])) {
      const c = t.clips.find((x: any) => x.name === clip); mixer.stopAllAction(); const a = mixer.clipAction(c); a.reset().play();
      const moments = quick || plant !== 'none' ? [.15, .5, .85] : [0, .17, .33, .5, .67, .83];
      for (const f of moments) {
        mixer.setTime(c.duration * f); obj.position.set(0, 0, 0); obj.updateMatrixWorld(true);
        if (plant === 'stretch') { bone('knee0').scale.setScalar(2.6); obj.updateMatrixWorld(true); }
        if (plant === 'sink') { bone('body').position.y -= Hh * .08; obj.updateMatrixWorld(true); }
        if (plant === 'mouth' && bone('jaw')) { bone('jaw').scale.multiplyScalar(2.5); bone('jaw').position.z += Hh * .02; obj.updateMatrixWorld(true); }   // (an open mouth too big for the face, standing off it)
        const hidden: any[] = []; if (plant === 'eyes') obj.traverse((o: any) => { if (o.isMesh && /-(shut|joy)\d$/.test(o.material.name)) { o.visible = false; hidden.push(o); } });
        PLANT.value = plant === 'tear' ? 1 : 0; if (plant === 'tear') {   // (a torn ear: a hole through its flap where it hangs out beyond the cheek, seen from the front)
          const e = bone('ear0'); obj.updateMatrixWorld(true); e.getWorldPosition(PLANTAT.value); PLANTAT.value.x += Math.sign(PLANTAT.value.x || -1) * Hh * .07; PLANTAT.value.y -= Hh * .12; }
        const cs: any = { kind, lod, clip, t: +f.toFixed(2), plant, stretch: 0, tear: 0, sink: 0, float: 0, eyes: 0, hat: 0, flicker: 0, mouth: 0, worst: '' };
        // stretch and the ground
        skinned(body, now); let minY = 1e9; const strK: number[] = [];
        for (let i = 1; i < now.length; i += 3) minY = Math.min(minY, now[i]);
        for (let k = 0; k < idx.length; k += 3) { let worst = 1;
          for (let e = 0; e < 3; e++) { const r0 = restLen[k + e]; if (r0 < 1e-5) continue; const l1 = elen(now, idx[k + e], idx[k + (e + 1) % 3]), r = l1 / r0;
            if (Math.abs(l1 - r0) < .01) continue;   // (a sliver of fur a few mm long, stretched, cannot be seen: only 1 cm or more counts)
            worst = Math.max(worst, r, 1 / Math.max(r, 1e-3)); }
          if (worst > 2.4 && !(clip === 'sleep' && (now[idx[k] * 3 + 1] + now[idx[k + 1] * 3 + 1] + now[idx[k + 2] * 3 + 1]) / 3 - lo < .04)) { cs.stretch++; if (strK.length < 4000) strK.push(k); } }
        const ground = minY - lo;   // (the model stands on y 0 at rest)
        const flies = ['dragon', 'firefly'].includes(kind);   // (a companion flies: no ground to stand on)
        if (!flies && ground < -.02) cs.sink = Math.round(-ground * 1000);
        if (!flies && ['idle', 'walk', 'follow', 'sad', 'sleep'].includes(clip) && ground > .03) cs.float = Math.round(ground * 1000);
        // tears from every side (the silhouette in depth colours)
        const box = new THREE.Box3().setFromObject(obj, true), cc = box.getCenter(new THREE.Vector3()), r = box.getSize(new THREE.Vector3()).length();
        let worstPic: any = null;
        for (const [vn, yaw, up] of views) {
          const cam = new THREE.PerspectiveCamera(30, 1, .02, 50), dir = new THREE.Vector3(Math.sin(yaw), up, Math.cos(yaw)).normalize();
          cam.position.copy(cc).addScaledVector(dir, r * 1.9); cam.lookAt(cc);
          DEBUG.on = plant === 'tear'; DEBUG.holes = [];
          const d = read(cam, depthMat), tr = tears(d);
          if (DEBUG.on) (cs.holes = cs.holes || {})[vn] = DEBUG.holes.slice(0, 4);
          if (DEBUG.on) { cs.plantAt = PLANTAT.value.toArray().map((v: number) => +v.toFixed(3)); cs.c0 = c0.toArray().map((v: number) => +v.toFixed(3)); cs.box = [new THREE.Box3().setFromObject(obj, true).min.toArray().map((v: number) => +v.toFixed(2)), new THREE.Box3().setFromObject(obj, true).max.toArray().map((v: number) => +v.toFixed(2))]; }
          if (tr.count > cs.tear) { cs.tear = tr.count; cs.worst = vn; worstPic = { cam, flags: tr.flags }; }
        }
        // (owner, 11 Nov 2026: "có thử khi há miệng chưa") the open mouth lies on the muzzle: no point of its piece more
        // than 1.2 cm off the face (a piece set into the face stuck out of both cheeks)
        const jb = bone('jaw');
        if (jb && jb.getWorldScale(_w).x > .3) { let mm: any = null; obj.traverse((o: any) => { if (o.isSkinnedMesh && /-mouth$/.test(o.material.name)) mm = o; });
          if (mm) { const mp = new Float32Array(mm.geometry.attributes.position.count * 3); skinned(mm, mp); const jp = jb.getWorldPosition(new THREE.Vector3()), near: number[] = [];
            for (let k = 0; k < nv; k++) if (Math.hypot(now[k * 3] - jp.x, now[k * 3 + 1] - jp.y, now[k * 3 + 2] - jp.z) < .1) near.push(k);
            // (the distance to the face's own triangles: Meshy's muzzle has big ones, so a point lying on it can be 2 cm from
            // every corner; only a point outside the face, above it, counts)
            const nearSet = new Set(near), tris: number[] = [];
            for (let k = 0; k < idx.length; k += 3) if (nearSet.has(idx[k]) && nearSet.has(idx[k + 1]) && nearSet.has(idx[k + 2])) tris.push(k);
            const A = new THREE.Vector3(), Bv = new THREE.Vector3(), Cv = new THREE.Vector3(), Pm = new THREE.Vector3(), tri = new THREE.Triangle(), cp = new THREE.Vector3(), nn = new THREE.Vector3();
            for (let q = 0; q < mp.length; q += 3) { Pm.set(mp[q], mp[q + 1], mp[q + 2]); let dmin = 1e9, above = 0;
              for (const k of tris) { const a = idx[k] * 3, b = idx[k + 1] * 3, c2 = idx[k + 2] * 3; A.set(now[a], now[a + 1], now[a + 2]); Bv.set(now[b], now[b + 1], now[b + 2]); Cv.set(now[c2], now[c2 + 1], now[c2 + 2]);
                tri.set(A, Bv, Cv); tri.closestPointToPoint(Pm, cp); const d = cp.distanceTo(Pm); if (d < dmin) { dmin = d; tri.getNormal(nn); above = Pm.clone().sub(cp).dot(nn); } }
              if (dmin > .012 && Math.abs(above) > .012) cs.mouth++; } } }
        // the eyes, while shut or happy: dark pupils or white sparkles where the eyes are
        const s0 = bone('shut0'), s1 = bone('shut1');
        const shutOn = s0 && (s0.getWorldScale(_w).x > .5 || bone('joy0').getWorldScale(_w).x > .5);
        if (s0 && s1 && shutOn) {
          const e0 = s0.getWorldPosition(new THREE.Vector3()), e1 = s1.getWorldPosition(new THREE.Vector3()), mid = e0.clone().add(e1).multiplyScalar(.5), er = e0.distanceTo(e1) * .36;
          const hb = bone('head'), fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(hb.getWorldQuaternion(new THREE.Quaternion())); fwd.y = 0; fwd.normalize();
          // (owner, 10 Nov 2026: "kiểm tra cho hết") from the front, three-quarters and the side on both sides (at a slant
          // only the eye nearer the camera), and flicker: the same moment drawn again with the camera's near and far planes
          // moved (the picture stays, the depth values change), the lids and the face fighting for the same depth show as
          // texels in the eyes changing colour
          const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
          const disc = (cam: any, e: any, fn: (i: number, x: number, y: number) => void) => { const p = e.clone().project(cam), q = e.clone().add(new THREE.Vector3(er, 0, 0).applyQuaternion(cam.quaternion)).project(cam);
            const cx = (p.x + 1) / 2 * S, cy = (p.y + 1) / 2 * S, rr = Math.abs(q.x - p.x) / 2 * S;
            for (let y = Math.max(0, Math.floor(cy - rr)); y < Math.min(S, cy + rr); y++) for (let x = Math.max(0, Math.floor(cx - rr)); x < Math.min(S, cx + rr); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= rr * rr) fn((y * S + x) * 4, x, y); };
          for (const yaw of [0, .7, -.7, 1.2, -1.2]) {
            const dir = fwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw), cam = new THREE.PerspectiveCamera(30, 1, .01, 20);
            cam.position.copy(mid).addScaledVector(dir, er * 9); cam.lookAt(mid); cam.updateMatrixWorld(true);
            const px = read(cam), flags = new Uint8Array(S * S); let n = 0;
            const eyes = yaw === 0 ? [e0, e1] : [e0.distanceTo(cam.position) < e1.distanceTo(cam.position) ? e0 : e1];
            if (eyeMask) {
              const materials: any[] = [], oldColor = body.geometry.getAttribute('color');
              const black = new THREE.MeshBasicMaterial({color: 0, side: THREE.DoubleSide});
              const mask = new THREE.MeshBasicMaterial({vertexColors: true, side: THREE.DoubleSide});
              // Interpolate reference positions, then test the oval per fragment.
              // Boolean vertex colours spill the probe across coarse face triangles.
              mask.onBeforeCompile = (sh: any) => {
                sh.uniforms.svProbe0={value:probeCenters[0]}; sh.uniforms.svProbe1={value:probeCenters[1]};
                sh.uniforms.svProbeRadius={value:new THREE.Vector3(...probe)};
                sh.fragmentShader='uniform vec3 svProbe0; uniform vec3 svProbe1; uniform vec3 svProbeRadius;\n'+sh.fragmentShader;
                sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
                  vec3 svD0=(vColor.xyz-svProbe0)/svProbeRadius;
                  vec3 svD1=(vColor.xyz-svProbe1)/svProbeRadius;
                  bool svEye=(dot(svD0.xy,svD0.xy)<1.0 && abs(svD0.z)<1.0) || (dot(svD1.xy,svD1.xy)<1.0 && abs(svD1.z)<1.0);
                  diffuseColor.rgb=svEye?vec3(1.0,0.0,0.0):vec3(0.0);`);
              };

              const alphaMasks: any[] = [];
              obj.traverse((m: any) => { if (m.isMesh) { materials.push([m,m.material]);
                if ((m.material.transparent && m.material.map) || m.material.polygonOffset) {
                  const original=m.material;
                  const a = new THREE.MeshBasicMaterial({color:0,map:original.transparent?original.map:null,alphaTest:original.transparent?.95:0,side:original.side,
                    polygonOffset:original.polygonOffset,polygonOffsetFactor:original.polygonOffsetFactor,polygonOffsetUnits:original.polygonOffsetUnits});
                  alphaMasks.push(a);m.material=a;
                } else m.material=black;
              } });
              body.geometry.setAttribute('color', eyeMask); body.material = mask;
              const visibleEye = read(cam);
              for (const e of eyes) disc(cam,e,(i,x,y) => { if (visibleEye[i] > 128 && visibleEye[i+1] < 20) { n++; flags[y*S+x]=1; } });
              if (oldColor) body.geometry.setAttribute('color',oldColor); else body.geometry.deleteAttribute('color');
              for (const [m,mat] of materials) m.material=mat;
              black.dispose(); mask.dispose(); alphaMasks.forEach(m => m.dispose());
            } else for (const e of eyes) disc(cam, e, (i, x, y) => { if (!px[i + 3]) return;
              const L = (.3 * px[i] + .59 * px[i + 1] + .11 * px[i + 2]) / 255, sat = Math.max(px[i], px[i + 1], px[i + 2]) - Math.min(px[i], px[i + 1], px[i + 2]);
              if (L < .012 || (L > .8 && sat < 25)) { n++; flags[y * S + x] = 1; } });   // (linear light: .012 is the pupil's near-black)
            if (n > cs.eyes) { cs.eyes = n; cs.eyesAt = yaw; }
            if (n > (LIMIT as any).eyes) out.pics[`${kind}-${lod}-${clip}-${cs.t}-${plant}-eyes-${yaw}`] = png(px, flags);
            const cam2 = cam.clone(); cam2.near = .013; cam2.far = 23; cam2.updateProjectionMatrix(); cam2.updateMatrixWorld(true);   // (the same picture, the depth spread differently: only depth fights change)
            const px2 = read(cam2), fl2 = new Uint8Array(S * S); let fk = 0;
            for (const e of eyes) disc(cam, e, (i, x, y) => { if (!px[i + 3] || !px2[i + 3]) return; const d = Math.abs(px[i] - px2[i]) + Math.abs(px[i + 1] - px2[i + 1]) + Math.abs(px[i + 2] - px2[i + 2]);
              if (d > 90) { fk++; fl2[y * S + x] = 1; } });
            if (fk > (cs.flicker || 0)) cs.flicker = fk;
            if (fk > (LIMIT as any).flicker) out.pics[`${kind}-${lod}-${clip}-${cs.t}-${plant}-flicker-${yaw}`] = png(px, fl2);
          }
        }
        hidden.forEach(o => { o.visible = true; });
        if (plant === 'tear' && !worstPic) { const cam = new THREE.PerspectiveCamera(30, 1, .02, 50); cam.position.copy(cc).add(new THREE.Vector3(r * 1.9, 0, 0)); cam.lookAt(cc); out.pics[`${kind}-${lod}-${clip}-${cs.t}-plant-tear-none`] = png(read(cam, depthMat), null); }
        if (worstPic && (cs.tear > (LIMIT as any).tear || plant === 'tear')) { const px = read(worstPic.cam); out.pics[`${kind}-${lod}-${clip}-${cs.t}-${plant}-tear-${cs.worst}`] = png(px, worstPic.flags); }
        if (cs.stretch > (LIMIT as any).stretch && !out.pics[`${kind}-${lod}-${clip}-stretch`]) {
          // (the stretched triangles' middles painted magenta, from the side they face most, so each one can be looked at)
          const flags = new Uint8Array(S * S), cam = new THREE.PerspectiveCamera(30, 1, .02, 50);
          let mx = 0, mz = 0; for (const k of strK) { const a = idx[k] * 3; mx += now[a] - cc.x; mz += now[a + 2] - cc.z; }
          const yaw = Math.atan2(mx, mz); cam.position.copy(cc).add(new THREE.Vector3(Math.sin(yaw) * r * 1.6, r * .3, Math.cos(yaw) * r * 1.6)); cam.lookAt(cc); cam.updateMatrixWorld(true);
          const pv = new THREE.Vector3();
          for (const k of strK) { pv.set(0, 0, 0); for (let e = 0; e < 3; e++) { const a = idx[k + e] * 3; pv.x += now[a] / 3; pv.y += now[a + 1] / 3; pv.z += now[a + 2] / 3; }
            pv.project(cam); const x = Math.round((pv.x + 1) / 2 * S), y = Math.round((pv.y + 1) / 2 * S);
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const u = x + dx, v = y + dy; if (u >= 0 && v >= 0 && u < S && v < S) flags[v * S + u] = 1; } }
          out.pics[`${kind}-${lod}-${clip}-${cs.t}-${plant}-stretch`] = png(read(cam), flags); }
        if (plant === 'stretch') bone('knee0').scale.setScalar(1);
        out.cases.push(cs);
      }
    }
    // the hats (owner, 10 Nov 2026: "accessories ... thử lên chưa", then "mũ phải nudge fit"): every hat a pet can wear
    // (js/kidplay.ts HATS), put on as the game puts it (js/pets.ts putHat, hatFit: on the head bone, its band round the
    // skull), in every clip, near and far. Measured against the head's height hH (its points wholly the head's):
    //   floating: the skull under the hat's middle more than 6 % of hH below its base
    //   loose:    more than 4 of 16 points round its band outside the head and farther than 8 % of hH from it (horns count)
    //   poke:     a closed hat (party, nón lá, beanie, captain, wizard) with the head out through the middle of its top
    if ((kind in PET_KINDS || ['dragon', 'firefly'].includes(kind) || self) && (!self || (kind === kinds[0] && lod === 'near'))) {   // (selftest: one hat lifted off the head must be caught)
      const KP = await import(String('/js/kidplay.js')), holder = new THREE.Group(); scene.add(holder); scene.remove(obj); holder.add(obj);
      holder.userData.rig = { model: { obj } };
      for (let i = 0; i < 100 && !PETS.putHat(holder, 'party'); i++) await new Promise(r => setTimeout(r, 200));   // (the hats' drawings load on first use: wait for them)
      const hb = bone('head'), hIdx = body.skeleton.bones.indexOf(hb), si = body.geometry.attributes.skinIndex, sw = body.geometry.attributes.skinWeight, skull: number[] = [];
      const onHead: number[] = [];   // (every point the head carries at all: its horns and crest too, for the band's distance)
      for (let k = 0; k < nv; k++) for (let q = 0; q < 4; q++) if (si.getComponent(k, q) === hIdx && sw.getComponent(k, q) > .3) { onHead.push(k); if (sw.getComponent(k, q) > .8) skull.push(k); break; }
      let sy0 = 1e9, sy1 = -1e9; for (const k of skull) { sy0 = Math.min(sy0, rest[k * 3 + 1]); sy1 = Math.max(sy1, rest[k * 3 + 1]); } const hH = sy1 - sy0;
      const B = new THREE.Vector3(), U = new THREE.Vector3(), v = new THREE.Vector3(), q4 = new THREE.Quaternion();
      const CLOSED = ['party', 'nonla', 'beanie', 'captain', 'wizard'];
      for (const H of (self ? KP.HATS.filter((x: any) => x.id === 'beanie') : KP.HATS)) {
        const F = PETS.HAT_FIT[H.id] || { band: .08 }; let worst = 0, worstAt = '', loose = 0, floatMax = 0, poke = 0, measured = 0;
        for (const clip of (self ? ['idle'] : clips)) {
          const c = t.clips.find((x: any) => x.name === clip); mixer.stopAllAction(); mixer.clipAction(c).reset().play();
          for (const f of quick || self ? [.5] : [.2, .5, .8]) {
            mixer.setTime(c.duration * f); holder.updateMatrixWorld(true);
            const hat: any = PETS.putHat(holder, H.id); if (!hat) continue; if (self) hat.position.y += hH * .4 / Math.max(1e-4, hb.getWorldScale(new THREE.Vector3()).x); holder.updateMatrixWorld(true);
            measured++; skinned(body, now); hat.getWorldPosition(B); hat.getWorldQuaternion(q4); U.set(0, 1, 0).applyQuaternion(q4);
            const hs = hat.getWorldScale(new THREE.Vector3()).x, band = F.band * hs, hatTop = (() => { const g = hat.children[0].geometry; g.computeBoundingBox(); return g.boundingBox.max.y * hs; })();   // (in the hat's own frame: a world box grows when the hat tips over)
            let top = -1e9, out = 0;
            for (const k of skull) { v.set(now[k * 3], now[k * 3 + 1], now[k * 3 + 2]).sub(B); const along = v.dot(U); const across = v.addScaledVector(U, -along).length();
              if (across < band * .5) top = Math.max(top, along); if (across < band * .35 && along > hatTop * .92) out++; }   // (through the hat's middle: Sparkle's antennae come out at its sides, looked at 11 Nov 2026)
            const rim = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(a => hat.localToWorld(new THREE.Vector3(Math.cos(a / 16 * Math.PI * 2) * F.band, 0, Math.sin(a / 16 * Math.PI * 2) * F.band)));
            // (only a band point outside the head counts: one sunk into it, where the head is longer than wide, is snug;
            // the distance is to every point the head carries, its horns too)
            const hcw = new THREE.Vector3(); for (const k of skull) hcw.add(v.set(now[k * 3], now[k * 3 + 1], now[k * 3 + 2])); hcw.multiplyScalar(1 / Math.max(1, skull.length));
            let far = 0; for (const p of rim) { let dmin = 1e9, kb = -1; for (const k of onHead) { const d = Math.hypot(now[k * 3] - p.x, now[k * 3 + 1] - p.y, now[k * 3 + 2] - p.z); if (d < dmin) { dmin = d; kb = k; } }
              const outside = kb >= 0 && p.distanceTo(hcw) > Math.hypot(now[kb * 3] - hcw.x, now[kb * 3 + 1] - hcw.y, now[kb * 3 + 2] - hcw.z); if (dmin > hH * .08 && outside) far++; }
            const fl = top < -hH * .06 ? Math.round(-top * 1000) : 0, pk = CLOSED.includes(H.id) && out > 3 ? out : 0, ls = far > 4 ? far : 0;
            floatMax = Math.max(floatMax, fl); poke = Math.max(poke, pk); loose = Math.max(loose, ls);
            if (H.id === 'crown') ((window as any).__dbgHat = (window as any).__dbgHat || []).push([kind, lod, clip, f, +top.toFixed(3), far, B.toArray().map((x: number) => +x.toFixed(3)), U.toArray().map((x: number) => +x.toFixed(2))]);
            const fault = fl + pk + ls * 10; if (fault > worst) { worst = fault; worstAt = `${clip}@${f}` + (fl ? ` floating ${fl} mm` : '') + (pk ? ` head through ${pk} pts` : '') + (ls ? ` loose ${far}/16` : ''); }
            if (f === .5 && lod === 'near' && ['idle', 'sad', 'sleep', 'roll', 'run', 'cheer'].includes(clip)) {
              const bx = new THREE.Box3().setFromObject(holder, true), cc = bx.getCenter(new THREE.Vector3()), r = bx.getSize(new THREE.Vector3()).length();
              const cam = new THREE.PerspectiveCamera(30, 1, .02, 50); cam.position.copy(cc).add(new THREE.Vector3(r * .9, r * .45, r * 1.3)); cam.lookAt(cc);
              out_pics(`${kind}-hat-${H.id}-${clip}`, png(read(cam), null)); }
            if (f === .5 && lod === 'near' && clip === 'idle') for (const [nm, yaw] of [['front', 0], ['side', Math.PI / 2], ['back', Math.PI]] as [string, number][]) {
              const hc = new THREE.Box3().setFromObject(hat).getCenter(new THREE.Vector3()), cam = new THREE.PerspectiveCamera(30, 1, .01, 20);
              cam.position.copy(hc).add(new THREE.Vector3(Math.sin(yaw) * hH * 4.2, hH * .6, Math.cos(yaw) * hH * 4.2)); cam.lookAt(hc.clone().addScaledVector(U, -hH * .3));
              out_pics(`${kind}-hatclose-${H.id}-${nm}`, png(read(cam), null)); }
          }
        }
        if (!measured) { worst = 9999; worstAt = 'the hat was never put on: nothing measured'; }   // (a check that measured nothing has not passed)
        out.cases.push({ kind, lod, clip: 'hat:' + H.id, t: 0, plant: self ? 'hat' : 'none', stretch: 0, tear: 0, sink: 0, float: 0, eyes: 0, hat: worst, worst: worstAt, hatFloat: floatMax, hatPoke: poke, hatLoose: loose });
      }
      PETS.putHat(holder, null); scene.remove(holder);
    } else scene.remove(obj);
  }
  out.dbgHat = (window as any).__dbgHat;
  return out;
}, [kinds, MODE, LIMIT, EYE_PROBES] as any);
if (res.dbgHat) writeFileSync(`${OUT}/dbg-hat.json`, JSON.stringify(res.dbgHat));
for (const [k, v] of Object.entries(res.pics)) writeFileSync(`${OUT}/${k}.png`, Buffer.from(String(v).split(',')[1], 'base64'));
const cs = res.cases, keys = Object.keys(LIMIT);
const real = cs.filter((c: any) => c.plant === 'none');
const FOLDED = ['sleep', 'sit', 'beg', 'scratch', 'roll'];
// (an animal's own limits, with the reason, in tools/meshy/animal_joints/<kind>.json "audit": only after looking at
// its marked pictures; e.g. Sparkle's thin legs show the background between them and the body, which is not a tear)
const OWN: Record<string, any> = {};
for (const k of kinds) { try { OWN[k] = JSON.parse(readFileSync(new URL(`./animal_joints/${k}.json`, import.meta.url), 'utf8')).audit || {}; } catch { OWN[k] = {}; } }
// (a hat only loose within the animal's own allowance, neither floating nor through the head, passes: the dragon's head is
// egg-shaped, so a round band sits close in front and a little off it at the back, hidden under the band. (13 Nov 2026) A
// "head through" within the animal's own hatPoke passes too: the bunny's long ears stand up through the closed hats, and
// in cheer and beg the bottom of the ears, partly the head's, rises through the middle of the top; never a floating hat)
const val = (c: any, k: string) => { const O = OWN[c.kind] || {};
  return k === 'hat' && (O.hatLoose != null || O.hatPoke != null) && !c.hatFloat && (c.hatPoke || 0) <= (O.hatPoke || 0) && (c.hatLoose || 0) <= (O.hatLoose || 0) ? 0 : c[k]; };
const lim = (c: any, k: string) => (OWN[c.kind] && OWN[c.kind][k] != null) ? OWN[c.kind][k] : k === 'stretch' && FOLDED.includes(c.clip) ? 900 : LIMIT[k];
const fail = real.filter((c: any) => keys.some(k => val(c, k) > lim(c, k)) || c.missing);
const lines = [`pets audit ${new Intl.DateTimeFormat('en-AU', {dateStyle:'short', timeStyle:'long', timeZone:'Australia/Sydney'}).format(new Date())} cases ${real.length} failing ${fail.length}`];
for (const k of keys) lines.push(`${k}: ${real.filter((c: any) => val(c, k) > lim(c, k)).length} cases over ${LIMIT[k]}${k === 'stretch' ? ' (folded poses 900)' : ''}, worst ${Math.max(0, ...real.map((c: any) => c[k] || 0))}`);
for (const kind of kinds) for (const lod of ['near', 'far']) {
  const f = `../models/world/creature-${kind}${lod === 'near' ? '-hd' : ''}.glb`; let kb = 0; try { kb = Math.round(statSync(f).size / 1024); } catch { }
  lines.push(`size ${kind} ${lod}: ${kb} KB (limit ${SIZE[lod]})${kb > SIZE[lod] || !kb ? '  OVER' : ''}`);
  const ff = fail.filter((c: any) => c.kind === kind && c.lod === lod);
  if (ff.length) lines.push(`${kind} ${lod}: ` + ff.map((c: any) => `${c.clip}@${c.t} ` + keys.filter(k => val(c, k) > lim(c, k)).map(k => `${k} ${c[k]}`).join(' ')).join('; '));
}
if (MODE === 'selftest') {
  const caught = (p: string, k: string) => cs.some((c: any) => c.plant === p && c[k] > LIMIT[k]);
  const r = { stretch: caught('stretch', 'stretch'), tear: caught('tear', 'tear'), eyes: caught('eyes', 'eyes'), sink: caught('sink', 'sink'), hat: caught('hat', 'hat'), mouth: caught('mouth', 'mouth') };
  lines.push('selftest ' + Object.entries(r).map(([k, v]) => `${k} ${v ? 'caught' : 'MISSED'}`).join(', '));
  if (Object.values(r).some(v => !v)) process.exitCode = 3;
}
writeFileSync(`${OUT}/summary.txt`, lines.join('\n') + '\n'); writeFileSync(`${OUT}/cases.json`, JSON.stringify(cs));
console.log(lines.join('\n'));
if (fail.length && !process.exitCode) process.exitCode = 2;
await b.close();
