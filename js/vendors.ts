// The street-food sellers of the valley (data only: who they are, how they look, where their stall stands, what they
// say). Moved out of regions.js in architecture step 2 so js/snacks.js can read it without importing regions.js.
// region: bac | trung | nam | au.  word: index into VN_WORDS / AUSSIE_SLANG they like to teach first.
// (round T) each stall stands at an offset from its place's anchor in the map (js/content/map.js), so it moves with it
// (T1b, owner 11 Oct) the market stalls, the ice-cream van and the sausage sizzle stand in their place's one market row
// (js/content/map.js MARKET_ROWS, rowSlot): `row` is the slot the stall takes ({ place, i, d: its depth }); x, z, face
// is where its seller stands (behind the counter, looking at the street). Aussie Corner's shopkeepers stand at their
// own shop doors across the road.
import { anchorOf, rowSlot } from './content/map.js';
const from = id => (dx, dz) => { const [x, z] = anchorOf(id); return { x: x + dx, z: z + dz }; }, aussie = from('aussie');
// a seller `back` metres behind the middle of slot i (0: at it, like a seller with a shoulder pole), `side` metres to one end
const seller = (place, i, d, back, side = 0) => { const s = rowSlot(place, i, d); return { x: s.x - s.fx * back + s.ax * side, z: s.z - s.fz * back + s.az * side, face: s.face, row: { place, i, d } }; };
const stallAt = i => seller('market', i, 1.6, 1.4);
export const L = (style, color, hair, hairStyle, hat = 'none', skin = '#e8b48c') => ({ style, color, hair, hairStyle, hat, skin, back: 'none', glider: 0 });
export const VENDORS = [
  { id: 'bahai', name: 'Bà Hai', region: 'bac', look: L('aodai', '#7a4a8a', '#d8d8d8', 'buns'), ...stallAt(0), stall: ['#c0392b', '#f6e7c8'], sign: ['HANOI PHỞ', 'PHỞ HÀ NỘI'], goods: ['🍜', '🌿'], food: ['🍜', 'a bowl of phở (noodle soup)', 'bát phở', 6],
    greet: ["Come here, little one! A hot bowl of phở? Up north we call a bowl a 'bát'.", 'Cháu ơi, vào đây ăn bát phở nóng không? Ngon lắm đấy, ăn đi cháu!'], role: 'a kind grandma from Hà Nội in the north of Vietnam who sells phở and speaks with a northern accent (bát, thế, đấy, ạ)' },
  { id: 'cothu', name: 'Cô Thu', region: 'bac', look: L('aodai', '#e8d27a', '#1d1412', 'long', 'nonla'), ...seller('market', 1, 2.4, 0), pole: true, food: ['🟢', 'green rice flakes (cốm)', 'cốm làng Vòng', 4],
    greet: ['Cốm, fresh green rice flakes from Hà Nội! I carry everything on my shoulder pole.', 'Cốm đây! Cốm làng Vòng thơm lắm! Cô gánh hàng rong đi khắp phố đấy cháu ạ.'], role: 'a street seller from Hà Nội who carries her goods on a bamboo shoulder pole (gánh hàng rong)' },
  { id: 'olai', name: 'O Lài', region: 'trung', look: L('aodai', '#3cc7e8', '#1d1412', 'long', 'nonla'), ...stallAt(3), stall: ['#7a4aa8', '#f6e7c8'], sign: ['HUẾ RICE CAKES', 'BÁNH BÈO HUẾ'], goods: ['🥟', '🌶️'], food: ['🥟', 'bánh bèo (little steamed rice cakes)', 'bánh bèo', 5],
    greet: ["Hello! In Huế we say 'răng rứa' for 'why is that'. Would you like some bánh bèo?", 'Răng rứa con? Mi ăn chi? Bánh bèo Huế ngon lắm nờ, ăn thử một đọi đi!'], role: 'a cheerful aunt from Huế in central Vietnam who speaks with a central accent (răng, rứa, mô, tê, chi, o)' },
  { id: 'chunam', name: 'Chú Năm', region: 'trung', look: L('tunic', '#c0392b', '#2a2a2a', 'short'), ...stallAt(4), stall: ['#e8a33a', '#f6e7c8'], sign: ['HỘI AN LANTERNS', 'ĐÈN LỒNG HỘI AN'], goods: ['🏮', '👒'], food: ['🏮', 'a Hội An silk lantern', 'đèn lồng Hội An', 8],
    greet: ['These silk lanterns come from Hội An. At night the whole old town glows!', 'Đèn lồng Hội An đây! Tối tối cả phố cổ sáng rực, đẹp lắm mi ơi!'], role: 'a lantern maker from Hội An in central Vietnam' },
  { id: 'chutam', name: 'Chú Tám', region: 'nam', look: L('shirt', '#ffffff', '#1d1412', 'short', 'cap'), ...stallAt(6), stall: ['#3a78c8', '#f6e7c8'], sign: ['SÀI GÒN BÁNH MÌ', 'BÁNH MÌ SÀI GÒN'], goods: ['🥖', '🥒'], food: ['🥖', 'a bánh mì (crunchy bread roll)', 'ổ bánh mì', 5],
    greet: ["Hey there! Crunchy bánh mì, super yummy! Down south we say 'ngon bá cháy'!", 'Con ăn gì nè? Bánh mì nóng giòn nè, ngon bá cháy luôn đó con!'], role: 'a friendly bánh mì seller from Sài Gòn in the south who speaks with a southern accent (nè, nha, nghen, dzậy, bá cháy)' },
  { id: 'cout', name: 'Cô Út', region: 'nam', look: L('dress', '#5fd39a', '#1d1412', 'ponytail', 'nonla', '#e0aa80'), ...stallAt(8), stall: ['#2f9a5a', '#f6e7c8'], sign: ['COCONUTS · SWEET SOUP', 'NƯỚC DỪA · CHÈ'], goods: ['🥥', '🍧'], food: ['🥥', 'a cold coconut', 'trái dừa tươi', 5],
    greet: ['Fresh coconut from Bà Rịa! Cold and sweet. Down south a fruit is a "trái"!', 'Dừa tươi Bà Rịa nè con! Mát lạnh, ngọt lịm. Uống một trái nghen!'], role: 'a coconut and sweet soup seller from Bà Rịa in southern Vietnam' },
  { id: 'kelly', name: 'Mrs Kelly', region: 'au', look: L('dress', '#ff9f43', '#c98b4a', 'buns', 'none', '#ffe3d1'), ...aussie(-19, -5.4), face: 0, food: ['🍬', 'a bag of lollies', 'túi kẹo', 3],
    greet: ["G'day, love! After some lollies? Mixed lollies are heaps good this arvo!", 'Chào cháu! Mua kẹo không? Ở Úc, kẹo gọi là "lollies" đó!'], role: 'the friendly owner of an old-fashioned Australian milk bar (corner shop) who sells lollies, icy poles and milkshakes and uses Aussie slang' },
  { id: 'davo', name: 'Davo', region: 'au', look: L('shirt', '#3a78c8', '#6b4226', 'short', 'cap', '#ffe3d1'), ...aussie(-9, -5.4), face: 0, food: ['🍟', 'hot chips', 'khoai tây chiên', 5],
    greet: ["How ya going, mate? Hot chips with chicken salt! Watch out for the seagulls!", 'Khỏe không bạn? Khoai chiên nóng hổi nè! Coi chừng mấy con hải âu giành ăn đó!'], role: 'a cheerful Aussie fish and chip shop owner by the beach who says mate and no worries' },
  { id: 'bev', name: 'Aunty Bev', region: 'au', look: L('overalls', '#ff7eb8', '#e8e8e8', 'short', 'none', '#ffe3d1'), ...aussie(1, -5.4), face: 0, food: ['🥧', 'a meat pie', 'bánh pie nhân thịt', 6],
    greet: ['Morning, darl! A pie for brekkie? Or a lamington, they are ripper!', 'Chào con! Ăn bánh pie cho bữa sáng không? Bánh lamington cũng ngon tuyệt nha!'], role: 'a warm Australian baker who sells meat pies, sausage rolls and lamingtons' },
  { id: 'gazza', name: 'Gazza', region: 'au', look: L('shirt', '#f7c6d9', '#3b2618', 'spiky', 'cap', '#ffe3d1'), ...seller('aussie', 3.4, 2.4, .3, -3.7), food: ['🍦', 'a soft-serve ice cream', 'kem ốc quế', 4],
    greet: ['Ding ding! The ice-cream van is here! Soft serve with sprinkles? Too easy!', 'Đinh đoong! Xe kem tới rồi! Kem ốc quế rắc cốm màu nha? Dễ ợt!'], role: 'an Aussie ice-cream van driver who plays a jingle around the neighbourhood' },
  { id: 'robbo', name: 'Uncle Robbo', region: 'au', look: L('tunic', '#2f6a4f', '#8a8a8a', 'short', 'none', '#e0aa80'), ...seller('aussie', 20.7, 3, 1.6), food: ['🌭', 'a snag in bread', 'xúc xích kẹp bánh mì', 4],
    greet: ['Sausage sizzle! Snag in bread with sauce and onions, mate. Fair dinkum the best!', 'Xúc xích nướng đây! Kẹp bánh mì với tương cà và hành. Ngon thiệt sự!'], role: 'a jolly Aussie uncle running a weekend sausage sizzle at the park' }
];
