// Surprises (round S, owner plan 8 Oct, ROUND-R item 5): small, kind, cheap things that turn up now and then, at most
// about 3 in a play session, and never "missed": one is chosen only when it can be enjoyed, appears only when the child
// is free (no window, game or speech box open) and close by, and waits there (or follows the child) until it is found.
// Each gives a sticker or a keepsake for the child's house. Pure data and choosing only (no page, no 3D): unit tests.
//   where   'near' (a few metres in front of the child) or 'pond' (Lotus Village's lotus pond)
//   when    'night' (shooting stars), 'rain' (just after a shower: the rainbow), 'map' (a piece a day), 'chest' (all 3 pieces)
//   weight  how often it is picked among the ones that can be (rare ones are 1)
export const SURPRISES = [
  { id: 'lotus', icon: '🪷', where: 'pond', weight: 1, keepsake: 'sp_lotus', sticker: '🪷', en: 'Rainbow lotus', vi: 'Hoa sen cầu vồng',
    say: ['Look! A rainbow lotus is blooming on the pond. It only opens once in a while.', 'Nhìn kìa! Một bông sen cầu vồng đang nở trên ao. Lâu lâu nó mới nở một lần.'] },
  { id: 'butterfly', icon: '🦋', where: 'near', weight: 3, sticker: '🦋', en: 'Golden butterfly', vi: 'Bướm vàng',
    say: ['A golden butterfly! Follow it and see where it lands.', 'Một chú bướm vàng! Đi theo xem bướm đậu ở đâu nhé.'] },
  { id: 'map', icon: '🗺️', where: 'near', weight: 3, when: 'map', en: 'Treasure map piece', vi: 'Mảnh bản đồ kho báu',
    say: ['A piece of an old treasure map! Find all three pieces, one each day.', 'Một mảnh bản đồ kho báu cũ! Tìm đủ ba mảnh, mỗi ngày một mảnh nhé.'] },
  { id: 'chest', icon: '🧰', where: 'near', weight: 9, when: 'chest', keepsake: 'sp_chest', en: 'Treasure chest', vi: 'Rương kho báu',
    say: ['The three map pieces fit together! The treasure chest is right here.', 'Ba mảnh bản đồ ghép lại rồi! Rương kho báu ở ngay đây.'] },
  { id: 'glade', icon: '🍄', where: 'near', weight: 2, keepsake: 'sp_fairyring', en: 'Hidden path to the fairy glade', vi: 'Lối bí mật tới khu rừng tiên',
    say: ['Glowing stepping stones! A hidden path. Where does it go?', 'Những viên đá phát sáng! Một lối đi bí mật. Lối này dẫn tới đâu nhỉ?'] },
  { id: 'rainbow', icon: '🌈', where: 'near', weight: 9, when: 'rain', sticker: '🌈', en: 'Rainbow after the rain', vi: 'Cầu vồng sau mưa',
    say: ['The end of the rainbow is right here! Touch it.', 'Chân cầu vồng ở ngay đây nè! Chạm vào đi.'] },
  { id: 'stars', icon: '🌠', where: 'near', weight: 9, when: 'night', sticker: '🌙', en: 'Shooting stars', vi: 'Sao băng',
    say: ['Shooting stars! Quick, make a wish.', 'Sao băng kìa! Nhanh lên, ước một điều đi.'] },
  { id: 'crane', icon: '🦢', where: 'near', weight: 1, visitor: 'crane', keepsake: 'sp_crane', en: 'A visiting crane', vi: 'Chú sếu ghé thăm',
    say: ['A red-crowned crane has come to visit! Say hello.', 'Một chú sếu đầu đỏ ghé thăm! Chào sếu đi.'] },
  { id: 'koala', icon: '🐨', where: 'near', weight: 1, visitor: 'koala', keepsake: 'sp_koala', en: 'A visiting koala', vi: 'Gấu koala ghé thăm',
    say: ['A koala came all the way from Australia to visit! Say hello.', 'Một bạn koala từ nước Úc đến chơi! Chào koala đi.'] },
  { id: 'fairy', icon: '🧚', where: 'near', weight: 1, visitor: 'fairy', keepsake: 'sp_wand', en: 'A visiting fairy', vi: 'Cô tiên ghé thăm',
    say: ['A little fairy is here! She has a present for you.', 'Một cô tiên nhỏ đến nè! Cô có quà cho con.'] }
];
// the keepsakes these give, for the child's house (js/myhouse.js DECOR, added at start by js/surprises.js)
export const SP_KEEPSAKES = {
  sp_lotus: { icon: '🪷', en: 'Rainbow lotus (surprise)', vi: 'Sen cầu vồng (bất ngờ)' },
  sp_chest: { icon: '🧰', en: 'Treasure chest (map)', vi: 'Rương kho báu (bản đồ)' },
  sp_fairyring: { icon: '🍄', en: 'Fairy ring of mushrooms', vi: 'Vòng nấm của tiên' },
  sp_crane: { icon: '🦢', en: 'Crane feather', vi: 'Lông sếu' },
  sp_koala: { icon: '🐨', en: 'Toy koala', vi: 'Koala đồ chơi' },
  sp_wand: { icon: '🪄', en: 'Fairy wand', vi: 'Đũa tiên' }
};
export const SP_LINES = {
  found: ['You found a surprise! It goes in your sticker book.', 'Con tìm được một điều bất ngờ! Nó vào sổ hình dán của con nhé.'],
  keepsake: ['You found a surprise! Put it in your house.', 'Con tìm được một điều bất ngờ! Đặt nó trong nhà con nhé.'],
  piece: ['Another map piece! Come back tomorrow for the next one.', 'Thêm một mảnh bản đồ! Mai quay lại tìm mảnh tiếp nhé.'],
  landed: ['It landed on a flower. Touch it gently.', 'Bướm đậu trên bông hoa rồi. Chạm nhẹ thôi nhé.'],
  glade: ['A fairy glade! The fairies left you a ring of mushrooms.', 'Khu rừng tiên! Các cô tiên để lại cho con một vòng nấm.'],
  wish: ['I hope your wish comes true!', 'Mong điều ước của con thành sự thật!'],
  waiting: ['A surprise is still waiting for you!', 'Vẫn còn một điều bất ngờ đang chờ con!']
};
export const SESSION_MAX = 3;    // at most about 3 a session
export const FIRST_AFTER = 150;  // seconds of free play before the first one
export const GAP = 300;          // seconds of free play between two

