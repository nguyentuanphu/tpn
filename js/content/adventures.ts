// The daily adventure (owner plan, 16 Oct 2026 AEDT, chat C; docs/plans-20261016/CHAT-C-DAILY-ADVENTURE-PROMPT.md).
// Pure data and choosing only (no page, no 3D): js/adventure.js plays it in the valley, tests/unit/adventures.test.mjs
// checks it. Rules (docs/ui-redesign-20261016/README.md): ADV-1 one at a time, ADV-2 always 3 steps of at most 6 words
// with a picture or a number, ADV-3 a character says it in at most 2 sentences (recorded, never a child's name),
// ADV-4 the reward shown first, ADV-5 stamps only fill up and no timers for under-5s, ADV-6 one green "Let's go!".
//
// ADVENTURES { id, giver (a key of GIVERS), icon, en, vi (the title), places [ region keys it uses ], ages ['little', 'big'],
//              festival (a js/content/festcal.js id, or null), say [en, vi] (the giver's spoken introduction),
//              miss [en, vi] (Grandpa Owl the next day, D11), steps [3], reward { sticker (js/content/stickers.js id), coins } }
// A step is one of (`at` is an interactable id in the valley, 'ferry*' any ferry pier, 'storyteller' Bà Năm on her
// story mat, or a region key: the middle of that place):
//   { kind: 'go', place }                 walk into a place (PlayerEnteredVillage)
//   { kind: 'find', at, n, big, thing }   things appear near `at` and wait there until found (like the surprises);
//                                         thing = { icon, en, vi }; big = how many for 5 and over (D12); bag = an item
//                                         id they go into the Backpack as (for a cook step after)
//   { kind: 'give', at }                  bring what was found to someone: a gift spot appears in front of them; big
//                                         kids count what they bring first (D12)
//   { kind: 'talk', at }                  talk to someone or tap something there (InteractionStarted)
//   { kind: 'play', at }                  play the game that starts there (finished, or for under-5s just played)
//   { kind: 'cook' }                      cook any dish at a cooking pot
// Each step also has icon, en, vi (at most 6 words; {n} becomes the number to find) and, for 5 and over, may have
// big: [en, vi] (a harder wording) and also: { icon, en, vi, n } (a two-part ask: a second thing to find too, D12).

export const STEP_KINDS = ['go', 'find', 'give', 'talk', 'play', 'cook'];
// places every child can reach from the start (the home island): an adventure only uses these and the places the child
// has walked into before (D2)
export const HOME_PLACES = ['home', 'plateau', 'town'];
export const COINS = 10;              // owner, 16 Oct AEDT: 1 sticker + 10 coins
export const NO_REPEAT_DAYS = 7;
export const WEEK = 7;                // stamps on a card; a full card opens the week chest (D10)
export const FIND_LITTLE = 3, FIND_BIG = 5;
export const TRICKY_SECONDS = 180;    // the "Tricky" timer for 5 and over (only when a grown-up chose Tricky): a bonus, never a loss
export const TRICKY_BONUS = 5;

// who gives an adventure: their picture and name (the speech bubble's face, ADV-3)
export const GIVERS = {
  owl: { icon: '🦉', en: 'Grandpa Owl', vi: 'Ông Cú' },
  nam: { icon: '👵', en: 'Grandma Năm', vi: 'Bà Năm' },
  bear: { icon: '🐻', en: 'Mr. Bear', vi: 'Bác Gấu' },
  mai: { icon: '👩', en: 'Auntie Mai', vi: 'Cô Mai' },
  ba: { icon: '👨', en: 'Uncle Ba', vi: 'Bác Ba' },
  teo: { icon: '👦', en: 'Tèo', vi: 'Tèo' },
  ti: { icon: '👧', en: 'Tí', vi: 'Tí' },
  gourd: { icon: '🍃', en: 'Grandpa Gourd', vi: 'Ông Bầu' },
  hue: { icon: '👵', en: 'Grandma Huệ', vi: 'Bà Huệ' },
  nghi: { icon: '👴', en: 'Grandpa Nghi', vi: 'Ông Nghi' },
  lan: { icon: '👧', en: 'Lan', vi: 'Lan' },
  bom: { icon: '👦', en: 'Bờm', vi: 'Bờm' },
  jack: { icon: '👦', en: 'Jack', vi: 'Jack' },
  ruby: { icon: '👧', en: 'Ruby', vi: 'Ruby' },
  hai: { icon: '🧑', en: 'Grandma Hai', vi: 'Bà Hai' },
  tash: { icon: '🐨', en: 'Ranger Tash', vi: 'Cô kiểm lâm Tash' },
  lin: { icon: '👵', en: 'Grandma Lin', vi: 'Bà Lin' },
  asha: { icon: '👵', en: 'Grandma Asha', vi: 'Bà Asha' },
  molly: { icon: '⛴️', en: 'Captain Molly', vi: 'Thuyền trưởng Molly' },
  sam: { icon: '🚋', en: 'Conductor Sam', vi: 'Chú soát vé Sam' },
  long: { icon: '🐉', en: 'Big Brother Long', vi: 'Anh Long' },
  teu: { icon: '🎭', en: 'Uncle Tễu', vi: 'Chú Tễu' },
  dao: { icon: '👵', en: 'Grandma Đào', vi: 'Bà Đào' },
  colan: { icon: '⛑️', en: 'Miss Lan', vi: 'Cô Lan' },
  bev: { icon: '👩', en: 'Aunty Bev', vi: 'Cô Bev' },
  liam: { icon: '🏏', en: 'Liam', vi: 'Liam' },
  haikite: { icon: '🪁', en: 'Big Brother Hai', vi: 'Anh Hai' }
};

const go = (place, icon, en, vi) => ({ kind: 'go', place, icon, en, vi });
const find = (at, thing, en, vi, extra = {}) => ({ kind: 'find', at, n: FIND_LITTLE, big: FIND_BIG, thing, icon: thing.icon, en, vi, ...extra });
const give = (at, icon, en, vi, extra = {}) => ({ kind: 'give', at, icon, en, vi, ...extra });
const talk = (at, icon, en, vi) => ({ kind: 'talk', at, icon, en, vi });
const play = (at, icon, en, vi) => ({ kind: 'play', at, icon, en, vi });
const cook = (icon, en, vi) => ({ kind: 'cook', icon, en, vi });
const A = (id, giver, icon, en, vi, places, say, miss, steps, sticker, extra = {}) => ({ id, giver, icon, en, vi, places, ages: ['little', 'big'], festival: null, say, miss, steps, reward: { sticker, coins: COINS }, ...extra });

