// node render.mts <video> [preview t1,t2,...]   -> frames/<video>/f00001.jpg ... or preview-<video>-<t>.jpg
import { chromium } from 'playwright-core';
import fs from 'fs';
const DIR = new URL('.', import.meta.url).pathname;
const name = process.argv[2], preview = process.argv[3], FPS = 30;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:8770/stage.html');
await p.addScriptTag({ url: 'videos.js' });
const total = await p.evaluate(n => AD.build(VIDEOS[n]), name);
await p.evaluate(() => AD.ready());
console.log(name, 'seconds', total.toFixed(1));
const stage = await p.$('#stage');
if (preview) {
  for (const t of preview.split(',').map(Number)) { await p.evaluate(t => AD.render(t), t); await stage.screenshot({ path: `${DIR}preview-${name}-${t}.jpg`, type: 'jpeg', quality: 80 }); }
} else {
  const out = `${DIR}frames/${name}/`; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const n = Math.round(total * FPS);
  for (let i = 0; i < n; i++) {
    await p.evaluate(t => AD.render(t), i / FPS);
    await stage.screenshot({ path: `${out}f${String(i + 1).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
    if (i % 150 === 0) console.log('frame', i, '/', n);
  }
}
console.log(errs.join('\n') || 'no errors');
await b.close();
