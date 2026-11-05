// (v1.08b story) checks for the release calendar, the pad's calendar tab and the install gift
// (docs/cores/tasks/v108b/story-brief.md). Run through tests/run.mts or tests/suite.mts.
import assert from 'node:assert/strict';
import { open, clear } from './harness.mts';

const SCREENS = [['phone', 390, 844, true], ['phone sideways', 844, 390, true], ['tablet', 820, 1180, true], ['tablet sideways', 1180, 820, true], ['computer', 1440, 900, false]] as const;

// releasecalendar: every held-back game and story has a week, the owner's moves win, an item opens on its day (a tester
// 7 days early), a held game whose day has come is open for a child who never played, and the Coming soon tile tells
// what opens next week
export async function releaseCalendarCheck(b) {
  const R = await import('../js/content/releasecal.ts'), S = await import('../js/content/secondset.ts');
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

// calendartab: the pad's tab "Calendar: festivals and what's new": a timeline per festival (start, end, days left, 44 px
// steps), then This week's new things, Opens next week and Ending soon; fits phone, tablet and computer with 16 px text
export async function calendarTabCheck(b) {
  const out = [];
  for (const [name, w, h, touch] of SCREENS) {
    const P = await open(b, { w, h, touch }); await clear(P.page);
    const r = await P.page.evaluate(async () => {
      __sv.openPad(0, 'cal'); await new Promise(r => setTimeout(r, 600));
      const pad = document.querySelector('.pad') || document; const q = (s: string) => [...pad.querySelectorAll<HTMLElement>(s)];
      const steps = q('.fcal-step'), heads = q('.fcal h3').map(e => e.textContent || '');
      const small = [...q('.fcal-step b, .fcal-step small, .fcal-step em, .fcal-new b, .fcal-new small')].filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).length;
      const tiny = steps.concat(q('.fcal-new')).filter(e => { const b = e.getBoundingClientRect(); return b.height < 44 || b.width < 44; }).length;
      const over = document.documentElement.scrollWidth > innerWidth + 1;
      const tabLabel = document.querySelector('.pad [data-tab="cal"]')?.textContent || '';
      return { steps: steps.length, rows: q('.fcal-row').length, withDays: steps.filter(s => /day|ngày/.test(s.textContent || '')).length, heads, small, tiny, over, tabLabel, title: q('.fcal-title').map(e => e.textContent).join() };
    });
    const errs = P.errors; await P.ctx.close();
    assert.ok(r.rows > 0 && r.steps >= r.rows * 2 && r.withDays === r.steps, name + ' ' + JSON.stringify(r));
    for (const hd of ["This week's new things", 'Opens next week', 'Ending soon']) assert.ok(r.heads.includes(hd), name + ' missing ' + hd + ' ' + JSON.stringify(r.heads));
    assert.match(r.title, /Calendar: festivals and what's new/);
    assert.ok(!r.small && !r.tiny && !r.over, name + ' ' + JSON.stringify(r));
    assert.deepEqual(errs, [], name);
    out.push(`${name} ${r.rows} festivals, ${r.steps} steps`);
  }
  // a step that is on takes the child there: Halloween moved to today in Studio (its festival date)
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const fly = await P.page.evaluate(async () => {
    const C = (await import('/js/custom.js')).CUSTOM, ymd = (await import('/js/content/festival-visibility.js')).sydneyFestivalDate();
    C.festivals = { ...(C.festivals || {}), halloween: { date: ymd } }; __sv.festivals.rebuild(); await new Promise(r => setTimeout(r, 2000));
    document.querySelectorAll('.dialog, .reward, .modal').forEach(e => e.remove()); __sv.paused = false;
    let went = null; const was = __sv.travel; __sv.travel = async (h, x, z) => { went = { x, z }; };
    __sv.openPad(0, 'cal'); await new Promise(r => setTimeout(r, 500));
    const step = document.querySelector<HTMLElement>('.pad .fcal-step.on[data-fly="halloween"]') || document.querySelector<HTMLElement>('.fcal-step.on[data-fly="halloween"]');
    const any = !!step; step?.click(); await new Promise(r => setTimeout(r, 300)); __sv.travel = was;
    const padOpen = !!document.querySelector('.pad'); document.querySelectorAll('.modal').forEach(e => e.remove()); __sv.paused = false;
    return { any, went, padOpen };
  });
  const errs = P.errors; await P.ctx.close();
  assert.ok(fly.any && fly.went && !fly.padOpen, 'tap a step to fly there ' + JSON.stringify(fly)); assert.deepEqual(errs, []);
  return out.join('; ') + '; a step that is on takes the child to the festival';
}

// installgift: the first time the game runs installed, each child gets the Home hat, 100 coins and a sticker, once; the
// Grown-ups install chip says there is a gift; nothing is given in a browser tab
export async function installGiftCheck(b) {
  const standalone = () => { const mm = window.matchMedia.bind(window); window.matchMedia = (q: string) => /display-mode: standalone/.test(q) ? ({ matches: true, media: q, addEventListener() { }, removeEventListener() { }, addListener() { }, removeListener() { }, onchange: null, dispatchEvent: () => false } as any) : mm(q); };
  const P = await open(b, { w: 390, h: 844, touch: true, pre: standalone }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const w = (t: number) => new Promise(r => setTimeout(r, t)), G = __sv, h = G.heroes[0], p = h.profile;
    for (let k = 0; k < 40 && !G.installGift; k++) await w(100);
    const first = !!p.installGift; delete p.installGift; p.owned.hats = (p.owned.hats || []).filter(x => x !== 'homehat'); // (it may have come while the game opened)
    const F = await import('/js/state.js').catch(() => null), coins0 = (F && F.farm ? F.farm.coins : null), st0 = (p.stickers || []).length;
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
    const w = (t: number) => new Promise(r => setTimeout(r, t)); for (let k = 0; k < 40 && !__sv.installGift; k++) await w(100);
    __sv.installGift.poll(); await w(5200); __sv.installGift.poll(); await w(300);
    const given = !!__sv.heroes[0].profile.installGift;
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