// ---------- the first ten (part A, owner's list) ----------
const FIRST = [
  A('eggs', 'nam', '🥚', 'Grandma Năm\'s eggs', 'Trứng của Bà Năm', ['village'],
    ['Grandma Năm\'s hens hid their eggs. Can you find them?', 'Gà của Bà Năm giấu trứng mất rồi. Con tìm giúp bà nhé?'],
    ['Grandma Năm made a cake with your eggs!', 'Bà Năm làm bánh bằng trứng con tìm đó!'],
    [go('village', '🪷', 'Walk to Lotus Village', 'Đi đến Làng Sen'),
      find('storyteller', { icon: '🥚', en: 'eggs', vi: 'quả trứng' }, 'Find {n} eggs', 'Tìm {n} quả trứng', { also: { icon: '🪶', en: 'feathers', vi: 'lông gà', n: 2 }, bigText: ['Find {n} eggs and 2 feathers', 'Tìm {n} quả trứng và 2 lông gà'] }),
      give('storyteller', '👵', 'Bring them to Grandma Năm', 'Mang về cho Bà Năm')], 'hen'),
  A('puppy', 'ti', '🐶', 'Lost puppy', 'Cún con đi lạc', ['village'],
    ['My puppy ran away to play. Can you follow his paw prints?', 'Cún con của tớ chạy đi chơi mất rồi. Bạn theo dấu chân giúp tớ nhé?'],
    ['The puppy misses you!', 'Cún con nhớ con đó!'],
    [talk('npc_ti', '👧', 'Ask Tí about her puppy', 'Hỏi Tí về cún con'),
      find('lv_well', { icon: '🐾', en: 'paw prints', vi: 'dấu chân' }, 'Find {n} paw prints', 'Tìm {n} dấu chân'),
      give('npc_ti', '🐶', 'Bring the puppy to Tí', 'Đưa cún về cho Tí')], 'dog'),
  A('market', 'hai', '🥭', 'Market helper', 'Giúp chợ', ['market'],
    ['My mangoes rolled out of the basket! Will you help me pick them up?', 'Xoài của bà lăn ra khỏi rổ rồi! Con nhặt giúp bà nhé?'],
    ['Grandma Hai sold all her mangoes. Thank you!', 'Bà Hai bán hết xoài rồi. Cảm ơn con!'],
    [go('market', '🏮', 'Walk to the market', 'Đi đến chợ'),
      find('v_bahai', { icon: '🥭', en: 'mangoes', vi: 'quả xoài' }, 'Pick up {n} mangoes', 'Nhặt {n} quả xoài'),
      give('v_bahai', '🧑', 'Give them to Grandma Hai', 'Đưa cho Bà Hai')], 'mango'),
  A('kite', 'haikite', '🪁', 'Kite day', 'Ngày thả diều', ['vungtau'],
    ['The wind is perfect for kites today! Bring the ribbons and we will fly.', 'Hôm nay gió thả diều đẹp lắm! Mang dải ruy băng tới, mình cùng thả nhé.'],
    ['Your kite is still flying over the sea!', 'Diều của con vẫn còn bay trên biển đó!'],
    [go('vungtau', '🏖️', 'Walk to Vũng Tàu beach', 'Đi đến biển Vũng Tàu'),
      find('g_kite', { icon: '🎀', en: 'kite ribbons', vi: 'dải ruy băng' }, 'Find {n} kite ribbons', 'Tìm {n} dải ruy băng'),
      play('g_kite', '🪁', 'Fly a kite with Hai', 'Thả diều cùng anh Hai')], 'kite'),
  A('cloud', 'owl', '☁️', 'Grumpy Cloud', 'Mây Cau Có', ['plateau', 'village'],
    ['Grumpy Cloud is sad today. Sunshine and a song will cheer him up.', 'Hôm nay Mây Cau Có buồn. Ánh nắng và một bài hát sẽ làm mây vui lên.'],
    ['Grumpy Cloud smiled all night!', 'Mây Cau Có cười cả đêm đó!'],
    [find('npc_owl', { icon: '☀️', en: 'sunbeams', vi: 'tia nắng' }, 'Catch {n} sunbeams', 'Bắt {n} tia nắng'),
      go('village', '🪷', 'Walk to Lotus Village', 'Đi đến Làng Sen'),
      play('xylo', '🎶', 'Play a happy tune', 'Chơi một bài vui')], 'rainbow'),
  A('ferry', 'owl', '⛴️', 'Ferry to Hà Nội', 'Đi phà đến Hà Nội', ['village', 'hanoi'],
    ['Uncle Tễu is putting on a puppet show in Hà Nội. Take the ferry and see it!', 'Chú Tễu diễn múa rối ở Hà Nội. Con đi phà đến xem nhé!'],
    ['Uncle Tễu still talks about your visit!', 'Chú Tễu vẫn nhắc chuyến thăm của con đó!'],
    [talk('ferry*', '⛴️', 'Ride a ferry', 'Đi phà'),
      go('hanoi', '🐢', 'Walk to Hà Nội', 'Đi đến Hà Nội'),
      play('g_puppets', '🎭', 'Watch the water puppets', 'Xem múa rối nước')], 'turtle'),
  A('lotus', 'mai', '🪷', 'Lotus picking', 'Hái sen', ['village'],
    ['The lotus flowers are open! Pick some for the village altar.', 'Hoa sen nở rồi! Con hái vài bông cho bàn thờ làng nhé.'],
    ['Auntie Mai\'s lotus tea smells lovely!', 'Trà sen của Cô Mai thơm lắm đó!'],
    [go('village', '🪷', 'Walk to Lotus Village', 'Đi đến Làng Sen'),
      find('lv_bench', { icon: '🪷', en: 'lotus flowers', vi: 'bông sen' }, 'Pick {n} lotus flowers', 'Hái {n} bông sen'),
      give('npc_mai', '👩', 'Give them to Auntie Mai', 'Đưa cho Cô Mai')], 'place_village'),
  A('buffalo', 'bear', '🐃', 'Feed Mr. Bear\'s buffalo', 'Cho trâu của Bác Gấu ăn', ['home', 'paddies'],
    ['My buffalo is hungry out in the rice fields. Can you take him some hay?', 'Trâu của bác đói bụng ngoài đồng. Con mang rơm ra cho trâu nhé?'],
    ['The buffalo had a long happy nap!', 'Trâu ngủ một giấc thật ngon đó!'],
    [find('hay', { icon: '🌾', en: 'bundles of hay', vi: 'bó rơm' }, 'Gather {n} bundles of hay', 'Gom {n} bó rơm'),
      go('paddies', '🌾', 'Walk to the rice fields', 'Đi ra đồng lúa'),
      give('buffalo0', '🐃', 'Feed the buffalo', 'Cho trâu ăn')], 'buffalo'),
  A('banhmi', 'nghi', '🥖', 'Bánh mì delivery', 'Giao bánh mì', ['town', 'plateau'],
    ['Grandpa Owl ordered bánh mì for breakfast. Can you take them up the hill?', 'Ông Cú đặt bánh mì ăn sáng. Con mang lên đồi giúp ông nhé?'],
    ['Grandpa Owl loved his bánh mì!', 'Ông Cú thích bánh mì lắm đó!'],
    [find('npc_ongnghi', { icon: '🥖', en: 'bánh mì', vi: 'ổ bánh mì' }, 'Pack {n} bánh mì', 'Gói {n} ổ bánh mì'),
      go('plateau', '🦉', 'Climb up to Grandpa Owl', 'Leo lên chỗ Ông Cú'),
      give('npc_owl', '🦉', 'Give them to Grandpa Owl', 'Đưa cho Ông Cú')], 'banhmi'),
  A('lanterns', 'teo', '🏮', 'Lantern night', 'Đêm hội đèn lồng', ['village'],
    ['It is lantern night! Help me find lanterns for the parade.', 'Đêm hội đèn lồng rồi! Giúp tớ tìm đèn lồng cho đoàn rước nhé.'],
    ['The lanterns are still shining for you!', 'Đèn lồng vẫn còn sáng cho con đó!'],
    [go('village', '🪷', 'Walk to Lotus Village', 'Đi đến Làng Sen'),
      find('statue', { icon: '🏮', en: 'lanterns', vi: 'đèn lồng' }, 'Find {n} lanterns', 'Tìm {n} đèn lồng'),
      give('npc_teo', '👦', 'Bring them to Tèo', 'Mang đến cho Tèo')], 'lantern', { festival: 'midautumn' })
];

