// Dot and the Kangaroo (Bé Dot và Kangaroo): Dot lost in the bush at dusk, the kind mother kangaroo, the magic
// berries, the koala, the owl, the kookaburra and the lizard help, the kangaroo carries Dot home, a hug and a promise.
// The child helps twice: eating the berries (page 3) and hopping home (page 5).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, go, hop, turn, speak, KID, VILLAGER, bush, animal, owl, bird, board } from './kit.js';

const DOT = LOOK({ style: 'dress', color: '#ffd0e4', hairStyle: 'ponytail', hair: '#c8a060', skin: '#f2c8a0' });
const berries = () => mesh([0, 1, 2, 3, 4].map(i => P(new THREE.SphereGeometry(.06, 8, 6), '#4a3ab8', [Math.cos(i * 1.3) * .08, .06 + (i % 2) * .05, Math.sin(i * 1.3) * .08])));
const lizard = () => mesh([P(new THREE.CapsuleGeometry(.08, .35, 4, 8), '#8a9a3a', [0, .08, 0], [H, 0, 0]), P(new THREE.SphereGeometry(.08, 8, 6), '#8a9a3a', [0, .1, .28]), P(new THREE.ConeGeometry(.05, .4, 6), '#8a9a3a', [0, .06, -.4], [-H, 0, 0]), P(new THREE.SphereGeometry(.02, 6, 5), '#1a1a1a', [.05, .14, .33]), P(new THREE.SphereGeometry(.02, 6, 5), '#1a1a1a', [-.05, .14, .33])]);
const dusk = S => { S.sky('#e8805a', '#ffc89a'); S.light(.7, .75); };

