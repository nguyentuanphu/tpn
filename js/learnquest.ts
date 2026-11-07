// (v1.08b games, owner's plan 3 Nov 2026 AEDT; owner 5 Nov 2026 AEDT: "9 bước và một huy hiệu") the learning quests:
//   journeys   each subject of Học vui (js/content/learnpaths.ts) is a journey of 9 steps, each a game of that subject
//              from the easiest up, at the child's level (under-5s only get games made for them); a step won gives its
//              sticker (the sticker book's "Learning" pages), the 9th the subject's badge
//   today      one learning step a day: the next step of one unfinished journey, a different subject each day; it is
//              shown in the daily adventure's window, marked on its card in the Play hub and starred on the Simple screen
// Kept in profile.learnPath { subject: steps done } and profile.learnBadges { subject: when }.
import { LEARN_PATHS, STEPS, LEARN_LINES, stepSticker, badgeIcon, type LearnPath } from './content/learnpaths.js';
import { gamesIn } from './content/activities.js';
import { isSecondGame } from './content/secondset.js';
import { GAMES } from './games/registry.js';
import { events } from './core/events.js';
import { id as makeId } from './core/ids.js';
import { give } from './stickers.js';
import { saveProfiles } from './state.js';
import { say } from './voice.js';
import { T } from './i18n.js';
import { pic } from './art.js';
import { esc } from './util.js';

const obj = (o: unknown): Record<string, number> => (o && typeof o === 'object' ? o : {}) as Record<string, number>;
/** the 9 steps of a journey for this child: its subject's games, made for the child's age, easiest first (the first
 *  set before the games held as a second set); a subject with fewer games comes round again */
export function stepsOf(p, L: LearnPath): string[] {
  const little = p && p.age !== 'big';
  const list = L.areas.flatMap(a => gamesIn(GAMES, a, little)).sort((x, y) => Number(isSecondGame(x.id)) - Number(isSecondGame(y.id)) || x.ageMin - y.ageMin || x.level - y.level || (x.id < y.id ? -1 : 1)).map(g => g.id);
  return list.length ? Array.from({ length: STEPS }, (_, k) => list[k % list.length]) : [];
}
export const doneOf = (p, L: LearnPath) => Math.min(STEPS, +obj(p && p.learnPath)[L.key] || 0);
/** the next step's game of a journey, or null when it is finished */
export const nextOf = (p, L: LearnPath) => { const d = doneOf(p, L); return d >= STEPS ? null : stepsOf(p, L)[d] || null; };
const dayIndex = (d = new Date()) => Math.floor((+d - d.getTimezoneOffset() * 6e4) / 864e5);
/** today's learning step: { path, id } (one unfinished journey, a different subject each day), or null */
export function todayStep(p, d = new Date()) {
  const open = LEARN_PATHS.filter(L => nextOf(p, L)); if (!open.length) return null;
  const L = open[dayIndex(d) % open.length]; return { path: L, id: nextOf(p, L) };
}
export const isTodayStep = (p, id: string) => { const t = p && todayStep(p); return !!t && t.id === id; };

/** a game won: every journey whose next step it is moves on (a sticker; the 9th step also the badge) */
export function stepWon(p, id: string) {
  if (!p) return [];
  const out: { path: LearnPath; n: number; badge: boolean }[] = [];
  for (const L of LEARN_PATHS) {
    if (nextOf(p, L) !== id) continue;
    p.learnPath = obj(p.learnPath); const n = doneOf(p, L) + 1; p.learnPath[L.key] = n;
    give(stepSticker(L.key, n), p, { from: 'learn' });
    const badge = n >= STEPS; if (badge) { p.learnBadges = obj(p.learnBadges); p.learnBadges[L.key] = Date.now(); }
    out.push({ path: L, n, badge });
  }
  if (out.length) { saveProfiles(); const last = out[out.length - 1]; if (last.badge) say(...last.path.done); else say(...LEARN_LINES.step); }
  return out;
}

/** the journeys at the top of the Học vui tab: each subject's 9 steps (done ones filled), its badge, its next game */
// (v1.08d polish, Release's part 4) on a phone the 8 rows filled the first screen: they fold into one row that opens the
// list, so the corners show first; on a tablet and a computer the list is open. A child's open or close is remembered.
const lqOpen: Record<string, boolean> = {}; // (by kind of screen: a phone's choice does not fold a tablet)
const lqWide = () => typeof innerWidth === 'number' && innerWidth >= 700;
export function journeysHTML(p): string {
  const open = lqOpen[String(lqWide())] ?? lqWide(), all = LEARN_PATHS.reduce((a, L) => a + doneOf(p, L), 0);
  return `<details class="lq-journeys" ${open ? 'open' : ''}><summary class="hubarea lq-sum">${pic('lp:tab')} <b>${esc(T(...LEARN_LINES.title))}</b><small>${all}/${LEARN_PATHS.length * STEPS}</small></summary><div class="lq-rows">${LEARN_PATHS.map(L => {
    const d = doneOf(p, L), next = nextOf(p, L);
    return `<button class="lq-row" style="--lq:${L.color}" ${next ? `data-lqplay="${next}"` : 'disabled'} aria-label="${esc(T(...L.name))}: ${d}/${STEPS}"><b>${esc(T(...L.name))}</b><span class="lq-steps">${Array.from({ length: STEPS }, (_, k) => `<i class="${k < d ? 'done' : k === d ? 'now' : ''}"></i>`).join('')}</span><span class="lq-badge${d >= STEPS ? ' got' : ''}">${pic(badgeIcon(L.key))}</span></button>`;
  }).join('')}</div></details>`;
}
/** today's learning step as a row of the daily adventure's window */
export function adventureRowHTML(p): string {
  const t = todayStep(p); if (!t || !GAMES[t.id]) return '';
  return `<section class="lq-today"><span class="lq-ic">${pic('lp:mark')}</span><span class="lq-tx"><b>${esc(T(...LEARN_LINES.today))}</b><small>${esc(T(...t.path.name))} · ${esc(GAMES[t.id].name())}</small></span><button class="lq-go" data-lqplay="${t.id}" aria-label="${esc(GAMES[t.id].name())}">${pic(GAMES[t.id].icon)}</button></section>`;
}

