// Market money game: pay the exact price with real Australian or Vietnamese money.
import { register } from './frame.js';
import { T } from '../i18n.js';
import { settings } from '../state.js';
import { CUR, fmtMinor, spokenMinor, moneyEl, curCode } from '../money.js';
import { el, wait, pick } from '../util.js';

const ITEMS = [['🍌', 'bananas', 'chuối'], ['🥭', 'a mango', 'xoài'], ['🥖', 'a bánh mì', 'bánh mì'], ['🍦', 'an ice cream', 'kem'], ['🧃', 'a juice', 'nước ép'], ['🍬', 'some lollies', 'kẹo'], ['🍉', 'a watermelon', 'dưa hấu'], ['🌽', 'corn', 'bắp ngô']];
// Which notes/coins to offer and how big prices get, per level.
const PLAN = {
  AUD: [[[100], 1, 4, 100], [[100, 200], 2, 6, 100], [[100, 200, 500], 3, 12, 100], [[10, 20, 50, 100, 200], 50, 500, 10], [[5, 10, 20, 50, 100, 200, 500, 1000], 105, 2000, 5]],
  VND: [[[1000], 1, 4, 1000], [[1000, 2000], 2, 8, 1000], [[1000, 2000, 5000], 3, 15, 1000], [[2000, 5000, 10000, 20000], 6, 50, 1000], [[5000, 10000, 20000, 50000, 100000], 15, 200, 1000]]
};
register({
  id: 'market', icon: '🛒', name: () => T('Market Helper', 'Bé Đi Chợ'),
  async run(api) {
    const code = curCode(), cur = CUR[code];
    const [denoms, lo, hi, unit] = PLAN[code][Math.min(4, api.level - 1)];
    const rounds = 3;
    api.stage.dataset.lv = [denoms.length, lo, hi, unit, rounds].join(',');   // (v1.07 levels) money offered, price range and step, rounds
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const [ic, en, vi] = pick(ITEMS);
      // Prices are multiples of "unit" in minor currency (cents or đồng), from lo..hi of those units.
      let price;
      if (code === 'AUD' && unit < 100) { const steps = Math.floor((hi - lo) / unit); price = lo + unit * Math.floor(Math.random() * (steps + 1)); }
      else price = unit * (lo + Math.floor(Math.random() * (hi - lo + 1)));
      const stall = el('div', 'stall', `<div class="item">${ic}</div><div class="tag">${fmtMinor(price, code)}</div>`);
      api.stage.appendChild(stall);
      const tray = el('div', 'tray', `<div class="sum"></div><div class="coins"></div>`); api.stage.appendChild(tray);
      const wallet = el('div', 'wallet'); api.stage.appendChild(wallet);
      api.say(`${en[0].toUpperCase() + en.slice(1)} costs ${spokenMinor(price, 'en', code)}. Tap the money to pay exactly that much.`, `${vi[0].toUpperCase() + vi.slice(1)} giá ${spokenMinor(price, 'vi', code)}. Chạm vào tiền để trả đúng số tiền nhé.`);
      let sum = 0;
      const sumEl = tray.querySelector('.sum'), coins = tray.querySelector('.coins');
      const show = () => { sumEl.innerHTML = `${T('You gave', 'Con đưa')}: <b>${fmtMinor(sum, code)}</b>`; tray.classList.toggle('over', sum > price); };
      show();
      const pay = new Map<number, HTMLElement>();
      // (r89) auto play pays like a child counting out money: the biggest one that still fits, a coin back if it went over
      api.plan(() => { if (!wallet.isConnected || sum === price) return null; if (sum > price) { const c = coins.lastElementChild; return c instanceof HTMLElement ? c : null; }
        const v = [...pay.keys()].filter(x => x <= price - sum).sort((x, y) => y - x)[0]; return v ? pay.get(v) : null; }, { maxActions: rounds * 40 });
      await new Promise<void>(res => {
        denoms.forEach(v => {
          const d = cur.denoms.find(x => x.v === v); const b = el('button', 'wallet-btn'); b.appendChild(moneyEl(d)); pay.set(v, b);
          b.onclick = () => {
            if (sum >= price) return;
            sum += v; api.sfx.coin();
            const m = moneyEl(d); m.classList.add('in'); m.onclick = () => { sum -= v; m.remove(); api.sfx.tap(); show(); }; coins.appendChild(m);
            show();
            if (sum === price) { api.right(tray); res(); }
            else if (sum > price) api.say('Oops, that is too much! Tap a coin in the tray to take it back.', 'Ôi, nhiều quá rồi! Chạm vào tiền trong khay để lấy lại nhé.');
          };
          wallet.appendChild(b);
        });
        api.onCleanup(res);
      });
      if (api.closed) return;
      api.say(`Exactly ${spokenMinor(price, 'en', code)}! Thank you!`, `Đúng ${spokenMinor(price, 'vi', code)}! Cảm ơn con!`);
      stall.classList.add('sold'); await wait(1900);
    }
    api.dots(rounds, rounds); return api.win();
  }
});
