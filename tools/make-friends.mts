// (v1.08b friends) Makes the four friends' light game models in models/ (about 100 KB each, meshopt-compressed):
//   node tools/make-friends.mts [finn sol clara lumi]
// For each friend: Blender builds the full game model (tools/blender/lumi.py, about 40 MB), tools/blender/game-light.py
// thins it to about 8,000 triangles with the colours in the corners, then gltfpack compresses it (meshopt).
// Needs Blender 4.2 (BLENDER=..., default /opt/blender-dl/blender-4.2.9-linux-x64/blender) and npx (gltfpack 0.20).
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLENDER = process.env.BLENDER || '/opt/blender-dl/blender-4.2.9-linux-x64/blender';
const who = process.argv.slice(2).length ? process.argv.slice(2) : ['finn', 'sol', 'clara', 'lumi'];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sv-friends-'));
fs.mkdirSync(path.join(ROOT, 'models'), { recursive: true });
for (const w of who) {
  const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] }).toString();
  run(BLENDER, ['-b', '-P', 'tools/blender/lumi.py', '--', tmp, w, 'game', 'glb']);
  const full = path.join(tmp, `${w}-game.glb`), light = path.join(tmp, `${w}-light.glb`), out = path.join(ROOT, 'models', `${w}.glb`);
  const log = run(BLENDER, ['-b', '-P', 'tools/blender/game-light.py', '--', full, light]);
  run('npx', ['-y', 'gltfpack@0.20.0', '-i', light, '-o', out, '-cc', '-kn', '-km']);
  console.log(`${w}: ${(log.match(/light: total triangles (\d+)/) || [])[1]} triangles, ${Math.round(fs.statSync(out).size / 1024)} KB → models/${w}.glb`);
}
fs.rmSync(tmp, { recursive: true, force: true });
