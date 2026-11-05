// Story films (round R): each page of a tale is a short 3D film where the story really happens on screen,
// acted by the valley's own kind of people, animals and things, timed to the narration. A page is a script
// (js/content/films.js) that builds its set, places the actors and lists what they do and when:
//   S.walk(actor, t, [x, z])        walks there (turns first), returns when it arrives
//   S.do(actor, t, 'kneel', dur)    a pose or action: kneel dig plant water eat point talk sad bow hug carry
//                                   give pull swing throw stretch surprised sitground lie cheer wave ride
//   S.mood(actor, t, 'happy')       the face: smile happy sad o (surprised) sleep; S.talk() moves the mouth
//   S.tw(t, dur, k => …)            anything else that changes over time (grow, fall, change colour, fly…)
//   S.cam(t, dur, pos, look)        the camera glides to a new shot (in calm mode it cuts instead)
//   S.help(t, en, vi, act)          the child helps: the film waits for a tap anywhere on the picture
//   S.say(t, en, vi)                (owner, 13 Oct) the narrator tells what happens next: the film waits at t until
//                                   the narrator is free, so a long action is told, never played on in silence
// Everything is drawn by one small renderer that is made once and reused by every film, with no shadows
// and few lights, so it runs on older phones. Tapping a character makes it wiggle (little ones love that).
import { THREE, P, merge, toonVC, toon, glow } from './gfx.js';
import type { BufferGeometry, CanvasTexture, Material, Mesh, Object3D } from '../vendor/three.module.js';

type PaintedCanvasTexture = CanvasTexture & { paint(top: string, bottom: string): void };
type FilmApi = { onSay?: (en: string, vi: string, kind?: string) => Promise<unknown>; readonly now: any; page(k: number): Promise<unknown>; narrated(): void; pause(): void; close(): void };
import { buildAvatar, drawFeatures, OUTLINED } from './avatar.js';
import { reduceMotion } from './state.js';
import { T } from './i18n.js';
import { sayAsync } from './voice.js';
import { SFX } from './audio.js';
import { el, esc } from './util.js';
import { pic } from './art.js';
import { storyLook } from './content/film-looks.js';

const H = Math.PI / 2;
export const io = k => k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
export const lin = k => k;
export const outBack = k => 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2;
const lerp = (a, b, k) => a + (b - a) * k;
const v3 = a => Array.isArray(a) ? new THREE.Vector3(...a) : a.clone();

// ---------- shared shapes (made once) ----------
const own = <T extends BufferGeometry>(g: T): T => { g.userData.film = true; return g; };
const VC = toonVC(); VC.userData.shared = true;
export const mesh = parts => new THREE.Mesh(own(merge(parts)), VC);
const S_ = (r: number, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h);
const Cyl = (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s);
const Cone = (r, h, s = 10) => new THREE.ConeGeometry(r, h, s);
const Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const G3 = { S: S_, Cyl, Cone, Box };
export const mat = (c, extra = null) => { const m = toon(c, Object.assign({}, extra || {})); m.userData.film = true; return m; };
const solid = (geo, c, extra = null) => new THREE.Mesh(own(geo), mat(c, extra));

// ---------- faces that show feelings, and a mouth that moves while talking ----------
const faces = {};
function face(look, mood) {
  const k = look.hair + look.skin + mood; if (faces[k]) return faces[k];
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  drawFeatures(x, S, look, mood); // (v1.08e faces) every mood in the valley's soft-lid style: smile, happy, sad, o, sleep ...
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (faces[k] = t);
}

// ---------- the actors ----------
export const LOOK = (o) => Object.assign({ style: 'shirt', color: '#3b6fe0', hat: 'none', back: 'none', hair: '#1d1412', hairStyle: 'short', skin: '#e0aa80', glider: 0, shoe: '#5a3a22' }, o);
// the people's shapes and paints are shared with the valley, so a page never throws those away
const KEEP = new WeakSet();
function person(look, scale = 1) {
  const A = buildAvatar(LOOK(look), null);
  const i = OUTLINED.indexOf(A); if (i >= 0) OUTLINED.splice(i, 1); // the valley hides far outlines; a film keeps them
  A.root.scale.setScalar(scale);
  const a = { A, o: A.root, state: 'idle', speed: 0, mood: 'smile', talkUntil: -1, px: 0, pz: 0, yaw: 0, look: LOOK(look), wig: 0, blinkAt: undefined as number };
  A.root.userData.actor = a; A.faceMat.map = face(a.look, 'smile');
  A.root.traverse((o: Object3D) => {
    const meshObj = o as unknown as Mesh;
    if (meshObj.geometry) KEEP.add(meshObj.geometry);
    const m = meshObj.material;
    (Array.isArray(m) ? m : m ? [m] : []).forEach(mat => KEEP.add(mat));
  });
  return a;
}
// lean the body forward (+) or back (−) from the hips, taking the head along so it stays on the neck
function lean(A, a, nod = 0) {
  A.torso.rotation.x = a; A.torso.position.set(0, .6 - .6 * Math.cos(a), -.6 * Math.sin(a));
  A.head.position.set(0, .6 + .73 * Math.cos(a), .73 * Math.sin(a)); A.head.rotation.x = a * .7 + nod;
}
const BASE = { walk: 'walk', ride: 'ride', sit: 'sit', cheer: 'cheer', wave: 'wave', dance: 'dance' };
function pose(a, t) {
  const A = a.A, s = a.state;
  A.anim(BASE[s] || 'idle', t, s === 'walk' ? a.speed * 3 : s === 'ride' ? 4 : 0);
  lean(A, 0);
  const sw = Math.sin(t * 7);
  switch (s) {
    case 'kneel': case 'dig': case 'plant': case 'pick':
      A.rig.position.y = -.3; A.legL.rotation.x = -1.5; A.legR.rotation.x = -.2; A.legR.rotation.z = -.1;
      lean(A, s === 'kneel' ? .2 : .5);
      if (s === 'dig') { A.armR.rotation.x = -1 + sw * .45; A.armL.rotation.x = -.9 - sw * .45; }
      if (s === 'plant') { A.armR.rotation.x = -.8 + Math.max(0, sw) * .3; A.armL.rotation.x = -.5; }
      if (s === 'pick') { A.armR.rotation.x = -1.1; A.armL.rotation.x = -1.1; A.armR.rotation.z = .2; A.armL.rotation.z = -.2; }
      break;
    case 'water': lean(A, .12); A.armR.rotation.x = -1.2; A.armR.rotation.z = -.05; A.armL.rotation.x = -.6; break;
    case 'eat': A.armR.rotation.x = -2.1 + Math.sin(t * 6) * .25; A.armR.rotation.z = .45; A.armL.rotation.x = -1; lean(A, .05, Math.sin(t * 6) * .06); break;
    case 'point': A.armR.rotation.x = -1.6; A.armR.rotation.z = -.1; lean(A, .05); break;
    case 'talk': lean(A, 0, Math.sin(t * 5) * .07); A.armR.rotation.x = -.6 + Math.sin(t * 3) * .3; A.armL.rotation.x = -.3; break;
    case 'sad': lean(A, .15, .25); A.armL.rotation.z = .05; A.armR.rotation.z = -.05; break;
    case 'bow': lean(A, .75, .2); A.armL.rotation.x = -.4; A.armR.rotation.x = -.4; A.armL.rotation.z = -.25; A.armR.rotation.z = .25; break;
    case 'hug': A.armL.rotation.set(-1.3, 0, -.55); A.armR.rotation.set(-1.3, 0, .55); lean(A, .1); break;
    case 'carry': A.armL.rotation.set(-1.25, 0, -.2); A.armR.rotation.set(-1.25, 0, .2); break;
    case 'give': A.armL.rotation.set(-1.4, 0, -.15); A.armR.rotation.set(-1.4, 0, .15); lean(A, .15); break;
    case 'pull': A.armL.rotation.set(-2.6, 0, -.1); A.armR.rotation.set(-2.6, 0, .1); lean(A, -.25 + Math.sin(t * 9) * .05); break;
    case 'swing': A.armR.rotation.set(-2.3 + Math.sin(t * 5) * 1.1, 0, -.2); A.armL.rotation.x = -.8; A.torso.rotation.y = Math.sin(t * 5) * .3; break;
    case 'throw': A.armR.rotation.x = -2.8; lean(A, -.15); break;
    case 'stretch': A.armL.rotation.z = 2.9; A.armR.rotation.z = -2.9; lean(A, -.12, -.2); break;
    case 'surprised': A.armL.rotation.z = 2.1; A.armR.rotation.z = -2.1; lean(A, -.1, -.15); A.rig.position.y = Math.max(0, Math.sin(t * 9)) * .05; break;
    case 'sitground': A.rig.position.y = -.5; A.legL.rotation.set(-1.45, 0, .12); A.legR.rotation.set(-1.45, 0, -.12); A.armL.rotation.x = -.5; A.armR.rotation.x = -.5; break;
    case 'lie': A.rig.rotation.x = -H; A.rig.position.y = .14; A.rig.position.z = .55; A.armL.rotation.z = .3; A.armR.rotation.z = -.3; break;
    case 'situp': A.rig.position.y = -.5; A.legL.rotation.x = -1.45; A.legR.rotation.x = -1.45; A.armL.rotation.z = .5; A.armR.rotation.z = -.5; break;
    case 'ride': A.armL.rotation.x = -1; A.armR.rotation.x = -1; break;
  }
  if (a.hold) a.hold(A, t);
  // a tap on a character: a happy little hop
  if (a.wig > 0) { a.wig = Math.max(0, a.wig - 1 / 40); A.rig.position.y += Math.sin(a.wig * Math.PI) * .25; }
  // the mouth moves while the character speaks
  let m = t < a.talkUntil ? (Math.sin(t * 16) > 0 ? 'o' : a.mood === 'sad' ? 'sad' : 'smile') : a.mood;
  // (v1.08e faces) a soft blink every few seconds while smiling and quiet (each actor at their own moment)
  if (m === 'smile' && t >= a.talkUntil) { const b = (t + (a.blinkAt ??= Math.random() * 4)) % 3.6; if (b < .15) m = b < .04 || b >= .11 ? 'half' : 'blink'; }
  if (a._face !== m) { a._face = m; A.faceMat.map = face(a.look, m); A.faceMat.needsUpdate = true; }
  if (A.model) (A.life || (A.life = {} as any)).mood = m; // (v1.08b friends) a friend's model shows the same mood on its own face
}

