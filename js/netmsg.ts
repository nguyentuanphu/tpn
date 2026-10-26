// @ts-check
import type { TradeSide, Msg } from '../types/net.js';
// Every message that comes from another device, checked in one place before the game sees it (hard rule PRIV-003,
// architecture step "net message schema"). For each kind of message: which fields it may have and what they may
// hold, how big it may be, and how often one player may send it. Anything else is dropped:
//   · a kind of message the game doesn't know (before, any name was passed on as a game event, so a stranger in the
//     room could make the game show a "knock" or a status message);
//   · a field of the wrong type, too long, out of range, or not on the list (it is removed);
//   · the same player sending a kind of message faster than a child ever could (a flood).
// The transport (js/net.js) stays as it is; it calls checkMsg() for every message it receives.

// a field check: the cleaned value, or undefined to leave it out
type Field = (v: any) => any;
type Kind = { fields: Record<string, Field>, size: number, per: number, sec: number, need?: string[] };
/** @type {(max?: number) => Field} */
const word = (max = 32) => v => typeof v === 'string' && v.length <= max && /^[\w-]*$/.test(v) ? v : undefined;
const text = max => v => typeof v === 'string' && v.length <= max && !/[\u0000-\u0008\u000b-\u001f]/.test(v) ? v : undefined;
const num = (lo, hi) => v => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : undefined;
const int = (lo, hi) => v => Number.isInteger(v) && v >= lo && v <= hi ? v : undefined;
const bool = v => typeof v === 'boolean' ? v : undefined;
const any = v => v; // checked again by the code that uses it (looks, photos: net.js cleanHello / okPhoto)
// a side of a trade: up to 12 kinds of things (1–99 each), up to 9,999 coins and up to 6 clothes (Round V)
const side = (value: unknown): TradeSide | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const v = value as Record<string, unknown>, out: TradeSide = {};
  if (v.coins != null) { if (typeof v.coins !== 'number' || !Number.isInteger(v.coins) || v.coins < 0 || v.coins > 9999) return undefined; out.coins = v.coins; }
  if (v.items != null) { if (typeof v.items !== 'object' || Array.isArray(v.items)) return undefined; const e = Object.entries(v.items); if (e.length > 12) return undefined; out.items = {}; for (const [k, n] of e) { if (!/^\w{1,24}$/.test(k) || typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > 99) return undefined; out.items[k] = n; } }
  // (Round V) clothes: up to 6, each a clothes id
  if (v.clothes != null) { if (!Array.isArray(v.clothes) || v.clothes.length > 6 || !v.clothes.every(x => typeof x === 'string' && /^\w{1,24}$/.test(x))) return undefined; out.clothes = [...new Set(v.clothes as string[])]; }
  return out;
};
/** @type {Field} up to 6 player ids, each a word */
const seats = v => Array.isArray(v) && v.length >= 2 && v.length <= 6 && v.every(x => typeof x === 'string' && /^[\w-]{1,64}$/.test(x)) ? v.slice() : undefined;
/** @type {(max: number) => Record<string, Field>} a message locked for one player: the sender's key and the locked words */
const sealed = max => ({ pub: text(100), iv: text(24), ct: text(max) });
const SEALED = ['pub', 'iv', 'ct'];
import { WORLD } from './content/map.js';
// world coordinates stay inside the valley, with 5 m to spare (round T: 480 m across, so ±235 m; read from the map)
const W = WORLD.size / 2 - 5;
// kind → { fields, size (largest JSON in characters), per (at most this many…), sec (…in this many seconds), need (fields that must be there) }
/** @type {Record<string, Kind>} */
export const SCHEMA: Record<string, Kind> = {
  // (round R privacy, 9 Oct) a hello never carries the photo (it goes after admission, locked, in 'photo'); w: "I have not
  // heard the room's starter yet" (a newcomer let in through the cloud asks for the welcome again)
  // (Online, r57) map: the knocker's map layout (MAP_VERSION); a knock from another layout is turned away (js/net.js)
  hello: { fields: { name: text(40), look: any, friend: word(8), pub: text(100), w: bool, map: word(8) }, size: 3000, per: 6, sec: 10 },
  s: { fields: { x: num(-W, W), y: num(-60, 120), z: num(-W, W), yaw: num(-100, 100), st: word(16), sp: num(0, 50) }, need: ['x', 'y', 'z', 'yaw'], size: 600, per: 40, sec: 1 },
  ping: { fields: { ts: num(0, 1e14) }, size: 600, per: 3, sec: 2 },
  pong: { fields: { ts: num(0, 1e14) }, size: 600, per: 6, sec: 2 },
  bye: { fields: {}, size: 600, per: 4, sec: 5 },
  cloudon: { fields: {}, size: 600, per: 4, sec: 5 },
  // (round R privacy, 9 Oct) everything the room's starter says to one player is locked for that player (pub: the starter's
  // key; iv, ct: the locked words), so nobody else who knows the room code can say it in the starter's name (js/net.js)
  full: { fields: sealed(400), need: SEALED, size: 1000, per: 4, sec: 5 },
  kick: { fields: sealed(400), need: SEALED, size: 1000, per: 4, sec: 5 },
  nope: { fields: sealed(400), need: SEALED, size: 1000, per: 4, sec: 5 },
  door: { fields: sealed(400), need: SEALED, size: 1000, per: 6, sec: 5 },
  admit: { fields: sealed(600), need: SEALED, size: 1200, per: 6, sec: 10 },   // let in: the room secret for the members' channel
  chal: { fields: sealed(400), need: SEALED, size: 1000, per: 4, sec: 10 },    // a saved friend: prove it (a number only they can open)
  chalr: { fields: { n: word(64) }, need: ['n'], size: 600, per: 4, sec: 10 }, // …the number, opened
  rekey: { fields: sealed(600), need: SEALED, size: 1200, per: 4, sec: 10 },   // a new room secret after someone was removed
  members: { fields: sealed(8000), need: SEALED, size: 9000, per: 4, sec: 5 }, // who is in the room (the grown-ups' list; who a guest may meet)
  // friends' channel (js/net.js friendsStart): "playing now" and a token; where I am and invitations go locked for one friend
  pres: { fields: { code: word(8), online: bool, ts: num(0, 1e14), tok: word(24) }, need: ['code'], size: 600, per: 6, sec: 10 },
  note: { fields: sealed(1200), need: SEALED, size: 1800, per: 6, sec: 10 },
  invite: { fields: sealed(1200), need: SEALED, size: 1800, per: 4, sec: 10 },
  photo: { fields: { iv: text(40), ct: text(1100000) }, need: ['iv', 'ct'], size: 161000, per: 4, sec: 10 },
  photoreq: { fields: {}, size: 600, per: 3, sec: 10 }, // ("I don't have your photo yet": the first one can go out while a newcomer is still at the door)
  emote: { fields: { id: word(24) }, need: ['id'], size: 600, per: 6, sec: 3 },
  meet: { fields: {}, size: 600, per: 2, sec: 4 },
  offer: { fields: { id: word(32), give: side, want: side }, need: ['id', 'give', 'want'], size: 2000, per: 3, sec: 5 },
  tradeYes: { fields: { id: word(32) }, need: ['id'], size: 600, per: 4, sec: 5 },
  tradeNo: { fields: { id: word(32) }, need: ['id'], size: 600, per: 4, sec: 5 },
  tradeDone: { fields: { id: word(32), ok: bool }, need: ['id'], size: 600, per: 4, sec: 5 },
  // games with friends (js/netgames.js): an invitation, yes / no, the start with everyone's seat, moves, leaving
  gask: { fields: { gid: word(12), game: word(48), level: int(1, 5), size: int(3, 19) }, need: ['gid', 'game'], size: 600, per: 3, sec: 10 },
  gyes: { fields: { gid: word(12) }, need: ['gid'], size: 600, per: 4, sec: 5 },
  gno: { fields: { gid: word(12) }, need: ['gid'], size: 600, per: 4, sec: 5 },
  gstart: { fields: { gid: word(12), game: word(48), level: int(1, 5), size: int(3, 19), seats }, need: ['gid', 'game', 'seats'], size: 1200, per: 3, sec: 10 },
  gquiz: { fields: {gid:word(12),iv:text(24),ct:text(100000)},need:['gid','to','iv','ct'],size:102000,per:18,sec:10 },
  gquizreq: {fields:{gid:word(12)},need:['gid'],size:600,per:4,sec:10},
  gmove: { fields: { gid: word(12), n: int(0, 9999), mv: int(0, 9999) }, need: ['gid', 'n', 'mv'], size: 600, per: 12, sec: 2 },
  gbye: { fields: { gid: word(12) }, need: ['gid'], size: 600, per: 4, sec: 5 },
  // a pickup taken (fruit, flowers, gems, things on the ground): first come, first served (js/claims.js)
  claim: { fields: { id: word(16), ms: int(0, 1000000) }, need: ['id', 'ms'], size: 600, per: 10, sec: 5 }
};
// fields every message may carry (the transport's own)
/** @type {Record<string, Field>} */
const ENVELOPE = { t: word(16), from: word(64), to: word(64), mid: word(40), _topic: any };

