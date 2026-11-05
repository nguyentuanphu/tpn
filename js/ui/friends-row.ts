// (v1.08b friends) The small parts of choosing a friend that the Backpack and the editor need straight away: the friend
// pictures and cards, the spoken hellos, changing friend and outfit. The Welcome steps and the one-time card are in
// js/ui/friends-ui.ts, loaded only when needed (check startup: the first download stays under its limit).
import { T } from '../i18n.js';
import { say } from '../voice.js';
import { esc } from '../util.js';
import { FRIENDS, friendsOf, friendOf, suitId, suitInfo, friendLook, type FriendId } from '../content/friends.js';
import { pic } from '../art.js';
import { setOf } from '../content/shop.js';

export const friendPic = (id: string, view = 'f') => `icons/friends/${FRIENDS[id] ? id : 'finn'}-${view}.webp`;
// each friend's spoken hello, written out so the voice pack finds the lines (tools/voice-lines.mts)
export function sayHello(id: string) {
  if (id === 'finn') say("Hi, I'm Finn! Let's explore the sky!", 'Chào bạn, mình là Finn! Cùng khám phá bầu trời nhé!');
  else if (id === 'sol') say("Hi, I'm Sol! The sun is shining for us!", 'Chào bạn, mình là Sol! Mặt trời đang chiếu sáng cho chúng mình!');
  else if (id === 'clara') say("Hi, I'm Clara! Let's make the flowers bloom!", 'Chào bạn, mình là Clara! Cùng làm hoa nở nhé!');
  else if (id === 'lumi') say("Hi, I'm Lumi! Come and play in the leaves!", 'Chào bạn, mình là Lumi! Đến chơi trong vườn lá nhé!');
}
// a friend card: the friend turning slowly (front, three-quarter, side), the name and the title
export function friendCard(id: string, on: boolean, skin?: string) {
  const f = FRIENDS[id];
  return `<button class="fr-card${on ? ' on' : ''}" data-friend="${id}" aria-pressed="${on}" style="--fr:${f.color}">
    <span class="fr-turn">${['f', 'q', 's'].map(v => `<img src="${friendPic(id, v)}" alt="" draggable="false">`).join('')}<canvas class="fr-3d" width="240" height="312" data-f3d="${id}"></canvas></span>
    ${skin ? `<i class="fr-tone" style="background:${skin}"></i>` : ''}
    <b>${esc(T(f.en, f.vi))}</b><small>${esc(T(f.titleEn, f.titleVi))}</small></button>`;
}
// change friend (free, as often as the child likes; the other set only in Grown-ups). The worn outfit follows the friend
// when it was the old friend's own kind (an everyday stays an everyday).
export function setFriend(p, id: FriendId) {
  const L = p.look; if (!FRIENDS[id] || FRIENDS[id].set !== setOf(L)) return false;
  const old = L.friend; L.friend = id;
  if (typeof L.suit === 'string' && old && L.suit.startsWith(old + '-')) L.suit = suitId(id, L.suit.slice(old.length + 1));
  if (!L.suit) L.suit = suitId(id, 'everyday');
  return true;
}
/** the Backpack's friend row (html) */
export const friendRowHTML = p => `<div class="slots fr-row">${friendsOf(setOf(p.look)).map(id => `<button class="slot fr-slot${friendOf(p.look) === id ? ' on' : ''}" data-befriend="${id}" title="${esc(T(FRIENDS[id].en, FRIENDS[id].vi))}"><img src="${friendPic(id, 'face')}" alt=""><small>${esc(T(FRIENDS[id].en, FRIENDS[id].vi))}</small></button>`).join('')}</div>`;
// the outfits a child can wear now: their friend's everyday one, the ones bought for this friend, and the old clothes
// turned into outfits (any friend)
export const suitsOwned = p => { const f = friendOf(p.look), mine = (p.owned && p.owned.suits || []).filter(id => id.startsWith('c:') || id.startsWith(f + '-'));
  return [suitId(f, 'everyday'), ...mine.filter(id => id !== suitId(f, 'everyday'))].filter(id => suitInfo(id)); };
export function wearSuit(p, id: string) { if (!suitsOwned(p).includes(id)) return false; p.look.suit = id; return true; }
/** the Backpack's outfit row (html): a coloured outfit picture for each one owned */
export const suitRowHTML = p => {
  return `<div class="slots fr-suits">${suitsOwned(p).map(id => { const s = suitInfo(id), c = friendLook({ ...p.look, suit: id }).color, on = p.look.suit === id || (!suitInfo(p.look.suit) && id === suitsOwned(p)[0]);
    return `<button class="slot${on ? ' on' : ''}" data-suit="${esc(id)}" title="${esc(T(s.en, s.vi))}"><span class="fr-suit" style="--c:${c}">${pic('👕')}</span><small>${esc(T(s.en, s.vi))}</small></button>`; }).join('')}</div>`; };
