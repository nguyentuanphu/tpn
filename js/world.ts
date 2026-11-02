// The open world: terrain, water, sky with day and night, trees, the Lotus Village,
// shrines, towers, hidden Leafies and everything you can walk up to and use.
// (v1.07, owner 2 Nov 2026 AEDT) the parts of the world live in js/world/; this file builds it (createWorld) and
// re-exports every name it always exported, so no import elsewhere changes.
import { pushOutOfSolids } from './solids.js';
import { THREE, sprite, toonSmooth, merge, P, toonVC, toon, glow, blobShadow } from './gfx.js';
import { seeded, lerp, smooth, clamp, fbm, dist2 } from './util.js';
import { T } from './i18n.js';
import { houseVillage } from './houses.js';
import { settings } from './state.js';
import { keptFloats, rememberFloats } from './worldmemo.js';
import * as MAP from './content/map.js';
import { APOSTLES, BAMBOO, BRIDGES, CHINA, FESTGROUNDS, FLATS, HALF, HOME, INDIA, LAKE, LOTS, MTN, PADDIES, PLATEAU, RIDE_SWIM, SIZE, VILLAGE, WATER, bridgeAt, bridgeBox } from './world/places.js';
import { edgeDist, heightAt, riverDist, roadDist, setGround } from './world/ground.js';
import { LEAFIES, SHRINES, TOWERS, TOWER_H } from './world/sites.js';

export { MAP_VERSION, STUDIO_ON_MAP, PARKED, SIZE, HALF, WATER, RIDE_SWIM, PLATEAU, VILLAGE, PADDIES, LAKE, BAMBOO, APOSTLES, ULURU, HOIAN, ISLAND, FESTGROUNDS, HOME, PLAYGROUND, TOWN, MARKET, AUSSIE, CITIES, levelAt, LOTS, YARD, FOOTPRINTS, RIVERS, PONDS, pondDist, RIVER, CHINA, INDIA, BRIDGES, BRIDGE, DRAGON, bridgeAlong, bridgeAcross, bridgeAt, bridgeDist, bridgeBox } from './world/places.js';
export type { SvCity, SvBridge, SvRoad } from './world/places.js';
export { ROADS, edgeDist, roadDist, riverDist, waterAt, waterDist, setRoadBeds, heightAt, surfaceAt, oldHeightAt } from './world/ground.js';
export { regionAt, REGION_NAMES, SHRINES, TOWERS, TOWER_H, REVEAL_R, LEAFIES, PLOTS, MEMORY, plotBox } from './world/sites.js';
export { paintWater, paintWaterRows, paintMap, paintMapRows } from './world/paint.js';
export { levelUnderBuildings, widenFlatLand, roadBedsOn } from './world/reshape.js';

