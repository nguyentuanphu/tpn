// (Học vui, owner's plan 1 Nov 2026 AEDT, docs/learn-tab/PLAN.md) The Tiếng Việt corner's own games.
//   Tone Detective (Dấu thanh): hear a syllable (ma, má, mà, mả, mã, mạ and others) and pick its tone mark; Talent mixes
//   in words of two syllables.
//   Build a Syllable (Ghép vần): build the name of a picture from its consonant, its rhyme and its tone mark.
// The Vietnamese syllables are always said by the Vietnamese voice (sayIn 'vi'), in either language; they are recorded
// into the voice pack from js/content/hocvui.ts hocvuiLines(). Levels: under-5s get two choices and nobody can lose
// (the right one wiggles after a wait), then more choices and finer differences up to Talent.
import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, esc, shuffle, pick, wait } from '../util.js';
import { fresh } from './variety.js';
import { sayIn, sayAsync, captionOnly } from '../voice.js';
import { TONE_FAMILIES, TONE_NAMES, TONE_WORDS, RHYMES, BUILD_WORDS, ONSETS, type BuildWord } from '../content/hocvui.js';

type Pair = [string, string];
let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.tv-board { display: flex; flex-direction: column; align-items: center; gap: 12px; width: max-content; max-width: 100%; }
.tv-board > .choices { max-width: min(560px, 94vw); }
.tv-card { display: flex; align-items: center; justify-content: center; gap: 14px; min-width: min(300px, 86vw); min-height: 110px; padding: 10px 18px; border-radius: 22px; background: #fffdf6; box-shadow: 0 4px 16px rgba(40, 30, 60, .16); }
.tv-big { font: 900 clamp(48px, 13vw, 76px) var(--font, sans-serif); color: #3b2a4f; letter-spacing: 2px; }
.tv-big i { font-style: normal; color: #e8433a; }
.tv-ear { min-width: 64px; min-height: 64px; border-radius: 50%; border: 2px solid #3b2a4f; background: #dff4ff; padding: 6px; }
.tv-ear svg.art { width: 46px; height: 46px; }
.tv-pic { width: 96px; height: 96px; }
.tv-pic svg.art { width: 100%; height: 100%; }
.tv-mean { font: 700 15px var(--font, sans-serif); color: #6a5a7a; }
.tv-slots { display: flex; gap: 8px; }
.tv-slot { min-width: 64px; height: 72px; padding: 0 10px; border-radius: 14px; border: 3px dashed #b29cc5; display: flex; align-items: center; justify-content: center; font: 900 36px var(--font, sans-serif); color: #3b2a4f; background: #fff; }
.tv-slot.on { border-style: solid; border-color: #43c463; background: #eaffea; }
.tv-slot.now { border-color: #ffb020; box-shadow: 0 0 0 4px rgba(255, 176, 32, .3); }
.tv-slot svg.art { width: 48px; height: 48px; }
.tv-choices .choice.tv-opt { width: clamp(72px, 19vw, 118px); height: clamp(80px, 21vw, 124px); flex-direction: column; gap: 2px; padding: 4px; }
.tv-choices .choice.tv-opt b { font: 900 clamp(28px, 7vw, 40px) var(--font, sans-serif); color: #3b2a4f; line-height: 1.1; }
.tv-choices .choice.tv-opt svg.art { width: 46%; height: auto; flex: 0 1 auto; min-height: 0; }
.tv-choices .choice.tv-opt small { font: 700 12px var(--font, sans-serif); color: #6a5a7a; }
.tv-choices .choice.tv-word b { font-size: clamp(20px, 5.4vw, 30px); }
.tv-choices .choice.tv-word { width: clamp(132px, 40vw, 200px); height: 72px; }
`));
}
const lvOf = (api): number => api.little ? 0 : 1 + Math.max(0, Math.min(3, api.smart | 0));
// say a fixed line (shown and spoken), wait for it (at most a few seconds), then the Vietnamese word on its own
async function talk(api, line: Pair) { api.show(...line); captionOnly(...line); await Promise.race([sayAsync(...line), wait(4500)]); }
const hear = (word: string) => sayIn('vi', word);
const ear = (api, word: () => string) => { const b = el('button', 'tv-ear', pic('🔊')); b.setAttribute('aria-label', T('Hear again', 'Nghe lại')); b.onclick = () => { api.sfx.tap && api.sfx.tap(); hear(word()); }; return b; };

// ---------- Tone Detective (Dấu thanh) ----------
const TONE_WHY: Pair[] = [
  ['No mark: the voice stays flat.', 'Không dấu: giọng đi ngang, đều đều.'],
  ['The rising mark: the voice goes up.', 'Dấu sắc: giọng đi lên.'],
  ['The falling mark: the voice goes down.', 'Dấu huyền: giọng đi xuống.'],
  ['The dipping mark: the voice dips, then rises.', 'Dấu hỏi: giọng xuống rồi lên.'],
  ['The broken mark: the voice breaks, then jumps up.', 'Dấu ngã: giọng ngắt rồi vút lên.'],
  ['The heavy dot: the voice drops short and low.', 'Dấu nặng: giọng nặng, ngắn và thấp.']
];
register({ id: 'vi_tones', learn: true, icon: 'vi:tones', name: () => T('Tone Detective', 'Thám Tử Dấu Thanh'), async run(api) {
  style();
  const lv = lvOf(api), rounds = [4, 5, 5, 6, 7][lv];
  // the marks a level asks about: under-5s two of the three easiest, Easy those three, Medium adds the heavy dot,
  // Hard and Talent all six (Talent also hears words of two syllables)
  const MARKS = [[0, 1, 2], [0, 1, 2], [0, 1, 2, 5], [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5]][lv];
  const families = lv <= 1 ? TONE_FAMILIES.slice(1) : TONE_FAMILIES, words = shuffle(TONE_WORDS);
  // (v1.07 levels) the real values: rounds, marks to choose from (under-5s two of them), words of two syllables
  api.stage.dataset.lv = [rounds, lv === 0 ? 2 : MARKS.length, lv === 4 ? 1 : 0].join(',');
  const board = el('div', 'tv-board'); api.stage.appendChild(board);
  api.plan(() => null, { maxActions: rounds * 4 });
  // (v1.08 variety) a word not heard before in this game (the marks stay in their own order, so a mark keeps its place)
  const nextTone = fresh(() => { const fam = pick(families), use = lv === 0 ? shuffle(MARKS).slice(0, 2) : MARKS.slice(), mark = pick(use); return { fam, use, mark }; }, x => x.fam[x.mark]);
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return;
    api.dots(rounds, r); board.innerHTML = '';
    const word = lv === 4 && r % 2 === 1 ? words[(r >> 1) % words.length] : null;
    let target: string, opts: string[], mark = -1;
    if (word) { target = word[0]; opts = shuffle(word); }
    else {
      const t = nextTone(), fam = t.fam, use = t.use;
      mark = t.mark; target = fam[mark]; opts = use.map(k => fam[k]);
    }
    const card = el('div', 'tv-card', `<span class="tv-big">${word ? '? ?' : esc(target.normalize('NFD').replace(/[̣̀́̃̉]/g, '').normalize('NFC'))}<i>?</i></span>`);
    card.appendChild(ear(api, () => target)); board.appendChild(card);
    const row = el('div', 'choices tv-choices'); board.appendChild(row);
    const btns = opts.map(o => {
      const k = word ? -1 : TONE_FAMILIES.find(f => f.includes(o)).indexOf(o);
      const b = Object.assign(el('button', 'choice tv-opt' + (word ? ' tv-word' : ''), `<b>${esc(o)}</b>${k >= 0 ? pic('tone:' + k) + `<small>${esc(T(...TONE_NAMES[k]))}</small>` : ''}`), { _v: o });
      b.setAttribute('aria-label', o); row.appendChild(b); return b;
    });
    await talk(api, word ? ['Listen to the two words. Which one did you hear?', 'Nghe hai tiếng này. Con nghe thấy từ nào?'] : ['Listen to the word. Which tone mark does it have?', 'Nghe tiếng này. Tiếng có dấu thanh gì?']);
    if (api.closed) return;
    hear(target);
    const got = await untilRight(api, btns, b => b._v === target); if (!got) return;
    card.querySelector('.tv-big').textContent = target; hear(target);
    await wait(1100); if (api.closed) return;
    if (mark >= 0) { await talk(api, TONE_WHY[mark]); } else { await talk(api, ['Yes! Every part of the word keeps its own tone mark.', 'Đúng rồi! Mỗi tiếng trong từ có dấu thanh của riêng nó.']); }
    await wait(300);
  }
  api.dots(rounds, rounds);
  return api.win();
} });

// ---------- Build a Syllable (Ghép vần) ----------
const STEP_ASK: Record<string, Pair> = {
  onset: ['Which sound does it start with?', 'Tiếng này bắt đầu bằng âm gì?'],
  rhyme: ['Which rhyme comes next?', 'Vần tiếp theo là vần gì?'],
  tone: ['Which tone mark does it need?', 'Tiếng này cần dấu thanh gì?']
};
const withTone = (w: BuildWord, tone: number) => w[2] + RHYMES[w[3]][tone];
register({ id: 'vi_build', learn: true, icon: 'vi:build', name: () => T('Build a Syllable', 'Bé Ghép Vần'), async run(api) {
  style();
  const lv = lvOf(api), rounds = [4, 4, 5, 5, 6][lv], nOpts = [2, 2, 3, 4, 5][lv];
  // under-5s only choose the first sound; Easy also the rhyme; from Medium the tone mark too
  const steps = lv === 0 ? ['onset'] : lv === 1 ? ['onset', 'rhyme'] : ['onset', 'rhyme', 'tone'];
  const [lo, hi] = [[1, 1], [1, 1], [1, 2], [2, 3], [3, 3]][lv];
  const list = shuffle(BUILD_WORDS.filter(w => w[6] >= lo && w[6] <= hi));
  // (v1.07 levels) the real values: rounds, choices per step, steps to build, word difficulty, word heard first
  api.stage.dataset.lv = [rounds, nOpts, steps.length, lo + '-' + hi, lv < 4 ? 1 : 0].join(',');
  if (lv === 4) list.sort((a, b) => Number(b[2] === 'k') - Number(a[2] === 'k')); // Talent: the c / k spelling rule comes up
  const board = el('div', 'tv-board'); api.stage.appendChild(board);
  api.plan(() => null, { maxActions: rounds * 8 });
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return;
    api.dots(rounds, r); board.innerHTML = '';
    const w = list[r % list.length], [word, p, onset, rhyme, tone, mean] = w;
    // (in English its meaning is shown; in Vietnamese nothing, so the word is not given away before it is built)
    const card = el('div', 'tv-card', `<span class="tv-pic">${pic(p)}</span><span class="tv-mean">${esc(T(mean, ''))}</span>`);
    // Talent: the child builds the word from the picture alone, and hears it only when it is built
    if (lv < 4) card.appendChild(ear(api, () => word));
    board.appendChild(card);
    const slots = el('div', 'tv-slots'); board.appendChild(slots);
    const sOn = el('div', 'tv-slot', '?'), sRh = el('div', 'tv-slot', '?'), sTo = el('div', 'tv-slot', '?'); slots.append(sOn, sRh, sTo);
    const fill = (k: string) => { if (k === 'onset') { sOn.textContent = onset; sOn.classList.add('on'); } if (k === 'rhyme') { sRh.textContent = RHYMES[rhyme][0]; sRh.classList.add('on'); } if (k === 'tone') { sTo.innerHTML = pic('tone:' + tone); sTo.classList.add('on'); } };
    ['onset', 'rhyme', 'tone'].filter(k => !steps.includes(k)).forEach(fill);
    const row = el('div', 'choices tv-choices'); board.appendChild(row);
    if (r === 0) { await talk(api, ['Build the word for the picture: its first sound, its rhyme and its tone mark.', 'Ghép tiếng cho bức tranh: âm đầu, vần và dấu thanh.']); if (api.closed) return; }
    if (lv < 4) { await talk(api, ['Look at the picture and listen.', 'Nhìn tranh và lắng nghe nhé.']); if (api.closed) return; hear(word); await wait(900); }
    for (const k of steps) {
      if (api.closed) return;
      [sOn, sRh, sTo].forEach(s => s.classList.remove('now')); ({ onset: sOn, rhyme: sRh, tone: sTo })[k].classList.add('now');
      let opts: string[];
      if (k === 'onset') {
        const near = lv === 4 && (onset === 'c' || onset === 'k') ? [onset === 'c' ? 'k' : 'c'] : [];
        opts = shuffle([onset, ...near, ...shuffle(ONSETS.filter(o => o !== onset && !near.includes(o)))].slice(0, nOpts));
      } else if (k === 'rhyme') opts = shuffle([rhyme, ...shuffle(Object.keys(RHYMES).filter(x => x !== rhyme))].slice(0, nOpts));
      else opts = shuffle([String(tone), ...shuffle([0, 1, 2, 3, 4, 5].filter(t => t !== tone)).map(String)].slice(0, nOpts));
      row.innerHTML = '';
      const btns = opts.map(o => {
        const html = k === 'tone' ? `<b>${esc(withTone(w, +o))}</b>${pic('tone:' + o)}<small>${esc(T(...TONE_NAMES[+o]))}</small>` : `<b>${esc(k === 'rhyme' ? RHYMES[o][0] : o)}</b>`;
        const b = Object.assign(el('button', 'choice tv-opt', html), { _v: o }); b.setAttribute('aria-label', k === 'tone' ? withTone(w, +o) : k === 'rhyme' ? RHYMES[o][0] : o); row.appendChild(b); return b;
      });
      api.say(...STEP_ASK[k]);
      const want = k === 'onset' ? onset : k === 'rhyme' ? rhyme : String(tone);
      if (!await untilRight(api, btns, b => b._v === want)) return;
      fill(k); await wait(250);
    }
    [sOn, sRh, sTo].forEach(s => s.classList.remove('now')); row.innerHTML = '';
    card.querySelector('.tv-mean').innerHTML = `<span class="tv-big">${esc(word)}</span>`;
    hear(word); await wait(1500);
  }
  api.dots(rounds, rounds);
  return api.win();
} });