/** which surprises can come now. ctx: { night, afterRain, nearPond, mapPieces, mapToday (a piece found today), chest (opened), done: { id: true } this session } */
export function eligible(ctx = {}) {
  const pieces = ctx.mapPieces || 0, done = ctx.done || {};
  return SURPRISES.filter(s => !done[s.id] && (
    s.when === 'night' ? !!ctx.night : s.when === 'rain' ? !!ctx.afterRain : s.when === 'map' ? pieces < 3 && !ctx.mapToday
      : s.when === 'chest' ? pieces >= 3 && !ctx.chest : s.where === 'pond' ? !!ctx.nearPond : true));
}
/**
 * the next surprise to bring, or null. state: { shown (this session), lastAt (play seconds when the last came; -1e9 none), pending }
 * ctx as eligible(), plus play (seconds of free play this session) and rnd (0..1, for tests).
 * Timely ones (the rainbow after rain, stars at night, the chest) come first; the others by weight.
 */
export function pickSurprise(state, ctx = {}) {
  if (state.pending || state.shown >= SESSION_MAX) return null;
  const play = ctx.play || 0;
  if (play < FIRST_AFTER || play - (state.lastAt ?? -1e9) < GAP) return null;
  const can = eligible(ctx); if (!can.length) return null;
  const timely = can.filter(s => s.when === 'rain' || s.when === 'night' || s.when === 'chest');
  if (timely.length) return timely[0].id;
  const total = can.reduce((a, s) => a + s.weight, 0); let r = (ctx.rnd ?? Math.random()) * total;
  for (const s of can) { r -= s.weight; if (r < 0) return s.id; }
  return can[can.length - 1].id;
}
/** a surprise was put in the valley: it counts now (it waits until found, so it is never missed) */
export const surpriseShown = (state, id, play) => ({ ...state, shown: state.shown + 1, lastAt: play, pending: id });
/** found: nothing pending any more */
export const surpriseFound = state => ({ ...state, pending: null });
