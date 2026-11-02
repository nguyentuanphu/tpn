// Ông Táo về trời (The Kitchen Gods Ride to Heaven): Ông Táo watches over the kitchen all year, the 23rd of the last
// moon, three carp let go in the pond, the carp become dragons and fly him to the Jade Emperor, his kind report, and
// home again for Tết. The child helps twice: letting the carp go (page 3) and the carp leaping into dragons (page 4).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, speak, go, hop, KID, VILLAGER, village, kitchen, heaven, carp, serpent, slither, moonDisc, flat, firecrackers } from './kit.js';

const TAO = LOOK({ style: 'tunic', color: '#c62f2f', hat: 'silkcap', hairStyle: 'short', hair: '#e8e8e8', skin: '#e8b890' });
const JADE = LOOK({ style: 'tunic', color: '#ffd23f', hat: 'crown', hairStyle: 'short', hair: '#f4f4f4', skin: '#e8c0a0' });
const MOM = VILLAGER('aodai', '#c84a6a', 'none', 'buns'), DAD = VILLAGER('shirt', '#3b6fe0', 'none', 'short');
const BOY = KID('shirt', '#ffb52e', 'spiky'), GIRL = KID('dress', '#ff7eb8', 'buns');
const dragon = S => serpent(S, { n: 16, r: .3, colors: ['#e8b62a', '#ffd23f', '#e8332a'], head: '#e8b62a', horns: true, y: 2, waveAmp: .7 });
const pondAt = (S, x, z, r = 2.4) => S.add(mesh([P(new THREE.CylinderGeometry(r, r, .06, 24), '#4fa8c8', [0, .03, 0]), P(new THREE.CylinderGeometry(r + .3, r + .3, .03, 24), '#a88a5a', [0, .01, 0])]), x, 0, z);

