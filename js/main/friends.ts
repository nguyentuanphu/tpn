// (v1.07 split, pure move from js/main.ts) friends: codes, invites, the online panel. js/main.ts calls installFriends
// where this part stood; whether a child is playing is read through isPlaying() (main.ts's own `playing`, which only
// main.ts sets).
import { P } from '../gfx.js';
import { settings, saveSettings } from '../state.js';
import { T, nm } from '../i18n.js';
import { say } from '../voice.js';
import { SFX, ac } from '../audio.js';
import { el, esc, $ } from '../util.js';
import { REGION_NAMES } from '../world.js';
import { avatarURL } from '../avatar.js';
import { Net, MAX_ROOM, ROOM_LEN, okPub } from '../net.js';
import { dialog, toast, modal, openGrownups } from '../ui.js';
import { holdButton } from '../popups.js';
import { pic } from '../art.js';
import { gameOpen } from '../games/frame.js';
import { codeHTML, bindCode, padHTML, boxHTML } from '../roomcode.js';
import { netStatus } from './online-games.js';
import type { SvMain } from '../main.js';

export function installFriends(G: SvMain, D: { sendHello: () => unknown, isPlaying: () => boolean }) {
  const { sendHello, isPlaying } = D;
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
if (!settings.friendCode) { settings.friendCode = Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join(''); saveSettings(); }
if (!Array.isArray(settings.friends)) settings.friends = [];
// online by default: a child who has friends on the list lets them see when they are playing (from round 28 on;
// a grown-up or the child can still switch it off in the online panel). (round R privacy, 9 Oct) only once a grown-up
// has turned online play on: until then nothing is shared at all
if (settings.online && settings.friends.length && !settings.friendsOnR28) { settings.friendsOn = true; settings.friendsOnR28 = true; saveSettings(); }
// leaving a room with friends in it to go to another one is asked first (round O)
const leaveOk = async () => !(Net.role && Net.count > 1) || (await dialog(T('Your room', 'Phòng của con'), [[`You are playing with ${Object.values(Net.remotes).map(r => nm(r.name)).join(', ')}. Leave this room?`, `Con đang chơi với ${Object.values(Net.remotes).map(r => nm(r.name)).join(', ')}. Rời phòng này nhé?`, 'You are playing with friends. Leave this room?', 'Con đang chơi với các bạn. Rời phòng này nhé?']], [['✅ Leave and go', '✅ Rời và sang'], ['❌ Stay', '❌ Ở lại']])) === 0;
// (Online, r57, ROUND-T §4) a friend on another map layout can't play together (positions are raw x, z): a picture card
// with a voice instead of joining (owner, 11 Oct: only the one who wanted to join is told)
G.mapCard = () => {
  document.querySelectorAll<HTMLElement>('.modal.mapcard').forEach(m => m.remove());
  const m = modal('mapcard', `<div class="mc-pic">${pic('🗺️')}</div><h2>${T('Different valley', 'Thung lũng khác')}</h2>
    <p class="center">${T('Your friend has a different valley. Ask a grown-up to update the game.', 'Thung lũng của bạn khác với của con. Nhờ người lớn cập nhật trò chơi nhé.')}</p>
    <div class="actions center"><button class="btn primary big" data-ok>${T('OK', 'Được rồi')}</button></div>`);
  say('Your friend has a different valley. Ask a grown-up to update the game.', 'Thung lũng của bạn khác với của con. Nhờ người lớn cập nhật trò chơi nhé.');
  m.querySelector('[data-ok]').onclick = () => { SFX.tap(); m.close(); };
};
const onInvite = async inv => {
  if (!settings.online) return;
  if (!Net.sameMap(inv.map)) { SFX.chime(); G.mapCard(); return; } // (r57) another map layout: the card instead of joining
  SFX.chime(); say('A friend invites you to play!', 'Một bạn mời con chơi cùng!');
  const k = await dialog(T('Invitation', 'Lời mời'), [[`👫 ${inv.name} invites you to play together! Join their room ${inv.room}?`, `👫 ${inv.name} mời con chơi cùng! Vào phòng ${inv.room} nhé?`, 'A friend invites you to play together! Shall we join?', 'Một bạn mời con chơi cùng! Mình vào nhé?']], [['✅ Join', '✅ Vào'], ['❌ Not now', '❌ Để sau']]);
  // (round R privacy) the invitation came locked from a saved friend; when they started the room, only their key may answer the knock
  if (k === 0 && await leaveOk()) Net.join(inv.room, sendHello() || {}, { hostPub: inv.hostPub });
};
// invite a friend: into my room, starting one first when I have none
// (round R privacy, 9 Oct) an invitation carries my room number locked for that friend, so it needs the friend's key, saved
// when the two played together and tapped ＋👫: 'nokey' without it (the child is told to say the room number instead)
G.inviteFriend = async code => {
  if (!settings.online) return false;
  if (!Net.canInvite(code)) return 'nokey';
  const h = G.heroes[0]; if (!Net.role) await Net.host(sendHello() || {});
  if (Net.role !== 'host' && Net.role !== 'guest') return false;
  const both = await Promise.all([Net.invite(code, h ? h.profile.name : ''), Net.cloudInvite(code, h ? h.profile.name : '')]);
  return both[0] || both[1];
};
const inviteToast = ok => toast(ok === 'nokey' ? T('Invitations work after you have played together once and tapped ＋👫. For now, tell your friend your room number.', 'Lời mời dùng được sau khi hai bạn đã chơi cùng một lần và chạm ＋👫. Bây giờ con đọc số phòng cho bạn nhé.') : ok ? T('Invitation sent!', 'Đã gửi lời mời!') : T('Your friend is not online right now.', 'Bạn ấy đang không trực tuyến.'));
G.joinFriend = async (room, hostPub) => { if (await leaveOk()) await Net.join(room, sendHello() || {}, { hostPub }); };
G.listenFriends = () => {
  // (round R privacy, 9 Oct) online play off: no listening, no status, nothing shared
  if (!settings.online || !isPlaying()) { Net.stopListening(); Net.friendsStop(); return; }
  if (settings.friendsOn) Net.listenForFriends(settings.friendCode, onInvite); else Net.stopListening();
  // friends' status (online, where in the valley, which room) through the cloud relay
  if (isPlaying() && (settings.friendsOn || settings.friends.length)) {
    Net.friendsStart({ code: settings.friendCode, share: !!settings.friendsOn, onInvite, onChange: () => { if (G.onNet) G.onNet(); G.autoMeet(); } }).then(() => { Net.friendsWatch(settings.friends.map(f => f.code)); G.shareStatus(); });
  } else Net.friendsStop();
};
// Friends: told, never moved (round O, owner: "if a friend comes online, don't put us in one room by ourselves, just
// tell the player; if my friend and A are in one room and I have B in another, how would that work?"). When a friend
// on the list starts playing, a small card says so once, with 📨 Invite (into my room; a room is started when I have
// none) and, when they are already in a room, ▶ Go to their room (with friends in my room, it asks before leaving).
// Nobody changes room unless they tap; the friend who is invited decides too.
const told = new Set();
G.autoMeet = () => {
  if (!isPlaying() || !settings.online || settings.autoMeet === false || !settings.friendsOn || !settings.friends.length) return;
  const now = Date.now();
  for (const f of settings.friends) {
    const st = Net.friends.status[f.code], on = st && st.online && now - (st.seen || 0) < 3 * 60000;
    if (!on) { told.delete(f.code); continue; }
    if (told.has(f.code) || (st.room && st.room === Net.code)) { told.add(f.code); continue; }
    if (gameOpen() || (G.worldHidden && G.worldHidden() && !(G.simple && G.simple.open)) || document.querySelector<HTMLElement>('.friendnote, .storybook, .dialog, .modal, .theatre')) continue; // (later: not over a game, a story or a question)
    told.add(f.code); friendNote(f, st);
  }
};
function friendNote(f, st) {
  const name = nm(st.name || f.name), where = st.at && REGION_NAMES[st.at] ? REGION_NAMES[st.at]() : '';
  const pop = el('div', 'vc-pop friendnote', `<p class="vc-heard">🟢 ${esc(T(`${name} is playing!`, `${name} đang chơi!`))}</p><div class="ff-row"><div class="ff-txt"><small>${esc(where)}${st.room ? ' · ' + T('in a room', 'đang ở trong phòng') + ` (${(st.players || 1)}/${MAX_ROOM})` : ''}</small></div></div>
    <div class="ff-btns"><button class="btn primary" data-inv>📨 ${T('Invite', 'Mời bạn')}</button>${st.room && (st.players || 1) < MAX_ROOM && Net.sameMap(st.map) ? `<button class="btn" data-go>▶ ${T('Go to their room', 'Sang phòng bạn')}</button>` : ''}<button class="btn" data-no>${T('Later', 'Để sau')}</button></div>`);
  document.body.appendChild(pop); SFX.chime(); say('Your friend is playing too!', 'Bạn của con cũng đang chơi!');
  const close = () => { pop.remove(); clearTimeout(t); }, t = setTimeout(close, 45000);
  pop.querySelector('[data-no]').onclick = () => { SFX.tap(); close(); };
  pop.querySelector('[data-inv]').onclick = async () => { SFX.tap(); close(); inviteToast(await G.inviteFriend(f.code)); };
  const go = pop.querySelector('[data-go]'); if (go) go.onclick = () => { SFX.tap(); close(); G.joinFriend(st.room, st.host ? f.pub : null); };
}
setInterval(() => G.autoMeet(), 12000);
// what my friends see about me (only when sharing is switched on): (round R privacy, 9 Oct) everyone with my friend code
// sees only "playing now"; my name, the place I am in and my room go locked to each saved friend whose key I have (net.js)
G.shareStatus = () => { const h = G.heroes[0]; if (!h || !settings.online || !settings.friendsOn) return; Net.friendsShare({ map: Net.mapVersion, name: h.profile.name, at: G.regionOf[0] || '', room: Net.role && !Net.knocking ? Net.code : null, players: Net.role ? Net.count : 0, host: Net.role === 'host' }); };
setInterval(() => { if (isPlaying()) G.shareStatus(); }, 45000);
// signal bars: ▂▄▆█ with the strong ones lit
G.netQuality = id => Net.quality(id);
G.barsHTML = n => `<span class="bars b${n}" aria-label="${n}/4"><i></i><i></i><i></i><i></i></span>`;
const routeName = r => r === 'cloud' ? T('cloud relay', 'qua mạng đám mây') : T('direct', 'trực tiếp');
const friendStatus = f => {
  const st = Net.friends.status[f.code];
  if (!st) return `<small class="fst off">⚪ ${T('Not seen yet', 'Chưa thấy')}</small>`;
  if (!st.online || Date.now() - (st.seen || 0) > 3 * 60000) { const m = st.lastOnline ? Math.max(1, Math.round((Date.now() - st.lastOnline) / 60000)) : null; return `<small class="fst off">⚪ ${T('Offline', 'Đang tắt')}${m ? ' · ' + (m < 60 ? T(`${m} min ago`, `${m} phút trước`) : T(`${Math.round(m / 60)} h ago`, `${Math.round(m / 60)} giờ trước`)) : ''}</small>`; }
  const where = st.at && REGION_NAMES[st.at] ? REGION_NAMES[st.at]() : T('in the valley', 'trong thung lũng');
  return `<small class="fst on">🟢 ${T('Online', 'Đang chơi')} · ${esc(where)}${st.room ? ' · ' + T('room', 'phòng') + ' ' + esc(st.room) : ''}</small>`;
};
// (round R privacy, 9 Oct) a friend made in a room (＋👫) is saved with their key: it lets them straight into my room later
// (if they can prove it), and locks invitations and "where I am" notes for them alone
const addFriend = (code: string, name?: string, pub?: string) => { code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); if (code.length !== 6 || code === settings.friendCode) return false; let f = settings.friends.find(x => x.code === code); if (f) { if (name) f.name = name; } else settings.friends.push(f = { code, name: name || code }); if (okPub(pub)) f.pub = pub; settings.friendsOn = true; saveSettings(); G.listenFriends(); return true; };
// (Round V, owner 13 Oct) the microphone test for grown-ups (js/mictest.js), with or without a room
const micTestHTML = () => `<p class="center"><button class="btn" data-mictest>🎙️ ${T('Microphone test (grown-ups)', 'Thử micrô (người lớn)')}</button></p>`;
const netLineHTML = () => (n => `<p class="note center netline">📶 ${T('This device', 'Máy này')}: ${n.online ? (n.type ? esc(n.type) + ' · ' : '') + (n.eff ? esc(n.eff.toUpperCase()) + ' · ' : '') + (n.down ? n.down + ' Mbps · ' : '') : T('no internet!', 'mất mạng!') + ' · '}${n.cloud ? T(`cloud relay on (${n.brokers} server${n.brokers === 1 ? '' : 's'})`, `đang dùng mạng đám mây (${n.brokers} máy chủ)`) : T('direct link', 'kết nối trực tiếp')}${n.voice ? ' · 🎙️ ' + T('voice on', 'đang gọi') : n.cloud ? ' · ' + T('voices can’t travel over the cloud relay yet: use 💬', 'giọng nói chưa đi qua mạng đám mây được: dùng nút 💬') : ''}</p>`)(Net.netInfo());
const pqHTML = id => (q => q ? `<small class="pq">${G.barsHTML(q.bars)} ${q.rtt != null ? q.rtt + ' ms' : '…'} · ${routeName(q.route)}${q.weak ? ' · ' + T('weak', 'yếu') : ''}</small>` : '')(Net.quality(id));
G.netTick = body => {
  const nl = body.querySelector<HTMLElement>('.netline'); if (nl) nl.outerHTML = netLineHTML();
  body.querySelectorAll<HTMLElement>('.prow.roomp[data-pid]').forEach(row => { const old = row.querySelector<HTMLElement>('.pq'), now = pqHTML(row.dataset.pid); if (old) old.outerHTML = now || ''; else if (now) row.querySelector<HTMLElement>('.pw').insertAdjacentHTML('beforeend', now); });
};
// (bug #37, owner 11 Oct) a small note for grown-ups saying where the switch is (Grown-ups → "Internet and playing online"
// → "Use the internet"), with the Grown-ups button right here: press and hold only, so a child can't switch it on
const gUHow = on => `<div class="gunote"><p class="note">${on
  ? T('For grown-ups: press and hold Grown-ups → Internet and playing online → untick Use the internet to switch playing with friends off.', 'Dành cho người lớn: nhấn giữ nút Phụ huynh → Internet và chơi trực tuyến → bỏ chọn Dùng internet để tắt chơi cùng bạn.')
  : T('For grown-ups: press and hold Grown-ups → Internet and playing online → tick Use the internet to switch playing with friends on.', 'Dành cho người lớn: nhấn giữ nút Phụ huynh → Internet và chơi trực tuyến → chọn Dùng internet để bật chơi cùng bạn.')}</p>
  <button class="grown gu-hold"><span class="ring"></span>${T('Grown-ups', 'Phụ huynh')}<small>${T('press and hold', 'nhấn giữ')}</small></button></div>`;