// ---------- twenty more across the villages and cities (part B, D9) ----------
const MORE = [
  A('koala', 'tash', '🐨', 'Koala\'s lunch', 'Bữa trưa của koala', ['brisbane'],
    ['Our koala is waking up hungry. Find some fresh gum leaves!', 'Bạn koala thức dậy đói bụng. Con tìm lá bạch đàn tươi nhé!'],
    ['The koala is sleeping with a full tummy!', 'Bạn koala no bụng ngủ ngon rồi!'],
    [go('brisbane', '🐨', 'Walk to Brisbane', 'Đi đến Brisbane'),
      find('g_koala', { icon: '🍃', en: 'gum leaves', vi: 'lá bạch đàn' }, 'Find {n} gum leaves', 'Tìm {n} lá bạch đàn'),
      play('g_koala', '🐨', 'Help Ranger Tash', 'Giúp cô Tash')], 'koala'),
  A('panda', 'lin', '🐼', 'Bamboo for the panda', 'Tre cho gấu trúc', ['china'],
    ['The panda wants crunchy bamboo shoots. Can you find some?', 'Gấu trúc muốn ăn măng tre giòn. Con tìm giúp bà nhé?'],
    ['The panda is still munching your bamboo!', 'Gấu trúc vẫn đang nhai măng con tìm đó!'],
    [go('china', '🐼', 'Walk to China Town', 'Đi đến Làng Trung Hoa'),
      find('cn_pagoda', { icon: '🎋', en: 'bamboo shoots', vi: 'mầm tre' }, 'Find {n} bamboo shoots', 'Tìm {n} mầm tre'),
      give('g_dragon', '👵', 'Give them to Grandma Lin', 'Đưa cho Bà Lin')], 'panda'),
  A('peacock', 'asha', '🦚', 'Peacock feathers', 'Lông chim công', ['india'],
    ['The peacock dropped his feathers. They make a beautiful rangoli!', 'Chim công rụng lông rồi. Lông công làm tranh rangoli đẹp lắm!'],
    ['Grandma Asha\'s rangoli has your feathers in it!', 'Tranh rangoli của Bà Asha có lông công con tìm đó!'],
    [go('india', '🐘', 'Walk to India Village', 'Đi đến Làng Ấn Độ'),
      find('in_taj', { icon: '🪶', en: 'feathers', vi: 'lông công' }, 'Find {n} feathers', 'Tìm {n} chiếc lông'),
      give('g_rangoli', '👵', 'Give them to Grandma Asha', 'Đưa cho Bà Asha')], 'peacock'),
  A('harbour', 'molly', '⛴️', 'Harbour shells', 'Vỏ sò ở bến cảng', ['sydney'],
    ['Shells washed up by the ferries. Collect them, then sail with me!', 'Vỏ sò dạt vào bến phà. Con nhặt rồi đi thuyền với cô nhé!'],
    ['Captain Molly says hello from the harbour!', 'Thuyền trưởng Molly gửi lời chào từ bến cảng!'],
    [go('sydney', '⛴️', 'Walk to Sydney', 'Đi đến Sydney'),
      find('g_ferries', { icon: '🐚', en: 'shells', vi: 'vỏ sò' }, 'Find {n} shells', 'Tìm {n} vỏ sò'),
      play('g_ferries', '⛴️', 'Sail with Captain Molly', 'Đi thuyền cùng cô Molly')], 'dolphin'),
  A('tram', 'sam', '🚋', 'Tram ride', 'Đi tàu điện', ['melbourne'],
    ['All aboard! First, find the lost tram bells.', 'Lên tàu nào! Trước tiên con tìm mấy cái chuông tàu bị rơi nhé.'],
    ['The tram bells go ding ding for you!', 'Chuông tàu kêu leng keng chào con đó!'],
    [go('melbourne', '🚋', 'Walk to Melbourne', 'Đi đến Melbourne'),
      find('g_tram', { icon: '🔔', en: 'tram bells', vi: 'chuông tàu' }, 'Find {n} tram bells', 'Tìm {n} chuông tàu'),
      play('g_tram', '🚋', 'Ride with Conductor Sam', 'Đi tàu cùng chú Sam')], 'penguin'),
  A('dragon', 'long', '🐉', 'Dragon Bridge', 'Cầu Rồng', ['danang'],
    ['The dragon lost his shiny scales. Find them before the fire show!', 'Rồng làm rơi vảy lấp lánh. Con tìm trước giờ phun lửa nhé!'],
    ['The dragon breathed fire just for you!', 'Rồng phun lửa tặng riêng con đó!'],
    [go('danang', '🐉', 'Walk to Đà Nẵng', 'Đi đến Đà Nẵng'),
      find('g_dragonfire', { icon: '🌟', en: 'dragon scales', vi: 'vảy rồng' }, 'Find {n} dragon scales', 'Tìm {n} vảy rồng'),
      play('g_dragonfire', '🐉', 'Watch the dragon show', 'Xem rồng phun lửa')], 'dragon'),
  A('puppets', 'teu', '🎭', 'Water puppets', 'Múa rối nước', ['hanoi'],
    ['My puppets lost their little hats. Will you find them?', 'Các con rối của chú mất mũ rồi. Con tìm giúp chú nhé?'],
    ['The puppets wear their hats proudly now!', 'Các con rối đội mũ thật oai rồi!'],
    [go('hanoi', '🐢', 'Walk to Hà Nội', 'Đi đến Hà Nội'),
      find('g_puppets', { icon: '👑', en: 'puppet hats', vi: 'mũ con rối' }, 'Find {n} puppet hats', 'Tìm {n} mũ con rối'),
      play('g_puppets', '🎭', 'Watch the water puppets', 'Xem múa rối nước')], 'pc_puppettheatre'),
  A('quanho', 'dao', '🎶', 'Quan họ song', 'Bài hát quan họ', ['bacninh'],
    ['The singers need betel leaves to welcome guests. Can you bring some?', 'Các liền anh liền chị cần lá trầu đón khách. Con mang giúp nhé?'],
    ['The Quan họ singers sang your song!', 'Các liền anh liền chị hát bài của con đó!'],
    [go('bacninh', '🕰️', 'Walk to Bắc Ninh', 'Đi đến Bắc Ninh'),
      find('npc_quanho', { icon: '🍃', en: 'betel leaves', vi: 'lá trầu' }, 'Find {n} betel leaves', 'Tìm {n} lá trầu'),
      give('g_dongho', '👵', 'Give them to Grandma Đào', 'Đưa cho Bà Đào')], 'pc_quanho'),
  A('traffic', 'colan', '⛑️', 'Traffic helper', 'Bạn giúp giao thông', ['saigon'],
    ['Riders dropped their helmets! Find them, then help me with the traffic lights.', 'Các bác lái xe làm rơi mũ bảo hiểm! Con tìm rồi giúp cô điều khiển đèn nhé.'],
    ['Everyone rode home safely, thanks to you!', 'Mọi người về nhà an toàn nhờ con đó!'],
    [go('saigon', '🛵', 'Walk to Hồ Chí Minh City', 'Đi đến TP. Hồ Chí Minh'),
      find('g_traffic', { icon: '⛑️', en: 'helmets', vi: 'mũ bảo hiểm' }, 'Find {n} helmets', 'Tìm {n} mũ bảo hiểm'),
      play('g_traffic', '🚦', 'Help Miss Lan', 'Giúp cô Lan')], 'crane'),
  A('picnic', 'bev', '🧺', 'Party picnic', 'Dã ngoại tiệc', ['aussie'],
    ['Chloe\'s party needs plates for the lamingtons. Can you find them?', 'Tiệc của Chloe cần đĩa đựng bánh lamington. Con tìm giúp cô nhé?'],
    ['Chloe saved you a lamington!', 'Chloe để dành cho con một cái bánh lamington đó!'],
    [go('aussie', '🦘', 'Walk to Aussie Corner', 'Đi đến Góc Nước Úc'),
      find('v_bev', { icon: '🍽️', en: 'plates', vi: 'cái đĩa' }, 'Find {n} plates', 'Tìm {n} cái đĩa'),
      give('g_parcel', '🎁', 'Bring them to the party', 'Mang đến bữa tiệc')], 'lamington'),
  A('cricket', 'liam', '🏏', 'Backyard cricket', 'Chơi cricket sân sau', ['aussie'],
    ['We hit all the balls over the fence! Find them and we will play.', 'Bọn tớ đánh bóng bay qua hàng rào hết rồi! Bạn tìm rồi mình chơi nhé.'],
    ['Liam is practising your big hit!', 'Liam đang tập cú đánh xa của con đó!'],
    [go('aussie', '🦘', 'Walk to Aussie Corner', 'Đi đến Góc Nước Úc'),
      find('g_cricket', { icon: '🏏', en: 'cricket balls', vi: 'quả bóng' }, 'Find {n} cricket balls', 'Tìm {n} quả bóng'),
      play('g_cricket', '🏏', 'Play cricket with Liam', 'Chơi cricket với Liam')], 'emu'),
  A('bunny', 'bear', '🐰', 'Bunny breakfast', 'Bữa sáng của thỏ', ['home'],
    ['The bunny is hungry. Ask me, then find her some carrots!', 'Thỏ con đói bụng rồi. Hỏi bác rồi tìm cà rốt cho thỏ nhé!'],
    ['The bunny hopped all day after her breakfast!', 'Thỏ con nhảy tung tăng cả ngày sau bữa sáng đó!'],
    [talk('bear', '🐻', 'Ask Mr. Bear', 'Hỏi Bác Gấu'),
      find('hutch', { icon: '🥕', en: 'carrots', vi: 'củ cà rốt' }, 'Find {n} carrots', 'Tìm {n} củ cà rốt'),
      give('hutch', '🐰', 'Feed the bunny', 'Cho thỏ ăn')], 'bunny'),
  A('hens', 'bear', '🐔', 'Happy hens', 'Gà vui vẻ', ['home'],
    ['The hens would love some corn. Then help me in the barn!', 'Đàn gà thích ăn bắp lắm. Xong rồi giúp bác ở kho nhé!'],
    ['The hens laid a big egg for you!', 'Gà đẻ một quả trứng to tặng con đó!'],
    [find('pen', { icon: '🌽', en: 'corn cobs', vi: 'trái bắp' }, 'Find {n} corn cobs', 'Tìm {n} trái bắp'),
      give('pen', '🐔', 'Feed the hens', 'Cho gà ăn'),
      talk('crate', '🧺', 'Collect from the barn', 'Lấy đồ trong kho')], 'chick'),
  A('ducklings', 'bear', '🐥', 'Ducklings home', 'Vịt con về nhà', ['home'],
    ['Three ducklings wandered off. Can you lead them home?', 'Mấy chú vịt con đi lạc rồi. Con dẫn vịt về nhà nhé?'],
    ['The ducklings are swimming with their mum!', 'Vịt con đang bơi cùng vịt mẹ đó!'],
    [go('home', '🏡', 'Walk to Sunny Farm', 'Đi đến Nông trại'),
      find('duckmaze', { icon: '🐥', en: 'ducklings', vi: 'vịt con' }, 'Find {n} ducklings', 'Tìm {n} vịt con'),
      play('duckmaze', '🦆', 'Help the duckling home', 'Giúp vịt con về nhà')], 'duck'),
  A('stars', 'owl', '⭐', 'Owl\'s star map', 'Bản đồ sao của Ông Cú', ['plateau'],
    ['Some stars fell out of my star map. Will you put them back?', 'Mấy ngôi sao rơi khỏi bản đồ sao của ông. Con gắn lại giúp ông nhé?'],
    ['Your stars twinkled all night long!', 'Những ngôi sao của con lấp lánh cả đêm đó!'],
    [go('plateau', '🦉', 'Climb up to Grandpa Owl', 'Leo lên chỗ Ông Cú'),
      find('npc_owl', { icon: '⭐', en: 'stars', vi: 'ngôi sao' }, 'Find {n} stars', 'Tìm {n} ngôi sao'),
      talk('npc_owl', '🦉', 'Show Grandpa Owl', 'Khoe với Ông Cú')], 'owl'),
  A('supper', 'ba', '🍄', 'Mushroom supper', 'Bữa tối nấm', ['village'],
    ['Mushrooms are growing by the cooking pot. Pick some and cook supper!', 'Nấm mọc cạnh nồi nấu ăn. Con hái rồi nấu bữa tối nhé!'],
    ['Uncle Ba still talks about your supper!', 'Bác Ba vẫn khen bữa tối của con đó!'],
    [go('village', '🪷', 'Walk to Lotus Village', 'Đi đến Làng Sen'),
      find('pot1', { icon: '🍄', en: 'mushrooms', vi: 'cây nấm' }, 'Pick {n} mushrooms', 'Hái {n} cây nấm', { bag: 'mushroom' }),
      cook('🍲', 'Cook a dish', 'Nấu một món ăn')], 'dish_nam'),
  A('shuttle', 'bom', '🏸', 'Shuttlecock champions', 'Vô địch đá cầu', ['town'],
    ['Our shuttlecocks flew onto the roofs! Find them and play with us.', 'Quả cầu của tụi tớ bay lên mái nhà rồi! Bạn tìm rồi chơi cùng nhé.'],
    ['Bờm is still kicking your shuttlecock!', 'Bờm vẫn đang đá quả cầu của con đó!'],
    [go('town', '🏘️', 'Walk to Two Homes Street', 'Đi đến Phố Hai Quê'),
      find('dacau', { icon: '🏸', en: 'shuttlecocks', vi: 'quả cầu' }, 'Find {n} shuttlecocks', 'Tìm {n} quả cầu'),
      play('dacau', '🏸', 'Kick the shuttlecock', 'Đá cầu')], 'bom'),
  A('seeds', 'gourd', '🌱', 'Grandpa Gourd\'s seeds', 'Hạt giống của Ông Bầu', ['village'],
    ['My seeds blew away in the wind. Find them so they can grow!', 'Hạt giống của ông bay theo gió mất rồi. Con tìm giúp để hạt lớn nhé!'],
    ['Your seeds have tiny green leaves now!', 'Hạt giống của con nhú lá xanh rồi đó!'],
    [talk('npc_gourd', '🍃', 'Talk to Grandpa Gourd', 'Nói chuyện với Ông Bầu'),
      find('lv_well', { icon: '🌱', en: 'seeds', vi: 'hạt giống' }, 'Find {n} seeds', 'Tìm {n} hạt giống'),
      give('npc_gourd', '🍃', 'Give them to Grandpa Gourd', 'Đưa cho Ông Bầu')], 'gourd'),
  A('shadow', 'teo', '🎭', 'Shadow puppet show', 'Múa rối bóng', ['village'],
    ['The puppet show needs bright stars for the sky. Can you find some?', 'Màn múa rối cần sao sáng trên trời. Bạn tìm giúp tớ nhé?'],
    ['Everyone clapped for your puppet show!', 'Ai cũng vỗ tay cho màn múa rối của con đó!'],
    [go('village', '🪷', 'Walk to Lotus Village', 'Đi đến Làng Sen'),
      find('theatre', { icon: '🌟', en: 'paper stars', vi: 'ngôi sao giấy' }, 'Find {n} paper stars', 'Tìm {n} ngôi sao giấy'),
      play('theatre', '🎭', 'Put on the puppet show', 'Diễn múa rối bóng')], 'butterfly'),
  A('house', 'hue', '🧱', 'House warming', 'Mừng nhà mới', ['town'],
    ['We are building a house for the family. Can you find the last bricks?', 'Cả nhà đang xây nhà mới. Con tìm mấy viên gạch cuối giúp bà nhé?'],
    ['The new house is finished, and you helped!', 'Nhà mới xây xong rồi, có con giúp đó!'],
    [go('town', '🏘️', 'Walk to Two Homes Street', 'Đi đến Phố Hai Quê'),
      find('npc_bahue', { icon: '🧱', en: 'bricks', vi: 'viên gạch' }, 'Find {n} bricks', 'Tìm {n} viên gạch'),
      give('npc_ongnghi', '👴', 'Give them to Grandpa Nghi', 'Đưa cho Ông Nghi')], 'hue'),
  A('shells', 'haikite', '🐚', 'Seaside shells', 'Vỏ sò bãi biển', ['vungtau'],
    ['The tide left pretty shells by the lighthouse. Bring me some!', 'Thủy triều để lại vỏ sò đẹp cạnh hải đăng. Mang cho anh vài cái nhé!'],
    ['Big Brother Hai made a necklace of your shells!', 'Anh Hai làm vòng cổ bằng vỏ sò của con đó!'],
    [go('vungtau', '🏖️', 'Walk to Vũng Tàu beach', 'Đi đến biển Vũng Tàu'),
      find('pc_lighthouse', { icon: '🐚', en: 'shells', vi: 'vỏ sò' }, 'Find {n} shells', 'Tìm {n} vỏ sò'),
      give('g_kite', '🧑', 'Give them to Big Brother Hai', 'Đưa cho anh Hai')], 'pc_lighthouse'),
  A('uluru', 'owl', '🪨', 'Uluru sunset', 'Hoàng hôn Uluru', ['uluru'],
    ['Desert flowers bloom by the big red rock. Go and see them!', 'Hoa sa mạc nở cạnh tảng đá đỏ khổng lồ. Con đi xem nhé!'],
    ['The big red rock glowed for you at sunset!', 'Tảng đá đỏ khổng lồ rực sáng chào con lúc hoàng hôn đó!'],
    [go('uluru', '🪨', 'Walk to Uluru', 'Đi đến Uluru'),
      find('pc_uluru', { icon: '🌺', en: 'desert flowers', vi: 'hoa sa mạc' }, 'Find {n} desert flowers', 'Tìm {n} bông hoa'),
      talk('pc_uluru', '🪨', 'Read the Uluru sign', 'Đọc bảng Uluru')], 'pc_uluru')
];

