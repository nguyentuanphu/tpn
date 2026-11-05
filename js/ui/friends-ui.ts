// (v1.08b friends) Choosing a friend: the Welcome steps for a new player (name, boy or girl, friend and skin tone), the
// one-time "New friends are here!" card for an old save, and the friend row of the Backpack's "Character & Outfits".
// Plan: docs/plans/new-friends-characters.md. The pictures are our own renders (icons/friends/, from the gallery).
import { T } from '../i18n.js';
import { SKIN, saveProfiles } from '../state.js';
import { say } from '../voice.js';
import { SFX } from '../audio.js';
import { esc } from '../util.js';
import { modal } from '../popups.js';
import { friendsOf, friendOf, defaultFriend, type FriendId } from '../content/friends.js';
import { friendPic, friendCard, sayHello, setFriend } from './friends-row.js';
import { setOf } from '../content/shop.js';

const skinRow = (skin: string) => `<div class="fr-skins" role="group" aria-label="${T('Skin tone', 'Màu da')}">${SKIN.map((s, i) => `<button class="fr-skin${s === skin ? ' on' : ''}" data-skin="${s}" style="background:${s}" aria-label="${T('Skin tone', 'Màu da')} ${i + 1}" aria-pressed="${s === skin}"></button>`).join('')}</div>`;

/** The Welcome steps for a new player: name → boy or girl → friend and skin tone. done(null) when cancelled. */
export function welcomeFriend(start: { name?: string, set?: string, friend?: string, skin?: string }, done: (r: { name: string, set: 'boy' | 'girl', friend: FriendId, skin: string } | null) => void) {
  let step = 'name', name = start.name || '', set: 'boy' | 'girl' = start.set === 'girl' ? 'girl' : 'boy', friend = (start.friend as FriendId) || null, skin = SKIN.includes(start.skin) ? start.skin : SKIN[1], chose = !!start.set;
  const m = modal('friendpick', '<div class="fr-body"></div>'), body = m.querySelector('.fr-body') as HTMLElement;
  const finish = ok => { m.close(); done(ok ? { name, set, friend: friend || defaultFriend(set), skin } : null); };
  const draw = () => {
    if (step === 'name') {
      body.innerHTML = `<h2>${T('Hello! What is your name?', 'Xin chào! Con tên là gì?')}</h2>
        <input class="fr-name" maxlength="16" value="${esc(name)}" placeholder="${T('e.g. Annie or Bin', 'ví dụ: Na hoặc Bin')}" aria-label="${T('Name', 'Tên')}">
        <div class="fr-nav"><button class="btn" data-go="cancel">${T('Cancel', 'Hủy')}</button><button class="btn primary" data-go="next">${T('Next', 'Tiếp')} ▶</button></div>`;
      const inp = body.querySelector('.fr-name') as HTMLInputElement; inp.oninput = () => { name = inp.value; };
      inp.onkeydown = e => { if (e.key === 'Enter') { name = inp.value; step = 'gender'; draw(); } };
    } else if (step === 'gender') {
      body.innerHTML = `<h2>${T('Are you a boy or a girl?', 'Bạn là bạn trai hay bạn gái?')}</h2>
        <div class="fr-genders">${(['boy', 'girl'] as const).map(g => `<button class="fr-gender${chose && set === g ? ' on' : ''}" data-set="${g}"><span class="fr-two">${friendsOf(g).map(id => `<img src="${friendPic(id, 'f')}" alt="">`).join('')}</span><b>${g === 'girl' ? T('Girl', 'Bạn gái') : T('Boy', 'Bạn trai')}</b></button>`).join('')}</div>
        <div class="fr-nav"><button class="btn" data-go="back">◀ ${T('Back', 'Quay lại')}</button></div>`;
      body.querySelectorAll<HTMLElement>('[data-set]').forEach(b => b.onclick = () => {
        const g = b.dataset.set === 'girl' ? 'girl' : 'boy'; if (g !== set || !friend) friend = null; set = g; chose = true; SFX.tap(); step = 'friend'; draw();
        say('Choose your friend!', 'Chọn bạn của con nào!');
      });
    } else {
      body.innerHTML = `<h2>${T('Choose your friend', 'Chọn bạn của con')}</h2>
        <div class="fr-cards">${friendsOf(set).map(id => friendCard(id, friend === id)).join('')}</div>
        <p class="fr-label">${T('Skin tone', 'Màu da')}</p>${skinRow(skin)}
        <div class="fr-nav"><button class="btn" data-go="back">◀ ${T('Back', 'Quay lại')}</button><button class="btn primary" data-go="done" ${friend ? '' : 'disabled'}>${T("That's me!", 'Đây là con!')} ▶</button></div>`;
      body.querySelectorAll<HTMLElement>('[data-friend]').forEach(b => b.onclick = () => { friend = b.dataset.friend as FriendId; SFX.pop(1); sayHello(friend); draw(); body.querySelector(`[data-friend="${friend}"]`)?.classList.add('wave'); });
      body.querySelectorAll<HTMLElement>('[data-skin]').forEach(b => b.onclick = () => { skin = b.dataset.skin; SFX.tap(); draw(); });
      body.style.setProperty('--skin', skin);
    }
    body.querySelectorAll<HTMLElement>('[data-go]').forEach(b => b.onclick = () => {
      const g = b.dataset.go; SFX.tap();
      if (g === 'cancel') return finish(false);
      if (g === 'done') return finish(true);
      if (g === 'next') { name = (body.querySelector('.fr-name') as HTMLInputElement)?.value || name; step = 'gender'; }
      else if (g === 'back') step = step === 'friend' ? 'gender' : 'name';
      draw();
    });
  };
  draw();
  say('Hello! What is your name?', 'Xin chào! Con tên là gì?');
  return m;
}

