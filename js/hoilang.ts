// Hội làng, the village festival (round S, owner plan 8 Oct, ROUND-R item 9). Times, prizes and lines are in
// js/content/hoilang.js (unit tested); this is the valley side:
//   · every village with a games board (js/folkshow.js) gets a festival pole with its flags (cây nêu, cờ hội): tap it
//     to join the festival while it is on, or to hear when the next one is;
//   · three times a day (09:00, 16:00, 19:00 AEST; 17:30 instead of 19:00 with an under-5) for 15 minutes, at the
//     village nearest a child: a little parade of villagers walks the village street up and down (4 people, built once,
//     reused in every village), and a crowd of 5 gathers round the singer's stage and cheers;
//   · children who arrive while it runs are told it is on; after it ended, they are told when the next one is;
//   · joining plays the village's game of the moment (free, like every host game since round S); the special prize
//     works like the whistling kite: kept for good, carried beside the child (on or off in the Backpack), and a
//     keepsake for the child's house (js/myhouse.js DECOR). Under-5s get it for joining in (no losing), big kids for a win.
// Studio switch 'hoilang' (js/content/releases.js). Calm mode: the parade walks slowly and nobody bounces.
import { THREE, P, merge, toonVC, sprite } from './gfx.js';
import { T } from './i18n.js';
import { SFX, tone } from './audio.js';
import { reduceMotion } from './state.js';
import { heightAt, roadDist, WATER } from './world.js';
import { buildAvatar } from './avatar.js';
import { featureOn } from './custom.js';
import { events } from './core/events.js';
import { id as makeId } from './core/ids.js';
import { DECOR } from './myhouse.js';
import { pic } from './art.js';
import { dist2 } from './util.js';
import { eventNow, lastEvent, eventTimes, nextPrize, earnsPrize, HL_PRIZES, HL_LINES, HL_NEXT } from './content/hoilang.js';

const LOOKS = [
  { style: 'aodai', color: '#e8433a', hat: 'nonla', hairStyle: 'long' }, { style: 'shirt', color: '#ffd23f', hat: 'none', hairStyle: 'short' },
  { style: 'aodai', color: '#3cc7e8', hat: 'flower', hairStyle: 'buns' }, { style: 'tunic', color: '#5fd36a', hat: 'nonla', hairStyle: 'short' },
  { style: 'dress', color: '#ff7eb8', hat: 'bow', hairStyle: 'ponytail' }, { style: 'shirt', color: '#9a6bff', hat: 'cap', hairStyle: 'spiky' },
  { style: 'overalls', color: '#ff9f43', hat: 'none', hairStyle: 'buns' }, { style: 'aodai', color: '#ffffff', hat: 'nonla', hairStyle: 'long' },
  { style: 'shirt', color: '#2f7ac8', hat: 'none', hairStyle: 'short' }
].map((l, k) => ({ back: 'none', hair: ['#1d1412', '#3b2618', '#2a1d14'][k % 3], skin: ['#f2c19e', '#e0aa80', '#f6c7a5'][k % 3], glider: 0, ...l }));

