// Bà Huệ and ông Nghi's yard (round R story; content and placeholder names in js/content/yard.js). A transport and
// building yard near the Huệ Nghi shop on Phố Hai Quê, run by their son Anh 2: a stone pile, a building site, a site
// office, a dump truck (xe ben) and an excavator (máy xúc). A side story the child starts by asking bà Huệ: meet the
// coach from Hà Tĩnh, give each relative a job, haul earth and stone, dig the foundations, build a house together,
// then a house-warming meal. Afterwards the truck and the excavator stay for free play.
// Progress: profile.yard = { done: { stepId: true }, jobs: { relId: jobIndex } }. Studio switch 'story_yard'.
import { THREE, P, merge, toonVC } from './gfx.js';
import { T, nm } from './i18n.js';
import { heightAt, YARD, TOWN } from './world.js';
import { featureOn, markTried } from './custom.js';
import { buildAvatar, nameAvatar } from './avatar.js';
import { build } from './vehicles.js';
import { openRoom } from './openspot.js';
import { pic } from './art.js';
import { pad, frames, holdable, slot, until, QUIT } from './handpad.js';
import { YARD_STEPS, YARD_LINES, RELATIVES, JOBS, ANH2, COACH, GUESTS } from './content/yard.js';

const st = p => { const s = p.yard = p.yard && typeof p.yard === 'object' ? p.yard : {}; s.done = s.done || {}; s.jobs = s.jobs || {}; return s; };
const look = ([style, color, hair, hairStyle]) => ({ style, color, hat: 'none', back: 'none', hair, hairStyle, skin: '#e2b088', glider: 0 });
const ease = u => u < .5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
const tween = (sec, fn) => new Promise<void>(res => { const t0 = performance.now(); const step = () => { const u = Math.min(1, (performance.now() - t0) / 1000 / sec); fn(ease(u), u); if (u < 1) requestAnimationFrame(step); else res(); }; step(); });

