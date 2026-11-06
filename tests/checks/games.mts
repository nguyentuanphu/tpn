// Sparkle Valley checks: The games: play, levels, rules and win screens.
// Run them through tests/run.mts (node run.mts <check>) or tests/suite.mts, not on their own.
// Moved unchanged from tests/run.mts (v1.07 split-tests, 2 Nov 2026 AEDT); see tests/checks/README.md.
import { fs, open, clear, noWelcome, start, URL, openAllGamesFixture, sampled, only, want, check, ok, b, ownerSmoke } from './shared.mts';

await check('games', async () => {
  const P = await openAllGamesFixture(b, { w: 1024, h: 768 }); await clear(P.page);
  const ids = await P.page.evaluate(async () => Object.keys((await import('/js/games/frame.js')).GAMES));
  const failed = [];
  for (const id of ids) {
    const r = await P.page.evaluate(async id => { __sv.playGame(0, id, 'replay'); await new Promise(r => setTimeout(r, 400)); const open = !!document.querySelector('.gl'); document.querySelector('.gl .gl-x')?.click(); await new Promise(r => setTimeout(r, 350)); return open; }, id);
    if (!r) failed.push(id);
  }
  const errs = P.errors.slice(); await P.ctx.close();
  ok(!failed.length && !errs.length, `did not open: ${failed.join(',')} ${errs.join(' | ')}`);
  return `${ids.length} games`;
});

await check('folkplay', async () => (await import('../folk-court-browser.mts')).folkCourtBrowserCheck(b));

await check('familyquizprivate', async () => (await import('../family-quiz-browser.mts')).familyQuizBrowserCheck(b));

await check('familyquizcrypto', async () => (await import('../family-quiz-crypto.mts')).familyQuizCryptoCheck(b));

await check('tugplay', async () => (await import('../tug-browser.mts')).tugBrowserCheck(b));

await check('oaqplay', async () => (await import('../oanquan-browser.mts')).oaqBrowserCheck(b));

await check('snakesplay', async () => (await import('../snakes-browser.mts')).snakesBrowserCheck(b));

await check('horseplay', async () => (await import('../horse-browser.mts')).horseBrowserCheck(b));

await check('horsestability', async () => (await import('../horse-stability.mts')).horseStabilityCheck(b));

await check('goatcircle', async () => (await import('../goat-browser.mts')).goatBrowserCheck(b));

await check('gamespace', async () => (await import('../gamespace-browser.mts')).gameSpaceCheck(b));

// (v1.08 layout, owner 3 Nov 2026 AEDT) every game fits one screen: phone, tablet both ways and computer
await check('gamefit', async () => (await import('../gamefit-browser.mts')).gameFitCheck(b));

await check('simplereturnfruit', async () => (await import('../simple-return-fruit.mts')).simpleReturnFruitCheck(b));

await check('ladybugsplit', async () => (await import('../ladybug-unified.mts')).ladybugUnifiedCheck(b,'split'));

await check('ladybugunified', async () => (await import('../ladybug-unified.mts')).ladybugUnifiedCheck(b));

await check('kidplay', async () => {
  // (round R, owner 9 Oct: "add these in and add to the studio so we can switch on/off") the companion is fed once a day
  // and grows (a trick from size 3), a coin goal buys it a hat, a gift waits by a landmark each day, the story's films
  // have a Skip button, and each Studio switch turns its part off
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], w = t => new Promise(r => setTimeout(r, t)), C = (await import('/js/custom.js')).CUSTOM, S = await import('/js/state.js');
    h.profile.lanterns = { companion: 'firefly', done: { p_owl: true }, chapters: {} }; G.lanterns.companions.sync(); await w(1500);
    const out = {}, chip = c => G.huds[0].root.querySelector('.kidrow .' + c);
    out.chips = !!chip('c-pet') && !chip('c-pet').hidden && !!chip('c-goal') && !chip('c-goal').hidden;
    // feed: once a day; pretend the days pass
    chip('c-pet').click(); const pet = h.profile.lanterns.pet; out.fed1 = pet.feeds;
    chip('c-pet').click(); out.fedAgain = pet.feeds;
    for (let k = 0; k < 4; k++) { pet.fed = -1; G.kidplay.feed(h); }
    out.level = G.kidplay.level(h); await w(400);
    out.scale = G.lanterns.companions.of(h).o.scale.x;
    G.kidplay.feed(h); await w(100); out.trick = !!G.lanterns.companions.of(h).trick;
    // the coin goal: a hat
    const c0 = S.farm.coins; G.addCoins(100 - c0); await w(700); out.goalReady = chip('c-goal').classList.contains('ready');
    chip('c-goal').click(); await w(250); out.helpKeepsCoins = S.farm.coins === 100 && !pet.hat; document.querySelector('.dialog .dchoices button')?.click(); await w(400); out.hat = pet.hat; out.coinsAfter = S.farm.coins; out.hatOn = !!G.lanterns.companions.of(h).hat;
    // the daily gift
    const gift = G.interactables.find(i => i.id === 'gift_today'); out.giftSeen = gift.visible(h); const cg = S.farm.coins; gift.act(h); out.giftCoins = S.farm.coins - cg; out.giftAfter = gift.visible(h);
    // the Skip button on a story film
    const { openTheatre } = await import('/js/tales.js'), { STORY_TALES } = await import('/js/content/chapters.js'), t = STORY_TALES.lantern_prologue;
    openTheatre({ ...t, story: true, title: () => t.title[0], ctx: { name: 'Na', companion: 'firefly' } }, { name: 'Na' }); await w(1500);
    out.skip = !!document.querySelector('.theatre .th-skip'); document.querySelector('.th-skip')?.click(); await w(600); out.skipClosed = !document.querySelector('.theatre');
    // the switches
    C.features = C.features || {};
    G.heroes.forEach(x => { delete x.profile.tried; });   // (batch rollout, owner 8 Oct rule: off keeps a feature for a child who used it; here the child never did, the check 'rollout' covers the keeping)
    // (owner, 1 Nov 2026 AEDT, docs/cores/release.md "Owner's decisions": the coin goal and companion growing open in v1.06)
    // a feature whose release has started is switched by its release rule in Studio (CUSTOM.features is read only when
    // no release rule exists, js/custom.ts featureOn), so the switch is turned off where Studio keeps it
    const relWas = { ...(C.releases || {}) }; C.releases = C.releases || {};
    for (const id of ['companionGrow', 'saveGoal', 'dailySurprise', 'shortTalk', 'simpleStart', 'yardHands', 'storyActions']) { C.features[id] = false; if (C.releases[id] && typeof C.releases[id] === 'object') C.releases[id] = { ...C.releases[id], on: false }; }
    h.profile.gift = null; await w(1200);
    out.offChips = chip('c-pet').hidden && chip('c-goal').hidden; out.offGift = !gift.visible(h); out.offLevel = G.kidplay.level(h);
    out.offSimple = (await import('/js/simple.js')).wantsSimple({ age: 'little' });
    openTheatre({ ...t, story: true, title: () => t.title[0], ctx: { name: 'Na', companion: 'firefly' } }, { name: 'Na' }); await w(1200);
    out.offSkip = !document.querySelector('.theatre .th-skip'); document.querySelector('.th-x')?.click(); await w(400);
    for (const id of Object.keys(C.features)) delete C.features[id];
    C.releases = relWas;
    return out;
  });
  const errs = P.errors; await P.ctx.close(); const bad = [];
  if (!r.chips) bad.push('no Feed or goal button beside the coins');
  if (r.fed1 !== 1 || r.fedAgain !== 1) bad.push(`feeding is not once a day (${r.fed1}, ${r.fedAgain})`);
  if (!(r.level >= 3) || !(r.scale > 1.2)) bad.push(`the companion did not grow (level ${r.level}, size ${r.scale})`);
  if (!r.trick) bad.push('no trick at size 3');
  if (!r.helpKeepsCoins || !r.goalReady || r.hat !== 'party' || r.coinsAfter !== 70 || !r.hatOn) bad.push('the coin goal did not buy the hat ' + JSON.stringify(r));
  if (!r.giftSeen || r.giftCoins !== 15 || r.giftAfter) bad.push('the daily gift ' + JSON.stringify({ seen: r.giftSeen, coins: r.giftCoins, after: r.giftAfter }));
  if (!r.skip || !r.skipClosed) bad.push('no Skip button on the story film');
  if (!r.offChips || !r.offGift || r.offLevel !== 1 || r.offSimple || !r.offSkip) bad.push('a Studio switch did not turn its part off ' + JSON.stringify(r));
  if (errs.length) bad.push(...errs.slice(0, 2));
  if (bad.length) throw new Error(bad.join('; '));
  return `fed once a day, grew to size ${r.level} with a trick, bought the party hat (100 → 70 coins), opened today's gift (+15), Skip on story films; every switch turns its part off`;
});

