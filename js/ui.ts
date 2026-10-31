import { isOpen, isHeld, progressOf, secondSetOf } from './content/unlocks.js';
// Screens and pop-ups: title, who's playing, grown-ups settings, photo editor, NPC dialogue,
// the Sparkle Pad (map, backpack, adventure log, album, camera), cooking, shop and online play.
import { AREAS, gamesIn, withSitePlaces } from './content/activities.js';
import type { Profile } from '../types/save.js';
import type { SvMain } from './main.js';
import { T, applyLang, nm } from './i18n.js';
import { settings, saveSettings, profiles, saveProfiles, addProfile, removeProfile, STYLES, OUTFIT_COLORS, HATS, BACKS, HAIR, SKIN, HAIRSTYLES, GLIDERS, farm, saveFarm, MAX_KIDS, reduceMotion, autoPackOn } from './state.js';
import { say, spoken, warmVoiceLine } from './voice.js';

import { SFX, Music, ac } from './audio.js';
import { fmt, cur, spoken as money } from './money.js';
import { el, esc, $, clamp, wait, local } from './util.js';

import { featureOn, festivalRule } from './custom.js';
import { BUILDUP } from './content/festcal.js';
export const familyTrialOn = () => featureOn('familyDevices', false) || !!window.__sv?.tester;
import { DEFAULT_OUTFITS, outfitOf, CLOTHES, ITEM, SLOTS as WEAR_SLOTS, owns, wear as wearItem, giveGift, setOf as setOfLook } from './content/shop.js'; // (round S, owner plan 8 Oct) two starting outfits when the clothes shop is on
import { avatarURL } from './avatar.js';
import { confetti, holdButton } from './popups.js';
export { holdButton }; // (round R privacy, 9 Oct) moved to popups.js so the real-place window can ask a grown-up too
// (sticker book, chat B 16 Oct) the Album tab is the sticker book (js/stickers.js, js/content/stickers.js)
import { sync as sbSync, has as sbHas, freshIds as sbFresh, seen as sbSeen, isShiny as sbIsShiny, pageCount as sbPageCount, pageFull as sbPageFull, welcome as sbWelcome, claimPrize as sbClaimPrize, prizeWon as sbPrizeWon } from './stickers.js';
import { THEMES as SB_THEMES, PAGES as SB_PAGES, BY_ID as SB_BY_ID, BOOK_LINES as SB_LINES } from './content/stickers.js';
import { playSound as stickerSound, sayName as stickerName } from './stickerfx.js';
// the page each child had open (UX-004: the book opens where it was left)
const sbAt = { theme: 'farm', page: {} };
import { familyCardsHTML, bindFamilyCards } from './familycards.js';

import { ITEMS, RECIPES, findRecipe, SHOP, HAT_ICON, HAT_NAME, REWARD_HATS, dishInfo, QUESTS } from './data.js';
import { SIZE, HALF, SHRINES, TOWERS, WATER, heightAt, regionAt, RIVERS, PONDS, ROADS } from './world.js';
import { LANDMARK_HOME, ROAD_TONES } from './content/map.js';
import { GAMES } from './games/frame.js';
import { showStory, storyList } from './story.js';
import { LANDMARKS, VENDORS } from './regions.js';
import { AUSSIE_SLANG, VN_WORDS, VN_SLANG } from './words.js';
import { openCredits } from './credits.js';
import { openHowTo } from './howto.js';
import { WILD } from './gather.js';
import { snackOf, eatSnack } from './snacks.js';
import { saveToDevice, savesByShare } from './photos.js';

import { installButton } from './install.js';
import { SHOWN } from './build.js';

import { VOICE_STYLES, hush, sayIn } from './voice.js';
import { LEARN } from './words2.js';
import { SONG_GROUPS, SONG_LIST, familySongs } from './content/songs.js';
import { originFlags, ICONS } from './icons.js';
import { pic } from './art.js';

const PET_ICON = { puppy: '🐶', kitty: '🐱', bunny: '🐰', panda: '🐼', joey: '🦘', calf: '🐃' };
export const STYLE_ICON = { dress: '👗', shirt: '👕', aodai: '🥻', tunic: '🧥', overalls: '👖', hoodie: '🧶' };
export const STYLE_NAME = { dress: () => T('Dress', 'Váy'), shirt: () => T('Shirt & shorts', 'Áo và quần đùi'), aodai: () => 'Áo dài', tunic: () => T('Explorer', 'Nhà thám hiểm'), overalls: () => T('Overalls', 'Quần yếm'), hoodie: () => T('Hoodie', 'Áo nỉ') };
// big text and calm mode change the whole page
export function applyComfort() { if (settings.textSize == null) settings.textSize = settings.bigText ? 1 : 0; document.body.classList.toggle('bigtext', settings.textSize >= 1); document.body.classList.toggle('biggertext', settings.textSize >= 2); document.body.classList.toggle('calm', reduceMotion()); if (Music.key) Music.refresh(); }
applyComfort();
// the device's "Reduce motion" switch, also when it is changed while playing
try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => applyComfort()); } catch (e) { }
// Captions: every spoken line also appears as text at the bottom (unless a speech box, game or storybook
// is already showing those words). On by default; grown-ups can switch it off.
let hideCaption = () => { };
{
  let cap = null, timers = [];
  const stop = () => { timers.forEach(clearTimeout); timers = []; };
  hideCaption = () => { stop(); cap && cap.classList.remove('show'); };
  // credits.js asks for this with an event (it cannot import ui.js: ui.js opens the credits)
  window.addEventListener('sv-hide-caption', () => hideCaption());
  // a long line is shown a sentence or two at a time, so the box never grows to cover the screen
  const chunks = text => {
    const out = []; let cur = '';
    for (const p of text.replace(/([.!?。…])\s+/g, '$1\u0001').split('\u0001')) { // (no lookbehind: older Safari)
      if (cur && (cur + ' ' + p).length > 90) { out.push(cur); cur = p; } else cur = cur ? cur + ' ' + p : p;
    }
    if (cur) out.push(cur);
    return out;
  };
  spoken.push(text => {
    if (settings.captions === false || !text) return;
    if (document.querySelector('.modal:not(.out), .wardrobe, .audio-tray, .dialog:not(.out), .storybook, .gl, .howto, .credits')) { hideCaption(); return; }
    if (!cap) { cap = el('div', 'caption'); cap.setAttribute('role', 'status'); cap.setAttribute('aria-live', 'polite'); document.body.appendChild(cap); }
    stop(); let at = 0;
    chunks(text).forEach(c => {
      const ms = 2200 + c.length * 70;
      timers.push(setTimeout(() => { if (document.querySelector('.modal:not(.out), .wardrobe, .audio-tray, .dialog:not(.out), .storybook, .gl, .howto, .credits')) { hideCaption(); return; } cap.textContent = c; cap.classList.add('show'); }, at));
      at += ms;
    });
    timers.push(setTimeout(() => cap.classList.remove('show'), at));
  });
}
export { hideCaption };
const toastProperties: { _t?: ReturnType<typeof setTimeout> } = {};
export const toast = Object.assign((msg: string) => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3200); }, toastProperties);

export const flagBtns = () => `<div class="seg lang"><button data-l="en" class="${settings.lang === 'en' ? 'on' : ''}">${originFlags('au')} English</button><button data-l="vi" class="${settings.lang === 'vi' ? 'on' : ''}">${originFlags('vn')} Tiếng Việt</button></div>`;
// Small, quiet buttons to also learn Chinese or Hindi words (in China Town, India Village and First Words).
export const learnBtns = () => `<div class="learnrow" aria-label="${T('Also learn', 'Học thêm')}">🌏 ${Object.entries(LEARN).map(([k, l]) => `<button data-learn="${k}" class="${settings.learnLang === k ? 'on' : ''}" title="${l.name[settings.lang] || l.name.en}">${k === 'zh' ? '中文' : 'हिन्दी'}</button>`).join('')}</div>`;
export function bindLearn(root, after) {
  root.querySelectorAll('[data-learn]').forEach(b => b.onclick = e => {
    e.stopPropagation(); const k = b.dataset.learn; settings.learnLang = settings.learnLang === k ? '' : k; saveSettings(); SFX.tap();
    if (settings.learnLang) { const L = LEARN[k], w = L.words[0]; toast(`${L.flag} ${T('Also learning ' + L.name.en, 'Học thêm ' + L.name.vi)}: ${w[3]} (${w[4]})`); sayIn(k, w[3]); }
    after && after();
  });
}
export function bindLang(root, after) {
  root.querySelectorAll('.seg.lang button').forEach(b => b.onclick = () => { settings.lang = b.dataset.l; saveSettings(); applyLang(); SFX.tap(); after && after(); });
}

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
    s.querySelector('.title-learn').innerHTML = learnBtns(); bindLearn(s, redraw);
    // (owner, 31 Oct 2026 AEDT) the voices play over the internet unless a grown-up kept them all on the device; the
    // Welcome says so, and how to keep them for playing offline
    const vn = s.querySelector('.tt-voice') as HTMLElement; vn.hidden = autoPackOn() && !!settings.packSaved;
    vn.innerHTML = both('Voices play over the internet. To play offline with voices: Grown-ups → Sound and voices → Keep all voices on this device.',
      'Giọng nói phát qua mạng. Để chơi offline có giọng nói: Người lớn → Âm thanh và giọng nói → Lưu tất cả giọng đọc vào máy.');
    bindLang(s, redraw);
    const top = s.querySelector('.title-top'); top.innerHTML = '';
    const b = installButton(); if (b) top.appendChild(b);
  };
  redraw();
  s.querySelector('.about').onclick = e => { e.stopPropagation(); ac(); openCredits(hideCaption); };
  // (r89, owner 23 Oct AEDT) the family website floats over the Welcome screen; closing it comes back here, not into play
  s.querySelector('.sitebtn').onclick = e => { e.stopPropagation(); ac(); SFX.tap(); openSite(e.currentTarget instanceof Element ? e.currentTarget : null); };
  let starting = false;
  s.addEventListener('click', async e => { if (starting || e.target.closest('.seg') || e.target.closest('.about') || e.target.closest('.sitebtn') || document.querySelector('.modal.website:not(.out)') || e.target.closest('.installchip') || e.target.closest('.learnrow')) return; starting=true; ac(); SFX.chime(); try { await onStart(); s.remove(); } catch (error) { starting=false; throw error; } });
}

