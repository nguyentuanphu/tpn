// Power poles and their wires (owner, round R). The poles are switched off for now (Studio "Things in the valley",
// CUSTOM.features.powerPoles) but kept: when switched on, every pole (Phố Hai Quê's own, and any the family places
// in Sparkle Studio's map) is collected here first, then build() joins them up by itself:
//   · pole to pole: each pole is wired to its nearest neighbours with the shortest set of links that reaches every
//     pole within reach (a minimum spanning tree, links up to REACH metres), so the wires always run from one pole
//     to the next and never zig-zag across the street;
//   · each crossarm turns to face its wires, and two wires hang from the ends of each arm with a gentle sag;
//   · a house that asks for power (drop) gets one wire from its nearest pole.
import { THREE, P, merge, toon, toonVC } from './gfx.js';
import { featureOn } from './custom.js';

const REACH = 16, TOP = 8.4, ARM = .6;
const poles = [], drops = [];
export const powerOn = () => featureOn('powerPoles', false);
// a pole standing on the ground at (x, ground y, z)
export function addPole(world, x, y, z) { if (!powerOn()) return false; poles.push({ x, y, z, links: [] }); world.colliders.push({ x, z, r: .35 }); return true; }
// a wire from the nearest pole to a point on a house wall (x, height, z)
export function addDrop(x, y, z) { if (powerOn()) drops.push(new THREE.Vector3(x, y, z)); }

// the links: shortest-first, joining two poles only when they are not yet connected (Kruskal)
export function linksFor(list, reach = REACH) {
  const pairs = [];
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) { const d = Math.hypot(list[i].x - list[j].x, list[i].z - list[j].z); if (d > .5 && d <= reach) pairs.push([d, i, j]); }
  pairs.sort((a, b) => a[0] - b[0]);
  const root = list.map((_, i) => i), find = i => root[i] === i ? i : (root[i] = find(root[i]));
  const out = [];
  for (const [, i, j] of pairs) { const a = find(i), b = find(j); if (a !== b) { root[a] = b; out.push([i, j]); } }
  return out;
}

export function buildPowerLines(G) {
  const { scene } = G;
  if (!poles.length) return 0;
  const links = linksFor(poles);
  links.forEach(([i, j]) => { poles[i].links.push(j); poles[j].links.push(i); });
  // each crossarm faces across its wires: along the average way its wires run, turned a quarter
  const armDir = p => { let dx = 0, dz = 0; for (const k of p.links) { let ax = poles[k].x - p.x, az = poles[k].z - p.z; const l = Math.hypot(ax, az) || 1; ax /= l; az /= l; if (ax * dx + az * dz < 0) { ax = -ax; az = -az; } dx += ax; dz += az; }
    const l = Math.hypot(dx, dz); return l ? [-dz / l, dx / l] : [1, 0]; };
  const parts = [];
  poles.forEach(p => { p.arm = armDir(p); const yaw = Math.atan2(p.arm[0], p.arm[1]);
    parts.push(P(new THREE.CylinderGeometry(.16, .2, 9, 6), '#7d7b70', [p.x, p.y + 4.5, p.z]), P(new THREE.BoxGeometry(.12, .12, ARM * 2 + .4), '#6f6d64', [p.x, p.y + TOP, p.z], [0, yaw, 0])); });
  const pm = new THREE.Mesh(merge(parts), toonVC()); pm.castShadow = true; scene.add(pm);
  const wireMat = toon('#3d4447'), tubes = [];
  const wire = (a, b, sag) => { const mid = a.clone().lerp(b, .5); mid.y -= sag; tubes.push(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 16, .025, 3, false)); };
  const end = (p, side) => new THREE.Vector3(p.x + p.arm[0] * ARM * side, p.y + TOP, p.z + p.arm[1] * ARM * side);
  for (const [i, j] of links) { const a = poles[i], b = poles[j];
    // keep the two wires apart: match each end of one arm to the nearer end of the other
    const same = end(a, 1).distanceTo(end(b, 1)) <= end(a, 1).distanceTo(end(b, -1)) ? 1 : -1;
    const sag = .5 + Math.hypot(a.x - b.x, a.z - b.z) * .06;
    wire(end(a, 1), end(b, same), sag); wire(end(a, -1), end(b, -same), sag); }
  for (const d of drops) { let best = null, bd = 1e9; for (const p of poles) { const k = Math.hypot(p.x - d.x, p.z - d.z); if (k < bd) { bd = k; best = p; } } if (best && bd <= REACH) wire(new THREE.Vector3(best.x, best.y + TOP, best.z), d, .4 + bd * .07); }
  if (tubes.length) scene.add(new THREE.Mesh(merge(tubes.map(g => ({ g: g.toNonIndexed(), color: '#3d4447' }))), wireMat));
  G.powerLines = { poles: poles.length, links: links.length, drops: drops.length };
  return links.length;
}
