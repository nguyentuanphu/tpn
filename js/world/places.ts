// Part of the open world (js/world.ts re-exports everything here): map data and places: the places, levels, footprints, rivers, ponds, bridges and roads data.
// (v1.07, owner 2 Nov 2026 AEDT) moved out of js/world.ts unchanged.
import { P } from '../gfx.js';
import { dist2 } from '../util.js';
import { CUSTOM } from '../custom.js';
import * as MAP from '../content/map.js';

// (round T) every position comes from js/content/map.js: the exports below are built from it, so the files that
// import them (VILLAGE, TOWN, CITIES, RIVER, BRIDGE…) need no change, and moving a place there moves everything in it
export const MAP_VERSION = MAP.MAP_VERSION;
// (round T) the family's Studio map content ("world": land, buildings, moves; "npcs": villagers) is stamped with the layout
// it was made on (CUSTOM.world.map; none means 'C'). On a different layout it is put aside (parked), never applied at the
// wrong spot: Studio lists it to place again (G.parked, js/main.js).
export const STUDIO_ON_MAP = MAP.onThisMap(CUSTOM.world && typeof CUSTOM.world === 'object' ? CUSTOM.world.map : null);
export const PARKED = STUDIO_ON_MAP ? null : { map: (CUSTOM.world && CUSTOM.world.map) || 'C', world: CUSTOM.world || null, npcs: CUSTOM.npcs || null };
export const SIZE = MAP.WORLD.size, HALF = SIZE / 2, WATER = MAP.WORLD.water;
// how far a swimming buffalo or cow sits below the water line (its back and head stay above it, and so does the rider)
export const RIDE_SWIM = 1.05;
export const MTN = MAP.WORLD.mountains, EDGE = MAP.WORLD.edge, SADDLES = MAP.SADDLES, RELIEF = MAP.RELIEF, COAST = MAP.WORLD.coast, RAMP = MAP.WORLD.ramp;

// Only nearby ridge segments can change the terrain. The 1.5-width boxes include the full 1.4-width falloff.
export const RELIEF_SEGMENTS = RELIEF.map(R => ({ R, segments: R.pts.slice(0, -1).map(([ax, az], i) => {
  const [bx, bz] = R.pts[i + 1], dx = bx - ax, dz = bz - az, pad = R.w * 1.5;
  return { ax, az, dx, dz, len2: dx * dx + dz * dz, x0: Math.min(ax, bx) - pad, x1: Math.max(ax, bx) + pad, z0: Math.min(az, bz) - pad, z1: Math.max(az, bz) + pad };
}) }));
const PL = id => MAP.PLACES.find(p => p.id === id);
// a circle place { x, z, r, h }, a box place { x, z, x0, x1, z0, z1, h, roadZ }
/** a round place of the map: its middle, and its size and ground height where the map gives them */
type SvCircle = { x: number, z: number, r?: number, h?: number };
const circle = (id: string): SvCircle => { const p = PL(id), [x, z] = MAP.anchorOf(id), o: SvCircle = { x, z }; if (p.r != null) o.r = p.r; if (p.h != null) o.h = p.h; return o; };
const box = id => { const p = PL(id), [x, z] = MAP.anchorOf(id); return { x, z, x0: x - p.w, x1: x + p.w, z0: z - p.d, z1: z + p.d, h: p.h, roadZ: z + p.street.roadZ }; };
export const PLATEAU = circle('plateau');
export const VILLAGE = circle('village');
export const PADDIES = circle('paddies');
export const LAKE = circle('lake');
export const BAMBOO = circle('bamboo');
export const APOSTLES = circle('apostles'); // the Twelve Apostles (js/regionsites.js): kept free of trees
export const ULURU = circle('uluru');
export const HOIAN = circle('hoian');   // Hội An (round T: its landmark for now; the old town comes later)
// the home island in the middle of the river (round T, Concept D): an ellipse round its anchor
export const ISLAND = (() => { const p = PL('island'); return { x: p.at[0], z: p.at[1], rx: p.rx, rz: p.rz }; })();
// festival grounds (js/vnfun.js): the buffalo pushing ring north of Bắc Ninh, the bull-race field west of Sài Gòn; kept free of trees
export const FESTGROUNDS = { choitrau: circle('choitrau'), duabo: circle('duabo') };
export const HOME = circle('home');   // Sunny Farm: house, field, barn and Mr. Bear's market
export const PLAYGROUND = circle('playground');   // the park on Two Homes Street, where kids from Australia and Vietnam play
export const TOWN = box('town');   // Two Homes Street: Bà Rịa meets a Sydney suburb
export const MARKET = box('market');    // Chợ Ba Miền: the Three Regions market (north, central, south Vietnam)
export const AUSSIE = box('aussie'); // Aussie Corner: milk bar, fish and chips, ice-cream van, playground
// Cities around the valley: each a paved square with a welcome gate, landmarks, a game host and food kiosks (js/cities.js)
// gates: where the roads come in (the first is the main gate); the main street runs straight through
/** a city: its square (the corners are added just below), gates and look */
export type SvCity = { id: string, cc: string, x: number, z: number, w: number, d: number, h: number, icon: string, name: unknown, gates: number[][], layout?: { toward: number }, x0?: number, x1?: number, z0?: number, z1?: number };
export const CITIES = MAP.PLACES.filter(p => p.kind === 'city').map((p): SvCity => { const [x, z] = p.at;
  return { id: p.id, cc: p.cc, x, z, w: p.w, d: p.d, h: p.h, icon: p.icon, name: p.name, gates: p.gates.map(([dx, dz]) => [x + dx, z + dz]) }; });
