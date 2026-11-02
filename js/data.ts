// Items, recipes, shop, quests and stickers.
import { T } from './i18n.js';
import { GATHER_AT, anchorOf } from './content/map.js';

export const ITEMS = {
  apple: { icon: '🍎', name: () => T('Apple', 'Táo') },
  banana: { icon: '🍌', name: () => T('Banana', 'Chuối') },
  mango: { icon: '🥭', name: () => T('Mango', 'Xoài') },
  rice: { icon: '🌾', name: () => T('Rice', 'Gạo') },
  egg: { icon: '🥚', name: () => T('Egg', 'Trứng') },
  fish: { icon: '🐟', name: () => T('Fish', 'Cá') },
  herb: { icon: '🌿', name: () => T('Herbs', 'Rau thơm') },
  mushroom: { icon: '🍄', name: () => T('Mushroom', 'Nấm') },
  noodles: { icon: '🍜', name: () => T('Rice noodles', 'Bánh phở') },
  leaf: { icon: '🍃', name: () => T('Banana leaf', 'Lá dong') },
  bean: { icon: '🫘', name: () => T('Mung beans', 'Đậu xanh') }
};

// Recipes are checked by the set of ingredients (order does not matter).
// heal = hearts restored, bonus = extra (yellow) stamina wheels.
export const RECIPES = [
  { id: 'pho', icon: '🍲', need: ['noodles', 'herb', 'egg'], name: () => T('Phở (noodle soup)', 'Phở'), heal: 3, bonus: .5 },
  { id: 'banhchung', icon: '🟩', need: ['rice', 'bean', 'leaf'], name: () => T('Bánh chưng (square rice cake)', 'Bánh chưng'), heal: 3, bonus: 1 },
  { id: 'xoixoai', icon: '🥭', need: ['rice', 'mango'], name: () => T('Xôi xoài (mango sticky rice)', 'Xôi xoài'), heal: 2, bonus: .5 },
  { id: 'chechuoi', icon: '🍧', need: ['banana', 'bean'], name: () => T('Chè chuối (banana sweet soup)', 'Chè chuối'), heal: 2, bonus: .3 },
  { id: 'canhchua', icon: '🥣', need: ['fish', 'herb'], name: () => T('Canh chua (sour fish soup)', 'Canh chua cá'), heal: 2, bonus: .3 },
  { id: 'comchien', icon: '🍳', need: ['rice', 'egg'], name: () => T('Egg fried rice', 'Cơm chiên trứng'), heal: 2, bonus: 0 },
  { id: 'comnam', icon: '🍚', need: ['rice', 'mushroom'], name: () => T('Mushroom rice', 'Cơm nấm'), heal: 2, bonus: 0 },
  { id: 'cakho', icon: '🐟', need: ['fish', 'rice'], name: () => T('Cá kho (braised fish) with rice', 'Cá kho với cơm'), heal: 2, bonus: .2 },
  { id: 'taonuong', icon: '🍎', need: ['apple', 'apple'], name: () => T('Baked apples', 'Táo nướng'), heal: 1, bonus: 0 },
  { id: 'chuoinuong', icon: '🍌', need: ['banana'], name: () => T('Grilled banana', 'Chuối nướng'), heal: 1, bonus: 0 },
  { id: 'nam', icon: '🍢', need: ['mushroom'], name: () => T('Mushroom skewer', 'Nấm xiên nướng'), heal: 1, bonus: 0 },
  { id: 'fruit', icon: '🥗', need: ['apple', 'banana', 'mango'], name: () => T('Rainbow fruit salad', 'Salad trái cây'), heal: 3, bonus: .3 },
  // dishes from the four cultures, made with the crops that grow near each village
  { id: 'raumuong', icon: '🥬', need: ['waterspinach', 'herb'], name: () => T('Rau muống xào (stir-fried water spinach)', 'Rau muống xào'), heal: 2, bonus: .2 },
  { id: 'khoainuong', icon: '🍠', need: ['sweetpotato'], name: () => T('Grilled sweet potato', 'Khoai lang nướng'), heal: 1, bonus: .1 },
  { id: 'chedua', icon: '🥥', need: ['coconut', 'bean'], name: () => T('Chè đậu xanh (coconut and mung bean sweet soup)', 'Chè dừa đậu xanh'), heal: 2, bonus: .3 },
  { id: 'chemit', icon: '🍈', need: ['jackfruit', 'coconut'], name: () => T('Chè mít (jackfruit and coconut dessert)', 'Chè mít dừa'), heal: 2, bonus: .3 },
  { id: 'macbread', icon: '🍞', need: ['banana', 'macadamia'], name: () => T('Banana macadamia bread', 'Bánh chuối hạt mắc ca'), heal: 2, bonus: .3 },
  { id: 'quandongpie', icon: '🥧', need: ['quandong', 'apple'], name: () => T('Quandong pie', 'Bánh nướng quả quandong'), heal: 2, bonus: .3 },
  { id: 'limefish', icon: '🐠', need: ['fish', 'fingerlime'], name: () => T('Fish with finger lime', 'Cá sốt chanh ngón tay'), heal: 2, bonus: .4 },
  { id: 'damper', icon: '🫓', need: ['rice', 'bushtomato'], name: () => T('Damper bread with bush tomato', 'Bánh damper với cà chua dại'), heal: 2, bonus: .2 },
  { id: 'dumplings', icon: '🥟', need: ['bokchoy', 'mushroom', 'egg'], name: () => T('Bok choy dumplings', 'Sủi cảo cải thìa'), heal: 3, bonus: .5 },
  { id: 'peachbun', icon: '🍑', need: ['cnpeach', 'rice'], name: () => T('Longevity peach buns', 'Bánh bao đào tiên'), heal: 2, bonus: .3 },
  { id: 'peafried', icon: '🍚', need: ['snowpea', 'rice', 'egg'], name: () => T('Snow pea fried rice', 'Cơm chiên đậu Hà Lan'), heal: 3, bonus: .3 },
  { id: 'mandarins', icon: '🍊', need: ['mandarin', 'mandarin'], name: () => T('Mandarin segments', 'Quýt bóc múi'), heal: 1, bonus: .1 },
  { id: 'aampanna', icon: '🧃', need: ['mango', 'ginger'], name: () => T('Mango and ginger drink (aam panna)', 'Nước xoài gừng (aam panna)'), heal: 2, bonus: .4 },
  { id: 'bharta', icon: '🍆', need: ['brinjal', 'chilli'], name: () => T('Smoky brinjal (baingan bharta)', 'Cà tím nướng (baingan bharta)'), heal: 2, bonus: .2 },
  { id: 'dal', icon: '🍛', need: ['bean', 'ginger', 'rice'], name: () => T('Dal and rice', 'Đậu hầm với cơm (dal)'), heal: 3, bonus: .5 }
];
// Festival treats: given as presents during festivals (not cooked)
export const FEAST = [
  { id: 'mooncake', icon: '🥮', name: () => T('Bánh trung thu (mooncake)', 'Bánh trung thu'), heal: 2, bonus: .5 },
  { id: 'ladoo', icon: '🟠', name: () => T('Ladoo sweets', 'Kẹo ladoo'), heal: 2, bonus: .3 },
  { id: 'lamington', icon: '🍰', name: () => T('Lamington cake', 'Bánh lamington'), heal: 2, bonus: .3 },
  { id: 'sizzle', icon: '🌭', name: () => T('Sausage sizzle', 'Xúc xích nướng kẹp bánh mì'), heal: 2, bonus: .2 },
  { id: 'xmascookie', icon: '🍪', name: () => T('Christmas cookie', 'Bánh quy Giáng sinh'), heal: 1, bonus: .3 }
];
export const dishInfo = id => RECIPES.find(r => r.id === id) || FEAST.find(r => r.id === id);
export const MYSTERY = { id: 'mystery', icon: '🥘', name: () => T('Mystery stew', 'Món hầm bí ẩn'), heal: 1, bonus: 0 };
export function findRecipe(list) {
  const key = list.slice().sort().join('+');
  return RECIPES.find(r => r.need.slice().sort().join('+') === key) || (list.length ? MYSTERY : null);
}

