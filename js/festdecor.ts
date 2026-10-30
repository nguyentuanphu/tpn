// Festival decorations along the streets (Play core, owner 10 Oct: "each festival should decorate the whole town and
// villages rather than scattered with a few"): which spots beside each place's streets carry a piece, and how many at
// each week of the build-up; and what a child is told when they tap a festival on the calendar that is not on today
// (owner, 10 Oct: children never start a festival). Loaded by js/festivals.js once a child plays (PERF-001).
import { roadDist, heightAt, TOWN, AUSSIE, MARKET, ROADS } from './world.js';
import { T } from './i18n.js';
import { liveRule, festivalRule, featureOn } from './custom.js';

const day = s => { const d = new Date(s + 'T00:00:00'); return isNaN(d) ? null : d; };
// an admin's schedule in Studio's Releases page (fest_<id> with a start date): the festival is on from that day, for its
// days there (or the festival's own length)
export function scheduled(F, now) {
  const r = liveRule('fest_' + F.id); if (!r || !r.start || r.on === false) return false;
  const st = day(String(r.start).slice(0, 10)); if (!st) return false;
  const end = new Date(+st + (r.days > 0 ? r.days : F.days || 1) * 864e5);
  return now >= st && now < end;
}


// the streets some places draw themselves (not in the valley's road list; widths as in js/town.js and js/regions.js):
// along x at z, half width hw
const INNER = { town: { x0: TOWN.x - 26, x1: TOWN.x + 12, z: TOWN.roadZ, hw: 3.5 }, aussie: { x0: AUSSIE.x0, x1: AUSSIE.x1, z: AUSSIE.roadZ, hw: 3.5 }, market: { x0: MARKET.x0, x1: MARKET.x1, z: MARKET.roadZ, hw: 4 } };
// how much one place can carry at "as now" (1x, PERF budgets): pieces along its streets on the day, strings of bunting
export const MAX_PIECES = 48, MAX_BUNTING = 10;
// (owner, 13 Oct) how much each festival decorates: 5 times r69's by default, chosen per festival in Studio's Festivals
// page (deco: 1 = as before, 2, 3, 5, 7); and how far apart the pieces stand at each amount
export const DECO = [1, 2, 3, 5, 7];
// (batch rollout) Studio switch 'festDecoBig' (Releases page): off or not started yet, a festival Studio gave no amount of its
// own decorates as before (1x); an amount set on the Festivals page always wins (decorations are the valley's, not a child's)
export const decoOf = F => { const r = festivalRule(F.id), m = r && +r.deco; return DECO.includes(m) ? m : featureOn('festDecoBig', true) ? 5 : 1; };
const GAP = { 1: 5, 2: 4, 3: 3, 5: 2, 7: 1.6 };
// (owner, 13 Oct) the build-up: half in week 1, three quarters in week 2, everything in the last week and on the day
export const FRAC = [0, .5, .75, 1, 1];

