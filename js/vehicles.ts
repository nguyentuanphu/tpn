// Vehicles of the two homes (round R, owner: "the xe máy and xích lô don't look real at all; add the xe 67, the Honda,
// the xích lô, Australia's motorbikes, and bicycles of every kind, the xe đạp thồ too").
// Every builder returns { o, wheels, wr, seat, name }: o faces +z with its wheels on y = 0, wheels are the meshes that
// turn as it rides (rotation.x += distance / wr), seat is where a rider sits. Real proportions at about 0.9 of real size
// (the valley's people are a little small), drawn in the valley's toon style with an outline.
// Bodies are side profiles (drawn in z, y like a sketch on paper) given thickness and soft edges, so tanks, leg shields
// and side covers have the real shapes instead of boxes.
import { THREE, P, merge, toonSmooth, outline } from './gfx.js';

const V3 = (...p: number[]) => new THREE.Vector3(p[0], p[1], p[2]);
const CHROME = '#d8dee2', BLACK = '#26292c', TYRE = '#2b2e31', RUBBER = '#3a3d40', STEEL = '#9aa4a8';
// (owner, round R: "older kids should have more real models") two looks: the toy look (soft toon shading and a dark
// outline) for under-5s, and the real look for older children: painted metal, shiny chrome, rubber, no outline,
// slimmer tyres and the small parts real bikes have (brake discs, cables, indicators). build(id, { real }) picks one.
let REAL = false;
const paint = new Map();
const realMat = kind => { if (!paint.has(kind)) paint.set(kind, new THREE.MeshStandardMaterial(kind === 'chrome' ? { vertexColors: true, metalness: .85, roughness: .22 } : kind === 'rubber' ? { vertexColors: true, metalness: 0, roughness: .9 } : { vertexColors: true, metalness: .35, roughness: .38 })); return paint.get(kind); };
const isChrome = c => c === CHROME || c === STEEL || c === '#c9d0d4' || c === '#a9b0b4' || c === '#8e959a';
const isRubber = c => c === TYRE || c === BLACK || c === RUBBER || c === '#232527' || c === '#2b2e31';
// one solid thing: parts merged (in the real look, split into paint, chrome and rubber so each shines its own way)
function solid(parts, line = .012) {
  if (REAL) {
    const g = new THREE.Group();
    const kinds: [string, (c) => boolean][] = [['chrome', isChrome], ['rubber', isRubber], ['paint', c => !isChrome(c) && !isRubber(c)]];
    for (const [kind, test] of kinds) {
      const ps = parts.filter(p => test(p.color)); if (!ps.length) continue;
      const m = new THREE.Mesh(merge(ps), realMat(kind)); m.castShadow = true; g.add(m);
    }
    return g;
  }
  const m = new THREE.Mesh(merge(parts), toonSmooth()); m.castShadow = true; if (line) outline(m, line, '#3c3236'); return m;
}
// a straight tube between two points
export function rod(a, b, r, color, seg = 8) {
  const va = V3(...a), vb = V3(...b), d = vb.clone().sub(va), len = d.length();
  const e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.normalize()));
  return P(new THREE.CylinderGeometry(r, r, len, seg), color, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [e.x, e.y, e.z]);
}
// a bent tube through points
const bend = (pts, r, color, seg = 24) => P(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => V3(...p))), seg, r, 8, false), color);
// a side profile: points [z, y] round the outline (a smooth closed curve), thickness w, centred on x
// (corner > 0: straight edges with corners rounded that much, for boxy cars, buses and trams; 0: a smooth curve)
function side(pts, w, color, x = 0, bevel = .025, corner = 0) {
  const s = new THREE.Shape();
  if (corner) {
    const n = pts.length, at = (i, j, r): [number, number] => { const [ax, ay] = pts[i], [bx, by] = pts[j], d = Math.hypot(bx - ax, by - ay) || 1, k = Math.min(r, d / 2) / d; return [ax + (bx - ax) * k, ay + (by - ay) * k]; };
    for (let i = 0; i < n; i++) { const a = at(i, (i + n - 1) % n, corner), b = at(i, (i + 1) % n, corner); if (i) s.lineTo(...a); else s.moveTo(...a); s.quadraticCurveTo(pts[i][0], pts[i][1], ...b); }
    s.closePath();
  } else { s.moveTo(pts[0][0], pts[0][1]); s.splineThru([...pts.slice(1), pts[0]].map(([a, b]) => new THREE.Vector2(a, b))); }
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(.002, w - bevel * 2), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * .8, bevelSegments: 3, curveSegments: 20 });
  g.translate(0, 0, -(w - bevel * 2) / 2); g.computeVertexNormals();
  return P(g, color, [x, 0, 0], [0, -Math.PI / 2, 0]);
}
const ball = (r, color, pos, scl = [1, 1, 1], seg = 18) => P(new THREE.SphereGeometry(r, seg, Math.round(seg * .7)), color, pos, [0, 0, 0], scl);
const box = (w, h, d, color, pos, rot = [0, 0, 0]) => P(new THREE.BoxGeometry(w, h, d), color, pos, rot);
const disc = (r, t, color, pos, seg = 20) => P(new THREE.CylinderGeometry(r, r, t, seg), color, pos, [0, 0, Math.PI / 2]);
// a wheel standing in the y-z plane, centred on (0,0,0): tyre, rim, hub and spokes (or a cast wheel's five arms)
function wheel({ r, tyre = .045, rim = CHROME, spokes = 18, cast = false, knobby = false, hubR = .05, width = 0 }) {
  const motor = spokes <= 18 || cast;   // (bicycles ask for more spokes)
  if (REAL) { tyre *= .78; spokes = Math.max(spokes, 32); }
  const parts = [P(new THREE.TorusGeometry(r - tyre, tyre, 10, 36), TYRE, [0, 0, 0], [0, Math.PI / 2, 0], [1, 1, width ? width / (tyre * 2) : 1]),   // the tyre
    P(new THREE.TorusGeometry(r - tyre * 1.9, tyre * .32, 6, 36), rim, [0, 0, 0], [0, Math.PI / 2, 0]), disc(hubR, .1, STEEL, [0, 0, 0], 12)];   // rim and hub
  if (knobby) for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; parts.push(box(tyre * 2.3, .035, .03, '#232527', [0, Math.cos(a) * (r - .004), Math.sin(a) * (r - .004)], [-a, 0, 0])); }
  if (cast) for (let k = 0; k < 5; k++) parts.push(box(.03, (r - tyre * 2) * 2 * .5, .05, rim, [0, Math.cos(k * 1.2566) * (r - tyre * 2) * .5, Math.sin(k * 1.2566) * (r - tyre * 2) * .5], [-k * 1.2566, 0, 0]));
  else for (let k = 0; k < spokes / 2; k++) parts.push(P(new THREE.CylinderGeometry(.005, .005, (r - tyre * 1.8) * 2, 4), '#c9d0d4', [k % 2 ? .02 : -.02, 0, 0], [k * Math.PI / (spokes / 2) + .08, 0, 0]));
  if (REAL && motor) parts.push(P(new THREE.TorusGeometry(r * .3, .018, 6, 24), '#b8c0c4', [.06, 0, 0], [0, Math.PI / 2, 0]));   // a brake disc ring
  return solid(parts, .008);
}
// put wheels on a vehicle; returns the meshes, which turn as it rides
function wheelsAt(g, list) { return list.map(([x, y, z, opt]) => { const w = wheel(opt); w.position.set(x, y, z); g.add(w); return w; }); }
const kit = (g, parts) => { g.add(solid(parts)); return g; };
const lamp = (pos, r = .07) => [P(new THREE.CylinderGeometry(r, r * .8, .08, 16), CHROME, pos, [Math.PI / 2, 0, 0]), P(new THREE.CircleGeometry(r * .82, 16), '#fff6c8', [pos[0], pos[1], pos[2] + .042])];
const grips = (y, z, w = .3) => [rod([-w, y, z], [w, y, z], .012, CHROME), ...[-1, 1].map(s => P(new THREE.CylinderGeometry(.018, .018, .1, 8), BLACK, [s * (w - .04), y, z], [0, 0, Math.PI / 2]))];
const mirrors = (y, z, w = .24) => [-1, 1].flatMap(s => [rod([s * w * .8, y, z], [s * w, y + .2, z - .03], .006, CHROME), P(new THREE.CylinderGeometry(.045, .045, .012, 14), CHROME, [s * w, y + .22, z - .03], [Math.PI / 2, 0, 0])]);
const plate = (pos, col = '#f4f4ee') => [box(.16, .1, .01, col, pos), box(.12, .015, .012, '#3a3a3a', [pos[0], pos[1] + .015, pos[2] - .002]), box(.12, .015, .012, '#3a3a3a', [pos[0], pos[1] - .015, pos[2] - .002])];

