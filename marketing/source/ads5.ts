// Five ads (owner, 11 Oct 2026), each in English and in Vietnamese: captions + voice-over per scene.
// ADS5[name] = [{ id, still or layers(lang), cap: [en, vi], say: [en, vi], cls }]; window.DUR[id] (seconds of the voice line) sets each scene's length.
window.ADS5 = (() => {
  const SKY = 'linear-gradient(180deg,#5ec8f2 0%,#a8e3f7 55%,#8fdc6a 55%,#5fb447 100%)';
  const WARM = 'radial-gradient(ellipse at 50% 30%,#ffd6a0 0%,#ff9fb2 50%,#8a5cf6 100%)';
  const MINT = 'linear-gradient(160deg,#c9f7e1 0%,#fff3c4 100%)';
  const PEACH = 'linear-gradient(160deg,#ffe7b0 0%,#ffc4d6 100%)';
  const PURPLE = 'radial-gradient(ellipse at 50% 20%,#b49cff 0%,#6a4a9a 70%,#3a2a60 100%)';
  return {
    parents: [
      { id: 'p1', bg: WARM, phones: ['title'], cap: ['Screen time you can feel good about', 'Giờ chơi màn hình bố mẹ yên tâm'],
        say: ['Looking for screen time you can actually feel good about?', 'Bố mẹ đang tìm giờ chơi màn hình thật sự yên tâm cho con?'] },
      { id: 'p2', still: 'cine-village', cap: ['A gentle 3D world for ages 2–8', 'Thế giới 3D hiền hoà cho bé 2–8 tuổi'], cls: 'blue',
        say: ['Sparkle Valley is a gentle 3D world for children aged two to eight.', 'Thung Lũng Lấp Lánh là một thế giới 3D hiền hoà cho bé từ hai đến tám tuổi.'] },
      { id: 'p3', bg: MINT, phones: ['game-count', 'game-colors', 'game-caro'], capTop: true, cap: ['Learning hidden in play', 'Học mà như chơi'], cls: 'green',
        say: ['Every game quietly builds numbers, words, colours and thinking.', 'Mỗi trò chơi giúp con học số, học chữ, màu sắc và tư duy.'] },
      { id: 'p4', bg: PEACH, phones: ['grownups'], cap: ['You stay in charge', 'Bố mẹ luôn nắm quyền'],
        chips: [['⏰ Rest timer', '⏰ Hẹn giờ nghỉ'], ['🌙 Gentle bedtime', '🌙 Giờ ngủ nhẹ nhàng'], ['📝 Family missions', '📝 Nhiệm vụ gia đình']],
        say: ['You stay in charge: a rest timer, a gentle bedtime, and family missions you write yourself.', 'Bố mẹ luôn nắm quyền: hẹn giờ nghỉ, giờ đi ngủ nhẹ nhàng, và nhiệm vụ gia đình do chính bố mẹ đặt.'] },
      { id: 'p5', bg: SKY, phones: ['simple'], cap: ['Safe from the start', 'An toàn ngay từ đầu'], cls: 'white',
        chips: [['🔒 Online off until you allow it', '🔒 Chơi trực tuyến tắt sẵn'], ['📴 Works offline', '📴 Chơi được khi không có mạng']],
        say: ['Playing online stays off until a grown-up turns it on, and it works without the internet.', 'Chơi trực tuyến luôn tắt cho đến khi người lớn bật, và vẫn chơi được khi không có mạng.'] },
      { id: 'p6', end: true, say: ['Sparkle Valley. Play in your browser today.', 'Thung Lũng Lấp Lánh. Chơi ngay trên trình duyệt hôm nay.'] }
    ],
    little: [
      { id: 'l1', bg: PEACH, phones: ['simple'], cap: ['Made for little hands', 'Dành cho bàn tay bé xíu'],
        say: ['Made for little hands.', 'Dành cho những bàn tay bé xíu.'] },
      { id: 'l2', bg: MINT, phones: ['simple', 'hub'], cap: ['Big pictures. No reading needed.', 'Hình to. Chưa biết đọc vẫn chơi được.'], cls: 'green',
        say: ['Big pictures, a friendly voice, and no reading needed.', 'Hình to, giọng nói thân thiện, bé chưa biết đọc vẫn chơi được.'] },
      { id: 'l3', bg: WARM, phones: ['game-colors'], confetti: true, cap: ['Little ones never lose', 'Bé nhỏ không bao giờ thua'], cls: 'pink',
        say: ['Under-fives never lose and never race a clock. Every try is cheered.', 'Bé dưới năm tuổi không bao giờ thua, không phải chạy đua với thời gian. Lần thử nào cũng được khen.'] },
      { id: 'l4', bg: SKY, phones: ['game-count', 'game-colors', 'hub'], big: ['77 games', '77 trò chơi'], cap: ['Colours, counting, animals, music', 'Màu sắc, đếm số, con vật, âm nhạc'], cls: 'white',
        say: ['Seventy-seven little games: colours, counting, animals, music and more.', 'Bảy mươi bảy trò chơi nhỏ: màu sắc, đếm số, con vật, âm nhạc và nhiều nữa.'] },
      { id: 'l5', bg: PURPLE, phones: ['game-caro'], cap: ['Grows with your child', 'Lớn lên cùng con'], cls: 'purple',
        say: ['And as they grow, the challenge grows with them.', 'Con lớn đến đâu, thử thách lớn theo đến đó.'] },
      { id: 'l6', end: true, say: ['Sparkle Valley, for ages two to eight.', 'Thung Lũng Lấp Lánh, cho bé từ hai đến tám tuổi.'] }
    ],
    heritage: [
      { id: 'h1', bg: WARM, phones: ['title'], cap: ['Keep Vietnamese alive at home', 'Giữ tiếng Việt trong nhà mình'],
        say: ['Want your children to grow up loving Vietnamese?', 'Bố mẹ muốn con lớn lên yêu tiếng Việt?'] },
      { id: 'h2', bg: SKY, phones: ['title@en', 'title@vi'], cap: ['English ⇄ Tiếng Việt in one tap', 'Tiếng Anh ⇄ Tiếng Việt chỉ một chạm'], cls: 'white',
        say: ['Everything in Sparkle Valley is in English and Vietnamese, and spoken aloud.', 'Mọi thứ trong Thung Lũng Lấp Lánh đều có tiếng Anh và tiếng Việt, và được đọc thành tiếng.'] },
      { id: 'h3', bg: PURPLE, phones: ['tale'], cap: ['Vietnamese tales, read aloud', 'Truyện cổ Việt Nam, kể thành tiếng'], cls: 'purple',
        say: ['Children hear the old tales, like Saint Gióng, told with moving pictures.', 'Con được nghe truyện cổ như Thánh Gióng, kể bằng hình ảnh sống động.'] },
      { id: 'h4', bg: PEACH, phones: ['festivals'], cap: ['Festivals in their real season', 'Lễ hội đúng mùa'],
        say: ['They carry lanterns at Trung Thu and celebrate each festival in its real season.', 'Con rước đèn Trung Thu và đón từng lễ hội đúng mùa.'] },
      { id: 'h5', still: 'cine-hanoi', cap: ['Visit Hà Nội and Hội An', 'Dạo chơi Hà Nội và Hội An'], cls: 'pink',
        say: ['And they walk through Hà Nội and Hội An, without leaving home.', 'Và dạo chơi Hà Nội, Hội An ngay tại nhà.'] },
      { id: 'h6', end: true, say: ['Sparkle Valley. Two languages, one happy home.', 'Thung Lũng Lấp Lánh. Hai ngôn ngữ, một mái nhà vui.'] }
    ],
    together: [
      { id: 't1', bg: SKY, phones: ['two-players'], cap: ['Better together', 'Chơi cùng nhau vui hơn'], cls: 'white',
        say: ['Sparkle Valley is better together.', 'Thung Lũng Lấp Lánh vui hơn khi chơi cùng nhau.'] },
      { id: 't2', still: 'two-players', cap: ['Two children, one tablet', 'Hai bé, một máy tính bảng'], cls: 'blue',
        say: ['Two children can share one tablet, each with their own half of the screen.', 'Hai bé chơi chung một máy tính bảng, mỗi bé một nửa màn hình.'] },
      { id: 't3', bg: PEACH, phones: ['friends'], cap: ['Family far away? Invite them', 'Gia đình ở xa? Mời vào chơi'],
        chips: [['🔢 A six-digit code', '🔢 Mã sáu số']],
        say: ['Family far away? Invite them to play with a six-digit code.', 'Gia đình ở xa? Mời họ vào chơi bằng mã sáu số.'] },
      { id: 't4', bg: MINT, phones: ['friends'], cap: ['Safe by design', 'An toàn từ thiết kế'], cls: 'green',
        chips: [['🎙️ Microphone off until you say yes', '🎙️ Micro tắt đến khi bạn đồng ý'], ['🔒 Online off until a grown-up allows it', '🔒 Người lớn bật mới chơi trực tuyến']],
        say: ['The microphone stays off until you let them in, and online play only starts when a grown-up allows it.', 'Micro luôn tắt cho đến khi bạn cho vào, và chỉ chơi trực tuyến khi người lớn cho phép.'] },
      { id: 't5', bg: WARM, phones: ['game-caro', 'tale'], cap: ['Play, read and explore together', 'Cùng chơi, cùng đọc, cùng khám phá'], cls: 'pink',
        say: ['Then play games, read stories and explore the valley together.', 'Rồi cùng chơi, cùng đọc truyện và cùng khám phá thung lũng.'] },
      { id: 't6', end: true, say: ['Sparkle Valley. Play together, wherever you are.', 'Thung Lũng Lấp Lánh. Chơi cùng nhau, dù ở đâu.'] }
    ],
    explore: [
      { id: 'e1', still: 'cine-village', cap: ['A whole valley to explore', 'Cả một thung lũng để khám phá'], cls: 'blue',
        say: ['A whole valley to explore.', 'Cả một thung lũng để khám phá.'] },
      { id: 'e2', still: 'cine-hanoi', cap: ['From Lotus Village to Hà Nội…', 'Từ Làng Sen đến Hà Nội…'], cls: 'pink',
        say: ["Walk from Lotus Village to Hà Nội's red bridge,", 'Đi từ Làng Sen đến cầu Thê Húc đỏ ở Hà Nội,'] },
      { id: 'e3', still: 'cine-sydney', cap: ['…and sail to Sydney', '…rồi đi phà sang Sydney'], cls: 'white',
        say: ['and sail across to Sydney Harbour.', 'rồi đi phà sang bến cảng Sydney.'] },
      { id: 'e4', bg: PURPLE, phones: ['dialog'], cap: ['Follow the lantern story', 'Theo câu chuyện chiếc đèn lồng'], cls: 'purple',
        say: ['Follow the lantern story, with a little dragon friend to light the way.', 'Theo câu chuyện chiếc đèn lồng, có bạn rồng nhỏ soi đường.'] },
      { id: 'e5', bg: PEACH, phones: ['wardrobe', 'map'], cap: ['Something new every day', 'Mỗi ngày một điều mới'],
        say: ['Dress up your hero, find surprise gifts, and discover something new every day.', 'Thay đồ cho nhân vật, tìm quà bất ngờ, và mỗi ngày lại có điều mới.'] },
      { id: 'e6', end: true, say: ['Sparkle Valley. Come and explore.', 'Thung Lũng Lấp Lánh. Vào khám phá thôi!'] }
    ]
  };
})();
// Turns an ad into stage scenes for one language (lang 'en' | 'vi'); stills are <name>-<lang>.jpg unless written name@lang
window.ADS5_BUILD = (name, lang) => {
  const { L } = AD, k = lang === 'vi' ? 1 : 0, DUR = window.DUR || {};
  const SKY = 'linear-gradient(180deg,#5ec8f2 0%,#a8e3f7 55%,#8fdc6a 55%,#5fb447 100%)';
  const src = s => s.includes('@') ? s.replace('@', '-') : `${s}-${lang}`;
  const layouts = { 1: [[250, 300, -3, 580, 1031]], 2: [[60, 360, -5, 470, 836], [550, 440, 5, 470, 836]], 3: [[40, 560, -5, 420, 746], [330, 680, 4, 420, 746], [620, 560, 6, 420, 746]] };
  return ADS5[name].map(s => {
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
window.ADS5_THUMB = (name, lang) => {
  const { L } = AD, k = lang === 'vi' ? 1 : 0;
  const T = {
    parents: { head: ['Screen time you can feel good about', 'Giờ chơi màn hình bố mẹ yên tâm'], bg: 'radial-gradient(ellipse at 50% 30%,#ffd6a0 0%,#ff9fb2 50%,#8a5cf6 100%)', phones: ['grownups', 'game-count'], chip: ['👨‍👩‍👧 For parents', '👨‍👩‍👧 Dành cho bố mẹ'] },
    little: { head: ['Made for little hands', 'Dành cho bàn tay bé xíu'], bg: 'linear-gradient(160deg,#ffe7b0 0%,#ffc4d6 100%)', phones: ['simple', 'game-colors'], chip: ['🧒 Under 5s never lose', '🧒 Bé dưới 5 tuổi không bao giờ thua'] },
    heritage: { head: ['Keep Vietnamese alive at home', 'Giữ tiếng Việt trong nhà mình'], bg: 'radial-gradient(ellipse at 50% 20%,#b49cff 0%,#6a4a9a 70%,#3a2a60 100%)', phones: ['title@en', 'title@vi'], chip: ['🇦🇺 English ⇄ Tiếng Việt 🇻🇳', '🇻🇳 Tiếng Việt ⇄ English 🇦🇺'] },
    together: { head: ['Better together', 'Chơi cùng nhau vui hơn'], bg: 'linear-gradient(180deg,#5ec8f2 0%,#a8e3f7 55%,#8fdc6a 55%,#5fb447 100%)', phones: ['two-players', 'friends'], chip: ['🔒 Safe, with grown-up codes', '🔒 An toàn, có mã của người lớn'] },
    explore: { head: ['A whole valley to explore', 'Cả một thung lũng để khám phá'], still: 'cine-village', phones: ['map'], chip: ['🗺️ Vietnam and Australia', '🗺️ Việt Nam và Úc'] }
  }[name];
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