// Shop prices are in xu: 1 xu = 10c = 2.000đ
export const SHOP = [
  { kind: 'item', id: 'banana', price: 5 }, { kind: 'item', id: 'mango', price: 8 }, { kind: 'item', id: 'rice', price: 4 },
  { kind: 'item', id: 'egg', price: 3 }, { kind: 'item', id: 'fish', price: 10 }, { kind: 'item', id: 'noodles', price: 6 },
  { kind: 'item', id: 'bean', price: 4 }, { kind: 'item', id: 'leaf', price: 2 },
  { kind: 'glider', id: 1, price: 50 }, { kind: 'glider', id: 2, price: 50 }, { kind: 'glider', id: 3, price: 50 }, { kind: 'glider', id: 4, price: 50 }
];
export const HAT_ICON = { none: '🙂', nonla: '👒', cap: '🧢', crown: '👑', bunny: '🐰', flower: '🌸', bow: '🎀', khanran: '🧣', akubra: '🤠', silkcap: '🎩', pagri: '👳' };
export const HAT_NAME = { none: () => T('No hat', 'Không đội mũ'), nonla: () => T('Nón lá (leaf hat)', 'Nón lá'), cap: () => T('Cap', 'Mũ lưỡi trai'), crown: () => T('Crown', 'Vương miện'), bunny: () => T('Bunny ears', 'Tai thỏ'), flower: () => T('Flower clip', 'Kẹp hoa'), bow: () => T('Bow', 'Nơ'), khanran: () => T('Khăn rằn checked scarf', 'Khăn rằn'), akubra: () => T('Akubra bush hat', 'Mũ Akubra nước Úc'), silkcap: () => T('Chinese silk cap', 'Mũ lụa Trung Hoa'), pagri: () => T('Pagri turban', 'Khăn xếp Pagri') };
// Passport rewards: hats you earn by filling a country's page (not shown in the wardrobe until earned)
export const REWARD_HATS = ['khanran', 'akubra', 'silkcap', 'pagri'];

