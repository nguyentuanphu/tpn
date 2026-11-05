// The Play hub (split from js/ui.ts, v1.07): the games by tab.
import { isOpen, isHeld, progressOf, secondSetOf } from '../content/unlocks.js';
import { AREAS, gamesIn, gameInfo, LEARN_CORNERS } from '../content/activities.js';
import { T } from '../i18n.js';
import { reduceMotion } from '../state.js';
import { say } from '../voice.js';
import { SFX, Music } from '../audio.js';
import { cur, spoken as money } from '../money.js';
import { esc, $ } from '../util.js';
import { GAMES } from '../games/frame.js';
import { openHowTo } from '../howto.js';
import { SONG_GROUPS, SONG_LIST, familySongs } from '../content/songs.js';
import { originFlags } from '../icons.js';
import { pic, moreArt, moreArtReady } from '../art.js';
import { modal, dialog } from '../popups.js';
import { festCalendarHTML } from './festivals-ui.js';
import { markEnglish, englishBadge } from '../englishmode.js'; // (v1.08 english)
const FOLK_SHOW = ['music', 'firstwords', 'tangram', 'snakes', 'rangoli', 'words', 'mrwolf', 'cricket', 'parcel', 'sackrace', 'chuyen', 'dragon', 'datnieu', 'kite', 'chichi', 'marbles', 'skipping', 'dacau', 'snap', 'tienlen', 'oantuti', 'nemlon', 'oanquan', 'hopscotch', 'tug', 'caro', 'goat'];
export const folkGames = () => FOLK_SHOW;
// The Play hub's game tabs (round R, owner: "rearrange the menu so it is more logical"). Every game is in exactly one
// tab, by what kind of game it is, from the same list as the Simple screen's areas (js/content/activities.js), so a
// game the family moves in Studio moves in both. Inside a tab the games are grouped under their area's name.
const HUB_TABS = [
  // (v1.08b games, owner 3 Nov 2026 AEDT: "Học and Học vui become one tab, one home per game") one learning tab, Học vui,
  // with a corner per subject: Tiếng Việt, Tiếng Anh, Toán, Hình khối, Tiền, Khoa học, Chữ và đọc (with the Reading
  // corner), Em và gia đình. No link tiles: every game is in one corner only (the `hubmap` check)
  { key: 'hocvui', icon: 'hv:tab', short: () => T('Fun learning', 'Học vui'), title: () => T('Fun learning: languages, maths, science and me', 'Học vui: ngôn ngữ, toán, khoa học và em'), areas: [...LEARN_CORNERS] },
  { key: 'folk', icon: '🪁', short: () => T('Folk games', 'Dân gian'), title: () => T('Folk games to play together', 'Trò chơi dân gian chơi cùng nhau'), areas: ['vietnam', 'play', 'festival'] }, // (v1.08b games) and the festival games in season
  { key: 'animals', icon: '🐶', short: () => T('Animals and music', 'Con vật, âm nhạc'), title: () => T('Animals and music', 'Con vật và âm nhạc'), areas: ['animals', 'music'] },
  { key: 'art', icon: '🎨', short: () => T('Pictures', 'Tranh'), title: () => T('Colours, pictures and puzzles', 'Màu sắc, tranh và ghép hình'), areas: ['art'] },
  { key: 'places', icon: '🚋', short: () => T('Going places', 'Đi đây đi đó'), title: () => T('Games in the cities and on the road', 'Trò chơi ở thành phố và trên đường'), areas: ['travel'] },
  { key: 'thinking', icon: '🧠', short: () => T('Big thinkers', 'Suy nghĩ giỏi'), title: () => T('Big thinkers: puzzles and strategy', 'Suy nghĩ giỏi: đố và chiến thuật'), areas: ['thinking'] }
];
const AREA_OF = Object.fromEntries(AREAS.map(a => [a.key, a]));
// each tab with its games (built when asked, so the family's Studio changes are in it)
const hubSections = () => HUB_TABS.map(t => ({ ...t, groups: t.areas.map(a => ({ area: AREA_OF[a], games: gamesIn(GAMES, a, false).map(g => g.id) })).filter(g => g.area && g.games.length) })).map(t => ({ ...t, games: t.groups.flatMap(g => g.games) }));
export const HUB = HUB_TABS;
// The game after this one in the Games hub (the tab the child last used first), for "Next game" after a win.
export function nextGameAfter(id) {
  const secs = hubSections().sort((a, b) => Number(b.key === openGamesHub.last) - Number(a.key === openGamesHub.last));
  for (const sec of secs) { const list = sec.games.filter(g => GAMES[g]), k = list.indexOf(id); if (k >= 0) return list[(k + 1) % list.length]; }
  return null;
}
const HUB_COLORS = ['#ff7eb8', '#ffb52e', '#5fd39a', '#3cc7e8', '#9a6bff', '#ff8a5a'];
const openGamesHubProperties: { last?: string; scroll?: number; unfolded: Set<string>; soon?: string } = { unfolded: new Set() };
export const openGamesHub = Object.assign(function (game, i, onClose) {
  if (!moreArtReady()) { void moreArt().then(() => openGamesHub(game, i, onClose), () => openGamesHub(game, i, onClose)); return; } // (v1.08) the new games' pictures first
  const p = game.heroes[i].profile;
  const m = modal('hub', ''), card = m.querySelector('.card');
  const close = () => { m.close(); onClose && onClose(); };
  // one category at a time, picked from a row of tabs (the whole list was too long to scroll on a phone)
  // games first (by kind), then things to watch and listen to, then the festival calendar
  const SECS = hubSections();
  const tabs = [...SECS, ...(game.taleShelfHTML ? [{ key: 'tales', icon: '📖', short: () => T('Stories', 'Truyện') }] : []), ...(game.openSongs ? [{ key: 'songs', icon: '🎵', short: () => T('Songs', 'Bài hát') }] : []), ...(game.festivals ? [{ key: 'fest', icon: '📅', short: () => T('Festivals', 'Lễ hội') }] : [])];
  let cur = tabs.find(t => t.key === openGamesHub.last) ? openGamesHub.last : 'hocvui';
  // (r90, owner 24 Oct AEDT) a card per game a child can play; the games still to unlock fold into one padlock tile
  // (one tap shows them), and the new games held back in Studio (New games off) into one "Coming soon" tile
  const gameCard = (id, k, key, open) => {
      const g = GAMES[id], lv = p.levels[id] || 1;
      return `<div class="hcard ${open ? "" : "locked"}" style="--hc:${HUB_COLORS[(k + key.length) % HUB_COLORS.length]}"><button class="hplay" data-play="${id}"${key.endsWith('hv_en') ? ' data-english="1"' : ''} ${open ? "" : "disabled"}><span class="hi">${pic(open ? g.icon : '\u{1F512}')}</span><b>${esc(g.name())}</b><small>${'⭐'.repeat(lv)}${'☆'.repeat(5 - lv)}</small></button><button class="hgo" data-go="${id}" aria-label="${T('Go there', 'Đi đến đó')}">📍</button><button class="hhow" data-how="${id}" aria-label="${T('How to play', 'Cách chơi')}">📺</button>${g.origin ? `<span class="hflag">${originFlags(g.origin)}</span>` : ''}${open && game.learnQuest && game.learnQuest.isTodayStep(p, id) ? `<span class="hquest" title="${esc(T('Today’s learning step', 'Bước học hôm nay'))}">${pic('lp:mark')}</span>` : ''}</div>`;
  };
  // (owner, 1 Nov 2026 AEDT: "it should tell what's needed to access these additional games, currently it only expands
  // to show the new games") the unfolded padlock first says what to do: each game above won 3 times, with the stars so far
  const lockGuide = area => { const prog = progressOf(p, 'game', area), ready = prog.perGame.filter(g => g.n >= 3).length, total = prog.perGame.length;
    return total ? `<div class="hsoonlist hlockguide"><p>${T('Win each of these games 3 times to unlock the games below:', 'Thắng mỗi trò này 3 lần để mở các trò bên dưới nhé:')}</p>${prog.perGame.map(g => `<div class="hsoonrow${g.n >= 3 ? ' done' : ''}"><span class="hi">${pic(GAMES[g.id]?.icon || '\u{1F3AE}')}</span><b>${esc(GAMES[g.id]?.name() || g.id)}</b><span class="hsoonstars">${[0, 1, 2].map(k => pic(k < g.n ? '\u2B50' : '\u2606')).join('')}</span></div>`).join('')}<p class="hsoonok">${ready === total ? T('All done!', 'Xong hết rồi!') : T(`${ready} of ${total} done`, `Xong ${ready} trên ${total}`)}</p></div>` : ''; };
  const card2 = sec => {
    const area = sec.area || sec.key, ids = sec.games.filter(id => GAMES[id]);
    const open = ids.filter(id => isOpen(p, id, 'game', area)), locked = ids.filter(id => !open.includes(id));
    const heldIds = secondSetOf('game', area).filter(id => GAMES[id] && isHeld(id, 'game')), held = heldIds.length, shown = openGamesHub.unfolded.has(area);
    const lockTile = locked.length ? `<div class="hcard hfold" style="--hc:#b9a6e8"><button class="hplay" data-fold="${area}" aria-expanded="${shown}"><span class="hi">${pic('\u{1F512}')}</span><b>${shown ? T('Hide', 'Thu gọn') : T(`${locked.length} more to unlock`, `Còn ${locked.length} trò để mở`)}</b><small>${shown ? '' : T('Play each game above 3 times', 'Chơi mỗi trò ở trên 3 lần')} · ${pic('⭐')} ${progressOf(p, 'game', area).done}/3</small></button></div>` : '';
    // (owner, 30 Oct 2026 AEDT: "it doesn't say how many stars are needed; give a guide so kids understand what they
    // need") the tile shows how far the child is (each game here won 3 times) and opens the list of those games
    const prog = progressOf(p, 'game', area), ready = prog.perGame.filter(g => g.n >= 3).length, total = prog.perGame.length, soonOpen = openGamesHub.soon === area;
    const soonTile = held ? `<div class="hcard hsoon" style="--hc:#9ad0ff"><button class="hplay" data-soon="${area}" aria-expanded="${soonOpen}"><span class="hi">${pic('\u{1F51C}')}</span><b>${T(`${held} new games coming`, `Sắp có ${held} trò mới`)}</b><small>${total ? T(`Win each game 3 times: ${ready}/${total}`, `Thắng mỗi trò 3 lần: ${ready}/${total}`) : T('On their way!', 'Sắp đến rồi!')}</small><span class="hsoonbar" aria-hidden="true"><i style="width:${total ? Math.round(ready / total * 100) : 100}%"></i></span></button></div>${soonOpen ? `<div class="hsoonbubble" role="dialog" aria-label="${T('New games coming', 'Trò mới sắp có')}"><i class="hsb-dot a"></i><i class="hsb-dot b"></i><p>${T('Coming soon:', 'Sắp có:')}</p><div class="hsb-games">${heldIds.map(id => `<span><span class="hi">${pic(GAMES[id].icon)}</span>${esc(GAMES[id].name())}</span>`).join('')}</div></div>` : ''}${soonOpen && total ? `<div class="hsoonlist"><p>${T('Win each of these games 3 times to open the new games:', 'Thắng mỗi trò này 3 lần để mở trò mới nhé:')}</p>${prog.perGame.map(g => `<div class="hsoonrow${g.n >= 3 ? ' done' : ''}"><span class="hi">${pic(GAMES[g.id]?.icon || '\u{1F3AE}')}</span><b>${esc(GAMES[g.id]?.name() || g.id)}</b><span class="hsoonstars">${[0, 1, 2].map(k => pic(k < g.n ? '\u2B50' : '\u2606')).join('')}</span></div>`).join('')}${ready === total ? `<p class="hsoonok">${T('All done! The new games are on their way.', 'Xong hết rồi! Trò mới đang trên đường đến.')}</p>` : ''}</div>` : ''}` : '';
    return `<div class="hubgrid">${open.map((id, k) => gameCard(id, k, sec.key, true)).join('')}${lockTile}${shown ? lockGuide(area) + locked.map((id, k) => gameCard(id, k + open.length, sec.key, false)).join('') : ''}${soonTile}</div>`;
  };
  const body = key => {
    if (key === 'fest') return `<h3>📅 ${T('Festival calendar', 'Lịch lễ hội')}</h3>${festCalendarHTML(game)}`;
    if (key === 'tales') return `<h3>📖 ${T('Fairy tales', 'Truyện cổ tích')}</h3><p class="sub">${T('Tap a story: you fly to Grandma Storyteller and she reads it to you.', 'Chạm vào truyện: con bay đến chỗ Bà Kể Chuyện và bà kể cho con nghe.')}</p><div class="talelib">${game.taleShelfHTML(p)}</div>`;
    if (key === 'songs') {
      // (round O, owner: songs belong with the games, not in Settings) one big button per group; it opens the Songs page there
      const fam = familySongs().length, groups = SONG_GROUPS.filter(g => g.key === 'family' ? fam : SONG_LIST.some(s => s.group === g.key && Music.has(s.key)));
      return `<h3>🎵 ${T('Songs: tap to listen', 'Bài hát: chạm để nghe')}</h3><div class="festrow songrow">${groups.map(g => `<button class="festbtn" data-songs="${g.key}"><span>${pic(g.icon)}</span><b>${esc(g.name())}</b></button>`).join('')}</div>`;
    }
    const sec = SECS.find(x => x.key === key) || SECS[0]; return `<h3>${/^[a-z]+:/.test(sec.icon) ? pic(sec.icon) : sec.icon} ${esc(sec.title())}</h3>${key === 'hocvui' && game.learnQuest ? game.learnQuest.journeysHTML(p) : ''}${sec.groups.map(g => `${sec.groups.length > 1 ? `<h4 class="hubarea">${pic(g.area.icon)} ${esc(g.area.name())}${g.area.key === 'hv_en' ? englishBadge() : ''}</h4>` : ''}${card2({ key: sec.key + g.area.key, area: g.area.key, games: g.games })}`).join('')}`;
  };
  card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>🎮 ${T('Play', 'Vui chơi')}</h2>
    <div class="hubtabs" role="tablist">${tabs.map(t => `<button role="tab" data-tab="${t.key}"><span>${pic(t.icon)}</span><small>${esc(t.short())}</small></button>`).join('')}</div>
    <div class="hubbody"></div>`;
  const draw = () => {
    card.querySelectorAll('.hubtabs [data-tab]').forEach(b => { const on = b.dataset.tab === cur; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    const hb = card.querySelector('.hubbody'); hb.innerHTML = body(cur); hb.scrollTop = openGamesHub.scroll || 0;
    bind(hb);
  };
  card.querySelectorAll('.hubtabs [data-tab]').forEach(b => b.onclick = () => { cur = openGamesHub.last = b.dataset.tab; openGamesHub.scroll = 0; SFX.tap(); draw(); const row = b.parentElement; row.scrollTo({ left: b.offsetLeft - row.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' }); }); // sideways only: the page must not jump
  card.querySelector('.x').onclick = close;
  const bind = root => {
    root.querySelectorAll('[data-tale]').forEach(b => b.onclick = () => { close(); game.readTale(i, b.dataset.tale); });
    if (game.bindTaleShelf) game.bindTaleShelf(root, () => { openGamesHub.scroll = root.scrollTop; draw(); });
    root.querySelectorAll('[data-songs]').forEach(b => b.onclick = () => { SFX.tap(); close(); game.openSongs(b.dataset.songs); });
    root.querySelectorAll('[data-fold]').forEach(b => b.onclick = () => { SFX.tap(); const k = b.dataset.fold; if (openGamesHub.unfolded.has(k)) openGamesHub.unfolded.delete(k); else { openGamesHub.unfolded.add(k); say('Finish the games above 3 times each to unlock these.', 'Chơi xong mỗi trò ở trên 3 lần để mở những trò này nhé.'); } openGamesHub.scroll = root.scrollTop; draw(); });
    root.querySelectorAll('[data-soon]').forEach(b => b.onclick = () => { SFX.tap(); const k = b.dataset.soon; openGamesHub.soon = openGamesHub.soon === k ? '' : k; if (openGamesHub.soon) say('Win each game here 3 times to open the new games!', 'Thắng mỗi trò ở đây 3 lần để mở trò mới nhé!'); openGamesHub.scroll = root.scrollTop; draw(); if (openGamesHub.soon) root.querySelector('.hsoonbubble')?.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' }); });
    // (v1.08b games) a game in the English corner plays in English (First Sounds as well as the English games)
    root.querySelectorAll('[data-play]').forEach(b => b.onclick = () => { const id = b.dataset.play; markEnglish(b.dataset.english ? id : null); close(); openGamesHub.scroll = root.scrollTop; game.meetAndPlay(i, id, 'hub'); });
    root.querySelectorAll('[data-lqplay]').forEach(b => b.onclick = () => { const id = b.dataset.lqplay; markEnglish(gameInfo(id).area === 'hv_en' ? id : null); close(); openGamesHub.scroll = root.scrollTop; game.meetAndPlay(i, id, 'hub'); }); // (v1.08b games) a learning journey's next step
    root.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { close(); game.goToGame(i, b.dataset.go); });
    root.querySelectorAll('[data-how]').forEach(b => b.onclick = () => { const id = b.dataset.how, en = !!b.closest('.hcard')?.querySelector('[data-english]'); openHowTo(id, { onPlay: () => { markEnglish(en ? id : null); close(); game.playGame(i, id, 'hub'); } }); });
  };
  draw();
  say('Which game shall we play?', 'Mình chơi trò gì nào?');
}, openGamesHubProperties);
