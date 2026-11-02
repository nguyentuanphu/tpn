// The Great Race of the Animals (Cuộc đua của mười hai con giáp): the Jade Emperor's race across the river, Rat rides
// on Ox and jumps off first, Tiger, Rabbit on the stones, Dragon who stops to make rain, the rest one by one, Cat
// oversleeps, and in Vietnam the Cat takes the Rabbit's place. The child helps twice: Rat's jump (page 2) and waking
// the Cat (page 5).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, go, hop, turn, speak, river, animal, tiger, rat, monkey, cat, serpent, slither, rain, flat } from './kit.js';

const JADE = LOOK({ style: 'tunic', color: '#ffd23f', hat: 'crown', hairStyle: 'short', hair: '#f4f4f4', skin: '#e8c0a0' });
const finish = (S, x = 0, z = 6) => { const g = new THREE.Group(); g.add(mesh([P(new THREE.CylinderGeometry(.08, .08, 2.4, 6), '#c62f2f', [-2, 1.2, 0]), P(new THREE.CylinderGeometry(.08, .08, 2.4, 6), '#c62f2f', [2, 1.2, 0]), P(new THREE.BoxGeometry(4.2, .5, .06), '#e8b62a', [0, 2.2, 0])])); return S.add(g, x, 0, z); };
const stones = S => [[-3, 0], [-1.6, -1.6], [0, -3.2], [1.4, -4.8]].map(([x, z]) => S.add(mesh([P(new THREE.CylinderGeometry(.5, .6, .4, 8), '#8a8a8a', [0, 0, 0])]), x, -.1, z));
const horse = S => { const h = Pp.horse('#8a5a3a'); h.scale.setScalar(.8); S.add(h); h.userData.gait = 1; return h; };