// (v1.08b story, smoother films) soft motes of light drifting slowly through a scene: dust in the sun by day, fireflies
// at night (the sky's colour says which); 28 points in one draw call, so a film plays as fast as before
function motes(S) {
  const n = 28, pos = new Float32Array(n * 3), seed = [...Array(n)].map((_, i) => [Math.sin(i * 12.9898) * 43758.5453 % 1, Math.sin(i * 78.233) * 43758.5453 % 1, Math.sin(i * 39.425) * 43758.5453 % 1].map(v => Math.abs(v)));
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sky = (S.skyNow && S.skyNow[0]) || '#9ad0ff', night = parseInt(String(sky).slice(1, 3), 16) < 0x50;
  const m = new THREE.PointsMaterial({ color: night ? '#fff2a8' : '#ffffff', size: night ? .16 : .1, transparent: true, opacity: night ? .85 : .45, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(g, m); pts.userData.film = true; pts.frustumCulled = false; S.root.add(pts);
  S.every((dt, time) => { const c = S.camLook; for (let i = 0; i < n; i++) { const [a, b, d] = seed[i]; pos[i * 3] = c.x + (a - .5) * 16 + Math.sin(time * .3 + i) * .6; pos[i * 3 + 1] = .6 + b * 4 + Math.sin(time * .5 + i * 1.7) * .3; pos[i * 3 + 2] = c.z + (d - .5) * 10 + Math.cos(time * .25 + i) * .6; } g.attributes.position.needsUpdate = true; });
}

// ---------- the renderer (one for the whole session) ----------
let R = null;
function renderer() {
  if (R) return R;
  try {
    const r = new THREE.WebGLRenderer({ antialias: (devicePixelRatio || 1) < 2, powerPreference: 'low-power' });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.NoToneMapping;
    r.domElement.className = 'th-film';
    return (R = r);
  } catch (e) { return null; }
}

// sky colours as a soft gradient
function skyTex(): PaintedCanvasTexture {
  const c = document.createElement('canvas'); c.width = 2; c.height = 128;
  const t = new THREE.CanvasTexture(c) as PaintedCanvasTexture; t.colorSpace = THREE.SRGBColorSpace;
  t.paint = (top, bottom) => { const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, top); g.addColorStop(1, bottom); x.fillStyle = g; x.fillRect(0, 0, 2, 128); t.needsUpdate = true; };
  return t;
}
// (checks only) a film played faster, so every page of every film can be played through with no tap in a few minutes
export const filmRate = () => (typeof window !== 'undefined' && window.__svFilmRate) || 1;
const mixHex = (a, b, k) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();

// A film: made when the theatre opens a tale that has one, gone when the theatre closes.
export function createFilm(stage: HTMLElement, script: any, ctx: any = {}): FilmApi | null {
  const r = renderer(); if (!r || !script) return null;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(42, 1, .1, 600);
  const sky = skyTex(); scene.background = sky; scene.fog = new THREE.Fog('#cfefff', 60, 260);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xf1dfc0, 1.25), sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(30, 50, 25); scene.add(hemi, sun);
  if (script.look) { const fill = new THREE.DirectionalLight('#fff6e4', .55); fill.position.set(-12, 16, 25); scene.add(fill); }
  stage.appendChild(r.domElement);
  const help = el('div', 'film-help'); help.hidden = true; stage.appendChild(help);
  const ring = el('div', 'film-ring'); ring.hidden = true; stage.appendChild(ring);
  const calm = reduceMotion();
  let page = null, alive = true, last = performance.now(), clock = 0, w = 0, h = 0;
  const fit = () => { const W = stage.clientWidth, Hh = stage.clientHeight; if (W === w && Hh === h) return; w = W; h = Hh; r.setSize(W, Hh, false); r.domElement.style.width = W + 'px'; r.domElement.style.height = Hh + 'px'; cam.aspect = W / Math.max(1, Hh);
    // (owner, 10 Oct: "fix the screen issue") the shots are framed for a wide screen; on a tall phone screen the camera
    // opens up so the sides are not cut off (as much across as a 16:9 screen shows, at most 75° top to bottom)
    cam.fov = cam.aspect >= 16 / 9 ? 42 : Math.min(75, 2 * Math.atan(Math.tan(21 * Math.PI / 180) * (16 / 9) / cam.aspect) * 180 / Math.PI);
    cam.updateProjectionMatrix(); };
  const _p = new THREE.Vector3();
  let paused = false; // (a guide's real game is on screen instead: nothing to draw)
  const loop = now => {
    if (!alive) return; requestAnimationFrame(loop);
    const dt = Math.min(.05, (now - last) / 1000) * filmRate(); last = now; if (paused) return; clock += dt; fit();
    if (page) page.tick(dt, clock);
    r.render(scene, cam);
    if (page && page.hold && page.hold.at) { const p = page.hold.at(); _p.copy(p).project(cam); ring.style.left = ((_p.x + 1) / 2 * w) + 'px'; ring.style.top = ((1 - _p.y) / 2 * h) + 'px'; }
  };
  requestAnimationFrame(loop);
  // taps: help the story along, or make a character hop
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
  const onDown = e => { down = [e.clientX, e.clientY]; };
  const onUp = e => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 14 || !page) return; down = null;
    if (page.hold && page.hold.shown) { page.release(true); return; }
    const b = r.domElement.getBoundingClientRect(); ndc.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1);
    ray.setFromCamera(ndc, cam);
    for (const hit of ray.intersectObjects(page.root.children, true)) { let o = hit.object; while (o && !o.userData.actor && !o.userData.tap) o = o.parent; if (!o) continue; if (o.userData.actor) { o.userData.actor.wig = 1; SFX.tap(); } else o.userData.tap(); break; }
  };
  r.domElement.addEventListener('pointerdown', onDown); r.domElement.addEventListener('pointerup', onUp);

  // ---------- one page ----------
  function Page(this: any, k: number) {
    const S = this; S.root = new THREE.Group(); scene.add(S.root);
    S.ev = []; S.t = 0; S.len = 0; S.actors = []; S.tickers = []; S.hold = null; S.narrated = false; S.camT = null;
    S.camPos = new THREE.Vector3(0, 3, 12); S.camLook = new THREE.Vector3(0, 1, 0); S.follow = null;
    S.look = storyLook(script.look, k);
    S.calm = calm; S.k = k; S.ctx = ctx || {}; // (story films: the child's own look, name and companion)
    let resolve; S.done = new Promise(res => { resolve = res; });
    S.tw = (t, dur, fn, e = io) => { S.ev.push({ t, dur: calm && fn.cam ? 0 : Math.max(0, dur), fn, e }); S.len = Math.max(S.len, t + dur); return t + dur; };
    S.at = (t, fn) => S.tw(t, 0, (k, first) => { if (first) fn(); });
    S.add = (o, x = 0, y = 0, z = 0, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; S.root.add(o); o.traverse(c => { if (c.userData.tick) S.tickers.push(c.userData.tick); }); return o; };
    S.every = f => S.tickers.push(f);
    S.sky = (top, bottom, fog) => { sky.paint(top, bottom); (scene.fog as THREE.Fog).color.set(fog || bottom); S.skyNow = [top, bottom]; };
    S.skyTo = (t, dur, top, bottom) => { let from; return S.tw(t, dur, (k, first) => { if (first) from = S.skyNow.slice(); const a = mixHex(from[0], top, k), b = mixHex(from[1], bottom, k); sky.paint(a, b); scene.fog.color.set(b); if (k >= 1) S.skyNow = [top, bottom]; }, lin); };
    S.light = (sunI = 1.05, hemiI = .85) => { sun.intensity = Math.max(S.look ? .8 : .45, sunI); hemi.intensity = Math.max(S.look ? 1.1 : .65, hemiI); };
    S.lightTo = (t, dur, sunI, hemiI) => { let a, b; return S.tw(t, dur, (k, first) => { if (first) { a = sun.intensity; b = hemi.intensity; } sun.intensity = Math.max(S.look ? .8 : .45, lerp(a, sunI, k)); hemi.intensity = Math.max(S.look ? 1.1 : .65, lerp(b, hemiI, k)); }, lin); };
    // actors
    S.person = (look, x, z, yaw = 0, scale = 1) => { const a = person(look, scale); a.px = x; a.pz = z; a.yaw = yaw; S.add(a.o, x, 0, z, yaw); S.actors.push(a); return a; };
    S.face = (a, t, yaw, dur = .45) => { if (Array.isArray(yaw)) yaw = Math.atan2(yaw[0] - a.px, yaw[1] - a.pz); let y0 = a.yaw, d = ((yaw - y0 + Math.PI * 3) % (Math.PI * 2)) - Math.PI; a.yaw = y0 + d; S.tw(t, dur, k => { a.o.rotation.y = y0 + d * k; }); return t + dur; };
    S.walk = (a, t, to, speed = 1.3, state = 'walk') => {
      const x0 = a.px, z0 = a.pz, d = Math.hypot(to[0] - x0, to[1] - z0), dur = d / speed;
      if (d < .01) return t;
      S.face(a, t, Math.atan2(to[0] - x0, to[1] - z0), .3);
      S.tw(t, dur, (k, first) => { if (first) { a.state = state; a.speed = speed; } a.o.position.x = lerp(x0, to[0], k); a.o.position.z = lerp(z0, to[1], k); if (k >= 1) { a.state = 'idle'; a.speed = 0; } }, lin);
      a.px = to[0]; a.pz = to[1]; return t + dur;
    };
    S.do = (a, t, state, dur = 0) => { S.at(t, () => { a.state = state; }); if (dur) S.at(t + dur, () => { if (a.state === state) a.state = 'idle'; }); S.len = Math.max(S.len, t + dur); return t + dur; };
    S.mood = (a, t, m) => S.at(t, () => { a.mood = m; });
    S.talk = (a, t, dur) => { S.at(t, () => { a.talkUntil = clock + dur; }); return t + dur; };
    S.scale = (o, t, dur, s0, s1, e = io) => S.tw(t, dur, k => { o.scale.setScalar(lerp(s0, s1, k)); }, e);
    S.move = (o, t, dur, to, e = io, arc = 0) => { let from; return S.tw(t, dur, (k, first) => { if (first) from = o.position.clone(); o.position.set(lerp(from.x, to[0], k), lerp(from.y, to[1], k) + Math.sin(k * Math.PI) * arc, lerp(from.z, to[2], k)); }, e); };
    S.show = (o, t, on = true) => S.at(t, () => { o.visible = on; });
    // hand a thing to an actor's hand (or put it back in the world)
    S.grab = (a, t, o, pos = [0, -.5, .08], arm = 'armR', scale = 1) => S.at(t, () => { (arm === 'root' ? a.o : a.A[arm]).add(o); o.position.set(...pos); o.rotation.set(0, 0, 0); o.scale.setScalar(scale); });
    S.drop = (o, t, pos) => S.at(t, () => { S.root.attach(o); if (pos) o.position.set(...pos); });
    // camera: a position and a point to look at (arrays, or functions for a moving shot)
    const val = v => typeof v === 'function' ? v() : v;
    S.cam = (t, dur, pos, look) => {
      const fn = (k, first) => { if (first) { S.follow = null; S.cf = [S.camPos.clone(), S.camLook.clone()]; } const p = val(pos), l = val(look); S.camPos.set(lerp(S.cf[0].x, p[0], k), lerp(S.cf[0].y, p[1], k), lerp(S.cf[0].z, p[2], k)); S.camLook.set(lerp(S.cf[1].x, l[0], k), lerp(S.cf[1].y, l[1], k), lerp(S.cf[1].z, l[2], k)); if (k >= 1 && (typeof pos === 'function' || typeof look === 'function')) S.follow = [pos, look]; };
      fn.cam = true; return S.tw(t, dur, fn);
    };
    S.shot = (pos, look) => { S.camPos.set(...pos); S.camLook.set(...look); };
    S.where = a => () => { const p = a.o.getWorldPosition(new THREE.Vector3()); return [p.x, p.y, p.z]; };
    // the child's turn: once the narrator has finished, ask, then wait for a tap (or carry on by itself)
    // (dur: how long what happens after the tap takes, so everything later in the page waits for it)
    S.say = (t, en, vi) => { S.ev.push({ t, dur: 0, say: { en, vi }, e: lin }); S.len = Math.max(S.len, t + .1); };
    S.speaking = false;
    // a line spoken inside the film (a narration line or the child's turn): the page goes on only once it is said
    const speak = (en: string, vi: string, after?: () => void, kind = 'say') => { S.speaking = true; Promise.resolve(api.onSay ? api.onSay(en, vi, kind) : sayAsync(en, vi)).catch(() => { }).finally(() => { S.speaking = false; after && after(); }); };
    S.help = (t, en, vi, act, at, dur = 0) => { S.ev.push({ t, dur: 0, help: { en, vi, act, dur, at: at ? () => v3(val(at)) : null }, e: lin }); S.len = Math.max(S.len, t + .1); };
    S.release = byChild => {
      const hd = S.hold; if (!hd) return; S.hold = null; help.hidden = true; ring.hidden = true; clearTimeout(hd.timer);
      if (byChild) { SFX.ok ? SFX.ok() : SFX.tap(); }
      // (films batch, 13 Oct) what the tap starts makes the page longer by itself; dur moves the rest of the page later.
      // The page used to grow by both, so it stood still for dur seconds after the answer.
      const n0 = S.ev.length, len0 = S.len; if (hd.act) hd.act(S.t);
      if (hd.dur) { for (let i = 0; i < n0; i++) if (!S.ev[i].st && !S.ev[i].fin) S.ev[i].t += hd.dur; S.len = Math.max(S.len, len0 + hd.dur); }
    };
    S.tick = (dt, time) => {
      if (S.follow) { const p = val(S.follow[0]), l = val(S.follow[1]); S.camPos.lerp(new THREE.Vector3(...p), Math.min(1, dt * 3)); S.camLook.lerp(new THREE.Vector3(...l), Math.min(1, dt * 3)); }
      if (!S.hold) {
        let blocked = false;
        for (const ev of S.ev) {
          if (ev.fin || S.t < ev.t) continue;
          if (ev.say) {
            if (!S.narrated || S.speaking) { blocked = true; break; } // after the page's words, one line at a time
            ev.fin = true; speak(ev.say.en, ev.say.vi); blocked = true; break;
          }
          if (ev.help) {
            if (!S.narrated || S.speaking) { blocked = true; break; } // the help comes after the words
            ev.fin = true; S.hold = ev.help; S.hold.shown = true;
            help.innerHTML = `<span class="fh-hand">${pic('👆')}</span><b>${esc(T(ev.help.en, ev.help.vi))}</b>`; help.hidden = false; ring.hidden = !ev.help.at;
            // (owner, 13 Oct: films must play through with no tap) once the question is said, the film waits 7 s for the
            // child's tap and then carries on by itself
            const hd = ev.help; speak(hd.en, hd.vi, () => { if (S.hold === hd) hd.timer = setTimeout(() => { if (S.hold === hd) S.release(false); }, 7000 / filmRate()); }, 'help');
            break;
          }
          const first = !ev.st; ev.st = true;
          const k = ev.dur ? Math.min(1, (S.t - ev.t) / ev.dur) : 1;
          ev.fn(ev.e(k), first); if (k >= 1) ev.fin = true;
        }
        S.waiting = blocked;
        if (!S.hold && !blocked) S.t += dt;
        if (S.t > S.len + .4 && !S.ended && !S.speaking && !S.ev.some(e => (e.help || e.say) && !e.fin)) { S.ended = true; resolve(); }
      }
      for (const f of S.tickers) f(dt, time, S.t);
      for (const a of S.actors) pose(a, time);
      cam.position.copy(S.camPos); cam.lookAt(S.camLook);
    };
    S.dispose = () => {
      scene.remove(S.root); help.hidden = true; ring.hidden = true; if (S.hold) clearTimeout(S.hold.timer);
      S.root.traverse((o: Object3D) => {
        const meshObj = o as unknown as Mesh;
        if (meshObj.geometry && !('isSprite' in o && o.isSprite) && !KEEP.has(meshObj.geometry)) meshObj.geometry.dispose();
        const ms = Array.isArray(meshObj.material) ? meshObj.material : meshObj.material ? [meshObj.material] : [];
        for (const m of ms) { if (m.userData.shared || KEEP.has(m)) continue; if ('map' in m && m.map instanceof THREE.Texture && m.map.userData.film) m.map.dispose(); m.dispose(); }
      });
    };
    S.lib = SETS;
  }

  const api: FilmApi = current = {
    get now() { return page; },
    // play page k: builds its film and resolves when the film has played to its end
    page(k) {
      if (page) page.dispose();
      paused = false; r.domElement.hidden = false;
      page = new Page(k); (scene.fog as THREE.Fog).near = 60; (scene.fog as THREE.Fog).far = 260; sun.intensity = 1.4; hemi.intensity = 1.25;
      try {
        script.pages[k] && script.pages[k](page);
        if (page.look) { const n = page.tickers.length; dressStory(page); if (calm) page.tickers.length = n; }
        if (!calm) motes(page); // (v1.08b story) a few soft floating motes of light in every scene
      } catch (e) { console.warn('film page', k, e); }
      page.ev.sort((a, b) => a.t - b.t);
      cam.position.copy(page.camPos); cam.lookAt(page.camLook);
      // (v1.08b story) a soft fade between scenes (none in calm mode)
      if (!calm && k > 0) { const c = r.domElement; c.style.transition = 'none'; c.style.opacity = '0'; requestAnimationFrame(() => { c.style.transition = 'opacity .45s ease-out'; c.style.opacity = '1'; }); }
      return page.done;
    },
    // the narrator finished reading this page (help questions wait for that)
    narrated() { if (page) page.narrated = true; },
    // hide the film while a guide's real game plays on the same screen (the next page() brings it back)
    pause() { if (page) { page.dispose(); page = null; } paused = true; r.domElement.hidden = true; },
    close() { alive = false; if (page) page.dispose(); page = null; r.domElement.removeEventListener('pointerdown', onDown); r.domElement.removeEventListener('pointerup', onUp); r.domElement.remove(); help.remove(); ring.remove(); r.renderLists.dispose(); if (current === api) current = null; }
  };
  return api;
}
// the film playing now (the checks look inside it)
let current = null;
export const filmNow = () => current;

