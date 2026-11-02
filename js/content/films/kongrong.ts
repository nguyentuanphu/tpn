// Kong Rong Shares the Pears (Khổng Dung nhường lê): little Kong Rong and his brothers, Grandpa's plate of pears, Kong
// Rong takes the smallest, "my big brothers should have the big ones", Grandpa's smile, sharing makes everyone happy.
// The child helps twice: choosing the small pear (page 3) and handing out the big ones (page 4).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, speak, hop, chinaVillage, pear } from './kit.js';

const KONG = LOOK({ style: 'tunic', color: '#3cb0e8', hairStyle: 'buns', skin: '#f0c8a0' });
const BRO = ['#c62f2f', '#4a9a5a', '#7a4a9a', '#e8a832'].map(c => LOOK({ style: 'tunic', color: c, hairStyle: 'short', skin: '#e8b890' }));
const GRANDPA = LOOK({ style: 'tunic', color: '#6a5a4a', hairStyle: 'short', hair: '#f4f4f4', skin: '#e8b890' });
// the family round a low table with the plate of pears (big ones and one small one)
const family = S => {
  chinaVillage(S); S.add(Pp.mat(), 0, 0, 2.2, H);
  const table = Pp.table(); S.add(table, 0, 0, 2.2);
  const plate = mesh([P(new THREE.CylinderGeometry(.42, .36, .04, 16), '#f4f0e8', [0, 0, 0])]); S.add(plate, 0, .47, 2.2);
  const pears = [0, 1, 2, 3, 4].map(i => { const p = pear(); p.scale.setScalar(i === 4 ? .6 : 1); return S.add(p, Math.cos(i * 1.26) * .22, .49, 2.2 + Math.sin(i * 1.26) * .2); });
  const kong = S.person(KONG, 0, 3.4, PI, .6), bros = BRO.map((l, i) => S.person(l, [-1.4, 1.4, -1.1, 1.1][i], [2.6, 2.6, 1.4, 1.4][i], [H, -H, H * .6, -H * .6][i], .8));
  return { pears, kong, bros, plate };
};