// ---------- Who's playing ----------
// two players on one device: the way they sit now (Grown-ups 'auto' = face to face on touch screens; js/main.js rects)
export const twoViewNow = () => settings.twoView === 'face' || settings.twoView === 'side' ? settings.twoView : document.body.classList.contains('touch') ? 'face' : 'side';
export function showWho(onGo) {
  let mode = 'solo', chosen = [], shellHeight = null;
  const s = el('div', 'screen who sv2');
  document.body.appendChild(s);
  let asked = false;
  const draw = () => {
    const need = mode === 'split' ? 2 : 1;
    // nobody yet (a new device): one big card to make your own character (round P)
    if (!profiles.length) {
      s.innerHTML = `<div class="who-card first"><h2>${T('Hello! Who are you?', 'Xin chào! Con là ai?')}</h2>
        <p class="hint">${T('Make your own character: your name, how you look, and a photo if you like.', 'Tạo nhân vật của con: tên, trông thế nào, và ảnh nếu con thích.')}</p>
        <button class="go make">✨ ${T('Make my character', 'Tạo nhân vật của con')}</button></div>
        <button class="grown"><span class="ring"></span>${T('Grown-ups', 'Phụ huynh')}<small>${T('press and hold', 'nhấn giữ')}</small></button>`;
      const make = () => { SFX.tap(); openEditor(null, p => { if (p && profiles.includes(p)) { chosen = [p.id]; toast(T(`Hi ${p.name}!`, `Chào ${p.name}!`)); } draw(); }); };
      s.querySelector('.make').onclick = make;
      holdButton(s.querySelector('.grown'), () => openGrownups(draw));
      if (!asked) { asked = true; say('Hello! Make your own character.', 'Xin chào! Con hãy tạo nhân vật của mình nhé.'); }
      return;
    }
    s.innerHTML = `
      <div class="who-card">
        <h2>${T("Who's playing?", 'Ai chơi nào?')}</h2>
        <div class="modes">
          <button data-m="solo" class="${mode === 'solo' ? 'on' : ''}"><span class="mi">🧒</span><b>${T('Play alone', 'Chơi một mình')}</b></button>
          <button data-m="split" class="${mode === 'split' ? 'on' : ''}"><span class="mi">👫</span><b>${T('Two players here', 'Hai bạn cùng máy')}</b></button>
          <button data-m="online" class="${mode === 'online' ? 'on' : ''}"><span class="mi">📞</span><b>${T('Friend far away', 'Bạn ở xa')}</b></button>
        </div>
        ${mode === 'split' ? `<div class="views" role="group" aria-label="${T('How do you sit?', 'Hai bạn ngồi thế nào?')}">${[['face', ICONS.faceView, T('Face to face', 'Đối diện nhau')], ['side', ICONS.sideView, T('Side by side', 'Cạnh nhau')]].map(([k, ic, l]) => `<button data-v="${k}" class="${twoViewNow() === k ? 'on' : ''}">${ic}<b>${l}</b></button>`).join('')}</div>` : ''}
        <p class="hint">${mode === 'split' ? T('Pick two players', 'Chọn hai bạn') : T('Pick a player', 'Chọn người chơi')}</p>
        <div class="picks">${profiles.map(p => `<button class="pick ${chosen.includes(p.id) ? 'on' : ''}" data-id="${p.id}"><img src="${avatarURL(p)}" alt=""><span>${esc(nm(p.name || '?'))}</span>${chosen.includes(p.id) && need === 2 ? `<i class="num">${chosen.indexOf(p.id) + 1}</i>` : ''}</button>`).join('')}
          <button class="pick add"><span class="plus">+</span><span>${T('New', 'Thêm')}</span></button></div>
        <button class="go" ${chosen.length === need ? '' : 'disabled'}>${T("Let's go!", 'Đi thôi!')} ▶</button>
      </div>
      <button class="grown"><span class="ring"></span>${T('Grown-ups', 'Phụ huynh')}<small>${T('press and hold', 'nhấn giữ')}</small></button>`;
    s.querySelectorAll('.views button').forEach(b => b.onclick = () => { settings.twoView = b.dataset.v; saveSettings(); SFX.tap(); draw(); });
    const whoCard = s.querySelector('.who-card'), whoAction = whoCard.querySelector('.go'), whoBody = el('div', 'who-body');
    const naturalHeight = whoCard.getBoundingClientRect().height;
    [...whoCard.children].filter(n => n !== whoAction).forEach(n => whoBody.appendChild(n)); whoCard.prepend(whoBody); whoAction.classList.add('who-footer');
    // Keep the original compact opening size across redraws; additional choices scroll inside.
    // (owner, 31 Oct 2026 AEDT, tablet: the names under the faces were cut off) the opening card is never shorter than the
    // one-player choice needs: it grows when the fonts or pictures arrive after the first measure
    if (shellHeight === null || mode === 'solo' && naturalHeight > shellHeight) shellHeight = naturalHeight;
    whoCard.style.height = `${shellHeight}px`;
    s.querySelectorAll('.modes button').forEach(b => b.onclick = () => { mode = b.dataset.m; chosen = chosen.slice(0, mode === 'split' ? 2 : 1); SFX.tap(); draw(); });
    s.querySelectorAll('.pick[data-id]').forEach(b => b.onclick = () => {
      const id = b.dataset.id; SFX.pop(chosen.length);
      if (chosen.includes(id)) chosen = chosen.filter(x => x !== id);
      else if (need === 1) chosen = [id]; else chosen = [...chosen, id].slice(-2);
      const p = profiles.find(x => x.id === id); if (chosen.includes(id)) toast(T(`Hi ${p.name}!`, `Chào ${p.name}!`)); // (a welcome: text, not a voice; owner, round D)
      draw();
    });
    s.querySelector('.pick.add').onclick = () => profiles.length >= MAX_KIDS ? toast(T(`Up to ${MAX_KIDS} players. Remove one in Grown-ups first.`, `Tối đa ${MAX_KIDS} người chơi. Hãy xóa bớt trong mục Phụ huynh.`)) : openEditor(null, draw);
    s.querySelector('.go').onclick = () => { if (chosen.length !== need) return; SFX.chime(); s.remove(); onGo(mode, chosen.map(id => profiles.find(p => p.id === id))); };
    holdButton(s.querySelector('.grown'), () => openGrownups(draw));
  };
  draw();
  document.fonts?.ready.then(() => { if (s.isConnected && profiles.length) draw(); }).catch(() => { });
}
// ---------- Rename characters ----------
// (owner, 13 Oct AEDT: "within each, all the categories should be collapsible") each heading inside a part opens and
// closes what follows it, up to the next heading; the game remembers what was closed while it is open
const closedFolds = new Set();
export function foldHeadings(root, scope) {
  [...root.querySelectorAll(':scope > h3, :scope > div > h3')].forEach(h => { if (h.closest('details.hfold')) return; const nodes = []; let n = h.nextSibling;
    while (n && !(n.nodeType === 1 && (/^H[23]$/.test(n.tagName) || n.matches('details.gsec, details.hfold')))) { nodes.push(n); n = n.nextSibling; }
    if (!nodes.length) return; const k = scope + ':' + h.textContent.trim().slice(0, 40), d = document.createElement('details'), sm = document.createElement('summary');
    d.className = 'hfold'; d.open = !closedFolds.has(k); h.parentNode.insertBefore(d, h); sm.appendChild(h); d.appendChild(sm); nodes.forEach(x => d.appendChild(x));
    d.addEventListener('toggle', () => { if (d.open) closedFolds.delete(k); else closedFolds.add(k); }); });
}
// a sticky row of shortcuts at the top of a long page: one chip per section heading, tap to jump there
export function jumpNav(root, after) {
  const hs = [...root.querySelectorAll(':scope > h3, :scope h3.jump')].filter(h => h.textContent.trim());
  if (hs.length < 4) return;
  const nav = el('div', 'jumpnav');
  // (17 Oct AEDT) a jump lands the heading clear of the row: the row sticks below the window's top padding and its 44 px
  // buttons made it taller than the old fixed 64 px, so headings landed under it
  hs.forEach((h, k) => { const t = [...h.childNodes].filter(n => n.nodeName !== 'SMALL').map(n => n.textContent).join('').trim().replace(/\s+/g, ' '), b = el('button', '', esc([...t].length > 26 ? [...t].slice(0, 25).join('') + '…' : t)); b.onclick = () => { SFX.tap(); h.style.scrollMarginTop = nav.offsetHeight + (parseFloat(getComputedStyle(root).paddingTop) || 0) + 6 + 'px'; h.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; nav.appendChild(b); h.style.scrollMarginTop = '64px'; });
  (after && after.parentNode === root ? after : root.firstElementChild).insertAdjacentElement('afterend', nav);
}
// ---------- Grown-ups: the recorded voices at a glance ----------
// Recorded (offline) voices always play first; the phone's own voice is used only for a line with no recording.
// Those lines are counted here and travel in the backup file, so Sparkle Studio can record them.
// Grown-ups is optional at startup; repeated taps share the first load.
let settingsRequest: Promise<void> | null = null;
export function openGrownups(after?: () => void): Promise<void> {
  if (settingsRequest || document.querySelector('.modal.grownups:not(.out)')) return settingsRequest || Promise.resolve();
  settingsRequest = import('./ui-settings.js').then(m => m.openGrownups(after)).catch(error => { window.svModuleGone?.(error); after?.(); }).finally(() => { settingsRequest = null; });
  return settingsRequest;
}

// ---------- the family website (r89): js/website.ts, loaded only when it is opened ----------
const WEBSITE_ICON = '<svg class="ico" viewBox="0 0 48 48" aria-hidden="true"><path d="M5 24L24 9l19 15" fill="#ff8a5a" stroke="#3b2a4f" stroke-width="2.6" stroke-linejoin="round"/><path d="M10 23h28v20H10z" fill="#fff3d0" stroke="#3b2a4f" stroke-width="2.6"/><path d="M21 43V31h8v12" fill="#b07a4a" stroke="#3b2a4f" stroke-width="2.6"/><rect x="14" y="27" width="5" height="5" rx="1" fill="#8ed7f3" stroke="#3b2a4f" stroke-width="1.5"/><path d="M37 2l2.1 4.4 4.9.7-3.5 3.4.8 4.8-4.3-2.2-4.3 2.2.8-4.8L30 7.1l4.9-.7z" fill="#ffd23f" stroke="#3b2a4f" stroke-width="1.6" stroke-linejoin="round"/></svg>';
let siteRequest: Promise<void> | null = null;
export function openSite(opener: Element | null, section = ''): Promise<void> {
  if (siteRequest) return siteRequest;
  siteRequest = import('./website.js').then(m => { m.openWebsite(opener, undefined, section); }).catch(error => { window.svModuleGone?.(error); }).finally(() => { siteRequest = null; });
  return siteRequest;
}

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

// ---------- Player editor with photo cropping ----------
export function openEditor(profile, after) {
  const isNew = !profile;
  const p = profile || addProfile();
  const look = Object.assign({}, p.look);
  let photo = p.photo, img = null, zoom = 1, ox = 0, oy = 0;
  const m = modal('editor', `
    <h2>${isNew ? T('Make a character', 'Tạo nhân vật') : T('Edit player', 'Sửa người chơi')}</h2>
    <div class="crop-wrap"><canvas id="crop" width="480" height="480"></canvas>
      <p class="note">${T('Use a close-up photo of their face. Drag to move, use the slider to zoom.', 'Dùng ảnh chụp gần khuôn mặt. Kéo để di chuyển, dùng thanh trượt để phóng to.')}</p>
      <label class="btn primary" for="file">📷 ${T('Take or choose a photo', 'Chụp hoặc chọn ảnh')}</label><input type="file" id="file" accept="image/*" class="vh">
      <input type="range" id="zoom" min="1" max="5" step=".01" value="1" hidden aria-label="Zoom"></div>
    <div class="field"><label for="nm">${T('Name', 'Tên')}</label><input id="nm" maxlength="16" value="${esc(p.name)}" placeholder="${T('e.g. Annie or Bin', 'ví dụ: Na hoặc Bin')}"></div>
    <div class="field"><span>${T('Age', 'Tuổi')}</span><div class="seg age"><button data-a="little"><span class="ai">🧸</span><b>${T('Little', 'Bé nhỏ')}</b><small>${T('under 5', 'dưới 5 tuổi')}</small></button><button data-a="big"><span class="ai">🎒</span><b>${T('Big kid', 'Bé lớn')}</b><small>${T('5 to 8', '5 đến 8 tuổi')}</small></button></div>
      <p class="note">${T('Little: everything is spoken, games stay gentle and nobody can lose. Big kid: harder levels, more reading, and real opponents in strategy games.', 'Bé nhỏ: mọi thứ đều được đọc to, trò chơi nhẹ nhàng và không ai thua. Bé lớn: cấp độ khó hơn, đọc nhiều hơn, và có đối thủ thật trong trò chơi chiến thuật.')}</p></div>
    <div class="field"><span>${T('Start screen', 'Màn hình đầu')}</span><div class="seg age scr"><button data-s="simple"><span class="ai">🧸</span><b>${T('Simple', 'Đơn giản')}</b><small>${T('big pictures', 'hình to')}</small></button><button data-s="valley"><span class="ai">🌳</span><b>${T('Valley', 'Thung lũng')}</b><small>${T('walk and explore', 'đi khám phá')}</small></button></div>
      <p class="note">${T('Simple: a path of big pictures, one tap to play. Valley: the whole 3D world. The child can switch any time.', 'Đơn giản: một con đường hình to, chạm một lần là chơi. Thung lũng: cả thế giới 3D. Bé đổi lúc nào cũng được.')}</p></div>
    <div class="field"><span>${T('Difficulty', 'Độ khó')}</span><div class="seg diff"><button data-d="easy">🌱 ${T('Easy', 'Dễ')}</button><button data-d="medium">🌿 ${T('Medium', 'Vừa')}</button><button data-d="hard">🌳 ${T('Hard', 'Khó')}</button></div></div>
    <div class="field"><span>${T('Clothes', 'Trang phục')}</span><div class="chips" id="cOut"></div><div class="chips" id="cCol"></div></div>
    <div class="field"><span>${T('Hat', 'Mũ')}</span><div class="chips" id="cHat"></div></div>
    <div class="field"><span>${T('On the back', 'Sau lưng')}</span><div class="chips" id="cBack"></div></div>
    <div class="field"><span>${T('Hair', 'Tóc')}</span><div class="chips" id="cHs"></div><div class="chips" id="cHair"></div></div>
    <div class="field"><span>${T('Skin', 'Màu da')}</span><div class="chips" id="cSkin"></div></div>
    <div class="actions floatbar">${isNew ? '' : `<button class="btn danger" id="eDel">${T('Remove', 'Xóa')}</button>`}<span class="grow"></span><button class="btn" id="eCancel">${T('Cancel', 'Hủy')}</button><button class="btn primary" id="eSave">${T('Save', 'Lưu')}</button></div>`);
  const cv = m.querySelector('#crop'), cx = cv.getContext('2d'), zr = m.querySelector('#zoom');
  const draw = () => {
    cx.fillStyle = '#fff'; cx.fillRect(0, 0, 480, 480);
    if (img) { const s = Math.max(480 / img.width, 480 / img.height) * zoom; cx.drawImage(img, 240 - img.width * s / 2 + ox, 240 - img.height * s / 2 + oy, img.width * s, img.height * s); }
    else if (photo) { const i = new Image(); i.onload = () => { img = i; zoom = 1; ox = oy = 0; draw(); }; i.src = photo; return; }
    else { cx.fillStyle = '#f1e9ff'; cx.fillRect(0, 0, 480, 480); cx.font = '160px serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('🙂', 240, 250); }
    cx.save(); cx.fillStyle = 'rgba(30,20,40,.45)'; cx.beginPath(); cx.rect(0, 0, 480, 480); cx.arc(240, 240, 205, 0, Math.PI * 2, true); cx.fill('evenodd'); cx.restore();
    cx.strokeStyle = '#fff'; cx.lineWidth = 6; cx.beginPath(); cx.arc(240, 240, 205, 0, Math.PI * 2); cx.stroke();
    zr.hidden = !img;
  };
  draw();
  m.querySelector('#file').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const url = URL.createObjectURL(f), i = new Image();
    i.onload = () => { img = i; zoom = 1; ox = oy = 0; zr.value = 1; draw(); URL.revokeObjectURL(url); };
    i.src = url;
  };
  zr.oninput = () => { zoom = +zr.value; draw(); };
  // drag with one finger to move, pinch with two fingers (or use the slider) to zoom
  const ptrs = new Map(); let pinch0 = 0, zoom0 = 1;
  cv.addEventListener('pointerdown', e => { if (!img) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (e.isTrusted) cv.setPointerCapture(e.pointerId); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = zoom; } });
  cv.addEventListener('pointermove', e => {
    const pr = ptrs.get(e.pointerId); if (!pr) return;
    if (ptrs.size === 1) { const k = 480 / cv.clientWidth; ox += (e.clientX - pr.x) * k; oy += (e.clientY - pr.y) * k; }
    pr.x = e.clientX; pr.y = e.clientY;
    if (ptrs.size === 2 && pinch0) { const [a, b] = [...ptrs.values()]; zoom = clamp(zoom0 * Math.hypot(a.x - b.x, a.y - b.y) / pinch0, 1, 5); zr.value = zoom; }
    draw();
  });
  const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = 0; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  const chips = (id, list, key, render) => {
    const box = m.querySelector(id); box.innerHTML = '';
    list.forEach(v => { const b = el('button', 'chip' + (look[key] === v ? ' on' : '')); b.innerHTML = render(v); b.onclick = () => { look[key] = v; chips(id, list, key, render); }; box.appendChild(b); });
  };
  chips('#cOut', STYLES, 'style', v => `<span>${STYLE_ICON[v]}</span><small>${STYLE_NAME[v]()}</small>`);
  chips('#cCol', OUTFIT_COLORS, 'color', v => `<span class="sw" style="background:${v}"></span>`);
  chips('#cHat', HATS, 'hat', v => HAT_ICON[v]);
  chips('#cBack', BACKS, 'back', v => ({ none: '🙂', wings: '🧚', cape: '🦸' }[v]));
  chips('#cHs', HAIRSTYLES, 'hairStyle', v => ({ short: '💇', buns: '🎀', long: '👩', ponytail: '🐴', spiky: '🦔' }[v]));
  let age = p.age || 'little';
  const ageBtns = () => m.querySelectorAll('.seg.age:not(.scr) button').forEach(b => { b.classList.toggle('on', b.dataset.a === age); b.onclick = () => { age = b.dataset.a; ageBtns(); }; });
  ageBtns();
  let scr = p.screen || null; // unset: follows the age (under 5: Simple)
  const scrBtns = () => m.querySelectorAll('.seg.scr button').forEach(b => { b.classList.toggle('on', b.dataset.s === (scr || (age === 'big' ? 'valley' : 'simple'))); b.onclick = () => { scr = b.dataset.s; scrBtns(); }; });
  scrBtns(); m.querySelectorAll('.seg.age:not(.scr) button').forEach(b => b.addEventListener('click', () => scrBtns()));
  let diff = p.difficulty || 'easy';
  const diffBtns = () => m.querySelectorAll('.seg.diff button').forEach(b => { b.classList.toggle('on', b.dataset.d === diff); b.onclick = () => { diff = b.dataset.d; diffBtns(); }; });
  diffBtns();
  chips('#cHair', HAIR, 'hair', v => `<span class="sw" style="background:${v}"></span>`);
  chips('#cSkin', SKIN, 'skin', v => `<span class="sw" style="background:${v}"></span>`);
  if (featureOn('shop', true)) shopOutfits(m, look, isNew); // (round S) hats, necklaces and the rest come from the shop
  const finish = save => {
    if (save) {
      p.name = (m.querySelector('#nm').value.trim() || T('Explorer', 'Nhà thám hiểm')).slice(0, 16);
      if (img) {
        const o = document.createElement('canvas'); o.width = o.height = 400; const ox2 = o.getContext('2d');
        ox2.fillStyle = '#fff'; ox2.fillRect(0, 0, 400, 400);
        const s =Math.max(480 / img.width, 480 / img.height) * zoom, k = 400 / 410;
        ox2.drawImage(img, (240 - img.width * s / 2 + ox - 35) * k, (240 - img.height * s / 2 + oy - 35) * k, img.width * s * k, img.height * s * k);
        p.photo = o.toDataURL('image/jpeg', .82);
      }
      Object.assign(p.look, look); p.age = age; p.difficulty = diff; if (scr) p.screen = scr; saveProfiles(true);
    } else if (isNew) removeProfile(p.id);
    m.close(); after && after(p);
  };
  m.querySelector('#eSave').onclick = () => finish(true);
  m.querySelector('#eCancel').onclick = () => finish(false);
  const del = m.querySelector('#eDel');
  // (the last player can go too: the next start asks for a new character, round P)
  if (del) del.onclick = () => { if (confirm(T(`Remove ${p.name} and all their progress?`, `Xóa ${p.name} và toàn bộ tiến trình?`))) { removeProfile(p.id); m.close(); after && after(); } };
}

