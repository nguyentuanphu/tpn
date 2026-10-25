// Shared helpers for the browser checks: open the game, start a session, collect errors.
import { chromium } from 'playwright';
export const URL = process.env.SV_URL || 'http://localhost:8765/';
export async function launch() {
  // SV_CHROME_ARGS: extra browser switches, e.g. to try fewer drawing threads when tests/suite.mjs runs several at once
  return chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: [...(process.env.SV_CHROME_ARGS || '').split(' ').filter(Boolean), '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--js-flags=--expose-gc'] });
}
// (round P: a new device starts with nobody; the checks play as two children made beforehand)
export const seedPlayers = () => { try { if (!localStorage.getItem('sv2_profiles')) localStorage.setItem('sv2_profiles', JSON.stringify([
    { id: 'kna', name: 'Bé Na', photo: null, age: 'little', difficulty: 'easy', look: { style: 'dress', color: '#ff5fa2', hat: 'bow', back: 'wings', hairStyle: 'buns' }, created: 1 },
    { id: 'kbin', name: 'Bé Bin', photo: null, age: 'little', difficulty: 'easy', look: { style: 'shirt', color: '#3b6fe0', hat: 'cap', back: 'cape', hairStyle: 'short' }, created: 2 }])); } catch (e) { } };
export async function open(browser, { w = 1180, h = 820, lang = 'en', mode = 'solo', touch = false, settings = {}, play = true, pre = null, dpr = 1, fast = true, url = URL, screen = 'valley', route = null, schedule = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  // (owner, 13 Oct: "changed-files checks") with SV_COVER=1 the game code each check runs is recorded (see takeCoverage)
  if (process.env.SV_COVER === '1') await watchCoverage(ctx, page);
  const errors = [];
  page.on('dialog', d => { errors.push('dialog: ' + d.message()); d.accept().catch(() => { }); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/peerjs|0\.peerjs|ERR_|Failed to load resource|net::|WebSocket connection to/.test(m.text())) errors.push('console: ' + m.text()); });
  // (round R privacy, 9 Oct) online play is off on a new device; the checks play with it on unless they pass online: false
  // (13 Oct) the family's note from Studio (content/custom.json "message") counts as seen today, so a published note never
  // lands in a check (it pauses the game); a check about the note passes settings: { familyMsgDay: null }
  await page.addInitScript(([lang, s]) => { try { const o = JSON.parse(localStorage.getItem('sv2_settings') || '{}'); Object.assign(o, { lang, voice: false, sound: false, music: false, quality: 'low', autoPack: false, online: true, familyMsgDay: new Date().toDateString() }, s); localStorage.setItem('sv2_settings', JSON.stringify(o)); } catch (e) { } }, [lang, settings]);
  // (round P: a new device starts with nobody; the checks play as two children made beforehand)
  await page.addInitScript(seedPlayers);
  if (pre) await page.addInitScript(pre);
  // (r89.1 launch schedule, owner 23 Oct AEDT) content/custom.json "releases" gives some features a start date in the
  // coming weeks, hidden until then from a child who never used them. The checks play as such children, so each check
  // plays as after every batch has started: a rule whose start is still to come is left out, and the feature is on by its
  // own default and switched by CUSTOM.features as before the schedule; the second set of games and stories is switched
  // on. The rollout check, which checks the schedule itself, passes schedule: true and gets the file as shipped
  if (!schedule) await ctx.route('**/content/custom.json', async r => {
    const res = await r.fetch(); let j; try { j = await res.json(); } catch (e) { return r.fulfill({ response: res }); }
    const today = new Date().toISOString().slice(0, 10);
    for (const [id, rule] of Object.entries(j.releases || {})) if (rule && typeof rule === 'object' && 'start' in rule && typeof rule.start === 'string' && rule.start > today) delete j.releases[id];
    // (r90, owner 24 Oct AEDT) the second set of games and stories is held in Studio until the owner releases it; the
    // checks play as after that release (the hold itself is checked by "secondset").
    // Fruit Parade is likewise explicitly enabled for functional checks; dedicated gating cases override this route.
    j.releases = { ...(j.releases || {}), newGames: { on: true }, newStories: { on: true }, sparkleFruitParade_single: { on: true }, sparkleFruitParade_multi: { on: true } };
    await r.fulfill({ response: res, json: j });
  });
  if (route) await route(ctx); // (marketing films) change what the page loads
  await page.goto(url);
  await page.waitForSelector('.screen.title', { timeout: 90000 });
  // the test browser draws in software: draw fewer pixels so checks run quicker
  if (fast) await page.evaluate(() => { const r = window.__sv.renderer; if (r) { r.setPixelRatio(.35); dispatchEvent(new Event('resize')); } });
  if (!play) return { ctx, page, errors };
  await start(page, mode, screen);
  return { ctx, page, errors };
}
// from the title screen into the valley (also after a reload)
// screen: which start screen the children chose (js/simple.js); the checks walk the valley unless they say 'simple'
export async function start(page, mode = 'solo', screen = 'valley') {
  await page.waitForSelector('.screen.title', { timeout: 90000 });
  // (90 s like the title wait: with three software-drawn windows open, each frame takes half a second and a tap waits for one)
  await page.click('.screen.title .press', { force: true, timeout: 90000 });
  await page.waitForSelector('.screen.who', { timeout: 90000 });
  if (mode !== 'solo') await page.click(`.modes button[data-m=${mode}]`, { timeout: 90000 });
  await page.locator('.pick[data-id]').nth(0).click({ timeout: 90000 }); if (mode === 'split') await page.locator('.pick[data-id]').nth(1).click({ timeout: 90000 });
  if (screen) await page.evaluate(async scr => { const S = await import(String('/js/state.js')); S.profiles.forEach(p => { p.screen = scr; }); }, screen);
  // (round R) Ông Cú's prologue film starts by itself for a new child; the checks start without it unless they ask
  await page.evaluate(() => { if (window.__sv) window.__sv._owlAuto = true; });
  await page.click('.who .go', { timeout: 90000 });
  await page.waitForFunction(() => window.__sv && window.__sv.heroes.length > 0);
  // skip the prologue
  for (let i = 0; i < 40; i++) { const sb = await page.$('.storybook'); if (!sb) break; await page.evaluate(() => { const b = document.querySelector<HTMLElement>('.storybook .sb-next, .storybook .next, .storybook button:last-of-type'); b && b.click(); }); await page.waitForTimeout(80); }
  await page.evaluate(() => { document.querySelectorAll('.storybook').forEach(e => e.remove()); window.__sv.paused = false; });
  // (round S) the village festival (real clock), surprises (after 2.5 min of play) and the dance break (after 20 min) come
  // by themselves: the checks start with them off, so they never land in another check; hoilang, surprises and parents
  // switch them back on
  await page.evaluate(async () => { const C = (await import(String('/js/custom.js'))).CUSTOM; C.features = { ...(C.features || {}), hoilang: false, surprises: false, danceBreak: false }; });
  await page.waitForTimeout(500);
}
// close story pages, dialogs and pop-ups that the world opens by itself
export async function clear(page) {
  await page.evaluate(() => { document.querySelectorAll('.storybook, .dialog, .modal, .vc-pop, .reward').forEach(e => e.remove()); window.__sv.paused = false; });
  await page.waitForTimeout(150);
}

