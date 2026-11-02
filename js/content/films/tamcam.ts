// Tấm Cám: Tấm works while her stepmother and Cám watch, Bụt gives her Bống the fish, the birds sort the rice and
// Bụt gives her a dress, the lost slipper and the prince on his elephant, the slipper fits, the golden thị fruit. The
// child helps twice: calling Bống (page 2) and trying the slipper on Tấm (page 5).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, speak, hop, go, VILLAGER, ELDER, BUT, village, palace, animal, board, carp, fruitTree, basket } from './kit.js';

const TAM = LOOK({ style: 'shirt', color: '#a88a6a', hairStyle: 'long', skin: '#f0c098' });
const TAM_FINE = LOOK({ style: 'aodai', color: '#ffd23f', hairStyle: 'long', hat: 'none', skin: '#f0c098' });
const CAM = LOOK({ style: 'aodai', color: '#c84a8a', hairStyle: 'buns', skin: '#e8b890' });
const STEP = LOOK({ style: 'aodai', color: '#5a3a5a', hairStyle: 'buns', skin: '#e0aa80' });
const PRINCE = LOOK({ style: 'tunic', color: '#e8b62a', hat: 'crown', skin: '#e0aa80' });
const slipper = () => mesh([P(new THREE.SphereGeometry(.12, 10, 8), '#e8332a', [0, .05, 0], [0, 0, 0], [.7, .45, 1.5]), P(new THREE.SphereGeometry(.04, 6, 5), '#ffd23f', [0, .1, .1])]);
const pondAt = (S, x, z) => S.add(mesh([P(new THREE.CylinderGeometry(2, 2, .06, 24), '#5ab0d0', [0, .03, 0]), P(new THREE.CylinderGeometry(2.3, 2.3, .03, 24), '#a88a5a', [0, .01, 0])]), x, 0, z);

