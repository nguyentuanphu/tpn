// The sticker book's list (owner plan, 16 Oct 2026 AEDT, chat B; docs/plans-20261016/CHAT-B-STICKER-BOOK-PROMPT.md).
// Pure data, no page and no game state: js/stickers.js uses it and tests/unit/stickers.test.mjs checks it.
// Rules (STK-1 to STK-6, docs/ui-redesign-20261016/README.md): pages of exactly 9 (3 x 3), one theme each. A theme may
// have several pages (owner, 16 Oct: "nothing lost": 55 postcards and 22 places need more than one page of 9).
//
// THEMES   { id, tab [en, vi] (the tab's short word), color (the tab), icon, en, vi, song (a key of SONG_LIST, its prize song), decor [icon, en, vi] }
// STICKERS { id, theme, icon (a drawing in js/art.js), en, vi, hint [en, vi] (where to find it, spoken on tap),
//            earn [ ...ways ], sound (an SFX name in js/audio.js), starter (the page's welcome sticker: STK-3) }
// A way to earn one is something the game already does and keeps:
//   { prize: '🐱' }       the older random reward sticker (profile.stickers: quests, farm jobs, festivals, chests)
//   { enter: 'village' }  walking into a place (PlayerEnteredVillage; older saves: profile.placeStickers / visited)
//   { postcard: 'opera' } reading a landmark's sign (profile.postcards)
//   { find: 'mango' }     picking, digging or cracking it (profile.found)
//   { cook: 'pho' }       cooking it (profile.dishes)
//   { taste: 'gazza' }    buying it from a seller (profile.tasted)
//   { fest: 'tet' }       visiting a festival's table on its day (profile.festivals)
//   { secret: 'golden' }  finding a secret (profile.secrets)
//   { surprise: 'rainbow' } finding a surprise (profile.surprises.found)
//   { tower: 'tw_lake' }  climbing a tower (profile.towers)
//   { stamp: 'vn_full' }  filling a passport page (profile.stamps)
//   { meet: 'chicken' }   tapping an animal in the valley (its kind in js/animals.js, or a duck, hen or butterfly)
//   { act: 'npc_owl' }    talking to someone or doing something there (InteractionStarted; 'ferry*' = any ferry)

export const THEMES = [
  { id: 'farm', tab: ['Farm', 'Nông trại'], color: '#43c463', icon: '🐃', en: 'Farm friends', vi: 'Bạn nông trại', song: 'farm', decor: ['🐃', 'Golden frame: farm friends', 'Khung vàng: bạn nông trại'] },
  { id: 'wild', tab: ['Wild', 'Hoang dã'], color: '#2e9e5b', icon: '🐼', en: 'Wild animals', vi: 'Thú hoang dã', song: 'folk', decor: ['🐼', 'Golden frame: wild animals', 'Khung vàng: thú hoang dã'] },
  { id: 'dishes', tab: ['Food', 'Món ăn'], color: '#ffb020', icon: '🍲', en: 'Yummy dishes', vi: 'Món ngon', song: 'village2', decor: ['🍲', 'Golden frame: yummy dishes', 'Khung vàng: món ngon'] },
  { id: 'fruit', tab: ['Fruit', 'Hoa quả'], color: '#ff6fae', icon: '🌸', en: 'Fruit and flowers', vi: 'Hoa và quả', song: 'vn_sang', decor: ['🌸', 'Golden frame: fruit and flowers', 'Khung vàng: hoa và quả'] },
  { id: 'treasure', tab: ['Treasure', 'Báu vật'], color: '#c98a1a', icon: '💎', en: 'Treasures', vi: 'Báu vật', song: 'twinkle', decor: ['💎', 'Golden frame: treasures', 'Khung vàng: báu vật'] },
  { id: 'vietnam', tab: ['Vietnam', 'Việt Nam'], color: '#e8433a', icon: '🪷', en: 'Places in Vietnam', vi: 'Nơi chốn Việt Nam', song: 'village', decor: ['🪷', 'Golden frame: Vietnam', 'Khung vàng: Việt Nam'] },
  { id: 'world', tab: ['World', 'Thế giới'], color: '#29b6f6', icon: '🦘', en: 'Australia and the world', vi: 'Nước Úc và thế giới', song: 'ausday', decor: ['🦘', 'Golden frame: Australia and the world', 'Khung vàng: nước Úc và thế giới'] },
  { id: 'festivals', tab: ['Festivals', 'Lễ hội'], color: '#8a5cf6', icon: '🏮', en: 'Festivals', vi: 'Lễ hội', song: 'trungthu1', decor: ['🏮', 'Golden frame: festivals', 'Khung vàng: lễ hội'] },
  { id: 'friends', tab: ['Friends', 'Bạn bè'], color: '#ff8a3d', icon: '🦉', en: 'Friends and family', vi: 'Bạn bè và gia đình', song: 'pond', decor: ['🦉', 'Golden frame: friends and family', 'Khung vàng: bạn bè và gia đình'] },
  { id: 'rare', tab: ['Rare', 'Hiếm'], color: '#5b6ee8', icon: '🌈', en: 'Rare and shiny', vi: 'Hiếm và lấp lánh', song: 'trungthu2', decor: ['🌈', 'Golden frame: rare and shiny', 'Khung vàng: hiếm và lấp lánh'] }
];

// the hint every older reward sticker shares (one recorded line)
const PRIZE = ['A prize for quests, jobs and festivals', 'Quà khi làm nhiệm vụ, việc nhà và lễ hội'];
const S = (theme, id, icon, en, vi, hint, earn, sound = 'chime', extra = {}) => ({ id, theme, icon, en, vi, hint, earn, sound, ...extra });

