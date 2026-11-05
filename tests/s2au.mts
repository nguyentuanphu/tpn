// (v1.08d s2au) checks for Season 2, Australia (docs/cores/tasks/v108d/s2au-brief.md): the regions in the valley, their
// games and their lantern chapters. Run through tests/run.mts or tests/suite.mts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { open, clear, openAllGamesFixture } from './harness.mts';

const SCREENS = [['phone', 390, 844, true], ['phone sideways', 844, 390, true], ['tablet', 820, 1180, true], ['tablet sideways', 1180, 820, true], ['computer', 1440, 900, false]] as const;
const REGION_IDS = { gbr: 'gbr', tas: 'tasmania', perth: 'perth' };

// s2au: the regions' places, the coast boat and the release days. Every region is shut before its day (no games in the
// hub, no pin, a "coming soon" sign) and open on it; its models are not built until a child comes near (nothing of
// Season 2 is in the first download); every spot a child walks to is dry open ground off the roads; the friend gives the
// food once and the stand once a day; the coast boat sails only on water and stops at every region; the islands are land.
export async function s2auCheck(b) {
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page); const pg = P.page;
  // (js/s2au.js comes 2 s after the start; the region's models, drawings and chapters only when needed)
  const startJs = await pg.evaluate(() => { const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return performance.getEntriesByType('resource').filter(e => /s2au|chapter1\d/.test(e.name) && !/art\/s2au/.test(e.name) && !(/\/js\/s2au\.js/.test(e.name) && e.startTime > nav.domContentLoadedEventEnd + 1500)).map(e => e.name); });
  await pg.waitForFunction(() => !!__sv.s2au, null, { timeout: 15000 });
  const R = await pg.evaluate(async () => {
    const G = __sv, C = await import('/js/custom.js'), Rc = await import('/js/content/releasecal.js'), A = await import('/js/content/activities.js'), W = await import('/js/world.js');
    const S = G.s2au, today = Rc.isoDay(new Date()), out: any = { regions: [] };
    const shut = Object.fromEntries(S.regions.map(r => [r.key, Rc.addDays(today, 5)]));
    C.CUSTOM.releaseCalendar = { moves: shut }; S.sync();
    out.closedGames = S.regions.flatMap(r => r.stands.map(s => s[0])).filter(id => !A.gameInfo(id).hidden);
    out.closedPins = G.PLACES.filter(p => S.regions.some(r => r.place === p.key)).map(p => p.key);
    out.signs = S.regions.filter(r => G.interactables.some(i => i.id === 's2soon_' + r.id && (!i.visible || i.visible(G.heroes[0])))).length;
    out.builtEarly = [...S.built];
    C.CUSTOM.releaseCalendar = { moves: Object.fromEntries(S.regions.map(r => [r.key, today])) }; S.sync();
    out.openGames = S.regions.flatMap(r => r.stands.map(s => s[0])).filter(id => A.gameInfo(id).hidden);
    const dry = (x, z) => { const d = W.roadDist(x, z); return W.heightAt(x, z) > W.WATER + .3 && !(d.road && d.d < d.road.w / 2 + .5); };
    for (const r of S.regions) {
      const ids = ['s2f_' + r.friend.id, 's2food_' + r.id, 'pc_' + r.landmark.id, ...r.stands.map(s => 's2g_' + s[0])];
      const its = ids.map(id => G.interactables.find(i => i.id === id));
      const pin = G.PLACES.find(p => p.key === r.place);
      out.regions.push({ id: r.id, missing: ids.filter((id, k) => !its[k]), wet: its.filter(i => i && !dry(i.x, i.z)).map(i => i.id), pin: !!pin && dry(pin.x, pin.z),
        spots: r.stands.every(s => G.gameSpot(s[0])?.id === 's2g_' + s[0]) });
    }
    // the food: once from the friend at the first meeting, and once a day from the stand
    const h = G.heroes[0], p = h.profile, r0 = S.regions[0]; p.dishes = {}; p.s2au = {};
    const f = G.interactables.find(i => i.id === 's2f_' + r0.friend.id); const pr = f.act(h); await new Promise(r => setTimeout(r, 300));
    for (let i = 0; i < 4 && document.querySelector('.dialog:not(.out)'); i++) { (document.querySelector('.dialog:not(.out) [data-k="1"], .dialog:not(.out) .dch:last-child') as HTMLElement | null)?.click(); (document.querySelector('.dialog:not(.out)') as HTMLElement)?.click(); await new Promise(r => setTimeout(r, 300)); }
    await Promise.race([pr, new Promise(r => setTimeout(r, 1500))]);
    const fs = G.interactables.find(i => i.id === 's2food_' + r0.id); fs.act(h); fs.act(h);
    out.food = p.dishes[r0.food.id] || 0;
    // the islands are land; the coast boat: on water all the way, a stop for every region
    const M = await import('/js/content/map.js');
    out.isleH = M.ISLES.map(I => +W.heightAt(I.at[0], I.at[1]).toFixed(1));
    const F = (G.ferries?.ferries || []).find(F => F.boat === 'coastboat');
    out.boat = F ? { stops: F.stops.map(s => s.id), wet: F.path.filter(q => W.heightAt(q.x, q.z) > W.WATER - .3).length, n: F.path.length } : null;
    return out;
  });
  await pg.evaluate(() => document.querySelectorAll('.dialog, .modal').forEach(e => e.remove()));
  // a child flies near the reef: the region is built then (not before)
  const built = await pg.evaluate(async () => { const G = __sv, h = G.heroes[0], r = G.s2au.regions[0], a = (await import('/js/content/map.js')).anchorOf(r.place);
    h.place(a[0], a[1] - 4); for (let i = 0; i < 40 && !G.s2au.built.has(r.id); i++) await new Promise(q => setTimeout(q, 250)); return [...G.s2au.built]; });
  const errs = P.errors.filter(e => !/WebGL/i.test(e)); await P.ctx.close();
  assert.deepEqual(startJs, [], 'Season 2 is not in the first download');
  assert.deepEqual(R.closedGames, [], 'games shut before their day'); assert.deepEqual(R.closedPins, [], 'no map pin before the day');
  assert.equal(R.signs, R.regions.length || 3, 'a coming-soon sign for each region'); assert.deepEqual(R.builtEarly, [], 'not built before a child comes near');
  assert.deepEqual(R.openGames, [], 'games open on their day');
  for (const r of R.regions) { assert.deepEqual(r.missing, [], r.id); assert.deepEqual(r.wet, [], r.id + ' on dry open ground'); assert.ok(r.pin, r.id + ' pin'); assert.ok(r.spots, r.id + ' game places'); }
  assert.equal(R.food, 2, 'the friend gives the food once and the stand once a day');
  for (const h of R.isleH) assert.ok(h > 1, 'island above the sea: ' + R.isleH);
  assert.ok(R.boat, 'the coast boat'); assert.deepEqual(R.boat.stops, ['melbourne', 'gbr', 'tasmania', 'perth', 'rottnest']);
  assert.equal(R.boat.wet, 0, `the boat sails on water (${R.boat.wet} of ${R.boat.n} points on land)`);
  assert.ok(built.includes('gbr'), 'built when a child comes near'); assert.deepEqual(errs, []);
  return `${R.regions.length} regions shut before their day (sign, no pin, games hidden) and open on it; friend, food, landmark and 3 game stands each on dry open ground; food once from the friend, once a day from the stand; islands ${R.isleH.join(', ')} m; the coast boat ${R.boat.stops.join(' → ')} on water; built only when a child comes near, nothing in the first download`;
}

