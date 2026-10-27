// Tiến Lên's card rules (miền Nam, and miền Bắc since Round V), kept apart from the drawing so they can be unit tested.
// Used by js/games/tienlen.js.
export const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
export const SUITS = ['♠', '♣', '♦', '♥'];
export const card = (r, s) => ({ r, s, v: r * 4 + s });
export const byV = (a, b) => a.v - b.v;
let NORTH = false;   // (Round V) miền Bắc rules for the game being played (one card game at a time)
export const setNorth = on => { NORTH = !!on; };
export const isNorth = () => NORTH;
const colOf = c => (c.s >= 2 ? 'r' : 'b');

// what kind of play these cards are (or null if they are not a play)
export function classify(cs, north = NORTH) {
  const c = [...cs].sort(byV), n = c.length; if (!n) return null;
  const top = c[n - 1].v, same = c.every(x => x.r === c[0].r);
  if (n === 1) return { type: 'single', n, top, r: c[0].r, s: c[0].s };
  if (same) {
    if (n === 2) {
      // Northern ordinary pairs must be both red or both black. Twos are the exception.
      if (north && c[0].r !== 12 && colOf(c[0]) !== colOf(c[1])) return null;
      return { type: 'pair', n, top, r: c[0].r, col: c.map(colOf).sort().join('') };
    }
    if (n === 3) return { type: 'triple', n, top, r: c[0].r, suits: c.map(x => x.s).sort().join('') };
    return n === 4 ? { type: 'quad', n, top, r: c[0].r } : null;
  }
  if (n >= 3 && c.every((x, i) => x.r < 12 && (i === 0 || x.r === c[i - 1].r + 1))) return north && !c.every(x => x.s === c[0].s) ? null : { type: 'run', n, top, r: c[n - 1].r, s: c[0].s };
  if (north) return null;   // (miền Bắc: no pairs in a row)
  if (n >= 6 && n % 2 === 0) {
    let ok = true; for (let i = 0; i < n; i += 2) { if (c[i].r !== c[i + 1].r || c[i].r >= 12 || (i && c[i].r !== c[i - 2].r + 1)) { ok = false; break; } }
    if (ok) return { type: 'pairs', n, len: n / 2, top, r: c[n - 1].r };
  }
  return null;
}
// can play a beat play b (b null: a new round, anything goes)
export function beats(a, b, north = NORTH) {
  if (!a) return false; if (!b) return true;
  if (north) {
    if (a.type === b.type && a.n === b.n) {
      if (a.type === 'single') return a.r === 12 ? a.top > b.top : a.s === b.s && a.top > b.top;
      if (a.type === 'pair') return a.r === 12 ? a.top > b.top : a.col === b.col && a.top > b.top;
      if (a.type === 'triple') return a.suits === b.suits && a.top > b.top;
      if (a.type === 'run') return a.s === b.s && a.top > b.top;
      return a.top > b.top;
    }
    return (b.type === 'single' || b.type === 'pair') && b.r === 12 && a.type === 'quad';
  }
  if (a.type === b.type && a.n === b.n) return a.top > b.top;
  if (b.type === 'single' && b.r === 12) return a.type === 'quad' || (a.type === 'pairs' && a.len >= 3);
  if (b.type === 'pair' && b.r === 12) return a.type === 'quad' || (a.type === 'pairs' && a.len >= 4);
  if (b.type === 'quad') return a.type === 'pairs' && a.len >= 4;
  if (b.type === 'pairs' && b.len === 3) return a.type === 'quad' || (a.type === 'pairs' && a.len >= 4);
  return false;
}
// every play that can be made from a hand
function allPlays(hand, north) {
  const out = [], byR = {}; hand.forEach(c => (byR[c.r] = byR[c.r] || []).push(c));
  const sub = (arr, k, start = 0, cur = [], res = []) => { if (cur.length === k) { res.push([...cur]); return res; } for (let i = start; i < arr.length; i++) { cur.push(arr[i]); sub(arr, k, i + 1, cur, res); cur.pop(); } return res; };
  for (const c of hand) out.push([c]);
  for (const r in byR) for (let k = 2; k <= byR[r].length; k++) sub(byR[r].sort(byV), k).forEach(x => out.push(x));
  // runs: lowest card of each rank, and every suit for the top card
  for (let s = 0; s < 11; s++) for (let e = s + 2; e < 12; e++) {
    let ok = true; for (let r = s; r <= e; r++) if (!byR[r]) { ok = false; break; } if (!ok) break;
    const base = []; for (let r = s; r < e; r++) base.push([...byR[r]].sort(byV)[0]);
    byR[e].forEach(t => out.push([...base, t]));
  }
  // (miền Bắc) runs of one suit
  if (north) for (let su = 0; su < 4; su++) { const has = r => hand.find(c => c.r === r && c.s === su);
    for (let s = 0; s < 10; s++) for (let e = s + 2; e < 12; e++) { const cs = []; let ok = true; for (let r = s; r <= e; r++) { const c = has(r); if (!c) { ok = false; break; } cs.push(c); } if (!ok) break; out.push(cs); } }
  // pairs in a row
  for (let s = 0; s < 11; s++) for (let e = s + 2; e < 12; e++) {
    let ok = true; for (let r = s; r <= e; r++) if (!byR[r] || byR[r].length < 2) { ok = false; break; } if (!ok) break;
    const p = []; for (let r = s; r <= e; r++) { const q = [...byR[r]].sort(byV); p.push(...(r === e ? q.slice(-2) : q.slice(0, 2))); }
    out.push(p);
  }
  return out.map(cs => ({ cs, k: classify(cs, north) })).filter(x => x.k);
}
export const BOMB = (k, north = NORTH) => k.type === 'quad' || (!north && k.type === 'pairs' && k.len >= 3);
// a sensible play for a computer player (or a hint for the child): null = pass
export function choose(hand, table, { strong = false, others = 13 } = {}, north = NORTH) {
  const plays = allPlays(hand, north).filter(p => beats(p.k, table, north));
  if (!plays.length) return null;
  if (!table) {
    // lead with the lowest card, in the biggest group it belongs to (keep 2s and bombs for later)
    const low = [...hand].sort(byV)[0];
    const withLow = plays.filter(p => p.cs.includes(low) && !BOMB(p.k, north) && p.cs.every(c => c.r < 12));
    const pool = withLow.length ? withLow : plays;
    pool.sort((a, b) => b.k.n - a.k.n || a.k.top - b.k.top); return pool[0].cs;
  }
  const normal = plays.filter(p => p.k.type === table.type && p.k.n === table.n).sort((a, b) => a.k.top - b.k.top);
  // don't throw a 2 or break up a bomb early unless someone is about to win
  const cheap = normal.filter(p => p.cs.every(c => c.r < 12) || others <= 3 || hand.length <= 4);
  if (cheap.length) return cheap[0].cs;
  if (normal.length && (strong || others <= 4)) return normal[0].cs;
  const bombs = plays.filter(p => BOMB(p.k, north)).sort((a, b) => a.k.top - b.k.top);
  if (bombs.length && (strong || others <= 4)) return bombs[0].cs;
  return null;
}

// Freeze the variant for each table. Two children can open northern/southern games in separate HUDs;
// a later registration or an async game closing must not change another table's rules.
export function rulesFor(north: boolean) {
  return {
    classify: cs => classify(cs, north),
    beats: (a, b) => beats(a, b, north),
    choose: (hand, table, options = {}) => choose(hand, table, options, north),
    BOMB: k => BOMB(k, north)
  };
}
