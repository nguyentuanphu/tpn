// The Simple screen (owner, round I: "a simplified screen for under 5, with an option to switch to the normal screen;
// big kids can switch to it too"). Instead of walking the 3D valley, a child sees a winding path of big pictures in a
// little storybook landscape: tap one and it starts (a game, a story), or the explorer flies there (a place).
//   Round J (owner's brief "an adventure world containing places children want to visit"):
//   · (Round U, owner 11 Oct: "a simple screen with separate sections for games, stories and places"; this replaces
//     bug #30's "one long road per tab") each tab first shows its categories as big picture cards (Animals, Music,
//     Numbers…; stories by country; places by region, China and India always last); a tap opens that category's own
//     short road: its heading stop (picture and name, spoken) and its stops; the big ⬅ at the top goes back to the cards
//   · a game or story opens straight over this screen, which stays behind it (round M: the valley no longer flashes
//     up first), and the path is there again when it ends
//   · a tap answers at once: the picture grows and bounces, little stars burst, the voice says its name, then it opens;
//     a second tap while that happens is ignored, so a game never starts twice
//   · 🔎 Discover: every area as a big picture (and, for big kids, a search box)
//   · Ông Cú sits by the path, points at the next one to try and cheers when a new star is won; he never pops up
//   · big kids (5+) also see a ✨ on games that are new since they last looked, and choose
//     with two taps (the first one shows it, the second one plays), so a slip of the finger never starts a game
//   Bottom bar (v1.08): Fun learning · Play · 📖 Stories · 🗺️ Places · 🔎 Discover. Top row: name, Back, 🌳 Valley (the 3D
//   world), Sound, Home, Grown-ups (press and hold).
// Which screen a child starts on is kept per child (profile.screen: 'simple' | 'valley'); until a child has chosen,
// under-5s start on the Simple screen and big kids in the valley. Two players on one device always use the valley.
// When a game or story started here ends, the Simple screen comes back by itself.
import { T, both } from './i18n.js';
import { el, esc } from './util.js';
import { SFX } from './audio.js';
import { say } from './voice.js';
// (v1.08d valley, PERF-001) Lumi's welcome and news (js/lumi.ts) load the first time the Simple screen opens, not in the first download
let L: typeof import('./lumi.js') | null = null;
const lumi = () => L ? Promise.resolve(L) : import('./lumi.js').then(m => (L = m));
/** (v1.08d valley) loads Lumi's file ahead (js/main.ts, after the start), so the Simple screen greets at once */
export const warmLumi = () => lumi();
import { pic, moreArt, moreArtReady } from './art.js';
import { saveProfiles, reduceMotion } from './state.js';
import { GAMES, gameOpen } from './games/frame.js';
import { holdButton, openGrownups, openFestivals } from './ui.js';
import { markEnglish } from './englishmode.js'; // (v1.08b games) a game from the English corner plays in English
import { AREAS, TALE_AREAS, PLACE_AREAS, gamesIn, gameInfo, withSitePlaces, LEARN_CORNERS } from './content/activities.js';
import { featureOn, onLive } from './custom.js';
import { isOpen, isHeld, progressOf, secondSetOf } from './content/unlocks.js';

// a star drawn on the picture card (round I, owner: "stars without a strip, placed on the icon"): gold when earned
const STAR = 'M12 1.8l3.1 6.4 7 1-5.1 4.9 1.2 7-6.2-3.3-6.2 3.3 1.2-7L1.9 9.2l7-1z';
// (Studio switch simpleStart: when off, a child who has not chosen starts in the valley)
export const wantsSimple = p => (p.screen ? p.screen === 'simple' : p.age !== 'big' && featureOn('simpleStart', true));
// stars on the path: played once, twice, four times
export const starsOf = (p, id) => { const w = (p.wins || {})[id] || 0; return w >= 4 ? 3 : w >= 2 ? 2 : w >= 1 ? 1 : 0; };
const firstPic = s => (String(s).match(/\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}️?)*/u) || ['📖'])[0];
// (v1.08 simple, owner 3 Nov 2026 AEDT: "Học vui" and "Vui chơi") the games are in two big buttons by kind, built from
// the areas so a game added to an area lands in the right one: Fun learning holds the Learning areas of Play (numbers,
// shapes, words, reading, me, money) and every Học vui corner (hv_*); Play holds every other area (folk games, animals
// and music, drawing, places, thinking). 'games' is both together: not in the bar, kept for Discover's memory and the checks
// (v1.08b games) the corners are the Play hub's Học vui corners, in the same order (js/content/activities.ts LEARN_CORNERS)
export const learnArea = (key: string) => LEARN_CORNERS.includes(key) || key.startsWith('hv_');
const GAME_TABS = { learn: (k: string) => learnArea(k), fun: (k: string) => !learnArea(k), games: () => true };
export const TABS = [
  { key: 'learn', icon: 'hv:tab', label: () => T('Fun learning', 'Học vui'), say: ['Tap a picture to play!', 'Chạm vào một hình để chơi nhé!'] },
  { key: 'fun', icon: '🎮', label: () => T('Play', 'Vui chơi'), say: ['Tap a picture to play!', 'Chạm vào một hình để chơi nhé!'] },
  { key: 'tales', icon: '📖', label: () => T('Stories', 'Truyện'), say: ['Tap a picture to hear a story!', 'Chạm vào một hình để nghe kể chuyện nhé!'] },
  { key: 'places', icon: '🗺️', label: () => T('Places', 'Nơi chốn'), say: ['Where shall we fly to?', 'Mình bay đến đâu nào?'] }
];
// for search: no accents, no case ("dap nieu" finds "Đập Niêu")
const plain = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

