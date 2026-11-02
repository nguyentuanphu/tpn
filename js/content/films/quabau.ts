// Chuyện quả bầu (The Magic Gourd): the couple free a little dúi who warns of the flood, they shelter inside a huge
// gourd for seven days and nights, the water goes down and they plant a seed, the giant gourd with voices inside, and
// out come the peoples of Vietnam. The child helps twice: planting the seed (page 3) and opening the gourd (page 5).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, speak, go, hop, VILLAGER, KID, village, mountainTop, mouse, gourd, rain, flat } from './kit.js';

const HUS = LOOK({ style: 'shirt', color: '#4a6a8a', hat: 'nonla', hairStyle: 'short', skin: '#c89060' });
const WIF = LOOK({ style: 'aodai', color: '#a84a3a', hairStyle: 'buns', skin: '#e8b890' });
// the peoples (each in their own colours)
const PEOPLES = [['aodai', '#1f3a7a', 'none', 'long'], ['tunic', '#2a2a2a', 'none', 'short'], ['aodai', '#e8332a', 'nonla', 'buns'], ['shirt', '#e8b62a', 'none', 'short'], ['dress', '#7a3a9a', 'none', 'ponytail'], ['tunic', '#2f8a5a', 'silkcap', 'short']].map(([s, c, h, hs]) => VILLAGER(s, c, h, hs));
const dui = () => { const m = mouse('#8a6a4a'); m.scale.setScalar(1.6); return m; };

