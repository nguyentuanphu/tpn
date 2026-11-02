// Nian, the New Year Monster (Quái thú Niên): the shaggy monster comes down from the mountains on New Year's Eve, the
// villagers hide, the wise old man finds out it fears red, bright lights and loud noises, red paper, lanterns and
// big bangs, Nian runs away, and the red and the dragon dances of Lunar New Year. Nian is more silly than scary. The
// child helps twice: lighting the lanterns (page 4) and the dragon dance (page 6).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, go, hop, turn, speak, VILLAGER, ELDER, chinaVillage, firecrackers, serpent, slither } from './kit.js';

const OLD = LOOK({ style: 'tunic', color: '#c62f2f', hairStyle: 'short', hair: '#f4f4f4', skin: '#e8b890' });
// Nian: a big shaggy round monster with one horn, little legs and a silly grin
const monster = () => {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const parts = [P(new THREE.SphereGeometry(1.2, 16, 12), '#5a7a8a', [0, 1.5, 0])];
  for (let i = 0; i < 26; i++) { const a = i * 2.39, e = (i % 7) / 7 - .4; parts.push(P(new THREE.ConeGeometry(.22, .6, 5), '#4a6a7a', [Math.cos(a) * 1.15 * Math.cos(e), 1.5 + Math.sin(e) * 1.15, Math.sin(a) * 1.15 * Math.cos(e)], [Math.sin(a), 0, -Math.cos(a)])); }
  parts.push(P(new THREE.ConeGeometry(.18, .7, 6), '#ffd23f', [0, 2.8, .2]), ...[-1, 1].flatMap(s => [P(new THREE.SphereGeometry(.24, 10, 8), '#ffffff', [s * .4, 1.9, 1]), P(new THREE.SphereGeometry(.12, 8, 6), '#1a1a1a', [s * .4, 1.92, 1.18])]),
    P(new THREE.BoxGeometry(.9, .14, .1), '#3a1a1a', [0, 1.3, 1.12]), ...[-.3, 0, .3].map(x => P(new THREE.ConeGeometry(.06, .16, 4), '#ffffff', [x, 1.38, 1.15], [PI, 0, 0])),
    ...[-1, 1].flatMap(s => [P(new THREE.CylinderGeometry(.18, .2, .6, 8), '#4a6a7a', [s * .55, .3, 0])]));
  body.add(mesh(parts)); g.userData.body = body;
  return g;
};
const red = (S, x, z) => S.add(mesh([P(new THREE.BoxGeometry(.6, .9, .02), '#e8332a', [0, 0, 0]), P(new THREE.BoxGeometry(.3, .3, .025), '#ffd23f', [0, 0, 0], [0, 0, PI / 4])]), x, 1.6, z);
const nightVillage = S => { chinaVillage(S); S.sky('#141a44', '#34406e'); S.light(.45, .55); };

