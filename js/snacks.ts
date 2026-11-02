// Food bought at a kiosk, a market stall or from a street seller goes in the backpack ("From shops and
// stalls"). The child can eat it straight away or keep it for later; eating it fills the stamina wheel and
// stamps the food passport. Kept in profile.bought = { vendorId: count }.
import { T } from './i18n.js';
import { VENDORS } from './vendors.js';
import { dialog, reward } from './popups.js';
import { farm, saveFarm } from './state.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { fmt } from './money.js';
import { keptOn, markTried } from './custom.js';

export const snackOf = id => VENDORS.find(v => v.id === id);

// (Round U, owner 11 Oct: "sellers remember you") a seller the child has bought from before says hello by name on the
// screen and remembers what they had; the spoken words have no name (HANDOFF rule 11: names are never recorded)
export function greetLine(h, v) {
  const p = h.profile, n = (p.regulars || {})[v.id] || 0;
  if (!n || !p.name || !keptOn('sellersRemember', [p])) return v.greet;   // (batch rollout) Studio switch 'sellersRemember'
  return [`Hello again, ${p.name}! Would you like ${v.food[1]} again, like last time?`, `Con lại đến rồi, ${p.name}! Lại ${v.food[2]} như lần trước không con?`,
    `Hello again! Would you like ${v.food[1]} again, like last time?`, `Con lại đến rồi! Lại ${v.food[2]} như lần trước không con?`];
}
// (Round U, owner 11 Oct: price pictures and change) what the child hands over for a price (in xu): the next 5 or 10
// up, if the purse has it; the seller counts the change on from the price, one coin at a time, out loud
export const paidFor = (price, purse) => { const up = price <= 5 ? 5 : Math.ceil(price / 10) * 10; return purse >= up ? up : price; };
export function changeLine(price, paid) {
  const ch = paid - price; if (ch <= 0) return null;
  const steps = []; for (let i = 1; i <= ch; i++) steps.push(fmt(price + i));
  return [`That is ${fmt(price)}. You gave me ${fmt(paid)}. Let's count your change: ${steps.join(', ')}. Your change is ${fmt(ch)}!`,
    `Giá là ${fmt(price)}. Con đưa ${fmt(paid)}. Mình đếm tiền thối nhé: ${steps.join(', ')}. Tiền thối của con là ${fmt(ch)}!`];
}

// pay (or get it as a gift when the purse is empty), put it in the bag, then ask: eat now or keep it?
export async function buyFood(G, h, v, gift = ['Here, this one is a gift!', 'Thôi, cái này tặng con đó!']) {
  const p = h.profile, price = v.food[3];
  let change = null;
  // (batch rollout) counting the change comes with the price pictures (Studio switch 'priceTags'); both are kept by a child
  // who bought while they were on
  const tags = keptOn('priceTags', [p]), regular = keptOn('sellersRemember', [p]);
  if (farm.coins >= price) { change = tags ? changeLine(price, paidFor(price, farm.coins)) : null; farm.coins -= price; saveFarm(); } else say(gift[0], gift[1]);
  SFX.chime(); if (tags) markTried(p, 'priceTags'); if (regular) markTried(p, 'sellersRemember');
  p.bought = p.bought || {}; p.bought[v.id] = (p.bought[v.id] || 0) + 1;
  p.regulars = p.regulars || {}; p.regulars[v.id] = (p.regulars[v.id] || 0) + 1; G.save();
  const k = await dialog(v.name, [...(change ? [change] : []), [`Here you are: ${v.food[1]}! I put it in your bag.`, `Của con đây: ${v.food[2]}! Bỏ vào túi cho con rồi nhé.`]],
    [['😋 Eat it now', '😋 Ăn liền'], ['🎒 Keep it in my bag', '🎒 Để dành trong túi']]);
  if (k === 0) return eatSnack(G, h, v.id);
  G.toast && G.toast(h, `🎒 +1 ${v.food[0]} ${T(v.food[1], v.food[2])}`);
  say('Saved for later!', 'Để dành ăn sau nhé!');
}

// eat one from the bag. quiet: from the backpack screen (a toast instead of the big reward card)
export async function eatSnack(G, h, id, quiet = false) {
  const p = h.profile, v = snackOf(id); if (!v || !(p.bought && p.bought[id] > 0)) return;
  p.bought[id]--; if (p.bought[id] <= 0) delete p.bought[id];
  h.bonusStamina = Math.max(h.bonusStamina || 0, 1); h.stamina = (p.staminaMax || 1) + h.bonusStamina; h.exhausted = false; h.cheerT = 1.2; // one extra stamina wheel
  p.tasted = p.tasted || {}; const first = !p.tasted[id]; p.tasted[id] = true; G.save();
  const sub = first ? T('A new taste for your food passport! Full of energy.', 'Món mới trong hộ chiếu ẩm thực! Tràn đầy năng lượng.') : T('Full of energy!', 'Tràn đầy năng lượng!');
  if (quiet) { SFX.ok(); say(`Yum yum! ${v.food[1]}!`, `Măm măm! ${v.food[2]}!`); G.toast && G.toast(h, `${v.food[0]} ${sub}`); return; }
  await reward(v.food[0], T(`Yum, ${v.food[1]}!`, `Ngon quá, ${v.food[2]}!`), sub);
}
