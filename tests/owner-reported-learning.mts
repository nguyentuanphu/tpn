// Reports #124-127, #187-188 (noopen) and #250-260 (autoplay) name the same six learning games. Run the real autoplay on
// them, walking to each game as a child would, at 5x on a phone, and keep every automatic report the tester would send.
// Usage: SV_URL=<served source> node owner-reported-learning.mts <out.json>
import fs from 'node:fs';
import { launch, open, clear } from './harness.mts';
const ids = ['letters', 'numbers', 'counting', 'pattern', 'colors', 'shapes'], live = { releases: { tester: { on: true, devices: ['learnprobe01'] }, autoplay: { on: true, devices: ['learnprobe01'] } }, festivals: {} };
const browser = await launch(), sent = [], out = { url: process.env.SV_URL || 'http://localhost:8765/', ids, rows: [], sent, errors: [] };
try {
  const P = await open(browser, { w: 390, h: 844, touch: true, settings: { voice: false, autoPack: false }, pre: `localStorage.setItem('sv2_playerid','learnprobe01');localStorage.setItem('sv2_tester',JSON.stringify({at:1,b:'r1'}));localStorage.setItem('sv2_live',${JSON.stringify(JSON.stringify(live))});`,
    route: async ctx => { await ctx.route('**/api/live**', r => r.fulfill({ json: live })); await ctx.route('**/api/tester**', r => { const b = r.request().postData(); if (b) { try { const j = JSON.parse(b); sent.push({ kind: j.kind || j.type || null, detail: String(j.detail || j.title || '').slice(0, 160) }); } catch (e) { } } r.fulfill({ json: { ok: true, rid: 'synthetic-learning-receipt', mine: [], open: [] } }); }); } });
  await clear(P.page); await P.page.waitForFunction(() => !!__sv.autoplay);
  await P.page.evaluate(ids => __sv.autoplay.start(ids.map(id => 'game:' + id), 'x5'), ids);
  await P.page.waitForFunction(n => !__sv.autoplay.running() && JSON.parse(localStorage.getItem('sv2_autoplay_report') || '{}').done?.length === n, ids.length, { timeout: 1200000, polling: 2000 });
  out.rows = (await P.page.evaluate(() => JSON.parse(localStorage.getItem('sv2_autoplay_report')).done)).map(r => ({ key: r.key, ok: r.ok, said: r.said, problems: r.problems, secs: r.secs ?? r.t ?? null }));
  out.errors = P.errors; await P.ctx.close();
} catch (e) { out.failure = String(e.message || e).slice(0, 600); }
finally { await browser.close(); fs.writeFileSync(process.argv[2] || 'out/owner-reported-learning.json', JSON.stringify(out, null, 2) + '\n'); }
console.log(JSON.stringify(out.rows.map(r => [r.key, r.ok, (r.problems || []).length])), out.failure || '');
