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
// (v1.08e crowds) the 14 gallery neighbours, worn by crowd people near a child (js/crowd-models.ts): node tools/make-villagers.mts crowd
export const CROWD = ['vn-aodai', 'vn-dad', 'vn-farmer', 'vn-vendor', 'vn-grandma', 'vn-grandpa', 'vn-schoolboy', 'vn-schoolgirl', 'au-dad', 'au-mum', 'au-grandma', 'au-grandpa', 'au-boy', 'au-girl'];
const args = process.argv.slice(2), who = args[0] === 'crowd' ? CROWD : args.length ? args : NAMED;
if (args[0] === 'crowd') process.env.VILLAGER_ATLAS ||= '1024'; // (the crowd neighbours: a 1024 px picture, many of them at once)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sv-villagers-'));
fs.mkdirSync(path.join(ROOT, 'models'), { recursive: true });
for (const w of who) {
  const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] }).toString();
  // (owner, 6 Nov 2026 AEDT, pop-up "Bake gallery light") the gallery's soft studio light baked into a 1024 px picture
  // (tools/blender/game-hd.py, LIT); FLAT=1 makes the plain corner-colour version instead (tools/blender/game-light.py)
  const out = path.join(ROOT, 'models', `villager-${w}.glb`), flat = process.env.FLAT === '1';
  const log = run(BLENDER, ['-b', '-P', 'tools/blender/lumi.py', '--', tmp, 'villager', `role=${w}`, 'game', 'glb', ...(flat ? [] : ['hd'])]);
  const src = fs.readdirSync(tmp).find(f => f.startsWith(`villager-${w}-`) && f.endsWith(flat ? '.glb' : '-hd.glb') && !f.endsWith('-light.glb')); // (named by the size: kid, adult, elder)
  let packIn = path.join(tmp, src), tris = (log.match(/hd: total triangles shown (\d+)/) || [])[1];
  if (flat) { const light = path.join(tmp, `villager-${w}-light.glb`); tris = (run(BLENDER, ['-b', '-P', 'tools/blender/game-light.py', '--', packIn, light]).match(/light: total triangles (\d+)/) || [])[1]; packIn = light; }
  run('npx', ['-y', 'gltfpack@0.20.0', '-i', packIn, '-o', out, '-cc', '-kn', '-km']);
  console.log(`${w}: ${tris} triangles, ${Math.round(fs.statSync(out).size / 1024)} KB → models/villager-${w}.glb`);
  fs.readdirSync(tmp).forEach(f => fs.rmSync(path.join(tmp, f), { force: true }));
}
fs.rmSync(tmp, { recursive: true, force: true });
