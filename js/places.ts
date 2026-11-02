// Extra places in the valley: the dance stage (with its xylophone), the puppet theatre,
// the frog on the lily pad and the treasure chest on the beach.
import { THREE, toon, toonVC, P, merge, sprite } from './gfx.js';
import { T } from './i18n.js';
import { say } from './voice.js';
import { SFX, Music, PARTY } from './audio.js';
import { heightAt, VILLAGE, PLAYGROUND, LAKE, TOWN } from './world.js';
import { dist2 } from './util.js';

export function createPlaces(G) {
  const { scene, world } = G, V = VILLAGE;
  const add = (obj, x, z, rot = 0, dy = 0) => { obj.position.set(x, heightAt(x, z) + dy, z); obj.rotation.y = rot; scene.add(obj); return obj; };
  const PL = {};

  // dance stage with coloured lights
  const st = PL.stage = { x: V.x - 6, z: V.z + 31, r: 4.2 };
  const stage = new THREE.Mesh(merge([
    P(new THREE.CylinderGeometry(4.4, 4.6, .6, 24), '#5a3a8a', [0, .3, 0]), P(new THREE.CylinderGeometry(4.1, 4.1, .08, 24), '#ffd23f', [0, .62, 0]),
    ...[0, 1, 2, 3, 4, 5].map(k => P(new THREE.CylinderGeometry(.12, .12, 4, 6), '#e8e0f0', [Math.cos(k * 1.047) * 4.3, 2.6, Math.sin(k * 1.047) * 4.3])),
    P(new THREE.TorusGeometry(4.3, .15, 6, 30), '#ff5fa2', [0, 4.6, 0], [Math.PI / 2, 0, 0])
  ]), toonVC({ roughness: .5 })); stage.castShadow = stage.receiveShadow = true; add(stage, st.x, st.z);
  world.platforms.push({ x0: st.x - 3.6, x1: st.x + 3.6, z0: st.z - 3.6, z1: st.z + 3.6, y: heightAt(st.x, st.z) + .66 });
  const lights = ['#ff4fb0', '#3ce0ff', '#ffe04a'].map((c, i) => { const l = new THREE.PointLight(c, 0, 12, 1.5); l.position.set(st.x, heightAt(st.x, st.z) + 4, st.z); scene.add(l); return l; });
  // xylophone at the side of the stage
  const xy = PL.xylo = { x: st.x + 5.4, z: st.z - 1 };
  const xyl = new THREE.Mesh(merge([...['#e8434a', '#ff9a2e', '#ffd23f', '#5fd39a', '#3cc7e8', '#3d7fd6', '#9a6bff', '#ff7eb8'].map((c, k) => P(new THREE.BoxGeometry(.22, .06, 1.1 - k * .08), c, [-.9 + k * .26, .8, 0])), P(new THREE.BoxGeometry(2.2, .1, .2), '#7a5236', [0, .72, .45]), P(new THREE.BoxGeometry(2.2, .1, .2), '#7a5236', [0, .72, -.45]), ...[[-1, .45], [1, .45], [-1, -.45], [1, -.45]].map(([x, z]) => P(new THREE.CylinderGeometry(.05, .05, .72, 4), '#7a5236', [x, .36, z]))]), toonVC({ roughness: .4 }));
  add(xyl, xy.x, xy.z, Math.PI / 2); world.colliders.push({ x: xy.x, z: xy.z, r: 1 });
  // puppet theatre
  const th = PL.theatre = { x: V.x + 28, z: V.z - 16 };
  const theatre = new THREE.Mesh(merge([P(new THREE.BoxGeometry(3.6, 3.4, 1), '#c0392b', [0, 1.7, 0]), P(new THREE.BoxGeometry(2.4, 1.4, 1.1), '#2a1a3a', [0, 2.2, .05]), P(new THREE.BoxGeometry(3.8, .5, 1.2), '#ffd23f', [0, 3.5, 0]), P(new THREE.BoxGeometry(1.1, 1.5, 1.12), '#e8434a', [-.8, 2.2, .06]), P(new THREE.BoxGeometry(1.1, 1.5, 1.12), '#e8434a', [.8, 2.2, .06])]), toonVC());
  theatre.castShadow = true; add(theatre, th.x, th.z, -Math.PI / 2 - .4); world.colliders.push({ x: th.x, z: th.z, r: 2 });
  const puppet = sprite('🐰', 1); puppet.position.set(th.x, heightAt(th.x, th.z) + 2.5, th.z); scene.add(puppet);
  // frog on a lily pad in the lotus pond
  const fr = PL.frog = { x: V.x - 10, z: V.z + 4 };
  const frog = sprite('🐸', 1.2); frog.position.set(fr.x + 2, heightAt(fr.x, fr.z) + .5, fr.z - 1.5); scene.add(frog);
  // treasure chest on the lake beach
  const ch = PL.chest = { x: LAKE.x - 45, z: LAKE.z + 21 };
  const chest = new THREE.Mesh(merge([P(new THREE.BoxGeometry(1.4, .8, .9), '#8a5a3b', [0, .4, 0]), P(new THREE.CylinderGeometry(.45, .45, 1.4, 12, 1, false, 0, Math.PI), '#a0703a', [0, .8, 0], [0, 0, Math.PI / 2]), P(new THREE.BoxGeometry(.25, .3, .1), '#ffd23f', [0, .7, .46])]), toonVC({ roughness: .6 }));
  chest.castShadow = true; add(chest, ch.x, ch.z, .4); world.colliders.push({ x: ch.x, z: ch.z, r: 1 });

  // Folk Games Playground: a picnic rug, bunting, a chalk hopscotch and a marble ring
  const pg = PL.playground = PLAYGROUND, gy = heightAt(pg.x, pg.z);
  const flags = ['#e8434a', '#ffd23f', '#3cc7e8', '#5fd39a', '#ff7eb8', '#3b6fe0'];
  const deco = new THREE.Mesh(merge([
    P(new THREE.BoxGeometry(4, .06, 3), '#e85a6a', [0, .03, 0]), P(new THREE.BoxGeometry(4.02, .07, .3), '#ffffff', [0, .035, -.9]), P(new THREE.BoxGeometry(4.02, .07, .3), '#ffffff', [0, .035, .9]),
    ...[-7, 7].map(x => P(new THREE.CylinderGeometry(.12, .14, 4.4, 8), '#c99a6a', [x, 2.2, -6])),
    P(new THREE.CylinderGeometry(.03, .03, 14, 4), '#7a5a3a', [0, 4.1, -6], [0, 0, Math.PI / 2]),
    ...Array.from({ length: 13 }, (_, k) => P(new THREE.ConeGeometry(.35, .7, 3), flags[k % flags.length], [-6 + k, 3.65 - Math.sin(k / 12 * Math.PI) * .45, -6], [Math.PI, 0, 0])),
    ...[[0, 0], [0, 1], [-.55, 2], [.55, 2], [0, 3], [-.55, 4], [.55, 4], [0, 5]].map(([x, z]) => P(new THREE.BoxGeometry(1, .03, 1), '#f4f0e8', [-8 + x * 1.05, .02, 3 + z * 1.05])),
  ]), toonVC({ roughness: .8 }));
  deco.receiveShadow = true; add(deco, pg.x, pg.z, 0, -.02);
  // little marbles inside the chalk ring
  // Ruby's chalk marble ring on the front lawn of the Aussie house across the park
  const mr = { x: TOWN.x + 15.5, z: TOWN.z + 3.6 };
  const ringM = new THREE.Mesh(new THREE.TorusGeometry(1.4, .06, 4, 32).rotateX(Math.PI / 2), toon('#f4f0e8')); ringM.position.set(mr.x, heightAt(mr.x, mr.z) + .03, mr.z); scene.add(ringM);
  ['🔴', '🔵', '🟢', '🟡'].forEach((m, k) => { const sp = sprite(m, .35); sp.position.set(mr.x + Math.cos(k * 1.6) * .6, gy + .2, mr.z + Math.sin(k * 1.6) * .6); scene.add(sp); });

  const I = (id, spot, r, icon, label, act) => G.interactables.push({ id, x: spot.x, z: spot.z, r, icon, label, act, bubble: icon });
  I('xylo', xy, 2.4, '🎵', () => T('Copy the tune', 'Nhại giai điệu'), h => G.playGame(h.i, 'tune', 'place'));
  I('theatre', { x: th.x - 2, z: th.z - 1 }, 3, '🎭', () => T('Shadow puppets', 'Múa rối bóng'), h => G.playGame(h.i, 'shapes', 'place'));
  I('frog', { x: fr.x + 2.5, z: fr.z - 6 }, 3.2, '🐸', () => T('Odd one out', 'Tìm hình khác'), h => G.playGame(h.i, 'oddone', 'place'));
  I('chest', ch, 2.6, '💎', () => T('Treasure memory', 'Rương kho báu'), h => G.playGame(h.i, 'memory', 'place'));
  G.interactables.push({ id: 'stage', x: st.x, z: st.z, r: 4, icon: '💃', bubble: '💃', auto: true, act: () => {}, label: () => '' });

  // dancing: anyone standing on the stage dances; taps make music notes
  PL.songIdx = 0;
  PL.onStage = h => dist2(h.pos.x, h.pos.z, st.x, st.z) < 3.8 && h.onGround;
  PL.update = (dt, t) => {
    const any = G.heroes.some(PL.onStage);
    lights.forEach((l, i) => { l.intensity = any ? 12 : 0; l.position.x = st.x + Math.cos(t * 1.5 + i * 2.1) * 2.5; l.position.z = st.z + Math.sin(t * 1.5 + i * 2.1) * 2.5; });
    puppet.position.y = heightAt(th.x, th.z) + 2.4 + Math.abs(Math.sin(t * 3)) * .3; frog.position.y = heightAt(fr.x, fr.z) + .5 + Math.abs(Math.sin(t * 1.3)) * .25;
    G.heroes.forEach(h => {
      const on = PL.onStage(h);
      if (on && !h._dancing) { h._dancing = true; say('Dance party! Tap the screen to make music!', 'Tiệc nhảy! Chạm màn hình để tạo nhạc nào!'); G.job('dance'); }
      if (!on) h._dancing = false;
    });
    PL.dancing = any;
  };
  PL.song = () => PARTY[PL.songIdx % PARTY.length];
  PL.nextSong = () => { PL.songIdx++; SFX.chime(); Music.play(PL.song()); };
  PL.note = h => { SFX.note(Math.floor(Math.random() * 8)); G.fx(h.pos.x + (Math.random() - .5) * 2, h.pos.y + 2.2, h.pos.z + (Math.random() - .5) * 2, ['🎵', '🎶', '✨', '⭐'][Math.floor(Math.random() * 4)]); };
  return PL;
}
