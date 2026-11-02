// The real place behind every landmark: "📷 Real photos" shows photographs of the real thing, slowly panning like a
// film; "🚶 Step inside (360°)" opens Google's map and street view of the real place, inside the game.
// (owner, 17 Oct AEDT: "point photos to Wikimedia; if no internet, mention internet required"; replaces round R's
// "landmark photos served from our own site") the photos are the ones listed in photos/index.json (chosen by a grown-up
// in Studio's Real photos page, each with who took it and its licence), shown from where they live online: Wikimedia
// or Flickr, nowhere else (PHOTO_HOST). A photo Studio had to keep a copy of (its last resort) is a file in photos/.
// Without the internet the viewer says the photos need it; a photo seen before still shows (the service worker keeps
// it). A place with no photos listed shows "the photos are on their way". The map and street view open Google, so a
// grown-up says yes first (press and hold).
import { T } from './i18n.js';
import { el, esc, flip } from './util.js';
import { SFX } from './audio.js';
import { say } from './voice.js';
import { pic } from './art.js';
import { modal, holdButton } from './popups.js';
import { settings } from './state.js';

// id → [Wikipedia article(s) the photos are taken from in Studio (lang:Title; the first names the photos/ key), latitude, longitude]
export const REAL = {
  // (owner, 1 Nov 2026 AEDT: every landmark has real photos) the two bridges that had none
  longbien: [['en:Long Biên Bridge'], 21.0434, 105.8590], princes: [['en:Princes Bridge'], -37.8189, 144.9681],
  opera: [['en:Sydney Opera House'], -33.8568, 151.2153], harbour: [['en:Sydney Harbour Bridge'], -33.8523, 151.2108], uluru: [['en:Uluru'], -25.3444, 131.0369],
  banana: [['en:Big Banana'], -30.2766, 153.1365], bondi: [['en:Bondi Beach'], -33.8915, 151.2767], lighthouse: [['vi:Hải đăng Vũng Tàu', 'en:Vũng Tàu'], 10.3348, 107.0773],
  turtle: [['en:Turtle Tower', 'en:Hoàn Kiếm Lake'], 21.0277, 105.8522], onepillar: [['en:One Pillar Pagoda'], 21.0359, 105.8336], chuacau: [['en:Japanese Covered Bridge'], 15.8771, 108.3262],
  benthanh: [['en:Bến Thành Market'], 10.7725, 106.6980], goldenbridge: [['en:Golden Bridge (Vietnam)'], 15.9950, 107.9968], dragonbridge: [['en:Dragon Bridge (Da Nang)'], 16.0612, 108.2270],
  bnclock: [['en:Bắc Ninh'], 21.1861, 106.0763], chuadau: [['en:Dâu Pagoda', 'vi:Chùa Dâu'], 21.0371, 106.0420], butthap: [['vi:Chùa Bút Tháp', 'en:Bút Tháp Pagoda'], 21.0928, 106.0617],
  dendo: [['vi:Đền Đô', 'en:Đô Temple'], 21.1133, 105.9563], quanho: [['en:Quan họ'], 21.1861, 106.0763], vanmieu: [['en:Temple of Literature, Hanoi'], 21.0293, 105.8355],
  puppettheatre: [['en:Water puppetry'], 21.0318, 105.8532], cathedral: [['en:Notre-Dame Cathedral Basilica of Saigon'], 10.7798, 106.6990], postoffice: [['en:Saigon Central Post Office'], 10.7799, 106.7000],
  wheel: [['en:Wheel of Brisbane'], -27.4752, 153.0208], lonepine: [['en:Lone Pine Koala Sanctuary'], -27.5336, 152.9686], flinders: [['en:Flinders Street railway station'], -37.8183, 144.9671],
  wtram: [['en:Trams in Melbourne'], -37.8136, 144.9631], sydneytower: [['en:Sydney Tower'], -33.8705, 151.2089], lunapark: [['en:Luna Park Sydney'], -33.8477, 151.2100],
  bachdinh: [['vi:Bạch Dinh', 'en:Vũng Tàu'], 10.3534, 107.0687], nhatron: [['vi:Nhà Tròn (Bà Rịa)', 'vi:Bà Rịa'], 10.4963, 107.1685],
  halong: [['en:Hạ Long Bay'], 20.9101, 107.1839], hue: [['en:Imperial City of Huế'], 16.4698, 107.5786], myson: [['en:Mỹ Sơn'], 15.7640, 108.1240],
  phongnha: [['en:Phong Nha-Kẻ Bàng National Park'], 17.5906, 106.2833], trangan: [['en:Tràng An Scenic Landscape Complex'], 20.2539, 105.9178], reef: [['en:Great Barrier Reef'], -23.4423, 151.9148],
  sisters: [['en:Three Sisters (Australia)'], -33.7320, 150.3120], exhibition: [['en:Royal Exhibition Building'], -37.8047, 144.9717], kakadu: [['en:Kakadu National Park'], -12.4097, 132.9567],
  forbidden: [['en:Forbidden City'], 39.9163, 116.3972], heaven: [['en:Temple of Heaven'], 39.8822, 116.4066], terracotta: [['en:Terracotta Army'], 34.3841, 109.2785],
  potala: [['en:Potala Palace'], 29.6578, 91.1170], qutub: [['en:Qutb Minar'], 28.5245, 77.1855], redfort: [['en:Red Fort'], 28.6562, 77.2410],
  konark: [['en:Konark Sun Temple'], 19.8876, 86.0945], hampi: [['en:Vittala Temple', 'en:Hampi'], 15.3426, 76.4747], mahabodhi: [['en:Mahabodhi Temple'], 24.6959, 84.9914]
};
// photos for the kinds of houses and the speciality buildings round the cities (no 360° view: go inside instead)
export const REAL_KINDS = {
  tube: ['en:Tube house'], villa: ['en:French colonial architecture in Vietnam', 'en:Vietnamese architecture'], cottage: ['en:Queenslander (architecture)', 'en:Federation architecture'],
  raised: ['en:Queenslander (architecture)'], brick: ['en:Federation architecture'], village: ['en:Vietnamese architecture'], china: ['en:Siheyuan'], india: ['en:Haveli'],
  shop: ['en:Shophouse'], home8: ['en:Tube house'],
  pho: ['en:Phở'], hangma: ['en:Hàng Mã Street', 'en:Hanoi Old Quarter'], dongho: ['en:Đông Hồ painting'], quanhohouse: ['en:Quan họ'], miquang: ['en:Mì Quảng'],
  comtam: ['en:Cơm tấm'], aodai: ['en:Áo dài'], surf: ['en:Surf lifesaving'], terrace: ['en:Terraced house', 'en:Paddington, New South Wales'], laneway: ['en:Laneways of Melbourne', 'en:Hosier Lane'],
  che: ['en:Chè'], footy: ['en:Australian rules football'], queenslander: ['en:Queenslander (architecture)'], lamington: ['en:Lamington']
};

