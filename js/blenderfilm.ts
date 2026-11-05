// The five Blender films (round v1.08c, blender helper; owner's answer 3 Nov 2026 AEDT: "refined in the game, plus five
// films made in Blender as videos"): Bánh Chưng Bánh Giầy, Chú Cuội, Tấm Cám, Thánh Gióng and The Rainbow Serpent.
// Each is a 720p video drawn in Blender from the same pages as the game's own film (tools/blender/scene-export.mts and
// storypage.py, the costume kit's people), with the four friends telling the story at the start and the end.
// - It is downloaded only when its story is opened, and then kept on the device (the "sv-films" store), never in the
//   first download or the Wi-Fi pack. Played from the kept copy, it works with no internet.
// - With no internet and no kept copy, the story plays the game's own 3D film instead (js/film.ts).
// - The narration is the story's own words in the child's language, from the voice pack (the female voices), as with
//   the game's film; the video has no voice of its own, so one video serves English and Vietnamese.
// - The child's help moments stay: the video stops with the tap ring and goes on after the tap (or after 7 s by itself).
// It plays like a film (the same page(), narrated(), onSay and close() as js/film.ts), so the theatre (js/tales.ts) treats
// both the same way. Loaded only when one of the five stories opens.
import { BLENDER_FILMS, BLENDER_FOR_ALL, filmBytes } from './content/blenderfilms.js';
import { featureOn, releaseOn, liveRule } from './custom.js';
import { testerLevel } from './content/tester.js';
import { T } from './i18n.js';
import { sayAsync } from './voice.js';
import { SFX } from './audio.js';
import { el, esc } from './util.js';
import { pic } from './art.js';
import { reduceMotion } from './state.js';

// the films' own cache: not the game's (an update never deletes it, sw.ts) and never the install list
export const FILM_STORE = 'sv-films';
const STORE = FILM_STORE;
export const blenderFilmUrl = (id: string) => { const f = BLENDER_FILMS[id]; return f ? `videos/films/${id}-${f.v}.mp4` : null; };
export const hasBlenderFilm = (id: string) => !!BLENDER_FILMS[id];

// (v1.08f films, owner 6 Nov 2026 AEDT) who sees which film: the five for everyone (each its own Studio switch,
// blenderFilm_<id>, on for the five and off for the rest, so the owner can open the others one by one); every other listed
// film only on a tester device while Studio's "Blender films for testers" is on. Everyone else gets the in-game film.
export function isTesterDevice() {
  let me = ''; try { me = localStorage.getItem('sv2_playerid') || ''; } catch (e) { }
  return !!testerLevel(releaseOn('tester', false), liveRule('tester'), me);
}
export function filmOpen(id: string) {
  if (!BLENDER_FILMS[id] || !featureOn('blenderFilms', true)) return false;
  if (releaseOn(`blenderFilm_${id}`, BLENDER_FOR_ALL.includes(id))) return true;
  return releaseOn('blenderFilmsTesters', false) && isTesterDevice();
}
/** the films this device may play (and so may download all at once) */
export const myFilms = () => Object.keys(BLENDER_FILMS).filter(filmOpen);

/** the video for a story: the kept copy, else the internet (kept for next time while it plays); null when neither can be had */
export async function videoFor(id: string): Promise<{ src: string, kept: boolean } | null> {
  const url = blenderFilmUrl(id); if (!url) return null;
  const abs = new URL(url, location.href).href;
  try {
    const c = await caches.open(STORE), hit = await c.match(abs);
    if (hit) return { src: URL.createObjectURL(await hit.blob()), kept: true };
    if (navigator.onLine === false) return null;
    // a quick look that the file is there (a phone with no signal answers false to nothing): the video then streams,
    // and the whole file is kept behind it for the next time
    const head = await Promise.race([fetch(abs, { method: 'HEAD' }), new Promise<null>(r => setTimeout(() => r(null), 6000))]);
    if (!head || !head.ok) return null;
    fetch(abs).then(r => { if (r.ok) return c.put(abs, r).then(() => forgetOld(c, id)); }).catch(() => { });
    return { src: abs, kept: false };
  } catch (e) { return null; }
}
// an older version of the same film is let go once the new one is kept
async function forgetOld(c: Cache, id: string) { const now = new URL(blenderFilmUrl(id)!, location.href).href; for (const k of await c.keys()) if (k.url.includes(`/videos/films/${id}-`) && k.url !== now) await c.delete(k); }

