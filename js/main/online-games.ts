// (v1.07 split, pure move from js/main.ts) games with friends online (js/netgames.js, round G): the Simple screen and
// Songs set up first, invitations to a game, the room's state, a friend's ride. js/main.ts calls installOnlineGames
// where this part stood, with the names of its own it uses.
import { testerArcadeAvailable } from '../content/tester-arcades.js';
import { THREE, P } from '../gfx.js';
import { farm } from '../state.js';
import { T, nm } from '../i18n.js';
import { say, hush } from '../voice.js';
import { SFX, Music } from '../audio.js';
import { openSongs } from '../songs.js';
import { familySongs } from '../content/songs.js';
import { el, esc, dist2, pick, wait } from '../util.js';
import { regionAt, REGION_NAMES } from '../world.js';
import { build, VEHICLES } from '../vehicles.js';
import { avatarURL } from '../avatar.js';
import { Net } from '../net.js';
import { dialog, toast, modal } from '../ui.js';
import { pic } from '../art.js';
import { canStartGame, openGame, gameOpen, GAMES } from '../games/frame.js';
import { events } from '../core/events.js';
import { createClaims } from '../claims.js';
import { createNetGames, onlineDef, ONLINE_GAMES } from '../netgames.js';
import { createSimple } from '../simple.js';
import { id as makeId } from '../core/ids.js';
import { animalSay } from '../roomcode.js';
import type { SvMain } from '../main.js';
import type { SvFriend } from '../main.js';
// the words under the Friends page's buttons (the room's state), read by js/main/friends.ts
export let netStatus = '';
// (the types of a friend's ride, also used by js/main.ts)
export type RideCar = { o: THREE.Object3D, wheels: THREE.Object3D[], wr: number, seat: number[], grips?: number[][], feet?: number[][] };
export type FriendRide = { key: string, slot?: { id: string, taken?: unknown, v?: RideCar }, own?: boolean, v?: RideCar,
  animal?: { id: string, mesh: THREE.Object3D, shadow: THREE.Object3D, rider?: unknown, tx?: number, tz?: number, back?: boolean, home?: number[] } };
