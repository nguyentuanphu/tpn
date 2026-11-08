// (v1.08e vehicles) Every vehicle and boat as a Blender model in models/world/ (veh-<id>.glb, boat-<id>.glb):
// 1. the blueprints of the code shapes (tools/vehicle-blueprints.mts, needs the game served on SV_URL, default :8765),
// 2. Blender builds each model (tools/blender/world-vehicles.py), 3. gltfpack compresses it (meshopt).
//   node tools/build.mts && (python3 -m http.server 8765 &) && node tools/make-world-vehicles.mts [names...]
// Needs Blender 4.2 (BLENDER=..., default /opt/blender-4.2.3-linux-x64/blender) and npx (gltfpack 0.20).
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLENDER = process.env.BLENDER || '/opt/blender-4.2.3-linux-x64/blender', only = process.argv.slice(2);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sv-veh-')), bp = path.join(tmp, 'bp.json'), raw = path.join(tmp, 'raw');
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'], cwd: tmp }).toString();
run('node', [path.join(ROOT, 'tools/vehicle-blueprints.mts'), bp]);
const log = run(BLENDER, ['-b', '-P', path.join(ROOT, 'tools/blender/world-vehicles.py'), '--', bp, raw, ...only]);
log.split('\n').filter(l => l.startsWith('MODEL')).forEach(l => console.log(l));
fs.mkdirSync(path.join(ROOT, 'models/world'), { recursive: true });
for (const f of fs.readdirSync(raw).filter(f => f.endsWith('.glb'))) {
  const out = path.join(ROOT, 'models/world', f);
  run('npx', ['-y', 'gltfpack@0.20.0', '-i', path.join(raw, f), '-o', out, '-cc', '-kn', '-km']);
  console.log(f, Math.round(fs.statSync(out).size / 1024) + ' KB');
}
fs.rmSync(tmp, { recursive: true, force: true });
