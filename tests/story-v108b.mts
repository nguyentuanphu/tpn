// (v1.08b story) checks for the release calendar, the pad's calendar tab and the install gift
// (docs/cores/tasks/v108b/story-brief.md). Run through tests/run.mts or tests/suite.mts.
import assert from 'node:assert/strict';
import { open, clear } from './harness.mts';

const SCREENS = [['phone', 390, 844, true], ['phone sideways', 844, 390, true], ['tablet', 820, 1180, true], ['tablet sideways', 1180, 820, true], ['computer', 1440, 900, false]] as const;

// releasecalendar: every held-back game and story has a week, the owner's moves win, an item opens on its day (a tester
// 7 days early), a held game whose day has come is open for a child who never played, and the Coming soon tile tells
// what opens next week
export async function releaseCalendarCheck(b) {
  const R = await import('../js/content/releasecal.ts'), S = await import('../js/content/secondset.ts'); await R.loadCalNames();
  const held = [...Object.values(S.SECOND_SET_GAMES).flat().map(id => 'game:' + id), ...Object.values(S.SECOND_SET_TALES).flat().map(id => 'story:' + id)];
  const keys = new Set(R.CAL_DEFAULT.map(i => i.key));
  const missing = held.filter(k => !keys.has(k)); assert.deepEqual(missing, [], 'held-back items with no week');
  for (const it of R.CAL_DEFAULT) { assert.ok(it.en && it.vi && it.icon, 'a name and a picture: ' + it.key); assert.match(it.date, /^\d{4}-\d\d-\d\d$/); }
  for (const it of R.CAL_DEFAULT.filter(i => i.kind === 'game' || i.kind === 'story')) assert.equal(R.weekOf(it.date), it.date, 'games and stories open on a Monday: ' + it.key);
  // about 3-4 games and 1-2 stories a week
  const weeks = new Map<string, number[]>(); for (const it of R.CAL_DEFAULT) { const w = weeks.get(it.date) || [0, 0]; if (it.kind === 'game') w[0]++; if (it.kind === 'story') w[1]++; weeks.set(it.date, w); }
  for (const [d, [g, s]] of weeks) if (g + s) assert.ok(g <= 4 && s <= 3, `week ${d}: ${g} games, ${s} stories`);
  assert.equal(R.openDate('chapter:ch4'), '2026-12-04'); assert.equal(R.openDate('chapter:finale'), '2027-02-06');
  // the owner's move
  const moved = R.calendar({ 'game:crabwalk': '2027-03-01', 'game:nope': '2027-03-01', 'story:platypus': 'soon' });
  assert.equal(moved.find(i => i.key === 'game:crabwalk')?.date, '2027-03-01'); assert.ok(moved.find(i => i.key === 'game:crabwalk')?.moved);
  assert.equal(moved.find(i => i.key === 'story:platypus')?.date, R.openDate('story:platypus'));
  const d = R.openDate('game:crabwalk'), before = new Date(R.dayOf(R.addDays(d, -1)).getTime() + 10 * 36e5), on = new Date(R.dayOf(d).getTime() + 10 * 36e5);
  assert.ok(!R.calOpen('game:crabwalk', null, before) && R.calOpen('game:crabwalk', null, on), 'opens on its day');
  assert.ok(R.calOpen('game:crabwalk', null, new Date(R.dayOf(R.addDays(d, -7)).getTime() + 10 * 36e5), 7), 'a tester sees it 7 days early');
  const W = R.whatsNew(R.CAL_DEFAULT, on); assert.ok(W.thisWeek.some(i => i.key === 'game:crabwalk'));
  assert.ok(R.whatsNew(R.CAL_DEFAULT, before).nextWeek.some(i => i.key === 'game:crabwalk'));
  // in the game: New games off, crabwalk's day moved to today and a game of next week's teaser
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const C = await import('/js/custom.js'), U = await import('/js/content/unlocks.js'), R = await import('/js/content/releasecal.js'), S = await import('/js/content/secondset.js');
    C.CUSTOM.releases = { ...(C.CUSTOM.releases || {}), newGames: { on: false }, newStories: { on: false } }; C.setPeeks([], 0);
    const today = R.isoDay(new Date()), next = R.addDays(R.weekOf(new Date()), 7);
    C.CUSTOM.releaseCalendar = { moves: { 'game:crabwalk': R.addDays(today, 30), 'game:whohome': today, 'game:mumbaby': next, 'game:feedzoo': next } };
    const p = { wins: {}, taleReads: {} };
    const out = { crabHeld: U.isHeld('crabwalk', 'game'), whoHeld: U.isHeld('whohome', 'game'), whoOpen: U.isOpen(p, 'whohome', 'game', 'animals'), teaser: S.calNextWeek('game', ['mumbaby', 'feedzoo', 'crabwalk']) } as any;
    __sv.openGamesHub ? __sv.openGamesHub(0) : (await import('/js/ui.js')).openGamesHub(__sv, 0);
    await new Promise(r => setTimeout(r, 400));
    const tab = document.querySelector<HTMLElement>('.hubtabs [data-tab="animals"]'); if (tab) { tab.click(); await new Promise(r => setTimeout(r, 300)); }
    out.tile = document.querySelector('.hsoon .hsoonnext')?.textContent || '';
    document.querySelectorAll('.modal').forEach(e => e.remove()); __sv.paused = false;
    return out;
  });
  const errs = P.errors; await P.ctx.close();
  assert.ok(r.crabHeld && !r.whoHeld && r.whoOpen && r.teaser === 2, JSON.stringify(r));
  assert.match(r.tile, /Next week: 2 new games/, JSON.stringify(r));
  assert.deepEqual(errs, []);
  return `${R.CAL_DEFAULT.length} items in ${weeks.size} weeks (${held.length} held back, every one placed, chapters 4, 5 and finale on their days); moves win; opens on its day (testers 7 days early); a held game whose day came is open with no wins; the Coming soon tile says "${r.tile}"`;
}