export function createHoiLang(G, { say, save, reward }) {
  const { scene, world } = G, on = () => G.keep ? G.keep('hoilang') : featureOn('hoilang', true);   // (batch rollout: kept for a child who joined in)
  const little = () => G.heroes.some(h => h.profile && h.profile.age !== 'big');
  const hl = p => { const s = p.hoilang = p.hoilang && typeof p.hoilang === 'object' ? p.hoilang : {}; s.prizes = Array.isArray(s.prizes) ? s.prizes.filter(x => HL_PRIZES.some(y => y.id === x)) : []; s.keys = Array.isArray(s.keys) ? s.keys.slice(-20) : []; return s; };
  // each prize is also a keepsake for the child's house
  for (const x of HL_PRIZES) DECOR['hl_' + x.id] = { icon: x.icon, price: 0, en: x.en + ' (village festival)', vi: x.vi + ' (hội làng)', keepsake: true };
  const clock = () => eventNow(Date.now(), little());

  // ---------- a festival pole in every village with a games board ----------
  const flags = ['#e8433a', '#ffd23f', '#3cc7e8', '#5fd36a', '#ff7eb8'];
  const poleMesh = () => new THREE.Mesh(merge([P(new THREE.CylinderGeometry(.08, .11, 6, 6), '#c9a24a', [0, 3, 0]), P(new THREE.CylinderGeometry(.4, .5, .25, 8), '#8a6a4a', [0, .12, 0]),
    ...flags.map((c, k) => P(new THREE.BoxGeometry(.9, .55, .03), c, [.5, 5.5 - k * .62, 0], [0, 0, -.08])), P(new THREE.SphereGeometry(.16, 8, 6), '#ffd23f', [0, 6.1, 0])]), toonVC());
  const offRoad = (x, z) => { const r = roadDist(x, z); return r.d > r.road.w / 2 + 2; };
  const free = (x, z) => offRoad(x, z) && heightAt(x, z) > WATER + .6 && !G.interactables.some(i => Number.isFinite(i.x) && dist2(i.x, i.z, x, z) < 3.4);
  const fests = [];
  (G.folkShows || []).forEach((S, k) => {
    const sg = (G.singers || []).reduce((b, g) => !b || dist2(g.x, g.z, S.x, S.z) < dist2(b.x, b.z, S.x, S.z) ? g : b, null);
    const stage = sg && dist2(sg.x, sg.z, S.x, S.z) < 16 ? { x: sg.x, z: sg.z } : { x: S.x, z: S.z };
    let at = null;
    for (let r = 4; r <= 14 && !at; r += 1.5) for (let a = 0; a < 16 && !at; a++) { const [x, z] = G.clearSpot(S.x + Math.cos(a / 16 * 6.283 + 2) * r, S.z + Math.sin(a / 16 * 6.283 + 2) * r, 1); if (free(x, z)) at = [x, z]; }
    if (!at) return;
    const [x, z] = at, y = heightAt(x, z), pole = poleMesh(); pole.position.set(x, y, z); pole.rotation.y = k; scene.add(pole); world.colliders.push({ x, z, r: .4 });
    const F = { k, S, x, z, stage, path: null };
    fests.push(F);
    G.interactables.push({ id: 'hoilang' + k, x, z, r: 2.6, icon: '🎪', bubble: '🎪', visible: () => on(),
      label: () => clock().on ? T('Village festival: join in!', 'Hội làng: vào chơi!') : T('Village festival: when is it?', 'Hội làng: khi nào có?'), act: h => { G.tried && G.tried(h, 'hoilang'); openFest(h, F); } });
  });

  // ---------- joining, and the prize ----------
  let wait = null; const acts = new Map();
  const gameOf = F => { const st = G.folkState ? G.folkState(F.S) : null; return (st && (st.host || st.next) || F.S.hosts[0]).game; };
  async function openFest(h, F) {
    const E = clock(), s = hl(h.profile);
    if (!E.on) {
      const mins = Math.round(E.next.inMin), when = mins < 60 ? [`in about ${Math.max(1, mins)} minutes`, `khoảng ${Math.max(1, mins)} phút nữa`] : E.next.tomorrow ? ['tomorrow', 'ngày mai'] : [`in about ${Math.round(mins / 60)} hours`, `khoảng ${Math.round(mins / 60)} giờ nữa`];
      const times = eventTimes(little()).join(' · ');
      await G.dialog(T('Village festival', 'Hội làng'), [
        [`The next village festival is at ${E.next.at} (${when[0]}). There is one at ${times} every day.`, `Hội làng lần tới lúc ${E.next.at} (${when[1]}). Mỗi ngày có hội lúc ${times}.`, ...HL_NEXT[E.next.at]],
        HL_LINES.free]);
      return;
    }
    if (s.keys.includes(E.key)) { await G.dialog(T('Village festival', 'Hội làng'), [HL_LINES.already]); return; }
    const game = gameOf(F), k = await G.dialog(T('Village festival', 'Hội làng') + ' · ' + F.S.where(), [HL_LINES.join], [['▶ Play the festival game', '▶ Chơi trò của hội'], ['👋 Later', '👋 Để sau']]);
    if (k !== 0) return;
    s.joined = E.key; save(); wait = { h, key: E.key, def: makeId('game', game), at: performance.now() };
    G.playGame(h.i, game, 'folk');
  }
  events.on('ActivityStarted', e => { if (wait && e.defId === wait.def && performance.now() - wait.at < 60000) { acts.set(e.activityId, wait); wait = null; } });
  const ended = (e, won) => { const w = acts.get(e.activityId); if (!w) return; acts.delete(e.activityId);
    const s = hl(w.h.profile); if (earnsPrize({ joinedKey: w.key, prizedKeys: s.keys, little: w.h.profile.age !== 'big', won })) givePrize(w.h, w.key); };
  events.on('ActivityCompleted', e => ended(e, true));
  events.on('ActivityAbandoned', e => { if (e.reason === 'level') { const w = acts.get(e.activityId); if (w) { acts.delete(e.activityId); wait = { ...w, at: performance.now() }; } return; } ended(e, false); });
  function givePrize(h, key) {
    const p = h.profile, s = hl(p), x = nextPrize(s.prizes);
    s.keys.push(key);
    if (x) { s.prizes.push(x.id); s.carry = x.id; s.carryOn = true; p.keepsakes = Array.isArray(p.keepsakes) ? p.keepsakes : []; if (!p.keepsakes.includes('hl_' + x.id)) p.keepsakes.push('hl_' + x.id); }
    else { G.addCoins && G.addCoins(20); G.giveSticker && G.giveSticker(p); }
    save(); sync();
    // (after the game's own reward, like the kite)
    setTimeout(async () => {
      say(...(x ? HL_LINES.prize : HL_LINES.allPrizes));
      await reward(x ? x.icon : '🎪', x ? T(`${x.en}!`, `${x.vi}!`) : T('Every festival prize!', 'Đủ quà hội làng!'),
        x ? T('A special prize from the village festival. It goes with you everywhere (switch it in your Backpack) and it is a keepsake for your house.', 'Quà đặc biệt của hội làng. Quà đi theo con khắp nơi (bật tắt trong Ba lô) và là kỷ vật để trong nhà con.') : T('+20 coins and a sticker.', '+20 đồng và một hình dán.'));
    }, 3600);
  }

  // ---------- the carried prize: beside the child, like the kite ----------
  let carried = [];
  function sync() {
    carried.forEach(c => scene.remove(c.s)); carried = [];
    if (!on()) return;
    G.heroes.forEach(h => { const s = hl(h.profile), x = s.carryOn !== false && HL_PRIZES.find(y => y.id === s.carry); if (!x) return; const sp = sprite(x.icon, .6); scene.add(sp); carried.push({ h, s: sp }); });
  }

  // ---------- the parade and the crowd ----------
  let walkers = null, crowd = null, active = null;
  const make = (look, k) => { const A = buildAvatar(look, null); A.root.visible = false; scene.add(A.root); return A; };
  const build = () => {
    walkers = LOOKS.slice(0, 4).map(make); crowd = LOOKS.slice(4, 9).map(make);
    // the first walker carries the festival flag
    const flag = new THREE.Mesh(merge([P(new THREE.CylinderGeometry(.03, .03, 2.4, 5), '#8a5a3b', [.35, 1.2, .1]), P(new THREE.BoxGeometry(.7, .45, .03), '#e8433a', [.72, 2.15, .1]), P(new THREE.SphereGeometry(.05, 6, 4), '#ffd23f', [.35, 2.42, .1])]), toonVC());
    walkers[0].root.add(flag);
  };
  // the village street: the stretch of road nearest the stage, up to 20 m each way (or a circle round the stage)
  const pathFor = F => {
    if (F.path) return F.path;
    let best = null;
    for (const L of world.roadLines || []) {
      if (L.kind === 'footpath') continue;
      const near = L.pts.map(([x, z]) => ({ x, z, d: Math.hypot(x - F.stage.x, z - F.stage.z) }));
      const k0 = near.reduce((b, q, i) => q.d < near[b].d ? i : b, 0); if (near[k0].d > 30) continue;
      if (!best || near[k0].d < best.d) best = { L, k0, d: near[k0].d };
    }
    let pts = [];
    if (best) {
      const raw = best.L.pts, out = [[...raw[best.k0]]];
      for (const dir of [-1, 1]) { let len = 0; for (let i = best.k0 + dir; i >= 0 && i < raw.length && len < 20; i += dir) { const a = raw[i - dir], b = raw[i]; len += Math.hypot(b[0] - a[0], b[1] - a[1]); dir < 0 ? out.unshift([...b]) : out.push([...b]); } }
      pts = out;
    }
    if (pts.length < 2 || pts.reduce((a, p, i) => i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0) < 8)
      best = null, pts = [...Array(17)].map((_, i) => [F.stage.x + Math.cos(i / 16 * 6.283) * 9, F.stage.z + Math.sin(i / 16 * 6.283) * 9]);
    const lens = [0]; for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return (F.path = { pts, lens, L: lens[lens.length - 1], road: !!best });
  };
  const along = (path, u) => { // a point u metres along the path, and the way it faces
    const { pts, lens } = path; let i = 1; while (i < pts.length - 1 && lens[i] < u) i++;
    const a = pts[i - 1], b = pts[i], seg = lens[i] - lens[i - 1] || 1, k = Math.max(0, Math.min(1, (u - lens[i - 1]) / seg));
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[0] - a[0], b[1] - a[1])];
  };
  const hideAll = () => { if (walkers) [...walkers, ...crowd].forEach(A => A.root.visible = false); active = null; };

  // ---------- telling the children ----------
  const told = new Set();
  const tell = (h, key, msg, line) => { const k = h.profile.id + '|' + key; if (told.has(k)) return; told.add(k); G.toast(h, msg); if (!G.paused) say(...line); };
  // (the festival follows the real clock, so it is looked at once a second of real time: the frame's dt is capped at
  // 0.05 s, and on a slow phone a second of game time could be many real seconds)
  let E = clock(), lastLook = -1e9;
  world.updaters.push((dt, t) => {
    if (!on() || !fests.length || !G.heroes.length) { hideAll(); carried.forEach(c => c.s.visible = false); return; }
    const nowMs = performance.now();
    if (nowMs - lastLook >= 1000) {
      lastLook = nowMs; E = clock();
      // a player changed (Who's playing?): the carried prizes follow the new children
      if (carried.some(c => !G.heroes.includes(c.h)) || G.heroes.length !== (sync.n ?? G.heroes.length)) sync(); sync.n = G.heroes.length;
      for (const h of G.heroes) {
        const F = fests.reduce((b, f) => !b || dist2(f.x, f.z, h.pos.x, h.pos.z) < dist2(b.x, b.z, h.pos.x, h.pos.z) ? f : b, null), d = F ? dist2(F.x, F.z, h.pos.x, h.pos.z) : 1e9;
        if (d > 70) continue;
        if (E.on) tell(h, E.key + F.k, '🎪 ' + T('The village festival is on! Come to the stage for the parade and a special prize.', 'Hội làng đang diễn ra! Lại sân khấu xem rước và nhận quà đặc biệt nhé.'), HL_LINES.on);
        else if (E.next.inMin <= 5) tell(h, 'soon' + E.next.at + F.k, '🎪 ' + T(`The village festival starts at ${E.next.at}!`, `Hội làng bắt đầu lúc ${E.next.at}!`), HL_LINES.soon);
        else { const last = lastEvent(Date.now(), little()); if (last && d < 50) tell(h, 'missed' + last + F.k + Math.floor(Date.now() / 864e5), '🎪 ' + T(`The village festival has finished. The next one is at ${E.next.at}.`, `Hội làng đã xong. Hội lần tới lúc ${E.next.at}.`), HL_NEXT[E.next.at]); }
      }
      // the festival runs at the village nearest a child (within 80 m)
      let best = null, bd = 80;
      if (E.on) for (const F of fests) for (const h of G.heroes) { const d = dist2(F.x, F.z, h.pos.x, h.pos.z); if (d < bd) { bd = d; best = F; } }
      if (best !== active) { hideAll(); active = best; if (active) { if (!walkers) build(); SFX.chime && SFX.chime(); } }
    }
    // the carried prizes bob beside their children
    const calm = reduceMotion();
    carried.forEach(c => { const h = c.h; c.s.visible = true; c.s.position.set(h.pos.x + Math.cos(h.yaw) * .7, h.pos.y + 1.7 + (calm ? 0 : Math.sin(t * 2 + h.i) * .08), h.pos.z - Math.sin(h.yaw) * .7); });
    if (!active) return;
    const F = active, path = pathFor(F), speed = calm ? .6 : 1.1, span = path.L;
    walkers.forEach((A, i) => {
      // up and down the street, one behind the other
      let u = (t * speed - i * 2.4) % (2 * span); if (u < 0) u += 2 * span;
      // (beside the road, on its verge: the cars and buses keep the road; round the stage when there is no street)
      const back = u > span, [cx, cz, a] = along(path, back ? 2 * span - u : u), side = path.road ? 3.4 : 0, x = cx + Math.cos(a) * side, z = cz - Math.sin(a) * side;
      A.root.visible = true; A.root.position.set(x, heightAt(x, z), z); A.root.rotation.y = back ? a + Math.PI : a;
      A.anim && A.anim('walk', t + i, speed * 2.2);
    });
    crowd.forEach((A, i) => {
      const a = i / crowd.length * 6.283 + .4, x = F.stage.x + Math.cos(a) * 3.8, z = F.stage.z + Math.sin(a) * 3.8;
      A.root.visible = true; A.root.position.set(x, heightAt(x, z), z); A.root.rotation.y = Math.atan2(F.stage.x - x, F.stage.z - z);
      A.anim && A.anim(calm ? 'idle' : (i + Math.floor(t / 3)) % 2 ? 'cheer' : 'wave', t + i, 0);
    });
    // a drum beat now and then while a child is near
    if (!calm && !G.paused && Math.floor(t * 1.2) !== F.beat) { F.beat = Math.floor(t * 1.2); if (F.beat % 4 === 0) tone(110, .18, { type: 'triangle', vol: .08 }); }
  });
  sync();

  // ---------- the Backpack: the prizes, carried or put away (like the kite) ----------
  function bagHTML(p) {
    if (!on()) return '';
    const s = hl(p), have = HL_PRIZES.filter(x => s.prizes.includes(x.id));
    return `<h3>${pic('🎪')} ${T('Village festival prizes', 'Quà hội làng')}</h3><div class="slots">${have.length ? have.map(x => `<button class="slot ${s.carry === x.id && s.carryOn !== false ? 'on' : ''}" data-hlcarry="${x.id}"><span>${pic(x.icon)}</span><small>${T(x.en, x.vi)}</small></button>`).join('')
      : `<p class="note">${T(`Join a village festival (${eventTimes(p.age !== 'big').join(', ')} every day) to win a special prize!`, `Vào hội làng (lúc ${eventTimes(p.age !== 'big').join(', ')} mỗi ngày) để nhận quà đặc biệt!`)}</p>`}</div>`;
  }
  function bindBag(body, h, redraw) {
    body.querySelectorAll('[data-hlcarry]').forEach(b => b.onclick = () => { const s = hl(h.profile), id = b.dataset.hlcarry; if (s.carry === id) s.carryOn = s.carryOn === false; else { s.carry = id; s.carryOn = true; } save(); sync(); SFX.ok && SFX.ok(); redraw && redraw(); });
  }
  return { fests, clock, openFest, givePrize, sync, bagHTML, bindBag, active: () => active, walkers: () => walkers, crowd: () => crowd };
}
