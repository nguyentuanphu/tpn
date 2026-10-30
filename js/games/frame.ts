// A shared frame for every mini-game: the full-screen layer, the title bar, progress dots,
// gentle feedback (no losing — mistakes just say "try again") and the win celebration.
import { gameEndAd } from '../ads.js';
import { T } from '../i18n.js';
import { say } from '../voice.js';
import { SFX, Music } from '../audio.js';
import { el, wait, esc } from '../util.js';
import { openHowTo } from '../howto.js';
import { pic } from '../art.js';
import { featureOn, itemEnabled, keptOn, MONEY_GAMES } from '../custom.js';
import { saveProfiles, normalizeLearn } from '../state.js';

import { isOpen, isHeld } from '../content/unlocks.js';
import { GAME_INFO } from '../content/activities.js';
import { GAMES, register, SKILLS } from './registry.js';
import { playWatch, tell, setPlan } from './playwatch.js';
export { GAMES, register }; // (the list itself is in registry.js)
// Each kind of game has its own song.
const GAME_MUSIC = {
  cacuangua:'strategy',cuopco:'folk',meochuot:'folk',danhdao:'strategy',nemcon:'folk',keocua:'none',duathuyen:'none',
  music: 'none', firstwords: 'twinkle', tangram: 'think', snakes: 'party2', rangoli: 'twinkle',
  pattern: 'think', counting: 'twinkle', letters: 'twinkle', numbers: 'think', shapes: 'think', colors: 'twinkle', sorting: 'think', memory: 'twinkle',
  hanoi: 'strategy', robot: 'strategy', maze: 'strategy', goat: 'folk', blindtag: 'folk', oanquan: 'strategy', caro: 'strategy', hopscotch: 'folk', tug: 'village2', mrwolf: 'folk', datnieu: 'folk', kite: 'fly', chichi: 'folk', sackrace: 'party2', cricket: 'village2', parcel: 'none', words: 'twinkle', snap: 'village2', tienlen: 'village2', tienlenbac: 'village2', oantuti: 'folk', nemlon: 'party2', familyquiz: 'twinkle', moreless: 'think', days: 'twinkle', bodyparts: 'twinkle', eggs: 'farm', sudoku: 'think', dacau: 'party2', chuyen: 'village2', dragon: 'folk', marbles: 'strategy', skipping: 'party2',
  market: 'money', order: 'farm', sortout: 'money', bunny: 'farm', jigsaw: 'twinkle', oddone: 'pond', tower: 'think', duckmaze: 'pond',
  balloon: 'fly', bubbles: 'party2', tune: 'none',
  sayfind: 'twinkle', marketcount: 'money', soundhunt: 'twinkle',   // (r79 learning) the talk-and-touch games
  clock: 'think', sums: 'twinkle', opposites: 'think', animalsounds: 'farm', phonics: 'twinkle', feelings: 'twinkle'
};
const PRIZES = ['🦄', '🦖', '🚀', '🧸', '🎈', '🍭', '🪁', '🐬', '🌈', '👑', '🎨', '🛼', '🪀', '🍦', '🐼'];

import type { Profile, Difficulty } from '../../types/save.js';
export type GameResult = { won: boolean; stars?: number; next?: 'next' | 'again' | 'stop'; restart?: Difficulty; [key: string]: unknown };
type WinExtra = Partial<GameResult> & { title?: string; titleVi?: string };
export type GameOnline = {familyQuiz?():import('../content/family-quiz.js').FamilyQuestion[]|null;shareFamilyQuiz?(questions:import('../content/family-quiz.js').FamilyQuestion[]):boolean;requestFamilyQuiz?():void; mine: number; names: string[]; seed?: string; size?: number; move(n: number, value: number): void; peek?(n: number, seat: number): number | undefined; onMove?(listener: (seat: number, n: number, value: number) => void): void | (() => void); next?(n: number, seat: number): Promise<unknown>; all?(n: number): Promise<unknown[]>; connected?(): boolean; present?(seat: number): boolean; leave?(): void };
export type GameOptions = { players: Profile[]; level?: number; style?: string; partnerName?: string | null; little?: boolean; strong?: boolean; nextId?: string | null; completion?: 'choose' | 'return'; online?: GameOnline | null; levelPick?: { value: Difficulty } | null };
type Cleanup = { onCleanup?(callback: () => void): void };

