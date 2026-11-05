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
  { id: 's2a_snorkel', region: 'gbr', kind: 'hunt', icon: 's2:snorkel', name: ['Snorkel Spotter', 'Lặn Ngắm Tìm Bạn'], age: 3, hard: 1, bg: 'reef',
    intro: ['Put on your mask and snorkel. Let us look for animals on the reef!', 'Đeo kính lặn và ống thở vào. Mình cùng tìm các con vật trên rạn san hô nhé!'],
    end: ['You found every reef animal. What a good snorkeller!', 'Con tìm được hết các con vật trên rạn san hô. Con lặn ngắm giỏi quá!'],
    how: [['Listen to the animal you need to find.', 'Nghe tên con vật cần tìm.'], ['Tap every one of them on the reef.', 'Chạm vào tất cả các bạn ấy trên rạn san hô.'], ['Leave the other animals alone.', 'Để yên các con vật khác nhé.']],
    kinds: [k('Tap every sea turtle!', 'Chạm vào tất cả rùa biển nhé!', 's2:seaturtle'), k('Tap every clownfish!', 'Chạm vào tất cả cá hề nhé!', 's2:clown'),
      k('Tap every starfish!', 'Chạm vào tất cả sao biển nhé!', 's2:starfish'), k('Tap every stingray!', 'Chạm vào tất cả cá đuối nhé!', 's2:ray'),
      k('Tap every blue tang!', 'Chạm vào tất cả cá đuôi gai xanh nhé!', 's2:bluetang'), k('Tap every octopus!', 'Chạm vào tất cả bạch tuộc nhé!', 's2:octopus')],
    deco: ['s2:coral', 's2:weed', 's2:anemone'] },
  { id: 's2a_turtle', region: 'gbr', kind: 'path', icon: 's2:turtle', name: ['Turtle to the Sea', 'Rùa Con Về Biển'], age: 3, hard: 1, bg: 'beach',
    intro: ['A baby turtle has hatched on the beach. Help it find the way to the sea!', 'Một chú rùa con vừa nở trên bãi cát. Giúp rùa con tìm đường ra biển nhé!'],
    end: ['Splash! Every baby turtle is swimming in the sea.', 'Tõm! Các chú rùa con đều đã bơi ra biển rồi.'],
    how: [['The baby turtle starts on the left. The sea is on the right.', 'Rùa con ở bên trái. Biển ở bên phải.'], ['Tap the sand squares that join the turtle to the sea.', 'Chạm vào các ô cát nối rùa con với biển.'], ['Some sand paths stop at a rock. Leave those ones.', 'Có đường cát bị tảng đá chặn. Bỏ qua đường đó nhé.']],
    path: { from: 's2:babyturtle', to: 's2:wave', ask: ['Tap the sand squares that take the baby turtle to the sea!', 'Chạm vào các ô cát dẫn rùa con ra biển nhé!'], cell: 's2:sand' } },
  { id: 's2a_reefquiz', region: 'gbr', kind: 'quiz', icon: 's2:reefquiz', name: ['Reef Friends', 'Bạn Bè Rạn San Hô'], age: 4, hard: 2, bg: 'reef',
    intro: ['Mia the reef ranger has some questions about the reef!', 'Chị kiểm lâm Mia có mấy câu đố về rạn san hô đây!'],
    end: ['You know so much about the Great Barrier Reef!', 'Con biết nhiều về rạn san hô Great Barrier quá!'],
    how: [['Listen to the question about the reef.', 'Nghe câu hỏi về rạn san hô.'], ['Tap the right answer.', 'Chạm vào câu trả lời đúng.']],
    qs: [q('Who lives in the sea anemone?', 'Ai sống trong hải quỳ?', 's2:anemone', ['clownfish', 'cá hề', 's2:clown']),
      q('Which animal has a hard shell and swims in the sea?', 'Con nào có mai cứng và bơi dưới biển?', 's2:wave', ['sea turtle', 'rùa biển', 's2:seaturtle']),
      q('Which animal has eight arms?', 'Con nào có tám cái tay?', 's2:wave', ['octopus', 'bạch tuộc', 's2:octopus']),
      q('Which animal is shaped like a star?', 'Con nào có hình ngôi sao?', 's2:wave', ['starfish', 'sao biển', 's2:starfish']),
      q('Which fish is blue with a yellow tail?', 'Cá nào màu xanh có đuôi vàng?', 's2:wave', ['blue tang', 'cá đuôi gai xanh', 's2:bluetang']),
      q('Which big animal sings songs in the sea?', 'Con vật to nào hát dưới biển?', 's2:wave', ['humpback whale', 'cá voi lưng gù', 's2:whale']),
      q('What do we wear to look under the water?', 'Mình đeo gì để nhìn dưới nước?', 's2:snorkel', ['a mask and snorkel', 'kính lặn và ống thở', 's2:mask'],
        [['sunglasses', 'kính râm', 's2:sunnies'], ['a sun hat', 'mũ che nắng', 's2:sunhat'], ['a raincoat', 'áo mưa', 's2:raincoat']]),
      q('How do we keep the reef safe?', 'Mình giữ cho rạn san hô an toàn thế nào?', 's2:coral', ['look, but do not touch', 'chỉ ngắm, không chạm', 's2:look'],
        [['take some coral home', 'mang san hô về nhà', 's2:coral'], ['leave rubbish on the beach', 'bỏ rác trên bãi biển', 's2:rubbish'], ['stand on the coral', 'đứng lên san hô', 's2:feet']]),
      q('What colour does coral turn when the sea is too hot?', 'Khi biển quá nóng, san hô chuyển sang màu gì?', 's2:coral', ['white', 'màu trắng', 's2:whitecoral'],
        [['purple', 'màu tím', 's2:coral'], ['green', 'màu xanh lá', 's2:weed'], ['black', 'màu đen', 's2:rock']])] },
  // ---------- Tasmania ----------
  { id: 's2a_wombat', region: 'tas', kind: 'path', icon: 's2:wombat', name: ['Wombat Burrow', 'Hang Gấu Túi Mũi Trần'], age: 3, hard: 1, bg: 'bush', deco: ['s2:fern', 's2:log', 's2:rock'],
    intro: ['A sleepy wombat wants to go home to its burrow. Show it the way through the tunnels!', 'Bạn gấu túi mũi trần buồn ngủ muốn về hang. Chỉ đường cho bạn ấy qua các đường hầm nhé!'],
    end: ['Every wombat is home, snug in its burrow. Good night, wombats!', 'Các bạn gấu túi mũi trần đều đã về hang ấm áp. Chúc ngủ ngon nhé!'],
    how: [['The wombat is on the left. Its burrow is on the right.', 'Bạn gấu túi ở bên trái. Hang của bạn ấy ở bên phải.'], ['Tap the tunnel squares that join the wombat to its burrow.', 'Chạm vào các ô đường hầm nối bạn gấu túi với hang.'], ['Some tunnels stop. Leave those ones.', 'Có đường hầm bị cụt. Bỏ qua đường đó nhé.']],
    path: { from: 's2:wombat', to: 's2:burrow', ask: ['Tap the tunnels that take the wombat home to its burrow!', 'Chạm vào các đường hầm đưa bạn gấu túi về hang nhé!'], cell: 's2:tunnel' } },
  { id: 's2a_devil', region: 'tas', kind: 'hunt', icon: 's2:devil', name: ['Spot the Devil', 'Tìm Quỷ Tasmania'], age: 3, hard: 1, bg: 'night',
    intro: ['It is night in the Tasmanian bush. Shine your torch and find the animals!', 'Trời tối trong rừng Tasmania rồi. Soi đèn pin và tìm các con vật nhé!'],
    end: ['You spotted every animal in the night bush!', 'Con tìm được hết các con vật trong rừng đêm rồi!'],
    how: [['Listen to the animal you need to find.', 'Nghe tên con vật cần tìm.'], ['Tap every one of them in the bush.', 'Chạm vào tất cả các bạn ấy trong rừng.'], ['Leave the other animals alone.', 'Để yên các con vật khác nhé.']],
    kinds: [k('Tap every Tasmanian devil!', 'Chạm vào tất cả quỷ Tasmania nhé!', 's2:devil'), k('Tap every wombat!', 'Chạm vào tất cả gấu túi mũi trần nhé!', 's2:wombat'),
      k('Tap every echidna!', 'Chạm vào tất cả thú lông nhím nhé!', 's2:echidna'), k('Tap every platypus!', 'Chạm vào tất cả thú mỏ vịt nhé!', 's2:platypus'),
      k('Tap every possum!', 'Chạm vào tất cả thú có túi possum nhé!', 's2:possum'), k('Tap every pademelon!', 'Chạm vào tất cả chuột túi nhỏ pademelon nhé!', 's2:pademelon')],
    deco: ['s2:fern', 's2:log', 's2:star'] },
  { id: 's2a_cradle', region: 'tas', kind: 'quiz', icon: 's2:hike', name: ['Cradle Mountain Walk', 'Đi Bộ Núi Cradle'], age: 4, hard: 2, bg: 'bush',
    intro: ['Ollie the bushwalker is taking us up Cradle Mountain. Answer his questions on the way!', 'Anh Ollie hay đi bộ đường rừng dẫn mình lên núi Cradle. Trả lời câu hỏi của anh trên đường đi nhé!'],
    end: ['We made it to the top! What a great bushwalker you are.', 'Mình lên đến đỉnh rồi! Con đi bộ đường rừng giỏi quá.'],
    how: [['Listen to the question about the walk.', 'Nghe câu hỏi về chuyến đi.'], ['Tap the right answer.', 'Chạm vào câu trả lời đúng.']],
    qs: [q('What do we pack for a long walk?', 'Mình mang gì cho chuyến đi bộ xa?', 's2:hike', ['a water bottle', 'chai nước', 's2:bottle'], [['a sand bucket', 'cái xô xúc cát', 's2:bucket'], ['a snorkel', 'ống thở', 's2:mask'], ['a kite', 'con diều', 's2:kite']]),
      q('Where do we walk in the bush?', 'Mình đi ở đâu trong rừng?', 's2:fern', ['on the track', 'trên đường mòn', 's2:track'], [['on the ferns', 'lên cây dương xỉ', 's2:fern'], ['over the logs', 'trèo qua khúc gỗ', 's2:log'], ['into the lake', 'xuống hồ', 's2:wave']]),
      q('Which animal digs burrows and has a pouch?', 'Con nào đào hang và có túi?', 's2:burrow', ['wombat', 'gấu túi mũi trần', 's2:wombat']),
      q('Which animal has spikes and a long nose?', 'Con nào có gai và mũi dài?', 's2:fern', ['echidna', 'thú lông nhím', 's2:echidna']),
      q('Which animal has a bill like a duck and swims in rivers?', 'Con nào có mỏ như vịt và bơi dưới sông?', 's2:wave', ['platypus', 'thú mỏ vịt', 's2:platypus']),
      q('Which animal is black and screeches at night?', 'Con nào màu đen và kêu ré lên ban đêm?', 's2:star', ['Tasmanian devil', 'quỷ Tasmania', 's2:devil']),
      q('What shape is wombat poo?', 'Phân của gấu túi mũi trần có hình gì?', 's2:wombat', ['a cube', 'hình khối vuông', 's2:cube'], [['a ball', 'quả bóng', 's2:ball'], ['a heart', 'trái tim', 's2:heart'], ['a star', 'ngôi sao', 's2:star']]),
      q('Which fruit grows in Tasmania’s orchards?', 'Vườn cây ở đảo Tasmania trồng nhiều quả gì?', 's2:cradle', ['apples', 'quả táo', 's2:apple'], [['coconuts', 'quả dừa', 's2:weed'], ['prawns', 'con tôm', 's2:prawns'], ['shells', 'vỏ sò', 's2:rock']]),
      q('What is it like at the top of a mountain?', 'Trên đỉnh núi thời tiết thế nào?', 's2:cradle', ['cold and windy', 'lạnh và nhiều gió', 's2:wind'], [['hot and sandy', 'nóng và đầy cát', 's2:sand'], ['under the water', 'ở dưới nước', 's2:wave']])] }
];
