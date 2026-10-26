// For grown-ups (round S, owner plan 8 Oct, ROUND-R item 11). The pure parts (mission state, the weekly note, the
// bedtime and birthday clocks, the dance moves) are js/content/parents.js, unit tested; this is the page side:
//   (a) family missions: written in Grown-ups (this device, settings.missions) or in Studio (content pack "missions");
//       the child sees each new one in a speech box and in Pad → Adventures; a grown-up ticks ✓ there with a
//       press-and-hold (or in Grown-ups, which is already behind the hold) and the child gets coins and a sticker
//   (b) family voices: the family's recordings from Studio → Music are used where they fit (bedtime plays the family's
//       lullaby first, the dance break a song tagged "kids"); the 11 grown-up phrases recorded on the device already
//       play in the game. Recording villagers' lines in family voices in Studio is planned, not built (ROUND-R item 11)
//   (c) a weekly note per child from the play report's days (js/report.js), in Grown-ups
//   (d) a certificate card per child: a picture with the stickers earned, saved like a photo (js/photos.js) or printed
//       on its own landscape A4 page (r89, js/printpage.ts)
//   (e) a dance break after 20 minutes of play: music and six moves; a big Skip button
//   (f) bedtime: a grown-up sets a time (AEST); 10 minutes before, a gentle word; then the valley dims, a lullaby plays
//       on the Songs page (js/songs.js, hát ru), and a goodnight card ends the game kindly (hold for 10 more minutes)
//   (g) an optional birthday (month and day, kept on this device only): a birthday surprise on the day
// Studio switches (js/content/releases.js, group 'kids'): familyMissions, weeklyNote, certCard, danceBreak, bedtime, birthday.
import { T, nm } from './i18n.js';
import { SFX, Music, PARTY } from './audio.js';
import { settings, saveSettings, profiles, saveProfiles, reduceMotion } from './state.js';
import { featureOn, CUSTOM } from './custom.js';
import { gameOpen } from './games/frame.js';
import { GAMES } from './games/registry.js';
import { familySongs } from './content/songs.js';
import { modal, holdButton, confetti } from './popups.js';
import { saveToDevice } from './photos.js';
import { homeScreenApp, pdfOf, jpegOf, sharePDF, printPicture } from './printpage.js';
import { DECOR } from './myhouse.js';
import { pic, artSVG } from './art.js';
import { el, esc } from './util.js';
import { FAMILY_MISSIONS, FAMILY_AGAIN, FAMILY_GUIDE } from './content/familymissions.js';
import { allMissions, addMission, removeMission, tickMission, openMissions, cleanMissions, weekSummary, weekNote, aestDate, danceDue, DANCE_MOVES, MOVE_SEC,
  bedtimePhase, BED_DIM, BED_SONG, isBirthday, MISSION_COINS, PARENT_LINES } from './content/parents.js';

// a family mission as the Grown-ups page lists it: a ready-made one (ready), one from Studio (studio) or one a grown-up
// added on this device; who: one child's id, or every child
type Mission = { id: string, en: string, vi: string, who?: string, studio?: boolean, ready?: boolean, done?: Record<string, number>, [k: string]: any };

