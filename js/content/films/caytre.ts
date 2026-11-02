// Cây tre trăm đốt (The Hundred-Knot Bamboo): the farmer works for the rich man, the impossible bamboo, Bụt in the
// forest, "Khắc nhập!", the rich man stuck to the bamboo, "Khắc xuất!", the wedding. The child says the magic words
// twice (pages 4 and 5).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, speak, VILLAGER, BUT, village, forest, axe, drum } from './kit.js';

const FARMER = LOOK({ style: 'shirt', color: '#8a6a4a', hat: 'nonla', hairStyle: 'short', skin: '#c89060' });
const RICH = LOOK({ style: 'tunic', color: '#7a3a8a', hat: 'silkcap', hairStyle: 'short', skin: '#e0aa80' });
const DAUGHTER = LOOK({ style: 'aodai', color: '#ff8ab0', hairStyle: 'long', skin: '#f0c098' });
// one piece of bamboo (a knot at each end)
const piece = () => mesh([P(new THREE.CylinderGeometry(.08, .08, .5, 8), '#6fb84a', [0, .25, 0]), P(new THREE.CylinderGeometry(.095, .095, .05, 8), '#4f9a3a', [0, .5, 0])]);
// a long bamboo of n pieces lying on the ground (along x)
const long = n => { const g = new THREE.Group(); for (let i = 0; i < n; i++) { const p = piece(); p.rotation.z = -H; p.position.set(i * .5, .09, 0); g.add(p); } return g; };

