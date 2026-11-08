// (r90) The second set of games and stories, and the two Studio switches that hold them back (owner, 24 Oct AEDT: "make
// sure these can be turned on and off in Studio so I can hold them off until I want to release; switched off it should
// show as coming soon in the game"). Off (the default until the owner releases them): the menus show one "Coming soon"
// tile instead, the Simple screen leaves them out. On: they unlock as js/content/unlocks.ts says (each original in the
// area or shelf finished 3 times). A tester device sees them early through its preview list (releaseOn).
import { releaseOn, CUSTOM, earlyDays } from '../custom.js';
import { calOpen, openDate, weekOf, addDays } from './releasecal-core.js';

export const SECOND_SET_GAMES: Record<string, string[]> = {
  animals: ['crabwalk', 'whohome', 'mumbaby', 'feedzoo', 'buffalo', 'reefcount', 'tracks', 'catchfish', 'emueggs', 'reefclean'],
  music: ['dantranh', 'bushband', 'drumecho', 'loudquiet', 'songsteps'],
  art: ['stamps', 'weave', 'mosaic', 'nonla', 'aodai', 'kitepaint', 'shades', 'shadowpic', 'spotdiff', 'hiddenpic', 'finishpic', 'scene', 'paperfold', 'lacquer', 'scratch', 'bubblepaint', 'fingerpaint', 'weatherpaint', 'thocam', 'pixelpic', 'fireworks', 'masks', 'makeface', 'gallery', 'leafrub'],
  // (v1.08 maths, owner 3 Nov 2026 AEDT: "switch on the 7 held-back maths games") numline, tenframe, dice, evenodd, measure,
  // beforeafter and halves are no longer held: they are ordinary Con số games now
  numbers: [],
  shapes: ['solids', 'townshapes', 'tiles', 'turnit', 'shapetrain', 'linescurves', 'foldbox'],
  words: ['whichgroup', 'storyorder', 'guesswhat', 'actions', 'position'],
  reading: ['rd_blend', 'rd_hats', 'rd_endings', 'rd_compound', 'rd_labels', 'rd_signs', 'rd_questions', 'rd_many', 'rd_caps', 'rd_poem', 'rd_missing', 'rd_book'],
  me: ['myday', 'plate', 'kindchoice'],
  play: ['hideseek', 'duckgoose', 'redgreen', 'simon', 'eggspoon', 'chairs', 'kicktokick', 'nippers', 'hoops', 'tag'],
  vietnam: ['rongran', 'meochuot', 'cuopco', 'keocua', 'danhdao', 'nemcon', 'trongnu', 'duathuyen', 'banhchung', 'denongsao', 'mualan', 'cayneu'],
  travel: ['cyclo', 'reunification', 'lighthouse', 'operaseats', 'outback', 'floating', 'airport', 'postcard'],
  thinking: ['minichess', 'cotuong', 'whosits', 'pipes'],
  money: ['savegoal', 'pocketweek', 'pricetags', 'busfare', 'lemonade', 'party', 'recycle', 'tetmarket', 'bank', 'sharefair']
};

export const SECOND_SET_TALES: Record<string, string[]> = {
  "🇻🇳": [
    "traucau",
    "hoacuctrang",
    "hobabe",
    "cayneutale",
    "trecoc",
    "datrang",
    "trangquynh",
    "luubinh",
    "caichoi",
    "hoamuoigio",
    "chimkhach",
    "thantrutroi",
    "hatlua",
    "colau",
    "tichchu",
    "thila",
    "hoaban",
    "conkhi",
    "nangut",
    "bacogai"
  ],
  "🇦🇺": [
    "platypus",
    "wombatdig",
    "koaladay",
    "kookaburra",
    "penguinparade",
    "reefturtle",
    "echidna",
    "bilby",
    "lyrebird",
    "capelighthouse"
  ],
  "🇨🇳": [
    "peachgarden",
    "tensuns",
    "jaderabbit",
    "mulan",
    "dragonboat",
    "movemountain"
  ],
  "🇮🇳": [
    "tortoisegeese",
    "fourfriends",
    "birbal",
    "tenaliraman",
    "goldenswan",
    "mousenet"
  ],
  "🌍": [
    "tortoisehare",
    "lionmouse",
    "antgrasshopper",
    "redhen",
    "gingerbread",
    "anansi",
    "stonesoup",
    "turnip",
    "billygoats",
    "shoemaker",
    "momotaro",
    "turtlepalace"
  ],
  "world": [
    "tortoisehare",
    "lionmouse",
    "antgrasshopper",
    "redhen",
    "gingerbread",
    "anansi",
    "stonesoup",
    "turnip",
    "billygoats",
    "shoemaker",
    "momotaro",
    "turtlepalace"
  ]
};

const GAME_IDS = new Set<string>(), TALE_IDS = new Set<string>();
for (const ids of Object.values(SECOND_SET_GAMES)) ids.forEach(id => GAME_IDS.add(id));
for (const ids of Object.values(SECOND_SET_TALES)) ids.forEach(id => TALE_IDS.add(id));

export const isSecondGame = (id: string): boolean => GAME_IDS.has(id);
export const isSecondTale = (id: string): boolean => TALE_IDS.has(id);
/** switched off in Studio (or never switched on): not offered to children yet */
export const gamesHeld = (): boolean => !releaseOn('newGames', false);
export const storiesHeld = (): boolean => !releaseOn('newStories', false);
// (v1.08b story) the release calendar (js/content/releasecal.ts): on its day an item opens for everyone, with no wait
export const calMoves = () => { const c = (CUSTOM as any).releaseCalendar; return c && typeof c === 'object' && c.moves && typeof c.moves === 'object' ? c.moves : null; };
export const calDue = (type: 'game' | 'story', id: string): boolean => calOpen(type + ':' + id, calMoves(), new Date(), earlyDays());
export const heldGame = (id: string): boolean => isSecondGame(id) && gamesHeld() && !calDue('game', id);
export const heldTale = (id: string): boolean => isSecondTale(id) && storiesHeld() && !calDue('story', id);
/** (v1.08b story) how many of these held ids open next week (the Coming soon tile's teaser, "Tuần sau: 3 trò mới") */
export const calNextWeek = (type: 'game' | 'story', ids: string[], now: Date = new Date()): number => {
  const from = addDays(weekOf(now), 7), to = addDays(from, 7), m = calMoves();
  return ids.filter(id => { const d = openDate(type + ':' + id, m); return d >= from && d < to; }).length;
};
