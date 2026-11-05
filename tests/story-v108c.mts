// Round v1.08c, blender helper: the five Blender films and the story pages drawn in Blender (js/blenderfilm.ts,
// js/storypics.ts, wired in js/tales.ts).
// The films themselves are rendered later on a machine with a graphics card (owner, 5 Nov 2026 AEDT), so these checks play
// a small test video (tests/fixtures/blenderfilm-test.mp4) and a test picture in their place: the game's side is checked now,
// and the same checks run on the real films once they are listed in js/content/blenderfilms.ts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { open, clear } from './harness.mts';

const FILM_IDS = ['banhchung', 'chucuoi', 'tamcam', 'thanhgiong', 'rainbowserpent'];
const fixture = (f: string) => fs.readFileSync(new URL('./fixtures/' + f, import.meta.url));

// blenderfilms: each of the five opens, plays, stops for the child's help with the tap ring, goes on after the tap, is kept
// for offline, plays from the kept copy with no internet, and with no internet and no kept copy the game's own film plays;
// none of it is in the first download or the service worker's list (the Wi-Fi pack is voices only)
export async function blenderFilmsCheck(b) {
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const startUrls = await P.page.evaluate(() => performance.getEntriesByType('resource').map(e => new URL(e.name).pathname));
  assert.deepEqual(startUrls.filter(u => /videos\/films|blenderfilm|storypics|storypages/.test(u)), [], 'a Blender film or story picture in the first download');
  const sw = fs.readFileSync(new URL('../sw.ts', import.meta.url), 'utf8'); assert.ok(!/videos\/films|storypages/.test(sw), 'the service worker would keep the films or pictures with the game');
  let net = true; const video = fixture('blenderfilm-test.mp4');
  await P.page.route('**/videos/films/*', r => net ? r.fulfill({ status: 200, contentType: 'video/mp4', body: video }) : r.abort());
  const out: string[] = [];
  for (const id of FILM_IDS) {
    const play = (expect: string) => P.page.evaluate(async ([id, expect]) => {
      const W = window as any, B = await import('/js/content/blenderfilms.js');
      const tale = W.__sv.TALES.find(t => t.id === id); if (!tale) return 'no tale ' + id;
      // a test film: each page 0.5 s of the test video, the first page's help moment at 0.3 s
      B.BLENDER_FILMS[id] = { v: 'test', pages: tale.pages.map((_, k) => ({ s: k * .5, e: k * .5 + .5, ...(k ? {} : { help: { t: .3, x: 50, y: 50, en: 'Tap to help!', vi: 'Chạm để giúp nhé!' } }) })) };
      const { openTheatre } = await import('/js/tales.js'); const done = openTheatre(tale, {});
      const w = ms => new Promise(r => setTimeout(r, ms)), until = async (f, ms) => { for (let i = 0; i < ms / 50; i++) { const v = f(); if (v) return v; await w(50); } return null; };
      const m = await until(() => document.querySelector('.theatre'), 3000); if (!m) return 'the theatre did not open';
      const what = await until(() => m.querySelector('video.th-video') ? 'video' : m.querySelector('canvas.th-film') ? 'film' : null, 12000);
      let r = String(what);
      if (what === 'video' && expect === 'video') {
        const v = m.querySelector('video.th-video') as HTMLVideoElement;
        const asked = await until(() => !m.querySelector('.film-help')!.hidden && !(m.querySelector('.film-ring') as HTMLElement).hidden, 9000);
        if (!asked) r += ' no help'; else if (!v.paused) r += ' did not stop for help';
        const t0 = v.currentTime; v.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        const went = await until(() => !v.paused && v.currentTime > t0 + .05 && m.querySelector('.film-help')!.hidden, 4000); if (!went) r += ' did not go on after the tap';
      }
      (m.querySelector('.th-x') as HTMLElement).click(); await Promise.race([done, w(1500)]); document.querySelectorAll('.theatre').forEach(x => x.remove());
      return r;
    }, [id, expect]);
    const kept = () => P.page.evaluate(async id => { for (let i = 0; i < 60; i++) { const c = await caches.open('sv-films'); if ((await c.keys()).some(k => k.url.includes(`/videos/films/${id}-test.mp4`))) return true; await new Promise(r => setTimeout(r, 100)); } return false; }, id);
    net = true; const online = await play('video'); assert.equal(online, 'video', `${id} online: ${online}`);
    assert.ok(await kept(), `${id}: the film was not kept for offline`);
    net = false; const offKept = await play('video'); assert.equal(offKept, 'video', `${id} offline with the kept copy: ${offKept}`);
    await P.page.evaluate(() => caches.delete('sv-films'));
    const offNone = await play('film'); assert.equal(offNone, 'film', `${id} offline, nothing kept: ${offNone}`);
    out.push(id);
  }
  assert.deepEqual(P.errors, []); await P.ctx.close();
  return `${out.length} films (${out.join(', ')}): play, stop for help with the tap ring, go on after the tap, kept for offline and played from the kept copy, the game's film with no internet; none in the first download`;
}

