// (v1.08e villagers) The 11 named villagers as Blender models, models/villager-<id>.glb, made like the friends' light
// models (about 8,000-10,000 triangles, the colours crisp in the corners, the friends' skeleton, faces and soft eyes with
// lids, each villager's own hair from their look):
//   node tools/make-villagers.mts [mai ba teo ti bong su jack mit bom ruby lan]
// Blender builds each from its neighbour in tools/blender/lumi.py (role=<id>), tools/blender/game-light.py thins it,
// then gltfpack compresses it (meshopt). Needs Blender 4.2 (BLENDER=...) and npx (gltfpack 0.20).
// (Release, 6 Nov: the first try baked a 512 px picture with tools/blender/game-hd.py; it smeared the clothes)
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLENDER = process.env.BLENDER || '/opt/blender-dl/blender-4.2.9-linux-x64/blender';
export const NAMED = ['mai', 'ba', 'teo', 'ti', 'bong', 'su', 'jack', 'mit', 'bom', 'ruby', 'lan'];
const who = process.argv.slice(2).length ? process.argv.slice(2) : NAMED;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sv-villagers-'));
fs.mkdirSync(path.join(ROOT, 'models'), { recursive: true });
for (const w of who) {
  const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] }).toString();
  run(BLENDER, ['-b', '-P', 'tools/blender/lumi.py', '--', tmp, 'villager', `role=${w}`, 'game', 'glb']);
  const out = path.join(ROOT, 'models', `villager-${w}.glb`), light = path.join(tmp, `villager-${w}-light.glb`);
  const src = fs.readdirSync(tmp).find(f => f.startsWith(`villager-${w}-`) && f.endsWith('.glb') && !f.endsWith('-light.glb')); // (named by the size: kid, adult, elder)
  const log = run(BLENDER, ['-b', '-P', 'tools/blender/game-light.py', '--', path.join(tmp, src), light]);
  run('npx', ['-y', 'gltfpack@0.20.0', '-i', light, '-o', out, '-cc', '-kn', '-km']);
  console.log(`${w}: ${(log.match(/light: total triangles (\d+)/) || [])[1]} triangles, ${Math.round(fs.statSync(out).size / 1024)} KB → models/villager-${w}.glb`);
}
fs.rmSync(tmp, { recursive: true, force: true });
