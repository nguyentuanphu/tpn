// Quick settings while playing (split from js/ui.ts, v1.07).
import { T, nm } from '../i18n.js';
import { settings, saveSettings } from '../state.js';
import { say, warmVoiceLine } from '../voice.js';
import { SFX, Music, ac } from '../audio.js';
import { esc, $ } from '../util.js';
import { avatarURL } from '../avatar.js';
import { holdButton } from '../popups.js';
import { SHOWN } from '../build.js';
import { VOICE_STYLES, hush } from '../voice.js';
import { modal } from '../popups.js';
import { applyComfort, flagBtns, bindLang, WEBSITE_ICON, openSite } from './common.js';
import { openGrownups } from './grownups.js';
import { openFestivals } from './festivals-ui.js';
// ---------- Quick settings: tap your picture in the corner ----------
export function openQuick(game, i) {
  const m = modal('qsettings', ''), card = m.querySelector('.card');
  const close = () => { m.close(); game.paused = false; game.huds.forEach(h => h.refreshAudio()); };
  const hero = game.heroes[i], p = hero ? hero.profile : null;
  // one row with a picture, a name and an on/off switch
  const row = (k, icon, label, on, hint = '') => `<button class="qrow qset ${on ? 'on' : ''}" data-k="${k}" aria-pressed="${on}"><span class="qi">${icon}</span><b>${label}${hint ? `<small>${hint}</small>` : ''}</b><i class="qsw"></i></button>`;
  const draw = () => {
    const s = settings, view = (hero && hero.view) || 'follow';
    card.innerHTML = `<div class="qs-head">${p ? `<img class="qs-av" src="${avatarURL(p)}" alt="">` : ''}<div class="qs-title"><h2>${T('Settings', 'Cài đặt')}</h2>${p ? `<small>${esc(nm(p.name || ''))}</small>` : ''}<small class="buildtag">${T('Version', 'Phiên bản')} ${SHOWN}</small></div><button class="x" aria-label="${T('Close', 'Đóng')}">✕</button></div>
      <div class="qs-sec"><h4>🌏 ${T('Language', 'Ngôn ngữ')}</h4>${flagBtns()}</div>
      <div class="qs-sec"><h4>🔊 ${T('Sound', 'Âm thanh')}</h4>
        ${row('music', '🎵', T('Music', 'Nhạc'), s.music)}${row('sound', '🔔', T('Sounds', 'Tiếng động'), s.sound)}${row('voice', '🗣️', T('Talking', 'Giọng nói'), s.voice)}
        <div class="qs-sub">${T('Voice style', 'Kiểu giọng')}</div><div class="seg vstyle">${VOICE_STYLES.map(v => `<button data-v="${v.id}" class="${(s.voiceStyle || 'natural') === v.id ? 'on' : ''}">${v.icon} ${v.name()}</button>`).join('')}</div></div>
      <div class="qs-sec"><h4>🎥 ${T('Camera', 'Máy quay')}</h4>
        <div class="qs-views">${(game.getViews?.(i) || game.VIEWS || []).map(([id, icon, en, vi]) => `<button data-view="${id}" class="${view === id ? 'on' : ''}"><span>${icon}</span>${T(en, vi)}</button>`).join('')}</div>
        ${row('cam', s.camMode === 'free' ? '🧭' : '🧸', T('Easy camera', 'Camera dễ'), s.camMode !== 'free', s.camMode === 'free' ? T('off: drag to look around', 'tắt: kéo để nhìn quanh') : T('turns by itself', 'tự xoay theo con'))}</div>
      <div class="qs-sec"><h4>🎮 ${T('Play', 'Chơi')}</h4>
        ${row('voiceControl', '🎤', T('Voice control', 'Điều khiển bằng giọng nói'), s.voiceControl !== false)}${row('alwaysDay', '☀️', T('Always daytime', 'Luôn ban ngày'), s.alwaysDay)}
        <div class="qs-sub">${T('Text size', 'Cỡ chữ')}</div><div class="seg tsize">${[0, 1, 2].map(k => `<button data-ts="${k}" class="${(s.textSize || 0) === k ? 'on' : ''}" style="font-size:${16 + Number(k) * 5}px">A</button>`).join('')}</div></div>
      ${game.festivals ? `<button class="qs-fest" id="qFest"><span>🎉</span><b>${T('Festivals', 'Lễ hội')}</b><small>${T('Tết, Mid-Autumn, Diwali, Christmas, Australia Day: any day you like', 'Tết, Trung Thu, Diwali, Giáng Sinh, Ngày Nước Úc: ngày nào cũng được')}</small></button>` : ''}
      ${game.tester ? '<div id="qTester"></div>' : ''}
      <button class="qs-site" id="qSite"><span>${WEBSITE_ICON}</span><b>${T('Website', 'Trang web')}</b><small>${T('Explore the game with your family: play stays just as it is', 'Cùng gia đình khám phá trò chơi: trò chơi vẫn giữ nguyên')}</small></button>
      <button class="grown qgrown"><span class="ring"></span>👨‍👩‍👧 ${T('Grown-ups settings', 'Cài đặt phụ huynh')}<small>${T('press and hold', 'nhấn giữ')}</small></button>
      <div class="actions floatbar"><button class="btn primary" id="qDone">${T('Done', 'Xong')}</button></div>`;
    // Keep only Close outside the scrolling title row, so its sticky anchor spans the card.
    const closeButton = card.querySelector('.qs-head .x');
    if (closeButton) card.prepend(closeButton);
    bindLang(card, draw);
    if (game.tester) game.tester.settings(card.querySelector('#qTester'), draw); // (owner, 12 Oct) a tester device's Tester rows (js/tester.js)
    card.querySelector('.x').onclick = card.querySelector('#qDone').onclick = close;
    card.querySelectorAll('.qset').forEach(b => b.onclick = () => {
      const k = b.dataset.k; SFX.tap();
      if (k === 'cam') s.camMode = s.camMode === 'free' ? 'easy' : 'free';
      else if (k === 'voiceControl') s.voiceControl = s.voiceControl === false;
      else s[k] = !s[k];
      if (k === 'music') { if (s.music) Music.refresh(); else Music.stop(); }
      if (k === 'voice' && !s.voice) hush();
      saveSettings(); document.querySelectorAll<HTMLElement>('.dk.voicecmd').forEach(x => x.hidden = s.voiceControl === false); keep(draw);
    });
    card.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { game.setView(i, b.dataset.view); keep(draw); });
    card.querySelectorAll('.seg.tsize button').forEach(b => b.onclick = () => { s.textSize = +b.dataset.ts; saveSettings(); applyComfort(); keep(draw); });
    card.querySelectorAll('.seg.vstyle button').forEach(b => b.onclick = () => { ac(); s.voice = true; s.voiceStyle = b.dataset.v; saveSettings(); keep(draw); say('Hello! Do you like my voice?', 'Xin chào! Con có thích giọng này không?'); });
    const fb = card.querySelector('#qFest'); if (fb) fb.onclick = () => { SFX.tap(); m.close(); openFestivals(game, i); };
    // (r89, owner 23 Oct AEDT: Home moves from the corner into Settings) the website floats over Settings, which stays
    // open and paused under it; closing it comes back here, with the focus on this button
    const sb = card.querySelector('#qSite'); if (sb instanceof HTMLButtonElement) sb.onclick = () => { SFX.tap(); openSite(sb); };
    // the full Grown-ups settings, from inside the game (press and hold, so little fingers don't open it by accident)
    holdButton(card.querySelector('.qgrown'), () => openGrownups(() => { draw(); game.huds.forEach(h => { h.refreshAudio(); h.refreshWho(); }); }));
  };
  const keep = f => { const y = m.scrollTop; f(); m.scrollTop = y; };
  warmVoiceLine('Hello! Do you like my voice?', 'Xin chào! Con có thích giọng này không?');
  draw();
}