CITIES.forEach(c => Object.assign(c, { x0: c.x - c.w, x1: c.x + c.w, z0: c.z - c.d, z1: c.z + c.d }));
export const FLATS: { x0?: number, x1?: number, z0?: number, z1?: number, h: number, family?: boolean }[] = [TOWN, MARKET, AUSSIE, ...CITIES];
// the places whose ground is one flat level (see the hard rule at the end of heightAt): circles and boxes
type SvLevel = { x?: number, z?: number, r?: number, h: number, x0: number, x1: number, z0: number, z1: number };
export let LEVELS: SvLevel[] = null;
// the level of the village or city at (x, z), or null outside them (roads crossing a place run at its level)
export function levelAt(x, z) { if (LEVELS) for (const A of LEVELS) { if (A.r ? dist2(x, z, A.x, A.z) <= A.r : x >= A.x0 && x <= A.x1 && z >= A.z0 && z <= A.z1) return A.h; } return null; }
// building lots along the roads out of each city (js/suburbs.js builds on them): levelled ground, no trees
export const LOTS = [];
// (round R story) bà Huệ and ông Nghi's yard (js/yard.js): its own levelled plot on the slope behind the north row of
// Two Homes Street, facing the street (+z), clear of the river; nothing else is built on it and no trees grow there
// (round T: an offset from Two Homes Street in the map, so it moves with the street)
export const YARD = (() => { const p = PL('yard'), [x, z] = MAP.anchorOf('yard'); return { x, z, w: p.w, d: p.d, rot: p.rot, h: p.h }; })();
LOTS.push({ city: 'yard', k: 0, ...YARD });
// Level ground under every building, stall and landmark (filled in by levelUnderBuildings once the world is built):
// each one gets a flat patch at the height it was placed at, easing back to the hillside over a few metres, so
// whatever is added later always stands on its own level land. Kept in a 16 m grid so looking one up is quick.
export const FOOTPRINTS = [];
export const FP_GRID = new Map(), fpKey = (i, j) => i * 4096 + j;
export function fpAdd(F) { FOOTPRINTS.push(F); for (let i = Math.floor((F.x0 - F.pad) / 16); i <= Math.floor((F.x1 + F.pad) / 16); i++) for (let j = Math.floor((F.z0 - F.pad) / 16); j <= Math.floor((F.z1 + F.pad) / 16); j++) { const k = fpKey(i, j); if (!FP_GRID.has(k)) FP_GRID.set(k, []); FP_GRID.get(k).push(F); } }
// the rivers (round T: the main river splits round the home island; Sông Hàn comes in from the east), and RIVER, the
// raft's line down the river (js/ferry.js)
export const RIVERS = MAP.WATERS.filter(w => w.kind === 'river').map(w => ({ id: w.id, w: w.w || 1, tone: w.tone || null, pts: w.pts.map(p => p.slice()) }));   // (round T2: w = width against the main river's, tone = a tinted surface)
// (round T2) small round lakes and ponds (Hồ Gươm in Hà Nội, the billabong by Uluru): { id, x, z, r }
export const PONDS = MAP.WATERS.filter(w => w.kind === 'pond').map(w => { const [x, z] = w.at || MAP.anchorOf(w.place).map((v, i) => v + ((w.off || [0, 0])[i])); return { id: w.id, x, z, r: w.r, islet: w.islet || 0, depth: w.depth || 2.4 }; });
// how far (x, z) is from the deep middle of the nearest pond (0 inside it), and which pond
export function pondDist(x, z) { let best = 1e9; PD_NEAR.id = null; for (const P of PONDS) { const dc = dist2(x, z, P.x, P.z); if (dc < P.islet + .8) continue; const d = Math.max(0, dc - P.r * (P.depth < 1.5 ? 1 : .62)); /* (owner, 29 Oct AEDT) a shallow pond's water reaches its radius */ if (d < best) { best = d; PD_NEAR.id = P.id; } } return best; }
export const PD_NEAR = { id: null };
export const RIVER = (() => { const out = []; for (const id of [].concat(MAP.BOATS.find(b => b.id === 'raft').water)) RIVERS.find(r => r.id === id).pts.forEach((p, i) => { if (!(out.length && i === 0)) out.push(p.slice()); }); return out; })();
export const CHINA = circle('china');  // (4.5 m: the road up from Đà Nẵng stays under 8 %)    // China Town: lanterns, tiled roofs, a pagoda and a little Great Wall
export const INDIA = circle('india');  // (5.5 m: the road from the Brisbane junction stays under 8 %)  // India Village: colourful houses, a little Taj Mahal, rangoli and marigolds
LEVELS = [VILLAGE, HOME, CHINA, INDIA].map((C): SvLevel => ({ x: C.x, z: C.z, r: C.r, h: C.h, x0: C.x - C.r, x1: C.x + C.r, z0: C.z - C.r, z1: C.z + C.r }))
  .concat([TOWN, MARKET, AUSSIE, ...CITIES].map((B): SvLevel => ({ h: B.h, x0: B.x0, x1: B.x1, z0: B.z0, z1: B.z1 })));
