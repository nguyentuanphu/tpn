import { testerArcadeAvailable } from './tester-arcades.js';
import { fruitParadeAvailable } from './fruit-parade.js';
// One list of everything a child can choose on the Simple screen (round J, owner: "one source of truth"): every
// mini-game sits in exactly one child-friendly area, with the youngest age it suits and how hard it is. The Simple
// screen's path, its Discover page and search, the "new" markers and the checks all read it from here; the names and
// pictures still come from the games themselves (js/games/registry.js), so nothing is written twice.
// The family's Studio can move a game to another area, hide it, or open it to under-5s (content/custom.json
// "activities": { id: { area, little, hide } }).
import { T } from '../i18n.js';
import { CUSTOM, itemEnabled, keptOn, MONEY_GAMES, releaseOn } from '../custom.js';
import { PLACES as MAP_PLACES, PLOTS as MAP_PLOTS } from './map.js';
import { heldGame } from './secondset.js';

// the areas, in the order the path visits them; a child who can't read knows each one by its picture
export const AREAS = [
  { key: 'animals', icon: '🐶', name: () => T('Animals', 'Con vật') },
  { key: 'music', icon: '🎵', name: () => T('Music', 'Âm nhạc') },
  { key: 'art', icon: '🎨', name: () => T('Colours and pictures', 'Màu sắc và tranh') },
  { key: 'numbers', icon: '🔢', name: () => T('Numbers', 'Con số') },
  { key: 'shapes', icon: '🔷', name: () => T('Shapes', 'Hình khối') },
  { key: 'words', icon: '🔤', name: () => T('Letters and words', 'Chữ và từ') },
  { key: 'me', icon: '💛', name: () => T('Me and my family', 'Em và gia đình') },
  { key: 'play', icon: '🪁', name: () => T('Play outside', 'Chơi ngoài trời') },
  { key: 'vietnam', icon: '🇻🇳', name: () => T('Vietnamese games', 'Trò chơi Việt Nam') },
  { key: 'travel', icon: '🚋', name: () => T('Going places', 'Đi đây đi đó') },
  { key: 'thinking', icon: '🧠', name: () => T('Big thinkers', 'Suy nghĩ giỏi') },
  // (round S, owner plan 8 Oct) the money games, in the child's home currency
  { key: 'money', icon: '💰', name: () => T('Money and shopping', 'Tiền và mua sắm') }
];

