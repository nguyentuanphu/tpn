// Ma Liang and the Magic Paintbrush (Thần bút Mã Lương): drawing with a stick in the sand, the old man's shining brush,
// a painted bird flies away, buckets, ploughs and an ox for the farmers, the greedy king's sea and the big wind, and
// a brush used to help people. The child helps twice: the bird comes alive (page 3) and the big wind (page 5).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, go, hop, speak, BUT, VILLAGER, chinaVillage, seaside, animal, bird, brush, afloat, board } from './kit.js';

const MA = LOOK({ style: 'shirt', color: '#4a8ac8', hairStyle: 'short', skin: '#e8b890' });
const GREEDY = LOOK({ style: 'tunic', color: '#7a3a8a', hat: 'crown', skin: '#e0aa80' });
// a drawing on a flat card (a bird, a bucket…) that can come alive
const drawing = (c) => { const m = mesh([P(new THREE.BoxGeometry(.9, .02, .7), '#fbf3e4', [0, .01, 0]), P(new THREE.BoxGeometry(.4, .025, .2), c, [0, .02, 0]), P(new THREE.BoxGeometry(.1, .025, .3), c, [-.2, .02, 0])]); return m; };
const bucket = () => mesh([P(new THREE.CylinderGeometry(.22, .17, .35, 10), '#8a6a4a', [0, .18, 0]), P(new THREE.TorusGeometry(.2, .015, 4, 12, PI), '#5a4a3a', [0, .4, 0])]);
const plough = () => mesh([P(new THREE.BoxGeometry(.1, .1, 1.4), '#8a5a32', [0, .4, 0], [.4, 0, 0]), P(new THREE.ConeGeometry(.12, .4, 4), '#9aa0a8', [0, .1, .6], [H, 0, 0])]);

