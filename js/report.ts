// The play report for grown-ups (round F): for each child, how long they played each day this week, which games
// they played most and how far they got, the places, postcards and words they collected. Nothing leaves the device.
// Counting listens to the event bus (architecture step 1): ActivityCompleted / ActivityAbandoned add a game to the
// day; main.js adds a minute for every minute of real play (not while the game is put away or paused on a menu).
//   profile.stats.days = { 'YYYY-MM-DD': { min, games } } (the last 30 days)   profile.stats.played = { gameId: times }
import { T, nm } from './i18n.js';
import { events } from './core/events.js';
import { parse } from './core/ids.js';
import { GAMES } from './games/registry.js';
import { PLACES, placeStickers, placeName } from './placebook.js';
import { customAlbum } from './custom.js';
import { modal } from './popups.js';
import { pic } from './art.js';
import { esc } from './util.js';
import { homeScreenApp, pdfOf, jpegOf, sharePDF } from './printpage.js';

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const days = p => { const s = p.stats = p.stats || {}; s.days = s.days && typeof s.days === 'object' ? s.days : {}; return s.days; };
const today = p => { const d = days(p), k = dayKey(); if (!d[k]) { d[k] = { min: 0, games: 0 }; const keys = Object.keys(d).sort(); while (keys.length > 30) delete d[keys.shift()]; } return d[k]; };
/** one more minute of play for this child */
export const addMinute = p => { today(p).min++; };

export function createReport(G, { save }) {
  const profileOf = playerId => { const n = (parse(playerId) || {}).name; return (G.heroes.find(h => h.profile.id === n) || {}).profile; };
  const played = (players, defId) => {
    const game = (parse(defId) || {}).name;
    for (const id of players || []) { const p = profileOf(id); if (!p) continue; today(p).games++; const pl = p.stats.played = p.stats.played || {}; if (game) pl[game] = (pl[game] || 0) + 1; }
    save();
  };
  events.on('ActivityStarted', e => { G._actPlayers = G._actPlayers || {}; G._actPlayers[e.activityId] = e.players; });
  events.on('ActivityCompleted', e => played(e.players, e.defId));
  events.on('ActivityAbandoned', e => { const pl = (G._actPlayers || {})[e.activityId]; if (pl) played(pl, e.activityId.replace(/^act:([^/]+)\/.*$/, 'game:$1')); });
}

