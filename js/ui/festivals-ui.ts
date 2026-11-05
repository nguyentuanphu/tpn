// The festival calendar (split from js/ui.ts, v1.07).
import { T } from '../i18n.js';
import { say } from '../voice.js';
import { esc, $ } from '../util.js';
import { featureOn, festivalRule } from '../custom.js';
import { BUILDUP } from '../content/festcal.js';
import { pic } from '../art.js';
import { modal } from '../popups.js';
import { calendar, whatsNew, daysUntil, countLine, type CalItem } from '../content/releasecal.js';
import { calMoves } from '../content/secondset.js';
import { isHeld } from '../content/unlocks.js';
// ---------- Lịch lễ hội, the festival calendar (round R, owner) ----------
// Today's festival with its timetable (08:00 present, 15:00 festival game, 18:30 show; 17:30 for under-5s), the ones
// getting ready (decorations go up 3 weeks before), and the next ones with how many days to go. It is only a calendar: nothing
// to visit from it.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayLabel = d => T(`${d.getDate()} ${MONTHS[d.getMonth()]}`, `${d.getDate()}/${d.getMonth() + 1}`);
export function festCalendarHTML(game) {
  const F = game.festivals; if (!F || !F.upcoming) return '';
  const isNew = new Set(F.list().filter(f => f.isNew).map(f => f.id)), list = F.upcoming().map(n => ({ ...n, isNew: isNew.has(n.F.id) })), today = list.filter(n => n.on), soon = list.filter(n => !n.on).slice(0, 12), show = F.showTime();
  const SHOW = { fireworks: ['Fireworks', 'Pháo hoa'], lanterns: ['Lantern parade', 'Rước đèn'], parade: ['Parade', 'Diễu hành'], lights: ['Light show', 'Trình diễn ánh sáng'] };
  const plan = f => f.kind === 'quiet' ? `<li><b>${T('All day', 'Cả ngày')}</b> ${T('A quiet day of remembering', 'Một ngày yên lặng để tưởng nhớ')}</li>`
    : `<li><b>08:00</b> ${T('A present at the festival table', 'Nhận quà ở bàn lễ hội')}</li><li><b>15:00</b> ${T('The festival game', 'Trò chơi lễ hội')}</li>${f.show && f.show !== 'none' ? `<li><b>${show}</b> ${T(...SHOW[f.show])}</li>` : ''}`;
  const card = n => `<div class="fcal-today"><span class="fi">${pic(n.F.icon)}</span><div><b>${esc(T(n.F.en, n.F.vi))}</b><ul class="fplan">${plan(n.F)}</ul></div></div>`;
  // (r90, owner 23 Oct AEDT: "count down of when the decorations and game quests will start") each coming festival counts
  // down to its three steps: the decorations going up (3 weeks before; 3 days for a quiet day, or Studio's own build-up),
  // the five-object hunt in its last week (once the hunt is switched on), and the day itself with its adventure and game
  const days = (k: number) => k === 1 ? T('1 day', '1 ngày') : T(`${k} days`, `${k} ngày`);
  // (v1.08b story, owner 3 Nov 2026 AEDT, docs/plans/links-rollout-install.md "Calendar with start and end dates") each
  // festival is a timeline: decorations, the hunt, the day, the festival game (opens, put away until next year) and the
  // festival adventures, each with its start, its end and the days left; a step that is on now takes the child there
  const span = (a: Date, b: Date) => +a === +b ? dayLabel(a) : `${dayLabel(a)} – ${dayLabel(b)}`;
  const DAYMS = 864e5, at = (d: Date, k: number) => new Date(+d + k * DAYMS), today0 = new Date(new Date().toDateString());
  const row = n => { const gr = n.F.group === 'vn' ? 'vn' : n.F.group === 'au' ? 'au' : 'west', rule = festivalRule(n.F.id);
    const build = rule && rule.buildup >= 0 ? Math.min(60, rule.buildup) : BUILDUP[n.F.kind] || 3, deco = n.daysTo - build, ready = deco <= 0;
    const last = at(n.end, -1), hunt = n.F.kind === 'party' && (game.keep ? game.keep('festHunt') : featureOn('festHunt')) ? n.daysTo - 7 : null;
    const left = (from: number, end: Date) => from > 0 ? T(`in ${days(from)}`, `còn ${days(from)}`) : (k => k <= 0 ? T('last day', 'ngày cuối') : T(`${days(k)} left`, `còn ${days(k)} nữa`))(Math.round((+end - +today0) / DAYMS));
    const steps: [string, string, string, number, Date][] = [
      ['deco', T('Decorations', 'Trang trí'), span(at(n.start, -build), last), deco, last],
      ...(hunt == null ? [] : [['hunt', T('Festival hunt', 'Truy tìm lễ hội'), span(at(n.start, -7), last), hunt, last] as [string, string, string, number, Date]]),
      ['day', T('Festival day', 'Ngày lễ'), span(n.start, last), n.daysTo, last],
      ...(n.F.kind === 'quiet' ? [] : [['game', T('Festival game (then back next year)', 'Trò chơi lễ hội (rồi hẹn năm sau)'), span(at(n.start, -build), at(last, 3)), deco, at(last, 3)] as [string, string, string, number, Date],
        ['adv', T('Festival adventures', 'Phiêu lưu lễ hội'), span(n.start, last), n.daysTo, last] as [string, string, string, number, Date]])];
    const step = ([k, label, when, from, end]) => `<button class="fcal-step${from <= 0 ? ' on' : ''}" data-fly="${esc(n.F.id)}" data-step="${k}"><b>${esc(label)}</b><small>${esc(when)}</small><em>${esc(left(from, end))}</em></button>`;
    return `<div class="fcal-row ${gr}${ready ? ' ready' : ''}"><span class="fi">${pic(n.F.icon)}</span><b>${esc(T(n.F.en, n.F.vi))}${n.isNew ? ` <i class="newtag">${T('New', 'Mới')}</i>` : ''}</b><small>${dayLabel(n.start)}</small><div class="fcal-tl">${steps.map(step).join('')}</div></div>`; };
  return `${today.length ? `<h3>${T('Today', 'Hôm nay')}</h3>${today.map(card).join('')}` : ''}
    <h3>${T('Festivals coming up', 'Lễ hội sắp tới')}</h3><div class="fcal-list">${list.slice(0, 6).map(row).join('')}</div>
    ${whatsNewHTML()}`;
}

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
/** the taps on the calendar: a festival step that is on takes the child there; a new game goes to its place */
export function wireCalendar(root: HTMLElement, game, i: number, close: () => void) {
  root.querySelectorAll<HTMLElement>('[data-fly]').forEach(b => b.onclick = () => {
    if (b.classList.contains('on') && game.festivals && game.festivals.goTo && (close(), game.festivals.goTo(i, b.dataset.fly))) return;
    const F = game.festivals && game.festivals.visit; if (F) { close(); game.festivals.visit(i, b.dataset.fly); }
  });
  root.querySelectorAll<HTMLElement>('[data-cal]').forEach(b => b.onclick = () => {
    const [kind, id] = String(b.dataset.cal).split(':');
    if (kind === 'game' && game.goToGame && !isHeld(id, 'game')) { close(); game.goToGame(i, id); return; }
    say(b.querySelector('b')?.textContent || '', b.querySelector('b')?.textContent || '');
  });
}
export const CAL_TITLE = (): string => T("Calendar: festivals and what's new", 'Lịch: Lễ hội và Có gì mới');

