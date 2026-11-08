// (v1.08b friends) The small parts of choosing a friend that the Backpack and the editor need straight away: the friend
// pictures and cards, the spoken hellos, changing friend and outfit. The Welcome steps and the one-time card are in
// js/ui/friends-ui.ts, loaded only when needed (check startup: the first download stays under its limit).
import { T } from '../i18n.js';
import { el } from '../util.js';
import { SFX } from '../audio.js';
import { saveProfiles, farm } from '../state.js';
import { say } from '../voice.js';
import { esc } from '../util.js';
import { FRIENDS, friendsOf, friendOf, defaultFriend, suitId, suitInfo, suitsOf, friendLook, type FriendId } from '../content/friends.js';
import { pic } from '../art.js';
import { setOf } from '../content/shop.js';

// each friend's title (owner's plan, 3 Nov 2026 AEDT)
export const TITLES: Record<string, [string, string]> = { finn: ['Sky Explorer', 'Nhà thám hiểm bầu trời'], sol: ['Sun Keeper', 'Người giữ mặt trời'], clara: ['Bloom Keeper', 'Người giữ hoa'], lumi: ['Leaf Sprite', 'Tiên lá'] };
export const friendPic = (id: string, view = 'f') => `icons/friends/${FRIENDS[id] ? id : 'finn'}-${view}.webp`;
// each friend's spoken hello, written out so the voice pack finds the lines (tools/voice-lines.mts)
export function sayHello(id: string) {
  if (id === 'finn') say("Hi, I'm Finn! Let's explore the sky!", 'Chào bạn, mình là Finn! Cùng khám phá bầu trời nhé!');
  else if (id === 'sol') say("Hi, I'm Sol! The sun is shining for us!", 'Chào bạn, mình là Sol! Mặt trời đang chiếu sáng cho chúng mình!');
  else if (id === 'clara') say("Hi, I'm Clara! Let's make the flowers bloom!", 'Chào bạn, mình là Clara! Cùng làm hoa nở nhé!');
  else if (id === 'lumi') say("Hi, I'm Lumi! Come and play in the leaves!", 'Chào bạn, mình là Lumi! Đến chơi trong vườn lá nhé!');
}
// a friend card: the friend turning slowly (front, three-quarter, side), the name and the title
export function friendCard(id: string, on: boolean, skin?: string) {
  const f = FRIENDS[id];
  return `<button class="fr-card${on ? ' on' : ''}" data-friend="${id}" aria-pressed="${on}" style="--fr:${f.color}">
    <span class="fr-turn">${['f', 'q', 's'].map(v => `<img src="${friendPic(id, v)}" alt="" draggable="false">`).join('')}<canvas class="fr-3d" width="240" height="312" data-f3d="${id}"></canvas></span>
    ${skin ? `<i class="fr-tone" style="background:${skin}"></i>` : ''}
    <b>${esc(T(f.en, f.vi))}</b><small>${esc(T(...TITLES[id]))}</small></button>`;
}
// change friend (free, as often as the child likes; the other set only in Grown-ups). The worn outfit follows the friend
// when it was the old friend's own kind (an everyday stays an everyday).
export function setFriend(p, id: FriendId) {
  const L = p.look; if (!FRIENDS[id] || FRIENDS[id].set !== setOf(L)) return false;
  const old = L.friend; L.friend = id;
  if (typeof L.suit === 'string' && old && L.suit.startsWith(old + '-')) L.suit = suitId(id, L.suit.slice(old.length + 1));
  if (!L.suit) L.suit = suitId(id, 'everyday');
  return true;
}
/** the Backpack's friend row (html) */
export const friendRowHTML = p => `<div class="slots fr-row">${friendsOf(setOf(p.look)).map(id => `<button class="slot fr-slot${friendOf(p.look) === id ? ' on' : ''}" data-befriend="${id}" title="${esc(T(FRIENDS[id].en, FRIENDS[id].vi))}"><img src="${friendPic(id, 'face')}" alt=""><small>${esc(T(FRIENDS[id].en, FRIENDS[id].vi))}</small></button>`).join('')}</div>`;
// the outfits a child can wear now: their friend's everyday one, the ones bought for this friend, and the old clothes
// turned into outfits (any friend)
export const suitsOwned = p => { const f = friendOf(p.look), mine = (p.owned && p.owned.suits || []).filter(id => id.startsWith('c:') || id.startsWith(f + '-'));
  return [suitId(f, 'everyday'), ...mine.filter(id => id !== suitId(f, 'everyday'))].filter(id => suitInfo(id)); };
