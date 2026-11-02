// The clothes shop and wardrobe (round S, owner plan 8 Oct: Round R Part 2 item 6). Pure data and rules, no DOM, so the
// unit tests can read it (tests/unit/shop.test.mjs) and js/avatar.js can draw what a child wears.
//   slots     hat, neck, top, bottom, feet, back (look.hat … look.back hold an item id, or 'none')
//   for       'g' (girls), 'b' (boys): about twice the old choice for each (owner: "about 2x for boys and girls"); (r79, owner
//             16 Oct: "a boy wears boys' clothes") nothing is shared any more: each thing that was for both is now the boys'
//             version under its old id and a girls' version under <id>_g (GIRL_OF), with its own colour
//   tier      small, nice, special: a nice thing costs about one day of play (owner: "about one day of play for a nice item")
// Hats and backs keep the old ids (cap, bow, wings, cape…), so a child who already wears one keeps it. Game coins only.

// about what a child earns in a day of play, in coins (xu): a few games (5–25 each), a shrine (20), the daily gift (15)
export const DAY_COINS = 70;
export const TIERS = { small: .4, nice: 1, special: 1.7 };
export const priceOf = it => Math.max(5, Math.round(DAY_COINS * (TIERS[it && it.tier] || 1) / 5) * 5);

export const SLOTS = [
  { id: 'hat', icon: '👒', en: 'Hats and nón', vi: 'Mũ và nón' },
  { id: 'neck', icon: '📿', en: 'Necklaces', vi: 'Vòng cổ' },
  { id: 'top', icon: '👕', en: 'Tops', vi: 'Áo' },
  { id: 'bottom', icon: '👖', en: 'Shorts, trousers and skirts', vi: 'Quần và váy' },
  { id: 'feet', icon: '👟', en: 'Shoes and sandals', vi: 'Giày và dép' },
  { id: 'back', icon: '🪽', en: 'On the back', vi: 'Sau lưng' }
];

