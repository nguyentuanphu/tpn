// Ten ads for r82 (owner, 17 Oct 2026 AEDT: "10 film ads with voice over each language to show the selling points", with
// one about family tasks), each made once fully in English and once fully in Vietnamese: captions + voice-over per scene.
// ADS10[name] = [{ id, still | bg + phones, cap: [en, vi], say: [en, vi], chips, cls }]; window.DUR[id] (seconds of the
// voice line) sets each scene's length. Stills are stills10/<name>-<lang>.jpg (capture10.mjs). Built on ads5.js's stage.
window.ADS10 = (() => {
  const SKY = 'linear-gradient(180deg,#5ec8f2 0%,#a8e3f7 55%,#8fdc6a 55%,#5fb447 100%)';
  const WARM = 'radial-gradient(ellipse at 50% 30%,#ffd6a0 0%,#ff9fb2 50%,#8a5cf6 100%)';
  const MINT = 'linear-gradient(160deg,#c9f7e1 0%,#fff3c4 100%)';
  const PEACH = 'linear-gradient(160deg,#ffe7b0 0%,#ffc4d6 100%)';
  const PURPLE = 'radial-gradient(ellipse at 50% 20%,#b49cff 0%,#6a4a9a 70%,#3a2a60 100%)';
  const end = (id, en, vi) => ({ id, end: true, say: [en, vi] });
  return {
    homes: [
      { id: 'ho1', still: 'cine-village', cap: ['Two homes, one valley', 'Hai quê hương, một thung lũng'], cls: 'blue',
        say: ['Two homes, one valley.', 'Hai quê hương, một thung lũng.'] },
      { id: 'ho2', still: 'cine-hanoi', cap: ['Hà Nội, Hội An, Sài Gòn…', 'Hà Nội, Hội An, Sài Gòn…'], cls: 'pink',
        say: ['Walk through Hà Nội, Hội An and Sài Gòn,', 'Dạo bước qua Hà Nội, Hội An và Sài Gòn,'] },
      { id: 'ho3', still: 'cine-sydney', cap: ['…Sydney, Melbourne, Brisbane', '…Sydney, Melbourne, Brisbane'], cls: 'white',
        say: ['then ride the ferry to Sydney, Melbourne and Brisbane.', 'rồi đi phà sang Sydney, Melbourne và Brisbane.'] },
      { capTop: true, id: 'ho4', bg: SKY, phones: ['map'], cap: ['Real places, real landmarks', 'Địa danh thật, cảnh thật'], cls: 'white',
        chips: [['🇻🇳 5 Vietnamese cities', '🇻🇳 5 thành phố Việt Nam'], ['🇦🇺 3 Australian cities', '🇦🇺 3 thành phố Úc']],
        say: ['Eight cities with real landmarks, joined by roads, rivers and bridges.', 'Tám thành phố với địa danh thật, nối với nhau bằng đường, sông và cầu.'] },
      { id: 'ho5', still: 'cine-hoian', cap: ['A gentle world for ages 2–8', 'Thế giới hiền hoà cho bé 2–8 tuổi'], cls: 'green',
        say: ['A gentle 3D world for children aged two to eight.', 'Một thế giới 3D hiền hoà cho bé từ hai đến tám tuổi.'] },
      end('ho6', 'Sparkle Valley. Two homes, one valley.', 'Thung Lũng Lấp Lánh. Hai quê hương, một thung lũng.')
    ],
    bilingual: [
      { id: 'bi1', bg: SKY, phones: ['title@en', 'title@vi'], cap: ['English ⇄ Tiếng Việt in one tap', 'Tiếng Việt ⇄ English chỉ một chạm'], cls: 'white',
        say: ['English or Vietnamese? Switch with one tap.', 'Tiếng Việt hay tiếng Anh? Chỉ một chạm là đổi.'] },
      { id: 'bi2', bg: PEACH, phones: ['dialog'], cap: ['Everything is spoken aloud', 'Mọi thứ đều được đọc thành tiếng'],
        say: ['Every word is spoken aloud, so even children who cannot read yet can play.', 'Mọi chữ đều được đọc thành tiếng, nên bé chưa biết đọc vẫn chơi được.'] },
      { id: 'bi3', bg: MINT, phones: ['game-letters', 'game-reading'], cap: ['Learn both alphabets', 'Học chữ cả hai thứ tiếng'], cls: 'green',
        say: ['Children learn letters and words in both languages, with real native voices.', 'Bé học chữ cái và từ ngữ bằng cả hai thứ tiếng, với giọng đọc bản xứ.'] },
      { id: 'bi4', bg: PURPLE, phones: ['tale'], cap: ['Stories in the language of home', 'Truyện kể bằng tiếng của nhà mình'], cls: 'purple',
        say: ['Grandparents and grandchildren can share the same stories, in the language of home.', 'Ông bà và các cháu cùng nghe một câu chuyện, bằng tiếng của nhà mình.'] },
      end('bi5', 'Sparkle Valley. Two languages, one happy home.', 'Thung Lũng Lấp Lánh. Hai ngôn ngữ, một mái nhà vui.')
    ],
    family: [
      { id: 'fa1', bg: WARM, phones: ['missions'], cap: ['Family tasks, turned into play', 'Việc nhà thành trò chơi'],
        say: ['Turn family tasks into an adventure.', 'Biến việc nhà thành một cuộc phiêu lưu.'] },
      { capTop: true, id: 'fa2', bg: MINT, phones: ['grownups-missions'], cap: ['15 ready-made missions', '15 nhiệm vụ làm sẵn'], cls: 'green',
        chips: [['☀️ Every day', '☀️ Mỗi ngày'], ['📅 Every week', '📅 Mỗi tuần'], ['🌙 At bedtime', '🌙 Trước giờ ngủ']],
        say: ['Choose from fifteen ready-made missions for each day, each week and bedtime.', 'Chọn trong mười lăm nhiệm vụ làm sẵn cho mỗi ngày, mỗi tuần và trước giờ ngủ.'] },
      { id: 'fa3', bg: PEACH, phones: ['studio-missions'], cap: ['Or write your own, from your phone', 'Hoặc tự viết, ngay trên điện thoại'],
        say: ['Or write your own in Sparkle Studio: water the plants, put the toys away, read with Grandma.', 'Hoặc tự viết trong Sparkle Studio: tưới cây, cất đồ chơi, đọc sách cùng bà.'] },
      { id: 'fa4', bg: SKY, phones: ['message'], cap: ['On your child’s screen in seconds', 'Đến máy của con sau vài giây'], cls: 'white',
        say: ['A new mission or a message from Mum reaches your child’s game in seconds.', 'Nhiệm vụ mới hay lời nhắn của mẹ đến game của con chỉ sau vài giây.'] },
      { id: 'fa5', bg: WARM, phones: ['missions'], confetti: true, cap: ['Done together, cheered together', 'Cùng làm, cùng vui'], cls: 'pink',
        say: ['When the job is done, you tick it together and celebrate.', 'Làm xong, cả nhà cùng đánh dấu và cùng ăn mừng.'] },
      end('fa6', 'Sparkle Valley. Family time, made fun.', 'Thung Lũng Lấp Lánh. Giờ gia đình thêm vui.')
    ],
    little: [
      { id: 'li1', bg: PEACH, phones: ['simple'], cap: ['Made for little hands', 'Dành cho bàn tay bé xíu'],
        say: ['Made for little hands.', 'Dành cho những bàn tay bé xíu.'] },
      { id: 'li2', bg: MINT, phones: ['simple', 'hub'], cap: ['Big pictures. No reading needed.', 'Hình to. Chưa biết đọc vẫn chơi được.'], cls: 'green',
        say: ['The Simple screen has big pictures and a friendly voice. No reading needed.', 'Màn hình đơn giản có hình to và giọng nói thân thiện. Bé chưa biết đọc vẫn chơi được.'] },
      { id: 'li3', bg: WARM, phones: ['game-colors'], confetti: true, cap: ['Little ones never lose', 'Bé nhỏ không bao giờ thua'], cls: 'pink',
        say: ['Under-fives never lose and never race a clock. Every try is cheered.', 'Bé dưới năm tuổi không bao giờ thua, không phải chạy đua với thời gian. Lần thử nào cũng được khen.'] },
      { id: 'li4', bg: SKY, phones: ['game-count', 'game-colors', 'game-kite'], cap: ['Colours, counting, animals, music', 'Màu sắc, đếm số, con vật, âm nhạc'], cls: 'white',
        say: ['Colours, counting, animals and music, all in little games.', 'Màu sắc, đếm số, con vật và âm nhạc, tất cả trong những trò chơi nhỏ.'] },
      { id: 'li5', bg: PURPLE, phones: ['game-letters'], cap: ['Grows with your child', 'Lớn lên cùng con'], cls: 'purple',
        say: ['And as they grow, Easy, Medium and Hard grow with them.', 'Con lớn đến đâu, mức Dễ, Vừa và Khó lớn theo đến đó.'] },
      end('li6', 'Sparkle Valley, for ages two to eight.', 'Thung Lũng Lấp Lánh, cho bé từ hai đến tám tuổi.')
    ],
    learn: [
      { id: 'le1', bg: MINT, phones: ['game-count', 'game-letters'], cap: ['Learning hidden in play', 'Học mà như chơi'], cls: 'green',
        say: ['Learning, hidden in play.', 'Học mà như chơi.'] },
      { id: 'le2', bg: PEACH, phones: ['game-reading'], cap: ['A reading corner', 'Góc đọc'],
        say: ['In the reading corner, children trace letters, hear their sounds and build their first words.', 'Ở góc đọc, bé tô chữ cái, nghe âm và ghép những từ đầu tiên.'] },
      { id: 'le3', bg: SKY, phones: ['game-count'], cap: ['Count, add, compare', 'Đếm, cộng, so sánh'], cls: 'white',
        say: ['They count, add and compare, with Easy, Medium and Hard levels.', 'Bé đếm, cộng và so sánh, với các mức Dễ, Vừa và Khó.'] },
      { id: 'le4', bg: WARM, phones: ['game-money'], cap: ['Money in AUD and VND', 'Tiền Úc và tiền Việt'], cls: 'pink',
        say: ['They even learn to save and spend money, in Australian dollars and Vietnamese đồng.', 'Bé còn học để dành và tiêu tiền, bằng đô la Úc và đồng Việt Nam.'] },
      { id: 'le5', bg: PURPLE, phones: ['hub'], cap: ['A game for every mood', 'Trò nào cũng có'], cls: 'purple',
        say: ['Thinking, memory, shapes and music: there is always something new to try.', 'Tư duy, trí nhớ, hình khối và âm nhạc: lúc nào cũng có trò mới để thử.'] },
      end('le6', 'Sparkle Valley. Learning they will ask for.', 'Thung Lũng Lấp Lánh. Học mà con đòi chơi.')
    ],
    heritage: [
      { id: 'he1', bg: WARM, phones: ['festivals'], cap: ['Keep the culture alive at home', 'Giữ văn hoá trong nhà mình'],
        say: ['Want your children to love where they come from?', 'Bố mẹ muốn con yêu cội nguồn của mình?'] },
      { id: 'he2', bg: MINT, phones: ['game-oanquan', 'game-kite'], cap: ['Folk games grandparents played', 'Trò chơi dân gian của ông bà'], cls: 'green',
        say: ['They play the folk games their grandparents played, like Ô ăn quan and kite flying.', 'Con chơi trò chơi dân gian của ông bà, như Ô ăn quan và thả diều.'] },
      { id: 'he3', bg: PEACH, phones: ['festivals'], cap: ['Festivals in their real season', 'Lễ hội đúng mùa'],
        say: ['They carry lanterns at Trung Thu and celebrate Tết, each festival in its real season.', 'Con rước đèn Trung Thu, đón Tết, mỗi lễ hội đúng mùa.'] },
      { id: 'he4', still: 'cine-hanoi', cap: ['Hà Nội’s lakes and temples', 'Hồ Gươm và đền chùa Hà Nội'], cls: 'pink',
        say: ['And they walk past Hà Nội’s lakes and temples, without leaving home.', 'Và dạo quanh hồ Gươm, đền chùa Hà Nội ngay tại nhà.'] },
      end('he5', 'Sparkle Valley. Where your culture comes to play.', 'Thung Lũng Lấp Lánh. Nơi văn hoá cùng con vui chơi.')
    ],
    stories: [
      { id: 'st1', bg: PURPLE, phones: ['tale'], cap: ['Fairy tales, read aloud', 'Truyện cổ tích, kể thành tiếng'], cls: 'purple',
        say: ['Fairy tales from Vietnam and around the world, read aloud.', 'Truyện cổ tích Việt Nam và khắp thế giới, được kể thành tiếng.'] },
      { id: 'st2', bg: WARM, phones: ['tale'], cap: ['Moving pictures, gentle voices', 'Hình động, giọng kể dịu dàng'], cls: 'pink',
        say: ['Saint Gióng and many more come alive with moving pictures.', 'Thánh Gióng và nhiều truyện nữa hiện lên với hình ảnh sống động.'] },
      { id: 'st3', bg: SKY, phones: ['dialog'], cap: ['A story to play through', 'Một câu chuyện để cùng chơi'], cls: 'white',
        say: ['Then children step into their own story: help Grandpa Owl find the lost lanterns.', 'Rồi bé bước vào câu chuyện của mình: giúp ông Cú tìm những chiếc đèn lồng bị mất.'] },
      { id: 'st4', still: 'cine-sydney', cap: ['Chapters across the valley', 'Từng chương khắp thung lũng'], cls: 'blue',
        say: ['Chapter by chapter, from Lotus Village to Hà Nội and Sydney.', 'Từng chương một, từ Làng Sen đến Hà Nội và Sydney.'] },
      end('st5', 'Sparkle Valley. A story every day.', 'Thung Lũng Lấp Lánh. Mỗi ngày một câu chuyện.')
    ],
    rewards: [
      { id: 'rw1', bg: PEACH, phones: ['adventure'], cap: ['A new adventure every day', 'Mỗi ngày một chuyến phiêu lưu'],
        say: ['Every day brings a little adventure: three steps, then a treasure chest.', 'Mỗi ngày có một chuyến phiêu lưu nhỏ: ba bước, rồi một rương báu.'] },
      { id: 'rw2', bg: MINT, phones: ['stickers'], cap: ['A sticker book to fill', 'Sổ hình dán để sưu tầm'], cls: 'green',
        say: ['Every place, friend and animal found adds a sticker to the book.', 'Mỗi nơi đã đến, mỗi người bạn và con vật tìm thấy là thêm một hình dán vào sổ.'] },
      { id: 'rw3', bg: WARM, phones: ['wardrobe'], confetti: true, cap: ['Dress up your hero', 'Thay đồ cho nhân vật'], cls: 'pink',
        say: ['Coins buy clothes and hats to dress up their hero.', 'Tiền xu dùng để mua quần áo và mũ cho nhân vật.'] },
      { id: 'rw4', bg: SKY, phones: ['stickers', 'adventure'], cap: ['Gentle rewards every day', 'Phần thưởng nhẹ nhàng mỗi ngày'], cls: 'white',
        say: ['Gentle rewards that make every day feel special.', 'Phần thưởng nhẹ nhàng, ngày nào cũng thấy vui.'] },
      end('rw5', 'Sparkle Valley. Something new every day.', 'Thung Lũng Lấp Lánh. Mỗi ngày một điều mới.')
    ],
    together: [
      { id: 'to1', bg: SKY, phones: ['two-players'], cap: ['Better together', 'Chơi cùng nhau vui hơn'], cls: 'white',
        say: ['Sparkle Valley is better together.', 'Thung Lũng Lấp Lánh vui hơn khi chơi cùng nhau.'] },
      { id: 'to2', still: 'two-players', cap: ['Two children, one tablet', 'Hai bé, một máy tính bảng'], cls: 'blue',
        say: ['Two children can share one tablet, each with their own half of the screen.', 'Hai bé chơi chung một máy tính bảng, mỗi bé một nửa màn hình.'] },
      { capTop: true, id: 'to3', bg: PEACH, phones: ['friends'], cap: ['Family far away? Invite them', 'Gia đình ở xa? Mời vào chơi'],
        chips: [['🔢 A six-digit code', '🔢 Mã sáu số']],
        say: ['Cousins or grandparents far away? Invite them with a six-digit code.', 'Anh chị em hay ông bà ở xa? Mời họ vào chơi bằng mã sáu số.'] },
      { capTop: true, id: 'to4', bg: MINT, phones: ['friends'], cap: ['Safe by design', 'An toàn từ thiết kế'], cls: 'green',
        chips: [['🎙️ Microphone off until you say yes', '🎙️ Micro tắt đến khi bạn đồng ý'], ['🔒 Online off until a grown-up allows it', '🔒 Người lớn bật mới chơi trực tuyến']],
        say: ['The microphone stays off until you let them in, and online play only starts when a grown-up allows it.', 'Micro luôn tắt cho đến khi bạn cho vào, và chỉ chơi trực tuyến khi người lớn cho phép.'] },
      end('to5', 'Sparkle Valley. Play together, wherever you are.', 'Thung Lũng Lấp Lánh. Chơi cùng nhau, dù ở đâu.')
    ],
    parents: [
      { id: 'pa1', bg: WARM, phones: ['title'], cap: ['Screen time you can feel good about', 'Giờ chơi màn hình bố mẹ yên tâm'],
        say: ['Looking for screen time you can actually feel good about?', 'Bố mẹ đang tìm giờ chơi màn hình thật sự yên tâm cho con?'] },
      { capTop: true, id: 'pa2', bg: PEACH, phones: ['grownups'], cap: ['You stay in charge', 'Bố mẹ luôn nắm quyền'],
        chips: [['⏰ Rest timer', '⏰ Hẹn giờ nghỉ'], ['🌙 Gentle bedtime', '🌙 Giờ ngủ nhẹ nhàng']],
        say: ['A rest timer and a gentle bedtime keep play time healthy.', 'Hẹn giờ nghỉ và giờ đi ngủ nhẹ nhàng giúp giờ chơi lành mạnh.'] },
      { id: 'pa3', bg: MINT, phones: ['studio-message'], cap: ['Sparkle Studio for parents', 'Sparkle Studio cho bố mẹ'], cls: 'green',
        say: ['Sparkle Studio lets you set messages, missions and settings from your own phone.', 'Sparkle Studio giúp bố mẹ đặt lời nhắn, nhiệm vụ và cài đặt ngay trên điện thoại.'] },
      { capTop: true, id: 'pa4', bg: SKY, phones: ['simple'], cap: ['Private and safe', 'Riêng tư và an toàn'], cls: 'white',
        chips: [['📴 Works offline', '📴 Chơi được khi không có mạng'], ['🔒 Family photos stay private', '🔒 Ảnh gia đình luôn riêng tư']],
        say: ['It works offline, and family photos stay private.', 'Chơi được khi không có mạng, và ảnh gia đình luôn riêng tư.'] },
      end('pa5', 'Sparkle Valley. Play in your browser today.', 'Thung Lũng Lấp Lánh. Chơi ngay trên trình duyệt hôm nay.')
    ]
  };
})();
// The cover for each ad and language (owner: "the video thumbnails should describe what the video is about")
window.ADS10_COVER = {
  homes: { head: ['Vietnam and Australia in one valley', 'Việt Nam và Úc trong một thung lũng'], still: 'cine-village', phones: ['map'], chip: ['🗺️ 8 cities, real landmarks', '🗺️ 8 thành phố, địa danh thật'] },
  bilingual: { head: ['English and Vietnamese, spoken aloud', 'Tiếng Việt và tiếng Anh, đọc thành tiếng'], bg: 'linear-gradient(180deg,#5ec8f2 0%,#a8e3f7 55%,#8fdc6a 55%,#5fb447 100%)', phones: ['title@en', 'title@vi'], chip: ['🇦🇺 English ⇄ Tiếng Việt 🇻🇳', '🇻🇳 Tiếng Việt ⇄ English 🇦🇺'] },
  family: { head: ['Family tasks, set from your phone', 'Việc nhà, đặt ngay trên điện thoại'], bg: 'radial-gradient(ellipse at 50% 30%,#ffd6a0 0%,#ff9fb2 50%,#8a5cf6 100%)', phones: ['studio-missions', 'missions'], chip: ['✅ Missions reach your child in seconds', '✅ Nhiệm vụ đến máy con sau vài giây'] },
  little: { head: ['Made for children under 5', 'Dành cho bé dưới 5 tuổi'], bg: 'linear-gradient(160deg,#ffe7b0 0%,#ffc4d6 100%)', phones: ['simple', 'game-colors'], chip: ['🧒 Big pictures, never lose', '🧒 Hình to, không bao giờ thua'] },
  learn: { head: ['Reading, counting and money', 'Đọc chữ, đếm số và tiêu tiền'], bg: 'linear-gradient(160deg,#c9f7e1 0%,#fff3c4 100%)', phones: ['game-reading', 'game-money'], chip: ['📚 Learning hidden in play', '📚 Học mà như chơi'] },
  heritage: { head: ['Folk games and festivals', 'Trò chơi dân gian và lễ hội'], bg: 'radial-gradient(ellipse at 50% 30%,#ffd6a0 0%,#ff9fb2 50%,#8a5cf6 100%)', phones: ['game-oanquan', 'festivals'], chip: ['🏮 Ô ăn quan, kites, Trung Thu', '🏮 Ô ăn quan, thả diều, Trung Thu'] },
  stories: { head: ['Fairy tales, read aloud', 'Truyện cổ tích, kể thành tiếng'], bg: 'radial-gradient(ellipse at 50% 20%,#b49cff 0%,#6a4a9a 70%,#3a2a60 100%)', phones: ['tale', 'dialog'], chip: ['📖 Stories in both languages', '📖 Truyện bằng hai thứ tiếng'] },
  rewards: { head: ['Daily adventures and stickers', 'Phiêu lưu mỗi ngày và hình dán'], bg: 'linear-gradient(160deg,#c9f7e1 0%,#fff3c4 100%)', phones: ['adventure', 'stickers'], chip: ['⭐ A sticker for every discovery', '⭐ Mỗi khám phá một hình dán'] },
  together: { head: ['Play together, near or far', 'Chơi cùng nhau, dù gần hay xa'], bg: 'linear-gradient(180deg,#5ec8f2 0%,#a8e3f7 55%,#8fdc6a 55%,#5fb447 100%)', phones: ['two-players', 'friends'], chip: ['🔒 Safe, with grown-up codes', '🔒 An toàn, có mã của người lớn'] },
  parents: { head: ['Screen time you can feel good about', 'Giờ chơi màn hình bố mẹ yên tâm'], bg: 'linear-gradient(160deg,#ffe7b0 0%,#ffc4d6 100%)', phones: ['grownups', 'studio-message'], chip: ['📴 Works offline, you stay in charge', '🔒 Bố mẹ luôn nắm quyền'] }
};

