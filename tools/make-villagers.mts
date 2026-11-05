// (v1.08e villagers) The 11 named villagers as Blender models, models/villager-<id>.glb (about 8,000 triangles, one baked
// 512 px picture, the friends' skeleton, faces and soft eyes with lids):
//   node tools/make-villagers.mts [mai ba teo ti bong su jack mit bom ruby lan]
// Blender builds each from its neighbour in tools/blender/lumi.py (role=<id>), tools/blender/game-hd.py thins and bakes
// it, then gltfpack compresses it (meshopt). Needs Blender 4.2 (BLENDER=...) and npx (gltfpack 0.20).
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
  const log = run(BLENDER, ['-b', '-P', 'tools/blender/lumi.py', '--', tmp, 'villager', `role=${w}`, 'game', 'glb', 'hd']);
  const out = path.join(ROOT, 'models', `villager-${w}.glb`);
  const src = fs.readdirSync(tmp).find(f => f.startsWith(`villager-${w}-`) && f.endsWith('-hd.glb')); // (named by the size: kid, adult, elder)
  run('npx', ['-y', 'gltfpack@0.20.0', '-i', path.join(tmp, src), '-o', out, '-cc', '-kn', '-km']);
  console.log(`${w}: ${(log.match(/hd: total triangles shown (\d+)/) || [])[1]} triangles, ${Math.round(fs.statSync(out).size / 1024)} KB → models/villager-${w}.glb`);
}
fs.rmSync(tmp, { recursive: true, force: true });
