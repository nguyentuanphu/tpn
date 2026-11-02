// The map of the valley (round T): js/content/map.js is plain data, so it is checked here in Node.
// WORLD-008 ids unique and well-formed, WORLD-009 every reference resolves, and everything inside the valley.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../../js/content/map.js';

const HALF = M.WORLD.size / 2;
const placeIds = new Set(M.PLACES.map(p => p.id));
const lists = { PLACES: M.PLACES, WATERS: M.WATERS, BRIDGES: M.BRIDGES, ROADS: M.ROADS, SADDLES: M.SADDLES, CLEARINGS: M.CLEARINGS, SHRINES: M.SHRINES, TOWERS: M.TOWERS, LEAFIES: M.LEAFIES, BOATS: M.BOATS, PLOTS: M.PLOTS };
const inside = ([x, z], pad = 0) => Number.isFinite(x) && Number.isFinite(z) && Math.abs(x) <= HALF - pad && Math.abs(z) <= HALF - pad;

test('map: every id is unique in its list and well-formed (WORLD-008)', () => {
  for (const [name, list] of Object.entries(lists)) {
    const ids = list.map(o => o.id);
    assert.equal(new Set(ids).size, ids.length, `${name}: the same id twice`);
    for (const id of ids) assert.match(id, /^[a-z][a-z0-9_]*$/, `${name}: bad id ${id}`);
  }
});

test('map: every reference resolves (WORLD-009)', () => {
  for (const p of M.PLACES) if (p.place) assert.ok(placeIds.has(p.place), `place ${p.id} sits in an unknown place ${p.place}`);
  for (const R of M.ROADS) for (const g of R.gates || []) if (g) assert.ok(placeIds.has(g), `road ${R.id}: gate to an unknown place ${g}`);
  const waters = new Set(M.WATERS.map(w => w.id));
  for (const B of M.BRIDGES) { assert.ok(waters.has(B.over), `bridge ${B.id} over unknown water ${B.over}`); assert.ok(B.axis === 'x' || B.axis === 'z', `bridge ${B.id}: axis x or z, never diagonal`); }
  for (const W of M.WATERS) if (W.place) assert.ok(placeIds.has(W.place), `water ${W.id} in an unknown place`);
  for (const [id, L] of Object.entries(M.LANDMARK_AT)) assert.ok(placeIds.has(L.place), `landmark ${id} in an unknown place ${L.place}`);
  for (const [id, home] of Object.entries(M.LANDMARK_HOME)) assert.ok(placeIds.has(home), `landmark ${id} belongs to an unknown place ${home}`);
  for (const C of M.CLEARINGS) if (C.place) assert.ok(placeIds.has(C.place), `clearing ${C.id} in an unknown place`);
  for (const b of M.BOATS) for (const w of [].concat(b.water)) assert.ok(waters.has(w), `boat ${b.id} on unknown water ${w}`);
  for (const [item, place] of M.GATHER_AT) assert.ok(placeIds.has(place), `a ${item} to pick up by an unknown place ${place}`);
  for (const id of Object.keys(M.LEGACY.C)) assert.ok(placeIds.has(id), `old anchor for an unknown place ${id}`);
  // (round T3) every plot is in a Memory Village of the map, and every boat with piers has two
  for (const p of M.PLOTS) assert.ok(M.PLACES.some(q => q.id === p.village && q.kind === 'plots'), `plot ${p.id} in an unknown village ${p.village}`);
  for (const b of M.BOATS) if (b.piers) assert.equal(b.piers.length, 2, `boat ${b.id}: two piers`);
});

test('map: every place, road, bridge, landmark and spot is inside the valley', () => {
  for (const p of M.PLACES) assert.ok(inside(M.anchorOf(p.id), 5), `place ${p.id} outside`);
  for (const p of M.PLOTS) { const [x, z] = M.anchorOf(p.village); assert.ok(inside([x + p.off[0], z + p.off[1]], 12), `plot ${p.id} outside`); }
  for (const R of M.ROADS) R.pts.forEach((pt, i) => assert.ok(inside(pt, 5), `road ${R.id} point ${i} outside`));
  // (a river may come in from beyond the edge, out of the mountains, and run out to sea: most of it is inside, and none far out)
  for (const W of M.WATERS) if (W.pts) { assert.ok(W.pts.every(pt => inside(pt, -40)), `water ${W.id} far outside`); assert.ok(W.pts.filter(pt => inside(pt)).length >= W.pts.length / 2, `water ${W.id} mostly outside`); }
  for (const [item, place, dx, dz] of M.GATHER_AT) { const [x, z] = M.anchorOf(place); assert.ok(inside([x + dx, z + dz], 5), `a ${item} to pick up outside`); }
  for (const B of M.BRIDGES) assert.ok(inside(B.axis === 'x' ? [B.a0, B.c] : [B.c, B.a0], 5) && inside(B.axis === 'x' ? [B.a1, B.c] : [B.c, B.a1], 5), `bridge ${B.id} outside`);
  for (const id of Object.keys(M.LANDMARK_AT)) assert.ok(inside(M.landmarkAt(id), 5), `landmark ${id} outside`);
  for (const list of [M.SHRINES, M.TOWERS, M.LEAFIES]) for (const s of list) assert.ok(inside(s.at, 5), `${s.id} outside`);
  const [rx, rz] = M.WORLD.rooms; assert.ok(inside([rx, rz], 5), 'the room spot is outside');
});

