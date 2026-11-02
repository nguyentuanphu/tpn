// Prototype "storybook toy" animals and trees, built with the game's own materials, for the owner to see.
import { THREE, toonSmooth, outline } from '../../js/gfx.js';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const S = (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);
// a part: geometry, colour (top colour; the bottom is a little darker), position, rotation, scale
function part(geo, color, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1], dark = .78) {
  const g = (geo.index ? geo.toNonIndexed() : geo.clone());
  g.applyMatrix4(new THREE.Matrix4().compose(V(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), V(...(typeof scl === 'number' ? [scl, scl, scl] : scl))));
  g.computeBoundingBox(); const bb = g.boundingBox, top = new THREE.Color(color), bot = top.clone().multiplyScalar(dark), c = new THREE.Color();
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const k = (p.getY(i) - bb.min.y) / Math.max(1e-3, bb.max.y - bb.min.y); c.copy(bot).lerp(top, k); col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}
function mesh(parts, line = true) {
  const geo = mergeAll(parts); const m = new THREE.Mesh(geo, toonSmooth()); m.castShadow = true; if (line) outline(m, .02, '#4a3a3f'); return m;
}
function mergeAll(gs) {
  let n = 0; gs.forEach(g => n += g.attributes.position.count);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
  for (const g of gs) { if (!g.attributes.normal) g.computeVertexNormals(); pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); col.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('color', new THREE.BufferAttribute(col, 3)); return m;
}
const tube = (pts, r, color, seg = 24) => part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => V(...p))), seg, r, 10, false), color);
// eyes: white, a big dark pupil and a little shine (all facing +z)
const eyes = (x, y, z, r = .09, sep = .16, dark = '#2a1d18') => [-1, 1].flatMap(s => [part(S(r), '#ffffff', [s * sep + x, y, z], [0, 0, 0], [1, 1, .6], 1), part(S(r * .66), dark, [s * sep + x, y - r * .1, z + r * .3], [0, 0, 0], [1, 1, .6], 1), part(S(r * .22), '#ffffff', [s * sep + x - r * .2, y + r * .25, z + r * .62], [0, 0, 0], 1, 1)]);
const cheeks = (y, z, sep, col = '#f29a9a') => [-1, 1].map(s => part(S(.07), col, [s * sep, y, z], [0, 0, 0], [1, .6, .4], 1));

