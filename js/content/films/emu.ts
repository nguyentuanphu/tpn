// Why the Emu Cannot Fly (Vì sao chim Đà Điểu Emu không bay), told by the Kamilaroi people: Dinewan the emu flies high,
// Goomblegubbon the bush turkey hides her wings and tricks her, Dinewan cuts off her wings and the turkey flies away
// laughing, Dinewan's trick back with the chicks, emus run fast, be happy being yourself. The child helps twice: the
// turkey flies off (page 3) and the emu runs (page 5).
import { L, Pp, THREE, P, mesh, PI, H, go, hop, turn, bush, animal, bird } from './kit.js';

// Dinewan with (or without) her big wings: the valley's emu with two wing pieces that flap
const dinewan = (S, x, z, yaw, wings = true) => {
  const e = animal(S, 'emu', x, z, yaw, 1.4), w = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * .2, .95, 0); p.add(mesh([P(new THREE.BoxGeometry(.9, .05, .5), '#6a5a4a', [s * .45, 0, 0])])); e.children[0].add(p); p.visible = wings; return p; });
  e.userData.wings = w; e.userData.flap = 0;
  S.every((dt, time) => { const f = e.userData.flap; w.forEach((p, i) => { p.rotation.z = (i ? -1 : 1) * (f ? Math.sin(time * 10) * .8 : -.9); }); });
  return e;
};
// Goomblegubbon the bush turkey: a dark bird with a red head, standing (its wings can fold away)
const turkey = (S, x, z, yaw) => { const t = bird('#2a2a30', 3.4); t.userData.flap = 0; S.add(t, x, .4, z, yaw); const head = mesh([P(new THREE.SphereGeometry(.06, 8, 6), '#e8332a', [0, .12, .2])]); t.children[0].add(head); return t; };
const chick = () => { const c = mesh([P(new THREE.SphereGeometry(.14, 10, 8), '#b8a07a', [0, .18, 0]), P(new THREE.SphereGeometry(.08, 8, 6), '#b8a07a', [0, .32, .08])]); return c; };