// calendartab: the pad's tab "Calendar: festivals and what's new", compact (owner, 5 Nov 2026 AEDT: "too long"): one row
// per festival with its picture, name, date, ONE status chip and a thin bar with dots; the next 4 show and "See more"
// opens the rest; tapping a row opens its steps (start - end, days left), one row at a time; the new-things lines show
// only when they have something (never "Nothing ..."); 16 px text, 44 px targets, no sideways scroll on phone, tablet
// and computer; a step that is on takes the child there
export async function calendarTabCheck(b) {
  const out = [];
  for (const [name, w, h, touch] of SCREENS) {
    const P = await open(b, { w, h, touch }); await clear(P.page);
    const r = await P.page.evaluate(async () => {
      const wait = (t: number) => new Promise(r => setTimeout(r, t));
      __sv.openPad(0, 'cal'); await wait(600);
      for (let k = 0; k < 40 && !document.querySelector('.fcal-whatsnew .fcal-line'); k++) await wait(100);
      const pad = document.querySelector('.pad') || document, q = (s: string) => [...pad.querySelectorAll<HTMLElement>(s)], vis = (e: HTMLElement) => e.getBoundingClientRect().height > 0;
      const rows = q('.fcal-row'), shown = rows.filter(vis), chips = shown.map(r => r.querySelectorAll('.fcal-chip').length), bars = shown.filter(r => r.querySelector('.fcal-bar .fcal-dot')).length;
      const words = shown.map(r => (r.querySelector('.fcal-head')?.textContent || '').length);
      const detOpen = q('.fcal-det').filter(vis).length;
      const head = shown[0]?.querySelector<HTMLElement>('.fcal-head'); head?.click(); await wait(100);
      const steps = q('.fcal-step').filter(vis), stepDays = steps.filter(s => /day|ngày/.test(s.textContent || '')).length, openNow = q('.fcal-det').filter(vis).length;
      shown[1]?.querySelector<HTMLElement>('.fcal-head')?.click(); await wait(100); const oneOpen = q('.fcal-det').filter(vis).length;
      const more = pad.querySelector<HTMLElement>('.fcal-more'); more?.click(); await wait(100); const afterMore = q('.fcal-row').filter(vis).length;
      const texts = q('.fcal-head b, .fcal-head small, .fcal-chip, .fcal-step b, .fcal-step em, .fcal-line h3, .fcal-new b').filter(vis);
      const small = texts.filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).length;
      const tiny = q('.fcal-head, .fcal-step, .fcal-new, .fcal-more').filter(vis).filter(e => { const b = e.getBoundingClientRect(); return b.height < 44 || b.width < 44; }).length;
      const over = document.documentElement.scrollWidth > innerWidth + 1, nothing = /Nothing|Chưa có|không có gì/.test(pad.querySelector('.fcal')?.textContent || '');
      return { rows: rows.length, shown: shown.length, chips, bars, words: Math.max(...words), detOpen, steps: steps.length, stepDays, openNow, oneOpen, afterMore, small, tiny, over, nothing,
        lines: q('.fcal-line h3').map(e => e.textContent), title: q('.fcal-title').map(e => e.textContent).join(), tab: document.querySelector('.pad [data-tab="cal"]')?.textContent || '' };
    });
    const errs = P.errors; await P.ctx.close();
    assert.ok(r.rows >= 6 && r.shown <= 5 && r.chips.every(c => c === 1) && r.bars === r.shown && r.detOpen === 0, name + ' rows ' + JSON.stringify(r));
    assert.ok(r.words < 110, name + ': a row says too much ' + JSON.stringify(r));
    assert.ok(r.steps >= 2 && r.stepDays === r.steps && r.openNow === 1 && r.oneOpen === 1 && r.afterMore > r.shown, name + ' details ' + JSON.stringify(r));
    assert.ok(!r.nothing && r.lines.length >= 1, name + ' new-things lines ' + JSON.stringify(r));
    assert.match(r.title, /Calendar: festivals and what's new/);
    assert.ok(!r.small && !r.tiny && !r.over, name + ' ' + JSON.stringify(r));
    assert.deepEqual(errs, [], name);
    out.push(`${name} ${r.shown} of ${r.rows} rows`);
  }
  // a step that is on takes the child there: Halloween moved to today in Studio (its festival date)
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const fly = await P.page.evaluate(async () => {
    const C = (await import('/js/custom.js')).CUSTOM, ymd = (await import('/js/content/festival-visibility.js')).sydneyFestivalDate();
    C.festivals = { ...(C.festivals || {}), halloween: { date: ymd } }; __sv.festivals.rebuild(); await new Promise(r => setTimeout(r, 2000));
    document.querySelectorAll('.dialog, .reward, .modal').forEach(e => e.remove()); __sv.paused = false;
    let went = null; const was = __sv.travel; __sv.travel = async (h, x, z) => { went = { x, z }; };
    __sv.openPad(0, 'cal'); await new Promise(r => setTimeout(r, 500));
    const row = document.querySelector<HTMLElement>('.pad .fcal-row[data-festid="halloween"]'), first = document.querySelector('.pad .fcal-row') === row, chip = row?.querySelector('.fcal-chip')?.textContent;
    row?.querySelector<HTMLElement>('.fcal-head')?.click(); await new Promise(r => setTimeout(r, 100));
    const step = row?.querySelector<HTMLElement>('.fcal-step.on'); const any = !!step; step?.click(); await new Promise(r => setTimeout(r, 300)); __sv.travel = was;
    const padOpen = !!document.querySelector('.pad'); document.querySelectorAll('.modal').forEach(e => e.remove()); __sv.paused = false;
    return { first, chip, any, went, padOpen };
  });
  const errs = P.errors; await P.ctx.close();
  assert.ok(fly.first && /On now/.test(fly.chip || '') && fly.any && fly.went && !fly.padOpen, 'the festival that is on comes first, and its step takes the child there ' + JSON.stringify(fly)); assert.deepEqual(errs, []);
  return out.join('; ') + '; one chip and a bar per row, details on tap (one at a time), See more; the festival that is on comes first and a step that is on takes the child there';
}

