// Grown-ups settings for the optional extras: the recorded voice pack, voice control and free chat with the villagers.
// Everything here is off until a grown-up turns it on; the chat key stays on this device.
// (round R privacy, 9 Oct, owner) voices are made in Studio only: no online voice engine, voice key or voice copy here.
import { T } from './i18n.js';
import { settings, saveSettings } from './state.js';
import { say, voicePack, savePackOffline } from './voice.js';
import { canListen } from './listen.js';
import { esc } from './util.js';

// (round R privacy, 9 Oct, owner) what the game keeps and sends, in plain words: a small block at the top of Grown-ups
// (its own block, so the Grown-ups groups stay as they are)
export function privacyHTML() {
  // (Analytics & Infra, 10 Oct, owner) plain words for parents: the grown-ups' admin tools are never named here; the play
  // report is named only by its Grown-ups group, "Analytics and Backup" (owner, 10 Oct)
  const L = [
    ['Saves stay on this device.', 'Dữ liệu chơi được lưu trên máy này.'],
    ['Analytics and Backup', 'Phân tích và sao lưu'],
    ['Online play and the internet are off until a grown-up turns them on. Friends see a name, look and photo only after being let in.', 'Chơi trực tuyến và internet tắt cho tới khi người lớn bật. Bạn bè chỉ thấy tên, hình nhân vật và ảnh sau khi được cho vào.'],
    ['Private family photos download after you connect this device in Family photos and devices. Approve new devices on an already connected device. Earlier shared photos can still use their existing photo code.', 'Ảnh gia đình riêng tư tải về sau khi kết nối máy trong Ảnh gia đình và thiết bị. Chấp nhận máy mới trên máy đã kết nối. Ảnh chia sẻ trước đây vẫn dùng được mã ảnh cũ.'],
    ['The voices are recorded ahead of time and come with the game. There are no voice keys on this device.', 'Giọng đọc được thu sẵn và đi kèm trò chơi. Máy này không có key giọng đọc.'],
    ['Real-world maps (Google) open straight away when a grown-up has turned on Use the internet; while it is off, a grown-up presses and holds first.', 'Bản đồ nơi thật (Google) mở ngay khi người lớn đã bật Dùng internet; khi đang tắt, người lớn nhấn giữ trước.']];
  return `<details class="g-priv"><summary>🔒 ${T('Privacy: what the game keeps and sends', 'Riêng tư: trò chơi lưu và gửi gì')}</summary><ul>${L.map(([en, vi]) => `<li>${T(en, vi)}</li>`).join('')}</ul></details>`;
}

// (Analytics & Infra, 10 Oct, owner) everything that uses the internet, folded under the Use the internet switch
export function netListHTML() {
  const ON = [
    ['Playing with friends: rooms, knocking, invitations and “playing now” (the free PeerJS meeting service and a cloud relay).', 'Chơi cùng bạn: phòng, gõ cửa, lời mời và “đang chơi” (dịch vụ gặp nhau PeerJS miễn phí và mạng đám mây).'],
    ['Talking with friends: voices go straight between the devices, or through a relay on strict networks. Never recorded.', 'Nói chuyện với bạn: giọng đi thẳng giữa hai máy, hoặc qua máy trung chuyển khi mạng chặt. Không bao giờ ghi lại.'],
    ['Real places: Google Maps and Street View open inside the game without asking again. Google sees which place is looked at.', 'Nơi thật: Google Maps và Street View mở ngay trong trò chơi, không hỏi lại. Google biết nơi nào đang được xem.']];
  const ALWAYS = [
    ['Game updates: a new version downloads by itself.', 'Cập nhật trò chơi: bản mới tự tải về.'],
    ['Recorded voices: downloaded once, then kept for offline play.', 'Giọng đọc đã thu: tải một lần, rồi giữ lại để chơi không cần mạng.'],
    ['Messages, stories, festivals and names set by your family.', 'Lời nhắn, truyện, lễ hội và tên do gia đình đặt.'],
    ['Private family photos, after connecting and approving this device in Family photos and devices.', 'Ảnh gia đình riêng tư, sau khi kết nối và chấp nhận máy trong Ảnh gia đình và thiết bị.'],
    ['Analytics and Backup', 'Phân tích và sao lưu'],
    ['Talking to the game (🎤) and villager chat (AI), only when switched on below.', 'Nói chuyện với trò chơi (🎤) và dân làng trò chuyện (AI), chỉ khi được bật bên dưới.']];
  const ul = L => `<ul>${L.map(([en, vi]) => `<li>${T(en, vi)}</li>`).join('')}</ul>`;
  return `<details class="g-priv g-net"><summary>🌐 ${T('What uses the internet', 'Những gì dùng internet')}</summary>
    <p class="note"><b>${T('When Use the internet is on:', 'Khi bật Dùng internet:')}</b></p>${ul(ON)}
    <p class="note"><b>${T('Whenever the device is online (each has its own switch or code):', 'Mỗi khi máy có mạng (mỗi mục có công tắc hoặc mã riêng):')}</b></p>${ul(ALWAYS)}
    <p class="note">${T('With no internet the whole game still plays, with the voices already kept on this device.', 'Không có internet, cả trò chơi vẫn chơi được, với giọng đọc đã lưu trên máy này.')}</p></details>`;
}