// Things to gather around the world (they grow back after a while).
// (round T: where each one lies comes from the map, js/content/map.js GATHER_AT, as an offset from its place)
export const GATHER = GATHER_AT.map(([item, place, dx, dz]) => { const [x, z] = anchorOf(place); return [item, x + dx, z + dz]; });

export const STICKERS = ['🦄', '🌈', '🧁', '🍓', '🐱', '🐶', '🦋', '🦖', '🍭', '🚂', '👑', '🐬', '🐣', '🍉', '🌻', '🚀', '🍦', '🐼', '🦊', '🐸', '🐞', '🌙', '☀️', '🏮', '🐢', '🦜', '🐙', '🪁', '🐉', '🪷'];

// The main adventure. Each quest has a check (true when done) and a place to point at.
export const QUESTS = [
  { id: 'owl', icon: '🦉', title: () => T('Talk to Ông Cú', 'Nói chuyện với Ông Cú'), at: 'owl' },
  { id: 'tower1', icon: '🗼', title: () => T('Climb the Dawn Tower', 'Leo lên Tháp Bình Minh'), at: 'tw_plateau', check: p => p.towers.tw_plateau },
  { id: 'plateau', icon: '✨', title: () => T('Solve the 3 shrines on the plateau', 'Giải 3 đền trên cao nguyên'), at: 'plateauShrine', check: p => ['sh_pattern', 'sh_count', 'sh_letters'].every(s => p.shrines[s]) },
  { id: 'glider', icon: '🪂', title: () => T('Get the Leaf Glider from Ông Cú', 'Nhận Cánh Lá từ Ông Cú'), at: 'owl', check: p => p.glider },
  { id: 'village', icon: '🏮', title: () => T('Visit Lotus Village', 'Đến thăm Làng Sen'), at: 'village' },
  { id: 'market', icon: '🛒', title: () => T('Help Cô Mai at the market', 'Giúp Cô Mai bán hàng'), at: 'mai' },
  { id: 'cook', icon: '🍲', title: () => T('Cook a dish at a cooking pot', 'Nấu một món ăn'), at: 'pot', check: p => Object.keys(p.dishes).length > 0 },
  { id: 'folk', icon: '🪢', title: () => T('Play a folk game with the village kids', 'Chơi trò dân gian với các bạn'), at: 'kids' },
  { id: 'playground', icon: '🪁', title: () => T('Learn a game on Two Homes Street', 'Học một trò chơi ở Phố Hai Quê'), at: 'playground', check: p => ['mrwolf', 'chuyen', 'dragon', 'marbles', 'skipping', 'dacau', 'snap'].some(id => p.quests['played_' + id]) },
  { id: 'market3', icon: '🍜', title: () => T('Taste food from the north, centre and south at the Three Regions Market', 'Nếm món ăn ba miền ở Chợ Ba Miền'), at: 'market', check: p => ['bac', 'trung', 'nam'].every(rg => Object.keys(p.tasted || {}).some(id => ({ bahai: 'bac', cothu: 'bac', olai: 'trung', chunam: 'trung', chutam: 'nam', cout: 'nam' })[id] === rg)) },
  { id: 'aussie', icon: '🍦', title: () => T('Get a treat at Aussie Corner', 'Mua quà vặt ở Góc Nước Úc'), at: 'aussie', check: p => ['kelly', 'davo', 'bev', 'gazza', 'robbo'].some(id => (p.tasted || {})[id]) },
  { id: 'buffalo', icon: '🐃', title: () => T('Ride a water buffalo', 'Cưỡi trâu'), at: 'buffalo' },
  { id: 'leafies', icon: '🍃', title: () => T('Find 5 hidden Leafies', 'Tìm 5 bạn Lá Lá đang trốn'), at: 'leafy', check: p => Object.keys(p.leafies).length >= 5 },
  { id: 'statue', icon: '🪷', title: () => T('Bring 4 Sparkle Orbs to the Lotus Statue', 'Mang 4 Ngọc Lấp Lánh đến Tượng Sen'), at: 'statue' },
  { id: 'postcards', icon: '📮', title: () => T('Collect 5 postcards from famous places', 'Sưu tầm 5 bưu thiếp từ những nơi nổi tiếng'), at: 'postcard', check: p => Object.keys(p.postcards || {}).length >= 5 },
  { id: 'towers', icon: '🗺️', title: () => T('Light up all 4 towers', 'Thắp sáng cả 4 tháp'), at: 'tower', check: p => Object.keys(p.towers).length >= 4 },
  { id: 'shrines', icon: '🌟', title: () => T('Solve all 12 shrines', 'Giải cả 12 đền'), at: 'shrine', check: p => Object.keys(p.shrines).length >= 12 }
];