// ---------- Vietnam's motorbikes ----------
// Xe 67: the Honda 67 (CD50/SS50 of 1967), the old classic: a teardrop tank with chrome knee pads, a long flat seat,
// round headlamp, chrome mudguards, an upswept exhaust and spoked 17-inch wheels
export function honda67(color = '#c8372d') {
  const g = new THREE.Group(), R = .29, F = .6, B = -.58;
  const wheels = wheelsAt(g, [[0, R, F, { r: R, tyre: .04 }], [0, R, B, { r: R, tyre: .045 }]]);
  kit(g, [
    side([[.42, .78], [.2, .86], [-.08, .84], [-.12, .74], [.1, .7], [.38, .7]], .26, color),            // the tank
    ...[-1, 1].map(s => ball(.075, CHROME, [s * .13, .76, .12], [.35, .8, 1.4])),                         // chrome knee pads
    ball(.035, CHROME, [0, .87, .1], [1, .5, 1.3]),                                                      // filler cap
    side([[-.08, .82], [-.5, .84], [-.72, .8], [-.7, .76], [-.1, .76]], .25, BLACK),                     // the seat
    rod([0, .88, .5], [0, .72, .05], .03, color), rod([0, .72, .05], [0, .7, -.62], .025, color),          // backbone and seat rail
    side([[-.04, .72], [-.32, .74], [-.36, .5], [-.12, .44]], .24, color),                               // side covers
    box(.2, .17, .24, '#8e959a', [0, .42, .02]), ...[0, 1, 2, 3].map(k => box(.21, .012, .2, '#a9b0b4', [0, .48 + k * .03, .21], [0, 0, 0])), // engine and cylinder fins (lying forward)
    P(new THREE.CylinderGeometry(.075, .075, .2, 14), '#a9b0b4', [0, .47, .22], [Math.PI / 2 - .25, 0, 0]),
    bend([[.09, .43, .3], [.12, .3, .2], [.13, .3, -.2], [.14, .5, -.5], [.14, .56, -.7]], .022, CHROME), P(new THREE.CylinderGeometry(.04, .03, .32, 12), CHROME, [.14, .54, -.62], [Math.PI / 2 - .2, 0, 0]),   // upswept exhaust
    ...[-1, 1].flatMap(s => [rod([s * .07, .5, -.15], [s * .07, R, B], .02, BLACK), rod([s * .08, R + .02, B + .02], [s * .09, .74, -.5], .018, CHROME)]),   // swing arm, rear shocks
    ...[-1, 1].map(s => rod([s * .065, .86, .52], [s * .065, R, F], .02, CHROME)), ...[-1, 1].map(s => P(new THREE.CylinderGeometry(.03, .03, .2, 10), BLACK, [s * .065, .62, .55], [-.25, 0, 0])),   // forks and gaiters
    bend([[0, R + .05, F - .3], [0, R + .27, F - .12], [0, R + .3, F + .05], [0, R + .2, F + .27]], .055, CHROME), bend([[0, R + .05, B - .28], [0, R + .3, B - .05], [0, R + .29, B + .1]], .065, CHROME),   // mudguards
    ...lamp([0, .82, .64], .085), box(.06, .04, .05, BLACK, [0, .93, .55]),                               // headlamp and speedo
    ...grips(.94, .52, .3), ...mirrors(.94, .52), box(.07, .04, .04, '#d8322a', [0, .7, -.79]), ...plate([0, .6, -.82]),
    ...[-1, 1].map(s => rod([s * .06, .32, .02], [s * .19, .32, .02], .012, STEEL))                       // footpegs
  ]);
  return { o: g, wheels, wr: R, seat: [0, .84, -.3], grips: [[.26, .94, .52], [-.26, .94, .52]], feet: [[.19, .33, .02], [-.19, .33, .02]], name: ['Honda 67', 'Xe 67'] };
}
// Honda Super Cub: the step-through with its white leg shield, round lamp in the handlebar and a chrome carrier
export function cub(color = '#2f6fb0') {
  const g = new THREE.Group(), R = .28, F = .58, B = -.56;
  const wheels = wheelsAt(g, [[0, R, F, { r: R }], [0, R, B, { r: R }]]);
  kit(g, [
    side([[.5, .9], [.42, .92], [.36, .62], [.24, .34], [.06, .3], [.04, .36], [.2, .42], [.3, .66], [.36, .9]], .38, '#f2efe6'),   // leg shield
    side([[.36, .78], [.42, .82], [.12, .4], [-.05, .36], [-.12, .44]], .12, color),                         // the beam under the shield
    side([[-.08, .44], [-.12, .7], [-.4, .76], [-.66, .72], [-.7, .56], [-.4, .5], [-.2, .42]], .3, color),     // body under the seat
    side([[-.12, .8], [-.48, .82], [-.56, .78], [-.12, .76]], .26, BLACK),                                   // seat
    box(.34, .015, .34, CHROME, [0, .82, -.78]), ...[-1, 1].map(s => rod([s * .16, .82, -.6], [s * .16, .82, -.96], .01, CHROME)),   // carrier
    box(.18, .12, .3, '#8e959a', [0, .3, -.04]), bend([[.08, .28, .12], [.1, .22, -.1], [.12, .26, -.5], [.13, .34, -.74]], .022, CHROME), P(new THREE.CylinderGeometry(.04, .03, .3, 12), CHROME, [.13, .33, -.66], [Math.PI / 2, 0, 0]),
    box(.36, .02, .3, '#3a3d40', [0, .33, .15]),                                                              // floor step
    ...[-1, 1].map(s => rod([s * .06, .9, .45], [s * .06, R, F], .02, '#3a3d40')), bend([[0, R + .04, F - .3], [0, R + .26, F - .1], [0, R + .29, F + .08], [0, R + .2, F + .27]], .06, color),
    bend([[0, R + .12, B - .25], [0, R + .3, B], [0, R + .28, B + .15]], .065, color),
    side([[.38, .98], [.6, 1.0], [.62, .92], [.4, .9]], .44, color), ...lamp([0, .95, .63], .07), ...grips(.98, .5, .28), ...mirrors(1.0, .48),
    box(.07, .04, .04, '#d8322a', [0, .7, -.78]), ...plate([0, .62, -.8])
  ]);
  return { o: g, wheels, wr: R, seat: [0, .82, -.32], grips: [[.24, .98, .5], [-.24, .98, .5]], feet: [[.1, .35, .14], [-.1, .35, .14]], name: ['Honda Super Cub', 'Xe Cub'] };
}
// Honda Dream: the Vietnamese family's "xe Honda": bigger and squarer than the Cub, the famous plum-brown colour,
// a square lamp, chrome side grab rails and a big carrier
export function dream(color = '#6b2f2a') {
  const g = new THREE.Group(), R = .29, F = .62, B = -.6;
  const wheels = wheelsAt(g, [[0, R, F, { r: R }], [0, R, B, { r: R }]]);
  kit(g, [
    side([[.52, .94], [.44, .96], [.38, .64], [.26, .36], [.04, .32], [.04, .38], [.22, .44], [.32, .66], [.38, .94]], .42, color),   // leg shield
    side([[-.06, .42], [-.1, .74], [-.42, .8], [-.72, .76], [-.76, .58], [-.42, .5], [-.2, .42]], .32, color),
    box(.3, .05, .5, '#c9a44a', [0, .74, -.4]),                                                              // gold stripe
    side([[-.08, .86], [-.6, .88], [-.68, .82], [-.1, .8]], .29, '#2a2220'),                                 // long seat
    ...[-1, 1].map(s => bend([[s * .17, .82, -.2], [s * .19, .84, -.6], [s * .12, .84, -.76]], .014, CHROME)), box(.36, .015, .32, CHROME, [0, .85, -.88]),
    box(.2, .13, .32, '#8e959a', [0, .3, -.04]), bend([[.09, .28, .12], [.12, .22, -.1], [.14, .26, -.5], [.15, .34, -.78]], .024, CHROME), P(new THREE.CylinderGeometry(.045, .035, .34, 12), CHROME, [.15, .33, -.7], [Math.PI / 2, 0, 0]),
    box(.38, .02, .32, '#3a3d40', [0, .35, .15]),
    ...[-1, 1].map(s => rod([s * .065, .94, .48], [s * .065, R, F], .022, CHROME)), bend([[0, R + .04, F - .3], [0, R + .27, F - .1], [0, R + .3, F + .08], [0, R + .21, F + .27]], .06, color),
    bend([[0, R + .12, B - .25], [0, R + .31, B], [0, R + .29, B + .15]], .065, color),
    box(.36, .14, .16, color, [0, 1.0, .52]), box(.16, .1, .02, '#fff6c8', [0, 1.0, .61]), box(.1, .05, .02, '#ffb43a', [-.13, 1.0, .61]), box(.1, .05, .02, '#ffb43a', [.13, 1.0, .61]),  // square lamp + indicators
    ...grips(1.04, .5, .3), ...mirrors(1.06, .48), box(.18, .05, .04, '#d8322a', [0, .74, -.81]), ...plate([0, .64, -.83])
  ]);
  return { o: g, wheels, wr: R, seat: [0, .86, -.34], grips: [[.26, 1.04, .5], [-.26, 1.04, .5]], feet: [[.1, .37, .14], [-.1, .37, .14]], name: ['Honda Dream', 'Xe Dream'] };
}
// a modern Vietnamese scooter (Honda Vision style): smooth white body, small cast wheels, flat floor
export function scooter(color = '#f4f2ee', trim = '#c8372d') {
  const g = new THREE.Group(), R = .24, F = .6, B = -.5;
  const wheels = wheelsAt(g, [[0, R, F, { r: R, cast: true, rim: '#3a3d40', tyre: .05 }], [0, R, B, { r: R, cast: true, rim: '#3a3d40', tyre: .05 }]]);
  kit(g, [
    side([[.6, 1.0], [.5, 1.02], [.42, .6], [.36, .3], [.2, .26], [.24, .5], [.32, .96]], .4, color),        // apron
    side([[.2, .26], [-.1, .26], [-.12, .32], [.2, .32]], .36, '#3a3d40'),                                    // floor
    side([[-.1, .3], [-.12, .66], [-.4, .76], [-.74, .72], [-.78, .5], [-.5, .36], [-.2, .3]], .36, color),
    side([[-.14, .78], [-.66, .82], [-.72, .76], [-.14, .72]], .3, '#2a2220'),
    box(.38, .04, .34, trim, [0, .6, -.48]), box(.4, .1, .14, trim, [0, .98, .56]), box(.16, .06, .02, '#fff6c8', [0, .97, .64]),
    ...[-1, 1].map(s => rod([s * .07, .96, .48], [s * .07, R, F], .024, '#3a3d40')), bend([[0, R + .05, F - .26], [0, R + .24, F - .08], [0, R + .26, F + .08], [0, R + .18, F + .22]], .06, color),
    box(.14, .14, .4, '#8e959a', [.1, .26, -.4]), P(new THREE.CylinderGeometry(.04, .035, .26, 12), '#5a5f64', [.18, .3, -.6], [Math.PI / 2, 0, 0]),
    ...grips(1.04, .48, .28), ...mirrors(1.06, .46), box(.2, .05, .04, '#d8322a', [0, .7, -.78]), ...plate([0, .56, -.8])
  ]);
  return { o: g, wheels, wr: R, seat: [0, .8, -.36], grips: [[.24, 1.04, .48], [-.24, 1.04, .48]], feet: [[.1, .33, .1], [-.1, .33, .1]], name: ['Scooter', 'Xe tay ga'] };
}
// Xích lô: the Sài Gòn / Hà Nội cyclo. The passenger sits in front in a padded seat between two wheels under a folding
// hood; the driver pedals behind on a bicycle saddle and steers the whole seat with a bar round its back.
export function xichlo(frame = '#2d5a8a', seat = '#c62f2f', hood = '#2f6b3a') {
  const g = new THREE.Group(), R = .3, RR = .34, F = .34, B = -1.02, W = .38;
  const wheels = wheelsAt(g, [[-W, R, F, { r: R }], [W, R, F, { r: R }], [0, RR, B, { r: RR, tyre: .035 }]]);
  kit(g, [
    rod([-W - .04, R, F], [W + .04, R, F], .025, frame),                                                         // front axle
    side([[.56, .36], [.6, .44], [.2, .5], [-.14, .48], [-.16, .4], [.2, .38]], .7, frame),                    // the carriage's tub
    side([[.22, .5], [-.16, .5], [-.22, .62], [-.26, 1.0], [-.16, 1.02], [-.08, .62], [.2, .6]], .62, seat),     // padded seat and backrest
    ...[-1, 1].map(s => side([[.24, .5], [.3, .66], [-.06, .74], [-.14, .64], [-.12, .5]], .06, frame, s * .34)),  // armrests
    box(.62, .03, .3, '#7a5236', [0, .4, .52]),                                                                  // footboard
    ...[-1, 1].map(s => bend([[s * .34, .74, -.14], [s * .36, 1.0, -.34], [s * .2, 1.12, -.44], [0, 1.14, -.46]], .012, CHROME)),   // hood bows, folded
    P(new THREE.SphereGeometry(.42, 20, 10, 0, Math.PI, 0, Math.PI / 2), hood, [0, .98, -.3], [0, Math.PI / 2, -1.25], [.6, 1.0, .82]),   // the hood, folded down behind the seat back
    bend([[-.36, .92, -.32], [-.3, 1.08, -.38], [0, 1.12, -.42], [.3, 1.08, -.38], [.36, .92, -.32]], .018, CHROME),  // the driver's steering bar round the seat back
    rod([0, .5, -.24], [0, .8, -.62], .03, frame), rod([0, .8, -.62], [0, 1.0, -.7], .025, frame),               // frame to the saddle
    rod([0, .5, -.3], [0, .42, -.66], .028, frame), rod([0, .42, -.66], [0, RR, B], .022, frame), rod([0, .98, -.7], [0, RR, B], .02, frame),
    box(.18, .05, .24, BLACK, [0, 1.04, -.72]),                                                                  // driver's saddle
    rod([-.12, .42, -.66], [.12, .42, -.66], .015, '#555'), ...[-1, 1].map(s => box(.1, .025, .06, '#333', [s * .14, .42 + s * .1, -.66])), disc(.1, .014, '#777', [.06, .42, -.66]),
    bend([[0, RR + .06, B + .28], [0, RR + .36, B + .02], [0, RR + .32, B - .18]], .055, frame),
    ...[-1, 1].map(s => bend([[s * W, R + .06, F - .26], [s * W, R + .32, F], [s * W, R + .26, F + .2]], .05, frame)),
    ...lamp([W + .02, .66, .6], .045), ...lamp([-W - .02, .66, .6], .045), ...plate([0, .44, .66], '#f4f4ee')
  ]);
  return { o: g, wheels, wr: R, seat: [0, 1.04, -.74], grips: [[.3, 1.09, -.4], [-.3, 1.09, -.4]], feet: [[.14, .52, -.63], [-.14, .32, -.69]],
    passenger: [0, .56, .02], pgrips: [[.33, .72, -.02], [-.33, .72, -.02]], pfeet: [[.12, .43, .5], [-.12, .43, .5]], name: ['Xích lô (cyclo)', 'Xích lô'] };
}

