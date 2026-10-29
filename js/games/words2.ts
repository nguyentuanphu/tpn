// Words additions (owner, 23 Oct 2026 AEDT):
// Which Group, Story in Order, Guess What I Am, Action Words, and Position (In, On, Under).
import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, wait } from '../util.js';

// (owner, 29 Oct 2026 AEDT audit) the right answer always stood first, then second, then third: choices are mixed now
const mix = <V,>(list: V[]): V[] => [...list].sort(() => Math.random() - .5);

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.w2-board { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px; margin: 0 auto; max-width: 96vw; }
.w2-stage { position: relative; width: min(360px, 86vw); height: min(280px, 42vh); background: #fffdf6; border-radius: 20px; box-shadow: 0 4px 16px rgba(40, 30, 60, .14); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; overflow: hidden; padding: 10px; }
.w2-controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 380px; }
.w2-btn { min-width: 64px; min-height: 64px; padding: 8px 16px; border-radius: 999px; border: 2px solid #3b2a4f; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .2); font: 800 17px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; touch-action: manipulation; }
.w2-scene { position: relative; width: 150px; height: 150px; flex: none; }
.w2-thing { position: absolute; left: 0; right: 0; bottom: 36px; display: flex; justify-content: center; font-size: 84px; line-height: 1; }
.w2-animal { position: absolute; left: 50%; transform: translateX(-50%); font-size: 40px; line-height: 1; }
.w2-on { top: -6px; }
.w2-in { bottom: 50px; z-index: 1; }
.w2-under { bottom: 0; font-size: 32px; }
.w2-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(59, 42, 79, .2); }
`));
}

// 1. Which Group?
register({
  id: 'whichgroup', icon: '🧺',
  name: () => T('Which Group?', 'Thuộc Nhóm Nào?'),
  async run(api) {
    style();
    api.say('Which group does it belong to?', 'Nó thuộc nhóm nào?');
    const rounds = 3;
    api.dots(rounds, 0);
    const wrap = el('div', 'w2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'w2-stage'); wrap.appendChild(stage);

    const questions = [
      { item: '🍌', correct: 0, choices: [['Fruits', 'Trái cây'], ['Animals', 'Con vật'], ['Vehicles', 'Xe cộ']] },
      { item: '🐕', correct: 1, choices: [['Clothes', 'Quần áo'], ['Animals', 'Con vật'], ['Fruits', 'Trái cây']] },
      { item: '🚗', correct: 2, choices: [['Toys', 'Đồ chơi'], ['Food', 'Thức ăn'], ['Vehicles', 'Xe cộ']] }
    ];

    let current = 0;
    while (current < rounds) {
      stage.innerHTML = '';
      const icon = el('div', '', pic(questions[current].item));
      icon.style.fontSize = '80px';
      stage.appendChild(icon);

      const controls = el('div', 'w2-controls'); stage.appendChild(controls);
      const btns = questions[current].choices.map((c, idx) => {
        const b = el('button', 'w2-btn', `<span>${T(c[0], c[1])}</span>`);
        b.dataset.idx = String(idx);
        return b;
      });
      mix(btns).forEach(b => controls.appendChild(b));

      const target = btns[questions[current].correct];
      api.plan(() => target, { maxActions: 4 });
      const clicked = await untilRight(api, btns, e => e === target);
      if (!clicked || api.closed) return;
      api.sfx.ding();
      current++;
      api.dots(rounds, current);
      await wait(300);
    }
    api.say('You know all the groups so well!', 'Bé phân biệt các nhóm đồ vật thật giỏi!');
    await wait(1200);
    return api.win({ title: T('Great Grouping!', 'Phân Loại Thật Chuẩn!') });
  }
});

// 2. Story in Order
register({
  id: 'storyorder', icon: '📖',
  name: () => T('Story in Order', 'Xếp Tranh Kể Chuyện'),
  async run(api) {
    style();
    api.say('Put the plant story in order: seed, sprout, flower, fruit!',
      'Xếp tranh hạt giống lớn lên: gieo hạt, nảy mầm, nở hoa, ra quả!');
    api.dots(4, 0);
    const wrap = el('div', 'w2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'w2-stage'); wrap.appendChild(stage);
    const plant = el('div', '', pic('🌱')); plant.style.fontSize = '80px'; stage.appendChild(plant);

    const steps = [
      { icon: '🫘', name: ['Seed', 'Gieo hạt'] },
      { icon: '🌱', name: ['Sprout', 'Nảy mầm'] },
      { icon: '🌸', name: ['Flower', 'Nở hoa'] },
      { icon: '🍎', name: ['Fruit', 'Ra quả'] }
    ];

    const controls = el('div', 'w2-controls'); wrap.appendChild(controls);
    const btns = steps.map((s, idx) => {
      const b = el('button', 'w2-btn', `${pic(s.icon)} <span>${T(s.name[0], s.name[1])}</span>`);
      b.dataset.step = String(idx);
      return b;
    });
    // (owner, 29 Oct 2026 AEDT audit) the cards were numbered 1 to 4 in order, so the answer was written on them
    mix(btns).forEach(b => controls.appendChild(b));

    let current = 0;
    while (current < 4) {
      const target = btns[current];
      api.plan(() => target, { maxActions: 5 });
      const clicked = await untilRight(api, btns, e => e === target);
      if (!clicked || api.closed) return;
      target.disabled = true;
      plant.innerHTML = pic(steps[current].icon);
      api.sfx.pop(current);
      current++;
      api.dots(4, current);
      await wait(300);
    }
    api.say('The seed grew into sweet, delicious fruit!', 'Hạt mầm đã lớn lên thành quả ngọt ngào rồi!');
    await wait(1200);
    return api.win({ title: T('Story in Order!', 'Kể Chuyện Đúng Thứ Tự!') });
  }
});

// 3. Guess What I Am
register({
  id: 'guesswhat', icon: '❓',
  name: () => T('Guess What I Am', 'Đoán Xem Tôi Là Gì'),
  async run(api) {
    style();
    const rounds = 3;
    api.dots(rounds, 0);
    const wrap = el('div', 'w2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'w2-stage'); wrap.appendChild(stage);

    const riddles = [
      { text: ['I have long ears and love carrots.', 'Đôi tai dài, thích ăn cà rốt.'], answer: 0, options: [['🐰 Rabbit', '🐰 Chú thỏ'], ['🐸 Frog', '🐸 Chú cóc'], ['🐱 Cat', '🐱 Chú mèo']] },
      { text: ['I give fresh milk and say moo.', 'Cho sữa ngọt và kêu moo moo.'], answer: 1, options: [['🐶 Dog', '🐶 Cún con'], ['🐮 Cow', '🐮 Bò sữa'], ['🐔 Hen', '🐔 Gà mái']] },
      { text: ['I swim in the water and have colorful scales.', 'Bơi dưới nước, có vảy nhiều màu.'], answer: 2, options: [['🐻 Bear', '🐻 Gấu trúc'], ['🦆 Duck', '🦆 Vịt bầu'], ['🐟 Fish', '🐟 Cá vàng']] }
    ];

    let current = 0;
    while (current < rounds) {
      stage.innerHTML = '';
      api.say(riddles[current].text[0] + ' Who am I?', riddles[current].text[1] + ' Tôi là ai?');
      const prompt = el('div', '', T(riddles[current].text[0], riddles[current].text[1]));
      prompt.style.cssText = 'font:800 20px var(--font, sans-serif);color:#3b2a4f;text-align:center;padding:10px;';
      stage.appendChild(prompt);

      const controls = el('div', 'w2-controls'); stage.appendChild(controls);
      const btns = riddles[current].options.map((opt, idx) => {
        const b = el('button', 'w2-btn', `<span>${T(opt[0], opt[1])}</span>`);
        b.dataset.idx = String(idx);
        return b;
      });
      mix(btns).forEach(b => controls.appendChild(b));

      const target = btns[riddles[current].answer];
      api.plan(() => target, { maxActions: 4 });
      const clicked = await untilRight(api, btns, e => e === target);
      if (!clicked || api.closed) return;
      api.sfx.ding();
      current++;
      api.dots(rounds, current);
      await wait(300);
    }
    api.say('You solved every riddle! Sharp and clever thinker!', 'Con đoán trúng hết các câu đố rồi! Thật thông minh!');
    await wait(1200);
    return api.win({ title: T('Riddle Solver!', 'Đoán Đố Tài Tình!') });
  }
});

// 4. Action Words
register({
  id: 'actions', icon: '🏃',
  name: () => T('Action Words', 'Từ Chỉ Hoạt Động'),
  async run(api) {
    style();
    api.say('Which word is an action you can do?',
      'Từ nào là từ chỉ hoạt động bé có thể làm?');
    const rounds = 3;
    api.dots(rounds, 0);
    const wrap = el('div', 'w2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'w2-stage'); wrap.appendChild(stage);

    const sets = [
      { action: 0, choices: [['🏃 Run', '🏃 Chạy'], ['🪑 Chair', '🪑 Cái ghế'], ['🌳 Tree', '🌳 Cái cây']] },
      { action: 1, choices: [['🍎 Apple', '🍎 Quả táo'], ['🏊 Swim', '🏊 Bơi'], ['🏠 House', '🏠 Ngôi nhà']] },
      { action: 2, choices: [['👟 Shoe', '👟 Đôi giày'], ['🚗 Car', '🚗 Chiếc xe'], ['💃 Dance', '💃 Múa']] }
    ];

    let current = 0;
    while (current < rounds) {
      stage.innerHTML = '';
      const prompt = el('div', '', T('Find the action!', 'Tìm hành động nào!'));
      prompt.style.cssText = 'font:800 20px var(--font, sans-serif);color:#3b2a4f;text-align:center;padding:10px;';
      stage.appendChild(prompt);

      const controls = el('div', 'w2-controls'); stage.appendChild(controls);
      const btns = sets[current].choices.map((c, idx) => {
        const b = el('button', 'w2-btn', `<span>${T(c[0], c[1])}</span>`);
        b.dataset.idx = String(idx);
        return b;
      });
      mix(btns).forEach(b => controls.appendChild(b));

      const target = btns[sets[current].action];
      api.plan(() => target, { maxActions: 4 });
      const clicked = await untilRight(api, btns, e => e === target);
      if (!clicked || api.closed) return;
      api.sfx.pop(current);
      current++;
      api.dots(rounds, current);
      await wait(300);
    }
    api.say('Run, swim, and dance! Active and strong!', 'Chạy, bơi rồi múa! Bé thật khỏe mạnh và hoạt bát!');
    await wait(1200);
    return api.win({ title: T('Action Master!', 'Từ Hoạt Động!') });
  }
});

// 5. In, On, Under
register({
  id: 'position', icon: '📦',
  name: () => T('In, On, Under', 'Trong, Trên, Dưới'),
  async run(api) {
    style();
    api.say('Where is the kitten: in the box, on the table, or under the bed?',
      'Mèo con ở đâu: trong hộp, trên bàn, hay dưới gầm giường?');
    const rounds = 3;
    api.dots(rounds, 0);
    const wrap = el('div', 'w2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'w2-stage'); wrap.appendChild(stage);

    // (owner, 29 Oct 2026 AEDT audit) the question said the answer ("The cat is IN the box"): now a picture shows where
    // the animal is, and the child says in, on or under
    const questions = mix([
      { animal: '🐱', thing: '📦', where: 'in', ask: ['Where is the kitten?', 'Mèo con ở đâu?'] },
      { animal: '🐦', thing: '🪑', where: 'on', ask: ['Where is the bird?', 'Chú chim ở đâu?'] },
      { animal: '⚽', thing: '🪑', where: 'under', ask: ['Where is the ball?', 'Quả bóng ở đâu?'] },
      { animal: '🐶', thing: '📦', where: 'on', ask: ['Where is the puppy?', 'Cún con ở đâu?'] },
      { animal: '🐭', thing: '📦', where: 'under', ask: ['Where is the mouse?', 'Chú chuột ở đâu?'] }
    ]).slice(0, rounds);
    const words = { in: ['In', 'Trong'], on: ['On', 'Trên'], under: ['Under', 'Dưới'] };

    let current = 0;
    while (current < rounds) {
      const q = questions[current];
      stage.innerHTML = '';
      api.say(q.ask[0], q.ask[1]);
      const scene = el('div', 'w2-scene');
      scene.append(el('div', 'w2-thing', pic(q.thing)), el('div', 'w2-animal w2-' + q.where, pic(q.animal)));
      stage.appendChild(scene);

      const controls = el('div', 'w2-controls'); stage.appendChild(controls);
      const btns = (['in', 'on', 'under'] as const).map(w => {
        const b = el('button', 'w2-btn', `<span>${T(words[w][0], words[w][1])}</span>`);
        b.dataset.where = w;
        controls.appendChild(b);
        return b;
      });

      const target = btns.find(b => b.dataset.where === q.where);
      api.plan(() => target, { maxActions: 4 });
      const clicked = await untilRight(api, btns, e => e === target);
      if (!clicked || api.closed) return;
      api.sfx.ding();
      current++;
      api.dots(rounds, current);
      await wait(300);
    }
    api.say('You understand positions so well! In, on, under are crystal clear!', 'Bé hiểu rõ các vị trí rồi! Trong, trên, dưới đều rất chuẩn!');
    await wait(1200);
    return api.win({ title: T('Position Explorer!', 'Bé Biết Vị Trí!') });
  }
});