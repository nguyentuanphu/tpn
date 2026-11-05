// (v1.08c parents, owner's plan docs/plans/links-rollout-install.md part 5, items 1 and 2) the learning report and the
// levels by subject, in Grown-ups (already behind the press-and-hold):
//   - per child, a report of this week: Vietnamese, English, Maths, Science and Money (games played, games won, the level
//     each plays at now), what went well and one game suggested for next week; it can be saved or shared as a picture
//     (the device's own share sheet or a download: nothing is sent anywhere by the game)
//   - per child 5 and over, the level of each subject: "Follow the child" (the level moves with how the subject is going,
//     js/content/subjects.ts) or the grown-up's own level, which always wins
// The counting is js/report.ts; the rules are js/content/subjects.ts.
import { T, nm } from './i18n.js';
import { SFX } from './audio.js';
import { profiles, saveProfiles } from './state.js';
import { GAMES } from './games/registry.js';
import { GAME_INFO } from './content/activities.js';
import { canStartGame } from './games/frame.js';
import { modal } from './popups.js';
import { saveToDevice } from './photos.js';
import { pic, artSVG } from './art.js';
import { esc } from './util.js';
import { SUBJECTS, SUBJECT_INFO, LEVELS, LEVEL_NAMES, learningWeek, subjectLevel, pinOf, setPin, type Subject, type Week } from './content/subjects.js';

const sName = (s: Subject) => T(SUBJECT_INFO[s].en, SUBJECT_INFO[s].vi);
const lvName = (lv: string) => T(...(LEVEL_NAMES[lv] || LEVEL_NAMES.easy));
const gName = (id: string) => { try { return GAMES[id] && GAMES[id].name ? GAMES[id].name() : id; } catch (e) { return id; } };
/** a game that may be suggested to this child: registered, switched on and open for them, and right for their age */
const suits = p => (id: string) => !!GAMES[id] && (p.age === 'big' || ((GAME_INFO[id] || [0, 2])[1] as number) < 5) && canStartGame(id, [p]);
export const weekOf = p => learningWeek(p, suits(p));

// the lines of the report, in the language shown (the window and the picture use the same words)
function lines(p, W: Week) {
  const name = nm(p.name || '');
  const subj = W.subjects.map(x => ({ s: x.s, icon: SUBJECT_INFO[x.s].icon, name: sName(x.s),
    count: x.games ? T(`${x.games} ${x.games === 1 ? 'game' : 'games'}, ${x.wins} won`, `${x.games} trò, thắng ${x.wins}`) : T('Not this week', 'Tuần này chưa chơi'),
    level: `${lvName(x.level)}${p.age === 'big' ? ' · ' + (x.pinned ? T('set by you', 'bạn chọn') : T('follows the child', 'theo bé')) : ''}` }));
  const well = W.well.map(w => w.kind === 'game' ? T(`${gName(w.id)} (${sName(w.s)}): won ${w.wins} ${w.wins === 1 ? 'time' : 'times'}${w.stars === 3 ? ', with three stars' : ''}.`, `${gName(w.id)} (${sName(w.s)}): thắng ${w.wins} lần${w.stars === 3 ? ', được ba sao' : ''}.`)
    : w.kind === 'subject' ? T(`${sName(w.s)}: ${w.wins} games won this week.`, `${sName(w.s)}: thắng ${w.wins} trò trong tuần.`)
    : T(`${sName(w.s)} is going well: its games now start a little harder.`, `${sName(w.s)} đang tiến bộ: các trò của môn này giờ khó hơn một chút.`));
  if (!well.length) well.push(W.total ? T(`${name} tried ${W.total} learning ${W.total === 1 ? 'game' : 'games'}. Every try counts!`, `${name} đã thử ${W.total} trò học. Mỗi lần thử đều đáng khen!`) : T('No learning games yet this week. The suggestion below is a good start.', 'Tuần này bé chưa chơi trò học nào. Trò gợi ý bên dưới là một khởi đầu tốt.'));
  const sug = W.suggest ? { id: W.suggest, icon: (GAMES[W.suggest] || {}).icon || SUBJECT_INFO[W.quiet].icon, name: gName(W.suggest),
    why: T(`${sName(W.quiet)} was practised least this week. Play it together once, then let ${name} try alone.`, `Tuần này ${sName(W.quiet)} được luyện ít nhất. Chơi cùng bé một lần, rồi để ${name} tự thử.`) } : null;
  return { name, subj, well, sug };
}

