// (v1.08 vietnamese, owner's plan 3 Nov 2026 AEDT, docs/plans/v108-owner-batch-20261103.md part D) The words, verses,
// sayings, riddles and sentences of the ten new Tiếng Việt games (js/games/tiengviet2.ts). Every Vietnamese word here is
// said by the Vietnamese voice in either language (English mode teaches Vietnamese: the instructions and meanings are
// English, the words stay Vietnamese), and tools/make-voice-pack.mts records them from tiengviet2Lines(). None has a
// child's name in it. Pictures are the game's own drawings (js/art), by their emoji key.
// No imports here: the voice tool reads this file on its own.

/** the ten games, in the order they are listed */
export const VI2_IDS = ['vi_tonemean', 'vi_rhyme', 'vi_letters', 'vi_opposite', 'vi_cadao', 'vi_tucngu', 'vi_readalong', 'vi_sentence', 'vi_dictation', 'vi_riddle'];

/** a word with its picture and what it means in English */
export type Word = { w: string; p: string; en: string };
const W = (w: string, p: string, en: string): Word => ({ w, p, en });

// ---------- One word, many tones (Dấu thanh đổi nghĩa): the same letters, a different tone mark, another word ----------
export const TONE_SETS: { base: string; words: Word[] }[] = [
  { base: 'ca', words: [W('cá', '🐟', 'fish'), W('cà', '🍆', 'aubergine'), W('ca', '☕', 'mug')] },
  { base: 'dưa', words: [W('dưa', '🍉', 'melon'), W('dừa', '🥥', 'coconut'), W('dứa', '🍍', 'pineapple')] },
  { base: 'bo', words: [W('bò', '🐄', 'cow'), W('bó', '💐', 'bunch of flowers'), W('bọ', '🐞', 'bug')] },
  { base: 'cu', words: [W('cú', '🦉', 'owl'), W('củ', '🥕', 'root vegetable'), W('cụ', '🧓', 'great-grandparent')] },
  { base: 'ga', words: [W('gà', '🐔', 'chicken'), W('ga', '🚂', 'train station')] },
  { base: 'chao', words: [W('cháo', '🥣', 'rice porridge'), W('chào', '👋', 'hello')] }
];

// ---------- Rhyme pairs (Tìm vần giống nhau): words that share their rhyme (vần), whatever their tone ----------
export const RHYME_SETS: { r: string; words: Word[] }[] = [
  { r: 'a', words: [W('gà', '🐔', 'chicken'), W('cá', '🐟', 'fish'), W('lá', '🍃', 'leaf'), W('nhà', '🏠', 'house')] },
  { r: 'eo', words: [W('mèo', '🐱', 'cat'), W('kẹo', '🍬', 'sweet'), W('heo', '🐖', 'pig')] },
  { r: 'o', words: [W('bò', '🐄', 'cow'), W('chó', '🐶', 'dog'), W('thỏ', '🐰', 'rabbit')] },
  { r: 'ưa', words: [W('ngựa', '🐴', 'horse'), W('sữa', '🥛', 'milk'), W('dừa', '🥥', 'coconut'), W('mưa', '🌧️', 'rain')] },
  { r: 'âu', words: [W('gấu', '🐻', 'bear'), W('trâu', '🐃', 'buffalo')] },
  { r: 'ao', words: [W('sao', '⭐', 'star'), W('cáo', '🦊', 'fox')] },
  { r: 'ăng', words: [W('trăng', '🌙', 'moon'), W('răng', '🦷', 'tooth')] },
  { r: 'ong', words: [W('ong', '🐝', 'bee'), W('bóng', '⚽', 'ball')] },
  { r: 'uôi', words: [W('chuối', '🍌', 'banana'), W('muỗi', '🦟', 'mosquito')] },
  { r: 'ây', words: [W('cây', '🌳', 'tree'), W('mây', '☁️', 'cloud')] }
];

