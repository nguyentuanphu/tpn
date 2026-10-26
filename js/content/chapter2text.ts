import type { StoryChapter, StoryStep, StoryTalk, StoryPair, StoryTale } from '../../types/story.js';
// The words of the lantern story's chapter 2, Hà Nội (Play core, 10 Oct): what each step says, the lines said while
// the child does things, the numbers for counting and the festival film's words. Kept out of js/content/chapters.js
// (which holds the chapter's steps) so the valley's start-up download stays small (PERF-001): js/lanterns.js loads this
// with chapter 2's places once a child playing has found chapter 1's lantern, and importing it adds the words to the
// chapter's steps, STORY_LINES and STORY_TALES. Nothing here has a child's name in what is spoken ({name} is shown only).
import { CHAPTERS, STORY_LINES, STORY_TALES } from './chapters.js';

// each step's words: tale [art, who, en, vi] (told when it starts; taleLittle for an under-5), the goal shown while doing
// it (act_*, actL_* for an under-5), Tèo's challenge lines, and the talks
export const STEP_WORDS: Record<string, Partial<Omit<StoryStep, 'talk'>> & { talk?: Partial<StoryTalk> }> = {
  c2_fly: { tale: ['🦉🏮', 'Ông Cú', 'Hoo hoo! One lantern flew north, all the way to Hà Nội. Trung Thu, the Mid-Autumn festival, is coming, and Hà Nội needs its lantern back. Follow the little lights!', 'Hu hu! Một chiếc đèn lồng bay về phía bắc, tận Hà Nội. Sắp đến Trung Thu rồi, Hà Nội đang cần đèn lồng. Con đi theo những đốm sáng nhỏ nhé!'], act_en: 'Follow the 3 lantern lights to Hà Nội', act_vi: 'Đi theo 3 đốm đèn lồng đến Hà Nội' },
  c2_tam: { tale: ['👩‍🏫🏮', 'Cô Tam', 'You made it to Hà Nội! I am at Văn Miếu with my class. Come and say hello!', 'Con đến Hà Nội rồi! Cô đang ở Văn Miếu với lớp. Lại đây chào cô nhé!'], talk: { lines: [['Welcome to Hà Nội, {name}! I brought my class to see Văn Miếu, the oldest school in Vietnam.', 'Chào mừng con đến Hà Nội, {name}! Cô đưa lớp ra thăm Văn Miếu, ngôi trường xưa nhất Việt Nam.'], ['Last night a red lantern floated over Hồ Gươm, the lake with the red bridge.', 'Đêm qua có một chiếc đèn lồng đỏ bay lơ lửng trên Hồ Gươm, cái hồ có cây cầu đỏ.'], ['And look who came for the holidays: Tèo! He says he knows where it went.', 'Mà con xem ai ra đây chơi kìa: Tèo đó! Bạn ấy bảo biết đèn lồng bay đi đâu.']], short: [['Welcome to Hà Nội! A red lantern floated over Hồ Gươm. Tèo is here too, ask him!', 'Chào mừng con đến Hà Nội! Có đèn lồng đỏ bay trên Hồ Gươm. Tèo cũng ở đây, con hỏi bạn ấy nhé!']] } },
  c2_teo: { tale: ['🧒🪨', 'Tèo', 'Hey, it is me, Tèo! I came to Hà Nội for Trung Thu. I am the best player here. Bet you cannot beat me!', 'Ê, tớ Tèo đây! Tớ ra Hà Nội chơi Trung Thu. Ở đây tớ chơi giỏi nhất đó. Cá là bạn không thắng nổi tớ!'], taleLittle: ['🧒🏮', 'Tèo', 'Hello! I am Tèo. I came to Hà Nội for Trung Thu. Come and play with me!', 'Chào bạn! Tớ là Tèo. Tớ ra Hà Nội chơi Trung Thu. Lại đây chơi với tớ nào!'], act_en: 'Beat Tèo at Ô ăn quan', act_vi: 'Thắng Tèo một ván Ô ăn quan', actL_en: 'Play Oẳn tù tì with Tèo', actL_vi: 'Chơi Oẳn tù tì với Tèo', challenge: { big: ['I am the Ô ăn quan champion of Hà Nội! Beat me and I will tell you where the lantern went.', 'Tớ là vô địch Ô ăn quan của Hà Nội đó! Thắng tớ thì tớ chỉ chỗ đèn lồng cho.'], little: ['Oẳn tù tì! Rock, paper, scissors! Play with me and I will tell you a secret.', 'Oẳn tù tì, ra cái gì ra cái này! Chơi với tớ rồi tớ kể bí mật cho.'] } },
  c2_job: { tale: ['🧒😄', 'Tèo', 'Wow, you are really good! Sorry I showed off. Friends? Bà Lan at the bún chả stall needs help. Let us help her together!', 'Oa, bạn giỏi thật đó! Xin lỗi vì tớ khoe khoang nha. Mình làm bạn nhé? Bà Lan ở quán bún chả đang cần giúp, mình cùng giúp bà đi!'], act_en: 'Fan the grill and carry the bowls for Bà Lan', act_vi: 'Quạt bếp và bưng bát giúp Bà Lan' },
  c2_vanmieu: { tale: ['🍲😊', 'Bà Lan', 'Thank you, little helpers! Cô Tam is waiting at Văn Miếu. She has a lesson for you.', 'Cảm ơn các cháu giỏi giang! Cô Tam đang chờ ở Văn Miếu. Cô có một bài học cho các cháu đó.'], taleLittle: ['🧒😄', 'Tèo', 'You are good! Friends? Cô Tam is at Văn Miếu, the oldest school in Vietnam. Let us go!', 'Bạn giỏi quá! Mình làm bạn nhé? Cô Tam đang ở Văn Miếu, ngôi trường xưa nhất Việt Nam. Mình đi thôi!'], act_en: 'Count the stone turtles at Văn Miếu with Cô Tam', act_vi: 'Đếm rùa đá ở Văn Miếu cùng Cô Tam' },
  c2_tale: { tale: ['👩‍🏫🐢', 'Cô Tam', 'Well counted! Bà Năm came to Hà Nội for Trung Thu too. She is sitting by Hồ Gươm. Ask her for its story!', 'Đếm giỏi lắm! Bà Năm cũng ra Hà Nội đón Trung Thu. Bà đang ngồi bên Hồ Gươm. Con nhờ bà kể chuyện nhé!'], talk: { lines: [['Come and sit, {name}. Here is the story of the lake with the red bridge, Hồ Gươm.', 'Lại đây ngồi nào, {name}. Bà kể con nghe Sự tích Hồ Gươm, cái hồ có cây cầu đỏ.']] } },
  c2_find: { tale: ['👵🐢', 'Bà Năm', 'The golden turtle keeps lost things safe in Hồ Gươm. Look for the lantern where the old turtle rests, by the lake!', 'Rùa Vàng giữ gìn những thứ bị lạc ở Hồ Gươm. Con tìm đèn lồng ở chỗ chú rùa già nghỉ, bên bờ hồ nhé!'], taleLittle: ['✨🏮', 'Bà Năm', 'Your friend has learned a new trick: it can light the way! Follow its light to the lantern.', 'Bạn đồng hành của con vừa học được trò mới: soi đường! Con đi theo ánh sáng của bạn ấy đến chỗ đèn lồng nhé.'], act_en: 'Look by Hồ Gươm: where does the old turtle rest?', act_vi: 'Tìm bên Hồ Gươm: chú rùa già nghỉ ở đâu?', actL_en: 'Follow your friend\'s light to the lantern', actL_vi: 'Đi theo ánh sáng của bạn đồng hành đến đèn lồng' },
  c2_hang: { tale: ['🏮✨', '{companion}', 'We found it! Cầu Thê Húc is sleeping in the mist. Let us hang the lantern and wake it up for Trung Thu!', 'Tìm thấy rồi! Cầu Thê Húc đang ngủ trong sương. Mình treo đèn lồng lên để đánh thức cây cầu đón Trung Thu nhé!'] }
};
export const LINES: Record<string, StoryPair> = {
  light: ['You found a lantern light!', 'Con tìm được một đốm đèn lồng!'],
  lightsAll: ['All the lights! They are showing us the way to Hà Nội.', 'Đủ hết đốm sáng rồi! Các đốm sáng đang chỉ đường cho mình đến Hà Nội.'],
  fan: ['Hold the fan button to fan the grill!', 'Giữ nút quạt để quạt bếp than nhé!'],
  grilled: ['Smells good! Now carry the bowls to the tables.', 'Thơm quá! Giờ con bưng bát ra bàn nhé.'],
  bowl: ['One bowl on the table!', 'Một bát lên bàn rồi!'],
  jobDone: ['Thank you, little helpers! Everyone loves bún chả.', 'Cảm ơn các cháu! Ai cũng thích bún chả.'],
  lessonStart: ['These stone turtles have stood at Văn Miếu for hundreds of years. Tap each one and we will count them together!', 'Những chú rùa đá này đứng ở Văn Miếu hàng trăm năm rồi. Con chạm vào từng chú, mình cùng đếm nhé!'],
  countAsk: ['How many stone turtles did we count?', 'Mình đếm được bao nhiêu chú rùa đá?'],
  countAgain: ['Let us count them again, slowly.', 'Mình đếm lại thật chậm nhé.'],
  countLittle: ['Three stone turtles! Well done!', 'Ba chú rùa đá! Giỏi lắm!'],
  word: ['Five! Well done! Here is a word to learn: học means learn. At Văn Miếu, people came to học.', 'Năm! Giỏi lắm! Cô dạy con một chữ nhé: học. Ngày xưa mọi người đến Văn Miếu để học.'],
  fish: ['Just a little fish saying hello! Look somewhere else.', 'Chỉ là một chú cá nhỏ chào con thôi! Con tìm chỗ khác nhé.'],
  clueFound: ['There it is! The lantern was resting by the old stone turtle.', 'Đây rồi! Đèn lồng đang nghỉ bên chú rùa đá già.'],
  lead: ['Follow me! I will light the way.', 'Đi theo mình nào! Mình sẽ soi đường cho.'],
  trick: ['I learned a new trick: I can light the way!', 'Mình học được trò mới: mình biết soi đường rồi!'],
  parade: ['Look! The Trung Thu parade is going round the lake. Walk with them!', 'Nhìn kìa! Đoàn rước đèn Trung Thu đang đi quanh hồ. Con đi cùng các bạn nhé!'],
  secret: ['A golden turtle! It only comes up for very kind helpers. Here is a sticker for your book.', 'Rùa Vàng kìa! Rùa chỉ nổi lên chào những bạn tốt bụng thôi. Tặng con một hình dán nhé.']
};
// numbers for counting, said in both languages
export const COUNT: StoryPair[] = [['One!', 'Một!'], ['Two!', 'Hai!'], ['Three!', 'Ba!'], ['Four!', 'Bốn!'], ['Five!', 'Năm!']];
export const TALE: StoryTale = { id: 'lantern_ch2', flag: '🏮', title: ['The Lantern of Hà Nội', 'Đèn Lồng Hà Nội'], pages: [
    ['🌉🏮', 'Up went the lantern on Cầu Thê Húc. The mist lifted, and the red bridge glowed over Hồ Gươm like a ribbon of light.', 'Chiếc đèn lồng được treo lên Cầu Thê Húc. Sương tan, cây cầu đỏ rực sáng trên Hồ Gươm như một dải lụa ánh sáng.'],
    ['🌕⭐🦁', 'It was Trung Thu! Children carried star lanterns round the lake, the lion danced to the drums, and everyone shared mooncakes under the full moon.', 'Trung Thu đến rồi! Các bạn nhỏ rước đèn ông sao quanh hồ, múa lân theo tiếng trống, và mọi người cùng ăn bánh trung thu dưới trăng rằm.']] };

