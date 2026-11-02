// (r79 learning, owner 16 Oct AEDT: "more interactive learning games: the child talks and touches, and hears back")
// Four talk-and-touch learning games with the valley's own pictures, voice and frame:
//   Say It, Find It (3-6): hear a word and tap its picture, or say the word into the microphone and hear it back
//   Market Counting (3-7): drag (or tap) fruit into the basket while each one is counted aloud
//   How Do They Feel? (3-6): a short story about Lá, then the face that shows how she feels (this replaces the older
//     game of the same name and id, so a child's progress in it stays)
//   First Sound Hunt (4-7): hear "b... ball" and tap every picture that starts (on Hard: ends, or in Vietnamese: has the
//     same tone) the same way
// Same gentle rules as every learning game: no timers, nothing lost, a wrong tap says why. The level follows the child
// (api.tier / api.nextRound), the most-missed word or story comes back first (api.favour / api.missed / api.got).
import { register, choiceButtons, untilRight, playWatch } from './frame.js';
import { T, NUMBER_WORDS } from '../i18n.js';
import { pic } from '../art.js';
import { el, shuffle, wait } from '../util.js';
import { sayAsync, spoken } from '../voice.js';
import { settings } from '../state.js';
import { canListen, listen, stopListening } from '../listen.js';

import { TALK_INTRO as INTRO } from './learning-meta.js';
const tier = api => api.tier ? api.tier() : api.little ? 0 : api.level >= 3 ? 3 : api.level >= 2 ? 2 : 1;
const nextRound = api => api.nextRound ? api.nextRound() : tier(api);
const favour = (api, list, key) => api.favour ? api.favour(list, key) : list;
const pick = (list, n) => shuffle(list).slice(0, n);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const isVi = () => settings.lang === 'vi';

// Spoken lines one after another (each its own recording), shown together on the question line. A newer talk() stops
// an older one between its lines.
let talking = 0;
async function talk(api, ...lines) {
  const my = ++talking;
  api.show(lines.map(l => l[0]).join(' '), lines.map(l => l[1] ?? l[0]).join(' '));
  // (r80) each line also goes to the captions, as say() does: sayAsync alone left these games without captions, and the
  // a11y check (every game speaks its instruction to an under-5) heard nothing from First Sound Hunt
  for (const [en, vi] of lines) { if (my !== talking || api.closed) return; const t = isVi() ? (vi ?? en) : en; spoken.forEach(f => { try { f(t); } catch (e) { } }); await sayAsync(en, vi); }
}
// a wrong tap: the frame's gentle "no" (sound, wiggle, Ông Cú), then the explanation, spoken and shown
const wrongWhy = (api, e, ...lines) => { api.wrong(e, null); talk(api, ...lines); };
function repeat(api, line) {
  const button = el('button', 'btn bt-repeat', pic('🔁') + T('Hear again', 'Nghe lại'));
  button.style.minHeight = '64px'; button.onclick = () => talk(api, line()); api.stage.appendChild(button); return button;
}
async function untilRightWith<E extends Element>(api: any, els: E[], check: (e: E) => boolean, why: (e: E) => any): Promise<E | null> {
  const wrong = api.wrong;
  api.wrong = function onWrong(e: E) { api.wrong = wrong; try { wrongWhy(api, e, ...why(e)); } finally { api.wrong = onWrong; } };
  try { return await untilRight(api, els, check); } finally { api.wrong = wrong; }
}

