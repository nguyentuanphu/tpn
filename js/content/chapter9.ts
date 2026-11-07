// (v1.08d s2vn, owner 3 and 5 Nov 2026 AEDT: docs/cores/tasks/v108d/s2vn-brief.md) Chapter 9 of the lantern story:
// the gong festival of the Central Highlands (release calendar key chapter:ch9, with the region's day), the last of
// Season 2 in Vietnam. The last lantern of the season rolled down from the north to the red hills of Tây Nguyên just
// as the village got ready for its gong festival. Y Đam, the new friend, saw it by the nhà rông; the child plays the
// gong rhythm (an under-5 feeds the elephants), hears the tale of the Magic Gourd from Bà Năm (all the peoples of
// Vietnam came from one gourd), finds the lantern near the nhà rông and hangs it there for the festival night. Built on
// the story kit (js/content/chapterkit.ts) in the region's area (js/s2vn.ts). Nothing spoken has a name.
import { CHAPTERS, STORY_LINES, STORY_TALES } from './chapters.js';
import { createKit, type KitDef } from './chapterkit.js';
import { forStory } from '../s2vn.js';
import type { StoryChapter, StoryTale } from '../../types/story.js';

const NAM = { style: 'aodai', color: '#8a4a8a', hat: 'none', back: 'none', hair: '#e8e8e8', hairStyle: 'buns', skin: '#e8b48c', glider: 0, age: 'elder' };
const CHI = { style: 'shirt', color: '#e8434a', hat: 'none', back: 'none', hair: '#3b2618', hairStyle: 'ponytail', skin: '#f0c8a0', glider: 0 };

