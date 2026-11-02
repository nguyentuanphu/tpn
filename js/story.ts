// The story of Sparkle Valley, told as a narrated picture book.
// A short prologue starts the adventure; a new chapter opens each time a big quest is finished,
// with a reward. Chapters can be read again from the Album.
import { T, nm } from './i18n.js';
import { say, hush } from './voice.js';
import { SFX } from './audio.js';
import { el } from './util.js';
import { burstConfetti } from './games/frame.js';

// {name} is replaced with the child's name.
export const PROLOGUE = { id: 'prologue', title: () => T('The Sleepy Valley', 'Thung Lũng Ngủ Quên'), pages: [
  ['🌄✨🏮', 'Long ago, Sparkle Valley shone with magic lanterns, happy animals and twelve glowing shrines full of puzzles.', 'Ngày xửa ngày xưa, Thung Lũng Lấp Lánh rực rỡ đèn lồng thần kỳ, đầy những con vật vui vẻ và mười hai ngôi đền phát sáng chứa đầy câu đố.'],
  ['⛈️☁️😤', 'One stormy night, a grumpy cloud called Mây Cau Có blew through the valley. Whoosh! The towers fell asleep and the shrines went quiet.', 'Một đêm giông bão, đám mây khó tính tên là Mây Cau Có thổi qua thung lũng. Vù vù! Các tháp ngủ quên và các ngôi đền im lặng.'],
  ['🦉🔭', 'Ông Cú, the wisest bird in the valley, looked through his telescope and said: "I know who can help. A brave, clever explorer called {name}!"', 'Ông Cú, chú cú già thông thái, nhìn qua kính viễn vọng và nói: "Ta biết ai có thể giúp. Một nhà thám hiểm dũng cảm và thông minh tên là {name}!"'],
  ['🧒🌟🗺️', 'Wake the towers. Solve the shrine puzzles. Help your friends. Make the valley sparkle again! Your adventure starts now.', 'Đánh thức các tháp. Giải câu đố ở các ngôi đền. Giúp đỡ bạn bè. Làm cho thung lũng lấp lánh trở lại! Cuộc phiêu lưu bắt đầu!']
] };

