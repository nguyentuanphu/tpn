// (v1.08 vietnamese, owner's plan 3 Nov 2026 AEDT, docs/plans/v108-owner-batch-20261103.md part D) Ten more games for
// Học vui › Tiếng Việt, beside Tone Detective and Build a Syllable (js/games/tiengviet.ts):
//   One Word, Many Tones (Dấu Thanh Đổi Nghĩa): cá, cà, ca: hear the word, tap its picture; a tone mark changes the word.
//   Rhyme Pairs (Tìm Vần Giống Nhau): find the word with the same rhyme (mèo, kẹo).
//   Vietnamese Letters (Chữ Cái Việt): the missing letter of trăng, cây, đèn, dê, ô, cơm, mưa (a ă â, d đ, e ê, o ô ơ, u ư).
//   Opposite Pairs (Nối Từ Trái Nghĩa): match Vietnamese opposites on cards (to, nhỏ).
//   Folk Rhymes (Ca Dao Đồng Dao) and Picture Sayings (Tục Ngữ Có Hình): the missing word of a verse or a saying, then
//   what it means.
//   Read Along (Bé Đọc To): tap each word of a sentence as it is read. Make a Sentence (Bé Đặt Câu): put the words in order.
//   Listen and Spell (Nghe Và Viết): hear a word and tap its letters. Folk Riddles (Câu Đố Dân Gian): tap the answer.
// The Vietnamese words are always said by the Vietnamese voice (sayIn 'vi'), in either language, so in English the game
// teaches Vietnamese: its instructions and meanings are English. Levels: under-5s get two choices and nobody can lose (the
// right one wiggles after a wait), then more choices, longer words and less help up to Talent; each game puts its real
// values on the stage (data-lv) for the level checks.
import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, esc, shuffle, pick, wait } from '../util.js';
import { sayIn, sayAsync, captionOnly } from '../voice.js';
import { settings } from '../state.js';
import {
  TONE_SETS, RHYME_SETS, LETTER_FAMILY, LETTER_WORDS, LETTER_SAY, OPPOSITES, VERSES, SAYINGS, SENTENCES, SPELL_WORDS, RIDDLES,
  spoken, gapped, wordsOf, sayWord, lettersOf, toneTwins, type Word, type Verse
} from '../content/tiengviet2.js';

