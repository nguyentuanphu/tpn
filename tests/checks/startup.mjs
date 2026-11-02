// Sparkle Valley checks: Start-up, saves, offline, updates and install.
// Run them through tests/run.mjs (node run.mjs <check>) or tests/suite.mjs, not on their own.
// Moved unchanged from tests/run.mjs (v1.07 split-tests, 2 Nov 2026 AEDT); see tests/checks/README.md.
import { fs, launch, open, clear, start, URL, seedPlayers, only, want, check, ok, packedSite, serveFolder, b, ownerSmoke } from './shared.mjs';

await check('boot', async () => {
  for (const [w, h, touch] of [[390, 844, true], [1024, 768, true], [1280, 800, false]]) {
    const P = await open(b, { w, h, touch }); await clear(P.page);
    const n = await P.page.evaluate(() => __sv.heroes.length); ok(n === 1, 'no hero');
    await P.page.screenshot({ path: `out/boot-${w}.png` });
    ok(!P.errors.length, `${w}px: ${P.errors.join(' | ')}`); await P.ctx.close();
  }
});

await check('lighterload', async () => {
  const got = [];
  const P = await open(b, { play: false, route: async ctx => {
    ctx.on('request', q => got.push(new globalThis.URL(q.url()).pathname));
    await ctx.route('**/js/games/thinking.js', async r => { await new Promise(done => setTimeout(done, 700)); await r.continue(); });
  } });
  try {
    ok(!got.some(s => /\/js\/(games\/thinking|tales-content|howto-player)\.js$/.test(s)), 'optional implementation fetched before opening: ' + got.filter(s => /thinking|tales-content|howto-player/.test(s)));
    await start(P.page); await clear(P.page);
    ok(await P.page.evaluate(async () => !!(await import('/js/custom.js')).customQuiz().length || !(await import('/js/games/frame.js')).GAMES.familyquiz), 'Family Quiz appeared with no family questions');
    await P.page.evaluate(async () => { window.__voiceIndexCheck = await import('/js/voice.js'); });
    await P.page.waitForFunction(() => !!window.__voiceIndexCheck.voicePack(), null, { timeout: 20000 });
    ok(got.some(s => s.endsWith('/voices/manifest-en.json')) && !got.some(s => /\/voices\/manifest(?:-(?:vi|hi|zh))?\.json$/.test(s)), 'English-only device fetched another index');
    const closed = await P.page.evaluate(async () => {
      const F = await import('/js/games/frame.js');
      window.__lazyGame = F.openGame('pattern', { players: [__sv.heroes[0].profile] });
      const layer = document.querySelector('.gl:not(.out)'), stage = layer.querySelector('.gl-stage');
      layer.querySelector('.gl-x').click();
      await window.__lazyGame;
      await F.GAMES.pattern.load();
      return { open: F.gameOpen(), children: stage.children.length, active: document.querySelectorAll('.gl:not(.out)').length };
    });
    ok(!closed.open && !closed.children && !closed.active, 'closed game ran after its delayed implementation arrived: ' + JSON.stringify(closed));
    await P.page.waitForSelector('.gl', { state: 'detached' });
    await P.page.evaluate(async () => { const F = await import('/js/games/frame.js'); window.__lazyGame = F.openGame('pattern', { players: [__sv.heroes[0].profile] }); });
    await P.page.waitForFunction(() => document.querySelector('.gl-stage')?.children.length > 0);
    await P.page.click('.gl-x'); await P.page.waitForTimeout(350);
    const tale = await P.page.evaluate(async () => {
      const { MORE_TALES } = await import('/js/talesdata.js'); const t = MORE_TALES[0], before = t.pages.length;
      const full = await t.load(); return { before, after: full.pages.length, en: full.pages[0][1], same: full === t };
    });
    ok(tale.same && tale.before === tale.after && tale.en, 'lazy tale lost its pages/identity: ' + JSON.stringify(tale));
    await P.page.evaluate(async () => { await (await import('/js/ui.js')).openGrownups(() => {}); });
    await P.page.locator('#gBil').check();
    await P.page.waitForFunction(() => !!window.__voiceIndexCheck.voicePack()?.signatures?.vi);
    await clear(P.page);
    await P.page.evaluate(async () => { const S = await import('/js/state.js'); S.settings.lang = 'vi'; (await import('/js/core/events.js')).events.emit('LanguageChanged'); });
    await P.page.waitForFunction(() => !!window.__voiceIndexCheck.voicePack()?.signatures?.vi);
    ok(!got.some(s => /\/voices\/manifest-(?:hi|zh)\.json$/.test(s)), 'language switch fetched learning-language indexes');
    ok(!P.errors.length, P.errors.join(' | '));
  } finally { await P.ctx.close(); }
  return 'cold startup defers game/tale/how-to implementations; closing a loading game cancels it; a warm game opens; tale identity/pages survive; EN-only and VI switching fetch only needed indexes';
});

await check('resume', async () => {
  // a child comes back where they were (owner, round 30), with a "welcome back"; a spot that is no longer good
  // (in the lake, inside a building) starts them at the usual place instead
  const P = await open(b, { w: 800, h: 600 }); await clear(P.page);
  // (round T: a spot on a road far from home, from the map; home is by Ông Cú on the plateau)
  const [rx, rz] = await P.page.evaluate(async () => { const R = (await import('/js/content/map.js')).ROADS.find(R => R.id === 'vn_north'), [a, b] = [R.pts[0], R.pts[R.pts.length - 1]]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }); // (the middle of the Vietnam road, north part)
  const { home, lake } = await P.page.evaluate(async () => { const W = await import('/js/world.js'); return { home: { x: W.PLATEAU.x - 3, z: W.PLATEAU.z - 4 }, lake: { x: W.LAKE.x, z: W.LAKE.z } }; });
  await P.page.evaluate(([x, z]) => { __sv.heroes[0].place(x, z); }, [rx, rz]); await P.page.waitForTimeout(1500); await clear(P.page);
  await P.page.waitForFunction(([x, z]) => { const p = __sv.heroes[0].profile.pos; return p && Math.hypot(p.x - x, p.z - z) < 2; }, [rx, rz], { timeout: 15000 }).catch(() => { });
  const saved = await P.page.evaluate(() => __sv.heroes[0].profile.pos);
  await P.page.reload(); await start(P.page);
  const toastText = await P.page.waitForFunction(() => /Welcome back/.test(document.querySelector('#toast')?.textContent || ''), null, { timeout: 8000 }).then(() => P.page.evaluate(() => document.querySelector('#toast').textContent)).catch(() => '');
  const back = await P.page.evaluate(() => ({ x: __sv.heroes[0].pos.x, z: __sv.heroes[0].pos.z }));
  // now a spot in the middle of Mirror Lake and one inside a building: both start at home
  const tries = [];
  for (const spot of [lake, await P.page.evaluate(() => { const b = __sv.world.boxes.find(b => b.x1 - b.x0 > 3 && b.z1 - b.z0 > 3); return { x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2 }; })]) {
    // (the game saves the spot when it is put away, so the bad spot is written from another page of the site)
    await P.page.goto(URL + 'manifest.webmanifest'); await P.page.evaluate(s => { const k = 'sv2_profiles', a = JSON.parse(localStorage.getItem(k)); a[0].pos = s; localStorage.setItem(k, JSON.stringify(a)); }, spot);
    await P.page.goto(URL); await start(P.page);
    tries.push(await P.page.evaluate(() => ({ x: +__sv.heroes[0].pos.x.toFixed(1), z: +__sv.heroes[0].pos.z.toFixed(1) })));
  }
  const errs = P.errors; await P.ctx.close();
  const near = (a, x, z, d) => Math.hypot(a.x - x, a.z - z) < d;
  ok(saved && near(saved, rx, rz, 2) && near(back, saved.x, saved.z, 1.5) && /Welcome back/.test(toastText) && tries.every(t => near(t, home.x, home.z, 3)) && !errs.length, JSON.stringify({ saved, back, toastText, tries, errs }));
  return `came back at ${back.x.toFixed(0)}, ${back.z.toFixed(0)} with "${toastText}"; a spot in the lake and one inside a building both started at home`;
});

