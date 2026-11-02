// The three ads. Each is a list of scenes {d: seconds, layers: [...]}, built from AD.L helpers.
window.VIDEOS = (() => {
  const { L } = AD;
  const SKY = 'linear-gradient(180deg,#5ec8f2 0%,#a8e3f7 55%,#8fdc6a 55%,#5fb447 100%)';
  const WARM = 'radial-gradient(ellipse at 50% 30%,#ffd6a0 0%,#ff9fb2 50%,#8a5cf6 100%)';
  const MINT = 'linear-gradient(160deg,#c9f7e1 0%,#fff3c4 100%)';
  const PEACH = 'linear-gradient(160deg,#ffe7b0 0%,#ffc4d6 100%)';
  const PURPLE = 'radial-gradient(ellipse at 50% 20%,#b49cff 0%,#6a4a9a 70%,#3a2a60 100%)';
  const P = (src, x, y, rot, at, w = 470, h = 836, pos) => L.phone(src, { x, y, w, h, rot, at, pos });
  const end = (d = 5, extra = [], ly = 300) => ({
    d, layers: [L.bg(SKY), L.confetti({ at: .2 }), L.logo({ y: ly }),
      L.chip('🇦🇺 English ⇄ Tiếng Việt 🇻🇳', { x: 120, y: 1190, at: .6, rot: -2 }),
      L.chip('🧒 Ages 2–8 <small>· 2–8 tuổi</small>', { x: 190, y: 1330, at: .8, from: 700, rot: 2 }),
      L.chip('📴 Works offline · No ads', { x: 150, y: 1470, at: 1, rot: -1 }),
      L.html(`<div style="font-size:50px;font-weight:500;color:#1f4a1a">Play in your browser → Add to Home Screen</div><div style="font-family:'Baloo 2';font-weight:600;font-size:40px;color:#1f4a1a;margin-top:8px">Chơi ngay trên trình duyệt → Thêm vào màn hình chính</div>`, { at: 1.3, style: 'left:40px;right:40px;top:1650px;text-align:center' }),
      ...extra]
  });

  const why = [
    { d: 4.6, layers: [L.bg(WARM), L.emoji('🇻🇳', { x: 150, y: 480, at: .2, size: 220 }), L.emoji('❤️', { x: 440, y: 520, at: .6, size: 180 }), L.emoji('🇦🇺', { x: 700, y: 480, at: .4, size: 220 }),
      L.cap('My kids are growing up between two homes', 'Các con tôi lớn lên giữa hai quê hương', { y: 900, at: .9 })] },
    { d: 4.4, layers: [L.img('road-town', [1.05, 1.18, 0, -40, 0, -60]), L.cap('Bà Rịa 🇻🇳 meets Sydney 🇦🇺', 'Bà Rịa gặp Sydney', { y: 1380, at: .4, cls: 'white' })] },
    { d: 4.4, layers: [L.bg(SKY), P('map', 250, 160, -3, .1, 580, 1031), L.cap('So I built them one magical valley', 'Nên tôi làm cho các con một thung lũng diệu kỳ', { y: 1330, at: .5, cls: 'purple' })] },
    { d: 4.4, layers: [L.img('city-sydney', [1.04, 1.16, 0, 30, 0, -40]), L.cap('Sydney ferries, Melbourne trams, Brisbane koalas…', 'Phà Sydney, tàu điện Melbourne, koala Brisbane…', { y: 1360, at: .4, cls: 'blue' })] },
    { d: 4.4, layers: [L.img('city-hanoi', [1.16, 1.04, -30, 0, 30, 0]), L.cap('…Hà Nội, Bắc Ninh, Đà Nẵng and Sài Gòn', '…Hà Nội, Bắc Ninh, Đà Nẵng và Sài Gòn', { y: 1330, at: .4, cls: 'pink' })] },
    { d: 5, layers: [L.bg(PEACH), L.cap('The folk games their grandparents played', 'Trò chơi dân gian của ông bà', { y: 90, at: .2 }),
      P('g-oanquan-en', 40, 640, -6, .5, 420, 746), P('g-datnieu-en', 330, 760, 3, .8, 420, 746), P('g-kite-en', 620, 640, 7, 1.1, 420, 746)] },
    { d: 5, layers: [L.bg(WARM), L.cap('Fairy tales from both homes, read aloud', 'Truyện cổ tích hai quê, đọc thành tiếng', { y: 90, at: .2, cls: 'white' }),
      P('tale-en', 60, 560, -5, .5, 470, 836), P('tale-vi', 550, 640, 5, .8, 470, 836)] },
    { d: 5, layers: [L.bg(MINT), L.cap('Learn to count, read and solve problems', 'Học đếm, đọc và giải đố', { y: 90, at: .2, cls: 'green' }),
      P('g-counting-en', 40, 640, -5, .5, 420, 746), P('g-letters-en', 330, 760, 4, .8, 420, 746), P('g-jigsaw-en', 620, 640, 6, 1.1, 420, 746)] },
    { d: 4.6, layers: [L.img('win-en-1000-960', [1.0, 1.1, 0, 0, 0, 0]), L.confetti({ at: 0 }), L.cap('Every mistake is just a chance to try again', 'Sai thì mình thử lại nhé!', { y: 1380, at: .4, cls: 'green' })] },
    { d: 5, layers: [L.bg(SKY), L.emoji('🇨🇳', { x: 150, y: 330, at: .2, size: 200 }), L.emoji('🤝', { x: 440, y: 360, at: .5, size: 170 }), L.emoji('🇮🇳', { x: 710, y: 330, at: .35, size: 200 }),
      L.emoji('🇻🇳', { x: 260, y: 640, at: .7, size: 170 }), L.emoji('🇦🇺', { x: 620, y: 640, at: .85, size: 170 }),
      L.cap('…and for kids in China and India to discover Vietnam and Australia too', '…và để các bạn nhỏ Trung Quốc, Ấn Độ cùng khám phá Việt Nam và Úc', { y: 1020, at: 1.1, cls: 'white' })] },
    { d: 5.4, layers: [L.bg(PURPLE), P('credits-en', 250, 160, -3, .2, 580, 1031),
      L.cap('Made with love by a dad', 'Một người bố làm bằng cả tấm lòng', { y: 1280, at: .8, cls: 'white' }),
      L.chip('— Henry Nguyen', { x: 520, y: 1700, at: 1.5, from: 700, rot: -3 })] },
    end(5.6)
  ];

  const features = [
    { d: 3.4, layers: [L.img('title-en', [1.0, 1.15, 0, 0, 0, -30]), L.cap('A magical valley for kids 2–8', 'Thung lũng diệu kỳ cho bé 2–8 tuổi', { y: 1250, at: .3 })] },
    { d: 3.4, layers: [L.bg(SKY), P('title-en', 50, 300, -5, .2), P('title-vi', 560, 360, 5, .45),
      L.cap('English ⇄ Tiếng Việt in one tap', 'Đổi ngôn ngữ chỉ một chạm', { y: 1330, at: .8, cls: 'white' })] },
    { d: 4.2, layers: [L.bg(PEACH), L.big('50+ games', { y: 70, size: 190, at: .1 }),
      P('g-oanquan-en', 50, 370, -4, .3, 310, 551), P('g-puppets', 385, 400, 3, .4, 310, 551), P('g-kite-en', 720, 370, 5, .5, 310, 551),
      P('g-traffic', 50, 1000, 4, .6, 310, 551), P('g-koala', 385, 1030, -3, .7, 310, 551), P('g-dongho', 720, 1000, -5, .8, 310, 551),
      L.html(`<div style="font-family:'Baloo 2';font-weight:600;font-size:56px;color:#2b2238">hơn 50 trò chơi</div>`, { at: .5, style: 'left:0;right:0;top:300px;text-align:center' })] },
    { d: 3.6, layers: [L.img('city-dragon', [1.04, 1.18, 0, 0, 0, -50]), L.cap('7 cities with real landmarks', '7 thành phố với công trình nổi tiếng', { y: 1330, at: .3, cls: 'blue' })] },
    { d: 3.4, layers: [L.img('city-bacninh', [1.16, 1.04, 0, 0, -30, 0]), L.cap('Roads, golden gates and bridges to explore', 'Đường sá, cổng chào và cầu để khám phá', { y: 1330, at: .3, cls: 'pink' })] },
    { d: 3.6, layers: [L.bg(WARM), P('tale-en', 60, 260, -4, .1, 470, 836), P('tale-vi', 550, 340, 4, .3, 470, 836), L.cap('32 fairy tales, read aloud', '32 truyện cổ tích, đọc thành tiếng', { y: 1330, at: .5, cls: 'white' })] },
    { d: 3.4, layers: [L.bg(PEACH), P('kiosk', 240, 140, -3, .1, 600, 1067), L.cap('Taste local food, learn local sayings', 'Nếm món quê, học câu ca dao', { y: 1340, at: .5 })] },
    { d: 3.4, layers: [L.bg(MINT), P('g-market-vi', 240, 140, -3, .1, 600, 1067), L.cap('Learn money: AUD and VND', 'Học tiền đô Úc và tiền đồng', { y: 1340, at: .5 })] },
    { d: 3.4, layers: [L.img('kite', [1.04, 1.16, 0, 0, 0, -40]), L.cap('Win a whistling kite!', 'Thắng diều sáo vi vu!', { y: 1330, at: .3, cls: 'green' })] },
    { d: 3.6, layers: [L.bg(SKY), L.emoji('👧', { x: 160, y: 430, at: .1, size: 230 }), L.emoji('🌏', { x: 430, y: 380, at: .3, size: 230 }), L.emoji('👦', { x: 700, y: 430, at: .5, size: 230 }),
      L.cap('Play with friends anywhere', 'Chơi cùng bạn ở bất cứ đâu', { y: 1000, at: .7, cls: 'white' }), L.chip('🔒 Private room codes', { x: 230, y: 1500, at: 1, rot: -2 })] },
    { d: 3.4, layers: [L.img('win-en-1000-960', [1.0, 1.1, 0, 0, 0, 0]), L.confetti(), L.cap('Little ones never lose', 'Bé nhỏ không bao giờ thua', { y: 1300, at: .3, cls: 'green' }),
      L.chip('🔊 Under 5: everything is spoken', { x: 110, y: 1660, at: .9, rot: -2 })] },
    { d: 3.4, layers: [L.bg(WARM), L.emoji('🎙️', { x: 200, y: 420, at: .1, size: 260 }), L.emoji('👨‍👩‍👧', { x: 560, y: 440, at: .35, size: 240 }),
      L.cap('Record Mum & Dad’s voice for the game', 'Thu giọng bố mẹ vào trò chơi', { y: 1000, at: .6, cls: 'white' })] },
    { d: 3.4, layers: [L.bg(PURPLE), L.emoji('🔒', { x: 120, y: 450, at: .1, size: 220 }), L.emoji('📴', { x: 430, y: 420, at: .3, size: 220 }), L.emoji('🚫', { x: 740, y: 450, at: .5, size: 220 }),
      L.cap('Private. Offline. No ads.', 'Riêng tư. Không cần mạng. Không quảng cáo.', { y: 1000, at: .7 })] },
    end(5)
  ];

  const teaser = [
    { d: 2.3, layers: [L.img('street-en', [1.2, 1.05, 0, 0, 0, 0]), L.big('Explore!', { y: 1300, at: .15 })] },
    { d: 2.3, layers: [L.bg(PEACH), P('g-cricket-en', 260, 160, -4, 0, 560, 996), L.big('Play!', { y: 1300, at: .25, color: '#ffd23f' })] },
    { d: 2.3, layers: [L.bg(MINT), P('g-letters-en', 260, 160, 4, 0, 560, 996), L.big('Learn!', { y: 1300, at: .25, color: '#5fd36a' })] },
    { d: 2.2, layers: [L.img('c5-en', [1.05, 1.2, 0, 0, 0, 0]), L.big('G’day!', { y: 1350, at: .15, color: '#3cc7e8' })] },
    { d: 2.2, layers: [L.img('c10-en', [1.05, 1.2, 0, 0, 0, 0]), L.big('Xin chào!', { y: 1350, at: .15, color: '#ff5f7e', size: 180 })] },
    end(4.4, [L.cap('Two homes. One valley.', 'Hai quê hương. Một thung lũng.', { y: 70, at: .4, cls: 'pink' })], 340)
  ];
  return { why, features, teaser };
})();
