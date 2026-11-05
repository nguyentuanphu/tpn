// (v1.08d s2vn, owner 3 and 5 Nov 2026 AEDT: docs/cores/tasks/v108d/s2vn-brief.md) Chapter 8 of the lantern story:
// Sapa in spring (release calendar key chapter:ch8, with the region's day). The spring wind lifted the next lantern up
// Sông Hồng to the mountains of Sapa, where the terraces are full of water and the peach trees are in flower. Mỷ, the
// new friend whose family grows rice on the terraces, saw it land among the rice; the child helps plant the terraces
// (an under-5 finishes a brocade pattern), hears the tale of the Ban flower of the north-west mountains from Bà Năm, finds
// the lantern by the terraces and hangs it there. Built on the story kit (js/content/chapterkit.ts) in the region's area
// (js/s2vn.ts). Nothing spoken has a name.
import { CHAPTERS, STORY_LINES, STORY_TALES } from './chapters.js';
import { createKit, type KitDef } from './chapterkit.js';
import { forStory } from '../s2vn.js';
import type { StoryChapter, StoryTale } from '../../types/story.js';

const NAM = { style: 'aodai', color: '#8a4a8a', hat: 'none', back: 'none', hair: '#e8e8e8', hairStyle: 'buns', skin: '#e8b48c', glider: 0, age: 'elder' };
const TEO = { style: 'shirt', color: '#5fd36a', hat: 'none', back: 'none', hair: '#2a1a10', hairStyle: 'spiky', skin: '#e8b48c', glider: 0 };