// ---------- Say It, Find It ----------
// picture, English word, Vietnamese word (with its classifier), what the English and Vietnamese say it looks like
type TalkWord = [string, string, string, string, string];
type PictureItem = { w: TalkWord; size: string };
const WORDS: TalkWord[] = [
  ['🥭', 'mango', 'quả xoài', 'yellow-green and shaped like a big bean', 'màu vàng xanh, hình như hạt đậu to'],
  ['🍌', 'banana', 'quả chuối', 'long, curved and yellow', 'dài, cong và màu vàng'],
  ['🍎', 'apple', 'quả táo', 'round and red', 'tròn và màu đỏ'],
  ['🍉', 'watermelon', 'quả dưa hấu', 'big and green, and red inside', 'to, vỏ xanh, ruột đỏ'],
  ['🍇', 'bunch of grapes', 'chùm nho', 'small, round and purple', 'nhỏ, tròn và màu tím'],
  ['🍓', 'strawberry', 'quả dâu tây', 'red with tiny seeds', 'màu đỏ, có hạt nhỏ li ti'],
  ['🐶', 'dog', 'con chó', 'furry with floppy ears and a waggy tail', 'có tai cụp và đuôi ngoe nguẩy'],
  ['🐱', 'cat', 'con mèo', 'soft with whiskers', 'mềm mại và có ria mép'],
  ['🐦', 'bird', 'con chim', 'small with wings and feathers', 'nhỏ, có cánh và lông vũ'],
  ['🐟', 'fish', 'con cá', 'the one that swims in the water', 'con bơi dưới nước'],
  ['🚲', 'bicycle', 'xe đạp', 'the one with two wheels and pedals', 'cái có hai bánh và bàn đạp'],
  ['⚽', 'ball', 'quả bóng', 'round and it bounces', 'tròn và nảy lên được'],
  ['🎈', 'balloon', 'quả bóng bay', 'floating up on a string', 'bay lên, có buộc dây'],
  ['🌸', 'flower', 'bông hoa', 'pink with soft petals', 'màu hồng, cánh mềm'],
  ['☂️', 'umbrella', 'cái ô', 'the one that keeps the rain off', 'cái che mưa cho mình'],
  ['🐢', 'turtle', 'con rùa', 'slow, with a shell on its back', 'đi chậm và có mai trên lưng']
];
const an = w => (/^[aeiou]/.test(w) ? 'an ' : 'a ') + w;
// the word itself, without its Vietnamese classifier, for what the microphone heard
const bareVi = w => w.replace(/^(quả|con|chùm|bông|cái|xe) /, w.startsWith('xe ') ? 'xe ' : '');
register({ id: 'sayfind', icon: '🗣️', learn: true, name: () => T('Say It, Find It', 'Nói Rồi Tìm'), async run(api) {
  const start = tier(api), rounds = start === 0 ? 4 : api.talent ? 6 : 5;   // (levels) Talent: six rounds of eight pictures
  const order = favour(api, shuffle(WORDS), w => w[1]);
  // (v1.07 levels) the starting values on the frame: rounds, pictures, two of the same thing (big and little)
  api.stage.dataset.lv = [rounds, [2, 4, 6, 6][start] + (api.talent ? 2 : 0), start === 3 ? 1 : 0].join(',');
  let micOn = canListen(), round = 0;
  api.onCleanup(stopListening);
  for (; round < rounds; round++) {
    if (api.closed) return; api.dots(rounds, round); api.stage.innerHTML = '';
    const level = round ? nextRound(api) : tier(api), target = order[round % order.length];
    // 2, 4 or 6 pictures; on Hard two of them are the same thing, big and little, and the ask has two words
    const n = [2, 4, 6, 6][level] + (api.talent ? 2 : 0), two = level === 3, size = two ? (Math.random() < .5 ? 'big' : 'little') : '';
    const others = pick(WORDS.filter(w => w !== target), two ? n - 2 : n - 1).map(w => ({ w, size: '' }));
    const items: PictureItem[] = shuffle([{ w: target, size }, ...(two ? [{ w: target, size: size === 'big' ? 'little' : 'big' }] : []), ...others]);
    const sizeVi = s => s === 'big' ? 'to' : 'nhỏ';
    const ask = () => two ? [`Where is the ${size} ${target[1]}?`, `${cap(target[2])} ${sizeVi(size)} ở đâu?`] : [`Where is the ${target[1]}?`, `${cap(target[2])} ở đâu?`];
    const buttons = choiceButtons<PictureItem>(api, items, it => pic(it.w[0]), 'choice sf-pic');
    buttons.forEach(b => { if (b._v.size === 'little') b.classList.add('sf-little'); b.setAttribute('aria-label', T((b._v.size ? b._v.size + ' ' : '') + b._v.w[1], b._v.w[2] + (b._v.size ? ' ' + sizeVi(b._v.size) : ''))); });
    const tools = el('div', 'sf-tools'); api.stage.appendChild(tools);
    const old = api.stage; api.stage = tools; repeat(api, ask); api.stage = old;
    // the microphone is optional: without one (or without permission) the button is not there and tapping works
    if (micOn) {
      const mic = el('button', 'btn sf-mic', pic('🎤') + `<span>${T('Say it', 'Nói thử')}</span>`); mic.style.minHeight = '64px'; tools.appendChild(mic);
      let busy = false;
      mic.onclick = async () => {
        if (busy) return; busy = true; mic.classList.add('on'); mic.querySelector('span').textContent = T('Listening…', 'Đang nghe…');
        const heard = (await listen({ lang: settings.lang })).toLowerCase();
        busy = false; if (!mic.isConnected || api.closed) return; mic.classList.remove('on'); mic.querySelector('span').textContent = T('Say it', 'Nói thử');
        if (heard === '\u0000denied') { micOn = false; mic.remove(); return talk(api, ['The microphone is off. Tap the picture instead.', 'Micrô đang tắt. Con chạm vào hình nhé.']); }
        const said = buttons.find(b => heard.includes(b._v.w[1].replace('bunch of ', '')) || heard.includes(bareVi(b._v.w[2])));
        if (!said) return talk(api, ['I did not hear a word I know. Say it again, or tap the picture.', 'Mình chưa nghe rõ. Con nói lại, hoặc chạm vào hình nhé.']);
        // the child hears their word back; the right word (and, on Hard, the right size) counts as a tap
        const wantSize = !two || heard.includes(size) || heard.includes(sizeVi(size));
        if (said._v.w === target && wantSize) { await talk(api, [`You said ${target[1]}!`, `Con nói ${bareVi(target[2])}!`]); const right = buttons.find(b => b._v.w === target && b._v.size === size); if (right && right.isConnected) right.click(); return; }
        said.classList.add('hint'); setTimeout(() => said.classList.remove('hint'), 1600);
        talk(api, [`You said ${said._v.w[1]}.`, `Con nói ${bareVi(said._v.w[2])}.`], ask());
      };
    }
    talk(api, ask());
    let missedIt = false;
    const why = e => {
      if (!missedIt && api.missed) api.missed(target[1]); missedIt = true;
      const t = e._v;
      if (t.w === target) return [[`That is the ${t.size} ${target[1]}.`, `Đó là ${target[2]} ${sizeVi(t.size)}.`], [`Find the ${size} ${target[1]}.`, `Tìm ${target[2]} ${sizeVi(size)} nhé.`]];
      return [[`That is ${an(t.w[1])}.`, `Đó là ${t.w[2]}.`], [`The ${target[1]} is ${target[3]}.`, `${cap(target[2])} ${target[4]}.`]];
    };
    const got = await untilRightWith(api, buttons, b => b._v.w === target && b._v.size === size, why);
    if (!got) return;
    if (!missedIt && api.got) api.got(target[1]);
    await talk(api, two ? [`Yes! The ${size} ${target[1]}!`, `Đúng rồi! ${cap(target[2])} ${sizeVi(size)}!`] : [`Yes! The ${target[1]}!`, `Đúng rồi! ${cap(target[2])}!`]);
    await wait(500);
  }
  return api.win();
} });

