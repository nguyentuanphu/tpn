// The instruction words stay synchronous for offline villager replies. Rendering loads on demand.
import { T } from './i18n.js';
import { GAMES } from './games/registry.js';
import type { HowToOptions } from './howto-registry.js';
export { HOWTO } from './howto-registry.js';
// (v1.08 fix, check fivescreensfilms) the games from China and India have their own words: their guide films stopped
// with a page error at the title card
const FLAG_WORDS = { au: ['From Australia', 'Từ nước Úc'], vn: ['From Vietnam', 'Từ Việt Nam'], both: ['From Vietnam & Australia', 'Từ Việt Nam và Úc'], cn: ['From China', 'Từ Trung Quốc'], in: ['From India', 'Từ Ấn Độ'] };
export const originLabel = id => { const o = GAMES[id] && GAMES[id].origin, w = o && FLAG_WORDS[o]; return w ? T(w[0], w[1]) : ''; };
let request = 0;
export async function openHowTo(id, options: HowToOptions = {}) {
  const ticket = ++request;
  try {
    await GAMES[id]?.load?.();
    const m = await import('./howto-player.js');
    if (ticket === request) return m.openHowTo(id, options);
  } catch (e) { window.svModuleGone?.(e); options.onClose?.(); }
}
