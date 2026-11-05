// Sparkle Valley checks: The valley and the map: roads, water, bridges, places, riding and the camera.
// Run them through tests/run.mts (node run.mts <check>) or tests/suite.mts, not on their own.
// Moved unchanged from tests/run.mts (v1.07 split-tests, 2 Nov 2026 AEDT); see tests/checks/README.md.
import { fs, open, clear, start, groundAudit, sampled, only, want, check, ok, b, ownerSmoke } from './shared.mts';

await check('camera', async () => {
  // at every landmark sign, facing four ways, the camera must not end up inside a building
  const P = await open(b, { w: 800, h: 600 }); await clear(P.page);
  const stuck = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], R = await import('/js/regions.js'), THREE = (await import('/vendor/three.module.js'));
    const out = [], ray = new THREE.Raycaster();
    for (const lm of R.LANDMARKS) for (const yaw of [0, 1.57, 3.14, 4.71]) {
      h.place(lm.x, lm.z); h.camYaw = yaw; h.camPos = h.camPos || h.cam.position.clone();
      for (let k = 0; k < 39; k++) h.finish(.05, k * .05, G, 0);
      G.seeThrough.marked.clear(); h.finish(.05, 2, G, 0); // (bug #33) the things in the way on the last frame
      const c = h.cam.position, inBox = G.world.boxes.some(b => c.x > b.x0 && c.x < b.x1 && c.z > b.z0 && c.z < b.z1 && c.y < G.world.groundAt(c.x, c.z) + 6);
      const to = new THREE.Vector3(h.pos.x, h.pos.y + 1.2, h.pos.z), d = to.clone().sub(c); const L = d.length(); ray.set(c, d.normalize()); ray.far = L - .6;
      const hit = ray.intersectObjects(G.camBlockers(), false)[0];
      // (bug #33) the camera stays where it is, so a house in the way is fine as long as it is fading to see-through
      const fades = hit ? G.seeThrough.marked.has(G.seeThrough.rootOf(hit.object)) : G.seeThrough.marked.size > 0;
      if ((inBox || hit) && !fades) out.push(lm.id + '@' + yaw);
    }
    // (bug #33) next to a landmark the thing in the way really turns see-through, the camera keeps its distance, and
    // everything goes back to solid once the way is clear
    const S = G.seeThrough; let fade = null;
    for (const lm of R.LANDMARKS) {
      h.place(lm.x, lm.z);
      for (const yaw of [0, 1.57, 3.14, 4.71]) {
        h.camYaw = yaw; for (let k = 0; k < 60; k++) { h.finish(.05, k * .05, G, 0); S.step(.05); }
        if (S.active()) { fade = { lm: lm.id, yaw }; break; }
      }
      if (fade) break;
    }
    let seen = null, back = null;
    if (fade) {
      seen = S.active(); h.finish(.05, 9, G, 0); S.step(1);
      let minOp = 1; G.scene.traverse(o => { if (o.isMesh && o.material && !Array.isArray(o.material) && o.material.transparent && o.material.opacity < minOp && o.material.depthWrite === false && o.material.opacity > 0) minOp = o.material.opacity; });
      const dist = h.cam.position.distanceTo(h.pos);
      h.place(0, -230); for (let k = 0; k < 60; k++) { h.finish(.05, k * .05, G, 0); S.step(.05); }
      back = { minOp, dist, left: S.active() };
    }
    return { n: R.LANDMARKS.length * 4, stuck: out, fade, seen, back };
  });
  await P.ctx.close();
  ok(stuck.fade && stuck.seen > 0, 'nothing turned see-through next to any landmark');
  ok(stuck.back.minOp <= .3 && stuck.back.left === 0, 'see-through ' + JSON.stringify(stuck.back));
  ok(stuck.stuck.length <= Math.ceil(stuck.n * .03), `${stuck.stuck.length}/${stuck.n} blocked: ${stuck.stuck.join(', ')}`);
  return `${stuck.n - stuck.stuck.length}/${stuck.n} clear${stuck.stuck.length ? ' (grazing: ' + stuck.stuck.join(', ') + ')' : ''}`;
});

await check('roads', async () => {
  // every village and city is reached by road, a gate stands on every named road end, and nothing stands on a road
  const P = await open(b, { w: 800, h: 600 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), G = window.__sv, out = [];
    const near = (x, z, rr) => { const d = W.roadDist(x, z); return d.d < d.road.w / 2 + rr; };
    for (const c of G.world.colliders) if (c.r > .45 && near(c.x, c.z, c.r - .3)) out.push(`collider ${c.x.toFixed(1)},${c.z.toFixed(1)} r${c.r}`);
    for (const bx of G.world.boxes) { const x = (bx.x0 + bx.x1) / 2, z = (bx.z0 + bx.z1) / 2; if (near(x, z, Math.min(bx.x1 - bx.x0, bx.z1 - bx.z0) / 2)) out.push(`box ${x.toFixed(1)},${z.toFixed(1)}`); }
    for (const i of G.interactables) if (Number.isFinite(i.x) && !i.walks && near(i.x, i.z, -.5)) out.push(`thing ${i.id}`);
    const named = new Set(W.ROADS.flatMap(R => (R.gates || []).filter(Boolean)));
    const missing = W.CITIES.map(c => c.id).filter(id => !named.has(id));
    // ROAD-007 (Round U, owner: "one gate is enough"): one welcome gate per place, a city's on its main gate
    const built = G.world.gates || [], gates = built.length;
    for (const id of named) { const mine = built.filter(g => g.place === id); if (mine.length !== 1) out.push(`${id} has ${mine.length} welcome gates`); }
    for (const c of W.CITIES) { const g = built.find(q => q.place === c.id); if (g && Math.hypot(g.x - c.gates[0][0], g.z - c.gates[0][1]) > 1.5) out.push(`${c.id}'s gate is not on its main road`); }
    // R5: a side road that ends on another road's middle leaves it at 60–120° (not a shallow fork laid over it);
    // an end that simply carries on from another road's end (asphalt turning into a dirt lane) is not a junction
    const angles = [], straights = [], seg = (pts, x, z) => { let bd = 1e9, bi = 0; for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))), d = Math.hypot(x - ax - dx * t, z - az - dz * t); if (d < bd) { bd = d; bi = i; } } return { d: bd, i: bi }; };
    W.ROADS.forEach((R, k) => [0, 1].forEach(end => {
      if ((R.gates || [])[end]) return;
      const pts = end ? R.pts.slice().reverse() : R.pts, [x, z] = pts[0];
      for (const O of W.ROADS) { if (O === R) continue; const q = seg(O.pts, x, z); if (q.d > 1.5) continue;
        if ([O.pts[0], O.pts[O.pts.length - 1]].some(e => Math.hypot(e[0] - x, e[1] - z) < 3)) continue; // carries on from that road's end
        let j = 1; while (j < pts.length - 1 && Math.hypot(pts[j][0] - x, pts[j][1] - z) < 4) j++;
        const ux = pts[j][0] - x, uz = pts[j][1] - z, [ax, az] = O.pts[q.i], [bx, bz] = O.pts[q.i + 1];
        const a = Math.acos(Math.abs(ux * (bx - ax) + uz * (bz - az)) / (Math.hypot(ux, uz) * Math.hypot(bx - ax, bz - az) || 1)) * 180 / Math.PI;
        angles.push(Math.round(a)); if (a < 60) out.push(`road ${k} leaves another at ${a.toFixed(0)}° at ${x.toFixed(0)},${z.toFixed(0)}`);
        // …and runs straight at least 6 m before it bends (heading within 3° of its first stretch)
        const h0 = Math.atan2(pts[1][1] - z, pts[1][0] - x); let run = 0;
        for (let i = 1; i < pts.length; i++) { const h = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]); let dh = Math.abs(h - h0); if (dh > Math.PI) dh = 2 * Math.PI - dh; if (dh > .052) break; run += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); }
        const whole = run >= Math.hypot(pts[pts.length - 1][0] - x, pts[pts.length - 1][1] - z) - .1; if (!whole) straights.push(Math.round(run)); if (run < 5.9 && run < Math.hypot(pts[pts.length - 1][0] - x, pts[pts.length - 1][1] - z) - .1) out.push(`road ${k} bends only ${run.toFixed(1)} m after leaving another at ${x.toFixed(0)},${z.toFixed(0)}`); }
    }));
    // G5/R4: no grass tuft or flower on a road
    const cover = G.world.groundCover; if (!cover) out.push('world.groundCover missing'); let tufts = 0;
    if (cover) { const m = new (await import('/js/gfx.js')).THREE.Matrix4(); for (const im of cover) for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m); const x = m.elements[12], z = m.elements[14], d = W.roadDist(x, z); tufts++; if (d.d < d.road.w / 2 + .3) out.push(`grass on a road at ${x.toFixed(1)},${z.toFixed(1)}`); } }
    // (Round U, owner: "weeds still grow inside the asphalt road") nothing that grows or lies on the ground (every repeated
    // small thing: grass, flowers, bushes, rocks) stands on a road or a place's paved street (W.edgeDist)
    { const THREE = (await import('/js/gfx.js')).THREE, m4 = new THREE.Matrix4(), v = new THREE.Vector3(), sz = new THREE.Vector3(); let seen = 0;
      G.scene.traverse(o => { if (!o.isInstancedMesh || o.userData.onRoad) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); g.boundingBox.getSize(sz); if (sz.x > 3 || sz.z > 3 || sz.y > 4) return;
        for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); v.setFromMatrixPosition(m4).applyMatrix4(o.matrixWorld); seen++; if (W.edgeDist(v.x, v.z) < -.1) { out.push(`something growing on a road or street at ${v.x.toFixed(0)},${v.z.toFixed(0)}`); break; } } });
      if (seen < 1000) out.push('only ' + seen + ' small things looked at'); }
    // roadDist skips far roads by their boxes: the same answers as looking at every road, and faster
    let diff = 0, seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, brute = (x, z) => { let bd = 1e9, br = null; for (const R of W.ROADS) for (let i = 0; i < R.pts.length - 1; i++) { const [ax, az] = R.pts[i], [bx, bz] = R.pts[i + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))), d = Math.hypot(x - ax - dx * t, z - az - dz * t); if (d < bd) { bd = d; br = R; } } return { d: bd, road: br }; };
    const pts = Array.from({ length: 20000 }, () => [(rnd() - .5) * W.SIZE, (rnd() - .5) * W.SIZE]);
    for (const [x, z] of pts) { const a = W.roadDist(x, z), c = brute(x, z); if (Math.abs(a.d - c.d) > 1e-9 || a.road !== c.road) diff++; }
    let t0 = performance.now(); for (const [x, z] of pts) W.roadDist(x, z); const fast = performance.now() - t0; t0 = performance.now(); for (const [x, z] of pts) brute(x, z); const slow = performance.now() - t0;
    if (diff) out.push(`roadDist differs from the full search at ${diff} of 20000 points`);
    return { out: out.slice(0, 12), n: out.length, missing, gates, places: named.size, angles, straights, tufts, speed: +(slow / fast).toFixed(1) };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.out.length && !r.missing.length && r.gates === r.places && r.places >= 12 && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.gates} welcome gates, one per village and city (on its main road), every city on a road, nothing standing on a road; ${r.angles.length} side-road junctions all 60–120° (smallest ${Math.min(...r.angles)}°) and straight ≥ 6 m before any bend (shortest ${Math.min(...r.straights)} m; short straight stubs into a gate aside); ${r.tufts} grass tufts and flowers, none on a road; roadDist ×${r.speed} faster, same answers at 20,000 points`;
});

await check('flat', async () => {
  // HARD RULE: every village, town and city is one flat level (rivers, the lake, bridge ramps, road surfaces and
  // a building's own base pad aside)
  const P = await open(b, { w: 700, h: 500 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), bad = [];
    // (round T: every village, town and city in the map, js/content/map.js)
    const M = await import('/js/content/map.js');
    const areas = M.PLACES.filter(p => ['village', 'street', 'city'].includes(p.kind)).map(p => { const [x, z] = M.anchorOf(p.id);
      return p.r != null ? { id: p.id, x0: x - p.r, x1: x + p.r, z0: z - p.r, z1: z + p.r, circ: { x, z, r: p.r }, h: p.h } : { id: p.id, x0: x - p.w, x1: x + p.w, z0: z - p.d, z1: z + p.d, h: p.h }; });
    let n = 0;
    for (const A of areas) for (let x = A.x0 + 3; x <= A.x1 - 3; x += 1.5) for (let z = A.z0 + 3; z <= A.z1 - 3; z += 1.5) {
      if (A.circ && Math.hypot(x - A.circ.x, z - A.circ.z) > A.circ.r - 3) continue;
      if (W.riverDist(x, z) < 14 || Math.hypot(x - W.LAKE.x, z - W.LAKE.z) < W.LAKE.r + 6 || W.bridgeAt(x, z, 10, 13, 19)) continue;
      const h = W.heightAt(x, z); if (h < W.WATER + .5) continue; n++;
      if (Math.abs(h - A.h) <= .25) continue;
      const rd = W.roadDist(x, z); if (rd.d < rd.road.w / 2 + .5) continue;
      if (W.FOOTPRINTS.some(F => x >= F.x0 - F.pad && x <= F.x1 + F.pad && z >= F.z0 - F.pad && z <= F.z1 + F.pad)) continue;
      bad.push(`${A.id} ${x.toFixed(0)},${z.toFixed(0)} ${h.toFixed(2)}≠${A.h}`);
    }
    return { n, bad, places: areas.length };
  });
  await P.ctx.close();
  ok(!r.bad.length, r.bad.slice(0, 12).join('; ') + (r.bad.length > 12 ? ` (+${r.bad.length - 12})` : ''));
  return `${r.n} spots in ${r.places} villages and cities, all level`;
});

await check('roadshape', async () => {
  // HARD RULE: roads are straight or perfectly curved (no step turns more than 8°), never steeper than the owner's R3
  // (asphalt 8 %, dirt 12 %: ROAD_GRADE in roads.js, no allowance anywhere), and every change of slope is rounded
  // (a place too high for its road is lowered, never the rule loosened)
  const P = await open(b, { w: 700, h: 500 }); await clear(P.page);
  const r = await P.page.evaluate(() => { const bad = []; let len = 0;
    __sv.world.roadLines.forEach((L, k) => { const G = ({ asphalt: .08, dirt: .12, footpath: .15 }[L.kind] || .12) + .002; // (+0.2 % for rounding the sampled heights)
      for (let i = 1; i < L.ys.length; i++) { const d = Math.hypot(L.pts[i][0] - L.pts[i - 1][0], L.pts[i][1] - L.pts[i - 1][1]); len += d; const g = Math.abs(L.ys[i] - L.ys[i - 1]) / (d || 1);
        if (g > G && !L.deck[i]) bad.push(`road ${k} steep ${(g * 100).toFixed(0)}% at ${L.pts[i].map(v => v.toFixed(0))}`);
        if (i < L.ys.length - 1) { const s1 = L.ys[i] - L.ys[i - 1], s2 = L.ys[i + 1] - L.ys[i]; if (Math.abs(s2 - s1) > .16 && !L.deck[i]) bad.push(`road ${k} kink ${Math.abs(s2 - s1).toFixed(2)} at ${L.pts[i].map(v => v.toFixed(0))}`);
          const a1 = Math.atan2(L.pts[i][1] - L.pts[i - 1][1], L.pts[i][0] - L.pts[i - 1][0]), a2 = Math.atan2(L.pts[i + 1][1] - L.pts[i][1], L.pts[i + 1][0] - L.pts[i][0]); let t = Math.abs(a2 - a1); if (t > Math.PI) t = 2 * Math.PI - t;
          if (t * 180 / Math.PI > 8) bad.push(`road ${k} turns ${(t * 180 / Math.PI).toFixed(0)}° at ${L.pts[i].map(v => v.toFixed(0))}`); } } });
    return { bad, len }; });
  await P.ctx.close();
  ok(!r.bad.length, r.bad.slice(0, 10).join('; '));
  return `${Math.round(r.len)} m of road: straight or smoothly curved, never steeper than 8 % (dirt 12 %), rounded`;
});

await check('solid', async () => {
  // nobody walks through houses and things (js/solids.js), on a desktop and on a phone side by side:
  // · walking straight at 250 solid spots that have no round or box collider of their own never gets inside
  // · everything you can tap still has open ground to stand on within reach
  // · the second start uses the saved map
  const D = await open(b, { w: 1180, h: 760 }), M = await open(b, { w: 390, h: 760, touch: true, lang: 'vi' });
  const audit = P => P.page.evaluate(async () => {
    const G = __sv, W = G.world, st = await G.solidsReady, N = Math.round(Math.sqrt(W.solid.length)), H = N / 4, bad = []; // the grid's size comes from the valley (round T: 480 m)
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const covered = (x, z) => W.colliders.some(c => Math.hypot(c.x - x, c.z - z) < c.r) || W.boxes.some(b => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1);
    const cells = []; for (let k = 0; k < N * N; k++) if (W.solid[k]) cells.push(k);
    let tried = 0;
    for (let n = 0; n < 4000 && tried < 250; n++) {
      const k = cells[Math.floor(rnd() * cells.length)], cx = (k % N) * .5 - H + .25, cz = Math.floor(k / N) * .5 - H + .25;
      if (covered(cx, cz)) continue;
      const an = rnd() * Math.PI * 2, sx = cx + Math.cos(an) * 3, sz = cz + Math.sin(an) * 3;
      const p = { x: sx, z: sz, y: W.groundAt(sx, sz) }, q = { ...p }; W.collide(q, .45); if (Math.hypot(q.x - p.x, q.z - p.z) > .01) continue; // start on open ground
      tried++;
      for (let s = 0; s < 40; s++) { const dx = cx - p.x, dz = cz - p.z, d = Math.hypot(dx, dz) || 1; p.x += dx / d * .15; p.z += dz / d * .15; W.collide(p, .45); p.y = W.groundAt(p.x, p.z, p.y + 1); }
      if (W.solidAt(p.x, p.z, p.y)) bad.push(`walked into ${cx.toFixed(1)},${cz.toFixed(1)}`);
    }
    let lost = 0; const lostAt = [];
    for (const it of G.interactables) {
      if (!Number.isFinite(it.x) || (it.y != null && it.y > 100)) continue;
      let found = false;
      for (let r = 0; r < (it.r || 2.5) - .2 && !found; r += .4) for (let s = 0; s < 16 && !found; s++) { const an = s / 16 * Math.PI * 2, p = { x: it.x + Math.cos(an) * r, z: it.z + Math.sin(an) * r }; p.y = W.groundAt(p.x, p.z); const q = { ...p }; W.collide(q, .45); if (Math.hypot(q.x - p.x, q.z - p.z) < .05) found = true; }
      if (!found) { lost++; lostAt.push(it.id); }
    }
    // (Full run 37, 16 Oct) the daily gift moves to another landmark each day: every day's spot, not only today's
    const reach = (x, z, R) => { for (let r = 0; r < R - .2; r += .4) for (let s = 0; s < 16; s++) { const an = s / 16 * Math.PI * 2, p = { x: x + Math.cos(an) * r, z: z + Math.sin(an) * r }; p.y = W.groundAt(p.x, p.z); const q = { ...p }; W.collide(q, .45); if (Math.hypot(q.x - p.x, q.z - p.z) < .05) return true; } return false; };
    const giftDays = []; if (G.giftSpotFor) for (let d = 0; d < 120; d++) { const g = G.giftSpotFor(d); if (g && !reach(g.x, g.z, 2.4)) giftDays.push(`${g.L.id || g.L.name || d}`); }
    if (giftDays.length) { lost += giftDays.length; lostAt.push(...[...new Set(giftDays)].map(n => 'gift_today at ' + n)); }
    return { st, tried, bad, lost, lostAt: lostAt.slice(0, 8), giftChecked: !!G.giftSpotFor };
  });
  const rd = await audit(D); console.log('  solid: desktop', JSON.stringify(rd.st)); const rm = await audit(M); console.log('  solid: phone', JSON.stringify(rm.st)); // one after the other: two software-drawn worlds at once are very slow
  await M.page.reload(); await start(M.page); await clear(M.page); console.log('  solid: phone restarted'); const again = await M.page.evaluate(async () => (await __sv.solidsReady).cached);
  const errs = D.errors.concat(M.errors); await D.ctx.close(); await M.ctx.close();
  for (const [r, tag] of [[rd, 'desktop'], [rm, 'phone']]) {
    ok(r.st.cells > 20000, `${tag}: solid map too small (${r.st.cells} cells)`);
    ok(r.tried >= 200, `${tag}: only ${r.tried} spots tried`);
    ok(!r.bad.length, `${tag}: ${r.bad.slice(0, 8).join('; ')} (${r.bad.length}/${r.tried})`);
    ok(!r.lost, `${tag}: ${r.lost} things you tap have no open ground near them: ${r.lostAt.join(', ')}`);
    ok(r.giftChecked, `${tag}: the daily gift's spots for every day were not checked`);
  }
  ok(rd.st.cells === rm.st.cells, `desktop and phone maps differ (${rd.st.cells} vs ${rm.st.cells})`);
  ok(again, 'the saved map was not used on the second start');
  ok(!errs.length, errs.join(' | '));
  return `${rd.st.cells} solid cells from ${rd.st.meshes} objects (${rd.st.work} ms work); ${rd.tried} walk-ins stopped on desktop and phone; saved map reused`;
});

