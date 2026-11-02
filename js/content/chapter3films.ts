// The festival film of the lantern story's chapter 3, Sydney (Play core, 10 Oct): the lantern goes up at the Opera House
// and its sails light up in colours over the harbour, then fireworks burst over the Harbour Bridge (the child taps to
// start them). Played in the tale theatre like js/content/films.js, which it adds itself to; js/lanterns.js loads it only
// when the lantern is hung. The narration is STORY_TALES.lantern_ch3 (js/content/chapter3text.js).
import { SETS as L, PROPS as Pp, LOOK, G3 } from '../film.js';
import { THREE } from '../gfx.js';
import { FILMS } from './films.js';
import './chapter3text.js'; // (the film's words, STORY_TALES.lantern_ch3)
import { buildLantern } from '../dinh.js';
import { buildCompanion } from '../companion.js';
import { buildOperaHouse, buildSailLights, buildHarbourBridge, buildFerry } from './chapter3props.js';

const PI = Math.PI;
const CHI = LOOK({ style: 'shirt', color: '#ffd23f', hairStyle: 'ponytail', hair: '#3b2618', skin: '#f0c8a0' });
const JACK = LOOK({ style: 'shirt', color: '#3b6fe0', hat: 'cap', hairStyle: 'short', hair: '#e8c26a', skin: '#ffe3d1' });
const RUBY = LOOK({ style: 'overalls', color: '#a66bff', hat: 'bow', hairStyle: 'long', hair: '#a8432a', skin: '#ffe3d1' });
const kidOf = S => LOOK(Object.assign({ style: 'shirt', color: '#3b6fe0', hairStyle: 'short' }, (S.ctx && S.ctx.look) || {}, { back: 'none', glider: 0 }));
const flap = (S, c, y = 1.6) => S.every((dt, time) => { c.position.y = y + Math.sin(time * 2.2) * .12; c.userData.wings.forEach((w, j) => { w.rotation.z = (j ? -1 : 1) * Math.sin(time * c.userData.flap) * .6; }); });
// the harbour: water in front and behind, a strip of shore where everyone stands
function harbour(S) {
  L.ground(S, '#8fcf6a');
  const sea = new THREE.Mesh(G3.Box(120, .05, 40), new THREE.MeshToonMaterial({ color: '#3a9ad8' })); S.add(sea, 0, .02, -26);
  const sand = new THREE.Mesh(G3.Box(120, .06, 4), new THREE.MeshToonMaterial({ color: '#e8d8a8' })); S.add(sand, 0, .03, -5);
}
FILMS.lantern_ch3 = { pages: [
  // 1. the lantern goes up at the Opera House; the mist lifts and the sails light up in colours at dusk
  S => {
    S.sky('#f0a070', '#ffd8a8'); S.light(.85, .8); harbour(S);
    const op = buildOperaHouse(); S.add(op, 2, 0, -12);
    const sails = buildSailLights(); sails.visible = false; S.add(sails, 2, 0, -12);
    S.every((dt, time) => { if (sails.visible) sails.userData.tint(time); });
    const mm = new THREE.MeshBasicMaterial({ color: '#f4f7fb', transparent: true, opacity: .45, depthWrite: false });
    const mist = [...Array(9)].map((_, i) => { const s = new THREE.Mesh(G3.S(2.4 + (i % 3) * .5, 12, 8), mm); s.scale.y = .55; return S.add(s, -4 + i * 1.5, 3 + (i % 3) * .7, -12 + Math.sin(i * 2.4) * 1.5); });
    const kid = S.person(kidOf(S), -6, 4, PI * .8, .72);
    const lan = buildLantern(true); lan.scale.setScalar(.8); S.add(lan); S.grab(kid, 0, lan, [0, -.5, .1]);
    const comp = buildCompanion(S.ctx.companion || 'firefly'); S.add(comp, -5.2, 1.6, 4.3); flap(S, comp, 1.7);
    S.shot([-2, 3, 12], [1, 3, -8]);
    S.walk(kid, .4, [-3, -4], 1.3); S.move(comp, .4, 3.4, [-2.2, 1.9, -3.6], k => k);
    S.do(kid, 3.8, 'give', 1.4);
    S.drop(lan, 4.2); S.move(lan, 4.22, 1.6, [0, 8.6, -11.2], undefined, .8);
    S.show(sails, 6);
    S.tw(6, 2.6, k => { mm.opacity = .45 * (1 - k); mist.forEach(m => m.scale.set(1 + k * .6, .55 + k * .3, 1 + k * .6)); }, k => k);
    S.skyTo(5.6, 3, '#2a2a6a', '#d86a7a'); S.lightTo(5.6, 3, .45, .6);
    S.mood(kid, 6.2, 'happy'); S.do(kid, 6.8, 'cheer', 2.4);
    S.cam(3.6, 2, [-5, 2.4, 3], [1, 3.4, -10]); S.cam(6.4, 3, [4, 5, 14], [2, 4, -11]);
    S.say(8.6, 'The harbour twinkled all around.', 'Cả bến cảng lấp lánh ánh đèn.');
    S.at(10.5, () => { });
  },
  // 2. night: fireworks over the Harbour Bridge; Chi, Jack, Ruby and the child cheer together (the child starts them)
  S => {
    S.sky('#141a44', '#34406e'); S.light(.3, .55); harbour(S);
    S.add(buildHarbourBridge(), -6, 0, -30);
    const op = buildOperaHouse(); op.scale.setScalar(.7); S.add(op, 12, 0, -16, -.5);
    const sails = buildSailLights(); sails.scale.setScalar(.7); S.add(sails, 12, 0, -16, -.5); S.every((dt, time) => sails.userData.tint(time));
    S.add(buildFerry(), -2, 0, -12, .4);
    const kid = S.person(kidOf(S), -.6, -1, PI, .72), chi = S.person(CHI, .8, -.8, PI, .72), jack = S.person(JACK, -2, -.6, PI, .72), ruby = S.person(RUBY, 2.2, -.6, PI, .72);
    const comp = buildCompanion(S.ctx.companion || 'firefly'); S.add(comp, .1, 1.9, -.4); flap(S, comp, 2);
    const fw = [[-14, 16, -34], [-4, 19, -38], [6, 17, -34], [16, 15, -30]].map(p => Pp.fireworks(S, ...p));
    S.shot([0, 3, 9], [0, 4, -20]);
    // (films batch, 13 Oct) the tap comes at the end of the scene, so the film is not held still under the words
    [kid, chi, jack, ruby].forEach((a, i) => { S.mood(a, 2.4, 'happy'); S.do(a, 2.6 + i * .2, 'wave', 2); });
    S.help(8.2, 'Tap to start the fireworks!', 'Chạm để bắn pháo hoa nào!', t => { fw.forEach((f, i) => S.show(f, t + i * .4)); [kid, chi, jack, ruby].forEach((a, i) => S.do(a, t + .2 + i * .1, 'cheer', 2)); }, [0, 12, -30]);
    S.cam(3, 6, [3, 3.4, 9], [0, 6, -24]);
    S.at(9.5, () => { });
  }
] };
