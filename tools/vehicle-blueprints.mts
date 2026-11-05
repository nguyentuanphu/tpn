// (v1.08e vehicles) The blueprints for the Blender vehicles: the game's own code shapes (js/vehicles.ts, js/ferry.ts),
// read in a browser and written as plain parts (triangles, corner colours, where each moving part turns), so
// tools/blender/world-vehicles.py rebuilds every vehicle at exactly the size, place and facing of its code shape.
//   node tools/build.mts && python3 -m http.server 8765 &   then   node tools/vehicle-blueprints.mts <out.json>
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { writeFileSync } from 'node:fs';
const out = process.argv[2] || 'vehicle-blueprints.json', URL = process.env.SV_URL || 'http://localhost:8765/';
const b = await chromium.launch(), page = await b.newPage();
await page.goto(URL + 'tests/fixtures/', { waitUntil: 'domcontentloaded' }).catch(() => page.goto(URL));
const data = await page.evaluate(async () => {
  const V = await import(String('/js/vehicles.js')), F = await import(String('/js/ferry.js')), THREE = await import(String('/vendor/three.module.js'));
  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  // one vehicle: its parts (the body, each wheel, each moving group), each in its own space, with the parent it hangs from
  function dump(o: any, v: any) {
    const roles = new Map<any, string>();
    (v.wheels || []).forEach((w: any, i: number) => roles.set(w, 'wheel' + i));
    for (const [k, g] of Object.entries(o.userData || {})) if (g && (g as any).isObject3D && k !== 'load') roles.set(g, k);
    if (v.roof) roles.set(v.roof, 'roof');
    const parts: any[] = [];
    o.updateMatrixWorld(true);
    const inv = new THREE.Matrix4();
    function walk(n: any, part: any) {
      if (roles.has(n)) {
        const parent = part; part = { name: roles.get(n), parent: parent ? parent.name : null, tris: [], cols: [] };
        const pm = parent ? parent.node.matrixWorld : o.matrixWorld, m = inv.copy(pm).invert().multiply(n.matrixWorld);
        const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); m.decompose(p, q, s);
        part.pos = p.toArray().map(r3); part.quat = q.toArray().map(r3); part.node = n; parts.push(part);
      }
      if (n.isMesh && n.visible && !n.userData.outline && !n.isSprite && n.geometry.attributes.position) {
        const m = inv.copy(part.node.matrixWorld).invert().multiply(n.matrixWorld);
        const g = n.geometry.index ? n.geometry.toNonIndexed() : n.geometry, a = g.attributes.position, c = g.attributes.color, v3 = new THREE.Vector3();
        const base = n.material && n.material.color ? n.material.color : new THREE.Color(1, 1, 1);
        for (let i = 0; i < a.count; i++) { v3.fromBufferAttribute(a, i).applyMatrix4(m); part.tris.push(r3(v3.x), r3(v3.y), r3(v3.z));
          if (c) part.cols.push(r3(c.getX(i) * base.r), r3(c.getY(i) * base.g), r3(c.getZ(i) * base.b)); else part.cols.push(r3(base.r), r3(base.g), r3(base.b)); }
      }
      for (const ch of n.children) walk(ch, part);
    }
    const root = { name: 'body', parent: null, pos: [0, 0, 0], quat: [0, 0, 0, 1], tris: [], cols: [], node: o }; parts.push(root);
    for (const ch of o.children) walk(ch, root);
    const pts: Record<string, number[]> = {};
    const put = (k: string, p: any) => { if (p) pts[k] = p.map(r3); };
    put('seat', v.seat); put('seat2', v.passenger); put('wheelAt', v.wheelAt);
    if (v.grips) { put('handleL', v.grips[0]); put('handleR', v.grips[1]); }
    if (v.feet) { put('pedalL', v.feet[0]); put('pedalR', v.feet[1]); }
    if (v.pgrips) { put('handle2L', v.pgrips[0]); put('handle2R', v.pgrips[1]); }
    if (v.pfeet) { put('pedal2L', v.pfeet[0]); put('pedal2R', v.pfeet[1]); }
    return { parts: parts.filter(p => p.tris.length || p.name !== 'body').map(({ node, ...p }) => p), points: pts, wr: v.wr };
  }
  const all: Record<string, any> = {};
  for (const id of Object.keys(V.VEHICLES)) { const v = V.build(id); all['veh-' + id] = dump(v.o, v); }
  const ferry = F.ferryBoat(false); ferry.children.filter((c: any) => !c.isMesh || c.geometry.type === 'PlaneGeometry').forEach((c: any) => { c.visible = false; });
  all['boat-ferry'] = dump(ferry, { wheels: [] });
  const raft = F.bambooRaft(); raft.children.forEach((c: any) => { if (c !== raft.children[0]) c.visible = false; });
  all['boat-raft'] = dump(raft, { wheels: [] });
  return all;
});
await b.close();
writeFileSync(out, JSON.stringify(data));
for (const [k, v] of Object.entries<any>(data)) console.log(k, v.parts.map((p: any) => `${p.name}:${p.tris.length / 9}`).join(' '));
