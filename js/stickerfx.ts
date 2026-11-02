// The sticker book in the valley (owner plan, 16 Oct 2026 AEDT, chat B): the browser-only half of js/stickers.js.
//  - listens for what gives stickers: walking into a place, talking to someone (InteractionStarted), and every couple of
//    seconds reads what the older systems kept (postcards, treasures, dishes, festivals, secrets, surprises, reward
//    stickers), so nothing in those systems had to change;
//  - shows a new sticker: its sound, a toast with its picture, "A new sticker for your book!", and the flying sticker of
//    js/feel.js (chat A); the "New!" count on the Bag button;
//  - the first minutes (S6): Grandpa Owl's sticker soon after a new child starts, the place they start in, and a hen;
//  - the prize decorations of full pages, for the child's house (js/myhouse.js DECOR, as keepsakes).
import { T } from './i18n.js';
import { say, sayAsync, sayIn } from './voice.js';
import { SFX, animalCall } from './audio.js';
import { settings } from './state.js';
import { events } from './core/events.js';
import { id as makeId, parse } from './core/ids.js';
import { STICKERS, BY_ID, THEMES, PAGES } from './content/stickers.js';
import { reward as feelReward } from './feel.js'; // (chat A: the sticker flies into its counter)
import { give, sync, freshIds, acted, decorKey, book } from './stickers.js';

const ANIMAL_CALLS = new Set(['moo', 'quack', 'woof', 'meow', 'baa', 'oink', 'cluck', 'neigh', 'ribbit', 'hoot']);
/** a sticker's own sound (S8, STK-6): an animal's call, or its chime */
export function playSound(s) { try { if (ANIMAL_CALLS.has(s.sound)) animalCall(s.sound, 1.2); else (SFX[s.sound] || SFX.chime)(); } catch (e) { } }
/** its name in both languages, with the recorded voice: the chosen language first, then the other (STK-6) */
export async function sayName(s) {
  try { await sayAsync(s.en, s.vi); if (!settings.bilingual && s.en !== s.vi) sayIn(settings.lang === 'vi' ? 'en' : 'vi', settings.lang === 'vi' ? s.en : s.vi); } catch (e) { }
}