// ---------- Australia's motorbikes ----------
// The postie bike: Australia Post's red Honda CT110, high exhaust, big racks front and back with letter boxes
export function postie() {
  const g = new THREE.Group(), R = .29, F = .6, B = -.58, RED = '#d8202a';
  const wheels = wheelsAt(g, [[0, R, F, { r: R, knobby: true }], [0, R, B, { r: R, knobby: true }]]);
  kit(g, [
    side([[.48, .9], [.42, .92], [.36, .62], [.24, .36], [.06, .32], [.04, .38], [.2, .44], [.3, .66], [.36, .9]], .36, RED),
    side([[-.08, .44], [-.12, .7], [-.42, .76], [-.66, .72], [-.7, .56], [-.4, .5], [-.2, .42]], .3, RED),
    side([[-.12, .8], [-.48, .82], [-.56, .78], [-.12, .76]], .26, BLACK),
    box(.2, .13, .3, '#8e959a', [0, .32, -.04]), bend([[.09, .34, .1], [.14, .5, -.1], [.15, .6, -.4], [.15, .62, -.7]], .022, '#5a5f64'), box(.06, .18, .3, '#3a3d40', [.17, .62, -.5]),   // the high pipe and its heat shield
    box(.4, .02, .32, '#3a3d40', [0, .36, .15]),
    ...[-1, 1].map(s => rod([s * .065, .92, .46], [s * .065, R, F], .022, '#3a3d40')), ...[-1, 1].map(s => P(new THREE.CylinderGeometry(.032, .032, .22, 10), BLACK, [s * .065, .6, .54], [-.25, 0, 0])),
    bend([[0, R + .1, F - .26], [0, R + .3, F - .04], [0, R + .3, F + .14]], .05, RED), bend([[0, R + .12, B - .25], [0, R + .31, B], [0, R + .29, B + .15]], .055, RED),
    // the racks and the letter boxes
    box(.5, .02, .5, '#3a3d40', [0, .84, -.86]), box(.46, .36, .44, '#e8432a', [0, 1.04, -.86]), box(.47, .04, .45, '#c62828', [0, 1.23, -.86]),
    ...[-1, 1].map(s => box(.08, .3, .4, '#e8432a', [s * .3, .62, -.72])),
    box(.36, .02, .26, '#3a3d40', [0, .98, .74]), box(.32, .22, .24, '#e8432a', [0, 1.1, .74]),
    ...lamp([0, .92, .62], .07), ...grips(1.0, .46, .32), ...mirrors(1.02, .44), ...plate([0, .66, -1.1], '#f2d24a')
  ]);
  return { o: g, wheels, wr: R, seat: [0, .82, -.34], grips: [[.28, 1.0, .46], [-.28, 1.0, .46]], feet: [[.12, .38, .14], [-.12, .38, .14]], name: ['Postie bike', 'Xe bưu tá Úc'] };
}
// a farm trail bike: tall, knobbly tyres, high mudguards, a number board, the kind kids see on Australian farms
export function trailBike(color = '#f2b51e') {
  const g = new THREE.Group(), R = .34, F = .74, B = -.66;
  const wheels = wheelsAt(g, [[0, R, F, { r: R, knobby: true, tyre: .055 }], [0, R, B, { r: R, knobby: true, tyre: .06 }]]);
  kit(g, [
    side([[.3, 1.0], [.04, 1.02], [-.06, .9], [.1, .86], [.3, .88]], .3, color),                                // tank
    side([[-.02, 1.0], [-.66, 1.0], [-.7, .96], [-.04, .94]], .24, BLACK),                                      // long flat seat
    side([[-.1, .96], [-.7, .98], [-.86, .96], [-.6, .86], [-.14, .82]], .3, color),                            // tail
    rod([0, 1.05, .46], [0, .5, .1], .03, '#3a3d40'), rod([0, .5, .1], [0, .45, -.2], .03, '#3a3d40'),
    box(.2, .26, .26, '#5a5f64', [0, .52, -.06]), bend([[.08, .6, .12], [.14, .7, -.1], [.15, .86, -.5], [.15, .9, -.8]], .025, '#5a5f64'),
    ...[-1, 1].map(s => rod([s * .06, .48, -.2], [s * .06, R, B], .022, '#3a3d40')), rod([0, .58, -.2], [0, .92, -.4], .03, color),
    ...[-1, 1].map(s => rod([s * .07, 1.08, .48], [s * .07, R, F], .028, CHROME)),
    side([[F + .32, R + .38], [F + .06, R + .44], [F - .2, R + .42], [F - .18, R + .38], [F + .1, R + .36]], .16, color),   // front guard, high
    side([[.42, 1.16], [.52, 1.2], [.6, .98], [.5, .92]], .26, '#f4f4ee'),                                      // number board
    ...grips(1.2, .44, .36), box(.06, .04, .04, '#d8322a', [0, .98, -.88])
  ]);
  return { o: g, wheels, wr: R, seat: [0, .98, -.3], grips: [[.32, 1.2, .44], [-.32, 1.2, .44]], feet: [[.17, .46, -.1], [-.17, .46, -.1]], name: ['Farm trail bike', 'Xe cào cào ở trang trại Úc'] };
}
// the farm quad bike, with racks and a cattle dog's spot behind
export function quadBike(color = '#c8372d') {
  const g = new THREE.Group(), R = .28, F = .5, B = -.5, W = .42;
  const wheels = wheelsAt(g, [[-W, R, F, { r: R, knobby: true, tyre: .1, cast: true, rim: '#3a3d40' }], [W, R, F, { r: R, knobby: true, tyre: .1, cast: true, rim: '#3a3d40' }],
    [-W, R, B, { r: R, knobby: true, tyre: .11, cast: true, rim: '#3a3d40' }], [W, R, B, { r: R, knobby: true, tyre: .11, cast: true, rim: '#3a3d40' }]]);
  kit(g, [
    side([[.8, .62], [.5, .72], [.2, .7], [-.2, .72], [-.6, .7], [-.8, .62], [-.6, .5], [.6, .5]], .62, color),
    ...[-1, 1].flatMap(sd => [side([[F + .3, .58], [F, .66], [F - .3, .58], [F, .54]], .3, color, sd * W), side([[B + .3, .58], [B, .66], [B - .3, .58], [B, .54]], .3, color, sd * W)]),
    side([[.1, .82], [-.4, .84], [-.46, .78], [.1, .76]], .3, BLACK), box(.24, .26, .3, '#5a5f64', [0, .4, 0]),
    box(.7, .03, .4, '#3a3d40', [0, .76, .66]), box(.7, .03, .44, '#3a3d40', [0, .76, -.68]), ...[-1, 1].map(s => rod([s * .34, .76, .46], [s * .34, .82, .86], .015, '#3a3d40')),
    rod([0, .74, .3], [0, .96, .22], .03, '#3a3d40'), ...grips(.98, .22, .36), ...lamp([-.2, .66, .8], .05), ...lamp([.2, .66, .8], .05)
  ]);
  return { o: g, wheels, wr: R, seat: [0, .84, -.16], grips: [[.32, .98, .22], [-.32, .98, .22]], feet: [[.24, .52, -.05], [-.24, .52, -.05]], name: ['Quad bike', 'Xe bốn bánh trang trại'] };
}