// ---------- Vietnamese letters (Chữ cái Việt): ă â đ ê ô ơ ư, each beside the letters it is mixed up with ----------
// at: where the letter is in the word; the letter itself carries no tone mark in these words, so it can be chosen alone
export const LETTER_FAMILY: Record<string, string[]> = { ă: ['a', 'ă', 'â'], â: ['a', 'ă', 'â'], đ: ['d', 'đ'], ê: ['e', 'ê'], ô: ['o', 'ô', 'ơ'], ơ: ['o', 'ô', 'ơ'], ư: ['u', 'ư'] };
export const LETTER_WORDS: (Word & { at: number })[] = [
  { ...W('trăng', '🌙', 'moon'), at: 2 }, { ...W('răng', '🦷', 'tooth'), at: 1 },
  { ...W('cây', '🌳', 'tree'), at: 1 }, { ...W('mây', '☁️', 'cloud'), at: 1 },
  { ...W('đèn', '🏮', 'lantern'), at: 0 }, { ...W('đũa', '🥢', 'chopsticks'), at: 0 },
  { ...W('dê', '🐐', 'goat'), at: 1 }, { ...W('lê', '🍐', 'pear'), at: 1 },
  { ...W('ô', '☂️', 'umbrella'), at: 0 }, { ...W('ông', '👴', 'grandpa'), at: 0 },
  { ...W('cơm', '🍚', 'rice'), at: 1 }, { ...W('bơ', '🥑', 'avocado'), at: 1 },
  { ...W('dưa', '🍉', 'melon'), at: 1 }, { ...W('mưa', '🌧️', 'rain'), at: 1 }
];
/** what the voice says after a letter is found ("chữ ă"), one line per letter */
export const LETTER_SAY = (l: string) => 'chữ ' + l;

// ---------- Opposite pairs (Nối từ trái nghĩa) ----------
export const OPPOSITES: [Word, Word][] = [
  [W('to', '🐘', 'big'), W('nhỏ', '🐭', 'small')], [W('nóng', '🔥', 'hot'), W('lạnh', '🧊', 'cold')],
  [W('ngày', '☀️', 'day'), W('đêm', '🌙', 'night')], [W('vui', '😊', 'happy'), W('buồn', '😢', 'sad')],
  [W('nhanh', '🐆', 'fast'), W('chậm', '🐢', 'slow')], [W('già', '🧓', 'old'), W('trẻ', '👶', 'young')],
  [W('cao', '🦒', 'tall'), W('thấp', '🐿️', 'short')], [W('lên', '⬆️', 'up'), W('xuống', '⬇️', 'down')],
  [W('mở', '🚪', 'open'), W('đóng', '🔒', 'closed')], [W('đầy', '🍼', 'full'), W('rỗng', '🫙', 'empty')],
  [W('ướt', '🌊', 'wet'), W('khô', '🏜️', 'dry')], [W('nặng', '🏋️', 'heavy'), W('nhẹ', '🪶', 'light')]
];

// ---------- Folk rhymes (Ca dao, đồng dao): a line with one word missing ----------
// t: the verse, its lines split by ' / '; gap: the missing word (its first time in the verse); p: its picture;
// m: what the verse means [English, Vietnamese]; kid: an easy one for the younger levels
export type Verse = { t: string; gap: string; p: string; m: [string, string]; kid?: boolean };
export const VERSES: Verse[] = [
  { t: 'Con cò bé bé / Nó đậu cành tre', gap: 'tre', p: '🎋', kid: true, m: ['A little stork sits on a branch of bamboo.', 'Chú cò nhỏ đậu trên cành tre.'] },
  { t: 'Con mèo mà trèo cây cau / Hỏi thăm chú chuột đi đâu vắng nhà', gap: 'cau', p: '🌴', kid: true, m: ['The cat climbs the areca palm and asks where the mouse has gone.', 'Mèo trèo lên cây cau, hỏi chuột đi đâu mà vắng nhà.'] },
  { t: 'Nu na nu nống / Cái cống nằm trong / Con ong nằm ngoài', gap: 'ong', p: '🐝', kid: true, m: ['A rhyme for a counting game: the drain lies inside, the bee lies outside.', 'Bài đồng dao để chơi đếm chân: cái cống nằm trong, con ong nằm ngoài.'] },
  { t: 'Con gà cục tác lá chanh / Con lợn ủn ỉn mua hành cho tôi', gap: 'gà', p: '🐔', kid: true, m: ['The hen clucks for lime leaves, the pig grunts for spring onions.', 'Gà kêu đòi lá chanh, lợn kêu đòi mua hành.'] },
  { t: 'Dung dăng dung dẻ / Dắt trẻ đi chơi / Đến cửa nhà trời', gap: 'trẻ', p: '👶', kid: true, m: ['Swinging our hands, we take the little ones out to play, all the way to the door of the sky.', 'Nắm tay nhau đung đưa, dắt các em nhỏ đi chơi tới tận cửa nhà trời.'] },
  { t: 'Trên trời có đám mây xanh', gap: 'mây', p: '☁️', m: ['Up in the sky there is a blue cloud.', 'Trên bầu trời có một đám mây màu xanh.'] },
  { t: 'Bà còng đi chợ trời mưa / Cái tôm cái tép đi đưa bà còng', gap: 'mưa', p: '🌧️', m: ['Old Bà Còng goes to market in the rain, and the little shrimps walk her home.', 'Bà còng đi chợ gặp trời mưa, tôm tép đưa bà về.'] },
  { t: 'Cái bống là cái bống bang / Khéo sảy khéo sàng cho mẹ nấu cơm', gap: 'cơm', p: '🍚', m: ['Little Bống sifts the rice so well, ready for her mother to cook.', 'Bống khéo sảy, khéo sàng gạo để mẹ nấu cơm.'] },
  { t: 'Trâu ơi ta bảo trâu này / Trâu ra ngoài ruộng trâu cày với ta', gap: 'ruộng', p: '🌾', m: ['Buffalo, come out to the rice field and plough it with me.', 'Trâu ơi, ra đồng cày ruộng cùng ta nhé.'] },
  { t: 'Công cha như núi Thái Sơn / Nghĩa mẹ như nước trong nguồn chảy ra', gap: 'núi', p: '⛰️', m: ["A father's love is as great as a mountain, a mother's love as endless as water from a spring.", 'Công ơn của cha to như núi, tình thương của mẹ nhiều như nước suối chảy mãi.'] }
];

