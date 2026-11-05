// (v1.08d valley, PERF-001) which festival each festival game belongs to, without the games' questions: the valley needs
// only this map before the child moves (a game's place and its season); the questions (js/content/festgames108b.ts) load
// with the game. No imports, so the voice tool can read it. A check (festgameids, tests/checks/startup.mts) keeps the two
// lists the same.
export const FEST_GAME_FESTS = ['tet', 'ramthang1', 'giotohung', 'doanngo', 'vulan', 'midautumn', 'ongtao', 'thieunhi', 'quockhanh', 'nhagiao',
  'easter', 'mothersday', 'fathersday', 'halloween', 'christmas', 'newyear', 'ausday', 'cleanup', 'harmony', 'holi', 'anzac', 'reconciliation', 'naidoc', 'diwali'];
/** the festival game of a festival, and the festival of a game */
export const FEST_GAME_OF: Record<string, string> = Object.fromEntries(FEST_GAME_FESTS.map(f => [f, 'fg_' + f]));
export const FEST_OF_GAME: Record<string, string> = Object.fromEntries(FEST_GAME_FESTS.map(f => ['fg_' + f, f]));
