// The title screen (split from js/ui.ts, v1.07).
import { T } from '../i18n.js';
import { settings, autoPackOn } from '../state.js';
import { SFX, ac } from '../audio.js';
import { el, $ } from '../util.js';
import { installButton } from '../install.js';
import { SHOWN } from '../build.js';
import { hideCaption, flagBtns, bindLang, WEBSITE_ICON, openSite } from './common.js';
// ---------- Title ----------
export function showTitle(onStart) {
  // a storybook cover: the valley behind, the name on a cream card with little friends floating round it,
  // a big "start" button, and the language choices together on one card at the bottom
  const s = el('div', 'screen title sv2', `
    <div class="tt-bar"><button class="about" aria-label="${T('About', 'Giới thiệu')}">i</button><button class="sitebtn"><span>${WEBSITE_ICON}</span><b class="sitebtn-l"></b></button><div class="title-top"></div></div>
    <div class="tt-cover">
      <div class="tt-floaters" aria-hidden="true"><i>🪁</i><i>🏮</i><i>🌸</i><i>⭐</i><i>🦘</i><i>🪷</i></div>
      <div class="logo"><div class="logo-main"></div><div class="logo-sub"></div></div>
    </div>
    <button class="press"><span class="tt-play">▶</span><span class="tt-press" elementtiming="title"></span></button>
    <div class="tt-panel"><div class="title-foot"></div><div class="title-learn"></div><div class="tt-voice"></div></div>
    <div class="tt-build" aria-hidden="true">${SHOWN}</div>`);
  document.body.appendChild(s);
  const redraw = () => {
    // (r78, owner: windows stay still) the title's words hold both languages, the other one invisible, so switching
    // language never resizes the cover card or the start button: they keep the size of the longer words
    const both = (en, vi) => { const on = settings.lang === 'vi' ? 'vi' : 'en'; return [['en', en], ['vi', vi]].map(([L, w]) => `<span class="tt-l${L === on ? '' : ' tt-off'}"${L === on ? '' : ' aria-hidden="true"'}>${w}</span>`).join(''); };
    s.querySelector('.tt-press').innerHTML = both('Tap to start', 'Chạm để bắt đầu');
    // two words, two colours (pink and purple) with a white outline: clear and friendly, no glitter
    const logoWords = [['Sparkle', 'Valley'], ['Thung Lũng', 'Lấp Lánh']].map(ws => ws.map((w, k) => `<span class="lw lw${k + 1}">${w}</span>`).join(' '));
    s.querySelector('.logo-main').innerHTML = both(logoWords[0], logoWords[1]);
    s.querySelector('.logo-sub').innerHTML = both('Two homes · one valley', 'Hai quê hương · một thung lũng');
    s.querySelector('.logo').classList.toggle('vi', settings.lang === 'vi');
    s.querySelector('.about').setAttribute('aria-label', T('About', 'Giới thiệu'));
    s.querySelector('.sitebtn-l').textContent = T('Website', 'Trang web'); s.querySelector('.sitebtn').setAttribute('aria-label', T('Sparkle Valley website for families', 'Trang web Thung Lũng Lấp Lánh cho gia đình'));
    s.querySelector('.title-foot').innerHTML = flagBtns();
    // (owner, 3 Nov 2026 AEDT, v1.08) Chinese and Hindi are not languages for the whole game, only extra learning: their
    // "Also learn" buttons are not on the outside screens; they stay inside China Town, India Village and First Words
    s.querySelector('.title-learn').innerHTML = '';
    // (owner, 31 Oct 2026 AEDT) the voices play over the internet unless a grown-up kept them all on the device; the
    // Welcome says so, and how to keep them for playing offline
    const vn = s.querySelector('.tt-voice') as HTMLElement; vn.hidden = (autoPackOn() && !!settings.packSaved) || settings.offlineLevel === 'light'; // (v1.08c: a grown-up chose Light)
    vn.innerHTML = both('Voices play over the internet. To play offline with voices: Grown-ups → Sound and voices → Offline voices → Light or Full.',
      'Giọng nói phát qua mạng. Để chơi offline có giọng nói: Người lớn → Âm thanh và giọng nói → Giọng đọc ngoại tuyến → Nhẹ hoặc Đầy đủ.');
    bindLang(s, redraw);
    const top = s.querySelector('.title-top'); top.innerHTML = '';
    const b = installButton(); if (b) top.appendChild(b);
  };
  redraw();
  // (v1.08 startup, PERF-001) the credits load when the About button is tapped, not in the first download
  s.querySelector('.about').onclick = e => { e.stopPropagation(); ac(); import('../credits.js').then(m => m.openCredits(hideCaption)).catch(err => console.warn('credits', err)); };
  // (r89, owner 23 Oct AEDT) the family website floats over the Welcome screen; closing it comes back here, not into play
  s.querySelector('.sitebtn').onclick = e => { e.stopPropagation(); ac(); SFX.tap(); openSite(e.currentTarget instanceof Element ? e.currentTarget : null); };
  let starting = false;
  s.addEventListener('click', async e => { if (starting || e.target.closest('.seg') || e.target.closest('.about') || e.target.closest('.sitebtn') || document.querySelector('.modal.website:not(.out)') || e.target.closest('.installchip') || e.target.closest('.learnrow')) return; starting=true; ac(); SFX.chime(); try { await onStart(); s.remove(); } catch (error) { starting=false; throw error; } });
}