// ---- (round S, owner plan 8 Oct: "only 2 default outfits, boy and girl; hair chosen at creation or in Grown-ups → Children
// → Edit") with the clothes shop on, the Clothes row offers the two outfits; hats and backs are bought in the shop (js/shop.js)
function shopOutfits(m, look, isNew) {
  if (isNew) Object.assign(look, DEFAULT_OUTFITS[look.style === 'dress' ? 'girl' : 'boy'], { set: look.style === 'dress' ? 'girl' : 'boy' });
  const box = m.querySelector('#cOut'), draw = () => { box.innerHTML = ''; for (const k of Object.keys(DEFAULT_OUTFITS)) {
    const b = el('button', 'chip' + (outfitOf(look) === k ? ' on' : '')); b.dataset.outfit = k; b.innerHTML = `<span>${pic(k === 'girl' ? '👧' : '👦')}</span><small>${k === 'girl' ? T('Girl', 'Bé gái') : T('Boy', 'Bé trai')}</small>`;
    b.onclick = () => { const o = DEFAULT_OUTFITS[k]; Object.assign(look, { style: o.style, color: o.color, top: 'none', bottom: 'none', set: k }); draw(); }; box.appendChild(b); } };   // (Round U: set, the clothes the shop shows first)
  draw(); m.querySelector('#cCol').hidden = true; ['#cHat', '#cBack'].forEach(id => { m.querySelector(id).closest('.field').hidden = true; });
  { const lab = box.closest('.field').querySelector('span'); if (lab) lab.textContent = T('I am a…', 'Con là…'); }   // (Round V, owner 13 Oct) girl or boy, chosen when the character is made: the shop sells that set
}
// ---- (round S) end ----

// (windows, NPC dialogue, the reward pop-up and confetti live in js/popups.js since architecture step 2; passed on from here)
export { modal, dialog, dialogHooks, reward } from './popups.js';
import { modal, dialog, dialogHooks, reward } from './popups.js';

// ---------- the Sparkle Pad ----------
// which place each landmark belongs to in the real world (the Pad map lists it under that place): round T, in the map
// (js/content/map.js LANDMARK_HOME)
// (round T4b, finding your way) the Pad map's picture, drawn once from the map data: the land shaded by its height
// (sea, sand, grass, hills, snow), every river in its own colour, the lakes and ponds, and every road in its
// region's colour (red Vietnam, orange Australia, purple to the mountains, blue along the coast, grey at home)
let VALLEY_PIC = null;
function valleyPicture(S) {
  if (VALLEY_PIC && VALLEY_PIC.width === S) return VALLEY_PIC;
  const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), k = S / SIZE, N = 160, cell = S / N;
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(1, t))));
  const SEA = [92, 176, 226], SAND = [238, 220, 170], GRASS = [150, 206, 120], HILL = [118, 168, 98], ROCK = [176, 160, 140], SNOW = [244, 244, 248];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const wx = (i + .5) / N * SIZE - HALF, wz = (j + .5) / N * SIZE - HALF, h = heightAt(wx, wz) - WATER;
    const col = h < .1 ? mix([60, 140, 210], SEA, 1 + h / 4) : h < 1.2 ? SAND : h < 8 ? mix(GRASS, HILL, (h - 1.2) / 6.8) : h < 22 ? mix(HILL, ROCK, (h - 8) / 14) : mix(ROCK, SNOW, (h - 22) / 10);
    g.fillStyle = `rgb(${col})`; g.fillRect(i * cell, j * cell, cell + .6, cell + .6);
  }
  const P = ([wx, wz]) => [(wx + HALF) * k, (wz + HALF) * k];
  const line = (pts, width, colour) => { g.strokeStyle = colour; g.lineWidth = width; g.lineCap = g.lineJoin = 'round'; g.beginPath(); pts.forEach((q, n) => { const [a, b] = P(q); n ? g.lineTo(a, b) : g.moveTo(a, b); }); g.stroke(); };
  for (const R of RIVERS) line(R.pts, Math.max(3, 9 * R.w * k), R.tone ? R.tone : '#4aa8e0');
  for (const D of PONDS) { const [a, b] = P([D.x, D.z]); g.fillStyle = '#4aa8e0'; g.beginPath(); g.arc(a, b, D.r * k, 0, Math.PI * 2); g.fill(); }
  for (const R of ROADS) { if (R.kind === 'footpath') continue; const pts = R.loop ? [...R.pts, R.pts[0]] : R.pts;
    line(pts, (R.kind === 'asphalt' ? 5 : 3.5) + 2, 'rgba(255,255,255,.85)'); line(pts, R.kind === 'asphalt' ? 5 : 3.5, ROAD_TONES[R.tone] || (R.kind === 'dirt' ? '#c49a62' : '#8d8f96')); }
  return (VALLEY_PIC = c);
}

