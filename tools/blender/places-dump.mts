// (v1.08e places) Reads every code shape the game tags for a Blender model (worldTag in js/gfx.ts: landmarks, bridges,
// buildings, stalls, festival props) part by part from the running valley, so tools/blender/world-places.py builds each
// model in exactly the code shape's frame: the same place, size and facing (+z is the front, y is up).
// Each part is one primitive (box, cylinder, cone, sphere, torus, ...) with its colour, place, turn and stretch.
//   node tools/build.mts && node tools/blender/places-dump.mts   -> tools/blender/places-spec.json
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'tools/blender/places-spec.json');
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  if (u === '/sw.js') { res.writeHead(404); res.end(); return; }   // no service worker: every file fresh
  const f = path.join(ROOT, u); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  let body: string | Buffer = fs.readFileSync(f);
  if (u === '/js/gfx.js') {   // every part remembers what it was made from
    body = body.toString()
      .replace('const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(_m);\n  return { g, color };',
        'const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(_m);\n  return { g, color, spec: { type: geo.type, p: geo.parameters, color, pos, rot, scl: sc, hip: geo.type === "ConeGeometry" && geo.parameters.radialSegments === 4 && !rot[0] && !rot[2] && sc[0] !== sc[2], tris: __svSame(geo, g) ? undefined : Array.from(g.attributes.position.array, v => Math.round(v * 1000) / 1000) } };   // (any other shape: its triangles as they are, in the model frame)')
      .replace('export function P(', 'const __svSame = (geo, g) => { if (!/^(Box|Cylinder|Cone|Sphere|Torus|Circle|Plane|Capsule|Icosahedron|Dodecahedron|Octahedron|Tetrahedron)Geometry$/.test(geo.type)) return false;\n  const r = new THREE[geo.type](...Object.values(geo.parameters)).toNonIndexed().applyMatrix4(_m); r.computeBoundingBox(); g.computeBoundingBox();\n  const a = r.boundingBox, b = g.boundingBox; return a.min.distanceTo(b.min) < .01 && a.max.distanceTo(b.max) < .01; };\nexport function P(')
      .replace('g.computeBoundingSphere();\n  return g;', 'g.computeBoundingSphere(); g.userData.parts = parts.map(p => p.spec);\n  return g;');
    body = body.replace('WORLD_TAGS.push([obj, name, opts]);', 'WORLD_TAGS.push([obj, name, opts]); (globalThis.__svAllTags = globalThis.__svAllTags || []).push([obj, name]);');   // (the kit empties WORLD_TAGS)
    if (!body.includes('__svAllTags')) throw new Error('gfx.js worldTag changed: update the dump');
    if (!body.includes('userData.parts')) throw new Error('gfx.js changed: update the dump');
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(body);
});
await new Promise<void>(r => server.listen(0, r));
const port = (server.address() as any).port;
const { launch, open } = await import('../../tests/harness.mts');
const browser = await launch();
const { page } = await open(browser, { w: 900, h: 700, url: `http://localhost:${port}/`, settings: { voice: false, online: false } });
await page.waitForTimeout(6000);   // the later parts of the valley (heritage, Season 2) are built after the start
const spec = await page.evaluate(async () => {
  const G = (window as any).__sv;
  // every Season 2 place, built now (they are built when a child first comes near)
  try { const V = await import('/js/s2vn.js' as any), C = await import('/js/content/s2vn.js' as any); V.installS2vn(G); for (const r of C.S2_REGIONS) V.ensureRegion(G, r.id); } catch (e) { console.warn('s2vn', e); }
  try { const A = await import('/js/s2au-region.js' as any), C = await import('/js/content/s2au.js' as any); await (await import('/js/art.js' as any)).moreArt?.();
    const { anchorOf } = await import('/js/content/map.js' as any);   // (v1.08f places-fix: a region is placed at its place's anchor, as js/s2au.ts does; R.at does not exist)
    for (const R of C.S2_REGIONS) { const a = anchorOf(R.place); A.buildRegion(G, R, { open: () => true, at: (d: [number, number]) => ({ x: a[0] + d[0], z: a[1] + d[1] }) }); } } catch (e) { console.warn('s2au', e); }
  const round = (v: number) => Math.round(v * 10000) / 10000;
  const R = (a: any) => Array.isArray(a) ? a.map((x: any) => typeof x === 'number' ? round(x) : x) : a;
  const out: Record<string, any> = {};
  for (const [obj, name] of (globalThis as any).__svAllTags || []) {
    const parts = obj.geometry?.userData?.parts; if (!parts) { console.warn('no parts', name); continue; }
    if (out[name]) { out[name].copies++; continue; }
    obj.geometry.computeBoundingBox(); const b = obj.geometry.boundingBox;
    out[name] = { copies: 1, scale: R(obj.scale.toArray()), box: { min: R(b.min.toArray()), max: R(b.max.toArray()) },
      parts: parts.map((s: any) => ({ ...s, p: Object.fromEntries(Object.entries(s.p || {}).map(([k, v]) => [k, typeof v === 'number' ? round(v) : v])), pos: R(s.pos), rot: R(s.rot), scl: R(s.scl) })) };
  }
  return out;
});
await browser.close(); server.close();
fs.writeFileSync(OUT, '{\n' + Object.entries(spec).map(([k, v]) => JSON.stringify(k) + ':' + JSON.stringify(v)).join(',\n') + '\n}\n');
console.log('wrote', path.relative(ROOT, OUT), Object.keys(spec).length, 'models:', Object.entries(spec).map(([k, v]: any) => `${k}(${v.parts.length}${v.copies > 1 ? ' x' + v.copies : ''})`).join(' '));