const seen = new Map(); // `${from}|${t}` → recent times
let lastSweep = 0;
// → the cleaned message, or null to drop it.
// d: the message as it arrived; from: who sent it
export function checkMsg(d: any, from: string): Msg | null {
  let size = null;
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const S = Object.prototype.hasOwnProperty.call(SCHEMA, d.t) ? SCHEMA[d.t] : null; if (!S) return null;
  // (measured without the relay's own routing fields, which are not part of the message)
  if (size == null) { try { size = JSON.stringify(d, (k, v) => k === '_topic' || k === '_id' ? undefined : v).length; } catch (e) { return null; } }
  if (size > S.size) return null;
  // the rate: at most S.per of this kind from one player in S.sec seconds
  const now = Date.now(), key = from + '|' + d.t, list = (seen.get(key) || []).filter(x => now - x < S.sec * 1000);
  if (list.length >= S.per) { seen.set(key, list); return null; }
  list.push(now); seen.set(key, list);
  if (now - lastSweep > 30000) { lastSweep = now; for (const [k, l] of seen) if (!l.length || now - l[l.length - 1] > 100000) seen.delete(k); }
  const out: Msg = { t: d.t }; // (d.t is one of SCHEMA's kinds, checked above)
  for (const [k, v] of Object.entries(d)) {
    const f = S.fields[k] || ENVELOPE[k]; if (!f) continue; // not on the list: left out
    if (v === undefined || v === null) continue;
    const c = f(v); if (c !== undefined) out[k] = c;
  }
  if ((S.need || []).some(k => out[k] === undefined)) return null;
  return out;
}
export function resetRates() { seen.clear(); } // (tests)
