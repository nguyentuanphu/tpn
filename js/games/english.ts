// (v1.08 english, owner's plan 3 Nov 2026 AEDT, docs/plans/v108-owner-batch-20261103.md part C) The English corner's
// own games: real English lessons for children learning English (most players are Vietnamese). They always play in
// English mode (js/englishmode.ts): the words, voice and instructions are English whatever the child's language, and a
// small Vietnamese hint sits under the instruction (tap its speaker to hear it in Vietnamese).
//   Picture Words: hear an English word, tap its picture (animals, colours, numbers, family, food, my body).
//   Listen and Choose: hear "two small cats" and tap the card that shows it (how many, which thing, big or small).
//   Say and Match: hear a word, say it out loud, then match the word and its picture.
//   ABC Song: sing the alphabet song as the letters light up, then find the missing letter.
//   Counting Song: count the things one by one in English, then tap the number word (up to twenty, then in tens).
//   First Sentences: "I see a cat." Find the missing word, then put the words of a sentence in order.
//   Greetings: what do you say when … (hello, goodbye, please, thank you, sorry and more).
//   Colours and Shapes: hear "the big red circle" and tap it.
// The English words are said by the English voice (sayIn 'en', recorded from js/content/english.ts englishLines());
// fixed instructions are said with api.say (recorded in both languages). Levels: under-5s get two choices and nobody
// can lose (the right one wiggles after a wait), then more choices and harder English up to Talent.
import { register, untilRight } from './frame.js';
import { pic } from '../art.js';
import { T } from '../i18n.js';
import { el, esc, shuffle, pick, wait } from '../util.js';
import { deck, fresh, mover } from './variety.js';
import { sayIn, sayAsync, captionOnly } from '../voice.js';
import { SFX, tone } from '../audio.js';
import {
  TOPICS, topic, THINGS, thingPhrase, thingPhraseVi, SIZED_MAX, NUM_WORDS, TENS, viCount, LOOKALIKE, ABC, ABC_LINES, ABC_TUNE, ABC_WORDS,
  SENTENCE_STARTS, SENTENCE_THINGS, ADJECTIVES, sentenceOf, GREETINGS, COLOURS, SHAPES, SIZED_COLOURS, viColShape, type Word
} from '../content/english.js';

