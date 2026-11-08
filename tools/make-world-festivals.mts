// (v1.08g festivals) Makes the festival models in models/world/ (meshopt): tools/blender/world-festivals.py builds them
// into models/world/raw-fest/ (not kept), gltfpack 0.20 compresses each (-noq: plain floats, so the festival patches can
// merge the corners and repaint the colour slots).   node tools/make-world-festivals.mts [name ...]
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..'), raw = join(root, 'models/world/raw-fest'), out = join(root, 'models/world');
const names = process.argv.slice(2), script = join(root, 'tools/blender/world-festivals.py');
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'], cwd: root }).toString();
process.stdout.write(run('python3', [script, ...names]).split('\n').filter(l => / triangles$/.test(l)).join('\n') + '\n');
mkdirSync(out, { recursive: true });
let total = 0;
for (const f of readdirSync(raw).filter(f => f.endsWith('.glb') && (!names.length || names.includes(f.slice(0, -4))))) {
  run('npx', ['-y', 'gltfpack@0.20.0', '-i', join(raw, f), '-o', join(out, f), '-cc', '-noq', '-kn']);
  const kb = statSync(join(out, f)).size / 1024; total += kb; console.log(`${f}: ${kb.toFixed(1)} KB`);
}
console.log(`total ${total.toFixed(0)} KB`);
