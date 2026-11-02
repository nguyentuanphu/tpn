// (v1.08 english, owner's plan 3 Nov 2026 AEDT, docs/plans/v108-owner-batch-20261103.md part C) English mode: real
// English lessons for children learning English (most players are Vietnamese). A game opened from Học vui › Tiếng Anh
// (a link tile in the English corner) and every English game of its own (`english: true`, js/games/english.ts) plays
// in English, whatever the child's language: while it is open the game language is English and bilingual speech is
// off, so its words, voice and instructions are English. A small Vietnamese hint sits under the instruction line, and
// its speaker button says it with the Vietnamese voice. Closing the game puts the child's language back; the settings
// are always saved with the child's own language (js/state.ts langHold).
import { settings, langHold } from './state.js';
import { el, esc } from './util.js';
import { swapNames } from './i18n.js';
import { sayIn } from './voice.js';
import { pic } from './art.js';

// the game a child just chose in the English corner; "Play again" and another level keep it for that game, a game
// chosen anywhere else clears it
let mark: { id: string; t: number } | null = null;
const KEEP_MS = 3 * 60 * 1000;
export const markEnglish = (id: string | null) => { mark = id ? { id, t: Date.now() } : null; };
/** does this game open in English mode now? (its own `english` flag, or it was just chosen in the English corner) */
export function englishFor(id: string, def?: { english?: boolean }): boolean {
  if (def && def.english) return true;
  if (mark && mark.id === id && Date.now() - mark.t < KEEP_MS) { mark.t = Date.now(); return true; }
  mark = null; return false;
}
/** the game closed: a replay soon after stays in English mode */
export const keepEnglish = (id: string) => { if (mark && mark.id === id) mark.t = Date.now(); };
export const englishModeOn = () => !!langHold.lang;

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.gl-vihint { display: flex; align-items: center; gap: 8px; padding: 0 12px; flex-shrink: 0; position: relative; z-index: 1; min-height: 44px; }
.gl-vihint .gl-vihear { flex: none; width: 44px; height: 44px; border-radius: 50%; border: 2px solid #3b2a4f; background: #ffe9a8; padding: 4px; display: flex; align-items: center; justify-content: center; }
.gl-vihint .gl-vihear svg.art { width: 30px; height: 30px; }
.gl-vihint .gl-vitext { flex: 1; min-width: 0; font: 600 14px/1.25 var(--font, sans-serif); color: #6a4a7a; font-style: italic; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.gl-vihint .gl-vitext:empty::before { content: ''; }
.gl.little .gl-vihint .gl-vihear { width: 64px; height: 64px; }
.gl.pic-only .gl-vihint .gl-vitext { visibility: hidden; }
.gl-enbadge { display: inline-flex; align-items: center; gap: 4px; margin-left: 8px; padding: 2px 10px; border-radius: 999px; background: #3b6fe0; color: #fff; font: 800 12px/1.6 var(--font, sans-serif); vertical-align: middle; white-space: nowrap; }
.gl-enbadge svg.art { width: 18px; height: 18px; }
.gl-head .gl-enbadge { margin: 0 4px; flex: none; }
`));
}
/** the badge parents see on the English corner (and in an English-mode game's top bar) */
export function englishBadge(): string {
  style();
  // (shown in the child's own language: it is for parents choosing the corner)
  const vi = (langHold.lang || settings.lang) === 'vi';
  return `<span class="gl-enbadge">${pic('en:mode')}${esc(vi ? 'Chế độ tiếng Anh' : 'English mode')}</span>`;
}

/** switch a game layer to English mode; returns what puts everything back, and the hint line's setter */
export function enterEnglish(): { leave: () => void; hint: (layer: HTMLElement, vi: string) => void } {
  style();
  if (!langHold.lang) { langHold.lang = settings.lang || 'en'; langHold.bilingual = !!settings.bilingual; }
  settings.lang = 'en'; settings.bilingual = false;
  let row: HTMLElement | null = null, said = '';
  const hint = (layer: HTMLElement, vi: string) => {
    if (!row) {
      row = el('div', 'gl-vihint', `<button class="gl-vihear" aria-label="Nghe tiếng Việt">${pic('🔊')}</button><span class="gl-vitext" lang="vi"></span>`);
      const guide = layer.querySelector('.gl-guide'); if (guide) guide.after(row); else layer.appendChild(row);
      row.querySelector<HTMLButtonElement>('.gl-vihear').onclick = e => { e.stopPropagation(); if (said) sayIn('vi', said); };
    }
    said = vi ? swapNames(vi, 'vi') : '';
    row.querySelector('.gl-vitext').textContent = said;
  };
  return {
    hint,
    leave: () => {
      if (!langHold.lang) return;
      settings.lang = langHold.lang; settings.bilingual = langHold.bilingual;
      delete langHold.lang; delete langHold.bilingual;
    }
  };
}