await check('ground', async () => {
  // every building on dry, level ground (not over the river or the lake), no road floating, buried or in water,
  // and the build number in the game matches the service worker's version
  const T0 = await open(b, { w: 900, h: 700, play: false });
  const title = await T0.page.waitForSelector('.tt-build', { state: 'attached', timeout: 30000 }).then(e => e.textContent()).catch(() => ''); await T0.ctx.close();
  const P = await open(b, { w: 900, h: 700 }); await clear(P.page);
  const r = await groundAudit(P.page);
  const { build, shown } = await P.page.evaluate(async () => { const m = await import('/js/build.js'); return { build: m.BUILD, shown: m.SHOWN }; });
  const sw = fs.readFileSync(new globalThis.URL('../../sw.js', import.meta.url), 'utf8'), ver = /VERSION = '([^']+)'/.exec(sw)[1];
  await P.ctx.close();
  ok(!r.bad.length && !r.roadBad.length, 'problems: ' + JSON.stringify([...r.bad, ...r.roadBad].slice(0, 6)));
  ok(ver.endsWith('-' + build), `build ${build} does not match sw.js VERSION ${ver}`);
  // (owner, 24 Oct AEDT) families see the public number (v1, v1.1 ...), never the round count
  ok(/^v\d{1,2}\.\d{2}$/.test(build) && shown === build, `BUILD ${build} must be v, a number, a point and two digits (v1.01), and SHOWN ${shown} the same`);
  ok(title.trim() === shown, `the title screen shows "${title}", not the public number ${shown}`);
  return `${r.buildings} buildings and ${r.roads} roads checked, build ${build}, shown as ${shown}`;
});

await check('village', async () => {
  // Phase 2, Lotus Village (js/lotus.js): footpaths as a road class (R1 1.6 m), the pond path 1.5–2.5 m from the water
  // (R11) ending at a bench, the well, the shrine at the banyan's foot, the basket boat, hens and a dog that never
  // step on a path, and a bicycle and a buffalo cart at walking pace that wait for a child in front of them
  const P = await open(b, { w: 800, h: 600 }); await clear(P.page);
  await P.page.evaluate(async () => { const V = (await import('/js/world.js')).VILLAGE; __sv.heroes[0].place(V.x - 10, V.z + 14); }); await P.page.waitForTimeout(1500); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), G = __sv, out = [], V = W.VILLAGE, pond = [V.x - 10, V.z + 4];
    const paths = W.ROADS.filter(R => R.kind === 'footpath');
    if (paths.length < 2 || paths.some(R => R.w !== 1.6)) out.push('footpaths missing or not 1.6 m');
    const pp = W.ROADS.find(R => R.id === 'lv_pond').pts.slice(3), gap = pp.map(([x, z]) => Math.hypot(x - pond[0], z - pond[1]) - 5.2 - .8); // (the path's inner edge to the water; past the joint with the lane)
    if (gap.some(g => g < 1.5 - .05 || g > 2.5 + .05)) out.push('pond path not 1.5–2.5 m from the water: ' + Math.min(...gap).toFixed(2) + '–' + Math.max(...gap).toFixed(2));
    const ids = ['lv_well', 'lv_shrine', 'lv_bench'], its = ids.map(id => G.interactables.find(i => i.id === id));
    its.forEach((it, k) => { if (!it) out.push('missing ' + ids[k]); });
    const L = G.lotus; if (!L || L.animals.length < 5 || L.movers.length < 2) out.push('animals or riders missing');
    // tap reactions say their line
    let said = 0; const keep = G.lotus.lines; for (const k of ['well', 'shrine', 'bench', 'boat', 'hen', 'dog', 'bike', 'cart']) if (keep[k] && keep[k][0] && keep[k][1]) said++;
    // let the animals wander and the riders ride for a while; nobody steps on a path or goes too fast
    let worst = 1e9, fastest = 0; const last = L.movers.map(m => m.s);
    for (let k = 0; k < 16; k++) { await new Promise(r => setTimeout(r, 500));
      for (const a of L.animals) { const d = W.roadDist(a.m.position.x, a.m.position.z); worst = Math.min(worst, d.d - d.road.w / 2); }
      L.movers.forEach((m, i) => { fastest = Math.max(fastest, Math.abs(m.s - last[i]) / .5); last[i] = m.s; }); }
    // the bicycle stays on its footpath
    const bk = L.movers[0].o.position, onPath = W.roadDist(bk.x, bk.z);
    return { out, said, worst: +worst.toFixed(2), fastest: +fastest.toFixed(2), bikeOn: onPath.road.kind + ' ' + onPath.d.toFixed(2), gap: Math.min(...gap).toFixed(1) + '–' + Math.max(...gap).toFixed(1) };
  });
  // a child 2.5 m in front of the bicycle: it waits
  const waits = await P.page.evaluate(async () => { const G = __sv, m = G.lotus.movers[0], h = G.heroes[0]; m.wait = 0; await new Promise(r => setTimeout(r, 800)); const o = m.o.position; h.place(o.x + Math.sin(m.dyaw) * 2.5, o.z + Math.cos(m.dyaw) * 2.5); const s0 = m.s; await new Promise(r => setTimeout(r, 2500)); return { waiting: m.waiting, moved: +Math.abs(m.s - s0).toFixed(2) }; });
  const errs = P.errors; await P.ctx.close();
  ok(!r.out.length && r.said === 8 && r.worst > .9 && r.fastest <= 1.05 && /^footpath/.test(r.bikeOn) && waits.waiting && waits.moved < .05 && !errs.length, JSON.stringify({ r, waits, errs }));
  return `footpaths 1.6 m, the pond path's edge ${r.gap} m from the water, ending at a bench; well, shrine, bench, boat, hens, dog, bicycle and cart all speak both languages; animals stayed ≥ ${r.worst} m off the paths; riders ≤ ${r.fastest} m/s; the bicycle waited for a child in front of it`;
});

await check('worldplacement', async () => (await import('../world-placement.mts')).worldPlacementCheck(b));