// ---------- Market Counting ----------
const FRUIT = [['🥭', 'mango', 'mangoes', 'quả xoài'], ['🍎', 'apple', 'apples', 'quả táo'], ['🍊', 'orange', 'oranges', 'quả cam'], ['🍐', 'pear', 'pears', 'quả lê'], ['🍌', 'banana', 'bananas', 'quả chuối'], ['🍓', 'strawberry', 'strawberries', 'quả dâu']];
const num = n => [cap(NUMBER_WORDS.en[n] ?? String(n)), cap(NUMBER_WORDS.vi[n] ?? String(n))];
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
register({ id: 'marketcount', icon: '🧺', learn: true, name: () => T('Market Counting', 'Đếm Ở Chợ'), async run(api) {
  const start = tier(api), rounds = start === 0 ? 3 : 4;
  // (v1.07 levels) the starting values on the frame: rounds, what is asked, how much fruit (count up to, or the first basket)
  api.stage.dataset.lv = [rounds, start < 3 ? 'count' : 'add-take', start < 3 ? ['1-3', '2-5', '5-10'][start] : api.talent ? '5-8/6-10' : '2-5/3-6'].join(',');
  for (let round = 0; round < rounds; round++) {
    if (api.closed) return; api.dots(rounds, round); api.stage.innerHTML = '';
    const level = round ? nextRound(api) : tier(api), f = FRUIT[(round + Math.floor(Math.random() * FRUIT.length)) % FRUIT.length];
    // up to 3 for under-5s, up to 5 on Easy, up to 10 on Medium; Hard adds 2 more or takes 1 away from a full basket
    const mode = level < 3 ? 'count' : round % 2 ? 'take' : 'add';
    // (levels) Talent: bigger baskets to add to or take from, and more fruit on the stall
    const first = mode === 'add' ? (api.talent ? rnd(5, 8) : rnd(2, 5)) : mode === 'take' ? (api.talent ? rnd(6, 10) : rnd(3, 6)) : 0;
    const target = mode === 'add' ? first + 2 : mode === 'take' ? first - 1 : [rnd(1, 3), rnd(2, 5), rnd(5, 10), 0][level];
    const onStall = mode === 'count' ? target + Math.max(2, Math.min(3, 12 - target)) : mode === 'add' ? (api.talent ? 5 : 3) : 0;
    const name = n => n === 1 ? f[1] : f[2];
    const ask = () => mode === 'add' ? [`There are ${first} ${name(first)}. Add 2 more.`, `Có ${NUMBER_WORDS.vi[first]} ${f[3]}. Bỏ thêm hai quả nữa.`]
      : mode === 'take' ? [`There are ${first} ${name(first)}. Take 1 away.`, `Có ${NUMBER_WORDS.vi[first]} ${f[3]}. Lấy ra một quả.`]
      : [`Put ${target} ${name(target)} in the basket.`, `Bỏ ${NUMBER_WORDS.vi[target]} ${f[3]} vào giỏ.`];
    const sign = el('div', 'mc-sign', mode === 'count' ? `<b>${target}</b>${pic(f[0])}` : `<b>${first} ${mode === 'add' ? '+' : '−'} ${mode === 'add' ? 2 : 1}</b>${pic(f[0])}`);
    const basket = el('div', 'mc-basket'); basket.setAttribute('aria-label', T('Basket', 'Cái giỏ'));
    basket.appendChild(el('span', 'mc-label', pic('🧺')));
    const stall = el('div', 'mc-stall'); stall.setAttribute('aria-label', T('Fruit stall', 'Sạp trái cây'));
    const done = el('button', 'btn mc-done', pic('✅') + T("That's it!", 'Xong rồi!')); done.style.minHeight = '64px';
    // everything of this round sits in its own box, so its taps and drags end with the round
    const box = el('div', 'mc-round'); box.append(sign, basket, stall); api.stage.appendChild(box);
    const tools = el('div', 'sf-tools'); tools.appendChild(done); box.appendChild(tools);
    const old = api.stage; api.stage = tools; repeat(api, ask); api.stage = old;
    const fruit = () => { const b = el('button', 'choice mc-fruit', pic(f[0])); b.setAttribute('aria-label', T(f[1], f[3])); b.type = 'button'; return b; };
    for (let i = 0; i < first; i++) basket.appendChild(fruit());
    for (let i = 0; i < onStall; i++) stall.appendChild(fruit());
    const inBasket = () => [...basket.querySelectorAll('.mc-fruit')], onStallNow = () => [...stall.querySelectorAll('.mc-fruit')];
    const clearMarks = () => { basket.querySelectorAll('.mc-gap').forEach(g => g.remove()); basket.querySelectorAll('.extra').forEach(g => g.classList.remove('extra')); };
    // each fruit put in (or taken out) is counted aloud
    const move = b => {
      clearMarks();
      if (b.parentNode === stall) { basket.appendChild(b); const n = inBasket().length; talk(api, num(n)); }
      else { stall.appendChild(b); const n = inBasket().length; talk(api, num(n)); }
      api.sfx.tap && api.sfx.tap(); arm();
    };
    let resolve; const finished = new Promise(r => { resolve = r; api.onCleanup(() => { if (playWatch.ask && playWatch.ask.els.includes(done)) playWatch.ask = null; r(false); }); });
    // the auto play check (and the tests) see every fruit and the button as choices, the right one being the next good move
    const arm = () => {
      const n = inBasket().length;
      const els = [...onStallNow(), ...inBasket(), done];
      playWatch.ask = { els, check: b => b === done ? n === target : b.parentNode === stall ? n < target : n > target };
    };
    // a fruit can be tapped, or dragged into the basket (and back out)
    let drag = null, dragged = false;
    const down = e => { const b = e.target.closest && e.target.closest('.mc-fruit'); if (!b) return; drag = { b, x: e.clientX, y: e.clientY, on: false }; };
    const over = e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.on && Math.hypot(dx, dy) > 10) drag.on = true; if (drag.on) { e.preventDefault(); drag.b.style.transform = `translate(${dx}px, ${dy}px)`; drag.b.style.zIndex = '6'; } };
    const up = e => {
      if (!drag) return; const d = drag; drag = null; d.b.style.transform = ''; d.b.style.zIndex = '';
      if (!d.on) return; dragged = true; setTimeout(() => { dragged = false; }, 0);
      const r = basket.getBoundingClientRect(), inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if ((d.b.parentNode === stall) === inside) move(d.b);
    };
    box.addEventListener('pointerdown', down); document.addEventListener('pointermove', over, { passive: false }); document.addEventListener('pointerup', up);
    const unhook = () => { document.removeEventListener('pointermove', over); document.removeEventListener('pointerup', up); };
    api.onCleanup(unhook);
    box.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.mc-fruit'); if (!b || dragged) return; move(b); });
    let missedIt = false;
    done.onclick = async () => {
      const n = inBasket().length;
      if (n === target) { playWatch.ask = null; api.right(done); resolve(true); return; }
      // too many or too few: the basket counts out loud and shows the gap
      if (!missedIt && api.missed) api.missed(mode === 'count' ? 'count' + target : mode); missedIt = true;
      clearMarks();
      if (n > target) inBasket().slice(target).forEach(b => b.classList.add('extra'));
      else for (let i = n; i < target; i++) basket.appendChild(el('span', 'mc-gap', ''));
      const d = Math.abs(n - target);
      const counted = n ? Array.from({ length: n }, (_, i) => num(i + 1)) : [['The basket is empty.', 'Giỏ chưa có quả nào.']];
      wrongWhy(api, done, ...counted, [`We need ${NUMBER_WORDS.en[target]}.`, `Mình cần ${NUMBER_WORDS.vi[target]}.`],
        n > target ? [`Take ${NUMBER_WORDS.en[d]} out.`, `Lấy ra ${NUMBER_WORDS.vi[d]} quả.`] : [`Put in ${NUMBER_WORDS.en[d]} more.`, `Bỏ thêm ${NUMBER_WORDS.vi[d]} quả.`]);
      arm();
    };
    api.plan(() => { const ask0 = playWatch.ask; return ask0 ? ask0.els.find(b => ask0.check(b)) : null; });
    arm(); talk(api, ask());
    if (round === 0 && api.hand) api.hand(mode === 'take' ? inBasket()[0] : onStallNow()[0]);
    const ended = await finished; unhook();
    if (!ended || api.closed) return;
    if (!missedIt && api.got) api.got(mode === 'count' ? 'count' + target : mode);
    await talk(api, [`${num(target)[0]} ${name(target)}! Well done.`, `${num(target)[1]} ${f[3]}! Giỏi lắm.`]);
    await wait(500);
  }
  return api.win();
} });