export default { pages: [
  // 1. The Jade Emperor held a race: the first twelve animals across the river would name the years.
  S => {
    river(S); finish(S, 0, 6);
    const jade = S.person(JADE, 3.4, 7.4, -2.4, 1.2);
    const runners = [rat(), animal(S, 'buffalo', 0, 0, 0), tiger(), animal(S, 'bunny', 0, 0, 0, 1.4), animal(S, 'puppy', 0, 0, 0), animal(S, 'pig', 0, 0, 0)];
    runners.forEach((a, i) => { if (!a.parent) S.add(a); a.position.set(-5 + i * 2, 0, -10); });
    S.shot([0, 3, 14], [0, 1, 4]);
    speak(S, jade, .3, 3.2); S.mood(jade, .3, 'happy'); S.cam(.3, 3, [5, 2.2, 10], [3, 1.6, 7]);
    S.cam(3.6, 2.4, [0, 4, 0], [0, .6, -10]);
    S.say(6.2, 'Ready, steady, go! Into the water they jumped.', 'Chuẩn bị, bắt đầu! Cả đoàn nhảy xuống nước.');
    runners.forEach((a, i) => go(S, a, 6.2 + i * .1, 3, [-5 + i * 2, -.2, -4], k => k));
    S.cam(6.2, 3, [6, 3, 0], [0, 0, -6]);
    S.at(9.4, () => { });
  },
  // 2. Clever Rat rode on kind Ox's back across the river, then jumped off at the end to win!
  S => {
    river(S); finish(S, 0, 6);
    const ox = animal(S, 'buffalo', 0, -6, 0, 1.3), r = rat(); ox.children[0].add(r); r.position.set(0, 1.25, -.1); r.scale.setScalar(1.6);
    S.shot([6, 2, 4], [0, 1, -2]);
    go(S, ox, .3, 5, [0, -.3, 3.6], k => k); S.cam(.3, 5, () => [ox.position.x + 4, 2, ox.position.z + 4], () => [0, 1, ox.position.z]);
    S.help(5.8, 'Tap to make Rat jump!', 'Chạm để Chuột nhảy nào!', tt => {
      S.at(tt, () => { S.root.attach(r); }); S.move(r, tt, .8, [0, 0, 6.4], undefined, 1.6);
      hop(S, r, tt + .9, 2, .3); S.cam(tt, 1.6, [3, 1.6, 9], [0, .6, 5.6]);
    }, [0, 1.6, 3.6], 2.3);
  },
  // 3. Next came Tiger, then Rabbit hopping on stones, then Dragon, who stopped to help make rain.
  S => {
    river(S); finish(S, 0, 6); stones(S);
    const tg = tiger(); S.add(tg, -4, 0, -2); const rb = animal(S, 'bunny', -4.4, 1.2, 0, 1.4);
    const dr = serpent(S, { n: 18, r: .32, colors: ['#43c463', '#ffd23f'], head: '#43c463', horns: true, y: 4, waveAmp: .8 }); dr.userData.lay(-8, -8, H);
    S.shot([0, 4, 14], [0, 1, 0]);
    go(S, tg, .3, 2.4, [3, 0, 6.6], k => k); S.at(.4, () => { rb.position.set(-3, 0, 0); });
    [[-1.6, -1.6], [0, -3.2], [1.4, -4.8]].reverse().forEach(([x, z], i) => { S.move(rb, 1.2 + i * .6, .6, [x, .2, z], undefined, .6); });
    go(S, rb, 3, 1.4, [-1.4, 0, 6.6]);
    S.cam(.3, 3.4, [2, 3, 12], [0, 1, 2]);
    slither(S, dr, 3.6, 2.4, [0, 6, -2], .5); S.skyTo(4.4, 1, '#7a8aa0', '#c8d0d8'); rain(S, 5, 7.2, 8, 8, 14);
    S.say(7, 'The thirsty fields got a drink. Thank you, Dragon!', 'Ruộng đồng khô hạn được tưới mát. Cảm ơn Rồng nhé!');
    S.skyTo(7.2, 1, '#7cc8f0', '#eaf7ff'); slither(S, dr, 7.4, 2, [1, 1, 6.4], .5); S.cam(6.8, 3, [0, 5, 16], [0, 3, 0]);
    S.at(9.8, () => { });
  },
  // 4. Snake, Horse, Goat, Monkey, Rooster, Dog and Pig all arrived one by one.
  S => {
    river(S); finish(S, 0, 6);
    const sn = serpent(S, { n: 12, r: .18, colors: ['#6a8a3a', '#8aa84a'], y: .15 }); sn.userData.lay(-8, 4, H);
    const hs = horse(S); hs.position.set(-10, 0, 4.6); hs.rotation.y = H;
    const others = [animal(S, 'sheep', -12, 5.2, H), monkey(), animal(S, 'chicken', -14, 5.4, H, 1.4), animal(S, 'puppy', -15, 4.6, H), animal(S, 'pig', -16, 5, H)];
    others.forEach((a, i) => { if (!a.parent) S.add(a, -13, 0, 4.8, H); });
    S.shot([0, 2.4, 13], [0, 1, 5]);
    slither(S, sn, .2, 1.4, [-.4, .15, 6.8]);
    go(S, hs, .8, 1.6, [.4, 0, 7.4], k => k);
    others.forEach((a, i) => go(S, a, 1.6 + i * .7, 1.4, [-1.6 + i * .8, 0, 7.6], k => k));
    S.cam(.3, 5.6, [4, 2, 12], [0, .8, 6]);
    S.say(6.8, 'Hooray! Twelve animals, twelve years.', 'Hoan hô! Mười hai con vật, mười hai năm.');
    hop(S, others[2], 7, 3, .3); hop(S, others[4], 7.2, 3, .3); S.cam(6.8, 2.4, [0, 3, 13], [0, 1, 7]);
    S.at(9.6, () => { });
  },
  // 5. Cat overslept and missed the race. That is why cats chase rats!
  S => {
    river(S); L.hut(S, -4, -8, .4);
    const c = cat('#f0a050'); S.add(c, -3, 0, -5); c.userData.nod = .5; const r = rat(); S.add(r, 3, 0, 2, -H);
    S.shot([0, 2, 8], [-2, .6, -4]);
    S.tw(.3, 4, k => { c.scale.set(1, 1 + Math.sin(k * PI * 4) * .04, 1); }); S.cam(.3, 3, [-2, 1.2, -2.4], [-3, .4, -5]);
    S.help(5.6, 'Tap to wake up Cat!', 'Chạm để đánh thức Mèo nào!', tt => {
      S.at(tt, () => { c.userData.nod = 0; }); hop(S, c, tt + .2, 1, .4); go(S, c, tt + .7, 1.6, [2, 0, 1.6], k => k);
      go(S, r, tt + .8, 1.4, [9, 0, 3], k => k); S.cam(tt, 2, [0, 2, 9], [1, .4, 0]);
    }, [-3, .5, -5], 2.3);
  },
  // 6. In Vietnam the years have animals too, but the cat takes the rabbit's place! Which animal is your year?
  S => {
    S.sky('#86c0f0', '#fff4e0'); L.ground(S, '#a8d88a'); L.sun(S, 40, 40, -150, 9);
    const ring = [rat(), animal(S, 'buffalo', 0, 0, 0, .8), tiger(), cat('#f0a050'), null, null, horse(S), animal(S, 'sheep', 0, 0, 0), monkey(), animal(S, 'chicken', 0, 0, 0, 1.3), animal(S, 'puppy', 0, 0, 0), animal(S, 'pig', 0, 0, 0)];
    const dr = serpent(S, { n: 10, r: .2, colors: ['#43c463', '#ffd23f'], horns: true, y: .9 }), sn = serpent(S, { n: 10, r: .14, colors: ['#6a8a3a'], y: .15 });
    ring.forEach((a, i) => { const ang = i / 12 * PI * 2, x = Math.cos(ang) * 4, z = Math.sin(ang) * 4; if (a) { if (!a.parent) S.add(a); a.position.set(x, 0, z); a.rotation.y = Math.atan2(-x, -z); } });
    dr.userData.lay(Math.cos(4 / 12 * PI * 2) * 4, Math.sin(4 / 12 * PI * 2) * 4, 0); sn.userData.lay(Math.cos(5 / 12 * PI * 2) * 4, Math.sin(5 / 12 * PI * 2) * 4, 0);
    S.shot([0, 9, 10], [0, 0, 0]);
    S.tw(.3, 6, k => { S.camPos.set(Math.sin(k * PI * 1.2) * 9, 5, Math.cos(k * PI * 1.2) * 9); }, k => k);
    S.say(7.4, 'Ask your family: which animal is your year?', 'Hỏi ông bà, bố mẹ xem: con tuổi con gì nhé?');
    S.cam(7.4, 2.6, [0, 3, 7], [0, .6, 0]);
    S.at(10.4, () => { });
  }
] };