const openPadProperties: { mapLast?: string; mapCity?: number } = {};
export const openPad = Object.assign(function (game, i, tab) {
  tab = tab || 'map';
  const hero = game.heroes[i], p: Profile = hero.profile;
  const m = modal('pad', '');
  const card = m.querySelector('.card');
  const TABS = [['map', '🗺️', T('Map', 'Bản đồ')], ['bag', '🎒', T('Backpack', 'Ba lô')], ['log', '📜', T('Adventures', 'Nhiệm vụ')], ['album', '⭐', T('Stickers', 'Hình dán')], ['passport', '🛂', T('Passport', 'Hộ chiếu')], ['games', '🎲', T('Games', 'Trò chơi')], ['cam', '📷', T('Camera', 'Máy ảnh')], ['cal', '📅', T('Festivals', 'Lễ hội')]];
  if (game.mode === 'online' || game.mode === 'solo') TABS.push(['friend', '📞', T('Friend', 'Bạn bè')]);
  // (Round V, owner 13 Oct: "the shop button should be right next to the bag") a Shop tab straight after Backpack opens the
  // clothes shop right there (no travel); it replaces the dock's Shop button
  if (game.shop && game.shop.on() && game.heroes.length < 2) TABS.splice(TABS.findIndex(t => t[0] === 'bag') + 1, 0, ['shop', '🛍️', T('Shop', 'Cửa hàng')]);
  const pageCleanups: (() => void)[] = [];
  const cleanPage = () => { pageCleanups.splice(0).forEach(clean => clean()); };
  const draw = () => {
    cleanPage();
    const sl = card.querySelector('.pad-tabs') ? card.querySelector('.pad-tabs').scrollLeft : 0;
    card.innerHTML = `<div class="pad-head"><div class="pad-tabs">${TABS.map((t, k) => `<button data-t="${t[0]}" class="${t[0] === tab ? 'on' : ''}"><span>${pic(t[1])}${t[0] === 'album' && sbFresh(p).length ? `<i class="stk-count" aria-label="${T(`${sbFresh(p).length} new stickers`, `${sbFresh(p).length} hình dán mới`)}">${sbFresh(p).length}</i>` : ''}</span><small>${t[2]}<kbd class="padkey">${k + 1}</kbd></small></button>`).join('')}</div><button class="x" aria-label="${T('Close', 'Đóng')}">✕<kbd class="padkey">Esc</kbd></button></div><div class="pad-body"></div>`;
    card.querySelector('.pad-tabs').scrollLeft = sl;
    card.querySelectorAll('.pad-tabs button').forEach(b => b.onclick = () => { SFX.tap(); tab = b.dataset.t; draw(); });
    card.querySelector('.x').onclick = close;
    const body = card.querySelector('.pad-body');
    ({ shop: b => game.shop.openShop(i, b), map: drawMap, bag: drawBag, log: drawLog, album: drawAlbum, games: drawGames, cam: drawCam, friend: drawFriend, passport: b => game.drawPassport(b, hero), cal: drawCal })[tab](body);
    if (tab === 'bag' || tab === 'log' || tab === 'album') foldHeadings(body, tab); // (owner, 13 Oct) each part opens and closes
  };
  // computer keyboards: 1–8 pick a tab, ← → step through them, Esc closes
  const onKey = e => {
    if (!document.body.contains(m)) { removeEventListener('keydown', onKey, true); return; } // the pad was closed some other way
    if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
    let k = -1; const cur = TABS.findIndex(t => t[0] === tab);
    if (/^Digit[1-9]$/.test(e.code)) k = +e.code.slice(5) - 1;
    else if (e.code === 'ArrowRight' || e.code === 'BracketRight') k = (cur + 1) % TABS.length;
    else if (e.code === 'ArrowLeft' || e.code === 'BracketLeft') k = (cur + TABS.length - 1) % TABS.length;
    if (k >= 0 && TABS[k]) { e.preventDefault(); e.stopImmediatePropagation(); SFX.tap(); tab = TABS[k][0]; draw(); }
  };
  addEventListener('keydown', onKey, true);
  const close = () => { cleanPage(); removeEventListener('keydown', onKey, true); m.close(); game.closePad(i); };

  function drawMap(body) {
    withSitePlaces(game.PLACES);
    const mine = game.myHouse?.home;
    const mapPlaces = mine ? [...game.PLACES, { key: 'myhouse', g: 'home', icon: '🏠', name: mine.name, x: mine.door.x, z: mine.door.z }] : game.PLACES;
    const S = 600, wrap = el('div', 'mapwrap'), cv = el('canvas', 'bigmap'); cv.width = cv.height = S; wrap.appendChild(cv); body.appendChild(wrap);
    body.appendChild(el('p', 'note center', T('Tap any picture on the map, or a place below, to fly there.', 'Chạm vào bất kỳ hình nào trên bản đồ, hoặc một nơi bên dưới, để bay đến đó.')));
    // the places, grouped by country and listed from north to south, like a real map: one group at a time,
    // picked from chips (the full list was too long to scroll)
    const GROUPS = [['home', '🏡', T('Our valley', 'Thung lũng nhà mình')], ['vn', '🇻🇳', T('Vietnam', 'Việt Nam')], ['au', '🇦🇺', T('Australia', 'Nước Úc')], ['asia', '🌏', T('China and India', 'Trung Quốc và Ấn Độ')], ['homes', '🏠', T('Homes', 'Nhà')]];
    const named = game.homes ? game.homes.list.filter(hm => hm.H) : [];
    // (round R, owner: "the map and its destinations should be more logical") each country's places from north to south
    // like the real map; under each place, what really belongs to it: its landmarks by real geography (Hạ Long and Tràng
    // An with Hà Nội in the north, Huế and Hội An with Đà Nẵng in the centre, the Mekong with Sài Gòn), a shop or a stage
    const itemsOf = g => {
      if (g === 'homes') return named.map(hm => ({ icon: '🏠', name: hm.name, go: () => game.landBy(hero, hm.door.x, hm.door.z) }));
      const all = mapPlaces.filter(pl => (pl.g || 'home') === g), tops = all.filter(pl => !pl.under).sort((a, b) => a.z - b.z), lms = game.LANDMARKS || [], out = [];
      // a landmark that is now a place of its own (Hội An) is listed as that place, no longer under the city near it
      const homeOf = l => mapPlaces.some(pl => pl.key === l.id) ? l.id : LANDMARK_HOME[l.id];
      for (const t of tops) {
        out.push({ icon: t.icon, name: t.name, go: () => game.travelTo(hero, t.x, t.z, !['memory_e', 'memory_w', 'myhouse'].includes(t.key)) });
        all.filter(pl => pl.under && pl.under === t.key).forEach(pl => out.push({ sub: true, icon: pl.icon, name: pl.name, go: () => game.travelTo(hero, pl.x, pl.z) }));
        lms.filter(l => homeOf(l) === t.key).forEach(l => out.push({ sub: true, icon: l.icon, name: l.name, go: () => game.travelTo(hero, l.x, l.z) }));
      }
      return out;
    };
    // (bug 28, owner: "too many destinations in one list") each country shows a fixed row of city chips; only the
    // picked city's places show under it, and a swipe moves to the next or previous city
    const citiesOf = g => { const out = []; itemsOf(g).forEach(it => { if (!it.sub || !out.length) out.push({ top: it, places: [] }); else out[out.length - 1].places.push(it); }); return out; };
    const groups = GROUPS.filter(([g]) => itemsOf(g).length);
    let gsel = groups.find(([g]) => g === openPad.mapLast) ? openPad.mapLast : groups[0][0], csel = openPad.mapCity || 0;
    const chips = el('div', 'hubtabs mapchips'), cityRow = el('div', 'hubtabs mapcities'), list = el('div', 'quick mapplaces');
    // (r63, owner: the Back and Next buttons are no use: the city chips above and a swipe change the city)
    const nav = el('div', 'mapnav');
    groups.forEach(([g, gi, gname]) => { const c = el('button', '', `<span>${pic(gi)}</span><small>${esc(gname)}</small>`); c.dataset.g = g; c.onclick = () => { gsel = openPad.mapLast = g; csel = openPad.mapCity = 0; SFX.tap(); fill(); }; chips.appendChild(c); });
    const step = d => { const n = citiesOf(gsel).length; if (n < 2) return; csel = openPad.mapCity = (csel + d + n) % n; SFX.tap(); fill(); };
    const fill = () => {
      chips.querySelectorAll('button').forEach(c => c.classList.toggle('on', c.dataset.g === gsel)); list.innerHTML = ''; cityRow.innerHTML = '';
      const cities = citiesOf(gsel); if (csel >= cities.length) csel = openPad.mapCity = 0;
      const many = gsel !== 'homes' && cities.length > 1;
      cityRow.hidden = !many;
      if (many) cities.forEach((c, k) => { const b = el('button', k === csel ? 'on' : '', `<span>${pic(c.top.icon)}</span><small>${esc(c.top.name())}</small>`); b.onclick = () => { csel = openPad.mapCity = k; SFX.tap(); fill(); }; cityRow.appendChild(b); });
      const cur = many ? cities[csel] : null, items = many ? [cur.top].concat(cur.places) : itemsOf(gsel);
      items.forEach(it => { const b = el('button', 'qbtn', `<span>${pic(it.icon)}</span><small>${esc(it.name())}</small>`); b.onclick = () => { close(); it.go(); }; list.appendChild(b); });
      const on = cityRow.querySelector('.on'); if (on) cityRow.scrollLeft = on.offsetLeft - (cityRow.clientWidth - on.offsetWidth) / 2;
    };
    let sx = null;
    list.addEventListener('touchstart', e => { sx = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
    list.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1); }, { passive: true });
    nav.appendChild(list);
    body.appendChild(chips); body.appendChild(cityRow); body.appendChild(nav); fill();
    const x = cv.getContext('2d'); x.drawImage(valleyPicture(S), 0, 0, S, S);   // (round T4b) drawn from the map data, no longer a picture of the world
    const k = S / SIZE, pt = (wx, wz) => [(wx + HALF) * k, (wz + HALF) * k];
    const spots = [];
    const icon = (ch, wx, wz, sz = 26) => { const [a, b] = pt(wx, wz); x.font = sz + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, a, b); };
    SHRINES.forEach(s => { const done = p.shrines[s.id]; const [a, b] = pt(s.x, s.z); x.fillStyle = done ? '#38c8f0' : '#ff8a2a'; x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.arc(a, b, 11, 0, Math.PI * 2); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.font = 'bold 13px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(done ? '✓' : '?', a, b + 1); spots.push({ x: s.x, z: s.z, name: GAMES[s.game] ? GAMES[s.game].name() : '' }); });
    TOWERS.forEach(t => { icon('🗼', t.x, t.z, 28); spots.push({ x: t.x, z: t.z, name: t.name() }); });
    // every main place, with a picture and its name
    mapPlaces.forEach(pl => {
      const [a, b] = pt(pl.x, pl.z); x.fillStyle = 'rgba(255,255,255,.92)'; x.beginPath(); x.arc(a, b, 22, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#ffb020'; x.lineWidth = 3; x.stroke();
      icon(pl.icon, pl.x, pl.z, 26);
      spots.push({ x: pl.x, z: pl.z, name: pl.name(), r: 14, snapToNpc: !['memory_e', 'memory_w', 'myhouse'].includes(pl.key) });
    });
    // (Release request, T1) each name goes under its picture, or above, right or left of it when that spot would cover
    // another name or picture, so places close together (the festival stage by Đà Nẵng) stay readable
    x.font = 'bold 14px Fredoka, "Baloo 2", sans-serif';
    const dots = mapPlaces.map(pl => pt(pl.x, pl.z)), labels = [];
    const hits = (r, q) => r.x < q.x + q.w && q.x < r.x + r.w && r.y < q.y + q.h && q.y < r.y + r.h;
    const cost = r => labels.filter(q => hits(r, q)).length * 1000 + dots.filter(([a, b]) => hits(r, { x: a - 22, y: b - 22, w: 44, h: 44 })).length + (r.x < 0 || r.y < 0 || r.x + r.w > S || r.y + r.h > S ? 100000 : 0);
    mapPlaces.forEach((pl, i) => {
      const [a, b] = dots[i], w = x.measureText(pl.name()).width + 12;
      const tries = [[a - w / 2, b + 24], [a - w / 2, b - 44], [a + 25, b - 10], [a - 25 - w, b - 10], [a - w / 2, b + 46], [a - w / 2, b - 66]].map(([lx, ly]) => ({ x: lx, y: ly, w, h: 20 }));
      // Dense clusters (the family home beside the farm shop) need more than six offsets.
      // Search outward without moving the destination itself or hiding either name.
      for (let radius = 24; radius <= 160; radius += 22) for (let j = 0; j < 16; j++) {
        const angle = j * Math.PI / 8;
        tries.push({ x: Math.max(2, Math.min(S - w - 2, a + Math.cos(angle) * radius - w / 2)), y: Math.max(2, Math.min(S - 22, b + Math.sin(angle) * radius - 10)), w, h: 20 });
      }
      let best = tries[0], bc = Infinity; for (const r of tries) { const c = cost(r); if (c < bc) { best = r; bc = c; } if (!c) break; }
      labels.push(Object.assign(best, { name: pl.name() }));
    });
    // (round T4b) soft clouds over the places not visited yet, drawn under the names so every name stays readable;
    // the first time the map opens after a visit, that place's cloud lifts with a little puff (once: remembered)
    const vis = p.visited || {}, lifted = p.mapClouds = p.mapClouds || {}, puffs = [];
    cv.clouds = [];
    const cloud = (a, b, s = 1) => { x.save(); x.shadowColor = 'rgba(80,90,120,.3)'; x.shadowBlur = 6; x.shadowOffsetY = 2; x.fillStyle = 'rgba(255,255,255,.94)'; x.beginPath();
      for (const [dx, dy, r] of [[-14, 4, 11], [0, -4, 15], [14, 3, 11], [0, 8, 13]]) { x.moveTo(a + dx * s + r * s, b + dy * s); x.arc(a + dx * s, b + dy * s, r * s, 0, Math.PI * 2); }
      x.fill(); x.restore(); };
    mapPlaces.forEach(pl => {
      if (pl.under || pl.key === 'myhouse') return; const rg = regionAt(pl.x, pl.z), seen = !!vis[rg], [a, b] = pt(pl.x, pl.z);
      if (!seen) { cloud(a, b - 4); cv.clouds.push({ region: rg, name: pl.name() }); }
      else if (!lifted[rg]) { lifted[rg] = true; puffs.push([a, b - 4]); }
    });
    labels.forEach(r => { x.fillStyle = 'rgba(255,255,255,.92)'; x.fillRect(r.x, r.y, r.w, r.h); x.fillStyle = '#3b2558'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(r.name, r.x + r.w / 2, r.y + 10); });
    cv.labels = labels; // read by the hubmap check
    if (puffs.length) { const fog = el('div', 'mapclouds'); wrap.appendChild(fog); SFX.chime && SFX.chime(); saveProfiles();
      for (const [a, b] of puffs) { const c = el('div', 'mapcloud puff'); c.style.left = (a / S * 100) + '%'; c.style.top = (b / S * 100) + '%'; fog.appendChild(c); c.addEventListener('animationend', () => c.remove()); } }
    // every ferry and raft stop (tap one to go there and wait for the boat)
    if (game.ferries) game.ferries.ferries.forEach(F => F.stops.forEach(st => { const t = st.dock.pier.tip; icon('⛴️', t.x, t.z, 16); spots.push({ x: t.x, z: t.z, name: '⛴️ ' + st.name(), r: 10 }); }));
    const q = game.questTarget(hero); if (q) { const [a, b] = pt(q.x, q.z); x.fillStyle = '#ff3b6b'; x.beginPath(); x.arc(a, b - 14, 9, 0, Math.PI * 2); x.moveTo(a - 7, b - 9); x.lineTo(a, b); x.lineTo(a + 7, b - 9); x.fill(); }
    game.heroes.forEach((h, j) => { const [a, b] = pt(h.pos.x, h.pos.z); x.save(); x.translate(a, b); x.rotate(-h.yaw + Math.PI); x.fillStyle = j === 0 ? '#ffd23f' : '#5fe0ff'; x.strokeStyle = '#3a2a10'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -12); x.lineTo(9, 10); x.lineTo(0, 5); x.lineTo(-9, 10); x.closePath(); x.fill(); x.stroke(); x.restore(); });
    // every friend online, with their name (tap them to walk, fly or ask them to come)
    Object.values<NonNullable<SvMain['partners']>[string]>(game.partners || {}).forEach(P => {
      if (P.pos.y < -40) return; const [a, b] = pt(P.pos.x, P.pos.z);
      x.fillStyle = '#2fa8ff'; x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.arc(a, b, 13, 0, Math.PI * 2); x.fill(); x.stroke();
      icon('🧒', P.pos.x, P.pos.z, 18);
      x.font = 'bold 14px Fredoka, "Baloo 2", sans-serif'; const w = x.measureText(P.name).width + 12; x.fillStyle = '#2fa8ff'; x.fillRect(a - w / 2, b - 36, w, 20); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(P.name, a, b - 26);
      spots.push({ x: P.pos.x, z: P.pos.z, name: P.name, r: 16, friend: P.id });
    });
    cv.onclick = e => {
      const q = local(cv, e), r = q.r, wx = q.x / r.width * SIZE - HALF, wz = q.y / r.height * SIZE - HALF;
      const s = spots.slice().sort((a, b) => Math.hypot(a.x - wx, a.z - wz) - Math.hypot(b.x - wx, b.z - wz)).find(s => Math.hypot(s.x - wx, s.z - wz) < (s.r || 10)); if (!s) return;
      const ok = el('div', 'travel', `<p>${T('Travel to', 'Bay đến')} <b>${esc(s.name)}</b>?</p><button class="btn primary">✨ ${T('Fly there', 'Bay đến đó')}</button><button class="btn walk">👣 ${T('Walk there', 'Đi bộ đến đó')}</button><button class="btn no">${T('No', 'Không')}</button>`);
      body.appendChild(ok);
      if (s.friend) {
        ok.querySelector('.primary').onclick = () => { close(); game.flyToFriend(hero, s.friend); };
        ok.querySelector('.walk').onclick = () => { close(); game.walkToFriend(hero, s.friend); };
        const c = el('button', 'btn', '📣 ' + T('Ask to come', 'Gọi bạn đến')); c.onclick = () => { close(); game.askFriendToCome(hero, s.friend); }; ok.insertBefore(c, ok.querySelector('.no'));
        ok.querySelector('.no').onclick = () => ok.remove(); return;
      }
      ok.querySelector('.primary').onclick = () => { close(); game.travelTo(hero, s.x, s.z, s.snapToNpc !== false); };
      ok.querySelector('.walk').onclick = () => { close(); hero.walkTo = { x: s.x, z: s.z, name: s.name }; say(`Follow the footprints to ${s.name}!`, `Đi theo dấu chân đến ${s.name} nhé!`); };
      ok.querySelector('.no').onclick = () => ok.remove();
    };
  }
  function drawBag(body) {
    // (Round V) what an ingredient is for: the dishes it goes into at a cooking pot
    const ingInfo = id => { const it = ITEMS[id], uses = RECIPES.filter(r => r.need.includes(id)), names = uses.map(r => r.name());
      const en = `${it.name()}: an ingredient. ${uses.length ? 'Cook it at a cooking pot to make ' + names.join(', ') + '.' : 'Cook it at a cooking pot.'}`, vi = `${it.name()}: nguyên liệu. ${uses.length ? 'Nấu ở nồi để làm ' + names.join(', ') + '.' : 'Nấu ở nồi nhé.'}`;
      return [T(en, vi), en, vi]; };
    const isGem = id => WILD[id] && WILD[id].kind === 'gem';
    const items = Object.entries<number>(p.inv).filter(([id, n]) => n > 0 && ITEMS[id] && !isGem(id)), gems = Object.entries<number>(p.inv).filter(([id, n]) => n > 0 && isGem(id)).sort((a, b) => WILD[b[0]].sell - WILD[a[0]].sell);
    const bought = Object.entries<number>(p.bought || {}).filter(([id, n]) => n > 0 && snackOf(id));
    const dishes = Object.entries<number>(p.dishes).filter(([, n]) => n > 0);
    body.innerHTML = `
      ${(p.pets || []).length ? `<button class="btn wide" id="bagPets">🐾 ${T('My pets', 'Thú cưng của con')}: ${(p.pets || []).map(pt => (PET_ICON[pt.kind] || '🐾') + ' ' + esc(pt.name || '')).join('  ')}</button>` : ''}
      <div class="bag-top"><button class="chip bagc" data-chip="money" title="${T('Coins', 'Đồng xu')}"><i>💰</i><b>${fmt(farm.coins)}</b><small>${T('Coins', 'Đồng xu')}</small></button><button class="chip bagc" data-chip="orbs" title="${T('Sparkle Orbs', 'Ngọc Lấp Lánh')}"><i>🔮</i><b>${p.orbs}</b><small>${T('Sparkle Orbs', 'Ngọc Lấp Lánh')}</small></button><button class="chip bagc" data-chip="leafy" title="${T('Leafies', 'Bạn Lá')}"><i>🍃</i><b>${Object.keys(p.leafies).length}/24</b><small>${T('Leafies', 'Bạn Lá')}</small></button></div>
      <h3>${T('Food', 'Món ăn')} <small>${T('tap to eat', 'chạm để ăn')}</small></h3>
      <div class="slots">${dishes.map(([id, n]) => { const r = dishInfo(id) || { icon: '🥘', name: () => T('Mystery stew', 'Món hầm bí ẩn') }; return `<button class="slot" data-eat="${id}" title="${esc(r.name() + ' · ' + T('tap to eat: hearts and energy back', 'chạm để ăn: thêm tim và sức'))}"><span>${r.icon}</span><b>${n}</b><small>${esc(r.name())}</small></button>`; }).join('') || `<p class="note">${T('Cook at a cooking pot to make food.', 'Nấu ăn ở nồi nấu để có món ăn.')}</p>`}</div>
      <h3>🛍️ ${T('From shops and stalls', 'Mua ở quán và sạp')} <small>${T('tap to eat', 'chạm để ăn')}</small></h3>
      <div class="slots">${bought.map(([id, n]) => { const v = snackOf(id); return `<button class="slot" data-snack="${id}" title="${esc(T(v.food[1], v.food[2]) + ' · ' + T('tap to eat', 'chạm để ăn'))}"><span>${v.food[0]}</span><b>${n}</b><small>${esc(T(v.food[1], v.food[2]))}</small></button>`; }).join('') || `<p class="note">${T('Buy food at kiosks, market stalls and from street sellers. It goes in here!', 'Mua đồ ăn ở quán, sạp chợ và các cô gánh hàng rong. Đồ mua sẽ nằm ở đây!')}</p>`}</div>
      <h3>💎 ${T('Treasures', 'Báu vật')} <small>${T('tap for help', 'chạm để xem hướng dẫn')}</small></h3>
      <div class="slots">${gems.map(([id, n]) => `<button class="slot gemslot" data-sellgem="${id}" title="${esc(WILD[id].name() + ' · ' + T('a treasure: choose Sell one in its help card', 'báu vật: chọn Bán một trong hướng dẫn'))}"><span>${WILD[id].icon}</span><b>${n}</b><small>${esc(WILD[id].name()) + ' · ' + fmt(WILD[id].sell)}</small></button>`).join('') || `<p class="note">${T('Dig at the sparkly mounds of earth and crack rocks open to find treasures!', 'Đào ở những ụ đất lấp lánh và gõ vỡ hòn đá để tìm báu vật!')}</p>`}</div>
      <h3>${T('Ingredients', 'Nguyên liệu')}</h3>
      <div class="slots">${items.map(([id, n]) => `<button class="slot" data-ing="${id}" title="${esc(ingInfo(id)[0])}"><span>${ITEMS[id].icon}</span><b>${n}</b><small>${esc(ITEMS[id].name())}</small></button>`).join('') || `<p class="note">${T('Empty! Shake apple trees and look for herbs and mushrooms.', 'Trống trơn! Rung cây táo và tìm rau thơm, nấm nhé.')}</p>`}</div>
      ${(() => { const SLOT_ICON = { hat: '👒', neck: '📿', top: '👕', bottom: '👖', feet: '👟', back: '🪽' }; // (Round U, owner 11 Oct: everything bought shows here until it is worn) the clothes and accessories the child owns
        const itemSVG = it => game.shop && game.shop.itemSVG ? game.shop.itemSVG(it) : pic(SLOT_ICON[it.slot] || '👕'), mine = CLOTHES.filter(it => owns(p, it.id) && it.for === (setOfLook(p.look) === 'girl' ? 'g' : 'b')), off = mine.filter(it => p.look[it.slot] !== it.id), on = mine.filter(it => p.look[it.slot] === it.id);
        const hats = HATS.concat(REWARD_HATS.filter(h => p.owned.hats.includes(h))).filter(h => h !== 'none' && !ITEM[h]);
        return `<h3>${pic('👕')} ${T('Clothes and accessories', 'Quần áo và phụ kiện')} <small>${T('tap to wear', 'chạm để mặc')}</small></h3>
      <div class="slots">${off.map(it => `<button class="slot" data-wear="${it.id}" title="${esc(T(it.en, it.vi))}">${itemSVG(it)}<small>${esc(T(it.en, it.vi))}</small></button>`).join('')}${hats.filter(h => p.look.hat !== h).map(h => `<button class="slot" data-hat="${h}"><span>${HAT_ICON[h]}</span><small>${esc(HAT_NAME[h]())}</small></button>`).join('')}${!off.length && !hats.filter(h => p.look.hat !== h).length ? `<p class="note">${T('Everything you have is on! Find more at the clothes shop.', 'Con đang mặc hết đồ rồi! Ghé cửa hàng quần áo để mua thêm nhé.')}</p>` : ''}</div>
      ${on.length || (p.look.hat && p.look.hat !== 'none' && !ITEM[p.look.hat]) ? `<h3>${T('Wearing now', 'Đang mặc')} <small>${T('tap to take off', 'chạm để cởi ra')}</small></h3>
      <div class="slots">${on.map(it => `<button class="slot on" data-unwear="${it.slot}" title="${esc(T(it.en, it.vi))}">${itemSVG(it)}<small>${esc(T(it.en, it.vi))}</small></button>`).join('')}${p.look.hat && p.look.hat !== 'none' && !ITEM[p.look.hat] && HAT_ICON[p.look.hat] ? `<button class="slot on" data-hat="none"><span>${HAT_ICON[p.look.hat]}</span><small>${esc(HAT_NAME[p.look.hat] ? HAT_NAME[p.look.hat]() : '')}</small></button>` : ''}</div>` : ''}`; })()}
      ${(() => { // (r79, owner 16 Oct) clothes of the other set, bought to give away: wrapped gift boxes, one tile for each kind
        const gifts = (p.owned && p.owned.gifts || []).filter(id => ITEM[id]), kinds = [...new Set(gifts)];
        return kinds.length ? `<h3>🎁 ${T('Gifts to give', 'Quà để tặng')} <small>${T('tap to give', 'chạm để tặng')}</small></h3>
      <div class="slots">${kinds.map(id => { const it = ITEM[id], n = gifts.filter(x => x === id).length; return `<button class="slot giftbox" data-gift="${id}" title="${esc(T(it.en, it.vi))}"><span>🎁</span>${n > 1 ? `<b>${n}</b>` : ''}<small>${esc(T(it.en, it.vi))}</small></button>`; }).join('')}</div>` : ''; })()}
      <h3>🪁 ${T('Whistling kite', 'Diều sáo')}</h3>
      <div class="slots">${p.kite ? `<button class="slot ${p.kiteOn !== false ? 'on' : ''}" data-kite="1"><span>🪁</span><small>${p.kiteOn !== false ? T('Flying', 'Đang bay') : T('Put away', 'Cất đi')}</small></button><button class="slot" data-whistle="1"><span>🎶</span><small>${T('Whistle!', 'Thổi sáo!')}</small></button>` : `<p class="note">${T('Win the Kite Flying game to get a kite with a bamboo flute that sings in the wind!', 'Thắng trò Thả Diều để nhận diều sáo hát vi vu trong gió!')}</p>`}</div>
      ${game.hoilang ? game.hoilang.bagHTML(p) : ''}
      <h3>${T('Glider', 'Cánh lượn')}</h3>
      <div class="slots">${p.glider ? p.owned.gliders.map(g => `<button class="slot ${p.look.glider === g ? 'on' : ''}" data-gl="${g}"><span class="sw big" style="background:${GLIDERS[g]}"></span></button>`).join('') : `<p class="note">${T('Not yet! Ông Cú has something for you…', 'Chưa có! Ông Cú có món quà cho con đấy…')}</p>`}</div>`;
    jumpNav(body, body.querySelector('.bag-top')); // (owner, 13 Oct AEDT: the Backpack's section-button row back, after the tester's notes took it out)
    // (Round V, owner 13 Oct) food asks first ("Eat it?"); an ingredient says what it is and which dishes it makes
    // (r79, owner point 14: the "Eat it?" question was too big) food asks in one small row: the picture, "Eat it?" and the
    // two buttons; what the food does is said aloud, not written out
    const helpCard = (name, art, en, vi, action, run, small: boolean | undefined = undefined) => {
      body.querySelector('.bag-help')?.remove();
      const c = small
        ? el('div', 'bag-help bag-ask' + (p.age !== 'big' ? ' little' : ''), `${art}<b><span class="nm">${esc(name)}</span><small>${T('Eat it?', 'Ăn nhé?')}</small></b><button class="btn primary bh-act">${action}</button><button class="btn bh-close">${T('Not now', 'Để sau')}</button>`)
        : el('div', 'bag-help', `<div>${art}<b>${esc(name)}</b></div><p>${esc(T(en, vi))}</p><div class="actions">${action ? `<button class="btn primary bh-act">${action}</button>` : ''}<button class="btn bh-close">${T('Not now', 'Để sau')}</button></div>`);
      c.setAttribute('role', 'region'); c.setAttribute('aria-label', name); body.appendChild(c); say(`${name}. ${en}`, `${name}. ${vi}`);
      c.querySelector('.bh-close').onclick = () => { c.remove(); run?.(false); };
      if (action) c.querySelector('.bh-act').onclick = () => { c.remove(); run?.(true); }; return c;
    };
    const askEat = (name, icon, en, vi) => new Promise(resolve => { SFX.tap(); helpCard(name, pic(icon), 'Eat it? ' + en, 'Ăn nhé? ' + vi, T('Eat', 'Ăn'), resolve, true); });
    body.querySelectorAll('[data-eat]').forEach(b => b.onclick = async () => { const r = dishInfo(b.dataset.eat) || { icon: '🥘', heal: 1, name: () => T('Mystery stew', 'Món hầm bí ẩn') };
      if (await askEat(r.name(), r.icon, `Restores up to ${r.heal} hearts and refills energy. Hearts only fall for older children on Hard.`, `Hồi tối đa ${r.heal} tim và nạp năng lượng. Chỉ trẻ lớn ở mức Khó mới mất tim.`)) game.eat(hero, b.dataset.eat); draw(); });
    body.querySelectorAll('[data-snack]').forEach(b => b.onclick = async () => { const v = snackOf(b.dataset.snack);
      if (await askEat(T(v.food[1], v.food[2]), v.food[0], 'a treat from the market.', 'một món ngon mua ở chợ.')) eatSnack(game, hero, b.dataset.snack, true); draw(); });
    body.querySelectorAll('[data-ing]').forEach(b => b.onclick = () => { SFX.tap(); const [line, en, vi] = ingInfo(b.dataset.ing); toast(line); say(en, vi); });
    body.querySelectorAll('[data-sellgem]').forEach(b => b.onclick = () => {
      const id = b.dataset.sellgem, w = WILD[id];
      if (!(p.inv[id] > 0)) return;
      p.inv[id]--; if (p.inv[id] <= 0) delete p.inv[id]; farm.coins += w.sell; saveFarm(); game.save(); SFX.coin();
      say(`Sold! Now you have ${money(farm.coins)}.`, `Bán rồi! Giờ con có ${money(farm.coins)}.`); game.job && game.job('sell', 1, hero); draw();
    });
    if (body.querySelector('#bagPets')) body.querySelector('#bagPets').onclick = () => { m.close(); game.closePad(i); setTimeout(() => game.pets.openAdopt(hero), 220); };
    body.querySelectorAll('[data-hat]').forEach(b => b.onclick = () => { p.look.hat = b.dataset.hat; saveProfiles(); game.rebuildHero(i); SFX.ok(); draw(); });
    body.querySelectorAll('[data-wear]').forEach(b => b.onclick = () => { const it = ITEM[b.dataset.wear]; if (it && wearItem(p, it.slot, it.id)) { saveProfiles(); game.rebuildHero(i); SFX.ok(); draw(); } });
    body.querySelectorAll('[data-unwear]').forEach(b => b.onclick = () => { if (wearItem(p, b.dataset.unwear, 'none')) { saveProfiles(); game.rebuildHero(i); SFX.tap(); draw(); } });
    // (r79) a gift box says what is inside and who it is for, and offers the players on this device it fits
    body.querySelectorAll('[data-gift]').forEach(b => b.onclick = () => {
      SFX.tap(); const id = b.dataset.gift, it = ITEM[id], girls = it.for === 'g', name = T(it.en, it.vi);
      const friends = profiles.filter(q => q.id !== p.id && setOfLook(q.look) === (girls ? 'girl' : 'boy'));
      const en = `A wrapped gift: ${it.en}, made for ${girls ? 'girls' : 'boys'}. ${friends.length ? 'Choose who to give it to.' : 'Give it to a friend when you play together: trade it at your market stall.'}`;
      const vi = `Một món quà đã gói: ${it.vi}, dành cho ${girls ? 'bé gái' : 'bé trai'}. ${friends.length ? 'Chọn bạn để tặng nhé.' : 'Khi chơi cùng bạn, tặng ở sạp hàng của con nhé.'}`;
      body.querySelector('.bag-help')?.remove();
      const c = el('div', 'bag-help', `<div>${b.querySelector('svg, .art')?.outerHTML || ''}<b>${esc(name)}</b></div><p>${esc(T(en, vi))}</p><div class="actions">${friends.map(q => `<button class="btn primary bh-give" data-to="${q.id}">${T('Give to', 'Tặng')} ${esc(q.name)}</button>`).join('')}<button class="btn bh-close">${T('Not now', 'Để sau')}</button></div>`);
      c.setAttribute('role', 'region'); c.setAttribute('aria-label', name); body.appendChild(c); say(en, vi);
      c.querySelector('.bh-close').onclick = () => c.remove();
      c.querySelectorAll('.bh-give').forEach(g => g.onclick = () => { const q = profiles.find(x => x.id === g.dataset.to), r = giveGift(p, q, id);
        if (r.ok) { saveProfiles(true); SFX.ok(); say(`You gave ${it.en} to ${q.name}. How kind!`, `Con đã tặng ${it.vi} cho ${q.name}. Con tốt bụng quá!`); toast(T(`Given to ${q.name}`, `Đã tặng ${q.name}`)); } draw(); });
    });
    body.querySelectorAll('[data-kite]').forEach(b => b.onclick = () => { p.kiteOn = p.kiteOn === false; saveProfiles(); game.kites.sync(); SFX.ok(); if (p.kiteOn) game.kites.whistle(hero); draw(); });
    body.querySelectorAll('[data-whistle]').forEach(b => b.onclick = () => { game.kites.whistle(hero); });
    game.hoilang && game.hoilang.bindBag(body, hero, draw); // (round S) carry a village festival prize, like the kite
    body.querySelectorAll('[data-gl]').forEach(b => b.onclick = () => { p.look.glider = +b.dataset.gl; saveProfiles(); game.rebuildHero(i); SFX.ok(); draw(); });
    // Help is the first tap; every change requires an explicit action inside the same Bag.
    for (const b of body.querySelectorAll('.slot')) {
      if (b.dataset.eat || b.dataset.snack || b.dataset.gift) continue;
      const oldAction = b.onclick, name = b.querySelector('small')?.textContent || b.title || T('Item', 'Đồ dùng');
      const it = ITEM[b.dataset.wear], ingredient = b.dataset.ing, treasure = WILD[b.dataset.sellgem];
      let en = 'Keep this item in your Backpack and use its action when you need it.', vi = 'Giữ món này trong Ba lô và chọn hành động khi cần.';
      // (r79, owner point 12) every kind of thing says what it is and what the button does
      if (it || b.dataset.hat || b.dataset.unwear) { en = 'Clothes and accessories change how your character looks.'; vi = 'Quần áo và phụ kiện thay đổi vẻ ngoài của nhân vật.'; }
      if (it) { const sl = WEAR_SLOTS.find(x => x.id === it.slot); en = `Clothes from the shop (${sl ? sl.en.toLowerCase() : 'clothes'}). Tap Wear to put it on; the mirror in the Shop shows everything you own.`; vi = `Quần áo mua ở cửa hàng (${sl ? sl.vi.toLowerCase() : 'quần áo'}). Chạm Mặc để mặc vào; cái gương trong Cửa hàng cho xem mọi đồ con có.`; }
      if (b.dataset.unwear) { en = 'You are wearing this now. Tap Take off to take it off; it stays in your Backpack.'; vi = 'Con đang mặc món này. Chạm Cởi ra để cởi; nó vẫn ở trong Ba lô.'; }
      if (b.dataset.hat && b.dataset.hat !== 'none' && !ITEM[b.dataset.hat]) { en = 'A hat you won on an adventure. Tap Wear to put it on.'; vi = 'Chiếc mũ con giành được trong chuyến phiêu lưu. Chạm Mặc để đội.'; }
      if (b.dataset.hat === 'none') { en = 'The hat you won, on your head now. Tap Take off to take it off.'; vi = 'Chiếc mũ con giành được, đang đội trên đầu. Chạm Cởi ra để bỏ mũ.'; }
      if (b.dataset.hlcarry) { en = 'A prize you won at the village festival. Carry it to show everyone, or put it away. It is a keepsake in your house too.'; vi = 'Phần quà con giành được ở hội làng. Mang theo cho mọi người xem, hoặc cất đi. Nó cũng là kỷ vật trong nhà con.'; }
      if (b.dataset.gl) { en = 'Choose the colour of your glider for flying safely from high places.'; vi = 'Chọn màu cánh lượn để bay an toàn từ nơi cao.'; }
      if (b.dataset.kite || b.dataset.whistle) { en = 'Your whistling kite follows you; its bamboo flute sings in the wind.'; vi = 'Diều sáo bay theo con; sáo tre hát trong gió.'; }
      if (ingredient) { const info = ingInfo(ingredient); en = info[1]; vi = info[2]; }
      if (treasure) { en = `A treasure you found. Sell one for ${money(treasure.sell)} or keep it.`; vi = `Báu vật con tìm được. Bán một món lấy ${money(treasure.sell)} hoặc giữ lại.`; }
      const action = treasure ? T('Sell one', 'Bán một') : b.dataset.unwear || b.dataset.hat === 'none' ? T('Take off', 'Cởi ra') : b.dataset.wear || b.dataset.hat ? T('Wear', 'Mặc') : b.dataset.kite ? (p.kiteOn !== false ? T('Put away', 'Cất đi') : T('Fly', 'Thả diều')) : b.dataset.hlcarry ? (p.hoilang?.carryOn !== false && p.hoilang?.carry === b.dataset.hlcarry ? T('Put away', 'Cất đi') : T('Carry', 'Mang theo')) : b.dataset.whistle ? T('Whistle', 'Thổi sáo') : b.dataset.gl !== undefined ? T('Choose', 'Chọn') : T('Use', 'Dùng');
      b.onclick = () => { const art = b.querySelector('svg, .art, .sw')?.outerHTML || ''; helpCard(name, art, en, vi, oldAction && !ingredient ? action : '', ok => { if (ok) { oldAction?.call(b); } }); };
    }

  }
  // (round R, owner 9 Oct) side stories in their own list: the child picks one to follow on the goal bar
  const sideHTML = () => { const list = game.sideStories ? game.sideStories() : []; if (!list.length) return '';
    return `<h3>${T('Side stories', 'Truyện phụ')}</h3><div class="sides">${list.map(sd => { const st = sd.status(p), on = p.follow === sd.id;
      return `<div class="side ${st.done ? 'done' : ''}"><span>${pic(sd.icon)}</span><div><b>${esc(sd.title())}</b><small>${st.done ? T('Finished!', 'Xong rồi!') : esc(st.step)}</small></div>${st.done || !st.started ? '' : `<button class="btn ${on ? 'on' : ''}" data-follow="${sd.id}">${on ? T('Following', 'Đang theo') : T('Follow', 'Theo truyện này')}</button>`}</div>`; }).join('')}</div>`; };
  // (tester's notes, 12 Oct) what a dish not cooked yet needs: every ingredient, the ones in the bag bright with a tick,
  // the ones still to find faded, so a child can see what is collected for which recipe
  const recNeed = r => r.need.map((n, k) => { const have = (p.inv[n] || 0) >= r.need.slice(0, k + 1).filter(x => x === n).length;
    return `<i class="${have ? 'have' : 'miss'}">${ITEMS[n].icon}${have ? '<b class="tick">✅</b>' : ''}</i>`; }).join(' + ');
  function drawLog(body) {
    const next = game.currentQuest(p);
    // (daily adventure, chat C, 16 Oct AEDT; ADV-1) today's adventure on top; everything else behind "More adventures"
    const advTop = game.adventure ? game.adventure.logHTML(p) : '';
    // (owner, 17 Oct AEDT: "show both") the family's missions stay in sight above the button: a grown-up holds ✓ there
    const famLog = game.parents ? game.parents.logHTML(p) : '';
    body.innerHTML = (advTop ? advTop + famLog + `<button class="adv-morebtn" aria-expanded="false">${esc(T('More adventures', 'Thêm phiêu lưu'))}</button><div class="adv-more" hidden>` : famLog) + sideHTML() + (game.coop ? game.coop.html() : '') + (game.chests ? game.chests.html(p) : '') + `<h3>${T('Main adventure', 'Cuộc phiêu lưu chính')}</h3><ol class="quests">${QUESTS.map(q => { const done = !!p.quests[q.id] || (q.check && q.check(p)); return `<li class="${done ? 'done' : q === next ? 'now' : ''}"><span>${done ? '✅' : q.icon}</span>${esc(q.title())}</li>`; }).join('')}</ol>
      <p class="note">✨ ${T('Shrines solved', 'Đền đã giải')}: ${Object.keys(p.shrines).length}/12 · 🗼 ${T('Towers', 'Tháp')}: ${Object.keys(p.towers).length}/4 · 🍳 ${T('Recipes', 'Công thức')}: ${Object.keys(p.dishes).length}/${RECIPES.length}</p>
      <h3>🍳 ${T('Cooking recipes', 'Sổ công thức nấu ăn')}</h3><div class="recipes">${RECIPES.map(r => { const known = p.dishes[r.id] != null; return `<div class="rec ${known ? '' : 'unk'}"><span>${known ? r.icon : '❔'}</span><small>${known ? esc(r.name()) : recNeed(r)}</small></div>`; }).join('')}</div>${advTop ? '</div>' : ''}`;
    if (advTop) {
      const more = body.querySelector('.adv-more'), mb = body.querySelector('.adv-morebtn');
      mb.onclick = () => { more.hidden = !more.hidden; mb.setAttribute('aria-expanded', String(!more.hidden)); };
      body.querySelector('[data-advopen]').onclick = () => { close(); game.adventure.openWindow(i); };
    }
    body.querySelectorAll('[data-follow]').forEach(b => b.onclick = () => { p.follow = p.follow === b.dataset.follow ? null : b.dataset.follow; saveProfiles(); SFX.ok(); game.checkQuests && game.checkQuests(hero); draw(); });
    game.parents && game.parents.bindLog(body, hero, draw); // (round S) a grown-up holds ✓ on a family mission
  }
  // (sticker book, owner plan 16 Oct AEDT, chat B) the Album tab is the sticker book: tabs by theme, pages of 3 x 3, a
  // count and a progress bar, missing stickers as a grey shape with "?" and a hint (spoken on tap), the prize at the
  // bottom (STK-1 to STK-6). The scrapbook, family postcards, photos, words, storybook and food passport stay below it.
  function drawAlbum(body) {
    sbSync(p);
    const little = p.age !== 'big', all = SB_PAGES.filter(x => x.theme === sbAt.theme);
    if (!all.length) sbAt.theme = SB_THEMES[0].id;
    const pages = SB_PAGES.filter(x => x.theme === sbAt.theme), page = pages[Math.min(sbAt.page[sbAt.theme] || 0, pages.length - 1)], th = SB_THEMES.find(t => t.id === page.theme);
    // STK-3: a page is never empty: its welcome sticker comes as a present the first time it is opened
    const gift = sbWelcome(page, p);
    const fresh = new Set(sbFresh(p)), got = sbPageCount(page, p), full = got === page.stickers.length;
    const prize = full && !sbPrizeWon(page, p) ? sbClaimPrize(page, p) : null, won = sbPrizeWon(page, p);
    const tile = st => { const have = sbHas(st.id, p), isNew = have && fresh.has(st.id), shiny = have && sbIsShiny(st.id, p);
      return have
        ? `<button class="stk-tile have${isNew ? ' new' : ''}${shiny ? ' shiny' : ''}" data-sid="${st.id}" aria-label="${esc(T(st.en, st.vi))}"><span class="stk-pic">${pic(st.icon)}</span><b class="stk-name">${esc(T(st.en, st.vi))}</b>${isNew ? `<span class="stk-new">${T('New!', 'Mới!')}</span>` : ''}</button>`
        : `<button class="stk-tile miss" data-miss="${st.id}" aria-label="${esc(T(st.hint[0], st.hint[1]))}"><span class="stk-pic stk-ghost">${pic(st.icon)}<b class="stk-q">?</b></span><small class="stk-hint">${esc(T(st.hint[0], st.hint[1]))}</small></button>`; };
    const newIn = t => sbFresh(p).filter(id => SB_BY_ID[id] && SB_BY_ID[id].theme === t).length;
    body.innerHTML = `<div class="stkbook${little ? ' little' : ''}" style="--c:${th.color}">
      <div class="stk-tabs" role="tablist" aria-label="${T('Sticker pages', 'Các trang hình dán')}">${SB_THEMES.map(t => `<button role="tab" data-th="${t.id}" aria-selected="${t.id === th.id}" class="${t.id === th.id ? 'on' : ''}" style="--c:${t.color}"><span>${pic(t.icon)}</span><small>${esc(T(t.tab[0], t.tab[1]))}</small>${newIn(t.id) ? `<i class="stk-dot">${newIn(t.id)}</i>` : ''}</button>`).join('')}</div>
      <section class="stk-page${won ? ' won' : ''}" data-page="${page.key}">
        <div class="stk-head"><b class="stk-title">${esc(T(th.en, th.vi))}${page.of > 1 ? ` <small>${page.n + 1}/${page.of}</small>` : ''}</b><span class="stk-got">${got} / ${page.stickers.length}</span></div>
        <div class="stk-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${page.stickers.length}" aria-valuenow="${got}"><i style="width:${Math.round(got / page.stickers.length * 100)}%"></i></div>
        <div class="stk-grid">${page.stickers.map(tile).join('')}</div>
        ${page.of > 1 ? `<div class="stk-nav"><button class="stk-prev" ${page.n ? '' : 'disabled'} aria-label="${T('Page before', 'Trang trước')}">${pic('⬅️')}</button><span class="stk-dots">${pages.map((x, k) => `<i class="${k === page.n ? 'on' : ''}${sbPageFull(x, p) ? ' full' : ''}"></i>`).join('')}</span><button class="stk-next" ${page.n < page.of - 1 ? '' : 'disabled'} aria-label="${T('Next page', 'Trang sau')}">${pic('➡️')}</button></div>` : ''}
        <div class="stk-fly" hidden></div>
        <div class="stk-prize${won ? ' won' : ''}"><span class="stk-frame" aria-hidden="true"></span>${won
          ? `<span>${T('Golden frame won! A present is in your house.', 'Con được khung vàng! Có quà trong nhà con.')}</span><button class="btn stk-song">${pic('🎵')} ${T('My song', 'Bài hát của con')}</button>`
          : `<span>${T(SB_LINES.prize[0], SB_LINES.prize[1])}</span>`}</div>
      </section></div>
      <div class="stk-more">
        <button class="btn wide big" id="scrapBtn">📒 ${T('My scrapbook: decorate with stickers and photos', 'Sổ dán hình: trang trí bằng hình dán và ảnh')}</button>
        ${th.id === 'friends' ? familyCardsHTML(p) : ''}
        ${albumMoreHTML()}
      </div>`;
    const sb = body.querySelector('.stkbook');
    sb.querySelectorAll('[data-th]').forEach(b => b.onclick = () => { SFX.tap(); sbAt.theme = b.dataset.th; const t = SB_THEMES.find(x => x.id === b.dataset.th); say(t.en, t.vi); drawAlbum(body); foldHeadings(body, 'album'); });
    const go = d => { SFX.tap(); sbAt.page[th.id] = Math.max(0, Math.min(page.of - 1, page.n + d)); drawAlbum(body); foldHeadings(body, 'album'); };
    const pv = sb.querySelector('.stk-prev'), nx = sb.querySelector('.stk-next'); if (pv) pv.onclick = () => go(-1); if (nx) nx.onclick = () => go(1);
    // STK-6: a sticker they have says its name in both languages and plays its sound; the "New!" badge goes (STK-5)
    sb.querySelectorAll('[data-sid]').forEach(b => b.onclick = () => { const st = SB_BY_ID[b.dataset.sid]; sbSeen(st.id, p); b.classList.remove('new'); const n = b.querySelector('.stk-new'); if (n) n.remove(); stickerSound(st); stickerName(st); game.stickerBadges && game.stickerBadges(); });
    // STK-2: a missing one says where to find it; a postcard or a place can be flown to, as before
    sb.querySelectorAll('[data-miss]').forEach(b => b.onclick = () => { SFX.tap(); const st = SB_BY_ID[b.dataset.miss]; say(st.hint[0], st.hint[1]); toast(T(st.hint[0], st.hint[1]));
      const fly = sb.querySelector('.stk-fly'), w = st.earn.find(x => x.postcard), l = w && LANDMARKS.find(x => x.id === w.postcard);
      fly.hidden = !l; if (l) { fly.innerHTML = `<button class="btn primary big" data-fly="${l.id}">${pic('✈️')} ${T('Fly there', 'Bay đến đó')}: ${esc(l.name())}</button>`;
        fly.querySelector('[data-fly]').onclick = () => { close(); game.travel(hero, l.x, l.z + (l.id === 'uluru' ? -4 : 3)); }; } });
    const song = sb.querySelector('.stk-song'); if (song) song.onclick = () => { SFX.tap(); if (Music.key === th.song) Music.stop(); else Music.play(th.song, true); };
    if (gift) { toast(`${T(SB_LINES.gift[0], SB_LINES.gift[1])} ${T(gift.en, gift.vi)}`); say(SB_LINES.gift[0], SB_LINES.gift[1]); }
    if (prize) { confetti(); SFX.fanfare(); say(SB_LINES.full[0], SB_LINES.full[1]); try { Music.play(th.song, true); } catch (e) { } }
    bindFamilyCards(body, toast);
    body.querySelector('#scrapBtn').onclick = () => { m.close(); game.closePad(i); setTimeout(() => game.openScrapbook(hero), 220); };
    bindAlbumMore(body);
    game.stickerBadges && game.stickerBadges();
  }
  // the album's other parts, kept as they were (each folds open and shut): food passport, words, storybook, photos
  function albumMoreHTML() {
    const tasted = p.tasted || {}, words = Object.keys(p.words || {});
    return `<h3>🍜 ${T('Food passport', 'Hộ chiếu ẩm thực')} ${Object.keys(tasted).length}/${VENDORS.length}</h3><div class="secrets">${VENDORS.map(v => `<div class="sec ${tasted[v.id] ? 'on' : ''}"><span>${tasted[v.id] ? v.food[0] : '❔'}</span><small>${tasted[v.id] ? esc(T(v.food[1], v.food[2])) : esc(v.name)}</small></div>`).join('')}</div>
      <h3>🗣️ ${T('Words I learned', 'Từ con đã học')} ${words.length}</h3><div class="wordlist">${words.map(k => { const [kind, w] = [k.slice(0, 2), k.slice(3)];
        // (r79 A3, owner 16 Oct: pictures fell below and across the rows, empty circles on the left) one row each: the
        // word's picture, its words, and a button to hear it again, all inside the row and lined up; (owner, 17 Oct
        // AEDT: the round speaker was not understood) the button is a big coloured "Listen / Nghe" pill
        const row = (icon, flag, words, say) => `<div class="wl-row"><span class="wl-pic">${icon}</span><span class="wl-txt"><i class="wl-flag">${flag}</i> ${words}</span><button class="wl-say" data-wsay="${esc(JSON.stringify(say))}" aria-label="${T('Hear it', 'Nghe lại')}"><span class="wl-ico">🔊</span><b>${T('Listen', 'Nghe')}</b></button></div>`;
        if (kind === 'au') { const s = AUSSIE_SLANG.find(x => x[0] === w); return s ? row(s[3], '🇦🇺', `<b>${esc(s[0])}</b> = ${esc(T(s[1], s[2]))}`, [`${s[0]} means ${s[1]}`, `${s[0]} nghĩa là ${s[2]}`]) : ''; }
        if (kind === 'vs') { const s = VN_SLANG.find(x => x[0] === w); return s ? row(s[3], '🇻🇳', `<b>${esc(s[0])}</b> = ${esc(T(s[1], s[2]))}`, [`${s[0]} means ${s[1]}`, `${s[0]}: ${s[2]}`]) : ''; }
        const v = VN_WORDS.find(x => x[1] === w); return v ? row(v[0], '🇻🇳', `Bắc <b>${esc(v[2])}</b> · Trung <b>${esc(v[3])}</b> · Nam <b>${esc(v[4])}</b>`, [`${v[1]}: in the north ${v[2]}, in the middle ${v[3]}, in the south ${v[4]}`, `Miền Bắc nói ${v[2]}, miền Trung nói ${v[3]}, miền Nam nói ${v[4]}`]) : ''; }).join('') || `<p class="note">${T('Ask the market sellers and the Aussie shopkeepers to teach you a word!', 'Hỏi các cô chú bán hàng ở chợ và ở Góc Nước Úc để học từ mới nhé!')}</p>`}</div>
      <h3>📖 ${T('Storybook', 'Sách truyện')}</h3><div class="stories">${storyList(p).map((st, k) => `<button class="qbtn" data-st="${k}"><span>📖</span><small>${esc(st.title())}</small></button>`).join('')}</div>
      <h3>${T('Photos', 'Ảnh chụp')}</h3><div class="photos">${p.album.map((src, k) => `<figure><img src="${src}" alt=""><button class="btn" data-dl="${k}">⬇</button></figure>`).join('') || `<p class="note">${T('Use the Camera tab to take pictures of your adventure!', 'Dùng thẻ Máy ảnh để chụp ảnh chuyến phiêu lưu!')}</p>`}</div>`;
  }
  function bindAlbumMore(body) {
    body.querySelectorAll('[data-st]').forEach(b => b.onclick = () => showStory(storyList(p)[+b.dataset.st], p.name));
    body.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => savePhoto(p.album[+b.dataset.dl]));
    body.querySelectorAll('[data-wsay]').forEach(b => b.onclick = () => { SFX.tap(); const [en, vi] = JSON.parse(b.dataset.wsay); say(en, vi); });   // (r79 A3) a learned word, heard again
  }
  function drawGames(body) {
    body.innerHTML = `<p class="note">${T('Play any game you have already found again. Every win makes the next one a little harder.', 'Chơi lại các trò con đã tìm thấy. Mỗi lần thắng, trò chơi sẽ khó hơn một chút.')}</p><div class="gamelist"></div>`;
    const list = body.querySelector('.gamelist');
    const found = new Set([...SHRINES.filter(s => p.shrines[s.id]).map(s => s.game), ...Object.keys(p.levels)]);
    (Object.values(GAMES) as { id: string; icon: string; name: () => string }[]).forEach(g => {
      const ok = found.has(g.id);
      const b = el('button', 'gcard' + (ok ? '' : ' locked'), `<span>${ok ? g.icon : '🔒'}</span><b>${esc(ok ? g.name() : '???')}</b>${ok ? `<small>${T('Level', 'Cấp')} ${p.levels[g.id] || 1}</small>` : ''}`);
      if (ok) b.onclick = () => { close(); game.playGame(i, g.id, 'pad'); }; // (r79 point 7: closing the game comes back here)
      list.appendChild(b);
    });
  }
  // a photo into the device's own Photos (js/photos.js): iPhone/iPad through the share sheet ("Save Image"),
  // Android and computers as a download
  async function savePhoto(src) {
    const how = await saveToDevice(src);
    if (how === 'downloaded') toast(T('Saved to the phone: look in Photos or Gallery (Downloads).', 'Đã lưu vào máy: xem trong Ảnh hoặc Thư viện (Tải về).'));
    if (how === 'failed') toast(T('Could not save the picture on this device.', 'Không lưu được ảnh trên máy này.'));
  }
  // the festival calendar (round R): only a calendar, nothing to visit from it
  function drawCal(body) {
    body.innerHTML = `<div class="fcal">${festCalendarHTML(game)}</div>`;
  }
  function drawCam(body) {
    const howTo = savesByShare() ? T('Then tap “Save to my photos” and choose “Save Image”.', 'Rồi chạm “Lưu vào ảnh của máy” và chọn “Lưu hình ảnh”.') : T('Then tap “Save to my photos”.', 'Rồi chạm “Lưu vào ảnh của máy”.');
    body.innerHTML = `<div class="cam-prev"></div><div class="actions center"><button class="btn primary big" id="snap">📷 ${T('Take picture', 'Chụp ảnh')}</button><button class="btn big" id="toPhone" hidden>📲 ${T('Save to my photos', 'Lưu vào ảnh của máy')}</button></div><p class="note center">${T('Pictures are kept in your Album.', 'Ảnh được giữ trong Bộ sưu tập.')} ${howTo}</p>`;
    let big = null;
    body.querySelector('#snap').onclick = async () => {
      m.style.visibility = 'hidden'; await wait(60);
      const shot = game.snapshot(i); big = game.snapshot(i, 1600, .9); m.style.visibility = '';
      SFX.chime();
      body.querySelector('.cam-prev').innerHTML = `<img src="${shot}" alt="">`;
      body.querySelector('#toPhone').hidden = false;
      p.album.push(shot); if (p.album.length > 12) p.album.shift(); saveProfiles();
      say('Click! What a lovely picture!', 'Tách! Bức ảnh đẹp quá!');
    };
    body.querySelector('#toPhone').onclick = () => { if (big) { SFX.tap(); savePhoto(big); } };
  }
  // Friends redraws only its own page, never the tabs and ✕; while a finger is down it waits (round O, owner: the
  // screen got stuck: it was rebuilt whole as the signal changed, so taps landed on buttons that had just gone)
  function drawFriend(body) {
    let down = false, again: ReturnType<typeof setTimeout> | 0 = 0;
    body.addEventListener('pointerdown', () => { down = true; }, true);
    const onUp = () => { down = false; };
    addEventListener('pointerup', onUp, true);
    const redraw = () => { clearTimeout(again); if (!body.isConnected) return; if (down) { again = setTimeout(redraw, 300); return; } game.drawOnlinePanel(body, redraw); };
    pageCleanups.push(() => { clearTimeout(again); removeEventListener('pointerup', onUp, true); if (game.onNet === redraw) game.onNet = null; });
    game.drawOnlinePanel(body, redraw);
  }
  draw();
  return { close };
}, openPadProperties);

