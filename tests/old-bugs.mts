// v1.07 old-bugs (#341, #739): checks for the fixes made for the oldest open bugs.
import type { Browser, BrowserContext } from 'playwright';
import { open, clear } from './harness.mts';

const testerPre = (extra = '') => `try { localStorage.setItem('sv2_playerid', 'tester000001'); localStorage.setItem('sv2_live', JSON.stringify({ releases: { tester: { on: true, devices: ['tester000001'] } }, festivals: {} })); localStorage.setItem('sv2_tester', JSON.stringify({ at: 1, b: 'r1' })); ${extra} } catch (e) { }`;
const testerSite = async (ctx: BrowserContext) => { const got: any[] = [];
  await ctx.route('**/api/tester**', async rt => { const q = rt.request();
    if (q.method() === 'POST') { let body = null; try { body = JSON.parse(q.postData() || 'null'); } catch (e) { } got.push(body); return rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, k: '0123456789abcdef', rid: 'fedcba9876543210', status: 'new' }) }); }
    return rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ mine: [], open: [], retest: [], helped: 0, reports: 0 }) }); });
  return got; };
const waitFor = async <T,>(list: T[], match: (x: T) => boolean, ms: number, pause: (ms: number) => Promise<void>) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const hit = list.find(match); if (hit) return hit; await pause(200); } return null; };

/** (#341) the test browser draws with SwiftShader, like a computer without a working graphics chip */
export async function softGraphicsCheck(b: Browser): Promise<string> {
  // a big computer (16 cores, a wide screen) on Graphics Auto: before v1.07 it got shadows and smoothing ('mid')
  const P = await open(b, { w: 1280, h: 800, settings: { quality: 'auto' }, pre: `Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 16 });` });
  try {
    await clear(P.page);
    const r0 = await P.page.evaluate(() => { const G = (window as any).__sv; return { gpu: G.gpu, quality: G.quality, shadows: G.renderer.shadowMap.enabled }; });
    // the frames here are slower than 4 a second (over 250 ms each): Auto now makes the picture lighter instead of
    // leaving such frames out; it never goes under half the screen's pixels
    const prs: number[] = [];
    for (let k = 0; k < 8; k++) { await P.page.mouse.move(300 + k * 20, 300); await P.page.waitForTimeout(1000); prs.push(await P.page.evaluate(() => (window as any).__sv.renderer.getPixelRatio())); }
    const errors = [...P.errors];
    const bad: string[] = [];
    if (!r0.gpu || !r0.gpu.soft || !/^software: .*SwiftShader/i.test(r0.gpu.name) || r0.gpu.name.length > 40) bad.push('software graphics not told apart: ' + JSON.stringify(r0.gpu));
    if (r0.quality !== 'low' || r0.shadows) bad.push('Auto on software graphics still draws the heavy picture: ' + JSON.stringify(r0));
    const last = prs[prs.length - 1];
    if (!(last >= .5 && last <= .75)) bad.push('Auto did not lighten slow frames (pixel ratio after 8 s): ' + prs.join(', '));
    if (errors.length) bad.push(errors.join(' | '));
    if (bad.length) throw Error(bad.join(' | '));
    return `${r0.gpu.name}: Auto draws the light picture (no shadows) on a 16-core computer; very slow frames lower the pixels to ${last}x (never under 0.5x)`;
  } finally { await P.ctx.close(); }
}