// Bridges (round T: along the x or the z axis, from the map): { id, axis, a0, a1, c, w, h, … }, plus the old x0/x1/z
// (or z0/z1/x) names. BRIDGE and DRAGON are the two of today, by their old names.
/** a bridge: the map's bridge, its span along its axis, and the bank box worked out the first time it is needed */
export type SvBridge = { id: string, axis: string, a0: number, a1: number, c: number, w: number, h: number, bankOut?: number, over?: string, style?: string,
  name?: string[], landmark?: string, foot?: unknown, x?: number, z?: number, x0?: number, x1?: number, z0?: number, z1?: number, bank?: ReturnType<typeof bridgeBox> };
export const BRIDGES = MAP.BRIDGES.map((B): SvBridge => ({ ...B, ...(B.axis === 'z' ? { z0: B.a0, z1: B.a1, x: B.c } : { x0: B.a0, x1: B.a1, z: B.c }) }));
export const BRIDGE = BRIDGES.find(B => B.id === 'haique');   // the Harbour-style bridge carrying Two Homes Street over the river
export const DRAGON = BRIDGES.find(B => B.id === 'rong');   // Đà Nẵng's golden Dragon Bridge carrying the road east over the river
// along and across a bridge: how far along its axis, and how far off its middle line
export const bridgeAlong = (B, x, z) => B.axis === 'z' ? z : x;
export const bridgeAcross = (B, x, z) => B.axis === 'z' ? x - B.c : z - B.c;
// the bridge at (x, z), if any: within `across` of its middle line and from `before` metres before its start to `after`
// metres past its end (round T: one test for both axes; it used to be written out for each use)
export function bridgeAt(x, z, across = 0, before = 0, after = before) {
  for (const B of BRIDGES) { const u = bridgeAlong(B, x, z); if (Math.abs(bridgeAcross(B, x, z)) < across && u > B.a0 - before && u < B.a1 + after) return B; }
  return null;
}
// distance from (x, z) to a bridge's middle line
export const bridgeDist = (B, x, z) => { const u = bridgeAlong(B, x, z); return Math.hypot(Math.max(B.a0 - u, 0, u - B.a1), bridgeAcross(B, x, z)); };
// the box [x0, x1, z0, z1] covering a bridge from `a` to `b` along it and from `l` to `r` across it
export const bridgeBox = (B, a, b, l, r) => B.axis === 'z' ? { x0: B.c + l, x1: B.c + r, z0: a, z1: b } : { x0: a, x1: b, z0: B.c + l, z1: B.c + r };
// Roads: asphalt roads join every village and city; dirt roads link the quieter places to each other (the map has
// them and says why each runs where it does). Each has an id, a kind, its points and the place at each end (gates).
/** a road or path: its points, and its width, gates, loop and colour where it has them */
export type SvRoad = { id: string, kind: string, pts: number[][], w?: number, gates?: unknown[], loop?: boolean, tone?: string };