// ---------- Picture sayings (Tục ngữ, thành ngữ) ----------
export const SAYINGS: Verse[] = [
  { t: 'Chậm như rùa', gap: 'rùa', p: '🐢', kid: true, m: ['As slow as a tortoise.', 'Chậm như chú rùa bò.'] },
  { t: 'Nhanh như sóc', gap: 'sóc', p: '🐿️', kid: true, m: ['As quick as a squirrel.', 'Nhanh nhẹn như chú sóc.'] },
  { t: 'Khỏe như voi', gap: 'voi', p: '🐘', kid: true, m: ['As strong as an elephant.', 'Khỏe như con voi.'] },
  { t: 'Nhát như thỏ', gap: 'thỏ', p: '🐰', kid: true, m: ['As shy as a rabbit.', 'Nhút nhát như chú thỏ.'] },
  { t: 'Chuồn chuồn bay thấp thì mưa', gap: 'mưa', p: '🌧️', kid: true, m: ['When dragonflies fly low, rain is coming.', 'Chuồn chuồn bay thấp là trời sắp mưa.'] },
  { t: 'Ăn quả nhớ kẻ trồng cây', gap: 'cây', p: '🌳', m: ['When you eat the fruit, remember who planted the tree: be thankful.', 'Khi được hưởng điều tốt, hãy nhớ ơn người đã làm ra nó.'] },
  { t: 'Uống nước nhớ nguồn', gap: 'nước', p: '💧', m: ['When you drink water, remember where it comes from: be thankful.', 'Hãy nhớ ơn những người đã cho mình điều tốt đẹp.'] },
  { t: 'Lá lành đùm lá rách', gap: 'lá', p: '🍃', m: ['A whole leaf wraps a torn one: help those who have less.', 'Người có nhiều giúp đỡ người có ít.'] },
  { t: 'Gần mực thì đen, gần đèn thì rạng', gap: 'đèn', p: '🏮', m: ['Near ink you turn black, near a lamp you shine: choose good friends.', 'Chơi với bạn tốt thì mình cũng tốt lên.'] },
  { t: 'Một con ngựa đau, cả tàu bỏ cỏ', gap: 'ngựa', p: '🐴', m: ['When one horse is ill, the whole stable stops eating: we care for each other.', 'Một người gặp chuyện buồn, mọi người cùng lo lắng.'] },
  { t: 'Tốt gỗ hơn tốt nước sơn', gap: 'gỗ', p: '🪵', m: ['Good wood matters more than shiny paint: what is inside counts.', 'Lòng tốt bên trong quý hơn vẻ đẹp bên ngoài.'] }
];
/** a verse as it is said aloud (its lines joined by commas), and with its missing word left out */
export const spoken = (t: string) => t.replace(/ \/ /g, ', ');
export const gapped = (v: Verse) => spoken(v.t.replace(new RegExp('(^|[\\s,])' + v.gap + '(?=$|[\\s,])', 'u'), '$1…'));

