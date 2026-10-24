// The ads picture guide (r65, Studio): real screenshots of the game with a pretend ad switched on, at phone and computer
// sizes. Nothing in the repo is changed: the content pack and the ad's picture are handed to the page by the browser.
// Run from the repo:  python3 -m http.server 8765 &  SV_URL=http://localhost:8765/ CHROMIUM=/opt/pw-browsers/chromium node docs/guides/ads-guide/capture.mjs
// It writes docs/guides/ads-guide/*.jpg and studio/ui/ads-guide/*.jpg (the same pictures, shown on Studio's Ads page).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { launch, open, clear } from '../../../tests/harness.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), OUT = [path.join(ROOT, 'docs/guides/ads-guide'), path.join(ROOT, 'studio/ui/ads-guide')];
OUT.forEach(d => fs.mkdirSync(d, { recursive: true }));
// which signboard and where to stand (chosen by looking: the one by Đà Nẵng's gate, seen from in front, 7 m away)
const BOARD = +(process.env.BOARD || 1), ANG = +(process.env.ANG || 3.14), DIST = +(process.env.DIST || 7);
const AD = { by: 'Little Lotus Books', en: 'Story time every Saturday at 10', vi: 'Giờ kể chuyện sáng thứ Bảy lúc 10 giờ', link: 'https://example.org/', where: ['boards', 'gameend'], active: true, image: 'content/ads/guide-sample.jpg' };
const browser = await launch();
// the pretend ad's picture, drawn once (a family bookshop: books on a shelf and the words), 1200 × 680
const pic = await (async () => { const p = await (await browser.newContext()).newPage();
  const b64 = await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 1200; c.height = 680; const g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, 680); sky.addColorStop(0, '#ffe7b8'); sky.addColorStop(1, '#ffc2d6'); g.fillStyle = sky; g.fillRect(0, 0, 1200, 680);
    g.fillStyle = '#8a5a3c'; g.fillRect(80, 470, 1040, 26); const cols = ['#e8434a', '#3b6fe0', '#2f9a5a', '#f2a31b', '#8a5cf6', '#ff7eb8', '#19a7b8'];
    for (let i = 0, x = 110; x < 1080; i++) { const w = 46 + (i * 17) % 34, h = 150 + (i * 53) % 120; g.fillStyle = cols[i % cols.length]; g.fillRect(x, 470 - h, w, h); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x + 8, 470 - h + 20, w - 16, 8); x += w + 8; }
    g.fillStyle = '#3b2a4f'; g.font = 'bold 86px sans-serif'; g.textAlign = 'center'; g.fillText('Little Lotus Books', 600, 140); g.font = '600 48px sans-serif'; g.fillText('Story time · Giờ kể chuyện', 600, 600);
    return c.toDataURL('image/jpeg', .85).split(',')[1]; });
  await p.context().close(); return Buffer.from(b64, 'base64'); })();
fs.writeFileSync(path.join(ROOT, 'docs/guides/ads-guide/sample-ad.jpg'), pic);
const withAd = async page => {
  await page.route('**/content/custom.json*', async rt => { let j = {}; try { const r = await rt.fetch(); j = await r.json(); } catch (e) { } j.ads = { enabled: true, perDay: 9, items: [AD] }; await rt.fulfill({ json: j }); });
  await page.route('**/content/ads/guide-sample.jpg', rt => rt.fulfill({ body: pic, contentType: 'image/jpeg' })); };
const shot = async (page, name) => { for (const d of OUT) await page.screenshot({ path: path.join(d, name), type: 'jpeg', quality: 72 }); console.log('wrote', name); };
for (const [kind, w, h, touch] of [['computer', 1280, 800, false], ['phone', 390, 780, true]].slice(0, process.env.ONLY ? 1 : 2)) {
  const { ctx, page } = await open(browser, { w, h, touch, fast: false, pre: null, url: undefined, play: false });
  await withAd(page); await page.reload(); const H = await import('../../../tests/harness.mjs'); await H.start(page);
  await clear(page);
  // 1. the signboard beside the road: stand in front of it
  const at = await page.evaluate(([n, ANG, DIST]) => { const G = window.__sv, boards = []; G.scene.traverse(o => { const m = o.material; if (m && m.map && m.map.image && /content\/ads\//.test(m.map.image.src || '') && o.position.z > 0 && !boards.includes(o.parent)) boards.push(o.parent); });
    const board = boards[n % Math.max(1, boards.length)]; if (!board) return null; const f = board.rotation.y + ANG, d = DIST, x = board.position.x + Math.sin(f) * d, z = board.position.z + Math.cos(f) * d, h = G.heroes[0];
    h.place(x, z); h.yaw = Math.atan2(board.position.x - x, board.position.z - z); h.camYaw = h.yaw + Math.PI; return { x, z, f, n: boards.length }; }, [BOARD, ANG, DIST]);
  if (!at) { console.log('no signboard found'); process.exit(1); }
  await page.waitForTimeout(6000); await clear(page); await page.evaluate(() => document.querySelectorAll('.toast, .bubble-toast, .note-toast').forEach(e => e.remove())); await shot(page, `board-${kind}.jpg`);
  // 2. the small card under "You did it!" after a mini-game (a pretend game that is won straight away)
  await page.evaluate(async () => { const R = await import('/js/games/registry.js'); R.register({ id: 'adguide', icon: '🎈', name: () => 'Balloons', run: api => new Promise(r => setTimeout(() => r(api.win()), 600)) }); __sv.playGame(0, 'adguide', 'replay'); });
  await page.waitForSelector('.gl-win .gl-ad', { timeout: 20000 }); await page.waitForTimeout(2200); await shot(page, `card-${kind}.jpg`);
  await ctx.close();
}
await browser.close();
