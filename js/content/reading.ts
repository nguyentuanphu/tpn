// (Play reading trial, owner 11 Oct 2026 AEDT; brief docs/cores/tasks/play-reading.md) The reading games' words, for
// each language a child can learn to read in. They are not translations of each other: English is Australian English
// for children learning to read at school in Australia (sounds in the order s a t p i n…, "zed", mum, ute, lolly), and
// Vietnamese follows real Vietnamese reading steps (letters with their marks, the six tones, vần, tiếng, đánh vần).
// Loaded only when a reading game opens (js/games/reading.js). Every word has a drawing in js/art.js (check `reading`).
// No imports: tools/make-voice-pack.mts reads readingLines() to record every word, sound and sentence.

// ---------- letters: [letter, keyword, picture] in teaching order; SOUND says how each sound is said ----------
const EN_LETTERS = [['s', 'sun', '☀️'], ['a', 'apple', '🍎'], ['t', 'turtle', '🐢'], ['p', 'pig', '🐷'], ['i', 'insect', '🐞'], ['n', 'nest', '🪺'],
  ['m', 'moon', '🌙'], ['d', 'dog', '🐶'], ['g', 'goat', '🐐'], ['o', 'octopus', '🐙'], ['c', 'cat', '🐱'], ['k', 'kite', '🪁'], ['e', 'egg', '🥚'],
  ['u', 'umbrella', '☂️'], ['r', 'rabbit', '🐰'], ['h', 'hat', '🎩'], ['b', 'bus', '🚌'], ['f', 'fish', '🐟'], ['l', 'lion', '🦁'], ['j', 'juice', '🧃'],
  ['v', 'van', '🚐'], ['w', 'whale', '🐳'], ['x', 'fox', '🦊'], ['y', 'yo-yo', '🪀'], ['z', 'zebra', '🦓'], ['q', 'queen', '👑']];
const VI_LETTERS = [['a', 'áo', '👕'], ['o', 'ong', '🐝'], ['ô', 'ô', '☂️'], ['ơ', 'mơ', '🍑'], ['e', 'xe', '🚗'], ['ê', 'ếch', '🐸'],
  ['ă', 'ăn', '🍚'], ['â', 'ấm', '🫖'], ['b', 'bò', '🐄'], ['c', 'cá', '🐟'], ['d', 'dê', '🐐'], ['đ', 'đèn', '🏮'], ['g', 'gà', '🐔'], ['h', 'hoa', '🌸'],
  ['i', 'mì', '🍜'], ['k', 'kem', '🍦'], ['l', 'lá', '🍃'], ['m', 'mèo', '🐱'], ['n', 'nón', '👒'], ['p', 'pin', '🔋'], ['q', 'quạt', '🪭'], ['r', 'rùa', '🐢'],
  ['s', 'sao', '⭐'], ['t', 'táo', '🍎'], ['u', 'cú', '🦉'], ['ư', 'sư tử', '🦁'], ['v', 'voi', '🐘'], ['x', 'xe', '🚗'], ['y', 'yêu', '❤️']];
// English sounds are recorded from their phonetic spelling (owner 11 Oct: "exact sounds"); the line the game says is
// "/s/" and tools/make-voice-pack.mts records it from SOUND_IPA. Vietnamese letters are read by their sound already.
export const SOUND_IPA = { s: 'sːː', a: 'æ', t: 'tʰ', p: 'pʰ', i: 'ɪ', n: 'nːː', m: 'mːː', d: 'd', g: 'ɡ', o: 'ɒ', c: 'kʰ', k: 'kʰ', e: 'e', u: 'ɐ',
  r: 'ɹːː', h: 'h', b: 'b', f: 'fːː', l: 'lːː', j: 'dʒ', v: 'vːː', w: 'w', x: 'ks', y: 'j', z: 'zːː', q: 'kw', ck: 'kʰ', sh: 'ʃːː', ch: 'tʃ', th: 'θːː', ee: 'iː', oo: 'ʉː', ll: 'lːː' };
