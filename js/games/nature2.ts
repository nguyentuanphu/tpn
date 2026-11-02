// Owner-added Australian nature games (owner, 23 Oct 2026 AEDT):
// Catch-and-release fish, emu egg basket, and Great Barrier Reef cleaner.
import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, wait, rand } from '../util.js';

// (owner, 1 Nov 2026 AEDT: "the levels often don't change anything") one value per level: under-5s keep the first, big kids
// get Easy · Medium · Hard · Talent. The values a game uses are on its stage (data-lv) for the checks.
const lv = <V>(api, little: V, easy: V, medium: V, hard: V, talent: V): V => { const v = api.little ? little : [easy, medium, hard, talent][Math.max(0, Math.min(3, api.smart || 0))]; api.lvNote?.([little, easy, medium, hard, talent], v); return v; };
const mark = (api, ...v: unknown[]) => { api.stage.dataset.lv = v.join(','); };
// something that swims or drifts to a new place every few moments (0: it stays still)
const drift = (e: HTMLElement, ms: number, maxTop = 220) => { if (!ms) return 0; e.style.transition = `left ${ms * .6}ms, top ${ms * .6}ms`; return setInterval(() => { e.style.left = rand(20, 260) + 'px'; e.style.top = rand(20, maxTop) + 'px'; }, ms); };

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.n2-board { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px; margin: 0 auto; max-width: 96vw; }
.n2-stage { position: relative; width: min(360px, 86vw); height: min(320px, 48vh); background: #e8f6ff; border-radius: 20px; box-shadow: 0 4px 16px rgba(40, 30, 60, .14); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.n2-btn { min-width: 64px; min-height: 64px; padding: 8px 16px; border-radius: 999px; border: 2px solid #3b2a4f; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .2); font: 800 17px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; touch-action: manipulation; }
.n2-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(59, 42, 79, .2); }
.n2-float { position: absolute; font-size: 44px; cursor: pointer; transition: transform .2s; }
.n2-float:active { transform: scale(1.2); }
`));
}

// 1. Catch-and-Release Fish
register({
  id: 'catchfish', icon: '🐟',
  name: () => T('Catch-and-Release Fish', 'Vớt Cá Thơ Ngây'),
  async run(api) {
    style();
    api.say('Scoop the little fish into your net, then watch it swim safely away!',
      'Vớt chú cá nhỏ vào vợt rồi thả cá bơi đi an toàn nhé!');
    // more fish each level; from Medium the fish swims about, faster each level
    const target = lv(api, 3, 4, 5, 7, 8), swimMs = lv(api, 0, 0, 2200, 1500, 1000);
    mark(api, target, swimMs);
    api.dots(target, 0);
    const wrap = el('div', 'n2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'n2-stage'); wrap.appendChild(stage);

    let caught = 0;
    while (caught < target) {
      stage.innerHTML = '';
      const fish = el('button', 'n2-float', pic('🐟'));
      fish.style.left = rand(20, 260) + 'px';
      fish.style.top = rand(20, 220) + 'px';
      fish.setAttribute('aria-label', T('Fish', 'Con cá'));
      stage.appendChild(fish);

      api.plan(() => fish.isConnected ? fish : null, { maxActions: 4 });
      const swim = drift(fish, swimMs);
      const clicked = await untilRight(api, [fish], e => e === fish);
      clearInterval(swim);
      if (!clicked || api.closed) return;
      api.sfx.pop(caught);
      caught++;
      api.dots(target, caught);
      await wait(300);
    }
    api.say('All the fish swim happily back to the river!', 'Những chú cá bơi lội vui vẻ về với dòng sông!');
    await wait(1200);
    return api.win({ title: T('Gentle Fisherman!', 'Bé Vớt Cá Thơ Ngây!') });
  }
});

// 2. Emu Egg Basket
register({
  id: 'emueggs', icon: '🥚',
  name: () => T('Emu Egg Basket', 'Nhặt Trứng Đà Điểu'),
  async run(api) {
    style();
    api.say('Find the big dark-green emu eggs hidden in the spinifex grass!',
      'Tìm những quả trứng đà điểu màu xanh sẫm ẩn trong bụi cỏ nhé!');
    // more eggs each level, hidden among white hens' eggs that do not belong to the emu (more of them each level)
    const target = lv(api, 3, 4, 5, 6, 7), others = lv(api, 0, 0, 1, 3, 5);
    mark(api, target, others);
    api.dots(target, 0);
    const wrap = el('div', 'n2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'n2-stage'); stage.style.background = '#f7eed8'; wrap.appendChild(stage);

    let collected = 0;
    while (collected < target) {
      stage.innerHTML = '';
      const egg = el('button', 'n2-float', pic('egg:emu'));
      egg.style.left = rand(20, 260) + 'px';
      egg.style.top = rand(20, 220) + 'px';
      egg.setAttribute('aria-label', T('Emu egg', 'Trứng đà điểu'));
      stage.appendChild(egg);

      const hens = Array.from({ length: others }, () => {
        const h = el('button', 'n2-float', pic('🥚')); h.style.left = rand(20, 260) + 'px'; h.style.top = rand(20, 220) + 'px';
        h.setAttribute('aria-label', T('Hen egg', 'Trứng gà')); stage.insertBefore(h, egg); return h;
      });
      api.plan(() => egg.isConnected ? egg : null, { maxActions: 4 });
      const clicked = await untilRight(api, [egg, ...hens], e => e === egg);
      if (!clicked || api.closed) return;
      api.sfx.pop(collected);
      collected++;
      api.dots(target, collected);
      await wait(300);
    }
    api.say('A full basket of emu eggs safely gathered for the nest!', 'Chiếc giỏ đầy trứng đà điểu đã gom về tổ an toàn!');
    await wait(1200);
    return api.win({ title: T('Eggs in the Basket!', 'Trứng Đã Về Tổ!') });
  }
});

// 3. Great Barrier Reef Cleaner
register({
  id: 'reefclean', icon: '🪸',
  name: () => T('Great Barrier Reef Cleaner', 'Bảo Vệ Rạn San Hô'),
  async run(api) {
    style();
    api.say('Pick up the plastic and old nets so the sea turtles and corals stay safe!',
      'Thu gom rác và lưới để rùa biển cùng rạn san hô luôn an toàn nhé!');
    // more litter each level; from Hard a sea turtle swims by (leave it be), and on Talent the litter drifts with the current
    const target = lv(api, 4, 5, 6, 8, 10), friends = lv(api, 0, 0, 0, 1, 2), driftMs = api.talent ? 1600 : 0;
    mark(api, target, friends, driftMs);
    api.dots(target, 0);
    const wrap = el('div', 'n2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'n2-stage'); stage.style.background = '#d9f2f7'; wrap.appendChild(stage);

    const coral = el('div', '', pic('🪸')); coral.style.cssText = 'position:absolute;bottom:10px;font-size:70px;'; stage.appendChild(coral);

    const animals = Array.from({ length: friends }, (_, i) => {
      const a = el('button', 'n2-float', pic(i ? '🐠' : '🐢')); a.style.left = rand(20, 260) + 'px'; a.style.top = rand(20, 180) + 'px';
      a.setAttribute('aria-label', T(i ? 'Fish' : 'Sea turtle', i ? 'Con cá' : 'Rùa biển')); stage.appendChild(a); return a;
    });
    const swims = animals.map(a => drift(a, 1800, 180)); api.onCleanup(() => swims.forEach(clearInterval));
    let cleaned = 0;
    while (cleaned < target) {
      const junk = el('button', 'n2-float', pic(['🥤', '🕸️', '🛍️'][cleaned % 3])); // (audit: a plastic cup and bag, not a champagne bottle)
      junk.style.left = rand(20, 260) + 'px';
      junk.style.top = rand(20, 180) + 'px';
      junk.setAttribute('aria-label', T('Litter', 'Rác'));
      stage.appendChild(junk);

      api.plan(() => junk.isConnected ? junk : null, { maxActions: 4 });
      const floating = drift(junk, driftMs, 180);
      const clicked = await untilRight(api, [junk, ...animals], e => e === junk);
      clearInterval(floating);
      if (!clicked || api.closed) return;
      junk.remove();
      api.sfx.pop(cleaned);
      cleaned++;
      api.dots(target, cleaned);
      await wait(300);
    }
    swims.forEach(clearInterval);
    api.say('The Great Barrier Reef sparkles clean and clear!', 'Rạn san hô rực rỡ và trong xanh trở lại rồi!');
    await wait(1200);
    return api.win({ title: T('Clean Ocean Reef!', 'Rạn San Hô Trong Sạch!') });
  }
});