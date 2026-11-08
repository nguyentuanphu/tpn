// (v1.08b story) The calendar's "what's new" parts, loaded when a calendar is first shown (PERF-001): in the pad's
// calendar tab "This week's new things", "Opens next week" and "Ending soon", and the Grown-ups "What's new" card, from
// the release calendar (js/content/releasecal.ts), the same list Studio, the website and Saturday's push read.
import { T } from '../i18n.js';
import { esc } from '../util.js';
import { pic } from '../art.js';
import { calendar, whatsNew, daysUntil, countLine, loadCalNames, type CalItem } from '../content/releasecal.js';
import { calMoves } from '../content/secondset.js';

// (v1.08b story) "This week's new things", "Opens next week" and "Ending soon", from the release calendar
// (js/content/releasecal.ts), the same list Studio, the website and Saturday's push read
// (owner, 5 Nov 2026 AEDT: shorter) one short line each, only when it has something: a label, then the things as small
// picture chips (a game goes to its place). Never "Nothing ..." lines.
const chip = (it: CalItem) => `<button class="fcal-new" data-cal="${esc(it.key)}"><span class="fi">${pic(it.icon)}</span><b>${esc(T(it.en, it.vi))}</b></button>`;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], dayEn = (d: string) => `${+d.slice(8)} ${MON[+d.slice(5, 7) - 1]}`;
export function whatsNewHTML(now = new Date()) {
  const W = whatsNew(calendar(calMoves()), now), next = W.nextWeek.length ? W.nextWeek : W.upcoming.slice(0, 3);
  const line = (h: string, list: CalItem[]) => list.length ? `<div class="fcal-line"><h3>${h}</h3>${list.slice(0, 6).map(chip).join('')}</div>` : '';
  return line(T('New this week', 'Mới tuần này'), W.thisWeek)
    + line(W.nextWeek.length ? T('Next week', 'Tuần sau') : next[0] ? T(`From ${dayEn(next[0].date)}`, `Từ ${+next[0].date.slice(8)}/${+next[0].date.slice(5, 7)}`) : '', next)
    + line(T('Ending soon', 'Sắp kết thúc'), W.endingSoon);
}

// (v1.08b story, owner 3 Nov 2026 AEDT) the "What's new" card at the top of Grown-ups: new this week, opening next week
// and ending soon (ending soon is told here and in the calendar tab only, never by a push)
export function grownupsNewsHTML(now = new Date()) {
  const W = whatsNew(calendar(calMoves()), now), next = W.nextWeek.length ? W.nextWeek : W.upcoming.slice(0, 3);
  const line = (label: string, list: CalItem[]) => list.length ? `<p><b>${label}</b> ${esc(T(...countLine(list)))}: ${list.slice(0, 3).map(it => esc(T(it.en, it.vi))).join(', ')}${list.length > 3 ? '…' : ''}</p>` : '';
  const body = line(T('This week:', 'Tuần này:'), W.thisWeek) + line(T(next === W.nextWeek ? 'Next week:' : 'Coming up:', next === W.nextWeek ? 'Tuần sau:' : 'Sắp tới:'), next) + line(T('Ending soon:', 'Sắp kết thúc:'), W.endingSoon);
  return body ? `<div class="g-news"><h3>${pic('📅')} ${T("What's new", 'Có gì mới')}</h3>${body}</div>` : '';
}

/** the calendar tab's place for the new things: filled once the names are here, then `wire` binds the taps */
export function fillNews(box: HTMLElement, wire: () => void) { loadCalNames().catch(() => { }).then(() => { box.innerHTML = whatsNewHTML(); wire(); }); }
/** the Grown-ups card: filled once the names are here (hidden when there is nothing to say) */
export function fillGrownups(el: HTMLElement) { loadCalNames().catch(() => { }).then(() => { const h = grownupsNewsHTML(); if (h) { el.outerHTML = h; } }); }
