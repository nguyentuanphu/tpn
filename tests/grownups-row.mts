// Check `grownupsrow` (v1.08f settings, owner 6 Nov 2026 AEDT: "Two players and fit to screen settings to make it one
// line", "AUD and VND should be in one line; once I click on the current it jumps to the top of page", "Captions is
// default off", "Hide the offer for AI chat", "Remove the TURN server connection"):
//   1. on a phone (390 px) in English and Vietnamese, Two players, Fit the screen and Money each sit on one row: the three
//      buttons share a top, none is under 44 px tall, none spills its words, the row stays inside the panel;
//   2. tapping the choice that is already on (and another one) keeps Grown-ups where it was scrolled;
//   3. captions are off on a fresh start: the box is unticked and a spoken line shows no caption;
//   4. no AI chat offer (no Claude key field, no "Anthropic"), and the AI is not used even with an old key saved;
//   5. the TURN relay still works (its servers are in the connection set-up) but Grown-ups shows no relay text or field
//      (owner, corrected: "the turn function stays but the wording and the link there to hide").
// Pictures of Grown-ups on a phone, a tablet and a computer go to out/grownupsrow/.
import fs from 'fs';
import { open, clear } from './harness.mts';

const ok = (c: unknown, msg: string) => { if (!c) throw new Error(msg); };
const SEGS = ['.seg.tview', '.seg.sfit', '.seg.cur'];

async function openPanel(P) {
  await P.page.evaluate(async () => { await (await import(String('/js/ui.js'))).openGrownups(() => { }); });
  await P.page.waitForSelector('.modal.grownups .grownups-body');
  await P.page.evaluate(() => document.querySelectorAll<HTMLDetailsElement>('.modal.grownups details').forEach(d => { d.open = true; }));
  await P.page.waitForTimeout(300);
}
const rows = P => P.page.evaluate((sels: string[]) => sels.map(sel => {
  const seg = document.querySelector<HTMLElement>('.modal.grownups ' + sel); if (!seg) return { sel, missing: true };
  const panel = document.querySelector('.modal.grownups .grownups-body').getBoundingClientRect(), r = seg.getBoundingClientRect();
  const bs = [...seg.querySelectorAll<HTMLElement>('button')].map(b => { const q = b.getBoundingClientRect(); return { t: Math.round(q.top), h: Math.round(q.height), spill: b.scrollWidth > b.clientWidth + 1, txt: b.textContent.trim() }; });
  return { sel, n: bs.length, oneRow: bs.length === 3 && bs.every(x => Math.abs(x.t - bs[0].t) <= 2), minH: Math.min(...bs.map(x => x.h)), spill: bs.filter(x => x.spill).map(x => x.txt), inside: r.left >= panel.left - 1 && r.right <= panel.right + 1 };
}), SEGS);