// ---------- one adventure for each festival in the game (part B, D9): on Two Homes Street, which every child can
// reach, where the families of both homes get ready together. [festival id, giver, thing icon, thing en, thing vi,
// spoken introduction en, vi]; quiet days (Anzac Day, Vu Lan…) are gentle, never a party ----------
const FEST = [
  ['tet', 'hue', '🧧', 'red envelopes', 'bao lì xì', 'Happy Tết! Help me find red envelopes for the children.', 'Chúc mừng năm mới! Giúp bà tìm bao lì xì cho các cháu nhé.'],
  ['ramthang1', 'lan', '🏮', 'lanterns', 'đèn lồng', 'It is the first full moon of the year. Let us hang lanterns!', 'Rằm tháng Giêng rồi. Mình cùng treo đèn lồng nhé!'],
  ['giotohung', 'nghi', '🌸', 'flowers', 'bông hoa', 'Today we remember the Hùng Kings. Bring flowers to say thank you.', 'Hôm nay mình nhớ ơn các Vua Hùng. Con mang hoa đến tạ ơn nhé.'],
  ['doanngo', 'hue', '🍉', 'fruits', 'trái cây', 'It is the Mid-Year Festival. Find fruit for the family table!', 'Tết Đoan Ngọ rồi. Con tìm trái cây cho mâm cơm nhà mình nhé!'],
  ['vulan', 'lan', '🌹', 'roses', 'bông hồng', 'Vu Lan is a day to thank our parents. Find roses for them.', 'Lễ Vu Lan là ngày cảm ơn cha mẹ. Con tìm hoa hồng tặng cha mẹ nhé.'],
  ['midautumn', 'lan', '🥮', 'mooncakes', 'bánh trung thu', 'It is the Mid-Autumn Festival! Find mooncakes for the moon party.', 'Tết Trung Thu rồi! Mình tìm bánh trung thu cho tiệc trông trăng nhé.'],
  ['ongtao', 'hue', '🐟', 'golden fish', 'cá chép vàng', 'The Kitchen Gods fly to the sky on golden fish. Help me find them!', 'Ông Công Ông Táo cưỡi cá chép về trời. Giúp bà tìm cá nhé!'],
  ['thieunhi', 'bom', '🎈', 'balloons', 'bóng bay', 'It is Children\'s Day! Find balloons for the party.', 'Ngày Thiếu nhi rồi! Bạn tìm bóng bay cho bữa tiệc nhé.'],
  ['quockhanh', 'nghi', '🇻🇳', 'little flags', 'lá cờ nhỏ', 'It is Vietnam\'s National Day. Let us put up little flags!', 'Hôm nay là Quốc khánh. Mình cùng cắm cờ nhỏ nhé!'],
  ['nhagiao', 'lan', '💐', 'flowers', 'bông hoa', 'It is Teachers\' Day. Find flowers to say thank you to our teachers.', 'Ngày Nhà giáo rồi. Mình tìm hoa cảm ơn thầy cô nhé.'],
  ['easter', 'ruby', '🥚', 'painted eggs', 'trứng màu', 'Happy Easter! Can you find the eggs the bunny painted?', 'Chúc mừng lễ Phục Sinh! Bạn tìm được trứng màu thỏ giấu không?'],
  ['mothersday', 'jack', '💝', 'hearts', 'trái tim', 'It is Mother\'s Day. Let us find hearts for our mums!', 'Hôm nay là Ngày của Mẹ. Mình tìm trái tim tặng mẹ nhé!'],
  ['fathersday', 'jack', '👔', 'ties', 'cà vạt', 'It is Father\'s Day. Find a surprise for the dads!', 'Hôm nay là Ngày của Bố. Mình tìm quà bất ngờ tặng bố nhé!'],
  ['halloween', 'ruby', '🎃', 'pumpkins', 'quả bí ngô', 'Happy Halloween! Find friendly pumpkins for the street.', 'Chúc mừng Halloween! Bạn tìm bí ngô vui vẻ cho cả phố nhé.'],
  ['christmas', 'jack', '🎁', 'presents', 'món quà', 'Merry Christmas! Help me find presents for the tree.', 'Giáng Sinh vui vẻ! Giúp tớ tìm quà đặt dưới cây thông nhé.'],
  ['newyear', 'ruby', '🎆', 'party poppers', 'pháo giấy', 'It is New Year\'s Eve! Find party poppers for midnight.', 'Đêm Giao thừa rồi! Bạn tìm pháo giấy cho lúc nửa đêm nhé.'],
  ['ausday', 'jack', '🇦🇺', 'little flags', 'lá cờ nhỏ', 'Happy Australia Day! Let us put up little flags.', 'Chúc mừng Ngày Nước Úc! Mình cùng cắm cờ nhỏ nhé.'],
  ['cleanup', 'ruby', '♻️', 'bits of rubbish', 'mẩu rác', 'It is Clean Up Day. Help me pick up rubbish!', 'Hôm nay là Ngày Làm Sạch. Giúp tớ nhặt rác nhé!'],
  ['harmony', 'lan', '🤝', 'friendship bands', 'vòng tay bạn bè', 'It is Harmony Day, and everyone belongs. Find friendship bands to share!', 'Ngày Hòa hợp rồi, ai cũng là bạn. Mình tìm vòng tay để chia nhau nhé!'],
  ['holi', 'lan', '🎨', 'colour pots', 'hũ màu', 'Happy Holi! Find the colour pots for the festival.', 'Chúc mừng lễ Holi! Mình tìm hũ màu cho lễ hội nhé.'],
  ['anzac', 'nghi', '🌺', 'red poppies', 'hoa anh túc đỏ', 'Today is Anzac Day. We find red poppies to remember.', 'Hôm nay là Ngày Anzac. Mình tìm hoa đỏ để tưởng nhớ.'],
  ['reconciliation', 'jack', '🖐️', 'painted hands', 'bàn tay vẽ', 'It is Reconciliation Week. Find painted hands for our friendship wall.', 'Tuần lễ Hòa giải rồi. Mình tìm bàn tay vẽ cho bức tường tình bạn nhé.'],
  ['naidoc', 'ruby', '🪃', 'boomerangs', 'boomerang', 'It is NAIDOC Week. Find the painted boomerangs for the celebration!', 'Tuần lễ NAIDOC rồi. Mình tìm boomerang vẽ cho buổi lễ nhé!'],
  ['diwali', 'lan', '🪔', 'little lamps', 'đèn dầu nhỏ', 'Happy Diwali! Find little lamps to light up the street.', 'Chúc mừng lễ Diwali! Mình tìm đèn nhỏ thắp sáng cả phố nhé.']
];
const GIVER_AT = { hue: 'npc_bahue', nghi: 'npc_ongnghi', lan: 'npc_lan', bom: 'npc_bom', jack: 'npc_jack', ruby: 'npc_ruby' };
const FESTIVALS = FEST.map(([fest, giver, icon, en, vi, sayEn, sayVi]) => A('fest_' + fest, giver, icon, '', '', ['town'], [sayEn, sayVi],
  ['What a lovely festival we had yesterday!', 'Hôm qua lễ hội vui quá con nhỉ!'],
  [go('town', '🏘️', 'Walk to Two Homes Street', 'Đi đến Phố Hai Quê'),
    find(GIVER_AT[giver], { icon, en, vi }, 'Find {n} ' + en, 'Tìm {n} ' + vi),
    give(GIVER_AT[giver], GIVERS[giver].icon, 'Give them to ' + GIVERS[giver].en, 'Đưa cho ' + GIVERS[giver].vi)],
  'fest_' + fest, { festival: fest }));

