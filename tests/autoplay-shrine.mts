import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { Browser } from 'playwright';
import { open, clear, noWelcome } from './harness.mts';

export async function autoplayShrineCheck(browser: Browser): Promise<string> {
  const dir = 'out/autoplay-shrine'; fs.mkdirSync(dir, { recursive: true });
  const live = { releases: { autoplay: { on: true, devices: ['shrineprobe001'] } }, festivals: {} };
  const P = await open(browser, { w: 1024, h: 768,
    pre: () => { localStorage.setItem('sv2_playerid', 'shrineprobe001'); },
    route: async ctx => {
      await ctx.route('**/api/live**', route => route.fulfill({ json: live }));
      await ctx.route('**/api/tester**', route => route.fulfill({ json: { ok: true, rid: 'synthetic-shrine-receipt', mine: [], open: [] } }));
    }
  });
  try {
    await clear(P.page); await noWelcome(P.page);
    await P.page.waitForFunction(() => !!window.__sv.autoplay, null, { timeout: 30000 });
    const footprint = await P.page.evaluate(async () => {
      const G = window.__sv, h = G.heroes[0], mismatch: { x: number; z: number; moved: number }[] = [];
      if (!G.goodSpot) throw Error('walkability query unavailable');
      if (!G.solidsReady) throw Error('solid-grid readiness unavailable'); await G.solidsReady;
      for (let x = 27; x <= 29; x += .2) for (let z = -84; z <= -82; z += .2) {
        if (!G.goodSpot(x, z)) continue;
        const p = h.pos.clone().set(x, h.world.groundAt(x, z), z); h.world.collide(p, .45);
        const moved = Math.hypot(p.x - x, p.z - z); if (moved > .02) mismatch.push({ x, z, moved });
      }
      return mismatch;
    });
    fs.writeFileSync(`${dir}/footprint.json`, JSON.stringify(footprint, null, 2));
    const setup = await P.page.evaluate(async () => {
      const G = window.__sv, h = G.heroes[0], api = G.autoplay;
      if (!api || typeof api.start !== 'function') throw Error('autoplay unavailable');
      const target = G.gameSpot?.('counting'); if (!target || !G.clearSpot) throw Error('counting shrine unavailable');
      const [x, z] = G.clearSpot(28, target.z + Math.max(10, (target.r || 0) + 4));
      h.place(x, z); h.goal = null; h.goalAct = null; G.paused = false;
      const setup = { x, z, target: { x: target.x, z: target.z, r: target.r }, distance: Math.hypot(x - target.x, z - target.z) };
      void api.start(['game:counting'], 'fast');
      return setup;
    });
    fs.writeFileSync(`${dir}/setup.json`, JSON.stringify(setup, null, 2));
    assert.ok(setup.distance > (setup.target.r || 0) + 1, 'fixture must start outside the shrine interaction range');
    // The live trail keeps only the last AP_TRAIL steps, so collect it while the run goes: the walk is the first step.
    const seen = new Map<string, [number, string, string]>();
    for (const end = Date.now() + 120000; ;) {
      const now = await P.page.evaluate(() => {
        const api = window.__sv.autoplay;
        if (!api || typeof api.trail !== 'function') throw Error('autoplay trail unavailable');
        return { running: api.running(), trail: api.trail() };
      });
      for (const step of now.trail) seen.set(step.join('|'), step);
      if (!now.running) break;
      assert.ok(Date.now() < end, 'autoplay did not finish the counting shrine within 120 s');
      await P.page.waitForTimeout(100);
    }
    const result = await P.page.evaluate(() => {
      const api = window.__sv.autoplay;
      if (!api || typeof api.trail !== 'function') throw Error('autoplay trail unavailable');
      return { report: JSON.parse(localStorage.getItem('sv2_autoplay_report') || '{}'), trail: api.trail() };
    });
    for (const step of result.trail) seen.set(step.join('|'), step);
    const trail = [...seen.values()].sort((a, b) => a[0] - b[0]);
    fs.writeFileSync(`${dir}/result.json`, JSON.stringify({ ...result, trail }, null, 2));
    await P.page.screenshot({ path: `${dir}/result.png` });
    assert.equal(footprint.length, 0, 'walkability accepts positions rejected by the real child collision footprint: ' + JSON.stringify(footprint.slice(0, 8)));
    const row = result.report.done?.[0];
    assert.ok(row && row.key === 'game:counting' && row.problems.every((problem: string) => /^slow:/.test(problem)), JSON.stringify(result));
    assert.match(row.said, /won/); assert.deepEqual(P.errors, []);
    assert.ok(trail.some(step => step[1] === 'walk'), 'shrine approach did not exercise actual walking');
    return 'actual autoplay enters and wins the counting shrine from the stalled plateau approach; planner positions agree with real child collisions';
  } finally { await P.ctx.close(); }
}