// ---------- props and sets (each film page builds what it needs) ----------
const tex = (w, h, paint) => { const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData.film = true; return t; };

export const SETS = {
  // a sea that moves: a few gentle waves
  sea(S, color = '#3cb0e8', y = -.35) {
    const g = own(new THREE.PlaneGeometry(420, 420, 36, 36)); g.rotateX(-H);
    const m = new THREE.Mesh(g, mat(color)); S.add(m, 0, y, 0);
    const p = g.attributes.position, base = Float32Array.from(p.array);
    S.every((dt, time) => { for (let i = 0; i < p.count; i++) { const x = base[i * 3], z = base[i * 3 + 2]; p.array[i * 3 + 1] = Math.sin(x * .18 + time * 1.3) * .12 + Math.cos(z * .21 + time) * .1; } p.needsUpdate = true; });
    m.userData.waveAt = (x, z, time) => y + Math.sin(x * .18 + time * 1.3) * .12 + Math.cos(z * .21 + time) * .1;
    return m;
  },
  island(S, r = 13) {
    const g = new THREE.Group();
    g.add(mesh([P(Cyl(r, r + 3, 1.2, 40), '#f0d9a0', [0, -.6, 0]), P(Cyl(r + 3.2, r + 5, .3, 40), '#9fe0e8', [0, -.62, 0])]));
    // dunes, rocks and grass tufts
    const parts = [];
    for (let i = 0; i < 9; i++) { const a = i * 2.4, d = r * (.45 + (i % 3) * .15); parts.push(P(S_(1.6 + (i % 2), 10, 6), '#ead19a', [Math.cos(a) * d, -.9, Math.sin(a) * d], [0, 0, 0], [1.6, .55, 1.2])); }
    for (let i = 0; i < 6; i++) { const a = i * 1.1 + 2, d = r - 1.5; parts.push(P(new THREE.DodecahedronGeometry(.5 + (i % 3) * .25), '#9a8f84', [Math.cos(a) * d, .05, Math.sin(a) * d], [i, i * 2, 0], [1.2, .7, 1])); }
    for (let i = 0; i < 14; i++) { const a = i * .9, d = r * (.35 + (i % 4) * .14); parts.push(P(Cone(.18, .45, 5), '#8bc06a', [Math.cos(a) * d, .2, Math.sin(a) * d])); }
    g.add(mesh(parts));
    S.add(g); return g;
  },
  palm(S, x, z, lean = .3, ry = 0) {
    const parts = [], n = 7; let px = 0, py = 0;
    for (let i = 0; i < n; i++) { const k = i / n; parts.push(P(Cyl(.15 - k * .05, .18 - k * .05, .75, 8), i % 2 ? '#9a6a3c' : '#8a5c32', [px, py + .37, 0], [0, 0, -lean * k])); px += Math.sin(lean * k) * .75; py += Math.cos(lean * k) * .72; }
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; parts.push(P(Cone(.32, 2.6, 4), i % 2 ? '#3f9a46' : '#56b24e', [px + Math.cos(a) * 1.1, py - .2, Math.sin(a) * 1.1], [Math.sin(a) * 1.9, 0, -Math.cos(a) * 1.9], [1, 1, .3])); }
    parts.push(P(S_(.2), '#6a4a22', [px + .15, py - .2, .1]), P(S_(.2), '#6a4a22', [px - .1, py - .25, -.1]));
    const m = mesh(parts); return S.add(m, x, 0, z, ry);
  },
  hut(S, x, z, ry = 0) {
    const m = mesh([
      P(Box(3, 1.8, 2.4), '#d8b88a', [0, .9, 0]), P(Box(.9, 1.4, .1), '#5a3a22', [0, .7, 1.21]),
      P(Cone(2.6, 1.6, 4), '#c9a25a', [0, 2.5, 0], [0, Math.PI / 4, 0], [1.25, 1, 1]),
      ...[-1.4, 1.4].flatMap(px => [-1.1, 1.1].map(pz => P(Cyl(.08, .08, 1.8, 6), '#7a5236', [px, .9, pz])))
    ]);
    return S.add(m, x, 0, z, ry);
  },
  // a village house of mud walls and a thatched roof, open at the front
  house(S, x, z, ry = 0) {
    if (S.look) return storyHouse(S, x, z, ry);
    const variant = ((S.houseCount = (S.houseCount || 0) + 1) + Math.round(Math.abs(x + z))) % 4;
    const walls = ['#f4dca8', '#dcebc8', '#f3d4cd', '#d6e4f3'][variant], roof = ['#dfb867', '#c87568', '#d89d65', '#8eacd0'][variant];
    const m = mesh([
      P(Box(6, 2.4, 4), walls, [0, 1.2, 0]), P(Box(1.4, 1.9, .12), '#4a3020', [0, .95, 2.01]),
      P(Box(1, .8, .1), '#ffdc88', [-1.9, 1.4, 2.01]), P(Box(1, .8, .1), '#ffdc88', [1.9, 1.4, 2.01]),
      P(Cone(4.6, 2.2, 4), roof, [0, 3.5, 0], [0, Math.PI / 4, 0], [1.3, 1, .9]),
      P(Box(7, .25, 1.6), roof, [0, 2.45, 2.6]), ...[-3, -1, 1, 3].map(px => P(Cyl(.1, .1, 2.4, 6), '#6a4a2a', [px, 1.2, 3.3])),
      ...[-2, 2].flatMap(px => [P(Box(.9, .24, .35), '#ab7750', [px, .6, 2.25]), P(S_(.2), ['#ff8bbb', '#ffd764', '#b6a1ee', '#e69d60'][variant], [px, .92, 2.25])]),
      P(Box(6.4, .15, 1.8), '#cbb27e', [0, .07, 2.8])
    ]);
    return S.add(m, x, 0, z, ry);
  },
  ground(S, color = '#8fcf6a', size = 300) { const g = own(new THREE.PlaneGeometry(size, size)); g.rotateX(-H); const m = new THREE.Mesh(g, mat(color)); return S.add(m, 0, -.01, 0); },
  // a strip of rice field with water between the rows
  paddy(S, x, z, w = 10, d = 8) {
    const parts = [P(Box(w, .1, d), '#7ab8c8', [0, -.02, 0]), P(Box(w + .6, .25, .5), '#8a6a3a', [0, .05, d / 2 + .2]), P(Box(w + .6, .25, .5), '#8a6a3a', [0, .05, -d / 2 - .2])];
    for (let i = 0; i < w * 1.5; i++) for (let j = 0; j < d * 1.2; j++) parts.push(P(Cone(.09, .5, 4), (i + j) % 3 ? '#7cc24a' : '#94d45a', [-w / 2 + .3 + i / 1.5, .25, -d / 2 + .3 + j / 1.2]));
    return S.add(mesh(parts), x, 0, z);
  },
  mountains(S, z = -90, tint = '#7fa8b8') {
    const parts = [];
    [[-70, 30, 26], [-30, 44, 30], [10, 36, 24], [50, 48, 34], [90, 30, 22]].forEach(([x, h, r], i) => parts.push(P(Cone(r, h, 7), mixHex(tint, '#a8c8d0', i % 2 * .4), [x, h / 2 - 2, z - (i % 2) * 20])));
    return S.add(mesh(parts));
  },
  // a clump of bamboo (its own colour, so a page can turn it gold)
  bamboo(S, x, z, color = '#5fae4a', n = 7, hgt = 7) {
    const g = new THREE.Group(), stalk = mat(color), leaf = mat(mixHex(color, '#2f7a32', .45));
    for (let i = 0; i < n; i++) {
      const a = i * 2.39, d = .25 + (i % 3) * .25, h = hgt * (.75 + (i % 4) * .1), s = new THREE.Group();
      s.position.set(Math.cos(a) * d, 0, Math.sin(a) * d); s.rotation.set(Math.sin(a) * .12, 0, Math.cos(a) * .12);
      for (let j = 0; j < 6; j++) { const seg = new THREE.Mesh(own(Cyl(.07, .08, h / 6 - .04, 6)), stalk); seg.position.y = h / 6 * (j + .5); s.add(seg); }
      for (let j = 0; j < 5; j++) { const l = new THREE.Mesh(own(Cone(.35, 1.4, 4)), leaf); l.position.set(Math.cos(j * 1.3) * .5, h * (.55 + j * .09), Math.sin(j * 1.3) * .5); l.rotation.set(Math.sin(j) * 1.6, 0, Math.cos(j) * 1.6); l.scale.z = .3; s.add(l); }
      g.add(s);
    }
    g.userData.mats = [stalk, leaf];
    return S.add(g, x, 0, z);
  },
  banyan(S, x, z, s = 1) {
    const parts = [P(Cyl(.6, .9, 4, 9), '#7a5a3a', [0, 2, 0])];
    for (let i = 0; i < 8; i++) { const a = i * .8; parts.push(P(S_(2.2, 9, 7), i % 2 ? '#3f8a3a' : '#4f9e42', [Math.cos(a) * 2.4, 4.6 + (i % 3) * .6, Math.sin(a) * 2.4])); }
    for (let i = 0; i < 6; i++) parts.push(P(Cyl(.05, .05, 3, 4), '#8a6a4a', [Math.cos(i) * 2.6, 1.5, Math.sin(i) * 2.6]));
    const m = mesh(parts); m.scale.setScalar(s); return S.add(m, x, 0, z);
  },
  clouds(S, list) {
    const g = new THREE.Group();
    for (const [x, y, z, s] of list) { const parts = []; for (let i = 0; i < 5; i++) parts.push(P(S_(1.2 + (i % 2) * .5, 9, 7), '#ffffff', [(i - 2) * 1.3, Math.sin(i) * .3, (i % 2) * .5])); const c = mesh(parts); c.position.set(x, y, z); c.scale.setScalar(s || 1); g.add(c); }
    S.every(dt => g.children.forEach((c, i) => { c.position.x += dt * (.3 + i % 3 * .1); }));
    return S.add(g);
  },
  sun(S, x, y, z, r = 4, color = '#fff2a8') { const m = new THREE.Mesh(own(S_(r, 16, 12)), glow(color)); m.material.userData.film = true; m.material.fog = false; return S.add(m, x, y, z); },
  // the palace yard: stone floor, red pillars, a curved roof, steps and the throne
  palace(S) {
    const g = new THREE.Group();
    g.add(mesh([P(Box(40, .2, 30), '#e8d8b8', [0, -.1, -2])]));
    const parts = [P(Box(16, .5, 7), '#d8c8a0', [0, .25, -9]), P(Box(16, .5, 1), '#c8b890', [0, .25, -5.2]), P(Box(14, 4.2, 6), '#f4e2c0', [0, 2.6, -9.5])];
    for (let i = -3; i <= 3; i++) parts.push(P(Cyl(.25, .25, 4.2, 10), '#c62f2f', [i * 2.2, 2.6, -6.4]));
    parts.push(P(Box(17, .4, 8), '#3a5a7a', [0, 4.9, -9.2]), P(Cone(9.8, 3, 4), '#2f4a6a', [0, 6.5, -9.2], [0, Math.PI / 4, 0], [1.25, 1, .6]));
    [-8.6, 8.6].forEach(x => parts.push(P(Cone(.35, 1.5, 6), '#2f4a6a', [x, 5.6, -5.4], [-.6, 0, x > 0 ? -.9 : .9])));
    parts.push(P(Box(2.2, 1.5, 1.2), '#c62f2f', [0, 1.25, -8]), P(Box(2.4, .25, 1.4), '#e8b62a', [0, 2.05, -8.1]), P(Box(2.4, 1.6, .3), '#e8b62a', [0, 2.4, -8.6]));
    g.add(mesh(parts));
    return S.add(g);
  },
  lantern(S, x, y, z, color = '#e8332a') {
    const m = mesh([P(S_(.35, 10, 8), color, [0, 0, 0], [0, 0, 0], [1, 1.15, 1]), P(Cyl(.2, .2, .1, 8), '#e8b62a', [0, .4, 0]), P(Cyl(.2, .2, .1, 8), '#e8b62a', [0, -.4, 0]), P(Cyl(.02, .02, .9, 4), '#e8b62a', [0, -.8, 0])]);
    S.every((dt, time) => { m.rotation.z = Math.sin(time * 1.4 + x) * .08; });
    return S.add(m, x, y, z);
  },
  // a peach blossom tree for Tết
  blossom(S, x, z) {
    const parts = [P(Cyl(.15, .25, 2.2, 7), '#6a4a3a', [0, 1.1, 0], [0, 0, .12])];
    for (let i = 0; i < 26; i++) { const a = i * 2.4, r = .6 + (i % 5) * .3; parts.push(P(S_(.22, 6, 5), i % 3 ? '#ff9ec8' : '#ffd0e2', [Math.cos(a) * r, 2.2 + (i % 4) * .35, Math.sin(a) * r])); }
    return S.add(mesh(parts), x, 0, z);
  },
  // a small shrine (đền) with an incense pot
  shrine(S, x, z, ry = 0) {
    return S.add(mesh([P(Box(4, .5, 3), '#bfae90', [0, .25, 0]), P(Box(3.4, 2.4, 2.4), '#e8d2a8', [0, 1.7, -.2]), P(Box(1.2, 1.6, .1), '#8a2a20', [0, 1.3, 1.01]),
      P(Cone(3.2, 1.4, 4), '#8a3a2a', [0, 3.5, -.2], [0, Math.PI / 4, 0], [1.2, 1, .9]), ...[-1, 1].map(s => P(Cone(.2, .8, 5), '#8a3a2a', [s * 2.2, 3.3, 1], [-.4, 0, s * -.9])),
      P(Cyl(.35, .28, .5, 10), '#8a6a2a', [0, .75, 1.8])]), x, 0, z, ry);
  }
};

