// (v1.08b quality, owner's pop-up 3 Nov 2026 AEDT) "Chơi cùng bố mẹ / Play with Mum and Dad" in Grown-ups: games two
// people can play on one device, taking turns on the same screen, each with a short guide for the grown-up
// (js/content/lumi.ts PLAY_TOGETHER, TOGETHER_GUIDE). Play opens the game for the first child.
import { T } from './i18n.js';
import { esc } from './util.js';
import { pic } from './art.js';
import { SFX } from './audio.js';
import { GAMES, canStartGame } from './games/frame.js';
import { PLAY_TOGETHER, TOGETHER_GUIDE } from './content/lumi.js';

/** the games of the list that are switched on here */
export const togetherGames = () => PLAY_TOGETHER.filter(x => GAMES[x.id] && canStartGame(x.id));
export function togetherHTML(open: boolean): string {
  const list = togetherGames();
  return `<details class="gsec together" data-sec="together" ${open ? 'open' : ''}><summary><span class="gi">${pic('lumi:together')}</span><b>${T('Play with Mum and Dad', 'Chơi cùng bố mẹ')}</b></summary><div class="gbody">
    <ul class="pt-guide">${TOGETHER_GUIDE.map(([en, vi]) => `<li>${esc(T(en, vi))}</li>`).join('')}</ul>
    <div class="pt-list">${list.map(x => `<div class="pt-row"><span class="pt-ic">${pic(GAMES[x.id].icon)}</span><div class="pt-t"><b>${esc(GAMES[x.id].name())}</b><br><small>${esc(T(...x.guide))}</small></div><button class="btn pt-play" data-together="${x.id}">${T('Play', 'Chơi')}</button></div>`).join('') || `<p class="note">${T('None of these games is switched on yet.', 'Chưa có trò nào trong số này được bật.')}</p>`}</div>
  </div></details>`;
}
export function bindTogether(card: Element, close: () => void) {
  card.querySelectorAll<HTMLElement>('[data-together]').forEach(b => b.onclick = () => {
    const G = window.__sv as { heroes?: unknown[], playGame?: (i: number, id: string, source: string) => void } | undefined;
    SFX.tap(); if (!G?.heroes?.length || !G.playGame) return;
    close(); G.playGame(0, b.dataset.together || '', 'hub');
  });
}
