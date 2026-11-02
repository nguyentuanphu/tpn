// The Lion and the Clever Rabbit (Sư tử và chú thỏ thông minh), from the Panchatantra: the greedy lion scares the
// forest, Rabbit walks to him very slowly, "another lion says HE is king", the deep well, the reflection and the
// splash, and peace again. The film only shows the splash (nothing worse). The child
// helps twice: Rabbit's slow walk (page 2) and looking into the well (page 5).
import { L, Pp, THREE, P, mesh, PI, H, go, hop, turn, forest, animal, lion } from './kit.js';

const well = S => S.add(mesh([P(new THREE.CylinderGeometry(1.2, 1.2, 1, 16, 1, true), '#a89880', [0, .5, 0]), P(new THREE.TorusGeometry(1.2, .12, 6, 18), '#8a8070', [0, 1, 0], [H, 0, 0]), P(new THREE.CylinderGeometry(1.1, 1.1, .02, 16), '#2a4a6a', [0, .6, 0])]), 0, 0, -1);
const roar = (S, l, t) => S.tw(t, 1, k => { l.userData.nod = -Math.sin(k * PI) * .5; l.scale.setScalar(1 + Math.sin(k * PI) * .06); });

export default { pages: [
  // 1. From the Panchatantra: a greedy lion scared all the animals of the forest.
  S => {
    forest(S);
    const l = lion(); S.add(l, 0, 0, -2); const others = [animal(S, 'bunny', -3, 2, 0, 1.4), animal(S, 'sheep', 3, 2, 0), animal(S, 'puppy', 1.4, 3, 0)];
    S.shot([0, 2, 9], [0, 1, 0]);
    roar(S, l, .4); others.forEach((a, i) => go(S, a, 1.2 + i * .1, 1.6, [a.position.x * 3, 0, 9], k => k));
    S.cam(.3, 3, [2, 1.6, 6], [0, 1.2, -1]);
    S.say(5.5, 'Roar! Everyone ran and hid.', 'Gừ! Muông thú chạy đi trốn hết.');
    roar(S, l, 5.6); S.cam(5.5, 2, [0, 1.2, 3], [0, 1.4, -2]);
    S.at(8, () => { });
  },
  // 2. Little Rabbit had a plan. He walked to the lion very, very slowly.
  S => {
    forest(S);
    const r = animal(S, 'bunny', -6, 3, H, 1.4), l = lion(); S.add(l, 4, 0, 0, -H);
    const sp = Pp.sparkle('#ffe27a'); S.add(sp, -6, 1, 3); S.show(sp, .4); S.show(sp, 1.8, false);
    S.shot([0, 2, 9], [-2, .8, 2]);
    S.tw(.4, 1.4, k => { r.userData.nod = Math.sin(k * PI * 2) * .3; }); S.cam(.3, 2.6, [-4, 1.2, 6], [-6, .6, 3]);
    S.help(5.9, 'Tap to walk slowly, slowly!', 'Chạm để đi thật chậm, thật chậm nào!', tt => {
      go(S, r, tt, 2.2, [1.6, 0, 1.4], k => k); S.tw(tt, 2.2, k => { l.userData.nod = Math.sin(k * PI * 3) * .1; });
      S.cam(tt, 2.2, [-1, 1.6, 7], [0, .8, 1.4]);
    }, [-6, .8, 3], 2.3);
  },
  // 3. "Sorry I'm late," said Rabbit. "Another lion stopped me. He says HE is king of the forest!"
  S => {
    forest(S);
    const r = animal(S, 'bunny', 1.4, 1.4, -H, 1.4), l = lion(); S.add(l, 4, 0, 0, -H);
    S.shot([2.6, 1.6, 6], [2.6, .8, .6]);
    S.tw(.3, 5, k => { r.userData.nod = Math.sin(k * PI * 10) * .15; }, k => k); S.cam(.3, 3, [1, 1, 4], [1.4, .6, 1.4]);
    roar(S, l, 5.4); S.cam(5.4, 1.6, [4.4, 1.6, 4], [4, 1.4, 0]);
    S.say(7.6, 'The lion’s mane stood up. He was so cross!', 'Bờm sư tử dựng đứng. Nó tức lắm!');
    S.tw(7.7, 1.6, k => { l.scale.setScalar(1 + Math.sin(k * PI) * .1); }); S.at(10.4, () => { });
  },
  // 4. "Show me!" roared the lion. Rabbit led him to a deep well.
  S => {
    forest(S); well(S);
    const r = animal(S, 'bunny', -6, 4, H, 1.4), l = lion(); S.add(l, -9, 0, 4, H);
    S.shot([0, 3, 10], [-2, .8, 2]);
    roar(S, l, .2); go(S, r, 1, 3, [-1.4, 0, 1.4], k => k); go(S, l, 1.4, 3, [-3, 0, 2.4], k => k);
    S.cam(.3, 4, [2, 2.4, 8], [-1, .8, 1]);
    S.say(5.5, 'Rabbit pointed: "He lives down there!"', 'Thỏ chỉ: "Nó ở dưới kia kìa!"');
    S.tw(5.6, 1.4, k => { r.userData.nod = Math.sin(k * PI) * .4; }); S.cam(5.5, 2.4, [-4, 2, 5], [-1, .6, 0]);
    S.at(8.2, () => { });
  },
  // 5. The lion looked in and saw another lion: his own reflection! He roared and jumped in to fight it. Splash!
  S => {
    forest(S); well(S);
    const l = lion(); S.add(l, -1.6, 0, 1.4, PI * .75); const r = animal(S, 'bunny', 2, 2, -H, 1.4);
    const mirror = lion(); S.add(mirror, 0, .1, -1, 0); mirror.scale.set(.6, -.6, .6); mirror.visible = false;
    S.shot([0, 3, 7], [0, .8, 0]);
    S.cam(.3, 2.6, [-1, 3, 3], [0, .6, -1]);
    S.help(8.5, 'Tap to look into the well!', 'Chạm để nhìn xuống giếng nào!', tt => {
      S.show(mirror, tt); roar(S, l, tt + .3); S.move(l, tt + 1.2, .6, [0, 1.2, -1], undefined, .8); S.show(l, tt + 1.8, false);
      const sp = Pp.sparkle('#cfeeff'); S.add(sp, 0, 1, -1); S.show(sp, tt + 1.8); S.cam(tt, 2, [0, 3.4, 5], [0, .8, -1]);
    }, [0, 1, -1], 2.3);
  },
  // 6. The forest was peaceful again. Being clever can beat being big!
  S => {
    forest(S);
    const r = animal(S, 'bunny', 0, 1.4, 0, 1.4), others = [animal(S, 'sheep', -2.6, 1.6, .6), animal(S, 'puppy', 2.6, 1.6, -.6), animal(S, 'chicken', -1.2, 3, .3, 1.4)];
    S.shot([0, 2, 8], [0, .6, 1.4]);
    hop(S, r, .3, 3, .4); others.forEach((a, i) => hop(S, a, .5 + i * .2, 2, .3));
    S.cam(.3, 3, [0, 1.2, 5.4], [0, .5, 1.6]);
    S.say(5, 'Everyone thanked the clever little rabbit.', 'Ai cũng cảm ơn chú thỏ nhỏ thông minh.');
    others.forEach((a, i) => go(S, a, 5.1, 1.2, [-1 + i, 0, 2.4])); S.cam(5, 2.4, [3, 2, 6], [0, .5, 1.8]);
    S.at(7.8, () => { });
  }
] };