await check('stalls', async () => {
  // (T1b tidy streets, owner 11 Oct) STALL-001…004 (js/validate.js): every stall, kiosk, van and tent 1.5 m off a road's
  // or street's edge and 3 m from buildings, 1.2 m between neighbours, facing its street with the tap spot in front, in
  // its place's one market row; walking sellers on the footpath. Every seller a child can tap is in the list it checks.
  const P = await open(b, { w: 700, h: 500 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, W = G.world, out = (await import('/js/validate.js')).validateWorld(G).filter(p => /^STALL-/.test(p.rule));
    const known = new Set([...W.stalls.map(s => s.tap), ...W.walks.map(w => w.id)]);
    const missing = G.interactables.filter(i => /^(v_|hk_)/.test(i.id) && !known.has(i.id)).map(i => i.id);
    const by = {}; for (const s of W.stalls) by[s.place] = (by[s.place] || 0) + 1;
    return { out, missing, by, n: W.stalls.length, walks: W.walks.length };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.out.length && !r.missing.length && r.n >= 40 && r.walks >= 5 && !errs.length, `${r.out.length} problems: ${r.out.map(p => p.rule + ' ' + p.msg).join(' | ')} | not listed: ${r.missing.join(', ')} ${JSON.stringify(errs)}`);
  return `${r.n} stalls, kiosks and shop fronts in ${Object.keys(r.by).length} places, ${r.walks} walking sellers: STALL-001…004 hold`;
});

await check('signs', async () => {
  // (round T4b, finding your way) a picture signpost at every junction of two asphalt or dirt roads (found from the road
  // data, never written-down positions); every board names a real place; posts stand off the road and are solid; all the
  // signposts together are two meshes (one shared board picture, at most 1024 px)
  const P = await open(b, { w: 1180, h: 760 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const S = __sv.signposts, SP = await import('/js/signposts.js'), W = await import('/js/world.js'), J = SP.findJunctions();
    const names = new Set([...__sv.PLACES, ...__sv.LANDMARKS].map(p => p.name()));
    const missing = J.filter(j => !S.posts.some(s => Math.hypot(s.x - j.x, s.z - j.z) < 14)).map(j => `${Math.round(j.x)},${Math.round(j.z)}`);
    const bad = S.posts.flatMap(s => s.boards.filter(b => !names.has(b.place.name())).map(b => b.place.name()));
    const onRoad = S.posts.filter(s => { const q = W.roadDist(s.x, s.z); return q.road && q.d < q.road.w / 2 + .8; }).map(s => `${Math.round(s.x)},${Math.round(s.z)}`);
    const solid = S.posts.filter(s => !__sv.world.colliders.some(c => Math.hypot(c.x - s.x, c.z - s.z) < .1)).length;
    const img = S.texture.image;
    return { junctions: J.length, posts: S.posts.length, boards: S.posts.reduce((a, s) => a + s.boards.length, 0), empty: S.posts.filter(s => !s.boards.length).length,
      missing, bad, onRoad, solid, meshes: S.meshes.length, tex: Math.max(img.width, img.height) };
  });
  ok(r.junctions >= 10 && !r.missing.length, `junctions without a signpost: ${r.missing.join('; ')} (of ${r.junctions})`);
  ok(!r.bad.length && !r.empty, `boards naming no real place: ${r.bad.join(', ')}; posts with no board: ${r.empty}`);
  ok(!r.onRoad.length, 'signposts on the road: ' + r.onRoad.join('; '));
  ok(!r.solid, `${r.solid} signposts a child can walk through`);
  ok(r.meshes <= 2 && r.tex <= 1024, `signposts cost ${r.meshes} meshes, board picture ${r.tex} px`);
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  return `${r.posts} signposts at ${r.junctions} junctions, ${r.boards} boards, each naming a real place; off the road, solid; ${r.meshes} meshes, one ${r.tex} px picture`;
});

await check('nametags', async () => {
  // (round T4b) names float over the places nearby: at most 4 at once, never covering each other, on a phone, a tablet
  // and a computer; none in calm mode
  const out = [];
  for (const [w, h, touch, tag] of [[390, 844, true, 'phone'], [820, 1180, true, 'tablet'], [1180, 760, false, 'computer']]) {
    const P = await open(b, { w, h, touch }); await clear(P.page);
    // the busiest spot: the place with the most places and landmarks within 40 m
    await P.page.evaluate(() => { const all = [...__sv.PLACES, ...__sv.LANDMARKS], n = p => all.filter(o => Math.hypot(o.x - p.x, o.z - p.z) < 40).length;
      const best = all.slice().sort((a, b) => n(b) - n(a))[0]; window.__busy = best.name(); __sv.travelTo(__sv.heroes[0], best.x + 6, best.z + 14); });
    await P.page.waitForTimeout(5000);
    const r = await P.page.evaluate(() => { const on = [...document.querySelectorAll('.nametag.on')].map(e => e.getBoundingClientRect());
      const over = []; on.forEach((a, i) => on.slice(i + 1).forEach(q => { if (a.left < q.right && q.left < a.right && a.top < q.bottom && q.top < a.bottom) over.push(i); }));
      return { n: on.length, over: over.length, busy: window.__busy, names: [...document.querySelectorAll('.nametag.on')].map(e => e.textContent) }; });
    ok(r.n >= 1 && r.n <= 4, `${tag}: ${r.n} name tags at ${r.busy} (want 1 to 4)`);
    ok(!r.over, `${tag}: name tags overlap: ${r.names.join(', ')}`);
    await P.page.evaluate(async () => { const st = await import('/js/state.js'); st.settings.calm = true; });
    await P.page.waitForTimeout(1500);
    const calm = await P.page.evaluate(() => document.querySelectorAll('.nametag.on').length);
    ok(!calm, `${tag}: ${calm} name tags in calm mode`);
    ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
    out.push(`${tag} ${r.n} (${r.names.join(', ')})`);
  }
  return 'at most 4, apart, none in calm mode: ' + out.join('; ');
});

await check('mapnames', async () => {
  // (Release requests, round T1) the Pad map's names never cover each other (the festival stage lay over Đà Nẵng, the
  // market over Hồ Chí Minh City), on a phone, a tablet and a computer; Hội An is a place of its own in the Vietnam
  // list (north to south between Đà Nẵng and Hồ Chí Minh City) and on the Simple screen's Places road; and the speech
  // box keeps its middle while it slides in (it once sat half its width to the right for 0.3 s, buttons off screen)
  const out = [];
  for (const [w, h, touch, tag] of [[390, 844, true, 'phone'], [820, 1180, true, 'tablet'], [1180, 760, false, 'computer']]) {
    const P = await open(b, { w, h, touch }); await clear(P.page);
    const r = await P.page.evaluate(async () => {
      __sv.openPad(0, 'map'); await new Promise(r => setTimeout(r, 600));
      const L = document.querySelector('canvas.bigmap').labels || [], hit = (a, q) => a.x < q.x + q.w && q.x < a.x + a.w && a.y < q.y + q.h && q.y < a.y + a.h;
      const over = []; L.forEach((a, i) => L.slice(i + 1).forEach(q => { if (hit(a, q)) over.push(a.name + ' / ' + q.name); }));
      const out = L.filter(a => a.x < 0 || a.y < 0 || a.x + a.w > 600 || a.y + a.h > 600).map(a => a.name);
      document.querySelector('.mapchips [data-g="vn"]').click(); await new Promise(r => setTimeout(r, 150));
      const cities = [...document.querySelectorAll('.mapcities button')].map(b => b.innerText.trim());
      document.querySelectorAll('.modal').forEach(e => e.remove());
      __sv.dialog('Bà Năm', [['Hello! Shall we play?', 'Chào cháu! Chơi nhé?']], [['▶ Play!', '▶ Chơi!'], ['👋 Later', '👋 Để sau']]);
      await new Promise(r => setTimeout(r, 30));
      const d = document.querySelector('.dialog'), an = d.getAnimations()[0]; if (an) { an.pause(); an.currentTime = 0; }
      const rc = d.getBoundingClientRect(), mid = Math.round(rc.left + rc.width / 2 - innerWidth / 2);
      return { n: L.length, over, out, cities, mid, anim: an ? an.animationName : '' };
    });
    ok(r.n >= 10, `${tag}: map names drawn: ${r.n}`);
    ok(!r.over.length, `${tag}: map names overlap: ${r.over.join('; ')}`);
    ok(!r.out.length, `${tag}: map names off the map: ${r.out.join('; ')}`);
    const at = n => r.cities.findIndex(c => c.includes(n)), ha = at('Hội An');
    ok(ha > at('Đà Nẵng') && at('Đà Nẵng') >= 0 && (at('Hồ Chí Minh') < 0 || ha < at('Hồ Chí Minh')), `${tag}: Hội An between Đà Nẵng and Hồ Chí Minh City: ${r.cities.join(' | ')}`);
    ok(Math.abs(r.mid) <= 2, `${tag}: the speech box starts ${r.mid}px off the middle (${r.anim})`);
    ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
    out.push(`${tag} ${r.n}`);
  }
  // the Simple screen's Places road (an under-5 starts on it)
  const Q = await open(b, { w: 390, h: 844, touch: true, screen: null });
  await Q.page.waitForSelector('.simple-screen:not([hidden]) .sp-catcard, .simple-screen:not([hidden]) .sp-stop', { timeout: 20000 });
  await Q.page.evaluate(() => document.querySelectorAll('.dialog').forEach(d => d.remove()));
  await Q.page.click('.sp-tabs [data-tab="places"]'); await Q.page.waitForTimeout(400);
  // (Round U: the Places tab shows its categories as cards first; each card opens its own road, so every road is walked)
  const road = await Q.page.evaluate(() => { const names = [], read = () => names.push(...[...document.querySelectorAll('.simple-screen .sp-stop')].map(e => e.innerText.trim().replace(/\s+/g, ' ')));
    const cats = __sv.simple.view.cats; if (!cats.length || document.querySelector('.simple-screen .sp-stop')) read(); for (const c of cats) { __sv.simple.openGroup('places', c); read(); } __sv.simple.openGroup('places', null); return names.join(' | '); });
  ok(road.includes('Hội An'), 'the Places road has no Hội An: ' + road.slice(0, 300));
  ok(!Q.errors.length, Q.errors.join(' | ')); await Q.ctx.close();
  return `map names apart on ${out.join(', ')}; Hội An in the Vietnam list and on the Places road; the speech box slides in from the middle`;
});

await check('cairangwalk', async () => {
  // (#726, 1 Nov 2026 AEDT, tester at 166,161: "stuck, can't get past here") from the meadow (172,168) a child walks into
  // Sài Gòn past the Cái Răng floating market, and up close to its boats: only the boats are solid, not a 6 m circle
  const P = await open(b, { w: 700, h: 500 }); await clear(P.page);
  const r = await P.page.evaluate(async () => { const G = __sv, W = await import('/js/world.js'); await G.solidsReady;
    const city = W.CITIES.find(c => c.id === 'saigon'), lm = (await import('/js/regions.js')).LANDMARKS.find(l => l.id === 'cairang');
    const walk = (a, t, pad = 30) => { const x0 = Math.min(a.x, t.x) - pad, z0 = Math.min(a.z, t.z) - pad, x1 = Math.max(a.x, t.x) + pad, z1 = Math.max(a.z, t.z) + pad, N = Math.ceil((x1 - x0) / .5) + 1, M = Math.ceil((z1 - z0) / .5) + 1, seen = new Uint8Array(N * M), q = [];
      const push = (i, j) => { if (i < 0 || j < 0 || i >= N || j >= M || seen[j * N + i]) return; seen[j * N + i] = 1; if (G.goodSpot(x0 + i * .5, z0 + j * .5)) q.push([i, j]); };
      push(Math.round((a.x - x0) / .5), Math.round((a.z - z0) / .5));
      for (let h = 0; h < q.length; h++) { const [i, j] = q[h]; if (Math.hypot(x0 + i * .5 - t.x, z0 + j * .5 - t.z) < 1.2) return true; push(i + 1, j); push(i - 1, j); push(i, j + 1); push(i, j - 1); } return false; };
    const big = G.world.colliders.filter(o => lm && Math.hypot(o.x - (lm.mx ?? lm.x), o.z - (lm.mz ?? lm.z)) < 2 && o.r >= 5).length;
    return { toCity: walk({ x: 172, z: 168 }, { x: 166, z: 161 }) && walk({ x: 166, z: 161 }, { x: city.x, z: city.z }, 40), big, market: lm ? [lm.mx ?? lm.x, lm.mz ?? lm.z] : null }; });
  await P.ctx.close();
  ok(r.toCity && r.big === 0, JSON.stringify(r));
  return 'from the meadow into Sài Gòn past the floating market; only its boats are solid';
});

await check('yard', async () => {
  // (round R, owner: bà Huệ and ông Nghi's quest chain) the yard stands in an open spot near the Huệ Nghi shop; the side
  // story plays from bà Huệ's start to the house-warming meal: the coach from Hà Tĩnh, a job for each relative (a wrong
  // job is turned down kindly), the dump truck tips its load, the excavator digs, the house is built; the truck and the
  // excavator stay for free play afterwards
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const pg = P.page, seen = [], handsUsed = new Set();
  const goal = () => pg.evaluate(() => { const c = __sv.currentQuest(__sv.heroes[0].profile); return c && c.id; });
  // tap through speech boxes, choosing answer `pick` when there is a choice, until the button's work is over
  const use = async (id, pick = 0) => {
    const ok = await pg.evaluate(id => { const h = __sv.heroes[0], it = __sv.interactables.find(i => i.id === id); if (!it || (it.visible && !it.visible(h))) return false; it.act(h, __sv); return true; }, id);
    if (!ok) return false;
    for (let i = 0; i < 200; i++) {
      await pg.waitForTimeout(350);
      // (switch yardHands) the panel of big controls: tap the buttons, hold the pedal, drag the handles like a child
      const hp = await pg.evaluate(() => {
        const ev = (el, type, y) => { const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 9, clientX: r.left + r.width / 2, clientY: r.top + r.height * y })); };
        const p = document.querySelector('.handpad'); if (!p) return '';
        const b = p.querySelector('[data-hp=load], [data-hp=brick]'); if (b) { b.click(); return 'tap'; }
        const ped = p.querySelector('[data-hp=pedal]'); if (ped) { if (!ped.classList.contains('on')) ev(ped, 'pointerdown', .5); return 'hold'; }
        const sl = p.querySelector('[data-hp=lever], [data-hp=roof]'); if (sl) { ev(sl, 'pointerdown', 0); ev(sl, 'pointermove', 1); ev(sl, 'pointerup', 1); return 'pull'; }
        const arm = p.querySelector('[data-hp=arm]'); if (arm) { window.__armY = window.__armY ? 0 : 1; ev(arm, 'pointerdown', window.__armY); ev(arm, 'pointerup', window.__armY); return 'dig'; }
        return '';
      });
      if (hp) { handsUsed.add(hp); continue; }
      const s = await pg.evaluate(pick => { const c = document.querySelectorAll('.dialog .dchoices button'); if (c.length) { c[Math.min(pick, c.length - 1)].click(); return 'c'; } const d = document.querySelector('.dialog'); if (d) { d.click(); return 'd'; } return document.querySelector('.reward') ? 'r' : ''; }, pick);
      if (s === 'r') { await pg.evaluate(() => document.querySelectorAll('.reward').forEach(e => e.click())); }
      if (!s && !(await pg.evaluate(() => __sv.paused || __sv.yard.busy()))) break;
    }
    await pg.evaluate(() => { document.querySelectorAll('.storybook,.reward').forEach(e => e.remove()); __sv.paused = false; });
    return true;
  };
  const info = await pg.evaluate(() => { const Y = __sv.yard, sh = __sv.interactables.find(i => i.id === 'npc_bahue');
    const house = Math.min(...__sv.world.colliders.filter(c => c.r > 2 && c.top == null).map(c => Math.hypot(c.x - Y.at.x, c.z - Y.at.z) - c.r));
    return { far: Math.hypot(sh.x - Y.at.x, sh.z - Y.at.z), room: Y.at.room || 0, house }; });
  seen.push(await goal()); await use('yard_start');
  // (owner 9 Oct: a side story) starting it leaves the goal bar on the main story; Follow on the Adventures page puts it there
  const stayed = await goal();
  const followed = await pg.evaluate(async () => { __sv.openPad(0, 'log'); await new Promise(r => setTimeout(r, 600)); const b = document.querySelector('.pad [data-follow=yard]'); if (!b) return false; b.click(); await new Promise(r => setTimeout(r, 400)); document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false; return __sv.heroes[0].profile.follow === 'yard'; });
  seen.push(await goal());
  await use('yard_coach'); seen.push(await goal());
  const rels = await pg.evaluate(async () => (await import('/js/content/yard.js')).RELATIVES.map(r => [r.id, r.job]));
  await use('yard_job_' + rels[0][0], (rels[0][1] + 1) % 3); const wrongKept = await pg.evaluate(id => __sv.heroes[0].profile.yard.jobs[id] == null, rels[0][0]);
  for (const [id, job] of rels) await use('yard_job_' + id, job);
  seen.push(await goal());
  await use('yard_truck'); const heap = await pg.evaluate(() => __sv.heroes[0].profile.yard.done.y_truck); seen.push(await goal());
  await use('yard_dig'); seen.push(await goal());
  await use('yard_build'); seen.push(await goal());
  await use('yard_party'); seen.push(await goal());
  const free = await pg.evaluate(() => { const h = __sv.heroes[0]; return ['yard_truck', 'yard_dig'].every(id => __sv.interactables.find(i => i.id === id).visible(h)); });
  const want = ['', 'Y_y_coach', 'Y_y_jobs', 'Y_y_truck', 'Y_y_dig', 'Y_y_build', 'Y_y_party'], out = [];
  want.forEach((id, i) => { if (i && seen[i] !== id) out.push(`goal ${i} was ${seen[i]}, expected ${id}`); });
  if (/^Y_/.test(seen[0] || '') || /^Y_/.test(seen[7] || '')) out.push('the yard was the goal before it started or after it ended: ' + seen[0] + ' / ' + seen[7]);
  if (/^Y_/.test(stayed || '')) out.push('starting the yard took over the goal bar (' + stayed + ')');
  if (!followed) out.push('no Follow button for the yard on the Adventures page');
  if (!wrongKept) out.push('a wrong job was accepted');
  if (!heap) out.push('the truck run did not finish');
  if (!free) out.push('the truck and excavator are not open for free play afterwards');
  for (const k of ['tap', 'hold', 'pull', 'dig']) if (!handsUsed.has(k)) out.push(`the yard by hand never asked to ${k}`);
  if (!(info.far < 70)) out.push(`the yard is ${info.far.toFixed(0)} m from the Huệ Nghi shop`);
  if (!(info.house > 6)) out.push(`a building stands ${info.house.toFixed(1)} m from the middle of the yard`);
  if (P.errors.length) out.push(...P.errors.slice(0, 2));
  await P.ctx.close();
  if (out.length) throw new Error(out.join('; '));
  return `the yard ${info.far.toFixed(0)} m from the shop, ${info.room.toFixed(0)} m of room; a side story (goal bar stays on the lantern story until Follow); coach, jobs (a wrong one turned down), dump truck (load, hold the pedal, pull the lever), excavator (drag the arm), bricks and roof by hand, and the meal played through; free play after`;
});

