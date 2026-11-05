// (v1.08d s2vn, owner 3 and 5 Nov 2026 AEDT: docs/cores/tasks/v108d/s2vn-brief.md) Chapter 7 of the lantern story:
// Hạ Long Bay (release calendar key chapter:ch7, with the region's day). From the floating market a sea breeze carried
// the next lantern north along the coast to Hạ Long, where the stone islands rise out of the sea. Hải, the new friend
// from the floating fishing village, saw it go into a cave; the child finds the hidden cave (an under-5 counts fish in
// the nets), hears the tale of the Dragon and the Fairy from Bà Năm (Hạ Long means where the dragon came down), finds
// the lantern by the shore and hangs it facing the Rooster and Hen rocks. Built on the story kit
// (js/content/chapterkit.ts) in the region's area (js/s2vn.ts). Nothing spoken has a name.
import { CHAPTERS, STORY_LINES, STORY_TALES } from './chapters.js';
import { createKit, type KitDef } from './chapterkit.js';
import { forStory } from '../s2vn.js';
import type { StoryChapter, StoryTale } from '../../types/story.js';

const NAM = { style: 'aodai', color: '#8a4a8a', hat: 'none', back: 'none', hair: '#e8e8e8', hairStyle: 'buns', skin: '#e8b48c', glider: 0, age: 'elder' };
const CHI = { style: 'shirt', color: '#e8434a', hat: 'none', back: 'none', hair: '#3b2618', hairStyle: 'ponytail', skin: '#f0c8a0', glider: 0 };

