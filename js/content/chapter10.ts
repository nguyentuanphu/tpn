// (v1.08d s2au, owner 3 and 5 Nov 2026 AEDT) Chapter 10 of the lantern story: the Great Barrier Reef (Season 2,
// Australia; release calendar key chapter:ch10, after s2vn's chapter 9). A lantern floated out to sea after Tết and the
// current carried it north to the reef. Mia the reef ranger tells how the Traditional Owners care for the reef; the child
// snorkels (an under-5 helps the baby turtles to the sea); the lantern waits on the beach by the turtle nests, and is
// hung on the reef beach as the baby turtles hatch under the moon. Built by the shared kit (js/content/chapterkit.ts).
// An under-5 skips the talk, plays the little game and is led by the companion. Nothing spoken has a name.
import { CHAPTERS, STORY_LINES, STORY_TALES } from './chapters.js';
import { createKit, type KitDef } from './chapterkit.js';
import type { StoryChapter, StoryTale } from '../../types/story.js';

const JACK = { style: 'shirt', color: '#3b6fe0', hat: 'cap', back: 'none', hair: '#e8c26a', hairStyle: 'short', skin: '#ffe3d1', glider: 0 };

export const CHAPTER: StoryChapter = { id: 'ch10', en: 'The Great Barrier Reef', vi: 'Rạn san hô Great Barrier', landmark: 'gbreef', keepsake: 'lantern_ch10', reward: 50, trick: 'bubbles', steps: [
  { id: 'c10_fly', icon: '🏮', en: 'Go to the Great Barrier Reef with your friend', vi: 'Cùng bạn đồng hành đến rạn san hô Great Barrier', at: 'gbr10', lights: 3,
    act_en: 'Follow the 3 lantern lights to the reef', act_vi: 'Đi theo 3 đốm đèn lồng đến rạn san hô',
    tale: ['🦉🏮', 'Ông Cú', 'Hoo hoo! After Tết, one little lantern floated out to sea. The warm current carried it all the way to the Great Barrier Reef. Take the coast boat, or fly!', 'Hu hu! Sau Tết, một chiếc đèn lồng nhỏ trôi ra biển. Dòng hải lưu ấm đưa nó đến tận rạn san hô Great Barrier. Con đi thuyền ven biển hoặc bay đến nhé!'] },
  { id: 'c10_mia', icon: '🌊', en: 'Ask Mia the reef ranger about the reef', vi: 'Hỏi chị kiểm lâm Mia về rạn san hô', at: 'mia10', big: true,
    talk: { who: 'Mia', label: ['Ask about the reef', 'Hỏi về rạn san hô'], lines: [
      ['Welcome to the reef, {name}! It is so big that you can see it from space. Aboriginal and Torres Strait Islander peoples have cared for it for thousands of years.', 'Chào mừng con đến rạn san hô, {name}! Nó lớn đến mức nhìn thấy được từ ngoài không gian. Người Thổ dân và người dân đảo eo biển Torres đã chăm sóc nó hàng nghìn năm nay.'],
      ['A turtle saw your lantern drifting past the coral. Put on a mask and snorkel, and ask the reef animals where it went!', 'Một chú rùa đã thấy đèn lồng của con trôi qua rạn san hô. Con đeo kính lặn và ống thở vào, rồi hỏi các con vật trên rạn xem nó đi đâu nhé!']],
      short: [['The reef is so big you can see it from space! Put on a mask and look for your lantern.', 'Rạn san hô lớn đến mức nhìn thấy từ ngoài không gian! Con đeo kính lặn vào và tìm đèn lồng nhé.']] } },
  { id: 'c10_snorkel', icon: '🌊', en: 'Snorkel on the reef', vi: 'Lặn ngắm rạn san hô', at: 'snork10', game: ['s2a_snorkel'], gameLittle: ['s2a_turtle'],
    act_en: 'Play Snorkel Spotter at the reef', act_vi: 'Chơi Lặn Ngắm Tìm Bạn ở rạn san hô', actL_en: 'Help the baby turtles to the sea', actL_vi: 'Giúp rùa con ra biển',
    tale: ['🐢🌊', 'Mia', 'Look at all those animals! The clownfish says the lantern washed up on the beach, near the turtle nests.', 'Nhìn bao nhiêu là con vật kìa! Bạn cá hề nói đèn lồng đã trôi dạt vào bãi cát, gần tổ rùa.'],
    taleLittle: ['🐢✨', 'Mia', 'Baby turtles are hatching! Help them get to the sea, and they will show you the way.', 'Rùa con đang nở kìa! Con giúp các bạn ấy ra biển, rồi các bạn ấy chỉ đường cho con.'] },
  { id: 'c10_find', icon: '🐚', en: 'Find the lantern on the reef beach', vi: 'Tìm đèn lồng trên bãi biển', at: 'clues_ch10', find: true, clues: 3,
    act_en: 'Look by the little boat, the rock and the shells', act_vi: 'Tìm cạnh chiếc thuyền nhỏ, tảng đá và đống vỏ sò', actL_en: 'Follow your friend: it glows over the lantern', actL_vi: 'Đi theo bạn đồng hành: bạn ấy phát sáng trên chỗ đèn lồng',
    tale: ['🐢🏮', 'Mia', 'The turtles say it is by something on the sand. Look carefully, and walk softly near the nests!', 'Các bạn rùa nói nó ở cạnh một thứ gì đó trên cát. Con tìm kỹ nhé, và đi nhẹ nhàng gần tổ rùa!'],
    taleLittle: ['✨🏮', 'Mia', 'Your friend can blow bubbles like a fish now! Follow the bubbles to the lantern.', 'Bạn đồng hành của con biết thổi bong bóng như cá rồi! Con đi theo bong bóng đến chỗ đèn lồng nhé.'] },
  { id: 'c10_hang', icon: '🌙', en: 'Hang the lantern on the reef beach under the moon', vi: 'Treo đèn lồng trên bãi biển dưới ánh trăng', at: 'hang_ch10', hang: true,
    tale: ['🏮🌙', '{companion}', 'The moon is up and the baby turtles are hatching. Let us hang the lantern so they can see the sea!', 'Trăng lên rồi và rùa con đang nở. Mình treo đèn lồng lên để các bạn ấy nhìn thấy biển nhé!'] }
] };
export const LINES = {
  c10found: ['There it is! The lantern was resting by the little boat.', 'Đây rồi! Đèn lồng đang nghỉ cạnh chiếc thuyền nhỏ.'],
  c10miss: ['Just a little crab hiding in the sand! Look somewhere else.', 'Chỉ là một chú cua nhỏ trốn trong cát thôi! Con tìm chỗ khác nhé.'],
  c10show: ['Look! The baby turtles are swimming towards the moonlight.', 'Nhìn kìa! Rùa con đang bơi về phía ánh trăng.'],
  trick_bubbles: ['I learned a new trick: I can blow bubbles like a fish!', 'Mình học được trò mới: mình thổi bong bóng như cá!']
};
export const TALE: StoryTale = { id: 'lantern_ch10', flag: '🏮', title: ['The Reef Lantern', 'Đèn lồng rạn san hô'], pages: [
  ['🌊🏮', 'After Tết, a little lantern floated out to sea, and the warm current carried it north to the Great Barrier Reef.', 'Sau Tết, một chiếc đèn lồng nhỏ trôi ra biển, và dòng hải lưu ấm đưa nó lên phía bắc đến rạn san hô Great Barrier.'],
  ['🐢🐙', 'Under the water the reef was full of colours: coral, clownfish, turtles and an octopus waving all eight arms.', 'Dưới nước, rạn san hô đầy màu sắc: san hô, cá hề, rùa biển và một bạn bạch tuộc vẫy cả tám cái tay.'],
  ['🐚🏮', 'On the beach, by the turtle nests, the lantern was waiting in the sand.', 'Trên bãi cát, cạnh tổ rùa, đèn lồng đang nằm chờ.'],
  ['🌙🐢', 'The lantern shone over the beach, and the baby turtles hatched and swam out to sea in its light. Next, the lantern wants to see Tasmania!', 'Đèn lồng tỏa sáng trên bãi biển, và rùa con nở ra, bơi ra biển trong ánh sáng ấy. Tiếp theo, đèn lồng muốn đi thăm đảo Tasmania!']
] };
export const KIT: KitDef = {
  id: 'ch10',
  people: [{ id: 'jack10', name: 'Jack', look: JACK, at: { site: 'gbr', dx: 4, dz: 4 }, small: true }],
  spots: { gbr10: { site: 'gbr', dz: 2 }, mia10: { site: 'gbr', dx: -5, dz: 2.6 }, snork10: { site: 'gbr', dx: -9, dz: -2.4 } },
  find: { step: 'c10_find', around: { site: 'gbr' }, clues: [['boat', '⛴️', ['Look by the little boat', 'Tìm cạnh chiếc thuyền nhỏ']], ['rock', '🪨', ['Look by the rock', 'Tìm cạnh tảng đá']], ['rock', '🐚', ['Look by the shells', 'Tìm cạnh đống vỏ sò']]],
    found: LINES.c10found as [string, string], miss: LINES.c10miss as [string, string] },
  hang: { site: 'gbr', dz: 4 },
  show: { line: LINES.c10show as [string, string], colors: ['#5fe0d8', '#ffffff', '#ffd23f', '#7fd8f0'] }
};
// after s2vn's chapter 9 when it is there, else at the end
if (!CHAPTERS.some(c => c.id === 'ch10')) { const k = CHAPTERS.findIndex(c => c.id === 'ch9'); CHAPTERS.splice(k < 0 ? CHAPTERS.length : k + 1, 0, CHAPTER); }
Object.assign(STORY_LINES, LINES);
STORY_TALES.lantern_ch10 = TALE;
export const create = (G, ctx) => createKit(G, ctx, KIT);