type Pair = [string, string];
let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.en-board { display: flex; flex-direction: column; align-items: center; gap: 12px; width: max-content; max-width: 100%; }
.en-board > .choices { max-width: min(620px, 94vw); }
.en-card { display: flex; align-items: center; justify-content: center; gap: 14px; min-width: min(300px, 86vw); min-height: 96px; padding: 10px 18px; border-radius: 22px; background: #fffdf6; box-shadow: 0 4px 16px rgba(40, 30, 60, .16); flex-wrap: wrap; }
.en-word { font: 900 clamp(34px, 10vw, 58px) var(--font, sans-serif); color: #3b2a4f; letter-spacing: 1px; }
.en-word.small { font-size: clamp(22px, 6vw, 34px); }
.en-mean { font: 700 15px var(--font, sans-serif); color: #6a5a7a; font-style: italic; }
.en-ear { min-width: 64px; min-height: 64px; border-radius: 50%; border: 2px solid #3b2a4f; background: #dff4ff; padding: 6px; }
.en-ear svg.art { width: 46px; height: 46px; }
.en-pic { width: 96px; height: 96px; }
.en-pic svg.art { width: 100%; height: 100%; }
.en-choices .choice.en-opt { width: clamp(76px, 20vw, 120px); height: clamp(76px, 20vw, 120px); padding: 6px; flex-direction: column; gap: 2px; }
.en-choices .choice.en-opt svg.art { width: 78%; height: auto; flex: 0 1 auto; min-height: 0; }
.en-choices .choice.en-opt small { font: 800 13px var(--font, sans-serif); color: #3b2a4f; }
.en-choices .choice.en-text { min-width: clamp(110px, 30vw, 190px); height: auto; min-height: 64px; padding: 8px 12px; }
.en-choices .choice.en-text b { font: 900 clamp(20px, 5.4vw, 28px) var(--font, sans-serif); color: #3b2a4f; }
.en-choices .choice.en-text svg.art { width: 36px; height: 36px; }
.en-choices .choice.en-group { width: clamp(96px, 27vw, 150px); height: clamp(88px, 22vw, 124px); padding: 6px; display: flex; flex-wrap: wrap; align-content: center; justify-content: center; gap: 2px; }
.en-group svg.art { width: 30px; height: 30px; }
.en-group.big-s svg.art, .en-group .en-big svg.art { width: 44px; height: 44px; }
.en-group .en-small svg.art { width: 20px; height: 20px; }
.en-group span { display: inline-flex; }
.en-letters { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; max-width: min(620px, 94vw); }
.en-letter { min-width: 46px; height: 56px; padding: 0 6px; border-radius: 12px; border: 3px solid #b29cc5; background: #fff; display: flex; align-items: center; justify-content: center; font: 900 30px var(--font, sans-serif); color: #3b2a4f; transition: transform .15s, background .15s; }
.en-letter.lit { background: #ffe9a8; border-color: #ffb020; transform: translateY(-4px); }
.en-letter.gap { border-style: dashed; color: #b29cc5; }
.en-letter.done { background: #eaffea; border-color: #43c463; }
.en-choices .choice.en-abc b { font: 900 clamp(30px, 8vw, 44px) var(--font, sans-serif); color: #3b2a4f; }
.en-choices .choice.en-abc { width: clamp(64px, 17vw, 96px); height: clamp(64px, 17vw, 96px); }
.en-count { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: min(560px, 92vw); }
.en-count .en-thing { width: 64px; height: 64px; border-radius: 16px; border: 2px solid transparent; background: #fff8e6; padding: 4px; position: relative; }
.en-count .en-thing svg.art { width: 100%; height: 100%; }
.en-count .en-thing.counted { border-color: #43c463; background: #eaffea; }
.en-count .en-thing i { position: absolute; right: -4px; top: -6px; font: 900 15px var(--font, sans-serif); font-style: normal; background: #43c463; color: #fff; border-radius: 10px; padding: 0 6px; }
.en-tens { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: min(620px, 94vw); }
.en-ten { display: grid; grid-template-columns: repeat(5, 18px); gap: 2px; padding: 5px; border-radius: 10px; background: #fff8e6; border: 2px solid #3b2a4f; }
.en-ten svg.art { width: 18px; height: 18px; }
.en-ones { display: flex; flex-wrap: wrap; gap: 3px; max-width: 120px; align-content: center; }
.en-ones svg.art { width: 22px; height: 22px; }
.en-sentence { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; max-width: min(620px, 94vw); min-height: 60px; }
.en-slot { min-width: 64px; height: 56px; padding: 0 12px; border-radius: 14px; border: 3px dashed #b29cc5; display: flex; align-items: center; justify-content: center; font: 900 26px var(--font, sans-serif); color: #3b2a4f; background: #fff; }
.en-slot.on { border-style: solid; border-color: #43c463; background: #eaffea; }
.en-choices .choice.en-wordcard { min-width: 72px; height: 64px; padding: 4px 14px; }
.en-choices .choice.en-wordcard b { font: 900 clamp(22px, 6vw, 30px) var(--font, sans-serif); color: #3b2a4f; }
.en-scene { display: flex; gap: 10px; align-items: center; justify-content: center; }
.en-scene svg.art { width: 84px; height: 84px; }
.en-situation { font: 800 clamp(17px, 4.4vw, 22px) var(--font, sans-serif); color: #3b2a4f; text-align: center; max-width: min(520px, 90vw); }
.en-saybtn { min-width: 140px; min-height: 64px; border-radius: 32px; border: 3px solid #3b2a4f; background: #ffd23f; display: flex; align-items: center; gap: 8px; padding: 6px 18px; font: 900 22px var(--font, sans-serif); color: #3b2a4f; }
.en-saybtn svg.art { width: 40px; height: 40px; }
.choice.en-pulse { animation: enPulse .6s ease-in-out 2; }
@keyframes enPulse { 50% { transform: scale(1.08); } }
@media (prefers-reduced-motion: reduce) { .choice.en-pulse { animation: none; outline: 4px solid #ffb020; } .en-letter { transition: none; } }
`));
}
// the level: 0 under-5, 1 Easy, 2 Medium, 3 Hard, 4 Talent
const lvOf = (api): number => api.little ? 0 : 1 + Math.max(0, Math.min(3, api.smart | 0));
const quick = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
// say a fixed line (shown and spoken in English, the Vietnamese hint under it), and wait for it (a few seconds at most)
async function talk(api, line: Pair) { api.show(...line); captionOnly(...line); await Promise.race([sayAsync(...line), wait(quick() ? 1200 : 4200)]); }
// an English word or sentence on its own, always in the English voice
const hear = (text: string) => sayIn('en', text);
const ear = (api, text: () => string) => { const b = el('button', 'en-ear', pic('🔊')); b.setAttribute('aria-label', 'Hear again'); b.onclick = () => { api.sfx.tap && api.sfx.tap(); hear(text()); }; return b; };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
type Btn = HTMLButtonElement & { _v: unknown };
function choices(board: HTMLElement, items: { v: unknown; html: string; cls: string; label: string }[]): Btn[] {
  const row = el('div', 'choices en-choices'); board.appendChild(row);
  return items.map(it => { const b = Object.assign(el('button', 'choice ' + it.cls, it.html), { _v: it.v }) as Btn; b.setAttribute('aria-label', it.label); row.appendChild(b); return b; });
}
function setup(api, lvVals: unknown[], maxActions: number) {
  style(); api.stage.dataset.lv = lvVals.join(',');
  const board = el('div', 'en-board'); api.stage.appendChild(board);
  api.plan(() => null, { maxActions });
  return board;
}
// show the English and its Vietnamese meaning (the hint line), without saying it (the English voice says the word)
const showMeaning = (api, en: string, vi: string) => api.show(en, vi);
// a fixed instruction shown on the line (written as [English, Vietnamese] so the voice pack records both)
const tell = (api, line: Pair) => api.show(...line);

// ---------- Picture Words ----------
register({ id: 'en_words', learn: true, english: true, icon: 'en:words', name: () => T('Picture Words', 'Từ Vựng Qua Tranh'), async run(api) {
  const lv = lvOf(api), rounds = [4, 5, 6, 6, 7][lv], nOpts = [2, 3, 4, 5, 6][lv];
  const keys = [['animals'], ['animals', 'food', 'family'], ['animals', 'food', 'family', 'colours', 'body'], TOPICS.map(t => t.key), TOPICS.map(t => t.key)][lv];
  // Talent: the word is only written (read it, then hear it); below that it is heard, and from Easy written too
  const board = setup(api, [rounds, nOpts, keys.length, lv === 4 ? 0 : 1], rounds * 8);
  await talk(api, ['Listen to the English word. Tap its picture!', 'Nghe từ tiếng Anh. Chạm vào bức tranh đúng nhé!']); if (api.closed) return;
  // (v1.08 variety) each topic deals its words once before any comes back; the right picture moves every round
  const decks = new Map<string, () => Word>(), place = mover();
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return;
    api.dots(rounds, r); board.innerHTML = '';
    const t = topic(keys[r % keys.length]); if (!decks.has(t.key)) decks.set(t.key, deck(t.words)); const w = decks.get(t.key)();
    const others = shuffle(t.words.filter(x => x[0] !== w[0] && x[2] !== w[2])).slice(0, nOpts - 1);
    const card = el('div', 'en-card', lv === 0 ? '' : `<span class="en-word">${esc(w[0])}</span>`);
    if (lv < 4) card.prepend(ear(api, () => w[0]));
    board.appendChild(card);
    const btns = choices(board, place([w, ...others], x => x === w).map(x => ({ v: x[0], html: pic(x[2]), cls: 'en-opt', label: x[0] })));
    tell(api, lv === 4 ? ['Read the word. Which picture is it?', 'Đọc từ này. Đó là tranh nào?'] : ['Which picture is it? Tap it!', 'Tranh nào đúng? Chạm vào nhé!']);
    if (lv < 4) hear(w[0]);
    if (!await untilRight(api, btns, b => b._v === w[0])) return;
    hear(w[0]); showMeaning(api, cap(w[0]) + '!', w[1]);
    await wait(quick() ? 500 : 1500);
  }
  api.dots(rounds, rounds); return api.win();
} });

// ---------- Listen and Choose ----------
register({ id: 'en_listen', learn: true, english: true, icon: 'en:listen', name: () => T('Listen and Choose', 'Nghe và Chọn'), async run(api) {
  const lv = lvOf(api), rounds = [4, 5, 5, 6, 6][lv], nOpts = [2, 3, 4, 4, 6][lv];
  // what changes between the cards: the thing (under-5s), how many (Easy), both (Medium), how many and big or small (Hard), all three (Talent)
  const maxN = [1, 3, 5, SIZED_MAX, SIZED_MAX][lv];
  const board = setup(api, [rounds, nOpts, maxN, lv >= 3 ? 1 : 0], rounds * 8);
  await talk(api, ['Listen carefully. Tap the card that shows it!', 'Lắng nghe thật kỹ. Chạm vào thẻ đúng nhé!']); if (api.closed) return;
  type Card = { t: typeof THINGS[number]; n: number; s: '' | 'big' | 'small' };
  const key = (c: Card) => `${c.t[0]}|${c.n}|${c.s}`;
  // (v1.08 variety) a card not asked before in this game, things dealt from a deck; the right card moves every round
  const thing = deck(THINGS), place = mover();
  const nextBase = fresh((): Card => ({ t: thing(), n: 1 + Math.floor(Math.random() * maxN), s: lv >= 3 ? pick(['big', 'small'] as const) : '' }), key);
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return;
    api.dots(rounds, r); board.innerHTML = '';
    const sized = lv >= 3, base: Card = nextBase();
    const pool = new Map<string, Card>([[key(base), base]]);
    for (let k = 0; pool.size < nOpts && k < 200; k++) {
      const c: Card = { ...base };
      if (lv === 0 || lv === 2 || lv === 4) c.t = pick(THINGS);
      if (lv === 1 || lv >= 2) c.n = 1 + Math.floor(Math.random() * maxN);
      if (sized && Math.random() < .6) c.s = c.s === 'big' ? 'small' : 'big';
      if (lv === 0 && c.t[0] === base.t[0]) continue;
      pool.set(key(c), c);
    }
    const phrase = thingPhrase(base.t, base.n, base.s);
    const card = el('div', 'en-card'); card.appendChild(ear(api, () => phrase)); board.appendChild(card);
    const btns = choices(board, place([...pool.values()], c => c === base).map(c => ({
      v: key(c), cls: 'en-group', label: thingPhrase(c.t, c.n, c.s),
      html: Array.from({ length: c.n }, () => `<span class="${c.s ? 'en-' + c.s : ''}">${pic(c.t[2])}</span>`).join('')
    })));
    tell(api, ['Listen. Which card is it?', 'Nghe nhé. Thẻ nào đúng?']);
    hear(phrase);
    if (!await untilRight(api, btns, b => b._v === key(base))) return;
    card.insertAdjacentHTML('beforeend', `<span class="en-word small">${esc(cap(phrase))}</span>`);
    hear(phrase); showMeaning(api, cap(phrase) + '!', thingPhraseVi(base.t, base.n, base.s));
    await wait(quick() ? 500 : 1600);
  }
  api.dots(rounds, rounds); return api.win();
} });

// ---------- Say and Match ----------
register({ id: 'en_say', learn: true, english: true, icon: 'en:say', name: () => T('Say and Match', 'Nói và Ghép'), async run(api) {
  const lv = lvOf(api), rounds = [4, 4, 5, 5, 6][lv], nOpts = [2, 3, 3, 4, 4][lv];
  // under-5s and Easy hear the word and pick its picture; Medium picks the written word for the picture; Hard reads it
  // before hearing it; Talent reads words that look alike (cat, car, cake, cow)
  const pickWords = lv >= 2, readFirst = lv >= 3;
  const board = setup(api, [rounds, nOpts, pickWords ? 1 : 0, readFirst ? 1 : 0, lv === 4 ? 1 : 0], rounds * 6);
  const all: Word[] = TOPICS.filter(t => t.key !== 'colours' && t.key !== 'numbers').flatMap(t => t.words);
  await talk(api, ['Listen, say the word out loud, then match it!', 'Nghe, đọc to từ đó, rồi ghép cho đúng nhé!']); if (api.closed) return;
  const groups = shuffle(LOOKALIKE), word = deck(all), place = mover();
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return;
    api.dots(rounds, r); board.innerHTML = '';
    let w: Word, opts: Word[];
    if (lv === 4) { const gr = groups[r % groups.length]; w = pick(gr); opts = place(gr, x => x === w); }
    else { w = word(); opts = place([w, ...shuffle(all.filter(x => x[0] !== w[0] && x[2] !== w[2])).slice(0, nOpts - 1)], x => x === w); }
    const card = el('div', 'en-card', pickWords ? `<span class="en-pic">${pic(w[2])}</span>` : `<span class="en-word">${esc(lv === 0 ? '' : w[0])}</span>`);
    board.appendChild(card);
    const sayStep = async () => {
      if (!card.querySelector('.en-ear')) card.prepend(ear(api, () => w[0]));
      tell(api, ['Say the word out loud!', 'Con đọc to từ này nhé!']); hear(w[0]);
      const row = el('div', 'choices en-choices'), b = el('button', 'en-saybtn', `${pic('🗣️')}<span>I said it!</span>`) as Btn; b._v = 1; b.setAttribute('aria-label', 'I said it!');
      row.appendChild(b); board.appendChild(row);
      const ok = await untilRight(api, [b], () => true); row.remove(); return !!ok;
    };
    const matchStep = async () => {
      const btns = choices(board, opts.map(x => pickWords
        ? { v: x[0], html: `<b>${esc(x[0])}</b>`, cls: 'en-text', label: x[0] }
        : { v: x[0], html: pic(x[2]), cls: 'en-opt', label: x[0] }));
      tell(api, pickWords ? ['Which word goes with the picture?', 'Từ nào hợp với bức tranh?'] : ['Which picture is it? Tap it!', 'Tranh nào đúng? Chạm vào nhé!']);
      if (!readFirst && r > 0) hear(w[0]);
      const ok = await untilRight(api, btns, b => b._v === w[0]); btns[0]?.parentElement?.remove(); return !!ok;
    };
    for (const step of readFirst ? [matchStep, sayStep] : [sayStep, matchStep]) { if (api.closed || !await step()) return; }
    showMeaning(api, cap(w[0]) + '!', w[1]); hear(w[0]);
    await wait(quick() ? 400 : 1200);
  }
  api.dots(rounds, rounds); return api.win();
} });

// ---------- ABC Song ----------
const LINE_AT = (() => { const out: number[][] = []; let k = 0; for (const n of [7, 9, 3, 3, 4]) { out.push(Array.from({ length: n }, (_, i) => k + i)); k += n; } return out; })();
const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const ABC_WIN: Pair = ['Now you know your ABC!', 'Con thuộc bảng chữ cái rồi!'];
register({ id: 'en_abc', learn: true, english: true, icon: 'en:abc', name: () => T('ABC Song', 'Bài Hát ABC'), async run(api) {
  const lv = lvOf(api), rounds = [3, 4, 5, 5, 6][lv], nOpts = [2, 3, 3, 4, 5][lv], gaps = lv >= 3 ? 2 : 1;
  const lines = [[0, 1, 2], [0, 1], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4]][lv], lower = lv === 4;
  const board = setup(api, [rounds, nOpts, lines.length, gaps, lower ? 1 : 0], rounds * 8);
  await talk(api, ['Let us sing the ABC song! Watch the letters light up.', 'Mình cùng hát bài ABC nhé! Nhìn các chữ cái sáng lên.']); if (api.closed) return;
  const show = (L: string) => lower ? L.toLowerCase() : L;
  // (v1.08 variety) a line and its missing letters not asked before in this game; the right letter moves every round
  const place = mover(), asked = new Set<string>();
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return;
    api.dots(rounds, r); board.innerHTML = '';
    const li = lines[r % lines.length], idx = LINE_AT[li];
    // the missing letters: under-5s the last one (what comes next?), then anywhere in the line
    let miss = lv === 0 ? [idx[idx.length - 1]] : shuffle(idx.slice()).slice(0, Math.min(gaps, idx.length - 1)).sort((a, b) => a - b);
    for (let t = 0; lv > 0 && t < 40 && asked.has(miss.join(',')); t++) miss = shuffle(idx.slice()).slice(0, Math.min(gaps, idx.length - 1)).sort((a, b) => a - b);
    asked.add(miss.join(','));
    const row = el('div', 'en-letters'); board.appendChild(row);
    const tiles = idx.map(k => { const t = el('div', 'en-letter', esc(show(ABC[k]))); row.appendChild(t); return t; });
    // sing the line: each letter lights up on its note, the voice sings the words
    hear(ABC_LINES[li]);
    for (let i = 0; i < idx.length; i++) {
      if (api.closed) return;
      tiles[i].classList.add('lit'); try { tone(midiHz(ABC_TUNE[idx[i]] + 12), .3, { type: 'triangle', vol: .07 }); } catch (e) { }
      await wait(quick() ? 60 : 380); tiles[i].classList.remove('lit');
    }
    for (const k of miss) { const t = tiles[idx.indexOf(k)]; t.textContent = '?'; t.classList.add('gap'); }
    await wait(quick() ? 100 : 400);
    for (const k of miss) {
      if (api.closed) return;
      const want = ABC[k], near = ABC.filter(x => x !== want).sort((a, b) => Math.abs(ABC.indexOf(a) - k) - Math.abs(ABC.indexOf(b) - k));
      const opts = place([want, ...shuffle(near.slice(0, 6)).slice(0, nOpts - 1)], x => x === want);
      const t = tiles[idx.indexOf(k)]; t.classList.add('lit');
      const btns = choices(board, opts.map(o => ({ v: o, html: `<b>${esc(show(o))}</b>`, cls: 'en-abc', label: o })));
      tell(api, lv === 0 ? ['What letter comes next?', 'Chữ cái nào tiếp theo?'] : ['Which letter is missing?', 'Còn thiếu chữ cái nào?']);
      if (!await untilRight(api, btns, b => b._v === want)) return;
      btns[0].parentElement.remove(); t.textContent = show(want); t.classList.remove('gap', 'lit'); t.classList.add('done');
      const [word, p, wVi] = ABC_WORDS[want]; hear(`${want} is for ${word}.`); showMeaning(api, `${want} is for ${word}.`, wVi);
      const pc = el('div', 'en-card', `<span class="en-pic">${pic(p)}</span><span class="en-word small">${esc(show(want))} · ${esc(word)}</span>`); board.appendChild(pc);
      await wait(quick() ? 400 : 1700); pc.remove();
    }
  }
  hear(ABC_LINES[5]); api.dots(rounds, rounds); return api.win({ title: ABC_WIN[0], titleVi: ABC_WIN[1] });
} });

// ---------- Counting Song ----------
register({ id: 'en_count', learn: true, english: true, icon: 'en:count', name: () => T('Counting Song', 'Bài Hát Đếm Số'), async run(api) {
  const lv = lvOf(api), rounds = [3, 4, 5, 5, 5][lv], nOpts = [2, 3, 3, 4, 5][lv];
  // under-5s count 1 to 3, Easy to 5, Medium to 10 (tapping each one), Hard 11 to 20 (a ten and some more), Talent in tens
  const [lo, hi] = [[1, 3], [1, 5], [4, 10], [11, 20], [2, 10]][lv], tens = lv === 4, tapCount = lv <= 2;
  const board = setup(api, [rounds, nOpts, tens ? `${lo * 10}-${hi * 10}` : `${lo}-${hi}`, tapCount ? 1 : 0, lv <= 1 ? 1 : 0], rounds * 16);
  await talk(api, lv <= 2 ? ['One, two, three, four, five, I can count, I can count!', 'Một, hai, ba, bốn, năm, con biết đếm, con biết đếm!'] : ['Six, seven, eight, nine, ten, let us count them all again!', 'Sáu, bảy, tám, chín, mười, mình cùng đếm lại nào!']);
  if (api.closed) return;
  const word = (n: number) => tens ? TENS[n] : NUM_WORDS[n];
  const used = new Set<number>(), thing = deck(THINGS), place = mover();
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return;
    api.dots(rounds, r); board.innerHTML = '';
    let n = lo + Math.floor(Math.random() * (hi - lo + 1)); for (let k = 0; used.has(n) && k < 6; k++) n = lo + Math.floor(Math.random() * (hi - lo + 1)); used.add(n);
    const t = thing(), p = t[2];
    if (tapCount) {
      const box = el('div', 'en-count'); board.appendChild(box);
      const things = Array.from({ length: n }, () => { const b = Object.assign(el('button', 'en-thing', pic(p)), { _v: 0 }) as Btn; b.setAttribute('aria-label', t[0]); box.appendChild(b); return b; });
      tell(api, ['Tap each one and count in English!', 'Chạm vào từng cái và đếm bằng tiếng Anh nhé!']);
      for (let k = 1; k <= n; k++) {
        const b = await untilRight(api, things, e => !e._v); if (!b) return;
        b._v = k; b.classList.add('counted'); b.insertAdjacentHTML('beforeend', `<i>${k}</i>`); hear(NUM_WORDS[k]);
        await wait(quick() ? 80 : 650);
      }
    } else if (tens) {
      const box = el('div', 'en-tens'); board.appendChild(box);
      for (let k = 0; k < n; k++) box.appendChild(el('div', 'en-ten', Array.from({ length: 10 }, () => pic(p)).join('')));
      tell(api, ['Count by tens: ten, twenty, thirty!', 'Đếm theo chục: mười, hai mươi, ba mươi!']);
      for (let k = 1; k <= n; k++) { if (api.closed) return; (box.children[k - 1] as HTMLElement).style.background = '#eaffea'; hear(TENS[k]); await wait(quick() ? 60 : 700); }
    } else {
      const box = el('div', 'en-tens'); board.appendChild(box);
      box.appendChild(el('div', 'en-ten', Array.from({ length: 10 }, () => pic(p)).join('')));
      box.appendChild(el('div', 'en-ones', Array.from({ length: n - 10 }, () => pic(p)).join('')));
      tell(api, ['Ten, and some more. How many?', 'Mười, và thêm mấy cái nữa. Tất cả là bao nhiêu?']);
    }
    const near = [n - 2, n - 1, n + 1, n + 2, n + 3].filter(x => x >= 1 && x <= (tens ? 10 : 20) && x !== n);
    const opts = place([n, ...shuffle(near).slice(0, nOpts - 1)], x => x === n);
    const btns = choices(board, opts.map(o => ({ v: o, cls: 'en-text', label: word(o), html: `${lv <= 1 ? `<small>${tens ? o * 10 : o}</small> ` : ''}<b>${esc(word(o))}</b>` })));
    tell(api, ['How many? Tap the number word.', 'Có bao nhiêu? Chạm vào chữ số đúng.']);
    if (!await untilRight(api, btns, b => b._v === n)) return;
    hear(word(n)); showMeaning(api, `${cap(word(n))}!`, viCount(n, tens));
    await wait(quick() ? 400 : 1400);
  }
  api.dots(rounds, rounds); return api.win();
} });

// ---------- First Sentences ----------
register({ id: 'en_sentence', learn: true, english: true, icon: 'en:sentence', name: () => T('First Sentences', 'Những Câu Đầu Tiên'), async run(api) {
  const lv = lvOf(api), rounds = [4, 4, 5, 5, 5][lv], nOpts = [2, 3, 4, 4, 6][lv];
  // under-5s hear "I see a cat." and tap the cat; Easy and Medium find the missing word; Hard puts four words in order;
  // Talent puts five in order (with a describing word) and leaves one word out
  const build = lv >= 3, starts = lv <= 1 ? [SENTENCE_STARTS[0]] : SENTENCE_STARTS;
  const board = setup(api, [rounds, nOpts, build ? (lv === 4 ? 5 : 4) : 1, starts.length, lv === 4 ? 1 : 0], rounds * 10);
  await talk(api, build ? ['Put the words in order to make a sentence!', 'Xếp các từ theo thứ tự để thành một câu nhé!'] : ['Listen to the sentence and find the missing word!', 'Nghe câu nói và tìm từ còn thiếu nhé!']);
  if (api.closed) return;
  const things = shuffle(SENTENCE_THINGS);
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return;
    api.dots(rounds, r); board.innerHTML = '';
    const w = things[r % things.length], [st, stVi] = pick(starts), adj = lv === 4 ? pick(ADJECTIVES.slice(0, 3)) : null;
    const [words, sentence, vi] = sentenceOf([st, stVi], w, adj);
    const card = el('div', 'en-card', `<span class="en-pic">${pic(w[2])}</span>`); card.appendChild(ear(api, () => sentence)); board.appendChild(card);
    const line = el('div', 'en-sentence'); board.appendChild(line);
    if (lv === 0) {
      line.innerHTML = `<span class="en-word small">${esc(sentence)}</span>`; card.querySelector('.en-pic').remove();
      const other = pick(SENTENCE_THINGS.filter(x => x[0] !== w[0]));
      const btns = choices(board, shuffle([w, other]).map(x => ({ v: x[0], html: pic(x[2]), cls: 'en-opt', label: x[0] })));
      tell(api, ['Tap what you hear!', 'Chạm vào thứ con nghe thấy!']); hear(sentence);
      if (!await untilRight(api, btns, b => b._v === w[0])) return;
    } else if (!build) {
      const slots = words.map((x, i) => i === words.length - 1 ? '<span class="en-slot">?</span>' : `<span class="en-slot on">${esc(x)}</span>`); line.innerHTML = slots.join('');
      const others = shuffle(SENTENCE_THINGS.filter(x => x[0] !== w[0])).slice(0, nOpts - 1);
      const btns = choices(board, shuffle([w, ...others]).map(x => ({ v: x[0], html: `${lv === 1 ? pic(x[2]) : ''}<b>${esc(x[0])}</b>`, cls: 'en-text', label: x[0] })));
      tell(api, ['Which word is missing?', 'Còn thiếu từ nào?']); hear(sentence);
      if (!await untilRight(api, btns, b => b._v === w[0])) return;
      const last = line.lastElementChild as HTMLElement; last.textContent = w[0] + '.'; last.classList.add('on');
    } else {
      const slots = words.map(() => el('span', 'en-slot', '?')); slots.forEach(s => line.appendChild(s));
      const extra = lv === 4 ? [pick(['the', 'is', 'and', 'my'])] : [];
      const cards = choices(board, shuffle([...words.map((x, i) => ({ x, i })), ...extra.map(x => ({ x, i: -1 }))]).map(o => ({ v: o.i, html: `<b>${esc(o.x)}</b>`, cls: 'en-wordcard', label: o.x })));
      tell(api, ['Tap the words in order.', 'Chạm vào các từ theo đúng thứ tự.']); if (lv === 3) hear(sentence);
      for (let k = 0; k < words.length; k++) {
        const want = words[k];
        const b = await untilRight(api, cards, e => !e.disabled && e._v !== -1 && words[e._v as number] === want); if (!b) return;
        b.disabled = true; b.style.visibility = 'hidden'; slots[k].textContent = want; slots[k].classList.add('on');
      }
      cards[0]?.parentElement?.remove();
    }
    hear(sentence); showMeaning(api, sentence, vi);
    await wait(quick() ? 500 : 1800);
  }
  api.dots(rounds, rounds); return api.win();
} });

// ---------- Greetings ----------
register({ id: 'en_greet', learn: true, english: true, icon: 'en:greet', name: () => T('Greetings', 'Lời Chào Hỏi'), async run(api) {
  const lv = lvOf(api), rounds = [4, 5, 5, 6, 6][lv], nOpts = [2, 3, 3, 4, 4][lv], top = [0, 1, 2, 3, 3][lv];
  // under-5s and Easy hear the choices read out; from Medium the child reads them; Talent asks the harder ones first
  const readOut = lv <= 1;
  const pool = GREETINGS.filter(g => g.lv <= top), list = lv === 4 ? [...shuffle(pool.filter(g => g.lv >= 2)), ...shuffle(pool.filter(g => g.lv < 2))] : shuffle(pool);
  const board = setup(api, [rounds, nOpts, pool.length, readOut ? 1 : 0], rounds * 6);
  await talk(api, ['What do you say? Choose the right words!', 'Con sẽ nói gì? Chọn câu đúng nhé!']); if (api.closed) return;
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return;
    api.dots(rounds, r); board.innerHTML = '';
    const g = list[r % list.length], others = shuffle(GREETINGS.filter(x => x.id !== g.id && x.say !== g.say && (lv === 4 ? x.lv >= 1 : x.lv <= Math.max(1, top)))).slice(0, nOpts - 1);
    board.appendChild(el('div', 'en-scene', g.pics.split(' ').map(p => pic(p)).join('')));
    board.appendChild(el('div', 'en-situation', esc(g.when[0])));
    const opts = shuffle([g, ...others]);
    const btns = choices(board, opts.map(o => ({ v: o.id, html: `<b>${esc(o.say)}</b>`, cls: 'en-text', label: o.say })));
    api.say(...g.when);
    if (readOut) {
      await wait(quick() ? 300 : 2600);
      for (const b of btns) { if (api.closed) return; b.classList.add('en-pulse'); hear(opts[btns.indexOf(b)].say); await wait(quick() ? 150 : 1300); b.classList.remove('en-pulse'); }
    }
    if (!await untilRight(api, btns, b => b._v === g.id)) return;
    hear(g.say); showMeaning(api, g.say, g.vi);
    await wait(quick() ? 500 : 1700);
  }
  api.dots(rounds, rounds); return api.win();
} });

// ---------- Colours and Shapes ----------
register({ id: 'en_colshape', learn: true, english: true, icon: 'en:colshape', name: () => T('Colours and Shapes', 'Màu Sắc và Hình Khối'), async run(api) {
  const lv = lvOf(api), rounds = [4, 5, 5, 6, 6][lv], nOpts = [2, 3, 4, 4, 6][lv];
  // under-5s and Easy hear a colour; Medium a shape; Hard a colour and a shape; Talent big or small too
  const ask = ['colour', 'colour', 'shape', 'both', 'size'][lv];
  const cols = lv <= 1 || lv === 4 ? COLOURS.slice(0, SIZED_COLOURS) : COLOURS, shapes = lv <= 1 ? SHAPES.slice(0, 3) : SHAPES;
  const board = setup(api, [rounds, nOpts, ask, cols.length, shapes.length], rounds * 6);
  await talk(api, ask === 'shape' ? ['Listen to the shape and tap it!', 'Nghe tên hình và chạm vào hình đó nhé!'] : ['Listen to the colour and the shape, and tap it!', 'Nghe màu và hình rồi chạm vào cho đúng nhé!']);
  if (api.closed) return;
  type It = { c: number; s: number; big: boolean };
  const k = (x: It) => `${x.c}|${x.s}|${x.big}`;
  // (v1.08 variety) what is asked (the colour, the shape, both, or with the size) is new each round; the right one moves
  const asked = (x: It) => ask === 'colour' ? `${x.c}` : ask === 'shape' ? `${x.s}` : ask === 'both' ? `${x.c}|${x.s}` : k(x);
  const nextWant = fresh((): It => ({ c: Math.floor(Math.random() * cols.length), s: Math.floor(Math.random() * shapes.length), big: Math.random() < .5 }), asked), place = mover();
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return;
    api.dots(rounds, r); board.innerHTML = '';
    const want: It = nextWant();
    const set = new Map<string, It>([[k(want), want]]);
    for (let n = 0; set.size < nOpts && n < 300; n++) {
      const x: It = { ...want };
      if (ask === 'colour') { x.c = Math.floor(Math.random() * cols.length); x.s = Math.floor(Math.random() * shapes.length); if (x.c === want.c) continue; }
      else if (ask === 'shape') { x.s = Math.floor(Math.random() * shapes.length); x.c = Math.floor(Math.random() * cols.length); if (x.s === want.s) continue; }
      else { if (Math.random() < .5) x.c = Math.floor(Math.random() * cols.length); else x.s = Math.floor(Math.random() * shapes.length); if (ask === 'size' && Math.random() < .5) x.big = !x.big; }
      if (ask !== 'size') x.big = true;
      if (set.has(k(x))) continue; set.set(k(x), x);
    }
    if (ask !== 'size') want.big = true;
    const [cEn, cVi] = cols[want.c], [sEn, sVi] = shapes[want.s];
    const phrase = ask === 'colour' ? cEn : ask === 'shape' ? sEn : ask === 'both' ? `${cEn} ${sEn}` : `the ${want.big ? 'big' : 'small'} ${cEn} ${sEn}`;
    const card = el('div', 'en-card'); card.appendChild(ear(api, () => phrase)); board.appendChild(card);
    const btns = choices(board, place([...set.values()], x => x === want).map(x => ({ v: k(x), cls: 'en-opt', label: `${cols[x.c][0]} ${shapes[x.s][0]}`, html: `<span class="${x.big ? '' : 'en-smallshape'}" style="${x.big ? '' : 'width:52%;display:flex;justify-content:center'}">${pic(`en:sh:${shapes[x.s][0]}:${cols[x.c][0]}`)}</span>` })));
    tell(api, ['Listen. Which one is it?', 'Nghe nhé. Hình nào đúng?']);
    hear(phrase);
    if (!await untilRight(api, btns, b => b._v === k(want))) return;
    card.insertAdjacentHTML('beforeend', `<span class="en-word small">${esc(cap(phrase))}</span>`);
    hear(phrase); showMeaning(api, cap(phrase) + '!', viColShape(ask, cVi, sVi, want.big));
    await wait(quick() ? 400 : 1500);
  }
  api.dots(rounds, rounds); return api.win();
} });
