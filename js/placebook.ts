// The sticker book from places (round E): one sticker for every place in the valley (13 places and 7 cities). The
// first time a child walks into a place, its sticker goes into their book. It is the first system that only listens to
// the event bus (architecture step 1): main.js says "PlayerEnteredVillage", this file gives the sticker and says
// "StickerEarned"; neither calls the other. Places a child visited before round E are filled in when the book opens.
// The stickers are also in the scrapbook tray (js/fun.js), to stick on a page. Since the sticker book (16 Oct, chat B)
// they are its Places pages (js/content/stickers.js); this file still keeps placeStickers for older saves and the tray.
import { T } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { REGION_NAMES, CITIES } from './world.js';
import { events } from './core/events.js';
import { id as makeId, parse } from './core/ids.js';
import { pic } from './art.js';
import { esc } from './util.js';
import { give } from './stickers.js';

const PLACE_ICON = { village: '🪷', town: '🏠', market: '🛒', aussie: '🦘', china: '🏮', india: '🪔', home: '🌻', paddies: '🌾', lake: '🦢', bamboo: '🎋', mountain: '🏔️', meadow: '🌼', plateau: '🌄' };
// every place, in the order of the book: the farm and the valley first, then the villages, then the cities
export const PLACES = [...Object.keys(PLACE_ICON).map(id => ({ id, icon: PLACE_ICON[id] })), ...CITIES.map(c => ({ id: c.id, icon: c.icon || '🏙️' }))];
export const placeName = place => (REGION_NAMES[place] ? REGION_NAMES[place]() : place);

/** the stickers this child has: { placeId: time } (older saves: filled from the places they visited) */
export function placeStickers(p) {
  const s = p.placeStickers = p.placeStickers || {};
  for (const k of Object.keys(p.visited || {})) if (!s[k] && PLACES.some(x => x.id === k)) s[k] = 1;
  return s;
}

export function createPlaceBook(G, { toast, save }) {
  events.on('PlayerEnteredVillage', ({ playerId, villageId }) => {
    const place = (parse(villageId) || {}).name, h = G.heroes.find(x => makeId('player', x.profile.id || 'guest') === playerId);
    if (!h || !place || !PLACES.some(x => x.id === place)) return;
    const s = placeStickers(h.profile); if (s[place]) return;
    s[place] = Date.now(); save();
    // (sticker book, chat B 16 Oct) the place's sticker is shown by the sticker book like every new sticker
    // (js/stickers.js give(), js/stickerfx.js): its sound, its picture and "A new sticker for your book!"
    give('place_' + place, h);
    events.emit('StickerEarned', { playerId, stickerId: makeId('sticker', 'place', place), placeId: villageId });
  });
}

// the book's page in the Pad's album: every place, a sticker where the child has been, a "?" where not yet
export function placeBookHTML(p) {
  const s = placeStickers(p), n = PLACES.filter(x => s[x.id]).length;
  return `<h3>${pic('📒')} ${T('Places sticker book', 'Sổ hình dán các nơi')} ${n}/${PLACES.length}</h3><div class="secrets placebook">${PLACES.map(x => s[x.id]
    ? `<button class="sec on" data-place="${x.id}"><span>${pic(x.icon)}</span><small>${esc(placeName(x.id))}</small></button>`
    : `<button class="sec" data-placehint="${x.id}"><span>❔</span><small>${T('Not yet', 'Chưa đến')}</small></button>`).join('')}</div>`;
}
export function bindPlaceBook(body, toast) {
  body.querySelectorAll('[data-place]').forEach(b => b.onclick = () => { SFX.tap(); const n = placeName(b.dataset.place); say(n, n); });
  body.querySelectorAll('[data-placehint]').forEach(b => b.onclick = () => { SFX.tap(); const n = placeName(b.dataset.placehint); toast(T(`Visit ${n} to get this sticker!`, `Hãy đến ${n} để có hình dán này!`)); say('Go there to get this sticker!', 'Hãy đến đó để có hình dán này nhé!'); });
}
