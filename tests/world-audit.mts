// Ground audit: every building and landmark stands on dry, level ground (not over the river, the lake or the sea,
// not floating or sunk), and roads lie on the ground (not buried, not floating, never across water without a bridge).
//   node world-audit.mts   (also run as the "ground" check in run.mts)
import { launch, open, clear } from './harness.mts';
export async function groundAudit(page) {
  return page.evaluate(async () => {
    const W = await import('/js/world.js'), G = __sv, w = G.world, bad = [];
    const named = (x, z) => { let best = null, bd = 9; for (const it of G.interactables) { const d = Math.hypot(it.x - x, it.z - z); if (d < bd) { bd = d; best = it; } } try { return best ? (typeof best.label === 'function' ? best.label({ i: 0, profile: {}, pos: { y: 0 } }) : best.id) : ''; } catch (e) { return best.id || ''; } };
    // (round T: every bridge and every water of the map, by its own axis and id)
    const onBridge = (x, z) => W.BRIDGES.some(B => Math.abs(W.bridgeAcross(B, x, z)) < B.w && W.bridgeAlong(B, x, z) > B.a0 - 4 && W.bridgeAlong(B, x, z) < B.a1 + 4);
    const wetOK = new Set(W.LEAFIES.filter(L => L.inWater).map(L => L.id)); // (a Leafy meant to sparkle over the water)
    const things = [];
    for (const b of w.boxes) if (!b.room && b.x1 - b.x0 < 40 && b.z1 - b.z0 < 40 && b.x1 - b.x0 > 1.2 && b.z1 - b.z0 > 1.2) things.push(['box', b.x0, b.x1, b.z0, b.z1]);
    // (natural boulders scattered over the hills have odd sizes like 2.0377 and may sit on slopes or in streams)
    for (const c of w.colliders) if (c.r >= 2 && c.r <= 12 && Math.abs(c.r * 20 - Math.round(c.r * 20)) < 1e-6) things.push(['col', c.x - c.r * .7, c.x + c.r * .7, c.z - c.r * .7, c.z + c.r * .7]);
    for (const [k, x0, x1, z0, z1] of things) {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      if (onBridge(cx, cz)) continue;
      let lo = 1e9, hi = -1e9, wet = 0, n = 0;
      for (let x = x0; x <= x1 + .01; x += Math.max(.5, (x1 - x0) / 6)) for (let z = z0; z <= z1 + .01; z += Math.max(.5, (z1 - z0) / 6)) {
        const h = W.heightAt(x, z); lo = Math.min(lo, h); hi = Math.max(hi, h); n++;
        if (h < W.WATER + .3 || W.waterAt(x, z, 6)) wet++;
      }
      if (wet) bad.push({ what: 'over water', k, at: [+cx.toFixed(1), +cz.toFixed(1)], size: [+(x1 - x0).toFixed(1), +(z1 - z0).toFixed(1)], wet: `${wet}/${n}`, near: named(cx, cz) });
      else if (hi - lo > 1.6) bad.push({ what: 'uneven ground', k, at: [+cx.toFixed(1), +cz.toFixed(1)], size: [+(x1 - x0).toFixed(1), +(z1 - z0).toFixed(1)], drop: +(hi - lo).toFixed(2), near: named(cx, cz) });
    }
    // roads: compare the ribbon's surface with the ground under it
    const roads = [];
    G.scene.traverse(o => { if (o.userData && o.userData.road && o.geometry) roads.push(o); });
    const rbad = new Map();
    for (const o of roads) {
      const pa = o.geometry.attributes.position; o.updateMatrixWorld(); const e = o.matrixWorld.elements;
      for (let i = 0; i < pa.count; i += 1) {
        const x = pa.getX(i) + e[12], y = pa.getY(i) + e[13], z = pa.getZ(i) + e[14];
        if (onBridge(x, z)) continue;
        const g = W.heightAt(x, z), key = Math.round(x / 6) + ',' + Math.round(z / 6);
        let why = null;
        const row = Math.floor(i / 5), rows = pa.count / 5, endRow = row <= 1 || row >= rows - 2; // a road's last metre may tuck into the ground or under the road it joins
        if (y < g - .25 && !(endRow && y > g - .7)) { // under another road at a junction is fine: that road is drawn on top
          const THREE = G.THREE || (await import('/vendor/three.module.js')); const rc = new THREE.Raycaster(new THREE.Vector3(x, y + 6, z), new THREE.Vector3(0, -1, 0)); const hit = rc.intersectObjects(roads.filter(r => r !== o), false)[0];
          if (!hit || hit.point.y < y) why = 'road buried'; }
        else if (y > g + 1.4) why = 'road floating';
        else if (g < W.WATER + .2 || W.waterAt(x, z, 4.5) === 'main') why = 'road in water';
        if (why && !rbad.has(key)) rbad.set(key, { what: why, at: [+x.toFixed(1), +z.toFixed(1)], road: o.name || '', dy: +(y - g).toFixed(2) });
      }
    }
    // the boats stay on the water, and nothing you can tap stands in it (the sparkle in the middle of the lake is meant to be there)
    if (G.ferries) G.ferries.ferries.forEach((F, fi) => { const n = F.path.length; for (let i = 0; i < (F.loop ? n : n - 1); i++) { const a = F.path[i], c = F.path[(i + 1) % n]; for (let t = 0; t < 1; t += .1) { const x = a.x + (c.x - a.x) * t, z = a.z + (c.z - a.z) * t; if (W.heightAt(x, z) > W.WATER - .3 && Math.hypot(x - a.x, z - a.z) > 3 && Math.hypot(x - c.x, z - c.z) > 3) { bad.push({ what: 'boat route over land', ferry: fi, at: [+x.toFixed(1), +z.toFixed(1)] }); return; } } } });
    for (const it of G.interactables) if (!/^ferry|^fish|^g\d|^wr/.test(it.id) && !wetOK.has(it.id) && W.heightAt(it.x, it.z) < W.WATER + .3 && !(G.world.platforms || []).some(p => !p.tower && it.x > p.x0 && it.x < p.x1 && it.z > p.z0 && it.z < p.z1)) bad.push({ what: 'tap spot in water', id: it.id, at: [+it.x.toFixed(1), +it.z.toFixed(1)] });
    return { buildings: things.length, bad, roads: roads.length, roadBad: [...rbad.values()] };
  });
}
if (process.argv[1] && process.argv[1].endsWith('world-audit.mts')) {
  const b = await launch(); const P = await open(b, { w: 900, h: 700 }); await clear(P.page);
  const r = await groundAudit(P.page);
  console.log(JSON.stringify({ buildings: r.buildings, roads: r.roads, problems: r.bad.length, roadProblems: r.roadBad.length }));
  for (const x of r.bad) console.log(JSON.stringify(x));
  for (const x of r.roadBad.slice(0, 80)) console.log(JSON.stringify(x));
  await b.close();
}
