// Chú Cuội cung trăng (Chú Cuội on the Moon): the mother tiger heals her cub with the magic banyan's leaves, Cuội
// carries the tree home and heals the sick, dirty water is poured on it, the tree flies up with Cuội holding on, the
// moon, and children looking up at Mid-Autumn. The child helps twice: the sick man (page 2) and holding on (page 4).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, speak, go, hop, VILLAGER, KID, forest, village, night, moonGround, moonDisc, tiger, axe } from './kit.js';

const CUOI = LOOK({ style: 'shirt', color: '#5a7a4a', hat: 'nonla', hairStyle: 'short', skin: '#c89060' });
const WIFE = LOOK({ style: 'aodai', color: '#b8573a', hairStyle: 'buns', skin: '#f0c098' });
const leaf = () => mesh([P(new THREE.SphereGeometry(.14, 8, 6), '#3fae3a', [0, 0, 0], [0, 0, 0], [.7, .1, 1.3])]);
// the magic banyan: a small one with its roots showing (so it can fly)
const magicTree = (s = 1) => { const g = new THREE.Group(); g.add(mesh([P(new THREE.CylinderGeometry(.25, .35, 2, 8), '#7a5a3a', [0, 1, 0]), ...[0, 1, 2, 3, 4, 5].map(i => P(new THREE.SphereGeometry(.9, 9, 7), i % 2 ? '#3f8a3a' : '#4f9e42', [Math.cos(i) * .8 * (i ? 1 : 0), 2.5 + (i % 3) * .3, Math.sin(i) * .8 * (i ? 1 : 0)])),
  ...[0, 1, 2, 3, 4].map(i => P(new THREE.CylinderGeometry(.04, .06, .7, 5), '#7a5a3a', [Math.cos(i * 1.3) * .3, .05, Math.sin(i * 1.3) * .3], [Math.sin(i * 1.3) * .6, 0, -Math.cos(i * 1.3) * .6]))])); g.scale.setScalar(s); return g; };

