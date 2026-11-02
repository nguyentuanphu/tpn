// Sparkle Valley checks: Testers and reports.
// Run them through tests/run.mts (node run.mts <check>) or tests/suite.mts, not on their own.
// Moved unchanged from tests/run.mts (v1.07 split-tests, 2 Nov 2026 AEDT); see tests/checks/README.md.
import { installReportInputProbe, readReportInputProbe, waitObserved, fs, open, clear, start, URL, only, check, ok, b, testerPre, testerSite, ACCEPTED, ownerSmoke } from './shared.mts';

await check('familyreportprivacy', async () => (await import('../family-report-privacy.mts')).familyReportPrivacyCheck(b));

await check('tester', async () => {
  // a tester device (Releases switch `tester`): nothing of it anywhere else; the agreement once, in both languages; nothing
  // sent before "I accept"; then the tester mark with the version and the ladybird (not at the level "auto reports
  // only"); "Stop being a tester" in Settings stops it at once
  const out = [];
  for (const rule of [{ on: true, devices: ['zzzzzzzzzzzz'] }, { on: false }]) {
    const Q = await open(b, { w: 1024, h: 768, pre: testerPre(rule) }); await Q.page.waitForTimeout(3500);
    const r = await Q.page.evaluate(() => ({ any: !!document.querySelector('.tagree, .testermark, .z-lb'), api: !!window.__sv.tester, loaded: performance.getEntriesByType('resource').some(e => /\/js\/tester(rewards)?\.js/.test(e.name)) }));
    await Q.ctx.close(); if (r.any || r.api || r.loaded) out.push('not a tester but ' + JSON.stringify({ rule, r }));
  }
  for (const lang of ['en', 'vi']) {
    const P = await open(b, { w: 1024, h: 768, lang, pre: testerPre({ on: true, devices: ['tester000001'] }), play: false }), got = await testerSite(P.ctx, () => ({ mine: [], open: [], retest: [], helped: 0, reports: 0 }));
    await start(P.page); await P.page.waitForSelector('.modal.tagree', { timeout: 20000 });
    const text = await P.page.evaluate(() => document.querySelector('.tagree').innerText);
    if (lang === 'vi' ? !/Trở thành người thử/.test(text) || !/tên, tuổi/.test(text) : !/Become a Sparkle Valley tester/.test(text) || !/names, ages and progress/.test(text)) out.push(lang + ': the agreement does not say what is collected: ' + text.slice(0, 200));
    await P.page.evaluate(() => { setTimeout(() => { throw new Error('tester check: before accepting'); }, 0); }); await P.page.waitForTimeout(800);
    const before = await P.page.evaluate(() => (JSON.parse(localStorage.getItem('sv2_tester_out') || '[]')).length + document.querySelectorAll('.testermark, .z-lb').length);
    if (before || got.length) out.push(lang + ': something was kept or sent before "I accept": ' + JSON.stringify({ before, got: got.length }));
    await P.page.click('.tagree .tg-yes'); await P.page.waitForSelector('.testermark', { timeout: 8000 }).catch(() => { }); await P.page.waitForTimeout(1500);
    const on = await P.page.evaluate(async () => ({ mark: (document.querySelector('.testermark') || {}).textContent || '', lb: document.querySelectorAll('.tester-floating.z-lb').length, build: (await import('/js/build.js')).SHOWN, lbSize: (r => r && Math.min(r.width, r.height))(document.querySelector('.tester-floating.z-lb') && document.querySelector('.tester-floating.z-lb').getBoundingClientRect()) }));
    if (!on.mark.includes(on.build) || on.lb !== 1 || !(on.lbSize >= 64)) out.push(lang + ': after accepting, no tester mark with the version or no ladybird (64 px): ' + JSON.stringify(on));
    if (!got.some(x => x && x.accepted === true)) out.push(lang + ': the acceptance was not told');
    // Settings → Stop being a tester
    // (owner, 13 Oct AEDT) "Stop being a tester" is held down: a quick tap does nothing
    // (owner, 16 Oct, point 50) the hearts in the card's middle explain themselves; the card's picture opens Settings
    await clear(P.page); await P.page.click('.hud .pav'); await P.page.waitForSelector('.qs-tester [data-hold="stop"]', { timeout: 8000 });
    await P.page.click('.qs-tester [data-hold="stop"]'); await P.page.waitForTimeout(500);
    ok(await P.page.evaluate(() => document.querySelectorAll('.z-lb').length > 0), 'a quick tap stopped being a tester');
    await P.page.hover('.qs-tester [data-hold="stop"]'); await P.page.mouse.down(); await P.page.waitForTimeout(1900); await P.page.mouse.up(); await P.page.waitForTimeout(800);
    const off = await P.page.evaluate(() => ({ left: document.querySelectorAll('.testermark, .z-lb').length, again: !!document.querySelector('.qs-tester [data-t="join"]') }));
    if (off.left || !off.again) out.push(lang + ': Stop being a tester did not stop it: ' + JSON.stringify(off));
    const errs = P.errors.filter(e => !/tester check: before accepting/.test(e)); await P.ctx.close(); if (errs.length) out.push(errs.slice(0, 2).join(' | '));
  }
  // the level "auto reports only": the mark, no ladybird
  const A = await open(b, { w: 1024, h: 768, pre: testerPre({ on: true, devices: ['tester000001'], levels: { tester000001: 'auto' } }, ACCEPTED) }); await testerSite(A.ctx, () => ({ mine: [], open: [] }));
  await A.page.waitForSelector('.testermark', { timeout: 15000 }).catch(() => { }); await A.page.waitForTimeout(1500);
  const a = await A.page.evaluate(() => ({ mark: !!document.querySelector('.testermark'), lb: document.querySelectorAll('.z-lb').length })); await A.ctx.close();
  if (!a.mark || a.lb) out.push('level "auto reports only": ' + JSON.stringify(a));
  ok(!out.length, out.join(' | '));
  return 'only on tester devices (none of it downloaded elsewhere); the agreement once in English and Vietnamese, nothing kept or sent before "I accept"; then the tester mark with the version and a 44 px ladybird (none at "auto reports only"); Stop being a tester stops it at once';
});

