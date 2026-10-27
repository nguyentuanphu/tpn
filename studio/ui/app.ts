// Sparkle Studio dashboard (runs in the browser, talks to studio.cts on this computer).
import { viMessage, PERM_VI } from './vi.js';
import type { StudioContent, StudioInfo, StudioDevice, Rule, BuildType } from '../../types/studio.d.ts';
// a page's own element by its selector (a box, a button or a list: the input type covers what the pages use)
const $ = <E extends Element = HTMLInputElement>(s: string) => document.querySelector<E>(s);
let LANG = localStorage.getItem('studioLang') || 'vi';
const T = (en, vi) => LANG === 'vi' ? vi : en;
// what a box, a list or a file chooser holds, from its event (TypeScript: an event's target is any element)
const val = (e: Event) => e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement ? e.target.value : '';
const fileOf = (e: Event) => e.target instanceof HTMLInputElement && e.target.files ? fileOf(e) : undefined;
// a [English, Vietnamese] pair in the chosen language
const T2 = (p: string[]) => T(p[0], p[1]);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// The same page runs in SparkleStudio.exe (http://localhost:7777/studio/) and online on the game's website (/studio/),
// at the same addresses: the API, the game and its files are under BASE in both. Online, a change needs the "X-Studio" header (other websites can't send it).
const BASE = '/studio', GAME = BASE + '/game/', FILE = p => BASE + '/api/file/' + p;
// (round R privacy) a family photo is "family:<name>" in the private store, shown through Studio itself; an old one is a file
const PIC = p => /^family:[\w-]+$/.test(p || '') ? BASE + '/api/familyphoto/' + p.slice(7) : FILE(p);
const OLDPICS = () => [...Object.values(CONTENT.faces || {}).map(f => f && f.photo), ...(CONTENT.album || []).map(x => x && x.photo)].filter(p => /^content\/(faces|album)\//.test(p || '')).length;
// Sydney time, AEDT or AEST as it applies (CLAUDE.md, owner 10 Oct; it used to show Brisbane time)
const whenAEST = iso => new Date(iso).toLocaleString(LANG === 'vi' ? 'vi-VN' : 'en-AU', { timeZone: 'Australia/Sydney', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' ' + (/GMT\+11|AEDT/.test(new Date(iso).toLocaleString('en-AU', { timeZone: 'Australia/Sydney', timeZoneName: 'short' })) ? 'AEDT' : 'AEST');
// the game's own drawings in place of phone emoji on every Studio page (owner, round R; js/emojiswap.js)
import(GAME + 'js/emojiswap.js').catch(() => { });
// (owner, 10 Oct) the servers answer in English: in Vietnamese, every answer is shown in Vietnamese (studio/ui/vi.js)
const say = m => LANG === 'vi' ? viMessage(m) : String(m ?? '');
// e.raw keeps the server's own words (the Voices page looks at them to stop early)
const api = async (p: string, body?: unknown) => { const r = await fetch(BASE + '/api/' + p, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Studio': '1' }, body: JSON.stringify(body) }); const j = await r.json().catch(() => ({})); if (r.status === 401 && j.signin) { signIn(); throw Object.assign(new Error(T('Please sign in.', 'Vui lòng đăng nhập.')), { signin: true }); } if (!r.ok) { const raw = String(j.error || r.status); throw Object.assign(new Error(say(raw)), { raw }); } return j; };
// (owner, 10 Oct: "missing feedback after a save") the message is bigger, sits above the bar at the bottom of a phone,
// stays 5 seconds (7 for a problem) and is green when something worked
const toast: ((m: string, kind?: string) => void) & { t?: ReturnType<typeof setTimeout> } = (m, kind = '') => { const t = $('#toast'); t.textContent = m; t.className = 'on ' + kind; clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), kind === 'bad' ? 7000 : 5000); };
// (r85) a toast with an Undo button, for a change made at once (Simple screen: moving a game to another group)
const toastUndo = (m, undo) => { const t = $('#toast'); t.textContent = m + ' '; const b = document.createElement('button'); b.type = 'button'; b.className = 'btn small undo'; b.textContent = T('Undo', 'Hoàn tác');
  b.onclick = () => { clearTimeout(toast.t); t.classList.remove('on', 'act'); undo(); }; t.appendChild(b); t.className = 'on act good'; clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on', 'act'), 8000); };
const fail = e => toast('⚠️ ' + say(e.message || e), 'bad');
let INFO: StudioInfo | null = null, CONTENT: StudioContent = {};
// ---------- devices you can recognise (owner, 13 Oct AEDT: "which device belongs to whom, and to which child") ----------
// Every list of devices says the same things in the same order: the name the family gave it (or an easy name made from
// its id, the same every time), the children who play on it (first names, from the Analytics), what it is, the town,
// and when it last played; the id stays in small print. Robots (test browsers in data centres) are greyed and can be hidden.
// the easy name comes from the game's own file (js/content/devname.js), so the game and Studio always agree
let DEVNAME = null; const easyName = id => DEVNAME ? DEVNAME.easyName(id, LANG) : String(id || '').slice(0, 6);
const devKindName = k => ({ phone: T('Phone', 'Điện thoại'), tablet: T('Tablet', 'Máy tính bảng'), computer: T('Computer', 'Máy tính') }[k] || '');
const devKids = d => [...new Set(((d && d.kids) || []).map(K => K.name).filter(Boolean))];
const devTown = d => d && d.loc ? [d.loc.city, d.loc.country].filter(Boolean).join(', ') : '';
const devAgo = iso => { if (!iso) return ''; const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 60 ? T(`${m} min ago`, `${m} phút trước`) : m < 48 * 60 ? T(`${Math.round(m / 60)} h ago`, `${Math.round(m / 60)} giờ trước`) : T(`${Math.round(m / 1440)} days ago`, `${Math.round(m / 1440)} ngày trước`); };
const devLast = d => d.online ? T('playing now', 'đang chơi') : d.seenAt ? devAgo(d.seenAt) : d.last ? devAgo(d.last + 'T12:00:00') : '';
// a test browser in a data centre: no graphics card (0 to 3 frames a second) or a robot's browser name, or a town that is a big data centre
const DATA_TOWNS = /^(Council Bluffs|Boardman|Ashburn|The Dalles|Mountain View|San Jose|Santa Clara|Columbus|Des Moines|Quincy|Prineville|Moncks Corner|Dublin|Frankfurt am Main|North Charleston)$/i;
const isRobot = d => !!d && (/headless|playwright|puppeteer|lighthouse|bot/i.test(d.br || '') || (d.fps != null && d.fps <= 3 && !devKids(d).length) || (d.loc && DATA_TOWNS.test(d.loc.city || '') && !devKids(d).length));
const HIDDEN = () => { try { return new Set(JSON.parse(localStorage.getItem('studioHiddenDevices') || '[]')); } catch (e) { return new Set(); } };
const setHidden = (id, on) => { const h = HIDDEN(); on ? h.add(id) : h.delete(id); try { localStorage.setItem('studioHiddenDevices', JSON.stringify([...h])); } catch (e) { } };
const devTitle = d => d.label || easyName(d.id);
// one line about a device, e.g. "Tiên, Bin · Tablet · iOS · Safari · Sydney, AU · 2 h ago"
// (owner, 13 Oct AEDT: a ticked iPhone got nothing) on an iPhone the Home Screen app and Safari keep their own storage,
// so each is its own device here: the row says which one it is
const devAbout = d => { const kids = devKids(d), what = [devKindName(d.kind), d.os, d.app ? T('Home Screen app', 'Ứng dụng Màn hình chính') : d.br ? T(`in ${d.br}`, `trong ${d.br}`) : ''].filter(x => x && x !== '?').join(' · ');
  return [kids.length ? '🧒 ' + kids.join(', ') : '', what, devTown(d) ? '📍 ' + devTown(d) : '', devLast(d) ? '🕒 ' + devLast(d) : ''].filter(Boolean).join(' · '); };
// (r85) the grey second line of a device card: device, system, browser (or the Home Screen app), town, last seen
const devMeta = d => [devKindName(d.kind), d.os, d.app ? T('Home Screen app', 'Ứng dụng Màn hình chính') : d.br, devTown(d) ? '📍 ' + devTown(d) : '', devLast(d) ? '🕒 ' + devLast(d) : ''].filter(x => x && x !== '?').join(' · ');
const devHTML = d => `<b class="dname">${esc(devTitle(d))}</b>${isRobot(d) ? ` <span class="pill robot">🤖 ${T('probably a robot', 'có lẽ là máy tự động')}</span>` : ''} <span class="dabout">${esc(devAbout(d))}</span> <small class="mini">${esc(d.id)}</small>`;
// a search box and "show robots" over a list of device rows (.devrow): a ticked device always stays in view
const devFilter = list => { if (!list || list.querySelector('.devfind')) return; const bar = document.createElement('div'); bar.className = 'devfind row';
  bar.innerHTML = `<input type="search" placeholder="${T('Find: a child, a name, a town, a phone…', 'Tìm: tên bé, tên máy, thành phố, điện thoại…')}" aria-label="${T('Find a device', 'Tìm máy')}"><label class="chk small"><input type="checkbox" data-robots> ${T('Show robots', 'Hiện máy tự động')}</label>`;
  list.prepend(bar); const q = bar.querySelector<HTMLInputElement>('input[type=search]'), rb = bar.querySelector<HTMLInputElement>('[data-robots]');
  const apply = () => { const t = q.value.trim().toLowerCase(); list.querySelectorAll('.devrow').forEach(r => { const on = !!r.querySelector(r.classList.contains('devcard') ? '[data-tdev]:checked, [data-dev]:checked' : 'input[type=checkbox]:checked'); r.hidden = !on && ((r.classList.contains('robot') && !rb.checked) || (t && !r.textContent.toLowerCase().includes(t))); }); };
  q.oninput = apply; rb.onchange = apply; apply(); };
const devMatch = (d, q) => !q || [devTitle(d), easyName(d.id), d.id, devAbout(d)].join(' ').toLowerCase().includes(q.toLowerCase());
// (r81, owner 17 Oct AEDT) the content pages go live at once, without Publish: online they are saved to the website's live
// store (/studio/api/live/content); SparkleStudio.exe keeps them in the game folder too (so Publish still works) and sends
// them with its Studio key when the website and a key are set. Music, the map and buildings, voices and real photos
// still wait for Publish. Each page's sections:
const LIVE_PAGES = { message: ['message'], missions: ['missions'], quiz: ['quiz'], stories: ['tales'], villagers: ['names', 'genders', 'faces'], looks: ['looks'], plots: ['plots'], path: ['activities'], play: ['defaults', 'features'], ads: ['ads'], album: ['album'] };
const LIVE_LISTS = ['missions', 'quiz', 'tales', 'album'];
const liveOn = () => !!(INFO && (INFO.online || (INFO.conf && INFO.conf.players)));
const PUB = (pub, live) => LIVE_PAGES[cur] && liveOn() ? live : pub;
const livePart = page => Object.fromEntries(LIVE_PAGES[page].map(k => [k, CONTENT[k] && typeof CONTENT[k] === 'object' ? CONTENT[k] : LIVE_LISTS.includes(k) ? [] : {}]));
const LIVE_SAVED = () => T('Saved and live now (no Publish needed): the children’s devices get it the next time they open the game (about 30 seconds).', 'Đã lưu và có hiệu lực ngay (không cần Phát hành): máy của các con nhận được khi mở game lần tới (khoảng 30 giây).');
async function saveLivePage(page) {
  if (INFO.online) { await api('live/content', { content: livePart(page) }); markSaved();
    api('pending').then(j => { INFO.waiting = j.files.length; INFO.unpublished = !!INFO.waiting; head(); }).catch(() => { }); // (a new ad picture still waits)
    return toast('✅ ' + LIVE_SAVED() + (page === 'ads' && INFO.unpublished ? ' ' + T('A new picture still needs Publish.', 'Hình mới vẫn cần Phát hành.') : ''), 'good'); }
  await api('content', CONTENT); markSaved(); INFO.unpublished = true; head();
  try { await api('live/content', { content: livePart(page) }); toast('✅ ' + LIVE_SAVED(), 'good'); }
  catch (e) { toast('⚠️ ' + T('Saved on this computer, but the website did not take it: ', 'Đã lưu trên máy này, nhưng trang web chưa nhận: ') + say(e.raw || e.message) + ' ' + T('Press Publish to send it.', 'Hãy bấm Phát hành để gửi.'), 'bad'); }
}
const saveContent = async () => { if (LIVE_PAGES[cur] && liveOn()) return saveLivePage(cur); await api('content', CONTENT); markSaved(); if (INFO) { INFO.unpublished = true; head(); if (INFO.online) api('pending').then(j => { INFO.waiting = j.files.length; head(); }).catch(() => { }); } toast('✅ ' + T('Saved. Press Publish (at the top) to send it to the children’s devices.', 'Đã lưu. Bấm Phát hành (ở trên cùng) để gửi tới máy của các con.'), 'good'); };
// ---------- changes not saved yet (owner, 10 Oct: "edits disappear without warning") ----------
// On the pages where you change things, a label by Save says "Not saved yet" or "Saved", and leaving the page (another
// section, Back, the language, reload, closing) asks first. Leaving without saving puts the family's content back as it was.
const GUARD = new Set(['looks', 'plots', 'message', 'missions', 'children', 'album', 'quiz', 'stories', 'villagers', 'releases', 'lab', 'festivals', 'path', 'music', 'map', 'play', 'ads', 'settings']);
let KEPT = '', DIRTY = false, SAVED_HERE = '';
const contentNow = () => JSON.stringify(CONTENT);
const unsaved = () => GUARD.has(cur) && (DIRTY || (!!KEPT && contentNow() !== KEPT));
function markSaved() { DIRTY = false; KEPT = contentNow(); SAVED_HERE = cur; paintState(); }
function leaveOk() {
  if (!unsaved()) return true;
  if (!confirm(T('This page has changes that are not saved. Leave without saving them?', 'Trang này có thay đổi chưa lưu. Rời trang mà không lưu?'))) return false;
  if (KEPT) CONTENT = JSON.parse(KEPT); DIRTY = false; return true;
}
function paintState() {
  const P = $('#page'); if (!P || !GUARD.has(cur)) return; const u = unsaved();
  const txt = u ? T('Not saved yet', 'Chưa lưu') : SAVED_HERE === cur ? T('Saved', 'Đã lưu') : T('No changes', 'Chưa đổi');
  P.querySelectorAll<HTMLInputElement>('.bar').forEach(b => { if (!b.querySelector<HTMLInputElement>('.btn:not(.ghost)')) return; let s = b.querySelector<HTMLElement>('.savestate'); if (!s) { s = document.createElement('span'); b.prepend(s); }
    const cls = 'savestate ' + (u ? 'warn' : SAVED_HERE === cur ? 'ok' : 'note'); if (s.className !== cls) s.className = cls; if (s.textContent !== txt) s.textContent = txt; });
}
// typing or choosing on a page marks it changed (not the search boxes or a file chooser)
const touched = e => { const t = e.target; if (!t.closest || !t.closest('#page') || t.type === 'file' || t.closest('[data-nodirty]')) return; DIRTY = true; paintState(); };
document.addEventListener('input', touched, true); document.addEventListener('change', touched, true);
['click', 'pointerup'].forEach(k => document.addEventListener(k, () => setTimeout(paintState, 0), true));
window.addEventListener('beforeunload', e => { if (unsaved()) { e.preventDefault(); e.returnValue = ''; } });

// Five sections instead of seventeen tabs (round K, owner: "too many menus, confusing on the phone"): each section opens
// as big cards, one per page; on a phone the sections are a bar at the bottom, on a computer a column on the left.
const SECTIONS = [
  { k: 'home', i: '🏠', en: 'Home', vi: 'Trang chính', pages: ['home'] },
  { k: 'family', i: '💛', en: 'Family', vi: 'Gia đình', pages: ['message', 'missions', 'children', 'album', 'quiz', 'stories', 'villagers', 'plots', 'familycode'] },
  { k: 'game', i: '🎮', en: 'Game', vi: 'Trò chơi', pages: ['releases', 'lab', 'festivals', 'looks', 'path', 'music', 'map', 'photos', 'play', 'voices', 'ads'] },
  { k: 'players', i: '📊', en: 'Analytics', vi: 'Phân tích', pages: ['management', 'managementdevices', 'managementchildren', 'managementattention', 'managementactivities', 'managementactivity', 'managementdevice', 'managementrelease', 'managementoperations', 'managementfinance', 'managementchanges', 'players', 'testers'] },
  { k: 'setup', i: '⚙️', en: 'Setup', vi: 'Thiết lập', pages: ['publish', 'site', 'check', 'settings', 'admins', 'security', 'accesslog'] }
];
// who is signed in online (round O: each admin has an own account): a viewer sees the Analytics only; the 👥 Admins
// page is online only (the exe on the family's computer is the owner's)
const ROLE = () => (INFO && INFO.me && INFO.me.role) || 'owner';
// (round R privacy) Security and the Access log are the owner's, online only
const ONLINE_ONLY = ['admins', 'security', 'accesslog'], OWNER_ONLY = ['security', 'accesslog'];
// (owner, 14 Oct AEDT) each account has its own permissions (netlify/lib/admins.mts PERMS): a page shows only to those
// who may open it, the rest of the dashboard follows. The exe on the family computer is the owner's: everything.
const CAN = k => ROLE() === 'owner' || ((INFO && INFO.me && INFO.me.perms) || []).includes(k);
const PAGE_NEEDS = { management: 'management.read', managementdevices: 'management.read', managementchildren: 'management.deviceDetail', managementdevice: 'management.deviceDetail', managementattention: 'management.read', managementactivities: 'management.read', managementactivity: 'management.read', managementrelease: 'management.read', managementfinance:'finance.read', managementoperations: 'operations.read', managementchanges: 'management.read', players: 'analytics', testers: 'testers', familycode: 'family', album: 'family', publish: 'publish' };
const canSee = k => k === 'home' || k === 'admins' ? true : OWNER_ONLY.includes(k) ? ROLE() === 'owner' : CAN(PAGE_NEEDS[k] || 'pages');
const SEC = () => SECTIONS.map(x => ({ ...x, pages: x.pages.filter(k => (INFO && INFO.online || !ONLINE_ONLY.includes(k)) && (!INFO?.managementOnly || k.startsWith('management') || ['admins','security','accesslog'].includes(k)) && canSee(k)) })).filter(x => x.pages.length && (x.k !== 'home' || CAN('pages')));
// each page: its picture, its name and one line saying what it is for
const ABOUT = {
  management: ['📊', 'Management overview', 'Tổng quan quản lý', 'Audience, play, experience and reporting quality', 'Người chơi, hoạt động, trải nghiệm và chất lượng báo cáo'],
  managementdevices: ['📱', 'Device reporting', 'Báo cáo thiết bị', 'Reporting installations and play history', 'Bản cài đặt gửi báo cáo và lịch sử chơi'],
  managementchildren: ['👧', 'Children and devices', 'Các con và thiết bị', 'Reported child names linked to each installation', 'Tên bé được báo cáo gắn với từng bản cài đặt'],
  managementdevice: ['📱', 'Device detail', 'Chi tiết thiết bị', '', ''],
  managementattention: ['🐞', 'Needs attention', 'Cần xem xét', 'Evidence from tester reports', 'Bằng chứng từ báo cáo người thử'],
  managementactivities: ['🎮', 'Activity catalogue', 'Danh mục hoạt động', 'Game and website source facts', 'Thông tin nguồn game và trang web'],
  managementactivity: ['🎮', 'Activity detail', 'Chi tiết hoạt động', '', ''],
  managementrelease: ['🆕', 'Release evidence', 'Bằng chứng phát hành', 'Reporting by originating build', 'Báo cáo theo phiên bản phát sinh'],
  managementoperations: ['🌐', 'Operations', 'Vận hành', 'Provider configuration and verified observations', 'Cấu hình nhà cung cấp và quan sát đã xác minh'],
  managementfinance: ['📊','Finance','Tài chính','Private ledger, budgets and financial evidence','Sổ riêng, ngân sách và bằng chứng tài chính'],
  managementchanges: ['📜', 'Configuration changes', 'Thay đổi cấu hình', 'Revisioned controls and device acknowledgements', 'Điều khiển theo phiên bản và xác nhận từ thiết bị'],
  home: ['🏠', 'Home', 'Trang chính', '', ''],
  message: ['💌', 'Message', 'Lời nhắn', 'A note the children see when they start playing', 'Lời nhắn các con thấy khi bắt đầu chơi'],
  missions: ['📝', 'Family missions', 'Nhiệm vụ gia đình', 'Real-life jobs the children see in the game (“Help set the table”); a grown-up ticks them on the device', 'Việc ngoài đời các con thấy trong game (“Giúp dọn bàn ăn”); người lớn đánh dấu trên máy'],
  children: ['👧', 'Children', 'Các con', 'Each child’s name, age, photo and progress', 'Tên, tuổi, ảnh và tiến bộ của từng con'],
  album: ['📸', 'Family album', 'Album gia đình', 'Family photos that arrive as postcards in the game', 'Ảnh gia đình đến thành bưu thiếp trong game'],
  quiz: ['💛', 'Family quiz', 'Đố vui gia đình', 'Shared questions for players of this site', 'Câu hỏi chung cho người chơi trang này'],
  stories: ['📖', 'Our stories', 'Truyện nhà mình', 'Write the family’s own picture stories', 'Viết truyện tranh của gia đình'],
  villagers: ['🧑', 'Villagers', 'Nhân vật', 'Names and photo faces of the people in the valley', 'Tên và ảnh khuôn mặt của mọi người trong thung lũng'],
  familycode: ['🔒', 'Family code', 'Mã gia đình', 'Family photos are private: type this code once on each child’s device', 'Ảnh gia đình được giữ riêng: gõ mã này một lần trên máy của mỗi con'],
  releases: ['🆕', 'Releases', 'Ra mắt', 'Switch features on or off, start them on a day, for so many days, with a New badge', 'Bật tắt tính năng, cho ra mắt vào ngày nào, trong bao lâu, có nhãn Mới'],
  lab: ['🐞', 'Sparkle Lab', 'Phòng thử Sparkle', 'Tester reports and automatic checks, with controls for each device', 'Báo lỗi và tự kiểm tra, với điều khiển cho từng máy'],
  looks: ['🎭', 'Story characters', 'Nhân vật trong truyện', 'How Chi, Jack and Ruby look in the lantern story (chapter 3, Sydney)', 'Chi, Jack và Ruby trông thế nào trong truyện đèn lồng (chương 3, Sydney)'],
  plots: ['🏘️', 'Memory Villages', 'Làng Kỷ Niệm', 'Put the homes you remember on the garden plots in the valley', 'Đặt những ngôi nhà bạn nhớ lên các mảnh vườn trong thung lũng'],
  festivals: ['📅', 'Festivals', 'Lễ hội', 'This year’s festivals: switch one off, move a date, change how early it decorates', 'Lễ hội năm nay: tắt, đổi ngày, đổi thời gian trang trí trước'],
  path: ['🧸', 'Simple screen', 'Màn hình đơn giản', 'Which games under-5s see, and in which area', 'Bé dưới 5 tuổi thấy trò nào, ở khu nào'],
  music: ['🎵', 'Music', 'Âm nhạc', 'Your own recordings: lullabies, Tết and Trung Thu songs, village songs', 'Bản ghi của nhà mình: hát ru, nhạc Tết, Trung Thu, làng quê'],
  map: ['🗺️', 'Map and building', 'Bản đồ & xây dựng', 'Move, add or remove buildings and land', 'Di chuyển, thêm hoặc bỏ nhà và đất'],
  photos: ['📷', 'Real photos', 'Ảnh thật', 'Real photos of the landmarks', 'Ảnh thật của các địa danh'],
  play: ['⏰', 'Defaults for every device', 'Mặc định cho mọi máy', 'Rest reminder, language, captions, music, and things in the valley', 'Nhắc nghỉ, ngôn ngữ, phụ đề, nhạc, và đồ vật trong thung lũng'],
  voices: ['🎙️', 'Voices', 'Giọng đọc', 'Recordings for new lines, and the children’s inbox', 'Bản ghi cho câu mới, và hộp thư của các con'],
  ads: ['📣', 'Ads (off)', 'Quảng cáo (tắt)', 'Your own ads; nothing shows unless you turn them on', 'Quảng cáo của bạn; không hiện gì trừ khi bật'],
  players: ['📊', 'Analytics', 'Phân tích', '', ''],
  testers: ['🐞', 'Tester reports', 'Báo cáo người thử', 'What tester devices found: each problem, how often, where, and whether it is fixed', 'Những gì máy thử tìm ra: từng lỗi, bao nhiêu lần, ở đâu, đã sửa chưa'],
  publish: ['🚀', 'Publish', 'Phát hành', 'Send your saved changes to the children’s devices', 'Gửi thay đổi đã lưu tới máy của các con'],
  site: ['🌐', 'Website', 'Trang web', 'The game’s website: updates and GitHub', 'Trang web của game: cập nhật và GitHub'],
  check: ['🩺', 'Check', 'Kiểm tra', 'Is everything set up and working?', 'Mọi thứ đã cài đặt và chạy tốt chưa?'],
  settings: ['🔑', 'Settings', 'Cài đặt', 'Keys, the game folder, signing out', 'Khóa, thư mục game, đăng xuất'],
  admins: ['👥', 'Admins', 'Quản trị viên', 'Other grown-ups sign in with their own name and password', 'Người lớn khác đăng nhập bằng tên và mật khẩu riêng'],
  security: ['🛡️', 'Security', 'Bảo mật', 'Two-step sign-in, sign everyone out, keys for SparkleStudio.exe', 'Đăng nhập hai bước, đăng xuất mọi người, khóa cho SparkleStudio.exe'],
  accesslog: ['📜', 'Access log', 'Nhật ký truy cập', 'Who signed in, from where, and who opened the Analytics', 'Ai đã đăng nhập, từ đâu, và ai đã mở Phân tích']
};
const sectionOf = k => SEC().find(x => x.k === k || x.pages.includes(k)) || SEC()[0];
// #family → the Family cards; #family/quiz (or the old #quiz) → that page
const route = () => { const h = location.hash.slice(1).split('?')[0], [a, b] = h.split('/'); if (b && ABOUT[b]) return b; if (ABOUT[a] || SECTIONS.some(x => x.k === a)) return a; return 'home'; };
let cur = route();
const go = k => { if (k === cur || !leaveOk()) return; cur = k; const sec = sectionOf(k); location.hash = sec.k === k || sec.pages.length === 1 ? sec.k : sec.k + '/' + k; render(); };
// the bar at the top: Publish when something is waiting, reload, language
function head() {
  const pub = $('#pub'); if (!pub) return;
  pub.hidden = !(INFO && INFO.unpublished) || !CAN('publish'); pub.textContent = '🚀 ' + T('Publish', 'Phát hành') + (INFO && INFO.waiting ? ` (${INFO.waiting})` : '');
}
function nav() {
  const sec = sectionOf(cur);
  $('#tabs').innerHTML = SEC().map(x => `<button data-k="${x.k}" class="${x === sec ? 'on' : ''}"><span>${x.i}</span><small>${T(x.en, x.vi)}</small></button>`).join('');
  $('#tabs').querySelectorAll<HTMLInputElement>('button').forEach(b => b.onclick = () => go(b.dataset.k));
  document.querySelectorAll<HTMLInputElement>('[data-t]').forEach(e => { const [en, vi] = e.dataset.t.split('|'); e.textContent = T(en, vi); });
  document.querySelectorAll<HTMLInputElement>('.lang button[data-l]').forEach(b => { b.classList.toggle('on', b.dataset.l === LANG); b.onclick = () => { if (b.dataset.l === LANG || !leaveOk()) return; LANG = b.dataset.l; localStorage.setItem('studioLang', LANG); render(); }; });
  if ($('#pub')) $('#pub').onclick = () => go('publish');
  if ($('#reload')) $('#reload').onclick = () => { if (leaveOk()) render(true); };
  head();
}
// the status and the family's content are fetched once and kept while you move between pages (round K: online, every
// tab used to ask GitHub again); they are fetched again after Publish, after signing in, and with ↻
let LOADED = false;
async function load(force) {
  if (force) SRC = null; // ↻ reads the game's files again (the Voices page keeps them while Studio is open)
  if (LOADED && !force) return;
  if (!DEVNAME) DEVNAME = await import(GAME + 'js/content/devname.js').catch(() => null);
  INFO = await api('info'); document.body.classList.toggle('online', !!INFO.online);
  CONTENT = INFO.ok && !INFO.managementOnly ? await api('content') : {};
  // (r81) what the devices really get: the content pages' live sections win over custom.json
  if (INFO.ok && !INFO.managementOnly && liveOn()) { try { const L = await api('live/content'); for (const [k, v] of Object.entries((L && L.content) || {})) if (v && typeof v === 'object') CONTENT[k] = v; } catch (e) { } }
  LOADED = true;
}
const drawSection = (P, sec) => {
  P.innerHTML = `<h2>${sec.i} ${T(sec.en, sec.vi)}</h2><div class="cards">${sec.pages.map(k => { const [i, en, vi, den, dvi] = ABOUT[k];
    return `<button class="pcard" data-p="${k}"><span class="pi">${i}</span><b>${T(en, vi)}</b><small>${T(den, dvi)}</small></button>`; }).join('')}</div>`;
  P.querySelectorAll('.pcard').forEach(b => b.onclick = () => go(b.dataset.p));
};
let renderSequence = 0;
async function render(force?: boolean) {
  const sequence = ++renderSequence;
  nav(); const P = $('#page'), crumb = $('#crumb'); P.dataset.render = String(sequence); DIRTY = false; KEPT = ''; if (SAVED_HERE !== cur) SAVED_HERE = '';
  if (!LOADED || force) P.innerHTML = `<div class="loading">✨ ${T('Loading…', 'Đang tải…')}</div>`;
  try {
    await load(force); if (sequence !== renderSequence) return;
    if (INFO.perms) Object.values(INFO.perms).forEach(([, en, vi]) => { PERM_VI[en] = vi; });
    if (!SEC().some(x => x.k === cur || x.pages.includes(cur))) { cur = (SEC()[0] || { pages: ['admins'] }).pages[0]; nav(); }
    else if (!INFO.ok && cur !== 'settings') { cur = 'settings'; nav(); toast(T('First, choose the game folder.', 'Trước tiên, chọn thư mục game.')); }
    head();
    const sec = sectionOf(cur);
    // (owner, 12 Oct) the Analytics tab still opens Analytics itself (its section also holds the Tester reports page)
    if (sec.k === cur && sec.pages.length > 1 && !ABOUT[sec.k]) { crumb.innerHTML = ''; drawSection(P, sec); KEPT = contentNow(); HASH = location.hash; window.scrollTo(0, 0); return; }
    crumb.innerHTML = sec.pages.length > 1 && cur !== sec.k ? `<button class="back">← ${sec.i} ${T(sec.en, sec.vi)}</button>` : '';
    if (crumb.firstElementChild instanceof HTMLElement) crumb.firstElementChild.onclick = () => go(sec.k);
    const page = cur; await PAGES[page](P); if (sequence !== renderSequence || cur !== page) return; explainPage(P, cur); foldPage(P, cur); refold(P, page); KEPT = contentNow(); HASH = location.hash; paintState(); window.scrollTo(0, 0);
  } catch (e) { if (sequence === renderSequence && !e.signin) P.innerHTML = `<div class="card badtxt">${esc(e.message)}</div>`; }
}

// (owner, 13 Oct AEDT: "each of the functions and within each all the categories should be collapsible") every part of
// a page opens and closes by its heading: a heading on the page with what follows it, and each card with a heading; a
// small arrow shows which way, and Studio remembers what you closed (on this browser). Everything starts open.
const FOLD_KEY = 'studioFolds';
const folds = () => { try { return JSON.parse(localStorage.getItem(FOLD_KEY) || '{}'); } catch (e) { return {}; } };
const keepFold = (k, open) => { const f = folds(); if (open) delete f[k]; else f[k] = 1; try { localStorage.setItem(FOLD_KEY, JSON.stringify(f)); } catch (e) { } };
// (point 34, 15 Oct AEDT) parts a page draws later (a list that loads, a redrawn card) fold too, once they appear
let refolder = null;
function refold(P, page) {
  if (refolder) refolder.disconnect();
  let queued = false;
  refolder = new MutationObserver(() => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; if (cur !== page) return; refolder.disconnect(); foldPage(P, page); refolder.observe(P, { childList: true, subtree: true }); }); });
  refolder.observe(P, { childList: true, subtree: true });
}
function foldPage(P, page) {
  const closed = folds(), key = h => page + ':' + h.textContent.trim().slice(0, 60);
  // Explicit overview panels use the same persistent fold store as automatically grouped cards.
  const explicit=P.querySelectorAll('details[data-fold-id]') as NodeListOf<HTMLDetailsElement>;
  explicit.forEach(d=>{if(d.dataset.foldBound)return;d.dataset.foldBound='1';const k=page+':'+d.dataset.foldId;d.open=!closed[k];d.addEventListener('toggle',()=>keepFold(k,d.open));});
  const make = (head, nodes, cls) => { if (!nodes.length) return; const d = document.createElement('details'), sm = document.createElement('summary'); d.className = 'fold ' + cls; d.open = !closed[key(head)];
    head.parentNode.insertBefore(d, head); sm.appendChild(head); d.appendChild(sm); nodes.forEach(n => d.appendChild(n)); const k = key(head); d.addEventListener('toggle', () => keepFold(k, d.open)); };
  // each card with a heading (not the ones that open and close already)
  // (a card whose first row holds its heading, e.g. a story character's picture and name: that row is the summary)
  P.querySelectorAll('.card').forEach(c => { if (c.closest('details') || c.matches('details, .stat, .signin, .pcard') || c.querySelector(':scope > details.fold')) return; let h = c.firstElementChild;
    // A status badge may precede a management card's heading. Keep that badge visible
    // and fold the heading with its following content, without moving form controls twice.
    if (!h || !(/^H[34]$/.test(h.tagName) || (h.querySelector('h3, h4') && c.children.length > 1))) h = c.querySelector(':scope > h3, :scope > h4');
    if (!h) return;
    const children = [...c.childNodes]; make(h, children.slice(children.indexOf(h) + 1), 'card-fold'); });
  // a heading on the page itself, with everything up to the next heading of the same size
  [...P.children].filter(e => /^H3$/.test(e.tagName)).forEach(h => { const nodes = []; let n = h.nextSibling; while (n && !(n.nodeType === 1 && /^H[23]$/.test(n.tagName))) { nodes.push(n); n = n.nextSibling; } make(h, nodes, 'part-fold'); });
}
// (r81) under each page's title: "Live" (the devices get it at once) or "Needs Publish", in both languages
const PUBLISH_PAGES = ['music', 'map'];
function liveBadge(P, page) {
  if (!(LIVE_PAGES[page] || PUBLISH_PAGES.includes(page)) || P.querySelector('.livebadge')) return;
  const live = !!LIVE_PAGES[page] && liveOn(), d = document.createElement('div'); d.className = 'card livenote livebadge'; d.dataset.live = live ? '1' : '0';
  d.innerHTML = `<p class="${live ? 'ok' : 'note'}">${live ? '⚡ ' + T('Live: devices get it the next time they open the game (about 30 seconds). No Publish needed.', 'Có hiệu lực ngay: các máy nhận được khi mở game lần tới (khoảng 30 giây). Không cần Phát hành.') + (page === 'ads' ? ' ' + T('A new picture still needs Publish.', 'Hình mới vẫn cần Phát hành.') : '')
    : '✏️ ' + T('Needs Publish: Save keeps it with the family’s files; press Publish afterwards to send it to the children.', 'Cần Phát hành: Lưu giữ cùng tệp của gia đình; sau đó bấm Phát hành để gửi tới các con.') + (LIVE_PAGES[page] ? ' ' + T('To make it live at once, put the website and a Studio key in Settings.', 'Để có hiệu lực ngay, hãy điền trang web và khóa Studio trong Cài đặt.') : '')}</p>`;
  const h = P.querySelector('h2'), at = h && h.nextElementSibling && h.nextElementSibling.matches('.sub') ? h.nextElementSibling : h; if (at) at.after(d); else P.prepend(d);
}
function explainPage(P, page) {
  if (P.querySelector('.studio-help')) return;
  const explanations = {
    management: ['Private reporting for authorised administrators. The default period is 30 days of ordinary reporting devices. Missing evidence stays unavailable; opening this page changes no game settings.', 'Báo cáo riêng cho quản trị viên được phép. Mặc định xem 30 ngày từ máy báo cáo thông thường. Thiếu bằng chứng được ghi chưa có; mở trang không đổi cài đặt game.'],
    managementdevices: ['Browse reporting installations and their reported children. Default filters cover 30 days of ordinary traffic. Analytics and name-reporting choices on each device limit what is available here; this page changes no saves.', 'Xem bản cài đặt gửi báo cáo và các con được báo cáo. Mặc định lọc 30 ngày báo cáo thông thường. Lựa chọn Phân tích và báo tên trên từng máy giới hạn dữ liệu ở đây; trang không sửa bản lưu.'],
    managementchildren: ['Find reported child first names with their device. The same name on two devices is not proof of one person. Default filters cover 30 days of ordinary traffic; a device that declines name reporting stays unnamed.', 'Tìm tên bé được báo cáo cùng máy tương ứng. Trùng tên trên hai máy không chứng minh là một người. Mặc định xem 30 ngày báo cáo thông thường; máy không cho báo tên sẽ không hiện tên.'],
    managementdevice: ['Inspect the selected reporting installation and its reported activity. The default period is 30 days. Names require device-detail permission and the device’s reporting consent; opening this view changes no local progress.', 'Xem bản cài đặt đã chọn và hoạt động được báo cáo. Mặc định xem 30 ngày. Tên cần quyền chi tiết thiết bị và sự đồng ý báo cáo trên máy; mở trang không đổi tiến trình trên máy.'],
    managementattention: ['Review tester evidence and assign an owner or next action. Reports are not automatically verified bugs. Saving a permitted follow-up records a revision and audit immediately; it does not deploy a fix or change a child’s save.', 'Xem bằng chứng người thử, giao người phụ trách và bước tiếp theo. Báo cáo chưa tự thành lỗi đã xác minh. Lưu theo dõi được phép ghi phiên bản và nhật ký ngay; không triển khai bản sửa hay đổi bản lưu của bé.'],
    managementactivities: ['Browse stable game and story IDs, source facts and available reporting evidence. Defaults cover ordinary traffic over 30 days. A catalogue entry does not prove that a recording exists or that every device has applied availability rules.', 'Xem mã trò và truyện ổn định, thông tin nguồn và bằng chứng báo cáo. Mặc định xem báo cáo thông thường trong 30 ngày. Có trong danh mục không chứng minh có bản thu hay mọi máy đã áp dụng quy tắc mở.'],
    managementactivity: ['Inspect one activity’s source, availability and reported outcomes for the selected period. Missing measurements remain unknown. This read-only view links to evidence and does not edit or release the activity.', 'Xem nguồn, trạng thái mở và kết quả được báo cáo của một hoạt động trong kỳ đã chọn. Thiếu số liệu vẫn là chưa rõ. Trang chỉ đọc dẫn tới bằng chứng, không sửa hay phát hành hoạt động.'],
    managementrelease: ['Enter a build to inspect deployment and reporting evidence. No build is selected by default. Observed provider results and device acknowledgements are distinct; opening this view never deploys or changes a release version.', 'Nhập phiên bản để xem bằng chứng triển khai và báo cáo. Mặc định chưa chọn phiên bản. Kết quả nhà cung cấp và xác nhận từ máy là riêng biệt; mở trang không triển khai hay đổi số phiên bản.'],
    managementoperations: ['Review configured provider feeds and their last verified observations. Missing access stays unavailable. Bounded operations require permission, a reason and confirmation; a saved request is not proof that the provider completed it.', 'Xem nguồn nhà cung cấp được cấu hình và quan sát đã xác minh gần nhất. Thiếu quyền truy cập được ghi chưa có. Tác vụ giới hạn cần quyền, lý do và xác nhận; lưu yêu cầu không chứng minh nhà cung cấp đã hoàn tất.'],
    managementfinance: ['Private manual ledger for administrators with explicit finance permission. Setup is required before the first entry. Preview writes nothing; confirmation saves reviewed rows with audit history. Missing invoices or FX leave totals incomplete, and this ledger makes no payments.', 'Sổ nhập thủ công riêng cho quản trị viên có quyền tài chính rõ ràng. Cần thiết lập trước bản ghi đầu. Xem trước không ghi gì; xác nhận lưu dòng đã duyệt cùng lịch sử. Thiếu hóa đơn hoặc tỷ giá làm tổng chưa đủ; sổ không thanh toán.'],
    managementchanges: ['Inspect configuration versions and device receipts. Saving an authorised advanced edit records a revision immediately; publication and device application are separate. Default scope is global, and no action here rewrites children’s saved progress.', 'Xem phiên bản cấu hình và biên nhận từ máy. Lưu sửa nâng cao được phép ghi phiên bản ngay; xuất bản và máy áp dụng là riêng. Mặc định áp dụng toàn cục; không thao tác nào ở đây ghi lại tiến trình đã lưu của các con.'],
    home: ['The start page: what is waiting to publish, quick links to every section and the game itself. Nothing here changes the game on its own.', 'Trang đầu: những gì đang chờ phát hành, lối tắt tới từng mục và chính trò chơi. Không có gì ở đây tự thay đổi game.'],
    message: ['One family message for every child, shown and read aloud once a day when they start playing. Empty means no message. Save puts your change in “Waiting to publish”; nothing reaches the children until you press Publish. Then every device of this family gets it the next time it opens the game online.', 'Một lời nhắn cho mọi con, hiện và đọc to mỗi ngày một lần khi bắt đầu chơi. Để trống là không có lời nhắn. Lưu đưa thay đổi vào “Đang chờ phát hành”; các con chưa thấy gì cho đến khi bạn bấm Phát hành. Sau đó mọi máy của gia đình nhận được khi mở game có mạng lần tới.'],
    missions: ['Real-life jobs for every child on this family\'s devices (up to 12); none by default. A grown-up confirms each one on the device, which gives coins and a sticker. Save puts your change in “Waiting to publish”; nothing reaches the children until you press Publish. Then every device of this family gets it the next time it opens the game online.', 'Việc thật ngoài đời cho mọi con trên các máy của gia đình (tối đa 12); mặc định không có. Người lớn xác nhận từng việc trên máy, con được xu và hình dán. Lưu đưa thay đổi vào “Đang chờ phát hành”; các con chưa thấy gì cho đến khi bạn bấm Phát hành. Sau đó mọi máy của gia đình nhận được khi mở game có mạng lần tới.'],
    villagers: ['Names and photo faces for villagers, on every device of this family. By default each villager keeps the game\'s own name and drawn face; a change made on a device itself still wins on that device. Save puts your change in “Waiting to publish”; nothing reaches the children until you press Publish. Then every device of this family gets it the next time it opens the game online.', 'Tên và ảnh mặt cho dân làng, trên mọi máy của gia đình. Mặc định mỗi người giữ tên và mặt vẽ của game; thay đổi làm ngay trên một máy vẫn được ưu tiên ở máy đó. Lưu đưa thay đổi vào “Đang chờ phát hành”; các con chưa thấy gì cho đến khi bạn bấm Phát hành. Sau đó mọi máy của gia đình nhận được khi mở game có mạng lần tới.'],
    stories: ['Your own picture stories on every child\'s Stories shelf, read aloud page by page; none by default. Save puts your change in “Waiting to publish”; nothing reaches the children until you press Publish. Then every device of this family gets it the next time it opens the game online.', 'Truyện tranh của gia đình trên kệ Truyện của mọi con, đọc to từng trang; mặc định không có. Lưu đưa thay đổi vào “Đang chờ phát hành”; các con chưa thấy gì cho đến khi bạn bấm Phát hành. Sau đó mọi máy của gia đình nhận được khi mở game có mạng lần tới.'],
    quiz: ['Studio manages shared quiz content for this deployment. Do not enter private family details here. Use Grown-ups → Family questions in the game for questions kept on your device and in its save copy. Shared Studio changes follow the displayed Live or Publish status.', 'Studio quản lý câu đố chung của bản triển khai này. Không nhập thông tin riêng của gia đình ở đây. Dùng Phụ huynh → Câu hỏi gia đình trong game để giữ câu hỏi trên máy và trong bản sao lưu. Thay đổi chung trong Studio theo trạng thái Có hiệu lực ngay hoặc Cần phát hành được hiển thị.'],
    path: ['Which games the Simple screen shows in each area, for every child on this family\'s devices. By default every game is in its own area; hiding one here leaves it in the valley. Save puts your change in “Waiting to publish”; nothing reaches the children until you press Publish. Then every device of this family gets it the next time it opens the game online.', 'Trò nào hiện ở từng khu của màn hình Đơn giản, cho mọi con trên các máy của gia đình. Mặc định mỗi trò ở khu riêng của nó; ẩn ở đây thì trò vẫn còn trong thung lũng. Lưu đưa thay đổi vào “Đang chờ phát hành”; các con chưa thấy gì cho đến khi bạn bấm Phát hành. Sau đó mọi máy của gia đình nhận được khi mở game có mạng lần tới.'],
    music: ['Your own recordings (MP3, up to 4 MB) used instead of the built-in tune where you tick, on every device of this family; by default the game\'s own music plays. Save puts your change in “Waiting to publish”; nothing reaches the children until you press Publish. Then every device of this family gets it the next time it opens the game online.', 'Bản thu của gia đình (MP3, tối đa 4 MB) thay cho nhạc có sẵn ở chỗ bạn đánh dấu, trên mọi máy của gia đình; mặc định phát nhạc của game. Lưu đưa thay đổi vào “Đang chờ phát hành”; các con chưa thấy gì cho đến khi bạn bấm Phát hành. Sau đó mọi máy của gia đình nhận được khi mở game có mạng lần tới.'],
    album: ['Family photos that become postcards in the children\'s albums when they walk into the place you choose; none by default. Photos are private (see Family code). Save puts your change in “Waiting to publish”; nothing reaches the children until you press Publish. Then every device of this family gets it the next time it opens the game online.', 'Ảnh gia đình thành bưu thiếp trong album của các con khi đi vào nơi bạn chọn; mặc định không có. Ảnh là riêng tư (xem Mã gia đình). Lưu đưa thay đổi vào “Đang chờ phát hành”; các con chưa thấy gì cho đến khi bạn bấm Phát hành. Sau đó mọi máy của gia đình nhận được khi mở game có mạng lần tới.'],
    ads: ['Your own ads, OFF by default and for every device of this family when switched on. Save puts your change in “Waiting to publish”; nothing reaches the children until you press Publish. Then every device of this family gets it the next time it opens the game online.', 'Quảng cáo của gia đình, mặc định TẮT, và áp dụng cho mọi máy khi bật. Lưu đưa thay đổi vào “Đang chờ phát hành”; các con chưa thấy gì cho đến khi bạn bấm Phát hành. Sau đó mọi máy của gia đình nhận được khi mở game có mạng lần tới.'],
    looks: ['How three story characters look in chapter 3, on every device; “Back to the usual” returns the look the story was made with (the default). Save puts your change in “Waiting to publish”; nothing reaches the children until you press Publish. Then every device of this family gets it the next time it opens the game online.', 'Ba nhân vật trong chương 3 trông thế nào, trên mọi máy; “Về như cũ” trả lại vẻ ngoài gốc của truyện (mặc định). Lưu đưa thay đổi vào “Đang chờ phát hành”; các con chưa thấy gì cho đến khi bạn bấm Phát hành. Sau đó mọi máy của gia đình nhận được khi mở game có mạng lần tới.'],
    plots: ['Remembered homes on the garden plots, on every device of this family; plots are empty by default. Save puts your change in “Waiting to publish”; nothing reaches the children until you press Publish. Then every device of this family gets it the next time it opens the game online.', 'Những ngôi nhà kỷ niệm trên các mảnh vườn, trên mọi máy của gia đình; mặc định các mảnh trống. Lưu đưa thay đổi vào “Đang chờ phát hành”; các con chưa thấy gì cho đến khi bạn bấm Phát hành. Sau đó mọi máy của gia đình nhận được khi mở game có mạng lần tới.'],
    map: ['Villagers, buildings and land you add, move or remove, on every device of this family; the valley as made is the default. Edits made for an older map layout are kept aside, never placed at the wrong spot. Save puts your change in “Waiting to publish”; nothing reaches the children until you press Publish. Then every device of this family gets it the next time it opens the game online.', 'Dân làng, nhà và đất bạn thêm, dời hay bỏ, trên mọi máy của gia đình; mặc định là thung lũng như đã làm. Thay đổi cho bản đồ cũ được để riêng, không bao giờ đặt sai chỗ. Lưu đưa thay đổi vào “Đang chờ phát hành”; các con chưa thấy gì cho đến khi bạn bấm Phát hành. Sau đó mọi máy của gia đình nhận được khi mở game có mạng lần tới.'],
    play: ['Starting values for every child\'s device: rest reminder, language, captions, music and things in the valley. Empty means the game\'s own default; a grown-up can still change a value on a device. Save puts your change in “Waiting to publish”; nothing reaches the children until you press Publish. Then every device of this family gets it the next time it opens the game online.', 'Giá trị ban đầu cho máy của mọi con: nhắc nghỉ, ngôn ngữ, phụ đề, nhạc và những thứ trong thung lũng. Để trống là mặc định của game; người lớn vẫn có thể đổi trên từng máy. Lưu đưa thay đổi vào “Đang chờ phát hành”; các con chưa thấy gì cho đến khi bạn bấm Phát hành. Sau đó mọi máy của gia đình nhận được khi mở game có mạng lần tới.'],
    familycode: ['The code a device types once to see the family\'s private photos; every photo request carries it. Making a new code takes effect at once: devices still using the old code stop getting photos until a grown-up types the new one.', 'Mã mà một máy gõ một lần để xem ảnh riêng của gia đình; mọi lần tải ảnh đều kèm mã. Tạo mã mới có hiệu lực ngay: máy còn dùng mã cũ sẽ không nhận ảnh cho đến khi người lớn gõ mã mới.'],
    festivals: ['Which festivals run and how much they decorate (5x by default), for every device. Online, Save is live at once with no Publish: devices get it the next time they open the game. On the family\'s computer (SparkleStudio.exe) Save goes into the content and needs Publish.', 'Lễ hội nào diễn ra và trang trí nhiều hay ít (mặc định 5x), cho mọi máy. Trực tuyến, Lưu có hiệu lực ngay, không cần Phát hành: máy nhận được khi mở game lần tới. Trên máy tính gia đình (SparkleStudio.exe), Lưu vào nội dung và cần Phát hành.'],
    children: ['Works on a backup file you open here, from one device: nothing is sent online and no other device changes. Save a new backup, then open it on that device to apply it.', 'Làm việc trên tệp sao lưu bạn mở ở đây, từ một máy: không gửi gì lên mạng và không máy nào khác bị đổi. Lưu bản sao lưu mới rồi mở trên máy đó để áp dụng.'],
    voices: ['Recordings for lines that have none yet, and the lines children\'s devices said with the machine voice. A new recording reaches devices with the next voice pack; until then the device\'s own voice reads the line.', 'Bản thu cho các câu chưa có, và các câu máy của các con đã đọc bằng giọng máy. Bản thu mới tới các máy theo gói giọng kế tiếp; trước đó máy tự đọc bằng giọng của nó.'],
    photos: ['Photos of real places from open sources, with who took them and the licence, saved into the game so children see them offline. Runs on this computer; Publish sends them to every device. Under each photo: who took it and its licence. ✕ takes off a photo that is not of this place, and it will not be fetched again.', 'Ảnh nơi có thật từ nguồn mở, kèm tác giả và giấy phép, lưu vào game để các con xem cả khi không có mạng. Chạy trên máy tính này; Phát hành để gửi tới mọi máy. Dưới mỗi ảnh: người chụp và giấy phép. ✕ bỏ ảnh không đúng nơi này, và ảnh sẽ không được tải lại.'],
    testers: ['Problems reported by tester devices, each once however often it was met. Changing a status is saved at once; a tester device sees “fixed” the next time it checks in and replays the problem on the new version.', 'Lỗi do máy thử báo, mỗi lỗi một lần dù gặp bao nhiêu lần. Đổi trạng thái được lưu ngay; máy thử thấy “đã sửa” ở lần kết nối kế tiếp và chạy lại lỗi trên phiên bản mới.'],
    publish: ['Sends everything in “Waiting to publish” to the website, and so to every device the next time it opens the game. Discard drops waiting changes instead. Nothing here changes what is already published until you press Publish.', 'Gửi mọi thứ trong “Đang chờ phát hành” lên trang web, và tới mọi máy khi mở game lần tới. Bỏ sẽ xóa các thay đổi đang chờ. Không gì ở đây đổi bản đã phát hành cho đến khi bạn bấm Phát hành.'],
    site: ['What is live on Netlify and what changed on GitHub. Rebuild and Restore change the live website for every device as soon as Netlify finishes; reading this page changes nothing.', 'Bản đang chạy trên Netlify và những gì đổi trên GitHub. Dựng lại và Khôi phục đổi trang web đang chạy cho mọi máy ngay khi Netlify xong; chỉ xem trang này thì không đổi gì.'],
    check: ['Tests whether keys, the game folder and the website answer. It only reads: nothing is changed.', 'Kiểm tra khóa, thư mục game và trang web có trả lời không. Chỉ đọc: không thay đổi gì.'],
    settings: ['Keys and the game folder for this Studio. Online, the keys live in Netlify\'s settings and are never shown or kept here; on the family\'s computer they apply to SparkleStudio.exe as soon as you save.', 'Khóa và thư mục game cho Studio này. Trực tuyến, khóa nằm trong cài đặt Netlify, không bao giờ hiện hay lưu ở đây; trên máy tính gia đình, khóa áp dụng cho SparkleStudio.exe ngay khi lưu.'],
    security: ['Two-step sign-in, trusted browsers, signing everyone out and keys for SparkleStudio.exe. Each change applies at once; signing everyone out ends every Studio session, yours included.', 'Đăng nhập hai bước, trình duyệt tin cậy, đăng xuất mọi người và khóa cho SparkleStudio.exe. Mỗi thay đổi có hiệu lực ngay; đăng xuất mọi người kết thúc mọi phiên Studio, kể cả của bạn.'],
    accesslog: ['The last 200 sign-ins and Analytics views, with town and country only (the connection address is never kept). Reading it changes nothing.', '200 lần đăng nhập và xem Phân tích gần nhất, chỉ có thành phố và quốc gia (không bao giờ giữ địa chỉ kết nối). Xem không thay đổi gì.'],
    releases: ['These switches control game features. Dates and durations schedule availability. Testing controls are in Sparkle Lab. Save applies the rules online; connected games receive them when they refresh their settings.', 'Công tắc điều khiển tính năng game. Ngày và thời hạn đặt lịch mở. Điều khiển thử nghiệm nằm trong Phòng thử Sparkle. Lưu áp dụng quy tắc trên mạng; game nhận khi làm mới cài đặt.'],
    lab: ['Tester and automatic checks apply to the selected devices; none selected means every device while enabled. Each device keeps its own progress policy. Save applies these rules online when connected games refresh their settings.', 'Báo lỗi và tự kiểm tra áp dụng cho các máy đã chọn; không chọn máy nào nghĩa là mọi máy khi bật. Mỗi máy giữ chính sách tiến trình riêng. Lưu áp dụng quy tắc trên mạng khi game làm mới cài đặt.'],
    admins: ['Choose a role or Custom to select each permission. Changes here save immediately. Permissions control what an admin can read or change; hiding a button does not grant or remove access.', 'Chọn vai trò hoặc Tùy chỉnh để chọn từng quyền. Thay đổi ở đây lưu ngay. Quyền quyết định quản trị viên có thể xem hay sửa gì; ẩn nút không cấp hoặc bỏ quyền.'],
    players: ['Measurements come from reporting devices. Missing data means unavailable or not measured yet. Use Performance to compare loading, frame smoothness and battery for each device.', 'Số liệu do các máy gửi về. Thiếu số liệu nghĩa là không có hoặc chưa đo. Dùng Hiệu năng để so tải, độ mượt và pin từng máy.']
  };
  const purpose = ABOUT[page]?.slice(3, 5);
  const text = [...(explanations[page] || (purpose?.[0] ? purpose : ['Use the labelled controls to open a section. Expand headings for details. Changes apply only through the action shown on each control.', 'Dùng các nút có nhãn để mở mục. Mở tiêu đề để xem chi tiết. Thay đổi chỉ áp dụng qua thao tác ghi trên từng nút.']))];
  const S_PUB = ['Save puts your change in “Waiting to publish”; nothing reaches the children until you press Publish. Then every device of this family gets it the next time it opens the game online.', 'Lưu đưa thay đổi vào “Đang chờ phát hành”; các con chưa thấy gì cho đến khi bạn bấm Phát hành. Sau đó mọi máy của gia đình nhận được khi mở game có mạng lần tới.'];
  const S_LIVE = ['Save puts it live at once, with no Publish: every device of this family gets it the next time it opens the game online (about 30 seconds).' + (page === 'ads' ? ' A new picture still needs Publish.' : ''), 'Lưu là có hiệu lực ngay, không cần Phát hành: mọi máy của gia đình nhận được khi mở game có mạng lần tới (khoảng 30 giây).' + (page === 'ads' ? ' Hình mới vẫn cần Phát hành.' : '')];
  if (LIVE_PAGES[page] && liveOn()) text.forEach((t, i) => { text[i] = t.replace(S_PUB[i], S_LIVE[i]); });
  liveBadge(P, page);
  const box = document.createElement('details'); box.className = 'studio-help'; box.innerHTML = `<summary>${T('How this section works', 'Cách dùng mục này')}</summary><p>${T2(text)}</p>`; P.prepend(box);
}
const PAGES: Record<string, (P: HTMLElement) => unknown> = {};
const MANAGEMENT_PAGES = { management: 'overview', managementdevices: 'devices', managementchildren: 'children', managementdevice: 'device', managementattention: 'attention', managementactivities: 'activities', managementactivity: 'activity', managementrelease: 'release', managementoperations: 'operations', managementfinance:'finance', managementchanges: 'changes' } as const;
for (const [page, kind] of Object.entries(MANAGEMENT_PAGES)) PAGES[page] = async P => {
  const { renderManagement } = await import('./management.js');
  const query = Object.fromEntries(new URLSearchParams(location.hash.split('?')[1] || ''));
  const { id, ...filters } = query;
  return renderManagement(P, { api, T, kind, id, query: filters, online: INFO.online === true, can: permission => !INFO.online && ['management.configure','management.triage','operations.run'].includes(permission) ? false : CAN(permission),
    go: (next, nextId, nextQuery) => {
      if (!leaveOk()) return;
      const target = Object.keys(MANAGEMENT_PAGES).find(k => MANAGEMENT_PAGES[k] === next);
      const q = new URLSearchParams({ ...nextQuery, ...(nextId ? { id: nextId } : {}) });
      const hash = 'players/' + target + (q.size ? '?' + q : '');
      if (location.hash.slice(1) === hash) void render(); else location.hash = hash;
    } });
}

// ---------- home ----------
PAGES.home = async P => {
  const c = CONTENT;
  // (owner, 10 Oct) on a phone the buttons come first and the numbers sit in a small row under them
  const waiting = INFO.unpublished && CAN('edit') ? `<div class="card hwait"><p class="warn">✏️ ${T('You have saved changes that are not live yet: press Publish to send them to the children.', 'Bạn có thay đổi đã lưu nhưng chưa phát hành: bấm Phát hành để gửi tới các con.')}</p><button class="btn" id="hpub">🚀 ${T('Publish', 'Phát hành')}${INFO.waiting ? ` (${INFO.waiting})` : ''}</button></div>` : '';
  P.innerHTML = `<div class="home"><h2>🏠 ${T('Welcome!', 'Xin chào!')}</h2><p class="sub">${liveOn() ? T('Change the game for your family here. Each section shows when your saves take effect.', 'Chỉnh trò chơi cho gia đình ở đây. Mỗi mục cho biết khi nào thay đổi đã lưu có hiệu lực.') : T('Change the game for your family here, then press Publish.', 'Chỉnh trò chơi cho gia đình ở đây, rồi bấm Phát hành.')}</p>${waiting}
  <div class="grid stats">
    <div class="card stat"><b>${esc(INFO.version)}</b><span>${T('Game version', 'Phiên bản game')}</span></div>
    <div class="card stat"><b>${INFO.voices}</b><span>${T('Voice recordings', 'Bản ghi giọng đọc')}</span></div>
    <div class="card stat"><b>${(c.tales || []).length}</b><span>${T('Family stories', 'Truyện của nhà mình')}</span></div>
    <div class="card stat"><b>${(c.quiz || []).length}</b><span>${T('Quiz questions', 'Câu đố')}</span></div>
    <div class="card stat"><b>${Object.keys(c.faces || {}).length}</b><span>${T('Photo faces', 'Ảnh khuôn mặt')}</span></div>
  </div>
  ${INFO.online ? `<div class="card hact"><p>☁️ ${T('Sparkle Studio online. The family’s files are kept in GitHub', 'Sparkle Studio trên mạng. Tệp của gia đình được giữ trong GitHub')}: <code>${esc(INFO.game)}</code></p>
    <div class="row" style="max-width:520px"><button class="btn" id="play">▶ ${T('Open the game', 'Mở game')}</button><button class="btn ghost" id="out">🚪 ${T('Sign out', 'Đăng xuất')}</button></div>
    <p class="note">${T('Pages marked Live save immediately. Pages marked Needs Publish keep changes in a draft until you Publish. The same Studio is in SparkleStudio.exe on the family computer.', 'Mục ghi Có hiệu lực ngay lưu là áp dụng ngay. Mục ghi Cần phát hành giữ thay đổi trong bản nháp cho tới khi bạn Phát hành. Studio này cũng có trong SparkleStudio.exe trên máy tính gia đình.')}</p></div>`
  : `<div class="card hact"><p>${T('Game folder', 'Thư mục game')}: <code>${esc(INFO.game)}</code></p>
    <div class="row" style="max-width:520px"><button class="btn" id="play">▶ ${T('Try the game here', 'Chơi thử tại đây')}</button><button class="btn ghost" id="folder">📂 ${T('Open the folder', 'Mở thư mục')}</button></div>
    <p class="note">${liveOn() ? T('Pages marked Live save immediately to the connected family service. Other changes stay in this game folder until you Publish.', 'Mục ghi Có hiệu lực ngay lưu là áp dụng ngay qua dịch vụ gia đình đã kết nối. Thay đổi khác ở trong thư mục game này cho tới khi bạn Phát hành.') : T('Trying the game here uses this computer only; the children see changes after you Publish.', 'Chơi thử ở đây chỉ trên máy này; các con thấy thay đổi sau khi bạn Phát hành.')}</p></div>`}</div>`;
  if ($('#hpub')) $('#hpub').onclick = () => go('publish');
  $('#play').onclick = () => window.open(INFO.online ? '/' : GAME, '_blank');
  if ($('#folder')) $('#folder').onclick = () => api('open', { folder: true }).catch(fail);
  if ($('#out')) $('#out').onclick = async () => { await fetch(BASE + '/api/logout'); signIn(); };
};
// ---------- ads: small, inside the valley, OFF until switched on here; with a guide ----------
// (r65) what an ad still needs before it can go live: a picture, both languages, who it is from, where it shows, and
// an allowed link (https, no tracking, no link shorteners). `l` is the link as typed (the saved one keeps only https).
const AD_TRACK = /[?&#](utm_[a-z]+|fbclid|gclid|dclid|msclkid|mc_eid|igshid|_ga)=/i, AD_SHORT = /^https?:\/\/(www\.)?(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|rebrand\.ly|cutt\.ly|shorturl\.at|lnkd\.in|tiny\.cc|rb\.gy)\//i;
const adNeeds = (x, l = x.link || '') => [
  [!!x.image, T('a picture', 'một hình')],
  [!!(x.en || '').trim(), T('the words in English', 'lời tiếng Anh')],
  [!!(x.vi || '').trim(), T('the words in Vietnamese', 'lời tiếng Việt')],
  [!!(x.by || '').trim(), T('who the ad is from', 'quảng cáo của ai')],
  [!!(x.where && x.where.length), T('where it shows (a signboard or the card)', 'hiện ở đâu (biển hoặc thẻ)')],
  [!l || (/^https:\/\/[^\s"'<>]+$/.test(l) && !AD_TRACK.test(l) && !AD_SHORT.test(l)), !l ? '' : !/^https:\/\//.test(l) ? T('a link that starts with https://', 'liên kết bắt đầu bằng https://') : AD_TRACK.test(l) ? T('a link without tracking (take off utm_…, fbclid, gclid)', 'liên kết không theo dõi (bỏ utm_…, fbclid, gclid)') : AD_SHORT.test(l) ? T('the shop’s own link, not a link shortener', 'liên kết thật của cửa hàng, không dùng rút gọn') : T('an allowed link', 'liên kết hợp lệ')]];
let AD_VIEW = { size: 'phone', lang: 'en' };
// the roadside signboard, drawn like the game's (js/ads.js createAds: two wooden posts, a cream board, the picture, the "Ad" tag)
const adBoard = (x, lang) => `<svg class="adboard" viewBox="0 0 360 230" role="img" aria-label="${T('Signboard preview', 'Xem trước biển')}"><rect width="360" height="230" fill="#bfe6ff"/><rect y="170" width="360" height="60" fill="#8fd18a"/><path d="M0 182 Q90 172 180 186 T360 180 V230 H0Z" fill="#7cc276"/>
  <rect x="62" y="40" width="12" height="160" rx="3" fill="#7a5236"/><rect x="286" y="40" width="12" height="160" rx="3" fill="#7a5236"/><rect x="50" y="28" width="260" height="150" rx="6" fill="#fff8e8" stroke="#d9c7a3" stroke-width="2"/>
  ${x.image ? `<image href="${FILE(esc(x.image))}" x="61" y="40" width="238" height="128" preserveAspectRatio="xMidYMid slice"/>` : `<text x="180" y="110" text-anchor="middle" font-size="15" fill="#9a8a70">${T('(the picture)', '(hình)')}</text>`}
  <rect x="222" y="14" width="76" height="22" rx="5" fill="#3b2a4f"/><text x="260" y="30" text-anchor="middle" font-size="${lang === 'vi' ? 11 : 13}" font-weight="700" fill="#fff">${lang === 'vi' ? 'Quảng cáo' : 'Ad'}</text></svg>`;
// the small card under "You did it!" after a mini-game (css/style.css .gl-ad, the same sizes)
const adCard = (x, lang) => { const w = lang === 'vi' ? (x.vi || x.en) : (x.en || x.vi);
  return `<div class="adwin"><b class="adwin-t">${lang === 'vi' ? 'Con làm được rồi!' : 'You did it!'}</b><div class="adcard"><small>${lang === 'vi' ? 'Quảng cáo' : 'Ad'}${x.by ? ' · ' + esc(x.by) : ''}</small>${x.image ? `<img src="${FILE(esc(x.image))}" alt="">` : '<i class="adnoimg"></i>'}<span>${esc(w || T('(the words)', '(lời)'))}</span></div></div>`; };
const adPreview = x => `<div class="adprev ${AD_VIEW.size}"><figure><figcaption>${T('Signboard by the road', 'Biển bên đường')}</figcaption>${adBoard(x, AD_VIEW.lang)}</figure><figure><figcaption>${T('Card after a mini-game', 'Thẻ sau trò chơi')}</figcaption>${adCard(x, AD_VIEW.lang)}</figure></div>`;
const adCheck = (x, l?) => { const need = adNeeds(x, l).filter(([ok, w]) => !ok && w);
  return need.length ? `<p class="adready no">⚠️ <b>${T('Not ready yet', 'Chưa sẵn sàng')}</b>: ${T('it still needs', 'còn cần')} ${need.map(n => n[1]).join(', ')}.</p>` : `<p class="adready yes">✅ <b>${T('Ready to go live', 'Sẵn sàng đưa lên')}</b>${x.active === false ? ' · ' + T('(switched off: “Active” is not ticked)', '(đang tắt: chưa đánh dấu “Đang dùng”)') : ''}</p>`; };
const AD_SHOTS = [['board-computer', 'A signboard beside the road, on a computer', 'Biển bên đường, trên máy tính'], ['card-computer', 'The small card under “You did it!”, on a computer', 'Thẻ nhỏ dưới “Con làm được rồi!”, trên máy tính'], ['board-phone', 'The signboard on a phone', 'Biển trên điện thoại'], ['card-phone', 'The card on a phone', 'Thẻ trên điện thoại']];
const AD_VIDEOS = 'https://github.com/nguyentuanphu/tpn/tree/main/marketing/ads-r82';
PAGES.ads = async P => {
  const A = CONTENT.ads = CONTENT.ads || { enabled: false, perDay: 3, items: [] }; A.items = A.items || [];
  const row = (x, i) => `<div class="card adrow" data-i="${i}"><div class="row" style="align-items:flex-start;gap:14px">
      <button class="btn ghost adpic" title="${T('Picture', 'Hình')}">${x.image ? `<img src="${FILE(esc(x.image))}" style="width:120px;height:68px;object-fit:cover;border-radius:8px">` : '🖼️ ' + T('Choose picture', 'Chọn hình')}</button>
      <div style="flex:1"><label>${T('Advertiser', 'Nhà quảng cáo')}</label><input type="text" class="ad-by" maxlength="60" value="${esc(x.by || '')}">
      <label>🇦🇺 ${T('Words (English)', 'Lời (tiếng Anh)')}</label><input type="text" class="ad-en" maxlength="120" value="${esc(x.en || '')}"><label>🇻🇳 ${T('Words (Vietnamese)', 'Lời (tiếng Việt)')}</label><input type="text" class="ad-vi" maxlength="120" value="${esc(x.vi || '')}">
      <label>🔗 ${T('Link (optional, https://…; opens only after a grown-up check)', 'Liên kết (không bắt buộc, https://…; chỉ mở sau khi người lớn trả lời câu đố)')}</label><input type="text" inputmode="url" class="ad-link" maxlength="300" value="${esc(x.link || '')}">
      <div class="row"><label><input type="checkbox" class="ad-boards" ${!x.where || x.where.includes('boards') ? 'checked' : ''}> ${T('Signboards by the roads', 'Biển bên đường')}</label>
      <label><input type="checkbox" class="ad-end" ${!x.where || x.where.includes('gameend') ? 'checked' : ''}> ${T('Small card after a mini-game', 'Thẻ nhỏ sau trò chơi')}</label>
      <label><input type="checkbox" class="ad-on" ${x.active !== false ? 'checked' : ''}> ${T('Active', 'Đang dùng')}</label></div></div>
      <button class="btn ghost ad-del" title="${T('Remove', 'Xóa')}" aria-label="${T('Remove', 'Xóa')}">🗑️</button></div>
      <div class="adcheck">${adCheck(x)}</div><div class="adlive">${adPreview(x)}</div></div>`;
  P.innerHTML = `<h2>📣 ${T('In-game ads', 'Quảng cáo trong game')}</h2><p class="sub">${T('Ready for later, and switched OFF. Nothing shows in the game until you switch it on here and ' + PUB('Publish.', 'Save (live at once).') + '', 'Đã chuẩn bị sẵn và đang TẮT. Không có gì hiện trong game cho tới khi bạn bật ở đây và ' + PUB('Phát hành.', 'Lưu (có hiệu lực ngay).') + '')}</p>
  <div class="card"><label class="adon"><input type="checkbox" id="adOn" ${A.enabled === true ? 'checked' : ''}> <b>${T('Show ads in the game', 'Hiện quảng cáo trong game')}</b></label>
    <label>${T('Most cards after mini-games per day (each device)', 'Số thẻ tối đa sau trò chơi mỗi ngày (mỗi máy)')}</label><input type="number" id="adPer" min="0" max="10" value="${A.perDay ?? 3}" style="max-width:100px"></div>
  ${A.items.length ? `<div class="card adview"><b>👀 ${T('Preview', 'Xem trước')}</b><div class="row"><span class="seg"><button class="btn small ${AD_VIEW.size === 'phone' ? '' : 'ghost'}" data-size="phone">📱 ${T('Phone', 'Điện thoại')}</button><button class="btn small ${AD_VIEW.size === 'computer' ? '' : 'ghost'}" data-size="computer">💻 ${T('Computer', 'Máy tính')}</button></span>
    <span class="seg"><button class="btn small ${AD_VIEW.lang === 'en' ? '' : 'ghost'}" data-alang="en">English</button><button class="btn small ${AD_VIEW.lang === 'vi' ? '' : 'ghost'}" data-alang="vi">Tiếng Việt</button></span></div>
    <p class="note">${T('Each ad below shows how it looks as you type, drawn with its own picture and words.', 'Mỗi quảng cáo bên dưới hiện ra đúng như khi bạn gõ, với hình và lời của nó.')}</p></div>` : ''}
  <div id="adList">${A.items.map(row).join('')}</div>
  <div class="bar"><button class="btn ghost" id="adAdd">+ ${T('Add an ad', 'Thêm quảng cáo')}</button><button class="btn" id="adSave">💾 ${T('Save', 'Lưu')}</button></div>
  <details class="card adguide"><summary><b>🖼️ ${T('Pictures: how ads look in the game', 'Hình: quảng cáo trông thế nào trong game')}</b></summary>
    <p class="note">${T('Real screenshots of the game with a pretend ad (“Little Lotus Books”). Your picture fills the signboard; on the card it is shown small, so big simple shapes and few words work best.', 'Ảnh chụp thật của game với một quảng cáo mẫu (“Little Lotus Books”). Hình của bạn phủ kín tấm biển; trên thẻ hình rất nhỏ, nên hình đơn giản, ít chữ là đẹp nhất.')}</p>
    <div class="adshots">${AD_SHOTS.map(([f, en, vi]) => `<figure><img src="${BASE}/ui/ads-guide/${f}.jpg" alt="${esc(T(en, vi))}" loading="lazy"><figcaption>${T(en, vi)}</figcaption></figure>`).join('')}</div>
    <p>🎥 ${T('Examples of good ads: the ten ready-made videos about Sparkle Valley (English and Vietnamese, for social media): short, friendly, no pressure.', 'Ví dụ quảng cáo tốt: mười video làm sẵn về Thung Lũng Lấp Lánh (tiếng Anh và tiếng Việt, cho mạng xã hội): ngắn, thân thiện, không thúc ép.')} <a class="btn ghost small" href="${AD_VIDEOS}" target="_blank" rel="noopener">${T('Open the videos', 'Mở các video')}</a></p></details>
  <details class="card"><summary><b>📘 ${T('Guide: ads in a children’s game', 'Hướng dẫn: quảng cáo trong game trẻ em')}</b></summary>
  <ol class="guide">
    <li>${T('How it works: add a picture (JPG/PNG, landscape, about 1200×680, under 600 KB), the words in both languages and, if you like, a link. Choose where it appears, tick “Show ads”, ' + PUB('Save, then Publish. Devices get it the next time they are online.', 'Save: it is live at once (a new picture still needs Publish). Devices get it the next time they open the game.') + '', 'Cách hoạt động: thêm hình (JPG/PNG, nằm ngang, khoảng 1200×680, dưới 600 KB), lời bằng hai thứ tiếng và liên kết nếu muốn. Chọn chỗ hiện, đánh dấu “Hiện quảng cáo”, ' + PUB('Lưu, rồi Phát hành. Máy các con nhận được lần tới khi có mạng.', 'Lưu là có hiệu lực ngay (hình mới vẫn cần Phát hành). Máy các con nhận được khi mở game lần tới.') + '')}</li>
    <li>${T('Where ads appear: a few signboards beside the roads near the towns, and a small card under the “You did it!” screen of a mini-game (a few times a day at most). Never in the middle of play, never in stories, how-to films or learning questions.', 'Quảng cáo hiện ở đâu: vài tấm biển bên đường gần các thành phố, và một thẻ nhỏ dưới màn hình “Con làm được rồi!” sau trò chơi (tối đa vài lần mỗi ngày). Không bao giờ giữa lúc chơi, trong truyện, phim hướng dẫn hay câu hỏi học tập.')}</li>
    <li>${T('Every ad is labelled “Ad / Quảng cáo”. Links open only after a grown-up answers a sum, and open outside the game.', 'Mỗi quảng cáo đều có nhãn “Ad / Quảng cáo”. Liên kết chỉ mở sau khi người lớn trả lời một phép cộng, và mở ra ngoài game.')}</li>
    <li>${T('Privacy: the game collects nothing. No ad networks, trackers, cookies or counting. Do not add tracking links (with ?utm=… or redirect services) — in many countries collecting data from children under 13 needs a parent’s consent (US COPPA, EU/UK GDPR-K, Australia’s Privacy Act, Vietnam’s Decree 13/2023 on personal data).', 'Quyền riêng tư: game không thu thập gì. Không mạng quảng cáo, không theo dõi, không cookie, không đếm lượt. Đừng dùng liên kết theo dõi (có ?utm=… hay dịch vụ chuyển hướng) — ở nhiều nước, thu thập dữ liệu của trẻ dưới 13 tuổi cần sự đồng ý của cha mẹ (COPPA của Mỹ, GDPR-K của EU/Anh, Luật Quyền riêng tư của Úc, Nghị định 13/2023 của Việt Nam về dữ liệu cá nhân).')}</li>
    <li>${T('What is suitable: things that are good for children and families (books, learning, museums, parks, local family businesses). Not allowed: food and drinks high in sugar, salt or fat, toys with violence, gambling or “loot boxes”, anything for adults. Australia’s AANA Children’s Code and Vietnam’s Advertising Law (2012, Art. 8 and 9) set rules for ads to children; check them, or ask an advisor, before taking money for an ad.', 'Phù hợp: những thứ tốt cho trẻ và gia đình (sách, học tập, bảo tàng, công viên, cửa hàng gia đình ở địa phương). Không được: đồ ăn uống nhiều đường, muối, béo, đồ chơi bạo lực, cờ bạc hay “hộp quà may rủi”, thứ dành cho người lớn. Bộ quy tắc quảng cáo cho trẻ em AANA của Úc và Luật Quảng cáo Việt Nam (2012, Điều 8 và 9) có quy định riêng; hãy xem kỹ hoặc hỏi người tư vấn trước khi nhận tiền quảng cáo.')}</li>
    <li>${T('Words for children: short, friendly, no pressure (“Ask your parents to buy now!” is not allowed). No pretending an ad is part of the story, and no characters from the game selling things.', 'Lời cho trẻ: ngắn, thân thiện, không thúc ép (“Bảo bố mẹ mua ngay!” là không được). Không giả làm một phần câu chuyện, và nhân vật trong game không bán hàng.')}</li>
    <li>${T('To pause all ads at once, untick “Show ads” and ' + PUB('Save and Publish.', 'Save (live at once).') + ' Removing a picture here removes it from the next publish.', 'Để tạm ngưng mọi quảng cáo, bỏ dấu “Hiện quảng cáo” rồi ' + PUB('Lưu và Phát hành.', 'Lưu (có hiệu lực ngay).') + ' Xóa hình ở đây thì lần phát hành sau sẽ không còn hình đó.')}</li>
  </ol></details>`;
  const collect = () => { A.enabled = $('#adOn').checked; A.perDay = Math.max(0, Math.min(10, +$('#adPer').value || 0));
    P.querySelectorAll<HTMLInputElement>('.adrow').forEach(r => { const x = A.items[+r.dataset.i]; x.by = r.querySelector<HTMLInputElement>('.ad-by').value.trim(); x.en = r.querySelector<HTMLInputElement>('.ad-en').value.trim(); x.vi = r.querySelector<HTMLInputElement>('.ad-vi').value.trim();
      const l = r.querySelector<HTMLInputElement>('.ad-link').value.trim(); x.link = adNeeds({}, l)[5][0] ? l : ''; x.active = r.querySelector<HTMLInputElement>('.ad-on').checked;
      x.where = [r.querySelector<HTMLInputElement>('.ad-boards').checked && 'boards', r.querySelector<HTMLInputElement>('.ad-end').checked && 'gameend'].filter(Boolean); }); };
  // as you type: this ad's preview and checklist again (the link as typed, so a wrong one is named)
  const live = r => { collect(); const x = A.items[+r.dataset.i], l = r.querySelector('.ad-link').value.trim(); r.querySelector('.adcheck').innerHTML = adCheck(x, l); r.querySelector('.adlive').innerHTML = adPreview(x); };
  P.querySelectorAll<HTMLInputElement>('.adrow').forEach(r => { r.addEventListener('input', () => live(r)); r.addEventListener('change', () => live(r)); });
  P.querySelectorAll<HTMLInputElement>('[data-size]').forEach(b => b.onclick = () => { collect(); AD_VIEW.size = b.dataset.size; PAGES.ads(P); });
  P.querySelectorAll<HTMLInputElement>('[data-alang]').forEach(b => b.onclick = () => { collect(); AD_VIEW.lang = b.dataset.alang; PAGES.ads(P); });
  $('#adAdd').onclick = () => { collect(); A.items.push({ by: '', en: '', vi: '', link: '', where: ['boards', 'gameend'], active: true }); PAGES.ads(P); };
  P.querySelectorAll<HTMLInputElement>('.ad-del').forEach(b => b.onclick = () => { collect(); A.items.splice(+b.closest<HTMLInputElement>('.adrow').dataset.i, 1); PAGES.ads(P); });
  P.querySelectorAll<HTMLInputElement>('.adpic').forEach(b => b.onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/jpeg,image/png';
    inp.onchange = () => { const f = inp.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = async () => { try { collect(); const i = +b.closest<HTMLInputElement>('.adrow').dataset.i, r = await api('adimage', { id: A.items[i].by || 'ad', dataUrl: rd.result }); A.items[i].image = r.image; PAGES.ads(P); } catch (e) { fail(e); } }; rd.readAsDataURL(f); }; inp.click(); });
  // (r65) an ad can go live only when nothing is missing: "Show ads" on with an active ad not ready is not saved
  $('#adSave').onclick = () => { collect(); const rows = [...P.querySelectorAll<HTMLInputElement>('.adrow')], notReady = A.items.map((x, i) => [x, i]).filter(([x, i]) => x.active !== false && adNeeds(x, rows[i].querySelector<HTMLInputElement>('.ad-link').value.trim()).some(([ok, w]) => !ok && w));
    if (A.enabled && notReady.length) { const [x, i] = notReady[0]; rows[i].scrollIntoView({ block: 'center' }); return toast(T(`Ad ${i + 1}${x.by ? ' (' + x.by + ')' : ''} is not ready yet: see its checklist. Untick “Active” or “Show ads” to save it as it is.`, `Quảng cáo ${i + 1}${x.by ? ' (' + x.by + ')' : ''} chưa sẵn sàng: xem danh sách cần có. Bỏ dấu “Đang dùng” hoặc “Hiện quảng cáo” để lưu như hiện tại.`), 'bad'); }
    saveContent().catch(fail); };
};
// ---------- family album: photos the grown-ups add become postcards the children find in the valley (js/familycards.js) ----------
// (the places are the game's sticker-book places, js/placebook.js PLACES; the studio check keeps the two lists the same)
const ALBUM_PLACES = [['home', 'Sunny Farm', 'Nông Trại Nắng Mai'], ['village', 'Lotus Village', 'Làng Sen'], ['town', 'Two Homes Street', 'Phố Hai Quê'], ['market', 'Three Regions Market', 'Chợ Ba Miền'],
  ['aussie', 'Aussie Corner', 'Góc Nước Úc'], ['china', 'China Town', 'Làng Trung Hoa'], ['india', 'India Village', 'Làng Ấn Độ'], ['paddies', 'Golden Rice Fields', 'Cánh Đồng Lúa Vàng'],
  ['lake', 'Mirror Lake', 'Hồ Gương'], ['bamboo', 'Whispering Bamboo', 'Rừng Tre Thì Thầm'], ['mountain', 'Snowcap Peaks', 'Núi Tuyết Trắng'], ['meadow', 'Breezy Meadows', 'Đồng Cỏ Lộng Gió'],
  ['plateau', 'Dawn Plateau', 'Cao Nguyên Bình Minh'], ['danang', 'Đà Nẵng', 'Đà Nẵng'], ['bacninh', 'Bắc Ninh', 'Bắc Ninh'], ['hanoi', 'Hà Nội', 'Hà Nội'], ['saigon', 'Hồ Chí Minh City', 'TP. Hồ Chí Minh'],
  ['vungtau', 'Bà Rịa–Vũng Tàu', 'Bà Rịa–Vũng Tàu'], ['brisbane', 'Brisbane', 'Brisbane'], ['melbourne', 'Melbourne', 'Melbourne'], ['sydney', 'Sydney', 'Sydney']];
// a photo made small enough for a postcard: at most 1000 px on its long side, JPEG
const shrinkPhoto = file => new Promise((res, rej) => { const img = new Image(); img.onload = () => { const k = Math.min(1, 1000 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src); res(c.toDataURL('image/jpeg', .82)); }; img.onerror = () => rej(new Error(T('That file is not a photo.', 'Tệp đó không phải là ảnh.'))); img.src = URL.createObjectURL(file); });
PAGES.album = async P => {
  const A = CONTENT.album = Array.isArray(CONTENT.album) ? CONTENT.album : [];
  const row = (x, i) => `<div class="card alrow" data-i="${i}"><div class="row" style="align-items:flex-start;gap:14px">
      <button class="btn ghost alpic" title="${T('Photo', 'Ảnh')}">${x.photo ? `<img src="${esc(PIC(x.photo))}" style="width:120px;height:90px;object-fit:cover;border-radius:8px">` : '📷 ' + T('Choose photo', 'Chọn ảnh')}</button>
      <div style="flex:1"><label>🇦🇺 ${T('Words on the postcard (English)', 'Lời trên bưu thiếp (tiếng Anh)')}</label><input class="al-en" maxlength="120" value="${esc(x.en || '')}">
      <label>🇻🇳 ${T('Words on the postcard (Vietnamese)', 'Lời trên bưu thiếp (tiếng Việt)')}</label><input class="al-vi" maxlength="120" value="${esc(x.vi || '')}">
      <label>📍 ${T('Where the children find it', 'Các con tìm thấy ở đâu')}</label><select class="al-place">${ALBUM_PLACES.map(([k, en, vi]) => `<option value="${k}" ${(x.place || 'home') === k ? 'selected' : ''}>${esc(T(en, vi))}</option>`).join('')}</select></div>
      <button class="btn ghost al-del" title="${T('Remove', 'Xóa')}">🗑️</button></div></div>`;
  P.innerHTML = `<h2>💌 ${T('Family album', 'Album gia đình')}</h2><p class="sub">${T('Add family photos. Each one becomes a postcard: when a child walks into the place you choose, the postcard arrives in their album (Pad → Album). ' + PUB('Save, then Publish.', 'Save: it is live at once.') + '', 'Thêm ảnh gia đình. Mỗi ảnh thành một tấm bưu thiếp: khi con đi đến nơi bạn chọn, bưu thiếp đến album của con (Bảng → Album). ' + PUB('Lưu, rồi Phát hành.', 'Lưu là có hiệu lực ngay.') + '')}</p>
  <div id="alList">${A.map(row).join('') || `<div class="card"><p class="note">${T('No photos yet.', 'Chưa có ảnh nào.')}</p></div>`}</div>
  <div class="bar"><button class="btn ghost" id="alAdd">+ ${T('Add a photo', 'Thêm ảnh')}</button><button class="btn" id="alSave">💾 ${T('Save', 'Lưu')}</button></div>
  <p class="note">${T('Photos are made smaller (1000 px) and kept private: only the family’s devices with the family code see them (Family → Family code). They never become public files of the website.', 'Ảnh được thu nhỏ (1000 px) và giữ riêng: chỉ máy của gia đình có mã gia đình mới xem được (Gia đình → Mã gia đình). Ảnh không bao giờ thành tệp công khai trên trang web.')}</p>${oldPicsNote()}`;
  bindOldPics(P);
  const collect = () => P.querySelectorAll<HTMLInputElement>('.alrow').forEach(r => { const x = A[+r.dataset.i]; x.en = r.querySelector<HTMLInputElement>('.al-en').value.trim(); x.vi = r.querySelector<HTMLInputElement>('.al-vi').value.trim(); x.place = r.querySelector<HTMLInputElement>('.al-place').value; });
  $('#alAdd').onclick = () => { collect(); A.push({ id: 'f' + Date.now().toString(36), en: '', vi: '', place: 'home' }); PAGES.album(P); };
  P.querySelectorAll<HTMLInputElement>('.al-del').forEach(b => b.onclick = () => { collect(); A.splice(+b.closest<HTMLInputElement>('.alrow').dataset.i, 1); PAGES.album(P); });
  P.querySelectorAll<HTMLInputElement>('.alpic').forEach(b => b.onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async () => { const f = inp.files[0]; if (!f) return; try { collect(); const i = +b.closest<HTMLInputElement>('.alrow').dataset.i, r = await api('albumphoto', { id: A[i].id, dataUrl: await shrinkPhoto(f) }); A[i].photo = r.photo; PAGES.album(P); } catch (e) { fail(e); } }; inp.click(); });
  $('#alSave').onclick = () => { collect(); if (A.some(x => !x.photo)) return toast(T('Each postcard needs a photo.', 'Mỗi bưu thiếp cần một ảnh.')); saveContent().catch(fail); };
};
// ---------- family code: family photos are family-only (owner, 9 Oct, round R privacy) ----------
// Photo faces and album photos are kept in a private store under random names; each child's device needs this code
// once (in the game: Grown-ups → Children → Family photos) to show them. Old photos that are still public files move
// here with one click; the public copies go from the website with the next Publish.
const oldPicsNote = () => OLDPICS() ? `<div class="card"><p class="warn">⚠️ ${T(`${OLDPICS()} family photo(s) are still public files on the website.`, `${OLDPICS()} ảnh gia đình vẫn là tệp công khai trên trang web.`)}</p><button class="btn" data-migrate>🔒 ${T('Move family photos to private storage', 'Chuyển ảnh gia đình sang nơi riêng tư')}</button></div>` : '';
function bindOldPics(P) { P.querySelectorAll('[data-migrate]').forEach(b => b.onclick = async () => {
  if (!confirm(T('Move every family photo into the private store? The public copies are removed, and are gone from the website after you Publish.', 'Chuyển mọi ảnh gia đình vào nơi riêng tư? Các bản công khai sẽ bị xóa, và biến khỏi trang web sau khi bạn Phát hành.'))) return;
  b.disabled = true; try { const r = await api('family/migrate', {}); CONTENT = r.content || CONTENT; if (INFO) { INFO.unpublished = true; head(); }
    toast(T(`Moved ${r.moved} photo(s); ${r.removed} public file(s) removed. Now Publish.`, `Đã chuyển ${r.moved} ảnh; đã xóa ${r.removed} tệp công khai. Giờ hãy Phát hành.`)); render(); } catch (e) { b.disabled = false; fail(e); } }); }
PAGES.familycode = async P => {
  const where = INFO.conf.family, owner = ROLE() === 'owner';
  let c: { local?: boolean, error?: string, code?: string, fromEnv?: boolean } = {}; try { c = await api('family/code'); } catch (e) { c = { error: e.message }; }
  P.innerHTML = `<h2>🔒 ${T('Family code', 'Mã gia đình')}</h2><p class="sub">${T('Family photos (photo faces and the Family album) are private: they are never public files of the website. A child’s device shows them only after a grown-up types this code once, in the game: Grown-ups → Children → Family photos.', 'Ảnh gia đình (ảnh khuôn mặt và Album gia đình) được giữ riêng: không bao giờ là tệp công khai của trang web. Máy của con chỉ hiện ảnh sau khi người lớn gõ mã này một lần, trong game: Phụ huynh → Các con → Ảnh gia đình.')}</p>
  ${c.local ? `<div class="card"><p class="warn">💻 ${T('The family photos are kept on this computer only, so only the game you try here shows them. To send them to the children’s devices, put the website and a Studio key in Settings (make the key online: Setup → Security).', 'Ảnh gia đình chỉ được giữ trên máy này, nên chỉ game chơi thử ở đây hiện được. Để gửi tới máy của các con, điền trang web và khóa Studio trong Cài đặt (tạo khóa trên mạng: Thiết lập → Bảo mật).')}</p></div>`
    : c.error ? `<div class="card"><p class="badtxt">⚠️ ${esc(say(c.error))}</p></div>`
    : `<div class="card"><p class="note">${T('The family code', 'Mã gia đình')}</p><p style="font-size:2rem;letter-spacing:.12em;font-family:monospace;margin:.2em 0"><b id="fcode">${esc(c.code)}</b></p>
      <p class="note">${T('Keep it in the family. Anyone with this code and the website’s address can see the family photos.', 'Hãy giữ trong gia đình. Ai có mã này và địa chỉ trang web đều xem được ảnh gia đình.')}</p>
      ${owner ? (c.fromEnv ? `<p class="note">${T('This code is FAMILY_CODE in Netlify: change it there.', 'Mã này là FAMILY_CODE trong Netlify: hãy đổi ở đó.')}</p>` : `<button class="btn ghost" id="fnew">🔄 ${T('Make a new code', 'Tạo mã mới')}</button><p class="note">${T('A new code stops every device until a grown-up types the new one there (their saved copies are cleared the next time they go online).', 'Mã mới làm mọi máy ngừng hiện ảnh cho tới khi người lớn gõ mã mới ở đó (bản đã lưu sẽ bị xóa lần tới máy có mạng).')}</p>`) : ''}</div>`}
  <div class="card"><h3>📍 ${T('Where the photos are kept', 'Ảnh được giữ ở đâu')}</h3><p>${where === 'site' ? T('In the website’s private family store (Netlify Blobs), under random names. Not in GitHub, not in the game’s files.', 'Trong kho riêng của gia đình trên trang web (Netlify Blobs), với tên ngẫu nhiên. Không ở GitHub, không ở tệp của game.') : T('On this computer only (outside the game folder).', 'Chỉ trên máy này (ngoài thư mục game).')}</p></div>
  ${oldPicsNote()}`;
  bindOldPics(P);
  if ($('#fnew')) $('#fnew').onclick = async () => { if (!confirm(T('Make a new family code? Every device needs the new one.', 'Tạo mã gia đình mới? Mọi máy cần gõ mã mới.'))) return; try { const r = await api('family/code/new', {}); $('#fcode').textContent = r.code; toast(T('New code made.', 'Đã tạo mã mới.')); } catch (e) { fail(e); } };
};
// ---------- message ----------
PAGES.message = async P => {
  const m = CONTENT.message || {};
  P.innerHTML = `<h2>💌 ${T('A message for the children', 'Lời nhắn cho các con')}</h2><p class="sub">${T('Shown once a day when they start playing, and read aloud.', 'Hiện mỗi ngày một lần khi các con bắt đầu chơi, và được đọc to.')}</p>
  <div class="card"><label>🇦🇺 English</label><textarea id="en" maxlength="400">${esc(m.en || '')}</textarea><label>🇻🇳 Tiếng Việt</label><textarea id="vi" maxlength="400">${esc(m.vi || '')}</textarea></div>
  <div class="bar"><button class="btn ghost" id="clear">${T('No message', 'Không nhắn')}</button><button class="btn" id="save">💾 ${T('Save', 'Lưu')}</button></div>`;
  $('#save').onclick = () => { CONTENT.message = { en: $('#en').value.trim(), vi: $('#vi').value.trim() }; if (!CONTENT.message.en && !CONTENT.message.vi) delete CONTENT.message; saveContent().catch(fail); };
  $('#clear').onclick = () => { delete CONTENT.message; saveContent().then(() => render()).catch(fail); };
};
// ---------- family missions (round S, owner plan 8 Oct): content pack "missions", read by js/parents.js ----------
PAGES.missions = async P => {
  const list = Array.isArray(CONTENT.missions) ? CONTENT.missions : [];
  P.innerHTML = `<h2>📝 ${T('Family missions', 'Nhiệm vụ gia đình')}</h2><p class="sub">${T('A real-life job for the children (“Help set the table”). They see it in the game; when it is done, a grown-up ticks ✓ on the device (Grown-ups, or a press-and-hold in the child’s Adventures page) and the child gets coins and a sticker. Up to 12.', 'Một việc ngoài đời cho các con (“Giúp dọn bàn ăn”). Các con thấy trong game; làm xong, người lớn đánh dấu ✓ trên máy (mục Phụ huynh, hoặc giữ nút trong trang Nhiệm vụ của con) và con được tiền cùng hình dán. Tối đa 12.')}</p>
  <div class="card"><label>🇦🇺 English</label><input id="men" maxlength="120" placeholder="Help set the table"><label>🇻🇳 Tiếng Việt</label><input id="mvi" maxlength="120" placeholder="Giúp dọn bàn ăn">
  <div class="bar"><button class="btn" id="madd">+ ${T('Add', 'Thêm')}</button></div></div>
  <div class="card">${list.map((m, k) => `<div class="row"><span>📝 <b>${esc(m.en)}</b> · ${esc(m.vi)}</span><button class="btn ghost" data-mdel="${k}" aria-label="${T('Take it off', 'Bỏ')}" style="flex:0 0 auto;min-width:44px">✕</button></div>`).join('') || `<p class="note">${T('No missions yet.', 'Chưa có nhiệm vụ.')}</p>`}</div>`;
  $('#madd').onclick = () => { const en = $('#men').value.trim(), vi = $('#mvi').value.trim(); if (!en && !vi) return; CONTENT.missions = [{ id: 'm' + Date.now().toString(36), en: en || vi, vi: vi || en }, ...list].slice(0, 12); saveContent().then(() => render()).catch(fail); };
  P.querySelectorAll<HTMLInputElement>('[data-mdel]').forEach(b => b.onclick = () => { if (!confirm(T('Take this mission off?', 'Bỏ nhiệm vụ này?'))) return; CONTENT.missions = list.filter((_, k) => k !== +b.dataset.mdel); if (!CONTENT.missions.length) delete CONTENT.missions; saveContent().then(() => render()).catch(fail); });
};
// ---------- villagers: names and photo faces ----------
PAGES.villagers = async P => {
  const list = await api('names'); CONTENT.names = CONTENT.names || {}; CONTENT.faces = CONTENT.faces || {}; CONTENT.genders = CONTENT.genders || {};
  P.innerHTML = `<h2>🧑 ${T('Villagers: names and faces', 'Nhân vật: tên và khuôn mặt')}</h2><p class="sub">${T('Give anyone a different name, or a real face from a photo. A name or face changed on a child’s device still wins there.', 'Đổi tên ai cũng được, hoặc gắn khuôn mặt thật từ ảnh. Tên hay khuôn mặt đã đổi trên máy của con vẫn được ưu tiên ở máy đó.')}</p>
  <div class="card vcard"><input type="text" id="find" data-nodirty placeholder="🔎 ${T('Find someone…', 'Tìm nhân vật…')}"><table class="vill"><thead><tr><th></th><th>${T('Name in the game', 'Tên trong game')}</th><th>🇦🇺 English</th><th>🇻🇳 Tiếng Việt</th><th>${T('Voice', 'Giọng')}</th></tr></thead><tbody>${list.map(n => {
    const nm = CONTENT.names[n.id] || {}, f = CONTENT.faces[n.id];
    return `<tr data-id="${esc(n.id)}"><td class="vface"><button class="face" title="${T('Photo face', 'Ảnh khuôn mặt')}" aria-label="${T('Photo face', 'Ảnh khuôn mặt')}">${f ? `<img class="face" src="${esc(PIC(f.photo))}?${Date.now()}">` : '📷'}</button></td><td class="vname"><b>${esc(n.id)}</b><br><span class="note">${esc(n.en)}</span></td>
      <td data-label="${T('Name in English', 'Tên tiếng Anh')}"><input type="text" data-l="en" value="${esc(nm.en || '')}" placeholder="${esc(n.en)}"></td><td data-label="${T('Name in Vietnamese', 'Tên tiếng Việt')}"><input type="text" data-l="vi" value="${esc(nm.vi || '')}" placeholder="${esc(n.id)}"></td>
      <td data-label="${T('Voice', 'Giọng')}"><select data-g><option value="">${T('auto', 'tự động')}</option><option value="f" ${CONTENT.genders[n.id] === 'f' ? 'selected' : ''}>👩 ${T('woman/girl', 'nữ')}</option><option value="m" ${CONTENT.genders[n.id] === 'm' ? 'selected' : ''}>👨 ${T('man/boy', 'nam')}</option></select></td></tr>`; }).join('')}</tbody></table></div>
  <div class="bar"><button class="btn" id="save">💾 ${T('Save names and faces', 'Lưu tên và khuôn mặt')}</button></div>${oldPicsNote()}`;
  bindOldPics(P);
  $('#find').oninput = e => { const q = val(e).toLowerCase(); P.querySelectorAll<HTMLInputElement>('tbody tr').forEach(r => r.hidden = q && !r.textContent.toLowerCase().includes(q) && !r.dataset.id.toLowerCase().includes(q)); };
  P.querySelectorAll<HTMLInputElement>('.face').forEach(b => b.onclick = () => {
    const id = b.closest<HTMLInputElement>('tr').dataset.id;
    if (CONTENT.faces[id] && !confirm(T('Choose a new photo? (Cancel removes the face.)', 'Chọn ảnh mới? (Hủy để bỏ khuôn mặt.)'))) { delete CONTENT.faces[id]; b.innerHTML = '📷'; return; }
    cropper(id, async out => { if (!out) return; try { const r = await api('face', { id, dataUrl: out.photo }); CONTENT.faces[id] = { photo: r.photo, skin: out.skin }; b.innerHTML = `<img class="face" src="${esc(PIC(r.photo))}?${Date.now()}">`; } catch (e) { fail(e); } });
  });
  $('#save').onclick = () => { P.querySelectorAll<HTMLInputElement>('tbody tr').forEach(r => { const en = r.querySelector<HTMLInputElement>('[data-l=en]').value.trim(), vi = r.querySelector<HTMLInputElement>('[data-l=vi]').value.trim(), g = r.querySelector<HTMLInputElement>('[data-g]').value; if (en || vi) CONTENT.names[r.dataset.id] = { en, vi }; else delete CONTENT.names[r.dataset.id]; if (g) { CONTENT.genders[r.dataset.id] = g; if (en) CONTENT.genders[en] = g; } else delete CONTENT.genders[r.dataset.id]; }); saveContent().catch(fail); };
};
// the round face cropper (drag to move, wheel or slider to zoom); gives { photo: JPEG data URL, skin }
function cropper(id, done) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="card"><h3>📷 ${esc(id)}</h3><canvas class="crop" width="480" height="480"></canvas>
    <p class="note">${T('A clear, front-facing photo. Eyebrows near the top of the circle, chin near the bottom.', 'Ảnh rõ, nhìn thẳng. Lông mày gần mép trên vòng tròn, cằm gần mép dưới.')}</p>
    <div class="row"><input type="file" accept="image/*"><input type="range" min="1" max="5" step=".01" value="1"></div>
    <div class="bar"><button class="btn ghost" data-x>${T('Cancel', 'Hủy')}</button><button class="btn" data-ok disabled>${T('Use this face', 'Dùng khuôn mặt này')}</button></div></div>`;
  document.body.appendChild(m);
  const cv = m.querySelector<HTMLCanvasElement>('canvas'), cx = cv.getContext('2d'), zr = m.querySelector<HTMLInputElement>('[type=range]'), ok = m.querySelector<HTMLInputElement>('[data-ok]');
  let img = null, zoom = 1, ox = 0, oy = 0, drag = null;
  const draw = () => { cx.fillStyle = '#eee'; cx.fillRect(0, 0, 480, 480); if (img) { const s = Math.max(480 / img.width, 480 / img.height) * zoom; cx.drawImage(img, 240 - img.width * s / 2 + ox, 240 - img.height * s / 2 + oy, img.width * s, img.height * s); }
    cx.save(); cx.fillStyle = 'rgba(30,20,40,.45)'; cx.beginPath(); cx.rect(0, 0, 480, 480); cx.arc(240, 240, 205, 0, 7, true); cx.fill('evenodd'); cx.restore(); cx.strokeStyle = '#fff'; cx.lineWidth = 5; cx.beginPath(); cx.arc(240, 240, 205, 0, 7); cx.stroke(); ok.disabled = !img; };
  draw();
  m.querySelector<HTMLInputElement>('[type=file]').onchange = e => { const f = fileOf(e); if (!f) return; const i = new Image(); i.onload = () => { img = i; zoom = 1; ox = oy = 0; zr.value = '1'; draw(); }; i.src = URL.createObjectURL(f); };
  zr.oninput = () => { zoom = +zr.value; draw(); };
  cv.onwheel = e => { e.preventDefault(); zoom = Math.min(5, Math.max(1, zoom * (e.deltaY < 0 ? 1.06 : .94))); zr.value = String(zoom); draw(); };
  cv.onpointerdown = e => { drag = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = e => { if (!drag) return; const k = 480 / cv.clientWidth; ox += (e.clientX - drag[0]) * k; oy += (e.clientY - drag[1]) * k; drag = [e.clientX, e.clientY]; draw(); };
  cv.onpointerup = () => { drag = null; };
  m.querySelector<HTMLInputElement>('[data-x]').onclick = () => { m.remove(); done(null); };
  ok.onclick = () => {
    const S = 256, o = document.createElement('canvas'); o.width = o.height = S; const c2 = o.getContext('2d'), s = Math.max(480 / img.width, 480 / img.height) * zoom, k = S / 410;
    c2.drawImage(img, (240 - img.width * s / 2 + ox - 35) * k, (240 - img.height * s / 2 + oy - 35) * k, img.width * s * k, img.height * s * k);
    let r = 0, g = 0, b = 0, n = 0; for (const [px, py] of [[.3, .62], [.7, .62], [.5, .32]]) { const d = c2.getImageData(px * S - 8, py * S - 8, 16, 16).data; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } }
    const hx = v => Math.round(v / n).toString(16).padStart(2, '0');
    m.remove(); done({ photo: o.toDataURL('image/jpeg', .85), skin: '#' + hx(r) + hx(g) + hx(b) });
  };
}
// ---------- a picture chooser (owner, 10 Oct: "type or paste emoji" was confusing): the game's own drawings, tap to add ----------
const PICKS = ['👧', '👦', '👩', '👨', '👵', '👴', '👶', '🧒', '🐶', '🐱', '🐰', '🐻', '🐼', '🐯', '🦁', '🐮', '🐃', '🐷', '🐸', '🐵', '🐔', '🦆', '🐟', '🐢', '🐉', '🦋', '🐝', '🐘', '🌸', '🪷', '🌳', '🎋', '🌾', '🌊', '🌙', '⭐', '☀️', '🌈', '☁️', '🌧️', '🏠', '🏡', '🏫', '🏮', '🚲', '🚌', '⛵', '🛶', '🍚', '🍜', '🥭', '🍉', '🍌', '🎂', '🎁', '🎈', '📚', '⚽', '🎵', '💛', '❤️', '❓'];
let PICK_OK = null;
// the pictures chosen so far are shown as the game's drawings (tap one to take it off); the box holding them is hidden
const graphemes = v => [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(v || '')].map(x => x.segment).filter(x => x.trim());
const showPics = (row, input) => { row.innerHTML = graphemes(input.value).map((e, i) => `<button type="button" class="pk" data-k="${i}" aria-label="${T('Take this picture off', 'Bỏ hình này')}">${e}</button>`).join('') || `<span class="note">${T('No pictures yet.', 'Chưa có hình.')}</span>`;
  row.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const g = graphemes(input.value); g.splice(+b.dataset.k, 1); input.value = g.join(''); input.dispatchEvent(new Event('input', { bubbles: true })); }); };
async function picker(btn, input) {
  const host = btn.closest('.row') || btn.parentElement, open = host.nextElementSibling && host.nextElementSibling.classList.contains('picker') ? host.nextElementSibling : null; if (open) { open.remove(); return; }
  if (!PICK_OK) { try { const A = await import(GAME + 'js/art.js'); PICK_OK = PICKS.filter(A.hasArt); } catch (e) { PICK_OK = PICKS; } }
  const box = document.createElement('div'); box.className = 'picker';
  box.innerHTML = PICK_OK.map(e => `<button type="button" class="pk" aria-label="${T('Add this picture', 'Thêm hình này')}">${e}</button>`).join('') + `<button type="button" class="btn small ghost pkx">${T('Clear', 'Xóa hết')}</button>`;
  host.after(box);
  box.querySelectorAll<HTMLInputElement>('.pk').forEach((b, i) => b.onclick = () => { input.value = input.dataset.f === 'pic' ? PICK_OK[i] : input.value + PICK_OK[i]; input.dispatchEvent(new Event('input', { bubbles: true })); });
  box.querySelector<HTMLInputElement>('.pkx').onclick = () => { input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); };
}
const pickBtn = () => `<div class="picrow"></div><button type="button" class="btn small ghost" data-pick>+ ${T('Picture', 'Hình')}</button>`;
const bindPick = root => root.querySelectorAll('[data-pick]').forEach(b => { const input = b.parentElement.querySelector('input'), row = b.parentElement.querySelector('.picrow');
  input.hidden = true; showPics(row, input); input.addEventListener('input', () => showPics(row, input)); b.onclick = () => picker(b, input); });
// ---------- stories ----------
// (a list box cannot show the game's drawings, so each flag is named in words; the story keeps the flag itself)
const FLAGS = [['💛', 'Our family', 'Nhà mình'], ['🇻🇳', 'Vietnam', 'Việt Nam'], ['🇦🇺', 'Australia', 'Úc'], ['🇨🇳', 'China', 'Trung Quốc'], ['🇮🇳', 'India', 'Ấn Độ']];
PAGES.stories = async P => {
  CONTENT.tales = CONTENT.tales || []; let edit = null;
  const list = () => {
    P.innerHTML = `<h2>📖 ${T('The family’s own stories', 'Truyện của nhà mình')}</h2><p class="sub">${T('They appear on the Stories shelf and are read aloud page by page, with the pictures moving.', 'Truyện hiện trên kệ Truyện và được đọc to từng trang, hình ảnh chuyển động.')}</p>
    ${CONTENT.tales.map((t, i) => `<div class="card row"><div style="flex:3"><b>${esc(t.flag)} ${esc(T(t.en, t.vi))}</b><br><span class="note">${t.pages.length} ${T('pages', 'trang')}</span></div><button class="btn small" data-e="${i}">✏️ ${T('Edit', 'Sửa')}</button><button class="btn small bad" data-d="${i}">🗑️</button></div>`).join('') || `<div class="card note">${T('No stories yet.', 'Chưa có truyện nào.')}</div>`}
    <div class="bar"><button class="btn" id="new">➕ ${T('New story', 'Truyện mới')}</button></div>`;
    P.querySelectorAll<HTMLInputElement>('[data-e]').forEach(b => b.onclick = () => { edit = +b.dataset.e; editor(); });
    P.querySelectorAll<HTMLInputElement>('[data-d]').forEach(b => b.onclick = () => { if (confirm(T('Delete this story?', 'Xóa truyện này?'))) { CONTENT.tales.splice(+b.dataset.d, 1); saveContent().then(list).catch(fail); } });
    $('#new').onclick = () => { CONTENT.tales.push({ id: 's' + Date.now().toString(36), flag: '💛', en: '', vi: '', pages: [['🏡😊', '', '']] }); edit = CONTENT.tales.length - 1; editor(); };
  };
  const editor = () => {
    const t = CONTENT.tales[edit];
    P.innerHTML = `<h2>✏️ ${T('Story', 'Truyện')}</h2><div class="card"><div class="row"><div><label>${T('Flag', 'Cờ')}</label><select id="flag">${FLAGS.map(([f, en, vi]) => `<option value="${f}" ${f === t.flag ? 'selected' : ''}>${T(en, vi)}</option>`).join('')}</select></div>
      <div style="flex:3"><label>🇦🇺 ${T('Title', 'Tên truyện')}</label><input type="text" id="ten" value="${esc(t.en)}"></div><div style="flex:3"><label>🇻🇳 ${T('Title', 'Tên truyện')}</label><input type="text" id="tvi" value="${esc(t.vi)}"></div></div></div>
      <div id="pages"></div><div class="bar"><button class="btn ghost" id="add">➕ ${T('Add a page', 'Thêm trang')}</button><button class="btn ghost" id="back">← ${T('Back', 'Quay lại')}</button><button class="btn" id="save">💾 ${T('Save story', 'Lưu truyện')}</button></div>
      <p class="note">${T('Pictures: tap “+ Picture” on a page and choose the game’s drawings. People and animals in them come alive in the story theatre.', 'Hình: bấm “+ Hình” ở mỗi trang và chọn hình vẽ của game. Người và con vật trong đó sẽ cử động trên sân khấu truyện.')}</p>`;
    const pages = () => { $('#pages').innerHTML = t.pages.map((p, i) => `<div class="card page-card" data-i="${i}"><div class="row"><div><label>${T('Page', 'Trang')} ${i + 1} · ${T('pictures', 'hình')}</label><input type="text" class="pics" data-k="0" value="${esc(p[0])}">${pickBtn()}</div>
      <div class="row" style="flex:0 0 auto"><button class="btn small ghost" data-up>⬆️</button><button class="btn small ghost" data-dn>⬇️</button><button class="btn small bad" data-rm>🗑️</button></div></div>
      <label>🇦🇺 English</label><textarea data-k="1">${esc(p[1])}</textarea><label>🇻🇳 Tiếng Việt</label><textarea data-k="2">${esc(p[2])}</textarea></div>`).join('');
      $('#pages').querySelectorAll<HTMLInputElement>('.page-card').forEach(c => { const i = +c.dataset.i;
        c.querySelectorAll<HTMLInputElement>('[data-k]').forEach(f => f.oninput = () => { t.pages[i][+f.dataset.k] = f.value; });
        c.querySelector<HTMLInputElement>('[data-up]').onclick = () => { if (i) { [t.pages[i - 1], t.pages[i]] = [t.pages[i], t.pages[i - 1]]; pages(); } };
        c.querySelector<HTMLInputElement>('[data-dn]').onclick = () => { if (i < t.pages.length - 1) { [t.pages[i + 1], t.pages[i]] = [t.pages[i], t.pages[i + 1]]; pages(); } };
        c.querySelector<HTMLInputElement>('[data-rm]').onclick = () => { if (t.pages.length > 1) { t.pages.splice(i, 1); pages(); } }; }); bindPick($('#pages')); };
    pages();
    $('#add').onclick = () => { t.pages.push(['', '', '']); pages(); };
    $('#back').onclick = list;
    $('#save').onclick = () => { t.flag = $('#flag').value; t.en = $('#ten').value.trim(); t.vi = $('#tvi').value.trim(); if (!t.en && !t.vi) return toast(T('Give the story a title.', 'Đặt tên cho truyện nhé.')); t.pages = t.pages.filter(p => p[1] || p[2]); saveContent().then(list).catch(fail); };
  };
  list();
};
// ---------- family quiz ----------
PAGES.quiz = async P => {
  CONTENT.quiz = CONTENT.quiz || [];
  const draw = () => {
    P.innerHTML = `<h2>💛 ${T('Family quiz', 'Đố vui gia đình')}</h2><p class="sub">${T('These questions are published to players of this site. Use general questions only. Add private family questions in the game: Grown-ups → Family questions.', 'Câu hỏi ở đây được phát hành cho người chơi trang này. Chỉ dùng câu hỏi chung. Thêm câu hỏi riêng trong game: Phụ huynh → Câu hỏi gia đình.')}</p>
    ${CONTENT.quiz.map((q, i) => `<div class="card" data-i="${i}"><div class="row"><div style="flex:0 0 140px"><label>${T('Picture', 'Hình')}</label><input type="text" data-f="pic" value="${esc(q.pic || '')}">${pickBtn()}</div>
      <div><label>🇦🇺 ${T('Question', 'Câu hỏi')}</label><input type="text" data-f="q0" value="${esc(q.q[0])}"></div><div><label>🇻🇳 ${T('Question', 'Câu hỏi')}</label><input type="text" data-f="q1" value="${esc(q.q[1])}"></div><button class="btn small bad" data-rm style="flex:0 0 auto">🗑️</button></div>
      ${q.answers.map((a, j) => `<div class="row"><label style="flex:0 0 auto"><input type="radio" name="r${i}" data-right="${j}" ${q.right === j ? 'checked' : ''}> ${T('right', 'đúng')}</label><input type="text" data-a="${j}" data-l="0" value="${esc(a[0])}" placeholder="English"><input type="text" data-a="${j}" data-l="1" value="${esc(a[1])}" placeholder="Tiếng Việt"></div>`).join('')}
      ${q.answers.length < 4 ? `<button class="btn small ghost" data-more>➕ ${T('Another answer', 'Thêm đáp án')}</button>` : ''}</div>`).join('')}
    <div class="bar"><button class="btn ghost" id="new">➕ ${T('New question', 'Câu hỏi mới')}</button><button class="btn" id="save">💾 ${T('Save quiz', 'Lưu câu đố')}</button></div>`;
    P.querySelectorAll<HTMLInputElement>('[data-i]').forEach(c => { const q = CONTENT.quiz[+c.dataset.i];
      c.querySelectorAll<HTMLInputElement>('[data-f]').forEach(f => f.oninput = () => { if (f.dataset.f === 'pic') q.pic = f.value; else q.q[f.dataset.f === 'q0' ? 0 : 1] = f.value; });
      c.querySelectorAll<HTMLInputElement>('[data-a]').forEach(f => f.oninput = () => { q.answers[+f.dataset.a][+f.dataset.l] = f.value; });
      c.querySelectorAll<HTMLInputElement>('[data-right]').forEach(f => f.onchange = () => { q.right = +f.dataset.right; });
      c.querySelector<HTMLInputElement>('[data-rm]').onclick = () => { CONTENT.quiz.splice(+c.dataset.i, 1); draw(); };
      const mo = c.querySelector<HTMLInputElement>('[data-more]'); if (mo) mo.onclick = () => { q.answers.push(['', '']); draw(); }; });
    bindPick(P);
    $('#new').onclick = () => { CONTENT.quiz.push({ q: ['', ''], pic: '❓', answers: [['', ''], ['', '']], right: 0 }); draw(); };
    $('#save').onclick = () => { CONTENT.quiz = CONTENT.quiz.map(q => ({ ...q, answers: q.answers.filter(a => a[0] || a[1]) })).filter(q => (q.q[0] || q.q[1]) && q.answers.length >= 2 && q.right < q.answers.length); saveContent().then(draw).catch(fail); };
  };
  draw();
};
// ---------- the Simple screen's areas (round J): which area each game sits in, and which ones under-5s see ----------
PAGES.path = async P => {
  // (r81) the reading games too: the game registers them (js/games/readingmenu.js) only while the readingTrial switch is on
  await import(GAME + 'js/games/all.js'); await import(GAME + 'js/games/readingmenu.js').catch(() => { });
  const { GAMES } = await import(GAME + 'js/games/registry.js'), A = await import(GAME + 'js/content/activities.js'), I18 = await import(GAME + 'js/i18n.js');
  void I18; await gameLang(); const nm = f => typeof f === 'function' ? f() : f;
  CONTENT.activities = CONTENT.activities || {};
  // what this page shows comes from the choices made here (not yet published), over the usual ones
  const info = id => { const c = CONTENT.activities[id] || {}, base = A.GAME_INFO[id] || ['thinking', 5, 2]; return { area: c.area || base[0], little: c.little === undefined ? base[1] < 5 : c.little, hide: !!c.hide, base, changed: c.little !== undefined }; };
  // (r85, owner 18 Oct AEDT) the group is no longer a dropdown on each row: tapping a game opens its own panel (Group,
  // Under 5, Hide). Moving a game takes its row to the other group without drawing the page again, so the page does not
  // jump, and says "Moved to <group>" with Undo.
  const ORDER = Object.keys(GAMES), areaOf = k => A.AREAS.find(b => b.key === k) || A.AREAS[0];
  const tags = id => { const g = info(id); return `${g.little ? `<span class="pill">🧒 ${T('Under 5', 'Dưới 5 tuổi')}</span>` : ''}${g.hide ? `<span class="pill">🙈 ${T('Hidden', 'Đã ẩn')}</span>` : ''}${g.changed ? ` <span class="sub">(${T('changed', 'đã đổi')}; ${T('usual', 'mặc định')}: ${g.base[1] < 5 ? '✓' : '✗'})</span>` : ''}`; };
  const row = id => { const g = info(id);
    return `<tr data-id="${id}"><td><button type="button" class="gopen" aria-expanded="false"><span class="gn">${GAMES[id].icon} ${esc(nm(GAMES[id].name))}</span><span class="gtags">${tags(id)}</span><span class="gv">▾</span></button>
      <div class="gpanel" hidden><label>${T('Group', 'Nhóm')}<select data-f="area" data-nodirty>${A.AREAS.map(b => `<option value="${b.key}" ${g.area === b.key ? 'selected' : ''}>${b.icon} ${esc(nm(b.name))}</option>`).join('')}</select></label>
        <label class="chk"><input type="checkbox" data-f="little" ${g.little ? 'checked' : ''}> ${T('Under 5', 'Dưới 5 tuổi')}</label>
        <label class="chk"><input type="checkbox" data-f="hide" ${g.hide ? 'checked' : ''}> ${T('Hide', 'Ẩn')}</label></div></td></tr>`; };
  const count = () => P.querySelectorAll('.card[data-area]').forEach(c => { c.querySelector('.gcount').textContent = `(${c.querySelectorAll('tr[data-id]').length})`; });
  // take a game's row to another group, keeping what is on the screen where it is
  const move = (id, to) => {
    const r = P.querySelector(`tr[data-id="${id}"]`), body = P.querySelector(`.card[data-area="${to}"] tbody`); if (!r || !body || r.parentNode === body) return;
    const anchor = r.nextElementSibling || r.closest('.card'), y0 = anchor.getBoundingClientRect().top;
    const at = ORDER.indexOf(id), next = [...body.children].find(x => x instanceof HTMLElement && ORDER.indexOf(x.dataset.id) > at); body.insertBefore(r, next || null);
    r.querySelector<HTMLSelectElement>('[data-f="area"]').value = to; count();
    const dy = anchor.getBoundingClientRect().top - y0; if (dy) window.scrollBy(0, dy);
  };
  const setArea = (id, to) => { const base = info(id).base, c = CONTENT.activities[id] = { ...(CONTENT.activities[id] || {}) };
    if (to === base[0]) delete c.area; else c.area = to; if (!Object.keys(c).length) delete CONTENT.activities[id]; move(id, to); };
  const bind = r => { const id = r.dataset.id, base = A.GAME_INFO[id] || ['thinking', 5, 2], open = r.querySelector('.gopen'), panel = r.querySelector('.gpanel');
    open.onclick = () => { panel.hidden = !panel.hidden; open.setAttribute('aria-expanded', String(!panel.hidden)); r.classList.toggle('open', !panel.hidden); };
    r.querySelectorAll('[data-f]').forEach(f => f.onchange = () => {
      if (f.dataset.f === 'area') { const from = info(id).area, to = f.value, was = DIRTY; if (to === from) return; setArea(id, to); DIRTY = true; paintState();   // (its own: Undo puts “not saved” back as it was)
        toastUndo('✅ ' + T(`Moved to ${nm(areaOf(to).name)}`, `Đã chuyển sang ${nm(areaOf(to).name)}`), () => { setArea(id, from); DIRTY = was; paintState(); toast('↩️ ' + T(`Back in ${nm(areaOf(from).name)}`, `Đã về lại ${nm(areaOf(from).name)}`)); }); return; }
      const c = CONTENT.activities[id] = { ...(CONTENT.activities[id] || {}) };
      if (f.dataset.f === 'little') { if (f.checked === base[1] < 5) delete c.little; else c.little = f.checked; }
      if (f.dataset.f === 'hide') { if (f.checked) c.hide = true; else delete c.hide; }
      if (!Object.keys(c).length) delete CONTENT.activities[id];
      r.querySelector('.gtags').innerHTML = tags(id);
    }); };
  const draw = () => {
    const rows = A.AREAS.map(a => {
      const ids = ORDER.filter(id => info(id).area === a.key);
      return `<div class="card garea" data-area="${a.key}"><h3>${a.icon} ${esc(nm(a.name))} <span class="sub"><span class="gcount">(${ids.length})</span>${a.key === 'reading' ? ' · ' + T('only while the reading trial is on', 'chỉ khi bật thử nghiệm đọc') : ''}</span></h3><table class="gtable"><tbody>${ids.map(row).join('')}</tbody></table></div>`;
    }).join('');
    P.innerHTML = `<h2>🧸 ${T('Simple screen', 'Màn hình đơn giản')}</h2><p class="sub">${T('The Simple screen shows the games one area at a time (Animals, Music, Numbers…); children under 5 see at most six at once, and only the games ticked “Under 5”. Move a game to another area, or hide it from the Simple screen (it stays in the valley).', 'Màn hình đơn giản cho xem trò chơi theo từng khu (Con vật, Âm nhạc, Con số…); bé dưới 5 tuổi chỉ thấy tối đa sáu trò mỗi lần, và chỉ những trò được đánh dấu “Dưới 5 tuổi”. Có thể chuyển trò sang khu khác, hoặc ẩn khỏi màn hình đơn giản (vẫn còn trong thung lũng).')} ${T('Tap a game to open it: its group, Under 5 and Hide are there.', 'Chạm vào một trò để mở: nhóm, Dưới 5 tuổi và Ẩn ở trong đó.')}</p>
      ${rows}<div class="bar"><button class="btn ghost" id="reset">↩️ ${T('Back to the usual', 'Về mặc định')}</button><button class="btn" id="save">💾 ${T('Save', 'Lưu')}</button></div>`;
    P.querySelectorAll('tr[data-id]').forEach(bind);
    $('#reset').onclick = () => { CONTENT.activities = {}; draw(); };
    $('#save').onclick = () => saveContent().catch(fail);
  };
  draw();
};
// ---------- 🎵 Music (round N): the family's own recordings, and where each one plays ----------
PAGES.music = async P => {
  CONTENT.music = CONTENT.music || [];
  const TAGS = [['lullaby', '🌙', 'Lullaby (hát ru)', 'Hát ru'], ['tet', '🧧', 'Tết', 'Tết'], ['midautumn', '🏮', 'Trung Thu', 'Trung Thu'], ['christmas', '🎄', 'Christmas', 'Giáng Sinh'], ['diwali', '🪔', 'Diwali', 'Diwali'], ['ausday', '🇦🇺', 'Australia Day', 'Ngày Nước Úc'], ['vn', '🏮', 'Vietnam areas', 'Khu Việt Nam'], ['kids', '🎈', 'Children’s songs', 'Thiếu nhi']];
  const draw = () => {
    P.innerHTML = `<h2>🎵 ${T('Music', 'Âm nhạc')}</h2><p class="sub">${T('Add your own recordings: a lullaby sung by Mum or Grandma, a Tết or Trung Thu song you have the rights to. Tick where each one plays: it is used instead of the built-in tune there, and it appears under “Our family’s songs” on the children’s 🎵 Songs page. MP3, up to 4 MB each.', 'Thêm bản ghi của nhà mình: bài hát ru mẹ hoặc bà hát, bài hát Tết hay Trung Thu mà bạn có quyền dùng. Đánh dấu nơi phát: bài sẽ thay nhạc có sẵn ở đó, và hiện trong “Bài hát của nhà mình” trên trang 🎵 Bài hát của các con. MP3, tối đa 4 MB mỗi bài.')}</p>
      ${CONTENT.music.map((m, i) => `<div class="card" data-i="${i}"><div class="row"><div><label>🇦🇺 ${T('Name', 'Tên')}</label><input type="text" data-f="en" value="${esc(m.en || '')}"></div><div><label>🇻🇳 ${T('Name', 'Tên')}</label><input type="text" data-f="vi" value="${esc(m.vi || '')}"></div><button class="btn small bad" data-rm style="flex:0 0 auto">🗑️</button></div>
        <audio controls preload="none" src="${GAME + esc(m.file)}" style="width:100%;margin:8px 0"></audio>
        <div class="row" style="gap:6px">${TAGS.map(([k, ic, en, vi]) => `<label style="flex:0 0 auto;font-weight:400"><input type="checkbox" data-t="${k}" ${(m.tags || []).includes(k) ? 'checked' : ''}> ${ic} ${T(en, vi)}</label>`).join('')}</div></div>`).join('') || `<div class="card note">${T('No recordings yet.', 'Chưa có bản ghi nào.')}</div>`}
      <div class="bar"><label class="btn ghost" for="mfile">➕ ${T('Add an MP3', 'Thêm MP3')}</label><input type="file" id="mfile" accept="audio/mpeg,.mp3" hidden><button class="btn" id="save">💾 ${T('Save', 'Lưu')}</button></div>`;
    P.querySelectorAll<HTMLInputElement>('[data-i]').forEach(c => { const m = CONTENT.music[+c.dataset.i];
      c.querySelectorAll<HTMLInputElement>('[data-f]').forEach(f => f.oninput = () => { m[f.dataset.f] = f.value; });
      c.querySelectorAll<HTMLInputElement>('[data-t]').forEach(f => f.onchange = () => { m.tags = TAGS.map(t => t[0]).filter(k => c.querySelector<HTMLInputElement>(`[data-t="${k}"]`).checked); });
      c.querySelector<HTMLInputElement>('[data-rm]').onclick = () => { CONTENT.music.splice(+c.dataset.i, 1); draw(); }; });
    $('#mfile').onchange = e => { const f = fileOf(e); if (!f) return; if (f.size > 4 * 1024 * 1024) { toast(T('That file is over 4 MB.', 'Tệp lớn hơn 4 MB.')); return; }
      const rd = new FileReader(); rd.onload = async () => { try { const name = f.name.replace(/\.mp3$/i, ''); const r = await api('musicfile', { id: name, dataUrl: String(rd.result).replace(/^data:audio\/[^;]*;/, 'data:audio/mpeg;') });
        CONTENT.music.push({ id: name.replace(/[^\w-]/g, '').slice(0, 30) || 'song', file: r.file, en: name, vi: name, tags: ['lullaby'] }); draw(); toast(T('Added. Tick where it plays, then Save.', 'Đã thêm. Đánh dấu nơi phát rồi bấm Lưu.')); } catch (err) { fail(err); } }; rd.readAsDataURL(f); };
    $('#save').onclick = () => saveContent().catch(fail);
  };
  draw();
};
// ---------- defaults sent to every device (applied once each time they change here) ----------
PAGES.play = async P => {
  // (owner, 10 Oct) the valley's things can also be switched in Releases, with dates: when Releases has a setting, it wins (js/custom.js featureOn)
  let LR = {}; try { LR = (await loadLive()).releases || {}; } catch (e) { }
  const wins = id => LR[id] ? `<p class="note warn">${T('Releases has its own setting for this, and that one wins.', 'Ra mắt có cài đặt riêng cho mục này, và cài đặt đó được dùng.')} <button class="btn small ghost" data-torel>${T('Open Releases', 'Mở Ra mắt')}</button></p>` : '';
  const d = CONTENT.defaults || {}, opt = (k, list) => list.map(([v, l]) => `<option value="${v}" ${String(d[k] ?? '') === String(v) ? 'selected' : ''}>${l}</option>`).join('');
  const keep = `<option value="">${T('(leave as each device has it)', '(giữ như trên từng máy)')}</option>`;
  P.innerHTML = `<h2>⏰ ${T('Defaults for every device', 'Mặc định cho mọi máy')}</h2><p class="sub">${T('Choose here once for all the children’s devices. Each device takes the new values the next time it opens the game online; a grown-up can still change them on the device.', 'Chọn ở đây một lần cho mọi máy của các con. Mỗi máy nhận giá trị mới khi mở game có mạng lần tới; người lớn vẫn đổi được trên máy.')}</p>
  <div class="card grid">
    <div><label>🌙 ${T('Rest reminder after', 'Nhắc nghỉ sau')}</label><select data-k="restMins">${keep}${opt('restMins', [[0, T('Never', 'Không nhắc')], [15, '15 ' + T('minutes', 'phút')], [20, '20 ' + T('minutes', 'phút')], [30, '30 ' + T('minutes', 'phút')], [45, '45 ' + T('minutes', 'phút')], [60, '60 ' + T('minutes', 'phút')]])}</select></div>
    <div><label>🌏 ${T('Language', 'Ngôn ngữ')}</label><select data-k="lang">${keep}${opt('lang', [['en', '🇦🇺 English'], ['vi', '🇻🇳 Tiếng Việt']])}</select></div>
    <div><label>🗣️ ${T('Bilingual voice', 'Giọng song ngữ')}</label><select data-k="bilingual">${keep}${opt('bilingual', [['true', T('On', 'Bật')], ['false', T('Off', 'Tắt')]])}</select></div>
    <div><label>💰 ${T('Money', 'Tiền tệ')}</label><select data-k="currency">${keep}${opt('currency', [['AUD', 'AUD $'], ['VND', 'VND đ']])}</select></div>
    <div><label>💬 ${T('Captions', 'Phụ đề')}</label><select data-k="captions">${keep}${opt('captions', [['true', T('On', 'Bật')], ['false', T('Off', 'Tắt')]])}</select></div>
    <div><label>🌿 ${T('Calm mode', 'Chế độ êm dịu')}</label><select data-k="calm">${keep}${opt('calm', [['true', T('On', 'Bật')], ['false', T('Off', 'Tắt')]])}</select></div>
    <div><label>🔠 ${T('Text size', 'Cỡ chữ')}</label><select data-k="textSize">${keep}${opt('textSize', [[0, T('Normal', 'Bình thường')], [1, T('Big', 'To')], [2, T('Bigger', 'To hơn')]])}</select></div>
    <div><label>🎵 ${T('Music', 'Nhạc')}</label><select data-k="music">${keep}${opt('music', [['true', T('On', 'Bật')], ['false', T('Off', 'Tắt')]])}</select></div>
  </div>
  <h2>🏙️ ${T('Things in the valley', 'Đồ vật trong thung lũng')}</h2><p class="sub">${T('Kept in the game, shown only when switched on. Game → Releases can switch these too, from a chosen day; when Releases has a setting for one, that one wins.', 'Vẫn giữ trong game, chỉ hiện khi bật. Trò chơi → Ra mắt cũng bật tắt được các mục này, từ ngày bạn chọn; khi Ra mắt có cài đặt cho mục nào, cài đặt đó được dùng.')}</p>
  <div class="card grid">
    <div><label>🔌 ${T('Power poles and wires on Phố Hai Quê', 'Cột điện và dây điện ở Phố Hai Quê')}</label><select data-f="powerPoles">${[[false, T('Off', 'Tắt')], [true, T('On', 'Bật')]].map(([v, l]) => `<option value="${v}" ${((CONTENT.features || {}).powerPoles === true) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>${wins('powerPoles')}</div>
    <div><label>🛵 ${T('Motorbikes, cars, buses on the roads', 'Xe máy, xe hơi, xe buýt trên đường')}</label><select data-f="traffic">${[[true, T('On', 'Bật')], [false, T('Off', 'Tắt')]].map(([v, l]) => `<option value="${v}" ${((CONTENT.features || {}).traffic !== false) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>${wins('traffic')}</div>
    <div><label>🚋 ${T('Parked bikes and cars, trams, xích lô and Hồ Gươm cart in the cities', 'Xe đậu, tàu điện, xích lô và xe điện Hồ Gươm trong thành phố')}</label><select data-f="cityVehicles">${[[true, T('On', 'Bật')], [false, T('Off', 'Tắt')]].map(([v, l]) => `<option value="${v}" ${((CONTENT.features || {}).cityVehicles !== false) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>${wins('cityVehicles')}</div>
    <div><label>🚲 ${T('Bicycles children can ride', 'Xe đạp cho các con đạp')}</label><select data-f="rideBikes">${[[true, T('On', 'Bật')], [false, T('Off', 'Tắt')]].map(([v, l]) => `<option value="${v}" ${((CONTENT.features || {}).rideBikes !== false) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>${wins('rideBikes')}</div>
    <div><label>🚲 ${T('Xích lô rides in Sài Gòn and Hà Nội', 'Đi xích lô ở Sài Gòn và Hà Nội')}</label><select data-f="xichloRides">${[[true, T('On', 'Bật')], [false, T('Off', 'Tắt')]].map(([v, l]) => `<option value="${v}" ${((CONTENT.features || {}).xichloRides !== false) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>${wins('xichloRides')}</div>
    <div><label>🚗 ${T('Real-looking vehicles when every child playing is 5 or older', 'Xe trông như thật khi tất cả các con đang chơi từ 5 tuổi')}</label><select data-f="realVehicles">${[[true, T('On', 'Bật')], [false, T('Off', 'Tắt')]].map(([v, l]) => `<option value="${v}" ${((CONTENT.features || {}).realVehicles !== false) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>${wins('realVehicles')}</div>
    <div><label>🎥 ${T('Stories and how-to guides as 3D films (where a film is made)', 'Truyện và hướng dẫn thành phim 3D (khi đã có phim)')}</label><select data-f="storyFilms">${[[true, T('On', 'Bật')], [false, T('Off', 'Tắt')]].map(([v, l]) => `<option value="${v}" ${((CONTENT.features || {}).storyFilms !== false) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>${wins('storyFilms')}</div>
  </div>
  <div class="bar"><button class="btn" id="save">💾 ${T('Save', 'Lưu')}</button></div>`;
  P.querySelectorAll<HTMLInputElement>('[data-torel]').forEach(b => b.onclick = () => go('releases'));
  $('#save').onclick = () => {
    const out = {}; P.querySelectorAll<HTMLInputElement>('[data-k]').forEach(s => { const v = s.value; if (v === '') return; out[s.dataset.k] = v === 'true' ? true : v === 'false' ? false : /^\d+$/.test(v) ? +v : v; });
    CONTENT.defaults = out;
    const f = Object.assign({}, CONTENT.features); P.querySelectorAll<HTMLInputElement>('[data-f]').forEach(s => { f[s.dataset.f] = s.value === 'true'; }); CONTENT.features = f;
    saveContent().catch(fail);
  };
};
// ---------- Ra mắt (Releases) and Festivals (round R, owner: "instant, no deploy") ----------
// Online, these save straight to the website and reach the devices the next time they open the game (festivals change
// as soon as a device hears). On the family's computer (SparkleStudio.exe) they go into the content pack and need Publish.
// (owner, 10 Oct) game names and areas come from the game, in the game's language: set it to Studio's
const gameLang = async () => { try { const S = await import(GAME + 'js/state.js'); S.settings.lang = LANG; } catch (e) { } };
const loadLive = async () => INFO && INFO.online ? await api('live') : { releases: CONTENT.releases || {}, festivals: CONTENT.festivals || {} };
const saveLive = async live => { if (INFO && INFO.online) { await api('live', live); markSaved(); toast('✅ ' + T('Saved and live now (no Publish needed): the children’s devices get it the next time they open the game.', 'Đã lưu và có hiệu lực ngay (không cần Phát hành): máy của các con nhận được khi mở game lần tới.'), 'good'); } else { CONTENT.releases = live.releases; CONTENT.festivals = live.festivals; await saveContent(); } };
const isoDay = d => d.toISOString().slice(0, 10), plusDays = n => isoDay(new Date(Date.now() + n * 864e5));
// (owner, 10 Oct) these two pages save differently from the others: said at the top of each
const liveNote = () => `<div class="card livenote"><p class="${INFO && INFO.online ? 'ok' : 'note'}">${INFO && INFO.online ? '⚡ ' + T('Save here puts it live at once: no Publish needed. Each device gets it the next time it opens the game.', 'Bấm Lưu ở đây là có hiệu lực ngay: không cần Phát hành. Mỗi máy nhận được khi mở game lần tới.') : '✏️ ' + T('On this computer, Save keeps it with the family’s files: press Publish afterwards to send it to the children.', 'Trên máy này, Lưu giữ cùng tệp của gia đình: sau đó bấm Phát hành để gửi tới các con.')}</p></div>`;
const moreBtn = () => `<td class="more"><button class="btn small ghost" data-more>${T('More', 'Thêm')} ▾</button></td>`;
const bindMore = P => P.querySelectorAll('[data-more]').forEach(b => b.onclick = () => b.closest('tr').classList.toggle('open'));
// (owner, 13 Oct AEDT: "the Releases page looks very cramped: make it more interactive, easy for the eyes and smartly
// designed") each group is a section that opens and closes, with how many are on and All on / All off; each feature is
// a card with a big switch, a status in words (On, Off, Starts 20 Oct, Ends in 5 days, "New" for 3 days) and a Schedule
// button that opens its dates; a search and filters at the top; Save sits at the bottom of the screen and counts the
// changes. The auto play and tester settings open under their own cards (each added once, even if the page is drawn
// twice), and the testers' sneak peeks are picked by group (All / None, a search, a count).
const REL_ICON = { story: '🏮', kids: '🧸', rewards: '🎁', world: '🏞️', festivals: '🎉', tools: '🧰', trial: '📚' };
PAGES.releases = P => drawReleases(P, false);
PAGES.lab = P => drawReleases(P, true);
async function drawReleases(P, lab) {
  const myDraw = P.dataset.draw = String((+P.dataset.draw || 0) + 1), stale = () => P.dataset.draw !== myDraw || cur !== (lab ? 'lab' : 'releases');
  const [{ RELEASES, RELEASE_GROUPS }, live, {festivalSwitchedOn}] = await Promise.all([import(GAME + 'js/content/releases.js'), loadLive(),import(GAME+'js/content/festival-visibility.js')]);
  if (stale()) return;
  const R = live.releases || {}, inScope = x => lab === ['tester', 'autoplay'].includes(x.id);
  const isOn = x => { const r = R[x.id] || {};if(x.id.startsWith('fest_'))return festivalSwitchedOn(live.festivals?.[x.id.slice(5)],r); if (x.id === 'wayfind' && r.controlVersion !== 1) return false; return typeof r.on === 'boolean' ? r.on : x.def; };
  const fmtDay = d => d ? new Date(d + 'T12:00:00').toLocaleDateString(LANG === 'vi' ? 'vi-VN' : 'en-AU', { day: 'numeric', month: 'short' }) : '';
  const status = (on, r) => { const today = isoDay(new Date()), out = [];
    if (!on) out.push(['off', '⏸️ ' + T('Off', 'Tắt')]);
    else if (r.start && r.start > today) out.push(['soon', '📅 ' + T(`Starts ${fmtDay(r.start)}`, `Bắt đầu ${fmtDay(r.start)}`)]);
    else out.push(['on', '✅ ' + T('On', 'Bật')]);
    if (on && r.days) { const end = new Date(new Date((r.start || today) + 'T12:00:00').getTime() + r.days * 864e5), left = Math.ceil((end.getTime() - Date.now()) / 864e5);
      out.push([left > 0 ? 'end' : 'off', left > 0 ? '⏳ ' + T(`Ends in ${left} day${left === 1 ? '' : 's'}`, `Kết thúc sau ${left} ngày`) : '⌛ ' + T('Finished', 'Đã hết')]); }
    if (on && r.newDays) out.push(['new', '✨ ' + T(`“New” for ${r.newDays} day${r.newDays === 1 ? '' : 's'}`, `“Mới” trong ${r.newDays} ngày`)]);
    return out.map(([k, t]) => `<span class="rs ${k}">${t}</span>`).join(''); };
  const card = x => { const r = R[x.id] || {}, on = isOn(x), sched = !!(r.start || r.days || r.newDays);
    return `<div class="relc${on ? ' on' : ''}${sched ? ' sched' : ''}" data-id="${x.id}">
      <div class="relc-top"><label class="tog" title="${T('On or off', 'Bật hoặc tắt')}"><input type="checkbox" data-r="on" ${on ? 'checked' : ''}><span></span></label>
        <div class="relc-name">${x.icon ? x.icon + ' ' : ''}${esc(T(x.en, x.vi))}<div class="relc-st">${status(on, r)}</div></div>
        <button class="btn small ghost relc-more" data-more aria-expanded="false">📅 ${T('Schedule', 'Lịch')}</button></div>
      <div class="relc-opt" hidden>
        <label>${T('Starts', 'Bắt đầu')}<input type="date" data-r="start" value="${esc(r.start || '')}"></label>
        <div class="chips">${[0, 1, 3, 7].map(n => `<button type="button" class="chip" data-in="${n}">${n ? T(`in ${n} days`, `${n} ngày nữa`) : T('today', 'hôm nay')}</button>`).join('')}<button type="button" class="chip" data-in="">${T('no date', 'không ngày')}</button></div>
        <label>${T('Days on (empty: always)', 'Số ngày (trống: luôn luôn)')}<input type="number" min="0" max="3650" data-r="days" value="${r.days || ''}" placeholder="${T('always', 'luôn')}"></label>
        <label>${T('“New” badge for (days)', 'Nhãn “Mới” trong (ngày)')}<input type="number" min="0" max="365" data-r="newDays" value="${r.newDays || ''}" placeholder="0"></label>
      </div></div>`; };
  const allGroups = Object.entries<[string, string]>(RELEASE_GROUPS).map(([g, [en, vi]]) => ({ g, en, vi, items: RELEASES.filter(x => x.group === g) }));
  const groups = allGroups.map(g => ({ ...g, items: g.items.filter(inScope) })).filter(g => g.items.length);
  const closed = folds(), gkey = g => 'releases:group:' + g;
  P.innerHTML = `<h2>🆕 ${lab ? T('Sparkle Lab', 'Phòng thử Sparkle') : T('Releases', 'Ra mắt')}</h2><p class="sub">${T('Switch anything on or off. 📅 Schedule picks the day it starts, how long it stays and how long it shows a “New” badge. Switching off never takes away what a child already has.', 'Bật hoặc tắt bất cứ thứ gì. 📅 Lịch chọn ngày bắt đầu, ở lại bao lâu và nhãn “Mới” bao lâu. Tắt đi không lấy mất những gì con đã có.')}</p>
    <div class="relbar card"><input type="search" id="relq" placeholder="${T('Find a feature…', 'Tìm một tính năng…')}" aria-label="${T('Find a feature', 'Tìm tính năng')}">
      <div class="chips" id="relf">${[['all', T('All', 'Tất cả')], ['on', '✅ ' + T('On', 'Bật')], ['off', '⏸️ ' + T('Off', 'Tắt')], ['sched', '📅 ' + T('Scheduled', 'Có lịch')]].map(([k, t], i) => `<button type="button" class="chip${i ? '' : ' on'}" data-f="${k}">${t}</button>`).join('')}</div>
      <p class="note" id="relsum"></p></div>
    ${groups.map(G => `<details class="relg" data-g="${G.g}" ${closed[gkey(G.g)] ? '' : 'open'}><summary><span class="gi">${REL_ICON[G.g] || '📦'}</span><b>${T(G.en, G.vi)}</b><span class="relg-n"></span>
      <span class="relg-all"><button type="button" class="btn small ghost" data-all="1">${T('All on', 'Bật hết')}</button><button type="button" class="btn small ghost" data-all="0">${T('All off', 'Tắt hết')}</button></span></summary>
      <div class="relgrid">${G.items.map(card).join('')}</div></details>`).join('')}
    ${lab && CAN('site') ? `<section class="card bot-config"><h3>🤖 ${T('Nightly Cloud Bot Testing', 'Kiểm thử bot đám mây ban đêm')}</h3><p class="note">${T('Set a nightly schedule and bot profile. Save to persist these settings.', 'Thiết lập lịch ban đêm và hồ sơ bot. Bấm Lưu để lưu cài đặt.')}</p><div class="bot-fields"><label class="chk"><input id="bot-enabled" type="checkbox"> ${T('Enable scheduled testing', 'Bật kiểm thử theo lịch')}</label><label>${T('Schedule', 'Lịch')}<select id="bot-schedule"><option value="day-night">${T('Day & night', 'Ngày và đêm')}</option><option value="custom">${T('Custom UTC time', 'Giờ UTC tùy chỉnh')}</option></select><input id="bot-time" type="time" value="02:00" aria-label="UTC time"></label><label>${T('Bot count', 'Số bot')} <input id="bot-count" type="number" min="1" max="10" value="5"></label><label>${T('Minutes per bot', 'Số phút mỗi bot')} <input id="bot-duration" type="number" min="1" max="30" value="5"></label><label>${T('Behavior profile', 'Hồ sơ hành vi')}<select id="bot-profile"><option value="chaos-toddler">${T('Chaotic Toddler Mashing', 'Bé nghịch ngợm')}</option><option value="gentle-explorer">${T('Gentle Explorer', 'Nhà thám hiểm nhẹ nhàng')}</option><option value="max-competence">${T('Max Competence', 'Thành thạo tối đa')}</option></select></label></div><div class="bar"><button type="button" class="btn" id="bot-run">▶️ ${T('Run Headless Bot Test Now', 'Chạy kiểm thử bot ngay')}</button><span class="note" id="bot-result"></span></div></section>` : ''}
    <div class="bar relsave"><span class="note" id="relch"></span><button class="btn" id="save">💾 ${T('Save', 'Lưu')}</button></div>`;
  P.querySelector('.sub').after(document.createRange().createContextualFragment(liveNote()));
  if (lab) { P.querySelector('.sub').textContent = T('Report problems and run automatic checks. Choose tester devices, checking speed and how their progress is restored.', 'Báo lỗi và chạy tự kiểm tra. Chọn máy thử, tốc độ kiểm tra và cách khôi phục tiến trình.'); if (canSee('testers')) { const link = document.createElement('button'); link.className = 'btn ghost'; link.textContent = T('Open tester reports', 'Mở báo cáo người thử'); link.onclick = () => go('testers'); P.querySelector('.sub').after(link); } }
  // counts, the group numbers and what has changed since the page opened
  const start = JSON.stringify([...P.querySelectorAll('.relc')].map(c => [c.querySelector('[data-r="on"]').checked, ...['start', 'days', 'newDays'].map(k => c.querySelector(`[data-r="${k}"]`).value)]));
  const sum = () => { const cs = [...P.querySelectorAll('.relc')], on = cs.filter(c => c.querySelector('[data-r="on"]').checked).length;
    $('#relsum').textContent = T(`${on} of ${cs.length} on · ${cs.filter(c => c.classList.contains('sched')).length} with a schedule`, `${on}/${cs.length} đang bật · ${cs.filter(c => c.classList.contains('sched')).length} có lịch`);
    P.querySelectorAll('details.relg').forEach(d => { const c = [...d.querySelectorAll('.relc')]; d.querySelector('.relg-n').textContent = T(`${c.filter(x => x.querySelector('[data-r="on"]').checked).length} of ${c.length} on`, `${c.filter(x => x.querySelector('[data-r="on"]').checked).length}/${c.length} bật`); });
    const now = [...P.querySelectorAll('.relc')].map(c => [c.querySelector('[data-r="on"]').checked, ...['start', 'days', 'newDays'].map(k => c.querySelector(`[data-r="${k}"]`).value)]);
    const n = JSON.parse(start).filter((x, i) => JSON.stringify(x) !== JSON.stringify(now[i])).length;
    $('#relch').textContent = n ? T(`${n} change${n === 1 ? '' : 's'} not saved yet`, `${n} thay đổi chưa lưu`) : ''; P.querySelector('.relsave').classList.toggle('dirty', !!n); };
  const restatus = c => { const r = { start: c.querySelector('[data-r="start"]').value, days: +c.querySelector('[data-r="days"]').value || 0, newDays: +c.querySelector('[data-r="newDays"]').value || 0 }, on = c.querySelector('[data-r="on"]').checked;
    c.classList.toggle('on', on); c.classList.toggle('sched', !!(r.start || r.days || r.newDays)); c.querySelector('.relc-st').innerHTML = status(on, r); sum(); };
  P.querySelectorAll('.relc').forEach(c => { c.querySelectorAll('input').forEach(i => i.addEventListener(i.type === 'checkbox' ? 'change' : 'input', () => restatus(c)));
    c.querySelector('[data-more]').onclick = e => { e.preventDefault(); const o = c.querySelector('.relc-opt'); o.hidden = !o.hidden; e.currentTarget.setAttribute('aria-expanded', String(!o.hidden)); };
    c.querySelectorAll('[data-in]').forEach(b => b.onclick = () => { c.querySelector('[data-r="start"]').value = b.dataset.in === '' ? '' : plusDays(+b.dataset.in); restatus(c); }); });
  P.querySelectorAll('details.relg').forEach(d => { d.addEventListener('toggle', () => keepFold(gkey(d.dataset.g), d.open));
    d.querySelectorAll('[data-all]').forEach(b => b.onclick = e => { e.preventDefault(); e.stopPropagation(); d.querySelectorAll('.relc').forEach(c => { c.querySelector('[data-r="on"]').checked = b.dataset.all === '1'; restatus(c); }); }); });
  // search and filters
  let fil = 'all'; const filt = () => { const q = $('#relq').value.trim().toLowerCase();
    P.querySelectorAll('.relc').forEach(c => { const on = c.querySelector('[data-r="on"]').checked; c.hidden = (q && !c.textContent.toLowerCase().includes(q)) || (fil === 'on' && !on) || (fil === 'off' && on) || (fil === 'sched' && !c.classList.contains('sched')); });
    P.querySelectorAll('details.relg').forEach(d => { const any = [...d.querySelectorAll('.relc')].some(c => !c.hidden); d.hidden = !any; if ((q || fil !== 'all') && any) d.open = true; }); };
  $('#relq').oninput = filt; P.querySelectorAll('#relf [data-f]').forEach(b => b.onclick = () => { fil = b.dataset.f; P.querySelectorAll('#relf [data-f]').forEach(x => x.classList.toggle('on', x === b)); filt(); });
  sum();
  // (owner, 12 Oct) the auto play check: on every device, or only on the ones ticked here (from the players report)
  let deviceError = false;
  const devsP = lab ? api('players').then(r => (r && r.devices) || []).catch(() => { deviceError = true; return []; }) : Promise.resolve([]);
  const deviceNotice = () => deviceError ? `<p class="badtxt">${T('Could not load the device report. Saved settings are kept; reopen Sparkle Lab to retry.', 'Không tải được báo cáo máy. Các thiết lập đã lưu được giữ; mở lại Phòng thử Sparkle để thử lại.')}</p>` : '';
  { const c = P.querySelector('.relc[data-id="autoplay"]');
    if (c && !P.querySelector('#apdev')) { const box = document.createElement('div'); box.className = 'relpanel'; box.id = 'apdev'; c.classList.add('wide'); c.appendChild(box);
      box.innerHTML = `<h4>📱 ${T('Which devices show the auto play window', 'Máy nào hiện cửa sổ tự chơi')}</h4><p class="note">${T('None ticked: every device (while the switch is on). Tick them under Devices with the Auto play chip.', 'Không chọn máy nào: mọi máy (khi công tắc bật). Chọn ở mục Các máy bằng nút Tự chơi.')}</p><p><button type="button" class="btn small ghost" data-todevs>📱 ${T('Choose devices', 'Chọn máy')}</button></p>`; } }
  // (owner, 12 Oct) testers: which devices, each one's level, and the sneak peeks (releases testers see early)
  { const c = P.querySelector('.relc[data-id="tester"]'), TR = R.tester || {}, mine = new Set(TR.devices || []), lv = TR.levels || {}, pk = new Set(TR.peeks || []);
    if (c && !P.querySelector('#tdev')) { const box = document.createElement('div'); box.className = 'relpanel'; box.id = 'tdev'; c.classList.add('wide'); c.appendChild(box);
      const peekable = RELEASES.filter(x => !['autoplay', 'tester'].includes(x.id));
      const peekGroup = G => { const items = peekable.filter(x => x.group === G.g); if (!items.length) return '';
        const off = items.filter(x => !isOn(x)), on = items.filter(x => isOn(x)), lab = x => `<label class="chk peek${isOn(x) ? ' already' : ''}"><input type="checkbox" data-peek="${esc(x.id)}" ${pk.has(x.id) ? 'checked' : ''}> ${x.icon ? x.icon + ' ' : ''}${esc(T(x.en, x.vi))}</label>`;
        return `<details class="pkg" data-g="${G.g}"><summary><span class="gi">${REL_ICON[G.g] || '📦'}</span><b>${T(G.en, G.vi)}</b> <span class="pkn"></span><span class="relg-all"><button type="button" class="btn small ghost" data-pall="1">${T('All', 'Hết')}</button><button type="button" class="btn small ghost" data-pall="0">${T('None', 'Bỏ hết')}</button></span></summary>
          ${off.map(lab).join('')}${on.length ? `<p class="note">${T('Already on for everyone:', 'Đã bật cho mọi người:')}</p>${on.map(lab).join('')}` : ''}</details>`; };
      box.innerHTML = `<h4>🐞 ${T('Which devices are testers, and how', 'Máy nào là người thử, và thế nào')}</h4><p class="note">${T('None ticked: every device (while the switch is on). A tester accepts what is collected the first time, on the device.', 'Không chọn máy nào: mọi máy (khi công tắc bật). Người thử đồng ý với những gì được thu thập lần đầu, trên máy.')}</p><p class="note">${T('Tick them under Devices with the Tester chip, each with its own settings.', 'Chọn ở mục Các máy bằng nút Người thử, mỗi máy có cài đặt riêng.')}</p><p><button type="button" class="btn small ghost" data-todevs>📱 ${T('Choose devices', 'Chọn máy')}</button></p>
        <h4>↩️ ${T('When someone stops being a tester', 'Khi ai đó thôi làm người thử')}</h4><p class="note">${T('These are defaults. Each device’s choice takes priority.', 'Đây là thiết lập mặc định. Lựa chọn của từng máy được ưu tiên.')}</p><div class="revert">${[['keep', 'Keep all progress after testing', 'Giữ mọi tiến trình sau khi thử'], ['progress', 'Everything since they became a tester goes back (badges, stickers and clothes stay)', 'Mọi tiến bộ từ khi làm người thử được trả lại (huy hiệu, nhãn dán và quần áo vẫn giữ)'], ['autoplay', 'Only what auto play did goes back, after each run (what they played themselves stays)', 'Chỉ trả lại phần tự chơi đã làm, sau mỗi lần chạy (phần con tự chơi vẫn giữ)']].map(([k, en, vi]) => `<label class="chk"><input type="radio" name="trevert" data-trevert="${k}" ${(['keep', 'autoplay', 'progress'].includes(TR.revert) ? TR.revert : 'progress') === k ? 'checked' : ''}> ${T(en, vi)}</label>`).join('')}</div>
        <h4>👀 ${T('Sneak peeks: testers see these early', 'Xem trước: người thử thấy sớm')} <span class="pill" id="pkcount"></span></h4><input type="search" id="pkq" placeholder="${T('Find a feature…', 'Tìm một tính năng…')}"><div id="tpk">${allGroups.map(peekGroup).join('')}</div>`;
      const pcount = () => { box.querySelector<HTMLInputElement>('#pkcount').textContent = T(`${box.querySelectorAll<HTMLInputElement>('[data-peek]:checked').length} picked`, `đã chọn ${box.querySelectorAll<HTMLInputElement>('[data-peek]:checked').length}`);
        box.querySelectorAll<HTMLInputElement>('details.pkg').forEach(d => { d.querySelector<HTMLInputElement>('.pkn').textContent = `${d.querySelectorAll<HTMLInputElement>('[data-peek]:checked').length}/${d.querySelectorAll<HTMLInputElement>('[data-peek]').length}`; }); };
      box.querySelectorAll<HTMLInputElement>('[data-peek]').forEach(i => i.onchange = pcount);
      box.querySelectorAll<HTMLInputElement>('details.pkg').forEach(d => d.querySelectorAll<HTMLInputElement>('[data-pall]').forEach(b => b.onclick = e => { e.preventDefault(); e.stopPropagation(); d.querySelectorAll<HTMLInputElement>('[data-peek]').forEach(i => { i.checked = b.dataset.pall === '1'; }); pcount(); }));
      box.querySelector<HTMLInputElement>('#pkq').oninput = e => { const q = val(e).trim().toLowerCase(); box.querySelectorAll<HTMLInputElement>('label.peek').forEach(l => { l.hidden = q && !l.textContent.toLowerCase().includes(q); }); if (q) box.querySelectorAll<HTMLDetailsElement>('details.pkg').forEach(d => { d.open = true; }); };
      pcount(); } }
  // (r85, owner 18 Oct AEDT) one card per device for testers and auto play: line 1 the device's name and the children,
  // line 2 (small, grey) the device, system, browser, town and last seen; the Tester and Auto play chips each open that
  // feature's settings for this device only. The settings saved are the same as before (Save below reads them).
  if (lab && P.querySelector('.relc[data-id="tester"]') && !P.querySelector('#devs')) {
    const TR = R.tester || {}, tmine = new Set(TR.devices || []), lv = TR.levels || {}, amine = new Set((R.autoplay && R.autoplay.devices) || []);
    const sec = document.createElement('section'); sec.className = 'card devsec'; sec.id = 'devs';
    sec.innerHTML = `<h3>📱 ${T('Devices: testers and auto play', 'Các máy: người thử và tự chơi')}</h3><p class="note">${T('Tap Tester or Auto play on a device to choose it and its settings. None ticked: every device (while that switch is on).', 'Chạm Người thử hoặc Tự chơi trên một máy để chọn máy đó và cài đặt của nó. Không chọn máy nào: mọi máy (khi công tắc đó bật).')}</p><div id="tdl" class="devcards">${T('Loading the devices…', 'Đang tải danh sách máy…')}</div>`;
    P.querySelector('.relsave').before(sec);
    P.querySelectorAll('[data-todevs]').forEach(b => b.onclick = e => { e.preventDefault(); sec.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
    const devs = (await devsP).slice(); if (stale()) return;
    for (const id of new Set([...tmine, ...amine, ...Object.keys(lv), ...Object.keys(TR.policies || {})])) if (!devs.some(d => d.id === id)) devs.push({ id, label: '', kind: '?' });
    const chip = (k, on) => `<button type="button" class="chip devchip${on ? ' on' : ''}" data-open="${k}" aria-expanded="false">${k === 'tester' ? '🐞 ' + T('Tester', 'Người thử') : '🤖 ' + T('Auto play', 'Tự chơi')} · <span>${on ? T('On', 'Bật') : T('Off', 'Tắt')}</span></button>`;
    $('#tdl').innerHTML = deviceNotice() + (devs.length ? devs.map(d => { const kids = devKids(d);
      return `<div class="devcard devrow${isRobot(d) ? ' robot' : ''}" data-devrow="${esc(d.id)}">
        <div class="dc1"><b class="dname">${esc(devTitle(d))}</b>${isRobot(d) ? ` <span class="pill robot">🤖 ${T('probably a robot', 'có lẽ là máy tự động')}</span>` : ''}${kids.length ? ` <span class="dkids">🧒 ${esc(kids.join(', '))}</span>` : ''}</div>
        <div class="dc2">${esc(devMeta(d))}<small class="mini">${esc(d.id)}</small></div>
        <div class="chips dchips">${chip('tester', tmine.has(d.id))}${chip('autoplay', amine.has(d.id))}</div>
        <div class="dpanel" data-panel="tester" hidden><label class="chk"><input type="checkbox" data-tdev="${esc(d.id)}" ${tmine.has(d.id) ? 'checked' : ''}> ${T('This device is a tester', 'Máy này là người thử')}</label>
        <label>${T('Progress after testing', 'Tiến trình sau khi thử')}<select data-policy="${esc(d.id)}">${[['keep','Keep all progress','Giữ mọi tiến trình'],['autoplay','Restore after each auto check','Trả lại sau mỗi lần tự kiểm tra'],['progress','Restore when testing ends','Trả lại khi kết thúc thử nghiệm']].map(([k,en,vi]) => `<option value="${k}" ${(TR.policies?.[d.id]?.revert || TR.revert || 'progress') === k ? 'selected' : ''}>${T(en,vi)}</option>`).join('')}</select></label><label>${T('Checking speed','Tốc độ kiểm tra')}<select data-speed="${esc(d.id)}">${['watch','fast'].includes(TR.policies?.[d.id]?.speed) ? `<option value="${TR.policies[d.id].speed}" selected>${TR.policies[d.id].speed === 'watch' ? T('Watch', 'Xem') : T('Quick', 'Nhanh')}</option>` : ''}${[1,2,3,5].map(n => `<option value="x${n}" ${(TR.policies?.[d.id]?.speed || 'x1') === 'x'+n ? 'selected' : ''}>${n}×</option>`).join('')}</select></label><label class="chk"><input type="checkbox" data-deviceauto="${esc(d.id)}" ${TR.policies?.[d.id]?.autoplay === false ? '' : 'checked'}>${T('Allow automatic check', 'Cho phép tự kiểm tra')}</label><select data-tlv="${esc(d.id)}" aria-label="${T('Level', 'Mức')}"><option value="ladybird" ${lv[d.id] !== 'auto' ? 'selected' : ''}>${T('Auto reports and the ladybird', 'Tự báo lỗi và con bọ rùa')}</option><option value="auto" ${lv[d.id] === 'auto' ? 'selected' : ''}>${T('Auto reports only', 'Chỉ tự báo lỗi')}</option></select></div>
        <div class="dpanel" data-panel="autoplay" hidden><label class="chk"><input type="checkbox" data-dev="${esc(d.id)}" ${amine.has(d.id) ? 'checked' : ''}> ${T('Show the auto play window on this device', 'Hiện cửa sổ tự chơi trên máy này')}</label></div></div>`; }).join('') : deviceError ? '' : `<p class="note">${T('No devices in the players report yet (a device appears after it plays with internet on).', 'Chưa có máy nào trong báo cáo (máy hiện ra sau khi chơi có mạng).')}</p>`);
    $('#tdl').querySelectorAll('.devcard').forEach(card => {
      const paint = () => card.querySelectorAll<HTMLElement>('[data-open]').forEach(b => { const on = card.querySelector<HTMLInputElement>(b.dataset.open === 'tester' ? '[data-tdev]' : '[data-dev]').checked; b.classList.toggle('on', on); b.querySelector('span').textContent = on ? T('On', 'Bật') : T('Off', 'Tắt'); });
      card.querySelectorAll<HTMLElement>('[data-open]').forEach(b => b.onclick = () => { const k = b.dataset.open, open = b.getAttribute('aria-expanded') !== 'true';
        card.querySelectorAll('[data-open]').forEach(x => x.setAttribute('aria-expanded', String(open && x === b))); card.querySelectorAll<HTMLElement>('.dpanel').forEach(x => { x.hidden = !(open && x.dataset.panel === k); }); });
      card.querySelectorAll('[data-tdev], [data-dev]').forEach(i => i.addEventListener('change', paint)); });
    devFilter($('#tdl')); }
  if (lab && CAN('site')) {
    const nb = (R as any).nightlyBots || {};
    const be = P.querySelector('#bot-enabled') as HTMLInputElement | null;
    if (be) be.checked = !!nb.enabled;
    const bs = P.querySelector('#bot-schedule') as HTMLSelectElement | null;
    if (bs && nb.schedule) bs.value = nb.schedule;
    const bt = P.querySelector('#bot-time') as HTMLInputElement | null;
    if (bt && nb.time) bt.value = nb.time;
    const bc = P.querySelector('#bot-count') as HTMLInputElement | null;
    if (bc && nb.count) bc.value = String(nb.count);
    const bp = P.querySelector('#bot-profile') as HTMLSelectElement | null;
    if (bp && nb.profile) bp.value = nb.profile;
    const bd = P.querySelector('#bot-duration') as HTMLInputElement | null;
    if (bd && nb.duration) bd.value = String(nb.duration);
    const brun = P.querySelector('#bot-run') as HTMLButtonElement | null;
    const bres = P.querySelector('#bot-result') as HTMLElement | null;
    if (brun) {
      brun.onclick = async () => {
        brun.disabled = true;
        if (bres) bres.textContent = '⏳ ' + T('Starting…', 'Đang chạy…');
        try {
          const payload = {
            enabled: (P.querySelector('#bot-enabled') as HTMLInputElement | null)?.checked ?? false,
            schedule: (P.querySelector('#bot-schedule') as HTMLSelectElement | null)?.value ?? 'day-night',
            time: (P.querySelector('#bot-time') as HTMLInputElement | null)?.value ?? '02:00',
            count: +((P.querySelector('#bot-count') as HTMLInputElement | null)?.value ?? '5'),
            duration: +((P.querySelector('#bot-duration') as HTMLInputElement | null)?.value ?? '5'),
            profile: (P.querySelector('#bot-profile') as HTMLSelectElement | null)?.value ?? 'chaos-toddler',
          };
          const res = await api('bot/run', payload);
          if (bres) {
            bres.textContent = res.ok
              ? ('✅ ' + T('Started', 'Đã khởi chạy') + (res.workflow ? ` (${res.workflow})` : ''))
              : ('❌ ' + (res.error || 'Failed'));
          }
        } catch (e: any) {
          if (bres) bres.textContent = '❌ ' + (e?.raw || e?.message || 'Error');
        } finally {
          brun.disabled = false;
        }
      };
    }
  }
  $('#save').onclick = async () => {
    try {
      const latest = await loadLive(), out = { ...(latest.releases || {}) };
      for (const x of RELEASES.filter(inScope)) delete out[x.id];
      P.querySelectorAll('.relc[data-id]').forEach(c => { const id = c.dataset.id, x = RELEASES.find(y => y.id === id), v = k => c.querySelector(`[data-r="${k}"]`).value;
        const r: Rule = {}, on = c.querySelector('[data-r="on"]').checked; if (id === 'wayfind') r.controlVersion = 1; if (on !== x.def || R[id]) r.on = on; if (v('start')) r.start = v('start'); if (+v('days') > 0) r.days = +v('days'); if (+v('newDays') > 0) { r.newDays = +v('newDays'); if (!r.start) r.since = (R[id] && R[id].since) || isoDay(new Date()); }
        if (id === 'autoplay') { const dv = [...P.querySelectorAll('[data-dev]:checked')].map(i => i.dataset.dev); if (dv.length) r.devices = dv; }
        if (id === 'tester') { const dv = [...P.querySelectorAll('[data-tdev]:checked')].map(i => i.dataset.tdev); if (dv.length) r.devices = dv;
          const policies = { ...(latest.releases?.tester?.policies || {}) }; P.querySelectorAll('[data-policy]').forEach(select => { const device = select.dataset.policy, speed = P.querySelector(`[data-speed="${CSS.escape(device)}"]`), auto = P.querySelector(`[data-deviceauto="${CSS.escape(device)}"]`); policies[device] = { revert: select.value, speed: speed.value, autoplay: auto.checked }; }); if (Object.keys(policies).length) r.policies = policies;
          const lv = { ...(latest.releases?.tester?.levels || {}) }; P.querySelectorAll('[data-tlv]').forEach(s => { if (s.value === 'auto') lv[s.dataset.tlv] = 'auto'; else delete lv[s.dataset.tlv]; }); if (Object.keys(lv).length) r.levels = lv;
          const pk = [...P.querySelectorAll('[data-peek]:checked')].map(i => i.dataset.peek); if (pk.length) r.peeks = pk;
          const revert = P.querySelector('[data-trevert]:checked')?.dataset.trevert; if (['keep', 'autoplay'].includes(revert)) r.revert = revert; }
        if (Object.keys(r).length) out[id] = r; });
        // Nightly Cloud Bot Testing config (lab only)
        if (lab && CAN('site')) {
          const botEnabled = (P.querySelector('#bot-enabled') as HTMLInputElement | null)?.checked ?? false;
          const botSchedule = (P.querySelector('#bot-schedule') as HTMLSelectElement | null)?.value ?? 'day-night';
          const botTime = (P.querySelector('#bot-time') as HTMLInputElement | null)?.value ?? '02:00';
          const botCount = +((P.querySelector('#bot-count') as HTMLInputElement | null)?.value ?? '5');
          const botProfile = (P.querySelector('#bot-profile') as HTMLSelectElement | null)?.value ?? 'chaos-toddler';
          const botDuration = +((P.querySelector('#bot-duration') as HTMLInputElement | null)?.value ?? '5');
          if (INFO?.online || botEnabled || latest.releases?.nightlyBots) {
            out.nightlyBots = { enabled: botEnabled, schedule: botSchedule, time: botTime, count: botCount, profile: botProfile, duration: botDuration };
          } else {
            delete out.nightlyBots;
          }
        }
        const festivals={...(latest.festivals||{})};
        P.querySelectorAll('.relc[data-id^="fest_"]').forEach((card:HTMLElement)=>{const id=card.dataset.id,x=RELEASES.find(f=>f.id===id),on=card.querySelector<HTMLInputElement>('[data-r="on"]').checked;
          if(on!==isOn(x))festivals[id.slice(5)]={...(festivals[id.slice(5)]||{}),on};
        });
        await saveLive({ releases: out, festivals });Object.keys(R).forEach(k=>delete R[k]);Object.assign(R,out);live.festivals=festivals;
      } catch (e) { fail(e); }
    };
}
PAGES.festivals = async P => {
  const [{ FESTCAL, GROUPS }, L, {festivalSwitchedOn}] = await Promise.all([import(GAME + 'js/content/festcal.js'), import(GAME + 'js/lunar.js'),import(GAME+'js/content/festival-visibility.js')]), live = await loadLive(), F = live.festivals || {};
  const pad = n => String(n).padStart(2, '0'), y = new Date().getFullYear();
  // this year's (or next year's, once it has passed) date, worked out like the game does
  const dateOf = (f, yr) => { const rule=F[f.id]||{};if(/^\d{4}-/.test(rule.date||'')&&+rule.date.slice(0,4)===yr)return rule.date;if(/^\d\d-\d\d$/.test(rule.date||''))return `${yr}-${rule.date}`;const w = f.when; return w.lunar ? L.lunarDay(w.lunar[0], w.lunar[1], yr) : w.date ? `${yr}-${pad(w.date[0])}-${pad(w.date[1])}` : w.easter != null ? L.easter(yr) : w.nth ? L.nthWeekday(yr, ...w.nth) : w.table ? w.table[yr] : null; };
  const next = f => { const a = dateOf(f, y), today = isoDay(new Date()); return a && a >= today ? a : dateOf(f, y + 1); };
  const row = f => { const r = F[f.id] || {}, on = festivalSwitchedOn(r,live.releases?.['fest_'+f.id]);
    return `<tr data-id="${f.id}"><td>${f.icon} ${esc(T(f.en, f.vi))}<div class="mini">${f.kind === 'quiet' ? T('quiet day', 'ngày yên lặng') : ''}</div></td>
      <td data-label="${T('Now', 'Hiện')}"><select data-f="on"><option value="true" ${on ? 'selected' : ''}>${T('On', 'Bật')}</option><option value="false" ${on ? '' : 'selected'}>${T('Off', 'Tắt')}</option></select></td>
      <td data-label="${T('Next date', 'Ngày tới')}">${next(f) || '?'}</td><td data-label="${T('Move to', 'Đổi sang ngày')}"><input type="date" data-f="date" value="${/^\d{4}/.test(r.date || '') ? r.date : /^\d\d-\d\d$/.test(r.date||'') ? y+'-'+r.date : ''}"></td>
      <td data-label="${T('Decorate days before', 'Trang trí trước (ngày)')}"><input type="number" min="0" max="60" data-f="buildup" value="${r.buildup ?? ''}" placeholder="${f.kind === 'quiet' ? 3 : 21}"></td>
      <td data-label="${T('Decorations', 'Trang trí')}"><select data-f="deco">${[[1, 'As before', 'Như trước'], [2, '2x', '2x'], [3, '3x', '3x'], [5, '5x', '5x'], [7, '7x', '7x']].map(([n, en, vi]) => `<option value="${n}" ${(+r.deco || 5) === n ? 'selected' : ''}>${T(en, vi)}</option>`).join('')}</select></td>
      <td><a class="btn small ghost" target="_blank" href="${GAME}?festival=${f.id}">${T('Preview', 'Xem thử')}</a></td></tr>`; };
  P.innerHTML = `<h2>📅 ${T('Festivals', 'Lễ hội')}</h2><p class="sub">${T('Every festival on its real date (lunar dates are worked out each year). Party festivals decorate their places for 3 weeks before, quiet days a few days. On the day: 08:00 present, 15:00 festival game, 18:30 show (17:30 for under-5s). Decorations: half in week 1, three quarters in week 2, all of it in the last week; 5x by default (Decorations column). In the last week and on the day, 5 festival items are hidden among them to find.', 'Mỗi lễ hội đúng ngày thật (ngày âm lịch tự tính mỗi năm). Lễ hội vui trang trí 3 tuần trước, ngày yên lặng vài ngày. Đúng ngày: 08:00 nhận quà, 15:00 trò chơi lễ hội, 18:30 trình diễn (17:30 cho bé dưới 5 tuổi). Trang trí: tuần đầu một nửa, tuần hai ba phần tư, tuần cuối đầy đủ; mặc định gấp 5 lần (cột Trang trí). Tuần cuối và đúng ngày có 5 món đồ lễ hội giấu giữa đồ trang trí để các con tìm.')}</p>
    <p class="note">${T('Off hides the festival on the website and in the game, including calendar notices, decorations, activities and previews. Open pages refresh the published settings automatically.','Tắt sẽ ẩn lễ hội trên trang web và trong trò chơi, gồm thông báo lịch, trang trí, hoạt động và phần xem thử. Trang đang mở tự cập nhật cài đặt đã lưu.')}</p>${liveNote()}${Object.entries<[string, string]>(GROUPS).map(([g, [en, vi]]) => `<h3>${T(en, vi)}</h3><div class="card"><table class="rel"><thead><tr><th></th><th>${T('Now', 'Hiện')}</th><th>${T('Next date', 'Ngày tới')}</th><th>${T('Move to', 'Đổi sang ngày')}</th><th>${T('Decorate days before', 'Trang trí trước (ngày)')}</th><th>${T('Decorations', 'Trang trí')}</th><th></th></tr></thead><tbody>${FESTCAL.filter(f => f.group === g).map(row).join('')}</tbody></table></div>`).join('')}
    <div class="bar"><button class="btn" id="save">💾 ${T('Save', 'Lưu')}</button></div>`;
  $('#save').onclick = async () => {
    try{
      const latest=await loadLive(),out={...(latest.festivals||{})},releases={...(latest.releases||{})};
      P.querySelectorAll<HTMLInputElement>('tr[data-id]').forEach(tr=>{
        const id=tr.dataset.id,v=(k:string)=>tr.querySelector<HTMLInputElement>(`[data-f="${k}"]`).value,before=F[id]||{},r={...(out[id]||{})};
        const on=v('on')==='true',was=festivalSwitchedOn(before,live.releases?.['fest_'+id]);
        if(on!==was){r.on=on;releases['fest_'+id]={...(releases['fest_'+id]||{}),on};}
        const initialDate=/^\d{4}/.test(before.date||'')?before.date:/^\d\d-\d\d$/.test(before.date||'')?y+'-'+before.date:'';
        if(v('date')!==initialDate){if(v('date'))r.date=v('date');else delete r.date;}
        if(v('buildup')!==String(before.buildup??'')){if(v('buildup')!=='')r.buildup=+v('buildup');else delete r.buildup;}
        if(+v('deco')!==(Number(before.deco)||5)){if(+v('deco')!==5)r.deco=+v('deco');else delete r.deco;}
        if(Object.keys(r).length)out[id]=r;else delete out[id];
      });
      await saveLive({releases,festivals:out});Object.keys(F).forEach(k=>delete F[k]);Object.assign(F,out);live.releases=releases;live.festivals=F;
    }catch(e){fail(e);}
  };
};
// ---------- children: open a backup, see progress, change it, save a new backup ----------
PAGES.children = async P => {
  P.innerHTML = `<h2>👧 ${T('Children and their progress', 'Các con và tiến bộ')}</h2><p class="sub">${T('On a device: ⚙️ Grown-ups → Save backup. Open that file here to see each child’s progress, change names or coins, then save a new backup and open it on the device (Grown-ups → Open backup).', 'Trên máy: ⚙️ Người lớn → Lưu bản sao. Mở tệp đó ở đây để xem tiến bộ của từng con, đổi tên hay xu, rồi lưu bản sao mới và mở lại trên máy (Người lớn → Mở bản sao).')}</p>
  <div class="card"><input type="file" id="f" accept=".txt,.json,text/plain"></div><div id="kids"></div>`;
  $('#f').onchange = async e => {
    const file = fileOf(e); if (!file) return; let data;
    try { data = JSON.parse(await file.text()); if (data.app !== 'sparkle-valley' || !Array.isArray(data.profiles)) throw 0; } catch (x) { return toast(T('That is not a Sparkle Valley backup.', 'Đó không phải bản sao Thung Lũng Lấp Lánh.')); }
    const n = o => o ? Object.keys(o).length : 0;
    $('#kids').innerHTML = `<div class="card"><label>💰 ${T('Coins (shared)', 'Xu (dùng chung)')}</label><input type="number" id="coins" value="${+((data.farm || {}).coins) || 0}" min="0" max="99999"></div>` + data.profiles.map((p, i) => `<div class="card" data-i="${i}"><div class="row"><div><label>${T('Name', 'Tên')}</label><input type="text" data-n value="${esc(p.name)}" maxlength="16"></div>
      <div><label>${T('Age', 'Tuổi')}</label><select data-a><option value="little" ${p.age !== 'big' ? 'selected' : ''}>🧸 ${T('Little (under 5)', 'Bé nhỏ (dưới 5)')}</option><option value="big" ${p.age === 'big' ? 'selected' : ''}>🎒 ${T('Big kid (5–8)', 'Bé lớn (5–8)')}</option></select></div></div>
      <p>📮 ${n(p.postcards)} ${T('postcards', 'bưu thiếp')} · 🌟 ${(p.stickers || []).length} ${T('stickers', 'hình dán')} · 🎮 ${Object.values<number>(p.wins || {}).reduce((a, b) => a + b, 0)} ${T('games won', 'trò thắng')} · 📖 ${n(p.tales)} ${T('tales', 'truyện')} · 🔮 ${p.orbs || 0} · 🍃 ${n(p.leafies)}/24 · 🛂 ${n(p.stamps)}</p>
      <details><summary>${T('Levels in each game', 'Cấp độ từng trò')}</summary><p class="note">${Object.entries<number>(p.levels || {}).map(([g, l]) => `${esc(g)} ${'⭐'.repeat(l)}`).join(' · ') || '—'}</p></details></div>`).join('') +
      `<div class="bar"><button class="btn" id="save">💾 ${T('Save a new backup', 'Lưu bản sao mới')}</button></div>`;
    $('#save').onclick = () => {
      $('#kids').querySelectorAll<HTMLInputElement>('[data-i]').forEach(c => { const p = data.profiles[+c.dataset.i]; p.name = c.querySelector<HTMLInputElement>('[data-n]').value.trim().slice(0, 16) || p.name; p.age = c.querySelector<HTMLInputElement>('[data-a]').value; });
      data.farm = data.farm || {}; data.farm.coins = Math.max(0, Math.min(99999, +$('#coins').value || 0)); data.saved = Date.now();
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'text/plain' })); a.download = 'sparkle-valley-backup-' + new Date().toISOString().slice(0, 10) + '-studio.txt'; a.click();
      markSaved(); toast('✅ ' + T('Saved. Open it on the device: Grown-ups → Open backup.', 'Đã lưu. Mở trên máy: Người lớn → Mở bản sao.'), 'good');
    };
  };
};
// ---------- voices ----------
// The same lines the game speaks (tools/voice-lines.mts), worked out here from the game's own files, plus the
// family's stories, quiz and message. Each missing recording can be made with Azure, Piper (free, on this computer)
// or recorded with the microphone.
const VI = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
const Q = String.raw`(?:'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|\x60(?:[^\x60\\$]|\\.|\$(?!\{))*\x60)`;
const unq = s => s.slice(1, -1).replace(/\\(['"\x60\\])/g, '$1').replace(/\\n/g, ' ');
const PATTERNS = [String.raw`\b(?:say|sayAsync|api\.say|\.say)\(\s*(${Q})\s*,\s*(${Q})`, String.raw`\[\s*(${Q})\s*,\s*(${Q})\s*\]`, String.raw`\[\s*${Q}\s*,\s*(${Q})\s*,\s*(${Q})\s*\]`, String.raw`\bS\(\s*${Q}\s*,\s*(${Q})\s*,\s*(${Q})\s*\)`, String.raw`\b(?:fact|story|hint|about)\s*:\s*\[\s*(${Q})\s*,\s*(${Q})`];
const CAST = { en: ['f', 'm'], vi: ['f', 'm'], zh: ['m'], hi: ['m'] };
// (owner, 10 Oct: "Voices is slow to open") the game's files are read once while Studio is open; ↻ reads them again
let SRC = null;
async function allJobs() {
  if (!SRC) { const files = await api('srcfiles'); SRC = { files: await Promise.all(files.map(async f => (await fetch(GAME + f)).text())), cities: await (await fetch(GAME + 'js/cities.js')).text() }; }
  const seen = new Map();
  for (const src of SRC.files) {
    for (const p of PATTERNS) { const re = new RegExp(p, 'g'); let m; while ((m = re.exec(src))) { const en = unq(m[1]).trim(), vi = unq(m[2]).trim(); if (!en || !vi || en.length < 2) continue; if (/^[a-z]{2}:/.test(en) || /^[a-z]{2}:/.test(vi)) continue; if (!VI.test(vi) && en === vi) continue; if (/^[\p{Emoji}\s✓✕+−=]+$/u.test(en)) continue; if (en.split(/\s+/).length < 2 && !/[!?.]$/.test(en)) continue; seen.set(en + '\0' + vi, [en, vi]); } }
  }
  const c = CONTENT, add = (en, vi) => { if (en || vi) seen.set((en || vi) + '\0' + (vi || en), [en || vi, vi || en]); };
  (c.tales || []).forEach(t => { add(t.en, t.vi); t.pages.forEach(p => add(p[1], p[2])); });
  (c.quiz || []).forEach(q => { add(q.q[0], q.q[1]); q.answers.forEach(a => add(a[0] + '!', a[1] + '!')); });
  if (c.message) add(c.message.en, c.message.vi);
  const { swapNames } = await import(GAME + 'js/i18n.js'), { LEARN } = await import(GAME + 'js/words2.js'), { lineHash: packHash } = await import(GAME + 'js/packhash.js'), { viRuns, mixed } = await import(GAME + 'js/viwords.js');
  const jobs = new Map(); const put = (lang, text) => { if (text) jobs.set(packHash(lang, text), { lang, text, ...(lang === 'en' && mixed(text) ? { runs: viRuns(text) } : {}) }); };
  for (const [en, vi] of seen.values()) { put('en', swapNames(en, 'en')); put('vi', swapNames(vi, 'vi')); }
  for (const [lang, L] of Object.entries<{ words: string[][] }>(LEARN)) for (const w of L.words) put(lang, w[3]);
  const cities = SRC.cities, re = /\['([^'\\]+)', '(?:[^'\\]|\\.)*', '(?:[^'\\]|\\.)*', '(zh|hi)'\]/g; let m; while ((m = re.exec(cities))) put(m[2], m[1]);
  // lines built while playing (names, numbers, colours…): collected by tools/voice-harvest.mts and sent from devices
  for (const l of await api('voices/extra').catch(() => [])) if (CAST[l.lang]) put(l.lang, l.text);
  // the inbox: lines the children's devices had to say with the machine voice, sent by themselves
  INBOX = await api('voices/inbox').catch(() => []);
  for (const l of INBOX) if (CAST[l.lang]) { put(l.lang, l.text); const j = jobs.get(packHash(l.lang, l.text)); if (j) j.asked = l.n; }
  return jobs;
}
let voiceStop = false, INBOX = [];
PAGES.voices = async P => {
  P.innerHTML = `<h2>🎙️ ${T('Voices', 'Giọng đọc')}</h2><p class="sub">${T('New games and stories need new recordings. Lines without one use the device’s own voice until they are made.', 'Trò chơi và truyện mới cần bản ghi mới. Câu nào chưa có thì máy tự đọc bằng giọng của máy cho tới khi có bản ghi.')}</p><div class="card" id="vsum">${T('Counting the lines…', 'Đang đếm các câu…')}</div>`;
  const jobs = await allJobs(), have = await api('voices/have'), daily = await api('voices/daily').catch(() => null);
  // (Voice & Audio, 12 Oct) the daily voice recording (GitHub, once a day): when it last ran and what is still waiting
  const sydney = iso => new Date(iso).toLocaleString(LANG === 'vi' ? 'vi-VN' : 'en-AU', { timeZone: 'Australia/Sydney', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  const dailyLine = daily && daily.at ? `<div class="card"><h3>🌙 ${T('Daily recording', 'Thu âm hằng ngày')}</h3><p>${T('Last run', 'Lần chạy cuối')}: <b>${esc(sydney(daily.at))}</b> · <b class="${daily.waiting ? 'warn' : 'ok'}">${+daily.waiting || 0}</b> ${T('waiting', 'đang chờ')}${daily.pending ? ` · ${+daily.pending} ${T('recorded, waiting for the next release', 'đã thu, chờ bản phát hành tới')}` : ''}${daily.held ? ` · ${+daily.held} ${T('held (may have a name: make them by hand below if they are fine)', 'để lại (có thể có tên: nếu ổn thì tự tạo bên dưới)')}` : ''}</p><p class="note">${T('Every missing line the game has is recorded with Azure by itself once a day; lines with a child’s, friend’s or pet’s name never are.', 'Mỗi ngày một lần, mọi câu còn thiếu trong game được tự thu bằng Azure; câu có tên của bé, bạn hay thú cưng thì không bao giờ.')}</p></div>` : '';
  const missing = []; for (const [h, j] of jobs) for (const s of CAST[j.lang]) if (!have[j.lang][s].includes(h)) missing.push({ hash: h, slot: s, ...j });
  missing.sort((a, b) => (b.asked || 0) - (a.asked || 0)); // the inbox first: what the children are hearing now
  const by = L => missing.filter(x => x.lang === L).length, chars = missing.reduce((a, x) => a + x.text.length, 0);
  const asked = missing.filter(x => x.asked), askedSlots = new Set(asked.map(x => x.hash)).size;
  $('#vsum').innerHTML = `${dailyLine}${INBOX.length ? `<div class="inbox"><h3>📥 ${T('Inbox: lines the children heard in the machine voice', 'Hộp thư: câu các con nghe bằng giọng máy')}</h3><p>${askedSlots ? `<b class="warn">${askedSlots}</b> ${T('of them still need a recording. Make them first with one click:', 'câu vẫn cần bản ghi. Tạo chúng trước bằng một chạm:')}</p><div class="row"><button class="btn" id="azin" ${!INFO.conf.azure ? 'disabled' : ''}>☁️ ${T('Make the inbox lines with Azure', 'Tạo các câu trong hộp thư bằng Azure')}</button></div>` : `<p class="ok">✅ ${T('Every line the devices asked for has a recording now.', 'Mọi câu các máy hỏi đã có bản ghi.')}</p>`}<p class="note">${T('Devices send these by themselves when they say a line without a recording (never a line with a child’s name). They are also in the list below, marked 📥.', 'Các máy tự gửi khi phải đọc một câu chưa có bản ghi (không bao giờ có câu chứa tên của bé). Chúng cũng nằm trong danh sách bên dưới, có dấu 📥.')}</p></div>` : ''}<p><b>${jobs.size}</b> ${T('lines in the game', 'câu trong game')} · <b class="${missing.length ? 'warn' : 'ok'}">${missing.length}</b> ${T('recordings missing', 'bản ghi còn thiếu')} (🇦🇺 ${by('en')} · 🇻🇳 ${by('vi')} · 🇨🇳 ${by('zh')} · 🇮🇳 ${by('hi')}), ${chars} ${T('characters', 'ký tự')}.</p>
    <div class="row"><button class="btn" id="az" ${!INFO.conf.azure || !missing.length ? 'disabled' : ''}>☁️ ${T('Make them with Azure', 'Tạo bằng Azure')}</button><button class="btn pink" id="pi" ${!INFO.conf.piper || !missing.length ? 'disabled' : ''}>💻 ${T('Make them with Piper (free, offline)', 'Tạo bằng Piper (miễn phí, không cần mạng)')}</button><button class="btn ghost" id="stop" disabled>⏹ ${T('Stop', 'Dừng')}</button></div>
    <p class="note">${!INFO.conf.azure ? T('Azure: add your key in Settings. ', 'Azure: thêm khóa trong Cài đặt. ') : T('Azure free tier: about 20 a minute, so this goes slowly; you can stop and carry on later. ', 'Azure miễn phí: khoảng 20 câu một phút nên hơi chậm; dừng lúc nào cũng được, lần sau làm tiếp. ')}${!INFO.conf.piper ? T('Piper: download it and its voices, then set them in Settings.', 'Piper: tải về cùng giọng đọc, rồi chọn trong Cài đặt.') : ''}</p>
    <div class="prog"><i id="pb"></i></div><p class="note" id="pt"></p></div>
    <div class="card"><h3>📱 ${T('Lines a device said with the machine voice', 'Câu máy đã đọc bằng giọng máy')}</h3><p class="note">${T('On the device: ⚙️ Grown-ups → Save backup. Open that file here: every line it had to say without a recording is added to the list above, ready to make.', 'Trên máy: ⚙️ Phụ huynh → Lưu bản sao. Mở tệp đó ở đây: mọi câu máy phải đọc khi chưa có bản ghi sẽ được thêm vào danh sách trên, sẵn sàng để tạo.')}</p><input type="file" id="vrep" accept=".txt,.json,text/plain"><p class="note" id="vrepres"></p></div>
    <div class="card"><h3>🎤 ${T('Or record them yourselves', 'Hoặc tự thu giọng')}</h3><p class="note">${T('Tap ⏺, read the line, tap ⏹. Your own voice then plays in the game.', 'Bấm ⏺, đọc câu, bấm ⏹. Giọng của bạn sẽ được phát trong game.')}</p>
    <input type="text" id="vf" placeholder="🔎 ${T('Find a line…', 'Tìm câu…')}"><div class="lines"><table><tbody id="vl"></tbody></table></div></div>`;
  const list = q => { $('#vl').innerHTML = missing.filter(x => !q || x.text.toLowerCase().includes(q)).slice(0, 200).map((x, i) => `<tr data-k="${missing.indexOf(x)}"><td><span class="pill">${x.lang} ${x.slot === 'f' ? '👩' : '👨'}</span></td><td>${x.asked ? '📥 ' : ''}${esc(x.text)}</td><td><button class="btn small" data-rec>⏺</button></td></tr>`).join(''); $('#vl').querySelectorAll<HTMLInputElement>('[data-rec]').forEach(b => b.onclick = () => record(missing[+b.closest<HTMLInputElement>('tr').dataset.k], b)); };
  list(''); $('#vf').oninput = e => list(val(e).toLowerCase());
  $('#vrep').onchange = async e => {
    const f = fileOf(e); if (!f) return; let d; try { d = JSON.parse(await f.text()); } catch (x) { return toast(T('That is not a Sparkle Valley backup.', 'Đó không phải bản sao Thung Lũng Lấp Lánh.')); }
    const lines = (d.voiceMissing || []).map(m => ({ lang: m[0], text: m[1] }));
    if (!lines.length) { $('#vrepres').textContent = '✅ ' + T('That device had a recording for every line it said.', 'Máy đó có bản ghi cho mọi câu đã nói.') + (d.build ? ` (${T('build', 'bản')} ${esc(d.build)})` : ''); return; }
    const r = await api('voices/extra', { lines }); $('#vrepres').textContent = `✅ ${r.added} ${T('new lines added. Counting again…', 'câu mới được thêm. Đang đếm lại…')}`; setTimeout(render, 900);
  };
  const run = async (engine, only?) => {
    voiceStop = false; $('#stop').disabled = false; $('#az').disabled = $('#pi').disabled = true;
    const gap = engine === 'azure' ? 3200 : 0; let done = 0, errs = 0;
    for (const x of [...missing].filter(x => !only || x.asked)) {
      if (voiceStop) break; const t0 = Date.now();
      try { await api('voice', { engine, lang: x.lang, slot: x.slot, hash: x.hash, text: x.text, runs: x.runs }); done++; missing.splice(missing.indexOf(x), 1); } catch (e) { errs++; $('#pt').textContent = '⚠️ ' + e.message; if (/key|region|Settings|Piper/.test(e.raw || e.message)) break; }
      $('#pb').style.width = (done / (done + missing.length) * 100) + '%'; $('#pt').textContent = `${done} ${T('made', 'đã tạo')}, ${missing.length} ${T('to go', 'còn lại')}${errs ? `, ${errs} ⚠️` : ''}`;
      const w = gap - (Date.now() - t0); if (w > 0) await new Promise(r => setTimeout(r, w));
    }
    $('#stop').disabled = true; toast(T('Done for now.', 'Xong đợt này.')); list($('#vf').value.toLowerCase());
  };
  $('#az').onclick = () => run('azure'); if ($('#azin')) $('#azin').onclick = () => { $('#azin').disabled = true; run('azure', true); }; $('#pi').onclick = () => run('piper'); $('#stop').onclick = () => { voiceStop = true; };
  async function record(x, btn) {
    if (btn.dataset.on) { btn._rec.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }), rec = new MediaRecorder(stream), parts = [];
      rec.ondataavailable = e => parts.push(e.data); btn._rec = rec; btn.dataset.on = 1; btn.textContent = '⏹';
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop()); delete btn.dataset.on; btn.textContent = '…';
        const ac = new AudioContext(), buf = await ac.decodeAudioData(await new Blob(parts).arrayBuffer()), data = buf.getChannelData(0);
        if (!window.lamejs) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = BASE + '/ui/lame.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
        const enc = new window.lamejs.Mp3Encoder(1, buf.sampleRate, 64), pcm = new Int16Array(data.length); for (let i = 0; i < data.length; i++) pcm[i] = Math.max(-1, Math.min(1, data[i])) * 32767;
        const out = []; for (let i = 0; i < pcm.length; i += 1152) { const b = enc.encodeBuffer(pcm.subarray(i, i + 1152)); if (b.length) out.push(b); } out.push(enc.flush());
        const blob = new Blob(out, { type: 'audio/mpeg' }), url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
        await api('voice', { engine: 'upload', lang: x.lang, slot: x.slot, hash: x.hash, text: x.text, audio: url }); btn.textContent = '✅'; btn.disabled = true; missing.splice(missing.indexOf(x), 1);
      };
      rec.start();
    } catch (e) { fail(e); }
  }
};
// ---------- publish ----------
let jobTimer: ReturnType<typeof setInterval> | undefined, redrawWait = null;
const watchJob = (out, done) => { clearInterval(jobTimer); jobTimer = setInterval(async () => { const j = await api('job').catch(() => ({})); if (!j.kind) return; out(j); if (j.end) { clearInterval(jobTimer); done && done(j); } }, 1000); };
PAGES.publish = async P => {
  const c = INFO.conf; redrawWait = null;
  P.innerHTML = `<h2>🚀 ${T('Publish', 'Phát hành')}</h2><p class="sub">${T('Send what you changed here to the children’s devices.', 'Gửi những gì bạn đã đổi ở đây tới máy của các con.')}</p>
  ${INFO.online ? `<div class="card"><h3>🔗 ${T('How it reaches the children', 'Cách đến với các con')}</h3><p>${T('Pages marked Live save immediately and do not need Publish. Changes from pages marked Needs Publish wait in a draft (the “studio-draft” branch on GitHub). Publish puts those draft changes live together; Netlify updates the website in a minute or two, and each device picks it up the next time the game opens with internet.', 'Mục ghi Có hiệu lực ngay lưu là áp dụng ngay, không cần Phát hành. Thay đổi từ mục ghi Cần phát hành chờ trong bản nháp (nhánh “studio-draft” trên GitHub). Phát hành đưa các thay đổi trong bản nháp lên cùng lúc; Netlify cập nhật trang sau một hai phút, và mỗi máy nhận khi mở game có mạng.')}</p>
    <p class="${INFO.unpublished ? 'warn' : 'ok'}">${INFO.unpublished ? '✏️ ' + T('There are saved changes waiting.', 'Có thay đổi đang chờ.') : '✅ ' + T('Nothing waiting: the website has everything.', 'Không có gì đang chờ: trang web đã có đủ.')}</p></div>` : `<div class="card"><h3>🔗 ${T('How it reaches the website', 'Cách đưa lên trang web')}</h3>
    <p>${liveOn() ? T('Pages marked Live save immediately to the connected family service and do not need Publish. Changes from pages marked Needs Publish stay in this game folder until you publish them.', 'Mục ghi Có hiệu lực ngay lưu là áp dụng ngay qua dịch vụ gia đình đã kết nối, không cần Phát hành. Thay đổi từ mục ghi Cần phát hành ở trong thư mục game này cho tới khi bạn phát hành chúng.') : T('Everything you change here (message, names, faces, stories, quiz, new villagers, defaults, voices, photos) is saved in the game folder on this computer. Nothing goes online until you publish.', 'Mọi thứ bạn đổi ở đây (lời nhắn, tên, khuôn mặt, truyện, câu đố, nhân vật mới, mặc định, giọng đọc, ảnh) được lưu trong thư mục game trên máy tính này. Chưa có gì lên mạng cho tới khi bạn phát hành.')}</p>
    <ol><li>${T('<b>GitHub (recommended)</b>, in two steps like the online Studio: <b>1. Save a draft</b> sends only the files you changed to the draft (the “studio-draft” branch); the website does not change yet. <b>2. Publish</b> puts the whole draft live as one change; Netlify updates the website by itself in a minute or two.', '<b>GitHub (nên dùng)</b>, hai bước như Studio trên mạng: <b>1. Lưu bản nháp</b> chỉ gửi các tệp bạn đã đổi vào bản nháp (nhánh “studio-draft”); trang web chưa đổi. <b>2. Phát hành</b> đưa cả bản nháp lên cùng lúc; Netlify tự cập nhật trang web sau một hai phút.')}</li>
    <li>${T('<b>Netlify directly</b>: uploads the whole zip. Quick, but the next change on GitHub replaces it, so use it only if the site is not linked to GitHub.', '<b>Netlify trực tiếp</b>: tải cả tệp zip lên. Nhanh, nhưng lần đổi tiếp theo trên GitHub sẽ thay thế nó, nên chỉ dùng khi trang chưa nối với GitHub.')}</li></ol>
    <p class="note">${T('Each device picks up the new content the next time the game opens with internet (it keeps a copy for offline). The build number in the game (e.g. r35) shows which version a device has.', 'Mỗi máy nhận nội dung mới vào lần tới mở game có mạng (và giữ bản để chơi không mạng). Số bản trong game (vd. r35) cho biết máy đang chạy phiên bản nào.')}</p></div>`}
  <div class="card"><h3>🐙 GitHub ${c.github ? '✅ ' + esc(c.githubRepo) + ' · ' + esc(c.githubBranch) : ''}</h3>
    ${c.github ? `<input type="text" id="gmsg" placeholder="${T('What changed? (optional)', 'Đã đổi gì? (không bắt buộc)')}">${INFO.online ? '' : `<p class="${INFO.unpublished ? 'warn' : 'ok'}" id="gwait">${INFO.unpublished ? '✏️ ' + T('A draft is waiting on GitHub: press Publish to put it live.', 'Có bản nháp đang chờ trên GitHub: bấm Phát hành để đưa lên.') : '✅ ' + T('No draft waiting.', 'Không có bản nháp đang chờ.')}</p>`}<div class="row" style="margin-top:8px">${INFO.online ? '' : `<button class="btn ghost" id="gdraft">📝 ${T('1. Save a draft', '1. Lưu bản nháp')}</button> `}<button class="btn" id="gpub">🚀 ${INFO.online ? T('Publish', 'Phát hành') : T('2. Publish', '2. Phát hành')}</button></div><div class="prog"><i id="gpb"></i></div><p class="note" id="gres"></p>` : `<p class="note">${T('Add a GitHub token and the repository in Settings first.', 'Thêm khóa GitHub và tên kho trong Cài đặt trước.')}</p>`}</div>
  ${INFO.online ? '' : `<div class="card"><h3>📦 ${T('Zip and Netlify', 'Tệp zip và Netlify')}</h3><button class="btn ghost" id="build">📦 ${T('Make the zip', 'Tạo tệp zip')}</button> <span id="bres" class="note"></span>
    <p class="note">${c.netlify ? T('Your Netlify site is set: ', 'Đã có trang Netlify: ') + esc(c.netlifySite) : T('Add a Netlify token and the site name in Settings for one-click upload, or drag the zip onto the site’s Deploys page.', 'Thêm khóa Netlify và tên trang trong Cài đặt để tải lên một chạm, hoặc kéo tệp zip vào trang Deploys.')}</p>
    <button class="btn ghost" id="deploy" ${c.netlify ? '' : 'disabled'}>☁️ ${T('Upload to Netlify', 'Tải lên Netlify')}</button> <span id="dres" class="note"></span></div>`}`;
  // online (round P): every save waits here on the website; one Publish sends them all, or drop them
  if (INFO.online && CAN('publish')) {
    const box = document.createElement('div'); box.className = 'card'; P.querySelector<HTMLInputElement>('.sub').after(box);
    const drawWait = redrawWait = async () => {
      let files = []; try { files = (await api('pending')).files; } catch (e) { }
      const by = {}; for (const f of files) { const k = f.split('/').slice(0, 2).join('/'); by[k] = (by[k] || 0) + 1; }
      box.innerHTML = `<h3>📝 ${T('Waiting to publish', 'Đang chờ phát hành')}: ${files.length}</h3>${files.length ? `<p class="note">${Object.entries(by).map(([k, n]) => `${esc(k)} (${n})`).join(' · ')}</p>
        <p class="note">${T('Saving is instant now: changes wait here, and Publish sends them all to the children in one go.', 'Lưu giờ rất nhanh: thay đổi chờ ở đây, và Phát hành gửi tất cả tới các con trong một lần.')}</p>
        <button class="btn ghost" id="wdrop">🗑️ ${T('Drop all waiting changes', 'Bỏ tất cả thay đổi đang chờ')}</button>` : `<p class="ok">✅ ${T('Nothing waiting.', 'Không có gì đang chờ.')}</p>`}`;
      const d = box.querySelector<HTMLInputElement>('#wdrop'); if (d) d.onclick = async () => { if (!confirm(T(`Drop ${files.length} waiting change(s)? They will not be published.`, `Bỏ ${files.length} thay đổi đang chờ? Chúng sẽ không được phát hành.`))) return; try { await api('pending/discard', {}); LOADED = false; await load(true); head(); toast(T('Dropped.', 'Đã bỏ.')); drawWait(); } catch (e) { fail(e); } };
    };
    drawWait();
  }
  if ($('#build')) $('#build').onclick = async () => { $('#bres').textContent = T('Packing…', 'Đang đóng gói…'); try { const r = await api('build', {}); $('#bres').innerHTML = `✅ ${r.files} ${T('files', 'tệp')}, ${(r.bytes / 1e6).toFixed(1)} MB · <a href="${BASE}/api/zip">⬇️ ${T('Download', 'Tải về')}</a>`; } catch (e) { $('#bres').textContent = '⚠️ ' + e.message; } };
  if ($('#deploy')) $('#deploy').onclick = async () => { if (c.github && !confirm(T('Your site is published from GitHub. Upload the zip to Netlify anyway?', 'Trang của bạn được phát hành từ GitHub. Vẫn tải tệp zip lên Netlify?'))) return; $('#dres').textContent = T('Uploading… (a minute or two)', 'Đang tải lên… (một hai phút)'); try { const r = await api('deploy', {}); $('#dres').innerHTML = `✅ ${T('Published!', 'Đã phát hành!')} <a href="${esc(r.url)}" target="_blank">${esc(r.url)}</a>`; } catch (e) { $('#dres').textContent = '⚠️ ' + e.message; } };
  const ghRun = async (what, btn?) => {
    ['#gpub', '#gdraft'].forEach(k => { if ($(k)) $(k).disabled = true; }); $('#gres').textContent = T('Starting…', 'Bắt đầu…'); let j0;
    const again = () => ['#gpub', '#gdraft'].forEach(k => { if ($(k)) $(k).disabled = false; });
    try {
      // (owner, 12 Oct: real photos would not publish, 504) online, Publish goes in steps of a dozen changes, each its own short request
      if (INFO.online && what === 'publish') {
        let total = INFO.waiting || 0, sent = 0;
        for (let k = 0; k < 400; k++) {
          j0 = await api('github/publish', { message: $('#gmsg').value, step: true });
          if (!j0.more) break;
          sent += j0.sent; total = Math.max(total, sent + j0.left);
          $('#gpb').style.width = (total ? sent / total * 100 : 5) + '%';
          $('#gres').textContent = T(`Sending saved changes: ${sent} of ${total}…`, `Đang gửi thay đổi đã lưu: ${sent} / ${total}…`);
        }
      } else j0 = await api('github/' + what, { message: $('#gmsg').value });
    } catch (e) { $('#gres').textContent = '⚠️ ' + e.message + ' · ' + T('Press Publish again: it carries on from where it stopped.', 'Bấm Phát hành lần nữa: sẽ tiếp tục từ chỗ đã dừng.'); again(); return; }
    const show = j => { $('#gpb').style.width = (j.total ? j.done / j.total * 100 : 5) + '%'; $('#gres').textContent = `${j.done}/${j.total || '?'} · ${say(j.msg || '')}`; };
    const fin = j => {
      again();
      const r = j.result || {}, draft = what === 'draft';
      // (owner, 10 Oct) a clear result, with what happens next
      const next = T('Netlify updates the website in a minute or two; each child’s device gets it the next time the game opens with internet.', 'Netlify cập nhật trang web sau một hai phút; máy của mỗi con nhận được khi mở game có mạng lần tới.');
      $('#gres').className = 'result ' + (j.error ? 'bad' : 'good');
      $('#gres').innerHTML = j.error ? '⚠️ ' + esc(say(j.error)) : r.changed ? `✅ <b>${r.changed} ${draft ? T('files saved in the draft', 'tệp đã lưu vào bản nháp') : T('files published', 'tệp đã phát hành')}</b> · <a href="${esc(r.url)}" target="_blank">${T('see the change', 'xem thay đổi')}</a><br>${draft ? T('The website has not changed yet: press 2. Publish when you are ready.', 'Trang web chưa đổi: bấm 2. Phát hành khi bạn sẵn sàng.') : next}` : '✅ ' + esc(say(r.note || T('Nothing new.', 'Không có gì mới.')));
      if (!j.error && !draft) { INFO.unpublished = false; INFO.waiting = 0; head(); if (redrawWait) redrawWait(); if (r.changed) toast('🚀 ' + T('Published.', 'Đã phát hành.') + ' ' + next, 'good'); }
      if (!j.error && $('#gwait')) { const waiting = draft ? (r.changed > 0 || INFO.unpublished) : false; INFO.unpublished = waiting; head(); $('#gwait').className = waiting ? 'warn' : 'ok'; $('#gwait').textContent = waiting ? '✏️ ' + T('A draft is waiting on GitHub: press Publish to put it live.', 'Có bản nháp đang chờ trên GitHub: bấm Phát hành để đưa lên.') : '✅ ' + T('No draft waiting.', 'Không có bản nháp đang chờ.'); }
    };
    if (j0.end) { show(j0); fin(j0); } else watchJob(show, fin); // online it is done straight away
  };
  if ($('#gdraft')) $('#gdraft').onclick = () => ghRun('draft');
  if ($('#gpub')) $('#gpub').onclick = () => ghRun('publish');
};
// ---------- 🎭 Story characters (Play's request, owner 10 Oct: "Chi's look can be changed in Studio") ----------
// writes CONTENT.looks = { chi | jack | ruby: { style, color, hair, hairStyle, skin } }; the game reads it with lookOf in
// js/content/chapter3sydney.js (anything missing keeps the usual look), so the usual looks are read from the game itself
const STORY_CAST = [['chi', 'Chi: she has two homes, Vietnam and Australia', 'Chi: bạn có hai quê, Việt Nam và Úc'], ['jack', 'Jack: Chi’s friend in Sydney', 'Jack: bạn của Chi ở Sydney'], ['ruby', 'Ruby: Chi’s friend in Sydney', 'Ruby: bạn của Chi ở Sydney']];
const figure = L => `<svg class="fig" viewBox="0 0 60 80" aria-hidden="true"><rect x="16" y="38" width="28" height="34" rx="9" fill="${esc(L.color)}" stroke="#3a2a20" stroke-width="2"/><circle cx="30" cy="24" r="15" fill="${esc(L.skin)}" stroke="#3a2a20" stroke-width="2"/><path d="M15 22a15 15 0 0 1 30 0q-15-8-30 0z" fill="${esc(L.hair)}" stroke="#3a2a20" stroke-width="2"/>${L.hairStyle === 'long' || L.hairStyle === 'ponytail' ? `<path d="M44 20q6 14 0 26" stroke="${esc(L.hair)}" stroke-width="6" fill="none" stroke-linecap="round"/>` : ''}<circle cx="25" cy="26" r="2" fill="#3a2a20"/><circle cx="35" cy="26" r="2" fill="#3a2a20"/><path d="M25 32q5 4 10 0" stroke="#3a2a20" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
PAGES.looks = async P => {
  let lookOf = null; try { ({ lookOf } = await import(GAME + 'js/content/chapter3sydney.js')); } catch (e) { lookOf = null; }
  if (!lookOf) { P.innerHTML = `<h2>🎭 ${T('Story characters', 'Nhân vật trong truyện')}</h2><div class="card"><p class="note">${T('Chapter 3 of the lantern story is not in this copy of the game yet, so there is nothing to change here.', 'Chương 3 của truyện đèn lồng chưa có trong bản game này, nên chưa có gì để đổi ở đây.')}</p></div>`; return; }
  const LK = CONTENT.looks && typeof CONTENT.looks === 'object' ? CONTENT.looks : {};
  const pal = (list, cur) => (list.includes(cur) ? list : [cur, ...list]);
  const draw = () => {
    P.innerHTML = `<h2>🎭 ${T('Story characters', 'Nhân vật trong truyện')}</h2><p class="sub">${T('How Chi, Jack and Ruby look in chapter 3 of the lantern story (Sydney). Change their clothes, hair and skin, then ' + PUB('Save and Publish.', 'Save (live at once).') + ' “Back to the usual” gives the look the story was made with.', 'Chi, Jack và Ruby trông thế nào trong chương 3 truyện đèn lồng (Sydney). Đổi quần áo, tóc và màu da, rồi ' + PUB('Lưu và Phát hành.', 'Lưu (có hiệu lực ngay).') + ' “Về như cũ” trả lại dáng vẻ ban đầu của truyện.')}</p>
    <div class="cards looks">${STORY_CAST.map(([id, en, vi]) => { const L = lookOf(id, LK), sw = (k, list) => `<div class="swatches">${pal(list, L[k]).map(v => `<button type="button" class="sw ${v === L[k] ? 'on' : ''}" data-id="${id}" data-k="${k}" data-v="${v}" style="background:${v}" aria-label="${v}"></button>`).join('')}</div>`;
      return `<div class="card look" data-id="${id}"><div class="row" style="align-items:center;flex-wrap:nowrap"><div style="flex:0 0 72px">${figure(L)}</div><div><h3 style="margin:0">${esc(T(en, vi).split(':')[0])}</h3><p class="note" style="margin:2px 0 0">${esc(T(en, vi).split(': ')[1] || '')}</p></div></div>
        <div class="row"><div><label>${T('Clothes', 'Trang phục')}</label><select data-id="${id}" data-k="style">${LOOKS.style.map(v => `<option value="${v}" ${L.style === v ? 'selected' : ''}>${lookWord(v)}</option>`).join('')}</select></div>
        <div><label>${T('Hair', 'Tóc')}</label><select data-id="${id}" data-k="hairStyle">${LOOKS.hairStyle.map(v => `<option value="${v}" ${L.hairStyle === v ? 'selected' : ''}>${lookWord(v)}</option>`).join('')}</select></div></div>
        <label>${T('Clothes colour', 'Màu áo')}</label>${sw('color', LOOKS.color)}<label>${T('Hair colour', 'Màu tóc')}</label>${sw('hair', LOOKS.hair)}<label>${T('Skin', 'Màu da')}</label>${sw('skin', LOOKS.skin)}
        <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn small ghost" data-usual="${id}" ${LK[id] ? '' : 'disabled'}>↩️ ${T('Back to the usual', 'Về như cũ')}</button></div></div>`; }).join('')}</div>
    <div class="bar"><button class="btn" id="save">💾 ${T('Save', 'Lưu')}</button></div>`;
    const set = (id, k, v) => { const L = lookOf(id, LK); LK[id] = { style: L.style, color: L.color, hair: L.hair, hairStyle: L.hairStyle, skin: L.skin, [k]: v }; CONTENT.looks = LK; draw(); };
    P.querySelectorAll<HTMLInputElement>('.look .sw').forEach(b => b.onclick = () => set(b.dataset.id, b.dataset.k, b.dataset.v));
    P.querySelectorAll<HTMLInputElement>('.look select').forEach(s => s.onchange = () => set(s.dataset.id, s.dataset.k, s.value));
    P.querySelectorAll<HTMLInputElement>('[data-usual]').forEach(b => b.onclick = () => { delete LK[b.dataset.usual]; CONTENT.looks = LK; draw(); });
    $('#save').onclick = () => { if (!Object.keys(LK).length) delete CONTENT.looks; else CONTENT.looks = LK; saveContent().catch(fail); };
  };
  draw();
};
// ---------- 🏘️ Memory Villages (round T3): the homes the family remembers, put on garden plots by the plot's id ----------
// writes CONTENT.plots = { <plot id>: { type, name: [en, vi], owner: { name, line: [en, vi] }, color } }. The plots are
// PLOTS in js/content/map.js (the two Memory Villages, with an address) and the spare plots by the cities (ids
// sp_<city>_<n>, made when the valley is built: found by opening the game out of sight). Never by x, z.
let SPARE = null;
async function sparePlots() {
  const f: HTMLIFrameElement = document.createElement('iframe'); f.style.cssText = 'position:fixed;left:-2000px;top:0;width:400px;height:300px;border:0'; f.src = GAME + 'index.html?studio=1'; document.body.appendChild(f);
  try {
    for (let i = 0; i < 120; i++) { await new Promise(r => setTimeout(r, 500)); const G = f.contentWindow && f.contentWindow.__sv; if (G && G.world && G.world.boxes && G.interactables && G.interactables.length > 50) {
      const W = await f.contentWindow.eval(`import(${JSON.stringify(GAME + 'js/world.js')})`);
      return W.PLOTS.slice(W.PLOTS.spareFrom).map(p => ({ id: p.id, village: p.village, address: p.address })); } }
    throw new Error(T('The game did not open in time.', 'Game chưa mở kịp.'));
  } finally { f.remove(); }
}
PAGES.plots = async P => {
  const M = await import(GAME + 'js/content/map.js'), WE = await import(GAME + 'js/worldedit.js'), HOMES = Object.entries<BuildType>(WE.BUILD_TYPES).filter(([, t]) => t.home);
  const PL = CONTENT.plots && typeof CONTENT.plots === 'object' ? CONTENT.plots : {};
  const VILLAGES = M.PLACES.filter(p => p.kind === 'plots'), CITY = id => { const c = M.PLACES.find(p => p.id === id); return c && c.name ? T(c.name[0], c.name[1]) : id; };
  const known = new Set([...M.PLOTS.map(p => p.id), ...(SPARE || []).map(p => p.id)]);
  const tile = p => { const h = PL[p.id], n = (p.address[0].match(/^\d+/) || p.address[0].match(/\d+/) || [''])[0];
    return `<button type="button" class="plot ${h ? 'home' : ''}" data-plot="${esc(p.id)}" title="${esc(T(p.address[0], p.address[1]))}"><b>${esc(n)}</b><span>${h ? '🏡 ' + esc((h.name && (T(h.name[0], h.name[1]) || h.name[0] || h.name[1])) || (h.owner && h.owner.name) || T('A home', 'Một ngôi nhà')) : '🌷 ' + T('garden', 'vườn')}</span></button>`; };
  const draw = () => {
    const homes = Object.keys(PL).length;
    P.innerHTML = `<h2>🏘️ ${T('Memory Villages', 'Làng Kỷ Niệm')}</h2><p class="sub">${T('Each garden plot in the two Memory Villages, and the spare plots by the cities, can hold a home your family remembers: grandparents’ house, the house you grew up in. Tap a plot, choose the house, its name and who lives there, then ' + PUB('Save and Publish.', 'Save (live at once).') + '', 'Mỗi mảnh vườn ở hai Làng Kỷ Niệm, và các mảnh trống cạnh thành phố, có thể đặt một ngôi nhà gia đình bạn nhớ: nhà ông bà, ngôi nhà bạn lớn lên. Chạm vào một mảnh, chọn kiểu nhà, tên và ai ở đó, rồi ' + PUB('Lưu và Phát hành.', 'Lưu (có hiệu lực ngay).') + '')}</p>
      <div class="card"><p class="note">🏡 ${T(`${homes} home(s) placed.`, `Đã đặt ${homes} ngôi nhà.`)} ${T('Saved homes appear on their plots the next time the valley opens. Empty plots stay gardens.', 'Nhà đã lưu sẽ hiện trên mảnh đất khi mở thung lũng lần tới. Mảnh đất trống vẫn là vườn.')}</p></div>
      ${VILLAGES.map(v => { const mine = M.PLOTS.filter(p => p.village === v.id), lanes = [...new Set(mine.map(p => p.id.split('_')[2]))];
        return `<div class="card"><h3>${esc(T(v.name[0], v.name[1]))}</h3>${lanes.map(li => { const L = mine.filter(p => p.id.split('_')[2] === li), odd = L.filter(p => +p.id.split('_')[3] % 2), even = L.filter(p => !(+p.id.split('_')[3] % 2)), lane = L[0].address;
          return `<p class="note" style="margin:10px 0 4px">${esc(T(lane[0].replace(/^\d+ /, ''), lane[1].replace(/^Số \d+, /, '')))}</p><div class="lane"><div class="plots">${odd.map(tile).join('')}</div><div class="lanebar"></div><div class="plots">${even.map(tile).join('')}</div></div>`; }).join('')}</div>`; }).join('')}
      <div class="card"><h3>🏙️ ${T('Spare plots by the cities', 'Mảnh trống cạnh thành phố')}</h3>${SPARE ? (SPARE.length ? [...new Set(SPARE.map(p => p.village))].map(c => `<p class="note" style="margin:10px 0 4px">${esc(CITY(c))}</p><div class="plots">${SPARE.filter(p => p.village === c).map(tile).join('')}</div>`).join('') : `<p class="note">${T('No spare plots in this valley.', 'Thung lũng này không có mảnh trống.')}</p>`)
        : `<p class="note">${T('They are made when the valley is built, so Studio opens the game out of sight to find them (up to a minute).', 'Các mảnh này được tạo khi dựng thung lũng, nên Studio mở game ẩn để tìm (tối đa một phút).')}</p><button class="btn ghost" id="spare">🔎 ${T('Find the plots by the cities', 'Tìm các mảnh cạnh thành phố')}</button> <span class="note" id="spareres"></span>`}</div>
      ${Object.keys(PL).filter(id => !known.has(id) && !(/^sp_/.test(id) && !SPARE)).length ? `<div class="card"><p class="warn">⚠️ ${T('Some homes are on plots this map no longer has:', 'Có nhà nằm trên mảnh mà bản đồ này không còn:')} ${Object.keys(PL).filter(id => !known.has(id) && !(/^sp_/.test(id) && !SPARE)).map(esc).join(', ')}</p></div>` : ''}
      <div class="bar"><button class="btn" id="save">💾 ${T('Save', 'Lưu')}</button></div>`;
    P.querySelectorAll<HTMLInputElement>('[data-plot]').forEach(b => b.onclick = () => edit(b.dataset.plot));
    if ($('#spare')) $('#spare').onclick = async () => { $('#spare').disabled = true; $('#spareres').textContent = T('Opening the game to look…', 'Đang mở game để xem…'); try { SPARE = await sparePlots(); draw(); } catch (e) { $('#spare').disabled = false; $('#spareres').textContent = '⚠️ ' + e.message; } };
    $('#save').onclick = () => { if (!Object.keys(PL).length) delete CONTENT.plots; else CONTENT.plots = PL; saveContent().catch(fail); };
  };
  // one plot: the house, the name on its door, who lives there and what they say, the wall colour
  const edit = id => {
    const p = [...M.PLOTS, ...(SPARE || [])].find(x => x.id === id), h = PL[id] ? JSON.parse(JSON.stringify(PL[id])) : { type: (HOMES.find(([k]) => k === 'village') || HOMES[0])[0], name: ['', ''], owner: { name: '', line: ['', ''] }, color: '' };
    h.name = h.name || ['', '']; h.owner = h.owner || { name: '', line: ['', ''] }; h.owner.line = h.owner.line || ['', ''];
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="card plotform"><h3>🏡 ${esc(p ? T(p.address[0], p.address[1]) : id)}</h3>
      <label>${T('The house', 'Kiểu nhà')}</label><select data-f="type">${HOMES.map(([k, t]) => `<option value="${k}" ${k === h.type ? 'selected' : ''}>${esc(T(t.name[0], t.name[1]))}</option>`).join('')}</select>
      <label>${T('Name on the door', 'Tên trên cửa')}</label><div class="row"><input type="text" data-f="n0" maxlength="40" value="${esc(h.name[0])}" placeholder="English"><input type="text" data-f="n1" maxlength="40" value="${esc(h.name[1])}" placeholder="Tiếng Việt"></div>
      <label>${T('Who lives there', 'Ai ở đó')}</label><input type="text" data-f="o" maxlength="40" value="${esc(h.owner.name)}" placeholder="${T('e.g. Bà Nội', 'vd. Bà Nội')}">
      <label>${T('What they say', 'Họ nói gì')}</label><div class="row"><input type="text" data-f="l0" maxlength="160" value="${esc(h.owner.line[0])}" placeholder="English"><input type="text" data-f="l1" maxlength="160" value="${esc(h.owner.line[1])}" placeholder="Tiếng Việt"></div>
      <label>${T('Wall colour', 'Màu tường')}</label><div class="swatches">${['#9fd8c8', '#ffb3a0', '#f2d6a0', '#efe0bf', '#cfe6ee', '#f6e27a', '#d9c3f0', '#ffffff'].map(c => `<button type="button" class="sw ${c === h.color ? 'on' : ''}" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div>
      <div class="bar" style="position:static;background:none">${PL[id] ? `<button class="btn bad" data-x="off">🗑️ ${T('Back to a garden', 'Trả lại vườn')}</button>` : ''}<button class="btn ghost" data-x="cancel">${T('Cancel', 'Hủy')}</button><button class="btn" data-x="ok">✅ ${T('Done', 'Xong')}</button></div></div>`;
    document.body.appendChild(m);
    m.querySelectorAll<HTMLInputElement>('[data-c]').forEach(b => b.onclick = () => { h.color = b.dataset.c; m.querySelectorAll<HTMLInputElement>('[data-c]').forEach(x => x.classList.toggle('on', x === b)); });
    const v = k => m.querySelector<HTMLInputElement>(`[data-f="${k}"]`).value.trim();
    m.querySelector<HTMLInputElement>('[data-x="cancel"]').onclick = () => m.remove();
    const off = m.querySelector<HTMLInputElement>('[data-x="off"]'); if (off) off.onclick = () => { delete PL[id]; CONTENT.plots = PL; m.remove(); draw(); paintState(); };
    m.querySelector<HTMLInputElement>('[data-x="ok"]').onclick = () => { h.type = v('type'); h.name = [v('n0'), v('n1')]; h.owner = { name: v('o'), line: [v('l0'), v('l1')] }; if (!h.color) delete h.color; PL[id] = h; CONTENT.plots = PL; m.remove(); draw(); paintState(); };
  };
  draw();
};
// ---------- map: add, place, move and remove the family's own villagers ----------
const LOOKS = { style: ['dress', 'shirt', 'aodai', 'tunic', 'overalls', 'hoodie'], hairStyle: ['buns', 'short', 'long', 'ponytail', 'spiky'], color: ['#ff5fa2', '#a66bff', '#3cc7e8', '#ffd23f', '#e8434a', '#5fd39a', '#ff9f43', '#3b6fe0', '#ffffff'], hair: ['#1d1412', '#3b2618', '#6b4226', '#c98b4a', '#e8c26a', '#a8432a', '#d9d9d9'], skin: ['#ffe3d1', '#f6c7a5', '#e0aa80', '#b47a55', '#7a4e33'] };
// the looks' choices in words (a list box cannot show pictures)
const LOOK_WORDS: Record<string, [string, string]> = { dress: ['Dress', 'Váy'], shirt: ['Shirt and shorts', 'Áo và quần soóc'], aodai: ['Áo dài', 'Áo dài'], tunic: ['Tunic', 'Áo tunic'], overalls: ['Overalls', 'Quần yếm'], hoodie: ['Hoodie', 'Áo hoodie'],
  buns: ['Buns', 'Búi tóc'], short: ['Short', 'Tóc ngắn'], long: ['Long', 'Tóc dài'], ponytail: ['Ponytail', 'Tóc đuôi ngựa'], spiky: ['Spiky', 'Tóc dựng'] };
const lookWord = v => LOOK_WORDS[v] ? T(...LOOK_WORDS[v]) : v;
let mapCanvas = null, mapMode = 'npc', SNAP = null;
// the buildings that are in the game now: the game itself is opened out of sight and asked (it needs a moment)
async function worldSnapshot() {
  const f: HTMLIFrameElement = document.createElement('iframe'); f.style.cssText = 'position:fixed;left:-2000px;top:0;width:400px;height:300px;border:0'; f.src = GAME + 'index.html?studio=1'; document.body.appendChild(f);
  try {
    for (let i = 0; i < 120; i++) { await new Promise(r => setTimeout(r, 500)); const G = f.contentWindow && f.contentWindow.__sv; if (G && G.world && G.world.boxes && G.interactables && G.interactables.length > 50) {
      await new Promise(r => setTimeout(r, 1500));
      const lab = it => { try { return typeof it.label === 'function' ? it.label({ i: 0, profile: { leafies: {}, shrines: {} }, pos: { y: 0 } }) : it.id; } catch (e) { return it.id; } };
      const near = (x, z, r) => { let best = '', bd = r; for (const it of G.interactables) { const d = Math.hypot(it.x - x, it.z - z); if (d < bd && !/^g\d|^lf|^wr|^fl|^dig/.test(it.id)) { bd = d; best = lab(it); } } return best; };
      const items: { x: number, z: number, w: number, d: number, round?: boolean, name?: string }[] = G.world.boxes.filter(b => !b.room && b.x1 - b.x0 < 40 && b.z1 - b.z0 < 40 && b.x1 - b.x0 > 1.5).map(b => ({ x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2, w: b.x1 - b.x0, d: b.z1 - b.z0 }));
      for (const c of G.world.colliders) if (c.r >= 2.5 && c.r <= 12 && Math.abs(c.r * 20 - Math.round(c.r * 20)) < 1e-6) items.push({ x: c.x, z: c.z, w: c.r * 1.6, d: c.r * 1.6, round: true });
      items.forEach(it => { it.name = near(it.x, it.z, Math.max(it.w, it.d) / 2 + 5).replace(/^(About|Giới thiệu|Talk to|Nói chuyện với):?\s*/i, ''); });
      return items;
    } }
    throw new Error(T('The game did not open in time.', 'Game chưa mở kịp.'));
  } finally { f.remove(); }
}
PAGES.map = async P => {
  CONTENT.npcs = CONTENT.npcs || []; CONTENT.npcs.forEach(c => { c.id ||= String(c.name || '').replace(/[^\p{L}\p{N}]+/gu, '_') || crypto.randomUUID(); c.faceName ||= c.name; }); CONTENT.world = CONTENT.world || {}; const WD = CONTENT.world; WD.build = WD.build || []; WD.edits = WD.edits || []; WD.land = WD.land || [];
  P.innerHTML = `<h2>🗺️ ${T('Map: build and change the world', 'Bản đồ: xây dựng và sửa thế giới')}</h2><p class="sub">${T('Add villagers and buildings, move or remove what is there, and make more flat land for new towns. Changes appear in the game after you publish.', 'Thêm nhân vật và nhà cửa, dời hoặc xóa những gì đang có, và làm thêm đất bằng cho phố mới. Thay đổi xuất hiện trong game sau khi phát hành.')}</p><div class="card" id="mapwrap">${T('Drawing the map…', 'Đang vẽ bản đồ…')}</div>`;
  const W = await import(GAME + 'js/world.js'), WE = await import(GAME + 'js/worldedit.js'), TYPES = WE.BUILD_TYPES;
  // (round T) the map's edits belong to one layout of the valley (world.map). Edits made on an older layout are put aside
  // (CONTENT.parked), never placed at the wrong spot; everything saved from here is stamped with this layout
  if ((WD.map || 'C') !== W.MAP_VERSION && (WD.build.length || WD.edits.length || WD.land.length || CONTENT.npcs.length)) {
    CONTENT.parked = (CONTENT.parked || []).concat([{ map: WD.map || 'C', world: { build: WD.build, edits: WD.edits, land: WD.land }, npcs: CONTENT.npcs, at: new Date().toISOString() }]);
    WD.build = []; WD.edits = []; WD.land = []; CONTENT.npcs = [];
    toast(T('The valley has a new map. Your earlier villagers and buildings are kept aside, to place again.', 'Thung lũng có bản đồ mới. Nhân vật và nhà cửa bạn đã thêm trước đây được cất riêng, để đặt lại.'));
  }
  WD.map = W.MAP_VERSION;
  const S = 800, k = S / W.SIZE, toPx = (x, z) => [(x + W.HALF) * k, (z + W.HALF) * k], toW = (px, py) => [px / k - W.HALF, py / k - W.HALF];
  if (!mapCanvas) mapCanvas = W.paintMap(S);
  const MODES = [['npc', '👥', T('Villagers', 'Nhân vật')], ['build', '🏠', T('Build', 'Xây')], ['move', '↔️', T('Move', 'Dời')], ['remove', '🧹', T('Remove', 'Xóa bỏ')], ['land', '🟫', T('Flat land', 'Đất bằng')]];
  $('#mapwrap').outerHTML = `<div class="card"><div class="row modes">${MODES.map(([m, i, l]) => `<button class="btn small ${mapMode === m ? '' : 'ghost'}" data-mode="${m}">${i} ${l}</button>`).join('')}
      <button class="btn small pink" id="snap">🔎 ${SNAP ? T('Buildings shown', 'Đang hiện nhà cửa') : T('Show the buildings that are there now', 'Hiện nhà cửa đang có')}</button><span class="note" id="snapres"></span></div><p class="note" id="modehelp"></p></div>
    <div class="mapgrid"><div class="card mapbox"><div class="row modes" style="margin-bottom:6px"><span class="note">${T('Zoom', 'Phóng to')}</span>${[1, 2, 3].map(z => `<button class="btn small ghost" data-z="${z}">${z}×</button>`).join('')}</div><div class="mapscroll"><canvas id="mc" width="${S}" height="${S}"></canvas></div></div><div class="card" id="npcform"></div></div>
    <div class="card"><h3>📋 ${T('Your changes', 'Thay đổi của bạn')}</h3><div id="npclist"></div></div><div id="parkedbox"></div><div class="bar"><button class="btn" id="save">💾 ${T('Save the map', 'Lưu bản đồ')}</button></div>`;
  const cv = $<HTMLCanvasElement>('#mc'), g = cv.getContext('2d'); let sel = null, drag = null, zoom = 1, rect = null;
  const HELP = { npc: T('Tap the map to add someone; drag a marker to move them; tap a marker to change or remove them.', 'Chạm bản đồ để thêm người; kéo dấu để dời; chạm dấu để sửa hoặc xóa.'),
    build: T('Choose a building on the right, then tap the map where it should stand. Drag it to move; turn it with the slider.', 'Chọn loại nhà bên phải, rồi chạm vào chỗ muốn xây. Kéo để dời; xoay bằng thanh trượt.'),
    move: T('Tap a building (show the buildings first), then drag the green arrow end to where it should go. Everything inside the circle moves with it: people, stalls, trees.', 'Chạm vào một ngôi nhà (bấm hiện nhà cửa trước), rồi kéo đầu mũi tên xanh tới chỗ mới. Mọi thứ trong vòng tròn đi theo: người, sạp, cây.'),
    remove: T('Tap what should go. Everything inside the red circle is taken away (make the circle bigger or smaller on the right).', 'Chạm vào thứ cần bỏ. Mọi thứ trong vòng tròn đỏ sẽ bị xóa (chỉnh vòng to nhỏ ở bên phải).'),
    land: T('Drag a rectangle on the map to make it flat land for new houses, or grow a whole place on the right.', 'Kéo một hình chữ nhật trên bản đồ để làm đất bằng cho nhà mới, hoặc mở rộng cả một nơi ở bên phải.') };
  let buildType = Object.entries<BuildType>(TYPES).find(([, type]) => type.home && type.culture === 'vietnam')?.[0] || 'tube';
  let buildCulture = (TYPES[buildType] as BuildType | undefined)?.culture || 'other-homes', buildSearch = '';
  let previewRequest = 0;
  const CULTURES = [
    { id: 'vietnam', label: T('Vietnamese houses', 'Nhà Việt Nam') },
    { id: 'australia', label: T('Australian houses', 'Nhà Úc') },
    { id: 'other-homes', label: T('Other homes', 'Nhà khác') },
    { id: 'other-buildings', label: T('Other buildings', 'Công trình khác') }
  ];
  const cultureOf = (type: BuildType) => type.culture === 'vietnam' || type.culture === 'australia'
    ? type.culture : type.home ? 'other-homes' : 'other-buildings';
  const typeName = (type: BuildType) => T(type.name?.[0] || '', type.name?.[1] || type.name?.[0] || '');
  const searchingTypes = () => !!buildSearch.trim();
  const matchedTypes = () => {
    const query = buildSearch.trim().toLocaleLowerCase();
    return Object.entries<BuildType>(TYPES)
      .filter(([id, type]) => !query || `${id} ${type.name?.join(' ') || ''}`.toLocaleLowerCase().includes(query));
  };
  const typePicker = (selected: string, editable = false) => {
    const entries = matchedTypes(), visibleCulture = buildCulture, showAllCultures = searchingTypes();
    const groups = CULTURES.map(group => ({ ...group, items: entries.filter(([, type]) => cultureOf(type) === group.id) }))
      .filter(group => group.items.length && (!visibleCulture || showAllCultures || group.id === visibleCulture));
    const selectedType = TYPES[selected] as BuildType | undefined;
    return `<div class="house-picker">
      ${selectedType?.home ? `<div class="house-preview"><div class="house-preview-art" data-house-preview></div><div><b>${esc(typeName(selectedType))}</b><p class="note">${T('Preview of the selected house', 'Hình xem trước ngôi nhà đã chọn')}</p></div></div>` : ''}
      ${editable ? `<details class="house-choices" ${buildSearch ? 'open' : ''}><summary>${T('Choose another style', 'Chọn kiểu nhà khác')}</summary>` : ''}
      <label for="house-search">${T('Find a style', 'Tìm kiểu nhà')}</label>
      <input id="house-search" type="search" data-house-search value="${esc(buildSearch)}" placeholder="${T('Search English or Vietnamese names', 'Tìm tên tiếng Anh hoặc tiếng Việt')}" autocomplete="off">
      <div class="house-tabs" role="group" aria-label="${T('House groups', 'Nhóm nhà')}">${CULTURES.map(group => {
        const count = Object.entries<BuildType>(TYPES).filter(([, type]) => cultureOf(type) === group.id).length;
        return `<button type="button" class="btn small ${buildCulture === group.id ? '' : 'ghost'}" data-house-culture="${group.id}" aria-pressed="${buildCulture === group.id}" ${count ? '' : 'disabled'}>${esc(group.label)} <span class="note">(${count})</span></button>`;
      }).join('')}</div>
      <div class="house-type-list" aria-label="${T('Available building styles', 'Các kiểu công trình hiện có')}">${groups.map(group => `
        <section class="house-type-group" data-house-group="${group.id}"><h4>${esc(group.label)}</h4><div class="house-type-grid">${group.items.map(([id, type]) =>
          `<button type="button" class="house-type ${id === selected ? 'on' : ''}" data-house-type="${esc(id)}" aria-pressed="${id === selected}">
            <span class="house-type-icon" aria-hidden="true">${type.icon || '⌂'}</span><span>${esc(typeName(type))}</span></button>`).join('')}</div></section>`).join('') || `<p class="note">${T('No styles match this search.', 'Không tìm thấy kiểu nhà phù hợp.')}</p>`}</div>
      ${editable ? '</details>' : ''}
    </div>`;
  };
  const showHousePreview = async (id: string) => {
    const mount = $<HTMLDivElement>('[data-house-preview]');
    const type = TYPES[id] as BuildType | undefined;
    if (!mount || !type?.home) return;
    const request = ++previewRequest;
    try {
      const { THREE, merge, toonVC } = await import(GAME + 'js/gfx.js');
      if (request !== previewRequest || !mount.isConnected) return;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      try {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(280, 160, false);
        const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(34, 280 / 160, .1, 500);
        scene.add(new THREE.HemisphereLight(0xffffff, 0x776655, 2));
        const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-5, 9, 8); scene.add(key);
        const model = type.mk({});
        const builtGeometry = model.geo || (model.parts ? merge(model.parts) : null);
        const previewModel = model.obj || (builtGeometry && new THREE.Mesh(builtGeometry, toonVC()));
        if (!previewModel) throw new Error('This house type did not provide a preview model.');
        try {
          const bounds = new THREE.Box3().setFromObject(previewModel), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
          previewModel.position.sub(center); scene.add(previewModel);
          const extent = Math.max(size.x, size.y, size.z, 1), distance = extent * 2.35;
          camera.position.set(distance * .82, distance * .72, distance);
          camera.near = Math.max(.1, extent / 100); camera.far = distance * 8;
          camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
          renderer.render(scene, camera);
          const image = document.createElement('img');
          image.src = renderer.domElement.toDataURL('image/png'); image.alt = T(`Preview of ${type.name?.[0] || 'house'}`, `Hình xem trước ${type.name?.[1] || 'ngôi nhà'}`);
          if (request !== previewRequest || !mount.isConnected) return;
          mount.replaceChildren(image);
        } finally {
          previewModel.traverse(node => {
            if (!node.isMesh) return;
            node.geometry?.dispose();
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.forEach(material => { if (!material.userData.shared) material.dispose(); });
          });
          if (model.parts) model.parts.forEach(part => part.g.dispose());
        }
      } finally { renderer.dispose(); }
    } catch (error) {
      if (request !== previewRequest || !mount.isConnected) return;
      mount.textContent = T('The preview could not be shown. You can still choose this house.', 'Không thể hiện hình xem trước. Bạn vẫn có thể chọn ngôi nhà này.');
      console.error('Studio house preview failed', error);
    }
  };
  const bindTypePicker = (selected: string, changed: (id: string) => void, editable = false) => {
    const F = $('#npcform');
    F.querySelectorAll<HTMLButtonElement>('[data-house-culture]').forEach(button => button.onclick = () => {
      buildCulture = button.dataset.houseCulture || 'vietnam'; form();
    });
    const search = F.querySelector<HTMLInputElement>('[data-house-search]');
    if (search) search.oninput = () => { buildSearch = search.value; form(); const next = F.querySelector<HTMLInputElement>('[data-house-search]'); next?.focus(); next?.setSelectionRange(buildSearch.length, buildSearch.length); };
    F.querySelectorAll<HTMLButtonElement>('[data-house-type]').forEach(button => button.onclick = () => {
      const id = button.dataset.houseType;
      if (!id || !TYPES[id]) return;
      buildType = id; buildCulture = cultureOf(TYPES[id]); changed(id); form();
    });
    if (!editable || TYPES[selected]?.home) void showHousePreview(selected);
  };
  const PL = k => { const p = ALBUM_PLACES.find(x => x[0] === k); return p ? T(p[1], p[2]) : k; };
  const places = [...W.CITIES.map(c => [c.x, c.z, T(c.name[0], c.name[1]), c.icon, c]), [W.VILLAGE.x, W.VILLAGE.z, PL('village'), '🪷'], [W.CHINA.x, W.CHINA.z, PL('china'), '🏮'], [W.INDIA.x, W.INDIA.z, PL('india'), '🪔'], [W.HOME.x, W.HOME.z, PL('home'), '🏡'], [(W.TOWN.x0 + W.TOWN.x1) / 2, W.TOWN.roadZ, PL('town'), '🏘️', W.TOWN], [(W.MARKET.x0 + W.MARKET.x1) / 2, W.MARKET.roadZ, PL('market'), '🧺', W.MARKET], [(W.AUSSIE.x0 + W.AUSSIE.x1) / 2, W.AUSSIE.roadZ, PL('aussie'), '🦘', W.AUSSIE]];
  const where = (x, z) => { if (W.heightAt(x, z) < W.WATER + .4) return ['bad', T('in the water', 'dưới nước')]; const rd = W.roadDist(x, z); if (rd.road && rd.d < rd.road.w / 2 + .8) return ['bad', T('on a road', 'giữa đường')]; return ['ok', '']; };
  // ---------- (round T, board) things kept aside from an older map: place them again, or forget them ----------
  // A villager or a building goes next to the same place on the new map: the old place nearest to it (LEGACY in
  // js/content/map.js), with the same offset from its centre; in water or on a road, on the place's centre instead.
  const M = await import(GAME + 'js/content/map.js'), OLD = M.LEGACY || {};
  const nearest = (anchors, x, z) => { let best = null, bd = Infinity; for (const [id, a] of anchors) { const d = Math.hypot(x - a[0], z - a[1]); if (d < bd) { bd = d; best = [id, a]; } } return best; };
  const NOW = M.PLACES.filter(p => p.kind !== 'island' && p.kind !== 'river').map(p => [p.id, M.anchorOf(p.id)]).filter(([, a]) => a);
  const reproject = (map, x, z) => { const n = nearest(Object.entries(OLD[map] || OLD.C || {}).filter(([id]) => M.anchorOf(id)), x, z); if (!n) return null;
    const [id, [ax, az]] = n, [nx, nz] = M.anchorOf(id); let X = +(nx + x - ax).toFixed(1), Z = +(nz + z - az).toFixed(1); if (where(X, Z)[0] !== 'ok') { X = nx; Z = nz; }
    return { x: X, z: Z, place: id, off: [+(X - nx).toFixed(1), +(Z - nz).toFixed(1)] }; };
  // everything saved from here also names its place and the offset from it (round T: new features never rely on raw x, z alone)
  const placeOf = it => { const n = nearest(NOW, it.x, it.z); if (n) { it.place = n[0]; it.off = [+(it.x - n[1][0]).toFixed(1), +(it.z - n[1][1]).toFixed(1)]; } return it; };
  const pname = id => { const p = ALBUM_PLACES.find(x => x[0] === id), c = W.CITIES.find(x => x.id === id); return p ? T(p[1], p[2]) : c ? T(c.name[0], c.name[1]) : id; };
  function parkedCard() {
    const box = $('#parkedbox'); if (!box) return; const PK = Array.isArray(CONTENT.parked) ? CONTENT.parked : [];
    PK.forEach(g => { g.world = g.world || {}; g.npcs = g.npcs || []; g.world.build = g.world.build || []; g.world.edits = g.world.edits || []; g.world.land = g.world.land || []; });
    const rows = [], circles = PK.reduce((a, g) => a + g.world.edits.length + g.world.land.length, 0);
    PK.forEach((g, gi) => { g.npcs.forEach((c, i) => rows.push({ gi, kind: 'npcs', i, label: (c.gender === 'm' ? '👨 ' : '👩 ') + (c.name || '?'), it: c }));
      g.world.build.forEach((b, i) => rows.push({ gi, kind: 'build', i, label: ((TYPES[b.type] || {}).icon || '🏠') + ' ' + ((b.name && (b.name[1] || b.name[0])) || T2(((TYPES[b.type] || {}).name || ['A building', 'Một ngôi nhà']))), it: b })); });
    if (!PK.length) { box.innerHTML = ''; return; }
    box.innerHTML = `<div class="card parked"><h3>📦 ${T('Kept aside from the old map', 'Cất riêng từ bản đồ cũ')} (${rows.length})</h3>
      <p class="note">${T('The valley has a new map, so these were not put in the game. “Place again” puts each one next to the same place on the new map (you can drag it after). Then Save.', 'Thung lũng có bản đồ mới, nên những thứ này chưa được đặt vào game. “Đặt lại” đặt từng thứ cạnh đúng nơi đó trên bản đồ mới (sau đó kéo được). Rồi bấm Lưu.')}</p>
      ${rows.map((r, k) => { const to = reproject(PK[r.gi].map || 'C', r.it.x, r.it.z); return `<div class="row prow"><span><b>${esc(r.label)}</b><br><span class="note">📍 ${to ? esc(T('next to ', 'cạnh ') + pname(to.place)) : T('no place found', 'không tìm thấy nơi')}</span></span>
        <button class="btn small" data-place="${k}" ${to ? '' : 'disabled'}>📍 ${T('Place again', 'Đặt lại')}</button><button class="btn small ghost" data-forget="${k}">🗑️ ${T('Forget', 'Bỏ')}</button></div>`; }).join('')}
      ${circles ? `<div class="row prow"><span class="note">🧹 ${T(`${circles} move, remove or flat-land change(s) cannot be carried over (they pointed at buildings of the old map): make them again on this map if you still want them.`, `${circles} thay đổi dời, xóa hoặc đất bằng không chuyển sang được (chúng chỉ vào nhà của bản đồ cũ): hãy làm lại trên bản đồ này nếu vẫn cần.`)}</span><button class="btn small ghost" data-forgetc>🗑️ ${T('Forget them', 'Bỏ chúng')}</button></div>` : ''}
      <div class="row" style="justify-content:flex-end">${rows.length ? `<button class="btn" data-placeall>📍 ${T('Place them all again', 'Đặt lại tất cả')}</button>` : ''}<button class="btn ghost" data-forgetall>🗑️ ${T('Forget everything kept aside', 'Bỏ hết những thứ cất riêng')}</button></div></div>`;
    const tidy = () => { CONTENT.parked = PK.filter(g => g.npcs.length || g.world.build.length || g.world.edits.length || g.world.land.length); if (!CONTENT.parked.length) delete CONTENT.parked; };
    const place = r => { const to = reproject(PK[r.gi].map || 'C', r.it.x, r.it.z); if (!to) return; const it = { ...r.it, ...to }; (r.kind === 'npcs' ? CONTENT.npcs : WD.build).push(it); return it; };
    const drop = list => { list.sort((a, b) => b.i - a.i).forEach(r => { (r.kind === 'npcs' ? PK[r.gi].npcs : PK[r.gi].world.build).splice(r.i, 1); }); tidy(); };
    const again = () => { draw(); form(); list(); parkedCard(); paintState(); };
    box.querySelectorAll<HTMLInputElement>('[data-place]').forEach(b => b.onclick = () => { const r = rows[+b.dataset.place]; if (place(r)) { drop([r]); sel = { list: r.kind, i: (r.kind === 'npcs' ? CONTENT.npcs : WD.build).length - 1 }; again(); } });
    box.querySelectorAll<HTMLInputElement>('[data-forget]').forEach(b => b.onclick = () => { if (!confirm(T('Forget this one? It will not come back.', 'Bỏ mục này? Sẽ không lấy lại được.'))) return; drop([rows[+b.dataset.forget]]); again(); });
    const fc = box.querySelector<HTMLInputElement>('[data-forgetc]'); if (fc) fc.onclick = () => { PK.forEach(g => { g.world.edits = []; g.world.land = []; }); tidy(); again(); };
    const pa = box.querySelector<HTMLInputElement>('[data-placeall]'); if (pa) pa.onclick = () => { const done = rows.filter(r => place(r)); drop(done); again(); toast('📍 ' + T(`${done.length} placed again. Check them on the map, then Save.`, `Đã đặt lại ${done.length}. Xem trên bản đồ rồi bấm Lưu.`), 'good'); };
    box.querySelector<HTMLInputElement>('[data-forgetall]').onclick = () => { if (!confirm(T('Forget everything kept aside from the old map? It will not come back.', 'Bỏ hết những thứ cất riêng từ bản đồ cũ? Sẽ không lấy lại được.'))) return; delete CONTENT.parked; again(); };
  }
  const draw = () => {
    g.drawImage(mapCanvas, 0, 0, S, S); g.font = 'bold 13px Segoe UI, sans-serif'; g.textAlign = 'center';
    for (const L of WD.land) { const [a, b2] = toPx(L.x0, L.z0), [c, d] = toPx(L.x1, L.z1); g.fillStyle = 'rgba(190,140,70,.45)'; g.fillRect(a, b2, c - a, d - b2); g.strokeStyle = sel && sel.list === 'land' && WD.land[sel.i] === L ? '#8a5cf6' : '#8a5a2a'; g.lineWidth = 2; g.strokeRect(a, b2, c - a, d - b2); }
    if (rect) { const [a, b2] = toPx(rect[0], rect[1]), [c, d] = toPx(rect[2], rect[3]); g.strokeStyle = '#8a5cf6'; g.setLineDash([6, 4]); g.strokeRect(a, b2, c - a, d - b2); g.setLineDash([]); }
    if (SNAP) for (const it of SNAP) { const [a, b2] = toPx(it.x - it.w / 2, it.z - it.d / 2); g.fillStyle = 'rgba(60,50,80,.35)'; g.fillRect(a, b2, it.w * k, it.d * k); }
    for (const [x, z, n, ic] of places) { const [px, py] = toPx(x, z); g.fillStyle = 'rgba(255,255,255,.85)'; const w = g.measureText(ic + ' ' + n).width + 10; g.fillRect(px - w / 2, py - 9, w, 18); g.fillStyle = '#3b2a4f'; g.fillText(ic + ' ' + n, px, py + 4); }
    WD.edits.forEach((e, i) => { const [px, py] = toPx(e.x, e.z), on = sel && sel.list === 'edits' && sel.i === i; g.beginPath(); g.arc(px, py, e.r * k, 0, 7); g.lineWidth = on ? 4 : 2; g.strokeStyle = e.op === 'move' ? '#2f9a5a' : '#d2232a'; g.fillStyle = e.op === 'move' ? 'rgba(47,154,90,.15)' : 'rgba(210,35,42,.18)'; g.fill(); g.stroke();
      if (e.op === 'move') { const [tx, ty] = toPx(e.x + (e.dx || 0), e.z + (e.dz || 0)); g.beginPath(); g.moveTo(px, py); g.lineTo(tx, ty); g.stroke(); g.beginPath(); g.arc(tx, ty, Math.max(6, e.r * k), 0, 7); g.setLineDash([4, 3]); g.stroke(); g.setLineDash([]); g.beginPath(); g.arc(tx, ty, 6, 0, 7); g.fillStyle = '#2f9a5a'; g.fill(); } else { g.fillStyle = '#d2232a'; g.fillText('✕', px, py + 4); } });
    WD.build.forEach((b, i) => { const [px, py] = toPx(b.x, b.z), on = sel && sel.list === 'build' && sel.i === i; g.font = (on ? 26 : 20) + 'px sans-serif'; g.fillText((TYPES[b.type] || {}).icon || '🏠', px, py + 7); g.font = 'bold 13px Segoe UI, sans-serif'; });
    CONTENT.npcs.forEach((c, i) => { const [px, py] = toPx(c.x, c.z), on = sel && sel.list === 'npcs' && sel.i === i; g.beginPath(); g.arc(px, py, on ? 11 : 8, 0, 7); g.fillStyle = c.gender === 'm' ? '#3b6fe0' : '#ff5fa2'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke(); g.fillStyle = '#3b2a4f'; g.fillText(c.name || '?', px, py - 14); });
  };
  const evPos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * S / r.width, (e.clientY - r.top) * S / r.height]; };
  const hitAt = (px, py) => {
    const [x, z] = toW(px, py);
    const lists: [string, { x: number, z: number }[]][] = [['npcs', CONTENT.npcs], ['build', WD.build]];
    for (const [list, arr] of lists) { const i = arr.findIndex(c => Math.hypot(c.x - x, c.z - z) * k < 13); if (i >= 0) return { list, i }; }
    for (let i = 0; i < WD.edits.length; i++) { const e = WD.edits[i]; if (e.op === 'move' && Math.hypot(e.x + (e.dx || 0) - x, e.z + (e.dz || 0) - z) * k < 12) return { list: 'edits', i, end: true }; if (Math.hypot(e.x - x, e.z - z) < e.r) return { list: 'edits', i }; }
    const li = WD.land.findIndex(L => x > Math.min(L.x0, L.x1) && x < Math.max(L.x0, L.x1) && z > Math.min(L.z0, L.z1) && z < Math.max(L.z0, L.z1)); if (li >= 0 && mapMode === 'land') return { list: 'land', i: li };
    return null;
  };
  const snapAt = (x, z) => SNAP && SNAP.find(it => Math.abs(it.x - x) < it.w / 2 + .5 && Math.abs(it.z - z) < it.d / 2 + .5);
  cv.onpointerdown = e => {
    const [px, py] = evPos(e), [x, z] = toW(px, py), h = hitAt(px, py); cv.setPointerCapture(e.pointerId);
    if (h && !(mapMode === 'land' && h.list !== 'land')) { sel = h; drag = { ...h, ox: x, oz: z }; draw(); form(); list(); return; }
    const X = +x.toFixed(1), Z = +z.toFixed(1);
    if (mapMode === 'npc') { CONTENT.npcs.push({ id: crypto.randomUUID(), name: T('New friend', 'Bạn mới'), gender: 'f', x: X, z: Z, face: 0, icon: '💬', look: { style: 'shirt', color: '#5fd39a', hairStyle: 'short', hair: '#1d1412', skin: '#f6c7a5', age: 'adult' }, lines: [['Hello! Nice to see you!', 'Xin chào! Gặp con vui quá!']] }); sel = { list: 'npcs', i: CONTENT.npcs.length - 1 }; }
    else if (mapMode === 'build') { WD.build.push({ type: buildType, x: X, z: Z, rot: 0, name: ['', ''], owner: { name: '', line: ['', ''] } }); sel = { list: 'build', i: WD.build.length - 1 }; }
    else if (mapMode === 'move' || mapMode === 'remove') { const b = snapAt(x, z), cx = b ? +b.x.toFixed(1) : X, cz = b ? +b.z.toFixed(1) : Z, r = b ? +Math.min(30, Math.max(b.w, b.d) / 2 + 2).toFixed(1) : 5; WD.edits.push(mapMode === 'move' ? { op: 'move', x: cx, z: cz, r, dx: 15, dz: 0, turn: 0, what: b ? b.name : '' } : { op: 'remove', x: cx, z: cz, r, what: b ? b.name : '' }); sel = { list: 'edits', i: WD.edits.length - 1 }; }
    else if (mapMode === 'land') { rect = [X, Z, X, Z]; drag = { rect: true }; }
    draw(); form(); list();
  };
  cv.onpointermove = e => {
    if (!drag) return; const [px, py] = evPos(e), [x, z] = toW(px, py);
    if (drag.rect) { rect[2] = +x.toFixed(1); rect[3] = +z.toFixed(1); draw(); return; }
    const arr = drag.list === 'npcs' ? CONTENT.npcs : WD[drag.list], it = arr[drag.i]; if (!it) return;
    if (drag.list === 'edits' && drag.end) { it.dx = +(x - it.x).toFixed(1); it.dz = +(z - it.z).toFixed(1); }
    else if (drag.list === 'land') { const ddx = x - drag.ox, ddz = z - drag.oz; it.x0 += ddx; it.x1 += ddx; it.z0 += ddz; it.z1 += ddz; drag.ox = x; drag.oz = z; }
    else { it.x = +x.toFixed(1); it.z = +z.toFixed(1); }
    draw();
  };
  cv.onpointerup = () => { if (drag && drag.rect) { const [x0, z0, x1, z1] = rect; if (Math.abs(x1 - x0) > 3 && Math.abs(z1 - z0) > 3) { WD.land.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) }); sel = { list: 'land', i: WD.land.length - 1 }; } rect = null; }
    drag = null; draw(); form(); list(); };
  P.querySelectorAll<HTMLInputElement>('[data-z]').forEach(b => b.onclick = () => { zoom = +b.dataset.z; cv.style.width = S * zoom + 'px'; cv.style.height = S * zoom + 'px'; });
  P.querySelectorAll<HTMLInputElement>('[data-mode]').forEach(b => b.onclick = () => { mapMode = b.dataset.mode; P.querySelectorAll<HTMLInputElement>('[data-mode]').forEach(x => x.classList.toggle('ghost', x.dataset.mode !== mapMode)); $('#modehelp').textContent = HELP[mapMode]; sel = null; form(); draw(); });
  $('#modehelp').textContent = HELP[mapMode];
  $('#snap').onclick = async () => { $('#snapres').textContent = T('Opening the game to look… (up to a minute)', 'Đang mở game để xem… (tối đa một phút)'); try { SNAP = await worldSnapshot(); $('#snapres').textContent = `✅ ${SNAP.length} ${T('buildings', 'công trình')}`; draw(); } catch (e) { $('#snapres').textContent = '⚠️ ' + e.message; } };
  const sw = (key, vals, cur) => `<div class="swatches">${vals.map(v => `<button class="sw ${v === cur ? 'on' : ''}" data-${key}="${v}" style="background:${v}"></button>`).join('')}</div>`;
  function form() {
    const F = $('#npcform');
    if (!sel) {
      if (mapMode === 'build') {
        F.innerHTML = `<h3>🏠 ${T('What to build', 'Xây gì')}</h3>${typePicker(buildType)}<p class="note">${T('Then tap the map. Houses become homes the children can visit; give them a name and someone living there.', 'Rồi chạm vào bản đồ. Nhà sẽ thành nhà để các con ghé thăm; đặt tên và người ở trong đó.')}</p>`;
        bindTypePicker(buildType, () => { }); return;
      }
      if (mapMode === 'land') { F.innerHTML = `<h3>🟫 ${T('Grow a place', 'Mở rộng một nơi')}</h3><p class="note">${T('Adds flat land all round a town, village or city, ready for new buildings.', 'Thêm đất bằng quanh một phố, làng hay thành phố, sẵn sàng để xây thêm.')}</p><select id="gp">${places.filter(p => p[4]).map((p, i) => `<option value="${i}">${p[3]} ${esc(p[2])}</option>`).join('')}</select><label>${T('Metres all round', 'Số mét mỗi phía')}</label><input type="number" id="gm" value="15" min="5" max="40"><button class="btn" id="gadd" style="margin-top:8px">➕ ${T('Add the land', 'Thêm đất')}</button>`;
        $('#gadd').onclick = () => { const p = places.filter(q => q[4])[+$('#gp').value][4], m = Math.max(5, Math.min(40, +$('#gm').value || 15)); const x0 = p.x0 ?? p.x - (p.w || 13) / 2, x1 = p.x1 ?? p.x + (p.w || 13) / 2, z0 = p.z0 ?? p.z - (p.d || 13) / 2, z1 = p.z1 ?? p.z + (p.d || 13) / 2; WD.land.push({ x0: +(x0 - m).toFixed(1), x1: +(x1 + m).toFixed(1), z0: +(z0 - m).toFixed(1), z1: +(z1 + m).toFixed(1) }); sel = { list: 'land', i: WD.land.length - 1 }; draw(); form(); list(); }; return; }
      F.innerHTML = `<p class="note">${HELP[mapMode]}</p>`; return;
    }
    const del = () => { if (!confirm(T('Remove this change?', 'Bỏ thay đổi này?'))) return; (sel.list === 'npcs' ? CONTENT.npcs : WD[sel.list]).splice(sel.i, 1); sel = null; draw(); form(); list(); };
    const done = `<div class="row"><button class="btn bad" id="fdel">🗑️ ${T('Remove', 'Xóa')}</button><button class="btn ghost" id="fdone">✅ ${T('Done', 'Xong')}</button></div>`;
    const bindDone = () => { $('#fdel').onclick = del; $('#fdone').onclick = () => { sel = null; draw(); form(); list(); }; };
    if (sel.list === 'build') {
      const b = WD.build[sel.i], t = TYPES[b.type] || {}, [okc, why] = where(b.x, b.z); b.name = b.name || ['', '']; b.owner = b.owner || { name: '', line: ['', ''] }; b.owner.line = b.owner.line || ['', ''];
      F.innerHTML = `<h3>${t.icon || '🏠'} ${esc(T(t.name?.[0] || '', t.name?.[1] || t.name?.[0] || ''))}</h3>${typePicker(b.type, true)}
        <label>${T('Turn', 'Xoay')}: <span id="brv">${Math.round((b.rot || 0) * 180 / Math.PI)}°</span></label><input type="range" id="br" min="-180" max="180" step="15" value="${Math.round((b.rot || 0) * 180 / Math.PI)}">
        ${t.home ? `<label>${T('Name on the door', 'Tên trên cửa')}</label><div class="row"><input type="text" id="bn0" value="${esc(b.name[0])}" placeholder="English"><input type="text" id="bn1" value="${esc(b.name[1])}" placeholder="Tiếng Việt"></div>
        <label>${T('Who lives there', 'Ai ở đó')}</label><input type="text" id="bo" value="${esc(b.owner.name)}" placeholder="${T('e.g. Bà Tư', 'vd. Bà Tư')}"><label>${T('What they say', 'Họ nói gì')}</label><div class="row"><input type="text" id="bl0" value="${esc(b.owner.line[0])}" placeholder="English"><input type="text" id="bl1" value="${esc(b.owner.line[1])}" placeholder="Tiếng Việt"></div>
        <label>${T('Wall colour', 'Màu tường')}</label>${sw('c', ['#9fd8c8', '#ffb3a0', '#f2d6a0', '#efe0bf', '#cfe6ee', '#f6e27a', '#d9c3f0', '#ffffff'], b.color)}` : ''}
        <p class="${okc === 'ok' ? 'ok' : 'badtxt'}">📍 ${b.x}, ${b.z} ${okc === 'ok' ? '✅' : '⚠️ ' + why}</p>${done}`;
      bindTypePicker(b.type, id => { b.type = id; draw(); }, true); $('#br').oninput = e => { b.rot = +val(e) * Math.PI / 180; $('#brv').textContent = val(e) + '°'; };
      if (t.home) { $('#bn0').oninput = e => { b.name[0] = val(e); list(); }; $('#bn1').oninput = e => { b.name[1] = val(e); }; $('#bo').oninput = e => { b.owner.name = val(e); }; $('#bl0').oninput = e => { b.owner.line[0] = val(e); }; $('#bl1').oninput = e => { b.owner.line[1] = val(e); }; F.querySelectorAll<HTMLInputElement>('[data-c]').forEach(x => x.onclick = () => { b.color = x.dataset.c; form(); }); }
      bindDone(); return;
    }
    if (sel.list === 'edits') {
      const e = WD.edits[sel.i];
      F.innerHTML = `<h3>${e.op === 'move' ? '↔️ ' + T('Move', 'Dời') : '🧹 ' + T('Remove', 'Xóa bỏ')}</h3><p>${esc(e.what || T('(whatever is in the circle)', '(mọi thứ trong vòng tròn)'))}</p>
        <label>${T('Circle size (metres)', 'Cỡ vòng tròn (mét)')}: <span id="erv">${e.r}</span></label><input type="range" id="er" min="1" max="30" step=".5" value="${e.r}">
        ${e.op === 'move' ? `<label>${T('Turn', 'Xoay')}: <span id="etv">${Math.round((e.turn || 0) * 180 / Math.PI)}°</span></label><input type="range" id="et" min="-180" max="180" step="15" value="${Math.round((e.turn || 0) * 180 / Math.PI)}"><p class="note">${T('Drag the green dot on the map to where it should go.', 'Kéo chấm xanh trên bản đồ tới chỗ mới.')}</p>` : `<p class="note">${T('Careful: people and shops inside the circle go too.', 'Cẩn thận: người và cửa hàng trong vòng tròn cũng mất.')}</p>`}${done}`;
      $('#er').oninput = x => { e.r = +val(x); $('#erv').textContent = e.r; draw(); }; if ($('#et')) $('#et').oninput = x => { e.turn = +val(x) * Math.PI / 180; $('#etv').textContent = val(x) + '°'; };
      bindDone(); return;
    }
    if (sel.list === 'land') { const L = WD.land[sel.i]; F.innerHTML = `<h3>🟫 ${T('Flat land', 'Đất bằng')}</h3><p>${Math.round(L.x1 - L.x0)} × ${Math.round(L.z1 - L.z0)} m</p><p class="note">${T('Drag it on the map to move it.', 'Kéo trên bản đồ để dời.')}</p>${done}`; bindDone(); return; }
    // a villager
    const c = CONTENT.npcs[sel.i]; if (!c) { sel = null; return form(); }
    const L = c.look = c.look || {}, [okc, why] = where(c.x, c.z);
    F.innerHTML = `<h3>✏️ ${esc(c.name)}</h3>
      <label>${T('Name (as the children call them)', 'Tên (như các con gọi)')}</label><input type="text" id="fn" value="${esc(c.name)}" maxlength="40">
      <div class="row"><div><label>${T('Voice', 'Giọng')}</label><select id="fg"><option value="f" ${c.gender !== 'm' ? 'selected' : ''}>👩 ${T('woman/girl', 'nữ')}</option><option value="m" ${c.gender === 'm' ? 'selected' : ''}>👨 ${T('man/boy', 'nam')}</option></select></div>
      <div><label>${T('Age', 'Tuổi')}</label><select id="fa">${[['kid', T('child', 'trẻ em')], ['adult', T('grown-up', 'người lớn')], ['old', T('grandparent', 'ông bà')]].map(([v, l]) => `<option value="${v}" ${(L.age || 'adult') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div><label>${T('Icon', 'Biểu tượng')}</label><input type="text" id="fi" value="${esc(c.icon || '💬')}" maxlength="4"></div></div>
      <div class="row"><div><label>${T('Clothes', 'Trang phục')}</label><select id="fs">${LOOKS.style.map(v => `<option value="${v}" ${L.style === v ? 'selected' : ''}>${lookWord(v)}</option>`).join('')}</select></div><div><label>${T('Hair', 'Tóc')}</label><select id="fh">${LOOKS.hairStyle.map(v => `<option value="${v}" ${L.hairStyle === v ? 'selected' : ''}>${lookWord(v)}</option>`).join('')}</select></div></div>
      <label>${T('Clothes colour', 'Màu áo')}</label>${sw('c', LOOKS.color, L.color)}<label>${T('Hair colour', 'Màu tóc')}</label>${sw('h', LOOKS.hair, L.hair)}<label>${T('Skin', 'Màu da')}</label>${sw('s', LOOKS.skin, L.skin)}
      <label>${T('What they say (one line per page)', 'Họ nói gì (mỗi dòng một trang)')}</label><div id="flines">${(c.lines || []).map((l, j) => `<div class="row" data-j="${j}"><input type="text" data-l="0" value="${esc(l[0])}" placeholder="English"><input type="text" data-l="1" value="${esc(l[1])}" placeholder="Tiếng Việt"><button class="btn small bad" data-rm style="flex:0 0 auto;min-width:0">✕</button></div>`).join('')}</div>
      <button class="btn small ghost" id="fadd">➕ ${T('Another line', 'Thêm dòng')}</button>
      <p class="${okc === 'ok' ? 'ok' : 'badtxt'}">📍 ${c.x}, ${c.z} ${okc === 'ok' ? '✅' : '⚠️ ' + why + ' – ' + T('drag them a little', 'kéo ra một chút')}</p>${done}`;
    const up = () => { draw(); list(); };
    $('#fn').oninput = e => { c.name = val(e); up(); }; $('#fg').onchange = e => { c.gender = val(e); up(); };
    $('#fa').onchange = e => { L.age = val(e); }; $('#fi').oninput = e => { c.icon = val(e); }; $('#fs').onchange = e => { L.style = val(e); }; $('#fh').onchange = e => { L.hairStyle = val(e); };
    F.querySelectorAll<HTMLInputElement>('[data-c]').forEach(b => b.onclick = () => { L.color = b.dataset.c; form(); }); F.querySelectorAll<HTMLInputElement>('[data-h]').forEach(b => b.onclick = () => { L.hair = b.dataset.h; form(); }); F.querySelectorAll<HTMLInputElement>('[data-s]').forEach(b => b.onclick = () => { L.skin = b.dataset.s; form(); });
    F.querySelectorAll<HTMLInputElement>('#flines [data-j]').forEach(r => { const j = +r.dataset.j; r.querySelectorAll<HTMLInputElement>('[data-l]').forEach(i => i.oninput = () => { c.lines[j][+i.dataset.l] = i.value; }); r.querySelector<HTMLInputElement>('[data-rm]').onclick = () => { c.lines.splice(j, 1); form(); }; });
    $('#fadd').onclick = () => { (c.lines = c.lines || []).push(['', '']); form(); };
    bindDone();
  }
  function list() {
    const chip = (list, i, label, warn?) => `<button class="btn small ${sel && sel.list === list && sel.i === i ? '' : 'ghost'}" data-l="${list}" data-i="${i}">${label}${warn ? ' ⚠️' : ''}</button> `;
    const html = [...CONTENT.npcs.map((c, i) => chip('npcs', i, (c.gender === 'm' ? '👨 ' : '👩 ') + esc(c.name), where(c.x, c.z)[0] !== 'ok')), ...WD.build.map((b, i) => chip('build', i, ((TYPES[b.type] || {}).icon || '🏠') + ' ' + esc((b.name && (b.name[1] || b.name[0])) || T((TYPES[b.type] || { name: ['', ''] }).name[0], (TYPES[b.type] || { name: ['', ''] }).name[1])), where(b.x, b.z)[0] !== 'ok')),
      ...WD.edits.map((e, i) => chip('edits', i, (e.op === 'move' ? '↔️ ' : '🧹 ') + esc(e.what || T('area', 'khu vực')))), ...WD.land.map((L, i) => chip('land', i, `🟫 ${Math.round(L.x1 - L.x0)}×${Math.round(L.z1 - L.z0)} m`))];
    $('#npclist').innerHTML = html.join('') || `<p class="note">${T('No changes yet.', 'Chưa có thay đổi.')}</p>`;
    $('#npclist').querySelectorAll<HTMLInputElement>('[data-l]').forEach(b => b.onclick = () => { sel = { list: b.dataset.l, i: +b.dataset.i }; draw(); form(); list(); });
  }
  draw(); form(); list(); parkedCard();
  $('#save').onclick = () => { CONTENT.npcs = CONTENT.npcs.filter(c => c.name && c.name.trim()).map(c => placeOf({ ...c, id: c.id || crypto.randomUUID(), name: c.name.trim(), lines: (c.lines || []).filter(l => l[0] || l[1]) })); WD.build.forEach(placeOf); WD.map = W.MAP_VERSION; saveContent().then(() => list()).catch(fail); };
};
// ---------- real photos of every landmark, saved into the game so they work offline ----------
PAGES.photos = async P => {
  const RW = await import(GAME + 'js/realworld.js');
  const items = new Map();
  for (const [id, r] of Object.entries(RW.REAL)) items.set(RW.photoKey(r[0]), { key: RW.photoKey(r[0]), sources: r[0], name: r[0][0].split(/:(.+)/)[1] });
  for (const [kind, src] of Object.entries<string[]>(RW.REAL_KINDS || {})) if (src && src.length && !items.has(RW.photoKey(src))) items.set(RW.photoKey(src), { key: RW.photoKey(src), sources: src, name: src[0].split(/:(.+)/)[1] });
  const all = [...items.values()];
  const draw = async () => {
    const pix = await api('photos/index', {}), have = all.filter(x => pix[x.key] && pix[x.key].length).length;
    P.innerHTML = `<h2>📷 ${T('Real photos', 'Ảnh thật')}</h2><p class="sub">${T('The best photos of each real place, from Wikipedia, Wikimedia Commons and Openverse (Creative Commons photos from Flickr and museums), the article’s main picture first, a few from each source. They are shown from where they live online (Wikimedia or Flickr) with who took them and the licence; nothing is saved into the game (only a photo from another site is, as a last resort). Children need the internet to see a photo the first time; after that their device keeps it. Runs on this computer; Publish to send them to the children. ✕ takes off a photo that is not of the place, and it is never fetched again.', 'Những ảnh đẹp nhất của từng nơi thật, lấy từ Wikipedia, Wikimedia Commons và Openverse (ảnh Creative Commons từ Flickr và các bảo tàng), ảnh chính của bài viết trước, mỗi nguồn vài ảnh. Ảnh được hiện từ nơi ảnh nằm trên mạng (Wikimedia hoặc Flickr) kèm tên người chụp và giấy phép; không lưu ảnh vào game (chỉ ảnh từ trang khác mới được lưu, khi không còn cách nào khác). Lần đầu xem ảnh các con cần có internet; sau đó máy sẽ giữ lại ảnh. Chạy trên máy này; bấm Phát hành để gửi tới các con. ✕ bỏ ảnh không đúng nơi, và ảnh đó sẽ không bị tải lại.')}</p>
    <div class="card"><p><b>${have}</b> / ${all.length} ${T('places have photos', 'nơi đã có ảnh')}.</p>
      <div class="row"><div style="flex:0 0 160px"><label>${T('Photos per place', 'Số ảnh mỗi nơi')}</label><select id="pmax">${[3, 4, 6].map(n => `<option ${n === 4 ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <button class="btn" id="pmiss">⬇️ ${T('Get photos for places without any', 'Tải ảnh cho nơi chưa có')}</button><button class="btn ghost" id="pall">🔄 ${T('Get them all again', 'Tải lại tất cả')}</button></div>
      <div class="prog"><i id="ppb"></i></div><p class="note" id="pres"></p><p class="warn" id="pbad" hidden></p><button class="btn" id="pfix" hidden>🔄 ${T('Get those places again', 'Tải lại những nơi đó')}</button></div>
    <div class="grid">${all.map(x => `<div class="card"><b>${esc(x.name)}</b> <button class="btn small ghost" data-get="${esc(x.key)}">🔄</button><div class="thumbs">${(pix[x.key] || []).map(p => `<span class="thumb"><img src="${p.url ? esc(p.url) : FILE(esc(p.src))}" referrerpolicy="no-referrer" title="${esc(p.credit || '')}" alt="${esc(x.name)}" data-key="${esc(x.key)}">${p.credit ? `<small class="credit">${esc(p.credit)}</small>` : ''}<i class="thumbbad">${T('Can’t open: 🔄 get it again', 'Không mở được: 🔄 tải lại')}</i><button data-rm="${esc(x.key)}|${esc(p.url || p.src)}" title="${T('Not this place: take it off (it won’t be fetched again)', 'Không phải nơi này: bỏ ảnh (sẽ không tải lại)')}" aria-label="${T('Remove this photo', 'Bỏ ảnh này')}">✕</button></span>`).join('') || `<span class="note">${T('none yet', 'chưa có')}</span>`}</div></div>`).join('')}</div>`;
    // (r65) a photo that cannot be shown (too big for the website to send, or its file gone) says so, with 🔄 beside it
    const broken = () => { const n = P.querySelectorAll<HTMLInputElement>('.thumb.bad').length; $('#pbad').hidden = $('#pfix').hidden = !n; $('#pbad').textContent = n ? T(`⚠️ ${n} photo(s) can’t be opened (gone from its website, too big, or the file is gone). 🔄 gets that place again (photos over 1.5 MB are skipped now).`, `⚠️ ${n} ảnh không mở được (đã bị xoá khỏi trang web, quá lớn, hoặc mất tệp). 🔄 tải lại nơi đó (ảnh trên 1,5 MB giờ được bỏ qua).`) : ''; };
    P.querySelectorAll<HTMLImageElement>('.thumb img').forEach(im => { const bad = () => { im.closest<HTMLInputElement>('.thumb').classList.add('bad'); broken(); }; if (im.complete && !im.naturalWidth) bad(); else im.onerror = bad; });
    const go = async list => { // one place at a time (online each request must be short), the progress shown here
      P.querySelectorAll<HTMLInputElement>('button').forEach(b => b.disabled = true); let done = 0, errs = 0;
      for (const item of list) { $('#pres').textContent = `${done}/${list.length} · ${item.name}${errs ? ' · ⚠️ ' + errs : ''}`; try { await api('photos/get1', { item, max: +$('#pmax').value }); } catch (e) { errs++; } done++; $('#ppb').style.width = (done / list.length * 100) + '%'; }
      toast(errs ? `⚠️ ${errs}` : T('Photos saved.', 'Đã lưu ảnh.')); draw(); };
    $('#pmiss').onclick = () => go(all.filter(x => !(pix[x.key] && pix[x.key].length)));
    $('#pall').onclick = () => go(all);
    $('#pfix').onclick = () => { const keys = new Set([...P.querySelectorAll<HTMLInputElement>('.thumb.bad img')].map(i => i.dataset.key)); go(all.filter(x => keys.has(x.key))); };
    P.querySelectorAll<HTMLInputElement>('[data-get]').forEach(b => b.onclick = () => go(all.filter(x => x.key === b.dataset.get)));
    // ✕ takes a photo off at once (it fades straight away; saving waits for Publish online) and it is never fetched again
    P.querySelectorAll<HTMLInputElement>('[data-rm]').forEach(b => b.onclick = async () => { const [key, src] = b.dataset.rm.split('|'), th = b.closest<HTMLInputElement>('.thumb'); th.style.opacity = '.3'; try { await api('photos/remove', { key, src }); th.remove(); if (INFO) { INFO.unpublished = true; head(); } } catch (e) { th.style.opacity = '1'; fail(e); } });
  };
  await draw();
};
// ---------- the website: what is live, recent changes, and managing them ----------
PAGES.site = async P => {
  P.innerHTML = `<h2>🌐 ${T('The website', 'Trang web')}</h2><p class="sub">${T('What is live on Netlify, what changed on GitHub, and buttons to manage them.', 'Những gì đang chạy trên Netlify, những gì đã đổi trên GitHub, và các nút để quản lý.')}</p><div class="card">${T('Asking Netlify and GitHub…', 'Đang hỏi Netlify và GitHub…')}</div>`;
  const s = await api('site/status'), when = d => d ? new Date(d).toLocaleString(LANG === 'vi' ? 'vi-VN' : 'en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : '';
  const STATE = { ready: '✅', building: '🏗️', enqueued: '⏳', processing: '⚙️', uploading: '⬆️', error: '❌', new: '🆕' };
  const n = s.netlify, g = s.github;
  P.innerHTML = `<h2>🌐 ${T('The website', 'Trang web')}</h2>
  <div class="card"><h3>☁️ Netlify ${n ? `· <a href="${esc(n.url)}" target="_blank">${esc(n.url)}</a>` : ''}</h3>
    ${s.netlifyError ? `<p class="badtxt">⚠️ ${esc(say(s.netlifyError))}</p>` : !n ? `<p class="note">${T('Add your Netlify token and site in Settings to see the website here.', 'Thêm khóa Netlify và tên trang trong Cài đặt để xem trang web ở đây.')}</p>` : `
      <p class="note">${n.repo ? T('Built from ', 'Dựng từ ') + esc(n.repo) + ' · ' + esc(n.branch || '') : T('Not linked to GitHub (uploads only).', 'Chưa nối với GitHub (chỉ tải lên).')}</p>
      <table><tbody>${n.deploys.map(d => `<tr><td>${STATE[d.state] || '•'} ${d.live ? `<span class="pill">${T('LIVE', 'ĐANG CHẠY')}</span>` : ''}</td><td>${esc(when(d.at))}<br><span class="note">${esc(d.context === 'production' ? T('website', 'trang chính') : T('preview', 'bản xem trước'))} · ${esc(d.branch || '')} ${esc(d.commit)}</span></td><td>${esc(d.title).slice(0, 80)}${d.error ? `<br><span class="badtxt">${esc(d.error).slice(0, 120)}</span>` : ''}</td>
        <td>${d.url ? `<a href="${esc(d.url)}" target="_blank">${T('open', 'mở')}</a>` : ''} ${!d.live && d.state === 'ready' && d.context === 'production' ? `<button class="btn small ghost" data-restore="${esc(d.id)}">↩️ ${T('make this live', 'đưa bản này lên')}</button>` : ''}</td></tr>`).join('')}</tbody></table>
      <div class="row" style="margin-top:8px"><button class="btn" id="rebuild">🔄 ${T('Rebuild the website now', 'Dựng lại trang web ngay')}</button>${n.admin ? `<a class="btn ghost" href="${esc(n.admin)}" target="_blank">⚙️ ${T('Open Netlify', 'Mở Netlify')}</a>` : ''}</div>`}</div>
  <div class="card"><h3>🐙 GitHub ${g ? '· ' + esc(g.repo) : ''}</h3>
    ${s.githubError ? `<p class="badtxt">⚠️ ${esc(say(s.githubError))}</p>` : !g ? `<p class="note">${T('Add your GitHub token and repository in Settings.', 'Thêm khóa GitHub và tên kho trong Cài đặt.')}</p>` : `
      <h4>📬 ${T('Updates waiting to go live (pull requests)', 'Bản cập nhật chờ đưa lên (pull request)')}</h4>
      ${g.pulls.length ? `<table><tbody>${g.pulls.map(p => `<tr><td>#${p.n}</td><td><a href="${esc(p.url)}" target="_blank">${esc(p.title)}</a><br><span class="note">${esc(p.branch)} · ${esc(when(p.at))}${p.draft ? ' · ' + T('draft', 'bản nháp') : ''}</span></td><td><a href="${esc(p.url)}" target="_blank">${T('preview & check', 'xem & kiểm tra')}</a> <button class="btn small" data-merge="${p.n}">✅ ${T('Merge (put it live)', 'Gộp (đưa lên trang)')}</button></td></tr>`).join('')}</tbody></table>` : `<p class="note">${T('None waiting.', 'Không có bản nào đang chờ.')}</p>`}
      <h4>🕘 ${T('Latest changes on', 'Thay đổi mới nhất trên')} ${esc(g.branch)}</h4>
      <table><tbody>${g.commits.map(c => `<tr><td><a href="${esc(c.url)}" target="_blank">${esc(c.sha)}</a></td><td>${esc(c.msg)}</td><td class="note">${esc(when(c.at))}</td></tr>`).join('')}</tbody></table>`}</div>
  <p class="note">${T('Each pull request gets its own preview link from Netlify (in its checks on GitHub): open it on a phone to try the update before merging.', 'Mỗi pull request có đường dẫn xem trước riêng từ Netlify (trong phần kiểm tra trên GitHub): mở trên điện thoại để thử trước khi gộp.')}</p>`;
  const again = () => setTimeout(() => PAGES.site(P), 1500);
  if ($('#rebuild')) $('#rebuild').onclick = async () => { try { await api('site/rebuild', {}); toast(T('Netlify is rebuilding the website.', 'Netlify đang dựng lại trang web.')); again(); } catch (e) { fail(e); } };
  P.querySelectorAll<HTMLInputElement>('[data-restore]').forEach(b => b.onclick = async () => { if (!confirm(T('Make this older version the live website?', 'Đưa phiên bản cũ này lên làm trang chính?'))) return; try { await api('site/restore', { id: b.dataset.restore }); toast(T('Done: that version is live.', 'Xong: phiên bản đó đang chạy.')); again(); } catch (e) { fail(e); } });
  P.querySelectorAll<HTMLInputElement>('[data-merge]').forEach(b => b.onclick = async () => { if (!confirm(T('Merge this update? The website changes in a minute or two.', 'Gộp bản cập nhật này? Trang web sẽ đổi sau một hai phút.'))) return; try { await api('github/merge', { n: +b.dataset.merge }); toast(T('Merged. Netlify is building it.', 'Đã gộp. Netlify đang dựng.')); again(); } catch (e) { fail(e); } });
};
// ---------- check ----------
PAGES.check = async P => {
  const r = await api('check');
  P.innerHTML = `<h2>🩺 ${T('Check the game', 'Kiểm tra game')}</h2><div class="card">${r.map(x => `<p class="${x.ok ? 'ok' : 'badtxt'}">${x.ok ? '✅' : '⚠️'} ${esc(T(x.en, x.vi))}</p>`).join('')}</div>`;
};
// ---------- settings ----------
PAGES.settings = async P => {
  const c = INFO.conf;
  if (INFO.online) { // online the keys live in Netlify, where only the site's owner can see them
    const row = (ok, name, what) => `<tr><td>${ok ? '✅' : '➖'}</td><td><code>${name}</code></td><td>${what}</td></tr>`;
    P.innerHTML = `<h2>🔑 ${T('Settings', 'Cài đặt')}</h2><p class="sub">${T('Online, the keys are kept by Netlify, never in the game or on this page. Set them in Netlify → your site → Site configuration → Environment variables, then deploy again.', 'Trên mạng, các khóa do Netlify giữ, không bao giờ nằm trong game hay trang này. Đặt chúng trong Netlify → trang của bạn → Site configuration → Environment variables, rồi deploy lại.')}</p>
    <div class="card"><table><tbody>${row(true, 'STUDIO_PASSWORD', T('the grown-ups’ password for this page (12 characters or more, used nowhere else)', 'mật khẩu của người lớn cho trang này (từ 12 ký tự, không dùng ở chỗ khác)'))}${row(c.github, 'GITHUB_TOKEN', T('fine-grained token, this repository only, Contents: read and write (saving and publishing)', 'khóa fine-grained, chỉ kho này, Contents: đọc và ghi (lưu và phát hành)'))}${row(true, 'GITHUB_REPO', esc(c.githubRepo))}${row(c.azure, 'AZURE_KEY · AZURE_REGION', T('to make voices online', 'để tạo giọng đọc trên mạng'))}${row(c.netlify, 'NETLIFY_TOKEN', T('the Website page', 'trang Trang web'))}${row(true, 'FAMILY_CODE', T('optional: the family code (else Studio makes one: Family → Family code)', 'không bắt buộc: mã gia đình (nếu không, Studio tự tạo: Gia đình → Mã gia đình)'))}</tbody></table>
    <p class="note">${T('Piper (free voices) and the zip work only in SparkleStudio.exe on the family computer.', 'Piper (giọng miễn phí) và tệp zip chỉ có trong SparkleStudio.exe trên máy tính gia đình.')}</p></div>
    <div class="bar"><button class="btn ghost" id="out">🚪 ${T('Sign out', 'Đăng xuất')}</button></div>`;
    $('#out').onclick = async () => { await fetch(BASE + '/api/logout'); signIn(); };
    return;
  }
  P.innerHTML = `<h2>🔑 ${T('Settings', 'Cài đặt')}</h2><p class="sub">${T('Keys are kept only on this computer', 'Các khóa chỉ lưu trên máy tính này')} (<code>${esc(INFO.settingsFile)}</code>), ${T('never in the game.', 'không bao giờ nằm trong game.')}</p>
  <div class="card"><label>📂 ${T('Game folder (the one with index.html)', 'Thư mục game (có tệp index.html)')}</label><input type="text" id="gd" value="${esc(INFO.game || '')}"></div>
  <div class="card"><h3>☁️ Microsoft Azure ${T('voices', 'giọng đọc')}</h3><div class="row"><div><label>KEY 1 ${c.azure ? '✅' : ''}</label><input type="password" id="ak" placeholder="${c.azure ? T('(saved, type to replace)', '(đã lưu, gõ để thay)') : ''}"></div><div><label>${T('Region', 'Vùng')}</label><input type="text" id="ar" value="${esc(c.azureRegion)}" placeholder="australiaeast"></div></div></div>
  <div class="card"><h3>💻 Piper (${T('free voices on this computer', 'giọng miễn phí trên máy')})</h3><p class="note">${T('Download piper.exe and voices (.onnx) from github.com/rhasspy/piper; good choices: vi_VN-vais1000-medium, en_GB-southern_english_female-low.', 'Tải piper.exe và giọng (.onnx) ở github.com/rhasspy/piper; nên chọn: vi_VN-vais1000-medium, en_GB-southern_english_female-low.')}</p>
    <label>piper.exe</label><input type="text" id="pe" value="${esc(c.piperExe)}" placeholder="C:\\piper\\piper.exe">
    <div class="row"><div><label>🇦🇺 ${T('English voice (.onnx)', 'Giọng tiếng Anh (.onnx)')}</label><input type="text" id="pen" value="${esc((c.piperModels || {}).en || '')}"></div><div><label>🇻🇳 ${T('Vietnamese voice (.onnx)', 'Giọng tiếng Việt (.onnx)')}</label><input type="text" id="pvi" value="${esc((c.piperModels || {}).vi || '')}"></div></div></div>
  <div class="card"><h3>🚀 Netlify</h3><div class="row"><div><label>${T('Personal access token', 'Khóa truy cập cá nhân')} ${c.netlify ? '✅' : ''}</label><input type="password" id="nt" placeholder="${c.netlify ? T('(saved, type to replace)', '(đã lưu, gõ để thay)') : ''}"></div><div><label>${T('Site name or ID (e.g. sparkle-valley.netlify.app)', 'Tên hoặc ID trang (vd. sparkle-valley.netlify.app)')}</label><input type="text" id="ns" value="${esc(c.netlifySite)}"></div></div>
    <p class="note">${T('Netlify → User settings → Applications → New access token.', 'Netlify → User settings → Applications → New access token.')}</p></div>
  <div class="card"><h3>🐙 GitHub</h3><div class="row"><div><label>${T('Fine-grained token (Contents: read and write)', 'Khóa fine-grained (Contents: đọc và ghi)')} ${c.github ? '✅' : ''}</label><input type="password" id="gt" placeholder="${c.github ? T('(saved, type to replace)', '(đã lưu, gõ để thay)') : 'github_pat_…'}"></div><div><label>${T('Repository', 'Kho')}</label><input type="text" id="gr" value="${esc(c.githubRepo)}" placeholder="nguyentuanphu/tpn"></div><div><label>${T('Branch', 'Nhánh')}</label><input type="text" id="gb" value="${esc(c.githubBranch || 'main')}"></div></div>
    <p class="note">${T('github.com → Settings → Developer settings → Fine-grained tokens → Generate: only this repository, permissions Contents: Read and write, Pull requests: Read and write.', 'github.com → Settings → Developer settings → Fine-grained tokens → Generate: chỉ kho này, quyền Contents: Read and write và Pull requests: Read and write.')}</p></div>
  <div class="card"><h3>📊 ${T('Players and the online Studio', 'Người chơi và Studio trên mạng')}</h3><div class="row"><div><label>${T('The game’s website', 'Trang web của game')}</label><input type="text" id="su" value="${esc(c.siteUrl)}" placeholder="https://sparklevalley.netlify.app"></div><div><label>${T('Studio key (made online: Setup → Security)', 'Khóa Studio (tạo trên mạng: Thiết lập → Bảo mật)')} ${c.players ? '✅' : ''}</label><input type="password" id="sp" placeholder="${c.players ? T('(saved, type to replace)', '(đã lưu, gõ để thay)') : 'svk.…'}"></div></div>
    <p class="note">${T('The same Studio is online at the website’s /studio/ page (sign in there with your password and the code from your authenticator app). This computer uses a Studio key instead: the Analytics page and the family photos (they go to the website’s private store, never into the game folder) reach the website with it.', 'Studio này cũng có trên mạng ở trang /studio/ của trang web (đăng nhập ở đó bằng mật khẩu và mã từ ứng dụng xác thực). Máy này dùng khóa Studio: trang Phân tích và ảnh gia đình (gửi vào kho riêng của trang web, không bao giờ vào thư mục game) đến trang web bằng khóa này.')}</p></div>
  <div class="bar"><button class="btn ghost" id="syncnow">⬇️ ${T(`Get the newest game (this folder: ${esc(INFO.version || '?')})`, `Lấy game mới nhất (thư mục này: ${esc(INFO.version || '?')})`)}</button><button class="btn ghost" id="updcheck">🔄 ${T(`Check for updates (this is ${esc(INFO.studio || '')})`, `Kiểm tra cập nhật (bản này là ${esc(INFO.studio || '')})`)}</button><button class="btn ghost" id="forget">🗑️ ${T('Forget the keys', 'Xóa các khóa')}</button><button class="btn" id="save">💾 ${T('Save settings', 'Lưu cài đặt')}</button></div>`;
  $('#save').onclick = async () => { try { await api('settings', { gameDir: $('#gd').value, azureKey: $('#ak').value, azureRegion: $('#ar').value, piperExe: $('#pe').value, piperModels: { en: $('#pen').value.trim(), vi: $('#pvi').value.trim() }, netlifyToken: $('#nt').value, netlifySite: $('#ns').value, githubToken: $('#gt').value, githubRepo: $('#gr').value, githubBranch: $('#gb').value, siteUrl: $('#su').value, studioKey: $('#sp').value }); markSaved(); toast('✅ ' + T('Settings saved.', 'Đã lưu cài đặt.'), 'good'); render(true); } catch (e) { fail(e); } };
  $('#updcheck').onclick = () => checkUpdate(true);
  $('#syncnow').onclick = () => watchSync(true);
  $('#forget').onclick = async () => { if (!confirm(T('Forget the Azure, Netlify and GitHub keys on this computer?', 'Xóa khóa Azure, Netlify và GitHub trên máy này?'))) return; await api('settings', { forget: ['azureKey', 'netlifyToken', 'githubToken', 'studioKey'] }); toast(T('Keys forgotten.', 'Đã xóa khóa.')); render(); };
};
// Sydney time is AEDT (UTC+11) in daylight saving and AEST (UTC+10) the rest of the year
const sydneyZone = d => /GMT\+11|AEDT/.test(new Date(d).toLocaleString('en-AU', { timeZone: 'Australia/Sydney', timeZoneName: 'short' })) ? 'AEDT' : 'AEST';
// ---------- players: how many children play (anonymous counts from the website, netlify/lib/players.mts) ----------
PAGES.players = async P => {
  const myRender = P.dataset.render, stale = () => cur !== 'players' || P.dataset.render !== myRender;
  P.innerHTML = `<h2>📊 ${T('Analytics', 'Phân tích')}</h2><div class="card">${T('Asking the website…', 'Đang hỏi trang web…')}</div>`;
  const namesReady = (async () => { await gameLang(); return Promise.allSettled([import(GAME + 'js/games/all.js'), import(GAME + 'js/world.js')]); })();
  let r; try { r = await api('players'); if (stale()) return; } catch (e) { if (stale()) return; P.innerHTML = `<h2>📊 ${T('Analytics', 'Phân tích')}</h2><div class="card"><p class="badtxt">⚠️ ${esc(e.message)}</p><p class="note">${T('The count comes from the website (it needs a Git deploy on Netlify). In SparkleStudio.exe, put the website and a Studio key in Settings.', 'Số liệu đến từ trang web (cần deploy từ Git trên Netlify). Trong SparkleStudio.exe, điền trang web và khóa Studio trong Cài đặt.')}</p></div>`; return; }
  const big = (n, en, vi) => `<div class="card stat"><b>${n}</b><span>${T(en, vi)}</span></div>`, hrs = m => m >= 120 ? (m / 60).toFixed(m >= 600 ? 0 : 1) + ' h' : m + ' min';
  const max = Math.max(1, ...r.perDay.map(d => d.devices)), W = 600, H = 150, bw = W / r.perDay.length;
  const bars = r.perDay.map((d, i) => `<rect x="${(i * bw + 2).toFixed(1)}" y="${(H - 18 - d.devices / max * (H - 30)).toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${(d.devices / max * (H - 30)).toFixed(1)}" rx="3" fill="#8a5cf6"><title>${d.date}: ${d.devices} (${d.newDevices} ${T('new', 'mới')}), ${hrs(d.mins)}</title></rect>${d.newDevices ? `<rect x="${(i * bw + 2).toFixed(1)}" y="${(H - 18 - d.newDevices / max * (H - 30)).toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${(d.newDevices / max * (H - 30)).toFixed(1)}" rx="3" fill="#ff7eb8"/>` : ''}${i % 5 === 4 ? `<text x="${(i * bw + bw / 2).toFixed(1)}" y="${H - 4}" font-size="10" text-anchor="middle" fill="#6b5b80">${d.date.slice(5)}</text>` : ''}`).join('');
  const pct = (n, t) => t ? Math.round(n / t * 100) + '%' : '–', tw = Object.values<number>(r.kinds).reduce((a, b) => a + b, 0);
  const table = (o: Record<string, number>, name?: (k: string) => string) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<tr><td>${esc(name ? name(k) : k)}</td><td>${n}</td><td>${pct(n, tw)}</td></tr>`).join('');
  // round L: names for games and places from the game itself; each device with its children, problems, suggestions
  let GN = {}, PN = {};
  await namesReady; if (stale()) return;
  try { await import(GAME + 'js/games/all.js'); const { GAMES } = await import(GAME + 'js/games/registry.js'); for (const [id, g] of Object.entries<{ icon: string, name: () => string }>(GAMES)) GN[id] = `${g.icon} ${g.name()}`; } catch (e) { }
  try { const W = await import(GAME + 'js/world.js'); for (const [id, f] of Object.entries(W.REGION_NAMES || {})) PN[id] = typeof f === 'function' ? f() : String(f); } catch (e) { }
  if (stale()) return;
  // how long ago a device was last on the screen (round O)
  const ago = iso => { const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 60 ? T(`${m} min ago`, `${m} phút trước`) : m < 48 * 60 ? T(`${Math.round(m / 60)} h ago`, `${Math.round(m / 60)} giờ trước`) : T(`${Math.round(m / 1440)} days ago`, `${Math.round(m / 1440)} ngày trước`); };
  const gname = g => GN[g] || g, pname = p => PN[p] || p, when = d => d ? new Date(d + 'T12:00:00').toLocaleDateString(LANG === 'vi' ? 'vi-VN' : 'en-AU', { day: 'numeric', month: 'short' }) : '–';
  // (owner, 11 Oct, #36) start-up times: seconds until the valley is built, by kind of device and for each device
  const STEPS: Record<string, [string, string]> = { world: ['the land', 'mặt đất'], map: ['the map', 'bản đồ'], people: ['the people', 'mọi người'], roads: ['the roads', 'đường sá'], town: ['the towns', 'phố xá'], pretraffic: ['the vehicles', 'xe cộ'], traffic: ['the traffic', 'xe chạy'], things: ['things in the valley', 'đồ vật'], wideland: ['the wide land', 'vùng đất rộng'], levelled: ['levelling the ground', 'san đất'], roadside: ['the roadsides', 'lề đường'], solids: ['solid houses and things', 'nhà và đồ vật'], shaders: ['the first picture', 'hình đầu tiên'], ready: ['getting ready', 'chuẩn bị'] };
  const stepName = k => STEPS[k] ? T(...STEPS[k]) : k, secs = v => v == null ? '–' : (v >= 10 ? Math.round(v) : v) + ' s';
  const startLine = st => !st ? '' : `<br>🏁 ${st.ready != null ? T(`usually ready in ${secs(st.ready)}`, `thường sẵn sàng sau ${secs(st.ready)}`) : st.readyFirst != null ? T(`ready in ${secs(st.readyFirst)} (first visits)`, `sẵn sàng sau ${secs(st.readyFirst)} (lần đầu)`) : ''}${st.slowest ? ` (${T('slowest', 'chậm nhất')}: ${esc(stepName(st.slowest))})` : ''}`;
  const kindName = k => ({ phone: T('Phone', 'Điện thoại'), tablet: T('Tablet', 'Máy tính bảng'), computer: T('Computer', 'Máy tính') }[k] || k);
  const locName = l => l ? [l.city, l.region, l.country].filter(Boolean).join(', ') : T('unknown', 'không rõ');
  const hmax = Math.max(1, ...(r.hours || [])), hbars = (r.hours || []).map((m, h) => `<rect x="${h * 25 + 2}" y="${(110 - m / hmax * 90).toFixed(1)}" width="21" height="${(m / hmax * 90).toFixed(1)}" rx="3" fill="#ff7eb8"><title>${h}:00 · ${hrs(m)}</title></rect>${h % 3 === 0 ? `<text x="${h * 25 + 12}" y="126" font-size="11" text-anchor="middle" fill="currentColor">${h}</text>` : ''}`).join('');
  const kidCard = K => `<div class="kid"><b>${K.age === 'big' ? '🧒' : '👶'} ${esc(K.name || T('A child', 'Một bé'))}</b> <span class="pill">${K.age === 'big' ? T('5 and up', '5 tuổi trở lên') : T('under 5', 'dưới 5 tuổi')}</span>
      <p class="note">⏱️ ${hrs(K.mins)} · 🧸 ${T('Simple screen', 'Màn hình đơn giản')} ${pct(K.simpleMins, K.mins)} · 📖 ${K.tales} ${T('stories', 'truyện')}</p>
      ${K.games.length ? `<table class="mini"><thead><tr><th>${T('Game', 'Trò chơi')}</th><th>▶</th><th>🏆</th><th>🚪</th></tr></thead><tbody>${K.games.map(([g, st, w, q]) => `<tr><td>${esc(gname(g))}</td><td>${st}</td><td>${w}</td><td class="${q > w && q >= 2 ? 'warn' : ''}">${q}</td></tr>`).join('')}</tbody></table>` : ''}
      ${K.places.length ? `<p class="note">📍 ${K.places.map(([p, n]) => `${esc(pname(p))} (${n})`).join(' · ')}</p>` : ''}</div>`;
  const devCard = d => `<div class="card dev devrow${isRobot(d) ? ' robot' : ''}" data-id="${esc(d.id)}" data-devrow="${esc(d.id)}"><div class="row" style="align-items:flex-start"><div style="flex:2">
      <h3>${{ phone: '📱', tablet: '📲', computer: '💻' }[d.kind] || '❔'} <span class="dlabel">${esc(devName(d))}</span> ${d.family ? `<span class="pill fam">👨‍👩‍👧 ${esc(easyName('fam-' + d.family))}</span> ` : ''}${d.online ? `<span class="pill live on">🟢 ${T('Playing now', 'Đang chơi')}${d.playingNow ? ' · ' + esc(d.playingNow) : ''}</span>` : `<span class="pill live">⚪ ${T('Offline', 'Không chơi')}${d.seenAt ? ' · ' + ago(d.seenAt) : ''}</span>`} <button class="btn small ghost" data-rename>✏️ ${T('Name it', 'Đặt tên')}</button></h3>
      <p class="note">${esc(d.os)} · ${esc(d.br)}${d.screen ? ' · ' + esc(d.screen) : ''}${d.app ? ' · ' + T('installed app', 'đã cài như ứng dụng') : ''} · ${esc(d.build)}${d.activeVersions?.length ? ' · '+T('Active versions: ', 'Phiên bản đang chạy: ')+esc(d.activeVersions.join(', ')) : ''} · ${d.lang === 'vi' ? 'Tiếng Việt' : 'English'}<br>📍 ${esc(locName(d.loc))} · ${T('first seen', 'lần đầu')} ${when(d.first)} · ${T('last played', 'chơi gần nhất')} ${when(d.last)}</p></div>
      <div style="flex:1;min-width:150px"><p>⏱️ <b>${hrs(d.mins)}</b> ${T('in 30 days', 'trong 30 ngày')}<br>📅 ${d.days} ${T('days played', 'ngày có chơi')}${d.fps != null ? `<br>🎞️ ${d.fps} ${T('frames/s', 'khung hình/giây')}` : ''}${d.errors ? `<br><span class="badtxt">🐞 ${d.errors} ${T('errors', 'lỗi')}</span>` : ''}${d.stuck ? `<br><span class="warn">🧱 ${T('stuck', 'bị kẹt')} ${d.stuck}×</span>` : ''}${startLine(d.startup)}</p></div></div>
      <div class="kids">${d.kids.map(kidCard).join('') || `<p class="note">${T('No per-child details yet (they start with version r43).', 'Chưa có chi tiết từng bé (bắt đầu từ bản r43).')}</p>`}</div></div>`;
  const pb = r.problems || { errors: [], stuck: [], quits: [], slow: [] };
  // the suggestions in words, with the games', places' and devices' own names
  const devName = d => devTitle(d); // (owner, 13 Oct) the family's name for it, or its easy name (the same in every list)
  const where = w => { const m = /^([\w-]+)(.*)$/.exec(w || ''); return m ? pname(m[1]) + m[2] : w; };
  const tipText = t => ({
    quit: () => T(`“${gname(t.g)}” is often left before the end (${t.n} of ${t.st} times): it may be too hard. Try an easier level, or take it off the under-5 path (🎮 Game → 🧸 Simple screen).`, `“${gname(t.g)}” hay bị bỏ dở (${t.n}/${t.st} lần): có thể hơi khó. Thử mức dễ hơn, hoặc bỏ khỏi đường của bé dưới 5 tuổi (🎮 Trò chơi → 🧸 Màn hình đơn giản).`),
    stuck: () => T(`Children got stuck ${t.n} times at ${where(t.where)}: worth a look on the map there (🎮 Game → 🗺️ Map).`, `Các bé bị kẹt ${t.n} lần ở ${where(t.where)}: nên xem lại bản đồ chỗ đó (🎮 Trò chơi → 🗺️ Bản đồ).`),
    error: () => T(`The game hit an error ${t.n} times on ${t.dv} device(s): “${t.e}”. Send this line to the developer.`, `Game gặp lỗi ${t.n} lần trên ${t.dv} máy: “${t.e}”. Gửi dòng này cho người làm game.`),
    slow: () => T(`${devName(t.d)} runs slowly (about ${t.fps} frames a second): in the game, Grown-ups → Graphics → Fast.`, `${devName(t.d)} chạy chậm (khoảng ${t.fps} khung hình/giây): trong game, Người lớn → Đồ họa → Nhanh.`),
    old: () => T(`${devName(t.d)} still runs ${t.build} (newest ${t.newest}): open the game there with the internet on to update it.`, `${devName(t.d)} vẫn chạy bản ${t.build} (mới nhất ${t.newest}): mở game trên máy đó khi có mạng để cập nhật.`),
    quiet: () => T(`${devName(t.d)} has not played since ${when(t.last)}.`, `${devName(t.d)} chưa chơi từ ${when(t.last)}.`),
    simple: () => T(`${t.name || 'A little one'} (under 5) mostly plays in the 3D valley on ${devName(t.d)}: the 🧸 Simple screen may be easier.`, `${t.name || 'Một bé'} (dưới 5 tuổi) hầu như chơi trong thung lũng 3D trên ${devName(t.d)}: 🧸 Màn hình đơn giản có thể dễ hơn.`)
  }[t.k] || (() => ''))();
  // (r65, owner: "a bit too much for the eyes; cleaner but still the details") five tiles, one row per child and per kind
  // of device, and everything else folded under "More detail" (closed at first). One colour per meaning: green good,
  // amber watch, red act. The battery and frame numbers come from the battery round (field names on the board):
  // r.power[kind] = { devices, fps, frameMs, batteryPerHour } and each device's power = { fps, frameMs, draws, ratio,
  // mins, batteryPerHour, charging }; until they come, "not reported yet".
  const KINDS = ['phone', 'tablet', 'computer'], KICON = { phone: '📱', tablet: '📲', computer: '💻' };
  const median = a => { const v = a.filter(x => x != null && !isNaN(x)).sort((x, y) => x - y); return v.length ? v[v.length >> 1] : null; };
  const tone = (v, good, watch, low?) => v == null ? '' : (low ? (v >= good ? 'good' : v >= watch ? 'watch' : 'act') : (v <= good ? 'good' : v <= watch ? 'watch' : 'act'));
  const TONE = { good: T('good', 'tốt'), watch: T('worth watching', 'nên để ý'), act: T('needs a look', 'cần xem lại') };
  const spark = (vals, col) => { const v = vals.length > 1 ? vals : [0, ...vals, 0], mx = Math.max(1, ...v), w = 120, h = 30; return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${v.map((x, i) => `${(i / (v.length - 1) * (w - 4) + 2).toFixed(1)},${(h - 3 - x / mx * (h - 6)).toFixed(1)}`).join(' ')}"/></svg>`; };
  const NOT_YET = T('not reported yet', 'chưa có số liệu'), PW = r.power || {}, devs = r.devices || [];
  const per = r.perDay || [], wk = per.slice(-7), weekMins = wk.reduce((a, d) => a + (d.mins || 0), 0);
  const fpsAll = median(devs.map(d => (d.power && d.power.fps) ?? d.fps)), startWorst = Math.max(...KINDS.map(k => r.startup && r.startup[k] ? r.startup[k].ready : -1));
  const batt = Math.max(...KINDS.map(k => PW[k] && PW[k].batteryPerHour != null ? PW[k].batteryPerHour : -1));
  const pctH = v => v == null || v < 0 ? NOT_YET : (Math.round(v * 10) / 10) + T(' % an hour', ' % mỗi giờ');
  const tile = (icon, value, label, extra?, t?) => `<div class="card tile ${t ? 'tone-' + t : ''}"><span class="tl">${icon} ${label}</span><b>${value}</b>${extra || ''}${t ? `<span class="tt">${TONE[t]}</span>` : ''}</div>`;
  const tiles = [
    tile('👨‍👩‍👧', r.week.devices, T('playing this week', 'chơi tuần này'), spark(per.map(d => d.devices), '#8a5cf6') + `<span class="tx">${T('30 days', '30 ngày')}${r.onlineNow ? ' · 🟢 ' + T(`${r.onlineNow} playing now`, `${r.onlineNow} đang chơi`) : ''}</span>`),
    tile('⏱️', hrs(weekMins), T('played this week', 'đã chơi tuần này'), spark(per.map(d => d.mins || 0), '#ff7eb8') + `<span class="tx">${T('about', 'khoảng')} ${hrs(r.minsPerDevice)} ${T('a device a day', 'mỗi máy mỗi ngày')}</span>`),
    tile('📱', r.month.devices, T('devices (30 days)', 'máy (30 ngày)'), `<span class="tx">${T(`${r.week.newDevices} new this week · ${r.allTime} ever`, `${r.week.newDevices} máy mới tuần này · ${r.allTime} từ trước tới nay`)}${r.families && r.families.count ? ' · 👨‍👩‍👧 ' + T(`${r.families.count} family (${r.families.devicesPerFamily}/fam)`, `${r.families.count} gia đình (${r.families.devicesPerFamily}/gđ)`) : ''}</span>`),
    tile('🏁', startWorst > 0 ? secs(startWorst) : '–', T('start-up', 'khởi động'), `<span class="tx">${KINDS.filter(k => r.startup && r.startup[k]).map(k => `${kindName(k)} ${secs(r.startup[k].ready)}`).join(' · ') || NOT_YET}</span>`, startWorst > 0 ? tone(startWorst, 10, 20) : ''),
    tile('🔋', fpsAll != null ? `${fpsAll}<small> ${T('frames/s', 'khung/giây')}</small>` : '–', T('battery and smoothness', 'pin và độ mượt'), `<span class="tx">🔋 ${T('battery', 'pin')}: ${pctH(batt)}</span>`, batt >= 0 ? (tone(batt, 12, 25) === 'act' || tone(fpsAll, 27, 20, true) === 'act' ? 'act' : tone(batt, 12, 25) === 'watch' || tone(fpsAll, 27, 20, true) === 'watch' ? 'watch' : 'good') : fpsAll != null ? tone(fpsAll, 27, 20, true) : '')];
  // one row per child: name, minutes, favourite game (the one started most), and where they play
  const kids = devs.flatMap(d => d.kids.map(K => ({ ...K, dev: devName(d) }))).sort((a, b) => b.mins - a.mins);
  const kidRows = kids.map(K => `<tr><td><b>${K.age === 'big' ? '🧒' : '👶'} ${esc(K.name || T('A child', 'Một bé'))}</b><br><span class="note">${esc(K.dev)}</span></td><td>${hrs(K.mins)}</td><td>${K.games.length ? esc(gname(K.games[0][0])) : '–'}</td></tr>`).join('');
  // one row per kind of device: frames a second, start time, battery use
  const kindRows = KINDS.filter(k => devs.some(d => d.kind === k) || (r.startup && r.startup[k]) || PW[k]).map(k => { const ds = devs.filter(d => d.kind === k), P2 = PW[k] || {}, f = P2.fps ?? median(ds.map(d => (d.power && d.power.fps) ?? d.fps)), st = r.startup && r.startup[k] ? r.startup[k].ready : null;
    return `<tr><td><b>${KICON[k]} ${kindName(k)}</b><br><span class="note">${T(`${P2.devices || ds.length} device(s)`, `${P2.devices || ds.length} máy`)}</span></td><td class="tone-${tone(f, 27, 20, true)}">${f != null ? f : NOT_YET}</td><td class="tone-${tone(st, 10, 20)}">${st != null ? secs(st) : NOT_YET}</td><td class="tone-${tone(P2.batteryPerHour, 12, 25)}">${pctH(P2.batteryPerHour)}</td></tr>`; }).join('');
  const powerLine = d => { const w = d.power; if (!w) return `🔋 ${T('battery and frames', 'pin và khung hình')}: ${NOT_YET}`;
    return [w.fps != null && `🎞️ ${w.fps} ${T('frames/s', 'khung/giây')}`, w.frameMs != null && `${w.frameMs} ms ${T('a frame', 'mỗi khung')}`, w.draws != null && `${w.draws} ${T('draws', 'lần vẽ')}`, w.ratio != null && `${T('sharpness', 'độ nét')} ${w.ratio}×`, `🔋 ${w.batteryPerHour != null ? pctH(w.batteryPerHour) : T('battery not given by this browser', 'trình duyệt này không cho biết pin')}`, w.charging && T('mostly charging', 'thường đang sạc')].filter(Boolean).join(' · '); };
  const more = (id, title, body) => `<details class="card more" data-more="${id}"><summary><b>${title}</b></summary>${body}</details>`;
  P.innerHTML = `<h2>📊 ${T('Analytics', 'Phân tích')} <button class="btn small" id="totesters">🐞 ${T('Tester reports', 'Báo cáo người thử')}</button></h2><p class="sub">${T('What the children play, for the last 30 days, from the game’s own website. A grown-up can switch it off on the device: Grown-ups → Advanced → Analytics.', 'Các con chơi gì trong 30 ngày qua, từ trang web của game. Người lớn có thể tắt trên máy: Người lớn → Nâng cao → Phân tích.')}</p>
  <details class="card analytics-overview" data-more="overview" data-fold-id="analytics-overview" open><summary><b>${T('At a glance', 'Tổng quan')}</b></summary><div class="tiles">${tiles.join('')}</div></details>
  ${(r.tips || []).length ? `<div class="card tips"><h3>💡 ${T('Worth doing', 'Nên làm')}</h3><ul>${r.tips.slice(0, 4).map(t => `<li>${esc(tipText(t))}</li>`).join('')}</ul>${r.tips.length > 4 ? `<p class="note">${T(`${r.tips.length - 4} more under More detail → Suggestions.`, `Còn ${r.tips.length - 4} gợi ý trong Thêm chi tiết → Gợi ý.`)}</p>` : ''}</div>` : ''}
  <div class="grid two"><div class="card"><h3>👨‍👩‍👧 ${T('Each child', 'Từng bé')}</h3>${kidRows ? `<table class="rows"><thead><tr><th>${T('Child', 'Bé')}</th><th>⏱️ ${T('30 days', '30 ngày')}</th><th>⭐ ${T('Favourite game', 'Trò thích nhất')}</th></tr></thead><tbody>${kidRows}</tbody></table>` : `<p class="note">${T('No children yet.', 'Chưa có bé nào.')}</p>`}</div>
    <div class="card"><h3>📱 ${T('Each kind of device', 'Từng loại máy')}</h3>${kindRows ? `<table class="rows kinds"><thead><tr><th>${T('Device', 'Máy')}</th><th>🎞️ ${T('frames/s', 'khung/giây')}</th><th>🏁 ${T('start', 'khởi động')}</th><th>🔋 ${T('battery', 'pin')}</th></tr></thead><tbody>${kindRows}</tbody></table>` : `<p class="note">${T('No devices yet.', 'Chưa có máy nào.')}</p>`}
      <p class="note">${T('Battery: only Chrome-based browsers tell it (not Safari on iPhone or Mac).', 'Pin: chỉ trình duyệt dựa trên Chrome cho biết (Safari trên iPhone và Mac thì không).')}</p></div></div>
  <h3 class="sec">🔎 ${T('More detail', 'Thêm chi tiết')}</h3>
  ${(r.tips || []).length > 4 ? more('tips', `💡 ${T('Suggestions', 'Gợi ý')} (${r.tips.length})`, `<ul>${r.tips.map(t => `<li>${esc(tipText(t))}</li>`).join('')}</ul>`) : ''}
  ${more('devices', `👨‍👩‍👧 ${T('Each device and child', 'Từng máy và từng bé')} (${devs.length})`, `<div id="devlist">${devs.map(devCard).join('')}</div>` || `<p class="note">${T('No devices yet.', 'Chưa có máy nào.')}</p>`)}
  ${more('performance', `🏁 ${T('Performance: loading, frames and battery', 'Hiệu năng: tải, khung hình và pin')}`, `<p class="note">${T('Loading is time to a built valley. Frames measure smoothness during play; frame time is milliseconds to draw a picture. Battery is measured only where the browser reports it, while not charging. The loading column shows measured readiness and the slowest startup stage.', 'Tải là thời gian dựng xong thung lũng. Khung hình đo độ mượt khi chơi; thời gian khung hình là mili giây để vẽ một ảnh. Pin chỉ đo khi trình duyệt cung cấp và máy không sạc. Cột tải cho biết thời gian sẵn sàng đã đo và bước khởi động chậm nhất.')}</p><table class="mini"><thead><tr><th>${T('Device', 'Thiết bị')}</th><th>${T('Loading', 'Tải')}</th><th>${T('Frames and battery', 'Khung hình và pin')}</th></tr></thead><tbody>${devs.map(d => `<tr><td>${KICON[d.kind] || '❔'} ${esc(devName(d))}</td><td>${startLine(d.startup).replace(/^<br>/, '') || NOT_YET}</td><td>${powerLine(d)}</td></tr>`).join('') || `<tr><td class="note">${NOT_YET}</td></tr>`}</tbody></table>`)}
  ${more('time', `📅 ${T('Day by day and hour by hour', 'Theo ngày và theo giờ')}`, `
  <div class="card"><h3>📅 ${T('Devices each day (pink: new)', 'Số máy mỗi ngày (hồng: máy mới)')}</h3><svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px">${bars}</svg></div>
  <div class="card"><h3>🕒 ${T('When they play (each device’s own clock)', 'Giờ chơi (theo đồng hồ của từng máy)')}</h3><svg viewBox="0 0 600 130" style="width:100%;max-width:600px">${hbars}</svg></div>`)}
  ${more('games', `🎲 ${T('Games, places, devices and languages', 'Trò chơi, nơi chốn, máy và ngôn ngữ')}`, `
  <div class="grid"><div class="card"><h3>🎲 ${T('Most played (30 days)', 'Chơi nhiều nhất (30 ngày)')}</h3><table><tbody>${r.games.map(([g, n]) => `<tr><td>${esc(gname(g))}</td><td>${n}</td></tr>`).join('') || `<tr><td class="note">${T('none yet', 'chưa có')}</td></tr>`}</tbody></table><p class="note">${T('Stories read', 'Truyện đã đọc')}: ${r.tales} · ${T('played with friends online', 'chơi cùng bạn trên mạng')}: ${hrs(r.onlineMins)}</p></div>
    <div class="card"><h3>📍 ${T('Places visited most', 'Nơi đến nhiều nhất')}</h3><table><tbody>${(r.places || []).map(([p, n]) => `<tr><td>${esc(pname(p))}</td><td>${n}</td></tr>`).join('') || `<tr><td class="note">${T('none yet', 'chưa có')}</td></tr>`}</tbody></table></div>
    <div class="card"><h3>🌏 ${T('Where from', 'Ở đâu')}</h3><table><tbody>${table(r.locations || {})}</tbody></table></div>
    <div class="card"><h3>📱 ${T('Devices this week', 'Thiết bị tuần này')}</h3><table><tbody>${table(r.kinds, k => kindName(k))}</tbody></table><p class="note">${T('Installed as an app', 'Cài như ứng dụng')}: ${pct(r.app, r.weekDeviceDays)}</p>
      <h3>💻 ${T('Systems', 'Hệ điều hành')}</h3><table><tbody>${table(r.os || {})}</tbody></table><h3>🌐 ${T('Browsers', 'Trình duyệt')}</h3><table><tbody>${table(r.browsers || {})}</tbody></table></div>
    <div class="card"><h3>🗣️ ${T('Language', 'Ngôn ngữ')}</h3><table><tbody>${table(r.langs, k => ({ en: 'English', vi: 'Tiếng Việt' }[k] || k))}</tbody></table>
      <h3>🏷️ ${(r.latestBuilds ? T('Last observed version: installations played in 30 days', 'Phiên bản ghi nhận gần nhất: bản cài chơi trong 30 ngày') : T('Version usage: device-days', 'Lượt dùng phiên bản: máy-ngày'))}</h3><table><tbody>${table(r.latestBuilds || r.builds)}</tbody></table>${Object.keys(r.away30 || {}).length ? `<h4>${T('Not seen for 30 days or more: the version they last had', 'Không thấy từ 30 ngày trở lên: bản cuối cùng của máy')}</h4><table><tbody>${table(r.away30)}</tbody></table><p class="note">${T('They update the first time they open the game with internet; their saved days are sent then.', 'Máy sẽ cập nhật lần đầu mở trò chơi khi có mạng; các ngày đã lưu được gửi lúc đó.')}</p>` : ''}${r.latestBuilds ? `<h4>${T('Version usage this week: device-days', 'Lượt dùng phiên bản tuần này: máy-ngày')}</h4><table><tbody>${table(r.builds)}</tbody></table>` : ''}<p class="note">${T('Each installation keeps its identity through updates. Separate browsers or website addresses can be separate installations.', 'Mỗi bản cài giữ mã nhận diện qua cập nhật. Trình duyệt hoặc địa chỉ website khác nhau có thể là bản cài riêng.')}</p><p class="note">${T('Newest', 'Mới nhất')}: ${esc(INFO.version.split('-').pop())}</p></div></div>`)}
  ${more('problems', `🐞 ${T('Problems', 'Sự cố')}${pb.errors.length || pb.stuck.length || pb.slow.length ? ' ⚠️' : ''}`, `
  <div class="grid"><div class="card"><h3>🐞 ${T('Errors in the game', 'Lỗi trong game')}</h3>${pb.errors.length ? `<table class="mini"><tbody>${pb.errors.map(([k, n, dv]) => `<tr><td><code>${esc(k)}</code></td><td>${n}×</td><td>${dv} ${T('dev.', 'máy')}</td></tr>`).join('')}</tbody></table>` : `<p class="ok">✅ ${T('No errors.', 'Không có lỗi.')}</p>`}</div>
    <div class="card"><h3>🧱 ${T('Where children got stuck', 'Chỗ các bé bị kẹt')}</h3>${pb.stuck.length ? `<table class="mini"><tbody>${pb.stuck.map(([k, n]) => `<tr><td>${esc(where(k))}</td><td>${n}×</td></tr>`).join('')}</tbody></table><p class="note">${T('Pushing to walk for 4 seconds without moving (area and map position).', 'Đẩy để đi 4 giây mà không nhúc nhích (khu và vị trí trên bản đồ).')}</p>` : `<p class="ok">✅ ${T('Nobody got stuck.', 'Không ai bị kẹt.')}</p>`}</div>
    <div class="card"><h3>🚪 ${T('Games left before the end', 'Trò bị bỏ dở')}</h3>${pb.quits.length ? `<table class="mini"><tbody>${pb.quits.map(([g, n, st, pc]) => `<tr><td>${esc(gname(g))}</td><td>${n}/${st}</td><td class="${pc >= 50 ? 'warn' : ''}">${pc}%</td></tr>`).join('')}</tbody></table>` : `<p class="ok">✅ ${T('None.', 'Không có.')}</p>`}</div>
    <div class="card"><h3>🐢 ${T('Slow devices', 'Máy chạy chậm')}</h3>${pb.slow.length ? `<table class="mini"><tbody>${pb.slow.map(([id, l, f, sm]) => { const d = r.devices.find(x => x.id === id) || { id, label: l, fps: f }; return `<tr class="devrow${isRobot(d) ? ' robot' : ''}"><td>${devHTML(d)}</td><td>${f} ${T('frames/s', 'khung/giây')}</td><td>${sm} ${T('slow min', 'phút chậm')}</td></tr>`; }).join('')}</tbody></table>` : `<p class="ok">✅ ${T('All smooth.', 'Đều mượt.')}</p>`}</div></div>`)}
  ${await (async () => {
    try {
      const pa = await api('parent-analytics');
      const tot = pa?.totals || {};
      const pv = tot.pageViews || {};
      const devs = tot.devices || {};
      const langs = tot.languages || {};
      const acts = tot.actionClicks || {};
      const routeRows = Object.entries(pv).sort((a: any, b: any) => b[1] - a[1]).map(([rt, c]) => `<tr><td><code>${esc(rt)}</code></td><td><b>${c}</b></td></tr>`).join('') || `<tr><td colspan="2" class="note">${T('No parent website visits recorded yet.', 'Chưa có lượt truy cập website cha mẹ.')}</td></tr>`;
      return more('parent-analytics', T('🌐 Parent website analytics (first-party)', '🌐 Phân tích website cha mẹ (trực tiếp)'), `
        <p class="sub">${T('Privacy-conscious first-party measurement of sparklevalley.au/home. Separate from game telemetry and synthetic traffic. Consent-gated; visitors who opt out are never recorded, so numbers represent consenting visitors only.', 'Đo lường trực tiếp, bảo vệ quyền riêng tư cho sparklevalley.au/home. Tách biệt với số liệu trò chơi và lưu lượng tự động. Phải có đồng ý; khách từ chối không bao giờ bị ghi nhận, nên số liệu chỉ đại diện người đồng ý.')}</p>
        <div class="tiles">
          ${tile('👁️', tot.totalEvents || 0, T('consented events (30d)', 'sự kiện đồng ý (30 ngày)'))}
          ${tile('▶️', tot.playConversions || 0, T('Play Sparkle Valley clicks', 'bấm Chơi Sparkle Valley'))}
          ${tile('⏱️', Math.round((tot.activeTimeTotalSec || 0) / 60) + ' min', T('active reading time', 'thời gian đọc thực tế'))}
          ${tile('🔗', tot.linkClicks || 0, T('link clicks', 'lượt bấm liên kết'))}
        </div>
        <div class="grid two">
          <div class="card">
            <h3>📄 ${T('Pages viewed', 'Trang đã xem')}</h3>
            <table class="mini"><thead><tr><th>${T('Page', 'Trang')}</th><th>${T('Views', 'Lượt xem')}</th></tr></thead><tbody>${routeRows}</tbody></table>
          </div>
          <div class="card">
            <h3>📱 ${T('Devices & Languages', 'Thiết bị & Ngôn ngữ')}</h3>
            <p><strong>${T('Devices', 'Thiết bị')}:</strong> 📱 ${T('Phone', 'Điện thoại')}: ${devs.phone || 0} · 📲 ${T('Tablet', 'Máy tính bảng')}: ${devs.tablet || 0} · 💻 ${T('Desktop', 'Máy tính')}: ${devs.desktop || 0}</p>
            <p><strong>${T('Languages', 'Ngôn ngữ')}:</strong> 🇬🇧 EN: ${langs.en || 0} · 🇻🇳 VI: ${langs.vi || 0}</p>
            <p><strong>${T('Key actions', 'Thao tác chính')}:</strong> 🌐 ${T('Lang switch', 'Đổi ngôn ngữ')}: ${acts.lang_switch || 0} · ▶️ ${T('Nav play', 'Chơi từ thanh menu')}: ${acts.nav_play || 0}</p>
            <p class="note">${T('No free text, full URLs, keystrokes, fingerprints or private family memories/photos/voices are ever measured.', 'Tuyệt đối không đo lường văn bản tự do, URL đầy đủ, phím gõ, dấu vân tay hay kỷ niệm/ảnh/giọng nói riêng tư của gia đình.')}</p>
          </div>
        </div>
      `);
    } catch {
      return '';
    }
  })()}
  <p class="note">${T('Made', 'Lúc')} ${esc(new Date(r.made).toLocaleString(LANG === 'vi' ? 'vi-VN' : 'en-AU', { timeZone: 'Australia/Sydney' }))} ${sydneyZone(r.made)}</p>`;
  { const tt = P.querySelector<HTMLInputElement>('#totesters'); if (tt) tt.onclick = () => go('testers'); }
  devFilter($('#devlist')); // (owner, 13 Oct) find a device by a child's name, its name, the town or the kind of device
  P.querySelectorAll<HTMLInputElement>('.dev [data-rename]').forEach(b => b.onclick = async () => { const card = b.closest<HTMLInputElement>('.dev'), id = card.dataset.id, cur = card.querySelector<HTMLInputElement>('.dlabel').textContent;
    const l = prompt(T('A name for this device (e.g. “Na’s iPad”):', 'Tên cho máy này (ví dụ “iPad của Na”):'), cur); if (l === null) return;
    try { await api('players/label', { id, label: l }); card.querySelector<HTMLInputElement>('.dlabel').textContent = l || cur; toast(T('Saved.', 'Đã lưu.')); } catch (e) { fail(e); } });
};
// ---------- 👥 Admins (online, round O) ----------
const ROLE_NAMES: Record<string, [string, string]> = { viewer: ['👀 Viewer: Analytics only', '👀 Xem: chỉ Phân tích'], editor: ['✏️ Editor: every page and Publish', '✏️ Sửa: mọi trang và Phát hành'], owner: ['👑 Owner: everything, also admins', '👑 Chủ: tất cả, cả quản trị viên'], custom: ['🧩 Chosen: only what is ticked', '🧩 Tự chọn: chỉ những gì được đánh dấu'] };
// (owner, 14 Oct AEDT) the permissions one by one (the server's list, netlify/lib/admins.mts PERMS): ticked = allowed
const permList = (perms, on, name) => `<div class="perms">${Object.entries<[string, string, string]>(perms || {}).map(([k, [i, en, vi]]) => `<label class="perm"><input type="checkbox" data-perm="${k}" ${on.includes(k) ? 'checked' : ''} ${name ? '' : 'disabled'}> ${i} ${T(en, vi)}</label>`).join('')}</div>`;
// (owner, 12 Oct) Tester reports: what tester devices found (netlify/lib/tester.mts). The day's summary; each problem with
// how often, on how many devices and versions, where, and its status; filters; a problem's details (the notes, the
// players, the errors, the last 30 seconds as steps, the screenshots) with Fixed in…, Being fixed, Not a bug, Same as…;
// and the testers: their reports, the ones that helped, their badge and this week's star, and Stop tester.
PAGES.testers = async P => {
  const head = `<h2>🐞 ${T('Tester reports', 'Báo cáo người thử')}</h2>`;
  P.innerHTML = head + `<div class="card">${T('Asking the website…', 'Đang hỏi trang web…')}</div>`;
  let r; try { r = await api('testers'); } catch (e) { P.innerHTML = head + `<div class="card"><p class="badtxt">⚠️ ${esc(e.message)}</p><p class="note">${T('Tester reports come from the website: switch Testers on in 🎮 Game → 🆕 Releases (For testing), for every device or the ticked ones.', 'Báo cáo người thử đến từ trang web: bật Người thử trong 🎮 Trò chơi → 🆕 Ra mắt (Để thử), cho mọi máy hoặc các máy được chọn.')}</p></div>`; return; }
  let labels = {}; try { const pr = await api('players'); for (const d of (pr && pr.devices) || []) labels[d.id] = devTitle(d) + ' (' + devAbout(d) + ')'; } catch (e) { }
  const { problems = [], testers = [], summary = {} } = r || {}, gameBuild = await (async () => { try { return (await import(GAME + 'js/build.js')).BUILD; } catch (e) { return ''; } })();
  const sydney = t => t ? new Date(t).toLocaleString(LANG === 'vi' ? 'vi-VN' : 'en-AU', { timeZone: 'Australia/Sydney', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  const ST = { new: ['🆕', 'New', 'Mới'], fixing: ['🔨', 'Being fixed', 'Đang sửa'], fixed: ['✅', 'Fixed', 'Đã sửa'], confirmed: ['🏁', 'Fixed and checked', 'Đã sửa và kiểm tra'], back: ['🔁', 'Came back', 'Bị lại'], notbug: ['🚫', 'Not a bug', 'Không phải lỗi'], dup: ['🔗', 'Same as another', 'Trùng lỗi khác'] };
  const KIND = { broken: ['💥', 'Broken', 'Bị hỏng'], looks: ['👀', 'Looks wrong', 'Trông sai'], words: ['💬', 'Words or voice', 'Chữ hoặc giọng'], sound: ['🔔', 'Sound', 'Âm thanh'], idea: ['💡', 'Idea', 'Ý tưởng'], auto: ['🤖', 'Automatic', 'Tự động'] };
  const stName = s => ST[s] ? `${ST[s][0]} ${T(ST[s][1], ST[s][2])}` : s, kindName = k => KIND[k] ? `${KIND[k][0]} ${T(KIND[k][1], KIND[k][2])}` : k;
  const whereText = w => w ? [w.game, w.window, w.area].filter(Boolean).join(' · ') : '';
  const devName = id => labels[id] || easyName(id);
  const builds = [...new Set(problems.flatMap(p => p.builds || []))].sort();
  const big = (n, en, vi) => `<div class="card stat"><b>${n}</b><span>${T(en, vi)}</span></div>`;
  P.innerHTML = head + `<p class="sub">${T('Each problem once, however many times it was met. Set its status here: a tester device gets a tick when its problem is fixed, replays it on the new version, and earns its rewards.', 'Mỗi lỗi một lần, dù gặp bao nhiêu lần. Đặt trạng thái ở đây: máy thử thấy dấu tích khi lỗi của nó đã sửa, thử lại trên bản mới, và nhận phần thưởng.')}</p>
    <div class="stats">${big(summary.new || 0, 'new today', 'mới hôm nay')}${big(summary.fixed || 0, 'fixed today', 'sửa hôm nay')}${big(summary.open || 0, 'still open', 'còn mở')}${big(testers.length, 'testers', 'người thử')}</div>
    ${(summary.top || []).length ? `<div class="card"><h3>${T('Met by the most testers', 'Nhiều người thử gặp nhất')}</h3><ol>${summary.top.map(t => `<li><a href="#" data-open="${esc(t.k)}">${esc(t.title)}</a> · ${t.devices} ${T('devices', 'máy')} · ${t.n}×</li>`).join('')}</ol></div>` : ''}
    <div class="card tfilters"><label>${T('Status', 'Trạng thái')} <select id="fst"><option value="open">${T('Open (new, being fixed, came back)', 'Còn mở (mới, đang sửa, bị lại)')}</option><option value="">${T('All', 'Tất cả')}</option>${Object.keys(ST).map(s => `<option value="${s}">${stName(s)}</option>`).join('')}</select></label>
      <label>${T('Kind', 'Loại')} <select id="fkd"><option value="">${T('All', 'Tất cả')}</option><option value="auto">${kindName('auto')}</option><option value="tester">${T('From testers', 'Do người thử báo')}</option>${['broken', 'looks', 'words', 'sound', 'idea'].map(k => `<option value="${k}">${kindName(k)}</option>`).join('')}</select></label>
      <label>${T('Version', 'Phiên bản')} <select id="fbd"><option value="">${T('All', 'Tất cả')}</option>${builds.map(b => `<option>${esc(b)}</option>`).join('')}</select></label></div>
    <div class="card"><table class="rel tprob"><thead><tr><th>${T('Problem', 'Lỗi')}</th><th>${T('Where', 'Ở đâu')}</th><th>${T('Times', 'Số lần')}</th><th>${T('Devices', 'Máy')}</th><th>${T('Versions', 'Phiên bản')}</th><th>${T('Last seen', 'Lần cuối')}</th><th>${T('Status', 'Trạng thái')}</th></tr></thead><tbody id="tpb"></tbody></table></div>
    <div id="tdetail"></div>
    <h3>${T('Testers', 'Người thử')}</h3><div class="card"><table class="rel"><thead><tr><th>${T('Device', 'Máy')}</th><th>${T('Players', 'Người chơi')}</th><th>${T('Reports', 'Báo cáo')}</th><th>${T('Helped fix', 'Giúp sửa')}</th><th>${T('Accepted', 'Đã đồng ý')}</th><th>${T('Last seen', 'Lần cuối')}</th><th></th></tr></thead><tbody>${testers.map(t => `<tr><td>${t.star ? '⭐ ' : ''}${esc(devName(t.id))} <small class="mini">${esc(t.id)} · ${esc(t.os)} · ${esc(t.b)}</small></td><td>${esc(t.players.join(', '))}</td><td>${t.reports}</td><td>${t.helped}</td><td>${t.accepted ? sydney(t.accepted) : '–'}</td><td>${sydney(t.lastAt)}</td><td><button class="btn small" data-stop="${esc(t.id)}">${T('Stop tester', 'Dừng người thử')}</button></td></tr>`).join('') || `<tr><td colspan="7" class="note">${T('No testers yet.', 'Chưa có người thử.')}</td></tr>`}</tbody></table></div>`;
  const draw = () => {
    const st = $('#fst').value, kd = $('#fkd').value, bd = $('#fbd').value;
    const list = problems.filter(p => (st === 'open' ? ['new', 'fixing', 'back'].includes(p.status) : !st || p.status === st) && (!kd || (kd === 'tester' ? p.kind !== 'auto' : p.kind === kd)) && (!bd || (p.builds || []).includes(bd)));
    $('#tpb').innerHTML = list.map(p => `<tr data-open="${esc(p.k)}" class="click"><td>${kindName(p.kind)}${p.auto ? ' · ' + esc(p.auto) : ''}<br><b>${esc(p.title)}</b>${p.spoken ? ' 🎤' : ''}</td><td>${esc(whereText(p.where))}</td><td>${p.n}</td><td>${p.devices}</td><td>${esc((p.builds || []).join(', '))}</td><td>${sydney(p.lastAt)}</td><td>${stName(p.status)}${p.fixedIn ? ' · ' + esc(p.fixedIn) : ''}</td></tr>`).join('') || `<tr><td colspan="7" class="note">${T('Nothing here.', 'Không có gì.')}</td></tr>`;
    P.querySelectorAll<HTMLInputElement>('[data-open]').forEach(x => x.onclick = e => { e.preventDefault(); open(x.dataset.open); });
  };
  const open = async k => {
    const box = $('#tdetail'); box.innerHTML = `<div class="card">${T('Loading…', 'Đang tải…')}</div>`;
    let p; try { p = await api('testers/problem/' + k); } catch (e) { box.innerHTML = `<div class="card"><p class="badtxt">⚠️ ${esc(e.message)}</p></div>`; return; }
    const others = problems.filter(q => q.k !== k && !['dup'].includes(q.status));
    box.innerHTML = `<div class="card tdet"><h3>${kindName(p.kind)} · ${esc(p.title)}</h3><p class="note">${esc(whereText(p.where))} · ${p.n}× · ${p.devices.length} ${T('devices', 'máy')} · ${esc((p.builds || []).join(', '))} · ${stName(p.status)}${p.fixedIn ? ' ' + esc(p.fixedIn) : ''}</p>
      <div class="bar"><label>${T('Fixed in', 'Đã sửa trong bản')} <input id="tfin" value="${esc(p.fixedIn || gameBuild)}" size="6"></label><button class="btn" id="tfix">✅ ${T('Mark fixed', 'Đánh dấu đã sửa')}</button>
        <button class="btn" data-set="fixing">🔨 ${T('Being fixed', 'Đang sửa')}</button><button class="btn" data-set="notbug">🚫 ${T('Not a bug', 'Không phải lỗi')}</button><button class="btn" data-set="new">🆕 ${T('Open again', 'Mở lại')}</button>
        <label>${T('Same as', 'Trùng với')} <select id="tdup"><option value="">…</option>${others.map(q => `<option value="${esc(q.k)}">${esc(q.title.slice(0, 60))}</option>`).join('')}</select></label></div>
      ${p.reports.slice().reverse().map(x => `<div class="trep"><p><b>${sydney(x.at)}</b> · ${esc(devName(x.id))} · ${esc(x.b)} · ${esc(x.dev.os)} ${esc(x.dev.br)} ${esc(x.dev.sc)} · ${esc(x.dev.lang)}${x.dev.fps ? ' · ' + x.dev.fps + ' fps' : ''}${x.count > 1 ? ' · ' + x.count + '×' : ''}</p>
        ${x.note ? `<p>${x.spoken ? '🎤 ' : '✏️ '}${esc(x.note)}</p>` : ''}${x.detail ? `<p class="note">${esc(x.detail)}</p>` : ''}
        <p class="note">👧 ${esc(x.players.map(q => `${q.name} (${q.age})`).join(', ') || '–')} · 📍 ${esc(whereText(x.where))} (${x.where.x ?? ''}, ${x.where.z ?? ''})</p>
        ${x.errors.length ? `<details><summary>${T('Errors', 'Lỗi')} (${x.errors.length})</summary><pre>${esc(x.errors.join('\n'))}</pre></details>` : ''}
        ${x.log.length ? `<details><summary>${T('The last 30 seconds', '30 giây trước đó')} (${x.log.length})</summary><ol class="tlog">${x.log.map(([t, kk, s]) => `<li><small>${t} s</small> <b>${esc(kk)}</b> ${esc(s)}</li>`).join('')}</ol></details>` : ''}
        ${x.shot ? `<button class="btn small" data-shot="${esc(x.rid)}">🖼️ ${T('Screenshot', 'Ảnh màn hình')}</button><div class="tshot"></div>` : ''}</div>`).join('')}</div>`;
    const set = async b => { try { const q = await api('testers/set', { k, ...b }); Object.assign(problems.find(x => x.k === k) || {}, q); toast('✅ ' + T('Saved', 'Đã lưu'), 'good'); draw(); open(k); } catch (e) { fail(e); } };
    $('#tfix').onclick = () => { const v = $('#tfin').value.trim(); if (!/^v\d{1,2}\.\d{2}$/.test(v)) return toast('⚠️ ' + T('Write the version like v1.01.', 'Viết phiên bản như v1.01.'), 'bad'); set({ status: 'fixed', fixedIn: v }); };
    box.querySelectorAll<HTMLInputElement>('[data-set]').forEach(b => b.onclick = () => set({ status: b.dataset.set }));
    $('#tdup').onchange = () => { if ($('#tdup').value) set({ dupOf: $('#tdup').value }); };
    box.querySelectorAll<HTMLInputElement>('[data-shot]').forEach(b => b.onclick = async () => { try { const s = await api('testers/shot/' + b.dataset.shot); b.nextElementSibling.innerHTML = s.shot ? `<img alt="" src="${esc(s.shot)}">` : T('No picture.', 'Không có ảnh.'); } catch (e) { fail(e); } });
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  ['#fst', '#fkd', '#fbd'].forEach(s => $(s).onchange = draw); draw();
  // Stop tester: take the device off the Releases page's list (with no list, every device is a tester: tick the others there)
  P.querySelectorAll<HTMLInputElement>('[data-stop]').forEach(b => b.onclick = async () => {
    try { const live = await loadLive(), rel = live.releases || {}, tr = rel.tester || {}, list = (tr.devices || []).filter(d => d !== b.dataset.stop);
      if (!(tr.devices || []).length) return toast('⚠️ ' + T('Every device is a tester now: tick the testers in 🎮 Game → 🆕 Releases first.', 'Hiện mọi máy đều là máy thử: hãy chọn các máy thử trong 🎮 Trò chơi → 🆕 Ra mắt trước.'), 'bad');
      if (!list.length) tr.on = false; tr.devices = list; await saveLive({ releases: { ...rel, tester: tr }, festivals: live.festivals || {} }); b.closest<HTMLInputElement>('tr').remove();
    } catch (e) { fail(e); } });
};
PAGES.admins = async P => {
  const me = (INFO && INFO.me) || { name: 'owner', role: 'owner' };
  const mine = me.name === 'owner' ? '' : `<div class="card"><h3>🔑 ${T('My password', 'Mật khẩu của tôi')} (${esc(me.name)})</h3>
    <input type="password" id="op" autocomplete="current-password" placeholder="${T('Old password', 'Mật khẩu cũ')}"> <input type="password" id="np" autocomplete="new-password" placeholder="${T('New password (12+ characters)', 'Mật khẩu mới (từ 12 ký tự)')}"> <button class="btn" id="chg">${T('Change', 'Đổi')}</button></div>`;
  if (me.role !== 'owner') { P.innerHTML = `<h2>👥 ${T('Admins', 'Quản trị viên')}</h2><p class="sub">${T('You are signed in as', 'Bạn đang đăng nhập là')} <b>${esc(me.name)}</b> · ${T(...ROLE_NAMES[me.role] || ROLE_NAMES.custom)}</p>
    <div class="card"><h3>🧩 ${T('What you may do', 'Bạn được làm gì')}</h3>${permList(INFO && INFO.perms, me.perms || [], '')}<p class="note">${T('Ask the owner if you need more.', 'Cần thêm quyền thì hỏi chủ.')}</p></div>${mine}`; bindMine(P); explainPage(P, 'admins'); foldPage(P, 'admins'); return; }
  const { admins, perms } = await api('admins/list'), opt = r => Object.keys(ROLE_NAMES).map(k => `<option value="${k}" ${k === r ? 'selected' : ''}>${T(...ROLE_NAMES[k])}</option>`).join('');
  P.innerHTML = `<h2>👥 ${T('Admins', 'Quản trị viên')}</h2><p class="sub">${T('Other grown-ups sign in at this address with their own name and password; they never need a GitHub token (the website’s own is used). You see here who can do what.', 'Người lớn khác đăng nhập ở địa chỉ này bằng tên và mật khẩu riêng; họ không cần token GitHub (dùng token của trang web). Ở đây bạn thấy ai được làm gì.')}</p>
    <div class="card"><h3>➕ ${T('Add someone', 'Thêm người')}</h3><div class="row" style="flex-wrap:wrap;gap:8px">
      <input type="text" id="an" autocapitalize="none" spellcheck="false" placeholder="${T('Sign-in name, e.g. ba.nam', 'Tên đăng nhập, ví dụ ba.nam')}"><input type="password" id="ap" autocomplete="new-password" placeholder="${T('Their password (12+ characters)', 'Mật khẩu của họ (từ 12 ký tự)')}"><select id="ar">${opt('viewer')}</select><button class="btn" id="aadd">${T('Add', 'Thêm')}</button></div>
      <p class="note">${T('Tell them the address (this page), their name and password yourself. They can change their password here after signing in.', 'Tự gửi cho họ địa chỉ (trang này), tên và mật khẩu. Sau khi đăng nhập họ có thể tự đổi mật khẩu ở đây.')}</p></div>
    <div class="card"><h3>👥 ${T('Who can sign in', 'Ai có thể đăng nhập')}</h3>
      <p class="note">${T('Sign-in for each person: <b>password and code</b> (two-step: the password, then the 6-digit code of an authenticator app; safest) or <b>password only</b>. Changing it signs that person out.', 'Cách đăng nhập cho từng người: <b>mật khẩu và mã</b> (hai bước: mật khẩu, rồi mã 6 số của ứng dụng xác thực; an toàn nhất) hoặc <b>chỉ mật khẩu</b>. Đổi cách đăng nhập sẽ đăng xuất người đó.')}</p><table class="mini"><tbody>
      <tr data-o="owner"><td><b>owner</b></td><td>${T(...ROLE_NAMES.owner)}</td><td class="note">${T('the Studio password (STUDIO_PASSWORD in Netlify)', 'mật khẩu Studio (STUDIO_PASSWORD trong Netlify)')}</td><td class="note">${T('Password only (two-step is for admins)', 'Chỉ mật khẩu (hai bước dành cho quản trị viên)')}</td></tr>
      ${admins.map(a => `<tr data-n="${esc(a.name)}"><td><b>${esc(a.name)}</b></td><td><select data-role>${opt(a.role)}</select></td><td class="note">${T('added', 'thêm')} ${esc(new Date(a.at).toLocaleDateString(LANG === 'vi' ? 'vi-VN' : 'en-AU', { timeZone: 'Australia/Sydney' }))} · ${esc(a.by)} · ${a.twoStepOn === false ? T('password only', 'chỉ mật khẩu') : a.twoStep ? T('two-step on', 'đã bật hai bước') : T('two-step at next sign-in', 'hai bước khi đăng nhập lần tới')}</td><td><select data-2s><option value="on" ${a.twoStepOn !== false ? 'selected' : ''}>${T('Password and code', 'Mật khẩu và mã')}</option><option value="off" ${a.twoStepOn !== false ? '' : 'selected'}>${T('Password only', 'Chỉ mật khẩu')}</option></select> <button class="btn small ghost" data-pw>🔑 ${T('New password', 'Mật khẩu mới')}</button> ${a.twoStep && a.twoStepOn !== false ? `<button class="btn small ghost" data-2fa>📱 ${T('New phone', 'Điện thoại mới')}</button> ` : ''}<button class="btn small ghost" data-rm>🗑️</button></td></tr>
      <tr class="permrow" data-pn="${esc(a.name)}"><td colspan="4"><details><summary>🧩 ${T('What they may do', 'Họ được làm gì')} <span class="pc">(${(a.perms || []).length} / ${Object.keys(perms || {}).length})</span></summary>${permList(perms, a.perms || [], a.name)}<p class="note">${T('Ticking or unticking one makes their role “Chosen”. Managing admins, Security and the Access log come only with Owner.', 'Đánh dấu hoặc bỏ một ô sẽ đổi vai trò của họ thành “Tự chọn”. Quản lý quản trị viên, Bảo mật và Nhật ký truy cập chỉ đi kèm vai trò Chủ.')}</p></details></td></tr>`).join('')}
    </tbody></table>${admins.length ? '' : `<p class="note">${T('Nobody else yet.', 'Chưa có ai khác.')}</p>`}</div>`;
  const newPerms = document.createElement('div'); newPerms.className = 'new-admin-perms'; newPerms.hidden = true; newPerms.innerHTML = `<p>${T('Choose permissions for this new admin before adding them.', 'Chọn quyền cho quản trị viên mới trước khi thêm.')}</p>${permList(perms, [], 'new')}`; $('#ar').closest<HTMLInputElement>('.card').appendChild(newPerms); $('#ar').onchange = () => { newPerms.hidden = $('#ar').value !== 'custom'; };
  $('#aadd').onclick = async () => { try { await api('admins/save', { name: $('#an').value, password: $('#ap').value, role: $('#ar').value, ...($('#ar').value === 'custom' ? { perms: [...newPerms.querySelectorAll<HTMLInputElement>('[data-perm]:checked')].map(x => x.dataset.perm) } : {}) }); toast(T('Added.', 'Đã thêm.')); PAGES.admins(P); } catch (e) { fail(e); } };
  // (owner, 9 Oct) two-step or the password only, for each admin (the owner: the password only, 11 Oct)
  P.querySelectorAll<HTMLInputElement>('[data-2s]').forEach(s => s.onchange = async () => { const tr = s.closest<HTMLInputElement>('tr'), name = tr.dataset.n || 'owner', on = s.value === 'on';
    if (!on && !confirm(T(`Let ${name} sign in with the password only (no code)? It is less safe: anyone with the password gets in.`, `Cho ${name} đăng nhập chỉ bằng mật khẩu (không mã)? Kém an toàn hơn: ai có mật khẩu cũng vào được.`))) { s.value = 'on'; return; }
    try { await api('admins/twostep', { name, on }); toast(on ? T('Two-step on: they set it up at their next sign-in if needed.', 'Đã bật hai bước: họ cài khi đăng nhập lần tới nếu cần.') : T('Password only.', 'Chỉ mật khẩu.')); PAGES.admins(P); } catch (e) { fail(e); } });
  P.querySelectorAll<HTMLInputElement>('tr[data-n]').forEach(tr => { const name = tr.dataset.n;
    tr.querySelector<HTMLInputElement>('[data-role]').onchange = async e => { const open = val(e) === 'custom' || P.querySelector<HTMLDetailsElement>(`tr[data-pn="${CSS.escape(name)}"] details`).open; try { await api('admins/save', { name, role: val(e), ...(val(e) === 'custom' ? { perms: [...P.querySelectorAll<HTMLInputElement>(`tr[data-pn="${CSS.escape(name)}"] [data-perm]:checked`)].map(x => x.dataset.perm) } : {}) }); toast(T('Saved.', 'Đã lưu.')); await PAGES.admins(P); if (open) P.querySelector<HTMLDetailsElement>(`tr[data-pn="${CSS.escape(name)}"] details`).open = true; } catch (x) { fail(x); } };
    // (owner, 14 Oct AEDT) one permission at a time
    P.querySelectorAll<HTMLInputElement>(`tr[data-pn="${CSS.escape(name)}"] [data-perm]`).forEach(cb => cb.onchange = async () => {
      const row = P.querySelector<HTMLInputElement>(`tr[data-pn="${CSS.escape(name)}"]`), list = [...row.querySelectorAll<HTMLInputElement>('[data-perm]:checked')].map(x => x.dataset.perm);
      try { await api('admins/save', { name, role: 'custom', perms: list }); tr.querySelector<HTMLInputElement>('[data-role]').value = 'custom'; row.querySelector<HTMLInputElement>('.pc').textContent = `(${list.length} / ${row.querySelectorAll<HTMLInputElement>('[data-perm]').length})`; toast(T('Saved: it applies at their next step in Studio.', 'Đã lưu: có hiệu lực ở thao tác tiếp theo của họ trong Studio.')); } catch (x) { cb.checked = !cb.checked; fail(x); } });
    tr.querySelector<HTMLInputElement>('[data-pw]').onclick = async () => { const pw = prompt(T(`A new password for ${name} (12+ characters):`, `Mật khẩu mới cho ${name} (từ 12 ký tự):`)); if (!pw) return; try { await api('admins/save', { name, password: pw, role: tr.querySelector<HTMLInputElement>('[data-role]').value }); toast(T('Changed: they are signed out everywhere.', 'Đã đổi: họ bị đăng xuất khỏi mọi nơi.')); } catch (e) { fail(e); } };
    const tf = tr.querySelector<HTMLInputElement>('[data-2fa]'); if (tf) tf.onclick = async () => { if (!confirm(T(`Clear ${name}’s two-step? They set it up again (with their new phone) the next time they sign in.`, `Xóa xác thực hai bước của ${name}? Họ sẽ cài lại (bằng điện thoại mới) khi đăng nhập lần tới.`))) return; try { await api('admins/reset2fa', { name }); toast(T('Cleared: they are signed out everywhere.', 'Đã xóa: họ bị đăng xuất khỏi mọi nơi.')); PAGES.admins(P); } catch (e) { fail(e); } };
    tr.querySelector<HTMLInputElement>('[data-rm]').onclick = async () => { if (!confirm(T(`Remove ${name}? They can no longer sign in.`, `Xóa ${name}? Họ sẽ không đăng nhập được nữa.`))) return; try { await api('admins/remove', { name }); PAGES.admins(P); } catch (e) { fail(e); } }; });
  explainPage(P, 'admins'); foldPage(P, 'admins');
};
function bindMine(P) { const b = P.querySelector('#chg'); if (b) b.onclick = async () => { try { await api('admins/me', { old: $('#op').value, password: $('#np').value }); toast(T('Password changed. Please sign in again.', 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.')); setTimeout(signIn, 1200); } catch (e) { fail(e); } }; }
// ---------- 🛡️ Security (online, the owner; round R privacy) ----------
PAGES.security = async P => {
  const { keys } = await api('keys/list');
  P.innerHTML = `<h2>🛡️ ${T('Security', 'Bảo mật')}</h2><p class="sub">${T('Everyone signs in with their password (12 characters or more). Admins also type the 6-digit code of an authenticator app on their phone, unless the owner chose password only for them in Admins; the owner uses the password only. Ten wrong tries lock signing in for 15 minutes.', 'Mọi người đăng nhập bằng mật khẩu (từ 12 ký tự). Quản trị viên gõ thêm mã 6 số của ứng dụng xác thực trên điện thoại, trừ khi chủ chọn “chỉ mật khẩu” cho họ ở Quản trị viên; chủ chỉ dùng mật khẩu. Sai mười lần thì khóa đăng nhập 15 phút.')}</p>
  <div class="card"><h3>📱 ${T('Two-step sign-in', 'Đăng nhập hai bước')}</h3><p class="note">${T('Each person sets it up at their first sign-in. For someone with a new phone: Setup → Admins → New phone. The owner signs in with the password only.', 'Mỗi người cài đặt ở lần đăng nhập đầu tiên. Ai đổi điện thoại: Thiết lập → Quản trị viên → Điện thoại mới. Chủ đăng nhập chỉ bằng mật khẩu.')}</p></div>
  <div class="card"><h3>🤝 ${T('Trusted browsers', 'Trình duyệt tin cậy')}</h3><p class="note">${T('Browsers where someone ticked “Trust this browser” when signing in: they stay signed in. Forget one and it must sign in again.', 'Các trình duyệt đã chọn “Tin cậy trình duyệt này” khi đăng nhập: luôn đăng nhập sẵn. Quên một trình duyệt thì nó phải đăng nhập lại.')}</p><div id="trusted">${T('Loading…', 'Đang tải…')}</div></div>
  <div class="card"><h3>🚪 ${T('Sign everyone out', 'Đăng xuất mọi người')}</h3><p class="note">${T('Every sign-in on every device ends, yours too, and every Studio key below stops working. Use it if a phone or computer was lost.', 'Mọi phiên đăng nhập trên mọi máy kết thúc, cả của bạn, và mọi khóa Studio bên dưới ngừng hoạt động. Dùng khi mất điện thoại hay máy tính.')}</p><button class="btn" id="allout">🚪 ${T('Sign everyone out', 'Đăng xuất mọi người')}</button></div>
  <div class="card"><h3>🔑 ${T('Keys for SparkleStudio.exe', 'Khóa cho SparkleStudio.exe')}</h3><p class="note">${T('The family computer’s Studio reaches the website with a key instead of signing in: the Analytics, the missing lines and the family photos, nothing else. Make one, paste it into SparkleStudio.exe → Settings; it is shown only once.', 'Studio trên máy tính gia đình đến trang web bằng khóa thay vì đăng nhập: Phân tích, câu còn thiếu và ảnh gia đình, không gì khác. Tạo khóa, dán vào SparkleStudio.exe → Cài đặt; khóa chỉ hiện một lần.')}</p>
    <table class="mini"><tbody>${keys.map(k => `<tr data-id="${esc(k.id)}"><td><b>${esc(k.label)}</b></td><td class="note">${esc(whenAEST(k.at))} · ${esc(k.by)}</td><td><button class="btn small ghost" data-krm>🗑️</button></td></tr>`).join('') || `<tr><td class="note">${T('No keys yet.', 'Chưa có khóa nào.')}</td></tr>`}</tbody></table>
    <div class="row" style="margin-top:8px"><input type="text" id="klabel" maxlength="40" placeholder="${T('Which computer? e.g. Family PC', 'Máy nào? ví dụ Máy tính gia đình')}"><button class="btn" id="kmake">➕ ${T('Make a key', 'Tạo khóa')}</button></div><p class="note" id="kout"></p></div>`;
  const drawTrusted = async () => { let L = []; try { L = (await api('trusted')).trusted || []; } catch (e) { $('#trusted').textContent = say(e.message); return; }
    $('#trusted').innerHTML = L.length ? `<table class="mini"><tbody>${L.map(x => `<tr data-tid="${esc(x.id)}"><td><b>${esc(x.who === 'owner' ? T('Owner', 'Chủ') : x.who)}</b>${x.here ? ` <span class="pill">${T('this browser', 'trình duyệt này')}</span>` : ''}</td><td>${esc(x.browser)}${x.where ? ' · ' + esc(x.where) : ''}</td><td class="note">${T('since', 'từ')} ${esc(whenAEST(x.at))} · ${T('last used', 'dùng gần nhất')} ${esc(whenAEST(x.last))}</td><td><button class="btn small ghost" data-tforget>${T('Forget', 'Quên')}</button></td></tr>`).join('')}</tbody></table>` : `<p class="note">${T('None yet.', 'Chưa có.')}</p>`;
    P.querySelectorAll<HTMLInputElement>('[data-tforget]').forEach(b => b.onclick = async () => { const tr = b.closest<HTMLInputElement>('tr'); if (!confirm(T('Forget this browser? It must sign in again.', 'Quên trình duyệt này? Nó sẽ phải đăng nhập lại.'))) return;
      try { await api('trusted/forget', { id: tr.dataset.tid }); toast(T('Forgotten.', 'Đã quên.'), 'ok'); drawTrusted(); } catch (e) { fail(e); } }); };
  drawTrusted();
  $('#allout').onclick = async () => { if (!confirm(T('Sign everyone out, on every device? You sign in again yourself.', 'Đăng xuất mọi người trên mọi máy? Bạn sẽ đăng nhập lại.'))) return; try { await api('security/signout-all', {}); signIn(); } catch (e) { fail(e); } };
  const grants = document.createElement('fieldset');
  grants.innerHTML = `<legend>${T('Optional management access for this key', 'Quyền quản lý tùy chọn cho khóa này')}</legend>${['management.read', 'management.deviceDetail', 'operations.read'].map(k => `<label class="chk"><input type="checkbox" data-management-key value="${k}"> ${esc(T2((INFO.perms?.[k] || ['', k, k]).slice(1)))}</label>`).join('')}`;
  $('#kmake').before(grants);
  $('#kmake').onclick = async () => { try { const r = await api('keys/make', { label: $('#klabel').value, perms: [...document.querySelectorAll<HTMLInputElement>('[data-management-key]:checked')].map(x => x.value) }); $('#kout').innerHTML = `${T('Copy it now (it is not shown again):', 'Sao chép ngay (sẽ không hiện lại):')}<br><code style="user-select:all;word-break:break-all">${esc(r.key)}</code>`; } catch (e) { fail(e); } };
  P.querySelectorAll<HTMLInputElement>('[data-krm]').forEach(b => b.onclick = async () => { if (!confirm(T('Remove this key? That computer can no longer reach the website.', 'Xóa khóa này? Máy đó sẽ không đến được trang web nữa.'))) return; try { await api('keys/remove', { id: b.closest<HTMLInputElement>('tr').dataset.id }); PAGES.security(P); } catch (e) { fail(e); } });
};
// ---------- 📜 Access log (online, the owner; round R privacy): the last 200 ----------
const WHAT = { signin: ['signed in', 'đăng nhập'], 'signin-trusted': ['signed in, trusted this browser', 'đăng nhập, tin cậy trình duyệt'], 'trust-forget': ['forgot a trusted browser', 'quên một trình duyệt tin cậy'], 'signin-failed': ['wrong password', 'sai mật khẩu'], 'code-failed': ['wrong code', 'sai mã'], locked: ['locked out', 'bị khóa'], 'two-step-set': ['set up two-step', 'cài hai bước'], 'two-step-reset': ['cleared two-step', 'xóa hai bước'], analytics: ['opened the Analytics', 'mở Phân tích'], 'signout-all': ['signed everyone out', 'đăng xuất mọi người'], 'family-code': ['made a new family code', 'tạo mã gia đình mới'], 'key-made': ['made a Studio key', 'tạo khóa Studio'], 'key-removed': ['removed a Studio key', 'xóa khóa Studio'] };
PAGES.accesslog = async P => {
  const { entries } = await api('log');
  P.innerHTML = `<h2>📜 ${T('Access log', 'Nhật ký truy cập')}</h2><p class="sub">${T('The last 200: who signed in (or tried), from which town and country (worked out from the connection; the address itself is never kept), and who opened the Analytics.', '200 lần gần nhất: ai đăng nhập (hoặc thử), từ thành phố và nước nào (lấy từ kết nối; không bao giờ giữ địa chỉ), và ai đã mở Phân tích.')}</p>
  <div class="card"><table class="mini"><thead><tr><th>${T('When', 'Lúc')}</th><th>${T('Who', 'Ai')}</th><th>${T('What', 'Việc')}</th><th>${T('Where', 'Ở đâu')}</th></tr></thead><tbody>${entries.map(e => `<tr><td class="note">${esc(whenAEST(e.at))}</td><td><b>${esc(e.who)}</b>${e.role ? ` <span class="note">${esc(e.role)}</span>` : ''}</td><td class="${/failed|locked/.test(e.what) ? 'warn' : ''}">${esc(T2(WHAT[e.what] || [e.what, e.what]))}${e.note ? ' · ' + esc(e.note) : ''}</td><td>${esc(e.where || '–')}</td></tr>`).join('') || `<tr><td class="note">${T('Nothing yet.', 'Chưa có gì.')}</td></tr>`}</tbody></table></div>`;
};
// ---------- signing in (online only): the password, then the code from an authenticator app (round R privacy) ----------
function signIn() {
  LOADED = false; $('#tabs').innerHTML = ''; if ($('#crumb')) $('#crumb').innerHTML = ''; if ($('#pub')) $('#pub').hidden = true; document.body.classList.add('online');
  $('#page').innerHTML = `<div class="card signin"><h2>✨ Sparkle Studio</h2><p class="sub">${T('The grown-ups’ dashboard, online. Sign in with your name and password (the owner leaves the name empty and uses the Studio password), then the 6-digit code from your authenticator app.', 'Bảng điều khiển của người lớn, trên mạng. Đăng nhập bằng tên và mật khẩu của bạn (chủ để trống tên và dùng mật khẩu Studio), rồi mã 6 số từ ứng dụng xác thực.')}</p>
    <form id="si"><input type="text" id="nm" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="${T('Sign-in name (empty for the owner)', 'Tên đăng nhập (chủ để trống)')}" style="margin-bottom:8px"><input type="password" id="pw" autocomplete="current-password" placeholder="${T('Password', 'Mật khẩu')}">
    <div id="setup2" hidden></div><input type="text" id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="${T('6-digit code (from the second time)', 'Mã 6 số (từ lần thứ hai)')}" style="margin-top:8px">
    <label class="chk" style="margin-top:10px"><input type="checkbox" id="trust"> ${T('Trust this browser: stay signed in (a year, renewed as you use it). Only on your own phone or computer.', 'Tin cậy trình duyệt này: luôn đăng nhập (một năm, tự gia hạn khi dùng). Chỉ trên điện thoại hay máy tính của riêng bạn.')}</label>
    <button class="btn" style="margin-top:10px">🔓 ${T('Sign in', 'Đăng nhập')}</button><p class="note" id="sires"></p></form></div>`;
  $('#si').onsubmit = async e => { e.preventDefault(); $('#sires').textContent = '…';
    const r = await fetch(BASE + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: $('#nm').value, password: $('#pw').value, code: $('#code').value.replace(/\s/g, ''), trust: $('#trust').checked }) }); const j = await r.json().catch(() => ({}));
    if (r.ok && j.step === 'setup') { // the first time: add the secret to an authenticator app, then type its code
      const box = $('#setup2'); box.hidden = false;
      box.innerHTML = `<div class="card" style="margin-top:8px"><b>📱 ${T('Set up two-step sign-in (once)', 'Cài đặt đăng nhập hai bước (một lần)')}</b><p class="note">${T('On your phone, open an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…), add an account and type this key, or tap the link on the phone. Then type the 6 numbers the app shows below.', 'Trên điện thoại, mở ứng dụng xác thực (Google Authenticator, Microsoft Authenticator, 1Password…), thêm tài khoản và gõ khóa này, hoặc bấm đường link trên điện thoại. Rồi gõ 6 số ứng dụng hiện bên dưới.')}</p>
        <p style="font-family:monospace;font-size:1.1rem;word-break:break-all;user-select:all"><b>${esc(j.secret.replace(/(.{4})/g, '$1 ').trim())}</b></p><p class="note"><a href="${esc(j.otpauth)}">${T('Open in the authenticator app', 'Mở trong ứng dụng xác thực')}</a> · <code style="word-break:break-all;user-select:all">${esc(j.otpauth)}</code></p></div>`;
      $('#sires').textContent = T('Type the code from the app, then Sign in.', 'Gõ mã từ ứng dụng, rồi Đăng nhập.'); $('#code').value = ''; $('#code').focus(); return; }
    if (r.ok) { render(true); return; }
    if (j.step === 'code') $('#code').focus();
    $('#sires').textContent = '⚠️ ' + say(j.error || r.status); };
  $('#nm').focus();
}
// (the browser's Back button, or a typed address: a page with changes not saved asks first, and stays if you say no)
let HASH = location.hash;
window.addEventListener('hashchange', () => { const k = route(); if (k === cur) { const changed = HASH !== location.hash; HASH = location.hash; if (changed && k.startsWith('management')) render(); return; } if (!leaveOk()) { history.replaceState(null, '', HASH || '#'); return; } HASH = location.hash; cur = k; render(); });
// (owner, 12 Oct) the exe updates itself: a banner when GitHub has a newer Sparkle Studio; "Update now" swaps it in
async function checkUpdate(manual) {
  if (!INFO || INFO.online) return null;
  let u; try { u = await api('update/check'); } catch (e) { if (manual) toast('⚠️ ' + say(e.message), 'bad'); return null; }
  if (u.error) { if (manual) toast('⚠️ ' + say(u.error), 'bad'); return u; }
  if (!u.newer) { if (manual) toast('✅ ' + T(`Sparkle Studio ${u.here} is the newest.`, `Sparkle Studio ${u.here} là bản mới nhất.`), 'good'); return u; }
  let bar = $<HTMLElement>('#updbar'); if (!bar) { bar = document.createElement('div'); bar.id = 'updbar'; bar.className = 'card warn'; bar.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:50;display:flex;gap:12px;align-items:center;flex-wrap:wrap;max-width:calc(100vw - 32px)'; document.body.appendChild(bar); }
  bar.innerHTML = `<span>🆕 ${T(`New Sparkle Studio ${esc(u.latest)} (you have ${esc(u.here)}).`, `Có Sparkle Studio ${esc(u.latest)} mới (bạn đang dùng ${esc(u.here)}).`)}</span>${u.can ? `<button class="btn" id="updgo">⬇️ ${T('Update now', 'Cập nhật ngay')}</button>` : ''}<button class="btn ghost" id="updno">${T('Later', 'Để sau')}</button>`;
  $('#updno').onclick = () => bar.remove();
  if ($('#updgo')) $('#updgo').onclick = async () => {
    if (!leaveOk()) return;
    $('#updgo').disabled = true; bar.querySelector<HTMLInputElement>('span').textContent = T('Downloading the new Sparkle Studio…', 'Đang tải Sparkle Studio mới…');
    let r; try { r = await api('update/apply', {}); } catch (e) { r = { error: e.message }; }
    if (r.error) { bar.querySelector<HTMLInputElement>('span').textContent = '⚠️ ' + say(r.error); $('#updgo').disabled = false; return; }
    bar.querySelector<HTMLInputElement>('span').textContent = T(`Starting Sparkle Studio ${r.latest}…`, `Đang mở Sparkle Studio ${r.latest}…`);
    let gone = false; for (let k = 0; k < 60; k++) { await new Promise(ok => setTimeout(ok, 1500)); try { const i = await api('info'); if (gone || i.studio !== INFO.studio) { location.reload(); return; } } catch (e) { gone = true; } } // (the old one stops, then the new one answers)
    bar.querySelector<HTMLInputElement>('span').textContent = T('Please open Sparkle Studio again.', 'Hãy mở lại Sparkle Studio.');
  };
  return u;
}
// (owner, 12 Oct) the exe keeps its game folder up to date from GitHub: a bar while it gets the newest game
async function watchSync(force) {
  if (!INFO || INFO.online) return;
  let s; try { s = force ? await api('sync/start', { force: true }) : await api('sync/status'); } catch (e) { return; }
  let bar = null, n = 0;
  while (s && (s.state === 'running' || (force && n === 0))) {
    if (!bar) { bar = document.createElement('div'); bar.className = 'card'; bar.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:12px;z-index:50;max-width:calc(100vw - 32px)'; document.body.appendChild(bar); }
    bar.textContent = T(`Getting the newest game from GitHub: ${s.done} of ${s.total || '?'}…`, `Đang lấy game mới nhất từ GitHub: ${s.done} / ${s.total || '?'}…`);
    await new Promise(ok => setTimeout(ok, 1200)); n++; try { s = await api('sync/status'); } catch (e) { break; }
  }
  if (bar) bar.remove();
  if (!s) return;
  if (s.state === 'error') { if (force || n) toast('⚠️ ' + say(s.error), 'bad'); return; }
  if (s.total) { toast('✅ ' + T(`The game folder now has the newest game (${s.build}): ${s.total} files.`, `Thư mục game đã có game mới nhất (${s.build}): ${s.total} tệp.`) + (s.kept.length ? ' ' + T(`${s.kept.length} of your changes not published yet were kept.`, `Giữ lại ${s.kept.length} thay đổi chưa phát hành của bạn.`) : ''), 'good'); await load(true); render(); }
  else if (force) toast('✅ ' + T(`The game folder already has the newest game (${s.build}).`, `Thư mục game đã là game mới nhất (${s.build}).`), 'good');
}
render();
setTimeout(() => checkUpdate(false), 3000);
setTimeout(() => watchSync(false), 2000);
// keep the Studio running while this window is open; ⏻ stops it
setInterval(() => { if (INFO && !INFO.online) fetch(BASE + '/api/ping').catch(() => { }); }, 20000);
$('#quit').onclick = async () => {
  if (!leaveOk() || !confirm(T('Close Sparkle Studio?', 'Đóng Sparkle Studio?'))) return;
  await fetch(BASE + '/api/quit', { method: 'POST' }).catch(() => { });
  document.body.innerHTML = `<main><div class="card"><h2>👋 ${T('Sparkle Studio is closed.', 'Đã đóng Sparkle Studio.')}</h2><p class="sub">${T('You can close this window. Double-click SparkleStudio.exe to open it again.', 'Bạn có thể đóng cửa sổ này. Bấm đúp SparkleStudio.exe để mở lại.')}</p></div></main>`;
  window.close();
};