export default { pages: [
  // 1. Long ago in China, little Kong Rong was four years old and had many brothers.
  S => {
    chinaVillage(S);
    const kong = S.person(KONG, 0, 2.6, 0, .6), bros = BRO.map((l, i) => S.person(l, -3 + i * 1.6 + (i > 1 ? 1.6 : 0), 2 - (i % 2) * .4, 0, .8));
    S.shot([0, 2, 8], [0, .8, 2]);
    [kong, ...bros].forEach((a, i) => { S.mood(a, 0, 'happy'); S.do(a, .4 + i * .3, 'wave', 1.4); });
    S.cam(.3, 3.4, [0, 1.2, 5.6], [0, .8, 2.4]);
    S.say(5.6, 'They played together all day long.', 'Anh em cùng nhau chơi đùa suốt ngày.');
    [kong, ...bros].forEach((a, i) => hop(S, a.o, 5.7 + i * .15, 2, .3)); S.cam(5.6, 2.4, [3, 2, 6], [0, .8, 2]);
    S.at(8.4, () => { });
  },
  // 2. One day Grandpa brought a plate of pears: some big, some small.
  S => {
    const { pears, kong, bros, plate } = family(S); [plate, ...pears].forEach(p => { p.visible = false; });
    const gp = S.person(GRANDPA, 4, -1, -.8); const tray = mesh([P(new THREE.CylinderGeometry(.42, .36, .04, 16), '#f4f0e8', [0, 0, 0])]); S.grab(gp, 0, tray, [0, -.55, .2]);
    S.shot([0, 2.4, 8], [0, .8, 2]);
    S.walk(gp, .3, [.8, 1]); S.do(gp, 2.2, 'give', 1.4); S.at(3.4, () => { tray.visible = false; [plate, ...pears].forEach(p => { p.visible = true; }); });
    [kong, ...bros].forEach(a => S.mood(a, 3.4, 'happy')); S.cam(.3, 3.6, [1, 1.8, 6], [.4, .8, 2]);
    S.say(5.5, 'Yellow, juicy pears. Yum!', 'Những quả lê vàng mọng nước. Ngon quá!');
    S.cam(5.4, 2.4, [.4, 1.4, 3.6], [0, .5, 2.2]);
    S.at(8.2, () => { });
  },
  // 3. Kong Rong chose the smallest pear. "Why the small one?" asked Grandpa.
  S => {
    const { pears, kong, bros } = family(S); const gp = S.person(GRANDPA, 1.6, 4.2, PI * .8);
    S.shot([0, 2, 6], [0, .7, 2.6]);
    S.cam(.3, 3, [-1, 1.2, 4.6], [0, .6, 2.8]);
    S.help(6.4, 'Tap to help Kong Rong take the smallest pear!', 'Chạm để Khổng Dung lấy quả lê nhỏ nhất nào!', tt => {
      S.do(kong, tt, 'give', .8); S.grab(kong, tt + .6, pears[4], [0, -.45, .15], 'armR', 1); S.mood(kong, tt + .6, 'happy');
      speak(S, gp, tt + 1, 1.2); S.mood(gp, tt + 1, 'o');
      S.cam(tt, 1.6, [1.6, 1.4, 5], [.6, .8, 3.4]);
    }, [0, .6, 2.2], 2.3);
  },
  // 4. "I am the youngest, so my big brothers should have the big ones."
  S => {
    const { pears, kong, bros } = family(S); const gp = S.person(GRANDPA, 1.6, 4.2, PI * .8); pears[4].visible = false;
    const mine = pear(); mine.scale.setScalar(.6); S.grab(kong, 0, mine, [0, -.45, .15]);
    S.shot([0, 1.6, 6], [0, .7, 3]);
    speak(S, kong, .3, 3); S.cam(.3, 2.6, [0, 1, 5], [0, .7, 3.2]);
    S.help(4.6, 'Tap to give the big pears to the brothers!', 'Chạm để mời các anh quả lê to nào!', tt => {
      bros.forEach((b, i) => { S.grab(b, tt + i * .3, pears[i], [0, -.45, .15]); S.mood(b, tt + i * .3, 'happy'); S.do(b, tt + i * .3 + .2, 'cheer', .8); });
      S.cam(tt, 2, [0, 2.4, 6], [0, .6, 2]);
    }, [0, .6, 2.2], 2.3);
  },
  // 5. Grandpa smiled, and everyone was proud of him.
  S => {
    const { kong, bros } = family(S); const gp = S.person(GRANDPA, .6, 4.4, PI);
    S.shot([0, 1.6, 6.6], [0, .8, 3]);
    S.mood(gp, .2, 'happy'); S.do(gp, .4, 'hug', 2.4); S.mood(kong, .4, 'happy'); S.cam(.3, 3, [0, 1.4, 6], [.3, .9, 3.6]);
    S.say(4.3, 'His brothers gave him a big hug too.', 'Các anh cũng ôm chầm lấy cậu.');
    bros.forEach(b => { S.mood(b, 4.3, 'happy'); S.do(b, 4.4, 'cheer', 2); }); S.cam(4.3, 2.2, [0, 2.6, 7], [0, .7, 2.4]);
    S.at(7, () => { });
  },
  // 6. Children in China still learn this story: sharing makes everyone happy.
  S => {
    chinaVillage(S);
    const kids = [KONG, ...BRO].map((l, i) => { const a = i / 5 * PI * 2; return S.person(l, Math.cos(a) * 1.8, 2.4 + Math.sin(a) * 1.4, Math.atan2(-Math.cos(a), -Math.sin(a)), i ? .8 : .6); });
    S.shot([0, 3, 8], [0, .8, 2.4]);
    kids.forEach((k, i) => { S.mood(k, 0, 'happy'); S.do(k, .4, 'dance', 4); });
    S.cam(.3, 4, [3, 2, 6], [0, .8, 2.4]);
    S.say(5.4, 'Share a little, and smiles grow big!', 'Chia sẻ một chút, nụ cười thêm thật nhiều!');
    S.cam(5.4, 2.4, [0, 1.6, 6], [0, .8, 2.4]);
    S.at(8.2, () => { });
  }
] };