let current = null;
export const gameOpen = () => !!current;
// the auto play check's view of the game (js/games/playwatch.js)
export { playWatch };

// players: array of profiles (1 or 2); level: 1..5; style: 'shrine' | 'village'
// online: playing with friends on their own devices (js/netgames.js): { mine, names, move(n, mv), next(n, seat), all(n) }
// levelPick (round M, owner: "a choice of difficulty inside each game"): { value: 'easy'|'medium'|'hard' } shows a
// button in the game's top bar; choosing another level closes the game with { restart: level } and it starts again
const LEVELS = [['easy', 'Easy', 'Dễ'], ['medium', 'Medium', 'Vừa'], ['hard', 'Hard', 'Khó']];
// (r79 learning, owner 16 Oct AEDT, I1) the level a learning game moved to, kept for "Play again" of the same game only
let carry = null;
// One policy check for ordinary entry and direct/online frame callers. Menu hiding is separate.
export function canStartGame(id:string,players:Profile[]=[]):boolean {
  if(!GAMES[id]||!itemEnabled('game',id)||isHeld(id,'game'))return false;
  if(MONEY_GAMES.includes(id)&&!keptOn('money_'+id))return false;
  if(id.startsWith('rd_')&&!keptOn('readingTrial'))return false;
  return !players.length||players.some(p=>isOpen(p,id,'game',GAME_INFO[id]?.[0]||''));
}
export function openGame(id: string, { players, level = 1, style = 'shrine', partnerName = null, little = true, strong = false, nextId = null, completion = 'choose', online = null, levelPick = null }: GameOptions): Promise<GameResult> {
  const def = GAMES[id]; if (!def || !canStartGame(id,players)) return Promise.resolve({ won: false });
  const nextName = nextId && GAMES[nextId] ? GAMES[nextId].name() : '';
  if (current) current.close(false);
  return new Promise<GameResult>(resolve => {
    const layer = el('div', 'gl gl-' + style + (little ? ' little' : ''));
    layer.dataset.gameId = id;
    // (owner, 16 Oct) Studio can hide the game's question line on screen; the game still says it aloud. Its space
    // stays, so nothing in the game moves (UX-001)
    if (!featureOn('explain_gameLine', true)) layer.classList.add('no-help');
    // (r79 learning, owner 16 Oct AEDT, G2) picture-only for under-5s in learning games: the question line is hidden
    // (still spoken, its space kept) and the pictures are bigger
    if (def.learn && little) layer.classList.add('pic-only');
    // (r79 learning, UX-001) learning games keep one height for the question line, so a longer explanation never moves the board
    if (def.learn) layer.classList.add('learn');
    layer.innerHTML = `
      <div class="gl-head">
        <button class="gl-x" aria-label="${T('Leave', 'Rời đi')}">✕</button>
        <div class="gl-title"><span class="gl-icon">${pic(def.icon)}</span><span>${esc(def.name())}</span></div>
        <div class="gl-dots"></div>
        <button class="gl-how" aria-label="${T('How to play', 'Cách chơi')}">📺</button>
      </div>
      <!-- (owner, 30 Oct 2026 AEDT: "the upper part takes too much space") the level and stars share the guide's line;
           the guide shows two short lines (tap for the rest, the voice says it all) so the game gets the room -->
      <div class="gl-guide"><div class="gl-help"></div><div class="gl-status">
          ${levelPick ? `<button class="gl-lvl" aria-label="${T('How hard', 'Độ khó')}">${esc(T(...(LEVELS.find(l => l[0] === levelPick.value) || LEVELS[0]).slice(1)))} ▾</button>` : ''}
          <div class="starbox">⭐ <b>0</b></div>
        </div></div>
      <div class="gl-stage"></div>
      <div class="mascot">🦉</div><div class="mascot-say"></div>`;
    dispatchEvent(new Event('sv-hide-caption')); document.body.appendChild(layer);
    const stage = layer.querySelector('.gl-stage'), dots = layer.querySelector('.gl-dots'), help = layer.querySelector('.gl-help');
    help.addEventListener('click', () => help.classList.toggle('open'));
    const setHelp = (en, vi, capital = false) => {
      const before = help.offsetHeight, text = T(en, vi);
      help.textContent = capital ? text.charAt(0).toUpperCase() + text.slice(1) : text;
      help.classList.remove('open');
      // Retain the largest guidance height so selecting a piece cannot move its drop target.
      help.style.setProperty('--gl-guide-height', Math.max(before, help.offsetHeight) + 'px');
    };
    const cleanups = [];
    // (owner, 30 Oct 2026 AEDT: "grow to fill" on tablets and computers) a game drawn small in the middle of a big screen
    // grows to fill it: the stage zooms so its pieces take the room (at most 2.4x). Drawing games (a canvas) keep their
    // size so a finger lands where it draws; phones keep today's layout.
    const fit = () => {
      if (closed || Math.min(innerWidth, innerHeight) < 600 || stage.querySelector('canvas')) { if (stage.style.zoom) stage.style.zoom = ''; return; }
      const z = parseFloat(stage.style.zoom) || 1, box = stage.getBoundingClientRect(), kids = [...stage.children].filter(e => e.tagName !== 'STYLE' && e.getBoundingClientRect().height > 0);
      if (!kids.length) return;
      const rs = kids.map(e => e.getBoundingClientRect()), w = (Math.max(...rs.map(r => r.right)) - Math.min(...rs.map(r => r.left))) / z, h = (Math.max(...rs.map(r => r.bottom)) - Math.min(...rs.map(r => r.top))) / z;
      if (!w || !h) return;
      const next = Math.max(1, Math.min(2.4, Math.min(box.width / w, box.height / h) * .9));
      if (Math.abs(next - z) > .06) stage.style.zoom = String(Math.round(next * 100) / 100);
    };
    let fitTimer: ReturnType<typeof setTimeout> | undefined;
    const fitSoon = () => { clearTimeout(fitTimer); fitTimer = setTimeout(fit, 120); };
    const fitWatch = new MutationObserver(fitSoon); fitWatch.observe(stage, { childList: true });
    addEventListener('resize', fitSoon); setTimeout(fit, 400);
    cleanups.push(() => { fitWatch.disconnect(); removeEventListener('resize', fitSoon); clearTimeout(fitTimer); });
    let closed = false, winning = false;
    const prevMusic = Music.key; Music.play(GAME_MUSIC[id] || 'think');
    const api = {
      stage, level, difficulty: levelPick?.value || 'easy', players, two: players.length > 1, partnerName, T, el, online,
      little,   // under-5 mode: everything gentle, nobody can lose
      strong,   // computer opponents play to win (big kids on medium or hard)
      say: (en, vi) => { setHelp(en, vi, true); say(en, vi); },
      // Show text without speaking it.
      show: (en, vi) => { setHelp(en, vi); },
      sfx: SFX, wait,
      onCleanup: f => cleanups.push(f),
      close: () => finish(false),
      // Test autoplay still uses real UI taps; a strategy supplies the next legal target, not a synthetic win.
      plan: (f, { maxActions = 0 } = {}) => { cleanups.push(setPlan(f, maxActions)); },
      // (r79 learning, I1) the game's tier now: 0 under-5, 1 Easy, 2 Medium, 3 Hard. The level the game started at
      // (Easy, Medium or Hard) is the starting point; the child's answers move it at most one step either way, and
      // under-5s always stay at the under-5 tier.
      tier: () => tierNow(),
      // call at the start of each round: three right in a row made it one step harder, two misses one step easier
      nextRound() { if (pending) { const before = tierNow(); shift = Math.max(-1, Math.min(1, shift + pending)); if (tierNow() > before) banner(T('A bit harder!', 'Khó hơn một chút!'), 'up'); } pending = 0; roundMisses = 0; layer.dataset.tier = tierNow(); return tierNow(); },
      // (r79 learning, I2) what this child finds hard in this game (a rule, a story, a word): missed() counts it, got()
      // counts it down again, and favour() puts the most-missed first so it comes back first next time
      missed(key) { const m = missBook(); if (!m) return; m[key] = Math.min(9, (m[key] || 0) + 1); trimBook(m); saveProfiles(); },
      got(key) { const m = missBook(); if (!m || !m[key]) return; if (--m[key] <= 0) delete m[key]; saveProfiles(); },
      favour(list, keyOf = x => x) { const m = missBook() || {}, top = Object.keys(m).sort((a, b) => m[b] - m[a])[0]; const i = top == null ? -1 : list.findIndex(x => String(keyOf(x)) === top); if (i > 0) list.unshift(list.splice(i, 1)[0]); return list; },
      // (r79 learning, G2) the first time an under-5 opens this learning game, a drawn hand shows the first move
      hand: target => showHand(target),
      dots(n, done) { tell('dots'); dots.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < done ? 'on' : ''}"></i>`).join(''); },
      right(e) { tell('right', e); SFX.ok(); hideHand(); if (e) { e.classList.remove('wrong'); e.classList.add('right'); } reward(e); streak++; rights++; if (++run >= 3) { run = 0; pending = 1; } if (streak >= 3) combo(streak); else if (Math.random() < .08) lucky(); },
      wrong(e, en = 'Try again!', vi = 'Thử lại nhé!') { tell('wrong', e); SFX.no(); hideHand(); streak = 0; misses++; run = 0; if (++roundMisses >= 2) pending = -1; if (e) { e.classList.remove('wrong'); void e.offsetWidth; e.classList.add('wrong'); } mascot('hmm', T('Hmm… try again!', 'Ừm… thử lại nhé!')); if (en !== null) say(en, vi); },
      praise() { const p = [['Great job!', 'Giỏi quá!'], ['Well done!', 'Làm tốt lắm!'], ['Yes! Clever!', 'Đúng rồi! Thông minh quá!'], ['Super!', 'Tuyệt vời!'], ['You got it!', 'Con làm được rồi!']]; const [e, v] = p[Math.floor(Math.random() * p.length)]; say(e, v); mascot('cheer', T(e, v)); },
      get closed() { return closed; },
      async win(extra: WinExtra = {}) {
        if (closed || winning) return; winning = true;
        tell('win'); SFX.fanfare();
        // 1 to 3 stars (little ones always get 3), then a treasure chest pops open with a surprise
        const n = little ? 3 : misses <= 1 ? 3 : misses <= 4 ? 2 : 1, prize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
        // (r79 learning, I4) finishing Hard in a reasoning game gives its skill sticker for the sticker book, once
        const skill = skillSticker();
        const c: HTMLDivElement = el('div', 'gl-win', `<div class="gl-stars">${[0, 1, 2].map(k => `<i class="${k < n ? 'on' : ''}" style="--d:${k * .25}s">⭐</i>`).join('')}</div>
          <div class="gl-chest"><span class="lid">🎁</span><span class="prize">${prize}</span></div><p>${esc(extra.title || T('You did it!', 'Con làm được rồi!'))}</p>${skill ? `<div class="gl-skill">${pic(skill.key)}<b>${esc(T('New sticker:', 'Hình dán mới:'))} ${esc(T(skill.en, skill.vi))}</b></div>` : ''}
          ${completion === 'choose' ? `<div class="gl-next">${nextName ? `<button class="gl-nx go" data-n="next"><span>${pic('▶️')}</span><b>${T('Next game', 'Trò tiếp theo')}</b><small>${esc(nextName)}</small></button>` : ''}<button class="gl-nx again" data-n="again"><span>${pic('🔁')}</span><b>${T('Play again', 'Chơi lại')}</b></button></div><p class="gl-tapout">${T('Tap anywhere else to finish', 'Chạm chỗ khác để kết thúc')}</p>` : ''}`);
        layer.appendChild(c); { const ad = gameEndAd(); if (ad) c.appendChild(ad); } say(extra.title || 'You did it!', extra.titleVi || 'Con làm được rồi!');
        burstConfetti(layer);
        const chestTimer = setTimeout(() => { c.querySelector('.gl-chest').classList.add('open'); SFX.coin(); }, 1100);
        cleanups.push(() => clearTimeout(chestTimer));
        // World activities return after the celebration. Play and Simple keep their choices.
        const next = await new Promise<NonNullable<GameResult['next']>>(resolveNext => {
          let fin = false;
          const done = (choice: NonNullable<GameResult['next']>) => {
            if (fin) return; fin = true;
            clearTimeout(endTimer); clearTimeout(askTimer); clearTimeout(tapTimer);
            removeEventListener('pointerdown', out, true); resolveNext(choice);
          };
          const out = (event: PointerEvent) => {
            if (!(event.target instanceof Element) || event.target.closest('.gl-nx, .gl-ad') || !layer.contains(event.target)) return;
            event.stopPropagation(); event.preventDefault(); SFX.tap(); done('stop');
          };
          const choose = completion === 'choose';
          const endTimer = setTimeout(() => done('stop'), choose ? 30000 : 1600);
          const askTimer = choose ? setTimeout(() => c.classList.add('ask'), 1600) : 0;
          const tapTimer = choose ? setTimeout(() => { if (!fin) addEventListener('pointerdown', out, true); }, 400) : 0;
          cleanups.push(() => done('stop'));
          c.querySelectorAll<HTMLButtonElement>('.gl-nx').forEach(button => {
            button.onclick = event => { event.stopPropagation(); SFX.tap(); done(button.dataset.n === 'next' ? 'next' : 'again'); };
          });
        });
        if (closed) return;
        if (next === 'again' && def.learn) carry = { id, shift: Math.max(-1, Math.min(1, shift + pending)) };
        finish(true, Object.assign({ stars: n, next }, extra));
      }
    };
    let streak = 0, rights = 0, misses = 0;
    // (r79 learning, I1) run: right answers in a row since the last miss or step; pending: the step the next round takes
    const again = carry && carry.id === id ? carry : null; carry = null;
    let run = 0, roundMisses = 0, pending = 0, shift = again && def.learn ? again.shift : 0;
    const baseTier = little ? 0 : level >= 3 ? 3 : level >= 2 ? 2 : 1;
    function tierNow() { return little || !def.learn ? baseTier : Math.max(0, Math.min(3, baseTier + shift)); }
    layer.dataset.tier = tierNow();   // (for the checks: the level the game is at now)
    // (r79 learning, I2) the child's record for this game: profile.learn.miss[game] = { key: times missed }
    const kid = players && players[0];
    function missBook() { if (!def.learn || !kid || online) return null; const L = kid.learn = normalizeLearn(kid.learn); return (L.miss[id] = L.miss[id] || {}); }
    function trimBook(m) { const keys = Object.keys(m).sort((a, b) => m[b] - m[a]); keys.slice(12).forEach(k => delete m[k]); }
    // (r79 learning, I4) the skill sticker for this game, when it was finished at Hard (and not by an under-5)
    function skillSticker() {
      const sk = SKILLS[id]; if (!sk || little || online || !kid || tierNow() < 3) return null;
      if (!Array.isArray(kid.stickers)) kid.stickers = [];
      if (kid.stickers.includes(sk.key)) return null;
      kid.stickers.push(sk.key); saveProfiles(); return sk;
    }
    // (r79 learning, G2) the showing hand: once per child and game, over the first right choice, for under-5s
    let handEl = null, handDue = !!(def.learn && little && kid && !online && !normalizeLearn(kid.learn).seen[id]);
    function showHand(target) {
      if (!handDue || !target || closed) return; handDue = false;
      const L = kid.learn = normalizeLearn(kid.learn); L.seen[id] = 1; saveProfiles();
      handEl = el('div', 'gl-hand', pic('👆')); layer.appendChild(handEl);
      const place = () => { if (!handEl || !target.isConnected) return; const r = target.getBoundingClientRect(); handEl.style.left = r.left + r.width / 2 - 28 + 'px'; handEl.style.top = r.top + r.height / 2 - 6 + 'px'; };
      place(); const t = setInterval(place, 200); handEl._t = t; setTimeout(hideHand, 4200);
    }
    function hideHand() { if (!handEl) return; clearInterval(handEl._t); handEl.remove(); handEl = null; }
    cleanups.push(hideHand);
    // (r79 learning, E1) one small reward banner in the top bar, over the game's name between the Leave and How to play
    // buttons, so it never covers the question line or the puzzle; a new one replaces the one showing
    let bannerEl = null;
    function banner(text, kind = '') {
      if (bannerEl) bannerEl.remove();
      const title = layer.querySelector('.gl-title').getBoundingClientRect(), x = layer.querySelector('.gl-x').getBoundingClientRect(), how = layer.querySelector('.gl-how').getBoundingClientRect();
      const b = bannerEl = el('div', 'gl-reward' + (kind ? ' ' + kind : ''), text);
      b.style.top = Math.round(title.top + title.height / 2) + 'px'; b.style.left = Math.round((x.right + how.left) / 2) + 'px'; b.style.maxWidth = Math.max(120, Math.round(how.left - x.right - 16)) + 'px';
      layer.appendChild(b); setTimeout(() => { b.remove(); if (bannerEl === b) bannerEl = null; }, 1400);
    }
    // side by side with friends (round H): a game not made for playing together is played by each child on their own
    // device at the same time; a strip shows everyone's stars as they come in, and a flag for whoever finished first
    if (online && !def.online) {
      const bar = el('div', 'race', ''), score = online.names.map(() => 0), done = [];
      const draw = () => { bar.innerHTML = online.names.map((n, s) => `<span class="${s === online.mine ? 'me' : ''}">${done.includes(s) ? '🏁 ' : ''}<b>${esc(n)}</b> ⭐${score[s]}</span>`).join(''); };
      layer.querySelector('.gl-head').after(bar); draw();
      let seq = 0; const send = mv => online.move(seq++, mv);
      online.onMove && online.onMove((s, n, mv) => { if (s === online.mine) return; if (mv >= 5000) { if (!done.includes(s)) done.push(s); score[s] = mv - 5000; if (done.length === 1 && !closed) mascot('cheer', T(`${online.names[s]} finished!`, `${online.names[s]} xong rồi!`)); } else score[s] = Math.max(score[s], mv); draw(); });
      const right0 = api.right, win0 = api.win;
      api.right = e => { right0(e); score[online.mine]++; draw(); send(Math.min(4999, score[online.mine])); };
      api.win = (extra: WinExtra = {}) => { done.push(online.mine); draw(); send(5000 + Math.min(4999, score[online.mine])); const first = done[0] === online.mine, title = first ? T('You finished first!', 'Con xong đầu tiên!') : T(`You finished! ${online.names[done[0]]} was first.`, `Con xong rồi! ${online.names[done[0]]} xong trước.`); return win0(Object.assign({}, extra, { title, titleVi: title })); };
    }
    // three right in a row: a combo with extra stars
    function combo(k) {
      if (def.learn) banner(`${pic('🔥')} ${esc(T('Combo', 'Liên tiếp'))} ×${k}`);
      else { const b = el('div', 'gl-combo', `🔥 ${T('Combo', 'Liên tiếp')} ×${k}`); layer.appendChild(b); setTimeout(() => b.remove(), 1100); }
      stars += 1; starEl.textContent = stars; SFX.chime();
    }
    // now and then a lucky golden star bursts out
    function lucky() {
      if (def.learn) banner(`${pic('🌟')} ${esc(T('Lucky star! +3', 'Sao may mắn! +3'))}`, 'lucky');
      else { const b = el('div', 'gl-combo lucky', `🌟 ${T('Lucky star! +3', 'Sao may mắn! +3')}`); layer.appendChild(b); setTimeout(() => b.remove(), 1300); }
      stars += 3; starEl.textContent = stars; SFX.secret && SFX.secret();
    }
    // Ông Cú cheers in the corner; every right answer sends a star flying to the star counter.
    let stars = 0;
    const mascotEl = layer.querySelector('.mascot'), bubbleEl = layer.querySelector('.mascot-say'), starEl = layer.querySelector('.starbox b');
    let mascotTimer: ReturnType<typeof setTimeout> | 0 = 0;
    function mascot(kind, text) {
      mascotEl.classList.remove('cheer', 'hmm'); void mascotEl.offsetWidth; mascotEl.classList.add(kind);
      if (text) { bubbleEl.textContent = text; bubbleEl.classList.add('on'); clearTimeout(mascotTimer); mascotTimer = setTimeout(() => bubbleEl.classList.remove('on'), 1400); }
    }
    function reward(e) {
      const r = e && e.getBoundingClientRect ? e.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, cols = ['#ffd23f', '#ff6fae', '#5fd3ff', '#7ee35a', '#b598ff'];
      for (let k = 0; k < 14; k++) { const sp = el('i', 'spark'); const a = k / 14 * Math.PI * 2, d = 50 + Math.random() * 50; sp.style.left = cx + 'px'; sp.style.top = cy + 'px'; sp.style.background = cols[k % cols.length]; sp.style.setProperty('--sx', Math.cos(a) * d + 'px'); sp.style.setProperty('--sy', Math.sin(a) * d + 'px'); layer.appendChild(sp); setTimeout(() => sp.remove(), 800); }
      const st = el('i', 'flystar', '⭐'); st.style.left = cx - 17 + 'px'; st.style.top = cy - 17 + 'px'; layer.appendChild(st);
      const box = layer.querySelector('.starbox').getBoundingClientRect();
      requestAnimationFrame(() => { st.style.transform = `translate(${box.left + 10 - cx}px, ${box.top - cy}px) scale(.6)`; st.style.opacity = '.3'; });
      setTimeout(() => { st.remove(); stars++; starEl.textContent = stars; SFX.coin(); }, 800);
      const lines = [['Yay!', 'Hoan hô!'], ['Great!', 'Giỏi quá!'], ['Wow!', 'Oa!'], ['Clever!', 'Thông minh!'], ['Yes!', 'Đúng rồi!']];
      const l = lines[Math.floor(Math.random() * lines.length)]; mascot('cheer', T(l[0], l[1]));
    }
    function finish(won: boolean, extra: Partial<GameResult> = {}) {
      if (closed) return; closed = true; current = null;
      cleanups.forEach(f => { try { f(); } catch (e) { } });
      layer.classList.add('out'); setTimeout(() => layer.remove(), 300);
      Music.play(prevMusic || 'field');
      resolve(Object.assign({ won }, extra));
    }
    current = { close: finish };
    layer.querySelector('.gl-x').onclick = () => { SFX.tap(); finish(false); };
    layer.querySelector('.gl-how').onclick = () => { SFX.tap(); const pm = Music.key; openHowTo(id, { onClose: () => Music.play(pm) }); };
    // easy, medium or hard: three big buttons; another level starts the game again at that level
    const lv = layer.querySelector('.gl-lvl');
    if (lv) lv.onclick = () => {
      SFX.tap(); if (layer.querySelector('.gl-lvlpick')) return;
      const pk = el('div', 'gl-lvlpick');
      pk.innerHTML = `<div class="gl-lvlcard"><h3>${T('How hard?', 'Khó hay dễ?')}</h3>${LEVELS.map(([k, en, vi]) => `<button data-l="${k}" class="${k === levelPick.value ? 'on' : ''}">${esc(T(en, vi))}</button>`).join('')}</div>`;
      layer.appendChild(pk); say('How hard?', 'Khó hay dễ?');
      pk.onclick = e => { if (e.target === pk) pk.remove(); };
      pk.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { SFX.tap(); pk.remove(); if (b.dataset.l !== levelPick.value) finish(false, { restart: b.dataset.l }); });
    };
    Promise.resolve(def.run(api)).catch(e => { console.error(e); window.svModuleGone?.(e); finish(false); });
  });
}