export default { pages: [
  // 1. In every Vietnamese kitchen lives a kind Kitchen God, Ông Táo, who watches over the family all year.
  S => {
    kitchen(S);
    const tao = S.person(TAO, -2.4, -2, .4, .8), mom = S.person(MOM, 1.6, 0, -.6), kids = [S.person(BOY, 2.6, 1.4, -.8, .7), S.person(GIRL, -.6, 1.6, .3, .7)];
    S.shot([0, 2.4, 7], [0, 1, -1]);
    S.do(mom, .3, 'carry', 3); S.mood(tao, 0, 'happy'); S.do(tao, .6, 'wave', 2);
    kids.forEach((k, i) => { S.mood(k, 0, 'happy'); S.do(k, .4 + i * .3, 'cheer', 1.6); });
    S.cam(.3, 3.4, [-1.6, 1.6, 3.6], [-2.4, 1, -2]);
    S.say(5.6, 'He kept the fire warm and smiled at everyone.', 'Ông giữ cho bếp lửa ấm và mỉm cười với cả nhà.');
    S.do(tao, 5.7, 'point', 2); S.cam(5.6, 2.6, [1, 2, 6], [0, 1, -1.4]);
    S.at(8.6, () => { });
  },
  // 2. On the 23rd day of the last moon of the year, he gets ready to fly up to heaven.
  S => {
    kitchen(S);
    const tao = S.person(TAO, 0, 0, 0, .8); moonDisc(S, 4, 4, -3.6, .6);
    S.shot([0, 1.8, 5], [0, 1, 0]);
    S.do(tao, .3, 'stretch', 1.4); S.mood(tao, .3, 'happy'); S.do(tao, 2, 'bow', 1.2);
    S.cam(.3, 3, [1.4, 1.4, 3.4], [0, 1, 0]);
    S.say(4.9, 'He put on his best hat and waved goodbye.', 'Ông đội mũ đẹp nhất và vẫy tay chào.');
    S.do(tao, 5, 'wave', 2.4); S.cam(5, 2.4, [0, 1.6, 4], [0, 1.1, 0]);
    S.at(8, () => { });
  },
  // 3. The family lets three little carp go in a pond. The carp will carry Ông Táo up to the sky!
  S => {
    village(S, { house: [-5, -8], paddy: false }); pondAt(S, 0, 0);
    const kids = [S.person(BOY, -1, 3, PI, .7), S.person(GIRL, 1, 3, PI, .7)], mom = S.person(MOM, 0, 4, PI), bowl = Pp.bowl(false); bowl.scale.setScalar(2.4); S.grab(mom, 0, bowl, [0, -.55, .2]);
    const fish = [0, 1, 2].map(i => { const f = carp(); f.scale.setScalar(.35); f.visible = false; S.add(f, -.6 + i * .6, .1, 1.4); return f; });
    S.shot([0, 2.6, 8], [0, .6, 1]);
    S.walk(mom, .3, [0, 2.6]); S.do(mom, 1.8, 'kneel', 4.6); kids.forEach(k => S.do(k, 1.8, 'kneel', 4.6));
    S.cam(.3, 3, [0, 1.6, 5.4], [0, .4, 1.6]);
    S.help(6.4, 'Tap to let the carp swim free!', 'Chạm để thả cá chép nào!', tt => {
      fish.forEach((f, i) => { S.show(f, tt + i * .15); go(S, f, tt + i * .15, 1.6, [-1 + i, -.1, -1 + i * .4], undefined, .4); });
      kids.forEach(k => { S.mood(k, tt, 'happy'); S.do(k, tt + .6, 'cheer', 1.4); });
      S.cam(tt, 1.6, [1.6, 2, 4.6], [0, 0, 0]);
    }, [0, .6, 1.6], 2.3);
  },
  // 4. The carp leap, turn into dragons, and fly him to the Jade Emperor.
  S => {
    village(S, { house: [-5, -8], paddy: false }); pondAt(S, 0, 0);
    const fish = [0, 1, 2].map(i => { const f = carp(); f.scale.setScalar(.5); S.add(f, -1 + i, 0, 0); return f; });
    const tao = S.person(TAO, 0, 2.6, PI, .8);
    S.shot([0, 2.4, 8], [0, 1, 0]);
    fish.forEach((f, i) => S.tw(.3 + i * .3, 1, k => { f.position.y = Math.sin(k * PI) * 1.4; f.rotation.x = -Math.sin(k * PI * 2) * .6; }));
    S.cam(.3, 3, [2, 1.8, 6], [0, 1, 0]);
    S.help(5.3, 'Tap to help the carp leap!', 'Chạm để cá chép vượt lên nào!', tt => {
      const sp = Pp.sparkle('#ffe27a'); S.add(sp, 0, .4, 0); S.show(sp, tt);
      fish.forEach((f, i) => S.show(f, tt + .3, false));
      const d = dragon(S); d.userData.lay(0, -2, PI); slither(S, d, tt + .3, 1.6, [0, 2, 2.4], .8);
      S.at(tt + 1.9, () => { d.userData.head.add(tao.o); tao.o.position.set(0, .4, -.6); tao.o.scale.setScalar(2.6); }); S.mood(tao, tt + 1.9, 'happy');
      S.cam(tt, 2, [0, 3, 9], [0, 2, 0]);
    }, [0, .6, 0], 2.3);
  },
  // 5. Ông Táo tells the Jade Emperor about the family: how they helped each other and were kind.
  S => {
    heaven(S);
    const jade = S.person(JADE, 0, -7, 0, 1.3), tao = S.person(TAO, 0, -2, PI, .9);
    S.shot([0, 3, 8], [0, 2, -4]);
    speak(S, tao, .4, 4.6); S.do(tao, .4, 'talk', 4.6); S.cam(.3, 3, [3, 2.4, 2], [0, 1.6, -4]);
    S.mood(jade, 3, 'happy');
    S.say(6.4, 'The Jade Emperor smiled and nodded.', 'Ngọc Hoàng mỉm cười gật đầu.');
    S.tw(6.4, 1.6, k => { jade.A.head.rotation.x = Math.sin(k * PI * 2) * .2; }); S.cam(6.4, 2.4, [0, 2.6, -2], [0, 2.4, -7]);
    S.at(9.2, () => { });
  },
  // 6. Then he comes home on New Year's Eve, just in time for Tết!
  S => {
    village(S, { house: [0, -6], paddy: false }); S.sky('#141a44', '#34406e'); S.light(.6, .7);
    L.blossom(S, -4, -2); L.blossom(S, 4, -2.4); L.lantern(S, -2, 3, -3.2); L.lantern(S, 2, 3, -3.2, '#ffd23f');
    const fam = [MOM, DAD, BOY, GIRL].map((l, i) => S.person(l, -2.4 + i * 1.6, 2.4, PI * 0, i > 1 ? .7 : 1)), tao = S.person(TAO, 0, -2, 0, .8); tao.o.position.y = 6;
    const fw = Pp.fireworks(S, 0, 9, -14);
    S.shot([0, 2.6, 9], [0, 2, 0]);
    S.move(tao.o, .3, 2.4, [0, 0, -1.4], k => 1 - (1 - k) ** 2); S.mood(tao, .3, 'happy');
    S.show(fw, 2.4); fam.forEach((a, i) => { S.mood(a, 2.6, 'happy'); S.do(a, 2.6 + i * .1, 'cheer', 2); });
    S.cam(.3, 3, [0, 3, 10], [0, 3, -2]);
    S.say(4.8, 'Chúc mừng năm mới! Happy New Year!', 'Chúc mừng năm mới!');
    fam.forEach(a => S.do(a, 5, 'wave', 1.8)); S.do(tao, 5, 'wave', 1.8);
    S.at(7.2, () => { });
  }
] };
