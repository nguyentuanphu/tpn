// Bounded probes for single reports: #86 (tap the village well on an iPhone-size screen, Vietnamese: white screen and back
// to sign-in on r70) and #261 (3.4 s stall while tapping Ô Ăn Quan on a 1260x1339 desktop, r74). Measures what happens;
// it does not fix anything. Long tasks are counted from when the game opens (not page start-up). Usage: SV_URL=<served source> node owner-reported-probes.mts <out.json>
import fs from 'node:fs';
import { launch, open, clear } from './harness.mts';
const browser = await launch(), out = { url: process.env.SV_URL || 'http://localhost:8765/' };
try {
  { const P = await open(browser, { w: 428, h: 879, touch: true, lang: 'vi', settings: { voice: false, autoPack: false } }); await clear(P.page);
    out.well = await P.page.evaluate(async () => { const G = __sv, h = G.heroes[0], it = G.interactables.find(i => i.id === 'lv_well'); if (!it) return { missing: true };
      h.place(it.x + 1.5, it.z); await new Promise(r => setTimeout(r, 1500)); let gap = 0, last = performance.now(), on = true; const f = t => { gap = Math.max(gap, t - last); last = t; if (on) requestAnimationFrame(f); }; requestAnimationFrame(f);
      for (let k = 0; k < 3; k++) { await it.act(h); await new Promise(r => setTimeout(r, 2500)); document.querySelectorAll('.dialog').forEach(d => d.click()); await new Promise(r => setTimeout(r, 600)); }
      on = false; return { tapped: 3, title: !!document.querySelector('.screen.title'), canvas: !!document.querySelector('#stage canvas'), heroes: G.heroes.length, maxFrameGapMs: Math.round(gap), at: { x: Math.round(h.pos.x), z: Math.round(h.pos.z) } }; });
    out.well.errors = P.errors; await P.page.screenshot({ path: 'out/probe-well.png' }); await P.ctx.close(); }
  { const P = await open(browser, { w: 1260, h: 1339, lang: 'en', settings: { voice: false, autoPack: false } }); await clear(P.page);
    await P.page.evaluate(() => { window.__lt = []; new PerformanceObserver(l => l.getEntries().forEach(e => __lt.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: false }); window.__gap = 0; let last = performance.now(); const f = t => { __gap = Math.max(__gap, t - last); last = t; requestAnimationFrame(f); }; requestAnimationFrame(f); });
    await P.page.evaluate(async () => { const F = await import('/js/games/frame.js'); F.openGame('oanquan', { players: [__sv.heroes[0].profile] }); });
    await P.page.waitForSelector('.oaq-c'); let taps = 0; const t0 = Date.now();
    while (Date.now() - t0 < 150000 && await P.page.$('.gl:not(.out) .oaq')) { const b = await P.page.$('.oaq-arrows button') || (await P.page.$$('.oaq-row.bot .oaq-c')).at(Math.floor(Math.random() * 5)); if (b) { await b.click({ force: true }).catch(() => { }); taps++; } await P.page.waitForTimeout(450); if (await P.page.$('.gl-end, .gl .again, .reward')) break; }
    out.oanquan = { taps, seconds: Math.round((Date.now() - t0) / 1000), ...(await P.page.evaluate(() => ({ longTasksMs: __lt.slice().sort((a, b) => b - a).slice(0, 5), maxFrameGapMs: Math.round(__gap) }))), errors: P.errors };
    await P.ctx.close(); }
} catch (e) { out.failure = String(e.message || e).slice(0, 600); }
finally { await browser.close(); fs.writeFileSync(process.argv[2] || 'out/owner-reported-probes.json', JSON.stringify(out, null, 2) + '\n'); }
console.log(JSON.stringify(out));
