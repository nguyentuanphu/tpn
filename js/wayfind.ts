// (Round U, owner 11 Oct: "Where is…?" sparkles) The 🧭 button by the zoom buttons: the child taps a picture (home, their
// house, Ông Cú, the market, any village or city) and a trail of sparkles shows the way along the roads, a stretch at a
// time ahead of them, until they get there. Loaded after the title (js/main.js).
import { sprite } from './gfx.js';
import { T } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { pic } from './art.js';
import { esc } from './util.js';
import { modal, dialog } from './popups.js';
import { ROADS, heightAt } from './world.js';

const STEP = 4, AHEAD = 28, ARRIVE = 9;
const proj = (ax, az, bx, bz, x, z) => { const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)); return { t, x: ax + dx * t, z: az + dz * t, d: Math.hypot(x - ax - dx * t, z - az - dz * t) }; };

// the road network as a graph: every road point a node; a road that ends on another road's middle is joined to it there
export function roadGraph(places = []) {
  const lines = ROADS.map(R => ({ R, pts: R.pts.map(p => p.slice()), ins: [] }));
  for (const A of lines) for (const e of [A.pts[0], A.pts[A.pts.length - 1]]) for (const B of lines) {
    if (B === A) continue; let best = null;
    for (let i = 0; i < B.pts.length - 1; i++) { const q = proj(...B.pts[i], ...B.pts[i + 1], e[0], e[1]); if (q.d < 2 && (!best || q.d < best.q.d)) best = { i, q }; }
    if (best) B.ins.push({ i: best.i, t: best.q.t, p: [best.q.x, best.q.z] });
  }
  const nodes = [], edges = [], key = new Map();
  const node = ([x, z]) => { const k = Math.round(x * 2) + ',' + Math.round(z * 2); if (key.has(k)) return key.get(k); const id = nodes.length; nodes.push([x, z]); edges.push([]); key.set(k, id); return id; };
  const link = (a, b) => { if (a === b) return; const d = Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]); edges[a].push([b, d]); edges[b].push([a, d]); };
  for (const L of lines) {
    const seq = []; L.pts.forEach((p, i) => { seq.push(p); L.ins.filter(x => x.i === i).sort((a, b) => a.t - b.t).forEach(x => seq.push(x.p)); });
    const ids = seq.map(node); for (let i = 0; i < ids.length - 1; i++) link(ids[i], ids[i + 1]); if (L.R.loop) link(ids[ids.length - 1], ids[0]);
  }
  // road ends that meet another road's end
  for (let a = 0; a < nodes.length; a++) if (edges[a].length === 1) for (let b = 0; b < nodes.length; b++) if (b !== a && Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]) < 3) link(a, b);
  // roads that end at the same village or city: the child walks across the place from one to the other
  for (const pl of places) {
    const inside = nodes.map((p, i) => i).filter(i => Math.hypot(nodes[i][0] - pl.x, nodes[i][1] - pl.z) < 55), ends = inside.filter(i => edges[i].length === 1);
    for (const a of ends) for (const b of inside) if (a !== b && !edges[a].some(([v]) => v === b) && Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]) < 25) link(a, b);
  }
  // a road that still reaches nothing else: joined across its place to the nearest piece of the rest (up to 45 m)
  const comp = () => { const c = new Int32Array(nodes.length).fill(-1); let n = 0; for (let i = 0; i < nodes.length; i++) { if (c[i] >= 0) continue; const st = [i]; c[i] = n; while (st.length) { const u = st.pop(); for (const [v] of edges[u]) if (c[v] < 0) { c[v] = n; st.push(v); } } n++; } return c; };
  for (const pl of places) {
    const c = comp(), inside = nodes.map((p, i) => i).filter(i => Math.hypot(nodes[i][0] - pl.x, nodes[i][1] - pl.z) < 55);
    for (const a of inside.filter(i => edges[i].length === 1)) { let best = -1, bd = 45; for (const b of inside) { const d = Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]); if (c[b] !== c[a] && d < bd) { bd = d; best = b; } } if (best >= 0) link(a, best); }
  }
  return { nodes, edges };
}
// the nearest spot on the network to (x, z): the node pair it lies between and the point itself
function attach(g, x, z) {
  let best = null;
  g.edges.forEach((es, a) => es.forEach(([b]) => { if (b < a) return; const q = proj(...g.nodes[a], ...g.nodes[b], x, z); if (!best || q.d < best.q.d) best = { a, b, q }; }));
  return best;
}
// the way from (x0, z0) to (x1, z1) along the roads, as points every STEP metres
export function route(g, x0, z0, x1, z1) {
  const s = attach(g, x0, z0), e = attach(g, x1, z1); if (!s || !e) return null;
  const n = g.nodes.length, S = n, E = n + 1, dist = new Float64Array(n + 2).fill(Infinity), prev = new Int32Array(n + 2).fill(-1), done = new Uint8Array(n + 2);
  const nb = i => i === S ? [[s.a, Math.hypot(g.nodes[s.a][0] - s.q.x, g.nodes[s.a][1] - s.q.z)], [s.b, Math.hypot(g.nodes[s.b][0] - s.q.x, g.nodes[s.b][1] - s.q.z)]]
    : g.edges[i].concat(i === e.a ? [[E, Math.hypot(g.nodes[i][0] - e.q.x, g.nodes[i][1] - e.q.z)]] : [], i === e.b ? [[E, Math.hypot(g.nodes[i][0] - e.q.x, g.nodes[i][1] - e.q.z)]] : []);
  const at = i => i === S ? [s.q.x, s.q.z] : i === E ? [e.q.x, e.q.z] : g.nodes[i];
  dist[S] = 0;
  if ((s.a === e.a && s.b === e.b)) { dist[E] = Math.hypot(s.q.x - e.q.x, s.q.z - e.q.z); prev[E] = S; }
  else for (;;) { let u = -1, du = Infinity; for (let i = 0; i < n + 2; i++) if (!done[i] && dist[i] < du) { du = dist[i]; u = i; } if (u < 0 || u === E) break; done[u] = 1; for (const [v, w] of nb(u)) if (du + w < dist[v]) { dist[v] = du + w; prev[v] = u; } }
  if (!Number.isFinite(dist[E])) return null;
  const corners = []; for (let i = E; i >= 0; i = prev[i]) { corners.unshift(at(i)); if (i === S) break; }
  const pts = []; for (let i = 0; i < corners.length - 1; i++) { const [ax, az] = corners[i], [bx, bz] = corners[i + 1], L = Math.hypot(bx - ax, bz - az), k = Math.max(1, Math.round(L / STEP)); for (let j = 0; j < k; j++) pts.push([ax + (bx - ax) * j / k, az + (bz - az) * j / k]); }
  pts.push(corners[corners.length - 1]); pts.push([x1, z1]);
  return { pts, len: dist[E] };
}