export const ADVENTURES = [...FIRST, ...MORE, ...FESTIVALS];
export const BY_ID = Object.fromEntries(ADVENTURES.map(a => [a.id, a]));
/** the ten of part A, in the owner's order */
export const FIRST_TEN = FIRST.map(a => a.id);

// the week chest (D10): what a full card of 7 stamps gives, the first not had yet; hats are the companion's
// (js/kidplay.js HATS), pets join the child (js/pets.js PETS, up to two follow; more wait in the pet yard)
export const WEEK_PRIZES = [
  { hat: 'party', icon: '🎉', en: 'A party hat for your companion', vi: 'Mũ sinh nhật cho bạn đồng hành' },
  { pet: 'kitty', icon: '🐱', en: 'A kitten to look after', vi: 'Một bé mèo để chăm sóc' },
  { hat: 'flower', icon: '🌸', en: 'A flower crown for your companion', vi: 'Vòng hoa cho bạn đồng hành' },
  { pet: 'bunny', icon: '🐰', en: 'A bunny to look after', vi: 'Một bé thỏ để chăm sóc' },
  { hat: 'nonla', icon: '👒', en: 'A little nón lá for your companion', vi: 'Nón lá nhỏ cho bạn đồng hành' },
  { pet: 'panda', icon: '🐼', en: 'A baby panda to look after', vi: 'Một bé gấu trúc để chăm sóc' },
  { hat: 'crown', icon: '👑', en: 'A golden crown for your companion', vi: 'Vương miện vàng cho bạn đồng hành' },
  { pet: 'joey', icon: '🦘', en: 'A joey to look after', vi: 'Một bé chuột túi để chăm sóc' },
  { pet: 'calf', icon: '🐮', en: 'A calf to look after', vi: 'Một bé bê để chăm sóc' }
];
export const WEEK_COINS = 50;   // every prize already had: coins instead (never nothing)

