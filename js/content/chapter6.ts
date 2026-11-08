// (v1.08d s2vn, owner 3 and 5 Nov 2026 AEDT: docs/cores/tasks/v108d/s2vn-brief.md) Chapter 6 of the lantern story, the
// first of Season 2: the Mekong floating market, just after Tết (release calendar key chapter:ch6, with the region's
// day). After the Tết finale one lantern was missing: the wind took it south, down the Mekong's nine rivers, to the
// floating market, where the boats were still full of Tết flowers. Út Hoa, the new friend who paddles her family's
// boat, saw it; the child sells fruit from a sampan (an under-5 counts the fruit), hears the tale of the milk fruit tree
// from Bà Năm, finds the lantern among the boats and hangs it by the monkey bridge. Built on the story kit
// (js/content/chapterkit.ts) in the region's area (js/s2vn.ts). Nothing spoken has a name.
import { CHAPTERS, STORY_LINES, STORY_TALES } from './chapters.js';
import { createKit, type KitDef } from './chapterkit.js';
import { forStory } from '../s2vn.js';
import type { StoryChapter, StoryTale } from '../../types/story.js';

const NAM = { style: 'aodai', color: '#8a4a8a', hat: 'none', back: 'none', hair: '#e8e8e8', hairStyle: 'buns', skin: '#e8b48c', glider: 0, age: 'elder' };
const TEO = { style: 'shirt', color: '#5fd36a', hat: 'none', back: 'none', hair: '#2a1a10', hairStyle: 'spiky', skin: '#e8b48c', glider: 0 };

