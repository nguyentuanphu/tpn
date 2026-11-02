// (feel and sound, chat A, owner plan 16 Oct AEDT) pictures of the new feel on a phone, a tablet and a computer:
// a coin flying into its counter, a button pressed down, and the Grown-ups "Tap sounds" switch.
// Usage (game served on :8765, from tools/): node feel-shots.mts → docs/plans-20261016/evidence/feel-<device>-<what>.png
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, open } from '../tests/harness.mts';
const out = fileURLToPath(new URL('../docs/plans-20261016/evidence/', import.meta.url));
const SIZES: Record<string, [number, number, boolean]> = { phone: [390, 844, true], tablet: [820, 1180, true], computer: [1280, 800, false] };
const b = await launch();
for (const [dev, [w, h, touch]] of Object.entries(SIZES)) {
  const P = await open(b, { w, h, touch, settings: { calm: false } });
  const pg = P.page;
  // a coin in the air: earned at the middle of the screen, on its way to the counter (or the card on a phone)
  // (the picture holds each coin part of the way, so the slow test browser catches it in the air)
  await pg.evaluate(async () => {
    window.__hold = new MutationObserver(l => l.forEach(r => r.addedNodes.forEach(n => { if (n instanceof Element && n.classList.contains('sv-fly')) n.getAnimations().forEach(a => { a.pause(); a.currentTime = 330 + Math.random() * 200; }); })));
    window.__hold.observe(document.body, { childList: true });
    dispatchEvent(new PointerEvent('pointerdown', { clientX: innerWidth / 2, clientY: innerHeight * .55 })); dispatchEvent(new PointerEvent('pointerup', {}));
    const S = await import('/js/state.js'); S.farm.coins += 30;
  });
  await pg.waitForSelector('.sv-fly', { timeout: 15000 }); await pg.waitForTimeout(150);
  await pg.screenshot({ path: path.join(out, `feel-${dev}-coins.png`) });
  await pg.evaluate(() => { window.__hold.disconnect(); document.getAnimations().forEach(a => a.playState === 'paused' && a.play()); });
  await pg.waitForTimeout(1500);
  // a button held down (the Map button, or the first bottom button)
  await pg.evaluate(() => { const bt = document.querySelector('.hud .dk') || document.querySelector('.hud button'); const r = bt.getBoundingClientRect(); bt.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + 5, clientY: r.top + 5 })); });
  await pg.waitForTimeout(60);
  await pg.screenshot({ path: path.join(out, `feel-${dev}-press.png`) });
  await pg.evaluate(() => dispatchEvent(new PointerEvent('pointerup', {})));
  // Grown-ups: the Tap sounds switch under Sound effects
  await pg.evaluate(async () => { const UI = await import('/js/ui.js'); UI.openGrownups(() => { }); });
  await pg.waitForTimeout(900);
  await pg.evaluate(() => { const sw = document.querySelector('#gTapSnd'); for (let d = sw && sw.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) d.open = true; sw && sw.scrollIntoView({ block: 'center' }); });
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(out, `feel-${dev}-tapsounds.png`) });
  if (P.errors.length) console.log(dev, 'errors:', P.errors.slice(0, 3).join(' | '));
  await P.ctx.close(); console.log('took', dev);
}
await b.close();