export function wearSuit(p, id: string) { if (!suitsOwned(p).includes(id)) return false; p.look.suit = id; return true; }
/** the Backpack's outfit row (html): a coloured outfit picture for each one owned */
export const suitRowHTML = p => {
  return `<div class="slots fr-suits">${suitsOwned(p).map(id => { const s = suitInfo(id), c = friendLook({ ...p.look, suit: id }).color, on = p.look.suit === id || (!suitInfo(p.look.suit) && id === suitsOwned(p)[0]);
    return `<button class="slot${on ? ' on' : ''}" data-suit="${esc(id)}" title="${esc(T(s.en, s.vi))}"><span class="fr-suit" style="--c:${c}">${pic('👕')}</span><small>${esc(T(s.en, s.vi))}</small></button>`; }).join('')}</div>`; };

// the friends' styles (the Welcome steps, the cards, the Backpack's rows), added to the page when this file first loads,
// so they are not in the first download (check startup)
if (typeof document !== 'undefined' && !document.getElementById('sv-friends-css')) { const st = document.createElement('style'); st.id = 'sv-friends-css'; st.textContent = `/* (v1.08b friends) choosing a friend: Welcome steps, the one-time card, the editor's friend row, the Backpack's rows */
.modal.friendpick { align-items: center; }
.modal.friendpick .card { width: min(720px, 100%); max-height: calc(100dvh - 28px); display: flex; flex-direction: column; }
.fr-body { display: flex; flex-direction: column; align-items: center; gap: clamp(8px, 1.6vh, 16px); min-height: 0; }
.fr-body h2 { margin: 0; text-align: center; font-size: clamp(22px, 4.2vmin, 32px); }
.fr-name { font-size: 24px; min-height: 64px; width: min(420px, 100%); text-align: center; border-radius: 18px; border: 3px solid #c9b8ef; padding: 0 16px; }
.fr-nav { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.fr-nav .btn { min-height: 64px; min-width: 120px; font-size: 20px; }
.fr-genders, .fr-cards { display: flex; gap: clamp(10px, 2.4vmin, 22px); justify-content: center; width: 100%; min-height: 0; }
.fr-gender, .fr-card { flex: 1 1 0; max-width: 300px; min-width: 0; min-height: 64px; border: 4px solid transparent; border-radius: 22px; background: #f4ecda; padding: 8px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; font: inherit; color: #3a2a4a; }
.fr-gender.on, .fr-card.on { border-color: #7a5cd6; box-shadow: 0 0 0 4px #e4dafc; }
.fr-gender b, .fr-card b { font-size: clamp(20px, 3.6vmin, 28px); }
.fr-card small { font-size: 16px; text-align: center; }
.fr-two { display: flex; justify-content: center; }
.fr-two img { width: 50%; max-height: min(34vh, 260px); object-fit: contain; }
.fr-turn { position: relative; width: 100%; height: min(36vh, 300px); }
.fr-cards.small .fr-turn { height: min(22vh, 170px); }
.fr-turn img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0; animation: fr-turn 9s infinite; }
.fr-turn img:nth-child(2) { animation-delay: 3s; } .fr-turn img:nth-child(3) { animation-delay: 6s; }
@keyframes fr-turn { 0%, 30% { opacity: 1; } 36%, 94% { opacity: 0; } 100% { opacity: 1; } }
.fr-card.wave .fr-turn { animation: fr-wave .9s ease-in-out 2; }
@keyframes fr-wave { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-4deg) translateY(-6px); } 75% { transform: rotate(4deg) translateY(-6px); } }
@media (prefers-reduced-motion: reduce) { .fr-turn img { animation: none; } .fr-turn img:first-child { opacity: 1; } .fr-card.wave .fr-turn { animation: none; } }
.fr-tone { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #fff; }
.fr-label, .fr-note { margin: 0; font-size: 18px; text-align: center; }
.fr-note { color: #6a4bb8; font-weight: 600; }
.fr-skins { display: flex; gap: clamp(6px, 2vw, 12px); justify-content: center; flex-wrap: wrap; }
.fr-skin { width: clamp(52px, 15vw, 64px); height: clamp(52px, 15vw, 64px); border-radius: 50%; border: 4px solid #fff; box-shadow: 0 0 0 2px #c9b8ef; cursor: pointer; }
.fr-skin.on { box-shadow: 0 0 0 5px #7a5cd6; }
.fr-field .fr-cards { justify-content: flex-start; }
.fr-field .fr-card { max-width: 200px; }
.fr-row .fr-slot img { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; }
.fr-suit { display: inline-flex; border-radius: 12px; padding: 4px; background: var(--c); }
@media (max-height: 520px) { .fr-turn { height: 30vh; } .fr-two img { max-height: 30vh; } .fr-body h2 { font-size: 22px; } .fr-skin { width: 52px; height: 52px; } .modal.friendpick:not(.little) .fr-nav .btn { min-height: 48px; } }
/* (v1.08b friends) the 3D model turning in a card, once it has loaded (the pictures stay underneath until then) */
.fr-3d { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0; }
.fr-card.live .fr-3d { opacity: 1; } .fr-card.live .fr-turn img { visibility: hidden; }
.fr-card.live .fr-turn { background: #f4ecda; border-radius: 14px; }
`; document.head.appendChild(st); }