const VI_NAME = { a: 'a', 'ă': 'á', 'â': 'ớ', b: 'bờ', c: 'cờ', d: 'dờ', 'đ': 'đờ', e: 'e', 'ê': 'ê', g: 'gờ', h: 'hờ', i: 'i', k: 'ca', l: 'lờ', m: 'mờ', n: 'nờ',
  o: 'o', 'ô': 'ô', 'ơ': 'ơ', p: 'pờ', q: 'quờ', r: 'rờ', s: 'sờ', t: 'tờ', u: 'u', 'ư': 'ư', v: 'vờ', x: 'xờ', y: 'i dài',
  ch: 'chờ', th: 'thờ', nh: 'nhờ', kh: 'khờ', tr: 'trờ', ph: 'phờ', ng: 'ngờ', gh: 'gờ', qu: 'quờ', gi: 'gi' };
// what a letter's name and sound are said as (English: "s" and "/s/", Z is "zed"; Vietnamese: "bờ" for both)
export const nameOf = (lang, L) => lang === 'vi' ? VI_NAME[L] || L : L === 'z' ? 'zed' : L;
export const soundOf = (lang, L) => lang === 'vi' ? VI_NAME[L] || L : SOUND_IPA[L] ? `/${L}/` : L;

// ---------- Word Builder: tiles make the word; Vietnamese tiles are âm đầu + vần (with its mark), as at school ----------
// [word, picture, tiles]; Vietnamese also the đánh vần line ("mờ eo meo huyền mèo")
const EN_BUILD = [
  [['cat', '🐱', ['c', 'a', 't']], ['dog', '🐶', ['d', 'o', 'g']], ['sun', '☀️', ['s', 'u', 'n']], ['pig', '🐷', ['p', 'i', 'g']], ['bus', '🚌', ['b', 'u', 's']],
    ['hen', '🐔', ['h', 'e', 'n']], ['fox', '🦊', ['f', 'o', 'x']], ['bed', '🛏️', ['b', 'e', 'd']], ['mum', '👩', ['m', 'u', 'm']], ['dad', '👨', ['d', 'a', 'd']], ['map', '🗺️', ['m', 'a', 'p']], ['cup', '🥤', ['c', 'u', 'p']]],
  [['frog', '🐸', ['f', 'r', 'o', 'g']], ['duck', '🦆', ['d', 'u', 'ck']], ['sock', '🧦', ['s', 'o', 'ck']], ['drum', '🥁', ['d', 'r', 'u', 'm']], ['crab', '🦀', ['c', 'r', 'a', 'b']],
    ['nest', '🪺', ['n', 'e', 's', 't']], ['egg', '🥚', ['e', 'g', 'g']], ['lips', '👄', ['l', 'i', 'p', 's']]],
  [['fish', '🐟', ['f', 'i', 'sh']], ['chick', '🐥', ['ch', 'i', 'ck']], ['teeth', '🦷', ['t', 'ee', 'th']], ['moon', '🌙', ['m', 'oo', 'n']], ['bee', '🐝', ['b', 'ee']],
    ['tree', '🌳', ['t', 'r', 'ee']], ['sheep', '🐑', ['sh', 'ee', 'p']], ['shell', '🐚', ['sh', 'e', 'll']]]
];
const VI_BUILD = [
  [['bò', '🐄', ['b', 'ò'], 'bờ o bo huyền bò'], ['cá', '🐟', ['c', 'á'], 'cờ a ca sắc cá'], ['gà', '🐔', ['g', 'à'], 'gờ a ga huyền gà'], ['bà', '👵', ['b', 'à'], 'bờ a ba huyền bà'],
    ['dê', '🐐', ['d', 'ê'], 'dờ ê dê'], ['xe', '🚗', ['x', 'e'], 'xờ e xe'], ['lá', '🍃', ['l', 'á'], 'lờ a la sắc lá'], ['mẹ', '👩', ['m', 'ẹ'], 'mờ e me nặng mẹ'],
    ['hổ', '🐯', ['h', 'ổ'], 'hờ ô hô hỏi hổ'], ['bé', '👶', ['b', 'é'], 'bờ e be sắc bé']],
  [['mèo', '🐱', ['m', 'èo'], 'mờ eo meo huyền mèo'], ['voi', '🐘', ['v', 'oi'], 'vờ oi voi'], ['hoa', '🌸', ['h', 'oa'], 'hờ oa hoa'], ['kem', '🍦', ['k', 'em'], 'ca em kem'],
    ['táo', '🍎', ['t', 'áo'], 'tờ ao tao sắc táo'], ['sao', '⭐', ['s', 'ao'], 'sờ ao sao'], ['cây', '🌳', ['c', 'ây'], 'cờ ây cây'], ['vịt', '🦆', ['v', 'ịt'], 'vờ it vit nặng vịt'],
    ['rùa', '🐢', ['r', 'ùa'], 'rờ ua rua huyền rùa'], ['đèn', '🏮', ['đ', 'èn'], 'đờ en đen huyền đèn'], ['nón', '👒', ['n', 'ón'], 'nờ on non sắc nón']],
  [['chó', '🐶', ['ch', 'ó'], 'chờ o cho sắc chó'], ['thỏ', '🐰', ['th', 'ỏ'], 'thờ o tho hỏi thỏ'], ['nhà', '🏠', ['nh', 'à'], 'nhờ a nha huyền nhà'], ['khỉ', '🐵', ['kh', 'ỉ'], 'khờ i khi hỏi khỉ'],
    ['trăng', '🌙', ['tr', 'ăng'], 'trờ ăng trăng'], ['phở', '🍜', ['ph', 'ở'], 'phờ ơ phơ hỏi phở'], ['chuối', '🍌', ['ch', 'uối'], 'chờ uôi chuôi sắc chuối'],
    ['thuyền', '⛵', ['th', 'uyền'], 'thờ uyên thuyên huyền thuyền'], ['ngựa', '🐴', ['ng', 'ựa'], 'ngờ ưa ngưa nặng ngựa']]
];