export function createStickerFx(G, { BOOK_LINES, FIRST_THREE }) {
  // the prize decorations: one per page, in the house's chooser once won (keepsakes, like the festival hunt's)
  // (loaded after start: js/myhouse.js loads js/ui.js, which loads this file; a static import would be a circle, check arch)
  import('./myhouse.js').then(({ DECOR }) => { for (const page of PAGES) {
    const t = THEMES.find(x => x.id === page.theme), k = decorKey(page);
    if (!DECOR[k]) DECOR[k] = { icon: t.decor[0], price: 0, en: t.decor[1] + (page.of > 1 ? ` (${page.n + 1})` : ''), vi: t.decor[2] + (page.of > 1 ? ` (${page.n + 1})` : ''), keepsake: true, wall: true };
  } }).catch(e => console.warn('sticker book decorations', e));

  const heroBy = p => G.heroes.find(h => h.profile === p) || null;
  const hudOf = h => (h && G.huds && G.huds[G.heroes.indexOf(h)]) || null;
  // the "New!" count on the Bag button (the Pad opens there; its Stickers tab shows the same count)
  const badge = h => {
    const hud = hudOf(h); if (!hud || !hud.q) return;
    const b = hud.q('.dk.bag'); if (!b) return;
    const n = freshIds(h.profile).length; let s = b.querySelector('.stk-count');
    if (!n) { if (s) s.remove(); return; }
    if (!s) { s = document.createElement('b'); s.className = 'stk-count'; b.appendChild(s); }
    s.textContent = n > 99 ? '99+' : String(n);
    s.setAttribute('aria-label', T(`${n} new stickers`, `${n} hình dán mới`));
  };
  const badges = () => G.heroes.forEach(badge);
  let quietUntil = 0, lastSay = 0;
  function earned(p, s, r, from) {
    const h = heroBy(p);
    if (h) badge(h);
    if (performance.now() < quietUntil) return; // (a big sync, e.g. many earned at once: one toast, not twenty)
    playSound(s);
    // (owner, 17 Oct AEDT: the drawing's code showed as words) the HUD's toast is plain text, so only words go in it;
    // the sticker's picture flies to the Bag below
    const toast = G.toast && h ? m => G.toast(h, m) : () => { };
    toast(`${r.shiny ? T('Shiny sticker:', 'Hình dán lấp lánh:') : T('New sticker:', 'Hình dán mới:')} ${T(s.en, s.vi)}`);
    if (performance.now() - lastSay > 4000) { lastSay = performance.now(); const L = r.shiny ? BOOK_LINES.shiny : BOOK_LINES.newOne; say(L[0], L[1]); }
    if (h) { try { const hud = hudOf(h), to = hud && hud.q && hud.q('.dk.bag'); feelReward('sticker', from || null, to || null); } catch (e) { } }
  }

  // ---- what gives stickers ----
  // walking into a place (Hội An too, which the older places book does not have)
  events.on('PlayerEnteredVillage', ({ playerId, villageId }) => {
    const place = (parse(villageId) || {}).name, h = G.heroes.find(x => makeId('player', x.profile.id || 'guest') === playerId);
    if (h && place && BY_ID['place_' + place] && !book(h.profile).got['place_' + place]) give('place_' + place, h); // (once: walking in again is not a new sticker)
  });
  // talking to someone, riding a ferry, feeding the bunny … (main.js says InteractionStarted with the interactable's id)
  events.on('InteractionStarted', ({ playerId, it }) => {
    const h = G.heroes.find(x => makeId('player', x.profile.id || 'guest') === playerId); if (h) acted(it, h);
  });
  // what the older systems kept (postcards, treasures, dishes, festivals, secrets, surprises, older reward stickers):
  // read every 2 seconds; the first read of an older save is quiet (no badges: they had them already)
  const known = new Map();
  const poll = () => {
    for (const h of G.heroes) {
      const p = h.profile; if (!p) continue;
      const first = !(p.stickerBook && p.stickerBook.v);
      const before = new Set(Object.keys(book(p).got));
      if (sync(p) && !first) {
        const added = Object.keys(book(p).got).filter(id => !before.has(id));
        if (added.length > 3) quietUntil = 0;
        added.slice(0, 1).forEach(id => earned(p, BY_ID[id], { id, first: true, shiny: false }));
        if (added.length > 1) { quietUntil = performance.now() + 500; }
        G.save && G.save();
      }
      if (first) G.save && G.save();
      badge(h); if (!known.has(p)) known.set(p, Date.now());
      // (S6) about 8 seconds after a child starts playing: Grandpa Owl's welcome sticker, once per child
      if (Date.now() - known.get(p) > 7000 && !G.paused) firstMinutes(h);
    }
  };
  setInterval(poll, 2000);

  // ---- the first minutes (S6, STK-3): Grandpa Owl's sticker, the first place, a hen ----
  function firstMinutes(h) {
    const p = h.profile, b = book(p); if (b.welcomed) return;
    b.welcomed = Date.now();
    if (!b.got[FIRST_THREE[0]]) give(FIRST_THREE[0], h); // Grandpa Owl gives his own sticker as a welcome
  }
  // a hen comes to say hello near the start if the child has not met one after 3 minutes of play
  const fm = { played: 0 }; // (seconds of play; tests/run.mjs moves it on)
  setInterval(() => {
    if (G.paused) return; fm.played += 5;
    if (fm.played < 180 || fm.played > 300) return;
    for (const h of G.heroes) if (h.profile && h.profile.stickerBook && !book(h.profile).got.hen && !book(h.profile).henCame) {
      book(h.profile).henCame = Date.now(); G.save && G.save();
      G.fx && G.fx(h.pos.x + 1.2, h.pos.y + 1, h.pos.z + 1.2, '🐔'); SFX.cluck && SFX.cluck();
      give('hen', h);
    }
  }, 5000);

  return { earned, badges, poll, firstMinutes: fm };
}
export { STICKERS };
