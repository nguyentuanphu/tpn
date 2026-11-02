// One world checker for the hard rules (architecture step "gen.validate", round 30): the same checks wherever they
// are needed (the test suite now; Sparkle Studio before Publish next). Each problem names its rule id from
// docs/ARCHITECTURE.md §9, so a report reads the same everywhere. It only reads the world; it never changes it.
//   validateWorld(G) → [{ rule, severity, msg }]   (empty when every rule holds; severity from js/content/rules.js)
import { ROADS, roadDist, VILLAGE } from './world.js';
import { ROAD_GRADE } from './roads.js';
import { RULES } from './content/rules.js';
import { ROAD_WIDTH, STALL, MARKET_ROWS, rowStreet } from './content/map.js';

export function validateWorld(G) {
  const W = G.world, out = [], add = (rule, msg) => { if (!RULES[rule]) throw new Error(`validate.js uses ${rule}, which is not in the rule registry`); if (out.length < 200) out.push({ rule, severity: RULES[rule].severity, msg }); }, f = v => v.toFixed(0);
  // ROAD-003 grade, ROAD-002 smooth curves (no step turns more than 8°), rounded changes of slope
  (W.roadLines || []).forEach((L, k) => {
    const G2 = (ROAD_GRADE[L.kind] || ROAD_GRADE.dirt) + .002;
    for (let i = 1; i < L.ys.length; i++) {
      const d = Math.hypot(L.pts[i][0] - L.pts[i - 1][0], L.pts[i][1] - L.pts[i - 1][1]) || 1, g = Math.abs(L.ys[i] - L.ys[i - 1]) / d;
      if (g > G2 && !L.deck[i]) add('ROAD-003', `road ${k} (${L.kind}) ${(g * 100).toFixed(0)} % at ${L.pts[i].map(f)}`);
      if (i < L.ys.length - 1) {
        const a1 = Math.atan2(L.pts[i][1] - L.pts[i - 1][1], L.pts[i][0] - L.pts[i - 1][0]), a2 = Math.atan2(L.pts[i + 1][1] - L.pts[i][1], L.pts[i + 1][0] - L.pts[i][0]); let t = Math.abs(a2 - a1); if (t > Math.PI) t = 2 * Math.PI - t;
        if (t * 180 / Math.PI > 8) add('ROAD-002', `road ${k} turns ${(t * 180 / Math.PI).toFixed(0)}° at ${L.pts[i].map(f)}`);
        if (Math.abs((L.ys[i + 1] - L.ys[i]) - (L.ys[i] - L.ys[i - 1])) > .16 && !L.deck[i]) add('ROAD-003', `road ${k} kink at ${L.pts[i].map(f)}`);
      }
    }
  });
  // ROAD-001 widths (asphalt 6.4, dirt 3.4, footpath 1.6: js/content/map.js ROAD_WIDTH)
  const WIDTH = ROAD_WIDTH;
  ROADS.forEach((R, k) => { if (WIDTH[R.kind] !== R.w) add('ROAD-001', `road ${k} is ${R.kind} ${R.w} m wide`); });
  // G5 / ROAD-004: nothing solid or tappable standing on a road
  const on = (x, z, r) => { const d = roadDist(x, z); return d.road && d.d < d.road.w / 2 + r; };
  for (const c of W.colliders) if (c.r > .45 && on(c.x, c.z, c.r - .3)) add('ROAD-004', `something solid on a road at ${f(c.x)},${f(c.z)}`);
  for (const b of W.boxes) { const x = (b.x0 + b.x1) / 2, z = (b.z0 + b.z1) / 2; if (on(x, z, Math.min(b.x1 - b.x0, b.z1 - b.z0) / 2)) add('ROAD-004', `a building on a road at ${f(x)},${f(z)}`); }
  // (a street seller walking along the pavement may cross a side street on the way: walking, not standing; skipped)
  for (const i of G.interactables || []) if (Number.isFinite(i.x) && !i.walks && on(i.x, i.z, -.5)) add('ROAD-004', `"${i.id}" stands on a road`);
  // ROAD-011: Lotus Village's pond path keeps 1.5–2.5 m between its edge and the water
  const pond = [VILLAGE.x - 10, VILLAGE.z + 4], pp = ROADS.find(R => R.id === 'lv_pond'); // (round T: by its id in the map, not "the first footpath")
  if (pp) pp.pts.slice(3).forEach(([x, z]) => { const g = Math.hypot(x - pond[0], z - pond[1]) - 5.2 - pp.w / 2; if (g < 1.45 || g > 2.55) add('ROAD-011', `pond path ${g.toFixed(1)} m from the water at ${f(x)},${f(z)}`); });
  // VEH-001: riders at walking pace or slower (js/lotus.js)
  for (const m of (G.lotus && G.lotus.movers) || []) if (m.speed > 1) add('VEH-001', `a rider goes ${m.speed} m/s on a ${m.r ? 'path' : 'road'}`);
  stallRules(G, add);
  return out;
}

