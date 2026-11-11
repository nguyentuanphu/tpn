// The child's companion (round R story, owner's choice: "child picks one"): Lấp Lánh the firefly or Rồng con the baby
// dragon. It flies just behind the child's shoulder, bobbing and flapping, turns the way the child goes, and carries the
// chapter's lantern after it is found (profile.lanterns.carrying). One per child playing; rebuilt when they change.
// (story chapter 2) Its new trick, lighting the way: lead(h, point) sends it to fly over a spot with a warm light round
// it, so an under-5 can follow it (profile.lanterns.tricks lists the tricks learned). Chapter 3's trick, flying higher:
// lead(h, { ..., high: true }) flies up high while still far away, as if spotting the lantern from the sky.
import { THREE, P, merge, toonVC, glow } from './gfx.js';
import { buildLantern } from './dinh.js';

const H = Math.PI / 2;
function firefly() {
  const g = new THREE.Group(), body = new THREE.Group(), look = new THREE.Group(); g.add(body); body.add(look);   // (v1.08e: look = the code shape, the Blender model's fallback)
  look.add(new THREE.Mesh(merge([P(new THREE.SphereGeometry(.13, 12, 10), '#3a3a52', [0, 0, .08]), P(new THREE.SphereGeometry(.035, 6, 5), '#ffffff', [.06, .04, .18]), P(new THREE.SphereGeometry(.035, 6, 5), '#ffffff', [-.06, .04, .18]),
    P(new THREE.SphereGeometry(.017, 6, 5), '#1a1a1a', [.065, .045, .21]), P(new THREE.SphereGeometry(.017, 6, 5), '#1a1a1a', [-.065, .045, .21]),
    ...[-1, 1].map(s => P(new THREE.CylinderGeometry(.008, .008, .16, 4), '#3a3a52', [s * .05, .15, .12], [-.4, 0, s * .3])), ...[-1, 1].map(s => P(new THREE.SphereGeometry(.022, 6, 5), '#ffd23f', [s * .075, .22, .15]))]), toonVC()));
  const tail = new THREE.Mesh(new THREE.SphereGeometry(.15, 14, 10), glow('#d8ff6a')); tail.scale.set(1, .9, 1.3); tail.position.z = -.14; body.add(tail);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: '#eaff8a', transparent: true, depthWrite: false, opacity: .7 })); halo.scale.setScalar(.9); halo.position.z = -.14; body.add(halo);
  const wings = [-1, 1].map(s => { const w = new THREE.Mesh(new THREE.CircleGeometry(.16, 12), new THREE.MeshBasicMaterial({ color: '#dff4ff', transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false }));
    w.scale.set(1, .55, 1); const p = new THREE.Group(); p.position.set(s * .06, .1, .02); w.position.x = s * .15; w.rotation.x = -H; p.add(w); look.add(p); return p; });
  g.userData = { body, look, wings, glow: tail, flap: 22 };
  return g;
}
function dragon() {
  const g = new THREE.Group(), body = new THREE.Group(), look = new THREE.Group(); g.add(body); body.add(look);   // (v1.08e: look = the code shape)
  const teal = '#3cb8a0', belly = '#f2e2a8', horn = '#ffd23f';
  look.add(new THREE.Mesh(merge([
    P(new THREE.CapsuleGeometry(.13, .22, 4, 10), teal, [0, 0, 0], [H, 0, 0]), P(new THREE.SphereGeometry(.1, 10, 8), belly, [0, -.04, .05], [0, 0, 0], [1, .8, 1.4]),
    P(new THREE.SphereGeometry(.13, 12, 10), teal, [0, .14, .2]), P(new THREE.CapsuleGeometry(.065, .08, 4, 8), teal, [0, .1, .32], [H, 0, 0]), P(new THREE.SphereGeometry(.018, 6, 5), '#1a3a32', [.03, .11, .4]), P(new THREE.SphereGeometry(.018, 6, 5), '#1a3a32', [-.03, .11, .4]),
    P(new THREE.SphereGeometry(.035, 8, 6), '#ffffff', [.06, .2, .3]), P(new THREE.SphereGeometry(.035, 8, 6), '#ffffff', [-.06, .2, .3]), P(new THREE.SphereGeometry(.018, 6, 5), '#1a1a1a', [.065, .205, .325]), P(new THREE.SphereGeometry(.018, 6, 5), '#1a1a1a', [-.065, .205, .325]),
    ...[-1, 1].map(s => P(new THREE.ConeGeometry(.025, .12, 5), horn, [s * .06, .28, .14], [-.4, 0, s * -.3])),
    ...[0, 1, 2].map(i => P(new THREE.ConeGeometry(.03, .07, 4), horn, [0, .14 - i * .02, .02 - i * .1])),
    P(new THREE.ConeGeometry(.06, .3, 6), teal, [0, -.02, -.28], [-H - .3, 0, 0]), P(new THREE.ConeGeometry(.04, .08, 4), horn, [0, .02, -.44], [-H, 0, 0]),
    ...[-1, 1].flatMap(s => [P(new THREE.CapsuleGeometry(.03, .06, 3, 6), teal, [s * .08, -.13, .06]), P(new THREE.CapsuleGeometry(.03, .06, 3, 6), teal, [s * .08, -.13, -.08])])]), toonVC()));
  const wings = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * .08, .08, 0);
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(.32, .12); shape.lineTo(.28, -.04); shape.lineTo(.18, -.02); shape.lineTo(.1, -.08); shape.closePath();
    const w = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshToonMaterial({ color: '#7fe0c8', side: THREE.DoubleSide })); w.rotation.x = -H; if (s < 0) w.scale.x = -1; p.add(w); look.add(p); return p; });
  g.userData = { body, look, wings, glow: null, flap: 9 };
  return g;
}
// (11 Nov 2026, owner: "Đom đóm thiếu cánh") Sparkle's wings on the Meshy model, as the reference sheet draws them
// (docs/meshy-production-20261107/reference-images/23-firefly): four see-through wings, a big pair above and a smaller
// pair below, pale with a pink and blue sheen, a cream rim and fine veins. Our own drawing on a canvas. They ride the
// model's body bone (anything a companion wears goes on a bone), so they stay on its back through loops and sleep.
let _wing = null;
function wingTex() {
  if (_wing) return _wing;
  const W = 512, Hh = 256, c = document.createElement('canvas'); c.width = W; c.height = Hh; const x = c.getContext('2d');
  const outline = () => { x.beginPath(); x.moveTo(10, Hh / 2); x.bezierCurveTo(90, 40, 300, 6, 420, 16); x.bezierCurveTo(500, 24, 510, 120, 490, 170);
    x.bezierCurveTo(462, 236, 300, 236, 180, 200); x.bezierCurveTo(100, 176, 40, 150, 10, Hh / 2); x.closePath(); };
  const gr = x.createLinearGradient(0, 0, W, Hh);
  gr.addColorStop(0, 'rgba(255,246,232,0.50)'); gr.addColorStop(.35, 'rgba(228,218,255,0.40)'); gr.addColorStop(.65, 'rgba(255,224,242,0.44)'); gr.addColorStop(1, 'rgba(214,236,255,0.48)');
  outline(); x.fillStyle = gr; x.fill();
  x.save(); outline(); x.clip();   // (the veins inside the wing only)
  x.strokeStyle = 'rgba(226,178,112,0.85)'; x.lineWidth = 4; x.lineCap = 'round';
  for (const [ex, ey, bx, by] of [[470, 40, 300, 30], [500, 110, 330, 90], [470, 190, 320, 160], [330, 214, 200, 170], [200, 190, 120, 150]]) {
    x.beginPath(); x.moveTo(10, Hh / 2); x.quadraticCurveTo(bx, by, ex, ey); x.stroke();
    x.lineWidth = 3; x.beginPath(); x.moveTo(bx + (ex - bx) * .45, by + (ey - by) * .45); x.lineTo(bx + (ex - bx) * .75, by + (ey - by) * .75 + 26); x.stroke(); x.lineWidth = 4;
  }
  x.restore();
  outline(); x.strokeStyle = 'rgba(244,204,138,1)'; x.lineWidth = 11; x.stroke();
  return (_wing = new THREE.CanvasTexture(c));
}
/** the four wings on Sparkle's Meshy model (m: the loaded model, before it is added to the companion) */
export function sparkleWings(c, m) {
  const obj = m.obj, bone = obj.getObjectByName('body'); if (!bone) return;
  obj.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(obj), sz = box.getSize(new THREE.Vector3()), h = sz.y;
  const mat = new THREE.MeshBasicMaterial({ map: wingTex(), transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const zBack = (box.min.z + box.max.z) / 2 - sz.z * .18, made = [];
  // (from the sheet: the big wing 0.64 of the height long, from the top of the chest, tipped up; the small one 0.44, lower, tipped down)
  for (const [len, tall, at, tilt, ph] of [[.64, .34, .47, .42, 0], [.44, .24, .39, -.42, .5]]) for (const s of [-1, 1]) {
    const g = new THREE.PlaneGeometry(len * h, tall * h); g.translate(len * h / 2, 0, 0);
    const w = new THREE.Mesh(g, mat); w.renderOrder = 2; w.rotation.z = tilt;
    const flap = new THREE.Group(); flap.add(w); flap.userData = { axis: 'y', amp: .45, side: s, ph };
    const root = new THREE.Group(); root.scale.x = s; root.position.set(s * sz.x * .06, box.min.y + h * at, zBack); root.add(flap);
    obj.add(root); bone.attach(root); made.push(flap);
  }
  const u = c.o.userData; u.wings.forEach((w: any) => { w.visible = false; }); u.wings = made;
}
let _halo = null;
function haloTex() {
  if (_halo) return _halo;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return (_halo = new THREE.CanvasTexture(c));
}
export const buildCompanion = kind => kind === 'dragon' ? dragon() : firefly();
// (v1.08e creatures) the companion's Blender model: js/creatures.ts (after the start) loads it as soon as the child has one
// and puts it in place of the code shape (look), the fallback; the glow, lantern, hat and tricks stay the game's own
let MODELS: { ask: (c, still: () => boolean) => void, tick: (c, from, dt: number) => void } = null;
export const useCompanionModels = (m: typeof MODELS) => { MODELS = m; };

export function createCompanions(G) {
  const list = new Map(); // hero → { kind, o, lantern }
  const sync = () => {
    for (const h of G.heroes) {
      const st = (h.profile.lanterns || {}), kind = st.companion;
      let c = list.get(h);
      if (c && c.kind !== kind) { G.scene.remove(c.o); list.delete(h); c = null; }
      if (!c && kind) {
        const o = buildCompanion(kind), lantern = buildLantern(true); lantern.scale.setScalar(.5); lantern.position.set(0, -.32, .05); lantern.visible = false; o.userData.body.add(lantern);
        // (the light it shines when it lights the way)
        const beam = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: '#ffe27a', transparent: true, depthWrite: false, opacity: .85 })); beam.scale.setScalar(2.2); beam.visible = false; o.add(beam);
        o.position.set(h.pos.x, h.pos.y + 2, h.pos.z); G.scene.add(o); c = { kind, o, lantern, beam, lead: null }; list.set(h, c);
      }
    }
    for (const [h, c] of list) if (!G.heroes.includes(h)) { G.scene.remove(c.o); list.delete(h); }
    if (MODELS) for (const [h, c] of list) if (!c.asked) { c.asked = true; MODELS.ask(c, () => list.get(h) === c); }   // (v1.08e)
  };
  const _t = new THREE.Vector3();
  G.world.updaters.push((dt, t) => {
    sync();
    for (const [h, c] of list) {
      const o = c.o, u = o.userData, yaw = h.yaw || 0, side = h.i % 2 ? -1 : 1;
      // just behind and beside the child's shoulder, a little above the head
      _t.set(h.pos.x - Math.sin(yaw) * .9 + Math.cos(yaw) * .75 * side, h.pos.y + 1.9 + Math.sin(t * 2.2 + h.i) * .12, h.pos.z - Math.cos(yaw) * .9 - Math.sin(yaw) * .75 * side);
      // lighting the way: it flies on ahead over the spot (a little ahead of the child while far away, so it stays in view)
      if (c.lead) { const dx = c.lead.x - h.pos.x, dz = c.lead.z - h.pos.z, d = Math.hypot(dx, dz), k = d > 9 ? 6 / d : 1;
        _t.set(h.pos.x + dx * k, (k < 1 ? h.pos.y + (c.lead.high ? 6 : 2.2) : c.lead.y) + Math.sin(t * 2.2) * .15, h.pos.z + dz * k); }
      c.beam.visible = !!c.lead; if (c.lead) { c.beam.scale.setScalar(2 + Math.sin(t * 4) * .3); c.beam.material.opacity = .65 + Math.sin(t * 4) * .2; }
      o.position.y -= c.off || 0; c.off = 0; // (a trick's lift is taken off first, so it never builds up)
      if (o.position.distanceTo(_t) > 25) o.position.copy(_t); // after a jump across the map
      const was = o.position.clone();
      o.position.lerp(_t, Math.min(1, dt * 3.2));
      if (c.model) MODELS.tick(c, was, dt);   // (v1.08e) the model's clip
      o.rotation.y += ((((yaw - o.rotation.y) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 4);
      // (11 Nov 2026, owner: "bay nhanh như thế nào") flying fast after a running child it leans into the flight and its
      // wings beat faster; hovering it stays upright (speed smoothed, so a step does not jolt it)
      const sp = Math.hypot(o.position.x - was.x, o.position.z - was.z) / Math.max(dt, 1e-3); c.sp = (c.sp || 0) + (sp - (c.sp || 0)) * Math.min(1, dt * 4);
      const fast = Math.min(1, c.sp / 6); u.beat = (u.beat || 0) + dt * u.flap * (1 + fast * .8);
      u.wings.forEach((w, i) => { const d = w.userData, a = Math.sin(u.beat + (d.ph || 0)) * (d.amp || .6);
        if (d.axis === 'y') w.rotation.y = a; else w.rotation.z = (i ? -1 : 1) * a; });   // (Sparkle's Meshy wings beat back and forth, sparkleWings)
      u.body.rotation.x = Math.sin(t * 1.7) * .08 + fast * .38;
      // (Studio switch companionGrow, js/kidplay.js) it grows as it is fed, wears the hat the child saved for, and does tricks
      const L = h.profile.lanterns || {}, pet = L.pet || {}, grow = G.petLevel ? G.petLevel(h) : 1;
      const sc = 1 + (grow - 1) * .14; o.scale.setScalar(sc);
      if (pet.hat !== c.hatId) { if (c.hat && c.hat.parent) c.hat.parent.remove(c.hat); c.hat = pet.hat && G.buildHat ? G.buildHat(pet.hat) : null; c.hatId = pet.hat;
        // (11 Nov 2026) on a model with a head bone the hat is fitted to the head and goes with it (js/pets.ts hatFit)
        const head = c.hat && c.model && c.model.obj.getObjectByName('head'), fit = head && G.hatFit ? G.hatFit(c.model.obj, head, pet.hat) : null;
        if (fit) { c.hat.position.copy(fit.at); c.hat.scale.setScalar(fit.scale); head.add(c.hat); } else if (c.hat) u.body.add(c.hat); }
      if (c.trick && c.trick.start == null) c.trick.start = t;
      if (c.trick && t - c.trick.start > c.trick.len) c.trick = null;
      if (c.trick) { const k = (t - c.trick.start) / c.trick.len;
        if (c.trick.kind === 'loop') { u.body.rotation.x = k * Math.PI * 2; c.off = Math.sin(k * Math.PI) * 1.2; }
        else { u.body.rotation.y = k * Math.PI * 4; c.off = Math.sin(k * Math.PI * 2) * .4; }
        o.position.y += c.off; }
      else u.body.rotation.y = 0;
      // (the glow warms as it grows)
      if (u.glow) { if (grow >= 2) u.glow.material.color.setHSL(.12 + grow * .03, 1, .62 + Math.sin(t * 3) * .1); else u.glow.material.color.setHSL(.2, 1, .6 + Math.sin(t * 3) * .1); }
      c.lantern.visible = !!(h.profile.lanterns && h.profile.lanterns.carrying);
    }
  });
  // a trick: 'loop' (a loop-the-loop) or 'spin'
  const trick = (h, kind) => { const c = list.get(h); if (c) c.trick = { kind, len: 1.6, start: null }; };
  // lighting the way (chapter 2): fly over a point { x, y, z }, or null to come back to the child's shoulder
  const lead = (h, at) => { const c = list.get(h); if (c) c.lead = at || null; };
  return { of: h => list.get(h) || null, sync, trick, lead };
}