// ---------- Farm friends (9) ----------
const FARM = [
  S('farm', 'hen', '🐔', 'Hen', 'Gà mái', ['Clucks in Lotus Village', 'Cục tác ở Làng Sen'], [{ meet: 'chicken' }, { act: 'pen' }], 'cluck', { starter: true }),
  S('farm', 'buffalo', '🐃', 'Water buffalo', 'Con trâu', ['Grazes by the rice fields', 'Gặm cỏ bên đồng lúa'], [{ meet: 'buffalo' }, { act: 'sym_bacninh' }, { act: 'buffalo0' }], 'moo'),
  S('farm', 'duck', '🦆', 'Duck', 'Con vịt', ['Swims on the pond', 'Bơi trên ao'], [{ meet: 'duck' }, { secret: 'ducks' }], 'quack'),
  S('farm', 'dog', '🐶', 'Puppy', 'Cún con', ['Wags his tail in the village', 'Vẫy đuôi trong làng'], [{ meet: 'puppy' }, { prize: '🐶' }], 'woof'),
  S('farm', 'cat', '🐱', 'Kitten', 'Mèo con', PRIZE, [{ meet: 'kitty' }, { prize: '🐱' }], 'meow'),
  S('farm', 'cow', '🐄', 'Cow', 'Con bò', ['Moos on the farm', 'Rống ò ò ở nông trại'], [{ meet: 'cow' }, { meet: 'bull' }], 'moo'),
  S('farm', 'calf', '🐮', 'Calf', 'Bê con', ['A baby cow on the farm', 'Bò con ở nông trại'], [{ meet: 'calf' }], 'calfmoo'),
  S('farm', 'bunny', '🐰', 'Bunny', 'Thỏ con', ['Hungry in her hutch', 'Đói bụng trong chuồng'], [{ meet: 'bunny' }, { act: 'hutch' }], 'squeak'),
  S('farm', 'chick', '🐣', 'Chick', 'Gà con', PRIZE, [{ prize: '🐣' }], 'chirp')
];

// ---------- Wild animals (18) ----------
const WILD = [
  S('wild', 'koala', '🐨', 'Koala', 'Gấu koala', ['Sleeps in Brisbane', 'Ngủ ở Brisbane'], [{ act: 'sym_brisbane' }, { meet: 'koala' }, { prize: '🐨' }], 'sniff', { starter: true }),
  S('wild', 'panda', '🐼', 'Giant panda', 'Gấu trúc', ['Eats bamboo in China Town', 'Ăn tre ở Làng Trung Hoa'], [{ act: 'sym_china' }, { meet: 'panda' }, { prize: '🐼' }], 'sniff'),
  S('wild', 'turtle', '🐢', 'Golden turtle', 'Rùa vàng', ['Lives in Hà Nội\'s lake', 'Sống ở hồ Hà Nội'], [{ act: 'sym_hanoi' }, { meet: 'turtle' }, { prize: '🐢' }], 'splash'),
  S('wild', 'platypus', '🦫', 'Platypus', 'Thú mỏ vịt', ['Swims in Sydney', 'Bơi ở Sydney'], [{ act: 'sym_sydney' }, { meet: 'platypus' }], 'splash'),
  S('wild', 'penguin', '🐧', 'Little penguin', 'Chim cánh cụt nhỏ', ['Waddles in Melbourne', 'Lạch bạch ở Melbourne'], [{ act: 'sym_melbourne' }, { meet: 'penguin' }], 'squeak'),
  S('wild', 'elephant', '🐘', 'Elephant', 'Con voi', ['Stomps in Đà Nẵng', 'Đi dạo ở Đà Nẵng'], [{ act: 'sym_danang' }, { meet: 'elephant' }], 'trumpet'),
  S('wild', 'crane', '🦢', 'Sarus crane', 'Sếu đầu đỏ', ['Dances in Hồ Chí Minh City', 'Nhảy múa ở TP. Hồ Chí Minh'], [{ act: 'sym_saigon' }, { meet: 'crane' }], 'honk'),
  S('wild', 'emu', '🦤', 'Emu', 'Đà điểu emu', ['Runs in Aussie Corner', 'Chạy ở Góc Nước Úc'], [{ act: 'sym_aussie' }, { meet: 'emu' }], 'chuff'),
  S('wild', 'peacock', '🦚', 'Peacock', 'Chim công', ['Shows off in India Village', 'Xòe đuôi ở Làng Ấn Độ'], [{ act: 'sym_india' }, { meet: 'peacock' }], 'squawk'),
  S('wild', 'butterfly', '🦋', 'Butterfly', 'Con bướm', ['Flutters over the meadows', 'Bay trên đồng cỏ'], [{ meet: 'butterfly' }], 'squeak', { starter: true }),
  S('wild', 'dino', '🦖', 'Little dinosaur', 'Khủng long nhỏ', PRIZE, [{ prize: '🦖' }], 'chuff'),
  S('wild', 'dolphin', '🐬', 'Dolphin', 'Cá heo', PRIZE, [{ prize: '🐬' }], 'splash'),
  S('wild', 'fox', '🦊', 'Fox', 'Cáo nhỏ', PRIZE, [{ prize: '🦊' }], 'sniff'),
  S('wild', 'frog', '🐸', 'Frog', 'Ếch xanh', PRIZE, [{ prize: '🐸' }], 'ribbit'),
  S('wild', 'ladybird', '🐞', 'Ladybird', 'Bọ rùa', PRIZE, [{ prize: '🐞' }], 'squeak'),
  S('wild', 'parrot', '🦜', 'Parrot', 'Con vẹt', PRIZE, [{ prize: '🦜' }], 'squawk'),
  S('wild', 'octopus', '🐙', 'Octopus', 'Bạch tuộc', PRIZE, [{ prize: '🐙' }], 'water'),
  S('wild', 'bird', '🐦', 'Little bird', 'Chim non', ['Tap a big tree to find one', 'Chạm vào cây to để tìm chim'], [{ meet: 'bird' }], 'chirp')
];