type FilmApi = { page: (k: number) => Promise<void>, narrated: () => void, close: () => void, onSay?: (en: string, vi: string, kind: string) => Promise<unknown> | unknown, now?: any, video?: HTMLVideoElement };

/** a film that plays the Blender video, page by page */
export function createVideoFilm(stage: HTMLElement, id: string, src: string): FilmApi | null {
  const F = BLENDER_FILMS[id]; if (!F) return null;
  const v = document.createElement('video'); v.className = 'th-film th-video'; v.src = src; v.muted = true; v.playsInline = true; v.preload = 'auto';
  v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.disablePictureInPicture = true;
  stage.appendChild(v);
  const help = el('div', 'film-help'); help.hidden = true; stage.appendChild(help);
  const ring = el('div', 'film-ring'); ring.hidden = true; stage.appendChild(ring);
  const calm = reduceMotion();
  let alive = true, cur: any = null;
  const rate = () => (window as any).__svFilmRate || 1;
  const api: FilmApi = {
    video: v,
    get now() { return cur; },
    page(k: number) {
      if (cur) cur.stop();
      const P = F.pages[Math.min(k, F.pages.length - 1)];
      return new Promise<void>(done => {
        let narrated = false, hold: any = null, ended = false, helped = !P.help, timer: any = 0;
        const end = () => { if (ended) return; ended = true; v.pause(); v.removeEventListener('timeupdate', tick); done(); };
        const release = (byChild: boolean) => {
          if (!hold) return; clearTimeout(timer); hold = null; help.hidden = true; ring.hidden = true; helped = true;
          if (byChild) { SFX.ok ? SFX.ok() : SFX.tap(); }
          if (alive && !ended) v.play().catch(() => { });
        };
        const ask = () => {
          const h = P.help; hold = h; v.pause();
          help.innerHTML = `<span class="fh-hand">${pic('👆')}</span><b>${esc(T(h.en, h.vi))}</b>`; help.hidden = false;
          // the picture fills the stage (object-fit: cover): the ring goes where that point of the picture is shown
          const W = stage.clientWidth, Hh = stage.clientHeight, vw = v.videoWidth || 1280, vh = v.videoHeight || 720, k = Math.max(W / vw, Hh / vh);
          ring.style.left = ((W - vw * k) / 2 + h.x / 100 * vw * k) + 'px'; ring.style.top = ((Hh - vh * k) / 2 + h.y / 100 * vh * k) + 'px'; ring.hidden = false;
          Promise.resolve(api.onSay ? api.onSay(h.en, h.vi, 'help') : sayAsync(h.en, h.vi)).catch(() => { }).finally(() => { if (hold === h) timer = setTimeout(() => release(false), 7000 / rate()); });
        };
        const tick = () => {
          if (!alive || ended) return;
          if (!helped && !hold && v.currentTime >= P.help.t) { if (narrated) ask(); else { v.pause(); waiting = true; } }
          if (v.currentTime >= P.e - .04) end();
        };
        let waiting = false;
        cur = { stop: end, release, get hold() { return hold; }, narrate() { narrated = true; if (waiting) { waiting = false; ask(); } }, P, get ended() { return ended; } };
        v.addEventListener('timeupdate', tick);
        const go = () => { v.currentTime = P.s; v.playbackRate = Math.min(16, rate()); v.play().catch(() => { }); };
        if (v.readyState >= 1) go(); else v.addEventListener('loadedmetadata', go, { once: true });
        // a video that will not play (a broken file, a phone that refuses) never stops the story
        v.addEventListener('error', end, { once: true });
        if (calm) v.style.transition = 'none';
      });
    },
    narrated() { if (cur) cur.narrate(); },
    close() { alive = false; if (cur) cur.stop(); v.pause(); v.removeAttribute('src'); v.load(); if (src.startsWith('blob:')) URL.revokeObjectURL(src); v.remove(); help.remove(); ring.remove(); }
  };
  // a tap answers the help moment
  v.addEventListener('pointerup', () => { if (cur && cur.hold) cur.release(true); });
  ring.addEventListener('pointerup', () => { if (cur && cur.hold) cur.release(true); });
  return api;
}
