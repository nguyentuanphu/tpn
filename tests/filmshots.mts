// Pictures of every story and guide film, a few moments into each page, for looking at by eye:
//   SV_URL=… CHROMIUM=… node filmshots.mts <out folder> [film id …]
// (films batch) SHOT_W / SHOT_H: the screen size (phone 390x844, tablet 820x1180, computer 1280x800; default 1000x700);
// SHOT_ONE=1: one picture in the middle of each page instead of one every 2.6 s
import fs from 'fs';
import { launch, open, clear } from './harness.mts';
const out = process.argv[2] || 'film-shots', only = process.argv.slice(3);
fs.mkdirSync(out, { recursive: true });
const b = await launch();
const W = +process.env.SHOT_W || 1000, Hh = +process.env.SHOT_H || 700, ONE = !!process.env.SHOT_ONE;
const P = await open(b, { w: W, h: Hh, touch: W < 900, fast: false }); await clear(P.page);
await P.page.evaluate(() => { __sv.renderer.setPixelRatio(.3); });
const list = await P.page.evaluate(async () => { const F = await import('/js/content/films.js'), L = await import('/js/content/talefilms.js'); const tf = []; for (const id of Object.keys(L.TALE_FILMS)) tf.push(['tale', id, (await L.taleFilm(id)).pages.length]); return [...Object.keys(F.FILMS).map(id => ['tale', id, F.FILMS[id].pages.length]), ...tf, ...Object.keys(F.GUIDES).map(id => ['guide', id, F.GUIDES[id].pages.length])]; });
for (const [kind, id, n] of list) {
  if (only.length && !only.includes(id)) continue;
  await P.page.evaluate(async ([kind, id]) => {
    if (kind === 'tale') { const { MORE_TALES } = await import('/js/talesdata.js'); const { TALES } = await import('/js/learn.js').catch(() => ({})); const { STORY_TALES } = await import('/js/content/chapters.js'); const all = [...(MORE_TALES || []), ...(TALES || []), ...Object.values(STORY_TALES).map(t => ({ ...t, title: () => t.title[0], ctx: { name: 'Na', companion: 'firefly' } }))]; const t = all.find(x => x.id === id); const { openTheatre } = await import('/js/tales.js'); openTheatre(t, { name: 'Na' }); const F = await import('/js/film.js'); for (let i = 0; i < 100 && !F.filmNow(); i++) await new Promise(r => setTimeout(r, 100)); await new Promise(r => setTimeout(r, 500)); document.querySelector('.th-pause').click(); }
    else { const { openHowTo } = await import('/js/howto.js'); openHowTo(id, {}); await new Promise(r => setTimeout(r, 1500)); document.querySelector('.ht-pp').click(); }
  }, [kind, id]);
  for (let k = 0; k < n; k++) {
    const len = await P.page.evaluate(async k => { const F = await import('/js/film.js'); const f = F.filmNow(); document.querySelectorAll('.ht-titlecard').forEach(x => x.remove()); f.page(k); f.narrated(); return f.now.len; }, k);
    // (the page grows after the child's turn, so keep going until it has really ended)
    for (let t = ONE ? len / 2 : .2, i = 0; i < (ONE ? 1 : 14); i++, t = i * 2.6) {
      const now = await P.page.evaluate(async () => { const F = await import('/js/film.js'); const p = F.filmNow().now; return { len: p.len, ended: p.ended }; });
      if (t > now.len + .5) break;
      await P.page.evaluate(async t => { const F = await import('/js/film.js'); const p = F.filmNow().now; while (p.t < t) { if (p.hold) p.release(true); p.t = Math.min(t, p.t + .25); await new Promise(r => requestAnimationFrame(r)); } }, t);
      await P.page.waitForTimeout(250);
      const el = await P.page.$(kind === 'tale' ? '.th-stage' : '.ht-screen');
      await el.screenshot({ path: `${out}/${id}-p${k + 1}-t${String(t.toFixed(1)).padStart(4, '0')}.png` });
    }
  }
  // (Kid UI films) a guide whose real game plays by itself: pictures of the glowing hand at work, and the child's turn
  if (kind === 'guide' && await P.page.evaluate(async id => !!(await import('/js/content/films.js')).GUIDES[id].demo, id)) {
    await P.page.evaluate(async () => { const m = document.querySelector('.howto'); for (let i = 0; i < 12 && !m.querySelector('.ht-demo'); i++) { m.querySelector('.ht-next').click(); await new Promise(r => setTimeout(r, 300)); } });
    for (let i = 0; i < 24; i++) {
      await P.page.waitForTimeout(1500);
      const st = await P.page.evaluate(() => { const D = document.querySelector('.howto').__demo; return D ? { turn: D.turn, moves: D.moves } : null; });
      if (!st) break;
      await (await P.page.$('.ht-film')).screenshot({ path: `${out}/${id}-demo-${String(i).padStart(2, '0')}.png` });
      if (st.turn) break;
    }
  }
  await P.page.evaluate(() => { document.querySelector('.th-x, .ht-x')?.click(); });
  await P.page.waitForTimeout(400);
}
console.log(JSON.stringify({ errors: P.errors }));
await b.close();