// ---------- Yummy dishes (36): the 27 recipes, 3 older stickers and 6 things to buy ----------
const RECIPES = [
  ['pho', '🍲', 'Phở', 'Phở'], ['banhchung', '🟩', 'Bánh chưng', 'Bánh chưng'], ['xoixoai', '🥭', 'Mango sticky rice', 'Xôi xoài'],
  ['chechuoi', '🍧', 'Banana sweet soup', 'Chè chuối'], ['canhchua', '🥣', 'Sour fish soup', 'Canh chua cá'], ['comchien', '🍳', 'Egg fried rice', 'Cơm chiên trứng'],
  ['comnam', '🍚', 'Mushroom rice', 'Cơm nấm'], ['cakho', '🐟', 'Braised fish', 'Cá kho'], ['taonuong', '🍎', 'Baked apples', 'Táo nướng'],
  ['chuoinuong', '🍌', 'Grilled banana', 'Chuối nướng'], ['nam', '🍢', 'Mushroom skewer', 'Nấm xiên nướng'], ['fruit', '🥗', 'Fruit salad', 'Salad trái cây'],
  ['raumuong', '🥬', 'Water spinach', 'Rau muống xào'], ['khoainuong', '🍠', 'Grilled sweet potato', 'Khoai lang nướng'], ['chedua', '🥥', 'Coconut sweet soup', 'Chè dừa đậu xanh'],
  ['chemit', '🍈', 'Jackfruit dessert', 'Chè mít dừa'], ['macbread', '🍞', 'Banana bread', 'Bánh chuối mắc ca'], ['quandongpie', '🥧', 'Quandong pie', 'Bánh quandong'],
  ['limefish', '🐠', 'Finger lime fish', 'Cá sốt chanh'], ['damper', '🫓', 'Damper bread', 'Bánh damper'], ['dumplings', '🥟', 'Dumplings', 'Sủi cảo'],
  ['peachbun', '🍑', 'Peach buns', 'Bánh bao đào tiên'], ['peafried', '🍚', 'Snow pea rice', 'Cơm chiên đậu'], ['mandarins', '🍊', 'Mandarin segments', 'Quýt bóc múi'],
  ['aampanna', '🧃', 'Mango drink', 'Nước xoài gừng'], ['bharta', '🍆', 'Smoky brinjal', 'Cà tím nướng'], ['dal', '🍛', 'Dal and rice', 'Đậu hầm với cơm']
];
const COOK = ['Cook it at a cooking pot', 'Nấu ở nồi nấu ăn'];
const DISHES = [
  ...RECIPES.map(([id, icon, en, vi], k) => S('dishes', 'dish_' + id, icon, en, vi, COOK, [{ cook: id }], 'cook', k % 9 === 0 ? { starter: true } : {})),
  S('dishes', 'cupcake', '🧁', 'Cupcake', 'Bánh cupcake', PRIZE, [{ prize: '🧁' }], 'pop'),
  S('dishes', 'lollipop', '🍭', 'Lollipop', 'Kẹo mút', PRIZE, [{ prize: '🍭' }], 'pop'),
  S('dishes', 'icecream', '🍦', 'Ice cream', 'Kem ốc quế', ['Buy one from Gazza', 'Mua kem của Gazza'], [{ prize: '🍦' }, { taste: 'gazza' }, { taste: 'k_kemtt' }], 'pop', { starter: true }),
  S('dishes', 'banhmi', '🥖', 'Bánh mì', 'Bánh mì', ['Buy one at the market', 'Mua ở chợ'], [{ taste: 'chutam' }], 'pop'),
  S('dishes', 'banhxeo', '🥞', 'Bánh xèo', 'Bánh xèo', ['Buy one in the city', 'Mua ở thành phố'], [{ taste: 'k_banhxeo' }], 'pop'),
  S('dishes', 'lamington', '🍫', 'Lamington', 'Bánh lamington', ['Buy one in Australia', 'Mua ở nước Úc'], [{ taste: 'k_lamington' }], 'pop'),
  S('dishes', 'fairybread', '🍞', 'Fairy bread', 'Bánh mì cốm màu', ['Buy one in Australia', 'Mua ở nước Úc'], [{ taste: 'k_fairybread' }], 'pop'),
  S('dishes', 'tanghulu', '🍡', 'Candied fruit', 'Kẹo hồ lô', ['Buy one in China Town', 'Mua ở Làng Trung Hoa'], [{ taste: 'k_tanghulu' }], 'pop'),
  S('dishes', 'lassi', '🥭', 'Mango lassi', 'Sinh tố xoài', ['Buy one in India Village', 'Mua ở Làng Ấn Độ'], [{ taste: 'k_lassi' }], 'pop')
];
// (each page of 9 has one starter: phở, the cá kho row and so on, and the ice cream on the last page)