// storypics: a tale with pages drawn in Blender shows its own picture on the picture stage (no little actors over it),
// keeps its pictures for offline once opened, and falls back to the painted stage with no picture
export async function storyPicsCheck(b) {
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  await P.page.evaluate(async () => { const C = await import('/js/custom.js'); C.CUSTOM.features = Object.assign({}, C.CUSTOM.features, { storyFilms: false }); });   // the tale reads without its film: the picture stage
  let net = true; const pic = fixture('storypage-test.webp');
  await P.page.route('**/videos/storypages/*', r => net ? r.fulfill({ status: 200, contentType: 'image/webp', body: pic }) : r.abort());
  const show = () => P.page.evaluate(async () => {
    const W = window as any, S = await import('/js/content/storypics.js');
    const tale = W.__sv.TALES.find(t => t.id === 'caykhe'); S.STORY_PICS.caykhe = { v: 'test', n: tale.pages.length };
    const { openTheatre } = await import('/js/tales.js');
    const done = openTheatre(tale, {}); const w = ms => new Promise(r => setTimeout(r, ms));
    let m = null; for (let i = 0; i < 60 && !(m = document.querySelector('.theatre')); i++) await w(50);
    let img = null; for (let i = 0; i < 240 && !(img = m.querySelector('.th-stage.drawn .th-bg img.th-pic')); i++) await w(50);
    const r = { drawn: !!img, loaded: !!(img && (await img.decode().then(() => true, () => false))), actors: m.querySelectorAll('.th-actors > *').length, film: !!m.querySelector('.th-film') };
    (m.querySelector('.th-x') as HTMLElement).click(); await Promise.race([done, w(1500)]); document.querySelectorAll('.theatre').forEach(x => x.remove());
    return r;
  });
  const first = await show();
  assert.ok(first.drawn && first.loaded && first.actors === 0 && !first.film, 'online: ' + JSON.stringify(first));
  const kept = await P.page.evaluate(async () => { for (let i = 0; i < 80; i++) { const c = await caches.open('sv-story-pics'); if ((await c.keys()).length >= 3) return (await c.keys()).length; await new Promise(r => setTimeout(r, 100)); } return 0; });
  assert.ok(kept >= 3, 'the pictures were not kept for offline');
  net = false; const off = await show(); assert.ok(off.drawn && off.loaded, 'offline with the kept pictures: ' + JSON.stringify(off));
  await P.page.evaluate(() => caches.delete('sv-story-pics'));
  const none = await show(); assert.ok(!none.drawn && none.actors > 0, 'no picture: the painted stage: ' + JSON.stringify(none));
  assert.deepEqual(P.errors, []); await P.ctx.close();
  return `a drawn tale shows its own picture on the picture stage (no actors over it), keeps its ${kept} pictures for offline and reads with them offline; with no picture the painted stage plays`;
}