type Pair = [string, string];
type Btn = HTMLButtonElement & { _v: unknown };
let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.vt-board { display: flex; flex-direction: column; align-items: center; gap: 12px; width: max-content; max-width: 100%; }
.vt-board > .choices { max-width: min(640px, 94vw); }
.vt-card { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 10px 14px; min-width: min(300px, 86vw); max-width: min(620px, 94vw); min-height: 96px; padding: 10px 18px; border-radius: 22px; background: #fffdf6; box-shadow: 0 4px 16px rgba(40, 30, 60, .16); }
.vt-big { font: 900 clamp(40px, 11vw, 68px) var(--font, sans-serif); color: #3b2a4f; letter-spacing: 1px; }
.vt-big i { font-style: normal; color: #e8433a; }
.vt-big .vt-gap { display: inline-block; min-width: .9em; border-bottom: 5px solid #ffb020; color: #43c463; text-align: center; }
.vt-verse { font: 800 clamp(20px, 5.4vw, 30px) var(--font, sans-serif); color: #3b2a4f; line-height: 1.35; text-align: center; }
.vt-verse .vt-gap { display: inline-block; min-width: 2.4em; border-bottom: 4px solid #ffb020; color: #43c463; }
.vt-mean { flex-basis: 100%; text-align: center; font: 700 15px var(--font, sans-serif); color: #6a5a7a; }
.vt-mean:empty { display: none; }
.vt-ear { min-width: 64px; min-height: 64px; border-radius: 50%; border: 2px solid #3b2a4f; background: #dff4ff; padding: 6px; }
.vt-ear svg.art { width: 46px; height: 46px; }
.vt-pic { width: 92px; height: 92px; display: inline-flex; }
.vt-pic svg.art { width: 100%; height: 100%; }
.vt-choices .choice.vt-opt { width: clamp(84px, 21vw, 128px); height: clamp(96px, 24vw, 140px); flex-direction: column; gap: 2px; padding: 4px; }
.vt-choices .choice.vt-opt svg.art { width: 62%; height: auto; flex: 0 1 auto; min-height: 0; }
.vt-choices .choice.vt-opt b { font: 900 clamp(18px, 4.8vw, 26px) var(--font, sans-serif); color: #3b2a4f; line-height: 1.1; }
.vt-choices .choice.vt-opt small { font: 700 12px var(--font, sans-serif); color: #6a5a7a; }
.vt-choices .choice.vt-letter b { font-size: clamp(36px, 9vw, 52px); }
.vt-choices .choice.vt-letter { height: clamp(80px, 20vw, 110px); }
.vt-choices .choice.vt-text { width: auto; min-width: 72px; height: 64px; padding: 0 14px; }
.vt-choices .choice.vt-text b { font-size: clamp(22px, 5.6vw, 30px); }
.vt-choices .choice.vt-pair.sel { outline: 5px solid #ffb020; }
.vt-choices .choice.vt-pair.done { opacity: .35; pointer-events: none; }
.vt-line { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; max-width: min(620px, 94vw); }
.vt-slot { min-width: 52px; height: 64px; padding: 0 10px; border-radius: 14px; border: 3px dashed #b29cc5; display: inline-flex; align-items: center; justify-content: center; font: 900 30px var(--font, sans-serif); color: #3b2a4f; background: #fff; }
.vt-slot.on { border-style: solid; border-color: #43c463; background: #eaffea; }
.vt-slot.now { border-color: #ffb020; box-shadow: 0 0 0 4px rgba(255, 176, 32, .3); }
.vt-read .choice.vt-word { width: auto; min-width: 64px; height: 64px; padding: 0 12px; }
.vt-read .choice.vt-word b { font: 900 clamp(24px, 6vw, 34px) var(--font, sans-serif); color: #3b2a4f; }
.vt-read .choice.vt-word.read { background: #eaffea; }
.vt-riddle { font: 800 clamp(18px, 4.8vw, 26px) var(--font, sans-serif); color: #3b2a4f; line-height: 1.35; text-align: center; max-width: min(560px, 86vw); }
`));
}
// 0 under-5s, 1 Easy, 2 Medium, 3 Hard, 4 Talent
const lvOf = (api): number => api.little ? 0 : 1 + Math.max(0, Math.min(3, api.smart | 0));
// a fixed line, shown and spoken (at most a few seconds)
async function talk(api, line: Pair) { api.show(...line); captionOnly(...line); await Promise.race([sayAsync(...line), wait(4500)]); }
// a Vietnamese word or line on its own, by the Vietnamese voice; waits about as long as it takes to say (less with the voice off)
const hear = (text: string) => sayIn('vi', text);
const heard = (text: string) => { hear(text); return wait(settings.voice ? Math.min(7000, 600 + text.length * 75) : 250); };
const ear = (api, text: () => string) => { const b = el('button', 'vt-ear', pic('🔊')); b.setAttribute('aria-label', T('Hear again', 'Nghe lại')); b.onclick = () => { api.sfx.tap && api.sfx.tap(); hear(text()); }; return b; };
// an answer button: a picture, a word, and the meaning in English (in Vietnamese nothing: the word is the meaning)
function opt(row: HTMLElement, v: unknown, html: string, label: string, cls = 'vt-opt'): Btn {
  const b = Object.assign(el('button', 'choice ' + cls, html), { _v: v }) as Btn; b.setAttribute('aria-label', label); row.appendChild(b); return b;
}
const wordHtml = (w: Word, show: { pic?: boolean; word?: boolean; mean?: boolean }) =>
  `${show.pic !== false ? pic(w.p) : ''}${show.word ? `<b>${esc(w.w)}</b>` : ''}${show.mean ? `<small>${esc(T(w.en, ''))}</small>` : ''}`;
const strip = (s: string) => s.normalize('NFD').replace(/[̣̀́̃̉]/g, '').normalize('NFC');
function begin(api, board: HTMLElement, rounds: number, r: number) { api.dots(rounds, r); board.innerHTML = ''; }
function board(api) { style(); const b = el('div', 'vt-board'); api.stage.appendChild(b); return b; }
const choicesRow = (b: HTMLElement) => { const row = el('div', 'choices vt-choices'); b.appendChild(row); return row; };

// ---------- One Word, Many Tones (Dấu Thanh Đổi Nghĩa) ----------
register({ id: 'vi_tonemean', learn: true, icon: 'vi:tonemean', name: () => T('One Word, Many Tones', 'Dấu Thanh Đổi Nghĩa'), async run(api) {
  const lv = lvOf(api), rounds = [4, 5, 5, 6, 7][lv], nOpt = [2, 2, 3, 3, 4][lv];
  // under-5s and Easy: two pictures of one family, heard; Medium and Hard: three; Hard hides the words until the end;
  // Talent: the word is written, not said (read the tone mark), and a picture from another family joins in
  api.stage.dataset.lv = [rounds, nOpt, lv === 4 ? 1 : 0].join(',');
  const B = board(api); api.plan(() => null, { maxActions: rounds * 4 });
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return; begin(api, B, rounds, r);
    const set = pick(TONE_SETS.filter(s => s.words.length >= Math.min(3, nOpt))), target = pick(set.words);
    let opts = nOpt === 2 ? [target, pick(set.words.filter(w => w !== target))] : set.words.slice(0, 3);
    if (nOpt === 4) opts = [...opts, pick(TONE_SETS.filter(s => s !== set)).words[0]];
    opts = shuffle(opts);
    const card = el('div', 'vt-card', `<span class="vt-big">${lv === 4 ? esc(target.w) : esc(set.base) + '<i>?</i>'}</span>`);
    if (lv < 4) card.appendChild(ear(api, () => target.w));
    B.appendChild(card);
    const row = choicesRow(B), btns = opts.map(w => opt(row, w, wordHtml(w, { word: lv >= 1 && lv <= 2, mean: lv >= 1 }), w.w));
    await talk(api, lv === 4 ? ['Read the word. Which picture is it?', 'Đọc tiếng này. Đó là tranh nào?'] : ['Listen. Which picture is it?', 'Nghe nhé. Đó là tranh nào?']);
    if (api.closed) return;
    if (lv < 4) hear(target.w);
    if (!await untilRight(api, btns, b => b._v === target)) return;
    btns.forEach(b => { const w = b._v as Word; if (!b.querySelector('b')) b.insertAdjacentHTML('beforeend', `<b>${esc(w.w)}</b>`); });
    card.querySelector('.vt-big').textContent = target.w;
    await heard(target.w); if (api.closed) return;
    if (r === 0) await talk(api, ['A different tone mark makes a different word!', 'Đổi dấu thanh là thành tiếng khác, nghĩa khác!']);
    await wait(300);
  }
  api.dots(rounds, rounds); return api.win();
} });

// ---------- Rhyme Pairs (Tìm Vần Giống Nhau) ----------
const withRhyme = (w: string, r: string) => { const i = strip(w).lastIndexOf(r); return i < 0 ? esc(w) : esc(w.slice(0, i)) + `<i>${esc(w.slice(i))}</i>`; };
register({ id: 'vi_rhyme', learn: true, icon: 'vi:rhyme', name: () => T('Rhyme Pairs', 'Tìm Vần Giống Nhau'), async run(api) {
  const lv = lvOf(api), rounds = [4, 5, 5, 6, 7][lv], nOpt = [2, 2, 3, 4, 5][lv];
  // the rhyme is coloured up to Medium; Hard and Talent show it plain; under-5s choose from pictures only
  api.stage.dataset.lv = [rounds, nOpt, lv <= 2 ? 1 : 0].join(',');
  const B = board(api); api.plan(() => null, { maxActions: rounds * 5 });
  const sets = shuffle(RHYME_SETS);
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return; begin(api, B, rounds, r);
    const S = sets[r % sets.length], [t, a] = shuffle(S.words);
    const opts = shuffle([a, ...shuffle(RHYME_SETS.filter(x => x !== S)).slice(0, nOpt - 1).map(x => pick(x.words))]);
    const card = el('div', 'vt-card', `<span class="vt-pic">${pic(t.p)}</span><span class="vt-big">${lv <= 2 ? withRhyme(t.w, S.r) : esc(t.w)}</span><span class="vt-mean">${esc(T(t.en, ''))}</span>`);
    card.insertBefore(ear(api, () => t.w), card.querySelector('.vt-mean')); B.appendChild(card);
    const row = choicesRow(B), btns = opts.map(w => opt(row, w, wordHtml(w, { word: lv >= 1, mean: lv >= 1 }), w.w));
    await talk(api, ['Which word has the same rhyme as this one?', 'Tiếng nào có vần giống tiếng này?']);
    if (api.closed) return; hear(t.w);
    if (!await untilRight(api, btns, b => b._v === a)) return;
    await talk(api, ['Yes! They share the same rhyme.', 'Đúng rồi! Hai tiếng có vần giống nhau.']); if (api.closed) return;
    card.querySelector('.vt-mean').innerHTML = `${esc(t.w)} · ${esc(a.w)} · <b>${esc(T('rhyme', 'vần'))} ${esc(S.r)}</b>`;
    await heard(t.w); if (api.closed) return; await heard(a.w);
  }
  api.dots(rounds, rounds); return api.win();
} });

// ---------- Vietnamese Letters (Chữ Cái Việt) ----------
const SPECIAL = Object.keys(LETTER_FAMILY);
register({ id: 'vi_letters', learn: true, icon: 'vi:letters', name: () => T('Vietnamese Letters', 'Chữ Cái Việt'), async run(api) {
  const lv = lvOf(api), rounds = [4, 5, 6, 6, 7][lv], nOpt = [2, 2, 3, 4, 5][lv];
  // under-5s and Easy: the letter or its plain twin (ă or a); Medium: its family (a ă â); Hard and Talent mix in other
  // letters; Talent has no picture, only the word heard
  api.stage.dataset.lv = [rounds, nOpt, lv === 4 ? 0 : 1].join(',');
  const B = board(api); api.plan(() => null, { maxActions: rounds * 5 });
  const words = shuffle(LETTER_WORDS);
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return; begin(api, B, rounds, r);
    const w = words[r % words.length], ch = [...w.w], L = ch[w.at], fam = LETTER_FAMILY[L];
    let opts = nOpt === 2 ? [L, fam[0]] : fam.slice(0, nOpt);
    for (const x of shuffle([...SPECIAL, 'a', 'e', 'o', 'u', 'd'])) if (opts.length < nOpt && !opts.includes(x)) opts.push(x);
    opts = shuffle(opts);
    const shown = () => ch.map((c, i) => i === w.at ? `<span class="vt-gap">?</span>` : esc(c)).join('');
    const card = el('div', 'vt-card', `${lv < 4 ? `<span class="vt-pic">${pic(w.p)}</span>` : ''}<span class="vt-big">${shown()}</span><span class="vt-mean">${esc(T(w.en, ''))}</span>`);
    card.insertBefore(ear(api, () => w.w), card.querySelector('.vt-mean')); B.appendChild(card);
    const row = choicesRow(B), btns = opts.map(x => opt(row, x, `<b>${esc(x)}</b>`, x, 'vt-opt vt-letter'));
    await talk(api, ['Listen to the word. Which letter is missing?', 'Nghe tiếng này. Còn thiếu chữ cái nào?']);
    if (api.closed) return; hear(w.w);
    if (!await untilRight(api, btns, b => b._v === L)) return;
    card.querySelector('.vt-gap').textContent = L;
    await heard(LETTER_SAY(L)); if (api.closed) return; await heard(w.w);
  }
  api.dots(rounds, rounds); return api.win();
} });

// ---------- Opposite Pairs (Nối Từ Trái Nghĩa) ----------
register({ id: 'vi_opposite', learn: true, icon: 'vi:opposite', name: () => T('Opposite Pairs', 'Nối Từ Trái Nghĩa'), async run(api) {
  const lv = lvOf(api), boards = [2, 2, 2, 3, 3][lv], nPairs = [2, 2, 3, 4, 5][lv];
  // more pairs on each board up to Talent, where the cards show only their words (no pictures)
  api.stage.dataset.lv = [boards, nPairs, lv === 4 ? 0 : 1].join(',');
  const B = board(api); api.plan(() => null, { maxActions: boards * nPairs * 6 });
  const pool = shuffle(OPPOSITES);
  for (let r = 0; r < boards; r++) {
    if (api.closed) return; begin(api, B, boards, r);
    const pairs = pool.slice((r * nPairs) % pool.length).concat(pool).slice(0, nPairs);
    const card = el('div', 'vt-card', `<span class="vt-mean"></span>`); B.appendChild(card);
    const row = choicesRow(B), cards = shuffle(pairs.flatMap(([a, b]) => [{ w: a, mate: b }, { w: b, mate: a }]))
      .map(c => opt(row, c, wordHtml(c.w, { pic: lv < 4, word: lv >= 1, mean: lv >= 1 }), c.w.w, 'vt-opt vt-pair'));
    if (r === 0) { await talk(api, ['Find the opposites. Tap a word, then the word that means the opposite.', 'Tìm từ trái nghĩa. Chạm một từ, rồi chạm từ có nghĩa ngược lại.']); if (api.closed) return; }
    let left = cards.slice();
    while (left.length) {
      api.show('Tap a word.', 'Chạm vào một từ.');
      const first = await untilRight(api, left, () => true); if (!first) return;
      const c = first._v as { w: Word; mate: Word }; first.classList.add('sel'); hear(c.w.w);
      api.show('Now its opposite.', 'Giờ chạm từ ngược nghĩa với nó.');
      const second = await untilRight(api, left.filter(b => b !== first), b => (b._v as { w: Word }).w === c.mate); if (!second) return;
      for (const b of [first, second]) { b.classList.remove('sel'); b.classList.add('done'); b.disabled = true; }
      left = left.filter(b => b !== first && b !== second);
      card.querySelector('.vt-mean').textContent = T(`${c.w.w} ↔ ${c.mate.w} (${c.w.en} ↔ ${c.mate.en})`, `${c.w.w} ↔ ${c.mate.w}`);
      await heard(c.w.w); if (api.closed) return; await heard(c.mate.w); if (api.closed) return;
    }
    await wait(300);
  }
  api.dots(boards, boards); return api.win();
} });

// ---------- Folk Rhymes (Ca Dao Đồng Dao) and Picture Sayings (Tục Ngữ Có Hình): the missing word ----------
async function missingWord(api, list: Verse[], ask: Pair) {
  const lv = lvOf(api), rounds = [3, 4, 4, 5, 5][lv], nOpt = [2, 2, 3, 4, 5][lv];
  // under-5s and Easy: the easy verses, read aloud first; Medium on: all of them; Talent: read it yourself (not said first)
  const pool = shuffle(lv <= 1 ? list.filter(v => v.kid) : list);
  api.stage.dataset.lv = [rounds, nOpt, lv <= 1 ? 1 : 0, lv === 4 ? 0 : 1].join(',');
  const B = board(api); api.plan(() => null, { maxActions: rounds * 5 });
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return; begin(api, B, rounds, r);
    const v = pool[r % pool.length];
    const others = shuffle(list.filter(x => x.gap !== v.gap && !v.t.toLowerCase().includes(x.gap))).slice(0, nOpt - 1);
    const opts = shuffle([v, ...others]);
    const re = new RegExp('(^|[\\s,])' + v.gap + '(?=$|[\\s,])', 'u');
    const lines = v.t.replace(re, '$1\u0000').split(' / ').map(l => esc(l).replace('\u0000', '<span class="vt-gap">?</span>')).join('<br>');
    const card = el('div', 'vt-card', `<span class="vt-verse">${lines}</span><span class="vt-mean"></span>`);
    card.insertBefore(ear(api, () => gapped(v)), card.querySelector('.vt-mean')); B.appendChild(card);
    const row = choicesRow(B), btns = opts.map(x => opt(row, x, `${pic(x.p)}${lv >= 1 ? `<b>${esc(x.gap)}</b>` : ''}`, x.gap));
    await talk(api, ask); if (api.closed) return;
    if (lv < 4) hear(gapped(v));
    if (!await untilRight(api, btns, b => b._v === v)) return;
    card.querySelector('.vt-gap').textContent = v.gap;
    await heard(spoken(v.t)); if (api.closed) return;
    card.querySelector('.vt-mean').textContent = T(...v.m);
    await talk(api, v.m); await wait(300);
  }
  api.dots(rounds, rounds); return api.win();
}
register({ id: 'vi_cadao', learn: true, icon: 'vi:cadao', name: () => T('Folk Rhymes', 'Ca Dao Đồng Dao'),
  run: api => missingWord(api, VERSES, ['Which word is missing from the folk rhyme?', 'Câu ca dao, đồng dao này còn thiếu từ nào?']) });
register({ id: 'vi_tucngu', learn: true, icon: 'vi:tucngu', name: () => T('Picture Sayings', 'Tục Ngữ Có Hình'),
  run: api => missingWord(api, SAYINGS, ['Which picture finishes the saying?', 'Hình nào điền vào câu tục ngữ này?']) });

// ---------- Read Along (Bé Đọc To) ----------
// under-5s and Easy: three-word sentences; up to Talent: six words
const sentencesFor = (lv: number) => { const [lo, hi] = [[3, 3], [3, 3], [3, 4], [4, 5], [5, 6]][lv]; return shuffle(SENTENCES.filter(s => wordsOf(s).length >= lo && wordsOf(s).length <= hi)); };
register({ id: 'vi_readalong', learn: true, icon: 'vi:readalong', name: () => T('Read Along', 'Bé Đọc To'), async run(api) {
  const lv = lvOf(api), rounds = [3, 4, 4, 5, 5][lv];
  // up to Easy the next word glows and is said as it is tapped; from Medium the voice says the next word and the child
  // finds it in the sentence; Talent reads longer sentences without the picture
  api.stage.dataset.lv = [rounds, lv <= 1 ? 1 : 0, [3, 3, 4, 5, 6][lv], lv === 4 ? 0 : 1].join(',');
  const B = board(api), list = sentencesFor(lv); api.plan(() => null, { maxActions: rounds * 12 });
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return; begin(api, B, rounds, r);
    const s = list[r % list.length], words = wordsOf(s);
    const card = el('div', 'vt-card', `${lv < 4 ? `<span class="vt-pic">${pic(s.p)}</span>` : ''}<span class="vt-mean">${esc(T(s.en, ''))}</span>`);
    card.insertBefore(ear(api, () => s.t), card.querySelector('.vt-mean')); B.appendChild(card);
    const row = el('div', 'choices vt-read'); B.appendChild(row);
    const btns = words.map((w, i) => opt(row, i, `<b>${esc(w)}</b>`, w, 'vt-word'));
    if (r === 0) { await talk(api, lv <= 1 ? ['Read with me: tap each word as I read it.', 'Đọc cùng cô nhé: chạm vào từng tiếng khi cô đọc.'] : ['Listen, then tap the word you hear.', 'Nghe nhé, rồi chạm vào tiếng con nghe thấy.']); if (api.closed) return; }
    await heard(s.t); if (api.closed) return;
    for (let i = 0; i < words.length; i++) {
      if (lv <= 1) btns[i].classList.add('hint'); else hear(sayWord(words[i]));
      if (!await untilRight(api, btns.filter(b => !b.classList.contains('read')), b => b._v === i)) return;
      btns[i].classList.remove('hint'); btns[i].classList.add('read');
      if (lv <= 1) hear(sayWord(words[i]));
      await wait(lv <= 1 ? 450 : 250); if (api.closed) return;
    }
    await heard(s.t); if (api.closed) return; await wait(300);
  }
  api.dots(rounds, rounds); return api.win();
} });

// ---------- Make a Sentence (Bé Đặt Câu) ----------
register({ id: 'vi_sentence', learn: true, icon: 'vi:sentence', name: () => T('Make a Sentence', 'Bé Đặt Câu'), async run(api) {
  const lv = lvOf(api), rounds = [3, 4, 4, 5, 5][lv], extra = [0, 0, 1, 1, 2][lv];
  // longer sentences up to Talent, and from Medium one or two words that do not belong; up to Easy the sentence is heard
  // first and the next card glows for under-5s
  api.stage.dataset.lv = [rounds, [3, 3, 4, 5, 6][lv], extra, lv <= 1 ? 1 : 0].join(',');
  const B = board(api), list = sentencesFor(lv); api.plan(() => null, { maxActions: rounds * 14 });
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return; begin(api, B, rounds, r);
    const s = list[r % list.length], words = wordsOf(s);
    const spare = shuffle(SENTENCES.filter(x => x !== s).flatMap(wordsOf).map(sayWord).filter(w => !words.map(sayWord).includes(w))).filter((w, i, a) => a.indexOf(w) === i).slice(0, extra);
    const card = el('div', 'vt-card', `<span class="vt-pic">${pic(s.p)}</span><span class="vt-mean">${esc(T(s.en, ''))}</span>`);
    card.insertBefore(ear(api, () => s.t), card.querySelector('.vt-mean')); B.appendChild(card);
    const line = el('div', 'vt-line'); B.appendChild(line);
    const slots = words.map(() => { const d = el('div', 'vt-slot', '?'); line.appendChild(d); return d; });
    const row = choicesRow(B);
    const tiles = shuffle([...words.map((w, i) => ({ w: sayWord(w), i })), ...spare.map(w => ({ w, i: -1 }))]).map(t => opt(row, t, `<b>${esc(t.w)}</b>`, t.w, 'vt-opt vt-text'));
    if (r === 0) { await talk(api, ['Put the words in order to say what the picture shows.', 'Xếp các tiếng theo thứ tự để nói về bức tranh.']); if (api.closed) return; }
    if (lv <= 1) { await heard(s.t); if (api.closed) return; }
    for (let i = 0; i < words.length; i++) {
      slots.forEach((d, k) => d.classList.toggle('now', k === i));
      // (a word that comes twice in a sentence: either card is right)
      const got = await untilRight(api, tiles.filter(b => !b.disabled), b => (b._v as { w: string }).w === sayWord(words[i])); if (!got) return;
      got.disabled = true; got.style.visibility = 'hidden'; slots[i].textContent = words[i]; slots[i].classList.remove('now'); slots[i].classList.add('on');
      hear(sayWord(words[i])); await wait(350); if (api.closed) return;
    }
    await heard(s.t); if (api.closed) return; await wait(300);
  }
  api.dots(rounds, rounds); return api.win();
} });

// ---------- Listen and Spell (Nghe Và Viết) ----------
register({ id: 'vi_dictation', learn: true, icon: 'vi:dictation', name: () => T('Listen and Spell', 'Nghe Và Viết'), async run(api) {
  const lv = lvOf(api), rounds = [3, 4, 5, 5, 6][lv], extra = [0, 1, 2, 2, 3][lv];
  // longer words up to Talent; from Hard the extra letters are the same vowel with another tone mark, so the tone must
  // be heard; Talent has no picture
  const [lo, hi] = [[2, 2], [2, 2], [3, 3], [3, 4], [4, 6]][lv];
  const list = shuffle(SPELL_WORDS.filter(w => lettersOf(w.w).length >= lo && lettersOf(w.w).length <= hi));
  api.stage.dataset.lv = [rounds, lo + '-' + hi, extra, lv >= 3 ? 1 : 0, lv === 4 ? 0 : 1].join(',');
  const B = board(api); api.plan(() => null, { maxActions: rounds * 12 });
  const ABC = [...'abcdeghiklmnopqrstuvxyăâđêôơư'];
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return; begin(api, B, rounds, r);
    const w = list[r % list.length], ls = lettersOf(w.w);
    const twins = lv >= 3 ? shuffle(ls.flatMap(toneTwins)).filter(c => !ls.includes(c)) : [];
    const spare = [...twins, ...shuffle(ABC.filter(c => !ls.includes(c)))].filter((c, i, a) => a.indexOf(c) === i).slice(0, extra);
    const card = el('div', 'vt-card', `${lv < 4 ? `<span class="vt-pic">${pic(w.p)}</span>` : ''}<span class="vt-mean">${esc(T(w.en, ''))}</span>`);
    card.insertBefore(ear(api, () => w.w), card.querySelector('.vt-mean')); B.appendChild(card);
    const line = el('div', 'vt-line'); B.appendChild(line);
    const slots = ls.map(() => { const d = el('div', 'vt-slot', '?'); line.appendChild(d); return d; });
    const row = choicesRow(B);
    const tiles = shuffle([...ls, ...spare]).map(c => opt(row, c, `<b>${esc(c)}</b>`, c, 'vt-opt vt-letter'));
    if (r === 0) { await talk(api, ['Listen to the word, then tap its letters in order.', 'Nghe tiếng này, rồi chạm vào các chữ cái theo thứ tự.']); if (api.closed) return; }
    hear(w.w);
    for (let i = 0; i < ls.length; i++) {
      slots.forEach((d, k) => d.classList.toggle('now', k === i));
      const got = await untilRight(api, tiles.filter(b => !b.disabled), b => b._v === ls[i]); if (!got) return;
      got.disabled = true; got.style.visibility = 'hidden'; slots[i].textContent = ls[i]; slots[i].classList.remove('now'); slots[i].classList.add('on');
      await wait(200); if (api.closed) return;
    }
    await heard(w.w); if (api.closed) return; await wait(300);
  }
  api.dots(rounds, rounds); return api.win();
} });

// ---------- Folk Riddles (Câu Đố Dân Gian) ----------
register({ id: 'vi_riddle', learn: true, icon: 'vi:riddle', name: () => T('Folk Riddles', 'Câu Đố Dân Gian'), async run(api) {
  const lv = lvOf(api), rounds = [3, 4, 5, 5, 6][lv], nOpt = [2, 2, 3, 4, 5][lv];
  // the easy riddles up to Easy, all of them from Medium; the answers' names show from Easy (their meaning in English)
  const pool = shuffle(lv <= 1 ? RIDDLES.filter(q => q.kid) : RIDDLES);
  api.stage.dataset.lv = [rounds, nOpt, lv <= 1 ? 1 : 0].join(',');
  const B = board(api); api.plan(() => null, { maxActions: rounds * 5 });
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return; begin(api, B, rounds, r);
    const q = pool[r % pool.length], opts = shuffle([q, ...shuffle(RIDDLES.filter(x => x !== q)).slice(0, nOpt - 1)]);
    // in English the riddle is shown in Vietnamese with its English words under it; it is always said in Vietnamese
    const card = el('div', 'vt-card', `<span class="vt-riddle">${esc(q.q[1])}</span><span class="vt-mean">${esc(T(q.q[0], ''))}</span>`);
    card.insertBefore(ear(api, () => q.q[1]), card.querySelector('.vt-mean')); B.appendChild(card);
    const row = choicesRow(B), btns = opts.map(x => opt(row, x, `${pic(x.p)}${lv >= 1 ? `<b>${esc(x.a)}</b><small>${esc(T(x.en, ''))}</small>` : ''}`, x.a));
    if (r === 0) { await talk(api, ['Listen to the riddle. What is it?', 'Nghe câu đố nhé. Đó là gì?']); if (api.closed) return; }
    hear(q.q[1]);
    if (!await untilRight(api, btns, b => b._v === q)) return;
    await heard(q.a); if (api.closed) return; await wait(300);
  }
  api.dots(rounds, rounds); return api.win();
} });
