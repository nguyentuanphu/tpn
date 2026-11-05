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
import { heldGame, calDue } from './secondset.js';
import { inSeason } from './festseason.js'; // (v1.08b games) festival games only in their season

// the areas, in the order the path visits them; a child who can't read knows each one by its picture
export const AREAS = [
  { key: 'animals', icon: '🐶', name: () => T('Animals', 'Con vật') },
  { key: 'music', icon: '🎵', name: () => T('Music', 'Âm nhạc') },
  { key: 'art', icon: '🎨', name: () => T('Colours and pictures', 'Màu sắc và tranh') },
  { key: 'numbers', icon: 'hv:math', name: () => T('Maths', 'Toán') }, // (v1.08b games) Con số becomes the Toán corner of Học vui
  { key: 'shapes', icon: '🔷', name: () => T('Shapes', 'Hình khối') },
  { key: 'words', icon: '🔤', name: () => T('Letters and reading', 'Chữ và đọc') }, // (v1.08b games) letter and word games in the child's own language
  { key: 'me', icon: '💛', name: () => T('Me and my family', 'Em và gia đình') },
  { key: 'play', icon: '🪁', name: () => T('Play outside', 'Chơi ngoài trời') },
  { key: 'vietnam', icon: '🇻🇳', name: () => T('Vietnamese games', 'Trò chơi Việt Nam') },
  { key: 'travel', icon: '🚋', name: () => T('Going places', 'Đi đây đi đó') },
  { key: 'thinking', icon: '🧠', name: () => T('Big thinkers', 'Suy nghĩ giỏi') },
  // (round S, owner plan 8 Oct) the money games, in the child's home currency
  { key: 'money', icon: '💰', name: () => T('Money and shopping', 'Tiền và mua sắm') },
  // (Học vui, owner's plan 1 Nov 2026 AEDT, docs/learn-tab/PLAN.md) corners of the Fun learning tab. (v1.08b games, owner
  // 3 Nov 2026 AEDT: one home per game) no link tiles any more: every game lives in one corner only; the old empty Maths
  // corner (hv_math) is gone, Con số (numbers) is the Toán corner now
  { key: 'hv_vi', icon: 'hv:vi', name: () => T('Vietnamese', 'Tiếng Việt') },
  { key: 'hv_en', icon: 'hv:en', name: () => T('English', 'Tiếng Anh') },
  { key: 'hv_sci', icon: 'hv:sci', name: () => T('Science', 'Khoa học') },
  // (v1.08b games) the festival games, each open only in its festival's season (js/content/festseason.ts)
  { key: 'festival', icon: 'fg:area', name: () => T('Festival games', 'Trò chơi lễ hội') }
];

