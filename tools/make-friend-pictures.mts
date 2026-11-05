// (v1.08e faces) The four friends' 2D pictures in icons/friends/ (the Welcome picker, the HUD, Who's playing), rendered in
// Blender from the same script as their game models, so the pictures have the same soft eyes with lids:
//   node tools/make-friend-pictures.mts [finn sol clara lumi]
// <id>-f.webp front, <id>-q.webp three-quarter, <id>-s.webp side (240 by 312), <id>-face.webp head and shoulders (160).
// Needs Blender 4.2 (BLENDER=..., as tools/make-friends.mts) and python3 with Pillow (to turn the renders into WebP).
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLENDER = process.env.BLENDER || '/opt/blender-dl/blender-4.2.9-linux-x64/blender';
const who = process.argv.slice(2).length ? process.argv.slice(2) : ['finn', 'sol', 'clara', 'lumi'];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sv-pictures-'));
for (const w of who) {
  execFileSync(BLENDER, ['-b', '-P', 'tools/blender/lumi.py', '--', tmp, w, 'game', 'render', 'portrait', 'quick'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
  // the renders are <who>-chibi-<view>.png on the cream backdrop; the pictures are the same size as before
  const py = `
from PIL import Image
import sys
src, dst, w = sys.argv[1], sys.argv[2], sys.argv[3]
for view, tag in (('front', 'f'), ('three-quarter', 'q'), ('side', 's')):
    Image.open(f'{src}/{w}-chibi-{view}.png').convert('RGB').resize((240, 312), Image.LANCZOS).save(f'{dst}/{w}-{tag}.webp', quality=86)
im = Image.open(f'{src}/{w}-chibi-portrait.png').convert('RGB'); W, H = im.size; s = min(W, H)
im.crop(((W - s) // 2, 0, (W + s) // 2, s)).resize((160, 160), Image.LANCZOS).save(f'{dst}/{w}-face.webp', quality=86)
`;
  execFileSync('python3', ['-c', py, tmp, path.join(ROOT, 'icons', 'friends'), w], { stdio: 'inherit' });
  console.log(`${w}: icons/friends/${w}-{f,q,s,face}.webp`);
}
fs.rmSync(tmp, { recursive: true, force: true });
