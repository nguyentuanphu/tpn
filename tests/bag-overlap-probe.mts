// (r78) Bag tiles: does an item's name overlap its picture? Prints each overlapping tile. Usage: node bag-overlap-probe.mts
import { launch, open, start, clear } from './harness.mts';
const b = await launch(); const out = {};
for (const [name, w, h, touch] of [['phone', 390, 844, true], ['computer', 1280, 800, false]]) {
  const P = await open(b, { w, h, touch, play: false }); await start(P.page); await clear(P.page);
  await P.page.evaluate(() => window.__sv.openPad(0, 'bag')); await P.page.waitForTimeout(1500);
  out[name] = await P.page.evaluate(() => [...document.querySelectorAll('.pad .slot')].map(s => {
    const pic = s.querySelector(':scope > span:not(.sw) svg, :scope > span:not(.sw) .emo, :scope > svg, :scope > .kpic, :scope > span:not(.sw)'), lab = s.querySelector(':scope > small');
    if (!pic || !lab) return null; const a = pic.getBoundingClientRect(), t = lab.getBoundingClientRect(), r = s.getBoundingClientRect();
    // the drawn shape (svg content can spill past its box)
    let drawn = a; try { const g = pic.querySelector?.('svg') || pic; if (g.getBBox) { const bb = g.getBBox(), m = g.getScreenCTM(); drawn = { bottom: bb.y * m.d + m.f + bb.height * m.d }; } } catch (e) { }
    const over = Math.max(a.bottom, drawn.bottom) - t.top;
    return over > 1 ? { name: lab.textContent.trim().slice(0, 30), overPx: Math.round(over), tileH: Math.round(r.height) } : null; }).filter(Boolean));
  await P.ctx.close();
}
await b.close(); console.log(JSON.stringify(out, null, 1));