export default { pages: [
  // 1. Cuội was a woodcutter. One day he saw a mother tiger heal her cubs with the leaves of a magic banyan tree.
  S => {
    forest(S);
    const cuoi = S.person(CUOI, -4, 3, .6), ax = axe(); S.grab(cuoi, 0, ax, [0, -.5, .1]);
    const tree = magicTree(); S.add(tree, 3, -2);
    const mom = tiger(); S.add(mom, 3.4, 1.6, -2.6); const cub = tiger(); cub.scale.setScalar(.5); S.add(cub, 1, 0, 1.4); cub.rotation.z = H;
    const lf = leaf(); lf.visible = false; S.add(lf);
    S.shot([0, 2.4, 9], [0, .8, 1]);
    S.do(cuoi, .2, 'surprised', 1.4); S.mood(cuoi, .2, 'o');
    go(S, mom, .4, 1.6, [2.8, 0, -1.2]); S.at(2.2, () => { lf.visible = true; mom.add(lf); lf.position.set(0, .7, .9); });
    go(S, mom, 2.6, 1.4, [1.2, 0, .3]);
    S.cam(.3, 3.6, [1.6, 1.6, 6], [1.4, .4, .8]);
    S.at(4.2, () => { S.root.attach(lf); }); S.move(lf, 4.21, .5, [1, .3, 1.4]);
    S.tw(5, 1, k => { cub.rotation.z = H * (1 - k); }); S.at(6, () => { lf.visible = false; });
    S.say(7.6, 'The little tiger jumped up, well again!', 'Hổ con bật dậy, khỏe lại ngay!');
    hop(S, cub, 7.6, 3, .4); S.cam(7.4, 2, [-1, 1.6, 5.4], [1, .4, 1]); S.mood(cuoi, 7.6, 'happy');
    S.at(10.4, () => { });
  },
  // 2. Cuội carried the magic tree home and used its leaves to help sick people in the village.
  S => {
    village(S, { house: [-3, -6] });
    const cuoi = S.person(CUOI, 1, 1.6, -.6), tree = magicTree(.8); S.add(tree, 4, -1.6);
    const sick = S.person(VILLAGER('shirt', '#9a9aa8', 'none', 'short'), -1, 2, H); S.do(sick, 0, 'lie'); S.mood(sick, 0, 'sleep');
    const fam = S.person(VILLAGER('aodai', '#e86a8a'), -2.4, .8, .8); S.mood(fam, 0, 'sad');
    const lf = leaf(); S.grab(cuoi, 0, lf, [0, -.5, .1]);
    S.shot([0, 2.6, 8], [0, .8, 1.6]);
    S.walk(cuoi, .3, [.2, 2.4]); S.do(cuoi, 1.6, 'kneel', 3.6); S.cam(.3, 3, [1.6, 1.6, 5.6], [-.6, .4, 2]);
    S.help(5.2, 'Tap to give the leaf to the sick man!', 'Chạm để đưa lá cho người ốm nào!', tt => {
      S.drop(lf, tt, [-.6, .4, 2]); S.show(lf, tt + .6, false);
      S.do(sick, tt + .6, 'situp', .8); S.mood(sick, tt + .6, 'happy'); S.do(sick, tt + 1.4, 'cheer', .8);
      S.mood(fam, tt + .8, 'happy'); S.do(fam, tt + .8, 'cheer', 1.4);
      S.cam(tt, 1.4, [0, 1.8, 5.4], [-.8, .6, 2]);
    }, [-1, .4, 2], 2.3);
  },
  // 3. The tree had one rule: always water it with clean water. One day Cuội's wife forgot, and poured dirty water on it.
  S => {
    village(S, { house: [-4, -6] });
    const tree = magicTree(1.1); S.add(tree, 2, -1);
    const wife = S.person(WIFE, -2, 2, .8), bucket = mesh([P(new THREE.CylinderGeometry(.2, .16, .3, 10), '#8a6a4a', [0, 0, 0])]); S.grab(wife, 0, bucket, [0, -.55, .15]);
    const drops = Pp.drops(14, .1); drops.children.forEach(d => { d.material = new THREE.MeshBasicMaterial({ color: '#7a5a32' }); d.material.userData.film = true; }); S.add(drops, 1.3, 1, .4);
    S.shot([0, 2.6, 8.4], [1, 1.4, 0]);
    S.walk(wife, .3, [1.1, .6]); S.cam(.3, 3, [3, 1.8, 5.6], [1.4, 1, 0]);
    S.do(wife, 3.4, 'water', 3.2); S.show(drops, 3.6); S.show(drops, 6.4, false); S.mood(wife, 3.4, 'smile');
    S.say(7.7, 'The tree began to shake, and its roots wiggled.', 'Cây đa bắt đầu rung rinh, rễ cây ngọ nguậy.');
    S.tw(7.7, 3, k => { tree.rotation.z = Math.sin(k * 40) * .05; tree.position.y = Math.abs(Math.sin(k * 30)) * .08; }, k => k);
    S.mood(wife, 7.8, 'o'); S.do(wife, 8, 'surprised', 2); S.cam(7.6, 2.4, [-1, 1.4, 5.4], [1.4, 1.2, 0]);
    S.at(10.7, () => { });
  },
  // 4. The tree pulled up its roots and began to float into the sky! Cuội grabbed the roots and held on.
  S => {
    village(S, { house: [-5, -7] });
    const tree = magicTree(1.1); S.add(tree, 1, -.6);
    const cuoi = S.person(CUOI, -3, 2.4, .6), wife = S.person(WIFE, -4.4, 1, .4);
    S.shot([0, 3, 10], [0, 2, 0]);
    S.move(tree, .4, 5, [1, 1.2, -.6], k => k); S.mood(wife, .4, 'o'); S.do(wife, .6, 'surprised', 3);
    S.mood(cuoi, 1, 'o'); S.walk(cuoi, 1.6, [.4, .4], 1.8); S.cam(.4, 4, [-2, 2, 8], [.6, 1.6, 0]);
    S.help(6.4, 'Tap to help Cuội hold on!', 'Chạm để giúp chú Cuội níu lấy rễ cây!', tt => {
      S.do(cuoi, tt, 'stretch', 2.4); S.at(tt + .3, () => { tree.attach(cuoi.o); });
      S.move(tree, tt + .4, 1.9, [1, 6, -.6], k => k * k); S.mood(cuoi, tt + .4, 'surprised');
      S.cam(tt, 2.2, [0, 2.4, 10], [.6, 4, 0]);
    }, [1, 1.4, -.4], 2.3);
  },
  // 5. Up, up, up they flew, all the way to the moon!
  S => {
    night(S, { moon: false, ground: null }); moonDisc(S, 0, 30, -60, 12);
    const tree = magicTree(1), cuoi = S.person(CUOI, 0, 0, 0); S.add(tree, 0, 0, 0); tree.add(cuoi.o); cuoi.o.position.set(.2, -1, 0); S.do(cuoi, 0, 'stretch');
    L.clouds(S, [[-8, -4, -6, 1.6], [6, -6, -10, 2]]);
    S.shot([6, -2, 12], [0, 2, 0]);
    S.move(tree, .2, 6.6, [0, 26, -48], k => k); S.tw(.2, 6.6, k => { tree.rotation.y = k * PI * 2; }, k => k);
    S.cam(.2, 6.8, () => [tree.position.x + 6, tree.position.y + 1, tree.position.z + 12], () => [tree.position.x, tree.position.y + 2, tree.position.z]);
    S.say(4.5, 'They landed softly on the moon.', 'Cây đa đáp nhẹ nhàng xuống cung trăng.');
    S.mood(cuoi, 5, 'happy');
    S.at(7.2, () => { });
  },
  // 6. At Mid-Autumn, look at the full moon: can you see Chú Cuội sitting under his banyan tree?
  S => {
    night(S, { moon: false }); const moon = moonDisc(S, 0, 22, -60, 10);
    const tree = magicTree(1.6); S.add(tree, -2, 21, -49); const cuoi = S.person(CUOI, -.4, -48.4, 0, 1.2); cuoi.o.position.y = 21; S.do(cuoi, 0, 'sitground'); S.mood(cuoi, 0, 'happy');
    const kids = [KID('dress', '#ff7eb8', 'buns'), KID('shirt', '#3b6fe0'), KID('dress', '#ffd23f', 'ponytail')].map((l, i) => S.person(l, -1.6 + i * 1.6, 4, PI));
    kids.forEach((k, i) => L.lantern(S, -1.2 + i * 1.6, 1.4, 3.6, ['#e8332a', '#ffd23f', '#ff7eb8'][i]));
    S.shot([0, 1.6, 9], [0, 1.4, 3]);
    kids.forEach((k, i) => { S.do(k, .4 + i * .2, 'point', 2); S.mood(k, .4, 'happy'); });
    S.cam(.4, 3.6, [0, 4, 8], [0, 18, -50]);
    S.say(6, 'Wave to Chú Cuội up on the moon!', 'Vẫy tay chào chú Cuội trên cung trăng nào!');
    S.do(cuoi, 6.4, 'wave', 2.4); kids.forEach(k => S.do(k, 6.2, 'wave', 2.4));
    S.cam(6, 2.6, [0, 22, -40], [0, 20, -49]);
    S.at(9, () => { });
  }
] };