// which photos fit a home: its speciality (from its name) first, else its kind of house
const SPECIAL: [RegExp, string][] = [[/phở/i, 'pho'], [/hàng mã/i, 'hangma'], [/đông hồ/i, 'dongho'], [/quan họ/i, 'quanhohouse'], [/mì quảng/i, 'miquang'], [/cơm tấm/i, 'comtam'], [/áo dài/i, 'aodai'],
  [/surf/i, 'surf'], [/terrace/i, 'terrace'], [/laneway|café/i, 'laneway'], [/footy/i, 'footy'], [/queenslander/i, 'queenslander'], [/lamington/i, 'lamington'], [/chè/i, 'che']];
export function homeSources(name, kind) { const sp = SPECIAL.find(([re]) => re.test(name || '')); return REAL_KINDS[sp ? sp[1] : kind] || null; }
const cache = {};
export const photoKey = sources => sources[0].toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60);
// photos/index.json: { key: [{ url: 'https://upload.wikimedia.org/…', page, file, caption, credit }] } (key = photoKey
// of the sources); a copy Studio kept has src: 'photos/<key>/1.jpg' instead of url
let LOCAL = null;
// (17 Oct AEDT) the photo sites the game may show from (the same list is in sw.js, which keeps seen photos)
export const PHOTO_HOST = /^https:\/\/((upload|thumb)\.wikimedia\.org|live\.staticflickr\.com|farm\d+\.staticflickr\.com)\//;
const saved = p => typeof p.src === 'string' && /^photos\/[\w\p{L}\p{N}./-]+\.(jpe?g|png|webp)$/iu.test(p.src) && !p.src.includes('..');
const ours = p => p && ((typeof p.url === 'string' && PHOTO_HOST.test(p.url) && !/\s/.test(p.url)) || saved(p));
const photoAddress = p => p.url && PHOTO_HOST.test(p.url) ? p.url : p.src;
const localPhotos = async key => { if (!LOCAL) LOCAL = fetch('photos/index.json').then(r => r.ok ? r.json() : {}).catch(() => ({})); const L = await LOCAL; return (Array.isArray(L[key]) ? L[key] : []).filter(ours); };
async function photosFor(sources) {
  const key = photoKey(sources); if (cache[key]) return cache[key];
  const photos = await localPhotos(key);
  if (!photos.length) return null;
  return (cache[key] = { photos });
}
// (round R) an old list address that an older version kept on this device is cleared once
try { if (window.caches) caches.open('sv-photos').then(c => c.keys().then(ks => ks.forEach(r => { if (new URL(r.url).pathname.startsWith('/photos-list/')) c.delete(r); }))).catch(() => { }); } catch (e) { }

