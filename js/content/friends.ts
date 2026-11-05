// (v1.08b friends) The four new friends: boys Finn and Sol, girls Clara and Lumi (owner, 3 Nov 2026 AEDT, plan
// docs/plans/new-friends-characters.md). Pure data and rules, no DOM, so the unit tests and the checks can read it.
//   look.friend   'finn' | 'sol' | 'clara' | 'lumi': which friend the child plays as (the look, not a new name)
//   look.skin     one of the five skin tones (state.ts SKIN), kept from the old look
//   look.suit     the outfit worn: '<friend>-<kind>' or 'c:<old top id>' (an old top turned into an outfit of its colour)
// The old look fields (style, color, hair, hairStyle, top, bottom ...) stay in the save untouched: friendLook() only
// changes the copy the builder draws, so the game can always go back to them.
import { setOf, ITEM } from './shop.js';

export type FriendId = 'finn' | 'sol' | 'clara' | 'lumi';
export type Friend = { id: FriendId, set: 'boy' | 'girl', en: string, vi: string, titleEn: string, titleVi: string,
  helloEn: string, helloVi: string, hair: string, hairStyle: string, style: string, color: string, legs: string, shoe: string,
  accent: string, handEn: string, handVi: string };
const F = (id: FriendId, set: 'boy' | 'girl', titleEn, titleVi, helloEn, helloVi, hair, hairStyle, style, color, legs, shoe, accent, handEn, handVi): Friend =>
  ({ id, set, en: id[0].toUpperCase() + id.slice(1), vi: id[0].toUpperCase() + id.slice(1), titleEn, titleVi, helloEn, helloVi, hair, hairStyle, style, color, legs, shoe, accent, handEn, handVi });
// colours read from the gallery renders (docs/artifacts/sparkle-valley-characters/img/<id>-front.jpg)
export const FRIENDS: Record<FriendId, Friend> = {
  finn: F('finn', 'boy', 'Sky Explorer', 'Nhà thám hiểm bầu trời', "Hi, I'm Finn! Let's explore the sky!", 'Chào bạn, mình là Finn! Cùng khám phá bầu trời nhé!',
    '#3d4b7e', 'spiky', 'tunic', '#2f8f86', '#f3e6c8', '#8a5a3a', '#e0b04a', 'Compass', 'La bàn'),
  sol: F('sol', 'boy', 'Sun Keeper', 'Người giữ mặt trời', "Hi, I'm Sol! The sun is shining for us!", 'Chào bạn, mình là Sol! Mặt trời đang chiếu sáng cho chúng mình!',
    '#e0762a', 'spiky', 'shirt', '#f6c13a', '#6b4226', '#9a6a3a', '#fff3d6', 'Sun crystal', 'Pha lê mặt trời'),
  clara: F('clara', 'girl', 'Bloom Keeper', 'Người giữ hoa', "Hi, I'm Clara! Let's make the flowers bloom!", 'Chào bạn, mình là Clara! Cùng làm hoa nở nhé!',
    '#f08a7a', 'long', 'dress', '#b89ae0', '#9ab07a', '#8a5a3a', '#fff0f4', 'Flower staff', 'Gậy hoa'),
  lumi: F('lumi', 'girl', 'Leaf Sprite', 'Tiên lá', "Hi, I'm Lumi! Come and play in the leaves!", 'Chào bạn, mình là Lumi! Đến chơi trong vườn lá nhé!',
    '#7aa65a', 'short', 'overalls', '#9ab86a', '#9ab86a', '#c0603a', '#ffd23f', 'Star lantern', 'Đèn sao')
};
export const FRIEND_IDS = Object.keys(FRIENDS) as FriendId[];
export const friendsOf = (set: string): FriendId[] => FRIEND_IDS.filter(id => FRIENDS[id].set === (set === 'girl' ? 'girl' : 'boy'));
// boys go to Finn, girls to Clara (owner's answer 1)
export const defaultFriend = (set: string): FriendId => set === 'girl' ? 'clara' : 'finn';
// the friend a look plays as: its own when it fits the child's set, otherwise the default of that set (an old save, a gender
// changed in Grown-ups, or an online friend on an older version)
export const friendOf = (look): FriendId => { const f = look && look.friend, set = setOf(look); return FRIENDS[f] && FRIENDS[f].set === set ? f : defaultFriend(set); };

