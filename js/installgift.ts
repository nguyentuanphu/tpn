// (v1.08b story, owner 3 Nov 2026 AEDT: docs/plans/links-rollout-install.md "A gift for installing on the home screen")
// The first time the game runs installed (display mode standalone), every child on the device gets once: the
// "Mũ Ngôi Nhà / Home hat" (our own drawing, js/avatar.ts), 100 coins and a sticker, told in English and Vietnamese.
// A child who plays on the installed game later gets it too, once. Nothing here asks a child to install: installing is
// the grown-up's job (the chip on the title screen and in Grown-ups).
import { isStandalone } from './install.js';
import { T } from './i18n.js';
import { say } from './voice.js';

export const GIFT_COINS = 100, GIFT_HAT = 'homehat';
export const GIFT_LINE: [string, string] = ['A present for playing from the home screen: the Home hat, 100 coins and a sticker!', 'Quà vì chơi từ màn hình chính: Mũ Ngôi Nhà, 100 đồng xu và một hình dán!'];
/** give the gift to this child if it never had it; true when given */
export function giveInstallGift(G, h): boolean {
  const p = h && h.profile; if (!p || p.installGift) return false;
  p.installGift = Date.now();
  p.owned = p.owned || {}; p.owned.hats = Array.isArray(p.owned.hats) ? p.owned.hats : [];
  if (!p.owned.hats.includes(GIFT_HAT)) p.owned.hats.push(GIFT_HAT);
  G.addCoins && G.addCoins(GIFT_COINS);
  G.giveSticker && G.giveSticker(p);
  G.save && G.save();
  say(...GIFT_LINE);
  G.reward && G.reward('🏠', T('The Home hat is yours!', 'Mũ Ngôi Nhà là của con!'), T('+100 coins and a sticker. Find the hat in your Backpack.', '+100 đồng xu và một hình dán. Mũ ở trong Ba lô nhé.'));
  return true;
}
/** watches for a child playing on the installed game (every 3 s; waits while the game is paused) */
export function mountInstallGift(G, standalone: () => boolean = isStandalone) {
  const seen = new Map();
  const poll = () => {
    if (!standalone() || G.paused || !G.heroes || !G.heroes.length) return;
    for (const h of G.heroes) { const p = h.profile; if (!p || p.installGift) continue;
      if (!seen.has(p)) { seen.set(p, Date.now()); continue; }
      if (Date.now() - seen.get(p) > 5000) { giveInstallGift(G, h); return; } }
  };
  const t = setInterval(poll, 3000);
  G.installGift = { poll, give: h => giveInstallGift(G, h), stop: () => clearInterval(t) }; // (checks)
}