// ---------- Fruit and flowers (27): wild fruit and flowers, crops from four countries, two older stickers ----------
const FIELD = ['Pick it in the meadows', 'Hái ở đồng cỏ'];
const CROP = c => [`Pick it in ${c[0]}`, `Hái ở ${c[1]}`];
const VN = ['the Vietnam gardens', 'vườn Việt Nam'], AU = ['the Aussie gardens', 'vườn nước Úc'], CN = ['China Town', 'Làng Trung Hoa'], IN = ['India Village', 'Làng Ấn Độ'];
const FRUIT = [
  S('fruit', 'strawberry', '🍓', 'Wild strawberries', 'Dâu rừng', FIELD, [{ find: 'strawberry' }, { prize: '🍓' }], 'harvest', { starter: true }),
  S('fruit', 'mulberry', '🫐', 'Mulberries', 'Dâu tằm', FIELD, [{ find: 'mulberry' }], 'harvest'),
  S('fruit', 'guava', '🍐', 'Guava', 'Ổi', FIELD, [{ find: 'guava' }], 'harvest'),
  S('fruit', 'lime', '🍋', 'Wild lemon', 'Chanh rừng', FIELD, [{ find: 'lime' }], 'harvest'),
  S('fruit', 'peach', '🌸', 'Peach blossom', 'Hoa đào', FIELD, [{ find: 'peach' }], 'chime'),
  S('fruit', 'apricot', '🏵️', 'Apricot blossom', 'Hoa mai', FIELD, [{ find: 'apricot' }], 'chime'),
  S('fruit', 'wattle', '🌼', 'Golden wattle', 'Hoa keo vàng', FIELD, [{ find: 'wattle' }], 'chime'),
  S('fruit', 'hibiscus', '🌺', 'Hibiscus', 'Hoa dâm bụt', FIELD, [{ find: 'hibiscus' }], 'chime'),
  S('fruit', 'sunflower', '🌻', 'Sunflower', 'Hoa hướng dương', PRIZE, [{ prize: '🌻' }], 'chime'),
  S('fruit', 'coconut', '🥥', 'Coconut', 'Dừa', CROP(VN), [{ find: 'coconut' }], 'harvest', { starter: true }),
  S('fruit', 'jackfruit', '🍈', 'Jackfruit', 'Mít', CROP(VN), [{ find: 'jackfruit' }], 'harvest'),
  S('fruit', 'chilli', '🌶️', 'Chilli', 'Ớt', CROP(VN), [{ find: 'chilli' }], 'harvest'),
  S('fruit', 'waterspinach', '🥬', 'Water spinach', 'Rau muống', CROP(VN), [{ find: 'waterspinach' }], 'harvest'),
  S('fruit', 'sweetpotato', '🍠', 'Sweet potato', 'Khoai lang', CROP(VN), [{ find: 'sweetpotato' }], 'harvest'),
  S('fruit', 'macadamia', '🥜', 'Macadamia nuts', 'Hạt mắc ca', CROP(AU), [{ find: 'macadamia' }], 'harvest'),
  S('fruit', 'quandong', '🍑', 'Quandong', 'Quả quandong', CROP(AU), [{ find: 'quandong' }], 'harvest'),
  S('fruit', 'fingerlime', '🍋', 'Finger lime', 'Chanh ngón tay', CROP(AU), [{ find: 'fingerlime' }], 'harvest'),
  S('fruit', 'bushtomato', '🍅', 'Bush tomato', 'Cà chua dại', CROP(AU), [{ find: 'bushtomato' }], 'harvest'),
  S('fruit', 'cnpeach', '🍑', 'Longevity peach', 'Đào tiên', CROP(CN), [{ find: 'cnpeach' }], 'harvest', { starter: true }),
  S('fruit', 'mandarin', '🍊', 'Mandarin', 'Quýt', CROP(CN), [{ find: 'mandarin' }], 'harvest'),
  S('fruit', 'bokchoy', '🥬', 'Bok choy', 'Cải thìa', CROP(CN), [{ find: 'bokchoy' }], 'harvest'),
  S('fruit', 'snowpea', '🫛', 'Snow peas', 'Đậu Hà Lan', CROP(CN), [{ find: 'snowpea' }], 'harvest'),
  S('fruit', 'mango', '🥭', 'Mango', 'Xoài', CROP(IN), [{ find: 'mango' }], 'harvest'),
  S('fruit', 'brinjal', '🍆', 'Brinjal', 'Cà tím', CROP(IN), [{ find: 'brinjal' }], 'harvest'),
  S('fruit', 'ginger', '🫚', 'Ginger', 'Gừng', CROP(IN), [{ find: 'ginger' }], 'harvest'),
  S('fruit', 'marigold', '🌼', 'Marigolds', 'Hoa cúc vạn thọ', CROP(IN), [{ find: 'marigold' }], 'chime'),
  S('fruit', 'watermelon', '🍉', 'Watermelon', 'Dưa hấu', PRIZE, [{ prize: '🍉' }], 'pop')
];