await check('camcalm', async () => {
  // (round R, owner: "the camera angles give a headache when it moves") walking, turning round suddenly and jumping:
  // the camera never swings faster than a slow steady pace, and a jump doesn't jerk the picture up and down
  const P = await open(b, { w: 1180, h: 760 }); await clear(P.page);
  const r = await P.page.evaluate(() => {
    const h = __sv.heroes[0], dt = 1 / 60; let t = 0, maxTurn = 0, maxLookY = 0, at = -1;
    h.place(h.pos.x, h.pos.z); h.manualCamT = 0;
    const lookDir = () => { const d = new h.cam.position.constructor(); h.cam.getWorldDirection(d); return d; };
    let prev = null;
    for (let f = 0; f < 600; f++) {
      t += dt; h.speed = 5; h.state = 'walk'; h.yaw = f < 200 ? 0 : f < 400 ? Math.PI : Math.PI / 2;   // sudden turn-rounds
      h.onGround = !(f % 120 > 100); const jumpY = h.onGround ? 0 : .8; const y0 = h.pos.y; h.pos.y = y0 + jumpY;
      h.finish(dt, t, __sv, 0); h.pos.y = y0;
      const d = lookDir(); if (prev && f > 60) { const w = prev.angleTo(d) / dt; if (w > maxTurn) { maxTurn = w; at = f; } maxLookY = Math.max(maxLookY, Math.abs(d.y - prev.y) / dt); } prev = d;
    }
    return { maxTurn, maxLookY, at };
  });
  ok(r.maxTurn < 1.0, `the view turns too fast: ${r.maxTurn.toFixed(2)} rad/s (frame ${r.at})`);
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  return `the view turns at most ${r.maxTurn.toFixed(2)} rad/s when the child turns round, and tips at most ${r.maxLookY.toFixed(2)}/s on a jump`;
});

await check('vehicles', async () => {
  // (round R, owner: real xe 67, Cub, Dream, xích lô, Australian motorbikes, bicycles of every kind, cars, buses, trams;
  // riders' hands on the grips and feet on the pegs; children can ride bicycles; all switchable in Studio)
  const P = await open(b, { w: 1180, h: 760 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const T = __sv.traffic, ids = new Set(T.slots.map(s => s.id)), V = await import('/js/vehicles.js');
    // the vehicles are made when a child comes near: go near a moving one and give them a moment
    const m = T.slots.find(s => s.mover && s.id !== 'xichlo' && s.id !== 'tramModern'), [mx, mz] = T.where(m), h = __sv.heroes[0]; h.place(mx + 20, mz + 20);
    T.slots.forEach(sl => { if (!sl.v) T.make(sl); });
    // every rider holds the grips: each hand within 12 cm of its grip
    const far = [];
    for (const sl of T.slots) if (sl.rider && sl.v.grips) { sl.v.o.updateMatrixWorld(true); const A = sl.rider;
      for (const [arm, g] of [[A.armL, sl.v.grips[0]], [A.armR, sl.v.grips[1]]]) { const hand = arm.children.find(c => Math.abs(c.position.y + .42) < .01); const hp = hand.getWorldPosition(new (hand.position.constructor)()), gp = sl.v.o.localToWorld(new (hand.position.constructor)(...g)); const d = hp.distanceTo(gp); if (d > .12) far.push(sl.id + ' ' + d.toFixed(2)); } }
    // a moving one moves
    const p0 = m.v.o.position.clone();
    await new Promise(r => setTimeout(r, 1500)); const moved = m.v.o.position.distanceTo(p0);
    // a child rides a bicycle and gets off again
    const it = __sv.interactables.find(i => i.id.startsWith('bike_')); h.place(it.x + 1, it.z + 1); await new Promise(r => setTimeout(r, 400)); it.act(h, __sv);
    const riding = !!(h.riding && h.riding.vehicle); h.dismount();
    return { n: T.slots.length, ids: [...ids], all: Object.keys(V.VEHICLES).length, far, moved, riding, off: !h.riding };
  });
  for (const id of ['honda67', 'cub', 'dream', 'scooter', 'xichlo', 'postie', 'tramModern', 'touristCart', 'miniBike', 'roadster', 'sedan']) ok(r.ids.includes(id), 'missing in the valley: ' + id);
  ok(!r.far.length, 'hands off the grips: ' + r.far.slice(0, 6).join(', '));
  ok(r.moved > .5, 'traffic did not move (' + r.moved + ')'); ok(r.riding && r.off, 'could not ride a bicycle and get off');
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  return `${r.all} models; ${r.n} vehicles in the valley; riders' hands on the grips; traffic moves; a child rides a bicycle and gets off`;
});

await check('regions', async () => {
  // (round T) every named area can be stood in somewhere in the valley, and the big places read as themselves at their
  // middle: the Dawn Plateau at home (it read as meadow once the plateau was lowered: no passport, songs or "you were in")
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), seen = new Set();
    for (let x = -W.HALF + 2; x < W.HALF - 2; x += 2) for (let z = -W.HALF + 2; z < W.HALF - 2; z += 2) seen.add(W.regionAt(x, z));
    const missing = Object.keys(W.REGION_NAMES).filter(k => !seen.has(k));
    const at = { plateau: [W.PLATEAU.x, W.PLATEAU.z], village: [W.VILLAGE.x, W.VILLAGE.z], town: [W.TOWN.x, W.TOWN.z], market: [W.MARKET.x, W.MARKET.z], aussie: [W.AUSSIE.x, W.AUSSIE.z] };
    const wrong = Object.entries(at).filter(([k, [x, z]]) => W.regionAt(x, z) !== k).map(([k, [x, z]]) => `${k} reads ${W.regionAt(x, z)}`);
    const home = W.regionAt(W.PLATEAU.x - 3, W.PLATEAU.z - 4);
    return { missing, wrong, home, n: Object.keys(W.REGION_NAMES).length };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.missing.length, `areas nowhere in the valley: ${r.missing.join(', ')}`);
  ok(!r.wrong.length, r.wrong.join('; '));
  ok(r.home === 'plateau', `the home spot reads ${r.home}, not plateau`);
  ok(!errs.length, errs.join(' | '));
  return `${r.n} areas all in the valley; home, Lotus Village, Phố Hai Quê, Chợ Ba Miền and Aussie Corner read as themselves`;
});

await check('bridges', async () => {
  // (round T2, RIVER-004, ROAD-009) every bridge spans its own water: at least 4 m of water under the middle of the span,
  // both ends on land, the deck is walkable; every bridge landmark stands on its bridge; and no road runs through water anywhere
  // except on a bridge deck
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), M = await import('/js/content/map.js'), G = __sv, bad = [];
    const at = (B, u, v = 0) => B.axis === 'z' ? [B.c + v, u] : [u, B.c + v];
    for (const B of W.BRIDGES) {
      // the water under the deck: at least 4 m of it, all within the middle 60 % of the span (the ends rest on raised banks)
      const span = B.a1 - B.a0; let wet = 0, first = null, last = null; for (let u = B.a0; u <= B.a1; u += .25) { const [x, z] = at(B, u); if (W.heightAt(x, z) < W.WATER - .3) { wet += .25; if (first == null) first = u; last = u; } }
      if (wet < 4 || first < B.a0 + span * .2 || last > B.a1 - span * .2) bad.push(`${B.id}: ${wet} m of water under it, from ${first} to ${last} (span ${B.a0} to ${B.a1})`);
      for (const u of [B.a0 - 1.5, B.a1 + 1.5]) { const [x, z] = at(B, u); if (W.heightAt(x, z) < W.WATER + .5) bad.push(`${B.id}: an end is not on land (${x},${z})`); }
      const [mx, mz] = at(B, (B.a0 + B.a1) / 2), y = G.world.groundAt(mx, mz, B.h + 2); if (Math.abs(y - B.h) > .6) bad.push(`${B.id}: deck not walkable (${y.toFixed(1)} vs ${B.h})`);
      if (B.over && !W.RIVERS.some(R => R.id === B.over)) bad.push(`${B.id}: over unknown water ${B.over}`);
      // (the Dragon Bridge is its own landmark, built with the roads: no postcard spot in the map)
      if (B.landmark && M.landmarkAt(B.landmark)) { const [lx, lz] = M.landmarkAt(B.landmark); if (!W.bridgeAt(lx, lz, B.w / 2 + .1)) bad.push(`${B.id}: its landmark ${B.landmark} is not on it`); }
    }
    let wetRoad = 0; const where = [];
    for (const L of G.world.roadLines) L.pts.forEach(([x, z], i) => { if (!L.deck[i] && W.heightAt(x, z) < W.WATER - .2) { wetRoad++; if (where.length < 6) where.push(`${x.toFixed(0)},${z.toFixed(0)}`); } });
    if (wetRoad) bad.push(`${wetRoad} road points in water off any deck: ${where.join(' ')}`);
    return { bad, n: W.BRIDGES.length, lm: W.BRIDGES.filter(B => B.landmark).map(B => B.landmark) };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.bad.length, r.bad.slice(0, 10).join('; '));
  ok(!errs.length, errs.join(' | '));
  return `${r.n} bridges each over its water, ends on land, decks walkable; landmarks on their bridges: ${r.lm.join(', ')}; no road in water`;
});

await check('shallowrivers', async () => (await import('../shallow-rivers.mts')).shallowRiversCheck(b));

await check('bridgeunderpass', async () => (await import('../bridge-underpass.mts')).bridgeUnderpassCheck(b));

await check('boats', async () => {
  // (round T2, RIVER-002/005/006) ride every boat end to end, 1 m at a time: the water under it and 1.5 m either side
  // is deep enough (at the piers a little shallower), every deck it passes is high enough over it, and every pier's land
  // end joins a road or footpath; the raft stops by every bridge it passes under
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), M = await import('/js/content/map.js'), G = __sv, bad = [], THREE = await import('/vendor/three.module.js');
    await G.solidsReady;
    const F = G.ferries.ferries, info = [];
    for (const f of F) {
      const box = new THREE.Box3().setFromObject(f.model), tall = box.max.y - W.WATER, name = f.boat === 'vtboat' ? 'Vũng Tàu boat' : f.harbour ? 'harbour ferry' : f.line ? 'raft line' : f.loop ? 'lake ferry' : 'crossing raft';
      let shallow = 0, low = 0, pierHits = 0, first = '';
      const stopPts = f.stops.map(s => f.path[s.i]);
      for (let i = 0; i < f.path.length - (f.loop ? 0 : 1); i++) { const a = f.path[i], c = f.path[(i + 1) % f.path.length], L = Math.hypot(c.x - a.x, c.z - a.z), n = Math.max(1, Math.ceil(L));
        for (let k = 0; k < n; k++) { const x = a.x + (c.x - a.x) * k / n, z = a.z + (c.z - a.z) * k / n, ux = -(c.z - a.z) / (L || 1), uz = (c.x - a.x) / (L || 1);
          const nearStop = stopPts.some(p => Math.hypot(p.x - x, p.z - z) < 6), lim = nearStop ? W.WATER - .25 : W.WATER - .8;
          const hs = [0, -1.5, 1.5].map(o => W.heightAt(x + ux * o, z + uz * o)); if ((nearStop ? hs[0] : Math.max(...hs)) > lim) { shallow++; if (!first) first = `${x.toFixed(0)},${z.toFixed(0)}`; }
          const B = W.bridgeAt(x, z, 4); if (B && B.h - tall < .5) low++;
          if(B&&!nearStop&&G.world.underpassSolid){const N=Math.round(W.SIZE/.5);for(const o of[0,-1.5,1.5]){const gx=Math.floor((x+ux*o+W.HALF)/.5),gz=Math.floor((z+uz*o+W.HALF)/.5);if(G.world.underpassSolid[gz*N+gx])pierHits++;}} } }
      if (shallow) bad.push(`${name}: ${shallow} m too shallow (first at ${first})`);
      if(pierHits)bad.push(`${name}: ${pierHits} hull samples intersect a real bridge support`);
      if (low) bad.push(`${name}: ${low} m under a deck too low for it`);
      for (const s of f.stops) { const p = s.dock && s.dock.pier && s.dock.pier.land; if (!p) continue; const rd = W.roadDist(p.x, p.z); if (!rd.road || rd.d > rd.road.w / 2 + 3) bad.push(`${name}: the pier at ${p.x.toFixed(0)},${p.z.toFixed(0)} (${s.name()}) joins no road (${rd.d.toFixed(1)} m)`); }
      // (owner, 18 Oct AEDT: "the boat docks are too far drop off the ground") walk each pier from the bank to its end: it
      // starts level with the ground, and no step up or down is more than a child can climb (1.2 m)
      for (const s of f.stops) { const pr = s.dock && s.dock.pier; if (!pr || !pr.land) continue; const L = Math.hypot(pr.tip.x - pr.land.x, pr.tip.z - pr.land.z);
        let y = W.heightAt(pr.land.x - Math.sin(pr.a), pr.land.z - Math.cos(pr.a)), worst = 0;
        for (let k = -1; k <= L; k += .2) { const g = G.world.groundAt(pr.land.x + Math.sin(pr.a) * k, pr.land.z + Math.cos(pr.a) * k, y + .01); worst = Math.max(worst, Math.abs(g - y)); y = g; }
        if (worst > 1.2) bad.push(`${name}: the pier at ${pr.land.x.toFixed(0)},${pr.land.z.toFixed(0)} (${s.name()}) has a ${worst.toFixed(1)} m drop`);
        if (Math.abs(y - pr.tip.y) > .3) bad.push(`${name}: walking the pier at ${pr.land.x.toFixed(0)},${pr.land.z.toFixed(0)} ends ${(y - pr.tip.y).toFixed(1)} m off its end`); }
      info.push(`${name} ${f.stops.length} stops`);
    }
    const raft = F.find(f => f.line), want = (M.BOATS.find(b => b.id === 'raft').bridgeStops || []).map(s => s.bridge), have = raft ? raft.stops.map(s => s.bridge).filter(Boolean) : [];
    const missing = want.filter(id => !have.includes(id)); if (missing.length) bad.push('the raft does not stop by ' + missing.join(', '));
    if (!F.some(f => f.harbour)) bad.push('no Sydney Harbour ferry');
    // (round T3) every boat the map gives two piers runs: the Sydney Harbour ferry and the Sài Gòn boat to Vũng Tàu
    for (const B of M.BOATS.filter(B => B.piers)) if (!F.some(f => f.boat === B.id)) bad.push(`no boat ${B.id}`);
    // (owner, 18 Oct AEDT: Cầu Rồng's sign stood in Sông Hồng and the map sent children there) every bridge landmark's ℹ️
    // sign (where the map's Travel takes a child) is on dry land within 12 m of its bridge's end
    for (const Bd of W.BRIDGES.filter(Bd => Bd.landmark)) for (const lm of G.LANDMARKS.filter(l => l.id === Bd.landmark)) {
      const ends = Bd.axis === 'z' ? [[Bd.c, Bd.a0], [Bd.c, Bd.a1]] : [[Bd.a0, Bd.c], [Bd.a1, Bd.c]], d = Math.min(...ends.map(([x, z]) => Math.hypot(lm.x - x, lm.z - z)));
      if (W.heightAt(lm.x, lm.z) < W.WATER + .4 || d > 12) bad.push(`${lm.id}: its sign at ${lm.x.toFixed(0)},${lm.z.toFixed(0)} is ${d.toFixed(0)} m from its bridge${W.heightAt(lm.x, lm.z) < W.WATER + .4 ? ', in the water' : ''}`);
    }
    return { bad, info };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.bad.length, r.bad.slice(0, 10).join('; '));
  ok(!errs.length, errs.join(' | '));
  return r.info.join(', ') + '; every route deep enough, under high enough decks, every pier on a road or path, level with its bank and walkable to its end; every bridge landmark sign on land by its bridge';
});

