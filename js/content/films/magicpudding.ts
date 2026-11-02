// The Magic Pudding (Chiếc bánh pudding thần kỳ): Bunyip Bluegum the koala sets off, meets a sailor and a penguin with
// Albert the grumpy magic pudding who never runs out, the possum and wombat pudding thieves, the friends get Albert
// back, and a cosy house where everyone shares. The child helps twice: a slice of pudding (page 3) and catching the
// thieves (page 5).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, go, hop, turn, speak, bush, animal, pudding, jackal } from './kit.js';

const SAILOR = LOOK({ style: 'shirt', color: '#2f4a8a', hat: 'cap', hairStyle: 'short', hair: '#8a8a8a', skin: '#e0aa80' });
const stick = () => mesh([P(new THREE.CylinderGeometry(.025, .025, .9, 5), '#8a5a32', [0, -.1, .1])]);
// the thieves: a grey possum with big eyes and a round brown wombat
const possum = () => { const p = jackal('#8a8a96'); p.scale.setScalar(.8); return p; };
const wombat = () => { const w = jackal('#7a5a3a'); w.scale.set(1, .8, .9); return w; };
const friends = (S, x = 0) => {
  const ko = animal(S, 'koala', x - 1.4, 1.6, .4, 1.6); { const st = stick(); ko.children[0].add(st); st.position.set(.3, .4, .2); }
  const sa = S.person(SAILOR, x + .2, 1, 0), pe = animal(S, 'penguin', x + 1.6, 1.8, -.4, 1.8);
  const al = pudding(); S.add(al, x + .2, 0, 2.4);
  return { ko, sa, pe, al };
};

