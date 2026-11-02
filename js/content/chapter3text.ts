// The words of the lantern story's chapter 3, Sydney (Play core, owner's go 10 Oct): what each step says, Chi's Aussie
// words, the lines said while the child does things, and the festival film's words. Loaded with chapter 3's places
// (js/content/chapter3sydney.js) once a child playing has found chapter 2's lantern, so the valley's start-up download
// stays small (PERF-001); importing it adds the words to the chapter's steps, STORY_LINES and STORY_TALES. Nothing here
// has a child's name in what is spoken ({name} is shown only).
import { CHAPTERS, STORY_LINES, STORY_TALES } from './chapters.js';

// each step's words: tale [art, who, en, vi] (told when it starts; taleLittle for an under-5), the goal shown while doing
// it (act_*, actL_* for an under-5), Jack and Ruby's challenge lines, the talks, and the lights' last line
export const STEP_WORDS = {
  c3_fly: { light: ['You found a lantern light!', 'Con tìm được một đốm đèn lồng!'], lightsAll: ['All the lights! They are showing us the way to Sydney.', 'Đủ hết đốm sáng rồi! Các đốm sáng đang chỉ đường cho mình đến Sydney.'],
    act_en: 'Follow the 3 lantern lights to Sydney', act_vi: 'Đi theo 3 đốm đèn lồng đến Sydney',
    tale: ['🦉🏮', 'Ông Cú', 'Hoo hoo! The wind carried one lantern all the way across the sea to Sydney, in Australia. A girl called Chi saw it fly past the harbour. Follow the little lights!', 'Hu hu! Gió mang một chiếc đèn lồng bay qua biển tận Sydney, nước Úc. Một bạn gái tên Chi đã thấy nó bay qua bến cảng. Con đi theo những đốm sáng nhỏ nhé!'] },
  c3_chi: { tale: ['👧🏮', 'Chi', 'Hello! Xin chào! I am Chi. My mum is from Vietnam and my dad is from Australia, so I have two homes. Come and say hello!', 'Xin chào! Hello! Mình là Chi. Mẹ mình người Việt, bố mình người Úc, nên mình có hai quê nhà. Lại đây chào mình nhé!'],
    talk: { lines: [
      ['Welcome to Sydney, {name}! I saw a red lantern float over the harbour, near the Opera House.', 'Chào mừng bạn đến Sydney, {name}! Mình thấy một chiếc đèn lồng đỏ bay qua bến cảng, gần Nhà hát Opera.'],
      ['People here talk a bit differently. Shall I teach you some Aussie words? I can say them in Vietnamese too!', 'Ở đây mọi người nói hơi khác một chút. Mình dạy bạn vài từ tiếng Úc nhé? Mình nói được cả tiếng Việt nữa!']],
      short: [['Welcome to Sydney! The lantern flew past the Opera House. Let me teach you some Aussie words first!', 'Chào mừng bạn đến Sydney! Đèn lồng bay qua Nhà hát Opera rồi. Mình dạy bạn vài từ tiếng Úc trước nhé!']] } },
  c3_words: { act_en: 'Match the Aussie words with Chi', act_vi: 'Ghép từ tiếng Úc cùng Chi', actL_en: 'Find the pictures with Chi', actL_vi: 'Tìm hình cùng Chi',
    tale: ['👧💬', 'Chi', 'In Australia people say G\'day for hello and arvo for afternoon! Tap me and let\'s learn some words.', 'Ở Úc người ta nói G\'day thay cho xin chào, và arvo nghĩa là buổi chiều! Chạm vào mình để cùng học từ nhé.'],
    taleLittle: ['👧👋', 'Chi', 'Hello! I am Chi. I have two homes, Vietnam and Australia. Let\'s play a word game!', 'Xin chào! Mình là Chi. Mình có hai quê nhà, Việt Nam và nước Úc. Mình cùng chơi trò chơi chữ nhé!'] },
  c3_ferry: { act_en: 'Play Captain Molly\'s ferry game', act_vi: 'Chơi trò đưa phà của thuyền trưởng Molly',
    tale: ['👧⛴️', 'Chi', 'Bonza! You know lots of Aussie words now. Captain Molly drives the ferries round the harbour. She needs a helper today!', 'Tuyệt vời! Giờ bạn biết nhiều từ tiếng Úc rồi. Thuyền trưởng Molly lái phà quanh bến cảng. Hôm nay cô cần người giúp đó!'] },
  c3_jack: { challenge: { big: ['G\'day! Bet you can\'t beat us at backyard cricket! Win a game and we will tell you where the lantern is.', 'Chào bạn! Cá là bạn không thắng nổi bọn mình môn cricket sân nhà! Thắng một ván thì bọn mình chỉ chỗ đèn lồng cho.'],
      little: ['G\'day! Let\'s play tug of war, all pulling together! Then we will tell you a secret.', 'Chào bạn! Mình cùng chơi kéo co nhé, cùng kéo thật mạnh! Rồi bọn mình kể bí mật cho.'] },
    act_en: 'Beat Jack and Ruby at cricket', act_vi: 'Thắng Jack và Ruby một ván cricket', actL_en: 'Play tug of war with Jack and Ruby', actL_vi: 'Chơi kéo co với Jack và Ruby',
    tale: ['⛴️😄', 'Captain Molly', 'Thanks, deckhand! Jack and Ruby are playing by the harbour. They are cheeky, but they might know about the lantern.', 'Cảm ơn thủy thủ nhỏ! Jack và Ruby đang chơi bên bến cảng. Hai bạn ấy hơi nghịch, nhưng có thể biết đèn lồng ở đâu đó.'],
    taleLittle: ['👧🏏', 'Chi', 'My friends Jack and Ruby are here. They are cheeky, but very kind. Let\'s play with them!', 'Các bạn của mình là Jack và Ruby đang ở đây. Hai bạn hơi nghịch, nhưng tốt bụng lắm. Mình chơi với các bạn ấy nhé!'] },
  c3_tale: { talk: { lines: [['Come and sit, {name}. Here is a funny Sydney story: The Magic Pudding, a pudding that never runs out!', 'Lại đây ngồi nào, {name}. Bà kể con nghe một chuyện vui ở Sydney: Chiếc bánh pudding thần kỳ, ăn mãi không hết!']] },
    tale: ['🏏😄', 'Jack', 'Good on ya, you won! Sorry we teased you, mate. Bà Năm is down by the harbour, telling stories. She saw where the lantern went!', 'Giỏi lắm, bạn thắng rồi! Xin lỗi vì trêu bạn nha. Bà Năm đang kể chuyện bên bến cảng. Bà thấy đèn lồng bay đi đâu đó!'] },
  c3_find: { act_en: 'Look by the harbour: where do the ferries wait?', act_vi: 'Tìm bên bến cảng: phà đậu ở đâu?',
    actL_en: 'Follow your friend, flying high in the sky', actL_vi: 'Đi theo bạn đồng hành đang bay thật cao',
    tale: ['👵⛴️', 'Bà Năm', 'Like the Magic Pudding, kindness never runs out. The lantern landed by the harbour, where the ferries wait. Go and look!', 'Như chiếc bánh pudding thần kỳ, lòng tốt không bao giờ hết. Đèn lồng đáp xuống bên bến cảng, chỗ phà đậu. Con đi tìm đi!'],
    taleLittle: ['✨☁️', 'Bà Năm', 'Your friend has learned a new trick: it can fly high up in the sky and spot things! Follow it to the lantern.', 'Bạn đồng hành của con vừa học trò mới: bay thật cao lên trời để nhìn xa! Con đi theo bạn ấy đến chỗ đèn lồng nhé.'] },
  c3_hang: { tale: ['🏮✨', '{companion}', 'We found it! The Opera House is sleeping in the mist. Let us hang the lantern and light up its sails!', 'Tìm thấy rồi! Nhà hát Opera đang ngủ trong sương. Mình treo đèn lồng lên để thắp sáng những cánh buồm nhé!'] }
};
// Chi's Aussie words: the word, what it means (English, Vietnamese) and its picture
export const WORDS = [
  { au: 'G\'day', en: 'hello', vi: 'xin chào', pic: '👋' },
  { au: 'Arvo', en: 'afternoon', vi: 'buổi chiều', pic: '🌇' },
  { au: 'Brekkie', en: 'breakfast', vi: 'bữa sáng', pic: '🍳' },
  { au: 'Roo', en: 'kangaroo', vi: 'chuột túi', pic: '🦘' }
];
export const LINES = {
  c3word: ['Tap the right one!', 'Chạm vào đúng hình nhé!'],
  c3right: ['Yes! You got it!', 'Đúng rồi! Giỏi quá!'],
  c3again: ['Nearly! Try another one.', 'Gần đúng rồi! Thử cái khác nhé.'],
  c3wordsDone: ['Bonza! That means great. You speak Aussie now!', 'Bonza! Nghĩa là tuyệt vời đó. Giờ bạn nói được tiếng Úc rồi!'],
  c3fish: ['Just a seagull looking for chips! Look somewhere else.', 'Chỉ là chú hải âu đi tìm khoai chiên thôi! Con tìm chỗ khác nhé.'],
  c3found: ['There it is! The lantern was waiting by the little ferry.', 'Đây rồi! Đèn lồng đang chờ bên chiếc phà nhỏ.'],
  trick_higher: ['I learned a new trick: I can fly high up in the sky!', 'Mình học được trò mới: mình bay được thật cao trên trời!'],
  c3fireworks: ['Look! Fireworks over the harbour!', 'Nhìn kìa! Pháo hoa trên bến cảng!'],
  c3secret: ['A koala in the gum tree! It only wakes up for very kind helpers. Here is a sticker for your book.', 'Một bạn koala trên cây bạch đàn! Koala chỉ thức dậy chào những bạn tốt bụng thôi. Tặng con một hình dán nhé.']
};
export const TALE = { id: 'lantern_ch3', flag: '🏮', title: ['The Lantern of Sydney', 'Đèn Lồng Sydney'], pages: [
  ['🎭🏮', 'Up went the lantern at the Opera House. The mist lifted, and the white sails glowed pink, blue and gold over the harbour.', 'Chiếc đèn lồng được treo lên Nhà hát Opera. Sương tan, những cánh buồm trắng sáng rực hồng, xanh và vàng trên bến cảng.'],
  ['🎆🌉', 'Then the sky went boom! Fireworks burst over the Harbour Bridge, and everyone cheered together: Vietnam and Australia, two homes, one big family.', 'Rồi bầu trời bùm bùm! Pháo hoa nở rộ trên Cầu Cảng, và mọi người cùng reo hò: Việt Nam và nước Úc, hai quê nhà, một đại gia đình.']] };

