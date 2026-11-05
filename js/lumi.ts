// (v1.08b quality) Lumi as the guide, the page side (the words are js/content/lumi.ts):
//   lumiSay(line)  a card with Lumi's face and her words at the foot of the screen, and her recorded voice
//   lumiWelcome(p) the first time a child opens the Simple screen; lumiNews(p) the week's news, once a week
// What a child has heard is kept in their profile (p.lumi = { met, news }), on this device only.
import { T } from './i18n.js';
import { el, esc } from './util.js';
import { say } from './voice.js';
import { pic } from './art.js';
import { saveProfiles } from './state.js';
import { LUMI_WELCOME, newsOfWeek, weekKey } from './content/lumi.js';
import { aestDate } from './content/parents.js';

type LumiState = { met?: number, news?: string };
type Kid = { lumi?: LumiState };
let hideT: ReturnType<typeof setTimeout> | undefined;
/** Lumi says one line: her card for a few seconds (it never takes a tap: the screen under it stays playable) and her voice */
export function lumiSay(line: [string, string], { quiet = false } = {}): HTMLElement {
  document.querySelector('.lumi-card')?.remove(); clearTimeout(hideT);
  const card = el('div', 'lumi-card', `<span class="lumi-face">${pic('lumi')}</span><p><b>Lumi</b> ${esc(T(line[0], line[1]))}</p>`);
  card.setAttribute('role', 'status');
  document.body.appendChild(card);
  if (!quiet) say(line[0], line[1]);
  hideT = setTimeout(() => card.remove(), 6500);
  return card;
}
const state = (p: Kid): LumiState => (p.lumi = p.lumi && typeof p.lumi === 'object' ? p.lumi : {});
/** a new child meets Lumi: her welcome, once */
export function lumiWelcome(p: Kid): boolean {
  const s = state(p); if (s.met) return false;
  s.met = Date.now(); s.news = weekKey(aestDate()); saveProfiles();   // (the welcome is this week's hello: the news comes next week)
  lumiSay(LUMI_WELCOME[0]); setTimeout(() => { if (document.querySelector('.lumi-card')) lumiSay(LUMI_WELCOME[1]); }, 4200);
  return true;
}
/** the week's news, once a week for each child */
export function lumiNews(p: Kid, date = aestDate()): boolean {
  const s = state(p), k = weekKey(date); if (s.news === k) return false;
  s.news = k; saveProfiles(); lumiSay(newsOfWeek(date)); return true;
}
