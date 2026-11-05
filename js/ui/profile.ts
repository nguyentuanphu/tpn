// The child's profile (split from js/ui.ts, v1.07): who's playing and the player editor.
import { T, nm } from '../i18n.js';
import { settings, saveSettings, profiles, saveProfiles, addProfile, removeProfile, STYLES, OUTFIT_COLORS, HATS, BACKS, HAIR, SKIN, HAIRSTYLES, MAX_KIDS } from '../state.js';
import { say, spoken } from '../voice.js';
import { SFX } from '../audio.js';
import { el, esc, $, clamp } from '../util.js';
import { featureOn } from '../custom.js';
import { DEFAULT_OUTFITS, outfitOf } from '../content/shop.js';
import { avatarURL } from '../avatar.js';
import { holdButton } from '../popups.js';
import { HAT_ICON } from '../data.js';
import { ICONS } from '../icons.js';
import { pic } from '../art.js';
import { modal } from '../popups.js';
import { STYLE_ICON, STYLE_NAME, toast } from './common.js';
import { openGrownups } from './grownups.js';
// (v1.08b friends) the Welcome steps, the card and the friend row load when needed (check startup: not in the first download)
const friendsUI = () => import('./friends-ui.js');
import { friendsOf, defaultFriend, FRIENDS, suitId } from '../content/friends.js';
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
    s.querySelector('.go').onclick = () => { if (chosen.length !== need) return; SFX.chime(); s.remove(); const list = chosen.map(id => profiles.find(p => p.id === id)); if (list.some(p => p && p.friendCard === 'due')) friendsUI().then(U => U.newFriendsCards(list, () => onGo(mode, list))); else onGo(mode, list); }; // (v1.08b friends) the one-time card first
    holdButton(s.querySelector('.grown'), () => openGrownups(draw));
  };
  draw();
  document.fonts?.ready.then(() => { if (s.isConnected && profiles.length) draw(); }).catch(() => { });
}
// ---------- Player editor with photo cropping ----------
export function openEditor(profile, after, pre?) {
  const isNew = !profile;
  // (v1.08b friends) a new player first chooses a name, boy or girl, a friend and a skin tone (js/ui/friends-ui.ts)
  if (isNew && !pre) { friendsUI().then(U => U.welcomeFriend({}, r => r ? openEditor(null, after, r) : after && after(null))); return; }
  const p = profile || addProfile();
  if (pre) Object.assign(p.look, { set: pre.set, style: pre.set === 'girl' ? 'dress' : 'shirt', friend: pre.friend, suit: suitId(pre.friend, 'everyday'), skin: pre.skin }), p.name = pre.name.trim().slice(0, 16), p.friendCard = 'seen';
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
    <div class="field"><span>${T('Difficulty', 'Độ khó')}</span><div class="seg diff"><button data-d="easy">🌱 ${T('Easy', 'Dễ')}</button><button data-d="medium">🌿 ${T('Medium', 'Vừa')}</button><button data-d="hard">🌳 ${T('Hard', 'Khó')}</button><button data-d="talent" class="talentbtn">🌟 ${T('Talent', 'Tài năng')}</button></div></div>
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
  const ageBtns = () => m.querySelectorAll('.seg.age:not(.scr) button').forEach(b => { b.classList.toggle('on', b.dataset.a === age); b.onclick = () => { age = b.dataset.a; ageBtns(); diffBtns(); }; });
  ageBtns();
  let scr = p.screen || null; // unset: follows the age (under 5: Simple)
  const scrBtns = () => m.querySelectorAll('.seg.scr button').forEach(b => { b.classList.toggle('on', b.dataset.s === (scr || (age === 'big' ? 'valley' : 'simple'))); b.onclick = () => { scr = b.dataset.s; scrBtns(); }; });
  scrBtns(); m.querySelectorAll('.seg.age:not(.scr) button').forEach(b => b.addEventListener('click', () => scrBtns()));
  let diff = p.difficulty || 'easy';
  const diffBtns = () => m.querySelectorAll('.seg.diff button').forEach(b => { b.hidden = b.dataset.d === 'talent' && age !== 'big'; if (b.hidden && diff === 'talent') diff = 'hard'; b.classList.toggle('on', b.dataset.d === diff); b.onclick = () => { diff = b.dataset.d; diffBtns(); }; });
  diffBtns();
  chips('#cHair', HAIR, 'hair', v => `<span class="sw" style="background:${v}"></span>`);
  chips('#cSkin', SKIN, 'skin', v => `<span class="sw" style="background:${v}"></span>`);
  if (featureOn('shop', true)) shopOutfits(m, look, isNew); // (round S) hats, necklaces and the rest come from the shop
  friendField(m, look); // (v1.08b friends)
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
  draw(); box.addEventListener('click', () => box.dispatchEvent(new Event('sv-set'))); m.querySelector('#cCol').hidden = true; ['#cHat', '#cBack'].forEach(id => { m.querySelector(id).closest('.field').hidden = true; });
  { const lab = box.closest('.field').querySelector('span'); if (lab) lab.textContent = T('I am a…', 'Con là…'); }   // (Round V, owner 13 Oct) girl or boy, chosen when the character is made: the shop sells that set
}
// ---- (round S) end ----
// (v1.08b friends) the friend row under "I am a…": the two friends of the child's set; changing set (only here, in
// Grown-ups › Children › Edit or when the character is made) moves to that set's default friend. Hair and clothes come
// from the friend, so the old hair rows are hidden (the old fields stay in the save).
function friendField(m, look) {
  const out = m.querySelector('#cOut').closest('.field'), f = el('div', 'field fr-field');
  f.innerHTML = `<span>${T('My friend', 'Bạn của con')}</span><div class="fr-cards small" id="cFriend"></div>`; out.after(f);
  let R: typeof import('./friends-row.js') = null;
  const draw = () => {
    if (!R) return void import('./friends-row.js').then(m => { R = m; draw(); });
    const set = look.set === 'girl' ? 'girl' : 'boy';
    if (!FRIENDS[look.friend] || FRIENDS[look.friend].set !== set) { look.friend = defaultFriend(set); look.suit = suitId(look.friend, 'everyday'); }
    const box = f.querySelector('#cFriend'); box.innerHTML = friendsOf(set).map(id => R.friendCard(id, look.friend === id)).join('');
    box.querySelectorAll('[data-friend]').forEach((b: HTMLElement) => b.onclick = () => { R.setFriend({ look }, b.dataset.friend as any); SFX.pop(1); R.sayHello(look.friend); draw(); });
  };
  m.querySelector('#cOut').addEventListener('sv-set', draw); draw();
  m.querySelector('#cHs').closest('.field').hidden = true;
}
