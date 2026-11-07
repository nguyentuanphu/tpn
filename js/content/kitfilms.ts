// (v1.08b story) The festival films of the lantern story's chapters 4, 5 and the Tết finale (js/content/chapter4.ts,
// chapter5.ts, chapterfinale.ts): the lantern goes up, the place lights up, then a night show with the friends (the child
// taps to start the fireworks). Played in the tale theatre like chapter 3's (js/content/chapter3films.ts); js/lanterns.ts
// loads this file only when a chapter's lantern is hung. The narration is each chapter's STORY_TALES.lantern_<id>.
import { PROPS as Pp, SETS as L, LOOK, G3 } from '../film.js';
import { THREE } from '../gfx.js';
import { FILMS } from './films.js';
import './chapter4.js'; import './chapter5.js'; import './chapterfinale.js'; // (the films' words)
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
// a little Christmas tree, a red rock, a blossom tree: the place's own thing behind the lantern
const tree = (S, x, z, col = '#2f8a4a', top = '#ffd23f') => { for (let i = 0; i < 3; i++) S.add(new THREE.Mesh(new THREE.ConeGeometry(2.2 - i * .55, 2.2, 10), new THREE.MeshToonMaterial({ color: col })), x, 1.4 + i * 1.2, z); S.add(new THREE.Mesh(new THREE.OctahedronGeometry(.4), new THREE.MeshBasicMaterial({ color: top })), x, 5.2, z); };
const rock = (S, x, z) => { const m = new THREE.Mesh(G3.S(6, 16, 10), new THREE.MeshToonMaterial({ color: '#c8643a' })); m.scale.set(2.6, .7, 1.2); S.add(m, x, 1.2, z); return m; };
const blossom = (S, x, z, col) => { S.add(new THREE.Mesh(new THREE.CylinderGeometry(.2, .3, 3, 6), new THREE.MeshToonMaterial({ color: '#6a4a32' })), x, 1.5, z); for (let i = 0; i < 10; i++) S.add(new THREE.Mesh(G3.S(.5, 8, 6), new THREE.MeshToonMaterial({ color: col })), x + Math.cos(i * 2.4) * 1.2, 3 + (i % 3) * .5, z + Math.sin(i * 2.4) * 1.2); };
const LOOKS: Record<string, Look> = {
  ch4: { sky: ['#f0a070', '#ffd8a8'], night: ['#141a44', '#34406e'], ground: '#8fcf6a', prop: S => { tree(S, 3, -10); tree(S, -8, -14, '#2a7a40', '#ff5fa2'); }, say: ['The lake shone for the New Year.', 'Mặt hồ lấp lánh đón Năm mới.'], tap: ['Tap to start the countdown fireworks!', 'Chạm để bắn pháo hoa giao thừa nào!'] },
  ch5: { sky: ['#ff9a50', '#ffd08a'], night: ['#1a1440', '#4a2a5a'], ground: '#d89a5a', prop: S => { rock(S, 2, -16); }, say: ['Uluru glowed orange in the sunset.', 'Uluru rực cam trong hoàng hôn.'], tap: ['Tap to light up the night sky!', 'Chạm để thắp sáng bầu trời đêm!'] },
  finale: { sky: ['#ffb0c0', '#ffe8c0'], night: ['#2a1030', '#5a2040'], ground: '#8fcf6a', prop: S => { blossom(S, 3, -10, '#ff9ec4'); blossom(S, -7, -12, '#ffd23f'); }, say: ['The whole valley glowed red and gold.', 'Cả thung lũng rực đỏ và vàng.'], tap: ['Tap to start the Tết fireworks!', 'Chạm để bắn pháo hoa đón Tết nào!'] }
};
for (const id of ['ch4', 'ch5', 'finale']) {
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
