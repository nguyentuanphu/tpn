import { launch, open } from '../../../tests/harness.mjs';
import fs from 'fs';
const b = await launch(); const { page } = await open(b, { w: 1000, h: 700 });
const r = await page.evaluate(async () => {
  const { roadDist } = await import('/js/world.js'); const { PLACES } = await import('/js/content/map.js');
  const G = __sv, W = G.world;
  const pts = G.interactables.filter(i => /^v_|^h_/.test(i.id) && Number.isFinite(i.x)).map(i => ({ id: i.id, x: i.x, z: i.z, walks: !!i.walks }));
  const big = W.boxes.filter(b => (b.x1 - b.x0) * (b.z1 - b.z0) > 7 && !b.room);
  const boxD = (b, x, z) => Math.hypot(Math.max(b.x0 - x, 0, x - b.x1), Math.max(b.z0 - z, 0, z - b.z1));
  const houses = W.colliders.filter(c => c.r >= 1.9);
  const near = (x, z) => { let best = null; for (const P of PLACES.filter(P => P.at && P.kind !== "island" && P.kind !== "lake")) { const d = Math.hypot(P.at[0] - x, P.at[1] - z); if (!best || d < best.d) best = { id: P.id, d }; } return best.id; };
  return pts.map(p => {
    const rd = roadDist(p.x, p.z); const edge = rd.road ? rd.d - rd.road.w / 2 : 99;
    const bld = Math.min(99, ...big.map(b => boxD(b, p.x, p.z)), ...houses.map(c => Math.hypot(c.x - p.x, c.z - p.z) - c.r));
    const nb = Math.min(99, ...pts.filter(q => q !== p).map(q => Math.hypot(q.x - p.x, q.z - p.z)));
    return { place: near(p.x, p.z), id: p.id, edge: +edge.toFixed(1), road: rd.road && rd.road.kind, bld: +bld.toFixed(1), nb: +nb.toFixed(1) };
  });
});
fs.writeFileSync(process.argv[2], JSON.stringify(r, null, 1));
const bad = r.filter(x => x.edge < 1.5 || x.bld < 3 || x.nb < 1.2);
console.log('points', r.length, 'too close', bad.length);
const by = {}; for (const x of r) (by[x.place] ||= []).push(x);
for (const [k, v] of Object.entries(by)) console.log(k.padEnd(9), v.length, 'stalls;', v.filter(x => x.edge < 1.5).length, '<1.5m road edge;', v.filter(x => x.bld < 3).length, '<3m building;', v.filter(x => x.nb < 1.2).length, '<1.2m apart');
await b.close();
