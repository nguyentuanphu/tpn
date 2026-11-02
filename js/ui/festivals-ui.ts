// The festival calendar (split from js/ui.ts, v1.07).
import { T } from '../i18n.js';
import { say } from '../voice.js';
import { esc, $ } from '../util.js';
import { featureOn, festivalRule } from '../custom.js';
import { BUILDUP } from '../content/festcal.js';
import { pic } from '../art.js';
import { modal } from '../popups.js';
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
  const row = n => { const gr = n.F.group === 'vn' ? 'vn' : n.F.group === 'au' ? 'au' : 'west', rule = festivalRule(n.F.id);
    const build = rule && rule.buildup >= 0 ? Math.min(60, rule.buildup) : BUILDUP[n.F.kind] || 3, deco = n.daysTo - build, ready = deco <= 0;
    const hunt = n.F.kind === 'party' && (game.keep ? game.keep('festHunt') : featureOn('festHunt')) ? n.daysTo - 7 : null;
    const steps = [ready ? T('Decorations up now', 'Đã trang trí') : T(`Decorations in ${days(deco)}`, `Trang trí sau ${days(deco)}`),
      hunt == null ? '' : hunt > 0 ? T(`Festival hunt in ${days(hunt)}`, `Truy tìm lễ hội sau ${days(hunt)}`) : T('Festival hunt on now', 'Đang truy tìm lễ hội'),
      n.daysTo === 1 ? T('Festival day tomorrow', 'Ngày lễ là ngày mai') : T(`Festival day in ${days(n.daysTo)}`, `Ngày lễ sau ${days(n.daysTo)}`)].filter(Boolean);
    return `<div class="fcal-row ${gr}${ready ? ' ready' : ''}"><span class="fi">${pic(n.F.icon)}</span><b>${esc(T(n.F.en, n.F.vi))}${n.isNew ? ` <i class="newtag">${T('New', 'Mới')}</i>` : ''}</b><small>${dayLabel(n.start)}</small><em class="fcal-cd">${steps.map(x => `<span>${esc(x)}</span>`).join('')}</em></div>`; };
  return `${today.length ? `<h3>${T('Today', 'Hôm nay')}</h3>${today.map(card).join('')}` : ''}
    <h3>${T('Coming up', 'Sắp tới')}</h3><div class="fcal-list">${soon.map(row).join('')}</div>
    <p class="note">${T('This is the festival calendar: it shows which festival is when.', 'Đây là lịch lễ hội: lễ hội nào vào ngày nào.')}</p>`;
}

// the festival calendar: only a calendar (which festival is when); decorations are set in Sparkle Studio by admins
export function openFestivals(game, i) {
  const m = modal('festpick', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>📅 ${T('Festival calendar', 'Lịch lễ hội')}</h2>${festCalendarHTML(game)}`);
  const done = () => { m.close(); game.paused = false; };
  m.querySelector('.x').onclick = done;
  say('Festival calendar', 'Lịch lễ hội');
}
