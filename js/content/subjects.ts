// (v1.08c parents, owner's plan docs/plans/links-rollout-install.md part 5, items 1 and 2) the five school subjects a
// grown-up sees in the learning report, and the level that follows the child per subject.
//   - subjectOf(game): which subject a game practises (Vietnamese, English, Maths, Science, Money), from its area in
//     js/content/activities.ts GAME_INFO and the Học vui corner links (js/content/hocvui.ts); null for the rest
//   - the per-subject level: every finished or abandoned game of a subject adds a score (3, 2 or 1 stars, 0 for leaving
//     it); five good wins out of the last six move that subject one step harder, three times left or one-star out of
//     the last six one step easier. The step is kept per child: profile.subjAuto = { math: { r: [scores], s: step } }.
//   - the grown-up's own choice per subject (profile.subjPin = { math: 'hard' }) always wins over the automatic step;
//     with no pin, the child's level (profile.difficulty) moved by the step. Talent is reached only by a grown-up.
//   - learningWeek(): the week's practice per subject from the play report's days (js/report.ts keeps
//     day.sub = { math: [games, wins] } and day.gp = { gameId: [games, wins, best stars] }), what went well and one game
//     suggested for next week.
// No DOM here: the report window and the picture are js/learnreport.ts.
import { GAME_INFO } from './activities.js';
import { CORNER_LINKS } from './hocvui.js';

export const SUBJECTS = ['vi', 'en', 'math', 'sci', 'money'] as const;
export type Subject = typeof SUBJECTS[number];
/** the subject's name and picture (our own drawings in js/art) */
export const SUBJECT_INFO: Record<Subject, { en: string; vi: string; icon: string }> = {
  vi: { en: 'Vietnamese', vi: 'Tiếng Việt', icon: 'hv:vi' },
  en: { en: 'English', vi: 'Tiếng Anh', icon: 'hv:en' },
  math: { en: 'Maths', vi: 'Toán', icon: 'hv:math' },
  sci: { en: 'Science', vi: 'Khoa học', icon: 'hv:sci' },
  money: { en: 'Money', vi: 'Tiền', icon: '💰' }
};
export const LEVELS = ['easy', 'medium', 'hard', 'talent'] as const;
export type Level = typeof LEVELS[number];
export const LEVEL_NAMES: Record<Level, [string, string]> = { easy: ['Easy', 'Dễ'], medium: ['Medium', 'Vừa'], hard: ['Hard', 'Khó'], talent: ['Talent', 'Tài năng'] };

const AREA_SUBJECT: Record<string, Subject> = { hv_vi: 'vi', hv_en: 'en', reading: 'en', numbers: 'math', shapes: 'math', hv_sci: 'sci', money: 'money' };
/** the subject a game practises, or null */
export function subjectOf(id: string): Subject | null {
  const area = (GAME_INFO[id] || [])[0];
  if (area && AREA_SUBJECT[area]) return AREA_SUBJECT[area];
  if (CORNER_LINKS.hv_vi.includes(id)) return 'vi';
  if (CORNER_LINKS.hv_en.includes(id)) return 'en';
  if (CORNER_LINKS.hv_math.includes(id)) return 'math';
  if (CORNER_LINKS.hv_sci.includes(id)) return 'sci';
  return null;
}
/** every game of a subject (for the suggestion and for clearing the child's own picks when a grown-up sets a level) */
export const gamesOf = (s: Subject): string[] => Object.keys(GAME_INFO).concat(...Object.values(CORNER_LINKS)).filter((id, i, a) => a.indexOf(id) === i && subjectOf(id) === s);

// ---------- the level that follows the child ----------
type Auto = { r: number[]; s: number };
type Kid = { age?: string; difficulty?: string; subjAuto?: Record<string, Auto>; subjPin?: Record<string, string>; [k: string]: any };
export const UP = { of: 6, wins: 5, three: 4 }, DOWN = { of: 6, poor: 3 }, MAX_STEP = 2;
const autoOf = (p: Kid, s: Subject): Auto => { const A = p.subjAuto = p.subjAuto && typeof p.subjAuto === 'object' ? p.subjAuto : {}; const a = A[s] = A[s] && Array.isArray(A[s].r) ? A[s] : { r: [], s: 0 }; a.s = Math.max(-MAX_STEP, Math.min(MAX_STEP, Math.round(+a.s || 0))); return a; };
/** a finished game (stars 1 to 3) or a game left before the end (0): returns the step it made (-1, 0 or 1) */
export function noteResult(p: Kid, id: string, score: number): number {
  const s = subjectOf(id); if (!s || p.age !== 'big') return 0;   // (under-5s always play gently: nothing to follow)
  const a = autoOf(p, s); a.r.push(Math.max(0, Math.min(3, Math.round(score)))); a.r = a.r.slice(-UP.of);
  const last = a.r, wins = last.filter(x => x > 0).length, three = last.filter(x => x === 3).length, poor = last.filter(x => x <= 1).length;
  let step = 0;
  if (last.length >= UP.of && wins >= UP.wins && three >= UP.three && a.s < MAX_STEP) step = 1;
  else if (last.length >= 3 && poor >= DOWN.poor && a.s > -MAX_STEP) step = -1;
  if (step) { a.s += step; a.r = []; }   // (the next move needs fresh games at the new level)
  return step;
}
/** the grown-up's own level for this subject, or '' for "follow the child" */
export const pinOf = (p: Kid, s: Subject): string => { const v = (p.subjPin || {})[s]; return LEVELS.includes(v as Level) ? v : ''; };
/** the level this subject plays at now: the grown-up's pin, else the child's level moved by the subject's step */
export function subjectLevel(p: Kid, s: Subject): Level {
  const base = (LEVELS.includes(p.difficulty as Level) ? p.difficulty : 'easy') as Level, pin = pinOf(p, s);
  if (pin) return pin as Level;
  if (p.age !== 'big') return base;
  const i = LEVELS.indexOf(base), top = Math.max(i, 2), step = (p.subjAuto && p.subjAuto[s] && +p.subjAuto[s].s) || 0;
  return LEVELS[Math.max(0, Math.min(top, i + step))];
}
/** the level a game starts at for this child (the child's own pick inside the game still comes first, js/main.ts) */
export function levelFor(p: Kid, id: string): Level {
  const s = subjectOf(id);
  return s ? subjectLevel(p, s) : ((LEVELS.includes(p.difficulty as Level) ? p.difficulty : 'easy') as Level);
}
/** a grown-up sets (or clears, with '') the level of a subject: the child's own earlier picks in that subject's games
 *  are forgotten, so the grown-up's choice is the one that plays */
