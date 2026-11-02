// (v1.07 startup, owner's plan docs/plan-hoan-thien/KE-HOACH.md focus 1: "the Simple screen does not need the 3D world,
// so it must open at once") a child alone who starts on the Simple screen, and has seen Ông Cú's prologue, gets it at
// once after Go, before the valley is built, and can open a game from it; the valley's session starts behind it later.
// The processor runs 4 times slower (tablet speed, as the `startup` check), so the valley is still being built. The taps
// are made inside the page, a third of a second apart, as a child's finger would: the checks' own remote control is
// answered only now and then while the valley is built, so it would tap long after the child did.
import type { Browser } from 'playwright';
import { URL, seedPlayers } from './harness.mjs';
type Seen = Record<string, number | boolean | string | null>;
export async function simpleFirstCheck(browser: Browser): Promise<string> {
  let cdp = null;
  const pre = () => {
    try { const ps = JSON.parse(localStorage.getItem('sv2_profiles') || '[]'); for (const p of ps) { p.screen = 'simple'; p.story = { ...(p.story || {}), prologue: true }; } localStorage.setItem('sv2_profiles', JSON.stringify(ps)); } catch (e) { }
    const W = window as unknown as { __sf: Seen, __sv?: { bootTimes?: unknown, simple?: { cats: string[], openGroup(t: string, k: string): void, view: { stops: string[] } } } };
    const seen: Seen = W.__sf = {}, now = () => Math.round(performance.now()), built = () => !!W.__sv?.bootTimes;
    const mark = (k: string) => { if (seen[k] == null) { seen[k] = now(); seen[k + 'Built'] = built(); } };
    let busy = false; const later = (f: () => void | Promise<void>) => { busy = true; setTimeout(async () => { try { await f(); } catch (e) { seen.error = String(e); } busy = false; }, 330); };
    const step = () => {
      if (busy || seen.closed) return;
      const q = (s: string) => document.querySelector<HTMLElement>(s);
      if (!seen.press && q('.screen.title .press')) { mark('title'); later(() => { mark('press'); q('.screen.title .press').click(); }); return; }
      if (!seen.pick && q('.screen.who .pick[data-id]')) { later(() => { mark('pick'); q('.screen.who .pick[data-id]').click(); }); return; }
      if (seen.pick && !seen.go && q('.who .go')) { later(() => { mark('go'); q('.who .go').click(); }); return; }
      if (seen.go && !seen.simple && q('.simple-screen:not([hidden])')) { mark('simple'); later(async () => {
        const S = W.__sv.simple; S.openGroup('games', S.cats[0]); const id = S.view.stops[0], name = (await import(String('/js/games/frame.js'))).GAMES[id].name();
        const b = [...document.querySelectorAll<HTMLElement>('.sp-stop')].find(x => x.getAttribute('aria-label') === name); seen.game = id; mark('tap'); b.click(); }); return; }
      if (seen.tap && !seen.open && q('.gl')) { mark('open'); later(() => { q('.gl .gl-x')?.click(); }); return; }
      if (seen.open && !q('.gl') && !seen.closed) { mark('closed'); if (!built()) { q('.sp-valley').click(); mark('valley'); setTimeout(() => { seen.valleyWait = !!q('.bootwait') && !!q('.simple-screen:not([hidden])'); }, 200); } }
    };
    new MutationObserver(step).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
    setInterval(step, 250);
  };
  // (its own page, not open(): open() waits for Welcome through the remote control, and the taps may be past it by then)
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true }), page = await ctx.newPage(), errors: string[] = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/peerjs|ERR_|Failed to load resource|net::|WebSocket/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.addInitScript(() => { try { localStorage.setItem('sv2_settings', JSON.stringify({ lang: 'en', voice: false, sound: false, music: false, quality: 'low', autoPack: false, online: true, familyMsgDay: new Date().toDateString() })); } catch (e) { } });
  await page.addInitScript(seedPlayers); await page.addInitScript(pre);
  cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  try {
    await page.goto(URL);
    await page.waitForFunction(() => !!(window as unknown as { __sf: Seen }).__sf.closed || !!(window as unknown as { __sf: Seen }).__sf.error, null, { timeout: 300000 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await page.waitForFunction(() => !!window.__sv.bootTimes && window.__sv.heroes.length === 1 && !!document.querySelector('.hud'), null, { timeout: 300000 });
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => ({ seen: (window as unknown as { __sf: Seen }).__sf, play: window.__sv.playTimes?.at, waited: window.__sv.playTimes?.waited, ready: (window.__sv as unknown as { bootTimes: { start: number, ready: number } }).bootTimes,
      heroes: window.__sv.heroes.length, simple: !!document.querySelector('.simple-screen:not([hidden])'), wait: !!document.querySelector('.bootwait') }));
    const s = r.seen, end = r.ready.start + r.ready.ready;
    const good = !s.error && s.simple && !s.simpleBuilt && s.open && !s.openBuilt && (s.simple as number) - (s.go as number) < 1500 && r.play > 0 && r.waited === 0
      && r.heroes === 1 && !r.wait && (s.valley ? s.valleyWait === true && !r.simple : r.simple) && !errors.length;
    if (!good) throw new Error(JSON.stringify({ ...r, errors }));
    const sec = (n: number) => (n / 1000).toFixed(1) + ' s';
    return `tablet speed: Welcome at ${sec(s.title as number)}, Go at ${sec(s.go as number)}, the Simple screen ${(s.simple as number) - (s.go as number)} ms later, game "${s.game}" open ${(s.open as number) - (s.tap as number)} ms after its tap, ` +
      `the valley built at ${sec(end)} (after both); can play ${sec(r.play)} after the page opened; ${s.valley ? 'the valley button waited with the progress bar, then the valley opened' : 'the session started behind the Simple screen'}`;
  } finally { await ctx.close(); }
}
