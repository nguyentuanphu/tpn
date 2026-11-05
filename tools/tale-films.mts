// (v1.08b story) The five Blender tale films (docs/cores/tasks/v108b/story-brief.md part 4): Bánh Chưng Bánh Giầy, Chú
// Cuội, Tấm Cám, Thánh Gióng and The Rainbow Serpent. Each is the tale's pages rendered in Blender
// (tools/blender/talepages.py, the people from the costume kit) with slow camera moves and soft fades, 720p, one silent
// video per tale: the game's narrator reads each page in English or Vietnamese over it (the same voices as the in-game
// film), and the help moment of each page pauses the video with the tap ring (js/talevideo.ts).
//   node tools/tale-films.mts <pages dir> [tale ...]
// Writes videos/tales/<tale>.mp4 and js/content/talevideos.ts (each page's start, end and help moment, the file size).
// The videos are downloaded only when a child opens the tale, then kept for offline; they are never in the first
// download or the Wi-Fi voice pack. Needs ffmpeg.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [PAGES, ...only] = process.argv.slice(2);
const TALES = ['banhchung', 'chucuoi', 'tamcam', 'thanhgiong', 'rainbowserpent'].filter(t => !only.length || only.includes(t));
const R = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
// each page's words, to time the page (both languages: the longer one sets the time)
function pagesOf(id: string): [string, string][] {
  for (const [f, re] of [['js/learn.ts', new RegExp(`\\{ id: '${id}'`)], ['js/tales-content.ts', new RegExp(`tale\\('${id}'`)]] as [string, RegExp][]) {
    const s = R(f), m = re.exec(s); if (!m) continue;
    const blk = s.slice(m.index, s.indexOf(']]', m.index) + 2);
    const out = [...blk.matchAll(/\[\s*(['"])(?:(?!\1)[^\\]|\\.)*\1\s*,\s*(['"])((?:(?!\2)[^\\]|\\.)*)\2\s*,\s*(['"])((?:(?!\4)[^\\]|\\.)*)\4\s*\]/g)].map(x => [x[3], x[5]] as [string, string]);
    if (out.length) return out;
  }
  throw Error('no pages for ' + id);
}
const FPS = 25, FADE = .6;
const meta: Record<string, { file: string; kb: number; pages: [number, number, number][] }> = {};
const old = fs.existsSync(path.join(ROOT, 'js/content/talevideos.ts')) ? R('js/content/talevideos.ts') : '';
fs.mkdirSync(path.join(ROOT, 'videos/tales'), { recursive: true });
for (const id of TALES) {
  const words = pagesOf(id), n = words.length;
  // a page lasts as long as its words take to read (about 14 letters a second), at least 6 s
  const dur = words.map(([en, vi]) => Math.max(6, Math.max(en.length, vi.length) / 14 + 2.5));
  const inputs: string[] = [], filters: string[] = [];
  for (let i = 0; i < n; i++) {
    const img = path.join(PAGES, `${id}-${i + 1}.png`); if (!fs.existsSync(img)) throw Error('missing page ' + img);
    const d = dur[i] + (i < n - 1 ? FADE : 0), frames = Math.round(d * FPS);
    inputs.push('-loop', '1', '-t', d.toFixed(2), '-i', img);
    // a slow push in (or out on odd pages), centred a little off the middle so it feels hand-held
    const z = i % 2 ? `1.12-0.12*on/${frames}` : `1+0.12*on/${frames}`, dx = i % 3 === 0 ? '0.48' : i % 3 === 1 ? '0.52' : '0.5';
    filters.push(`[${i}:v]scale=1600:900,zoompan=z='${z}':x='iw*${dx}-iw/zoom/2':y='ih/2-ih/zoom/2':d=${frames}:s=1280x720:fps=${FPS},format=yuv420p,setsar=1[v${i}]`);
  }
  let last = 'v0', t = dur[0];
  const pages: [number, number, number][] = [[0, +dur[0].toFixed(2), +(dur[0] * .6).toFixed(2)]];
  for (let i = 1; i < n; i++) {   // page i fades in at the end of page i - 1 (each clip is FADE longer, so they overlap)
    filters.push(`[${last}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${t.toFixed(2)}[x${i}]`);
    pages.push([+t.toFixed(2), +(t + dur[i]).toFixed(2), +(t + dur[i] * .6).toFixed(2)]);
    t += dur[i]; last = `x${i}`;
  }
  const out = path.join(ROOT, 'videos/tales', id + '.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filters.join(';'), '-map', `[${last}]`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-maxrate', '700k', '-bufsize', '1400k', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out], { stdio: 'inherit' });
  const kb = Math.round(fs.statSync(out).size / 1024);
  meta[id] = { file: `videos/tales/${id}.mp4`, kb, pages };
  console.log(`${id}: ${n} pages, ${t.toFixed(1)} s, ${kb} KB`);
}
// keep the tales not made this time
const kept: Record<string, unknown> = {}; const m0 = /export const TALE_VIDEOS[^=]*= (\{[\s\S]*?\});/.exec(old);
if (m0) Object.assign(kept, JSON.parse(m0[1]));
fs.writeFileSync(path.join(ROOT, 'js/content/talevideos.ts'), `// Made by tools/tale-films.mts (v1.08b story): do not edit by hand, run it again.
// The Blender tale films: the video, its size, and each page's [start, end, help moment] in seconds.
export type TaleVideo = { file: string; kb: number; pages: [number, number, number][] };
export const TALE_VIDEOS: Record<string, TaleVideo> = ${JSON.stringify({ ...kept, ...meta })};
`);