export function createYard(G, { dialog, say, reward, save }) {
  const { scene, world } = G;
  const on = () => G.keep ? G.keep('story_yard') : featureOn('story_yard', true);   // (batch rollout: kept for a child who started it)
  const done = (p, id) => !!st(p).done[id];
  const current = p => { if (!on() || !done(p, 'y_start')) return null; return YARD_STEPS.find(s => !done(p, s.id)) || null; };
  const isOn = (p, id) => { const c = current(p); return !!c && c.id === id; };
  const finish = (h, id) => { const Y = st(h.profile); if (Y.done[id]) return; Y.done[id] = true; markTried(h.profile, 'story_yard'); if (hands()) markTried(h.profile, 'yardHands'); save(); paint(); G.checkQuests && G.checkQuests(h); };
  const anyDone = id => G.heroes.some(h => done(h.profile, id));

  // ---------- where: its own levelled plot behind the north row of Phố Hai Quê (world.js YARD), facing the street;
  // drawn 18 x 14 and built at S = 0.8 of that ----------
  const shop = G.interactables.find(i => i.id === 'npc_bahue') || { x: TOWN.x - 19, z: TOWN.z - 12 };
  const S = .8, X = YARD.x, Z = YARD.z, Y0 = heightAt(X, Z), ry = YARD.rot;
  const spot = { x: X, z: Z, room: openRoom(G, X, Z) };
  const yard = new THREE.Group(); yard.position.set(X, Y0, Z); yard.rotation.y = ry; yard.scale.setScalar(S); scene.add(yard);
  const W = (lx, lz) => { const v = new THREE.Vector3(lx * S, 0, lz * S).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry); return { x: X + v.x, z: Z + v.z }; };

  // the ground, a fence round three sides, the site office with its sign, the stone pile
  const parts = [P(new THREE.BoxGeometry(18, .06, 14), '#b9ab94', [0, .03, 0])];
  for (let i = -9; i <= 9; i += 1.5) parts.push(P(new THREE.BoxGeometry(.12, 1.1, .12), '#8a8f94', [i, .55, -7]));
  for (let i = -7; i <= 6; i += 1.5) for (const s of [-1, 1]) parts.push(P(new THREE.BoxGeometry(.12, 1.1, .12), '#8a8f94', [s * 9, .55, i]));
  parts.push(P(new THREE.BoxGeometry(18, .08, .06), '#c8322a', [0, .95, -7]), ...[-1, 1].map(s => P(new THREE.BoxGeometry(.06, .08, 14), '#c8322a', [s * 9, .95, 0])));
  parts.push(P(new THREE.BoxGeometry(3.2, 2.5, 2.6), '#f2ead6', [6.6, 1.25, -5.2]), P(new THREE.BoxGeometry(3.6, .15, 3.0), '#5a8ab8', [6.6, 2.58, -5.2]),
    P(new THREE.BoxGeometry(.9, 1.8, .06), '#6a4a2e', [6.0, .9, -3.88]), P(new THREE.BoxGeometry(.8, .6, .06), '#33485a', [7.4, 1.5, -3.88]));
  for (let k = 0; k < 14; k++) { const a = k * 2.4, r = (k % 5) * .45; parts.push(P(new THREE.IcosahedronGeometry(.45 + (k % 3) * .2, 0), k % 2 ? '#8e8a84' : '#a7a29a', [-6 + Math.cos(a) * r, .35 + (k % 4) * .18, -4 + Math.sin(a) * r], [k, k * 2, 0])); }
  const base = new THREE.Mesh(merge(parts), toonVC()); base.receiveShadow = base.castShadow = true; yard.add(base);
  const sign = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#f7f7f4'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#d2232a'; g.font = '900 52px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HUỆ NGHI', 256, 52);
    g.fillStyle = '#2b3a8a'; g.font = '700 28px "Baloo 2", Fredoka, sans-serif'; g.fillText('CÔNG TRƯỜNG · VẬN TẢI', 256, 102);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(3, .75), new THREE.MeshBasicMaterial({ map: t })); m.position.set(6.6, 3.1, -3.88); return m; })();
  yard.add(sign);
  // the building site: a pit that is dug, a heap of earth from the truck, walls that rise and a roof
  const SITE = [3, 1];
  const pit = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, .04, 24), new THREE.MeshToonMaterial({ color: '#5a4636' })); pit.scale.set(1.2, 1, .9); pit.position.set(SITE[0], .07, SITE[1]); yard.add(pit);
  const heap = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.2, 10), new THREE.MeshToonMaterial({ color: '#8a7a68' })); heap.position.set(SITE[0] - 4, .6, SITE[1] + 2.5); yard.add(heap);
  const walls = new THREE.Group(); walls.position.set(SITE[0], .06, SITE[1]); yard.add(walls); walls.userData.noSolid = true;
  walls.add(new THREE.Mesh(merge([P(new THREE.BoxGeometry(5, 1, .3), '#c8644a', [0, .5, -1.8]), ...[-1, 1].map(s => P(new THREE.BoxGeometry(.3, 1, 3.6), '#c8644a', [s * 2.35, .5, 0])),
    P(new THREE.BoxGeometry(1.6, 1, .3), '#c8644a', [-1.7, .5, 1.8]), P(new THREE.BoxGeometry(1.6, 1, .3), '#c8644a', [1.7, .5, 1.8]),
    ...[0, 1, 2].map(k => P(new THREE.BoxGeometry(5.04, .04, 3.64), '#e8dcc8', [0, .25 + k * .33, 0]))]), toonVC()));
  const roof = new THREE.Mesh(merge([P(new THREE.ConeGeometry(3.9, 1.6, 4), '#b8402e', [0, .8, 0], [0, Math.PI / 4, 0], [1, 1, .78])]), toonVC()); roof.position.set(SITE[0], 2.6, SITE[1]); yard.add(roof);
  // the coach (at the yard's open side), the dump truck and the excavator
  const coach = build('coach').o, truck = build('dumpTruck'), digger = build('excavator');
  coach.position.set(-3, 0, 10.5); coach.rotation.y = Math.PI / 2; yard.add(coach); coach.userData.noSolid = true; // (it comes and goes with the story: never an invisible wall)
  truck.o.position.set(-5.5, 0, 2.5); truck.o.rotation.y = Math.PI / 2; yard.add(truck.o);
  digger.o.position.set(SITE[0] + .5, 0, SITE[1] - 5); digger.o.rotation.y = 0; yard.add(digger.o);
  // (owner, 29 Oct AEDT) the truck and the excavator drive and dig in the story, so they are left out of the still solid
  // map: they were walls where they were first parked, wherever they had gone
  truck.o.userData.noSolid = digger.o.userData.noSolid = true;
  const TU = truck.o.userData, DU = digger.o.userData;
  // solid things
  for (const [lx, lz, hw, hd] of [[6.6, -5.2, 1.7, 1.4], [-6, -4, 1.4, 1.4]]) { const c = W(lx, lz), r = Math.max(hw, hd) * S; world.boxes.push({ x0: c.x - r, x1: c.x + r, z0: c.z - r, z1: c.z + r }); }

  // ---------- people: Anh 2 at the office, the three relatives (by the coach, then at their jobs) ----------
  const people = [];
  const person = (lk, name) => { const A = nameAvatar(buildAvatar(look(lk), null), name); scene.add(A.root); people.push(A); return A; };
  const anh2 = person(ANH2.look, ANH2.name);
  const rel = RELATIVES.map(r => ({ r, A: person(r.look, r.name) }));
  // the rest of the family off the coach, waving beside it until everyone has a job
  const COLORS = ['#7a5aa8', '#d8a83a', '#3a8a8a', '#a84a5a'];
  // the family who come to the house-warming meal, by the Huệ Nghi shop
  const guests = GUESTS.map(g => ({ g, A: person(g.look, g.name) }));
  guests.forEach(({ A }, k) => { A.root.position.set(shop.x + 2.4 + k * 1.1, heightAt(shop.x + 2.4 + k * 1.1, shop.z + 2.2), shop.z + 2.2); A.root.rotation.y = Math.PI; });
  const others = COACH.map((n, k) => person(['shirt', COLORS[k % 4], '#2a2a2a', /^O |^Chị /.test(n) ? 'long' : 'short'], n));
  const JOB_AT: [number, number][] = [[-5.5, 5.2], [SITE[0] - 3.2, SITE[1] + 3.2], [SITE[0] + 3.5, SITE[1] - 5]];
  const putAt = (A, lx, lz, face = 0) => { const c = W(lx, lz); A.root.position.set(c.x, heightAt(c.x, c.z), c.z); A.root.rotation.y = ry + face; A.root.userData.lx = lx; A.root.userData.lz = lz; };
  putAt(anh2, 5.2, -2.8, .3);

  // what the yard shows: the stage the furthest child has reached
  function paint() {
    const arrived = anyDone('y_start'), met = anyDone('y_coach');
    coach.visible = arrived && !anyDone('y_jobs');
    rel.forEach(({ A }, k) => {
      A.root.visible = arrived;
      if (!met) putAt(A, -4.5 + k * 1.3, 8.3, Math.PI); else putAt(A, ...JOB_AT[k], Math.PI);
    });
    others.forEach((A, k) => { A.root.visible = coach.visible; putAt(A, 1 + k * 1.3, 8.6, Math.PI); });
    guests.forEach(({ A }) => { A.root.visible = anyDone('y_build'); });
    heap.visible = anyDone('y_truck') && !anyDone('y_build');
    pit.scale.set(anyDone('y_dig') ? 1.2 : .01, 1, anyDone('y_dig') ? .9 : .01); pit.visible = anyDone('y_dig');
    const built = anyDone('y_build');
    walls.visible = built; walls.scale.y = 2.6; roof.visible = built; roof.position.y = 2.6; roof.rotation.y = 0;
  }
  // (audit, 9 Oct) the yard is drawn before a child is chosen: draw it again whenever the children playing change
  let who = '';
  world.updaters.push(() => { const k = G.heroes.map(h => h.profile && h.profile.id).join(','); if (k !== who) { who = k; paint(); } });
  world.updaters.push((dt, t) => {
    if (!G.heroes.some(h => Math.abs(h.pos.x - X) < 60 && Math.abs(h.pos.z - Z) < 60)) return;
    people.forEach((A, k) => { if (A.root.visible) A.anim('idle', t + k * .9, 0); });
  });

  // ---------- the steps ----------
  const spots = {
    hue: () => ({ x: shop.x, z: shop.z }),
    coach: () => W(-1.5, 9.2), relatives: () => W(-1, 4), truck: () => W(-5.5, 5), digger: () => W(SITE[0] + 3, SITE[1] - 3), site: () => W(SITE[0], SITE[1] + 3.5)
  };
  const btn = (id, at, r, icon, label, visible, act) => { const g = () => (typeof at === 'function' ? at() : at); G.interactables.push({ id, get x() { return g().x; }, get z() { return g().z; }, r, icon, label, visible: h => !busy.size && visible(h), act }); };
  const busy = new Set(); // (one thing at a time in the yard)
  const run = async (key, h, fn) => { if (busy.has(key)) return; busy.add(key); G.paused = true;
    try { await fn(); } catch (e) { if (e !== QUIT) throw e; reset(); } finally { busy.delete(key); G.paused = false; } };
  // (a hands-on panel closed with ✕: the machines go back to where they wait and the step can be tried again)
  function reset() {
    truck.o.position.set(-5.5, 0, 2.5); truck.o.rotation.y = Math.PI / 2; TU.bed.rotation.x = 0; TU.load.visible = false;
    DU.boom.rotation.x = -.5; DU.arm.rotation.x = 1.3; DU.bucket.rotation.x = .4; DU.turn.rotation.y = 0;
    paint();
  }

  // 1. bà Huệ tells how it began
  btn('yard_start', () => ({ x: shop.x + 1.2, z: shop.z + 1.6 }), 2.4, '🏗️', () => T('Ask about the new yard', 'Hỏi về công trường mới'), h => on() && !done(h.profile, 'y_start'),
    h => run('start', h, async () => { await dialog('Bà Huệ', featureOn('shortTalk', true) ? YARD_LINES.startShort : YARD_LINES.start); finish(h, 'y_start');
      const hud = G.huds && G.huds[h.i]; hud && hud.toast && hud.toast(T('Bà Huệ\'s yard is in your side stories (Pad, Adventures)', 'Công trường của bà Huệ có trong truyện phụ (Sổ tay, Nhiệm vụ)')); }));
  // 2. the coach
  btn('yard_coach', spots.coach, 3, '🚌', () => T('Welcome the family', 'Đón người nhà'), h => isOn(h.profile, 'y_coach'),
    h => run('coach', h, async () => { await dialog(RELATIVES[0].name, YARD_LINES.coach); finish(h, 'y_coach'); }));
  // 3. a job for each one
  rel.forEach(({ r, A }) => btn('yard_job_' + r.id, () => ({ x: A.root.position.x + .6, z: A.root.position.z + .6 }), 2.2, '👷', () => T(`Ask ${nm(r.name)}`, `Hỏi ${nm(r.name)}`),
    h => isOn(h.profile, 'y_jobs') && st(h.profile).jobs[r.id] == null,
    h => run('job', h, async () => {
      await dialog(r.name, [r.hello]);
      const k = await dialog('Anh 2', [YARD_LINES.jobAsk], JOBS);
      if (k === r.job) { await dialog(r.name, [YARD_LINES.jobRight]); st(h.profile).jobs[r.id] = k; save(); }
      else { await dialog(r.name, [YARD_LINES.jobWrong]); return; }
      if (RELATIVES.every(x => st(h.profile).jobs[x.id] != null)) finish(h, 'y_jobs');
    })));
  // 4. the dump truck: load at the stone pile, drive to the site, tip it out
  async function haul() {
    const from = [-5.5, -1.2], to = [SITE[0] - 4, SITE[1] + 4.5];
    await tween(1.2, u => { truck.o.position.set(-5.5, 0, 2.5 + (from[1] - 2.5) * u); });
    TU.load.visible = true; await tween(.6, () => { });
    say(...YARD_LINES.truckGo);
    const a0 = truck.o.position.clone(), turn0 = truck.o.rotation.y;
    await tween(4, u => { truck.o.position.set(a0.x + (to[0] + 1.5 - a0.x) * u, 0, a0.z + (to[1] - 2.5 - a0.z) * u); truck.wheels.forEach(w => { w.rotation.x += .12; }); truck.o.rotation.y = turn0 + Math.sin(u * Math.PI) * .25; });
    return to;
  }
  async function tip() {
    await tween(1.2, u => { TU.bed.rotation.x = -u * .9; });
    TU.load.visible = false; heap.visible = true; heap.scale.setScalar(.2);
    await tween(.8, u => { heap.scale.setScalar(.2 + u * .8); });
    await tween(1, u => { TU.bed.rotation.x = -(1 - u) * .9; });
  }
  async function parkTruck() { const a = truck.o.position.clone(); await tween(2, u => { truck.o.position.set(a.x + (-5.5 - a.x) * u, 0, a.z + (2.5 - a.z) * u); }); truck.o.rotation.y = Math.PI / 2; }
  // ---------- by hand (Studio switch yardHands, owner 9 Oct: "more doing, less watching") ----------
  // A small panel at the bottom of the child's own half: big buttons and handles a 4-year-old can hold and drag. Every
  // part speaks what to do. data-hp names each control (the checks press them like a child would).
  const hands = () => G.keep ? G.keep('yardHands') : featureOn('yardHands', true);
  let driver = null;
  async function truckByHand() {
    G.paused = false; // (the valley keeps running so the camera follows; the yard's buttons hide while this is open)
    // load: tap the stones three times
    const from = [-5.5, -1.2], to = [SITE[0] - 4, SITE[1] + 4.5];
    await tween(1, u => { truck.o.position.set(-5.5, 0, 2.5 + (from[1] - 2.5) * u); });
    let p = pad(`<p>${T('Tap the stones to load the truck!', 'Chạm vào đá để xúc lên xe!')}</p><button class="hp-big" data-hp="load">${pic('🪨')}</button><div class="hp-bar"><i></i></div>`);
    say(...YARD_LINES.handLoad);
    await until(new Promise<void>(res => { let n = 0; p.querySelector<HTMLElement>('[data-hp=load]').onclick = () => { n++; TU.load.visible = true; TU.load.scale.set(.4 + n * .2, .15 + n * .1, .6 + n * .4); p.querySelector<HTMLElement>('.hp-bar i').style.width = (n / 3 * 100) + '%'; if (n >= 3) res(); }; }), p);
    p.remove();
    // drive: hold the pedal; the truck rolls to the building site while it is held
    p = pad(`<p>${T('Hold the pedal to drive!', 'Giữ bàn đạp để lái xe!')}</p><button class="hp-big hp-pedal" data-hp="pedal">${pic('🚚')}</button><div class="hp-bar"><i></i></div>`);
    say(...YARD_LINES.handDrive);
    const pedal = holdable(p.querySelector('[data-hp=pedal]')), a0 = truck.o.position.clone(), turn0 = truck.o.rotation.y; let u = 0;
    await frames(dt => { if (pedal.down) { u = Math.min(1, u + dt * .3); truck.wheels.forEach(w => { w.rotation.x += dt * 6; }); }
      truck.o.position.set(a0.x + (to[0] + 1.5 - a0.x) * u, 0, a0.z + (to[1] - 2.5 - a0.z) * u);
      // the child walks beside the cab, so the camera follows the truck
      if (driver) { const c = W(truck.o.position.x + 2.2, truck.o.position.z + 1); driver.pos.x = c.x; driver.pos.z = c.z; } truck.o.rotation.y = turn0 + Math.sin(u * Math.PI) * .25; p.querySelector<HTMLElement>('.hp-bar i').style.width = (u * 100) + '%'; return u >= 1; }, p);
    p.remove();
    // tip: pull the lever down
    p = pad(`<p>${T('Pull the lever down to tip it out!', 'Kéo cần xuống để đổ đất đá!')}</p><div class="hp-slot" data-hp="lever"><b></b></div>`);
    say(...YARD_LINES.handTip);
    const lever = slot(p.querySelector('[data-hp=lever]'));
    heap.visible = true;
    await frames(() => { TU.bed.rotation.x = -lever.v * .9; heap.scale.setScalar(.05 + lever.v * .95); return lever.v > .9; }, p);
    TU.load.visible = false; heap.scale.setScalar(1); p.remove();
    await tween(1, k => { TU.bed.rotation.x = -(1 - k) * .9; });
  }
  async function digByHand(n = 4) {
    G.paused = false; // (the valley keeps running so the camera follows; the yard's buttons hide while this is open)
    const p = pad(`<p>${T('Drag down to dig, then up to lift!', 'Kéo xuống để đào, rồi kéo lên!')}</p><div class="hp-slot" data-hp="arm"><b></b></div><div class="hp-count">${'<i></i>'.repeat(n)}</div>`);
    say(...YARD_LINES.handDig);
    const arm = slot(p.querySelector('[data-hp=arm]')); let k = 0, low = false;
    await frames(() => { const v = arm.v; DU.boom.rotation.x = -.5 + v * .55; DU.arm.rotation.x = 1.3 + v * .4; DU.bucket.rotation.x = .4 - v * .9;
      if (v > .85) low = true;
      if (low && v < .15) { low = false; k++; pit.visible = true; pit.scale.set(1.2 * k / n, 1, .9 * k / n); const dots = p.querySelectorAll('.hp-count i'); if (dots[k - 1]) dots[k - 1].className = 'on'; }
      return k >= n; }, p);
    p.remove();
  }
  async function buildByHand(n = 9) {
    G.paused = false; // (the valley keeps running so the camera follows; the yard's buttons hide while this is open)
    walls.visible = true; walls.scale.y = .01; roof.visible = false;
    let p = pad(`<p>${T('Tap to lay the bricks!', 'Chạm để xây gạch!')}</p><button class="hp-big" data-hp="brick">${pic('🧱')}</button><div class="hp-bar"><i></i></div>`);
    say(...YARD_LINES.handBrick);
    await until(new Promise<void>(res => { let k = 0; p.querySelector<HTMLElement>('[data-hp=brick]').onclick = () => { k++; const a = walls.scale.y, b = k / n * 2.6; tween(.25, u => { walls.scale.y = a + (b - a) * u; }); p.querySelector<HTMLElement>('.hp-bar i').style.width = (k / n * 100) + '%'; if (k >= n) setTimeout(res, 300); }; }), p);
    p.remove();
    // the roof: drag it down onto the walls
    roof.visible = true; roof.position.y = 5.6;
    p = pad(`<p>${T('Drag the roof down onto the house!', 'Kéo mái nhà xuống lợp lên nhà!')}</p><div class="hp-slot" data-hp="roof"><b></b></div>`);
    say(...YARD_LINES.handRoof);
    const r = slot(p.querySelector('[data-hp=roof]'));
    await frames(() => { roof.position.y = 5.6 - r.v * 3; roof.rotation.y = (1 - r.v) * .6; return r.v > .92; }, p);
    roof.position.y = 2.6; roof.rotation.y = 0; p.remove();
  }
  btn('yard_truck', spots.truck, 3, '🚚', () => T('Drive the dump truck', 'Lái xe ben'), h => on() && (isOn(h.profile, 'y_truck') || done(h.profile, 'y_party')),
    h => run('truck', h, async () => {
      const story = isOn(h.profile, 'y_truck');
      if (hands()) { driver = h; try { await truckByHand(); } finally { driver = null; } }
      else { await haul(); await dialog(RELATIVES[0].name, [YARD_LINES.truckTip], [YARD_LINES.truckTip]); await tip(); }
      await dialog(RELATIVES[0].name, [YARD_LINES.truckDone]);
      await parkTruck();
      if (story) finish(h, 'y_truck'); else paint();
    }));
  // 5. the excavator: four scoops, the pit grows
  async function scoop(k, n) {
    await tween(.7, u => { DU.boom.rotation.x = -.5 + u * .55; DU.arm.rotation.x = 1.3 + u * .4; DU.bucket.rotation.x = .4 - u * .9; });
    pit.visible = true; const s = (k + 1) / n; pit.scale.set(1.2 * s, 1, .9 * s);
    await tween(.6, u => { DU.boom.rotation.x = .05 - u * .75; DU.bucket.rotation.x = -.5 + u * .2; });
    await tween(.6, u => { DU.turn.rotation.y = u * 1.2; });
    await tween(.4, u => { DU.bucket.rotation.x = -.3 + u * 1.2; });
    await tween(.8, u => { DU.turn.rotation.y = 1.2 * (1 - u); DU.boom.rotation.x = -.7 + u * .2; DU.arm.rotation.x = 1.7 - u * .4; DU.bucket.rotation.x = .9 - u * .5; });
  }
  btn('yard_dig', spots.digger, 3, '🏗️', () => T('Dig with the excavator', 'Đào bằng máy xúc'), h => on() && (isOn(h.profile, 'y_dig') || done(h.profile, 'y_party')),
    h => run('dig', h, async () => {
      const story = isOn(h.profile, 'y_dig'), n = 4;
      if (hands()) await digByHand(n);
      else for (let k = 0; k < n; k++) { await dialog(RELATIVES[2].name, [YARD_LINES.dig], [YARD_LINES.dig]); await scoop(k, n); }
      await dialog(RELATIVES[2].name, [YARD_LINES.digDone]);
      if (story) finish(h, 'y_dig'); else paint();
    }));
  // 6. build together: three rows of bricks, then the roof
  btn('yard_build', spots.site, 3, '🧱', () => T('Build the house', 'Xây nhà'), h => isOn(h.profile, 'y_build'),
    h => run('build', h, async () => {
      if (hands()) await buildByHand();
      else {
        walls.visible = true; walls.scale.y = .01; roof.visible = false;
        for (let k = 0; k < 3; k++) { await dialog(RELATIVES[1].name, [YARD_LINES.brick], [YARD_LINES.brick]); const a = walls.scale.y; await tween(.9, u => { walls.scale.y = a + ((k + 1) * 2.6 / 3 - a) * u; }); }
        await dialog('Anh 2', [YARD_LINES.roof], [YARD_LINES.roof]);
        roof.visible = true; await tween(1.4, u => { roof.position.y = 2.6 + (1 - u) * 3; roof.rotation.y = (1 - u) * .6; });
      }
      await dialog(RELATIVES[1].name, [YARD_LINES.buildDone]);
      finish(h, 'y_build');
    }));
  // 7. the house-warming meal
  btn('yard_party', () => ({ x: shop.x + 1.2, z: shop.z + 1.6 }), 2.4, '🍲', () => T('House-warming meal', 'Ăn mừng nhà mới'), h => isOn(h.profile, 'y_party'),
    h => run('party', h, async () => {
      await dialog('Bà Huệ', YARD_LINES.party);
      for (const { g } of guests) await dialog(g.name, [g.line]);
      finish(h, 'y_party');
      await reward('🏠', T('You helped the family build a home!', 'Con đã giúp cả nhà xây một ngôi nhà!'), T('The yard is open: drive the truck and dig any time.', 'Công trường luôn mở: con lái xe ben và đào đất lúc nào cũng được.'));
      if (G.addCoins) G.addCoins(30);
    }));

  paint();
  const asQuest = (p, s) => ({ id: 'Y_' + s.id, icon: s.icon, story: true, title: () => T(s.en, s.vi), tale: s.tale || null, target: () => spots[s.at] && spots[s.at]() });
  return {
    quest: p => { const s = current(p); return s ? asQuest(p, s) : null; },
    // (owner 9 Oct: a side story in its own list) what the Adventures page shows: started? which step? done?
    side: { id: 'yard', icon: '🏗️', title: () => T('Grandma Huệ and Grandpa Nghi\'s yard', 'Công trường của bà Huệ và ông Nghi'),
      status: p => { const c = current(p); return { started: done(p, 'y_start'), done: done(p, 'y_party'), step: c ? T(c.en, c.vi) : T('Ask Bà Huệ at the Huệ Nghi shop', 'Hỏi bà Huệ ở tiệm Huệ Nghi') }; } },
    current, paint, at: { x: X, z: Z, room: spot.room }, W, busy: () => busy.size > 0,
    _finish: finish // (checks)
  };
}