// ---------- Treasures (27): what rocks and digging hold, the 10 secrets, the surprise chest and glade, the 4 towers ----------
const ROCK = ['Tap a rock 3 times', 'Gõ hòn đá 3 lần'], DIG = ['Dig at a sparkly mound', 'Đào ở ụ đất lấp lánh'];
const TREASURE = [
  S('treasure', 'pebble', '🪨', 'Pretty pebble', 'Viên sỏi đẹp', ROCK, [{ find: 'pebble' }], 'coin', { starter: true }),
  S('treasure', 'fossil', '🐚', 'Fossil shell', 'Hóa thạch vỏ ốc', ROCK, [{ find: 'fossil' }], 'coin'),
  S('treasure', 'crystal', '🔮', 'Purple crystal', 'Pha lê tím', ROCK, [{ find: 'crystal' }], 'coin'),
  S('treasure', 'gold', '🪙', 'Gold nugget', 'Cục vàng', ROCK, [{ find: 'gold' }], 'coin'),
  S('treasure', 'gem', '💎', 'Blue gem', 'Đá quý xanh', ROCK, [{ find: 'gem' }], 'coin'),
  S('treasure', 'bone', '🦴', 'Dinosaur bone', 'Xương khủng long', DIG, [{ find: 'bone' }], 'coin'),
  S('treasure', 'oldcoin', '🏅', 'Old bronze coin', 'Đồng xu cổ', DIG, [{ find: 'oldcoin' }], 'coin'),
  S('treasure', 'jade', '🟢', 'Green jade', 'Ngọc bích', DIG, [{ find: 'jade' }], 'coin'),
  S('treasure', 'ruby', '❤️', 'Red ruby', 'Hồng ngọc', DIG, [{ find: 'ruby' }], 'coin'),
  S('treasure', 'diamond', '💠', 'Diamond', 'Kim cương', DIG, [{ find: 'diamond' }], 'coin', { starter: true }),
  S('treasure', 'crown', '👑', 'Golden crown', 'Vương miện vàng', DIG, [{ find: 'crown' }, { prize: '👑' }], 'fanfare'),
  S('treasure', 'goldenapple', '🍏', 'Golden apple', 'Táo vàng', ['Shake an old apple tree', 'Rung cây táo già'], [{ secret: 'golden' }], 'secret'),
  S('treasure', 'roofcat', '🐈', 'Rooftop cat', 'Mèo trên mái nhà', ['Look up in Lotus Village', 'Nhìn lên mái nhà Làng Sen'], [{ secret: 'cat' }], 'meow'),
  S('treasure', 'bell', '🔔', 'Hidden bell', 'Chuông bí mật', ['Deep in the bamboo forest', 'Sâu trong rừng tre'], [{ secret: 'bell' }], 'ding'),
  S('treasure', 'bottle', '🍾', 'Message in a bottle', 'Thư trong chai', ['On Mirror Lake\'s beach', 'Trên bờ Hồ Gương'], [{ secret: 'bottle' }], 'splash'),
  S('treasure', 'snowman', '⛄', 'Snowman', 'Người tuyết', ['At the top of Snowcap Peaks', 'Trên đỉnh Núi Tuyết'], [{ secret: 'snowman' }], 'secret'),
  S('treasure', 'wish', '🌠', 'A wish on a star', 'Điều ước sao băng', ['The Lotus Statue at night', 'Tượng Sen vào ban đêm'], [{ secret: 'wish' }], 'secret'),
  S('treasure', 'fireflies', '✨', 'Firefly friends', 'Bạn đom đóm', ['Tap five fireflies at night', 'Chạm năm đom đóm ban đêm'], [{ secret: 'fireflies' }], 'secret'),
  S('treasure', 'chest', '🧰', 'Treasure chest', 'Rương kho báu', ['Find 3 map pieces', 'Tìm 3 mảnh bản đồ'], [{ surprise: 'chest' }], 'fanfare', { starter: true }),
  S('treasure', 'moondance', '🌙', 'Moonlight dance', 'Điệu nhảy dưới trăng', ['Dance on the stage at night', 'Nhảy trên sân khấu ban đêm'], [{ secret: 'moondance' }], 'secret'),
  S('treasure', 'skyglide', '🪂', 'Sky explorer', 'Nhà thám hiểm bầu trời', ['Glide for a long time', 'Lượn thật lâu'], [{ secret: 'skyglide' }], 'glide'),
  S('treasure', 'parade', '🦆', 'Duck parade', 'Đoàn vịt diễu hành', ['Feed the ducks 3 times', 'Cho vịt ăn 3 lần'], [{ secret: 'ducks' }], 'quack'),
  S('treasure', 'glade', '🍄', 'Fairy glade', 'Khu rừng tiên', ['Follow the glowing stones', 'Đi theo đá phát sáng'], [{ surprise: 'glade' }], 'secret'),
  S('treasure', 'tw_plateau', '🗼', 'Dawn Tower', 'Tháp Bình Minh', ['Climb it on Dawn Plateau', 'Leo tháp ở Cao Nguyên'], [{ tower: 'tw_plateau' }], 'tower'),
  S('treasure', 'tw_bamboo', '🗼', 'Bamboo Tower', 'Tháp Rừng Tre', ['Climb it in the bamboo', 'Leo tháp trong rừng tre'], [{ tower: 'tw_bamboo' }], 'tower'),
  S('treasure', 'tw_peaks', '🗼', 'Peak Tower', 'Tháp Núi Tuyết', ['Climb it on Snowcap Peaks', 'Leo tháp trên Núi Tuyết'], [{ tower: 'tw_peaks' }], 'tower'),
  S('treasure', 'tw_lake', '🗼', 'Lake Tower', 'Tháp Hồ Gương', ['Climb it by Mirror Lake', 'Leo tháp bên Hồ Gương'], [{ tower: 'tw_lake' }], 'tower')
];

