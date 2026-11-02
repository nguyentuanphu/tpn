// (v1.08 english, owner's plan 3 Nov 2026 AEDT, part C) The words, phrases and songs of the English corner's own games
// (js/games/english.ts): real English for children learning it (most players are Vietnamese). Each word has its
// Vietnamese meaning (the hint) and its picture (the valley's own drawings, js/art.ts). The English words are always
// said by the English voice (Azure en-AU) and recorded from englishLines() by tools/make-voice-pack.mts; no line has a
// child's name in it. No imports, so the voice tool can read it.

/** [English, Vietnamese, picture] */
export type Word = [string, string, string];
export const TOPICS: { key: string; en: string; vi: string; words: Word[] }[] = [
  { key: 'animals', en: 'Animals', vi: 'Con vật', words: [
    ['cat', 'con mèo', '🐱'], ['dog', 'con chó', '🐶'], ['fish', 'con cá', '🐟'], ['bird', 'con chim', '🐦'], ['duck', 'con vịt', '🦆'],
    ['cow', 'con bò', '🐄'], ['pig', 'con lợn', '🐷'], ['horse', 'con ngựa', '🐴'], ['rabbit', 'con thỏ', '🐰'], ['elephant', 'con voi', '🐘'],
    ['monkey', 'con khỉ', '🐒'], ['frog', 'con ếch', '🐸'], ['chicken', 'con gà', '🐔'], ['bear', 'con gấu', '🐻'], ['tiger', 'con hổ', '🐯'], ['lion', 'con sư tử', '🦁']] },
  { key: 'colours', en: 'Colours', vi: 'Màu sắc', words: [
    ['red', 'màu đỏ', 'en:col:red'], ['blue', 'màu xanh dương', 'en:col:blue'], ['yellow', 'màu vàng', 'en:col:yellow'], ['green', 'màu xanh lá', 'en:col:green'],
    ['orange', 'màu cam', 'en:col:orange'], ['purple', 'màu tím', 'en:col:purple'], ['pink', 'màu hồng', 'en:col:pink'], ['brown', 'màu nâu', 'en:col:brown'],
    ['black', 'màu đen', 'en:col:black'], ['white', 'màu trắng', 'en:col:white']] },
  { key: 'numbers', en: 'Numbers', vi: 'Con số', words: [
    ['one', 'một', 'en:n:1'], ['two', 'hai', 'en:n:2'], ['three', 'ba', 'en:n:3'], ['four', 'bốn', 'en:n:4'], ['five', 'năm', 'en:n:5'],
    ['six', 'sáu', 'en:n:6'], ['seven', 'bảy', 'en:n:7'], ['eight', 'tám', 'en:n:8'], ['nine', 'chín', 'en:n:9'], ['ten', 'mười', 'en:n:10']] },
  { key: 'family', en: 'Family', vi: 'Gia đình', words: [
    ['mum', 'mẹ', '👩'], ['dad', 'bố', '👨'], ['baby', 'em bé', '👶'], ['grandma', 'bà', '👵'], ['grandpa', 'ông', '👴'], ['sister', 'chị gái, em gái', '👧'], ['brother', 'anh trai, em trai', '👦']] },
  { key: 'food', en: 'Food', vi: 'Đồ ăn', words: [
    ['apple', 'quả táo', '🍎'], ['banana', 'quả chuối', '🍌'], ['rice', 'cơm', '🍚'], ['bread', 'bánh mì', '🍞'], ['milk', 'sữa', '🥛'], ['egg', 'quả trứng', '🥚'],
    ['cake', 'bánh ngọt', '🍰'], ['orange', 'quả cam', '🍊'], ['watermelon', 'dưa hấu', '🍉'], ['noodles', 'mì sợi', '🍜'], ['carrot', 'cà rốt', '🥕'], ['grapes', 'quả nho', '🍇']] },
  { key: 'body', en: 'My body', vi: 'Cơ thể', words: [
    ['hand', 'bàn tay', '✋'], ['foot', 'bàn chân', '🦶'], ['eye', 'mắt', '👁️'], ['ear', 'tai', '👂'], ['nose', 'mũi', '👃'], ['mouth', 'miệng', '👄'],
    ['teeth', 'răng', '🦷'], ['arm', 'cánh tay', '💪'], ['leg', 'chân', '🦵']] }
];
export const topic = (key: string) => TOPICS.find(t => t.key === key);

