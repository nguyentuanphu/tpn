// Reading Corner additions (owner, 23 Oct 2026 AEDT):
// rd_blend, rd_hats, rd_endings, rd_compound, rd_labels, rd_signs,
// rd_questions, rd_many, rd_caps, rd_poem, rd_missing, rd_book.
// (owner, 29 Oct 2026 AEDT audit) rebuilt: the right answer always stood first, second, then third; the answer's picture
// was printed on its button (so nothing had to be read); an English round showed a chicken for "pig"; Vietnamese
// rounds blended "c - a" into "ca" under a cat, and "g _ à" had no letter missing; Make a Little Book refused the
// second cover; and the keepsake page was drawn with phone emoji. Now each language has its own right words, the
// buttons are mixed, words stand without the answer's picture where reading is the point, and the book is drawn with
// our own art.
import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic, artSVG } from '../art.js';
import { el, wait } from '../util.js';
import { saveProfiles, settings } from '../state.js';

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.rd2-board { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px; margin: 0 auto; max-width: 96vw; }
.rd2-stage { width: min(400px, 90vw); min-height: 180px; background: #fffdf6; border-radius: 20px; box-shadow: 0 4px 16px rgba(40, 30, 60, .14); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 14px; text-align: center; }
.rd2-controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 420px; }
.rd2-btn { min-width: 64px; min-height: 64px; padding: 10px 18px; border-radius: 999px; border: 2px solid #3b2a4f; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .2); font: 800 22px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; touch-action: manipulation; }
.rd2-btn .art { width: 36px; height: 36px; }
.rd2-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(59, 42, 79, .2); }
.rd2-big { font-size: 64px; line-height: 1.1; text-align: center; }
.rd2-desc { font: 800 22px/1.35 var(--font, sans-serif); color: #402c57; max-width: 360px; }
.rd2-word { font: 900 34px var(--font, sans-serif); color: #3b6fe0; letter-spacing: 4px; }
`));
}

const isVi = () => settings.lang === 'vi';
const mix = <V,>(list: V[]): V[] => [...list].sort(() => Math.random() - .5);
type Pair = [string, string];
// a choice: its words in both languages, and a picture only when the game is not about reading that word
type Choice = { label: Pair; pic?: string };
type Round = { show?: string; word?: string; desc: Pair; choices: Choice[]; answer: number | 'any' };
const one = (s: string): Pair => [s, s];

function keep(api: any, png: string) {
  for (const p of api.players || []) {
    if (!p || !Array.isArray(p.album)) continue;
    p.album.push(png);
    if (p.album.length > 12) p.album.shift();
  }
  saveProfiles();
}

async function runReadingRounds(api: any, prompt: Pair, qs: Round[], done: Pair) {
  style(); api.say(prompt[0], prompt[1]); api.dots(qs.length, 0);
  const wrap = el('div', 'rd2-board'), stage = el('div', 'rd2-stage'), controls = el('div', 'rd2-controls');
  api.stage.appendChild(wrap); wrap.append(stage, controls);
  await wait(1500);
  for (let k = 0; k < qs.length; k++) {
    const q = qs[k];
    stage.innerHTML = (q.show ? `<div class="rd2-big">${pic(q.show)}</div>` : '') + (q.word ? `<div class="rd2-word">${q.word}</div>` : '') + `<div class="rd2-desc">${T(q.desc[0], q.desc[1])}</div>`;
    api.say(q.desc[0], q.desc[1]);
    controls.innerHTML = '';
    const btns = q.choices.map((c, i) => {
      const b = el('button', 'rd2-btn', `${c.pic ? pic(c.pic) : ''}<span>${T(c.label[0], c.label[1])}</span>`);
      b.dataset.i = String(i);
      return b;
    });
    mix(btns).forEach(b => controls.appendChild(b));
    const target = q.answer === 'any' ? btns[0] : btns[q.answer];
    api.plan(() => target, { maxActions: 6 });
    const clicked = await untilRight(api, btns, (e: HTMLElement) => q.answer === 'any' || e === target);
    if (!clicked || api.closed) return null;
    api.sfx.ding();
    api.dots(qs.length, k + 1);
    await wait(700);
  }
  api.say(done[0], done[1]);
  await wait(900);
  return api.win({ title: T(done[0], done[1]) });
}
// pick n rounds from a bank, each with its right answer and two others from the bank
function fromBank<V extends { word: string; pic: string }>(bank: V[], n: number, make: (v: V, choices: Choice[]) => Round) {
  return mix(bank).slice(0, n).map(v => {
    const others = mix(bank.filter(o => o !== v)).slice(0, 2);
    return make(v, [v, ...others].map(o => ({ label: one(o.word), pic: o.pic })));
  });
}

// 1. Blend the Sounds: hear the sounds, find the picture of the word they make
register({
  id: 'rd_blend', icon: '🔤',
  name: () => T('Blend the Sounds', 'Ghép Âm'),
  run: api => {
    const bank = isVi()
      ? [{ word: 'cá', pic: '🐟', parts: 'c - á' }, { word: 'gà', pic: '🐔', parts: 'g - à' }, { word: 'bò', pic: '🐮', parts: 'b - ò' }, { word: 'mèo', pic: '🐱', parts: 'm - è - o' }, { word: 'hoa', pic: '🌸', parts: 'h - o - a' }]
      : [{ word: 'cat', pic: '🐱', parts: 'c - a - t' }, { word: 'sun', pic: '☀️', parts: 's - u - n' }, { word: 'pig', pic: '🐷', parts: 'p - i - g' }, { word: 'dog', pic: '🐶', parts: 'd - o - g' }, { word: 'hat', pic: '🎩', parts: 'h - a - t' }];
    return runReadingRounds(api, ['Listen to the sounds and blend them into a word!', 'Nghe các âm rồi ghép thành một từ nhé!'],
      fromBank(bank, 3, (v, choices) => ({ word: v.parts, desc: ['Blend the sounds. Which picture is it?', 'Ghép các âm lại. Đó là hình nào?'], choices, answer: 0 })),
      ['Sounds blended into words!', 'Con ghép âm thành từ thật giỏi!']);
  }
});

// 2. Vowel Hats: in Vietnamese a little hat (dấu mũ) on a, e or o makes a new letter
register({
  id: 'rd_hats', icon: '🎩',
  name: () => T('Vowel Hats', 'Mũ Cho Chữ'),
  run: api => runReadingRounds(api,
    ['In Vietnamese, a little hat on a letter makes a new letter. Find the letter with the hat!', 'Đội chiếc mũ nhỏ lên chữ cái là thành chữ mới. Tìm chữ có đội mũ nhé!'],
    mix([['a', 'â', ['ă', 'à']], ['e', 'ê', ['é', 'è']], ['o', 'ô', ['ơ', 'ó']]] as [string, string, string[]][]).map(([plain, hat, others]) => ({
      word: plain, desc: [`Put a hat on "${plain}". Which letter is it?`, `Đội mũ cho chữ "${plain}". Thành chữ nào?`] as Pair,
      choices: [hat, ...others].map(l => ({ label: one(l) })), answer: 0,
    })),
    ['All letters have their friendly hats!', 'Tất cả các chữ cái đều đã có mũ xinh!'])
});

// 3. Word Endings: which word rhymes (has the same ending sound)?
register({
  id: 'rd_endings', icon: '🔚',
  name: () => T('Word Endings', 'Vần Cuối'),
  run: api => {
    const pairs = isVi()
      ? [[{ word: 'cá', pic: '🐟' }, { word: 'lá', pic: '🍃' }], [{ word: 'mèo', pic: '🐱' }, { word: 'kẹo', pic: '🍬' }], [{ word: 'hoa', pic: '🌸' }, { word: 'loa', pic: '📢' }], [{ word: 'trăng', pic: '🌙' }, { word: 'răng', pic: '🦷' }], [{ word: 'cây', pic: '🌳' }, { word: 'mây', pic: '☁️' }]]
      : [[{ word: 'cat', pic: '🐱' }, { word: 'hat', pic: '🎩' }], [{ word: 'moon', pic: '🌙' }, { word: 'spoon', pic: '🥄' }], [{ word: 'star', pic: '⭐' }, { word: 'car', pic: '🚗' }], [{ word: 'goat', pic: '🐐' }, { word: 'boat', pic: '⛵' }], [{ word: 'frog', pic: '🐸' }, { word: 'dog', pic: '🐶' }], [{ word: 'bee', pic: '🐝' }, { word: 'tree', pic: '🌳' }]];
    const picked = mix(pairs).slice(0, 3);
    return runReadingRounds(api, ['Find the word that ends with the same sound!', 'Tìm từ có cùng vần nhé!'],
      picked.map(([a, b]) => {
        const others = mix(pairs.filter(p => p[0] !== a)).slice(0, 2).map(p => p[0]);
        return { show: a.pic, word: a.word, desc: [`Which word rhymes with "${a.word}"?`, `Từ nào cùng vần với "${a.word}"?`] as Pair, choices: [b, ...others].map(o => ({ label: one(o.word), pic: o.pic })), answer: 0 };
      }),
      ['Wonderful rhyming friends!', 'Các từ cùng vần thật ăn ý!']);
  }
});

// 4. Two Words Make One
register({
  id: 'rd_compound', icon: '🧩',
  name: () => T('Two Words Make One', 'Ghép Hai Từ'),
  run: api => {
    const bank = isVi()
      ? [{ word: 'cá heo', pic: '🐬' }, { word: 'cầu vồng', pic: '🌈' }, { word: 'máy bay', pic: '✈️' }, { word: 'xe đạp', pic: '🚲' }, { word: 'hoa hồng', pic: '🌹' }, { word: 'bánh mì', pic: '🥖' }]
      : [{ word: 'sunflower', pic: '🌻' }, { word: 'rainbow', pic: '🌈' }, { word: 'jellyfish', pic: '🪼' }, { word: 'cupcake', pic: '🧁' }, { word: 'football', pic: '⚽' }, { word: 'snowman', pic: '⛄' }];
    const split = (w: string) => isVi() ? w.replace(' ', ' + ') : ({ sunflower: 'sun + flower', rainbow: 'rain + bow', jellyfish: 'jelly + fish', cupcake: 'cup + cake', football: 'foot + ball', snowman: 'snow + man' })[w];
    return runReadingRounds(api, ['Join two small words to make a new one!', 'Ghép hai từ nhỏ thành một từ mới nào!'],
      fromBank(bank, 3, (v, choices) => ({ word: split(v.word), desc: ['Put the two words together. What do they make?', 'Ghép hai từ lại. Thành từ gì?'], choices, answer: 0 })),
      ['Two words joined together!', 'Ghép từ thật chuẩn xác!']);
  }
});

// 5. Label the Picture: read the words, no pictures on them
register({
  id: 'rd_labels', icon: '🏷️',
  name: () => T('Label the Picture', 'Gắn Tên Cho Tranh'),
  run: api => {
    const bank: [string, Pair][] = [['🍎', ['apple', 'quả táo']], ['🍌', ['banana', 'quả chuối']], ['🍊', ['orange', 'quả cam']], ['🏠', ['house', 'ngôi nhà']], ['🌳', ['tree', 'cái cây']], ['⛵', ['boat', 'chiếc thuyền']], ['🚂', ['train', 'tàu hỏa']], ['🚗', ['car', 'ô tô']], ['✈️', ['plane', 'máy bay']]];
    return runReadingRounds(api, ['Read the words and find the right name for the picture!', 'Đọc chữ và tìm đúng tên cho bức tranh nhé!'],
      mix(bank).slice(0, 3).map(([p, name]) => ({ show: p, desc: ['Which word is this picture?', 'Bức tranh này là chữ nào?'] as Pair,
        choices: [name, ...mix(bank.filter(b => b[1] !== name)).slice(0, 2).map(b => b[1])].map(label => ({ label })), answer: 0 })),
      ['Every picture has its label!', 'Tranh nào cũng có tên thật đẹp!']);
  }
});

// 6. Signs in Town: read what the sign says
register({
  id: 'rd_signs', icon: '🚸',
  name: () => T('Signs in Town', 'Biển Báo Trong Phố'),
  run: api => {
    const bank: [string, Pair][] = [['🛑', ['STOP', 'DỪNG LẠI']], ['🚸', ['SCHOOL CROSSING', 'TRẺ EM QUA ĐƯỜNG']], ['🚏', ['BUS STOP', 'TRẠM XE BUÝT']], ['🏫', ['SCHOOL', 'TRƯỜNG HỌC']], ['📚', ['LIBRARY', 'THƯ VIỆN']]];
    return runReadingRounds(api, ['Read the town signs so we stay safe!', 'Đọc biển báo trên phố để luôn an toàn nhé!'],
      mix(bank).slice(0, 3).map(([p, words]) => ({ show: p, desc: ['What does this sign say?', 'Biển này ghi chữ gì?'] as Pair,
        choices: [words, ...mix(bank.filter(b => b[1] !== words)).slice(0, 2).map(b => b[1])].map(label => ({ label })), answer: 0 })),
      ['You read the town signs so well!', 'Con đọc biển báo trên phố rất giỏi!']);
  }
});

// 7. Who, What, Where: the question word tells you what kind of answer
register({
  id: 'rd_questions', icon: '❓',
  name: () => T('Who, What, Where', 'Ai, Gì, Ở Đâu'),
  run: api => runReadingRounds(api, ['Listen for the question word: Who, What or Where!', 'Nghe từ để hỏi: Ai, Cái gì hay Ở đâu!'],
    mix<Round>([
      { desc: ['WHO looks after you when you are sick?', 'AI chăm sóc con khi con bị ốm?'], choices: [{ label: ['a doctor', 'bác sĩ'], pic: '🩺' }, { label: ['a guitar', 'cây đàn'], pic: '🎸' }, { label: ['the park', 'công viên'], pic: '🏞️' }], answer: 0 },
      { desc: ['WHERE do we go to slide and swing?', 'Ở ĐÂU có xích đu và cầu trượt?'], choices: [{ label: ['the park', 'công viên'], pic: '🏞️' }, { label: ['a pillow', 'cái gối'], pic: '🛏️' }, { label: ['a doctor', 'bác sĩ'], pic: '🩺' }], answer: 0 },
      { desc: ['WHAT falls from rain clouds?', 'CÁI GÌ rơi xuống từ đám mây mưa?'], choices: [{ label: ['raindrops', 'hạt mưa'], pic: '💧' }, { label: ['stones', 'hòn đá'], pic: '🪨' }, { label: ['bread', 'bánh mì'], pic: '🍞' }], answer: 0 },
      { desc: ['WHERE do fish live?', 'Cá sống Ở ĐÂU?'], choices: [{ label: ['in the water', 'dưới nước'], pic: '💧' }, { label: ['a teacher', 'cô giáo'], pic: '🏫' }, { label: ['a spoon', 'cái thìa'], pic: '🥄' }], answer: 0 },
    ]).slice(0, 3),
    ['You know Who, What and Where!', 'Con hiểu rõ Ai, Cái gì, Ở đâu rồi!'])
});

// 8. One and Many: read which words match one thing or many
register({
  id: 'rd_many', icon: '🔢',
  name: () => T('One and Many', 'Một và Nhiều'),
  run: api => {
    const things: [string, string, string, string][] = [['🐱', 'cat', 'cats', 'con mèo'], ['🌸', 'flower', 'flowers', 'bông hoa'], ['⭐', 'star', 'stars', 'ngôi sao'], ['🐶', 'dog', 'dogs', 'con chó'], ['🍎', 'apple', 'apples', 'quả táo']];
    const words = ['', 'one', 'two', 'three', 'four'], so = ['', 'một', 'hai', 'ba', 'bốn'];
    return runReadingRounds(api, ['Read the words that match the picture: one, or many?', 'Đọc chữ hợp với bức tranh: một, hay nhiều?'],
      mix(things).slice(0, 3).map(([p, a, many, vi], i) => {
        const n = i === 1 ? 1 : 2 + Math.floor(Math.random() * 3), m = n === 1 ? 2 + Math.floor(Math.random() * 3) : 1;
        const label = (k: number): Pair => [`${words[k]} ${k === 1 ? a : many}`, `${so[k]} ${vi}`];
        return { word: pic(p).repeat(n), desc: ['Which words match the picture?', 'Chữ nào hợp với bức tranh?'] as Pair, choices: [{ label: label(n) }, { label: label(m) }], answer: 0 };
      }),
      ['One and many, read just right!', 'Một và nhiều, con đọc thật đúng!']);
  }
});

// 9. Big and Small Letters
register({
  id: 'rd_caps', icon: '🔠',
  name: () => T('Big and Small Letters', 'Chữ Hoa Chữ Thường'),
  run: api => {
    // letters that look alike in small form, so the choice needs looking
    const sets = [['B', 'b', 'd', 'p'], ['M', 'm', 'n', 'w'], ['A', 'a', 'o', 'e'], ['G', 'g', 'q', 'y'], ['H', 'h', 'n', 'k'], ['D', 'd', 'b', 'q'], ['E', 'e', 'c', 'a']];
    return runReadingRounds(api, ['Match the big letter with its small letter!', 'Tìm chữ thường đi cùng chữ hoa nhé!'],
      mix(sets).slice(0, 4).map(([big, ...small]) => ({ word: big, desc: [`Big ${big}. Which is small ${big.toLowerCase()}?`, `Chữ hoa ${big}. Chữ thường nào đi cùng?`] as Pair, choices: small.map(s => ({ label: one(s) })), answer: 0 })),
      ['Capital and small letters matched!', 'Chữ hoa chữ thường ghép đôi thật khớp!']);
  }
});

// 10. Read a Little Poem: the missing word rhymes
register({
  id: 'rd_poem', icon: '📜',
  name: () => T('Read a Little Poem', 'Đọc Bài Thơ Nhỏ'),
  run: api => runReadingRounds(api, ['Finish each line of the little poem with a word that rhymes!', 'Điền từ còn thiếu cho đúng vần bài thơ nhỏ nhé!'],
    mix<Round>([
      { show: '⭐', desc: ['"Twinkle, little star at night, shining with your friendly..."', '"Ngôi sao nhỏ ở trên trời, lung linh tỏa sáng khắp..."'], choices: [{ label: ['light', 'nơi'] }, { label: ['tree', 'cây'] }, { label: ['shoe', 'giày'] }], answer: 0 },
      { show: '🐸', desc: ['"Little green frog sitting on a log, jumping in the muddy..."', '"Chú ếch xanh ngồi bên hồ, cất lời hát ca líu..."'], choices: [{ label: ['bog', 'lo'] }, { label: ['cloud', 'mây'] }, { label: ['bed', 'giường'] }], answer: 0 },
      { show: '🐝', desc: ['"Busy little bee, buzzing round the..."', '"Ong vàng bay khắp vườn hoa, chăm chỉ hút mật gần..."'], choices: [{ label: ['tree', 'xa'] }, { label: ['moon', 'trăng'] }, { label: ['spoon', 'thìa'] }], answer: 0 },
    ]),
    ['The little poem sounds so sweet!', 'Bài thơ nhỏ ngân vang thật êm đềm!'])
});

// 11. Missing Letter: look at the picture, find the letter that fills the gap
register({
  id: 'rd_missing', icon: '🧩',
  name: () => T('Missing Letter', 'Điền Chữ Còn Thiếu'),
  run: api => {
    const bank: [string, string, string, string[]][] = isVi()
      ? [['🐱', 'm _ o', 'è', ['a', 'u']], ['🌸', 'h _ a', 'o', ['e', 'i']], ['✏️', 'b _ t', 'ú', ['ô', 'a']], ['⭐', 's _ o', 'a', ['u', 'ê']], ['🐮', 'b _', 'ò', ['à', 'ú']]]
      : [['🐱', 'c _ t', 'a', ['o', 'u']], ['☀️', 's _ n', 'u', ['a', 'i']], ['🐶', 'd _ g', 'o', ['e', 'a']], ['🐷', 'p _ g', 'i', ['o', 'u']], ['🎩', 'h _ t', 'a', ['i', 'e']]];
    return runReadingRounds(api, ['Look at the picture and fill in the missing letter!', 'Nhìn tranh và điền chữ cái còn thiếu nhé!'],
      mix(bank).slice(0, 3).map(([p, gap, right, others]) => ({ show: p, word: gap, desc: ['Which letter is missing?', 'Thiếu chữ cái nào?'] as Pair, choices: [right, ...others].map(l => ({ label: one(l) })), answer: 0 })),
      ['You found every missing letter!', 'Con tìm đủ mọi chữ cái còn thiếu!']);
  }
});

// 12. Make a Little Book (kept in the Album): every choice is the child's own
register({
  id: 'rd_book', icon: '📖',
  name: () => T('Make a Little Book', 'Làm Sách Nhỏ'),
  async run(api) {
    const picks: string[] = [];
    const covers: [string, Pair][] = [['☀️', ['Sunny Valley', 'Thung Lũng Nắng']], ['🌙', ['Starry Night', 'Đêm Đầy Sao']]];
    const friends: [string, Pair][] = [['🐱', ['Friendly pets', 'Thú cưng nhỏ']], ['🐣', ['Baby birds', 'Chim non']], ['🐸', ['Pond friends', 'Bạn bên hồ']]];
    const ribbons: [string, Pair][] = [['🎀', ['Pink ribbon', 'Ruy băng hồng']], ['⭐', ['Star sticker', 'Hình dán ngôi sao']]];
    const rounds: Round[] = [
      { show: '📖', desc: ['Choose a cover for your book.', 'Chọn trang bìa cho cuốn sách.'], choices: covers.map(([p, label]) => ({ label, pic: p })), answer: 'any' },
      { show: '🐾', desc: ['Who is in your story?', 'Ai có trong câu chuyện của con?'], choices: friends.map(([p, label]) => ({ label, pic: p })), answer: 'any' },
      { show: '✨', desc: ['How shall we close the book?', 'Mình đóng sách bằng gì nhé?'], choices: ribbons.map(([p, label]) => ({ label, pic: p })), answer: 'any' },
    ];
    // remember each choice as it is made, for the keepsake page
    const all = [covers, friends, ribbons];
    const watch = (e: Event) => { const b = e.target instanceof Element ? e.target.closest('.rd2-btn') : null; if (b instanceof HTMLElement) picks[picks.length] = all[picks.length]?.[+b.dataset.i]?.[0] || ''; };
    api.stage.addEventListener('click', watch);
    const result = await runReadingRounds(api, ['Make your own little picture book and keep it in your Album!', 'Tự tay làm cuốn sách tranh nhỏ và lưu vào Album nhé!'], rounds, ['Your little book is kept in your Album!', 'Cuốn sách nhỏ của con đã được lưu vào Album rồi!']);
    api.stage.removeEventListener('click', watch);
    if (result !== null) await drawKeepsake(api, picks.filter(Boolean));
    return result;
  }
});
// the keepsake page, drawn with our own pictures (never phone emoji on a canvas)
async function drawKeepsake(api: any, icons: string[]) {
  const canvas = document.createElement('canvas');
  canvas.width = 320; canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#fff9eb'; ctx.fillRect(0, 0, 320, 240);
  ctx.lineWidth = 8; ctx.strokeStyle = '#6f4b35'; ctx.strokeRect(4, 4, 312, 232);
  ctx.fillStyle = '#3f2b24'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(T('My Little Book', 'Cuốn Sách Của Em'), 160, 50);
  ctx.font = '16px sans-serif';
  ctx.fillText(T('Sparkle Valley Reading', 'Tủ Sách Thung Lũng'), 160, 210);
  const list = ['📖', ...icons].slice(0, 4);
  await Promise.all(list.map((icon, i) => new Promise<void>(done => {
    const svg = artSVG(icon); if (!svg) { done(); return; }
    const im = new Image();
    im.onload = () => { ctx.drawImage(im, 160 - list.length * 32 + i * 64 + 4, 90, 56, 56); done(); };
    im.onerror = () => done();
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  })));
  try { keep(api, canvas.toDataURL('image/png')); } catch { /* a canvas that cannot be saved keeps nothing */ }
}
