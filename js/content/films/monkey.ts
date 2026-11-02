// The Monkey and the Crocodile (Khỉ và Cá Sấu), from the Panchatantra: the monkey in the fruit tree by the river, sharing
// fruit with the crocodile, the ride on his back and the trick in the middle of the river, "I left my heart in the
// tree!", the jump to safety, thinking calmly. The child helps twice: sharing the fruit (page 2) and the jump (page 4).
import { L, Pp, THREE, P, mesh, PI, H, go, hop, turn, river, monkey, fruitTree, afloat } from './kit.js';

// a friendly green crocodile: a long body, a long snout, bumps along its back, a tail that swishes
const croc = () => {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  body.add(mesh([P(new THREE.CapsuleGeometry(.4, 2, 4, 10), '#4a8a3a', [0, .2, 0], [H, 0, 0], [1.2, 1, .6]), P(new THREE.BoxGeometry(.5, .25, 1.2), '#4a8a3a', [0, .15, 1.6]),
    ...[-1, 1].flatMap(s => [P(new THREE.SphereGeometry(.11, 8, 6), '#ffffff', [s * .18, .45, 1.1]), P(new THREE.SphereGeometry(.06, 6, 5), '#1a1a1a', [s * .18, .48, 1.18])]),
    ...[0, 1, 2, 3, 4].map(i => P(new THREE.ConeGeometry(.08, .18, 4), '#3a7a2a', [0, .52, .8 - i * .4])), ...[-1, 1].flatMap(s => [P(new THREE.SphereGeometry(.14, 8, 6), '#4a8a3a', [s * .5, 0, .7]), P(new THREE.SphereGeometry(.14, 8, 6), '#4a8a3a', [s * .5, 0, -.7])])]));
  const tail = new THREE.Group(); tail.position.set(0, .2, -1.3); tail.add(mesh([P(new THREE.ConeGeometry(.28, 1.4, 6), '#4a8a3a', [0, 0, -.6], [-H, 0, 0], [1, 1, .5])])); body.add(tail);
  g.userData.tick = (dt, time) => { tail.rotation.y = Math.sin(time * 2) * .3; };
  return g;
};
const bank = S => { river(S); const t = fruitTree('#ffb03a', 1.2); S.add(t, -3, -14); return t; };

export default { pages: [
  // 1. This story comes from the Panchatantra, very old tales from India. A monkey lived in a tree full of sweet fruit by a river.
  S => {
    river(S); const t = fruitTree('#ffb03a', 1.3); S.add(t, 0, -3);
    const m = monkey(); S.add(m, .4, 3.2, -2.4); m.scale.setScalar(1.2);
    S.shot([0, 3, 10], [0, 2.4, -3]);
    S.tw(.3, 6, k => { m.position.x = .4 + Math.sin(k * PI * 2) * .8; m.position.y = 3.2 + Math.abs(Math.sin(k * PI * 4)) * .3; }, k => k);
    S.cam(.3, 6, [3, 3, 6], [0, 3, -3]);
    S.say(8.4, 'He ate rose apples and mangoes all day.', 'Khỉ ăn quả mận, quả xoài cả ngày.');
    S.cam(8.4, 2.4, [1, 3.4, 2], [.4, 3.2, -2.4]);
    S.at(11.2, () => { });
  },
  // 2. Every day the monkey shared fruit with a crocodile, and they became friends.
  S => {
    river(S); const t = fruitTree('#ffb03a', 1.2, 6); S.add(t, -1, -16);
    const m = monkey(); S.add(m, -1, 0, -13.6); const c = croc(); S.add(c, 1.6, -.2, -11, -2.4);
    S.shot([3, 2.4, -4], [0, 1, -12]);
    S.cam(.3, 3, [2, 1.6, -7], [0, .6, -12]);
    S.help(5.1, 'Tap to share the fruit!', 'Chạm để chia quả cho bạn nào!', tt => {
      const f = Pp.basket(); S.add(f, -1, .4, -13.2); S.move(f, tt, .9, [1.2, .3, -11.4], undefined, 1.2);
      S.tw(tt + 1, 1, k => { c.rotation.x = -Math.sin(k * PI) * .2; }); hop(S, m, tt + .2, 2, .3);
      S.cam(tt, 1.6, [2, 1.4, -8], [0, .5, -12]);
    }, [-1, 1, -13.6], 2.3);
  },
  // 3. One day the crocodile said: "Come for a ride on my back!" But in the middle of the river he wanted to trick the monkey.
  S => {
    river(S);
    const c = afloat(S, croc(), 0, -10, 0), m = monkey(); c.children[0].add(m); m.position.set(0, .4, 0); m.scale.setScalar(.9);
    S.shot([6, 2, 0], [0, .6, -6]);
    S.move(c, .3, 6, [0, -.3, 0], k => k); S.cam(.3, 6, () => [c.position.x + 5, 2, c.position.z + 5], () => [0, .6, c.position.z]);
    S.say(7.6, 'The crocodile smiled a sneaky smile.', 'Cá sấu cười một nụ cười gian gian.');
    S.tw(7.7, 1.4, k => { c.children[0].rotation.y = Math.sin(k * PI) * .2; }); S.cam(7.6, 2.2, [1.4, 1.2, 3], [0, .6, 0]);
    S.at(10.4, () => { });
  },
  // 4. The clever monkey said: "Oh! I left my heart in the tree. Take me back to get it!" And off he jumped to safety.
  S => {
    river(S); const t = fruitTree('#ffb03a', 1.2, 6); S.add(t, -1, -14);
    const c = afloat(S, croc(), 0, -9, PI), m = monkey(); c.children[0].add(m); m.position.set(0, .4, 0); m.scale.setScalar(.9);
    S.shot([6, 2, -4], [0, 1, -10]);
    S.tw(.3, 4, k => { m.rotation.y = Math.sin(k * PI * 6) * .3; }, k => k); S.cam(.3, 3, [3, 1.6, -6], [0, .8, -9]);
    S.help(9.3, 'Tap to help the monkey jump to the tree!', 'Chạm để khỉ nhảy lên cây nào!', tt => {
      S.at(tt, () => { S.root.attach(m); }); S.move(m, tt, 1, [-1, 3.2, -13], undefined, 2.4); hop(S, m, tt + 1.2, 2, .3);
      S.cam(tt, 2, [4, 3, -4], [-1, 2.4, -12]);
    }, [0, 1, -9], 2.3);
  },
  // 5. Thinking calmly helps us when we are in trouble, and real friends are kind to each other.
  S => {
    river(S); const t = fruitTree('#ffb03a', 1.3); S.add(t, 0, -3);
    const m = monkey(); S.add(m, .4, 3.2, -2.4); m.scale.setScalar(1.2);
    S.shot([0, 3, 9], [0, 2.4, -3]);
    S.tw(.3, 3, k => { m.position.y = 3.2 + Math.abs(Math.sin(k * PI * 4)) * .3; }); S.cam(.3, 3, [2, 3, 6], [0, 3, -3]);
    S.say(5.7, 'Stay calm, think, and you will find a way.', 'Hãy bình tĩnh suy nghĩ, con sẽ tìm ra cách.');
    S.cam(5.7, 2.6, [0, 2.4, 9], [0, 2.6, -3]);
    S.at(8.4, () => { });
  }
] };