export function createWayfind(G) {
  const { scene, world } = G; let g = null, trail = null;
  const pool = [...Array(AHEAD)].map(() => { const s = sprite('✨', 1.1); s.visible = false; scene.add(s); return s; });
  const ground = (x, z) => world.groundAt ? world.groundAt(x, z) : heightAt(x, z);
  // what a child can ask for: home, their own house, Ông Cú, the market, and every village and city
  const targets = () => {
    const out = [], P = G.PLACES || [], farm = P.find(p => p.key === 'farm');
    if (farm) out.push({ id: 'home', icon: '🏡', name: () => T('Home', 'Nhà'), x: farm.x, z: farm.z });
    const door = G.interactables.find(i => i.id === 'myhouse_door'); if (door) out.push({ id: 'myhouse', icon: '🏠', name: () => T('My house', 'Nhà của con'), x: door.x, z: door.z });
    const owl = G.interactables.find(i => i.id === 'npc_owl'); if (owl) out.push({ id: 'owl', icon: '🦉', name: () => T('Grandpa Owl', 'Ông Cú'), x: owl.x, z: owl.z });
    const mk = (world.stalls || []).filter(s => s.place === 'market'); if (mk.length) out.push({ id: 'market', icon: '🛒', name: () => T('Three Regions Market', 'Chợ Ba Miền'), x: mk.reduce((a, s) => a + s.x, 0) / mk.length, z: mk.reduce((a, s) => a + s.z, 0) / mk.length });
    for (const p of P) if (p.key && p.key !== 'farm' && Number.isFinite(p.x)) out.push({ id: p.key, icon: p.icon, name: p.name, x: p.x, z: p.z });
    return out;
  };
  const stop = quiet => { trail = null; pool.forEach(s => { s.visible = false; }); if (!quiet) G.toast && G.toast(G.heroes[0], T('Sparkles off', 'Tắt lấp lánh')); };
  function start(h, t) {
    g = g || roadGraph(G.PLACES || []);
    const r = route(g, h.pos.x, h.pos.z, t.x, t.z); if (!r) return false;
    trail = { h, t, pts: r.pts, i: 0 }; SFX.chime && SFX.chime(); say(`Follow the sparkles to ${t.name()}!`, `Đi theo những ánh lấp lánh đến ${t.name()} nhé!`);
    return true;
  }
  function open(i = 0) {
    if (G.keep && !G.keep('wayfind')) return;   // (rollout) Studio switch 'wayfind'
    const h = G.heroes[i] || G.heroes[0], list = targets(); if (G.tried) G.tried(h, 'wayfind');
    const m = modal('wherepick', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>${pic('🧭')} ${T('Where shall we go?', 'Mình đi đâu nào?')}</h2>
      ${trail ? `<button class="wp-stop">${pic('✨')} ${T('Stop the sparkles', 'Tắt lấp lánh')}</button>` : ''}
      <div class="wp-grid">${list.map((t, k) => `<button class="wp-pick" data-k="${k}" aria-label="${esc(t.name())}">${pic(t.icon)}<b>${esc(t.name())}</b></button>`).join('')}</div>`);
    const was = G.paused; G.paused = true; const close = () => { G.paused = was; m.close(); };
    say('Where shall we go?', 'Mình đi đâu nào?');
    m.querySelector('.x').onclick = () => { SFX.tap(); close(); };
    const st = m.querySelector('.wp-stop'); if (st) st.onclick = () => { SFX.tap(); stop(); close(); };
    // (Round V, owner 13 Oct) after choosing a place: Fly straight there, or Walk with the sparkle trail (Fly if no road goes there)
    m.querySelectorAll('.wp-pick').forEach(b => b.onclick = async () => { SFX.tap(); const t = list[+b.dataset.k]; close();
      const k = await dialog(t.name(), [[`How shall we go to ${t.name()}?`, `Mình đến ${t.name()} bằng cách nào?`]], [['✈️ Fly there', '✈️ Bay đến'], ['👣 Walk with the sparkles', '👣 Đi bộ theo lấp lánh']]);
      if (k === 1 && start(h, t)) return;
      if (k === 1) say(`There is no road there. Let's fly!`, 'Không có đường đến đó. Mình bay nhé!');
      if (k === 0 || k === 1) { stop(); G.travelTo ? G.travelTo(h, t.x, t.z) : G.travel(h, t.x, t.z); } });
    return m;
  }
  // show the next stretch of sparkles ahead of the child; a new way if they wander off; done when they arrive
  let acc = 0, lx = 0, lz = 0;   // (the trail moves on every half second, or at once when the child has moved 3 m since)
  world.updaters.push((dt, time) => {
    if (!trail) return; if (!G.keep('wayfind', false)) { stop(true); return; } acc += dt; const { h, pts } = trail;
    if (Math.hypot(h.pos.x - trail.t.x, h.pos.z - trail.t.z) < ARRIVE) { const t = trail.t; stop(true); SFX.ok && SFX.ok(); say(`You found ${t.name()}!`, `Con đến ${t.name()} rồi!`); return; }
    if (acc > .5 || Math.hypot(h.pos.x - lx, h.pos.z - lz) > 3) { acc = 0; lx = h.pos.x; lz = h.pos.z;
      let bi = trail.i, bd = 1e9; for (let k = Math.max(0, trail.i - 4); k < Math.min(pts.length, trail.i + 40); k++) { const d = Math.hypot(pts[k][0] - h.pos.x, pts[k][1] - h.pos.z); if (d < bd) { bd = d; bi = k; } }
      if (bd > 25) { if (!start(h, trail.t)) stop(true); return; }
      trail.i = bi;
    }
    pool.forEach((s, k) => { const p = pts[trail.i + 1 + k]; s.visible = !!p; if (p) { s.position.set(p[0], ground(p[0], p[1]) + .7 + Math.sin(time * 4 + k * .7) * .15, p[1]); } });
  });
  G.wayfind = { open, start, stop, targets, get trail() { return trail; }, get shown() { return pool.filter(s => s.visible).map(s => [s.position.x, s.position.z]); } };
  return G.wayfind;
}
