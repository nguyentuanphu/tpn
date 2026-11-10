// Pets: every child can adopt up to two pets and give them names. Pets follow their owner, sniff out
// hidden Leafies, can be patted, and if their owner runs out of energy in deep water the child calls
// their pet, kicks their legs, and the pet pulls them back to the shore.
import { THREE, sprite } from './gfx.js';
import { T, onLang } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { profiles, saveProfiles, farm, saveFarm } from './state.js';
import { WATER, heightAt, LEAFIES, HOME } from './world.js';
import { animalModel, PETS } from './farm.js';
import { animalCheer } from './animals.js';   // (v1.08e creatures) a happy jump plays the Blender model's cheer
import { fmt, spoken } from './money.js';
import { el, esc, dist2, wait } from './util.js';
import { modal, toast } from './ui.js';
import { pic } from './art.js';
// (PERF-001) the hats' drawings (js/kidplay.js) load when a pet first wears one, not with the game's start
let buildHat = null;

export const MAX_PETS = 2;
// little pets were easy to lose in the grass: they are shown a bit bigger (the smallest the most)
// (owner, 10 Nov 2026 AEDT, the Meshy puppy: "2 con puppies to quá, phải scale xuống cho hợp lý hơn") the puppy 0.85 (was 1.3); then "Xuống thử 0.6": 0.6
const PET_SCALE = { puppy: .6, kitty: 1.45, bunny: 1.55, panda: 1.35, joey: 1.4, calf: 1.25 };
// the name tag just over the pet (a smaller pet's tag lower, never higher than before)
const tagY = (kind: string) => Math.min(1.45, .4 + (PET_SCALE[kind] || 1.3) * .8);
// (issue #738) a pet wears a hat from the child's hats (bought with the coin goal, chosen in the Backpack's "Pets & Buddy"):
// it sits on top of the head, at the front of the model, sized to the pet
const _box = new THREE.Box3();
// (owner, 10 Nov 2026: "mũ phải nudge fit") each hat fitted to the model's own head: its band (radius at scale 1,
// js/kidplay.ts buildHat) round the skull where the hat comes down to (a share of the head's height below its top:
// a beanie pulled well down, a captain's hat a little, crowns and rings sitting on top), a snug 4 % wider
export const HAT_FIT: Record<string, { band: number, down: number }> = { party: { band: .065, down: .08 }, flower: { band: .08, down: .1 },
  nonla: { band: .09, down: .1 }, crown: { band: .08, down: .1 }, beanie: { band: .085, down: .3 }, captain: { band: .08, down: .2 },
  wizard: { band: .075, down: .12 }, lotus: { band: .075, down: .1 } };
// the head as the model is shaped, in the head bone's own frame: its points that are wholly the head's (not the ears)
const _heads = new WeakMap();
function headPoints(model, head) {
  if (_heads.has(model)) return _heads.get(model);
  let body = null; model.traverse(o => { if (o.isSkinnedMesh && (!body || o.geometry.attributes.position.count > body.geometry.attributes.position.count)) body = o; });
  if (!body) return null;
  const hi = body.skeleton.bones.indexOf(head); if (hi < 0) return null;
  model.updateMatrixWorld(true); body.skeleton.update();
  const pos = body.geometry.attributes.position, si = body.geometry.attributes.skinIndex, sw = body.geometry.attributes.skinWeight, v = new THREE.Vector3(), pts = [];
  for (let i = 0; i < pos.count; i++) for (let q = 0; q < 4; q++) if (si.getComponent(i, q) === hi && sw.getComponent(i, q) > .8) {
    v.fromBufferAttribute(pos, i); body.applyBoneTransform(i, v); v.applyMatrix4(body.matrixWorld); pts.push(head.worldToLocal(v.clone())); break; }
  if (pts.length < 30) return null;
  let top = -1e9, bot = 1e9; for (const p of pts) { top = Math.max(top, p.y); bot = Math.min(bot, p.y); }
  const r = { pts, top, h: top - bot }; _heads.set(model, r); return r;
}
// where a hat goes and how big, in the head bone's frame: the skull's middle and width at the hat's depth
export function hatFit(model, head, id) {
  const P = headPoints(model, head), F = HAT_FIT[id] || HAT_FIT.crown; if (!P) return null;
  const y = P.top - P.h * F.down, slab = P.pts.filter(p => Math.abs(p.y - y) < P.h * .04);
  if (slab.length < 6) return null;
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of slab) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
  const half = Math.min(x1 - x0, z1 - z0) / 2;   // (the narrower way across: the band touches the skull, not the air beside it)
  return { at: new THREE.Vector3((x0 + x1) / 2, y, (z0 + z1) / 2), scale: half * 1.04 / F.band };
}
export function putHat(obj, id) {
  if (id && !buildHat) { import('./kidplay.js').then(m => { buildHat = m.buildHat; if (obj.userData.wantHat === id) putHat(obj, id); }); obj.userData.wantHat = id; return null; }
  obj.userData.wantHat = id; obj.userData.onModel = () => putHat(obj, obj.userData.wantHat);   // (put on again when its model arrives or changes: js/creatures.ts)
  if (obj.userData.hat) { const o = obj.userData.hat; o.parent && o.parent.remove(o); obj.userData.hat = null; }
  if (!id) return null;
  // (Meshy pets, owner 10 Nov 2026: "accessories ... thử lên chưa") a model's hat sits on its head bone, on the top of the
  // head as the model is shaped, so it goes with every move (looking down, lying, rolling over), not left in the air
  const rig = obj.userData.rig, model = rig && rig.model && rig.model.obj, head = model && model.getObjectByName('head');
  if (head) { const fit = hatFit(model, head, id); if (fit) {
    const hat = buildHat(id); hat.position.copy(fit.at); hat.scale.setScalar(fit.scale);
    head.add(hat); obj.userData.hat = hat; return hat; } }
  const at = obj.position.clone(), rot = obj.rotation.y; obj.position.set(0, 0, 0); obj.rotation.y = 0; obj.updateMatrixWorld(true);
  _box.setFromObject(obj); obj.position.copy(at); obj.rotation.y = rot;
  const s = obj.scale.x || 1, top = _box.max.y / s, front = _box.max.z / s, size = Math.max(.4, _box.max.y - _box.min.y);
  const hat = buildHat(id); hat.position.set(0, top - .04, front * .55); hat.scale.setScalar(size * 1.9 / s);
  obj.add(hat); obj.userData.hat = hat; return hat;
}
// (owner, 10 Nov 2026 AEDT: "Mỗi con sẽ có một skills đặc biệt riêng") each pet's own skills; the puppy: fetch the ball,
// dig for treasure, lead the way. The others get theirs as they are remade with Meshy (docs/meshy-pets-20261110/PLAN.md).
export const PET_SKILLS: Record<string, string[]> = { puppy: ['fetch', 'dig', 'lead'] };
const hasSkill = (pt, s: string) => (PET_SKILLS[pt.kind] || []).includes(s);
const DIGS_A_DAY = 5;
const NAME_IDEAS = ['Lucky', 'Mochi', 'Bông', 'Milo', 'Xoài', 'Coco', 'Bơ', 'Pepper', 'Mít', 'Biscuit', 'Kiwi', 'Tofu'];
export const petName = pt => pt.name || PETS[pt.kind].name();