await check('testerreport', async () => {
  // reports by themselves with a picture and the last 30 seconds (an error, a game that did not open, a frozen screen);
  // the ladybird: tap = the picture first, then a kind and a note; long press = a quick report; offline they wait, with a
  // number on the ladybird, and send when back online; "Already reported → add to it" joins the open problem
  const P = await open(b, { w: 1024, h: 768, pre: testerPre({ on: true, devices: ['tester000001'] }, ACCEPTED) });
  let near = []; const got = await testerSite(P.ctx, () => ({ mine: [], open: near, retest: [], helped: 0, reports: 1 }));
  await P.page.waitForFunction(() => window.__sv.tester && document.querySelector('.tester-floating.z-lb'), null, { timeout: 15000 }); await clear(P.page);
  const wait = (f, ms = 12000) => waitObserved(got, f, delay => P.page.waitForTimeout(delay), ms);
  const out = [];
  await P.page.evaluate(() => { setTimeout(() => { throw new Error('tester check boom'); }, 0); });
  const e = await wait(x => x && x.kind === 'auto' && x.auto === 'error' && /tester check boom/.test(x.detail));
  if (!e || !/^data:image\/jpeg;base64,/.test(e.shot || '') || !(e.log && e.log.length) || !e.players.length || !e.players[0].name || !e.dev || !e.b) out.push('the error report has no picture, steps, players or device: ' + JSON.stringify(e && { shot: (e.shot || '').slice(0, 30), log: e.log && e.log.length, players: e.players, dev: e.dev, b: e.b }));
  await P.page.evaluate(() => __sv.playGame(0, 'no-such-game-for-the-tester-check'));
  if (!await wait(x => x && x.auto === 'noopen' && /no-such-game/.test(x.detail), 9000)) out.push('a game that did not open was not reported');
  await P.page.waitForFunction(() => window.__sv?.tester?.mountedAt && window.__sv.tester.mountedAt() > 0 && performance.now() - window.__sv.tester.mountedAt() > 15200, null, { timeout: 30000 });
  const earlierFreezes = got.filter(x => x && x.auto === 'freeze');
  // (v1.08 bugs, #780 #781) the test browser draws in software and may already have frozen by itself in the valley; the
  // device counts another freeze in the same place as the same problem (as the server does), so this one happens under a
  // window of its own: a new place, a new report
  await P.page.evaluate(() => { const m = document.createElement('div'); m.className = 'modal tester-freeze-check'; document.body.append(m); });
  await P.page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => { const t = performance.now(); while (performance.now() - t < 2600) { } r(); }))));
  { const fz = await wait(x => x && x.auto === 'freeze' && !earlierFreezes.includes(x), 6000); if (!fz) {
      const state = await P.page.evaluate(() => ({ visibility: document.visibilityState, focus: document.hasFocus(), mountedAt: window.__sv?.tester?.mountedAt?.(), now: performance.now(), queued: JSON.parse(localStorage.getItem('sv2_tester_out') || '[]').map(r => ({ auto: r.auto, detail: r.detail, hasShot: !!r.shot })) }));
      out.push('a frozen screen was not reported: ' + JSON.stringify({ earlier: earlierFreezes.map(r => ({ detail: r.detail, log: r.log })), state }));
    }
    // (#261) the report says the game's own code ran long (this freeze is a 2.6 s script), not only that frames stopped
    else { const scripts = [...JSON.stringify(fz.log || []).matchAll(/longest script (\d+) ms/g)];
      const why = scripts.find(m => +m[1] >= 1000) || scripts[scripts.length - 1] || null;
      if (!why || +why[1] < 1000) out.push('the freeze report does not say a long script caused it: ' + (why ? why[0] : 'no note') + '; earlier freeze reports: ' + earlierFreezes.length); }
    fs.writeFileSync('out/tester-freeze-observation.json', JSON.stringify({ earlier: earlierFreezes, all: got.filter(x => x && x.auto === 'freeze') }, null, 2)); }
  await P.page.evaluate(() => document.querySelector('.tester-freeze-check')?.remove());
  // the ladybird: tap
  await clear(P.page); const n0 = got.length;
  await P.page.evaluate(installReportInputProbe);
  await P.page.locator('.tester-floating.z-lb').first().click();
  try { await P.page.waitForSelector('.modal.tpanel .tp-shot', { timeout: 8000 }); } catch (error) { fs.writeFileSync('out/tester-open-observation.json',JSON.stringify({...(await P.page.evaluate(readReportInputProbe)),errors:P.errors},null,2));throw error; }
  const shotFirst = await P.page.evaluate(() => /^data:image\/jpeg/.test(document.querySelector('.tp-shot').src));
  await P.page.click('.tp-k[data-k="looks"]'); await P.page.fill('.tpanel textarea', 'The bridge floats above the river'); await P.page.click('.tp-send');
  const t = await wait(x => x && x.kind === 'looks' && /bridge floats/.test(x.note || ''));
  if (!shotFirst || !t || !/^data:image/.test(t.shot || '')) out.push('the ladybird\'s report has no picture or note: ' + JSON.stringify({ shotFirst, got: !!t }));
  // long press: a quick report
  // (held until the quick report is made, like a child holding until something happens: on a slow machine one frame
  // can take half a second, and a fixed 1 s hold could let go before the 700 ms hold counted)
  await P.page.locator('.tester-floating.z-lb').first().hover(); await P.page.mouse.down(); const quick = await wait(x => x && x.detail === 'quick'); await P.page.mouse.up();
  if (!quick) out.push('a long press made no quick report');
  // offline: waits with a number, then sends
  await P.ctx.setOffline(true); await P.page.evaluate(() => __sv.tester.openPanel(0)); await P.page.waitForSelector('.tpanel .tp-send'); await P.page.fill('.tpanel textarea', 'offline report'); await P.page.click('.tp-send'); await P.page.waitForTimeout(600);
  // (the report it made waits; the number on the ladybird is everything waiting, also a report the game made by itself
  // meanwhile, such as "slow" on a slow machine)
  const wq = await P.page.evaluate(() => { const l = JSON.parse(localStorage.getItem('sv2_tester_out') || '[]'); return { q: l.filter(r => r.note === 'offline report').length, n: (document.querySelector('.z-lb .lb-n') || {}).textContent, all: String(l.length) }; });
  await P.ctx.setOffline(false); await P.page.evaluate(() => dispatchEvent(new Event('online')));
  const sentLater = await wait(x => x && x.note === 'offline report');
  // (the device takes the report off its list when the website's answer arrives, a moment after the website has it)
  const left = await P.page.waitForFunction(() => JSON.parse(localStorage.getItem('sv2_tester_out') || '[]').length === 0, null, { timeout: 5000, polling: 100 }).then(() => 0)
    .catch(() => P.page.evaluate(() => JSON.parse(localStorage.getItem('sv2_tester_out') || '[]').length));
  if (wq.q !== 1 || wq.n !== wq.all || !sentLater || left) out.push('offline reports did not wait and send: ' + JSON.stringify({ wq, sentLater: !!sentLater, left }));
  // already reported here
  near = [{ k: 'aaaaaaaaaaaaaaaa', title: 'The bridge floats', n: 3, where: await P.page.evaluate(() => { const h = __sv.heroes[0]; return { area: String(__sv.regionOf[0] || 'valley'), x: Math.round(h.pos.x), z: Math.round(h.pos.z), game: '', window: '' }; }) }];
  await P.page.evaluate(() => __sv.tester.refresh()); await P.page.waitForTimeout(500);
  await P.page.evaluate(() => __sv.tester.openPanel(0)); await P.page.waitForSelector('.tpanel [data-join]', { timeout: 5000 }).catch(() => { });
  if (await P.page.$('.tpanel [data-join]')) { await P.page.click('.tpanel [data-join]'); if (!await wait(x => x && x.join === 'aaaaaaaaaaaaaaaa')) out.push('"add to it" did not join the open problem'); } else out.push('no "Already reported here" where a problem is open');
  // the retest: a problem fixed in this version is replayed (its game opened) and the result told
  const g1 = await P.page.evaluate(async () => Object.keys((await import('/js/games/frame.js')).GAMES)[0]);
  near = []; await P.page.evaluate(() => document.querySelectorAll('.modal, .dialog').forEach(e => e.remove()));
  const stNow = { mine: [], open: [], retest: [{ k: 'cccccccccccccccc', title: 'noopen: ' + g1, status: 'fixed', fixedIn: 'r1', kind: 'auto', auto: 'noopen', where: { game: g1 } }] };
  await P.ctx.unroute('**/api/tester**'); const got2 = await testerSite(P.ctx, () => stNow);
  const pre = await P.page.evaluate(async () => { const s = await __sv.tester.refresh(); __sv.paused = false; const b = { st: s && s.retest && s.retest.length, open: [...document.querySelectorAll('.gl, .modal, .theatre, .storybook')].map(e => e.className) }; await __sv.tester.retest(); return b; });
  await P.page.waitForTimeout(500); const rt = got2.find(x => x && x.k === 'cccccccccccccccc');
  if (!rt || rt.fixed !== true) out.push('the retest did not replay the fixed problem and say it stayed fixed: ' + JSON.stringify({ rt, pre }));
  // the auto play check's findings (it restarts the game when it ends) are sent once as reports
  await P.page.evaluate(() => { localStorage.setItem('sv2_autoplay_report', JSON.stringify({ at: '2026-10-12T10:00:00Z', build: 'r1', speed: 'fast', total: 1, done: [{ g: 'games', key: 'memory', name: 'Memory', ok: false, problems: ['did not close'] }] })); });
  await P.page.evaluate(() => __sv.tester.nightly()); await P.page.waitForTimeout(1500);
  if (!got2.some(x => x && x.auto === 'autoplay' && /did not close/.test(x.detail))) out.push('the auto play check\'s findings were not sent');
  const errs = P.errors.filter(x => !/tester check boom|no-such-game|net::ERR_INTERNET_DISCONNECTED|Failed to fetch/.test(x)); await P.ctx.close();
  if (errs.length) out.push(errs.slice(0, 2).join(' | '));
  ok(!out.length, out.join(' | '));
  return `${got.length} reports: an error, a game that did not open and a frozen screen by themselves, each with a picture, the last 30 seconds, the players and the device; the ladybird (picture first, then a kind and a note), a long-press quick report, offline reports waiting with a number and sending when back online, and "already reported → add to it"; the retest of a fixed problem, and the auto play check\'s findings sent once`;
});

