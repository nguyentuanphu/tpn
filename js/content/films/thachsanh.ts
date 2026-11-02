// Thạch Sanh: the woodcutter under the banyan, the giant snake and the golden bow, the princess saved from the giant
// eagle, the magic lute that calms an army, the pot of rice that never runs out, the wedding. The child helps twice:
// being brave with the snake (page 2) and filling every bowl (page 5).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, speak, go, VILLAGER, forest, palace, serpent, slither, axe, lute, bird } from './kit.js';

const SANH = LOOK({ style: 'shirt', color: '#8a6a4a', hairStyle: 'short', skin: '#c89060' });
const PRINCESS = LOOK({ style: 'aodai', color: '#ffb0d0', hat: 'crown', hairStyle: 'long', skin: '#f0c098' });
const SOLDIER = c => LOOK({ style: 'tunic', color: c, hat: 'silkcap', skin: '#d8a070' });
const bow = () => mesh([P(new THREE.TorusGeometry(.45, .03, 6, 16, PI), '#ffcf33', [0, 0, 0], [0, 0, H]), P(new THREE.CylinderGeometry(.006, .006, .9, 4), '#fff8d0', [0, 0, 0])]);
const logs = () => mesh([0, 1, 2].map(i => P(new THREE.CylinderGeometry(.1, .1, .9, 7), '#8a5a32', [0, .1 + i * .18, (i - 1) * .05], [0, 0, H])));
const snake = S => serpent(S, { n: 20, r: .45, colors: ['#3a6a2a', '#4a7a3a'], head: '#3a6a2a', y: .45, waveAmp: .9 });

