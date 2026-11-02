// Sọ Dừa (Coconut-Shell Boy): the round baby with no arms or legs, the goats he looks after, the flute when nobody looks,
// the kind youngest daughter, the shell taken off, the great exam, "what is inside matters most". The child helps
// twice: the goats (page 2) and the coconut shell (page 4).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, hop, speak, go, VILLAGER, ELDER, KID, village, animal, basket } from './kit.js';

const MOM = ELDER('aodai', '#7a5a4a', '#5a4a40');
const RICH = LOOK({ style: 'tunic', color: '#7a3a8a', hat: 'silkcap', hairStyle: 'short', skin: '#e0aa80' });
const BOY = LOOK({ style: 'tunic', color: '#3a7ac8', hairStyle: 'short', skin: '#e0aa80' });
const SCHOLAR = LOOK({ style: 'tunic', color: '#c62f2f', hat: 'silkcap', skin: '#e0aa80' });
const YOUNGEST = LOOK({ style: 'aodai', color: '#ffd0e4', hairStyle: 'long', skin: '#f0c098' });
// the coconut-shell boy: a round brown coconut with a little face
const coconut = (s = 1) => { const g = new THREE.Group(); const m = mesh([P(new THREE.SphereGeometry(.4, 16, 12), '#8a5a32', [0, .4, 0]), ...[-1, 1].flatMap(k => [P(new THREE.SphereGeometry(.07, 8, 6), '#ffffff', [k * .13, .5, .35]), P(new THREE.SphereGeometry(.04, 6, 5), '#1a1a1a', [k * .13, .5, .41])]), P(new THREE.BoxGeometry(.12, .025, .02), '#4a2a1a', [0, .36, .39]), P(new THREE.SphereGeometry(.05, 6, 5), '#6a4a2a', [0, .8, 0])]); g.add(m); g.scale.setScalar(s); return g; };
const halfShell = () => mesh([P(new THREE.SphereGeometry(.4, 14, 8, 0, PI * 2, 0, PI / 2), '#8a5a32', [0, 0, 0])]);
const flute = () => mesh([P(new THREE.CylinderGeometry(.025, .025, .55, 6), '#c9a25a', [0, 0, 0], [0, 0, H])]);

