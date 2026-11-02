// The Blue Jackal (Con chó rừng xanh), from the Panchatantra: the hungry jackal runs into a village at night, the dogs
// chase him and he falls into the blue dye, "I am your king!", the howl at the moon gives him away, everyone knows,
// be yourself. The child helps twice: the splash into the dye (page 2) and the howl (page 4).
import { L, Pp, THREE, P, mesh, PI, H, go, hop, turn, indiaVillage, forest, night, animal, jackal, lion, moonDisc } from './kit.js';

const vat = S => S.add(mesh([P(new THREE.CylinderGeometry(1, .9, 1, 16, 1, true), '#8a6a4a', [0, .5, 0]), P(new THREE.CylinderGeometry(.96, .96, .02, 16), '#2a5ac8', [0, .85, 0])]), 0, 0, 0);

export default { pages: [
  // 1. From the Panchatantra: a hungry jackal ran into a village at night.
  S => {
    indiaVillage(S, { well: false }); S.sky('#141a44', '#34406e'); S.light(.45, .55); moonDisc(S, 20, 26, -70, 5);
    const j = jackal(); S.add(j, -10, 0, 3, H);
    S.shot([0, 2, 9], [-2, .8, 2]);
    go(S, j, .3, 3, [0, 0, 2], k => k); S.cam(.3, 3, [2, 1.4, 6], [-2, .6, 2]);
    S.say(5.1, 'Sniff, sniff! Was there any food?', 'Hít hít! Có gì ăn không nhỉ?');
    S.tw(5.2, 2, k => { j.userData.nod = Math.max(0, Math.sin(k * PI * 4)) * .5; }); S.cam(5.1, 2.2, [1, .8, 4], [0, .4, 2]);
    S.at(7.8, () => { });
  },
  // 2. The dogs chased him, and he fell into a big pot of blue dye. Splash! He came out bright blue.
  S => {
    indiaVillage(S, { well: false }); S.sky('#141a44', '#34406e'); S.light(.45, .55); vat(S);
    const j = jackal(); S.add(j, -6, 0, 3, H); const dogs = [animal(S, 'puppy', -10, 3, H), animal(S, 'puppy', -11, 4, H)];
    S.shot([0, 2.4, 9], [-1, .8, 1]);
    go(S, j, .2, 2.6, [-1.6, 0, .8], k => k); dogs.forEach((d, i) => go(S, d, .5 + i * .2, 2.8, [-4 - i, 0, 2 + i], k => k));
    S.cam(.3, 3, [-2, 2, 8], [-2, .6, 1.6]);
    S.help(7.1, 'Tap for the big splash!', 'Chạm để nghe "tõm" nào!', tt => {
      S.move(j, tt, .5, [0, .4, 0], undefined, .8); S.show(j, tt + .5, false);
      const blue = jackal('#2a5ac8'); blue.visible = false; S.add(blue, 0, .4, 0, H); S.show(blue, tt + 1);
      S.move(blue, tt + 1, .6, [1.6, 0, 1.6], undefined, .8); const sp = Pp.sparkle('#3cb0e8'); S.add(sp, 0, .9, 0); S.show(sp, tt + .5);
      dogs.forEach((d, i) => go(S, d, tt + 1.2, 1, [-12, 0, 3 + i], k => k)); S.cam(tt, 2, [1, 2, 6], [0, .6, .6]);
    }, [0, 1, 0], 2.3);
  },
  // 3. Back in the forest, the animals had never seen a blue animal. "I am your king!" said the jackal.
  S => {
    forest(S);
    const j = jackal('#2a5ac8'); S.add(j, 0, 0, 0); const l = lion(); S.add(l, -3, 0, 3, PI * .8); const el = animal(S, 'elephant', 3.4, 2.6, -PI * .8, 1.2), b = animal(S, 'bunny', 1, 4, PI, 1.4);
    S.shot([0, 2.4, 9], [0, 1, 1]);
    S.tw(.3, 2, k => { [l, el, b].forEach(a => { a.userData.nod = Math.sin(k * PI) * .3; }); }); S.cam(.3, 3, [0, 1.6, 6], [0, .8, 0]);
    S.tw(3.6, 2, k => { j.userData.nod = -Math.sin(k * PI) * .4; j.scale.setScalar(1 + Math.sin(k * PI) * .1); });
    S.say(7.6, 'All the animals bowed to the blue king.', 'Muông thú đều cúi chào vua xanh.');
    S.tw(7.7, 1.6, k => { [l, el, b].forEach(a => { a.userData.nod = Math.sin(k * PI) * .5; }); }); S.cam(7.6, 2.4, [3, 2.4, 7], [0, .8, 1]);
    S.at(10.4, () => { });
  },
  // 4. But one night, the other jackals howled at the moon. He could not help it: "Owooo!" he howled too.
  S => {
    night(S, { ground: '#3a5a3a' }); L.banyan(S, -6, -6, .8);
    const j = jackal('#2a5ac8'); S.add(j, 0, 0, 1); const pack = [jackal(), jackal()]; pack.forEach((p, i) => S.add(p, -3 + i * 6, 0, -4, i ? -.4 : .4));
    S.shot([0, 2, 9], [0, 2, -4]);
    pack.forEach((p, i) => S.tw(.4 + i * .3, 2.4, k => { p.userData.nod = -Math.sin(k * PI) * .9; })); S.cam(.3, 3, [0, 1.6, 7], [0, 3, -10]);
    S.help(6.7, 'Tap: what does the blue jackal do?', 'Chạm xem chó rừng xanh làm gì nào?', tt => {
      S.tw(tt, 2, k => { j.userData.nod = -Math.sin(k * PI) * .9; }); S.cam(tt, 2, [1.6, 1, 4], [0, 1, 1]);
    }, [0, 1, 1], 2.3);
  },
  // 5. Everyone knew he was just a jackal pretending.
  S => {
    forest(S);
    const j = jackal('#2a5ac8'); S.add(j, 0, 0, 0); const l = lion(); S.add(l, -3, 0, 3, PI * .8); const el = animal(S, 'elephant', 3.4, 2.6, -PI * .8, 1.2);
    S.shot([0, 2.4, 8], [0, 1, 1]);
    S.tw(.3, 2, k => { l.userData.nod = -Math.sin(k * PI) * .3; el.userData.nod = -Math.sin(k * PI) * .3; }); S.cam(.3, 2.6, [0, 1.6, 6], [0, .8, 0]);
    S.say(3.9, 'Off ran the blue jackal, into the trees.', 'Chó rừng xanh vội chạy biến vào rừng.');
    go(S, j, 4, 2, [8, 0, -8], k => k); S.cam(4, 2.4, [-2, 2, 7], [3, .6, -3]);
    S.at(6.8, () => { });
  },
  // 6. Be yourself: pretending never lasts.
  S => {
    forest(S);
    const j = jackal(); S.add(j, 0, 0, 1.4); const pack = [jackal(), jackal()]; pack.forEach((p, i) => S.add(p, -1.6 + i * 3.2, 0, 2, i ? -.4 : .4));
    S.shot([0, 1.6, 6], [0, .6, 1.6]);
    hop(S, j, .3, 2, .3); pack.forEach((p, i) => hop(S, p, .5 + i * .2, 2, .3)); S.cam(.3, 2.6, [0, 1.2, 5], [0, .5, 1.6]);
    S.say(4, 'Being you is the best thing to be!', 'Là chính mình là điều tuyệt nhất!');
    S.cam(4, 2.4, [2.6, 1.6, 5], [0, .5, 1.6]);
    S.at(6.6, () => { });
  }
] };
