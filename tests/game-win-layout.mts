import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { Browser } from 'playwright';
import type { GameResult } from '../js/games/frame.js';
declare global { interface Window { __layoutResult?: Promise<GameResult> } }

// A frame-only fixture checks celebration layout cheaply. Real game completion is covered by gameflow.
export async function gameWinLayoutCheck(browser: Browser): Promise<string> {
  const dir = 'out/game-win-layout'; fs.mkdirSync(dir, { recursive: true });
  const page = await browser.newPage();
  try {
    await page.route('**/__win_layout__', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><link rel="stylesheet" href="/css/fonts.css"><link rel="stylesheet" href="/css/style.css"></head><body></body></html>' }));
    await page.goto('http://localhost:8765/__win_layout__');
    await page.evaluate(async () => {
      const u = '/js/games/frame.js', F: typeof import('../js/games/frame.js') = await import(u);
      const s = '/js/state.js', S: typeof import('../js/state.js') = await import(s);
      S.settings.voice = false; S.settings.sound = false; S.settings.music = false;
      F.register({ id: 'layout_fixture', icon: '⭐', name: () => S.settings.lang === 'vi' ? 'Cùng tìm những con vật đang ẩn nấp' : 'Find the hidden animals together', run(api: { stage: Element; win(): Promise<void> }) {
        const button = document.createElement('button'); button.className = 'begin-layout'; button.textContent = 'Begin'; button.onclick = () => { void api.win(); }; api.stage.appendChild(button);
      } });
    });
    const results: { name: string; lang: string; fits: boolean; instruction: boolean; targets: boolean; hit: boolean }[] = [];
    for (const [name, width, height, pane] of [['phone',430,517,517],['phone-split',430,517,258],['small-phone-split',320,640,320],['tablet-split',820,1180,590],['computer-split',1280,800,400]] as const) {
      for (const lang of ['en', 'vi'] as const) {
        await page.setViewportSize({ width, height });
        await page.evaluate(async ({ lang, pane, height }) => {
          const u = '/js/games/frame.js', F: typeof import('../js/games/frame.js') = await import(u);
          const s = '/js/state.js', S: typeof import('../js/state.js') = await import(s); S.settings.lang = lang;
          // (v1.08) openGame waits for the v1.08 pictures (moreArt) before it builds the game layer: wait for them first,
          // so the layer exists when it is read below, as it does for a child once the pictures are in
          const a = '/js/art.js', A: typeof import('../js/art.js') = await import(a); await A.moreArt();
          window.__layoutResult = F.openGame('layout_fixture', { players: [], little: true, nextId: 'layout_fixture' });
          const layer = document.querySelector<HTMLElement>('.gl');
          // A transformed pane is the containing block for its fixed celebration, as in split screen.
          layer.style.transform = 'translateZ(0)'; layer.style.top = height - pane + 'px';
        }, { lang, pane, height });
        await page.locator('.begin-layout').click(); await page.locator('.gl-win.ask').waitFor(); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400);
        const result = await page.evaluate(() => {
          const pane = document.querySelector('.gl').getBoundingClientRect(), buttons = [...document.querySelectorAll<HTMLButtonElement>('.gl-nx')];
          const instruction = document.querySelector('.gl-tapout').getBoundingClientRect();
          const style = getComputedStyle(document.querySelector('.gl-tapout'));
          return { fits: buttons.length === 2 && buttons.every(b => { const r = b.getBoundingClientRect(); return r.left >= pane.left && r.right <= pane.right && r.top >= pane.top && r.bottom <= pane.bottom; }), instruction: instruction.top >= pane.top && instruction.bottom <= pane.bottom, targets: buttons.every(b => { const r = b.getBoundingClientRect(); return r.width >= 64 && r.height >= 64; }), hit: buttons.every(b => { const r = b.getBoundingClientRect(); return b.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }), geometry: { pane: pane.toJSON(), instruction: instruction.toJSON(), font: style.font, lineHeight: style.lineHeight, fontStatus: document.fonts.status } };
        });
        results.push({ name, lang, ...result });
        if (lang === 'vi') await page.screenshot({ path: `${dir}/${name}.png` });
        // Resolve the frame through its real pointer handler; no new game is launched by this fixture.
        await page.evaluate(() => document.querySelector('.gl-win').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })));
        const end = await page.evaluate(() => window.__layoutResult); assert.ok(end.won && end.next === 'stop');
        await page.locator('.gl').waitFor({ state: 'detached' });
      }
    }
    fs.writeFileSync(dir + '/results.json', JSON.stringify(results, null, 2));
    assert.ok(results.every(r => r.fits && r.instruction && r.targets && r.hit), 'celebration clips controls: ' + JSON.stringify(results));
    return '10 EN/VI phone/full and phone/tablet/computer split panes, down to 320 px; both choices and finish instruction visible, choices hittable and at least 64 px';
  } finally { await page.close(); }
}