export default { pages: [
  // 1. A poor woman had a baby who looked like a round coconut shell, with no arms or legs. She called him Sọ Dừa.
  S => {
    village(S, { house: [0, -5] });
    const mom = S.person(MOM, -1, 1.8, .3), co = coconut(.6); S.add(co, .6, 0, 2.2);
    S.shot([0, 2, 7.6], [0, 1, 1.6]);
    S.do(mom, .3, 'kneel', 3); S.mood(mom, .3, 'happy'); S.cam(.3, 3.6, [-1, 1.6, 5], [0, .6, 2]);
    S.tw(1.4, 3, k => { co.rotation.y = Math.sin(k * PI * 4) * .4; }, k => k);
    speak(S, mom, 4.4, 2.2); S.do(mom, 6.6, 'hug', 1.6);
    S.say(8.2, 'The little coconut rolled and hopped all around the house.', 'Chú bé sọ dừa lăn lóc, nhảy tưng tưng khắp nhà.');
    S.move(co, 8.2, 1, [2.2, 0, 3]); hop(S, co, 9.2, 3, .5); S.mood(mom, 8.4, 'happy'); S.do(mom, 9, 'cheer', 1.6);
    S.cam(8.2, 2.4, [2, 1.8, 7], [1.4, .6, 2.6]);
    S.at(11, () => { });
  },
  // 2. Sọ Dừa asked to look after a rich man's goats. Everyone laughed, but the goats grew fat and happy!
  S => {
    village(S, { house: [-8, -8] });
    const rich = S.person(RICH, -3, 1, .6), co = coconut(.6); S.add(co, 0, 0, 2);
    const goats = [0, 1, 2, 3].map(i => animal(S, 'sheep', 2 + i * 1.2, 3 + (i % 2), PI * .8, .7));
    S.shot([0, 2.6, 9], [0, 1, 1.6]);
    speak(S, rich, .3, 2); S.do(rich, 2.4, 'cheer', 1.8); S.mood(rich, 2.4, 'happy');
    hop(S, co, .6, 2, .4); S.cam(.3, 3, [-1, 2, 6.4], [-1, 1, 1.4]);
    goats.forEach((g, i) => go(S, g, 4 + i * .2, 3, [6 + i * 1.2, 0, -1 + (i % 2)]));
    S.move(co, 4.2, 3, [5, 0, 1.6]); S.cam(4, 3, [3, 3, 9], [5, .6, 1]);
    S.help(7.6, 'Tap to make the goats happy!', 'Chạm để đàn dê vui nào!', tt => {
      goats.forEach((g, i) => { S.scale(g, tt + i * .15, .8, .7, 1, undefined); hop(S, g, tt + .8 + i * .15, 2, .3); });
      hop(S, co, tt + .5, 3, .5); S.mood(rich, tt, 'o');
      S.cam(tt, 1.6, [6, 2.2, 7], [6, .6, 0]);
    }, [6.6, .6, -.6], 2.3);
  },
  // 3. The youngest daughter saw that Sọ Dừa was really a handsome boy who played the flute when no one was looking.
  S => {
    village(S, { house: null }); S.sky('#f2a86a', '#ffe0b8'); S.light(.8, .8);
    L.banyan(S, -3, -1, .8);
    const boy = S.person(BOY, 1.4, 1.2, -.4), shell = halfShell(); S.add(shell, 2.4, 0, 1.8); boy.o.visible = false;
    const co = coconut(.6); S.add(co, 1.4, 0, 1.2);
    const girl = S.person(YOUNGEST, -3.4, 1.4, .8);
    const fl = flute(); S.grab(boy, 0, fl, [0, -.45, .2], 'armR');
    S.shot([0, 2.2, 8], [0, 1.2, 1]);
    const sp = Pp.sparkle('#ffe27a'); S.add(sp, 1.4, .2, 1.2); S.show(sp, .8);
    S.at(1.4, () => { co.visible = false; boy.o.visible = true; }); S.do(boy, 1.6, 'point', 4); S.mood(boy, 1.6, 'happy');
    S.cam(.4, 2.6, [2.6, 1.8, 5], [1.4, 1.4, 1.2]);
    S.mood(girl, 3, 'o'); S.walk(girl, 3.4, [-2.2, 1.6], .6); S.cam(3.4, 2.4, [-3, 1.8, 5], [-1, 1.2, 1.2]);
    S.say(6.6, 'His music was so sweet that the birds came to listen.', 'Tiếng sáo hay đến nỗi chim chóc bay về nghe.');
    [0, 1, 2].forEach(i => { const b = Pp.bird(['#ffd23f', '#3cc7e8', '#ff7eb8'][i]); S.add(b, -8 + i, 5, -4); S.move(b, 6.6 + i * .2, 2.4, [.4 + i * .5, 2.6 + i * .2, 0]); S.at(9 + i * .2, () => { b.userData.flap = .1; }); });
    S.mood(girl, 7, 'happy'); S.cam(6.6, 2.6, [0, 2.6, 7.4], [.4, 1.6, .6]);
    S.at(9.6, () => { });
  },
  // 4. She was kind to him and brought him food. They got married, and he took off his coconut shell for ever!
  S => {
    village(S, { house: [0, -6] }); L.lantern(S, -2.4, 3, -3.2); L.lantern(S, 2.4, 3, -3.2, '#ffd23f');
    const girl = S.person(YOUNGEST, -4, 2.4, H), co = coconut(.6); S.add(co, 1, 0, 2);
    const boy = S.person(BOY, 1, 2, 0); boy.o.visible = false;
    const b = basket(); S.grab(girl, 0, b, [0, -.5, .2]);
    S.shot([0, 2.2, 8], [0, 1, 2]);
    let t = S.walk(girl, .3, [.1, 2.2]); S.do(girl, t, 'give', 1.4); S.mood(girl, t, 'happy');
    S.drop(b, t + 1, [.6, 0, 2.6]); hop(S, co, t + 1, 2, .4);
    S.cam(.3, 3, [-1, 1.8, 6], [0, .8, 2.2]);
    S.help(7, 'Tap to help him take off his coconut shell!', 'Chạm để chàng bỏ lốt sọ dừa nào!', tt => {
      const h1 = halfShell(), h2 = halfShell(); S.add(h1, 1, .4, 2); S.add(h2, 1, .4, 2); h2.rotation.x = PI;
      S.at(tt, () => { co.visible = false; boy.o.visible = true; });
      S.move(h1, tt, .8, [2.4, 0, 2.6], undefined, .6); S.move(h2, tt, .8, [-.4, .4, 3], undefined, .6);
      const sp = Pp.sparkle('#ffe27a'); S.add(sp, 1, .2, 2); S.show(sp, tt);
      S.mood(boy, tt, 'happy'); S.face(boy, tt + .3, [.1, 2.2]); S.do(boy, tt + .8, 'hug', 1.4); S.do(girl, tt + .8, 'hug', 1.4);
      S.cam(tt, 1.4, [1.6, 1.8, 6], [.6, 1.2, 2]);
    }, [1, .4, 2], 2.3);
  },
  // 5. Sọ Dừa studied hard and became the best student in the land.
  S => {
    village(S, { house: [0, -6], paddy: false });
    const boy = S.person(BOY, 0, 1.6, 0), sch = S.person(SCHOLAR, 0, 1.6, 0); sch.o.visible = false;
    const table = Pp.table(); S.add(table, 0, 0, 2.4);
    const book = mesh([P(new THREE.BoxGeometry(.5, .06, .36), '#f4ecd8', [0, 0, 0]), P(new THREE.BoxGeometry(.52, .04, .38), '#c62f2f', [0, -.04, 0])]); S.add(book, 0, .48, 2.4);
    const lamp = mesh([P(new THREE.CylinderGeometry(.08, .1, .12, 8), '#c9a25a', [0, .06, 0]), P(new THREE.SphereGeometry(.05, 6, 5), '#ffcf33', [0, .16, 0])]); S.add(lamp, .5, .46, 2.3);
    S.shot([0, 2, 6], [0, 1, 2]);
    S.do(boy, .2, 'kneel', 3); S.skyTo(.4, 1.6, '#141a44', '#34406e'); S.lightTo(.4, 1.6, .4, .5);
    S.cam(.2, 2.6, [1.4, 1.4, 4.6], [0, .8, 2.2]);
    S.say(4.1, 'He read by the lamp every night, and passed the great exam.', 'Đêm nào chàng cũng học bên ngọn đèn, rồi thi đỗ trạng nguyên.');
    S.skyTo(4.4, 1.4, '#7cc8f0', '#e8f6ff'); S.lightTo(4.4, 1.4, 1.05, .85);
    S.at(5.6, () => { boy.o.visible = false; sch.o.visible = true; table.visible = false; book.visible = false; lamp.visible = false; });
    S.mood(sch, 5.6, 'happy'); S.do(sch, 5.8, 'cheer', 2);
    const fans = [VILLAGER('aodai', '#e86a8a'), VILLAGER('shirt', '#3b6fe0', 'nonla', 'short')].map((l, i) => S.person(l, i ? 2.6 : -2.6, 3.4, i ? -2.6 : 2.6));
    fans.forEach(f => { S.do(f, 6, 'cheer', 1.8); S.mood(f, 6, 'happy'); });
    S.cam(5.4, 2, [0, 2.4, 8], [0, 1.2, 2.2]);
    S.at(8, () => { });
  },
  // 6. Do not judge by how someone looks: what is inside matters most.
  S => {
    village(S, { house: [0, -6] });
    const co = coconut(.6); S.add(co, -1.4, 0, 2);
    const boy = S.person(SCHOLAR, 1.4, 1.8, -.3), kids = [KID('dress', '#ff7eb8', 'buns'), KID('shirt', '#43c463', 'spiky')].map((l, i) => S.person(l, i ? .8 : -.4, 3.6, PI, .7));
    S.shot([0, 2.2, 7.6], [0, .8, 2]);
    kids.forEach((k, i) => { S.do(k, .4, 'point', 1.6); S.mood(k, .4, 'o'); });
    S.cam(.3, 2.4, [-2, 1.4, 5], [-1.2, .5, 2]);
    S.at(2.6, () => { co.visible = false; }); const sp = Pp.sparkle('#ffe27a'); S.add(sp, -1.4, .2, 2); S.show(sp, 2.6);
    kids.forEach(k => { S.face(k, 3, [1.4, 1.8]); S.mood(k, 3.2, 'happy'); S.do(k, 3.4, 'cheer', 1.4); });
    S.do(boy, 3, 'wave', 1.6); S.mood(boy, 3, 'happy'); S.cam(2.8, 2, [1, 1.8, 6.4], [.8, 1, 2.2]);
    S.say(5, 'Be kind to everyone, whatever they look like.', 'Hãy tốt với mọi người, dù họ trông thế nào.');
    kids.forEach((k, i) => S.walk(k, 5.2, [.5 + i * .9, 2.7], .8)); S.do(boy, 6.4, 'hug', 1.6);
    S.at(8, () => { });
  }
] };