export default { pages: [
  // 1. Thạch Sanh was a kind, strong woodcutter who lived alone under a banyan tree.
  S => {
    forest(S); L.hut(S, -4, -2.6, .4);
    const sanh = S.person(SANH, 1.4, 1, -.4), ax = axe(); S.grab(sanh, 0, ax, [0, -.5, .1]);
    const pile = logs(); S.add(pile, 2.4, 0, 2.2); pile.visible = false;
    S.shot([0, 2.6, 9], [0, 1.4, 0]);
    S.do(sanh, .3, 'swing', 3.4); S.mood(sanh, .3, 'happy'); S.cam(.3, 3.4, [3, 2, 6], [1.4, 1.2, .6]);
    S.show(pile, 3.4); S.do(sanh, 4, 'carry', 2);
    S.say(6, 'He shared his wood with anyone who needed it.', 'Chàng chia củi cho bất cứ ai cần.');
    const old = S.person(VILLAGER('aodai', '#8a6a4a', 'nonla'), -4, 4, H); S.walk(old, 6, [.6, 3.2]);
    S.do(sanh, 7.6, 'give', 1.4); S.mood(old, 8, 'happy'); S.do(old, 8.4, 'bow', 1);
    S.cam(6, 2.6, [0, 2.2, 8], [.8, 1, 2.6]);
    S.at(9.4, () => { });
  },
  // 2. He bravely beat a giant snake that scared the village, and found a magic bow.
  S => {
    forest(S, { dark: true });
    const sanh = S.person(SANH, 1.6, 2.2, -.6), ax = axe(); S.grab(sanh, 0, ax, [0, -.5, .1]);
    const sn = snake(S); sn.userData.lay(-9, -4, H * .7);
    const b = bow(); S.add(b, -1.6, 1, -1); b.visible = false;
    S.shot([0, 3, 10], [0, 1, 0]);
    slither(S, sn, .2, 3, [-1.4, .45, .6], .4); S.mood(sanh, 1.4, 'o'); S.do(sanh, 1.6, 'surprised', 1.4);
    S.cam(.2, 3, [-2, 2.4, 8], [-1, 1, .4]);
    S.mood(sanh, 3.4, 'smile'); S.do(sanh, 3.6, 'swing', 1.6);
    S.help(5.5, 'Tap to help Thạch Sanh be brave!', 'Chạm để Thạch Sanh thật dũng cảm nào!', tt => {
      S.do(sanh, tt, 'swing', 1.2); slither(S, sn, tt + .4, 1.6, [-12, .45, -8]);
      const sp = Pp.sparkle('#ffe27a'); S.add(sp, -1.6, .4, -1); S.show(sp, tt + 1); S.show(b, tt + 1.2);
      S.mood(sanh, tt + 1.4, 'happy'); S.do(sanh, tt + 1.6, 'cheer', .8);
      S.cam(tt, 1.6, [2, 2, 6], [-.4, 1, 0]);
    }, [-1.4, .8, .6], 2.3);
  },
  // 3. He rescued a princess who had been carried off by a giant eagle.
  S => {
    forest(S);
    const sanh = S.person(SANH, 2, 3, -.8), pr = S.person(PRINCESS, 0, 0, 0);
    const eagle = bird('#7a5a3a', 6); S.add(eagle, -10, 7, -6); eagle.add(pr.o); pr.o.position.set(0, -.5, 0); pr.o.scale.setScalar(.17);
    const b = bow(); S.grab(sanh, 0, b, [0, -.5, .1]);
    S.shot([2, 2.4, 9], [-1, 3, -1]);
    go(S, eagle, .2, 3, [-1, 5, -2]); S.mood(sanh, 1, 'o'); S.do(sanh, 2.4, 'throw', 1.4);
    S.cam(.2, 3, [4, 2, 8], [-.6, 3.6, -1.6]);
    S.say(4.5, 'His arrow flew, and the eagle let the princess go.', 'Mũi tên bay vút, đại bàng thả công chúa ra.');
    S.at(4.6, () => { S.root.attach(pr.o); pr.o.scale.setScalar(1); pr.o.rotation.set(0, .6, 0); });
    S.move(pr.o, 4.61, 1.4, [0, 0, 1.4], k => 1 - (1 - k) ** 2);
    go(S, eagle, 4.6, 2.2, [12, 12, -14]);
    S.walk(sanh, 5.6, [1, 1.8]); S.mood(pr, 6.2, 'happy'); S.do(pr, 6.4, 'bow', 1.2);
    S.cam(4.6, 2.4, [2.4, 1.8, 6], [.4, 1.2, 1.4]);
    S.at(8, () => { });
  },
  // 4. He was given a magic lute. When he played it, everyone who heard it felt calm and kind.
  S => {
    forest(S);
    const sanh = S.person(SANH, 0, 0, 0), lt = lute(); S.grab(sanh, 0, lt, [0, -.3, .25], 'armL');
    const army = ['#3a3a48', '#5a3a3a', '#3a4a5a', '#4a3a48'].map((c, i) => S.person(SOLDIER(c), -3 + i * 2, 4.4, PI));
    const notes = Pp.sparkle('#ffe27a'); S.add(notes, 0, 1, .4);
    S.shot([0, 2.4, 9], [0, 1.2, 2]);
    S.do(sanh, .2, 'sitground'); S.mood(sanh, .2, 'happy'); S.show(notes, .6);
    army.forEach(a => { S.mood(a, 0, 'sad'); S.do(a, 0, 'point', 2.6); });
    S.cam(.2, 3, [0, 1.6, 4], [0, .8, .6]);
    army.forEach((a, i) => { S.mood(a, 3 + i * .3, 'smile'); S.do(a, 3 + i * .3, 'sitground'); });
    S.cam(3, 3, [0, 3, 10], [0, 1, 3]);
    S.say(6.8, 'Angry soldiers sat down and smiled.', 'Những người lính đang giận cũng ngồi xuống mỉm cười.');
    army.forEach((a, i) => S.mood(a, 7 + i * .2, 'happy'));
    S.cam(6.8, 2.6, [3, 1.6, 7], [0, .8, 3]);
    S.at(9.6, () => { });
  },
  // 5. He also had a little pot of rice that never ran out, so he could feed everyone, even a whole army!
  S => {
    forest(S);
    const sanh = S.person(SANH, 0, 1, 0), pot = Pp.pot(); S.add(pot, 0, 0, 1.9);
    const army = ['#3a3a48', '#5a3a3a', '#3a4a5a', '#4a3a48', '#5a4a3a'].map((c, i) => S.person(SOLDIER(c), -3.2 + i * 1.6, 4, PI));
    const bowls = army.map(a => { const b = Pp.bowl(true); b.visible = false; S.grab(a, 0, b, [0, -.55, .15]); return b; });
    S.shot([0, 2.6, 9], [0, 1, 2]);
    S.do(sanh, .3, 'kneel', 2.4); S.mood(sanh, .3, 'happy'); S.cam(.3, 3, [1.6, 1.6, 5], [0, .6, 2]);
    army.forEach((a, i) => { S.mood(a, 1, 'o'); S.do(a, 1.6, 'give', 2.4); });
    S.cam(3.2, 2.2, [0, 2.4, 9], [0, 1, 3]);
    S.help(5.7, "Tap to fill everyone's bowl!", 'Chạm để xới cơm cho mọi người nào!', tt => {
      bowls.forEach((b, i) => { S.show(b, tt + i * .2); });
      army.forEach((a, i) => { S.do(a, tt + .4 + i * .1, 'eat', 1.2); S.mood(a, tt + .4, 'happy'); });
      const sp = Pp.sparkle('#ffffff'); S.add(sp, 0, .6, 1.9); S.show(sp, tt);
      S.cam(tt, 1.6, [2, 2, 7.6], [0, 1, 3.4]);
    }, [0, .6, 1.9], 2.3);
  },
  // 6. Thạch Sanh married the princess, and his kindness brought peace. Ở hiền gặp lành: kind people find good things.
  S => {
    palace(S);
    const sanh = S.person(LOOK({ style: 'tunic', color: '#3a7ac8', hat: 'crown', skin: '#c89060' }), -.7, 0, 0), pr = S.person(PRINCESS, .7, 0, 0);
    const people = [VILLAGER('aodai', '#e86a8a'), VILLAGER('shirt', '#3b6fe0', 'nonla', 'short'), VILLAGER('aodai', '#43c463'), VILLAGER('shirt', '#ffd23f', 'nonla', 'short')].map((l, i) => S.person(l, -4.5 + i * 3, 4, PI));
    S.shot([0, 2.4, 9], [0, 1.4, 0]);
    S.mood(sanh, 0, 'happy'); S.mood(pr, 0, 'happy'); S.do(sanh, .4, 'bow', 1.2); S.do(pr, .4, 'bow', 1.2);
    people.forEach((p, i) => { S.do(p, 1 + i * .2, 'cheer', 2); S.mood(p, 1, 'happy'); });
    S.cam(.3, 3.6, [0, 1.8, 5.4], [0, 1.4, 0]);
    S.say(7.1, 'White doves flew over the peaceful land.', 'Đàn bồ câu trắng bay trên đất nước thanh bình.');
    [0, 1, 2, 3].forEach(i => { const b = bird('#ffffff', 1.4); S.add(b, -10 - i, 3 + i * .4, 2); S.move(b, 7 + i * .2, 3, [10 + i, 6 + i * .5, -6]); });
    S.do(sanh, 7.2, 'wave', 2); S.do(pr, 7.2, 'wave', 2); S.cam(7, 3, [0, 1.2, 8], [0, 3, 0]);
    S.at(10.2, () => { });
  }
] };
