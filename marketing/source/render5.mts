// node render5.mts <ad> <lang>  -> frames5/<ad>-<lang>/f00001.jpg …, prints scene start times (JSON) for the voice-over mix
import { chromium } from 'playwright';
import fs from 'fs';
const DIR = new URL('.', import.meta.url).pathname;
const [name, lang, preview] = process.argv.slice(2), FPS = 30;
const DUR = JSON.parse(fs.readFileSync(DIR + 'voice5/durations.json', 'utf8'));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(d => { window.DUR = d; window.STILLS = 'stills5'; }, DUR);
await p.goto('http://localhost:8770/stage.html');
await p.addScriptTag({ url: 'ads5.js' });
const r = await p.evaluate(([n, l, th]) => { const sc = th ? ADS5_THUMB(n, l) : ADS5_BUILD(n, l); const total = AD.build(sc); let t = 0; const starts = sc.map(s => { const a = t; t += s.d; return a; }); return { total, starts, ids: ADS5[n].map(s => s.id) }; }, [name, lang, preview === 'thumb']);
await p.evaluate(() => AD.ready());
const stage = await p.$('#stage');
if (preview === 'thumb') { await p.evaluate(() => AD.render(2)); fs.mkdirSync(DIR + 'out5', { recursive: true }); await stage.screenshot({ path: `${DIR}out5/sparkle-valley-${name}-${lang}-thumb.jpg`, type: 'jpeg', quality: 92 }); }
else if (preview) { for (const t of preview.split(',').map(Number)) { await p.evaluate(t => AD.render(t), t); await stage.screenshot({ path: `${DIR}preview5-${name}-${lang}-${t}.jpg`, type: 'jpeg', quality: 80 }); } }
else {
  const out = `${DIR}frames5/${name}-${lang}/`; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const n = Math.round(r.total * FPS);
  for (let i = 0; i < n; i++) { await p.evaluate(t => AD.render(t), i / FPS); await stage.screenshot({ path: `${out}f${String(i + 1).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 }); }
}
console.log(JSON.stringify(r)); if (errs.length) console.error(errs.join('\n'));
await b.close();