// the little storybook landscape behind the path: hills, trees, a pond, a sun and slow clouds (drawn once; it only moves
// gently and stands still in Calm mode, with the device's Reduce motion, and whenever the screen is hidden)
const SCENE = `<svg class="sp-land" viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <circle cx="62" cy="70" r="34" fill="#fff3b0"/><circle cx="62" cy="70" r="24" fill="#ffe27a"/>
  <g class="sp-cloud c1"><ellipse cx="250" cy="92" rx="34" ry="14" fill="#fff"/><ellipse cx="272" cy="84" rx="22" ry="14" fill="#fff"/><ellipse cx="232" cy="86" rx="16" ry="11" fill="#fff"/></g>
  <g class="sp-cloud c2"><ellipse cx="120" cy="170" rx="28" ry="11" fill="#fff" opacity=".85"/><ellipse cx="138" cy="163" rx="17" ry="11" fill="#fff" opacity=".85"/></g>
  <path d="M0 520 C80 470 150 480 220 510 S340 470 400 490 V800 H0Z" fill="#a9dc90"/>
  <path d="M0 610 C70 580 140 600 210 590 S330 560 400 585 V800 H0Z" fill="#93cf7c"/>
  <path d="M0 700 C90 680 170 700 250 690 S350 670 400 680 V800 H0Z" fill="#84c46f"/>
  <g class="sp-tree"><rect x="22" y="470" width="8" height="34" rx="3" fill="#a5734a"/><circle cx="26" cy="458" r="22" fill="#6fbf5c"/><circle cx="14" cy="470" r="13" fill="#7ccb68"/></g>
  <g class="sp-tree t2"><rect x="364" y="440" width="8" height="40" rx="3" fill="#a5734a"/><circle cx="368" cy="428" r="24" fill="#62b351"/><circle cx="382" cy="442" r="14" fill="#74c262"/></g>
  <ellipse cx="330" cy="742" rx="52" ry="16" fill="#8fd3f0"/><ellipse class="sp-ripple" cx="330" cy="742" rx="26" ry="6" fill="none" stroke="#e6f7ff" stroke-width="2"/>
  <g fill="#ff9fc4"><circle cx="70" cy="640" r="4"/><circle cx="96" cy="660" r="4"/><circle cx="300" cy="630" r="4"/></g>
  <g fill="#fff27a"><circle cx="180" cy="720" r="4"/><circle cx="214" cy="742" r="4"/></g>
</svg><span class="sp-fly">${pic('🦋')}</span><i class="sp-twinkle"></i>`;

