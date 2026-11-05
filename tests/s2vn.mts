// (v1.08d s2vn) Season 2, Vietnam (js/s2vn.ts, js/content/s2vn.ts, js/games/s2vn.ts): the checks of the new regions and
// their games. Run alone with `node run.mts s2vnregions` or through the suite (`--only s2vnregions,s2vngames`).
import assert from 'node:assert/strict';
import { open, clear, noWelcome } from './harness.mts';

// the regions the branch has built so far (each part adds its own)
export const S2VN = ['mekong', 'halong', 'sapa', 'taynguyen'];

// s2vnregions: each region is closed before its day in the release calendar and open on it (its games too); once open it
// is a place to fly to and a bus stop, and its area (landmark, friend, seller, the three game stands) stands on open
// ground: off every road, out of the water, clear of other solids. Flying there lands on open ground inside the region
// (its name is the region's); the bus's drop-off is on open ground with a clear walk to the area; the seller is in the
// food passport and the dish in the cooking pot; every line is in English and Vietnamese.
export async function s2vnRegionsCheck(b) {
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page); await noWelcome(P.page);
  const out = await P.page.evaluate(async (ids) => {
    const w = (t: number) => new Promise(r => setTimeout(r, t));
    const G = (window as any).__sv, C = await import('/js/custom.js'), R = await import('/js/content/releasecal.js'), W = await import('/js/world.js');
    const A = await import('/js/content/activities.js'), D = await import('/js/content/s2vn.js'), V = await import('/js/vendors.js'), DT = await import('/js/data.js');
    const M = await import('/js/s2vn.js'), today = R.isoDay(new Date()), res: Record<string, unknown> = {}, bad: string[] = [];
    C.setPeeks([], 0);
    for (const id of ids) {
      const r = D.regionOf(id); if (!r) { bad.push(id + ': no data'); continue; }
      // before its day: closed, its games hidden
      C.CUSTOM.releaseCalendar = { moves: { ['feature:' + r.key]: R.addDays(today, 3), } };   // (the games follow their region's day)
      const closed = M.regionOpen(r), hidden = r.games.every(g => A.gameInfo(g).hidden);
      // on its day: open
      C.CUSTOM.releaseCalendar = { moves: { ['feature:' + r.key]: today, } };
      const S = M.installS2vn(G); const openNow = M.regionOpen(r); S.open(id); const shown = r.games.every(g => !A.gameInfo(g).hidden);
      const B = S.ensure(id), info = S.info(id);
      const offRoad = (x: number, z: number, n: string, pad = .6) => { const d = W.roadDist(x, z); if (d.road && d.d < d.road.w / 2 + pad) bad.push(`${id} ${n} on the road ${d.road.id}`); if (W.heightAt(x, z) < W.WATER + .3) bad.push(`${id} ${n} in the water`); };
      for (const [n, q] of Object.entries(info.spots) as [string, { x: number; z: number }][]) offRoad(q.x, q.z, n);
      if (!info.stop) bad.push(id + ': no bus stop'); else offRoad(info.stop.x, info.stop.z, 'bus stop', .2);
      // the place to fly to
      const pl = G.PLACES.find(p => p.key === r.key); if (!pl) bad.push(id + ': not in the fly list');
      const h = G.heroes[0];
      if (pl) { await G.travelTo(h, pl.x, pl.z, false); await w(800); const rg = W.regionAt(h.pos.x, h.pos.z); if (rg !== r.key) bad.push(`${id}: flying lands in ${rg}`);
        if (G.world.colliders.some(c => c.r > 0 && c.top == null && Math.hypot(c.x - h.pos.x, c.z - h.pos.z) < c.r)) bad.push(id + ': flying lands inside a solid'); offRoad(h.pos.x, h.pos.z, 'landing'); }
      // the bus: in the stop list, the drop-off (as js/traffic.ts sets the rider down) on open ground with a clear walk in
      const stop = G.world.busStops.find(s => s.place && s.place.key === r.key); if (!stop) bad.push(id + ': not in the bus stops');
      if (stop) { const x0 = stop.x + 1.2, z0 = stop.z + 1.2; offRoad(x0, z0, 'drop-off', -.5);
        const L = Math.hypot(r.at[0] - x0, r.at[1] - z0); for (let k = 0; k <= L; k += 1) { const x = x0 + (r.at[0] - x0) * k / L, z = z0 + (r.at[1] - z0) * k / L;
          if (W.heightAt(x, z) < W.WATER + .3) { bad.push(id + ': water on the walk in'); break; }
          if (G.world.boxes.some(q => x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1)) { bad.push(id + ': a building on the walk in'); break; } } }
      // the area's people and places
      const need = ['s2_lm_' + r.id, 'v_' + r.friend.id, 'v_' + r.food.id, ...r.games.map(g => 'g_' + g)];
      for (const iid of need) if (!G.interactables.some(i => i.id === iid)) bad.push(`${id}: ${iid} missing`);
      for (const g of r.games) { const sp = G.gameSpot(g); if (!sp || sp.id !== 'g_' + g) bad.push(`${id}: ${g} has no place of its own`); }
      if (!V.VENDORS.some(v => v.id === r.food.id)) bad.push(id + ': seller not in the food passport');
      if (!DT.RECIPES.some(x => x.id === r.food.recipe.id)) bad.push(id + ': dish not in the cooking pot');
      const pairs = [r.name, r.welcome, r.festival, r.landmark.name, r.landmark.fact, r.friend.hello, ...r.friend.lines, r.food.greet, r.food.recipe.name];
      if (!pairs.every(p => p[0] && p[1] && p[0] !== p[1] || p === r.name || p === r.food.recipe.name)) bad.push(id + ': a line without both languages');
      res[id] = { closed, hidden, openNow, shown, parts: B.parts.length, stop: info.stop && [Math.round(info.stop.x), Math.round(info.stop.z)] };
      if (closed || !hidden || !openNow || !shown) bad.push(`${id}: calendar ${JSON.stringify(res[id])}`);
    }
    return { res, bad };
  }, S2VN);
  const errs = P.errors.filter(e => !/WebGL/i.test(e)); await P.ctx.close();
  assert.deepEqual(out.bad, []); assert.deepEqual(errs, []);
  return `${S2VN.length} region(s): closed before their day, open on it with their games; fly and bus land on open ground; landmark, friend, seller, dish and 3 game places, off roads and water: ${JSON.stringify(out.res)}`;
}