await check('plots', async () => {
  // (round T3, ROUND-T.md T3) the garden plots: at least 60 (two Memory Villages and up to three spare by each city); each level
  // within 5 cm, off every road and all water, its front within 2 m of a road's edge, a unique id and address, and nothing
  // standing on it (no solid cell, no collider, no building box); one garden mesh for all of them
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), G = __sv, bad = []; await G.solidsReady;
    const PL = W.PLOTS, ids = new Set(), en = new Set(), vi = new Set(), by = {};
    for (const p of PL) {
      const B = W.plotBox(p), tag = `${p.id} (${p.x.toFixed(0)},${p.z.toFixed(0)})`; by[p.village] = (by[p.village] || 0) + 1;
      if (ids.has(p.id)) bad.push('two plots called ' + p.id); ids.add(p.id);
      if (en.has(p.address[0]) || vi.has(p.address[1])) bad.push(`${tag}: address ${p.address[0]} used twice`); en.add(p.address[0]); vi.add(p.address[1]);
      let lo = 1e9, hi = -1e9, road = '', wet = false, solid = 0;
      for (let x = B.x0 + .15; x <= B.x1 - .15; x += .5) for (let z = B.z0 + .15; z <= B.z1 - .15; z += .5) {
        const h = W.heightAt(x, z); lo = Math.min(lo, h); hi = Math.max(hi, h);
        const rd = W.roadDist(x, z); if (rd.road && rd.d < rd.road.w / 2) road = rd.road.id;
        if (h < W.WATER + .5 || W.waterAt(x, z, 4)) wet = true;
        if (G.world.solidAt(x, z)) solid++;
      }
      if (hi - lo > .05) bad.push(`${tag}: not level (${(hi - lo).toFixed(2)} m)`);
      if (road) bad.push(`${tag}: on the road ${road}`);
      if (wet) bad.push(`${tag}: in the water`);
      if (solid) bad.push(`${tag}: ${solid} solid cells on it`);
      const fx = p.x + Math.sin(p.rot) * p.d / 2, fz = p.z + Math.cos(p.rot) * p.d / 2, fr = W.roadDist(fx, fz);
      if (!fr.road || fr.d - fr.road.w / 2 > 2) bad.push(`${tag}: its front is ${(fr.d - (fr.road ? fr.road.w / 2 : 0)).toFixed(1)} m from a road`);
      const inside = (x, z, m = 0) => x > B.x0 - m && x < B.x1 + m && z > B.z0 - m && z < B.z1 + m;
      const col = G.world.colliders.find(c => inside(c.x, c.z, c.r * .5)); if (col) bad.push(`${tag}: something stands on it (${col.x.toFixed(0)},${col.z.toFixed(0)})`);
      const box = G.world.boxes.find(o => !o.room && o.x1 > B.x0 && o.x0 < B.x1 && o.z1 > B.z0 && o.z0 < B.z1); if (box) bad.push(`${tag}: a building box overlaps it`);
    }
    let gardens = 0; G.scene.traverse(o => { if (o.userData.plots) gardens++; });
    return { n: PL.length, bad, by, gardens, count: G.plots ? G.plots.count : 0 };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.n >= 60, `only ${r.n} plots (want 60 or more)`);
  ok(!r.bad.length, r.bad.slice(0, 10).join('; ') + (r.bad.length > 10 ? ` … ${r.bad.length} in all` : ''));
  ok(r.gardens === 1 && r.count === r.n, `the gardens are ${r.gardens} meshes for ${r.count} of ${r.n} plots (want one mesh for all)`);
  ok(!errs.length, errs.join(' | '));
  return `${r.n} plots (${Object.entries(r.by).map(([k, v]) => `${k} ${v}`).join(', ')}): each level, dry, off the roads, its front by a road, a unique address, nothing on it; one garden mesh`;
});

await check('roadtone', async () => {
  // (round T2, ROAD-014, Concept D "B"; round T4a ROAD-015) every asphalt road carries its region's colour, one shared material per colour,
  // and the ring road round the home island is closed
  const M = await import('../../js/content/map.js'), bad = [];
  for (const R of M.ROADS) if (R.kind === 'asphalt' && !(R.tone in M.ROAD_TONES)) bad.push(`${R.id} has no colour`);
  const ring = M.ROADS.find(R => R.id === 'ring'); if (!ring || !ring.loop) bad.push('the ring road is not a closed loop');
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const mats = await P.page.evaluate(() => { const s = new Set(); __sv.scene.traverse(o => { if (o.userData.road && o.material && o.material.map) s.add(o.material.uuid); }); return s.size; });
  // (round T4a, ROAD-015) the markings: a yellow centre dash on Vietnam's roads, light concrete kerbs on Australia's
  // Compare plain asphalt over 3,584 pixels, away from kerbs/markings; random speckles are not the regional base colour.
  const mark = await P.page.evaluate(async () => {
    const M = await import('/js/content/map.js'), { THREE } = await import('/js/gfx.js'), mid = id => { const R = M.ROADS.find(r => r.id === id), [a, c] = R.pts; return [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2]; };
    const at = ([x, z], px, py, width = 1, height = 1) => { let got = null; __sv.scene.traverse(o => { if (got || !o.userData.road || !o.material || !o.material.map) return; o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox;
      // (v1.07 roads) positions are given on the old 64 x 256 picture and scaled to the picture's real size
      if (x > bb.min.x && x < bb.max.x && z > bb.min.z && z < bb.max.z) { const im = o.material.map.image, g = im.getContext('2d'), sx = im.width / 64, sy = im.height / 256; const data = g.getImageData(px * sx, py * sy, width * sx, height * sy).data, sum = [0,0,0]; for(let i=0;i<data.length;i+=4)for(let k=0;k<3;k++)sum[k]+=data[i+k]; got=sum.map(v=>v/(data.length/4)); } }); return got; };
    return { vnDash: at(mid('vn_north'), 31, 60), auKerb: at(mid('link_au'), 1, 60), auMid: at(mid('link_au'), 10, 0, 14, 256), vnMid: at(mid('vn_north'), 10, 0, 14, 256), vnKerb: at(mid('vn_north'), 0, 60) };
  });
  const errs = P.errors; await P.ctx.close();
  { const [r, g, bl] = mark.vnDash || [0, 0, 0]; ok(r > 200 && g > 150 && bl < 120, `Vietnam's road has no yellow centre dash: rgb ${mark.vnDash}`); }
  { const k = mark.auKerb || [0, 0, 0], m = mark.auMid || [0, 0, 0]; ok(k[0] > 180 && k[0] > m[0] + 40, `Australia's road has no concrete kerb: kerb rgb ${k}, road rgb ${m}`); }
  ok(mark.auMid && mark.vnMid && mark.auMid[0] + 12 < mark.vnMid[0], `Concept D: Australian asphalt should be darker than Vietnam's: ${JSON.stringify(mark)}`);
  ok(mark.vnKerb && mark.vnKerb[0] > 180, `Vietnam's road needs a stone kerb: ${mark.vnKerb}`);
  const tones = new Set(M.ROADS.filter(R => R.kind === 'asphalt').map(R => M.ROAD_TONES[R.tone] || 'grey'));
  ok(!bad.length, bad.join('; '));
  ok(mats <= tones.size + 2, `${mats} road materials for ${tones.size} asphalt colours (one each, plus dirt and footpath)`);
  ok(!errs.length, errs.join(' | '));
  return `${M.ROADS.filter(R => R.kind === 'asphalt').length} asphalt roads in ${tones.size} colours, ${mats} road materials; the ring road is closed; a yellow centre dash in Vietnam, kerbs in Australia`;
});

await check('gates', async () => {
  // (r63, ROAD-016; owner: "at the gate of Hà Nội it is blocked and I can't go through") a child walks through every
  // gate on a road's end, from 8 m outside to 3 m inside (through the gate onto the square), along the road: nothing
  // solid stops them and the ground never steps more than 25 cm from one half metre to the next (a bridge deck on the way
  // is the `bridges` check's)
  // (30 Oct AEDT) the solid map is made once a child plays (js/solids.js waits for play), so the check starts playing
  const P = await open(b, { w: 900, h: 640 });
  await P.page.waitForFunction(() => __sv.world && __sv.world.solidAt, null, { timeout: 90000 });
  const r = await P.page.evaluate(async () => {
    const W = __sv.world, w = await import('/js/world.js'), M = await import('/js/content/map.js'), bad = []; let n = 0, worst = 0;
    for (const R of M.ROADS) (R.gates || []).forEach((g, k) => { if (!g) return; n++;
      const pts = R.pts, [x0, z0] = k ? pts[pts.length - 1] : pts[0], [x1, z1] = k ? pts[pts.length - 2] : pts[1], L = Math.hypot(x0 - x1, z0 - z1), ux = (x0 - x1) / L, uz = (z0 - z1) / L;
      let prev = null; for (let t = -8; t <= 3; t += .5) { const x = x0 + ux * t, z = z0 + uz * t, h = w.heightAt(x, z);
        if (W.platforms.some(P => { const p = P.apron || P; return !P.tower && x > p.x0 - .4 && x < p.x1 + .4 && z > p.z0 - .4 && z < p.z1 + .4; })) { prev = null; continue; } // (r66: with Round U a bridge's 1.2 m apron is part of it, with the 0.4 m edge js/solids.js gives every deck)
        const pos = { x, y: h, z }; W.collide(pos, .35); if (Math.hypot(pos.x - x, pos.z - z) > .2) { bad.push(`${g} (${R.id}): blocked ${t.toFixed(1)} m from the gate`); break; }
        if (prev != null) { const st = Math.abs(h - prev); worst = Math.max(worst, st); if (st > .25) { bad.push(`${g} (${R.id}): a ${st.toFixed(2)} m step ${t.toFixed(1)} m from the gate`); break; } } prev = h; } });
    return { n, worst, bad };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.n >= 15, `only ${r.n} gates found`);
  ok(!r.bad.length, r.bad.join('; '));
  ok(!errs.length, errs.join(' | '));
  return `${r.n} gates walked through, nothing in the way, the biggest step ${(r.worst * 100).toFixed(0)} cm`;
});

await check('water', async () => {
  // (round T4a, RIVER-008) the water map: one water plane and one draw, its picture 1024 px or smaller, painted once and
  // read back from the device on the next start; each water its colour (Sông Hồng red-brown, the sea blue, the lake
  // turquoise), a foam line by the shore. (RIVER-009) reeds and water hyacinth: two instanced meshes, none on a road,
  // deck or pier, hyacinth never on a boat route
  const P = await open(b, { w: 900, h: 640, play: false });
  const pic = async () => { await P.page.waitForFunction(() => __sv.waterPic && __sv.waterPic.ready && __sv.reeds && __sv.ferries, null, { timeout: 90000 }); return P.page.evaluate(() => __sv.waterPic.from); };
  const first = await pic();
  for (let i = 0; i < 75; i++) { if (await P.page.evaluate(async () => { try { const k = await caches.open('sv-world'); return (await k.keys()).some(r => r.url.includes('/water.png')); } catch (e) { return true; } })) break; await P.page.waitForTimeout(200); }
  await P.page.reload(); await P.page.waitForSelector('.screen.title', { timeout: 90000 }); const second = await pic();
  ok(first === 'painted' && second === 'cache', `water map: first start ${first}, second start ${second} (should be painted, then from the cache)`);
  const r = await P.page.evaluate(async () => {
    const G = __sv, W = await import('/js/world.js'), M = await import('/js/content/map.js'), cv = G.waterPic.canvas, g = cv.getContext('2d');
    const px = (x, z) => { const i = Math.floor((x / W.SIZE + .5) * cv.width), j = Math.floor((z / W.SIZE + .5) * cv.height); return [...g.getImageData(i, j, 1, 1).data]; };
    const planes = [], mats = new Set(); G.scene.traverse(o => { if (o.isMesh && o.material && o.material.customProgramCacheKey && o.material.customProgramCacheKey() === 'svwater') { planes.push(o); mats.add(o.material.uuid); } });
    const tex = planes[0] && planes[0].material.userData, tx = planes.length ? cv : null;
    // a spot in the middle of Sông Hồng, the lake, the sea; a shore: the lake's edge (deep middle vs. the water's edge)
    const hong = M.WATERS.find(w => w.id === 'hong').pts[2], deep = px(W.LAKE.x, W.LAKE.z + W.LAKE.r * .3);
    let shore = 0; for (let a = 0; a < 6.3; a += .05) for (let d = W.LAKE.r * .6; d < W.LAKE.r + 4; d += .5) { const x = W.LAKE.x + Math.cos(a) * d, z = W.LAKE.z + Math.sin(a) * d; if (W.heightAt(x, z) < W.WATER - .2 && W.heightAt(x, z) > W.WATER - 1) { shore = Math.max(shore, px(x, z)[3]); } }
    // reeds and hyacinth: where every one stands
    const items = []; for (const m of G.reeds.meshes) { const a = m.instanceMatrix.array; for (let i = 0; i < m.count; i++) items.push({ k: m.userData.reeds ? 'reeds' : 'hyacinth', x: a[i * 16 + 12], z: a[i * 16 + 14] }); }
    const bad = [];
    for (const it of items) {
      const rd = W.roadDist(it.x, it.z); if (rd.road && rd.d < rd.road.w / 2 + 1) bad.push(`${it.k} on road ${rd.road.id || rd.road.kind} at (${it.x.toFixed(0)}, ${it.z.toFixed(0)})`);
      if (G.world.platforms.some(p => it.x > p.x0 - .5 && it.x < p.x1 + .5 && it.z > p.z0 - .5 && it.z < p.z1 + .5)) bad.push(`${it.k} on a deck or pier at (${it.x.toFixed(0)}, ${it.z.toFixed(0)})`);
      if (it.k === 'hyacinth') for (const F of G.ferries.ferries) for (let i = 0; i < F.path.length - 1; i++) { const a = F.path[i], c = F.path[i + 1], dx = c.x - a.x, dz = c.z - a.z, L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((it.x - a.x) * dx + (it.z - a.z) * dz) / L2));
        if (Math.hypot(it.x - a.x - dx * t, it.z - a.z - dz * t) < 4) { bad.push(`hyacinth on a boat route at (${it.x.toFixed(0)}, ${it.z.toFixed(0)})`); break; } }
    }
    return { planes: planes.length, mats: mats.size, size: tx ? Math.max(cv.width, cv.height) : 0, hong: px(hong[0], hong[1]), lake: deep, sea: px(0, W.SIZE / 2 - 8), shore, deepA: deep[3],
      reeds: items.filter(i => i.k === 'reeds').length, hyacinth: items.filter(i => i.k === 'hyacinth').length, meshes: G.reeds.meshes.length, bad: bad.slice(0, 8), nbad: bad.length };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.planes === 1 && r.mats === 1, `${r.planes} water planes with ${r.mats} materials (should be one, one draw)`);
  ok(r.size > 0 && r.size <= 1024, `water map ${r.size} px (1024 or smaller)`);
  const [hr, hg, hb] = r.hong, [lr, lg, lb] = r.lake, [sr, sg, sb] = r.sea;
  ok(hr > hb + 40 && hr > hg, `Sông Hồng is not red-brown: rgb ${r.hong.slice(0, 3)}`);
  ok(sb > sr + 60 && sb > sg, `the sea is not blue: rgb ${r.sea.slice(0, 3)}`);
  ok(lb > lr + 60 && lg > lr + 60, `the lake is not turquoise: rgb ${r.lake.slice(0, 3)}`);
  ok(r.shore > 200 && r.deepA < 80, `no foam line by the lake's shore (alpha by the shore ${r.shore}, deep water ${r.deepA})`);
  ok(r.meshes === 2 && r.reeds >= 50 && r.hyacinth >= 20, `${r.meshes} meshes, ${r.reeds} reeds, ${r.hyacinth} hyacinth (two meshes, at least 50 and 20)`);
  ok(!r.nbad, `${r.nbad} reeds or hyacinth in the wrong place: ${r.bad.join('; ')}`);
  ok(!errs.length, errs.join(' | '));
  return `one water plane, map ${r.size} px painted then from the cache; Sông Hồng rgb ${r.hong.slice(0, 3)}, sea ${r.sea.slice(0, 3)}, lake ${r.lake.slice(0, 3)}, foam by the shore; ${r.reeds} reeds and ${r.hyacinth} hyacinth in 2 meshes, none on a road, deck, pier or boat route`;
});

