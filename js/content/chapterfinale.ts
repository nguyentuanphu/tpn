// (v1.08b story, owner 3-4 Nov 2026 AEDT: docs/plans/v109-extras.md) The lantern story's finale at Tết (release calendar
// key chapter:finale, about 6 Feb 2027, the Lunar New Year): every lantern is home but one. Mây Cau Có, the grumpy cloud
// who blew them away, is sad and alone at New Year; the child plays with Tèo in Làng Sen, hears the story of Bánh Chưng
// Bánh Giầy, finds the last lantern among the peach and apricot blossoms, and hangs it on the banyan tree; the cloud says
// sorry and joins the Tết party, and the film shows the whole valley lit for the New Year. An under-5 skips the big steps,
// plays the little game and is led by the companion. Season 2 is not in this round. Nothing spoken has a name.
import { CHAPTERS, STORY_LINES, STORY_TALES } from './chapters.js';
import { createKit, type KitDef } from './chapterkit.js';
import type { StoryChapter, StoryTale } from '../../types/story.js';

const TEO = { style: 'shirt', color: '#5fd36a', hat: 'none', back: 'none', hair: '#2a1a10', hairStyle: 'spiky', skin: '#e8b48c', glider: 0 };
const NAM = { style: 'aodai', color: '#c0392b', hat: 'none', back: 'none', hair: '#e8e8e8', hairStyle: 'buns', skin: '#e8b48c', glider: 0 };