export default { pages: [
  // 1. Bunyip Bluegum, a koala, set off to see the world with his walking stick.
  S => {
    bush(S); L.hut(S, -8, -3, .6);
    const ko = animal(S, 'koala', -6, 2, H, 1.6); { const st = stick(); ko.children[0].add(st); st.position.set(.3, .4, .2); }
    S.shot([0, 2, 10], [-4, 1, 2]);
    go(S, ko, .4, 4.4, [2, 0, 2]); S.cam(.3, 4.6, [0, 1.6, 7], [0, .8, 2]);
    S.say(5.4, 'Off he went, whistling a happy tune.', 'Chú vừa đi vừa huýt sáo vui vẻ.');
    go(S, ko, 5.4, 2.4, [6, 0, 0]); S.cam(5.4, 2.4, [6, 1.4, 6], [5, .8, 0]);
    S.at(8.2, () => { });
  },
  // 2. He met a sailor and a penguin who had a magic pudding called Albert.
  S => {
    bush(S);
    const { ko, sa, pe, al } = friends(S); ko.position.x = -7;
    S.shot([0, 2, 8], [0, .8, 1.6]);
    go(S, ko, .2, 2.4, [-1.4, 0, 1.6]); S.do(sa, 2.4, 'wave', 1.4); S.mood(sa, 2.4, 'happy'); hop(S, pe, 2.6, 2, .2);
    S.cam(.3, 3, [0, 1.4, 5.4], [0, .6, 2]);
    S.say(5.4, 'Albert opened one eye and said: "Hmph!"', 'Albert hé một mắt, nói: "Hừm!"');
    S.cam(5.4, 2, [.2, .9, 4], [.2, .4, 2.4]);
    S.at(8.4, () => { });
  },
  // 3. Albert was very grumpy, but you could eat him again and again, and he never ran out!
  S => {
    bush(S);
    const { ko, sa, pe, al } = friends(S);
    const plates = [ko, sa, pe].map((a, i) => S.add(Pp.bowl(false), -1 + i, 0, 3.4));
    S.shot([0, 1.6, 6], [0, .5, 2.4]);
    S.tw(.3, 2.4, k => { al.rotation.y = Math.sin(k * PI * 4) * .2; }); S.cam(.3, 3, [.2, 1, 4.2], [.2, .4, 2.4]);
    S.help(5.9, 'Tap to cut a slice of pudding!', 'Chạm để cắt một miếng bánh nào!', tt => {
      plates.forEach((p, i) => { const sl = mesh([P(new THREE.BoxGeometry(.2, .12, .2), '#9a5a2a', [0, .2, 0])]); sl.visible = false; S.add(sl, p.position.x, 0, p.position.z); S.show(sl, tt + i * .3); });
      S.scale(al, tt, .3, 1, .9); S.scale(al, tt + .3, .4, .9, 1); const sp = Pp.sparkle('#ffe27a'); S.add(sp, .2, .4, 2.4); S.show(sp, tt + .6);
      S.do(sa, tt + .8, 'eat', 1.4); hop(S, pe, tt + .8, 2, .2);
      S.cam(tt, 1.6, [0, 1.4, 5], [0, .4, 3]);
    }, [.2, .5, 2.4], 2.3);
  },
  // 4. Two sneaky pudding thieves, a possum and a wombat, kept trying to steal him.
  S => {
    bush(S);
    const { ko, sa, pe, al } = friends(S); S.do(sa, 0, 'sitground');
    const po = possum(), wo = wombat(); S.add(po, -6, 0, 4, H); S.add(wo, -6.6, 0, 5, H);
    S.shot([0, 2, 9], [-2, .6, 3]);
    go(S, po, .4, 3, [-.6, 0, 3]); go(S, wo, .6, 3, [-1, 0, 3.6]); S.cam(.3, 3.4, [-3, 1.4, 7], [-2, .5, 3]);
    S.at(3.6, () => { po.add(al); al.position.set(0, .6, 0); al.scale.setScalar(.8); });
    S.say(6.6, 'They grabbed Albert and tiptoed away!', 'Chúng chộp lấy Albert rồi rón rén chuồn đi!');
    go(S, po, 7, 2.4, [-8, 0, 6]); go(S, wo, 7, 2.4, [-8.6, 0, 7]); S.cam(7, 2.4, [-4, 1.6, 9], [-6, .5, 5]);
    S.at(9.8, () => { });
  },
  // 5. But the three friends always got Albert back.
  S => {
    bush(S);
    const ko = animal(S, 'koala', 3, 1, -H, 1.6), sa = S.person(SAILOR, 4, 2, -H), pe = animal(S, 'penguin', 3.6, 3, -H, 1.8);
    const po = possum(), wo = wombat(), al = pudding(); S.add(po, -3, 0, 2, -H); S.add(wo, -3.6, 0, 3, -H); po.add(al); al.position.set(0, .6, 0); al.scale.setScalar(.8);
    S.shot([0, 2.4, 9], [0, .8, 2]);
    S.cam(.3, 3, [0, 1.6, 7], [0, .6, 2]);
    S.help(3.8, 'Tap to get Albert back!', 'Chạm để giành lại Albert nào!', tt => {
      go(S, ko, tt, .8, [-1.6, 0, 1.6]); S.walk(sa, tt, [-1.6, 2.6], 3); go(S, pe, tt, .8, [-1.6, 0, 3.4]);
      S.at(tt + .9, () => { S.root.attach(al); }); S.move(al, tt + .9, .6, [-1, 0, 2.4], undefined, .6); al.scale.setScalar(.8);
      go(S, po, tt + 1, 1.2, [-9, 0, 2]); go(S, wo, tt + 1, 1.2, [-9.6, 0, 3]);
      S.cam(tt, 2, [0, 2, 7], [-1.4, .5, 2.4]);
    }, [-3, 1, 2], 2.3);
  },
  // 6. At last they built a cosy house with a garden, and shared the pudding with everyone.
  S => {
    bush(S); L.hut(S, 0, -3); L.blossom(S, -3, -2); L.blossom(S, 3, -2.4);
    const { ko, sa, pe, al } = friends(S);
    const guests = [animal(S, 'joey', -3.4, 3.4, .6, 1.4), animal(S, 'emu', 3.6, 3.6, -.6, 1), animal(S, 'bunny', 1.4, 4, PI, 1.4)];
    S.shot([0, 2.6, 9], [0, 1, 1]);
    S.do(sa, .3, 'cheer', 2); hop(S, pe, .4, 3, .2); S.cam(.3, 3.6, [0, 1.8, 7], [0, .8, 2]);
    S.say(5.7, 'There was always enough for everybody.', 'Lúc nào cũng có đủ bánh cho mọi người.');
    guests.forEach((g, i) => go(S, g, 5.7 + i * .2, 1.6, [-1.2 + i * 1.2, 0, 3.4])); S.cam(5.7, 2.4, [3, 2.4, 7], [0, .6, 2.6]);
    S.at(8.6, () => { });
  }
] };
