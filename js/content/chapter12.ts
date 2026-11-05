// (v1.08d s2au, owner 3 and 5 Nov 2026 AEDT) Chapter 12 of the lantern story: Perth and Rottnest Island (Season 2,
// Australia; release calendar key chapter:ch12, after chapter 11). The lantern sailed west on the coast boat to Perth,
// where the sun sets over the sea. Ava tells about Perth and Rottnest (Wadjemup, its Noongar name); the child photographs
// the island's animals (an under-5 rows a boat on the Swan River); the lantern waits on the beach, and is hung by Perth's
// beach at sunset, facing Rottnest's lighthouse. Built by the shared kit (js/content/chapterkit.ts). An under-5 skips
// the talk, plays the little game and is led by the companion. Nothing spoken has a name.
import { CHAPTERS, STORY_LINES, STORY_TALES } from './chapters.js';
import { createKit, type KitDef } from './chapterkit.js';
import type { StoryChapter, StoryTale } from '../../types/story.js';

const CHI = { style: 'shirt', color: '#e8434a', hat: 'none', back: 'none', hair: '#3b2618', hairStyle: 'ponytail', skin: '#f0c8a0', glider: 0 };

export const CHAPTER: StoryChapter = { id: 'ch12', en: 'Perth and Rottnest Island', vi: 'Perth và đảo Rottnest', landmark: 'wadjemup', keepsake: 'lantern_ch12', reward: 50, trick: 'sunset', steps: [
  { id: 'c12_fly', icon: '🏮', en: 'Go to Perth with your friend', vi: 'Cùng bạn đồng hành đến Perth', at: 'perth12', lights: 3,
    act_en: 'Follow the 3 lantern lights to Perth', act_vi: 'Đi theo 3 đốm đèn lồng đến Perth',
    tale: ['🦉🏮', 'Ông Cú', 'Hoo hoo! The lantern sailed west on the coast boat, all the way to Perth, where the sun sets over the sea. Follow the lights!', 'Hu hu! Đèn lồng đi thuyền ven biển về phía tây, đến tận Perth, nơi mặt trời lặn xuống biển. Con đi theo các đốm sáng nhé!'] },
  { id: 'c12_ava', icon: '🏖️', en: 'Ask Ava about Perth and Rottnest Island', vi: 'Hỏi chị Ava về Perth và đảo Rottnest', at: 'ava12', big: true,
    talk: { who: 'Ava', label: ['Ask about Perth', 'Hỏi về Perth'], lines: [
      ['Hi, {name}! This is Perth. Out there is Rottnest Island. The Noongar people call it Wadjemup.', 'Chào con, {name}! Đây là Perth. Ngoài kia là đảo Rottnest. Người Noongar gọi đảo là Wadjemup.'],
      ['The quokkas on the island saw something glowing float past. Take my camera and ask them!', 'Mấy bạn quokka trên đảo thấy một thứ phát sáng trôi qua. Con cầm máy ảnh của chị và hỏi các bạn ấy nhé!']],
      short: [['The quokkas saw something glowing! Take my camera and find them.', 'Mấy bạn quokka thấy thứ phát sáng! Con cầm máy ảnh và tìm các bạn ấy nhé.']] } },
  { id: 'c12_photo', icon: '📷', en: 'Take photos of the island animals', vi: 'Chụp ảnh các con vật trên đảo', at: 'photo12', game: ['s2a_quokka'], gameLittle: ['s2a_swan'],
    act_en: 'Play Quokka Photo Hunt', act_vi: 'Chơi Chụp Ảnh Chuột Túi Quokka', actL_en: 'Row a boat on the Swan River', actL_vi: 'Chèo thuyền trên sông Swan',
    tale: ['📷🏮', 'Ava', 'Look at this photo! There is the lantern, washed up on Perth’s beach.', 'Nhìn tấm ảnh này nè! Đèn lồng kia kìa, trôi dạt vào bãi biển Perth.'],
    taleLittle: ['🦢✨', 'Ava', 'The black swans saw the lantern on the beach. Let us go and look!', 'Mấy chú thiên nga đen thấy đèn lồng trên bãi biển. Mình đi tìm nhé!'] },
  { id: 'c12_find', icon: '🏖️', en: 'Find the lantern on the beach', vi: 'Tìm đèn lồng trên bãi biển', at: 'clues_ch12', find: true, clues: 3,
    act_en: 'Look by the little boat and the rocks', act_vi: 'Tìm cạnh chiếc thuyền nhỏ và những tảng đá', actL_en: 'Follow your friend: it glows over the lantern', actL_vi: 'Đi theo bạn đồng hành: bạn ấy phát sáng trên chỗ đèn lồng',
    tale: ['🏖️🏮', 'Ava', 'It is somewhere on the sand. Look carefully!', 'Nó ở đâu đó trên cát. Con tìm kỹ nhé!'],
    taleLittle: ['✨🏮', 'Ava', 'Your friend can glow like the setting sun! Follow it to the lantern.', 'Bạn đồng hành của con phát sáng như mặt trời lặn! Con đi theo bạn ấy đến chỗ đèn lồng nhé.'] },
  { id: 'c12_hang', icon: '🌅', en: 'Hang the lantern on Perth’s beach at sunset', vi: 'Treo đèn lồng trên bãi biển Perth lúc hoàng hôn', at: 'hang_ch12', hang: true,
    tale: ['🏮🌅', '{companion}', 'The sun is setting over the sea and the lighthouse is shining. Let us hang the lantern!', 'Mặt trời đang lặn xuống biển và ngọn hải đăng đang tỏa sáng. Mình treo đèn lồng lên nhé!'] }
] };
export const LINES = {
  c12found: ['There it is! The lantern was resting by the little boat.', 'Đây rồi! Đèn lồng đang nghỉ cạnh chiếc thuyền nhỏ.'],
  c12miss: ['Just a seagull looking for chips! Look somewhere else.', 'Chỉ là một chú hải âu đang tìm khoai tây chiên thôi! Con tìm chỗ khác nhé.'],
  c12show: ['Look! The lighthouse and the lantern are shining together.', 'Nhìn kìa! Ngọn hải đăng và đèn lồng cùng tỏa sáng.'],
  trick_sunset: ['I learned a new trick: I can shine like the sunset over the sea!', 'Mình học được trò mới: mình tỏa sáng như hoàng hôn trên biển!']
};
export const TALE: StoryTale = { id: 'lantern_ch12', flag: '🏮', title: ['The Sunset Lantern', 'Đèn lồng hoàng hôn'], pages: [
  ['⛴️🏮', 'The lantern sailed west on the coast boat, to Perth on the far side of Australia.', 'Đèn lồng đi thuyền ven biển về phía tây, đến Perth ở bên kia nước Úc.'],
  ['📷🦘', 'On Rottnest Island the quokkas smiled for the camera, and black swans swam on the Swan River.', 'Trên đảo Rottnest, các bạn quokka cười trước máy ảnh, còn thiên nga đen bơi trên sông Swan.'],
  ['🏖️🏮', 'On the beach, by a little boat, the lantern was waiting.', 'Trên bãi biển, cạnh một chiếc thuyền nhỏ, đèn lồng đang nằm chờ.'],
  ['🌅🏮', 'The sun set over the sea, the lighthouse began to shine, and the lantern glowed beside it. What a journey round Australia!', 'Mặt trời lặn xuống biển, ngọn hải đăng bắt đầu tỏa sáng, và đèn lồng rực lên bên cạnh. Thật là một chuyến đi vòng quanh nước Úc!']
] };
export const KIT: KitDef = {
  id: 'ch12',
  people: [{ id: 'chi12', name: 'Chi', look: CHI, at: { site: 'perth', dx: 4, dz: 4 }, small: true }],
  spots: { perth12: { site: 'perth', dz: 2 }, ava12: { site: 'perth', dx: -5, dz: 2.6 }, photo12: { site: 'perth', dx: -9, dz: -2.4 } },
  find: { step: 'c12_find', around: { site: 'perth' }, clues: [['boat', '⛴️', ['Look by the little boat', 'Tìm cạnh chiếc thuyền nhỏ']], ['rock', '🪨', ['Look by the rock', 'Tìm cạnh tảng đá']], ['rock', '🐚', ['Look by the shells', 'Tìm cạnh đống vỏ sò']]],
    found: LINES.c12found as [string, string], miss: LINES.c12miss as [string, string] },
  hang: { site: 'perth', dz: 5 },
  show: { line: LINES.c12show as [string, string], colors: ['#ff8a5a', '#ffd23f', '#ff7eb8', '#ffffff'] }
};
if (!CHAPTERS.some(c => c.id === 'ch12')) { const k = CHAPTERS.findIndex(c => c.id === 'ch11'); CHAPTERS.splice(k < 0 ? CHAPTERS.length : k + 1, 0, CHAPTER); }
Object.assign(STORY_LINES, LINES);
STORY_TALES.lantern_ch12 = TALE;
export const create = (G, ctx) => createKit(G, ctx, KIT);