export const CHAPTER: StoryChapter = { id: 'finale', en: 'Every lantern home for Tết', vi: 'Mọi đèn lồng về nhà đón Tết', landmark: 'dinh', keepsake: 'lantern_finale', reward: 60, trick: 'dance', steps: [
  { id: 'cf_fly', icon: '🏮', en: 'Fly home to Lotus Village for Tết', vi: 'Bay về Làng Sen đón Tết', at: 'village_f', visit: 'village', lights: 3,
    act_en: 'Follow the 3 lantern lights home to Lotus Village', act_vi: 'Đi theo 3 đốm đèn lồng về Làng Sen',
    tale: ['🦉🌸', 'Ông Cú', 'Hoo hoo! Tết is coming, the Lunar New Year! Every lantern is home but one. Mây Cau Có is hiding it, and the poor cloud looks sad. Let us go home to Lotus Village!', 'Hu hu! Tết đến rồi! Đèn lồng nào cũng đã về nhà, chỉ còn một chiếc. Mây Cau Có đang giữ nó, và đám mây trông buồn lắm. Mình về Làng Sen thôi!'] },
  { id: 'cf_teo', icon: '🧒', en: 'Ask Tèo about the grumpy cloud', vi: 'Hỏi Tèo về Mây Cau Có', at: 'teo_f', big: true,
    talk: { who: 'Tèo', label: ['Ask Tèo', 'Hỏi Tèo'], lines: [
      ['Happy New Year, {name}! Chúc mừng năm mới! Mây Cau Có is all alone over the rice fields.', 'Chúc mừng năm mới, {name}! Mây Cau Có đang ở một mình trên cánh đồng lúa.'],
      ['Maybe the cloud blew the lanterns away because nobody asked it to play. At Tết, everybody should be together!', 'Có lẽ Mây thổi bay đèn lồng vì chẳng ai rủ nó chơi. Ngày Tết, ai cũng phải được ở bên nhau chứ!']],
      short: [['Happy New Year! The cloud is lonely. At Tết everybody should be together!', 'Chúc mừng năm mới! Mây buồn vì ở một mình. Ngày Tết ai cũng phải được ở bên nhau chứ!']] } },
  { id: 'cf_play', icon: '🪁', en: 'Fly a kite for the cloud', vi: 'Thả diều tặng Mây', at: 'kite_f', game: ['kite', 'oanquan'], gameLittle: ['kite'],
    act_en: 'Fly a kite up to the cloud, or play Ô ăn quan with Tèo', act_vi: 'Thả diều lên chỗ Mây, hoặc chơi Ô ăn quan với Tèo', actL_en: 'Fly a kite up to the cloud', actL_vi: 'Thả diều lên chỗ Mây',
    tale: ['🧒🪁', 'Tèo', 'Let us fly a kite up high, so the cloud has a friend to play with!', 'Mình thả diều thật cao, để Mây có bạn chơi cùng!'] },
  { id: 'cf_tale', icon: '📖', en: 'Hear Bà Năm tell the story of Bánh Chưng', vi: 'Nghe Bà Năm kể chuyện Bánh Chưng', at: 'nam_f', tale_id: 'banhchung',
    talk: { who: 'Bà Năm', label: ['Listen to the story', 'Nghe kể chuyện'], lines: [['Come and sit, {name}. Here is the story of the square cake and the round cake, made with love for Tết.', 'Lại đây ngồi nào, {name}. Bà kể con nghe chuyện bánh chưng bánh giầy, làm bằng cả tấm lòng cho ngày Tết.']] },
    tale: ['☁️😊', 'Tèo', 'Look, the cloud is smiling at our kite! Bà Năm is wrapping bánh chưng. Let us listen to her story.', 'Nhìn kìa, Mây đang cười với cánh diều! Bà Năm đang gói bánh chưng. Mình nghe bà kể chuyện nhé.'] },
  { id: 'cf_find', icon: '🌸', en: 'Find the last lantern among the blossoms', vi: 'Tìm chiếc đèn lồng cuối cùng giữa những cành hoa', at: 'clues_finale', find: true, clues: 3,
    act_en: 'Look by the peach blossom, the apricot blossom and the boat', act_vi: 'Tìm cạnh cành đào, cành mai và chiếc thuyền', actL_en: 'Follow your friend: it dances over the lantern', actL_vi: 'Đi theo bạn đồng hành: bạn ấy nhảy múa trên chỗ đèn lồng',
    tale: ['☁️🏮', 'Mây Cau Có', 'I am sorry I blew the lanterns away. I was lonely. I put the last one among the Tết flowers for you.', 'Mây xin lỗi vì đã thổi bay đèn lồng. Mây thấy cô đơn quá. Mây đặt chiếc cuối cùng giữa những cành hoa Tết cho con đó.'],
    taleLittle: ['✨🏮', 'Mây Cau Có', 'Sorry! The last lantern is with the Tết flowers. Your friend will show you!', 'Mây xin lỗi! Chiếc đèn cuối cùng ở chỗ hoa Tết. Bạn đồng hành sẽ chỉ cho con!'] },
  { id: 'cf_hang', icon: '🌳', en: 'Hang the last lantern for Tết', vi: 'Treo chiếc đèn lồng cuối cùng đón Tết', at: 'hang_finale', hang: true,
    tale: ['🏮🎆', '{companion}', 'Every lantern is home! Let us hang the last one and light up the whole valley for Tết!', 'Đèn lồng nào cũng đã về nhà! Mình treo chiếc cuối cùng và thắp sáng cả thung lũng đón Tết nhé!'] }
] };
export const LINES = {
  cffound: ['There it is! The last lantern, under the peach blossom.', 'Đây rồi! Chiếc đèn lồng cuối cùng, dưới cành hoa đào.'],
  cfmiss: ['Just yellow apricot flowers! Look somewhere else.', 'Chỉ là hoa mai vàng thôi! Con tìm chỗ khác nhé.'],
  cfshow: ['Chúc mừng năm mới! Happy New Year, everyone together!', 'Chúc mừng năm mới! Cả nhà mình cùng vui đón Tết!'],
  trick_dance: ['I learned a new trick: a New Year dance!', 'Mình học được trò mới: điệu nhảy mừng năm mới!']
};
export const TALE: StoryTale = { id: 'lantern_finale', flag: '🏮', title: ['Every Lantern Home', 'Mọi Đèn Lồng Về Nhà'], pages: [
  ['🌳🏮', 'Up went the last lantern on the old banyan tree. Now every magic lantern of Sparkle Valley glowed together, red and gold.', 'Chiếc đèn lồng cuối cùng được treo lên cây đa cổ. Giờ mọi đèn lồng thần kỳ của Thung Lũng Lấp Lánh cùng sáng rực, đỏ và vàng.'],
  ['☁️😊', 'Mây Cau Có floated down, not grumpy any more, and said sorry. Everyone said: come and celebrate Tết with us!', 'Mây Cau Có bay xuống, không còn khó tính nữa, và nói lời xin lỗi. Mọi người bảo: lại đây đón Tết cùng chúng mình!'],
  ['🌸🧧', 'There were peach and apricot blossoms, bánh chưng, and little red envelopes of lucky money for the children.', 'Có hoa đào, hoa mai, bánh chưng, và những phong bao lì xì đỏ cho các bạn nhỏ.'],
  ['🐉🎆', 'The lion dance drums went tùng tùng cheng, fireworks lit the sky, and the whole valley, from Hà Nội to Sydney, was one big family. Chúc mừng năm mới!', 'Trống múa lân vang tùng tùng cheng, pháo hoa thắp sáng bầu trời, và cả thung lũng, từ Hà Nội đến Sydney, là một đại gia đình. Chúc mừng năm mới!']
] };
export const KIT: KitDef = {
  id: 'finale',
  people: [{ id: 'teo_f', name: 'Tèo', look: TEO, at: { site: 'village', dx: 6, dz: -4 }, small: true }, { id: 'nam_f', name: 'Bà Năm', look: NAM, at: { site: 'village', dx: -6, dz: 6 } }],
  spots: { village_f: { site: 'village', dx: -30, dz: 0 }, kite_f: { site: 'paddies' } },
  find: { step: 'cf_find', around: { site: 'village', dx: 0, dz: 12 }, clues: [['peach', '🌸', ['Look under the peach blossom', 'Tìm dưới cành đào']], ['mai', '🌼', ['Look by the apricot blossom', 'Tìm cạnh cành mai']], ['boat', '⛵', ['Look by the boat', 'Tìm cạnh chiếc thuyền']]],
    found: LINES.cffound as [string, string], miss: LINES.cfmiss as [string, string] },
  hang: { site: 'village', dx: 4, dz: -10 },
  show: { line: LINES.cfshow as [string, string], colors: ['#e8434a', '#ffd23f', '#ff9ec4', '#ffffff'] }
};
if (!CHAPTERS.some(c => c.id === 'finale')) CHAPTERS.push(CHAPTER);
Object.assign(STORY_LINES, LINES);
STORY_TALES.lantern_finale = TALE;
export const create = (G, ctx) => createKit(G, ctx, KIT);
