// The festival film of the lantern story's chapter 2, Hà Nội (Play core, 10 Oct): Cầu Thê Húc lights up red over Hồ Gươm,
// then the Trung Thu parade (star lanterns, a lion dance, mooncakes under the full moon). Played in the tale theatre
// like js/content/films.js, which it adds itself to (js/lanterns.js loads this file only when the lantern is hung, so the
// valley starts no slower). The narration is STORY_TALES.lantern_ch2 in js/content/chapters.js. The child helps once:
// a tap lights the star lanterns.
import { SETS as L, PROPS as Pp, LOOK, G3 } from '../film.js';
import { THREE } from '../gfx.js';
import { FILMS } from './films.js';
import './chapter2text.js'; // (the film's words, STORY_TALES.lantern_ch2)
import { buildLantern } from '../dinh.js';
import { buildCompanion } from '../companion.js';
import { buildBridge, buildBridgeLights, buildStarLantern, buildLionHead, buildMooncakes, bridgeY } from './chapter2props.js';

const PI = Math.PI;
const TEO = LOOK({ style: 'shirt', color: '#ffb52e', hairStyle: 'spiky', skin: '#d8a070' });
const TAM = LOOK({ style: 'aodai', color: '#d94a6a', hairStyle: 'long', hat: 'nonla', skin: '#e8b48c' });
const NAM = LOOK({ style: 'aodai', color: '#8a4a8a', hairStyle: 'buns', hair: '#e8e8e8', skin: '#e8b48c' });
const KIDS = [['dress', '#ff7eb8', 'buns'], ['shirt', '#3b6fe0', 'short'], ['shirt', '#43c463', 'spiky'], ['dress', '#ffd23f', 'ponytail']].map(([style, color, hairStyle]) => LOOK({ style, color, hairStyle, skin: '#e0aa80' }));
const kidOf = S => LOOK(Object.assign({ style: 'shirt', color: '#3b6fe0', hairStyle: 'short' }, (S.ctx && S.ctx.look) || {}, { back: 'none', glider: 0 }));
const flap = (S, c, y = 1.5) => S.every((dt, time) => { c.position.y = y + Math.sin(time * 2.2) * .12; c.userData.wings.forEach((w, j) => { w.rotation.z = (j ? -1 : 1) * Math.sin(time * c.userData.flap) * .6; }); });
// Hồ Gươm: a lake the red bridge crosses (both ends on the shore), the little temple at its far end, a tree
function lake(S, bridge = true) {
  L.ground(S, '#7fbf5e');
  const water = new THREE.Mesh(G3.Cyl(1, 1, .05, 40), new THREE.MeshToonMaterial({ color: '#4fa8d8' })); water.scale.set(5.2, 1, 5.6); S.add(water, 1, .02, -6.6);
  const water2 = new THREE.Mesh(G3.Cyl(1, 1, .05, 40), new THREE.MeshToonMaterial({ color: '#4fa8d8' })); water2.scale.set(9, 1, 4); S.add(water2, -2, .015, -16);
  const isle = new THREE.Mesh(G3.Cyl(3, 3.4, .3, 20), new THREE.MeshToonMaterial({ color: '#9ad470' })); S.add(isle, 11.5, .02, -7.6);
  const temple = new THREE.Group(); const wall = new THREE.Mesh(G3.Box(3, 1.6, 2), new THREE.MeshToonMaterial({ color: '#e8d8b0' })); wall.position.y = 1.1; temple.add(wall);
  const roof = new THREE.Mesh(G3.Cone(2.4, 1.2, 4), new THREE.MeshToonMaterial({ color: '#8a3a2a' })); roof.position.y = 2.5; roof.rotation.y = PI / 4; roof.scale.set(1, 1, .7); temple.add(roof); S.add(temple, 11.5, .2, -8.2, -PI / 2);
  L.banyan(S, 13, -11, .6); L.bamboo(S, -14, -12); L.bamboo(S, 15, -14, '#5fae4a', 6);
  if (!bridge) return null;
  const b = buildBridge(); S.add(b, 1, 0, -6.6, 0); return b;
}
FILMS.lantern_ch2 = { pages: [
  // 1. the lantern goes up on Cầu Thê Húc; the mist lifts and the bridge glows red over the lake at dusk
  S => {
    S.sky('#f0a070', '#ffd8a8'); S.light(.85, .8); lake(S, false);
    const b = buildBridge(); S.add(b, 1, 0, -6.6);
    const lights = buildBridgeLights(b.userData.rail); lights.visible = false; S.add(lights, 1, 0, -6.6);
    const mm = new THREE.MeshBasicMaterial({ color: '#f4f7fb', transparent: true, opacity: .45, depthWrite: false });
    const mist = [...Array(9)].map((_, i) => { const s = new THREE.Mesh(G3.S(2.2 + (i % 3) * .5, 12, 8), mm); s.scale.y = .55; return S.add(s, -5 + i * 1.5, 1.4 + (i % 3) * .6, -6.6 + Math.sin(i * 2.4) * 1.2); });
    const kid = S.person(kidOf(S), -9, 1.5, PI * .8, .72);
    const lan = buildLantern(true); lan.scale.setScalar(.8); S.add(lan); S.grab(kid, 0, lan, [0, -.5, .1]);
    const comp = buildCompanion(S.ctx.companion || 'firefly'); S.add(comp, -6.2, 1.6, 2.2); flap(S, comp, 1.6);
    S.shot([-2, 3, 11], [0, 1.5, -5]);
    S.walk(kid, .4, [-7, -5.6], 1.3); S.move(comp, .4, 3.4, [-5.6, 1.8, -5], k => k);
    S.do(kid, 4, 'give', 1.4);
    const top = [1, bridgeY(.5) + 1.3, -6.6];
    S.drop(lan, 4.4); S.move(lan, 4.42, 1.4, top, undefined, .6);
    S.show(lights, 6);
    S.tw(6, 2.6, k => { mm.opacity = .45 * (1 - k); mist.forEach(m => m.scale.set(1 + k * .6, .55 + k * .3, 1 + k * .6)); }, k => k);
    S.skyTo(5.6, 3, '#3a2a6a', '#e86a4a'); S.lightTo(5.6, 3, .45, .6);
    S.mood(kid, 6.2, 'happy'); S.do(kid, 6.8, 'cheer', 2.4);
    S.cam(3.8, 2, [-7, 2.4, 2.5], [0, 2.2, -6.6]); S.cam(6.4, 3, [3, 4, 13], [1, 2, -6]);
    S.say(8.6, 'Red lights danced on the water.', 'Ánh đèn đỏ nhảy múa trên mặt hồ.');
    S.at(10.5, () => { });
  },
  // 2. Trung Thu night: the parade with star lanterns round the lake, the lion dance, mooncakes under the full moon
  S => {
    S.sky('#141a44', '#34406e'); S.light(.3, .55); lake(S, false);
    const b = buildBridge(); S.add(b, 1, 0, -6.6); S.add(buildBridgeLights(b.userData.rail), 1, 0, -6.6);
    L.sun(S, -40, 34, -120, 6, '#fff6d0'); // (the full moon)
    const kid = S.person(kidOf(S), -1, 5.2, 0, .72), teo = S.person(TEO, .4, 5.6, 0, .72);
    const others = KIDS.map((k, i) => S.person(k, -6 + i * 1.6, 3.2, 0, .7));
    // star lanterns, dark until the child lights them
    const stars = [kid, teo, ...others].map((a, i) => { const st = buildStarLantern(['#ff4a3a', '#ffd23f', '#ff7eb8', '#5fd3ff', '#ffb020', '#ff4a3a'][i % 6], false); S.add(st); S.grab(a, 0, st, [0, -.75, .15], 'armR', .9); return st; });
    const lit = [kid, teo, ...others].map((a, i) => { const st = buildStarLantern(['#ff4a3a', '#ffd23f', '#ff7eb8', '#5fd3ff', '#ffb020', '#ff4a3a'][i % 6], true); st.visible = false; S.add(st); S.grab(a, 0, st, [0, -.75, .15], 'armL', .9); return st; });
    const comp = buildCompanion(S.ctx.companion || 'firefly'); S.add(comp, -.2, 1.8, 5.4); flap(S, comp, 1.9);
    S.shot([0, 2.6, 13], [0, 1.6, 0]);
    // (films batch, 13 Oct) the tap comes once the parade has walked, so the film is not held still under the words
    S.help(8.4, 'Tap to light the star lanterns!', 'Chạm để thắp đèn ông sao nào!', t => { stars.forEach((s, i) => { S.show(s, t + i * .15, false); S.show(lit[i], t + i * .15); }); }, [0, 1.4, 4]);
    // the parade walks along the shore
    [kid, teo, ...others].forEach((a, i) => { S.mood(a, 2.2, 'happy'); S.walk(a, 3 + i * .2, [a.px + 5, a.pz - 1.2], 1.1); });
    // the lion dance: a friendly lion head bobbing to the drum, two dancers under its cloth
    const lion = new THREE.Group(); const head = buildLionHead(); head.position.y = 1.4; lion.add(head);
    const cloth = new THREE.Mesh(G3.Box(.9, .7, 1.8), new THREE.MeshToonMaterial({ color: '#ffb020' })); cloth.position.set(0, 1, -1); lion.add(cloth);
    S.add(lion, 5.5, 0, 1.5, -.6);
    S.every((dt, time) => { head.position.y = 1.4 + Math.abs(Math.sin(time * 4)) * .3; head.rotation.z = Math.sin(time * 2) * .25; cloth.rotation.z = Math.sin(time * 4) * .1; });
    const drum = new THREE.Mesh(G3.Cyl(.5, .5, .6, 14), new THREE.MeshToonMaterial({ color: '#a8281e' })); drum.rotation.z = PI / 2; S.add(drum, 7.8, .6, 3.2);
    const nam = S.person(NAM, -6.8, 6.6, .5), tam = S.person(TAM, -5.4, 7, .3);
    const table = Pp.table(); S.add(table, -6, 0, 5.6); S.add(buildMooncakes(), -6, .46, 5.6);
    [nam, tam].forEach((a, i) => { S.mood(a, 0, 'happy'); S.do(a, 4 + i * .4, 'wave', 3); });
    S.cam(3, 6, [4, 3, 12], [1, 1.6, 2]);
    S.at(9.5, () => { });
  }
] };
