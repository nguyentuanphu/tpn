// (v1.08b story, owner 3-4 Nov 2026 AEDT: docs/plans/v109-extras.md) Chapter 5 of the lantern story: Huế, Đà Nẵng,
// Melbourne and Uluru, in January (release calendar key chapter:ch5, 8 Jan 2027). The lantern floated down the Perfume
// River past Huế's Citadel to Đà Nẵng; Bà Năm tells how Huế was the old capital; Captain Molly's cousin drives the trams
// in Melbourne; the Rainbow Serpent's story; the lantern hides in the outback near Uluru, and is hung there at sunset
// when the rock glows orange. Huế has no place of its own on the map (the map is not moved), so it is told, not visited.
// An under-5 skips the big steps, plays the little game and is led by the companion. Nothing spoken has a name.
import { CHAPTERS, STORY_LINES, STORY_TALES } from './chapters.js';
import { createKit, type KitDef } from './chapterkit.js';
import type { StoryChapter, StoryTale } from '../../types/story.js';

const NAM = { style: 'aodai', color: '#8a4a8a', hat: 'none', back: 'none', hair: '#e8e8e8', hairStyle: 'buns', skin: '#e8b48c', glider: 0 };
const JACK = { style: 'shirt', color: '#3b6fe0', hat: 'cap', back: 'none', hair: '#e8c26a', hairStyle: 'short', skin: '#ffe3d1', glider: 0 };