let styled = false;
export function style() {
  if (styled || typeof document === 'undefined') return; styled = true;
  document.addEventListener('toggle', e => { const d = e.target as HTMLDetailsElement; if (d && d.classList && d.classList.contains('lq-journeys')) lqOpen[String(lqWide())] = d.open; }, true);
  const s = document.createElement('style'); s.textContent = `
.lq-journeys { margin: 0 0 10px; }
.lq-sum { display: flex; align-items: center; gap: 8px; min-height: 56px; padding: 4px 12px; border-radius: 16px; background: #fff8e0; border: 3px solid #ffd23f; cursor: pointer; list-style: none; font: 800 18px var(--font, sans-serif); color: #3b2a4f; }
.lq-sum::-webkit-details-marker { display: none; }
.lq-sum::after { content: ''; margin-left: auto; width: 12px; height: 12px; border-right: 4px solid #3b2a4f; border-bottom: 4px solid #3b2a4f; transform: rotate(45deg); transition: transform .2s; }
.lq-journeys[open] > .lq-sum::after { transform: rotate(-135deg); }
.lq-sum .art { width: 40px; height: 40px; } .lq-sum small { font-size: 16px; font-weight: 700; }
.lq-journeys[open] > .lq-rows { margin-top: 8px; }
.lq-rows { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 8px; }
.lq-row { display: flex; align-items: center; gap: 8px; min-height: 56px; padding: 6px 10px; border-radius: 16px; border: 3px solid var(--lq); background: #fff; font: 800 16px var(--font, sans-serif); color: #3b2a4f; text-align: left; }
.lq-row b { flex: 1 1 auto; min-width: 0; }
.lq-steps { display: flex; gap: 3px; flex: none; }
.lq-steps i { width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--lq); background: #fff; }
.lq-steps i.done { background: var(--lq); }
.lq-steps i.now { box-shadow: 0 0 0 3px #ffd23f; }
.lq-badge { width: 40px; height: 40px; flex: none; opacity: .35; filter: grayscale(1); }
.lq-badge.got { opacity: 1; filter: none; }
.lq-badge .art { width: 100%; height: 100%; }
.lq-today { display: flex; align-items: center; gap: 10px; margin: 8px 0; padding: 8px 12px; border-radius: 18px; background: #eef6ff; border: 2px dashed #3b6fe0; }
.lq-today .lq-ic .art { width: 40px; height: 40px; }
.lq-today .lq-tx { flex: 1; display: flex; flex-direction: column; font: 800 16px var(--font, sans-serif); color: #3b2a4f; }
.lq-today .lq-tx small { font-size: 16px; font-weight: 700; }
.lq-go { width: 64px; height: 64px; border-radius: 18px; border: 3px solid #3b2a4f; background: #ffd23f; padding: 6px; }
.lq-go .art { width: 100%; height: 100%; }
.hquest, .sp-quest { position: absolute; left: -6px; top: -6px; width: 34px; height: 34px; pointer-events: none; z-index: 2; }
.hquest .art, .sp-quest .art { width: 100%; height: 100%; }
`; document.head.appendChild(s);
}

/** listen for wins in the valley (each hero's own journeys) */
export function installLearnQuest(G) {
  if (G.learnQuest) return G.learnQuest;
  style();
  events.on('ActivityCompleted', e => {
    if (!e || !e.result || !e.result.won) return;
    for (const h of G.heroes || []) {
      const pid = makeId('player', h.profile.id || 'guest'); if (e.players && !e.players.includes(pid)) continue;
      for (const id of Object.keys(GAMES)) if (makeId('game', id) === e.defId) { const r = stepWon(h.profile, id); if (r.length && G.huds && G.huds[h.i]) G.huds[h.i].toast(r.map(x => `${T(...x.path.name)}: ${x.n}/${STEPS}`).join(' · ')); break; }
    }
  });
  return (G.learnQuest = { journeysHTML, adventureRowHTML, isTodayStep, todayStep });
}