// ---------- cooking ----------
export function openCooking(game, i) {
  const hero = game.heroes[i], p: Profile = hero.profile;
  const m = modal('cook', '');
  const card = m.querySelector('.card');
  const pot = [];
  const draw = () => {
    const have = Object.entries<number>(p.inv).map(([id, n]): [string, number] => [id, n - pot.filter(x => x === id).length]).filter(([, n]) => n > 0);
    card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>🍲 ${T('Cooking pot', 'Nồi nấu ăn')}</h2>
      <p class="sub">${T('Put up to 3 things in the pot. Try different mixes to discover Vietnamese dishes!', 'Cho tối đa 3 thứ vào nồi. Thử trộn khác nhau để khám phá món ăn Việt Nam!')}</p>
      <div class="potbox">${[0, 1, 2].map(k => `<button class="pslot" data-k="${k}">${pot[k] ? ITEMS[pot[k]].icon : ''}</button>`).join('')}</div>
      <div class="slots">${have.map(([id, n]) => `<button class="slot" data-add="${id}"><span>${ITEMS[id].icon}</span><b>${n}</b><small>${esc(ITEMS[id].name())}</small></button>`).join('') || `<p class="note">${T('Your backpack is empty. Find ingredients or buy them from Cô Mai.', 'Ba lô trống rồi. Tìm nguyên liệu hoặc mua ở chỗ Cô Mai nhé.')}</p>`}</div>
      <button class="btn primary wide big" id="cookGo" ${pot.length ? '' : 'disabled'}>🔥 ${T('Cook!', 'Nấu!')}</button>`;
    card.querySelector('.x').onclick = () => m.close();
    card.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { if (pot.length < 3) { pot.push(b.dataset.add); SFX.pop(pot.length); draw(); } });
    card.querySelectorAll('.pslot').forEach(b => b.onclick = () => { pot.splice(+b.dataset.k, 1); draw(); });
    card.querySelector('#cookGo').onclick = async () => {
      const r = findRecipe(pot); if (!r) return;
      pot.forEach(id => { p.inv[id]--; if (p.inv[id] <= 0) delete p.inv[id]; });
      const isNew = p.dishes[r.id] == null;
      p.dishes[r.id] = (p.dishes[r.id] || 0) + 1; pot.length = 0; saveProfiles();
      card.innerHTML = `<div class="cooking"><div class="steam">♨️</div><div class="potbig">🍲</div></div>`; SFX.cook();
      await wait(1800); m.close();
      await reward(r.icon, T(`You made ${r.name()}!`, `Con đã nấu ${r.name()}!`), isNew ? T('New recipe! It is in your Backpack.', 'Công thức mới! Món ăn ở trong Ba lô.') : '');
      say(`Yum! ${r.name()}!`, `Ngon quá! ${r.name()}!`);
      game.onCooked(hero, r);
    };
  };
  draw();
}

// ---------- shop ----------
export function openShop(game, i) {
  const hero = game.heroes[i], p: Profile = hero.profile;
  const m = modal('shop', '');
  const card = m.querySelector('.card');
  const draw = () => {
    card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>🛒 ${T("Cô Mai's stall", 'Sạp hàng Cô Mai')}</h2>
      <p class="sub">💰 ${T('You have', 'Con có')} <b>${fmt(farm.coins)}</b> ${cur().flag}</p>
      <div class="shoplist">${SHOP.map((s, k) => {
        const owned = s.kind === 'hat' && typeof s.id === 'string' ? p.owned.hats.includes(s.id) : s.kind === 'glider' && typeof s.id === 'number' ? p.owned.gliders.includes(s.id) : false;
        const ic = s.kind === 'item' ? ITEMS[s.id].icon : s.kind === 'hat' ? HAT_ICON[s.id] : `<span class="sw big" style="background:${GLIDERS[s.id]}"></span>`;
        const nm = s.kind === 'item' ? ITEMS[s.id].name() : s.kind === 'hat' ? HAT_NAME[s.id]() : T('Glider colour', 'Màu cánh lượn');
        return `<button class="sitem ${owned ? 'owned' : ''} ${farm.coins < s.price && !owned ? 'poor' : ''}" data-k="${k}"><span class="si">${ic}</span><small>${esc(nm)}</small><b>${owned ? '✓' : fmt(s.price)}</b></button>`;
      }).join('')}</div>`;
    card.querySelector('.x').onclick = () => m.close();
    card.querySelectorAll('.sitem').forEach(b => b.onclick = () => {
      const s = SHOP[+b.dataset.k];
      const owned = s.kind === 'hat' && typeof s.id === 'string' ? p.owned.hats.includes(s.id) : s.kind === 'glider' && typeof s.id === 'number' ? p.owned.gliders.includes(s.id) : false;
      if (owned) return;
      if (s.kind === 'glider' && !p.glider) { say('You need a glider first!', 'Con cần có cánh lượn trước đã!'); return; }
      if (farm.coins < s.price) { SFX.no(); say(`That costs ${fmt(s.price)}. Play games to earn more money!`, `Món này giá ${fmt(s.price)}. Chơi trò chơi để có thêm tiền nhé!`); return; }
      farm.coins -= s.price; SFX.coin();
      if (s.kind === 'item') p.inv[s.id] = (p.inv[s.id] || 0) + 1;
      if (s.kind === 'hat' && typeof s.id === 'string') { p.owned.hats.push(s.id); p.look.hat = s.id; game.rebuildHero(i); }
      if (s.kind === 'glider' && typeof s.id === 'number') { p.owned.gliders.push(s.id); p.look.glider = s.id; game.rebuildHero(i); }
      saveProfiles(); say('Thank you! Here you go!', 'Cảm ơn con! Của con đây!'); draw();
    });
  };
  draw();
}