export default { pages: [
  // 1. This is a story told by the Kamilaroi people. Long ago, Dinewan the emu had big wings and could fly high.
  S => {
    bush(S);
    const e = dinewan(S, -10, 0, H); e.userData.flap = 1; e.position.y = 4;
    S.shot([0, 3, 14], [0, 4, 0]);
    S.move(e, .3, 6, [10, 6, -4], k => k, 2);
    S.cam(.3, 6.4, () => [e.position.x - 2, e.position.y + 1, e.position.z + 9], () => [e.position.x, e.position.y, e.position.z]);
    S.say(8.2, 'She soared over the gum trees, above all the other birds.', 'Emu bay vút trên những hàng cây bạch đàn, cao hơn mọi loài chim.');
    S.move(e, 8.2, 3, [16, 7, -8], k => k, 1);
    S.at(11.4, () => { });
  },
  // 2. Goomblegubbon the bush turkey was jealous. She hid her wings and said: "Look, I don't need wings!"
  S => {
    bush(S);
    const e = dinewan(S, 3, 1, -H), t = turkey(S, -2, 1.4, H);
    S.shot([0, 2.4, 9], [0, 1, 1]);
    S.cam(.3, 3, [-3, 1.6, 5], [-2, 1, 1.4]);
    S.tw(3.4, .8, k => { t.children.slice(1, 3).forEach(w => { w.scale.setScalar(1 - k * .9); }); });
    hop(S, t, 4.4, 2, .3); S.cam(4.2, 2.4, [0, 1.8, 6], [0, 1, 1]);
    S.say(7.7, 'Dinewan looked at her own big wings and wondered.', 'Dinewan nhìn đôi cánh to của mình, băn khoăn.');
    S.tw(7.8, 2, k => { e.userData.nod = Math.sin(k * PI) * .4; }); S.cam(7.6, 2.4, [4.6, 1.6, 4], [3, 1.4, 1]);
    S.at(10.6, () => { });
  },
  // 3. Dinewan wanted to be the same, so she cut off her own wings. Then the turkey flew away, laughing!
  S => {
    bush(S);
    const e = dinewan(S, 2, 1, -H), t = turkey(S, -2, 1.4, H); t.children.slice(1, 3).forEach(w => w.scale.setScalar(.1));
    S.shot([0, 2.4, 9], [0, 1, 1]);
    S.at(2, () => { e.userData.wings.forEach(w => { w.visible = false; }); });
    const fl = [0, 1].map(i => { const f = mesh([P(new THREE.BoxGeometry(.9, .05, .5), '#6a5a4a', [0, 0, 0])]); f.visible = false; S.add(f, 2 + (i ? .5 : -.5), 1.2, 1); return f; });
    fl.forEach((f, i) => { S.show(f, 2); S.move(f, 2, 1, [2 + (i ? 1 : -1), .05, 1.6]); });
    S.cam(.3, 3, [3.6, 1.6, 5], [2, 1.2, 1]);
    S.help(7.6, 'Tap to see what the turkey does!', 'Chạm xem gà tây làm gì nào!', tt => {
      S.tw(tt, .5, k => { t.children.slice(1, 3).forEach(w => w.scale.setScalar(.1 + k * .9)); });
      S.at(tt + .4, () => { t.userData.flap = 1; }); S.move(t, tt + .5, 1.8, [-8, 6, -6], k => k * k);
      S.tw(tt + .6, 1.4, k => { e.userData.nod = Math.sin(k * PI) * .5; });
      S.cam(tt, 2, [0, 2.6, 9], [-3, 3, -2]);
    }, [-2, 1.4, 1.4], 2.3);
  },
  // 4. Dinewan was sad. Later she played a trick back about how many chicks they had.
  S => {
    bush(S);
    const e = dinewan(S, 2.4, 0, -.8, false), t = turkey(S, -2.4, .6, .8);
    const mine = chick(); S.add(mine, 1.6, 0, 1.4);
    const hidden = Array.from({ length: 4 }, (_, i) => { const c = chick(); S.add(c, 4.4 + (i % 2) * .4, 0, -1.6 + (i >> 1) * .4); return c; });
    S.add(mesh([P(new THREE.SphereGeometry(1, 10, 8), '#8aa86a', [0, .6, 0], [0, 0, 0], [1.3, .8, 1])]), 4.6, 0, -1);
    const many = Array.from({ length: 6 }, (_, i) => { const c = chick(); S.add(c, -3.4 + (i % 3) * .5, 0, 1.8 + (i >> 1) * .3); return c; });
    S.shot([0, 2.4, 8], [0, .8, 1]);
    S.cam(.3, 3, [3, 1.6, 5], [2, .6, 1]); S.tw(1, 2, k => { t.rotation.y = .8 + Math.sin(k * PI * 2) * .3; });
    S.say(5.8, 'Dinewan had hidden her other chicks behind a bush. What a trick!', 'Dinewan đã giấu các con khác sau bụi cây. Thật khéo bày trò!');
    hidden.forEach((c, i) => { S.move(c, 6 + i * .2, .8, [2.2 + i * .4, 0, 1.6]); hop(S, c, 6.8 + i * .2, 2, .2, .35); });
    S.cam(5.8, 2.4, [3, 2, 7], [2.6, .4, 1]);
    S.at(8.8, () => { });
  },
  // 5. Emus still cannot fly, but they can run very, very fast!
  S => {
    bush(S);
    const e = dinewan(S, -10, 3, H, false);
    S.shot([0, 2, 10], [-6, 1, 3]);
    S.cam(.3, 2.4, [-4, 2, 9], [-8, 1, 3]);
    S.help(5.3, 'Tap to make Dinewan run!', 'Chạm để Dinewan chạy nào!', tt => {
      S.move(e, tt, 2, [12, 0, 3], k => k);
      S.cam(tt, 2.2, () => [e.position.x - 3, 1.6, 8], () => [e.position.x, 1, 3]);
    }, [-10, 1.4, 3], 2.3);
  },
  // 6. Be happy being yourself: you do not have to copy anyone.
  S => {
    bush(S);
    const e = dinewan(S, -1.2, 1.2, .4, false), t = turkey(S, 1.6, 1.2, -.6);
    S.shot([0, 2.2, 8], [0, 1, 1]);
    hop(S, e, .3, 2, .3); S.cam(.3, 3, [0, 1.6, 6], [0, 1, 1]);
    S.say(4.6, 'Dinewan the emu is the fastest runner in the bush!', 'Emu Dinewan là vận động viên chạy nhanh nhất trong rừng!');
    S.move(e, 4.8, 2.4, [6, 0, -2], k => k); S.cam(4.6, 2.6, [1, 2, 8], [3, 1, 0]);
    S.at(7.6, () => { });
  }
] };
