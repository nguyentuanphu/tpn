// The Passport: one page for each country. Visit the village, collect two postcards, play one of its
// games, harvest one of its crops and learn about one of its traditional games to fill the five
// stamps. A full page gives a hat from that country.
import { T } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { saveProfiles } from './state.js';
import { LANDMARKS } from './regions.js';
import { CULTURE_CROPS } from './heritage.js';
import { HAT_NAME, HAT_ICON } from './data.js';
import { el, esc } from './util.js';
import { FESTCAL } from './content/festcal.js';

const OLD_CC = { opera: 'au', harbour: 'au', uluru: 'au', banana: 'au', bondi: 'au', lighthouse: 'vn', turtle: 'vn', onepillar: 'vn', chuacau: 'vn', benthanh: 'vn' };
export const COUNTRIES = [
  { cc: 'vn', flag: '🇻🇳', name: () => T('Vietnam', 'Việt Nam'), color: '#e8433a', regions: ['village', 'market'], place: () => T('Lotus Village', 'Làng Sen'),
    games: ['dragon', 'dacau', 'datnieu', 'kite', 'chichi', 'oanquan', 'hopscotch', 'caro', 'tug', 'chuyen', 'skipping', 'words'], hat: 'khanran' },
  { cc: 'au', flag: '🇦🇺', name: () => T('Australia', 'Nước Úc'), color: '#2f6ac0', regions: ['aussie', 'town'], place: () => T('Aussie Corner', 'Góc Nước Úc'),
    games: ['mrwolf', 'snap', 'cricket', 'parcel', 'marbles', 'sackrace'], hat: 'akubra' },
  { cc: 'cn', flag: '🇨🇳', name: () => T('China', 'Trung Quốc'), color: '#c62828', regions: ['china'], place: () => T('China Town', 'Làng Trung Hoa'),
    games: ['tangram', 'firstwords'], hat: 'silkcap' },
  { cc: 'in', flag: '🇮🇳', name: () => T('India', 'Ấn Độ'), color: '#ff9f1a', regions: ['india'], place: () => T('India Village', 'Làng Ấn Độ'),
    games: ['snakes', 'rangoli', 'firstwords'], hat: 'pagri' }
];
const ccOf = l => l.cc || OLD_CC[l.id];
const played = (p, id) => !!((p.levels || {})[id] || (p.wins || {})[id] || (p.quests || {})['played_' + id]);

// the five stamps of a page, each { key, icon, done, label, hint }
export function stamps(p, C) {
  const pcs = p.postcards || {}, mine = LANDMARKS.filter(l => ccOf(l) === C.cc), got = mine.filter(l => pcs[l.id]).length;
  const crops = (CULTURE_CROPS[C.cc] || []).map(c => c[0]), found = p.found || {};
  return [
    { key: 'visit', icon: '🏠', done: C.regions.some(r => (p.visited || {})[r]), label: () => T('Visit', 'Ghé thăm'), hint: () => T(`Go to ${C.place()}.`, `Đến ${C.place()} nhé.`) },
    { key: 'post', icon: '📮', done: got >= 2, label: () => T(`Postcards ${Math.min(got, 2)}/2`, `Bưu thiếp ${Math.min(got, 2)}/2`), hint: () => T(`Find two famous places from ${C.name()} and tap their ℹ️ signs.`, `Tìm hai nơi nổi tiếng của ${C.name()} và chạm vào biển ℹ️.`) },
    { key: 'game', icon: '🎲', done: C.games.some(g => played(p, g)), label: () => T('Play a game', 'Chơi một trò'), hint: () => T(`Play a game from ${C.name()} with the friends in ${C.place()}.`, `Chơi một trò của ${C.name()} với các bạn ở ${C.place()}.`) },
    { key: 'crop', icon: '🧺', done: crops.some(k => found[k]), label: () => T('Harvest', 'Thu hoạch'), hint: () => T(`Pick a fruit or vegetable that grows near ${C.place()}.`, `Hái một loại quả hoặc rau mọc gần ${C.place()}.`) },
    { key: 'culture', icon: 'ℹ️', done: Object.values(p.learned || {}).includes(C.cc), label: () => T('Learn', 'Tìm hiểu'), hint: () => T(`Watch the friends playing a traditional game and tap their ℹ️.`, `Xem các bạn chơi trò truyền thống và chạm vào ℹ️.`) }
  ];
}