// the chapter's steps (in order after the chapter before, before the one after if that came first)
export const CHAPTER: StoryChapter = { id: 'ch2', en: 'Hà Nội', vi: 'Hà Nội', landmark: 'thehuc', keepsake: 'lantern_ch2', reward: 40, trick: 'light', steps: [
    { id: 'c2_fly', icon: '🏮', en: 'Fly to Hà Nội with your friend', vi: 'Cùng bạn đồng hành bay đến Hà Nội', at: 'hanoi', visit: 'hanoi', lights: 3 },
    { id: 'c2_tam', icon: '👩‍🏫', en: 'Say hello to Cô Tam at Văn Miếu', vi: 'Chào Cô Tam ở Văn Miếu', at: 'tam2', big: true, talk: { who: 'Cô Tam', label: ['Say hello', 'Chào cô'] } },
    { id: 'c2_teo', icon: '🧒', en: 'Take up Tèo\'s challenge', vi: 'Nhận lời thách đấu của Tèo', at: 'teo2', game: ['oanquan'], gameLittle: ['oantuti'], challenge: {} },
    { id: 'c2_job', icon: '🍲', en: 'Help Bà Lan at the bún chả stall', vi: 'Giúp Bà Lan ở quán bún chả', at: 'bunca', job: true, big: true },
    { id: 'c2_vanmieu', icon: '📚', en: 'Cô Tam\'s lesson at Văn Miếu', vi: 'Học cùng Cô Tam ở Văn Miếu', at: 'tam2', lesson: true },
    { id: 'c2_tale', icon: '📖', en: 'Hear Bà Năm tell the story of Hồ Gươm', vi: 'Nghe Bà Năm kể Sự tích Hồ Gươm', at: 'nam2', tale_id: 'hoguom', talk: { who: 'Bà Năm', label: ['Listen to the story', 'Nghe kể chuyện'] } },
    { id: 'c2_find', icon: '🐢', en: 'Find the lantern by Hồ Gươm', vi: 'Tìm đèn lồng bên Hồ Gươm', at: 'clues', find: true, clues: 3 },
    { id: 'c2_hang', icon: '🌉', en: 'Hang the lantern on Cầu Thê Húc', vi: 'Treo đèn lồng trên Cầu Thê Húc', at: 'bridge', hang: true }
  ] };
if (!CHAPTERS.some(c => c.id === 'ch2')) { const k = CHAPTERS.findIndex(c => c.id === 'ch3'); CHAPTERS.splice(k < 0 ? CHAPTERS.length : k, 0, CHAPTER); }
for (const s of (CHAPTERS.find(c => c.id === 'ch2') || { steps: [] }).steps) {
  const w = STEP_WORDS[s.id]; if (!w) continue;
  const { talk, ...rest } = w; Object.assign(s, rest);
  if (talk && s.talk) Object.assign(s.talk, talk);
}
Object.assign(STORY_LINES, LINES);
STORY_TALES.lantern_ch2 = TALE;
