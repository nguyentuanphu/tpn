// (v1.08b story, owner 3 Nov 2026 AEDT pop-up: docs/plans/links-rollout-install.md "The website: what's new and coming
// up") Two parts of the family website read the game's own release calendar (js/content/releasecal.ts, with the owner's
// moves from /api/live) and the festival dates already on the page (made from the game's festival calendar), so the
// website and the game always agree (WEBSITE-RULES rule 7, one release source):
// - a strip just under the hero picture: Happening now, New this week, Coming up;
// - a Calendar part inside Discover (after its "start here" cards; it extends the festival overview): festivals, new lantern chapters, new games and stories,
//   and festival games with the days they come back.
// The four destinations stay as they are (rule 1). English and Vietnamese follow the page's language button.
import { calendar, whatsNew, countLine, daysUntil, addDays, weekOf, isoDay, loadCalNames, type CalItem, type CalMoves } from '../js/content/releasecal.js';

type Fest = { id: string, en: string, vi: string, face: string, date: string, build: number, quiet: boolean };
const lang = () => document.documentElement.lang === 'vi' ? 'vi' : 'en';
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayEn = (s: string) => { const d = new Date(s + 'T12:00:00'); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const dayVi = (s: string) => { const d = new Date(s + 'T12:00:00'); return `${d.getDate()}/${d.getMonth() + 1}`; };
const both = (en: string, vi: string) => `<span data-wn-en="${esc(en)}" data-wn-vi="${esc(vi)}">${esc(lang() === 'vi' ? vi : en)}</span>`;

/** the festivals on the page (hidden ones left out), each at its next date from today */
function festivals(now: Date): Fest[] {
  const today = isoDay(now), out: Fest[] = [];
  document.querySelectorAll<HTMLElement>('.festival-card').forEach(card => {
    if (card.dataset.festivalVisible === 'false') return;
    const cd = card.querySelector<HTMLElement>('[data-fest-iso]'), name = card.querySelector<HTMLElement>('strong[data-en]'); if (!cd || !name) return;
    let iso: Record<string, string> = {}; try { iso = JSON.parse(cd.dataset.festIso || '{}'); } catch { }
    const date = Object.values(iso).filter(d => d >= today).sort()[0]; if (!date) return;
    out.push({ id: card.id.slice('festival-'.length), en: name.dataset.en || '', vi: name.dataset.vi || '', face: card.querySelector('.festival-face')?.innerHTML || '', date, build: +(cd.dataset.festBuild || 21), quiet: +(cd.dataset.festBuild || 21) <= 3 });
  });
  return out.sort((a, b) => a.date < b.date ? -1 : 1);
}

let PIC: ((e: string) => string) | null = null;
const icon = (it: CalItem) => PIC ? PIC(it.icon) : '';

function stripHTML(list: CalItem[], fests: Fest[], now: Date) {
  const W = whatsNew(list, now), today = isoDay(now);
  const on = fests.find(f => f.date === today) || fests.find(f => daysUntil(f.date, now) <= f.build);
  const nowTxt = on ? (on.date === today ? both(`${on.en} today`, `Hôm nay: ${on.vi}`) : both(`${on.en}: decorations up, ${daysUntil(on.date, now)} days to go`, `${on.vi}: đã trang trí, còn ${daysUntil(on.date, now)} ngày`)) : both('Everyday play in the valley', 'Chơi mỗi ngày trong thung lũng');
  const nw = W.thisWeek.length ? both(...countLine(W.thisWeek)) : both('New things every week', 'Mỗi tuần có điều mới');
  const next = list.find(i => i.kind === 'chapter' && i.date > today) || W.upcoming[0];
  const up = next ? both(`${next.en}: opens ${dayEn(next.date)}`, `${next.vi}: mở ngày ${dayVi(next.date)}`) : both('More soon', 'Sắp có thêm');
  const cell = (h: [string, string], body: string) => `<div class="wn-cell"><b>${both(...h)}</b><span>${body}</span></div>`;
  return cell(['Happening now', 'Đang diễn ra'], nowTxt) + cell(['New this week', 'Mới tuần này'], nw) + cell(['Coming up', 'Sắp tới'], up);
}

function calendarHTML(list: CalItem[], fests: Fest[], now: Date) {
  const today = isoDay(now), row = (face: string, title: string, when: string, cls = '') => `<li class="wn-row ${cls}"><span class="wn-face">${face}</span><span><strong>${title}</strong><small>${when}</small></span></li>`;
  const fRows = fests.slice(0, 8).map(f => row(f.face, both(f.en, f.vi), both(`Decorations from ${dayEn(addDays(f.date, -f.build))}, festival day ${dayEn(f.date)}`, `Trang trí từ ${dayVi(addDays(f.date, -f.build))}, ngày lễ ${dayVi(f.date)}`)));
  const gRows = fests.filter(f => !f.quiet).slice(0, 8).map(f => row(f.face, both(`Festival game: ${f.en}`, `Trò chơi lễ hội: ${f.vi}`),
    daysUntil(f.date, now) <= f.build ? both(`Open now, put away after ${dayEn(addDays(f.date, 3))} until next year`, `Đang mở, cất sau ${dayVi(addDays(f.date, 3))} đến năm sau`) : both(`Comes back on ${dayEn(addDays(f.date, -f.build))}`, `Sẽ quay lại ngày ${dayVi(addDays(f.date, -f.build))}`)));
  const cRows = list.filter(i => i.kind === 'chapter').map(i => row(icon(i), both(i.en, i.vi), i.date <= today ? both('Open now', 'Đã mở') : both(`Opens ${dayEn(i.date)}`, `Mở ngày ${dayVi(i.date)}`), 'wn-chapter'));
  const weeks: string[] = []; for (let w = weekOf(now), k = 0; k < 6; k++, w = addDays(w, 7)) weeks.push(w);
  const nRows = weeks.map(w => { const items = list.filter(i => (i.kind === 'game' || i.kind === 'story') && i.date >= w && i.date < addDays(w, 7)); if (!items.length) return '';
    return row(items.slice(0, 3).map(icon).join(''), both(countLine(items)[0], countLine(items)[1]), both(`Week of ${dayEn(w)}: ${items.slice(0, 4).map(i => i.en).join(', ')}${items.length > 4 ? '…' : ''}`, `Tuần ${dayVi(w)}: ${items.slice(0, 4).map(i => i.vi).join(', ')}${items.length > 4 ? '…' : ''}`)); }).filter(Boolean);
  const part = (h: [string, string], rows: string[]) => rows.length ? `<h3>${both(...h)}</h3><ul class="wn-list">${rows.join('')}</ul>` : '';
  return `<h2>${both('Calendar', 'Lịch')}</h2><p class="wn-sub">${both('Festivals, new lantern chapters, new games and stories, and when festival games come back. The same calendar as the game.', 'Lễ hội, chương truyện đèn lồng mới, trò chơi và truyện mới, và khi nào trò chơi lễ hội quay lại. Cùng một lịch với trò chơi.')}</p>`
    + part(['Festivals', 'Lễ hội'], fRows) + part(['New lantern chapters', 'Chương truyện đèn lồng mới'], cRows) + part(['New games and stories', 'Trò chơi và truyện mới'], nRows) + part(['Festival games', 'Trò chơi lễ hội'], gRows)
    + `<p class="wn-sub">${both('Grown-ups can turn on a Saturday message about what is new (Grown-ups, Notifications), and see a "What\'s new" card at the top of Grown-ups.', 'Người lớn có thể bật tin nhắn thứ Bảy về điều mới (Phụ huynh, Thông báo) và xem thẻ "Có gì mới" ở đầu trang Phụ huynh.')}</p>`;
}

const CSS = `.wn-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:12px auto 0;max-width:1120px;padding:0 16px;box-sizing:border-box}
.wn-cell{background:#fff8e8;border-radius:16px;padding:10px 14px;box-shadow:0 2px 0 rgba(160,120,80,.2);font-size:16px;line-height:1.3}.wn-cell b{display:block;color:#7a4ab0}
#calendar.section .wn-list{list-style:none;padding:0;margin:0 0 12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px}
.wn-row{display:flex;gap:10px;align-items:center;background:#fff;border-radius:14px;padding:8px 12px;font-size:16px;min-height:56px}.wn-row small{display:block;font-size:16px;color:#6a5a7a}
.wn-face{display:flex;flex:0 0 auto;max-width:144px}.wn-face svg{width:48px;height:48px}.wn-sub{font-size:16px}`;

export async function setupWhatsNew(now = new Date()) {
  const hero = document.querySelector('section.hero#discover'); if (!hero) return;
  // in Discover itself (the page the hero is on), after its first section; the festival overview stays where it is
  const over = hero.parentElement?.querySelector(':scope > section.start-here') || hero;
  let moves: CalMoves | null = null;
  const draw = () => {
    const list = calendar(moves), fests = festivals(now);
    let strip = document.querySelector('#whats-new-strip'); if (!strip) { strip = document.createElement('div'); strip.id = 'whats-new-strip'; strip.className = 'wn-strip'; hero.after(strip); }
    strip.innerHTML = stripHTML(list, fests, now);
    let cal = document.querySelector('#calendar'); if (!cal && over) { cal = document.createElement('section'); cal.id = 'calendar'; cal.className = 'section'; over.after(cal); }
    if (cal) cal.innerHTML = calendarHTML(list, fests, now);
  };
  const st = document.createElement('style'); st.textContent = CSS; document.head.append(st);
  draw();
  document.addEventListener('sv-festivals-change', draw);
  document.querySelector('#language-button')?.addEventListener('click', () => setTimeout(() => document.querySelectorAll<HTMLElement>('[data-wn-en]').forEach(e => { e.textContent = (lang() === 'vi' ? e.dataset.wnVi : e.dataset.wnEn) || ''; }), 0));
  import('../js/art.js').then(m => { PIC = m.pic; draw(); }).catch(() => { });
  loadCalNames().then(draw).catch(() => { });
  try { const r = await fetch('/api/live', { cache: 'no-store' }); if (r.ok) { const j = await r.json(); moves = j && j.content && j.content.releaseCalendar && j.content.releaseCalendar.moves || null; draw(); } } catch { }
}
