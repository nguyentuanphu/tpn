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
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  body.add(new THREE.Mesh(merge([P(new THREE.SphereGeometry(.13, 12, 10), '#3a3a52', [0, 0, .08]), P(new THREE.SphereGeometry(.035, 6, 5), '#ffffff', [.06, .04, .18]), P(new THREE.SphereGeometry(.035, 6, 5), '#ffffff', [-.06, .04, .18]),
    P(new THREE.SphereGeometry(.017, 6, 5), '#1a1a1a', [.065, .045, .21]), P(new THREE.SphereGeometry(.017, 6, 5), '#1a1a1a', [-.065, .045, .21]),
    ...[-1, 1].map(s => P(new THREE.CylinderGeometry(.008, .008, .16, 4), '#3a3a52', [s * .05, .15, .12], [-.4, 0, s * .3])), ...[-1, 1].map(s => P(new THREE.SphereGeometry(.022, 6, 5), '#ffd23f', [s * .075, .22, .15]))]), toonVC()));
  const tail = new THREE.Mesh(new THREE.SphereGeometry(.15, 14, 10), glow('#d8ff6a')); tail.scale.set(1, .9, 1.3); tail.position.z = -.14; body.add(tail);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: '#eaff8a', transparent: true, depthWrite: false, opacity: .7 })); halo.scale.setScalar(.9); halo.position.z = -.14; body.add(halo);
  const wings = [-1, 1].map(s => { const w = new THREE.Mesh(new THREE.CircleGeometry(.16, 12), new THREE.MeshBasicMaterial({ color: '#dff4ff', transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false }));
    w.scale.set(1, .55, 1); const p = new THREE.Group(); p.position.set(s * .06, .1, .02); w.position.x = s * .15; w.rotation.x = -H; p.add(w); body.add(p); return p; });
  g.userData = { body, wings, glow: tail, flap: 22 };
  return g;
}
function dragon() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const teal = '#3cb8a0', belly = '#f2e2a8', horn = '#ffd23f';
  body.add(new THREE.Mesh(merge([
    P(new THREE.CapsuleGeometry(.13, .22, 4, 10), teal, [0, 0, 0], [H, 0, 0]), P(new THREE.SphereGeometry(.1, 10, 8), belly, [0, -.04, .05], [0, 0, 0], [1, .8, 1.4]),
    P(new THREE.SphereGeometry(.13, 12, 10), teal, [0, .14, .2]), P(new THREE.CapsuleGeometry(.065, .08, 4, 8), teal, [0, .1, .32], [H, 0, 0]), P(new THREE.SphereGeometry(.018, 6, 5), '#1a3a32', [.03, .11, .4]), P(new THREE.SphereGeometry(.018, 6, 5), '#1a3a32', [-.03, .11, .4]),
    P(new THREE.SphereGeometry(.035, 8, 6), '#ffffff', [.06, .2, .3]), P(new THREE.SphereGeometry(.035, 8, 6), '#ffffff', [-.06, .2, .3]), P(new THREE.SphereGeometry(.018, 6, 5), '#1a1a1a', [.065, .205, .325]), P(new THREE.SphereGeometry(.018, 6, 5), '#1a1a1a', [-.065, .205, .325]),
    ...[-1, 1].map(s => P(new THREE.ConeGeometry(.025, .12, 5), horn, [s * .06, .28, .14], [-.4, 0, s * -.3])),
    ...[0, 1, 2].map(i => P(new THREE.ConeGeometry(.03, .07, 4), horn, [0, .14 - i * .02, .02 - i * .1])),
    P(new THREE.ConeGeometry(.06, .3, 6), teal, [0, -.02, -.28], [-H - .3, 0, 0]), P(new THREE.ConeGeometry(.04, .08, 4), horn, [0, .02, -.44], [-H, 0, 0]),
    ...[-1, 1].flatMap(s => [P(new THREE.CapsuleGeometry(.03, .06, 3, 6), teal, [s * .08, -.13, .06]), P(new THREE.CapsuleGeometry(.03, .06, 3, 6), teal, [s * .08, -.13, -.08])])]), toonVC()));
  const wings = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * .08, .08, 0);
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(.32, .12); shape.lineTo(.28, -.04); shape.lineTo(.18, -.02); shape.lineTo(.1, -.08); shape.closePath();
    const w = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshToonMaterial({ color: '#7fe0c8', side: THREE.DoubleSide })); w.rotation.x = -H; if (s < 0) w.scale.x = -1; p.add(w); body.add(p); return p; });
  g.userData = { body, wings, glow: null, flap: 9 };
  return g;
}
let _halo = null;
function haloTex() {
  if (_halo) return _halo;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return (_halo = new THREE.CanvasTexture(c));
}
export const buildCompanion = kind => kind === 'dragon' ? dragon() : firefly();

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
      o.position.lerp(_t, Math.min(1, dt * 3.2));
      o.rotation.y += ((((yaw - o.rotation.y) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 4);
      u.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * Math.sin(t * u.flap) * .6; });
      u.body.rotation.x = Math.sin(t * 1.7) * .08;
      // (Studio switch companionGrow, js/kidplay.js) it grows as it is fed, wears the hat the child saved for, and does tricks
      const L = h.profile.lanterns || {}, pet = L.pet || {}, grow = G.petLevel ? G.petLevel(h) : 1;
      const sc = 1 + (grow - 1) * .14; o.scale.setScalar(sc);
      if (pet.hat !== c.hatId) { if (c.hat) u.body.remove(c.hat); c.hat = pet.hat && G.buildHat ? G.buildHat(pet.hat) : null; if (c.hat) u.body.add(c.hat); c.hatId = pet.hat; }
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
