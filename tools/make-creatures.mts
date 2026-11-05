// (v1.08e creatures) The world's animals, pets and companions, made in Blender and compressed for the game:
//   node tools/build.mts && node tools/blender/creatures-dump.mts   (only when js/animals.ts or js/companion.ts shapes change)
//   node tools/make-creatures.mts [kind ...]                         → models/world/creature-<kind>.glb
// Needs Blender 4.2 (BLENDER=..., default /opt/blender-4.2.3-linux-x64/blender) and npx (gltfpack 0.20, meshopt).
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLENDER = process.env.BLENDER || '/opt/blender-4.2.3-linux-x64/blender';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'creatures-'));
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'], cwd: ROOT }).toString();
const log = run(BLENDER, ['-b', '-P', path.join(ROOT, 'tools/blender/world-creatures.py'), '--', tmp, ...process.argv.slice(2)]);
for (const l of log.split('\n')) if (l.startsWith('CREATURE')) console.log(l);
const out = path.join(ROOT, 'models/world'); fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(tmp).filter(f => f.endsWith('.raw.glb'))) {
  const dst = path.join(out, f.replace('.raw.glb', '.glb'));
  run('npx', ['-y', 'gltfpack@0.20.0', '-i', path.join(tmp, f), '-o', dst, '-cc', '-kn', '-km']);
  console.log(path.relative(ROOT, dst), Math.round(fs.statSync(dst).size / 1024), 'KB');
}
{ // the triangles and happy moves of what was made, kept beside the older ones (a run for some kinds only)
  const dst = path.join(ROOT, 'tools/blender/creatures-built.json'), now = JSON.parse(fs.readFileSync(path.join(tmp, 'creatures-built.json'), 'utf8'));
  const was = fs.existsSync(dst) ? JSON.parse(fs.readFileSync(dst, 'utf8')) : { tris: {}, happy: {} };
  fs.writeFileSync(dst, JSON.stringify({ tris: { ...was.tris, ...now.tris }, happy: { ...was.happy, ...now.happy } }, null, 1) + '\n'); }
fs.rmSync(tmp, { recursive: true, force: true });
