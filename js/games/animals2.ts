// Animals additions (owner, 23 Oct 2026 AEDT):
// Crab walk, who lives here, mums & babies, feed the zoo, buffalo to the field, reef count, and animal tracks.
import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, wait } from '../util.js';

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.a2-board { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px; margin: 0 auto; max-width: 96vw; }
.a2-stage { width: min(360px, 86vw); min-height: 200px; background: #fffdf6; border-radius: 20px; box-shadow: 0 4px 16px rgba(40, 30, 60, .14); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 14px; position: relative; }
.a2-controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 380px; }
.a2-btn { min-width: 64px; min-height: 64px; padding: 8px 16px; border-radius: 999px; border: 2px solid #3b2a4f; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .2); font: 800 17px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; touch-action: manipulation; }
.a2-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(59, 42, 79, .2); }
.a2-big { font-size: 72px; line-height: 1; text-align: center; }
.a2-row { display: flex; align-items: center; justify-content: center; gap: 18px; }
.a2-hole { font-size: 56px; }
`));
}

async function rounds(api: any, icon: string, prompt: [string, string], qs: Array<{ show: string; choices: string[][]; answer: number }>, done: [string, string]) {
  style(); api.say(prompt[0], prompt[1]); api.dots(qs.length, 0);
  const wrap = el('div', 'a2-board'), stage = el('div', 'a2-stage'), controls = el('div', 'a2-controls');
  api.stage.appendChild(wrap); wrap.append(stage, controls);
  let k = 0;
  while (k < qs.length) {
    stage.innerHTML = `<div class="a2-big">${qs[k].show}</div>`;
    controls.innerHTML = '';
    // (owner, 29 Oct 2026 AEDT audit) the answer was nearly always the first button: the order changes every round
    const order = qs[k].choices.map((_, i) => i).sort(() => Math.random() - .5);
    const btns = order.map(i => {
      const c = qs[k].choices[i], b = el('button', 'a2-btn', `<span>${T(c[0], c[1])}</span>`);
      b.dataset.i = String(i);
      controls.appendChild(b);
      return b;
    });
    const target = btns[order.indexOf(qs[k].answer)];
    api.plan(() => target, { maxActions: 5 });
    const clicked = await untilRight(api, btns, (e: HTMLElement) => e === target);
    if (!clicked || api.closed) return;
    api.sfx.ding();
    k++; api.dots(qs.length, k);
    await wait(250);
  }
  api.say(done[0], done[1]);
  await wait(900);
  return api.win({ title: T(done[0], done[1]) });
}

// 1. Crab Walk
register({
  id: 'crabwalk', icon: '🦀',
  name: () => T('Crab Walk', 'Cua Bò Ngang'),
  async run(api) {
    style();
    api.say('Help the crab scuttle sideways: tap left or right to reach the hole!',
      'Giúp chú cua bò ngang: chạm sang trái hoặc phải để về hang nhé!');
    api.dots(3, 0);
    const wrap = el('div', 'a2-board'), stage = el('div', 'a2-stage'), controls = el('div', 'a2-controls');
    api.stage.appendChild(wrap); wrap.append(stage, controls);
    // (owner, 29 Oct 2026 AEDT audit) the hole shows on the side the crab must walk to; before, nothing said which way
    const row = el('div', 'a2-row'), holeL = el('div', 'a2-big a2-hole', pic('🕳️')), crab = el('div', 'a2-big', pic('🦀')), holeR = el('div', 'a2-big a2-hole', pic('🕳️'));
    row.append(holeL, crab, holeR); stage.appendChild(row);
    const leftBtn = el('button', 'a2-btn', `<span>⬅️ ${T('Left', 'Trái')}</span>`);
    const rightBtn = el('button', 'a2-btn', `<span>${T('Right', 'Phải')} ➡️</span>`);
    controls.append(leftBtn, rightBtn);

    const steps = [leftBtn, rightBtn, leftBtn];
    let step = 0;
    while (step < 3) {
      const target = steps[step];
      holeL.style.visibility = target === leftBtn ? 'visible' : 'hidden'; holeR.style.visibility = target === rightBtn ? 'visible' : 'hidden';
      api.plan(() => target, { maxActions: 4 });
      const clicked = await untilRight(api, [leftBtn, rightBtn], (e: HTMLElement) => e === target);
      if (!clicked || api.closed) return;
      crab.style.transform = `translateX(${target === rightBtn ? '30px' : '-30px'})`; await wait(250); crab.style.transform = '';
      api.sfx.pop(step);
      step++;
      api.dots(3, step);
      await wait(300);
    }
    api.say('The little crab is safe in its sandy burrow!', 'Chú cua nhỏ đã về hang cát an toàn rồi!');
    await wait(1200);
    return api.win({ title: T('Crab is Home!', 'Cua Đã Về Hang!') });
  }
});

// 2. Who Lives Here?
register({
  id: 'whohome', icon: '🏠',
  name: () => T('Who Lives Here?', 'Nhà Của Ai?'),
  async run(api) {
    return rounds(api, '🏠',
      ['Where does each animal live?', 'Mỗi con vật sống ở đâu?'],
      [
        { show: '🐦', choices: [['Nest in tree', 'Tổ trên cây'], ['Under water', 'Dưới nước']], answer: 0 },
        { show: '🐠', choices: [['Burrow', 'Hang đất'], ['Coral reef', 'Rạn san hô']], answer: 1 },
        { show: '🐝', choices: [['Beehive', 'Tổ ong'], ['Doghouse', 'Chuồng chó']], answer: 0 }
      ],
      ['Every animal is snug at home!', 'Mọi con vật đều đã về tổ ấm!']
    );
  }
});

// 3. Mums and Babies
register({
  id: 'mumbaby', icon: '🦘',
  name: () => T('Mums and Babies', 'Mẹ Và Con'),
  async run(api) {
    return rounds(api, '🦘',
      ['Match each baby animal to its loving mum!', 'Tìm mẹ cho các con thú con đáng yêu nhé!'],
      [
        { show: '🦘 + ?', choices: [['🦘 Joey', '🦘 Chuột túi con'], ['🐶 Puppy', '🐶 Cún con']], answer: 0 },
        { show: '🐃 + ?', choices: [['🐱 Kitten', '🐱 Mèo con'], ['🐂 Calf (nghé)', '🐂 Chú nghé con']], answer: 1 },
        { show: '🦆 + ?', choices: [['🐥 Duckling', '🐥 Vịt con'], ['🐷 Piglet', '🐷 Heo con']], answer: 0 }
      ],
      ['All the babies found their mothers!', 'Các bạn nhỏ đã tìm được mẹ rồi!']
    );
  }
});

// 4. Feed the Zoo
register({
  id: 'feedzoo', icon: '🍎',
  name: () => T('Feed the Zoo', 'Cho Thú Ăn'),
  async run(api) {
    return rounds(api, '🍎',
      ['What does each zoo animal love to eat?', 'Mỗi bạn thú thích ăn món gì nhất?'],
      [
        { show: '🐵', choices: [['🍌 Banana', '🍌 Quả chuối'], ['🥩 Meat', '🥩 Thịt']], answer: 0 },
        { show: '🐨', choices: [['🍃 Gum leaves', '🍃 Lá bạch đàn'], ['🥕 Carrot', '🥕 Cà rốt']], answer: 0 },
        { show: '🐼', choices: [['🎋 Bamboo', '🎋 Cây tre'], ['🐟 Fish', '🐟 Cá']], answer: 0 }
      ],
      ['All the zoo animals are happily fed!', 'Các bạn thú trong sở thú đều no nê!']
    );
  }
});

// 5. Buffalo to the Field
register({
  id: 'buffalo', icon: '🐃',
  name: () => T('Buffalo to the Field', 'Dắt Trâu Ra Đồng'),
  async run(api) {
    style();
    api.say('Guide the water buffalo step by step down the dike to the grassy field!',
      'Dắt chú trâu từng bước men theo bờ đê ra cánh đồng cỏ xanh nhé!');
    api.dots(4, 0);
    const wrap = el('div', 'a2-board'), stage = el('div', 'a2-stage'), controls = el('div', 'a2-controls');
    api.stage.appendChild(wrap); wrap.append(stage, controls);
    const buf = el('div', 'a2-big', pic('🐃')); stage.appendChild(buf);
    const stepBtn = el('button', 'a2-btn', `${pic('🌾')} <span>${T('Step forward', 'Bước tới')}</span>`);
    controls.appendChild(stepBtn);

    let steps = 0;
    while (steps < 4) {
      api.plan(() => stepBtn, { maxActions: 5 });
      const clicked = await untilRight(api, [stepBtn], (e: HTMLElement) => e === stepBtn);
      if (!clicked || api.closed) return;
      steps++;
      api.dots(4, steps);
      api.sfx.pop(steps);
      buf.style.transform = `translateX(${steps * 15}px)`;
      await wait(300);
    }
    api.say('The buffalo is happily grazing on the sweet green grass!', 'Chú trâu đang thong dong gặm cỏ non tươi tốt!');
    await wait(1200);
    return api.win({ title: T('Buffalo in the Meadow!', 'Trâu Đã Ra Đồng!') });
  }
});

// 6. Reef Count
register({
  id: 'reefcount', icon: '🐠',
  name: () => T('Reef Count', 'Đếm Cá Rạn San Hô'),
  async run(api) {
    return rounds(api, '🐠',
      ['How many tropical fish are swimming around the reef?', 'Có bao nhiêu chú cá đang bơi quanh rạn san hô?'],
      [
        { show: '🐠 🐠 🐠', choices: [['3 fish', '3 con cá'], ['5 fish', '5 con cá']], answer: 0 },
        { show: '🐡 🐡 🐡 🐡', choices: [['2 fish', '2 con cá'], ['4 fish', '4 con cá']], answer: 1 },
        { show: '🐟 🐟 🐟 🐟 🐟', choices: [['5 fish', '5 con cá'], ['3 fish', '3 con cá']], answer: 0 }
      ],
      ['You counted every colorful reef fish!', 'Bé đếm đúng tất cả đàn cá sắc màu!']
    );
  }
});

// 7. Whose Footprints?
register({
  id: 'tracks', icon: '🐾',
  name: () => T('Whose Footprints?', 'Dấu Chân Của Ai?'),
  async run(api) {
    return rounds(api, '🐾',
      ['Whose tracks are these on the path?', 'Dấu chân trên đường là của bạn nào?'],
      [
        { show: pic('🐾'), choices: [['🐕 Puppy dog', '🐕 Chú cún'], ['🦆 Duck', '🦆 Chú vịt']], answer: 0 },
        { show: pic('track:duck'), choices: [['🦆 Duckling', '🦆 Chú vịt bầu'], ['🐱 Kitten', '🐱 Mèo con']], answer: 0 },
        { show: pic('track:bird'), choices: [['🐦 Little sparrow', '🐦 Chim sẻ'], ['🐃 Big buffalo', '🐃 Chú trâu']], answer: 0 }
      ],
      ['Track detective! You identified every paw and foot!', 'Thám tử dấu chân! Bé nhận biết mọi dấu chân thật tài!']
    );
  }
});