// (from ads5.js) an ad as stage scenes for one language; stills are <name>-<lang>.jpg unless written name@lang
window.ADS10_BUILD = (name, lang) => {
  const { L } = AD, k = lang === 'vi' ? 1 : 0, DUR = window.DUR || {};
  const SKY = 'linear-gradient(180deg,#5ec8f2 0%,#a8e3f7 55%,#8fdc6a 55%,#5fb447 100%)';
  const src = s => s.includes('@') ? s.replace('@', '-') : `${s}-${lang}`;
  const layouts = { 1: [[250, 300, -3, 580, 1031]], 2: [[60, 360, -5, 470, 836], [550, 440, 5, 470, 836]], 3: [[40, 560, -5, 420, 746], [330, 680, 4, 420, 746], [620, 560, 6, 420, 746]] };
  return ADS10[name].map(s => {
    const d = Math.max(3.2, (DUR[s.id + '-' + lang] || 3) + .9);
    if (s.end) return { d: Math.max(d, 5), layers: [L.bg(SKY), L.confetti({ at: .2 }), L.logo({ y: 300 }),
      L.chip(k ? '🧒 Cho bé 2–8 tuổi' : '🧒 Ages 2–8', { x: 190, y: 1190, at: .6, rot: -2 }),
      L.chip(k ? '🇻🇳 Tiếng Việt ⇄ English 🇦🇺' : '🇦🇺 English ⇄ Tiếng Việt 🇻🇳', { x: 110, y: 1330, at: .8, from: 700, rot: 2 }),
      L.chip(k ? '📴 Chơi được khi không có mạng' : '📴 Works offline', { x: 150, y: 1470, at: 1, rot: -1 }),
      L.html(`<div style="font-size:54px;font-weight:500;color:#1f4a1a">sparklevalley.au</div><div style="font-family:'Baloo 2';font-weight:600;font-size:42px;color:#1f4a1a;margin-top:6px">${k ? 'Mở trên trình duyệt → Thêm vào màn hình chính' : 'Open in your browser → Add to Home Screen'}</div>`, { at: 1.3, style: 'left:0;right:0;top:1660px;text-align:center' })] };
    const layers = [];
    if (s.still) layers.push(L.img(src(s.still), [1.03, 1.15, 0, 0, 0, -40]));
    else layers.push(L.bg(s.bg));
    if (s.confetti) layers.push(L.confetti({ at: .1 }));
    if (s.phones) { const lay = layouts[s.phones.length]; s.phones.forEach((p, i) => { const [x, y, r, w, h] = lay[i]; layers.push(L.phone(src(p), { x, y: s.capTop || s.big ? y + 60 : (s.phones.length === 1 ? 120 : y - 200), w, h, rot: r, at: .15 + i * .25 })); }); }
    if (s.big) layers.push(L.big(s.big[k], { y: 90, size: 170, at: .1 }));
    const capY = s.capTop ? 90 : (s.phones && s.phones.length === 1 ? 1290 : (s.still ? 1380 : 1330));
    layers.push(L.cap(s.cap[k], null, { y: s.big ? 300 : capY, at: .35, cls: s.cls || '' }));
    (s.chips || []).forEach((c, i) => layers.push(L.chip(c[k], { x: 70 + (i % 2) * 40, y: 1560 + i * 120 - (s.chips.length > 2 ? 120 : 0), at: .9 + i * .3, rot: i % 2 ? 2 : -2 })));
    return { d, layers };
  });
};
// A thumbnail (cover) for each ad and language (owner, 11 Oct: every video needs a thumbnail of what it is about)
window.ADS10_THUMB = (name, lang) => {
  const { L } = AD, k = lang === 'vi' ? 1 : 0;
  const T = window.ADS10_COVER[name];
  const src = s => s.includes('@') ? s.replace('@', '-') : `${s}-${lang}`;
  const layers = [T.still ? L.img(src(T.still), [1.08, 1.08, 0, 0, 0, 0]) : L.bg(T.bg)];
  if (T.still) layers.push(L.html('', { style: 'inset:0;background:linear-gradient(180deg,rgba(43,34,56,.0) 40%,rgba(43,34,56,.55) 100%)' }));
  const pos = T.phones.length === 2 ? [[70, 560, -6, 450, 800], [560, 620, 6, 450, 800]] : [[300, 620, 4, 480, 853]];
  T.phones.forEach((p, i) => { const [x, y, r, w, h] = pos[i]; layers.push(L.phone(src(p), { x, y, w, h, rot: r, at: 0, drift: 0 })); });
  layers.push(L.html(`<div style="display:flex;align-items:center;justify-content:center;gap:22px"><img src="icon-512.png" style="width:110px;height:110px;border-radius:28px;border:7px solid #2b2238"><div style="font-size:84px;line-height:1;color:#ffd23f;-webkit-text-stroke:8px #2b2238;paint-order:stroke fill;text-shadow:0 8px 0 #2b2238">${k ? 'Thung Lũng Lấp Lánh' : 'Sparkle Valley'}</div></div>`, { at: 0, style: 'left:0;right:0;top:60px' }));
  layers.push(L.html(`<div style="margin:0 50px;background:#ffd23f;border:10px solid #2b2238;border-radius:48px;padding:22px 34px 26px;font-weight:500;font-size:${T.head[k].length > 26 ? 92 : 112}px;line-height:1.02;text-align:center;box-shadow:0 16px 0 #2b2238">${T.head[k]}</div>`, { at: 0, style: 'left:0;right:0;top:230px' }));
  layers.push(L.chip(T.chip[k], { x: 60, y: 1540, at: 0, rot: -2, from: 0 }));
  layers.push(L.html(`<div style="display:inline-block;background:#fff;border:7px solid #2b2238;border-radius:999px;padding:10px 40px 14px;font-size:58px;font-weight:500;box-shadow:0 9px 0 #2b2238">▶ sparklevalley.au</div>`, { at: 0, style: 'left:0;right:0;top:1700px;text-align:center' }));
  return [{ d: 3, layers }];
};
