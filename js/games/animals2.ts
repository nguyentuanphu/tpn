// Animals additions (owner, 23 Oct 2026 AEDT):
// Crab walk, who lives here, mums & babies, feed the zoo, buffalo to the field, reef count, and animal tracks.
import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic, hasArt, labelArt } from '../art.js';
import { el, wait } from '../util.js';

// (owner, 1 Nov 2026 AEDT: "the levels often don't change anything") one value per level: under-5s keep the first, big kids
// get Easy · Medium · Hard · Talent. The values a game uses are on its stage (data-lv) for the checks.
const lv = <V>(api, little: V, easy: V, medium: V, hard: V, talent: V): V => { const v = api.little ? little : [easy, medium, hard, talent][Math.max(0, Math.min(3, api.smart || 0))]; api.lvNote?.([little, easy, medium, hard, talent], v); return v; };
const mark = (api, ...v: unknown[]) => { api.stage.dataset.lv = v.join(','); };

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.a2-board { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px; margin: 0 auto; max-width: 96vw; }
.a2-stage { width: min(360px, 86vw); min-height: 200px; background: #fffdf6; border-radius: 20px; box-shadow: 0 4px 16px rgba(40, 30, 60, .14); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 14px; position: relative; }
.a2-controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 380px; }
.a2-btn { min-width: 64px; min-height: 64px; padding: 8px 16px; border-radius: 999px; border: 2px solid #3b2a4f; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .2); font: 800 17px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; touch-action: manipulation; }
.a2-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(59, 42, 79, .2); }
.a2-btn .lbl-art .art { width: 30px; height: 30px; vertical-align: middle; }
.a2-big { font-size: 72px; line-height: 1; text-align: center; }
.a2-big.many { font-size: 44px; }
.a2-row { display: flex; align-items: center; justify-content: center; gap: 18px; }
.a2-hole { font-size: 56px; }
.a2-sign { position: absolute; top: 10px; right: 12px; font-size: 44px; transition: opacity .3s; }
`));
}

// A question: a picture, its answers (one right) and two more wrong answers that harder levels add.
type Q = { show: string; choices: string[][]; answer: number; more: string[][] };
// (owner, 1 Nov 2026 AEDT) each list has easy and hard questions. Easy: the easy ones, two answers. Medium: one hard question
// more, three answers. Hard: the hard ones and two easy ones, three answers. Talent: every question, four answers.
// Under-5s play the easy ones with two answers, as before.
function pickQs(api, easy: Q[], hard: Q[]): Q[] {
  const mixed = <V>(a: V[]) => [...a].sort(() => Math.random() - .5);
  // (v1.07 levels) the level picks a question set by name, so the level note on the frame stays short
  const set = lv(api, 'easy', 'easy', 'easy+1hard', 'hard+2easy', 'all');
  const qs = set === 'easy' ? easy : set === 'easy+1hard' ? easy.concat(hard.slice(0, 1)) : set === 'hard+2easy' ? mixed(hard.concat(easy.slice(0, 2))) : mixed(hard.concat(easy));
  const extra = lv(api, 0, 0, 1, 1, 2);
  mark(api, qs.length, 2 + extra);
  return qs.map(q => ({ ...q, choices: q.choices.concat(q.more.slice(0, extra)) }));
}
// a picture of emoji (our drawings) or a drawing already made
const showArt = (s: string) => s.includes('<') ? s : s.split(' ').map(t => hasArt(t) ? pic(t) : t).join(' ');

async function rounds(api: any, icon: string, prompt: [string, string], easy: Q[], hard: Q[], done: [string, string]) {
  const qs = pickQs(api, easy, hard);
  style(); api.say(prompt[0], prompt[1]); api.dots(qs.length, 0);
  const wrap = el('div', 'a2-board'), stage = el('div', 'a2-stage'), controls = el('div', 'a2-controls');
  api.stage.appendChild(wrap); wrap.append(stage, controls);
  let k = 0;
  while (k < qs.length) {
    stage.innerHTML = `<div class="a2-big${qs[k].show.split(' ').length > 5 ? ' many' : ''}">${showArt(qs[k].show)}</div>`;
    controls.innerHTML = '';
    // (owner, 29 Oct 2026 AEDT audit) the answer was nearly always the first button: the order changes every round
    const order = qs[k].choices.map((_, i) => i).sort(() => Math.random() - .5);
    const btns = order.map(i => {
      const c = qs[k].choices[i], b = el('button', 'a2-btn', `<span>${labelArt(T(c[0], c[1]))}</span>`);
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
    // more steps each level; on Hard the hole only shows for a moment, and on Talent for a blink
    const total = lv(api, 3, 4, 6, 8, 10), showMs = lv(api, 0, 0, 0, 1200, 600);
    mark(api, total, showMs);
    api.dots(total, 0);
    const wrap = el('div', 'a2-board'), stage = el('div', 'a2-stage'), controls = el('div', 'a2-controls');
    api.stage.appendChild(wrap); wrap.append(stage, controls);
    // (owner, 29 Oct 2026 AEDT audit) the hole shows on the side the crab must walk to; before, nothing said which way
    const row = el('div', 'a2-row'), holeL = el('div', 'a2-big a2-hole', pic('🕳️')), crab = el('div', 'a2-big', pic('🦀')), holeR = el('div', 'a2-big a2-hole', pic('🕳️'));
    row.append(holeL, crab, holeR); stage.appendChild(row);
    const leftBtn = el('button', 'a2-btn', `<span>⬅️ ${T('Left', 'Trái')}</span>`);
    const rightBtn = el('button', 'a2-btn', `<span>${T('Right', 'Phải')} ➡️</span>`);
    controls.append(leftBtn, rightBtn);

    const steps = api.little ? [leftBtn, rightBtn, leftBtn] : Array.from({ length: total }, (_, i) => i < 3 ? [leftBtn, rightBtn, leftBtn][i] : Math.random() < .5 ? leftBtn : rightBtn);
    // (v1.08 variety) never the same way three times in a row
    for (let i = 2; i < steps.length; i++) if (steps[i] === steps[i - 1] && steps[i] === steps[i - 2]) steps[i] = steps[i] === leftBtn ? rightBtn : leftBtn;
    let step = 0;
    while (step < total) {
      const target = steps[step];
      holeL.style.visibility = target === leftBtn ? 'visible' : 'hidden'; holeR.style.visibility = target === rightBtn ? 'visible' : 'hidden';
      const hide = showMs ? setTimeout(() => { holeL.style.visibility = holeR.style.visibility = 'hidden'; }, showMs) : 0;
      api.plan(() => target, { maxActions: 4 });
      const clicked = await untilRight(api, [leftBtn, rightBtn], (e: HTMLElement) => e === target);
      clearTimeout(hide);
      if (!clicked || api.closed) return;
      crab.style.transform = `translateX(${target === rightBtn ? '30px' : '-30px'})`; await wait(250); crab.style.transform = '';
      api.sfx.pop(step);
      step++;
      api.dots(total, step);
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
        { show: '🐦', choices: [['Nest in tree', 'Tổ trên cây'], ['Under water', 'Dưới nước']], answer: 0, more: [['Cave', 'Hang động'], ['Doghouse', 'Chuồng chó']] },
        { show: '🐠', choices: [['Burrow', 'Hang đất'], ['Coral reef', 'Rạn san hô']], answer: 1, more: [['Nest in tree', 'Tổ trên cây'], ['Desert', 'Sa mạc']] },
        { show: '🐝', choices: [['Beehive', 'Tổ ong'], ['Doghouse', 'Chuồng chó']], answer: 0, more: [['Under water', 'Dưới nước'], ['Icy shore', 'Bờ biển băng giá']] }
      ],
      [
        { show: '🦇', choices: [['Cave', 'Hang động'], ['Beehive', 'Tổ ong']], answer: 0, more: [['Coral reef', 'Rạn san hô'], ['Doghouse', 'Chuồng chó']] },
        { show: '🐧', choices: [['Desert', 'Sa mạc'], ['Icy shore', 'Bờ biển băng giá']], answer: 1, more: [['Tree top', 'Ngọn cây'], ['Beehive', 'Tổ ong']] },
        { show: '🐊', choices: [['River bank', 'Bờ sông'], ['Tree top', 'Ngọn cây']], answer: 0, more: [['Beehive', 'Tổ ong'], ['Icy shore', 'Bờ biển băng giá']] },
        { show: '🐿️', choices: [['Hollow in a tree', 'Hốc cây'], ['Under water', 'Dưới nước']], answer: 0, more: [['Desert', 'Sa mạc'], ['Coral reef', 'Rạn san hô']] }
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
        { show: '🦘 + ?', choices: [['🦘 Joey', '🦘 Chuột túi con'], ['🐶 Puppy', '🐶 Cún con']], answer: 0, more: [['🐱 Kitten', '🐱 Mèo con'], ['🐥 Duckling', '🐥 Vịt con']] },
        { show: '🐃 + ?', choices: [['🐱 Kitten', '🐱 Mèo con'], ['🐂 Calf (nghé)', '🐂 Chú nghé con']], answer: 1, more: [['🐶 Puppy', '🐶 Cún con'], ['🐷 Piglet', '🐷 Heo con']] },
        { show: '🦆 + ?', choices: [['🐥 Duckling', '🐥 Vịt con'], ['🐷 Piglet', '🐷 Heo con']], answer: 0, more: [['🐶 Puppy', '🐶 Cún con'], ['🐱 Kitten', '🐱 Mèo con']] }
      ],
      [
        { show: '🐨 + ?', choices: [['🐨 Joey', '🐨 Koala con'], ['🐻 Cub', '🐻 Gấu con']], answer: 0, more: [['🐶 Puppy', '🐶 Cún con'], ['🐥 Duckling', '🐥 Vịt con']] },
        { show: '🐘 + ?', choices: [['🐷 Piglet', '🐷 Heo con'], ['🐘 Calf', '🐘 Voi con']], answer: 1, more: [['🐱 Kitten', '🐱 Mèo con'], ['🐨 Joey', '🐨 Koala con']] },
        { show: '🦊 + ?', choices: [['🦊 Kit', '🦊 Cáo con'], ['🐑 Lamb', '🐑 Cừu con']], answer: 0, more: [['🐷 Piglet', '🐷 Heo con'], ['🐻 Cub', '🐻 Gấu con']] },
        { show: '🐔 + ?', choices: [['🐶 Puppy', '🐶 Cún con'], ['🐣 Chick', '🐣 Gà con']], answer: 1, more: [['🐑 Lamb', '🐑 Cừu con'], ['🐱 Kitten', '🐱 Mèo con']] }
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
        { show: '🐵', choices: [['🍌 Banana', '🍌 Quả chuối'], ['🥩 Meat', '🥩 Thịt']], answer: 0, more: [['🍃 Gum leaves', '🍃 Lá bạch đàn'], ['🐟 Fish', '🐟 Cá']] },
        { show: '🐨', choices: [['🍃 Gum leaves', '🍃 Lá bạch đàn'], ['🥕 Carrot', '🥕 Cà rốt']], answer: 0, more: [['🥩 Meat', '🥩 Thịt'], ['🍯 Honey', '🍯 Mật ong']] },
        { show: '🐼', choices: [['🎋 Bamboo', '🎋 Cây tre'], ['🐟 Fish', '🐟 Cá']], answer: 0, more: [['🥩 Meat', '🥩 Thịt'], ['🌰 Nuts', '🌰 Hạt dẻ']] }
      ],
      [
        { show: '🐧', choices: [['🐟 Fish', '🐟 Cá'], ['🍌 Banana', '🍌 Quả chuối']], answer: 0, more: [['🎋 Bamboo', '🎋 Cây tre'], ['🌰 Nuts', '🌰 Hạt dẻ']] },
        { show: '🐿️', choices: [['🥩 Meat', '🥩 Thịt'], ['🌰 Nuts', '🌰 Hạt dẻ']], answer: 1, more: [['🐟 Fish', '🐟 Cá'], ['🍃 Gum leaves', '🍃 Lá bạch đàn']] },
        { show: '🐇', choices: [['🥕 Carrot', '🥕 Cà rốt'], ['🐟 Fish', '🐟 Cá']], answer: 0, more: [['🥩 Meat', '🥩 Thịt'], ['🍯 Honey', '🍯 Mật ong']] },
        { show: '🐊', choices: [['🥩 Meat', '🥩 Thịt'], ['🎋 Bamboo', '🎋 Cây tre']], answer: 0, more: [['🍃 Gum leaves', '🍃 Lá bạch đàn'], ['🌰 Nuts', '🌰 Hạt dẻ']] }
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
    // a longer walk each level. From Medium the dike bends: the sign shows which way (forward, left or right); from Hard the
    // buttons change places each step, and on Talent the sign only shows for a moment
    const total = lv(api, 4, 5, 7, 9, 11), turns = !api.little && api.smart >= 1, remix = !api.little && api.smart >= 2, signMs = api.talent ? 1000 : 0;
    mark(api, total, turns ? 'turns' : '', remix ? 'mixed' : '', signMs);
    api.dots(total, 0);
    const wrap = el('div', 'a2-board'), stage = el('div', 'a2-stage'), controls = el('div', 'a2-controls');
    api.stage.appendChild(wrap); wrap.append(stage, controls);
    const buf = el('div', 'a2-big', pic('🐃')); stage.appendChild(buf);
    const sign = el('div', 'a2-sign'); if (turns) stage.appendChild(sign);
    const stepBtn = el('button', 'a2-btn', `${pic('🌾')} <span>${T('Step forward', 'Bước tới')}</span>`);
    const leftBtn = el('button', 'a2-btn', `${pic('⬅️')} <span>${T('Left', 'Trái')}</span>`), rightBtn = el('button', 'a2-btn', `${pic('➡️')} <span>${T('Right', 'Phải')}</span>`);
    const btns = turns ? [leftBtn, stepBtn, rightBtn] : [stepBtn];
    btns.forEach(b => controls.appendChild(b));
    const ways = Array.from({ length: total }, (_, i) => !turns || i % 2 === 0 ? stepBtn : Math.random() < .5 ? leftBtn : rightBtn);

    let steps = 0, x = 0, y = 0;
    while (steps < total) {
      const want = ways[steps];
      if (turns) { sign.style.opacity = '1'; sign.innerHTML = pic(want === stepBtn ? '⬆️' : want === leftBtn ? '⬅️' : '➡️'); }
      const hide = signMs ? setTimeout(() => { sign.style.opacity = '0'; }, signMs) : 0;
      if (remix) [...btns].sort(() => Math.random() - .5).forEach(b => controls.appendChild(b));
      api.plan(() => want, { maxActions: 5 });
      const clicked = await untilRight(api, btns, (e: HTMLElement) => e === want);
      clearTimeout(hide);
      if (!clicked || api.closed) return;
      steps++;
      api.dots(total, steps);
      api.sfx.pop(steps);
      if (want === stepBtn) x += 15; else y += want === leftBtn ? -10 : 10;
      buf.style.transform = `translate(${x}px, ${y}px)`;
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
        { show: '🐠 🐠 🐠', choices: [['3 fish', '3 con cá'], ['5 fish', '5 con cá']], answer: 0, more: [['4 fish', '4 con cá'], ['2 fish', '2 con cá']] },
        { show: '🐡 🐡 🐡 🐡', choices: [['2 fish', '2 con cá'], ['4 fish', '4 con cá']], answer: 1, more: [['3 fish', '3 con cá'], ['5 fish', '5 con cá']] },
        { show: '🐟 🐟 🐟 🐟 🐟', choices: [['5 fish', '5 con cá'], ['3 fish', '3 con cá']], answer: 0, more: [['4 fish', '4 con cá'], ['6 fish', '6 con cá']] }
      ],
      [
        { show: '🐠 🐠 🐠 🐠 🐠 🐠 🐠', choices: [['7 fish', '7 con cá'], ['6 fish', '6 con cá']], answer: 0, more: [['8 fish', '8 con cá'], ['5 fish', '5 con cá']] },
        { show: '🐡 🐡 🐡 🐡 🐡 🐡 🐡 🐡', choices: [['9 fish', '9 con cá'], ['8 fish', '8 con cá']], answer: 1, more: [['7 fish', '7 con cá'], ['6 fish', '6 con cá']] },
        { show: '🐠 🐟 🐠 🐟 🐠 🐟', choices: [['6 fish', '6 con cá'], ['3 fish', '3 con cá']], answer: 0, more: [['7 fish', '7 con cá'], ['5 fish', '5 con cá']] },
        { show: '🐟 🐟 🐟 🐟 🐟 🐟 🐟 🐟 🐟', choices: [['9 fish', '9 con cá'], ['10 fish', '10 con cá']], answer: 0, more: [['8 fish', '8 con cá'], ['7 fish', '7 con cá']] }
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
        { show: pic('🐾'), choices: [['🐕 Puppy dog', '🐕 Chú cún'], ['🦆 Duck', '🦆 Chú vịt']], answer: 0, more: [['🐦 Little sparrow', '🐦 Chim sẻ'], ['🐟 Fish', '🐟 Con cá']] },
        { show: pic('track:duck'), choices: [['🦆 Duckling', '🦆 Chú vịt bầu'], ['🐱 Kitten', '🐱 Mèo con']], answer: 0, more: [['🐃 Big buffalo', '🐃 Chú trâu'], ['🐟 Fish', '🐟 Con cá']] },
        { show: pic('track:bird'), choices: [['🐦 Little sparrow', '🐦 Chim sẻ'], ['🐃 Big buffalo', '🐃 Chú trâu']], answer: 0, more: [['🐱 Kitten', '🐱 Mèo con'], ['🐟 Fish', '🐟 Con cá']] }
      ],
      [
        // webbed feet; three thin toes; a paw with soft pads
        { show: pic('track:duck'), choices: [['🐔 Hen', '🐔 Gà mái'], ['🐧 Penguin', '🐧 Chim cánh cụt']], answer: 1, more: [['🐱 Kitten', '🐱 Mèo con'], ['🐇 Rabbit', '🐇 Con thỏ']] },
        { show: pic('track:bird'), choices: [['🐔 Hen', '🐔 Gà mái'], ['🐶 Puppy', '🐶 Cún con']], answer: 0, more: [['🐸 Frog', '🐸 Con ếch'], ['🐇 Rabbit', '🐇 Con thỏ']] },
        { show: pic('🐾'), choices: [['🐱 Kitten', '🐱 Mèo con'], ['🐦 Little sparrow', '🐦 Chim sẻ']], answer: 0, more: [['🐟 Fish', '🐟 Con cá'], ['🦆 Duck', '🦆 Chú vịt']] }
      ],
      ['Track detective! You identified every paw and foot!', 'Thám tử dấu chân! Bé nhận biết mọi dấu chân thật tài!']
    );
  }
});