// ---------- Rhyme Time: pairs that rhyme, each with its rhyme family (other families are the wrong answers) ----------
const EN_RHYME = [['at', 'cat', '🐱', 'hat', '🎩'], ['og', 'dog', '🐶', 'frog', '🐸'], ['ee', 'bee', '🐝', 'tree', '🌳'], ['ake', 'cake', '🎂', 'snake', '🐍'],
  ['oon', 'moon', '🌙', 'spoon', '🥄'], ['ar', 'star', '⭐', 'car', '🚗'], ['ouse', 'mouse', '🐭', 'house', '🏠'], ['oat', 'goat', '🐐', 'boat', '⛵'],
  ['ear', 'bear', '🐻', 'pear', '🍐'], ['ock', 'sock', '🧦', 'clock', '🕒'], ['ale', 'snail', '🐌', 'whale', '🐳'], ['ox', 'fox', '🦊', 'box', '🎁']];
const VI_RHYME = [['eo', 'mèo', '🐱', 'kẹo', '🍬'], ['a', 'cá', '🐟', 'lá', '🍃'], ['ao', 'táo', '🍎', 'sao', '⭐'], ['ong', 'ong', '🐝', 'bóng', '⚽'],
  ['ăng', 'trăng', '🌙', 'răng', '🦷'], ['ây', 'cây', '🌳', 'mây', '☁️'], ['ưa', 'mưa', '🌧️', 'dưa', '🍉'], ['ua', 'rùa', '🐢', 'cua', '🦀'],
  ['a', 'gà', '🐔', 'nhà', '🏠'], ['o', 'bò', '🐄', 'thỏ', '🐰'], ['oa', 'hoa', '🌸', 'loa', '📣']];

// ---------- Word Balloons: common words, by level ----------
const EN_SIGHT = [['I', 'a', 'the', 'is', 'it', 'in', 'to', 'my', 'we', 'go', 'me', 'up', 'at', 'on', 'am'],
  ['and', 'see', 'can', 'you', 'he', 'she', 'like', 'look', 'said', 'mum', 'dad', 'here', 'this', 'play'],
  ['come', 'went', 'they', 'was', 'have', 'what', 'where', 'there', 'saw', 'with', 'are', 'some', 'little', 'said']];