// ---------- How Do They Feel? ----------
const FACES: Record<string, [string, string, string]> = { happy: ['😀', 'happy', 'vui'], sad: ['😢', 'sad', 'buồn'], surprised: ['😲', 'surprised', 'ngạc nhiên'], cross: ['😠', 'cross', 'giận'] };
// a little story about Lá, the face it goes with, why (said after a wrong face), and what could help (Medium and Hard)
const FEEL = [
  { id: 'icecream', face: 'sad', pic: '🍦', en: 'Lá dropped her ice cream.', vi: 'Lá làm rơi cây kem.', why: ['Would you smile if your ice cream fell?', 'Nếu kem của con bị rơi, con có cười không?'], help: ['🍦', 'Share your ice cream', 'Chia kem cho Lá'], helpWhy: ['Sharing can help when someone is sad.', 'Chia sẻ giúp bạn bớt buồn.'] },
  { id: 'balloon', face: 'sad', pic: '🎈', en: 'Lá’s balloon flew away.', vi: 'Bóng bay của Lá bay mất rồi.', why: ['Her balloon is gone. Would you laugh?', 'Bóng bay mất rồi. Con có cười không?'], help: ['🤗', 'Give her a hug', 'Ôm Lá một cái'], helpWhy: ['A hug can help when someone is sad.', 'Một cái ôm giúp bạn bớt buồn.'] },
  { id: 'hug', face: 'happy', pic: '👵', en: 'Grandma gave Lá a big hug.', vi: 'Bà ôm Lá thật chặt.', why: ['Would you cry if Grandma hugged you?', 'Được bà ôm, con có khóc không?'], help: ['😀', 'Smile and hug her back', 'Cười và ôm lại bà'], helpWhy: ['Hugging back shares the happy feeling.', 'Ôm lại bà để cùng vui nhé.'] },
  { id: 'puppy', face: 'happy', pic: '🐶', en: 'Lá’s puppy licked her face.', vi: 'Cún con liếm mặt Lá.', why: ['Puppy kisses are fun! Would you be cross?', 'Cún hôn vui lắm! Con có giận không?'], help: ['⚽', 'Play ball with the puppy', 'Chơi bóng với cún'], helpWhy: ['Playing together keeps the fun going.', 'Cùng chơi cho vui hơn nhé.'] },
  { id: 'present', face: 'surprised', pic: '🎁', en: 'Lá found a present on the doorstep.', vi: 'Lá thấy một món quà trước cửa.', why: ['She did not know it was there!', 'Lá không biết là có quà!'], help: ['🎁', 'Open it together', 'Cùng mở quà'], helpWhy: ['Let us find out what is inside, together.', 'Cùng xem bên trong có gì nhé.'] },
  { id: 'rainbow', face: 'surprised', pic: '🌈', en: 'A rainbow came out after the rain.', vi: 'Cầu vồng hiện ra sau cơn mưa.', why: ['Lá did not expect it!', 'Lá không ngờ có cầu vồng!'], help: ['👆', 'Show it to a friend', 'Chỉ cho bạn xem'], helpWhy: ['A surprise is fun to share.', 'Điều bất ngờ thì chia sẻ cho vui.'] },
  { id: 'tower', face: 'cross', pic: '🧱', en: 'Someone knocked down Lá’s tower.', vi: 'Có bạn làm đổ tháp xếp hình của Lá.', why: ['Would you laugh if your tower fell?', 'Tháp của con bị đổ, con có cười không?'], help: ['🧱', 'Build it again together', 'Cùng xây lại tháp'], helpWhy: ['Building it again together can help.', 'Cùng xây lại sẽ giúp Lá bớt giận.'] },
  { id: 'toy', face: 'cross', pic: '🧸', en: 'Lá’s brother took her toy without asking.', vi: 'Em trai lấy đồ chơi của Lá mà không hỏi.', why: ['That is not fair! Would you smile?', 'Như vậy không công bằng! Con có cười không?'], help: ['🗣️', 'Ask him kindly to give it back', 'Nhờ em trả lại thật nhẹ nhàng'], helpWhy: ['Asking kindly can help.', 'Nhờ nhẹ nhàng sẽ giúp được.'] }
];
// things that do not help (silly, never unkind), offered beside the real help
const NOT_HELP = [['😴', 'Go to sleep', 'Đi ngủ'], ['🍌', 'Eat a banana', 'Ăn chuối'], ['🪁', 'Fly a kite far away', 'Đi thả diều thật xa']];
register({ id: 'feelings', icon: '😊', learn: true, name: () => T('How Do They Feel?', 'Bạn Thấy Thế Nào?'), async run(api) {
  const start = tier(api), rounds = start === 0 ? 3 : 4;
  const order = favour(api, shuffle(FEEL), s => s.id);
  // (v1.07 levels) the starting values on the frame: rounds, faces, words under them, "what could you do?" choices (0: none)
  api.stage.dataset.lv = [rounds, start === 0 ? 2 : 4, start === 0 || api.talent ? 0 : 1, start < 2 ? 0 : 1 + (api.talent ? 3 : start === 3 ? 2 : 1)].join(',');
  for (let round = 0; round < rounds; round++) {
    if (api.closed) return; api.dots(rounds, round); api.stage.innerHTML = '';
    const level = round ? nextRound(api) : tier(api), story = order[round % order.length], face = FACES[story.face];
    api.stage.appendChild(el('div', 'fs-card', `<span class="fs-kid">${pic('👧')}</span><span class="fs-pic">${pic(story.pic)}</span>`));
    // 2 faces for under-5s (the right one and a very different one), all 4 from Easy
    const opposite = { happy: 'sad', sad: 'happy', surprised: 'cross', cross: 'happy' }[story.face];
    const faces: string[] = level === 0 ? shuffle([story.face, opposite]) : shuffle(Object.keys(FACES));
    // (levels) Talent: the faces have no words under them, and every "what could you do?" choice is offered
    const ask = () => [`${story.en} How does Lá feel?`, `${story.vi} Lá cảm thấy thế nào?`];
    const buttons = choiceButtons<string>(api, faces, k => `${pic(FACES[k][0])}${level === 0 || api.talent ? '' : `<small>${T(FACES[k][1], FACES[k][2])}</small>`}`, 'choice fs-face');
    buttons.forEach(b => b.setAttribute('aria-label', T(FACES[b._v][1], FACES[b._v][2])));
    const again = repeat(api, ask);
    talk(api, ask());
    let missedIt = false;
    const why = () => { if (!missedIt && api.missed) api.missed(story.id); missedIt = true; return [story.why, [`Lá feels ${face[1]}.`, `Lá thấy ${face[2]}.`]]; };
    if (!await untilRightWith(api, buttons, b => b._v === story.face, why)) return;
    await talk(api, [`Yes! Lá feels ${face[1]}.`, `Đúng rồi! Lá thấy ${face[2]}.`]);
    // Medium and Hard: what could you do? (2 choices on Medium, 3 on Hard)
    if (level >= 2 && !api.closed) {
      await wait(400); if (api.closed) return;
      api.stage.querySelector('.choices')?.remove(); again.remove();
      const helps = shuffle([story.help, ...pick(NOT_HELP, api.talent ? 3 : level === 3 ? 2 : 1)]);
      const ask2 = () => ['What could you do?', 'Con có thể làm gì?'];
      const hb = choiceButtons(api, helps, h => `${pic(h[0])}<small>${T(h[1], h[2])}</small>`, 'choice fs-help');
      hb.forEach(b => b.setAttribute('aria-label', T(b._v[1], b._v[2])));
      repeat(api, ask2); talk(api, ask2());
      const why2 = () => { if (!missedIt && api.missed) api.missed(story.id); missedIt = true; return [['That will not help Lá right now.', 'Việc đó chưa giúp được Lá đâu.'], story.helpWhy]; };
      if (!await untilRightWith(api, hb, b => b._v === story.help, why2)) return;
      await talk(api, story.helpWhy);
    }
    if (!missedIt && api.got) api.got(story.id);
    await wait(600);
  }
  return api.win();
} });