/** the learning report window for one child */
export function openLearnReport(p) {
  const W = weekOf(p), L = lines(p, W);
  const m = modal('learnrep', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button>
    <h2>${pic('📊')} ${T('Learning report', 'Báo cáo học tập')}: ${esc(L.name)}</h2>
    <p class="note">${T('The last seven days. Kept on this device only.', 'Bảy ngày qua. Chỉ lưu trên máy này.')}</p>
    <h3>${T('What was practised', 'Những gì bé đã luyện')}</h3>
    <div class="lr-subj">${L.subj.map(x => `<div class="lr-row" data-s="${x.s}"><span class="lr-ic">${pic(x.icon)}</span><div><b>${esc(x.name)}</b><small>${esc(x.count)}</small></div><span class="lr-lv">${esc(x.level)}</span></div>`).join('')}</div>
    <h3>${pic('🏆')} ${T('What went well', 'Điều bé làm tốt')}</h3>
    <ul class="lr-well">${L.well.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <h3>${pic('💡')} ${T('For next week', 'Gợi ý tuần sau')}</h3>
    ${L.sug ? `<div class="lr-sug" data-g="${esc(L.sug.id)}"><span class="lr-ic">${pic(L.sug.icon)}</span><div><b>${esc(L.sug.name)}</b><small>${esc(L.sug.why)}</small></div></div>` : `<p class="note">${T('Every game is played. Wonderful!', 'Bé đã chơi hết các trò. Tuyệt vời!')}</p>`}
    <div class="actions"><button class="btn primary" data-share>${pic('🖼️')} ${T('Save or share as a picture', 'Lưu hoặc chia sẻ thành ảnh')}</button><button class="btn ghost" data-close>${T('Close', 'Đóng')}</button></div>`);
  (m.querySelector('.x') as HTMLElement).onclick = (m.querySelector('[data-close]') as HTMLElement).onclick = () => m.close();
  (m.querySelector('[data-share]') as HTMLElement).onclick = async () => {
    SFX.tap && SFX.tap();
    const url = await learnPicture(p, W), how = await saveToDevice(url);
    const note = m.querySelector('.note'); if (note && how !== 'cancelled') note.textContent = how === 'failed' ? T('Could not save the picture.', 'Không lưu được ảnh.') : T('Picture saved!', 'Đã lưu ảnh!');
  };
  return m;
}

// ---------- the picture (drawn with our own pictures, the device's own fonts so Vietnamese is right) ----------
const loadImg = (src: string) => new Promise<HTMLImageElement | null>(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
const svgImg = (e: string) => { const s = artSVG(e); return s ? loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s)) : Promise.resolve(null); };
export async function learnPicture(p, W: Week = weekOf(p)): Promise<string> {
  const L = lines(p, W), Wd = 1080, H = 1500, c = document.createElement('canvas'); c.width = Wd; c.height = H;
  const g = c.getContext('2d'); if (!g) return '';
  const font = (px: number, bold = false) => `${bold ? '800 ' : ''}${px}px Fredoka, "Baloo 2", system-ui, sans-serif`;
  const wrap = (text: string, x: number, y: number, max: number, lh: number) => { let line = ''; for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > max && line) { g.fillText(line, x, y); y += lh; line = w; } else line = t; } if (line) g.fillText(line, x, y); return y + lh; };
  g.fillStyle = '#fff6e4'; g.fillRect(0, 0, Wd, H); g.lineWidth = 14; g.strokeStyle = '#8a5cf6'; g.strokeRect(18, 18, Wd - 36, H - 36);
  g.fillStyle = '#4a2a78'; g.font = font(54, true); let y = wrap(`${T('Learning report', 'Báo cáo học tập')}: ${L.name}`, 70, 120, Wd - 140, 62);
  g.fillStyle = '#5b5368'; g.font = font(28); y = wrap(T('Sparkle Valley · the last seven days', 'Thung Lũng Lấp Lánh · bảy ngày qua'), 70, y, Wd - 140, 36) + 20;
  const icons = await Promise.all([...L.subj.map(x => svgImg(x.icon)), svgImg('🏆'), svgImg('💡'), L.sug ? svgImg(L.sug.icon) : Promise.resolve(null)]);
  L.subj.forEach((x, k) => {
    g.fillStyle = k % 2 ? '#fbeedd' : '#ffffff'; g.fillRect(60, y - 8, Wd - 120, 104);
    const im = icons[k]; if (im) g.drawImage(im, 76, y + 4, 80, 80);
    g.fillStyle = '#3b2a4f'; g.font = font(36, true); g.fillText(x.name, 180, y + 40); g.font = font(28); g.fillStyle = '#5b5368'; g.fillText(x.count, 180, y + 80);
    g.textAlign = 'right'; g.fillStyle = '#7b4bd6'; g.font = font(28, true); g.fillText(x.level, Wd - 80, y + 56); g.textAlign = 'left';
    y += 112;
  });
  y += 30;
  const head = (im: HTMLImageElement | null, text: string) => { if (im) g.drawImage(im, 60, y - 44, 56, 56); g.fillStyle = '#7b4bd6'; g.font = font(40, true); g.fillText(text, 128, y); y += 56; };
  head(icons[L.subj.length], T('What went well', 'Điều bé làm tốt'));
  g.fillStyle = '#3b2a4f'; g.font = font(30); for (const t of L.well) y = wrap('• ' + t, 80, y, Wd - 160, 40) + 6;
  y += 30; head(icons[L.subj.length + 1], T('For next week', 'Gợi ý tuần sau'));
  if (L.sug) { const im = icons[L.subj.length + 2]; if (im) g.drawImage(im, 80, y - 30, 72, 72); g.fillStyle = '#3b2a4f'; g.font = font(34, true); g.fillText(L.sug.name, 170, y + 10); g.font = font(28); g.fillStyle = '#5b5368'; y = wrap(L.sug.why, 170, y + 54, Wd - 250, 38); }
  g.fillStyle = '#9a8aa8'; g.font = font(24); g.fillText(T('Made on this device. Nothing was sent anywhere.', 'Tạo trên máy này. Không gửi đi đâu cả.'), 70, H - 60);
  return c.toDataURL('image/png');
}

// ---------- Grown-ups: one part ----------
export function learnHTML(open: boolean) {
  const kids = profiles || [];
  return `<details class="gsec learn" data-sec="learn" ${open ? 'open' : ''}><summary><span class="gi">${pic('📊')}</span><b>${T('Learning: report and levels by subject', 'Học tập: báo cáo và cấp độ theo môn')}</b></summary><div class="gbody">
    <p class="note">${T('What each child practised this week in Vietnamese, English, Maths, Science and Money, what went well, and one game for next week. Kept on this device; you can save or share it as a picture.', 'Mỗi bé đã luyện gì trong tuần ở Tiếng Việt, Tiếng Anh, Toán, Khoa học và Tiền, điều bé làm tốt, và một trò gợi ý cho tuần sau. Chỉ lưu trên máy này; bạn có thể lưu hoặc chia sẻ thành ảnh.')}</p>
    <div class="lr-kids">${kids.map(k => `<button class="btn" data-lrep="${esc(k.id)}">${pic('📊')} ${esc(nm(k.name || '?'))}</button>`).join('')}</div>
    <h3>${T('Level by subject', 'Cấp độ theo môn')}</h3>
    <p class="note">${T('"Follow the child": each subject gets a little harder when it goes well and easier when it is hard (strong in Maths, new to English). Choose a level yourself and it always wins. Under-5s always play gently.', '"Theo bé": mỗi môn khó hơn một chút khi bé làm tốt và dễ hơn khi bé gặp khó (giỏi Toán, mới học Tiếng Anh). Bạn tự chọn cấp độ thì lựa chọn của bạn luôn được dùng. Bé dưới 5 tuổi luôn chơi nhẹ nhàng.')}</p>
    ${kids.filter(k => k.age === 'big').map(k => `<div class="lr-lvkid"><b>${esc(nm(k.name || '?'))}</b>${SUBJECTS.map(s => `<label class="lr-lvrow"><span class="lr-ic">${pic(SUBJECT_INFO[s].icon)}</span><span>${esc(sName(s))}</span><select data-subj="${esc(k.id)}|${s}" aria-label="${esc(sName(s))}">
      <option value="" ${pinOf(k, s) ? '' : 'selected'}>${T('Follow the child', 'Theo bé')} (${esc(lvName(subjectLevel({ ...k, subjPin: {} }, s)))})</option>${LEVELS.map(lv => `<option value="${lv}" ${pinOf(k, s) === lv ? 'selected' : ''}>${esc(lvName(lv))}</option>`).join('')}</select></label>`).join('')}</div>`).join('') || `<p class="note">${T('Levels by subject are for children 5 and over.', 'Cấp độ theo môn dành cho bé từ 5 tuổi.')}</p>`}
    </div></details>`;
}
export function bindLearn(card: HTMLElement) {
  card.querySelectorAll<HTMLElement>('[data-lrep]').forEach(b => b.onclick = () => { SFX.tap && SFX.tap(); const p = profiles.find(x => x.id === b.dataset.lrep); if (p) openLearnReport(p); });
  card.querySelectorAll<HTMLSelectElement>('[data-subj]').forEach(sel => sel.onchange = () => {
    const [id, s] = sel.dataset.subj.split('|'), p = profiles.find(x => x.id === id); if (!p) return;
    setPin(p, s as Subject, sel.value); saveProfiles(true); SFX.tap && SFX.tap();
  });
}