// shape: how js/avatar.js draws it (and how the shop draws its picture); color, trim: its colours
const I = (id, slot, shape, color, tier, f, en, vi, trim) => ({ id, slot, shape, color, tier, for: f, en, vi, trim });
export const CLOTHES = [
  // hats and nón (the first six were free in the old wardrobe: a child who wears one keeps it)
  I('cap', 'hat', 'cap', '#e8434a', 'small', 'b', 'Red cap', 'Mũ lưỡi trai đỏ'),
  I('bow', 'hat', 'bow', '#ff5fa2', 'small', 'g', 'Hair bow', 'Nơ cài tóc'),
  I('flower', 'hat', 'flower', '#ff7eb8', 'small', 'g', 'Flower clip', 'Kẹp hoa'),
  I('bunny', 'hat', 'bunny', '#ffffff', 'nice', 'b', 'Bunny ears', 'Tai thỏ'),
  I('bunny_g', 'hat', 'bunny', '#ffd6e8', 'nice', 'g', 'Pink bunny ears', 'Tai thỏ hồng'),
  I('nonla', 'hat', 'nonla', '#ecd9a0', 'nice', 'b', 'Nón lá', 'Nón lá'),
  I('nonla_g', 'hat', 'nonla', '#f3e2b0', 'nice', 'g', 'Nón lá with a pink ribbon', 'Nón lá quai hồng', '#ff7eb8'),
  I('crown', 'hat', 'crown', '#ffcf3a', 'special', 'b', 'Golden crown', 'Vương miện vàng'),
  I('crown_g', 'hat', 'crown', '#ffd9a8', 'special', 'g', 'Rose-gold crown', 'Vương miện vàng hồng', '#ff5fa2'),
  I('beanie', 'hat', 'beanie', '#3b6fe0', 'small', 'b', 'Woolly beanie', 'Mũ len', '#ffffff'),
  I('bucket', 'hat', 'bucket', '#7fb069', 'nice', 'b', 'Bucket hat', 'Mũ tai bèo'),
  I('dino', 'hat', 'dino', '#5fd39a', 'special', 'b', 'Dinosaur hood', 'Mũ khủng long', '#ffd23f'),
  I('sunhat', 'hat', 'sunhat', '#f2d38a', 'nice', 'g', 'Straw sun hat', 'Mũ rơm đi nắng', '#ff7eb8'),
  I('tiara', 'hat', 'tiara', '#d8dde3', 'special', 'g', 'Sparkly tiara', 'Vương miện lấp lánh', '#a66bff'),
  I('catears', 'hat', 'catears', '#3b2618', 'nice', 'b', 'Cat ears', 'Tai mèo', '#ffb3cf'),
  I('catears_g', 'hat', 'catears', '#f4f0ea', 'nice', 'g', 'White cat ears', 'Tai mèo trắng', '#ff9ac8'),
  // necklaces
  I('pearls', 'neck', 'beads', '#fff8ee', 'nice', 'g', 'Pearl necklace', 'Vòng ngọc trai'),
  I('heart', 'neck', 'locket', '#ffcf3a', 'nice', 'g', 'Heart locket', 'Mặt dây trái tim', '#ff5fa2'),
  I('lei', 'neck', 'lei', '#ff9f43', 'small', 'b', 'Flower garland', 'Vòng hoa', '#ffd23f'),
  I('lei_g', 'neck', 'lei', '#ff7eb8', 'small', 'g', 'Pink flower garland', 'Vòng hoa hồng', '#ffffff'),
  I('shells', 'neck', 'beads', '#f6c7a5', 'small', 'b', 'Shell necklace', 'Vòng vỏ sò'),
  I('medal', 'neck', 'medal', '#ffcf3a', 'special', 'b', 'Gold medal', 'Huy chương vàng', '#3b6fe0'),
  I('scarf', 'neck', 'scarf', '#e8434a', 'small', 'b', 'Warm scarf', 'Khăn quàng ấm', '#ffffff'),
  I('scarf_g', 'neck', 'scarf', '#ff7eb8', 'small', 'g', 'Pink warm scarf', 'Khăn quàng hồng', '#ffffff'),
  // tops
  I('tee_red', 'top', 'tee', '#e8434a', 'small', 'b', 'Red T-shirt', 'Áo phông đỏ'),
  I('tee_stripe', 'top', 'tee', '#3b6fe0', 'nice', 'b', 'Sailor stripes', 'Áo sọc thủy thủ', '#ffffff'),
  I('footy', 'top', 'tee', '#5fd39a', 'nice', 'b', 'Footy jersey', 'Áo đá bóng', '#ffd23f'),
  I('hoodie_green', 'top', 'hoodie', '#5fa860', 'nice', 'b', 'Green hoodie', 'Áo nỉ xanh lá'),
  I('aodai_blue', 'top', 'aodai', '#3b6fe0', 'special', 'b', 'Blue áo dài', 'Áo dài xanh'),
  I('baba', 'top', 'tunic', '#2b2238', 'nice', 'b', 'Áo bà ba', 'Áo bà ba'),
  I('baba_g', 'top', 'tunic', '#9b3d6e', 'nice', 'g', 'Plum áo bà ba', 'Áo bà ba tím mận'),
  I('overalls_denim', 'top', 'overalls', '#4f7fc4', 'nice', 'b', 'Denim overalls', 'Quần yếm bò'),
  I('overalls_denim_g', 'top', 'overalls', '#ff9ac8', 'nice', 'g', 'Pink overalls', 'Quần yếm hồng'),
  I('tee_pink', 'top', 'tee', '#ff7eb8', 'small', 'g', 'Pink T-shirt', 'Áo phông hồng'),
  I('dress_yellow', 'top', 'dress', '#ffd23f', 'nice', 'g', 'Sunny dress', 'Váy vàng nắng', '#ffffff'),
  I('dress_purple', 'top', 'dress', '#a66bff', 'nice', 'g', 'Purple party dress', 'Váy tím dự tiệc', '#ffd23f'),
  I('hoodie_purple', 'top', 'hoodie', '#b48cff', 'nice', 'g', 'Purple hoodie', 'Áo nỉ tím'),
  I('aodai_pink', 'top', 'aodai', '#ff5fa2', 'special', 'g', 'Pink áo dài', 'Áo dài hồng'),
  // shorts, trousers and skirts
  I('shorts_navy', 'bottom', 'shorts', '#2f3a5a', 'small', 'b', 'Navy shorts', 'Quần soóc xanh đậm'),
  I('shorts_khaki', 'bottom', 'shorts', '#c9a66b', 'small', 'b', 'Explorer shorts', 'Quần soóc thám hiểm'),
  I('jeans', 'bottom', 'pants', '#4f7fc4', 'nice', 'b', 'Jeans', 'Quần bò'),
  I('jeans_g', 'bottom', 'pants', '#8fb4ea', 'nice', 'g', 'Light jeans', 'Quần bò xanh nhạt'),
  I('pants_white', 'bottom', 'pants', '#ffffff', 'nice', 'b', 'White áo dài trousers', 'Quần trắng mặc áo dài'),
  I('pants_white_g', 'bottom', 'pants', '#fff4f8', 'nice', 'g', 'White áo dài trousers (girls)', 'Quần trắng mặc áo dài (bé gái)'),
  I('pants_red', 'bottom', 'pants', '#c62828', 'nice', 'b', 'Red trousers', 'Quần đỏ'),
  I('skirt_pink', 'bottom', 'skirt', '#ff7eb8', 'small', 'g', 'Pink skirt', 'Chân váy hồng'),
  I('tutu', 'bottom', 'skirt', '#e9d6ff', 'nice', 'g', 'Ballet tutu', 'Váy múa ba lê'),
  I('leggings', 'bottom', 'pants', '#a66bff', 'small', 'g', 'Purple leggings', 'Quần tất tím'),
  // shoes and sandals
  I('sneakers_red', 'feet', 'shoe', '#e8434a', 'small', 'b', 'Red sneakers', 'Giày thể thao đỏ'),
  I('sneakers_blue', 'feet', 'shoe', '#3cc7e8', 'small', 'b', 'Blue sneakers', 'Giày thể thao xanh'),
  I('dep', 'feet', 'sandal', '#7a4a35', 'small', 'b', 'Dép (sandals)', 'Dép quai hậu'),
  I('dep_g', 'feet', 'sandal', '#d98aa8', 'small', 'g', 'Pink dép (sandals)', 'Dép quai hậu hồng'),
  I('boots', 'feet', 'boot', '#ffd23f', 'nice', 'b', 'Rain boots', 'Ủng đi mưa'),
  I('boots_g', 'feet', 'boot', '#ff7eb8', 'nice', 'g', 'Pink rain boots', 'Ủng đi mưa hồng'),
  I('maryjane', 'feet', 'shoe', '#ff5fa2', 'nice', 'g', 'Shiny shoes', 'Giày búp bê'),
  I('sandal_pink', 'feet', 'sandal', '#ff9ac8', 'small', 'g', 'Pink sandals', 'Dép hồng'),
  // on the back (wings and the cape were free before: a child who wears one keeps it)
  I('wings', 'back', 'wings', '#e9d6ff', 'nice', 'g', 'Fairy wings', 'Cánh tiên'),
  I('cape', 'back', 'cape', '#e8332a', 'nice', 'b', 'Hero cape', 'Áo choàng anh hùng'),
  I('butterfly', 'back', 'wings', '#ffb347', 'special', 'g', 'Butterfly wings', 'Cánh bướm'),
  I('dragon', 'back', 'dragonwings', '#5fbf4a', 'special', 'b', 'Dragon wings', 'Cánh rồng'),
  I('backpack', 'back', 'backpack', '#ff9f43', 'small', 'b', 'Little backpack', 'Ba lô nhỏ', '#ffd23f'),
  I('backpack_g', 'back', 'backpack', '#a66bff', 'small', 'g', 'Purple little backpack', 'Ba lô nhỏ màu tím', '#ffd23f'),
  I('shell', 'back', 'shell', '#5fa860', 'nice', 'b', 'Turtle shell', 'Mai rùa', '#a0724a'),
  I('shell_g', 'back', 'shell', '#5fbfb0', 'nice', 'g', 'Sea turtle shell', 'Mai rùa biển', '#c9a0e0'),
  // (owner, 12 Oct: tester rewards) earned only by testers (js/testerrewards.js), never sold in the shop
  { ...I('sleuthhat', 'hat', 'sleuth', '#8a6a3a', 'special', 'b', 'Bug hunter hat (with a magnifying glass)', 'Mũ săn bọ (có kính lúp)', '#7fd3ff'), tester: true },
  { ...I('sleuthhat_g', 'hat', 'sleuth', '#b07ad0', 'special', 'g', 'Bug hunter hat, purple (with a magnifying glass)', 'Mũ săn bọ màu tím (có kính lúp)', '#7fd3ff'), tester: true },
  { ...I('ladypack', 'back', 'backpack', '#e8332a', 'special', 'b', 'Ladybird backpack', 'Ba lô bọ rùa', '#2b2238'), tester: true },
  { ...I('ladypack_g', 'back', 'backpack', '#ff4f7a', 'special', 'g', 'Pink ladybird backpack', 'Ba lô bọ rùa hồng', '#2b2238'), tester: true },
  { ...I('sleuthcape', 'back', 'cape', '#6a4a8a', 'special', 'b', 'Detective cape', 'Áo choàng thám tử'), tester: true },
  { ...I('sleuthcape_g', 'back', 'cape', '#b05fa0', 'special', 'g', 'Detective cape, rose', 'Áo choàng thám tử màu hồng'), tester: true }
];
export const ITEM = Object.fromEntries(CLOTHES.map(x => [x.id, x]));
export const itemIn = (slot, id) => { const x = ITEM[id]; return x && x.slot === slot ? x : null; };
export const forSlot = slot => CLOTHES.filter(x => x.slot === slot && !x.tester); // (tester rewards are not sold)

