// Numbers additions (owner, 23 Oct 2026 AEDT): concrete counting, parity, sequence and sharing play.
// (owner, 29 Oct 2026 AEDT audit) rebuilt: the right answer was always the first button, the Vietnamese voice read the
// English line, Hop the Number Line and Before and After showed the answer on screen, and the dots were text symbols.
// Now each round draws what is counted (a number line with a frog, a ten frame, a dice face, pairs of apples, a
// caterpillar and blocks, shared pizza), says the question in both languages, and mixes up the answers.
import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, wait } from '../util.js';

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.n2-board { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px; margin: 0 auto; max-width: 96vw; }
.n2-stage { width: min(380px, 90vw); min-height: 180px; background: #fffdf6; border-radius: 20px; box-shadow: 0 4px 16px rgba(40, 30, 60, .14); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 12px; }
.n2-controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 380px; }
.n2-btn { min-width: 64px; min-height: 64px; padding: 8px 16px; border-radius: 999px; border: 2px solid #3b2a4f; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .2); font: 800 22px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; touch-action: manipulation; }
.n2-line { display: flex; gap: 2px; }
.n2-cell { width: min(30px, 7.6vw); display: flex; flex-direction: column; align-items: center; font: 800 16px var(--font, sans-serif); color: #3b2a4f; }
.n2-cell .n2-pad { height: 34px; display: flex; align-items: flex-end; font-size: 28px; line-height: 1; }
.n2-cell .n2-tick { width: 100%; border-top: 4px solid #3b6fe0; padding-top: 4px; text-align: center; }
.n2-frame { display: grid; grid-template-columns: repeat(5, 46px); grid-template-rows: repeat(2, 46px); border: 4px solid #3b2a4f; border-radius: 8px; background: #3b2a4f; gap: 3px; }
.n2-frame i { background: #fff; display: flex; align-items: center; justify-content: center; }
.n2-frame i.on::after { content: ''; width: 32px; height: 32px; border-radius: 50%; background: #e2483d; }
.n2-die { width: 120px; height: 120px; border-radius: 22px; background: #fff; border: 4px solid #3b2a4f; display: grid; grid-template: repeat(3, 1fr) / repeat(3, 1fr); padding: 10px; box-sizing: border-box; }
.n2-die i { display: flex; align-items: center; justify-content: center; }
.n2-die i.on::after { content: ''; width: 22px; height: 22px; border-radius: 50%; background: #3b2a4f; }
.n2-pairs { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; max-width: 320px; }
.n2-pair { display: flex; gap: 2px; padding: 4px; border: 3px dashed #c9b8dc; border-radius: 14px; font-size: 34px; line-height: 1; }
.n2-measure { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.n2-worm { height: 30px; border-radius: 15px; background: #6cc04a; display: flex; justify-content: flex-end; align-items: center; font-size: 30px; }
.n2-blocks { display: flex; gap: 0; }
.n2-blocks i { width: 36px; height: 30px; box-sizing: border-box; border: 3px solid #3b2a4f; background: #ffd34d; }
.n2-blocks i + i { border-left: 0; }
.n2-share { display: flex; gap: 16px; align-items: center; }
.n2-slices { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; max-width: 300px; font-size: 52px; line-height: 1; }
.n2-plates { display: flex; gap: 30px; font-size: 54px; }
.n2-big { font: 900 54px var(--font, sans-serif); color: #3b6fe0; letter-spacing: 8px; }
.n2-big b { display: inline-block; min-width: 44px; border-bottom: 5px solid #e2483d; color: #e2483d; }
`));
}

type Round = { draw: (stage: HTMLElement) => void; ask: [string, string]; answer: string; others: string[] };
const mix = <V,>(list: V[]): V[] => [...list].sort(() => Math.random() - .5);
const pick = (from: number, to: number) => from + Math.floor(Math.random() * (to - from + 1));
// numbers near the answer that are not the answer, inside lo..hi
const near = (n: number, lo: number, hi: number, k = 2) => mix([n - 2, n - 1, n + 1, n + 2].filter(v => v >= lo && v <= hi)).slice(0, k).map(String);

async function rounds(api, list: Round[], intro: [string, string], end: [string, string]) {
  style();
  api.say(intro[0], intro[1]);
  api.dots(list.length, 0);
  const wrap = el('div', 'n2-board'); api.stage.appendChild(wrap);
  const stage = el('div', 'n2-stage'); wrap.appendChild(stage);
  const controls = el('div', 'n2-controls'); wrap.appendChild(controls);
  await wait(1200);
  for (let k = 0; k < list.length; k++) {
    const q = list[k];
    stage.innerHTML = ''; controls.innerHTML = '';
    q.draw(stage);
    api.say(q.ask[0], q.ask[1]);
    const btns = mix([q.answer, ...q.others]).map(v => { const b = el('button', 'n2-btn', v); b.dataset.v = v; controls.appendChild(b); return b; });
    const target = btns.find(b => b.dataset.v === q.answer);
    api.plan(() => target, { maxActions: 5 });
    const clicked = await untilRight(api, btns, e => e === target);
    if (!clicked || api.closed) return;
    api.sfx.ding();
    api.dots(list.length, k + 1);
    await wait(700);
  }
  api.say(end[0], end[1]); await wait(900);
  return api.win({ title: T(end[0], end[1]) });
}
const numbers = (count: number, lo: number, hi: number) => mix(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, count);

register({
  id: 'numline', icon: '🔢', name: () => T('Hop the Number Line', 'Nhảy Trên Tia Số'),
  run: api => rounds(api, numbers(3, 0, api.little ? 5 : 8).map(n => ({
    ask: ['The frog is on ' + n + '. One hop forward: where does it land?', 'Ếch đang ở số ' + n + '. Nhảy thêm một bước: ếch tới số mấy?'],
    answer: String(n + 1), others: near(n + 1, 0, 10),
    draw: stage => {
      const line = el('div', 'n2-line');
      for (let i = 0; i <= 10; i++) line.appendChild(el('div', 'n2-cell', `<span class="n2-pad">${i === n ? pic('🐸') : ''}</span><span class="n2-tick">${i}</span>`));
      stage.appendChild(line);
    }
  })), ['Hop along the number line!', 'Cùng nhảy trên tia số nào!'], ['You reached every next number!', 'Bé nhảy đúng từng số tiếp theo!'])
});

register({
  id: 'tenframe', icon: '🔟', name: () => T('Ten Frame', 'Khung Mười'),
  run: api => rounds(api, numbers(3, 1, api.little ? 5 : 10).map(n => ({
    ask: ['How many counters are in the ten frame?', 'Khung mười có mấy hạt?'], answer: String(n), others: near(n, 1, 10),
    draw: stage => {
      const f = el('div', 'n2-frame');
      for (let i = 0; i < 10; i++) f.appendChild(el('i', i < n ? 'on' : ''));
      stage.appendChild(f);
    }
  })), ['Count the counters in the ten frame!', 'Đếm các hạt trong khung mười nhé!'], ['The ten frame helps you see numbers!', 'Khung mười giúp bé nhìn số thật rõ!'])
});

// where the dots sit on a dice face, cells 0 to 8 of a 3 by 3 grid
const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
register({
  id: 'dice', icon: '🎲', name: () => T('Dice Count', 'Đếm Xúc Xắc'),
  run: api => rounds(api, numbers(3, 1, 6).map(n => ({
    ask: ['How many dots on the dice?', 'Mặt xúc xắc có mấy chấm?'], answer: String(n), others: near(n, 1, 6),
    draw: stage => {
      const d = el('div', 'n2-die');
      for (let i = 0; i < 9; i++) d.appendChild(el('i', PIPS[n].includes(i) ? 'on' : ''));
      stage.appendChild(d);
    }
  })), ['Count the dots on the dice!', 'Đếm chấm trên xúc xắc nào!'], ['All the dice are counted!', 'Bé đếm xúc xắc thật giỏi!'])
});

register({
  id: 'evenodd', icon: '⚽', name: () => T('Pairs or Odd?', 'Chẵn Hay Lẻ?'),
  run: api => {
    const even = T('Even: all in pairs', 'Chẵn: đủ đôi'), odd = T('Odd: one left over', 'Lẻ: thừa một');
    const ns = mix([pick(1, 4) * 2, pick(1, 4) * 2 + 1, pick(0, 1) ? pick(1, 4) * 2 : pick(1, 4) * 2 + 1]);
    return rounds(api, ns.map(n => ({
      ask: ['Here are ' + n + ' apples. Does every apple have a partner?', 'Có ' + n + ' quả táo. Quả nào cũng có đôi không?'],
      answer: n % 2 ? odd : even, others: [n % 2 ? even : odd],
      draw: stage => {
        const p = el('div', 'n2-pairs');
        for (let i = 0; i < n; i += 2) p.appendChild(el('div', 'n2-pair', pic('🍎') + (i + 1 < n ? pic('🍎') : '')));
        stage.appendChild(p);
      }
    })), ['Put the apples in pairs: even or odd?', 'Xếp táo thành từng đôi: chẵn hay lẻ?'], ['Even and odd are clear!', 'Bé phân biệt chẵn lẻ thật chuẩn!']);
  }
});

register({
  id: 'measure', icon: '📏', name: () => T('Measure with Blocks', 'Đo Bằng Khối'),
  run: api => rounds(api, numbers(3, 2, api.little ? 5 : 8).map(n => ({
    ask: ['How many blocks long is the caterpillar?', 'Chú sâu dài mấy khối?'], answer: String(n), others: near(n, 1, 9),
    draw: stage => {
      const m = el('div', 'n2-measure');
      const worm = el('div', 'n2-worm', pic('🐛')); worm.style.width = (n * 36) + 'px';
      const blocks = el('div', 'n2-blocks'); for (let i = 0; i < n; i++) blocks.appendChild(el('i', ''));
      m.append(worm, blocks); stage.appendChild(m);
    }
  })), ['Measure with blocks!', 'Cùng đo bằng khối nào!'], ['You measured every length!', 'Bé đo độ dài thật chính xác!'])
});

register({
  id: 'beforeafter', icon: '🔄', name: () => T('Before and After', 'Số Trước Số Sau'),
  run: api => rounds(api, numbers(4, 2, api.little ? 9 : 19).map((n, i) => {
    const after = i % 2 === 1;
    return {
      ask: after ? ['What number comes just after ' + n + '?', 'Số nào đứng ngay sau số ' + n + '?'] : ['What number comes just before ' + n + '?', 'Số nào đứng ngay trước số ' + n + '?'],
      answer: String(after ? n + 1 : n - 1), others: [String(after ? n - 1 : n + 1), String(after ? n + 2 : n - 2)].filter(v => +v >= 0),
      draw: stage => { stage.appendChild(el('div', 'n2-big', after ? `${n} <b>?</b>` : `<b>?</b> ${n}`)); }
    };
  }), ['Find the number before or after!', 'Tìm số đứng trước hoặc đứng sau nhé!'], ['Before and after, you know them all!', 'Số trước số sau, bé biết hết rồi!'])
});

register({
  id: 'halves', icon: '🍕', name: () => T('Share in Half', 'Chia Đôi'),
  run: api => rounds(api, mix([2, 4, 6, 8, 10]).slice(0, 3).map(n => ({
    ask: ['Share ' + n + ' slices fairly between two friends. How many each?', 'Chia đều ' + n + ' miếng bánh cho hai bạn. Mỗi bạn mấy miếng?'],
    answer: String(n / 2), others: near(n / 2, 1, 10),
    draw: stage => {
      const s = el('div', 'n2-share');
      s.appendChild(el('div', 'n2-slices', pic('🍕').repeat(n)));
      stage.append(s, el('div', 'n2-plates', pic('🧒') + pic('👧')));
    }
  })), ['Share the pizza in half!', 'Chia đôi bánh pizza nào!'], ['A fair half for everyone!', 'Bé chia đôi thật công bằng!'])
});
