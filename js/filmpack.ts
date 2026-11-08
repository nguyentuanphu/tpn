// (v1.08f films, owner 6 Nov 2026 AEDT: "offer full download for offline in the story section so they can download
// everything in one go") the "Download all films for offline" card in Story time (js/learn.ts openTales). It downloads, in
// one go, every Blender film this device may play (the five for everyone, or every film on a tester device with Studio's
// "Blender films for testers" on), shows the total and the progress, goes on while the game is open (also when Story
// time closes), can be stopped and goes on from the films already kept, and says when it is done. On mobile data a grown-up is asked first (press and hold), as the voice pack does.
// The films go in their own cache ("sv-films", js/blenderfilm.ts): a game update never deletes them and they are never in
// the install list; Grown-ups → Offline voices → Light frees them (js/offlinelevels.ts freeFilms).
// Its own small file, loaded only when Story time opens and there is a film to offer, with its own styles.
import { T } from './i18n.js';
import { pic } from './art.js';
import { esc } from './util.js';
import { filmBytes } from './content/blenderfilms.js';
import { FILM_STORE, blenderFilmUrl, myFilms } from './blenderfilm.js';
import { featureOn } from './custom.js';

const CSS = `.filmpack { display: flex; align-items: center; gap: 10px; margin: 6px 0 10px; padding: 8px 10px; border: 2px solid #e2d8f5; border-radius: 18px; background: #fff; color: #3a2a50; }
.filmpack .fp-pic { width: 44px; height: 44px; flex: none; }
.filmpack .fp-txt { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.filmpack .fp-txt b { font: 700 18px/1.2 var(--font); }
.filmpack .fp-txt small { font: 600 15px/1.25 var(--font); color: #6a5a8a; }
.filmpack .fp-bar { display: block; height: 10px; border-radius: 5px; background: #ece6f7; overflow: hidden; }
.filmpack .fp-bar i { display: block; height: 100%; width: 0; border-radius: 5px; background: linear-gradient(90deg, #a07cff, #8a5cf6); transition: width .3s; }
.filmpack .fp-btns { display: flex; gap: 8px; flex: none; }
.filmpack button { position: relative; overflow: hidden; min-width: 64px; min-height: 64px; padding: 6px 14px; border: 0; border-radius: 16px; background: var(--purple, #8a5cf6); color: #fff; font: 700 16px/1.15 var(--font); cursor: pointer; }
.filmpack button.fp-no { background: #9a8aa8; }
.filmpack button .fp-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: rgba(255,255,255,.35); pointer-events: none; }
.filmpack button span { position: relative; }
.filmpack.done { border-color: #7fcf8f; background: #f1fbf3; }
@media (max-width: 520px) { .filmpack { flex-wrap: wrap; } .filmpack .fp-txt { flex-basis: calc(100% - 60px); } .filmpack .fp-btns { flex: 1 1 100%; } .filmpack .fp-btns button { flex: 1 1 0; } }`;

const abs = (id: string) => new URL(blenderFilmUrl(id)!, location.href).href;
const mb = (b: number) => Math.max(1, Math.round(b / 1048576));
/** what this device may download, what it takes and what is kept already */
export async function filmPackState() {
  const ids = myFilms(); let kept: string[] = [];
  try { const c = await caches.open(FILM_STORE), keys = new Set((await c.keys()).map(k => k.url)); kept = ids.filter(id => keys.has(abs(id))); } catch (e) { }
  const total = ids.reduce((s, id) => s + filmBytes(id), 0), have = kept.reduce((s, id) => s + filmBytes(id), 0);
  return { ids, kept, total, have, done: !!ids.length && kept.length === ids.length };
}