// (T1b, owner 11 Oct) tidy streets: STALL-001…004. Every stall, kiosk, food van and seller's tent is in world.stalls
// ({ id, place, kind, x, z, w, d, face, tap }: its own footprint, w along the street, d across it, facing `face`);
// walking sellers' routes are in world.walks ({ id, place, pts }). Shopkeepers at their own shop door (kind 'shop') only
// keep their tap point off the road.
const fwd = s => [Math.sin(s.face), Math.cos(s.face)], across = s => [Math.cos(s.face), -Math.sin(s.face)];
// distance from a point to a footprint (0 inside it)
const toRect = (s, x, z) => { const [fx, fz] = fwd(s), [ax, az] = across(s), u = (x - s.x) * ax + (z - s.z) * az, v = (x - s.x) * fx + (z - s.z) * fz; return Math.hypot(Math.max(Math.abs(u) - s.w / 2, 0), Math.max(Math.abs(v) - s.d / 2, 0)); };
// points round a footprint's edge, every 0.25 m, and its middle
function rim(s) { const [fx, fz] = fwd(s), [ax, az] = across(s), out = [[s.x, s.z]]; for (const [L, n] of [[s.w, 1], [s.d, 0]]) for (let t = -L / 2; t <= L / 2 + 1e-6; t += .25) for (const e of [-1, 1]) { const u = n ? t : e * s.w / 2, v = n ? e * s.d / 2 : t; out.push([s.x + ax * u + fx * v, s.z + az * u + fz * v]); } return out; }
const segD = (S, x, z) => { const t = Math.max(0, Math.min(S.len, (x - S.a[0]) * S.dx + (z - S.a[1]) * S.dz)); return Math.hypot(x - S.a[0] - S.dx * t, z - S.a[1] - S.dz * t); };
function stallRules(G, add) {
  const W = G.world, stalls = W.stalls || [], f1 = v => v.toFixed(1), streets = MARKET_ROWS.map(R => rowStreet(R.place));
  // how far (x, z) is from the edge of the nearest road or place street (negative: on it); `cars`: only streets with traffic
  const edge = (x, z, cars) => { const r = roadDist(x, z); let e = r.road ? r.d - r.road.w / 2 : 99; for (const S of streets) if (!(cars && S.walking)) e = Math.min(e, segD(S, x, z) - S.w / 2); return e; };
  const own = (x, z) => stalls.some(s => toRect(s, x, z) < .3);
  const blds = [...W.boxes.filter(b => !b.room && (b.x1 - b.x0) * (b.z1 - b.z0) > 7 && !own((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2)).map(b => ({ x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2, w: b.x1 - b.x0, d: b.z1 - b.z0, face: 0 })),
    ...W.colliders.filter(c => c.r >= 1.9 && !own(c.x, c.z)).map(c => ({ x: c.x, z: c.z, r: c.r }))];
  const toBld = (B, x, z) => B.r ? Math.hypot(B.x - x, B.z - z) - B.r : toRect(B, x, z);
  const tapsOf = new Map(); for (const i of G.interactables || []) if (Number.isFinite(i.x)) (tapsOf.get(i.id) || tapsOf.set(i.id, []).get(i.id)).push(i);
  const where = s => `"${s.id}" (${s.place}) at ${f1(s.x)},${f1(s.z)}`;
  for (const s of stalls) {
    // (two kiosks may share an id, like the two bánh khọt kiosks: the one nearest the stall is its own)
    const tap = s.tap && (tapsOf.get(s.tap) || []).reduce((b, i) => !b || Math.hypot(i.x - s.x, i.z - s.z) < Math.hypot(b.x - s.x, b.z - s.z) ? i : b, null), S = rowStreet(s.place);
    if (s.tap && !tap) add('STALL-002', `${where(s)} has no tap point ${s.tap}`);
    // STALL-002 (tap): the place a child taps is between the stall and its street, and never on a road
    if (tap && S) { if (edge(tap.x, tap.z, true) < -.01) add('STALL-002', `${where(s)}: its tap point is on a road (${f1(edge(tap.x, tap.z, true))} m)`); if (!S.walking && segD(S, tap.x, tap.z) > segD(S, s.x, s.z) + .01 && s.kind !== 'shop') add('STALL-002', `${where(s)}: its tap point is behind it, away from the street`); }
    if (s.kind === 'shop') continue;
    // STALL-001: STALL.road from any road's or street's edge, STALL.building from any building
    const pts = rim(s), e = Math.min(...pts.map(([x, z]) => edge(x, z, false)));
    if (e < STALL.road - .01) add('STALL-001', `${where(s)} is ${f1(e)} m from the edge of a road or street (${STALL.road} m or more)`);
    for (const B of blds) { const d = Math.min(...pts.map(([x, z]) => toBld(B, x, z))); if (d < STALL.building - .01) { add('STALL-001', `${where(s)} is ${f1(d)} m from a building at ${f1(B.x)},${f1(B.z)} (${STALL.building} m or more)`); break; } }
    // STALL-003: in its place's market row, on the row's side, in the row's line
    if (!S) { add('STALL-003', `${where(s)} stands alone: ${s.place} has no market row`); continue; }
    const rx = s.x - S.a[0], rz = s.z - S.a[1], off = rx * S.nx + rz * S.nz, t = rx * S.dx + rz * S.dz, line = S.w / 2 + STALL.road + s.d / 2;
    if (off < 0) add('STALL-003', `${where(s)} is on the wrong side of the street (the row is on the other side)`);
    else if (off > line + 2 || t < -1 || t > S.len + 1) add('STALL-003', `${where(s)} is out of the row (${f1(off - line)} m behind it, ${f1(t)} m along the street)`);
    // STALL-002 (facing): it looks at its street
    const [fx, fz] = fwd(s); if (fx * -S.nx + fz * -S.nz < .9) add('STALL-002', `${where(s)} does not face its street`);
  }
  // STALL-002: clear ground between neighbours; STALL-003: no gap in a row wide enough to leave a stall alone
  const byPlace = {}; for (const s of stalls) if (s.kind !== 'shop') (byPlace[s.place] ||= []).push(s);
  for (const [place, L] of Object.entries(byPlace)) {
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const d = Math.min(...rim(L[i]).map(([x, z]) => toRect(L[j], x, z)), ...rim(L[j]).map(([x, z]) => toRect(L[i], x, z))); if (d < STALL.gap - .01) add('STALL-002', `"${L[i].id}" and "${L[j].id}" (${place}) are ${f1(d)} m apart (${STALL.gap} m or more)`); }
    const S = rowStreet(place); if (!S || L.length < 2) continue;
    const along = L.map(s => { const t = (s.x - S.a[0]) * S.dx + (s.z - S.a[1]) * S.dz; return { s, t0: t - s.w / 2, t1: t + s.w / 2 }; }).sort((a, b) => a.t0 - b.t0);
    for (let k = 1; k < along.length; k++) if (along[k].t0 - along[k - 1].t1 > STALL.alone) add('STALL-003', `"${along[k].s.id}" (${place}) stands alone: ${f1(along[k].t0 - along[k - 1].t1)} m of open ground from "${along[k - 1].s.id}" (${STALL.alone} m at most)`);
  }
  // STALL-004: walking sellers keep to the footpath: never on a road, never through a building or a stall, never off in a field
  for (const R of W.walks || []) {
    for (let k = 1; k < R.pts.length; k++) {
      const [ax, az] = R.pts[k - 1], [bx, bz] = R.pts[k], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az)));
      for (let i = 0; i <= n; i++) {
        const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n, e = edge(x, z, true), near = Math.min(edge(x, z, false), 99);
        const hit = blds.find(B => toBld(B, x, z) < .5) || stalls.find(s => toRect(s, x, z) < .5);
        if (e < .3) { add('STALL-004', `"${R.id}" (${R.place}) walks on a road at ${f1(x)},${f1(z)}`); break; }
        if (hit) { add('STALL-004', `"${R.id}" (${R.place}) walks through ${hit.id ? '"' + hit.id + '"' : 'a building'} at ${f1(x)},${f1(z)}`); break; }
        if (near > 3) { add('STALL-004', `"${R.id}" (${R.place}) leaves the footpath (${f1(near)} m from the street) at ${f1(x)},${f1(z)}`); break; }
      }
    }
  }
}
