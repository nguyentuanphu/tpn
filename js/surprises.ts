// Surprises (round S, owner plan 8 Oct, ROUND-R item 5): the list, the limit (about 3 a session) and the choosing are
// in js/content/surprises.js (unit tested); this is the valley side. A surprise is chosen only when it can be enjoyed
// (stars at night, the rainbow just after a shower, the rainbow lotus with the child near Lotus Village's pond), comes
// only when the child is free (no window, game or speech box open), a few metres in front of them, and waits: if the
// child walks far away it comes back to them when they are free again, so it is never "missed".
//   rainbow lotus   a flower in seven colours on the lotus pond (keepsake + sticker)
//   golden butterfly  flies on three times as the child comes close, then lands on a flower (sticker)
//   treasure map    one piece a day; with all three the chest turns up (coins + keepsake)
//   fairy glade     glowing stepping stones lead to a ring of mushrooms and a fairy (keepsake)
//   rainbow         after a shower, the rainbow's end stands right here (sticker)
//   shooting stars  at night, a few streaks across the sky: make a wish (sticker)
//   rare visitors   a red-crowned crane, a koala, a little fairy (keepsake each)
// Cheap: at most one surprise in the valley at a time, a few merged meshes or drawn sprites, built when it comes and
// removed when found. Calm mode (reduceMotion): nothing streaks or flutters; the butterfly glides slowly.
// Studio switch 'surprises' (js/content/releases.js). Kept in profile.surprises.
import { THREE, P, merge, toonVC, sprite } from './gfx.js';
import { T } from './i18n.js';
import { SFX } from './audio.js';
import { reduceMotion, saveProfiles } from './state.js';
import { heightAt, roadDist, WATER, VILLAGE } from './world.js';
import { buildAvatar } from './avatar.js';
import { animalModel } from './animals.js';
import { featureOn } from './custom.js';
import { gameOpen } from './games/frame.js';
import { DECOR } from './myhouse.js';
import { dist2 } from './util.js';
import { aestDay } from './content/hoilang.js';
import { SURPRISES, SP_KEEPSAKES, SP_LINES, pickSurprise, surpriseShown, surpriseFound } from './content/surprises.js';

const POND = { x: VILLAGE.x - 10, z: VILLAGE.z + 4 };   // Lotus Village's lotus pond (js/world.js)
const byId = id => SURPRISES.find(s => s.id === id);

