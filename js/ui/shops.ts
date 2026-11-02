// Cooking, the shop and the wardrobe (split from js/ui.ts, v1.07).
import type { Profile } from '../../types/save.js';
import { T, nm } from '../i18n.js';
import { saveProfiles, STYLES, OUTFIT_COLORS, HATS, BACKS, HAIR, HAIRSTYLES, GLIDERS, farm } from '../state.js';
import { say } from '../voice.js';
import { SFX } from '../audio.js';
import { fmt, cur, spoken as money } from '../money.js';
import { el, esc, $, wait } from '../util.js';
import { owns } from '../content/shop.js';
import { ITEMS, findRecipe, SHOP, HAT_ICON, HAT_NAME } from '../data.js';
import { modal, reward } from '../popups.js';
import { STYLE_ICON } from './common.js';
// ---------- cooking ----------
export function openCooking(game, i) {
  const hero = game.heroes[i], p: Profile = hero.profile;
  const m = modal('cook', '');
  const card = m.querySelector('.card');
  const pot = [];
  const draw = () => {
    const have = Object.entries<number>(p.inv).map(([id, n]): [string, number] => [id, n - pot.filter(x => x === id).length]).filter(([, n]) => n > 0);
    card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>🍲 ${T('Cooking pot', 'Nồi nấu ăn')}</h2>
      <p class="sub">${T('Put up to 3 things in the pot. Try different mixes to discover Vietnamese dishes!', 'Cho tối đa 3 thứ vào nồi. Thử trộn khác nhau để khám phá món ăn Việt Nam!')}</p>
      <div class="potbox">${[0, 1, 2].map(k => `<button class="pslot" data-k="${k}">${pot[k] ? ITEMS[pot[k]].icon : ''}</button>`).join('')}</div>
      <div class="slots">${have.map(([id, n]) => `<button class="slot" data-add="${id}"><span>${ITEMS[id].icon}</span><b>${n}</b><small>${esc(ITEMS[id].name())}</small></button>`).join('') || `<p class="note">${T('Your backpack is empty. Find ingredients or buy them from Cô Mai.', 'Ba lô trống rồi. Tìm nguyên liệu hoặc mua ở chỗ Cô Mai nhé.')}</p>`}</div>
      <button class="btn primary wide big" id="cookGo" ${pot.length ? '' : 'disabled'}>🔥 ${T('Cook!', 'Nấu!')}</button>`;
    card.querySelector('.x').onclick = () => m.close();
    card.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { if (pot.length < 3) { pot.push(b.dataset.add); SFX.pop(pot.length); draw(); } });
    card.querySelectorAll('.pslot').forEach(b => b.onclick = () => { pot.splice(+b.dataset.k, 1); draw(); });
    card.querySelector('#cookGo').onclick = async () => {
      const r = findRecipe(pot); if (!r) return;
      pot.forEach(id => { p.inv[id]--; if (p.inv[id] <= 0) delete p.inv[id]; });
      const isNew = p.dishes[r.id] == null;
      p.dishes[r.id] = (p.dishes[r.id] || 0) + 1; pot.length = 0; saveProfiles();
      card.innerHTML = `<div class="cooking"><div class="steam">♨️</div><div class="potbig">🍲</div></div>`; SFX.cook();
      await wait(1800); m.close();
      await reward(r.icon, T(`You made ${r.name()}!`, `Con đã nấu ${r.name()}!`), isNew ? T('New recipe! It is in your Backpack.', 'Công thức mới! Món ăn ở trong Ba lô.') : '');
      say(`Yum! ${r.name()}!`, `Ngon quá! ${r.name()}!`);
      game.onCooked(hero, r);
    };
  };
  draw();
}

// ---------- shop ----------
export function openShop(game, i) {
  const hero = game.heroes[i], p: Profile = hero.profile;
  const m = modal('shop', '');
  const card = m.querySelector('.card');
  const draw = () => {
    card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>🛒 ${T("Cô Mai's stall", 'Sạp hàng Cô Mai')}</h2>
      <p class="sub">💰 ${T('You have', 'Con có')} <b>${fmt(farm.coins)}</b> ${cur().flag}</p>
      <div class="shoplist">${SHOP.map((s, k) => {
        const owned = s.kind === 'hat' && typeof s.id === 'string' ? p.owned.hats.includes(s.id) : s.kind === 'glider' && typeof s.id === 'number' ? p.owned.gliders.includes(s.id) : false;
        const ic = s.kind === 'item' ? ITEMS[s.id].icon : s.kind === 'hat' ? HAT_ICON[s.id] : `<span class="sw big" style="background:${GLIDERS[s.id]}"></span>`;
        const nm = s.kind === 'item' ? ITEMS[s.id].name() : s.kind === 'hat' ? HAT_NAME[s.id]() : T('Glider colour', 'Màu cánh lượn');
        return `<button class="sitem ${owned ? 'owned' : ''} ${farm.coins < s.price && !owned ? 'poor' : ''}" data-k="${k}"><span class="si">${ic}</span><small>${esc(nm)}</small><b>${owned ? '✓' : fmt(s.price)}</b></button>`;
      }).join('')}</div>`;
    card.querySelector('.x').onclick = () => m.close();
    card.querySelectorAll('.sitem').forEach(b => b.onclick = () => {
      const s = SHOP[+b.dataset.k];
      const owned = s.kind === 'hat' && typeof s.id === 'string' ? p.owned.hats.includes(s.id) : s.kind === 'glider' && typeof s.id === 'number' ? p.owned.gliders.includes(s.id) : false;
      if (owned) return;
      if (s.kind === 'glider' && !p.glider) { say('You need a glider first!', 'Con cần có cánh lượn trước đã!'); return; }
      if (farm.coins < s.price) { SFX.no(); say(`That costs ${fmt(s.price)}. Play games to earn more money!`, `Món này giá ${fmt(s.price)}. Chơi trò chơi để có thêm tiền nhé!`); return; }
      farm.coins -= s.price; SFX.coin();
      if (s.kind === 'item') p.inv[s.id] = (p.inv[s.id] || 0) + 1;
      if (s.kind === 'hat' && typeof s.id === 'string') { p.owned.hats.push(s.id); p.look.hat = s.id; game.rebuildHero(i); }
      if (s.kind === 'glider' && typeof s.id === 'number') { p.owned.gliders.push(s.id); p.look.glider = s.id; game.rebuildHero(i); }
      saveProfiles(); say('Thank you! Here you go!', 'Cảm ơn con! Của con đây!'); draw();
    });
  };
  draw();
}