export function createSimple(G) {
  let m = null, tab = 'learn', cat = null, back = false, busy = false, sel = null, finding = false, lay = null; // cat: the open category (null: the cards); lay: where draw() put the stops
  let launched = 0, opened = false, starsBefore = 0; // a game or story started from here (when), and whether it is open yet
  const lastStars = {};
  let catalogueDirty = false, fruitState = '';
  // Studio can answer after the first screen; tester acceptance can also change locally later.
  // Defer a refresh while an activity is open so its return position remains the same.
  const fruitAvailability = () => ['fruitparade', 'sparkleorchard', 'sparklefruitbar'].map(id => `${id}:${gameInfo(id).hidden}`).join('|');
  onLive(() => { catalogueDirty = true; });
  const hero = () => G.heroes[0];
  const solo = () => G.heroes.length === 1;
  const little = () => hero().profile.age !== 'big';
  // (owner, 29 Oct 2026 AEDT: "those lock pads should tell the kids what to do") an area or shelf with games or stories
  // still locked ends with a lock stop: how many are left, the stars of progress (0 to 3), and what to do when tapped
  function lockStop(type, key, n, area) {
    if (!n) return [];
    const done = progressOf(hero().profile, type, area).done, game = type === 'game';
    return [{ kind: 'lock', key: type + '-' + key, icon: '\u{1F512}', name: game ? T(`${n} more to unlock`, `Còn ${n} trò để mở`) : T(`${n} more to unlock`, `Còn ${n} truyện để mở`),
      voice: game ? ['Finish the games above 3 times each to unlock these.', 'Chơi xong mỗi trò ở trên 3 lần để mở những trò này nhé.'] : ['Finish each story in this shelf 3 times to unlock more.', '\u0110\u1ecdc xong m\u1ed7i truy\u1ec7n trong k\u1ec7 n\u00e0y 3 l\u1ea7n \u0111\u1ec3 m\u1edf th\u00eam nh\u00e9.'],
      stars: 0, max: 0, prog: done, type, area }];
  }
  // (v1.08 simple, owner 3 Nov 2026 AEDT: "every Play game shows") a locked game is a stop of its own: its picture under a
  // padlock, its name and what to do; a tap says what to do and opens the guide of its area
  const lockedGame = (id: string, area: string) => ({ kind: 'lock', key: id, icon: GAMES[id].icon, locked: true, name: GAMES[id].name(), hint: T('Win 3 times to open', 'Thắng 3 lần để mở'),
    voice: ['Finish the games above 3 times each to unlock these.', 'Chơi xong mỗi trò ở trên 3 lần để mở những trò này nhé.'], stars: 0, max: 0, prog: progressOf(hero().profile, 'game', area).done, type: 'game', area });
  // (owner, 1 Nov 2026 AEDT: "the coming soon game pad doesn't show on the Simple screen") an area with new games still
  // held back in Studio ends with a Coming soon stop, as in Play; tapping it (or a lock stop) opens the guide below
  function soonStop(area) {
    const held = secondSetOf('game', area).filter(id => GAMES[id] && isHeld(id, 'game'));
    if (!held.length) return [];
    return [{ kind: 'lock', key: 'soon-' + area, icon: '\u{1F51C}', name: T(`${held.length} new games coming`, `Sắp có ${held.length} trò mới`),
      voice: ['Win each game here 3 times to open the new games!', 'Thắng mỗi trò ở đây 3 lần để mở trò mới nhé!'],
      stars: 0, max: 0, prog: progressOf(hero().profile, 'game', area).done, type: 'game', area, soon: held }];
  }
  // (owner, 1 Nov 2026 AEDT: "it should tell what's needed to access these additional games") the guide of a lock or
  // Coming soon stop: the games on their way, then each game to win (or story to read) 3 times with the stars so far
  function guide(s) {
    const prog = progressOf(hero().profile, s.type, s.area), tale = s.type === 'tale';
    const nameOf = id => tale ? ((G.TALES || []).find(x => x.id === id)?.title() || id) : (GAMES[id]?.name() || id);
    const iconOf = id => tale ? firstPic(((G.TALES || []).find(x => x.id === id)?.pages || [['📖']])[0][0]) : (GAMES[id]?.icon || '\u{1F3AE}');
    const ready = prog.perGame.filter(g => g.n >= 3).length, total = prog.perGame.length;
    m.querySelector('.sp-guide')?.remove();
    const g = el('div', 'sp-guide', `<div class="sp-gcard" role="dialog" aria-label="${esc(s.name)}">
      <button class="sp-gx" aria-label="${esc(T('Close', 'Đóng'))}">✕</button>
      <h3><span class="sp-gpic">${pic(s.icon)}</span>${esc(s.name)}</h3>
      ${s.soon ? `<p>${T('Coming soon:', 'Sắp có:')}</p><div class="sp-gsoon">${s.soon.map(id => `<span><span class="sp-gpic">${pic(GAMES[id].icon)}</span>${esc(GAMES[id].name())}</span>`).join('')}</div>` : ''}
      ${total ? `<p>${tale ? T('Read each of these stories 3 times to open more:', 'Đọc mỗi truyện này 3 lần để mở thêm nhé:') : T('Win each of these games 3 times to open the new games:', 'Thắng mỗi trò này 3 lần để mở trò mới nhé:')}</p>
        <div class="sp-glist">${prog.perGame.map(x => `<div class="sp-grow${x.n >= 3 ? ' done' : ''}"><span class="sp-gpic">${pic(iconOf(x.id))}</span><b>${esc(nameOf(x.id))}</b><span class="sp-gstars">${[0, 1, 2].map(k => pic(k < x.n ? '\u2B50' : '\u2606')).join('')}</span></div>`).join('')}</div>
        <p class="sp-gcount">${ready === total ? T('All done! The new games are on their way.', 'Xong hết rồi! Trò mới đang trên đường đến.') : T(`${ready} of ${total} done`, `Xong ${ready} trên ${total}`)}</p>`
      : `<p>${T('They are on their way!', 'Sắp đến rồi!')}</p>`}
    </div>`);
    const close = () => { SFX.tap(); g.remove(); };
    g.addEventListener('click', e => { if (e.target === g) close(); });
    g.querySelector('.sp-gx').addEventListener('click', close);
    m.appendChild(g);
  }
  // every stop of one tab, by area (from the one activity list)
  function areasOf(t) {
    const p = hero().profile, lt = little(); // (owner, 1 Nov 2026 AEDT) every switched-on game shows, as in Play; under-5s see a 5+ tag on the games for 5 and up
    if (t === 'tales') {
      const tales = G.TALES || [], known = TALE_AREAS.filter(a => a.key !== '💛').map(a => a.key);
      return TALE_AREAS.map(a => ({ area: a, items: tales.filter(x => a.key === '💛' ? !known.includes(x.flag) : x.flag === a.key)
        .filter(x => isOpen(p, x.id, 'tale', a.key === '🌍' ? 'world' : a.key))
        .map(x => ({ kind: 'tale', key: x.id, icon: firstPic(x.pages[0][0]), badge: x.flag, name: x.title(), voice: both(x.title), stars: (p.tales || {})[x.id] ? 1 : 0, max: 1 }))
        .concat(lockStop('tale', a.key, tales.filter(x => (a.key === '💛' ? !known.includes(x.flag) : x.flag === a.key) && !isOpen(p, x.id, 'tale', a.key === '🌍' ? 'world' : a.key)).length, a.key === '🌍' ? 'world' : a.key)) }));
    }
    // (round R) the festival calendar opens the places tab: festivals happen in places, each in its own ones
    const cal = { kind: 'fest', key: 'cal', icon: '📅', name: T('Festival calendar', 'Lịch lễ hội'), voice: ['Festival calendar', 'Lịch lễ hội'], stars: 0, max: 0 };
    // (bug #30, owner) China and India always come last on the road
    if (t === 'places') withSitePlaces(G.PLACES);
    if (t === 'places') return PLACE_AREAS.map((a, n) => ({ area: a, items: (n === 0 && G.festivals ? [cal] : []).concat((G.PLACES || []).map((pl, k) => ({ pl, k })).filter(x => x.pl.g === a.key)
      .map(({ pl, k }) => ({ kind: 'place', key: String(k), icon: pl.icon, name: pl.name(), voice: both(pl.name), stars: 0, max: 0 }))) }))
      .sort((x, y) => Number(x.area.key === 'asia') - Number(y.area.key === 'asia'));
    // (round N) the Music group starts with 🎵 Songs: lullabies, village tunes and festival songs to listen to
    const songs = { kind: 'songs', key: 'songs', icon: '🎵', name: T('Songs', 'Bài hát'), voice: ['Songs', 'Bài hát'], stars: 0, max: 0 };
    // (v1.08b games) every game in one corner only: no link stops
    const stop = g => ({ quest: !!(G.learnQuest && G.learnQuest.isTodayStep(p, g.id)), kind: 'game', key: g.id, icon: GAMES[g.id].icon, name: GAMES[g.id].name(), voice: both(GAMES[g.id].name), stars: starsOf(p, g.id), max: 3, level: g.level, plus: lt && g.ageMin >= 5 });
    const want = GAME_TABS[t] || GAME_TABS.games;
    const order = a => t === 'learn' && LEARN_CORNERS.includes(a.key) ? LEARN_CORNERS.indexOf(a.key) : 99;
    return AREAS.filter(a => want(a.key)).sort((x, y) => order(x) - order(y)).map(a => ({ area: a, items: (a.key === 'music' && G.openSongs ? [songs] : []).concat(gamesIn(GAMES, a.key, false).filter(g => isOpen(p, g.id, 'game', a.key)).map(stop)).concat(gamesIn(GAMES, a.key, false).filter(g => !isOpen(p, g.id, 'game', a.key)).map(g => lockedGame(g.id, a.key))).concat(soonStop(a.key)) }));
  }
  const tabOf = t => TABS.find(y => y.key === t) || TABS[0]; // ('games', both game buttons together, says what they say)
  const groupsOf = t => areasOf(t).filter(a => a.items.length);
  // the road of one category: its heading stop (its picture and name) and its stops; `cat` on every stop says which
  // category it is in. With no category open (c null) the road is empty: the tab shows its category cards instead
  function viewsOf(t, c = cat) {
    const g = groupsOf(t).find(x => x.area.key === c);
    const items = g ? [{ kind: 'head', key: g.area.key, cat: g.area.key, icon: g.area.icon, name: g.area.name(), voice: both(g.area.name), stars: 0, max: 0 }].concat(g.items.map(s => ({ ...s, cat: g.area.key }))) : [];
    return [{ area: g ? g.area : AREAS[0], items, i: 0, of: 1 }];
  }
  // a category card: its picture, its name, and (games) the stars won in it out of all it has
  const cardsHTML = t => groupsOf(t).map(({ area, items }) => { const got = items.reduce((a, s) => a + (s.stars || 0), 0), all = items.reduce((a, s) => a + (s.max || 0), 0);
    return `<button class="sp-catcard" data-cat="${esc(area.key)}" aria-label="${esc(area.name())}"><span class="sp-pic">${pic(area.icon)}</span><b class="sp-name">${esc(area.name())}</b>${all ? `<span class="sp-count">${pic('⭐')} ${got}/${all}</span>` : ''}</button>`; }).join('');
  const idOf = s => s.kind + ':' + s.key;
  // ✨ new: games, stories and places that came after the child last looked (the first visit only remembers them all)
  function seenSet() {
    const p = hero().profile;
    if (!Array.isArray(p.seenActs)) { p.seenActs = ['games', 'tales', 'places'].flatMap(t => areasOf(t).flatMap(a => a.items.map(idOf))); saveProfiles(); }
    return new Set(p.seenActs);
  }
  function remember(s) { const p = hero().profile, seen = seenSet(); if (!seen.has(idOf(s))) { p.seenActs.push(idOf(s)); saveProfiles(); } }
  const totalStars = () => { const p = hero().profile; return Object.keys(GAMES).reduce((a, id) => a + starsOf(p, id), 0) + Object.keys(p.tales || {}).length; };

  // a phone on its side (owner, round I: "ensure the screen also works in landscape"): the bar becomes a rail on the
  // left and the path winds sideways, scrolling left and right, like a road across the screen
  const wideQ = typeof matchMedia === 'function' ? matchMedia('(orientation: landscape) and (max-height: 560px)') : null;
  const wide = () => !!(wideQ && wideQ.matches);
  // each stop is placed by the middle of its picture; its stars and full name hang below it (names are never cut:
  // the label is as wide as its column allows and the rows move apart to fit the tallest one)
  type Lay = { pts: { x: number, y: number }[], lw: number, w?: number, h?: number, gx?: number };
  function layoutWide(n: number, h: number, tall: number): Lay {
    const gx = 184, mid = Math.max(70, Math.min(h / 2 - 20, h - tall + 30)), pts = [];
    for (let k = 0; k < n; k++) pts.push({ x: 104 + k * gx, y: mid + (k % 2 ? 26 : -26) });
    return { pts, w: 104 + n * gx, lw: gx - 16 };
  }
  // where each stop sits: a snake of rows across the screen, joined by a winding road. (tester's notes, 12 Oct) a
  // category's name is a heading across the road, on its own line, not a stop: the next row starts below it
  function layout(n: number, w: number, tall: number, heads: boolean[] = []): Lay {
    const cols = w < 520 ? 2 : w < 820 ? 3 : w < 1100 ? 4 : 5, gx = w / cols, gy = Math.max(200, tall + 40), pts = [];
    let top = 0, r = 0, c = 0, low = 0;
    for (let k = 0; k < n; k++) {
      if (heads[k]) { if (c) { top += gy; r++; c = 0; } pts.push({ x: w / 2, y: top + 40 }); low = Math.max(low, top + 100); top += 84; continue; }
      const cc = r % 2 ? cols - 1 - c : c; pts.push({ x: gx * (cc + .5), y: top + 76 + (c % 2) * 18 }); low = Math.max(low, top + 76 + tall + 40);
      if (++c === cols) { c = 0; r++; top += gy; }
    }
    return { pts, h: low, lw: Math.min(230, gx - 14), gx };
  }
  const roadWide = pts => pts.map((q, k) => k ? `C${pts[k - 1].x + 70},${pts[k - 1].y} ${q.x - 70},${q.y} ${q.x},${q.y}` : `M${q.x - 120},${q.y} L${q.x},${q.y}`).join(' ');
  const road = pts => pts.map((q, k) => { if (!k) return `M${q.x},${q.y}`; const a = pts[k - 1], my = (a.y + q.y) / 2; return a.y === q.y || Math.abs(a.y - q.y) < 40 ? `C${(a.x + q.x) / 2},${a.y - 30} ${(a.x + q.x) / 2},${q.y + 30} ${q.x},${q.y}` : `C${a.x + (a.x < q.x ? 90 : -90)},${my} ${q.x + (a.x < q.x ? -90 : 90)},${my} ${q.x},${q.y}`; }).join(' ');
  const starsHTML = s => s.max ? `<span class="sp-stars n${s.max}" aria-hidden="true">${[...Array(s.max)].map((_, j) => `<svg class="${j < s.stars ? 'on' : ''}" viewBox="0 0 24 24"><path d="${STAR}"/></svg>`).join('')}</span>` : '';
  let list = [];
  // (owner, 29 Oct 2026 AEDT: "after playing in simple screen, it goes back up to the top") the road is rebuilt after
  // every game, story and resize; iPhone and iPad Safari set a scroll box back to the top when its content is replaced
  // or it was hidden, so the place the child had scrolled to is put back (a tab, Back or a section still scroll on purpose)
  let kept = null;
  function draw(keep: unknown = false) {
    if (!m) return;
    const sc = m.querySelector('.sp-scroll'), at = kept || { top: sc.scrollTop, left: sc.scrollLeft };
    kept = null;
    drawRoad();
    sc.scrollTop = at.top; sc.scrollLeft = at.left;
    if (keep) requestAnimationFrame(() => { if (m && !m.hidden && sc.scrollTop !== at.top) { sc.scrollTop = at.top; sc.scrollLeft = at.left; } });
  }
  function drawRoad() {
    if (!m) return;
    const v = viewsOf(tab)[0], lt = little(), seen = lt ? null : seenSet();
    list = v.items.map(s => ({ ...s, isNew: !!seen && s.kind !== 'head' && s.kind !== 'lock' && !seen.has(idOf(s)) }));
    const path = m.querySelector('.sp-path'), sc = m.querySelector('.sp-scroll'), isWide = wide();
    // Replacing a long path temporarily collapses its scroll range. Remember both axes before
    // clearing it and restore them after layout, including game/story returns and live refreshes.
    const position = { top: sc.scrollTop, left: sc.scrollLeft };
    const restorePosition = () => { sc.scrollTop = position.top; sc.scrollLeft = position.left; };
    fruitState = fruitAvailability(); catalogueDirty = false;
    m.classList.toggle('wide', isWide); m.classList.toggle('big', !lt);
    const bk = m.querySelector('.sp-back'); bk.hidden = !cat; m.classList.toggle('cards', !cat);
    m.querySelectorAll('.sp-tabs [data-tab]').forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    if (!cat) { // (Round V, owner 13 Oct: "one screen and scroll down, each has a title then games in roads with them, like the
      // Khám phá tab") every section of the tab on one page: its title, then its own little road of pictures; Ông Cú by the next one
      lay = null; path.style.height = ''; path.style.width = '';
      list = []; const groups = groupsOf(tab);
      const stopHTML = (s, k) => `<button class="sp-stop${sel === idOf(s) ? ' sel' : ''}${s.locked ? ' locked' : ''}" data-k="${k}" aria-label="${esc(s.name)}">
        <span class="sp-pic">${pic(s.icon)}${s.badge ? `<i class="sp-badge">${s.badge}</i>` : ''}${s.plus ? `<i class="sp-age" aria-label="${esc(T('For 5 and up', 'Cho bé từ 5 tuổi'))}">5+</i>` : ''}${s.isNew ? `<i class="sp-new">${pic('✨')}</i>` : ''}${s.quest ? `<i class="sp-quest" aria-label="${esc(T('Today’s learning step', 'Bước học hôm nay'))}">${pic('lp:mark')}</i>` : ''}${s.locked ? `<i class="sp-lockpad">${pic('\u{1F512}')}</i>` : ''}${starsHTML(s.kind === 'lock' ? { max: 3, stars: s.prog } : s)}</span>
        <b class="sp-name">${esc(s.name)}${s.hint ? `<small class="sp-hint">${esc(s.hint)}</small>` : ''}</b>${!lt && s.kind !== 'lock' ? `<span class="sp-play">${T('Play', 'Chơi')} ▶</span>` : ''}</button>`;
      path.innerHTML = groups.map(({ area, items }) => { const start = list.length; items.forEach(x => list.push({ ...x, cat: area.key, isNew: !!seen && x.kind !== 'lock' && !seen.has(idOf(x)) }));
        const got = items.reduce((a, x) => a + (x.stars || 0), 0), all = items.reduce((a, x) => a + (x.max || 0), 0);
        return `<section class="sp-sec" data-cat="${esc(area.key)}"><h3 class="sp-sectitle" role="heading" aria-level="2"><span class="sp-hpic">${pic(area.icon)}</span><b>${esc(area.name())}</b>${all ? `<span class="sp-count">${pic('⭐')} ${got}/${all}</span>` : ''}</h3>
          <div class="sp-secroad"><svg class="sp-road" aria-hidden="true"><path/><path class="dash"/></svg>${items.map((x, n) => stopHTML(list[start + n], start + n)).join('')}</div></section>`; }).join('') +
        `<button class="sp-owl lumi" aria-label="Lumi">${pic('lumi')}</button>`;
      const W = path.clientWidth || innerWidth, all = [...path.querySelectorAll('.sp-stop')], tall = Math.max(150, ...all.map(b => b.offsetHeight));
      path.classList.toggle('secwide', isWide); if (!isWide) path.style.setProperty('--lw', layout(1, W, tall).lw + 'px');
      if (isWide) { // a phone on its side: the sections side by side, each a title over its own road running sideways
        const H = sc.clientHeight || innerHeight - 20; let total = 0; path.style.setProperty('--lw', layoutWide(1, H, tall).lw + 'px');
        path.querySelectorAll('.sp-sec').forEach(sec => { const r = sec.querySelector('.sp-secroad'), bs = [...r.querySelectorAll('.sp-stop')], th = sec.querySelector('.sp-sectitle').offsetHeight + 8, L = layoutWide(bs.length, H - th, tall);
          bs.forEach((b, k) => { b.style.left = L.pts[k].x + 'px'; b.style.top = L.pts[k].y + 'px'; });
          const svg = r.querySelector('svg'), d = roadWide(L.pts); svg.setAttribute('width', L.w); svg.setAttribute('height', H - th); svg.querySelectorAll('path').forEach(x => x.setAttribute('d', d));
          r.style.height = (H - th) + 'px'; sec.style.width = L.w + 'px'; total += L.w + 16; });
        path.style.width = total + 'px'; path.style.height = H + 'px';
      } else path.querySelectorAll('.sp-secroad').forEach(r => { const bs = [...r.querySelectorAll('.sp-stop')], L = layout(bs.length, W, tall);
        bs.forEach((b, k) => { b.style.left = L.pts[k].x + 'px'; b.style.top = (L.pts[k].y - 20) + 'px'; });
        const svg = r.querySelector('svg'), d = road(L.pts.map(q => ({ x: q.x, y: q.y - 20 }))); svg.setAttribute('width', W); svg.setAttribute('height', L.h); svg.querySelectorAll('path').forEach(x => x.setAttribute('d', d));
        r.style.height = Math.max(0, L.h - 70) + 'px'; });
      // Ông Cú beside the one to try next
      const next = list.findIndex(x => x.max && !x.stars), nb = path.querySelector(`.sp-stop[data-k="${next >= 0 ? next : 0}"]`), owl = path.querySelector('.sp-owl');
      if (nb) { nb.classList.add('next'); const pr = path.getBoundingClientRect(), br = nb.getBoundingClientRect(), x = br.left - pr.left + br.width / 2, y = br.top - pr.top + path.scrollTop; const left = x > W / 2; owl.style.left = x + (left ? -96 : 96) + 'px'; owl.style.top = y + 60 + 'px'; owl.classList.toggle('left', left); }
      owl.onclick = () => { SFX.tap(); owl.classList.remove('cheer'); void owl.offsetWidth; owl.classList.add('cheer'); const x = list[next >= 0 ? next : 0]; if (x) say(x.voice[0], x.voice[1]); else { const t = tabOf(tab); say(t.say[0], t.say[1]); } };
      path.querySelectorAll('button.sp-stop').forEach(b => b.onclick = () => go(list[+b.dataset.k], b));
      restorePosition();
      return;
    }
    const next = list.findIndex(s => s.max && !s.stars), H = sc.clientHeight || innerHeight - 80, W = path.clientWidth || innerWidth;
    const place = tall => isWide ? layoutWide(list.length, H, tall) : layout(list.length, W, tall, list.map(s => s.kind === 'head'));
    let L = place(230);
    path.style.setProperty('--lw', L.lw + 'px');
    path.innerHTML = `<svg class="sp-road" aria-hidden="true"><path/><path class="dash"/></svg>` +
      list.map((s, k) => s.kind === 'head' ? `<div class="sp-stop grp" role="heading" aria-level="2" data-k="${k}" aria-label="${esc(s.name)}"><span class="sp-hpic">${pic(s.icon)}</span><b class="sp-name">${esc(s.name)}</b></div>` : `<button class="sp-stop${k === next ? ' next' : ''}${sel === idOf(s) ? ' sel' : ''}${s.locked ? ' locked' : ''}" data-k="${k}" aria-label="${esc(s.name)}">
        <span class="sp-pic">${pic(s.icon)}${s.badge ? `<i class="sp-badge">${s.badge}</i>` : ''}${s.plus ? `<i class="sp-age" aria-label="${esc(T('For 5 and up', 'Cho bé từ 5 tuổi'))}">5+</i>` : ''}${s.isNew ? `<i class="sp-new">${pic('✨')}</i>` : ''}${s.quest ? `<i class="sp-quest" aria-label="${esc(T('Today’s learning step', 'Bước học hôm nay'))}">${pic('lp:mark')}</i>` : ''}${s.locked ? `<i class="sp-lockpad">${pic('\u{1F512}')}</i>` : ''}${starsHTML(s.kind === 'lock' ? { max: 3, stars: s.prog } : s)}</span>
        <b class="sp-name">${esc(s.name)}${s.hint ? `<small class="sp-hint">${esc(s.hint)}</small>` : ''}</b>${!lt && s.kind !== 'head' && s.kind !== 'lock' ? `<span class="sp-play">${T('Play', 'Chơi')} ▶</span>` : ''}</button>`).join('') +
      `<button class="sp-owl lumi" aria-label="Lumi">${pic('lumi')}</button>`;
    // measure the tallest stop (its name may take two or three lines), then place them all
    const btns = [...path.querySelectorAll('.sp-stop')], tall = Math.max(150, ...btns.filter(b => !b.classList.contains('grp')).map(b => b.offsetHeight));
    L = place(tall);
    lay = L;
    const w = isWide ? L.w : W, h = isWide ? H : L.h, d = isWide ? roadWide(L.pts) : road(L.pts);
    btns.forEach((b, k) => { b.style.left = L.pts[k].x + 'px'; b.style.top = L.pts[k].y + 'px'; });
    const svg = path.querySelector('svg'); svg.setAttribute('width', w); svg.setAttribute('height', h); svg.querySelectorAll('path').forEach(p => p.setAttribute('d', d));
    path.style.height = h + 'px'; path.style.width = isWide ? w + 'px' : '';
    // Ông Cú stands beside the one to try next, on the side with room, and points at it
    const owl = path.querySelector('.sp-owl'), q = L.pts[next >= 0 ? next : 0];
    if (q) { const left = isWide ? false : q.x > W / 2, dx = isWide ? 0 : left ? -96 : 96; owl.style.left = q.x + dx + 'px'; owl.style.top = (isWide ? q.y - 96 : q.y) + 'px'; owl.classList.toggle('left', left); owl.classList.toggle('up', isWide); }
    owl.onclick = () => { SFX.tap(); owl.classList.remove('cheer'); void owl.offsetWidth; owl.classList.add('cheer'); const s = list[next >= 0 ? next : 0]; if (s) say(s.voice[0], s.voice[1]); };
    path.querySelectorAll('button.sp-stop').forEach(b => b.onclick = () => go(list[+b.dataset.k], b));
    restorePosition();
  }
  // the tap: grow, bounce and sparkle at once, say the name, then open it (twice-tapping can't start it twice)
  function go(s, btn) {
    if (busy || !s) return;
    if (s.kind === 'songs') { SFX.tap(); say(s.voice[0], s.voice[1]); G.openSongs(); return; }
    if (s.kind === 'fest') { SFX.tap(); say('Festival calendar', 'Lịch lễ hội'); openFestivals(G, 0); return; }
    if (s.kind === 'head') { SFX.tap(); say(s.voice[0], s.voice[1]); return; }
    if (s.kind === 'lock') { SFX.tap(); say(s.voice[0], s.voice[1]); guide(s); return; }
    if (!little() && sel !== idOf(s)) { // a big kid: the first tap shows it, the second one plays it
      SFX.tap(); sel = idOf(s); say(s.voice[0], s.voice[1]);
      m.querySelectorAll('.sp-stop.sel').forEach(b => b.classList.remove('sel')); if (btn) btn.classList.add('sel');
      return;
    }
    busy = true; sel = null; SFX.tap(); say(s.voice[0], s.voice[1]); remember(s);
    if (btn) { btn.classList.add('tapped'); const pc = btn.querySelector('.sp-pic'); for (let i = 0; i < 6; i++) { const sp = el('i', 'sp-spark'); sp.style.setProperty('--a', i * 60 + 'deg'); pc.appendChild(sp); } }
    const wait = reduceMotion() ? 200 : 450, i = 0, h = hero();
    setTimeout(() => {
      // games and stories open straight over this screen (it stays behind them); a place flies there in the valley
      if (s.kind === 'game') { markEnglish(s.cat === 'hv_en' ? s.key : null); launched = Date.now(); opened = false; starsBefore = totalStars(); Promise.resolve(G.playGame(i, s.key, 'simple')).finally(() => { if (opened || gameOpen()) opened = true; settle(); }); }
      else if (s.kind === 'tale') { const t = (G.TALES || []).find(x => x.id === s.key); if (!t) { busy = false; return; } launched = Date.now(); opened = false; starsBefore = totalStars(); G.readTaleNow(h, t); }
      // (v1.07 startup) opened before the valley was built (js/main.ts simpleFirst): a place waits for it, with the progress bar
      else { const pl = G.PLACES[+s.key]; back = false; Promise.resolve(G.untilValley?.()).then(() => { const h2 = hero(); leave(); setTimeout(() => G.travelTo(h2, pl.x, pl.z), 50); }); }
    }, wait);
  }
  // open one category's road (from its card, from Discover, or from the checks), from its start, and say its name
  // (Round V) a section is part of the one page: scroll to its title and say its name
  function openCat(key: string, quiet = false) {
    cat = null; sel = null; draw(); const sc = m.querySelector('.sp-scroll'), sec = m.querySelector(`.sp-sec[data-cat="${CSS.escape(key)}"]`);
    if (sec) { const t = sec.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 8; sc.scrollTop = Math.max(0, t); }
    const g = groupsOf(tab).find(x => x.area.key === key); if (g && !quiet) { const [en, vi] = both(g.area.name); say(en, vi); }
  }
  function backToCards() { cat = null; sel = null; draw(); const sc = m.querySelector('.sp-scroll'); sc.scrollTop = 0; sc.scrollLeft = 0; }
  // scroll the road so that stop k is near the start of the screen
  function jump(k) {
    const sc = m.querySelector('.sp-scroll'), q = lay && lay.pts[Math.max(0, k)];
    if (!q) { const b = m.querySelector(`.sp-stop[data-k="${Math.max(0, k)}"]`); if (b) sc.scrollTop = Math.max(0, b.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 76); return; }
    const to = wide() ? { left: Math.max(0, q.x - 90), top: 0 } : { top: Math.max(0, q.y - 76), left: 0 };
    sc.scrollTop = to.top; sc.scrollLeft = to.left;
  }
  // 🔎 Discover: every area as a big picture; big kids can also type a name
  function discover(open) {
    finding = open; const f = m.querySelector('.sp-find'); f.hidden = !open; if (!open) return;
    const lt = little(), groups = TABS.map(t => ({ t }));
    const cards = groups.map(({ t }) => `<h3>${pic(t.icon)} ${esc(t.label())}</h3><div class="sp-cards">${groupsOf(t.key).map(({ area }) => `<button class="sp-card" data-t="${t.key}" data-a="${esc(area.key)}" aria-label="${esc(area.name())}">${pic(area.icon)}<b>${esc(area.name())}</b></button>`).join('')}</div>`).join('');
    f.innerHTML = `<div class="sp-find-top">${lt ? '' : `<input class="sp-q" type="search" placeholder="${T('Find a game, story or place…', 'Tìm trò chơi, truyện, nơi chốn…')}" aria-label="${T('Search', 'Tìm kiếm')}">`}<button class="sp-find-x" aria-label="${T('Close', 'Đóng')}">✕</button></div><div class="sp-found">${cards}</div>`;
    f.querySelector('.sp-find-x').onclick = () => { SFX.tap(); discover(false); };
    const bind = () => f.querySelectorAll('.sp-card').forEach(b => b.onclick = () => {
      SFX.tap();
      if (b.dataset.s) { const s = found[+b.dataset.s]; discover(false); tab = s.tab; openCat(s.area, true); const k = list.findIndex(x => idOf(x) === idOf(s.stop)); jump(k); const btn = m.querySelector(`.sp-stop[data-k="${k}"]`); if (btn) go(list[k], btn); return; }
      tab = b.dataset.t; discover(false); openCat(b.dataset.a);
    });
    let found = []; bind();
    const q = f.querySelector('.sp-q');
    if (q) q.oninput = () => {
      const w = plain(q.value.trim()); if (!w) { f.querySelector('.sp-found').innerHTML = cards; bind(); return; }
      found = groups.flatMap(({ t }) => groupsOf(t.key).flatMap(({ area, items }) => items.map(stop => ({ tab: t.key, area: area.key, stop })))).filter(x => plain(x.stop.voice[0] + ' ' + x.stop.voice[1]).includes(w)).filter((x, k, all) => all.findIndex(y => idOf(y.stop) === idOf(x.stop)) === k).slice(0, 24); // (a game linked into a Fun learning corner is found once)
      f.querySelector('.sp-found').innerHTML = found.length ? `<div class="sp-cards">${found.map((x, k) => `<button class="sp-card" data-s="${k}">${pic(x.stop.icon)}<b>${esc(x.stop.name)}</b></button>`).join('')}</div>` : `<p class="sp-none">${pic('🤔')} ${T('Nothing with that name yet.', 'Chưa có tên nào như vậy.')}</p>`;
      bind();
    };
  }
  function show(t = '') {
    if (!solo() || !hero()) return;
    if (!moreArtReady()) void moreArt().then(() => { if (m) show(); }); // (v1.08) drawn again once the new games' pictures are in
    if (t && t !== tab) { tab = t; cat = null; kept = { top: 0, left: 0 }; }
    if (!m) {
      m = el('div', 'simple-screen');
      const p = hero().profile;
      m.innerHTML = `<div class="sp-scene">${SCENE}</div><div class="sp-top"><span class="sp-me">${p.photo ? `<img src="${p.photo}" alt="">` : pic('🙂')}<b>${esc(p.name)}</b></span>
        <button class="sp-back" hidden aria-label="${T('Back', 'Quay lại')}">${pic('⬅️')}<small>${T('Back', 'Quay lại')}</small></button>
        <div class="sp-tools"><button class="sp-valley" aria-label="${T('Valley', 'Thung lũng')}">${pic('🌳')}<small>${T('Valley', 'Thung lũng')}</small></button>
        <button class="sp-sound" aria-label="${T('Sound on or off', 'Bật tắt âm thanh')}">${pic('🎵')}<small>${T('Sound', 'Âm thanh')}</small></button>
        <button class="sp-home" aria-label="${T('Home', 'Trang chủ')}">${pic('🏠')}<small>${T('Home', 'Trang chủ')}</small></button>
        <button class="grown sp-grown"><span class="ring"></span>${pic('⚙️')}<small>${T('Grown-ups: press and hold', 'Người lớn: nhấn giữ')}</small></button></div></div>
        <div class="sp-scroll"><div class="sp-path"></div></div>
        <nav class="sp-tabs">${TABS.map(x => `<button data-tab="${x.key}"><span>${pic(x.icon)}</span><small>${esc(x.label())}</small></button>`).join('')}
          <button class="sp-discover"><span>${pic('🔎')}</span><small>${T('Discover', 'Khám phá')}</small></button></nav>
        <div class="sp-find" hidden></div>`;
      document.body.appendChild(m);
      m.querySelector('.sp-back').onclick = () => { if (busy) return; SFX.tap(); backToCards(); const x = tabOf(tab); say(x.say[0], x.say[1]); };
      m.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { if (busy) return; SFX.tap(); discover(false); tab = b.dataset.tab; cat = null; sel = null; draw(); const sc = m.querySelector('.sp-scroll'); sc.scrollTop = 0; sc.scrollLeft = 0; const x = TABS.find(y => y.key === tab); say(x.say[0], x.say[1]); });
      m.querySelector('.sp-sound').onclick = () => { SFX.tap(); G.openSound(); };   // (Round U) music, sounds and voice
      // (owner, 30 Oct 2026 AEDT: "the Simple screen looks very cramped") the top row keeps sound, home and grown-ups;
      // "say it again" is the owl now (a tap on Ông Cú says it again)
      m.querySelector('.sp-discover').onclick = () => { if (busy) return; SFX.tap(); discover(!finding); if (finding) say('Where shall we go?', 'Mình đi đâu nào?'); };
      // Parent website: floating over this screen (js/website.ts), its Play button reads "Back to game" and closes it, so the
      // child is back where they were (owner, 24 Oct AEDT: a new tab started the whole game again from the Home Screen app)
      const home = m.querySelector('.sp-home');
      home.onclick = () => { if (busy) return; SFX.tap(); import('./website.js').then(w => { w.openWebsite(home); }).catch(error => { window.svModuleGone?.(error); }); };
      m.querySelector('.sp-valley').onclick = () => { if (busy) return; SFX.tap(); busy = true; Promise.resolve(G.untilValley?.()).then(() => { busy = false; choose('valley'); leave(); say('Off you go! Explore the valley.', 'Đi nào! Khám phá thung lũng thôi.'); }); };
      holdButton(m.querySelector('.sp-grown'), () => openGrownups(() => draw()));
      addEventListener('resize', draw);
      if (wideQ && wideQ.addEventListener) wideQ.addEventListener('change', draw);
      // the landscape stands still while the page is hidden (another app, a locked phone)
      document.addEventListener('visibilitychange', () => m.classList.toggle('still', document.hidden || reduceMotion()));
    }
    busy = false; sel = null; discover(false);
    m.hidden = false; G.paused = true; document.body.classList.add('simple-on'); m.classList.toggle('still', reduceMotion());
    choose('simple'); draw(true);
    // a new star since the path was last open: Ông Cú cheers
    const who = hero().profile.name, now = totalStars(), owl = m.querySelector('.sp-owl');
    if (lastStars[who] != null && now > lastStars[who] && owl) { owl.classList.add('cheer'); say('Well done! You won a new star!', 'Giỏi lắm! Con được thêm một ngôi sao!'); }
    // (v1.08b quality) Lumi is the guide of the Simple screen: her welcome for a new child, then the week's news once a week
    else { const p = hero().profile, greet = (Lm: typeof import('./lumi.js')) => { if (m.hidden) return; if (!Lm.lumiWelcome(p) && !Lm.lumiNews(p)) { const x = tabOf(tab); say(x.say[0], x.say[1]); } };
      if (L) greet(L); else void lumi().then(greet).catch(() => { const x = tabOf(tab); say(x.say[0], x.say[1]); }); }
    lastStars[who] = now;
  }
  function hide() { if (m) { const sc = m.querySelector('.sp-scroll'); if (!m.hidden) kept = { top: sc.scrollTop, left: sc.scrollLeft }; m.hidden = true; } document.body.classList.remove('simple-on'); G.paused = false; }
  function leave() { back = false; hide(); }
  function choose(screen) { const p = hero() && hero().profile; if (p && p.screen !== screen) { p.screen = screen; saveProfiles(); } }
  // the game or story started from here is over: the path is free at once, with the stars brought up to date
  function settle() {
    if (!launched || !m || m.hidden || gameOpen() || document.querySelector('.theatre')) return;
    launched = 0; busy = false; draw(true); lastStars[hero().profile.name] = lastStars[hero().profile.name] ?? starsBefore;
    if (totalStars() > starsBefore) { const owl = m.querySelector('.sp-owl'); if (owl) owl.classList.add('cheer'); say('Well done! You won a new star!', 'Giỏi lắm! Con được thêm một ngôi sao!'); }
    lastStars[hero().profile.name] = totalStars();
  }
  // back to the path when the game or story started here is over (and nothing else is open)
  setInterval(() => {
    // a game or story started from this screen: it opens over it; when it has closed again, the path is ready (stars
    // brought up to date, Ông Cú cheers a new one); if it never opened (a question came first), the screen is free again
    if (launched && m && !m.hidden) {
      const up = gameOpen() || !!document.querySelector('.theatre, .gl');
      if (up) opened = true;
      else if (opened) settle();
      else if (!opened && Date.now() - launched > 6000) { launched = 0; busy = false; }
    }
    if (m && !m.hidden && !busy && !gameOpen() && !document.querySelector('.theatre') && (catalogueDirty || fruitState !== fruitAvailability())) draw();
    if (m && !m.hidden && !gameOpen()) G.paused = true; // the valley stays still behind it, also after a talk box closes
    if (!back || !m || !m.hidden || G.paused || gameOpen() || document.querySelector('.modal, .dialog, .storybook, .theatre, .reward')) return;
    back = false; show();
  }, 700);
  return {
    show, hide: leave, get open() { return !!m && !m.hidden; }, get tab() { return tab; }, get busy() { return busy; },
    // what the road shows now (for the checks): its categories and every stop on it
    // (Round U) the cards: every category of the tab; with one open, its stops
    // (Round V) one page: every section of the tab (its title and road) and every stop on it
    get view() { if (!m) return null; return { cat, cats: groupsOf(tab).map(g => g.area.key), stops: list.filter(s => s.kind !== 'head' && s.kind !== 'lock').map(s => s.key), locks: list.filter(s => s.kind === 'lock').map(s => s.key), secs: m.querySelectorAll('.sp-sec').length }; },
    get cats() { return groupsOf(tab).map(g => g.area.key); },
    // open a category of a tab (tests, and anything that wants to take a child straight to one); null: the cards
    openGroup(t, key) { tab = t; if (key == null) backToCards(); else openCat(key, true); },
    // at the start of a session: the Simple screen for a child who wants it
    start() { if (solo() && wantsSimple(hero().profile)) { const wait = setInterval(() => { if (document.querySelector('.storybook')) return; clearInterval(wait); if (solo() && wantsSimple(hero().profile)) show(); }, 400); } else if (m) leave(); }
  };
}
