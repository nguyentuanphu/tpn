import { register } from './frame.js';
import { T } from '../i18n.js';
import { el, wait } from '../util.js';
import { createRound, isCorrectOrder, scoreRound, SYMBOLS } from './fruitparade-core.js';

const CONFIG = {
  0: { rounds: 2, interval: 900 },
  1: { rounds: 2, interval: 700 },
  2: { rounds: 3, interval: 520 },
  3: { rounds: 4, interval: 360 }
};

const addStyle = (stage: HTMLElement) => {
  if (stage.querySelector('[data-fruit-style]')) return;
  const style = document.createElement('style');
  style.dataset.fruitStyle = '1';
  style.textContent = '.fruit-parade{display:grid;gap:14px;justify-items:center}.fruit-mission{font-size:clamp(28px,8vw,52px);letter-spacing:.12em;text-align:center}.fruit-lanes{display:grid;grid-template-columns:repeat(3,minmax(72px,1fr));gap:12px;width:min(100%,560px)}.fruit-lane{display:grid;gap:8px;justify-items:center}.fruit-window{display:grid;place-items:center;min-height:112px;width:100%;border:4px solid #55b9d6;border-radius:24px;background:linear-gradient(#fff,#e5f8ff);font-size:clamp(48px,13vw,82px);box-shadow:0 7px 0 #c4e4ee}.fruit-stop{min-height:56px;width:100%;border:0;border-radius:18px;background:#ffb238;color:#39250d;font:inherit;font-weight:800;touch-action:manipulation}.fruit-stop:disabled{opacity:.55}.fruit-message{min-height:2em;text-align:center;font-weight:700}.fruit-progress{width:min(100%,560px);height:14px;border-radius:99px;background:#d9edf2;overflow:hidden}.fruit-progress>i{display:block;height:100%;background:#58c985;transition:width .25s ease}@media(prefers-reduced-motion:reduce){.fruit-progress>i{transition:none}}';
  stage.appendChild(style);
};

register({
  id: 'fruitparade',
  icon: '🍎',
  name: () => T('Sparkle Fruit Parade', 'Diễu hành trái cây lấp lánh'),
  online: true,
  async run(api) {
    const tier = Math.max(0, Math.min(3, api.tier()));
    const config = CONFIG[tier];
    addStyle(api.stage);
    api.show('Find the fruit parade!', 'Tìm đoàn trái cây nhé!');
    const root = el('div', 'fruit-parade');
    const mission = el('div', 'fruit-mission');
    const lanes = el('div', 'fruit-lanes');
    const message = el('div', 'fruit-message');
    const progress = el('div', 'fruit-progress', '<i style="width:0%"></i>');
    const bar = progress.querySelector('i') as HTMLElement;
    root.append(mission, lanes, message, progress);
    api.stage.appendChild(root);
    let points = 0;
    const localSeat = api.online ? api.online.mine : 0;
    let npcMode = !api.online;
    if (!api.online) {
      const choice = el('div', 'fruit-choice', `<button type="button" data-mode="solo">${T('Play solo', 'Chơi một mình')}</button><button type="button" data-mode="npc">${T('Play with a helper', 'Chơi cùng bạn máy')}</button>`);
      root.insertBefore(choice, mission);
      await new Promise<void>(resolve => {
        choice.querySelectorAll('[data-mode]').forEach(button => button.onclick = () => {
          npcMode = button.dataset.mode === 'npc';
          choice.remove();
          resolve();
        });
      });
    }

    for (let round = 0; round < config.rounds; round++) {
      if (api.closed) return;
      api.dots(config.rounds, round);
      const seed = api.online ? String(api.online.seed) + ':' + round : 'local:' + round + ':' + tier;
      const challenge = createRound(seed, tier);
      mission.textContent = challenge.target.join(' ');
      message.textContent = T('Stop each lane on the matching symbol.', 'Dừng từng làn khi hiện đúng biểu tượng nhé.');
      const selected: string[] = [];
      const timers: ReturnType<typeof setInterval>[] = [];
      const finish = () => {
        if (selected.filter(Boolean).length !== 3) return;
        const correct = isCorrectOrder(selected, challenge.target);
        if (correct) {
          points += scoreRound({ correct: true, attempts: 1, level: tier });
          api.right();
          message.textContent = T('Wonderful teamwork!', 'Cùng nhau giỏi quá!');
        } else {
          api.wrong(undefined, 'Almost! One more try.', 'Gần đúng rồi! Thử lại lần nữa nhé.');
          message.textContent = T('Almost! One more try!', 'Gần đúng rồi! Thử lại lần nữa nhé!');
        }
        bar.style.width = Math.round((round + 1) / config.rounds * 100) + '%';
      };
      const stopLane = (lane: number, button: HTMLButtonElement, index: number) => {
        if (button.disabled) return;
        button.disabled = true;
        clearInterval(timers[lane]);
        selected[lane] = SYMBOLS[index];
        api.sfx.tap();
        if (api.online) api.online.move(round * 3 + lane, index);
        finish();
      };

      for (let lane = 0; lane < 3; lane++) {
        const box = el('div', 'fruit-lane');
        const window = el('div', 'fruit-window', challenge.items[lane]);
        const button = el('button', 'fruit-stop', T('STOP ' + (lane + 1), 'DỪNG ' + (lane + 1))) as HTMLButtonElement;
        button.type = 'button';
        button.setAttribute('aria-label', T('Stop lane ' + (lane + 1), 'Dừng làn ' + (lane + 1)));
        const assignedSeat = lane % (api.online ? api.online.names.length : 1);
        const assigned = !api.online ? !npcMode || lane === 0 : assignedSeat === localSeat;
        button.disabled = !assigned;
        box.append(window, button);
        lanes.appendChild(box);
        let index = challenge.items.indexOf(challenge.items[lane]);
        const tick = () => { index = (index + 1) % SYMBOLS.length; window.textContent = SYMBOLS[index]; };
        timers.push(setInterval(tick, config.interval));
        if (assigned) button.onclick = () => stopLane(lane, button, index);
        if (!api.online && npcMode && !assigned) {
          const npcDelay = Math.max(300, config.interval * (tier <= 1 ? 2 : 1));
          const npcTimer = setTimeout(() => { if (!button.disabled) button.click(); }, npcDelay);
          timers.push(npcTimer);
        }
        if (api.online && !assigned) {
          void api.online.next(round * 3 + lane, assignedSeat).then(value => {
            if (value == null) return;
            selected[lane] = SYMBOLS[value] || challenge.items[lane];
            finish();
          });
        }
      }
      api.onCleanup(() => timers.forEach(clearInterval));
      await new Promise<void>(resolve => {
        const poll = setInterval(() => {
          if (selected.filter(Boolean).length === 3) { clearInterval(poll); setTimeout(resolve, 450); }
        }, 40);
        api.onCleanup(() => clearInterval(poll));
      });
      lanes.innerHTML = '';
      if (!isCorrectOrder(selected, challenge.target) && !api.little) round--;
    }
    if (api.closed) return;
    api.show(points ? 'Wonderful! Parade complete!' : 'Great try! Let us play again!', points ? 'Tuyệt vời! Hoàn thành đoàn diễu hành rồi!' : 'Cố gắng rất tốt! Mình chơi lại nhé!');
    await wait(600);
    return api.win({ title: points ? T('Parade complete!', 'Hoàn thành đoàn diễu hành!') : T('Great try!', 'Cố gắng rất tốt!') });
  }
});