export const CHAPTERS = [
  { id: 'ch1', after: 'tower1', reward: 15, title: () => T('Chapter 1: The Tower Wakes Up', 'Chương 1: Tháp Thức Dậy'), pages: [
    ['🗼✨', 'Ding ding! The Dawn Tower opened its eyes and glowed bright blue. From the top, {name} could see the whole valley!', 'Đinh đoong! Tháp Bình Minh mở mắt và sáng rực màu xanh. Từ trên đỉnh, {name} nhìn thấy cả thung lũng!'],
    ['🗺️💡', '"Look at your map!" hooted Ông Cú. "Every tower you wake shows you more of the valley."', '"Nhìn bản đồ của con kìa!" Ông Cú nói. "Mỗi tháp con đánh thức sẽ cho con thấy thêm thung lũng."']] },
  { id: 'ch2', after: 'glider', reward: 20, title: () => T('Chapter 2: Wings of a Leaf', 'Chương 2: Đôi Cánh Lá'), pages: [
    ['🧩🧩🧩', 'Three shrines solved! Mây Cau Có grumbled: "Hmph. This explorer is too clever for me!"', 'Giải xong ba ngôi đền! Mây Cau Có cằn nhằn: "Hừm. Nhà thám hiểm này thông minh quá!"'],
    ['🪂🍃', 'Ông Cú gave {name} a magic Leaf Glider. Now {name} can float down from high places like a leaf on the wind.', 'Ông Cú tặng {name} một Cánh Lá thần kỳ. Giờ {name} có thể lượn xuống từ chỗ cao như chiếc lá bay trong gió.']] },
  { id: 'ch3', after: 'village', reward: 15, title: () => T('Chapter 3: Lotus Village', 'Chương 3: Làng Sen'), pages: [
    ['🏮🪷', 'In Lotus Village, the lanterns were dim and the children had forgotten their favourite games.', 'Ở Làng Sen, đèn lồng mờ đi và các bạn nhỏ đã quên mất những trò chơi yêu thích.'],
    ['🪢🦶🪨', '"Will you play with us?" asked Tèo, Tí, Bống and Su. "When we laugh, the lanterns shine again!"', '"Bạn chơi với tụi mình nhé?" Tèo, Tí, Bống và Su hỏi. "Khi tụi mình cười, đèn lồng sẽ sáng lại!"']] },
  { id: 'ch4', after: 'folk', reward: 15, title: () => T('Chapter 4: Laughter Lights the Lanterns', 'Chương 4: Tiếng Cười Thắp Đèn'), pages: [
    ['😄🏮✨', 'Ha ha ha! Everyone laughed and cheered. One by one, the red lanterns of Lotus Village began to glow.', 'Ha ha ha! Mọi người cười vang. Từng chiếc đèn lồng đỏ của Làng Sen sáng lên.']] },
  { id: 'ch4b', after: 'playground', reward: 20, title: () => T('Chapter 5: Friends from Far Away', 'Chương 5: Những Người Bạn Phương Xa'), pages: [
    ['🇦🇺🤝🇻🇳', 'On Two Homes Street, children from Australia and Vietnam taught each other their favourite games.', 'Ở Phố Hai Quê, các bạn nhỏ từ Úc và Việt Nam dạy nhau những trò chơi yêu thích.'],
    ['🐺🥢🐉', '"Different places, same laughter!" said Jack and Mít. "Games are the best way to make new friends."', '"Mỗi người một nơi, nhưng tiếng cười thì giống nhau!" Jack và Mít nói. "Chơi cùng nhau là cách hay nhất để kết bạn."']] },
  { id: 'ch5', after: 'cook', reward: 15, title: () => T('Chapter 6: A Feast for Friends', 'Chương 6: Bữa Tiệc Cho Bạn Bè'), pages: [
    ['🍲😋', 'Something smelled delicious! Bác Ba tasted {name}’s cooking and did a happy dance.', 'Thơm quá! Bác Ba nếm món ăn của {name} và nhảy một điệu vui vẻ.'],
    ['💚⚡', '"Good food gives you energy," said Bác Ba. "Eat it when you are tired, and you can run and climb even more!"', '"Ăn ngon thì có sức," Bác Ba nói. "Khi mệt hãy ăn, con sẽ chạy và leo được nhiều hơn!"']] },
  { id: 'ch6', after: 'leafies', reward: 20, title: () => T('Chapter 7: The Hidden Leafies', 'Chương 7: Các Bạn Lá Lá'), pages: [
    ['🍃🙈', 'Little Leafies were hiding under rocks and on mountain tops. They were scared of the grumpy cloud.', 'Các bạn Lá Lá nhỏ xíu trốn dưới hòn đá và trên đỉnh núi. Các bạn sợ đám mây khó tính.'],
    ['🍃💕', '"You found us! You are so kind," they giggled. "We will help make the valley green again."', '"Bạn tìm ra tụi mình rồi! Bạn tốt bụng quá," các bạn cười khúc khích. "Tụi mình sẽ giúp thung lũng xanh tươi trở lại."']] },
  { id: 'ch7', after: 'statue', reward: 20, title: () => T('Chapter 8: The Lotus Blessing', 'Chương 8: Phước Lành Hoa Sen'), pages: [
    ['🪷🔮', 'The Lotus Statue glowed as {name} offered four Sparkle Orbs. "Your clever thinking has made you stronger!"', 'Tượng Sen phát sáng khi {name} dâng bốn Ngọc Lấp Lánh. "Trí thông minh của con đã làm con mạnh mẽ hơn!"']] },
  { id: 'ch8', after: 'towers', reward: 30, title: () => T('Chapter 9: Every Tower Shines', 'Chương 9: Mọi Tháp Đều Sáng'), pages: [
    ['🗼🗼🗼🗼', 'All four towers were awake and shining. Mây Cau Có had nowhere left to hide.', 'Cả bốn tháp đều thức dậy và tỏa sáng. Mây Cau Có không còn chỗ nào để trốn.'],
    ['☁️🥺', 'The grumpy cloud looked a little sad. "Nobody ever plays with me," it whispered.', 'Đám mây khó tính trông hơi buồn. "Chẳng ai chơi với tớ cả," nó thì thầm.']] },
  { id: 'ch9', after: 'shrines', reward: 50, title: () => T('The End: A Rainbow Friend', 'Kết Thúc: Người Bạn Cầu Vồng'), pages: [
    ['🌟🌟🌟', 'Twelve shrines solved! Their light shot up into the sky, warm and bright.', 'Giải xong mười hai đền! Ánh sáng bay vút lên trời, ấm áp và rực rỡ.'],
    ['☁️➡️🌈', '{name} smiled at the cloud: "Do you want to play with us?" The cloud was so happy, it turned into a rainbow!', '{name} mỉm cười với đám mây: "Bạn có muốn chơi cùng tụi mình không?" Đám mây vui quá, biến thành cầu vồng!'],
    ['🎉🏆', 'Sparkle Valley sparkled brighter than ever, thanks to {name}, the hero of the valley. The End… but the fun goes on!', 'Thung Lũng Lấp Lánh lấp lánh hơn bao giờ hết, nhờ có {name}, người anh hùng của thung lũng. Hết… nhưng niềm vui vẫn còn tiếp!']] }
];