// the report window
export function openReport(p) {
  const d = days(p), week = [...Array(7)].map((_, k) => { const t = new Date(); t.setDate(t.getDate() - 6 + k); const key = dayKey(t); return { key, t, ...(d[key] || { min: 0, games: 0 }) }; });
  const most = Math.max(30, ...week.map(x => x.min)), weekMin = week.reduce((a, x) => a + x.min, 0), weekGames = week.reduce((a, x) => a + x.games, 0);
  const pl: Record<string, number> = (p.stats && p.stats.played) || {}, top = Object.entries(pl).filter(([id]) => GAMES[id]).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const st = placeStickers(p), places = PLACES.filter(x => st[x.id]), fam = customAlbum(), famGot = fam.filter(c => (p.familyCards || {})[c.id]).length;
  const dayName = t => t.toLocaleDateString(T('en-AU', 'vi-VN'), { weekday: 'short' });
  const m = modal('report', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button>
    <h2>${pic('📊')} ${T('Play report', 'Báo cáo chơi')}: ${esc(nm(p.name))}</h2>
    <p class="note">${T('Kept on this device only.', 'Chỉ lưu trên máy này.')} ${p.age === 'big' ? T('Big kid (5 to 8)', 'Bé lớn (5 đến 8 tuổi)') : T('Little (under 5)', 'Bé nhỏ (dưới 5 tuổi)')} · ${T({ easy: 'Easy', medium: 'Medium', hard: 'Hard', talent: 'Talent' }[p.difficulty] || 'Easy', { easy: 'Dễ', medium: 'Vừa', hard: 'Khó', talent: 'Tài năng' }[p.difficulty] || 'Dễ')}</p>
    <h3>${T('This week', 'Tuần này')}: ${weekMin} ${T('minutes', 'phút')}, ${weekGames} ${T('games', 'trò chơi')}</h3>
    <div class="rep-week">${week.map(x => `<div class="rep-day"><i style="height:${Math.round(x.min / most * 100)}%"></i><b>${x.min}</b><small>${esc(dayName(x.t))}</small></div>`).join('')}</div>
    <h3>${T('Favourite games', 'Trò chơi yêu thích')}</h3>
    ${top.length ? `<ol class="rep-games">${top.map(([id, n]) => `<li><span>${pic(GAMES[id].icon)}</span><b>${esc(GAMES[id].name())}</b><small>${n}× · ${T('level', 'cấp')} ${(p.levels || {})[id] || 1}${(p.wins || {})[id] ? ` · ${(p.wins || {})[id]} ${T('wins', 'lần thắng')}` : ''}</small></li>`).join('')}</ol>` : `<p class="note">${T('No games played yet.', 'Chưa chơi trò nào.')}</p>`}
    <h3>${T('Collected', 'Đã sưu tầm')}</h3>
    <ul class="rep-list">
      <li>${pic('📒')} ${T('Places', 'Nơi đã đến')}: ${places.length}/${PLACES.length}${places.length ? ' (' + places.slice(0, 8).map(x => esc(placeName(x.id))).join(', ') + (places.length > 8 ? '…' : '') + ')' : ''}</li>
      <li>${pic('📮')} ${T('Landmark postcards', 'Bưu thiếp danh lam')}: ${Object.keys(p.postcards || {}).length}${fam.length ? ` · ${pic('💌')} ${T('family postcards', 'bưu thiếp gia đình')}: ${famGot}/${fam.length}` : ''}</li>
      <li>${pic('🗣️')} ${T('Words learned', 'Từ đã học')}: ${Object.keys(p.words || {}).length} · ${pic('✨')} ${T('Shrines', 'Đền')}: ${Object.keys(p.shrines || {}).length}/12</li>
    </ul>
    <div class="rp-bar actions"><button class="btn" data-print>${pic('🖨️')} ${T('Print or save as PDF', 'In hoặc lưu PDF')}</button><button class="btn ghost" data-close>${T('Close', 'Đóng')}</button></div>`);
  const close = () => m.close();
  m.querySelector('.x').onclick = close; m.querySelector('[data-close]').onclick = close;
  // (r89, owner's iPhone screenshot) on the Home Screen app a one-page PDF for the share sheet (js/printpage.ts)
  m.querySelector('[data-print]').onclick = async () => {
    if (!homeScreenApp()) { document.body.classList.add('printing-report'); print(); setTimeout(() => document.body.classList.remove('printing-report'), 500); return; }
    const name = `${T('Play report', 'Báo cáo chơi')} ${String(nm(p.name)).replace(/[^\p{L}\p{N} ]+/gu, '')} ${dayKey()}.pdf`;
    await sharePDF(reportPDF({ title: `${T('Play report', 'Báo cáo chơi')}: ${nm(p.name)}`, note: m.querySelector('.note')?.textContent || '',
      week: week.map(x => ({ label: dayName(x.t), min: x.min })), total: `${T('This week', 'Tuần này')}: ${weekMin} ${T('minutes', 'phút')}, ${weekGames} ${T('games', 'trò chơi')}`,
      gamesTitle: T('Favourite games', 'Trò chơi yêu thích'), games: top.map(([id, n]) => `${GAMES[id].name()}: ${n}× · ${T('level', 'cấp')} ${(p.levels || {})[id] || 1}${(p.wins || {})[id] ? ` · ${(p.wins || {})[id]} ${T('wins', 'lần thắng')}` : ''}`),
      collectedTitle: T('Collected', 'Đã sưu tầm'), collected: [...m.querySelectorAll('.rep-list li')].map(li => (li.textContent || '').trim()) }), name);
  };
  return m;
}


type ReportPage = { title: string; note: string; week: { label: string; min: number }[]; total: string; gamesTitle: string; games: string[]; collectedTitle: string; collected: string[] };
// the report drawn on an A4 page (the device's own fonts, so Vietnamese prints right), as a one-page PDF holding that picture
export function reportPDF(r: ReportPage): Uint8Array<ArrayBuffer> {
  const W = 1240, H = 1754, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); if (!g) throw new Error('no canvas');
  const font = (px: number, bold = false) => `${bold ? '800 ' : ''}${px}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const wrap = (text: string, x: number, y: number, max: number, lh: number) => { let line = ''; for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > max && line) { g.fillText(line, x, y); y += lh; line = w; } else line = t; } if (line) g.fillText(line, x, y); return y + lh; };
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.fillStyle = '#4a2a78';
  g.font = font(56, true); let y = wrap(r.title, 90, 150, W - 180, 66);
  g.fillStyle = '#5b5368'; g.font = font(28); y = wrap(r.note, 90, y, W - 180, 38) + 20;
  g.fillStyle = '#7b4bd6'; g.font = font(38, true); y = wrap(r.total, 90, y, W - 180, 48) + 10;
  const most = Math.max(30, ...r.week.map(d => d.min)), bw = (W - 180) / r.week.length, top = y, base = y + 300;
  r.week.forEach((d, i) => { const x = 90 + i * bw, h = d.min / most * 260; g.fillStyle = '#7fb8ff'; g.fillRect(x + bw * .18, base - h, bw * .64, Math.max(4, h));
    g.fillStyle = '#3b2a4f'; g.font = font(28, true); g.textAlign = 'center'; g.fillText(String(d.min), x + bw / 2, base + 40); g.font = font(24); g.fillText(d.label, x + bw / 2, base + 74); g.textAlign = 'left'; });
  y = Math.max(top, base) + 150;
  for (const [head, list] of [[r.gamesTitle, r.games], [r.collectedTitle, r.collected]] as const) {
    g.fillStyle = '#7b4bd6'; g.font = font(38, true); g.fillText(head, 90, y); y += 56;
    g.fillStyle = '#3b2a4f'; g.font = font(30); for (const t of list.length ? list : ['–']) y = wrap('• ' + t, 110, y, W - 220, 40) + 6;
    y += 30;
  }
  return pdfOf(jpegOf(c, .9), W, H);
}