export function installOnlineGames(G: SvMain, D: { scene: SvMain['scene'], hudFor: (h: { i: number }) => import('../hud.js').Hud, bubble: (target: unknown, text: string) => unknown, save: () => void, fruitParadeModeOn: (mode: string) => boolean, gameInfoAge: (id: string) => number }) {
  const { scene, hudFor, bubble, save, fruitParadeModeOn, gameInfoAge } = D;
const remoteName = id => (Net.remotes[id] && Net.remotes[id].name) || T('Your friend', 'Bạn');
G.simple = createSimple(G);
G.openSongs = start => openSongs(G, start); for (const f of familySongs()) Music.files[f.key] = f.file; // 🎵 Songs (round N)
G.netGames = createNetGames({
  net: { ids: () => Object.keys(Net.remotes), send: d => Net.send(d),sendQuiz:(to:string,gid:string,questions:import('../content/family-quiz.js').FamilyQuestion[])=>Net.sendFamilyQuiz(to,gid,questions,()=>G.netGames.session?.gid===gid&&G.netGames.session.seats.includes(to)&&!G.netGames.session.gone.has(G.netGames.session.seats.indexOf(to))) }, me: () => Net.me,
  onAsk: d => { // "Mít wants to play Caro with you!"
    if(document.querySelector('.parent-arcade,.parent-arcade-invite')){G.netGames.answer(d,false);return;}
    if (d.game === 'fruitparade' && !fruitParadeModeOn('multi')) { G.netGames.answer(d, false); return; }
    if(d.game === 'sparkleorchard' && !testerArcadeAvailable('sparkleorchard','multi') || d.game === 'sparklefruitbar' && !testerArcadeAvailable('sparklefruitbar','multi')) {G.netGames.answer(d,false);return;}
    // (#742/#743) this child just tapped Play again on a game with this friend: their invitation to it is the yes
    const ag = G._again; if (ag && ag.game === d.game && ag.from.includes(d.from) && Date.now() < ag.until && !gameOpen() && G.heroes[0]) { clearTimeout(ag.timer); G._again = null; G.netGames.answer(d, true); return; }
    const h = G.heroes[0], tale = /^tale-/.test(d.game) && (G.TALES || []).find(x => 'tale-' + x.id === d.game), gname = tale ? T('the story “' + tale.title() + '”', 'truyện “' + tale.title() + '”') : (GAMES[d.game] && GAMES[d.game].name()) || (d.game==='familyquiz'?T('Family Quiz','Đố Vui Gia Đình'):d.game); SFX.chime();
    say('A friend wants to play a game with you!', 'Một bạn muốn chơi trò chơi với con!');
    const stars = '⭐'.repeat(d.level || 1);
    dialog(remoteName(d.from), [[`🎲 ${remoteName(d.from)} wants to play ${gname} with you! (${stars})`, `🎲 ${remoteName(d.from)} muốn chơi ${gname} với con! (${stars})`, 'Your friend wants to play a game with you!', 'Bạn của con muốn chơi một trò với con!']], [['▶ Play', '▶ Chơi'], ['Not now', 'Để sau']])
      .then(k => { G.netGames.answer(d, k === 0 && !gameOpen() && !!h); if (k === 0) G.closePadNow(); });   // (Round V) yes closes the Friends page
  },
  onStart: (s, ask) => {
    if (!s) { toast(T('Nobody could play just now. Try again later!', 'Lúc này chưa bạn nào chơi được. Lát nữa thử lại nhé!')); return; }
    if (G._again) { clearTimeout(G._again.timer); G._again = null; }
    if (s.game === 'fruitparade' && !fruitParadeModeOn('multi')) { G.netGames.leave(); return; }
    if(s.game === 'sparkleorchard' && !testerArcadeAvailable('sparkleorchard','multi') || s.game === 'sparklefruitbar' && !testerArcadeAvailable('sparklefruitbar','multi')) {G.netGames.leave();return;}
    const names = s.seats.map(id => id === Net.me ? G.heroes[0].profile.name : remoteName(id));
    // every move is tied to this game: a story or game that is still winding down can't send into (or end) a newer one
    const live = () => !!G.netGames.session && G.netGames.session.gid === s.gid, end = () => { if (live()) G.netGames.leave(); };
    const online = { mine: s.mine, names, seed: s.gid, size: s.size, connected: () => !!Net.connected, present: seat => seat === s.mine || !s.gone.has(seat) && !!Net.remotes[s.seats[seat]], leave: end,familyQuiz:()=>live()?G.netGames.familyQuiz():null,shareFamilyQuiz:(questions:import('../content/family-quiz.js').FamilyQuestion[])=>live()&&G.netGames.shareFamilyQuiz(questions),requestFamilyQuiz:()=>{if(live())G.netGames.requestFamilyQuiz();}, peek: (n, seat) => live() ? G.netGames.session?.moves.get(n)?.get(seat) : undefined, onMove: f => live() ? G.netGames.onMove(f) : undefined, move: (n, mv) => live() && G.netGames.move(n, mv), next: (n, seat) => live() ? G.netGames.next(n, seat) : Promise.resolve(null), all: n => live() ? G.netGames.all(n) : Promise.resolve([]) };
    if (/^tale-/.test(s.game)) { // a tale read together: page turns travel as moves
      const t = (G.TALES || []).find(x => 'tale-' + x.id === s.game); if (!t || !G.readTaleNow) { end(); return; }
      // (v1.08 Release, check ownertogetherstart) the story theatre now loads after the start (js/learn.ts), so it listens a
      // moment after the game began: turns that came before it (a friend's early turns, replayed at the start) are handed
      // to it when it listens, in order, as if they had come just then
      let seq = 0; const sync = { send: p => online.move(seq++, p), listen: fn => { const off = online.onMove((seat, n, mv) => { if (seat !== s.mine) fn(mv); });
        const had = live() ? G.netGames.session.moves : null; if (had) for (const n of [...had.keys()].sort((a, b) => a - b)) for (const [seat, mv] of had.get(n)) if (seat !== s.mine) fn(mv);
        return off; } };
      G.readTaleNow(G.heroes[0], t, sync).finally(end); return;
    }
    // (Round V, owner 13 Oct) the Friends page closes when the game starts (it stayed in front of the game); "Play again"
    // after a game with friends asks the same friends again (it did nothing)
    G.closePadNow();
    // (#742/#743, v1.06, tester: "Play again exits the game") the friend's game was still on its last screen, so their device
    // said no at once. Now: a friend's Play again waits there until this child chooses (Play again says yes); a child who
    // taps Play again first asks the friends and waits longer; if they also tapped it, the two invitations become one game
    const others = s.seats.filter(id => id !== Net.me), again = () => G.inviteGame(s.game, others[0], s.level || 1, s.size, 45000);
    G.playGameOnline(s.game, s.level || 1, online).then(res => {
      end(); const want = !!res && res.next === 'again', held = G.netGames.takeRematch(s.game);
      if (held) { G.netGames.answer(held, want && !gameOpen()); if (want) G._again = { game: s.game, from: others, until: Date.now() + 8000, timer: setTimeout(() => { if (!G.netGames.session && !gameOpen()) again(); }, 6000) }; return; }
      if (want) G._again = { game: s.game, from: others, until: Date.now() + 8000, timer: setTimeout(again, 400) };
    }, end);
  },
  onEnd: id => toast(T(`${remoteName(id)} left the game.`, `${remoteName(id)} đã rời trò chơi.`))
});
for (const k of ['gask', 'gyes', 'gno', 'gstart', 'gmove', 'gbye','gquiz','gquizreq']) Net.on(k, d => G.netGames.receive(d));
// first come, first served pickups when playing together (js/claims.js)
G.claims = createClaims(G, { net: { connected: () => Net.connected, send: d => Net.send(d), name: id => remoteName(id) }, toast: (h, m) => hudFor(h).toast(m), say, T });
Net.on('claim', d => G.claims.receive(d));
// invite: one friend to a two-player game, or everyone in the room to a party game
// (owner, round G: in games with friends the players choose how hard it is: the one who invites picks 1 to 5)
G.together = () => Net.connected && Object.keys(Net.remotes).length > 0 && !G.netGames.session;
// (r63, owner: the children choose, e.g. a bigger Caro board) Caro also asks the board's size, 3 to 19 squares a side
const CARO_SIZES = [3, 6, 9, 13, 15, 19];
// (Round V, owner 13 Oct: "add a coop game button, then it shows a list of games") every game to play with the friends in the
// room on one page: the games made for friends (turns on each device), any game raced side by side, and stories read together
G.openPlayTogether = () => {
  const ids = Object.keys(Net.remotes); if (!ids.length) { toast(T('Nobody is in your room yet.', 'Chưa có bạn nào trong phòng.')); return; }
  const little = G.heroes[0].profile.age !== 'big', made = Object.keys(ONLINE_GAMES).filter(id => (id !== 'sparklefruitbar' || testerArcadeAvailable('sparklefruitbar','multi')) && (id !== 'sparkleorchard' || testerArcadeAvailable('sparkleorchard','multi')) && GAMES[id] && (id !== 'fruitparade' || fruitParadeModeOn('multi')));
  const race = Object.keys(GAMES).filter(id => !ONLINE_GAMES[id] && (!little || !gameInfoAge(id) || gameInfoAge(id) < 5)), tales = (G.TALES || []).slice(0, 12);
  const btn = (id: string, sub?: string) => `<button class="pt-g" data-g="${esc(id)}" aria-label="${esc(GAMES[id].name())}">${pic(GAMES[id].icon)}<b>${esc(GAMES[id].name())}</b>${sub ? `<small>${sub}</small>` : ''}</button>`;
  const turnGames = made.filter(id => !ONLINE_GAMES[id].all);
  const groupGames = made.filter(id => ONLINE_GAMES[id].all);
  const m = modal('playtogether', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>${pic('🎲')} ${T('Play together', 'Chơi cùng nhau')}</h2>
    <div class="pt-grid pt-made">
      ${turnGames.length ? `<h3 style="grid-column:1/-1">${pic('🎲')} ${T('Board and turn-taking', 'Bàn cờ và lần lượt')}</h3>${turnGames.map(id => btn(id, T(`up to ${ONLINE_GAMES[id].max}`, `tối đa ${ONLINE_GAMES[id].max}`))).join('')}` : ''}
      ${groupGames.length ? `<h3 style="grid-column:1/-1">${pic('👫')} ${T('Team and cooperative', 'Đồng đội và hợp tác')}</h3>${groupGames.map(id => btn(id, T(`up to ${ONLINE_GAMES[id].max}`, `tối đa ${ONLINE_GAMES[id].max}`))).join('')}` : ''}
    </div>
    <h3>${pic('🏁')} ${T('Race side by side', 'Thi đua cùng nhau')} <small>${T('everyone plays the same game, stars for all', 'mọi người chơi cùng một trò, ai cũng có sao')}</small></h3><div class="pt-grid">${race.map(id => btn(id)).join('')}</div>
    ${tales.length ? `<h3>${pic('📖')} ${T('Read a story together', 'Đọc truyện cùng nhau')}</h3><div class="pt-grid">${tales.map(t => `<button class="pt-g" data-g="tale-${esc(t.id)}" aria-label="${esc(t.title())}">${pic('📖')}<b>${esc(t.title())}</b></button>`).join('')}</div>` : ''}`);
  m.querySelector('.x').onclick = () => m.close();
  // (owner, 1 Nov 2026 AEDT) a game for two (Caro) with three or more children in the room asks who to play with (it used
  // to invite the first friend); every other game invites as before
  m.querySelectorAll('[data-g]').forEach(b => b.onclick = async () => { SFX.tap(); m.close(); const g = b.dataset.g, two = ONLINE_GAMES[g] && ONLINE_GAMES[g].max === 2;
    if (two && ids.length > 1) { const k = await dialog(T('Play with whom?', 'Chơi với bạn nào?'), [['Who do you want to play with?', 'Con muốn chơi với bạn nào?']], ids.map(id => [remoteName(id), remoteName(id)]));
      if (typeof k === 'number' && k >= 0 && ids[k]) G.inviteGame(g, ids[k]); return; }
    G.inviteGame(g, ids[0]); });
  return m;
};
G.inviteGame = (game, to, level, size, wait) => {
  if(game === 'sparkleorchard' && !testerArcadeAvailable('sparkleorchard','multi') || game === 'sparklefruitbar' && !testerArcadeAvailable('sparklefruitbar','multi')) return;
  if (game === 'fruitparade' && !fruitParadeModeOn('multi')) { toast(T('Sparkle Fruit Parade is not available yet.', 'Diễu hành trái cây lấp lánh chưa mở.')); return; }
  const p = G.heroes[0].profile;
  if (level == null) return new Promise(res => {
    const m = modal('gamelevel', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>${pic(GAMES[game] ? GAMES[game].icon : '🎲')} ${esc(GAMES[game] ? GAMES[game].name() : game)}</h2>
      ${game === 'caro' ? `<p class="note center">${T('First, how big is the board?', 'Trước hết, bàn cờ to cỡ nào?')}</p><div class="lvl-pick caro-size">${CARO_SIZES.map(n => `<button class="btn ${n === (G.caroSize || 6) ? 'primary' : ''}" data-size="${n}"><b>${n} × ${n}</b><small>${n <= 3 ? T('3 in a row', '3 hình liền') : n <= 6 ? T('4 in a row', '4 hình liền') : T('5 in a row', '5 hình liền')}</small></button>`).join('')}</div>` : ''}
      <p class="note center">${T('How hard? Everyone plays at this level.', 'Khó cỡ nào? Mọi người chơi cùng một cấp.')}</p>
      <div class="lvl-pick">${[1, 2, 3, 4, 5].map(l => `<button class="btn ${l === Math.min(5, p.levels[game] || 1) ? 'primary' : ''}" data-lvl="${l}"><b>${'⭐'.repeat(l)}</b><small>${[T('Very easy', 'Rất dễ'), T('Easy', 'Dễ'), T('Medium', 'Vừa'), T('Hard', 'Khó'), T('Very hard', 'Rất khó')][l - 1]}</small></button>`).join('')}</div>`);
    m.querySelector('.x').onclick = () => { m.close(); res(null); };
    m.querySelectorAll('[data-size]').forEach(b => b.onclick = () => { SFX.tap(); G.caroSize = +b.dataset.size; m.querySelectorAll('[data-size]').forEach(x => x.classList.toggle('primary', x === b)); });
    m.querySelectorAll('[data-lvl]').forEach(b => b.onclick = () => { SFX.tap(); m.close(); res(G.inviteGame(game, to, +b.dataset.lvl, game === 'caro' ? (G.caroSize || 6) : undefined)); });
  });
  const gid = G.netGames.invite(game, Math.max(1, Math.min(5, level)), (onlineDef(game) || {}).all ? undefined : to, { size, wait });
  if (gid) toast(T('Invitation sent! Waiting for an answer…', 'Đã gửi lời mời! Đang chờ trả lời…')); return gid;
};
G.playGameOnline = async (id, level, online) => {
  if(id==='familyquiz')(await import('../games/familyquiz.js')).registerFamilyQuiz();
  if(id === 'sparklefruitbar' && !testerArcadeAvailable('sparklefruitbar','multi'))return;
  if(id === 'sparkleorchard' && !testerArcadeAvailable('sparkleorchard','multi'))return;
  if (id === 'fruitparade' && !fruitParadeModeOn('multi')) return;
  const p = G.heroes[0]?.profile; if(!p || !canStartGame(id,[p])) return;
  if (gameOpen()) return; G.paused = true; hush();
  const little = p.age !== 'big';
  const actId = makeId('act', id, String(++G.actCount)), playerIds = online.names.map((_, s) => s === online.mine ? makeId('player', p.id || 'guest') : makeId('player', 'online-' + s));
  events.emit('ActivityStarted', { activityId: actId, kind: 'game', defId: makeId('game', id), players: playerIds, source: 'online' });
  const res = await openGame(id, { players: [p], level, little, strong: false, online, style: 'village' });
  G.paused = false;
  if (res.won && id !== 'sparklefruitbar') { events.emit('ActivityCompleted', { activityId: actId, defId: makeId('game', id), players: playerIds, result: { won: true, stars: res.stars || 0, level } }); farm.coins += 5; save(); }
  else events.emit('ActivityAbandoned', { activityId: actId, reason: 'left' });
  return res;
};