await check('migrate', async () => {
  // (round T, owner's decision 5) the valley's layout has a version (js/content/map.js MAP_VERSION). A saved spot is stamped
  // with it; a spot with no stamp belongs to map 'C' (saved before round T); a spot from another layout is never used:
  // the child starts at home once, with "The valley has grown!" (stickers, stories, farm and house kept). The family's
  // Studio map content from another layout is put aside (parked), never placed at the wrong spot.
  const P = await open(b, { w: 800, h: 600 }); await clear(P.page);
  const M = await P.page.evaluate(async () => { const m = await import('/js/content/map.js'), W = await import('/js/world.js'); return { v: m.MAP_VERSION, noStamp: m.onThisMap(undefined), home: { x: W.PLATEAU.x - 3, z: W.PLATEAU.z - 4 }, spot: W.CITIES.find(c => c.id === 'hanoi').gates[0] }; });
  const [sx, sz] = M.spot;
  await P.page.evaluate(([x, z]) => __sv.heroes[0].place(x, z + 4), [sx, sz]); // (just outside Hà Nội's east gate, on its road)
  await P.page.waitForFunction(([x, z]) => { const p = __sv.heroes[0].profile; return p.pos && p.posMap && Math.hypot(p.pos.x - x, p.pos.z - z - 4) < 2; }, [sx, sz], { timeout: 15000 }).catch(() => { });
  const saved = await P.page.evaluate(() => ({ pos: __sv.heroes[0].profile.pos, posMap: __sv.heroes[0].profile.posMap }));
  // "The valley has grown!" shows 2.5 s after the game starts and closes itself 2.6 s later; on a slow machine that can
  // all happen while start() is still clicking through, so every page notes the moment it appears (r71: missed on GitHub)
  await P.page.addInitScript(() => { window.__grownSeen = false; new MutationObserver(() => { if (/valley has grown/i.test(document.querySelector('.reward')?.textContent || '')) window.__grownSeen = true; }).observe(document, { childList: true, subtree: true }); });
  // a save from another page of the site (the game saves its own spot when it is put away)
  const restart = async (stamp, custom) => {
    await P.page.goto(URL + 'manifest.webmanifest');
    await P.page.evaluate(([pos, stamp]) => { const k = 'sv2_profiles', a = JSON.parse(localStorage.getItem(k)); a[0].pos = pos; if (stamp === null) delete a[0].posMap; else a[0].posMap = stamp; a[0].postcards = Object.assign({ opera: true }, a[0].postcards); localStorage.setItem(k, JSON.stringify(a)); }, [saved.pos, stamp]);
    await P.page.unroute('**/content/custom.json*').catch(() => { });
    if (custom) await P.page.route('**/content/custom.json*', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(custom) }));
    await P.page.goto(URL); await start(P.page);
    const grown = await P.page.waitForFunction(() => window.__grownSeen, null, { timeout: 7000, polling: 100 }).then(() => true).catch(() => false);
    return P.page.evaluate(g => ({ x: +__sv.heroes[0].pos.x.toFixed(1), z: +__sv.heroes[0].pos.z.toFixed(1), posMap: __sv.heroes[0].profile.posMap, kept: !!(__sv.heroes[0].profile.postcards || {}).opera, grown: g,
      parked: __sv.parked, famNpc: __sv.interactables.some(i => /^npc_fam_Testy/.test(i.id)) }), grown);
  };
  const near = (a, x, z, d) => Math.hypot(a.x - x, a.z - z) < d;
  const noStamp = await restart(null), older = await restart('an older layout'), again = await restart(M.v);
  const studio = { npcs: [{ name: 'Testy', x: M.home.x + 6, z: M.home.z + 6, lines: [['Hello!', 'Chào!']] }], world: { land: [] } };
  const parkedRun = await restart(M.v, { ...studio, world: { map: 'an older layout', land: [] } }), placedRun = await restart(M.v, { ...studio, world: { map: M.v, land: [] } });
  const errs = P.errors; await P.ctx.close();
  const r = { saved, noStamp, older, again, parked: parkedRun.parked, parkedNpc: parkedRun.famNpc, placedNpc: placedRun.famNpc, placedParked: placedRun.parked, errs };
  ok(saved.posMap === M.v, 'the saved spot is not stamped: ' + JSON.stringify(r));
  // (no stamp is map 'C': on map 'C' the child comes back where they were, on a newer layout they start at home)
  ok(M.noStamp ? near(noStamp, saved.pos.x, saved.pos.z, 1.5) && !noStamp.grown : near(noStamp, M.home.x, M.home.z, 3) && noStamp.grown, 'a spot with no stamp: ' + JSON.stringify(r));
  ok(near(older, M.home.x, M.home.z, 3) && older.grown && older.posMap === M.v && older.kept, 'a spot from an older layout: ' + JSON.stringify(r));
  ok(near(again, saved.pos.x, saved.pos.z, 1.5) && !again.grown, 'a spot on this layout: ' + JSON.stringify(r));
  ok(r.parked && r.parked.map === 'an older layout' && !r.parkedNpc && r.placedNpc && !r.placedParked, 'Studio content: ' + JSON.stringify(r));
  ok(!errs.length, JSON.stringify(errs));
  return `map ${M.v}: a spot is saved with its layout; with no stamp ${M.noStamp ? 'it counts as map C and comes back' : 'it starts at home'}; from an older layout the child starts at home once with "The valley has grown!" (postcards kept); Studio villagers from an older layout are parked, from this one placed`;
});

await check('installflow', async () => (await import('../install-browser.mts')).installFlowCheck(b));

await check('installstudio', async () => (await import('../install-browser.mts')).installStudioCheck(b));

await check('resumerecovery', async () => { const server = await serveFolder(await packedSite()); try { return await (await import('../resume-recovery.mts')).resumeRecoveryCheck(b,server.url); } finally { server.close(); } });

await check('memoryfps', async () => {
  // (#729 #734, 1 Nov 2026 AEDT) Memory Match at Talent (20 cards) on a slow computer (CPU 4x slower): the face-down stars
  // stand still, so the game keeps drawing (it was 5 frames a second with 60 star animations)
  const P = await open(b, { w: 929, h: 1129 }); await clear(P.page);
  const cdp = await P.ctx.newCDPSession(P.page);
  await P.page.evaluate(async () => { const G = __sv; G.heroes[0].profile.age = 'big'; G.heroes[0].profile.gameDiff = { memory: 'talent' }; G.playGame(0, 'memory', 'hub'); await new Promise(r => setTimeout(r, 2500)); });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const r = await P.page.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), gaps = []; let last = performance.now(), run = true;
    const f = () => { const t = performance.now(); gaps.push(t - last); last = t; if (run) requestAnimationFrame(f); }; requestAnimationFrame(f);
    for (let k = 0; k < 5; k++) { const c = [...document.querySelectorAll('.gl .mem:not(.flip)')][k % 3]; if (c) c.click(); await w(500); } run = false; gaps.sort((a, b) => a - b);
    return { cards: document.querySelectorAll('.gl .mem').length, fps: +(1000 / gaps[Math.floor(gaps.length / 2)]).toFixed(1), backAnims: document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.mem .back')).length }; });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }); await P.ctx.close();
  ok(r.cards >= 20 && r.backAnims === 0 && r.fps >= 20, JSON.stringify(r));
  return `Talent, ${r.cards} cards, CPU 4x slower: ${r.fps} frames a second, no moving stars on face-down cards`;
});

await check('launchbanner', async () => {
  // (owner, 1 Nov 2026 AEDT) Studio's launch date on the website: Coming soon with the days left before it, Open now with
  // Play now from it, nothing while no date is set; in English and Vietnamese
  const day = n => new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + n * 864e5));
  const out = {};
  for (const [name, launch] of [['none', null], ['soon', day(10)], ['open', day(-1)]]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }), page = await ctx.newPage();
    await ctx.route('**/api/festivals', r => r.fulfill({ json: { schema: 1, enabled: [], festivals: {}, at: null, launch } }));
    await page.goto(URL + 'home/'); await page.waitForTimeout(1500);
    out[name] = await page.evaluate(() => { const b = document.querySelector('.launch-banner'), a = b && b.querySelector('a'), r = a && a.getBoundingClientRect(); return b ? { text: b.textContent, play: !!a, tall: r ? r.height >= 44 : null, state: b.dataset.state } : null; });
    if (name === 'soon') { await page.evaluate(() => { document.documentElement.lang = 'vi'; }); await page.waitForTimeout(200); out.soonVi = await page.evaluate(() => document.querySelector('.launch-banner')?.textContent || ''); }
    await ctx.close();
  }
  ok(out.none === null, 'a banner with no launch date: ' + JSON.stringify(out.none));
  ok(out.soon && out.soon.state === 'soon' && /Coming soon/.test(out.soon.text) && /10 days/.test(out.soon.text) && !out.soon.play, 'coming soon: ' + JSON.stringify(out.soon));
  ok(/Sắp ra mắt/.test(out.soonVi) && /còn 10 ngày/.test(out.soonVi), 'Vietnamese: ' + out.soonVi);
  ok(out.open && out.open.state === 'open' && out.open.play && out.open.tall, 'open now: ' + JSON.stringify(out.open));
  return 'no date: no banner; 10 days before: Coming soon (EN/VI); from the day: Open now with a 44 px Play now';
});

await check('firstplayer', async () => {
  // round P (owner): no ready-made characters; a new device asks the child to make their own first (name, look, photo)
  const P = await open(b, { w: 390, h: 844, touch: true, lang: 'vi', play: false, pre: () => { localStorage.setItem('sv2_profiles', '[]'); } });
  await P.page.click('.screen.title .press', { force: true }); await P.page.waitForSelector('.screen.who');
  const before = await P.page.evaluate(() => ({ first: !!document.querySelector('.who-card.first .make'), picks: document.querySelectorAll('.pick[data-id]').length }));
  await P.page.click('.who .make'); await P.page.waitForSelector('.modal.editor #nm');
  await P.page.fill('#nm', 'Mai'); await P.page.evaluate(() => document.querySelector('#eSave').click());
  await P.page.waitForSelector('.who .go:not([disabled])', { timeout: 5000 });
  await P.page.click('.who .go'); await P.page.waitForFunction(() => window.__sv && window.__sv.heroes.length > 0);
  const r = await P.page.evaluate(() => ({ name: __sv.heroes[0].profile.name, saved: JSON.parse(localStorage.getItem('sv2_profiles')).map(p => p.name) }));
  const errs = P.errors; await P.ctx.close();
  ok(before.first && !before.picks && r.name === 'Mai' && r.saved.length === 1 && r.saved[0] === 'Mai' && !errs.length, JSON.stringify({ before, r, errs }));
  return 'a new device shows “Make my character” and no ready-made players; the child made “Mai” and plays as Mai';
});