// ---------- Read along (Đọc to) and Make a sentence (Đặt câu) ----------
export type Sentence = { t: string; p: string; en: string };
const S = (t: string, p: string, en: string): Sentence => ({ t, p, en });
export const SENTENCES: Sentence[] = [
  S('Bé đi học.', '🏫', 'I go to school.'), S('Mẹ nấu cơm.', '🍚', 'Mum cooks rice.'), S('Mèo bắt chuột.', '🐱', 'The cat catches a mouse.'),
  S('Trời mưa to.', '🌧️', 'It is raining hard.'), S('Em yêu bà.', '👵', 'I love my grandma.'), S('Bố đọc sách.', '📖', 'Dad reads a book.'),
  S('Chú gà trống gáy.', '🐓', 'The rooster crows.'), S('Bé chơi với cún.', '🐶', 'I play with the puppy.'), S('Ông trồng cây xanh.', '🌳', 'Grandpa plants a tree.'),
  S('Con trâu ăn cỏ.', '🐃', 'The buffalo eats grass.'), S('Hoa sen nở trong ao.', '🪷', 'Lotus flowers open in the pond.'), S('Con cá bơi dưới nước.', '🐟', 'The fish swims in the water.'),
  S('Bé uống sữa mỗi sáng.', '🥛', 'I drink milk every morning.'), S('Chúng em cùng hát vui.', '🎵', 'We sing happily together.'), S('Mặt trời mọc ở đằng đông.', '🌅', 'The sun rises in the east.')
];
/** a sentence's words as they are shown (the full stop stays on the last one) and as they are said (no full stop) */
export const wordsOf = (s: Sentence) => s.t.split(' ');
export const sayWord = (w: string) => w.replace(/[.,!?]/g, '').toLowerCase();

// ---------- Listen and spell (Nghe và viết): the word's letters, as typed (a toned vowel is one letter) ----------
export const SPELL_WORDS: Word[] = [
  W('cá', '🐟', 'fish'), W('gà', '🐔', 'chicken'), W('bò', '🐄', 'cow'), W('xe', '🚗', 'car'), W('lá', '🍃', 'leaf'), W('dê', '🐐', 'goat'), W('cờ', '🚩', 'flag'),
  W('mèo', '🐱', 'cat'), W('hoa', '🌸', 'flower'), W('voi', '🐘', 'elephant'), W('cam', '🍊', 'orange'), W('gấu', '🐻', 'bear'), W('cây', '🌳', 'tree'),
  W('thỏ', '🐰', 'rabbit'), W('sữa', '🥛', 'milk'), W('kem', '🍦', 'ice cream'), W('mưa', '🌧️', 'rain'), W('cơm', '🍚', 'rice'), W('đèn', '🏮', 'lantern'),
  W('ngựa', '🐴', 'horse'), W('sách', '📖', 'book'), W('chim', '🐦', 'bird'), W('răng', '🦷', 'tooth'),
  W('trứng', '🥚', 'egg'), W('chuối', '🍌', 'banana'), W('trăng', '🌙', 'moon'), W('muỗi', '🦟', 'mosquito')
];
export const lettersOf = (w: string) => [...w.normalize('NFC')];
// the six tone forms of each vowel, to find a vowel's twins with another mark (Talent hears the difference)
export const VOWEL_TONES = ['aáàảãạ', 'ăắằẳẵặ', 'âấầẩẫậ', 'eéèẻẽẹ', 'êếềểễệ', 'iíìỉĩị', 'oóòỏõọ', 'ôốồổỗộ', 'ơớờởỡợ', 'uúùủũụ', 'ưứừửữự', 'yýỳỷỹỵ'];
export const toneTwins = (ch: string) => { const row = VOWEL_TONES.find(r => r.includes(ch)); return row ? [...row].filter(c => c !== ch) : []; };