await check('testerretest', async () => {
  // (#736 #674 #675) auto play files its problems with its step as the game ("game:<id>"); once fixed, the tester device
  // replays the problem: it must open the game itself (it opened nothing, took that as still broken and reported
  // "did not open: game:<id>")
  const P = await open(b, { w: 1024, h: 768, pre: testerPre({ on: true, devices: ['tester000001'] }, ACCEPTED) });
  const g1 = 'memory', st = { mine: [], open: [], retest: [{ k: 'dddddddddddddddd', title: 'autoplay: Memory Match: did not close', status: 'fixed', fixedIn: 'r1', kind: 'auto', auto: 'autoplay', where: { game: 'game:' + g1, area: 'autoplay', window: 'games', place: '', x: 0, z: 0 } }], helped: 0, reports: 1 };
  const got = await testerSite(P.ctx, () => st);
  await P.page.waitForFunction(() => window.__sv.tester && window.__sv.tester.retest, null, { timeout: 15000 }); await clear(P.page);
  await P.page.evaluate(() => document.querySelectorAll('.modal, .dialog').forEach(e => e.remove()));
  const opened = await P.page.evaluate(async g1 => { await __sv.tester.refresh(); __sv.paused = false; let seen = false; const mo = new MutationObserver(() => { if (document.querySelector(`.gl[data-game-id="${g1}"]`)) seen = true; }); mo.observe(document.body, { childList: true, subtree: true }); await __sv.tester.retest(); mo.disconnect(); return seen; }, g1);
  await P.page.waitForTimeout(500);
  const rt = got.find(x => x && x.k === 'dddddddddddddddd'), noopen = got.filter(x => x && x.auto === 'noopen');
  const errs = P.errors.filter(x => !/net::ERR_INTERNET_DISCONNECTED|Failed to fetch/.test(x)); await P.ctx.close();
  ok(opened && rt && rt.fixed === true && !noopen.length && !errs.length, JSON.stringify({ opened, rt, noopen, errs }));
  return 'a fixed auto play problem filed as "game:memory" is replayed in Memory Match itself and told as still fixed, with no "did not open"';
});

