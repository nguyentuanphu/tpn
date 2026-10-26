import {HANOI_PACK_INFO} from './content/hanoi-pack-info.js';
import { hasClip, saveClip, deleteClip, playClip, estimatePitch, pitchFromHz } from './voice.js';
import { startRecording, releaseMic, micProblem } from './recorder.js';
import { ac } from './audio.js';

import { el } from './util.js';

// Grown-ups settings load only when opened; the controls and data contracts are unchanged.
import { events } from './core/events.js';

import { T, applyLang, nm, NPC_NAMES, defaultName } from './i18n.js';
import { settings, saveSettings, profiles, saveProfiles, normalizeProfile, exportBackup, importBackup, backupAge, farm, resetFarm, saveFarm, MAX_KIDS, getSnapshot } from './state.js';
import { createSaveCopy, readSaveCopyOrLegacy } from './content/savecopy.js';
import { FAMILY_CODE_PRIVACY, makeFamilyCode, normalizeFamilyCode, familyName, familyQrSvg } from './content/familycode.js';
import { say, voicePack, voiceDiag, allowMobilePack, voiceMisses, clearVoiceMisses, voicesFor, onVoices, hasVietnamese, FAMILY_PHRASES, previewPackVoice, resumePackDownload, chooseVietnamesePack, downloadHanoiPack, previewHanoiVoice } from './voice.js';

import { SFX, Music } from './audio.js';
import { fmt, cur } from './money.js';
import { esc, clamp } from './util.js';
import { familyDevicesHTML, bindFamilyDevices } from './familydevices.js';
import { familyCode, setFamilyCode, familyPhotoCount } from './custom.js';

import { avatarURL, applyNpcFaces, namedVillagers } from './avatar.js';

import { openReport } from './report.js';

import { extrasHTML, bindExtras, privacyHTML, netListHTML } from './extras.js';

import { installButton } from './install.js';
import { SHOWN } from './build.js';
import { easyName } from './content/devname.js';
import { clipCountFor, setSpeaker, sayDevice } from './voice.js';