await check('rollout', async () => {
  // the owner-approved explicit-off policy: explicit Off wins over remembered usage. Future scheduling can retain
  // access without deleting progress; On restores access. Keep actual feature probes,
  // old-save migration, New cards and tester early-schedule checks.
  const out = [];
  const P = await open(b, { w: 1024, h: 700, schedule: true }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, C = await import('/js/custom.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    const { gamesIn } = await import('/js/content/activities.js'), { GAMES } = await import('/js/games/registry.js');
    const S = await import('/js/snacks.js'), { VENDORS } = await import('/js/vendors.js'), D = await import('/js/festdecor.js');
    const F = C.CUSTOM.features = C.CUSTOM.features || {};
    const seen = re => G.interactables.some(i => re.test(i.id) && (!i.visible || i.visible(h)));
    const seller = VENDORS.find(v => v.food && v.greet);
    const owl = async () => {   // Ông Cú's lesson page after his tip (as the 'guide' check)
      const story = G.lanterns; G.lanterns = { ...story, owl: async () => false }; p.quests.owl = true;
      const it = G.interactables.find(i => i.id === 'npc_owl'); it.act(h, G); let card = null;
      for (let k = 0; k < 24 && !card; k++) { await wait(150); const d = document.querySelector('.dialog:not(.out)'); if (d) { d.click(); await wait(200); } card = document.querySelector('.owl-lesson:not(.out)'); }
      for (let k = 0; k < 6 && document.querySelector('.owl-lesson:not(.out)'); k++) { document.querySelector('.owl-lesson:not(.out) .qt-go').click(); await wait(300); }
      G.lanterns = story; await wait(300); G.paused = false; return !!card;
    };
    const house = async () => {   // the house guide the first time in the house, and the ❓ sign
      delete p.houseGuideSeen; const door = G.interactables.find(i => i.id === 'myhouse_door'); door.act(h, G); await wait(1700);
      const shown = !!document.querySelector('.dialog:not(.out)') || !!G.interactables.find(i => i.id === 'house_help');
      for (let i = 0; i < 8; i++) { const d = document.querySelector('.dialog:not(.out)'); if (!d) break; d.click(); await wait(250); }
      G.homes.leave(h); await wait(1400); G.paused = false; return shown;
    };
    const probes = {
      rideAny: () => seen(/^drive_/), busFares: () => seen(/^ride_/) && seen(/^busstop_/), rideBikes: () => G.interactables.some(i => /^bike_/.test(i.id) && G.traffic.slots[+i.id.slice(5)].feat === 'rideBikes' && i.visible(h)),   // (the cities' parked bicycles are 'rideAny')
       xichloRides: () => seen(/^xichlo_/),
      wayfind: async () => { await wait(400); const b = document.querySelector('.z-where'); return !!b && getComputedStyle(b).display !== 'none'; },
      jobs: () => seen(/^job_/), villagerTalk: () => seen(/^villager_/), singers: () => seen(/^sing\d/),
      priceTags: async () => { await wait(300); return G.world.priceTags.some(t => t.sp.visible); },
      sellersRemember: () => { p.regulars = { [seller.id]: 1 }; return S.greetLine(h, seller) !== seller.greet; },
      owlGuide: owl, houseGuide: house,
      festHunt: () => G.keep('festHunt'),
      ...Object.fromEntries(C.MONEY_GAMES.map(g => ['money_' + g, () => gamesIn(GAMES, 'money', false).some(x => x.id === g)]))
    };
    // the valley's own life: nothing for a child to keep, only hidden when off and back when on
    const scenery = {
      animalHomes: async () => { await wait(300); return !G.animalHomes.coop || G.animalHomes.coop.mesh.visible; },
      festDecoBig: () => D.decoOf({ id: 'zz_none' }) === 5,
      dayPlan: async () => { await wait(400); const v = G.dayPlan.list.find(v => v.ready && !v.external && v.free && G.dayPlan.offRoad(v.home.x + .8, v.home.z)); if (!v) return true;   // (is the day plan running: a villager sent a step away walks there)
        v.inside = false; v.o.visible = true; v.o.position.x = v.home.x; v.o.position.z = v.home.z; v.last = [v.home.x, v.home.z]; v.goal = [v.home.x + .8, v.home.z]; v.going = 'out'; v.wait = 99;
        await wait(500); const moved = Math.abs(v.o.position.x - v.home.x) > .05; v.goal = null; return moved; }
    };
    const res = {};
    // (r90 launch, owner 23 Oct AEDT) the shipped schedule (content/custom.json "releases") is set aside while each switch
    // is tried on and off, then checked on its own below: a batch stays hidden until its Saturday and is on from it
    const shipped = { ...(C.CUSTOM.releases || {}) }; C.CUSTOM.releases = Object.fromEntries(Object.entries(shipped).filter(([k]) => k === 'wayfind'));
    for (const [id, probe] of Object.entries(probes)) {
      if (id === 'wayfind') {
        const previous = C.CUSTOM.releases?.wayfind; C.CUSTOM.releases = C.CUSTOM.releases || {};
        delete C.CUSTOM.releases.wayfind; delete p.tried; F.wayfind = true; const defaultHidden = !(await probe());
        C.markTried(p,id); const legacyHidden = !(await probe());
        C.CUSTOM.releases.wayfind = {on:true}; const oldRuleHidden = !(await probe());
        C.CUSTOM.releases.wayfind = {on:true,controlVersion:1}; const explicitOn = !!(await probe());
        C.CUSTOM.releases.wayfind = {on:false,controlVersion:1}; const explicitOff = !(await probe());
        if(previous) C.CUSTOM.releases.wayfind=previous; else delete C.CUSTOM.releases.wayfind;
        res[id]={hidden:defaultHidden && legacyHidden && oldRuleHidden && explicitOff,offAfterUse:explicitOff,back:explicitOn};continue;
      }
      delete p.tried; F[id] = false; const hidden = !(await probe());
      C.markTried(p, id); const offAfterUse = !(await probe());
      const history = JSON.stringify(p.tried), progressPreserved = C.hasTried(p,id);
      C.CUSTOM.releases[id] = {on:true,start:'2099-01-01'};
      const retainedDuringSchedule = !!(await probe());
      const stillPreserved = JSON.stringify(p.tried) === history;
      delete C.CUSTOM.releases[id];
      delete p.tried; F[id] = true; const back = !!(await probe());
      res[id] = { hidden, offAfterUse, back, progressPreserved, retainedDuringSchedule, stillPreserved };
    }
    for (const [id, probe] of Object.entries(scenery)) { F[id] = false; const hidden = !(await probe()); F[id] = true; const back = !!(await probe()); res[id] = { hidden, offAfterUse: true, back }; }
    C.CUSTOM.releases = shipped;
    const sched = Object.entries(shipped).filter(([, r]) => r && r.start).map(([id, r]) => ({ id, before: C.releaseOn(id, true, new Date(new Date(r.start + 'T00:00:00').getTime() - 864e5)), on: C.releaseOn(id, true, new Date(r.start + 'T12:00:00')) }));
    res.schedule = { hidden: sched.length >= 20 && sched.every(x => !x.before), offAfterUse: true, back: sched.every(x => x.on), n: sched.length };
    // every new switch is in Studio's list, starts on, and says what it is in both languages
    const { RELEASES } = await import('/js/content/releases.js');
    const missing = Object.keys(probes).concat(Object.keys(scenery)).filter(id => { const x = RELEASES.find(r => r.id === id); return !x || x.def !== (id !== 'wayfind') || !x.en || !x.vi || x.en === x.vi; });
    // an old save already shows what a child used: kept without a new tap
    const q = { jobsDone: { lotus: 1 }, owlLessons: ['money'], levels: { heodat: 2 } }; C.triedFromSave(q);
    const fromSave = ['jobs', 'owlGuide', 'money_heodat'].every(id => C.hasTried(q, id)) && !C.hasTried(q, 'wayfind');
    // a tester sees a release 7 days before its start, and not 8
    const day = n => { const d = new Date(Date.now() + n * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    const live = JSON.parse(localStorage.getItem('sv2_live') || '{}');
    return { res, missing, fromSave, day3: day(3), day9: day(9), live: !!live };
  });
  for (const [id, x] of Object.entries(r.res)) if (!x.hidden || !x.offAfterUse || x.progressPreserved === false || x.retainedDuringSchedule === false || x.stillPreserved === false || !x.back) out.push(id + ' ' + JSON.stringify(x));
  if (r.missing.length) out.push('not in Studio\'s list as a switch that starts on: ' + r.missing.join(', '));
  if (!r.fromSave) out.push('an old save did not count as used');
  if (P.errors.length) out.push(P.errors.join(' '));
  await P.ctx.close();
  // the New! moment on its start day, and a tester's week-early peek (Studio's rules as the website gives them)
  const pre = `try { const d = n => { const t = new Date(Date.now() + n * 864e5); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); };
    localStorage.setItem('sv2_live', JSON.stringify({ releases: { jobs: { on: true, start: d(0), newDays: 7 }, wayfind: { on: true, start: d(3), newDays: 7 }, singers: { on: true, start: d(9), newDays: 7 } }, festivals: {} })); } catch (e) { }
    window.__newCards = []; setInterval(() => { const c = [...document.querySelectorAll('.reward')].find(e => /New in the valley/.test(e.textContent)); if (c && !window.__newCards.includes(c.textContent)) window.__newCards.push(c.textContent); }, 100);`; // (1 Nov 2026 AEDT) the card shows for 2.6 s and can come before the check starts looking (another release new the same day brings it to the first moment): it is recorded from the page's start
  const Q = await open(b, { w: 1024, h: 700, pre });
  const n = await Q.page.evaluate(async () => {
    const G = __sv, C = await import('/js/custom.js'), wait = ms => new Promise(r => setTimeout(r, ms)); let card = '';
    // (31 Oct AEDT) every card on screen: on a festival day the festival's card can be the first one
    for (let k = 0; k < 160 && !card; k++) { if (window.__newCards && window.__newCards.length) { card = window.__newCards.join(' | '); break; } await wait(250); const c = [...document.querySelectorAll('.reward')].find(e => /New in the valley/.test(e.textContent));   // (up to 40 s: under a busy suite the card waits for other pop-ups)
      if (c) card = c.textContent; }
    const before = { wayfind: C.releaseOn('wayfind'), singers: C.releaseOn('singers'), jobs: C.releaseOn('jobs'), isNew: C.releaseNew('jobs'), keepWay: G.keep('wayfind') };
    C.setPeeks([], 7); const tester = { wayfind: C.releaseOn('wayfind'), singers: C.releaseOn('singers') }; C.setPeeks([]);
    return { card: card.slice(0, 600), before, tester, seen: !!(G.heroes[0].profile.seenNew || {}).jobs };
  });
  if (!/job board/i.test(n.card) || !n.seen) out.push('no New! card for the job boards on their start day: ' + JSON.stringify(n));
  if (n.before.wayfind || n.before.singers || !n.before.jobs || !n.before.isNew || n.before.keepWay) out.push('start dates: ' + JSON.stringify(n.before));
  if (!n.tester.wayfind || n.tester.singers) out.push('tester peek (3 days on, 9 days off): ' + JSON.stringify(n.tester));
  if (Q.errors.length) out.push(Q.errors.join(' '));
  await Q.ctx.close();
  ok(!out.length, out.join(' | '));
  if (process.env.STUDIO_CONTROL_REVIEW_DIR) {
    const folder = process.env.STUDIO_CONTROL_REVIEW_DIR;
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(folder + '/rollout-evidence.json', JSON.stringify({ passed: true, features: r.res,
      missingDeclarations: r.missing, oldSaveUsagePreserved: r.fromSave, scheduleAndTester: n,
      scope: 'Actual game consumer probes with synthetic profiles; not physical-device or all-control certification' }, null, 2) + '\n');
  }
  return `${Object.keys(r.res).length} switches: explicit off hides each before and after use, progress stays intact, future schedules retain used access, on brings it back; an old save counts; the New! card on the start day; testers 7 days early`;
});

await check('perf', async () => {
  // performance budgets (PERF-001…006, tests/perf-baseline.json): each number may only go down. The test browser draws
  // in software, so frames per second (PERF-002, ≥ 30 at quality Auto) is measured on real phones, not here.
  const base = JSON.parse(fs.readFileSync('perf-baseline.json', 'utf8'));
  // PERF-001's download is measured on the packed copy the website serves (owner, 10 Oct AEST), before compression
  const startMB = await (async () => { const S = await serveFolder(await packedSite()); try {
    const Q = await open(b, { w: 1024, h: 700, play: false, url: S.url });
    const mb = await Q.page.evaluate(() => performance.getEntriesByType('resource').concat(performance.getEntriesByType('navigation')).reduce((a, e) => a + (e.encodedBodySize || e.transferSize || 0), 0) / 1e6);
    await Q.ctx.close(); return mb; } finally { S.close(); } })();
  const P = await open(b, { w: 1024, h: 700, play: false });
  // the map picture: painted once after the title screen, then read back from the device on the next start
  const pic = async () => { await P.page.waitForFunction(() => __sv.mapPic && __sv.mapPic.ready && __sv.bootTimes, null, { timeout: 60000 }); return P.page.evaluate(() => ({ from: __sv.mapPic.from, boot: __sv.bootTimes })); };
  const first = await pic();
  // (wait until the picture is really kept on the device, not a fixed time: saving it can take a moment while the valley finishes building)
  for (let i = 0; i < 75; i++) { if (await P.page.evaluate(async () => { try { const k = await caches.open('sv-world'); return (await k.keys()).some(r => r.url.includes('/map.png')); } catch (e) { return true; } })) break; await P.page.waitForTimeout(200); }
  await P.page.reload(); await P.page.waitForSelector('.screen.title', { timeout: 90000 }); const second = await pic();
  await P.page.evaluate(() => { __sv.renderer.setPixelRatio(.35); dispatchEvent(new Event('resize')); });
  ok(first.from === 'painted' && second.from === 'cache', 'map picture: ' + JSON.stringify({ first, second }));
  await start(P.page); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], W = await import('/js/world.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    // the middle frame of 3 s at a spot (the world's own frames: nothing extra is drawn; villagers walk in and out of view)
    const R = G.renderer, frames = async (x, z) => { h.place(x, z);
      for (let k = 0; k < 6; k++) { await wait(300); document.querySelectorAll('.storybook, .dialog, .modal').forEach(e => e.remove()); G.paused = false; }
      const orig = R.render, got = []; R.render = function (...a) { orig.apply(this, a); got.push([R.info.render.calls, R.info.render.triangles]); };
      await wait(3000); R.render = orig; return got; };
    // (round T) at home, by Ông Cú, where every child starts; then in Lotus Village
    const home = await frames(W.PLATEAU.x - 3, W.PLATEAU.z - 4), got = await frames(W.VILLAGE.x, W.VILLAGE.z + 6);
    let texturePx = 0;
    G.scene.traverse(o => { for (const m of o.material ? [].concat(o.material) : []) for (const k in m) { const t = m[k], im = t && t.isTexture && t.image; if (im && im.width) texturePx = Math.max(texturePx, im.width, im.height); } });
    // 10 mini-games, each opened, left running a moment and closed; then memory and leftover page elements
    const ids = Object.keys((await import('/js/games/frame.js')).GAMES).slice(0, 10), gc = () => window.gc && window.gc();
    h.place(W.VILLAGE.x - 30, W.VILLAGE.z + 30); await wait(600); document.querySelectorAll('.storybook, .dialog, .modal').forEach(e => e.remove()); G.paused = false;
    gc(); await wait(300); const heap0 = performance.memory.usedJSHeapSize, dom0 = document.getElementsByTagName('*').length;
    for (const id of ids) { G.playGame(0, id, 'replay'); await wait(700); document.querySelector('.gl .gl-x')?.click(); await wait(500); }
    await wait(800); gc(); await wait(300);
    const mid = (i, f = got) => f.map(g => g[i]).sort((a, b) => a - b)[f.length >> 1] || 0;
    return { drawCalls: mid(0), triangles: mid(1), drawCallsHome: mid(0, home), frames: Math.min(got.length, home.length), texturePx,
      heapGrowMB: Math.max(0, (performance.memory.usedJSHeapSize - heap0) / 1e6), domGrow: document.getElementsByTagName('*').length - dom0, games: ids.length };
  });
  const errs = P.errors; await P.ctx.close();
  // (round T) worldMs: from the start of the game's code to a built valley, on the second start (the map picture kept). The
  // test browser draws in software and its timings wander from run to run, so a start counts as slower only past 25 %.
  const got = Object.assign({ startMB, worldMs: second.boot.ready }, r), over = [], gap = [];
  for (const [k, B] of Object.entries(base)) { if (k.startsWith('/')) continue; const v = got[k]; if (v > B.max * (k === 'worldMs' ? 1.25 : 1.03) + (k === 'startMB' ? .05 : 0)) over.push(`${B.rule} ${k} ${+v.toFixed(2)} > ${B.max}`); if (v > B.target) gap.push(`${k} ${Math.round(v)} (budget ${B.target})`); }
  ok(r.frames > 0 && r.games === 10 && !over.length && !errs.length, JSON.stringify({ over, got, errs }));
  return `start ${startMB.toFixed(1)} MB in ${(second.boot.ready / 1000).toFixed(1)} s (map picture kept on the device), home ${r.drawCallsHome} draws, village ${r.drawCalls} draws / ${(r.triangles / 1000).toFixed(0)}k triangles, largest texture ${r.texturePx}px, after 10 games +${r.heapGrowMB.toFixed(1)} MB and ${r.domGrow} elements` + (gap.length ? `; over budget (being reduced): ${gap.join(', ')}` : '');
});