export function createSurprises(G, { say, reward }) {
  const { scene, world } = G, on = () => G.keep ? G.keep('surprises') : featureOn('surprises', true);   // (batch rollout: kept for a child who found one)
  for (const [k, v] of Object.entries(SP_KEEPSAKES)) DECOR[k] = { icon: v.icon, price: 0, en: v.en, vi: v.vi, keepsake: true };
  const rec = p => { const s = p.surprises = p.surprises && typeof p.surprises === 'object' ? p.surprises : {}; s.found = s.found && typeof s.found === 'object' ? s.found : {}; s.map = Math.min(3, +s.map || 0); return s; };
  let st = { shown: 0, lastAt: -1e9, pending: null }, play = 0, cur = null;
  const done = {};   // this session
  const isFree = () => !G.paused && !gameOpen() && !document.querySelector('.dialog, .modal, .songs, .theatre, .resttime, .dancebreak, .bedtime');
  const calm = () => reduceMotion();

  // ---------- where: a clear spot a few metres in front of the child, off the roads ----------
  const okAt = (x, z) => { const r = roadDist(x, z); return r.d > r.road.w / 2 + 1.5 && heightAt(x, z) > WATER + .4; };
  function spotNear(h, ahead = 6) {
    for (const turn of [0, .5, -.5, 1, -1, 1.6, -1.6, 3.1]) for (const d of [ahead, ahead + 3, ahead - 2]) {
      const a = h.yaw + turn, [x, z] = G.clearSpot(h.pos.x + Math.sin(a) * d, h.pos.z + Math.cos(a) * d, .8);
      if (okAt(x, z) && dist2(x, z, h.pos.x, h.pos.z) > 2.5) return [x, z];
    }
    return null;
  }
  // ---------- the things themselves (cheap: merged meshes and drawn sprites) ----------
  const RB = ['#ff4f5e', '#ff9f43', '#ffd23f', '#5fd36a', '#3cc7e8', '#6a5cf6', '#b06af6'];
  const mesh = parts => new THREE.Mesh(merge(parts), toonVC());
  const lotusMesh = () => mesh([P(new THREE.CircleGeometry(.8, 14).rotateX(-Math.PI / 2), '#3f9a45', [0, 0, 0]),
    ...RB.map((c, k) => P(new THREE.ConeGeometry(.2, .7, 4), c, [Math.cos(k * .9) * .2, .3, Math.sin(k * .9) * .2], [Math.cos(k * .9) * .5, 0, Math.sin(k * .9) * .5])), P(new THREE.SphereGeometry(.12, 8, 6), '#ffe66b', [0, .35, 0])]);
  const chestMesh = () => mesh([P(new THREE.BoxGeometry(1, .6, .7), '#9a5a2a', [0, .3, 0]), P(new THREE.CylinderGeometry(.35, .35, 1, 10, 1, false, 0, Math.PI), '#b06a32', [0, .6, 0], [0, 0, Math.PI / 2]),
    P(new THREE.BoxGeometry(1.04, .1, .74), '#ffd23f', [0, .6, 0]), P(new THREE.BoxGeometry(.16, .2, .06), '#ffd23f', [0, .55, .37])]);
  const rainbowMesh = () => mesh(RB.map((c, k) => P(new THREE.TorusGeometry(1.6 - k * .12, .07, 5, 18, Math.PI), c, [0, 0, 0])));
  const ringMesh = () => mesh([...Array(7)].flatMap((_, k) => { const a = k / 7 * 6.283, x = Math.cos(a) * 1.4, z = Math.sin(a) * 1.4;
    return [P(new THREE.CylinderGeometry(.07, .09, .3, 6), '#fff6e4', [x, .15, z]), P(new THREE.SphereGeometry(.22, 8, 5, 0, 6.283, 0, Math.PI / 2), k % 2 ? '#ff5f7a' : '#ff9f43', [x, .3, z])]; }));
  const stoneMat = new THREE.MeshBasicMaterial({ color: '#fff3a0' });
  const fairyLook = { style: 'dress', color: '#ffb6e6', hat: 'flower', back: 'wings', hair: '#e8c26a', hairStyle: 'long', skin: '#ffe3d1', glider: 0 };
  const visitors = {};
  const visitor = kind => visitors[kind] || (visitors[kind] = kind === 'fairy' ? (() => { const A = buildAvatar(fairyLook, null); A.root.scale.setScalar(.55); A.root.userData.A = A; return A.root; })() : animalModel(kind));

  // ---------- one surprise in the valley ----------
  function place(id, h) {
    const S = byId(id), g = new THREE.Group(), C = { id, S, g, h, x: 0, z: 0, hop: 0, parts: [] };
    let at = S.where === 'pond' ? [POND.x + 1.8, POND.z + 1.2] : spotNear(h, id === 'stars' ? 3 : id === 'glade' ? 4 : 6);
    if (!at) return null;
    [C.x, C.z] = at;
    if (id === 'lotus') { const m = lotusMesh(); m.position.y = .18; g.add(m); C.spin = m; }
    else if (id === 'butterfly') { const s = sprite('🦋', .8); s.material = s.material.clone(); s.material.color.set('#ffe066'); s.position.y = 1.2; g.add(s); C.fly = s; }
    else if (id === 'map') { const s = sprite('🗺️', .9); s.position.y = .7; g.add(s); C.bob = s; }
    else if (id === 'chest') { g.add(chestMesh()); const s = sprite('✨', .7); s.position.y = 1.3; g.add(s); C.bob = s; }
    else if (id === 'rainbow') { const m = rainbowMesh(); g.add(m); const s = sprite('✨', .6); s.position.y = .5; g.add(s); C.bob = s; }
    else if (id === 'stars') {
      C.streaks = [0, 1, 2].slice(0, calm() ? 1 : 3).map(k => { const s = sprite('🌠', 2.2); s.material = s.material.clone(); scene.add(s); C.parts.push(s); return { s, t0: k * 1.6 }; });
      const s = sprite('🌙', .7); s.position.y = 1.4; g.add(s); C.bob = s;
    }
    else if (id === 'glade') {
      // glowing stepping stones from here to the glade, about 14 m on, which must be clear ground too
      const a = Math.atan2(C.x - h.pos.x, C.z - h.pos.z); let end = null;
      for (const turn of [0, .5, -.5, 1, -1]) { const [ex, ez] = G.clearSpot(C.x + Math.sin(a + turn) * 14, C.z + Math.cos(a + turn) * 14, 1.6); if (okAt(ex, ez)) { end = [ex, ez]; break; } }
      if (!end) return null;
      for (let k = 0; k < 6; k++) { const f = k / 5, sx = C.x + (end[0] - C.x) * f, sz = C.z + (end[1] - C.z) * f, s = new THREE.Mesh(new THREE.CylinderGeometry(.35, .4, .08, 10), stoneMat);
        s.position.set(sx, heightAt(sx, sz) + .05, sz); scene.add(s); C.parts.push(s); }
      [C.x, C.z] = end; g.add(ringMesh()); const f = sprite('🧚', 1); f.position.y = 1.2; g.add(f); C.bob = f;
    }
    else if (S.visitor) { const v = visitor(S.visitor); g.add(v); g.rotation.y = Math.atan2(h.pos.x - C.x, h.pos.z - C.z); C.visitor = v; if (S.visitor === 'fairy') { v.position.y = .5; C.bob = v; } }
    g.position.set(C.x, heightAt(C.x, C.z) + (id === 'lotus' ? .1 : 0), C.z); scene.add(g);
    C.it = { id: 'surprise', get x() { return C.x; }, get z() { return C.z; }, get r() { return id === 'lotus' ? 4.6 : id === 'stars' ? 6 : 2.6; }, icon: S.icon, bubble: S.icon,
      visible: () => on() && cur === C && (id !== 'butterfly' || C.hop >= 3),
      label: () => id === 'stars' ? T('Make a wish', 'Ước một điều') : T(S.en, S.vi), act: hh => found(hh, C) };
    G.interactables.push(C.it);
    return C;
  }
  function remove(C) {
    if (!C) return; scene.remove(C.g); C.parts.forEach(o => scene.remove(o));
    if (C.visitor) C.g.remove(C.visitor);
    const i = G.interactables.indexOf(C.it); if (i >= 0) G.interactables.splice(i, 1);
  }
  const giveSticker = (p, e) => { if (e && G.STICKERS && G.STICKERS.includes(e) && !p.stickers.includes(e)) { p.stickers.push(e); return e; } return G.giveSticker ? G.giveSticker(p) : null; };
  const giveKeepsake = (p, k) => { p.keepsakes = Array.isArray(p.keepsakes) ? p.keepsakes : []; if (p.keepsakes.includes(k)) return false; p.keepsakes.push(k); return true; };
  async function found(h, C) {
    if (cur !== C) return;
    const p = h.profile, s = rec(p), S = C.S; cur = null; st = surpriseFound(st); G.tried && G.tried(h, 'surprises');
    s.found[C.id] = (s.found[C.id] || 0) + 1;
    SFX.chime && SFX.chime(); G.fx && G.fx(C.x, heightAt(C.x, C.z) + 1.2, C.z, S.icon);
    let title = T(S.en, S.vi) + '!', sub = '', line = SP_LINES.found;
    if (C.id === 'map') { s.map = Math.min(3, s.map + 1); s.mapDay = aestDay(); title = T(`Map piece ${s.map} of 3!`, `Mảnh bản đồ ${s.map}/3!`); sub = s.map < 3 ? T('Come back tomorrow for the next piece.', 'Mai quay lại tìm mảnh tiếp nhé.') : T('All three! The treasure chest will turn up soon.', 'Đủ ba mảnh rồi! Rương kho báu sắp xuất hiện.'); line = SP_LINES.piece; }
    else if (C.id === 'chest') { s.chest = true; G.addCoins && G.addCoins(25); giveKeepsake(p, S.keepsake); sub = T('+25 coins and a treasure chest for your house.', '+25 đồng và một rương kho báu cho nhà con.'); line = SP_LINES.keepsake; }
    else if (C.id === 'glade') { giveKeepsake(p, S.keepsake); giveSticker(p, null); sub = T('A ring of mushrooms for your house, and a sticker.', 'Một vòng nấm cho nhà con, và một hình dán.'); line = SP_LINES.glade; }
    else if (C.id === 'stars') { const e = giveSticker(p, S.sticker); sub = e ? T(`A new sticker ${e}!`, `Hình dán mới ${e}!`) : ''; line = SP_LINES.wish; }
    else {
      // (a visitor met again: its keepsake is already in the house, so a sticker instead; never nothing)
      const kept = S.keepsake ? giveKeepsake(p, S.keepsake) : false, e = S.sticker || (S.keepsake && !kept) ? giveSticker(p, S.sticker || null) : null;
      sub = [kept ? T('A keepsake for your house.', 'Một kỷ vật cho nhà con.') : '', e ? T(`A new sticker ${e}!`, `Hình dán mới ${e}!`) : ''].filter(Boolean).join(' '); line = kept ? SP_LINES.keepsake : SP_LINES.found; }
    saveProfiles();
    // a visitor waves goodbye first; everything else goes at once
    if (C.visitor && C.visitor.userData.A) C.visitor.userData.A.anim('wave', 0, 0);
    setTimeout(() => remove(C), C.visitor ? 2500 : 0);
    say(...line); await reward(S.icon, title, sub);
  }

  // ---------- choosing and waiting ----------
  // (looked at once a second of real time: a frame's dt is capped at 0.05 s, so on a slow phone a second of game time
  // could be many real seconds; the free-play minutes still count game time)
  let lastLook = -1e9, farT = 0, toldWait = false;
  world.updaters.push((dt, t) => {
    if (!on() || !G.heroes.length) { if (cur) { remove(cur); cur = null; st = surpriseFound(st); st.shown = Math.max(0, st.shown - 1); } return; }
    const free = isFree(); if (free) play += dt;
    // the thing that is out moves a little
    if (cur) animate(cur, dt, t);
    const nowMs = performance.now(); if (nowMs - lastLook < 1000) return; lastLook = nowMs;
    const h = G.heroes.reduce((b, x) => !cur ? b : dist2(x.pos.x, x.pos.z, cur.x, cur.z) < dist2(b.pos.x, b.pos.z, cur.x, cur.z) ? x : b, G.heroes[0]);
    if (cur) {
      // waiting: if the child went far away, it comes back to them when they are free (never missed); the lotus stays on its pond
      const d = dist2(h.pos.x, h.pos.z, cur.x, cur.z);
      if (cur.S.where === 'near' && d > 35 && free) { farT += 1; if (farT >= 3) { farT = 0; const id = cur.id; remove(cur); cur = place(id, h); if (cur) { if (!toldWait) { toldWait = true; G.toast(h, '✨ ' + T('A surprise is still waiting for you!', 'Vẫn còn một điều bất ngờ đang chờ con!')); say(...SP_LINES.waiting); } } else st = surpriseFound(st); } }
      else farT = 0;
      return;
    }
    if (!free) return;
    const p = h.profile, s = rec(p), W = G.weather;
    const id = pickSurprise(st, { play, night: !!(world.isNight && world.isNight()), afterRain: !!(W && W.state && W.state() === 'after'), nearPond: dist2(h.pos.x, h.pos.z, POND.x, POND.z) < 30,
      mapPieces: s.map, mapToday: s.mapDay === aestDay(), chest: !!s.chest, done });
    if (!id) return;
    const C = place(id, h); if (!C) { done[id] = true; return; }
    cur = C; C.h = h; done[id] = true; st = surpriseShown(st, id, play); toldWait = false;
    SFX.secret ? SFX.secret() : SFX.chime && SFX.chime();
    G.toast(h, '✨ ' + T(C.S.en, C.S.vi) + '!'); say(...C.S.say);
  });
  function animate(C, dt, t) {
    const quiet = calm();
    if (C.spin && !quiet) C.spin.rotation.y += dt * .4;
    if (C.bob) C.bob.position.y = (C.id === 'chest' ? 1.3 : C.visitor ? .5 : C.id === 'glade' ? 1.2 : C.id === 'stars' ? 1.4 : C.id === 'rainbow' ? .5 : .7) + (quiet ? 0 : Math.sin(t * 2) * .12);
    if (C.streaks) C.streaks.forEach(S => { const k = ((t - (C.t0 ?? (C.t0 = t)) - S.t0) % (quiet ? 8 : 5)) / (quiet ? 4 : 1.6), on = k >= 0 && k <= 1;
      S.s.visible = on; if (!on) return; const h = C.h, a = h.camYaw + Math.PI, fx = Math.sin(a), fz = Math.cos(a);
      S.s.position.set(h.pos.x + fx * 60 + Math.cos(a) * (-30 + k * 60), h.pos.y + 34 - k * 12, h.pos.z + fz * 60 - Math.sin(a) * (-30 + k * 60)); S.s.material.opacity = Math.sin(k * Math.PI); });
    if (C.fly) {
      // the golden butterfly: flutters on the spot; when the child comes within 3 m it flies on (three times), then lands
      if (!quiet) C.fly.position.y = 1.2 + Math.sin(t * 5) * .15;
      if (C.go) { const k = Math.min(1, (performance.now() - C.go.t0) / (quiet ? 4000 : 2000)); C.x = C.go.x0 + (C.go.x1 - C.go.x0) * k; C.z = C.go.z0 + (C.go.z1 - C.go.z0) * k;
        C.g.position.set(C.x, heightAt(C.x, C.z) + Math.sin(k * Math.PI) * 2, C.z); if (k >= 1) { C.go = null; if (C.hop >= 3) { G.toast(C.h, '🦋 ' + T('It landed on a flower. Touch it gently.', 'Bướm đậu trên bông hoa rồi. Chạm nhẹ thôi nhé.')); say(...SP_LINES.landed); const f = sprite('🌸', .6); f.position.y = .4; C.g.add(f); } } }
      else if (C.hop < 3 && G.heroes.some(h => dist2(h.pos.x, h.pos.z, C.x, C.z) < 3)) {
        const h = G.heroes.find(x => dist2(x.pos.x, x.pos.z, C.x, C.z) < 3), a = Math.atan2(C.x - h.pos.x, C.z - h.pos.z);
        let to = null; for (const turn of [0, .6, -.6, 1.2, -1.2]) { const [x, z] = G.clearSpot(C.x + Math.sin(a + turn) * 7, C.z + Math.cos(a + turn) * 7, .8); if (okAt(x, z)) { to = [x, z]; break; } }
        to = to || [C.x + Math.sin(a) * 4, C.z + Math.cos(a) * 4]; C.hop++; C.go = { t0: performance.now(), x0: C.x, z0: C.z, x1: to[0], z1: to[1] };
      }
    }
  }
  return { state: () => ({ ...st, play, cur: cur && cur.id }), current: () => cur, place: (id, h = G.heroes[0]) => { if (cur) remove(cur); cur = place(id, h); if (cur) { done[id] = true; st = surpriseShown(st, id, play); } return cur; },
    found: (h, C = cur) => found(h, C), setPlay: s => { play = s; }, reset: () => { if (cur) remove(cur); cur = null; st = { shown: 0, lastAt: -1e9, pending: null }; play = 0; Object.keys(done).forEach(k => delete done[k]); } };
}
