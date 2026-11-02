// Reports #251/#256: autoplay "stuck at 233, -56" on its way to Shadow Shapes (the village shadow theatre). Walk the real
// autoplay route there N times from where the game starts a child, and record each stall and what stands there.
// Usage: SV_URL=<served source> node owner-theatre-walk.mts <out.json> [tries]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launch, open, clear } from './harness.mts';
const tries = Number(process.argv[3] || 8), live = { releases: { autoplay: { on: true, devices: ['walkprobe001'] } }, festivals: {} };
const browser = await launch(), out = { url: process.env.SV_URL || 'http://localhost:8765/', tries, runs: [] };
try {
  const P = await open(browser, { w: 390, h: 844, touch: true, settings: { voice: false, autoPack: false }, pre: `localStorage.setItem('sv2_playerid','walkprobe001');localStorage.setItem('sv2_live',${JSON.stringify(JSON.stringify(live))});`,
    route: async ctx => { await ctx.route('**/api/live**', r => r.fulfill({ json: live })); await ctx.route('**/api/tester**', r => r.fulfill({ json: { ok: true, rid: 'x', mine: [], open: [] } })); } });
  await clear(P.page); await P.page.waitForFunction(() => !!__sv.autoplay); if (process.env.SV_FAR) await P.page.evaluate(() => { window.__far = true; });
  out.spot = await P.page.evaluate(async () => { const G = __sv, it = G.gameSpot('shapes'), W = await import('/js/world.js');
    const near = (G.world.colliders || []).filter(c => Math.hypot(c.x - it.x, c.z - it.z) < 8).map(c => ({ x: +c.x.toFixed(2), z: +c.z.toFixed(2), r: c.r, top: c.top ?? null }));
    const boxes = (G.world.boxes || []).filter(b => it.x > b.x0 - 8 && it.x < b.x1 + 8 && it.z > b.z0 - 8 && it.z < b.z1 + 8).map(b => ({ x0: +b.x0.toFixed(2), x1: +b.x1.toFixed(2), z0: +b.z0.toFixed(2), z1: +b.z1.toFixed(2), top: b.top ?? null }));
    return { id: it.id, x: +it.x.toFixed(2), z: +it.z.toFixed(2), r: it.r, ground: +W.heightAt(it.x, it.z).toFixed(2), colliders: near, boxes }; });
  for (let k = 0; k < tries; k++) {
    await P.page.evaluate(() => { const h = __sv.heroes[0]; const far = window.__far ? [-104, -128] : [204, -36]; h.place(far[0] + (Math.random() - .5) * 6, far[1] + 4 + (Math.random() - .5) * 6); localStorage.removeItem('sv2_autoplay_report'); });
    await P.page.waitForTimeout(800);
    await P.page.evaluate(() => __sv.autoplay.start(['game:shapes'], 'x5'));
    await P.page.waitForFunction(() => !__sv.autoplay.running() && JSON.parse(localStorage.getItem('sv2_autoplay_report') || '{}').done?.length === 1, null, { timeout: 240000, polling: 1000 });
    out.runs.push(await P.page.evaluate(() => { const r = JSON.parse(localStorage.getItem('sv2_autoplay_report')).done[0]; return { ok: r.ok, problems: r.problems, said: r.said }; }));
  }
  out.errors = P.errors; await P.ctx.close();
} catch (e) { out.failure = String(e.message || e).slice(0, 500); }
finally { await browser.close(); fs.writeFileSync(process.argv[2] || 'out/theatre-walk.json', JSON.stringify(out, null, 2) + '\n'); }
console.log(JSON.stringify({ spot: out.spot && { x: out.spot.x, z: out.spot.z, r: out.spot.r }, runs: out.runs.map(r => r.problems.join('; ') || 'ok'), failure: out.failure }));
assert.ok(!out.failure && out.runs.length === tries && out.runs.every(r => r.ok), 'Every trip to Shadow Shapes must reach it: ' + JSON.stringify(out.runs));