await check('battery', async () => {
  // (battery round, owner 12 Oct AEDT: "my phone gets very hot; on my MacBook it takes almost 10 % at once"; PERF-006)
  // a computer draws at most 60 times a second even on a 120 Hz screen (30 on Fast, Pretty 60, Pretty+ as fast as the
  // screen), phones and tablets 30; the title screen 20; after 15 s with nothing moving a few times a second, and any
  // touch brings it straight back; on Auto the picture is never sharper than 1.5x; far people standing still are one
  // shape; the drawing and battery statistics are recorded and sent only with Analytics on.
  const hz120 = () => { let id = 0; const q = new Map(); window.requestAnimationFrame = cb => { const k = ++id; q.set(k, setTimeout(() => { q.delete(k); cb(performance.now()); }, 1000 / 120)); return k; }; window.cancelAnimationFrame = k => { clearTimeout(q.get(k)); q.delete(k); }; };
  const rate = (page, ms = 2000) => page.evaluate(async ms => { const R = __sv.renderer, o = R.render; let n = 0, ticks = 0; R.render = function (...a) { n++; return o.apply(this, a); };
    let on = true; const tick = () => { ticks++; if (on) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    await new Promise(r => setTimeout(r, ms)); on = false; R.render = o; return { draws: n * 1000 / ms, ticks: ticks * 1000 / ms }; }, ms);
  const capOf = async (opts) => { const P = await open(b, { w: 360, h: 260, play: false, ...opts }); const c = await P.page.evaluate(() => __sv.battery.frameMs); await P.ctx.close(); return Math.round(c * 10) / 10; };
  // the picture's sharpness on a 3x screen with Graphics on Auto, as the game set it (then the test browser draws small)
  const pr = await (async () => { const P = await open(b, { w: 360, h: 260, dpr: 3, play: false, settings: { quality: 'auto' } }); const v = await P.page.evaluate(() => Math.max(__sv.battery.prStart, __sv.battery.prMax)); await P.ctx.close(); return v; })();
  // the caps for each kind of screen and Graphics setting (the cap is set when the game opens)
  const caps = { computerAuto: await capOf({ settings: { quality: 'auto' } }), computerFast: await capOf({ settings: { quality: 'low' } }), computerPretty: await capOf({ settings: { quality: 'high' } }),
    computerPrettyPlus: await capOf({ settings: { quality: 'max' } }), phoneAuto: await capOf({ touch: true, settings: { quality: 'auto' } }), phonePretty: await capOf({ touch: true, settings: { quality: 'high' } }) };
  // the game's own frame gate on a pretend clock: one second of a 60, 120 and 144 Hz screen at each cap
  const gate = async page => page.evaluate(() => { const B = __sv.battery, run = (hz, cap) => { const st = { due: 0 }; let n = 0; for (let t = 1000; t < 3000; t += 1000 / hz + (Math.sin(t) * .3)) if (B.gate(st, t, cap)) n++; return n / 2; };
    return { at60: [60, 120, 144].map(hz => run(hz, 1000 / 60)), at30: [60, 120, 144].map(hz => run(hz, 1000 / 30)), title: [60, 120].map(hz => run(hz, B.titleMs)), idle: [60, 120].map(hz => run(hz, 1000 / B.idleFps)), none: run(120, 0) }; });
  const want = { computerAuto: 16.7, computerFast: 33.3, computerPretty: 16.7, computerPrettyPlus: 0, phoneAuto: 33.3, phonePretty: 16.7 };
  const capsOk = Object.keys(want).every(k => caps[k] === want[k]);
  // a computer with a sharp 120 Hz screen, Graphics on Auto, Analytics on
  const P = await open(b, { w: 360, h: 260, play: false, pre: hz120, settings: { quality: 'auto', countPlayers: true } });
  await P.page.evaluate(() => { window.__svHelloTest = 'manual'; });
  const gates = await gate(P.page);
  const near = (v, w) => Math.abs(v - w) <= 1.5, gatesOk = gates.at60.every(v => near(v, 60)) && gates.at30.every(v => near(v, 30)) && gates.title.every(v => near(v, 20)) && gates.idle.every(v => near(v, 8)) && near(gates.none, 120);
  const title = await rate(P.page);
  await start(P.page); await clear(P.page);
  await P.page.evaluate(async () => { const W = await import('/js/world.js'); __sv.heroes[0].place(W.PLATEAU.x - 3, W.PLATEAU.z - 4); });
  await P.page.mouse.move(200, 150); await P.page.mouse.move(210, 160);
  const play = await rate(P.page);
  // far people standing still: one shape (the still copy); near people and the child keep every moving part
  const people = await P.page.evaluate(async () => { const { OUTLINED } = await import('/js/avatar.js'), h = __sv.heroes[0], v = { far: 0, farStill: 0, near: 0, nearStill: 0, mine: !!h.av._still };
    for (const A of OUTLINED) { if (!A.root.parent || A === h.av) continue; const p = A.root.getWorldPosition(A.root.position.clone()), d = Math.hypot(p.x - h.pos.x, p.z - h.pos.z);
      if (d > 24 && A._calm >= 2) { v.far++; if (A._still && A.still && A.still.visible && !A.rig.visible) v.farStill++; } else if (d < 16) { v.near++; if (A._still) v.nearStill++; } }
    return v; });
  // nothing moves for 15 s: the valley is drawn a few times a second; a touch brings it back at once (up to 90 s: the test
  // browser draws a few frames a second, so the game's clock and the camera settling after the move run slow)
  const idleWait = await P.page.evaluate(async () => { const t0 = performance.now(); while (!__sv.battery.idle && performance.now() - t0 < 90000) await new Promise(r => setTimeout(r, 250)); return { idle: __sv.battery.idle, s: Math.round((performance.now() - t0) / 100) / 10 }; });
  const idle = await rate(P.page, 3000);
  await P.page.mouse.move(100, 100);
  const woke = await P.page.evaluate(() => ({ idle: __sv.battery.idle, cap: __sv.battery.capMs() }));
  // the statistics: one minute's sample goes into the outbox and is sent with Analytics on; with it off, nothing
  const sent = [];
  await P.page.route('**/api/hello', async r => { sent.push(r.request().postDataJSON()); await r.fulfill({ status: 204 }); });
  const stats = await P.page.evaluate(async () => { const M = await import('/js/players.js'), S = await import('/js/state.js'), key = navigator.webdriver ? 'sv2_bot_telemetry' : 'sv2_hello_out', out = () => JSON.parse(localStorage.getItem(key) || '{"days":{}}');
    S.settings.countPlayers = true; M.sampleDrawing(__sv); const on = Object.values(out().days).map(d => d.b).filter(Boolean)[0] || null;
    const sentOn = await M.flush(false);
    // a minute with nothing moving: no playing frames (frames a second stay about playing), the minute counts as idle
    localStorage.removeItem(key); __sv.battery.take(); __sv.battery.input = __sv.battery.moved = -1e9; __sv.battery.idle = true;
    await new Promise(r => setTimeout(r, 2500)); M.sampleDrawing(__sv); const idleOnly = Object.values(out().days).map(d => d.b).filter(Boolean)[0] || null; __sv.battery.input = performance.now(); __sv.battery.idle = false;
    localStorage.removeItem(key); S.settings.countPlayers = false; await new Promise(r => setTimeout(r, 1500)); M.sampleDrawing(__sv);
    const off = Object.values(out().days).some(d => d.b); const sentOff = await M.flush(false); S.settings.countPlayers = true;
    return { on, idleOnly, sentOn, off, sentOff, pr100: Math.round(__sv.renderer.getPixelRatio() * 100) }; });
  const errs = P.errors; await P.ctx.close();
  const body = sent[0] && sent[0].days && sent[0].days[0] && sent[0].days[0].b;
  const got = { caps, gates, title, play, pr, people, idleWait, idle, woke, stats, sentB: body || null, sends: sent.length, errs };
  // (the test browser draws in software, a few frames a second: the measured rates can only show the caps are not passed)
  ok(capsOk && gatesOk && title.draws <= 21.5 && play.draws <= 62 && pr <= 1.5 && people.far > 0 && people.farStill === people.far && people.nearStill === 0 && !people.mine
    && idleWait.idle && idleWait.s >= 15 && idle.draws <= 9 && !woke.idle && Math.round(woke.cap * 10) / 10 === 16.7
    && stats.on && stats.on.length === 10 && stats.on[0] === 1 && stats.on[1] > 0 && stats.on[3] > 0 && stats.on[4] === stats.pr100 && stats.on[9] > 0 && stats.idleOnly && stats.idleOnly[1] === 0 && stats.idleOnly[5] === 1 && stats.sentOn && body && body[1] > 0 && sent.length === 1 && !stats.off && !stats.sentOff && !errs.length, JSON.stringify(got));
  return `caps (ms a frame) ${JSON.stringify(caps)}; frame gate a second at 60/120/144 Hz: ${gates.at60.join('/')} (cap 60), ${gates.at30.join('/')} (cap 30), title ${gates.title.join('/')}, idle ${gates.idle.join('/')}; measured in the test browser: title ${title.draws.toFixed(0)} a second, valley ${play.draws.toFixed(0)}, idle after ${idleWait.s} s ${idle.draws.toFixed(1)}; pixel ratio ${pr} on a 3x screen; ${people.farStill}/${people.far} far people still, ${people.near} near moving; statistics ${JSON.stringify(stats.on)} sent once, nothing with Analytics off`;
});

await check('startup', async () => {
  // (Analytics & Infra, 11 Oct, #36, owner: "start-up is slow every time") the packed copy the website serves, at tablet
  // speed (the processor 4 times slower, compressed like Netlify), with the service worker on: the first start (download,
  // title painted, valley ready) and the second start from the device's saved copy (valley ready, the longest time the
  // page froze). Each number is a ratchet in startup-baseline.json (may only go down; timings wander, so 25 % slack).
  const base = JSON.parse(fs.readFileSync('startup-baseline.json', 'utf8'));
  const S = await serveFolder(await packedSite(), { gzip: true });
  try {
    const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true });
    await ctx.addInitScript(seedPlayers);
    await ctx.addInitScript(() => { try { localStorage.setItem('sv2_settings', JSON.stringify({ voice: false, sound: false, music: false, autoPack: false, quality: 'low' })); } catch (e) { }
      window.__st = { frames: [] }; const f = () => { const t = Math.round(performance.now()); __st.frames.push(t); if (!__st.title && document.querySelector('.screen.title')) __st.title = t; requestAnimationFrame(f); }; requestAnimationFrame(f); }); // (the clock, not the frame's own time stamp: a busy page hands out frames stamped before it was busy)
    const page = await ctx.newPage(), errs = []; page.on('pageerror', e => errs.push(e.message));
    const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    // (owner, 11 Oct AEDT) how fast this machine is, measured in the same run at the same slowed speed: a fixed piece of
    // work like building the valley (numbers, arrays, small objects), the middle of 7 tries. The time limits are set on
    // the machine that measured `machineMs.ref`; a slower machine gets them stretched by as much as it is slower, a faster
    // one gets them shortened, so only the game getting slower fails the check (the limits themselves never go up).
    const machineMs = await page.evaluate(() => { const one = () => { const t = performance.now(); let a = 0; const f = new Float32Array(60000), o = [];
      for (let k = 0; k < 40; k++) { for (let i = 0; i < f.length; i++) { f[i] = Math.sin(i * .01 + k) * Math.sqrt(i + 1); a += f[i]; } for (let i = 0; i < 4000; i++) o.push({ x: i, y: a % 7, z: [i, k] }); o.sort((p, q) => p.y - q.y || q.x - p.x); o.length = 0; }
      return performance.now() - t + (a > 1e300 ? 1 : 0); }; const r = []; for (let i = 0; i < 7; i++) r.push(one()); return r.sort((x, y) => x - y)[3]; });
    const speed = Math.min(3, Math.max(.5, machineMs / base.machineMs.ref));
    const read = async () => { await page.waitForFunction(() => window.__sv && __sv.bootTimes, null, { timeout: 300000 }); await page.waitForTimeout(1000);
      return page.evaluate(() => { const end = __sv.bootTimes.start + __sv.bootTimes.ready, fr = __st.frames.filter(t => t <= end); let gap = 0; for (let i = 1; i < fr.length; i++) gap = Math.max(gap, fr[i] - fr[i - 1]);
        const all = performance.getEntriesByType('resource').concat(performance.getEntriesByType('navigation'));
        return { kb: Math.round(all.reduce((a, e) => a + (e.transferSize || 0), 0) / 1024), title: __st.title, ready: end, freeze: gap, steps: __sv.bootTimes, resources: all.filter(e => e.transferSize > 0).map(e => ({ path: new URL(e.name).pathname, transferred: e.transferSize, encoded: e.encodedBodySize })).sort((a, b) => b.transferred - a.transferred) }; }); };
    await page.goto(S.url); const first = await read();
    await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.active, null, { timeout: 300000 }); await page.waitForTimeout(4000);
    const mutedIndexLoads = await page.evaluate(() => performance.getEntriesByType('resource').filter(e => /\/voices\/manifest[^/]*\.json/.test(new URL(e.name).pathname)).map(e => new URL(e.name).pathname));
    await page.reload(); const second = await read();
    fs.writeFileSync('out/startup-resources.json', JSON.stringify({ first: first.resources, second: second.resources }, null, 2));
    await ctx.close();
    const got = { firstKB: first.kb, firstTitleMs: first.title, firstReadyMs: first.ready, secondReadyMs: second.ready, secondFreezeMs: second.freeze, secondKB: second.kb }, over = [];
    for (const [k, B] of Object.entries(base)) { if (k.startsWith('/') || B.max === undefined) continue; const lim = k.endsWith('KB') ? B.max * 1.03 : B.max * speed * 1.25; if (!(got[k] <= lim)) over.push(`${B.rule} ${k} ${got[k]} > ${k.endsWith('KB') ? B.max : `${B.max} x ${speed.toFixed(2)} (machine speed) = ${Math.round(B.max * speed)}`}`); }
    // the slowest building steps on the second start, for the report (G.bootTimes: ms since the game's code began)
    const st = Object.entries(second.steps).filter(([k]) => k !== 'start').sort((x, y) => x[1] - y[1]), slow = st.map(([k, v], i) => [k, v - (i ? st[i - 1][1] : 0)]).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([k, v]) => `${k} ${(v / 1000).toFixed(1)} s`);
    ok(!over.length && !errs.length && !mutedIndexLoads.length, JSON.stringify({ over, got, mutedIndexLoads, machineMs: Math.round(machineMs), speed: +speed.toFixed(2), slowest: slow, firstSteps: first.steps, secondSteps: second.steps, errs }));
    return `machine ${Math.round(machineMs)} ms (x${speed.toFixed(2)} of the reference); tablet speed: first start ${first.kb} KB, title ${(first.title / 1000).toFixed(1)} s, valley ready ${(first.ready / 1000).toFixed(1)} s; second start ${second.kb} KB from the network, ready ${(second.ready / 1000).toFixed(1)} s, longest freeze ${(second.freeze / 1000).toFixed(1)} s; slowest steps ${slow.join(', ')}`;
  } finally { S.close(); }
});