export default { pages: [
  // 1. Ma Liang loved to paint, but he was too poor to buy a brush. He drew with sticks in the sand.
  S => {
    chinaVillage(S); S.add(mesh([P(new THREE.CylinderGeometry(2, 2, .02, 20), '#e8d4a0', [0, .01, 0])]), 0, 0, 2.6);
    const ma = S.person(MA, -.6, 2, .6), st = mesh([P(new THREE.CylinderGeometry(.02, .02, .7, 5), '#8a5a32', [0, -.2, .1])]); S.grab(ma, 0, st, [0, -.5, .1]);
    const lines = Array.from({ length: 8 }, (_, i) => { const l = mesh([P(new THREE.BoxGeometry(.5, .02, .04), '#8a6a3a', [0, .02, 0])]); l.visible = false; return S.add(l, .2 + Math.cos(i) * .5, 0, 2.8 + Math.sin(i * 1.6) * .5, i); });
    S.shot([0, 2.6, 7], [0, .4, 2.4]);
    S.do(ma, .3, 'kneel', 6); lines.forEach((l, i) => S.show(l, .6 + i * .5)); S.mood(ma, .3, 'happy');
    S.cam(.3, 4, [.6, 2.4, 4.4], [.2, 0, 2.8]);
    S.say(6.9, 'He drew birds, fish and flowers, every single day.', 'Ngày nào cậu cũng vẽ chim, vẽ cá, vẽ hoa.');
    S.cam(6.8, 2.6, [-2, 1.6, 5], [0, .6, 2.4]);
    S.at(9.8, () => { });
  },
  // 2. One night a kind old man gave him a shining paintbrush.
  S => {
    chinaVillage(S); S.sky('#141a44', '#34406e'); S.light(.45, .55);
    const ma = S.person(MA, 0, 2, PI * .1), old = S.person(BUT, 2, 1, -.8); old.o.scale.setScalar(.01);
    const b = brush(); S.add(b, 1.6, 1.2, 1.4); b.visible = false; const sp = Pp.sparkle('#ffe27a'); S.add(sp, 2, .4, 1);
    S.shot([0, 2, 7], [1, 1.2, 1.4]);
    S.show(sp, .4); S.scale(old.o, .6, 1, .01, 1); S.mood(ma, 1, 'o'); S.show(b, 2); S.do(old, 2, 'give', 1.6);
    S.cam(.3, 3, [1, 1.6, 4.6], [1, 1.2, 1.4]);
    S.say(4.5, 'The brush glowed like a little star.', 'Cây bút sáng lấp lánh như một ngôi sao nhỏ.');
    S.grab(ma, 4.5, b, [0, -.5, .1]); S.mood(ma, 4.6, 'happy'); S.do(ma, 4.8, 'cheer', 1.8); S.cam(4.4, 2, [0, 1.4, 4], [0, 1.2, 2]);
    S.at(7.4, () => { });
  },
  // 3. Whatever Ma Liang painted came alive! He painted a bird, and it flew away singing.
  S => {
    chinaVillage(S);
    const ma = S.person(MA, -.8, 2, .5), b = brush(); S.grab(ma, 0, b, [0, -.5, .1]);
    const card = drawing('#3cb0e8'); S.add(card, .4, 0, 2.8);
    S.shot([0, 2, 6], [0, .5, 2.6]);
    S.do(ma, .3, 'kneel', 4); S.cam(.3, 3, [.6, 1.6, 4.4], [.4, 0, 2.8]);
    S.help(6.9, 'Tap to bring the bird to life!', 'Chạm để chú chim sống dậy nào!', tt => {
      const bd = Pp.bird('#3cb0e8'); bd.scale.setScalar(1.6); S.add(bd, .4, .1, 2.8); const sp = Pp.sparkle('#ffe27a'); S.add(sp, .4, 0, 2.8); S.show(sp, tt);
      S.move(bd, tt + .2, 2, [4, 4, -4], undefined, 1); S.mood(ma, tt, 'happy'); S.do(ma, tt + .6, 'wave', 1.4);
      S.cam(tt, 2, [0, 1.6, 6], [1, 2, 0]);
    }, [.4, .2, 2.8], 2.3);
  },
  // 4. He painted buckets, ploughs and oxen for the poor farmers in his village.
  S => {
    chinaVillage(S); L.paddy(S, 8, 3, 8, 6);
    const ma = S.person(MA, 0, 2.6, 0), b = brush(); S.grab(ma, 0, b, [0, -.5, .1]);
    const farmer = S.person(VILLAGER('shirt', '#8a6a4a', 'nonla', 'short'), 2.6, 3.4, -1.2);
    const bk = bucket(), pl = plough(); S.add(bk, -1.4, 0, 4); S.add(pl, 1.2, 0, 4.4); bk.visible = false; pl.visible = false;
    const ox = animal(S, 'buffalo', 4, 1.6, -H); ox.visible = false;
    S.shot([0, 2.6, 10], [1, 1, 3]);
    S.do(ma, .2, 'swing', 1); S.show(bk, 1.2); S.do(ma, 1.6, 'swing', 1); S.show(pl, 2.6); S.do(ma, 3, 'swing', 1); S.show(ox, 4);
    S.cam(.3, 4, [1, 2, 8], [1.4, .6, 3]);
    S.say(5.4, 'The farmers cheered: "Thank you, Ma Liang!"', 'Bà con reo lên: "Cảm ơn Mã Lương!"');
    S.mood(farmer, 5.4, 'happy'); S.do(farmer, 5.5, 'cheer', 2); S.cam(5.4, 2.4, [4, 2, 7], [3, .8, 2.6]);
    S.at(8.2, () => { });
  },
  // 5. A greedy king wanted gold. Ma Liang painted a sea and a boat, then a big wind that blew the greedy king far away.
  S => {
    seaside(S);
    const ma = S.person(MA, -2, 9, -.4), b = brush(); S.grab(ma, 0, b, [0, -.5, .1]);
    const boat = afloat(S, Pp.boat(5, '#e8b62a'), 2, 3, H), king = S.person(GREEDY, 0, 0, 0); board(king, boat.children[0], [0, .4, -.6], 0);
    S.shot([-4, 3, 14], [0, 1.4, 4]);
    speak(S, king, .3, 2.4); S.do(king, .3, 'point', 2.4); S.mood(king, .3, 'happy');
    S.cam(.3, 3, [-3, 2.4, 11], [1, 1.4, 4]);
    S.do(ma, 3.4, 'swing', 2); S.move(boat, 3.6, 3.4, [2, -.3, -4], k => k);
    S.help(9, 'Tap to paint a big wind!', 'Chạm để vẽ một cơn gió to nào!', tt => {
      const wind = Pp.sparkle('#ffffff'); S.add(wind, 2, 2, 0); S.show(wind, tt);
      S.move(boat, tt, 2, [6, -.3, -40], k => k * k); S.do(king, tt, 'surprised', 2); S.mood(king, tt, 'o');
      S.cam(tt, 2, [-2, 4, 14], [2, 1, -16]);
    }, [2, 1, -4], 2.3);
  },
  // 6. Ma Liang kept using his brush to help people. Our talents are best when we share them.
  S => {
    chinaVillage(S);
    const ma = S.person(MA, 0, 2, 0), b = brush(); S.grab(ma, 0, b, [0, -.5, .1]);
    const kids = [VILLAGER('dress', '#ff7eb8', 'none', 'buns'), VILLAGER('shirt', '#43c463', 'none', 'spiky'), VILLAGER('aodai', '#ffd23f', 'none', 'long')].map((l, i) => S.person(l, -2 + i * 2, 4, PI, .75));
    S.shot([0, 2.4, 9], [0, 1, 2.6]);
    kids.forEach((k, i) => { S.mood(k, 0, 'happy'); S.do(k, .4 + i * .3, 'cheer', 1.8); }); S.do(ma, .3, 'swing', 2);
    S.cam(.3, 3.4, [0, 1.8, 7], [0, 1, 3]);
    S.say(6.4, 'Every picture he made was a gift for someone.', 'Mỗi bức tranh cậu vẽ là một món quà cho ai đó.');
    const kites = [0, 1, 2].map(i => { const k = mesh([P(new THREE.BoxGeometry(.6, .6, .02), ['#e8332a', '#ffd23f', '#3cb0e8'][i], [0, 0, 0], [0, 0, PI / 4])]); k.visible = false; return S.add(k, -2 + i * 2, 1.4, 4); });
    kites.forEach((k, i) => { S.show(k, 6.6 + i * .2); S.move(k, 6.6 + i * .2, 2.4, [-3 + i * 3, 5, 1]); }); S.cam(6.4, 2.6, [0, 1.4, 9], [0, 3, 2]);
    S.at(9.4, () => { });
  }
] };
