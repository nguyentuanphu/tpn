// (owner, 29 Oct 2026 AEDT: "the guide film on each game doesn't do anything") How to play for the games that had no
// guide, so their film showed only "Tap and try!". Written after reading each game, so every step is what the game
// really asks; read aloud in both languages (recorded), pictures drawn by js/art.ts.
import { HOWTO, type HowToGuide } from './howto-registry.js';
const S = (pic: string, en: string, vi: string) => ({ pic, en, vi });
const GUIDES: Record<string, HowToGuide> = {
  // js/games/animals2.ts
  crabwalk: { steps: [S('🦀 🕳️', 'A sandy hole appears on one side.', 'Một cái hang cát hiện ra ở một bên.'), S('⬅️ ➡️', 'Tap Left or Right to walk the crab sideways to the hole.', 'Chạm Trái hoặc Phải để cua bò ngang tới hang.'), S('🦀 🏖️', 'Three holes, and the crab is home!', 'Ba cái hang, thế là cua về nhà!')],
    real: S('🦀 🏖️', 'For real: walk sideways like a crab on the beach!', 'Chơi thật: bò ngang như cua trên bãi biển nhé!') },
  whohome: { steps: [S('👀 🐦', 'Look at the animal.', 'Nhìn con vật.'), S('👆 🏠', 'Tap the place where it lives.', 'Chạm vào nơi nó sống.'), S('🐝 🎉', 'Find a home for every animal!', 'Tìm nhà cho mọi con vật!')] },
  mumbaby: { steps: [S('👀 🦘', 'Look at the mum.', 'Nhìn con vật mẹ.'), S('👆 🐥', 'Tap her baby.', 'Chạm vào con của mẹ.'), S('💛 🎉', 'Every baby finds its mum!', 'Bạn nhỏ nào cũng tìm được mẹ!')] },
  feedzoo: { steps: [S('👀 🐵', 'Look at the hungry animal.', 'Nhìn con vật đang đói.'), S('👆 🍌', 'Tap the food it loves to eat.', 'Chạm vào món nó thích ăn.'), S('🐼 🎋', 'Feed all three animals!', 'Cho cả ba con vật ăn no!')] },
  buffalo: { origin: S('🇻🇳 🐃 🌾', 'In Vietnam, children walk the water buffalo out to the rice fields to graze.', 'Ở Việt Nam, các bạn nhỏ dắt trâu ra đồng ăn cỏ.'),
    steps: [S('🐃 👆', 'Tap Step forward.', 'Chạm Bước tới.'), S('🌾 🐃', 'Four steps along the dike and the buffalo reaches the grass!', 'Bốn bước dọc bờ đê là trâu tới bãi cỏ!')] },
  reefcount: { steps: [S('👀 🐠', 'Look at the fish around the reef.', 'Nhìn đàn cá quanh rạn san hô.'), S('🔢 🐠', 'Count them one by one.', 'Đếm từng con một.'), S('👆 ✅', 'Tap the right number.', 'Chạm vào số đúng.')] },
  tracks: { steps: [S('👀 🐾', 'Look at the footprints on the path.', 'Nhìn dấu chân trên đường.'), S('🤔 🦆', 'Think: whose feet made them?', 'Nghĩ xem: chân của bạn nào đây?'), S('👆 ✅', 'Tap the animal.', 'Chạm vào con vật đó.')] },
  // js/games/nature2.ts
  catchfish: { steps: [S('👀 🐟', 'A little fish pops up in the water.', 'Một chú cá nhỏ hiện lên trong nước.'), S('👆 🐟', 'Tap it to scoop it gently into your net.', 'Chạm để vớt cá nhẹ nhàng vào vợt.'), S('💧 🐟', 'Then it swims away safely. Catch them all!', 'Rồi cá bơi đi an toàn. Vớt hết nhé!')],
    real: S('🎣 💧', 'For real: we always put little fish back in the water.', 'Chơi thật: cá nhỏ thì mình luôn thả lại xuống nước.') },
  emueggs: { origin: S('🇦🇺 🥚', 'Emus are big Australian birds. Their eggs are dark green, and the dad sits on them.', 'Đà điểu emu là loài chim lớn của Úc. Trứng của chúng màu xanh sẫm, và chim bố là người ấp trứng.'),
    steps: [S('👀 🌾', 'Look in the grass for a green emu egg.', 'Tìm quả trứng emu màu xanh trong bãi cỏ.'), S('👆 🥚', 'Tap it to put it in the basket.', 'Chạm để bỏ vào giỏ.'), S('🧺 🎉', 'Fill the basket!', 'Nhặt đầy giỏ nhé!')] },
  reefclean: { origin: S('🇦🇺 🪸 🐢', 'The Great Barrier Reef is the biggest coral reef in the world. Litter can hurt its turtles and fish.', 'Rạn san hô Great Barrier là rạn san hô lớn nhất thế giới. Rác có thể làm hại rùa và cá ở đó.'),
    steps: [S('👀 🥤', 'Find the litter floating over the reef.', 'Tìm rác trôi trên rạn san hô.'), S('👆 🕸️', 'Tap each piece to pick it up.', 'Chạm vào từng món để nhặt lên.'), S('🪸 ✨', 'Clean them all and the reef sparkles!', 'Nhặt sạch là rạn san hô lấp lánh!')] },
  // js/games/me2.ts
  myday: { steps: [S('🌅 🌙', 'Your day goes from morning to bedtime.', 'Một ngày đi từ sáng tới tối.'), S('👆 🪥', 'Tap what comes first, then what comes next.', 'Chạm việc làm trước, rồi việc làm tiếp theo.'), S('🌙 🎉', 'Wake up, brush, school and play, then bedtime!', 'Thức dậy, đánh răng, đi học và chơi, rồi đi ngủ!')] },
  plate: { steps: [S('🍽️ 👀', 'Look at your empty plate.', 'Nhìn chiếc đĩa còn trống.'), S('👆 🥦', 'Tap each kind of food to add it: vegetables, rice, fish and fruit.', 'Chạm từng loại để thêm vào: rau, cơm, cá và trái cây.'), S('🍎 🎉', 'Any order! A full plate keeps you strong.', 'Thứ tự nào cũng được! Đĩa đầy đủ giúp con khỏe mạnh.')] },
  kindchoice: { steps: [S('💝 👀', 'Look at the kind things to do.', 'Nhìn những việc làm tốt.'), S('👆 🧸', 'Tap each one: share, help, water the flowers, say thank you.', 'Chạm từng việc: chia sẻ, giúp đỡ, tưới hoa, nói cảm ơn.'), S('💝 ✨', 'Every kind choice makes the heart grow!', 'Mỗi việc tốt làm trái tim lớn thêm!')],
    real: S('🤝 💛', 'For real: do one kind thing for someone today.', 'Chơi thật: hôm nay con làm một việc tốt cho ai đó nhé.') },
  // js/games/thinking2.ts
  minichess: { steps: [S('👀 ♟️', 'Find your blue piece: rook, bishop or knight.', 'Tìm quân xanh của con: xe, tượng hay mã.'), S('👆 ♟️', 'Tap it, then tap the red piece it can reach.', 'Chạm vào quân đó, rồi chạm quân đỏ mà nó đi tới được.'), S('➡️ ↗️', 'Rooks go straight, bishops go on the diagonal, knights jump in an L.', 'Xe đi thẳng, tượng đi chéo, mã nhảy hình chữ L.')] },
  cotuong: { origin: S('🀄', 'Cờ tướng is Chinese chess, played in parks all over Vietnam.', 'Cờ tướng có từ Trung Quốc, được chơi ở công viên khắp Việt Nam.'),
    steps: [S('👀 🀄', 'Find your piece: chariot, horse or cannon.', 'Tìm quân của con: xe, mã hay pháo.'), S('👆 🀄', 'Tap it, then tap the red general to take it.', 'Chạm vào quân đó, rồi chạm tướng đỏ để ăn.'), S('➡️ 🀄', 'A chariot goes straight; a horse moves like an L; a cannon jumps over one piece to take.', 'Xe đi thẳng; mã đi hình chữ L; pháo nhảy qua một quân để ăn.')] },
  whosits: { steps: [S('👂 🧸', 'Hear where a friend likes to sit.', 'Nghe bạn thích ngồi ở đâu.'), S('👆 🐰', 'Tap that friend.', 'Chạm vào bạn ấy.'), S('👆 🪑', 'Then tap the chair by the window, the table or the plant.', 'Rồi chạm chiếc ghế cạnh cửa sổ, bàn nhỏ hay chậu cây.')] },
  pipes: { steps: [S('🚰 💧', 'Water comes in at the water drop.', 'Nước chảy vào ở giọt nước.'), S('👆 🔁', 'Tap a pipe to turn it a quarter turn.', 'Chạm vào ống để xoay một phần tư vòng.'), S('🌱 🎉', 'Join the pipes all the way to the thirsty plant!', 'Nối các ống liền tới cây đang khát nước!')] },
  // js/games/music2.ts
  dantranh: { origin: S('🇻🇳 🎻', 'The đàn tranh is a Vietnamese zither with many strings, plucked with the fingers.', 'Đàn tranh là nhạc cụ Việt Nam có nhiều dây, gảy bằng ngón tay.'),
    steps: [S('👀 ✨', 'One string lights up.', 'Một sợi dây sáng lên.'), S('👆 🎵', 'Tap the lit string to pluck it.', 'Chạm vào dây đang sáng để gảy.'), S('🎶 🎉', 'Follow the light and play the whole tune!', 'Theo ánh sáng và chơi hết giai điệu nhé!')] },
  bushband: { origin: S('🇦🇺 🪕', 'An Australian bush band plays at country dances with a washboard, a bush bass and a jingly lagerphone.', 'Ban nhạc đồng quê Úc chơi ở các buổi khiêu vũ với bàn giặt, đàn thùng và gậy leng keng.'),
    steps: [S('👀 🪕', 'Look at the three instruments.', 'Nhìn ba nhạc cụ.'), S('👆 🔔', 'Tap any instrument to play it.', 'Chạm nhạc cụ nào cũng được để chơi.'), S('🎶 💃', 'Keep playing and the band gets everyone dancing!', 'Chơi tiếp là cả làng cùng nhảy múa!')] },
  drumecho: { steps: [S('👂 🥁', 'Listen: the big drum plays some beats.', 'Nghe nhé: trống cái đánh vài tiếng.'), S('🔢 🥁', 'Count them.', 'Đếm số tiếng.'), S('👆 🥁', 'Your turn: tap the drum the same number of times, no more!', 'Đến lượt con: đánh đúng bấy nhiêu tiếng, không hơn nhé!')] },
  loudquiet: { steps: [S('👂 📢', 'Listen to the sound. Tap the speaker to hear it again.', 'Nghe âm thanh. Chạm loa để nghe lại.'), S('🦁 🐭', 'Is it loud like a lion, or quiet like a mouse?', 'To như sư tử, hay nhỏ như chú chuột?'), S('👆 ✅', 'Tap Loud or Quiet.', 'Chạm To hoặc Nhỏ.')] },
  songsteps: { origin: S('🇻🇳 🦋', 'Kìa con bướm vàng is a song every Vietnamese child learns.', 'Kìa con bướm vàng là bài hát bạn nhỏ Việt Nam nào cũng biết.'),
    steps: [S('🎶 👀', 'The song lines are all mixed up.', 'Các câu hát bị xáo trộn.'), S('👆 1️⃣', 'Tap the first line of the song, then the next.', 'Chạm câu hát đầu tiên, rồi câu tiếp theo.'), S('🦋 🎉', 'Sing it in order: Kìa con bướm vàng, xòe đôi cánh...', 'Hát theo thứ tự: Kìa con bướm vàng, xòe đôi cánh...')] },
  // js/games/words2.ts
  whichgroup: { steps: [S('👀 🍌', 'Look at the picture.', 'Nhìn bức tranh.'), S('🤔 🧺', 'Is it a fruit, an animal, a vehicle, a toy or clothes?', 'Đó là trái cây, con vật, xe cộ, đồ chơi hay quần áo?'), S('👆 ✅', 'Tap its group.', 'Chạm vào nhóm của nó.')] },
  storyorder: { steps: [S('🫘 🍎', 'A seed grows into a fruit, one step at a time.', 'Hạt giống lớn lên thành quả, từng bước một.'), S('👆 🫘', 'Tap what happens first, then next.', 'Chạm việc xảy ra trước, rồi tiếp theo.'), S('🌱 🌸', 'Seed, sprout, flower, fruit!', 'Hạt, mầm, hoa, quả!')] },
  guesswhat: { steps: [S('👂 ❓', 'Listen to the riddle.', 'Nghe câu đố.'), S('🤔 🐰', 'Think: who is it?', 'Nghĩ xem: đó là ai?'), S('👆 ✅', 'Tap the answer.', 'Chạm vào câu trả lời.')] },
  actions: { steps: [S('👀 🏃', 'Three words: one is something you can do.', 'Ba từ: một từ là việc con có thể làm.'), S('🤔 🏊', 'Can you do it? Run, swim, dance...', 'Con làm được không? Chạy, bơi, múa...'), S('👆 ✅', 'Tap the action word.', 'Chạm vào từ chỉ hoạt động.')],
    real: S('🏃 💃', 'For real: do the action with your body!', 'Chơi thật: làm động tác đó bằng cả người nhé!') },
  position: { steps: [S('👀 📦', 'Look where the animal is.', 'Nhìn xem con vật ở đâu.'), S('🐱 📦', 'Is it in, on or under?', 'Ở trong, ở trên hay ở dưới?'), S('👆 ✅', 'Tap the right word.', 'Chạm vào từ đúng.')],
    real: S('🧸 🪑', 'For real: put a toy in, on and under a chair.', 'Chơi thật: đặt đồ chơi trong, trên và dưới ghế.') },
  // js/games/numbers2.ts
  numline: { steps: [S('🐸 🔢', 'The frog sits on a number.', 'Chú ếch ngồi trên một số.'), S('➡️ 🐸', 'One hop forward goes to the next number.', 'Nhảy thêm một bước là tới số tiếp theo.'), S('👆 ✅', 'Tap where it lands.', 'Chạm số ếch nhảy tới.')] },
  tenframe: { steps: [S('👀 🔟', 'A ten frame has ten boxes, five on top and five below.', 'Khung mười có mười ô, năm ô trên và năm ô dưới.'), S('🔢 🔴', 'Count the red counters.', 'Đếm các hạt màu đỏ.'), S('👆 ✅', 'Tap the number.', 'Chạm vào số đó.')] },
  dice: { steps: [S('🎲 👀', 'Look at the dice.', 'Nhìn mặt xúc xắc.'), S('🔢 🎲', 'Count the dots.', 'Đếm các chấm.'), S('👆 ✅', 'Tap the number.', 'Chạm vào số đó.')] },
  evenodd: { steps: [S('🍎 🍎', 'The apples stand in pairs.', 'Táo xếp thành từng đôi.'), S('🤔 🍎', 'Does every apple have a partner, or is one left over?', 'Quả nào cũng có đôi, hay thừa một quả?'), S('👆 ✅', 'All in pairs is even; one left over is odd.', 'Đủ đôi là chẵn; thừa một là lẻ.')] },
  measure: { steps: [S('🐛 👀', 'Look at the caterpillar.', 'Nhìn chú sâu.'), S('🔢 🟨', 'Count the blocks under it.', 'Đếm các khối ở dưới.'), S('👆 ✅', 'Tap how many blocks long it is.', 'Chạm số khối chú sâu dài.')],
    real: S('📏 🧱', 'For real: measure a toy with blocks or spoons.', 'Chơi thật: đo đồ chơi bằng khối hay thìa.') },
  beforeafter: { steps: [S('👀 🔢', 'Look at the number.', 'Nhìn con số.'), S('❓ 🔢', 'Which number is just before it, or just after it?', 'Số nào đứng ngay trước, hay ngay sau?'), S('👆 ✅', 'Tap the missing number.', 'Chạm vào số còn thiếu.')] },
  halves: { steps: [S('🍕 👀', 'Count the pizza slices.', 'Đếm các miếng bánh.'), S('👧 🧒', 'Share them so both friends get the same.', 'Chia sao cho hai bạn bằng nhau.'), S('👆 ✅', 'Tap how many each friend gets.', 'Chạm số miếng mỗi bạn được.')] },
};
for (const [id, guide] of Object.entries(GUIDES)) if (!HOWTO[id]) HOWTO[id] = guide;