// s2vngames: every Season 2 game played to its win at each level (Easy, Medium, Hard, Talent and as an under-5), tapping
// only the visible right answers; then the shared checks run on just these games: levels differ (levelsall), rounds
// never repeat and the right answer moves (roundvariety), and one screen on every size with big text (gamefit)
export async function s2vnGamesCheck(b) {
  const t0 = Date.now(); const P = await open(b, { w: 1000, h: 700, settings: { voice: false } }); await clear(P.page); await noWelcome(P.page);
  const ids: string[] = await P.page.evaluate(async (regions) => { const D = await import('/js/content/s2vn.js'); return regions.flatMap(r => D.regionOf(r).games); }, S2VN);
  const played: string[] = [], bad: string[] = [];
  for (const id of ids) for (const lv of ['little', 'easy', 'medium', 'hard', 'talent']) {
    const r = await P.page.evaluate(async ([id, lv]) => {
      const w = (t: number) => new Promise(r => setTimeout(r, t)), G = (window as any).__sv, p = G.heroes[0].profile, frame = await import('/js/games/frame.js');
      p.age = lv === 'little' ? 'little' : 'big'; p.unlockAll = true; p.gameDiff = { ...(p.gameDiff || {}), [id]: lv === 'little' ? 'easy' : lv };
      void G.playGame(0, id, 'replay'); let gl = null; for (let k = 0; k < 50 && !gl; k++) { await w(100); gl = document.querySelector('.gl:not(.out)'); }
      if (!gl) return { won: false, taps: 0, why: 'did not open' };
      let taps = 0; const end = Date.now() + 40000;
      while (Date.now() < end && !document.querySelector('.gl-win')) { const ask = frame.playWatch.ask, e = ask?.els.find(ask.check); if (e instanceof HTMLElement && e.isConnected && e.getBoundingClientRect().width) { e.click(); taps++; } await w(120); }
      const won = !!document.querySelector('.gl-win'), small = [...gl.querySelectorAll('.gl-stage small, .gl-stage b')].filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).length;
      gl.querySelector('.gl-x')?.click(); await w(400); document.querySelectorAll('.dialog,.reward,.modal,.storybook').forEach(e => e.remove()); G.paused = false;
      return { won, taps, small };
    }, [id, lv]);
    if (!r.won) bad.push(`${id} ${lv}: not won (${JSON.stringify(r)})`); else played.push(`${id}:${lv}`);
    if (r.small) bad.push(`${id} ${lv}: ${r.small} words under 16 px`);
  }
  const errs = P.errors.filter(e => !/WebGL/i.test(e)); await P.ctx.close();
  assert.deepEqual(bad, []); assert.deepEqual(errs, []); console.log(`  s2vngames: played in ${Math.round((Date.now() - t0) / 1000)} s`);
  const part = async <V,>(name: string, f: () => Promise<V>): Promise<V> => { try { return await f(); } catch (e) { throw new Error(`${name}: ${(e as Error).message}`); } };
  const L = await part('levelsall', async () => (await import('./levels-all.mts')).levelsAllCheck(b, ids));
  return `${ids.length} games won at every level and as an under-5 (${played.length} plays); levelsall: ${L}`;
}

// s2vnfit: the shared game checks on just these games, each in a fresh browser, one page at a time (a small machine's
// software drawing is too slow for three windows at once): rounds never repeat and the right answer moves
// (roundvariety), and one screen on every size with big text (gamefit)
export async function s2vnFitCheck() {
  const { launch } = await import('./harness.mts'), ids = await gameIds();
  const fresh = async <V,>(name: string, f: (b) => Promise<V>): Promise<V> => { const b = await launch(); try { return await f(b); } catch (e) { throw new Error(`${name}: ${(e as Error).message}`); } finally { await b.close(); } };
  const wk = process.env.WORKERS; process.env.WORKERS = '1';
  // (one game per browser: many games in one page grow too slow for the click waits on a small machine)
  let V = 0; try { for (const id of ids) { await fresh('roundvariety ' + id, async b => (await import('./round-variety.mts')).roundVarietyCheck(b, { only: [id] })); V++; } } finally { if (wk == null) delete process.env.WORKERS; else process.env.WORKERS = wk; }
  const F: string[] = []; process.env.SV_FIT_GAMES = ids.join(',');
  try { for (const sz of ['phone', 'phonelittle', 'land', 'land2', 'port', 'computer']) { process.env.SV_FIT_SIZES = sz; F.push(await fresh('gamefit ' + sz, async b => (await import('./gamefit-browser.mts')).gameFitCheck(b))); } }
  finally { delete process.env.SV_FIT_GAMES; delete process.env.SV_FIT_SIZES; }
  return `${ids.length} games; roundvariety: ${V} games, no round repeats and the right answer moves, at every level; gamefit: ${F.join(' / ')}`;
}
// the ids of the Season 2 games of the regions above (read from the content file, which has no imports)
async function gameIds(): Promise<string[]> { const D = await import('../js/content/s2vn.ts'); return S2VN.flatMap(r => D.regionOf(r)!.games); }