// id: [area, youngest age (2 = everyone, 5 = big kids), how hard (1 easy · 2 a bit harder · 3 hardest)]
export const GAME_INFO: Record<string, [string, number, number]> = {
  bunny: ['animals', 2, 1], koala: ['animals', 2, 1], animalsounds: ['animals', 2, 1], duckmaze: ['animals', 2, 1], eggs: ['animals', 2, 1], oddone: ['animals', 3, 2], goat: ['animals', 3, 2],
  catchfish: ['animals', 2, 1], emueggs: ['animals', 2, 1], reefclean: ['animals', 3, 1],
  crabwalk: ['animals', 2, 1], whohome: ['animals', 2, 1], mumbaby: ['animals', 2, 1], feedzoo: ['animals', 3, 1], buffalo: ['animals', 3, 1], reefcount: ['animals', 3, 1], tracks: ['animals', 4, 2],
  myday: ['me', 2, 1], plate: ['me', 3, 1], kindchoice: ['me', 3, 1],
  minichess: ['thinking', 5, 2], cotuong: ['thinking', 5, 2], whosits: ['thinking', 5, 2], pipes: ['thinking', 4, 2],
  dantranh: ['music', 2, 1], bushband: ['music', 3, 1], drumecho: ['music', 3, 1], loudquiet: ['music', 2, 1], songsteps: ['music', 4, 2],
  whichgroup: ['words', 3, 1], storyorder: ['words', 4, 2], guesswhat: ['words', 4, 2], actions: ['words', 3, 1], position: ['words', 3, 1],
  numline: ['numbers', 3, 1], tenframe: ['numbers', 3, 1], dice: ['numbers', 2, 1], evenodd: ['numbers', 4, 2], measure: ['numbers', 4, 2], beforeafter: ['numbers', 3, 1], halves: ['numbers', 4, 2],
  solids: ['shapes', 3, 1], townshapes: ['shapes', 2, 1], tiles: ['shapes', 4, 2], turnit: ['shapes', 4, 2], shapetrain: ['shapes', 2, 1], linescurves: ['shapes', 2, 1], foldbox: ['shapes', 5, 2],
  cyclo: ['travel', 2, 1], reunification: ['travel', 3, 1], lighthouse: ['travel', 2, 1], operaseats: ['travel', 4, 2], outback: ['travel', 4, 2], floating: ['travel', 3, 1], airport: ['travel', 3, 1], postcard: ['travel', 3, 1],
  hideseek: ['play', 2, 1], duckgoose: ['play', 2, 1], redgreen: ['play', 2, 1], simon: ['play', 3, 1], eggspoon: ['play', 2, 1], chairs: ['play', 2, 1], kicktokick: ['play', 3, 1], nippers: ['play', 4, 2], hoops: ['play', 3, 1], tag: ['play', 2, 1],
  savegoal: ['money', 3, 1], pocketweek: ['money', 4, 2], pricetags: ['money', 3, 1], busfare: ['money', 3, 1], lemonade: ['money', 4, 2], party: ['money', 5, 3], recycle: ['money', 3, 1], tetmarket: ['money', 3, 1], bank: ['money', 4, 2], sharefair: ['money', 3, 1],
  rd_blend: ['reading', 3, 1], rd_hats: ['reading', 3, 1], rd_endings: ['reading', 3, 1], rd_compound: ['reading', 3, 1], rd_labels: ['reading', 3, 1], rd_signs: ['reading', 3, 1], rd_questions: ['reading', 3, 1], rd_many: ['reading', 3, 1], rd_caps: ['reading', 3, 1], rd_poem: ['reading', 3, 1], rd_missing: ['reading', 3, 1], rd_book: ['reading', 3, 1],
  music: ['music', 2, 1], tune: ['music', 3, 2], chichi: ['music', 2, 1], puppets: ['music', 2, 1], parcel: ['music', 2, 1],
  colors: ['art', 2, 1], dongho: ['art', 3, 1], rangoli: ['art', 3, 2], jigsaw: ['art', 3, 2], tangram: ['art', 4, 2],
  // (r89) the ten drawing games
  dotdot: ['art', 3, 1], trace: ['art', 2, 1], mirror: ['art', 2, 1], colournum: ['art', 4, 2], lanternart: ['art', 2, 1], card: ['art', 3, 1], sand: ['art', 2, 1], drawpath: ['art', 3, 2], shapedraw: ['art', 4, 2], copygrid: ['art', 5, 3],
  stamps: ['art', 2, 1],
  weave: ['art', 2, 1],
  mosaic: ['art', 3, 1],
  nonla: ['art', 2, 1],
  aodai: ['art', 2, 1],
  kitepaint: ['art', 2, 1],
  shades: ['art', 2, 1],
  shadowpic: ['art', 2, 1],
  finishpic: ['art', 2, 1],
  scene: ['art', 2, 1],
  lacquer: ['art', 2, 1],
  scratch: ['art', 2, 1],
  bubblepaint: ['art', 2, 1],
  fingerpaint: ['art', 2, 1],
  weatherpaint: ['art', 2, 1],
  thocam: ['art', 3, 1],
  pixelpic: ['art', 3, 1],
  fireworks: ['art', 2, 1],
  masks: ['art', 2, 1],
  makeface: ['art', 2, 1],
  gallery: ['art', 2, 1],
  leafrub: ['art', 2, 1],
  counting: ['numbers', 2, 1], numbers: ['numbers', 3, 1], moreless: ['numbers', 3, 2], dragonfire: ['numbers', 3, 1], sums: ['numbers', 5, 3], clock: ['numbers', 5, 3], days: ['numbers', 5, 2],
  shapes: ['shapes', 2, 1], pattern: ['shapes', 3, 2], sorting: ['shapes', 2, 1], tower: ['shapes', 2, 1], memory: ['shapes', 3, 2], sudoku: ['shapes', 5, 3], hanoi: ['shapes', 5, 3],
  letters: ['words', 4, 2], phonics: ['words', 4, 2], opposites: ['words', 4, 2], words: ['words', 5, 2], firstwords: ['words', 5, 3],
  feelings: ['me', 2, 1], bodyparts: ['me', 2, 1], familyquiz: ['me', 3, 2], fruitparade: ['play', 2, 1], sparkleorchard: ['play', 2, 1], sparklefruitbar: ['play', 2, 1],
  kite: ['play', 2, 1], hopscotch: ['play', 3, 1], tug: ['play', 2, 1], skipping: ['play', 3, 2], sackrace: ['play', 3, 1], nemlon: ['play', 3, 1], marbles: ['play', 4, 2], cricket: ['play', 5, 2], mrwolf: ['play', 3, 2], dacau: ['play', 4, 2],
  dragon: ['vietnam', 3, 1], cacuangua: ['vietnam', 5, 2], meochuot: ['vietnam', 3, 1], cuopco: ['vietnam', 3, 1], keocua: ['vietnam', 3, 1], danhdao: ['vietnam', 4, 2], nemcon: ['vietnam', 3, 1], trongnu: ['vietnam', 3, 1], duathuyen: ['vietnam', 3, 1], datnieu: ['vietnam', 2, 1],
  banhchung: ['vietnam', 2, 1], denongsao: ['vietnam', 2, 1], mualan: ['vietnam', 2, 2], cayneu: ['vietnam', 2, 1], oantuti: ['vietnam', 3, 1], chuyen: ['vietnam', 5, 2], oanquan: ['vietnam', 5, 3], caro: ['vietnam', 5, 3], tienlen: ['vietnam', 5, 3], tienlenbac: ['vietnam', 5, 3],
  traffic: ['travel', 2, 1], ferries: ['travel', 3, 1], tram: ['travel', 3, 1], balloon: ['travel', 2, 1], bubbles: ['travel', 2, 1], market: ['travel', 3, 2], sortout: ['travel', 3, 2], order: ['travel', 5, 2],
  robot: ['thinking', 5, 3], maze: ['thinking', 5, 2], snakes: ['thinking', 5, 2], snap: ['thinking', 3, 2],
  heodat: ['money', 2, 1], coinnote: ['money', 2, 1], lixi: ['money', 2, 1], needwant: ['money', 3, 1], cheaper: ['money', 3, 1], bahu: ['money', 3, 2], shoplist: ['money', 3, 2], waitgrow: ['money', 3, 2], shopkeep: ['money', 4, 2], barter: ['money', 4, 2]
};
// a game the family's Studio changed (hand-edited files can't break it: anything odd is ignored)
const custom = id => { const c = CUSTOM.activities && CUSTOM.activities[id]; return c && typeof c === 'object' ? c : {}; };
export function gameInfo(id) {
  const [area, age, level] = GAME_INFO[id] || ['thinking', 5, 2], c = custom(id);
  // (batch rollout) each money game has its own Studio switch (money_<id>): off or not started yet, it is hidden unless a
  // child playing has already played it; an explicit Off still wins (the owner-approved explicit-off policy)
  // (r90) the second set of games is held back while Studio's New games switch is off (js/content/secondset.ts)
  const held = (MONEY_GAMES.includes(id) && !keptOn('money_' + id)) || heldGame(id);
  const orchardHeld = id === 'sparkleorchard' && !testerArcadeAvailable('sparkleorchard','single');
  const fruitHeld = id === 'fruitparade' && !fruitParadeAvailable('single');
  return { id, area: AREAS.some(a => a.key === c.area) ? c.area : area, ageMin: c.little === true ? 2 : c.little === false ? 5 : age, level, hidden: !itemEnabled('game', id) || (id === 'sparklefruitbar' && !testerArcadeAvailable('sparklefruitbar','single')) || c.hide === true || held || fruitHeld || orchardHeld };
}
// the games of one area for a child: under-5s only see the ones made for them
export const gamesIn = (games, area, little) => Object.keys(games).map(gameInfo).filter(g => g.area === area && !g.hidden && (!little || g.ageMin < 5));