// installgift: the first time the game runs installed, each child gets the Home hat, 100 coins and a sticker, once; the
// Grown-ups install chip says there is a gift; nothing is given in a browser tab
export async function installGiftCheck(b) {
  const standalone = () => { const mm = window.matchMedia.bind(window); window.matchMedia = (q: string) => /display-mode: standalone/.test(q) ? ({ matches: true, media: q, addEventListener() { }, removeEventListener() { }, addListener() { }, removeListener() { }, onchange: null, dispatchEvent: () => false } as any) : mm(q); };
  const P = await open(b, { w: 390, h: 844, touch: true, pre: standalone }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const w = (t: number) => new Promise(r => setTimeout(r, t)), G = __sv, h = G.heroes[0], p = h.profile;
    for (let k = 0; k < 40 && !G.installGift; k++) await w(100);
    // (a gift given while the game opened: let its card go first, then give it again from nothing)
    for (let k = 0; k < 40 && document.querySelector('.reward'); k++) await w(100); await w(300);
    const F = await import('/js/state.js').catch(() => null); G.installGift.stop(); const coins0 = (F && F.farm ? F.farm.coins : null), st0 = (p.stickers || []).length;
    const first = !!p.installGift; delete p.installGift; p.owned.hats = (p.owned.hats || []).filter(x => x !== 'homehat'); // (it may have come while the game opened)
    let reward = ''; G.paused = false; G.installGift.poll(); await w(400); reward = document.querySelector('.reward')?.textContent || '';
    if (!p.installGift) { await w(5000); G.paused = false; G.installGift.poll(); await w(400); reward = document.querySelector('.reward')?.textContent || ''; }
    const got = { first, flag: !!p.installGift, hat: (p.owned.hats || []).includes('homehat'), coins: F && F.farm ? F.farm.coins - coins0 : null, stickers: (p.stickers || []).length - st0, reward };
    document.querySelectorAll('.reward, .dialog, .modal').forEach(e => e.remove()); G.paused = false;
    const again = G.installGift.give(h);
    // the hat on the child
    p.look.hat = 'homehat'; G.rebuildHero && G.rebuildHero(0); await w(200);
    return { ...got, again };
  });
  const errs = P.errors; await P.ctx.close();
  assert.ok(r.flag && r.hat && r.stickers >= 1 && !r.again && /Home hat/.test(r.reward), JSON.stringify(r));
  if (r.coins != null) assert.equal(r.coins, 100, JSON.stringify(r));
  assert.deepEqual(errs, []);
  // in a browser tab: no gift; the Grown-ups chip mentions the gift
  const Q = await open(b, { w: 1180, h: 820 }); await clear(Q.page);
  const t = await Q.page.evaluate(async () => {
    const w = (t: number) => new Promise(r => setTimeout(r, t)); await w(6500);
    const given = !!__sv.heroes[0].profile.installGift || !!__sv.installGift; // (in a browser tab its code is not even loaded)
    const U = await import('/js/ui.js'); await U.openGrownups(); await w(400);
    const chip = document.querySelector('.installrow')?.textContent || '';
    document.querySelectorAll('.modal').forEach(e => e.remove()); __sv.paused = false;
    return { given, chip };
  });
  await Q.ctx.close();
  assert.ok(!t.given, 'no gift in a browser tab');
  if (t.chip) assert.match(t.chip, /get a gift for your child/);
  return `installed: Home hat, +${r.coins} coins, a sticker, told in a reward card, once; in a browser tab nothing is given; Grown-ups chip: "${t.chip.trim().slice(0, 80)}"`;
}