Net.on('left', r => {
  G.netGames.left(r.id);
  const P = G.partners[r.id]; if (P) { friendRide(P, {}); scene.remove(P.av.root); scene.remove(P.tag); delete G.partners[r.id]; }
  if (!Net.connected || !Object.keys(G.partners).length) G.huds.forEach(hd => hd.setCall(false));
  toast(T(`${r.name || 'Your friend'} left.`, `${r.name || 'Bạn'} đã rời đi.`)); if (G.onNet) G.onNet();
});
// "Come and meet me!": a friend asks you to come to where they are
Net.on('meet', d => {
  const P = G.partners[d.from]; if (!P || !G.heroes[0]) return;
  SFX.chime(); bubble(P, '📣 ' + T('Come here!', 'Lại đây nè!'));
  dialog(P.name, [[`📣 ${P.name} wants to meet you! Shall we go?`, `📣 ${P.name} muốn gặp con! Mình đi nhé?`, 'Your friend wants to meet you! Shall we go?', 'Bạn của con muốn gặp con! Mình đi nhé?']], [['👣 Walk there', '👣 Đi bộ đến'], ['✨ Fly there', '✨ Bay đến'], ['🙂 Not now', '🙂 Để sau']])
    .then(k => { const h = G.heroes[0]; if (k === 0) G.walkToFriend(h, P.id); if (k === 1) G.flyToFriend(h, P.id); if (k === 2) Net.send({ t: 'emote', id: 'wait' }); });
});
G.flyToFriend = (h, id) => { const P = G.partners[id]; if (!P || P.pos.y < -40) return; G.travel(h, P.pos.x - 4.5 + 1.5, P.pos.z - 1 + 1.5); setTimeout(() => { bubble(h, '👋 ' + T('Hi!', 'Chào!')); Net.send({ t: 'emote', id: 'hi' }); }, 900); };
G.followFriend = (i, id) => { const h = G.heroes[i]; if (!h) return; if (h.followId === id) { h.followId = null; h.goal = null; hudFor(h).toast('👣 ' + T('Stopped following.', 'Ngừng đi theo.')); return; } h.followId = id; const nm2 = remoteName(id); hudFor(h).toast('🚶 ' + T(`Following ${nm2}. Move the joystick to stop.`, `Đang đi theo ${nm2}. Đẩy cần điều khiển để dừng.`)); say('Follow your friend!', 'Đi theo bạn nào!'); };
G.walkToFriend = (h, id) => { const P = G.partners[id]; if (!P || P.pos.y < -40) return; h.walkTo = { friend: id, x: P.pos.x, z: P.pos.z, name: P.name }; say('Follow the footprints to your friend!', 'Đi theo dấu chân đến chỗ bạn nhé!'); };
G.askFriendToCome = (h, id) => { const P = G.partners[id]; if (!P) return; Net.send({ t: 'meet', to: id }); bubble(h, '📣 ' + T('Come here!', 'Lại đây nè!')); hudFor(h).toast('📣 ' + T(`Asked ${P.name} to come to you`, `Đã gọi ${P.name} đến chỗ con`)); };
// where are my friends? a little card with each friend's distance and direction, and ways to meet
const compass = (h, x, z) => { const a = Math.atan2(x - h.pos.x, -(z - h.pos.z)); return ['⬆️ ' + T('north', 'phía bắc'), '↗️ ' + T('north-east', 'đông bắc'), '➡️ ' + T('east', 'phía đông'), '↘️ ' + T('south-east', 'đông nam'), '⬇️ ' + T('south', 'phía nam'), '↙️ ' + T('south-west', 'tây nam'), '⬅️ ' + T('west', 'phía tây'), '↖️ ' + T('north-west', 'tây bắc')][(Math.round(a / (Math.PI / 4)) + 8) % 8]; };
G.friendWhere = (h, P) => { const rg = regionAt(P.pos.x, P.pos.z); return (REGION_NAMES[rg] ? REGION_NAMES[rg]() : ''); };
G.findFriend = i => {
  const h = G.heroes[i]; if (!h) return null;
  const list = Object.values(G.partners).filter(P => P.pos.y > -40);
  if (!list.length) { G.openPad(i, 'friend'); return ['No friends are in your room yet. Start a room and tell your friend the number!', 'Chưa có bạn nào trong phòng. Tạo phòng rồi đọc số cho bạn nhé!']; }
  document.querySelector<HTMLElement>('.vc-pop:not(.knockpop)')?.remove(); // (a friend at the door stays at the door)
  const pop = el('div', 'vc-pop friendfind', `<p class="vc-heard">👫 ${T('Where are my friends?', 'Bạn của con ở đâu?')}</p>
    ${list.map(P => { const d = Math.round(dist2(h.pos.x, h.pos.z, P.pos.x, P.pos.z)); return `<div class="ff-row"><img src="${P.photoURL || ''}" alt="" ${P.photoURL ? '' : 'hidden'}><div class="ff-txt"><b>${esc(nm(P.name))}</b><small>${d} m · ${compass(h, P.pos.x, P.pos.z)}${G.friendWhere(h, P) ? ' · ' + esc(G.friendWhere(h, P)) : ''}</small></div>
      <div class="ff-btns"><button class="btn primary" data-walk="${P.id}">👣 ${T('Walk', 'Đi bộ')}</button><button class="btn" data-fly="${P.id}">✨ ${T('Fly', 'Bay')}</button><button class="btn" data-call="${P.id}">📣 ${T('Ask to come', 'Gọi bạn đến')}</button><button class="btn${h.followId === P.id ? ' primary' : ''}" data-follow="${P.id}">🚶 ${h.followId === P.id ? T('Stop following', 'Thôi đi theo') : T('Follow', 'Đi theo')}</button></div></div>`; }).join('')}`);
  const x = el('button', 'vc-x', '✕'); pop.appendChild(x); x.onclick = () => pop.remove();
  document.body.appendChild(pop); SFX.tap(); G.walkAwayClose(pop, () => pop.remove());
  pop.querySelectorAll('[data-walk]').forEach(b => b.onclick = () => { pop.remove(); G.walkToFriend(h, b.dataset.walk); });
  pop.querySelectorAll('[data-fly]').forEach(b => b.onclick = () => { pop.remove(); G.flyToFriend(h, b.dataset.fly); });
  pop.querySelectorAll('[data-call]').forEach(b => b.onclick = () => { pop.remove(); G.askFriendToCome(h, b.dataset.call); });
  // (#741, v1.06, tester: "the follow button should be where my friend is: tap them, then follow") Follow on each friend's own row
  pop.querySelectorAll('[data-follow]').forEach(b => b.onclick = () => { SFX.tap(); pop.remove(); G.followFriend(i, b.dataset.follow); });
  return null;
};
// the signal bars change every few seconds: only their words are updated (round O, owner: the Friends screen was
// redrawn whole every two seconds, so a tap could land on a button that had just been replaced and ✕ seemed stuck)
Net.on('quality', () => { const b = document.querySelector<HTMLElement>('.pad .online.on'); if (b && G.netTick) G.netTick(b); });
addEventListener('online', () => { toast(T('Back online!', 'Có mạng lại rồi!')); G.listenFriends && G.listenFriends(); });
addEventListener('offline', () => toast(T('No internet right now. Friends will come back when it returns.', 'Đang mất mạng. Khi có mạng lại, các bạn sẽ quay lại.')));
Net.on('micchange', () => G.huds.forEach(hd => hd.setCall(Net.connected, false, Net.muted || !Net.micLive)));
Net.on('talking', on => G.huds.forEach(hd => hd.setCall(Net.connected, on, Net.muted || !Net.micLive)));
const _np = new THREE.Vector3();
// (#744, v1.06, tester: "my friend drives but I can't see them driving") a friend's ride on this screen: the same bicycle,
// car or buffalo moves with them (before, it stayed parked and the friend sat on the ground), and stays where they get
// off. A vehicle this child is riding, or one this device does not have, is drawn as a copy instead.
function friendRide(P: SvFriend, s: { rv?: string, rm?: string }): FriendRide | null {
  const key = s.rv || '', had = P.ride as FriendRide | undefined;
  if (had && had.key === key) return had;
  if (had) { // got off: the vehicle stays where it was left, an animal walks home (as for a child here: js/player.ts dismount)
    if (had.own && had.v) scene.remove(had.v.o);
    if (had.slot) had.slot.taken = null;
    if (had.animal) { const b = had.animal; b.rider = null; b.tx = b.mesh.position.x; b.tz = b.mesh.position.z; if (b.home) { b.tx = b.home[0]; b.tz = b.home[1]; b.back = true; } }
    const A = P.av as unknown as Record<string, THREE.Object3D>; A.torso.rotation.set(0, 0, 0); A.torso.position.set(0, 0, 0); A.head.position.set(0, 1.33, 0); A.head.rotation.set(0, 0, 0); A.armL.scale.y = A.armR.scale.y = 1;
    P.ride = undefined;
  }
  if (!key) return null;
  const ride: FriendRide = { key }, n = /^v(\d{1,4})$/.exec(key);
  if (n) {
    const tr = G.traffic as unknown as { slots: FriendRide['slot'][], make(sl: unknown): void } | undefined, sl = tr && tr.slots[+n[1]];
    if (sl && sl.id === s.rm && !sl.taken) { if (!sl.v) tr.make(sl); sl.taken = P; ride.slot = sl; ride.v = sl.v; }
    else if (s.rm && Object.hasOwn(VEHICLES, s.rm)) { ride.v = build(s.rm) as unknown as RideCar; ride.own = true; scene.add(ride.v.o); }
  } else {
    const b = ((G.world as unknown as { rideAnimals?: FriendRide['animal'][] }).rideAnimals || []).find(x => x.id === key && !x.rider);
    if (b) { b.rider = P; ride.animal = b; }
  }
  P.ride = ride; return ride;
}
Net.on('status', s => {
  let msg = {
    waiting: T(`Room code: ${s.code}. Tell your friend this number!`, `Mã phòng: ${s.code}. Đọc số này cho bạn nhé!`), connecting: T('Connecting…', 'Đang kết nối…'), connected: T('Connected! You can talk now.', 'Đã kết nối! Giờ có thể nói chuyện rồi.'),
    nocode: T('No room with that number. Check the code.', 'Không có phòng số này. Kiểm tra lại mã nhé.'),
    mictap: T('Your microphone is off. Tap 🎙️ Mic to talk to your friend.', 'Micrô đang tắt. Chạm nút 🎙️ Micrô để nói chuyện với bạn nhé.'),
    micdenied: T('The microphone is switched off for this game. A grown-up can allow it: iPhone Settings → Safari (or the game) → Microphone → Allow.', 'Micrô đang bị tắt cho trò chơi này. Người lớn có thể bật: Cài đặt iPhone → Safari (hoặc trò chơi) → Micrô → Cho phép.'),
    micbusy: T('Another app or a call (like FaceTime) is using the microphone. End the call, then tap 🎙️ Mic again.', 'Một ứng dụng khác hoặc cuộc gọi (như FaceTime) đang dùng micrô. Hãy tắt cuộc gọi rồi chạm 🎙️ Micrô lần nữa nhé.'),
    micask: T('Asking for the microphone… On iPhone or iPad, tap Allow.', 'Đang xin dùng micrô… Trên iPhone hoặc iPad, chạm Cho phép nhé.'),
    micold: T('This iPhone or iPad cannot use the microphone in the game. A grown-up can update it to iOS 14.3 or newer, or open the game in Safari.', 'iPhone hoặc iPad này chưa dùng được micrô trong trò chơi. Người lớn có thể cập nhật lên iOS 14.3 trở lên, hoặc mở trò chơi trong Safari.'),
    micon: T('Microphone on: your friend can hear you!', 'Đã bật micrô: bạn có thể nghe con nói rồi!'),
    micstop: T('The iPhone switched the microphone off (the game went to the background). Tap 🎙️ Mic to turn it on again.', 'iPhone đã tắt micrô (khi trò chơi chạy nền). Chạm 🎙️ Micrô để bật lại nhé.'),
    micstuck: T('The iPhone has not answered. Close the game fully (swipe it away), open it again, then tap 🎙️ Mic.', 'iPhone chưa trả lời. Hãy tắt hẳn trò chơi (vuốt lên để đóng), mở lại rồi chạm 🎙️ Micrô nhé.'),
    nomic: T('No microphone: your friend will not hear you, but you can still play and use the talk buttons.', 'Không có micrô: bạn sẽ không nghe được con, nhưng vẫn chơi và dùng nút nói được.'),
    left: T('The room has closed.', 'Phòng đã đóng.'), full: T('That room is full (6 players). Start your own room!', 'Phòng đã đủ 6 người. Hãy tạo phòng mới nhé!'), tapaudio: T('Tap the 🎙️ button to hear your friend.', 'Chạm nút 🎙️ để nghe bạn nói.'), cloud: T('Connected through the cloud relay! You can play and use the talk buttons. (Voice calls need a direct link: try both on Wi-Fi, or ask a grown-up to add a relay.)', 'Đã kết nối qua mạng đám mây! Chơi và dùng nút nói được. (Gọi bằng giọng nói cần kết nối trực tiếp: thử cả hai dùng Wi-Fi, hoặc nhờ người lớn thêm máy chủ trung chuyển.)'), error: T('Could not connect. Check the internet and try again.', 'Không kết nối được. Kiểm tra mạng rồi thử lại.'),
    removed: T('The room’s starter asked you to leave the room.', 'Chủ phòng đã mời con ra khỏi phòng.'),
    off: T('Playing with friends is off. Ask a grown-up to turn it on.', 'Chơi cùng bạn đang tắt. Nhờ người lớn bật lên nhé.'),
    knocking: T('Knock knock! Waiting for the room’s starter to let you in…', 'Cốc cốc! Đang chờ chủ phòng cho con vào…'),
    oldmap: T('Your friend has a different valley. Ask a grown-up to update the game.', 'Thung lũng của bạn khác với của con. Nhờ người lớn cập nhật trò chơi nhé.'),
    denied: T('The room’s starter said not this time. You can start your own room!', 'Chủ phòng chưa cho vào lần này. Con có thể tự tạo phòng nhé!'),
    noanswer: T('Nobody opened the door. Ask your friend to tap “Let in”, or start your own room.', 'Chưa ai mở cửa. Nhờ bạn chạm “Cho vào”, hoặc tự tạo phòng nhé.'),
    slow: T('Still connecting… This can take a little longer when you are on different networks.', 'Vẫn đang kết nối… Khi hai máy ở hai mạng khác nhau có thể lâu hơn một chút.'),
    stuck: T('Could not link the two devices. Try: both on Wi-Fi (or both on mobile data), start the room on the other device, or ask a grown-up to add a relay in Grown-ups → Internet and playing online.', 'Không nối được hai máy. Thử: cả hai dùng Wi-Fi (hoặc cả hai dùng 4G), để máy kia tạo phòng, hoặc nhờ người lớn thêm máy chủ trung chuyển trong mục Phụ huynh → Internet và chơi trực tuyến.')
  }[s.key] || '';
  if (s.key === 'oldmap') G.mapCard();
  if (s.key === 'waiting') { const code = s.code; msg = T(`Room code: ${code} (${animalSay(code)}). Tell your friend!`, `Mã phòng: ${code} (${animalSay(code)}). Đọc cho bạn nhé!`); }
  // with Friends open the message shows in it, not over its tabs (round O)
  netStatus = msg; if (msg && s.key !== 'oldmap' && !document.querySelector<HTMLElement>('.pad .online')) toast(msg); /* (the map card says it) */ if (G.onNet) G.onNet(); if (['waiting', 'connected', 'cloud', 'left'].includes(s.key)) G.shareStatus();
});
// Knock knock: someone wants to come into my room. The room's starter sees their name and picture and decides;
// they hear and see nothing of the room until then. Saved friends come straight in (net.js).
let knockPop = null;
const showKnock = () => {
  const k = [...Net.knocks.values()].sort((a, b) => a.at - b.at)[0];
  if (!k) { if (knockPop) { knockPop.remove(); knockPop = null; } return; }
  if (knockPop && knockPop.isConnected && knockPop.dataset.id === k.id) return;
  if (knockPop) knockPop.remove();
  const name = k.name || T('Someone', 'Một bạn');
  knockPop = el('div', 'vc-pop knockpop', `<p class="vc-heard">🚪 ${T('Knock knock!', 'Cốc cốc!')}</p><div class="ff-row"><img src="${avatarURL({ photo: k.photo, look: Object.assign({ hair: '#1d1412', skin: '#f6c7a5' }, k.look) })}" alt=""><div class="ff-txt"><b>${esc(nm(name))}</b><small>${T('wants to come into your room', 'muốn vào phòng của con')}</small></div></div>
    <div class="ff-btns"><button class="btn primary" data-in>✅ ${T('Let in', 'Cho vào')}</button><button class="btn" data-no>❌ ${T('No thanks', 'Không, cảm ơn')}</button></div>
    <small class="note">${T('Only let in someone you know. A grown-up can help.', 'Chỉ cho người con biết vào thôi. Người lớn có thể giúp con.')}</small>`);
  knockPop.dataset.id = k.id; document.body.appendChild(knockPop); SFX.chime();
  say('Someone is knocking. Do you want to let them in?', 'Có bạn đang gõ cửa. Con có muốn cho bạn vào không?'); // (the name and photo are on the card)
  knockPop.querySelector('[data-in]').onclick = () => { SFX.tap(); Net.admit(k.id); };
  knockPop.querySelector('[data-no]').onclick = () => { SFX.tap(); Net.deny(k.id); };
};
Net.on('knock', () => { showKnock(); if (G.onNet) G.onNet(); });
Net.on('knockagain', () => showKnock()); // (the card is drawn again only when it is not on screen)
  return { friendRide, _np };
}
