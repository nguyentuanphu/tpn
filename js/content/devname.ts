// A device's easy name (owner, 13 Oct AEDT: "which device belongs to whom"): made from its random id (sv2_playerid),
// the same every time and the same in the game (Grown-ups → Analytics → This device) and in Studio's lists, so a
// grown-up can read it on the device and find it in Studio. No data: three words from the id.
export const EASY_COLOUR = [['Red', 'Đỏ'], ['Blue', 'Xanh'], ['Green', 'Lục'], ['Gold', 'Vàng'], ['Pink', 'Hồng'], ['Purple', 'Tím'], ['Orange', 'Cam'], ['Silver', 'Bạc']];
export const EASY_ANIMAL = [['Koala', 'Gấu túi'], ['Panda', 'Gấu trúc'], ['Turtle', 'Rùa'], ['Fox', 'Cáo'], ['Owl', 'Cú'], ['Dolphin', 'Cá heo'], ['Rabbit', 'Thỏ'], ['Tiger', 'Hổ'], ['Duck', 'Vịt'], ['Kangaroo', 'Chuột túi'], ['Buffalo', 'Trâu'], ['Lotus', 'Sen']];
export function easyName(id, lang = 'en') {
  let h = 0; for (const c of String(id || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = EASY_ANIMAL[h % EASY_ANIMAL.length], c = EASY_COLOUR[(h >>> 4) % EASY_COLOUR.length], n = (h >>> 8) % 90 + 10;
  return lang === 'vi' ? `${a[1]} ${c[1]} ${n}` : `${c[0]} ${a[0]} ${n}`;
}