// websitenews: the family website's What's new strip under the hero and the Calendar part inside Discover, from the
// game's release calendar and festival dates; EN and VI; phone, tablet and computer with no sideways scroll
export async function websiteNewsCheck(b) {
  const out = [];
  for (const [name, w, h, touch] of SCREENS) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch }), page = await ctx.newPage(), errs: string[] = [];
    page.on('pageerror', e => errs.push(e.message));
    // the public festival switches, as /api/festivals gives them on the site (every festival on)
    const { FESTCAL } = await import('../js/content/festcal.ts');
    await page.route('**/api/festivals', r => r.fulfill({ json: { schema: 1, enabled: FESTCAL.map(F => F.id), festivals: {} } }));
    await page.goto(new globalThis.URL('home/', process.env.SV_URL || 'http://localhost:8765/').href); await page.waitForTimeout(1500);
    const r = await page.evaluate(async () => {
      const s = document.querySelector('#whats-new-strip'), c = document.querySelector('#calendar');
      const en = s?.textContent || '', cells = s?.querySelectorAll('.wn-cell').length || 0, rows = c?.querySelectorAll('.wn-row').length || 0;
      const heads = [...(c?.querySelectorAll('h3') || [])].map(e => e.textContent);
      const small = [...document.querySelectorAll<HTMLElement>('.wn-cell, .wn-row small, .wn-row strong')].filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).length;
      const over = document.documentElement.scrollWidth > innerWidth + 1, pics = c?.querySelectorAll('.wn-face svg').length || 0;
      const afterHero = document.querySelector('section.hero#discover')?.nextElementSibling?.id, inDiscover = document.querySelector('#calendar')?.parentElement === document.querySelector('section.hero#discover')?.parentElement && (document.querySelector('#calendar') as HTMLElement).getBoundingClientRect().height > 100;
      (document.querySelector('#language-button') as HTMLElement)?.click(); await new Promise(r => setTimeout(r, 200));
      return { en, vi: s?.textContent || '', cells, rows, heads, small, over, pics, afterHero, inDiscover };
    });
    await ctx.close();
    assert.ok(r.cells === 3 && r.rows >= 6 && r.pics >= 3 && r.afterHero === 'whats-new-strip' && r.inDiscover === true, name + ' ' + JSON.stringify(r));
    assert.match(r.en, /Happening now.*New this week.*Coming up/s); assert.match(r.vi, /Đang diễn ra.*Mới tuần này.*Sắp tới/s);
    for (const hd of ['Festivals', 'New lantern chapters', 'New games and stories', 'Festival games']) assert.ok(r.heads.includes(hd), name + ' ' + JSON.stringify(r.heads));
    assert.ok(!r.small && !r.over, name + ' ' + JSON.stringify(r)); assert.deepEqual(errs, [], name);
    out.push(`${name} ${r.rows} rows`);
  }
  return 'strip under the hero (3 parts) and the Calendar part inside Discover, EN and VI: ' + out.join('; ');
}

