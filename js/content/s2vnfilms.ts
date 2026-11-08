// (v1.08d s2vn) The festival films of the lantern story's chapters 6 to 9, Season 2 in Vietnam (js/content/chapter6.ts
// to chapter9.ts): the lantern goes up at dusk and the place lights up, then a night with the friends where the child
// taps to start the show. Played in the tale theatre like chapters 4 and 5's (written the same way as
// js/content/kitfilms.ts, which stays as it is); js/lanterns.ts loads this file only when one of these lanterns is hung.
// The narration is each chapter's STORY_TALES.lantern_<id>.
import { PROPS as Pp, SETS as L, LOOK } from '../film.js';
import { THREE } from '../gfx.js';
import { FILMS } from './films.js';
import './chapter6.js'; import './chapter7.js'; import './chapter8.js'; import './chapter9.js'; // (the films' words)
import { buildLantern } from '../dinh.js';
import { buildCompanion } from '../companion.js';

const PI = Math.PI;
const CHI = LOOK({ style: 'shirt', color: '#e8434a', hairStyle: 'ponytail', hair: '#3b2618', skin: '#f0c8a0' });
const TEO = LOOK({ style: 'shirt', color: '#5fd36a', hairStyle: 'spiky', hair: '#2a1a10', skin: '#e8b48c' });
const HOA = LOOK({ style: 'tunic', color: '#3cc7e8', hairStyle: 'ponytail', hair: '#1d1412', hat: 'nonla', skin: '#e0a878' });
const kidOf = S => LOOK(Object.assign({ style: 'shirt', color: '#3b6fe0', hairStyle: 'short' }, (S.ctx && S.ctx.look) || {}, { back: 'none', glider: 0 }));
const flap = (S, c, y = 1.6) => S.every((dt, time) => { c.position.y = y + Math.sin(time * 2.2) * .12; c.userData.wings.forEach((w, j) => { w.rotation.z = (j ? -1 : 1) * Math.sin(time * c.userData.flap) * .6; }); });
const M = (c: string) => new THREE.MeshToonMaterial({ color: c });
type Look = { sky: [string, string]; night: [string, string]; ground: string; prop: (S) => void; say: [string, string]; tap: [string, string]; friend: unknown };
// a river with boats and their cây bẹo poles, and the monkey bridge
const river = S => { const w = new THREE.Mesh(new THREE.BoxGeometry(40, .1, 10), M('#4fa8d8')); S.add(w, 0, .06, -14);
  [[-8, -12, '#ffd23f'], [4, -15, '#e8433a'], [12, -12, '#5fd36a']].forEach(([x, z, c]: [number, number, string]) => { S.add(new THREE.Mesh(new THREE.BoxGeometry(4, .5, 1.4), M('#8a5a32')), x, .35, z); S.add(new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 3.4, 6), M('#6a4a32')), x + 1.3, 2, z); S.add(new THREE.Mesh(new THREE.SphereGeometry(.4, 10, 8), M(c)), x + 1.3, 3.8, z); });
  const br = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 12, 6), M('#c8a060')); br.rotation.z = PI / 2; S.add(br, -2, 1.2, -9.5); };
// the bay: stone islands with green tops rising out of the sea, and a junk with brown sails
const bay = S => { const w = new THREE.Mesh(new THREE.BoxGeometry(60, .1, 30), M('#3f9ac8')); S.add(w, 0, .04, -24);
  [[-14, -26, 7], [-4, -32, 10], [8, -28, 8], [18, -34, 11], [2, -20, 5]].forEach(([x, z, h]) => { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 0), M('#a8a092')); r.scale.set(1, h / 4, 1); S.add(r, x, h * .45, z); S.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.8, 0), M('#4f8f42')), x, h * .9, z); });
  S.add(new THREE.Mesh(new THREE.BoxGeometry(3.6, .6, 1.2), M('#8a5a32')), -8, .4, -14); S.add(new THREE.Mesh(new THREE.BoxGeometry(.06, 2.4, 1.8), M('#c8643a')), -7.8, 2, -14); };
