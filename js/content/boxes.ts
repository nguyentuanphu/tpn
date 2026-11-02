// Mystery boxes, collectibles and family rankings for 5 to 8 year olds at Medium or Hard (round S, owner plan 8 Oct:
// Round R Part 2 item 10). Pure data and rules, no DOM (tests/unit/boxes.test.mjs); the screens are in js/boxes.js.
//   boxes         one free box a day (AEST) and one more earned by finishing a quest (at most one a day); boxes are
//                 never sold, and a thing already in the book turns into stars
//   collectibles  fairies, dragons, stickers and decorations, kept in profile.collect = { id: how many times found }
//   rankings      the family on this device only: stars and quests, collections, kindness, learning
// Never real money: nothing here costs coins.

const n = o => o && typeof o === 'object' ? Object.keys(o).length : 0;
export const aestDay = (now = Date.now()) => Math.floor((now + 10 * 3600e3) / 864e5); // (a day in AEST, as js/kidplay.js)
// who gets them: big kids (5 to 8) playing at Medium or Hard
export const eligible = p => !!p && p.age === 'big' && (p.difficulty === 'medium' || p.difficulty === 'hard');

// rarity: how often it comes out of a box, and how many stars a second one is worth
export const RARITY = { common: { weight: 6, stars: 1 }, rare: { weight: 3, stars: 2 }, magic: { weight: 1, stars: 3 } };
export const KINDS = [
  { id: 'fairy', icon: '🧚', en: 'Fairies', vi: 'Nàng tiên' },
  { id: 'dragon', icon: '🐉', en: 'Dragons', vi: 'Rồng' },
  { id: 'sticker', icon: '🌟', en: 'Stickers', vi: 'Hình dán' },
  { id: 'deco', icon: '🏮', en: 'Decorations', vi: 'Đồ trang trí' }
];
// hue: the drawing is tinted (one drawing, many colours)
const C = (id, kind, icon, rare, en, vi, hue = 0) => ({ id, kind, icon, rare, en, vi, hue });
export const COLLECTIBLES = [
  C('f_rose', 'fairy', '🧚', 'common', 'Rose fairy', 'Tiên hoa hồng'),
  C('f_sky', 'fairy', '🧚', 'common', 'Sky fairy', 'Tiên bầu trời', 160),
  C('f_leaf', 'fairy', '🧚', 'common', 'Leaf fairy', 'Tiên lá xanh', 90),
  C('f_sun', 'fairy', '🧚', 'rare', 'Sunshine fairy', 'Tiên nắng', 40),
  C('f_moon', 'fairy', '🧚', 'rare', 'Moon fairy', 'Tiên mặt trăng', 220),
  C('f_lotus', 'fairy', '🪷', 'magic', 'Lotus fairy', 'Tiên hoa sen'),
  C('d_green', 'dragon', '🐉', 'common', 'Rice-field dragon', 'Rồng đồng lúa'),
  C('d_red', 'dragon', '🐉', 'common', 'Lantern dragon', 'Rồng đèn lồng', 250),
  C('d_blue', 'dragon', '🐉', 'common', 'River dragon', 'Rồng sông', 110),
  C('d_gold', 'dragon', '🐲', 'rare', 'Golden dragon', 'Rồng vàng', 300),
  C('d_cloud', 'dragon', '🐲', 'rare', 'Cloud dragon', 'Rồng mây', 180),
  C('d_rainbow', 'dragon', '🦄', 'magic', 'Rainbow dragon-horse', 'Ngựa rồng cầu vồng'),
  C('s_koala', 'sticker', '🐨', 'common', 'Koala sticker', 'Hình dán gấu túi'),
  C('s_roo', 'sticker', '🦘', 'common', 'Kangaroo sticker', 'Hình dán chuột túi'),
  C('s_turtle', 'sticker', '🐢', 'common', 'Turtle sticker', 'Hình dán rùa'),
  C('s_flamingo', 'sticker', '🦩', 'common', 'Flamingo sticker', 'Hình dán hồng hạc'),
  C('s_whale', 'sticker', '🐳', 'rare', 'Whale sticker', 'Hình dán cá voi'),
  C('s_peacock', 'sticker', '🦚', 'rare', 'Peacock sticker', 'Hình dán chim công'),
  C('s_rainbow', 'sticker', '🌈', 'magic', 'Rainbow sticker', 'Hình dán cầu vồng'),
  C('o_lantern', 'deco', '🏮', 'common', 'Red lantern', 'Đèn lồng đỏ'),
  C('o_chime', 'deco', '🎐', 'common', 'Wind chime', 'Chuông gió'),
  C('o_plant', 'deco', '🪴', 'common', 'Pot plant', 'Chậu cây'),
  C('o_lamp', 'deco', '🪔', 'rare', 'Little oil lamp', 'Đèn dầu nhỏ'),
  C('o_carp', 'deco', '🎏', 'rare', 'Carp streamer', 'Cờ cá chép'),
  C('o_teddy', 'deco', '🧸', 'magic', 'Golden teddy', 'Gấu bông vàng', 20)
];
export const CBY = Object.fromEntries(COLLECTIBLES.map(c => [c.id, c]));