/** The one-time card for an old save: "New friends are here!" with the friend they were moved to already chosen. */
export function newFriendsCard(p, done: () => void) {
  if (!p || p.friendCard !== 'due') { done(); return null; }
  let pick = friendOf(p.look);
  const m = modal('friendpick newfriends', '<div class="fr-body"></div>'), body = m.querySelector('.fr-body') as HTMLElement;
  const draw = () => {
    body.innerHTML = `<h2>${T('New friends are here!', 'Các bạn mới đã đến!')}</h2>
      <p class="fr-label">${T('Tap the friend you want to be.', 'Chạm vào bạn mà con muốn làm nhé.')}</p>
      <div class="fr-cards">${friendsOf(setOf(p.look)).map(id => friendCard(id, pick === id)).join('')}</div>
      ${p.newSuits ? `<p class="fr-note">${T('Old clothes became new outfits', 'Áo cũ đã thành bộ đồ mới')}</p>` : ''}
      <div class="fr-nav"><button class="btn primary" data-go="play">${T("Let's play", 'Chơi thôi')} ▶</button></div>`;
    body.querySelectorAll<HTMLElement>('[data-friend]').forEach(b => b.onclick = () => { pick = b.dataset.friend as FriendId; SFX.pop(1); sayHello(pick); draw(); });
    (body.querySelector('[data-go="play"]') as HTMLElement).onclick = () => {
      SFX.chime(); setFriend(p, pick); p.friendCard = 'seen'; delete p.newSuits; saveProfiles(true); m.close(); done();
    };
  };
  draw();
  say('New friends are here!', 'Các bạn mới đã đến!');
  return m;
}
/** show the card to each chosen child who has not seen it yet, one after the other */
export function newFriendsCards(list, done: () => void) {
  const due = (list || []).filter(p => p && p.friendCard === 'due');
  const next = () => { const p = due.shift(); if (!p) return done(); newFriendsCard(p, next); };
  next();
}