await check('testernews', async () => {
  // (r90, owner 23 Oct AEDT: "when I log in there is a pop up that I test a new release, very annoying; any release or new
  // game for testers should be shown as a list within the ladybug") no "Tester preview" pop-up at the start; the ladybird
  // has a dot; its panel lists what is new to test (a ticked sneak peek and a batch starting in 3 days), with Play for a
  // game; the dot goes once the list is seen
  const out = [];
  const d3 = new Date(Date.now() + 3 * 864e5), day3 = d3.getFullYear() + '-' + String(d3.getMonth() + 1).padStart(2, '0') + '-' + String(d3.getDate()).padStart(2, '0');
  const live = { releases: { tester: { on: true, devices: ['tester000001'], peeks: ['money_bahu'] }, singers: { on: true, start: day3, newDays: 7 } }, festivals: {} };
  for (const lang of ['en', 'vi']) {
    const P = await open(b, { w: 390, h: 844, touch: true, lang, pre: `try { localStorage.setItem('sv2_playerid', 'tester000001'); localStorage.setItem('sv2_live', ${JSON.stringify(JSON.stringify(live))}); ${ACCEPTED} } catch (e) { }`,
      route: async ctx => { await ctx.route('**/api/live**', r => r.fulfill({ json: live })); await testerSite(ctx, () => ({ mine: [], open: [], retest: [], helped: 0, reports: 0, peeks: ['money_bahu'] })); } });
    await clear(P.page); await P.page.waitForSelector('.tester-floating.z-lb', { timeout: 20000 }); await P.page.waitForTimeout(9000);
    const r = await P.page.evaluate(async () => {
      const popup = [...document.querySelectorAll('.reward, .modal')].map(x => x.textContent).find(t => /Tester preview|Xem trước cho người thử/.test(t)) || '';
      const dot = !document.querySelector('.tester-floating.z-lb .lb-new')?.hidden;
      const T = await import('/js/tester.js'); await T.openPanel(0); await new Promise(res => setTimeout(res, 600));
      const rows = [...document.querySelectorAll('.tp-news .tp-news-row')].map(x => x.textContent.trim()), play = !!document.querySelector('.tp-news [data-try="bahu"]'), go = !!document.querySelector('.tp-news [data-go-news="singers"]'), folded = !document.querySelector('.tp-news')?.open; // (owner, 1 Nov 2026 AEDT) Go there for a feature in the valley; the list starts folded
      document.querySelector('.modal.tpanel .x')?.click(); await new Promise(res => setTimeout(res, 400));
      return { popup: popup.slice(0, 80), dot, rows, play, go, folded, dotAfter: !document.querySelector('.tester-floating.z-lb .lb-new')?.hidden };
    });
    if (r.popup) out.push(lang + ': a pop-up at the start: ' + r.popup);
    if (!r.dot || r.dotAfter) out.push(lang + ': the ladybird dot ' + JSON.stringify({ before: r.dot, after: r.dotAfter }));
    if (r.rows.length !== 2 || !r.play) out.push(lang + ': the list ' + JSON.stringify(r.rows));
    if (!r.go || !r.folded) out.push(lang + ': Go there / folded ' + JSON.stringify({ go: r.go, folded: r.folded }));
    if (P.errors.length) out.push(lang + ': ' + P.errors.slice(0, 2).join(' | '));
    await P.ctx.close();
  }
  ok(!out.length, out.join(' | '));
  return 'no Tester preview pop-up at the start (9 s, EN and VI); the ladybird has a dot; its panel lists the sneak peek (with Play) and the batch in 3 days; the dot goes once seen';
});

