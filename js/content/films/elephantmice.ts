// The Elephants and the Mice (Đàn voi và bầy chuột), from the Panchatantra: the mice in the old ruined town, the
// elephants walk through on the way to the lake, the mouse king asks kindly, the elephant king laughs but agrees, the
// hunters' nets, and the mice chew every rope. The hunters are never shown, only their nets. The child helps twice:
// the elephants take the other path (page 4) and the mice chew the ropes (page 6).
import { L, Pp, THREE, P, mesh, PI, H, go, hop, turn, plain, animal, mouse } from './kit.js';

// the old ruined town: broken walls and arches of pale stone
const ruins = S => { plain(S); [[-5, -3, .3], [4, -4, -.2], [-1, -7, 0], [7, 1, .6]].forEach(([x, z, r], i) => S.add(mesh([P(new THREE.BoxGeometry(3, 1.4 + (i % 2), .5), '#d8c8a8', [0, .7, 0]), P(new THREE.BoxGeometry(.6, 2.4, .6), '#c8b898', [-1.2, 1.2, 0]), P(new THREE.BoxGeometry(.6, 2, .6), '#c8b898', [1.2, 1, 0])]), x, 0, z, r)); };
const family = (S, n = 6, x = 0, z = 2) => Array.from({ length: n }, (_, i) => { const m = mouse(i === 0 ? '#c8c0b0' : '#9a9aa8'); S.add(m, x - 1.2 + (i % 3) * .8, 0, z + (i >> 1) * .4 - .4); return m; });
const herd = (S, n = 3, x = -12, z = 0) => Array.from({ length: n }, (_, i) => animal(S, 'elephant', x - i * 3, z + (i % 2), H, 1.6 - i * .15));
const net = S => { const n = Pp.net(3.4, 2.4); n.rotation.x = -.2; return n; };