// chapter4, chapter5, finale: each new lantern chapter played from the start to its festival film, once as an under-5
// and once as a big kid: closed before its day in the release calendar (open on it), lantern lights, the talk (big kids
// only), the game (an under-5's own game; the other one does not count), the story, the three hiding spots (an under-5's
// companion leads), the rope, the festival film, the place lit, the show, the keepsake and the new trick; nothing stands
// on a road or in the water; the step lines are in English and Vietnamese
export async function chapterKitCheck(b, id: 'ch4' | 'ch5' | 'finale' | 'ch6' | 'ch7' | 'ch8' | 'ch9') {
  const S1 = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'finale'];   // (v1.08d s2vn: Season 2's chapters come after the Tết finale)
  const before = { ch4: ['ch1', 'ch2', 'ch3'], ch5: ['ch1', 'ch2', 'ch3', 'ch4'], finale: ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'], ch6: S1, ch7: [...S1, 'ch6'], ch8: [...S1, 'ch6', 'ch7'], ch9: [...S1, 'ch6', 'ch7', 'ch8'] }[id];
  const res = [], sum = [];
  for (const age of ['little', 'big']) {
    const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
    const pg = P.page, w = (ms: number) => pg.waitForTimeout(ms);
    const q = () => pg.evaluate(() => { const c = __sv.currentQuest(__sv.heroes[0].profile); return c && c.id; });
    const calm = () => pg.evaluate(() => { document.querySelectorAll('.storybook,.dialog,.reward').forEach(e => e.remove()); __sv.paused = false; });
    const act = (iid: string) => pg.evaluate(iid => { const it = __sv.interactables.find(i => i.id === iid), h = __sv.heroes[0]; if (!it || (it.visible && !it.visible(h))) return false; it.act(h, __sv); return true; }, iid);
    const tapDialog = (n = 6) => pg.evaluate(async n => { for (let i = 0; i < n; i++) { const d = document.querySelector('.dialog:not(.out)'); if (!d || d.querySelector('.dch')) break; (d as HTMLElement).click(); await new Promise(r => setTimeout(r, 250)); } }, n);
    const emit = (gid: string) => pg.evaluate(async gid => { const E = await import('/js/core/events.js'); E.events.emit('ActivityCompleted', { activityId: 'x', defId: 'game:' + gid, players: [], result: { won: true } }); }, gid);
    const settle = async () => { await w(400); await calm(); await w(1500); await calm(); };
    // every chapter before done; this one's day not come yet: not open; its day today: open
    const gate = await pg.evaluate(async ({ id, age, before }) => {
      const G = __sv, p = G.heroes[0].profile, C = (await import('/js/custom.js')), R = await import('/js/content/releasecal.js'), { CHAPTERS } = await import('/js/content/chapters.js');
      C.setPeeks([], 0); C.CUSTOM.features = { ...(C.CUSTOM.features || {}), story_ch2: true, story_ch3: true };
      for (const c of before.filter(c => c !== 'ch1')) await G.lanterns.loadCh(c);
      p.age = age; p.lanterns = { companion: 'firefly', done: { p_owl: true }, chapters: Object.fromEntries(before.map(c => [c, true])) };
      for (const c of CHAPTERS.filter(c => before.includes(c.id))) for (const s of c.steps) p.lanterns.done[s.id] = true;
      // (the chapters before in the calendar have opened: their day is moved to today)
      const today = R.isoDay(new Date()), prior = Object.fromEntries(before.filter(c => R.inCalendar('chapter:' + c)).map(c => ['chapter:' + c, today]));
      C.CUSTOM.releaseCalendar = { moves: { ...prior, ['chapter:' + id]: R.addDays(today, 3) } }; await G.lanterns.loadCh(id); const closed = G.currentQuest(p);
      C.CUSTOM.releaseCalendar = { moves: { ...prior, ['chapter:' + id]: today } }; G.lanterns.companions.sync(); const open = G.currentQuest(p);
      const ch = CHAPTERS.find(c => c.id === id), words = ch.steps.every(s => s.en && s.vi && (!s.tale || (s.tale[2] && s.tale[3])) && (!s.talk || s.talk.lines.every(l => l[0] && l[1])));
      return { closed: closed && closed.id, open: open && open.id, steps: ch.steps.map(s => ({ id: s.id, big: !!s.big, lights: s.lights || 0, talk: !!s.talk && !s.tale_id, game: s.game || null, little: s.gameLittle || null, tale: s.tale_id || null, find: !!s.find, hang: !!s.hang, visit: s.visit || null })), words };
    }, { id, age, before });
    const seen = [await q()];
    for (const s of gate.steps) {
      if (s.big && age !== 'big') continue;
      const now = await q(); if (now !== 'L_' + s.id) { res.push(`${age}: expected ${s.id}, on ${now}`); break; }
      if (s.lights) { for (let k = 0; k < s.lights; k++) { await act(`story_light_${s.id}_${k}`); await w(250); } await settle(); if (await q() === 'L_' + s.id && s.visit) await pg.evaluate(({ v, sid }) => { const h = __sv.heroes[0]; __sv.lanterns.onRegion(h, v); }, { v: s.visit, sid: s.id }); }
      else if (s.talk) { await act('story_' + s.id); await w(500); await tapDialog(); }
      else if (s.game) { const mine = age === 'big' ? s.game[0] : (s.little || s.game)[0], other = s.game.concat(s.little || []).find(g => g !== mine && !(age === 'big' ? s.game : s.little || s.game).includes(g));
        if (other) { await emit(other); await w(300); if (await q() !== 'L_' + s.id) res.push(`${age}: ${other} counted for ${s.id}`); }
        await emit(mine); if (s.visit) await pg.evaluate(v => __sv.lanterns.onRegion(__sv.heroes[0], v), s.visit); }
      else if (s.tale) { await act('story_' + s.id); await w(600); await calm(); await pg.evaluate(() => (document.querySelector('.th-x') as HTMLElement)?.click()); await pg.evaluate(sid => __sv.lanterns._finish(__sv.heroes[0], sid), s.id); }
      else if (s.find) {
        await pg.evaluate(id => { const M = __sv.lanterns.mods[id]; __sv.heroes[0].place(M.front[0], M.front[1] + 1); }, id); await w(2000); await calm();
        const lead = await pg.evaluate(() => { const c = __sv.lanterns.companions.of(__sv.heroes[0]); return c && c.lead ? !!c.lead.high : false; });
        if (age !== 'big' && !lead) res.push('little: the companion did not lead to the lantern');
        await act(`story_${id}_clue1`); await w(250); const wrong = await pg.evaluate(id => !!(__sv.heroes[0].profile.lanterns.act || {})['clue_' + id], id);
        if (wrong) res.push('the wrong spot found the lantern');
        await act(`story_${id}_clue0`); await w(300); await act('story_' + s.id); }
      else if (s.hang) {
        pg.evaluate(sid => { const it = __sv.interactables.find(i => i.id === 'story_' + sid); it.act(__sv.heroes[0]); }, s.id); await w(1500);
        await pg.evaluate(() => { const el = document.querySelector('.handpad [data-hp=rope]'); if (!el) return; const r = el.getBoundingClientRect(), ev = (t, y) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 9, clientX: r.left + 20, clientY: r.top + r.height * y })); ev('pointerdown', 0); ev('pointermove', 1); ev('pointerup', 1); });
        let film = false; for (let i = 0; i < 30 && !film; i++) { await w(300); film = await pg.evaluate(() => !!document.querySelector('.theatre.film canvas.th-film')); }
        if (!film) res.push(`${age}: no festival film`);
        await pg.evaluate(() => (document.querySelector('.th-x') as HTMLElement)?.click()); await w(1200);
        await pg.evaluate(() => document.querySelectorAll<HTMLElement>('.reward').forEach(e => e.click())); await w(800); await tapDialog(); await w(400); await calm(); await w(1000); }
      await settle(); seen.push(await q());
    }
    const end = await pg.evaluate(id => { const G = __sv, p = G.heroes[0].profile, M = G.lanterns.mods[id];
      return { done: !!p.lanterns.chapters[id], keep: (p.keepsakes || []).includes('lantern_' + id), tricks: p.lanterns.tricks || [], lit: M.lit(), show: M.showOn() }; }, id);
    const placed = await pg.evaluate(async id => { const W = await import('/js/world.js'), M = __sv.lanterns.mods[id], bad = [];
      for (const [n, x, z] of [['front', M.front[0], M.front[1]], ...M.clues.map(c => ['clue' + c.k, c.x, c.z]), ...M.people.map(c => [c.id, c.x, c.z])] as [string, number, number][]) {
        const d = W.roadDist(x, z); if (d.road && d.d < d.road.w / 2) bad.push(n + ' on a road'); if (W.heightAt(x, z) < W.WATER + .3) bad.push(n + ' in the water'); }
      return bad; }, id);
    const errs = P.errors.filter(e => !/film|WebGL/i.test(e)); await P.ctx.close();
    assert.ok(gate.words, 'every step in English and Vietnamese');
    assert.ok(!(gate.closed || '').includes(id === 'finale' ? 'cf_' : 'c' + id.slice(2) + '_') && /^L_c/.test(gate.open || ''), `${age}: closed before its day, open on it ${JSON.stringify(gate)}`);
    assert.deepEqual(res, [], `${age}: ${JSON.stringify(seen)}`);
    assert.ok(end.done && end.keep && end.lit && end.tricks.length >= 1, `${age} ${JSON.stringify(end)}`);
    assert.deepEqual(placed, []); assert.deepEqual(errs, [], age);
    res.length = 0; sum.push(`${age} ${seen.filter(Boolean).length - 1} steps`);
  }
  return `${sum.join(', ')}; ${id}: closed before its calendar day, open on it; played to the film, the place lit, the keepsake and the trick, as an under-5 and as a big kid; nothing on a road or in the water`;
}