// ---------- Folk riddles (Câu đố dân gian) ----------
// q: the riddle [English, Vietnamese]; a: the answer said in Vietnamese; kid: an easy one for the younger levels
export type Riddle = { q: [string, string]; a: string; p: string; en: string; kid?: boolean };
export const RIDDLES: Riddle[] = [
  { q: ['What says meow and likes to catch mice?', 'Con gì kêu meo meo, hay rình bắt chuột?'], a: 'con mèo', p: '🐱', en: 'a cat', kid: true },
  { q: ['What lives in the pond, says ribbit, and jumps very far?', 'Con gì ở dưới ao, kêu ộp ộp, nhảy thật xa?'], a: 'con ếch', p: '🐸', en: 'a frog', kid: true },
  { q: ['What has a short tail and long ears, pink eyes and soft fur, and runs very fast?', 'Con gì đuôi ngắn tai dài, mắt hồng lông mượt, có tài chạy nhanh?'], a: 'con thỏ', p: '🐰', en: 'a rabbit', kid: true },
  { q: ['What has a red comb, crows cock-a-doodle-doo, and wakes everyone early in the morning?', 'Con gì mào đỏ, gáy ò ó o, sáng sớm tinh mơ, gọi người thức dậy?'], a: 'con gà trống', p: '🐓', en: 'a rooster', kid: true },
  { q: ['What has short webbed feet and a flat yellow beak, and says quack quack?', 'Con gì chân ngắn, mà lại có màng, mỏ bẹt màu vàng, hay kêu cạp cạp?'], a: 'con vịt', p: '🦆', en: 'a duck', kid: true },
  { q: ['What has legs like the posts of a house, ears as big as fans, and a very, very long nose?', 'Con gì chân như cột nhà, tai to như quạt, mũi dài thật dài?'], a: 'con voi', p: '🐘', en: 'an elephant', kid: true },
  { q: ['What is round, hides in the daytime and shines in the sky at night?', 'Cái gì tròn tròn, ban ngày thì lặn, ban đêm sáng trên trời?'], a: 'mặt trăng', p: '🌙', en: 'the moon', kid: true },
  { q: ['What has eight legs and two claws, and walks sideways all day long?', 'Con gì tám cẳng hai càng, chẳng đi mà lại bò ngang cả ngày?'], a: 'con cua', p: '🦀', en: 'a crab' },
  { q: ['What eats until it is full, has a big tummy and sleepy eyes, says oink oink and snores?', 'Con gì ăn no, bụng to mắt híp, mồm kêu ụt ịt, nằm thở phì phò?'], a: 'con lợn', p: '🐖', en: 'a pig' },
  { q: ['What fruit is green outside, red inside with black seeds, and cool to eat on a summer day?', 'Quả gì vỏ xanh xanh, ruột đỏ hạt đen, ăn mát cả ngày hè?'], a: 'quả dưa hấu', p: '🍉', en: 'a watermelon' },
  { q: ['Two brothers, exactly the same, pick up rice together every day. What are they?', 'Hai anh em giống nhau như đúc, ngày ngày cùng gắp cơm ăn. Là cái gì?'], a: 'đôi đũa', p: '🥢', en: 'chopsticks' },
  { q: ['What tree is very tall, with leaves spread like hands and big fruit full of sweet water?', 'Cây gì cao vút, lá xòe như tay, quả to có nước ngọt?'], a: 'cây dừa', p: '🥥', en: 'a coconut tree' }
];

/** every Vietnamese word and line the ten games say on their own, with the Vietnamese voice (recorded into the voice
 *  pack by tools/make-voice-pack.mts; none has a name in it) */
export function tiengviet2Lines(): { lang: string; text: string }[] {
  const out: { lang: string; text: string }[] = [], seen = new Set<string>(), add = (text: string) => { if (text && !seen.has(text)) { seen.add(text); out.push({ lang: 'vi', text }); } };
  for (const s of TONE_SETS) s.words.forEach(w => add(w.w));
  for (const s of RHYME_SETS) s.words.forEach(w => add(w.w));
  for (const w of LETTER_WORDS) add(w.w);
  for (const l of Object.keys(LETTER_FAMILY)) add(LETTER_SAY(l));
  for (const [a, b] of OPPOSITES) { add(a.w); add(b.w); }
  for (const v of [...VERSES, ...SAYINGS]) { add(spoken(v.t)); add(gapped(v)); add(v.gap); }
  for (const s of SENTENCES) { add(s.t); wordsOf(s).forEach(w => add(sayWord(w))); }
  for (const w of SPELL_WORDS) add(w.w);
  for (const r of RIDDLES) { add(r.q[1]); add(r.a); }
  return out;
}