// the festival calendar: only a calendar (which festival is when); decorations are set in Sparkle Studio by admins
export function openFestivals(game, i) {
  const m = modal('festpick', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>📅 ${CAL_TITLE()}</h2>${festCalendarHTML(game)}`);
  const done = () => { m.close(); game.paused = false; };
  m.querySelector('.x').onclick = done;
  wireCalendar(m, game, i || 0, done);
  say("Calendar: festivals and what's new", 'Lịch: Lễ hội và Có gì mới');
}

// (v1.08b story, owner 3 Nov 2026 AEDT) the "What's new" card at the top of Grown-ups: new this week, opening next week
// and ending soon (ending soon is told here and in the calendar tab only, never by a push)
export function grownupsNewsHTML(now = new Date()) {
  const W = whatsNew(calendar(calMoves()), now), next = W.nextWeek.length ? W.nextWeek : W.upcoming.slice(0, 3);
  const line = (label: string, list: CalItem[]) => list.length ? `<p><b>${label}</b> ${esc(T(...countLine(list)))}: ${list.slice(0, 3).map(it => esc(T(it.en, it.vi))).join(', ')}${list.length > 3 ? '…' : ''}</p>` : '';
  const body = line(T('This week:', 'Tuần này:'), W.thisWeek) + line(T(next === W.nextWeek ? 'Next week:' : 'Coming up:', next === W.nextWeek ? 'Tuần sau:' : 'Sắp tới:'), next) + line(T('Ending soon:', 'Sắp kết thúc:'), W.endingSoon);
  return body ? `<div class="g-news"><h3>${pic('📅')} ${T("What's new", 'Có gì mới')}</h3>${body}</div>` : '';
}