export function extrasHTML() {
  const s = settings;
  return `
  <h3>🎙️ ${T('Offline voice pack', 'Gói giọng đọc ngoại tuyến')}</h3>
  ${voicePack() ? `<p class="note">${T(`Available: ${Object.keys(voicePack().lines).length} recorded lines (${Object.values(voicePack().voices || {}).flatMap(v => Object.values(v).map(x => x.name)).join(', ')}). They play instead of the device voice, even with no internet.`, `Có sẵn: ${Object.keys(voicePack().lines).length} câu đã thu (${Object.values(voicePack().voices || {}).flatMap(v => Object.values(v).map(x => x.name)).join(', ')}). Các câu này phát thay giọng của máy, kể cả khi không có mạng.`)}</p>
  <p class="note">${T('Voices play over the internet while this device is online, and the lines already heard stay on it. To play offline with every voice, keep them all on this device (about 250 MB for each language; use Wi-Fi).', 'Khi máy có mạng, giọng nói phát qua mạng, và những câu đã nghe được giữ lại trong máy. Để chơi offline với đủ giọng nói, hãy lưu tất cả vào máy (khoảng 250 MB cho mỗi ngôn ngữ; dùng Wi-Fi).')}</p>
  <button class="btn wide" id="xPackSave">⬇️ ${T('Keep all voices on this device', 'Lưu tất cả giọng đọc vào máy')}</button><p class="note" id="xPackProg">${T('Downloads continue in the background while the game stays open, including after Save & close.', 'Giọng đọc tiếp tục tải khi trò chơi còn mở, kể cả sau khi Lưu và đóng.')}</p>`
  : `<p class="note">${T('The recorded voices have not downloaded yet: they come with the game the next time this device is online.', 'Giọng đọc đã thu chưa tải về: sẽ tải cùng trò chơi vào lần tới máy này có mạng.')}</p>`}
  <h3>✨ ${T('More natural voice', 'Giọng tự nhiên hơn')}</h3>
  <p class="note">${T('Every character has their own voice: grandparents speak slower and lower, kids higher, aunties and uncles with a woman’s or a man’s voice. More Vietnamese voices: on Android open Settings → Text-to-speech → Google → Install voice data → Vietnamese and download all 4 voices; the game shares them out between the characters.', 'Mỗi nhân vật có giọng riêng: ông bà nói chậm và trầm hơn, các bạn nhỏ cao giọng hơn, cô chú có giọng nữ hoặc nam. Thêm giọng tiếng Việt: trên Android vào Cài đặt → Chuyển văn bản thành giọng nói → Google → Cài đặt dữ liệu giọng nói → Tiếng Việt và tải cả 4 giọng; trò chơi sẽ chia các giọng cho các nhân vật.')}</p>
  <div class="field"><label>${T('Speed', 'Tốc độ')}</label><div class="seg vrate">${[[.85, T('Slow', 'Chậm')], [1, T('Normal', 'Vừa')], [1.12, T('Quick', 'Nhanh')]].map(([v, l]) => `<button data-r="${v}" class="${Math.abs((s.voiceRate || 1) - v) < .01 ? 'on' : ''}">${l}</button>`).join('')}</div></div>
  <p class="note">${T('Lines with no recording use this device’s own voice and are recorded for a later update. The voices are recorded ahead of time: this device has no voice keys and never copies anyone’s voice.', 'Câu chưa có bản ghi dùng giọng của máy này và sẽ được thu cho bản cập nhật sau. Giọng đọc được thu sẵn: máy này không có key giọng đọc và không bao giờ sao chép giọng của ai.')}</p>
  <h3>🎤 ${T('Talking to the game', 'Nói chuyện với trò chơi')}</h3>
  <label class="tog"><input type="checkbox" id="xVc" ${s.voiceControl ? 'checked' : ''}> ${T('Show the 🎤 button: children can say “open the map”, “play marbles”, “go to the village”…', 'Hiện nút 🎤: trẻ có thể nói “mở bản đồ”, “chơi bắn bi”, “đi đến làng”…')}</label>
  <p class="note">${canListen() ? T('Speech recognition is done by Apple or Google and usually needs the internet. Nothing is recorded or saved.', 'Nhận dạng giọng nói do Apple hoặc Google thực hiện và thường cần mạng. Không có gì được ghi âm hay lưu lại.') : T('This browser cannot listen. Use Safari on iPhone/iPad or Chrome on Android.', 'Trình duyệt này không nghe được. Hãy dùng Safari trên iPhone/iPad hoặc Chrome trên Android.')}</p>
  <h3>💬 ${T('Villagers who chat freely (AI)', 'Dân làng trò chuyện tự nhiên (AI)')}</h3>
  <p class="note">${T('Tap 💬 Chat when a villager talks. Without a key they answer with built-in, offline answers. With an Anthropic API key they can answer anything, kindly and in character, using Claude. Only the chat text and the child’s first name are sent.', 'Chạm 💬 Trò chuyện khi dân làng nói. Không có key thì họ trả lời bằng câu có sẵn, không cần mạng. Có Anthropic API key thì họ trả lời mọi câu hỏi, nhẹ nhàng và đúng tính cách, nhờ Claude. Chỉ gửi nội dung trò chuyện và tên của bé.')}</p>
  <label class="tog"><input type="checkbox" id="xAi" ${s.aiOn ? 'checked' : ''}> ${T('Use Claude for villager chat', 'Dùng Claude cho dân làng trò chuyện')}</label>
  <div class="field" ${s.aiOn ? '' : 'hidden'} id="xAiF"><label for="xAiKey">Anthropic API key</label><input type="password" id="xAiKey" autocomplete="off" value="${esc(s.aiKey || '')}" placeholder="sk-ant-…"></div>`;
}

export function bindExtras(card, redraw, toast) {
  const s = settings, q = x => card.querySelector(x), save = () => saveSettings();
  card.querySelectorAll('.seg.vrate button').forEach(b => b.onclick = () => { s.voiceRate = +b.dataset.r; save(); redraw(); say('This is how fast I talk.', 'Tớ nói nhanh như thế này nè.'); });
  if (q('#xPackSave')) q('#xPackSave').onclick = () => {
    // The shared voice service owns this job and its progress bar, even after this card closes.
    savePackOffline().catch(() => {});
  };
  // (round R privacy, 9 Oct) the only key on this device is the chat key (owner: keep as is)
  const k = q('#xAiKey'); if (k) k.onchange = () => { s.aiKey = k.value.trim(); save(); };
  q('#xVc').onchange = e => { s.voiceControl = e.target.checked; save(); document.querySelectorAll<HTMLElement>('.dk.voicecmd').forEach(b => b.hidden = !s.voiceControl); };
  q('#xAi').onchange = e => { s.aiOn = e.target.checked; save(); redraw(); };
}
