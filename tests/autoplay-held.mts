// (v1.07, issues #746-#778) auto play on a tester's computer was running when the game was opened in a second tab. The
// first tab stopped under its notice "Sparkle Valley is open in another tab or window" (js/launch.ts, js/state.ts
// claimTab), but auto play went on: every game was covered by that notice ("a button covered by something", "could not
// work out how to play it", "did not close", "did not open"), the paused child stood still ("stuck at 69, 151") and the
// stopped tab gave 0 frames a second; each was sent to Studio as a problem. The stopped tab also kept drawing the valley
// under its notice, so the computer drew two games at once (#746, 16 frames a second). And "Send / retry report" after the
// update sent the v1.04 run's problems as v1.05.
// Here the game is opened in a second tab of the same browser while auto play plays Tower Stack, Shopping List and
// Opposites in the first: auto play stops within a few seconds, records and sends nothing, the stopped tab draws no more
// frames of the valley, its last report says why and has no Send button; and a stored run from an older version is sent
// under that version.
import { open, clear, URL } from './harness.mts';

type Browser = Parameters<typeof open>[0];
type QueueRow = { b?: string; auto?: string; detail?: string };

export async function autoplayHeldCheck(b: Browser) {
  const R = { autoplay: { on: true, devices: ['apcheck00001'] }, tester: { on: true, devices: ['apcheck00001'] } };
  const live = JSON.stringify({ releases: R, festivals: {} });
  const P = await open(b, { w: 929, h: 1129, pre: `try { localStorage.setItem('sv2_playerid', 'apcheck00001'); localStorage.setItem('sv2_tester', JSON.stringify({ at: Date.now() })); localStorage.setItem('sv2_live', ${JSON.stringify(live)}); } catch (e) { }`,
    route: async ctx => { await ctx.route('**/api/live**', rt => rt.fulfill({ contentType: 'application/json', body: live })); await ctx.route('**/api/tester**', rt => rt.fulfill({ status: 503, body: '' })); } });
  // (the reports server does not answer, so every report made stays in the device's queue where it is counted below)
  const bad: string[] = [];
  try {
    await P.page.waitForFunction(() => window.__sv && __sv.autoplay && __sv.tester, null, { timeout: 30000 }); await clear(P.page);
    // (the queue of reports starts empty, so every report found later came from this run)
    await P.page.evaluate(() => { localStorage.removeItem('sv2_tester_out'); localStorage.removeItem('sv2_autoplay_report'); __sv.gameSpot = () => null; __sv.autoplay.start(['game:hanoi', 'game:shoplist', 'game:opposites'], 'x5'); });
    await P.page.waitForFunction(() => !!document.querySelector('.gl'), null, { timeout: 30000 });
    await P.page.waitForTimeout(1500);
    // the second tab: the same game, opened as a tester opens it again
    const B = await P.ctx.newPage(); await B.goto(URL); await B.waitForSelector('.screen.title', { timeout: 90000 });
    const t0 = Date.now();
    await P.page.waitForSelector('.tab-held', { timeout: 15000 });
    // (what the slow test browser reported before the second tab opened is not this check's business: from here on, nothing)
    await P.page.evaluate(() => localStorage.removeItem('sv2_tester_out'));
    await P.page.waitForFunction(() => !__sv.autoplay.running(), null, { timeout: 30000 }).catch(() => bad.push('auto play went on in the stopped tab for 30 s'));
    const stopIn = (Date.now() - t0) / 1000;
    const r = await P.page.evaluate(async () => {
      const frames = () => __sv.renderer.info.render.frame, f0 = frames(); await new Promise(res => setTimeout(res, 2500));
      const rep = JSON.parse(localStorage.getItem('sv2_autoplay_report') || 'null');
      const out = JSON.parse(localStorage.getItem('sv2_tester_out') || '[]'); // (the stopped tab writes nothing; the new tab's own reports would show here too, so only the auto play ones count)
      return { drawn: frames() - f0, rep: rep && { held: rep.held, rows: rep.done.map(d => ({ key: d.key, problems: d.problems })), state: rep.reportState }, sent: out.filter(x => x.auto === 'autoplay' || /another tab/.test(x.detail || '')).map(x => `${x.auto}: ${x.detail}`) };
    });
    if (r.drawn > 2) bad.push(`the stopped tab drew the valley ${r.drawn} times in 2.5 s`);
    if (!r.rep || !r.rep.held || r.rep.state !== 'held') bad.push(`the last report does not say it was stopped by another tab: ${JSON.stringify(r.rep)}`);
    const withProblems = (r.rep?.rows || []).filter(x => x.problems.length);
    if (withProblems.length) bad.push(`problems recorded in the stopped tab: ${JSON.stringify(withProblems)}`);
    if (r.sent.length) bad.push(`reports sent from the stopped tab: ${r.sent.slice(0, 4).join(' | ')}`);
    // the auto play window of the stopped tab: the reason, no Send button
    const win = await P.page.evaluate(async () => { __sv.autoplay.open(); await new Promise(res => setTimeout(res, 600)); return { send: !!document.querySelector('[data-a="send"]'), said: /another tab|thẻ hoặc cửa sổ khác/.test(document.body.innerText) }; });
    if (win.send || !win.said) bad.push(`the auto play window of the stopped tab: ${JSON.stringify(win)}`);
    // the second tab (the one now playing): a run kept from v1.04 is sent as v1.04 when "Send / retry report" is used
    await B.close();
    const Q = await open(b, { w: 929, h: 1129, pre: `try { localStorage.setItem('sv2_playerid', 'apcheck00001'); localStorage.setItem('sv2_tester', JSON.stringify({ at: Date.now() })); localStorage.setItem('sv2_live', ${JSON.stringify(live)}); } catch (e) { }`,
      route: async ctx => { await ctx.route('**/api/live**', rt => rt.fulfill({ contentType: 'application/json', body: live })); await ctx.route('**/api/tester**', rt => rt.fulfill({ status: 503, body: '' })); } });
    try {
      await Q.page.waitForFunction(() => window.__sv && __sv.tester, null, { timeout: 30000 }); await clear(Q.page);
      // (only the auto play reports: the test browser's own software drawing can be slow here)
      const old = await Q.page.evaluate(async () => {
        localStorage.removeItem('sv2_tester_out');
        const T = await import('/js/tester.js');
        const res = await T.sendAutoplayReport({ build: 'v1.04', done: [{ g: 'games', key: 'game:hanoi', name: 'Tower Stack', ok: false, problems: ['did not close'], notes: [] }] });
        const held = await T.sendAutoplayReport({ build: 'v1.04', held: true, done: [{ g: 'games', key: 'game:robot', name: 'Robot Planner', ok: false, problems: ['still stuck'], notes: [] }] });
        return { res: res.state, held: held.state, rows: (JSON.parse(localStorage.getItem('sv2_tester_out') || '[]') as QueueRow[]).filter(x => x.auto === 'autoplay').map(x => ({ b: x.b, detail: x.detail })) };
      });
      if (old.rows.length !== 1 || old.rows[0].b !== 'v1.04' || !/Tower Stack/.test(old.rows[0].detail || '')) bad.push(`a stored v1.04 run was not sent as v1.04: ${JSON.stringify(old)}`);
      if (old.held !== 'held') bad.push(`a stored run stopped by another tab was sent: ${JSON.stringify(old)}`);
      bad.push(...Q.errors.filter(e => !/503|Service Unavailable/.test(e)).slice(0, 2));
    } finally { await Q.ctx.close(); }
    bad.push(...P.errors.filter(e => !/503|Service Unavailable/.test(e)).slice(0, 2));
    if (bad.length) throw new Error(bad.join('; '));
    return `the game opened in a second tab during auto play: the first tab stopped auto play in ${stopIn.toFixed(1)} s, recorded and sent no problem (${r.rep.rows.length} step(s) done before), drew no more frames (${r.drawn} in 2.5 s) and says why; a stored v1.04 run is sent as v1.04`;
  } finally { await P.ctx.close().catch(() => { }); }
}