// free(x, z, r): open ground there (js/festivals.js: dry, no building or collider)
export function createDecor(free) {
  // spots beside the streets of a place: a little off every road, lane and footpath (never on it or its verge, G5) and
  // beside a city's main street; kept 5 m apart; worked out once per place
  const streetCache = {}, candCache = {};
  // Share ground occupancy between simultaneous festivals; rebuilding resets it once.
  const occupied = new Map(), wires = new Set(), distribution = [];
  const begin = () => { occupied.clear(); wires.clear(); distribution.length=0; };
  const cell = q => [Math.floor(q.x / 2), Math.floor(q.z / 2)];
  const occupy = (q,kind='piece') => { const [x,z]=cell(q), key=x+','+z; if(!occupied.has(key))occupied.set(key,[]);occupied.get(key).push({...q,kind}); };
  const available = q => { const [x,z]=cell(q);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)if((occupied.get((x+dx)+','+(z+dz))||[]).some(p=>Math.hypot(p.x-q.x,p.z-q.z)<1.8))return false;return true; };
  // (owner, 15 Oct: "crowded poles") a post stands clear of every piece, and at least 4 m from any other post unless it is that post
  const canSupport = q => { const [x,z]=cell(q);for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)if((occupied.get((x+dx)+','+(z+dz))||[]).some(p=>{const d=Math.hypot(p.x-q.x,p.z-q.z);return p.kind==='support'?d>.05&&d<4:d<1.8;}))return false;return true; };
  // (a piece drawn outside decorate: the ring round a place without streets, a table, the roadside) takes the ground only if it is free
  const fits = (q,kind='piece') => kind==='support'?canSupport(q):available(q);
  const claim = (q,kind='piece') => { if(!fits(q,kind))return false; occupy(q,kind); return true; };
  const wireKey = (a,b,wall=false) => (wall?'wall:':'post:')+[[a.x,a.z],[b.x,b.z]].map(p=>p.map(n=>n.toFixed(3)).join(',')).sort().join('|');
  const order = (q,id) => { let h=2166136261;for(const c of id+'|'+q.x+'|'+q.z)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0; };
  const streetSpots = (key, o, gap = 5) => {
    if (streetCache[key + gap]) return streetCache[key + gap];
    const cand = candCache[key] || (candCache[key] = candidates(key, o)), out = [];
    for (const c of cand) if (out.every(q => Math.hypot(q.x - c.x, q.z - c.z) >= gap)) out.push(c);
    return (streetCache[key + gap] = out);
  };
  // every 1 m spot beside a place's streets (each faces its street)
  const candidates = (key, o) => {
    const box = o.x0 != null ? o : { x0: o.x - (o.r || 24), x1: o.x + (o.r || 24), z0: o.z - (o.r || 24), z1: o.z + (o.r || 24) }, round = o.x0 == null;
    const lay = o.layout, inner = INNER[key], cand = [];
    // (a city: also round the edge of its paved square)
    if (o.w && o.d) for (let t = 0; t < 1; t += 1 / 40) for (const [ex, ez, ea] of [[o.x - o.w + 1.5 + t * (2 * o.w - 3), o.z - o.d + 1.5, 0], [o.x - o.w + 1.5 + t * (2 * o.w - 3), o.z + o.d - 1.5, Math.PI], [o.x - o.w + 1.5, o.z - o.d + 1.5 + t * (2 * o.d - 3), Math.PI / 2], [o.x + o.w - 1.5, o.z - o.d + 1.5 + t * (2 * o.d - 3), -Math.PI / 2]]) {
      const d = roadDist(ex, ez), u = lay ? Math.abs((ex - o.x) * Math.cos(lay.toward) - (ez - o.z) * Math.sin(lay.toward)) : 99;
      if ((!d.road || d.d > d.road.w / 2 + 1.6) && u > 2.6 + 1.6 && free(ex, ez, .9)) cand.push({ x: ex, z: ez, a: ea });
    }
    // (1 m apart, so the narrow strip beside each street is never stepped over)
    for (let x = box.x0; x <= box.x1; x += 1) for (let z = box.z0; z <= box.z1; z += 1) {
      if (round && Math.hypot(x - o.x, z - o.z) > (o.r || 24)) continue;
      const d = roadDist(x, z); let side = d.road && d.d > d.road.w / 2 + 1.6 && d.d < d.road.w / 2 + 2.8, a = 0, street = false;
      // (a place's own street, drawn by its file: on its footpaths, never on the street)
      if (inner && x > inner.x0 - 1 && x < inner.x1 + 1) { const dz = z - inner.z, u = Math.abs(dz); if (u < inner.hw + 1.6) side = false; else if (u < inner.hw + 2.8) { side = true; street = true; a = dz > 0 ? Math.PI : 0; } }
      if (lay) { const u0 = (x - o.x) * Math.cos(lay.toward) - (z - o.z) * Math.sin(lay.toward), u = Math.abs(u0); if (u < 2.6 + 1.6) side = false; else if (u < 2.6 + 2.8) { side = true; street = true; a = Math.atan2(-Math.sign(u0) * Math.cos(lay.toward), Math.sign(u0) * Math.sin(lay.toward)); } }
      // (each piece faces the street: the way the distance to the road gets smaller)
      if (side && !street) { const gx = roadDist(x + .5, z).d - roadDist(x - .5, z).d, gz = roadDist(x, z + .5).d - roadDist(x, z - .5).d; a = Math.atan2(-gx, -gz) || 0; }
      if (side && !(d.road && d.d < d.road.w / 2 + 1.6) && free(x, z, .9)) cand.push({ x, z, a });
    }
    return cand;
  };
  // is (x, z) on a street of the place (a road, the place's own street, a city's main street): a string crosses it
  const onStreet = (key, o, x, z) => {
    const d = roadDist(x, z); if (d.road && d.d < d.road.w / 2) return true;
    const inner = INNER[key]; if (inner && x > inner.x0 && x < inner.x1 && Math.abs(z - inner.z) < inner.hw) return true;
    const lay = o.layout; return !!(lay && Math.abs((x - o.x) * Math.cos(lay.toward) - (z - o.z) * Math.sin(lay.toward)) < 2.6);
  };
  // which of a place's street spots carry a piece at a stage (1 to 4): spread over the whole place at every stage
  // (every 2nd spot in week 1, ...), at most cap (a quiet day: a few, gently)
  const chosen = (spots, F, stage, cap) => {
    const step = Math.max(1, spots.length / cap), every = [];
    for (let k = 0; k < spots.length && every.length < cap; k += step) every.push(spots[Math.floor(k)]);
    const n = Math.round(every.length * (F.kind === 'quiet' ? .6 : FRAC[stage] || 0));
    return [...every.keys()].sort((a, b) => ((a % 4) - (b % 4)) || a - b).slice(0, n).map(k => every[k]);
  };
  // strings between spots: across the street first (high, over the traffic), then along it; each spot holds two at most
  const strings = (key, o, spots, n) => {
    const out = [], used = new Map(), ok = q => (used.get(q) || 0) < 2, use = (a, b, high) => { used.set(a, (used.get(a) || 0) + 1); used.set(b, (used.get(b) || 0) + 1); out.push([a, b, high]); };
    for (const a of spots) { if (out.length >= n) break; if (!ok(a)) continue;
      const b = spots.find(q => q !== a && ok(q) && Math.hypot(q.x - a.x, q.z - a.z) > 5 && Math.hypot(q.x - a.x, q.z - a.z) < 14 && onStreet(key, o, (a.x + q.x) / 2, (a.z + q.z) / 2) && !out.some(s => s[0] === q && s[1] === a));
      if (b) use(a, b, true); }
    for (let k = 0; k < spots.length && out.length < n; k += 2) { const a = spots[k]; if (!ok(a)) continue;
      const b = spots.find((q, m) => m > k && ok(q) && Math.hypot(q.x - a.x, q.z - a.z) > 3 && Math.hypot(q.x - a.x, q.z - a.z) < 9 && !onStreet(key, o, (a.x + q.x) / 2, (a.z + q.z) / 2));
      if (b) use(a, b, false); }
    return out;
  };
  // what decorated a place at "as now" (1x) on the day: pieces and strings (the 5x and 7x are worked out from it)
  const baseOf = (key, o, F) => { const sp = streetSpots(key, o); if (sp.length < 6) return { pieces: 0, strings: 0 };
    const pieces = chosen(sp, F, 4, F.kind === 'quiet' ? 10 : MAX_PIECES).length;
    return { pieces, strings: F.kind === 'quiet' ? 0 : strings(key, o, sp, MAX_BUNTING).length }; };
  // the spots at a house front: beside the door (never in front of it) and the two ends of a garland along the front
  const frontOf = hs => { const fx = Math.sin(hs.rot), fz = Math.cos(hs.rot), d = hs.d || 6, f = d * .5 + 1.2, e = d * .5 + .15, w = d * .42;
    return { x: hs.x + fx * f - fz * 1.6, z: hs.z + fz * f + fx * 1.6, a: hs.rot, g: [[hs.x + fx * e - fz * w, hs.z + fz * e + fx * w], [hs.x + fx * e + fz * w, hs.z + fz * e - fx * w]] }; };
  // the plan for a place at a stage: which spots carry a piece, which strings hang, which house fronts are dressed
  // (null: a place without streets, which keeps its ring round the middle)
  const layout = (key, o, F, stage, houses = [], mm = 0) => {
    const m = mm || decoOf(F), sp5 = streetSpots(key, o); if (sp5.length < 6) return null;
    const quiet = F.kind === 'quiet', frac = quiet ? .6 : FRAC[stage] || 0;
    if (m === 1) return { pieces: chosen(sp5, F, stage, quiet ? 10 : MAX_PIECES), strings: quiet ? [] : strings(key, o, sp5, Math.round(frac * MAX_BUNTING)), fronts: [] };
    // (a city: its paved square and the streets round it)
    const big = o.w && o.d ? { ...o, x0: o.x0 - 20, x1: o.x1 + 20, z0: o.z0 - 20, z1: o.z1 + 20 } : o, bk = big === o ? key : key + '+';
    const dense = streetSpots(bk, big, GAP[m]), base = baseOf(key, o, F), target = Math.round((base.pieces + base.strings) * m * frac);
    const pieces = chosen(dense, F, stage, (quiet ? 10 : MAX_PIECES) * m);
    const fronts = houses.slice(0, Math.round(houses.length * frac)).map(frontOf).filter(q => free(q.x, q.z, .6) && !(roadDist(q.x, q.z).road && roadDist(q.x, q.z).d < roadDist(q.x, q.z).road.w / 2 + 1.2));
    let left = Math.max(0, target - pieces.length - fronts.length * 2);
    const str = quiet ? [] : strings(bk, big, dense, Math.min(left, MAX_BUNTING * m)); left -= str.length;
    // the rest on the open ground of the place (lawns, squares, round the buildings), spread over all of it
    const fill = left > 0 ? chosen(openSpots(bk, big), F, 4, left) : [];
    return { pieces: pieces.concat(fill), strings: str, fronts };
  };
  // open ground inside a place: 2 m apart, away from every road and street, never in a building or the water
  const openCache = {};
  const openSpots = (key, o) => {
    if (openCache[key]) return openCache[key];
    const box = o.x0 != null ? o : { x0: o.x - (o.r || 24), x1: o.x + (o.r || 24), z0: o.z - (o.r || 24), z1: o.z + (o.r || 24) }, out = [];
    for (let x = box.x0 + 1; x <= box.x1 - 1; x += 2) for (let z = box.z0 + 1; z <= box.z1 - 1; z += 2) {
      if (o.x0 == null && Math.hypot(x - o.x, z - o.z) > (o.r || 24)) continue;
      const d = roadDist(x, z); if (d.road && d.d < d.road.w / 2 + 2.6) continue;
      if (onStreet(key.replace('+', ''), o, x, z) || onStreet(key.replace('+', ''), o, x + 2, z) || onStreet(key.replace('+', ''), o, x - 2, z) || onStreet(key.replace('+', ''), o, x, z + 2) || onStreet(key.replace('+', ''), o, x, z - 2)) continue;
      if (free(x, z, .9)) out.push({ x, z, a: Math.atan2(o.x - x, o.z - z) || 0 });
    }
    return (openCache[key] = out);
  };
  // the pieces, strings and house fronts of a place
  const decorate = (key, o, F, A, piece, bunting, bc, bk, houses, mm = 0) => {
    // (each piece with where it stands, so js/festivals.js can draw only the patches near the children)
    const L = layout(key, o, F, A.stage, houses, mm), items = []; if (!L) return null;
    const add = (x, z, r, kind = 'piece') => items.push({ x, z, kind, parts: r.parts, glows: r.glows });
    const region = o.w && o.d ? { ...o, x0:o.x0-20,x1:o.x1+20,z0:o.z0-20,z1:o.z1+20 } : o.x0 == null ? { ...o, r:(o.r||24)+20 } : o, rk=region===o?key:key+'+';
    const alternatives=streetSpots(rk,region,GAP[mm||decoOf(F)]).concat(openSpots(rk,region)).map(q=>({q,n:order(q,F.id+'|'+key)})).sort((a,b)=>a.n-b.n).map(v=>v.q);
    let next=0, extra=0, relocated=0;
    const putPiece=(at,i)=>{let q=at;if(!q||!available(q)){q=null;while(next<alternatives.length){const p=alternatives[next++];if(available(p)){q=p;break;}}}if(!q)return;if(q!==at)relocated++;occupy(q);add(q.x,q.z,piece(F.theme,i,q.x,heightAt(q.x,q.z),q.z,q.a));};
    // Keep one strand per route and reserve its support footprints before scattering pieces.
    L.strings.forEach(([a,b,high])=>{const k=wireKey(a,b);if(wires.has(k)||!canSupport(a)||!canSupport(b)){extra++;return;}wires.add(k);occupy(a,'support');occupy(b,'support');const h=high?6.2:3.2;add((a.x+b.x)/2,(a.z+b.z)/2,bunting([a.x,heightAt(a.x,a.z)+h,a.z],[b.x,heightAt(b.x,b.z)+h,b.z],bc,bk),'string');});
    L.pieces.forEach((q,i)=>putPiece(q,i));
    L.fronts.forEach((q,i)=>{putPiece(q,i+1);const [[x1,z1],[x2,z2]]=q.g,k=wireKey({x:x1,z:z1},{x:x2,z:z2},true);if(wires.has(k)){extra++;return;}wires.add(k);const y=Math.min(heightAt(x1,z1),heightAt(x2,z2))+2.6;add((x1+x2)/2,(z1+z2)/2,bunting([x1,y,z1],[x2,y,z2],bc,bk,true),'string');});
    // A duplicate strand becomes a separate piece on unused open ground, preserving the amount.
    for(let i=0;i<extra;i++)putPiece(null,L.pieces.length+i);

    const requested=L.pieces.length+L.strings.length+2*L.fronts.length;distribution.push({place:key,festival:F.id,requested,placed:items.length,relocated,unplaced:requested-items.length});
    return items;
  };
  // (checks) the spots that carry a piece at a stage, and how much a place carries: pieces, strings, house fronts
  const plan = (key, o, F, stage) => { const L = layout(key, o, F, stage); return L ? L.pieces.map(q => ({ x: q.x, z: q.z })) : []; };
  const count = (key, o, F, stage, houses) => { const L = layout(key, o, F, stage, houses); return L ? { pieces: L.pieces.length, onRoad: L.pieces.filter(q => onStreet(key, o, q.x, q.z) || (roadDist(q.x, q.z).road && roadDist(q.x, q.z).d < roadDist(q.x, q.z).road.w / 2 + 1.5)).length, strings: L.strings.length, fronts: L.fronts.length, base: baseOf(key, o, F), deco: decoOf(F) } : null; };
  // (owner, 13 Oct: "scattered all over the place") beside every road of the valley, outside the places: a spot every gap
  // metres, on alternate sides, a little off the road and its verge, on open dry ground
  const roadCache = {};
  const roadSpots = (gap, skip) => {
    const key = gap + '', all = roadCache[key] || (roadCache[key] = (() => { const out = [];
      for (const R of ROADS) { const pts = R.loop ? R.pts.concat([R.pts[0]]) : R.pts; let carry = gap / 2, side = 1;
        for (let i = 1; i < pts.length; i++) { const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az); if (!L) continue;
          const ux = (bx - ax) / L, uz = (bz - az) / L;
          let t = carry; for (; t < L; t += gap) { const cx = ax + ux * t, cz = az + uz * t, rd = roadDist(cx, cz), w = rd.road ? rd.road.w / 2 : 3; side = -side;
            // (this side first, then the other, a little off the verge or a bit farther out)
            for (const [sd, off] of [[side, 2.4], [side, 4.2], [-side, 2.4], [-side, 4.2]]) { const x = cx - uz * sd * (w + off), z = cz + ux * sd * (w + off), d = roadDist(x, z);
              if (d.road && d.d < d.road.w / 2 + 1.6) continue; if (Math.abs(heightAt(x, z) - heightAt(cx, cz)) > 1.2 || !free(x, z, .8)) continue; out.push({ x, z, a: Math.atan2(cx - x, cz - z) }); break; } }
          carry = t - L; } }
      return out; })());
    return all.filter(q => !skip(q.x, q.z));
  };
  const fronts = houses => houses.map(frontOf).filter(q => free(q.x, q.z, .6) && !(roadDist(q.x, q.z).road && roadDist(q.x, q.z).d < roadDist(q.x, q.z).road.w / 2 + 1.2));
  return { begin, fits, claim, note: row => { distribution.push(row); }, distribution:()=>distribution.map(row=>({...row})), streetSpots, decorate, plan, count, onStreet, roadSpots, fronts };
}