export default { pages: [
  // 1. In an old ruined town in India lived a big family of mice.
  S => {
    ruins(S); const ms = family(S);
    S.shot([0, 1.6, 6], [0, .3, 1.6]);
    ms.forEach((m, i) => hop(S, m, .3 + i * .2, 2, .2, .4)); S.cam(.3, 3, [1.4, 1, 4.4], [0, .3, 1.8]);
    S.say(4.6, 'They had little homes in every crack and corner.', 'Chúng làm tổ trong từng kẽ đá, góc tường.');
    ms.forEach((m, i) => go(S, m, 4.7 + i * .1, 1, [-5 + i * .4, 0, -2.4])); S.cam(4.6, 2.4, [-2, 2, 4], [-4, .4, -2]);
    S.at(7.2, () => { });
  },
  // 2. Every day a herd of elephants walked through on the way to the lake, and squashed the mice's homes.
  S => {
    ruins(S); const ms = family(S, 5, 0, 1.6), el = herd(S);
    S.shot([0, 3, 12], [0, 1, 0]);
    el.forEach((e, i) => go(S, e, .3 + i * .5, 5, [12 - i * 3, 0, i % 2], k => k));
    ms.forEach((m, i) => go(S, m, 1 + i * .1, .8, [-1.6 + i * .8, 0, 4.6]));
    S.cam(.3, 5, [0, 2, 10], [0, 1, 0]);
    S.say(5.9, 'Boom, boom! The ground shook, and the mice ran.', 'Thình thịch! Mặt đất rung lên, lũ chuột chạy tán loạn.');
    S.cam(5.9, 2.4, [2, 1, 7], [0, .4, 3]);
    S.at(8.6, () => { });
  },
  // 3. The mouse king asked the elephant king kindly: "Please take another path. One day we may help you."
  S => {
    ruins(S); const king = mouse('#e8e0c8'); king.scale.setScalar(1.4); S.add(king, 0, 0, 2, PI);
    const el = animal(S, 'elephant', 0, -1, 0, 1.8);
    S.shot([3, 1, 5], [0, 1, 0]);
    S.tw(.3, 5, k => { king.userData.nod = Math.sin(k * PI * 8) * .2; }, k => k); S.cam(.3, 3, [1.4, .5, 3.6], [0, .4, 2]);
    S.cam(3.6, 2.4, [2, 1.6, 5], [0, 2, 0]);
    S.say(7.4, 'The mouse king bowed very low.', 'Vua chuột cúi chào thật thấp.');
    S.tw(7.5, 1.4, k => { king.userData.nod = Math.sin(k * PI) * .6; }); S.at(9.8, () => { });
  },
  // 4. The elephant king laughed, but he agreed and took another path.
  S => {
    ruins(S); const king = mouse('#e8e0c8'); king.scale.setScalar(1.4); S.add(king, 0, 0, 2, PI);
    const el = herd(S, 3, 0, -1); el.forEach(e => { e.rotation.y = 0; });
    S.shot([3, 1.6, 7], [0, 1.4, 0]);
    S.tw(.3, 1.6, k => { el[0].userData.nod = -Math.sin(k * PI * 3) * .3; }); S.cam(.3, 2.4, [2, 2, 5], [0, 2, -1]);
    S.help(4.7, 'Tap to show the elephants the other path!', 'Chạm để chỉ đường khác cho đàn voi nào!', tt => {
      el.forEach((e, i) => go(S, e, tt + i * .3, 2, [-12, 0, -6 - i * 2], k => k)); hop(S, king, tt + .4, 3, .3);
      S.cam(tt, 2.2, [4, 3, 8], [-4, 1, -3]);
    }, [0, 1.6, -1], 2.3);
  },
  // 5. Later, hunters caught the elephants in strong nets. They could not get free!
  S => {
    plain(S); const el = herd(S, 3, 0, 0); el.forEach((e, i) => { e.position.set(-3 + i * 3, 0, -i); e.rotation.y = 0; });
    const nets = el.map(e => { const n = net(S); S.add(n, e.position.x, 3.4, e.position.z + 1); return n; });
    S.shot([0, 2.6, 10], [0, 1.6, 0]);
    S.tw(.3, 5, k => { el.forEach((e, i) => { e.rotation.z = Math.sin(k * 20 + i) * .04; e.userData.nod = Math.sin(k * 14 + i) * .2; }); }, k => k);
    S.cam(.3, 4, [0, 1.6, 7], [0, 1.6, 0]);
    S.say(6, 'The elephant king called out: "Help!"', 'Vua voi kêu lên: "Cứu với!"');
    S.tw(6.1, 1.4, k => { el[1].userData.nod = -Math.sin(k * PI) * .6; }); S.cam(6, 2.4, [2, 2, 5], [0, 2, 0]);
    S.at(8.8, () => { });
  },
  // 6. The mice came running and chewed through every rope. The elephants were free. Even the smallest friend can help!
  S => {
    plain(S); const el = herd(S, 3, 0, 0); el.forEach((e, i) => { e.position.set(-3 + i * 3, 0, -i); e.rotation.y = 0; });
    const nets = el.map(e => { const n = net(S); S.add(n, e.position.x, 3.4, e.position.z + 1); return n; });
    const ms = family(S, 6, 0, 8);
    S.shot([0, 2.6, 11], [0, 1.2, 1]);
    ms.forEach((m, i) => go(S, m, .3 + i * .1, 2.4, [-3 + i * 1.2, 0, 1.6], k => k)); S.cam(.3, 3, [0, 1.6, 8], [0, .6, 2]);
    S.help(7.6, 'Tap to help the mice chew the ropes!', 'Chạm để giúp lũ chuột gặm dây nào!', tt => {
      ms.forEach((m, i) => S.tw(tt, 1, k => { m.userData.nod = Math.sin(k * PI * 8) * .3; }));
      nets.forEach((n, i) => { S.move(n, tt + .8 + i * .2, .8, [n.position.x, -.4, n.position.z + 1.6]); });
      el.forEach((e, i) => S.tw(tt + 1.4, .8, k => { e.userData.nod = -Math.sin(k * PI) * .5; }));
      S.cam(tt, 2, [0, 3, 10], [0, 1.4, 0]);
    }, [0, 1, 1.6], 2.3);
  }
] };