const bindGUHow = (body, redraw) => {
  const b = body.querySelector('.gu-hold'); if (!b) return;
  holdButton(b, async () => {
    await openGrownups(() => { if (document.body.contains(body)) redraw(); });
    const d = document.querySelector<HTMLDetailsElement>('.modal.grownups details[data-sec="online"]'); if (d) { d.open = true; d.scrollIntoView({ block: 'start' }); }
  });
};
G.drawOnlinePanel = (body, redraw) => {
  // (Round V, owner 13 Oct) a friend who accepts and comes into the room closes the Friends page, so the child sees them
  G._padRemotes = Object.keys(Net.remotes).length;
  G.onNet = () => { if (!document.body.contains(body)) return; const n = Object.keys(Net.remotes).length; if (n > G._padRemotes) { G._padRemotes = n; G.closePadNow(); return; } G._padRemotes = n; redraw(); };
  const h = G.heroes[0];
  // (round R privacy, 9 Oct, owner) online play is off until a grown-up turns it on (Grown-ups → Playing online): no Start, no Join
  if (!settings.online) { body.innerHTML = `<div class="online off"><p class="note center onlineoff">🔒 ${T('Playing with friends is off. Ask a grown-up to turn it on.', 'Chơi cùng bạn đang tắt. Nhờ người lớn bật lên nhé.')}</p>
    ${gUHow(false)}</div>`; bindGUHow(body, redraw); return; }
  // (Round V, owner 13 Oct) "My friends" folds away (remembered on this device)
  const friendsBox = () => `<details class="ocard friends" ${settings.friendsFold ? '' : 'open'}><summary><h3>👫 ${T('My friends', 'Bạn của con')}</h3></summary>
      <p class="note">${T('My friend code', 'Mã bạn bè của con')}: <b class="fcode">${settings.friendCode}</b></p>
      <label class="tog"><input type="checkbox" id="fOn" ${settings.friendsOn ? 'checked' : ''}> ${T('Friends can see when I am playing and where, and invite me (needs the internet)', 'Bạn bè thấy khi con đang chơi, đang ở đâu, và mời con được (cần có mạng)')}</label>
      <div class="flist">${settings.friends.map(f => `<div class="frow"><span class="fwho">🧒 <b>${esc(nm((Net.friends.status[f.code] || {}).name || f.name))}</b> <small>${esc(f.code)}</small>${friendStatus(f)}</span>${(Net.friends.status[f.code] || {}).online && (Net.friends.status[f.code] || {}).room && Net.code !== Net.friends.status[f.code].room ? (Net.sameMap(Net.friends.status[f.code].map) ? `<button class="btn primary" data-joinf="${esc(Net.friends.status[f.code].room)}" data-fc="${esc(f.code)}">▶ ${T('Join', 'Vào chơi')}</button>` : `<button class="btn mapdiff" data-mapdiff aria-label="${T('Different valley', 'Thung lũng khác')}" title="${T('Different valley', 'Thung lũng khác')}">🗺️</button>`) : ''}${(Net.friends.status[f.code] || {}).online && !(Net.code && Net.friends.status[f.code].room === Net.code) ? `<button class="btn" data-inv="${f.code}">📨 ${T('Invite', 'Mời')}</button>` : ''}<button class="btn" data-rm="${f.code}" aria-label="${T('Remove', 'Xóa')}">✕</button></div>`).join('') || `<p class="note">${T('No friends yet. Add a friend code, or add someone after playing together.', 'Chưa có bạn nào. Nhập mã bạn bè, hoặc thêm bạn sau khi chơi cùng.')}</p>`}</div>
      <div class="vrow"><input type="text" id="fAdd" maxlength="6" placeholder="${T('Friend code', 'Mã bạn bè')}" autocomplete="off"><button class="btn" id="fAddB">＋ ${T('Add', 'Thêm')}</button></div>
      ${settings.friends.length ? `<p class="note">${T('Friends are never put in a room by themselves: 📨 Invite asks them, ▶ Join goes to theirs.', 'Bạn bè không bao giờ tự bị đưa vào phòng: 📨 Mời là hỏi bạn, ▶ Vào chơi là sang phòng bạn.')}</p>` : ''}${gUHow(true)}</details>`;
  const bindFriends = () => {
    bindGUHow(body, redraw);
    { const d = body.querySelector<HTMLDetailsElement>('details.friends'); if (d) d.ontoggle = () => { settings.friendsFold = !d.open; saveSettings(); }; }
    body.querySelectorAll<HTMLElement>('[data-mapdiff]').forEach(b => b.onclick = () => { SFX.tap(); G.mapCard(); });
    body.querySelector<HTMLInputElement>('#fOn').onchange = () => { settings.friendsOn = body.querySelector<HTMLInputElement>('#fOn').checked; saveSettings(); G.listenFriends(); };
    body.querySelector<HTMLElement>('#fAddB').onclick = () => { if (addFriend(body.querySelector<HTMLInputElement>('#fAdd').value)) { SFX.chime(); redraw(); } else toast(T('A friend code has 6 letters and numbers.', 'Mã bạn bè gồm 6 chữ và số.')); };
    body.querySelectorAll<HTMLElement>('[data-rm]').forEach(b => b.onclick = () => { settings.friends = settings.friends.filter(f => f.code !== b.dataset.rm); saveSettings(); redraw(); });
    body.querySelectorAll<HTMLElement>('[data-joinf]').forEach(b => b.onclick = async () => { SFX.tap(); const f = settings.friends.find(x => x.code === b.dataset.fc), st = Net.friends.status[b.dataset.fc] || {}; await G.joinFriend(b.dataset.joinf, f && st.host ? f.pub : null); redraw(); });
    body.querySelectorAll<HTMLButtonElement>('[data-inv]').forEach(b => b.onclick = async () => { b.disabled = true; inviteToast(await G.inviteFriend(b.dataset.inv)); b.disabled = false; });
    // (v1.08 release fix 2, check mictest on GitHub) the test's code is fetched as soon as its button shows, so a grown-up's
    // tap opens it at once (on a slow device the window came only after the fetch)
    const micBtns = body.querySelectorAll<HTMLElement>('[data-mictest]'); if (micBtns.length) import('../mictest.js').catch(() => { });
    micBtns.forEach(b => b.onclick = () => { SFX.tap(); import('../mictest.js').then(M => M.openMicTest()); });
  };
  if (Net.connected || Net.role === 'host') {
    const list = Object.values(Net.remotes);
    body.innerHTML = `<div class="online on">
      <p class="note center">${Net.code ? T(`Room code · ${Net.count}/6 players`, `Mã phòng · ${Net.count}/6 người chơi`) : ''}</p>${Net.code && Net.role === 'host' ? codeHTML(Net.code) : Net.code ? `<p class="center"><b class="bigcode">${Net.code}</b></p>` : ''}
      ${Net.role === 'host' && Net.knocks.size ? `<div class="ocard knocks"><h3>🚪 ${T('At the door', 'Đang gõ cửa')}</h3>${[...Net.knocks.values()].map(k => `<div class="prow"><img src="${avatarURL({ photo: k.photo, look: Object.assign({ hair: '#1d1412', skin: '#f6c7a5' }, k.look) })}" alt=""><div class="pw"><b>${esc(nm(k.name || T('Someone', 'Một bạn')))}</b></div><button class="btn primary" data-admit="${esc(k.id)}">✅ ${T('Let in', 'Cho vào')}</button><button class="btn" data-deny="${esc(k.id)}">❌</button></div>`).join('')}</div>` : ''}
      ${netStatus ? `<p class="note center status">${esc(netStatus)}</p>` : ''}
      ${netLineHTML()}
      <div class="plist">${list.map(r => `<div class="prow roomp" data-pid="${esc(r.id)}"><img src="${avatarURL({ photo: r.photo, look: Object.assign({ hair: '#1d1412', skin: '#f6c7a5' }, r.look) })}" alt=""><div class="pw"><b>${esc(nm(r.name))}</b>${pqHTML(r.id)}</div>
        <div class="rp-btns"><button class="btn" data-walkf="${esc(r.id)}">👣 ${T('Walk', 'Đi bộ')}</button><button class="btn" data-fly="${esc(r.id)}">✨ ${T('Fly', 'Bay')}</button><button class="btn" data-callf="${esc(r.id)}">📣 ${T('Ask to come', 'Gọi đến')}</button><button class="btn" data-tr="${esc(r.id)}">🔄 ${T('Trade', 'Đổi đồ')}</button><button class="btn ${G.heroes[0] && G.heroes[0].followId === r.id ? 'primary' : ''}" data-follow="${esc(r.id)}">🚶 ${G.heroes[0] && G.heroes[0].followId === r.id ? T('Stop following', 'Thôi đi theo') : T('Follow', 'Đi theo')}</button>${Net.role === 'host' ? `<button class="btn" data-kick="${esc(r.id)}" aria-label="${T('Remove from the room', 'Mời ra khỏi phòng')}">🚪</button>` : ''}${r.friend && !settings.friends.some(f => f.code === r.friend && f.pub && f.pub === r.pub) ? `<button class="btn" data-addf="${esc(r.friend)}" data-n="${esc(r.name)}" data-pid="${esc(r.id)}" aria-label="${T('Add as a friend', 'Thêm làm bạn')}">＋👫</button>` : ''}</div></div>`).join('') || `<p class="note center">${T('Waiting for friends to join… Tell them the room code!', 'Đang chờ bạn vào… Đọc mã phòng cho bạn nhé!')}</p>`}</div>
      ${list.length ? `<div class="actions center"><button class="btn primary big" data-together>🎲 ${T('Play together', 'Chơi cùng nhau')}</button></div>` : ''}
      <p class="note center">${T('Talk to each other with your voices, or use the 💬 buttons. Up to 6 players in a room.', 'Nói chuyện bằng giọng nói, hoặc dùng nút 💬. Mỗi phòng tối đa 6 người.')}</p>
      <div class="actions center"><button class="btn big${Net.micLive ? '' : ' primary'}" id="oMute">${!Net.micLive ? '🎙️ ' + T('Microphone on', 'Bật micrô') : Net.muted ? '🔇 ' + T('Unmute', 'Bật mic') : '🎙️ ' + T('Mute', 'Tắt mic')}</button><button class="btn big danger" id="oEnd">📵 ${T('Leave the room', 'Rời phòng')}</button></div>
      ${micTestHTML()}${friendsBox()}</div>`;
    body.querySelector<HTMLElement>('#oMute').onclick = async () => { SFX.tap(); await G.toggleMute(); redraw(); };
    bindCode(body);
    body.querySelectorAll<HTMLElement>('[data-admit]').forEach(b => b.onclick = () => { SFX.tap(); Net.admit(b.dataset.admit); });
    body.querySelectorAll<HTMLElement>('[data-deny]').forEach(b => b.onclick = () => { SFX.tap(); Net.deny(b.dataset.deny); });
    body.querySelector<HTMLElement>('#oEnd').onclick = () => { Net.close(); Object.keys(G.partners).forEach(id => Net.emit('left', { id, name: G.partners[id].name })); G.huds.forEach(hd => hd.setCall(false)); redraw(); };
    body.querySelectorAll<HTMLElement>('[data-fly]').forEach(b => b.onclick = () => { const P = G.partners[b.dataset.fly]; if (P) { $('.modal.pad')?.remove(); G.paused = false; G.flyToFriend(G.heroes[0], P.id); } });
    body.querySelectorAll<HTMLElement>('[data-walkf]').forEach(b => b.onclick = () => { $('.modal.pad')?.remove(); G.paused = false; G.walkToFriend(G.heroes[0], b.dataset.walkf); });
    body.querySelectorAll<HTMLElement>('[data-callf]').forEach(b => b.onclick = () => { $('.modal.pad')?.remove(); G.paused = false; G.askFriendToCome(G.heroes[0], b.dataset.callf); });
    body.querySelectorAll<HTMLElement>('[data-kick]').forEach(b => b.onclick = () => { if (confirm(T('Remove this player from the room?', 'Mời bạn này ra khỏi phòng?'))) { Net.kick(b.dataset.kick); setTimeout(redraw, 600); } });
    body.querySelectorAll<HTMLElement>('[data-tr]').forEach(b => b.onclick = () => { $('.modal.pad')?.remove(); G.paused = false; G.openTrade(0, b.dataset.tr); });
    // games with friends (round G): Caro with one friend, Oẳn tù tì with everyone in the room
    body.querySelectorAll<HTMLElement>('[data-follow]').forEach(b => b.onclick = () => { SFX.tap(); G.followFriend(0, b.dataset.follow); $('.modal.pad')?.remove(); G.paused = false; });
    // (#741, v1.06, tester) every game with friends is inside Play together: Caro, Oẳn tù tì, Memory Match and Tiến Lên
    // no longer have their own buttons outside it
    { const t = body.querySelector<HTMLElement>('[data-together]'); if (t) t.onclick = () => { SFX.tap(); G.openPlayTogether(); }; }
    body.querySelectorAll<HTMLElement>('[data-addf]').forEach(b => b.onclick = () => { addFriend(b.dataset.addf, b.dataset.n, (Net.remotes[b.dataset.pid] || {}).pub); SFX.chime(); toast(T('Friend added!', 'Đã thêm bạn!')); redraw(); });
    bindFriends();
    return;
  }
  if (Net.role === 'guest' && Net.knocking) {
    body.innerHTML = `<div class="online knockwait"><p class="note center">🚪 ${T(`Knock knock on room <b class="bigcode">${esc(Net.code)}</b>`, `Cốc cốc phòng <b class="bigcode">${esc(Net.code)}</b>`)}</p>
      <p class="note center status">${esc(netStatus)}</p><p class="note center">🔇 ${T('Your microphone stays off until you are let in.', 'Micrô của con tắt cho đến khi được cho vào.')}</p>
      <div class="actions center"><button class="btn big" id="oStop">✕ ${T('Stop knocking', 'Thôi không gõ nữa')}</button></div>${friendsBox()}</div>`;
    body.querySelector<HTMLElement>('#oStop').onclick = () => { Net.close(); redraw(); };
    bindFriends(); return;
  }
  let code = '', animals = !!settings.padAnimals;
  body.innerHTML = `<div class="online">
    <p class="note center">${T('Play together from up to 6 phones or tablets, and talk with your voices! Everyone needs the internet.', 'Chơi cùng nhau tối đa 6 máy và nói chuyện bằng giọng nói! Mọi máy đều cần có mạng.')}</p>
    <div class="two-col">
      <div class="ocard"><h3>1. ${T('Start a room', 'Tạo phòng')}</h3><button class="btn big primary" id="oHost">📞 ${T('Start', 'Bắt đầu')}</button>${Net.role === 'host' && Net.code ? codeHTML(Net.code) : ''}<p class="note">${T('Friends knock, and you choose who comes in. Saved friends come straight in.', 'Bạn bè gõ cửa, con chọn ai được vào. Bạn đã lưu thì vào thẳng.')}</p></div>
      <div class="ocard joinpad"><h3>2. ${T('Join a room', 'Vào phòng')}</h3><div class="padwrap"></div></div>
    </div><p class="note center status">${esc(netStatus)}</p>${micTestHTML()}${friendsBox()}</div>`;
  body.querySelector<HTMLElement>('#oHost').onclick = async () => { ac(); await Net.host(sendHello() || {}); redraw(); };
  bindCode(body);
  const go = () => { Net.join(code, sendHello() || {}); setTimeout(redraw, 50); };
  const drawPad = () => {
    const wrap = body.querySelector<HTMLElement>('.padwrap'); wrap.innerHTML = padHTML(animals);
    const box = wrap.querySelector<HTMLElement>('.codebox'), show = () => { box.innerHTML = boxHTML(code, animals); }; show();
    wrap.querySelectorAll<HTMLElement>('[data-mode]').forEach(b => b.onclick = () => { SFX.tap(); animals = b.dataset.mode === 'ani'; settings.padAnimals = animals; saveSettings(); drawPad(); });
    wrap.querySelectorAll<HTMLElement>('.numpad button').forEach(b => b.onclick = () => {
      const v = b.dataset.v; SFX.tap();
      if (v === 'back') code = code.slice(0, -1); else if (v === 'ok') { if (code.length === ROOM_LEN) go(); } else if (code.length < ROOM_LEN) code += v;
      show();
      if (code.length === ROOM_LEN && v !== 'ok') go();
    });
  };
  drawPad();
  bindFriends();
};
  return {  };
}