test('map: a city road ends exactly on one of the city\'s gates (ROAD-007), and every gate is on the city\'s edge', () => {
  const cities = new Map(M.PLACES.filter(p => p.kind === 'city').map(c => [c.id, c]));
  for (const c of cities.values()) for (const [dx, dz] of c.gates) assert.ok(Math.abs(Math.abs(dx) - c.w) < 1e-9 || Math.abs(Math.abs(dz) - c.d) < 1e-9, `${c.id}: a gate off its edge`);
  for (const R of M.ROADS) (R.gates || []).forEach((g, end) => {
    const c = cities.get(g); if (!c) return;
    const [x, z] = end ? R.pts[R.pts.length - 1] : R.pts[0];
    assert.ok(c.gates.some(([dx, dz]) => Math.hypot(c.at[0] + dx - x, c.at[1] + dz - z) < .01), `road ${R.id} does not end on a gate of ${g}`);
  });
});

test('map: saved spots and Studio content belong to a layout (round T migration)', () => {
  assert.equal(typeof M.MAP_VERSION, 'string');
  assert.equal(M.onThisMap(M.MAP_VERSION), true);
  assert.equal(M.onThisMap('an older layout'), false);
  // no stamp means map 'C' (everything saved before round T)
  assert.equal(M.onThisMap(undefined), M.MAP_VERSION === 'C');
  assert.ok(M.LEGACY.C && Object.isFrozen(M.LEGACY.C), 'the old anchors are kept, frozen');
});

test("map: layout 'C' is the valley as it was (round T0 moved nothing)", { skip: M.MAP_VERSION !== 'C' }, () => {
  for (const [id, at] of Object.entries(M.LEGACY.C)) assert.deepEqual(M.anchorOf(id), at, `${id} moved`);
});

// (round T, check `banks`) Concept D: Vietnam on the east bank, Australia on the west, each north to south like the real
// country; Ông Cú, Phố Hai Quê and Sunny Farm on the home island, with the river on both sides
test('banks: Vietnam east of the river, Australia west, north to south; the home island between the river arms', { skip: M.MAP_VERSION === 'C' }, () => {
  const rivers = M.WATERS.filter(w => /^main/.test(w.id));
  // where the river (any arm) crosses the line at z: every x
  const xsAt = z => { const xs = []; for (const r of rivers) for (let i = 0; i < r.pts.length - 1; i++) { const [ax, az] = r.pts[i], [bx, bz] = r.pts[i + 1]; if ((z - az) * (z - bz) <= 0 && az !== bz) xs.push(ax + (bx - ax) * (z - az) / (bz - az)); } return xs; };
  const at = id => M.anchorOf(id);
  const side = (id, east) => { const [x, z] = at(id), xs = xsAt(z); assert.ok(xs.length, `${id}: no river at its latitude`); assert.ok(east ? x > Math.max(...xs) + 30 : x < Math.min(...xs) - 30, `${id} is not on the ${east ? 'east' : 'west'} bank`); };
  const VN = ['hanoi', 'village', 'danang', 'hoian', 'market', 'saigon'], AU = ['brisbane', 'aussie', 'sydney', 'melbourne'];
  [...VN, 'bacninh', 'paddies', 'lake'].forEach(id => side(id, true)); [...AU, 'uluru'].forEach(id => side(id, false));
  const southward = ids => ids.every((id, i) => !i || at(id)[1] > at(ids[i - 1])[1]);
  assert.ok(southward(VN), 'Vietnam is not north to south: ' + VN.join(', '));
  assert.ok(southward(AU), 'Australia is not north to south: ' + AU.join(', '));
  assert.ok(at('bacninh')[1] < at('hanoi')[1] && at('bacninh')[0] > at('hanoi')[0], 'Bắc Ninh is not north-east of Hà Nội (as the Concept D map shows)');
  for (const id of ['plateau', 'town', 'home']) { const [x, z] = at(id), xs = xsAt(z); assert.ok(xs.some(v => v < x) && xs.some(v => v > x), `${id} is not between the river's arms`); }
  // China Town and India Village in the northern mountains; the coast in the south
  for (const id of ['china', 'india']) assert.ok(at(id)[1] < M.WORLD.mountains.z0, `${id} is not in the northern mountains`);
  assert.ok(M.WORLD.coast.z > at('saigon')[1] && M.WORLD.coast.z > at('melbourne')[1], 'the coast is not south of every town');
});