/** (#739) a freeze report says whether the page was busy or the picture was not drawn, also where Safari cannot measure long scripts */
export async function freezeWhyCheck(b: Browser): Promise<string> {
  // like Safari: no long-task observer
  const noLong = `{ const d = Object.getOwnPropertyDescriptor(PerformanceObserver, 'supportedEntryTypes'); const all = d && d.get ? d.get.call(PerformanceObserver) : []; Object.defineProperty(PerformanceObserver, 'supportedEntryTypes', { get: () => all.filter(t => t !== 'longtask'), configurable: true }); }`;
  const P = await open(b, { w: 1024, h: 768, pre: testerPre(noLong) }); const got = await testerSite(P.ctx);
  const pause = (ms: number) => P.page.waitForTimeout(ms);
  try {
    await P.page.waitForFunction(() => (window as any).__sv.tester && document.querySelector('.tester-floating.z-lb'), null, { timeout: 15000 }); await clear(P.page);
    await P.page.waitForFunction(() => { const t = (window as any).__sv?.tester; return t?.mountedAt && performance.now() - t.mountedAt() > 15200; }, null, { timeout: 30000 });
    // the test browser draws the valley in software at about 2 frames a second, which freezes by itself now and then:
    // a window on top stops the valley's drawing (as in the game), so only the freezes made here happen
    await P.page.evaluate(() => { (window as any).__sv.paused = true; const m = document.createElement('div'); m.className = 'modal freeze-check'; document.body.append(m); });
    await pause(3000);
    const freezes = () => got.filter(x => x && x.auto === 'freeze');
    // (a report carries the last 30 seconds: its own freeze is the last such line)
    const lineOf = (r: any) => (r.log || []).map((l: any[]) => l[2]).filter((s: string) => /longest script/.test(s)).pop() || '';
    // 1. the page is busy for 2.6 s (the game's own code)
    const n0 = freezes().length;
    await P.page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => { const t = performance.now(); while (performance.now() - t < 2600) { } r(); }))));
    const busy = await waitFor(got, x => x && x.auto === 'freeze' && freezes().indexOf(x) >= n0, 8000, pause);
    // 2. the page is free but no frame comes for 3.6 s (the graphics side stopped drawing; a different length, because
    //    the same freeze in the same place again within a while is one report)
    await pause(3500); const n1 = freezes().length;
    await P.page.evaluate(() => new Promise<void>(r => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => raf(() => setTimeout(() => raf(cb), 3600)) as any; setTimeout(() => { window.requestAnimationFrame = raf; r(); }, 1000); }));
    const free = await waitFor(got, x => x && x.auto === 'freeze' && freezes().indexOf(x) >= n1 && parseFloat(x.detail) >= 3.4, 9000, pause);
    const bad: string[] = [];
    const busyLine = busy ? lineOf(busy) : '', freeLine = free ? lineOf(free) : '';
    const busyMs = +(/page busy (\d+) ms/.exec(busyLine)?.[1] ?? -1), freeMs = +(/page busy (\d+) ms/.exec(freeLine)?.[1] ?? -1);
    if (!busy || !/longest script not measured/.test(busyLine) || busyMs < 2000 || /not drawn/.test(busyLine)) bad.push('a busy page: ' + (busyLine || 'no freeze report'));
    if (!free || freeMs < 0 || freeMs > 1000 || !/\(free, not drawn\)/.test(freeLine)) bad.push('a page free but not drawn: ' + (freeLine || 'no freeze report') + '; every freeze: ' + JSON.stringify(freezes().map(x => [x.detail, lineOf(x)])));
    const gpu = (busy || free)?.dev?.gpu || '';
    if (!/^software: /.test(gpu)) bad.push('the report does not name the graphics: ' + JSON.stringify((busy || free)?.dev));
    if (P.errors.length) bad.push(P.errors.join(' | '));
    if (bad.length) throw Error(bad.join(' | '));
    return `without a long-task observer (Safari): "${busyLine}" and "${freeLine}"; device graphics "${gpu}"`;
  } finally { await P.ctx.close(); }
}

/** (#355) walking from place to place and playing games: every 3D shape and picture the graphics hold is still in the
 * valley (a shape is sent to the graphics the first time it is seen and kept, so the total can grow only up to the
 * valley's own; one left behind after its object was taken away would be a leak that grows with play time) */
export async function longPlayMemoryCheck(b: Browser): Promise<string> {
  const P = await open(b, { w: 390, h: 844, touch: true });
  try {
    await clear(P.page);
    const count = () => P.page.evaluate(() => { const G = (window as any).__sv, geos = new Set(), texs = new Set();
      G.scene.traverse((o: any) => { if (o.geometry) geos.add(o.geometry); for (const m of (Array.isArray(o.material) ? o.material : o.material ? [o.material] : [])) for (const v of Object.values(m)) if (v && (v as any).isTexture) texs.add(v); });
      // (three.js: a shape sent to the graphics gets a 'dispose' listener; a picture sent gets __webglInit)
      const sent = [...geos].filter((g: any) => g._listeners?.dispose?.length).length, texSent = [...texs].filter(t => G.renderer.properties.get(t).__webglInit).length;
      return { inScene: geos.size, sent, held: G.renderer.info.memory.geometries, texInScene: texs.size, texSent, texHeld: G.renderer.info.memory.textures }; });
    const before = await count();
    const places: number[][] = await P.page.evaluate(async () => (await import('/js/world.js')).CITIES.slice(0, 6).map((c: any) => [c.x, c.z]));
    for (const [x, z] of places) { await P.page.evaluate(([x, z]) => (window as any).__sv.heroes[0].place(x, z + 6), [x, z]); await P.page.waitForTimeout(3500); }
    for (const id of ['memory', 'caro', 'counting']) {
      await P.page.evaluate(id => { void (window as any).__sv.playGame(0, id, 'replay'); }, id); await P.page.locator('.gl').waitFor();
      await P.page.waitForTimeout(1500); await P.page.locator('.gl-x').click(); await P.page.waitForSelector('.gl', { state: 'detached' });
    }
    await P.page.waitForTimeout(1500);
    const after = await count();
    // (a few shapes may be drawn once without a place in the valley: the sky's light setup, a game's preview)
    const bad: string[] = [];
    if (after.held > after.sent + 12) bad.push(`the graphics hold ${after.held} shapes, ${after.held - after.sent} of them no longer in the valley`);
    if (after.texHeld > after.texSent + 12) bad.push(`the graphics hold ${after.texHeld} pictures, ${after.texHeld - after.texSent} of them no longer in the valley`);
    if (!(after.held > before.held)) bad.push('walking to new places drew nothing new: ' + JSON.stringify({ before, after }));
    if (P.errors.length) bad.push(P.errors.join(' | '));
    if (bad.length) throw Error(bad.join(' | ') + ' ' + JSON.stringify({ before, after }));
    return `${places.length} places and 3 games: the graphics hold ${after.held} shapes (${after.sent} of the valley's ${after.inScene} in use) and ${after.texHeld} pictures (${after.texSent} of ${after.texInScene} in use), from ${before.held} and ${before.texHeld}`;
  } finally { await P.ctx.close(); }
}