/** download every film not kept yet, one after another; onProgress(bytes so far of the total); stops when signal aborts */
export async function downloadAllFilms(onProgress: (got: number, total: number) => void, signal: AbortSignal) {
  const st = await filmPackState(), c = await caches.open(FILM_STORE);
  let got = st.have; onProgress(got, st.total);
  for (const id of st.ids) {
    if (st.kept.includes(id)) continue;
    if (signal.aborted) return false;
    const url = abs(id), r = await fetch(url, { signal });
    if (!r.ok || !r.body) throw new Error('film ' + id + ' ' + r.status);
    // the bytes are counted as they come, so the bar moves inside a film too
    const rd = r.body.getReader(), parts: Uint8Array[] = []; let n = 0; const want = filmBytes(id);
    for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); n += value.length; onProgress(got + Math.min(n, want), st.total); }
    await c.put(url, new Response(new Blob(parts as BlobPart[], { type: r.headers.get('content-type') || 'video/mp4' }), { headers: { 'content-type': r.headers.get('content-type') || 'video/mp4' } }));
    // an older version of the same film is let go once the new one is kept
    for (const k of await c.keys()) if (k.url.includes(`/videos/films/${id}-`) && k.url !== url) await c.delete(k);
    got += want; onProgress(got, st.total);
  }
  return true;
}

/** free every kept film (Grown-ups → Offline voices → Light); the bytes freed */
export async function freeFilms() {
  let freed = 0; stopFilmDownload();
  try {
    if (!(await caches.keys()).includes(FILM_STORE)) return 0;
    const c = await caches.open(FILM_STORE);
    for (const k of await c.keys()) { const r = await c.match(k); if (r) freed += (await r.blob()).size; }
    await caches.delete(FILM_STORE);
  } catch (e) { }
  return freed;
}

// on mobile data (the voice pack's own test: a phone or tablet that cannot tell counts as mobile data)
const onMobile = () => import('./voicepack.js').then(m => m.packNet() === 'mobile').catch(() => false);
const offline = () => navigator.onLine === false;


// one download for the whole game: it goes on while the game is open, even when Story time closes or the tab is drawn again;
// every card shows it (Stop stops it, Go on goes on from the films already kept)
type Run = { ctl: AbortController, got: number, total: number, cards: Set<() => void>, end?: Promise<void> };
let RUN: Run | null = null;
function startRun(onEnd: (err: unknown, done: boolean) => void) {
  if (RUN) return RUN;
  const run: Run = RUN = { ctl: new AbortController(), got: 0, total: 1, cards: new Set() };
  run.end = downloadAllFilms((got, total) => { run.got = got; run.total = total; run.cards.forEach(f => f()); }, run.ctl.signal)
    .then(all => { if (RUN === run) RUN = null; onEnd(null, all); }, e => { if (RUN === run) RUN = null; onEnd(e, false); });
  return run;
}
export const stopFilmDownload = () => { if (RUN) { RUN.ctl.abort(); RUN = null; } };

