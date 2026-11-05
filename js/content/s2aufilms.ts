// (v1.08d s2au) The festival films of the lantern story's Season 2 Australia chapters (js/content/chapter10.ts to
// chapter12.ts), made the way the story helper's kit films are (js/content/kitfilms.ts): the lantern goes up, the place
// lights up, then a night show with the friends (the child taps to start it). js/lanterns.ts loads this file only when a
// chapter's lantern is hung. The narration is each chapter's STORY_TALES.lantern_<id>.
import { PROPS as Pp, SETS as L, LOOK, G3 } from '../film.js';
import { THREE } from '../gfx.js';
import { FILMS } from './films.js';
import './chapter10.js'; import './chapter11.js'; import './chapter12.js'; // (the films' words)
import { buildLantern } from '../dinh.js';
import { buildCompanion } from '../companion.js';

const PI = Math.PI;
const CHI = LOOK({ style: 'shirt', color: '#e8434a', hairStyle: 'ponytail', hair: '#3b2618', skin: '#f0c8a0' });
const TEO = LOOK({ style: 'shirt', color: '#5fd36a', hairStyle: 'spiky', hair: '#2a1a10', skin: '#e8b48c' });
const JACK = LOOK({ style: 'shirt', color: '#3b6fe0', hat: 'cap', hairStyle: 'short', hair: '#e8c26a', skin: '#ffe3d1' });
const RUBY = LOOK({ style: 'overalls', color: '#a66bff', hat: 'bow', hairStyle: 'long', hair: '#a8432a', skin: '#ffe3d1' });
const kidOf = S => LOOK(Object.assign({ style: 'shirt', color: '#3b6fe0', hairStyle: 'short' }, (S.ctx && S.ctx.look) || {}, { back: 'none', glider: 0 }));
const flap = (S, c, y = 1.6) => S.every((dt, time) => { c.position.y = y + Math.sin(time * 2.2) * .12; c.userData.wings.forEach((w, j) => { w.rotation.z = (j ? -1 : 1) * Math.sin(time * c.userData.flap) * .6; }); });
type Look = { sky: [string, string]; night: [string, string]; ground: string; prop: (S) => void; say: [string, string]; tap: [string, string] };
// a coral head by the water, the place's own thing behind the lantern
const coral = (S, x, z, col) => { for (let i = 0; i < 4; i++) S.add(new THREE.Mesh(new THREE.CylinderGeometry(.2, .3, 1.6 + i * .3, 6), new THREE.MeshToonMaterial({ color: col })), x + Math.cos(i * 1.7) * .8, .8, z + Math.sin(i * 1.7) * .8); S.add(new THREE.Mesh(G3.S(1, 12, 8), new THREE.MeshToonMaterial({ color: col })), x, 1.6, z); };
const pine = (S, x, z) => { S.add(new THREE.Mesh(new THREE.CylinderGeometry(.2, .3, 1.6, 6), new THREE.MeshToonMaterial({ color: '#6a4a32' })), x, .8, z); for (let i = 0; i < 3; i++) S.add(new THREE.Mesh(new THREE.ConeGeometry(1.8 - i * .45, 2, 8), new THREE.MeshToonMaterial({ color: '#2f6a3a' })), x, 2 + i * 1.1, z); };
const peak = (S, x, z) => { const m = new THREE.Mesh(new THREE.ConeGeometry(6, 9, 5), new THREE.MeshToonMaterial({ color: '#6a6a72' })); S.add(m, x, 4.5, z); S.add(new THREE.Mesh(new THREE.ConeGeometry(2.4, 3.4, 5), new THREE.MeshToonMaterial({ color: '#ffffff' })), x, 7.6, z); };
const tower = (S, x, z) => { S.add(new THREE.Mesh(new THREE.CylinderGeometry(.7, 1, 6, 12), new THREE.MeshToonMaterial({ color: '#ffffff' })), x, 3, z); S.add(new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 1, 12), new THREE.MeshBasicMaterial({ color: '#ffd23f' })), x, 6.5, z); S.add(new THREE.Mesh(new THREE.ConeGeometry(.9, .8, 12), new THREE.MeshToonMaterial({ color: '#e8433a' })), x, 7.4, z); };
const LOOKS: Record<string, Look> = {
  // (v1.08d s2au) Perth and Rottnest: the island's lighthouse over the sea at sunset
  ch12: { sky: ['#ff8a5a', '#ffd08a'], night: ['#1a1a44', '#3a3a6a'], ground: '#f2d48a', prop: S => { tower(S, 4, -16); coral(S, -8, -14, '#7aa860'); }, say: ['The sun set over the sea, and the lighthouse began to shine.', 'Mặt trời lặn xuống biển, và ngọn hải đăng bắt đầu tỏa sáng.'], tap: ['Tap to light up the sky over the island!', 'Chạm để thắp sáng bầu trời trên đảo nào!'] },
  // (v1.08d s2au) Tasmania: Cradle Mountain with snow behind a forest
  ch11: { sky: ['#9ab8d8', '#e8eef8'], night: ['#141a34', '#2a3a5a'], ground: '#6a9a5a', prop: S => { peak(S, 2, -22); pine(S, -7, -12); pine(S, 8, -13); pine(S, -12, -16); }, say: ['Snow fell softly on Cradle Mountain.', 'Tuyết rơi nhẹ trên núi Cradle.'], tap: ['Tap to make the snow sparkle!', 'Chạm để tuyết lấp lánh nào!'] },
  // (v1.08d s2au) the reef beach: coral by the water, the sea at night, baby turtles
  ch10: { sky: ['#ffb07a', '#ffe0b0'], night: ['#0f2244', '#24507a'], ground: '#f2d48a', prop: S => { coral(S, 4, -12, '#ff6a8a'); coral(S, -7, -14, '#ff9f43'); coral(S, 9, -15, '#c060c0'); }, say: ['The reef beach glowed in the moonlight.', 'Bãi biển rạn san hô lấp lánh dưới ánh trăng.'], tap: ['Tap to light the way for the baby turtles!', 'Chạm để soi đường cho rùa con nào!'] }
};
for (const id of Object.keys(LOOKS)) {
  const K = LOOKS[id];
  FILMS['lantern_' + id] = { pages: [
    // 1. the lantern goes up at dusk and the place lights up
    S => {
      S.sky(...K.sky); S.light(.85, .8); L.ground(S, K.ground); K.prop(S);
      const kid = S.person(kidOf(S), -6, 4, PI * .8, .72);
      const lan = buildLantern(true); lan.scale.setScalar(.8); S.add(lan); S.grab(kid, 0, lan, [0, -.5, .1]);
      const comp = buildCompanion(S.ctx.companion || 'firefly'); S.add(comp, -5.2, 1.6, 4.3); flap(S, comp, 1.7);
      S.shot([-2, 3, 12], [1, 3, -8]);
      S.walk(kid, .4, [-3, -4], 1.3); S.move(comp, .4, 3.4, [-2.2, 1.9, -3.6], k => k);
      S.do(kid, 3.8, 'give', 1.4); S.drop(lan, 4.2); S.move(lan, 4.22, 1.6, [0, 6.4, -8], undefined, .8);
      S.skyTo(5.6, 3, K.night[0], K.night[1]); S.lightTo(5.6, 3, .45, .6);
      S.mood(kid, 6.2, 'happy'); S.do(kid, 6.8, 'cheer', 2.4);
      S.cam(3.6, 2, [-5, 2.4, 3], [1, 3.4, -10]); S.cam(6.4, 3, [4, 5, 14], [2, 4, -11]);
      S.say(8.6, ...K.say);
      S.at(10.5, () => { });
    },
    // 2. night: the friends together, and the child starts the fireworks
    S => {
      S.sky(...K.night); S.light(.3, .55); L.ground(S, K.ground); K.prop(S);
      const kid = S.person(kidOf(S), -.6, -1, PI, .72), friends = [S.person(CHI, .8, -.8, PI, .72), S.person(TEO, -2, -.6, PI, .72), S.person(JACK, 2.2, -.6, PI, .72), S.person(RUBY, -3.2, -.4, PI, .72)];
      const comp = buildCompanion(S.ctx.companion || 'firefly'); S.add(comp, .1, 1.9, -.4); flap(S, comp, 2);
      const fw = [[-14, 16, -34], [-4, 19, -38], [6, 17, -34], [16, 15, -30]].map(p => Pp.fireworks(S, ...p));
      S.shot([0, 3, 9], [0, 4, -20]);
      [kid, ...friends].forEach((a, i) => { S.mood(a, 2.4, 'happy'); S.do(a, 2.6 + i * .2, 'wave', 2); });
      S.help(8.2, ...K.tap, t => { fw.forEach((f, i) => S.show(f, t + i * .4)); [kid, ...friends].forEach((a, i) => S.do(a, t + .2 + i * .1, 'cheer', 2)); }, [0, 12, -30]);
      S.cam(3, 6, [3, 3.4, 9], [0, 6, -24]);
      S.at(9.5, () => { });
    }
  ] };
}