type PropFactory = (...args: any[]) => Object3D;
export const PROPS: Record<string, PropFactory> = {
  bird(color = '#3a3a44') {
    const g = new THREE.Group(), body = mesh([P(S_(.16, 10, 8), color, [0, 0, 0], [0, 0, 0], [.9, .85, 1.4]), P(S_(.11, 10, 8), color, [0, .1, .18]), P(Cone(.04, .12, 6), '#f2a23a', [0, .09, .32], [H, 0, 0]), P(S_(.02, 6, 5), '#fff', [.06, .13, .26]), P(S_(.02, 6, 5), '#fff', [-.06, .13, .26]), P(Cone(.07, .25, 4), color, [0, .02, -.28], [-H - .3, 0, 0], [1, 1, .4])]);
    g.add(body);
    const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * .1, .05, 0); w.add(mesh([P(Box(.42, .02, .2), color, [s * .21, 0, 0])])); g.add(w); return w; });
    g.userData.flap = 1; g.userData.tick = (dt, time) => { const f = g.userData.flap; wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * (Math.sin(time * 16) * .9 * f + .1); }); };
    return g;
  },
  seed() { return mesh([P(S_(.035, 6, 5), '#1a1410', [0, .035, 0], [0, 0, 0], [1, .7, 1.4])]); },
  melon(r = .45) {
    const t = tex(64, 64, (x, w, h) => { x.fillStyle = '#4a9a3a'; x.fillRect(0, 0, w, h); x.fillStyle = '#1f5a24'; for (let i = 0; i < 8; i++) { x.beginPath(); for (let y = 0; y <= h; y += 4) x.lineTo(i * 8 + Math.sin(y * .3) * 1.5, y); for (let y = h; y >= 0; y -= 4) x.lineTo(i * 8 + 3 + Math.sin(y * .3) * 1.5, y); x.fill(); } });
    const m = new THREE.Mesh(own(S_(r, 20, 14)), toon('#ffffff', { map: t })); m.material.userData.film = true; m.scale.set(1, .9, 1.15); m.position.y = r * .9; const g = new THREE.Group(); g.add(m); g.userData.r = r; return g;
  },
  // a watermelon cut open: two halves, red inside with black seeds
  melonHalves(r = .45) {
    const inside = tex(64, 64, (x, w) => { x.fillStyle = '#3f8a34'; x.beginPath(); x.arc(32, 32, 32, 0, 7); x.fill(); x.fillStyle = '#f2f0c8'; x.beginPath(); x.arc(32, 32, 29, 0, 7); x.fill(); x.fillStyle = '#e8343a'; x.beginPath(); x.arc(32, 32, 26, 0, 7); x.fill(); x.fillStyle = '#1a1410'; for (let i = 0; i < 16; i++) { const a = i * 2.4, d = 8 + (i % 3) * 5; x.beginPath(); x.ellipse(32 + Math.cos(a) * d, 32 + Math.sin(a) * d, 1.5, 2.6, a, 0, 7); x.fill(); } });
    const g = new THREE.Group(), halves = [];
    for (const s of [-1, 1]) {
      const h = new THREE.Group(), shell = new THREE.Mesh(own(new THREE.SphereGeometry(r, 18, 12, 0, Math.PI)), mat('#4a9a3a', { side: THREE.DoubleSide }));
      shell.rotation.y = s > 0 ? -H : H; h.add(shell);
      const cut = new THREE.Mesh(own(new THREE.CircleGeometry(r * .98, 24)), toon('#ffffff', { map: inside })); cut.material.userData.film = true; cut.rotation.y = s > 0 ? -H : H; h.add(cut);
      h.position.set(s * .02, r, 0); h.scale.set(1, .9, 1.15); g.add(h); halves.push(h);
    }
    g.userData.halves = halves; return g;
  },
  slice() { return mesh([P(new THREE.CylinderGeometry(.22, .22, .06, 3, 1, false, 0, Math.PI * .5), '#e8343a', [0, 0, 0], [H, 0, 0]), P(new THREE.CylinderGeometry(.24, .24, .065, 6, 1, false, 0, Math.PI * .5), '#3f8a34', [0, 0, -.003], [H, 0, 0], [1, 1, .4])]); },
  // creeping vines with big leaves and yellow flowers, that grow from nothing
  vines(n = 40, spread = 4) {
    const g = new THREE.Group();
    for (let i = 0; i < n; i++) {
      const a = i * 2.39, d = Math.sqrt(i / n) * spread, l = mesh([P(S_(.22, 7, 5), i % 2 ? '#3f9a3a' : '#57b24a', [0, .06, 0], [0, 0, 0], [1.2, .25, 1]), ...(i % 5 === 0 ? [P(S_(.06, 6, 5), '#ffd23f', [.1, .14, .05])] : []), P(Cyl(.015, .015, .5, 4), '#5a9a3a', [-.25, .04, 0], [0, 0, H])]);
      l.position.set(Math.cos(a) * d, 0, Math.sin(a) * d); l.rotation.y = a; l.scale.setScalar(0); l.userData.d = d / spread; g.add(l);
    }
    g.userData.grow = k => g.children.forEach(l => { const s = Math.min(1, Math.max(0, (k - l.userData.d * .7) / .3)); l.scale.setScalar(s); });
    return g;
  },
  sprout() { return mesh([P(Cyl(.012, .012, .16, 4), '#5aa84a', [0, .08, 0]), P(S_(.05, 6, 5), '#6cc45a', [.04, .16, 0], [0, 0, 0], [1.3, .4, .8]), P(S_(.05, 6, 5), '#6cc45a', [-.04, .16, 0], [0, 0, 0], [1.3, .4, .8])]); },
  // a gourd for carrying water, and the drops it pours
  gourd() { return mesh([P(S_(.12, 10, 8), '#c9a25a', [0, -.05, 0]), P(S_(.08, 10, 8), '#c9a25a', [0, .1, 0]), P(Cyl(.025, .03, .06, 6), '#8a6a3a', [0, .2, 0])]); },
  drops(n = 12, spread = .12) {
    const g = new THREE.Group(), m = glow('#9fe0ff', .85); m.userData.film = true;
    for (let i = 0; i < n; i++) { const d = new THREE.Mesh(own(S_(.03, 5, 4)), m); d.userData.ph = i / n; g.add(d); }
    g.visible = false;
    g.userData.tick = (dt, time) => { if (g.visible) g.children.forEach(d => { const k = (time * 1.6 + d.userData.ph) % 1; d.position.set((d.userData.ph - .5) * spread * 2 + Math.sin(d.userData.ph * 20) * .03, -k * .9, k * .1); }); };
    return g;
  },
  sparkle(color = '#ffe27a') {
    const g = new THREE.Group(), m = glow(color, .9); m.userData.film = true;
    for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(own(new THREE.OctahedronGeometry(.08)), m); s.userData.a = i * 2.4; g.add(s); }
    g.visible = false;
    g.userData.tick = (dt, time) => { if (g.visible) g.children.forEach((s, i) => { const k = (time * .8 + i / 14) % 1; s.position.set(Math.cos(s.userData.a) * (.3 + k), k * 1.6, Math.sin(s.userData.a) * (.3 + k)); s.scale.setScalar(1 - k); s.rotation.y = time * 3; }); };
    return g;
  },
  // a wooden sailing boat with a brown junk sail (thuyền buồm)
  boat(len = 6, sail = '#b8643a') {
    const g = new THREE.Group(), s = new THREE.Shape(), w = len / 2;
    s.moveTo(-w, .5); s.quadraticCurveTo(-w * .7, -.4, 0, -.45); s.quadraticCurveTo(w * .7, -.4, w, .6); s.lineTo(-w, .5);
    const hull = own(new THREE.ExtrudeGeometry(s, { depth: 1.8, bevelEnabled: false })); hull.translate(0, 0, -.9); hull.rotateY(H);
    g.add(new THREE.Mesh(hull, mat('#8a5a32')));
    g.add(mesh([P(Box(1.7, .08, len * .8), '#a8784a', [0, .35, 0]), P(Cyl(.06, .07, 4.2, 6), '#6a4a2a', [0, 2.4, .3]), P(S_(.12, 6, 5), '#e8332a', [0, 4.5, .3])]));
    const sl = own(new THREE.PlaneGeometry(2.6, 3.2, 1, 4)); const sm = new THREE.Mesh(sl, mat(sail, { side: THREE.DoubleSide })); sm.position.set(0, 2.5, .2); sm.rotation.y = H * .25; g.add(sm);
    for (let i = 0; i < 5; i++) g.add(mesh([P(Cyl(.02, .02, 2.7, 4), '#5a3a22', [0, 1 + i * .75, .2], [0, H * .25, H])]));
    g.userData.deck = .4;
    return g;
  },
  // a horse (the messenger's), or the iron horse that breathes fire
  horse(color = '#8a5a3a', iron = false) {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const mane = iron ? '#2a2c30' : '#3a2618', c2 = iron ? '#6a7078' : color;
    body.add(mesh([P(new THREE.CapsuleGeometry(.38, 1.1, 4, 10), c2, [0, 1.35, 0], [H, 0, 0]), P(S_(.4, 10, 8), c2, [0, 1.42, -.55])]));
    const neck = new THREE.Group(); neck.position.set(0, 1.55, .6); body.add(neck);
    neck.add(mesh([P(new THREE.CapsuleGeometry(.2, .6, 4, 8), c2, [0, .35, .12], [.5, 0, 0]), P(new THREE.CapsuleGeometry(.17, .42, 4, 8), c2, [0, .72, .42], [1.6, 0, 0]),
      P(S_(.06, 6, 5), iron ? '#ff8a2a' : '#1a1a1a', [.14, .82, .38]), P(S_(.06, 6, 5), iron ? '#ff8a2a' : '#1a1a1a', [-.14, .82, .38]),
      ...[-1, 1].map(s => P(Cone(.06, .18, 5), c2, [s * .09, .98, .26])), ...[0, 1, 2, 3, 4].map(i => P(Box(.06, .22, .14), mane, [0, .9 - i * .17, .12 - i * .1], [.4, 0, 0]))]));
    const legs = [[.2, .55, 0], [-.2, .55, Math.PI], [.2, -.55, Math.PI], [-.2, -.55, 0]].map(([x, z, ph]) => { const l = new THREE.Group(); l.position.set(x, 1.15, z); l.add(mesh([P(Cyl(.09, .07, 1.1, 6), c2, [0, -.55, 0]), P(Cyl(.1, .1, .1, 6), iron ? '#3a3c40' : '#2a1a10', [0, -1.12, 0])])); body.add(l); return [l, ph] as const; });
    const tail = new THREE.Group(); tail.position.set(0, 1.5, -.95); tail.add(mesh([P(Cone(.12, .9, 6), mane, [0, -.4, -.12], [Math.PI - .4, 0, 0])])); body.add(tail);
    if (iron) body.add(mesh([P(Box(.82, .1, .9), '#3a3c40', [0, 1.78, -.05]), ...[-1, 1].map(s => P(Box(.05, .5, .05), '#3a3c40', [s * .42, 1.5, 0]))]));
    // fire from the mouth
    const fire = new THREE.Group(); fire.position.set(0, .7, .7); neck.add(fire); fire.visible = false;
    if (iron) ([['#ffd23f', .12, .7], ['#ff8a2a', .18, 1.1], ['#e8332a', .22, 1.5]] as const).forEach(([c, r, l], i) => { const m = glow(c, .85); m.userData.film = true; const f = new THREE.Mesh(own(Cone(r, l, 8)), m); f.rotation.x = -H; f.position.z = l / 2; fire.add(f); });
    g.userData.seat = [0, 1.78, -.05]; g.userData.fire = fire; g.userData.gait = 0;
    g.userData.tick = (dt, time) => {
      const k = g.userData.gait; // 0 stand, 1 walk, 2 gallop
      legs.forEach(([l, ph]) => { l.rotation.x = Math.sin(time * (k > 1 ? 11 : 5) + ph) * (k > 1 ? .8 : k ? .45 : 0); });
      body.position.y = k > 1 ? Math.abs(Math.sin(time * 11)) * .12 : 0; body.rotation.x = k > 1 ? Math.sin(time * 11) * .05 : 0;
      tail.rotation.x = Math.sin(time * 3) * .15 + (k > 1 ? -.5 : 0); neck.rotation.x = k > 1 ? Math.sin(time * 11) * .08 : Math.sin(time * .9) * .04;
      if (fire.visible) fire.children.forEach((f, i) => { f.scale.set(1, 1, .8 + Math.sin(time * 30 + i * 2) * .25); });
    };
    return g;
  },
  stick(len = 1.6, color = '#4a4e56') { const g = new THREE.Group(); const a = mesh([P(Cyl(.035, .035, len / 2, 6), color, [0, len / 4, 0])]), b = mesh([P(Cyl(.035, .035, len / 2, 6), color, [0, -len / 4, 0])]); g.add(a, b); g.userData.halves = [a, b]; return g; },
  bowl(full = true) { return mesh([P(new THREE.SphereGeometry(.12, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), '#f4f0e8', [0, .12, 0]), ...(full ? [P(S_(.105, 8, 6), '#ffffff', [0, .12, 0], [0, 0, 0], [1, .45, 1])] : [])]); },
  pot() { return mesh([P(Cyl(.32, .26, .45, 12), '#3a3430', [0, .22, 0]), P(Cyl(.34, .34, .05, 12), '#5a504a', [0, .46, 0]), P(S_(.3, 10, 6), '#ffffff', [0, .44, 0], [0, 0, 0], [1, .3, 1])]); },
  basket() { return mesh([P(Cyl(.3, .22, .3, 10), '#c9a25a', [0, .15, 0]), P(Cyl(.28, .28, .04, 10), '#f4f0e8', [0, .3, 0])]); },
  sack() { return mesh([P(S_(.28, 9, 7), '#d8c48a', [0, .26, 0], [0, 0, 0], [1, 1.1, .8]), P(Cyl(.06, .1, .15, 6), '#b8a46a', [0, .55, 0])]); },
  mat() { return mesh([P(Box(1.4, .03, 2), '#d8b870', [0, .015, 0]), ...[-.5, 0, .5].map(x => P(Box(.08, .035, 2), '#c0392b', [x, .02, 0]))]); },
  table() { return mesh([P(Box(1.4, .08, .9), '#7a5236', [0, .42, 0]), ...[-1, 1].flatMap(sx => [-1, 1].map(sz => P(Cyl(.04, .04, .4, 5), '#6a4226', [sx * .6, .2, sz * .36])))]); },
  flag(color = '#e8332a') { const g = new THREE.Group(); g.add(mesh([P(Cyl(.025, .025, 1.8, 5), '#6a4a2a', [0, .9, 0])])); const f = new THREE.Mesh(own(new THREE.PlaneGeometry(.6, .4, 4, 1)), mat(color, { side: THREE.DoubleSide })); f.position.set(.3, 1.6, 0); g.add(f); g.userData.tick = (dt, time) => { f.rotation.y = Math.sin(time * 4) * .3; }; return g; },
  helmet() { return mesh([P(new THREE.SphereGeometry(.56, 14, 8, 0, Math.PI * 2, 0, Math.PI * .5), '#5a6068', [0, .12, 0]), P(Cone(.08, .5, 6), '#c62f2f', [0, .78, 0])]); },
  fireworks(S, x, y, z) {
    const g = new THREE.Group(), cols = ['#ffd23f', '#ff5fa2', '#5fd3ff', '#ff8a2a'];
    for (let i = 0; i < 24; i++) { const m = glow(cols[i % 4], .95); m.userData.film = true; const s = new THREE.Mesh(own(S_(.12, 5, 4)), m); s.userData.dir = new THREE.Vector3(Math.cos(i * 2.4) * Math.sin(i * .7 + 1), Math.cos(i * .7 + 1), Math.sin(i * 2.4) * Math.sin(i * .7 + 1)); g.add(s); }
    g.visible = false; g.userData.tick = (dt, time) => { if (!g.visible) return; const k = (time * .5) % 1; g.children.forEach(s => { s.position.copy(s.userData.dir).multiplyScalar(k * 4); s.position.y -= k * k * 1.5; s.scale.setScalar(1 - k * .8); }); };
    return S.add(g, x, y, z);
  }
};

