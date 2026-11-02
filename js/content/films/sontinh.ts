// Sơn Tinh, Thủy Tinh (The Mountain Spirit and the Water Spirit): two spirits ask to marry Princess Mỵ Nương, Sơn
// Tinh brings the presents first, Thủy Tinh's flood and the mountain that grows higher, the rainy season every year.
// The child helps twice: bringing the presents (page 2) and making the mountain grow (page 3).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, speak, go, hop, KINGLOOK, VILLAGER, palace, village, animal, rain, flat } from './kit.js';

const SON = LOOK({ style: 'tunic', color: '#4a8a3a', back: 'cape', hat: 'crown', hairStyle: 'short', skin: '#c89060' });
const THUY = LOOK({ style: 'tunic', color: '#2f7ac8', back: 'cape', hat: 'crown', hairStyle: 'spiky', skin: '#c8b0a0' });
const MY = LOOK({ style: 'aodai', color: '#ff9ec8', hat: 'crown', hairStyle: 'long', skin: '#f0c098' });
const KING = KINGLOOK();

export default { pages: [
  // 1. Two spirits both wanted to marry Princess Mỵ Nương: Sơn Tinh of the mountains and Thủy Tinh of the waters.
  S => {
    palace(S);
    const king = S.person(KING, -1, -4.6, 0), my = S.person(MY, 1, -4.4, 0), son = S.person(SON, -9, 3, H), thuy = S.person(THUY, 9, 3, -H);
    S.shot([0, 3, 11], [0, 1.6, -2]);
    S.walk(son, .3, [-2.2, 1], 2.2); S.walk(thuy, .3, [2.2, 1], 2.2);
    S.cam(.3, 3.6, [0, 2.2, 7], [0, 1.4, -1]);
    [son, thuy].forEach(a => { S.face(a, 3.8, [0, -4.4]); S.do(a, 4.2, 'bow', 1.4); }); S.mood(my, 4.2, 'o');
    S.say(7.2, 'The king could not choose between them.', 'Vua không biết chọn ai.');
    S.do(king, 7.3, 'talk', 2.4); S.cam(7.2, 2.6, [0, 2, 1], [0, 1.6, -4.6]);
    S.at(10, () => { });
  },
  // 2. The king said: "Whoever brings the presents first can marry her." Sơn Tinh arrived first!
  S => {
    palace(S);
    const king = S.person(KING, -1, -4.6, 0), my = S.person(MY, 1, -4.4, 0), son = S.person(SON, -2, 1, 0);
    const el = animal(S, 'elephant', -8, 4, H, 1.1), hen = animal(S, 'chicken', -9, 2, H, 1.3), rice = Pp.sack(); S.add(rice, -9.6, 0, 5);
    S.shot([0, 3, 10], [0, 1.4, -1]);
    speak(S, king, .3, 3.4); S.cam(.3, 3, [0, 2, 3], [0, 1.6, -4.6]);
    S.do(son, 3.6, 'point', 1.6); S.cam(3.6, 2.4, [-4, 2.6, 9], [-5, 1, 2]);
    S.help(7.2, 'Tap to bring the presents!', 'Chạm để mang sính lễ đến nào!', tt => {
      go(S, el, tt, 2, [-3, 0, -1.6]); go(S, hen, tt + .1, 2, [-1.6, 0, -2.4]); S.move(rice, tt + .2, 2, [-.4, 0, -2.6]);
      S.mood(king, tt + 1, 'happy'); S.mood(my, tt + 1, 'happy'); S.do(son, tt + 1.2, 'cheer', 1);
      S.cam(tt, 2, [0, 3.4, 8], [-1.6, 1, -2]);
    }, [-5, 1, 2], 2.3);
  },
  // 3. Thủy Tinh was cross and sent rain and floods. But Sơn Tinh made the mountains grow higher and higher.
  S => {
    S.sky('#4a5a70', '#9aa8b8'); S.light(.7, .7);
    const water = L.sea(S, '#3a7a98', -1);
    const mt = mesh([P(new THREE.ConeGeometry(6, 6, 9), '#5a8a4a', [0, 3, 0]), P(new THREE.ConeGeometry(1.4, 1.4, 9), '#7aa86a', [0, 5.6, 0])]); S.add(mt, 0, 0, -4);
    const son = S.person(SON, -.4, -4, 0), my = S.person(MY, .6, -4, 0); son.o.position.y = 6; my.o.position.y = 6;
    const thuy = S.person(THUY, 6, 3, -H * .8); thuy.o.position.y = -.4;
    rain(S, 0, 1e9, 0, -2, 30);
    S.shot([10, 5, 14], [0, 3, -3]);
    S.tw(.2, 7, k => { water.position.y = -1 + k * 3; }, k => k);
    S.do(thuy, .4, 'throw', 2); S.mood(thuy, .4, 'sad'); S.do(thuy, 2.6, 'throw', 2);
    S.cam(.3, 4, [8, 4, 10], [0, 3, -3]);
    S.help(8, 'Tap to make the mountain grow!', 'Chạm để núi cao thêm nào!', tt => {
      S.scale(mt, tt, 1.8, 1, 1.7); S.tw(tt, 1.8, k => { const y = 6 + k * 4.2; son.o.position.y = y; my.o.position.y = y; });
      S.do(son, tt + .4, 'stretch', 1.4); S.mood(my, tt, 'happy');
      S.cam(tt, 2, [12, 8, 14], [0, 5, -4]);
    }, [0, 4, -4], 2.3);
  },
  // 4. People say that is why there is a rainy season every year: Thủy Tinh still remembers!
  S => {
    village(S, { house: [0, -6] });
    const fam = [VILLAGER('aodai', '#e86a8a'), VILLAGER('shirt', '#3b6fe0', 'nonla', 'short')].map((l, i) => S.person(l, -1 + i * 2, 2.6, 0));
    S.shot([0, 2.6, 9], [0, 1.4, 0]);
    S.skyTo(.2, 1, '#6a7a90', '#b8c4d0'); rain(S, .6, 5.4);
    fam.forEach(a => S.do(a, .8, 'hug', 3)); S.cam(.3, 3, [0, 2, 6], [0, 1.4, 1]);
    S.say(6.6, 'Then the sun comes back, and the rice grows green.', 'Rồi nắng lại lên, lúa lại xanh tươi.');
    S.skyTo(5.6, 1.2, '#7cc8f0', '#e8f6ff'); fam.forEach(a => { S.mood(a, 6.6, 'happy'); S.do(a, 6.8, 'cheer', 2); });
    S.cam(6.6, 2.6, [12, 3, 10], [18, .6, 2]);
    S.at(9.6, () => { });
  }
] };