// (r83 full suites) Grandpa Owl's welcome sticker shows "A new sticker for your book!" for 4 s, a few seconds after a
// fresh child starts playing; a check that looks for its own caption at a set time counts the welcome as given first.
// The sticker checks leave the welcome alone.
export async function noWelcome(page) {
  await page.evaluate(() => import(String('/js/stickers.js')).then(S => { for (const h of window.__sv.heroes) S.book(h.profile).welcomed = Date.now(); }));
}

// ---- which game code a check ran (SV_COVER=1; tests/suite.mjs builds tests/check-map.json from it) ----
// Every function of the game's own files (js/…) that ran at least once, as [start, end] character offsets ("did it run"
// only: counting every call made checks 3 to 4 times slower). A window is
// read just before it closes, whoever closes it (the check itself or run.mjs after the check).
let covered = {}, seen = {};
async function watchCoverage(ctx, page) {
  // function level only (detailed: false): the per-block kind made checks about 70 % slower
  let cdp; try { cdp = await ctx.newCDPSession(page); await cdp.send('Profiler.enable'); await cdp.send('Profiler.startPreciseCoverage', { callCount: false, detailed: false }); } catch (e) { return; }
  const close = ctx.close.bind(ctx);
  ctx.close = async (...a) => { await readCoverage(cdp); return close(...a); };
}
async function readCoverage(cdp) {
  let list = []; try { list = (await cdp.send('Profiler.takePreciseCoverage')).result; } catch (e) { return; }
  for (const e of list) {
    const m = /^https?:\/\/[^/]+\/(js\/[^?#]+\.js)/.exec(e.url); if (!m) continue;
    const f = covered[m[1]] = covered[m[1]] || new Set();
    const all = seen[m[1]] = seen[m[1]] || new Set();
    for (const fn of e.functions) { const r = fn.ranges[0]; if (!r) continue; all.add(r.startOffset + ':' + r.endOffset); if (r.count > 0) f.add(r.startOffset + ':' + r.endOffset); }
  }
}
// { ran: { file: [[start, end], …] }, seen: { … every function the browser knew, run or not } }
export function takeCoverage() {
  const pack = (o:Record<string,Set<string>>) => Object.fromEntries(Object.entries(o).map(([f, set]) => [f, [...set].map(x => x.split(':').map(Number))]));
  const out = { ran: pack(covered), seen: pack(seen) }; covered = {}; seen = {}; return out;
}

// Functional all-game checks explicitly opt into tester-only titles after startup. They do not
// start the automatic reporter or bypass production entry gates. Negative gating has its own browser check.
export async function openAllGamesFixture(browser,options={}) {
 const result=await open(browser,options);
 await result.page.evaluate(async()=>{const C=(await import(String('/js/custom.js'))).CUSTOM;
  C.releases={...(C.releases||{}),tester:{on:true},sparkleorchard_tester:{on:true},sparkleorchard_single:{on:true},sparkleorchard_multi:{on:true}};
  localStorage.setItem('sv2_tester',JSON.stringify({at:Date.now(),b:'synthetic-fixture'}));
 });return result;
}