export default { pages: [
  // 1. Little Dot got lost in the Australian bush. It was getting dark, and she felt scared.
  S => {
    bush(S, { rockFar: false }); dusk(S);
    const dot = S.person(DOT, -3, 3, H, .75);
    S.shot([0, 2, 9], [0, 1, 1]);
    S.walk(dot, .3, [0, 2], .9); S.face(dot, 3.6, -H); S.face(dot, 4.4, H * .4); S.mood(dot, 3.6, 'sad');
    S.cam(.3, 3.6, [1, 1.2, 5], [0, .8, 2]);
    S.skyTo(3, 3, '#5a4a7a', '#c8889a');
    S.say(6.6, 'The trees looked tall and dark all around her.', 'Cây cối quanh bé trông cao và tối om.');
    S.do(dot, 6.6, 'hug', 2.6); S.cam(6.6, 2.6, [0, 4, 7], [0, .6, 2]);
    S.at(9.6, () => { });
  },
  // 2. A kind mother kangaroo found her. She had lost her own joey, and she wanted to help.
  S => {
    bush(S, { rockFar: false }); dusk(S);
    const dot = S.person(DOT, 0, 2, 0, .75), roo = animal(S, 'joey', 7, 0, -H, 2.6); roo.userData.rig.gait = 'hop';
    S.do(dot, 0, 'sitground', 3); S.mood(dot, 0, 'sad');
    S.shot([0, 2, 9], [1, 1, 1]);
    go(S, roo, .4, 2.4, [1.6, 0, .8]); S.cam(.3, 3, [-2, 1.6, 6], [1, 1, 1]);
    S.face(dot, 2.6, [1.6, .8]); S.mood(dot, 3.2, 'o'); S.tw(3.4, 1.6, k => { roo.userData.nod = Math.sin(k * PI) * .5; });
    S.say(6.5, 'She gently sniffed Dot, and Dot smiled.', 'Kangaroo nhẹ nhàng hít hít Dot, và Dot mỉm cười.');
    S.mood(dot, 7, 'happy'); S.do(dot, 7.2, 'hug', 2); S.cam(6.4, 2.6, [1, 1.2, 4.4], [.8, .8, 1.4]);
    S.at(9.4, () => { });
  },
  // 3. The kangaroo gave Dot some magic berries. Suddenly Dot could understand what the animals said!
  S => {
    bush(S, { rockFar: false }); dusk(S);
    const dot = S.person(DOT, -.6, 2, .6, .75), roo = animal(S, 'joey', 1, 1, -.8, 2.6), b = berries(); S.add(b, .2, .9, 1.6);
    S.shot([0, 1.6, 6], [0, .8, 1.4]);
    S.tw(.4, 1.4, k => { roo.userData.nod = Math.sin(k * PI) * .5; }); S.cam(.3, 3, [1, 1.2, 4.4], [0, .8, 1.6]);
    S.help(6.7, 'Tap to give Dot the magic berries!', 'Chạm để Dot ăn quả mọng thần nào!', tt => {
      S.grab(dot, tt, b, [0, -.5, .15]); S.do(dot, tt + .2, 'eat', 1.2); S.show(b, tt + 1.4, false);
      const sp = Pp.sparkle('#ffe27a'); S.add(sp, -.6, .6, 2); S.show(sp, tt + 1.4); S.mood(dot, tt + 1.4, 'happy'); S.do(dot, tt + 1.6, 'cheer', .7);
      S.cam(tt, 1.6, [-.4, 1.2, 4], [-.4, .8, 2]);
    }, [.2, .9, 1.6], 2.3);
  },
  // 4. The koala, the owl, the kookaburra and the lizard all helped look for Dot's home.
  S => {
    bush(S, { rockFar: false }); dusk(S);
    const dot = S.person(DOT, 0, 2.4, PI, .75), ko = animal(S, 'koala', -2.4, -1, .4, 1.2), ow = owl(), kb = bird('#c8a070', 1.6), li = lizard();
    S.add(ow, 2.4, 2.6, -2); S.add(kb, 6, 4, -4); S.add(li, 1.6, 0, 1, -.6);
    S.shot([0, 2.2, 8], [0, 1.2, 0]);
    S.tw(.4, 1.6, k => { ko.userData.nod = Math.sin(k * PI * 2) * .3; }); S.cam(.3, 2, [-1.6, 1.6, 3], [-2.4, 1, -1]);
    S.tw(2.2, 1.4, k => { ow.rotation.y = Math.sin(k * PI * 2) * .6; }); S.cam(2.2, 1.6, [2, 2.4, 1], [2.4, 2.6, -2]);
    go(S, kb, 3.6, 1.6, [.8, 2.4, -.6]); S.move(li, 4, 1.6, [.6, 0, 2]);
    S.cam(3.6, 2.4, [0, 2, 6], [0, 1.2, 0]);
    S.say(6.8, 'Everyone pointed the same way: home is over there!', 'Ai cũng chỉ về một hướng: nhà ở đằng kia!');
    S.do(dot, 6.9, 'point', 2.4); S.mood(dot, 6.9, 'happy'); S.face(dot, 6.8, -H);
    S.at(9.8, () => { });
  },
  // 5. Hopping and hopping, the kangaroo carried Dot all the way home.
  S => {
    bush(S, { rockFar: false }); dusk(S);
    const roo = animal(S, 'joey', -9, 2, H, 2.6), dot = S.person(DOT, 0, 0, 0, .75); roo.userData.rig.gait = 'hop';
    board(dot, roo.children[0], [0, .55, .1], 0, .3);
    S.shot([0, 2.4, 10], [-6, 1, 2]);
    S.cam(.3, 3, [-5, 2, 8], [-8, 1, 2]);
    S.help(4.9, 'Tap to hop home!', 'Chạm để nhảy về nhà nào!', tt => {
      S.move(roo, tt, 2.2, [6, 0, -2], k => k); S.mood(dot, tt, 'happy');
      S.cam(tt, 2.3, () => [roo.position.x - 2, 2.2, roo.position.z + 7], () => [roo.position.x, 1.2, roo.position.z]);
    }, [-9, 1.4, 2], 2.3);
  },
  // 6. Dot hugged her new friend and promised to always care for the animals of the bush.
  S => {
    bush(S, { rockFar: false }); S.add(Pp.mat(), 0, 0, 0); L.hut(S, -4, -3, .4);
    const dot = S.person(DOT, .4, 1.6, -.6, .75), roo = animal(S, 'joey', -1, 1.2, .6, 2.6), mom = S.person(VILLAGER('dress', '#3b6fe0', 'none', 'long'), -3, -.6, .5);
    S.shot([0, 2, 7], [0, 1, 1]);
    S.do(dot, .3, 'hug', 3); S.mood(dot, .3, 'happy'); S.cam(.3, 3, [1, 1.2, 4.6], [-.3, .8, 1.4]);
    S.say(5.4, 'Then she ran to her mum, safe at home.', 'Rồi bé chạy ùa về với mẹ, bình an ở nhà.');
    S.walk(dot, 5.4, [-2.4, .2], 1.4); S.do(dot, 7.2, 'hug', 1.6); S.do(mom, 7.2, 'hug', 1.6); S.mood(mom, 7, 'happy');
    S.cam(5.4, 2.4, [-1, 1.6, 5], [-2.4, 1, .2]);
    S.at(8.8, () => { });
  }
] };