export default { pages: [
  // 1. Tấm was a kind girl who worked hard all day, but her stepmother and stepsister Cám were unkind to her.
  S => {
    village(S, { house: [0, -6] });
    const tam = S.person(TAM, 2, 2, -.4), step = S.person(STEP, -2.4, -2.4, .4), cam = S.person(CAM, -1.2, -2.6, .2);
    S.do(step, 0, 'sitground'); S.do(cam, 0, 'sitground'); S.mood(step, 0, 'sad'); S.mood(cam, 0, 'happy');
    S.shot([3, 2.4, 9], [0, 1.2, 0]);
    S.do(tam, .3, 'swing', 2.6); S.mood(tam, .3, 'smile');
    S.do(step, 2.2, 'point', 1.6); speak(S, step, 2.2, 1.6);
    S.cam(.3, 3, [-1.6, 2, 6.4], [-1, 1, -1]);
    { const b = Pp.basket(); S.grab(tam, 4, b, [0, -.5, .2]); const t = S.walk(tam, 4.2, [5, 1]); S.do(tam, t, 'carry', 2); }
    S.cam(4, 3, [5, 2.6, 8], [3, 1, 1]);
    S.say(7.2, 'Tấm never got cross. She sang softly as she worked.', 'Tấm không bao giờ giận. Cô vừa làm vừa hát khe khẽ.');
    S.mood(tam, 7.2, 'happy'); S.do(tam, 7.4, 'water', 2.4); S.cam(7.2, 2.4, [6.6, 1.8, 4.6], [5, 1.2, 1]);
    S.at(10.4, () => { });
  },
  // 2. When Tấm cried, kind Bụt appeared and gave her a little fish called Bống to be her friend.
  S => {
    village(S, { house: [-6, -8], paddy: false }); pondAt(S, 0, 1);
    const tam = S.person(TAM, -1.2, 3.6, PI * .9), but = S.person(BUT, 2.4, 3.2, -1.2); but.o.scale.setScalar(.01);
    const fish = carp('#ffcf33', '#ffe27a'); fish.scale.setScalar(.6); S.add(fish, 0, -.6, 1);
    S.shot([0, 2.4, 9], [0, .8, 2]);
    S.do(tam, .2, 'sitground', 3.6); S.mood(tam, .2, 'sad');
    const sp = Pp.sparkle('#ffe27a'); S.add(sp, 2.4, .2, 3.2); S.show(sp, 1.8);
    S.scale(but.o, 2.2, 1.1, .01, 1); S.mood(but, 2.4, 'happy'); speak(S, but, 3.4, 2); S.do(but, 5.4, 'point', 1.4);
    S.mood(tam, 4, 'o'); S.cam(2, 3, [3, 2, 7], [1, 1, 2.4]);
    S.help(7, 'Tap to call Bống the fish!', 'Chạm để gọi cá Bống nào!', tt => {
      S.move(fish, tt, .8, [0, .2, 1.6], undefined, .9); S.tw(tt + .8, 1.4, k => { fish.position.y = .05 + Math.sin(k * PI * 3) * .05; fish.rotation.y = k * PI * 2; });
      S.do(tam, tt + .4, 'kneel', 1.6); S.mood(tam, tt + .4, 'happy');
      S.cam(tt, 1.6, [0, 1.6, 5], [0, .4, 1.8]);
    }, [0, .2, 1], 2.3);
  },
  // 3. Before the king's festival, little birds helped Tấm sort the rice, and Bụt gave her a beautiful dress and slippers.
  S => {
    village(S, { house: [0, -6], paddy: false });
    const tam = S.person(TAM, 0, 2, 0), but = S.person(BUT, 2.6, .8, -.8);
    const fine = S.person(TAM_FINE, 0, 2, 0); fine.o.visible = false;
    const mat = Pp.mat(); S.add(mat, 0, 0, 3.4, H);
    const birds = [0, 1, 2, 3].map(i => { const b = Pp.bird(['#8a6a4a', '#a8885a', '#6a5a4a', '#9a7a5a'][i]); return S.add(b, -10 + i, 4 + i * .3, -4); });
    S.shot([0, 2.6, 8], [0, .8, 2.6]);
    birds.forEach((b, i) => { S.move(b, .2 + i * .25, 2.4, [-.6 + i * .4, 0, 3.2 + (i % 2) * .3]); S.at(2.6 + i * .25, () => { b.userData.flap = .1; }); S.tw(2.8, 2.4, k => { b.rotation.x = Math.max(0, Math.sin(k * 30 + i)) * .5; }); });
    S.do(tam, .4, 'kneel', 4); S.mood(tam, 2.6, 'happy'); S.cam(.2, 3, [1.6, 1.6, 6], [0, .4, 3.2]);
    const sp = Pp.sparkle('#ffe27a'); S.add(sp, 0, .4, 2);
    speak(S, but, 4.6, 1.4); S.show(sp, 5.4);
    S.at(5.8, () => { tam.o.visible = false; fine.o.visible = true; }); S.mood(fine, 5.8, 'happy'); S.do(fine, 6, 'dance', 2.6);
    S.cam(5.2, 1.4, [0, 1.8, 5.6], [0, 1.2, 2]);
    S.say(6.7, 'Tấm thanked the birds and hurried to the festival.', 'Tấm cảm ơn đàn chim rồi vội đi trẩy hội.');
    birds.forEach((b, i) => { S.at(7 + i * .2, () => { b.userData.flap = 1; b.rotation.x = 0; }); S.move(b, 7 + i * .2, 2.6, [8 + i, 6 + i, -8]); });
    S.at(9.8, () => { });
  },
  // 4. On the way, Tấm dropped a slipper. The prince found it and said: "I will marry the girl whose foot fits!"
  S => {
    village(S, { house: null });
    const tam = S.person(TAM_FINE, -3, 9, H), sl = slipper(); S.add(sl, 0, 0, 9); sl.visible = false;
    const ele = animal(S, 'elephant', 9, 7, -H, 1.5), prince = S.person(PRINCE, 0, 0, 0);
    board(prince, ele.children[0], [0, 1.65, .1], 0, .65);
    S.shot([0, 2.6, 16], [0, 1, 9]);
    S.walk(tam, .2, [4, 9], 1.6); S.show(sl, 2); S.cam(.2, 3, [2, 2, 14], [1, .6, 9]);
    S.move(ele, 3, 3, [1.4, 0, 7.6]);
    S.cam(3, 2.8, [-3, 4.2, 17], [1, 2.2, 8]);
    S.mood(prince, 6, 'o'); S.at(6.6, () => { ele.userData.nod = .4; });
    S.say(8.3, 'He held up the little slipper for everyone to see.', 'Hoàng tử giơ chiếc hài nhỏ cho mọi người cùng xem.');
    S.at(8.3, () => { prince.A.armR.add(sl); sl.position.set(0, -.5, .1); });
    S.do(prince, 8.3, 'throw', 2.4); S.mood(prince, 8.3, 'happy'); S.cam(8.2, 2, [3.6, 3.4, 11], [1.4, 2.4, 7.6]);
    S.at(11.2, () => { });
  },
  // 5. Many girls tried, but only Tấm's foot fitted. She became a princess.
  S => {
    palace(S);
    const prince = S.person(PRINCE, 0, -1.6, 0), cam = S.person(CAM, -2, 1, .4), tam = S.person(TAM_FINE, 2, 1.4, -.4), girl = S.person(VILLAGER('aodai', '#43c463', 'none', 'long'), -3.4, 2.2, .6);
    const sl = slipper(); S.add(sl, 0, 0, .6);
    S.shot([0, 2.4, 8], [0, 1, 0]);
    S.walk(girl, .3, [-.6, 1]); S.do(girl, 1.6, 'kneel', 1.2); S.mood(girl, 2.8, 'sad'); S.walk(girl, 3, [-3.6, 2.6]);
    S.walk(cam, 3.2, [-.5, 1.1]); S.do(cam, 4.2, 'kneel', 1.4); S.mood(cam, 5.6, 'sad'); S.do(cam, 5.8, 'sad', 1.4);
    S.cam(.3, 3, [-1.6, 1.6, 4.6], [-.4, .6, .6]);
    S.help(7, 'Tap to try the slipper on Tấm!', 'Chạm để Tấm thử hài nào!', tt => {
      S.walk(cam, tt, [-2.4, 1.6]); S.walk(tam, tt, [.4, 1.1]); S.do(tam, tt + 1.2, 'kneel', .8);
      const sp = Pp.sparkle('#ffe27a'); S.add(sp, .4, 0, 1); S.show(sp, tt + 1.6);
      S.mood(tam, tt + 1.8, 'happy'); S.mood(prince, tt + 1.8, 'happy'); S.do(prince, tt + 1.8, 'cheer', .4);
      S.cam(tt, 1.6, [2, 1.6, 4.6], [.3, .6, .8]);
    }, [0, .2, .6], 2.3);
  },
  // 6. Even when things went wrong, Tấm's kindness came back again and again, like a sweet golden thị fruit.
  S => {
    village(S, { house: [-5, -7] });
    const tree = fruitTree('#ffcf33', 1, 1); S.add(tree, 2, -1);
    const old = S.person(ELDER('aodai', '#8a6a4a'), -.6, 2.2, .3), tam = S.person(TAM_FINE, 2.8, 1.6, -.6); tam.o.scale.setScalar(.01);
    const b = basket(); S.add(b, .4, 0, 2.6);
    const fruit = tree.userData.fruits[0]; fruit.scale.setScalar(2.4);
    const sp = Pp.sparkle('#ffe27a'); S.add(sp, 2.8, .4, 1.6);
    S.shot([0, 3, 9], [1.4, 1.6, 0]);
    S.do(old, .3, 'point', 1.8); S.mood(old, .3, 'happy');
    S.drop(fruit, 2.2); S.move(fruit, 2.21, 1, [.4, .35, 2.6], k => k * k);
    S.do(old, 3.4, 'kneel', 1.6); S.cam(2, 2.6, [1, 2, 6], [.4, .6, 2.4]);
    S.show(sp, 5.4); S.scale(tam.o, 5.6, 1.2, .01, 1); S.mood(tam, 5.8, 'happy');
    S.cam(5.4, 2, [2, 2, 7], [1.4, 1.2, 1.8]);
    S.say(8.6, 'Be kind like Tấm, and good things will come back to you.', 'Hãy hiền lành như Tấm, điều tốt sẽ đến với con.');
    S.walk(tam, 8.6, [.4, 1.8]); S.do(tam, 9.8, 'hug', 2); S.do(old, 9.8, 'hug', 2); S.mood(old, 9.8, 'happy');
    S.cam(8.6, 2.6, [-1.6, 1.8, 5], [0, 1.2, 1.9]);
    S.at(11.8, () => { });
  }
] };