// ---------- Places (Vietnam 45, Australia and the world 36): every place and every postcard ----------
const VISIT = (en, vi) => [`Visit ${en}`, `Đến ${vi}`];
const SIGN = (en, vi) => [`Read the sign: ${en}`, `Đọc bảng: ${vi}`];
const place = (theme, id, icon, en, vi, starter) => S(theme, 'place_' + id, icon, en, vi, VISIT(en, vi), [{ enter: id }], 'chime', starter ? { starter: true } : {});
const card = (theme, id, icon, en, vi, starter) => S(theme, 'pc_' + id, icon, en, vi, SIGN(en, vi), [{ postcard: id }], 'ding', starter ? { starter: true } : {});
const VIETNAM = [
  place('vietnam', 'plateau', '🌄', 'Dawn Plateau', 'Cao Nguyên Bình Minh', true), place('vietnam', 'village', '🪷', 'Lotus Village', 'Làng Sen'),
  place('vietnam', 'home', '🌻', 'Sunny Farm', 'Nông Trại Nắng Mai'), place('vietnam', 'town', '🏠', 'Two Homes Street', 'Phố Hai Quê'),
  place('vietnam', 'market', '🛒', 'Three Regions Market', 'Chợ Ba Miền'), place('vietnam', 'paddies', '🌾', 'Golden Rice Fields', 'Cánh Đồng Lúa Vàng'),
  place('vietnam', 'lake', '🦢', 'Mirror Lake', 'Hồ Gương'), place('vietnam', 'bamboo', '🎋', 'Whispering Bamboo', 'Rừng Tre Thì Thầm'),
  place('vietnam', 'mountain', '🏔️', 'Snowcap Peaks', 'Núi Tuyết Trắng'),
  place('vietnam', 'meadow', '🌼', 'Breezy Meadows', 'Đồng Cỏ Lộng Gió', true), place('vietnam', 'hanoi', '🐢', 'Hà Nội', 'Hà Nội'),
  place('vietnam', 'bacninh', '🕰️', 'Bắc Ninh', 'Bắc Ninh'), place('vietnam', 'danang', '🐉', 'Đà Nẵng', 'Đà Nẵng'),
  place('vietnam', 'saigon', '🛵', 'Hồ Chí Minh City', 'TP. Hồ Chí Minh'), place('vietnam', 'vungtau', '🏖️', 'Bà Rịa–Vũng Tàu', 'Bà Rịa–Vũng Tàu'),
  place('vietnam', 'hoian', '🏮', 'Hội An', 'Hội An'),
  S('vietnam', 'stamp_vn', '🛂', 'Vietnam passport page', 'Trang hộ chiếu Việt Nam', ['Fill the Vietnam page', 'Điền đủ trang Việt Nam'], [{ stamp: 'vn_full' }], 'fanfare'),
  card('vietnam', 'turtle', '🐢', 'Turtle Tower', 'Tháp Rùa'),
  card('vietnam', 'onepillar', '🪷', 'One Pillar Pagoda', 'Chùa Một Cột', true), card('vietnam', 'thehuc', '🌉', 'Thê Húc Bridge', 'Cầu Thê Húc'),
  card('vietnam', 'longbien', '🌉', 'Long Biên Bridge', 'Cầu Long Biên'), card('vietnam', 'vanmieu', '📚', 'Temple of Literature', 'Văn Miếu'),
  card('vietnam', 'puppettheatre', '🎎', 'Water Puppet Theatre', 'Nhà hát Múa rối nước'), card('vietnam', 'bnclock', '🕰️', 'Bắc Ninh Clock Tower', 'Cột Đồng Hồ Bắc Ninh'),
  card('vietnam', 'chuadau', '🧱', 'Dâu Pagoda', 'Chùa Dâu'), card('vietnam', 'butthap', '🖌️', 'Bút Tháp Pagoda', 'Chùa Bút Tháp'),
  card('vietnam', 'dendo', '⛩️', 'Đô Temple', 'Đền Đô'),
  card('vietnam', 'quanho', '🎶', 'Quan họ singing', 'Dân ca Quan họ', true), card('vietnam', 'halong', '⛰️', 'Hạ Long Bay', 'Vịnh Hạ Long'),
  card('vietnam', 'trangan', '🛶', 'Tràng An', 'Tràng An'), card('vietnam', 'phongnha', '🦇', 'Phong Nha caves', 'Hang động Phong Nha'),
  card('vietnam', 'hue', '🏯', 'Huế Imperial City', 'Kinh thành Huế'), card('vietnam', 'chuacau', '🌉', 'Hội An Covered Bridge', 'Chùa Cầu Hội An'),
  card('vietnam', 'hoian', '🏮', 'Hội An Ancient Town', 'Phố cổ Hội An'), card('vietnam', 'myson', '🧱', 'Mỹ Sơn Sanctuary', 'Thánh địa Mỹ Sơn'),
  card('vietnam', 'goldenbridge', '🤲', 'Golden Bridge', 'Cầu Vàng'),
  card('vietnam', 'dragonbridge', '🐉', 'Dragon Bridge', 'Cầu Rồng', true), card('vietnam', 'marble', '⛰️', 'Marble Mountains', 'Ngũ Hành Sơn'),
  card('vietnam', 'benthanh', '🕰️', 'Bến Thành Clock Tower', 'Tháp Đồng Hồ Bến Thành'), card('vietnam', 'cathedral', '⛪', 'Sài Gòn Cathedral', 'Nhà thờ Đức Bà'),
  card('vietnam', 'postoffice', '📮', 'Sài Gòn Post Office', 'Bưu điện Thành phố'), card('vietnam', 'cairang', '🛶', 'Cái Răng Floating Market', 'Chợ nổi Cái Răng'),
  card('vietnam', 'lighthouse', '🗼', 'Vũng Tàu Lighthouse', 'Hải Đăng Vũng Tàu'), card('vietnam', 'bachdinh', '🏛️', 'The White Villa', 'Bạch Dinh'),
  card('vietnam', 'nhatron', '💧', 'The Round House', 'Nhà Tròn Bà Rịa')
];
const WORLD = [
  place('world', 'aussie', '🦘', 'Aussie Corner', 'Góc Nước Úc', true), place('world', 'brisbane', '🐨', 'Brisbane', 'Brisbane'),
  place('world', 'sydney', '⛴️', 'Sydney', 'Sydney'), place('world', 'melbourne', '🚋', 'Melbourne', 'Melbourne'),
  place('world', 'china', '🏮', 'China Town', 'Làng Trung Hoa'), place('world', 'india', '🪔', 'India Village', 'Làng Ấn Độ'),
  S('world', 'stamp_au', '🛂', 'Australia passport page', 'Trang hộ chiếu nước Úc', ['Fill the Australia page', 'Điền đủ trang nước Úc'], [{ stamp: 'au_full' }], 'fanfare'),
  S('world', 'stamp_cn', '🛂', 'China passport page', 'Trang hộ chiếu Trung Quốc', ['Fill the China page', 'Điền đủ trang Trung Quốc'], [{ stamp: 'cn_full' }], 'fanfare'),
  S('world', 'stamp_in', '🛂', 'India passport page', 'Trang hộ chiếu Ấn Độ', ['Fill the India page', 'Điền đủ trang Ấn Độ'], [{ stamp: 'in_full' }], 'fanfare'),
  card('world', 'opera', '🎭', 'Sydney Opera House', 'Nhà hát Opera Sydney', true), card('world', 'harbour', '🌉', 'Harbour Bridge', 'Cầu Cảng Sydney'),
  card('world', 'sydneytower', '🗼', 'Sydney Tower Eye', 'Tháp Sydney'), card('world', 'lunapark', '😃', 'Luna Park', 'Công viên Luna'),
  card('world', 'bondi', '🏖️', 'Lifesavers\' Tower', 'Tháp Cứu Hộ'), card('world', 'sisters', '🏔️', 'The Three Sisters', 'Ba Chị Em'),
  card('world', 'banana', '🍌', 'The Big Banana', 'Quả Chuối Khổng Lồ'), card('world', 'wheel', '🎡', 'Wheel of Brisbane', 'Vòng quay Brisbane'),
  card('world', 'lonepine', '🐨', 'Lone Pine Koalas', 'Koala Lone Pine'),
  card('world', 'storybridge', '🌉', 'Story Bridge', 'Cầu Story', true), card('world', 'reef', '🐠', 'Great Barrier Reef', 'Rạn san hô Great Barrier'),
  card('world', 'flinders', '🚉', 'Flinders Street Station', 'Ga Flinders Street'), card('world', 'wtram', '🚋', 'Melbourne trams', 'Tàu điện Melbourne'),
  card('world', 'princes', '🌉', 'Princes Bridge', 'Cầu Princes'), card('world', 'exhibition', '🏛️', 'Royal Exhibition Building', 'Tòa nhà Triển lãm'),
  card('world', 'apostles', '🪨', 'The Twelve Apostles', 'Mười Hai Tông Đồ'), card('world', 'uluru', '🪨', 'Uluru', 'Uluru'),
  card('world', 'kakadu', '🎨', 'Kakadu rock art', 'Tranh đá Kakadu'),
  card('world', 'forbidden', '🏯', 'The Forbidden City', 'Tử Cấm Thành', true), card('world', 'heaven', '⛩️', 'Temple of Heaven', 'Thiên Đàn'),
  card('world', 'terracotta', '🗿', 'Terracotta Army', 'Đội quân đất nung'), card('world', 'potala', '🏔️', 'Potala Palace', 'Cung điện Potala'),
  card('world', 'qutub', '🗼', 'Qutub Minar', 'Tháp Qutub Minar'), card('world', 'redfort', '🏰', 'Red Fort', 'Pháo đài Đỏ'),
  card('world', 'konark', '☸️', 'Konark Sun Temple', 'Đền Mặt Trời Konark'), card('world', 'hampi', '🛕', 'Hampi stone chariot', 'Cỗ xe đá Hampi'),
  card('world', 'mahabodhi', '🙏', 'Mahabodhi Temple', 'Đền Mahabodhi')
];