// a number on a little board on a post (the counting guide); digits are drawn, not emoji
PROPS.numberSign = (n, color = '#3b6fe0') => {
  const t = tex(128, 128, (x, w) => { x.fillStyle = '#fffaf0'; x.fillRect(0, 0, w, w); x.strokeStyle = color; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, w - 10); x.fillStyle = color; x.font = 'bold 92px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), w / 2, w / 2 + 6); });
  const g = new THREE.Group(); g.add(mesh([P(Cyl(.05, .05, 1, 6), '#8a6a4a', [0, .5, 0])]));
  const b = new THREE.Mesh(own(new THREE.PlaneGeometry(.8, .8)), toon('#ffffff', { map: t, side: THREE.DoubleSide })); b.material.userData.film = true; b.position.y = 1.25; g.add(b);
  g.userData.board = b; return g;
};
// a floating number that pops up over a thing being counted
PROPS.countTag = (n) => {
  const t = tex(64, 64, (x, w) => { x.fillStyle = '#ffd23f'; x.beginPath(); x.arc(32, 32, 30, 0, 7); x.fill(); x.fillStyle = '#3b2a4f'; x.font = 'bold 44px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), 32, 35); });
  const m = new THREE.SpriteMaterial({ map: t, depthTest: false }); m.userData.film = true; const s = new THREE.Sprite(m); s.scale.setScalar(.45); s.renderOrder = 5; return s;
};
// an Ô ăn quan board scratched in the dirt: two rows of five squares and a half moon (the quan) at each end
PROPS.oanquan = () => {
  const g = new THREE.Group(), line = '#6a4a2a';
  g.add(mesh([P(Box(4.6, .02, 1.8), '#c8a878', [0, .01, 0])]));
  const lines = new THREE.Group(); g.add(lines);
  const L = (w, d, x, z) => { const m = mesh([P(Box(w, .015, d), line, [0, .025, 0])]); m.position.set(x, 0, z); lines.add(m); return m; };
  [-.6, 0, .6].forEach(z => L(3, .035, 0, z));
  for (let i = 0; i <= 5; i++) L(.035, 1.2, -1.5 + i * .6, 0);
  [-1, 1].forEach(s => { const a = new THREE.Mesh(own(new THREE.TorusGeometry(.6, .018, 4, 20, Math.PI)), new THREE.MeshBasicMaterial({ color: line })); a.material.userData.film = true; a.rotation.set(-H, 0, s > 0 ? -H : H); a.position.set(s * 1.5, .03, 0); lines.add(a); });
  g.userData.lines = lines;
  // the squares, numbered round the board: 0–4 the near row (left to right), 5–9 the far row (right to left)
  const sq = []; for (let i = 0; i < 5; i++) sq.push([-1.2 + i * .6, .3]); for (let i = 4; i >= 0; i--) sq.push([-1.2 + i * .6, -.3]);
  g.userData.sq = sq;
  g.userData.pebble = (i, j) => { const c = ['#e8e4dc', '#bfb8ac', '#d8cfc0', '#a8a094'][j % 4]; return mesh([P(new THREE.DodecahedronGeometry(.045), c, [0, .045, 0], [j, j * 2, 0], [1, .7, 1])]); };
  return g;
};

// ---------- props for the next films (Kid UI, 10 Oct: Bánh Chưng Bánh Giầy, Cây khế, Bắn bi, Lật hình) ----------
// a star shape (a starfruit cut across, a gold star on a card)
const starShape = (r1, r2, n = 5) => { const s = new THREE.Shape(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2 + H, r = i % 2 ? r2 : r1; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } return s; };
// a starfruit (quả khế): a fat yellow five-pointed star, a little long
PROPS.starfruit = (s = 1, color = '#f2c834') => {
  const g = new THREE.ExtrudeGeometry(starShape(.1, .055), { depth: .2, bevelEnabled: true, bevelSize: .025, bevelThickness: .03, bevelSegments: 1 }); g.translate(0, 0, -.1);
  const m = mesh([P(g, color), P(Cyl(.01, .012, .06, 4), '#6a8a3a', [0, 0, .15], [H, 0, 0])]); m.scale.setScalar(s); return m;
};
// the starfruit tree (cây khế): a short trunk, a round green crown and fruit that can be picked one by one
PROPS.starTree = (n = 12) => {
  const g = new THREE.Group();
  g.add(mesh([P(Cyl(.22, .32, 2.2, 8), '#7a5236', [0, 1.1, 0]), P(Cyl(.08, .12, 1.2, 6), '#7a5236', [.45, 2.1, 0], [0, 0, -.7]), P(Cyl(.08, .12, 1.2, 6), '#7a5236', [-.4, 2.2, .2], [.3, 0, .7]),
    ...[0, 1, 2, 3, 4, 5, 6].map(i => P(S_(1.05, 10, 8), i % 2 ? '#4f9e42' : '#5fae4a', [Math.cos(i * .9) * (i ? 1.05 : 0), 3 + (i % 3) * .35, Math.sin(i * .9) * (i ? 1.05 : 0)]))]));
  const fruits = [];
  for (let i = 0; i < n; i++) { const a = i * 2.39, d = 1.3 + (i % 3) * .25, f = PROPS.starfruit(1.5); f.position.set(Math.cos(a) * d, 2.05 + (i % 4) * .2, Math.sin(a) * d); f.rotation.set(.25, i % 2 ? .5 : -.5, i * .7); /* (the star shows from the front) */ g.add(f); fruits.push(f); } // (hanging under the leaves, where they can be seen)
  g.userData.fruits = fruits; return g;
};
// the great bird of Cây khế: big, kind and colourful, with a seat on its back for a rider
PROPS.bigBird = () => {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  body.add(mesh([P(S_(.9, 16, 12), '#e85a3a', [0, 1.6, 0], [0, 0, 0], [1, .9, 1.5]), P(S_(.7, 14, 10), '#ffd23f', [0, 1.45, .55], [0, 0, 0], [1, .9, 1]),
    P(S_(.55, 14, 10), '#e85a3a', [0, 2.45, 1.05]), P(Cone(.16, .55, 8), '#ffb020', [0, 2.38, 1.7], [H, 0, 0]),
    P(S_(.15, 10, 8), '#ffffff', [.25, 2.6, 1.42]), P(S_(.15, 10, 8), '#ffffff', [-.25, 2.6, 1.42]), P(S_(.08, 8, 6), '#1a1410', [.27, 2.6, 1.55]), P(S_(.08, 8, 6), '#1a1410', [-.27, 2.6, 1.55]),
    P(S_(.03, 6, 5), '#ffffff', [.3, 2.64, 1.62]), P(S_(.03, 6, 5), '#ffffff', [-.24, 2.64, 1.62]),
    ...[-.2, 0, .2].map((x, i) => P(Cone(.09, .5, 6), ['#ffd23f', '#3cc7e8', '#ffd23f'][i], [x, 3.05, .95], [-.4, 0, -x])),
    ...[-2, -1, 0, 1, 2].map(i => P(Cone(.2, 1.9, 6), ['#3cc7e8', '#7ee35a', '#ffd23f', '#7ee35a', '#3cc7e8'][i + 2], [i * .22, 1.85, -1.95], [-1.15, 0, i * .22], [1, 1, .35])),
    P(Cyl(.06, .05, .7, 6), '#ffb020', [.3, .55, .1]), P(Cyl(.06, .05, .7, 6), '#ffb020', [-.3, .55, .1]), P(Box(.3, .06, .4), '#ffb020', [.3, .2, .22]), P(Box(.3, .06, .4), '#ffb020', [-.3, .2, .22])]));
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * .75, 1.9, 0); w.add(mesh([P(Box(1.6, .1, 1), '#e85a3a', [s * .8, 0, 0]), ...[0, 1, 2, 3].map(i => P(Box(.5, .06, .3), ['#3cc7e8', '#7ee35a', '#ffd23f', '#3cc7e8'][i], [s * (1.75 + i * .1), 0, .3 - i * .28], [0, s * i * .15, 0]))])); body.add(w); return w; });
  g.userData.flap = 0; g.userData.seat = [0, 2.35, -.35];
  g.userData.tick = (dt, time) => { const f = g.userData.flap; wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * (f ? Math.sin(time * (4 + f * 4)) * .7 * f : -.15); }); body.position.y = f ? Math.sin(time * (4 + f * 4)) * .08 : 0; };
  return g;
};
// gold: shining nuggets, a little pile or a big one
PROPS.gold = (n = 8, spread = .3) => {
  const parts = []; for (let i = 0; i < n; i++) { const a = i * 2.39, d = Math.sqrt(i / n) * spread; parts.push(P(new THREE.DodecahedronGeometry(.06 + (i % 3) * .015), i % 3 ? '#ffcf33' : '#ffe27a', [Math.cos(a) * d, .05 + (1 - d / Math.max(.01, spread)) * spread * .5, Math.sin(a) * d], [i, i * 2, 0])); }
  return mesh(parts);
};
// a cloth bag with a tie at the neck (the bag "three hands long", or the greedy brother's huge one)
PROPS.bag = (color = '#c8784a') => mesh([P(S_(.2, 10, 8), color, [0, .2, 0], [0, 0, 0], [1, 1.05, .85]), P(Cyl(.06, .1, .12, 8), color, [0, .42, 0]), P(Cyl(.07, .07, .03, 8), '#6a3a1a', [0, .4, 0]), P(Cone(.09, .1, 8), color, [0, .52, 0], [Math.PI, 0, 0])]);
// Bánh chưng: a square green cake tied with bamboo strings; Bánh giầy: a round white cake on a leaf
PROPS.squareCake = () => mesh([P(Box(.5, .2, .5), '#3f8a3a', [0, .1, 0]), P(Box(.46, .01, .46), '#57a84a', [0, .205, 0]),
  ...[-.12, .12].flatMap(x => [P(Box(.03, .22, .52), '#e8d8a8', [x, .1, 0]), P(Box(.52, .22, .03), '#e8d8a8', [0, .1, x])])]);
