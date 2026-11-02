// Puts a recorded film together: node makefilm.mts <little|valley> <en|vi> <land|vert> <framesdir> <out.mp4>
// frames (25 fps) + a caption at the start of each scene + the voice line + the jingle underneath + an end card
// (sparklevalley.au) + a thumbnail (<out>-thumb.jpg, also the mp4's cover picture).
import fs from 'fs';
import { execFileSync } from 'child_process';
import { chromium } from 'playwright';
globalThis.window = globalThis.window || {}; await import('./films2.js');
const [name, lang, shape, dir, out] = process.argv.slice(2);
const SRC = new URL('.', import.meta.url).pathname, k = lang === 'vi' ? 1 : 0, LAND = shape === 'land';
const [W, H] = LAND ? [1920, 1080] : [1080, 1920];
const scenes = window.FILMS2[name], marks = Object.fromEntries(JSON.parse(fs.readFileSync(dir + '/marks.json', 'utf8')));
const DUR = JSON.parse(fs.readFileSync(SRC + 'voicef/durations.json', 'utf8'));
const tmp = `${dir}/build`; fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
const nFrames = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).length, footage = nFrames / 25;
const endSec = scenes.find(s => s.end).sec, total = footage + endSec;
const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'ignore', 'inherit'] });

// pictures made in the browser: captions (transparent), end card, thumbnail
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: W, height: H } });
await p.goto('http://localhost:8770/'); // same origin as the fonts, so they load
const css = `<link rel="stylesheet" href="http://localhost:8770/fonts.css"><style>body{margin:0;font-family:'Fredoka','Baloo 2',sans-serif;color:#2b2238}
.cap{position:absolute;left:0;right:0;bottom:${LAND ? 44 : 210}px;text-align:center}.cap small{display:block;font-size:.56em;font-weight:400;margin-top:4px;color:#4a3d5c}.cap span{display:inline-block;background:#ffd23f;border:${LAND ? 7 : 9}px solid #2b2238;border-radius:40px;padding:${LAND ? '12px 34px 16px' : '16px 38px 20px'};font-weight:500;font-size:${LAND ? 50 : 62}px;line-height:1.05;box-shadow:0 ${LAND ? 10 : 12}px 0 #2b2238;max-width:${LAND ? 1500 : 940}px}</style>`;
const shot = async (html, file, transparent) => { await p.setContent(`<html><head>${css}</head><body style="width:${W}px;height:${H}px;${transparent ? 'background:transparent' : ''}">${html}</body></html>`); await p.evaluate(async () => { await Promise.all(["500 40px Fredoka", "600 40px 'Baloo 2'"].map(f => document.fonts.load(f, 'Aàăâđêôơư'))); await document.fonts.ready; }); await p.waitForTimeout(150); await p.screenshot({ path: file, omitBackground: !!transparent, type: file.endsWith('.png') ? 'png' : 'jpeg', quality: file.endsWith('.png') ? undefined : 92 }); };
for (const s of scenes) if (!s.end && marks[s.id] != null) await shot(`<div class="cap"><span>${s.cap[k]}${s.info ? `<small>${s.info[k]}</small>` : ''}</span></div>`, `${tmp}/cap-${s.id}.png`, true);
const logo = `<img src="http://localhost:8770/icon-512.png" style="width:${LAND ? 220 : 280}px;height:${LAND ? 220 : 280}px;border-radius:56px;border:11px solid #2b2238;box-shadow:14px 16px 0 #2b2238">`;
const brand = s => `<div style="font-size:${s}px;line-height:1;color:#ffd23f;-webkit-text-stroke:${s / 14}px #2b2238;paint-order:stroke fill;text-shadow:0 ${s / 12}px 0 #2b2238">${k ? 'Thung Lũng Lấp Lánh' : 'Sparkle Valley'}</div>`;
const chips = (k ? ['🧒 Cho bé 2–8 tuổi', '🇻🇳 Tiếng Việt ⇄ English 🇦🇺', '📴 Chơi được khi không có mạng'] : ['🧒 Ages 2–8', '🇦🇺 English ⇄ Tiếng Việt 🇻🇳', '📴 Works offline']).map(c => `<span style="display:inline-block;margin:10px;background:#fff;border:6px solid #2b2238;border-radius:999px;padding:8px 28px 12px;font-size:${LAND ? 40 : 48}px;box-shadow:0 8px 0 #2b2238">${c}</span>`).join(LAND ? '' : '<br>');
await shot(`<div style="width:${W}px;height:${H}px;background:linear-gradient(180deg,#5ec8f2 0%,#a8e3f7 55%,#8fdc6a 55%,#5fb447 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${LAND ? 26 : 40}px;text-align:center">${logo}${brand(LAND ? 120 : 130)}<div>${chips}</div><div style="font-size:${LAND ? 64 : 70}px;font-weight:500;color:#1f4a1a">▶ sparklevalley.au</div></div>`, `${tmp}/end.jpg`);
// thumbnail: a frame from the middle of the film, the headline, the logo and the website
const head = { little: ['Everything for little ones, on one simple screen', 'Mọi thứ cho bé, trên một màn hình đơn giản'], valley: ['Explore the whole valley: Vietnam and Australia', 'Khám phá cả thung lũng: Việt Nam và Úc'] }[name][k];
const midScene = scenes.find(s => s.id === (name === 'little' ? 'G01' : 'W4')), midF = name === 'little' ? 50 : Math.round(((marks[midScene.id] || 10) + midScene.sec / 2) * 25);
const frame = `${dir}/f${String(Math.min(nFrames, Math.max(1, midF))).padStart(5, '0')}.jpg`;
fs.copyFileSync(frame, `${tmp}/thumbbg.jpg`);
await p.route('**/thumbbg.jpg', r => r.fulfill({ body: fs.readFileSync(`${tmp}/thumbbg.jpg`), contentType: 'image/jpeg' }));
await shot(`<div style="position:relative;width:${W}px;height:${H}px;background:url(http://localhost:8770/thumbbg.jpg) center/cover">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(43,34,56,.75),rgba(43,34,56,.35) 30%,rgba(43,34,56,.2) 60%,rgba(43,34,56,.5))"></div>
  <div style="position:absolute;left:0;right:0;top:${LAND ? 40 : 90}px;display:flex;align-items:center;justify-content:center;gap:24px"><img src="http://localhost:8770/icon-512.png" style="width:${LAND ? 120 : 130}px;height:${LAND ? 120 : 130}px;border-radius:30px;border:7px solid #2b2238">${brand(LAND ? 86 : 90)}</div>
  <div style="position:absolute;left:${LAND ? 120 : 50}px;right:${LAND ? 120 : 50}px;top:${LAND ? 200 : 300}px;text-align:center"><span style="display:inline-block;background:#ffd23f;border:10px solid #2b2238;border-radius:48px;padding:18px 40px 24px;font-weight:500;font-size:${LAND ? 76 : 92}px;line-height:1.04;box-shadow:0 16px 0 #2b2238">${head}</span></div>
  <div style="position:absolute;left:0;right:0;bottom:${LAND ? 50 : 140}px;text-align:center"><span style="display:inline-block;background:#fff;border:7px solid #2b2238;border-radius:999px;padding:10px 40px 14px;font-size:${LAND ? 52 : 60}px;font-weight:500;box-shadow:0 9px 0 #2b2238">▶ ${k ? '3 phút' : '3 minutes'} · sparklevalley.au</span></div></div>`, out.replace(/\.mp4$/, '-thumb.jpg'));
