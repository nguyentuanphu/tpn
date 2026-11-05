// (v1.08d s2au, owner 3 and 5 Nov 2026 AEDT: docs/cores/tasks/v108d/s2au-brief.md) the games of Season 2, Australia:
// three for each region (the Great Barrier Reef, Tasmania, Perth and Rottnest Island). js/games/s2au.ts plays them on
// the maths kit's rounds, in three kinds:
//   hunt  a scene full of animals: tap every one of the kind asked for (the others are left alone)
//   path  a grid of squares: tap the squares that make the way from the start to the end (dead ends do not count)
//   quiz  a picture question with answer cards
// Every line is written in full, in English and Vietnamese, so the voice pack records it (tools/voice-lines.mts); none
// has a child's name in it. Pictures are our own drawings (js/art/s2au.ts). No imports, so the voice tool can read it.

/** an answer: [English, Vietnamese, picture] */
export type Opt = [string, string, string];
export type Q = { q: [string, string]; p: string; a: Opt; w?: Opt[] };
/** a kind of animal to find: what is asked, and its picture */
export type Kind = { ask: [string, string]; p: string };
export type S2Game = {
  id: string; region: 'gbr' | 'tas' | 'perth'; kind: 'hunt' | 'path' | 'quiz'; icon: string; name: [string, string];
  age: number; hard: number; intro: [string, string]; end: [string, string]; how: [string, string][];
  bg: string;                       // the scene's look: reef, beach, bush, night, river
  kinds?: Kind[]; deco?: string[];  // hunt: the animals (each round asks for one, the others hide among them), and still things
  path?: { from: string; to: string; ask: [string, string]; cell: string }; // path: who walks, where to, what is said, the squares' look
  qs?: Q[];                         // quiz
};
const q = (en: string, vi: string, p: string, a: Opt, w?: Opt[]): Q => ({ q: [en, vi], p, a, w });
const k = (en: string, vi: string, p: string): Kind => ({ ask: [en, vi], p });