await check('saves', async () => {
  // progress survives: the main save is wiped (as a browser might do), and the game brings it back by itself
  const P = await open(b, { w: 800, h: 600 }); await clear(P.page);
  await P.page.evaluate(async () => { localStorage.setItem('sv2_playerid', 'savecheck123'); const S = await import('/js/state.js'); S.farm.coins = 4321; S.profiles[0].orbs = 7; S.profiles[0].postcards = { opera: true }; S.saveProfiles(true); });
  await P.page.waitForTimeout(4500);
  // close the game, then wipe the main save from another page of the same site, then open the game again
  const Q = await P.ctx.newPage(); await P.page.close();
  await Q.goto(URL + 'manifest.webmanifest'); await Q.evaluate(() => { localStorage.removeItem('sv2_profiles'); localStorage.removeItem('sv2_farm'); localStorage.removeItem('sv2_playerid'); });
  await Q.goto(URL); await Q.waitForSelector('.screen.title', { timeout: 30000 });
  P.page = Q;
  const r = await P.page.evaluate(async () => { const S = await import('/js/state.js'); return { coins: S.farm.coins, orbs: S.profiles[0].orbs, pc: !!(S.profiles[0].postcards || {}).opera, restored: S.restoredFromCopy, kept: !!localStorage.getItem('sv2_profiles'), device: localStorage.getItem('sv2_playerid') }; });
  await P.ctx.close();
  // (r89.1, owner 23 Oct AEDT) the device keeps its own number, so Studio counts it as the same device
  ok(r.coins === 4321 && r.orbs === 7 && r.pc && r.restored && r.kept && r.device === 'savecheck123', JSON.stringify(r));
  return 'wiped main save restored from the safe copy (coins, orbs, postcards, the device\'s number)';
});