const VI_SIGHT = [['là', 'và', 'có', 'đi', 'ăn', 'mẹ', 'bố', 'bé', 'em', 'con', 'ở', 'to', 'ba'],
  ['không', 'của', 'này', 'đây', 'cho', 'với', 'nhà', 'chơi', 'vui', 'nhỏ', 'thích', 'học'],
  ['những', 'được', 'nhưng', 'cũng', 'người', 'trường', 'xuống', 'nước', 'chúng', 'nhiều', 'đẹp', 'ngoan']];

// ---------- Tone Marks (Vietnamese) / short and long vowels, the magic e (English) ----------
// Vietnamese: the six tones of a syllable, as drilled at school (ma má mà mả mã mạ; ba…; be…), with each mark's name
export const VI_TONES = [['ma', 'má', 'mà', 'mả', 'mã', 'mạ'], ['ba', 'bá', 'bà', 'bả', 'bã', 'bạ'], ['be', 'bé', 'bè', 'bẻ', 'bẽ', 'bẹ']];
export const VI_MARKS = [['', 'không dấu'], ['́', 'dấu sắc'], ['̀', 'dấu huyền'], ['̉', 'dấu hỏi'], ['̃', 'dấu ngã'], ['̣', 'dấu nặng']];
// little ones: words that differ only by their tone, each with a picture (never "ma" (ghost) or "mả" (grave): owner)
const VI_TONE_PICS = [[['cá', '🐟'], ['cà', '🍆'], ['ca', '☕']], [['bò', '🐄'], ['bó', '💐']], [['bà', '👵'], ['ba', '👨']]];
const EN_VOWELS = [['kit', 'kite'], ['pin', 'pine'], ['cub', 'cube'], ['cap', 'cape'], ['tap', 'tape'], ['hop', 'hope'], ['not', 'note'], ['can', 'cane'],
  ['rob', 'robe'], ['tub', 'tube'], ['hug', 'huge'], ['cut', 'cute']];
const EN_VOWEL_PICS = [[['cub', '🐻'], ['cube', '🧊']], [['pin', '📌'], ['pine', '🌲']]];

// ---------- Syllable Drum: [picture, word, its syllables / tiếng] ----------
const EN_SYL = [['🐱', 'cat', ['cat']], ['🐶', 'dog', ['dog']], ['☀️', 'sun', ['sun']], ['🐟', 'fish', ['fish']], ['🍎', 'apple', ['ap', 'ple']], ['🐰', 'rabbit', ['rab', 'bit']],
  ['🐵', 'monkey', ['mon', 'key']], ['🐢', 'turtle', ['tur', 'tle']], ['🍭', 'lolly', ['lol', 'ly']], ['🏉', 'footy', ['foot', 'y']], ['🧸', 'teddy', ['ted', 'dy']],
  ['🚀', 'rocket', ['rock', 'et']], ['🍌', 'banana', ['ba', 'na', 'na']], ['🦘', 'kangaroo', ['kan', 'ga', 'roo']], ['🐨', 'koala', ['ko', 'a', 'la']],
  ['🐘', 'elephant', ['el', 'e', 'phant']], ['🦋', 'butterfly', ['but', 'ter', 'fly']], ['☂️', 'umbrella', ['um', 'brel', 'la']], ['🐙', 'octopus', ['oc', 'to', 'pus']],
  ['🦖', 'dinosaur', ['di', 'no', 'saur']], ['🐊', 'crocodile', ['croc', 'o', 'dile']], ['🍉', 'watermelon', ['wa', 'ter', 'mel', 'on']], ['🚁', 'helicopter', ['hel', 'i', 'cop', 'ter']]];
const VI_SYL = [['🐟', 'cá'], ['🐔', 'gà'], ['🍦', 'kem'], ['🏠', 'nhà'], ['🐱', 'con mèo'], ['🐘', 'con voi'], ['🍎', 'quả táo'], ['✈️', 'máy bay'], ['🚲', 'xe đạp'],
  ['🌈', 'cầu vồng'], ['🥖', 'bánh mì'], ['🦋', 'con bươm bướm'], ['☀️', 'ông mặt trời'], ['🚒', 'xe cứu hỏa'], ['🎂', 'bánh sinh nhật'], ['🍉', 'quả dưa hấu'],
  ['🐊', 'con cá sấu'], ['🐧', 'con chim cánh cụt'], ['🚁', 'máy bay trực thăng']].map(([p, w]) => [p, w, w.split(' ')]);