// (v1.08b friends) the friend row under "I am a…": the two friends of the child's set; changing set (only here, in
// Grown-ups › Children › Edit or when the character is made) moves to that set's default friend. Hair and clothes come
// from the friend, so the old hair rows are hidden (the old fields stay in the save).
export function friendField(m, look) {
  const out = m.querySelector('#cOut').closest('.field'), f = el('div', 'field fr-field');
  f.innerHTML = `<span>${T('My friend', 'Bạn của con')}</span><div class="fr-cards small" id="cFriend"></div>`; out.after(f);
  const draw = () => {
    const set = look.set === 'girl' ? 'girl' : 'boy';
    if (!FRIENDS[look.friend] || FRIENDS[look.friend].set !== set) { look.friend = defaultFriend(set); look.suit = suitId(look.friend, 'everyday'); }
    const box = f.querySelector('#cFriend'); box.innerHTML = friendsOf(set).map(id => friendCard(id, look.friend === id)).join('');
    box.querySelectorAll('[data-friend]').forEach((b: HTMLElement) => b.onclick = () => { setFriend({ look }, b.dataset.friend as any); SFX.pop(1); sayHello(look.friend); draw(); });
  };
  m.querySelector('#cOut').addEventListener('sv-set', draw); draw();
  m.querySelector('#cHs').closest('.field').hidden = true;
}

// the shop's Outfits tab (js/shop.ts): the friend's outfits, everyday free, áo dài, festival and rain day; tap once to see
// the price, again to buy with game coins; an outfit the child has is put on with one tap
export function suitTab(card: HTMLElement, o) {
  const { G, h, p, i, draw, coins, itemSVG, SHOP_LINES, save } = o;
  if (!p.look.friend) return o.back();
  const f = friendOf(p.look), owned = new Set(p.owned && p.owned.suits || []), list = suitsOf(f), SHAPE = { shirt: 'tee', tunic: 'tunic', dress: 'dress', overalls: 'overalls', aodai: 'aodai', hoodie: 'hoodie' };
  const have = x => x.price === 0 || owned.has(x.id), g = card.querySelector('.kgrid');
  if (g) g.innerHTML = list.map(x => { const L = friendLook({ ...p.look, suit: x.id }), on = p.look.suit === x.id, sel = o.pick() === x.id;
    return `<button class="kitem ${have(x) ? 'have' : ''} ${on ? 'on' : ''} ${sel ? 'pick' : ''} ${!have(x) && farm.coins < x.price ? 'poor' : ''}" data-suit="${x.id}" aria-pressed="${on}" aria-label="${T(x.en, x.vi)}">${itemSVG({ shape: SHAPE[L.style] || 'tee', color: L.color, trim: '#ffffff' })}<small>${T(x.en, x.vi)}</small>${have(x) ? '' : coins(x.price)}</button>`; }).join('');
  card.querySelectorAll('.shop-collections, .kmore, .kask').forEach(e => e.remove());
  card.querySelectorAll<HTMLElement>('[data-suit]').forEach(b => b.onclick = () => { const x = list.find(y => y.id === b.dataset.suit);
    if (have(x)) { p.look.suit = x.id; o.setPick(null); saveProfiles(); G.rebuildHero(i); SFX.pop(1); say(...SHOP_LINES.wear as [string, string]); draw(); return; }
    if (o.pick() !== x.id) { o.setPick(x.id); SFX.tap(); say(x.en, x.vi); draw(); return; }
    if (farm.coins < x.price) { SFX.no && SFX.no(); say(...SHOP_LINES.saving as [string, string]); return; }
    G.addCoins(-x.price); p.owned.suits = [...(p.owned.suits || []), x.id]; p.look.suit = x.id; o.setPick(null); saveProfiles(true); save(); G.rebuildHero(i); SFX.coin && SFX.coin(); say(...SHOP_LINES.bought as [string, string]); G.job && G.job('buy', 1, h); draw(); });
}
