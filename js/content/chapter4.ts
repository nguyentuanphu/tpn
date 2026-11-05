// (v1.08b story, owner 3-4 Nov 2026 AEDT: docs/plans/v109-extras.md "The lantern story to Tết") Chapter 4 of the lantern
// story: the end-of-year festive season, Christmas to New Year's Eve, in both countries. Released with the Christmas
// decorations on 4 Dec 2026 through the release calendar (js/content/releasecal.ts, key chapter:ch4). The lantern blew to
// Sài Gòn, where the cathedral shines with Christmas stars; Chi is there with her grandma (summer Christmas in Sydney, a
// cool one in Hà Nội); a Christmas game; Bà Năm tells of Ông Táo going up to the sky at the year's end; the lantern hides
// among the Christmas stars; it is hung at Hồ Gươm for the New Year countdown, and the festival film shows Sydney's
// harbour fireworks (9 pm and midnight), the cathedrals, Hàng Mã's lights, the countdown at Hồ Gươm and each friend's
// wish. An under-5 skips the big steps, plays the little game and is led by the companion. Nothing spoken has a name.
import { CHAPTERS, STORY_LINES, STORY_TALES } from './chapters.js';
import { createKit, type KitDef } from './chapterkit.js';
import type { StoryChapter, StoryTale } from '../../types/story.js';

const CHI = { style: 'shirt', color: '#e8434a', hat: 'none', back: 'none', hair: '#3b2618', hairStyle: 'ponytail', skin: '#f0c8a0', glider: 0 };
const NAM = { style: 'aodai', color: '#8a4a8a', hat: 'none', back: 'none', hair: '#e8e8e8', hairStyle: 'buns', skin: '#e8b48c', glider: 0 };

