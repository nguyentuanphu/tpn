// The festival calendar (split from js/ui.ts, v1.07).
import { T } from '../i18n.js';
import { say } from '../voice.js';
import { esc, $ } from '../util.js';
import { featureOn, festivalRule } from '../custom.js';
import { BUILDUP } from '../content/festcal.js';
import { pic } from '../art.js';
import { modal } from '../popups.js';
import { isHeld } from '../content/unlocks.js';
// (v1.08b story) the calendar's "what's new" parts and their names load when a calendar is first shown, not with the start
// (PERF-001): js/ui/calendar-news.ts fills the place kept for them
const news = () => import('./calendar-news.js');
// ---------- Lịch lễ hội, the festival calendar (round R, owner) ----------
// Today's festival with its timetable (08:00 present, 15:00 festival game, 18:30 show; 17:30 for under-5s), the ones
// getting ready (decorations go up 3 weeks before), and the next ones with how many days to go. It is only a calendar: nothing
// to visit from it.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayLabel = d => T(`${d.getDate()} ${MONTHS[d.getMonth()]}`, `${d.getDate()}/${d.getMonth() + 1}`);
export function festCalendarHTML(game) {
  const F = game.festivals; if (!F || !F.upcoming) return '';
  const isNew = new Set(F.list().filter(f => f.isNew).map(f => f.id)), list = F.upcoming().map(n => ({ ...n, isNew: isNew.has(n.F.id) })), show = F.showTime();
  const SHOW = { fireworks: ['Fireworks', 'Pháo hoa'], lanterns: ['Lantern parade', 'Rước đèn'], parade: ['Parade', 'Diễu hành'], lights: ['Light show', 'Trình diễn ánh sáng'] };
  const days = (k: number) => k === 1 ? T('1 day', '1 ngày') : T(`${k} days`, `${k} ngày`);
  // (v1.08b story; owner 5 Nov 2026 AEDT: "the festivals descriptions look too long which may confuse the eyes") one
  // compact row per festival: its picture, name, date and ONE status chip (what runs now, or the next step that starts),
  // and a thin bar with a dot per step and a marker for today. Tapping the row opens the details (each step with its
  // picture, start - end and days left; a step that is on takes the child there), one row open at a time. The festival
  // that is on comes first; the next 4 show, "See more" opens the rest.
  const DAYMS = 864e5, at = (d: Date, k: number) => new Date(+d + k * DAYMS), today0 = new Date(new Date().toDateString());
  const span = (a: Date, b: Date) => +a === +b ? dayLabel(a) : `${dayLabel(a)} – ${dayLabel(b)}`;
  const left = (from: number, end: Date) => from > 0 ? T(`in ${days(from)}`, `còn ${days(from)}`) : (k => k <= 0 ? T('last day', 'ngày cuối') : T(`${days(k)} left`, `còn ${days(k)}`))(Math.round((+end - +today0) / DAYMS));
  const row = (n, k: number) => { const gr = n.F.group === 'vn' ? 'vn' : n.F.group === 'au' ? 'au' : 'west', rule = festivalRule(n.F.id);
    const build = rule && rule.buildup >= 0 ? Math.min(60, rule.buildup) : BUILDUP[n.F.kind] || 3, deco = n.daysTo - build;
    const last = at(n.end, -1), gameEnd = at(last, 3), decoStart = at(n.start, -build), hunt = n.F.kind === 'party' && (game.keep ? game.keep('festHunt') : featureOn('festHunt')) ? n.daysTo - 7 : null;
    type Step = { k: string; icon: string; label: string; a: Date; b: Date; from: number };
    const steps: Step[] = [
      { k: 'deco', icon: '🎀', label: T('Decorations', 'Trang trí'), a: decoStart, b: last, from: deco },
      ...(hunt == null ? [] : [{ k: 'hunt', icon: '🔍', label: T('Festival hunt', 'Săn đồ'), a: at(n.start, -7), b: last, from: hunt }]),
      { k: 'day', icon: n.F.icon, label: T('Festival day', 'Ngày lễ'), a: n.start, b: last, from: n.daysTo },
      ...(n.F.kind === 'quiet' ? [] : [{ k: 'game', icon: '🎮', label: T('Festival game', 'Trò chơi lễ hội'), a: decoStart, b: gameEnd, from: deco }])];
    // the one chip: on today; or what runs now (hunt, then the festival game); or the next step that starts
    const chip = n.on ? T(`On now · ${days(Math.max(1, Math.round((+last - +today0) / DAYMS) + 1))} left`, `Đang diễn ra · còn ${days(Math.max(1, Math.round((+last - +today0) / DAYMS) + 1))}`)
      : hunt != null && hunt <= 0 ? T(`Hunt until ${dayLabel(last)}`, `Săn đồ đến ${dayLabel(last)}`)
      : deco <= 0 ? (n.F.kind === 'quiet' ? T(`Day in ${days(n.daysTo)}`, `Còn ${days(n.daysTo)}`) : T(`Festival game until ${dayLabel(gameEnd)}`, `Trò chơi lễ hội đến ${dayLabel(gameEnd)}`))
      : T(`Decorations from ${dayLabel(decoStart)}`, `Trang trí từ ${dayLabel(decoStart)}`);
    // the bar: from the decorations to the festival game's end; a dot per step, a marker for today
    const t0 = +decoStart, t1 = Math.max(+gameEnd, +last) + DAYMS, pos = (d: Date) => Math.max(0, Math.min(100, (+d - t0) / (t1 - t0) * 100)).toFixed(1);
    const bar = `<span class="fcal-bar" aria-hidden="true"><i class="fcal-fill" style="width:${pos(today0)}%"></i>${steps.map(s => `<i class="fcal-dot${s.from <= 0 ? ' on' : ''}" style="left:${pos(s.k === 'game' ? gameEnd : s.a)}%"></i>`).join('')}${+today0 >= t0 && +today0 <= t1 ? `<i class="fcal-now" style="left:${pos(today0)}%"></i>` : ''}</span>`;
    const plan = n.on && n.F.kind !== 'quiet' ? `<p class="fcal-plan">${T('08:00 present · 15:00 game', '08:00 nhận quà · 15:00 trò chơi')}${n.F.show && n.F.show !== 'none' ? ` · ${show} ${T(...SHOW[n.F.show])}` : ''}</p>` : '';
    const det = steps.map(s => `<button class="fcal-step${s.from <= 0 ? ' on' : ''}" data-fly="${esc(n.F.id)}" data-step="${s.k}"><span class="fi">${pic(s.icon)}</span><b>${esc(s.label)}: ${esc(span(s.a, s.b))}</b><em>${esc(left(s.from, s.b))}${s.k === 'game' ? ' · ' + esc(T('Back next year', 'Quay lại năm sau')) : ''}</em></button>`).join('');
    return `<div class="fcal-row ${gr}${n.on ? ' on' : ''}${k >= 4 ? ' later' : ''}" data-festid="${esc(n.F.id)}"><button class="fcal-head" aria-expanded="false"><span class="fi">${pic(n.F.icon)}</span><span class="fcal-name"><b>${esc(T(n.F.en, n.F.vi))}${n.isNew ? ` <i class="newtag">${T('New', 'Mới')}</i>` : ''}</b>${bar}</span><small>${dayLabel(n.start)}</small><em class="fcal-chip">${esc(chip)}</em></button><div class="fcal-det" hidden>${plan}${det}</div></div>`; };
  const ordered = [...list.filter(n => n.on), ...list.filter(n => !n.on)].slice(0, 12);
  return `<div class="fcal-list">${ordered.map(row).join('')}</div>${ordered.length > 4 ? `<button class="btn fcal-more" aria-expanded="false">${T('See more', 'Xem thêm')}</button>` : ''}
    <div class="fcal-whatsnew"></div>`;
}

