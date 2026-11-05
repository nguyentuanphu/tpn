// (v1.08e nature) Makes the trees, flowers, crops, farm props and My House decorations in models/world/ (meshopt).
//   node tools/make-world-nature.mts [name ...]
// tools/blender/world-nature.py builds each model in Blender (pip install bpy, or BLENDER=/path/to/blender) into
// models/world/raw/ (not kept), then gltfpack 0.20 compresses it (meshopt; -noq keeps plain floats so the game can
// merge copies into one InstancedMesh shape without undoing quantization).
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..'), raw = join(root, 'models/world/raw'), out = join(root, 'models/world');
const names = process.argv.slice(2), script = join(root, 'tools/blender/world-nature.py');
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'], cwd: root }).toString();
if (process.env.BLENDER) run(process.env.BLENDER, ['-b', '-P', script, '--', ...names]); else process.stdout.write(run('python3', [script, ...names]).split('\n').filter(l => / triangles$/.test(l)).join('\n') + '\n');
mkdirSync(out, { recursive: true });
let total = 0;
for (const f of readdirSync(raw).filter(f => f.endsWith('.glb') && (!names.length || names.includes(f.slice(0, -4))))) {
  run('npx', ['-y', 'gltfpack@0.20.0', '-i', join(raw, f), '-o', join(out, f), '-cc', '-noq', '-kn']);
  const kb = statSync(join(out, f)).size / 1024; total += kb; console.log(`${f}: ${kb.toFixed(1)} KB`);
}
console.log(`total ${total.toFixed(0)} KB`);