export function createPassport(G) {
  // check every couple of seconds for new stamps and full pages
  let t = 0;
  G.world.updaters.push(dt => {
    if ((t -= dt) > 0 || G.paused) return; t = 2;
    G.heroes.forEach(h => {
      const p = h.profile; p.stamps = p.stamps || {}; p.owned = p.owned || { hats: ['none'] };
      COUNTRIES.forEach(C => {
        const st = stamps(p, C); let fresh = false;
        st.forEach(s => { const k = C.cc + '_' + s.key; if (s.done && !p.stamps[k]) { p.stamps[k] = true; fresh = true; } });
        if (fresh) { saveProfiles(); SFX.chime(); G.toast(h, '🛂 ' + T(`New passport stamp for ${C.name()}!`, `Hộ chiếu có dấu mới: ${C.name()}!`)); }
        if (st.every(s => s.done) && !p.stamps[C.cc + '_full']) {
          p.stamps[C.cc + '_full'] = true; if (!p.owned.hats.includes(C.hat)) p.owned.hats.push(C.hat); saveProfiles();
          G.celebrate && G.celebrate(h);
          G.reward(HAT_ICON[C.hat], T(`${C.flag} ${C.name()} page complete!`, `${C.flag} Xong trang ${C.name()}!`), T(`You earned: ${HAT_NAME[C.hat]()}. Wear it from your Backpack!`, `Con nhận được: ${HAT_NAME[C.hat]()}. Đội thử trong Ba lô nhé!`));
          say(`Your ${C.name()} page is full! Here is a ${HAT_NAME[C.hat]()} for you.`, `Trang ${C.name()} đã đầy dấu! Tặng con ${HAT_NAME[C.hat]()}.`);
        }
      });
    });
  });

  // the Passport tab in the Sparkle Pad
  G.drawPassport = (body, hero) => {
    const p = hero.profile;
    body.innerHTML = `<p class="note center">${T('Fill each page with 5 stamps to win a hat from that country!', 'Đóng đủ 5 dấu mỗi trang để nhận một chiếc mũ của nước đó!')}</p><div class="passport"></div>`;
    const box = body.querySelector('.passport');
    COUNTRIES.forEach(C => {
      const st = stamps(p, C), n = st.filter(s => s.done).length, full = n === st.length;
      const page = el('div', 'ppage' + (full ? ' full' : ''), `<div class="phead" style="--c:${C.color}"><span class="pflag">${C.flag}</span><b>${esc(C.name())}</b><small>${n}/5</small></div>
        <div class="pstamps">${st.map((s, k) => `<button class="pst ${s.done ? 'on' : ''}" data-k="${k}" style="--r:${(k * 37 % 21) - 10}deg;--c:${C.color}"><span>${s.done ? s.icon : '❔'}</span><small>${esc(s.label())}</small></button>`).join('')}</div>
        <div class="prew">${full ? `✅ ${HAT_ICON[C.hat]} ${esc(HAT_NAME[C.hat]())}` : `🎁 ${HAT_ICON[C.hat]} ${esc(HAT_NAME[C.hat]())}`}</div>`);
      page.querySelectorAll('.pst').forEach(b => b.onclick = () => { const s = st[+b.dataset.k]; SFX.tap(); const line = s.done ? T('Stamped! Well done.', 'Đã đóng dấu! Giỏi lắm.') : s.hint(); say(line, line); G.toast(hero, line); });
      box.appendChild(page);
    });
    // (owner, 13 Oct) a badge for each festival hunt finished (js/festhunt.js): all five things found
    const fb = p.festBadges || {}, won = FESTCAL.filter(F => fb[F.id]).length, fp = el('div', 'ppage pfest' + (won === FESTCAL.length ? ' full' : ''), `<div class="phead" style="--c:#e8433a"><span class="pflag">🏮</span><b>${T('Festival badges', 'Huy hiệu lễ hội')}</b><small>${won}/${FESTCAL.length}</small></div>
      <div class="pstamps">${FESTCAL.map(F => `<button class="pst ${fb[F.id] ? 'on' : ''}" data-f="${F.id}" style="--r:0deg;--c:#e8433a"><span>${fb[F.id] ? F.icon : '❔'}</span><small>${esc(T(F.en, F.vi))}</small></button>`).join('')}</div>`);
    fp.querySelectorAll('.pst').forEach(b => b.onclick = () => { SFX.tap(); const ok = !!fb[b.dataset.f], line = ok ? ['Stamped! Well done.', 'Đã đóng dấu! Giỏi lắm.'] : ['Find the five hidden things at a festival to win its badge.', 'Tìm đủ năm món đồ giấu ở một lễ hội để nhận huy hiệu của lễ hội đó.']; say(line[0], line[1]); G.toast(hero, T(line[0], line[1])); });
    box.appendChild(fp);
  };
}