export const CHAPTER: StoryChapter = { id: 'ch4', en: 'Christmas and New Year', vi: 'Giáng sinh và Năm mới', landmark: 'turtle', keepsake: 'lantern_ch4', reward: 45, trick: 'sparkle', steps: [
  { id: 'c4_fly', icon: '🏮', en: 'Fly to Sài Gòn with your friend', vi: 'Cùng bạn đồng hành bay đến Sài Gòn', at: 'saigon4', visit: 'saigon', lights: 3,
    act_en: 'Follow the 3 lantern lights to Sài Gòn', act_vi: 'Đi theo 3 đốm đèn lồng đến Sài Gòn',
    tale: ['🦉🏮', 'Ông Cú', 'Hoo hoo! It is nearly Christmas, and the last weeks of the year. One lantern flew south to Sài Gòn, where the big cathedral shines with stars. Follow the little lights!', 'Hu hu! Sắp đến Giáng sinh, những tuần cuối năm rồi. Một chiếc đèn lồng bay về Sài Gòn, nơi nhà thờ lớn lấp lánh sao. Con đi theo các đốm sáng nhé!'] },
  { id: 'c4_chi', icon: '👧', en: 'Meet Chi in Sài Gòn', vi: 'Gặp Chi ở Sài Gòn', at: 'chi4', big: true,
    talk: { who: 'Chi', label: ['Say hello', 'Chào bạn'], lines: [
      ['Merry Christmas, {name}! I came to Sài Gòn to see my grandma for the holidays.', 'Giáng sinh vui vẻ, {name}! Mình về Sài Gòn thăm bà ngoại dịp lễ.'],
      ['In Sydney, Christmas is in summer! We eat prawns and mangoes and swim at the beach. In Hà Nội it is cool, and people wear warm coats to see the lights.', 'Ở Sydney, Giáng sinh vào mùa hè! Nhà mình ăn tôm, ăn xoài rồi đi tắm biển. Ở Hà Nội trời se lạnh, mọi người mặc áo ấm đi xem đèn.'],
      ['I saw a red lantern among the Christmas stars by the cathedral. Let us get ready for the party first!', 'Mình thấy một chiếc đèn lồng đỏ giữa những ngôi sao Giáng sinh gần nhà thờ. Mình chuẩn bị cho bữa tiệc trước đã nhé!']],
      short: [['Merry Christmas! The lantern is among the Christmas stars by the cathedral. Let us get ready for the party first!', 'Giáng sinh vui vẻ! Đèn lồng ở giữa những ngôi sao Giáng sinh gần nhà thờ. Mình chuẩn bị cho bữa tiệc trước nhé!']] } },
  { id: 'c4_party', icon: '🎁', en: 'Play a party game for the holidays', vi: 'Chơi một trò chơi ngày lễ', at: 'party4', game: ['parcel', 'lanternart'], gameLittle: ['lanternart'],
    act_en: 'Play Pass the Parcel or decorate a lantern', act_vi: 'Chơi Chuyền Quà hoặc trang trí đèn lồng', actL_en: 'Decorate a lantern for the party', actL_vi: 'Trang trí đèn lồng cho bữa tiệc',
    tale: ['👧🎁', 'Chi', 'At Christmas parties in Australia we play Pass the Parcel. When the music stops, open one layer! Or make a pretty lantern for the party.', 'Ở các bữa tiệc Giáng sinh bên Úc, bọn mình chơi Chuyền Quà. Nhạc dừng thì mở một lớp giấy! Hoặc làm một chiếc đèn lồng thật đẹp cho bữa tiệc.'],
    taleLittle: ['✨🏮', 'Bà Năm', 'Let us make the party pretty! Decorate a lantern with lovely colours.', 'Mình làm bữa tiệc thật đẹp nhé! Con trang trí một chiếc đèn lồng thật nhiều màu.'] },
  { id: 'c4_tale', icon: '📖', en: 'Hear Bà Năm tell the story of Ông Táo', vi: 'Nghe Bà Năm kể chuyện Ông Táo', at: 'nam4', tale_id: 'ongtao',
    talk: { who: 'Bà Năm', label: ['Listen to the story', 'Nghe kể chuyện'], lines: [['Come and sit, {name}. At the end of the year, Ông Táo rides a carp up to the sky. Here is his story.', 'Lại đây ngồi nào, {name}. Cuối năm, Ông Táo cưỡi cá chép bay về trời. Bà kể con nghe chuyện ông nhé.']] },
    tale: ['🎁😄', 'Chi', 'What a party! Bà Năm is here too. She knows a story for the end of the year.', 'Bữa tiệc vui quá! Bà Năm cũng ở đây. Bà biết một câu chuyện cho những ngày cuối năm.'] },
  { id: 'c4_find', icon: '⭐', en: 'Find the lantern among the Christmas stars', vi: 'Tìm đèn lồng giữa những ngôi sao Giáng sinh', at: 'clues_ch4', find: true, clues: 3,
    act_en: 'Look by the tree, the stars and the presents', act_vi: 'Tìm ở cây thông, những ngôi sao và các hộp quà', actL_en: 'Follow your friend: it sparkles over the lantern', actL_vi: 'Đi theo bạn đồng hành: bạn ấy lấp lánh trên chỗ đèn lồng',
    tale: ['👵⭐', 'Bà Năm', 'Ông Táo tells the sky about every kind thing we did this year. Now look among the Christmas stars for our lantern!', 'Ông Táo kể với trời về mọi việc tốt mình làm trong năm. Giờ con tìm đèn lồng giữa những ngôi sao Giáng sinh nhé!'],
    taleLittle: ['✨🏮', 'Bà Năm', 'Your friend has learned to sparkle! Follow the sparkles to the lantern.', 'Bạn đồng hành của con biết lấp lánh rồi! Con đi theo ánh lấp lánh đến chỗ đèn lồng nhé.'] },
  { id: 'c4_hang', icon: '🐢', en: 'Hang the lantern at Hồ Gươm for the New Year countdown', vi: 'Treo đèn lồng ở Hồ Gươm đón giao thừa', at: 'hang_ch4', hang: true,
    tale: ['🏮🎆', '{companion}', 'Hồ Gươm is ready for the countdown to the New Year! Let us hang the lantern by the lake and light it up!', 'Hồ Gươm đã sẵn sàng đếm ngược đón Năm mới! Mình treo đèn lồng bên hồ cho sáng lên nhé!'] }
] };

