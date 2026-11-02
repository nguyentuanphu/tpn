// (Round U, owner 11 Oct: "these buttons should tell what they are when hover or tap") The coin, Sparkle Orb and Leafy
// chips on the top bar and in the Backpack: a mouse hover shows their name (title), a tap shows a small card with the
// picture, the name and one line saying what they are for, spoken in the child's language.
import { T } from './i18n.js';
import { say } from './voice.js';
import { pic } from './art.js';
import { SFX } from './audio.js';

export const CHIP_INFO = {
  money: { icon: '🪙', name: ['Coins', 'Đồng xu'], about: ['Coins: you get them for helping people and playing games. Spend them on food, clothes and things for your house.', 'Đồng xu: con được thưởng khi giúp mọi người và chơi trò chơi. Dùng để mua đồ ăn, quần áo và đồ cho nhà mình.'] },
  orbs: { icon: '🔮', name: ['Sparkle Orbs', 'Ngọc Lấp Lánh'], about: ['Sparkle Orbs: solve a shrine to get one. Bring four to the Lotus Statue for an extra heart.', 'Ngọc Lấp Lánh: giải một ngôi miếu là có một viên. Mang bốn viên đến Tượng Hoa Sen để được thêm một trái tim.'] },
  leafy: { icon: '🍃', name: ['Leafies', 'Bạn Lá'], about: ['Leafies: little leaf friends hiding all over the valley. Can you find all 24?', 'Bạn Lá: những bạn lá nhỏ trốn khắp thung lũng. Con tìm đủ 24 bạn được không?'] }
};
export const chipTitle = k => T(...CHIP_INFO[k].name);

let card = null, timer = 0;
export function showChip(kind, anchor) {
  const c = CHIP_INFO[kind]; if (!c) return;
  SFX.tap(); clearTimeout(timer);
  if (!card) { card = document.createElement('div'); card.className = 'chipcard'; card.setAttribute('role', 'status'); document.body.appendChild(card); card.onclick = () => hide(); }
  card.innerHTML = `<span class="cc-pic">${pic(c.icon)}</span><div><b>${T(...c.name)}</b><small>${T(...c.about)}</small></div>`;
  const r = anchor ? anchor.getBoundingClientRect() : { left: 12, bottom: 80 };
  card.style.left = Math.max(8, Math.min(innerWidth - 300, r.left)) + 'px'; card.style.top = (r.bottom + 8) + 'px';
  card.classList.add('on'); say(...c.about);
  timer = setTimeout(hide, 6000);
}
function hide() { if (card) card.classList.remove('on'); }
