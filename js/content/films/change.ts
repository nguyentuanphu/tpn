// Chang'e, the Lady in the Moon (Hằng Nga trên cung trăng): Chang'e floats up to the moon and lives with the white jade
// rabbit, the rabbit mixing medicine in a little pot, Mid-Autumn with the full moon, mooncakes and lanterns, and Chị
// Hằng and Chú Cuội in Vietnam. The child helps once: the lanterns of Mid-Autumn (page 3).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, go, hop, speak, FAIRY, KID, VILLAGER, night, moonGround, moonDisc, animal, fruitTree } from './kit.js';

const CHANGE = FAIRY('#f4e8ff');
const CUOI = LOOK({ style: 'shirt', color: '#5a7a4a', hat: 'nonla', hairStyle: 'short', skin: '#c89060' });
const mortar = () => { const g = new THREE.Group(); g.add(mesh([P(new THREE.CylinderGeometry(.22, .18, .3, 12), '#c8c0b0', [0, .15, 0]), P(new THREE.CylinderGeometry(.2, .2, .02, 12), '#9ad88a', [0, .3, 0])])); const pe = mesh([P(new THREE.CylinderGeometry(.03, .03, .5, 6), '#a8784a', [0, .25, 0])]); pe.position.set(0, .2, 0); g.add(pe); g.userData.pestle = pe; return g; };
const mooncake = () => mesh([P(new THREE.CylinderGeometry(.2, .2, .1, 14), '#c8883a', [0, .05, 0]), P(new THREE.CylinderGeometry(.12, .12, .105, 14), '#d89a4a', [0, .055, 0])]);

export default { pages: [
  // 1. In China they tell of Chang'e, who floated all the way up to the moon and lives there with a white jade rabbit.
  S => {
    night(S, { moon: false, ground: '#3a4a3a' }); const moon = moonDisc(S, 0, 30, -60, 9);
    const c = S.person(CHANGE, 0, 2, 0);
    S.shot([0, 2, 9], [0, 2, 0]);
    S.move(c.o, .3, 6.4, [0, 26, -48], k => k * k); S.mood(c, .3, 'happy'); S.do(c, .3, 'stretch', 6.4);
    S.cam(.3, 6.4, () => [c.o.position.x + 2, c.o.position.y + 1, c.o.position.z + 9], () => [c.o.position.x, c.o.position.y + 1, c.o.position.z - 4]);
    S.say(7.1, 'There a little white rabbit was waiting for her.', 'Ở đó có chú thỏ trắng đang chờ nàng.');
    S.at(10, () => { });
  },
  // 2. The rabbit is always busy, mixing a magic medicine in a little pot.
  S => {
    moonGround(S); const tree = fruitTree('#f4e8a0', 1.2, 0); S.add(tree, -3, -3);
    const r = animal(S, 'bunny', 0, 1.4, 0, 2), m = mortar(); S.add(m, 0, .3, 2.2);
    const c = S.person(CHANGE, 2.4, -.4, -.6);
    S.shot([0, 1.6, 6], [0, .8, 1.4]);
    S.tw(.3, 4, k => { m.userData.pestle.position.y = .2 + Math.abs(Math.sin(k * PI * 8)) * .2; }, k => k);
    S.cam(.3, 3, [1, 1, 4], [0, .6, 1.8]);
    S.say(5.3, 'Thump, thump, thump went the little pestle.', 'Cộp, cộp, cộp, chày giã đều tay.');
    S.do(c, 5.4, 'wave', 2); S.mood(c, 5.4, 'happy'); S.cam(5.3, 2.4, [-1, 2, 7], [0, 1, 0]);
    S.at(8.2, () => { });
  },
  // 3. At the Mid-Autumn Festival, families look up at the full moon, share mooncakes and carry lanterns.
  S => {
    night(S); const t = Pp.table(); S.add(t, 0, 0, 2); [-.3, .3].forEach(x => S.add(mooncake(), x, .46, 2));
    const fam = [VILLAGER('aodai', '#c84a6a', 'none'), VILLAGER('shirt', '#3b6fe0', 'none', 'short'), KID('dress', '#ffd23f', 'buns'), KID('shirt', '#ff7e3a', 'spiky')].map((l, i) => S.person(l, -2.2 + i * 1.5, 3.4, PI, i > 1 ? .75 : 1));
    S.shot([0, 2.2, 9], [0, 1.6, 0]);
    fam.forEach((a, i) => { S.mood(a, 0, 'happy'); S.do(a, .4 + i * .2, 'point', 1.6); }); S.cam(.3, 3.4, [0, 1.6, 7], [0, 6, -20]);
    S.help(6.4, 'Tap to light the lanterns!', 'Chạm để thắp đèn lồng nào!', tt => {
      fam.forEach((a, i) => { const l = L.lantern(S, a.px, 1.5, a.pz - .4, ['#e8332a', '#ffd23f', '#ff7eb8', '#3cb0e8'][i]); l.visible = false; S.show(l, tt + i * .2); });
      fam.forEach(a => S.do(a, tt + .8, 'cheer', 1.4)); S.cam(tt, 2, [0, 2, 7], [0, 1.4, 2.6]);
    }, [0, 1.2, 2], 2.3);
  },
  // 4. In Vietnam we call her Chị Hằng, and Chú Cuội sits under a big tree on the moon too!
  S => {
    moonGround(S); L.banyan(S, 2, -3, .7);
    const c = S.person(CHANGE, -1.6, 1, .4), cu = S.person(CUOI, 1.8, -1, -.4), r = animal(S, 'bunny', -.4, 2, 0, 2);
    S.do(cu, 0, 'sitground');
    S.shot([0, 2, 8], [0, 1, 0]);
    S.mood(c, 0, 'happy'); S.mood(cu, 0, 'happy'); S.do(c, .4, 'wave', 2); S.do(cu, 1.4, 'wave', 2); hop(S, r, 2, 3, .3);
    S.cam(.3, 4, [0, 1.6, 6], [0, 1, 0]);
    S.say(6.4, 'Wave to them at the next full moon!', 'Rằm tới, con vẫy tay chào họ nhé!');
    S.do(c, 6.5, 'wave', 2.4); S.do(cu, 6.5, 'wave', 2.4); S.cam(6.4, 2.6, [0, 3, 9], [0, 1.6, -1]);
    S.at(9.4, () => { });
  }
] };