await b.close();

// music, sized to the film
run('python3', [SRC + 'music.py', `${tmp}/music.wav`, String(total), '7']);
// video: footage + end card (a slow zoom), captions faded in and out at each scene's start
const caps = scenes.filter(s => !s.end && marks[s.id] != null);
const inputs = ['-framerate', '25', '-i', `${dir}/f%05d.jpg`, '-i', `${tmp}/end.jpg`];
const ord = scenes.filter(s => !s.end && marks[s.id] != null).map(s => marks[s.id]).concat(footage).sort((a, b) => a - b);
const capLen = s => Math.max(3, Math.min(9, ord.find(t => t > marks[s.id]) - marks[s.id] - .8));
caps.forEach(s => inputs.push('-loop', '1', '-t', String(capLen(s)), '-i', `${tmp}/cap-${s.id}.png`));
let f = `[0:v]scale=${W}:${H},setsar=1,fps=25[foot];[1:v]scale=${W * 1.2}:${H * 1.2},zoompan=z='min(1+on/600,1.08)':d=${Math.round(endSec * 25)}:s=${W}x${H}:fps=25,setsar=1[endv];[foot][endv]concat=n=2:v=1:a=0[base]`;
let last = 'base';
caps.forEach((s, i) => { const st = marks[s.id] + .4, d = capLen(s); f += `;[${i + 2}:v]format=rgba,fade=in:st=0:d=0.3:alpha=1,fade=out:st=${(d - .4).toFixed(2)}:d=0.4:alpha=1,setpts=PTS+${st}/TB[c${i}];[${last}][c${i}]overlay=0:0:enable='between(t,${st},${(st + d).toFixed(2)})'[v${i}]`; last = `v${i}`; });
// audio: each scene's voice 0.6 s after it starts (the end card's at its start), the music under it
const aIn = [], aF = []; let ai = 0;
for (const s of scenes) { const st = s.end ? footage + .4 : (marks[s.id] ?? null); if (st == null) continue; aIn.push('-i', `${SRC}voicef/${s.id}-${lang}.mp3`); const ms = Math.round((st + (s.end ? 0 : .4)) * 1000); aF.push(`[${ai + 1}:a]adelay=${ms}|${ms},volume=1.6[a${ai}]`); ai++; }
const audio = `${aF.join(';')};[0:a]volume=0.2[m];${Array.from({ length: ai }, (_, i) => `[a${i}]`).join('')}[m]amix=inputs=${ai + 1}:normalize=0:duration=longest,alimiter=limit=0.89:level=false[aout]`;
run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...inputs, '-filter_complex', f + `;[${last}]null[vout]`, '-map', '[vout]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', `${tmp}/video.mp4`]);
run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', `${tmp}/music.wav`, ...aIn, '-filter_complex', audio, '-map', '[aout]', '-t', String(total), '-c:a', 'aac', '-b:a', '160k', `${tmp}/audio.m4a`]);
run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', `${tmp}/video.mp4`, '-i', `${tmp}/audio.m4a`, '-i', out.replace(/\.mp4$/, '-thumb.jpg'), '-map', '0:v', '-map', '1:a', '-map', '2', '-c', 'copy', '-c:v:1', 'mjpeg', '-disposition:v:1', 'attached_pic', '-t', String(total), '-movflags', '+faststart', out]);
console.log('made', out, total.toFixed(1), 's');
