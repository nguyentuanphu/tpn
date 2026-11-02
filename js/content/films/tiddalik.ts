// Tiddalik the Thirsty Frog (Chú Ếch Khát Nước Tiddalik), from Aboriginal people of south-east Australia: Tiddalik
// wakes thirsty, drinks a puddle, a pond, a whole river, the animals try to make him laugh, the eel ties itself in
// silly knots, the water flows back. The child helps twice: the animals' funny dance (page 3) and the eel's knots (page 4).
import { L, Pp, THREE, P, mesh, PI, H, go, hop, turn, bush, pond, animal, owl, toad, serpent, slither, flat } from './kit.js';

const tidd = (S, s = 1.6) => { const t = toad('#6ab84a', '#3a8a2a'); t.scale.setScalar(s); return S.add(t, 0, 0, 0, 0); };
const eel = S => serpent(S, { n: 14, r: .18, colors: ['#5a6a3a', '#6a7a4a'], head: '#5a6a3a', y: .2, waveAmp: .8 });

export default { pages: [
  // 1. One hot morning, Tiddalik the frog woke up very, very thirsty.
  S => {
    bush(S); const pd = pond(S, 0, -1, 3);
    const t = tidd(S); t.position.set(0, 0, 2.6); t.rotation.y = PI;
    S.shot([0, 2, 8], [0, .6, 1]);
    S.tw(.4, 1.2, k => { t.scale.set(1.6 + Math.sin(k * PI) * .2, 1.6, 1.6); }); S.cam(.3, 3, [1, 1.2, 5.4], [0, .6, 2.6]);
    turn(S, t, 3.4, [0, -1], .8); S.cam(3.4, 3, [-2, 2, 7], [0, .4, 0]);
    S.say(9.3, 'He hopped to the water and began to drink.', 'Chú nhảy ra bờ nước và bắt đầu uống.');
    hop(S, t, 9.4, 2, .4); S.move(t, 9.4, 1, [0, 0, 1.6]); S.cam(9.3, 2.4, [2, 1.4, 4.4], [0, .4, .8]);
    S.at(12.2, () => { });
  },
  // 2. He drank a puddle. Then a pond. Then a whole river! Soon there was no water left for anyone.
  S => {
    bush(S); const pd = pond(S, 0, -2, 4);
    const water = pd.children[0] || pd; const t = tidd(S); t.position.set(0, 0, 2.6); t.rotation.y = PI;
    S.shot([0, 3, 10], [0, .6, 0]);
    S.tw(.4, 6.4, k => { pd.scale.set(1 - k * .95, 1, 1 - k * .95); t.scale.setScalar(1.6 + k * 3.4); }, k => k);
    S.cam(.3, 6.6, [0, 5, 13], [0, 1.6, 0]);
    S.say(7.8, 'His tummy grew round as a ball!', 'Bụng chú phình to tròn như quả bóng!');
    S.cam(7.8, 2.4, [4, 2.6, 8], [0, 2, 2]);
    S.at(10.6, () => { });
  },
  // 3. The animals had an idea: "If we make Tiddalik laugh, the water will come out!" They danced and pulled funny faces.
  S => {
    bush(S);
    const t = tidd(S, 5); t.position.set(0, 0, -2); t.rotation.y = 0;
    const roo = animal(S, 'joey', -3, 3, PI, 2.2), ko = animal(S, 'koala', 0, 3.4, PI, 1.4), ow = owl(); S.add(ow, 2.8, 0, 3, PI); ow.scale.setScalar(1.4);
    S.shot([0, 2, 10], [0, 1.6, 0]);
    S.cam(.3, 3, [3, 2, 8], [0, 1.4, 1]);
    S.help(8.4, 'Tap to make the animals dance!', 'Chạm để các con vật nhảy múa nào!', tt => {
      hop(S, roo, tt, 3, .6, .6); S.tw(tt, 1.8, k => { ko.rotation.y = PI + k * PI * 4; }); S.tw(tt, 1.8, k => { ow.rotation.z = Math.sin(k * PI * 6) * .4; });
      S.tw(tt, 2, k => { t.userData.nod = Math.sin(k * PI * 2) * .1; });
      S.cam(tt, 2, [0, 2.6, 9], [0, 1.4, 1]);
    }, [0, 1, 3], 2.3);
  },
  // 4. Nobody could do it, until the eel wiggled and twisted into silly knots. Tiddalik laughed and laughed!
  S => {
    bush(S);
    const t = tidd(S, 5); t.position.set(0, 0, -2);
    const e = eel(S); e.userData.lay(-4, 3, H);
    S.shot([0, 2, 9], [0, 1.4, 1]);
    slither(S, e, .3, 2, [0, .2, 3], .3); S.cam(.3, 3, [-2, 1.4, 7], [0, .6, 2]);
    S.help(7.9, 'Tap to tie the eel in a silly knot!', 'Chạm để lươn uốn thành nút buồn cười nào!', tt => {
      const hd = e.userData.head; S.tw(tt, 2, k => { hd.position.set(Math.cos(k * PI * 4) * .8, .2 + Math.sin(k * PI * 2) * .6, 3 + Math.sin(k * PI * 4) * .8); hd.rotation.y = k * PI * 4; }, k => k);
      S.tw(tt + .6, 1.6, k => { t.rotation.z = Math.sin(k * PI * 8) * .08; t.position.y = Math.abs(Math.sin(k * PI * 6)) * .3; }, k => k);
      S.cam(tt, 2, [0, 2.4, 9], [0, 1.6, 0]);
    }, [0, .6, 3], 2.3);
  },
  // 5. Whoosh! All the water flowed back into the rivers and ponds. Everyone had a drink, and learned to share.
  S => {
    bush(S);
    const t = tidd(S, 5); t.position.set(0, 0, -2);
    const pd = pond(S, 0, 2, 4); pd.scale.set(.05, 1, .05);
    const roo = animal(S, 'joey', -6, 4, H, 2.2), ko = animal(S, 'koala', 6, 4, -H, 1.4), emu = animal(S, 'emu', 6, 1, -H, 1.2);
    S.shot([0, 3, 11], [0, 1, 1]);
    S.scale(t, .3, 3, 5, 1.8); S.tw(.3, 3, k => { pd.scale.set(.05 + k * .95, 1, .05 + k * .95); });
    S.cam(.3, 4, [0, 4, 10], [0, .6, 1]);
    go(S, roo, 3.6, 2, [-2.6, 0, 4]); go(S, ko, 3.6, 2, [2.6, 0, 4.4]); go(S, emu, 3.8, 2, [3.6, 0, 1.6]);
    S.say(7.6, 'Even Tiddalik shared, and laughed with his friends.', 'Cả Tiddalik cũng biết chia sẻ, cười vui cùng các bạn.');
    hop(S, t, 7.7, 3, .4); S.cam(7.6, 2.6, [3, 2, 8], [0, .6, 2]);
    S.at(10.6, () => { });
  }
] };