// what is said and shown around the adventure (recorded; no child's name)
export const ADV_LINES = {
  title: ['Today\'s adventure', 'Phiêu lưu hôm nay'],
  go: ['Let\'s go!', 'Đi nào!'],
  chest: ['At the end: a surprise chest', 'Cuối cùng: một rương bất ngờ'],
  chestSub: ['A new sticker and 10 coins', 'Một hình dán mới và 10 đồng xu'],
  step: ['Well done! On to the next step.', 'Giỏi lắm! Sang bước tiếp theo nào.'],
  found: ['You found one!', 'Con tìm được một cái rồi!'],
  allFound: ['You found them all!', 'Con tìm được hết rồi!'],
  done: ['You did it! Open your treasure chest.', 'Con làm được rồi! Mở rương báu nào.'],
  doneToday: ['All done for today. A new adventure comes tomorrow!', 'Hôm nay xong rồi. Mai có phiêu lưu mới nhé!'],
  waiting: ['Your adventure things are still waiting for you!', 'Đồ phiêu lưu của con vẫn đang chờ con đó!'],
  count: ['How many did you bring? Count them!', 'Con mang mấy cái? Đếm xem nào!'],
  countCoins: ['How many coins did you earn? Count them!', 'Con được mấy đồng xu? Đếm xem nào!'],
  tryCount: ['Let\'s count again together.', 'Mình cùng đếm lại nhé.'],
  weekChest: ['Seven stamps! The big chest is open.', 'Đủ bảy con dấu! Rương lớn mở rồi.'],
  hurry: ['Tricky! Can you beat the sand timer?', 'Thử thách! Con có nhanh hơn đồng hồ cát không?'],
  beat: ['You beat the timer! Five extra coins.', 'Con nhanh hơn đồng hồ cát! Thêm năm đồng xu.'],
  more: ['More adventures', 'Thêm phiêu lưu'],
  stamps: ['Week stamps', 'Con dấu trong tuần'],
  hear: ['Hear it again', 'Nghe lại'],
  giveIt: ['Give', 'Đưa'],
  pickUp: ['Pick up', 'Nhặt']
};

