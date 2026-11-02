// Independent mobile browser sessions using the same real game autoplay as a child's device.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { launch, open, clear } from './harness.mts';

const count = Number(process.env.COUNT), duration = Number(process.env.DURATION);
const profile = process.env.PROFILE;
assert.ok(Number.isInteger(count) && count >= 1 && count <= 10);
assert.ok(Number.isInteger(duration) && duration >= 1 && duration <= 30);
assert.ok(['chaos-toddler', 'gentle-explorer', 'max-competence'].includes(profile || ''));
const browser = await launch(), results: Record<string, unknown>[] = [];
const output = path.join('out', 'child-bots');
fs.mkdirSync(output, { recursive: true });
try {
  for (let i = 0; i < count; i++) {
    const lang = i % 2 ? 'vi' : 'en';
    const id = `botprobe${String(i).padStart(4, '0')}`;
    const live = { releases: { autoplay: { on: true, devices: [id] } }, festivals: {} };
    const record: Record<string, unknown> = { bot: i + 1, lang, profile, duration, started: new Date().toISOString() };
    let session: Awaited<ReturnType<typeof open>> | undefined;
    try {
      session = await open(browser, { w: 390, h: 844, touch: true, lang,
        pre: `localStorage.setItem('sv2_playerid',${JSON.stringify(id)});localStorage.setItem('sv2_live',${JSON.stringify(JSON.stringify(live))});`,
        route: async ctx => { await ctx.route('**/api/live**', r => r.fulfill({ json: live })); await ctx.route('**/api/tester**', r => r.fulfill({ json: { ok: true, mine: [], open: [] } })); } });
      await clear(session.page);
      await session.page.waitForFunction(() => !!window.__sv?.autoplay);
      const groups = profile === 'chaos-toddler' ? ['things', 'games', 'places'] : profile === 'gentle-explorer' ? ['places', 'people', 'stories'] : ['quests', 'games', 'shop'];
      const speed = profile === 'gentle-explorer' ? 'watch' : 'x5';
      record.groups = groups;
      await session.page.evaluate(({ groups, speed }) => {
        window.__sv.autoplay.open();
        const first = document.querySelector<HTMLInputElement>('.apbox [data-g]');
        if (!first) throw new Error('Autoplay group controls did not mount');
        document.querySelectorAll<HTMLInputElement>('.apbox [data-g]').forEach(input => { input.checked = groups.includes(input.dataset.g || ''); });
        first.dispatchEvent(new Event('change', { bubbles: true }));
        window.__sv.autoplay.start(undefined, speed);
      }, { groups, speed });
      await session.page.waitForTimeout(duration * 60000);
      await session.page.evaluate(() => window.__sv.autoplay.stop());
      await session.page.waitForFunction(() => !window.__sv.autoplay.running(), null, { timeout: 20000 });
      record.report = await session.page.evaluate(() => JSON.parse(localStorage.getItem('sv2_autoplay_report') || '{}'));
      record.errors = session.errors;
      record.ok = session.errors.length === 0 && !!(await session.page.evaluate(() => window.__sv?.heroes?.length)) && Array.isArray((record.report as { done?: unknown[] })?.done);
    } catch (e) { record.ok = false; record.error = String(e); }
    finally { record.finished = new Date().toISOString(); if (session) await session.ctx.close(); results.push(record); fs.writeFileSync(path.join(output, `bot-${i + 1}.json`), JSON.stringify(record, null, 2)); }
  }
} finally { await browser.close(); }
console.log(JSON.stringify(results.map(({ bot, ok, errors }) => ({ bot, ok, errors }))));
if (results.some(r => !r.ok)) process.exitCode = 1;