// talecostume: inside the folk-tale films only the tale's people appear, in period dress: no modern T-shirt, hoodie,
// overalls or cap, and none of the four friends, the child or the companion (they are only the storytellers before and
// after a tale, in their own clothes). Static: reads every tale film's source.
export async function taleCostumeCheck() {
  const fs = await import('node:fs'), R = (p: string) => fs.readFileSync(new globalThis.URL('../' + p, import.meta.url), 'utf8');
  const taleIds = new Set<string>();
  for (const m of R('js/learn.ts').matchAll(/\{\s*id:\s*'([\w-]+)',\s*flag:/g)) taleIds.add(m[1]);
  for (const f of ['js/talesdata.ts', 'js/tales-content.ts']) for (const m of R(f).matchAll(/tale\('([\w-]+)'/g)) taleIds.add(m[1]);
  const blocks: [string, string][] = [];
  for (const f of fs.readdirSync(new globalThis.URL('../js/content/films/', import.meta.url))) { const id = f.replace(/\.ts$/, ''); if (f.endsWith('.ts') && id !== 'kit' && taleIds.has(id)) blocks.push([id, R('js/content/films/' + f)]); }
  // the tale films written inside js/content/films.ts: from "<id>: { pages: [" or "FILMS.<id> = {" to the next film
  const big = R('js/content/films.ts'), starts = [...big.matchAll(/^(?:\s{2}([\w]+): \{ pages: \[|FILMS\.([\w]+) = \{ pages: \[)/gm)].map(m => ({ id: m[1] || m[2], at: m.index! }));
  // (a block ends where its pages close: the helpers written between two films are not part of either)
  starts.forEach((s, k) => { if (!taleIds.has(s.id)) return; const rest = big.slice(s.at, k + 1 < starts.length ? starts[k + 1].at : big.length), end = /^\s*\]\s*\}[;,]?\s*$/m.exec(rest); blocks.push([s.id, end ? rest.slice(0, end.index) : rest]); });
  // (a film file's own looks are defined above its pages, so the whole file counts)
  const bad: string[] = [];
  const MODERN = /style:\s*'(shirt|hoodie|overalls)'|VILLAGER\('(shirt|hoodie|overalls)'|KID\('(shirt|hoodie|overalls)'|ELDER\('(shirt|hoodie|overalls)'|hat:\s*'cap'/g, FRIEND = /\b(kidOf|buildCompanion|S\.ctx\.look|CHI|TEO|JACK|RUBY)\b/g;
  for (const [id, src] of blocks) {
    for (const m of src.matchAll(MODERN)) bad.push(`${id}: modern clothes (${m[0]})`);
    for (const m of src.matchAll(FRIEND)) bad.push(`${id}: a friend, the child or the companion inside the tale (${m[0]})`);
    if (/LOOK\(\{(?![^}]*style:)/.test(src)) bad.push(`${id}: a look with no clothes chosen (LOOK's default is a T-shirt)`);
  }
  assert.ok(blocks.length >= 35, `only ${blocks.length} tale films found`);
  assert.deepEqual(bad, []);
  return `${blocks.length} tale films: period dress only (tunics, áo dài, nón lá, khăn, crowns, akubra), no T-shirts, hoodies, overalls or caps, and no friend, child or companion inside a tale`;
}