// ---------- bicycles ----------
// one bicycle frame builder for all of them: where the hubs, crank, saddle and bars are, and the style of frame
function bicycle({ R, wb = 1.1, frame = '#1d1f22', step = false, drop = false, rack = false, basket = false, mud = true, guard = false, tyre = .03, kids = false, bmx = false }) {
  const g = new THREE.Group(), F = wb / 2, B = -wb / 2, H = R + .01;
  const wheels = wheelsAt(g, [[0, H, F, { r: R, tyre, spokes: bmx ? 36 : 28 }], [0, H, B, { r: R, tyre, spokes: bmx ? 36 : 28 }]]);
  const BB = [0, H + .03, -.02], SEAT = [0, H + R * 1.55, B * .42], HEAD = [0, H + R * 1.5, F * .7], HEAD_LO = [0, H + R * 1.12, F * .78];
  const p = [
    step ? bend([HEAD, [0, HEAD_LO[1] - R * .5, F * .5], [0, BB[1] + .04, BB[2] + .12], BB], .024, frame) : rod(SEAT, HEAD, .022, frame),
    rod(HEAD_LO, BB, .026, frame), rod(BB, SEAT, .026, frame), rod(HEAD, HEAD_LO, .03, frame),
    ...[-1, 1].flatMap(s => [rod([s * .04, BB[1], BB[2]], [s * .05, H, B], .014, frame), rod([s * .03, SEAT[1] - .05, SEAT[2]], [s * .05, H, B], .013, frame), rod([s * .04, HEAD_LO[1], HEAD_LO[2]], [s * .05, H, F], .014, CHROME)]),
    rod(SEAT, [0, SEAT[1] + .1, SEAT[2] - .02], .014, CHROME), side([[SEAT[2] + .12, SEAT[1] + .12], [SEAT[2] - .1, SEAT[1] + .14], [SEAT[2] - .14, SEAT[1] + .1], [SEAT[2] + .1, SEAT[1] + .09]], .14, BLACK),
    rod(HEAD, [0, HEAD[1] + .12, HEAD[2] - .02], .015, CHROME),
    rod([-.1, BB[1], BB[2]], [.1, BB[1], BB[2]], .015, '#555'), ...[-1, 1].map(s => box(.09, .022, .05, '#333', [s * .12, BB[1] + s * .13, BB[2] + s * .03])), disc(R * .3, .012, '#777', [.05, BB[1], BB[2]])
  ];
  if (drop) p.push(...[-1, 1].map(s => bend([[s * .2, HEAD[1] + .12, HEAD[2] - .02], [s * .2, HEAD[1] + .12, HEAD[2] + .1], [s * .2, HEAD[1] + .0, HEAD[2] + .14], [s * .2, HEAD[1] - .06, HEAD[2] + .04]], .012, '#2b2e31')), rod([-.2, HEAD[1] + .12, HEAD[2] - .02], [.2, HEAD[1] + .12, HEAD[2] - .02], .012, CHROME));
  else if (bmx) p.push(rod([-.28, HEAD[1] + .22, HEAD[2] - .06], [.28, HEAD[1] + .22, HEAD[2] - .06], .012, CHROME), ...[-1, 1].map(s => rod([s * .16, HEAD[1] + .1, HEAD[2]], [s * .2, HEAD[1] + .22, HEAD[2] - .06], .012, CHROME)), rod([-.16, HEAD[1] + .14, HEAD[2] - .03], [.16, HEAD[1] + .14, HEAD[2] - .03], .01, CHROME),
    ...[-1, 1].flatMap(s => [P(new THREE.CylinderGeometry(.022, .022, .12, 10), STEEL, [s * .1, H, B], [0, 0, Math.PI / 2]), P(new THREE.CylinderGeometry(.022, .022, .12, 10), STEEL, [s * .1, H, F], [0, 0, Math.PI / 2])]), ...[-1, 1].map(s => P(new THREE.CylinderGeometry(.02, .02, .1, 8), BLACK, [s * .29, HEAD[1] + .22, HEAD[2] - .06], [0, 0, Math.PI / 2])));
  else p.push(...grips(HEAD[1] + .12, HEAD[2] - .06, kids ? .2 : .27), rod([0, HEAD[1] + .12, HEAD[2] - .02], [0, HEAD[1] + .12, HEAD[2] - .06], .012, CHROME), ball(.025, CHROME, [.16, HEAD[1] + .15, HEAD[2] - .06]));
  if (mud) p.push(bend([[0, H + .05, F - R - .02], [0, H + R + .05, F - .04], [0, H + R + .06, F + .1], [0, H + R * .5, F + R + .06]], .02, frame), bend([[0, H + R * .6, B + R + .04], [0, H + R + .05, B + .06], [0, H + R + .03, B - .14], [0, H + .1, B - R - .05]], .022, frame));
  if (guard) p.push(side([[BB[2] + .12, BB[1] + .06], [B + .06, H + .06], [B + .04, H - .04], [BB[2] + .12, BB[1] - .1]], .03, frame, .07));
  if (rack) p.push(box(.16, .012, .34, CHROME, [0, H + R + .1, B + .02]), ...[-1, 1].map(s => rod([s * .07, H + R + .1, B - .04], [s * .05, H, B], .01, CHROME)));
  if (basket) p.push(P(new THREE.CylinderGeometry(.16, .13, .2, 12, 1, true), '#c9a24a', [0, HEAD[1] - .04, HEAD[2] + .2]), P(new THREE.CircleGeometry(.13, 12), '#a8823a', [0, HEAD[1] - .14, HEAD[2] + .2], [-Math.PI / 2, 0, 0]));
  if (kids) for (const s of [-1, 1]) { const tw = wheel({ r: .09, tyre: .022, spokes: 6, rim: '#ffffff' }); tw.position.set(s * .2, .09, B - .02); g.add(tw); p.push(rod([s * .03, H, B], [s * .2, .09, B - .02], .012, CHROME)); }
  if (!drop && !bmx) p.push(...lamp([0, HEAD[1] - .04, HEAD[2] + .08], .035));
  p.push(box(.04, .03, .015, '#d8322a', [0, H + R * .72, B - R - .03]));
  g.add(solid(p, .007));
  // where the hands and feet go: the grips (or the hoods of drop bars, or BMX grips) and the two pedals
  const gw = drop ? .2 : bmx ? .25 : (kids ? .2 : .27) - .04, gy = HEAD[1] + (drop ? .06 : bmx ? .22 : .12), gz = HEAD[2] + (drop ? .12 : -.06);
  const grip = [[gw, gy, gz], [-gw, gy, gz]], feet = [[.14, BB[1] + .13, BB[2] + .03], [-.14, BB[1] - .13, BB[2] - .03]];
  return { g, wheels, F, B, H, SEAT, HEAD, BB, R, grip, feet };
}
// the Vietnamese man's roadster (Phượng Hoàng / Thống Nhất): black, big wheels, a chain guard and a rear carrier
export function roadster() { const b = bicycle({ R: .36, wb: 1.16, frame: '#1d1f22', rack: true, guard: true }); return { o: b.g, wheels: b.wheels, wr: b.R, seat: [0, b.SEAT[1] + .14, b.SEAT[2]], grips: b.grip, feet: b.feet, name: ['Roadster bicycle', 'Xe đạp Phượng Hoàng'] }; }
// xe đạp mini: the little step-through city bike with a front basket that mums and big sisters ride to market
export function miniBike(color = '#e88aa8') { const b = bicycle({ R: .26, wb: .96, frame: color, step: true, basket: true, rack: true }); return { o: b.g, wheels: b.wheels, wr: b.R, seat: [0, b.SEAT[1] + .14, b.SEAT[2]], grips: b.grip, feet: b.feet, name: ['Mini city bike', 'Xe đạp mini'] }; }
// a road bike with drop bars and thin tyres (Sunday riders on Australian roads)
export function roadBike(color = '#2f8fd8') { const b = bicycle({ R: .35, wb: 1.0, frame: color, drop: true, mud: false, tyre: .018 }); return { o: b.g, wheels: b.wheels, wr: b.R, seat: [0, b.SEAT[1] + .14, b.SEAT[2]], grips: b.grip, feet: b.feet, name: ['Road bike', 'Xe đạp đua'] }; }
// a BMX: small wheels, pegs, high bars
export function bmx(color = '#38b54a') { const b = bicycle({ R: .26, wb: .9, frame: color, bmx: true, mud: false, tyre: .04 }); return { o: b.g, wheels: b.wheels, wr: b.R, seat: [0, b.SEAT[1] + .14, b.SEAT[2]], grips: b.grip, feet: b.feet, name: ['BMX', 'Xe đạp BMX'] }; }
// a little kid's bike with training wheels
export function kidsBike(color = '#ff7a3a') { const b = bicycle({ R: .2, wb: .7, frame: color, kids: true, basket: true, tyre: .035 }); return { o: b.g, wheels: b.wheels, wr: b.R, seat: [0, b.SEAT[1] + .12, b.SEAT[2]], grips: b.grip, feet: b.feet, name: ["Kid's bike", 'Xe đạp trẻ em'] }; }
// Xe đạp thồ: a heavy roadster made into a pack bike. A long bamboo pole is tied to the left handlebar so the rider can
// walk beside it (on the right) and steer, a second one up from the seat post to push with, and it is loaded high: sacks on both
// sides of the carrier, baskets of fruit and a bundle on the top tube.
export function packBike() {
  const b = bicycle({ R: .36, wb: 1.2, frame: '#2b3a2e', rack: true, guard: true }), p = [], { F, B, H, R, SEAT, HEAD } = b;
  p.push(rod([.27, HEAD[1] + .12, HEAD[2] - .06], [.42, HEAD[1] + .5, HEAD[2] - .7], .022, '#c9a45a'), rod([.02, SEAT[1] + .05, SEAT[2]], [.36, SEAT[1] + .62, SEAT[2] - .55], .022, '#c9a45a'));  // steering pole and pushing pole
  p.push(box(.5, .03, .6, '#8a6a3e', [0, H + R + .12, B]));                                                     // a wide board on the carrier
  for (const s of [-1, 1]) p.push(ball(.2, '#d9c08a', [s * .32, H + R - .02, B + .02], [.7, 1.3, 1.1]), ball(.18, '#cdb27a', [s * .3, H + R + .3, B - .06], [.7, 1.2, 1]));   // sacks hanging each side
  p.push(P(new THREE.CylinderGeometry(.26, .22, .3, 14, 1, true), '#b8893a', [0, H + R + .3, B]), ...Array.from({ length: 9 }, (_, k) => ball(.08, ['#ff9a2e', '#5fbf4a', '#e8433a'][k % 3], [Math.cos(k * 2.3) * .14, H + R + .46 + (k % 3) * .03, B + Math.sin(k * 2.3) * .14])));   // a basket of fruit on top
  p.push(ball(.14, '#6a8a3a', [0, (SEAT[1] + HEAD[1]) / 2 - .04, (SEAT[2] + HEAD[2]) / 2], [.8, .8, 2.1]), ...[-1, 1].map(s => rod([s * .1, H + R * 1.2, .02 + s * .1], [s * .1, H + R * 1.65, .02 + s * .1], .008, '#8a6a3e')));   // a bundle of greens on the top tube, tied on
  p.push(...[-1, 1].map(s => P(new THREE.CylinderGeometry(.16, .14, .24, 12, 1, true), '#c9a24a', [s * .3, HEAD[1] - .1, HEAD[2] + .02])));   // baskets hung from the bars
  b.g.add(solid(p, .008));
  return { o: b.g, wheels: b.wheels, wr: R, seat: null, walk: [.62, 0, HEAD[2] - .35], wgrips: [[.42, HEAD[1] + .5, HEAD[2] - .7], [.36, SEAT[1] + .62, SEAT[2] - .55]], name: ['Pack bicycle (xe đạp thồ)', 'Xe đạp thồ'] };
}