// ---------- outfits (owner's answer 3: they replace top + bottom) ----------
// each friend has four kinds; the everyday one is free and worn first
export const SUIT_KINDS = [
  { kind: 'everyday', en: 'Everyday', vi: 'Hằng ngày', price: 0 },
  { kind: 'aodai', en: 'Áo dài', vi: 'Áo dài', price: 120 },
  { kind: 'festival', en: 'Festival', vi: 'Lễ hội', price: 120 },
  { kind: 'rain', en: 'Rain day', vi: 'Ngày mưa', price: 70 }
];
// what the builder draws for each kind (style + main colour + legs), per friend
const SUIT_LOOK: Record<string, Record<FriendId, [string, string, string]>> = {
  aodai: { finn: ['aodai', '#2f6fb8', '#ffffff'], sol: ['aodai', '#e0a020', '#ffffff'], clara: ['aodai', '#d86aa0', '#ffffff'], lumi: ['aodai', '#5aa66a', '#ffffff'] },
  festival: { finn: ['tunic', '#c8383a', '#f3e6c8'], sol: ['tunic', '#e8602a', '#6b4226'], clara: ['dress', '#ff7eb8', '#fff0f4'], lumi: ['dress', '#ffcf3a', '#9ab86a'] },
  rain: { finn: ['hoodie', '#ffcf3a', '#3a5a8a'], sol: ['hoodie', '#3cc7e8', '#3a5a8a'], clara: ['hoodie', '#a66bff', '#9ab07a'], lumi: ['hoodie', '#5fd39a', '#3a5a8a'] }
};
export const suitId = (f: FriendId, kind: string) => `${f}-${kind}`;
export const suitsOf = (f: FriendId) => SUIT_KINDS.map(s => ({ ...s, id: suitId(f, s.kind) }));
// an old top or bottom turned into an outfit of the same colour (free, owner's answer 3)
export const oldSuitId = (itemId: string) => 'c:' + itemId;
export function suitInfo(id: string) {
  if (typeof id !== 'string') return null;
  if (id.startsWith('c:')) { const it = ITEM[id.slice(2)]; return it ? { id, kind: 'old', color: it.color, en: it.en, vi: it.vi, price: 0 } : null; }
  const [f, kind] = id.split('-'), s = SUIT_KINDS.find(k => k.kind === kind);
  return FRIENDS[f] && s ? { ...s, id, friend: f as FriendId } : null;
}
// what the code builder draws for a child: their friend's hair, clothes and colours over a copy of the look
// (hats, neck, back, feet and badge stay the child's own). A look with no friend (a villager) is returned as it is.
export function friendLook(look) {
  if (!look || !look.friend) return look;
  const f = FRIENDS[friendOf(look)], s = suitInfo(look.suit);
  let style = f.style, color = f.color, legs = f.legs;
  if (s && s.kind === 'old') color = s.color;
  else if (s && s.kind !== 'everyday' && SUIT_LOOK[s.kind]) [style, color, legs] = SUIT_LOOK[s.kind][f.id];
  return { ...look, friend: f.id, hair: f.hair, hairStyle: f.hairStyle, style, color, legs, shoe: f.shoe, top: 'none', bottom: 'none' };
}
// (an old save) turn the tops and bottoms bought into outfits of the same colour, once; nothing is taken away
export function adoptOldClothes(p): string[] {
  const owned = p.owned || (p.owned = {}), had = (owned.clothes || []).filter(id => ITEM[id] && (ITEM[id].slot === 'top' || ITEM[id].slot === 'bottom'));
  owned.suits = Array.isArray(owned.suits) ? owned.suits : [];
  const made = had.map(oldSuitId).filter(id => !owned.suits.includes(id));
  owned.suits.push(...made);
  return made;
}
// the one-time move of an old save to the new friends (state.ts normalizeProfile): sets look.friend from look.set (or the
// clothes, as the shop guesses it), keeps the skin tone and every old field, and marks the "New friends are here!" card
export function migrateFriend(p) {
  const L = p.look || (p.look = {});
  if (L.friend && FRIENDS[L.friend]) { if (FRIENDS[L.friend].set !== setOf(L)) L.friend = defaultFriend(setOf(L)); return false; }
  if (!L.set) L.set = setOf(L);
  L.friend = defaultFriend(L.set);
  const made = adoptOldClothes(p);
  if (!L.suit) L.suit = made[0] || suitId(L.friend, 'everyday');
  p.friendCard = 'due';
  if (made.length) p.newSuits = made.length; // (the card says "Old clothes became new outfits")
  return true;
}
