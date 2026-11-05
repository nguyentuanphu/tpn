// (v1.08b games, owner's plan 3 Nov 2026 AEDT, docs/plans/links-rollout-install.md "festival games") one game of its own
// for each festival of js/content/festcal.ts, played with the picture-quiz engine (js/games/games108b.ts). A festival game
// is open only in its season: from the day the decorations go up (3 weeks before a party, 3 days before a quiet day)
// until 3 days after; testers see it 7 days earlier. The rest of the year it is put away, and the calendar says when it
// comes back (js/content/festseason.ts). Every line in English and Vietnamese; quiet days are gentle, with no party.
// No imports, so the voice tool can read it.
import type { QuizGame, Opt } from './games108b.js';

const q = (en: string, vi: string, p: string, a: Opt, w: Opt[]) => ({ q: [en, vi] as [string, string], p, a, w });
const F = (fest: string, icon: string, name: [string, string], intro: [string, string], end: [string, string], how: [string, string][], qs: ReturnType<typeof q>[]): QuizGame & { fest: string } =>
  ({ id: 'fg_' + fest, fest, area: 'festival', age: 3, hard: 1, icon, name, intro, end, how, qs });
const HOW: [string, string][] = [['Listen to the question about the festival.', 'Nghe câu hỏi về ngày lễ.'], ['Tap the right picture.', 'Chạm vào bức tranh đúng.']];