await check('boxes', async () => {
  // (round S, owner plan 8 Oct: Round R Part 2 item 10) a big kid at Medium or Hard: one free mystery box a day, one more
  // for a finished quest (at most one a day), a second one becomes stars; family rankings on four boards; the collection
  // book; little ones and Easy get none, and each Studio switch turns its part off
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, w = t => new Promise(r => setTimeout(r, t)), S = await import('/js/state.js');
    const C = (await import('/js/custom.js')).CUSTOM, X = await import('/js/content/boxes.js');
    const out = {}, chip = () => G.huds[0].root.querySelector('.bxrow .c-box');
    p.age = 'big'; p.difficulty = 'medium'; delete p.boxes; delete p.collect; await w(1000);
    out.chip = !!chip() && !chip().parentNode.hidden && chip().classList.contains('ready');
    // the hub, then today's free box
    chip().click(); await w(400); out.hub = document.querySelectorAll('.modal.bxhub .khb').length;
    document.querySelector('.modal.bxhub [data-go="box"]').click(); await w(600);
    document.querySelector('.modal.bxopen .kbox').click(); await w(500);
    out.prize = !!document.querySelector('.modal.bxopen .kprize'); out.got = Object.keys(p.collect).length; out.left = X.ready(p.boxes, X.aestDay());
    document.querySelector('.modal.bxopen .x').click(); await w(400);
    G.boxes.openBoxCard(0); await w(400); out.empty = !!document.querySelector('.modal.bxopen .kempty'); document.querySelector('.modal.bxopen .x').click(); await w(400);
    // a finished quest: one box, only one a day
    p.boxes.last = undefined; G.boxes.questDone(h, 0); G.boxes.questDone(h, 1); out.earned = p.boxes.waiting; G.boxes.questDone(h, 2); out.once = p.boxes.waiting;
    // a second one becomes stars
    const first = Object.keys(p.collect)[0], it = X.CBY[first], R = X.COLLECTIBLES, tot = R.reduce((a, c) => a + X.RARITY[c.rare].weight, 0);
    let acc = 0, rand = 0; for (const c of R) { if (c.id === first) { rand = (acc + .5) / tot; break; } acc += X.RARITY[c.rare].weight; }
    const s0 = p.boxes.stars, dup = X.openBox(p, X.aestDay(), rand); out.dup = !!dup && dup.dup && p.boxes.stars === s0 + X.RARITY[it.rare].stars;
    // rankings: every child on this device, four boards
    G.boxes.openRanks(0); await w(400); out.ranks = document.querySelectorAll('.modal.bxrank .kranks li').length === S.profiles.length; out.boards = document.querySelectorAll('.modal.bxrank .ktab').length;
    document.querySelector('.modal.bxrank [data-b="learn"]').click(); await w(200); out.board2 = !!document.querySelector('.modal.bxrank .ktab.on[data-b="learn"]'); document.querySelector('.modal.bxrank .x').click(); await w(400);
    // the book: what was found, and shadows for the rest
    G.boxes.openBook(0, it.kind); await w(400); out.book = !!document.querySelector(`.modal.bxbook [data-c="${first}"].got`) && !!document.querySelector('.modal.bxbook .kcol.miss');
    out.bookSmall = [...document.querySelectorAll('.modal.bxbook .kcol, .modal.bxbook .ktab')].filter(b => b.getBoundingClientRect().height < 44).length; document.querySelector('.modal.bxbook .x').click(); await w(400);
    // Easy, or an under-5: none of it
    p.difficulty = 'easy'; await w(900); out.easyHidden = chip().parentNode.hidden && !G.boxes.can(h); p.difficulty = 'hard';
    p.age = 'little'; await w(900); out.littleHidden = chip().parentNode.hidden; p.age = 'big'; await w(900);
    // the switches
    G.heroes.forEach(x => { delete x.profile.tried; });   // (batch rollout, owner 8 Oct rule: off keeps a feature for a child who used it; here the child never did, the check 'rollout' covers the keeping)
    C.features = C.features || {}; for (const id of ['mysteryBox', 'rankings', 'collectibles']) C.features[id] = false; await w(900);
    out.offHidden = chip().parentNode.hidden; G.boxes.openHub(0); await w(300); out.offHub = !document.querySelector('.modal.bxhub');
    for (const id of ['mysteryBox', 'rankings', 'collectibles']) delete C.features[id];
    return out;
  });
  const errs = P.errors; await P.ctx.close(); const bad = [];
  if (!r.chip || r.hub !== 3) bad.push(`the gift chip (${r.chip}) or the three picture buttons (${r.hub})`);
  if (!r.prize || r.got !== 1 || r.left !== 0 || !r.empty) bad.push('the free box ' + JSON.stringify(r));
  if (r.earned !== 1 || r.once !== 1) bad.push(`quest boxes: ${r.earned} then ${r.once} (one a day)`);
  if (!r.dup) bad.push('a second one did not become stars');
  if (!r.ranks || r.boards !== 4 || !r.board2) bad.push('the family rankings');
  if (!r.book || r.bookSmall) bad.push('the collection book');
  if (!r.easyHidden || !r.littleHidden) bad.push('Easy or an under-5 still sees the boxes');
  if (!r.offHidden || !r.offHub) bad.push('the Studio switches did not turn it off');
  if (errs.length) bad.push(...errs.slice(0, 2));
  if (bad.length) throw new Error(bad.join('; '));
  return 'a big kid at Medium: the free box opened (then none left today), one quest box a day, a second one became stars, the family on 4 boards, the book with shadows; Easy, under-5s and the switches hide it';
});