// Show pages as a picture book. Tap to turn the page; the voice reads each one.
export function showStory(story, name) {
  return new Promise(res => {
    const b = el('div', 'storybook', `<div class="sb-title"></div><div class="sb-art"></div><p class="sb-text"></p><div class="sb-foot"><span class="sb-dots"></span><button class="sb-skip">${T('Skip', 'Bỏ qua')} ⏭</button></div>`);
    document.body.appendChild(b); SFX.chime();
    let i = 0;
    const fill = s => s.replace(/\{name\}/g, name);
    const show = () => {
      const [art, en, vi] = story.pages[i];
      b.querySelector('.sb-title').textContent = story.title();
      const a = b.querySelector('.sb-art'); a.textContent = art; a.classList.remove('in'); void a.offsetWidth; a.classList.add('in');
      b.querySelector('.sb-text').textContent = T(fill(en), fill(vi));
      b.querySelector('.sb-dots').innerHTML = story.pages.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
      say(fill(en), fill(vi));
    };
    const close = () => { hush(); b.classList.add('out'); setTimeout(() => { b.remove(); res(); }, 300); };
    b.onclick = e => { if (e.target.closest('.sb-skip')) return close(); SFX.tap(); if (++i >= story.pages.length) close(); else show(); };
    show();
  });
}