export function createWorld(scene, quality) {
  // Generate the legacy housing/garden lots above on the original terrain first: saved home/plot IDs must not shift.
  // Then build the rendered terrain and all placed objects on the district's level heritage grounds.
  setGround('HERITAGE_GROUNDS_ON', true);
  const wParts = {
    colliders: [], boxes: [], platforms: [], stalls: [], walks: [], houses: [], plants: [], overcast: 0, interactables: [], updaters: [], lanterns: [], shrineMeshes: {}, towerMeshes: {}, leafyMeshes: {},
    time: .36
  };
  // (TypeScript, r86) what the valley's object gets after it is made: here, and by js/solids.js, js/roads.js, js/main.ts…
  type SvRideAnimal = { id: string, kind: string, swims: boolean, mesh: THREE.Mesh, shadow: THREE.Object3D, firstPersonHide?: THREE.Object3D[], home: number[], tx: number, tz: number, rider: unknown, yaw: number, back?: boolean };
  type SvWorldMore = { underpassSolid?: Uint8Array, fronts?: { x: number, z: number, rot: number, d: number, kind: string }[], terrain?: THREE.Mesh, groundCover?: THREE.InstancedMesh[], critters?: unknown, fireflies?: unknown, buffalo?: SvRideAnimal[], cows?: SvRideAnimal[], rideAnimals?: SvRideAnimal[],
    pots?: { x: number, z: number, [k: string]: unknown }[], statue?: { x: number, z: number, [k: string]: unknown },
    groundAt?: (x: number, z: number, y?: number) => number, platformAt?: (x: number, z: number, y?: number) => unknown, collide?: (pos: { x: number, y?: number, z: number }, r?: number) => unknown,
    update?: (dt: number, t: number) => void, updateSky?: (dt: number, camPos: THREE.Vector3, focus?: THREE.Vector3) => void, isNight?: () => boolean,
    waterMap?: (cv: HTMLCanvasElement) => void, setShrineDone?: (id: string, done: boolean) => void, setTowerDone?: (id: string, done: boolean) => void, hideLeafy?: (id: string) => void,
    solid?: Uint8Array, solidAt?: (x: number, z: number, y?: number) => boolean, solidGround?: (x: number, z: number) => number, solidStats?: import('./solids.js').SolidStats, busStops?: unknown[],
    familyBuilt?: unknown, familyEdits?: unknown, gates?: unknown[], heroesNear?: (x: number, z: number, r: number) => boolean, levelled?: unknown,
    priceTags?: unknown[], roadLines?: { kind: string, pts: number[][], [k: string]: unknown }[], roadTop?: Map<number, number> | null, roadside?: unknown, waterSites?: { id: string, x: number, z: number, r: number }[] };
  const W: typeof wParts & SvWorldMore = wParts;
  const rnd = seeded(20250921);

  // ---------- sky ----------
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position.z=gl_Position.w; }',
    fragmentShader: 'uniform vec3 top,hor,bot,sunDir,sunCol; varying vec3 vP; void main(){ float y=vP.y; vec3 c=y>0.?mix(hor,top,pow(clamp(y,0.,1.),.6)):mix(hor,bot,clamp(-y*4.,0.,1.)); float s=max(dot(vP,normalize(sunDir)),0.); c+=sunCol*(pow(s,600.)*1.6+pow(s,12.)*.25); gl_FragColor=vec4(c,1.); }'
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), skyMat); sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky);
  const starGeo = new THREE.BufferGeometry(); const sp = [];
  for (let i = 0; i < 700; i++) { const a = rnd() * Math.PI * 2, y = rnd() * .9 + .08, r = Math.sqrt(1 - y * y); sp.push(Math.cos(a) * r * 800, y * 800, Math.sin(a) * r * 800); }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const stars = new THREE.Points(starGeo, starMat); stars.frustumCulled = false; scene.add(stars);
  const moon = sprite('🌕', 40); scene.add(moon);

  scene.fog = new THREE.Fog(0xcfe8ff, 120, 420);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd9c79a, .8); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1); scene.add(sun); scene.add(sun.target);
  if (quality !== 'low') {
    sun.castShadow = true; const S = sun.shadow; S.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024);
    S.camera.left = S.camera.bottom = -28; S.camera.right = S.camera.top = 28; S.camera.near = 1; S.camera.far = 260; S.bias = -.0006; S.normalBias = .04;
  }
  scene.environmentIntensity = .35;

  const PAL: [number, THREE.Color, THREE.Color, THREE.Color, THREE.Color, number, number][] = [
    // t, top, horizon, bottom, sun colour, sun intensity, hemi intensity
    [0, '#0b1433', '#1d2b5a', '#10183a', '#7fa0ff', .15, .32],
    [.22, '#24306a', '#e78f6a', '#3a3f6a', '#ffb07a', .35, .45],
    [.3, '#3f8fd8', '#ffe2bc', '#a9d0ee', '#fff0d6', .9, .75],
    [.5, '#2d84d4', '#a8d4f0', '#a8d4f2', '#fff6e6', 1.05, .85],
    [.7, '#3a86d2', '#ffd9a8', '#a0c0e0', '#ffe6c0', .95, .78],
    [.78, '#3a3a7a', '#f08a5a', '#4a3f6a', '#ff9a6a', .4, .5],
    [.86, '#0b1433', '#1d2b5a', '#10183a', '#7fa0ff', .15, .32],
    [1, '#0b1433', '#1d2b5a', '#10183a', '#7fa0ff', .15, .32]
  ].map((r): [number, THREE.Color, THREE.Color, THREE.Color, THREE.Color, number, number] => [+r[0], new THREE.Color(r[1]), new THREE.Color(r[2]), new THREE.Color(r[3]), new THREE.Color(r[4]), +r[5], +r[6]]);
  const tmpA = new THREE.Color(), tmpB = new THREE.Color();
  W.isNight = () => W.time < .24 || W.time > .8;
  W.updateSky = (dt, camPos, focus = camPos) => {
    if (settings.alwaysDay) W.time = lerp(W.time, .42, Math.min(1, dt));
    else W.time = (W.time + dt / 600) % 1; // a full day lasts ten minutes
    const t = W.time; let i = 0; while (i < PAL.length - 2 && PAL[i + 1][0] <= t) i++;
    const a = PAL[i], b = PAL[i + 1], k = smooth(a[0], b[0], t);
    skyMat.uniforms.top.value.copy(a[1]).lerp(b[1], k);
    skyMat.uniforms.hor.value.copy(a[2]).lerp(b[2], k);
    skyMat.uniforms.bot.value.copy(a[3]).lerp(b[3], k);
    skyMat.uniforms.sunCol.value.copy(a[4]).lerp(b[4], k);
    scene.fog.color.copy(skyMat.uniforms.hor.value);
    const ang = (t - .25) * Math.PI * 2, sd = new THREE.Vector3(Math.cos(ang) * .8, Math.sin(ang), .35).normalize();
    skyMat.uniforms.sunDir.value.copy(sd);
    const day = sd.y > -.05;
    // the shadow box follows the player so nearby shadows stay crisp
    sun.position.copy(focus).addScaledVector(day ? sd : sd.clone().negate(), 120); sun.target.position.copy(focus);
    sun.color.copy(tmpA.copy(a[4]).lerp(b[4], k)); sun.intensity = lerp(a[5], b[5], k) * 1.55;
    hemi.intensity = lerp(a[6], b[6], k) * 1.25; scene.environmentIntensity = lerp(a[6], b[6], k) * .28;
    hemi.color.copy(tmpB.set('#ffffff').lerp(skyMat.uniforms.top.value, .18));
    // rainy weather (js/weather.js) greys the sky and softens the sun
    if (W.overcast > 0) {
      const o = W.overcast; skyMat.uniforms.top.value.lerp(tmpA.set('#8e9aa8'), o * .65); skyMat.uniforms.hor.value.lerp(tmpA.set('#b8c2cc'), o * .6);
      scene.fog.color.copy(skyMat.uniforms.hor.value); sun.intensity *= 1 - o * .55; hemi.intensity *= 1 - o * .2;
    }
    sky.position.copy(camPos); stars.position.copy(camPos);
    starMat.opacity = clamp(-sd.y * 4, 0, 1);
    moon.position.copy(camPos).addScaledVector(sd.clone().negate(), 700); moon.material.opacity = starMat.opacity;
    const night = clamp(-sd.y * 3 + .2, 0, 1);
    W.lanterns.forEach(m => { m.material.emissiveIntensity = .2 + night * 1.6; });
  };

  // ---------- terrain ----------
  const seg = Math.round(SIZE / (quality === 'low' ? 2.67 : 2)); // (about one point every 2 m, 2.7 m on low)
  const tg = new THREE.PlaneGeometry(SIZE, SIZE, seg, seg); tg.rotateX(-Math.PI / 2);
  const pa = tg.attributes.position, cols = new Float32Array(pa.count * 3), c = new THREE.Color();
  const C = { sand: new THREE.Color('#ecd6a4'), grassA: new THREE.Color('#7fbf8c'), grassB: new THREE.Color('#62a878'), dry: new THREE.Color('#e3cf9c'),
    rock: new THREE.Color('#d9cfba'), snow: new THREE.Color('#f6f8fb'), dirt: new THREE.Color('#e6d2a2'), paddy: new THREE.Color('#a7d67c'), bamboo: new THREE.Color('#6eae78'), deep: new THREE.Color('#cdb88e'), outback: new THREE.Color('#d98f58') };
  // (round T2) the slope from the next grid points east and south (already worked out), scaled to 1.5 m as before:
  // two more heightAt calls per point made the valley a quarter of a second slower to build
  const row = seg + 1, step = SIZE / seg, HS = new Float32Array(pa.count);
  // (owner, 30 Oct 2026 AEDT: "it loads too long") the ground's heights are kept on the device after the first start of
  // a build (js/worldmemo.ts) and read back: the same numbers, without working out every point again
  const keptHS = keptFloats('ground-start', pa.count);
  if (keptHS) HS.set(keptHS); else { for (let i = 0; i < pa.count; i++) HS[i] = heightAt(pa.getX(i), pa.getZ(i)); rememberFloats('ground-start', HS); }
  for (let i = 0; i < pa.count; i++) pa.setY(i, HS[i]);
  // (the ground's colours are kept on the device the same way: the same numbers, read back instead of worked out)
  const keptCols = keptFloats('ground-colours', pa.count * 3);
  if (keptCols) cols.set(keptCols);
  else for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i), z = pa.getZ(i), h = HS[i];
    const ex = i % row < seg ? HS[i + 1] : HS[i - 1], sz = i < pa.count - row ? HS[i + row] : HS[i - row];
    const sl = (Math.abs(ex - h) + Math.abs(sz - h)) * 1.5 / step;
    const n = fbm(x * .03, z * .03, 2);
    c.copy(C.grassA).lerp(C.grassB, clamp(n + .5, 0, 1));
    if (n > .4) c.lerp(C.dry, clamp((n - .4) * 6, 0, 1)); // sandy patches between the grass, like a dry summer
    if (dist2(x, z, PADDIES.x, PADDIES.z) < PADDIES.r + 4) c.copy(C.paddy).lerp(C.grassB, ((Math.floor(x / 5) + Math.floor(z / 9)) & 1) * .25);
    if (dist2(x, z, BAMBOO.x, BAMBOO.z) < BAMBOO.r) c.lerp(C.bamboo, .5);
    const dv = dist2(x, z, VILLAGE.x, VILLAGE.z);
    if (dv < VILLAGE.r - 4 && (Math.abs(x - VILLAGE.x) < 3 || Math.abs(z - VILLAGE.z) < 3 || Math.abs(dv - 14) < 2.2)) c.copy(C.dirt);
    const dh = dist2(x, z, HOME.x, HOME.z);
    if (dh < HOME.r - 4 && (Math.abs(x - HOME.x) < 2 || Math.abs(z - HOME.z) < 2)) c.copy(C.dirt);
    // (round T3, Concept D) beyond the Great Dividing Range, round Uluru, the ground turns the orange-red of the outback
    { const ob = smooth(-174, -192, x) * smooth(-90, -60, z); if (ob > 0) c.lerp(C.outback, ob * .8); }   // (not under the bamboo forest or the snowy north)
    if (sl > 2.2) c.lerp(C.rock, clamp((sl - 2.2) / 1.5, 0, 1));
    if (h > 34) c.lerp(C.snow, clamp((h - 34) / 6, 0, 1));
    if (h < 1.6) c.copy(C.sand);
    if (h < -1.5) c.copy(C.deep);
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  if (!keptCols) rememberFloats('ground-colours', cols);
  tg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); tg.computeVertexNormals();
  // fine detail (grass blades, pebbles, soil) painted into a tiling texture and blended over the ground colours
  const dc = document.createElement('canvas'); dc.width = dc.height = 256; const dx = dc.getContext('2d');
  dx.fillStyle = '#f4f4f4'; dx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) { const v = 215 + Math.floor(Math.random() * 40); dx.fillStyle = `rgb(${v},${v},${v})`; const x = Math.random() * 256, y = Math.random() * 256; dx.fillRect(x, y, 1 + Math.random() * 2, 2 + Math.random() * 5); }
  for (let i = 0; i < 140; i++) { const v = 150 + Math.floor(Math.random() * 60); dx.fillStyle = `rgba(${v},${v},${v},.6)`; dx.beginPath(); dx.arc(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 0, Math.PI * 2); dx.fill(); }
  const dtex = new THREE.CanvasTexture(dc); dtex.wrapS = dtex.wrapT = THREE.RepeatWrapping; dtex.repeat.set(140, 140); dtex.anisotropy = 4;
  const terrain = new THREE.Mesh(tg, toonSmooth({ map: dtex })); terrain.receiveShadow = true; scene.add(terrain); W.terrain = terrain;

  // water with a soft moving shimmer
  const wc = document.createElement('canvas'); wc.width = wc.height = 128; const wx = wc.getContext('2d');
  wx.fillStyle = '#ffffff'; wx.fillRect(0, 0, 128, 128); wx.strokeStyle = 'rgba(160,220,255,.9)'; wx.lineWidth = 3;
  for (let i = 0; i < 14; i++) { const x0 = Math.random() * 128, y0 = Math.random() * 128; wx.beginPath(); wx.arc(x0, y0, 6 + Math.random() * 10, .2, 1.4); wx.stroke(); }
  const wtex = new THREE.CanvasTexture(wc); wtex.wrapS = wtex.wrapT = THREE.RepeatWrapping; wtex.repeat.set(60, 60); wtex.colorSpace = THREE.SRGBColorSpace;
  // (round T4a) the water map (paintWater, kept on the device like the map picture): each river, lake and the sea its own
  // colour, deeper water darker, and a white foam line that moves along every shore; until it is ready (the first start
  // paints it after the valley is built) the water is the plain blue of before. Still one plane, one draw.
  const WU = { uWaterMap: { value: new THREE.Texture() }, uReady: { value: 0 }, uTime: { value: 0 }, uSize: { value: SIZE } };
  const waterMat = new THREE.MeshStandardMaterial({ color: '#2f8fc8', map: wtex, transparent: true, opacity: .8, roughness: .08, metalness: .25 });
  waterMat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, WU);
    sh.vertexShader = 'varying vec2 vWXZ;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vWXZ = position.xz;');
    sh.fragmentShader = 'uniform sampler2D uWaterMap; uniform float uReady, uTime, uSize; varying vec2 vWXZ;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
  if (uReady > .5) {
    vec4 wm = texture2D(uWaterMap, clamp(vWXZ / uSize + .5, 0., 1.));
    diffuseColor.rgb *= pow(wm.rgb, vec3(2.2)) / pow(vec3(.184, .561, .784), vec3(2.2));
    float shore = clamp((wm.a - .2) / .8, 0., 1.), foam = smoothstep(.5, .95, shore) * (.55 + .45 * sin(uTime * 1.6 + shore * 14.));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.), foam * .7);
  }`);
  };
  waterMat.customProgramCacheKey = () => 'svwater';
  const water = new THREE.Mesh(new THREE.PlaneGeometry(SIZE + 400, SIZE + 400).rotateX(-Math.PI / 2), waterMat); water.position.y = WATER; scene.add(water);
  W.updaters.push((dt, t) => { wtex.offset.set(t * .01, t * .006); WU.uTime.value = t; });
  // (row 0 of the water picture is the north edge, as vWXZ reads it, so it is not flipped)
  W.waterMap = cv => { const tx = new THREE.CanvasTexture(cv); tx.minFilter = tx.magFilter = THREE.LinearFilter; tx.generateMipmaps = false; tx.flipY = false; WU.uWaterMap.value = tx; WU.uReady.value = 1; };

  // ---------- trees & plants (instanced) ----------
  const geos = {
    round: merge([P(new THREE.CylinderGeometry(.24, .38, 3.2, 6), '#7a5a3e', [0, 1.6, 0]), P(new THREE.CylinderGeometry(.1, .16, 1.8, 5), '#7a5a3e', [.6, 3, 0], [0, 0, -.6]), P(new THREE.CylinderGeometry(.1, .16, 1.6, 5), '#7a5a3e', [-.5, 2.9, .2], [.2, 0, .6]),
      P(new THREE.IcosahedronGeometry(2.2, 1), '#2f7f5f', [0, 4.5, 0]), P(new THREE.IcosahedronGeometry(1.7, 1), '#3a8d68', [1.5, 4.1, .6]), P(new THREE.IcosahedronGeometry(1.6, 1), '#276f55', [-1.4, 4.2, -.4]), P(new THREE.IcosahedronGeometry(1.4, 1), '#46a077', [.3, 5.9, .3])]),
    apple: merge([P(new THREE.CylinderGeometry(.3, .42, 2.6, 7), '#8a5a3b', [0, 1.3, 0]), P(new THREE.IcosahedronGeometry(2.2, 1), '#348a63', [0, 3.9, 0]),
      ...[[1.6, 4, .8], [-1.4, 3.6, 1], [.4, 4.4, -1.8], [-.6, 5.4, .9], [1.1, 3.1, -1.3]].map(p => P(new THREE.SphereGeometry(.32, 8, 6), '#e8433a', p))]),
    pine: merge([P(new THREE.CylinderGeometry(.25, .35, 2, 6), '#6e4a32', [0, 1, 0]), P(new THREE.ConeGeometry(2, 3.2, 8), '#25664f', [0, 3.2, 0]), P(new THREE.ConeGeometry(1.5, 2.6, 8), '#2c7558', [0, 4.8, 0]), P(new THREE.ConeGeometry(.9, 2, 8), '#348462', [0, 6.2, 0])]),
    snowpine: merge([P(new THREE.CylinderGeometry(.25, .35, 2, 6), '#6e4a32', [0, 1, 0]), P(new THREE.ConeGeometry(2, 3.2, 8), '#2f6a4f', [0, 3.2, 0]), P(new THREE.ConeGeometry(1.5, 2.6, 8), '#e9f2ff', [0, 4.8, 0]), P(new THREE.ConeGeometry(.9, 2, 8), '#ffffff', [0, 6.2, 0])]),
    bamboo: merge([[0, 0], [.7, .3], [-.5, .6], [.2, -.7], [-.7, -.3]].flatMap(([x, z], i) => {
      const hgt = 7 + (i % 3) * 1.6;
      return [P(new THREE.CylinderGeometry(.13, .15, hgt, 6), '#8cc65a', [x, hgt / 2, z]), P(new THREE.ConeGeometry(.9, 2.2, 6), '#5fae4a', [x, hgt + .4, z]),
        P(new THREE.TorusGeometry(.15, .04, 4, 8), '#6a9a3a', [x, hgt * .3, z], [Math.PI / 2, 0, 0]), P(new THREE.TorusGeometry(.15, .04, 4, 8), '#6a9a3a', [x, hgt * .6, z], [Math.PI / 2, 0, 0])];
    })),
    palm: merge([P(new THREE.CylinderGeometry(.2, .32, 5.5, 6), '#a07848', [.3, 2.7, 0], [0, 0, -.12]),
      ...[0, 1, 2, 3, 4, 5].map(i => P(new THREE.ConeGeometry(.5, 3.2, 4), i % 2 ? '#4fae4a' : '#3d9a42', [.6 + Math.cos(i) * 1.3, 5.3, Math.sin(i) * 1.3], [Math.PI / 2 - .5, i * 1.05, 0], [1, 1, .25])),
      P(new THREE.SphereGeometry(.25, 6, 5), '#7a5a2a', [.6, 5.2, .3]), P(new THREE.SphereGeometry(.25, 6, 5), '#7a5a2a', [.4, 5.1, -.3])]),
    bush: merge([P(new THREE.IcosahedronGeometry(1.1, 1), '#24654f', [0, .7, 0], [0, 0, 0], [1.2, .85, 1]), P(new THREE.IcosahedronGeometry(.8, 1), '#30785c', [.9, .55, .3])]),
    rock: merge([P(new THREE.DodecahedronGeometry(1, 0), '#e6dcc6', [0, .45, 0], [0, .5, 0], [1.5, .85, 1.15])])
  };
  const spots = { round: [], apple: [], pine: [], snowpine: [], bamboo: [], palm: [], bush: [], rock: [] };
  const appleTrees = [];
  const CLEAR = MAP.CLEARINGS.map(c => { const [ax, az] = c.at || MAP.anchorOf(c.place), [dx, dz] = c.off || [0, 0]; return { x: ax + dx, z: az + dz, r: c.r }; });
  const nearPOI = (x, z) => FLATS.some(F => x > F.x0 - 4 && x < F.x1 + 4 && z > F.z0 - 4 && z < F.z1 + 4) || LOTS.some(L => dist2(x, z, L.x, L.z) < 11) || CLEAR.some(c => dist2(x, z, c.x, c.z) < c.r) || dist2(x, z, APOSTLES.x, APOSTLES.z) < 15 || Object.values(FESTGROUNDS).some(f => dist2(x, z, f.x, f.z) < 17) || SHRINES.some(s => dist2(x, z, s.x, s.z) < 9) || TOWERS.some(s => dist2(x, z, s.x, s.z) < 10) || LEAFIES.some(s => dist2(x, z, s.x, s.z) < 5); // (5 m: a tree's trunk and leaves never stand over a Leafy's spot)
  for (let i = 0; i < 9000; i++) {
    const x = (rnd() - .5) * (SIZE - 30), z = (rnd() - .5) * (SIZE - 30), h = heightAt(x, z);
    if (h < 1.5 || nearPOI(x, z)) continue;
    const sl = Math.abs(heightAt(x + 2, z) - h) + Math.abs(heightAt(x, z + 2) - h);
    if (dist2(x, z, VILLAGE.x, VILLAGE.z) < VILLAGE.r + 4 || dist2(x, z, PADDIES.x, PADDIES.z) < PADDIES.r + 3 || dist2(x, z, HOME.x, HOME.z) < HOME.r + 4) continue;
    if (dist2(x, z, CHINA.x, CHINA.z) < CHINA.r + 6 || dist2(x, z, INDIA.x, INDIA.z) < INDIA.r + 6) continue;
    if (bridgeAt(x, z, 8, 14, 10) || roadDist(x, z).d < 4.5 || riverDist(x, z) < 10) continue; // keep roads and riverbanks clear
    const inPlat = dist2(x, z, PLATEAU.x, PLATEAU.z) < PLATEAU.r;
    if (inPlat && dist2(x, z, PLATEAU.x, PLATEAU.z) < 12) continue;
    const r = rnd();
    let type = null;
    if (dist2(x, z, BAMBOO.x, BAMBOO.z) < BAMBOO.r) type = r < .75 ? 'bamboo' : r < .85 ? 'bush' : null;
    else if (h > 30) type = sl < 4 && r < .35 ? 'snowpine' : r < .45 ? 'rock' : null;
    else if (z < MTN.pines) type = sl < 3 && r < .4 ? 'pine' : r < .5 ? 'rock' : null;
    else if (dist2(x, z, LAKE.x, LAKE.z) < LAKE.r + 22 && h < 5) type = r < .3 ? 'palm' : r < .38 ? 'bush' : null;
    else if (sl < 2.5) type = r < (inPlat ? .1 : .14) ? 'round' : r < .2 ? 'bush' : r < .225 ? 'rock' : r < .235 ? 'apple' : null;
    if (!type) continue;
    const lim = { round: 380, apple: 26, pine: 260, snowpine: 120, bamboo: 230, palm: 60, bush: 260, rock: 200 };
    if (spots[type].length >= (quality === 'low' ? lim[type] * .6 : lim[type])) continue;
    const s = type === 'rock' ? .5 + rnd() * 1.4 : .8 + rnd() * .5;
    spots[type].push([x, h - .1, z, rnd() * 6.28, s]);
    if (type === 'apple') appleTrees.push({ x, z });
    if (type !== 'bush') W.colliders.push({ x, z, r: type === 'rock' ? 1.1 * s : type === 'bamboo' ? 1 : .6 });
  }
  // A few apple trees right on the plateau so the cooking quest is easy to start.
  [[-.62, .12], [.69, .19], [-.25, -.69]].map(([dx, dz]) => [PLATEAU.x + dx * PLATEAU.r, PLATEAU.z + dz * PLATEAU.r]) // (round T: spread by the plateau's own size).forEach(([x, z]) => { spots.apple.push([x, heightAt(x, z) - .1, z, 0, 1]); appleTrees.push({ x, z }); W.colliders.push({ x, z, r: .6 }); });
  const o3 = new THREE.Object3D(), tint = new THREE.Color();
  // Each kind of tree is split into 100 m tiles of the map, so the tiles behind the camera (and outside the
  // sun's shadow area) are skipped instead of drawing every tree in the valley every frame (phones).
  const TILE = 100;
  for (const k in spots) {
    const tiles = new Map(), mat = toonVC();
    for (const s of spots[k]) { const key = Math.floor((s[0] + HALF) / TILE) + ',' + Math.floor((s[2] + HALF) / TILE); if (!tiles.has(key)) tiles.set(key, []); tiles.get(key).push(s); }
    for (const list of tiles.values()) {
      const im = new THREE.InstancedMesh(geos[k], mat, list.length); im.castShadow = k !== 'rock'; im.receiveShadow = true;
      list.forEach((s, i) => { o3.position.set(s[0], s[1], s[2]); o3.rotation.set(0, s[3], 0); o3.scale.setScalar(s[4]); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix); tint.setHSL(0, 0, .88 + rnd() * .12); im.setColorAt(i, tint); });
      im.computeBoundingSphere(); // so the camera can tell when a whole tile is out of view
      scene.add(im); im.userData.kind = k; im.userData.list = list; W.plants.push(im); // tappable (js/fun.js)
    }
  }
  appleTrees.forEach((t, i) => {
    let ready = 0;
    W.interactables.push({ id: 'apple' + i, x: t.x, z: t.z, r: 3.2, icon: '🍎', label: () => T('Shake tree', 'Rung cây'),
      act: (pl, game) => { const now = performance.now(); if (now < ready) { game.toast(pl, T('No apples yet. Come back later!', 'Chưa có táo. Lát nữa quay lại nhé!')); return; }
        ready = now + 90000; if (game.shakeTree) game.shakeTree(pl, t); else { game.give(pl, 'apple', 2); game.fx(t.x, heightAt(t.x, t.z) + 4, t.z, '🍎'); } } });
  });

  // grass tufts and flowers
  const nGrass = quality === 'low' ? 2500 : quality === 'high' ? 9000 : 6000;
  const blade = merge([0, 1, 2].map(i => P(new THREE.ConeGeometry(.12, .9, 3), '#ffffff', [Math.cos(i * 2.1) * .18, .4, Math.sin(i * 2.1) * .18], [Math.cos(i * 2.1) * .25, 0, Math.sin(i * 2.1) * .25])));
  const flower = merge([P(new THREE.CylinderGeometry(.03, .03, .6, 4), '#4f9e45', [0, .3, 0]), ...[0, 1, 2, 3, 4].map(i => P(new THREE.SphereGeometry(.13, 6, 4), '#ffffff', [Math.cos(i * 1.256) * .16, .62, Math.sin(i * 1.256) * .16])), P(new THREE.SphereGeometry(.09, 6, 4), '#ffd23f', [0, .66, 0])]);
  const gIm = new THREE.InstancedMesh(blade, toonVC(), nGrass), fIm = new THREE.InstancedMesh(flower, toonVC(), Math.floor(nGrass / 6));
  let gi = 0, fi = 0; const FC = ['#ff7eb8', '#ffffff', '#ffd23f', '#9a6bff', '#ff8a5a', '#7fd8ff'];
  for (let tries = 0; tries < nGrass * 6 && (gi < nGrass || fi < fIm.count); tries++) {
    const near = rnd() < .5; const x = near ? PLATEAU.x + (rnd() - .5) * 180 : (rnd() - .5) * (SIZE - 40), z = near ? PLATEAU.z + (rnd() - .5) * 180 : (rnd() - .5) * (SIZE - 40), h = heightAt(x, z);
    if (h < 1.8 || h > 30) continue;
    if (dist2(x, z, VILLAGE.x, VILLAGE.z) < VILLAGE.r - 6 || dist2(x, z, HOME.x, HOME.z) < HOME.r - 8 || dist2(x, z, CHINA.x, CHINA.z) < CHINA.r - 2 || dist2(x, z, INDIA.x, INDIA.z) < INDIA.r - 2) continue;
    if (edgeDist(x, z) < 1.5) continue; // nothing grows on a road, a place's street or their verge (G5/R4; Round U)
    o3.position.set(x, h - .05, z); o3.rotation.set(0, rnd() * 6, 0); o3.scale.setScalar(.45 + rnd() * .45); o3.updateMatrix();
    if (rnd() < .16 && fi < fIm.count) { fIm.setMatrixAt(fi, o3.matrix); fIm.setColorAt(fi++, tint.set(FC[Math.floor(rnd() * FC.length)])); }
    else if (gi < nGrass) { gIm.setMatrixAt(gi, o3.matrix); gIm.setColorAt(gi++, tint.setHSL(.26 + rnd() * .06, .55, .3 + rnd() * .1)); }
  }
  gIm.count = gi; fIm.count = fi; scene.add(gIm, fIm); W.groundCover = [gIm, fIm]; // (the roads check looks at them)

  // clouds: big soft painted cumulus with warm afternoon light on their edges
  const cloudTex = k => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'), r = seeded(77 + k);
    const blobs = Array.from({ length: 9 }, (_, i) => ({ x: 90 + i * 40 + r() * 30, y: 170 - Math.sin(i / 8 * Math.PI) * (60 + r() * 50), rad: 40 + r() * 45 }));
    const pass = (col, dy, grow) => { g.fillStyle = col; blobs.forEach(b => { g.beginPath(); g.arc(b.x, b.y + dy, b.rad * grow, 0, Math.PI * 2); g.fill(); }); g.fillRect(70, 170 + dy, 380, 40); };
    pass('#f0cfa0', 8, 1); pass('#fbe6c4', 0, .95); pass('#fff6e6', -10, .78);
    g.globalCompositeOperation = 'destination-out'; g.fillRect(0, 205, 512, 60);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const cloudTexs = [0, 1, 2].map(cloudTex);
  const clouds = [];
  for (let i = 0; i < 22; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexs[i % 3], transparent: true, depthWrite: false, fog: false }));
    const a = rnd() * Math.PI * 2, d = 330 + rnd() * 200, sc = 110 + rnd() * 90;
    m.position.set(Math.cos(a) * d, 45 + rnd() * 55, Math.sin(a) * d); m.scale.set(sc, sc / 2, 1); m.renderOrder = -1; scene.add(m); clouds.push(m);
  }
  W.updaters.push(dt => clouds.forEach(m => { m.position.x += dt * 1.2; if (m.position.x > 560) m.position.x = -560; }));

  // ---------- village ----------
  const V = VILLAGE;
  // village houses (nhà ba gian): wooden columns, tiled roofs with upturned corners, brick yards
  function house(x, z, rot, w = 7, d = 6, wall = '#efe0bf', roof = '#b9533c', palms = false) {
    const g = houseVillage({ w, d: d * .9, wall, tile: roof, palms }).obj;
    g.position.set(x, heightAt(x, z) - .05, z); g.rotation.y = rot; scene.add(g);
    W.colliders.push({ x, z, r: Math.max(w, d) * .62 });
    W.houses.push({ x, z, rot, d: Math.max(w, d) * 1.24, kind: 'village' });
    return g;
  }
  [[-18, -14, .5], [-4, -22, 0], [14, -20, -.3], [22, -4, -1.3], [20, 14, -2.2], [-20, 10, 1.6], [-14, 22, 2.4], [6, 24, 3.1]]
    .forEach(([dx, dz, r], i) => house(V.x + dx, V.z + dz, r + Math.PI, 6 + (i % 3), 5 + (i % 2), i % 3 === 1 ? '#f6dca0' : '#efe0bf', i % 2 ? '#b9533c' : '#a0442f', i % 3 === 0));
  // village gate (cổng làng) on the west side, facing the bridge
  {
    const gx = V.x - V.r + 2, gz = V.z, y = heightAt(gx, gz);
    const gate = new THREE.Mesh(merge([
      P(new THREE.BoxGeometry(1.2, 6, 1.2), '#e8dcc0', [0, 3, -4]), P(new THREE.BoxGeometry(1.2, 6, 1.2), '#e8dcc0', [0, 3, 4]),
      P(new THREE.BoxGeometry(1.8, .7, 10.5), '#b9533c', [0, 6.4, 0]), P(new THREE.BoxGeometry(2.4, .3, 11.5), '#8e3a2a', [0, 6.9, 0]),
      P(new THREE.BoxGeometry(.3, 1.2, 4), '#c9302c', [.75, 5.3, 0]), P(new THREE.BoxGeometry(.32, .9, 3.4), '#ffd23f', [.8, 5.3, 0])
    ]), toonVC()); gate.position.set(gx, y, gz); gate.userData.noCam = true; scene.add(gate);
    W.colliders.push({ x: gx, z: gz - 4, r: .9 }, { x: gx, z: gz + 4, r: .9 });
  }
  // the big banyan tree (cây đa) in the middle of the village
  {
    const y = heightAt(V.x, V.z);
    const banyan = new THREE.Mesh(merge([
      P(new THREE.CylinderGeometry(1.1, 1.8, 6, 9), '#7a5236', [0, 3, 0]),
      ...[[0, 8, 0, 4.5], [3.5, 7, 1.5, 3.2], [-3.5, 7.2, -1, 3.4], [1, 7.5, -3.5, 3], [-1.5, 7, 3.4, 3]].map(([x, yy, z, r]) => P(new THREE.IcosahedronGeometry(r, 1), '#3f8f3f', [x, yy, z])),
      ...[0, 1, 2, 3, 4, 5].map(i => P(new THREE.CylinderGeometry(.08, .08, 4, 4), '#8a6a4a', [Math.cos(i) * 3, 3.5, Math.sin(i) * 3]))
    ]), toonVC()); banyan.position.set(V.x + 6, y, V.z + 6); scene.add(banyan);
    W.colliders.push({ x: V.x + 6, z: V.z + 6, r: 2 });
  }
  // lotus pond
  {
    const px = V.x - 10, pz = V.z + 4, y = heightAt(px, pz) + .08;
    const pond = new THREE.Mesh(new THREE.CircleGeometry(5.2, 28).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: '#3aa0c8', shininess: 80 }));
    pond.position.set(px, y, pz); scene.add(pond);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(5.3, .35, 6, 28).rotateX(Math.PI / 2), toon('#b7ad98')); rim.position.set(px, y + .05, pz); scene.add(rim);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, r = 1 + (i % 4) * 1.1;
      const pad = new THREE.Mesh(new THREE.CircleGeometry(.7, 12, .3, 5.8).rotateX(-Math.PI / 2), toon('#3f9a45')); pad.position.set(px + Math.cos(a) * r, y + .05, pz + Math.sin(a) * r); scene.add(pad);
      if (i % 2 === 0) { const fl = new THREE.Mesh(merge([0, 1, 2, 3, 4, 5].map(k => P(new THREE.ConeGeometry(.18, .6, 4), k % 2 ? '#ffc0d8' : '#ff8ab8', [Math.cos(k) * .14, .25, Math.sin(k) * .14], [Math.cos(k) * .45, 0, Math.sin(k) * .45]))), toonVC()); fl.position.copy(pad.position); scene.add(fl); }
    }
    W.colliders.push({ x: px, z: pz, r: 5.4 });
  }
  // market stalls (chợ) with striped umbrellas
  const stall = (x, z, rot, col) => {
    const y = heightAt(x, z);
    const m = new THREE.Mesh(merge([
      P(new THREE.BoxGeometry(3.4, 1, 1.6), '#a9764a', [0, .5, 0]),
      ...[-1.5, 1.5].flatMap(px => [P(new THREE.CylinderGeometry(.08, .08, 3, 5), '#7a5236', [px, 1.5, -.7])]),
      P(new THREE.ConeGeometry(2.6, 1.1, 8), col, [0, 3.2, 0]),
      ...([[-1, '#e8433a'], [-.4, '#ffd23f'], [.3, '#ff9a2e'], [.9, '#4cbf5c']] satisfies [number, string][]).map(([px, cc]) => P(new THREE.SphereGeometry(.24, 8, 6), cc, [px, 1.15, .1]))
    ]), toonVC()); m.position.set(x, y, z); m.rotation.y = rot; scene.add(m);
    W.colliders.push({ x, z, r: 1.9 });
  };
  stall(V.x + 2, V.z - 10, 0, '#e8434a'); stall(V.x - 4, V.z - 11, .2, '#3d7fd6'); stall(V.x + 8, V.z - 9, -.3, '#ffb52e');
  // strings of red lanterns (đèn lồng)
  const lanternGeo = new THREE.SphereGeometry(.35, 10, 8); lanternGeo.scale(1, 1.2, 1);
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2, x = V.x + Math.cos(a) * 14, z = V.z + Math.sin(a) * 14, y = heightAt(x, z);
    if (i % 2 === 0) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 3.6, 5), toon('#7a5236')); pole.position.set(x, y + 1.8, z); scene.add(pole); W.colliders.push({ x, z, r: .3 }); }
    const l = new THREE.Mesh(lanternGeo, new THREE.MeshStandardMaterial({ roughness: .5, color: i % 3 === 2 ? '#ffcf3a' : '#e8332a', emissive: i % 3 === 2 ? '#ffb000' : '#ff3a1a', emissiveIntensity: .3 }));
    l.position.set(x, y + 3.4, z); scene.add(l); W.lanterns.push(l);
  }
  // Ô ăn quan board drawn on the ground, hopscotch squares, tug-of-war rope
  {
    const bx = V.x + 16, bz = V.z + 22;
    const board = new THREE.Mesh(merge([
      ...[0, 1, 2, 3, 4].flatMap(i => [P(new THREE.BoxGeometry(1.1, .06, 1.1), '#e9d6a8', [-2.4 + i * 1.2, 0, -.6]), P(new THREE.BoxGeometry(1.1, .06, 1.1), '#e9d6a8', [-2.4 + i * 1.2, 0, .6])]),
      P(new THREE.CylinderGeometry(1.2, 1.2, .06, 16, 1, false, 0, Math.PI), '#e9d6a8', [-3.1, 0, 0], [0, Math.PI, 0]),
      P(new THREE.CylinderGeometry(1.2, 1.2, .06, 16, 1, false, 0, Math.PI), '#e9d6a8', [3.1, 0, 0])
    ]), toonVC()); board.position.set(bx, heightAt(bx, bz) + .04, bz); scene.add(board);
    const hx = V.x - 18, hz = V.z - 2;
    const hop = new THREE.Mesh(merge([[0, 0], [0, 1.3], [-.65, 2.6], [.65, 2.6], [0, 3.9], [-.65, 5.2], [.65, 5.2], [0, 6.5]].map(([x, z], i) => P(new THREE.BoxGeometry(1.2, .05, 1.2), i % 2 ? '#ffffff' : '#ffe08a', [x, 0, z]))), toonVC());
    hop.position.set(hx, heightAt(hx, hz) + .04, hz); hop.rotation.y = Math.PI / 2; scene.add(hop);
    const rx = V.x + 2, rz = V.z + 18;
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 9, 6).rotateZ(Math.PI / 2), toon('#d9b26a')); rope.position.set(rx, heightAt(rx, rz) + .9, rz); scene.add(rope);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(.1, .5, .3), toon('#e8332a')); flag.position.set(rx, heightAt(rx, rz) + .6, rz); scene.add(flag);
  }
  // cooking pots: one on the plateau, one in the village
  W.pots = [{ x: PLATEAU.x - 4, z: PLATEAU.z + 8 }, { x: V.x - 2, z: V.z + 12 }].map(p => {
    const y = heightAt(p.x, p.z);
    const pot = new THREE.Mesh(merge([
      P(new THREE.SphereGeometry(.9, 12, 8, 0, Math.PI * 2, Math.PI * .35, Math.PI * .65), '#3a3a42', [0, 1.1, 0]),
      ...[0, 1, 2].map(i => P(new THREE.CylinderGeometry(.07, .07, 1.6, 4), '#5a4030', [Math.cos(i * 2.1) * .8, .6, Math.sin(i * 2.1) * .8], [Math.sin(i * 2.1) * .3, 0, -Math.cos(i * 2.1) * .3])),
      ...[0, 1, 2, 3, 4, 5].map(i => P(new THREE.BoxGeometry(.9, .2, .2), '#7a5236', [Math.cos(i) * .4, .1, Math.sin(i) * .4], [0, i, 0]))
    ]), toonVC()); pot.position.set(p.x, y, p.z); scene.add(pot);
    const fire = sprite('🔥', 1.1); fire.position.set(p.x, y + .5, p.z); scene.add(fire);
    W.updaters.push((dt, t) => { fire.scale.setScalar(1 + Math.sin(t * 9) * .1); });
    W.colliders.push({ x: p.x, z: p.z, r: 1.1 });
    return p;
  });
  // the Lotus Statue (trades Sparkle Orbs for extra hearts or stamina)
  W.statue = { x: V.x + 18, z: V.z - 2 };
  {
    const s = W.statue, y = heightAt(s.x, s.z);
    const st = new THREE.Mesh(merge([
      P(new THREE.CylinderGeometry(2, 2.4, 1, 8), '#c9c2b2', [0, .5, 0]),
      P(new THREE.CylinderGeometry(.7, 1.1, 3, 10), '#e6e0d0', [0, 2.5, 0]), P(new THREE.SphereGeometry(.7, 12, 10), '#e6e0d0', [0, 4.5, 0]),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => P(new THREE.ConeGeometry(.5, 1.6, 4), '#ffb3cf', [Math.cos(i * .785) * 1.2, 1.4, Math.sin(i * .785) * 1.2], [Math.cos(i * .785) * .7, 0, -Math.sin(i * .785) * .7]))
    ]), toonVC()); st.position.set(s.x, y, s.z); st.rotation.y = -Math.PI / 2; scene.add(st);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(1, .08, 6, 24), glow('#ffe58a')); halo.position.set(s.x, y + 4.6, s.z); halo.rotation.y = Math.PI / 2; scene.add(halo);
    W.updaters.push((dt, t) => { halo.rotation.x = Math.sin(t) * .2; });
    W.colliders.push({ x: s.x, z: s.z, r: 2.2 });
  }

  // ---------- bridges (the Dragon Bridge is built with the roads: js/roads.js) ----------
  for (const B of BRIDGES) {
    if (B.style === 'dragon') continue;
    const len = B.a1 - B.a0, y = B.h, hw = B.w / 2, steel = '#8d979c';
    // (round T) a plain road bridge: a deck on two stone piers, with white railings
    const plain = () => [P(new THREE.BoxGeometry(len + 2, .5, B.w), '#8a8f94', [0, -.25, 0]), P(new THREE.BoxGeometry(len + 2, .06, B.w - 2.2), '#b4b9bc', [0, .03, 0]),
      P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, hw - .5]), P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, -hw + .5]),
      ...[-1, 1].flatMap(sz => [P(new THREE.BoxGeometry(len + 2, .12, .14), '#f6f1e4', [0, .95, sz * hw]), ...Array.from({ length: Math.round(len / 2.5) + 1 }, (_, i) => P(new THREE.BoxGeometry(.16, .9, .16), '#f6f1e4', [-len / 2 - 1 + i * (len + 2) / Math.round(len / 2.5), .45, sz * hw]))]),
      ...[-.25, .25].map(f => P(new THREE.BoxGeometry(1.6, 12, B.w - 1), '#a8a296', [f * len, -6, 0]))];
    // A small "Sydney Harbour Bridge": a grey steel arch, hangers, stone pylons at each end and a road deck.
    const parts = B.style !== 'harbour' ? plain() : [
      P(new THREE.BoxGeometry(len + 2, .5, B.w), '#7d858a', [0, -.25, 0]), P(new THREE.BoxGeometry(len + 2, .06, B.w - 2.2), '#b4b9bc', [0, .03, 0]),
      P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, hw - .5]), P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, -hw + .5]),
      ...Array.from({ length: 7 }, (_, i) => P(new THREE.BoxGeometry(1.6, .08, .14), '#f6f1e4', [-len / 2 + 3 + i * (len - 6) / 6, .09, 0])),
      P(new THREE.BoxGeometry(len + 2, .9, .12), steel, [0, .45, hw]), P(new THREE.BoxGeometry(len + 2, .9, .12), steel, [0, .45, -hw]),
      ...[-.32, .32].map(f => P(new THREE.CylinderGeometry(.5, .7, 12, 6), '#9a948a', [f * len, -6, 0]))
    ];
    for (const sz of [-1, 1]) {
      parts.push(P(new THREE.TorusGeometry(len / 2 - 1, .35, 5, 28, Math.PI), steel, [0, -1.2, sz * (hw - .2)], [0, 0, 0], [1, .62, 1]));
      parts.push(P(new THREE.TorusGeometry(len / 2 - 1, .22, 5, 28, Math.PI), steel, [0, -2.4, sz * (hw - .2)], [0, 0, 0], [1, .62, 1]));
      for (let i = 1; i < 12; i++) { const t = i / 12, x = -len / 2 + 1 + t * (len - 2), a = Math.acos(Math.max(-1, Math.min(1, x / (len / 2 - 1)))), top = Math.sin(a) * (len / 2 - 1) * .62 - 1.2; if (top > 1) parts.push(P(new THREE.BoxGeometry(.12, top, .12), steel, [x, top / 2, sz * (hw - .2)])); }
      for (const ex of [-1, 1]) parts.push(P(new THREE.BoxGeometry(2.2, 7, 2.2), '#d8cdb6', [ex * (len / 2 + .6), 2.2, sz * (hw + .6)]), P(new THREE.BoxGeometry(2.6, .5, 2.6), '#c8bca2', [ex * (len / 2 + .6), 5.9, sz * (hw + .6)]));
    }
    // (round T2) the bridge landmarks over their real rivers
    const deck = (col = '#8a8f94', top = '#b4b9bc') => [P(new THREE.BoxGeometry(len + 2, .5, B.w), col, [0, -.25, 0]), P(new THREE.BoxGeometry(len + 2, .06, B.w - 2.2), top, [0, .03, 0]),
      P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, hw - .5]), P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, -hw + .5])];
    const piers = (col, n = 2) => Array.from({ length: n }, (_, i) => P(new THREE.BoxGeometry(1.8, 12, B.w - .6), col, [(n === 1 ? 0 : -.3 + .6 * i / (n - 1)) * len, -6, 0]));
    const STYLES = {
      // Long Biên (Hà Nội): a long dark-red steel truss on stone piers, the frames criss-crossing over the road
      longbien: () => { const p = [...deck('#6d6a66'), ...piers('#9c9284', 3)], rust = '#7a4a3a', n = Math.round(len / 3);
        for (const sz of [-1, 1]) { const zz = sz * (hw - .15);
          p.push(P(new THREE.BoxGeometry(len + 2, .3, .3), rust, [0, 4.6, zz]), P(new THREE.BoxGeometry(len + 2, .3, .3), rust, [0, .45, zz]));
          for (let i = 0; i <= n; i++) { const x = -len / 2 - 1 + i * (len + 2) / n; p.push(P(new THREE.BoxGeometry(.24, 4.3, .24), rust, [x, 2.5, zz]));
            if (i < n) { const dx = (len + 2) / n, l = Math.hypot(dx, 4.2), a = Math.atan2(4.2, dx); p.push(P(new THREE.BoxGeometry(l, .16, .16), rust, [x + dx / 2, 2.5, zz], [0, 0, (i % 2 ? 1 : -1) * a])); } } }
        for (let i = 0; i <= n; i += 2) p.push(P(new THREE.BoxGeometry(.2, .2, B.w), rust, [-len / 2 - 1 + i * (len + 2) / n, 4.6, 0]));
        return p; },
      // the Story Bridge (Brisbane): grey-blue steel, tall over its two piers and dipping to the middle, as a cantilever does
      story: () => { const p = [...deck('#6f7880'), ...piers('#a8a296')], st = '#5a6a7a', n = 12;
        for (const sz of [-1, 1]) { const zz = sz * (hw - .15), top = x => 1.6 + 5.4 * Math.pow(Math.abs(x) / (len / 2), 1.6) * (1 - .3 * smooth(len * .42, len * .5 + 1, Math.abs(x)));
          for (let i = 0; i < n; i++) { const xa = -len / 2 - 1 + i * (len + 2) / n, xb = xa + (len + 2) / n, ya = top(xa), yb = top(xb), l = Math.hypot(xb - xa, yb - ya);
            p.push(P(new THREE.BoxGeometry(l, .32, .32), st, [(xa + xb) / 2, (ya + yb) / 2, zz], [0, 0, Math.atan2(yb - ya, xb - xa)]), P(new THREE.BoxGeometry(.22, ya, .22), st, [xa, ya / 2, zz]));
            const dl = Math.hypot(xb - xa, ya), da = Math.atan2(ya, xb - xa); p.push(P(new THREE.BoxGeometry(dl, .14, .14), st, [(xa + xb) / 2, ya / 2, zz], [0, 0, (i < n / 2 ? -1 : 1) * da])); } }
        for (const f of [-.3, .3]) p.push(P(new THREE.BoxGeometry(.4, .4, B.w), st, [f * len, 6, 0]));
        return p; },
      // Princes Bridge (Melbourne): sandstone on three arches, a stone balustrade and green lamp posts
      princes: () => { const p = [P(new THREE.BoxGeometry(len + 2, .9, B.w + .4), '#c9b28a', [0, -.45, 0]), P(new THREE.BoxGeometry(len + 2, .06, B.w - 2.2), '#b4b9bc', [0, .03, 0]),
          P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, hw - .5]), P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, -hw + .5])];
        for (const sz of [-1, 1]) { p.push(P(new THREE.BoxGeometry(len + 2, .85, .3), '#d8c49a', [0, .45, sz * (hw + .05)]));
          for (let i = 0; i < 3; i++) { const cx = (-1 + i) * len / 3; p.push(P(new THREE.TorusGeometry(len / 6 - .4, .45, 5, 16, Math.PI), '#bfa67a', [cx, -4.4, sz * (hw - .3)], [0, 0, 0], [1, .8, 1])); }
          for (let i = 0; i <= 4; i++) { const x = -len / 2 + i * len / 4; p.push(P(new THREE.CylinderGeometry(.1, .14, 3, 6), '#2f5a3a', [x, 1.5, sz * (hw + .05)]), P(new THREE.SphereGeometry(.28, 8, 6), '#fff4c8', [x, 3.1, sz * (hw + .05)])); } }
        for (let i = 0; i < 4; i++) p.push(P(new THREE.BoxGeometry(2, 10, B.w), '#bfa67a', [(-1.5 + i) * len / 3, -5.6, 0]));
        return p; },
      // Chùa Cầu (Hội An): a little covered wooden footbridge with red posts, yellow walls and a tiled roof
      chuacau: () => { const p = [P(new THREE.BoxGeometry(len + 1, .4, B.w), '#8a5a3b', [0, -.2, 0])], n = Math.round(len / 2);
        for (const sz of [-1, 1]) { p.push(P(new THREE.BoxGeometry(len + 1, .7, .12), '#e8c03a', [0, .35, sz * (hw - .06)]));
          for (let i = 0; i <= n; i++) p.push(P(new THREE.BoxGeometry(.2, 2.4, .2), '#c0392b', [-len / 2 - .5 + i * (len + 1) / n, 1.2, sz * (hw - .1)]));
          p.push(P(new THREE.BoxGeometry(len + 2.4, .12, hw + .9), '#a24e3a', [0, 2.75, sz * (hw + .9) / 2 * .95], [sz * .5, 0, 0])); }
        p.push(P(new THREE.BoxGeometry(len + 2.6, .2, .3), '#5a3a2a', [0, 3.2, 0]), P(new THREE.BoxGeometry(1.2, 1.4, 1.2), '#f2c230', [0, 3.6, 0]), P(new THREE.ConeGeometry(1, .7, 4), '#a24e3a', [0, 4.6, 0], [0, Math.PI / 4, 0]));
        for (let i = 0; i < 2; i++) p.push(P(new THREE.BoxGeometry(1.4, 6, B.w + .2), '#9c8a6a', [(-.3 + .6 * i) * len, -3.2, 0]));
        return p; }
    };
    if (STYLES[B.style]) parts.length = 0, parts.push(...STYLES[B.style]());
    else if (B.style !== 'harbour') parts.length = 0, parts.push(...plain());
    const br = new THREE.Mesh(merge(parts), toonVC()); br.castShadow = true; br.receiveShadow = true; br.position.set(...(B.axis === 'z' ? [B.c, y, (B.a0 + B.a1) / 2] : [(B.a0 + B.a1) / 2, y, B.c]) satisfies [number, number, number]); if (B.axis === 'z') br.rotation.y = -Math.PI / 2; scene.add(br);
    // railings keep little explorers on the bridge
    W.boxes.push({ ...bridgeBox(B, B.a0, B.a1, hw - .1, hw + .3), bottom: y }, { ...bridgeBox(B, B.a0, B.a1, -hw - .3, -hw + .1), bottom: y });
    // (Round U, owner: no step where a road meets a bridge) the deck is walked on over the bridge itself; for 1.2 m past each
    // end (the apron) the road is held at the deck's height and its bed carries you on and off without a step (short enough
    // to leave room for the gentle climb to a junction close by: the Phố Hai Quê bridge and the ring road)
    W.platforms.push({ ...bridgeBox(B, B.a0, B.a1, -B.w / 2, B.w / 2), y: y + .1, bridge: B.id, apron: bridgeBox(B, B.a0 - 1.2, B.a1 + 1.2, -B.w / 2, B.w / 2) });
  }

  // ---------- shrines ----------
  const shrineBase = merge([
    P(new THREE.CylinderGeometry(3.4, 3.8, .6, 8), '#8f8a80', [0, .3, 0]), P(new THREE.CylinderGeometry(2.6, 3, .4, 8), '#a8a296', [0, .8, 0]),
    ...[0, 1, 2, 3].map(i => P(new THREE.BoxGeometry(.6, 3.2, .6), '#6e6a64', [Math.cos(i * 1.571 + .785) * 2.4, 2.2, Math.sin(i * 1.571 + .785) * 2.4])),
    P(new THREE.ConeGeometry(2.9, 1.6, 4), '#5e5a54', [0, 4.4, 0], [0, .785, 0])
  ]);
  SHRINES.forEach(s => {
    const y = heightAt(s.x, s.z);
    const g = new THREE.Group(); g.position.set(s.x, y - .1, s.z);
    const sb = new THREE.Mesh(shrineBase, toonVC({ roughness: .8 })); sb.castShadow = sb.receiveShadow = true; g.add(sb);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(.7, 0), glow('#ff9a3a')); core.position.y = 2.3; g.add(core);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, .06, 6, 30), glow('#ffb35a', .8)); ring.position.y = 2.3; ring.rotation.x = Math.PI / 2; g.add(ring);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, 60, 8, 1, true), glow('#ff9a3a', .18)); beam.position.y = 32; g.add(beam);
    scene.add(g); W.shrineMeshes[s.id] = { core, ring, beam };
    W.colliders.push(...[0, 1, 2, 3].map(i => ({ x: s.x + Math.cos(i * 1.571 + .785) * 2.4, z: s.z + Math.sin(i * 1.571 + .785) * 2.4, r: .5 })));
    W.updaters.push((dt, t) => { core.rotation.y += dt * 1.2; core.position.y = 2.3 + Math.sin(t * 2) * .15; ring.rotation.z += dt * .6; });
  });
  W.setShrineDone = (id, done) => {
    const m = W.shrineMeshes[id]; if (!m) return;
    const col = done ? '#5fe0ff' : '#ff9a3a';
    m.core.material.color.set(col); m.ring.material.color.set(done ? '#9ff0ff' : '#ffb35a'); m.beam.material.color.set(col); m.beam.visible = true;
  };

  // ---------- towers ----------
  TOWERS.forEach(tw => {
    const y = heightAt(tw.x, tw.z), H = TOWER_H;
    const legs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    const parts = [];
    legs.forEach(([a, b]) => parts.push(P(new THREE.BoxGeometry(.7, H, .7), '#5a5650', [a * 2.4, H / 2, b * 2.4])));
    for (let k = 1; k < 6; k++) parts.push(P(new THREE.BoxGeometry(5.6, .35, 5.6), '#6e6a64', [0, k * H / 6, 0]));
    parts.push(P(new THREE.CylinderGeometry(4.2, 3.6, .6, 10), '#7a766e', [0, H + .3, 0]));
    const body = new THREE.Mesh(merge(parts), toonVC({ roughness: .7, metalness: .15 })); body.castShadow = true;
    const panels = new THREE.Mesh(new THREE.BoxGeometry(4.2, H - 2, 4.2), glow('#ff9a3a', .22)); panels.position.y = H / 2;
    const top = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), glow('#ff9a3a')); top.position.y = H + 2.2;
    const g = new THREE.Group(); g.add(body, panels, top); g.position.set(tw.x, y - .2, tw.z); scene.add(g);
    W.towerMeshes[tw.id] = { panels, top, y: y - .2 };
    W.colliders.push({ x: tw.x, z: tw.z, r: 3.4, top: y - .2 + H + .6 });
    // the round roof is walkable all over (it used to push children out from the middle, off the edge)
    W.platforms.push({ x0: tw.x - 4.1, x1: tw.x + 4.1, z0: tw.z - 4.1, z1: tw.z + 4.1, cx: tw.x, cz: tw.z, r: 4.1, y: y - .2 + H + .6, tower: tw.id });
    W.updaters.push((dt, t) => { top.rotation.y += dt; top.position.y = H + 2.2 + Math.sin(t * 1.5) * .2; });
  });
  W.setTowerDone = (id, done) => { const m = W.towerMeshes[id]; if (!m) return; const c = done ? '#5fe0ff' : '#ff9a3a'; m.panels.material.color.set(c); m.top.material.color.set(c); };

  // ---------- Leafies (hidden little forest spirits) ----------
  const leafyRock = merge([P(new THREE.DodecahedronGeometry(.9, 0), '#b0aaa0', [0, .45, 0], [0, 0, 0], [1, .75, 1]), P(new THREE.ConeGeometry(.12, .5, 4), '#5fbf4a', [0, 1.25, 0], [0, 0, .3])]);
  LEAFIES.forEach(lf => {
    const y = heightAt(lf.x, lf.z);
    let obj;
    if (lf.kind === 'rock') { obj = new THREE.Mesh(leafyRock, toonVC()); obj.position.set(lf.x, y - .05, lf.z); }
    else { obj = sprite('✨', 1.3); obj.position.set(lf.x, y + 1.2, lf.z); W.updaters.push((dt, t) => { obj.material.rotation = t; obj.scale.setScalar(1.1 + Math.sin(t * 4 + lf.x) * .25); }); }
    scene.add(obj); W.leafyMeshes[lf.id] = obj;
  });
  W.hideLeafy = id => { const o = W.leafyMeshes[id]; if (o) o.visible = false; };

  // ---------- simple animals ----------
  const buffaloGeo = merge([
    P(new THREE.BoxGeometry(1.6, 1.3, 2.8), '#55555e', [0, 1.4, 0]), P(new THREE.BoxGeometry(1, 1, 1.1), '#4a4a52', [0, 1.7, 1.8]),
    ...[[.55, .9], [-.55, .9], [.55, -.9], [-.55, -.9]].map(([x, z]) => P(new THREE.CylinderGeometry(.18, .16, 1, 6), '#44444c', [x, .5, z])),
    P(new THREE.SphereGeometry(.12, 6, 5), '#ffffff', [.3, 1.9, 2.36]), P(new THREE.SphereGeometry(.12, 6, 5), '#ffffff', [-.3, 1.9, 2.36])
  ]);
  // A separate draw preserves the exterior but lets a rider see past the large storybook horns.
  const buffaloHorns = merge([P(new THREE.TorusGeometry(.7, .12, 5, 12, Math.PI), '#d8d0c0', [0, 2.2, 1.9])]);
  // (owner, 30 Oct 2026 AEDT) the Vietnamese yellow cow (bò vàng) beside the grey water buffalo: golden coat, a hump over
  // the shoulders, a dewlap, short horns turning up, ears out to the side and a dark tail tuft. Both can be ridden, and
  // both swim: in deep water they float with the head and back above it (js/player.ts)
  const coat = '#c98a4b', dark = '#a86b35', cream = '#efd2a8', hoof = '#3a2a22';
  const cowGeo = merge([
    P(new THREE.CapsuleGeometry(.58, 1.25, 4, 10), coat, [0, 1.45, 0], [Math.PI / 2, 0, 0]),
    P(new THREE.SphereGeometry(.42, 10, 8), dark, [0, 1.98, .7], [0, 0, 0], [1, .65, 1.15]),
    P(new THREE.SphereGeometry(.5, 10, 8), '#ddb07a', [0, 1.18, .05], [0, 0, 0], [.95, .45, 1.6]),
    P(new THREE.CapsuleGeometry(.26, .5, 4, 8), coat, [0, 1.72, 1.32], [-.9, 0, 0]),
    P(new THREE.SphereGeometry(.3, 8, 6), '#d9a26a', [0, 1.22, 1.3], [0, 0, 0], [.4, 1, .8]),
    P(new THREE.CapsuleGeometry(.27, .42, 4, 8), coat, [0, 1.74, 1.8], [1.15, 0, 0]),
    P(new THREE.SphereGeometry(.25, 10, 8), cream, [0, 1.5, 2.06], [0, 0, 0], [1.05, .8, 1]),
    ...[-1, 1].flatMap(s => [P(new THREE.SphereGeometry(.05, 6, 5), hoof, [s * .09, 1.48, 2.3]),
      P(new THREE.SphereGeometry(.2, 8, 6), dark, [s * .4, 1.92, 1.62], [0, 0, s * .4], [1.3, .45, .7]),
      P(new THREE.SphereGeometry(.08, 6, 5), '#ffffff', [s * .23, 1.9, 1.98]), P(new THREE.SphereGeometry(.05, 6, 5), hoof, [s * .25, 1.91, 2.04])]),
    ...[[.36, .85], [-.36, .85], [.36, -.85], [-.36, -.85]].flatMap(([x, z]) => [P(new THREE.CylinderGeometry(.13, .11, 1.05, 7), coat, [x, .6, z]), P(new THREE.CylinderGeometry(.12, .13, .16, 7), hoof, [x, .08, z])]),
    P(new THREE.CylinderGeometry(.035, .035, .9, 5), coat, [0, 1.15, -1.32], [.18, 0, 0]), P(new THREE.SphereGeometry(.1, 6, 5), hoof, [0, .7, -1.4], [0, 0, 0], [1, 1.6, 1])
  ]);
  const cowHorns = merge([-1, 1].flatMap(s => [P(new THREE.CylinderGeometry(.06, .08, .16, 6), '#efe4cc', [s * .2, 2.0, 1.66], [0, 0, s * -.9]),
    P(new THREE.ConeGeometry(.06, .26, 6), '#efe4cc', [s * .3, 2.14, 1.66], [0, 0, s * -.3])]));
  W.buffalo = []; W.cows = []; W.rideAnimals = [];
  const RIDE_ANIMALS = [
    { kind: 'buffalo', list: W.buffalo, geo: buffaloGeo, horns: buffaloHorns, icon: '🐃', label: () => T('Ride buffalo', 'Cưỡi trâu'), at: [[PADDIES.x - 6, PADDIES.z + 4], [V.x - 26, V.z + 18]] },
    { kind: 'cow', list: W.cows, geo: cowGeo, horns: cowHorns, icon: '🐄', label: () => T('Ride the cow', 'Cưỡi bò'), at: [[PADDIES.x + 7, PADDIES.z - 5], [V.x - 20, V.z + 26]] }
  ];
  for (const R of RIDE_ANIMALS) R.at.forEach(([x, z], i) => {
    const m = new THREE.Mesh(R.geo, toonVC()); m.position.set(x, heightAt(x, z), z); m.userData.moving = true; scene.add(m); // it wanders and rests: never part of the solid map (js/solids.js)
    const horns = new THREE.Mesh(R.horns, m.material); m.add(horns);
    const sh = blobShadow(); sh.scale.setScalar(R.kind === 'cow' ? 1.9 : 2.2); scene.add(sh);
    const b = { id: R.kind + i, kind: R.kind, swims: true, mesh: m, shadow: sh, firstPersonHide: [horns], home: [x, z], tx: x, tz: z, rider: null, yaw: 0 };
    R.list.push(b); W.rideAnimals.push(b);
    W.interactables.push({ id: b.id, get x() { return m.position.x; }, get z() { return m.position.z; }, r: 3, icon: R.icon, label: R.label, visible: () => !b.rider, act: (pl, game) => game.mount(pl, b) });
  });
  W.updaters.push((dt, t) => W.rideAnimals.forEach(b => {
    if (b.rider) return;
    const m = b.mesh, dx = b.tx - m.position.x, dz = b.tz - m.position.z, d = Math.hypot(dx, dz);
    // (Round V, owner 13 Oct) after a ride it runs back home; from far away, out of every child's sight, it is simply home again
    if (b.back && d > 40 && !(W.heroesNear && W.heroesNear(m.position.x, m.position.z, 30))) { m.position.x = b.tx = b.home[0]; m.position.z = b.tz = b.home[1]; b.back = false; }
    else if (d < .5) { b.back = false; if (Math.random() < dt * .2) { b.tx = b.home[0] + (Math.random() - .5) * 16; b.tz = b.home[1] + (Math.random() - .5) * 16; } }
    else { const sp = b.back ? 3.2 : 1.2; b.yaw = Math.atan2(dx, dz); m.rotation.y = b.yaw; m.position.x += dx / d * dt * sp; m.position.z += dz / d * dt * sp; }
    // Grazing animals must respect the same walls as their riders. A later house or
    // landmark used to let them wander inside it, leaving no place to mount them.
    if (W.collide) {
      const x = m.position.x, z = m.position.z; W.collide(m.position, 1.1);
      if (Math.hypot(m.position.x - x, m.position.z - z) > .05) { b.tx = m.position.x; b.tz = m.position.z; }
    }
    m.position.y = Math.max(heightAt(m.position.x, m.position.z), WATER - RIDE_SWIM); b.shadow.position.set(m.position.x, m.position.y + .05, m.position.z);
  }));
  // ducks on the lake and chickens in the village (just for company)
  const critters = [];
  for (let i = 0; i < 6; i++) { const s = sprite('🦆', 1.4); critters.push({ s, cx: LAKE.x + (Math.random() - .5) * 30, cz: LAKE.z + (Math.random() - .5) * 30, r: 3 + Math.random() * 4, a: Math.random() * 6, sp: .3 + Math.random() * .3, water: true }); }
  for (let i = 0; i < 5; i++) { const s = sprite(i % 2 ? '🐓' : '🐔', 1.1); critters.push({ s, cx: V.x - 8 + Math.random() * 20, cz: V.z - 20 + Math.random() * 8, r: 2 + Math.random() * 3, a: Math.random() * 6, sp: .4 }); }
  for (let i = 0; i < 14; i++) { const s = sprite('🦋', .7); critters.push({ s, cx: PLATEAU.x + (Math.random() - .5) * 160, cz: PLATEAU.z + (Math.random() - .5) * 160, r: 3, a: Math.random() * 6, sp: .8, fly: true }); }
  const fireflies = [];
  for (let i = 0; i < 40; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ color: '#fff7a0', transparent: true, opacity: 0, depthWrite: false, fog: false })); s.scale.setScalar(.25); const x = BAMBOO.x + (Math.random() - .5) * 80, z = BAMBOO.z + (Math.random() - .5) * 80; s.position.set(x, heightAt(x, z) + 1.5, z); scene.add(s); fireflies.push({ s, ox: x, oz: z, a: Math.random() * 6 }); }
  for (let i = 0; i < 30; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ color: '#fff7a0', transparent: true, opacity: 0, depthWrite: false, fog: false })); s.scale.setScalar(.25); const x = V.x + (Math.random() - .5) * 60, z = V.z + (Math.random() - .5) * 60; s.position.set(x, heightAt(x, z) + 1.5, z); scene.add(s); fireflies.push({ s, ox: x, oz: z, a: Math.random() * 6 }); }
  W.fireflies = fireflies;
  critters.forEach(c => { c.cx = clamp(c.cx, -HALF + 30, HALF - 30); c.cz = clamp(c.cz, -HALF + 30, HALF - 30); scene.add(c.s); c.s.userData.critter = c; });
  W.critters = critters;
  W.updaters.push((dt, t) => {
    critters.forEach(c => {
      c.a += dt * c.sp; const x = c.cx + Math.cos(c.a) * c.r, z = c.cz + Math.sin(c.a) * c.r;
      const g = c.water ? WATER + .4 : heightAt(x, z) + (c.fly ? 1.6 + Math.sin(t * 3 + c.r) * .5 : .5);
      c.s.position.set(x, c.water ? Math.max(g, heightAt(x, z) + .5) : g, z);
    });
    const night = W.isNight();
    fireflies.forEach(f => { f.a += dt; const on = night && !(f.caught > performance.now() / 1000); f.s.visible = on; f.s.material.opacity = on ? .6 + Math.sin(t * 3 + f.a * 3) * .4 : 0; f.s.position.x = f.ox + Math.sin(f.a * .7) * 2; f.s.position.z = f.oz + Math.cos(f.a * .5) * 2; });
  });

  // ---------- walking surface ----------
  // Ground height including bridges and tower tops (only if you are already above them).
  W.groundAt = (x, z, y = 1e9) => {
    let g = heightAt(x, z);
    for (const p of W.platforms) if (x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1 && (!p.r || Math.hypot(x - p.cx, z - p.cz) < p.r) && y >= p.y - 1.2) g = Math.max(g, p.y);
    // on a road: stand on the road surface (roads.js keeps it), unless you are well below it (under a bridge)
    if (W.roadTop) { const r = W.roadTop.get(Math.round(x * 2) * 8192 + Math.round(z * 2)); if (r != null && y >= r - 1.2) g = Math.max(g, r - .03); }
    return g;
  };
  W.platformAt = (x, z, y) => W.platforms.find(p => x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1 && (!p.r || Math.hypot(x - p.cx, z - p.cz) < p.r) && Math.abs(y - p.y) < .3);
  // Solid round things are sorted into a 16 m grid (rebuilt whenever one is added), so each step only checks
  // the few nearby ones instead of all ~1,500 (phones).
  const CELL = 16; let grid = null, gridN = -1, gridR = 0;
  const cellKey = (gx, gz) => (gx + 64) * 256 + (gz + 64);
  const buildGrid = () => {
    grid = new Map(); gridR = 0; gridN = W.colliders.length;
    for (const c of W.colliders) { gridR = Math.max(gridR, c.r); const k = cellKey(Math.floor(c.x / CELL), Math.floor(c.z / CELL)); let l = grid.get(k); if (!l) grid.set(k, l = []); l.push(c); }
    gridR += 1; // room for a collider that grows a little later
  };
  W.collide = (pos, r = .5) => {
    if (gridN !== W.colliders.length) buildGrid();
    const reach = r + gridR, x0 = Math.floor((pos.x - reach) / CELL), x1 = Math.floor((pos.x + reach) / CELL), z0 = Math.floor((pos.z - reach) / CELL), z1 = Math.floor((pos.z + reach) / CELL);
    for (let gx = x0; gx <= x1; gx++) for (let gz = z0; gz <= z1; gz++) {
      const l = grid.get(cellKey(gx, gz)); if (!l) continue;
      for (const c of l) {
        if (c.top != null && pos.y != null && pos.y >= c.top - .35) continue; // standing on top of it (a tower's roof)
        const dx = pos.x - c.x, dz = pos.z - c.z, m = c.r + r; if (dx * dx + dz * dz >= m * m) continue;
        const d = Math.hypot(dx, dz);
        if (d > 1e-4) { pos.x = c.x + dx / d * m; pos.z = c.z + dz / d * m; }
      }
    }
    // houses and walls: push out of the box the shortest way
    for (const b of W.boxes) {
      if (b.bottom != null && pos.y != null && pos.y + 1.6 < b.bottom) continue;
      if (pos.x < b.x0 - r || pos.x > b.x1 + r || pos.z < b.z0 - r || pos.z > b.z1 + r) continue;
      if (b.rot != null) {
        const co = Math.cos(b.rot), si = Math.sin(b.rot), dx = pos.x - b.cx, dz = pos.z - b.cz;
        let lx = co * dx - si * dz, lz = si * dx + co * dz;
        const hx = b.hw + r, hz = b.hd + r;
        if (Math.abs(lx) > hx || Math.abs(lz) > hz) continue;
        if (hx - Math.abs(lx) < hz - Math.abs(lz)) lx = (lx < 0 ? -1 : 1) * hx;
        else lz = (lz < 0 ? -1 : 1) * hz;
        pos.x = b.cx + co * lx + si * lz; pos.z = b.cz - si * lx + co * lz;
        continue;
      }
      const pen = [pos.x - (b.x0 - r), (b.x1 + r) - pos.x, pos.z - (b.z0 - r), (b.z1 + r) - pos.z], k = pen.indexOf(Math.min(...pen));
      if (k === 0) pos.x = b.x0 - r; else if (k === 1) pos.x = b.x1 + r; else if (k === 2) pos.z = b.z0 - r; else pos.z = b.z1 + r;
    }
    pushOutOfSolids(W, pos, r); // the solid map: walls, fences, rocks, kiosks… (js/solids.js)
    pos.x = clamp(pos.x, -HALF + 8, HALF - 8); pos.z = clamp(pos.z, -HALF + 8, HALF - 8);
  };
  W.update = (dt, t) => W.updaters.forEach(f => f(dt, t));
  return W;
}

// (round T4a) the water map: rgb the colour of the water at each spot of the valley (each river its own, deeper darker),
// alpha how near the shore it is (0.2 deep … 1 at the water's edge: the foam line). Painted once, kept on the device.
// (owner, 29 Oct AEDT: "Hồ Gươm should be in a lake but it is on dry land") the two ponds keep a hint of their real green, but
// read as water: the old jade green looked like grass from above