// a name tag that follows the language when the pet has no name yet
function tag(textFn) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const draw = () => { const s = textFn(); x.clearRect(0, 0, 256, 64); x.font = 'bold 32px Fredoka, "Baloo 2", sans-serif'; const w = Math.min(250, x.measureText(s).width + 30); x.fillStyle = 'rgba(255,255,255,.92)'; x.beginPath(); x.roundRect((256 - w) / 2, 8, w, 46, 23); x.fill(); x.strokeStyle = '#ff9fc8'; x.lineWidth = 4; x.stroke(); x.fillStyle = '#5a2a4a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, 128, 32, 236); t.needsUpdate = true; };
  draw(); onLang(draw);
  const s: THREE.Sprite & { redraw?: () => void } = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(2.2, .55, 1); s.redraw = draw; return s;
}

export function createPets(G) {
  const { scene, world } = G;
  // move older saves (one shared list of pets) onto the children: each child starts with a puppy
  // pets that are not following a child live in the pet yard on the farm (farm.petYard), so none are ever lost
  if (!Array.isArray(farm.petYard)) farm.petYard = [];
  profiles.forEach((p, i) => {
    if (Array.isArray(p.pets)) return;
    const old = (i === 0 && Array.isArray(farm.pets) ? farm.pets : ['puppy']).filter(k => PETS[k]);
    const kinds = old.slice(0, MAX_PETS);
    p.pets = (kinds.length ? kinds : ['puppy']).map(kind => ({ kind, name: '' }));
    // older saves could have bought more than two: the rest go to the yard instead of disappearing
    if (i === 0) old.slice(MAX_PETS).forEach(kind => farm.petYard.push({ kind, name: '' }));
  });
  saveProfiles(); saveFarm();

  let live = []; // { h, pt, obj, tag, sniff, j }
  const P: Record<string, any> = {};
  P.sync = () => {
    live.forEach(L => { scene.remove(L.obj); scene.remove(L.tag); scene.remove(L.sniff); });
    live = [];
    G.heroes.forEach(h => {
      if (!Array.isArray(h.profile.pets)) h.profile.pets = [{ kind: 'puppy', name: '' }];
      h.profile.pets.slice(0, MAX_PETS).forEach((pt, j) => {
        const obj = animalModel(pt.kind); obj.scale.multiplyScalar(PET_SCALE[pt.kind] || 1.3); if (pt.hat) putHat(obj, pt.hat); obj.position.set(h.pos.x - 1.5 + j * 3, h.pos.y, h.pos.z - 1.5); scene.add(obj);
        const tg = tag(() => petName(pt)); scene.add(tg);
        const sn = sprite('👃', .9); sn.visible = false; scene.add(sn);
        const L = { h, pt, obj, tag: tg, sniff: sn, j, barkT: 3 + j * 2, hop: 0 }; live.push(L);
        obj.userData.react = () => { const d = PETS[pt.kind]; SFX[d.snd] && SFX[d.snd](); L.hop = .8; G.fx(obj.position.x, obj.position.y + 1, obj.position.z, '💕'); };
      });
    });
  };
  P.forHero = h => live.filter(L => L.h === h);
  P.live = () => live;   // (the checks: tests/pet-skills.mts)
  P.nameOf = petName; P.max = MAX_PETS;

  // ---------- the pet yard on the farm ----------
  const yardC = G.farm && G.farm.spots && G.farm.spots.hutch ? { x: G.farm.spots.hutch.x + 5, z: G.farm.spots.hutch.z + 4 } : { x: HOME.x - 14, z: HOME.z - 10 };
  let yard = []; // { pt, obj, tag, tx, tz, hop }
  {
    // a little picket fence and a sign
    const parts = [];
    for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; if (k === 5) continue; const m = new THREE.Mesh(new THREE.BoxGeometry(.14, .8, .14), new THREE.MeshToonMaterial({ color: '#ffffff' })); m.position.set(yardC.x + Math.cos(a) * 4.2, heightAt(yardC.x + Math.cos(a) * 4.2, yardC.z + Math.sin(a) * 4.2) + .4, yardC.z + Math.sin(a) * 4.2); scene.add(m); parts.push(m); }
    const sg = sprite('🐾', 1.3); sg.position.set(yardC.x, heightAt(yardC.x, yardC.z) + 2.6, yardC.z); scene.add(sg);
  }
  P.syncYard = () => {
    yard.forEach(Y => { scene.remove(Y.obj); scene.remove(Y.tag); }); yard = [];
    farm.petYard.forEach((pt, k) => {
      const obj = animalModel(pt.kind), a = k * 2.2; obj.scale.multiplyScalar(PET_SCALE[pt.kind] || 1.3); obj.position.set(yardC.x + Math.cos(a) * 2, heightAt(yardC.x, yardC.z), yardC.z + Math.sin(a) * 2); scene.add(obj);
      const tg = tag(() => petName(pt)); scene.add(tg);
      const Y = { pt, obj, tag: tg, tx: obj.position.x, tz: obj.position.z, hop: 0 }; yard.push(Y);
      obj.userData.react = () => { const d = PETS[pt.kind]; SFX[d.snd] && SFX[d.snd](); Y.hop = .8; G.fx(obj.position.x, obj.position.y + 1, obj.position.z, '💕'); };
    });
  };
  P.yardMeshes = () => yard.map(Y => Y.obj);
  world.updaters.push((dt, t) => yard.forEach(Y => {
    const o = Y.obj, dx = Y.tx - o.position.x, dz = Y.tz - o.position.z, d = Math.hypot(dx, dz);
    if (d < .2) { if (Math.random() < dt * .4) { const a = Math.random() * 6.28, r = Math.random() * 3.2; Y.tx = yardC.x + Math.cos(a) * r; Y.tz = yardC.z + Math.sin(a) * r; } }
    else { o.rotation.y = Math.atan2(dx, dz); o.position.x += dx / d * dt * 1.2; o.position.z += dz / d * dt * 1.2; }
    o.position.y = heightAt(o.position.x, o.position.z) + (Y.hop > 0 ? Math.abs(Math.sin(Y.hop * 9)) * .5 : d > .2 ? Math.abs(Math.sin(t * 10)) * .08 : 0); if (Y.hop > 0) animalCheer(o, .3); Y.hop = Math.max(0, Y.hop - dt);
    Y.tag.position.set(o.position.x, o.position.y + Math.min(1.4, tagY(Y.pt.kind)), o.position.z);
  }));
  G.interactables.push({ id: 'petyard', x: yardC.x, z: yardC.z, r: 5, icon: '🐾', bubble: '🐾', label: () => T('Pet yard: play with your pets', 'Sân thú cưng: chơi với thú cưng'), act: h => P.openAdopt(h) });


  // pat a pet: tap it (the bubble button), or press the action button next to it
  const patIts = [];
  P.refreshInteractables = () => {
    patIts.forEach(it => { const k = G.interactables.indexOf(it); if (k >= 0) G.interactables.splice(k, 1); }); patIts.length = 0;
    live.forEach((L, k) => {
      const it = { id: 'pat' + k, get x() { return L.obj.position.x; }, get z() { return L.obj.position.z; }, r: 1.8, icon: '💕',
        visible: h => h === L.h && !h.carry, label: () => T('Pat ', 'Vuốt ve ') + petName(L.pt),
        act: h => { const d = PETS[L.pt.kind]; SFX[d.snd] && SFX[d.snd](); L.hop = .8; G.fx(L.obj.position.x, L.obj.position.y + 1, L.obj.position.z, '💕'); G.job && G.job('pet');
          L.pats = (L.pats || 0) + 1; wish(L, ['roll', 'beg', 'bounce'][(L.pats - 1) % 3], 3);   // (a model with these moves: rolls over for a tummy rub, begs, bounces)
          if (!L.pt.name) { setTimeout(() => P.openName(L.h, L.pt), 400); } else say(`${petName(L.pt)} loves you!`, `${petName(L.pt)} thương con lắm!`); } };
      patIts.push(it); G.interactables.push(it);
      // the pet's own skills: throwing the ball (fetch), being led the way (lead)
      if (hasSkill(L.pt, 'fetch')) { const f = { id: 'fetch' + k, get x() { return L.obj.position.x; }, get z() { return L.obj.position.z; }, r: 2.6, icon: '⚽',
        visible: h => h === L.h && !h.carry && !L.task, label: () => T('Throw the ball for ', 'Ném bóng cho ') + petName(L.pt), act: h => throwBall(L) };
        patIts.push(f); G.interactables.push(f); }
      if (hasSkill(L.pt, 'lead')) { const f = { id: 'lead' + k, get x() { return L.obj.position.x; }, get z() { return L.obj.position.z; }, r: 2.6, icon: '🧭',
        visible: h => { if (h !== L.h || h.carry || L.task) return false; const tg = leadTarget(h); return !!tg && dist2(h.pos.x, h.pos.z, tg.x, tg.z) > 14; },
        label: () => T(`${petName(L.pt)}, lead the way!`, `${petName(L.pt)} ơi, dẫn đường nào!`),
        act: h => { const tg = leadTarget(h); if (!tg) return; L.task = { kind: 'lead', bark: 0 }; const d = PETS[L.pt.kind]; SFX[d.snd] && SFX[d.snd]();
          say(`${petName(L.pt)} knows the way! Follow ${petName(L.pt)}.`, `${petName(L.pt)} biết đường! Đi theo ${petName(L.pt)} nhé.`); } };
        patIts.push(f); G.interactables.push(f); }
    });
  };
  // the skills' buttons: a row of chips under the child's name card (as the companion's Feed chip, js/kidplay.ts), shown
  // while the pet is near: the action button near a pet is "Pat", so the skills need buttons of their own
  const skillChips = new Map();
  function chipRow(h) {
    const hud = G.huds && G.huds[h.i]; if (!hud || !hud.root) return null;
    let c = skillChips.get(hud); if (c && c.row.isConnected) return c;
    const tl = hud.root.querySelector('.hud-tl'); if (!tl) return null;
    const row = document.createElement('div'); row.className = 'kidrow petrow'; tl.appendChild(row);
    const mk = (cls, art, en, vi, go) => { const b = document.createElement('button'); b.className = 'chip ' + cls; b.hidden = true;
      b.innerHTML = pic(art) + `<small data-l="${en}|${vi}">${T(en, vi)}</small>`; b.setAttribute('aria-label', T(en, vi));
      b.onclick = e => { e.stopPropagation(); const L = live.find(x => x.h === h && hasSkill(x.pt, cls.slice(2)) && !x.task); if (L) go(L); }; row.appendChild(b); return b; };
    c = { row, fetch: mk('c-fetch', '⚽', 'Throw ball', 'Ném bóng', L => throwBall(L)),
      lead: mk('c-lead', '🧭', 'Lead the way', 'Dẫn đường', L => { const it = G.interactables.find(x => x.id === 'lead' + live.indexOf(L)); it && it.act(h); }) };
    skillChips.set(hud, c); return c;
  }
  setInterval(() => { for (const h of G.heroes) { const c = chipRow(h); if (!c) continue;
    // (a phone: the top row has no room beside the mini-map, so the chips stand at the right edge above the View button, pictures only)
    const hud = G.huds[h.i], narrow = hud.root.classList.contains('small'), tl = hud.root.querySelector('.hud-tl');
    if (narrow && c.row.parentElement !== hud.root) hud.root.appendChild(c.row); else if (!narrow && tl && c.row.parentElement !== tl) tl.appendChild(c.row);
    const mine = live.filter(L => L.h === h && !L.task && dist2(h.pos.x, h.pos.z, L.obj.position.x, L.obj.position.z) < 8);
    c.fetch.hidden = !mine.some(L => hasSkill(L.pt, 'fetch')) || !!h.carry;
    const tg = leadTarget(h); c.lead.hidden = !mine.some(L => hasSkill(L.pt, 'lead')) || !tg || dist2(h.pos.x, h.pos.z, tg.x, tg.z) <= 14;
    c.row.querySelectorAll('small[data-l]').forEach((el: any) => { const [en, vi] = el.dataset.l.split('|'); el.textContent = T(en, vi); }); } }, 400);
  // ---------- the pet's own skills (owner, 10 Nov 2026) ----------
  const wish = (L, move: string, secs: number) => { L.want = move; L.wantT = secs; };
  const leadTarget = h => h.walkTo || (G.questTarget ? G.questTarget(h) : null);
  const mouthOf = L => {   // (where a carried thing sits: the model's mouth, on its head bone; the code shape's head)
    const rig = L.obj.userData.rig, m = rig && rig.model;
    if (m) { const head = m.obj.getObjectByName('head'), jaw = m.obj.getObjectByName('jaw');
      if (head && jaw) { L.obj.updateMatrixWorld(true); const at = head.worldToLocal(jaw.getWorldPosition(new THREE.Vector3())); return { bone: head, at }; } }
    return rig && rig.head ? { bone: rig.head, at: new THREE.Vector3(0, -.02, .2) } : null;
  };
  const ballMesh = () => { const b = new THREE.Mesh(new THREE.SphereGeometry(.1, 14, 10), new THREE.MeshToonMaterial({ color: '#ff5a5f' }));
    const band = new THREE.Mesh(new THREE.TorusGeometry(.1, .018, 6, 16), new THREE.MeshToonMaterial({ color: '#ffd23f' })); band.rotation.x = Math.PI / 2; b.add(band); b.castShadow = true; return b; };
  function throwBall(L) {
    const h = L.h; if (L.task) return;
    const ball = L.ball || (L.ball = ballMesh()); if (ball.parent) ball.parent.remove(ball); scene.add(ball); ball.scale.setScalar(1);
    const solid = (x, z) => !!(world.solidAt && world.solidAt(x, z, h.pos.y + .3));
    let dist = 7, tx = h.pos.x + Math.sin(h.yaw) * dist, tz = h.pos.z + Math.cos(h.yaw) * dist;
    while (dist > 1.5 && solid(tx, tz)) { dist -= .5; tx = h.pos.x + Math.sin(h.yaw) * dist; tz = h.pos.z + Math.cos(h.yaw) * dist; }   // (the ball lands before a wall, not in it)
    L.task = { kind: 'fetch', stage: 'fly', t: 0, from: { x: h.pos.x, y: h.pos.y + 1.1, z: h.pos.z }, to: { x: tx, y: world.groundAt(tx, tz, h.pos.y + 1) + .1, z: tz } };
    SFX.tap && SFX.tap(); const d = PETS[L.pt.kind]; setTimeout(() => SFX[d.snd] && SFX[d.snd](), 250);
  }
  function dropBall(L) { const b = L.ball; if (!b) return; const o = L.obj; b.parent && b.parent.remove(b); scene.add(b);
    b.position.set(o.position.x + Math.sin(o.rotation.y) * .5, world.groundAt(o.position.x, o.position.z, o.position.y + 1) + .1, o.position.z + Math.cos(o.rotation.y) * .5);
    b.scale.setScalar(1); setTimeout(() => { if (!L.task && b.parent === scene) scene.remove(b); }, 6000); }
  // each frame, before the pet follows: a task can move it instead (returns true when it did)
  function skillStep(L, dt, t) {
    const h = L.h, o = L.obj, T_ = L.task; if (!T_) return false;
    // (owner, 10 Nov 2026: "kiểm tra cho hết") a skill's run never goes through a house or a wall: a step into the solid
    // map slides along it (one way, then the other), or waits
    const solid = (x, z) => !!(world.solidAt && world.solidAt(x, z, o.position.y + .3));
    const go = (x, z, speed) => { const dx = x - o.position.x, dz = z - o.position.z, d = Math.hypot(dx, dz);
      if (d > .08) { const sp = Math.min(d * 3.2, speed), k = Math.min(d, sp * dt) / d, nx = o.position.x + dx * k, nz = o.position.z + dz * k;
        if (!solid(nx, nz)) { o.position.x = nx; o.position.z = nz; }
        else if (!solid(nx, o.position.z)) o.position.x = nx; else if (!solid(o.position.x, nz)) o.position.z = nz;
        o.rotation.y = Math.atan2(dx, dz); }
      o.position.y = world.groundAt(o.position.x, o.position.z, h.pos.y + 1); return d; };
    // a point to run to that is not inside anything: turned a little either way from the wanted line, or nearer
    const free = (fx, fz, ux, uz, dist) => { for (const dd of [dist, dist * .7, dist * .45]) for (const a of [0, .45, -.45, .9, -.9, 1.3, -1.3]) {
        const c = Math.cos(a), sn = Math.sin(a), vx = ux * c - uz * sn, vz = ux * sn + uz * c, x = fx + vx * dd, z = fz + vz * dd; if (!solid(x, z)) return [x, z]; }
      return [fx, fz]; };
    if (T_.kind === 'fetch') {
      const b = L.ball;
      if (T_.stage === 'fly') { T_.t += dt / .8; const k = Math.min(1, T_.t);
        b.position.set(T_.from.x + (T_.to.x - T_.from.x) * k, T_.from.y + (T_.to.y - T_.from.y) * k + Math.sin(k * Math.PI) * 2.2, T_.from.z + (T_.to.z - T_.from.z) * k);
        if (k >= 1) T_.stage = 'go'; go(T_.to.x, T_.to.z, 10); return true; }
      if (T_.stage === 'go') { if (go(T_.to.x, T_.to.z, 11) < .45) { const mo = mouthOf(L); scene.remove(b);
          if (mo) { mo.bone.add(b); b.position.copy(mo.at); b.scale.setScalar(1 / Math.max(.01, mo.bone.getWorldScale(new THREE.Vector3()).x) * .8); }
          T_.stage = 'back'; } return true; }
      if (T_.stage === 'back') { const fx = h.pos.x + Math.sin(h.yaw) * 1.1, fz = h.pos.z + Math.cos(h.yaw) * 1.1; L.want = 'carry'; L.wantT = .2;
        if (go(fx, fz, 9) < .7) { dropBall(L); L.task = null; L.hop = .8; wish(L, 'bounce', 1.6); const d = PETS[L.pt.kind]; SFX[d.snd] && SFX[d.snd]();
          L.fetches = (L.fetches || 0) + 1; if (L.fetches === 1 || L.fetches % 4 === 0) say(`${petName(L.pt)} brought the ball back! Throw it again?`, `${petName(L.pt)} mang bóng về rồi! Ném nữa không con?`); }
        return true; }
    }
    if (T_.kind === 'lead') {
      const tg = leadTarget(h); if (!tg) { L.task = null; return false; }
      const dc = dist2(h.pos.x, h.pos.z, tg.x, tg.z);
      if (dc < 8) { L.task = null; L.hop = .8; wish(L, 'bounce', 1.6); const d = PETS[L.pt.kind]; SFX[d.snd] && SFX[d.snd](); say('Here we are!', 'Tới nơi rồi!'); return false; }
      const ux = (tg.x - h.pos.x) / dc, uz = (tg.z - h.pos.z) / dc, ahead = Math.min(5.5, dc - 2);
      const [wx, wz] = free(h.pos.x, h.pos.z, ux, uz, ahead), d = go(wx, wz, 9), far = dist2(h.pos.x, h.pos.z, o.position.x, o.position.z);
      if (d < .5) { o.rotation.y = Math.atan2(h.pos.x - o.position.x, h.pos.z - o.position.z);   // (waiting: it looks back at the child)
        if (far > 7) { wish(L, 'sit', .3); T_.bark -= dt; if (T_.bark <= 0) { T_.bark = 3.5; const dd = PETS[L.pt.kind]; SFX[dd.snd] && SFX[dd.snd](); } } }
      return true;
    }
    if (T_.kind === 'dig') {
      T_.t += dt; wish(L, T_.t < 1.2 ? 'idle' : 'dig', .2); L.sniff.visible = T_.t < 1.2; L.sniff.position.set(o.position.x, o.position.y + 1.4, o.position.z);
      if (T_.t > 1.2 && (T_.fx = (T_.fx || 0) - dt) <= 0) { T_.fx = .35; G.fx(o.position.x + Math.sin(o.rotation.y) * .4, o.position.y + .2, o.position.z + Math.cos(o.rotation.y) * .4, '🌰'); }
      if (T_.t > 3.8) { L.task = null; const coins = 2; G.addCoins && G.addCoins(coins); G.fx(o.position.x, o.position.y + 1, o.position.z, '🌟'); L.hop = .8; wish(L, 'bounce', 1.4);
        const day = new Date().toDateString(); if (L.pt.digDay !== day) { L.pt.digDay = day; L.pt.digs = 0; } L.pt.digs++; saveProfiles();
        G.toast(h, '🪏 ' + T(`${petName(L.pt)} dug up ${coins} coins!`, `${petName(L.pt)} đào được ${coins} xu!`)); const d = PETS[L.pt.kind]; SFX[d.snd] && SFX[d.snd](); }
      return true;
    }
    return false;
  }
  // digging for treasure: now and then, while the child stands still near it on dry land (a few times a day)
  function maybeDig(L, dt, swim) {
    const h = L.h; if (L.task || swim || !hasSkill(L.pt, 'dig')) return;
    const day = new Date().toDateString(); if (L.pt.digDay === day && (L.pt.digs || 0) >= DIGS_A_DAY) return;
    const moved = L.lastX == null || Math.hypot(h.pos.x - L.lastX, h.pos.z - L.lastZ) > .01; L.lastX = h.pos.x; L.lastZ = h.pos.z;
    L.stillT = moved ? 0 : (L.stillT || 0) + dt; L.digT = (L.digT == null ? 40 + Math.random() * 40 : L.digT) - dt;
    if (L.digT <= 0 && L.stillT > 2.5 && dist2(h.pos.x, h.pos.z, L.obj.position.x, L.obj.position.z) < 4) { L.digT = 60 + Math.random() * 60; L.task = { kind: 'dig', t: 0 }; }
  }
  P.react = obj => { const L = live.find(L => L.obj === obj || L.obj.getObjectById(obj.id)); if (!L) return false; const d = PETS[L.pt.kind]; SFX[d.snd] && SFX[d.snd](); L.hop = .8; G.fx(L.obj.position.x, L.obj.position.y + 1, L.obj.position.z, '💕'); return true; };
  P.meshes = () => live.map(L => L.obj);

  // ---------- following, swimming and sniffing ----------
  const _v = new THREE.Vector3();
  world.updaters.push((dt, t) => {
    live.forEach(L => {
      const h = L.h, o = L.obj;
      if (L.rescue) return; // the rescue moves this pet
      const rig = o.userData.rig;
      L.wantT = Math.max(0, (L.wantT || 0) - dt);
      if (h.vy > 2 && !h.onGround && !L.task && dist2(h.pos.x, h.pos.z, o.position.x, o.position.z) < 5) wish(L, 'jump', 1.1);   // (it jumps when the child jumps)
      if (skillStep(L, dt, t)) { if (rig) rig.want = L.wantT > 0 ? L.want : null; L.tag.position.set(o.position.x, o.position.y + tagY(L.pt.kind), o.position.z); return; }
      const back = 1.7, side = L.j ? 1 : -1;
      const tx = h.pos.x - Math.sin(h.yaw) * back + Math.cos(h.yaw) * side * .9, tz = h.pos.z - Math.cos(h.yaw) * back - Math.sin(h.yaw) * side * .9;
      const dx = tx - o.position.x, dz = tz - o.position.z, d = Math.hypot(dx, dz);
      if (d > 40) o.position.set(tx, h.pos.y, tz);
      else if (d > .4) { const sp = Math.min(d * 2.6, 13); o.position.x += dx / d * sp * dt; o.position.z += dz / d * sp * dt; o.rotation.y = Math.atan2(dx, dz); }
      const g = world.groundAt(o.position.x, o.position.z, h.pos.y + 1), swim = g < WATER - .5;
      o.position.y = (swim ? WATER - .35 : g) + (d > .4 && !swim ? Math.abs(Math.sin(t * 12 + L.j)) * .12 : 0) + (L.hop > 0 ? Math.abs(Math.sin(L.hop * 9)) * .5 : 0);
      if (L.hop > 0) animalCheer(o, .3);
      L.hop = Math.max(0, L.hop - dt);
      o.children[1] && (o.children[1].visible = !swim);
      maybeDig(L, dt, swim);
      if (rig) rig.want = swim ? 'swim' : L.wantT > 0 ? L.want : null;   // (js/creatures.ts plays it when the model has that move)
      L.tag.position.set(o.position.x, o.position.y + tagY(L.pt.kind), o.position.z);
      L.tag.visible = dist2(h.pos.x, h.pos.z, o.position.x, o.position.z) < 18;
      // a hidden Leafy nearby: the pet sniffs and barks to help
      const near = LEAFIES.some(lf => !h.profile.leafies[lf.id] && dist2(lf.x, lf.z, o.position.x, o.position.z) < 12);
      L.sniff.visible = near; if (near) { L.sniff.position.set(o.position.x, o.position.y + 2.1 + Math.sin(t * 5) * .1, o.position.z); L.barkT -= dt; if (L.barkT <= 0) { L.barkT = 7; const d2 = PETS[L.pt.kind]; SFX[d2.snd] && SFX[d2.snd](); L.hop = .5; if (!L.toldSniff) { L.toldSniff = true; G.toast(h, '👃 ' + T(`${petName(L.pt)} smells something! Look around for a hidden Leafy.`, `${petName(L.pt)} ngửi thấy gì đó! Tìm quanh đây xem có bạn Lá Lá nào trốn không.`)); } } }
    });
  });

  // ---------- naming ----------
  P.openName = (h, pt, after) => {
    G.paused = true;
    const m = modal('petname', ''), card = m.querySelector('.card');
    const close = () => { m.close(); G.paused = false; after && after(); };
    card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>${PETS[pt.kind].icon} ${T('Name your pet', 'Đặt tên cho thú cưng')}</h2>
      <p class="sub">${T('Type a name, or tap one of these:', 'Gõ một cái tên, hoặc chạm vào một tên dưới đây:')}</p>
      <div class="vrow"><input type="text" id="pnIn" maxlength="14" value="${esc(pt.name || '')}" placeholder="${esc(PETS[pt.kind].name())}" autocomplete="off"></div>
      <div class="nameideas">${NAME_IDEAS.map(n => `<button class="btn" data-n="${esc(n)}">${esc(n)}</button>`).join('')}</div>
      <button class="btn primary wide big" id="pnOk">✅ ${T('That’s the name!', 'Tên này nhé!')}</button>`;
    const input = card.querySelector('#pnIn');
    card.querySelector('.x').onclick = close;
    card.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { input.value = b.dataset.n; SFX.tap(); say(b.dataset.n, b.dataset.n); });
    card.querySelector('#pnOk').onclick = () => {
      const v = input.value.trim().slice(0, 14); pt.name = v; saveProfiles(); SFX.chime();
      live.forEach(L => L.tag.redraw()); const d = PETS[pt.kind]; SFX[d.snd] && setTimeout(() => SFX[d.snd](), 300);
      say(`Hello ${petName(pt)}! What a lovely name.`, `Chào ${petName(pt)}! Tên đẹp quá.`); close();
    };
    say('What will you call your pet?', 'Con muốn đặt tên thú cưng là gì?');
  };

  // ---------- adopting (at Mr. Bear's shop, and from the Backpack) ----------
  P.openAdopt = (h, after) => {
    G.paused = true;
    const m = modal('adopt', ''), card = m.querySelector('.card');
    const close = () => { m.close(); G.paused = false; after && after(); };
    const draw = () => {
      const mine = h.profile.pets;
      card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>🐾 ${T(`${h.profile.name}'s pets`, `Thú cưng của ${h.profile.name}`)}</h2>
        <p class="sub">${T(`Up to ${MAX_PETS} pets each. They follow you, find hidden Leafies, and save you if you get tired in the water!`, `Mỗi bạn được nuôi tối đa ${MAX_PETS} con. Chúng đi theo con, tìm bạn Lá Lá đang trốn, và cứu con khi con mệt dưới nước!`)}</p>
        <div class="mypets">${mine.map((pt, k) => `<div class="mypet"><span class="pi">${PETS[pt.kind].icon}</span><b>${esc(petName(pt))}</b><button class="btn" data-ren="${k}">✏️ ${T('Name', 'Đặt tên')}</button><button class="btn" data-bye="${k}" aria-label="${T('Let go', 'Cho đi')}">🏡</button></div>`).join('')}</div>
        ${farm.petYard.length ? `<h3>🐾 ${T('Living in the pet yard on the farm', 'Đang sống ở sân thú cưng trong nông trại')}</h3><div class="mypets">${farm.petYard.map((pt, k) => `<div class="mypet"><span class="pi">${PETS[pt.kind].icon}</span><b>${esc(petName(pt))}</b><button class="btn primary" data-take="${k}">🐾 ${T('Come with me', 'Đi với con')}</button></div>`).join('')}</div>` : ''}
        <h3>${T('Adopt a pet', 'Nhận nuôi thú cưng')}</h3>
        <div class="bigpick">${Object.entries(PETS).map(([k, d]) => `<button data-ad="${k}" class="${mine.length >= MAX_PETS ? 'owned' : farm.coins < d.price ? 'poor' : ''}"><span>${d.icon}</span><small>${d.price ? fmt(d.price) : T('Free', 'Miễn phí')}</small></button>`).join('')}</div>
        ${mine.length >= MAX_PETS ? `<p class="note">${T('You already have two pets. Tap 🏡 to send one to live on the farm if you want a different one.', 'Con đã có hai thú cưng rồi. Chạm 🏡 để gửi một bạn về sống ở nông trại nếu con muốn nuôi bạn khác.')}</p>` : ''}`;
      card.querySelector('.x').onclick = close;
      card.querySelectorAll('[data-ren]').forEach(b => b.onclick = () => { m.close(); G.paused = false; P.openName(h, mine[+b.dataset.ren], () => P.openAdopt(h, after)); });
      card.querySelectorAll('[data-bye]').forEach(b => b.onclick = () => {
        const pt = mine[+b.dataset.bye]; if (!confirm(T(`Send ${petName(pt)} to play in the pet yard on the farm? You can bring them back any time.`, `Gửi ${petName(pt)} về chơi ở sân thú cưng trong nông trại nhé? Con đón về lúc nào cũng được.`))) return;
        // (its hat stays with the child: #738)
        mine.splice(+b.dataset.bye, 1); delete pt.hat; farm.petYard.push(pt); saveProfiles(); saveFarm(); P.sync(); P.syncYard(); P.refreshInteractables(); SFX.tap(); draw();
      });
      card.querySelectorAll('[data-take]').forEach(b => b.onclick = () => {
        if (mine.length >= MAX_PETS) { SFX.no(); say('You already have two pets with you. Tap 🏡 to swap one.', 'Con đã có hai thú cưng đi cùng rồi. Chạm 🏡 để đổi nhé.'); return; }
        const pt = farm.petYard.splice(+b.dataset.take, 1)[0]; mine.push(pt); saveProfiles(); saveFarm();
        P.sync(); P.syncYard(); P.refreshInteractables(); const d = PETS[pt.kind]; SFX[d.snd] && SFX[d.snd](); say(`${petName(pt)} is coming with you!`, `${petName(pt)} đi cùng con nè!`); draw();
      });
      card.querySelectorAll('[data-ad]').forEach(b => b.onclick = () => {
        const k = b.dataset.ad, d = PETS[k];
        if (mine.length >= MAX_PETS) { SFX.no(); say('You already have two pets!', 'Con đã có hai thú cưng rồi!'); return; }
        if (farm.coins < d.price) { SFX.no(); say(`That costs ${spoken(d.price)}. Sell some things first!`, `Bạn này giá ${spoken(d.price)}. Bán bớt đồ trước nhé!`); return; }
        farm.coins -= d.price; saveFarm(); SFX.coin(); const pt = { kind: k, name: '' }; mine.push(pt); saveProfiles();
        P.sync(); P.refreshInteractables(); SFX[d.snd] && SFX[d.snd]();
        m.close(); G.paused = false; P.openName(h, pt, () => P.openAdopt(h, after));
      });
    };
    draw();
  };

  // ---------- the water rescue ----------
  // Returns true when a pet is coming to help (otherwise Ông Cú does it, as before).
  P.rescue = h => {
    if (h.carry) return true;
    const L = live.find(L => L.h === h); if (!L) return false;
    const hud = G.huds[h.i], name = petName(L.pt), pet = PETS[L.pt.kind];
    const R: { stage: string, t: number, x: number, z: number, kicks: number, push?: number } = { stage: 'call', t: 0, x: h.pos.x, z: h.pos.z, kicks: 0 };
    // which way is dry land? the last safe spot on the shore
    const shore = { x: h.lastSafe.x, z: h.lastSafe.z };
    SFX.splash(); say(`Oh no, you are too tired to swim! Call ${name} to help you!`, `Ôi, con mệt quá không bơi nổi! Gọi ${name} đến giúp nào!`);
    const call = () => {
      if (R.stage !== 'call') return; R.stage = 'coming'; R.t = 0; L.rescue = true; SFX[pet.snd] && SFX[pet.snd]();
      say(`${name}! Help!`, `${name} ơi! Cứu với!`);
      hud.bigPrompt(`<span>${pet.icon}</span><b>${esc(T(`${name} is coming!`, `${name} đang đến!`))}</b>`, null);
    };
    const kick = () => { if (R.stage !== 'tow') return; R.kicks++; R.push = .35; SFX.splash(); };
    hud.bigPrompt(`<span>🆘</span><b>${esc(T(`Call ${name}!`, `Gọi ${name}!`))}</b>`, call);
    h.cancelCarry = () => { h.carry = null; L.rescue = false; R.stage = 'done'; hud.bigPrompt(null); };
    h.carry = (dt, t, pad) => {
      R.t += dt;
      if (pad && pad.act && pad.act()) { if (R.stage === 'call') call(); else kick(); }
      if (R.stage === 'call' && R.t > 9) call(); // little ones who don't press anything still get saved
      const o = L.obj, y = WATER - .55 + Math.sin(t * 3) * .08;
      if (R.stage === 'coming') {
        const dx = R.x - o.position.x, dz = R.z - o.position.z, d = Math.hypot(dx, dz);
        if (d > .9) { const sp = Math.min(11, d * 3 + 3); o.position.x += dx / d * sp * dt; o.position.z += dz / d * sp * dt; o.rotation.y = Math.atan2(dx, dz); }
        const g = world.groundAt(o.position.x, o.position.z); o.position.y = g < WATER - .5 ? WATER - .35 : g;
        o.children[1] && (o.children[1].visible = g >= WATER - .5);
        if (o.userData.rig) o.userData.rig.want = g < WATER - .5 ? 'swim' : 'run';   // (a model with these moves: it runs to the water and swims out)
        if (d <= .9 || R.t > 6) {
          R.stage = 'tow'; R.t = 0; SFX[pet.snd] && SFX[pet.snd]();
          say(`${name} is here! Hold on and kick your legs: tap, tap, tap!`, `${name} đến rồi! Bám chặt và đạp chân nào: chạm, chạm, chạm!`);
          hud.bigPrompt(`<span>🦵</span><b>${esc(T('Kick! Kick!', 'Đạp chân! Đạp!'))}</b>`, kick);
        }
      }
      if (R.stage === 'tow') {
        const dx = shore.x - R.x, dz = shore.z - R.z, d = Math.hypot(dx, dz) || 1;
        R.push = Math.max(0, (R.push || 0) - dt);
        const sp = 2 + (R.push > 0 ? 6 : 0); // always moving a little; kicking makes it fast
        R.x += dx / d * sp * dt; R.z += dz / d * sp * dt;
        const yaw = Math.atan2(dx, dz);
        o.position.set(R.x + Math.sin(yaw) * 1.1, WATER - .35, R.z + Math.cos(yaw) * 1.1); o.rotation.y = yaw; o.children[1] && (o.children[1].visible = false);
        if (o.userData.rig) o.userData.rig.want = 'swim';
        L.tag.position.set(o.position.x, o.position.y + tagY(L.pt.kind), o.position.z);
        if (world.groundAt(R.x, R.z) > WATER - .6 || d < 1.5) { finish(); return null; }
        return { x: R.x, y, z: R.z, yaw, state: 'swim', speed: 2 };
      }
      L.tag.position.set(o.position.x, o.position.y + tagY(L.pt.kind), o.position.z);
      return { x: R.x, y, z: R.z, state: 'swim', speed: 0 };
    };
    const finish = async () => {
      h.carry = null; h.cancelCarry = null; L.rescue = false; hud.bigPrompt(null);
      const g = world.groundAt(R.x, R.z); if (g < WATER - .2) h.place(shore.x, shore.z); else h.place(R.x, R.z);
      h.stamina = h.staminaMax; h.exhausted = false; h.cheerT = 2; L.hop = 1.2; SFX[pet.snd] && SFX[pet.snd](); SFX.fanfare();
      G.celebrate && G.celebrate(h);
      say(`You made it! ${name} saved you. Good ${L.pt.kind === 'puppy' ? 'dog' : 'friend'}, ${name}!`, `Con lên bờ rồi! ${name} đã cứu con. Giỏi lắm ${name}!`);
      const p = h.profile; p.quests = p.quests || {};
      if (!p.quests.petRescue) { p.quests.petRescue = true; saveProfiles(); await wait(1600); G.reward && G.reward('🦸', T(`${name} is a hero!`, `${name} là người hùng!`), T('Pets always come when you call them.', 'Thú cưng luôn đến khi con gọi.')); }
    };
    return true;
  };

  P.sync(); P.syncYard(); P.refreshInteractables();
  return P;
}