export const S2_GAMES: S2Game[] = [
  // ---------- the Great Barrier Reef ----------
  { id: 's2a_snorkel', region: 'gbr', kind: 'hunt', icon: 'au:snorkel', name: ['Snorkel Spotter', 'Lặn Ngắm Tìm Bạn'], age: 3, hard: 1, bg: 'reef',
    intro: ['Put on your mask and snorkel. Let us look for animals on the reef!', 'Đeo kính lặn và ống thở vào. Mình cùng tìm các con vật trên rạn san hô nhé!'],
    end: ['You found every reef animal. What a good snorkeller!', 'Con tìm được hết các con vật trên rạn san hô. Con lặn ngắm giỏi quá!'],
    how: [['Listen to the animal you need to find.', 'Nghe tên con vật cần tìm.'], ['Tap every one of them on the reef.', 'Chạm vào tất cả các bạn ấy trên rạn san hô.'], ['Leave the other animals alone.', 'Để yên các con vật khác nhé.']],
    kinds: [k('Tap every sea turtle!', 'Chạm vào tất cả rùa biển nhé!', 'au:seaturtle'), k('Tap every clownfish!', 'Chạm vào tất cả cá hề nhé!', 'au:clown'),
      k('Tap every starfish!', 'Chạm vào tất cả sao biển nhé!', 'au:starfish'), k('Tap every stingray!', 'Chạm vào tất cả cá đuối nhé!', 'au:ray'),
      k('Tap every blue tang!', 'Chạm vào tất cả cá đuôi gai xanh nhé!', 'au:bluetang'), k('Tap every octopus!', 'Chạm vào tất cả bạch tuộc nhé!', 'au:octopus')],
    deco: ['au:coral', 'au:weed', 'au:anemone'] },
  { id: 's2a_turtle', region: 'gbr', kind: 'path', icon: 'au:turtle', name: ['Turtle to the Sea', 'Rùa Con Về Biển'], age: 3, hard: 1, bg: 'beach',
    intro: ['A baby turtle has hatched on the beach. Help it find the way to the sea!', 'Một chú rùa con vừa nở trên bãi cát. Giúp rùa con tìm đường ra biển nhé!'],
    end: ['Splash! Every baby turtle is swimming in the sea.', 'Tõm! Các chú rùa con đều đã bơi ra biển rồi.'],
    how: [['The baby turtle starts on the left. The sea is on the right.', 'Rùa con ở bên trái. Biển ở bên phải.'], ['Tap the sand squares that join the turtle to the sea.', 'Chạm vào các ô cát nối rùa con với biển.'], ['Some sand paths stop at a rock. Leave those ones.', 'Có đường cát bị tảng đá chặn. Bỏ qua đường đó nhé.']],
    path: { from: 'au:babyturtle', to: 'au:wave', ask: ['Tap the sand squares that take the baby turtle to the sea!', 'Chạm vào các ô cát dẫn rùa con ra biển nhé!'], cell: 'au:sand' } },
  { id: 's2a_reefquiz', region: 'gbr', kind: 'quiz', icon: 'au:reefquiz', name: ['Reef Friends', 'Bạn Bè Rạn San Hô'], age: 4, hard: 2, bg: 'reef',
    intro: ['Mia the reef ranger has some questions about the reef!', 'Chị kiểm lâm Mia có mấy câu đố về rạn san hô đây!'],
    end: ['You know so much about the Great Barrier Reef!', 'Con biết nhiều về rạn san hô Great Barrier quá!'],
    how: [['Listen to the question about the reef.', 'Nghe câu hỏi về rạn san hô.'], ['Tap the right answer.', 'Chạm vào câu trả lời đúng.']],
    qs: [q('Who lives in the sea anemone?', 'Ai sống trong hải quỳ?', 'au:anemone', ['clownfish', 'cá hề', 'au:clown']),
      q('Which animal has a hard shell and swims in the sea?', 'Con nào có mai cứng và bơi dưới biển?', 'au:wave', ['sea turtle', 'rùa biển', 'au:seaturtle']),
      q('Which animal has eight arms?', 'Con nào có tám cái tay?', 'au:wave', ['octopus', 'bạch tuộc', 'au:octopus']),
      q('Which animal is shaped like a star?', 'Con nào có hình ngôi sao?', 'au:wave', ['starfish', 'sao biển', 'au:starfish']),
      q('Which fish is blue with a yellow tail?', 'Cá nào màu xanh có đuôi vàng?', 'au:wave', ['blue tang', 'cá đuôi gai xanh', 'au:bluetang']),
      q('Which big animal sings songs in the sea?', 'Con vật to nào hát dưới biển?', 'au:wave', ['humpback whale', 'cá voi lưng gù', 'au:whale']),
      q('What do we wear to look under the water?', 'Mình đeo gì để nhìn dưới nước?', 'au:snorkel', ['a mask and snorkel', 'kính lặn và ống thở', 'au:mask'],
        [['sunglasses', 'kính râm', 'au:sunnies'], ['a sun hat', 'mũ che nắng', 'au:sunhat'], ['a raincoat', 'áo mưa', 'au:raincoat']]),
      q('How do we keep the reef safe?', 'Mình giữ cho rạn san hô an toàn thế nào?', 'au:coral', ['look, but do not touch', 'chỉ ngắm, không chạm', 'au:look'],
        [['take some coral home', 'mang san hô về nhà', 'au:coral'], ['leave rubbish on the beach', 'bỏ rác trên bãi biển', 'au:rubbish'], ['stand on the coral', 'đứng lên san hô', 'au:feet']]),
      q('What colour does coral turn when the sea is too hot?', 'Khi biển quá nóng, san hô chuyển sang màu gì?', 'au:coral', ['white', 'màu trắng', 'au:whitecoral'],
        [['purple', 'màu tím', 'au:coral'], ['green', 'màu xanh lá', 'au:weed'], ['black', 'màu đen', 'au:rock']])] },
  // ---------- Tasmania ----------
  { id: 's2a_wombat', region: 'tas', kind: 'path', icon: 'au:wombat', name: ['Wombat Burrow', 'Hang Gấu Túi Mũi Trần'], age: 3, hard: 1, bg: 'bush', deco: ['au:fern', 'au:log', 'au:rock'],
    intro: ['A sleepy wombat wants to go home to its burrow. Show it the way through the tunnels!', 'Bạn gấu túi mũi trần buồn ngủ muốn về hang. Chỉ đường cho bạn ấy qua các đường hầm nhé!'],
    end: ['Every wombat is home, snug in its burrow. Good night, wombats!', 'Các bạn gấu túi mũi trần đều đã về hang ấm áp. Chúc ngủ ngon nhé!'],
    how: [['The wombat is on the left. Its burrow is on the right.', 'Bạn gấu túi ở bên trái. Hang của bạn ấy ở bên phải.'], ['Tap the tunnel squares that join the wombat to its burrow.', 'Chạm vào các ô đường hầm nối bạn gấu túi với hang.'], ['Some tunnels stop. Leave those ones.', 'Có đường hầm bị cụt. Bỏ qua đường đó nhé.']],
    path: { from: 'au:wombat', to: 'au:burrow', ask: ['Tap the tunnels that take the wombat home to its burrow!', 'Chạm vào các đường hầm đưa bạn gấu túi về hang nhé!'], cell: 'au:tunnel' } },
  { id: 's2a_devil', region: 'tas', kind: 'hunt', icon: 'au:devil', name: ['Spot the Devil', 'Tìm Quỷ Tasmania'], age: 3, hard: 1, bg: 'night',
    intro: ['It is night in the Tasmanian bush. Shine your torch and find the animals!', 'Trời tối trong rừng Tasmania rồi. Soi đèn pin và tìm các con vật nhé!'],
    end: ['You spotted every animal in the night bush!', 'Con tìm được hết các con vật trong rừng đêm rồi!'],
    how: [['Listen to the animal you need to find.', 'Nghe tên con vật cần tìm.'], ['Tap every one of them in the bush.', 'Chạm vào tất cả các bạn ấy trong rừng.'], ['Leave the other animals alone.', 'Để yên các con vật khác nhé.']],
    kinds: [k('Tap every Tasmanian devil!', 'Chạm vào tất cả quỷ Tasmania nhé!', 'au:devil'), k('Tap every wombat!', 'Chạm vào tất cả gấu túi mũi trần nhé!', 'au:wombat'),
      k('Tap every echidna!', 'Chạm vào tất cả thú lông nhím nhé!', 'au:echidna'), k('Tap every platypus!', 'Chạm vào tất cả thú mỏ vịt nhé!', 'au:platypus'),
      k('Tap every possum!', 'Chạm vào tất cả thú có túi possum nhé!', 'au:possum'), k('Tap every pademelon!', 'Chạm vào tất cả chuột túi nhỏ pademelon nhé!', 'au:pademelon')],
    deco: ['au:fern', 'au:log', 'au:star'] },
  { id: 's2a_cradle', region: 'tas', kind: 'quiz', icon: 'au:hike', name: ['Cradle Mountain Walk', 'Đi Bộ Núi Cradle'], age: 4, hard: 2, bg: 'bush',
    intro: ['Ollie the bushwalker is taking us up Cradle Mountain. Answer his questions on the way!', 'Anh Ollie hay đi bộ đường rừng dẫn mình lên núi Cradle. Trả lời câu hỏi của anh trên đường đi nhé!'],
    end: ['We made it to the top! What a great bushwalker you are.', 'Mình lên đến đỉnh rồi! Con đi bộ đường rừng giỏi quá.'],
    how: [['Listen to the question about the walk.', 'Nghe câu hỏi về chuyến đi.'], ['Tap the right answer.', 'Chạm vào câu trả lời đúng.']],
    qs: [q('What do we pack for a long walk?', 'Mình mang gì cho chuyến đi bộ xa?', 'au:hike', ['a water bottle', 'chai nước', 'au:bottle'], [['a sand bucket', 'cái xô xúc cát', 'au:bucket'], ['a snorkel', 'ống thở', 'au:mask'], ['a kite', 'con diều', 'au:kite']]),
      q('Where do we walk in the bush?', 'Mình đi ở đâu trong rừng?', 'au:fern', ['on the track', 'trên đường mòn', 'au:track'], [['on the ferns', 'lên cây dương xỉ', 'au:fern'], ['over the logs', 'trèo qua khúc gỗ', 'au:log'], ['into the lake', 'xuống hồ', 'au:wave']]),
      q('Which animal digs burrows and has a pouch?', 'Con nào đào hang và có túi?', 'au:burrow', ['wombat', 'gấu túi mũi trần', 'au:wombat']),
      q('Which animal has spikes and a long nose?', 'Con nào có gai và mũi dài?', 'au:fern', ['echidna', 'thú lông nhím', 'au:echidna']),
      q('Which animal has a bill like a duck and swims in rivers?', 'Con nào có mỏ như vịt và bơi dưới sông?', 'au:wave', ['platypus', 'thú mỏ vịt', 'au:platypus']),
      q('Which animal is black and screeches at night?', 'Con nào màu đen và kêu ré lên ban đêm?', 'au:star', ['Tasmanian devil', 'quỷ Tasmania', 'au:devil']),
      q('What shape is wombat poo?', 'Phân của gấu túi mũi trần có hình gì?', 'au:wombat', ['a cube', 'hình khối vuông', 'au:cube'], [['a ball', 'quả bóng', 'au:ball'], ['a heart', 'trái tim', 'au:heart'], ['a star', 'ngôi sao', 'au:star']]),
      q('Which fruit grows in Tasmania’s orchards?', 'Vườn cây ở đảo Tasmania trồng nhiều quả gì?', 'au:cradle', ['apples', 'quả táo', 'au:apple'], [['coconuts', 'quả dừa', 'au:weed'], ['prawns', 'con tôm', 'au:prawns'], ['shells', 'vỏ sò', 'au:rock']]),
      q('What is it like at the top of a mountain?', 'Trên đỉnh núi thời tiết thế nào?', 'au:cradle', ['cold and windy', 'lạnh và nhiều gió', 'au:wind'], [['hot and sandy', 'nóng và đầy cát', 'au:sand'], ['under the water', 'ở dưới nước', 'au:wave']])] },
  // ---------- Perth and Rottnest Island ----------
  { id: 's2a_quokka', region: 'perth', kind: 'hunt', icon: 'au:camera', name: ['Quokka Photo Hunt', 'Chụp Ảnh Chuột Túi Quokka'], age: 3, hard: 1, bg: 'beach',
    intro: ['We are on Rottnest Island with a camera. Take a photo of every animal we ask for!', 'Mình đang ở đảo Rottnest với một chiếc máy ảnh. Chụp ảnh tất cả con vật được gọi tên nhé!'],
    end: ['Click! What a great photo album of Rottnest Island!', 'Tách! Cuốn album ảnh đảo Rottnest đẹp quá!'],
    how: [['Listen to the animal to photograph.', 'Nghe tên con vật cần chụp ảnh.'], ['Tap every one of them to take its photo.', 'Chạm vào từng bạn để chụp ảnh.'], ['Leave the other animals alone.', 'Để yên các con vật khác nhé.']],
    kinds: [k('Take a photo of every quokka!', 'Chụp ảnh tất cả chuột túi quokka nhé!', 'au:quokka'), k('Take a photo of every pelican!', 'Chụp ảnh tất cả chim bồ nông nhé!', 'au:pelican'),
      k('Take a photo of every seagull!', 'Chụp ảnh tất cả chim hải âu nhé!', 'au:gull'), k('Take a photo of every bobtail lizard!', 'Chụp ảnh tất cả thằn lằn đuôi cụt nhé!', 'au:skink'),
      k('Take a photo of every dolphin!', 'Chụp ảnh tất cả cá heo nhé!', 'au:dolphin'), k('Take a photo of every starfish!', 'Chụp ảnh tất cả sao biển nhé!', 'au:starfish')],
    deco: ['au:rock', 'au:reeds'] },
  { id: 's2a_swan', region: 'perth', kind: 'path', icon: 'au:swan', name: ['Swan River Row', 'Chèo Thuyền Sông Swan'], age: 3, hard: 1, bg: 'river', deco: ['au:reeds', 'au:swan', 'au:rock'],
    intro: ['Row the little boat along the Swan River to the jetty. Mind the reeds and the black swans!', 'Chèo chiếc thuyền nhỏ trên sông Swan đến bến nhé. Cẩn thận lau sậy và những chú thiên nga đen!'],
    end: ['Every boat is tied up at the jetty. Well rowed!', 'Các chiếc thuyền đều đã cập bến. Con chèo giỏi lắm!'],
    how: [['The boat is on the left. The jetty is on the right.', 'Thuyền ở bên trái. Bến ở bên phải.'], ['Tap the water squares that join the boat to the jetty.', 'Chạm vào các ô nước nối thuyền với bến.'], ['Some water stops at the reeds. Leave those ones.', 'Có chỗ nước bị lau sậy chặn. Bỏ qua chỗ đó nhé.']],
    path: { from: 'au:rowboat', to: 'au:jetty', ask: ['Tap the water that takes the boat to the jetty!', 'Chạm vào các ô nước đưa thuyền đến bến nhé!'], cell: 'au:water' } },
  { id: 's2a_beach', region: 'perth', kind: 'quiz', icon: 'au:beach', name: ['Beach Day', 'Một Ngày Ở Biển'], age: 4, hard: 2, bg: 'beach',
    intro: ['Ava loves the beach in Perth. Can you answer her beach questions?', 'Chị Ava rất thích biển ở Perth. Con trả lời được câu hỏi về biển của chị không?'],
    end: ['You are ready for a safe and happy beach day!', 'Con đã sẵn sàng cho một ngày ở biển an toàn và vui vẻ rồi!'],
    how: [['Listen to the question about the beach.', 'Nghe câu hỏi về bãi biển.'], ['Tap the right answer.', 'Chạm vào câu trả lời đúng.']],
    qs: [q('What do we put on our skin in the sun?', 'Mình bôi gì lên da khi trời nắng?', 'au:beach', ['sunscreen', 'kem chống nắng', 'au:sunscreen'], [['sand', 'cát', 'au:sand'], ['water', 'nước', 'au:water'], ['mud', 'bùn', 'au:rock']]),
      q('Where do we swim at the beach?', 'Ở bãi biển mình bơi ở đâu?', 'au:wave', ['between the red and yellow flags', 'giữa hai lá cờ đỏ vàng', 'au:flags'], [['far out past the waves', 'xa ra ngoài sóng', 'au:wave'], ['near the rocks', 'gần mấy tảng đá', 'au:rock'], ['by the boats', 'cạnh thuyền', 'au:ferry']]),
      q('What do we wear on our head in the sun?', 'Mình đội gì khi trời nắng?', 'au:beach', ['a sun hat', 'mũ che nắng', 'au:sunhat'], [['a raincoat', 'áo mưa', 'au:raincoat'], ['a snorkel', 'ống thở', 'au:mask'], ['a bucket', 'cái xô', 'au:bucket']]),
      q('Which little animal on Rottnest Island looks like it is smiling?', 'Con vật nhỏ nào ở đảo Rottnest trông như đang cười?', 'au:lighthouse', ['quokka', 'chuột túi quokka', 'au:quokka']),
      q('Which black bird swims on the Swan River?', 'Con chim màu đen nào bơi trên sông Swan?', 'au:water', ['black swan', 'thiên nga đen', 'au:swan']),
      q('How do we get to Rottnest Island?', 'Mình đến đảo Rottnest bằng gì?', 'au:lighthouse', ['by ferry', 'đi phà', 'au:ferry'], [['by car', 'đi ô tô', 'au:car'], ['by bike', 'đi xe đạp', 'au:bike'], ['by kite', 'bằng diều', 'au:kite']]),
      q('What do people ride around Rottnest Island?', 'Mọi người đạp gì vòng quanh đảo Rottnest?', 'au:lighthouse', ['bikes', 'xe đạp', 'au:bike'], [['cars', 'ô tô', 'au:car'], ['boats', 'thuyền', 'au:rowboat'], ['kites', 'diều', 'au:kite']]),
      q('Which sea animal jumps and plays near the boats?', 'Con vật biển nào nhảy và chơi gần thuyền?', 'au:wave', ['dolphin', 'cá heo', 'au:dolphin']),
      q('Which bird has a big pouch in its beak to catch fish?', 'Con chim nào có túi to ở mỏ để bắt cá?', 'au:wave', ['pelican', 'chim bồ nông', 'au:pelican'])] }
];
