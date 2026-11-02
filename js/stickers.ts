// The sticker book (owner plan, 16 Oct 2026 AEDT, chat B; docs/plans-20261016/CHAT-B-STICKER-BOOK-PROMPT.md).
// One place that gives, keeps and counts stickers. Other systems only call give(id), has(id) and count():
//   import { give, has, count } from './stickers.js';
//   give('hen');            // the child playing now gets the hen sticker (once; again = maybe a shiny copy)
//   give('hen', hero);      // a given child (a hero, or a profile)
//   has('hen'); count();    // does the child have it; how many different stickers they have
// The list is js/content/stickers.js. A child's book is kept in their profile:
//   stickerBook = { v: 1, got: { id: { t, n, shiny? } }, fresh: { id: 1 } (the "New!" badges), prizes: { 'farm.0': t } }
// Nothing older is moved or changed (UX-009): places, postcards, treasures, dishes, festivals, secrets, surprises and
// the older reward stickers (profile.stickers) stay where they were, and sync() puts what they already hold into the
// book. The first sync of an older save adds no "New!" badges; later ones do (something earned the old way).
// The logic here runs in Node too (tests/unit/stickers.test.mjs); the valley's sounds, words and effects are loaded
// only in the browser (attach()).
import { STICKERS, BY_ID, THEMES, PAGES, SHINY_CHANCE, FIRST_THREE, BOOK_LINES } from './content/stickers.js';

let G = null, fx = null;
const profileOf = who => (who && who.profile) ? who.profile : who && typeof who === 'object' ? who : (G && G.heroes && G.heroes[0] ? G.heroes[0].profile : null);
const heroOf = p => (G && G.heroes ? G.heroes.find(h => h.profile === p) : null) || null;
const obj = x => (x && typeof x === 'object' && !Array.isArray(x)) ? x : {};

/** a child's book, made on first use (older saves have none) */
export function book(p) {
  if (!p) return { v: 1, got: {}, fresh: {}, prizes: {} };
  const b = p.stickerBook = obj(p.stickerBook);
  b.got = obj(b.got); b.fresh = obj(b.fresh); b.prizes = obj(b.prizes);
  return b;
}

// does the profile already hold this way of earning (the older records, read only)
function holds(p, w) {
  if (w.prize) return Array.isArray(p.stickers) && p.stickers.includes(w.prize);
  if (w.enter) return !!(obj(p.placeStickers)[w.enter] || obj(p.visited)[w.enter]);
  if (w.postcard) return !!obj(p.postcards)[w.postcard];
  if (w.find) return !!obj(p.found)[w.find];
  if (w.cook) return obj(p.dishes)[w.cook] != null;
  if (w.taste) return !!obj(p.tasted)[w.taste];
  if (w.fest) return !!obj(p.festivals)[w.fest];
  if (w.secret) return !!obj(p.secrets)[w.secret];
  if (w.surprise) return !!obj(obj(p.surprises).found)[w.surprise];
  if (w.tower) return !!obj(p.towers)[w.tower];
  if (w.stamp) return !!obj(p.stamps)[w.stamp];
  return false; // meet and act happen only now (give() from the event)
}

/** put what the older records already hold into the book; returns how many were added (no New! on the first sync) */
export function sync(who) {
  const p = profileOf(who); if (!p) return 0;
  const b = book(p), first = !b.v; let n = 0;
  for (const s of STICKERS) if (!b.got[s.id] && s.earn.some(w => holds(p, w))) { b.got[s.id] = { t: Date.now(), n: 1 }; if (!first) b.fresh[s.id] = 1; n++; }
  b.v = 1;
  return n;
}

/** does the child have this sticker */
export function has(id, who) { const p = profileOf(who); if (!p) return false; sync(p); return !!book(p).got[id]; }
/** how many different stickers the child has */
export function count(who) { const p = profileOf(who); if (!p) return 0; sync(p); return Object.keys(book(p).got).length; }
/** the stickers still showing "New!" (STK-5) */
export function freshIds(who) { const p = profileOf(who); return p ? Object.keys(book(p).fresh).filter(id => BY_ID[id]) : []; }
/** the child looked at it (tapped it): the "New!" badge goes */
export function seen(id, who) { const p = profileOf(who); if (p && book(p).fresh[id]) { delete book(p).fresh[id]; save(); } }
export const isShiny = (id, who) => { const p = profileOf(who); return !!(p && (book(p).got[id] || {}).shiny); };

