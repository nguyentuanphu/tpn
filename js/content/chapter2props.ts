// Things Chapter 2 of the lantern story (Hà Nội) shows both in the valley (js/content/chapter2hanoi.js) and in its
// festival film (js/content/chapter2films.js): the star lantern (đèn ông sao) children carry at Trung Thu, the stone
// turtle carrying a stele at Văn Miếu, the lion head of the lion dance (múa lân) and the red Thê Húc bridge. Toon
// shapes only, small (G9), friendly (G8).
import { THREE, P, merge, toonVC, glow } from '../gfx.js';

const H = Math.PI / 2;
// a five-pointed star of thin paper on a bamboo stick, a candle glow inside; lit = it glows
export function buildStarLantern(color = '#ff4a3a', lit = true) {
  const g = new THREE.Group(), s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? .13 : .3, a = i / 10 * Math.PI * 2 + H; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const geo = new THREE.ExtrudeGeometry(s, { depth: .1, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 1 }); geo.translate(0, 0, -.05);
  const star = new THREE.Mesh(geo, lit ? glow(color) : new THREE.MeshToonMaterial({ color })); star.position.y = 1.15; g.add(star);
  const bits = [P(new THREE.CylinderGeometry(.015, .02, 1.3, 5), '#c9a25a', [0, .55, -.12], [.18, 0, 0]),
    ...[-1, 1].map(s => P(new THREE.CylinderGeometry(.012, .03, .28, 5), '#ffd23f', [s * .1, .82, 0], [0, 0, s * .2]))];
  g.add(new THREE.Mesh(merge(bits), toonVC()));
  if (lit) { const c = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), glow('#fff2a8')); c.position.set(0, 1.15, .1); g.add(c); }
  g.userData.star = star;
  return g;
}

// a stone turtle carrying a stone stele with a rounded top (the doctors' steles of Văn Miếu); about 1 m long
export function buildStoneTurtle() {
  const stone = '#9a968c', dark = '#7e7a70', slab = '#b8b2a4';
  const parts = [
    P(new THREE.SphereGeometry(.5, 12, 8), stone, [0, .22, 0], [0, 0, 0], [1, .45, 1.25]),
    P(new THREE.SphereGeometry(.17, 10, 8), stone, [0, .26, .72]),
    P(new THREE.SphereGeometry(.04, 6, 5), '#3a3630', [.08, .32, .85]), P(new THREE.SphereGeometry(.04, 6, 5), '#3a3630', [-.08, .32, .85]),
    ...[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([x, z]) => P(new THREE.SphereGeometry(.12, 8, 6), dark, [x * .38, .1, z * .42], [0, 0, 0], [1.2, .6, 1])),
    P(new THREE.BoxGeometry(.62, .9, .12), slab, [0, .82, -.02]),
    P(new THREE.CylinderGeometry(.31, .31, .12, 14, 1, false, 0, Math.PI), slab, [0, 1.27, -.02], [H, H, 0]),
    P(new THREE.BoxGeometry(.4, .5, .02), '#a49e90', [0, .82, .05])
  ];
  const m = new THREE.Mesh(merge(parts), toonVC()); m.castShadow = true;
  const g = new THREE.Group(); g.add(m); return g;
}