await check('offline', async () => {
  // (Analytics & Infra, 10 Oct, owner: "cant even play offline when there is no internet connection") once the game is
  // saved on the device (service worker), it starts and plays with no connection, and with a connection that never
  // answers (Wi-Fi with no internet): nothing at start may wait on the network. The game is served here from its own
  // little server on 127.0.0.2 (the game skips its service worker on localhost) that can stop answering.
  const http = await import('http'), path = await import('path');
  const root = path.resolve(process.env.SV_ROOT || '..'), TY = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
  let hang = false;
  const srv = http.createServer((q, r) => {
    if (hang) return;
    let f = decodeURIComponent(q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html'; f = path.join(root, f);
    if (!f.startsWith(root) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TY[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); fs.createReadStream(f).pipe(r);
  });
  await new Promise(res => srv.listen(0, '127.0.0.2', res));
  try {
    const url = `http://127.0.0.2:${srv.address().port}/`;
    const P = await open(b, { w: 390, h: 760, touch: true, url, play: false });
    await P.page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 120000 });
    ok(await P.page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())?.active), 'offline install did not activate');
    await P.page.waitForTimeout(1000);
    const again = async () => { const t0 = Date.now(); await P.page.reload({ timeout: 30000 }).catch(() => { }); const got = await P.page.waitForSelector('.screen.title', { timeout: Math.max(1000, 30000 - (Date.now() - t0)) }).then(() => true, () => false); return got ? Date.now() - t0 : -1; };
    const saved = await again();
    await P.ctx.setOffline(true); const off = await again();
    // offline the whole way in: Who's playing?, into the valley
    let played = false; if (off > 0) { await start(P.page); played = await P.page.evaluate(() => window.__sv.heroes.length === 1); }
    await P.ctx.setOffline(false);
    hang = true; const none = await again(); hang = false;
    const errs = P.errors.filter(e => !/Failed to fetch|NetworkError|ERR_INTERNET_DISCONNECTED|aborted/i.test(e)); await P.ctx.close();
    ok(saved > 0 && off > 0 && played && none > 0 && none < 15000 && !errs.length, JSON.stringify({ saved, off, played, none, errs }));
    return `first screen: saved ${(saved / 1000).toFixed(1)} s, offline ${(off / 1000).toFixed(1)} s (played into the valley), connection that never answers ${(none / 1000).toFixed(1)} s`;
  } finally { srv.closeAllConnections(); srv.close(); }
});