/**
 * give a sticker. The first time it goes into the book with a "New!" badge; earned again, 1 in 20 turns it shiny.
 * Returns { id, first, shiny } or null (no child, or no such sticker).
 * @param {string} id  @param {any} [who] a hero or a profile (default: the child playing now)  @param {{ rnd?: () => number, quiet?: boolean, from?: any }} [o]
 */
export function give(id, who, o = {}) {
  const p = profileOf(who), s = BY_ID[id]; if (!p || !s) return null;
  sync(p);
  const b = book(p), had = b.got[id];
  let shiny = false;
  if (had) { had.n = (had.n || 1) + 1; if (!had.shiny && (o.rnd || Math.random)() < SHINY_CHANCE) { had.shiny = Date.now(); shiny = true; } }
  else { b.got[id] = { t: Date.now(), n: 1 }; b.fresh[id] = 1; }
  save();
  const r = { id, first: !had, shiny };
  if ((r.first || r.shiny) && !o.quiet && fx) fx.earned(p, s, r, o.from);
  return r;
}

// ---------- pages ----------
export const pageCount = (page, who) => { const p = profileOf(who); if (!p) return 0; sync(p); const g = book(p).got; return page.stickers.filter(s => g[s.id]).length; };
export const pageFull = (page, who) => pageCount(page, who) === page.stickers.length;
/** STK-3: a page with nothing on it gets its welcome sticker (once, only when empty); returns the sticker or null */
export function welcome(page, who) {
  const p = profileOf(who); if (!p || pageCount(page, p) > 0) return null;
  const s = page.stickers.find(x => x.starter); if (!s) return null;
  give(s.id, p, { quiet: true });
  return s;
}
/** the decoration a full page gives (a keepsake for the child's house, js/myhouse.js DECOR) */
export const decorKey = page => `sb_${page.theme}_${page.n}`;
/** a full page's prize, once: a golden frame (the page shows it), the theme's song and a decoration for the house */
export function claimPrize(page, who) {
  const p = profileOf(who); if (!p || !pageFull(page, p)) return null;
  const b = book(p); if (b.prizes[page.key]) return null;
  b.prizes[page.key] = Date.now();
  const decor = decorKey(page);
  p.keepsakes = Array.isArray(p.keepsakes) ? p.keepsakes : [];
  if (!p.keepsakes.includes(decor)) p.keepsakes.push(decor);
  save();
  const t = THEMES.find(x => x.id === page.theme);
  return { page: page.key, decor, song: t.song, theme: t };
}
export const prizeWon = (page, who) => { const p = profileOf(who); return !!(p && book(p).prizes[page.key]); };

function save() { if (G && G.save) G.save(); }

// ---------- in the valley ----------
/**
 * main.js: who is playing (G.heroes), saving, toasts, and the events that give stickers. Effects come from the
 * browser-only part (the sound, the spoken name, the flying sticker from js/feel.js when chat A's work is merged).
 */
export function attach(game) {
  G = game;
  if (typeof window === 'undefined') return;
  G.stickerBadges = () => fx && fx.badges(); // (the Pad calls it when a New! badge goes)
  G.stickerFx = () => fx; // (tests)
  import('./stickerfx.js').then(m => { fx = m.createStickerFx(G, { BOOK_LINES, FIRST_THREE }); }).catch(e => console.warn('sticker effects', e));
}
/** a tap on an animal in the valley (js/fun.js): its kind from js/animals.js, or 'duck', 'chicken', 'butterfly', 'bird' */
export function meet(kind, hero, from) {
  for (const s of STICKERS) if (s.earn.some(w => w.meet === kind)) give(s.id, hero, { from });
}
/** something a child did at an interactable (InteractionStarted): talking to someone, a ferry, a hutch */
export function acted(itId, hero) {
  if (!itId) return;
  for (const s of STICKERS) if (s.earn.some(w => w.act && (w.act === itId || (w.act.endsWith('*') && itId.startsWith(w.act.slice(0, -1)))))) give(s.id, hero);
}
/** the pages, for the book's screen */
export { PAGES, THEMES, BY_ID };