// ---------- cars, buses and trams ----------
const GLASS = '#33485a';
// a car from side profiles: the painted body, the glass house, the roof; lamps, mirrors, plates and four cast wheels.
// lhd: the driver sits on the left (Vietnam drives on the right) or on the right (Australia drives on the left).
function car({ color, L = 3.9, Wd = 1.62, R = .3, body, glass, roof, extra = [], lhd = true, wheelbase = 2.4, rimC = '#c9d0d4' }) {
  const g = new THREE.Group(), F = wheelbase / 2, B = -wheelbase / 2, X = Wd / 2 - .12;
  const wheels = wheelsAt(g, [[X, R, F, { r: R, cast: true, rim: rimC, tyre: .09 }], [-X, R, F, { r: R, cast: true, rim: rimC, tyre: .09 }], [X, R, B, { r: R, cast: true, rim: rimC, tyre: .09 }], [-X, R, B, { r: R, cast: true, rim: rimC, tyre: .09 }]]);
  const p = [side(body, Wd, color, 0, .03, .12), side(glass, Wd - .14, GLASS, 0, .03, .12), ...(roof ? [side(roof, Wd - .1, color, 0, .03, .12)] : []),
    ...[-1, 1].flatMap(sd => [box(.22, .1, .04, '#fff6c8', [sd * (Wd / 2 - .22), body[1][1] - .08, L / 2 + .01]), box(.24, .1, .04, '#d8322a', [sd * (Wd / 2 - .2), body[body.length - 2][1] - .12, -L / 2 - .01]),
      box(.06, .08, .14, color, [sd * (Wd / 2 + .03), glass[0][1] + .05, glass[0][0] - .2])]),
    ...plate([0, .5, L / 2 + .02]), ...plate([0, .55, -L / 2 - .02]), box(Wd - .3, .1, .05, '#3a3d40', [0, .42, L / 2 + .01]), ...extra];
  g.add(solid(p, .012));
  const dx = lhd ? .38 : -.38;
  return { o: g, cabin: { width: Wd, length: L, bottom: Math.min(...glass.map(p => p[1])), top: Math.max(...glass.map(p => p[1])), color }, wheels, wr: R, seat: [dx, .62, -.1], grips: [[dx + .17, .95, .42], [dx - .17, .95, .42]], feet: [[dx + .1, .3, .9], [dx - .1, .3, .9]], wheelAt: [dx, .95, .45] };
}
// a family sedan
export function sedan(color = '#c8d4dc', lhd = true) {
  const v = car({ color, lhd, body: [[1.95, .42], [2.0, .68], [1.0, .82], [-1.7, .86], [-1.98, .74], [-1.95, .42]], glass: [[1.0, .8], [.35, 1.3], [-.95, 1.3], [-1.55, .84]], roof: [[.35, 1.28], [-.95, 1.28], [-.92, 1.34], [.32, 1.34]] });
  return { ...v, name: ['Car', 'Xe hơi'] };
}
// a Vietnamese taxi: white with a green stripe and a roof sign (no brand)
export function taxi() {
  const v = car({ color: '#f4f4ee', lhd: true, body: [[1.95, .42], [2.0, .68], [1.0, .82], [-1.7, .86], [-1.98, .74], [-1.95, .42]], glass: [[1.0, .8], [.35, 1.3], [-.95, 1.3], [-1.55, .84]], roof: [[.35, 1.28], [-.95, 1.28], [-.92, 1.34], [.32, 1.34]],
    extra: [box(1.64, .12, 3.2, '#2f9a4a', [0, .6, 0]), box(.5, .16, .22, '#ffd23f', [0, 1.43, -.3])] });
  return { ...v, name: ['Taxi', 'Xe taxi'] };
}
// the Australian ute: a cab in front and an open tray behind, with a roll bar
export function ute(color = '#f4f4ee') {
  const v = car({ color, lhd: false, L: 4.6, wheelbase: 2.9, R: .34, body: [[2.3, .4], [2.32, .8], [1.4, .96], [-2.2, .98], [-2.3, .9], [-2.3, .4]],
    glass: [[1.35, .96], [.85, 1.5], [.05, 1.5], [-.05, .98]], roof: [[.85, 1.48], [.0, 1.48], [.0, 1.55], [.82, 1.55]],
    extra: [box(1.66, .5, 2.0, '#3a3d40', [0, 1.1, -1.2]), box(1.5, .45, 1.9, '#5a5f64', [0, 1.16, -1.2]), ...[-1, 1].map(s => rod([s * .7, .98, -.25], [s * .7, 1.65, -.25], .03, CHROME)), rod([-.7, 1.65, -.25], [.7, 1.65, -.25], .03, CHROME),
      box(.8, .1, .3, '#2b2e31', [0, .48, 2.32]), P(new THREE.TorusGeometry(.12, .025, 6, 14), CHROME, [0, .6, 2.36])] });
  return { ...v, name: ['Ute', 'Xe bán tải Úc'] };
}
// cậu Tâm's little truck on Two Homes Street (owner, 29 Oct AEDT: it was a solid model that could not be driven): the
// ute's white cab with the family's blue cargo box, driven from the left as in Vietnam
export function tamTruck() {
  const v = ute('#f2f2f2'), left = (p: number[]) => [-p[0], p[1], p[2]];
  v.o.add(solid([box(1.62, 1.3, 2.2, '#3a78c8', [0, 1.62, -1.2]), box(1.66, .08, 2.24, '#2f63a8', [0, 2.3, -1.2])]));
  return { ...v, seat: left(v.seat), grips: v.grips.map(left), feet: v.feet.map(left), wheelAt: left(v.wheelAt) };
}
// a family SUV
export function suv(color = '#2f5a8a', lhd = false) {
  const v = car({ color, lhd, L: 4.4, wheelbase: 2.7, R: .36, body: [[2.15, .42], [2.2, .85], [1.4, 1.0], [-2.1, 1.02], [-2.2, .9], [-2.15, .42]], glass: [[1.4, 1.0], [.85, 1.62], [-1.85, 1.62], [-2.05, 1.02]], roof: [[.85, 1.6], [-1.85, 1.6], [-1.82, 1.67], [.82, 1.67]],
    extra: [...[-1, 1].map(s => rod([s * .62, 1.72, .6], [s * .62, 1.72, -1.6], .02, CHROME))] });
  return { ...v, name: ['SUV', 'Xe gia đình'] };
}
// a city bus (Vietnam: green and yellow; Australia: white and blue), with a long band of windows and a destination sign
export function bus(vn = true) {
  const g = new THREE.Group(), R = .42, L = 9.6, c1 = vn ? '#2f9a4a' : '#f4f4ee', c2 = vn ? '#ffd23f' : '#2f6fb0';
  const wheels = wheelsAt(g, [[1.0, R, 3.2, { r: R, cast: true, rim: '#c9d0d4', tyre: .12 }], [-1.0, R, 3.2, { r: R, cast: true, rim: '#c9d0d4', tyre: .12 }], [1.0, R, -2.8, { r: R, cast: true, rim: '#c9d0d4', tyre: .12 }], [-1.0, R, -2.8, { r: R, cast: true, rim: '#c9d0d4', tyre: .12 }]]);
  g.add(solid([side([[L / 2, .35], [L / 2 + .05, 2.7], [L / 2 - .25, 2.95], [-L / 2 + .1, 2.95], [-L / 2, 2.7], [-L / 2, .35]], 2.4, c1, 0, .03, .12),
    side([[L / 2 + .02, 1.3], [L / 2 + .04, 2.55], [-L / 2 + .3, 2.55], [-L / 2 + .3, 1.3]], 2.44, GLASS, 0, .03, .12), box(2.44, .3, L - .4, c2, [0, .9, 0]),
    ...Array.from({ length: 8 }, (_, k) => box(2.46, 1.2, .08, c1, [0, 1.92, -L / 2 + .9 + k * 1.15])),
    box(1.6, .26, .05, '#1d1f22', [0, 2.72, L / 2 + .06]), box(1.3, .14, .06, '#ffb43a', [0, 2.72, L / 2 + .07]),
    ...[-1, 1].flatMap(sd => [box(.3, .14, .04, '#fff6c8', [sd * .9, .75, L / 2 + .04]), box(.3, .14, .04, '#d8322a', [sd * .9, .8, -L / 2 - .02])]),
    box(.06, 1.9, .9, '#2b2e31', [1.22, 1.3, L / 2 - 1.0]), box(.06, 1.9, .9, '#2b2e31', [1.22, 1.3, .2])], .015));
  return { o: g, cabin: { width: 2.4, length: L, bottom: 1.3, top: 2.55, color: c1 }, wheels, wr: R, seat: [vn ? .7 : -.7, 1.1, L / 2 - .9], grips: null, feet: null, name: [vn ? 'City bus (Vietnam)' : 'City bus (Australia)', 'Xe buýt'] };
}
// ---------- the Huệ Nghi yard (round R story: bà Huệ and ông Nghi's transport and building yard) ----------
// a long-distance coach (xe khách) like the ones from Hà Tĩnh: cream with red and blue bands, a luggage rack on the roof
export function coach() {
  const g = new THREE.Group(), R = .45, L = 10.5;
  const wheels = wheelsAt(g, [[1.05, R, 3.4, { r: R, cast: true, tyre: .13 }], [-1.05, R, 3.4, { r: R, cast: true, tyre: .13 }], [1.05, R, -3.0, { r: R, cast: true, tyre: .13 }], [-1.05, R, -3.0, { r: R, cast: true, tyre: .13 }]]);
  g.add(solid([side([[L / 2, .4], [L / 2 + .1, 2.4], [L / 2 - .4, 3.1], [-L / 2 + .1, 3.1], [-L / 2, 2.9], [-L / 2, .4]], 2.45, '#f2ead6', 0, .03, .14),
    side([[L / 2 + .04, 1.55], [L / 2 - .3, 2.75], [-L / 2 + .3, 2.75], [-L / 2 + .3, 1.6]], 2.49, GLASS, 0, .03, .12),
    box(2.5, .22, L - .3, '#c8322a', [0, 1.2, 0]), box(2.5, .1, L - .3, '#2f5fb0', [0, 1.4, 0]),
    ...Array.from({ length: 8 }, (_, k) => box(2.51, 1.1, .1, '#f2ead6', [0, 2.15, -L / 2 + 1.0 + k * 1.2])),
    box(2.0, .12, 5.5, '#6a6f74', [0, 3.2, -1.5]), ...[-1, 1].map(s => box(.06, .25, 5.5, STEEL, [s * 1, 3.3, -1.5])),
    box(1.0, .5, 1.2, '#4a7ab8', [-.4, 3.5, -1.9]), box(.8, .45, .9, '#d8a83a', [.45, 3.48, -.9]),   // bags tied on the roof
    box(1.8, .26, .05, '#1d1f22', [0, 2.85, L / 2 + .02]), box(1.4, .14, .06, '#ffb43a', [0, 2.85, L / 2 + .03]),
    ...[-1, 1].flatMap(sd => [box(.32, .16, .04, '#fff6c8', [sd * .9, .8, L / 2 + .06]), box(.3, .16, .04, '#d8322a', [sd * .95, .85, -L / 2 - .02])]),
    box(.06, 2.0, .95, '#2b2e31', [1.24, 1.35, L / 2 - 1.1])], .015));
  return { o: g, cabin: { width: 2.45, length: L, bottom: 1.55, top: 2.75, color: '#f2ead6' }, wheels, wr: R, seat: [.7, 1.2, L / 2 - 1], grips: null, feet: null, door: [1.5, 0, L / 2 - 1.1], name: ['Coach', 'Xe khách'] };
}
// a dump truck (xe ben): a blue cab and a steel tipper bed that tips up (userData.bed pivots on its back edge)
export function dumpTruck() {
  const g = new THREE.Group(), R = .5;
  const wheels = wheelsAt(g, [[1.0, R, 2.0, { r: R, cast: true, tyre: .16 }], [-1.0, R, 2.0, { r: R, cast: true, tyre: .16 }], [1.0, R, -1.2, { r: R, cast: true, tyre: .16 }], [-1.0, R, -1.2, { r: R, cast: true, tyre: .16 }], [1.0, R, -2.3, { r: R, cast: true, tyre: .16 }], [-1.0, R, -2.3, { r: R, cast: true, tyre: .16 }]]);
  g.add(solid([box(1.7, .3, 6.2, '#3a3d40', [0, .75, -.2]),
    side([[3.0, .7], [3.05, 2.2], [2.7, 2.8], [1.4, 2.85], [1.35, .7]], 2.3, '#2f6fb0', 0, .03, .14), side([[2.95, 1.75], [2.68, 2.6], [1.55, 2.6], [1.55, 1.75]], 2.34, GLASS, 0, .03, .1),
    box(2.0, .3, .1, '#3a3d40', [0, .9, 3.06]), ...[-1, 1].flatMap(sd => [box(.3, .16, .05, '#fff6c8', [sd * .8, 1.2, 3.07]), box(.5, .5, .5, '#3a3d40', [sd * .9, .95, -3.2])]),
    ...[-1, 1].map(sd => P(new THREE.TorusGeometry(.62, .1, 6, 16, Math.PI), '#2b2e31', [sd * 1.03, R, 2.0], [0, Math.PI / 2, 0]))], .015));
  // the tipper bed: hinged at the back (z = -3.1, y = 1.0); the load sits inside it
  const bed = new THREE.Group(); bed.position.set(0, 1.0, -3.1); g.add(bed);
  bed.add(solid([box(2.3, .15, 4.3, '#c9a43a', [0, .1, 2.15]), ...[-1, 1].map(sd => box(.12, 1.1, 4.3, '#c9a43a', [sd * 1.1, .7, 2.15])), box(2.3, 1.3, .12, '#c9a43a', [0, .8, 4.3]), box(2.3, 1.1, .1, '#b8932e', [0, .65, .02]),
    ...Array.from({ length: 4 }, (_, k) => box(2.34, .08, .1, '#8a6e22', [0, .9, .6 + k * 1.1]))], .015));
  const load = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshToonMaterial({ color: '#8a7a68' })); load.scale.set(1.0, .45, 1.8); load.position.set(0, .9, 2.1); load.visible = false; bed.add(load);
  g.userData = { bed, load };
  return { o: g, wheels, wr: R, seat: [.5, 1.35, 2.1], grips: null, feet: null, name: ['Dump truck', 'Xe ben'] };
}
// an excavator (máy xúc): tracks, a turning yellow body, and a boom, arm and bucket that move (userData.turn, boom, arm, bucket)
export function excavator() {
  const g = new THREE.Group(), Y = '#f2b81e';
  g.add(solid([...[-1, 1].flatMap(sd => [box(.6, .7, 3.6, '#2b2e31', [sd * 1.0, .35, 0]), ...[-1.4, -.47, .47, 1.4].map(z => disc(.3, .62, '#5a5f64', [sd * 1.0, .35, z]))]), box(1.6, .3, 1.6, '#3a3d40', [0, .8, 0])], .015));
  const turn = new THREE.Group(); turn.position.y = .95; g.add(turn);
  turn.add(solid([box(2.4, .9, 2.8, Y, [0, .45, -.3]), box(1.0, 1.4, 1.1, Y, [.6, 1.6, .55]), box(.92, .9, 1.02, GLASS, [.6, 1.75, .56]), box(2.2, .5, .6, '#3a3d40', [0, .5, -1.75]), box(.12, .7, .12, '#3a3d40', [-.6, 1.25, -1.2])], .015));
  const boom = new THREE.Group(); boom.position.set(-.3, .9, .9); turn.add(boom);
  boom.add(solid([box(.35, .45, 3.0, Y, [0, 0, 1.5])], .012)); boom.rotation.x = -.5;
  const arm = new THREE.Group(); arm.position.set(0, 0, 3.0); boom.add(arm);
  arm.add(solid([box(.3, .38, 2.2, Y, [0, 0, 1.1])], .012)); arm.rotation.x = 1.3;
  const bucket = new THREE.Group(); bucket.position.set(0, 0, 2.2); arm.add(bucket);
  bucket.add(solid([box(.9, .55, .12, '#5a5f64', [0, -.2, .3]), box(.9, .1, .6, '#5a5f64', [0, -.45, 0]), ...[-1, 1].map(s => box(.08, .5, .6, '#5a5f64', [s * .42, -.2, 0])), ...[-.3, 0, .3].map(x => box(.08, .08, .15, '#8e959a', [x, -.48, -.35]))], .012));
  bucket.rotation.x = .4;
  g.userData = { turn, boom, arm, bucket };
  return { o: g, wheels: [], wr: 1, seat: [.6, 1.9, .5], grips: null, feet: null, name: ['Excavator', 'Máy xúc'] };
}
// trams: Melbourne's old W-class (green and cream, wooden, with a trolley pole) and a long modern low-floor tram
export function tram(kind = 'w') {
  const g = new THREE.Group(), R = .3, w = kind === 'w', L = w ? 10 : 16, c1 = w ? '#2f6b4a' : '#f4f4ee', c2 = w ? '#f2e2b8' : '#7ac143';
  const z = w ? [3.3, 2.6, -2.6, -3.3] : [6.2, 5.4, .4, -.4, -5.4, -6.2];
  const wheels = wheelsAt(g, z.flatMap(zz => [[.72, R, zz, { r: R, cast: true, rim: '#5a5f64', tyre: .05 }], [-.72, R, zz, { r: R, cast: true, rim: '#5a5f64', tyre: .05 }]]));
  const p = [side([[L / 2, .5], [L / 2 + .1, 1.3], [L / 2, 2.9], [-L / 2, 2.9], [-L / 2 - .1, 1.3], [-L / 2, .5]], 2.4, c1, 0, .03, .12),
    side([[L / 2 - .2, 1.55], [L / 2 - .1, 2.55], [-L / 2 + .1, 2.55], [-L / 2 + .2, 1.55]], 2.44, GLASS, 0, .03, .12), box(2.44, .4, L - .3, c2, [0, 1.3, 0]),
    side([[L / 2 - .3, 2.9], [L / 2 - .6, 3.15], [-L / 2 + .6, 3.15], [-L / 2 + .3, 2.9]], 2.1, w ? '#6a4a3a' : '#c9d0d4', 0, .03, .12),
    ...Array.from({ length: Math.floor(L / 1.2) }, (_, k) => box(2.46, 1.0, .08, c1, [0, 2.05, -L / 2 + .7 + k * 1.2])),
    ...[-1, 1].flatMap(sd => [box(.3, .14, .04, '#fff6c8', [sd * .7, 1.0, sd * (L / 2 + .06)])]), box(1.4, .24, .05, '#1d1f22', [0, 2.75, L / 2 + .02]), box(1.1, .12, .06, '#ffb43a', [0, 2.75, L / 2 + .03])];
  if (w) p.push(rod([0, 3.15, -1.5], [0, 5.4, -4.6], .03, '#2b2e31'), ball(.06, '#2b2e31', [0, 5.42, -4.62]));
  else p.push(side([[1.2, 3.15], [.9, 3.6], [-.9, 3.6], [-1.2, 3.15]], .1, '#2b2e31', 0, .03, .12), rod([-.6, 3.6, 0], [.6, 3.6, 0], .02, '#2b2e31'), ...[-5.4, 5.4].map(zz => box(2.3, .5, .1, '#2b2e31', [0, 1.6, zz * .48])));
  g.add(solid(p, .015));
  return { o: g, cabin: { width: 2.4, length: L, bottom: 1.55, top: 2.55, color: c1 }, wheels, wr: R, seat: [0, 1.1, L / 2 - .7], grips: null, feet: null, name: [w ? 'Melbourne W-class tram' : 'Modern tram', w ? 'Tàu điện cổ Melbourne' : 'Tàu điện hiện đại'] };
}
// Hà Nội's electric tourist cart round Hồ Gươm: open sides, four rows of benches, a white canopy
export function touristCart() {
  const g = new THREE.Group(), R = .26, L = 4.6;
  const wheels = wheelsAt(g, [[.62, R, 1.6, { r: R, cast: true, tyre: .08 }], [-.62, R, 1.6, { r: R, cast: true, tyre: .08 }], [.62, R, -1.6, { r: R, cast: true, tyre: .08 }], [-.62, R, -1.6, { r: R, cast: true, tyre: .08 }]]);
  const p = [side([[L / 2, .3], [L / 2 + .05, .8], [L / 2 - .4, 1.0], [-L / 2, .7], [-L / 2, .3]], 1.4, '#f4f4ee', 0, .03, .12), box(1.42, .5, .4, '#f4f4ee', [0, 1.05, L / 2 - .5]),
    box(1.5, .06, L - .2, '#f4f4ee', [0, 2.15, 0]), ...[[.68, L / 2 - .4], [-.68, L / 2 - .4], [.68, -L / 2 + .2], [-.68, -L / 2 + .2]].map(([x, zz]) => rod([x, .8, zz], [x, 2.15, zz], .03, '#c9d0d4')),
    side([[L / 2 - .3, 1.05], [L / 2 - .1, 1.9], [L / 2 - .3, 2.12], [L / 2 - .45, 1.05]], 1.3, GLASS, 0, .03, .12),
    ...[0, 1, 2, 3].flatMap(k => [box(1.2, .1, .4, '#c62f2f', [0, .78, L / 2 - 1.3 - k * .85]), box(1.2, .45, .08, '#c62f2f', [0, 1.02, L / 2 - 1.5 - k * .85])]),
    disc(.16, .03, '#2b2e31', [.3, 1.25, L / 2 - .8]), ...[-1, 1].map(sd => box(.18, .08, .04, '#fff6c8', [sd * .5, .7, L / 2 + .04]))];
  g.add(solid(p, .012));
  return { o: g, wheels, wr: R, seat: [.3, .86, L / 2 - 1.3], grips: [[.42, 1.25, L / 2 - .8], [.18, 1.25, L / 2 - .8]], feet: [[.36, .4, L / 2 - .7], [.24, .4, L / 2 - .7]], name: ['Electric tourist cart (Hà Nội)', 'Xe điện du lịch Hồ Gươm'] };
}
// xe ba gác máy: a motorbike front with a wooden cargo bed on two wheels behind, loaded with crates
export function baGac() {
  const g = new THREE.Group(), R = .28, F = .9, B = -.8;
  const wheels = wheelsAt(g, [[0, R, F, { r: R }], [.62, R, B, { r: R }], [-.62, R, B, { r: R }]]);
  g.add(solid([...[-1, 1].map(s => rod([s * .065, 1.0, .78], [s * .065, R, F], .022, CHROME)), bend([[0, R + .05, F - .3], [0, R + .28, F - .1], [0, R + .3, F + .08], [0, R + .2, F + .27]], .06, '#2f6fb0'),
    side([[.82, .95], [.7, .6], [.4, .45], [.2, .5], [.5, .7], [.62, .96]], .22, '#2f6fb0', 0, .03, .12), side([[.3, .8], [-.2, .82], [-.25, .76], [.3, .74]], .24, BLACK, 0, .03, .12),
    rod([0, .5, .3], [0, .5, -.3], .04, '#3a3d40'), box(.2, .2, .3, '#8e959a', [0, .4, 0]), box(1.4, .08, 1.6, '#8a6a3e', [0, .7, -.9]), ...[-1, 1].map(s => box(.06, .35, 1.6, '#7a5a34', [s * .7, .88, -.9])), box(1.4, .35, .06, '#7a5a34', [0, .88, -1.7]),
    ...[[-.35, -.6], [.35, -.6], [-.35, -1.2], [.35, -1.2], [0, -.9]].map(([x, zz], k) => box(.6, .4, .5, k % 2 ? '#c9a24a' : '#b8893a', [x, k === 4 ? 1.35 : .95, zz])),
    ...lamp([0, .95, .86], .065), ...grips(1.05, .72, .3), rod([0, 1.05, .76], [0, .9, .7], .02, CHROME)], .01));
  return { o: g, wheels, wr: R, seat: [0, .84, .02], grips: [[.26, 1.05, .72], [-.26, 1.05, .72]], feet: [[.12, .5, .25], [-.12, .5, .25]], name: ['Cargo tricycle (xe ba gác)', 'Xe ba gác máy'] };
}