export const CHAPTER: StoryChapter = { id: 'ch8', en: 'Sapa in spring', vi: 'Sapa mùa xuân', landmark: 's2l_terraces', keepsake: 'lantern_ch8', reward: 50, trick: 'bloom', steps: [
  { id: 'c8_fly', icon: '🏮', en: 'Go to Sapa with your friend', vi: 'Cùng bạn đồng hành đến Sapa', at: 'sapa8', visit: 's2_sapa', lights: 3,
    act_en: 'Follow the 3 lantern lights to Sapa', act_vi: 'Đi theo 3 đốm đèn lồng đến Sapa',
    tale: ['🦉🏮', 'Ông Cú', 'Hoo hoo! The spring wind lifted another lantern up the Red River, all the way to the mountains of Sapa. Follow the little lights!', 'Hu hu! Gió xuân nâng một chiếc đèn lồng nữa ngược sông Hồng, lên tận vùng núi Sapa. Con đi theo các đốm sáng nhé!'] },
  { id: 'c8_my', icon: '🌾', en: 'Meet Mỷ by the rice terraces', vi: 'Gặp Mỷ bên ruộng bậc thang', at: 'my8', big: true,
    talk: { who: 'Mỷ', label: ['Talk to Mỷ', 'Nói chuyện với Mỷ'], lines: [
      ['Hello, {name}! I am Mỷ. It is spring, and my family is planting rice on the terraces.', 'Chào {name}! Mình là Mỷ. Mùa xuân rồi, nhà mình đang cấy lúa trên ruộng bậc thang.'],
      ['This morning a red lantern landed in our water fields! Help us plant the rice, then we can look for it.', 'Sáng nay có chiếc đèn lồng đỏ đáp xuống ruộng nước nhà mình! Bạn giúp nhà mình cấy lúa, rồi mình cùng đi tìm nha.']],
      short: [['A red lantern landed in our water fields! Help us plant the rice, then we can look for it.', 'Có chiếc đèn lồng đỏ đáp xuống ruộng nước nhà mình! Bạn giúp nhà mình cấy lúa, rồi mình cùng đi tìm nha.']] } },
  { id: 'c8_plant', icon: '🌱', en: 'Plant rice on the terraces', vi: 'Cấy lúa trên ruộng bậc thang', at: 'plant8', game: ['sp_terrace'], gameLittle: ['sp_brocade'],
    act_en: 'Play Plant the Rice Terraces', act_vi: 'Chơi Cấy Lúa Ruộng Bậc Thang', actL_en: 'Finish the brocade pattern', actL_vi: 'Hoàn thành hoa văn thổ cẩm',
    tale: ['🌾😄', 'Mỷ', 'Look at each terrace and plant the rice where it is needed!', 'Bạn nhìn từng thửa ruộng rồi cấy lúa chỗ còn thiếu nha!'],
    taleLittle: ['🧵✨', 'Mỷ', 'My grandma is stitching a bright pattern. Let us help her finish it!', 'Bà mình đang thêu hoa văn rực rỡ. Mình cùng giúp bà thêu xong nha!'] },
  { id: 'c8_tale', icon: '📖', en: 'Hear the story of the Ban flower', vi: 'Nghe Sự tích Hoa Ban', at: 'nam8', tale_id: 'hoaban',
    talk: { who: 'Bà Năm', label: ['Listen to the story', 'Nghe kể chuyện'], lines: [['Come and sit, {name}. In spring the white Ban flowers bloom all over the mountains. Here is their story.', 'Lại đây ngồi nào, {name}. Mùa xuân hoa ban trắng nở khắp núi rừng. Bà kể con nghe sự tích hoa ban nhé.']] },
    tale: ['🌾🏮', 'Mỷ', 'The rice is planted! The lantern must be near the terraces. Let us look.', 'Cấy lúa xong rồi! Chắc đèn lồng ở gần ruộng bậc thang. Mình đi tìm nha.'] },
  { id: 'c8_find', icon: '🌸', en: 'Find the lantern by the terraces', vi: 'Tìm đèn lồng bên ruộng bậc thang', at: 'clues_ch8', find: true, clues: 3,
    act_en: 'Look by the peach trees and the rocks', act_vi: 'Tìm cạnh những cây đào và tảng đá', actL_en: 'Follow your friend: it glows over the lantern', actL_vi: 'Đi theo bạn đồng hành: bạn ấy phát sáng trên chỗ đèn lồng',
    tale: ['👵🌸', 'Bà Năm', 'Like the Ban flower that waits for spring, our lantern is waiting for you. Look by the peach trees!', 'Như hoa ban đợi mùa xuân, đèn lồng cũng đang đợi con. Con tìm cạnh những cây đào nhé!'],
    taleLittle: ['✨🌸', 'Bà Năm', 'Your friend can make flowers bloom now! Follow it to the lantern.', 'Bạn đồng hành của con biết làm hoa nở rồi! Con đi theo bạn ấy đến chỗ đèn lồng nhé.'] },
  { id: 'c8_hang', icon: '🌄', en: 'Hang the lantern above the terraces', vi: 'Treo đèn lồng trên ruộng bậc thang', at: 'hang_ch8', hang: true,
    tale: ['🏮🌄', '{companion}', 'The mist is rising over the mountains. Let us hang the lantern so the whole valley below can see it!', 'Sương đang lên trên núi rồi. Mình treo đèn lồng lên cho cả thung lũng bên dưới cùng thấy nhé!'] }
] };
export const LINES = {
  c8found: ['There it is! The lantern was resting under the peach flowers.', 'Đây rồi! Đèn lồng đang nằm dưới hoa đào.'],
  c8miss: ['Just a little buffalo calf having a nap! Look somewhere else.', 'Chỉ là một chú nghé con đang ngủ trưa thôi! Con tìm chỗ khác nhé.'],
  c8show: ['Look! Lanterns are glowing all the way up the terraces.', 'Nhìn kìa! Đèn lồng sáng lung linh dọc ruộng bậc thang.'],
  trick_bloom: ['I learned a new trick: I can make flowers bloom!', 'Mình học được trò mới: mình làm hoa nở được!']
};
export const TALE: StoryTale = { id: 'lantern_ch8', flag: '🏮', title: ['The Spring Lantern of Sapa', 'Đèn Lồng Mùa Xuân Sapa'], pages: [
  ['🏔️🌾', 'High in the mountains of the north, rice fields climb the hills like giant stairs. These are the terraces of Sapa.', 'Trên vùng núi cao phía Bắc, ruộng lúa leo lên đồi như những bậc thang khổng lồ. Đó là ruộng bậc thang Sapa.'],
  ['🌸💧', 'In spring the peach flowers bloom, and the terraces fill with water that shines like mirrors.', 'Mùa xuân hoa đào nở, ruộng bậc thang đầy nước lấp lánh như gương.'],
  ['👧🧵', 'Grandmas stitch bright patterns on blue cloth, and children help plant the rice.', 'Các bà thêu hoa văn rực rỡ trên vải chàm, còn trẻ em giúp cấy lúa.'],
  ['🌄🏮', 'As the mist rose, the lantern shone above the terraces, and lights glowed all the way up the mountain. The story goes on!', 'Khi sương lên, đèn lồng sáng trên ruộng bậc thang, và ánh đèn lung linh khắp sườn núi. Câu chuyện vẫn còn tiếp!']
] };
export const create = (G, ctx) => {
  const R = forStory(G, 'sapa'), sp = R.spots, st = R.stop || sp.landmark;
  const KIT: KitDef = {
    id: 'ch8',
    people: [{ id: 'nam8', name: 'Bà Năm', look: NAM, at: { at: [sp.friend.x, sp.friend.z], dx: -5, dz: 3 } }, { id: 'teo8', name: 'Tèo', look: TEO, at: { at: [sp.sp_terrace.x, sp.sp_terrace.z] }, small: true }],
    spots: { sapa8: { at: [st.x, st.z] }, my8: { at: [sp.friend.x, sp.friend.z] }, plant8: { at: [sp.sp_terrace.x, sp.sp_terrace.z] } },
    find: { step: 'c8_find', around: { at: [sp.landmark.x, sp.landmark.z] }, clues: [['peach', '🌸', ['Look under the peach tree', 'Tìm dưới cây đào']], ['rock', '🪨', ['Look by the rock', 'Tìm cạnh tảng đá']], ['tree', '🌳', ['Look by the pine tree', 'Tìm cạnh cây thông']]],
      found: LINES.c8found as [string, string], miss: LINES.c8miss as [string, string] },
    hang: { at: [sp.landmark.x, sp.landmark.z] },
    show: { line: LINES.c8show as [string, string], colors: ['#ff9ec4', '#ffd23f', '#ffffff', '#7ac860'] }
  };
  return createKit(G, ctx, KIT);
};
if (!CHAPTERS.some(c => c.id === 'ch8')) CHAPTERS.push(CHAPTER);
Object.assign(STORY_LINES, LINES);
STORY_TALES.lantern_ch8 = TALE;