export default { pages: [
  // 1. Long ago, a shaggy monster called Nian came down from the mountains every New Year's Eve.
  S => {
    nightVillage(S);
    const n = monster(); S.add(n, 0, 0, -30);
    S.shot([0, 2, 10], [0, 2, -10]);
    S.move(n, .3, 5, [0, 0, -6], k => k); S.tw(.3, 5, k => { n.userData.body.position.y = Math.abs(Math.sin(k * PI * 10)) * .3; }, k => k);
    S.cam(.3, 5, [3, 2, 6], [0, 2, -8]);
    S.say(6, 'Stomp, stomp, stomp! Here it came.', 'Thình, thịch, thình! Niên đến rồi.');
    S.cam(6, 2, [0, 1.2, 0], [0, 2, -6]);
    S.at(8.8, () => { });
  },
  // 2. The villagers were scared and hid in their houses.
  S => {
    nightVillage(S);
    const ppl = [VILLAGER('aodai', '#e86a8a', 'none'), VILLAGER('shirt', '#3b6fe0', 'none', 'short'), VILLAGER('dress', '#ffd23f', 'none', 'ponytail')].map((l, i) => S.person(l, -2 + i * 2, 3, PI));
    S.shot([0, 2.4, 9], [0, 1.2, 0]);
    ppl.forEach((a, i) => { S.mood(a, .2, 'o'); S.walk(a, .4 + i * .2, [i ? 7 : -7, -5.4], 3); S.scale(a.o, 2.6 + i * .2, .3, 1, .01); });
    S.cam(.3, 3, [0, 3, 9], [0, 1, -3]);
    S.say(3.8, 'The doors closed, and the windows went dark.', 'Cửa đóng chặt, cửa sổ tắt đèn tối om.');
    S.at(6.8, () => { });
  },
  // 3. A wise old man found out that Nian was afraid of three things: the colour red, bright lights and loud noises.
  S => {
    nightVillage(S);
    const old = S.person(OLD, 0, 1.4, 0), n = monster(); S.add(n, 0, 0, -6);
    S.shot([0, 2.4, 9], [0, 1.6, -2]);
    S.mood(old, .2, 'happy'); S.do(old, .4, 'point', 2); S.cam(.3, 3, [2, 1.6, 4.6], [0, 1.4, 1]);
    S.tw(2.4, 2, k => { n.userData.body.rotation.x = -Math.sin(k * PI) * .3; }); S.cam(2.4, 2, [0, 3, 6], [0, 2, -6]);
    S.say(6.7, 'Red, light, noise! The old man smiled.', 'Màu đỏ, ánh sáng, tiếng ồn! Ông cụ mỉm cười.');
    S.do(old, 6.8, 'cheer', 2); S.cam(6.7, 2.4, [1, 1.4, 4], [0, 1.2, 1.4]);
    S.at(9.6, () => { });
  },
  // 4. So everyone hung red paper, lit lanterns and made big bangs!
  S => {
    nightVillage(S);
    const ppl = [VILLAGER('aodai', '#e86a8a', 'none'), VILLAGER('shirt', '#3b6fe0', 'none', 'short')].map((a, i) => S.person(a, -1.6 + i * 3.2, 1.4, i ? -.6 : .6));
    const papers = [[-7, -5.2], [7, -5.2], [-3, -4.6], [3, -4.6]].map(([x, z]) => { const r = red(S, x, z); r.visible = false; return r; });
    const lanterns = [[-3, 2.6, -4.6], [3, 2.6, -4.6]];
    S.shot([0, 2.6, 10], [0, 1.4, -2]);
    papers.forEach((p, i) => S.show(p, .4 + i * .5)); ppl.forEach(a => S.do(a, .4, 'stretch', 2));
    S.cam(.3, 3, [0, 2, 7], [0, 1.6, -4]);
    S.help(5.4, 'Tap to make it bright and loud!', 'Chạm để thắp đèn và đốt pháo nào!', tt => {
      S.lightTo(tt, .6, 1, 1); const fc = firecrackers(); S.add(fc, 0, 2.2, 0); const sp = Pp.sparkle('#ffd23f'); S.add(sp, 0, .4, 0); S.show(sp, tt);
      const fw = Pp.fireworks(S, 0, 8, -10); S.show(fw, tt + .4); ppl.forEach(a => { S.mood(a, tt, 'happy'); S.do(a, tt + .3, 'cheer', 1.6); });
      S.cam(tt, 2, [0, 3, 10], [0, 3, -4]);
    }, [0, 1.6, -4.6], 2.3);
  },
  // 5. Nian ran away and never came back.
  S => {
    chinaVillage(S);
    const n = monster(); S.add(n, 0, 0, -4); [[-7, -5.2], [7, -5.2]].forEach(([x, z]) => red(S, x, z));
    const fw = Pp.fireworks(S, 0, 8, -10); fw.visible = true;
    S.shot([0, 2.4, 9], [0, 1.6, -3]);
    S.tw(.3, .6, k => { n.userData.body.position.y = Math.sin(k * PI) * 1; }); turn(S, n, 1, PI, .5);
    S.move(n, 1.6, 2.4, [0, 0, -40], k => k * k); S.tw(1.6, 2.4, k => { n.userData.body.position.y = Math.abs(Math.sin(k * PI * 8)) * .4; }, k => k);
    S.cam(.3, 3, [3, 2, 6], [0, 2, -10]);
    S.say(4.2, 'Bye-bye, Nian! Happy New Year!', 'Tạm biệt Niên! Chúc mừng năm mới!');
    S.at(6.8, () => { });
  },
  // 6. That is why we see red, lanterns and dragon dances at Lunar New Year!
  S => {
    nightVillage(S); [[-7, -5.2], [7, -5.2]].forEach(([x, z]) => red(S, x, z));
    const fw = Pp.fireworks(S, 4, 9, -12); fw.visible = true; S.lightTo(0, .1, .9, .9);
    const kids = [VILLAGER('dress', '#ff7eb8', 'none', 'buns'), VILLAGER('shirt', '#43c463', 'none', 'spiky')].map((l, i) => S.person(l, -2 + i * 4, 3.6, PI, .75));
    S.shot([0, 2.4, 10], [0, 1.4, 0]);
    S.cam(.3, 3, [0, 2, 8], [0, 1.4, 0]);
    S.help(5.6, 'Tap to start the dragon dance!', 'Chạm để múa rồng nào!', tt => {
      const d = serpent(S, { n: 22, r: .4, colors: ['#e8332a', '#ffd23f'], head: '#e8332a', horns: true, y: 1.2, waveAmp: 1.2 }); d.userData.lay(-8, 0, H);
      slither(S, d, tt, 2.2, [6, 1.2, 0], .4); kids.forEach(k => { S.mood(k, tt, 'happy'); S.do(k, tt + .4, 'cheer', 1.6); });
      S.cam(tt, 2.2, [0, 3, 9], [1, 1, 0]);
    }, [0, 1.4, 0], 2.3);
  }
] };