export const CHAPTER: StoryChapter = { id: 'ch9', en: 'The gongs of the Central Highlands', vi: 'Cồng chiêng Tây Nguyên', landmark: 's2l_nharong', keepsake: 'lantern_ch9', reward: 50, trick: 'drum', steps: [
  { id: 'c9_fly', icon: '🏮', en: 'Go to the Central Highlands with your friend', vi: 'Cùng bạn đồng hành đến Tây Nguyên', at: 'tn9', visit: 's2_taynguyen', lights: 3,
    act_en: 'Follow the 3 lantern lights to the Central Highlands', act_vi: 'Đi theo 3 đốm đèn lồng đến Tây Nguyên',
    tale: ['🦉🏮', 'Ông Cú', 'Hoo hoo! One more lantern rolled down to the red hills of the Central Highlands, just as the village is getting ready for its gong festival. Follow the little lights!', 'Hu hu! Thêm một chiếc đèn lồng lăn về những ngọn đồi đất đỏ Tây Nguyên, đúng lúc buôn làng chuẩn bị lễ hội cồng chiêng. Con đi theo các đốm sáng nhé!'] },
  { id: 'c9_ydam', icon: '🛖', en: 'Meet Y Đam by the nhà rông', vi: 'Gặp Y Đam bên nhà rông', at: 'ydam9', big: true,
    talk: { who: 'Y Đam', label: ['Talk to Y Đam', 'Nói chuyện với Y Đam'], lines: [
      ['Hello, {name}! I am Y Đam. Tonight is our gong festival, and everyone will dance round the fire.', 'Chào {name}! Mình là Y Đam. Tối nay là lễ hội cồng chiêng, mọi người sẽ nhảy múa quanh đống lửa.'],
      ['I saw a red lantern near our nhà rông! But first, help us practise the gong rhythm for tonight.', 'Mình thấy một chiếc đèn lồng đỏ gần nhà rông! Nhưng trước tiên, bạn giúp buôn mình tập nhịp cồng chiêng cho tối nay nha.']],
      short: [['I saw a red lantern near our nhà rông! First, help us practise the gong rhythm.', 'Mình thấy chiếc đèn lồng đỏ gần nhà rông! Trước tiên, bạn giúp buôn mình tập nhịp cồng chiêng nha.']] } },
  { id: 'c9_gong', icon: '🥁', en: 'Play the gong rhythm', vi: 'Đánh nhịp cồng chiêng', at: 'gong9', game: ['tn_gong'], gameLittle: ['tn_elephant'],
    act_en: 'Play Gong Rhythm', act_vi: 'Chơi Nhịp Cồng Chiêng', actL_en: 'Feed the elephants', actL_vi: 'Cho voi ăn',
    tale: ['🥁😄', 'Y Đam', 'Listen to the big gongs and the small gongs, and keep the rhythm going!', 'Bạn nghe chiêng lớn, chiêng nhỏ rồi giữ nhịp cho đều nha!'],
    taleLittle: ['🐘✨', 'Y Đam', 'The elephants are hungry before the festival. Let us give them bananas!', 'Mấy chú voi đói bụng trước lễ hội rồi. Mình cho voi ăn chuối nha!'] },
  { id: 'c9_tale', icon: '📖', en: 'Hear the story of the Magic Gourd', vi: 'Nghe Chuyện quả bầu', at: 'nam9', tale_id: 'quabau',
    talk: { who: 'Bà Năm', label: ['Listen to the story', 'Nghe kể chuyện'], lines: [['Come and sit, {name}. This old story says all the peoples of Vietnam came out of one magic gourd, like brothers and sisters.', 'Lại đây ngồi nào, {name}. Chuyện xưa kể rằng các dân tộc Việt Nam đều ra đời từ một quả bầu, như anh em một nhà.']] },
    tale: ['🥁🏮', 'Y Đam', 'The rhythm is ready for tonight! Now let us find the lantern near the nhà rông.', 'Nhịp chiêng sẵn sàng cho tối nay rồi! Giờ mình đi tìm đèn lồng gần nhà rông nha.'] },
  { id: 'c9_find', icon: '🛖', en: 'Find the lantern near the nhà rông', vi: 'Tìm đèn lồng gần nhà rông', at: 'clues_ch9', find: true, clues: 3,
    act_en: 'Look by the trees and the rocks', act_vi: 'Tìm cạnh hàng cây và tảng đá', actL_en: 'Follow your friend: it glows over the lantern', actL_vi: 'Đi theo bạn đồng hành: bạn ấy phát sáng trên chỗ đèn lồng',
    tale: ['👵🎃', 'Bà Năm', 'All of us came from one gourd, and all the lanterns are coming home together. Look by the trees!', 'Mình đều ra đời từ một quả bầu, và mọi chiếc đèn lồng cũng cùng nhau về nhà. Con tìm cạnh hàng cây nhé!'],
    taleLittle: ['✨🥁', 'Bà Năm', 'Your friend can keep a drum beat now! Follow it to the lantern.', 'Bạn đồng hành của con biết gõ nhịp trống rồi! Con đi theo bạn ấy đến chỗ đèn lồng nhé.'] },
  { id: 'c9_hang', icon: '🔥', en: 'Hang the lantern for the gong festival', vi: 'Treo đèn lồng cho lễ hội cồng chiêng', at: 'hang_ch9', hang: true,
    tale: ['🏮🔥', '{companion}', 'The fire is lit and the gongs are ready. Let us hang the lantern by the nhà rông for the festival!', 'Lửa đã đốt, cồng chiêng đã sẵn sàng. Mình treo đèn lồng bên nhà rông cho lễ hội nhé!'] }
] };
export const LINES = {
  c9found: ['There it is! The lantern was resting under the coffee bushes.', 'Đây rồi! Đèn lồng đang nằm dưới mấy bụi cà phê.'],
  c9miss: ['Just a pile of firewood for tonight! Look somewhere else.', 'Chỉ là đống củi cho tối nay thôi! Con tìm chỗ khác nhé.'],
  c9show: ['Listen! The gongs are playing and the village is dancing round the fire.', 'Nghe kìa! Cồng chiêng vang lên và cả buôn nhảy múa quanh đống lửa.'],
  trick_drum: ['I learned a new trick: I can keep a drum beat!', 'Mình học được trò mới: mình gõ nhịp trống được!']
};
export const TALE: StoryTale = { id: 'lantern_ch9', flag: '🏮', title: ['The Gong Festival Lantern', 'Đèn Lồng Lễ Hội Cồng Chiêng'], pages: [
  ['⛰️☕', 'In the middle of Vietnam are the Central Highlands, with red hills, coffee bushes and tall forests.', 'Ở giữa Việt Nam là Tây Nguyên, với những đồi đất đỏ, rẫy cà phê và rừng cây cao.'],
  ['🛖🥁', 'Each village has a nhà rông, a house for everyone with a roof as tall as an axe blade. The gongs are kept inside.', 'Mỗi buôn làng có một nhà rông, ngôi nhà chung mái cao như lưỡi rìu. Cồng chiêng được cất trong đó.'],
  ['🐘🍌', 'At Buôn Đôn, elephants are friends of the village and help carry heavy things.', 'Ở Buôn Đôn, voi là bạn của buôn làng và giúp chở đồ nặng.'],
  ['🔥🏮', 'At the festival the lantern shone by the nhà rông, the gongs sang, and everyone danced round the fire. Every lantern of the season is home!', 'Trong lễ hội, đèn lồng sáng bên nhà rông, cồng chiêng ngân vang, và mọi người nhảy múa quanh đống lửa. Mọi đèn lồng của mùa này đã về nhà!']
] };
export const create = (G, ctx) => {
  const R = forStory(G, 'taynguyen'), sp = R.spots, st = R.stop || sp.landmark;
  const KIT: KitDef = {
    id: 'ch9',
    people: [{ id: 'nam9', name: 'Bà Năm', look: NAM, at: { at: [sp.friend.x, sp.friend.z], dx: -5, dz: 3 } }, { id: 'chi9', name: 'Chi', look: CHI, at: { at: [sp.tn_gong.x, sp.tn_gong.z] }, small: true }],
    spots: { tn9: { at: [st.x, st.z] }, ydam9: { at: [sp.friend.x, sp.friend.z] }, gong9: { at: [sp.tn_gong.x, sp.tn_gong.z] } },
    find: { step: 'c9_find', around: { at: [sp.landmark.x, sp.landmark.z] }, clues: [['tree', '🌳', ['Look under the coffee bushes', 'Tìm dưới bụi cà phê']], ['rock', '🪨', ['Look by the red rock', 'Tìm cạnh tảng đá đỏ']], ['tree', '🪵', ['Look by the firewood', 'Tìm cạnh đống củi']]],
      found: LINES.c9found as [string, string], miss: LINES.c9miss as [string, string] },
    hang: { at: [sp.landmark.x, sp.landmark.z] },
    show: { line: LINES.c9show as [string, string], colors: ['#ff7a3a', '#ffd23f', '#e8433a', '#ffffff'] }
  };
  return createKit(G, ctx, KIT);
};
if (!CHAPTERS.some(c => c.id === 'ch9')) CHAPTERS.push(CHAPTER);
Object.assign(STORY_LINES, LINES);
STORY_TALES.lantern_ch9 = TALE;