// Sit a person (an avatar from js/avatar.js) on a vehicle so that the hips are on the seat, both hands hold the grips
// and both feet rest on the pegs, footboard or pedals. The avatar's arms and legs are straight (no elbows or knees),
// so the body leans forward from the hips until the hands reach, and each arm and leg is turned to point at its spot.
// at: the seat; grips, feet: [left, right] points, all in the vehicle's own space (the avatar must be a child of v.o).
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _pq = new THREE.Quaternion(), DOWN = new THREE.Vector3(0, -1, 0);
function aim(limb, target, len) {
  limb.rotation.set(0, 0, 0); limb.updateMatrixWorld(true);
  limb.getWorldPosition(_a); _b.copy(target).sub(_a); const d = _b.length(); _b.normalize();
  limb.parent.getWorldQuaternion(_pq); _b.applyQuaternion(_pq.invert());          // the direction in the limb's parent's space
  limb.quaternion.copy(_q.setFromUnitVectors(DOWN, _b));
  return d / len;                                                                     // above 1: the limb can't quite reach
}
// attach = false: the person stays where they are in the scene (a child riding) and is only moved onto the seat
export function seatRider(A, v, at, grips, feet, scale = .9, attach = true) {
  const o = v.o; A.root.scale.setScalar(scale);
  if (attach) { A.root.position.set(at[0], at[1] - .6 * scale, at[2]); A.root.rotation.set(0, 0, 0); if (A.root.parent !== o) o.add(A.root); }
  else { o.updateMatrixWorld(true); A.root.position.copy(o.localToWorld(new THREE.Vector3(at[0], at[1] - .6 * scale, at[2]))); A.root.rotation.set(0, o.rotation.y, 0); A.root.updateMatrixWorld(true); }
  const W = p => o.localToWorld(new THREE.Vector3(...p));
  o.updateMatrixWorld(true);
  // lean forward from the hips (the torso turns about the hip point) until the hands reach the grips
  const hip = new THREE.Vector3(0, .6, 0);
  let lean = 0;
  for (let k = 0; k <= 14; k++) {
    lean = k * .05; A.torso.rotation.set(lean, 0, 0); A.torso.position.copy(hip).sub(hip.clone().applyEuler(A.torso.rotation));
    // the head sits on the rig, not on the torso: carry it along so it stays on the neck, tipped back a little to look ahead
    A.head.position.copy(A.torso.position).add(new THREE.Vector3(0, 1.33, 0).applyEuler(A.torso.rotation)); A.head.rotation.set(lean * .35, 0, 0);
    A.root.updateMatrixWorld(true);
    if (!grips || Math.max(aim(A.armL, W(grips[0]), .42 * scale), aim(A.armR, W(grips[1]), .42 * scale)) <= 1.02) break;
  }
  if (grips) { const r = Math.max(aim(A.armL, W(grips[0]), .42 * scale), aim(A.armR, W(grips[1]), .42 * scale)); if (r > 1) { A.armL.scale.y = A.armR.scale.y = Math.min(1.35, r); } }
  if (feet) { aim(A.legL, W(feet[0]), .56 * scale); aim(A.legR, W(feet[1]), .56 * scale); }
  // (owner, 30 Oct 2026 AEDT: "the head pokes through the roof") a seated child is taller than a car's cabin: sink into the
  // seat until the head is under the roof (the closed body hides the hips), then reach for the wheel and pedals again
  if (v.cabin) {
    A.root.updateMatrixWorld(true); const top = new THREE.Box3().setFromObject(A.head).max, head = o.worldToLocal(top.clone()).y;
    const over = head - (v.cabin.top - .03);
    if (over > 0) {
      if (attach) A.root.position.y -= over; else A.root.position.y -= over * o.scale.y;
      A.root.updateMatrixWorld(true);
      if (grips) { const r = Math.max(aim(A.armL, W(grips[0]), .42 * scale), aim(A.armR, W(grips[1]), .42 * scale)); A.armL.scale.y = A.armR.scale.y = r > 1 ? Math.min(1.35, r) : 1; }
      if (feet) { aim(A.legL, W(feet[0]), .56 * scale); aim(A.legR, W(feet[1]), .56 * scale); }
    }
  }
  return A;
}

// build one: build('honda67', { real: true }) for an older child's valley
export function build(id, { real = false, args = [] } = {}) { REAL = real; try { return VEHICLES[id](...args); } finally { REAL = false; } }
// every vehicle by id, for Sparkle Studio and the valley's traffic
export const VEHICLES = { honda67, cub, dream, scooter, xichlo, baGac, postie, trailBike, quadBike, roadster, miniBike, roadBike, bmx, kidsBike, packBike,
  sedan, taxi, ute, suv, bus: () => bus(true), busAU: () => bus(false), tram: () => tram('w'), tramModern: () => tram('e'), touristCart, tamTruck, coach, dumpTruck, excavator };