await check('mapver', async () => {
  // (Online, r57, ROUND-T §4) positions travel as raw x, z, so friends play together only on the same map layout. A knock
  // carries the knocker's layout; the starter's locked answers carry the starter's; a game older than r57 sends none and
  // plays as before (owner, 11 Oct: r56 already has the new map). Another layout: the one knocking sees "Ask a grown-up to update" (a card with a picture, a voice and a 64 px OK) and is not let in,
  // and the starter sees no knock card (owner, 11 Oct: only the one joining is told). The same layout knocks as before.
  // The friends list shows "Different valley" instead of Join for a friend on another layout.
  const up = await new Promise(r => { const ws = new WebSocket('ws://127.0.0.1:9001/', 'mqtt'); const t = setTimeout(() => r(false), 2000); ws.onopen = () => { clearTimeout(t); ws.close(); r(true); }; ws.onerror = () => { clearTimeout(t); r(false); }; });
  if (!up) return 'skipped (no local MQTT broker on 127.0.0.1:9001)';
  const pre = () => { window.SV_PEER = { host: '127.0.0.1', port: 9099, path: '/nope', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; };
  const A = await open(b, { pre, w: 900, h: 700, settings: { autoMeet: false } });
  const B = await open(b, { pre, w: 390, h: 760, touch: true, lang: 'vi', settings: { autoMeet: false } });
  for (const P of [A, B]) { await clear(P.page); await P.page.evaluate(async () => { window.__Net = (await import('/js/net.js')).Net; }); }
  const knockFrom = async (P, code) => { await P.page.evaluate(c => { __Net.join(c, __sv.sendHello()); }, code); };
  const told = P => P.page.waitForFunction(() => !__Net.role && /Nhờ người lớn cập nhật|Ask a grown-up to update/.test((document.querySelector('.mapcard') || {}).textContent || ''), null, { timeout: 40000 }).then(() => true, () => false);
  const knockCards = () => A.page.evaluate(() => ({ knocks: __Net.knocks.size, pop: !!document.querySelector('.knockpop'), remotes: Object.keys(__Net.remotes).length }));
  const out = {};
  // 1. the starter has an older map ('C'): a round T guest is told, not let in
  let code = await A.page.evaluate(async () => { __Net.mapVersion = 'C'; return __Net.host(__sv.sendHello()); });
  await knockFrom(B, code); out.oldStarter = await told(B); out.oldStarterA = await knockCards();
  await B.page.screenshot({ path: 'out/mapver-card.png' });
  out.cardVi = await B.page.evaluate(() => { const c = document.querySelector('.mapcard'), ok = c.querySelector('[data-ok]').getBoundingClientRect(); return c.textContent + (c.querySelector('svg.art') ? ' [art]' : '') + (ok.height >= 64 ? ' [big]' : ''); });
  await B.page.evaluate(() => document.querySelectorAll('.modal.mapcard').forEach(d => d.remove()));
  await A.page.evaluate(() => { __Net.close(); });
  // 2. the guest has an older map: the starter turns the knock away without a knock card
  code = await A.page.evaluate(async () => { const M = await import('/js/content/map.js'); __Net.mapVersion = M.MAP_VERSION; return __Net.host(__sv.sendHello()); });
  await B.page.evaluate(() => { __Net.mapVersion = 'C'; });
  await knockFrom(B, code); out.oldGuest = await told(B); await A.page.waitForTimeout(1500); out.oldGuestA = await knockCards();
  await B.page.evaluate(() => document.querySelectorAll('.modal.mapcard').forEach(d => d.remove()));
  // 3. a knock with no map version (a game older than r57, like r56 with the same map): the knock card comes up as before,
  // and Let in works
  await B.page.evaluate(async () => { const M = await import('/js/content/map.js'); __Net.mapVersion = M.MAP_VERSION; const k = __Net._knockHello; __Net._knockHello = function () { const h = k.call(this); delete h.map; return h; }; });
  await knockFrom(B, code);
  out.sameKnock = await A.page.waitForSelector('.knockpop [data-in]', { timeout: 45000 }).then(() => true, () => false);
  if (out.sameKnock) { await A.page.evaluate(() => document.querySelector('.knockpop [data-in]').click()); out.sameIn = await B.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 30000 }).then(() => true, () => false); }
  // 4. the friends list: Join only for a friend on the same map
  out.list = await A.page.evaluate(async () => {
    const S = await import('/js/state.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    S.settings.friends = [{ code: 'MAPOLD', name: 'Old' }, { code: 'MAPNEW', name: 'New' }]; S.settings.friendsOn = true;
    const now = Date.now(); __Net.friends.status.MAPOLD = { online: true, seen: now, room: '111111', map: 'C' }; __Net.friends.status.MAPNEW = { online: true, seen: now, room: '222222', map: __Net.mapVersion };
    const box = document.createElement('div'); document.body.appendChild(box); __sv.drawOnlinePanel(box, () => { });
    const rows = [...box.querySelectorAll('.frow')], r = { oldJoin: !!rows[0].querySelector('[data-joinf]'), oldDiff: !!rows[0].querySelector('[data-mapdiff]'), newJoin: !!rows[1].querySelector('[data-joinf]'), newDiff: !!rows[1].querySelector('[data-mapdiff]') };
    rows[0].querySelector('[data-mapdiff]').click(); await wait(300); r.card = /Ask a grown-up to update/.test((document.querySelector('.mapcard') || {}).textContent || '');
    box.remove(); document.querySelectorAll('.modal.mapcard').forEach(d => d.remove()); S.settings.friends = []; delete __Net.friends.status.MAPOLD; delete __Net.friends.status.MAPNEW;
    return r;
  });
  const errs = A.errors.concat(B.errors).filter(e => !/WebSocket|ERR_CONNECTION|peerjs/i.test(e)); await A.ctx.close(); await B.ctx.close();
  const l = out.list;
  ok(out.oldStarter && !out.oldStarterA.knocks && !out.oldStarterA.pop && !out.oldStarterA.remotes && /Nhờ người lớn cập nhật/.test(out.cardVi) && /\[art\] \[big\]/.test(out.cardVi) && out.oldGuest && !out.oldGuestA.knocks && !out.oldGuestA.pop && !out.oldGuestA.remotes && out.sameKnock && out.sameIn && !l.oldJoin && l.oldDiff && l.newJoin && !l.newDiff && l.card && !errs.length, JSON.stringify(Object.assign(out, { errs })));
  return 'starter on an older map: the knocker sees "Ask a grown-up to update" (VI) and is not let in, no knock card for the starter; guest on an older map: turned away the same way; no map version (r56): knock card and Let in as before; friends list: "Different valley" instead of Join for a friend on another map';
});

await check('ownerupdatenotice', async () => {
  // (owner point 10) a real service-worker version change with two tabs: the newer tab takes over and the older one
  // stops saving, the small notice never covers the HUD or an activity, and the update keeps every child's progress
  return await ownerSmoke('owner-update-notice.mjs');
});

await check('ownertabclaim', async () => {
  // (third AI's review R1, 16 Oct AEDT) only the game page claims the tab: another page of the same site that loads the
  // game's state.js (Studio online does, for the game's words and areas) and Studio's hidden copy of the game
  // (index.html?studio=1) leave a child's game playing; a second real game tab still takes over
  const P = await open(b, { w: 1180, h: 820, play: false });
  try {
    await start(P.page); await clear(P.page);
    const heldNow = () => P.page.evaluate(() => !!document.querySelector('.tab-held'));
    const other = await P.ctx.newPage(); await other.goto(URL + 'css/fonts.css');
    await other.evaluate(u => import(u + 'js/state.js?studio'), URL); await P.page.waitForTimeout(1500);
    const afterState = await heldNow(); await other.close();
    const hidden = await P.ctx.newPage(); await hidden.goto(URL + 'index.html?studio=1'); await hidden.waitForFunction(() => window.__sv?.bootTimes, null, { timeout: 120000 }).catch(() => { }); await P.page.waitForTimeout(1500);
    const afterStudioCopy = await heldNow(); await hidden.close();
    ok(!afterState, 'a same-site page that loads the game\'s state.js stopped the game');
    ok(!afterStudioCopy, 'Studio\'s hidden copy of the game (index.html?studio=1) stopped the game');
    const second = await P.ctx.newPage(); await second.goto(URL); await P.page.waitForSelector('.tab-held', { timeout: 60000 }).catch(() => { });
    const afterGame = await heldNow(); await second.close();
    ok(afterGame, 'a second game tab no longer takes over from the older one');
    ok(!P.errors.length, P.errors.join(' | '));
    return 'a page loading state.js and Studio\'s hidden game copy leave the child\'s game playing; a second game tab still takes over';
  } finally { await P.ctx.close(); }
});