// stories by where they come from, places by where they are
// (bug #30, owner) China and India always come last: after "Our own stories" and after Australia
export const TALE_AREAS = [
  { key: '🇻🇳', icon: '🇻🇳', name: () => T('Stories from Vietnam', 'Truyện Việt Nam') },
  { key: '🇦🇺', icon: '🇦🇺', name: () => T('Stories from Australia', 'Truyện Úc') },
  { key: '💛', icon: '💛', name: () => T('Our own stories', 'Truyện nhà mình') },
  { key: '🇨🇳', icon: '🇨🇳', name: () => T('Stories from China', 'Truyện Trung Quốc') },
  { key: '🇮🇳', icon: '🇮🇳', name: () => T('Stories from India', 'Truyện Ấn Độ') },
  { key: '🌍', icon: '🌍', name: () => T('Stories from the World', 'Truyện Thế giới') },
];
export const PLACE_AREAS = [
  { key: 'home', icon: '🏡', name: () => T('Around the farm', 'Quanh nông trại') },
  { key: 'vn', icon: '🏮', name: () => T('Vietnam', 'Việt Nam') },
  { key: 'au', icon: '🦘', name: () => T('Australia', 'Nước Úc') },
  { key: 'asia', icon: '🐼', name: () => T('China and India', 'Trung Hoa và Ấn Độ') }
];

