// Check `testertryagain` (v1.08f settings item 6, owner 6 Nov 2026 AEDT: "when I tap Try again, it only moves me to the
// place I reported, it does not take me to the action, the spot or the thing that was broken"). Five fixed reports in the
// ladybird's list, each tried again on a phone:
//   1. a game report opens that game at the report's level (3), not the child's own;
//   2. a screen report (the Pad's Backpack tab) opens that screen on that tab;
//   3. a quest step report walks to the quest's goal and points it out with the target ring;
//   4. a thing report (a cooking pot) lands beside it, faces it and rings it;
//   5. a place-only report goes to the place and says "Action unknown, you are at the reported place".
// Also: a new report made in the valley by a thing saves its id, and one made in the Pad saves the screen and tab.
import { open, clear } from './harness.mts';
import { testerPre, testerSite, ACCEPTED } from './checks/shared.mts';

const ok = (c: unknown, msg: string) => { if (!c) throw new Error(msg); };
type Row = { k: string; title: string; status: string; fixedIn: string; kind: string; where: Record<string, unknown> };

export async function testerTryAgainCheck(b) {
  const bad: string[] = [], mine: Row[] = []; let posts: any[] = [];
  const P = await open(b, { w: 390, h: 844, touch: true, pre: testerPre({ on: true, devices: ['tester000001'] }, ACCEPTED), route: async ctx => { posts = await testerSite(ctx, () => ({ mine, open: [], retest: [], helped: 0, reports: 0 })); } });
  await clear(P.page);
  await P.page.waitForFunction(() => (window as any).__sv.tester, null, { timeout: 15000 });
  const G = () => (window as any).__sv;
  // what the page knows: the quest step and a pot away from the child
  const info = await P.page.evaluate(() => {
    const S = (window as any).__sv, h = S.heroes[0], q = S.currentQuest(h.profile), tg = S.questTarget(h);
    const pot = S.interactables.filter(x => /^pot\d/.test(x.id)).sort((a, b) => ((b.x - h.pos.x) ** 2 + (b.z - h.pos.z) ** 2) - ((a.x - h.pos.x) ** 2 + (a.z - h.pos.z) ** 2))[0];
    return { quest: q && q.id, tg: tg && { x: tg.x, z: tg.z }, pot: pot && { id: pot.id, x: pot.x, z: pot.z }, at: { x: Math.round(h.pos.x), z: Math.round(h.pos.z) } };
  });
  ok(info.quest && info.tg && info.pot, 'no quest or pot to test with: ' + JSON.stringify(info));
  const row = (k: string, title: string, where: Record<string, unknown>) => mine.push({ k: k.repeat(16), title, status: 'fixed', fixedIn: 'v1.07', kind: 'broken', where });
  row('a', 'Counting at level 3', { area: 'valley', game: 'counting', lvl: 3, diff: 'easy', mode: 'hub', np: 1, x: 0, z: 0 });
  row('b', 'The backpack page', { area: 'valley', screen: 'pad:bag', x: info.at.x, z: info.at.z });
  row('c', 'The quest step', { area: 'valley', quest: info.quest, x: Math.round(info.tg.x) + 30, z: Math.round(info.tg.z) });
  row('d', 'The cooking pot', { area: 'valley', thing: info.pot.id, x: Math.round(info.pot.x), z: Math.round(info.pot.z) });
  const spot = { x: Math.round(info.pot.x) + 6, z: Math.round(info.pot.z) + 6 };
  row('e', 'Somewhere here', { area: 'valley', x: spot.x, z: spot.z });
  await P.page.evaluate(async () => { await (await import(String('/js/tester.js'))).refresh(); });
  const tap = async (k: string) => {
    await clear(P.page);
    await P.page.evaluate(async () => { await (await import(String('/js/tester.js'))).openPanel(0, 'fixed'); });
    await P.page.waitForSelector(`.testing-fixed [data-again="${k.repeat(16)}"]`, { timeout: 10000 }).catch(() => { });
    const has = await P.page.$(`.testing-fixed [data-again="${k.repeat(16)}"]`); if (!has) { bad.push(`no Try again for report ${k}`); return false; }
    await has.click(); return true;
  };
  const ring = () => P.page.evaluate(() => { const r = (window as any).__sv.scene.getObjectByName('tester-target-ring'); return r ? { x: r.position.x, z: r.position.z } : null; });
  // 1. the game at its level
  if (await tap('a')) {
    const g = await P.page.waitForFunction(() => { const l = document.querySelector<HTMLElement>('.gl[data-game-id="counting"]'); return l && l.dataset.level ? l.dataset.level : null; }, null, { timeout: 15000 }).then(x => x.jsonValue()).catch(() => null);
    if (g !== '3') bad.push('game report: Counting did not open at level 3 (' + g + ')');
    await P.page.evaluate(() => { document.querySelector<HTMLElement>('.gl .gl-x')?.click(); }); await P.page.waitForTimeout(800);
  }
  // 2. the screen and its tab
  if (await tap('b')) {
    const t = await P.page.waitForFunction(() => document.querySelector<HTMLElement>('.modal.pad .pad-tabs button.on')?.dataset.t || null, null, { timeout: 8000 }).then(x => x.jsonValue()).catch(() => null);
    if (t !== 'bag') bad.push('screen report: the Pad did not open on the Backpack (' + t + ')');
  }
  // 3. the quest step: walked or flown to its goal, the goal ringed
  if (await tap('c')) {
    const got = await P.page.waitForFunction((tg) => { const S = (window as any).__sv, h = S.heroes[0], r = S.scene.getObjectByName('tester-target-ring'); return r && Math.hypot(h.pos.x - tg.x, h.pos.z - tg.z) < 14 ? true : null; }, info.tg, { timeout: 30000 }).catch(() => null);
    if (!got) bad.push('quest report: not taken to the quest goal with the ring: ' + JSON.stringify({ ring: await ring(), hero: await P.page.evaluate(() => { const h = (window as any).__sv.heroes[0]; return { x: h.pos.x, z: h.pos.z }; }), tg: info.tg }));
  }
  // 4. the thing: beside it, facing it, ringed
  if (await tap('d')) {
    const r = await P.page.waitForFunction((pot) => { const S = (window as any).__sv, h = S.heroes[0], rg = S.scene.getObjectByName('tester-target-ring'); if (!rg || Math.hypot(rg.position.x - pot.x, rg.position.z - pot.z) > .5) return null; const d = Math.hypot(h.pos.x - pot.x, h.pos.z - pot.z), want = Math.atan2(pot.x - h.pos.x, pot.z - h.pos.z), off = Math.abs(Math.atan2(Math.sin(h.yaw - want), Math.cos(h.yaw - want))); return { d, off }; }, info.pot, { timeout: 30000 }).then(x => x.jsonValue()).catch(() => null) as { d: number, off: number } | null;
    if (!r || r.d > 7 || r.off > .5) bad.push('thing report: not beside the pot, facing it, with the ring: ' + JSON.stringify(r));
  }
  // 5. a place only: there, with the note
  if (await tap('e')) {
    const r = await P.page.waitForFunction((at) => { const h = (window as any).__sv.heroes[0], n = [...document.querySelectorAll('.testertoast')].map(x => x.textContent).join(' '); return Math.hypot(h.pos.x - at.x, h.pos.z - at.z) < 8 && /Action unknown|Không rõ hành động/.test(n) ? n : null; }, spot, { timeout: 30000 }).then(x => x.jsonValue()).catch(() => null);
    if (!r) bad.push('place report: not at the place with the "Action unknown" note');
  }
  // new reports keep enough: by the pot (thing) and in the Pad (screen and tab)
  await clear(P.page);
  await P.page.evaluate(async (pot) => {
    const S = (window as any).__sv, T = await import(String('/js/tester.js')), h = S.heroes[0];
    S.paused = false; await S.landBy(h, pot.x, pot.z); await new Promise(r => setTimeout(r, 300));
    await T.quickReport('check-thing');
    S.paused = false; S.openPad(0, 'bag'); await new Promise(r => setTimeout(r, 600));
    await T.quickReport('check-screen');
  }, info.pot);
  const sent = async (d: string) => { for (let i = 0; i < 40; i++) { const r = posts.filter(x => x && x.detail === d).pop(); if (r) return r.where; await P.page.waitForTimeout(250); if (i === 8) await P.page.evaluate(async () => { const T = await import(String('/js/tester.js')) as any; T.retryReports && await T.retryReports(); }); } return null; };
  const saved = { thing: await sent('check-thing'), screen: await sent('check-screen') };
  const th = saved.thing as Record<string, unknown> | null, sc = saved.screen as Record<string, unknown> | null;
  if (!th || th.thing !== info.pot.id) bad.push('a new report by the pot did not save it: ' + JSON.stringify(th));
  if (!sc || sc.screen !== 'pad:bag') bad.push('a new report in the Pad did not save the screen and tab: ' + JSON.stringify(sc));
  if (P.errors.length) bad.push(...P.errors.slice(0, 3));
  await P.ctx.close();
  ok(!bad.length, bad.join(' · '));
  return 'Try again: a game opens at the report\'s level, a screen on its tab, a quest step walks to its goal with the ring, a thing is faced and ringed, a place-only report says Action unknown; new reports save the thing and the screen';
}