// the photo viewer: big, slowly panning photos; swipe or ◀ ▶; the 360° button when there is a real place to stand in
export function openPhotos(name, sources, { icon = '📷', id = null, onClose }: { icon?: string, id?: string | null, onClose?: () => void } = {}) {
  const real = id && REAL[id];
  const m = el('div', 'realview', `<div class="rv-stage"><div class="rv-load">${pic(icon)}<p>${T('Finding real photos…', 'Đang tìm ảnh thật…')}</p></div></div>
    <div class="rv-top"><b>${esc(name)}</b><button class="rv-x" aria-label="${T('Close', 'Đóng')}">✕</button></div>
    <button class="rv-prev" aria-label="${T('Back', 'Trước')}">◀</button><button class="rv-next" aria-label="${T('Next', 'Tiếp')}">▶</button>
    <div class="rv-bot"><div class="rv-dots"></div><div class="rv-cap"></div>${real ? `<button class="rv-360">🚶 ${T('Step inside (360°)', 'Bước vào xem 360°')}</button>` : ''}</div>`);
  document.body.appendChild(m); SFX.tap();
  const stage = m.querySelector('.rv-stage'), dots = m.querySelector('.rv-dots'), cap = m.querySelector('.rv-cap');
  let list = [], k = 0, auto: ReturnType<typeof setInterval> | number = 0, closed = false;
  const close = () => { if (closed) return; closed = true; clearInterval(auto); m.classList.add('out'); setTimeout(() => m.remove(), 250); onClose && onClose(); };
  m.querySelector('.rv-x').onclick = () => { SFX.tap(); close(); };
  if (real) m.querySelector('.rv-360').onclick = () => { SFX.tap(); openStreetView(id); };
  // (owner, 17 Oct AEDT) no internet and no photo of this place seen before: say the photos need the internet
  const noNet = () => {
    clearInterval(auto); m.classList.add('none'); dots.innerHTML = ''; cap.innerHTML = ''; stage.querySelectorAll('.rv-img').forEach(o => o.remove());
    stage.insertAdjacentHTML('beforeend', `<div class="rv-load rv-nonet">${pic('🌐')}<p>${T('Real photos need the internet. Try again when you are online!', 'Cần có internet để xem ảnh thật. Khi có mạng, thử lại nhé!')}</p></div>`);
    say('Real photos need the internet. Try again when you are online!', 'Cần có internet để xem ảnh thật. Khi có mạng, thử lại nhé!');
  };
  const show = i => {
    if (!list.length) return; k = (i + list.length) % list.length; const p = list[k];
    const im = el('img', 'rv-img'); im.alt = name; im.referrerPolicy = 'no-referrer'; im.style.setProperty('--px', (k % 2 ? 1 : -1) * 3 + '%');
    im.src = photoAddress(p);
    im.onload = () => { stage.querySelectorAll('.rv-img.on').forEach(o => { o.classList.remove('on'); setTimeout(() => o.remove(), 900); }); im.classList.add('on'); };
    // a photo that cannot come (no internet, or gone from its site) is left out; none left: the internet note
    im.onerror = () => { im.remove(); if (closed || !list.includes(p)) return; list = list.filter(x => x !== p); if (!list.length) return noNet(); m.classList.toggle('one', list.length < 2); show(k); };
    stage.appendChild(im);
    dots.innerHTML = list.map((_, j) => `<i class="${j === k ? 'on' : ''}"></i>`).join('');
    // (round R privacy, 9 Oct) the credit is shown as words, not a link out of the game
    cap.innerHTML = `<span>📷 ${esc((p.caption || '').slice(0, 120))}</span>${p.credit ? `<small class="rv-credit">${T('Photo', 'Ảnh')}: ${esc(p.credit)}</small>` : ''}`;
  };
  const step = d => { SFX.tap(); clearInterval(auto); show(k + d); auto = setInterval(() => show(k + 1), 7000); };
  m.querySelector('.rv-prev').onclick = () => step(-1); m.querySelector('.rv-next').onclick = () => step(1);
  let sx = null; stage.addEventListener('pointerdown', e => { sx = e.clientX; }); stage.addEventListener('pointerup', e => { if (sx != null && Math.abs(e.clientX - sx) > 40) step((e.clientX - sx) * flip(stage) < 0 ? 1 : -1); sx = null; });
  photosFor(sources).then(r => {
    if (closed) return;
    if (!r) {
      stage.querySelector('.rv-load').innerHTML = `${pic(icon)}<p>${T('The photos of this place are still on their way. They will be here next time!', 'Ảnh thật của nơi này đang trên đường tới. Lần sau sẽ có nhé!')}</p>`;
      say('The photos of this place are still on their way. They will be here next time!', 'Ảnh thật của nơi này đang trên đường tới. Lần sau sẽ có nhé!'); m.classList.add('none'); return;
    }
    list = r.photos; stage.querySelector('.rv-load').remove(); m.classList.toggle('one', list.length < 2);
    show(0); auto = setInterval(() => show(k + 1), 7000);
    say(`Here is the real ${name}!`, `Đây là ${name} thật nè!`);
  });
  return m;
}
// The real place, inside the game (owner, round H: "show it in game instead of jumping to the web or an app"): a window
// with the real spot from above (satellite map) and from the street (look around), both embedded; ✕ goes back to the
// valley. Without the internet it says so instead.
// (round R privacy, 9 Oct, owner: "real-world maps open Google only after a grown-up says yes") a grown-up presses and
// holds first, as for Grown-ups; the window says that it opens Google.
// (Analytics & Infra, 10 Oct, owner: "if parents enable internet use then in games should not be asking again") once a
// grown-up has turned on Use the internet (Grown-ups, behind press and hold) the map opens straight away
export function openStreetView(id) {
  const r = REAL[id]; if (!r) return;
  if (navigator.onLine === false || settings.online) return showPlace(id);
  const m = modal('rvmap rvgate', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button>
    <h2>🗺️ ${T('The real place', 'Nơi thật')}</h2>
    <p class="note">${T('This opens Google Maps and Street View inside the game. Google sees that this device is looking at the place. A grown-up says yes first.', 'Mục này mở Google Maps và Street View ngay trong trò chơi. Google sẽ biết máy này đang xem nơi đó. Người lớn đồng ý trước nhé.')}</p>
    <button class="grown rv-ok"><span class="ring"></span>🔒 <b>${T('Grown-ups: open Google', 'Người lớn: mở Google')}</b> <small>${T('press and hold', 'nhấn giữ')}</small></button>
    <div class="actions"><button class="btn" id="rvBack">${T('Back', 'Quay lại')}</button></div>`);
  const close = () => { SFX.tap(); m.close(); };
  m.querySelector('.x').onclick = close; m.querySelector('#rvBack').onclick = close;
  holdButton(m.querySelector('.rv-ok'), () => { SFX.chime && SFX.chime(); m.close(); showPlace(id); });
  return m;
}
function showPlace(id) {
  const r = REAL[id]; if (!r) return;
  const [, lat, lng] = r, hl = T('en', 'vi');
  const src = { map: `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=18&hl=${hl}&output=embed`, street: `https://maps.google.com/maps?layer=c&cbll=${lat},${lng}&cbp=12,0,0,0,0&hl=${hl}&output=svembed` };
  const m = el('div', 'modal rvmap', `<div class="card"><button class="x" aria-label="${T('Close', 'Đóng')}">✕</button>
    <div class="rvm-tabs"><button class="btn primary" data-v="map">🗺️ ${T('From above', 'Nhìn từ trên cao')}</button><button class="btn" data-v="street">👀 ${T('Look around', 'Nhìn xung quanh')}</button></div>
    <div class="rvm-frame">${navigator.onLine === false ? `<p class="note center">${T('The real place needs the internet. Try again when you are online!', 'Xem nơi thật cần có mạng. Khi có mạng con thử lại nhé!')}</p>` : `<iframe title="${T('The real place', 'Nơi thật')}" src="${src.map}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`}</div></div>`);
  document.body.appendChild(m);
  const close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 200); };
  m.querySelector('.x').onclick = () => { SFX.tap(); close(); };
  m.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { SFX.tap(); m.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('primary', x === b)); const f = m.querySelector('iframe'); if (f) f.src = src[b.dataset.v]; if (b.dataset.v === 'street') say('Look around! Drag to turn, and tap the arrows to walk.', 'Nhìn xung quanh nhé! Kéo để xoay, chạm mũi tên để đi.'); });
  say('Here is the real place!', 'Đây là nơi thật nè!');
  return m;
}
