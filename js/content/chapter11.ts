// (v1.08d s2au, owner 3 and 5 Nov 2026 AEDT) Chapter 11 of the lantern story: Tasmania (Season 2, Australia; release
// calendar key chapter:ch11, after chapter 10). The lantern sailed south on the Southern Coast Boat to Tasmania, the
// island at the bottom of Australia. Ollie the bushwalker tells about the island; the child plays Spot the Devil in the
// night bush (an under-5 takes the wombat home); the lantern waits in the forest, and is hung below Cradle Mountain as
// the first snow falls. Built by the shared kit (js/content/chapterkit.ts). An under-5 skips the talk, plays the little
// game and is led by the companion. Nothing spoken has a name.
import { CHAPTERS, STORY_LINES, STORY_TALES } from './chapters.js';
import { createKit, type KitDef } from './chapterkit.js';
import type { StoryChapter, StoryTale } from '../../types/story.js';

const RUBY = { style: 'overalls', color: '#a66bff', hat: 'bow', back: 'none', hair: '#a8432a', hairStyle: 'long', skin: '#ffe3d1', glider: 0 };

export const CHAPTER: StoryChapter = { id: 'ch11', en: 'Tasmania', vi: 'Đảo Tasmania', landmark: 'cradle', keepsake: 'lantern_ch11', reward: 50, trick: 'snow', steps: [
  { id: 'c11_fly', icon: '🏮', en: 'Go to Tasmania with your friend', vi: 'Cùng bạn đồng hành đến đảo Tasmania', at: 'tas11', lights: 3,
    act_en: 'Follow the 3 lantern lights to Tasmania', act_vi: 'Đi theo 3 đốm đèn lồng đến đảo Tasmania',
    tale: ['🦉🏮', 'Ông Cú', 'Hoo hoo! The reef lantern rode the coast boat south, across the sea to Tasmania, the island at the bottom of Australia. Follow the lights!', 'Hu hu! Chiếc đèn lồng ở rạn san hô đã đi thuyền ven biển xuống phía nam, vượt biển đến đảo Tasmania ở tận cùng nước Úc. Con đi theo các đốm sáng nhé!'] },
  { id: 'c11_ollie', icon: '🌲', en: 'Ask Ollie the bushwalker about Tasmania', vi: 'Hỏi anh Ollie về đảo Tasmania', at: 'ollie11', big: true,
    talk: { who: 'Ollie', label: ['Ask about Tasmania', 'Hỏi về đảo Tasmania'], lines: [
      ['G’day, {name}! Tasmania has wild forests, snowy mountains and animals you will not find anywhere else, like the Tasmanian devil.', 'Chào con, {name}! Đảo Tasmania có rừng hoang, núi tuyết và những con vật không đâu có, như quỷ Tasmania.'],
      ['Last night something glowing went past my tent. The devils saw it too. Let us look for them in the night bush!', 'Đêm qua có một thứ phát sáng đi ngang lều của anh. Mấy bạn quỷ Tasmania cũng thấy đó. Mình đi tìm các bạn ấy trong rừng đêm nhé!']],
      short: [['Something glowing went past my tent last night! Let us ask the bush animals.', 'Đêm qua có thứ phát sáng đi ngang lều của anh! Mình hỏi các con vật trong rừng nhé.']] } },
  { id: 'c11_devil', icon: '🌙', en: 'Look for the animals in the night bush', vi: 'Tìm các con vật trong rừng đêm', at: 'devil11', game: ['s2a_devil'], gameLittle: ['s2a_wombat'],
    act_en: 'Play Spot the Devil', act_vi: 'Chơi Tìm Quỷ Tasmania', actL_en: 'Take the wombat home', actL_vi: 'Đưa bạn gấu túi về hang',
    tale: ['🌲🏮', 'Ollie', 'The devils say the lantern rolled into the forest, under the tall trees by the mountain.', 'Các bạn quỷ Tasmania nói đèn lồng lăn vào rừng, dưới những cây cao cạnh núi.'],
    taleLittle: ['🌲✨', 'Ollie', 'The wombat is home! It saw the lantern in the forest on its way.', 'Bạn gấu túi về hang rồi! Trên đường đi bạn ấy thấy đèn lồng trong rừng đó.'] },
  { id: 'c11_find', icon: '🌲', en: 'Find the lantern in the forest', vi: 'Tìm đèn lồng trong rừng', at: 'clues_ch11', find: true, clues: 3,
    act_en: 'Look by the tall trees and the rock', act_vi: 'Tìm cạnh những cây cao và tảng đá', actL_en: 'Follow your friend: it glows over the lantern', actL_vi: 'Đi theo bạn đồng hành: bạn ấy phát sáng trên chỗ đèn lồng',
    tale: ['🌲🏮', 'Ollie', 'Walk softly in the forest. Look by the trees!', 'Đi nhẹ nhàng trong rừng nhé. Tìm cạnh những cái cây!'],
    taleLittle: ['✨🏮', 'Ollie', 'Your friend can glow through the trees! Follow it to the lantern.', 'Bạn đồng hành của con phát sáng xuyên qua rừng được! Con đi theo bạn ấy đến chỗ đèn lồng nhé.'] },
  { id: 'c11_hang', icon: '⛰️', en: 'Hang the lantern below Cradle Mountain', vi: 'Treo đèn lồng dưới chân núi Cradle', at: 'hang_ch11', hang: true,
    tale: ['🏮⛰️', '{companion}', 'The first snow is falling on Cradle Mountain. Let us hang the lantern so the whole island can see it!', 'Tuyết đầu mùa đang rơi trên núi Cradle. Mình treo đèn lồng lên để cả đảo cùng thấy nhé!'] }
] };
export const LINES = {
  c11found: ['There it is! The lantern was resting under the tall gum tree.', 'Đây rồi! Đèn lồng đang nghỉ dưới cây bạch đàn cao.'],
  c11miss: ['Just a sleepy possum! Look somewhere else.', 'Chỉ là một bạn thú có túi đang ngủ thôi! Con tìm chỗ khác nhé.'],
  c11show: ['Look! Snowflakes are dancing round the lantern.', 'Nhìn kìa! Bông tuyết đang nhảy múa quanh đèn lồng.'],
  trick_snow: ['I learned a new trick: I can sparkle like falling snow!', 'Mình học được trò mới: mình lấp lánh như tuyết rơi!']
};
export const TALE: StoryTale = { id: 'lantern_ch11', flag: '🏮', title: ['The Island Lantern', 'Đèn lồng trên đảo'], pages: [
  ['⛴️🏮', 'The lantern rode the coast boat south, across the sea, to the island of Tasmania.', 'Đèn lồng đi thuyền ven biển xuống phía nam, vượt biển đến đảo Tasmania.'],
  ['🌲🌙', 'In the night bush, the Tasmanian devils screeched and the wombats came out to eat the grass.', 'Trong rừng đêm, quỷ Tasmania kêu ré lên còn gấu túi mũi trần ra ăn cỏ.'],
  ['🌲🏮', 'Under a tall gum tree, the lantern was waiting.', 'Dưới một cây bạch đàn cao, đèn lồng đang nằm chờ.'],
  ['⛰️🏮', 'Below Cradle Mountain the first snow fell, and the lantern glowed warm and bright. Next, the lantern wants to see Perth!', 'Dưới chân núi Cradle tuyết đầu mùa rơi, và đèn lồng tỏa sáng ấm áp. Tiếp theo, đèn lồng muốn đi thăm Perth!']
] };
export const KIT: KitDef = {
  id: 'ch11',
  people: [{ id: 'ruby11', name: 'Ruby', look: RUBY, at: { site: 'tasmania', dx: 2, dz: 0 }, small: true }],
  spots: { tas11: { site: 'tasmania', dx: 6, dz: -6 }, ollie11: { site: 'tasmania', dx: 8, dz: -0.4 }, devil11: { site: 'tasmania', dx: 4, dz: -4.6 } },
  find: { step: 'c11_find', around: { site: 'tasmania' }, clues: [['gum', '🌲', ['Look by the tall gum tree', 'Tìm cạnh cây bạch đàn cao']], ['tree', '🌲', ['Look by the pine tree', 'Tìm cạnh cây thông']], ['rock', '🪨', ['Look by the rock', 'Tìm cạnh tảng đá']]],
    found: LINES.c11found as [string, string], miss: LINES.c11miss as [string, string] },
  hang: { site: 'tasmania', dx: -8, dz: 2 },
  show: { line: LINES.c11show as [string, string], colors: ['#ffffff', '#dff4ff', '#bfe4f2', '#ffd23f'] }
};
if (!CHAPTERS.some(c => c.id === 'ch11')) { const k = CHAPTERS.findIndex(c => c.id === 'ch10'); CHAPTERS.splice(k < 0 ? CHAPTERS.length : k + 1, 0, CHAPTER); }
Object.assign(STORY_LINES, LINES);
STORY_TALES.lantern_ch11 = TALE;
export const create = (G, ctx) => createKit(G, ctx, KIT);