/** the taps on the calendar: a festival step that is on takes the child there; a new game goes to its place */
export function wireCalendar(root: HTMLElement, game, i: number, close: () => void) {
  root.querySelectorAll<HTMLElement>('.fcal-head').forEach(h => h.onclick = () => { const row = h.parentElement!, open = h.getAttribute('aria-expanded') !== 'true';
    root.querySelectorAll<HTMLElement>('.fcal-head[aria-expanded="true"]').forEach(o => { o.setAttribute('aria-expanded', 'false'); (o.nextElementSibling as HTMLElement).hidden = true; });
    if (open) { h.setAttribute('aria-expanded', 'true'); (row.querySelector('.fcal-det') as HTMLElement).hidden = false; } });
  const more = root.querySelector<HTMLElement>('.fcal-more');
  if (more) more.onclick = () => { const open = more.getAttribute('aria-expanded') !== 'true'; more.setAttribute('aria-expanded', String(open)); root.querySelector('.fcal-list')!.classList.toggle('all', open); more.textContent = open ? T('See less', 'Thu gọn') : T('See more', 'Xem thêm'); };
  root.querySelectorAll<HTMLElement>('[data-fly]').forEach(b => b.onclick = () => {
    if (b.classList.contains('on') && game.festivals && game.festivals.goTo && (close(), game.festivals.goTo(i, b.dataset.fly))) return;
    const F = game.festivals && game.festivals.visit; if (F) { close(); game.festivals.visit(i, b.dataset.fly); }
  });
  const box = root.querySelector<HTMLElement>('.fcal-whatsnew');
  if (box && !box.dataset.filled) { box.dataset.filled = '1'; news().then(N => N.fillNews(box, () => wireCalendar(root, game, i, close))).catch(() => { }); }
  root.querySelectorAll<HTMLElement>('[data-cal]').forEach(b => b.onclick = () => {
    const [kind, id] = String(b.dataset.cal).split(':');
    if (kind === 'game' && game.goToGame && !isHeld(id, 'game')) { close(); game.goToGame(i, id); return; }
    say(b.querySelector('b')?.textContent || '', b.querySelector('b')?.textContent || '');
  });
}
export const CAL_TITLE = (): string => T("Calendar: festivals and what's new", 'Lịch: Lễ hội và Có gì mới');

// the festival calendar: only a calendar (which festival is when); decorations are set in Sparkle Studio by admins
export function openFestivals(game, i) {
  const html = () => `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>📅 ${CAL_TITLE()}</h2>${festCalendarHTML(game)}`;
  const m = modal('festpick', html());
  const done = () => { m.close(); game.paused = false; };
  const wire = () => { (m.querySelector('.x') as HTMLElement).onclick = done; wireCalendar(m, game, i || 0, done); };
  wire();
  say("Calendar: festivals and what's new", 'Lịch: Lễ hội và Có gì mới');
}

// (v1.08b story) the Grown-ups "What's new" card: a place kept for it, filled by js/ui/calendar-news.ts
export const grownupsNewsHTML = (): string => '<div class="g-news" hidden></div>';
export const fillGrownupsNews = (root: ParentNode): void => { const el = root.querySelector<HTMLElement>('.g-news'); if (el) news().then(N => N.fillGrownups(el)).catch(() => { }); };
