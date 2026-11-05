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
// (v1.08e faces, part 2) hd: the high-detail models instead, models/<id>-hd.glb (about 22,000 triangles, one baked
// 1024 px picture; tools/blender/game-hd.py): node tools/make-friends.mts hd [finn sol clara lumi]
const HD = process.argv.includes('hd'), args = process.argv.slice(2).filter(a => a !== 'hd');
const who = args.length ? args : ['finn', 'sol', 'clara', 'lumi'];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sv-friends-'));
fs.mkdirSync(path.join(ROOT, 'models'), { recursive: true });
for (const w of who) {
  const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] }).toString();
  run(BLENDER, ['-b', '-P', 'tools/blender/lumi.py', '--', tmp, w, 'game', 'glb', ...(HD ? ['hd'] : [])]);
  if (HD) {
    const hd = path.join(ROOT, 'models', `${w}-hd.glb`);
    run('npx', ['-y', 'gltfpack@0.20.0', '-i', path.join(tmp, `${w}-game-hd.glb`), '-o', hd, '-cc', '-kn', '-km']);
    console.log(`${w}: ${Math.round(fs.statSync(hd).size / 1024)} KB → models/${w}-hd.glb`); continue;
  }
  const full = path.join(tmp, `${w}-game.glb`), light = path.join(tmp, `${w}-light.glb`), out = path.join(ROOT, 'models', `${w}.glb`);
  const log = run(BLENDER, ['-b', '-P', 'tools/blender/game-light.py', '--', full, light]);
  run('npx', ['-y', 'gltfpack@0.20.0', '-i', light, '-o', out, '-cc', '-kn', '-km']);
  console.log(`${w}: ${(log.match(/light: total triangles (\d+)/) || [])[1]} triangles, ${Math.round(fs.statSync(out).size / 1024)} KB → models/${w}.glb`);
}
fs.rmSync(tmp, { recursive: true, force: true });