await check('surface', async () => {
  // (round T4a, WORLD-014) footsteps by surface: surfaceAt at known spots of the map
  const P = await open(b, { w: 900, h: 640, play: false });
  await P.page.waitForFunction(() => __sv.ferries, null, { timeout: 90000 });
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), M = await import('/js/content/map.js'), G = __sv, on = (x, z, y) => W.surfaceAt(x, z, y);
    const road = id => { const R = M.ROADS.find(r => r.id === id), [a, c] = R.pts; return [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2]; };
    const vn = road('vn_north'), dirt = road('mv_e1'), city = W.CITIES.find(c => c.id === 'hanoi'), lake = [W.LAKE.x, W.LAKE.z];
    // the beach: the first dry spot north of the sea, low and sandy, on the meridian of the Sài Gòn mouth's east
    let beach = null; for (let z = 236; z > 150 && !beach; z -= .5) { const h = W.heightAt(60, z); if (h > W.WATER + .3 && h < 1.4) beach = [60, z]; }
    const B = M.BRIDGES.find(b => b.id === 'haique'), deck = B.axis === 'x' ? [(B.a0 + B.a1) / 2, B.c] : [B.c, (B.a0 + B.a1) / 2];
    const pier = G.ferries.ferries.flatMap(F => F.stops.map(s => s.dock && s.dock.pier)).find(p => p && p.tip);
    const home = M.PLACES.find(p => p.id === 'home').at;
    let grass = null; for (let k = 0; k < 400 && !grass; k++) { const x = home[0] + Math.cos(k) * (10 + k * .1), z = home[1] + Math.sin(k) * (10 + k * .1), rd = W.roadDist(x, z); if (W.heightAt(x, z) > 2 && (!rd.road || rd.d > rd.road.w / 2 + 2)) grass = [x, z]; }
    const got = {
      road: on(vn[0], vn[1]), town: on(city.x, city.z), dirt: on(dirt[0], dirt[1]), sand: beach && on(beach[0], beach[1]), water: on(lake[0] + W.LAKE.r * .5, lake[1]),
      wood: on(deck[0], deck[1], W.WATER + B.h), pier: pier && on(pier.tip.x, pier.tip.z, pier.tip.y), grass: grass && on(grass[0], grass[1])
    };
    return got;
  });
  const errs = P.errors; await P.ctx.close();
  const want = { road: 'road', town: 'road', dirt: 'dirt', sand: 'sand', water: 'water', wood: 'wood', pier: 'wood', grass: 'grass' };
  const wrong = Object.keys(want).filter(k => r[k] !== want[k]).map(k => `${k}: ${r[k]} (should be ${want[k]})`);
  ok(!wrong.length, wrong.join('; '));
  ok(!errs.length, errs.join(' | '));
  return Object.entries(r).map(([k, v]) => `${k} ${v}`).join(', ');
});

await check('walkaway', async () => {
  // a villager's words and the chat window stay while the child stands near, and close by themselves once the child
  // walks away (6 m; owner, round 30)
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], C = await import('/js/chat.js'), x0 = h.pos.x, z0 = h.pos.z, wait = ms => new Promise(r => setTimeout(r, ms));
    G.dialog('Bà Năm', [['Hello there, little one!', 'Chào con!']]); await C.openChat(G, 0, Object.keys(C.PERSONAS)[0]);
    await wait(400); h.place(x0 + 3, z0); await wait(1200);
    const near = { dialog: !!document.querySelector('.dialog:not(.out)'), chat: !!document.querySelector('.chatbox') };
    h.place(x0 + 9, z0); await wait(1500);
    const far = { dialog: !!document.querySelector('.dialog:not(.out)'), chat: !!document.querySelector('.chatbox') };
    return { near, far };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.near.dialog && r.near.chat && !r.far.dialog && !r.far.chat && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return '3 m away the talk box and the chat stay; 9 m away both have closed by themselves';
});

await check('rain', async () => {
  // bug #39 (owner: the rain was a repeating noise): rain is one soft steady hush that fades in and out with the
  // weather, and it never carries on over a game, a story or the Simple screen (the valley rests behind them)
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  await P.page.mouse.click(200, 400);
  const r = await P.page.evaluate(async () => {
    const A = await import('/js/audio.js'), S = await import('/js/state.js'), w = t => new Promise(res => setTimeout(res, t)), G = __sv, out = {};
    S.settings.sound = true; S.settings.noRain = false; await A.ac().resume().catch(() => { });
    out.dry = A.Rain.on;
    G.weather.start(); await w(1500); out.raining = A.Rain.on;
    G.playGame(0, 'caro', 'replay'); await w(1500); out.game = A.Rain.on; out.gameOpen = !!document.querySelector('.gl');
    document.querySelector('.gl .gl-x')?.click(); await w(1500); out.back = A.Rain.on;
    S.settings.sound = false; await w(800); out.soundOff = A.Rain.on; S.settings.sound = true; await w(800);
    G.weather.stop(); await w(1500); out.stopped = A.Rain.on;
    return out;
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.dry && r.raining && r.gameOpen && !r.game && r.back && !r.soundOff && !r.stopped && !errs.length, JSON.stringify({ r, errs }));
  return 'rain hush on while it rains, off under a game and back after it, off with Sound effects off, off when the rain stops';
});

await check('myhouse', async () => {
  // decorate your house (js/myhouse.js): the farmhouse door leads into the child's own room with 8 spots; a free
  // teddy goes on the floor, a clock costs 12 coins (refused with 5, bought with 50), a family postcard can hang on a
  // wall; it is kept per child, still there after leaving and coming back, and each change says "HomeDecorated"
  const P = await open(b, { w: 900, h: 640, play: false });
  const jpg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
  await P.page.route('**/content/custom.json*', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ album: [{ id: 'f1', photo: 'content/album/f1.jpg', en: 'Grandma', vi: 'Bà', place: 'village' }] }) }));
  await P.page.route('**/content/album/*.jpg', r => r.fulfill({ contentType: 'image/jpeg', body: jpg }));
  await P.page.reload(); await start(P.page); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], S = await import('/js/state.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    const ev = []; G.events.on('HomeDecorated', p => ev.push(p.item));
    h.profile.homeDeco = {}; h.profile.familyCards = { f1: 1 }; h.profile.houseGuideSeen = true;   // (the first-visit guide has its own check: houseguide)
    const doorIt = G.interactables.find(i => i.id === 'myhouse_door'); doorIt.act(h, G); await wait(1600);
    const inside = !!h.indoors && h.indoors.mine, spots = G.interactables.filter(i => /^deco_/.test(i.id)).length;
    const pickIn = async (spot, key) => { G.interactables.find(i => i.id === 'deco_' + spot).act(h, G); await wait(300); const b = document.querySelector(`.decor [data-k="${key}"]`); const had = !!b; b && b.click(); await wait(300); document.querySelector('.decor .x')?.click(); await wait(200); return had; };
    await pickIn(0, 'teddy');
    S.farm.coins = 5; await pickIn(1, 'clock'); const refused = !h.profile.homeDeco[1] && S.farm.coins === 5;
    S.farm.coins = 50; await pickIn(1, 'clock'); const bought = h.profile.homeDeco[1] === 'clock' && S.farm.coins === 38;
    const cardOnWall = await pickIn(4, 'card:f1'), cardOnFloor = await (async () => { G.interactables.find(i => i.id === 'deco_2').act(h, G); await wait(300); const x = !!document.querySelector('.decor [data-k="card:f1"]'); document.querySelector('.decor .x')?.click(); await wait(200); return x; })();
    G.homes.leave(h); await wait(1400); const out = !h.indoors;
    doorIt.act(h, G); await wait(1600); const kept = JSON.stringify(h.profile.homeDeco); G.homes.leave(h); await wait(1400);
    return { inside, spots, refused, bought, cardOnWall, cardOnFloor, out, kept, ev, paused: G.paused };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.inside && r.spots === 8 && r.refused && r.bought && r.cardOnWall && !r.cardOnFloor && r.out && r.kept === '{"0":"teddy","1":"clock","4":"card:f1"}' && r.ev.join() === 'decor:teddy,decor:clock,postcard:family/f1' && !r.paused && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return '8 spots; a free teddy, a 12-coin clock (refused with 5, bought with 50), grandma\'s postcard on a wall (not on the floor); all still there after going out and back in';
});

await check('houseguide', async () => {
  // (Round U item 11) the first time a child walks into their own house, a guide says how to decorate (sparkles, coins,
  // family photos, change or take away), in the chosen language; it is not shown again, and the ❓ sign in the room repeats it
  const P = await open(b, { w: 900, h: 640 });
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], wait = ms => new Promise(r => setTimeout(r, ms)), lines = [];
    const tapThrough = async () => { for (let i = 0; i < 8; i++) { const d = document.querySelector('.dialog:not(.out)'); if (!d) break; lines.push(d.querySelector('.dtext').textContent); d.click(); await wait(250); } };
    delete h.profile.houseGuideSeen;
    const doorIt = G.interactables.find(i => i.id === 'myhouse_door'); doorIt.act(h, G); await wait(1700);
    const first = !!document.querySelector('.dialog:not(.out)'); await tapThrough();
    const n1 = lines.length, seen = h.profile.houseGuideSeen === true, unpaused = !G.paused;
    const help = G.interactables.find(i => i.id === 'house_help'); help && help.act(h, G); await wait(400);
    const again = !!document.querySelector('.dialog:not(.out)'); await tapThrough();
    G.homes.leave(h); await wait(1400);
    doorIt.act(h, G); await wait(1700); const quiet = !document.querySelector('.dialog:not(.out)'); G.homes.leave(h); await wait(1400);
    return { first, n1, seen, unpaused, help: !!help, again, n2: lines.length - n1, quiet, lines: lines.slice(0, 4), paused: G.paused };
  });
  const errs = P.errors; await P.ctx.close();
  // (owner, 30 Oct 2026 AEDT) the guide has six steps now: moving things, the trophy board and the hammer for upgrades were added
  ok(r.first && r.n1 === 6 && r.seen && r.unpaused && r.help && r.again && r.n2 === 6 && r.quiet && !r.paused && r.lines.every(l => l.length > 20 && !/[✨]/.test(l)) && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return '6 steps the first time in the house, not again on the next visit; the ❓ sign repeats them';
});

