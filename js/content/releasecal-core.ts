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
  'feature:s2_mekong': '2027-02-15', 'chapter:ch6': '2027-02-15', 'game:mk_sampan': '2027-02-15', 'game:mk_caybeo': '2027-02-15', 'game:mk_count': '2027-02-15',
  'feature:s2_halong': '2027-03-15', 'chapter:ch7': '2027-03-15', 'game:hl_cave': '2027-03-15', 'game:hl_rocks': '2027-03-15', 'game:hl_nets': '2027-03-15',
  'feature:s2_sapa': '2027-04-12', 'chapter:ch8': '2027-04-12', 'game:sp_terrace': '2027-04-12', 'game:sp_seasons': '2027-04-12', 'game:sp_brocade': '2027-04-12',
  'feature:s2_taynguyen': '2027-05-10', 'chapter:ch9': '2027-05-10', 'game:tn_gong': '2027-05-10', 'game:tn_nharong': '2027-05-10', 'game:tn_elephant': '2027-05-10' };
let DATES: Map<string, string> | null = null;
const dates = () => { if (DATES) return DATES; DATES = new Map(Object.entries(CAL_DAYS));
  for (const [date, v] of Object.entries(CAL_WEEKS)) { const [g, st] = v.split('|'); for (const id of g.split(' ').filter(Boolean)) DATES.set('game:' + id, date); for (const id of (st || '').split(' ').filter(Boolean)) DATES.set('story:' + id, date); }
  return DATES; };
export const inCalendar = (key: string): boolean => dates().has(key);
/** the day an item opens (with the owner's move), or '' when it is not in the calendar */
export function openDate(key: string, moves?: CalMoves | null): string {
  const d0 = dates().get(key); if (!d0) return '';
  const d = moves && moves[key]; return typeof d === 'string' && ISO.test(d) ? d : d0;
}
/** has the item's day come? (`early`: a tester device sees it that many days before) */
export function calOpen(key: string, moves?: CalMoves | null, now: Date = new Date(), early = 0): boolean {
  const d = openDate(key, moves); return !!d && daysUntil(d, now) <= Math.max(0, early);
}