/** put the card into Story time; nothing is shown when this device has no Blender film to offer */
export async function showFilmPack(slot: HTMLElement) {
  if (!featureOn('storyFilms', true)) return; // (with the films off the stories are picture books: nothing to download)
  const st0 = await filmPackState(); if (!st0.ids.length || !slot.isConnected) return;
  if (!document.getElementById('filmpack-css')) { const s = document.createElement('style'); s.id = 'filmpack-css'; s.textContent = CSS; document.head.appendChild(s); }
  const card = document.createElement('div'); card.className = 'filmpack'; card.setAttribute('role', 'group');
  card.setAttribute('aria-label', T('Download all films for offline', 'Tải tất cả phim để xem không cần mạng'));
  slot.replaceChildren(card);
  const paint = (line: string, pct: number | null, btns: string, done = false) => {
    card.classList.toggle('done', done);
    card.innerHTML = `${pic(done ? '✅' : '🎞️', 'fp-pic')}<span class="fp-txt"><b>${esc(T('Download all films for offline', 'Tải tất cả phim để xem không cần mạng'))}</b><small class="fp-line" role="status">${esc(line)}</small>${pct === null ? '' : `<span class="fp-bar" aria-hidden="true"><i style="width:${Math.max(2, Math.min(100, pct)).toFixed(1)}%"></i></span>`}</span><span class="fp-btns">${btns}</span>`;
  };
  const sizeLine = (s: Awaited<ReturnType<typeof filmPackState>>) => s.kept.length
    ? T(`${s.kept.length} of ${s.ids.length} films kept · ${mb(s.have)} of about ${mb(s.total)} MB`, `Đã giữ ${s.kept.length}/${s.ids.length} phim · ${mb(s.have)}/${mb(s.total)} MB`)
    : T(`${s.ids.length} films · about ${mb(s.total)} MB`, `${s.ids.length} phim · khoảng ${mb(s.total)} MB`);
  const idle = async (note = '') => {
    const s = await filmPackState(); if (!card.isConnected) return;
    if (RUN) { follow(RUN); return; }
    if (s.done) { paint(T(`All ${s.ids.length} films are on this device. They play with no internet.`, `Cả ${s.ids.length} phim đã ở trên máy này. Xem được không cần mạng.`), null, '', true); return; }
    const resume = s.kept.length > 0;
    paint(note || sizeLine(s), resume ? s.have / s.total * 100 : null, `<button type="button" class="fp-go"><span>${pic('📥')} ${esc(resume ? T('Go on', 'Tải tiếp') : T('Download', 'Tải về'))}</span></button>`);
    (card.querySelector('.fp-go') as HTMLElement).onclick = () => start();
  };
  // this card shows the shared download's progress until it ends or the card goes
  const follow = (run: Run) => {
    paint(T('Downloading…', 'Đang tải…'), run.got / run.total * 100, `<button type="button" class="fp-stop"><span>${pic('⏸')} ${esc(T('Stop', 'Dừng'))}</span></button>`);
    const show = () => { if (!card.isConnected) { run.cards.delete(show); return; } const bar = card.querySelector('.fp-bar i') as HTMLElement, line = card.querySelector('.fp-line');
      if (bar) bar.style.width = Math.max(2, run.got / run.total * 100).toFixed(1) + '%'; if (line) line.textContent = T(`Downloading… ${mb(run.got)} of about ${mb(run.total)} MB`, `Đang tải… ${mb(run.got)}/${mb(run.total)} MB`); };
    run.cards.add(show); show();
    (card.querySelector('.fp-stop') as HTMLElement).onclick = () => { run.cards.delete(show); stopFilmDownload(); idle(); };
    run.end!.then(() => { run.cards.delete(show); });
  };
  const start = async (asked = false) => {
    if (offline()) { idle(T('This needs the internet. Try again on Wi-Fi.', 'Cần có mạng. Hãy thử lại khi có Wi-Fi.')); return; }
    if (!asked && await onMobile()) { askMobile(); return; }
    const run = startRun(async (err, all) => {
      if (run.ctl.signal.aborted) return; // (stopped by Stop: that card has already drawn itself)
      if (err) { if (card.isConnected) idle(T('The download stopped (no internet?). Tap Go on to finish it.', 'Đã dừng tải (mất mạng?). Bấm Tải tiếp để tải nốt.')); return; }
      const s = await filmPackState();
      if (all && s.done) { const { sayAsync } = await import('./voice.js'); sayAsync('All the films are ready to watch with no internet!', 'Tất cả phim đã sẵn sàng để xem không cần mạng!').catch(() => { }); }
      if (card.isConnected) idle();
    });
    follow(run);
  };
  // a grown-up says yes with a press and hold, so a little one cannot by accident
  const askMobile = async () => {
    const s = await filmPackState();
    paint(T(`On mobile data. Download about ${mb(s.total - s.have)} MB? (Wi-Fi is better.)`, `Đang dùng dữ liệu di động. Tải khoảng ${mb(s.total - s.have)} MB? (Nên dùng Wi-Fi.)`), null,
      `<button type="button" class="fp-yes"><i class="fp-fill"></i><span>${esc(T('Grown-ups: hold for Yes', 'Người lớn: giữ để đồng ý'))}</span></button><button type="button" class="fp-no"><span>${esc(T('Not now', 'Để sau'))}</span></button>`);
    const yes = card.querySelector('.fp-yes') as HTMLElement, fill = card.querySelector('.fp-fill') as HTMLElement; let t: any = 0;
    const stop = () => { clearTimeout(t); fill.style.transition = 'none'; fill.style.width = '0'; };
    yes.addEventListener('pointerdown', ev => { ev.preventDefault(); fill.style.transition = 'width 1.2s linear'; fill.style.width = '100%'; t = setTimeout(() => start(true), 1200); });
    for (const k of ['pointerup', 'pointerleave', 'pointercancel']) yes.addEventListener(k, stop);
    yes.addEventListener('contextmenu', ev => ev.preventDefault());
    (card.querySelector('.fp-no') as HTMLElement).onclick = () => idle();
  };
  await idle();
}
