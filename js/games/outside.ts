import { register, untilRight, tapOne } from './frame.js';
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
button.out-float:not(.out-chair):not(.out-hoop) { background: none; border: 0; padding: 0; min-width: 64px; min-height: 64px; touch-action: manipulation; }
.out-btn .art { width: 30px; height: 30px; }
.out-float:active { transform: scale(1.2); }
.out-controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 380px; }
.out-stage .out-controls { position: relative; }
.out-call { font: 900 24px var(--font, sans-serif); color: #3b2a4f; text-align: center; padding: 0 10px; }
.out-egg { display: flex; flex-direction: column; align-items: center; line-height: .8; }
.out-eggtop { display: inline-block; transition: transform .6s; font-size: 30px; }
.out-float.hint { outline: 4px solid #ffd23f; border-radius: 50%; }
.out-circle { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.out-chair { width: 56px; height: 56px; background: #d4a87a; border-radius: 8px; position: absolute; border: 2px solid #3b2a4f; padding: 0; }
.out-chair::before { content: ''; position: absolute; top: -12px; left: 8px; width: 40px; height: 12px; background: #c4986a; border-radius: 4px; }
.out-hoop { width: 56px; height: 56px; border: 4px solid #3b6fe0; border-radius: 50%; position: absolute; background: none; }
.out-hoop::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 12px; height: 12px; background: #3b6fe0; border-radius: 50%; }
`));
}

/* 1. Hide and Seek */
// (owner, 29 Oct 2026 AEDT audit) a friend hides behind one tree: look behind the trees one by one. An empty tree is
// part of seeking, not a mistake (it counted as wrong, so the game was a guess that told the child off)
register({
  id: 'hideseek', icon: '🙈',
  name: () => T('Hide and Seek', 'Trốn Tìm'),
  async run(api) {
    style();
    api.say('Your friends are hiding! Look behind the trees to find them.', 'Các bạn đang trốn! Tìm sau những cái cây nhé.');
    const target = api.little ? 3 : 5;
    api.dots(target, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);
    const spots = [[20, 30], [130, 20], [235, 40], [30, 170], [135, 160], [235, 180]];
    let found = 0;
    while (found < target && !api.closed) {
      stage.innerHTML = '';
      const trees = shuffle(spots).slice(0, api.little ? 3 : 4 + (api.level >= 3 ? 1 : 0)).map(([x, y], i) => {
        const b = el('button', 'out-float', pic(i % 2 ? '🌲' : '🌳'));
        b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.fontSize = '52px';
        b.setAttribute('aria-label', T('Tree', 'Cái cây'));
        stage.appendChild(b); return b;
      });
      const hiding = trees[Math.floor(Math.random() * trees.length)];
      api.plan(() => hiding.isConnected && !hiding.disabled ? hiding : null, { maxActions: 8 });
      for (;;) {
        const tapped = await tapOne<HTMLButtonElement>(trees.filter(t => !t.disabled), api);
        if (!tapped || api.closed) return;
        tapped.disabled = true;
        if (tapped === hiding) break;
        tapped.style.opacity = '.45'; api.sfx.shut();
        api.say('Not here!', 'Không có ở đây!');
      }
      hiding.innerHTML = pic('🙈'); api.sfx.tada();
      api.say('Found you!', 'Tìm thấy rồi!');
      found++; api.dots(target, found);
      await wait(900);
    }
    api.say('Everyone is found! What great seekers!', 'Tìm thấy hết các bạn rồi! Con tìm giỏi quá!');
    await wait(1000);
    return api.win({ title: T('Super Seeker!', 'Thám Tử Nhí Giỏi Ghê!') });
  }
});

/* 2. Duck, Duck, Goose */
// (owner, 29 Oct 2026 AEDT audit) the real game: walk round the circle tapping heads, "duck, duck...", then choose
// your goose and race round before the goose catches you (it was a guess at one hidden "goose")
register({
  id: 'duckgoose', icon: '🦆',
  name: () => T('Duck, Duck, Goose', 'Vịt, Vịt, Ngỗng'),
  async run(api) {
    style();
    api.say('Tap the glowing friend to say Duck. When you like, tap Goose and run!', 'Chạm bạn đang sáng để nói Vịt. Khi nào thích, chạm Ngỗng rồi chạy nhé!');
    const rounds = api.little ? 3 : 4;
    api.dots(rounds, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);
    const controls = el('div', 'out-controls'); wrap.appendChild(controls);
    const goose = el('button', 'out-btn', `${pic('🦆')} <span>${T('Goose!', 'Ngỗng!')}</span>`); controls.appendChild(goose);
    const players = 5 + (api.level >= 3 ? 1 : 0), radius = 95, cx = 135, cy = 125;
    const kids = Array.from({ length: players }, (_, i) => {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / players;
      const b = el('button', 'out-float out-circle', pic(i % 2 ? '👧' : '🧒'));
      b.style.left = (cx + Math.cos(ang) * radius) + 'px'; b.style.top = (cy + Math.sin(ang) * radius) + 'px';
      stage.appendChild(b); return b;
    });
    let at = 0;
    for (let r = 0; r < rounds && !api.closed; r++) {
      let ducks = 0; goose.disabled = true;
      for (;;) {
        kids.forEach((k, i) => k.classList.toggle('hint', i === at));
        // (auto play says goose after two or three ducks)
        api.plan(() => ducks >= 2 + (r % 2) ? goose : kids[at], { maxActions: 6 });
        const tapped = await tapOne([...kids, goose].filter(b => !b.disabled), api);
        if (!tapped || api.closed) return;
        if (tapped === goose) break;
        if (tapped !== kids[at]) { api.sfx.no(); continue; }
        api.say('Duck!', 'Vịt!'); api.sfx.quack();
        ducks++; at = (at + 1) % players;
        if (ducks >= 2) goose.disabled = false;
      }
      const chosen = (at + players - 1) % players;
      kids.forEach(k => k.classList.remove('hint'));
      api.say('Goose! Run round the circle!', 'Ngỗng! Chạy vòng quanh nào!'); api.sfx.whoosh();
      kids[chosen].style.transform = 'scale(1.3) translateY(-8px)';
      await wait(1400);
      kids[chosen].style.transform = '';
      api.sfx.ding(); api.dots(rounds, r + 1);
      await wait(500);
    }
    api.say('You got back to the spot every time!', 'Con về chỗ kịp mọi vòng rồi!');
    await wait(1000);
    return api.win({ title: T('Goose Catcher!', 'Bắt Ngỗng Siêu Tốc!') });
  }
});

/* 3. Red Light, Green Light */
// (owner, 29 Oct 2026 AEDT audit) walk on green, freeze on red: the light changes by itself and walking on red sends
// you back a step (the child tapped the light, and the end said "you reached the finish" even after red mistakes)
register({
  id: 'redgreen', icon: '🚦',
  name: () => T('Red Light, Green Light', 'Đèn Xanh Đèn Đỏ'),
  async run(api) {
    style();
    api.say('Green light: tap Walk! Red light: freeze, do not tap!', 'Đèn xanh: chạm Đi! Đèn đỏ: đứng yên, đừng chạm!');
    const steps = api.little ? 4 : 6;
    api.dots(steps, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);
    const controls = el('div', 'out-controls'); wrap.appendChild(controls);
    const light = el('div', 'out-float', pic('🟢')); light.style.cssText += 'left: 140px; top: 20px; font-size: 56px;';
    const finish = el('div', 'out-float', pic('🏁')); finish.style.cssText += 'left: 255px; top: 170px; font-size: 40px;';
    const runner = el('div', 'out-float', pic('🏃')); runner.style.cssText += 'left: 10px; top: 170px; font-size: 48px; transition: left .4s;';
    stage.append(light, finish, runner);
    const walk = el('button', 'out-btn', `${pic('🏃')} <span>${T('Walk', 'Đi')}</span>`); controls.appendChild(walk);
    let green = true, pos = 0, alive = true;
    const place = () => { runner.style.left = (10 + pos * (235 / steps)) + 'px'; api.dots(steps, pos); };
    // the light changes by itself: longer greens for little ones
    (async () => {
      while (alive && !api.closed) {
        await wait(green ? (api.little ? 2600 : 1800) + rand(0, 900) : 1400 + rand(0, 900));
        if (!alive || api.closed) return;
        green = !green; light.innerHTML = pic(green ? '🟢' : '🔴');
        api.say(green ? 'Green light!' : 'Red light!', green ? 'Đèn xanh!' : 'Đèn đỏ!');
      }
    })();
    api.plan(() => green ? walk : null, { maxActions: steps * 3 });
    try {
      while (pos < steps) {
        const tapped = await tapOne([walk], api);
        if (!tapped || api.closed) return;
        if (green) { pos++; api.sfx.pop(pos); }
        else { api.sfx.no(); api.say('Red light! Back one step.', 'Đèn đỏ! Lùi lại một bước.'); pos = Math.max(0, pos - 1); }
        place();
      }
    } finally { alive = false; }
    api.say('You reached the finish line safely!', 'Con đến đích an toàn rồi!');
    await wait(1000);
    return api.win({ title: T('Safe Runner!', 'Vận Động Viên An Toàn!') });
  }
});

/* 4. Simon Says */
// (owner, 29 Oct 2026 AEDT audit) the real rule: do it only when Simon says so; without "Simon says", stay still
// (it was a memory game that never left out "Simon says")
register({
  id: 'simon', icon: '🗣️',
  name: () => T('Simon Says', 'Simon Bảo'),
  async run(api) {
    style();
    api.say('Do it only when you hear Simon says! If not, tap Stay still.', 'Chỉ làm khi nghe Simon bảo! Nếu không, chạm Đứng yên.');
    const rounds = api.little ? 4 : 6;
    api.dots(rounds, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);
    const actions = [
      { emoji: '👋', en: 'wave', vi: 'vẫy tay' },
      { emoji: '👏', en: 'clap', vi: 'vỗ tay' },
      { emoji: '☝️', en: 'point up', vi: 'chỉ lên trời' },
      { emoji: '👇', en: 'point down', vi: 'chỉ xuống đất' },
      { emoji: '🙌', en: 'hands up', vi: 'giơ hai tay' }
    ];
    // two or more rounds leave out "Simon says", in a mixed order
    const simonSays = shuffle(Array.from({ length: rounds }, (_, i) => i >= 2));
    await wait(2500);
    for (let r = 0; r < rounds && !api.closed; r++) {
      const act = actions[Math.floor(Math.random() * actions.length)], says = simonSays[r];
      stage.innerHTML = ''; stage.style.flexDirection = 'column'; stage.style.gap = '14px';
      const call = el('div', 'out-call', (says ? T('Simon says: ', 'Simon bảo: ') : '') + T(act.en, act.vi) + '!');
      stage.appendChild(call);
      api.say((says ? 'Simon says, ' : '') + act.en + '!', (says ? 'Simon bảo, ' : '') + act.vi + '!');
      const row = el('div', 'out-controls'); stage.appendChild(row);
      const btns = shuffle(actions).slice(0, api.little ? 2 : 3).filter(a => a !== act).slice(0, api.little ? 1 : 2).concat([act]).map(a => {
        const b = el('button', 'out-btn', `${pic(a.emoji)} <span>${T(a.en, a.vi)}</span>`); b.dataset.act = a.emoji; return b;
      });
      const still = el('button', 'out-btn', `${pic('🧍')} <span>${T('Stay still', 'Đứng yên')}</span>`); still.dataset.act = 'still';
      shuffle(btns).forEach(b => row.appendChild(b)); row.appendChild(still);
      const right = says ? btns.find(b => b.dataset.act === act.emoji) : still;
      api.plan(() => right, { maxActions: 4 });
      const tapped = await untilRight(api, [...btns, still], b => b === right);
      if (!tapped || api.closed) return;
      if (!says) api.say('Good! Simon did not say!', 'Giỏi! Simon đâu có bảo!');
      api.dots(rounds, r + 1);
      await wait(1200);
    }
    api.say('You only moved when Simon said so!', 'Con chỉ làm khi Simon bảo thôi!');
    await wait(1000);
    return api.win({ title: T("Simon's Star!", 'Ngôi Sao Của Simon!') });
  }
});

/* 5. Egg and Spoon Race */
// (owner, 29 Oct 2026 AEDT audit) the egg wobbles: step only while it sits still in the middle, or it nearly falls
// and you wait (any tap walked on before)
register({
  id: 'eggspoon', icon: '🥚',
  name: () => T('Egg and Spoon Race', 'Chạy Thìa Trứng'),
  async run(api) {
    style();
    api.say('Tap Step when the egg sits still in the middle!', 'Chạm Bước khi quả trứng nằm yên ở giữa thìa nhé!');
    const steps = api.little ? 4 : 6;
    api.dots(steps, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);
    const controls = el('div', 'out-controls'); wrap.appendChild(controls);
    const racer = el('div', 'out-float out-egg', `<span class="out-eggtop">${pic('🥚')}</span>${pic('🥄')}`);
    racer.style.cssText += 'left: 20px; top: 120px; font-size: 48px; transition: left .5s;';
    const finish = el('div', 'out-float', pic('🏁')); finish.style.cssText += 'left: 255px; top: 130px; font-size: 40px;';
    stage.append(finish, racer);
    const egg = racer.querySelector('.out-eggtop') as HTMLElement;
    const step = el('button', 'out-btn', `${pic('👣')} <span>${T('Step', 'Bước')}</span>`); controls.appendChild(step);
    let tilt = 0, alive = true;
    // the egg rolls one way, then the other, and rests in the middle now and then
    (async () => {
      const ways = [0, -18, 0, 16, 0, -14, 0, 20];
      for (let i = 0; alive && !api.closed; i = (i + 1) % ways.length) {
        tilt = ways[i]; egg.style.transform = `rotate(${tilt}deg) translateX(${tilt / 2}px)`;
        await wait(tilt === 0 ? (api.little ? 1500 : 1000) : 800);
      }
    })();
    api.plan(() => tilt === 0 ? step : null, { maxActions: steps * 3 });
    let pos = 0;
    try {
      while (pos < steps) {
        const tapped = await tapOne([step], api);
        if (!tapped || api.closed) return;
        if (tilt !== 0) { api.sfx.no(); api.say('Wobble! Wait until it is still.', 'Trứng lắc! Đợi trứng nằm yên đã.'); continue; }
        pos++; api.sfx.pop(pos); api.dots(steps, pos);
        racer.style.left = (20 + pos * (220 / steps)) + 'px';
      }
    } finally { alive = false; }
    api.say('Egg safe! You crossed the line!', 'Trứng an toàn! Con đã về đích!');
    await wait(1000);
    return api.win({ title: T('Steady Hands!', 'Đôi Tay Vững Vàng!') });
  }
});

/* 6. Musical Chairs */
// (owner, 29 Oct 2026 AEDT audit) sit only when the music stops, and one chair goes each round (round four had no
// chairs at all and the game stopped there; a tap while the music played was ignored)
register({
  id: 'chairs', icon: '🪑',
  name: () => T('Musical Chairs', 'Ghế Âm Nhạc'),
  async run(api) {
    style();
    api.say('Walk while the music plays. When it stops, tap an empty chair!', 'Nhạc vang thì đi vòng quanh. Nhạc dừng thì chạm ngay một ghế trống!');
    const rounds = api.little ? 3 : 4;
    api.dots(rounds, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);
    const note = el('div', 'out-float', pic('🎵')); note.style.cssText += 'left: 150px; top: 20px; font-size: 44px;';
    for (let r = 0; r < rounds && !api.closed; r++) {
      stage.innerHTML = ''; stage.appendChild(note);
      const count = rounds - r + 1;
      const chairs = Array.from({ length: count }, (_, i) => {
        const c = el('button', 'out-float out-chair', '');
        c.style.left = (30 + i * (280 / count)) + 'px'; c.style.top = '150px';
        c.setAttribute('aria-label', T('Chair', 'Cái ghế'));
        stage.appendChild(c); return c;
      });
      // the music: a little tune, until it stops at a time nobody knows
      let playing = true;
      note.style.visibility = 'visible';
      api.say('The music is playing…', 'Nhạc đang vang…');
      const stopAt = performance.now() + 2200 + rand(0, 2200);
      api.plan(() => playing ? null : chairs.find(c => !c.disabled) || null, { maxActions: 6 });
      const tune = (async () => { for (let i = 0; performance.now() < stopAt && !api.closed; i++) { api.sfx.pop(i % 5); await wait(320); } playing = false; })();
      // a friend takes one chair once the music stops; the child takes any other free one
      const tapWhile = async () => {
        for (;;) {
          const tapped = await tapOne(chairs.filter(c => !c.disabled), api);
          if (!tapped || api.closed) return null;
          if (playing) { api.sfx.no(); api.say('Wait for the music to stop!', 'Đợi nhạc dừng đã!'); continue; }
          return tapped;
        }
      };
      const tapping = tapWhile();
      await tune;
      if (api.closed) return;
      note.style.visibility = 'hidden';
      api.say('Music stopped! Sit quick!', 'Nhạc dừng! Ngồi ngay!');
      const friendChair = chairs[Math.floor(Math.random() * count)];
      setTimeout(() => { if (!friendChair.disabled) { friendChair.disabled = true; friendChair.innerHTML = pic('👧'); } }, 600);
      const sat = await tapping;
      if (!sat || api.closed) return;
      sat.disabled = true; sat.innerHTML = pic('🧒');
      api.sfx.ding(); api.dots(rounds, r + 1);
      await wait(900);
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
      const targetX = side === 0 ? 240 : 40;
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
// (owner, 29 Oct 2026 AEDT audit) the surf life saving rule: a swimmer who needs help raises one arm. Find the raised
// arm among the happy swimmers (there was one swimmer to tap, and a rescue ring nobody used)
register({
  id: 'nippers', icon: '🏖️',
  name: () => T('Little Nippers', 'Bé Tập Cứu Hộ Biển'),
  async run(api) {
    style();
    api.say('A swimmer who needs help raises one arm. Find them and throw the ring!', 'Bạn bơi cần giúp sẽ giơ một tay lên. Tìm bạn ấy và ném phao nhé!');
    const target = api.little ? 3 : 5;
    api.dots(target, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);
    stage.style.background = '#d9f2f7';
    const spots = [[20, 30], [130, 20], [235, 40], [30, 160], [135, 150], [235, 170]];
    let rescued = 0;
    while (rescued < target && !api.closed) {
      stage.innerHTML = '';
      const swimmers = shuffle(spots).slice(0, api.little ? 3 : 4).map(([x, y]) => {
        const b = el('button', 'out-float', pic('🏊'));
        b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.fontSize = '44px';
        b.setAttribute('aria-label', T('Swimmer', 'Bạn đang bơi'));
        stage.appendChild(b); return b;
      });
      const help = swimmers[Math.floor(Math.random() * swimmers.length)];
      help.innerHTML = pic('🙋'); help.setAttribute('aria-label', T('Swimmer needs help', 'Bạn bơi cần giúp đỡ'));
      api.plan(() => help.isConnected ? help : null, { maxActions: 4 });
      const clicked = await untilRight(api, swimmers, b => b === help);
      if (!clicked || api.closed) return;
      help.innerHTML = pic('🛟'); api.sfx.splash();
      rescued++;
      api.dots(target, rescued);
      await wait(800);
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
      { x: 240, y: 140 },
      { x: 180, y: 180 },
      { x: 100, y: 140 },
      { x: 270, y: 140 }
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
// (owner, 29 Oct 2026 AEDT audit) a chase: the friend runs to a new spot every moment, so the child has to catch them
// (they stood still to be tapped)
register({
  id: 'tag', icon: '🏃',
  name: () => T('Tag!', 'Đuổi Bắt'),
  async run(api) {
    style();
    api.say('Chase and tag your friends! They keep running.', 'Đuổi bắt các bạn nào! Các bạn chạy liên tục đó.');
    const target = api.little ? 3 : 5;
    api.dots(target, 0);
    const wrap = el('div', 'out-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'out-stage'); wrap.appendChild(stage);
    let tagged = 0;
    while (tagged < target && !api.closed) {
      stage.innerHTML = '';
      const friend = el('button', 'out-float', pic(tagged % 2 ? '👧' : '🧒'));
      friend.style.cssText += `font-size: 44px; transition: left ${api.little ? .9 : .6}s, top ${api.little ? .9 : .6}s;`;
      const hop = () => { friend.style.left = rand(10, 240) + 'px'; friend.style.top = rand(20, 200) + 'px'; };
      hop();
      friend.setAttribute('aria-label', T('Friend running', 'Bạn đang chạy'));
      stage.appendChild(friend);
      const runner = setInterval(hop, api.little ? 1800 : 1200);
      api.plan(() => friend.isConnected ? friend : null, { maxActions: 4 });
      const clicked = await tapOne([friend], api);
      clearInterval(runner);
      if (!clicked || api.closed) return;
      api.say('Tag, you are it!', 'Bắt được rồi!'); api.sfx.pop(tagged);
      tagged++;
      api.dots(target, tagged);
      await wait(700);
    }
    api.say('You tagged everyone! Fastest runner!', 'Con bắt được hết các bạn rồi! Chạy nhanh thật!');
    await wait(1000);
    return api.win({ title: T('Tag Champion!', 'Vua Đuổi Bắt!') });
  }
});