await check('wayfind', async () => {
  // (Round U) "Where is…?": the 🧭 button shows pictures (home, my house, Ông Cú, the market, every village and city);
  // tapping Hà Nội lays sparkles along the roads ahead of the child, a new stretch as they walk; arriving says so and
  // the sparkles go; every place in the valley can be reached along the roads from home
  const P = await open(b, { w: 1280, h: 800 });
  const r = await P.page.evaluate(async () => {
    const C = await import('/js/custom.js'); C.CUSTOM.releases = { ...(C.CUSTOM.releases || {}), wayfind: { on:true, controlVersion:1 } };
    const G = __sv, h = G.heroes[0], W = await import('/js/world.js'), F = await import('/js/wayfind.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    for (let k = 0; k < 50 && !G.wayfind; k++) await wait(100);
    // (owner, 13 Oct AEDT) Where is sits in the View tray: open the tray first, as a child does
    { const tray = document.querySelector('.hud .z-tray'); if (tray && !tray.closest('.zoomer').classList.contains('open')) { tray.click(); await wait(250); } }
    const btn = document.querySelector('.hud .z-where'), bb = btn.getBoundingClientRect(); btn.click(); await wait(300);
    const picks = [...document.querySelectorAll('.wherepick .wp-pick')], drawn = picks.every(p => p.querySelector('.art')), names = picks.map(p => p.getAttribute('aria-label'));
    const hanoi = picks.find(p => /Hà Nội|Hanoi/.test(p.getAttribute('aria-label'))); hanoi.click(); await wait(500);
    // (Round V, owner 13 Oct) a choice: Fly there or Walk with the sparkles; Walk here
    const ch = [...document.querySelectorAll('.dialog .dch')], two = ch.length === 2; if (ch[1]) ch[1].click(); await wait(800);
    const t = G.wayfind.trail, shown = G.wayfind.shown;
    const off = shown.filter(([x, z]) => { const d = W.roadDist(x, z); return !(d.road && d.d <= d.road.w / 2 + .3) && W.edgeDist(x, z) > .3; }).map(p => p.map(Math.round)), onRoad = !off.length;   // (on a road, or a place's paved street)
    const gaps = t.pts.slice(1, -1).every((p, k) => Math.hypot(p[0] - t.pts[k][0], p[1] - t.pts[k][1]) < 6.5);
    // walk a stretch: the sparkles move on ahead
    const mid = t.pts[16]; h.place(mid[0], mid[1]); await wait(1300); const moved = G.wayfind.trail && G.wayfind.trail.i > 10 && G.wayfind.shown.length > 5;
    const end = G.PLACES.find(p => p.key === 'hanoi'); h.place(end.x + 3, end.z + 3); await wait(1300); const arrived = !G.wayfind.trail && G.wayfind.shown.length === 0;
    // Fly: straight there
    document.querySelector('.hud .z-where').click(); await wait(300);
    const mk = [...document.querySelectorAll('.wherepick .wp-pick')].find(p => /Three Regions|Ba Miền/.test(p.getAttribute('aria-label'))); mk.click(); await wait(500);   // (a place where no story starts)
    const ch2 = [...document.querySelectorAll('.dialog .dch')]; if (ch2[0]) ch2[0].click();
    const lt = G.wayfind.targets().find(x => /Three Regions|Ba Miền/.test(x.name())); let flown = false;
    for (let k = 0; k < 80 && !flown; k++) { await wait(150); flown = !!lt && Math.hypot(h.pos.x - lt.x, h.pos.z - lt.z) < 25; } for (let k = 0; k < 40 && G.paused; k++) await wait(150);
    // every target can be reached from home
    const g = F.roadGraph(G.PLACES), home = G.PLACES.find(p => p.key === 'farm'), unreachable = G.wayfind.targets().filter(x => { const r = F.route(g, home.x, home.z, x.x, x.z); return !r || Math.hypot(r.pts[r.pts.length - 2][0] - x.x, r.pts[r.pts.length - 2][1] - x.z) > 40; }).map(x => x.id);
    return { off, size: Math.min(bb.width, bb.height), picks: picks.length, drawn, names: names.slice(0, 5), shown: shown.length, onRoad, gaps, len: Math.round(t.pts.length * 4), moved, arrived, unreachable, paused: G.paused, two, flown };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.size >= 44 && r.picks >= 16 && r.two && r.flown && r.drawn && r.shown >= 20 && r.onRoad && r.gaps && r.moved && r.arrived && !r.unreachable.length && !r.paused && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.picks} pictures to choose from; to Hà Nội: ${r.shown} sparkles at a time on the roads (about ${r.len} m), moving on ahead, gone on arrival; Fly or Walk after choosing (flown to the market); every place reachable from home`;
});

await check('animalhomes', async () => {
  // (Round U) animals with homes: Lotus Village's hens walk into their coop at dusk and come out in the morning; the
  // ducks gather in the middle of the lake for the night; the village dog follows a child who visits, then goes home
  const P = await open(b, { w: 900, h: 640 });
  const r = await P.page.evaluate(async () => {
    const G = __sv, W = G.world, h = G.heroes[0], wait = ms => new Promise(r => setTimeout(r, ms)), S = await import('/js/state.js');
    for (let k = 0; k < 80 && !G.animalHomes; k++) await wait(100);
    const A = G.animalHomes; let t = 0; S.settings.alwaysDay = false;
    const run = secs => { G.paused = false; for (let i = 0; i < secs * 10; i++) { t += .1; W.update(.1, t); } G.paused = true; };
    const V = G.PLACES.find(p => p.key === 'village'); h.place(A.coop.x + 6, A.coop.z + 6); G.paused = true;
    const spread0 = A.ducks.reduce((s, c) => s + Math.hypot(c.cx - A.lake[0], c.cz - A.lake[1]), 0) / A.ducks.length;
    W.time = .86; run(45);
    const night = { hensIn: A.hens.filter(a => a.inside).length, hens: A.hens.length, littleIn: A.critHens.filter(c => c.inside).length, little: A.critHens.length, ducks: A.ducks.reduce((s, c) => s + Math.hypot(c.cx - A.lake[0], c.cz - A.lake[1]), 0) / A.ducks.length };
    W.time = .4; run(30);
    const day = { hensOut: A.hens.filter(a => !a.inside && a.m.visible).length, littleOut: A.critHens.filter(c => !c.inside && c.s.visible).length, ducks: A.ducks.reduce((s, c) => s + Math.hypot(c.cx - A.lake[0], c.cz - A.lake[1]), 0) / A.ducks.length };
    // the dog: the child stands beside it, then walks off a few metres; the dog comes along
    const d = A.dog.m.position; h.place(d.x + 3, d.z); run(1); const h0 = [h.pos.x, h.pos.z];
    // (r70) the village animals never step on a road (js/lotus.js okSpot), so the child walks off where the way stays off the
    // road (the old fixed 6 m east sometimes ended on the village road: the dog waited at its edge, on r69 too)
    const { roadDist } = await import('/js/world.js'), offRoad = (x, z) => { const q = roadDist(x, z); if (q.d < q.road.w / 2 + 1.5) return false; const p = { x, z }; W.collide(p, .6); return Math.hypot(p.x - x, p.z - z) < .01; };   // off the road and clear of fences and houses, as okSpot
    const way = [[6, 2], [-6, 2], [2, 6], [2, -6], [-6, -2], [6, -2]].find(([dx, dz]) => [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1].every(k => offRoad(d.x + dx * k, d.z + dz * k) && offRoad(h0[0] + dx * k, h0[1] + dz * k))) || [6, 2];
    h.place(h0[0] + way[0], h0[1] + way[1]); run(8);
    const follows = !!A.dog.following && Math.hypot(d.x - h.pos.x, d.z - h.pos.z) < 4;
    h.place(V.x + 80, V.z + 80); run(1); const goneHome = !A.dog.following;
    G.paused = false;
    return { coop: !!A.coop, night, day, spread0: +spread0.toFixed(1), follows, goneHome };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.coop && r.night.hens >= 3 && r.night.hensIn === r.night.hens && r.night.littleIn === r.night.little && r.night.ducks < r.spread0 * .6 && r.day.hensOut === r.night.hens && r.day.littleOut === r.night.little && r.day.ducks > r.night.ducks && r.follows && r.goneHome && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.night.hens} hens and ${r.night.little} little hens into the coop at night and out in the morning; ducks together on the lake at night; the village dog follows a visiting child and goes home`;
});

await check('ownertransportpov', async () => {
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const rows = [];
  const kinds=await P.page.evaluate(()=>{const G=__sv,ids=G.interactables.filter(i=>/^ride_/.test(i.id)).map(i=>G.traffic.slots[+i.id.slice(5)].id);if(G.interactables.some(i=>/^xichlo_/.test(i.id)))ids.push('xichlo');return [...new Set(ids)].sort();});
  // Cover every actual boarding action; this layout has no moving taxi boarding slot.
  ok(['bus','busAU','tramModern','touristCart','xichlo'].every(id=>kinds.includes(id)), 'Missing public ride coverage: '+kinds);
  for (const age of ['little', 'big']) for (const kind of kinds) {
    await P.page.evaluate(({age,kind}) => {
      const G=__sv,h=G.heroes[0]; h.profile.age=age;h.av.root.scale.setScalar(age==='little'?.72:.9);
      const i=G.interactables.find(i=>kind==='xichlo'?/^xichlo_/.test(i.id):/^ride_/.test(i.id)&&G.traffic.slots[+i.id.slice(5)].id===kind);
      if(!i) throw Error('No actual public transport '+kind);
      h.place(i.x+2,i.z); window.__povBoard=i.act(h,G);
    }, {age,kind});
    if(kind!=='xichlo'){await P.page.locator('.dialog .dchoices button').first().click();await P.page.locator('.stoppick [data-next]').click();}
    await P.page.evaluate(async()=>{await window.__povBoard; const G=__sv,h=G.heroes[0]; const sl=G.traffic.slots.find(s=>s.passenger===h); if(!sl)throw Error('Boarding failed'); sl.mover.wait=100; G.paused=true; /* (v1.07) the check drives the frames itself: the game's own clock waits, so a slow page does not count 2 s of waiting as the bus reaching its next stop */ const before=h.view||'follow'; for(let k=0;k<90;k++)h.update(1/60,{cdx:0,cdy:0,mx:0,mz:0,jump:()=>false},k/60,G); if((h.view||'follow')!==before)throw Error('A passenger ride changed the camera view (owner, 30 Oct AEDT: someone else drives, the usual camera stays): '+h.view);});
    // Synthetic targets prove the actual rendered sightline, not just camera coordinates.
    const r=await P.page.evaluate(async({age,kind})=>{
      const G=__sv,h=G.heroes[0],sl=G.traffic.slots.find(s=>s.passenger===h),{THREE}=await import('/js/gfx.js');
      const bounds=new THREE.Box3().setFromObject(sl.v.o),forward=new THREE.Vector3(Math.sin(h.yaw),0,Math.cos(h.yaw));
      const target=new THREE.Mesh(new THREE.PlaneGeometry(3,2),new THREE.MeshBasicMaterial({color:'#ff00ff',side:THREE.DoubleSide}));
      const span=bounds.getSize(new THREE.Vector3()).length()/2+1;
      target.position.copy(sl.v.o.position).addScaledVector(forward,span); target.position.y=h.cam.position.y; target.rotation.y=h.yaw; h.scene.add(target);
      try {
        const image=new Image();image.src=G.snapshot(0,900,1);await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;let seen=0;
        for(let i=0;i<data.length;i+=4)if(data[i]>180&&data[i+1]<90&&data[i+2]>180)seen++;
        const before=sl.v.o.children.map(child=>[child,child.visible]),own=h.av.root.visible;
        const {withRideView}=await import('/js/rideview.js');let raised=false;
        try{withRideView(h,()=>{throw Error('render failure fixture');});}catch(e){raised=e.message==='render failure fixture';}
        const restored=raised&&h.av.root.visible===own&&before.every(([child,visible])=>child.visible===visible);
        const local=sl.v.o.worldToLocal(h.cam.position.clone()),cab=sl.v.cabin;
        if(kind==='touristCart'&&!cab)throw Error('Electric cart must use the scoped open-windscreen renderer');
        const insideWindow=!cab||(local.y>=cab.bottom&&local.y<=cab.top);
        return {age,kind,seen,pov:h._pov,restored,insideWindow};
      }finally{h.scene.remove(target);target.geometry.dispose();target.material.dispose();}
    },{age,kind}); rows.push(r);
    await P.page.evaluate(()=>{const G=__sv,h=G.heroes[0];G.paused=false;h.update(1/60,{cdx:0,cdy:0,mx:0,mz:0,jump:()=>true},0,G);});
  }
  await P.ctx.close(); ok(rows.every(r=>r.pov&&r.seen>200&&r.restored&&r.insideWindow),JSON.stringify(rows));
  return JSON.stringify(rows);
});

await check('ride', async () => {
  // (Round U, owner 11 Oct: "all vehicles can be ridden, public transport can get in with fares") every parked car and
  // motorbike can be driven (Jump gets off); a bus takes a big kid for its fare and an under-5 for free, to the next stop;
  // every bus route has a stop with its picture timetable; a moving private car never offers a lift
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page); const page = P.page;
  const r = await page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], T = G.traffic, I = G.interactables, out = {};
    out.drive = I.filter(i => /^drive_/.test(i.id)).length; out.bike = I.filter(i => /^bike_/.test(i.id)).length;
    out.rides = I.filter(i => /^ride_/.test(i.id)).length; out.stops = (G.world.busStops || []).length;
    out.lift = T.slots.filter(s => s.mover && !/^(bus|tram|taxi|touristCart|xichlo)/.test(s.id)).some(s => I.some(i => i.id === 'ride_' + T.slots.indexOf(s)));
    // drive a parked car
    const car = I.find(i => /^drive_/.test(i.id) && /car/i.test(i.label())); if (car) { h.place(car.x + 1, car.z); car.act(h, G); out.driving = !!h.riding && !!h.riding.vehicle;
      // (Round V, owner 13 Oct) the camera rides at the child's eyes, looking ahead
      h.finish(1 / 60, 0, G, 0); out.streetFirst = h.view === 'street'; G.setView(0, 'follow', true); // (owner, 30 Oct 2026 AEDT) driving starts in Street view; Behind me is the rider's eyes
      for (let k = 0; k < 60; k++) h.finish(1 / 60, k / 60, G, 0); const eyeUp = h.cam.position.y - h.pos.y, eyeNear = Math.hypot(h.cam.position.x - h.pos.x, h.cam.position.z - h.pos.z); out.pov = eyeUp > .8 && eyeUp < 2.6 && eyeNear < 1.2;
      // drive it away and get off: (owner, 17 Oct AEDT, #354: "stay where left"; was: back once the child walked 20 m
      // away) it waits where it was left while the child is 40 m away, and goes back to its parking spot once every child
      // is far away (70 m)
      const sl = G.traffic.slots.find(x => x.v && x.v.o === h.riding.mesh), home = sl ? [sl.x, sl.z] : null; h.pos.x += 30; h.riding.mesh.position.x += 30; h.dismount(); out.off = !h.riding;
      const atHome = () => !!home && Math.hypot(sl.v.o.position.x - home[0], sl.v.o.position.z - home[1]) < 1, left = [sl.v.o.position.x, sl.v.o.position.z];
      // (r84: the scan runs every 0.4 s of game time, and a slow machine gives the game few frames in a second) it is
      // watched for 3 s at 40 m (still where it was left) and for up to 8 s at 70 m (back at its spot)
      h.place(left[0] + 40, left[1]); await new Promise(r => setTimeout(r, 3000)); out.carStays = !atHome() && Math.hypot(sl.v.o.position.x - left[0], sl.v.o.position.z - left[1]) < .5;
      h.place(left[0] + 70, left[1]); for (let k = 0; k < 32 && !atHome(); k++) await new Promise(r => setTimeout(r, 250)); out.carBack = atHome(); }
    // (#354, owner 17 Oct AEDT: "all animals and vehicles can travel anywhere") a bicycle rides over every bridge, end to
    // end, on its deck (the Dragon Bridge in a lane beside the dragon); before, every ride stopped at the first plank
    { const w = await import('/js/world.js'), bike = I.find(i => /^bike_/.test(i.id)), pad = { cdx: 0, cdy: 0, mx: 0, mz: 1, jump: () => false, act: () => false, run: false };
      out.bridges = []; for (const B of w.BRIDGES) {
        h.place(bike.x + 1, bike.z); bike.act(h, G); const lane = B.style === 'dragon' ? 2.2 : 0, u0 = B.a0 - 6, u1 = B.a1 + 6, cy = B.axis === 'x' ? -Math.PI / 2 : Math.PI;
        const [x, z] = B.axis === 'x' ? [u0, B.c + lane] : [B.c + lane, u0]; h.pos.set(x, G.world.groundAt(x, z), z); h.riding.mesh.position.copy(h.pos);
        let deck = false; for (let k = 0; k < 600; k++) { h.camYaw = h.steerYaw = cy; h.update(1 / 30, pad, k / 30, G); const u = B.axis === 'x' ? h.pos.x : h.pos.z; if (u > B.a0 + 2 && u < B.a1 - 2 && h.pos.y > w.WATER + 1) deck = true; if (u > u1) break; }
        if (!((B.axis === 'x' ? h.pos.x : h.pos.z) > u1 - 1 && deck)) out.bridges.push(B.id); h.dismount(); }
      out.bridgeCount = w.BRIDGES.length; }
    // a buffalo: ride it away, get off: it runs back home
    const bf = (G.world.buffalo || [])[0]; if (bf) { h.place(bf.mesh.position.x + 1, bf.mesh.position.z); G.mount(h, bf); h.pos.x += 12; bf.mesh.position.x += 12; h.dismount(); out.buffHome = bf.tx === bf.home[0] && bf.tz === bf.home[1] && bf.back === true; }
    return out;
  });
  // a bus: a big kid pays, an under-5 rides free
  const bus = async age => page.evaluate(async age => {
    const G = __sv, h = G.heroes[0], I = G.interactables, { farm } = await import('/js/state.js');
    h.profile.age = age; farm.coins = 50; const c0 = farm.coins;
    const it = I.find(i => /^ride_/.test(i.id) && G.traffic.slots[+i.id.slice(5)].id.startsWith('bus')); if (!it) return { none: true };
    h.place(it.x + 2, it.z); const p = it.act(h, G);
    await new Promise(res => { const t = setInterval(() => { const c = document.querySelectorAll('.dialog .dchoices button'); if (c.length) { clearInterval(t); setTimeout(() => { c[0].click(); res(); }, 500); } }, 100); setTimeout(res, 8000); });
    // (Round V, owner 13 Oct) where to: every stop in the valley; the child arrives at the one chosen
    await new Promise(res => { const t = setInterval(() => { const k = document.querySelector('.stoppick .wp-pick'); if (k) { clearInterval(t); res(); } }, 100); setTimeout(res, 6000); });
    const picks = document.querySelectorAll('.stoppick .wp-pick').length, first = document.querySelector('.stoppick .wp-pick'); const name = first ? first.getAttribute('aria-label') : '';
    const dest = (G.world.busStops || []).find(b => b.name() === name); first && first.click();
    await p; const on = !!h.carry, paid = c0 - farm.coins;
    // (owner, 18 Oct AEDT: a trip takes about a minute, at most about 65 s: js/traffic.js tripTo) up to 80 s to arrive
    let arrived = false; for (let k = 0; k < 320 && !arrived; k++) { await new Promise(r => setTimeout(r, 250)); arrived = !h.carry && !!dest && Math.hypot(h.pos.x - dest.x, h.pos.z - dest.z) < 4; }
    h.carry = null; G.traffic.slots.forEach(s => { if (s.passenger === h) s.passenger = null; });
    return { on, paid, picks, arrived };
  }, age);
  r.big = await bus('big'); r.little = await bus('little');
  const errs = P.errors; await P.ctx.close();
  ok(r.drive >= 20 && r.bike >= 4 && r.rides >= 4 && r.stops >= 4 && !r.lift && r.driving && r.streetFirst && r.off && r.big.on && r.big.paid > 0 && r.little.on && r.little.paid === 0 && r.big.picks >= 3 && r.big.arrived && r.pov && r.carStays && r.carBack && r.buffHome && r.bridgeCount >= 10 && !r.bridges.length && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.drive} parked cars and motorbikes to drive, ${r.bike} bicycles, ${r.rides} buses, trams and taxis to ride (big kid paid ${r.big.paid}, under-5 free), ${r.stops} bus stops, each stop a choice of ${r.big.picks} places and the child arrives there; the camera rides at the child's eyes; a car left behind waits where it was left and goes back to its spot once every child is far away; a buffalo runs home; a bicycle rides over all ${r.bridgeCount} bridges; no lifts from strangers`;
});