export const CHAPTER: StoryChapter = { id: 'ch5', en: 'Huế, Đà Nẵng, Melbourne and Uluru', vi: 'Huế, Đà Nẵng, Melbourne và Uluru', landmark: 'uluru', keepsake: 'lantern_ch5', reward: 50, trick: 'glow', steps: [
  { id: 'c5_fly', icon: '🏮', en: 'Fly to Đà Nẵng with your friend', vi: 'Cùng bạn đồng hành bay đến Đà Nẵng', at: 'danang5', visit: 'danang', lights: 3,
    act_en: 'Follow the 3 lantern lights to Đà Nẵng', act_vi: 'Đi theo 3 đốm đèn lồng đến Đà Nẵng',
    tale: ['🦉🏮', 'Ông Cú', 'Hoo hoo! A lantern floated down the Perfume River in Huế, past the old Citadel, all the way to Đà Nẵng by the sea. Follow the little lights!', 'Hu hu! Một chiếc đèn lồng trôi theo sông Hương ở Huế, qua Kinh thành cổ, tận Đà Nẵng bên biển. Con đi theo các đốm sáng nhé!'] },
  { id: 'c5_nam', icon: '👵', en: 'Ask Bà Năm about Huế', vi: 'Hỏi Bà Năm về Huế', at: 'nam5', big: true,
    talk: { who: 'Bà Năm', label: ['Ask about Huế', 'Hỏi về Huế'], lines: [
      ['Huế was the old capital, {name}. Kings lived in the Citadel, and boats sing songs on the Perfume River at night.', 'Huế là kinh đô xưa đó, {name}. Các vua sống trong Kinh thành, và ban đêm thuyền hát ca Huế trên sông Hương.'],
      ['The wind took our lantern from Huế, past Đà Nẵng, and far across the sea to Australia. A tram driver in Melbourne saw it!', 'Gió mang đèn lồng từ Huế, qua Đà Nẵng, bay xa qua biển sang nước Úc. Một bác lái tàu điện ở Melbourne đã thấy nó!']],
      short: [['Huế was the old capital! The wind took our lantern across the sea to Melbourne.', 'Huế là kinh đô xưa! Gió mang đèn lồng qua biển sang Melbourne rồi.']] } },
  { id: 'c5_tram', icon: '🚋', en: 'Ride the trams in Melbourne', vi: 'Đi tàu điện ở Melbourne', at: 'tram5', visit: 'melbourne', game: ['tram'], gameLittle: ['koala'],
    act_en: 'Play Tram Stops in Melbourne', act_vi: 'Chơi Tàu điện Melbourne', actL_en: 'Play with the koala', actL_vi: 'Chơi với bạn koala',
    tale: ['🚋😄', 'Jack', 'G\'day! Melbourne has the biggest tram network in the world. Help drive the tram and I will tell you where the lantern went!', 'Chào bạn! Melbourne có mạng tàu điện lớn nhất thế giới. Giúp lái tàu điện đi, rồi mình kể đèn lồng bay đi đâu!'],
    taleLittle: ['🐨✨', 'Jack', 'A sleepy koala is here! Let us play with the koala.', 'Có một bạn koala buồn ngủ ở đây! Mình chơi với bạn koala nhé.'] },
  { id: 'c5_tale', icon: '📖', en: 'Hear the story of the Rainbow Serpent', vi: 'Nghe chuyện Rắn Cầu Vồng', at: 'nam5u', tale_id: 'rainbowserpent',
    talk: { who: 'Bà Năm', label: ['Listen to the story', 'Nghe kể chuyện'], lines: [['Come and sit, {name}. The first people of Australia tell of the Rainbow Serpent, who made the rivers and the hills.', 'Lại đây ngồi nào, {name}. Những người đầu tiên của nước Úc kể về Rắn Cầu Vồng, người tạo ra sông và đồi.']] },
    tale: ['🚋🪨', 'Jack', 'Good on ya! The lantern flew to the outback, near Uluru, the big red rock. Bà Năm went there to see the sunset.', 'Giỏi lắm! Đèn lồng bay vào vùng hoang mạc, gần Uluru, tảng đá đỏ khổng lồ. Bà Năm đến đó ngắm hoàng hôn rồi.'] },
  { id: 'c5_find', icon: '🪨', en: 'Find the lantern in the outback', vi: 'Tìm đèn lồng trong vùng hoang mạc', at: 'clues_ch5', find: true, clues: 3,
    act_en: 'Look by the red rocks and the gum trees', act_vi: 'Tìm cạnh những tảng đá đỏ và cây bạch đàn', actL_en: 'Follow your friend: it glows over the lantern', actL_vi: 'Đi theo bạn đồng hành: bạn ấy phát sáng trên chỗ đèn lồng',
    tale: ['👵🌈', 'Bà Năm', 'Like the Rainbow Serpent, our lantern found its way across the land. Look by the red rocks!', 'Như Rắn Cầu Vồng, đèn lồng của mình đã tìm được đường băng qua đất liền. Con tìm cạnh những tảng đá đỏ nhé!'],
    taleLittle: ['✨🏮', 'Bà Năm', 'Your friend can glow like the sunset now! Follow the glow to the lantern.', 'Bạn đồng hành của con biết phát sáng như hoàng hôn rồi! Con đi theo ánh sáng đến chỗ đèn lồng nhé.'] },
  { id: 'c5_hang', icon: '🌅', en: 'Hang the lantern near Uluru at sunset', vi: 'Treo đèn lồng gần Uluru lúc hoàng hôn', at: 'hang_ch5', hang: true,
    tale: ['🏮🌅', '{companion}', 'The sun is going down and Uluru is turning orange. Let us hang the lantern and watch it glow!', 'Mặt trời đang lặn và Uluru chuyển màu cam. Mình treo đèn lồng lên và ngắm nó sáng nhé!'] }
] };
export const LINES = {
  c5found: ['There it is! The lantern was resting by the red rock.', 'Đây rồi! Đèn lồng đang nghỉ bên tảng đá đỏ.'],
  c5miss: ['Just a lizard warming up in the sun! Look somewhere else.', 'Chỉ là một chú thằn lằn đang sưởi nắng thôi! Con tìm chỗ khác nhé.'],
  c5show: ['Look! The stars are coming out over the outback.', 'Nhìn kìa! Sao đang hiện lên trên vùng hoang mạc.'],
  trick_glow: ['I learned a new trick: I can glow like the sunset!', 'Mình học được trò mới: mình phát sáng như hoàng hôn!']
};
export const TALE: StoryTale = { id: 'lantern_ch5', flag: '🏮', title: ['From Huế to Uluru', 'Từ Huế đến Uluru'], pages: [
  ['🏯🌊', 'In Huế, little boats with lanterns float on the Perfume River at night, past the walls of the old Citadel.', 'Ở Huế, ban đêm những chiếc thuyền nhỏ treo đèn trôi trên sông Hương, qua tường thành Kinh thành cổ.'],
  ['🐉🌉', 'In Đà Nẵng, the dragon bridge breathes fire and water on weekend nights, and everyone cheers.', 'Ở Đà Nẵng, cầu Rồng phun lửa và phun nước vào tối cuối tuần, và mọi người reo hò.'],
  ['🚋🌆', 'In Melbourne, the old trams ding-ding through the streets, full of happy people going to the summer festivals.', 'Ở Melbourne, những chiếc tàu điện cũ leng keng qua phố, chở đầy người vui vẻ đi lễ hội mùa hè.'],
  ['🪨🌅🏮', 'At Uluru the sun went down, the great rock glowed orange and red, and the lantern shone beside it. Only one lantern left to bring home!', 'Ở Uluru mặt trời lặn, tảng đá lớn rực cam và đỏ, và chiếc đèn lồng sáng bên cạnh. Chỉ còn một chiếc đèn nữa thôi là về nhà đủ cả!']
] };
export const KIT: KitDef = {
  id: 'ch5',
  people: [{ id: 'nam5', name: 'Bà Năm', look: NAM, at: { city: 'danang' } }, { id: 'jack5', name: 'Jack', look: JACK, at: { city: 'melbourne' }, small: true }, { id: 'nam5u', name: 'Bà Năm', look: NAM, at: { landmark: 'uluru', dx: -8 } }],
  spots: { danang5: { gate: 'danang' }, tram5: { game: 'tram' } },
  find: { step: 'c5_find', around: { landmark: 'uluru' }, clues: [['rock', '🪨', ['Look by the red rock', 'Tìm cạnh tảng đá đỏ']], ['gum', '🌳', ['Look by the gum tree', 'Tìm cạnh cây bạch đàn']], ['rock', '🦎', ['Look by the little rocks', 'Tìm cạnh mấy hòn đá nhỏ']]],
    found: LINES.c5found as [string, string], miss: LINES.c5miss as [string, string] },
  hang: { landmark: 'uluru' },
  show: { line: LINES.c5show as [string, string], colors: ['#ffb347', '#ff7a3a', '#ffd23f', '#ffffff'] }
};
if (!CHAPTERS.some(c => c.id === 'ch5')) { const k = CHAPTERS.findIndex(c => c.id === 'finale'); CHAPTERS.splice(k < 0 ? CHAPTERS.length : k, 0, CHAPTER); }
Object.assign(STORY_LINES, LINES);
STORY_TALES.lantern_ch5 = TALE;
export const create = (G, ctx) => createKit(G, ctx, KIT);
