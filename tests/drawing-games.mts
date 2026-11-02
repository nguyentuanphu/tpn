// (r89) the ten drawing games (js/games/drawing.ts, brief docs/cores/tasks/drawing-games-r89.md): auto play finishes every
// one on a phone, as a child would, with no problem noted (no button covered or off the screen, no game it could not
// work out); then each game opens on a phone (little ones), a tablet (in Vietnamese) and a computer with every button
// big enough (44 px, 64 px for under-5s) and no page error. Screenshots in docs/owner-repair-20261014/evidence/r89-drawing.
import fs from 'node:fs';
import type { Browser } from 'playwright';
import { open, clear } from './harness.mts';

export const IDS = ['dotdot', 'trace', 'mirror', 'colournum', 'lanternart', 'card', 'sand', 'drawpath', 'shapedraw', 'copygrid'];
type Row = { key: string; ok: boolean; said?: string; problems?: string[] };

export async function drawingGamesCheck(browser: Browser): Promise<string> {
  const dir = '../docs/owner-repair-20261014/evidence/r89-drawing'; fs.mkdirSync(dir, { recursive: true });
  const live = { releases: { autoplay: { on: true, devices: ['drawprobe001'] } }, festivals: {} };
  const pre = `localStorage.setItem('sv2_playerid','drawprobe001');localStorage.setItem('sv2_live',${JSON.stringify(JSON.stringify(live))});`;
  // 1. auto play finishes all ten on a phone
  const P = await open(browser, { w: 390, h: 844, touch: true, settings: { voice: false, autoPack: false }, pre, route: async ctx => { await ctx.route('**/api/live**', r => r.fulfill({ json: live })); } });
  let rows: Row[] = [];
  try {
    await P.page.waitForFunction(() => !!window.__sv.autoplay);
    await P.page.evaluate(ids => { const G = window.__sv; G.heroes[0].profile.age = 'big'; G.gameSpot = () => null; const api = G.autoplay; if (!api || typeof api.start !== 'function') throw Error('autoplay unavailable'); api.start(ids.map(id => 'game:' + id), 'x5'); }, IDS);
    await P.page.waitForFunction(n => { const api = window.__sv.autoplay; if (!api || typeof api.running !== 'function') throw Error('autoplay unavailable'); return !api.running() && JSON.parse(localStorage.getItem('sv2_autoplay_report') || '{}').done?.length === n; }, IDS.length, { timeout: 1500000 });
    rows = await P.page.evaluate(() => JSON.parse(localStorage.getItem('sv2_autoplay_report') || '{}').done || []);
    if (P.errors.length) throw Error('page errors while playing: ' + P.errors.slice(0, 3).join(' | '));
  } finally { await P.ctx.close(); }
  const bad = IDS.filter(id => { const r = rows.find(x => x.key === 'game:' + id); return !r || !r.ok || !/^(won|thắng):/.test(r.said || ''); });
  if (bad.length) throw Error('auto play did not finish: ' + bad.map(id => JSON.stringify(rows.find(x => x.key === 'game:' + id) || id)).join(' '));
  // 2. every game opens on each device with buttons big enough, and no page error
  const small: string[] = [];
  for (const [name, w, h, touch, lang, age] of [['phone-little', 390, 844, true, 'en', 'little'], ['tablet', 820, 1180, true, 'vi', 'big'], ['computer', 1280, 800, false, 'en', 'big']] as const) {
    const Q = await open(browser, { w, h, touch, lang, settings: { voice: false, autoPack: false } });
    try {
      await clear(Q.page);
      for (const id of IDS) {
        await Q.page.evaluate(({ id, age }) => { const G = window.__sv; G.heroes[0].profile.age = age; void G.playGame(0, id, 'hub'); }, { id, age });
        await Q.page.waitForSelector('.gl .gl-stage button, .gl .gl-stage canvas', { timeout: 30000 }); await Q.page.waitForTimeout(900);
        const need = age === 'little' ? 64 : 44;
        const tiny = await Q.page.evaluate(need => [...document.querySelectorAll<HTMLButtonElement>('.gl .gl-stage button')].filter(b => { const r = b.getBoundingClientRect(); return !b.disabled && r.width > 0 && !b.closest('.dg-grid.small') && (r.width < need - .5 || r.height < need - .5); }).map(b => `${b.className || b.tagName} ${Math.round(b.getBoundingClientRect().width)}x${Math.round(b.getBoundingClientRect().height)}`), need);
        if (tiny.length) small.push(`${name} ${id}: ${tiny.slice(0, 3).join(', ')}`);
        await Q.page.screenshot({ path: `${dir}/${name}-${lang}-${id}.png` });
        await Q.page.click('.gl .gl-x'); await Q.page.waitForSelector('.gl', { state: 'detached', timeout: 10000 }).catch(() => { });
        await clear(Q.page);
      }
      if (Q.errors.length) throw Error(`${name}: page errors: ` + Q.errors.slice(0, 3).join(' | '));
    } finally { await Q.ctx.close(); }
  }
  if (small.length) throw Error('buttons too small: ' + small.join('; '));
  return `${IDS.length} drawing games: auto play finished each on a phone (${rows.filter(r => IDS.includes(r.key.slice(5))).map(r => r.key.slice(5) + ' ' + (r.said || '').split(':')[0]).join(', ')}); each opens on a phone for little ones (64 px), a tablet in Vietnamese and a computer (44 px), no page errors`;
}
