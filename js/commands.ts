// Voice control: press 🎤 and say what you want, in English or Vietnamese.
// "Open the map", "play marbles", "go to the village", "how do I play Mr Wolf", "talk to Jack", "let's go"…
import { T } from './i18n.js';
import { settings, saveSettings } from './state.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { GAMES } from './games/frame.js';
import { openHowTo } from './howto.js';
import { listen, canListen, stopListening, has, plain } from './listen.js';
import { findTarget, PERSONAS } from './chat.js';
import { el, esc, dist2 } from './util.js';

// The Ask button shows whenever it is switched on. Where the device cannot listen (iPhone Home-Screen apps,
// Firefox), it offers picture questions instead, which run the same commands.
export const voiceControlOn = () => settings.voiceControl !== false;
const ASK_PICS = [
  ['🗺️', 'Open the map', 'Mở bản đồ', 'map'], ['🎮', 'Games', 'Trò chơi', 'games'], ['🎒', 'My bag', 'Ba lô', 'bag'],
  ['▶️', "Let's go!", 'Đi thôi!', "let's go"], ['❓', 'What should I do?', 'Con làm gì bây giờ?', 'what should i do'],
  ['🧒', 'Find my friend', 'Tìm bạn của con', 'find my friend'], ['🏡', 'Go home to the farm', 'Về nông trại', 'go to farm']
];
function askByPictures(G, i) {
  const h = G.heroes[i];
  const pop = el('div', 'vc-pop ask-pics', `<p class="vc-heard">${T('What would you like?', 'Con muốn gì nào?')}</p><div class="ask-grid">${ASK_PICS.map((a, k) => `<button data-k="${k}"><span>${a[0]}</span><small>${esc(T(a[1], a[2]))}</small></button>`).join('')}</div>`);
  const x = el('button', 'vc-x', '✕'); pop.appendChild(x); x.onclick = () => pop.remove();
  document.body.appendChild(pop); SFX.tap(); say('What would you like?', 'Con muốn gì nào?'); if (G.walkAwayClose) G.walkAwayClose(pop, () => pop.remove());
  pop.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { pop.remove(); SFX.tap(); const reply = runCommand(G, h, ASK_PICS[+b.dataset.k][3]); if (reply) say(reply[0], reply[1]); });
}