// ---------- wardrobe (for the children: pictures only, changes show live on the character) ----------
export function openWardrobe(game, i, onClose) {
  if (game.shop && game.shop.on()) return game.shop.openWardrobe(i, onClose); // (round S) what the child owns from the clothes shop
  const p = game.heroes[i].profile;
  const m = el('div', 'wardrobe');
  document.body.appendChild(m);
  const rows: [string, string[], (value: string) => string][] = [
    ['style', STYLES, v => STYLE_ICON[v]], ['color', OUTFIT_COLORS, v => `<span class="sw big" style="background:${v}"></span>`],
    ['hat', HATS, v => HAT_ICON[v]], ['back', BACKS, v => ({ none: '🙂', wings: '🧚', cape: '🦸' }[v])],
    ['hairStyle', HAIRSTYLES, v => ({ short: '💇', buns: '🎀', long: '👩', ponytail: '🐴', spiky: '🦔' }[v])], ['hair', HAIR, v => `<span class="sw big" style="background:${v}"></span>`]
  ];
  const draw = () => {
    m.innerHTML = `<button class="x" aria-label="${T('Done', 'Xong')}">✔️</button>` + rows.map(([k, list, r]) => `<div class="wrow">${list.map(v => `<button class="chip ${p.look[k] === v ? 'on' : ''}" data-k="${k}" data-v="${v}">${r(v)}</button>`).join('')}</div>`).join('');
    m.querySelector('.x').onclick = () => { m.remove(); saveProfiles(); SFX.chime(); say('You look wonderful!', 'Con trông tuyệt quá!'); onClose && onClose(); };
    m.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { p.look[b.dataset.k] = b.dataset.v; SFX.pop(1); game.rebuildHero(i); draw(); });
  };
  draw(); say('Dress up time! Tap the pictures to try things on.', 'Thay đồ nào! Chạm vào hình để thử nhé.');
}

