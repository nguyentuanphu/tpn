// (v1.08e creatures) Reads the game's own creature shapes (js/animals.ts, js/companion.ts) part by part, so the Blender
// models (tools/blender/world-creatures.py) stand exactly where the code shapes stand, at the same size, facing +z.
// Each part is one primitive (sphere, capsule, cylinder, cone, box, torus) with its colour, place, turn and stretch,
// grouped by the pivot that moves it (body, head, ears, tail, legs, wings).
//   node tools/build.mts && node tools/blender/creatures-dump.mts   → tools/blender/creatures-spec.json
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'tools/blender/creatures-spec.json');
const TYPES = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/dump.html') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<!doctype html><body></body>'); return; }
  const f = path.join(ROOT, u); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  let body: string | Buffer = fs.readFileSync(f);
  if (u === '/js/gfx.js') {   // every part remembers what it was made from
    body = body.toString()
      .replace('const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(_m);\n  return { g, color };',
        'const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(_m);\n  return { g, color, spec: { type: geo.type, p: geo.parameters, color, pos, rot, scl: sc } };')
      .replace('g.computeBoundingSphere();\n  return g;', 'g.computeBoundingSphere(); g.userData.parts = parts.map(p => p.spec);\n  return g;');
    if (!body.includes('userData.parts')) throw new Error('gfx.js changed: update the dump');
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(body);
});
await new Promise<void>(r => server.listen(0, r));
const port = (server.address() as any).port;
const browser = await chromium.launch(); const page = await browser.newPage();
page.on('pageerror', e => console.error('page:', e.message));
await page.goto(`http://localhost:${port}/dump.html`);
const spec = await page.evaluate(async () => {
  const A = await import('/js/animals.js'), C = await import('/js/companion.js'), { THREE } = await import('/js/gfx.js');
  const round = (v: number) => Math.round(v * 10000) / 10000;
  const R = (a: any) => Array.isArray(a) ? a.map((x: any) => typeof x === 'number' ? round(x) : x) : a;
  // one pivot: its place in the animal, its parent pivot, its parts; anything that is not a toon mesh is noted by kind
  const dump = (top: any, roles: Map<any, string>) => {
    const piv: any[] = [], ids = new Map();
    top.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(top.matrixWorld).invert();
    const walk = (o: any, parent: number) => {
      const role = roles.get(o);
      let id = parent;
      if (role || o === top) {
        const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); m.decompose(p, q, s);
        const e = new THREE.Euler().setFromQuaternion(q);
        id = piv.length; ids.set(o, id); piv.push({ role: role || 'root', parent, pos: R(p.toArray()), rot: R([e.x, e.y, e.z]), parts: [], extra: [] });
      }
      for (const c of o.children) {
        if (c.isMesh && c.geometry.userData.parts && !roles.get(c)) piv[id].parts.push(...c.geometry.userData.parts.map((s: any) => ({ ...s, pos: R(s.pos), rot: R(s.rot), scl: R(s.scl) })));
        else if (c.isMesh && !roles.get(c)) { const g = c.geometry; piv[id].extra.push({ type: g.type, p: g.parameters, color: '#' + (c.material.color ? c.material.color.getHexString() : 'ffffff'), pos: R(c.position.toArray()), rot: R([c.rotation.x, c.rotation.y, c.rotation.z]), scl: R(c.scale.toArray()), glow: !!c.material.isMeshBasicMaterial, opacity: c.material.opacity }); }
        else if (c.isSprite) continue;
        else walk(c, id);
      }
    };
    walk(top, -1); return piv;
  };
  const out: any = { animals: {}, companions: {} };
  for (const kind of ['puppy', 'kitty', 'bunny', 'panda', 'joey', 'calf', 'cow', 'sheep', 'pig', 'unicorn', 'chicken', 'bear', 'koala', 'platypus', 'penguin', 'emu', 'turtle', 'elephant', 'crane', 'bull', 'buffalo', 'peacock']) {
    const g = A.filmAnimal(kind), r = g.userData.rig, roles = new Map<any, string>();
    roles.set(r.root, 'body'); if (r.head) roles.set(r.head, 'head'); if (r.tail) roles.set(r.tail, 'tail');
    r.ears.forEach((e: any, i: number) => roles.set(e, 'ear' + i));
    r.legs.forEach(([l]: any, i: number) => roles.set(l, 'leg' + i));
    const box = new THREE.Box3().setFromObject(r.root);
    out.animals[kind] = { pivots: dump(g, roles), legs: r.legs.map(([, ph, back, arm]: any) => ({ ph: round(ph), back: !!back, arm: !!arm })),
      gait: r.gait, wag: r.wag || 0, sway: r.sway || 0, swing: !!r.swing, waddle: r.waddle || 0, upright: !!r.upright, peck: !!r.peck, slow: !!r.slow,
      box: { min: R(box.min.toArray()), max: R(box.max.toArray()) } };
  }
  for (const kind of ['firefly', 'dragon']) {
    const g = C.buildCompanion(kind), u = g.userData, roles = new Map<any, string>();
    roles.set(u.body, 'body'); u.wings.forEach((w: any, i: number) => roles.set(w, 'wing' + i));
    const box = new THREE.Box3().setFromObject(u.body);
    out.companions[kind] = { pivots: dump(g, roles), flap: u.flap, box: { min: R(box.min.toArray()), max: R(box.max.toArray()) } };
  }
  return out;
});
await browser.close(); server.close();
fs.writeFileSync(OUT, JSON.stringify(spec, null, 0).replace(/\{"role"/g, '\n{"role"').replace(/,"(puppy|kitty|bunny|panda|joey|calf|cow|sheep|pig|unicorn|chicken|bear|koala|platypus|penguin|emu|turtle|elephant|crane|bull|buffalo|peacock|firefly|dragon)":/g, ',\n"$1":') + '\n');
const n = (o: any) => Object.values(o).map((a: any) => a.pivots.reduce((s: number, p: any) => s + p.parts.length, 0));
console.log('wrote', path.relative(ROOT, OUT), 'animals', Object.keys(spec.animals).length, 'parts', n(spec.animals).join(','), 'companions', n(spec.companions).join(','));