// ---------- Festivals (27): every festival of the calendar and three older stickers ----------
const FESTS = [
  ['tet', '🧧', 'Tết', 'Tết Nguyên Đán'], ['ramthang1', '🏮', 'First Full Moon', 'Rằm tháng Giêng'], ['giotohung', '👑', 'Hùng Kings\' Day', 'Giỗ Tổ Hùng Vương'],
  ['doanngo', '🐉', 'Đoan Ngọ', 'Tết Đoan Ngọ'], ['vulan', '🌹', 'Vu Lan', 'Lễ Vu Lan'], ['midautumn', '🥮', 'Mid-Autumn', 'Tết Trung Thu'],
  ['ongtao', '🐟', 'Kitchen Gods\' Day', 'Ông Công Ông Táo'], ['thieunhi', '🎈', 'Children\'s Day', 'Ngày Thiếu nhi'], ['quockhanh', '🇻🇳', 'National Day', 'Quốc khánh'],
  ['nhagiao', '💐', 'Teachers\' Day', 'Ngày Nhà giáo'], ['easter', '🥚', 'Easter', 'Lễ Phục Sinh'], ['mothersday', '💝', 'Mother\'s Day', 'Ngày của Mẹ'],
  ['fathersday', '👔', 'Father\'s Day', 'Ngày của Bố'], ['halloween', '🎃', 'Halloween', 'Halloween'], ['christmas', '🎄', 'Christmas', 'Giáng Sinh'],
  ['newyear', '🎆', 'New Year\'s Eve', 'Giao thừa Dương lịch'], ['ausday', '🇦🇺', 'Australia Day', 'Ngày Nước Úc'], ['cleanup', '♻️', 'Clean Up Day', 'Ngày Làm Sạch'],
  ['harmony', '🤝', 'Harmony Day', 'Ngày Hòa hợp'], ['holi', '🎨', 'Holi', 'Lễ hội Holi'], ['anzac', '🌺', 'Anzac Day', 'Ngày Anzac'],
  ['reconciliation', '🖐️', 'Reconciliation Week', 'Tuần lễ Hòa giải'], ['naidoc', '🪃', 'NAIDOC Week', 'Tuần lễ NAIDOC'], ['diwali', '🪔', 'Diwali', 'Lễ hội Diwali']
];
const FESTIVALS = [
  S('festivals', 'lantern', '🏮', 'Red lantern', 'Đèn lồng đỏ', PRIZE, [{ prize: '🏮' }], 'chime', { starter: true }),
  S('festivals', 'kite', '🪁', 'Kite', 'Con diều', PRIZE, [{ prize: '🪁' }], 'whoosh'),
  S('festivals', 'dragon', '🐉', 'Dragon dance', 'Múa rồng', PRIZE, [{ prize: '🐉' }], 'fanfare'),
  ...FESTS.map(([id, icon, en, vi], k) => S('festivals', 'fest_' + id, icon, en, vi, [`On ${en}, visit the festival table`, `Ngày ${vi}, ghé bàn lễ hội`], [{ fest: id }], 'fanfare', k === 6 || k === 15 ? { starter: true } : {}))
];