// the lion head of a Trung Thu lion dance: big friendly eyes, a smile, a red and gold mane (never scary: G8)
export function buildLionHead() {
  const parts = [
    P(new THREE.SphereGeometry(.42, 14, 10), '#e8433a', [0, 0, 0], [0, 0, 0], [1.1, 1, 1]),
    P(new THREE.SphereGeometry(.2, 10, 8), '#ffd23f', [0, -.1, .34], [0, 0, 0], [1.3, .8, .8]),
    ...[-1, 1].flatMap(s => [P(new THREE.SphereGeometry(.12, 10, 8), '#ffffff', [s * .17, .14, .32]), P(new THREE.SphereGeometry(.06, 8, 6), '#2a2a3a', [s * .17, .14, .43]),
      P(new THREE.ConeGeometry(.07, .2, 6), '#ffd23f', [s * .26, .42, .05], [0, 0, -s * .4])]),
    P(new THREE.TorusGeometry(.12, .025, 6, 12, Math.PI), '#7a1a14', [0, -.16, .45], [0, 0, Math.PI]),
    P(new THREE.SphereGeometry(.08, 8, 6), '#ff8ab0', [0, .04, .5]),
    ...[...Array(9)].map((_, i) => { const a = -1.3 + i * .32; return P(new THREE.SphereGeometry(.11, 8, 6), i % 2 ? '#ffd23f' : '#ff7a2a', [Math.sin(a) * .46, .2 + Math.cos(a) * .3, -.12]); })
  ];
  const m = new THREE.Mesh(merge(parts), toonVC()); const g = new THREE.Group(); g.add(m); return g;
}

// mooncakes (bánh trung thu) on a little plate
export function buildMooncakes() {
  const parts = [P(new THREE.CylinderGeometry(.42, .38, .05, 16), '#f4f0e8', [0, .03, 0])];
  [[-.16, 0], [.16, .05], [0, -.18]].forEach(([x, z], i) => parts.push(P(new THREE.CylinderGeometry(.13, .14, .1, 12), i === 2 ? '#e8c06a' : '#c98a3a', [x, .11, z]), P(new THREE.TorusGeometry(.08, .012, 4, 10), '#8a5a2a', [x, .165, z], [H, 0, 0])));
  const g = new THREE.Group(); g.add(new THREE.Mesh(merge(parts), toonVC())); return g;
}

// the red Thê Húc bridge as an arch of planks with rails (the same shape as the one by Hồ Gươm in js/regionsites.js):
// x along the bridge, -7 to 7 m; the rail tops are where its lights hang (userData.rail: points)
export const bridgeY = t => .5 + Math.sin(t * Math.PI) * 1.4;
export function buildBridge() {
  const parts = [], rail = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10, x = -7 + t * 14, y = bridgeY(t);
    parts.push(P(new THREE.BoxGeometry(1.5, .2, 2), '#d9302a', [x, y, 0], [0, 0, Math.cos(t * Math.PI) * -.35]));
    [-1, 1].forEach(s => { parts.push(P(new THREE.BoxGeometry(1.4, .5, .12), '#e8433a', [x, y + .35, s])); rail.push(new THREE.Vector3(x, y + .7, s)); }); }
  for (const x of [-6, -2, 2, 6]) parts.push(P(new THREE.CylinderGeometry(.14, .16, 1.4, 8), '#a8281e', [x, bridgeY((x + 7) / 14) - .6, 0]));
  const g = new THREE.Group(); const m = new THREE.Mesh(merge(parts), toonVC()); m.castShadow = true; g.add(m); g.userData.rail = rail; return g;
}
// the lights along the bridge's rails: small red and gold lanterns on both rails, and a thin red line of light along each
// rail top (shown when it is lit). rail: points in pairs, one per side, plank by plank (as buildBridge makes them)
export function buildBridgeLights(rail) {
  const g = new THREE.Group(), red = glow('#ff3a2a'), gold = glow('#ffd23f'), line = glow('#ff5a3a', .85); line.depthWrite = false;
  rail.forEach((v, i) => { const plank = i >> 1; if (plank % 2) return; const l = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), plank % 4 ? gold : red); l.scale.y = 1.2; l.position.copy(v); l.position.y += .2; g.add(l); });
  for (let i = 0; i + 2 < rail.length; i++) { const a = rail[i], b = rail[i + 2], d = Math.hypot(b.x - a.x, b.y - a.y);
    const m = new THREE.Mesh(new THREE.BoxGeometry(d, .07, .09), line); m.position.set((a.x + b.x) / 2, (a.y + b.y) / 2 - .08, a.z); m.rotation.z = Math.atan2(b.y - a.y, b.x - a.x); g.add(m); }
  return g;
}
