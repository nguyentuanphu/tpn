// Đeo nhạc cho mèo (Who Will Bell the Cat?): the mice hide from the quiet cat, a young mouse has an idea, everyone
// claps, Grandpa Mouse asks who will do it, nobody answers. The child helps twice: the mice clap (page 3) and the
// mice peek out (page 5).
import { L, Pp, THREE, P, mesh, PI, H, go, hop, turn, flat, mouse, cat, bell } from './kit.js';

// a cosy farmhouse floor: wooden boards, a wall with a mouse hole, a rice sack, a bowl
const room = S => {
  S.sky('#e8c89a', '#fff0d8'); S.add(flat(40, 40, '#c8a070'), 0, 0, 0);
  S.add(mesh([P(new THREE.BoxGeometry(20, 5, .3), '#e8d4b0', [0, 2.5, -3]), P(new THREE.CylinderGeometry(.5, .5, .32, 16, 1, false, 0, PI), '#3a2a1a', [0, 0, -2.84], [H, 0, H])]));
  S.add(Pp.sack(), 3, 0, -2); S.add(Pp.bowl(true), -3, 0, -1.6);
  for (let i = 0; i < 8; i++) S.add(mesh([P(new THREE.BoxGeometry(20, .01, .03), '#a88050', [0, .006, 0])]), 0, 0, -2 + i * 1.2);
};
const mice = (S, n = 5) => Array.from({ length: n }, (_, i) => { const m = mouse(i === 0 ? '#c8c8d4' : i === 1 ? '#b8a898' : '#9a9aa8'); S.add(m, -1.2 + i * .6, 0, -1.4 + (i % 2) * .4); return m; });
// Grandpa Mouse: white fur and a walking stick
const grandpa = S => { const g = mouse('#e8e8ee'); g.scale.setScalar(1.2); g.children[0].add(mesh([P(new THREE.CylinderGeometry(.02, .02, .8, 5), '#8a5a32', [.35, .4, .3])])); return g; };