// Open any chapter that has just been earned. Returns true if one was shown.
export async function storyCheck(G, h, questDone) {
  const p = h.profile;
  p.story = p.story || {};
  for (const c of CHAPTERS) {
    if (p.story[c.id] || !questDone(c.after)) continue;
    p.story[c.id] = true; G.save();
    const was = G.paused; G.paused = true;
    await showStory(c, p.name);
    G.addCoins(c.reward);
    const st = G.giveSticker(p);
    if (c.id === 'ch9') burstConfetti(document.body);
    await G.reward('📖', T('New chapter in your storybook!', 'Chương mới trong sách truyện!'), T(`+${G.fmt(c.reward)}${st ? ' and a sticker ' + st : ''}`, `+${G.fmt(c.reward)}${st ? ' và hình dán ' + st : ''}`));
    G.paused = was;
    return true;
  }
  return false;
}
// Each goal is told as a little story by someone in the valley, so children know why they are going there.
export const QUEST_TALES = {
  tower1: ['🦉🗼', 'Ông Cú', 'The Dawn Tower is fast asleep, right next to us. Climb to the top and it will wake up and show you the whole valley!', 'Tháp Bình Minh đang ngủ say ngay cạnh đây. Leo lên đỉnh, tháp sẽ thức dậy và cho con thấy cả thung lũng!'],
  plateau: ['🦉✨', 'Ông Cú', 'Three puzzle shrines on the plateau went quiet in the storm. They glow orange with a beam of light. Solve their puzzles to wake them!', 'Ba ngôi đền đố vui trên cao nguyên đã im lặng sau cơn bão. Đền màu cam, có cột sáng. Giải câu đố để đánh thức các đền nhé!'],
  glider: ['🦉🎁', 'Ông Cú', 'You solved the shrines! Come back to me, I have a present for you. Something that will help you fly!', 'Con giải xong các đền rồi! Quay lại đây với ông, ông có quà cho con. Một thứ giúp con bay được đấy!'],
  village: ['🏮🌉', 'Ông Cú', 'Across the river bridge is Lotus Village. Its lanterns have gone dim. The children there need a new friend. Will you go?', 'Bên kia cầu là Làng Sen. Đèn lồng ở đó đã mờ đi. Các bạn nhỏ trong làng cần một người bạn mới. Con đi nhé?'],
  market: ['👩‍🌾🛒', 'Cô Mai', 'Oh dear, so many customers and only me to sell the fruit! Could you help me count the money at my market stall?', 'Ôi, đông khách quá mà chỉ có mình cô bán! Con giúp cô đếm tiền ở sạp chợ được không?'],
  cook: ['👨‍🍳🍲', 'Bác Ba', 'The village is hungry after all that fun! Find a cooking pot, put in some food you gathered, and cook something yummy.', 'Cả làng đói bụng sau khi chơi vui! Tìm một nồi nấu ăn, cho đồ ăn con hái được vào, và nấu món gì thật ngon nhé.'],
  folk: ['🧒🪢', 'Tèo', 'We forgot how to laugh since the storm. Play a game with us, Ô ăn quan, hopscotch or tug of war, and the lanterns will shine again!', 'Từ sau cơn bão tụi mình quên cả cười. Chơi với tụi mình một trò nhé, ô ăn quan, nhảy lò cò hay kéo co, đèn lồng sẽ sáng lại!'],
  playground: ['🐺🇦🇺', 'Jack', "G'day! My friends and I came all the way from Australia. Come to Two Homes Street, where Aussie and Vietnamese families live side by side. Learn our games in the park, and Mít will teach you hers!", 'Chào bạn! Tớ và các bạn đến từ nước Úc xa xôi. Hãy đến Phố Hai Quê, nơi các gia đình Úc và Việt sống cạnh nhau. Học trò chơi của tụi tớ ở công viên, Mít cũng sẽ dạy bạn trò của Mít nữa!'],
  market3: ['🍜🏮', 'Cô Mai', 'My friends opened the Three Regions Market. Bà Hai cooks phở like in Hà Nội, O Lài makes bánh bèo from Huế, and Chú Tám sells bánh mì like in Sài Gòn. Taste all three regions!', 'Bạn của cô mở một khu chợ tên là Chợ Ba Miền. Bà Hai nấu phở kiểu Hà Nội, O Lài làm bánh bèo Huế, còn Chú Tám bán bánh mì kiểu Sài Gòn. Con nếm thử đủ ba miền nhé!'],
  aussie: ['🍦🦘', 'Jack', "Over in Aussie Corner there's a milk bar with heaps of lollies, a fish and chip shop, and an ice-cream van that plays a song! Grab a treat, mate!", 'Ở Góc Nước Úc có tiệm tạp hóa đầy kẹo, tiệm cá và khoai chiên, và cả xe kem phát nhạc nữa! Mua một món ăn vặt đi bạn ơi!'],
  postcards: ['📮🗺️', 'Ông Cú', 'Famous places from Vietnam and Australia are hidden all over the valley: the Opera House, Uluru, the Turtle Tower and more. Visit them and collect postcards!', 'Những nơi nổi tiếng của Việt Nam và Úc ẩn khắp thung lũng: Nhà hát Opera, Uluru, Tháp Rùa và nhiều nơi khác. Hãy đến thăm và sưu tầm bưu thiếp nhé!'],
  buffalo: ['🐃🌾', 'Bác Ba', 'The water buffalo are gentle and strong. Walk up to one, say hello and hop on for a ride across the fields!', 'Chú trâu hiền lành và khỏe mạnh lắm. Đi lại gần, chào chú rồi leo lên cưỡi một vòng qua cánh đồng nhé!'],
  leafies: ['🍃🙈', 'Ông Bầu', 'Little Leafies are hiding all over the valley, scared of the grumpy cloud. Look under rocks and for sparkles. Can you find five?', 'Các bạn Lá Lá nhỏ đang trốn khắp thung lũng vì sợ đám mây khó tính. Nhìn dưới hòn đá và chỗ lấp lánh nhé. Con tìm được năm bạn không?'],
  statue: ['🪷🔮', 'Ông Cú', 'Each shrine you solve gives you a Sparkle Orb. Bring four orbs to the Lotus Statue in the village, and it will bless you!', 'Mỗi ngôi đền con giải được cho con một Ngọc Lấp Lánh. Mang bốn viên đến Tượng Sen trong làng, tượng sẽ ban phước cho con!'],
  towers: ['🗼🗺️', 'Ông Cú', 'Three more towers are still asleep: in the bamboo forest, by the lake and on the snowy peak. Wake them all to light up your map!', 'Còn ba tháp nữa vẫn đang ngủ: trong rừng tre, bên hồ và trên đỉnh núi tuyết. Đánh thức tất cả để bản đồ sáng lên nhé!'],
  shrines: ['🌟☁️', 'Ông Cú', 'Only the grumpy cloud is left. Solve every shrine in the valley, and its heart might just turn into a rainbow.', 'Chỉ còn đám mây khó tính thôi. Giải hết các đền trong thung lũng, biết đâu trái tim của mây sẽ biến thành cầu vồng.']
};
// One page, read aloud, with a "Let's go!" button. Resolves true if the child wants to go now.
export function showQuestTale(q, name) {
  const tale = q.tale || QUEST_TALES[q.id]; if (!tale) return Promise.resolve(false);
  const [art, who, en, vi] = tale;
  return new Promise(res => {
    const b = el('div', 'storybook quest-tale', `<div class="sb-title">${q.icon} ${T('New adventure', 'Cuộc phiêu lưu mới')}</div><div class="sb-art in">${art}</div>
      <p class="sb-text"><b class="qt-who">${nm(who)}:</b> “${T(en, vi).replace(/\{name\}/g, name)}”</p>
      <div class="qt-goal">🎯 ${q.title()}</div>
      <div class="sb-foot"><button class="qt-go">▶ ${T("Let's go!", 'Đi thôi!')}</button><button class="sb-skip">${T('Later', 'Để sau')}</button></div>`);
    document.body.appendChild(b); SFX.chime();
    say(en, vi);
    const close = go => { hush(); b.classList.add('out'); setTimeout(() => { b.remove(); res(go); }, 300); };
    b.querySelector('.qt-go').onclick = () => close(true);
    b.querySelector('.sb-skip').onclick = () => close(false);
  });
}
export const storyList = p => [PROLOGUE, ...CHAPTERS.filter(c => p.story && p.story[c.id])];