export function setPin(p: Kid, s: Subject, lv: string) {
  const P = p.subjPin = { ...(p.subjPin || {}) };
  if (LEVELS.includes(lv as Level)) P[s] = lv; else delete P[s];
  if (p.gameDiff) for (const id of gamesOf(s)) delete p.gameDiff[id];
}

// ---------- the week, per subject ----------
type Day = { min?: number; games?: number; sub?: Record<string, [number, number]>; gp?: Record<string, [number, number, number]> };
export type WeekSubject = { s: Subject; games: number; wins: number; level: Level; pinned: boolean };
export type Week = { subjects: WeekSubject[]; total: number; well: { kind: 'game' | 'subject' | 'step'; id: string; s?: Subject; wins?: number; stars?: number }[]; suggest: string | null; quiet: Subject | null };
const dayKeyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** the last seven days' keys, oldest first (local time, like js/report.ts) */
export const weekKeys = (now = new Date()) => [...Array(7)].map((_, k) => { const t = new Date(now); t.setDate(t.getDate() - 6 + k); return dayKeyOf(t); });
/** this week's learning for a child; ok(id) says whether a game may be suggested (open, switched on, right age) */
export function learningWeek(p: Kid, ok: (id: string) => boolean = () => true, now = new Date()): Week {
  const days: Record<string, Day> = (p.stats && p.stats.days) || {}, keys = weekKeys(now);
  const per: Record<string, [number, number]> = {}, gp: Record<string, [number, number, number]> = {};
  for (const k of keys) { const d = days[k]; if (!d) continue;
    for (const [s, v] of Object.entries(d.sub || {})) { const a = per[s] = per[s] || [0, 0]; a[0] += +v[0] || 0; a[1] += +v[1] || 0; }
    for (const [id, v] of Object.entries(d.gp || {})) { const a = gp[id] = gp[id] || [0, 0, 0]; a[0] += +v[0] || 0; a[1] += +v[1] || 0; a[2] = Math.max(a[2], +v[2] || 0); } }
  const subjects = SUBJECTS.map(s => ({ s, games: (per[s] || [0])[0], wins: (per[s] || [0, 0])[1], level: subjectLevel(p, s), pinned: !!pinOf(p, s) }));
  const total = subjects.reduce((a, x) => a + x.games, 0);
  // what went well: the best game (most wins, then stars), the subject with the most wins, a subject that moved up
  const well: Week['well'] = [];
  const best = Object.entries(gp).filter(([id, v]) => v[1] > 0 && subjectOf(id)).sort((a, b) => b[1][1] - a[1][1] || b[1][2] - a[1][2])[0];
  if (best) well.push({ kind: 'game', id: best[0], s: subjectOf(best[0]) as Subject, wins: best[1][1], stars: best[1][2] });
  const topSub = subjects.filter(x => x.wins > 0 && (!best || x.s !== subjectOf(best[0]))).sort((a, b) => b.wins - a.wins)[0];
  if (topSub) well.push({ kind: 'subject', id: topSub.s, s: topSub.s, wins: topSub.wins });
  for (const x of subjects) if (!x.pinned && p.age === 'big' && ((p.subjAuto || {})[x.s] || { s: 0 }).s > 0 && well.length < 3) well.push({ kind: 'step', id: x.s, s: x.s });
  // one game for next week: in the subject practised least (Science and Money count too), one this child has played
  // least; the same week always suggests the same game
  const quiet = [...subjects].sort((a, b) => a.games - b.games || SUBJECTS.indexOf(a.s) - SUBJECTS.indexOf(b.s)).find(x => gamesOf(x.s).some(ok));
  let suggest: string | null = null;
  if (quiet) {
    const played: Record<string, number> = (p.stats && p.stats.played) || {}, list = gamesOf(quiet.s).filter(ok);
    const least = Math.min(...list.map(id => played[id] || 0)), pool = list.filter(id => (played[id] || 0) === least);
    const seed = [...keys[6]].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    suggest = pool[seed % pool.length] || null;
  }
  return { subjects, total, well, suggest, quiet: quiet ? quiet.s : null };
}
/** the play report's counting (js/report.ts): one more game of this subject today */
export function countDay(d: Day, id: string, won: boolean, stars: number) {
  const s = subjectOf(id); if (!s) return;
  const sub = d.sub = d.sub || {}, a = sub[s] = sub[s] || [0, 0]; a[0]++; if (won) a[1]++;
  const gp = d.gp = d.gp || {}, g = gp[id] = gp[id] || [0, 0, 0]; g[0]++; if (won) { g[1]++; g[2] = Math.max(g[2], stars || 1); }
  const ids = Object.keys(gp); if (ids.length > 24) ids.sort((x, y) => gp[x][0] - gp[y][0]).slice(0, ids.length - 24).forEach(x => delete gp[x]);
}
