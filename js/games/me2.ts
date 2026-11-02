// Me and My Family additions (owner, 23 Oct 2026 AEDT):
// My day sequencing, healthy plate builder, and kind choices.
import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, wait } from '../util.js';

// (owner, 1 Nov 2026 AEDT: "the levels often don't change anything") one value per level: under-5s keep the first, big kids
// get Easy · Medium · Hard · Talent. The values a game uses are on its stage (data-lv) for the checks.
const lv = <V>(api, little: V, easy: V, medium: V, hard: V, talent: V): V => { const v = api.little ? little : [easy, medium, hard, talent][Math.max(0, Math.min(3, api.smart || 0))]; api.lvNote?.([little, easy, medium, hard, talent], v); return v; };
const mark = (api, ...v: unknown[]) => { api.stage.dataset.lv = v.join(','); };
// a button's label: on Talent only the words
const label = (api, icon: string, name: string[]) => api.talent ? `<span>${T(name[0], name[1])}</span>` : `${pic(icon)} <span>${T(name[0], name[1])}</span>`;

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.m2-board { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px; margin: 0 auto; max-width: 96vw; }
.m2-stage { position: relative; width: min(360px, 86vw); height: min(300px, 45vh); background: #fffdf6; border-radius: 20px; box-shadow: 0 4px 16px rgba(40, 30, 60, .14); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; overflow: hidden; padding: 10px; }
.m2-controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 380px; }
.m2-btn { min-width: 64px; min-height: 64px; padding: 8px 16px; border-radius: 999px; border: 2px solid #3b2a4f; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .2); font: 800 17px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; touch-action: manipulation; }
.m2-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(59, 42, 79, .2); }
.m2-plate { width: min(220px, 60vw); height: min(220px, 60vw); border-radius: 50%; background: #fff; border: 6px solid #e0d6eb; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 6px; padding: 10px; box-shadow: 0 4px 12px rgba(0,0,0,.1); }
.m2-food { display: flex; align-items: center; justify-content: center; font-size: 36px; border-radius: 50%; opacity: 0; transform: scale(.5); transition: all .3s; }
.m2-food.on { opacity: 1; transform: scale(1); }
`));
}

// 1. My Day
register({
  id: 'myday', icon: '🌅',
  name: () => T('My Day', 'Một Ngày Của Em'),
  async run(api) {
    style();
    api.say('Put your daily routine in order from morning to bedtime!',
      'Sắp xếp các hoạt động trong ngày từ sáng đến tối nhé!');
    // a longer day each level (breakfast, dinner and a bath join in); on Talent the buttons show only words
    const parts = lv(api, ['wake', 'brush', 'play', 'sleep'], ['wake', 'brush', 'play', 'sleep'], ['wake', 'brush', 'breakfast', 'play', 'sleep'], ['wake', 'brush', 'breakfast', 'play', 'dinner', 'sleep'], ['wake', 'brush', 'breakfast', 'play', 'dinner', 'bath', 'sleep']);
    mark(api, parts.length, api.talent ? 'words' : '');
    const total = parts.length;
    api.dots(total, 0);
    const wrap = el('div', 'm2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'm2-stage'); wrap.appendChild(stage);

    const day = [
      { id: 'wake', icon: '🌅', name: ['Wake up', 'Thức dậy'] },
      { id: 'brush', icon: '🪥', name: ['Brush teeth', 'Đánh răng'] },
      { id: 'breakfast', icon: '🥣', name: ['Breakfast', 'Ăn sáng'] },
      { id: 'play', icon: '🎒', name: ['School & play', 'Đi học & chơi'] },
      { id: 'dinner', icon: '🍜', name: ['Dinner', 'Ăn tối'] },
      { id: 'bath', icon: '🛁', name: ['Bath time', 'Tắm'] },
      { id: 'sleep', icon: '🌙', name: ['Bedtime story', 'Đi ngủ'] }
    ], routine = day.filter(r => parts.includes(r.id));

    const display = el('div', '', pic('🌅')); display.style.fontSize = '80px'; stage.appendChild(display);
    const controls = el('div', 'm2-controls'); wrap.appendChild(controls);
    // (owner, 29 Oct 2026 AEDT audit) the buttons stood in the right order already: they are mixed up now
    const btns = routine.map((r, idx) => {
      const b = el('button', 'm2-btn', label(api, r.icon, r.name));
      b.dataset.step = String(idx);
      return b;
    });
    [...btns].sort(() => Math.random() - .5).forEach(b => controls.appendChild(b));

    let currentStep = 0;
    while (currentStep < total) {
      api.plan(() => btns[currentStep] || null, { maxActions: 5 });
      const target = btns[currentStep];
      const clicked = await untilRight(api, btns, e => e === target);
      if (!clicked || api.closed) return;
      target.disabled = true;
      display.innerHTML = pic(routine[currentStep].icon);
      api.sfx.pop(currentStep);
      currentStep++;
      api.dots(total, currentStep);
      await wait(300);
    }
    api.say('A happy, healthy day from morning until night!', 'Một ngày thật vui vẻ và khỏe mạnh từ sáng đến tối!');
    await wait(1200);
    return api.win({ title: T('Great Routine!', 'Lịch Trình Tuyệt Vời!') });
  }
});

// 2. Healthy Plate
register({
  id: 'plate', icon: '🍽️',
  name: () => T('Healthy Plate', 'Đĩa Ăn Lành Mạnh'),
  async run(api) {
    style();
    api.say('Add veggies, rice, protein and fruit to build a balanced plate!',
      'Thêm rau xanh, cơm, cá thịt và trái cây để có bữa ăn cân đối nhé!');
    api.dots(4, 0);
    const wrap = el('div', 'm2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'm2-stage'); wrap.appendChild(stage);
    const plate = el('div', 'm2-plate'); stage.appendChild(plate);

    const foods = [
      { id: 'veg', icon: '🥦', name: ['Veggies', 'Rau xanh'] },
      { id: 'grain', icon: '🍚', name: ['Rice', 'Cơm dẻo'] },
      { id: 'protein', icon: '🐟', name: ['Fish', 'Cá tươi'] },
      { id: 'fruit', icon: '🍎', name: ['Apple', 'Hoa quả'] }
    ];

    const slots = foods.map(f => {
      const s = el('div', 'm2-food', pic(f.icon));
      plate.appendChild(s);
      return s;
    });

    const controls = el('div', 'm2-controls'); wrap.appendChild(controls);
    // treats that do not belong on the plate join the choices each level (tapping one is a gentle "not this"); on Talent the
    // buttons show only words
    const treats = [{ icon: '🍭', name: ['Lollipop', 'Kẹo mút'] }, { icon: '🍟', name: ['Chips', 'Khoai tây chiên'] }, { icon: '🥤', name: ['Fizzy drink', 'Nước ngọt có ga'] }, { icon: '🍫', name: ['Chocolate', 'Sô-cô-la'] }].slice(0, lv(api, 0, 0, 1, 2, 4));
    mark(api, 4 + treats.length, api.talent ? 'words' : '');
    const btns = foods.map((f, idx) => {
      const b = el('button', 'm2-btn', label(api, f.icon, f.name));
      b.dataset.step = String(idx);
      return b;
    });
    const junk = treats.map(f => { const b = el('button', 'm2-btn', label(api, f.icon, f.name)); b.dataset.treat = '1'; return b; });
    const all = btns.concat(junk); (treats.length ? [...all].sort(() => Math.random() - .5) : all).forEach(b => controls.appendChild(b));

    // (owner, 29 Oct 2026 AEDT audit) any order: the plate needs each kind of food once (it took one fixed order)
    let currentStep = 0;
    while (currentStep < 4) {
      api.plan(() => btns.find(b => !b.disabled) || null, { maxActions: 5 });
      const clicked = await untilRight(api, all, e => !e.disabled && !e.dataset.treat);
      if (!clicked || api.closed) return;
      clicked.disabled = true;
      slots[Number(clicked.dataset.step)].classList.add('on');
      api.sfx.pop(currentStep);
      currentStep++;
      api.dots(4, currentStep);
      await wait(300);
    }
    api.say('Yummy and nutritious, full of good energy!', 'Bữa ăn ngon lành, đầy đủ dinh dưỡng cho bé lớn nhanh!');
    await wait(1200);
    return api.win({ title: T('Healthy Plate Built!', 'Đĩa Ăn Lành Mạnh!') });
  }
});

// 3. Kind Choices
register({
  id: 'kindchoice', icon: '💝',
  name: () => T('Kind Choices', 'Việc Làm Tốt'),
  async run(api) {
    style();
    api.say('Choose a kind thing to do: share toys, help friends, or say thank you!',
      'Chọn một hành động tốt: chia sẻ đồ chơi, giúp bạn, hay nói lời cảm ơn!');
    const targetChoices = api.little ? 3 : 4;
    // unkind choices join the kind ones each level (tapping one is a gentle "not this"); on Talent the buttons show only words
    const unkind = [{ icon: '😠', name: ['Shout at a friend', 'Quát bạn'] }, { icon: '😢', name: ['Take a toy away', 'Giật đồ chơi của bạn'] }, { icon: '🗑️', name: ['Throw litter', 'Vứt rác bừa bãi'] }, { icon: '😡', name: ['Push in the line', 'Chen hàng'] }].slice(0, lv(api, 0, 0, 1, 2, 4));
    mark(api, targetChoices + unkind.length, api.talent ? 'words' : '');
    api.dots(targetChoices, 0);
    const wrap = el('div', 'm2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'm2-stage'); wrap.appendChild(stage);
    const heart = el('div', '', pic('💝')); heart.style.fontSize = '80px'; stage.appendChild(heart);

    const choices = [
      { icon: '🧸', name: ['Share toys', 'Chia sẻ đồ chơi'] },
      { icon: '🤝', name: ['Help clean up', 'Giúp dọn dẹp'] },
      { icon: '🌻', name: ['Water flowers', 'Tưới cây hoa'] },
      { icon: '💌', name: ['Say thank you', 'Cảm ơn ông bà'] }
    ];

    const controls = el('div', 'm2-controls'); wrap.appendChild(controls);
    const btns = choices.slice(0, targetChoices).map((c, idx) => {
      const b = el('button', 'm2-btn', label(api, c.icon, c.name));
      b.dataset.step = String(idx);
      return b;
    });
    const bad = unkind.map(c => { const b = el('button', 'm2-btn', label(api, c.icon, c.name)); b.dataset.unkind = '1'; return b; });
    const all = btns.concat(bad); (bad.length ? [...all].sort(() => Math.random() - .5) : all).forEach(b => controls.appendChild(b));

    // (owner, 29 Oct 2026 AEDT audit) every kind choice is right, in any order (it took one fixed order)
    let current = 0;
    while (current < targetChoices) {
      api.plan(() => btns.find(b => !b.disabled) || null, { maxActions: 5 });
      const clicked = await untilRight(api, all, e => !e.disabled && !e.dataset.unkind);
      if (!clicked || api.closed) return;
      clicked.disabled = true;
      heart.style.transform = 'scale(1.3)';
      setTimeout(() => { heart.style.transform = 'scale(1)'; }, 200);
      api.sfx.chime();
      current++;
      api.dots(targetChoices, current);
      await wait(350);
    }
    api.say('You have such a kind and caring heart!', 'Con là một em bé thật ngoan và nhân hậu!');
    await wait(1200);
    return api.win({ title: T('Kind and Caring!', 'Bé Tốt Bụng!') });
  }
});