// id: [area, youngest age (2 = everyone, 5 = big kids), how hard (1 easy · 2 a bit harder · 3 hardest)]
export const GAME_INFO: Record<string, [string, number, number]> = {
  bunny: ['animals', 2, 1], koala: ['animals', 2, 1], animalsounds: ['animals', 2, 1], duckmaze: ['animals', 2, 1], eggs: ['animals', 2, 1], oddone: ['animals', 3, 2], goat: ['vietnam', 3, 2], blindtag: ['vietnam', 3, 2],
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
  rd_blend: ['reading', 3, 1], rd_hats: ['hv_vi', 3, 1] /* (v1.08b games) â ê ô: Tiếng Việt */, rd_endings: ['reading', 3, 1], rd_compound: ['reading', 3, 1], rd_labels: ['reading', 3, 1], rd_signs: ['reading', 3, 1], rd_questions: ['reading', 3, 1], rd_many: ['reading', 3, 1], rd_caps: ['reading', 3, 1], rd_poem: ['reading', 3, 1], rd_missing: ['reading', 3, 1], rd_book: ['reading', 3, 1],
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
  // (v1.08b games) First Sounds teaches English letter sounds: Tiếng Anh; Two Homes Words teaches Vietnamese words of the
  // regions: Tiếng Việt. Letter Hunt and Opposites play in the child's own language: Chữ và đọc
  letters: ['words', 4, 2], phonics: ['hv_en', 4, 2], opposites: ['words', 4, 2], words: ['hv_vi', 5, 2],
  // (v1.08 english) First Words is Chinese and Hindi, not English: it left the English corner for Going places, beside China Town and India Village
  firstwords: ['travel', 5, 3],
  feelings: ['me', 2, 1], bodyparts: ['me', 2, 1], familyquiz: ['me', 3, 2], fruitparade: ['play', 2, 1], sparkleorchard: ['play', 2, 1], sparklefruitbar: ['play', 2, 1],
  kite: ['play', 2, 1], hopscotch: ['play', 3, 1], tug: ['play', 2, 1], skipping: ['play', 3, 2], sackrace: ['play', 3, 1], nemlon: ['play', 3, 1], marbles: ['play', 4, 2], cricket: ['play', 5, 2], mrwolf: ['play', 3, 2], dacau: ['play', 4, 2],
  dragon: ['vietnam', 3, 1], cacuangua: ['vietnam', 5, 2], meochuot: ['vietnam', 3, 1], cuopco: ['vietnam', 3, 1], keocua: ['vietnam', 3, 1], danhdao: ['vietnam', 4, 2], nemcon: ['vietnam', 3, 1], trongnu: ['vietnam', 3, 1], duathuyen: ['vietnam', 3, 1], datnieu: ['vietnam', 2, 1],
  banhchung: ['vietnam', 2, 1], denongsao: ['vietnam', 2, 1], mualan: ['vietnam', 2, 2], cayneu: ['vietnam', 2, 1], oantuti: ['vietnam', 3, 1], chuyen: ['vietnam', 5, 2], oanquan: ['vietnam', 5, 3], caro: ['vietnam', 5, 3], tienlen: ['vietnam', 5, 3], tienlenbac: ['vietnam', 5, 3],
  traffic: ['travel', 2, 1], ferries: ['travel', 3, 1], tram: ['travel', 3, 1], balloon: ['travel', 2, 1], bubbles: ['travel', 2, 1], market: ['travel', 3, 2], sortout: ['travel', 3, 2], order: ['travel', 5, 2],
  robot: ['thinking', 5, 3], maze: ['thinking', 5, 2], snakes: ['thinking', 5, 2], snap: ['thinking', 3, 2],
  // (Học vui) the six science experiments and the two Tiếng Việt games (js/games/science.ts, js/games/tiengviet.ts)
  sci_float: ['hv_sci', 2, 1], sci_magnet: ['hv_sci', 3, 1], sci_ramp: ['hv_sci', 3, 1], sci_seesaw: ['hv_sci', 3, 2], sci_shadow: ['hv_sci', 3, 2], sci_sound: ['hv_sci', 2, 1],
  vi_tones: ['hv_vi', 3, 2], vi_build: ['hv_vi', 4, 2],
  heodat: ['money', 2, 1], coinnote: ['money', 2, 1], lixi: ['money', 2, 1], needwant: ['money', 3, 1], cheaper: ['money', 3, 1], bahu: ['money', 3, 2], shoplist: ['money', 3, 2], waitgrow: ['money', 3, 2], shopkeep: ['money', 4, 2], barter: ['money', 4, 2],
  // (v1.08 science) the twelve new science experiments (js/games/science2.ts)
  sci_plant: ['hv_sci', 2, 1], sci_water: ['hv_sci', 3, 1], sci_daynight: ['hv_sci', 3, 1], sci_seasons: ['hv_sci', 3, 1], sci_homes: ['hv_sci', 2, 1], sci_body: ['hv_sci', 2, 1],
  sci_colours: ['hv_sci', 2, 1], sci_ice: ['hv_sci', 3, 1], sci_rainbow: ['hv_sci', 3, 2], sci_bulb: ['hv_sci', 4, 2], sci_gears: ['hv_sci', 4, 2], sci_recycle: ['hv_sci', 3, 1],
  // (v1.08 english) the English corner's own games (js/games/english.ts)
  en_words: ['hv_en', 2, 1], en_listen: ['hv_en', 3, 1], en_say: ['hv_en', 3, 2], en_abc: ['hv_en', 2, 1], en_count: ['hv_en', 2, 1], en_sentence: ['hv_en', 4, 2], en_greet: ['hv_en', 3, 1], en_colshape: ['hv_en', 2, 1],
  // (v1.08 maths) the 21 new maths games, in Con số (linked into Học vui > Toán: js/content/hocvui.ts)
  mx_bonds: ['numbers', 4, 2], mx_takeaway: ['numbers', 3, 1], mx_skip: ['numbers', 5, 2], mx_patterns: ['numbers', 3, 1], mx_shapehunt: ['numbers', 3, 1], mx_symmetry: ['numbers', 4, 2],
  mx_heavy: ['numbers', 3, 1], mx_full: ['numbers', 3, 1], mx_pizza: ['numbers', 4, 2], mx_graph: ['numbers', 4, 2], mx_calendar: ['numbers', 5, 2], mx_quarter: ['numbers', 5, 2],
  mx_sudoku: ['numbers', 5, 3], mx_bigger: ['numbers', 3, 1], mx_doubles: ['numbers', 4, 2], mx_tens: ['numbers', 5, 2], mx_missing: ['numbers', 3, 1], mx_solids3d: ['numbers', 4, 2],
  mx_leftright: ['numbers', 3, 1], mx_sprint: ['numbers', 5, 3], mx_grouping: ['numbers', 5, 2],
  // (v1.08 vietnamese) ten more Tiếng Việt games (js/games/tiengviet2.ts)
  vi_tonemean: ['hv_vi', 3, 1], vi_rhyme: ['hv_vi', 4, 2], vi_letters: ['hv_vi', 4, 2], vi_opposite: ['hv_vi', 3, 1], vi_cadao: ['hv_vi', 4, 2],
  vi_tucngu: ['hv_vi', 5, 2], vi_readalong: ['hv_vi', 4, 2], vi_sentence: ['hv_vi', 5, 2], vi_dictation: ['hv_vi', 5, 3], vi_riddle: ['hv_vi', 3, 1],
  // (v1.08 money) eleven more money games for ages 4 to 9 (js/games/money3.ts): open at once, not a second set (js/content/unlocks.ts)
  shoppay: ['money', 3, 1], givechange: ['money', 4, 2], toysave: ['money', 4, 2], needsfirst: ['money', 3, 1], pricesort: ['money', 3, 1], marketday: ['money', 4, 2],
  coinsort: ['money', 3, 1], makeamount: ['money', 3, 2], budgetpicnic: ['money', 4, 2], chores: ['money', 4, 2], twomoney: ['money', 3, 1],
  // (v1.08b games) one game per festival (js/content/festgames108b.ts)
  fg_tet: ['festival', 3, 1], fg_ramthang1: ['festival', 3, 1], fg_giotohung: ['festival', 3, 1], fg_doanngo: ['festival', 3, 1], fg_vulan: ['festival', 3, 1], fg_midautumn: ['festival', 3, 1], fg_ongtao: ['festival', 3, 1], fg_thieunhi: ['festival', 3, 1], fg_quockhanh: ['festival', 3, 1], fg_nhagiao: ['festival', 3, 1], fg_easter: ['festival', 3, 1], fg_mothersday: ['festival', 3, 1], fg_fathersday: ['festival', 3, 1], fg_halloween: ['festival', 3, 1], fg_christmas: ['festival', 3, 1], fg_newyear: ['festival', 3, 1], fg_ausday: ['festival', 3, 1], fg_cleanup: ['festival', 3, 1], fg_harmony: ['festival', 3, 1], fg_holi: ['festival', 3, 1], fg_anzac: ['festival', 3, 1], fg_reconciliation: ['festival', 3, 1], fg_naidoc: ['festival', 3, 1], fg_diwali: ['festival', 3, 1],
  // (v1.08b games) the new games of the thin corners (js/content/games108b.ts)
  en_animalsay: ['hv_en', 2, 1], en_opposite: ['hv_en', 3, 1], en_feel: ['hv_en', 2, 1], en_weather: ['hv_en', 3, 1], en_routine: ['hv_en', 3, 2], en_where: ['hv_en', 4, 2],
  en_verbs: ['hv_en', 3, 1], en_shop: ['hv_en', 4, 2], en_teens: ['hv_en', 4, 2], en_body: ['hv_en', 2, 1], en_wh: ['hv_en', 5, 2], en_mydaystory: ['hv_en', 4, 2],
  me_tree: ['me', 3, 2], me_wash: ['me', 2, 1], me_safe: ['me', 3, 1], me_help: ['me', 3, 1], me_calm: ['me', 3, 1], me_table: ['me', 3, 1],
  th_balance: ['thinking', 4, 2], th_clues: ['thinking', 4, 2], th_robot: ['thinking', 5, 3], th_changed: ['thinking', 4, 2], th_count: ['thinking', 4, 2], th_belong: ['thinking', 3, 1],
  vi_poem: ['hv_vi', 4, 2], vi_tulay: ['hv_vi', 5, 2], vi_sx: ['hv_vi', 5, 3],
  // (v1.08d s2au) Season 2, Australia (js/content/s2au-games.ts): in Going places, found at their region's stands
  s2a_snorkel: ['travel', 3, 1], s2a_turtle: ['travel', 3, 1], s2a_reefquiz: ['travel', 4, 2]
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
  return { id, area: AREAS.some(a => a.key === c.area) ? c.area : area, ageMin: c.little === true ? 2 : c.little === false ? 5 : age, level, hidden: !itemEnabled('game', id) || !inSeason(id) || (id === 'sparklefruitbar' && !testerArcadeAvailable('sparklefruitbar','single')) || c.hide === true || held || fruitHeld || orchardHeld || (id.startsWith('s2a_') && !calDue('game', id)) }; // (v1.08d s2au) a Season 2 game waits for its region's day
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
// (v1.08b games) the Học vui tab's corners, in the order shown, on the Play hub and on the Simple screen's Học vui button;
// every other area is a Vui chơi (play) area
export const LEARN_CORNERS = ['hv_vi', 'hv_en', 'numbers', 'shapes', 'money', 'hv_sci', 'words', 'reading', 'me'];

