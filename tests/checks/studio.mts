// Sparkle Valley checks: Studio and the owner's desk.
// Run them through tests/run.mts (node run.mts <check>) or tests/suite.mts, not on their own.
// Moved unchanged from tests/run.mts (v1.07 split-tests, 2 Nov 2026 AEDT); see tests/checks/README.md.
import { managementPolicyBudgetCheck, fs, launch, open, clear, start, studioCheck, studioRepairCheck, managementBrowserCheck, ownerDeskBrowserCheck, only, want, check, ok, b, ownerSmoke } from './shared.mts';

await check('studio', async () => {
  // Sparkle Studio online and the exe: one program (same pages, same engine, same version as the game)
  const build = /BUILD = '([^']+)'/.exec(fs.readFileSync('../js/build.js', 'utf8'))[1], studio = JSON.parse(fs.readFileSync('../studio/version.json', 'utf8')).studio;
  ok(build === studio, `studio/version.json says ${studio} but the game is ${build}: bump them together (and rebuild SparkleStudio.exe)`);
  return await studioCheck(b);
});

await check('ownerstudiofailures', async () => studioRepairCheck(b));

await check('managementbudget', async () => managementPolicyBudgetCheck(b));

await check('managementstudio', async () => managementBrowserCheck(b));

await check('ownerdesk', async () => ownerDeskBrowserCheck(b));

await check('studiolive', async () => {
  // (r81, owner 17 Oct AEDT) Studio's content pages are live at once, without Publish: a Message, a Mission, a Quiz
  // question and a Defaults switch saved live reach the game from /api/live, in English and in Vietnamese; a live section
  // wins over the same one in content/custom.json, one never saved live keeps custom.json's (Villagers' names here); with
  // no answer from the website (no internet) the game uses the copy it kept and still never shows the file's old message
  const FILE = { message: { en: 'Old note from the file', vi: 'Lời nhắn cũ trong tệp' }, quiz: [{ q: ['File question?', 'Câu hỏi trong tệp?'], answers: [['a', 'a'], ['b', 'b']], right: 0 }], names: { 'Bà Tư': { en: 'File Grandma', vi: 'Bà trong tệp' } } };
  const LIVE = { releases: {}, festivals: {}, content: { message: { en: 'Live hello from Mum', vi: 'Mẹ chào con yêu' }, missions: [{ id: 'mlive1', en: 'Water the plants', vi: 'Tưới cây' }], quiz: [{ q: ['Live question?', 'Câu hỏi mới?'], answers: [['Yes', 'Có'], ['No', 'Không']], right: 0 }], defaults: { calm: true, restMins: 45 } } };
  const json = o => r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(o) }), rows = [];
  const read = page => page.evaluate(async () => { const C = await import('/js/custom.js'), { T } = await import('/js/i18n.js'), S = await import('/js/state.js'), G = window.__sv;
    const m = G && G.heroes[0] ? G.parents.openFor(G.heroes[0].profile).find(x => x.id === 's_mlive1') : null, q = C.customQuiz()[0], n = C.customName('Bà Tư');
    return { message: C.CUSTOM.message && T(C.CUSTOM.message.en, C.CUSTOM.message.vi), mission: m ? T(m.en, m.vi) : null, quiz: q ? T(q.q[0], q.q[1]) : null, name: n ? T(n.en, n.vi) : null, calm: S.settings.calm, rest: S.settings.restMins, kept: !!(JSON.parse(localStorage.getItem('sv2_live') || '{}').content || {}).message }; });
  for (const lang of ['en', 'vi']) {
    const want = lang === 'en' ? { message: 'Live hello from Mum', mission: 'Water the plants', quiz: 'Live question?', name: 'File Grandma' } : { message: 'Mẹ chào con yêu', mission: 'Tưới cây', quiz: 'Câu hỏi mới?', name: 'Bà trong tệp' };
    const P = await open(b, { w: 390, h: 844, touch: true, lang, settings: { familyMsgDay: null }, route: async ctx => { await ctx.route('**/content/custom.json*', json(FILE)); await ctx.route('**/api/live**', json(LIVE)); } });
    // (the message waits behind anything else the start shows, e.g. the family missions guide: those are closed here)
    let shown = ''; for (let i = 0; i < 40 && !shown; i++) { shown = await P.page.evaluate(() => { const ds = [...document.querySelectorAll('.dialog')], m = ds.find(d => /Mum|Mẹ chào|trong tệp|from the file/.test(d.textContent)); if (m) return m.textContent; ds.forEach(d => d.remove()); __sv.paused = false; return ''; }); if (!shown) await P.page.waitForTimeout(1000); }
    await clear(P.page); const on = await read(P.page);
    // no internet: the website does not answer; the game opens again with the copy it kept
    await P.ctx.unroute('**/api/live**'); await P.ctx.route('**/api/live**', r => r.abort()); await P.page.reload(); await P.page.waitForSelector('.screen.title', { timeout: 90000 });
    const off = await read(P.page);
    // (r81) the page's own update-notice switch (js/launch.js, used before the game's switch reader is ready) follows a
    // live Defaults value kept on this device, not only content/custom.json
    const notice = async () => P.page.evaluate(() => { document.querySelector('.update-notice')?.remove(); delete window.svFeatureOn; svOfferUpdate(); const n = !!document.querySelector('.update-notice'); document.querySelector('.update-notice')?.remove(); return n; });
    const noticeBefore = await notice();
    await P.page.evaluate(() => { const l = JSON.parse(localStorage.getItem('sv2_live') || '{}'); l.content = { ...(l.content || {}), features: { explain_updateNotice: false } }; localStorage.setItem('sv2_live', JSON.stringify(l)); });
    await P.page.reload(); await P.page.waitForSelector('.screen.title', { timeout: 90000 });
    const noticeLiveOff = await notice(), errs = P.errors; await P.ctx.close();
    off.noticeBefore = noticeBefore; off.noticeLiveOff = noticeLiveOff;
    const good = x => x.message === want.message && x.quiz === want.quiz && x.name === want.name && x.calm === true && String(x.rest) === '45' && x.kept;
    rows.push({ lang, shown: shown.slice(0, 80), on, off });
    ok(shown.includes(want.message) && !/file|tệp/i.test(shown) && good(on) && on.mission === want.mission && good(off) && off.noticeBefore === true && off.noticeLiveOff === false && !errs.length, JSON.stringify({ lang, shown, on, off, errs }));
  }
  return 'live Message shown, Mission, Quiz question and Defaults in English and Vietnamese with no Publish; live wins over custom.json, names fall back to it; offline the kept copy; a kept live update-notice switch reaches js/launch.js: ' + JSON.stringify(rows.map(r => [r.lang, r.on.message, r.off.quiz, r.off.noticeLiveOff]));
});