// ---------- Sentence Train: [picture, words], by length ----------
const EN_SENT = [
  [['🐱', 'The cat sits.'], ['👩', 'I see Mum.'], ['🐶', 'Dogs can run.'], ['🐟', 'Fish can swim.'], ['🍭', 'I like lollies.']],
  [['☀️', 'The sun is hot.'], ['🛻', 'Dad has a ute.'], ['🚌', 'The bus is red.'], ['🏉', 'We play footy today.'], ['🐸', 'A frog can jump.']],
  [['🦘', 'The kangaroo can hop fast.'], ['🐳', 'I see a big whale.'], ['🪁', 'My kite is up high.'], ['🎂', 'Mum and I like cake.'], ['🏖️', 'We go to the beach.']]
];
const VI_SENT = [
  [['🐱', 'Con mèo ngồi.'], ['🍦', 'Bé ăn kem.'], ['🐟', 'Cá bơi nhanh.'], ['👵', 'Bà kể chuyện.'], ['👩', 'Mẹ yêu bé.']],
  [['🐘', 'Con voi rất to.'], ['🍎', 'Bé thích ăn táo.'], ['🌳', 'Ông trồng cây xanh.'], ['☀️', 'Mặt trời đã lên.'], ['🪁', 'Em chơi thả diều.']],
  [['🚗', 'Bố lái xe ô tô.'], ['🌙', 'Trăng rằm tròn và sáng.'], ['👵', 'Bé đi chợ với bà.'], ['🐱', 'Con mèo thích ăn cá.'], ['🐰', 'Chú thỏ ăn cà rốt.']]
];

// ---------- Read With Me: our own little books (4 pages, then one question answered with a picture) ----------
const EN_BOOKS = [
  { title: 'The Big Red Bus', icon: '🚌', pages: [['🚌', 'Here is a big red bus.'], ['🐶 🚌', 'A dog gets on the bus.'], ['🐱 🚌', 'A cat gets on the bus.'], ['🚌 🏖️', 'The bus goes to the beach!']],
    q: 'Who got on the bus first?', answers: [['🐶', 'dog'], ['🐱', 'cat'], ['🐷', 'pig']] },
  { title: 'Koala Can Not Sleep', icon: '🐨', pages: [['🐨 🌳', 'Koala is up in a gum tree.'], ['🌙 🐨', 'The moon is up. Koala can not sleep.'], ['🦉 🎵', 'Owl sings a soft song.'], ['🐨 ⭐', 'Now Koala is fast asleep.']],
    q: 'Where is Koala?', answers: [['🌳', 'tree'], ['🏠', 'house'], ['⛵', 'boat']] },
  { title: 'A Day at the Beach', icon: '🏖️', pages: [['☀️', 'The sun is hot.'], ['👩 🏖️', 'We go to the beach with Mum.'], ['🐟 🌊', 'I see a fish in the sea.'], ['🍦 🍦', 'We all get an ice cream.']],
    q: 'What did we see in the sea?', answers: [['🐟', 'fish'], ['🐨', 'koala'], ['🚌', 'bus']] }
];
const VI_BOOKS = [
  { title: 'Chú Mèo Con', icon: '🐱', pages: [['🐱', 'Đây là chú mèo con.'], ['🐱 ⚽', 'Mèo con thích chơi bóng.'], ['👩 🐟', 'Mẹ cho mèo con ăn cá.'], ['🌙 🐱', 'Tối rồi, mèo con đi ngủ.']],
    q: 'Mèo con ăn gì?', answers: [['🐟', 'cá'], ['🍌', 'chuối'], ['🍦', 'kem']] },
  { title: 'Đi Chợ Với Bà', icon: '🧺', pages: [['👵 🧺', 'Sáng nay bé đi chợ với bà.'], ['🍎 🍌', 'Bà mua táo và chuối.'], ['🍬', 'Bà mua cho bé một gói kẹo.'], ['🏠', 'Bé và bà vui vẻ về nhà.']],
    q: 'Bé đi chợ với ai?', answers: [['👵', 'bà'], ['👨', 'bố'], ['🐶', 'chó']] },
  { title: 'Trăng Rằm', icon: '🌙', pages: [['🌙', 'Đêm nay trăng tròn và sáng.'], ['🏮 🏮', 'Các bạn nhỏ cầm đèn lồng.'], ['🥮', 'Cả nhà ăn bánh trung thu.'], ['🦁 🥁', 'Múa lân thật là vui!']],
    q: 'Các bạn nhỏ cầm gì?', answers: [['🏮', 'đèn lồng'], ['☂️', 'ô'], ['🎈', 'bóng bay']] }
];