export const CHAPTER: StoryChapter = { id: 'ch7', en: 'Hạ Long Bay', vi: 'Vịnh Hạ Long', landmark: 's2l_trongmai', keepsake: 'lantern_ch7', reward: 50, trick: 'dive', steps: [
  { id: 'c7_fly', icon: '🏮', en: 'Go to Hạ Long Bay with your friend', vi: 'Cùng bạn đồng hành đến Vịnh Hạ Long', at: 'halong7', visit: 's2_halong', lights: 3,
    act_en: 'Follow the 3 lantern lights to Hạ Long Bay', act_vi: 'Đi theo 3 đốm đèn lồng đến Vịnh Hạ Long',
    tale: ['🦉🏮', 'Ông Cú', 'Hoo hoo! A sea breeze carried another lantern along the coast to Hạ Long Bay, where stone islands rise out of the sea. Follow the little lights!', 'Hu hu! Gió biển mang một chiếc đèn lồng nữa dọc bờ biển đến Vịnh Hạ Long, nơi những hòn đảo đá nhô lên giữa biển. Con đi theo các đốm sáng nhé!'] },
  { id: 'c7_hai', icon: '⛵', en: 'Meet Hải from the fishing village', vi: 'Gặp Hải ở làng chài', at: 'hai7', big: true,
    talk: { who: 'Hải', label: ['Talk to Hải', 'Nói chuyện với Hải'], lines: [
      ['Hi, {name}! I am Hải. My house floats on a raft in the fishing village.', 'Chào {name}! Mình là Hải. Nhà mình nổi trên bè ở làng chài.'],
      ['Yesterday I saw a red lantern blow into a cave in one of the islands. But which island? Help me find the hidden cave!', 'Hôm qua mình thấy một chiếc đèn lồng đỏ bay vào hang trong một hòn đảo. Mà đảo nào nhỉ? Bạn giúp mình tìm hang động bí ẩn nha!']],
      short: [['A red lantern blew into a cave in one of the islands! Help me find the hidden cave.', 'Có chiếc đèn lồng đỏ bay vào hang trong một hòn đảo! Bạn giúp mình tìm hang động bí ẩn nha.']] } },
  { id: 'c7_cave', icon: '🏝️', en: 'Find the hidden cave', vi: 'Tìm hang động bí ẩn', at: 'cave7', game: ['hl_cave'], gameLittle: ['hl_nets'],
    act_en: 'Play Find the Hidden Cave', act_vi: 'Chơi Tìm Hang Động Bí Ẩn', actL_en: 'Look at the fish in the nets', actL_vi: 'Xem cá trong lưới',
    tale: ['⛵😄', 'Hải', 'Listen to the clues and look at the islands carefully. One of them hides the cave!', 'Nghe gợi ý và nhìn các hòn đảo thật kỹ nha. Một hòn đang giấu hang động đó!'],
    taleLittle: ['🐟✨', 'Hải', 'The fishing boats are back with their nets! Let us look at the fish.', 'Thuyền đánh cá về rồi, đầy lưới luôn! Mình cùng xem cá nha.'] },
  { id: 'c7_tale', icon: '📖', en: 'Hear the story of the Dragon and the Fairy', vi: 'Nghe chuyện Con Rồng cháu Tiên', at: 'nam7', tale_id: 'rongtien',
    talk: { who: 'Bà Năm', label: ['Listen to the story', 'Nghe kể chuyện'], lines: [['Come and sit, {name}. Hạ Long means where the dragon came down. Here is the story of the dragon father and the fairy mother of Vietnam.', 'Lại đây ngồi nào, {name}. Hạ Long nghĩa là nơi rồng đáp xuống. Bà kể chuyện cha Rồng mẹ Tiên của người Việt mình nhé.']] },
    tale: ['⛵🏮', 'Hải', 'The lantern came out of the cave with the tide! It must be by the shore now. Let us look.', 'Nước triều đưa đèn lồng ra khỏi hang rồi! Chắc giờ nó ở gần bờ. Mình đi tìm nha.'] },
  { id: 'c7_find', icon: '🪨', en: 'Find the lantern on the shore of the bay', vi: 'Tìm đèn lồng trên bờ vịnh', at: 'clues_ch7', find: true, clues: 3,
    act_en: 'Look by the rocks and the boats', act_vi: 'Tìm cạnh những tảng đá và chiếc thuyền', actL_en: 'Follow your friend: it glows over the lantern', actL_vi: 'Đi theo bạn đồng hành: bạn ấy phát sáng trên chỗ đèn lồng',
    tale: ['👵🐉', 'Bà Năm', 'The dragon’s jewels became the islands, and our lantern is hiding among them. Look by the rocks!', 'Ngọc của rồng hóa thành các hòn đảo, và đèn lồng đang trốn giữa chúng. Con tìm cạnh những tảng đá nhé!'],
    taleLittle: ['✨🌊', 'Bà Năm', 'Your friend can dive like a fish now! Follow it to the lantern.', 'Bạn đồng hành của con biết lặn như cá rồi! Con đi theo bạn ấy đến chỗ đèn lồng nhé.'] },
  { id: 'c7_hang', icon: '🌅', en: 'Hang the lantern facing the Rooster and Hen rocks', vi: 'Treo đèn lồng nhìn ra Hòn Trống Mái', at: 'hang_ch7', hang: true,
    tale: ['🏮🌊', '{companion}', 'The sun is setting over the bay. Let us hang the lantern so the boats can see it from the sea!', 'Mặt trời lặn trên vịnh rồi. Mình treo đèn lồng lên cho thuyền ngoài biển cùng thấy nhé!'] }
] };
export const LINES = {
  c7found: ['There it is! The lantern was resting between the rocks.', 'Đây rồi! Đèn lồng đang nằm nghỉ giữa mấy tảng đá.'],
  c7miss: ['Just a little crab hiding from the waves! Look somewhere else.', 'Chỉ là một chú cua nhỏ trốn sóng thôi! Con tìm chỗ khác nhé.'],
  c7show: ['Look! The boats on the bay are lighting their lanterns.', 'Nhìn kìa! Thuyền trên vịnh đang thắp đèn lồng.'],
  trick_dive: ['I learned a new trick: I can dive like a fish!', 'Mình học được trò mới: mình lặn giỏi như cá!']
};
export const TALE: StoryTale = { id: 'lantern_ch7', flag: '🏮', title: ['The Lantern of Hạ Long Bay', 'Đèn Lồng Vịnh Hạ Long'], pages: [
  ['🏝️🌊', 'In the north of Vietnam almost two thousand stone islands rise out of the green sea. This is Hạ Long Bay.', 'Ở miền Bắc Việt Nam có gần hai nghìn hòn đảo đá nhô lên giữa biển xanh. Đó là Vịnh Hạ Long.'],
  ['🐉✨', 'Long ago, people say, a dragon came down to the sea and dropped jewels into it. The jewels became the islands.', 'Ngày xưa, người ta kể, có rồng bay xuống biển và nhả ngọc. Ngọc hóa thành các hòn đảo.'],
  ['⛵🏠', 'Families of fishermen live in houses that float on rafts, and the children go to school by boat.', 'Những gia đình làng chài sống trong nhà nổi trên bè, và trẻ em đi học bằng thuyền.'],
  ['🪨🌅🏮', 'At sunset the lantern shone on the shore, facing the Rooster and Hen rocks, and every boat lit its lantern too. The story goes on!', 'Lúc hoàng hôn, đèn lồng sáng trên bờ, nhìn ra Hòn Trống Mái, và thuyền nào cũng thắp đèn theo. Câu chuyện vẫn còn tiếp!']
] };
// the places come from the region's area (js/s2vn.ts): the bus stop, Hải, the hidden-cave game's stand
export const create = (G, ctx) => {
  const R = forStory(G, 'halong'), sp = R.spots, st = R.stop || sp.landmark;
  const KIT: KitDef = {
    id: 'ch7',
    people: [{ id: 'nam7', name: 'Bà Năm', look: NAM, at: { at: [sp.friend.x, sp.friend.z], dx: -5, dz: -3 } }, { id: 'chi7', name: 'Chi', look: CHI, at: { at: [sp.hl_cave.x, sp.hl_cave.z] }, small: true }],
    spots: { halong7: { at: [st.x, st.z] }, hai7: { at: [sp.friend.x, sp.friend.z] }, cave7: { at: [sp.hl_cave.x, sp.hl_cave.z] } },
    find: { step: 'c7_find', around: { at: [sp.landmark.x, sp.landmark.z] }, clues: [['rock', '🪨', ['Look between the rocks', 'Tìm giữa mấy tảng đá']], ['boat', '⛵', ['Look by the boat', 'Tìm cạnh chiếc thuyền']], ['rock', '🦀', ['Look by the crab’s rock', 'Tìm cạnh hòn đá của chú cua']]],
      found: LINES.c7found as [string, string], miss: LINES.c7miss as [string, string] },
    hang: { at: [sp.landmark.x, sp.landmark.z] },
    show: { line: LINES.c7show as [string, string], colors: ['#ffd23f', '#3cc7e8', '#e8433a', '#ffffff'] }
  };
  return createKit(G, ctx, KIT);
};
if (!CHAPTERS.some(c => c.id === 'ch7')) CHAPTERS.push(CHAPTER);
Object.assign(STORY_LINES, LINES);
STORY_TALES.lantern_ch7 = TALE;