// the terraces of Sapa with a peach tree in flower; the nhà rông and a fire for the gong festival
const terraces = S => { ['#4fa8d8', '#7ac860', '#5fae4a', '#8fd06a'].forEach((c, i) => S.add(new THREE.Mesh(new THREE.BoxGeometry(30 - i * 5, 1, 4), M(c)), 0, .5 + i, -14 - i * 4));
  S.add(new THREE.Mesh(new THREE.CylinderGeometry(.2, .3, 3, 6), M('#6a4a32')), 8, 1.5, -8); for (let i = 0; i < 8; i++) S.add(new THREE.Mesh(new THREE.SphereGeometry(.5, 8, 6), M('#ff9ec4')), 8 + Math.cos(i * 2.4) * 1.2, 3 + (i % 3) * .5, -8 + Math.sin(i * 2.4) * 1.2); };
const nharong = S => { S.add(new THREE.Mesh(new THREE.BoxGeometry(6, 2.4, 4), M('#b08a5a')), 2, 2.6, -14); const roof = new THREE.Mesh(new THREE.ConeGeometry(4, 9, 4), M('#8a6a3a')); roof.rotation.y = PI / 4; roof.scale.set(.9, 1, .6); S.add(roof, 2, 8.2, -14);
  [-1, 1].forEach(x => S.add(new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, 1.6, 6), M('#6a4a32')), 2 + x * 2.4, .8, -14)); S.add(new THREE.Mesh(new THREE.ConeGeometry(.9, 1.6, 7), M('#ff7a3a')), -6, .8, -8); };
const MY = LOOK({ style: 'dress', color: '#2a3a7a', hairStyle: 'long', hair: '#1d1412', skin: '#e8b48c' });
const YDAM = LOOK({ style: 'tunic', color: '#3a2a2a', hairStyle: 'short', hair: '#1d1412', skin: '#b8784a' });
const HAI = LOOK({ style: 'shirt', color: '#3b6fe0', hairStyle: 'short', hair: '#1d1412', skin: '#d89a6a' });
const LOOKS: Record<string, Look> = {
  ch6: { sky: ['#ff9a70', '#ffe0a8'], night: ['#141a44', '#2a4a6e'], ground: '#8fcf6a', prop: river, friend: HOA, say: ['The boats on the river glowed with lanterns.', 'Ghe xuồng trên sông sáng rực đèn lồng.'], tap: ['Tap to light the lanterns on every boat!', 'Chạm để thắp đèn trên mọi chiếc ghe nào!'] },
  ch7: { sky: ['#ffb07a', '#ffe8c0'], night: ['#101a3a', '#24406a'], ground: '#d8c08a', prop: bay, friend: HAI, say: ['The stone islands glowed in the sunset.', 'Những hòn đảo đá rực sáng trong hoàng hôn.'], tap: ['Tap to light up the bay!', 'Chạm để thắp sáng cả vịnh nào!'] },
  ch8: { sky: ['#ffc0c8', '#fff0e0'], night: ['#1a1a40', '#3a3a6a'], ground: '#7ac860', prop: terraces, friend: MY, say: ['Lanterns glowed all the way up the terraces.', 'Đèn lồng sáng lung linh dọc ruộng bậc thang.'], tap: ['Tap to light the lanterns on the mountain!', 'Chạm để thắp đèn khắp sườn núi nào!'] },
  ch9: { sky: ['#ff9a50', '#ffd08a'], night: ['#1a1030', '#4a2a3a'], ground: '#c87a4a', prop: nharong, friend: YDAM, say: ['The gongs sang by the nhà rông.', 'Cồng chiêng ngân vang bên nhà rông.'], tap: ['Tap to start the gong festival!', 'Chạm để bắt đầu lễ hội cồng chiêng nào!'] }
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
    // 2. night: the friends together, and the child starts the show
    S => {
      S.sky(...K.night); S.light(.3, .55); L.ground(S, K.ground); K.prop(S);
      const kid = S.person(kidOf(S), -.6, -1, PI, .72), friends = [S.person(K.friend, .8, -.8, PI, .72), S.person(CHI, -2, -.6, PI, .72), S.person(TEO, 2.2, -.6, PI, .72)];
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
