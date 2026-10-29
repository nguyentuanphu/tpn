import { HOWTO, type HowToGuide } from './howto-registry.js';
const S = (pic, en, vi) => ({ pic, en, vi });
const DEFAULTS: Record<string, HowToGuide> = {
  puppets: {
    origin: S('🇻🇳 🎎 💧', 'Water puppets (múa rối nước) come from the rice-field villages of northern Vietnam, nearly a thousand years ago. Today you can watch them in Hà Nội.', 'Múa rối nước có từ các làng quê đồng lúa miền Bắc Việt Nam, gần một nghìn năm trước. Ngày nay con có thể xem ở Hà Nội.'),
    steps: [S('👂 🐉', 'Listen: Chú Tễu calls a puppet.', 'Nghe nhé: chú Tễu gọi một con rối.'), S('👆 🦆', 'Tap the puppet he calls.', 'Chạm vào con rối chú gọi.'), S('💦 🎉', 'Splash! It jumps and dances!', 'Tõm! Con rối nhảy múa!')],
    real: S('🧦 🛁', 'For real: make sock puppets and put on a show behind a towel!', 'Chơi thật: làm rối bằng tất và diễn sau một chiếc khăn!')
  },
  dongho: {
    origin: S('🇻🇳 🖼️ 🐷', 'Đông Hồ paintings come from a village in Bắc Ninh. Painters print them with carved wooden blocks and colours from flowers, leaves and sea shells.', 'Tranh Đông Hồ có từ một ngôi làng ở Bắc Ninh. Nghệ nhân in tranh bằng khuôn gỗ khắc và màu từ hoa, lá và vỏ sò.'),
    steps: [S('👀 🖼️', 'Look at the sample painting.', 'Nhìn tranh mẫu.'), S('✨ 🎨', 'One part of your painting glows. Pick its colour.', 'Một phần tranh của con đang sáng. Chọn màu cho nó.'), S('🐓 🎉', 'Finish the picture like a real painter!', 'Tô xong bức tranh như nghệ nhân thật!')],
    real: S('🥔 🎨', 'For real: carve a shape into half a potato and print it with paint!', 'Chơi thật: khắc hình lên nửa củ khoai tây rồi chấm màu in tranh!')
  },
  dragonfire: {
    origin: S('🇻🇳 🐉 🌉', 'The Dragon Bridge in Đà Nẵng is shaped like a golden dragon. On weekend nights it breathes fire and water!', 'Cầu Rồng ở Đà Nẵng có hình con rồng vàng. Tối cuối tuần rồng phun lửa và phun nước!'),
    steps: [S('👀 🔥', 'Watch the dragon puff.', 'Nhìn rồng phun.'), S('1️⃣ 2️⃣ 3️⃣', 'Count every puff.', 'Đếm từng lần phun.'), S('👆 🔢', 'Tap the right number.', 'Chạm vào số đúng.')]
  },
  traffic: {
    origin: S('🇻🇳 🛵 🚦', 'Hồ Chí Minh City has millions of scooters! Everyone must watch the traffic lights.', 'TP. Hồ Chí Minh có hàng triệu xe máy! Ai cũng phải nhìn đèn giao thông.'),
    steps: [S('🟢 👆', 'Green light: tap GO.', 'Đèn xanh: chạm ĐI.'), S('🔴 ✋', 'Red light: tap STOP.', 'Đèn đỏ: chạm DỪNG.'), S('🪖 😊', 'Always wear a helmet and hold a grown-up\u2019s hand!', 'Luôn đội mũ bảo hiểm và nắm tay người lớn nhé!')]
  },
  ferries: {
    origin: S('🇦🇺 ⛴️ 🌉', 'Green and yellow ferries carry people all around Sydney Harbour, past the Opera House and under the Harbour Bridge.', 'Những chiếc phà xanh vàng chở mọi người quanh Cảng Sydney, qua Nhà hát Opera và dưới Cầu Cảng.'),
    steps: [S('⛴️ 🎭', 'Look at the picture on the ferry.', 'Nhìn hình trên phà.'), S('👆 🎭', 'Tap the wharf with the same picture.', 'Chạm vào bến có hình giống.'), S('📯 🎉', 'Toot toot! All aboard!', 'Tu tu! Lên phà nào!')]
  },
  tram: {
    origin: S('🇦🇺 🚋', 'Melbourne has the biggest tram network in the world. Riders ring the bell to stop.', 'Melbourne có mạng lưới tàu điện lớn nhất thế giới. Hành khách bấm chuông để xin dừng.'),
    steps: [S('👂 5️⃣', 'Listen for the stop number.', 'Nghe số trạm.'), S('🚋 ➡️', 'Watch the tram move stop by stop.', 'Nhìn tàu chạy từng trạm.'), S('🔔 ✅', 'Ring the bell when it reaches your stop!', 'Bấm chuông khi tàu đến đúng trạm!')]
  },
  koala: {
    origin: S('🇦🇺 🐨 🌿', 'Koalas live in gum trees and eat gum leaves. Lone Pine in Brisbane is the oldest koala sanctuary in the world.', 'Koala sống trên cây bạch đàn và ăn lá bạch đàn. Lone Pine ở Brisbane là khu bảo tồn koala lâu đời nhất thế giới.'),
    steps: [S('🐨 3️⃣', 'The koala shows how many leaves it wants.', 'Koala cho biết muốn bao nhiêu lá.'), S('🌿 👆', 'Tap Give a leaf, counting each one.', 'Chạm Cho lá, đếm từng chiếc.'), S('✅ 😋', 'Tap Done when it is the right number.', 'Đủ số thì chạm Xong.')]
  },
  music: {
    origin: S('🇻🇳 🇦🇺 🇨🇳 🇮🇳 🎶', 'Four instruments from four countries: the đàn bầu from Vietnam, the didgeridoo from Australia, the guzheng from China and the tabla from India.', 'Bốn nhạc cụ của bốn nước: đàn bầu Việt Nam, kèn didgeridoo nước Úc, đàn tranh guzheng Trung Quốc và trống tabla Ấn Độ.'),
    steps: [S('🎸 🥁', 'Choose an instrument at the top.', 'Chọn một nhạc cụ ở trên cùng.'), S('🟥 🟨 🟩', 'Tap the coloured pads to play notes.', 'Chạm vào các phím màu để chơi nhạc.'), S('⏺️ ▶️', 'Tap Record, play a tune, tap Stop, then Play to hear it back!', 'Bấm Thu âm, chơi một giai điệu, bấm Dừng, rồi bấm Nghe để nghe lại!')]
  },
  firstwords: {
    origin: S('🇨🇳 🇮🇳 🌏', 'Friends in China Town and India Village teach their first words: hello, thank you, family, food, animals and numbers.', 'Các bạn ở Làng Trung Hoa và Làng Ấn Độ dạy những từ đầu tiên: xin chào, cảm ơn, gia đình, món ăn, con vật và con số.'),
    steps: [S('👂 🔊', 'Listen to the word. Tap 🔊 to hear it again.', 'Nghe từ đó. Chạm 🔊 để nghe lại.'), S('👆 🖼️', 'Tap the picture it means.', 'Chạm vào hình đúng nghĩa.'), S('🗣️ 😊', 'Say it out loud with the game!', 'Nói to theo trò chơi nhé!')]
  },
  tangram: {
    origin: S('🇨🇳 🧩', 'The tangram (七巧板, qīqiǎobǎn) is a shape puzzle from China, more than 200 years old.', 'Tangram (七巧板, qīqiǎobǎn) là trò xếp hình của Trung Quốc, có từ hơn 200 năm trước.'),
    steps: [S('👀 ⬜', 'Look at the picture: one shape is missing.', 'Nhìn bức hình: thiếu một mảnh.'), S('🔺 🔷 🟨', 'Look at the corners and sides of each shape.', 'Nhìn các góc và các cạnh của từng mảnh.'), S('👆 ✅', 'Tap the shape that fits the gap.', 'Chạm vào mảnh vừa với chỗ trống.')],
    real: S('✂️ 📄', 'For real: cut a square of card into 7 pieces and make animals, boats and houses!', 'Chơi thật: cắt một tấm bìa vuông thành 7 mảnh rồi xếp thành con vật, thuyền và nhà!')
  },
  snakes: {
    origin: S('🇮🇳 🐍 🪜', 'Snakes and ladders started in India long ago, where it was called Moksha Patam.', 'Rắn và thang bắt đầu ở Ấn Độ từ rất lâu, khi đó gọi là Moksha Patam.'),
    steps: [S('🎲 👆', 'Tap Roll to throw the dice.', 'Chạm Gieo để gieo xúc xắc.'), S('1️⃣ 2️⃣ 3️⃣', 'Count the squares as you move.', 'Đếm từng ô khi di chuyển.'), S('🪜 ⬆️ 🐍 ⬇️', 'Ladders take you up, snakes slide you down. Reach 25 to win!', 'Thang đưa con lên, rắn làm con trượt xuống. Đến ô 25 là thắng!')],
    real: S('📋 🎲', 'For real: draw a 5×5 board, add ladders and snakes, and play with a dice and buttons.', 'Chơi thật: vẽ bảng 5×5, thêm thang và rắn, rồi chơi với xúc xắc và cúc áo.')
  },
  rangoli: {
    origin: S('🇮🇳 🌸 🪔', 'In India, families draw rangoli at the door with coloured powder, rice and flowers, especially for Diwali, the festival of lights.', 'Ở Ấn Độ, các gia đình vẽ rangoli trước cửa bằng bột màu, gạo và hoa, nhất là vào lễ Diwali, lễ hội ánh sáng.'),
    steps: [S('🎨 👆', 'Tap a colour.', 'Chọn một màu.'), S('🪞 ⬜', 'Colour the right side to match the left side, like a mirror.', 'Tô bên phải giống hệt bên trái, như soi gương.'), S('✨ 🌸', 'When both sides match, the rangoli glows!', 'Khi hai bên giống nhau, tranh rangoli sẽ sáng lên!')],
    real: S('🍚 🌼', 'For real: draw a pattern with chalk and fill it with coloured rice or flower petals.', 'Chơi thật: vẽ hoa văn bằng phấn rồi rải gạo màu hoặc cánh hoa lên.')
  },
  // ---- folk games ----
  mrwolf: {
    origin: S('🇦🇺 🐺', 'This is a schoolyard game from Australia. Children have played it for more than a hundred years!', 'Đây là trò chơi sân trường của nước Úc. Các bạn nhỏ đã chơi trò này hơn một trăm năm rồi!'),
    steps: [S('🗣️ 🐺', 'Ask: What is the time, Mr Wolf?', 'Hỏi: Mấy giờ rồi, ông Sói ơi?'),
      S('🕒 👣👣👣', 'If Mr Wolf says three o clock, take three steps. Count them out loud!', 'Nếu ông Sói nói ba giờ, con bước ba bước. Đếm to lên nhé!'),
      S('🍽️ 🐺 🏃 🏠', 'When he shouts Dinner time, run home as fast as you can!', 'Khi ông Sói hét Đến giờ ăn tối, chạy về nhà thật nhanh!')],
    real: S('🧒🧒🧒 🐺', 'To play with friends: one friend is Mr Wolf and stands with their back turned. Everyone else starts at the wall and creeps closer.', 'Chơi với bạn bè: một bạn làm ông Sói, đứng quay lưng lại. Các bạn khác đứng ở bức tường rồi tiến lại gần.')
  },
  chuyen: {
    origin: S('🇻🇳 🇦🇺 🥢', 'In Vietnam girls play Đánh chuyền with a little ball and ten chopsticks. In Australia children play Knucklebones with five little bones or jacks.', 'Ở Việt Nam các bạn gái chơi đánh chuyền với một quả bóng nhỏ và mười que. Ở Úc các bạn chơi Knucklebones với năm khúc xương nhỏ.'),
    steps: [S('👆 🟠 ⬆️', 'Tap the ball to throw it up high.', 'Chạm quả bóng để tung lên cao.'),
      S('🥢 ✋', 'Quick! Pick up the sticks while the ball is in the air.', 'Nhanh lên! Nhặt que khi bóng còn trên không.'),
      S('🟠 🤲', 'Then tap the ball to catch it before it lands. Pick one, then two, then three!', 'Rồi chạm quả bóng để bắt trước khi bóng rơi. Nhặt một que, rồi hai, rồi ba!')],
    real: S('🎵 🥢 🟠', 'In Vietnam you sing while you play: Chuyền chuyền một, một đôi. Chuyền chuyền hai, hai đôi!', 'Ở Việt Nam vừa chơi vừa hát: Chuyền chuyền một, một đôi. Chuyền chuyền hai, hai đôi!')
  },
  dragon: {
    origin: S('🇻🇳 🐉', 'Rồng rắn lên mây is a game from Vietnam. The children hold on to each other to make a long dragon.', 'Rồng rắn lên mây là trò chơi dân gian Việt Nam. Các bạn nắm vạt áo nhau thành một con rồng thật dài.'),
    steps: [S('🐲🧒👧👦 🎵', 'The dragon sings: Dragon snake up to the clouds. Is the doctor at home?', 'Rồng rắn hát: Rồng rắn lên mây, có cây lúc lắc, hỏi thăm thầy thuốc có nhà hay không?'),
      S('🧑‍⚕️ 💬', 'The doctor asks for the head, the middle and the tail. Choose what the dragon answers.', 'Thầy thuốc xin khúc đầu, khúc giữa, khúc đuôi. Con chọn câu rồng rắn trả lời nhé.'),
      S('🧑‍⚕️ 👆 🐉', 'Then the doctor chases the tail! Tap the doctor to keep the tail safe.', 'Rồi thầy thuốc đuổi bắt khúc đuôi! Chạm vào thầy thuốc để bảo vệ khúc đuôi.')],
    real: S('🧒👧👦👧 🧑‍⚕️', 'With friends: the head spreads their arms to block the doctor, and everyone holds on tight!', 'Chơi với bạn bè: bạn đầu rồng dang tay chặn thầy thuốc, và mọi người bám thật chặt!')
  },
  marbles: {
    origin: S('🇻🇳 🇦🇺 🔮', 'Children in Vietnam and in Australia both love marbles. In Vietnam it is called Bắn bi.', 'Trẻ em ở Việt Nam và ở Úc đều thích chơi bi. Ở Úc gọi là Marbles.'),
    steps: [S('⚪ 👇', 'Put your finger on the big white marble and pull back.', 'Đặt ngón tay lên viên bi cái màu trắng rồi kéo về phía sau.'),
      S('⚪ 💨 🔴', 'Let go to shoot! The dotted line shows where it goes.', 'Thả tay ra để bắn! Đường chấm chỉ hướng bi sẽ đi.'),
      S('⭕ 🔴 ➡️', 'Knock the marbles out of the chalk circle to win them.', 'Bắn cho bi văng ra khỏi vòng phấn là được bi đó.')],
    real: S('✏️ ⭕ 🔮', 'For real: draw a circle in the dirt, put the marbles in the middle and flick your shooter with your thumb.', 'Chơi thật: vẽ một vòng tròn trên đất, đặt bi vào giữa, rồi dùng ngón cái búng viên bi cái.')
  },
  skipping: {
    origin: S('🇻🇳 🇦🇺 🪢', 'Skipping is loved everywhere. In Vietnam it is called Nhảy dây, and in Australia children also jump Elastics.', 'Nhảy dây được trẻ em khắp nơi yêu thích. Ở Úc các bạn còn chơi nhảy dây chun gọi là Elastics.'),
    steps: [S('👧 〰️ 👦', 'Two friends turn the rope round and round.', 'Hai bạn quay dây vòng vòng.'),
      S('👇 〰️ ⤴️', 'When the rope comes down to your feet, tap Jump!', 'Khi dây quay xuống chân, chạm nút Nhảy!'),
      S('1️⃣ 2️⃣ 3️⃣', 'Count every jump with me!', 'Cùng đếm mỗi lần nhảy nhé!')],
    real: S('👧🪢👦 🧒', 'For real: two friends hold the ends of a long rope, and everyone takes turns jumping in.', 'Chơi thật: hai bạn cầm hai đầu sợi dây dài, các bạn khác lần lượt nhảy vào.')
  },
  datnieu: {
    origin: S('🇻🇳 🏺', 'Đập niêu is played at Vietnamese village festivals. Clay pots hang up high, and one is full of treats!', 'Đập niêu là trò chơi trong các lễ hội làng ở Việt Nam. Những chiếc niêu đất treo trên cao, một chiếc có đầy quà!'),
    steps: [S('🙈 🪵', 'You wear a blindfold and hold a stick.', 'Con bị bịt mắt và cầm một cây gậy.'), S('⬅️ 👂 ➡️', 'Listen to your friends shout left or right, and move.', 'Nghe các bạn hô sang trái hay sang phải, rồi di chuyển.'), S('🔨 🏺 💥', 'When they shout HERE, smash the pot!', 'Khi các bạn hô ĐÂY RỒI, đập niêu thôi!')],
    real: S('🧒🙈🧒', 'For real: hang a paper bag with lollies, spin the player around three times, and everyone helps by shouting!', 'Chơi thật: treo túi giấy đựng kẹo, xoay người chơi ba vòng, và mọi người cùng hô giúp!')
  },
  kite: {
    origin: S('🇻🇳 🪁', 'On windy summer afternoons, children in Vietnam fly kites over the rice fields and on the beach at Vũng Tàu.', 'Những chiều hè lộng gió, trẻ em Việt Nam thả diều trên cánh đồng lúa và bãi biển Vũng Tàu.'),
    steps: [S('👆 🪁 ⬆️', 'Hold your finger down to pull the string. The kite flies up!', 'Giữ ngón tay để kéo dây. Diều bay lên!'), S('👉 🪁', 'Move your finger to steer the kite.', 'Di ngón tay để lái diều.'), S('⭐ 🐦', 'Catch the stars and dodge the birds.', 'Bắt sao và tránh chim nhé.')]
  },
  sackrace: {
    origin: S('🇻🇳 🇦🇺 🛍️', 'Sack races are a favourite at Vietnamese Tết festivals and at Aussie school sports days.', 'Nhảy bao bố là trò được yêu thích trong ngày Tết ở Việt Nam và ngày hội thể thao ở trường học Úc.'),
    steps: [S('🛍️ 🧒', 'Stand in a sack and hold it up.', 'Đứng vào bao và giữ chặt miệng bao.'), S('👆 ⤴️', 'Tap Hop each time you land. Not while you are in the air!', 'Chạm Nhảy mỗi lần chạm đất. Đừng chạm lúc còn trên không!'), S('🏁 🏆', 'Hop all the way to the finish line!', 'Nhảy đến tận vạch đích!')]
  },
  cricket: {
    origin: S('🇦🇺 🏏', 'Backyard cricket is played by families all over Australia, especially on summer holidays and at Christmas.', 'Cricket sân sau được các gia đình khắp nước Úc chơi, nhất là vào kỳ nghỉ hè và Giáng sinh.'),
    steps: [S('🧑 ⚾ ➡️', 'The bowler sends the ball down the pitch.', 'Người ném bóng ném bóng về phía con.'), S('👆 🏏', 'Tap Swing just as the ball reaches your bat.', 'Chạm Vung gậy đúng lúc bóng tới gậy.'), S('4️⃣ 6️⃣', 'A great hit is a four or a six!', 'Cú đánh hay được bốn hoặc sáu điểm!')],
    real: S('🗑️ 🏏 🎾', 'For real: use a wheelie bin as the wickets and a tennis ball. Everyone gets a turn to bat!', 'Chơi thật: dùng thùng rác làm cọc và bóng tennis. Ai cũng được lượt đánh!')
  },
  parcel: {
    origin: S('🇦🇺 🎁', 'Pass the parcel is played at almost every Aussie kids’ birthday party!', 'Chuyền quà là trò chơi ở gần như mọi bữa tiệc sinh nhật của trẻ em Úc!'),
    steps: [S('🎵 🎁 ➡️', 'Pass the parcel around while the music plays.', 'Chuyền món quà quanh vòng khi nhạc vang lên.'), S('🔇 🎁', 'When the music stops, whoever holds it rips off a layer.', 'Khi nhạc dừng, ai đang cầm quà thì bóc một lớp giấy.'), S('🏆', 'The last layer has the big prize!', 'Lớp cuối cùng có giải thưởng lớn!')]
  },
  chichi: {
    origin: S('🇻🇳 ✋', 'Chi chi chành chành is a hand game Vietnamese grandparents teach little children, with a funny old rhyme.', 'Chi chi chành chành là trò chơi bằng tay mà ông bà Việt Nam dạy các cháu nhỏ, kèm một bài đồng dao vui nhộn.'),
    steps: [S('🫴 👆', 'Put your finger in the open hand.', 'Đặt ngón tay vào lòng bàn tay đang mở.'), S('🎵', 'Sing along: Chi chi chành chành, cái đanh thổi lửa...', 'Hát theo: Chi chi chành chành, cái đanh thổi lửa...'), S('✊ 💨', 'At "Ù à ù ập!", pull your finger out before the hand closes!', 'Đến câu "Ù à ù ập!", rút tay ra trước khi bàn tay nắm lại!')]
  },
  words: {
    origin: S('🇦🇺 🇻🇳 🗣️', 'Aussies say "arvo" for afternoon. In Vietnam, a bowl is "bát" in the north, "đọi" in the centre and "chén" in the south!', 'Người Úc nói "arvo" thay cho buổi chiều. Ở Việt Nam, cái bát miền Bắc gọi là "bát", miền Trung là "đọi", miền Nam là "chén"!'),
    steps: [S('🇦🇺 💬', 'Guess what the Aussie slang means.', 'Đoán xem tiếng lóng Úc nghĩa là gì.'), S('🇻🇳 🥣', 'Pick the word each region of Vietnam uses.', 'Chọn từ mà mỗi miền Việt Nam dùng.')]
  },
  snap: {
    origin: S('🇦🇺 🃏', 'Snap is a card game every Aussie kid knows. In Vietnam, uncles and aunties love card games on the footpath too!', 'Snap là trò chơi bài mà trẻ em Úc nào cũng biết. Ở Việt Nam, các chú các bác cũng rất thích ngồi đánh bài ngoài vỉa hè!'),
    steps: [S('🃏 👀', 'Cards are turned over one by one. Watch carefully.', 'Các lá bài được lật lần lượt. Nhìn thật kỹ nhé.'),
      S('🐨 🐨', 'When two cards in a row are the same...', 'Khi hai lá liền nhau giống nhau...'),
      S('👆 SNAP!', 'Tap SNAP as fast as you can, before the uncles!', 'Bấm SNAP thật nhanh, nhanh hơn các chú!')],
    real: S('🧒🃏🧒', 'For real: share out the cards, take turns putting one down, and shout Snap when two match!', 'Chơi thật: chia bài, lần lượt đặt từng lá xuống, khi hai lá giống nhau thì hô Snap!')
  },
  nemlon: {
    origin: S('🇻🇳 🩴🥫', 'In southern Vietnam children stack empty cans in the lane and take turns knocking them down with a sandal (ném lon). Then everyone runs to stack them again!', 'Ở miền Nam, trẻ con chồng lon rỗng giữa hẻm rồi thay phiên lấy dép ném cho đổ. Rồi cả bọn chạy đi chồng lại!'),
    steps: [S('⬆️↔️', 'The arrow swings left and right.', 'Mũi tên chạy qua chạy lại.'), S('👆🩴', 'Tap THROW when it points at the cans.', 'Bấm NÉM khi mũi tên chỉ đúng chồng lon.'), S('🥫💥', 'Knock them all down!', 'Ném đổ hết lon nhé!')],
    real: S('🧒🩴🥫', 'For real: stack cans on a flat spot, stand behind a line and throw your sandal. Be careful nobody is near the cans!', 'Chơi thật: chồng lon chỗ bằng phẳng, đứng sau vạch rồi ném dép. Nhớ đừng để ai đứng gần chồng lon!')
  },
  oantuti: {
    origin: S('🇻🇳 ✊✋✌️', 'Oẳn tù tì is how Vietnamese children decide who goes first. Children everywhere play it: in Australia it is called rock, paper, scissors.', 'Oẳn tù tì là cách trẻ em Việt Nam chọn ai đi trước. Trẻ em khắp nơi đều chơi: ở Úc gọi là rock, paper, scissors.'),
    steps: [S('🎵', 'Say: oẳn tù tì, ra cái gì, ra cái này!', 'Cùng hô: oẳn tù tì, ra cái gì, ra cái này!'), S('✊ > ✌️', 'Rock breaks scissors.', 'Búa đập kéo.'), S('✌️ > ✋', 'Scissors cut paper.', 'Kéo cắt bao.'), S('✋ > ✊', 'Paper wraps rock.', 'Bao trùm búa.')],
    real: S('🧒✊✋👧', 'For real: face a friend, shake your fist three times while you sing, then show your hand!', 'Chơi thật: đứng đối diện bạn, vừa hô vừa lắc tay ba lần, rồi ra tay!')
  },
  sudoku: { steps: [S('🍎🐟⭐', 'Each picture goes once in every row…', 'Mỗi hình chỉ có một lần trong mỗi hàng…'), S('⬇️', '…and once in every column.', '…và một lần trong mỗi cột.'), S('👆', 'Tap an empty square, then the picture that fits.', 'Chạm ô trống rồi chọn hình hợp.')] },
  eggs: { steps: [S('🐔🥚', 'The hens hid their eggs in the hay.', 'Gà mái giấu trứng trong rơm.'), S('👆🥚', 'Tap the eggs to put them in the basket, and count!', 'Chạm vào trứng để bỏ vào giỏ, và đếm nhé!')] },
  moreless: { steps: [S('🍎🍎🍎 ⚖️ 🍎', 'Look at both sides.', 'Nhìn cả hai bên.'), S('👆', 'Tap the side with more, or with less!', 'Chạm bên nhiều hơn, hay bên ít hơn!')] },
  days: { steps: [S('📅', 'Seven days make one week.', 'Bảy ngày là một tuần.'), S('➡️', 'Find the day that comes next.', 'Tìm ngày đến tiếp theo.')] },
  bodyparts: { steps: [S('👁️👃👂', 'Listen to the name of a part of your body.', 'Nghe tên một bộ phận cơ thể.'), S('👆', 'Tap the right picture!', 'Chạm đúng hình nhé!')] },
  tienlen: {
    origin: S('🇻🇳 🎴', 'Tiến Lên means "go forward". It is the favourite card game in the south of Vietnam: at Tết, families play it together all night!', 'Tiến Lên là trò đánh bài được yêu thích nhất miền Nam. Tết đến, cả nhà quây quần đánh Tiến Lên tới khuya!'),
    steps: [S('3️⃣ ➡️ 2️⃣', '3 is the smallest card and 2 is the biggest. Hearts ♥ beat diamonds ♦, then clubs ♣, then spades ♠.', '3 nhỏ nhất, 2 lớn nhất. Cơ ♥ lớn hơn rô ♦, rồi chuồn ♣, rồi bích ♠.'),
      S('🎴 🎴', 'Play one card, a pair, three of a kind, or a run like 5 6 7.', 'Đánh một lá, một đôi, sám cô, hay một sảnh như 5 6 7.'),
      S('⬆️ ✋', 'Beat the table with the same kind, but higher, or Pass.', 'Chặn bài trên bàn bằng bài cùng kiểu mà lớn hơn, hoặc Bỏ lượt.'),
      S('🏆', 'Play all your cards first to win! Stuck? Tap 💡 Hint.', 'Ai đánh hết bài trước là thắng! Bí quá thì bấm 💡 Gợi ý.')],
    real: S('🧒🎴🧑', 'For real: deal 13 cards each to 4 players. Whoever has the 3 of spades starts!', 'Chơi thật: chia mỗi người 13 lá, 4 người chơi. Ai có 3 bích thì đánh trước!')
  },
  // (Round V, owner 13 Oct) Tiến Lên miền Bắc: the northern rules
  tienlenbac: {
    origin: S('🇻🇳 🎴', 'Tiến Lên miền Bắc is how families in the north of Vietnam play it: you must follow the same suit!', 'Tiến Lên miền Bắc là cách các gia đình miền Bắc chơi: phải đánh cùng chất!'),
    steps: [S('3️⃣ ➡️ 2️⃣', '3 is the smallest card and 2 is the biggest.', '3 nhỏ nhất, 2 lớn nhất.'),
      S('♥ ♥', 'Beat one card with a higher card of the same suit: a heart with a heart.', 'Chặn một lá bằng lá lớn hơn cùng chất: cơ chặn cơ.'),
      S('🎴 🎴', 'A pair is beaten by a higher pair of the same colours. A run must be all one suit.', 'Đôi phải chặn bằng đôi lớn hơn cùng màu. Sảnh phải đồng chất.'),
      S('🏆', 'Play all your cards first to win! Stuck? Tap 💡 Hint.', 'Ai đánh hết bài trước là thắng! Bí quá thì bấm 💡 Gợi ý.')],
    real: S('🧒🎴🧑', 'For real: deal 13 cards each to 4 players and follow the suit!', 'Chơi thật: chia mỗi người 13 lá, 4 người chơi, và nhớ đánh cùng chất!')
  },
  dacau: {
    origin: S('🇻🇳 🏸', 'Đá cầu is played in parks and schoolyards all over Vietnam. The shuttlecock has colourful feathers.', 'Đá cầu được chơi ở công viên và sân trường khắp Việt Nam. Quả cầu có lông vũ nhiều màu.'),
    steps: [S('👆 🏸 ⬆️', 'Tap the shuttlecock to kick it up.', 'Chạm quả cầu để đá lên.'), S('🏸 🚫 ⬇️', 'Do not let it touch the ground!', 'Đừng để cầu chạm đất!'), S('1️⃣ 2️⃣ 3️⃣', 'Count your kicks!', 'Đếm số lần đá nhé!')],
    real: S('🧒🏸👧', 'For real: stand in a circle and kick it to each other with the side of your foot.', 'Chơi thật: đứng thành vòng tròn và chuyền cầu cho nhau bằng má trong bàn chân.')
  },
  oanquan: {
    origin: S('🇻🇳 🪨', 'Ô ăn quan is one of the oldest games in Vietnam. Children draw the board on the ground and play with little stones.', 'Ô ăn quan là một trong những trò chơi lâu đời nhất của Việt Nam. Các bạn vẽ bàn trên đất và chơi bằng sỏi.'),
    steps: [S('👆 ⬜', 'Pick one of your highlighted squares.', 'Chọn một ô đang sáng của con.'),
      S('⬅️ ➡️', 'Choose a direction, then drop one seed in each square.', 'Chọn hướng, rồi rải mỗi ô một hạt.'),
      S('⬜ ⬜ 🪨', 'If you land next to an empty square, you capture the seeds after it!', 'Gặp ô trống thì được ăn các hạt ở ô sau đó!')],
    real: S('✏️ 🪨🪨', 'For real: draw ten squares and two half moons in the dirt, and use pebbles as seeds.', 'Chơi thật: kẻ mười ô vuông và hai ô quan hình bán nguyệt, dùng sỏi làm quân.')
  },
  hopscotch: {
    origin: S('🇻🇳 🇦🇺 🦶', 'Hopscotch is played in Vietnam, where it is called Nhảy lò cò, and in Australia too.', 'Nhảy lò cò được chơi ở Việt Nam, và ở Úc cũng vậy, gọi là Hopscotch.'),
    steps: [S('🪨 ⬜', 'A stone lands on one square.', 'Viên đá rơi vào một ô.'),
      S('1️⃣ 2️⃣ 3️⃣', 'Tap the numbers in order to hop.', 'Chạm các số theo thứ tự để nhảy.'),
      S('🚫 🪨', 'Skip the square with the stone!', 'Nhớ bỏ qua ô có viên đá!')],
    real: S('✏️ 🦶', 'For real: draw the squares with chalk, throw a stone, and hop on one leg.', 'Chơi thật: vẽ ô bằng phấn, ném viên đá, rồi nhảy lò cò bằng một chân.')
  },
  tug: {
    origin: S('🇻🇳 🪢', 'Kéo co is played at village festivals all over Vietnam. Everyone shouts Dô ta!', 'Kéo co được chơi trong các lễ hội làng khắp Việt Nam. Mọi người cùng hô Dô ta!'),
    steps: [S('💪 👆👆👆', 'Tap the Pull button as fast as you can.', 'Bấm nút Kéo thật nhanh.'),
      S('🪢 ⬅️', 'Pull the red mark all the way to your side to win.', 'Kéo vạch đỏ về phía đội mình là thắng.')],
    real: S('🧒🧒🪢👧👧', 'For real: two teams hold a long rope and pull together on Dô ta!', 'Chơi thật: hai đội cầm sợi dây dài và cùng kéo theo tiếng hô Dô ta!')
  },
  caro: {
    origin: S('🇻🇳 ⭕', 'Cờ caro is played on squared paper in every Vietnamese school. In Australia a small one is called Noughts and Crosses.', 'Cờ caro được chơi trên giấy ô li ở mọi trường học Việt Nam. Ở Úc có trò tương tự tên là Noughts and Crosses.'),
    steps: [S('👆 ⬜', 'Take turns to tap a square.', 'Lần lượt chạm vào một ô.'),
      S('🌸🌸🌸', 'Get your flowers in a row: across, down or slanted!', 'Xếp các bông hoa thẳng hàng: ngang, dọc hoặc chéo!')]
  },
  goat: {
    origin: S('🇻🇳 🐐', 'Bịt mắt bắt dê, blindfold goat, is a favourite Vietnamese party game.', 'Bịt mắt bắt dê là trò chơi dân gian rất được yêu thích ở Việt Nam.'),
    steps: [S('🌾🌾🌾 🐐', 'The goat is hiding in one haystack.', 'Chú dê đang trốn trong một đống rơm.'),
      S('👆 🌾 ➡️', 'Tap a haystack. The hoof prints point towards the goat.', 'Chạm vào đống rơm. Dấu chân dê chỉ về phía chú dê.')],
    real: S('🙈 🧒 🐐', 'For real: one friend wears a blindfold and tries to catch the others, who call out Baa baa!', 'Chơi thật: một bạn bịt mắt đi bắt, các bạn khác kêu Be be để trêu!')
  },
  // ---- puzzles and learning ----
  pattern: { steps: [S('🔴🔵🔴🔵 ❓', 'Look at the pattern.', 'Nhìn dãy hình nhé.'), S('👆 🔴', 'Tap what comes next!', 'Chạm vào hình tiếp theo!')] },
  counting: { steps: [S('🍎🍎🍎', 'Count the things on the screen.', 'Đếm các đồ vật trên màn hình.'), S('👆 3️⃣', 'Tap the right number.', 'Chạm vào số đúng.')] },
  letters: { steps: [S('🔤 👂', 'Listen to the letter.', 'Nghe tên chữ cái.'), S('👆 A', 'Find it and tap it!', 'Tìm và chạm vào chữ đó!')] },
  numbers: { steps: [S('🚂 1 2 ❓ 4', 'The number train has a gap.', 'Đoàn tàu số bị thiếu một toa.'), S('👆 3️⃣', 'Tap the missing number.', 'Chạm vào số còn thiếu.')] },
  shapes: { steps: [S('⬛ 🔷', 'Look at the shadow.', 'Nhìn cái bóng.'), S('👆 🔷', 'Tap the shape that makes that shadow.', 'Chạm vào hình tạo ra cái bóng đó.')] },
  colors: { steps: [S('🔴 ➕ 🟡', 'Mix two paints.', 'Pha hai màu.'), S('🟠 ✨', 'Find the colour they make!', 'Tìm màu pha ra được!')] },
  sorting: { steps: [S('🐭 🐶 🐘', 'Put things from small to big.', 'Xếp từ bé đến lớn.'), S('👆 🐭', 'Tap the smallest first.', 'Chạm vào cái bé nhất trước.')] },
  memory: { steps: [S('🃏🃏', 'Flip two cards.', 'Lật hai thẻ.'), S('🐱 🐱', 'Find the matching pairs. Remember where they are!', 'Tìm hai hình giống nhau. Nhớ vị trí nhé!')] },
  hanoi: { steps: [S('🗼 ⬆️', 'Move the whole tower to another pole.', 'Chuyển cả tháp sang cột khác.'), S('🟥 🚫 🟨', 'Never put a big disc on a small one. Need help? Tap the light bulb.', 'Không đặt đĩa to lên đĩa nhỏ. Cần giúp? Chạm bóng đèn.')] },
  robot: { steps: [S('🤖 ⬆️➡️', 'Plan the robot path with arrows.', 'Lập kế hoạch đường đi cho rô-bốt bằng mũi tên.'), S('▶️ ⭐', 'Press go and watch it reach the star.', 'Bấm chạy và xem rô-bốt đến ngôi sao.')] },
  maze: { steps: [S('🌀 👆', 'Tap the path squares one by one.', 'Chạm từng ô đường đi.'), S('🍉', 'Find the way to the watermelon!', 'Tìm đường đến quả dưa hấu!')] },
  market: { steps: [S('🛒 💰', 'A customer wants to buy something.', 'Có khách muốn mua hàng.'), S('🪙 ➕ 🪙', 'Tap coins to pay exactly the price.', 'Chạm tiền để trả đúng giá.')] },
  order: { steps: [S('📋 🥕🥕', 'Read the order board.', 'Đọc bảng đặt hàng.'), S('👆 🥕', 'Tap the right things to fill the order.', 'Chạm đúng đồ để giao hàng.')] },
  sortout: { steps: [S('👆 🍎', 'Tap a thing first.', 'Chạm vào đồ trước.'), S('🧺', 'Then tap the basket where it belongs.', 'Rồi chạm vào giỏ đúng.')] },
  bunny: { steps: [S('🐰 ❓', 'Bunny is hungry. Listen to what Bunny wants.', 'Thỏ đói rồi. Nghe thỏ muốn ăn gì.'), S('👆 🥕', 'Tap the right food.', 'Chạm vào món đúng.')] },
  jigsaw: { steps: [S('🖼️ 🧩', 'Your picture is all mixed up.', 'Bức ảnh bị xáo trộn.'), S('👆 👆', 'Tap two pieces to swap them.', 'Chạm hai mảnh để đổi chỗ.')] },
  oddone: { steps: [S('🍎🍌🚗', 'Look at all the pictures.', 'Nhìn tất cả các hình.'), S('👆 🚗', 'Tap the one that is different.', 'Chạm vào hình khác loại.')] },
  tower: { steps: [S('🧱 ⬛', 'Start with the biggest block.', 'Bắt đầu bằng khối to nhất.'), S('🧱 ⬆️', 'Then the next biggest, all the way up.', 'Rồi khối to tiếp theo, xây lên cao.')] },
  duckmaze: { steps: [S('🐥 🌀', 'Duckling is lost.', 'Vịt con bị lạc.'), S('👆 🦆', 'Tap the path to bring it to Mummy Duck.', 'Chạm đường đi để đưa vịt con về với mẹ.')] },
  balloon: { steps: [S('👆 🎈 ⬆️', 'Tap to float up. Let go to drift down.', 'Chạm để bay lên. Thả ra để hạ xuống.'), S('🌈 ⭕', 'Fly through the rainbow rings!', 'Bay qua các vòng cầu vồng!')] },
  bubbles: { steps: [S('🫧 👆', 'Tap bubbles to pop them.', 'Chạm bong bóng để chọc vỡ.'), S('🫧⭐', 'Bubbles with a star have a surprise!', 'Bong bóng có ngôi sao có quà bất ngờ!')] },
  tune: { steps: [S('🎵 👂', 'Listen and watch the bars light up.', 'Nghe và nhìn các phím sáng lên.'), S('👆 🎵', 'Play the same tune back!', 'Chơi lại đúng giai điệu!')] },
  // ---- the money games (round S, owner plan 8 Oct); 'lixi' is the drawn red envelope ----
  heodat: { origin: S('🇻🇳 🐷', 'In Vietnam, children save their money in a clay piggy bank, the heo đất. When it is full, they open it on a special day!', 'Ở Việt Nam, các bạn nhỏ bỏ tiền tiết kiệm vào chú heo đất. Khi heo đầy, các bạn mở heo vào một ngày đặc biệt!'),
    steps: [S('👀 🐷', 'Look how much the piggy wants.', 'Nhìn xem heo muốn ăn bao nhiêu.'), S('👆 🪙', 'Tap the money to feed the piggy. Tap it in the tray to take it back.', 'Chạm vào tiền để cho heo ăn. Chạm vào tiền trong khay để lấy lại.'), S('🐷 🎉', 'Watch the piggy grow as you save!', 'Nhìn heo lớn dần khi con để dành!')] },
  coinnote: { steps: [S('👀 🪙', 'Look at the money.', 'Nhìn tiền.'), S('📦 📦', 'Australian money: is it a coin or a note? Vietnamese money: small change or a big note?', 'Tiền Úc: đồng xu hay tiền giấy? Tiền Việt: tiền lẻ hay tiền chẵn?'), S('👆 ✅', 'Tap the right box!', 'Chạm vào đúng hộp!')] },
  needwant: { steps: [S('👀 🧸', 'Look at the picture.', 'Nhìn hình.'), S('🏠 🎁', 'Do we need it to live, or do we just want it?', 'Mình cần nó để sống, hay chỉ muốn thôi?'), S('👆 ✅', 'Tap Need or Want.', 'Chạm Cần hoặc Muốn.')] },
  bahu: { steps: [S('🪙 🪙 🪙', 'You earn some money.', 'Con kiếm được ít tiền.'), S('🫙 🫙 🫙', 'Three jars: Save, Spend and Share.', 'Ba cái hũ: Để dành, Tiêu và Chia sẻ.'), S('👆 🫙', 'Tap a jar to drop money in, the right amount in each.', 'Chạm vào hũ để bỏ tiền vào, mỗi hũ đúng số tiền.')] },
  lixi: { origin: S('🇻🇳 lixi 🏮', 'At Tết, the Lunar New Year, grown-ups give children lucky money in red envelopes, called lì xì.', 'Ngày Tết, người lớn mừng tuổi các bạn nhỏ bằng tiền lì xì trong bao đỏ.'),
    steps: [S('👆 lixi', 'Tap each red envelope to open it.', 'Chạm vào từng bao lì xì để mở.'), S('👀 🪙', 'Count the envelopes, or add up the money inside.', 'Đếm số bao, hoặc cộng tiền bên trong.'), S('👆 ✅', 'Tap the right answer, then say thank you!', 'Chạm vào đáp án đúng, rồi nhớ cảm ơn nhé!')] },
  shopkeep: { steps: [S('🏪 🐰', 'You run the shop. A customer buys something.', 'Con bán hàng. Có khách mua đồ.'), S('🏷️ 💰', 'Look at the price and the money the customer gives you.', 'Nhìn giá và số tiền khách đưa.'), S('👆 🪙', 'Tap the money to give back the right change.', 'Chạm vào tiền để trả lại đúng tiền thừa.')] },
  shoplist: { steps: [S('📝 👀', 'Look at the picture list.', 'Nhìn danh sách hình.'), S('👆 🍎', 'Tap each thing on the list on the shelf.', 'Chạm vào từng món trong danh sách trên kệ.'), S('💰 🏷️', 'Bigger kids: keep within the money you have. Choose the cheaper one!', 'Bạn lớn: tiêu không quá số tiền mình có. Chọn cái rẻ hơn nhé!')] },
  cheaper: { steps: [S('🏷️ 🏷️', 'Look at the prices.', 'Nhìn các giá tiền.'), S('👆 ✅', 'Tap the one that costs less.', 'Chạm vào món ít tiền hơn.')] },
  waitgrow: { steps: [S('🪙 🌱', 'Plant your coins in the money tree.', 'Trồng tiền vào cây tiền.'), S('☀️ 👆', 'Tap Next day and watch it grow a little more each day.', 'Chạm Ngày mai và nhìn cây mọc thêm mỗi ngày.'), S('🌳 🎉', 'Saving now gives you more later!', 'Để dành hôm nay, mai có nhiều hơn!')] },
  barter: { steps: [S('🐔 🥚', 'A friend has something to swap.', 'Một bạn có đồ muốn đổi.'), S('👆 🌽', 'Give what they ask for, or things worth the same number of dots.', 'Đưa thứ bạn ấy muốn, hoặc những thứ có số chấm bằng nhau.'), S('⚖️ 🤝', 'A fair trade makes everyone happy!', 'Đổi công bằng thì ai cũng vui!')] }
};
for (const [id, guide] of Object.entries(DEFAULTS)) if (!HOWTO[id]) HOWTO[id] = guide;

// Second-set art: the same real input and Save action as the canvas, not puzzle rules.
for (const id of ["stamps", "weave", "mosaic", "nonla", "aodai", "kitepaint", "shades", "shadowpic", "finishpic", "scene", "lacquer", "scratch", "bubblepaint", "fingerpaint", "weatherpaint", "thocam", "pixelpic", "fireworks", "masks", "makeface", "gallery", "leafrub"]) HOWTO[id] = { steps: [
  S('🎨', 'Choose a colour for your picture.', 'Chọn màu cho bức tranh của con.'),
  S('✏️', 'Paint with your finger or mouse. With a keyboard, use arrows and Space.', 'Vẽ bằng ngón tay hoặc chuột. Với bàn phím, dùng mũi tên và phím cách.'),
  S('✅', 'Make twelve marks, then choose Keep in Album. Leaving early does not save a picture.', 'Tô mười hai nét rồi chọn Lưu vào Album. Thoát sớm không lưu tranh.')
] };
