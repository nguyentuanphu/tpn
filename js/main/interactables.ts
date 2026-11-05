// (v1.07 split, pure move from js/main.ts) interactables: what a child can walk up to and use, the bubbles over them,
// the area signs and the guides. js/main.ts calls installInteractables where this part stood; the quests (made a moment
// later) and whether a child is playing are read through small arrows.
import { THREE, sprite, P } from '../gfx.js';
import { T, onLang } from '../i18n.js';
import { say } from '../voice.js';
import { SFX } from '../audio.js';
import { $, dist2, clamp } from '../util.js';
import { heightAt, SHRINES, TOWERS, LEAFIES, VILLAGE, HOME, WATER } from '../world.js';
import { openCooking } from '../ui.js';
import { ITEMS, GATHER } from '../data.js';
import { GAMES } from '../games/frame.js';
import type { SvMain } from '../main.js';

export function installInteractables(G: SvMain, D: { world: any, scene: SvMain['scene'], questTarget: (h: any) => any, isPlaying: () => boolean, hudFor: (h: { i: number }) => import('../hud.js').Hud, statueTalk: (h: any) => any, playGame: (i: number, id: string, source: string, shrine?: any) => Promise<any>, give: (...a: any[]) => any, foundLeafy: (h: any, lf: any) => any }) {
  const { world, scene, questTarget, isPlaying, hudFor, statueTalk, playGame, give, foundLeafy } = D;
function setupInteractables() {
  G.interactables.push(...world.interactables);
  SHRINES.forEach(s => G.interactables.push({ id: s.id, x: s.x, z: s.z, r: 4.2, icon: '✨', label: () => T('Enter shrine', 'Vào đền') + ': ' + GAMES[s.game].name(), act: h => playGame(h.i, s.game, 'shrine', s) }));
  TOWERS.forEach(tw => G.interactables.push({ id: tw.id, x: tw.x, z: tw.z, r: 5.5, icon: '🧗', label: () => T('Climb ', 'Leo ') + tw.name(), visible: h => h.pos.y < world.towerMeshes[tw.id].y + 5, act: h => { SFX.whoosh(); h.startTowerClimb(tw); } }));
  LEAFIES.forEach(lf => G.interactables.push({ id: lf.id, x: +lf.x, z: +lf.z, r: lf.kind === 'rock' ? 2.6 : 1.8, icon: lf.kind === 'rock' ? '🪨' : '✨', auto: lf.kind === 'sparkle',
    label: () => lf.kind === 'rock' ? T('Lift rock', 'Nhấc hòn đá') : T('Touch the sparkle', 'Chạm tia lấp lánh'), visible: h => !h.profile.leafies[lf.id], act: h => foundLeafy(h, lf) }));
  world.pots.forEach((p, k) => G.interactables.push({ id: 'pot' + k, x: p.x, z: p.z, r: 2.8, icon: '🍲', label: () => T('Cook', 'Nấu ăn'), act: h => openCooking(G, h.i) }));
  G.interactables.push({ id: 'statue', x: world.statue.x, z: world.statue.z, r: 3.6, icon: '🪷', label: () => T('Lotus Statue', 'Tượng Sen'), act: statueTalk });
  GATHER.forEach(([item, x, z], k) => {
    const y = Math.max(heightAt(x, z), WATER) + .7, s = sprite(ITEMS[item].icon, 1.1); s.position.set(x, y, z); scene.add(s);
    const st = G.gatherState[k] = { s, ready: 0, baseY: y };
    world.updaters.push((dt, t) => { s.visible = performance.now() > st.ready; s.position.y = st.baseY + Math.sin(t * 2 + k) * .12; });
    G.interactables.push({ st, id: 'g' + k, x, z, r: 2.4, icon: ITEMS[item].icon, label: () => T('Pick up ', 'Nhặt ') + ITEMS[item].name(), visible: () => performance.now() > st.ready,
      act: h => { st.ready = performance.now() + 120000; give(h, item, 1); } });
  });
}
// Floating bubble icons over every activity, so children who can't read can see where the fun is.
const bubbled = new WeakSet();
const tex = {};
function setupBubbles() {
  // a round picture bubble with a big name tag underneath
  const mat = (ch, label) => { const key = ch + label; if (tex[key]) return tex[key]; const c = document.createElement('canvas'); c.width = 320; c.height = 200; const x = c.getContext('2d');
    const g = x.createRadialGradient(150, 62, 10, 160, 72, 64); g.addColorStop(0, '#ffffff'); g.addColorStop(.8, '#e9f8ff'); g.addColorStop(1, '#9fdcff');
    x.shadowColor = 'rgba(0,40,80,.35)'; x.shadowBlur = 10; x.shadowOffsetY = 4;
    x.fillStyle = g; x.beginPath(); x.arc(160, 70, 62, 0, Math.PI * 2); x.fill(); x.shadowColor = 'transparent';
    x.strokeStyle = '#ffffff'; x.lineWidth = 6; x.stroke();
    x.font = '72px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 160, 76);
    if (label) {
      x.font = 'bold 30px Fredoka, "Baloo 2", sans-serif'; const w = Math.min(310, x.measureText(label).width + 34);
      x.fillStyle = 'rgba(255,255,255,.96)'; x.beginPath(); x.roundRect(160 - w / 2, 142, w, 50, 25); x.fill();
      x.strokeStyle = '#ffb52e'; x.lineWidth = 4; x.stroke();
      x.fillStyle = '#3a2a20'; x.fillText(label, 160, 168, 290);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return tex[key] = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }); };
  // (v1.08d valley) called again after each part of the valley built later (js/areas.ts): only new activities get a bubble
  const fresh = G.interactables.filter(it => it.bubble && !bubbled.has(it)); fresh.forEach(it => bubbled.add(it));
  const k0 = (G.bubbleIcons || []).length;
  G.bubbleIcons = (G.bubbleIcons || []).concat(fresh.map((it, k1) => { const k = k0 + k1;
    const label = (it.short ? it.short() : it.label ? it.label() : '').replace(/^(Talk to |Nói chuyện với |Enter shrine: |Vào đền: )/, '');
    const s = new THREE.Sprite(mat(it.bubble, label.length > 22 ? label.slice(0, 21) + '…' : label)); s.scale.set(3.2, 2, 1); const y = heightAt(it.x, it.z) + 3.6; s.position.set(it.x, y, it.z); s.userData.it = it; scene.add(s);
    world.updaters.push((dt, t) => { s.position.y = y + Math.sin(t * 2 + k) * .15; const near = G.heroes.some(h => dist2(h.pos.x, h.pos.z, it.x, it.z) < it.r); s.material.opacity = near ? .45 : 1; });
    onLang(() => { const l = (it.short ? it.short() : it.label ? it.label() : '').replace(/^(Talk to |Nói chuyện với |Enter shrine: |Vào đền: )/, ''); s.material = mat(it.bubble, l.length > 22 ? l.slice(0, 21) + '…' : l); });
    return s;
  }));
}
// Help finding the next goal: a golden light beam with a bouncing "!" over it, and for each player
// a glowing arrow plus a trail of sparkles on the ground leading the way.
function setupGuides() {
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, 70, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#ffd23f', transparent: true, opacity: .28, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  const bang = sprite('❗', 2.4); bang.material.fog = false; scene.add(beam, bang);
  // (tester's notes, 12 Oct) tapping the "!" over the light goes there and does the step, like the Go button
  const bangIt = { id: 'quest_bang', x: 0, z: 0, r: 3, act: h => G.goToObjective(Math.max(0, G.heroes.indexOf(h))) };
  bang.userData.it = bangIt; (G.tapTargets = G.tapTargets || []).push(bang);
  const arrowGeo = new THREE.ConeGeometry(.45, 1.1, 4); arrowGeo.rotateX(Math.PI / 2);
  const feet = sprite('👣', .8).material; // footprints when walking to a place chosen on the map
  const guides = [0, 1].map((): { arrow: THREE.Mesh, dots: THREE.Sprite[], sparkle?: THREE.SpriteMaterial } => {
    const arrow = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: '#ffd23f', fog: false }));
    const dots = Array.from({ length: 14 }, () => { const d = sprite('✨', .7); d.material = d.material.clone(); scene.add(d); return d; });
    scene.add(arrow); return { arrow, dots };
  });
  world.updaters.push((dt, t) => {
    const h0 = G.heroes[0], tg0 = h0 && isPlaying() ? questTarget(h0) : null;
    beam.visible = bang.visible = !!tg0 && !h0.profile.questFold; // (Round V) nor its light
    if (tg0) { bangIt.x = tg0.x; bangIt.z = tg0.z; const gy = heightAt(tg0.x, tg0.z); beam.position.set(tg0.x, gy + 35, tg0.z); bang.position.set(tg0.x, gy + 5.2 + Math.abs(Math.sin(t * 3)) * .8, tg0.z); beam.material.opacity = .2 + Math.sin(t * 2) * .08; }
    guides.forEach((g, i) => {
      const h = G.heroes[i];
      if (h && h.walkTo && h.walkTo.friend) { const P = G.partners[h.walkTo.friend]; if (!P) h.walkTo = null; else { h.walkTo.x = P.pos.x; h.walkTo.z = P.pos.z; if (dist2(h.pos.x, h.pos.z, P.pos.x, P.pos.z) < 4) { SFX.chime(); hudFor(h).toast('👫 ' + T(`You found ${P.name}! Say hello!`, `Con đã gặp ${P.name}! Chào bạn đi!`)); say(`You found ${P.name}! Say hello!`, `Con đã gặp ${P.name} rồi! Chào bạn đi!`); h.walkTo = null; G.huds[h.i] && G.huds[h.i].toggleEmotes(true); } } }
      if (h && h.walkTo && dist2(h.pos.x, h.pos.z, h.walkTo.x, h.walkTo.z) < 7) { SFX.chime(); hudFor(h).toast('👣 ' + T(`You walked to ${h.walkTo.name}!`, `Con đã đi bộ đến ${h.walkTo.name}!`)); h.walkTo = null; }
      const tg = h && isPlaying() ? h.walkTo || (h.profile.questFold ? null : questTarget(h)) : null; // (Round V) a folded quest shows no arrow
      const d = tg ? dist2(h.pos.x, h.pos.z, tg.x, tg.z) : 0, show = !!tg && d > 5 && !G.paused;
      g.arrow.visible = show; g.dots.forEach(x => x.visible = show);
      if (!show) return;
      const dx = (tg.x - h.pos.x) / d, dz = (tg.z - h.pos.z) / d;
      g.arrow.position.set(h.pos.x + dx * 1.9, h.pos.y + .35 + Math.sin(t * 5) * .08, h.pos.z + dz * 1.9); g.arrow.rotation.set(0, Math.atan2(dx, dz), 0);
      const flow = (t * 3) % 2.2;
      const want = h.walkTo ? feet : g.sparkle || (g.sparkle = g.dots[0].material.clone());
      g.dots.forEach((x, k) => {
        if (x.material.map !== want.map) { x.material.map = want.map; x.material.needsUpdate = true; }
        const along = 3 + k * 2.2 + flow; if (along > Math.min(d - 1, 34)) { x.visible = false; return; }
        const px = h.pos.x + dx * along, pz = h.pos.z + dz * along;
        x.position.set(px, world.groundAt(px, pz, h.pos.y + 2) + .35, pz); x.material.opacity = 1 - along / 36;
      });
    });
  });
}
// Labels floating over whole areas so they are easy to recognise from far away.
function setupAreaSigns() {
  const sign = (en, vi, icon, x, z, h = 9) => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 160; const g = c.getContext('2d');
    const draw = () => {
      const text = T(en, vi); g.clearRect(0, 0, 640, 160);
      g.font = 'bold 64px Fredoka, "Baloo 2", sans-serif'; const w = Math.min(630, g.measureText(text).width + 150);
      g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.roundRect(320 - w / 2, 20, w, 120, 60); g.fill(); g.strokeStyle = '#ff7eb8'; g.lineWidth = 8; g.stroke();
      g.font = '70px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.fillStyle = '#000'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(icon, 320 - w / 2 + 26, 84);
      g.font = 'bold 60px Fredoka, "Baloo 2", sans-serif'; g.fillStyle = '#4a2a5a'; g.textAlign = 'center'; g.fillText(text, 320 + 40, 84, w - 120);
    };
    draw();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; onLang(() => { draw(); t.needsUpdate = true; });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false })); s.scale.set(16, 4, 1); s.position.set(x, heightAt(x, z) + h, z); scene.add(s);
    // fade out when you are close (so it never blocks the view), fade in from further away
    world.updaters.push(() => { const d = Math.min(...G.heroes.map(o => dist2(o.pos.x, o.pos.z, x, z)), 1e9); s.material.opacity = clamp((d - 22) / 18, 0, 1); s.visible = s.material.opacity > .02; });
  };
  sign('Lotus Village', 'Làng Sen', '🏮', VILLAGE.x, VILLAGE.z - 4, 14);
  sign('Sunny Farm', 'Nông Trại', '🏡', HOME.x, HOME.z, 13);
  sign('Dawn Plateau', 'Cao Nguyên', '🦉', 0, 4, 12);
  sign('Mirror Lake', 'Hồ Gương', '🌊', 55, 125, 8);
  sign('Bamboo Forest', 'Rừng Tre', '🎋', -100, 85, 16);
  sign('Rice Fields', 'Đồng Lúa', '🌾', 112, -38, 8);
  sign('Two Homes Street', 'Phố Hai Quê', '🏘️', 28, 47, 12);
  sign('Three Regions Market', 'Chợ Ba Miền', '🏮', 121, 83, 12);
  sign('Aussie Corner', 'Góc Nước Úc', '🍦', -117, -12, 12);
}
// (tester's notes, 12 Oct) the (i) "about this place" buttons only come up right beside them, and a person to talk to
// comes first, so the button no longer pops up here and there while a child walks past
function nearest(h) {
  let best = null, bd = 1e9;
  for (const it of G.interactables) {
    if (it.visible && !it.visible(h)) continue;
    const d = dist2(h.pos.x, h.pos.z, it.x, it.z), info = it.icon === 'ℹ️';
    if (info && d > Math.max(1.3, it.r - 2.6)) continue; // (a dance group's sign: at the edge of its circle)
    const score = d + (info ? 1.5 : 0) - (it.icon === '💬' ? 1 : 0);
    if (d < it.r && score < bd && Math.abs((it.y ?? heightAt(it.x, it.z)) - h.pos.y) < 5) { best = it; bd = score; }
  }
  return best;
}
  return { setupAreaSigns, nearest, setupGuides, setupBubbles, setupInteractables };
}
