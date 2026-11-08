// The child's profile (split from js/ui.ts, v1.07): who's playing and the player editor.
import { T, nm } from '../i18n.js';
import { settings, saveSettings, profiles, saveProfiles, addProfile, removeProfile, STYLES, OUTFIT_COLORS, HATS, BACKS, HAIR, SKIN, HAIRSTYLES, MAX_KIDS } from '../state.js';
import { say, spoken } from '../voice.js';
import { SFX } from '../audio.js';
import { el, esc, $, clamp } from '../util.js';
import { featureOn } from '../custom.js';
import { DEFAULT_OUTFITS, outfitOf } from '../content/shop.js';
import { avatarURL, friendsReady } from '../avatar.js';
import { holdButton } from '../popups.js';
import { HAT_ICON } from '../data.js';
import { ICONS } from '../icons.js';
import { pic } from '../art.js';
import { modal } from '../popups.js';
import { STYLE_ICON, STYLE_NAME, toast } from './common.js';
import { openGrownups } from './grownups.js';
// (v1.08b friends) the Welcome steps, the card and the friend row load when needed (check startup: not in the first download)
const friendsUI = () => import('./friends-ui.js');
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
    // (v1.08b friends) a child without a photo gets a round picture of their friend's model in their skin tone, made once
    // the screen is showing (js/friend-view.ts: loaded later, never in the first download)
    const noPhoto = profiles.filter(p => !p.photo && p.look && p.look.friend);
    if (noPhoto.length) import('../friend-view.js').then(V => noPhoto.forEach(p => V.friendPortrait(p.look.friend, p.look.skin).then(u => { const im = u && s.querySelector(`.pick[data-id="${p.id}"] img`) as HTMLImageElement; if (im) im.src = u; }))).catch(() => { });
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
    s.querySelector('.go').onclick = () => { if (chosen.length !== need) return; SFX.chime(); s.remove(); const list = chosen.map(id => profiles.find(p => p.id === id)); friendsReady().catch(() => null).then(() => { if (list.some(p => p && p.friendCard === 'due')) friendsUI().then(U => U.newFriendsCards(list, () => onGo(mode, list))); else onGo(mode, list); }); }; // (v1.08b friends) the one-time card first
    holdButton(s.querySelector('.grown'), () => openGrownups(draw));
  };
  draw();
  document.fonts?.ready.then(() => { if (s.isConnected && profiles.length) draw(); }).catch(() => { });
  // (v1.08b friends) the friends' data: every old save moves once, then the cards show each child's friend
  friendsReady().then(() => { if (s.isConnected && profiles.length) draw(); }).catch(() => { });
}
// ---------- Player editor with photo cropping ----------
// (v1.08 startup, PERF-001) js/ui/editor.ts, loaded when it is opened
export function openEditor(profile, after, pre?) {
  void import('./editor.js').then(m => m.openEditor(profile, after, pre)).catch(e => console.warn('editor', e));
}
