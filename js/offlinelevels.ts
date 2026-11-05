// (v1.08c voices, brief part 2) the three offline levels in Grown-ups → Sound and voices (Light, Automatic, Full): one
// short line each with our own drawing, a bar for the space each takes next to Full, what this device keeps now, and how
// much a smaller level freed. Its own small file, loaded when Grown-ups opens (js/extras.ts), with its own styles, so the
// game's first download does not grow (check startup). The work itself is js/voicepack.ts (setOfflineLevel, levelSpace).
import { T } from './i18n.js';
import { settings } from './state.js';
import { savePackOffline, resumePackDownload } from './voice.js';
import { pic } from './art.js';

const CSS = `.offlvl { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 8px; margin: 6px 0; }
.offlvl-b { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-height: 64px; padding: 10px 12px; border: 2px solid #e2d8f5; border-radius: 16px; background: #fff; color: #3a2a50; text-align: left; font: 600 16px/1.3 var(--font); cursor: pointer; }
.offlvl-b b { font-size: 18px; }
.offlvl-h { display: flex; align-items: center; gap: 8px; }
.offlvl-h .offlvl-pic { width: 32px; height: 32px; flex: none; }
.offlvl-bar { display: block; width: 100%; height: 10px; border-radius: 5px; background: #ece6f7; overflow: hidden; }
.offlvl-bar i { display: block; height: 100%; width: 4%; border-radius: 5px; background: linear-gradient(90deg, #a07cff, #8a5cf6); transition: width .4s; }
.offlvl-bar.grow i { background: repeating-linear-gradient(90deg, #a07cff 0 8px, #d9ccff 8px 14px); }
.offlvl-b .offlvl-sz { color: #6a5a8a; font-weight: 700; }
.offlvl-b.on { border-color: #8a5cf6; background: #f1ebfb; box-shadow: 0 3px 0 #6a3fd0; }`;
// (v1.08c voices, brief part 2) the three offline levels: what each keeps and the space it takes (filled in once the
// areas' sizes are read). The Full button keeps its old id (#xPackSave): it is the old "Keep all voices on this device".
const LEVELS: [string, string, string, string, string, string][] = [
  ['light', '🪶', 'Light', 'Nhẹ', 'Main voices + where your child plays', 'Giọng chính + nơi con đang chơi'],
  ['auto', '📶', 'Automatic', 'Tự động', 'Plays online, keeps what is heard', 'Phát qua mạng, giữ câu đã nghe'],
  ['full', '🧳', 'Full', 'Đầy đủ', 'Every voice, for trips (use Wi-Fi)', 'Mọi giọng đọc, cho chuyến đi (dùng Wi-Fi)']];
// (owner, 5 Nov 2026 AEDT: "too wordy, make it shorter with a picture or infographic") one short line each, our own
// drawing, and a bar showing how much space it takes next to Full
// a grown-up chose a level: Full downloads everything now; Light and Automatic free what they no longer keep (js/voicepack.ts
// setOfflineLevel), then go on by themselves. Kept here, not in js/voice.ts, so the first download does not grow.
async function chooseOfflineLevel(level: string) {
  await resumePackDownload();
  const freed = await (await import('./voicepack.js')).setOfflineLevel(level as 'light' | 'auto' | 'full');
  if (level === 'full') savePackOffline().catch(() => { }); else if (level === 'light') await resumePackDownload();
  return freed;
}
const offlineSpace = () => import('./voicepack.js').then(m => m.levelSpace());
function offlineLevelsHTML() {
  const now = settings.offlineLevel === 'light' || settings.offlineLevel === 'full' ? settings.offlineLevel : 'auto';
  return `<p class="note">${T('How many voices does this device keep?', 'Máy này giữ bao nhiêu giọng đọc?')}</p>
  <div class="offlvl" role="radiogroup" aria-label="${T('Offline voices', 'Giọng đọc ngoại tuyến')}">${LEVELS.map(([k, e, en, vi, den, dvi]) => `<button type="button" role="radio" aria-checked="${k === now}" class="offlvl-b${k === now ? ' on' : ''}" data-lvl="${k}"${k === 'full' ? ' id="xPackSave"' : ''}><span class="offlvl-h">${pic(e, 'offlvl-pic')}<b>${T(en, vi)}</b></span><span>${T(den, dvi)}</span><span class="offlvl-bar${k === 'auto' ? ' grow' : ''}" aria-hidden="true"><i data-bar="${k}"></i></span><span class="offlvl-sz" data-sz="${k}">${k === 'auto' ? T('Grows as lines are heard', 'Tăng dần khi nghe') : '…'}</span></button>`).join('')}</div>
  <p class="note" id="xLvlInfo" role="status"></p><p class="note" id="xPackProg">${T('Downloads go on while the game is open.', 'Giọng đọc vẫn tải khi trò chơi đang mở.')}</p>`;
}
const mbText = (mb: number) => mb >= 1 ? `${Math.round(mb)} MB` : `${Math.max(0, Math.round(mb * 10) / 10)} MB`;
function fillLevels(card) {
  const info = card.querySelector('#xLvlInfo'); if (!info) return;
  offlineSpace().then(sp => { if (!card.isConnected) return;
    const l = card.querySelector('[data-sz="light"]'), f = card.querySelector('[data-sz="full"]');
    if (sp.known) { if (l) l.textContent = T(`About ${sp.light} MB`, `Khoảng ${sp.light} MB`); if (f) f.textContent = T(`About ${sp.full} MB`, `Khoảng ${sp.full} MB`);
      const bar = (k: string, mb: number) => { const i = card.querySelector(`[data-bar="${k}"]`) as HTMLElement | null; if (i) i.style.width = Math.max(4, Math.min(100, mb / Math.max(1, sp.full) * 100)) + '%'; };
      bar('light', sp.light); bar('full', sp.full); bar('auto', Math.min(sp.full, sp.now / 1048576)); }
    const extra = info.dataset.freed ? ' ' + info.dataset.freed : '';
    info.textContent = T(`Voices on this device now: ${mbText(sp.now / 1048576)}.`, `Giọng đọc trên máy này hiện có: ${mbText(sp.now / 1048576)}.`) + extra;
  }).catch(() => { });
}

// put the levels into their place in Grown-ups and answer the buttons. The shared voice service owns the download and its
// progress bar, even after this card closes; a smaller level frees its space before the line says so.
export function showLevels(slot: HTMLElement, card: HTMLElement) {
  if (!document.getElementById('offlvl-css')) { const st = document.createElement('style'); st.id = 'offlvl-css'; st.textContent = CSS; document.head.appendChild(st); }
  slot.innerHTML = offlineLevelsHTML();
  card.querySelectorAll<HTMLElement>('.offlvl-b').forEach(btn => btn.onclick = () => {
    const lvl = btn.dataset.lvl;
    card.querySelectorAll('.offlvl-b').forEach(x => { x.classList.toggle('on', x === btn); x.setAttribute('aria-checked', String(x === btn)); });
    const info = card.querySelector<HTMLElement>('#xLvlInfo'); if (info) { delete info.dataset.freed; info.textContent = T('Working…', 'Đang xử lý…'); }
    chooseOfflineLevel(lvl).then(freed => { if (info && freed > 1048576 / 10) info.dataset.freed = T(`Freed ${mbText(freed / 1048576)}.`, `Đã giải phóng ${mbText(freed / 1048576)}.`); fillLevels(card); }).catch(() => fillLevels(card));
  });
  fillLevels(card);
}