export default { pages: [
  // 1. A hard-working young farmer helped a rich man for three years.
  S => {
    village(S, { house: [-4, -7] });
    const f = S.person(FARMER, 14, 3, -H), rich = S.person(RICH, -3, -2, .3);
    S.shot([8, 3, 12], [12, 1, 2]);
    S.do(f, .2, 'dig', 3); S.cam(.2, 3.4, [16, 2.4, 9], [14, 1, 2]);
    S.do(rich, .4, 'point', 1.6);
    S.say(4.4, 'Every day he dug, planted and carried the rice.', 'Ngày nào anh cũng cuốc đất, cấy lúa, gánh thóc.');
    { const sack = Pp.sack(); const t = S.walk(f, 4.4, [10, 4], 2.4); S.grab(f, t, sack, [0, -.5, .2], 'armR'); S.do(f, t, 'carry', 1.4); S.walk(f, t + .2, [7, 4], 2.4); }
    S.cam(4.4, 3, [6, 2.6, 11], [7, 1, 3]);
    S.at(7.6, () => { });
  },
  // 2. "Bring me a bamboo with one hundred knots, and you can marry my daughter." But no bamboo is that long!
  S => {
    village(S, { house: [0, -6] });
    const f = S.person(FARMER, 1.6, 2, -.6), rich = S.person(RICH, -1.4, 1.6, .6), d = S.person(DAUGHTER, -.4, -2.6, 0);
    S.shot([0, 2.4, 9], [0, 1.4, 1]);
    speak(S, rich, .4, 3.4); S.mood(rich, .4, 'happy'); S.do(d, .6, 'wave', 1.4); S.mood(d, .6, 'smile');
    S.cam(.3, 3.4, [-1.6, 2, 5.6], [-.6, 1.5, 1.4]);
    S.mood(f, 4.2, 'o'); S.do(f, 4.4, 'surprised', 1.6); S.cam(4.2, 2.4, [2.6, 2, 5], [1.4, 1.5, 1.8]);
    S.mood(f, 6.6, 'smile'); S.do(f, 6.8, 'bow', 1);
    S.say(8.7, 'The farmer took his axe and went into the forest.', 'Anh nông dân vác rìu vào rừng.');
    { const a = axe(); S.grab(f, 8.7, a, [0, -.5, .1]); S.walk(f, 9, [8, -2], 2.4); S.cam(8.7, 2.6, [4, 3, 9], [5, 1.2, 0]); }
    S.at(11.8, () => { });
  },
  // 3. The farmer sat in the forest and cried. Then Bụt, a kind old fairy man, appeared.
  S => {
    forest(S);
    const f = S.person(FARMER, 0, 1, 0), but = S.person(BUT, 1.8, -.4, -.6);
    but.o.scale.setScalar(.01);
    const short = [0, 1, 2].map(i => { const p = piece(); p.rotation.z = -H; return S.add(p, -1.6 + i * .6, .09, 2.2); });
    S.shot([0, 2.2, 7], [0, 1, 1]);
    S.do(f, .2, 'sitground', 5); S.mood(f, .2, 'sad'); S.cam(.2, 2.6, [0, 1.6, 5], [0, .8, 1]);
    const sp = Pp.sparkle('#ffe27a'); S.add(sp, 1.8, .2, -.4); S.show(sp, 2.6);
    S.scale(but.o, 3, 1.2, .01, 1); S.mood(but, 3.2, 'happy'); S.mood(f, 4, 'o');
    S.cam(2.8, 1.6, [1, 2, 5.4], [1, 1.2, .2]);
    S.say(5.1, 'Bụt asked kindly: "Why are you crying?"', 'Bụt hiền từ hỏi: "Vì sao con khóc?"');
    speak(S, but, 5.2, 2.2); S.do(f, 7.2, 'idle'); S.face(f, 7.2, [1.8, -.4]);
    S.at(7.9, () => { });
  },
  // 4. Bụt said: "Cut one hundred pieces and say: Khắc nhập! Join!" The pieces jumped together into one long bamboo!
  S => {
    forest(S);
    const f = S.person(FARMER, -1.6, 2, .4), but = S.person(BUT, 2.4, .4, -.6);
    const pieces = []; for (let i = 0; i < 24; i++) { const p = piece(); p.position.set(-2.4 + (i % 8) * .7, 0, 2.8 + (i >> 3) * .5); p.rotation.set(0, i * .7, H); S.root.add(p); pieces.push(p); }
    S.shot([0, 3, 8], [0, .6, 2.6]);
    speak(S, but, .3, 3.2); S.do(f, 3.8, 'kneel', 2.4); S.cam(.3, 3, [-1, 2.4, 6.6], [.4, .6, 2.6]);
    const a = axe(); S.grab(f, 0, a, [0, -.5, .1]);
    S.help(8.9, 'Tap and say: Khắc nhập!', 'Chạm và đọc: Khắc nhập!', tt => {
      pieces.forEach((p, i) => { S.move(p, tt + i * .05, .5, [-3 + i * .5, .09, 4.2], undefined, .8); S.tw(tt + i * .05, .5, k => { p.rotation.set(0, 0, -H); }); });
      const sp = Pp.sparkle('#ffe27a'); S.add(sp, 2.6, .2, 4.2); S.show(sp, tt + .4);
      S.do(f, tt + 1.4, 'cheer', 1.2); S.mood(f, tt + 1.4, 'happy');
      S.cam(tt, 1.6, [3, 4.4, 10], [3, .2, 4]);
    }, [0, .2, 3], 2.3);
  },
  // 5. When the rich man touched it, "Khắc nhập!" stuck him to the bamboo! "Khắc xuất!" let him go.
  S => {
    village(S, { house: [0, -7] });
    const bam = long(20); S.add(bam, -5, 0, 2);
    const f = S.person(FARMER, -6, 3, .5), rich = S.person(RICH, 2, -1, PI);
    S.shot([0, 3, 10], [0, 1, 2]);
    let t = S.walk(rich, .3, [0, 1.4]); S.do(rich, t, 'kneel', 1); S.mood(rich, t, 'o');
    S.cam(.3, 2.6, [1.6, 2.2, 6], [0, .8, 1.8]);
    S.do(rich, t + 1, 'pull', 3.4); S.mood(rich, t + 1, 'sad');
    S.tw(t + 1, 3.4, k => { rich.o.position.x = Math.sin(k * 30) * .15; bam.rotation.y = Math.sin(k * 30) * .02; }, k => k);
    S.do(f, 2, 'point', 2); S.mood(f, 2, 'happy');
    S.help(7.2, 'Tap and say: Khắc xuất!', 'Chạm và đọc: Khắc xuất!', tt => {
      S.do(rich, tt, 'surprised', 1); S.move(rich.o, tt, .6, [0, 0, 2.6], undefined, .5); S.mood(rich, tt + .6, 'smile');
      S.do(rich, tt + 1.2, 'bow', 1); S.cam(tt, 1.6, [-2, 2.4, 7], [-1, 1, 2]);
    }, [0, .6, 1.8], 2.3);
  },
  // 6. The rich man kept his promise, and the honest farmer had a happy wedding.
  S => {
    village(S, { house: [0, -6] }); L.lantern(S, -2.4, 3, -3.2); L.lantern(S, 2.4, 3, -3.2, '#ffd23f');
    const f = S.person(FARMER, -.7, 1.4, 0), d = S.person(DAUGHTER, .7, 1.4, 0), rich = S.person(RICH, 3, 3, -.8);
    const guests = [VILLAGER('aodai', '#e86a8a'), VILLAGER('shirt', '#3b6fe0', 'nonla', 'short'), VILLAGER('aodai', '#43c463')].map((l, i) => S.person(l, -4 + i * 1.6, 4.6, PI));
    const dr = drum(); S.add(dr, -3.6, 0, 2.6);
    S.shot([0, 2.2, 8], [0, 1.4, 1.4]);
    S.mood(f, 0, 'happy'); S.mood(d, 0, 'happy'); S.do(f, .4, 'bow', 1.2); S.do(d, .4, 'bow', 1.2);
    guests.forEach((g, i) => { S.face(g, .2, [0, 1.4]); S.do(g, .8 + i * .2, 'cheer', 2); S.mood(g, .8, 'happy'); });
    S.do(rich, 1.6, 'wave', 2); S.mood(rich, 1.6, 'smile');
    S.cam(.3, 3.6, [0, 2.8, 10], [0, 1.2, 2]);
    S.say(5.3, 'Everyone came to the wedding, and they danced all day.', 'Cả làng đến dự đám cưới, nhảy múa cả ngày.');
    [f, d, ...guests].forEach((a, i) => S.do(a, 5.4 + i * .1, 'dance', 3));
    S.cam(5.3, 3, [3, 2.4, 7], [0, 1.2, 2]);
    S.at(8.6, () => { });
  }
] };