await check('nostudio', async () => {
  // (10 Oct, owner: "Parents or users wont know what Sparkle Studio is and this is for admin so it should not be mentioned
  // anywhere at all") Grown-ups with every group open, the parents' pages and every Pad tab never name Studio
  const P = await open(b, { w: 1024, h: 768 }); await clear(P.page);
  const bad = await P.page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), out = [], C = (await import('/js/custom.js')).CUSTOM;
    C.missions = [{ id: 'fam1', en: 'Water the plants', vi: 'Tưới cây' }];
    const look = (where, root) => { const t = [root.textContent, ...[...root.querySelectorAll('[title],[aria-label],[placeholder],[alt]')].flatMap(e => [e.title, e.getAttribute('aria-label'), e.placeholder, e.alt])].join(' '); const m = t.match(/.{0,40}studio.{0,40}/i); if (m) out.push(where + ': ' + m[0]); };
    for (const lang of ['en', 'vi']) {
      const S = await import('/js/state.js'); S.settings.lang = lang;
      const { openGrownups } = await import('/js/ui.js'); await openGrownups(() => { }); await w(500);
      const g = document.querySelector('.modal.grownups'); g.querySelectorAll('details').forEach(d => { d.open = true; }); look(lang + ' Grown-ups', g);
      document.querySelectorAll('.modal').forEach(e => e.remove());
      const G = window.__sv; if (G.parents && G.parents.grownupsHTML) { const d = document.createElement('div'); d.innerHTML = G.parents.grownupsHTML(true); look(lang + ' parents', d); }
      G.openPad(0, 'map'); await w(400);
      // (Round V, owner 13 Oct) the Shop tab closes the Pad and opens the Shop: the Shop is looked at too, then the Pad reopens
      for (const t of [...document.querySelectorAll('.pad-tabs [data-t]')].map(x => x.dataset.t)) {
        if (!document.querySelector(`.pad-tabs [data-t="${t}"]`)) { document.querySelectorAll('.modal').forEach(e => e.remove()); G.paused = false; G.openPad(0, 'map'); await w(400); }
        document.querySelector(`.pad-tabs [data-t="${t}"]`).click(); await w(t === 'shop' ? 700 : 250);
        const pad = document.querySelector('.pad, .sparkpad, .pad-body') || document.querySelector('.modal'); if (pad) look(lang + ' pad-' + t, pad.closest('.modal') || pad);
      }
      document.querySelectorAll('.modal, .pad').forEach(e => e.remove()); window.__sv.paused = false;
    }
    return out;
  });
  const errs = P.errors; await P.ctx.close();
  ok(!bad.length && !errs.length, JSON.stringify({ bad, errs }));
  return 'Grown-ups (every group open), the parents\' pages and every Pad tab, English and Vietnamese: Studio never named';
});

await check('ownerstudiofolds', async () => {
  return await ownerSmoke('owner-studio-folds.mts');
});

await check('ownerstudioperms', async () => {
  return await ownerSmoke('owner-studio-perms.mts');
});

// (v1.08b platform, owner 5 Nov 2026 AEDT) Studio: Back shows the kept page without a network read; Releases by
// purpose with a plain line, a state, one tap, search, a timeline and the change list; Sparkle Lab in three parts
await check('studioback', async () => ownerSmoke('studio-back.mts', ['studioback']));
await check('studioreleases', async () => ownerSmoke('studio-back.mts', ['studioreleases']));
await check('sparklelab', async () => ownerSmoke('studio-back.mts', ['sparklelab']));