// ---------- First Sound Hunt ----------
// English: words by their first sound (as heard: cat and kite start the same) and, on Hard, by their last sound.
// Vietnamese: words by their first sound and, on Hard, by their tone. Only one language's words in a game.
const EN_START = { b: [['⚽', 'ball'], ['🍌', 'banana'], ['🐦', 'bird'], ['🐝', 'bee'], ['🚌', 'bus'], ['🐻', 'bear']], d: [['🐶', 'dog'], ['🦆', 'duck'], ['🥁', 'drum'], ['🐬', 'dolphin']],
  f: [['🐟', 'fish'], ['🐸', 'frog'], ['🌸', 'flower'], ['🦊', 'fox']], m: [['🌙', 'moon'], ['🥭', 'mango'], ['🐵', 'monkey'], ['🐭', 'mouse']], s: [['☀️', 'sun'], ['⭐', 'star'], ['🐌', 'snail'], ['🧦', 'sock']],
  k: [['🐱', 'cat'], ['🐄', 'cow'], ['🪁', 'kite'], ['🎂', 'cake']], t: [['🌳', 'tree'], ['🐢', 'turtle'], ['🚂', 'train'], ['🐯', 'tiger']] };
const EN_END = { t: [['🐱', 'cat'], ['🎩', 'hat'], ['⛵', 'boat'], ['🐐', 'goat'], ['🪁', 'kite']], g: [['🐶', 'dog'], ['🐷', 'pig'], ['🐸', 'frog'], ['🐞', 'bug']], n: [['☀️', 'sun'], ['🌙', 'moon'], ['🚂', 'train'], ['🦁', 'lion']] };
const VI_START = { b: [['🐄', 'bò'], ['⚽', 'bóng'], ['🦋', 'bướm'], ['🍰', 'bánh']], k: [['🐟', 'cá'], ['🦀', 'cua'], ['🦊', 'cáo'], ['🍦', 'kem']], g: [['🐔', 'gà'], ['🐻', 'gấu'], ['🎸', 'ghi-ta']],
  h: [['🌸', 'hoa'], ['🐯', 'hổ'], ['🎁', 'hộp quà']], m: [['🐱', 'mèo'], ['🌙', 'mặt trăng'], ['🧢', 'mũ']], t: [['🍎', 'táo'], ['🚂', 'tàu'], ['📺', 'tivi']], v: [['🐘', 'voi'], ['🦆', 'vịt'], ['🦜', 'vẹt']], l: [['🍃', 'lá'], ['🍐', 'lê'], ['🐷', 'lợn']] };