export const LINES = {
  c4found: ['There it is! The lantern was hiding under the Christmas tree.', 'Đây rồi! Đèn lồng trốn dưới cây thông Noel.'],
  c4miss: ['Just a shiny Christmas star! Look somewhere else.', 'Chỉ là một ngôi sao Giáng sinh lấp lánh thôi! Con tìm chỗ khác nhé.'],
  c4show: ['Ten, nine, eight... Happy New Year! Look at the fireworks!', 'Mười, chín, tám... Chúc mừng năm mới! Nhìn pháo hoa kìa!'],
  trick_sparkle: ['I learned a new trick: I can sparkle like a Christmas star!', 'Mình học được trò mới: mình lấp lánh như ngôi sao Giáng sinh!']
};
export const TALE: StoryTale = { id: 'lantern_ch4', flag: '🏮', title: ['Christmas and New Year', 'Giáng sinh và Năm mới'], pages: [
  ['🎄☀️', 'In Sydney it was a summer Christmas. Families ate prawns and mangoes on the beach, and Santa came in shorts on a surfboard!', 'Ở Sydney, Giáng sinh vào mùa hè. Các gia đình ăn tôm, ăn xoài trên bãi biển, và ông già Noel mặc quần soóc lướt ván tới!'],
  ['⛪⭐', 'In Sài Gòn and Hà Nội the big cathedrals shone with stars, and on Hàng Mã street every shop glowed with lanterns and paper toys.', 'Ở Sài Gòn và Hà Nội, các nhà thờ lớn lấp lánh sao, và trên phố Hàng Mã cửa hàng nào cũng sáng rực đèn lồng và đồ chơi giấy.'],
  ['🎆🌉', 'On New Year\'s Eve, fireworks burst over Sydney Harbour at nine o\'clock for the little ones, and again at midnight!', 'Đêm giao thừa dương lịch, pháo hoa nở rộ trên cảng Sydney lúc chín giờ cho các bạn nhỏ, rồi thêm lần nữa lúc nửa đêm!'],
  ['🐢🏮', 'At Hồ Gươm everyone counted down together: ten, nine, eight... and the lantern by the lake shone bright for the New Year.', 'Ở Hồ Gươm mọi người cùng đếm ngược: mười, chín, tám... và chiếc đèn lồng bên hồ sáng rực đón Năm mới.'],
  ['👧🧒✨', 'Then each friend made a wish. Chi wished for her two homes to be together. Tèo wished to be kind. Jack and Ruby wished for lots of friends. What is your wish?', 'Rồi mỗi bạn ước một điều. Chi ước hai quê nhà luôn bên nhau. Tèo ước mình thật tốt bụng. Jack và Ruby ước có thật nhiều bạn. Còn con ước gì?']
] };
export const KIT: KitDef = {
  id: 'ch4',
  people: [{ id: 'chi4', name: 'Chi', look: CHI, at: { city: 'saigon' }, small: true }, { id: 'nam4', name: 'Bà Năm', look: NAM, at: { landmark: 'benthanh' } }],
  spots: { saigon4: { gate: 'saigon' }, party4: { city: 'saigon', dx: 6, dz: 4 } },
  find: { step: 'c4_find', around: { landmark: 'benthanh' }, clues: [['tree', '🎄', ['Look under the tree', 'Tìm dưới cây thông']], ['star', '⭐', ['Look at the star', 'Tìm ở ngôi sao']], ['gift', '🎁', ['Look by the presents', 'Tìm cạnh hộp quà']]],
    found: LINES.c4found as [string, string], miss: LINES.c4miss as [string, string] },
  hang: { landmark: 'turtle' },
  show: { line: LINES.c4show as [string, string], colors: ['#ff5fa2', '#ffd23f', '#5fb6ff', '#5fd36a', '#ffffff'] }
};

if (!CHAPTERS.some(c => c.id === 'ch4')) { const k = CHAPTERS.findIndex(c => c.id === 'ch5' || c.id === 'finale'); CHAPTERS.splice(k < 0 ? CHAPTERS.length : k, 0, CHAPTER); }
Object.assign(STORY_LINES, LINES);
STORY_TALES.lantern_ch4 = TALE;
export const create = (G, ctx) => createKit(G, ctx, KIT);