export const FEST_GAMES: (QuizGame & { fest: string })[] = [
  F('tet', 'fg:tet', ['Wrap the Bánh Chưng', 'Gói Bánh Chưng'], ['Let us wrap a square bánh chưng for Tết!', 'Cùng gói bánh chưng vuông đón Tết nhé!'], ['A perfect square cake for Tết!', 'Chiếc bánh chưng vuông vức đón Tết rồi!'], HOW, [
    q('What leaves wrap the bánh chưng?', 'Bánh chưng gói bằng lá gì?', '🧧', ['dong leaves', 'lá dong', '🍃'], [['paper', 'giấy', '📄'], ['cloth', 'vải', '🧺']]),
    q('What goes inside first?', 'Cho gì vào trước tiên?', '🍃', ['sticky rice', 'gạo nếp', '🍚'], [['ice cream', 'kem', '🍦'], ['bread', 'bánh mì', '🍞']]),
    q('What goes in the middle?', 'Ở giữa có nhân gì?', '🍚', ['mung beans and pork', 'đậu xanh và thịt', '🫘'], [['chocolate', 'sô-cô-la', '🍫'], ['grapes', 'quả nho', '🍇']]),
    q('What shape is a bánh chưng?', 'Bánh chưng có hình gì?', '🍃', ['a square', 'hình vuông', '🟩'], [['a circle', 'hình tròn', '🟡'], ['a star', 'ngôi sao', '⭐']]),
    q('What do children get at Tết?', 'Ngày Tết trẻ em được nhận gì?', '🧧', ['lucky money', 'lì xì', '🧧'], [['a pumpkin', 'quả bí ngô', '🎃'], ['an egg', 'quả trứng', '🥚']])]),
  F('ramthang1', 'fg:ramthang1', ['First Full Moon Lanterns', 'Thả Đèn Rằm Tháng Giêng'], ['It is the first full moon. Let us light the lanterns!', 'Rằm tháng Giêng rồi. Cùng thắp đèn lồng nhé!'], ['The lanterns glow on the river!', 'Đèn lồng sáng lung linh trên sông!'], HOW, [
    q('What is in the sky tonight?', 'Tối nay trên trời có gì?', '🏮', ['a full moon', 'trăng tròn', '🌕'], [['the sun', 'mặt trời', '☀️'], ['a rainbow', 'cầu vồng', '🌈']]),
    q('What do we light?', 'Mình thắp gì?', '🌕', ['a lantern', 'đèn lồng', '🏮'], [['a kite', 'con diều', '🪁'], ['a ball', 'quả bóng', '⚽']]),
    q('Where do families go today?', 'Hôm nay các gia đình đi đâu?', '🏮', ['to the pagoda', 'đi chùa', '🛕'], [['to the beach', 'ra biển', '🏖️'], ['to school', 'đi học', '🏫']]),
    q('What can float on the river?', 'Cái gì thả trôi trên sông được?', '🌊', ['a flower lantern', 'đèn hoa đăng', '🪷'], [['a stone', 'hòn đá', '🪨'], ['a chair', 'cái ghế', '🪑']]),
    q('How many full moons are in a year?', 'Một năm có mấy lần trăng rằm?', '🌕', ['twelve', 'mười hai', 'n:12'], [['one', 'một', 'n:1'], ['three', 'ba', 'n:3']])]),
  F('giotohung', 'fg:giotohung', ['The Hùng Kings’ Cakes', 'Bánh Dâng Vua Hùng'], ['Today we remember the Hùng Kings. Let us hear their story.', 'Hôm nay mình nhớ các Vua Hùng. Cùng nghe chuyện nhé.'], ['You remember the story well.', 'Con nhớ chuyện thật giỏi.'], HOW, [
    q('Which prince made the square and round cakes?', 'Hoàng tử nào làm bánh chưng, bánh giầy?', '👑', ['Lang Liêu', 'Lang Liêu', '👦'], [['Thánh Gióng', 'Thánh Gióng', '🐎'], ['Chú Cuội', 'Chú Cuội', '🌙']]),
    q('The square cake is like the...', 'Bánh chưng vuông tượng trưng cho...', '🟩', ['earth', 'đất', '🌾'], [['moon', 'mặt trăng', '🌙'], ['sea', 'biển', '🌊']]),
    q('The round cake is like the...', 'Bánh giầy tròn tượng trưng cho...', '⚪', ['sky', 'trời', '☁️'], [['earth', 'đất', '🌾'], ['river', 'sông', '🌊']]),
    q('What do we do on this day?', 'Ngày này mình làm gì?', '👑', ['remember and give thanks', 'tưởng nhớ và biết ơn', '🙏'], [['have a water fight', 'té nước', '💦'], ['go swimming', 'đi bơi', '🏊']]),
    q('What flag do people hang today?', 'Hôm nay mọi người treo cờ gì?', '👑', ['the red flag with a yellow star', 'cờ đỏ sao vàng', '🇻🇳'], [['a kite', 'con diều', '🪁'], ['no flag', 'không treo cờ', '❌']])]),
  F('doanngo', 'fg:doanngo', ['Dragon Boat Race', 'Đua Thuyền Rồng'], ['Tết Đoan Ngọ! Get the dragon boat ready for the race!', 'Tết Đoan Ngọ! Chuẩn bị thuyền rồng đi đua nào!'], ['Your dragon boat wins the race!', 'Thuyền rồng của con về nhất rồi!'], HOW, [
    q('What is at the front of the boat?', 'Đầu thuyền có hình gì?', '🚣', ['a dragon head', 'đầu rồng', '🐉'], [['a cat', 'con mèo', '🐱'], ['a car', 'ô tô', '🚗']]),
    q('What keeps the rowers together?', 'Cái gì giúp người chèo chèo đều?', '🚣', ['a drum', 'cái trống', '🥁'], [['a bell', 'cái chuông', '🔔'], ['a phone', 'điện thoại', '📱']]),
    q('What do we eat at noon on Đoan Ngọ?', 'Trưa Tết Đoan Ngọ mình ăn gì?', '⏰', ['sour fruit', 'trái cây chua', '🍋'], [['ice cream', 'kem', '🍦'], ['cake', 'bánh kem', '🎂']]),
    q('What do we row with?', 'Mình chèo thuyền bằng gì?', '🌊', ['paddles', 'mái chèo', '🛶'], [['spoons', 'thìa', '🥄'], ['pencils', 'bút chì', '✏️']]),
    q('Where is the race?', 'Cuộc đua ở đâu?', '🐉', ['on the river', 'trên sông', '🌊'], [['in the sky', 'trên trời', '☁️'], ['in a house', 'trong nhà', '🏠']])]),
  F('vulan', 'fg:vulan', ['A Rose for Mum', 'Bông Hồng Cài Áo'], ['Vu Lan is the day we thank our parents. Let us find kind things to do.', 'Lễ Vu Lan là ngày cảm ơn cha mẹ. Cùng tìm việc tốt nhé.'], ['Your family feels so loved.', 'Cả nhà thấy được con thương lắm.'], HOW, [
    q('What do people wear on Vu Lan?', 'Ngày Vu Lan mọi người cài gì trên áo?', '👕', ['a little rose', 'bông hồng nhỏ', '🌹'], [['a medal', 'huy chương', '🏅'], ['a badge', 'huy hiệu', '🎀']]),
    q('Who do we thank today?', 'Hôm nay mình cảm ơn ai?', '🌹', ['Mum and Dad', 'cha mẹ', '👪'], [['a dragon', 'con rồng', '🐉'], ['a robot', 'rô-bốt', '🤖']]),
    q('What is a kind thing to do?', 'Việc tốt nên làm là gì?', '💛', ['give a big hug', 'ôm thật chặt', '🤗'], [['shout', 'la hét', '📢'], ['run away', 'chạy đi', '🏃']]),
    q('What can you make for Grandma?', 'Con làm gì tặng bà?', '👵', ['a card', 'tấm thiệp', '💌'], [['a mess', 'bừa bộn', '🧸'], ['a puddle', 'vũng nước', '💦']]),
    q('Where do families go on Vu Lan?', 'Ngày Vu Lan các gia đình đi đâu?', '🌹', ['to the pagoda', 'đi chùa', '🛕'], [['to the zoo', 'sở thú', '🦁'], ['to the airport', 'sân bay', '✈️']])]),
  F('midautumn', 'fg:midautumn', ['Star Lantern Maker', 'Làm Đèn Ông Sao'], ['Trung Thu is here! Let us make a star lantern.', 'Trung Thu đến rồi! Cùng làm đèn ông sao nhé.'], ['Your star lantern shines under the moon!', 'Đèn ông sao của con sáng dưới trăng rằm!'], HOW, [
    q('What shape is the lantern?', 'Đèn ông sao có hình gì?', '🏮', ['a star', 'ngôi sao', '⭐'], [['a square', 'hình vuông', '🟩'], ['a heart', 'trái tim', '💛']]),
    q('What is the frame made of?', 'Khung đèn làm bằng gì?', '⭐', ['bamboo', 'tre', '🎋'], [['ice', 'đá lạnh', '🧊'], ['bread', 'bánh mì', '🍞']]),
    q('What do we put inside to make it glow?', 'Cho gì vào trong để đèn sáng?', '⭐', ['a candle', 'cây nến', '🕯️'], [['water', 'nước', '💧'], ['a fish', 'con cá', '🐟']]),
    q('What cake do we share?', 'Mình cùng ăn bánh gì?', '🌕', ['a mooncake', 'bánh trung thu', '🥮'], [['a birthday cake', 'bánh sinh nhật', '🎂'], ['a pancake', 'bánh kếp', '🥞']]),
    q('Who lives on the moon in the story?', 'Trong truyện, ai sống trên cung trăng?', '🌕', ['Chú Cuội', 'Chú Cuội', '🌳'], [['a turtle', 'con rùa', '🐢'], ['a penguin', 'chim cánh cụt', '🐧']])]),
  F('ongtao', 'fg:ongtao', ['Carp to the Sky', 'Thả Cá Chép Tiễn Ông Táo'], ['The Kitchen Gods ride a carp to the sky. Let us help!', 'Ông Táo cưỡi cá chép về trời. Mình giúp nhé!'], ['The carp swims away to the sky!', 'Cá chép bơi về trời rồi!'], HOW, [
    q('What do the Kitchen Gods ride?', 'Ông Táo cưỡi con gì về trời?', '☁️', ['a golden carp', 'cá chép vàng', '🐟'], [['a horse', 'con ngựa', '🐴'], ['a bike', 'xe đạp', '🚲']]),
    q('Where do we set the carp free?', 'Mình thả cá chép ở đâu?', '🐟', ['in the pond', 'xuống ao', '🌊'], [['in the oven', 'vào lò', '🔥'], ['in a box', 'vào hộp', '📦']]),
    q('Which room do the Kitchen Gods look after?', 'Ông Táo trông nom phòng nào?', '🏠', ['the kitchen', 'nhà bếp', '🍳'], [['the garage', 'nhà để xe', '🚗'], ['the garden', 'khu vườn', '🌳']]),
    q('How many days until Tết?', 'Còn mấy ngày nữa là Tết?', '🧧', ['seven', 'bảy', 'n:7'], [['one hundred', 'một trăm', 'n:100'], ['two', 'hai', 'n:2']]),
    q('What do families start doing now?', 'Bây giờ các gia đình bắt đầu làm gì?', '🧹', ['clean the house', 'dọn nhà', '🧹'], [['go to sleep for a month', 'ngủ một tháng', '🛏️'], ['build a snowman', 'đắp người tuyết', '⛄']])]),
  F('thieunhi', 'fg:thieunhi', ['Children’s Day Balloons', 'Bóng Bay Ngày 1/6'], ['It is Children’s Day! Let us get the party ready.', 'Ngày 1/6 rồi! Cùng chuẩn bị bữa tiệc nhé.'], ['Happy Children’s Day!', 'Chúc mừng ngày 1/6!'], HOW, [
    q('Whose day is 1 June?', 'Ngày 1/6 là ngày của ai?', '🎈', ['children', 'thiếu nhi', '🧒'], [['cars', 'ô tô', '🚗'], ['cats', 'mèo', '🐱']]),
    q('What do we tie to the gate?', 'Mình buộc gì lên cổng?', '🎉', ['balloons', 'bóng bay', '🎈'], [['shoes', 'giày', '👟'], ['fish', 'cá', '🐟']]),
    q('What is a nice present?', 'Quà nào xinh?', '🎁', ['a book', 'quyển sách', '📖'], [['a rock', 'hòn đá', '🪨'], ['a bin', 'thùng rác', '🗑️']]),
    q('What do friends do at the party?', 'Ở bữa tiệc các bạn làm gì?', '🎈', ['play games together', 'chơi cùng nhau', '🤝'], [['argue', 'cãi nhau', '😠'], ['sleep', 'ngủ', '😴']]),
    q('What sweet treat do we share?', 'Mình cùng ăn món ngọt gì?', '🎈', ['chè chuối', 'chè chuối', '🍌'], [['soap', 'xà phòng', '🧼'], ['sand', 'cát', '🏖️']])]),
  F('quockhanh', 'fg:quockhanh', ['Flags for National Day', 'Treo Cờ Mừng Quốc Khánh'], ['Vietnam’s birthday is 2 September. Let us get ready!', 'Ngày 2/9 là sinh nhật đất nước. Chuẩn bị nào!'], ['Happy National Day, Vietnam!', 'Mừng Quốc khánh Việt Nam!'], HOW, [
    q('What colour is the flag of Vietnam?', 'Cờ Việt Nam màu gì?', '🇻🇳', ['red with a yellow star', 'đỏ sao vàng', '🇻🇳'], [['blue with white stars', 'xanh sao trắng', '🔵'], ['green', 'xanh lá', '🟩']]),
    q('What lights up the sky tonight?', 'Tối nay trên trời sáng gì?', '🌙', ['fireworks', 'pháo hoa', '🎆'], [['snow', 'tuyết', '❄️'], ['rain', 'mưa', '🌧️']]),
    q('Which city is the capital of Vietnam?', 'Thủ đô của Việt Nam là thành phố nào?', '🏙️', ['Hà Nội', 'Hà Nội', '🏯'], [['Sydney', 'Sydney', '🌉'], ['Paris', 'Paris', '🗼']]),
    q('What do people eat to celebrate?', 'Mọi người ăn gì mừng lễ?', '🍜', ['a bowl of phở', 'tô phở', '🍜'], [['a pumpkin pie', 'bánh bí ngô', '🎃'], ['a snowball', 'quả cầu tuyết', '⛄']]),
    q('What is the date?', 'Hôm nay là ngày nào?', '📅', ['2 September', 'ngày 2 tháng 9', 'n:2/9'], [['25 December', 'ngày 25 tháng 12', 'n:25/12'], ['1 June', 'ngày 1 tháng 6', 'n:1/6']])]),
  F('nhagiao', 'fg:nhagiao', ['Flowers for the Teacher', 'Hoa Tặng Thầy Cô'], ['It is Teachers’ Day. Let us thank our teachers!', 'Ngày 20/11 rồi. Cùng cảm ơn thầy cô nhé!'], ['Your teacher smiles: thank you!', 'Cô giáo cười thật tươi: cảm ơn con!'], HOW, [
    q('What do we give our teacher?', 'Mình tặng thầy cô gì?', '👩‍🏫', ['flowers', 'bó hoa', '💐'], [['a frog', 'con ếch', '🐸'], ['a shoe', 'chiếc giày', '👟']]),
    q('What do we write in the card?', 'Mình viết gì trong thiệp?', '💌', ['thank you', 'con cảm ơn cô', '💛'], [['go away', 'đi đi', '👋'], ['nothing', 'không gì cả', '❌']]),
    q('Where do teachers work?', 'Thầy cô làm việc ở đâu?', '📚', ['at school', 'ở trường', '🏫'], [['in the sea', 'dưới biển', '🌊'], ['on the moon', 'trên trăng', '🌙']]),
    q('What do teachers help us do?', 'Thầy cô giúp mình làm gì?', '🏫', ['learn to read', 'học đọc', '📖'], [['fly', 'bay', '🦅'], ['swim with sharks', 'bơi với cá mập', '🦈']]),
    q('What is the date of Teachers’ Day?', 'Ngày Nhà giáo là ngày nào?', '📅', ['20 November', 'ngày 20 tháng 11', 'n:20/11'], [['1 June', 'ngày 1 tháng 6', 'n:1/6'], ['2 September', 'ngày 2 tháng 9', 'n:2/9']])]),
  F('easter', 'fg:easter', ['Easter Egg Painting', 'Tô Trứng Phục Sinh'], ['Happy Easter! Let us find and paint the eggs.', 'Phục Sinh vui vẻ! Cùng tìm và tô trứng nhé.'], ['Beautiful Easter eggs!', 'Những quả trứng Phục Sinh thật đẹp!'], HOW, [
    q('What do children hunt for at Easter?', 'Lễ Phục Sinh các bạn đi tìm gì?', '🧺', ['eggs', 'trứng', '🥚'], [['shoes', 'giày', '👟'], ['cars', 'ô tô', '🚗']]),
    q('Which Australian animal brings Easter treats?', 'Con vật nào ở Úc mang quà Phục Sinh?', '🥚', ['the Easter Bilby', 'chuột Bilby', '🐭'], [['a shark', 'cá mập', '🦈'], ['a cow', 'con bò', '🐄']]),
    q('What do we paint the eggs with?', 'Mình tô trứng bằng gì?', '🥚', ['a paintbrush', 'cọ vẽ', '🖌️'], [['a fork', 'cái nĩa', '🥄'], ['a hammer', 'cái búa', '🔨']]),
    q('Where are the eggs hidden?', 'Trứng được giấu ở đâu?', '🥚', ['in the garden', 'trong vườn', '🌷'], [['in the oven', 'trong lò', '🔥'], ['on the moon', 'trên trăng', '🌙']]),
    q('What do we carry the eggs in?', 'Mình đựng trứng vào gì?', '🥚', ['a basket', 'cái giỏ', '🧺'], [['a pocket of water', 'túi nước', '💧'], ['a hat', 'cái mũ', '🎩']])]),
  F('mothersday', 'fg:mothersday', ['Card for Mum', 'Thiệp Tặng Mẹ'], ['It is Mother’s Day! Let us make Mum a card.', 'Ngày của Mẹ! Cùng làm thiệp tặng mẹ nhé.'], ['Mum loves your card!', 'Mẹ thích tấm thiệp của con lắm!'], HOW, [
    q('Who do we thank today?', 'Hôm nay mình cảm ơn ai?', '💝', ['Mum and Grandma', 'mẹ và bà', '👩'], [['the postman only', 'chỉ bác đưa thư', '📮'], ['a robot', 'rô-bốt', '🤖']]),
    q('What do we draw on the card?', 'Mình vẽ gì lên thiệp?', '💌', ['a heart', 'trái tim', '💛'], [['a monster', 'quái vật', '👹'], ['a bin', 'thùng rác', '🗑️']]),
    q('What can you give Mum in the morning?', 'Buổi sáng con tặng mẹ gì?', '☀️', ['breakfast in bed', 'bữa sáng', '🍳'], [['a mess', 'bừa bộn', '🧸'], ['a loud noise', 'tiếng ồn', '📢']]),
    q('What flower can you pick for Mum?', 'Con hái hoa gì tặng mẹ?', '🌷', ['a rose', 'hoa hồng', '🌹'], [['a cactus', 'xương rồng', '🌵'], ['a leaf', 'chiếc lá', '🍂']]),
    q('What does Mum like best?', 'Mẹ thích nhất điều gì?', '💝', ['a big hug', 'cái ôm thật chặt', '🤗'], [['a frown', 'cái nhăn mặt', '😠'], ['a puddle', 'vũng nước', '💦']])]),
  F('fathersday', 'fg:fathersday', ['Picnic with Dad', 'Dã Ngoại Cùng Bố'], ['It is Father’s Day! Let us plan a day with Dad.', 'Ngày của Bố! Cùng lên kế hoạch đi chơi với bố nhé.'], ['Dad had the best day!', 'Bố có một ngày thật vui!'], HOW, [
    q('Who do we thank today?', 'Hôm nay mình cảm ơn ai?', '👔', ['Dad and Grandpa', 'bố và ông', '👨'], [['a shark', 'cá mập', '🦈'], ['a teacher only', 'chỉ thầy cô', '🏫']]),
    q('In which month is Father’s Day in Australia?', 'Ở Úc, Ngày của Bố vào tháng mấy?', '📅', ['September', 'tháng 9', 'n:9'], [['January', 'tháng 1', 'n:1'], ['June', 'tháng 6', 'n:6']]),
    q('What can we play with Dad in the park?', 'Ra công viên mình chơi gì với bố?', '🌳', ['catch a ball', 'chơi bắt bóng', '⚽'], [['wash dishes', 'rửa bát', '🍽️'], ['sleep', 'ngủ', '😴']]),
    q('What do we eat at an Aussie barbecue?', 'Tiệc nướng kiểu Úc ăn gì?', '🔥', ['a sausage sizzle', 'xúc xích nướng', '🌭'], [['snow', 'tuyết', '❄️'], ['soap', 'xà phòng', '🧼']]),
    q('What can you make for Dad?', 'Con làm gì tặng bố?', '👔', ['a card', 'tấm thiệp', '💌'], [['a mess', 'bừa bộn', '🧸'], ['a puddle', 'vũng nước', '💦']])]),
  F('halloween', 'fg:halloween', ['Pumpkin Lantern', 'Đèn Bí Ngô'], ['Happy Halloween! Let us carve a smiling pumpkin.', 'Halloween vui vẻ! Cùng khắc quả bí ngô cười nhé.'], ['A friendly pumpkin lantern!', 'Đèn bí ngô thật thân thiện!'], HOW, [
    q('What do we carve for Halloween?', 'Halloween mình khắc gì?', '🕯️', ['a pumpkin', 'quả bí ngô', '🎃'], [['a watermelon', 'dưa hấu', '🍉'], ['an egg', 'quả trứng', '🥚']]),
    q('What do children say at the door?', 'Các bạn nói gì ở cửa?', '🚪', ['Trick or treat!', 'Cho kẹo hay bị ghẹo!', '🍬'], [['Happy birthday!', 'Chúc mừng sinh nhật!', '🎂'], ['Good night!', 'Chúc ngủ ngon!', '🌙']]),
    q('What do children wear?', 'Các bạn mặc gì?', '🎃', ['fun costumes', 'đồ hoá trang', '🦸'], [['swimsuits', 'đồ bơi', '🩱'], ['pyjamas', 'đồ ngủ', '🛏️']]),
    q('What makes the pumpkin glow?', 'Cái gì làm bí ngô sáng?', '🎃', ['a little light', 'ngọn đèn nhỏ', '🕯️'], [['water', 'nước', '💧'], ['a sock', 'chiếc tất', '🧦']]),
    q('What do we get as a treat?', 'Mình được món quà gì?', '🍬', ['a lolly', 'cái kẹo', '🍬'], [['a rock', 'hòn đá', '🪨'], ['a shoe', 'chiếc giày', '👟']])]),
  F('christmas', 'fg:christmas', ['Trim the Christmas Tree', 'Trang Trí Cây Thông'], ['Merry Christmas! Let us dress the tree.', 'Giáng Sinh vui vẻ! Cùng trang trí cây thông nhé.'], ['What a sparkly tree!', 'Cây thông lấp lánh quá!'], HOW, [
    q('What goes on top of the tree?', 'Trên đỉnh cây thông có gì?', '🎄', ['a star', 'ngôi sao', '⭐'], [['a boot', 'chiếc ủng', '👢'], ['a fish', 'con cá', '🐟']]),
    q('What hangs on the branches?', 'Trên cành treo gì?', '🎄', ['baubles', 'quả châu', '🔴'], [['socks with holes', 'tất thủng', '🧦'], ['spoons', 'thìa', '🥄']]),
    q('What goes under the tree?', 'Dưới gốc cây có gì?', '🎄', ['presents', 'quà', '🎁'], [['a bath', 'bồn tắm', '🛁'], ['a bus', 'xe buýt', '🚌']]),
    q('In Australia Christmas is in...', 'Ở Úc, Giáng Sinh vào mùa...', '☀️', ['summer', 'hè', '🏖️'], [['winter snow', 'đông có tuyết', '❄️'], ['night only', 'chỉ ban đêm', '🌙']]),
    q('Who brings presents in the story?', 'Trong truyện ai mang quà đến?', '🎁', ['Santa', 'ông già Noel', '🎅'], [['a crocodile', 'cá sấu', '🐊'], ['a fish', 'con cá', '🐟']])]),
  F('newyear', 'fg:newyear', ['Countdown to New Year', 'Đếm Ngược Năm Mới'], ['It is New Year’s Eve! Let us count down.', 'Đêm giao thừa rồi! Cùng đếm ngược nhé.'], ['Happy New Year!', 'Chúc mừng năm mới!'], HOW, [
    q('What comes after three, two...?', 'Sau ba, hai... là số mấy?', '🎆', ['one', 'một', 'n:1'], [['five', 'năm', 'n:5'], ['ten', 'mười', 'n:10']]),
    q('What lights up the harbour at midnight?', 'Nửa đêm cái gì sáng trên cảng?', '🌉', ['fireworks', 'pháo hoa', '🎆'], [['a rainbow', 'cầu vồng', '🌈'], ['the sun', 'mặt trời', '☀️']]),
    q('Which bridge has fireworks in Sydney?', 'Pháo hoa ở cây cầu nào của Sydney?', '🎆', ['the Harbour Bridge', 'cầu Cảng', '🌉'], [['a rope bridge', 'cầu dây', '🪢'], ['a toy bridge', 'cầu đồ chơi', '🧸']]),
    q('What do we say at midnight?', 'Nửa đêm mình nói gì?', '⏰', ['Happy New Year!', 'Chúc mừng năm mới!', '🎉'], [['Good morning!', 'Chào buổi sáng!', '☀️'], ['Trick or treat!', 'Cho kẹo hay bị ghẹo!', '🎃']]),
    q('What can we make for the new year?', 'Năm mới mình làm gì?', '🎉', ['a wish', 'một điều ước', '⭐'], [['a mess', 'bừa bộn', '🧸'], ['a frown', 'nhăn mặt', '😠']])]),
  F('ausday', 'fg:ausday', ['Backyard Cricket Day', 'Cricket Sân Sau'], ['Happy Australia Day! Let us play in the backyard.', 'Chúc mừng Ngày Nước Úc! Ra sân sau chơi nhé.'], ['What a great day outside!', 'Một ngày ngoài trời thật vui!'], HOW, [
    q('What do we hit the ball with in cricket?', 'Chơi cricket mình đánh bóng bằng gì?', '🏏', ['a bat', 'cây gậy', '🏏'], [['a spoon', 'cái thìa', '🥄'], ['a pillow', 'cái gối', '🛏️']]),
    q('Which animal is on the Australian coat of arms?', 'Con vật nào có trên quốc huy Úc?', '🇦🇺', ['the kangaroo', 'con chuột túi', '🦘'], [['the panda', 'gấu trúc', '🐼'], ['the tiger', 'con hổ', '🐯']]),
    q('What do families cook outside?', 'Các gia đình nấu gì ngoài trời?', '🔥', ['a barbecue', 'tiệc nướng', '🌭'], [['snow soup', 'canh tuyết', '❄️'], ['nothing', 'không nấu gì', '❌']]),
    q('Who has cared for this land for a very long time?', 'Ai đã chăm sóc vùng đất này từ rất lâu?', '🌏', ['the First Nations people', 'người Thổ dân', '🪃'], [['the ducks', 'những chú vịt', '🦆'], ['robots', 'rô-bốt', '🤖']]),
    q('What do we wear in the summer sun?', 'Trời nắng hè mình đội gì?', '☀️', ['a sun hat', 'mũ che nắng', '👒'], [['a scarf', 'khăn len', '🧣'], ['gloves', 'găng tay', '🧤']])]),
  F('cleanup', 'fg:cleanup', ['Clean Up the Park', 'Dọn Sạch Công Viên'], ['It is Clean Up Australia Day! Let us tidy the park.', 'Ngày Làm Sạch nước Úc! Cùng dọn công viên nhé.'], ['The park is sparkling clean!', 'Công viên sạch bong rồi!'], HOW, [
    q('Where does a plastic bottle go?', 'Chai nhựa bỏ vào đâu?', '🍼', ['the recycling bin', 'thùng tái chế', '♻️'], [['the river', 'xuống sông', '🌊'], ['the sandpit', 'hố cát', '🏖️']]),
    q('Where does a banana peel go?', 'Vỏ chuối bỏ vào đâu?', '🍌', ['the compost', 'thùng phân hữu cơ', '🌱'], [['the pond', 'xuống ao', '🐟'], ['a pocket', 'vào túi áo', '👖']]),
    q('What do we wear to pick up rubbish?', 'Nhặt rác mình đeo gì?', '🗑️', ['gloves', 'găng tay', '🧤'], [['a crown', 'vương miện', '👑'], ['flippers', 'chân vịt', '🦆']]),
    q('Who is happy when the beach is clean?', 'Bãi biển sạch thì ai vui?', '🏖️', ['the turtles', 'những chú rùa', '🐢'], [['the rubbish', 'đống rác', '🗑️'], ['nobody', 'không ai', '❌']]),
    q('What can we carry the rubbish in?', 'Mình đựng rác vào gì?', '🗑️', ['a bag', 'cái túi', '🛍️'], [['our hat', 'cái mũ', '🎩'], ['a cake', 'cái bánh', '🎂']])]),
  F('harmony', 'fg:harmony', ['Hello in Many Languages', 'Xin Chào Nhiều Thứ Tiếng'], ['Happy Harmony Day! Everyone belongs. Let us say hello!', 'Mừng Ngày Hòa hợp! Ai cũng thuộc về nơi này. Cùng chào nhé!'], ['Everyone belongs!', 'Ai cũng thuộc về nơi này!'], HOW, [
    q('What colour do people wear on Harmony Day?', 'Ngày Hòa hợp mọi người mặc màu gì?', '🤝', ['orange', 'màu cam', '🟧'], [['black', 'màu đen', '⬛'], ['white', 'màu trắng', '☁️']]),
    q('How do you say hello in Vietnamese?', 'Tiếng Việt chào thế nào?', '🇻🇳', ['Xin chào', 'Xin chào', '👋'], [['Bonjour', 'Bonjour', '🍞'], ['Ciao', 'Ciao', '🍕']]),
    q('How do you say hello in Chinese?', 'Tiếng Trung chào thế nào?', '🏮', ['Nǐ hǎo', 'Nǐ hǎo', '👋'], [['Namaste', 'Namaste', '🙏'], ['G’day', 'G’day', '🦘']]),
    q('How do you say hello in Hindi?', 'Tiếng Hindi chào thế nào?', '🪔', ['Namaste', 'Namaste', '🙏'], [['Nǐ hǎo', 'Nǐ hǎo', '👋'], ['Xin chào', 'Xin chào', '🇻🇳']]),
    q('What do friends do when they are different?', 'Khi các bạn khác nhau thì làm gì?', '🤝', ['play together', 'chơi cùng nhau', '🤝'], [['stay away', 'tránh xa', '🚶'], ['laugh at them', 'cười chê', '😆']])]),
  F('holi', 'fg:holi', ['Colour Splash', 'Tung Bột Màu Holi'], ['Happy Holi! Spring is here. Let us splash the colours!', 'Chúc mừng Holi! Mùa xuân đến rồi. Cùng tung màu nhé!'], ['Every colour of the rainbow!', 'Đủ màu như cầu vồng!'], HOW, [
    q('What do people throw at Holi?', 'Lễ Holi mọi người tung gì?', '🎨', ['coloured powder', 'bột màu', '🌈'], [['stones', 'đá', '🪨'], ['shoes', 'giày', '👟']]),
    q('Which season does Holi welcome?', 'Lễ Holi đón mùa nào?', '🌸', ['spring', 'mùa xuân', '🌷'], [['winter', 'mùa đông', '❄️'], ['night', 'ban đêm', '🌙']]),
    q('Which country does Holi come from?', 'Lễ Holi đến từ nước nào?', '🎨', ['India', 'Ấn Độ', '🕌'], [['the moon', 'mặt trăng', '🌙'], ['the sea', 'biển', '🌊']]),
    q('What do we splash with?', 'Mình té bằng gì?', '💦', ['water', 'nước', '💧'], [['sand', 'cát', '🏖️'], ['soup', 'canh', '🍲']]),
    q('Red and yellow make...', 'Đỏ và vàng pha thành...', '🎨', ['orange', 'màu cam', '🟧'], [['blue', 'màu xanh dương', '🟦'], ['black', 'màu đen', '⬛']])]),
  F('anzac', 'fg:anzac', ['Anzac Biscuits', 'Bánh Quy Anzac'], ['Anzac Day is a quiet day to remember. Let us bake Anzac biscuits.', 'Ngày Anzac là ngày lặng lẽ tưởng nhớ. Cùng nướng bánh quy Anzac nhé.'], ['Warm biscuits to share, and a wish for peace.', 'Bánh quy ấm để cùng ăn, và một điều ước hoà bình.'], HOW, [
    q('What grain goes in Anzac biscuits?', 'Bánh quy Anzac có loại hạt gì?', '🍪', ['oats', 'yến mạch', '🌾'], [['rice', 'gạo', '🍚'], ['corn', 'ngô', '🌽']]),
    q('What makes them sweet and golden?', 'Cái gì làm bánh ngọt và vàng óng?', '🍪', ['golden syrup', 'mật đường', '🍯'], [['water', 'nước', '💧'], ['pepper', 'tiêu', '🌶️']]),
    q('What flower do people wear on Anzac Day?', 'Ngày Anzac mọi người cài hoa gì?', '🌺', ['a red poppy', 'hoa anh túc đỏ', '🌺'], [['a sunflower', 'hướng dương', '🌻'], ['a lotus', 'hoa sen', '🪷']]),
    q('How do people feel on this day?', 'Ngày này mọi người thế nào?', '🌅', ['quiet and thankful', 'lặng lẽ và biết ơn', '🙏'], [['silly', 'nghịch ngợm', '🤪'], ['grumpy', 'cáu kỉnh', '😠']]),
    q('What do we wish for?', 'Mình cầu mong điều gì?', '🕊️', ['peace', 'hoà bình', '🕊️'], [['more noise', 'ồn ào hơn', '📢'], ['rain all year', 'mưa cả năm', '🌧️']])]),
  F('reconciliation', 'fg:reconciliation', ['Hands Together', 'Những Bàn Tay Nắm Lấy Nhau'], ['It is Reconciliation Week. Let us learn and be good friends.', 'Đây là Tuần lễ Hòa giải. Cùng tìm hiểu và làm bạn tốt nhé.'], ['Good friends, hand in hand.', 'Bạn tốt nắm tay nhau.'], HOW, [
    q('Who were the first people of Australia?', 'Ai là những người đầu tiên ở Úc?', '🌏', ['the First Nations people', 'người Thổ dân', '🪃'], [['astronauts', 'phi hành gia', '🚀'], ['the ducks', 'những chú vịt', '🦆']]),
    q('What do good friends do?', 'Bạn tốt làm gì?', '🤝', ['listen to each other', 'lắng nghe nhau', '👂'], [['push', 'xô đẩy', '✋'], ['shout', 'la hét', '📢']]),
    q('What is a kind thing to share?', 'Điều tốt để chia sẻ là gì?', '💛', ['a story', 'một câu chuyện', '📖'], [['a frown', 'nhăn mặt', '😠'], ['a puddle', 'vũng nước', '💦']]),
    q('What can we learn about?', 'Mình có thể tìm hiểu về điều gì?', '🎨', ['dot paintings', 'tranh chấm', '🎨'], [['nothing', 'không gì', '❌'], ['only TV', 'chỉ ti vi', '📺']]),
    q('How do we walk together?', 'Mình cùng đi thế nào?', '🚶', ['hand in hand', 'tay trong tay', '🤝'], [['far apart', 'cách xa nhau', '↔️'], ['backwards', 'đi giật lùi', '⬅️']])]),
  F('naidoc', 'fg:naidoc', ['Dot Painting Story', 'Tranh Chấm Kể Chuyện'], ['It is NAIDOC Week! Let us learn a dot painting story.', 'Tuần lễ NAIDOC rồi! Cùng xem tranh chấm kể chuyện nhé.'], ['Your painting tells a story!', 'Bức tranh của con kể một câu chuyện!'], HOW, [
    q('A circle of dots means a...', 'Vòng tròn chấm có nghĩa là...', '🎨', ['meeting place', 'nơi gặp gỡ', '⭕'], [['a car', 'ô tô', '🚗'], ['a pizza', 'bánh pizza', '🍕']]),
    q('Wavy lines can mean...', 'Đường lượn sóng có nghĩa là...', '〰️', ['water', 'nước', '🌊'], [['a phone', 'điện thoại', '📱'], ['a bed', 'cái giường', '🛏️']]),
    q('What do we paint the dots with?', 'Mình chấm màu bằng gì?', '🎨', ['a stick', 'que gỗ', '🪵'], [['a sock', 'chiếc tất', '🧦'], ['an ice cube', 'viên đá', '🧊']]),
    q('Which colours come from the earth?', 'Màu nào lấy từ đất?', '🪨', ['ochre red and yellow', 'đỏ và vàng đất', '🟫'], [['neon pink', 'hồng dạ quang', '🌸'], ['silver', 'bạc', '🪙']]),
    q('What can we throw that comes back?', 'Cái gì ném đi lại bay về?', '🪃', ['a boomerang', 'cây boomerang', '🪃'], [['a ball of wool', 'cuộn len', '🧶'], ['a cup', 'cái cốc', '🥤']])]),
  F('diwali', 'fg:diwali', ['Light the Diyas', 'Thắp Đèn Diya'], ['Happy Diwali, the festival of lights! Let us light the diyas.', 'Chúc mừng Diwali, lễ hội ánh sáng! Cùng thắp đèn diya nhé.'], ['The whole street is glowing!', 'Cả con phố sáng rực rồi!'], HOW, [
    q('What little lamps do families light?', 'Các gia đình thắp đèn nhỏ gì?', '✨', ['diyas', 'đèn diya', '🪔'], [['ice cubes', 'đá lạnh', '🧊'], ['traffic lights', 'đèn giao thông', '🚦']]),
    q('What is a diya made of?', 'Đèn diya làm bằng gì?', '🪔', ['clay', 'đất sét', '🏺'], [['ice', 'đá lạnh', '🧊'], ['paper', 'giấy', '📄']]),
    q('What pattern do we draw at the door?', 'Mình vẽ hoa văn gì trước cửa?', '🚪', ['rangoli', 'tranh rangoli', '🌸'], [['a zebra', 'ngựa vằn', '🦓'], ['a car', 'ô tô', '🚗']]),
    q('What sweets do we share?', 'Mình chia nhau kẹo gì?', '🍬', ['ladoo', 'kẹo laddu', '🟠'], [['soap', 'xà phòng', '🧼'], ['stones', 'sỏi', '🪨']]),
    q('Diwali is the festival of...', 'Diwali là lễ hội của...', '🪔', ['lights', 'ánh sáng', '✨'], [['snow', 'tuyết', '❄️'], ['silence', 'im lặng', '🤫']])])
];
/** the festival game of a festival, and the festival of a game */
export const FEST_GAME_OF: Record<string, string> = Object.fromEntries(FEST_GAMES.map(g => [g.fest, g.id]));
export const FEST_OF_GAME: Record<string, string> = Object.fromEntries(FEST_GAMES.map(g => [g.id, g.fest]));