// the chapter's steps (in order after the chapter before, before the one after if that came first)
export const CHAPTER = { id: 'ch3', en: 'Sydney', vi: 'Sydney', landmark: 'opera', keepsake: 'lantern_ch3', reward: 40, trick: 'higher', steps: [
    { id: 'c3_fly', icon: '🏮', en: 'Fly to Sydney with your friend', vi: 'Cùng bạn đồng hành bay đến Sydney', at: 'sydney', visit: 'sydney', lights: 3 },
    { id: 'c3_chi', icon: '👧', en: 'Meet Chi in Sydney', vi: 'Gặp Chi ở Sydney', at: 'chi3', big: true, talk: { who: 'Chi', label: ['Say hello', 'Chào bạn'] } },
    { id: 'c3_words', icon: '💬', en: 'Learn Aussie words with Chi', vi: 'Học từ tiếng Úc cùng Chi', at: 'chi3', words: true },
    { id: 'c3_ferry', icon: '⛴️', en: 'Help Captain Molly with the ferries', vi: 'Giúp thuyền trưởng Molly đưa phà', at: 'molly', game: ['ferries'], big: true },
    { id: 'c3_jack', icon: '🏏', en: 'Play with Jack and Ruby', vi: 'Chơi với Jack và Ruby', at: 'jack3', game: ['cricket'], gameLittle: ['tug'], challenge: {} },
    { id: 'c3_tale', icon: '📖', en: 'Hear Bà Năm tell The Magic Pudding', vi: 'Nghe Bà Năm kể chuyện Chiếc bánh pudding thần kỳ', at: 'nam3', tale_id: 'magicpudding', talk: { who: 'Bà Năm', label: ['Listen to the story', 'Nghe kể chuyện'] } },
    { id: 'c3_find', icon: '🔭', en: 'Find the lantern by the harbour', vi: 'Tìm đèn lồng bên bến cảng', at: 'clues3', find: true, clues: 3 },
    { id: 'c3_hang', icon: '🎭', en: 'Hang the lantern at the Opera House', vi: 'Treo đèn lồng ở Nhà hát Opera', at: 'opera', hang: true }
  ] };
if (!CHAPTERS.some(c => c.id === 'ch3')) { const k = CHAPTERS.findIndex(c => c.id === 'ch4'); CHAPTERS.splice(k < 0 ? CHAPTERS.length : k, 0, CHAPTER); }
for (const s of (CHAPTERS.find(c => c.id === 'ch3') || { steps: [] }).steps) {
  const w = STEP_WORDS[s.id]; if (!w) continue;
  const { talk, ...rest } = w; Object.assign(s, rest);
  if (talk && s.talk) Object.assign(s.talk, talk);
}
Object.assign(STORY_LINES, LINES);
STORY_TALES.lantern_ch3 = TALE;
