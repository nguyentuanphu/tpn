// (v1.08b story) The small part of the release calendar the game needs at start-up (PERF-001): each held-back item's
// day and whether it has come. The rest (names, what's new, the count lines) is js/content/releasecal.ts, loaded by
// the screens that show a calendar, by Studio, the website and the server.
import { CAL_WEEKS } from './releasecal-items.js';

export type CalMoves = Record<string, string>;
const DAY = 864e5;
export const ISO = /^\d{4}-\d{2}-\d{2}$/;
export const dayOf = (s: string): Date => new Date(s + 'T00:00:00');
export const isoDay = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** the Monday of the week a day is in (weeks start on Monday, like the Saturday push's week) */
export const weekOf = (d: Date | string): string => { const x = typeof d === 'string' ? dayOf(d) : new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return isoDay(x); };
export const addDays = (s: string, n: number): string => { const d = dayOf(s); d.setDate(d.getDate() + n); return isoDay(d); };
/** whole days from `now` to the day `s` starts (0 today, negative once it has passed) */
export const daysUntil = (s: string, now: Date = new Date()): number => Math.round((+dayOf(s) - +dayOf(isoDay(now))) / DAY);
// the new things of this round with a fixed day (owner, 3-4 Nov 2026 AEDT: docs/plans/v109-extras.md); other helpers add
// theirs in their own block
export const CAL_DAYS: Record<string, string> = { 'chapter:ch4': '2026-12-04', 'chapter:ch5': '2027-01-08', 'chapter:finale': '2027-02-06',
  // (v1.08d s2vn) Season 2, Vietnam: each region, its three games and its lantern chapter open together (js/content/s2vn.ts)
  'feature:s2_mekong': '2027-02-15', 'chapter:ch6': '2027-02-15',
  'feature:s2_halong': '2027-03-15', 'chapter:ch7': '2027-03-15',
  'feature:s2_sapa': '2027-04-12', 'chapter:ch8': '2027-04-12',
  'feature:s2_taynguyen': '2027-05-10', 'chapter:ch9': '2027-05-10' };
// (v1.08d s2au) Season 2, Australia: each region opens with its friend, food and three games on its day (two weeks after
// each of s2vn's Vietnamese regions); its games follow the region's day (CAL_LINKS: moving the region in Studio moves
// them too); the lantern chapters 10 to 12 come after chapter 9 (js/content/s2au.ts)
Object.assign(CAL_DAYS, { 'feature:s2au_gbr': '2027-02-26', 'feature:s2au_tas': '2027-03-26', 'feature:s2au_perth': '2027-04-23',
  'chapter:ch10': '2027-05-21', 'chapter:ch11': '2027-06-04', 'chapter:ch12': '2027-06-18' });
/** an item that opens with another (a region's games with the region) */
export const CAL_LINKS: Record<string, string> = { 'game:s2a_snorkel': 'feature:s2au_gbr', 'game:s2a_turtle': 'feature:s2au_gbr', 'game:s2a_reefquiz': 'feature:s2au_gbr',
  'game:s2a_wombat': 'feature:s2au_tas', 'game:s2a_devil': 'feature:s2au_tas', 'game:s2a_cradle': 'feature:s2au_tas',
  'game:s2a_quokka': 'feature:s2au_perth', 'game:s2a_swan': 'feature:s2au_perth', 'game:s2a_beach': 'feature:s2au_perth' };
// (v1.08d s2vn) Season 2, Vietnam: a region's three games open on the region's day (and move with it)
Object.assign(CAL_LINKS, Object.fromEntries([
  ['s2_mekong', 'mk_sampan mk_caybeo mk_count'], ['s2_halong', 'hl_cave hl_rocks hl_nets'], ['s2_sapa', 'sp_terrace sp_seasons sp_brocade'], ['s2_taynguyen', 'tn_gong tn_nharong tn_elephant']
].flatMap(([r, ids]) => ids.split(' ').map(id => ['game:' + id, 'feature:' + r]))));
let DATES: Map<string, string> | null = null;
const dates = () => { if (DATES) return DATES; DATES = new Map(Object.entries(CAL_DAYS));
  for (const [date, v] of Object.entries(CAL_WEEKS)) { const [g, st] = v.split('|'); for (const id of g.split(' ').filter(Boolean)) DATES.set('game:' + id, date); for (const id of (st || '').split(' ').filter(Boolean)) DATES.set('story:' + id, date); }
  return DATES; };
export const inCalendar = (key: string): boolean => dates().has(key) || key in CAL_LINKS;
/** the day an item opens (with the owner's move), or '' when it is not in the calendar */
export function openDate(key: string, moves?: CalMoves | null): string {
  if (CAL_LINKS[key]) return openDate(CAL_LINKS[key], moves);
  const d0 = dates().get(key); if (!d0) return '';
  const d = moves && moves[key]; return typeof d === 'string' && ISO.test(d) ? d : d0;
}
/** has the item's day come? (`early`: a tester device sees it that many days before) */
export function calOpen(key: string, moves?: CalMoves | null, now: Date = new Date(), early = 0): boolean {
  const d = openDate(key, moves); return !!d && daysUntil(d, now) <= Math.max(0, early);
}