// (round S, owner plan 8 Oct) Hội làng: every host game free (no 3-coin skip), three events a day on the AEST clock
// (17:30 for under-5s), the parade and the crowd at the nearest village, late arrivals told, the prize like the kite
await check('hoilang', async () => {
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, w = t => new Promise(r => setTimeout(r, t)), C = (await import('/js/custom.js')).CUSTOM, S = await import('/js/state.js');
    delete C.features.hoilang; const realNow = Date.now, at = s => { const ms = Date.parse(s + ':00+10:00'); Date.now = () => ms; };
    const out = {}, txt = () => [...document.querySelectorAll('.dialog')].map(d => d.textContent).join(' ');
    // the games board: free, no price, a game opens and no coins go
    const board = G.interactables.find(i => /^fs\d+$/.test(i.id)), c0 = S.farm.coins;
    board.act(h); await w(500); out.boardChoices = [...document.querySelectorAll('.dialog .dch')].map(b => b.textContent).join('|');
    document.querySelector('.dialog .dch').click(); await w(900); out.boardGame = !!document.querySelector('.gl'); out.boardCoins = S.farm.coins - c0;
    document.querySelector('.gl .gl-x')?.click(); await w(700); document.querySelectorAll('.dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false;
    // 09:02 AEST at the first village: the festival is on there
    const F = G.hoilang.fests[0]; out.fests = G.hoilang.fests.length;
    h.pos.set(F.x + 3, h.pos.y, F.z + 3); h.pos.y = (await import('/js/world.js')).heightAt(h.pos.x, h.pos.z) + .1;
    // (walking into Lotus Village opens the main story's chapter page, and the world rests while a storybook is open:
    // close what the world opened by itself, like the harness's clear(), then let the festival clock tick)
    // (the HUD has one toast line and the newest message takes it, e.g. the daily gift hint: keep every toast shown)
    const toasts = [], tEl = document.querySelector('.hud .htoast'), mo = new MutationObserver(() => toasts.push(tEl.textContent)); mo.observe(tEl, { childList: true, characterData: true, subtree: true });
    at('2026-10-10T09:02'); await w(800);
    // (the world rests while a pop-up is open, e.g. the passport stamp shown on arriving, so the festival clock does not
    // tick: keep closing what opens by itself until the child has been told, for up to 8 s)
    for (let k = 0; k < 16 && !toasts.some(x => /festival|Hội làng/.test(x)); k++) { document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; await w(500); }
    await w(1000);
    out.on = G.hoilang.clock().on; out.active = G.hoilang.active() === F;
    out.walkers = (G.hoilang.walkers() || []).filter(A => A.root.visible).length; out.crowd = (G.hoilang.crowd() || []).filter(A => A.root.visible).length;
    mo.disconnect(); out.toast = toasts.find(x => /festival|Hội làng/.test(x)) || toasts.join(' | ');
    // an under-5 joins: playing the festival game (even left early) gives the first prize, once
    p.age = 'little'; p.hoilang = {}; G.hoilang.openFest(h, F); await w(500); document.querySelector('.dialog .dch').click(); await w(1200);
    out.joinGame = !!document.querySelector('.gl'); document.querySelector('.gl .gl-x')?.click(); await w(4500);
    out.prizes = (p.hoilang.prizes || []).join(','); out.keepsake = (p.keepsakes || []).includes('hl_drum'); out.carry = p.hoilang.carry;
    document.querySelectorAll('.dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false;
    G.hoilang.openFest(h, F); await w(500); out.already = /prize from this festival|quà của hội này/.test(txt()); document.querySelectorAll('.dialog').forEach(e => e.remove());
    // a big kid who leaves without winning gets nothing (16:02)
    p.age = 'big'; at('2026-10-10T16:02'); G.hoilang.openFest(h, F); await w(500); document.querySelector('.dialog .dch')?.click(); await w(1200); document.querySelector('.gl .gl-x')?.click(); await w(4500);
    out.bigPrizes = (p.hoilang.prizes || []).length; document.querySelectorAll('.dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false;
    // the evening one: 17:30 for under-5s, 19:00 for big kids
    at('2026-10-10T17:40'); out.bigAt1740 = G.hoilang.clock().on; p.age = 'little'; out.littleAt1740 = G.hoilang.clock().on;
    // too late: told when the next one is
    at('2026-10-10T09:20'); G.hoilang.openFest(h, F); await w(500); out.next = /16:00/.test(txt()); document.querySelectorAll('.dialog').forEach(e => e.remove()); G.paused = false;
    // the Backpack: carry the prize or put it away, like the kite
    G.openPad(0, 'bag'); await w(600); const slot = document.querySelector('.pad [data-hlcarry]'); out.bag = !!slot; const carried = p.hoilang.carryOn; slot?.click(); await w(300); out.helpOnly = !!document.querySelector('.pad .bag-help') && p.hoilang.carryOn === carried; document.querySelector('.pad .bag-help .bh-close')?.click(); out.cancelKeeps = p.hoilang.carryOn === carried; slot?.click(); await w(100); document.querySelector('.pad .bag-help .bh-act')?.click(); await w(300); out.putAway = p.hoilang.carryOn === false;
    document.querySelectorAll('.modal').forEach(m => m.remove()); G.paused = false;
    // the Studio switch
    at('2026-10-10T09:02'); C.features.hoilang = false; await w(1500);
    out.offPole = !G.interactables.find(i => i.id === 'hoilang' + F.k).visible(); out.offParade = !(G.hoilang.walkers() || []).some(A => A.root.visible);
    Date.now = realNow; return out;
  });
  const errs = P.errors; await P.ctx.close(); const bad = [];
  if (/\$|coin/i.test(r.boardChoices) || !r.boardGame || r.boardCoins !== 0) bad.push('the games board is not free: ' + JSON.stringify([r.boardChoices, r.boardGame, r.boardCoins]));
  if (!r.on || !r.active || r.walkers !== 4 || r.crowd !== 5) bad.push('no parade and crowd at 09:02 ' + JSON.stringify(r));
  if (!/festival|Hội làng/.test(r.toast)) bad.push('the child was not told the festival is on: ' + r.toast);
  if (!r.joinGame || r.prizes !== 'drum' || !r.keepsake || r.carry !== 'drum') bad.push('joining did not give the prize ' + JSON.stringify(r));
  if (!r.already) bad.push('a second prize at the same festival');
  if (r.bigPrizes !== 1) bad.push('a big kid got a prize without winning');
  if (r.bigAt1740 || !r.littleAt1740) bad.push('the evening festival is not 17:30 for under-5s and 19:00 for big kids');
  if (!r.next) bad.push('a late child was not told the next time');
  if (!r.bag || !r.helpOnly || !r.cancelKeeps || !r.putAway) bad.push('the prize is not in the Backpack to carry or put away');
  if (!r.offPole || !r.offParade) bad.push('the Studio switch does not turn it off');
  if (errs.length) bad.push(...errs.slice(0, 2));
  if (bad.length) throw new Error(bad.join('; '));
  return `${r.fests} villages; games board free; 09:00 parade (4) and crowd (5); under-5 prize for joining, once; big kid needs a win; 17:30/19:00; next time told; carried like the kite; switch off`;
});

await check('fruitbarfamily', async () => {
  await ownerSmoke('orchard-fruitbar-browser.mts', ['--parent-entry-only']);
  await ownerSmoke('orchard-fruitbar-browser.mts', ['--allocations-only']);
  return 'Public non-tester entry, no adult gate, 64px counter taps, online cleanup and six EN/VI allocation/result layouts';
});

await check('gamelevel', async () => {
  // round M (owner): every game has Easy · Medium · Hard in its top bar; choosing another level starts it again at that
  // level and is remembered for that game and child; Festivals sit in the main Grown-ups settings, not under Advanced
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  const r = {};
  await P.page.evaluate(() => { __sv.heroes[0].profile.age = 'big'; __sv.heroes[0].profile.difficulty = 'easy'; __sv.playGame(0, 'counting'); });
  await P.page.waitForSelector('.gl .gl-lvl', { timeout: 10000 });
  r.first = await P.page.evaluate(() => { const b = document.querySelector('.gl-lvl').getBoundingClientRect(); return { text: document.querySelector('.gl-lvl').textContent.trim(), w: b.width, h: b.height, inside: b.right <= innerWidth && b.left >= 0 }; });
  await P.page.click('.gl-lvl'); await P.page.waitForSelector('.gl-lvlpick [data-l="hard"]');
  r.choices = await P.page.evaluate(() => [...document.querySelectorAll('.gl-lvlpick [data-l]')].map(b => b.getBoundingClientRect().height >= 64 ? b.dataset.l : 'small'));
  await P.page.click('.gl-lvlpick [data-l="hard"]');
  await P.page.waitForFunction(() => { const l = document.querySelector('.gl:not(.out) .gl-lvl'); return l && /Hard/.test(l.textContent); }, null, { timeout: 10000 }).catch(() => { });
  r.after = await P.page.evaluate(() => ({ text: (document.querySelector('.gl:not(.out) .gl-lvl') || {}).textContent, saved: (__sv.heroes[0].profile.gameDiff || {}).counting, games: document.querySelectorAll('.gl:not(.out)').length }));
  await P.page.evaluate(() => document.querySelector('.gl:not(.out) .gl-x').click()); await P.page.waitForTimeout(500);
  // (owner, 1 Nov 2026 AEDT: "the levels often look the same") a big kid who has won Counting many times: each level still
  // starts its own tier and level (Easy never plays like Hard), and Talent is the hardest
  r.bands = await P.page.evaluate(async () => { const w = t => new Promise(r => setTimeout(r, t)), p = __sv.heroes[0].profile, out = []; p.age = 'big'; p.levels.counting = 5;
    for (const d of ['easy', 'medium', 'hard', 'talent']) { p.gameDiff = { ...(p.gameDiff || {}), counting: d }; const run = __sv.playGame(0, 'counting', 'hub'); let gl = null; for (let k = 0; k < 40 && !gl; k++) { await w(150); gl = document.querySelector('.gl:not(.out)'); }
      out.push([d, gl ? gl.dataset.tier : '?', gl ? gl.dataset.level : '?'].concat(gl && gl.dataset.talent ? ['talent'] : []).join(':')); gl && gl.querySelector('.gl-x').click(); await w(500); document.querySelectorAll('.dialog,.reward,.modal').forEach(e => e.remove()); }
    return out.join(','); });
  // Festivals: in the main settings
  // Festival calendar: only a calendar; no decorations choice in the game or in Grown-ups
  r.fest = await P.page.evaluate(async () => { const U = await import('/js/ui.js'), w = t => new Promise(r => setTimeout(r, t));
    await U.openGrownups(); await w(300); const inGrown = !!document.querySelector('.seg.fest, select.fest-pick'); document.querySelectorAll('.modal').forEach(m => m.remove());
    // (bug #32, owner 11 Oct) the calendar is only a calendar: nothing to visit, no decorations choice in the game
    U.openFestivals(__sv, 0); await w(300); before = !!document.querySelector('.modal select.fest-pick, .fest-hold, .fest-grown'), visit = document.querySelectorAll('.modal [data-fest]').length, rows = document.querySelectorAll('.modal .fcal-row').length;
    return { inGrown, before, visit, rows }; });
  const errs = P.errors; await P.ctx.close();
  ok(/Easy/.test(r.first.text) && r.first.h >= 44 && r.first.inside && r.choices.join() === 'easy,medium,hard,talent' && r.bands === 'easy:1:2,medium:2:3,hard:3:5,talent:3:5:talent' && /Hard/.test(r.after.text || '') && r.after.saved === 'hard' && r.after.games === 1 && !r.fest.inGrown && !r.fest.before && r.fest.visit === 0 && r.fest.rows > 0 && !errs.length, JSON.stringify({ r, errs }));
  return 'Easy · Medium · Hard in the game bar (44 px, on screen at 390 px); Hard starts it again at Hard and is remembered; the festival calendar is only a calendar (nothing to visit, no decorations choice)';
});

await check('levelsa', async () => {
  // (owner, 1 Nov 2026 AEDT: "the difficulty levels often don't change anything; add Talent, the hardest level") games of
  // group A (thinking, strategy, farm, learning, words, numbers, shapes, money, Asia): a big kid opens each at Easy and at
  // Talent, and Talent shows more on screen (more answers, pieces, squares, rounds or friends) than Easy
  const SAMPLE = [['letters', '.choices .choice'], ['memory', '.mem'], ['minichess', '.tk2-square.friend'], ['whosits', '.tk2-seat'],
    ['hanoi', '.disc'], ['robot', '.rcell'], ['goat', '.hay'], ['eggs', '.eggspot'], ['opposites', '.choices .choice'], ['days', '.choices .choice'],
    ['oantuti', '.gl-dots i'], ['rulefinder', '.choices .choice'], ['steppingpath', '.think-path button'], ['sayfind', '.sf-pic'],
    ['numline', '.n2-btn'], ['tiles', '.s2-tile'], ['foldbox', '.s2-flap'], ['whichgroup', '.w2-btn'], ['guesswhat', '.w2-btn'],
    ['pricetags', '.mn2-coin'], ['sharefair', '.mn2-friend'], ['cheaper', '.mg-card'], ['tangram', '.tg-piece'], ['rangoli', '.rg-pal button'],
    // (v1.08 maths) two of the new maths games: more answers to choose from at Talent
    ['mx_sprint', '.mx-btn'], ['mx_patterns', '.mx-btn']];
  // (every game unlocked, as in the games check: this checks the levels, not earned access)
  const P = await openAllGamesFixture(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  await P.page.evaluate(() => { __sv.heroes.forEach(h => { h.profile.age = 'big'; }); });
  const seen = {};
  for (const [id, sel] of SAMPLE) {
    seen[id] = {};
    for (const d of ['easy', 'talent']) {
      // one game at one level per step, so a game that never opens is named instead of stopping the check
      const step = P.page.evaluate(async ([id, sel, d]) => {
        const w = t => new Promise(r => setTimeout(r, t)), p = __sv.heroes[0].profile;
        p.gameDiff = { ...(p.gameDiff || {}), [id]: d }; __sv.playGame(0, id, 'hub');
        // wait for the game's first screen, then for its count to settle
        let gl = null, n = 0, last = -1;
        for (let k = 0; k < 60; k++) { await w(150); gl = document.querySelector('.gl:not(.out)'); n = gl ? gl.querySelectorAll(sel).length : 0; if (n > 0 && n === last) break; last = n; }
        const talent = !!(gl && gl.dataset.talent);
        if (gl) gl.querySelector('.gl-x').click(); await w(500); document.querySelectorAll('.dialog,.reward,.modal').forEach(e => e.remove());
        return { n, talent };
      }, [id, sel, d]);
      const got = await Promise.race([step, new Promise(r => setTimeout(() => r({ n: -1, talent: false }), 20000))]);
      seen[id][d] = got.n; seen[id][d + 'Talent'] = got.talent;
      if (got.n < 0) break;
    }
    if (seen[id].easy < 0 || seen[id].talent < 0) break;
  }
  const errs = P.errors; await P.ctx.close();
  const harder = Object.entries(seen).filter(([, v]) => v.easy > 0 && v.talent > v.easy && v.talentTalent && !v.easyTalent).map(([id]) => id);
  ok(harder.length === SAMPLE.length && !errs.length, JSON.stringify({ notHarder: Object.fromEntries(Object.entries(seen).filter(([id]) => !harder.includes(id))), errs }));
  return `${harder.length} games show more at Talent than at Easy: ` + harder.map(id => `${id} ${seen[id].easy}→${seen[id].talent}`).join(', ');
});

await check('levelsb', async () => {
  // (owner, 1 Nov 2026 AEDT: "the difficulty levels often don't change anything, the game looks the same"; group B games) a big
  // kid opens each sampled game at Easy and at Talent: what the game set up must differ (the values each game puts on its stage
  // as data-lv: counts, speeds, board sizes, choices), Caro's board must grow (3 × 3 to 7 × 7) and Tiến Lên's Hint must go
  const IDS = ['hideseek', 'simon', 'redgreen', 'tag', 'puppets', 'dragonfire', 'tram', 'koala', 'snap', 'dacau', 'caro', 'hopscotch', 'whohome', 'buffalo', 'plate', 'kindchoice', 'drumecho', 'loudquiet', 'emueggs', 'reefclean', 'airport', 'tienlen', 'banhchung', 'mualan'];
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  const r = await P.page.evaluate(async ids => {
    const w = t => new Promise(res => setTimeout(res, t)), p = __sv.heroes[0].profile, out = {};
    p.age = 'big'; p.unlockAll = true;
    for (const id of ids) {
      const row = {};
      for (const d of ['easy', 'talent']) {
        p.gameDiff = { ...(p.gameDiff || {}), [id]: d }; __sv.playGame(0, id, 'hub');
        let gl = null; for (let k = 0; k < 40 && !gl; k++) { await w(150); gl = document.querySelector('.gl:not(.out)'); }
        if (!gl) { row[d] = null; continue; }
        await w(700);
        const st = gl.querySelector('.gl-stage'), hint = gl.querySelector('.tl-b.hint');
        row[d] = { lv: st.dataset.lv || '', talent: gl.dataset.talent === '1', caro: gl.querySelectorAll('.caro-c').length, hint: hint ? getComputedStyle(hint).display !== 'none' : null };
        gl.querySelector('.gl-x').click(); await w(500); document.querySelectorAll('.dialog,.reward,.modal').forEach(e => e.remove());
      }
      out[id] = row;
    }
    return out;
  }, IDS);
  const errs = P.errors; await P.ctx.close();
  const opened = IDS.filter(id => r[id].easy && r[id].talent), same = opened.filter(id => !r[id].easy.lv || r[id].easy.lv === r[id].talent.lv || r[id].easy.talent || !r[id].talent.talent);
  ok(opened.length >= 12 && !same.length && r.caro.easy?.caro === 9 && r.caro.talent?.caro === 49 && r.tienlen.easy?.hint === true && r.tienlen.talent?.hint === false && !errs.length,
    JSON.stringify({ missing: IDS.filter(id => !opened.includes(id)), same: same.map(id => [id, r[id]]), caro: r.caro, tienlen: r.tienlen, errs }));
  return `${opened.length} group B games play differently at Easy and at Talent (e.g. ${opened.slice(0, 3).map(id => `${id} ${r[id].easy.lv} → ${r[id].talent.lv}`).join('; ')}); Caro 3 × 3 → 7 × 7; Tiến Lên has no Hint on Talent`;
});

await check('gameends', async () => {
  // (#355, owner 17 Oct AEDT: "the game restarts itself or just goes straight to a white screen") while a child plays
  // with the game on the screen, the device keeps a small note (area, what is open, memory, build; never a name); a
  // normal close clears it; a start that finds it left behind (the browser ended the game) or a note from the game's own
  // reload (the 3D picture lost) is noted as a problem for Studio's report, with where it happened
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const live = await P.page.evaluate(async () => { const { BUILD } = await import('/js/build.js'); await new Promise(r => setTimeout(r, 5600));
    const a = JSON.parse(localStorage.getItem('sv2_alive') || 'null'), names = (__sv.heroes || []).map(h => h.profile && h.profile.name).filter(Boolean);
    dispatchEvent(new Event('pagehide')); return { a, build: BUILD, named: !!a && names.some(n => JSON.stringify(a).includes(n)), cleared: localStorage.getItem('sv2_alive') === null }; });
  const errs = [...P.errors]; await P.ctx.close();
  const after = async note => { const Q = await open(b, { w: 900, h: 640, pre: `try { localStorage.setItem(${JSON.stringify(note[0])}, ${JSON.stringify(JSON.stringify(note[1]))}); } catch (e) { }` }); await clear(Q.page);
    const e = await Q.page.evaluate(() => { const key = navigator.webdriver ? 'sv2_bot_telemetry' : 'sv2_hello_out', o = JSON.parse(localStorage.getItem(key) || '{"days":{}}'); return Object.values(o.days).flatMap(d => Object.keys(d.e || {})); });
    errs.push(...Q.errors); await Q.ctx.close(); return e; };
  const killed = await after(['sv2_alive', { w: 'village', mb: 310, b: 'r83' }]), reloaded = await after(['sv2_reload', { why: '3D picture lost', w: 'hanoi bag', mb: 290, b: 'r83' }]);
  ok(live.a && live.a.b === live.build && typeof live.a.w === 'string' && live.a.w.length && !live.named && live.cleared, 'the note while playing: ' + JSON.stringify(live));
  ok(killed.some(k => /^ended by the browser while playing in village, 310 MB, r83/.test(k)), 'a game the browser ended was not noted: ' + JSON.stringify(killed));
  ok(reloaded.some(k => /^reloaded: 3D picture lost in hanoi bag, 290 MB, r83/.test(k)) && !reloaded.some(k => /^ended by the browser/.test(k)), 'a reload after the 3D picture was lost: ' + JSON.stringify(reloaded));
  ok(!errs.length, errs.join(' | '));
  return `a note while playing (${live.a.w}, ${live.a.mb} MB, ${live.a.b}; no name), cleared on a normal close; a game the browser ended and a reload after the 3D picture was lost are each noted for Studio's report with where they happened`;
});

await check('tienlen', async () => {
  // Tiến Lên deals the cards (owner, round G): cards fly from a deck in the middle to each player in turn, the hand
  // fills up as they arrive, and play starts with 13 cards each
  const P = await open(b, { w: 900, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, wait = ms => new Promise(r => setTimeout(r, ms)), seen = { fly: 0, deck: false, handSizes: new Set() };
    G.playGame(0, 'tienlen', 'replay');
    const t0 = performance.now();
    while (performance.now() - t0 < 6000) {
      seen.fly = Math.max(seen.fly, document.querySelectorAll('.tl-fly').length); seen.deck = seen.deck || !!document.querySelector('.tl-deck');
      seen.handSizes.add(document.querySelectorAll('.tl-hand .tl-card').length);
      if (seen.deck && !document.querySelector('.tl-deck') && !seen.after) seen.after = { hand: document.querySelectorAll('.tl-hand .tl-card').length, opp: [...document.querySelectorAll('.tl-opp .n')].map(e => e.textContent.trim()) }; // (the moment dealing ends)
      await wait(40);
    }
    const { hand, opp } = seen.after || { hand: 0, opp: [] };
    document.querySelector('.gl .gl-x')?.click(); await wait(300);
    return { fly: seen.fly, deck: seen.deck, steps: seen.handSizes.size, hand, opp };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.deck && r.fly >= 1 && r.steps >= 6 && r.hand === 13 && r.opp.every(x => /13/.test(x)) && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `a deck in the middle, cards flying (up to ${r.fly} at once), the hand filled in ${r.steps} steps to 13; each player has 13`;
});

await check('gameflow', async () => (await import('../game-flow.mts')).gameFlowCheck(b));

await check('gamewinlayout', async () => (await import('../game-win-layout.mts')).gameWinLayoutCheck(b));

await check('stickers', async () => {
  /* sticker book (chat B) */
  // (owner plan 16 Oct 2026 AEDT, chat B; STK-1 to STK-6) the Stickers tab of the Pad: earning (a place, talking to
  // someone, an animal, something an older system keeps), the New! badge on the Bag button and the tab, a page of 3 x 3
  // with a count and a progress bar, grey "?" shapes with a spoken hint, a full page's golden frame and prize, the
  // welcome sticker of an empty page, a shiny copy, both languages, an under-5 on a phone and a big kid on a computer;
  // and every way to earn a sticker exists in the running game
  const notes = [];
  for (const [age, lang, w, h, touch] of [['little', 'en', 390, 844, true], ['big', 'vi', 1280, 800, false]]) {
    const P = await open(b, { w, h, touch, lang }); await clear(P.page);
    const r = await P.page.evaluate(async ([age, lang]) => {
      const G = __sv, hero = G.heroes[0], p = hero.profile, wait = ms => new Promise(r => setTimeout(r, ms));
      const SB = await import('/js/stickers.js'), C = await import('/js/content/stickers.js'), S = await import('/js/state.js'), V = await import('/js/voice.js'), A = await import('/js/audio.js');
      const LP = await import('/js/content/learnpaths.js'), W = await import('/js/world.js'), R = await import('/js/regions.js'), GA = await import('/js/gather.js'), D = await import('/js/data.js'), SE = await import('/js/secrets.js'), PS = await import('/js/passport.js'), MH = await import('/js/myhouse.js'), FE = await import('/js/festivals.js'), SP = await import('/js/content/surprises.js');
      const out = { age, lang };
      // the ways to earn exist in the running game
      const kinds = new Set(['duck', 'chicken', 'butterfly', 'bird', 'kitty']); G.scene.traverse(o => { if (o.userData && o.userData.rig) kinds.add(o.userData.rig.kind); });
      const its = new Set(G.interactables.map(i => i.id)), lms = new Set(R.LANDMARKS.map(l => l.id)), recipes = new Set(D.RECIPES.map(x => x.id)), vend = new Set(R.VENDORS.map(v => v.id));
      const bad = [];
      for (const s of C.STICKERS) for (const w of s.earn) {
        const [k, v] = Object.entries(w)[0];
        const okk = k === 'act' ? (v.endsWith('*') ? [...its].some(x => x.startsWith(v.slice(0, -1))) : its.has(v)) : k === 'meet' ? kinds.has(v) : k === 'postcard' ? lms.has(v) : k === 'enter' ? !!W.REGION_NAMES[v]
          : k === 'find' ? !!GA.WILD[v] : k === 'cook' ? recipes.has(v) : k === 'taste' ? vend.has(v) : k === 'secret' ? SE.SECRETS.some(x => x.id === v) : k === 'tower' ? W.TOWERS.some(x => x.id === v)
          : k === 'stamp' ? PS.COUNTRIES.some(c => c.cc + '_full' === v) : k === 'fest' ? !!FE.FESTIVALS[v] : k === 'surprise' ? SP.SURPRISES.some(x => x.id === v) : k === 'prize' ? C.LEGACY_EMOJI.includes(v)
          // (v1.08b games) a learning journey's step: the journey exists and the step is one of its 1 to STEPS
          : k === 'learn' ? (([pk, n]) => LP.LEARN_PATHS.some(x => x.key === pk) && +n >= 1 && +n <= LP.STEPS)(String(v).split(':')) : false;
        if (!okk) bad.push(s.id + ':' + k + '=' + v);
        if (typeof A.SFX[s.sound] !== 'function') bad.push(s.id + ' sound ' + s.sound);
      }
      for (const e of D.STICKERS) if (!C.fromEmoji(e)) bad.push('older sticker without a place ' + e);
      for (const lm of R.LANDMARKS) if (!C.BY_ID['pc_' + lm.id]) bad.push('postcard without a sticker ' + lm.id);
      for (const [k, w] of Object.entries(GA.WILD)) if (!C.STICKERS.some(s => s.earn.some(x => x.find === k))) bad.push('treasure without a sticker ' + k);
      out.bad = bad;
      // a child starting afresh
      p.age = age; p.stickers = []; delete p.stickerBook; p.postcards = {}; p.found = {}; p.placeStickers = {}; p.visited = {}; p.keepsakes = [];
      S.settings.voice = true; const said = []; window.__svVoiceLog = (l, t) => said.push(l + ':' + t); const sayRec = t => said.push('say:' + t); V.spoken.push(sayRec);
      // a hen (the tap on an animal), Grandpa Owl (talking: main.js says InteractionStarted on the way), a place
      SB.meet('chicken', hero);
      const owl = G.interactables.find(i => i.id === 'npc_owl'); hero.place(owl.x + 1.2, owl.z); G.goAndDo(hero, owl);
      for (let k = 0; k < 20 && !SB.has('owl', hero); k++) { await wait(200); if (k > 4) G.paused = false; }
      document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false;
      hero.place(W.VILLAGE.x, W.VILLAGE.z + 6); for (let k = 0; k < 20 && !SB.has('place_village', hero); k++) { await wait(250); document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; }
      document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false;
      // something an older system keeps (a postcard) is read within a few seconds and gets its New! badge
      p.postcards.opera = true; for (let k = 0; k < 16 && !SB.has('pc_opera', hero); k++) await wait(250);
      out.earned = ['hen', 'owl', 'place_village', 'pc_opera'].filter(id => SB.has(id, hero));
      await wait(2300);
      out.fresh = SB.freshIds(hero).sort(); out.bagBadge = document.querySelector('.dk.bag .stk-count')?.textContent || '';
      // the book: Farm friends, 3 x 3
      G.openPad(0, 'album'); await wait(500);
      const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
      const farmTab = q('.stk-tabs [data-th=farm]'); if (!farmTab.classList.contains('on')) { farmTab.click(); await wait(300); }
      out.tabs = qa('.stk-tabs [data-th]').length; out.tiles = qa('.stk-grid .stk-tile').length;
      out.count = q('.stk-got')?.textContent.trim(); out.bar = q('.stk-bar i')?.style.width; out.title = q('.stk-title')?.textContent.trim();
      out.padTabBadge = q('.pad-tabs [data-t=album] .stk-count')?.textContent || '';
      out.missing = qa('.stk-tile.miss').map(t => !!t.querySelector('.stk-q') && t.querySelector('.stk-hint').textContent.trim().length > 0).every(Boolean);
      out.newOnHen = !!q('[data-sid=hen] .stk-new');
      const rect = e => e.getBoundingClientRect(), minTab = Math.min(...qa('.stk-tabs button').map(e => Math.min(rect(e).width, rect(e).height)));
      const minTile = Math.min(...qa('.stk-tile').map(e => Math.min(rect(e).width, rect(e).height)));
      out.sizes = { minTab: Math.round(minTab), minTile: Math.round(minTile) };
      out.inView = qa('.stk-tile').every(e => rect(e).left >= 0 && rect(e).right <= innerWidth + 1);
      // tapping a sticker: its name (both languages: the chosen one and the other) and the New! badge goes
      said.length = 0; q('[data-sid=hen]').click(); await wait(1600);
      out.henSaid = said.slice(); out.henSeen = !SB.freshIds(hero).includes('hen') && !q('[data-sid=hen] .stk-new');
      // tapping a missing one says its hint
      said.length = 0; const miss = q('.stk-tile.miss'); const missId = miss.dataset.miss; miss.click(); await wait(400);
      const hint = C.BY_ID[missId].hint; out.hintSaid = said.some(t => t.includes(lang === 'vi' ? hint[1] : hint[0]));
      // a full page: a golden frame, the song and a decoration for the house (once)
      C.PAGES.find(x => x.key === 'farm.0').stickers.forEach(s => SB.give(s.id, hero, { quiet: true }));
      farmTab.click(); await wait(500);
      out.full = { won: !!q('.stk-page.won'), frame: !!q('.stk-prize.won .stk-frame'), song: !!q('.stk-song'), decor: (p.keepsakes || []).includes('sb_farm_0') && !!MH.DECOR.sb_farm_0, count: q('.stk-got')?.textContent.trim() };
      // an empty page gets its welcome sticker (STK-3)
      q('.stk-tabs [data-th=rare]').click(); await wait(500);
      out.rareCount = q('.stk-got')?.textContent.trim(); out.rareStarter = SB.has(C.PAGES.find(x => x.key === 'rare.0').stickers.find(s => s.starter).id, hero);
      // a page further on: the arrows (Places in Vietnam has 5 pages)
      q('.stk-tabs [data-th=vietnam]').click(); await wait(400); q('.stk-next').click(); await wait(400);
      out.page2 = q('.stk-title small')?.textContent.trim();
      // a sticker earned again can turn shiny (1 in 20; here the dice says so)
      SB.give('hen', hero, { rnd: () => 0, quiet: true }); q('.stk-tabs [data-th=farm]').click(); await wait(400);
      out.shiny = !!q('[data-sid=hen].shiny');
      out.lang = { tab: q('.stk-tabs [data-th=farm] small').textContent.trim(), title: q('.stk-title').textContent.trim() };
      S.settings.voice = false; delete window.__svVoiceLog; V.spoken.splice(V.spoken.indexOf(sayRec), 1);
      return out;
    }, [age, lang]);
    const errs = P.errors; await P.ctx.close();
    const want = age === 'little' ? 64 : 56;
    ok(!r.bad.length, 'ways to earn that do not exist: ' + r.bad.slice(0, 12).join(', '));
    ok(r.earned.length === 4, 'earned: ' + JSON.stringify(r.earned));
    ok(['hen', 'owl', 'pc_opera', 'place_village'].every(id => r.fresh.includes(id)) && +r.bagBadge >= 4 && +r.padTabBadge >= 4, 'New! badges: ' + JSON.stringify([r.fresh, r.bagBadge, r.padTabBadge]));
    // (v1.08b games, owner 5 Nov 2026 AEDT) the Learning journeys tab joined the ten themes: 11 tabs
    ok(r.tabs === 11 && r.tiles === 9 && /^\d \/ 9$/.test(r.count) && r.bar && r.missing && r.newOnHen, 'the page: ' + JSON.stringify(r));
    ok(r.sizes.minTab >= want && r.sizes.minTile >= want && r.inView, `sizes (at least ${want} px): ` + JSON.stringify(r.sizes) + ' in view ' + r.inView);
    const other = lang === 'vi' ? 'en:Hen' : 'vi:Gà mái', mine = lang === 'vi' ? 'vi:Gà mái' : 'en:Hen';
    ok(r.henSaid.includes(mine) && r.henSaid.includes(other) && r.henSeen, 'tap: both names said and the badge gone: ' + JSON.stringify(r.henSaid));
    ok(r.hintSaid, 'a missing sticker says its hint');
    ok(r.full.won && r.full.frame && r.full.song && r.full.decor && r.full.count === '9 / 9', 'full page: ' + JSON.stringify(r.full));
    ok(r.rareCount === '1 / 9' && r.rareStarter, 'empty page welcome: ' + r.rareCount);
    ok(r.page2 === '2/5', 'page arrows: ' + r.page2);
    ok(r.shiny, 'shiny copy');
    ok(lang === 'vi' ? r.lang.tab === 'Nông trại' && r.lang.title.startsWith('Bạn nông trại') : r.lang.tab === 'Farm' && r.lang.title.startsWith('Farm friends'), 'language: ' + JSON.stringify(r.lang));
    ok(!errs.length, errs.join(' | '));
    notes.push(`${age === 'little' ? 'under-5 phone EN' : 'big kid computer VI'}: tabs ${r.sizes.minTab} px, tiles ${r.sizes.minTile} px`);
  }
  // (S6) a new child: Grandpa Owl's sticker and the place they start in within seconds, a hen by 3 minutes of play
  { const P = await open(b, { w: 900, h: 700, pre: () => { try { const a = JSON.parse(localStorage.getItem('sv2_profiles') || '[]'); a.forEach(p => { delete p.stickerBook; }); localStorage.setItem('sv2_profiles', JSON.stringify(a)); } catch (e) { } } });
    const r = await P.page.evaluate(async () => { const G = __sv, h = G.heroes[0], wait = ms => new Promise(r => setTimeout(r, ms)), SB = await import('/js/stickers.js'), C = await import('/js/content/stickers.js');
      for (let k = 0; k < 40 && !SB.has('owl', h); k++) { await wait(500); document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; }
      const soon = C.FIRST_THREE.filter(id => SB.has(id, h)); G.stickerFx().firstMinutes.played = 180; await wait(5600);
      return { soon, later: C.FIRST_THREE.filter(id => SB.has(id, h)) }; });
    const errs = P.errors; await P.ctx.close();
    ok(r.soon.includes('owl') && r.soon.includes('place_plateau') && r.later.length === 3 && !errs.length, 'first minutes: ' + JSON.stringify(r) + errs.join(' | '));
    notes.push('first minutes: ' + r.later.join(', ')); }
  return 'earning (animal, talking, place, an older system), New! badges, 3 x 3 page, hints, both names, full page prize, welcome sticker, shiny; ' + notes.join('; ');
});

await check('feel', async () => {
  // feel and sound (chat A, owner plan 16 Oct AEDT; js/feel.js, rules UI-7 and UI-8): every button sinks and makes one
  // soft sound, a window only makes sounds and never moves (the owner's stable-window rule), earned coins fly into their counter, the Grown-ups
  // "Tap sounds" switch silences the press, calm mode keeps sounds and drops movement, under-5s' action picture breathes
  const notes = [];
  for (const [tag, w, h, touch] of [['computer', 1180, 760, false], ['phone', 390, 844, true]]) {
    const P = await open(b, { w, h, touch, settings: { sound: true, calm: false } });
    await noWelcome(P.page); // (r83: Grandpa Owl's 7 s welcome sticker flies in midway on slower machines)
    const r = await P.page.evaluate(async () => {
      const A = await import('/js/audio.js'), S = await import('/js/state.js'), U = await import('/js/popups.js');
      let osc = 0; const make = AudioContext.prototype.createOscillator; AudioContext.prototype.createOscillator = function () { osc++; return make.call(this); };
      const log = []; for (const k of ['press', 'open', 'shut', 'pop', 'shhk', 'no', 'tada']) { const f = A.SFX[k]; A.SFX[k] = (...a) => { log.push(k); return f(...a); }; }
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const down = b => { const r = b.getBoundingClientRect(); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); };
      const up = () => dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      const out = {};
      // every visible HUD button sinks while pressed and springs back
      const btns = [...document.querySelectorAll('.hud button')].filter(b => b.getClientRects().length && getComputedStyle(b).visibility !== 'hidden').slice(0, 12);
      let sank = 0; for (const b of btns) { down(b); if (b.classList.contains('sv-press') && getComputedStyle(b).scale !== 'none' && getComputedStyle(b).scale !== '1') sank++; up(); }
      out.buttons = btns.length; out.sank = sank; out.sprung = !document.querySelector('.sv-press');
      // one tap is heard once: the press sound, and the screen's own SFX.tap right after it is left out
      await wait(500); let o0 = osc; down(btns[0]); up(); A.SFX.tap(); out.oneSound = osc - o0;
      // a window: sounds only, and it never moves (the owner's stable-window rule)
      log.length = 0; const m = U.modal('feeltest', '<h2>Test</h2><p>Window</p>'); const c = m.querySelector('.card');
      const y0 = c.getBoundingClientRect().top; await wait(120); const y1 = c.getBoundingClientRect().top; await wait(250); const y2 = c.getBoundingClientRect().top;
      m.close(); await wait(260); out.window = { sounds: log.slice(), still: Math.abs(y0 - y1) < 1 && Math.abs(y1 - y2) < 1, gone: !document.querySelector('.modal.feeltest') };
      // coins fly into the counter and land with a climbing note
      log.length = 0; S.farm.coins += 30; await wait(200); out.flying = document.querySelectorAll('.sv-fly').length; await wait(1200);
      for (let t = 0; t < 18 && document.querySelector('.sv-fly'); t++) await wait(100);   // (r85: a busy machine starts the 650 ms flights late; up to 3 s in all, what is required is unchanged)
      out.landed = log.filter(k => k === 'pop').length; out.flyGone = !document.querySelector('.sv-fly');
      // Grown-ups → Tap sounds off: no press sound, other sounds stay
      S.settings.tapSounds = false; await wait(500); o0 = osc; down(btns[0]); up(); A.SFX.tap(); out.tapOff = osc - o0; o0 = osc; A.SFX.ok(); out.otherStill = osc - o0; S.settings.tapSounds = true;
      // calm mode: the sound stays, nothing moves, rewards land without flying
      S.settings.calm = true; S.applyComfort && S.applyComfort(); document.body.classList.add('calm');
      log.length = 0; down(btns[0]); out.calmPressed = btns[0].classList.contains('sv-press'); up(); out.calmSound = log.includes('press');
      log.length = 0; S.farm.coins += 30; await wait(200); out.calmFly = document.querySelectorAll('.sv-fly').length; await wait(600); out.calmLanded = log.includes('pop');
      out.little = !!document.querySelector('.hud.little');
      // the Grown-ups "Tap sounds" switch
      const UI = await import('/js/ui.js'); await UI.openGrownups(() => { }); await wait(700);
      const sw = document.querySelector('#gTapSnd'); out.tapSwitch = !!sw && sw.checked && /Tap sounds/.test(sw.closest('label').textContent);
      document.querySelectorAll('.modal').forEach(x => x.close ? x.close() : x.remove()); await wait(250);
      return out;
    });
    ok(r.buttons >= 3 && r.sank === r.buttons && r.sprung, `${tag}: buttons did not all sink and spring back ${JSON.stringify(r)}`);
    ok(r.oneSound > 0 && r.oneSound <= 2, `${tag}: a tap should be heard once (press only), got ${r.oneSound} oscillators`);
    ok(r.window.sounds.includes('open') && r.window.sounds.includes('shut') && r.window.still && r.window.gone, `${tag}: window ${JSON.stringify(r.window)}`);
    ok(r.flying > 0 && r.landed > 0 && r.flyGone, `${tag}: coins did not fly and land ${JSON.stringify(r)}`);
    ok(r.tapOff === 0 && r.otherStill > 0, `${tag}: Tap sounds off ${JSON.stringify(r)}`);
    ok(!r.calmPressed && r.calmSound && r.calmFly === 0 && r.calmLanded, `${tag}: calm mode ${JSON.stringify(r)}`);
    ok(r.tapSwitch, `${tag}: no Tap sounds switch in Grown-ups`);
    ok(!P.errors.length, P.errors.join(' | '));
    notes.push(`${tag}: ${r.sank}/${r.buttons} buttons sink, one sound a tap, window still, coins fly, tap sounds off, calm still${r.little ? ', under-5 breathing' : ''}`);
    await P.ctx.close();
  }
  return notes.join('; ');
});

await check('oanquanrules', async () => {
  const ctx = await b.newContext(), pg = await ctx.newPage();
  await ctx.route('**/oanquan-fixture', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><body><div id="stage"></div></body>' }));
  await pg.goto(new globalThis.URL('oanquan-fixture', URL).href);
  const result = await pg.evaluate(async () => {
    await import('/js/games/vietnam.js'); const { GAMES } = await import('/js/games/frame.js');
    const stage = document.querySelector('#stage'), cleanups = [], timer = window.setTimeout;
    // This is a legal-turn test; accelerate only its presentation waits. Performance uses normal speed separately.
    window.setTimeout = (f, ms, ...a) => timer(f, Math.min(ms, 2), ...a);
    let plan, won = false, taps = 0, busy = 0;
    const api = { stage, players: [{ name: 'Test one' }, { name: 'Test two' }], two: true, little: false, strong: true,
      closed: false, sfx: { tap() {}, pop() {}, coin() {} }, say() {}, show() {}, plan(f) { plan = f; },
      onCleanup(f) { cleanups.push(f); }, win() { won = true; } };
    const game = GAMES.oanquan.run(api);
    for (let tick = 0; tick < 30000 && !won; tick++) {
      const target = plan?.();
      if (target) { if (!target.isConnected) throw Error('plan returned a detached control'); target.click(); taps++; }
      else busy++;
      await new Promise(r => timer(r, 1));
    }
    api.closed = true; cleanups.forEach(f => f()); await game; window.setTimeout = timer;
    return { won, taps, busy };
  });
  await ctx.close(); ok(result.won && result.taps > 4 && result.busy > 0, JSON.stringify(result));
  return `a two-player game finishes through ${result.taps} legal square/direction taps; autoplay waits while seeds move`;
});

// (r89) the ten drawing games: auto play finishes each; buttons big enough on phone, tablet and computer
await check('drawinggames', async () => (await import('../drawing-games.mts')).drawingGamesCheck(b));

await check('soundgames', async () => (await import('../sound-games.mts')).soundGamesCheck(b));
