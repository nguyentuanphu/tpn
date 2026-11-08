// (v1.08g props) Makes the story and street props' Blender models in models/world/ (pp-*.glb):
//   node tools/make-props.mts [name ...]      (Blender, then gltfpack: meshopt)
//   KEEP_RAW=<folder>: also keep each unpacked model there (tools/blender/props-look.py draws those)
// Needs Blender 4.2 (BLENDER=..., default /opt/blender-4.2.3-linux-x64/blender) and npx (gltfpack 0.20).
// The models are not in the sw.ts install list: the service worker keeps each one when a child first comes near it.
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLENDER = process.env.BLENDER || '/opt/blender-4.2.3-linux-x64/blender';
const OUT = path.join(ROOT, 'models/world');
const only = process.argv.slice(2);
execFileSync(BLENDER, ['-b', '-P', path.join(ROOT, 'tools/blender/world-props.py'), '--', OUT, ...only], { stdio: ['ignore', 'inherit', 'inherit'] });
for (const f of fs.readdirSync(OUT).filter(f => f.startsWith('pp-') && f.endsWith('.raw.glb'))) {
  const n = f.slice(0, -8), raw = path.join(OUT, f);
  execFileSync('npx', ['-y', 'gltfpack@0.20.0', '-i', raw, '-o', path.join(OUT, n + '.glb'), '-cc'], { stdio: 'ignore' });
  if (process.env.KEEP_RAW) { fs.mkdirSync(process.env.KEEP_RAW, { recursive: true }); fs.copyFileSync(raw, path.join(process.env.KEEP_RAW, n + '.glb')); }
  fs.unlinkSync(raw);
}
const names = fs.readdirSync(OUT).filter(f => f.startsWith('pp-') && f.endsWith('.glb'));
for (const n of names.sort()) console.log(n, Math.round(fs.statSync(path.join(OUT, n)).size / 1024), 'KB');