export async function grownupsRowCheck(b) {
  const bad: string[] = [], notes: string[] = [];
  for (const lang of ['en', 'vi']) {
    const P = await open(b, { w: 390, h: 844, touch: true, lang }); await clear(P.page);
    if (lang === 'en') {
      // 3. captions off on a fresh start
      const cap = await P.page.evaluate(async () => { const V = await import(String('/js/voice.js')); V.spoken.forEach(f => f('A surprise gift is waiting in the valley.')); await new Promise(r => setTimeout(r, 600)); return { setting: (window as any).__sv.settings.captions, shown: !!document.querySelector('.caption.show') }; });
      if (cap.setting === true || cap.shown) bad.push('captions are on at a fresh start: ' + JSON.stringify(cap));
      // 4. the AI is not used even with an old key and the old switch on; 5. the relay is still used
      const net = await P.page.evaluate(async () => {
        const S = (window as any).__sv.settings, was = [S.aiOn, S.aiKey]; S.aiOn = true; S.aiKey = 'sk-ant-test';
        const C = await import(String('/js/chat-player.js')), ai = C.aiReady(); S.aiOn = was[0]; S.aiKey = was[1];
        const N = await import(String('/js/net.js')), ice = await N.iceServers();
        return { ai, turn: JSON.stringify(ice).match(/turns?:/g) || [], n: ice.length };
      });
      if (net.ai) bad.push('villager chat still uses the AI with a key saved');
      if (!net.turn.length) bad.push('the TURN relay is no longer in the connection set-up: ' + JSON.stringify(net));
    }
    await openPanel(P);
    const gr = await P.page.evaluate(() => { const c = document.querySelector('.modal.grownups'); return { cap: (c.querySelector('#gCap') as HTMLInputElement)?.checked, ai: !!c.querySelector('#xAi, #xAiKey') || /Anthropic|Claude/.test(c.textContent), turn: !!c.querySelector('#gTurn, #gTurnUser, #gTurnPass') || /TURN/.test(c.textContent) }; });
    if (gr.cap) bad.push(lang + ': the captions box is ticked on a fresh start');
    if (gr.ai) bad.push(lang + ': Grown-ups still offers the AI chat');
    if (gr.turn) bad.push(lang + ': Grown-ups still shows the TURN relay text or field');
    // 1. one row each
    for (const r of await rows(P) as any[]) {
      if (r.missing) { bad.push(`${lang}: ${r.sel} not found`); continue; }
      if (!r.oneRow) bad.push(`${lang}: ${r.sel} is not on one row`);
      if (r.minH < 44) bad.push(`${lang}: ${r.sel} has a button ${r.minH} px tall`);
      if (r.spill.length) bad.push(`${lang}: ${r.sel} words spill out: ${r.spill.join(', ')}`);
      if (!r.inside) bad.push(`${lang}: ${r.sel} runs outside the panel`);
    }
    // 2. the scroll stays where it was: the current choice, then another one, then back
    for (const [sel, pick] of [['.seg.cur', 'button.on'], ['.seg.cur', 'button[data-c="AUD"]'], ['.seg.cur', 'button[data-c="auto"]'], ['.seg.tview', 'button.on']]) {
      const where = () => P.page.evaluate(sel => { const body = document.querySelector<HTMLElement>('.modal.grownups .grownups-body'), seg = document.querySelector<HTMLElement>('.modal.grownups ' + sel); return Math.round(seg.getBoundingClientRect().top - body.getBoundingClientRect().top); }, sel);
      await P.page.evaluate(sel => { const body = document.querySelector<HTMLElement>('.modal.grownups .grownups-body'), seg = document.querySelector<HTMLElement>('.modal.grownups ' + sel); body.scrollTop += seg.getBoundingClientRect().top - body.getBoundingClientRect().top - 200; }, sel);
      const before = await where();
      await P.page.locator(`.modal.grownups ${sel} ${pick}`).first().click(); await P.page.waitForTimeout(1800);
      const after = await where();
      if (Math.abs(after - before) > 3) bad.push(`${lang}: tapping ${sel} ${pick} moved it on screen from ${before} to ${after} px`);
    }
    if (lang === 'en') notes.push('scroll kept on 4 taps');
    fs.mkdirSync('out/grownupsrow', { recursive: true });
    await P.page.evaluate(() => { const body = document.querySelector<HTMLElement>('.modal.grownups .grownups-body'), seg = document.querySelector<HTMLElement>('.modal.grownups .seg.tview'); body.scrollTop += seg.getBoundingClientRect().top - body.getBoundingClientRect().top - 60; });
    await P.page.screenshot({ path: `out/grownupsrow/phone-${lang}-screen.png` });
    await P.page.evaluate(() => { const body = document.querySelector<HTMLElement>('.modal.grownups .grownups-body'), seg = document.querySelector<HTMLElement>('.modal.grownups .seg.cur'); body.scrollTop += seg.getBoundingClientRect().top - body.getBoundingClientRect().top - 120; });
    await P.page.screenshot({ path: `out/grownupsrow/phone-${lang}-money.png` });
    if (P.errors.length) bad.push(...P.errors.map(e => lang + ': ' + e));
    await P.ctx.close();
  }
  for (const [name, w, h, touch] of [['tablet', 820, 1180, true], ['computer', 1280, 800, false]] as const) {
    const P = await open(b, { w, h, touch, lang: 'vi' }); await clear(P.page); await openPanel(P);
    for (const r of await rows(P) as any[]) if (r.missing || !r.oneRow || r.minH < 44 || r.spill.length || !r.inside) bad.push(`${name}: ${r.sel} ${JSON.stringify(r)}`);
    await P.page.evaluate(() => { const body = document.querySelector<HTMLElement>('.modal.grownups .grownups-body'), seg = document.querySelector<HTMLElement>('.modal.grownups .seg.tview'); body.scrollTop += seg.getBoundingClientRect().top - body.getBoundingClientRect().top - 60; });
    await P.page.screenshot({ path: `out/grownupsrow/${name}-vi.png` });
    await P.ctx.close();
  }
  ok(!bad.length, bad.slice(0, 12).join(' · '));
  return `Two players, Fit the screen and Money on one row (390 px EN and VI, tablet, computer), ≥ 44 px; ${notes.join(', ')}; captions off at start; no AI chat offer; TURN relay still used, its text and field hidden`;
}