await check('testerrewards', async () => {
  // A fixed report gives quiet coins and a counted ladybird list, with no fix speech or pop-up; reports that helped
  // give the Bug Hunter badge on the shirt (seen by friends: it is in the look), tester gear, stickers and the week's star
  const out = [];
  for (const [w, h, touch, name] of [[390, 844, true, 'phone'], [820, 1180, true, 'tablet'], [1180, 760, false, 'computer']]) {
    // (the website is pretended before the page loads: the device asks for its status as soon as it starts)
    const P = await open(b, { w, h, touch, pre: testerPre({ on: true, devices: ['tester000001'] }, ACCEPTED), route: ctx => testerSite(ctx, () => ({ mine: [{ k: 'bbbbbbbbbbbbbbbb', title: 'The bridge floats', status: 'fixed', fixedIn: 'r67', kind: 'looks', spoken: true, where: { game: 'counting', x: 0, z: 0 } }], open: [], retest: [], helped: 10, helpedKinds: ['broken', 'looks', 'words', 'sound', 'idea'], reports: 12, star: true })) });
    const coins0 = await P.page.evaluate(() => JSON.parse(localStorage.getItem('sv2_farm') || '{}').coins || 0);
    await P.page.waitForFunction(() => window.__sv.testerRewards, null, { timeout: 15000 });
    for (let i = 0; i < 40; i++) { await P.page.waitForTimeout(500); const d = await P.page.$('.dialog'); if (d && /Ông Cú|Ong Cu/.test(await d.innerText())) break; await P.page.evaluate(() => document.querySelectorAll('.reward').forEach(r => r.click())); }
    const thank = await P.page.evaluate(() => (document.querySelector('.dialog') || {}).innerText || '');
    await P.page.evaluate(() => document.querySelectorAll('.dialog').forEach(d => d.click())); await P.page.waitForTimeout(800);
    const r = await P.page.evaluate(async () => { const S = await import('/js/state.js'), SH = await import('/js/content/shop.js'), p = S.profiles[0]; return { badge: p.look.badge, star: p.look.star, gear: ['sleuthhat', 'ladypack', 'sleuthcape'].map(id => SH.versionFor(id, SH.setOf(p.look))).filter(id => (p.owned.clothes || []).includes(id)), /* (r79) each child gets their own set's version */ stickers: p.testerStickers, coins: S.farm.coins, tick: !(document.querySelector('.z-lb .lb-ok') || { hidden: true }).hidden, starName: !!document.querySelector('.hud .pname.starname') }; });
    if (/fixed|đã được sửa/i.test(thank) || r.coins - coins0 < 25) out.push(name + ': fix must grant quiet coins without thank-you speech: ' + JSON.stringify({ thank: thank.slice(0, 80), coins: r.coins - coins0 }));
    if (r.badge !== 'lb2' || !r.star || r.gear.length !== 3 || (r.stickers || []).length !== 5 || !r.tick || !r.starName) out.push(name + ': rewards ' + JSON.stringify(r));
    // Owner-requested replacement for the removed fix dialog: verify the real ladybird list.
    await clear(P.page); await P.page.evaluate(async()=>{await (await import('/js/tester.js')).openPanel(0,'fixed');});
    await P.page.waitForSelector('.testing-fixed:not([hidden]) [data-fok="1"]');
    const fixedList=await P.page.evaluate(()=>({targets64:[...document.querySelectorAll('.testing-fixed button')].every(b=>{const r=b.getBoundingClientRect();return r.height>=64&&r.width>=64}),rows:document.querySelectorAll('.testing-fixed [data-fok="1"]').length,coins:document.querySelector('.tm-coins')?.textContent,badge:document.querySelector('.z-lb .lb-ok')?.textContent,legacy:/\br67\b/.test(document.querySelector('.tpanel').textContent),popup:!!document.querySelector('.tfixed'),linked:document.querySelector('[data-test-tab="fixed"]')?.getAttribute('aria-controls')==='testing-fixed'}));
    const again=await P.page.evaluate(()=>!!document.querySelector('.testing-fixed [data-again]'));if(!again)out.push(name+': no Try again on a fixed problem with its game'); // (owner, 1 Nov 2026 AEDT)
    if(!fixedList.targets64||fixedList.rows!==1||!fixedList.coins?.includes('+25')||fixedList.badge!=='1'||fixedList.legacy||fixedList.popup||!fixedList.linked)out.push(name+': fixed list '+JSON.stringify(fixedList));
    await P.page.locator('.testing-fixed [data-fok="1"]').click();
    const coinsOnce=await P.page.evaluate(async()=>{await (await import('/js/tester.js')).refresh();return (await import('/js/state.js')).farm.coins});
    await P.page.waitForTimeout(600);
    const afterCheck=await P.page.evaluate(async()=>({coins:(await import('/js/state.js')).farm.coins,badgeHidden:document.querySelector('.z-lb .lb-ok')?.hidden,fixedCount:document.querySelector('[data-test-tab=fixed]')?.textContent}));
    if(afterCheck.coins!==coinsOnce||!afterCheck.badgeHidden||!/\(0\)/.test(afterCheck.fixedCount))out.push(name+': answered fix repeated '+JSON.stringify(afterCheck));
    // (owner, 1 Nov 2026 AEDT) Try again opens the problem's game straight away
    if(name==='computer'){await clear(P.page);const opened=await P.page.evaluate(async()=>{const T=await import('/js/tester.js');localStorage.removeItem('sv2_tester_seen');await T.refresh();await T.openPanel(0,'fixed');await new Promise(r=>setTimeout(r,400));const b=document.querySelector('.testing-fixed [data-again]');if(!b)return 'no button';b.click();for(let k=0;k<40;k++){await new Promise(r=>setTimeout(r,200));if(document.querySelector('.gl'))return 'game';}return 'no game';});if(opened!=='game')out.push('Try again: '+opened);await P.page.evaluate(()=>document.querySelector('.gl .gl-x')?.click());await P.page.waitForTimeout(500);}
    // the Tester's Corner and the badge drawn on the shirt
    await clear(P.page); await P.page.evaluate(() => __sv.testerRewards.corner()); await P.page.waitForSelector('.tcorner .tc-badge.on', { timeout: 5000 }).catch(() => { });
    const c = await P.page.evaluate(() => { const card = document.querySelector('.tcorner .card'), r = card && card.getBoundingClientRect(); return { on: document.querySelectorAll('.tcorner .tc-badge.on').length, st: document.querySelectorAll('.tcorner .tc-st.on').length, fixed: document.querySelectorAll('.tcorner .tm-row').length, wide: card ? card.scrollWidth <= card.clientWidth + 2 && r.right <= innerWidth + 1 : false }; });
    if (c.on !== 2 || c.st !== 5 || c.fixed !== 1 || !c.wide) out.push(name + ': the Tester\'s Corner ' + JSON.stringify(c));
    if (name === 'computer') { const shirt = await P.page.evaluate(async () => { const { buildAvatar } = await import('/js/avatar.js'), S = await import('/js/state.js'); const n = o => { let k = 0; o.traverse(x => { if (x.isMesh && !x.userData.outline) { const g = x.geometry; k += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); return k; }; return n(buildAvatar({ ...S.profiles[0].look }).torso) - n(buildAvatar({ ...S.profiles[0].look, badge: undefined }).torso); });
      if (shirt < 1) out.push('the badge is not drawn on the shirt: ' + shirt + ' triangles'); } // (the badge's triangles: r69, as for shop with the owner's yes, the battery round merges it into the shirt's shape)
    const errs = P.errors; await P.ctx.close(); if (errs.length) out.push(name + ': ' + errs.slice(0, 2).join(' | '));
  }
  ok(!out.length, out.join(' | '));
  return 'on phone, tablet and computer: counted fixed list and quiet coins (more for a spoken note), the Silver Ladybird on the shirt (and in the look friends see), the tester hat, backpack and cape, five stickers, the week\'s star by the name, and the Tester\'s Corner';
});

await check('report', async () => {
  // the play report (js/report.js): a game played and a minute of play are counted for the child who played, and
  // Grown-ups shows them for that child (this week's minutes, favourite games, places)
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], R = await import('/js/report.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    h.profile.stats.days = {}; h.profile.stats.played = {};
    for (const id of ['colors', 'colors', 'counting']) { G.playGame(0, id, 'replay'); await wait(600); document.querySelector('.gl .gl-x')?.click(); await wait(500); }
    R.addMinute(h.profile); R.addMinute(h.profile);
    const d = h.profile.stats.days[R.dayKey()], played = h.profile.stats.played;
    const m = R.openReport(h.profile); await wait(300);
    const txt = m.textContent, bars = m.querySelectorAll('.rep-day').length; m.close();
    return { d, played, bars, hasWeek: /This week: 2 minutes, 3 games/.test(txt), fav: /Rainbow Paints/.test(txt) };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.d && r.d.games === 3 && r.d.min === 2 && r.played.colors === 2 && r.played.counting === 1 && r.bars === 7 && r.hasWeek && r.fav && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return '3 games and 2 minutes counted today for the child who played; the report shows the week (7 days), the favourite games and what was collected';
});

await check('reportcollision', async () => {
  return await ownerSmoke('report-float-browser.mts', ['--collision-only']);
});

await check('reportfloating', async () => {
  return await ownerSmoke('report-float-browser.mts');
});

await check('reportdetectors', async () => {
  const {execFileSync}=await import('node:child_process');
  const result=execFileSync(process.execPath,['owner-report-detection.mts'],{encoding:'utf8',timeout:30000});
  fs.writeFileSync('out/reportdetectors.json',result);
  return 'scroll/background/hidden controls excluded; real offscreen and failed opens retained; successful quick close and cancellation do not report';
});

await check('reportingflow', async () => {
  const { reportingFlowCheck } = await import('../reporting-flow.mts');
  return reportingFlowCheck(b);
});

await check('reportstorage', async () => {
  const {execFileSync}=await import('node:child_process');
  return execFileSync(process.execPath,['owner-report-storage.mts'],{encoding:'utf8',timeout:60000}).trim();
});

await check('reportburst', async () => {
  // A single detector scan must not clone the entire interface once for every reported button.
  const ctx = await b.newContext(), pg = await ctx.newPage();
  await ctx.route('**/report-burst-fixture', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><body></body>' }));
  await pg.goto(new globalThis.URL('report-burst-fixture', URL).href);
  const result = await pg.evaluate(async () => {
    document.body.innerHTML = '<div class="modal"><h2>Report burst</h2>' + Array.from({ length: 20 }, (_, i) => `<button>Button ${i}</button>`).join('') + '</div>';
    localStorage.setItem('sv2_tester', JSON.stringify({ at: Date.now() }));
    Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
    let encodes = 0; const original = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (...args) { encodes++; return original.apply(this, args); };
    const T = await import('/js/tester.js'), G = { heroes: [], regionOf: [], huds: [], paused: true };
    T.mountTester(G, 'auto');
    const from = performance.now();
    const reports = Array.from({ length: 12 }, (_, i) => T.autoReport('offscreen', `burst ${i}`, { area: 'test', window: 'fixture', game: '', x: 0, z: 0 }));
    // A duplicate arriving before the picture is ready also shares the original report.
    reports.push(T.autoReport('offscreen', 'burst 0', { area: 'test', window: 'fixture', game: '', x: 0, z: 0 }));
    const ids = await Promise.all(reports), rows = JSON.parse(localStorage.getItem('sv2_tester_out') || '[]');
    const firstEncodes = encodes;
    await T.autoReport('offscreen', 'later', { area: 'test', window: 'fixture', game: '', x: 0, z: 0 });
    G.tester.unmount(); HTMLCanvasElement.prototype.toDataURL = original;
    return { firstEncodes, laterEncodes: encodes - firstEncodes, rows: rows.length, duplicate: ids[0] === ids[12], details: new Set(rows.map(r => r.detail)).size,
      pictures: new Set(rows.map(r => r.shot)).size, jpeg: rows.every(r => r.shot?.startsWith('data:image/jpeg;base64,')), ms: Math.round(performance.now() - from) };
  });
  await ctx.close();
  ok(result.firstEncodes <= 3 && result.laterEncodes > 0 && result.rows === 12 && result.details === 12 && result.duplicate && result.pictures === 1 && result.jpeg, JSON.stringify(result));
  return `12 distinct reports and one duplicate share one capture (${result.firstEncodes} encodes); a later event gets a fresh capture; ${result.ms} ms`;
});
