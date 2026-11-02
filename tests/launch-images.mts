// iPhone and iPad launch pictures (owner, 23 Oct 2026 AEDT: "the white screen comes back" on the Home Screen app).
// A Home Screen web app on iOS shows plain white from the tap until the page paints, unless index.html names an
// apple-touch-startup-image for the exact screen. This draws the same light Welcome screen as index.html's #boot for
// every current iPhone and iPad size, portrait and landscape, into icons/launch/, and writes the links between the
// launch:start and launch:end marks in index.html. Run after changing the Welcome look: node tests/launch-images.mts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'icons/launch');
// [css width, css height, pixel ratio] in portrait: iPhones from SE to 16 Pro Max, then iPads
export const SCREENS: [number, number, number][] = [
  [320, 568, 2], [375, 667, 2], [414, 736, 3], [375, 812, 3], [414, 896, 2], [414, 896, 3], [390, 844, 3], [428, 926, 3],
  [393, 852, 3], [430, 932, 3], [402, 874, 3], [440, 956, 3],
  [768, 1024, 2], [744, 1133, 2], [810, 1080, 2], [820, 1180, 2], [834, 1112, 2], [834, 1194, 2], [1024, 1366, 2]
];
// (r90, owner 23 Oct AEDT: "the white screen before the light welcome screen still persists") the launch pictures are the
// start screen itself: index.html's boot styles and words (between the boot:start and boot:end marks) over a still picture of
// the valley behind the Welcome screen, taken here from the game (http://localhost:8765, as the checks), so the launch
// picture, the start screen and the Welcome screen look the same from the tap on
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const boot = indexHtml.match(/<!-- boot:start -->([\s\S]*?)<!-- boot:end -->/);
if (!boot) throw new Error('index.html: no boot:start / boot:end marks');
const bootDiv = indexHtml.match(/<div id="boot"[\s\S]*?<\/div>/);
if (!bootDiv) throw new Error('index.html: no #boot');
const page = (shot: string) => `<!doctype html><meta charset="utf-8">${boot[1].replaceAll('icons/launch/', shot)}<body>${bootDiv[0].replaceAll('icons/launch/', shot)}</body>`;

const links: string[] = [];
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
try {
  // 1. the valley behind the Welcome screen, portrait and landscape (no words, no name tags)
  const { open } = await import('./harness.mts');
  for (const [name, w, h] of [['portrait', 390, 844], ['landscape', 844, 390]] as const) {
    const P = await open(browser, { w, h, dpr: 1, play: false, fast: false, settings: { quality: 'high' } });
    await P.page.waitForFunction(() => !!window.__sv?.bootTimes, undefined, { timeout: 120000 }); await P.page.waitForTimeout(2500);
    await P.page.evaluate(() => { document.querySelectorAll<HTMLElement>('.screen, .launch-progress, #boot, .update-notice, #toast').forEach(e => { e.style.visibility = 'hidden'; }); window.__sv?.scene?.traverse(o => { if (o.type === 'Sprite') o.visible = false; }); });
    await P.page.waitForTimeout(1500);
    const png = (await P.page.screenshot({ type: 'png' })).toString('base64'); await P.ctx.close();
    // (r90) small and soft: a fifth of the screen's pixels, a little blurred (a few KB, inside the first download's
    // budget, startup-baseline.json firstKB); a real picture in the start screen is also what lets Safari paint it at once
    const ctx = await browser.newContext(), p = await ctx.newPage();
    const jpg = await p.evaluate(async ([src, cw, ch]) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode();
      const c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d');
      if (!g) throw new Error('no 2D canvas'); g.filter = 'blur(1.5px)'; g.drawImage(img, -4, -4, cw + 8, ch + 8);
      return c.toDataURL('image/jpeg', .6).split(',')[1];
    }, [png, Math.round(w * .4), Math.round(h * .4)] as const);
    fs.writeFileSync(path.join(out, `valley-${name}.jpg`), Buffer.from(jpg, 'base64')); await ctx.close();
  }
  // 2. the start screen at every iPhone and iPad size
  const shot = 'file://' + out + '/', tmpPage = path.join(os.tmpdir(), 'sv-launch-page.html');
  for (const [w, h, dpr] of SCREENS) for (const portrait of [true, false]) {
    const [vw, vh] = portrait ? [w, h] : [h, w], name = `launch-${vw * dpr}x${vh * dpr}.png`;
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr }), p = await ctx.newPage();
    fs.writeFileSync(tmpPage, page(shot)); await p.goto('file://' + tmpPage, { waitUntil: 'load' }); await p.screenshot({ path: path.join(out, name) }); await ctx.close();
    links.push(`<link rel="apple-touch-startup-image" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: ${portrait ? 'portrait' : 'landscape'})" href="icons/launch/${name}">`);
  }
} finally { await browser.close(); }
const file = path.join(root, 'index.html'), html = fs.readFileSync(file, 'utf8');
const marks = /<!-- launch:start[\s\S]*?<!-- launch:end -->/;
if (!marks.test(html)) throw new Error('index.html: no launch:start / launch:end marks');
fs.writeFileSync(file, html.replace(marks, `<!-- launch:start (tests/launch-images.mts) -->\n${[...new Set(links)].join('\n')}\n<!-- launch:end -->`));
console.log(`launch pictures: ${new Set(links).size}`);