// Work out what was meant and do it. Returns a short reply [en, vi] to say back.
export function runCommand(G, h, text) {
  const i = h.i, tg = findTarget(G, text);
  if (has(text, 'how to play', 'how do i play', 'cach choi', 'choi the nao', 'choi sao') && tg && tg.kind === 'game') { G.paused = true; openHowTo(tg.id, { onPlay: () => { G.paused = false; G.playGame(i, tg.id, 'place'); }, onClose: () => { G.paused = false; } }); return ['Here is how to play!', 'Đây là cách chơi nhé!']; }
  if (has(text, 'talk to', 'chat with', 'hello', 'hi', 'noi chuyen', 'tro chuyen', 'chao', 'hoi') && tg && tg.kind === 'npc') { G.chatWith(i, tg.id); return null; }
  if (has(text, 'play', 'choi') && tg && tg.kind === 'game') { G.playGame(i, tg.id, 'place'); return [`Let's play ${GAMES[tg.id].name()}!`, `Chơi ${GAMES[tg.id].name()} nào!`]; }
  if (has(text, 'go to', 'take me', 'where', 'walk to', 'fly to', 'di den', 'den', 'o dau', 'dua toi', 'dan toi', 've') && tg) {
    if (tg.kind === 'game') G.goToGame(i, tg.id);
    else if (tg.kind === 'npc') { const n = G.npcs.find(x => x.id === tg.id); if (n) G.travel(h, n.x - 1.5, n.z + 2); }
    else G.travel(h, tg.x, tg.z);
    return [`Off we go to ${tg.name}!`, `Mình đi đến ${tg.name} nào!`];
  }
  if (has(text, 'find my friend', 'where is my friend', 'my friend', 'tim ban', 'ban cua con', 'ban oi')) { if (G.findFriend) return G.findFriend(i); }
  if (has(text, 'go to farm', 'go home', 've nha', 've nong trai')) { G.travel(h, -26, 120); return ['Off we go to the farm!', 'Mình về nông trại nào!']; }
  if (has(text, 'map', 'ban do')) { G.openPad(i, 'map'); return ['Here is your map.', 'Bản đồ của con đây.']; }
  if (has(text, 'bag', 'backpack', 'tui', 'ba lo', 'do dac')) { G.openPad(i, 'bag'); return ['Here is your bag.', 'Ba lô của con đây.']; }
  if (has(text, 'music off', 'stop music', 'no music', 'tat nhac')) { if (settings.music) G.toggleAudio('music'); return ['Music off.', 'Đã tắt nhạc.']; }
  if (has(text, 'music on', 'play music', 'bat nhac', 'mo nhac')) { if (!settings.music) G.toggleAudio('music'); return ['Music on!', 'Bật nhạc rồi!']; }
  if (has(text, 'what should i do', 'what now', 'quest', 'goal', 'mission', 'lam gi', 'nhiem vu', 'muc tieu')) { G.sayObjective(i); return null; }
  if (has(text, "let's go", 'lets go', 'go', 'di thoi', 'di nao', 'xuat phat')) { G.goToObjective(i); return null; }
  if (has(text, 'games', 'game', 'tro choi', 'choi')) { G.openGamesHub(i); return ['Which game shall we play?', 'Mình chơi trò gì nào?']; }
  if (has(text, 'jump', 'nhay')) { G.pads[i]._jump = true; return ['Boing!', 'Nhảy nào!']; }
  if (tg && tg.kind === 'game') { G.playGame(i, tg.id, 'place'); return [`Let's play ${GAMES[tg.id].name()}!`, `Chơi ${GAMES[tg.id].name()} nào!`]; }
  if (tg && tg.kind === 'npc') { G.chatWith(i, tg.id); return null; }
  if (tg && tg.kind === 'place') { G.travel(h, tg.x, tg.z); return [`Off we go to ${tg.name}!`, `Mình đi đến ${tg.name} nào!`]; }
  // if a villager is nearby, ask them
  const n = G.npcs.filter(x => PERSONAS[x.id]).sort((a, b) => dist2(a.x, a.z, h.pos.x, h.pos.z) - dist2(b.x, b.z, h.pos.x, h.pos.z))[0];
  if (n && dist2(n.x, n.z, h.pos.x, h.pos.z) < 8) { G.chatWith(i, n.id, text); return null; }
  return ['Hmm, I did not understand. Try: open the map, play marbles, or let us go!', 'Ừm, tớ chưa hiểu. Thử nói: mở bản đồ, chơi bắn bi, hoặc đi thôi!'];
}

// The 🎤 button: listen, show the words, then do it.
export async function voiceCommand(G, i) {
  const h = G.heroes[i]; if (!h || !voiceControlOn() || document.querySelector('.vc-pop')) return;
  if (!canListen()) { askByPictures(G, i); return; }
  const pop = el('div', 'vc-pop', `<div class="vc-mic">🎤</div><p class="vc-heard">${T('Listening… say what you want!', 'Đang nghe… con muốn gì thì nói nhé!')}</p>
    <small>${T('“Open the map” · “Play marbles” · “Go to the village” · “Talk to Jack” · “Let’s go!”', '“Mở bản đồ” · “Chơi bắn bi” · “Đi đến làng” · “Nói chuyện với Jack” · “Đi thôi!”')}</small>`);
  document.body.appendChild(pop); SFX.tap();
  // tap anywhere on the bubble to stop listening
  const x = el('button', 'vc-x', '✕'); pop.appendChild(x); pop.onclick = () => stopListening();
  const heard = await listen({ onPartial: t => { pop.querySelector('.vc-heard').textContent = '“' + t + '”'; } });
  if (heard === '\u0000denied') { pop.querySelector('.vc-heard').textContent = T('The microphone is not allowed. A grown-up can turn it on in the browser settings.', 'Micro chưa được cho phép. Người lớn có thể bật trong cài đặt trình duyệt.'); setTimeout(() => pop.remove(), 3500); import('./mictest.js').then(M => M.openMicTest()); return; }
  if (!heard) { pop.querySelector('.vc-heard').textContent = T('I did not hear anything. Try again!', 'Tớ chưa nghe thấy gì. Thử lại nhé!'); say('I did not hear anything. Try again!', 'Tớ chưa nghe thấy gì. Thử lại nhé!'); setTimeout(() => pop.remove(), 2000); return; }
  pop.querySelector('.vc-heard').textContent = '“' + heard + '”';
  const reply = runCommand(G, h, heard);
  if (reply) say(reply[0], reply[1]);
  setTimeout(() => pop.remove(), 900);
}
