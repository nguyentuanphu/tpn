import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, wait, rand, shuffle } from '../util.js';

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.out-board { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px; margin: 0 auto; max-width: 96vw; }
.out-stage { position: relative; width: min(360px, 86vw); height: min(320px, 48vh); background: #f0f8e8; border-radius: 20px; box-shadow: 0 4px 16px rgba(40, 30, 60, .14); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.out-btn { min-width: 64px; min-height: 64px; padding: 8px 16px; border-radius: 999px; border: 2px solid #3b2a4f; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .2); font: 800 17px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; touch-action: manipulation; }
.out-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(59, 42, 79, .2); }
.out-float { position: absolute; font-size: 44px; cursor: pointer; transition: transform .2s; user-select: none; }
.out-float:active { transform: scale(1.2); }
.out-circle { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.out-chair { width: 56px; height: 56px; background: #d4a87a; border-radius: 8px; position: relative; }
.out-chair::before { content: ''; position: absolute; top: -12px; left: 8px; width: 40px; height: 12px; background: #c4986a; border-radius: 4px; }
.out-hoop { width: 56px; height: 56px; border: 4px solid #3b6fe0; border-radius: 50%; position: relative; }
.out-hoop::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 12px; height: 12px; background: #3b6fe0; border-radius: 50%; }
`));
}

/* 1. Hide and Seek */
register({
  id: 'hideseek', icon: '🙈',
  name: () => T('Hide and Seek', 'Trốn Tìm'),
  async run(api) {
    style();
    api.say('Find your friends hiding behind the trees!', 'Tìm các bạn đang trốn sau những cái cây nhé!');
    const target = api.little ? 3 : 5;
    api.dots(target, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);

    const spots = ['🌳', '🌲', '🌳', '🌲', '🌳'];
    let found = 0;
    while (found < target && !api.closed) {
      stage.innerHTML = '';
      const hiders = shuffle(spots).slice(0, 3 + (api.level >= 3 ? 1 : 0));
      const hiddenIdx = Math.floor(Math.random() * hiders.length);
      hiders.forEach((spot, i) => {
        const btn = el('button', 'out-float', pic(spot));
        btn.style.left = rand(30, 260) + 'px';
        btn.style.top = rand(30, 220) + 'px';
        btn.dataset.idx = String(i);
        btn.setAttribute('aria-label', i === hiddenIdx ? T('Friend hiding here', 'Bạn đang trốn ở đây') : T('Just a tree', 'Chỉ là cái cây thôi'));
        stage.appendChild(btn);
      });

      api.plan(() => {
        const btn = [...stage.querySelectorAll('.out-float')].find(b => b.dataset.idx === String(hiddenIdx));
        return btn && btn.isConnected ? btn : null;
      }, { maxActions: target * 3 });

      const clicked = await untilRight(api, [...stage.querySelectorAll('.out-float')], b => b.dataset.idx === String(hiddenIdx));
      if (!clicked || api.closed) return;
      api.sfx.pop(found);
      found++;
      api.dots(target, found);
      await wait(300);
    }
    api.say('Everyone is found! What great seekers!', 'Tìm thấy hết các bạn rồi! Con tìm giỏi quá!');
    await wait(1000);
    return api.win({ title: T('Super Seeker!', 'Thám Tử Nhí Giỏi Ghê!') });
  }
});

/* 2. Duck, Duck, Goose */
register({
  id: 'duckgoose', icon: '🦆',
  name: () => T('Duck, Duck, Goose', 'Vịt, Vịt, Ngỗng'),
  async run(api) {
    style();
    api.say('Tap each player: Duck? Duck? until Goose!', 'Chạm từng bạn: Vịt? Vịt? cho đến khi gặp Ngỗng!');
    const rounds = api.little ? 3 : 4;
    api.dots(rounds, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);

    for (let r = 0; r < rounds && !api.closed; r++) {
      stage.innerHTML = '';
      const players = 4 + (api.level >= 3 ? 1 : 0);
      const goosePos = Math.floor(Math.random() * players);
      const radius = 110, cx = 180, cy = 160;
      for (let i = 0; i < players; i++) {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / players;
        const btn = el('button', 'out-float out-circle', pic('🧒'));
        btn.style.left = (cx + Math.cos(ang) * radius - 32) + 'px';
        btn.style.top = (cy + Math.sin(ang) * radius - 32) + 'px';
        btn.dataset.goose = i === goosePos ? '1' : '0';
        btn.setAttribute('aria-label', i === goosePos ? T('Goose!', 'Ngỗng!') : T('Duck', 'Vịt'));
        stage.appendChild(btn);
      }

      api.plan(() => {
        const btn = [...stage.querySelectorAll('.out-float')].find(b => b.dataset.goose === '1');
        return btn && btn.isConnected ? btn : null;
      }, { maxActions: rounds * 3 });

      const clicked = await untilRight(api, [...stage.querySelectorAll('.out-float')], b => b.dataset.goose === '1');
      if (!clicked || api.closed) return;
      api.sfx.pop(r);
      api.dots(rounds, r + 1);
      await wait(300);
    }
    api.say('You caught the goose every round!', 'Con bắt được ngỗng mọi vòng rồi!');
    await wait(1000);
    return api.win({ title: T('Goose Catcher!', 'Bắt Ngỗng Siêu Tốc!') });
  }
});

/* 3. Red Light, Green Light */
register({
  id: 'redgreen', icon: '🚦',
  name: () => T('Red Light, Green Light', 'Đèn Xanh Đèn Đỏ'),
  async run(api) {
    style();
    api.say('Green light: walk forward! Red light: freeze!', 'Đèn xanh: đi tới! Đèn đỏ: đứng yên!');
    const rounds = api.little ? 3 : 5;
    api.dots(rounds, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);
    const runner = el('div', 'out-float', pic('🏃'));
    runner.style.left = '30px';
    runner.style.top = '140px';
    runner.style.fontSize = '48px';
    stage.appendChild(runner);

    let reached = 0;
    for (let r = 0; r < rounds && !api.closed; r++) {
      const isGreen = Math.random() < 0.6;
      const light = el('button', 'out-float out-circle', pic(isGreen ? '🟢' : '🔴'));
      light.style.left = '160px';
      light.style.top = '40px';
      light.style.fontSize = '48px';
      light.setAttribute('aria-label', isGreen ? T('Green light', 'Đèn xanh') : T('Red light', 'Đèn đỏ'));
      stage.appendChild(light);

      api.plan(() => light.isConnected ? light : null, { maxActions: rounds * 2 });

      const clicked = await untilRight(api, [light], () => true);
      if (!clicked || api.closed) return;
      if (isGreen) {
        const cur = parseFloat(runner.style.left) || 30;
        runner.style.left = Math.min(300, cur + 50) + 'px';
        api.sfx.pop(r);
        reached++;
      } else {
        api.sfx.no();
        api.say('Red light! Stay still!', 'Đèn đỏ! Đứng yên nhé!');
        await wait(500);
      }
      api.dots(rounds, reached);
      light.remove();
      await wait(300);
    }
    api.say('You reached the finish line safely!', 'Con đến đích an toàn rồi!');
    await wait(1000);
    return api.win({ title: T('Safe Runner!', 'Vận Động Viên An Toàn!') });
  }
});

/* 4. Simon Says */
register({
  id: 'simon', icon: '🗣️',
  name: () => T('Simon Says', 'Simon Bảo'),
  async run(api) {
    style();
    api.say('Watch Simon and copy the actions!', 'Nhìn Simon làm rồi con làm theo nhé!');
    const rounds = api.little ? 3 : 4;
    api.dots(rounds, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);

    const actions = [
      { emoji: '👋', en: 'Wave', vi: 'Vẫy tay' },
      { emoji: '👏', en: 'Clap', vi: 'Vỗ tay' },
      { emoji: '☝️', en: 'Point up', vi: 'Chỉ lên' },
      { emoji: '👇', en: 'Point down', vi: 'Chỉ xuống' },
      { emoji: '🙌', en: 'High five', vi: 'Đập tay' }
    ];
    let sequence = [];
    for (let r = 0; r < rounds && !api.closed; r++) {
      sequence.push(shuffle(actions)[0]);
      for (let i = 0; i < sequence.length; i++) {
        stage.innerHTML = '';
        const btn = el('button', 'out-float', pic(sequence[i].emoji));
        btn.style.left = '150px';
        btn.style.top = '130px';
        btn.style.fontSize = '64px';
        btn.disabled = true;
        stage.appendChild(btn);
        api.say(sequence[i].en, sequence[i].vi);
        await wait(600);
      }
      stage.innerHTML = '';
      const choices = shuffle(actions).slice(0, api.level + 2);
      choices.forEach(a => {
        const btn = el('button', 'out-btn', pic(a.emoji) + ' ' + T(a.en, a.vi));
        btn.dataset.act = a.emoji;
        stage.appendChild(btn);
      });

      for (let i = 0; i < sequence.length && !api.closed; i++) {
        api.plan(() => {
          const btn = [...stage.querySelectorAll('.out-btn')].find(b => b.dataset.act === sequence[i].emoji);
          return btn && btn.isConnected ? btn : null;
        }, { maxActions: rounds * 5 });

        const clicked = await untilRight(api, [...stage.querySelectorAll('.out-btn')], b => b.dataset.act === sequence[i].emoji);
        if (!clicked || api.closed) return;
        api.sfx.pop(i);
        await wait(200);
      }
      api.dots(rounds, r + 1);
      await wait(300);
    }
    api.say('Perfect memory! You copied every move!', 'Trí nhớ tuyệt vời! Con làm y hệt Simon!');
    await wait(1000);
    return api.win({ title: T("Simon's Star!", 'Ngôi Sao Của Simon!') });
  }
});

/* 5. Egg and Spoon Race */
register({
  id: 'eggspoon', icon: '🥚',
  name: () => T('Egg and Spoon Race', 'Chạy Thìa Trứng'),
  async run(api) {
    style();
    api.say('Balance the egg on the spoon and walk to the finish!', 'Giữ trứng trên thìa và đi đến đích nhé!');
    const steps = api.little ? 4 : 6;
    api.dots(steps, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);

    const spoon = el('button', 'out-float', pic('🥄') + ' ' + pic('🥚'));
    spoon.style.left = '30px';
    spoon.style.top = '140px';
    spoon.style.fontSize = '48px';
    stage.appendChild(spoon);

    for (let s = 0; s < steps && !api.closed; s++) {
      const targetX = 30 + (s + 1) * 50;
      api.plan(() => spoon.isConnected ? spoon : null, { maxActions: steps * 3 });
      const clicked = await untilRight(api, [spoon], () => true);
      if (!clicked || api.closed) return;

      spoon.style.transition = 'left 0.6s ease';
      spoon.style.left = targetX + 'px';
      await wait(700);
      api.sfx.pop(s);
      api.dots(steps, s + 1);
      await wait(200);
    }
    api.say('Egg safe! You crossed the line!', 'Trứng an toàn! Con đã về đích!');
    await wait(1000);
    return api.win({ title: T('Steady Hands!', 'Đôi Tay Vững Vàng!') });
  }
});

/* 6. Musical Chairs */
register({
  id: 'chairs', icon: '🪑',
  name: () => T('Musical Chairs', 'Ghế Âm Nhạc'),
  async run(api) {
    style();
    api.say('Walk around the chairs. Sit when the music stops!', 'Đi quanh những cái ghế. Nghe nhạc dừng thì ngồi ngay!');
    const rounds = api.little ? 3 : 4;
    api.dots(rounds, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);

    for (let r = 0; r < rounds && !api.closed; r++) {
      stage.innerHTML = '';
      const chairsCount = 3 - r + (api.level >= 3 ? 1 : 0);
      const chairs = [];
      for (let i = 0; i < chairsCount; i++) {
        const chair = el('button', 'out-float out-chair', '');
        chair.style.left = 40 + i * 80 + 'px';
        chair.style.top = '140px';
        chair.setAttribute('aria-label', T('Chair', 'Cái ghế'));
        stage.appendChild(chair);
        chairs.push(chair);
      }
      api.say('The music is playing…', 'Nhạc đang vang…');
      await wait(1200 + rand(0, 800));
      api.say('Music stopped! Sit quick!', 'Nhạc dừng! Ngồi ngay!');
      api.sfx.pop(r);

      api.plan(() => chairs.find(c => c.isConnected) || null, { maxActions: rounds * 2 });

      const clicked = await untilRight(api, chairs, () => true);
      if (!clicked || api.closed) return;
      clicked.disabled = true;
      clicked.style.opacity = '0.6';
      api.dots(rounds, r + 1);
      await wait(400);
    }
    api.say('You got a seat every time!', 'Con ngồi được ghế mọi vòng!');
    await wait(1000);
    return api.win({ title: T('Chair Champion!', 'Vua Ghế Âm Nhạc!') });
  }
});

/* 7. Kick to Kick */
register({
  id: 'kicktokick', icon: '🏉',
  name: () => T('Kick to Kick', 'Đá Bóng Qua Lại'),
  async run(api) {
    style();
    api.say('Kick the footy to your friend and back!', 'Đá bóng cho bạn rồi nhận lại từ bạn nhé!');
    const passes = api.little ? 4 : 6;
    api.dots(passes, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);

    const ball = el('button', 'out-float', pic('🏉'));
    ball.style.left = '160px';
    ball.style.top = '140px';
    ball.style.fontSize = '48px';
    stage.appendChild(ball);

    let side = 0;
    for (let p = 0; p < passes && !api.closed; p++) {
      const targetX = side === 0 ? 260 : 60;
      api.plan(() => ball.isConnected ? ball : null, { maxActions: passes * 2 });
      const clicked = await untilRight(api, [ball], () => true);
      if (!clicked || api.closed) return;

      ball.style.transition = 'left 0.7s ease, top 0.7s ease';
      ball.style.left = targetX + 'px';
      ball.style.top = side === 0 ? '100px' : '180px';
      await wait(800);
      api.sfx.pop(p);
      api.dots(passes, p + 1);
      side = 1 - side;
      await wait(200);
    }
    api.say('Great passing! You and your friend play so well!', 'Chuyền bóng hay quá! Hai bạn chơi giỏi lắm!');
    await wait(1000);
    return api.win({ title: T('Footy Star!', 'Ngôi Sao Bóng Bầu Dục!') });
  }
});

/* 8. Little Nippers */
register({
  id: 'nippers', icon: '🏖️',
  name: () => T('Little Nippers', 'Bé Tập Cứu Hộ Biển'),
  async run(api) {
    style();
    api.say('Rescue the swimmers in the waves!', 'Cứu những bạn đang bơi giữa sóng nhé!');
    const target = api.little ? 3 : 5;
    api.dots(target, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);
    stage.style.background = '#d9f2f7';

    let rescued = 0;
    while (rescued < target && !api.closed) {
      stage.innerHTML = '';
      const swimmer = el('button', 'out-float', pic('🏊'));
      swimmer.style.left = rand(40, 280) + 'px';
      swimmer.style.top = rand(60, 220) + 'px';
      swimmer.style.fontSize = '44px';
      swimmer.setAttribute('aria-label', T('Swimmer needs help', 'Bạn bơi cần giúp đỡ'));
      stage.appendChild(swimmer);

      const board = el('button', 'out-float', pic('🛟'));
      board.style.left = '30px';
      board.style.top = '240px';
      board.style.fontSize = '44px';
      board.setAttribute('aria-label', T('Rescue ring', 'Phao cứu sinh'));
      stage.appendChild(board);

      api.plan(() => swimmer.isConnected ? swimmer : null, { maxActions: target * 3 });

      const clicked = await untilRight(api, [swimmer], () => true);
      if (!clicked || api.closed) return;
      api.sfx.pop(rescued);
      rescued++;
      api.dots(target, rescued);
      await wait(300);
    }
    api.say('All swimmers safe on the beach!', 'Mọi bạn bơi đã an toàn trên bãi biển!');
    await wait(1000);
    return api.win({ title: T('Surf Hero!', 'Anh Hùng Biển Nhí!') });
  }
});

/* 9. Rolling Hoops */
register({
  id: 'hoops', icon: '⭕',
  name: () => T('Rolling Hoops', 'Lăn Vòng'),
  async run(api) {
    style();
    api.say('Push the hoop along the path to the finish!', 'Đẩy vòng lăn theo đường đến đích nhé!');
    const steps = api.little ? 4 : 6;
    api.dots(steps, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);

    const hoop = el('button', 'out-float out-hoop', '');
    hoop.style.left = '30px';
    hoop.style.top = '140px';
    stage.appendChild(hoop);

    const path = [
      { x: 100, y: 140 },
      { x: 180, y: 100 },
      { x: 260, y: 140 },
      { x: 180, y: 180 },
      { x: 100, y: 140 },
      { x: 300, y: 140 }
    ].slice(0, steps);

    for (let s = 0; s < steps && !api.closed; s++) {
      const pt = path[s];
      api.plan(() => hoop.isConnected ? hoop : null, { maxActions: steps * 2 });
      const clicked = await untilRight(api, [hoop], () => true);
      if (!clicked || api.closed) return;

      hoop.style.transition = 'left 0.8s ease, top 0.8s ease';
      hoop.style.left = (pt.x - 28) + 'px';
      hoop.style.top = (pt.y - 28) + 'px';
      await wait(900);
      api.sfx.pop(s);
      api.dots(steps, s + 1);
      await wait(200);
    }
    api.say('The hoop rolled all the way to the finish!', 'Vòng đã lăn đến tận đích rồi!');
    await wait(1000);
    return api.win({ title: T('Hoop Master!', 'Bậc Thầy Lăn Vòng!') });
  }
});

/* 10. Tag */
register({
  id: 'tag', icon: '🏃',
  name: () => T('Tag!', 'Đuổi Bắt'),
  async run(api) {
    style();
    api.say('Chase and tag your friends!', 'Đuổi bắt các bạn nào!');
    const target = api.little ? 3 : 5;
    api.dots(target, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);

    let tagged = 0;
    while (tagged < target && !api.closed) {
      stage.innerHTML = '';
      const friend = el('button', 'out-float', pic('🧒'));
      friend.style.left = rand(40, 280) + 'px';
      friend.style.top = rand(40, 220) + 'px';
      friend.style.fontSize = '44px';
      friend.setAttribute('aria-label', T('Friend running', 'Bạn đang chạy'));
      stage.appendChild(friend);

      api.plan(() => friend.isConnected ? friend : null, { maxActions: target * 3 });

      const clicked = await untilRight(api, [friend], () => true);
      if (!clicked || api.closed) return;
      api.sfx.pop(tagged);
      tagged++;
      api.dots(target, tagged);
      await wait(300);
    }
    api.say('You tagged everyone! Fastest runner!', 'Con bắt được hết các bạn rồi! Chạy nhanh thật!');
    await wait(1000);
    return api.win({ title: T('Tag Champion!', 'Vua Đuổi Bắt!') });
  }
});