// ---------- Friends and family (18): people to talk to and the best-friends chest ----------
const TALK = (en, vi) => [`Talk to ${en}`, `Nói chuyện với ${vi}`];
const friend = (id, icon, en, vi, act, starter) => S('friends', id, icon, en, vi, TALK(en, vi), [{ act }], 'hee', starter ? { starter: true } : {});
const FRIENDS = [
  friend('owl', '🦉', 'Grandpa Owl', 'Ông Cú', 'npc_owl', true), friend('gourd', '🎃', 'Grandpa Gourd', 'Ông Bầu', 'npc_gourd'),
  friend('mai', '👩', 'Auntie Mai', 'Cô Mai', 'npc_mai'), friend('ba', '👨', 'Uncle Ba', 'Bác Ba', 'npc_ba'),
  friend('bear', '🐻', 'Mr. Bear', 'Bác Gấu', 'bear'), friend('nam', '👵', 'Grandma Năm', 'Bà Năm', 'g_chichi'),
  friend('hue', '👵', 'Grandma Huệ', 'Bà Huệ', 'npc_bahue'), friend('nghi', '👴', 'Grandpa Nghi', 'Ông Nghi', 'npc_ongnghi'),
  S('friends', 'bestfriends', '🤝', 'Best friends', 'Bạn thân', ['Open a chest with a friend', 'Mở rương cùng một bạn'], [{ prize: '🤝' }], 'fanfare'),
  friend('teo', '👦', 'Tèo', 'Tèo', 'npc_teo', true), friend('ti', '👦', 'Tí', 'Tí', 'npc_ti'), friend('bong', '👧', 'Bống', 'Bống', 'npc_bong'),
  friend('su', '👧', 'Su', 'Su', 'npc_su'), friend('mit', '👦', 'Mít', 'Mít', 'npc_mit'), friend('bom', '👦', 'Bờm', 'Bờm', 'npc_bom'),
  friend('lan', '👧', 'Lan', 'Lan', 'npc_lan'), friend('jack', '👦', 'Jack', 'Jack', 'npc_jack'), friend('f_ruby', '👧', 'Ruby', 'Ruby', 'npc_ruby')
];

// ---------- Rare and shiny (9): the surprises and the older magic stickers ----------
const RARE = [
  S('rare', 'rainbow', '🌈', 'Rainbow', 'Cầu vồng', ['After the rain, look around', 'Sau cơn mưa, nhìn quanh nhé'], [{ surprise: 'rainbow' }, { prize: '🌈' }], 'secret', { starter: true }),
  S('rare', 'stars', '🌙', 'Shooting stars', 'Sao băng', ['Look up on a clear night', 'Nhìn trời đêm quang'], [{ surprise: 'stars' }, { prize: '🌙' }], 'secret'),
  S('rare', 'rainbowlotus', '🪷', 'Rainbow lotus', 'Sen cầu vồng', ['Blooms on the lotus pond', 'Nở trên ao sen'], [{ surprise: 'lotus' }, { prize: '🪷' }], 'secret'),
  S('rare', 'goldbutterfly', '🦋', 'Golden butterfly', 'Bướm vàng', ['Follow it when it comes', 'Đi theo khi bướm đến'], [{ surprise: 'butterfly' }, { prize: '🦋' }], 'secret'),
  S('rare', 'fairy', '🧚', 'Visiting fairy', 'Cô tiên ghé thăm', ['Sometimes a fairy visits', 'Thỉnh thoảng cô tiên ghé'], [{ surprise: 'fairy' }], 'secret'),
  S('rare', 'unicorn', '🦄', 'Unicorn', 'Kỳ lân', PRIZE, [{ prize: '🦄' }], 'secret'),
  S('rare', 'sun', '☀️', 'Happy sun', 'Ông mặt trời', PRIZE, [{ prize: '☀️' }], 'chime'),
  S('rare', 'rocket', '🚀', 'Rocket', 'Tên lửa', PRIZE, [{ prize: '🚀' }], 'whoosh'),
  S('rare', 'train', '🚂', 'Little train', 'Tàu hỏa nhỏ', PRIZE, [{ prize: '🚂' }], 'chuff')
];

export const STICKERS = [...FARM, ...WILD, ...DISHES, ...FRUIT, ...TREASURE, ...VIETNAM, ...WORLD, ...FESTIVALS, ...FRIENDS, ...RARE];
export const BY_ID = Object.fromEntries(STICKERS.map(s => [s.id, s]));
export const PER_PAGE = 9;

/** a theme's pages: [[9 stickers], [9 stickers], …] in book order */
export const pagesOf = theme => { const all = STICKERS.filter(s => s.theme === theme), out = []; for (let k = 0; k < all.length; k += PER_PAGE) out.push(all.slice(k, k + PER_PAGE)); return out; };
/** every page of the book: { key: 'farm.0', theme, n (0-based within the theme), of (pages in the theme), stickers } */
export const PAGES = THEMES.flatMap(t => { const ps = pagesOf(t.id); return ps.map((stickers, n) => ({ key: `${t.id}.${n}`, theme: t.id, n, of: ps.length, stickers })); });

// the older random reward stickers (js/data.js STICKERS, plus the koala of chapter 3 and the best friends' chest): each
// one is in exactly one sticker here, so a save from before keeps all of them (UX-009)
export const LEGACY_EMOJI = ['🦄', '🌈', '🧁', '🍓', '🐱', '🐶', '🦋', '🦖', '🍭', '🚂', '👑', '🐬', '🐣', '🍉', '🌻', '🚀', '🍦', '🐼', '🦊', '🐸', '🐞', '🌙', '☀️', '🏮', '🐢', '🦜', '🐙', '🪁', '🐉', '🪷', '🐨', '🤝'];
/** the sticker an older reward emoji now is (or null) */
export const fromEmoji = e => STICKERS.find(s => s.earn.some(w => w.prize === e)) || null;

// the 3 a new player gets in the first minutes (S6, STK-3): meeting Grandpa Owl, a hen, the first place
export const FIRST_THREE = ['owl', 'hen', 'place_plateau'];
// shiny copies (S7): a sticker earned again has a 1 in 20 chance of turning shiny
export const SHINY_CHANCE = 1 / 20;
// the words of the book (shown and spoken)
export const BOOK_LINES = {
  title: ['My sticker book', 'Sổ hình dán của con'],
  newOne: ['A new sticker for your book!', 'Một hình dán mới cho sổ của con!'],
  shiny: ['A shiny sticker! It sparkles!', 'Hình dán lấp lánh! Sáng quá!'],
  gift: ['A present to start this page!', 'Một món quà để bắt đầu trang này!'],
  full: ['You filled the page! A golden frame, a song and a present for your house!', 'Con dán đầy trang rồi! Khung vàng, một bài hát và một món quà cho nhà con!'],
  prize: ['Fill the page to win a golden frame, a song and a present for your house!', 'Dán đầy trang để nhận khung vàng, một bài hát và quà cho nhà con!']
};