// a festival tapped on the calendar that is not on today: still to come (days to go; nothing starts), or in its
// build-up (the child is taken to see the decorations going up). n: its next dates; at: its first place's middle
export async function tell(G, h, F, A, n) {
  const s = d => d === 1 ? '' : 's';
  // (owner, 11 Oct, #32) the calendar only tells: it never takes the child anywhere
  if (A && A.on) return G.dialog(T(F.en, F.vi), [[`It's ${F.en} today! Its place is all decorated.`, `Hôm nay là ${F.vi}! Nơi tổ chức đã trang trí xong rồi.`]]);
  if (!A) { const d = n ? n.daysTo : null;
    return G.dialog(T(F.en, F.vi), [[d != null ? `${F.en} is in ${d} day${s(d)}. The decorations come by themselves three weeks before. See you then!` : `${F.en} is not on now.`,
      d != null ? `Còn ${d} ngày nữa là đến ${F.vi}. Ba tuần trước ngày lễ, nơi đó sẽ tự trang trí. Hẹn gặp con nhé!` : `${F.vi} chưa đến đâu con.`]]); }
  return G.dialog(T(F.en, F.vi), [[`${F.en} is in ${A.daysTo} day${s(A.daysTo)}! The decorations are going up.`, `Còn ${A.daysTo} ngày nữa là đến ${F.vi}! Mọi người đang trang trí rồi.`]]);
}