await check('ownerdecoroverlap', async () => {
  return await ownerSmoke('owner-decor-overlap.mts');
});

await check('ownerdecorworld', async () => {
  return await ownerSmoke('owner-decor-world.mts');
});

await check('ownerroadsafety', async () => {
  return await ownerSmoke('owner-road-safety.mts');
});

await check('gateview', async () => (await import('../gate-view.mts')).gateViewCheck(b));

await check('realrides', async () => {
  // (owner, 17 Oct AEDT: "the bus and tram travel time to different destinations are too quick, rider should be able to
  // enjoy the real view and distance") a ride to a chosen stop really drives the roads there, with the child on board,
  // taking about a minute for the farthest stop (Jump still gets off); the child is let off at that stop and the bus
  // drives back to its own route
  const P = await open(b, { w: 900, h: 640, settings: { voice: false } }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], W = await import('/js/world.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    const keepOn = (await import('/js/custom.js')); void keepOn;
    const sl = G.traffic.slots.find(s => s.mover && /^bus/.test(s.id)); if (!sl.v) G.traffic.make(sl);
    const it = G.interactables.find(i => i.id === 'ride_' + G.traffic.slots.indexOf(sl)); if (!it) return { none: 'no ride' };
    h.place(sl.v.o.position.x + 3, sl.v.o.position.z + 3); h.profile.age = 'little'; await wait(300);
    const go = it.act(h); await wait(600);
    const yes = [...document.querySelectorAll('.dialog button, .dialog .btn')].find(x => /Get on|Lên xe/.test(x.textContent)); if (!yes) return { none: 'no get-on button', html: (document.querySelector('.dialog') || {}).innerText };
    yes.click(); await wait(800);
    const stops = [...document.querySelectorAll('.stoppick [data-k]')]; if (!stops.length) return { none: 'no stop picker' };
    // the farthest stop on the list
    const { destinationStops } = await import('/js/travel-stops.js');
    const list = destinationStops(G.world.busStops, h.pos);
    if (stops.length !== list.length) return { none: 'picker and destination model disagree', cards: stops.length, destinations: list.length };
    let far = 0; list.forEach((b, k) => { if (Math.hypot(b.x - h.pos.x, b.z - h.pos.z) > Math.hypot(list[far].x - h.pos.x, list[far].z - h.pos.z)) far = k; });
    stops[far].click(); await go; await wait(500);
    const tr = sl.trip; if (!tr) return { none: 'no trip' };
    const p0 = [sl.v.o.position.x, sl.v.o.position.z], s0 = tr.s; await wait(3000); const along = tr.s - s0; // (game time: a slow test browser runs the game's clock slower)
    const p1 = [sl.v.o.position.x, sl.v.o.position.z], moved = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), rd = W.roadDist(p1[0], p1[1]);
    const onBoard = !!h.carry && Math.hypot(h.pos.x - p1[0], h.pos.z - p1[1]) < 3, planned = tr.len / tr.speed;
    // the rest of the way, quickly: the trip arrives and the child gets off at the stop
    tr.s = tr.len - .5; await wait(1200); const dest = list[far], off = !h.carry && Math.hypot(h.pos.x - dest.x, h.pos.z - dest.z) < 4;
    tr.s = Math.min(tr.s, 1); await wait(1500);
    return { len: Math.round(tr.len), planned: +planned.toFixed(1), moved: +moved.toFixed(1), along: +along.toFixed(1), onRoad: rd.road ? +(rd.d - rd.road.w / 2).toFixed(2) : 99, onBoard, off, home: !sl.trip, stop: dest.name() };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.none && r.moved > 2 && Math.abs(r.moved - r.along) < 2 && r.onRoad < .5 && r.onBoard && r.planned >= 45 && r.planned <= 70 && r.off && r.home && !errs.length, JSON.stringify({ ...r, errs }));
  return `a bus to the farthest stop (${r.stop}, ${r.len} m along the roads) drives there with the child on board, planned ${r.planned} s; ${r.moved} m along the road in the first moments, on the road; the child gets off at the stop and the bus goes back to its route`;
});

// (owner, 30 Oct 2026 AEDT) the Vietnamese yellow cow beside the water buffalo: both are ridden, both swim across deep
// water with the rider's head above it and climb out again; the cow has its own drawing
await check('ridecowswim', async () => {
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], Wm = await import('/js/world.js'), A = await import('/js/art.js'), W = G.world, L = Wm.LAKE, out = [];
    const pad = { mx: 0, mz: 0, cdx: 0, cdy: 0, jump: () => false, act: () => false };
    for (const animal of [W.cows[0], W.buffalo[0]]) {
      G.paused = true; G.mount(h, animal);
      let sx = L.x; for (let d = 0; d < 90; d++) if (Wm.heightAt(L.x + d, L.z) > Wm.WATER + .2) { sx = L.x + d + 3; break; }
      h.pos.set(sx, Wm.heightAt(sx, L.z), L.z); h.goal = { x: L.x, z: L.z }; let deep = 0, low = 0, headLow = 0;
      for (let k = 0; k < 900; k++) { h.update(1 / 60, pad, k / 60, G); if (Wm.heightAt(h.pos.x, h.pos.z) < Wm.WATER - 3) { deep++; if (h.pos.y < Wm.WATER - Wm.RIDE_SWIM - .01) low++; if (h.av.root.position.y + 1 < Wm.WATER) headLow++; } }
      const far = Math.hypot(h.pos.x - L.x, h.pos.z - L.z); h.goal = { x: sx + 6, z: L.z }; for (let k = 0; k < 1200; k++) h.update(1 / 60, pad, k / 60, G);
      out.push({ kind: animal.kind, riding: !!h.riding, deep, low, headLow, reached: far < 3, out: Wm.heightAt(h.pos.x, h.pos.z) > Wm.WATER });
      h.dismount(); G.paused = false;
    }
    const labels = G.interactables.filter(i => /^(cow|buffalo)\d$/.test(i.id)).map(i => i.label());
    return { rows: out, cows: W.cows.length, labels, cowArt: A.pic('🐄') !== A.pic('🐂') };
  });
  await P.ctx.close();
  ok(r.cows >= 2 && r.labels.filter(l => /cow/i.test(l)).length >= 2 && r.cowArt, JSON.stringify(r));
  ok(r.rows.every(x => x.riding && x.deep > 60 && !x.low && !x.headLow && x.reached && x.out), JSON.stringify(r.rows));
  return r.rows.map(x => `${x.kind}: swam ${(x.deep / 60).toFixed(1)} s over deep water, head above it, out again`).join('; ');
});

await check('ridingcamera', async () => (await import('../riding-camera.mts')).ridingCameraCheck(b));

await check('rememberedhomes', async () => (await import('../remembered-homes.mts')).rememberedHomesCheck(b));

await check('rigidmodels', async () => (await import('../rigid-models.mts')).rigidModelsCheck(b));

await check('areastream', async () => {
  // (v1.08d valley, owner 5 Nov 2026 AEDT: "the valley building as the child walks"; js/areas.ts) parts of the valley are
  // built after the start: the ones near the child at once, nearest first; a far one when the child flies there (built
  // while the blue fade is up); far parts sleep (hidden, their every-frame work stopped) and wake when the child comes
  // back. Here the child flies to every part three times round: each is built by its first landing, everything it made
  // that can be tapped stands on open ground the child can reach, far parts sleep, and the graphics memory stops growing
  // from the second round (each part is built once, never again).
  const P = await open(b, { w: 900, h: 640, pre: () => { (window as any).__svAreaStream = true; } });
  try {
    await clear(P.page);
    const home = await P.page.evaluate(async () => { const W = await import('/js/world.js'); const x = W.PLATEAU.x - 3, z = W.PLATEAU.z - 4; __sv.heroes[0].place(x, z); return { x, z }; });
    // the parts near home are built within a few seconds, while the child stands there; far ones wait
    await P.page.waitForFunction(([x, z]) => __sv.areas.list().filter(a => Math.hypot(a.x - x, a.z - z) < 140).every(a => a.built), [home.x, home.z], { timeout: 60000 });
    const first = await P.page.evaluate(() => __sv.areas.list());
    // villagers far from the child wait as stand-ins (js/avatar.ts lateAvatar); those round a landing spot are built on landing
    const late0 = await P.page.evaluate(() => __sv.areas.late());
    const landed = await P.page.evaluate(async () => { const A = await import('/js/avatar.js'), s = A.lateSpots()[0]; if (!s) return null; const n0 = __sv.areas.late(); await __sv.travel(__sv.heroes[0], s[0], s[1]);
      return { n0, n1: __sv.areas.late(), stillThere: A.lateSpots().some(q => Math.hypot(q[0] - s[0], q[1] - s[1]) < 5) }; });
    ok(late0 > 0 && landed && landed.n1 < landed.n0 && !landed.stillThere, 'stand-in villagers: ' + JSON.stringify({ late0, landed }));
    const near = first.filter(a => Math.hypot(a.x - home.x, a.z - home.z) < 140), far = first.filter(a => Math.hypot(a.x - home.x, a.z - home.z) > 160);
    ok(first.length >= 10 && near.length && near.every(a => a.built), 'the parts near home were not built: ' + JSON.stringify(first));
    ok(far.length && far.some(a => !a.built), 'no far part waited for the child: ' + JSON.stringify(first));
    const mem = () => P.page.evaluate(() => ({ geo: __sv.renderer.info.memory.geometries, tex: __sv.renderer.info.memory.textures }));
    const rounds = [], bad = [];
    for (let round = 0; round < 3; round++) {
      for (const a of first) {
        const r = await P.page.evaluate(async ({ id, x, z }) => {
          const G = __sv, h = G.heroes[0], W = G.world; await G.travel(h, x, z);
          await G.solidsReady;
          // (the sleeping is looked at four times a second, on the game's own frames: a few seconds here, where frames are slow)
          for (let k = 0; k < 50 && G.areas.list().find(p => p.id === id)?.asleep; k++) await new Promise(r => setTimeout(r, 100));
          const part = G.areas.list().find(p => p.id === id);
          // what this part made that can be tapped: on open ground (not inside anything solid), on dry land or a jetty
          const its = G.interactables.filter(it => Number.isFinite(it.x) && Math.hypot(it.x - x, it.z - z) < 30 && (/^(sym_|crossing_)/.test(it.id)));
          const stuck = its.filter(it => { const p = { x: it.x, y: W.groundAt(it.x, it.z), z: it.z }; W.collide(p, .3); return Math.hypot(p.x - it.x, p.z - it.z) > (it.r || 2.5); }).map(it => it.id);
          return { id, built: !!part && part.built, asleep: part && part.asleep, stuck, landed: { x: +h.pos.x.toFixed(1), z: +h.pos.z.toFixed(1) } };
        }, a);
        if (!r.built || r.asleep || r.stuck.length) bad.push({ round, ...r });
      }
      // far from home now? the parts near home sleep; flying home wakes them
      const sleepy = await P.page.evaluate(() => __sv.areas.list().filter(p => p.asleep).map(p => p.id));
      await P.page.evaluate(({ x, z }) => __sv.travel(__sv.heroes[0], x, z), home);
      await P.page.waitForFunction(([x, z]) => __sv.areas.list().every(p => Math.hypot(p.x - x, p.z - z) >= 100 || !p.asleep), [home.x, home.z], { timeout: 8000 }).catch(() => { });
      const awake = await P.page.evaluate(([x, z]) => __sv.areas.list().filter(p => Math.hypot(p.x - x, p.z - z) < 100 && p.asleep).map(p => p.id), [home.x, home.z]);
      rounds.push({ ...(await mem()), sleepy: sleepy.length, stillAsleepAtHome: awake });
    }
    const left = await P.page.evaluate(() => __sv.areas.left());
    const lateAll = await P.page.evaluate(async () => { await __sv.areas.all(); return { late: __sv.areas.late(), broken: (await import('/js/avatar.js')).OUTLINED.filter(A => !A.rig || !A.anim).length }; });
    ok(lateAll.late === 0 && lateAll.broken === 0, 'stand-ins left after building all: ' + JSON.stringify(lateAll));
    ok(!bad.length, 'parts not built, asleep where the child landed, or with something out of reach: ' + JSON.stringify(bad));
    ok(left === 0, left + ' parts were never built');
    ok(rounds.every(r => !r.stillAsleepAtHome.length) && rounds.some(r => r.sleepy > 0), 'parts did not sleep far away or did not wake at home: ' + JSON.stringify(rounds));
    // (the first two rounds also fill the game's own caches as places are seen; from the second round on it is level)
    ok(rounds[2].geo <= rounds[1].geo * 1.03 + 20 && rounds[2].tex <= rounds[1].tex * 1.03 + 5, 'the graphics memory kept growing: ' + JSON.stringify(rounds));
    ok(!P.errors.length, P.errors.join(' | '));
    return `${late0} villagers waited as stand-ins (built on landing near them); ${first.length} parts after the start: ${near.length} near home built at once, ${far.filter(a => !a.built).length} far ones built when the child flew there; every part reachable; far parts sleep (${rounds[0].sleepy} on the last flight out) and wake at home; graphics ${rounds.map(r => r.geo + '/' + r.tex).join(', ')} shapes/pictures over 3 rounds`;
  } finally { await P.ctx.close(); }
});