export const CHAPTER: StoryChapter = { id: 'ch6', en: 'The Mekong floating market', vi: 'Chợ nổi miền Tây', landmark: 's2l_caukhi', keepsake: 'lantern_ch6', reward: 50, trick: 'paddle', steps: [
  { id: 'c6_fly', icon: '🏮', en: 'Go to the floating market with your friend', vi: 'Cùng bạn đồng hành đến chợ nổi miền Tây', at: 'mekong6', visit: 's2_mekong', lights: 3,
    act_en: 'Follow the 3 lantern lights to the floating market', act_vi: 'Đi theo 3 đốm đèn lồng đến chợ nổi',
    tale: ['🦉🏮', 'Ông Cú', 'Hoo hoo! Tết is over, but one lantern is still missing. The wind blew it south, down the nine rivers of the Mekong, to the floating market. Follow the little lights!', 'Hu hu! Tết qua rồi mà vẫn còn thiếu một chiếc đèn lồng. Gió thổi nó về phương nam, theo chín nhánh sông Cửu Long, đến chợ nổi. Con đi theo các đốm sáng nhé!'] },
  { id: 'c6_hoa', icon: '🛶', en: 'Meet Út Hoa at the floating market', vi: 'Gặp Út Hoa ở chợ nổi', at: 'hoa6', big: true,
    talk: { who: 'Út Hoa', label: ['Talk to Út Hoa', 'Nói chuyện với Út Hoa'], lines: [
      ['Hello, {name}! I am Út Hoa. Every morning I paddle my family’s boat to the floating market.', 'Chào {name}! Mình là Út Hoa. Sáng nào mình cũng chèo xuồng của nhà ra chợ nổi.'],
      ['At Tết the boats carried yellow apricot flowers. I saw a red lantern floating between them! Help me sell our fruit, then we can look for it.', 'Ngày Tết ghe chở đầy mai vàng. Mình thấy một chiếc đèn lồng đỏ trôi giữa mấy chiếc ghe! Bạn giúp mình bán trái cây, rồi mình cùng đi tìm nha.']],
      short: [['A red lantern floated between the boats at Tết! Help me sell our fruit, then we can look for it.', 'Ngày Tết có chiếc đèn lồng đỏ trôi giữa mấy chiếc ghe! Bạn giúp mình bán trái cây, rồi mình cùng đi tìm nha.']] } },
  { id: 'c6_boat', icon: '🍍', en: 'Sell fruit from the sampan', vi: 'Chèo ghe bán trái cây', at: 'boat6', game: ['mk_sampan'], gameLittle: ['mk_count'],
    act_en: 'Play Sampan Fruit Seller', act_vi: 'Chơi Chèo Ghe Bán Trái Cây', actL_en: 'Count the fruit on the boat', actL_vi: 'Đếm trái cây trên ghe',
    tale: ['🛶😄', 'Út Hoa', 'The customers are coming in their boats! Hand them the fruit they want.', 'Khách chèo ghe tới rồi kìa! Bạn đưa đúng trái cây khách muốn nha.'],
    taleLittle: ['🍍✨', 'Út Hoa', 'Our boat is full of fruit! Let us find the fruit together.', 'Ghe nhà mình đầy trái cây! Mình cùng tìm trái cây nha.'] },
  { id: 'c6_tale', icon: '📖', en: 'Hear the story of the milk fruit tree', vi: 'Nghe Sự tích cây vú sữa', at: 'nam6', tale_id: 'vusua',
    talk: { who: 'Bà Năm', label: ['Listen to the story', 'Nghe kể chuyện'], lines: [['Come and sit, {name}. The milk fruit grows here in the south. Its story is about a boy who missed his mother.', 'Lại đây ngồi nào, {name}. Cây vú sữa mọc nhiều ở miền Nam mình. Chuyện kể về một cậu bé nhớ mẹ.']] },
    tale: ['🛶🏮', 'Út Hoa', 'We sold all our fruit! The lantern must be hiding near the boats. Let us look.', 'Mình bán hết trái cây rồi! Chắc đèn lồng trốn gần mấy chiếc ghe. Mình đi tìm nha.'] },
  { id: 'c6_find', icon: '🛶', en: 'Find the lantern at the floating market', vi: 'Tìm đèn lồng ở chợ nổi', at: 'clues_ch6', find: true, clues: 3,
    act_en: 'Look by the boats and the trees', act_vi: 'Tìm cạnh mấy chiếc ghe và hàng cây', actL_en: 'Follow your friend: it glows over the lantern', actL_vi: 'Đi theo bạn đồng hành: bạn ấy phát sáng trên chỗ đèn lồng',
    tale: ['👵🌳', 'Bà Năm', 'Like the milk fruit tree waiting for the boy, our lantern is waiting for you. Look by the boats!', 'Như cây vú sữa đợi cậu bé, đèn lồng cũng đang đợi con. Con tìm cạnh mấy chiếc ghe nhé!'],
    taleLittle: ['✨🛶', 'Bà Năm', 'Your friend can paddle through the air now! Follow it to the lantern.', 'Bạn đồng hành của con biết chèo trên không rồi! Con đi theo bạn ấy đến chỗ đèn lồng nhé.'] },
  { id: 'c6_hang', icon: '🌉', en: 'Hang the lantern by the monkey bridge', vi: 'Treo đèn lồng bên cầu khỉ', at: 'hang_ch6', hang: true,
    tale: ['🏮🌉', '{companion}', 'The sun is setting on the river. Let us hang the lantern by the monkey bridge for all the boats to see!', 'Mặt trời lặn trên sông rồi. Mình treo đèn lồng bên cầu khỉ cho ghe xuồng cùng ngắm nhé!'] }
] };
export const LINES = {
  c6found: ['There it is! The lantern was floating behind the boat.', 'Đây rồi! Đèn lồng đang trôi sau chiếc ghe.'],
  c6miss: ['Just a pile of coconuts! Look somewhere else.', 'Chỉ là một đống dừa thôi! Con tìm chỗ khác nhé.'],
  c6show: ['Look! The boats are lighting their lanterns on the river.', 'Nhìn kìa! Ghe xuồng thắp đèn lồng sáng cả dòng sông.'],
  trick_paddle: ['I learned a new trick: I can paddle through the air like a little boat!', 'Mình học được trò mới: mình chèo trên không như một chiếc xuồng nhỏ!']
};
export const TALE: StoryTale = { id: 'lantern_ch6', flag: '🏮', title: ['The Floating Market Lantern', 'Đèn Lồng Chợ Nổi'], pages: [
  ['🌊🛶', 'Far in the south, the great Mekong river splits into nine rivers before it meets the sea. People call it the Nine Dragons.', 'Ở tận phương nam, sông Mê Kông chia thành chín nhánh trước khi ra biển. Người ta gọi là sông Cửu Long.'],
  ['🛶🍍🥭', 'Every morning, boats meet on the river to sell fruit. Each boat hangs what it sells on a tall pole, so shoppers can see it from far away.', 'Sáng nào ghe xuồng cũng họp trên sông bán trái cây. Ghe bán gì thì treo cái đó lên cây sào cao, để người mua nhìn thấy từ xa.'],
  ['🌼🛶', 'At Tết the boats carry yellow apricot flowers, and the whole river looks like a garden.', 'Ngày Tết ghe chở đầy mai vàng, cả dòng sông như một khu vườn.'],
  ['🌉🌅🏮', 'At sunset the lantern shone beside the monkey bridge, and every boat lit a lantern too. The story goes on!', 'Lúc hoàng hôn, đèn lồng sáng bên cầu khỉ, và ghe nào cũng thắp đèn theo. Câu chuyện vẫn còn tiếp!']
] };
// the places come from the region's area (js/s2vn.ts): the bus stop or its sign, Út Hoa, the sampan game's stand
export const create = (G, ctx) => {
  const R = forStory(G, 'mekong'), sp = R.spots, st = R.stop || sp.landmark;
  const KIT: KitDef = {
    id: 'ch6',
    people: [{ id: 'nam6', name: 'Bà Năm', look: NAM, at: { at: [sp.landmark.x, sp.landmark.z], dx: -6, dz: -4 } }, { id: 'teo6', name: 'Tèo', look: TEO, at: { at: [sp.friend.x, sp.friend.z] }, small: true }],
    spots: { mekong6: { at: [st.x, st.z] }, hoa6: { at: [sp.friend.x, sp.friend.z] }, boat6: { at: [sp.mk_sampan.x, sp.mk_sampan.z] } },
    find: { step: 'c6_find', around: { at: [sp.landmark.x, sp.landmark.z] }, clues: [['boat', '🛶', ['Look behind the boat', 'Tìm sau chiếc ghe']], ['tree', '🌳', ['Look by the tree', 'Tìm cạnh hàng cây']], ['boat', '🥥', ['Look by the coconut boat', 'Tìm cạnh ghe dừa']]],
      found: LINES.c6found as [string, string], miss: LINES.c6miss as [string, string] },
    hang: { at: [sp.landmark.x, sp.landmark.z] },
    show: { line: LINES.c6show as [string, string], colors: ['#ffd23f', '#ff7a3a', '#e8433a', '#ffffff'] }
  };
  return createKit(G, ctx, KIT);
};
if (!CHAPTERS.some(c => c.id === 'ch6')) CHAPTERS.push(CHAPTER);
Object.assign(STORY_LINES, LINES);
STORY_TALES.lantern_ch6 = TALE;