// ---------- texts ----------
const fill = (s, n) => String(s).replace('{n}', n);
/** how many to find for this age group (D12: 5 and over find 5) */
export const findCount = (step, age) => age === 'big' ? (step.big || step.n || FIND_LITTLE) : (step.n || FIND_LITTLE);
/** a step's short line [en, vi] for this age group */
export function stepText(step, age = 'little') {
  const n = findCount(step, age);
  if (age === 'big' && step.bigText) return [fill(step.bigText[0], n), fill(step.bigText[1], n)];
  return [fill(step.en, n), fill(step.vi, n)];
}
/** the title [en, vi] (a festival one is named after its festival: festNames { id: [en, vi] }) */
export const titleOf = (a, festNames = {}) => a.en ? [a.en, a.vi] : (festNames[a.festival] || [a.id, a.id]);
/** the extra thing a big kid finds too (D12 two-part ask), or null */
export const alsoOf = (step, age) => age === 'big' && step.also ? step.also : null;

// ---------- choosing (D2) ----------
// a small steady hash, so the same child gets the same adventure all day on every device
export function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
/** the places this child can use: the home island and every place they have walked into */
export const unlocked = (visited = {}) => new Set([...HOME_PLACES, ...Object.keys(visited || {}).filter(k => visited[k])]);
/** can this child do it now: the age, and every place it uses unlocked */
export const fits = (a, { age = 'little', visited = {} } = {}) => { const u = unlocked(visited); return a.ages.includes(age === 'big' ? 'big' : 'little') && a.places.every(p => u.has(p)); };
/**
 * today's adventure for one child. ctx: { day (a day number), child (an id), age, visited (profile.visited),
 * history ([{ id, day }], the days each was given), festival (today's festival id or null) }
 * A festival day gives its festival's adventure (once that day); otherwise one not given in the last 7 days, from the
 * places the child has unlocked; when every one was given lately, the one given longest ago.
 */
