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
  // (v1.08f films) a sixth film (any other tale film): the in-game film for everyone; its video only on a tester device
  // with "Blender films for testers" on; and for everyone once its own "Blender film for everyone" switch is on
  net = true;
  const SIXTH = 'sontinh';
  const rules = (r: Record<string, any>, tester: boolean) => P.page.evaluate(([r, tester]) => import('/js/custom.js').then(C => {
    C.CUSTOM.releases = r; localStorage.setItem('sv2_playerid', tester ? 'filmtester01' : 'notatester01');
  }), [r, tester] as const);
  const sixth = async (r: Record<string, any>, tester: boolean) => {
    await rules(r, tester);
    const got = await P.page.evaluate(async id => {
      const W = window as any, B = await import('/js/content/blenderfilms.js'), tale = W.__sv.TALES.find(t => t.id === id); if (!tale) return 'no tale ' + id;
      B.BLENDER_FILMS[id] = { v: 'test', pages: tale.pages.map((_, k) => ({ s: k * .5, e: k * .5 + .5 })) };
      const { openTheatre } = await import('/js/tales.js'); const done = openTheatre(tale, {});
      const w = ms => new Promise(r => setTimeout(r, ms)), until = async (f, ms) => { for (let i = 0; i < ms / 50; i++) { const v = f(); if (v) return v; await w(50); } return null; };
      const m = await until(() => document.querySelector('.theatre'), 3000); if (!m) return 'the theatre did not open';
      const what = await until(() => m.querySelector('video.th-video') ? 'video' : m.querySelector('canvas.th-film') ? 'film' : null, 12000);
      (m.querySelector('.th-x') as HTMLElement).click(); await Promise.race([done, w(1500)]); document.querySelectorAll('.theatre').forEach(x => x.remove());
      return String(what);
    }, SIXTH);
    return got;
  };
  const TESTER = { tester: { on: true, devices: ['filmtester01'] } };
  assert.equal(await sixth({}, false), 'film', 'the sixth film is not for everyone');
  assert.equal(await sixth({ ...TESTER }, true), 'film', 'a tester with "Blender films for testers" off sees the in-game film');
  assert.equal(await sixth({ blenderFilmsTesters: { on: true } }, false), 'film', 'the tester switch alone does not open it to a device that is not a tester');
  assert.equal(await sixth({ ...TESTER, blenderFilmsTesters: { on: true } }, true), 'video', 'a tester with the switch on plays the video');
  assert.equal(await sixth({ ['blenderFilm_' + SIXTH]: { on: true } }, false), 'video', 'its own switch opens it to everyone');
  assert.equal(await sixth({ blenderFilm_tamcam: { on: false } }, false), 'film', 'the sixth again closed');
  // (v1.08f films) "Download all films for offline" in the Stories tab: the total, the progress, Stop and Go on, done,
  // every film played with no internet after; on mobile data it asks first (press and hold)
  await rules({}, false);
  await P.page.evaluate(() => caches.delete('sv-films'));
  let slow = 0; // (the films come slowly while Stop is tried)
  await P.page.unroute('**/videos/films/*');
  await P.page.route('**/videos/films/*', async r => { if (!net) return r.abort(); if (slow) await new Promise(res => setTimeout(res, slow)); r.fulfill({ status: 200, contentType: 'video/mp4', body: video }).catch(() => { }); });
  const pack = await P.page.evaluate(async () => {
    const W = window as any, F = await import('/js/filmpack.js');
    const w = ms => new Promise(r => setTimeout(r, ms)), until = async (f, ms) => { for (let i = 0; i < ms / 50; i++) { const v = f(); if (v) return v; await w(50); } return null; };
    const slot = document.createElement('div'); slot.className = 'filmpack-slot'; document.body.appendChild(slot);
    (window as any).__fpSlot = slot;
    await F.showFilmPack(slot);
    const c = slot.querySelector('.filmpack'); if (!c) return { err: 'no card' };
    const st = await F.filmPackState();
    return { line: c.querySelector('.fp-line')?.textContent, title: c.querySelector('b')?.textContent, ids: st.ids, btn: (c.querySelector('.fp-go') as HTMLElement)?.getBoundingClientRect().height };
  });
  assert.ok(!('err' in pack), JSON.stringify(pack));
  assert.deepEqual([...pack.ids].sort(), [...FILM_IDS].sort(), 'the download is the five, not the tester film: ' + pack.ids);
  assert.match(pack.line, /5 films · about 15 MB/, 'the total: ' + pack.line); assert.match(pack.title, /Download all films for offline/);
  assert.ok(pack.btn >= 64, 'the button is 64 px: ' + pack.btn);
  slow = 400;
  const stopped = await P.page.evaluate(async () => {
    const slot = (window as any).__fpSlot, F = await import('/js/filmpack.js'), w = ms => new Promise(r => setTimeout(r, ms));
    (slot.querySelector('.fp-go') as HTMLElement).click();
    let bar = null; for (let i = 0; i < 100 && !(bar = slot.querySelector('.fp-stop')); i++) await w(20);
    const showing = !!slot.querySelector('.fp-bar') && /Downloading/.test(slot.querySelector('.fp-line').textContent);
    for (let i = 0; i < 100 && (await F.filmPackState()).kept.length < 1; i++) await w(50);
    (slot.querySelector('.fp-stop') as HTMLElement).click(); await w(900);
    const st = await F.filmPackState();
    return { showing, kept: st.kept.length, go: slot.querySelector('.fp-go')?.textContent, line: slot.querySelector('.fp-line')?.textContent };
  });
  assert.ok(stopped.showing, 'progress shown'); assert.ok(stopped.kept >= 1 && stopped.kept < 5, 'stopped part way: ' + JSON.stringify(stopped));
  assert.match(stopped.go, /Go on/, 'Go on after Stop: ' + JSON.stringify(stopped));
  slow = 0;
  const finished = await P.page.evaluate(async () => {
    const slot = (window as any).__fpSlot, F = await import('/js/filmpack.js'), w = ms => new Promise(r => setTimeout(r, ms));
    (slot.querySelector('.fp-go') as HTMLElement).click();
    for (let i = 0; i < 200 && !slot.querySelector('.filmpack.done'); i++) await w(50);
    const st = await F.filmPackState(); return { done: !!slot.querySelector('.filmpack.done'), kept: st.kept.length, line: slot.querySelector('.fp-line')?.textContent };
  });
  assert.ok(finished.done && finished.kept === 5, 'all five kept and the card says so: ' + JSON.stringify(finished));
  assert.match(finished.line, /All 5 films are on this device/);
  net = false;
  for (const id of FILM_IDS) {
    const got = await P.page.evaluate(async id => {
      const W = window as any, tale = W.__sv.TALES.find(t => t.id === id), { openTheatre } = await import('/js/tales.js'); const done = openTheatre(tale, {});
      const w = ms => new Promise(r => setTimeout(r, ms)), until = async (f, ms) => { for (let i = 0; i < ms / 50; i++) { const v = f(); if (v) return v; await w(50); } return null; };
      const m = await until(() => document.querySelector('.theatre'), 3000); const what = m && await until(() => m.querySelector('video.th-video') ? 'video' : m.querySelector('canvas.th-film') ? 'film' : null, 12000);
      (m.querySelector('.th-x') as HTMLElement).click(); await Promise.race([done, w(1500)]); document.querySelectorAll('.theatre').forEach(x => x.remove()); return String(what);
    }, id);
    assert.equal(got, 'video', `${id} offline after Download all: ${got}`);
  }
  // Light frees them
  const freed = await P.page.evaluate(async () => { const F = await import('/js/filmpack.js'); const n = await F.freeFilms(); return { n, left: (await caches.keys()).includes('sv-films') }; });
  assert.ok(freed.n > 0 && !freed.left, 'Light frees the films: ' + JSON.stringify(freed));
  // on mobile data: asked first, with a press and hold
  net = true;
  const asked = await P.page.evaluate(async () => {
    const slot = (window as any).__fpSlot, F = await import('/js/filmpack.js'), w = ms => new Promise(r => setTimeout(r, ms));
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { type: 'cellular' } });
    await F.showFilmPack(slot); (slot.querySelector('.fp-go') as HTMLElement).click();
    let yes = null; for (let i = 0; i < 60 && !(yes = slot.querySelector('.fp-yes')); i++) await w(50);
    const r = { asked: !!yes, line: slot.querySelector('.fp-line')?.textContent, started: !!slot.querySelector('.fp-stop'), kept: (await F.filmPackState()).kept.length };
    (slot.querySelector('.fp-no') as HTMLElement).click(); await w(300);
    delete (navigator as any).connection; slot.remove(); return r;
  });
  assert.ok(asked.asked && !asked.started && asked.kept === 0, 'on mobile data it asks first: ' + JSON.stringify(asked));
  assert.match(asked.line, /mobile data/);
  // none of it is in the install list
  assert.ok(!/filmpack/.test(sw), 'the service worker would keep the download-all card with the game');
  assert.deepEqual(P.errors, []); await P.ctx.close();
  return `${out.length} films (${out.join(', ')}): play, stop for help with the tap ring, go on after the tap, kept for offline and played from the kept copy, the game's film with no internet; none in the first download. A sixth (${SIXTH}) plays its video only on a tester with "Blender films for testers" on, or for everyone with its own switch. Download all: 5 films, about 15 MB, 64 px button, progress, Stop and Go on, done, all five play offline after, Light frees them, asks first on mobile data`;
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
