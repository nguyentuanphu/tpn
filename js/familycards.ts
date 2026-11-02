// Family postcards (round E): photos the grown-ups add in Sparkle Studio → Family album (content/custom.json "album",
// pictures in content/album/) arrive as postcards when a child walks into the place chosen for each one. Like the
// places sticker book, this only listens to the event bus ("PlayerEnteredVillage") and says "PostcardEarned".
// A child's postcards are kept in their profile (familyCards: { id: time }); the album page shows them, and tapping one
// opens it big, with its words read aloud (a recording when Studio made one, else the device's voice).
import { T } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { customAlbum } from './custom.js';
import { events } from './core/events.js';
import { id as makeId, parse } from './core/ids.js';
import { pic } from './art.js';
import { el, esc } from './util.js';
import { placeName } from './placebook.js';

const cards = () => customAlbum();
export const familyCards = p => (p.familyCards = p.familyCards || {});

export function createFamilyCards(G, { toast, save }) {
  events.on('PlayerEnteredVillage', ({ playerId, villageId }) => {
    const place = (parse(villageId) || {}).name, h = G.heroes.find(x => makeId('player', x.profile.id || 'guest') === playerId);
    if (!h || !place) return;
    const mine = familyCards(h.profile), now = cards().filter(c => c.place === place && !mine[c.id]);
    if (!now.length) return;
    now.forEach(c => { mine[c.id] = Date.now(); events.emit('PostcardEarned', { playerId, postcardId: makeId('postcard', 'family', c.id), placeId: villageId }); });
    save(); SFX.chime && SFX.chime();
    toast(h, `💌 ${now.length > 1 ? T(`${now.length} postcards from your family!`, `${now.length} bưu thiếp từ gia đình!`) : T('A postcard from your family!', 'Một bưu thiếp từ gia đình!')}`);
    say('A postcard from your family!', 'Một bưu thiếp từ gia đình!');
  });
}

// the album page's section (nothing at all when the family has not added photos)
export function familyCardsHTML(p) {
  const all = cards(); if (!all.length) return '';
  const mine = familyCards(p), n = all.filter(c => mine[c.id]).length;
  return `<h3>${pic('💌')} ${T('Postcards from the family', 'Bưu thiếp từ gia đình')} ${n}/${all.length}</h3><div class="famcards">${all.map(c => mine[c.id]
    ? `<button class="famcard on" data-fam="${esc(c.id)}"><img src="${esc(c.photo)}" alt=""><small>${esc(T(c.en, c.vi))}</small></button>`
    : `<button class="famcard" data-famhint="${esc(c.place)}"><span>${pic('💌')}</span><small>${esc(placeName(c.place))}</small></button>`).join('')}</div>`;
}
export function bindFamilyCards(body, toast) {
  body.querySelectorAll('[data-fam]').forEach(b => b.onclick = () => { SFX.tap(); const c = cards().find(x => x.id === b.dataset.fam); if (c) openCard(c); });
  body.querySelectorAll('[data-famhint]').forEach(b => b.onclick = () => { SFX.tap(); const n = placeName(b.dataset.famhint); toast(T(`A postcard is waiting in ${n}!`, `Có một bưu thiếp đang chờ ở ${n}!`)); say('A postcard is waiting for you there!', 'Có một bưu thiếp đang chờ con ở đó!'); });
}
// one postcard, big: the photo, a stamp, the words; tap anywhere to close
export function openCard(c) {
  const d = el('div', 'famview', `<div class="famcard-big"><img src="${esc(c.photo)}" alt=""><div class="fam-stamp">${pic('💌')}</div><p>${esc(T(c.en, c.vi))}</p></div>`);
  document.body.appendChild(d);
  d.onclick = () => { SFX.tap(); d.classList.add('out'); setTimeout(() => d.remove(), 200); };
  if (c.en || c.vi) say(c.en || c.vi, c.vi || c.en); // (the family's words: Studio's missing-lines inbox can record them)
  return d;
}