export const READ = {
  en: { letters: EN_LETTERS, build: EN_BUILD, rhyme: EN_RHYME, sight: EN_SIGHT, vowels: EN_VOWELS, vowelPics: EN_VOWEL_PICS, syl: EN_SYL, sent: EN_SENT, books: EN_BOOKS },
  vi: { letters: VI_LETTERS, build: VI_BUILD, rhyme: VI_RHYME, sight: VI_SIGHT, tones: VI_TONES, tonePics: VI_TONE_PICS, syl: VI_SYL, sent: VI_SENT, books: VI_BOOKS }
};
// the words of a sentence, as they are shown (with their full stops) and as each is said on its own
export const wordsOf = s => s.split(' ');
export const bare = w => w.replace(/[.,!?]/g, '').toLowerCase();
// every word and picture a game can ask about (Word and Picture): the builder's words and the rhymes'
export const picWords = lang => { const R = READ[lang], out = new Map(); for (const t of R.build) for (const [w, p] of t) out.set(w, p); for (const [, a, pa, b, pb] of R.rhyme) { out.set(a, pa); out.set(b, pb); } return [...out].map(([w, p]) => [w, p]); };

// every line the reading games say in the reading language (recorded into the voice pack; none has a name)
export function readingLines() {
  const out = [], add = (lang, t) => { t = String(t).trim(); if (t) out.push({ lang, text: t }); };
  for (const lang of ['en', 'vi']) {
    const R = READ[lang];
    for (const [L, w] of R.letters) { add(lang, nameOf(lang, L)); add(lang, soundOf(lang, L)); add(lang, w); }
    for (const t of R.build) for (const [w, , tiles, spell] of t) { add(lang, w); for (const x of tiles) add(lang, soundOf(lang, x)); if (spell) add(lang, spell); }
    for (const [, a, , b] of R.rhyme) { add(lang, a); add(lang, b); }
    for (const t of R.sight) for (const w of t) add(lang, w);
    for (const [, w] of R.syl) add(lang, w);
    for (const t of R.sent) for (const [, s] of t) { add(lang, s); for (const w of wordsOf(s)) add(lang, bare(w)); }
    for (const B of R.books) { add(lang, B.title); add(lang, B.q); for (const [, s] of B.pages) { add(lang, s); for (const w of wordsOf(s)) add(lang, bare(w)); } for (const [, w] of B.answers) add(lang, w); }
  }
  for (const [s, l] of READ.en.vowels) { add('en', s); add('en', l); }
  for (const set of READ.vi.tones) for (const w of set) add('vi', w);
  for (const [, n] of VI_MARKS) add('vi', n);
  for (const set of READ.vi.tonePics) for (const [w] of set) add('vi', w);
  const seen = new Set(); return out.filter(l => { const k = l.lang + '|' + l.text; if (seen.has(k)) return false; seen.add(k); return true; });
}
// every picture the reading games show (each needs a drawing in js/art.js)
export function readingPics() {
  const out = new Set(), add = s => String(s).split(' ').forEach(p => p && out.add(p));
  for (const lang of ['en', 'vi']) {
    const R = READ[lang];
    R.letters.forEach(x => add(x[2])); R.build.flat().forEach(x => add(x[1])); R.rhyme.forEach(x => { add(x[2]); add(x[4]); }); R.syl.forEach(x => add(x[0]));
    R.sent.flat().forEach(x => add(x[0])); R.books.forEach(B => { add(B.icon); B.pages.forEach(p => add(p[0])); B.answers.forEach(a => add(a[0])); });
  }
  READ.en.vowelPics.flat().forEach(x => add(x[1])); READ.vi.tonePics.flat().forEach(x => add(x[1]));
  return [...out];
}