// s2aureef, s2autas, s2auperth: each region's three games, played to a win by real taps at Easy and at Talent (a big
// kid), where Talent asks for more; and each fits one screen on a phone (upright and sideways), a tablet (both) and a
// computer: every thing to tap is on screen with nothing to scroll, the text at least 16 px, the taps at least 44 px
export async function s2auGamesCheck(b, region: 'gbr' | 'tas' | 'perth') {
  const ids: string[] = (await import('../js/content/s2au-games.ts')).S2_GAMES.filter(g => g.region === region).map(g => g.id);
  assert.equal(ids.length, 3, region + ': three games');
  const P = await openAllGamesFixture(b, { w: 390, h: 844, touch: true, settings: { voice: false } }); await clear(P.page);
  const fails: string[] = [], played: Record<string, { shown: string; taps: number; won: boolean }> = {};
  await P.page.emulateMedia({ reducedMotion: 'reduce' });
  for (const id of ids) for (const d of ['easy', 'talent']) {
    await P.page.evaluate(([id, d]) => { document.querySelectorAll('.gl, .modal').forEach(g => g.remove()); __sv.paused = false; const p = __sv.heroes[0].profile; p.age = 'big'; p.gameDiff = { ...(p.gameDiff || {}), [id]: d }; __sv.playGame(0, id, 'hub'); }, [id, d]);
    if (!await P.page.waitForSelector(`.gl[data-game-id="${id}"]:not(.out)`, { timeout: 10000 }).then(() => true, () => false)) { fails.push(`${id} ${d}: did not open`); continue; }
    await P.page.waitForTimeout(1500);
    const shown = await P.page.evaluate(() => (document.querySelector('.gl:not(.out) .gl-stage, .gl:not(.out) [data-lv]') as HTMLElement | null)?.dataset.lv || '');
    let taps = 0, won = false, stuck = 0;
    for (let k = 0; k < 400 && !won; k++) {
      const t = await P.page.evaluate(async () => {
        const { playWatch } = await import('/js/games/frame.js'), gl = document.querySelector('.gl:not(.out)');
        if (!gl) return { gone: true }; if (gl.querySelector('.gl-win')) return { won: true };
        const ok = e => e && e.isConnected && !e.disabled && e.getBoundingClientRect().width > 0;
        let e = null; const a = playWatch.ask;
        if (a && a.els.some(ok)) e = a.els.find(x => ok(x) && a.check(x)); else if (playWatch.plan) e = playWatch.plan();
        if (!ok(e)) return { wait: true };
        const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, at = document.elementFromPoint(x, y);
        return { x, y, on: !!at && (at === e || e.contains(at)) };
      });
      if (t.won) { won = true; break; } if (t.gone) break;
      if (t.wait) { if (++stuck > 120) break; await P.page.waitForTimeout(150); continue; }
      stuck = 0; if (!t.on) { fails.push(`${id} ${d}: something covers the answer`); break; }
      await P.page.touchscreen.tap(t.x, t.y); taps++; await P.page.waitForTimeout(120);
    }
    played[id + ':' + d] = { shown, taps, won };
    if (!won) fails.push(`${id} ${d}: not won (${taps} taps)`);
    await P.page.evaluate(() => { document.querySelector('.gl:not(.out) .gl-x')?.click(); }); await P.page.waitForTimeout(400);
  }
  for (const id of ids) { const e = played[id + ':easy'], t = played[id + ':talent']; if (e && t && !(t.taps > e.taps || t.shown !== e.shown)) fails.push(`${id}: Talent is not harder (${t.shown} / ${e.shown})`); }
  // one screen on five sizes, at Talent (the most on screen)
  fs.mkdirSync('out/s2au', { recursive: true });
  for (const [name, w, h, touch] of SCREENS) {
    await P.page.setViewportSize({ width: w, height: h });
    for (const id of ids) {
      await P.page.evaluate(([id]) => { document.querySelectorAll('.gl, .modal').forEach(g => g.remove()); __sv.paused = false; const p = __sv.heroes[0].profile; p.age = 'big'; p.gameDiff = { ...(p.gameDiff || {}), [id]: 'talent' }; __sv.playGame(0, id, 'hub'); }, [id]);
      await P.page.waitForSelector(`.gl[data-game-id="${id}"]:not(.out)`, { timeout: 10000 }).catch(() => { });
      await P.page.waitForFunction(() => document.querySelectorAll('.gl:not(.out) .mx-tap, .gl:not(.out) .mx-btn').length > 0, null, { timeout: 8000 }).catch(() => { });
      await P.page.waitForTimeout(500);
      const fit = await P.page.evaluate(() => { const gl = document.querySelector('.gl:not(.out)') as HTMLElement; if (!gl) return { none: true };
        const vw = innerWidth, vh = innerHeight, taps = [...gl.querySelectorAll('.mx-tap, .mx-btn, .gl-x')].map(e => e.getBoundingClientRect());
        const off = taps.filter(r => r.bottom > vh + 1 || r.right > vw + 1 || r.top < -1 || r.left < -1).length, small = taps.filter(r => r.width < 44 || r.height < 44).length;
        const scroll = [gl, ...gl.querySelectorAll('*')].some(e => { const s = getComputedStyle(e); return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 2; }) || document.scrollingElement!.scrollHeight > vh + 2;
        const tiny = [...gl.querySelectorAll('small, .mx-btn, .gl-title, h1, h2')].filter(e => (e as HTMLElement).innerText.trim() && parseFloat(getComputedStyle(e).fontSize) < 16).length;
        return { n: taps.length, off, small, scroll, tiny }; });
      if ((fit as any).none) { fails.push(`${id} ${name}: did not open`); continue; }
      const F = fit as { n: number; off: number; small: number; scroll: boolean; tiny: number };
      if (F.off) fails.push(`${id} ${name}: ${F.off} of ${F.n} taps off screen`); if (F.small) fails.push(`${id} ${name}: ${F.small} taps under 44 px`);
      if (F.scroll) fails.push(`${id} ${name}: scrolls`); if (F.tiny) fails.push(`${id} ${name}: ${F.tiny} texts under 16 px`);
      if (name !== 'tablet sideways') await P.page.screenshot({ path: `out/s2au/${id}-${name.replace(' ', '-')}.png` });
      await P.page.evaluate(() => { document.querySelector('.gl:not(.out) .gl-x')?.click(); }); await P.page.waitForTimeout(500);
    }
  }
  const errs = P.errors.filter(e => !/WebGL/i.test(e)); await P.ctx.close();
  assert.deepEqual(fails, []); assert.deepEqual(errs, []);
  return `${ids.join(', ')}: won by real taps at Easy and Talent (${ids.map(id => `${id} ${played[id + ':easy'].taps}→${played[id + ':talent'].taps} taps`).join(', ')}); one screen on 5 sizes; pictures in tests/out/s2au`;
}

// chapter10 to chapter12: played like chapters 4 and 5 (tests/story-v108b.mts chapterKitCheck), after every chapter
// before it (the story helper's and s2vn's chapters that are on this branch)
export async function s2auChapterCheck(b, id: 'ch10' | 'ch11' | 'ch12') {
  const n = +id.slice(2), before = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'finale'];
  for (let k = 6; k < n; k++) if (fs.existsSync(new globalThis.URL(`../js/content/chapter${k}.ts`, import.meta.url))) before.push('ch' + k);
  return (await import('./story-v108b.mts')).chapterKitCheck(b, id, before);
}