// ---------- grown-ups record the game's most-used lines (one at a time, with a level meter) ----------
// Recording controls use the same optional settings module.
export function openRecorder(after?: () => void): Promise<void> {
  return import('./ui-settings.js').then(m => m.openRecorder(after)).catch(error => { window.svModuleGone?.(error); after?.(); });
}

const FOLK_SHOW = ['music', 'firstwords', 'tangram', 'snakes', 'rangoli', 'words', 'mrwolf', 'cricket', 'parcel', 'sackrace', 'chuyen', 'dragon', 'datnieu', 'kite', 'chichi', 'marbles', 'skipping', 'dacau', 'snap', 'tienlen', 'oantuti', 'nemlon', 'oanquan', 'hopscotch', 'tug', 'caro', 'goat'];
export const folkGames = () => FOLK_SHOW;
// The Play hub's game tabs (round R, owner: "rearrange the menu so it is more logical"). Every game is in exactly one
// tab, by what kind of game it is, from the same list as the Simple screen's areas (js/content/activities.js), so a
// game the family moves in Studio moves in both. Inside a tab the games are grouped under their area's name.
const HUB_TABS = [
  { key: 'learn', icon: '📚', short: () => T('Learning', 'Học'), title: () => T('Numbers, letters, shapes and me', 'Số, chữ, hình và em'), areas: ['numbers', 'words', 'shapes', 'me', 'money'] }, // (round S: the money games join Learning)
  { key: 'folk', icon: '🪁', short: () => T('Folk games', 'Dân gian'), title: () => T('Folk games to play together', 'Trò chơi dân gian chơi cùng nhau'), areas: ['vietnam', 'play'] },
  { key: 'animals', icon: '🐶', short: () => T('Animals and music', 'Con vật, âm nhạc'), title: () => T('Animals and music', 'Con vật và âm nhạc'), areas: ['animals', 'music'] },
  { key: 'art', icon: '🎨', short: () => T('Pictures', 'Tranh'), title: () => T('Colours, pictures and puzzles', 'Màu sắc, tranh và ghép hình'), areas: ['art'] },
  { key: 'places', icon: '🚋', short: () => T('Going places', 'Đi đây đi đó'), title: () => T('Games in the cities and on the road', 'Trò chơi ở thành phố và trên đường'), areas: ['travel'] },
  { key: 'thinking', icon: '🧠', short: () => T('Big thinkers', 'Suy nghĩ giỏi'), title: () => T('Big thinkers: puzzles and strategy', 'Suy nghĩ giỏi: đố và chiến thuật'), areas: ['thinking'] }
];
HUB_TABS[0].areas.splice(HUB_TABS[0].areas.indexOf('words') + 1, 0, 'reading'); // (Play reading trial) the Reading corner in the Learning tab
const AREA_OF = Object.fromEntries(AREAS.map(a => [a.key, a]));
// each tab with its games (built when asked, so the family's Studio changes are in it)
const hubSections = () => HUB_TABS.map(t => ({ ...t, groups: t.areas.map(a => ({ area: AREA_OF[a], games: gamesIn(GAMES, a, false).map(g => g.id) })).filter(g => g.games.length) })).map(t => ({ ...t, games: t.groups.flatMap(g => g.games) }));
export const HUB = HUB_TABS;
// The game after this one in the Games hub (the tab the child last used first), for "Next game" after a win.
export function nextGameAfter(id) {
  const secs = hubSections().sort((a, b) => Number(b.key === openGamesHub.last) - Number(a.key === openGamesHub.last));
  for (const sec of secs) { const list = sec.games.filter(g => GAMES[g]), k = list.indexOf(id); if (k >= 0) return list[(k + 1) % list.length]; }
  return null;
}
const HUB_COLORS = ['#ff7eb8', '#ffb52e', '#5fd39a', '#3cc7e8', '#9a6bff', '#ff8a5a'];
const openGamesHubProperties: { last?: string; scroll?: number; unfolded: Set<string>; soon?: string } = { unfolded: new Set() };
export const openGamesHub = Object.assign(function (game, i, onClose) {
  const p = game.heroes[i].profile;
  const m = modal('hub', ''), card = m.querySelector('.card');
  const close = () => { m.close(); onClose && onClose(); };
  // one category at a time, picked from a row of tabs (the whole list was too long to scroll on a phone)
  // games first (by kind), then things to watch and listen to, then the festival calendar
  const SECS = hubSections();
  const tabs = [...SECS, ...(game.taleShelfHTML ? [{ key: 'tales', icon: '📖', short: () => T('Stories', 'Truyện') }] : []), ...(game.openSongs ? [{ key: 'songs', icon: '🎵', short: () => T('Songs', 'Bài hát') }] : []), ...(game.festivals ? [{ key: 'fest', icon: '📅', short: () => T('Festivals', 'Lễ hội') }] : [])];
  let cur = tabs.find(t => t.key === openGamesHub.last) ? openGamesHub.last : 'learn';
  // (r90, owner 24 Oct AEDT) a card per game a child can play; the games still to unlock fold into one padlock tile
  // (one tap shows them), and the new games held back in Studio (New games off) into one "Coming soon" tile
  const gameCard = (id, k, key, open) => {
      const g = GAMES[id], lv = p.levels[id] || 1;
      return `<div class="hcard ${open ? "" : "locked"}" style="--hc:${HUB_COLORS[(k + key.length) % HUB_COLORS.length]}"><button class="hplay" data-play="${id}" ${open ? "" : "disabled"}><span class="hi">${pic(open ? g.icon : '\u{1F512}')}</span><b>${esc(g.name())}</b><small>${'⭐'.repeat(lv)}${'☆'.repeat(5 - lv)}</small></button><button class="hgo" data-go="${id}" aria-label="${T('Go there', 'Đi đến đó')}">📍</button><button class="hhow" data-how="${id}" aria-label="${T('How to play', 'Cách chơi')}">📺</button>${g.origin ? `<span class="hflag">${originFlags(g.origin)}</span>` : ''}</div>`;
  };
  const card2 = sec => {
    const area = sec.area || sec.key, ids = sec.games.filter(id => GAMES[id]);
    const open = ids.filter(id => isOpen(p, id, 'game', area)), locked = ids.filter(id => !open.includes(id));
    const heldIds = secondSetOf('game', area).filter(id => GAMES[id] && isHeld(id, 'game')), held = heldIds.length, shown = openGamesHub.unfolded.has(area);
    const lockTile = locked.length ? `<div class="hcard hfold" style="--hc:#b9a6e8"><button class="hplay" data-fold="${area}" aria-expanded="${shown}"><span class="hi">${pic('\u{1F512}')}</span><b>${shown ? T('Hide', 'Thu gọn') : T(`${locked.length} more to unlock`, `Còn ${locked.length} trò để mở`)}</b><small>${shown ? '' : T('Play each game above 3 times', 'Chơi mỗi trò ở trên 3 lần')} · ${pic('⭐')} ${progressOf(p, 'game', area).done}/3</small></button></div>` : '';
    // (owner, 30 Oct 2026 AEDT: "it doesn't say how many stars are needed; give a guide so kids understand what they
    // need") the tile shows how far the child is (each game here won 3 times) and opens the list of those games
    const prog = progressOf(p, 'game', area), ready = prog.perGame.filter(g => g.n >= 3).length, total = prog.perGame.length, soonOpen = openGamesHub.soon === area;
    const soonTile = held ? `<div class="hcard hsoon" style="--hc:#9ad0ff"><button class="hplay" data-soon="${area}" aria-expanded="${soonOpen}"><span class="hi">${pic('\u{1F51C}')}</span><b>${T(`${held} new games coming`, `Sắp có ${held} trò mới`)}</b><small>${total ? T(`Win each game 3 times: ${ready}/${total}`, `Thắng mỗi trò 3 lần: ${ready}/${total}`) : T('On their way!', 'Sắp đến rồi!')}</small><span class="hsoonbar" aria-hidden="true"><i style="width:${total ? Math.round(ready / total * 100) : 100}%"></i></span></button></div>${soonOpen ? `<div class="hsoonbubble" role="dialog" aria-label="${T('New games coming', 'Trò mới sắp có')}"><i class="hsb-dot a"></i><i class="hsb-dot b"></i><p>${T('Coming soon:', 'Sắp có:')}</p><div class="hsb-games">${heldIds.map(id => `<span><span class="hi">${pic(GAMES[id].icon)}</span>${esc(GAMES[id].name())}</span>`).join('')}</div></div>` : ''}${soonOpen && total ? `<div class="hsoonlist"><p>${T('Win each of these games 3 times to open the new games:', 'Thắng mỗi trò này 3 lần để mở trò mới nhé:')}</p>${prog.perGame.map(g => `<div class="hsoonrow${g.n >= 3 ? ' done' : ''}"><span class="hi">${pic(GAMES[g.id]?.icon || '\u{1F3AE}')}</span><b>${esc(GAMES[g.id]?.name() || g.id)}</b><span class="hsoonstars">${[0, 1, 2].map(k => pic(k < g.n ? '\u2B50' : '\u2606')).join('')}</span></div>`).join('')}${ready === total ? `<p class="hsoonok">${T('All done! The new games are on their way.', 'Xong hết rồi! Trò mới đang trên đường đến.')}</p>` : ''}</div>` : ''}` : '';
    return `<div class="hubgrid">${open.map((id, k) => gameCard(id, k, sec.key, true)).join('')}${lockTile}${shown ? locked.map((id, k) => gameCard(id, k + open.length, sec.key, false)).join('') : ''}${soonTile}</div>`;
  };
  const body = key => {
    if (key === 'fest') return `<h3>📅 ${T('Festival calendar', 'Lịch lễ hội')}</h3>${festCalendarHTML(game)}`;
    if (key === 'tales') return `<h3>📖 ${T('Fairy tales', 'Truyện cổ tích')}</h3><p class="sub">${T('Tap a story: you fly to Grandma Storyteller and she reads it to you.', 'Chạm vào truyện: con bay đến chỗ Bà Kể Chuyện và bà kể cho con nghe.')}</p><div class="talelib">${game.taleShelfHTML(p)}</div>`;
    if (key === 'songs') {
      // (round O, owner: songs belong with the games, not in Settings) one big button per group; it opens the Songs page there
      const fam = familySongs().length, groups = SONG_GROUPS.filter(g => g.key === 'family' ? fam : SONG_LIST.some(s => s.group === g.key && Music.has(s.key)));
      return `<h3>🎵 ${T('Songs: tap to listen', 'Bài hát: chạm để nghe')}</h3><div class="festrow songrow">${groups.map(g => `<button class="festbtn" data-songs="${g.key}"><span>${pic(g.icon)}</span><b>${esc(g.name())}</b></button>`).join('')}</div>`;
    }
    const sec = SECS.find(x => x.key === key) || SECS[0]; return `<h3>${sec.icon} ${esc(sec.title())}</h3>${sec.groups.map(g => `${sec.groups.length > 1 ? `<h4 class="hubarea">${pic(g.area.icon)} ${esc(g.area.name())}</h4>` : ''}${card2({ key: sec.key + g.area.key, area: g.area.key, games: g.games })}`).join('')}`;
  };
  card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>🎮 ${T('Play', 'Vui chơi')}</h2>
    <div class="hubtabs" role="tablist">${tabs.map(t => `<button role="tab" data-tab="${t.key}"><span>${pic(t.icon)}</span><small>${esc(t.short())}</small></button>`).join('')}</div>
    <div class="hubbody"></div>`;
  const draw = () => {
    card.querySelectorAll('.hubtabs [data-tab]').forEach(b => { const on = b.dataset.tab === cur; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    const hb = card.querySelector('.hubbody'); hb.innerHTML = body(cur); hb.scrollTop = openGamesHub.scroll || 0;
    bind(hb);
  };
  card.querySelectorAll('.hubtabs [data-tab]').forEach(b => b.onclick = () => { cur = openGamesHub.last = b.dataset.tab; openGamesHub.scroll = 0; SFX.tap(); draw(); const row = b.parentElement; row.scrollTo({ left: b.offsetLeft - row.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' }); }); // sideways only: the page must not jump
  card.querySelector('.x').onclick = close;
  const bind = root => {
    root.querySelectorAll('[data-tale]').forEach(b => b.onclick = () => { close(); game.readTale(i, b.dataset.tale); });
    if (game.bindTaleShelf) game.bindTaleShelf(root, () => { openGamesHub.scroll = root.scrollTop; draw(); });
    root.querySelectorAll('[data-songs]').forEach(b => b.onclick = () => { SFX.tap(); close(); game.openSongs(b.dataset.songs); });
    root.querySelectorAll('[data-fold]').forEach(b => b.onclick = () => { SFX.tap(); const k = b.dataset.fold; if (openGamesHub.unfolded.has(k)) openGamesHub.unfolded.delete(k); else { openGamesHub.unfolded.add(k); say('Finish the games above 3 times each to unlock these.', 'Chơi xong mỗi trò ở trên 3 lần để mở những trò này nhé.'); } openGamesHub.scroll = root.scrollTop; draw(); });
    root.querySelectorAll('[data-soon]').forEach(b => b.onclick = () => { SFX.tap(); const k = b.dataset.soon; openGamesHub.soon = openGamesHub.soon === k ? '' : k; if (openGamesHub.soon) say('Win each game here 3 times to open the new games!', 'Thắng mỗi trò ở đây 3 lần để mở trò mới nhé!'); openGamesHub.scroll = root.scrollTop; draw(); if (openGamesHub.soon) root.querySelector('.hsoonbubble')?.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' }); });
    root.querySelectorAll('[data-play]').forEach(b => b.onclick = () => { const id = b.dataset.play; close(); openGamesHub.scroll = root.scrollTop; game.meetAndPlay(i, id, 'hub'); });
    root.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { close(); game.goToGame(i, b.dataset.go); });
    root.querySelectorAll('[data-how]').forEach(b => b.onclick = () => { const id = b.dataset.how; openHowTo(id, { onPlay: () => { close(); game.playGame(i, id, 'hub'); } }); });
  };
  draw();
  say('Which game shall we play?', 'Mình chơi trò gì nào?');
}, openGamesHubProperties);