// ---------- animals ----------
function buffalo() {
  const g = new THREE.Group(), C = '#5f646b';
  const p = [part(S(.9), C, [0, 1.05, 0], [0, 0, 0], [1, .82, 1.35]), ...[[-.42, .62], [.42, .62], [-.42, -.62], [.42, -.62]].map(([x, z]) => part(new THREE.CapsuleGeometry(.18, .45, 6, 12), '#52575e', [x, .42, z])),
    part(S(.6), '#666b72', [0, 1.45, 1.25]), part(S(.36), '#9aa0a8', [0, 1.25, 1.72], [0, 0, 0], [1.15, .8, .8]), ...[-1, 1].map(s => part(S(.05), '#3a3a3a', [s * .12, 1.27, 2.0])),
    ...[-1, 1].map(s => tube([[s * .4, 1.85, 1.2], [s * .85, 1.95, 1.05], [s * 1.05, 2.25, .85], [s * .9, 2.5, .75]], .07, '#efe6d2')),
    ...[-1, 1].map(s => part(S(.16), '#5a5f66', [s * .55, 1.62, 1.18], [0, 0, s * .6], [1.4, .6, .8])),
    ...eyes(0, 1.6, 1.74, .1, .22), tube([[0, 1.3, -1.2], [0, 1.0, -1.45], [.05, .7, -1.5]], .05, '#52575e'), part(S(.09), '#3a3a3a', [.05, .62, -1.5])];
  g.add(mesh(p));
  // a white egret friend on its back
  const e = [part(S(.22), '#ffffff', [0, 2.1, -.2], [0, 0, 0], [.8, .9, 1.3], .9), tube([[0, 2.2, 0], [0, 2.45, .1], [0, 2.55, .22]], .05, '#ffffff'), part(S(.09), '#ffffff', [0, 2.58, .26], [0, 0, 0], 1, .9), part(new THREE.ConeGeometry(.04, .22, 8), '#f2b630', [0, 2.57, .44], [Math.PI / 2, 0, 0]), part(S(.025), '#222', [.06, 2.62, .3])];
  g.add(mesh(e)); return g;
}
function kangaroo() {
  const g = new THREE.Group(), C = '#c98a52';
  const p = [part(S(.55), C, [0, 1.15, 0], [-.25, 0, 0], [1, 1.35, .95]), part(S(.36), '#ecc9a0', [0, 1.05, .32], [-.25, 0, 0], [1, 1.2, .6]),
    part(S(.38), C, [0, 2.05, .2]), part(S(.18), '#d8a070', [0, 1.95, .52], [0, 0, 0], [1, .8, 1]), part(S(.06), '#4a2a1a', [0, 2.0, .68]),
    ...[-1, 1].map(s => part(S(.13), C, [s * .18, 2.5, .1], [0, 0, s * .25], [.6, 1.9, .4])), ...[-1, 1].map(s => part(S(.08), '#f0c8b0', [s * .18, 2.5, .15], [0, 0, s * .25], [.4, 1.4, .3])),
    ...eyes(0, 2.12, .5, .09, .14), ...cheeks(1.98, .52, .2),
    ...[-1, 1].map(s => part(S(.2), '#b87a46', [s * .28, .55, .1], [0, 0, 0], [.8, 1.2, 1])), ...[-1, 1].map(s => part(S(.16), '#a86a3a', [s * .28, .16, .3], [0, 0, 0], [.75, .55, 2.1])), ...[-1, 1].map(s => tube([[s * .28, .5, .1], [s * .28, .28, .2], [s * .28, .18, .3]], .1, '#b87a46')),
    ...[-1, 1].map(s => tube([[s * .32, 1.5, .25], [s * .4, 1.25, .45], [s * .3, 1.15, .55]], .07, C)),
    tube([[0, .8, -.4], [0, .45, -.9], [0, .15, -1.5]], .16, C), part(S(.16), C, [0, .15, -1.5])];
  g.add(mesh(p));
  // the joey peeking out of the pouch
  g.add(mesh([part(S(.17), '#d49a62', [0, 1.38, .5]), ...[-1, 1].map(s => part(S(.06), '#d49a62', [s * .09, 1.56, .48], [0, 0, s * .3], [.6, 1.6, .4])), ...eyes(0, 1.42, .64, .045, .07), part(S(.03), '#4a2a1a', [0, 1.36, .67])]));
  return g;
}
function koala() {
  const g = new THREE.Group(), C = '#9aa1a8';
  // a gum branch to hug
  g.add(mesh([tube([[-.9, 0, -.2], [-.3, 1.0, -.25], [.2, 2.0, -.2], [.3, 2.9, -.15]], .16, '#e9e1d2'), ...[[.4, 2.7, .1], [.1, 2.95, -.1], [-.2, 2.6, .05], [.55, 2.4, -.1]].map(([x, y, z]) => part(S(.32, 12, 8), '#8aaa7a', [x, y, z], [0, 0, 0], [1.4, .55, 1]))]));
  const p = [part(S(.45), C, [-.05, 1.25, .15], [0, 0, 0], [1, 1.15, .95]), part(S(.28), '#efeae2', [-.05, 1.2, .48], [0, 0, 0], [1, 1.2, .5]),
    part(S(.4), '#a8afb6', [0, 1.95, .25]), ...[-1, 1].map(s => part(S(.24), '#a8afb6', [s * .38, 2.18, .2], [0, 0, 0], [1, 1, .55])), ...[-1, 1].map(s => part(S(.15), '#f2e9e4', [s * .38, 2.18, .3], [0, 0, 0], [1, 1, .4])),
    part(S(.14), '#3a3a3a', [0, 1.9, .62], [0, 0, 0], [.85, 1.15, .7], .9), ...eyes(0, 2.04, .58, .07, .17, '#1a1a1a'),
    ...[-1, 1].map(s => tube([[s * .3, 1.55, .3], [s * .3, 1.6, .05], [s * .2, 1.65, -.2]], .1, C)), ...[-1, 1].map(s => tube([[s * .25, .95, .35], [s * .3, .9, .05], [s * .2, .95, -.2]], .11, C))];
  g.add(mesh(p)); return g;
}
function elephant() {
  const g = new THREE.Group(), C = '#9d9dab';
  const p = [part(S(1.0), C, [0, 1.55, 0], [0, 0, 0], [1, .9, 1.3]), ...[[-.5, .7], [.5, .7], [-.5, -.7], [.5, -.7]].map(([x, z]) => part(new THREE.CylinderGeometry(.27, .3, 1.0, 14), '#8d8d9b', [x, .5, z])),
    ...[[-.5, .7], [.5, .7], [-.5, -.7], [.5, -.7]].map(([x, z]) => part(S(.29), '#f0e8dc', [x, .05, z + .05], [0, 0, 0], [1, .3, 1])),
    part(S(.7), '#a8a8b6', [0, 2.15, 1.25]), ...[-1, 1].map(s => part(S(.6), '#a4a4b2', [s * .72, 2.15, 1.0], [0, s * .5, 0], [.25, 1.05, 1])), ...[-1, 1].map(s => part(S(.42), '#e8c4c8', [s * .74, 2.15, 1.04], [0, s * .5, 0], [.2, .9, .8])),
    tube([[0, 2.0, 1.85], [0, 1.6, 2.15], [0, 1.0, 2.2], [0, .75, 2.4], [0, .85, 2.6]], .17, '#a0a0ae', 32), ...eyes(0, 2.35, 1.86, .09, .3), ...cheeks(2.05, 1.88, .38),
    part(new THREE.BoxGeometry(1.5, .1, 1.3), '#e2382f', [0, 2.38, -.05], [0, 0, 0], 1, .9), ...[-.45, 0, .45].map(x => part(S(.07), '#ffd23f', [x, 2.45, .62], [0, 0, 0], 1, 1)),
    tube([[0, 1.6, -1.3], [0, 1.3, -1.45], [0, .9, -1.4]], .06, C)];
  g.add(mesh(p)); return g;
}
function panda() {
  const g = new THREE.Group();
  const p = [part(S(.6), '#ffffff', [0, .75, 0], [0, 0, 0], [1, 1.05, .95], .9), part(S(.5), '#ffffff', [0, 1.6, .1], [0, 0, 0], 1, .9),
    ...[-1, 1].map(s => part(S(.17), '#2a2a2a', [s * .36, 2.02, .05])), ...[-1, 1].map(s => part(S(.15), '#2a2a2a', [s * .18, 1.66, .5], [0, 0, s * .5], [.75, 1.1, .5])),
    ...[-1, 1].flatMap(s => [part(S(.09), '#ffffff', [s * .18, 1.68, .58], [0, 0, 0], [1, 1, .6], 1), part(S(.055), '#1a1a1a', [s * .18, 1.67, .62], [0, 0, 0], [1, 1, .6], 1), part(S(.02), '#ffffff', [s * .16, 1.7, .66], [0, 0, 0], 1, 1)]),
    part(S(.09), '#2a2a2a', [0, 1.5, .6], [0, 0, 0], [1.2, .8, .7]), ...cheeks(1.45, .5, .26, '#f6b6c0'),
    ...[-1, 1].map(s => part(S(.22), '#2a2a2a', [s * .42, 1.1, .25], [0, 0, s * -.5], [.8, 1.5, .8])), ...[-1, 1].map(s => part(S(.24), '#2a2a2a', [s * .32, .25, .35], [0, 0, 0], [1, .7, 1.2])),
    tube([[.55, .5, .5], [.6, 1.4, .6], [.68, 2.3, .55]], .045, '#7fbf4a'), ...[[.68, 2.2, .55, .5], [.62, 1.9, .6, -.6], [.7, 2.35, .5, .9]].map(([x, y, z, r]) => part(S(.16, 10, 6), '#5fae4a', [x + .12, y, z], [0, 0, r], [1.3, .3, .5]))];
  g.add(mesh(p)); return g;
}
// ---------- trees ----------
const clump = (x, y, z, r, col) => part(new THREE.IcosahedronGeometry(r, 2), col, [x, y, z], [0, 0, 0], 1, .7);
function banyan() {
  const p = [part(new THREE.CylinderGeometry(.55, .9, 3.2, 14), '#7a5a3a', [0, 1.6, 0], [0, 0, 0], 1, .8), ...[[-.9, .4], [.8, .6], [.2, -.9], [-.4, 1], [1.2, -.4]].map(([x, z]) => part(new THREE.CylinderGeometry(.08, .1, 3.6, 6), '#8a6a4a', [x * 1.6, 1.8, z * 1.6])),
    ...[[0, 4.6, 0, 1.8], [-1.6, 4.1, .5, 1.4], [1.6, 4.2, -.2, 1.5], [.4, 4.0, 1.6, 1.3], [-.6, 4.2, -1.5, 1.3], [.6, 5.6, -.3, 1.2], [-1, 5.2, .6, 1.0]].map(([x, y, z, r]) => clump(x, y, z, r, '#5f9f45'))];
  return mesh(p);
}
function bamboo() {
  const p = [];
  [[0, 0, 7.5, .02], [.5, .3, 6.8, .1], [-.45, .2, 7, -.08], [.2, -.5, 6.2, .06], [-.3, -.4, 6.6, -.12], [.6, -.2, 5.8, .14]].forEach(([x, z, h, lean]) => {
    p.push(part(new THREE.CylinderGeometry(.09, .11, h, 10), '#86c25a', [x + Math.sin(lean) * h / 2, h / 2, z], [0, 0, -lean], 1, .85));
    for (let k = 1; k < h; k += 1.1) p.push(part(new THREE.TorusGeometry(.105, .025, 6, 12), '#5f9f3a', [x + Math.sin(lean) * k, k, z], [Math.PI / 2, 0, 0], 1, 1));
    for (let k = 0; k < 7; k++) { const a = k * 2.4, y = h * (.55 + k * .065); p.push(part(S(.42, 10, 6), k % 2 ? '#6fbf4a' : '#5fae44', [x + Math.sin(lean) * y + Math.cos(a) * .45, y, z + Math.sin(a) * .45], [0, -a, .5], [1.4, .14, .45], .85)); }
  });
  return mesh(p);
}
function gum() {
  const p = [tube([[0, 0, 0], [.1, 2, 0], [-.1, 3.8, .1], [0, 5.5, 0]], .28, '#efe8dc'), tube([[0, 3.2, 0], [.9, 4.4, .2], [1.6, 5.4, .1]], .14, '#e8e0d2'), tube([[0, 3.8, 0], [-1, 4.8, -.2], [-1.5, 5.6, -.3]], .12, '#e8e0d2'),
    ...[[0, 6.3, 0, 1.2], [1.6, 5.9, .2, 1.0], [-1.5, 6.1, -.3, 1.0], [.4, 6.9, -.4, .8]].map(([x, y, z, r]) => part(new THREE.IcosahedronGeometry(r, 2), '#94b08a', [x, y, z], [0, 0, 0], [1.2, .7, 1.1], .7))];
  return mesh(p);
}
function jacaranda() {
  const p = [part(new THREE.CylinderGeometry(.22, .34, 3, 10), '#6b5040', [0, 1.5, 0]), tube([[0, 2.6, 0], [.9, 3.4, .2]], .12, '#6b5040'), tube([[0, 2.8, 0], [-.9, 3.5, -.2]], .12, '#6b5040'),
    ...[[0, 4.3, 0, 1.5], [1.3, 3.9, .3, 1.1], [-1.3, 4.0, -.2, 1.1], [.3, 5.1, .2, 1.0], [-.5, 4.6, 1, .9]].map(([x, y, z, r], k) => clump(x, y, z, r, k % 2 ? '#a78ae0' : '#9575d6')),
    ...Array.from({ length: 26 }, (_, k) => { const a = k * 2.4, d = 1 + (k % 5) * .5; return part(S(.09, 6, 4), '#b39ce6', [Math.cos(a) * d, .03, Math.sin(a) * d], [0, 0, 0], [1, .25, 1], 1); })];
  return mesh(p);
}
function flame() {
  const p = [part(new THREE.CylinderGeometry(.22, .32, 2.6, 10), '#6a4a3a', [0, 1.3, 0]), ...[-1, 1].map(s => tube([[0, 2.4, 0], [s * 1.2, 3.0, 0], [s * 2, 3.2, .1]], .1, '#6a4a3a')),
    part(new THREE.IcosahedronGeometry(2.2, 2), '#4f8f3a', [0, 3.6, 0], [0, 0, 0], [1.25, .45, 1.1], .7),
    ...Array.from({ length: 30 }, (_, k) => { const a = k * 2.4, d = .3 + (k % 5) * .5, ry = 3.6 + .99 * Math.sqrt(Math.max(0, 1 - (d / 2.7) ** 2)); return part(new THREE.IcosahedronGeometry(.34, 1), k % 3 ? '#e8432a' : '#ff6a3a', [Math.cos(a) * d, ry, Math.sin(a) * d * .9], [0, 0, 0], [1, .55, 1], .85); })];
  return mesh(p);
}
function coconut() {
  const p = [tube([[0, 0, 0], [.4, 2, 0], [.8, 4, 0], [.9, 5.6, 0]], .2, '#a8875a', 30), ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap(k => { const a = k / 8 * Math.PI * 2, cx = .9, out = [];
      out.push(tube([[cx, 5.6, 0], [cx + Math.cos(a) * 1.4, 6.1, Math.sin(a) * 1.4], [cx + Math.cos(a) * 2.6, 5.4, Math.sin(a) * 2.6], [cx + Math.cos(a) * 3.1, 4.7, Math.sin(a) * 3.1]], .05, '#4f9a3a', 20));
      for (let t = .25; t < 1; t += .12) { const r = 3.1 * t, y = 5.6 + Math.sin(t * Math.PI) * .6 - t * t * .9; out.push(part(S(.36, 8, 5), k % 2 ? '#5fae4a' : '#6fbf55', [cx + Math.cos(a) * r, y, Math.sin(a) * r], [0, -a, 0], [.3, .07, 1.0 - t * .5], .85)); }
      return out; }),
    ...[0, 1, 2].map(k => part(S(.18), '#7a5a2a', [.9 + Math.cos(k * 2.1) * .22, 5.35, Math.sin(k * 2.1) * .22]))];
  return mesh(p);
}
// ---------- the scene ----------
const W = innerWidth, H = innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.setPixelRatio(1); renderer.shadowMap.enabled = true; document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#bfe3f2');
scene.add(new THREE.HemisphereLight('#ffffff', '#8fae6a', 1.6));
const sun = new THREE.DirectionalLight('#fff3e0', 2.2); sun.position.set(6, 12, 8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16 }); scene.add(sun);
const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 64), toonSmooth()); ground.geometry = (() => { const g = part(new THREE.CircleGeometry(40, 64), '#a8d88a', [0, 0, 0], [-Math.PI / 2, 0, 0], 1, 1); return g; })(); ground.receiveShadow = true; scene.add(ground);
const cam = new THREE.PerspectiveCamera(32, W / H, .1, 200);
const which = new URLSearchParams(location.search).get('show') || 'animals';
const row = (list, gap) => list.forEach((o, i) => { o.position.x = (i - (list.length - 1) / 2) * gap; scene.add(o); });
if (which === 'animals') { const a = [buffalo(), kangaroo(), koala(), elephant(), panda()]; a[0].rotation.y = .5; a[1].rotation.y = .2; a[3].rotation.y = -.4; row(a, 4.2); cam.position.set(0, 5.2, 18); cam.lookAt(0, 1.4, 0); }
else if (which === 'scene') {
  const put = (o, x, z, r = 0, sc = 1) => { o.position.set(x, 0, z); o.rotation.y = r; o.scale.setScalar(sc); scene.add(o); };
  put(banyan(), -9, -8, 0, 1); put(bamboo(), 7, -7, 0, 1); put(jacaranda(), 12, -2, 0, .9); put(coconut(), -13, -1, .4, .9); put(flame(), 2, -12, 0, 1);
  put(buffalo(), -3.5, 0, .7, 1); put(kangaroo(), 3.2, 1.5, -.5, 1); put(panda(), 6.2, -1.5, -.6, .9); put(elephant(), -1, -5.5, .3, 1.1);
  const path = part(new THREE.CircleGeometry(2.2, 32), '#c9845a', [0, .02, 0], [-Math.PI / 2, 0, 0], [5, 1, .55], 1); scene.add(new THREE.Mesh(path, toonSmooth()));
  cam.position.set(0, 6.5, 14); cam.lookAt(0, 1.6, -2);
}
else { const t = [banyan(), bamboo(), gum(), jacaranda(), flame(), coconut()]; row(t, 6.6); cam.position.set(0, 7.5, 36); cam.lookAt(0, 3.6, 0); }
renderer.render(scene, cam); window.done = true;