import { pic } from './art.js';
import { modal } from './popups.js';
import { applyComfort, foldHeadings, jumpNav, familyTrialOn, toast, openEditor, flagBtns, learnBtns, bindLearn, bindLang } from './ui.js';
function openRenamer(after) {
  const m = modal('renamer', ''), card = m.querySelector('.card');
  const list = NPC_NAMES.slice().sort((a, b) => defaultName(a.id).localeCompare(defaultName(b.id)));
  const cur = settings.npcNames || {};
  const faces = Object.assign({}, settings.npcFaces || {}); // photo faces: chosen here, kept only when Save is pressed
  card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button>
    <h2>✏️ ${T('Character names', 'Tên nhân vật')}</h2>
    <p class="note">${T('Leave a box empty to keep the usual name (shown in grey). Tap 📷 to give someone a real face from a photo: it goes on their head in the game, and their skin takes the colour of the photo so it looks natural.', 'Để trống để giữ tên mặc định (chữ màu xám). Chạm 📷 để gắn khuôn mặt thật từ ảnh: ảnh được dán lên đầu nhân vật trong game, màu da lấy theo ảnh để trông tự nhiên.')}</p>
    <div class="rn-list">${list.map(n => `<div class="rn-row" data-id="${esc(n.id)}"><button class="rn-face" aria-label="${T('Photo face', 'Ảnh khuôn mặt')}">${faceHTML(n)}</button>
      <label>🇦🇺 English<input type="text" data-l="en" value="${esc((cur[n.id] || {}).en || '')}" placeholder="${esc(defaultName(n.id, 'en'))}"></label>
      <label>🇻🇳 Tiếng Việt<input type="text" data-l="vi" value="${esc((cur[n.id] || {}).vi || '')}" placeholder="${esc(defaultName(n.id, 'vi'))}"></label></div>`).join('')}</div>
    <div class="rn-bar"><button class="btn" id="rnReset">↩️ ${T('Use the usual names', 'Dùng tên mặc định')}</button><button class="btn primary" id="rnSave">💾 ${T('Save', 'Lưu')}</button></div>`;
  const close = () => { m.close(); after && after(); };
  card.querySelector('.x').onclick = close;
  function faceHTML(n) { const f = faces[n.id]; return f ? `<img src="${f.photo}" alt=""><i>✕</i>` : `<span class="rn-ic" aria-hidden="true">${n.icon}</span><b>📷</b>`; }
  card.querySelectorAll('.rn-row').forEach(r => { const b = r.querySelector('.rn-face'), id = r.dataset.id, n = list.find(x => x.id === id);
    b.onclick = () => { SFX.tap(); if (faces[id]) { delete faces[id]; b.innerHTML = faceHTML(n); return; } openCropper(T('A face for ', 'Khuôn mặt cho ') + defaultName(id), f => { if (f) { faces[id] = f; b.innerHTML = faceHTML(n); } }); }; });
  card.querySelector('#rnReset').onclick = () => card.querySelectorAll('.rn-row input').forEach(i => i.value = '');
  card.querySelector('#rnSave').onclick = () => {
    const out = {};
    card.querySelectorAll('.rn-row').forEach(r => { const en = r.querySelector('[data-l=en]').value.trim(), vi = r.querySelector('[data-l=vi]').value.trim(); if (en || vi) out[r.dataset.id] = { en, vi }; });
    settings.npcNames = out; settings.npcFaces = faces; saveSettings(); applyLang(); applyNpcFaces(); SFX.chime && SFX.chime();
    toast(T('Names saved!', 'Đã lưu tên!')); close();
  };
}

// Crop a photo to a round face (drag to move, pinch or slider to zoom). Gives back { photo, skin }: a 256 px JPEG
// and the skin colour sampled round the cheeks and forehead, used for the rest of the head so it blends in.
function openCropper(title, done) {
  let img = null, zoom = 1, ox = 0, oy = 0;
  const m = modal('editor cropper', `<h2>📷 ${esc(title)}</h2>
    <div class="crop-wrap"><canvas width="480" height="480"></canvas>
      <p class="note">${T('Choose a clear, front-facing photo. Fit the face inside the circle: eyebrows near the top, chin near the bottom. Drag to move, pinch or use the slider to zoom.', 'Chọn ảnh rõ, nhìn thẳng. Đặt khuôn mặt vừa trong vòng tròn: lông mày gần mép trên, cằm gần mép dưới. Kéo để di chuyển, chụm hai ngón hoặc dùng thanh trượt để phóng to.')}</p>
      <label class="btn primary" for="cfile">📷 ${T('Take or choose a photo', 'Chụp hoặc chọn ảnh')}</label><input type="file" id="cfile" accept="image/*" class="vh">
      <input type="range" min="1" max="5" step=".01" value="1" hidden aria-label="Zoom"></div>
    <div class="actions floatbar"><span class="grow"></span><button class="btn" id="cCancel">${T('Cancel', 'Hủy')}</button><button class="btn primary" id="cOk" disabled>${T('Use this face', 'Dùng khuôn mặt này')}</button></div>`);
  const cv = m.querySelector('canvas'), cx = cv.getContext('2d'), zr = m.querySelector('input[type=range]'), ok = m.querySelector('#cOk');
  const draw = () => {
    cx.fillStyle = '#f1e9ff'; cx.fillRect(0, 0, 480, 480);
    if (img) { const s = Math.max(480 / img.width, 480 / img.height) * zoom; cx.drawImage(img, 240 - img.width * s / 2 + ox, 240 - img.height * s / 2 + oy, img.width * s, img.height * s); }
    else { cx.font = '160px serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('🙂', 240, 250); }
    // guide: the face circle, with eye and chin lines
    cx.save(); cx.fillStyle = 'rgba(30,20,40,.45)'; cx.beginPath(); cx.rect(0, 0, 480, 480); cx.arc(240, 240, 205, 0, Math.PI * 2, true); cx.fill('evenodd'); cx.restore();
    cx.strokeStyle = '#fff'; cx.lineWidth = 6; cx.beginPath(); cx.arc(240, 240, 205, 0, Math.PI * 2); cx.stroke();
    cx.setLineDash([10, 10]); cx.lineWidth = 2; cx.strokeStyle = 'rgba(255,255,255,.7)'; cx.beginPath(); cx.moveTo(110, 220); cx.lineTo(370, 220); cx.moveTo(170, 410); cx.lineTo(310, 410); cx.stroke(); cx.setLineDash([]);
    zr.hidden = !img; ok.disabled = !img;
  };
  draw();
  m.querySelector('#cfile').onchange = e => { const f = e.target.files[0]; if (!f) return; const url = URL.createObjectURL(f), i = new Image(); i.onload = () => { img = i; zoom = 1; ox = oy = 0; zr.value = 1; draw(); URL.revokeObjectURL(url); }; i.src = url; };
  zr.oninput = () => { zoom = +zr.value; draw(); };
  const ptrs = new Map(); let pinch0 = 0, zoom0 = 1;
  cv.addEventListener('pointerdown', e => { if (!img) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (e.isTrusted) cv.setPointerCapture(e.pointerId); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = zoom; } });
  cv.addEventListener('pointermove', e => { const pr = ptrs.get(e.pointerId); if (!pr) return; if (ptrs.size === 1) { const k = 480 / cv.clientWidth; ox += (e.clientX - pr.x) * k; oy += (e.clientY - pr.y) * k; } pr.x = e.clientX; pr.y = e.clientY; if (ptrs.size === 2 && pinch0) { const [a, b] = [...ptrs.values()]; zoom = clamp(zoom0 * Math.hypot(a.x - b.x, a.y - b.y) / pinch0, 1, 5); zr.value = zoom; } draw(); });
  const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = 0; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  const finish = keep => {
    let out = null;
    if (keep && img) {
      const S = 256, o = document.createElement('canvas'); o.width = o.height = S; const c2 = o.getContext('2d'), s = Math.max(480 / img.width, 480 / img.height) * zoom, k = S / 410;
      c2.drawImage(img, (240 - img.width * s / 2 + ox - 35) * k, (240 - img.height * s / 2 + oy - 35) * k, img.width * s * k, img.height * s * k);
      // the skin colour: the middle of each cheek and the forehead
      let r = 0, g = 0, b = 0, n = 0;
      for (const [px, py] of [[.3, .62], [.7, .62], [.5, .32]]) { const d = c2.getImageData(px * S - 8, py * S - 8, 16, 16).data; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } }
      const hx = v => Math.round(v / n).toString(16).padStart(2, '0');
      out = { photo: o.toDataURL('image/jpeg', .85), skin: '#' + hx(r) + hx(g) + hx(b) };
    }
    m.close(); done(out);
  };
  ok.onclick = () => finish(true); m.querySelector('#cCancel').onclick = () => finish(false);
}
// (owner, 13 Oct AEDT) this device's id for the Analytics (js/players.js makes it), shown with its easy name so a grown-up
// can find this device in Studio's lists (testers, auto play)
const myDeviceId = () => { try { return localStorage.getItem('sv2_playerid') || ''; } catch (e) { return ''; } };

function packStatusHTML() {
  const P = voicePack(), miss = voiceMisses().filter(m => m[0] === 'en' || m[0] === 'vi'), n = P ? Object.keys(P.lines).length : 0;
  return `<p class="note">${P ? '✅ ' + T(`${n.toLocaleString()} lines recorded with natural voices. They always play first, even offline; the phone's voice reads only a line that has no recording.`, `${n.toLocaleString('vi-VN')} câu đã thu bằng giọng tự nhiên. Luôn được phát trước, kể cả khi không có mạng; giọng của máy chỉ đọc câu chưa có bản ghi.`) : '⚠️ ' + T('The recorded voices have not loaded yet (they need the internet once).', 'Giọng đã thu chưa tải được (cần có mạng một lần).')}</p>
    ${voiceDiag.lastMiss ? `<p class="note warn">⚠️ ${T('Last time a recording could not play here', 'Lần trước máy này không phát được bản ghi')} (${esc(voiceDiag.lastMiss)}). ${T('Tap anywhere on the screen once, check the side switch is not on silent, then press ▶ below.', 'Chạm vào màn hình một lần, kiểm tra nút gạt bên hông không ở chế độ im lặng, rồi bấm ▶ bên dưới.')}</p>` : ''}
    <div class="actions"><button class="btn" data-pv="f">▶ 👩 ${T('Woman', 'Giọng nữ')}</button><button class="btn" data-pv="m">▶ 👨 ${T('Man', 'Giọng nam')}</button></div>
    <p class="note">${T('Female voices are the default. Enable male recordings below for men, boys and grandpas. Downloads continue in the background while you play, even after Save & close.', 'Giọng nữ được dùng mặc định. Bật bản ghi giọng nam bên dưới cho đàn ông, bé trai và ông. Giọng đọc tiếp tục tải khi bạn chơi, kể cả sau khi Lưu và đóng.')}</p>
    <label>${T('Vietnamese recorded voice', 'Giọng đọc tiếng Việt đã thu')}<select id="gVietnamesePack"><option value="standard" ${settings.voiceViVariant!=='leminh'?'selected':''}>${T('Default voices (female unless male voices are enabled)', 'Giọng mặc định (giọng nữ nếu chưa bật giọng nam)')}</option><option value="leminh" ${settings.voiceViVariant==='leminh'?'selected':''}>${T('Lê Minh · Northern Vietnamese · all Vietnamese speech', 'Lê Minh · giọng Bắc · toàn bộ lời đọc tiếng Việt')}</option></select></label>
    <p class="note">${T(`${HANOI_PACK_INFO.lines.toLocaleString()} recordings · about ${Math.ceil(HANOI_PACK_INFO.bytes/1048576)} MB.`,`${HANOI_PACK_INFO.lines.toLocaleString('vi-VN')} bản thu · khoảng ${Math.ceil(HANOI_PACK_INFO.bytes/1048576)} MB.`)} ${T('Lê Minh is a large optional pack of public recordings. On Wi-Fi it downloads while you play. The download button also allows mobile data. Closing Settings keeps the download running while the game stays open; it resumes after reopening. Family names and answers are never sent to FPT.', 'Lê Minh là gói bản thu công khai dung lượng lớn, không bắt buộc. Có Wi-Fi sẽ tải khi bạn chơi. Nút tải cũng cho phép dùng dữ liệu di động. Đóng Cài đặt vẫn tiếp tục tải khi trò chơi còn mở; mở lại sẽ tải tiếp. Không gửi tên hay câu trả lời của gia đình đến FPT.')}</p>
    <div class="actions"><button class="btn" id="gHanoiPreview">▶ ${T('Listen to Lê Minh', 'Nghe thử Lê Minh')}</button><button class="btn" id="gHanoiDownload">⬇️ ${T('Download Lê Minh for offline use', 'Tải Lê Minh để dùng ngoại tuyến')}</button></div><p class="note" id="gHanoiStatus" role="status"></p>
    <label class="tog"><input type="checkbox" id="gVoiceMale" ${settings.voiceMale === true ? 'checked' : ''}> ${T('Download and use optional male default voices (off by default; Lê Minh is selected separately above)', 'Tải và dùng giọng nam mặc định tùy chọn (tắt sẵn; Lê Minh chọn riêng bên trên)')}</label>
    ${P ? `<label class="tog"><input type="checkbox" id="gPackCell" ${settings.packCell === true ? 'checked' : ''}> ${T('Download the rest of the voices on mobile data too (on Wi-Fi they download by themselves)', 'Tải phần giọng đọc còn lại cả bằng dữ liệu di động (khi có Wi-Fi giọng đọc tự tải)')}</label>` : ''}
    ${miss.length ? `<details class="g-miss"><summary>📝 ${T(`${miss.length} lines on this device had no recording yet`, `${miss.length} câu trên máy này chưa có bản ghi`)}</summary>
      <p class="note">${settings.countPlayers !== false ? T('They are sent by themselves, without children’s names, and recorded for the next update.', 'Các câu này tự được gửi đi, không kèm tên các con, và sẽ được thu cho bản cập nhật sau.') : T('Analytics is off on this device, so they are not sent. They are kept in the backup file (below).', 'Phân tích đang tắt trên máy này nên các câu không được gửi. Các câu được giữ trong tệp sao lưu (bên dưới).')}</p>
      <ol class="misslist">${miss.slice(0, 40).map(m => `<li>${m[0] === 'vi' ? '🇻🇳' : '🇦🇺'} ${esc(m[1])} <small>×${m[2]}</small></li>`).join('')}</ol>
      <button class="btn" id="gMissClear">🧹 ${T('Clear the list', 'Xóa danh sách')}</button></details>` : `<p class="note">✅ ${T('Every line said on this device so far had a recording.', 'Mọi câu đã nói trên máy này đều có bản ghi.')}</p>`}`;
}
function bindPackStatus(card, redraw) {
  card.querySelectorAll('[data-pv]').forEach(b => b.onclick = async () => {
    const audio = ac();
    if (audio && audio.state !== 'running') {
      try { await audio.resume(); } catch (e) { }
    }
    await previewPackVoice(b.dataset.pv);
  });
  const updateHanoiInfo=()=>{card.querySelector('#gHanoiStatus').textContent=T('Lê Minh downloads continue while you play. Mobile data can be switched off below.','Lê Minh tiếp tục tải khi bạn chơi. Bạn có thể tắt dữ liệu di động bên dưới.');};
  const hp=card.querySelector('#gVietnamesePack');if(hp)hp.onchange=()=>{void chooseVietnamesePack(hp.value);if(hp.value==='leminh')updateHanoiInfo();};
  if(settings.voiceViVariant==='leminh')updateHanoiInfo();
  const preview=card.querySelector('#gHanoiPreview');if(preview)preview.onclick=async()=>{const ok=await previewHanoiVoice();if(card.isConnected&&!ok)card.querySelector('#gHanoiStatus').textContent=T('Lê Minh is not available here yet. Connect and try again.','Chưa phát được giọng Lê Minh. Kết nối mạng rồi thử lại.');};
  const download=card.querySelector('#gHanoiDownload');if(download)download.onclick=()=>{hp.value='leminh';const mobile=card.querySelector('#gPackCell');if(mobile)mobile.checked=true;updateHanoiInfo();void downloadHanoiPack().catch(()=>{if(card.isConnected)card.querySelector('#gHanoiStatus').textContent=T('The download will resume when a connection is available.','Giọng đọc sẽ tải tiếp khi có mạng.');});};
  const c = card.querySelector('#gMissClear'); if (c) c.onclick = () => { clearVoiceMisses(); redraw(); };
  const vm = card.querySelector('#gVoiceMale'); 
  if (vm) vm.onchange = async () => { 
    settings.voiceMale = vm.checked; 
    if (vm.checked) settings.autoPack = true;
    saveSettings(); 
    await resumePackDownload();
    if (card.isConnected) redraw();
  };
  // (round R item 12, Voice & Audio) the voice pack on mobile data: a grown-up's yes or no (js/voice.js allowMobilePack)
  const pc = card.querySelector('#gPackCell'); if (pc) pc.onchange = () => allowMobilePack(pc.checked);
}
// ---------- Grown-ups ----------
export function openGrownups(after: (() => void) | undefined = undefined) {
  // (round P, owner: arrange it so it makes sense) everything in groups that open and close; which are open is kept
  // while the page redraws
  const m = modal('grownups', ''), gOpen = new Set(['players']);
  const card = m.querySelector('.card');
  const draw = () => {
    const vEn = voicesFor('en'), vVi = voicesFor('vi');
    card.innerHTML = `
      <div class="grownups-panel"><button class="x" aria-label="${T('Close', 'Đóng')}">✕</button>
      <h2>${T('Grown-ups', 'Phụ huynh')} <small class="buildtag">${T('Version', 'Phiên bản')} ${SHOWN}</small></h2>
      <div class="grownups-body"><div class="g-install"></div>
      ${privacyHTML()}
      ${familyTrialOn() ? familyDevicesHTML() : ''}
      <div class="toggles gcaprow">
        <label class="tog"><input type="checkbox" id="gCap" ${settings.captions === false ? '' : 'checked'}> ${T('Captions: show everything that is said as text', 'Phụ đề: hiện chữ cho mọi câu được nói')}</label>
      </div>
      <h3>${T('Language', 'Ngôn ngữ')}</h3>${flagBtns()}${learnBtns()}
      <label class="tog"><input type="checkbox" id="gBil" ${settings.bilingual ? 'checked' : ''}> ${T('Bilingual voice: also say everything in the other language', 'Giọng song ngữ: nói thêm bằng ngôn ngữ còn lại')}</label>
            <details class="gsec" data-sec="players" ${gOpen.has('players') ? 'open' : ''}><summary><span class="gi">👧</span><b>${T('Children', 'Các con')}</b></summary><div class="gbody">

      <div class="plist">${profiles.map(p => `<div class="prow"><img src="${avatarURL(p)}" alt=""><div class="pw"><b>${esc(nm(p.name))}</b><small>🔮 ${p.orbs} · ✨ ${Object.keys(p.shrines).length}/12 · 💰 ${fmt(farm.coins)}</small></div><button class="btn ghost" data-rep="${p.id}" aria-label="${T('Play report', 'Báo cáo chơi')}">${pic('📊')}</button><button class="btn" data-ed="${p.id}">${T('Edit', 'Sửa')}</button></div>`).join('')}</div>
      <button class="btn wide" id="gAdd">+ ${T('Add a player', 'Thêm người chơi')}</button>
      ${window.__sv && window.__sv.heroes && window.__sv.heroes.length ? `<button class="btn wide" id="gChange">👫 ${T('Change player', 'Đổi người chơi')}</button>` : ''}
      <details class="legacy-family"><summary>${T('Earlier photo code (optional)', 'Mã ảnh trước đây (không bắt buộc)')}</summary>
      <p class="note">${T('Use this only for earlier shared photos, if you already have their code. For your own family, use Family photos and devices above; a connected device gives you the pairing code.', 'Chỉ dùng cho ảnh chia sẻ trước đây nếu bạn đã có mã. Với gia đình của mình, dùng Ảnh gia đình và thiết bị ở trên; máy đã kết nối sẽ cung cấp mã ghép đôi.')}</p>
      <div class="vrow"><input type="text" id="gFam" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20" placeholder="ABCD-EFGH-JKMN" value="${familyCode() ? '••••' + esc(familyCode().slice(-4)) : ''}"><button class="btn" id="gFamSave">${T('Save', 'Lưu')}</button></div>
      <p class="note" id="gFamRes">${(() => { const c = familyPhotoCount(); return familyCode() ? T(`${c.have} of ${c.of} family photos on this device.`, `${c.have}/${c.of} ảnh gia đình trên máy này.`) : T('No earlier photo code saved on this device.', 'Máy này chưa lưu mã ảnh trước đây.'); })()}</p></details>
      </div></details>
      <details class="gsec" data-sec="sound" ${gOpen.has('sound') ? 'open' : ''}><summary><span class="gi">🔊</span><b>${T('Sound and voices', 'Âm thanh và giọng nói')}</b></summary><div class="gbody">
      <div class="toggles">
        <label class="tog"><input type="checkbox" id="gVoice" ${settings.voice ? 'checked' : ''}> ${T('Talking voice', 'Giọng nói')}</label>
        <label class="tog"><input type="checkbox" id="gMusic" ${settings.music ? 'checked' : ''}> ${T('Music', 'Nhạc')}</label>
        <label class="tog"><input type="checkbox" id="gSound" ${settings.sound ? 'checked' : ''}> ${T('Sound effects', 'Hiệu ứng âm thanh')}</label>
        <label class="tog"><input type="checkbox" id="gTapSnd" ${settings.tapSounds === false ? '' : 'checked'}> ${T('Tap sounds: a soft sound on every button', 'Tiếng bấm: tiếng nhẹ khi bấm mỗi nút')}</label>
      </div>
<h3>🎙️ ${T('Voices', 'Giọng nói')}</h3>
      ${packStatusHTML()}
      <h3>${T('Family voice', 'Giọng của gia đình')}</h3>
      <button class="btn primary wide big" id="gRec">🎙️ ${T('Record your voice for the game', 'Thu giọng của bạn cho trò chơi')}<small class="reccount">🇻🇳 ${clipCountFor('vi')}/${FAMILY_PHRASES.length} · 🇦🇺 ${clipCountFor('en')}/${FAMILY_PHRASES.length}</small></button>
      <p class="note">${T('Each language has its own 11 lines. The game plays your real voice whenever it says one of those lines (praise, “try again”, “you did it”, hello…), in the language the game is set to. Everything else is read by the device voice, tuned towards your voice.', 'Mỗi ngôn ngữ có 11 câu riêng. Trò chơi phát đúng giọng thật của bạn mỗi khi nói một trong các câu đó (khen, “thử lại nhé”, “con làm được rồi”, chào…), theo ngôn ngữ đang chọn. Các câu khác do giọng máy đọc, được chỉnh gần với giọng bạn.')}</p>
      <h3>📱 ${T('Phone voice (only for lines with no recording)', 'Giọng của máy (chỉ cho câu chưa có bản ghi)')}</h3>
      <div class="field"><label>English</label><div class="vrow"><select id="vEn">${vEn.map(v => `<option ${v.name === settings.voiceEn ? 'selected' : ''}>${esc(v.name)}</option>`).join('') || `<option>${T('Default', 'Mặc định')}</option>`}</select><button class="btn" data-try="en">▶</button></div></div>
      <div class="field"><label>Tiếng Việt</label><div class="vrow"><select id="vVi">${vVi.map(v => `<option ${v.name === settings.voiceVi ? 'selected' : ''}>${esc(v.name)}</option>`).join('') || `<option>${T('No Vietnamese voice found', 'Chưa có giọng tiếng Việt')}</option>`}</select><button class="btn" data-try="vi">▶</button></div></div>
      <p class="note">${hasVietnamese() ? '' : T('To add a Vietnamese voice: iPhone/iPad → Settings → Accessibility → Spoken Content → Voices → Vietnamese. Android → Settings → Text-to-speech → Google → Install voice data → Vietnamese. ', 'Thêm giọng tiếng Việt: iPhone/iPad → Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Việt. Android → Cài đặt → Chuyển văn bản thành giọng nói → Google → Cài đặt dữ liệu giọng nói → Tiếng Việt. ')}${T('Choose an "Enhanced" or "Premium" voice for the most natural sound.', 'Chọn giọng "Nâng cao" hoặc "Cao cấp" để nghe tự nhiên nhất.')}</p>
      ${extrasHTML()}
      
      </div></details>
      <details class="gsec" data-sec="screen" ${gOpen.has('screen') ? 'open' : ''}><summary><span class="gi">📺</span><b>${T('Screen and world', 'Màn hình và thế giới')}</b></summary><div class="gbody">
      <div class="toggles">
        <label class="tog"><input type="checkbox" id="gDay" ${settings.alwaysDay ? 'checked' : ''}> ${T('Always daytime', 'Luôn là ban ngày')}</label>
        <label class="tog"><input type="checkbox" id="gRain" ${settings.noRain ? '' : 'checked'}> ${T('Rain showers and rainbows', 'Mưa rào và cầu vồng')}</label>
        <label class="tog"><input type="checkbox" id="gCalm" ${settings.calm ? 'checked' : ''}> ${T('Calm mode: quieter music, fewer moving effects', 'Chế độ êm dịu: nhạc nhỏ hơn, ít hiệu ứng chuyển động')}</label>
      </div>
<h3>👫 ${T('Two players on one device', 'Hai người chơi trên một máy')}</h3>
      <div class="seg tview">${[['auto', T('Automatic', 'Tự động')], ['face', T('Face to face', 'Đối diện nhau')], ['side', T('Side by side', 'Cạnh nhau')]].map(([k, l]) => `<button data-tv="${k}" class="${(settings.twoView || 'auto') === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <p class="note">${T('Face to face: lay the tablet flat with a child at each end; each half of the screen faces its child. Automatic uses face to face on touch screens and side by side on a computer.', 'Đối diện nhau: đặt máy tính bảng nằm trên bàn, mỗi bé ngồi một đầu; mỗi nửa màn hình quay về phía bé đó. Tự động: đối diện trên màn hình cảm ứng, cạnh nhau trên máy tính.')}</p>
<h3>📱 ${T('Fit the screen', 'Vừa màn hình')}</h3>
      <div class="seg sfit">${[['auto', T('Automatic', 'Tự động')], ['fill', T('Whole screen', 'Cả màn hình')], ['fit', T('Fit inside', 'Vừa bên trong')]].map(([k, l]) => `<button data-sf="${k}" class="${(settings.screenFit || 'auto') === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <p class="note">${T('If the buttons at the bottom are cut off or the top looks hazy, try the other choices. Automatic fits a Home Screen app inside the space it is given.', 'Nếu các nút ở dưới bị cắt hoặc phía trên bị mờ, hãy thử lựa chọn khác. Tự động cho ứng dụng ở Màn hình chính vừa với chỗ được cho.')}</p>
      <p class="note sfacts">${(() => { const f = window.__sv && window.__sv.screenFacts ? window.__sv.screenFacts() : null; return f ? esc(`${f.app ? T('Home Screen app', 'Ứng dụng Màn hình chính') : T('Browser', 'Trình duyệt')} · ${T('height used', 'chiều cao dùng')} ${f.used} · ${T('window', 'cửa sổ')} ${f.inner} · ${T('visible', 'nhìn thấy')} ${f.visual} · ${T('large', 'lớn')} ${f.large} · ${T('screen', 'màn hình')} ${f.screen}`) : ''; })()}</p>
<h3>🔠 ${T('Text size', 'Cỡ chữ')}</h3>
      <div class="seg tsize">${[[0, 'A'], [1, 'A'], [2, 'A']].map(([k, l]) => `<button data-ts="${k}" class="${(settings.textSize || 0) === k ? 'on' : ''}" style="font-size:${16 + Number(k) * 5}px" aria-label="${[T('Normal', 'Bình thường'), T('Big', 'To'), T('Bigger', 'To hơn')][k]}">${l}</button>`).join('')}</div>
      <div>
      </div>
            <div class="field"><label>${T('Camera', 'Góc nhìn')}</label><div class="seg cam"><button data-c="easy" class="${settings.camMode !== 'free' ? 'on' : ''}">🧸 ${T('Easy: fixed view from above', 'Dễ: nhìn từ trên, cố định')}</button><button data-c="free" class="${settings.camMode === 'free' ? 'on' : ''}">🧭 ${T('Explorer: drag to look around', 'Tự do: kéo để xoay')}</button></div></div>
      <div class="field"><label>${T('Graphics', 'Đồ họa')}</label><div class="seg q">${['low', 'auto', 'high', 'max'].map(q => `<button data-q="${q}" class="${settings.quality === q ? 'on' : ''}">${{ low: T('Fast', 'Nhanh'), auto: T('Auto', 'Tự động'), high: T('Pretty', 'Đẹp'), max: T('Pretty+', 'Đẹp+') }[q]}</button>`).join('')}</div></div>
      
      </div></details>
      <details class="gsec" data-sec="time" ${gOpen.has('time') ? 'open' : ''}><summary><span class="gi">🌙</span><b>${T('Play time', 'Giờ chơi')}</b></summary><div class="gbody">
<h3>🌙 ${T('Rest time', 'Giờ nghỉ')}</h3>
      <p class="note">${T('After this much play in a day, the explorer yawns and says goodnight. A grown-up can hold a button for 10 more minutes. Counted on this device only.', 'Sau khoảng thời gian chơi này trong ngày, nhà thám hiểm sẽ ngáp và chúc ngủ ngon. Người lớn có thể giữ nút để chơi thêm 10 phút. Chỉ tính trên máy này.')} ${T('Today', 'Hôm nay')}: ${Math.round(settings.playDay === new Date().toDateString() ? settings.playMins || 0 : 0)} ${T('min', 'phút')}</p>
      <div class="seg rest">${['0', '15', '30', '45', '60'].map(k => `<button data-r="${k}" class="${String(settings.restMins || '0') === k ? 'on' : ''}">${k === '0' ? T('Off', 'Tắt') : k + ' ' + T('min', 'phút')}</button>`).join('')}</div>
      <h3>🧭 ${T('Daily adventure', 'Phiêu lưu mỗi ngày')}</h3>
      <div class="toggles"><label class="tog"><input type="checkbox" id="gAdv" ${settings.dailyAdventure === false ? '' : 'checked'}> ${T('A new three-step adventure every day, with a chest at the end', 'Mỗi ngày một chuyến phiêu lưu ba bước, cuối cùng có rương báu')}</label></div>
      <p class="note">${T('A new adventure starts:', 'Phiêu lưu mới bắt đầu:')}</p>
      <div class="seg advday">${[['first', T('When the child first plays', 'Khi bé chơi lần đầu trong ngày')], ['6am', T('At 6 am', 'Lúc 6 giờ sáng')], ['midnight', T('At midnight', 'Lúc nửa đêm')]].map(([k, l]) => `<button data-d="${k}" class="${(settings.advDay || 'first') === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <p class="note">${T('For children 5 and over. Tricky adds a sand timer for bonus coins (never a loss); under-5s never have a timer.', 'Cho bé từ 5 tuổi. Thử thách thêm đồng hồ cát để được thưởng thêm (không bao giờ bị thua); bé dưới 5 tuổi không có đồng hồ.')}</p>
      <div class="seg advlvl">${[['gentle', T('Gentle', 'Nhẹ nhàng')], ['tricky', T('Tricky', 'Thử thách')]].map(([k, l]) => `<button data-l="${k}" class="${(settings.advLevel || 'gentle') === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      
      </div></details>
      <details class="gsec" data-sec="money" ${gOpen.has('money') ? 'open' : ''}><summary><span class="gi">💰</span><b>${T('Money and farm', 'Tiền và nông trại')}</b></summary><div class="gbody">
<h3>${T('Money', 'Tiền tệ')}</h3>
      <div class="seg cur"><button data-c="auto" class="${!settings.curPinned ? 'on' : ''}">${T('Same as the language', 'Theo ngôn ngữ')}</button><button data-c="AUD" class="${settings.curPinned && settings.currency === 'AUD' ? 'on' : ''}">🇦🇺 AUD $</button><button data-c="VND" class="${settings.curPinned && settings.currency === 'VND' ? 'on' : ''}">🇻🇳 VND đ</button></div>
      <p class="note">${T('Prices and the money games use this money. Same as the language: đồng in Vietnamese, dollars in English. 10c = 2.000đ in this game.', 'Giá cả và các trò chơi tiền dùng loại tiền này. Theo ngôn ngữ: tiếng Việt dùng đồng, tiếng Anh dùng đô la Úc. Trong game, 10 xu Úc = 2.000đ.')}</p>
      <div class="field"><label>💰 ${T('Coins in the piggy bank', 'Tiền trong heo đất')}: <b id="gCoins">${fmt(farm.coins)}</b></label>
        <div class="actions coinadd">${[100, 500, 2000].map(n => `<button class="btn" data-add="${n}">+ ${fmt(n)}</button>`).join('')}</div></div>
      <p class="note">${T('Ran out? Top up the coins the whole family shares (for the shop, market and stalls).', 'Hết tiền? Nạp thêm tiền chung của cả nhà (dùng ở cửa hàng, chợ và các sạp).')}</p>
      <h3>${T('Farm', 'Nông trại')}</h3>
      <button class="btn danger" id="gFarm">🔄 ${T('Start the farm over', 'Làm lại nông trại')}</button>
      <p class="note">${T('Clears crops, animals, pets, basket and coins. Players, photos, stickers and game levels are kept.', 'Xóa cây trồng, vật nuôi, thú cưng, giỏ hàng và tiền. Giữ lại người chơi, ảnh, hình dán và cấp độ trò chơi.')}</p>
      
      </div></details>
      <details class="gsec" data-sec="online" ${gOpen.has('online') ? 'open' : ''}><summary><span class="gi">🌐</span><b>${T('Internet and playing online', 'Internet và chơi trực tuyến')}</b></summary><div class="gbody">

      <label class="tog"><input type="checkbox" id="gOnline" ${settings.online ? 'checked' : ''}> <b>${T('Use the internet (friends online, real places)', 'Dùng internet (chơi cùng bạn, nơi thật)')}</b></label>
      <p class="note">${T('Off until you turn it on. While it is off the game makes no online connection: no rooms, no friends’ status, no invitations, no real-place maps. When it is on, the game does not ask again.', 'Tắt cho đến khi bạn bật. Khi tắt, trò chơi không kết nối mạng: không phòng, không trạng thái bạn bè, không lời mời, không bản đồ nơi thật. Khi đã bật, trò chơi không hỏi lại.')}</p>
      ${netListHTML()}
      <h3>👥 ${T('Who’s here', 'Ai đang ở đây')}</h3><div class="whohere" id="gWho"><p class="note">…</p></div>
      <p class="note">${T('Online play uses the free PeerJS service to connect two devices directly. Voice goes straight between the devices and is never recorded.', 'Chơi trực tuyến dùng dịch vụ miễn phí PeerJS để nối hai máy trực tiếp. Giọng nói đi thẳng giữa hai máy và không bao giờ được ghi lại.')}</p>
      <label class="tog"><input type="checkbox" id="gAutoMeet" ${settings.autoMeet !== false ? 'checked' : ''}> ${T('Tell me when a friend on the list starts playing (with buttons to invite them or go to their room; nobody is put in a room by themselves)', 'Báo khi một bạn trong danh sách bắt đầu chơi (có nút mời bạn hoặc sang phòng bạn; không ai tự bị đưa vào phòng)')}</label>
      <p class="note">${T('If a friend far away stays on “Connecting…”, your two networks need a relay (TURN server). Free public relays are tried automatically. For a reliable one, make a free account at a TURN service (for example metered.ca), then paste its credentials link here, or a turn: address with its name and password. Both devices need the same relay.', 'Nếu bạn ở xa cứ “Đang kết nối…” mãi, hai mạng cần một máy chủ trung chuyển (TURN). Trò chơi tự thử các máy chủ miễn phí công cộng. Để ổn định hơn, hãy tạo tài khoản miễn phí ở một dịch vụ TURN (ví dụ metered.ca), rồi dán đường link lấy thông tin vào đây, hoặc địa chỉ turn: kèm tên và mật khẩu. Cả hai máy cần dùng cùng máy chủ.')}</p>
      <div class="vrow"><input type="text" id="gTurn" placeholder="https://…/turn/credentials?apiKey=…  ${T('or', 'hoặc')}  turn:…" value="${esc(settings.turnUrl || '')}" autocomplete="off"></div>
      <div class="vrow ${/^turns?:/i.test(settings.turnUrl || '') ? '' : 'vh'}" id="gTurnCred"><input type="text" id="gTurnUser" placeholder="${T('Name', 'Tên')}" value="${esc(settings.turnUser || '')}" autocomplete="off"><input type="password" id="gTurnPass" placeholder="${T('Password', 'Mật khẩu')}" value="${esc(settings.turnPass || '')}" autocomplete="off"></div>
      <div class="actions"><button class="btn" id="gNetCheck">🔍 ${T('Test the connection', 'Kiểm tra kết nối')}</button></div><p class="note" id="gNetRes"></p>

      </div></details>
      <details class="gsec" data-sec="names" ${gOpen.has('names') ? 'open' : ''}><summary><span class="gi">🏷️</span><b>${T('Character names', 'Tên nhân vật')}</b></summary><div class="gbody">

      <p class="note">${T('Titles follow the language (Grandma / Bà, Auntie / Cô) and names stay as they are in each region. You can rename anyone, in English and in Vietnamese.', 'Danh xưng đổi theo ngôn ngữ (Grandma / Bà, Auntie / Cô) và tên giữ nguyên theo từng vùng. Bạn có thể đổi tên bất kỳ nhân vật nào, bằng tiếng Anh và tiếng Việt.')}</p>
      <button class="btn wide" id="gNames">✏️ ${T('Rename characters', 'Đổi tên nhân vật')}</button>
      
      </div></details>
      <details class="gsec" data-sec="data" ${gOpen.has('data') ? 'open' : ''}><summary><span class="gi">📊</span><b>${T('Analytics and backup', 'Phân tích và sao lưu')}</b></summary><div class="gbody">
      <div class="field"><label>📊 ${T('Analytics', 'Phân tích')}</label><div class="seg cnt"><button data-c="1" class="${settings.countPlayers !== false ? 'on' : ''}">${T('On', 'Bật')}</button><button data-c="0" class="${settings.countPlayers === false ? 'on' : ''}">${T('Off', 'Tắt')}</button></div></div>
      <p class="note devid">📱 ${T('This device\'s name', 'Tên máy này')}: <b>${esc(easyName(myDeviceId(), settings.lang))}</b> · ${esc(profiles.map(p => p.name).filter(Boolean).join(', ') || T('no players yet', 'chưa có người chơi'))} · <small>${esc(myDeviceId() || '–')}</small></p>
      <h3>${pic('👨‍👩‍👧')} ${T('Family code', 'Mã gia đình')}</h3>
      <p class="note fam-privacy">${esc(T(FAMILY_CODE_PRIVACY.en, FAMILY_CODE_PRIVACY.vi))}</p>
      <div class="fam-code-box" id="gFamCodeBox">
        ${normalizeFamilyCode(settings.familyCode) ? `<div class="fam-code-linked">
          <div class="fam-code-meta">
            <div class="fam-code-name">${T('Family', 'Gia đình')}: <b class="fam-name-val">${esc(familyName(settings.familyCode, settings.lang))}</b></div>
            <div class="fam-code-line">${T('Family code', 'Mã gia đình')}: <b class="fam-code-val">${esc(normalizeFamilyCode(settings.familyCode))}</b></div>
            <p class="note">${T('Enter this code or scan the QR code on your family’s other phone, tablet or computer.', 'Nhập mã này hoặc quét mã QR trên điện thoại, máy tính bảng hoặc máy tính khác của gia đình.')}</p>
            <div class="actions"><button class="btn" id="gFamCodeCopy">${T('Copy code', 'Sao chép mã')}</button><button class="btn danger" id="gFamCodeLeave">${T('Leave the family', 'Rời gia đình')}</button></div>
          </div>
          <div class="fam-code-qr">${familyQrSvg(settings.familyCode)}</div>
        </div>` : `<div class="fam-code-join">
          <div class="actions"><button class="btn primary" id="gFamCodeMake">${T('Make a family code', 'Tạo mã gia đình')}</button></div>
          <div class="vrow fam-join-row"><input type="text" id="gFamCodeIn" placeholder="XXXX-XXXX" maxlength="19" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="${T('Family code', 'Mã gia đình')}"><button class="btn" id="gFamCodeJoin">${T('Join with a code', 'Nhập mã gia đình')}</button></div>
          <p class="note fam-code-msg" id="gFamCodeMsg" hidden></p>
        </div>`}
      </div>
      <h3>${pic('💾')} ${T('Save a copy (Files / iCloud Drive)', 'Lưu một bản (Tệp / iCloud Drive)')}</h3>
      <p class="note">${T('Save a copy of your children’s progress to iCloud Drive, Google Drive or Files. Loading a copy checks the file and confirms with you before replacing anything.', 'Lưu một bản tiến trình vào iCloud Drive, Google Drive hoặc Tệp. Mở bản sao sẽ kiểm tra tệp và hỏi bạn trước khi thay thế.')}</p>
      <p class="note backup-when${backupAge() > 7 ? ' old' : ''}">${settings.lastBackup ? T('Last backup: ', 'Lần sao lưu gần nhất: ') + new Date(settings.lastBackup).toLocaleDateString(settings.lang === 'vi' ? 'vi-VN' : 'en-AU') + (backupAge() > 7 ? T(' (over a week ago)', ' (hơn một tuần trước)') : '') : T('No backup saved yet.', 'Chưa có bản sao lưu nào.')}</p>
      <div class="actions"><button class="btn" id="gSaveCopy">${pic('📤')} ${T('Save a copy', 'Lưu một bản')}</button><label class="btn" for="gLoadCopy">${pic('📥')} ${T('Load a copy', 'Mở bản đã lưu')}</label><input type="file" id="gLoadCopy" accept=".svsave,.txt,.json,text/plain,application/json" class="vh"></div>
      <p class="note">${T('The file stays in your own Drive or iCloud: Sparkle Valley has no server and never sees it.', 'Tệp nằm trong Drive hoặc iCloud của bạn: Thung Lũng Lấp Lánh không có máy chủ và không bao giờ xem tệp này.')}</p>
      
      </div></details>
      ${window.__sv && window.__sv.parents ? window.__sv.parents.grownupsHTML(gOpen.has('family')) : '' /* (round S) family missions, week note, cards, dance, bedtime, birthdays: js/parents.js */}

      <details class="gsec" data-sec="note" ${gOpen.has('note') ? 'open' : ''}><summary><span class="gi">📜</span><b>${T('Note for grown-ups', 'Lưu ý cho người lớn')}</b></summary><div class="gbody">
      <ul class="gnote"><li>${T('Sparkle Valley is a free family game made for fun and learning. It is provided as it is, without any promise or warranty.', 'Thung Lũng Lấp Lánh là trò chơi gia đình miễn phí, làm ra để vui chơi và học hỏi. Trò chơi được cung cấp như hiện có, không kèm bất kỳ cam kết hay bảo đảm nào.')}</li><li>${T('A grown-up is responsible for the child’s play: when and how long they play, online play and chat, and the device itself.', 'Người lớn chịu trách nhiệm về việc chơi của trẻ: chơi lúc nào, chơi bao lâu, chơi trực tuyến, trò chuyện, và cả thiết bị.')}</li><li>${T('Games the valley suggests playing for real (tug of war, jump rope, hopscotch, đá cầu, kites, cooking…) need a grown-up watching, a safe place and the right equipment.', 'Các trò chơi được gợi ý chơi ngoài đời (kéo co, nhảy dây, nhảy lò cò, đá cầu, thả diều, nấu ăn…) cần có người lớn trông, chỗ chơi an toàn và dụng cụ phù hợp.')}</li><li>${T('Take a break every 20 to 30 minutes, and stop if a child feels unwell (tired eyes, dizziness, motion sickness).', 'Nghỉ giải lao sau mỗi 20 đến 30 phút, và dừng chơi nếu trẻ thấy khó chịu (mỏi mắt, chóng mặt, say xe).')}</li><li>${T('Places, festivals, food and history are told simply for children and may not be complete or exact.', 'Địa danh, lễ hội, món ăn và lịch sử được kể đơn giản cho trẻ, có thể chưa đầy đủ hoặc chưa chính xác hoàn toàn.')}</li><li>${T('Online friends, chat and real photos come from other people and services; the makers are not responsible for their content.', 'Bạn bè trực tuyến, trò chuyện và ảnh thật đến từ người khác và các dịch vụ khác; người làm game không chịu trách nhiệm về nội dung đó.')}</li><li>${T('As far as the law allows, the makers are not responsible for any loss, injury or damage from using the game.', 'Trong phạm vi pháp luật cho phép, người làm game không chịu trách nhiệm về bất kỳ mất mát, thương tích hay thiệt hại nào do việc sử dụng trò chơi.')}</li></ul>
      </div></details>

      </div></div><button class="btn primary wide" id="gDone">${pic('💾')} ${T('Save & close', 'Lưu và đóng')}</button>`;
    bindLang(card, () => { draw(); after && after(); }); bindLearn(card, () => draw());
    card.querySelectorAll('details.gsec').forEach(d => d.ontoggle = () => { if (d.open) gOpen.add(d.dataset.sec); else gOpen.delete(d.dataset.sec); });
    bindPackStatus(card, () => { const y = m.scrollTop; draw(); m.scrollTop = y; });
    card.querySelector('.x').onclick = card.querySelector('#gDone').onclick = () => { m.close(); after && after(); };
    jumpNav(card, card.querySelector('h2'));
    card.querySelectorAll('.gbody').forEach(b => foldHeadings(b, 'grownups')); // (owner, 13 Oct) each category inside a part opens and closes
    card.querySelectorAll('.seg.cur button').forEach(b => b.onclick = () => { if (b.dataset.c === 'auto') settings.curPinned = false; else { settings.currency = b.dataset.c; settings.curPinned = true; } saveSettings(); draw(); });
    card.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { const n = +b.dataset.add; if (window.__sv && window.__sv.addCoins) window.__sv.addCoins(n); else { farm.coins += n; saveFarm(); } SFX.coin ? SFX.coin() : SFX.chime(); card.querySelector('#gCoins').textContent = fmt(farm.coins); toast(T('Coins added: ', 'Đã thêm: ') + fmt(n)); });
    card.querySelectorAll('.seg.cam button').forEach(b => b.onclick = () => { settings.camMode = b.dataset.c; saveSettings(); draw(); });
    card.querySelectorAll('.seg.cnt button').forEach(b => b.onclick = () => { settings.countPlayers = b.dataset.c === '1'; saveSettings(); draw(); });
    card.querySelectorAll('.seg.q button').forEach(b => b.onclick = () => { settings.quality = b.dataset.q; saveSettings(); draw(); toast(T('Restart the game to change graphics.', 'Mở lại trò chơi để đổi đồ họa.')); });
    const chk = (id, k, f: (() => void) | undefined = undefined) => card.querySelector(id).onchange = e => { settings[k] = e.target.checked; saveSettings(); f && f(); };
    card.querySelector('#gAutoMeet').onchange = e => { settings.autoMeet = e.target.checked; saveSettings(); };
    // (round R privacy, 9 Oct, owner) online play: off until a grown-up turns it on here (Grown-ups opens only with press and hold)
    card.querySelector('#gOnline').onchange = async e => {
      settings.online = e.target.checked; saveSettings();
      const { Net } = await import('./net.js');
      if (!settings.online) { Net.close(true); Net.friendsStop(); Net.stopListening(); } else if (window.__sv && window.__sv.listenFriends) window.__sv.listenFriends();
      drawWho();
    };
    // who is in the room now: name, friend or new, direct or cloud, when they came; the room's starter can remove someone
    const drawWho = async () => {
      const box = card.querySelector('#gWho'); if (!box) return;
      const { Net } = await import('./net.js'), list = Net.who();
      if (!document.body.contains(box)) return;
      const when = t => t ? new Date(t).toLocaleTimeString(settings.lang === 'vi' ? 'vi-VN' : 'en-AU', { hour: 'numeric', minute: '2-digit' }) : '';
      box.innerHTML = !settings.online ? `<p class="note">${T('Online play is off.', 'Chơi qua mạng đang tắt.')}</p>` : !list.length ? `<p class="note">${T('Not in a room right now.', 'Hiện không ở trong phòng nào.')}</p>`
        : list.map((m: typeof list[number] & { friend?: boolean; known?: boolean; canRemove?: boolean }) => `<div class="prow whorow"><div class="pw"><b>${esc(nm(m.name || T('Someone', 'Một bạn')))}${m.me ? ' (' + T('this device', 'máy này') + ')' : ''}</b><small>${m.me ? (m.host ? T('started the room', 'chủ phòng') : T('joined', 'đã vào')) : (m.host ? T('started the room', 'chủ phòng') + ' · ' : '') + (m.friend ? (m.known ? T('friend (proven)', 'bạn (đã xác nhận)') : T('friend', 'bạn')) : T('new', 'người mới')) + ' · ' + (m.via === 'cloud' ? T('cloud relay', 'qua mạng đám mây') : T('direct', 'trực tiếp'))}${m.at ? ' · ' + T('since', 'từ') + ' ' + when(m.at) : ''}</small></div>${m.canRemove ? `<button class="btn danger" data-whokick="${esc(m.id)}">🚪 ${T('Remove', 'Mời ra')}</button>` : ''}</div>`).join('');
      box.querySelectorAll('[data-whokick]').forEach(b => b.onclick = () => { if (confirm(T('Remove this player from the room?', 'Mời bạn này ra khỏi phòng?'))) { Net.kick(b.dataset.whokick); setTimeout(drawWho, 600); } });
    };
    drawWho();
    const turnIn = card.querySelector('#gTurn');
    turnIn.oninput = () => { settings.turnUrl = turnIn.value.trim(); saveSettings(); card.querySelector('#gTurnCred').classList.toggle('vh', !/^turns?:/i.test(settings.turnUrl)); };
    card.querySelector('#gTurnUser').oninput = e => { settings.turnUser = e.target.value; saveSettings(); };
    card.querySelector('#gTurnPass').oninput = e => { settings.turnPass = e.target.value; saveSettings(); };
    card.querySelector('#gNetCheck').onclick = async e => {
      const b = e.currentTarget, out = card.querySelector('#gNetRes'); b.disabled = true; out.textContent = '⏳ ' + T('Checking… (about 10 seconds)', 'Đang kiểm tra… (khoảng 10 giây)');
      const { Net } = await import('./net.js'); const r = await Net.check(); b.disabled = false;
      const cloudLine = '<br>' + (r.cloud ? '☁️ ' + T(`Cloud relay: ${r.cloud} servers answer, so friends can always play together (voice calls still need a direct link or a relay).`, `Mạng đám mây: ${r.cloud} máy chủ trả lời, nên các bạn luôn chơi cùng được (gọi bằng giọng nói vẫn cần kết nối trực tiếp hoặc máy chủ trung chuyển).`) : '⚠️ ' + T('Cloud relay: no server answered (the network may block it).', 'Mạng đám mây: không máy chủ nào trả lời (mạng có thể đang chặn).'));
      let msg;
      if (!r.server) msg = r.cloud ? '🟡 ' + T('The meeting service (PeerJS) is not answering, but the cloud relay works: you can still play together.', 'Dịch vụ PeerJS không trả lời, nhưng mạng đám mây hoạt động: vẫn chơi cùng nhau được.') : '❌ ' + T('Cannot reach the PeerJS service. Check the internet connection.', 'Không kết nối được dịch vụ PeerJS. Kiểm tra lại mạng internet.');
      else if (r.relay) msg = '✅ ' + T('Ready to play with friends anywhere (a relay is working).', 'Sẵn sàng chơi với bạn ở bất cứ đâu (máy chủ trung chuyển hoạt động).');
      else if (r.srflx) msg = '🟡 ' + T('Direct links work on most home Wi-Fi. For voice with friends on mobile data or strict networks, add a relay above.', 'Kết nối trực tiếp chạy được với Wi-Fi gia đình. Để gọi giọng nói với bạn dùng 4G hoặc mạng chặt, hãy thêm máy chủ trung chuyển ở trên.');
      else msg = '🟠 ' + T('Direct links only work on the same Wi-Fi. Add a relay above for voice with friends far away.', 'Kết nối trực tiếp chỉ chạy khi cùng Wi-Fi. Thêm máy chủ trung chuyển ở trên để gọi giọng nói với bạn ở xa.');
      out.innerHTML = msg + cloudLine;
    };
    card.querySelector('#gRain').onchange = e => { settings.noRain = !e.target.checked; saveSettings(); };
    chk('#gCalm', 'calm', applyComfort);
    card.querySelector('#gCap').onchange = e => { settings.captions = e.target.checked; saveSettings(); };
    card.querySelectorAll('.seg.sfit button').forEach(b => b.onclick = () => { settings.screenFit = b.dataset.sf; saveSettings(); SFX.tap(); dispatchEvent(new Event('resize')); const y = m.scrollTop; setTimeout(() => { draw(); m.scrollTop = y; }, 150); });
    card.querySelectorAll('.seg.tview button').forEach(b => b.onclick = () => { settings.twoView = b.dataset.tv; saveSettings(); dispatchEvent(new Event('resize')); const y = m.scrollTop; draw(); m.scrollTop = y; });
    card.querySelectorAll('.seg.tsize button').forEach(b => b.onclick = () => { settings.textSize = +b.dataset.ts; saveSettings(); applyComfort(); const y = m.scrollTop; draw(); m.scrollTop = y; });
    card.querySelectorAll('.seg.rest button').forEach(b => b.onclick = () => { settings.restMins = b.dataset.r; saveSettings(); const y = m.scrollTop; draw(); m.scrollTop = y; });
    // (daily adventure, chat C) on or off, when a new day starts, Gentle or Tricky
    chk('#gAdv', 'dailyAdventure');
    card.querySelectorAll('.seg.advday button').forEach(b => b.onclick = () => { settings.advDay = b.dataset.d; saveSettings(); const y = m.scrollTop; draw(); m.scrollTop = y; });
    card.querySelectorAll('.seg.advlvl button').forEach(b => b.onclick = () => { settings.advLevel = b.dataset.l; saveSettings(); const y = m.scrollTop; draw(); m.scrollTop = y; });
    chk('#gBil', 'bilingual', () => events.emit('SettingsChanged', { key: 'bilingual' })); chk('#gVoice', 'voice'); chk('#gMusic', 'music', () => settings.music ? Music.refresh() : Music.stop()); chk('#gSound', 'sound'); chk('#gTapSnd', 'tapSounds'); chk('#gDay', 'alwaysDay');
    card.querySelector('#vEn').onchange = e => { settings.voiceEn = e.target.value; saveSettings(); };
    card.querySelector('#vVi').onchange = e => { settings.voiceVi = e.target.value; saveSettings(); };
    card.querySelectorAll('[data-try]').forEach(b => b.onclick = () => {
      sayDevice(b.dataset.try, b.dataset.try === 'vi' ? 'Xin chào! Chào mừng con đến Thung Lũng Lấp Lánh.' : 'Hello! Welcome to Sparkle Valley.');
    });
    card.querySelectorAll('[data-rep]').forEach(b => b.onclick = () => { SFX.tap(); openReport(profiles.find(p => p.id === b.dataset.rep)); });
    card.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => openEditor(profiles.find(p => p.id === b.dataset.ed), () => { draw(); after && after(); }));
    // (round R privacy) the family code: kept on this device only (never in a backup); empty removes it and the photos
    // (owner, 16 Oct AEDT) family devices and photo sharing is a trial: shown when Studio switches it on, and on tester
    // devices so the owner can try it on the real service first
    if (familyTrialOn()) bindFamilyDevices(card, namedVillagers().map(id => ({ id, name: nm(window.__sv?.npcs.find(n => n.id === id)?.name || id) })));
    card.querySelector('#gFamSave').onclick = async () => { const v = card.querySelector('#gFam').value.trim(), out = card.querySelector('#gFamRes'); if (/^•/.test(v)) return; out.textContent = '…';
      const r: {ok: boolean; cleared?: boolean; bad?: boolean; n?: number; of?: number} = await setFamilyCode(v).catch(() => ({ ok: false }));
      out.textContent = r.cleared ? T('Family code removed from this device.', 'Đã xóa mã gia đình khỏi máy này.') : r.bad ? T('That code is not right: check it with the grown-up who set up the game.', 'Mã chưa đúng: hỏi lại người lớn đã cài trò chơi.') : r.ok ? T(`Saved: ${r.n || 0} of ${r.of || 0} family photos on this device.`, `Đã lưu: ${r.n || 0}/${r.of || 0} ảnh gia đình trên máy này.`) : T('Saved. The photos come the next time this device is online.', 'Đã lưu. Ảnh sẽ về khi máy có mạng.'); };
    const gw = card.querySelector('#gChange'); if (gw) gw.onclick = () => { m.close(); window.__sv.changePlayer(); };
    card.querySelector('#gAdd').onclick = () => profiles.length >= MAX_KIDS ? toast(T(`Up to ${MAX_KIDS} players.`, `Tối đa ${MAX_KIDS} người chơi.`)) : openEditor(null, () => { draw(); after && after(); });
    card.querySelector('#gRec').onclick = () => openRecorder(draw);
    { const b = installButton('btn wide installrow'); if (b) card.querySelector('.g-install').appendChild(b); }
    card.querySelector('#gNames').onclick = () => openRenamer(() => { const y = m.scrollTop; draw(); m.scrollTop = y; });
    bindExtras(card, () => { const y = m.scrollTop; draw(); m.scrollTop = y; }, toast);
    if (window.__sv && window.__sv.parents) window.__sv.parents.bindGrownups(card, () => { const y = m.scrollTop; draw(); m.scrollTop = y; }, toast); // (round S)
    card.querySelector('#gFarm').onclick = () => { if (confirm(T('Start the farm over? Players and stickers are kept.', 'Làm lại nông trại? Người chơi và hình dán được giữ lại.'))) { resetFarm(); window.__sv && window.__sv.farm && (window.__sv.farm.syncAnimals(), window.__sv.farm.syncPets()); toast(T('A fresh new farm!', 'Nông trại mới tinh!')); } };
    const syncFamTelemetry = () => { import('./players.js').then(M => M.noteFamilyCode && M.noteFamilyCode()).catch(() => {}); };
    const redrawKeepScroll = () => { const y = m.scrollTop; draw(); m.scrollTop = y; };
    const famMake = card.querySelector('#gFamCodeMake');
    if (famMake) famMake.onclick = () => {
      settings.familyCode = makeFamilyCode();
      saveSettings();
      syncFamTelemetry();
      SFX.chime && SFX.chime();
      toast(T('Family code created!', 'Đã tạo mã gia đình!'));
      redrawKeepScroll();
    };
    const famJoin = card.querySelector('#gFamCodeJoin'), famIn = card.querySelector('#gFamCodeIn'), famMsg = card.querySelector('#gFamCodeMsg');
    if (famJoin instanceof HTMLElement && famIn instanceof HTMLInputElement) {
      const doJoin = () => {
        const code = normalizeFamilyCode(famIn.value);
        if (!code) {
          if (famMsg instanceof HTMLElement) { famMsg.hidden = false; famMsg.textContent = T('Enter an 8-character family code (letters and numbers, like K7M4-P9Q2).', 'Hãy nhập mã gia đình gồm 8 ký tự chữ và số (ví dụ K7M4-P9Q2).'); }
          return;
        }
        settings.familyCode = code;
        saveSettings();
        syncFamTelemetry();
        SFX.chime && SFX.chime();
        toast(T('Joined family!', 'Đã tham gia gia đình!'));
        redrawKeepScroll();
      };
      famJoin.onclick = doJoin;
      famIn.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); doJoin(); } };
    }
    const famCopy = card.querySelector('#gFamCodeCopy');
    if (famCopy) famCopy.onclick = () => {
      const code = normalizeFamilyCode(settings.familyCode);
      if (code && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).catch(() => {});
      toast(T('Family code copied!', 'Đã sao chép mã gia đình!'));
    };
    const famLeave = card.querySelector('#gFamCodeLeave');
    if (famLeave) famLeave.onclick = () => {
      settings.familyCode = '';
      saveSettings();
      syncFamTelemetry();
      toast(T('Left the family.', 'Đã rời gia đình.'));
      redrawKeepScroll();
    };
    card.querySelector('#gSaveCopy').onclick = async () => {
      const text = JSON.stringify(createSaveCopy(getSnapshot()), null, 2);
      const name = 'sparkle-valley-' + new Date().toISOString().slice(0, 10) + '.svsave';
      const file = new File([text], name, { type: 'application/json' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: name });
          settings.lastBackup = Date.now(); saveSettings(); toast(T('Copy saved!', 'Đã lưu bản sao!'));
          return;
        }
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      settings.lastBackup = Date.now(); saveSettings(); toast(T('Copy downloaded!', 'Đã tải bản sao!'));
    };
    card.querySelector('#gLoadCopy').onchange = async e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try {
        const text = await f.text();
        const copy = readSaveCopyOrLegacy(text);
        const dateStr = new Date(copy.saved).toLocaleDateString(settings.lang === 'vi' ? 'vi-VN' : 'en-AU');
        const names = copy.profiles.map(p => nm(p.name || '')).filter(Boolean).join(', ') || T('Unnamed players', 'Người chơi chưa đặt tên');
        const confirmMsg = T(
          `Load save copy from ${dateStr} for: ${names}?\nThis will replace the progress on this device.`,
          `Mở bản sao lưu ngày ${dateStr} của: ${names}?\nThao tác này sẽ thay thế tiến trình hiện tại trên máy này.`
        );
        if (confirm(confirmMsg)) {
          profiles.splice(0, profiles.length, ...copy.profiles.map(normalizeProfile));
          Object.keys(farm).forEach(key => delete farm[key]);
          Object.assign(farm, copy.farm);
          settings.familyCode = normalizeFamilyCode(copy.settings.familyCode);
          Object.assign(settings, copy.settings);
          if (settings.familyCode) settings.familyCode = normalizeFamilyCode(settings.familyCode);
          if (copy.device) localStorage.setItem('sv2_playerid', copy.device);
          // An older copy has no device id; keep this device’s existing identity.
          saveProfiles(true);
          saveSettings();
          saveFarm();
          syncFamTelemetry();
          toast(T('Copy loaded successfully!', 'Đã mở bản sao thành công!'));
          draw();
          after && after();
        }
      } catch (err) {
        alert(T('Could not read this file. It is not a valid Sparkle Valley save copy.', 'Không thể đọc tệp này. Tệp không phải bản sao lưu hợp lệ của Thung Lũng Lấp Lánh.'));
      }
    };
  };
  draw();
  const offVoices = onVoices(() => { if (document.body.contains(m)) draw(); });
  m.addEventListener('sv-modal-close', offVoices, { once: true });
}

const MIC_HELP = {
  insecure: () => T('The microphone only works when the game is opened from a secure https:// address (your Netlify or GitHub Pages link). It does not work when the file is opened straight from a folder.', 'Micrô chỉ hoạt động khi mở trò chơi từ địa chỉ an toàn https:// (đường dẫn Netlify hoặc GitHub Pages). Micrô không hoạt động khi mở tệp trực tiếp từ thư mục.'),
  nomedia: () => T('This browser cannot use the microphone. On iPhone use Safari (iOS 14.3 or newer); on Android use Chrome.', 'Trình duyệt này không dùng được micrô. Trên iPhone hãy dùng Safari (iOS 14.3 trở lên); trên Android hãy dùng Chrome.'),
  denied: () => T('Microphone permission was blocked. iPhone: Settings → Safari → Microphone → Allow (or tap "aA" in the address bar → Website Settings). Android: tap the lock icon by the address → Permissions → Microphone → Allow. Then try again.', 'Quyền dùng micrô đang bị chặn. iPhone: Cài đặt → Safari → Micrô → Cho phép (hoặc chạm "aA" trên thanh địa chỉ → Cài đặt trang web). Android: chạm biểu tượng ổ khóa cạnh địa chỉ → Quyền → Micrô → Cho phép. Rồi thử lại.'),
  nomic: () => T('No microphone was found on this device.', 'Không tìm thấy micrô trên thiết bị này.'),
  other: () => T('The microphone could not start. Close other apps that use it (calls, video) and try again.', 'Không mở được micrô. Hãy đóng các ứng dụng khác đang dùng micrô (gọi điện, video) rồi thử lại.')
};
export function openRecorder(after) {
  const m = modal('rec', ''), card = m.querySelector('.card');
  let idx = Math.max(0, FAMILY_PHRASES.findIndex(p => !hasClip(settings.lang, p.id)));
  let live = null, err = micProblem(), busy = false;
  const L = () => settings.lang;
  const close = () => { if (live) live.stop(); releaseMic(); m.close(); after && after(); };
  const draw = () => {
    const ph = FAMILY_PHRASES[idx], has = hasClip(L(), ph.id), done = FAMILY_PHRASES.filter(p => hasClip(L(), p.id)).length;
    const keep = card.querySelector('.rec-body') ? card.querySelector('.rec-body').scrollTop : 0;
    card.innerHTML = `<div class="rec-head"><h2>🎙️ ${T('Family voice', 'Giọng của gia đình')}</h2><button class="x" aria-label="${T('Close', 'Đóng')}">✕</button></div><div class="rec-body">
      <p class="sub">${T('Read each line in a happy voice. The game will say these lines in your own voice.', 'Đọc từng câu bằng giọng vui vẻ. Trò chơi sẽ nói những câu này bằng chính giọng của bạn.')}</p>
      ${flagBtns()}
      ${err ? `<div class="warn">⚠️ ${esc(MIC_HELP[err] ? MIC_HELP[err]() : err)}</div>` : ''}
      <div class="recbig ${live ? 'live' : ''}">
        <div class="rec-n">${T('Line', 'Câu')} ${idx + 1} / ${FAMILY_PHRASES.length} ${has ? '✅' : ''}</div>
        <div class="rec-line">“${esc(L() === 'vi' ? ph.vi : ph.en)}”</div>
        <button class="micbtn" aria-label="${T('Record', 'Thu âm')}">${live ? '⏹' : '🎙️'}</button>
        <div class="rec-hint">${live ? T('Listening… read the line now. Tap to stop.', 'Đang nghe… đọc câu này ngay. Chạm để dừng.') : busy ? T('Saving…', 'Đang lưu…') : T('Tap the microphone, then read the line', 'Chạm vào micrô rồi đọc câu này')}</div>
        <div class="meter"><i></i></div>
        <div class="actions center">
          <button class="btn" id="rPrev" ${idx === 0 ? 'disabled' : ''}>◀ ${T('Back', 'Trước')}</button>
          ${has ? `<button class="btn" id="rPlay">▶ ${T('Listen', 'Nghe lại')}</button><button class="btn danger" id="rDel">✕</button>` : ''}
          <button class="btn primary" id="rNext" ${idx === FAMILY_PHRASES.length - 1 ? 'disabled' : ''}>${T('Next', 'Câu tiếp')} ▶</button>
        </div>
      </div>
      <div class="recdots">${FAMILY_PHRASES.map((p, k) => `<button class="${hasClip(L(), p.id) ? 'has' : ''} ${k === idx ? 'on' : ''}" data-k="${k}" aria-label="${k + 1}">${k + 1}</button>`).join('')}</div>
      <p class="note">${L() === 'vi' ? '🇻🇳 Tiếng Việt' : '🇦🇺 English'}: ${done}/${FAMILY_PHRASES.length} ${T('recorded', 'câu đã thu')} · ${L() === 'vi' ? '🇦🇺 English' : '🇻🇳 Tiếng Việt'}: ${clipCountFor(L() === 'vi' ? 'en' : 'vi')}/${FAMILY_PHRASES.length}${settings.familyPitch ? ' · ' + T('device voice tuned to your pitch', 'giọng máy đã chỉnh theo cao độ của bạn') : ''}</p>
      <label class="tog"><input type="checkbox" id="rUse" ${settings.familyVoice ? 'checked' : ''}> ${T('Use my recordings in the game', 'Dùng giọng thu của tôi trong trò chơi')}</label>
      <p class="note">${T('Recordings stay on this device and are never uploaded. Lines you have not recorded are read by the device voice, tuned to sound closer to yours.', 'Bản thu chỉ lưu trên máy này và không bao giờ được tải lên. Những câu chưa thu sẽ do giọng của máy đọc, được chỉnh cho gần với giọng bạn.')}</p></div>
      <div class="rec-foot"><button class="btn primary big" id="rSave">💾 ${T('Save and close', 'Lưu và đóng')}</button></div>`;
    card.querySelector('.rec-body').scrollTop = keep;
    card.querySelector('.x').onclick = close;
    // recordings are saved as each line is recorded; this saves the settings and closes
    card.querySelector('#rSave').onclick = () => { saveSettings(); SFX.chime && SFX.chime(); toast(T('Saved! The game will use your voice.', 'Đã lưu! Trò chơi sẽ dùng giọng của bạn.')); close(); };
    bindLang(card, () => { idx = Math.max(0, FAMILY_PHRASES.findIndex(p => !hasClip(L(), p.id))); draw(); });
    card.querySelector('#rUse').onchange = e => { settings.familyVoice = e.target.checked; saveSettings(); };
    card.querySelector('#rPrev').onclick = () => { if (!live) { idx--; draw(); } };
    card.querySelector('#rNext').onclick = () => { if (!live) { idx++; draw(); } };
    card.querySelectorAll('.recdots [data-k]').forEach(b => b.onclick = () => { if (!live) { idx = +b.dataset.k; draw(); } });
    const play = card.querySelector('#rPlay'); if (play) play.onclick = () => playClip(L(), ph.id);
    const del = card.querySelector('#rDel'); if (del) del.onclick = async () => { await deleteClip(L(), ph.id); draw(); };
    card.querySelector('.micbtn').onclick = async () => {
      if (busy) return;
      if (live) { live.stop(); return; }
      ac(); // unlock sound for playback inside this tap
      try {
        live = await startRecording({ onLevel: v => { const el = card.querySelector('.meter i'); if (el) el.style.width = (v * 100) + '%'; } });
        err = null; draw();
      } catch (e) { live = null; err = e.code || 'other'; draw(); return; }
      live.finished.then(async blob => {
        live = null; busy = true; draw();
        if (blob.size > 6000) {
          try {
            await saveClip(L(), ph.id, blob);
            const hz = await estimatePitch(blob); if (hz) { settings.familyPitch = +pitchFromHz(hz).toFixed(2); saveSettings(); }
            playClip(L(), ph.id);
            if (idx < FAMILY_PHRASES.length - 1) setTimeout(() => { if (!live) { idx++; draw(); } }, 2200);
          } catch (e) { err = T('Could not save on this device (private browsing?).', 'Không lưu được trên máy này (đang duyệt web ẩn danh?).'); }
        } else err = T('That was too quiet. Hold the phone closer and try again.', 'Âm thanh nhỏ quá. Cầm điện thoại gần hơn rồi thử lại.');
        busy = false; draw();
      });
    };
  };
  draw();
}

// ---------- Games hub ----------
// the traditional games Lotus Village's hội làng runs on its time table (js/folkshow.js); unchanged in round R