export function createParents(G, { say, save, reward }) {
  const feat = id => featureOn(id, true);
  const isFree = () => !G.paused && !gameOpen() && !document.querySelector('.dialog, .modal, .songs, .theatre, .resttime, .dancebreak');
  DECOR.bd_cake = { icon: '🎂', price: 0, en: 'Birthday cake (my birthday)', vi: 'Bánh sinh nhật (sinh nhật con)', keepsake: true };

  // ---------- (a) family missions ----------
  // (Round U) the 15 ready-made missions a grown-up turned on (one of each kind starts on); a done one comes back after
  // its day, week or evening (FAMILY_AGAIN)
  const readyOn = M => settings.readyMissions && settings.readyMissions[M.id] != null ? !!settings.readyMissions[M.id] : !!M.on;
  const readyList = () => FAMILY_MISSIONS.filter(readyOn).map(M => { const id = 'r_' + M.id, d = (settings.missionsDone || {})[id] || {}, fresh = {};
    for (const [kid, at] of Object.entries(d)) if (Date.now() - at < FAMILY_AGAIN[M.kind] * 864e5 - 3 * 36e5) fresh[kid] = at;   // (3 hours early, so an evening one is back the next evening)
    return { id, en: M.en, vi: M.vi, icon: M.icon, kind: M.kind, ready: true, done: fresh }; });
  const missions = (): Mission[] => [...readyList(), ...allMissions(settings.missions, CUSTOM.missions, settings.missionsDone || {})];
  // the guide: what family play is (pictures and words, spoken)
  async function guide() { G.paused = true; await G.dialog('💛 ' + T('Family play', 'Trò chơi cả nhà'), FAMILY_GUIDE.map(([ic, en, vi]) => [`${ic} ${en}`, `${ic} ${vi}`, en, vi])); G.paused = false; }
  const guideHTML = () => `<div class="fmguide">${FAMILY_GUIDE.map(([ic, en, vi]) => `<div class="fmg">${pic(ic)}<span>${esc(T(en, vi))}</span></div>`).join('')}</div>`;
  const openFor = p => feat('familyMissions') ? openMissions(missions(), p.id) : [];
  function tick(id, p) {
    const all = missions(), m = all.find(x => x.id === id); if (!m) return false;
    const r = tickMission(all, id, p.id); if (!r.rewarded) return false;
    if (m.studio || m.ready) { const d = settings.missionsDone = settings.missionsDone || {}; d[id] = { ...(d[id] || {}), [p.id]: Date.now() }; }
    else settings.missions = cleanMissions(r.list.filter(x => !x.studio && !x.ready));
    saveSettings();
    G.addCoins && G.addCoins(MISSION_COINS); const st = G.giveSticker ? G.giveSticker(p) : null; saveProfiles();
    const h = G.heroes.find(x => x.profile === p || x.profile.id === p.id);
    if (h) { say(...PARENT_LINES.missionDone); reward('📝', T('Mission done!', 'Xong nhiệm vụ!'), T(`${m.en} · +${MISSION_COINS} coins${st ? ' and a sticker ' + st : ''}`, `${m.vi} · +${MISSION_COINS} đồng${st ? ' và hình dán ' + st : ''}`)); }
    return true;
  }
  // Pad → Adventures: the child's missions, each with a grown-up's press-and-hold ✓
  function logHTML(p) {
    const list = openFor(p); if (!list.length) return '';
    return `<h3>${pic('📝')} ${T('Family missions', 'Nhiệm vụ gia đình')} <button class="btn ghost fmhelp" aria-label="${T('What is family play?', 'Trò chơi cả nhà là gì?')}">${pic('❓')}</button></h3><div class="sides missions">${list.map(m => `<div class="side"><span>${pic(m.icon || '💌')}</span><div><b>${esc(T(m.en, m.vi))}</b><small>${T('Do it for real, then a grown-up holds ✓', 'Làm thật ngoài đời, rồi người lớn giữ nút ✓')}</small></div><button class="btn grownup mtick" data-mtick="${esc(m.id)}" aria-label="${T('Grown-ups: hold to tick', 'Người lớn: giữ để đánh dấu')}"><span class="ring"></span>✓</button></div>`).join('')}</div>`;
  }
  function bindLog(body, h, redraw) { const q = body.querySelector('.fmhelp'); if (q) q.onclick = () => { SFX.tap && SFX.tap(); guide(); }; body.querySelectorAll('[data-mtick]').forEach(b => holdButton(b, () => { if (tick(b.dataset.mtick, h.profile)) { SFX.ok && SFX.ok(); redraw && redraw(); } })); }
  // a new mission is shown once in a speech box (the family's words are shown; a recorded line is spoken)
  async function announce(h) {
    const p = h.profile, seen = p.missionsSeen = Array.isArray(p.missionsSeen) ? p.missionsSeen.slice(-30) : [];
    // (Round U) a ready-made mission is told only once a grown-up turned it on themselves; the three that start on wait quietly in Adventures
    const m = openFor(p).find(x => !seen.includes(x.id) && (!x.ready || (settings.readyMissions && settings.readyMissions[x.id.slice(2)] === true))); if (!m) return false;
    if (!p.familyGuideSeen) { p.familyGuideSeen = true; saveProfiles(); await guide(); }   // (Round U) the first time: what family play is
    seen.push(m.id); saveProfiles(); G.paused = true;
    await G.dialog('💌 ' + T('Family mission', 'Nhiệm vụ gia đình'), [[m.en, m.vi, ...PARENT_LINES.mission]]);
    G.paused = false; return true;
  }

  // ---------- (e) the dance break ----------
  let playMin = 0, lastDance = 0, dance = null;
  function openDance(onEnd?) {
    if (dance) return dance;
    const kids = familySongs().filter(s => s.tags.includes('kids')); kids.forEach(s => { Music.files[s.key] = s.file; });
    const prevSong = Music.key, wasPaused = G.paused; G.paused = true; Music.pinned = true; Music.stop(); Music.play(kids.length ? kids[0].key : PARTY[0], true);
    const m = el('div', 'dancebreak' + (reduceMotion() ? ' still' : '')); document.body.appendChild(m);
    let k = 0, timer = null;
    const end = done => { clearTimeout(timer); m.remove(); dance = null; Music.pinned = false; Music.stop(); if (prevSong) Music.play(prevSong); G.paused = wasPaused; if (done) say(...PARENT_LINES.danceEnd); onEnd && onEnd(); };
    const show = () => {
      if (k >= DANCE_MOVES.length) { SFX.chime && SFX.chime(); end(true); return; }
      const mv = DANCE_MOVES[k];
      m.innerHTML = `<div class="db-card"><h2>${pic('💃')} ${T('Dance break!', 'Giờ nhảy múa!')}</h2><div class="db-pic">${pic(mv.icon)}</div><p>${esc(T(mv.en, mv.vi))}</p>
        <div class="db-dots">${DANCE_MOVES.map((_, i) => `<i class="${i < k ? 'done' : i === k ? 'on' : ''}"></i>`).join('')}</div><button class="btn db-skip">${T('Skip', 'Bỏ qua')} ⏭</button></div>`;
      m.querySelector('.db-skip').onclick = () => { SFX.tap && SFX.tap(); end(false); };
      say(mv.en, mv.vi); k++; timer = setTimeout(show, MOVE_SEC * 1000);
    };
    say(...PARENT_LINES.dance); timer = setTimeout(show, 2600);
    m.innerHTML = `<div class="db-card"><h2>${pic('💃')} ${T('Dance break!', 'Giờ nhảy múa!')}</h2><div class="db-pic">${pic('🎶')}</div><p>${esc(T(...PARENT_LINES.dance))}</p><button class="btn db-skip">${T('Skip', 'Bỏ qua')} ⏭</button></div>`;
    m.querySelector('.db-skip').onclick = () => end(false);
    return (dance = { el: m, close: () => end(false) });
  }

  // ---------- (f) bedtime ----------
  let dim = null, songs = null, night = null, bedDay = null, warned = null, bedStart = Date.now();
  const snoozed = () => (settings.bedSnooze || 0) > Date.now();
  function setDim(k) {
    if (!dim) { dim = el('div', 'bedtime-dim'); document.body.appendChild(dim); }
    dim.style.opacity = String(Math.max(0, Math.min(.55, k)));
    if (k <= 0) { dim.remove(); dim = null; }
  }
  function startBed() {
    say(...PARENT_LINES.bed); G.heroes.forEach(h => G.toast(h, '🌙 ' + T('Bedtime: a lullaby, then goodnight.', 'Giờ đi ngủ: nghe hát ru rồi ngủ ngon nhé.')));
    // the family's own lullaby first (Studio → Music, tag "lullaby"), else the built-in hát ru
    const fam = familySongs().find(s => s.tags.includes('lullaby'));
    if (G.openSongs && !document.querySelector('.songs')) setTimeout(() => {
      try { songs = G.openSongs(fam ? 'family' : 'lullaby'); const b = songs && songs.el && (fam ? songs.el.querySelector(`[data-s="${CSS.escape(fam.key)}"]`) : songs.el.querySelector('.sg-song')); b && b.click(); } catch (e) { songs = null; }
    }, 2500);
  }
  function goodnight() {
    if (night) return;
    if (songs && songs.el && songs.el.isConnected) { Music.fadeOut(6); setTimeout(() => { try { songs.close(); } catch (e) { } songs = null; }, 6200); }
    G.paused = true; setDim(0);
    night = el('div', 'resttime bedtime', `<div class="rt-card"><div class="rt-moon">${pic('🌙')}</div><h2>${T('Goodnight!', 'Chúc con ngủ ngon!')}</h2><p>${T('Sweet dreams. See you tomorrow in the valley.', 'Mơ đẹp nhé. Mai gặp lại ở thung lũng.')}</p>
      <div class="rt-zz">${pic('😴')} ${pic('💤')}</div><button class="btn grownup"><span class="ring"></span>${T('Grown-ups: hold for 10 more minutes', 'Người lớn: giữ để chơi thêm 10 phút')}</button></div>`);
    document.body.appendChild(night); say(...PARENT_LINES.goodnight);
    holdButton(night.querySelector('.grownup'), () => { settings.bedSnooze = Date.now() + 10 * 60e3; saveSettings(); night.remove(); night = null; G.paused = false; });
  }

  // ---------- (g) the birthday ----------
  const celebrated = new Set();
  async function birthday(h) {
    const p = h.profile, y = aestDate().slice(0, 4); if (p.bdayDone === y || celebrated.has(p.id)) return false;
    celebrated.add(p.id); p.bdayDone = y; p.keepsakes = Array.isArray(p.keepsakes) ? p.keepsakes : []; if (!p.keepsakes.includes('bd_cake')) p.keepsakes.push('bd_cake');
    G.addCoins && G.addCoins(20); const st = G.giveSticker ? G.giveSticker(p) : null; saveProfiles();
    confetti(); G.celebrate && G.celebrate(h);
    if (!reduceMotion()) for (let k = 0; k < 6; k++) setTimeout(() => G.fx && G.fx(h.pos.x + Math.cos(k) * 2, h.pos.y + 1.5, h.pos.z + Math.sin(k) * 2, '🎈'), k * 250);
    const C = G.lanterns && G.lanterns.companions; C && C.trick && C.trick(h, 'spin');
    say(...PARENT_LINES.birthday);
    await reward('🎂', T(`Happy birthday, ${nm(p.name)}!`, `Chúc mừng sinh nhật ${nm(p.name)}!`), T(`A birthday cake for your house, +20 coins${st ? ' and a sticker ' + st : ''}.`, `Bánh sinh nhật cho nhà con, +20 đồng${st ? ' và hình dán ' + st : ''}.`));
    return true;
  }

  // ---------- the clock: every 2 seconds of real time ----------
  // (minutes of play are counted only while the valley runs; the clock itself runs on its own timer: the world rests
  // behind the Songs page, which bedtime opens for the lullaby, and goodnight must still come; a frame's dt is also
  // capped at 0.05 s, so on a slow phone "5 seconds" of game time could be a minute of real time)
  let busy = false;
  G.world.updaters.push(dt => { if (G.heroes.length && isFree()) playMin += dt / 60; });
  setInterval(() => {
    if (!G.heroes.length) return;
    // (a speech box or reward taken away without a tap never answers: once neither is on screen, the clock goes on)
    if (busy && !document.querySelector('.dialog, .reward')) busy = false;
    // bedtime first (it can pause everything)
    const B = feat('bedtime') && !snoozed() ? bedtimePhase(Date.now(), settings.bedtime) : { phase: 'off' }, today = aestDate();
    if (B.phase === 'soon' && warned !== today) { warned = today; say(...PARENT_LINES.bedSoon); G.heroes.forEach(h => G.toast(h, '🌙 ' + T(`Bedtime at ${settings.bedtime}. Nearly time to sleep!`, `Giờ đi ngủ lúc ${settings.bedtime}. Sắp đến giờ ngủ rồi!`))); }
    // (the lullaby waits until a game or window the child is in has closed; the dimming starts at once)
    if (B.phase === 'bed') { if (!dim) bedStart = Date.now(); if (bedDay !== today && isFree()) { bedDay = today; startBed(); } setDim(Math.max(.02, (Date.now() - bedStart) / (BED_DIM * 60e3) * .55)); }
    else if (dim && B.phase !== 'night') setDim(0);
    if (B.phase === 'night') { goodnight(); return; }
    if (B.phase === 'bed') return;
    if (busy || !isFree()) return;
    // a birthday, a new mission, then the dance break: one at a time, only when the child is free
    const run = async f => { busy = true; try { await f(); } finally { busy = false; } };
    for (const h of G.heroes) if (feat('birthday') && isBirthday(h.profile.birthday, Date.now()) && h.profile.bdayDone !== today.slice(0, 4)) { run(() => birthday(h)); return; }
    for (const h of G.heroes) if (openFor(h.profile).some(m => !(h.profile.missionsSeen || []).includes(m.id))) { run(() => announce(h)); return; }
    if (feat('danceBreak') && settings.danceBreak !== false && danceDue(playMin, lastDance)) { lastDance = playMin; openDance(); }
  }, 2000);

  // ---------- (d) the certificate card: a picture ----------
  const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
  async function certificate(p) {
    const W = 1200, H = 850, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    x.fillStyle = '#fff6e4'; x.fillRect(0, 0, W, H);
    x.lineWidth = 18; x.strokeStyle = '#ff6fae'; x.strokeRect(20, 20, W - 40, H - 40); x.lineWidth = 6; x.strokeStyle = '#8a5cf6'; x.strokeRect(46, 46, W - 92, H - 92);
    x.textAlign = 'center'; x.fillStyle = '#3a2a20';
    x.font = 'bold 64px Fredoka, "Baloo 2", sans-serif'; x.fillText(T('Certificate of Sparkles', 'Giấy khen Lấp Lánh'), W / 2, 150);
    x.font = '30px Fredoka, "Baloo 2", sans-serif'; x.fillText(settings.lang === 'vi' ? 'Thung Lũng Lấp Lánh · Sparkle Valley' : 'Sparkle Valley · Thung Lũng Lấp Lánh', W / 2, 200); // both names: not through T(), which swaps a name into the language shown ("Thung Lũng Sparkle")
    x.font = 'bold 72px Fredoka, "Baloo 2", sans-serif'; x.fillStyle = '#8a5cf6'; x.fillText(nm(p.name || ''), W / 2, 300);
    const st = p.stickers || [], keeps = (p.keepsakes || []).length, places = Object.keys((p.stats && p.stats.places) || p.visited || {}).length;
    x.font = '30px Fredoka, "Baloo 2", sans-serif'; x.fillStyle = '#3a2a20';
    x.fillText(T(`for exploring, playing and being kind: ${st.length} stickers, ${keeps} keepsakes`, `vì đã khám phá, vui chơi và tốt bụng: ${st.length} hình dán, ${keeps} kỷ vật`), W / 2, 360);
    // the stickers, drawn in the valley's own pictures
    const show = st.slice(0, 30), per = 10, size = 76, gap = 14, x0 = W / 2 - (Math.min(per, show.length) * (size + gap) - gap) / 2;
    const imgs = await Promise.all(show.map(e => { const s = artSVG(e); return s ? loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s)) : null; }));
    show.forEach((e, k) => { const col = k % per, row = Math.floor(k / per), px = x0 + col * (size + gap), py = 410 + row * (size + gap);
      if (imgs[k]) x.drawImage(imgs[k], px, py, size, size); else { x.font = `${size * .8}px sans-serif`; x.fillText(e, px + size / 2, py + size * .8); } });
    if (!show.length) { x.font = '28px Fredoka, sans-serif'; x.fillText(T('The first stickers are waiting in the valley!', 'Những hình dán đầu tiên đang chờ trong thung lũng!'), W / 2, 470); }
    x.font = '26px Fredoka, "Baloo 2", sans-serif'; x.fillStyle = '#5a4a6a'; x.fillText(aestDate() + (places ? ' · ' + T(`${places} ${places === 1 ? 'place' : 'places'} visited`, `đã đến ${places} nơi`) : ''), W / 2, H - 90);
    return c.toDataURL('image/png');
  }
  async function openCertificate(p) {
    const url = await certificate(p), m = modal('certcard', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>${pic('🖼️')} ${T('Certificate card', 'Thiệp khen')}</h2>
      <img class="cert-img" src="${url}" alt="${esc(T('Certificate card', 'Thiệp khen'))}"><div class="actions"><button class="btn primary" data-save>${pic('💾')} ${T('Save picture', 'Lưu ảnh')}</button><button class="btn" data-print>${pic('🖨️')} ${T('Print or save as PDF', 'In hoặc lưu PDF')}</button><button class="btn ghost" data-close>${T('Close', 'Đóng')}</button></div>`);
    m.querySelector('.x').onclick = m.querySelector('[data-close]').onclick = () => m.close();
    // (r89, owner 23 Oct AEDT: "print out certificates") the card on its own landscape A4 page: the browser's print
    // window, or on the iPhone Home Screen app a PDF for the share sheet (js/printpage.ts)
    m.querySelector('[data-print]').onclick = async () => {
      SFX.tap && SFX.tap();
      if (!homeScreenApp()) { await printPicture(url, true); return; }
      const img = await loadImg(url); if (!(img instanceof HTMLImageElement)) return;
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d')?.drawImage(img, 0, 0);
      await sharePDF(pdfOf(jpegOf(c), c.width, c.height, true), `${T('Certificate', 'Giấy khen')} ${String(nm(p.name || '')).replace(/[^\p{L}\p{N} ]+/gu, '')} ${aestDate()}.pdf`);
    };
    m.querySelector('[data-save]').onclick = async () => { const how = await saveToDevice(url); G.heroes[0] && how !== 'cancelled' && G.toast(G.heroes[0], how === 'failed' ? T('Could not save the picture.', 'Không lưu được ảnh.') : T('Picture saved!', 'Đã lưu ảnh!')); };
    return m;
  }

  // ---------- (c) the weekly note ----------
  const favOf = p => { const pl: Record<string, number> = (p.stats && p.stats.played) || {}, top = Object.entries(pl).filter(([id]) => GAMES[id]).sort((a, b) => b[1] - a[1])[0]; if (!top) return null; const g = GAMES[top[0]], l = settings.lang; try { settings.lang = 'en'; const en = g.name(); settings.lang = 'vi'; return [en, g.name()]; } finally { settings.lang = l; } };
  const noteOf = p => weekNote(weekSummary((p.stats && p.stats.days) || {}, aestDate()), nm(p.name || ''), favOf(p));

  // ---------- Grown-ups: one group (Grown-ups is already behind the press-and-hold) ----------
  function grownupsHTML(open, questionsHTML = '') {
    const all = missions(), kids = profiles, any = ['familyMissions', 'weeklyNote', 'certCard', 'danceBreak', 'bedtime', 'birthday'].some(feat);
    if (!any && !questionsHTML) return '';
    const who = m => m.who ? (kids.find(k => k.id === m.who) || {}).name || '?' : T('everyone', 'mọi bé');
    const months = [...Array(12)].map((_, i) => String(i + 1).padStart(2, '0')), dd = [...Array(31)].map((_, i) => String(i + 1).padStart(2, '0'));
    return `<details class="gsec family" data-sec="family" ${open ? 'open' : ''}><summary><span class="gi">${pic('💛')}</span><b>${T('Family: missions, week, bedtime', 'Gia đình: nhiệm vụ, tuần, giờ ngủ')}</b></summary><div class="gbody">
      ${questionsHTML}
      ${feat('familyMissions') ? `<h3>${pic('📝')} ${T('Family missions', 'Nhiệm vụ gia đình')}</h3>
      <p class="note">${T('Write a real-life job ("Help set the table"). The child sees it in the game; when it is done, tick ✓ here or hold ✓ in their Adventures page: coins and a sticker. Missions your family sent from the computer show here too.', 'Viết một việc ngoài đời ("Giúp dọn bàn ăn"). Bé thấy nhiệm vụ trong trò chơi; làm xong, đánh dấu ✓ ở đây hoặc giữ ✓ trong trang Nhiệm vụ của bé: được tiền và hình dán. Nhiệm vụ gia đình gửi từ máy tính cũng hiện ở đây.')}</p>
      ${guideHTML()}
      <h3>${pic('✨')} ${T('Ready-made missions', 'Nhiệm vụ có sẵn')}</h3><p class="note">${T('Turn on the ones that suit your family. A day mission comes back the next day, a week one after seven days, a bedtime one each evening.', 'Bật những nhiệm vụ hợp với gia đình mình. Nhiệm vụ trong ngày sẽ có lại vào hôm sau, nhiệm vụ tuần sau bảy ngày, nhiệm vụ giờ ngủ mỗi tối.')}</p>
      ${[['day', '☀️', ['Every day', 'Mỗi ngày']], ['week', '📅', ['This week', 'Trong tuần']], ['bedtime', '🌙', ['Bedtime', 'Giờ đi ngủ']]].map(([k, ic, nm2]) => `<h4>${pic(ic)} ${T(nm2[0], nm2[1])}</h4>${FAMILY_MISSIONS.filter(M => M.kind === k).map(M => `<label class="tog fmready">${pic(M.icon)} <input type="checkbox" data-fmready="${M.id}" ${readyOn(M) ? 'checked' : ''}> ${esc(T(M.en, M.vi))}</label>`).join('')}`).join('')}
      <h3>${pic('✏️')} ${T('Write your own', 'Tự viết nhiệm vụ')}</h3>
      <div class="field"><label>English</label><input id="fmEn" maxlength="120" placeholder="Help set the table"></div>
      <div class="field"><label>Tiếng Việt</label><input id="fmVi" maxlength="120" placeholder="Giúp dọn bàn ăn"></div>
      <div class="field"><label>${T('For', 'Cho')}</label><select id="fmWho"><option value="">${T('Everyone', 'Mọi bé')}</option>${kids.map(k => `<option value="${esc(k.id)}">${esc(nm(k.name || '?'))}</option>`).join('')}</select></div>
      <button class="btn wide" id="fmAdd">+ ${T('Add mission', 'Thêm nhiệm vụ')}</button>
      <div class="fmlist">${all.map(m => `<div class="fmrow"><div class="pw"><b>${esc(T(m.en, m.vi))}</b><small>${esc(who(m))}${m.studio ? ' · ' + T('Family', 'Gia đình') : ''}</small></div>
        ${kids.filter(k => !m.who || m.who === k.id).map(k => (m.done || {})[k.id] ? `<span class="fmdone">${pic('✅')} ${esc(nm(k.name || ''))}</span>` : `<button class="btn" data-fmtick="${esc(m.id)}|${esc(k.id)}">✓ ${esc(nm(k.name || ''))}</button>`).join('')}
        ${m.studio ? '' : `<button class="btn ghost" data-fmdel="${esc(m.id)}" aria-label="${T('Remove', 'Xóa')}">✕</button>`}</div>`).join('') || `<p class="note">${T('No missions yet.', 'Chưa có nhiệm vụ.')}</p>`}</div>` : ''}
      ${feat('weeklyNote') ? `<h3>${pic('📊')} ${T('This week', 'Tuần này')}</h3>${kids.map(k => `<div class="wknote"><b>${esc(nm(k.name || '?'))}</b>${noteOf(k).map(l => `<p>${esc(T(l[0], l[1]))}</p>`).join('')}</div>`).join('')}` : ''}
      ${feat('certCard') ? `<h3>${pic('🖼️')} ${T('Certificate card', 'Thiệp khen')}</h3><p class="note">${T('A picture with the stickers your child has earned: save it to your photos, print it if you like.', 'Một bức ảnh có các hình dán bé đã nhận: lưu vào ảnh, muốn thì in ra.')}</p>
        <div class="fmcards">${kids.map(k => `<button class="btn" data-cert="${esc(k.id)}">${pic('🖼️')} ${esc(nm(k.name || '?'))}</button>`).join('')}</div>` : ''}
      ${feat('danceBreak') ? `<h3>${pic('💃')} ${T('Dance break', 'Giờ nhảy múa')}</h3><label class="tog"><input type="checkbox" id="fmDance" ${settings.danceBreak !== false ? 'checked' : ''}> ${T('After 20 minutes of play: a short music and movement break (the child can skip it)', 'Sau 20 phút chơi: một lúc nghỉ nghe nhạc và vận động (bé có thể bỏ qua)')}</label>` : ''}
      ${feat('bedtime') ? `<h3>${pic('🌙')} ${T('Bedtime', 'Giờ đi ngủ')}</h3><p class="note">${T('At this time (AEST) the valley dims, a lullaby plays, then the game says goodnight. A grown-up can hold for 10 more minutes.', 'Đến giờ này (giờ AEST) thung lũng tối dần, phát hát ru, rồi trò chơi chúc ngủ ngon. Người lớn có thể giữ nút để chơi thêm 10 phút.')}</p>
        <div class="vrow"><input type="time" id="fmBed" value="${esc(settings.bedtime || '')}"><button class="btn ghost" id="fmBedOff">${T('Off', 'Tắt')}</button></div>` : ''}
      ${feat('birthday') ? `<h3>${pic('🎂')} ${T('Birthdays (optional)', 'Sinh nhật (không bắt buộc)')}</h3><p class="note">${T('Month and day only, kept on this device. On the day the valley has a surprise.', 'Chỉ tháng và ngày, chỉ lưu trên máy này. Đúng ngày, thung lũng có quà bất ngờ.')}</p>
        ${kids.map(k => { const [mo, d] = (k.birthday || '-').split('-'); return `<div class="field bday"><label>${esc(nm(k.name || '?'))}</label><select data-bdm="${esc(k.id)}"><option value="">—</option>${months.map(x => `<option ${x === mo ? 'selected' : ''}>${x}</option>`).join('')}</select><select data-bdd="${esc(k.id)}"><option value="">—</option>${dd.map(x => `<option ${x === d ? 'selected' : ''}>${x}</option>`).join('')}</select></div>`; }).join('')}` : ''}
      <h3>${pic('🎙️')} ${T('Family voices', 'Giọng gia đình')}</h3><p class="note">${T('Your family’s own songs play first: a lullaby at bedtime, a children’s song in the dance break. Your 11 recorded phrases are in Sound and voices. Villagers speaking in your own voices is planned.', 'Bài hát của gia đình được phát trước: hát ru lúc đi ngủ, bài thiếu nhi trong giờ nhảy múa. 11 câu bạn thu nằm trong mục Âm thanh và giọng nói. Dân làng nói bằng giọng nhà mình: đang lên kế hoạch.')}</p>
      </div></details>`;
  }
  function bindGrownups(card, redraw, toast) {
    const $ = s => card.querySelector(s);
    if ($('#fmAdd')) $('#fmAdd').onclick = () => { const en = $('#fmEn').value, vi = $('#fmVi').value; if (!en.trim() && !vi.trim()) { toast && toast(T('Write the mission first.', 'Hãy viết nhiệm vụ trước.')); return; }
      settings.missions = addMission(cleanMissions(settings.missions), { en, vi, who: $('#fmWho').value }); saveSettings(); SFX.ok && SFX.ok(); redraw(); };
    card.querySelectorAll('[data-fmready]').forEach(b => b.onchange = () => { settings.readyMissions = { ...(settings.readyMissions || {}), [b.dataset.fmready]: b.checked }; saveSettings(); SFX.tap && SFX.tap(); });
    card.querySelectorAll('[data-fmtick]').forEach(b => b.onclick = () => { const [id, kid] = b.dataset.fmtick.split('|'), p = profiles.find(x => x.id === kid); if (p && tick(id, p)) redraw(); });
    card.querySelectorAll('[data-fmdel]').forEach(b => b.onclick = () => { settings.missions = removeMission(cleanMissions(settings.missions), b.dataset.fmdel); saveSettings(); redraw(); });
    card.querySelectorAll('[data-cert]').forEach(b => b.onclick = () => { const p = profiles.find(x => x.id === b.dataset.cert); if (p) openCertificate(p); });
    if ($('#fmDance')) $('#fmDance').onchange = e => { settings.danceBreak = e.target.checked; saveSettings(); };
    if ($('#fmBed')) $('#fmBed').onchange = e => { settings.bedtime = /^\d\d:\d\d$/.test(e.target.value) ? e.target.value : ''; settings.bedSnooze = 0; saveSettings(); };
    if ($('#fmBedOff')) $('#fmBedOff').onclick = () => { settings.bedtime = ''; saveSettings(); setDim(0); redraw(); };
    const bday = id => { const p = profiles.find(x => x.id === id); if (!p) return; const mo = card.querySelector(`[data-bdm="${CSS.escape(id)}"]`).value, d = card.querySelector(`[data-bdd="${CSS.escape(id)}"]`).value;
      if (mo && d) p.birthday = `${mo}-${d}`; else delete p.birthday; saveProfiles(); };
    card.querySelectorAll('[data-bdm]').forEach(s => s.onchange = () => bday(s.dataset.bdm));
    card.querySelectorAll('[data-bdd]').forEach(s => s.onchange = () => bday(s.dataset.bdd));
  }

  return { missions, openFor, tick, announce, logHTML, bindLog, openDance, dancing: () => !!dance, setPlayMin: m => { playMin = m; }, playMin: () => playMin,
    startBed, goodnight, bedtimeOn: () => !!night, birthday, certificate, openCertificate, note: noteOf, grownupsHTML, bindGrownups };
}
