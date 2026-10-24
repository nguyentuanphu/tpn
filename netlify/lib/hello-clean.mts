// What a device sends in its "hello" (js/players.js), checked before anything is kept (netlify/lib/players.mts): the
// device's random id, its build and session, the days it played and what was played. Anything odd is dropped; a value is
// kept only as the text or number the rule allows (a list or object that merely looks like text is not kept as itself).
// (owner repair round, 15 Oct AEDT: identity, build and version data are type-checked, `types` check.)
// (synthetic bot isolation, 20 Oct AEDT): bots tag events with isRobot: true and traffic: 'synthetic_bot' and are routed to a separate store.
import { isBuild } from './build-number.mts';

export const ID = /^[a-z0-9]{10,24}$/, WORD = /^[\w-]{1,32}$/, KEY = /^[\w .:/()'#,@-]{1,140}$/, NAME = /^[\p{L}' -]{0,20}$/u, DAY = /^\d{4}-\d{2}-\d{2}$/, FH = /^[0-9a-f]{16}$/;
export const LINES = { hello: 10, device: 30, ip: 60, newPerDay: 200 }; // (round R privacy) missing lines taken at most

// what arrived: any field may be missing or of any kind
export type Loose = Record<string, unknown>;
// [started, won, left early]
export type GameCounts = [number, number, number];
export type KidDay = { n: string, a: 'big' | 'little', m: number, sm: number, t: number, g: Record<string, GameCounts>, p: Record<string, number> };
// ms to code, to a built valley, to the first picture, from the saved copy, slowest step
export type Start = [number, number, number, 0 | 1, string];
export type HelloDay = { d: string, build: string, mins: number, games: Record<string, number>, tales: number, online: number,
  hours: Record<number, number>, kids: Record<string, KidDay>, errs: Record<string, number>, stuck: Record<string, number>,
  quits: Record<string, number>, fps: [number, number, number], starts: Start[], bat: number[] };
export type Hello = { id: string, hid: string, build: string, sid: string, started: number, lang: 'en' | 'vi' | '?', kids: number, days: HelloDay[],
  kind: 'phone' | 'tablet' | 'computer' | '?', app: boolean, os: string, br: string, sc: string, fh?: string, lines: [string, string][], isRobot?: boolean, traffic?: string };

// as a regular expression tests it (`x || ''`), but as text
export const txt = (v: unknown): string => v ? String(v) : '';
export const day = (t: number = Date.now()): string => new Date(t).toISOString().slice(0, 10);
// a whole number from 0 to max
export const int = (v: unknown, max: number): number => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
export const obj = (o: unknown): Loose => o && typeof o === 'object' && !Array.isArray(o) ? (o as Loose) : {};
export const counts = (o: unknown, max: number, n: number = 20, re: RegExp = KEY): Record<string,number> => { const out = ({} as Record<string, number>); let k = 0; for (const [a, v] of Object.entries(obj(o))) if (re.test(a) && k++ < n) out[a] = int(v, max); return out; };
export const words = (o: unknown, max: number): Record<string,number> => counts(o, max, 40, WORD);
// one child's day: first name (or none), age group, minutes, games [started, won, left early], places, stories
export const kid = (c: Loose): KidDay => ({ n: NAME.test(txt(c.n)) ? txt(c.n).trim() : '', a: c.a === 'big' ? 'big' : 'little', m: int(c.m, 24 * 60), sm: int(c.sm, 24 * 60), t: int(c.t, 200),
  g: Object.fromEntries(Object.entries(obj(c.g)).filter(([k, v]) => WORD.test(k) && Array.isArray(v)).slice(0, 40).map(([k, v]) => { const a = (v as unknown[]); return [k, ([int(a[0], 500), int(a[1], 500), int(a[2], 500)] as GameCounts)]; })),
  p: counts(c.p, 500, 30, WORD) });
export const kids = (o: unknown): Record<string,KidDay> => Object.fromEntries(Object.entries(obj(o)).filter(([k]) => WORD.test(k)).slice(0, 8).map(([k, c]) => [k, kid(obj(c))]));

// (battery round, 12 Oct) a day's drawing and battery: [minutes measured, frames drawn while a child played and something
// moved, ms spent on them, draw calls on them, pixel ratio x100 summed per minute, idle minutes, minutes on battery,
// battery used in tenths of a percent, minutes charging, seconds of that playing]
export const BAT_MAX = [24 * 60, 24 * 3600 * 240, 864e5, 24 * 3600 * 240 * 5000, 24 * 60 * 400, 24 * 60, 24 * 60, 1000, 24 * 60, 24 * 3600];
export const bat = (b: unknown): number[] => Array.isArray(b) && b.length === 10 ? BAT_MAX.map((m, i) => int(b[i], m)) : BAT_MAX.map(() => 0);
export const batAdd = (a: number[], b: number[]): number[] => BAT_MAX.map((m, i) => Math.min(m * 30, (a[i] || 0) + (b[i] || 0)));