// the two default outfits (owner: "only 2 default outfits, boy and girl"); hair is chosen when the character is made
export const DEFAULT_OUTFITS = {
  girl: { style: 'dress', color: '#ff5fa2', hat: 'none', neck: 'none', top: 'none', bottom: 'none', feet: 'none', back: 'none' },
  boy: { style: 'shirt', color: '#3b6fe0', hat: 'none', neck: 'none', top: 'none', bottom: 'none', feet: 'none', back: 'none' }
};
export const outfitOf = look => Object.keys(DEFAULT_OUTFITS).find(k => { const o = DEFAULT_OUTFITS[k]; return look && look.style === o.style && look.color === o.color; }) || null;

// ---------- what a child owns ----------
// profile.owned.clothes: the ids bought (or worn when the shop came: owner "existing players keep everything they wear")
// profile.owned.gifts: (r79, owner 16 Oct) clothes of the other set, bought only to give away: wrapped gift boxes in the
// Backpack (one id per box, the same id can be there twice), never worn by the child who bought them
// (r79) the things that were for both sets: their old id is the boys' version, <id>_g the girls' version
export const GIRL_OF = Object.fromEntries(CLOTHES.filter(x => x.for === 'g' && x.id.endsWith('_g') && ITEM[x.id.slice(0, -2)]).map(x => [x.id.slice(0, -2), x.id]));
export const BOY_OF = Object.fromEntries(Object.entries(GIRL_OF).map(([b, g]) => [g, b]));
// the version of a thing made for a set (a girl's crown is the rose-gold one)
export const versionFor = (id, set) => set === 'girl' ? GIRL_OF[id] || id : BOY_OF[id] || id;
const worn = look => SLOTS.map(s => look && look[s.id]).filter(id => id && id !== 'none' && ITEM[id]);
export function adoptWorn(p) {
  const o = p.owned = p.owned && typeof p.owned === 'object' ? p.owned : {};
  if (!Array.isArray(o.clothes)) o.clothes = [];
  if (!Array.isArray(o.gifts)) o.gifts = [];
  sortClothes(p);
  for (const id of worn(p.look)) if (!o.clothes.includes(id)) o.clothes.push(id);
  return o.clothes;
}
// (r79, owner 16 Oct: "boy wears boys clothes ... other genders clothes for gifting only") an older save's clothes are put
// right once: a thing that was for both sets becomes the child's own set's version (worn too); a thing made only for the
// other set comes off and is wrapped as a gift box in the Backpack. Nothing is lost. Safe to run any number of times.
export function sortClothes(p) {
  if (!p || !p.owned) return false;
  const o = p.owned, set = setOf(p.look), mine = set === 'girl' ? 'g' : 'b'; let changed = false;
  if (!Array.isArray(o.clothes)) o.clothes = [];
  if (!Array.isArray(o.gifts)) o.gifts = [];
  const keep = [];
  for (const id of o.clothes) {
    const it = ITEM[id]; if (!it) { keep.push(id); continue; }
    const v = versionFor(id, set);
    if (v !== id && ITEM[v] && ITEM[v].for === mine) { if (!keep.includes(v)) keep.push(v); changed = true; continue; }
    if (it.for !== mine) { o.gifts.push(id); changed = true; continue; }
    if (!keep.includes(id)) keep.push(id);
  }
  o.clothes = keep;
  if (p.look) for (const s of SLOTS) {
    const id = p.look[s.id], it = ITEM[id]; if (!it || it.for === mine) continue;
    const v = versionFor(id, set);
    if (ITEM[v] && ITEM[v].for === mine) { p.look[s.id] = v; if (!o.clothes.includes(v)) o.clothes.push(v); }
    else { p.look[s.id] = 'none'; if (!o.gifts.includes(id) && !o.clothes.includes(id)) o.gifts.push(id); }
    changed = true;
  }
  return changed;
}
// (a hat won another way, e.g. the crown for finishing every quest, is in owned.hats and counts too, in either version)
export const owns = (p, id) => !!p && !!p.owned && ((p.owned.clothes || []).includes(id) || (ITEM[id] && ITEM[id].slot === 'hat' && ((p.owned.hats || []).includes(id) || (p.owned.hats || []).includes(BOY_OF[id]))));
// buy: { ok, why: 'owned' | 'coins' | 'unknown', price, gift }; the caller takes the coins (G.addCoins(-price)) and saves.
// (r79) a thing made for the other set is wrapped as a gift box (gift: true); it can be bought again for another friend
export function buy(p, coins, id) {
  const it = ITEM[id]; if (!it) return { ok: false, why: 'unknown', price: 0 };
  const price = priceOf(it); adoptWorn(p);
  const gift = !forSet(it, setOf(p.look));
  if (!gift && owns(p, id)) return { ok: false, why: 'owned', price };
  if (!(coins >= price)) return { ok: false, why: 'coins', price };
  if (gift) { p.owned.gifts.push(id); return { ok: true, price, gift: true }; }
  p.owned.clothes.push(id); return { ok: true, price };
}
// put an owned thing of the child's own set on (or take the slot off with 'none')
export function wear(p, slot, id) {
  if (!SLOTS.some(s => s.id === slot)) return false;
  if (id !== 'none' && !(itemIn(slot, id) && owns(p, id) && forSet(ITEM[id], setOf(p.look)))) return false;
  p.look[slot] = id; return true;
}
// (r79) give a wrapped gift box to another child of the set it was made for: it leaves the giver's Backpack and joins the
// friend's clothes (a friend who already has one keeps the box as a gift to pass on). { ok, why: 'nogift' | 'set' }
export function giveGift(from, to, id) {
  const it = ITEM[id], i = (from && from.owned && from.owned.gifts || []).indexOf(id);
  if (!it || i < 0) return { ok: false, why: 'nogift' };
  if (!to || !forSet(it, setOf(to.look))) return { ok: false, why: 'set' };
  from.owned.gifts.splice(i, 1); adoptWorn(to);
  if (owns(to, id)) to.owned.gifts.push(id); else to.owned.clothes.push(id);
  return { ok: true };
}
// what js/avatar.js draws for a look: the item for each slot, or null
// (Round U, owner 11 Oct: "clothes should be as per gender, not unisex") a child's set: the one chosen when the character
// was made (look.set), or read from the starting outfit; the shop shows that set and the things for both first
export const setOf = look => (look && (look.set || outfitOf(look))) || (look && look.style === 'dress' ? 'girl' : 'boy');
// (r79, owner 16 Oct) nothing is shared: each thing is for one set ('both' is read as fitting either, for an old friend's game)
export const forSet = (it, set) => !it || it.for === 'both' || it.for === (set === 'girl' ? 'g' : 'b');
export const wearing = look => Object.fromEntries(SLOTS.map(s => [s.id, itemIn(s.id, look && look[s.id])]));
// (Round V, owner 13 Oct: "clothes can be gifted to the other sex or traded with the same sex") a trade's clothes: with a
// friend of the same set both ways (asking only for clothes of that set); to a friend of the other set only as a gift
// (nothing asked back) of clothes made for that friend's set (js/trade.js)
export function clothesOk(give, want, mySet, theirSet) {
  const g = give.clothes || [], w = want.clothes || [];
  if (!g.length && !w.length) return true;
  if (g.some(id => !ITEM[id]) || w.some(id => !ITEM[id])) return false;
  if (mySet === theirSet) return w.every(id => forSet(ITEM[id], mySet));
  // the other set: a gift only, of clothes made for the friend
  return !w.length && !Object.keys(want.items || {}).length && !want.coins && g.every(id => forSet(ITEM[id], theirSet));
}