// Listen and Choose: things that can be counted and come big or small
export const THINGS: [string, string, string, string][] = [
  // [one, many, picture, Vietnamese]
  ['cat', 'cats', '🐱', 'mèo'], ['dog', 'dogs', '🐶', 'chó'], ['fish', 'fish', '🐟', 'cá'], ['duck', 'ducks', '🦆', 'vịt'], ['apple', 'apples', '🍎', 'táo'],
  ['banana', 'bananas', '🍌', 'chuối'], ['star', 'stars', '⭐', 'ngôi sao'], ['ball', 'balls', '⚽', 'quả bóng'], ['car', 'cars', '🚗', 'ô tô'], ['flower', 'flowers', '🌸', 'bông hoa'],
  ['frog', 'frogs', '🐸', 'ếch'], ['egg', 'eggs', '🥚', 'trứng']
];
export const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
export const TENS = ['', 'ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'one hundred'];
export const VI_NUM = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín', 'hai mươi'];

/** the phrase Listen and Choose says: "two big cats", and its Vietnamese ("hai con mèo to") */
export const thingPhrase = (t: [string, string, string, string], n: number, size: '' | 'big' | 'small') => `${n === 1 ? (size ? 'a' : 'one') : NUM_WORDS[n]}${size ? ' ' + size : ''} ${n === 1 ? t[0] : t[1]}`;
export const thingPhraseVi = (t: [string, string, string, string], n: number, size: '' | 'big' | 'small') => `${VI_NUM[n]} ${t[3]}${size === 'big' ? ' to' : size === 'small' ? ' nhỏ' : ''}`;
/** Listen and Choose says big or small only for one to three things */
export const SIZED_MAX = 3;
/** the Vietnamese of a counting answer (Talent counts in tens) */
export const viCount = (n: number, tens: boolean) => tens ? (n === 10 ? 'một trăm' : VI_NUM[n] + ' mươi') : VI_NUM[n];
/** the Vietnamese of a Colours and Shapes answer */
export const viColShape = (ask: string, cVi: string, sVi: string, big: boolean) => ask === 'colour' ? 'màu ' + cVi : ask === 'shape' ? sVi : ask === 'both' ? `${sVi} màu ${cVi}` : `${sVi} màu ${cVi}${big ? ', to' : ', nhỏ'}`;
/** the colours Talent asks with big and small */
export const SIZED_COLOURS = 6;

// Say and Match: words that look alike, for Talent (cat / cap / car)
export const LOOKALIKE: Word[][] = [
  [['cat', 'con mèo', '🐱'], ['car', 'ô tô', '🚗'], ['cake', 'bánh ngọt', '🍰'], ['cow', 'con bò', '🐄']],
  [['bear', 'con gấu', '🐻'], ['bird', 'con chim', '🐦'], ['bread', 'bánh mì', '🍞'], ['banana', 'quả chuối', '🍌']],
  [['duck', 'con vịt', '🦆'], ['dog', 'con chó', '🐶'], ['dad', 'bố', '👨'], ['door', 'cửa', '🚪']],
  [['fish', 'con cá', '🐟'], ['frog', 'con ếch', '🐸'], ['foot', 'bàn chân', '🦶'], ['flower', 'bông hoa', '🌸']],
  [['egg', 'quả trứng', '🥚'], ['ear', 'tai', '👂'], ['eye', 'mắt', '👁️'], ['elephant', 'con voi', '🐘']],
  [['milk', 'sữa', '🥛'], ['monkey', 'con khỉ', '🐒'], ['mouth', 'miệng', '👄'], ['mum', 'mẹ', '👩']]
];

// ABC Song: the alphabet in the song's lines (the traditional tune of "Twinkle, Twinkle")
export const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const ABC_LINES = ['A, B, C, D, E, F, G', 'H, I, J, K, L, M, N, O, P', 'Q, R, S', 'T, U, V', 'W, X, Y and Z', 'Now I know my A B C!'];
/** the song's notes, one per letter (MIDI): C C G G A A G, F F E E D D D D C, G G F, E E D, G G G F E D */
export const ABC_TUNE = [60, 60, 67, 67, 69, 69, 67, 65, 65, 64, 64, 62, 62, 62, 62, 60, 67, 67, 65, 64, 64, 62, 67, 67, 67, 65];
/** a word for each letter, for the letter's picture */
export const ABC_WORDS: Record<string, [string, string, string]> = {
  A: ['apple', '🍎', 'quả táo'], B: ['ball', '⚽', 'quả bóng'], C: ['cat', '🐱', 'con mèo'], D: ['dog', '🐶', 'con chó'], E: ['egg', '🥚', 'quả trứng'], F: ['fish', '🐟', 'con cá'],
  G: ['grapes', '🍇', 'quả nho'], H: ['horse', '🐴', 'con ngựa'], I: ['ice cream', '🍦', 'kem'], J: ['juice', '🧃', 'nước ép'], K: ['koala', '🐨', 'gấu túi'], L: ['lion', '🦁', 'sư tử'],
  M: ['monkey', '🐒', 'con khỉ'], N: ['nose', '👃', 'cái mũi'], O: ['orange', '🍊', 'quả cam'], P: ['pig', '🐷', 'con lợn'], Q: ['queen', '👑', 'nữ hoàng'], R: ['rabbit', '🐰', 'con thỏ'],
  S: ['sun', '☀️', 'mặt trời'], T: ['tiger', '🐯', 'con hổ'], U: ['umbrella', '☂️', 'cái ô'], V: ['violin', '🎻', 'đàn vi-ô-lông'], W: ['watermelon', '🍉', 'dưa hấu'],
  X: ['xylophone', 'en:xylo', 'đàn mộc cầm'], Y: ['yellow', 'en:col:yellow', 'màu vàng'], Z: ['zebra', '🦓', 'ngựa vằn']
};


// First Sentences: "I see a …", "I have …", "I like …" and a describing word at Talent
export const SENTENCE_STARTS: [string, string][] = [['I see', 'Tớ nhìn thấy'], ['I have', 'Tớ có'], ['I like', 'Tớ thích']];
export const ADJECTIVES: [string, string][] = [['big', 'to'], ['small', 'nhỏ'], ['happy', 'vui vẻ']];
// the things a sentence talks about (from the picture words): [word, Vietnamese, picture]
export const SENTENCE_THINGS: Word[] = [['cat', 'con mèo', '🐱'], ['dog', 'con chó', '🐶'], ['duck', 'con vịt', '🦆'], ['fish', 'con cá', '🐟'], ['ball', 'quả bóng', '⚽'],
  ['apple', 'quả táo', '🍎'], ['banana', 'quả chuối', '🍌'], ['car', 'ô tô', '🚗'], ['bird', 'con chim', '🐦'], ['frog', 'con ếch', '🐸'], ['egg', 'quả trứng', '🥚'], ['teddy', 'gấu bông', '🧸']];
/** "I see a cat." / "I see an apple." */
export const article = (w: string) => /^[aeiou]/.test(w) ? 'an' : 'a';
/** a whole sentence in English and Vietnamese: "I see a big dog." / "Tớ nhìn thấy con chó to." */
export const sentenceOf = (start: [string, string], w: Word, adj: [string, string] | null): [string[], string, string] => {
  const words = [...start[0].split(' '), article(adj ? adj[0] : w[0]), ...(adj ? [adj[0]] : []), w[0] + '.'];
  return [words, words.join(' '), `${start[1]} ${w[1]}${adj ? ' ' + adj[1] : ''}.`];
};

// Greetings: what to say when … [id, the situation in English, in Vietnamese, the pictures, the answer, its Vietnamese, level]
export type Greet = { id: string; when: [string, string]; pics: string; say: string; vi: string; lv: number };
export const GREETINGS: Greet[] = [
  { id: 'hello', when: ['A friend comes to play. What do you say?', 'Một bạn đến chơi. Con nói gì?'], pics: '🧒 👋', say: 'Hello!', vi: 'Xin chào!', lv: 0 },
  { id: 'bye', when: ['Your friend goes home. What do you say?', 'Bạn con đi về nhà. Con nói gì?'], pics: '🏠 👋', say: 'Goodbye!', vi: 'Tạm biệt!', lv: 0 },
  { id: 'thanks', when: ['Grandma gives you a present. What do you say?', 'Bà tặng con một món quà. Con nói gì?'], pics: '👵 🎁', say: 'Thank you!', vi: 'Cảm ơn!', lv: 0 },
  { id: 'sorry', when: ['Oops! You bump into a friend. What do you say?', 'Ối! Con va vào một bạn. Con nói gì?'], pics: '🧒 😢', say: 'Sorry!', vi: 'Xin lỗi!', lv: 0 },
  { id: 'please', when: ['You would like some water. What do you say?', 'Con muốn uống nước. Con nói gì?'], pics: '💧 🥤', say: 'Water, please.', vi: 'Cho con xin nước ạ.', lv: 1 },
  { id: 'morning', when: ['You wake up and see Mum. What do you say?', 'Con thức dậy và gặp mẹ. Con nói gì?'], pics: '🌅 👩', say: 'Good morning!', vi: 'Chào buổi sáng!', lv: 1 },
  { id: 'night', when: ['It is time for bed. What do you say?', 'Đến giờ đi ngủ rồi. Con nói gì?'], pics: '🌙 🛏️', say: 'Good night!', vi: 'Chúc ngủ ngon!', lv: 1 },
  { id: 'welcome', when: ['Your friend says thank you. What do you say?', 'Bạn con nói cảm ơn. Con nói gì?'], pics: '🧒 🤗', say: 'You are welcome!', vi: 'Không có gì!', lv: 2 },
  { id: 'fine', when: ['Your teacher asks: How are you? What do you say?', 'Cô giáo hỏi: Con có khỏe không? Con nói gì?'], pics: '🏫 😊', say: 'I am fine, thank you.', vi: 'Con khỏe, cảm ơn cô.', lv: 2 },
  { id: 'meet', when: ['You meet a new friend. What do you say?', 'Con gặp một bạn mới. Con nói gì?'], pics: '🧒 🤝', say: 'Nice to meet you!', vi: 'Rất vui được gặp bạn!', lv: 2 },
  { id: 'excuse', when: ['A friend is in the way. What do you say?', 'Một bạn đứng chắn đường. Con nói gì?'], pics: '🧒 🚪', say: 'Excuse me, please.', vi: 'Cho tớ đi nhờ với.', lv: 3 },
  { id: 'birthday', when: ['It is your friend’s birthday. What do you say?', 'Hôm nay là sinh nhật bạn con. Con nói gì?'], pics: '🎂 🎈', say: 'Happy birthday!', vi: 'Chúc mừng sinh nhật!', lv: 3 },
  { id: 'eat', when: ['Dinner is ready. What do you say?', 'Bữa tối xong rồi. Con nói gì?'], pics: '🍽️ 🍚', say: 'Thank you for the food!', vi: 'Con cảm ơn vì bữa ăn!', lv: 3 },
  { id: 'help', when: ['Your box is too heavy. What do you say?', 'Cái hộp nặng quá. Con nói gì?'], pics: '📚 🙋', say: 'Can you help me, please?', vi: 'Giúp con với được không ạ?', lv: 3 }
];

// Colours and Shapes
export const COLOURS: [string, string, string][] = [['red', 'đỏ', '#e8433a'], ['blue', 'xanh dương', '#3b6fe0'], ['yellow', 'vàng', '#ffd23f'], ['green', 'xanh lá', '#43c463'],
  ['orange', 'cam', '#ff9f43'], ['purple', 'tím', '#8a5cf6'], ['pink', 'hồng', '#ff7eb8'], ['brown', 'nâu', '#9a6a3a'], ['black', 'đen', '#2b2233'], ['white', 'trắng', '#ffffff']];
export const SHAPES: [string, string][] = [['circle', 'hình tròn'], ['square', 'hình vuông'], ['triangle', 'hình tam giác'], ['star', 'ngôi sao'], ['heart', 'trái tim'],
  ['rectangle', 'hình chữ nhật'], ['oval', 'hình bầu dục'], ['diamond', 'hình thoi']];

/** every English word and sentence the games say on their own (recorded into the voice pack by
 *  tools/make-voice-pack.mts with the English voice; none has a name in it) */
export function englishLines(): { lang: string; text: string }[] {
  const out: { lang: string; text: string }[] = [], seen = new Set<string>();
  const add = (lang: string, text: string) => { const k = lang + '|' + text; if (text && !seen.has(k)) { seen.add(k); out.push({ lang, text }); } };
  const en = (t: string) => add('en', t), vi = (t: string) => add('vi', t);
  for (const t of TOPICS) for (const w of t.words) { en(w[0]); vi(w[1]); }
  for (const t of THINGS) for (let n = 1; n <= 5; n++) for (const s of ['', 'big', 'small'] as const) { if (s && n > SIZED_MAX) continue; en(thingPhrase(t, n, s)); vi(thingPhraseVi(t, n, s)); }
  for (const g of LOOKALIKE) for (const w of g) { en(w[0]); vi(w[1]); }
  ABC.forEach(en); ABC_LINES.forEach(en);
  for (const k of Object.keys(ABC_WORDS)) { en(`${k} is for ${ABC_WORDS[k][0]}.`); vi(ABC_WORDS[k][2]); }
  NUM_WORDS.slice(1).forEach(en); TENS.slice(1).forEach(en);
  for (let n = 1; n <= 20; n++) vi(viCount(n, false)); for (let n = 1; n <= 10; n++) vi(viCount(n, true));
  for (const st of SENTENCE_STARTS) for (const w of SENTENCE_THINGS) for (const a of [null, ...ADJECTIVES]) { const [, e, v] = sentenceOf(st, w, a); en(e); vi(v); }
  for (const g of GREETINGS) { en(g.say); vi(g.vi); }
  COLOURS.forEach(([c, cv], ci) => {
    en(c); vi(viColShape('colour', cv, '', true));
    for (const [s, sv] of SHAPES) {
      en(`${c} ${s}`); vi(viColShape('both', cv, sv, true));
      if (ci < SIZED_COLOURS) for (const big of [true, false]) { en(`the ${big ? 'big' : 'small'} ${c} ${s}`); vi(viColShape('size', cv, sv, big)); }
    }
  });
  for (const [s, sv] of SHAPES) { en(s); vi(sv); }
  return out;
}