PROPS.roundCake = () => mesh([P(S_(.2, 16, 10), '#fbf8ee', [0, .07, 0], [0, 0, 0], [1, .4, 1]), P(S_(.24, 12, 6), '#57a84a', [0, .005, 0], [0, 0, 0], [1, .04, 1])]);
// a big dong leaf (lá dong) to wrap the cake in
PROPS.leaf = () => mesh([P(S_(.3, 10, 6), '#4fa04a', [0, .01, 0], [0, 0, 0], [.7, .03, 1.2]), P(Box(.015, .02, .66), '#7ec46a', [0, .02, 0])]);
// a wooden mortar (cối) and its pestle (chày), for pounding sticky rice
PROPS.mortar = () => mesh([P(Cyl(.32, .26, .55, 14), '#8a5a32', [0, .28, 0]), P(Cyl(.25, .25, .02, 14), '#fbf8ee', [0, .56, 0])]);
PROPS.pestle = () => mesh([P(Cyl(.05, .05, 1.1, 8), '#a8784a', [0, 0, 0]), P(Cyl(.08, .07, .25, 8), '#8a5a32', [0, -.55, 0])]);
// the cooking pot over a little fire, with steam (the cakes cook all night)
PROPS.firePot = () => {
  const g = new THREE.Group();
  g.add(mesh([P(Cyl(.5, .42, .7, 14), '#3a3430', [0, .6, 0]), P(Cyl(.53, .53, .06, 14), '#5a504a', [0, .96, 0]), ...[0, 1, 2].map(i => P(new THREE.DodecahedronGeometry(.16), '#9a8f84', [Math.cos(i * 2.1) * .42, .1, Math.sin(i * 2.1) * .42]))]));
  const fire = new THREE.Group(); g.add(fire);
  [['#ffd23f', .12, .4], ['#ff8a2a', .16, .3], ['#e8332a', .14, .25]].forEach(([c, r, h], i) => { const m = glow(c, .9); m.userData.film = true; const f = new THREE.Mesh(own(Cone(r, h, 7)), m); f.position.set((i - 1) * .14, .2, (i % 2) * .1); fire.add(f); });
  const sm = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .5, depthWrite: false }); sm.userData.film = true;
  const steam = [0, 1, 2, 3].map(i => { const s = new THREE.Mesh(own(S_(.14, 8, 6)), sm); g.add(s); return s; });
  g.userData.tick = (dt, time) => { fire.children.forEach((f, i) => { f.scale.y = 1 + Math.sin(time * 12 + i * 2) * .25; }); steam.forEach((s, i) => { const k = (time * .4 + i / 4) % 1; s.position.set(Math.sin(i * 2 + time) * .15, 1.05 + k * 1.2, 0); s.scale.setScalar(.6 + k * 1.2); }); };
  return g;
};
// rare treats the older princes bring: a red lobster and a jar of honey
PROPS.lobster = () => mesh([...[0, 1, 2, 3].map(i => P(S_(.09 - i * .012, 10, 8), '#e8432a', [0, .07, -i * .12], [0, 0, 0], [1.2, .75, 1])), P(Cone(.09, .12, 6), '#e8432a', [0, .07, -.5], [-H, 0, 0], [1.4, 1, .4]),
  ...[-1, 1].flatMap(s => [P(Cyl(.015, .015, .25, 4), '#c8321e', [s * .12, .07, .14], [H, 0, s * .6]), P(S_(.06, 8, 6), '#e8432a', [s * .2, .07, .26], [0, 0, 0], [1, .6, 1.5])]), P(S_(.02, 6, 5), '#1a1410', [.04, .13, .08]), P(S_(.02, 6, 5), '#1a1410', [-.04, .13, .08])]);
