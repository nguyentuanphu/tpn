// (v1.08b platform, brief part 1) every recording in voices/ also as Opus: mono, 18 kbps, the same name with .opus beside
// the .mp3 (about half the size). The MP3 stays for devices that cannot play Opus (the game asks canPlayType first). When
// every recording of a language has its Opus copy, that language's manifest says formats ["mp3","opus"]; an Opus copy
// whose MP3 is gone is deleted. voices-aside/ is never touched. Needs ffmpeg with libopus.
// Run: node tools/make-voice-opus.mts [--jobs 8] [--check]   (--check: only report what is missing, change nothing)
// tools/make-voice-pack.mts runs it at the end of every recording run.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), DIR = path.join(ROOT, 'voices');
const arg = (k: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const JOBS = Math.max(1, +(arg('--jobs') || Math.min(8, os.cpus().length))), CHECK = process.argv.includes('--check');
export const OPUS_ARGS = ['-ac', '1', '-c:a', 'libopus', '-b:a', '18k', '-vbr', 'on', '-application', 'voip', '-map_metadata', '-1'];
const langs = fs.readdirSync(DIR).filter(d => fs.statSync(path.join(DIR, d)).isDirectory());
const todo: [string, string][] = [], stray: string[] = [], empty: string[] = [], per: Record<string, { mp3: number, opus: number }> = {};
for (const L of langs) { per[L] = { mp3: 0, opus: 0 };
  for (const s of fs.readdirSync(path.join(DIR, L))) { const d = path.join(DIR, L, s); if (!fs.statSync(d).isDirectory()) continue;
    for (const f of fs.readdirSync(d)) { const p = path.join(d, f);
      // (an empty MP3 is no recording at all: it is listed, needs recording again, and gets no Opus copy)
      if (f.endsWith('.mp3') && fs.statSync(p).size === 0) { empty.push(path.relative(ROOT, p)); continue; }
      if (f.endsWith('.mp3')) { per[L].mp3++; const o = p.slice(0, -4) + '.opus'; if (!fs.existsSync(o) || fs.statSync(o).mtimeMs < fs.statSync(p).mtimeMs) todo.push([p, o]); else per[L].opus++; }
      else if (f.endsWith('.opus') && !fs.existsSync(p.slice(0, -5) + '.mp3')) stray.push(p); } } }
if (CHECK) { console.log(JSON.stringify({ missing: todo.length, stray: stray.length, empty, per })); process.exit(todo.length || stray.length ? 1 : 0); }
try { execFileSync('ffmpeg', ['-hide_banner', '-encoders'], { stdio: 'pipe' }).toString().includes('libopus') || (() => { throw 0; })(); } catch (e) { console.error('ffmpeg with libopus is needed'); process.exit(1); }
for (const p of stray) fs.unlinkSync(p);
let done = 0, failed = 0, at = 0;
const one = ([src, out]: [string, string]) => new Promise<void>(ok => { const tmp = out + '.part';
  const c = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', src, ...OPUS_ARGS, '-f', 'opus', tmp], { stdio: 'ignore' });
  c.on('close', code => { if (code === 0 && fs.existsSync(tmp) && fs.statSync(tmp).size > 0) { fs.renameSync(tmp, out); done++; per[src.split(path.sep).at(-3)].opus++; } else { failed++; try { fs.unlinkSync(tmp); } catch (e) { } } ok(); }); });
await Promise.all(Array.from({ length: JOBS }, async () => { while (at < todo.length) { await one(todo[at++]); if ((done + failed) % 1000 === 0) console.log(`${done + failed} of ${todo.length}`); } }));
// each manifest says which formats are there for every one of its lines
for (const f of fs.readdirSync(DIR).filter(f => /^manifest(-\w+)?\.json$/.test(f))) {
  const p = path.join(DIR, f), m = JSON.parse(fs.readFileSync(p, 'utf8')), L = /^manifest-(\w+)\.json$/.exec(f)?.[1];
  const all = L ? per[L] && per[L].mp3 > 0 && per[L].opus === per[L].mp3 : langs.every(l => per[l].opus === per[l].mp3);
  const want = all ? ['mp3', 'opus'] : ['mp3']; if (JSON.stringify(m.formats) === JSON.stringify(want)) continue;
  m.formats = want; fs.writeFileSync(p, JSON.stringify(m));
}
console.log(JSON.stringify({ made: done, failed, removed: stray.length, empty, per }));
if (failed) process.exit(1);