export default { pages: [
  // 1. Two kind people saved a little squirrel. "A big flood is coming," said the squirrel. "Hide inside a giant gourd!"
  S => {
    village(S, { house: [0, -6] });
    const h = S.person(HUS, -1.4, 1.6, .5), w = S.person(WIF, 1.4, 1.6, -.5), d = dui(); S.add(d, 0, 0, 2.8);
    const net = Pp.net(1, .6); S.add(net, 0, .55, 2.8); net.rotation.x = -H;
    const g = gourd(1.4); S.add(g, 4.6, 0, -1.6);
    S.shot([0, 2, 7], [0, .6, 2.2]);
    S.do(h, .3, 'kneel', 2); S.do(w, .3, 'kneel', 2); S.move(net, 1.4, .8, [0, 2, 2.8]); S.show(net, 2.3, false);
    S.cam(.3, 2.4, [0, 1.4, 5], [0, .4, 2.6]);
    S.tw(2.6, 2.4, k => { d.userData.nod = Math.sin(k * PI * 6) * .2; }, k => k); S.mood(h, 3, 'o'); S.mood(w, 3, 'o');
    go(S, d, 5.4, 1.4, [2.4, 0, 1.2]); S.do(h, 6, 'point', 2); S.cam(5.2, 2.4, [1, 2.4, 6.4], [3, .8, 0]);
    S.say(8.9, 'The couple listened, and found the biggest gourd of all.', 'Hai vợ chồng nghe lời, tìm quả bầu to nhất.');
    S.walk(h, 8.9, [3.4, .2]); S.walk(w, 8.9, [5.6, .4]); S.scale(g, 9.4, 2, 1.4, 2.6);
    S.at(12, () => { });
  },
  // 2. They climbed into a huge hollow gourd. The rain fell for seven days and seven nights.
  S => {
    village(S, { house: [-6, -8], paddy: false });
    const g = gourd(2.6); S.add(g, 0, 0, 0);
    const h = S.person(HUS, -2.6, 2.4, .8), w = S.person(WIF, -3.6, 2.8, .8);
    const water = S.add(flat(200, 200, '#5aa8c8', 0)); water.position.y = -.2;
    S.shot([0, 3, 11], [0, 1.6, 0]);
    S.skyTo(.2, 1.6, '#6a7a90', '#b8c4d0'); rain(S, .6);
    S.walk(h, .4, [-.6, 1.2]); S.walk(w, .6, [.4, 1.2]); S.scale(h.o, 2.8, .4, 1, .01); S.scale(w.o, 3, .4, 1, .01);
    S.cam(.3, 3, [-2, 2, 7], [0, 1.6, 0]);
    S.say(6.5, 'The water rose higher and higher, but the gourd floated.', 'Nước dâng cao mãi, nhưng quả bầu vẫn nổi.');
    S.tw(4, 6, k => { water.position.y = -.2 + k * 2; g.position.y = Math.max(0, k * 2 - .4); g.rotation.z = Math.sin(k * 20) * .06; }, k => k);
    S.cam(6.4, 3, [5, 4, 10], [0, 2, 0]);
    S.at(9.6, () => { });
  },
  // 3. When the water went down, they came out safely, and later found a little gourd seed.
  S => {
    mountainTop(S);
    const g = gourd(2.6); S.add(g, 1.6, 0, -1, .3);
    const h = S.person(HUS, 1, 1.4, .4), w = S.person(WIF, 2.2, 1.4, -.4); h.o.scale.setScalar(.01); w.o.scale.setScalar(.01);
    S.shot([0, 2.4, 8], [1, 1.2, 0]);
    S.scale(h.o, .4, .5, .01, 1); S.scale(w.o, .7, .5, .01, 1); S.mood(h, .6, 'happy'); S.mood(w, .8, 'happy');
    S.walk(h, 1.2, [-.6, 2.4]); S.walk(w, 1.4, [.4, 2.6]); S.do(h, 3, 'stretch', 1.2); S.do(w, 3, 'cheer', 1.2);
    S.cam(.3, 3, [-1, 1.8, 6.4], [0, 1, 2]);
    const seed = Pp.seed(); seed.scale.setScalar(2.4); S.grab(h, 0, seed, [0, -.5, .1]);
    S.help(5.4, 'Tap to plant the gourd seed!', 'Chạm để gieo hạt bầu nào!', tt => {
      S.do(h, tt, 'plant', 1.2); S.drop(seed, tt + .6, [-.6, 0, 3]);
      const sp = Pp.sprout(); sp.scale.setScalar(.01); S.add(sp, -.6, 0, 3); S.scale(sp, tt + 1, 1, .01, 3, undefined);
      S.cam(tt, 1.4, [-.4, 1.2, 5], [-.6, .3, 3]);
    }, [-.6, .6, 2.8], 2.3);
  },
  // 4. The seed grew a gourd so big! From inside they heard voices laughing and chattering.
  S => {
    village(S, { house: [-6, -8], paddy: false });
    const v = Pp.vines(40, 4); S.add(v, 0, 0, 0); const g = gourd(.3); S.add(g, .6, 0, .6);
    const h = S.person(HUS, -2.6, 3, .7), w = S.person(WIF, 2.6, 3, -.7);
    S.shot([0, 3, 9], [0, 1, 0]);
    S.tw(.2, 3, k => v.userData.grow(k)); S.scale(g, .6, 3.6, .3, 2.6);
    S.cam(.2, 4, [0, 2.6, 7], [0, 1.4, 0]); S.mood(h, 3.4, 'o'); S.mood(w, 3.4, 'o');
    S.say(6.4, 'Knock, knock! Someone was inside!', 'Cốc, cốc! Có ai ở bên trong!');
    S.tw(6.4, 2.6, k => { g.rotation.z = Math.sin(k * PI * 8) * .06; }, k => k);
    S.do(h, 6.6, 'surprised', 1.4); S.do(w, 6.8, 'surprised', 1.4);
    S.cam(6.4, 2.4, [1, 1.8, 5], [.6, 1.4, .6]);
    S.at(9.4, () => { });
  },
  // 5. Out came many, many people: the Khơ Mú, the Thái, the Mường, the Kinh and lots more!
  S => {
    village(S, { house: [-6, -8], paddy: false });
    const g = gourd(2.6); S.add(g, 0, 0, -1);
    const h = S.person(HUS, -3, 2, .8), w = S.person(WIF, 3, 2, -.8);
    const folk = PEOPLES.map((l, i) => { const a = S.person(l, 0, -.4, 0); a.o.visible = false; return a; });
    S.shot([0, 2.6, 9], [0, 1.4, 0]);
    S.cam(.2, 3.6, [0, 2, 7], [0, 1.4, -.6]); S.do(h, 1, 'point', 2); S.mood(h, 1, 'happy'); S.mood(w, 1, 'happy');
    S.help(7.3, 'Tap to open the gourd!', 'Chạm để mở quả bầu nào!', tt => {
      const sp = Pp.sparkle('#ffe27a'); S.add(sp, 0, .8, 0); S.show(sp, tt);
      folk.forEach((a, i) => { S.show(a.o, tt + i * .15); S.walk(a, tt + i * .15, [-2.4 + i * .95, 2.4 + (i % 2) * .5], 3); S.mood(a, tt, 'happy'); });
      S.cam(tt, 1.8, [0, 2.4, 8], [0, 1.2, 1.6]);
    }, [0, 1.2, -.6], 2.3);
  },
  // 6. Vietnam has fifty-four peoples, all brothers and sisters from the same gourd.
  S => {
    village(S, { house: null });
    const g = gourd(2); S.add(g, 0, 0, 0);
    const folk = [...PEOPLES, LOOK({ style: 'shirt', color: '#4a6a8a', hat: 'nonla', hairStyle: 'short', skin: '#c89060' }), KID('dress', '#ff7eb8', 'buns')].map((l, i, all) => { const a = i / all.length * PI * 2; return S.person(l, Math.cos(a) * 3, Math.sin(a) * 3, Math.atan2(-Math.cos(a), -Math.sin(a))); });
    S.shot([0, 6, 10], [0, 1, 0]);
    folk.forEach((a, i) => { S.mood(a, 0, 'happy'); S.do(a, .3 + i * .05, 'dance', 4.6); });
    S.tw(.2, 7.4, k => { const r = folk.length; folk.forEach((a, i) => { const ang = i / r * PI * 2 + k * 1.2; a.o.position.set(Math.cos(ang) * 3, 0, Math.sin(ang) * 3); a.o.rotation.y = Math.atan2(-Math.cos(ang), -Math.sin(ang)); }); }, k => k);
    S.cam(.2, 4, [0, 3.4, 8], [0, 1, 0]);
    S.say(5.3, 'Many peoples, one big family.', 'Nhiều dân tộc, chung một đại gia đình.');
    folk.forEach(a => S.do(a, 5.4, 'wave', 2.2)); S.cam(5.2, 2.4, [3, 2, 6], [0, 1.2, 0]);
    S.at(7.8, () => { });
  }
] };
