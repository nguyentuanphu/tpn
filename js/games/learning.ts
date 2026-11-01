// Learning games: telling the time, adding and taking away, opposites, animal sounds, first letter sounds
// and feelings. Same gentle rules as every game: no losing, "try again" until it's right.
import { register, untilRight, choiceButtons } from './frame.js';
import { T, numWord } from '../i18n.js';
import { settings } from '../state.js';
import { shuffle, pick, el, wait } from '../util.js';
import { animalCall, loadAnimalCalls, animalRecording } from '../audio.js';
import { sayAsync, hush, spoken } from '../voice.js';

const FRUIT = ['🍎', '🍌', '🍓', '🍊', '🥭', '🍐', '🍇', '🥝'];
const vi = () => settings.lang === 'vi';
// (owner, 1 Nov 2026 AEDT: "the levels often look the same") the value for the chosen level: Easy, Medium, Hard, Talent
// (Talent defaults to Hard); under-5s always get the Easy value
const lv = <V>(api, e: V, m: V, h: V, t: V = h): V => api.little ? e : [e, m, h, t][api.smart || 0] ?? e;

// ---------- What's the time? (a clock face with moving hands) ----------
function clockSVG(h, m) {
  const a = (m / 60) * 360, b = ((h % 12) / 12) * 360 + (m / 60) * 30;
  const nums = Array.from({ length: 12 }, (_, i) => { const n = i + 1, t = n / 12 * Math.PI * 2; return `<text x="${50 + Math.sin(t) * 36}" y="${50 - Math.cos(t) * 36 + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#4a3a3f">${n}</text>`; }).join('');
  return `<svg class="clockface" viewBox="0 0 100 100" width="210" height="210"><circle cx="50" cy="50" r="47" fill="#fff8e6" stroke="#ff9f43" stroke-width="5"/>${nums}
    <g class="hand-h" style="transform:rotate(${b}deg);transform-origin:50px 50px"><line x1="50" y1="50" x2="50" y2="28" stroke="#3a3a5a" stroke-width="5" stroke-linecap="round"/></g>
    <g class="hand-m" style="transform:rotate(${a}deg);transform-origin:50px 50px"><line x1="50" y1="50" x2="50" y2="15" stroke="#e8433a" stroke-width="3" stroke-linecap="round"/></g><circle cx="50" cy="50" r="3.5" fill="#3a3a5a"/></svg>`;
}
const timeText = (h, m) => vi() ? (m === 0 ? `${h} giờ` : m === 30 ? `${h} giờ rưỡi` : `${h} giờ ${m}`) : (m === 0 ? `${h} o'clock` : m === 30 ? `half past ${h}` : m === 15 ? `quarter past ${h}` : `quarter to ${h % 12 + 1}`);
const digital = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
register({
  id: 'clock', learn: true, icon: '🕒', name: () => T("What's the Time?", 'Mấy Giờ Rồi?'),
  async run(api) {
    const rounds = 4, mins = api.level <= 1 ? [0] : api.level === 2 ? [0, 30] : [0, 15, 30, 45];
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const h = 1 + Math.floor(Math.random() * 12), m = pick(mins);
      const face = el('div', 'clockwrap', clockSVG(h, m)); api.stage.appendChild(face);
      api.say('What time does the clock say? The short hand shows the hour.', 'Đồng hồ chỉ mấy giờ? Kim ngắn chỉ giờ.');
      // (levels) Hard: four times to choose from, Talent five with only the clock numbers (no words)
      const m2 = mins.length > 1 ? pick(mins.filter(x => x !== m)) : (m + 30) % 60;
      const wrong = shuffle([[h % 12 + 1, m], [(h + 10) % 12 + 1, m], [h, m2], [h % 12 + 1, m2], [(h + 10) % 12 + 1, m2]]).slice(0, lv(api, 2, 2, 3, 4));
      const opts = shuffle([[h, m], ...wrong]);
      const btns = choiceButtons(api, opts, ([a, b]) => `<b class="tnum">${digital(a, b)}</b>${api.talent ? '' : `<small>${timeText(a, b)}</small>`}`);
      const b = await untilRight(api, btns, e => e._v[0] === h && e._v[1] === m); if (!b) return;
      api.say(`It's ${timeText(h, m)}!`, `${timeText(h, m)} rồi!`); await wait(1500);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Add it up (and take away for bigger kids) ----------
register({
  id: 'sums', learn: true, icon: '➕', name: () => T('Add It Up', 'Cộng Trừ Vui'),
  async run(api) {
    const rounds = 5, max = api.talent ? 30 : [5, 8, 10, 15, 20][Math.min(4, api.level - 1)];   // (levels) Talent: numbers up to 30, four answers
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const take = api.level >= 3 && r % 2 === 1, fr = pick(FRUIT);
      let a = 1 + Math.floor(Math.random() * (max - 1)), b = 1 + Math.floor(Math.random() * Math.max(1, max - a));
      if (take) { if (b > a) [a, b] = [b, a]; }
      const ans = take ? a - b : a + b;
      const row = el('div', 'sumrow');
      const grp = (n, gone = 0) => `<span class="sumgrp">${Array.from({ length: n }, (_, i) => `<i class="${i >= n - gone ? 'gone' : ''}">${fr}</i>`).join('')}</span>`;
      row.innerHTML = take ? `${grp(a, b)}<b class="op">−</b><b class="num">${b}</b>` : `${grp(a)}<b class="op">+</b>${grp(b)}`;
      api.stage.appendChild(row);
      if (take) api.say(`${a} take away ${b}. How many are left?`, `${numWord(a)} bớt ${numWord(b)}. Còn lại mấy?`);
      else api.say(`${a} and ${b} more. How many altogether?`, `${numWord(a)} thêm ${numWord(b)}. Tất cả là mấy?`);
      const opts = shuffle([ans, ...shuffle([ans - 2, ans - 1, ans + 1, ans + 2].filter(v => v >= 0)).slice(0, lv(api, 2, 2, 2, 3))]);
      const btns = choiceButtons(api, opts, o => `<b class="num">${o}</b>`);
      const ok = await untilRight(api, btns, e => e._v === ans); if (!ok) return;
      api.say(take ? `${a} take away ${b} is ${ans}!` : `${a} plus ${b} is ${ans}!`, take ? `${numWord(a)} bớt ${numWord(b)} còn ${numWord(ans)}!` : `${numWord(a)} cộng ${numWord(b)} là ${numWord(ans)}!`); await wait(1500);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Opposites ----------
const OPP = [['🐘', 'big', 'to', '🐭', 'small', 'nhỏ'], ['🔥', 'hot', 'nóng', '🧊', 'cold', 'lạnh'], ['☀️', 'day', 'ngày', '🌙', 'night', 'đêm'], ['😀', 'happy', 'vui', '😢', 'sad', 'buồn'],
  ['🐆', 'fast', 'nhanh', '🐢', 'slow', 'chậm'], ['⬆️', 'up', 'lên', '⬇️', 'down', 'xuống'], ['🥁', 'loud', 'to tiếng', '🤫', 'quiet', 'im lặng'], ['🍼', 'full', 'đầy', '🫙', 'empty', 'rỗng'],
  ['🚪', 'open', 'mở', '🔒', 'closed', 'đóng'], ['🌊', 'wet', 'ướt', '🏜️', 'dry', 'khô'], ['🦒', 'tall', 'cao', '🐿️', 'short', 'thấp'], ['🪶', 'light', 'nhẹ', '🏋️', 'heavy', 'nặng']];
register({
  id: 'opposites', learn: true, icon: '↔️', name: () => T('Opposites', 'Từ Trái Nghĩa'),
  async run(api) {
    // (levels) more rounds and more answers from Medium up; Talent: the answers show only their words, no pictures
    const rounds = lv(api, 5, 6, 7, 8), list = shuffle(OPP).slice(0, rounds);
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const o = list[r], flip = Math.random() < .5, [ia, ea, va, ib, eb, vb] = flip ? [o[3], o[4], o[5], o[0], o[1], o[2]] : o;
      api.stage.appendChild(el('div', 'oppcard', `<span class="big">${ia}</span><b>${T(ea, va)}</b>`));
      api.say(`What is the opposite of ${ea}?`, `Ngược với "${va}" là gì?`);
      const others = shuffle(OPP.filter(x => x !== o)).slice(0, lv(api, 2, 3, 3, 4)).map(x => Math.random() < .5 ? [x[0], x[1], x[2]] : [x[3], x[4], x[5]]);
      const opts = shuffle([[ib, eb, vb], ...others]);
      const btns = choiceButtons(api, opts, ([i, e, v]) => `${api.talent ? '' : `<span class="big">${i}</span>`}<small>${T(e, v)}</small>`);
      const ok = await untilRight(api, btns, e => e._v[0] === ib); if (!ok) return;
      api.say(`${ea} and ${eb}!`, `${va} và ${vb}!`); await wait(1400);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Who says that? (listen to an animal, find it) ----------
const VOICES = [['moo', '🐄', 'cow', 'con bò'], ['baa', '🐑', 'sheep', 'con cừu'], ['oink', '🐷', 'pig', 'con heo'], ['woof', '🐶', 'dog', 'con chó'], ['meow', '🐱', 'cat', 'con mèo'],
  ['quack', '🦆', 'duck', 'con vịt'], ['cluck', '🐔', 'hen', 'con gà mái'], ['neigh', '🐴', 'horse', 'con ngựa'], ['ribbit', '🐸', 'frog', 'con ếch'], ['hoot', '🦉', 'owl', 'con cú']];
register({
  id: 'animalsounds', learn: true, icon: '👂', name: () => T('Who Says That?', 'Con Gì Kêu Thế?'),
  async run(api) {
    const rounds = 5, list = shuffle(VOICES).slice(0, rounds);
    api.onCleanup(hush);
    const speak = (en: string, vi: string) => {
      api.show(en, vi);const text=T(en,vi);spoken.forEach(f=>{try{f(text);}catch{}});return sayAsync(en,vi);
    };
    const loading = el('div', 'animal-loading'), status = el('p', '', T('Getting animal sounds ready…', 'Đang chuẩn bị tiếng các con vật…'));
    status.setAttribute('role', 'status'); loading.append(status); api.stage.append(loading);
    while (!api.closed) {
      const ready = await loadAnimalCalls(); if (api.closed) return; if (ready) break;
      status.textContent = T('Animal sounds are not saved yet. Connect to the internet and try again.', 'Chưa lưu được tiếng các con vật. Kết nối mạng rồi thử lại nhé.');
      const retry = el('button', 'btn big primary animal-retry', '↻ ' + T('Try again', 'Thử lại')); retry.style.minWidth = retry.style.minHeight = '64px'; loading.append(retry);
      await new Promise<void>(resolve => { retry.onclick = () => resolve(); api.onCleanup(resolve); }); retry.remove();
      status.textContent = T('Getting animal sounds ready…', 'Đang chuẩn bị tiếng các con vật…');
    }
    if (api.closed) return; loading.remove(); // a real recording is required, including after an offline/slow start
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const [snd, ic, en, vn] = list[r];
      const play = el('button', 'choice bigplay', '🔊'); api.stage.appendChild(play);
      let stopCall = () => {}; api.onCleanup(() => stopCall());
      const hear = () => { stopCall(); stopCall = animalCall(snd); }; play.onclick = hear;
      play.disabled=true;await speak('Listen! Which animal makes this sound?', 'Nghe nè! Con vật nào kêu như vậy?'); if (api.closed) return;play.disabled=false;hear();
      const opts = shuffle([list[r], ...shuffle(VOICES.filter(v => v !== list[r])).slice(0, lv(api, api.level <= 1 ? 1 : 2, 2, 3, 5))]);   // (levels) up to six animals on Talent
      const btns = choiceButtons(api, opts, ([, i, e, v]) => `<span class="big">${i}</span><small>${T(e, v)}</small>`);
      const ok = await untilRight(api, btns, e => e._v[0] === snd); if (!ok) return;
      stopCall();play.disabled=true;await speak(`Yes! The ${en}!`, `Đúng rồi! Là ${vn}!`); if (api.closed) return;play.disabled=false;hear(); await wait(Math.max(2, animalRecording(snd)?.duration || 0) * 1000 + 200); stopCall();
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- First sounds (phonics): which letter does it start with? ----------
const PH_EN = [['🍎', 'apple'], ['⚽', 'ball'], ['🐱', 'cat'], ['🐶', 'dog'], ['🥚', 'egg'], ['🐟', 'fish'], ['🐐', 'goat'], ['🎩', 'hat'], ['🧃', 'juice'], ['🪁', 'kite'], ['🦁', 'lion'], ['🌙', 'moon'], ['🪺', 'nest'], ['🐙', 'octopus'], ['🐷', 'pig'], ['👑', 'queen'], ['🐰', 'rabbit'], ['☀️', 'sun'], ['🌳', 'tree'], ['☂️', 'umbrella'], ['🚐', 'van'], ['🐳', 'whale'], ['🦓', 'zebra']];
const PH_VI = [['🐄', 'bò', 'B'], ['🐟', 'cá', 'C'], ['🐐', 'dê', 'D'], ['🏮', 'đèn', 'Đ'], ['🐔', 'gà', 'G'], ['🌸', 'hoa', 'H'], ['🍦', 'kem', 'K'], ['🍃', 'lá', 'L'], ['🐱', 'mèo', 'M'], ['👒', 'nón', 'N'], ['🐝', 'ong', 'O'], ['🍐', 'ổi', 'Ô'], ['🪭', 'quạt', 'Q'], ['🐢', 'rùa', 'R'], ['⭐', 'sao', 'S'], ['🍎', 'táo', 'T'], ['🐘', 'voi', 'V'], ['🚲', 'xe', 'X'], ['🐸', 'ếch', 'Ê'], ['✏️', 'bút', 'B'], ['🦆', 'vịt', 'V']];
register({
  id: 'phonics', learn: true, icon: '🔤', name: () => T('First Sounds', 'Âm Đầu Tiên'),
  async run(api) {
    const rounds = 5, VI = vi(), pool = shuffle(VI ? PH_VI : PH_EN).slice(0, rounds), letters = [...new Set((VI ? PH_VI : PH_EN).map(w => VI ? w[2] : w[1][0].toUpperCase()))];
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const w = pool[r], word = w[1], L = VI ? w[2] : word[0].toUpperCase();
      api.stage.appendChild(el('div', 'oppcard', `<span class="big">${w[0]}</span><b>${word}</b>`));
      api.say(`${word}! Which letter does ${word} start with?`, `${word}! Chữ "${word}" bắt đầu bằng chữ nào?`);
      const opts = shuffle([L, ...shuffle(letters.filter(x => x !== L)).slice(0, lv(api, api.level <= 1 ? 1 : 2, 2, 3, 5))]);   // (levels) up to six letters on Talent
      const btns = choiceButtons(api, opts, o => `<b class="num">${o}</b>`);
      const ok = await untilRight(api, btns, e => e._v === L); if (!ok) return;
      api.say(`${L} for ${word}!`, `${L} trong chữ ${word}!`); await wait(1400);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// (r79 learning, owner 16 Oct AEDT) "How Do They Feel?" was rebuilt as a talk-and-touch game with Lá's stories, four
// faces and "what could help?": js/games/talkgames.js (same id, so a child's progress stays)