PROPS.honey = () => mesh([P(S_(.16, 12, 8), '#e8a832', [0, .17, 0], [0, 0, 0], [1, 1.1, 1]), P(Cyl(.1, .1, .08, 10), '#8a5a32', [0, .36, 0]), P(Cyl(.13, .13, .03, 10), '#c84a3a', [0, .4, 0])]);
// marbles: a chalk circle on the ground, coloured marbles, the big white shooter
PROPS.chalkRing = (r = 1) => { const parts = []; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; parts.push(P(Box(.16 * r, .012, .035), '#fdfdf6', [Math.cos(a) * r, .012, Math.sin(a) * r], [0, -a, 0])); } return mesh(parts); };
PROPS.marble = (color = '#ff5f7e', r = .05) => mesh([P(S_(r, 12, 10), color, [0, r, 0]), P(S_(r * .3, 6, 5), '#ffffff', [-r * .35, r * 1.4, r * .5])]);
// a picture card for Memory Match: an orange back with a star, a white front with a drawn picture
const CARD_PICS = {
  apple: (x, s) => { x.fillStyle = '#e8332a'; x.beginPath(); x.arc(s * .44, s * .56, s * .22, 0, 7); x.arc(s * .58, s * .56, s * .22, 0, 7); x.fill(); x.fillStyle = '#4f9e42'; x.beginPath(); x.ellipse(s * .6, s * .27, s * .1, s * .05, -.5, 0, 7); x.fill(); x.strokeStyle = '#6a4a2a'; x.lineWidth = s * .03; x.beginPath(); x.moveTo(s * .5, s * .36); x.lineTo(s * .52, s * .24); x.stroke(); },
  fish: (x, s) => { x.fillStyle = '#3cc7e8'; x.beginPath(); x.ellipse(s * .45, s * .5, s * .26, s * .16, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(s * .68, s * .5); x.lineTo(s * .86, s * .34); x.lineTo(s * .86, s * .66); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(s * .33, s * .46, s * .05, 0, 7); x.fill(); x.fillStyle = '#1a1410'; x.beginPath(); x.arc(s * .33, s * .46, s * .025, 0, 7); x.fill(); },
  flower: (x, s) => { x.fillStyle = '#ff7eb8'; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; x.beginPath(); x.arc(s * .5 + Math.cos(a) * s * .17, s * .5 + Math.sin(a) * s * .17, s * .12, 0, 7); x.fill(); } x.fillStyle = '#ffd23f'; x.beginPath(); x.arc(s * .5, s * .5, s * .11, 0, 7); x.fill(); },
  star: (x, s) => { x.fillStyle = '#ffb020'; x.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - H, r = i % 2 ? s * .15 : s * .34; x.lineTo(s * .5 + Math.cos(a) * r, s * .52 + Math.sin(a) * r); } x.fill(); }
};
PROPS.card = (front = 'apple') => {
  const back = tex(64, 64, (x, s) => { const g = x.createLinearGradient(0, 0, s, s); g.addColorStop(0, '#ff9a3a'); g.addColorStop(1, '#e8434a'); x.fillStyle = g; x.fillRect(0, 0, s, s); CARD_PICS.star(x, s); });
  const face = tex(64, 64, (x, s) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, s, s); x.strokeStyle = '#ffd0a0'; x.lineWidth = 4; x.strokeRect(2, 2, s - 4, s - 4); CARD_PICS[front](x, s); });
  const g = new THREE.Group(), card = new THREE.Group(); g.add(card);
  const top = new THREE.Mesh(own(new THREE.PlaneGeometry(.36, .36)), toon('#ffffff', { map: back })); top.rotation.x = -H; top.position.y = .012; top.material.userData.film = true;
  const bot = new THREE.Mesh(own(new THREE.PlaneGeometry(.36, .36)), toon('#ffffff', { map: face })); bot.rotation.x = H; bot.position.y = -.002; bot.material.userData.film = true;
  card.add(top, bot, new THREE.Mesh(own(Box(.36, .01, .36)), mat('#f4e2c0'))); card.children[2].position.y = .005;
  // open 0 → 1: lifts and turns over to show its picture
  g.userData.open = k => { card.rotation.z = k * Math.PI; card.position.y = Math.sin(k * Math.PI) * .2 + k * .012; };
  return g;
};

// ---------- props for Sự tích Hồ Gươm (Kid UI, 12 Oct) ----------
// a fishing net: a mesh of cord with cork floats along its top, hanging in a soft curve; userData.pull lifts it
PROPS.net = (w = 2.2, h = 1.2) => {
  const parts = [], n = 9, m = 6;
  for (let i = 0; i <= n; i++) { const x = -w / 2 + i * w / n; parts.push(P(Box(.018, h, .018), '#e8dcc0', [x, -h / 2 - Math.sin(i / n * Math.PI) * .18, 0])); }
  for (let j = 0; j <= m; j++) { const y = -j * h / m; parts.push(P(Box(w, .018, .018), '#e8dcc0', [0, y - Math.sin(.5 * Math.PI) * .1 * (j / m), 0])); }
  for (let i = 0; i < 6; i++) parts.push(P(Cyl(.06, .06, .12, 8), '#e8a832', [-w / 2 + .2 + i * (w - .4) / 5, .02, 0], [0, 0, H]));
  return mesh(parts);
};
// the magic sword (gươm thần): a shining blade and a golden handle with a red jewel; each can be shown on its own
PROPS.sword = () => {
  const g = new THREE.Group();
  const blade = mesh([P(Box(.07, .9, .015), '#e8f2ff', [0, .55, 0]), P(Cone(.05, .14, 4), '#e8f2ff', [0, 1.07, 0], [0, H / 2, 0], [1, 1, .3]), P(Box(.012, .82, .02), '#b8c8dc', [0, .55, 0])]);
  const hilt = mesh([P(Box(.32, .05, .06), '#e8b62a', [0, .08, 0]), P(Cyl(.03, .03, .26, 8), '#8a2a20', [0, -.07, 0]), P(S_(.05, 10, 8), '#e8b62a', [0, -.22, 0]), P(S_(.035, 8, 6), '#e8332a', [0, .08, .04])]);
  g.add(blade, hilt); g.userData.blade = blade; g.userData.hilt = hilt; return g;
};
// the Golden Turtle (Rùa Vàng): a big gentle turtle with a patterned shell; userData.head nods and holds the sword
PROPS.turtle = () => {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const parts = [P(S_(1, 18, 12), '#d8a02a', [0, .25, 0], [0, 0, 0], [1.25, .55, 1.5]), P(Cyl(1.22, 1.22, .12, 20), '#c88a1e', [0, .2, 0], [0, 0, 0], [1, 1, 1.2])];
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, d = i ? .62 : 0; parts.push(P(Cyl(.3, .32, .06, 6), '#f2c834', [Math.cos(a) * d, .78 - (i ? .1 : 0), Math.sin(a) * d * 1.2])); }
  [[.9, 1.1], [-.9, 1.1], [.95, -1], [-.95, -1]].forEach(([x, z]) => parts.push(P(S_(.32, 10, 8), '#b8a04a', [x, .1, z], [0, 0, 0], [1.6, .4, .9])));
  parts.push(P(Cone(.18, .45, 6), '#b8a04a', [0, .1, -1.75], [-H, 0, 0]));
  body.add(mesh(parts));
  const head = new THREE.Group(); head.position.set(0, .45, 1.75); body.add(head);
  head.add(mesh([P(S_(.36, 12, 10), '#b8a04a', [0, 0, .2], [0, 0, 0], [1, .85, 1.25]), P(S_(.08, 8, 6), '#ffffff', [.17, .12, .5]), P(S_(.08, 8, 6), '#ffffff', [-.17, .12, .5]), P(S_(.045, 6, 5), '#1a1410', [.18, .13, .56]), P(S_(.045, 6, 5), '#1a1410', [-.18, .13, .56])]));
  g.userData.head = head; g.userData.mouth = [0, -.1, .62];
  return g;
};
// Tháp Rùa, the Turtle Tower, on its little island in the lake: three storeys, arched windows, a small top
PROPS.turtleTower = () => {
  const parts = [P(Cyl(2.4, 2.8, .5, 20), '#7ab86a', [0, .05, 0]), P(Box(2.2, .3, 2.2), '#d8cfc0', [0, .35, 0])];
  [[2, 1.6, .5], [1.5, 1.1, 2.1], [1, .8, 3.25]].forEach(([w, h, y]) => {
    parts.push(P(Box(w, h, w), '#efe6d2', [0, y + h / 2, 0]));
    [0, 1, 2, 3].forEach(i => { const a = i * H, s = w / 2 + .01; parts.push(P(Box(w * .3, h * .55, .03), '#4a4a52', [Math.sin(a) * s, y + h * .45, Math.cos(a) * s], [0, a, 0])); });
    parts.push(P(Box(w + .3, .1, w + .3), '#c8bca8', [0, y + h + .05, 0]));
  });
  parts.push(P(Cone(.55, .6, 4), '#8a3a2a', [0, 4.45, 0], [0, Math.PI / 4, 0]), P(S_(.1, 8, 6), '#e8b62a', [0, 4.85, 0]));
  parts.push(...[0, 1, 2].map(i => P(S_(.6, 8, 6), '#4f9e42', [Math.cos(i * 2.1) * 1.9, .5, Math.sin(i * 2.1) * 1.9])));
  return mesh(parts);
};