// (Release request, round T1) new places of the rebuilt valley that are not cities, by their id in js/content/map.js:
// each joins the place list (the Pad map and the Simple screen's Places road) once the map holds it. Vũng Tàu is a
// city and lists itself; the harbour is a landmark (the Harbour Bridge), listed under Sydney.
const SITE_PLACES = [
  { id: 'hoian', g: 'vn', icon: '🏮', name: () => T('Hội An', 'Hội An') },
  // (round T2) the two Memory Villages, where families build a little house of their own; named as on the map
  { id: 'memory_e', g: 'vn', icon: '🏘️' },
  { id: 'memory_w', g: 'au', icon: '🏘️' }
];
export function withSitePlaces(list) {
  if (!list) return list;
  for (const s of SITE_PLACES) {
    const m = MAP_PLACES.find(p => p.id === s.id); if (!m || list.some(pl => pl.key === s.id)) continue;
    // Memory Village anchors are intentionally outside the nearest city and must land at a
    // clear lane entrance, not at the anchor's fixed south-side offset or a plot center.
    // Use lane 1 centerline near the first plot along the lane to avoid plot interiors
    // and to stay inside the village region (avoiding Saigon/HCM snap).
    const lanePlots = MAP_PLOTS.filter(p => p.village === s.id).sort((a, b) => {
      if (Math.abs(a.off[1] - b.off[1]) > 1e-6) return a.off[1] - b.off[1];
      return a.off[0] - b.off[0];
    });
    const firstPlot = lanePlots[0];
    let x = m.at[0], z = m.at[1];
    if (firstPlot) {
      // Land on the lane centerline (perp offset 0) at the first plot's along-lane position
      const side = Math.sign(firstPlot.off[1]) || -1;
      const laneDz = firstPlot.off[1] - side * (1.7 + 0.5 + 3.5);
      x = m.at[0] + firstPlot.off[0];
      z = m.at[1] + laneDz;
    } else {
      z = m.at[1] + (m.r || 10) + 3;
    }
    list.push({ g: s.g, key: s.id, icon: s.icon, name: s.name || (() => T(m.name[0], m.name[1])), x, z });
  }
  return list;
}

// a page of the path never holds more than this many stops for an under-5 (the brief: 4–7 at once)
export const LITTLE_PAGE = 6;
// split a list into even pages of at most n (8 → 4 + 4, not 6 + 2)
export const pages = (list, n) => { const k = Math.max(1, Math.ceil(list.length / n)), size = Math.ceil(list.length / k), out = []; for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size)); return out.length ? out : [[]]; };

// (Play reading trial, owner 11 Oct 2026 AEDT; docs/cores/play-reading.md) "Reading corner", right after "Letters and words".
// Its ten games, with their ages, are added only while Studio's readingTrial switch is on (js/games/readingmenu.js), so
// with the switch off the area has no games and is never shown.
AREAS.splice(AREAS.findIndex(a => a.key === 'words') + 1, 0, { key: 'reading', icon: '📖', name: () => T('Reading corner', 'Góc đọc') });