export function burstConfetti(parent) {
  const cols = ['#ff4f9a', '#ffd23f', '#3cc7e8', '#a66bff', '#5fd39a', '#ff9f43'];
  for (let i = 0; i < 60; i++) {
    const p = el('i', 'confetti'); p.style.left = Math.random() * 100 + '%'; p.style.background = cols[i % cols.length];
    p.style.animationDelay = Math.random() * .6 + 's'; p.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
    parent.appendChild(p); setTimeout(() => p.remove(), 3200);
  }
}

// Helper: wait for one of the given elements to be tapped. Returns the element.
export function tapOne<E extends EventTarget>(els: E[], api?: Cleanup): Promise<E | null> {
  return new Promise(resolve => {
    const handlers = new Map<E, EventListener>();
    const done = (element: E | null) => { for (const [target, handler] of handlers) target.removeEventListener('click', handler); resolve(element); };
    if (typeof api?.onCleanup === 'function') api.onCleanup(() => done(null));
    for (const element of els) {
      if (handlers.has(element)) continue;
      const handler = () => done(element); handlers.set(element, handler); element.addEventListener('click', handler);
    }
  });
}
// Keep asking until the right one is tapped. check(el) -> boolean.
// Little ones (under 5) who wait 10 seconds, or miss twice, see the right answer wiggle gently.
export const HINT_AFTER = 10000;
export async function untilRight<E extends Element>(api, els: E[], check: (element: E) => boolean): Promise<E | null> {
  let misses = 0; let t: ReturnType<typeof setTimeout> | 0 = 0;
  const hint = () => { const r = els.find(x => check(x)); if (r && !api.closed) r.classList.add('hint'); };
  const arm = () => { clearTimeout(t); if (api.little) t = setTimeout(hint, misses >= 2 ? 0 : HINT_AFTER); };
  try {
    for (;;) {
      arm(); playWatch.ask = { els, check }; if (api.hand) api.hand(els.find(x => check(x)));
      const e = await tapOne(els, api); playWatch.ask = null;
      if (!e || api.closed) return null;
      if (check(e)) { e.classList.remove('hint'); api.right(e); return e; }
      misses++; api.wrong(e);
    }
  } finally { clearTimeout(t); if (playWatch.ask && playWatch.ask.els === els) playWatch.ask = null; }
}
export function choiceButtons<V>(api: { stage: Element }, items: V[], render: (value: V) => string, cls = 'choice'): (HTMLButtonElement & { _v: V })[] {
  const row = el('div', 'choices');
  const els = items.map(it => { const button: HTMLButtonElement = el('button', cls); const b = Object.assign(button, { _v: it }); b.innerHTML = render(it); row.appendChild(b); return b; });
  api.stage.appendChild(row);
  return els;
}