const VI_TONE = { sắc: [['🐟', 'cá'], ['🍃', 'lá'], ['⚽', 'bóng'], ['🐶', 'chó'], ['🍎', 'táo']], huyền: [['🐔', 'gà'], ['🐱', 'mèo'], ['🐄', 'bò'], ['🐢', 'rùa'], ['🥥', 'dừa']],
  ngang: [['🐘', 'voi'], ['🌸', 'hoa'], ['🦀', 'cua'], ['🐝', 'ong'], ['🍦', 'kem']], nặng: [['🦆', 'vịt'], ['🐴', 'ngựa'], ['🍬', 'kẹo']] };
const TONE_NAME = { sắc: 'dấu sắc', huyền: 'dấu huyền', ngang: 'thanh ngang', nặng: 'dấu nặng' };
register({ id: 'soundhunt', icon: '🔤', learn: true, name: () => T('First Sound Hunt', 'Săn Âm Đầu'), async run(api) {
  const start = tier(api), rounds = start === 0 ? 3 : 4, vi = isVi();
  // a line in the game's language only (the words are English or Vietnamese, never both)
  const line = text => vi ? [text, text] : [text, null];
  const used = new Set();
  // (v1.07 levels) the starting values on the frame: rounds, pictures, pictures that match, sound asked (start, or end / tone)
  api.stage.dataset.lv = [rounds, [2, 4, 6, 4][start] + (api.talent && start === 3 ? 2 : 0), api.talent && start === 3 ? 3 : [1, 2, '2-3', 2][start], start === 3 ? 'end' : 'start'].join(',');
  for (let round = 0; round < rounds; round++) {
    if (api.closed) return; api.dots(rounds, round); api.stage.innerHTML = '';
    const level = round ? nextRound(api) : tier(api), end = level === 3, set = vi ? (end ? VI_TONE : VI_START) : (end ? EN_END : EN_START);
    // pictures and how many of them match: 1 of 2 (under-5), 2 of 4 (Easy and Hard), 2 or 3 of 6 (Medium)
    // (levels) Talent: 3 of 6 on the hardest sounds
    const n = [2, 4, 6, 4][level] + (api.talent && level === 3 ? 2 : 0), hits = api.talent && level === 3 ? 3 : [1, 2, level === 2 ? 2 + (Math.random() < .5 ? 1 : 0) : 2, 2][level];
    const keys = favour(api, shuffle(Object.keys(set)).filter(k => set[k].length > hits), k => k);
    const key = keys.find(k => !used.has(k)) || keys[0]; used.add(key);
    const [model, ...rest] = shuffle(set[key]), targets = rest.slice(0, hits);
    const words = new Set(set[key].map(w => w[1])), pics = new Set(set[key].map(w => w[0]));
    const others = shuffle(Object.entries(set).filter(([k]) => k !== key).flatMap(([, ws]) => ws)).filter(w => !words.has(w[1]) && !pics.has(w[0]));
    const fillers = []; for (const w of others) { if (fillers.length >= n - hits) break; if (!fillers.some(x => x[0] === w[0] || x[1] === w[1])) fillers.push(w); }
    const items = shuffle([...targets, ...fillers]);
    const first = w => w[0] === 'g' && w[1] === 'h' ? 'gh' : w[0];
    const ask = () => line(vi ? (end ? `${model[1]}… ${TONE_NAME[key]}! Tìm những hình có ${TONE_NAME[key]} như “${model[1]}”.` : `${first(model[1])}… ${model[1]}! Tìm những hình bắt đầu giống “${model[1]}”.`)
      : (end ? `…${model[1].at(-1)}: ${model[1]}! Find every picture that ends like ${model[1]}.` : `${model[1][0]}… ${model[1]}! Find every picture that starts like ${model[1]}.`));
    api.stage.appendChild(el('div', 'seq sh-model', `<span class="seq-item">${pic(model[0])}</span>`));
    const buttons = choiceButtons(api, items, w => pic(w[0]), 'choice sh-pic');
    buttons.forEach(b => b.setAttribute('aria-label', b._v[1]));
    repeat(api, ask); talk(api, ask());
    let missedIt = false;
    const found = new Set();
    const why = e => {
      if (!missedIt && api.missed) api.missed(key); missedIt = true;
      // both words, one after the other, so the difference can be heard
      return [line(`${model[1]}…`), line(`${e._v[1]}…`), line(vi ? (end ? 'Hai từ có thanh khác nhau.' : 'Hai từ bắt đầu bằng âm khác nhau.') : (end ? 'They end with different sounds.' : 'They start with different sounds.'))];
    };
    for (let k = 0; k < targets.length; k++) {
      const live = buttons.filter(b => !found.has(b));
      const got = await untilRightWith(api, live, b => targets.includes(b._v) && !found.has(b), why);
      if (!got) return;
      found.add(got); got.disabled = true;
      talk(api, line(`${got._v[1]}!`));   // the word found, said again (each word is one recording)
      await wait(350);
    }
    if (!missedIt && api.got) api.got(key);
    await talk(api, line(vi ? 'Con tìm được hết rồi!' : 'You found them all!'));
    await wait(500);
  }
  return api.win();
} });
