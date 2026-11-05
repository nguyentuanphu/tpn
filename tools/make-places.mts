// (v1.08e places) Makes the places' Blender models in models/world/ and keeps their offline list in sw.ts:
//   node tools/build.mts && node tools/blender/places-dump.mts    (only when a code shape changed: the spec)
//   node tools/make-places.mts [name ...]                          (Blender, then gltfpack: meshopt, about 10-100 KB each)
// Needs Blender 4.2 (BLENDER=..., default /opt/blender-4.2.3-linux-x64/blender) and npx (gltfpack 0.20).
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLENDER = process.env.BLENDER || '/opt/blender-4.2.3-linux-x64/blender';
const OUT = path.join(ROOT, 'models/world'), SPEC = path.join(ROOT, 'tools/blender/places-spec.json');
const names = process.argv.slice(2);
execFileSync(BLENDER, ['-b', '-P', path.join(ROOT, 'tools/blender/world-places.py'), '--', SPEC, OUT, ...names], { stdio: ['ignore', 'inherit', 'inherit'] });
const spec = JSON.parse(fs.readFileSync(SPEC, 'utf8'));
for (const n of Object.keys(spec)) {
  const raw = path.join(OUT, n + '.raw.glb'); if (!fs.existsSync(raw)) continue;
  execFileSync('npx', ['-y', 'gltfpack@0.20.0', '-i', raw, '-o', path.join(OUT, n + '.glb'), '-cc'], { stdio: 'ignore' });
  fs.unlinkSync(raw);
}
// the offline list: every places model, between the two marker lines in sw.ts (no apostrophes: tools/bundle.mts reads it)
const sw = path.join(ROOT, 'sw.ts'), s = fs.readFileSync(sw, 'utf8');
const all = Object.keys(spec).filter(n => fs.existsSync(path.join(OUT, n + '.glb'))).map(n => `'models/world/${n}.glb'`);
const rows: string[] = []; for (let i = 0; i < all.length; i += 6) rows.push('  ' + all.slice(i, i + 6).join(', ') + ',');
const A = '  // (v1.08e places) the landmarks, bridges, buildings and props made in Blender (tools/make-places.mts writes this list)\n', Z = '  // (v1.08e places) end of the places models\n';
const block = A + rows.join('\n') + '\n' + Z;
const out = s.includes(A) ? s.slice(0, s.indexOf(A)) + block + s.slice(s.indexOf(Z) + Z.length)
  : s.replace("  'js/modelkit.js',", block + "  'js/modelkit.js',");
fs.writeFileSync(sw, out);
console.log('models', all.length, 'KB', Math.round(Object.keys(spec).reduce((t, n) => t + (fs.existsSync(path.join(OUT, n + '.glb')) ? fs.statSync(path.join(OUT, n + '.glb')).size : 0), 0) / 1024));