export default { pages: [
  // 1. The mice were scared of the cat, who always crept up quietly.
  S => {
    room(S);
    const ms = mice(S), c = cat('#f0a050'); S.add(c, 7, 0, 1, -H);
    S.shot([0, 2, 6], [0, .4, -1]);
    go(S, c, .3, 3, [2, 0, 1], k => k);
    S.cam(.3, 2.6, [3, 1.2, 5], [3, .4, 0]);
    ms.forEach((m, i) => { turn(S, m, 3.2, [2, 1]); go(S, m, 3.6 + i * .1, .6, [0, 0, -2.6]); S.scale(m, 4.2 + i * .1, .2, 1, .01); });
    S.say(4.6, 'Whoosh! Into the mouse hole they ran.', 'Vù! Cả bọn chạy tọt vào hang.');
    S.cam(3.4, 2, [0, 1.6, 4], [0, .4, -2]);
    S.at(7.2, () => { });
  },
  // 2. A young mouse said: "Let's tie a bell on the cat! Then we will hear it coming!"
  S => {
    room(S);
    const ms = mice(S), b = bell(); b.scale.setScalar(3); S.add(b, -.6, .9, -.6); b.visible = false;
    S.shot([0, 1.2, 4], [0, .3, -1]);
    hop(S, ms[0], .4, 2, .3); S.cam(.3, 2, [-1, .8, 2], [-1.2, .3, -1.4]);
    ms.slice(1).forEach((m, i) => turn(S, m, 1 + i * .1, [-1.2, -1.4]));
    S.show(b, 3); S.tw(3, 3, k => { b.rotation.z = Math.sin(k * PI * 8) * .4; }, k => k);
    S.say(7.1, 'Ding-a-ling! The bell would ring when the cat came near.', 'Leng keng! Mèo đến gần là nhạc kêu ngay.');
    S.cam(6.8, 2.6, [0, 1, 3], [-.6, .7, -.8]);
    S.at(10.4, () => { });
  },
  // 3. Everyone clapped: "What a great idea!"
  S => {
    room(S);
    const ms = mice(S, 7);
    S.shot([0, 1.4, 4.6], [0, .3, -1]);
    S.cam(.2, 3, [1, 1, 3.6], [0, .3, -1.2]);
    S.help(4.7, 'Tap to clap with the mice!', 'Chạm để vỗ tay cùng các chú chuột nào!', tt => {
      ms.forEach((m, i) => hop(S, m, tt + i * .08, 3, .35, .5));
      const sp = Pp.sparkle('#ffe27a'); S.add(sp, 0, .4, -1.2); S.show(sp, tt);
    }, [0, .4, -1.2], 2.3);
  },
  // 4. Then old Grandpa Mouse asked: "So who will tie the bell on the cat?"
  S => {
    room(S);
    const ms = mice(S), g = grandpa(S); S.add(g, 0, 0, .6, PI);
    S.shot([0, 1.4, 4], [0, .4, -.6]);
    go(S, g, .3, 1.6, [0, 0, -.2]); turn(S, g, 2, 0);
    S.tw(2.4, 2.4, k => { g.userData.nod = Math.sin(k * PI * 4) * .2; }, k => k);
    S.cam(.3, 2.4, [.4, .7, 1.8], [0, .4, -.2]);
    S.say(5.5, 'The mice looked at the cat, then at each other.', 'Lũ chuột nhìn con mèo, rồi nhìn nhau.');
    ms.forEach((m, i) => { turn(S, m, 5.6 + i * .1, [i % 2 ? 4 : -4, 2]); turn(S, m, 6.8 + i * .1, [0, 3]); });
    S.cam(5.4, 2.6, [0, 2, 5], [0, .3, -1.2]);
    S.at(8.6, () => { });
  },
  // 5. Everybody went very quiet and looked at their feet.
  S => {
    room(S);
    const ms = mice(S); ms.forEach(m => { m.userData.nod = .5; });
    const c = cat('#f0a050'); S.add(c, 5, 0, 1.6, -H * .6);
    S.shot([0, 1.2, 4], [0, .3, -1]);
    S.cam(.2, 3, [1.4, .8, 3], [0, .3, -1.2]);
    S.help(4.1, 'Tap to see who is brave!', 'Chạm xem ai dũng cảm nào!', tt => {
      ms.forEach((m, i) => { turn(S, m, tt + i * .1, [5, 1.6]); go(S, m, tt + .6 + i * .1, .6, [-1.2 + i * .6, 0, -2.6]); S.scale(m, tt + 1.2 + i * .1, .2, 1, .01); });
      S.tw(tt, .6, k => { c.userData.nod = -Math.sin(k * PI) * .3; });
      S.cam(tt, 1.6, [2, 1.2, 4], [1.6, .3, -.6]);
    }, [0, .4, -1.2], 2.3);
  },
  // 6. A good idea needs someone brave enough to do it!
  S => {
    room(S);
    const c = cat('#f0a050'); S.add(c, 1.6, 0, .4, -.6); const b = bell(); b.scale.setScalar(2); S.add(b, -1.6, 0, .6);
    const m = mouse('#c8c8d4'); S.add(m, 0, 0, -2.6); m.scale.setScalar(.01);
    S.shot([0, 1.6, 4.6], [0, .4, -.6]);
    S.scale(m, .4, .4, .01, 1); go(S, m, .9, 1.2, [-1.4, 0, .1]);
    S.cam(.3, 2.6, [-.6, 1, 3], [-1, .3, 0]);
    S.say(4, 'Being brave is not easy, but it helps everyone.', 'Dũng cảm không dễ, nhưng giúp được mọi người.');
    hop(S, m, 4.2, 2, .25); S.tw(4.2, 2.4, k => { b.rotation.z = Math.sin(k * PI * 6) * .4; }, k => k);
    S.cam(4, 2.6, [1.4, 1.2, 3.6], [0, .3, 0]);
    S.at(7, () => { });
  }
] };
