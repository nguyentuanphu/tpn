// Records the little ones' film (the Simple screen): node rec-little.mts <en|vi> <land|vert> <framesdir>
// Writes frames and <framesdir>/marks.json (when each scene starts). The end card is added by makefilm.mts.
// Owner, 11 Oct (second cut): quicker, with more in it: 17 games at about 7 s each, two stories, a flight to a place.
import fs from 'fs';
import { film } from './filmrec.mts';
globalThis.window = globalThis.window || {}; await import('./films2.js'); const SCENES = window.FILMS2.little;
const [lang = 'en', shape = 'land', dir] = process.argv.slice(2);
const L = shape === 'land' ? { w: 1280, h: 720, dpr: 1.5, pixelRatio: .9 } : { w: 540, h: 960, dpr: 2, pixelRatio: 1.2 };
// (film only) the games' own hint (the right answer wiggles) shows at once, so the child in the film answers right
const route = async ctx => ctx.route('**/js/games/frame.js', async r => { const res = await r.fetch(); r.fulfill({ response: res, body: (await res.text()).replace('misses >= 2 ? 0 : HINT_AFTER', '400') }); });
const rec = await film({ ...L, lang, dir, screen: 'simple', route });
const page = rec.page;
const scroll = (dy, sel = '.sp-scroll') => page.evaluate(([dy, sel]) => { const s = document.querySelector(sel); if (s) { s.scrollTop += dy; s.scrollLeft += dy; } }, [dy, sel]);
// a child's taps on a game: about two a second, on the game's own buttons and pictures
const play = async (sec, every = 12) => {
  await rec.hold(sec, async (t, i) => {
    if (i % every !== every / 2) return;
    const xy = await page.evaluate(() => {
      const gl = document.querySelector('.gl, .theatre'); if (!gl) return null;
      const at = e => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; };
      const hint = gl.querySelector('.hint'); if (hint) return at(hint);
      const bub = gl.querySelector('.bunny .bubble'); if (bub) { const n = parseInt(bub.textContent), fed = gl.querySelectorAll('.bunny .tum i').length, cs = gl.querySelectorAll('.choices .choice'); return cs.length === 3 ? at(fed < n ? cs[1] : cs[2]) : null; }
      if (Math.random() < .5) return null;
      const head = gl.querySelector('.gl-head'), hb = head ? head.getBoundingClientRect().bottom : 0;
      const bs = [...gl.querySelectorAll('button, .card, [data-v], [data-i], canvas, svg')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 30 && r.height > 30 && r.top > hb && r.bottom < innerHeight && !/gl-x|gl-tv|lvl|diff|th-x/.test(b.className && b.className.baseVal != null ? b.className.baseVal : b.className); });
      if (!bs.length) return null; const b = bs[Math.floor(Math.random() * bs.length)], r = b.getBoundingClientRect();
      return [r.x + r.width * (.25 + Math.random() * .5), r.y + r.height * (.25 + Math.random() * .5)];
    });
    if (xy) await page.mouse.click(xy[0], xy[1]);
  });
};
const closeGame = async () => { await page.evaluate(() => { const x = document.querySelector('.gl .gl-x, .theatre .th-x, .modal .x'); if (x) x.click(); }); await rec.hold(.3); await page.evaluate(() => document.querySelectorAll('.gl, .theatre, .modal, .dialog').forEach(e => e.remove())); };
// the label of a game, story or place (by its English name) in this film's language
const label = en => page.evaluate(async en => {
  const { GAMES } = await import('/js/games/frame.js'), { both } = await import('/js/i18n.js'), G = window.__sv, k = G.lang === 'vi' || document.documentElement.lang === 'vi' ? 1 : 0;
  for (const f of [...Object.values(GAMES).map(g => g.name), ...(G.TALES || []).map(t => t.title), ...(G.PLACES || []).map(p => p.name)]) { const b = both(f); if (b[0] === en) return f(); }
  return en;
}, en);
const openStop = async en => {
  const name = await label(en);
  const ok = await page.evaluate(n => { const el = [...document.querySelectorAll('.sp-stop')].find(e => e.getAttribute('aria-label') === n); if (!el) return false; el.scrollIntoView({ block: 'center' }); return true; }, name);
  if (!ok) { console.log('no stop', en, name); return; }
  await rec.hold(.5);
  const r = await page.evaluate(n => { const b = [...document.querySelectorAll('.sp-stop')].find(e => e.getAttribute('aria-label') === n).getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }, name);
  await page.mouse.click(r[0], r[1]); await rec.hold(1);
};
const tab = async t => { await page.click(`[data-tab=${t}]`).catch(() => { }); await rec.hold(.6); };
const scene = async (s, fn) => { const t = rec.frames(); rec.mark(s.id); await fn(); const want = Math.round(s.sec * 25); if (rec.frames() - t < want) await rec.hold((want - (rec.frames() - t)) / 25); console.log(s.id, ((rec.frames() - t) / 25).toFixed(1)); };
try {
  for (const s of SCENES) {
    if (s.end) continue;
    if (s.id === 'K01') await scene(s, async () => { await rec.hold(2); await rec.hold(5, () => scroll(9)); await rec.hold(1.5, () => scroll(-30)); });
    else if (s.game) await scene(s, async () => { await openStop(s.game); await play(s.sec - 2); await closeGame(); });
    else if (s.tale) await scene(s, async () => {
      if (s.id === 'K02') await tab('tales');
      await openStop(s.tale);
      await rec.hold(s.sec - 2.6, async (t, i) => { if (i % 100 === 90) await page.evaluate(() => { const n = document.querySelector('.theatre .th-next, .film .next, .th-next'); if (n) n.click(); }); });
      await closeGame();
    });
    else if (s.place) await scene(s, async () => { await tab('places'); await rec.hold(1.5, () => scroll(6)); await openStop(s.place); await rec.hold(s.sec - 4); });
    else await scene(s, async () => {
      await page.evaluate(() => document.querySelectorAll('.storybook, .toast, .modal, .dialog, .region-banner').forEach(e => e.remove()));
      if (await page.$('.sp-valley:visible')) await page.click('.sp-valley').catch(() => { });
      await page.keyboard.down('ArrowUp'); await rec.hold(s.sec - .5, async (t, i) => { if (i % 25 === 0) await page.evaluate(() => document.querySelectorAll('.storybook, .toast, .region-banner').forEach(e => e.remove())); }); await page.keyboard.up('ArrowUp');
    });
  }
} finally {
  fs.writeFileSync(dir + '/marks.json', JSON.stringify(rec.marks)); await rec.close();
}
