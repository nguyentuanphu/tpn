// For 5 to 8 year olds at Medium or Hard (round S, owner plan 8 Oct: Round R Part 2 item 10): mystery boxes, family
// rankings and the collectibles book. Rules and lists in js/content/boxes.js; Studio switches 'mysteryBox', 'rankings'
// and 'collectibles'. A gift chip beside the coins opens one big card with three picture buttons. Never real money:
// boxes are never sold (one free a day, one more for finishing a quest) and a second one of anything becomes stars.
import { T } from './i18n.js';
import { featureOn } from './custom.js';
import { profiles, saveProfiles } from './state.js';
import { modal, confetti } from './popups.js';
import { pic } from './art.js';
import { SFX } from './audio.js';
import { avatarURL } from './avatar.js';
import { esc } from './util.js';
import { aestDay, eligible, boxState, ready, questStep, questCount, openBox, KINDS, COLLECTIBLES, BOARDS, rank, CBY } from './content/boxes.js';

// what is said ([en, vi]; to be recorded: docs/cores/play.md); never a child's name
export const BOX_LINES = {
  waiting: ['A mystery box is waiting for you!', 'Có một hộp bí ẩn đang chờ con!'],
  earned: ['Quest done! You earned a mystery box.', 'Xong nhiệm vụ! Con được một hộp bí ẩn.'],
  tap: ['Tap the box to open it!', 'Chạm vào hộp để mở nhé!'],
  fresh: ['Something new for your collection book!', 'Một món mới cho sổ sưu tập của con!'],
  dup: ['You have this one already, so it turns into stars!', 'Con có món này rồi, nên nó biến thành sao!'],
  none: ['No boxes left today. Come back tomorrow, or finish a quest!', 'Hôm nay hết hộp rồi. Mai quay lại, hoặc làm xong một nhiệm vụ nhé!'],
  ranks: ['Here is how our family is doing. Well done, everyone!', 'Đây là thành tích của cả nhà. Mọi người giỏi lắm!'],
  book: ['Your collection book! Open mystery boxes to fill it.', 'Sổ sưu tập của con! Mở hộp bí ẩn để có thêm nhé.'],
  find: ['Still to find!', 'Còn chờ con tìm!']
};
const tint = c => c.hue ? ` style="filter:hue-rotate(${c.hue}deg)"` : '';