export function pickAdventure(ctx = {}) {
  const day = ctx.day | 0, history = Array.isArray(ctx.history) ? ctx.history : [];
  const can = ADVENTURES.filter(a => fits(a, ctx));
  if (ctx.festival) { const f = can.find(a => a.festival === ctx.festival); if (f) return f.id; }
  const everyday = can.filter(a => !a.festival); if (!everyday.length) return null;
  const last = id => history.reduce((m, h) => h && h.id === id ? Math.max(m, h.day | 0) : m, -1e9);
  let pool = everyday.filter(a => day - last(a.id) >= NO_REPEAT_DAYS);
  if (!pool.length) { const oldest = Math.min(...everyday.map(a => last(a.id))); pool = everyday.filter(a => last(a.id) === oldest); }
  return pool[hash(String(ctx.child || '') + ':' + day) % pool.length].id;
}

// ---------- the day (owner, 16 Oct AEDT: "when the child first plays") ----------
// The day number is the Sydney date (AEST or AEDT). 'first' (the owner's choice): the adventure of the day the child
// first plays stays all through that play, even past midnight; '6am' and 'midnight' turn over at that hour.
const TZ = 'Australia/Sydney';
let FMT = null;
/** the Sydney date of a moment as a day number (days since 1970-01-01); shift = hours the day starts late (6 for '6am') */
export function sydneyDay(ms = Date.now(), shift = 0) {
  const t = ms - shift * 36e5;
  try {
    FMT = FMT || new Intl.DateTimeFormat('en-AU', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric' });
    const p = Object.fromEntries(FMT.formatToParts(new Date(t)).map(x => [x.type, x.value]));
    return Math.floor(Date.UTC(+p.year, +p.month - 1, +p.day) / 864e5);
  } catch (e) { return Math.floor((t + 10 * 36e5) / 864e5); }
}
export const DAY_STARTS = ['first', '6am', 'midnight'];
export const dayShift = mode => mode === '6am' ? 6 : 0;
/** the weekday (0 Sunday … 6 Saturday) of a day number */
export const weekday = day => (((day + 4) % 7) + 7) % 7;
export const WEEKDAYS = [['Sun', 'CN'], ['Mon', 'T2'], ['Tue', 'T3'], ['Wed', 'T4'], ['Thu', 'T5'], ['Fri', 'T6'], ['Sat', 'T7']];

// ---------- the child's record (kept in profile.adventure) ----------
// { day, id, step, got (things found in this step), done (finished today), history [{ id, day }], stamps [day …]
//   (the card: only ever grows until it is full; D10, ADV-5), chests (full cards opened), prizes [ids had], last (id
//   of the last finished, for D11), lastDay, told (D11 said for this day) }
export function record(p) {
  const r = p.adventure = p.adventure && typeof p.adventure === 'object' && !Array.isArray(p.adventure) ? p.adventure : {};
  r.history = Array.isArray(r.history) ? r.history.filter(h => h && BY_ID[h.id]).slice(-60) : [];
  r.stamps = Array.isArray(r.stamps) ? r.stamps.filter(Number.isFinite).slice(0, WEEK) : [];
  r.prizes = Array.isArray(r.prizes) ? r.prizes : [];
  r.step = Math.max(0, Math.min(3, r.step | 0)); r.got = Math.max(0, r.got | 0); r.chests = r.chests | 0;
  if (r.id && !BY_ID[r.id]) { r.id = null; r.step = 0; r.got = 0; r.done = false; }
  return r;
}
/** a new day: today's adventure is chosen (the old card of stamps is kept: a missed day never takes one away) */
export function newDay(r, ctx) {
  const id = pickAdventure({ ...ctx, history: r.history });
  r.day = ctx.day; r.id = id; r.step = 0; r.got = 0; r.done = false; r.told = false; r.started = false;
  if (id) r.history.push({ id, day: ctx.day });
  return r;
}
/** a step is done: on to the next; returns true when all 3 are done */
export function advance(r) { r.step = Math.min(3, r.step + 1); r.got = 0; return r.step >= 3; }
/** the day's adventure is finished: a stamp on the card (never two the same day); returns true when the card is full */
export function stamp(r, day) {
  r.done = true; r.last = r.id; r.lastDay = day;
  if (!r.stamps.includes(day) && r.stamps.length < WEEK) r.stamps.push(day);
  return r.stamps.length >= WEEK;
}
/** the full card opens the week chest: the next prize not had yet (or coins), and a fresh card */
export function openWeekChest(r, have = { hats: [], pets: [] }) {
  if (r.stamps.length < WEEK) return null;
  const prize = WEEK_PRIZES.find(x => !r.prizes.includes(x.hat || x.pet) && !(x.hat ? (have.hats || []).includes(x.hat) : (have.pets || []).includes(x.pet))) || null;
  if (prize) r.prizes.push(prize.hat || prize.pet);
  r.stamps = []; r.chests++;
  return prize || { coins: WEEK_COINS, icon: '🪙', en: `${WEEK_COINS} coins`, vi: `${WEEK_COINS} đồng xu` };
}
/** D11: what Grandpa Owl says about yesterday's adventure (the day after it was finished), or null */
export function rememberLine(r, day) {
  if (!r.last || r.lastDay == null || day - r.lastDay !== 1 || r.told === day) return null;
  const a = BY_ID[r.last]; return a ? a.miss : null;
}
/** every spoken line, for the voice list (tools and the board): [en, vi] pairs */
export function spokenLines() {
  const out = [];
  for (const a of ADVENTURES) { out.push(a.say, a.miss); for (const s of a.steps) { out.push(stepText(s, 'little')); if (s.kind === 'find' && (s.big || s.bigText)) out.push(stepText(s, 'big')); } }
  for (const k of Object.keys(ADV_LINES)) out.push(ADV_LINES[k]);
  for (const w of WEEK_PRIZES) out.push([w.en, w.vi]);
  const seen = new Set(); return out.filter(l => { const k = l[0] + '|' + l[1]; if (seen.has(k)) return false; seen.add(k); return true; });
}