// ---------- boxes ----------
// profile.boxes = { free: day the free box was last opened, earned: day a quest box was last earned, waiting: quest
// boxes not opened yet, stars: stars from second ones, opened: how many, last: how many quests were finished }
export const MAX_WAITING = 3;
export function boxState(p) {
  const B = p.boxes = p.boxes && typeof p.boxes === 'object' ? p.boxes : {};
  for (const k of ['waiting', 'stars', 'opened']) if (!Number.isFinite(B[k])) B[k] = 0;
  if (!p.collect || typeof p.collect !== 'object') p.collect = {};
  return B;
}
export const freeReady = (B, day) => B.free !== day;
export const ready = (B, day) => (freeReady(B, day) ? 1 : 0) + Math.max(0, B.waiting | 0);
// a quest was finished: one box, at most one a day
export function earn(B, day) { if (B.earned === day || B.waiting >= MAX_WAITING) return false; B.earned = day; B.waiting++; return true; }
// how many quests and story steps a child has finished (main adventure, lantern chapters, side stories)
export const questCount = (p, mainDone = 0) => (mainDone | 0) + n(p.lanterns && p.lanterns.done) + n(p.yard && p.yard.done);
// the count went up: a quest was finished (the first time only remembers it; switching which story to follow earns nothing)
export function questStep(B, day, count) {
  const before = B.last; B.last = Math.max(count, before | 0);
  return Number.isFinite(before) && count > before ? earn(B, day) : false;
}
// take a box to open: today's free one first
export function take(B, day) { if (freeReady(B, day)) { B.free = day; return 'free'; } if (B.waiting > 0) { B.waiting--; return 'quest'; } return null; }
// what comes out: rarer things less often (rand: a number 0 ≤ r < 1)
export function roll(rand = Math.random()) {
  const total = COLLECTIBLES.reduce((a, c) => a + RARITY[c.rare].weight, 0); let r = rand * total;
  for (const c of COLLECTIBLES) { r -= RARITY[c.rare].weight; if (r < 0) return c; }
  return COLLECTIBLES[COLLECTIBLES.length - 1];
}
// open one: { from, item, dup, stars } or null when there is no box; a second one of something becomes stars
export function openBox(p, day, rand = Math.random()) {
  const B = boxState(p), from = take(B, day); if (!from) return null;
  const item = roll(rand), dup = (p.collect[item.id] || 0) > 0, stars = dup ? RARITY[item.rare].stars : 0;
  p.collect[item.id] = (p.collect[item.id] || 0) + 1; B.stars += stars; B.opened++;
  return { from, item, dup, stars };
}

// ---------- rankings (the family on this device; friends online later: docs/cores/play.md) ----------
const winStars = w => (w >= 4 ? 3 : w >= 2 ? 2 : w >= 1 ? 1 : 0); // (as js/simple.js starsOf)
export const BOARDS = [
  { id: 'stars', icon: '⭐', en: 'Stars and quests', vi: 'Sao và nhiệm vụ' },
  { id: 'collect', icon: '📚', en: 'Collections', vi: 'Bộ sưu tập' },
  { id: 'kind', icon: '💗', en: 'Kindness', vi: 'Tốt bụng' },
  { id: 'learn', icon: '🎓', en: 'Learning', vi: 'Học hỏi' }
];
export function scores(p) {
  const q = Object.keys(p.quests || {}).filter(k => !/^(seen_|played_)/.test(k)).length + n(p.lanterns && p.lanterns.done) + n(p.yard && p.yard.done);
  const stars = Object.values(p.wins || {}).reduce((a, w) => a + winStars(w), 0) + n(p.tales) + ((p.boxes && p.boxes.stars) | 0);
  return {
    stars: stars + q,
    collect: n(p.collect) + (Array.isArray(p.stickers) ? p.stickers.length : 0) + n(p.postcards) + n(p.leafies) + n(p.found),
    // looking after others: feeding the companion, pets, chests opened with a friend, jobs given in the yard
    kind: ((p.lanterns && p.lanterns.pet && p.lanterns.pet.feeds) | 0) + (Array.isArray(p.pets) ? p.pets.length : 0) + n(p.chests) + n(p.yard && p.yard.jobs),
    learn: n(p.words) + n(p.learned) + n(p.tales) + n(p.levels)
  };
}
// the family on one board, best first (ties keep the order of the Who's playing screen)
export const rank = (list, board) => list.map((p, i) => ({ p, i, v: scores(p)[board] | 0 })).sort((a, b) => b.v - a.v || a.i - b.i);
