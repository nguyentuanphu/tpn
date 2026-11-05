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
const calItem = (it: CalItem, when: string) => `<button class="fcal-new" data-cal="${esc(it.key)}"><span class="fi">${pic(it.icon)}</span><b>${esc(T(it.en, it.vi))}</b><small>${esc(when)}</small></button>`;
export function whatsNewHTML(now = new Date()) {
  const W = whatsNew(calendar(calMoves()), now);
  const opened = (it: CalItem) => T('Open now', 'Đã mở');
  const opens = (it: CalItem) => { const k = daysUntil(it.date, now); return k <= 0 ? T('Open now', 'Đã mở') : k === 1 ? T('Opens tomorrow', 'Mở ngày mai') : T(`Opens in ${k} days`, `Mở sau ${k} ngày`); };
  const ends = (it: CalItem) => { const k = daysUntil(it.end || it.date, now); return k <= 0 ? T('Last day', 'Ngày cuối') : T(`${k} days left`, `Còn ${k} ngày`); };
  const part = (h: string, list: CalItem[], f: (it: CalItem) => string, none: string) => `<h3>${h}</h3>${list.length ? `<div class="fcal-news">${list.slice(0, 8).map(it => calItem(it, f(it))).join('')}</div>` : `<p class="note">${none}</p>`}`;
  return part(T("This week's new things", 'Có gì mới tuần này'), W.thisWeek, opened, T('Nothing new yet this week.', 'Tuần này chưa có gì mới.'))
    + part(T('Opens next week', 'Tuần sau mở'), W.nextWeek.length ? W.nextWeek : W.upcoming.slice(0, 4), opens, T('Nothing planned yet.', 'Chưa có gì.'))
    + part(T('Ending soon', 'Sắp kết thúc'), W.endingSoon, ends, T('Nothing ends this week.', 'Tuần này không có gì kết thúc.'));
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