await check('welcomesteady', async () => {
  // (owner, 16 Oct AEDT: "windows, panels and the Pad must stay fixed: never move up and down, bounce or recentre as the
  // content changes"; the r79 sweep found the Welcome screen's Start button growing and shrinking on every device) the
  // Welcome screen holds still on a phone, a tablet and a computer, in English and in Vietnamese: the Start button, the
  // cover, the logo and the language panel keep their boxes (within 2 px) for 2.5 s after it opens, after each language
  // tap and the Chinese switch, and the Start button keeps one size in both languages
  const PARTS = [['start', '.screen.title .press'], ['cover', '.screen.title .tt-cover'], ['logo', '.screen.title .logo'], ['languages', '.screen.title .tt-panel']];
  const TAPS = [['Tieng Viet', '.screen.title .seg.lang button[data-l="vi"]'], ['English', '.screen.title .seg.lang button[data-l="en"]'],
    ['learn Chinese on', '.screen.title .learnrow [data-learn="zh"]'], ['learn Chinese off', '.screen.title .learnrow [data-learn="zh"]']];
  const moved = [], notes = [];
  for (const [dev, w, h, touch] of [['phone', 390, 844, true], ['tablet', 820, 1180, true], ['computer', 1280, 800, false]]) for (const lang of ['en', 'vi']) {
    const P = await open(b, { w, h, touch, lang, play: false, settings: { calm: false } });
    const boxes = () => P.page.evaluate(parts => Object.fromEntries(parts.map(([k, sel]) => { const e = document.querySelector(sel); if (!e) return [k, null]; const r = e.getBoundingClientRect(); return [k, [r.left, r.top, r.width, r.height].map(v => Math.round(v * 10) / 10)]; })), PARTS);
    const watch = async (what, ms) => {
      const first = await boxes(), t0 = Date.now(); let n = 0;
      while (Date.now() - t0 < ms) {
        await P.page.waitForTimeout(100); const now = await boxes(); n++;
        for (const [k] of PARTS) { if (!first[k] || !now[k]) continue; const d = Math.max(...now[k].map((v, i) => Math.abs(v - first[k][i]))); if (d > 2) { moved.push(`${dev} ${lang} ${what}: ${k} moved ${d.toFixed(1)} px`); return first; } }
      }
      return first;
    };
    const open0 = await watch('opening', 2500);
    ok(PARTS.every(([k]) => open0[k]), `${dev} ${lang}: a part of the Welcome screen is missing ${JSON.stringify(open0)}`);
    const sizes = {};
    for (const [label, sel] of TAPS) {
      const btn = await P.page.$(sel); if (!btn) continue;
      await btn.click({ force: true }); const after = await watch(`after "${label}"`, 1500);
      if (/Tieng|English/.test(label) && after.start) sizes[label] = after.start;
    }
    // the Start button is the same size in English and Vietnamese
    if (sizes['Tieng Viet'] && sizes.English) { const d = Math.max(Math.abs(sizes['Tieng Viet'][2] - sizes.English[2]), Math.abs(sizes['Tieng Viet'][3] - sizes.English[3])); if (d > 2) moved.push(`${dev} ${lang}: the Start button is ${d.toFixed(1)} px bigger in one language`); }
    ok(!P.errors.length, P.errors.join(' | '));
    notes.push(`${dev} ${lang}`);
    await P.ctx.close();
  }
  ok(!moved.length, 'the Welcome screen moved: ' + moved.slice(0, 8).join('; '));
  return `Welcome screen still within 2 px (Start button, cover, logo, language panel) opening, after both language taps and the Chinese switch, one Start size in both languages: ${notes.join(', ')}`;
});

await check('swupdate', async () => {
  // (r80, owner 17 Oct AEDT: "users must have the latest r") on its own small server (the game's files, its service
  // worker made version A, B or C, js/build.js saying which): (1) after an update the page gets the NEW version's files,
  // never the older copy kept for open games (r78 ran r77's files); (2) a file failing part way keeps what was saved and
  // the next try fetches only what is missing; (3) on the start screens the new version takes over and the page reloads
  // by itself, no tap; (4) while playing it takes over without a reload and the notice offers it; (5) the game coming
  // back to the screen asks the website for a newer version
  const http = await import('http'), path = await import('path');
  const root = path.resolve(process.env.SV_ROOT || '..'), TY = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
  let ver = 'a'; const fail = new Set(), asked = {};
  const srv = http.createServer((q, r) => {
    let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html'; asked[u] = (asked[u] || 0) + 1;
    if (fail.has(u)) { fail.delete(u); r.writeHead(500); return r.end(); }
    const f = path.join(root, u); if (!f.startsWith(root) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { r.writeHead(404); return r.end(); }
    let body = fs.readFileSync(f);
    if (u === '/sw.js') body = String(body).replace(/const VERSION = '[^']+'/, `const VERSION = 'sv-2099-swtest-${ver}'`);
    if (u === '/js/build.js') body = String(body).replace(/BUILD = '[^']+'/, `BUILD = 'sw${ver}'`);
    r.writeHead(200, { 'Content-Type': TY[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); r.end(body);
  });
  await new Promise(res => srv.listen(0, '127.0.0.2', res));
  try {
    const url = `http://127.0.0.2:${srv.address().port}/`;
    const P = await open(b, { w: 390, h: 760, touch: true, url, play: false });
    const active = async v => {
      const until = Date.now() + 120000;
      while (Date.now() < until) {
        const ready = await P.page.evaluate(async v => { const r = await navigator.serviceWorker.getRegistration(); return !!r?.active && !!navigator.serviceWorker.controller && (await caches.keys()).includes('sv-2099-swtest-' + v) && !r.installing && !r.waiting; }, v);
        if (ready) return;
        await P.page.waitForTimeout(200);
      }
      throw new Error('service worker version ' + v + ' did not finish activating');
    };
    const build = () => P.page.evaluate(() => fetch('/js/build.js').then(r => r.text()).then(t => /BUILD = '([^']+)'/.exec(t)?.[1]));
    const update = () => P.page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()).catch(e => String(e)));
    await active('a'); await P.page.waitForTimeout(500);
    const first = await build();
    // (2) version B, one file failing the first time
    ver = 'b'; fail.add('/js/main.js'); await update(); await P.page.waitForTimeout(4000);
    const partial = await P.page.evaluate(() => caches.open('sv-2099-swtest-b').then(c => c.keys()).then(k => k.length));
    const before = { ...asked };
    await P.page.evaluate(() => { window.__same = 1; });
    await update();
    // (3) the start screens: B takes over by itself and the page reloads into it
    await P.page.waitForFunction(() => !window.__same, null, { timeout: 120000 }).catch(() => { });
    await active('b'); await P.page.waitForSelector('.screen.title', { timeout: 60000 });
    const again2 = Object.keys(before).filter(u => u.startsWith('/js/') && u !== '/js/main.js' && u !== '/js/build.js' && (asked[u] || 0) > before[u] && before[u] >= 1 && !/launch|custom|sw\.js/.test(u)), refetched = again2.length;
    const second = await build(), reloaded = await P.page.evaluate(() => !window.__same);
    const keys = await P.page.evaluate(() => caches.keys());
    // (4) playing: C takes over without a reload; the notice offers it
    await start(P.page); await P.page.evaluate(() => { window.__same = 1; });
    ver = 'c'; await update(); await active('c'); await P.page.waitForTimeout(1500);
    const playing = await P.page.evaluate(() => ({ same: window.__same === 1, notice: !!document.querySelector('.update-notice'), heroes: window.__sv.heroes.length }));
    const third = await build();
    // (5) back on the screen: it asks for sw.js again
    const n0 = asked['/sw.js'] || 0; await P.page.evaluate(() => { window.svUpdateGap = 0; document.dispatchEvent(new Event('visibilitychange')); }); await P.page.waitForTimeout(1500);
    const asks = (asked['/sw.js'] || 0) - n0;
    const errs = P.errors.filter(e => !/Failed to fetch|NetworkError|aborted|500/i.test(e)); await P.ctx.close();
    const r = { first, partial, refetched, again: again2.slice(0, 6), second, reloaded, keys, playing, third, asks, errs };
    ok(first === 'swa', 'version A: ' + JSON.stringify(r));
    ok(partial > 0 && refetched === 0, 'an update stopped part way keeps what it saved and fetches only the rest: ' + JSON.stringify(r));
    ok(second === 'swb' && reloaded && keys.includes('sv-2099-swtest-a'), 'the new version, not the older copy kept beside it, on the start screens with no tap: ' + JSON.stringify(r));
    ok(playing.same && playing.notice && playing.heroes === 1 && third === 'swc', 'while playing: no reload, the notice offers it: ' + JSON.stringify(r));
    ok(asks >= 1 && !errs.length, 'coming back to the screen asks for a newer version: ' + JSON.stringify(r));
    return `the new version's files after an update (not the copy kept beside it); a stopped update kept ${partial} files and fetched only the rest; start screens: took over and reloaded by itself; playing: no reload, the notice offered it; back on screen: asked the website again`;
  } finally { srv.closeAllConnections(); srv.close(); }
});

await check('settingsgc', async () => (await import('../settings-gc.mts')).settingsGcCheck(b));

await check('stability', async () => (await import('../stability.mts')).stabilityCheck(b));