export function createBoxes(G, { say, save }) {
  // (batch rollout) each kept for a child who already opened it (G.keep, js/main.js)
  const keep = id => G.keep ? G.keep(id) : featureOn(id, true);
  const boxOn = () => keep('mysteryBox'), rankOn = () => keep('rankings'), bookOn = () => keep('collectibles');
  const anyOn = () => boxOn() || rankOn() || bookOn();
  const can = h => !!h && eligible(h.profile) && anyOn();

  // a quest finished (js/main.js checkQuests calls this with how many main quests are done): one box, at most one a day
  function questDone(h, mainDone) {
    if (!h || !eligible(h.profile)) return false;
    const B = boxState(h.profile), was = B.last, got = questStep(B, aestDay(), questCount(h.profile, mainDone)); if (got || was !== B.last) save();
    if (got && boxOn()) { const hud = G.huds && G.huds[h.i]; hud && hud.toast && hud.toast(T('Quest done! A mystery box for you.', 'Xong nhiệm vụ! Con được một hộp bí ẩn.')); say(...BOX_LINES.earned); }
    return got;
  }

  // ---------- the chip beside the coins ----------
  const chips = new Map();
  function chipFor(h) {
    const hud = G.huds && G.huds[h.i]; if (!hud || !hud.root) return null;
    let c = chips.get(hud); if (c && c.isConnected) return c;
    const tl = hud.root.querySelector('.hud-tl'); if (!tl || (G.kidplay && !tl.querySelector('.kidrow'))) return null; // (after the Feed and goal row, so the buttons keep one order)
    const row = document.createElement('div'); row.className = 'kidrow bxrow'; tl.appendChild(row);
    c = document.createElement('button'); c.className = 'chip c-box'; c.onclick = e => { e.stopPropagation(); openHub(h.i); }; row.appendChild(c); chips.set(hud, c); return c;
  }
  const told = new Set();
  function refresh() {
    for (const h of G.heroes) {
      const c = chipFor(h); if (!c) continue;
      const show = can(h), n = show && boxOn() ? ready(boxState(h.profile), aestDay()) : 0, key = [show, n].join('|');
      if (c.dataset.key === key) continue; c.dataset.key = key;
      c.parentNode.hidden = !show; c.classList.toggle('ready', n > 0);
      c.innerHTML = pic('🎁') + `<small>${n ? n : ''}</small>`; c.setAttribute('aria-label', T('Mystery boxes, rankings and my collection', 'Hộp bí ẩn, bảng thành tích và bộ sưu tập'));
      // once a day: tell the child a box is waiting
      const k = h.profile.id + ':' + aestDay(); if (n && !told.has(k) && !G.paused) { told.add(k); say(...BOX_LINES.waiting); }
    }
  }
  setInterval(refresh, 500); setTimeout(refresh, 0);

  // ---------- one card, three big picture buttons ----------
  function frame(i, cls) {
    if (G.heroes.length > 1) G.lastPlayer = i;
    if (G.paused) return null; G.paused = true;
    const m = modal('kcard ' + cls, ''); m.addEventListener('click', e => { if (e.target === m) close(m); });
    return m;
  }
  const close = m => { m.close(); G.paused = false; };
  const xBtn = () => `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button>`;
  function openHub(i) {
    const h = G.heroes[i]; if (!can(h)) return;
    const m = frame(i, 'bxhub'); if (!m) return; const card = m.querySelector('.card');
    const n = ready(boxState(h.profile), aestDay());
    card.innerHTML = xBtn() + `<div class="khead"><span class="kbig">${pic('🎁')}</span><h2>${T('Surprises', 'Bất ngờ')}</h2></div><div class="khub">
      ${boxOn() ? `<button class="khb ${n ? 'ready' : ''}" data-go="box" aria-label="${T('Mystery box', 'Hộp bí ẩn')}">${pic('🎁')}<b>${n}</b></button>` : ''}
      ${rankOn() ? `<button class="khb" data-go="rank" aria-label="${T('Family rankings', 'Bảng thành tích gia đình')}">${pic('🏆')}</button>` : ''}
      ${bookOn() ? `<button class="khb" data-go="book" aria-label="${T('Collection book', 'Sổ sưu tập')}">${pic('📚')}</button>` : ''}</div>`;
    card.querySelector('.x').onclick = () => close(m);
    card.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { SFX.tap(); G.tried && G.tried(G.heroes[i], { box: 'mysteryBox', rank: 'rankings', book: 'collectibles' }[b.dataset.go]); m.close(); G.paused = false; setTimeout(() => ({ box: openBoxCard, rank: openRanks, book: openBook })[b.dataset.go](i), 220); });
  }

  // ---------- a mystery box: it wobbles, a tap opens it ----------
  function openBoxCard(i) {
    const h = G.heroes[i], p = h.profile; if (!can(h) || !boxOn()) return;
    const m = frame(i, 'bxopen'); if (!m) return; const card = m.querySelector('.card');
    const n = ready(boxState(p), aestDay());
    card.innerHTML = xBtn() + (n ? `<button class="kbox" aria-label="${T('Open the box', 'Mở hộp')}">${pic('🎁')}</button><p class="kmore">${pic('🎁')}<b>${n}</b></p>` : `<div class="kempty">${pic('🌙')}</div>`);
    card.querySelector('.x').onclick = () => close(m);
    if (!n) { say(...BOX_LINES.none); return; }
    say(...BOX_LINES.tap);
    card.querySelector('.kbox').onclick = () => {
      const r = openBox(p, aestDay()); if (!r) return; saveProfiles(true); save(); SFX.chime && SFX.chime(); refresh();
      const c = r.item;
      card.innerHTML = xBtn() + `<div class="kprize ${c.rare}"><span class="kpz"${tint(c)}>${pic(c.icon)}</span>${r.dup ? `<p class="kstars">${pic('⭐')}<b>+${r.stars}</b></p>` : `<p class="knew">${pic('🆕')}</p>`}</div>
        <div class="kbtns">${ready(boxState(p), aestDay()) ? `<button class="kagain" aria-label="${T('Another box', 'Hộp nữa')}">${pic('🎁')}</button>` : ''}<button class="kto" aria-label="${T('Collection book', 'Sổ sưu tập')}">${pic('📚')}</button></div>`;
      card.querySelector('.x').onclick = () => close(m);
      if (!r.dup) try { confetti(); } catch (e) { }
      say(...(r.dup ? BOX_LINES.dup : BOX_LINES.fresh)); setTimeout(() => say(c.en, c.vi), 1800);
      const again = card.querySelector('.kagain'); if (again) again.onclick = () => { close(m); setTimeout(() => openBoxCard(i), 220); };
      card.querySelector('.kto').onclick = () => { close(m); setTimeout(() => openBook(i), 220); };
    };
  }

  // ---------- rankings: the family on this device (friends online come later) ----------
  function openRanks(i, board = 'stars') {
    const h = G.heroes[i]; if (!can(h) || !rankOn()) return;
    const m = frame(i, 'bxrank'); if (!m) return; const card = m.querySelector('.card');
    const draw = () => {
      const rows = rank(profiles, board), medal = ['🥇', '🥈', '🥉'];
      card.innerHTML = xBtn() + `<div class="khead"><span class="kbig">${pic('🏆')}</span><h2>${T('Our family', 'Cả nhà mình')}</h2></div>
        <div class="ktabs">${BOARDS.map(b => `<button class="ktab ${b.id === board ? 'on' : ''}" data-b="${b.id}" aria-label="${T(b.en, b.vi)}">${pic(b.icon)}</button>`).join('')}</div>
        <ol class="kranks">${rows.map(({ p, v }, k) => `<li class="${p.id === h.profile.id ? 'me' : ''}"><span class="kpl">${k < 3 ? pic(medal[k]) : pic('⭐')}</span><img src="${avatarURL(p)}" alt=""><small>${esc(p.name || '')}</small><b>${v}</b></li>`).join('')}</ol>`;
      card.querySelector('.x').onclick = () => close(m);
      card.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { board = b.dataset.b; SFX.tap(); const x = BOARDS.find(y => y.id === board); say(x.en, x.vi); draw(); });
    };
    draw(); say(...BOX_LINES.ranks);
  }

  // ---------- the collectibles book: a page for each kind, what is still to find shown as a shadow ----------
  function openBook(i, kind = 'fairy') {
    const h = G.heroes[i], p = h.profile; if (!can(h) || !bookOn()) return; boxState(p);
    const m = frame(i, 'bxbook'); if (!m) return; const card = m.querySelector('.card');
    const draw = () => {
      const got = COLLECTIBLES.filter(c => p.collect[c.id]).length;
      card.innerHTML = xBtn() + `<div class="khead"><span class="kbig">${pic('📚')}</span><h2>${T('My collection', 'Bộ sưu tập của con')}</h2><span class="kcount">${got}/${COLLECTIBLES.length}</span></div>
        <div class="ktabs">${KINDS.map(k => `<button class="ktab ${k.id === kind ? 'on' : ''}" data-kind="${k.id}" aria-label="${T(k.en, k.vi)}">${pic(k.icon)}</button>`).join('')}</div>
        <div class="kbook">${COLLECTIBLES.filter(c => c.kind === kind).map(c => { const nn = p.collect[c.id] || 0;
          return `<button class="kcol ${nn ? 'got ' + c.rare : 'miss'}" data-c="${c.id}" aria-label="${nn ? T(c.en, c.vi) : T('Still to find', 'Còn chờ tìm')}"><span${nn ? tint(c) : ''}>${pic(c.icon)}</span>${nn > 1 ? `<b>×${nn}</b>` : ''}</button>`; }).join('')}</div>`;
      card.querySelector('.x').onclick = () => close(m);
      card.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => { kind = b.dataset.kind; SFX.tap(); const k = KINDS.find(x => x.id === kind); say(k.en, k.vi); draw(); });
      card.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { const c = CBY[b.dataset.c]; SFX.tap(); if (p.collect[c.id]) say(c.en, c.vi); else say(...BOX_LINES.find); });
    };
    draw(); say(...BOX_LINES.book);
  }
  return { questDone, refresh, openHub, openBoxCard, openRanks, openBook, can, LINES: BOX_LINES };
}