// ---------- wardrobe (for the children: pictures only, changes show live on the character) ----------
export function openWardrobe(game, i, onClose) {
  if (game.shop && game.shop.on()) return game.shop.openWardrobe(i, onClose); // (round S) what the child owns from the clothes shop
  const p = game.heroes[i].profile;
  const m = el('div', 'wardrobe');
  document.body.appendChild(m);
  const rows: [string, string[], (value: string) => string][] = [
    ['style', STYLES, v => STYLE_ICON[v]], ['color', OUTFIT_COLORS, v => `<span class="sw big" style="background:${v}"></span>`],
    ['hat', HATS, v => HAT_ICON[v]], ['back', BACKS, v => ({ none: '🙂', wings: '🧚', cape: '🦸' }[v])],
    ['hairStyle', HAIRSTYLES, v => ({ short: '💇', buns: '🎀', long: '👩', ponytail: '🐴', spiky: '🦔' }[v])], ['hair', HAIR, v => `<span class="sw big" style="background:${v}"></span>`]
  ];
  const draw = () => {
    m.innerHTML = `<button class="x" aria-label="${T('Done', 'Xong')}">✔️</button>` + rows.map(([k, list, r]) => `<div class="wrow">${list.map(v => `<button class="chip ${p.look[k] === v ? 'on' : ''}" data-k="${k}" data-v="${v}">${r(v)}</button>`).join('')}</div>`).join('');
    m.querySelector('.x').onclick = () => { m.remove(); saveProfiles(); SFX.chime(); say('You look wonderful!', 'Con trông tuyệt quá!'); onClose && onClose(); };
    m.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { p.look[b.dataset.k] = b.dataset.v; SFX.pop(1); game.rebuildHero(i); draw(); });
  };
  draw(); say('Dress up time! Tap the pictures to try things on.', 'Thay đồ nào! Chạm vào hình để thử nhé.');
}