// what a device sent, checked: anything odd is dropped
export function clean(input: unknown, now: number = Date.now()): Hello|null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const b = (input as Loose);
  if (!ID.test(txt(b.id))) return null;
  // the days played since the last hello that arrived (at most 14, none in the future, none older than 30 days);
  // an older device sends one bucket for today
  const lo = day(now - 30 * 864e5), hi = day(now + 864e5), seen = new Set();
  // where a day was played: its own build (a release or '?'), or the device's build for an older device
  const origin = (x: Loose) => typeof x.build === 'string' && (isBuild(x.build) || x.build === '?') ? x.build : (b.sid ? '?' : WORD.test(txt(b.b)) ? txt(b.b) : '?');
  const sent: unknown[] = Array.isArray(b.days) ? b.days : [{ d: day(now), m: b.m, g: b.g, t: b.t, o: b.o }];
  const days = sent.slice(0, 42).map(obj)
    .filter(x => { const d = txt(x.d); if (!DAY.test(d) || d < lo || d > hi) return false; const key = d + '|' + origin(x); if (seen.has(key)) return false; seen.add(key); return true; })
    .map(x => ({ d: txt(x.d), build: origin(x), mins: int(x.m, 24 * 60), games: words(x.g, 500), tales: int(x.t, 200), online: int(x.o, 24 * 60), // online: minutes with friends online
      hours: Object.fromEntries(Object.entries(obj(x.h)).filter(([k]) => /^([01]?\d|2[0-3])$/.test(k)).map(([k, v]) => [+k, int(v, 60)])), kids: kids(x.c),
      errs: counts(x.e, 999), stuck: counts(x.s, 999), quits: words(x.q, 500), fps: Array.isArray(x.f) ? [int(x.f[0], 1e6), int(x.f[1], 24 * 60), int(x.f[2], 24 * 60)] : [0, 0, 0],
      starts: (Array.isArray(x.st) ? x.st : []).filter(a => Array.isArray(a)).slice(0, 6).map(a => [int(a[0], 6e5), int(a[1], 6e5), int(a[2], 6e5), a[3] ? 1 : 0, /^[a-z]{1,16}$/.test(txt(a[4])) ? txt(a[4]) : '']),
      bat: bat(x.b) } as HelloDay));
  const started = b.started, l = txt(b.l), d = txt(b.d), os = txt(b.os), br = txt(b.br);
  return { id: txt(b.id), hid: /^[a-z0-9]{8,24}$/.test(txt(b.h)) ? txt(b.h) : '', build: WORD.test(txt(b.b)) ? txt(b.b) : '?', sid: /^[a-z0-9]{16}$/.test(txt(b.sid)) ? txt(b.sid) : '',
    started: typeof started === 'number' && Number.isSafeInteger(started) && started > 0 && started <= now + 300000 ? started : 0,
    lang: l === 'en' || l === 'vi' ? l : '?', kids: int(b.k, 8), days,
    kind: d === 'phone' || d === 'tablet' || d === 'computer' ? d : '?', app: !!b.a,
    os: /^(iOS|iPadOS|Android|ChromeOS|Windows|macOS|Linux|other)$/.test(os) ? os : '?', br: /^(Safari|Chrome|Edge|Firefox|Samsung|other)$/.test(br) ? br : '?', sc: /^\d{2,5}x\d{2,5}$/.test(txt(b.sc)) ? txt(b.sc) : '',
    fh: FH.test(txt(b.fh)) ? txt(b.fh) : '',
    lines: (Array.isArray(b.v) ? b.v : []).slice(0, LINES.hello).filter(v => Array.isArray(v) && /^(en|vi|zh|hi)$/.test(txt(v[0])) && typeof v[1] === 'string' && v[1].trim() && v[1].length <= 300 && !/[\u0000-\u001f<>]/.test(v[1])).map(v => ([txt(v[0]), v[1].trim()] as [string, string])),
    isRobot: b.isRobot === true && b.traffic === 'synthetic_bot', traffic: b.isRobot === true && b.traffic === 'synthetic_bot' ? 'synthetic_bot' : undefined };
}