// Story-only dressing: landmarks sit behind or beside the actors, leaving the centre clear.
// A page owns every added mesh, so the normal film disposal frees it on Next/Close.
function dressStory(S) {
  const { setting: kind, accent: c } = S.look;
  const parts = [], B = (w,h,d,color,x,y,z,rot=[0,0,0]) => parts.push(P(Box(w,h,d),color,[x,y,z],rot)),
    ball = (r,color,x,y,z,scale=[1,1,1]) => parts.push(P(S_(r,10,7),color,[x,y,z],[0,0,0],scale)),
    post = (r,h,color,x,y,z) => parts.push(P(Cyl(r,r,h,8),color,[x,y,z]));
  const flowers = (x,z,color=c,n=9) => { for(let i=0;i<n;i++){const px=x+Math.cos(i*2.4)*(1+i%3*.3),pz=z+Math.sin(i*2.4)*.8;post(.025,.4,'#43a45a',px,.2,pz);ball(.17,color,px,.43,pz,[1,.5,1]);ball(.06,'#ffd764',px,.5,pz);} };
  const tree = (x,z,color='#82bf70',fruit=null) => { post(.18,2.6,'#94673f',x,1.3,z);for(let i=0;i<4;i++)ball(1.1,color,x+Math.sin(i*2.4)*.7,2.8+i%2*.4,z+Math.cos(i*2.4)*.5);if(fruit)for(let i=0;i<7;i++)ball(.18,fruit,x+Math.sin(i*2.4),2.4+i%3*.35,z+Math.cos(i*2.4)*.9); };
  const rocks = (x,z,color='#c8af94',n=4) => { for(let i=0;i<n;i++)parts.push(P(new THREE.DodecahedronGeometry(.5+i%3*.2),color,[x+i*.8,.3,z+Math.sin(i)*.6],[i,.4,0],[1,.8,1])); };
  const bunting = (z=-4) => { [-7,7].forEach(x=>post(.07,4.6,'#94673f',x,2.3,z));B(14,.035,.035,'#94673f',0,4.4,z);for(let i=0;i<11;i++)parts.push(P(Cone(.24,.5,3),['#ff6fae','#ffb020','#29b6f6'][i%3],[-6+i*1.2,4.05,z],[0,0,Math.PI])); };
  const shelves = (x,z) => { B(2.6,.12,.8,'#ae8054',x,1,z);B(2.6,.12,.8,'#ae8054',x,2,z);[-1,1].forEach(dx=>post(.06,2.1,'#94673f',x+dx*1.2,1.05,z));for(let i=0;i<5;i++){ball(.18,['#ffd764','#c18de0','#ffb5a0'][i%3],x-1+i*.5,1.25,z);post(.16,.4,'#fff0d0',x-1+i*.5,2.25,z);} };
  switch(kind) {
    case 'island': case 'sea': case 'coast':
      // Distant sandbars and a readable white surf line, not extra buildings.
      for(let i=0;i<3;i++){const x=-24+i*24,z=-42-i%2*12;ball(5,'#f4dfac',x,-.6,z,[1.8,.2,1]);}
      for(let i=0;i<12;i++)ball(.16,'#fff6e4',-11+i*2,-.15,12.6+Math.sin(i)*.2,[2,.3,1]);
      if(kind!=='sea'){flowers(-8,kind==='coast'?9:-2,'#ffb5a0',5);rocks(7,kind==='coast'?8:-3,'#e8d4b3',3);} break;
    case 'bamboo':
      // Batch the additional bamboo into the dressing mesh: no extra draw call per leaf.
      for (const x of [-6, 7]) for (let i=0;i<5;i++) { const px=x+i*.25,h=5+i*.45; post(.075,h,'#69be70',px,h/2,-10); for(let j=1;j<5;j++) { post(.095,.06,'#a0d18a',px,j*h/5,-10); parts.push(P(Cone(.2,1.1,4),'#87cb6b',[px+.3,j*h/5+.4,-10],[0,0,-.9],[1,1,.3])); } }
      B(4,.18,1,'#cda56b',-6,.12,-2);for(let i=0;i<5;i++)post(.065,1.3,'#e8ce91',-7.5+i*.7,.75,-2);flowers(7,-3);break;
    case 'tet': case 'newyear': case 'festival': case 'wedding': case 'moonfestival':
      bunting();SETS.blossom(S,-7,-6);SETS.blossom(S,7,-7);
      [-6,-3,3,6].forEach((x,i)=>SETS.lantern(S,x,3.7,-4,i%2?'#ffd764':c));
      if(kind==='tet'){B(1.2,.4,1.2,'#63b869',-5,.2,-2);B(.06,.42,1.22,'#fff0d0',-5,.21,-2);B(1.22,.42,.06,'#fff0d0',-5,.21,-2);}
      break;
    case 'palace': case 'cloudcourt':
      // Two small garden pavilions frame the existing throne, never replace its actor positions.
      [-10,10].forEach(x=>{post(.25,3,'#dc7661',x,1.5,-8);parts.push(P(Cone(1.6,1.2,4),c,[x,3.4,-8],[0,Math.PI/4,0],[1.2,1,.8]));ball(.22,'#ffd764',x,4.1,-8);});
      flowers(-7,-3,'#ff6fae');flowers(7,-3,'#ffd764');break;
    case 'rice': case 'farm':
      SETS.paddy(S,-11,-7,6,5);B(2,.22,1,'#cda56b',6,.12,-3);for(let i=0;i<3;i++)ball(.45,'#e7c776',5.3+i*.65,.45,-3,[.65,1,1]);break;
    case 'kitchen': case 'pantry': case 'study': case 'art': case 'indigo':
      // Interior dressing close enough for the mice's low camera as well as a human-height shot.
      shelves(kind==='pantry'?-3:-5,kind==='pantry'?-2.65:-4);
      if(kind==='art'||kind==='indigo'){for(let i=0;i<4;i++){post(.3,.6,['#8a5cf6','#29b6f6','#ff6fae','#ffb020'][i],5+i*.65,.3,-3);B(.5,.06,.5,'#fff6e4',5+i*.65,.62,-3);}}
      if(kind==='study'){B(2,.8,1,'#b78858',5,.4,-3);B(1.4,.05,.7,'#fff6e4',5,.84,-3);}
      break;
    case 'orchard': case 'pears': case 'mango': case 'garden': case 'herbs':
      tree(-7,-6,'#8ac775',kind==='pears'?'#e1da68':kind==='mango'?'#ffb020':null);tree(7,-8,'#a2ce7e',kind==='orchard'?c:null);
      flowers(-5,-2,kind==='herbs'?'#c18de0':c);flowers(6,-2,'#ffb5a0');
      if(kind==='pears'){B(2,.15,.9,'#bc8d59',-5,.75,-2);for(let i=0;i<5;i++)ball(.2,'#e1da68',-5.6+i*.3,.98,-2);}
      break;
    case 'gourd':
      [-7,7].forEach(x=>{post(.09,3.8,'#b58b58',x,1.9,-5);B(3,.12,.15,'#b58b58',x,3.7,-5);for(let i=0;i<4;i++){ball(.35,'#a0cd78',x-1+i*.65,3.1,-5,[.7,1.4,.7]);ball(.13,'#63b869',x-1+i*.65,3.6,-5);}});break;
    case 'meadow': case 'pasture': case 'courtyard':
      tree(-8,-8);flowers(-6,-2);flowers(7,-5,'#fff6e4');
      if(kind==='pasture')for(let i=0;i<7;i++){post(.06,1,'#cda56b',-8+i*1.5,.5,-7);B(1.5,.08,.1,'#cda56b',-7.25+i*1.5,.7,-7);}
      if(kind==='courtyard'){B(3,.25,1,'#d8c7a5',6,.45,-4);B(3,.15,1.2,'#e8dcc8',6,.65,-4);}break;
    case 'forest': case 'jungle': case 'music': case 'flowers': case 'wildflowers':
      tree(-7,-8,kind==='jungle'?'#56aa78':'#8ac775');tree(7,-10,'#9ad17b');flowers(-5,-3);flowers(6,-3,kind==='wildflowers'?'#29b6f6':'#ffd764');
      if(kind==='music'){B(2.2,.5,1,'#d8c7a5',-5,.25,-2);for(let i=0;i<5;i++)post(.04,.4+i*.1,'#cda56b',-5.7+i*.3,.8,-2);}break;
    case 'cave': case 'cliffs': case 'mountain': case 'treasure':
      [-9,9].forEach((x,i)=>{ball(3.6,i?'#b7b3ca':'#b4c5bc',x,1.3,-10,[1,1.3,1]);rocks(x-2,-7,'#c9c4d8',3);});
      if(kind==='cave'){ball(3,'#998b9e',0,1,-13,[1.8,1.4,.7]);ball(2,'#766a85',0,.8,-10.8,[1,1,.18]);}
      if(kind==='treasure')for(let i=0;i<7;i++)parts.push(P(new THREE.OctahedronGeometry(.35),['#ffd764','#ffb020','#8a5cf6'][i%3],[-6+i*.6,.4,-3],[.4,i,0]));
      if(kind==='mountain')SETS.clouds(S,[[-12,3,-24,1.2],[13,4,-30,1.6]]);break;
    case 'lotus': case 'lake': case 'river': case 'tropicalriver': case 'falls':
      // Bank-side reeds and flowers; leave the boats, fish, waterfall and crossing channel open.
      const bankZ=kind==='lake'?-29:kind==='falls'?-9:-12;
      if(kind==='falls')[-10,10].forEach(x=>ball(3.5,'#bacad0',x,-.85,-9,[1,.3,1]));
      for(const x of (kind==='falls'?[-10,10]:[-8,8])){for(let i=0;i<6;i++)post(.03,.8+i%3*.2,'#63b869',x+i*.16,.4,bankZ);flowers(x,bankZ-1,kind==='lotus'?'#ff6fae':'#ffd764',5);}
      if(kind==='lake'){SETS.blossom(S,-12,-30);B(5,.15,1.5,'#d8c7a5',10,.05,-24.7);[7.7,12.3].forEach(x=>post(.08,.8,'#ae8054',x,-.3,-24.2));}
      if(kind==='tropicalriver'){tree(-9,-16,'#83c96b','#ffb020');SETS.palm(S,12,-18,.2);if(S.look.islet)ball(3.4,'#b7cf8a',0,-.7,-3,[1,.25,1]);}
      if(kind==='falls')rocks(-11,-9,'#bacad0',5);
      break;
    case 'coral':
      for(let i=0;i<8;i++){const x=-7+i*2;post(.08,.8+i%3*.4,['#ff9eb5','#c18de0','#ffb070'][i%3],x,.4,-5);ball(.3,c,x,.9+i%3*.3,-5);}
      ball(2,'#a1d2db',-9,.3,-12,[1.8,.7,1]);break;
    case 'moon': case 'stars': case 'silk':
      if(kind==='silk'){B(2.4,.14,.9,'#b58b58',-5,1.2,-3);for(let i=0;i<6;i++)B(.25,.03,.8,['#c18de0','#ff6fae','#29b6f6'][i%3],-6+i*.35,1.3,-3);}
      else for(let i=0;i<8;i++)parts.push(P(new THREE.OctahedronGeometry(.16),i%2?'#ffd764':'#c18de0',[-8+i*2.2,5+i%3,-16],[0,0,.3]));break;
    case 'grassland': case 'eucalyptus': case 'picnic':
      // Pale branching gum trunks and airy crowns, rather than village houses.
      for(const x of [-7,8]){post(.18,3.8,'#e8dcc8',x,1.9,-7);parts.push(P(Cyl(.09,.12,2), '#e8dcc8',[x+.5,3.2,-7],[0,0,-.65]));ball(1.6,'#a4c7a1',x,4,-7,[1.3,.6,1]);}
      if(kind==='picnic'){B(2.4,.02,1.6,'#fff6e4',-5,.03,-2);for(let i=0;i<5;i++)B(.2,.025,1.6,c,-6+i*.5,.04,-2);}
      else flowers(-5,-3,kind==='grassland'?'#ffd764':'#ffb5a0',6);break;
    case 'dry': case 'earth': case 'rain': case 'waterhole': case 'ruins':
      rocks(-8,-8,kind==='earth'?'#d18b69':'#d8c7a5',5);
      if(kind==='ruins')[-8,8].forEach(x=>{post(.35,2.8,'#d8c7a5',x,1.4,-8);B(1.2,.3,1,'#e8dcc8',x,2.9,-8);});
      if(kind==='waterhole'){flowers(-7,-3,'#ffd764',5);flowers(8,-6,'#fff6e4',5);}
      if(kind==='rain')for(let i=0;i<5;i++)ball(.32,'#9acbd0',-8+i*.6,.04,-4,[1,.1,1]);break;
    case 'race':
      for(const x of [-9,9]){post(.1,4,'#dc7661',x,2,-7);for(let i=0;i<3;i++)B(.9,.35,.06,['#e85a55','#ffd764','#29b6f6'][i],x+.4,3.6-i*.6,-7);}
      B(4,.12,1,'#e8dcc8',7,.1,4);break;
  }
  if(parts.length){const o=mesh(parts);o.userData.storyScenery=kind;S.add(o);}
}

// Homes carry a story role and a different silhouette. Generic repeated houses are omitted
// from forests, lake banks, mountain journeys and the open family gathering scenes.
function storyHouse(S, x, z, ry) {
  const style = S.look.house, c = S.look.accent;
  if (style === 'none') return S.add(new THREE.Group(), x, 0, z, ry);
  if (style === 'hut') return SETS.hut(S, x, z, ry);
  const parts = [], add = (g,c,p,r=[0,0,0],s=[1,1,1]) => parts.push(P(g,c,p,r,s));
  const open = style === 'pavilion' || style === 'workshop';
  const w = style === 'farm' ? 7 : style === 'study' ? 4 : 5.4, h = style === 'court' ? 3 : 2.3;
  add(Box(w+.6,.2,4.4),'#e8d5b4',[0,.1,0]);
  if (!open) { add(Box(w,h,3.6),'#fff0d0',[0,h/2+.2,0]);add(Box(1.25,1.9,.12),'#815936',[0,1.15,1.82]); }
  else add(Box(w,h,.25),'#f4dfbd',[0,h/2+.2,-1.7]);
  [-1,1].forEach(v=>{add(Cyl(.12,.12,h+.2,8),'#ac744a',[v*(w/2-.2),h/2+.2,1.8]);if(!open)add(Box(.9,.8,.13),c,[v*w*.32,1.55,1.83]);});
  if(style==='pavilion'){
    add(Cyl(w*.58,w*.65,.3,8),'#ffcf76',[0,h+.35,0]);add(S_(w*.45),'#ffb070',[0,h+.5,0],[0,0,0],[1,.65,1]);add(S_(.18),'#ffd764',[0,h+2.2,0]);
  } else {
    add(Cone(w*.8,style==='farm'?1.3:1.8,4),style==='farm'?'#dab779':style==='court'?'#70a8b8':'#d47a68',[0,h+1,0],[0,Math.PI/4,0],[1.2,1,.85]);
    add(Box(w+.6,.18,1.4),c,[0,h+.1,2.2]);
    if(style==='study')add(Box(.8,.8,.2),'#fff6e4',[0,h+.7,1.8]);
  }
  [-1,1].forEach(v=>{add(Cyl(.28,.22,.4,8),'#d69a73',[v*(w/2+.5),.25,1.8]);add(S_(.4),c,[v*(w/2+.5),.65,1.8]);});
  const o=mesh(parts);o.userData.storyHouse=style;return S.add(o,x,0,z,ry);
}
