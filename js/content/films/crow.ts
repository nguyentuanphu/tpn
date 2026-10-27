// The Thirsty Crow (Con quạ thông minh): a hot day, the jug with a little water, the idea, plop plop plop, the water
// rises, the crow drinks, think and try. The child helps twice: the pebbles (page 4) and the drink (page 5).
import { L, Pp, THREE, P, mesh, PI, H, go, hop, turn, plain, bird, rock } from './kit.js';

const crow = S => { const c = bird('#22222a', 4); c.userData.flap = .05; return S.add(c, 0, .55, 2.6, 0); };
// the clay jug: its water can rise (userData.level 0..1)
const jug = S => {
  const g = new THREE.Group(); g.add(mesh([P(new THREE.CylinderGeometry(.5, .6, 1.2, 16, 1, true), '#c8783a', [0, .6, 0]), P(new THREE.CylinderGeometry(.6, .6, .06, 16), '#b86a2a', [0, .03, 0]), P(new THREE.TorusGeometry(.5, .06, 6, 16), '#b86a2a', [0, 1.2, 0], [H, 0, 0])]));
  const w = mesh([P(new THREE.CylinderGeometry(.47, .47, .04, 16), '#5ab0e0', [0, 0, 0])]); w.position.y = .15; g.add(w);
  g.userData.level = k => { w.position.y = .15 + k * .95; };
  return S.add(g, 1, 0, 2);
};
const pebbles = S => Array.from({ length: 6 }, (_, i) => S.add(rock('#bfb8ac', .18), -1.4 + (i % 3) * .3, 0, 3 + (i >> 1) * .2));

export default { pages: [
  // 1. On a very hot day, a crow was very thirsty.
  S => {
    plain(S); L.sun(S, 0, 30, -70, 8, '#ffd070');
    const c = crow(S); c.userData.flap = 1; c.position.set(-8, 5, -2);
    S.shot([0, 2.4, 9], [0, 1.4, 1]);
    go(S, c, .3, 2.4, [0, .55, 2.6]); S.at(2.7, () => { c.userData.flap = .05; }); S.cam(.3, 2.6, [2, 1.4, 6], [0, .8, 2.6]);
    S.say(4.2, '"Caw! So hot! I need a drink!"', '"Quạ, quạ! Nóng quá! Khát nước quá!"');
    S.tw(4.3, 1.6, k => { c.rotation.z = Math.sin(k * PI * 3) * .15; }); S.cam(4.2, 2.4, [1, .8, 4.6], [0, .6, 2.6]);
    S.at(7, () => { });
  },
  // 2. He found a jug with a little water at the bottom, but his beak could not reach it.
  S => {
    plain(S); const j = jug(S); const c = crow(S); c.position.set(-1, .55, 2.4);
    S.shot([0, 2, 6], [.6, .8, 2]);
    hop(S, c, .3, 2, .3); S.move(c, .3, .9, [.4, .55, 2.2]); S.cam(.3, 2, [.4, 2.4, 4], [1, .6, 2]);
    S.tw(2, 2, k => { c.rotation.x = Math.sin(k * PI * 2) * .5; });
    S.say(5.7, 'He pushed and stretched, but it was too deep.', 'Quạ rướn mãi, rướn mãi, nhưng nước sâu quá.');
    S.tw(5.8, 2, k => { c.rotation.x = .3 + Math.sin(k * PI * 3) * .2; }); S.cam(5.6, 2.4, [1, 2.6, 2.6], [1, .3, 2]);
    S.at(8.4, () => { });
  },
  // 3. He had an idea! He picked up a little pebble.
  S => {
    plain(S); jug(S); const c = crow(S); c.position.set(-.4, .55, 2.8); const ps = pebbles(S);
    const sp = Pp.sparkle('#ffe27a'); S.add(sp, -.4, 1.4, 2.8);
    S.shot([0, 1.8, 6], [-.6, .6, 2.8]);
    S.show(sp, .4); S.show(sp, 2, false); hop(S, c, .6, 1, .4); S.cam(.3, 2, [-.4, 1.2, 4.6], [-.6, .6, 2.8]);
    S.say(4.4, 'One small stone, in his beak.', 'Một hòn sỏi nhỏ, ngậm trong mỏ.');
    go(S, c, 4.4, .8, [-1.1, .55, 3.1]); S.at(5.4, () => { c.add(ps[0]); ps[0].position.set(0, 0, .3); ps[0].scale.setScalar(.3); });
    S.cam(4.4, 2, [-1, 1, 4.6], [-1, .5, 3]);
    S.at(7.2, () => { });
  },
  // 4. Plop, plop, plop! He dropped pebbles into the jug, one by one.
  S => {
    plain(S); const j = jug(S); const c = crow(S); c.position.set(-.8, .55, 3); const ps = pebbles(S);
    S.shot([0, 2, 6], [0, .8, 2.4]);
    S.cam(.3, 2, [.6, 2, 5], [.4, .8, 2.4]);
    S.help(5.8, 'Tap to drop the pebbles in!', 'Chạm để thả sỏi vào bình nào!', tt => {
      ps.forEach((p, i) => { S.move(p, tt + i * .3, .3, [1, 1.6, 2], undefined, .6); S.move(p, tt + .3 + i * .3, .2, [1, .2, 2]); S.show(p, tt + .5 + i * .3, false); });
      S.tw(tt, 2, k => j.userData.level(k * .6)); hop(S, c, tt, 4, .2, .45);
      S.cam(tt, 1.6, [1.6, 2.6, 4], [1, .8, 2]);
    }, [1, 1.2, 2], 2.3);
  },
  // 5. The water rose higher and higher, until he could drink!
  S => {
    plain(S); const j = jug(S); j.userData.level(.6); const c = crow(S); c.position.set(.2, .55, 2.4);
    S.shot([0, 2, 6], [.6, .8, 2]);
    S.cam(.3, 2, [1.4, 2, 4.4], [1, 1, 2]);
    S.help(4.5, 'Tap to help the crow drink!', 'Chạm để quạ uống nước nào!', tt => {
      S.tw(tt, .6, k => j.userData.level(.6 + k * .4)); hop(S, c, tt + .3, 1, .5); S.move(c, tt + .3, .45, [1, 1.3, 2]);
      S.tw(tt + 1, 1.2, k => { c.rotation.x = Math.max(0, Math.sin(k * PI * 4)) * .6; }); S.cam(tt, 1.8, [2, 1.8, 3.6], [1, 1.2, 2]);
    }, [1, 1.2, 2], 2.3);
  },
  // 6. Where there is a will, there is a way. Think, and try!
  S => {
    plain(S); jug(S).userData.level(1); const c = crow(S); c.position.set(1, 1.3, 2);
    S.shot([0, 2, 7], [1, 1.2, 2]);
    S.tw(.3, 1.6, k => { c.rotation.z = Math.sin(k * PI * 4) * .2; }); S.cam(.3, 2.6, [2, 1.6, 5], [1, 1.2, 2]);
    S.say(4.8, 'Off he flew, happy and cool.', 'Quạ vỗ cánh bay đi, mát rượi và vui vẻ.');
    S.at(4.8, () => { c.userData.flap = 1; }); go(S, c, 4.9, 2.4, [8, 6, -6]); S.cam(4.8, 2.4, [0, 2, 8], [3, 3, -2]);
    S.at(7.6, () => { });
  }
] };
