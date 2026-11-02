// Con Rồng cháu Tiên (Children of the Dragon and the Fairy): the dragon king under the sea, the fairy in the flowery
// mountains, their meeting, the bag of a hundred eggs, the fifty who go to the sea and the fifty to the mountains, and
// "đồng bào". The child helps twice: the eggs hatch (page 4), the family waves goodbye (page 5).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, serpent, slither, flat, hop, speak, VILLAGER, KID, FAIRY, mountainTop, seaside, village, stars } from './kit.js';

const LAC = LOOK({ style: 'tunic', color: '#2f8ac8', hat: 'crown', hairStyle: 'short', skin: '#d8a070' });
const AUCO = FAIRY('#ffd0e4');
const KIDS = [['shirt', '#3b6fe0', 'short'], ['dress', '#ff7eb8', 'buns'], ['shirt', '#43c463', 'spiky'], ['dress', '#ffd23f', 'ponytail'], ['shirt', '#e8572a', 'short'], ['dress', '#9a6ad8', 'long']].map(([s, c, h]) => KID(s, c, h));
const egg = () => mesh([P(new THREE.SphereGeometry(.14, 12, 10), '#fbf3e0', [0, .17, 0], [0, 0, 0], [1, 1.25, 1])]);
const dragon = S => serpent(S, { n: 22, r: .4, colors: ['#2fb8a0', '#3cc8b0', '#ffd23f'], head: '#2fb8a0', horns: true, y: 1.2, waveAmp: .8 });

export default { pages: [
  // 1. Long ago, Lạc Long Quân, a kind dragon king, lived deep in the sea.
  S => {
    S.sky('#1a5a8a', '#3a9ac8'); S.light(.7, .8); S.add(flat(200, 200, '#d8c08a'), 0, -.02, 0);
    // weeds and coral swaying, bubbles rising
    const weeds = []; for (let i = 0; i < 14; i++) { const w = mesh([P(new THREE.CylinderGeometry(.05, .08, 2.4, 5), i % 2 ? '#3f9a5a' : '#5ab86a', [0, 1.2, 0])]); weeds.push(S.add(w, Math.cos(i * 2.4) * (4 + i % 5), 0, Math.sin(i * 2.4) * 3 - 3)); }
    for (let i = 0; i < 8; i++) S.add(mesh([P(new THREE.DodecahedronGeometry(.45), ['#ff7e8a', '#ffb05a', '#c87ae8'][i % 3], [0, .3, 0], [i, i, 0], [1, 1.3, 1])]), Math.cos(i * 1.7) * 6, 0, Math.sin(i * 1.7) * 4 - 2);
    S.every((dt, time) => weeds.forEach((w, i) => { w.rotation.z = Math.sin(time * 1.2 + i) * .15; }));
    const bub = Pp.sparkle('#cfeeff'); S.add(bub, 0, .5, -2); S.show(bub, .2);
    const dr = dragon(S); dr.userData.lay(-9, -3, H);
    const lac = S.person(LAC, 2.4, 1.2, -.4);
    S.shot([0, 3.2, 12], [0, 1.4, 0]);
    slither(S, dr, .2, 3, [-1, 2.2, -1.5], .6); slither(S, dr, 3.2, 2.2, [1.2, 1.4, .2], .3);
    S.cam(.2, 3.6, [-3, 2.6, 9], [0, 1.6, -.5]);
    S.do(lac, 3.4, 'wave', 1.6); S.mood(lac, 3.4, 'happy');
    S.say(6.9, 'The dragon king swam among the fish and coral, kind to everyone.', 'Vua rồng bơi giữa đàn cá và san hô, hiền hậu với muôn loài.');
    const fish = [0, 1, 2].map(i => { const f = Pp.bird(['#ffb05a', '#5ad0ff', '#ff7eb8'][i]); f.userData.flap = .2; return S.add(f, -6 + i, 1 + i * .4, 3); });
    fish.forEach((f, i) => S.move(f, 6.8 + i * .2, 3.4, [6 + i, 1.4 + i * .3, -2]));
    S.cam(6.6, 3.6, [3.6, 2.2, 6.4], [1, 1.4, 0]);
    S.at(10.4, () => { });
  },
  // 2. Âu Cơ, a beautiful fairy, lived high in the mountains among the flowers.
  S => {
    mountainTop(S);
    const au = S.person(AUCO, -1.6, 1.2, .4);
    const birds = [0, 1].map(i => { const b = Pp.bird(i ? '#ff9ec8' : '#ffd23f'); return S.add(b, -8, 3 + i, -2 - i); });
    S.shot([0, 2.2, 9], [0, 1.4, 0]);
    let t = S.walk(au, .4, [.8, .6], .9); S.do(au, t, 'pick', 1.4); S.mood(au, t, 'happy');
    birds.forEach((b, i) => S.move(b, .6 + i * .4, 4, [1.6 + i, 2.4 + i * .3, -.4]));
    S.cam(.3, 4, [3.4, 2, 6], [.4, 1.4, 0]);
    S.do(au, t + 1.6, 'stretch', 1.2);
    S.say(5.5, 'She cared for the flowers, the birds and the trees.', 'Nàng chăm sóc hoa, chim và cây cỏ trên núi.');
    S.do(au, 5.6, 'dance', 2.6); S.cam(5.4, 3, [-3, 3, 7], [0, 1.6, 0]);
    S.at(8.7, () => { });
  },
  // 3. They met, became friends, and got married.
  S => {
    seaside(S); L.blossom(S, -4, -2); L.blossom(S, 4.5, -2.6);
    const lac = S.person(LAC, -6, 2, H), au = S.person(AUCO, 6, 2, -H);
    S.shot([0, 2.4, 11], [0, 1.4, 1]);
    S.walk(lac, .2, [-1, 2], 1.6); S.walk(au, .2, [1, 2], 1.6);
    S.mood(lac, 3, 'happy'); S.mood(au, 3, 'happy'); S.do(lac, 3.2, 'bow', 1); S.do(au, 3.2, 'bow', 1);
    S.cam(.2, 3.2, [0, 1.8, 6.4], [0, 1.4, 2]);
    const sp = Pp.sparkle('#ff9ec8'); S.add(sp, 0, 1.6, 2); S.show(sp, 4.2);
    S.say(4.2, 'The sea and the mountains were happy for them.', 'Biển cả và núi non cùng mừng cho hai người.');
    S.do(lac, 4.4, 'hug', 2.2); S.do(au, 4.4, 'hug', 2.2);
    S.cam(4.2, 3, [-2.6, 2.6, 7], [0, 1.4, 2]);
    S.at(7.2, () => { });
  },
  // 4. Âu Cơ laid a bag of one hundred eggs, and out hatched one hundred children!
  S => {
    village(S, { paddy: false });
    const au = S.person(AUCO, -2.2, 2.4, .4), lac = S.person(LAC, 2.4, 2.6, -.4);
    const bag = mesh([P(new THREE.SphereGeometry(.9, 16, 12), '#f4e2c0', [0, .7, 0], [0, 0, 0], [1.2, .85, 1.2])]); S.add(bag, 0, 0, 2.8);
    const eggs = []; for (let i = 0; i < 18; i++) { const e = egg(), a = i * 2.39, d = .5 + Math.sqrt(i) * .45; e.position.set(Math.cos(a) * d, 0, 2.8 + Math.sin(a) * d * .7); e.visible = false; S.root.add(e); eggs.push(e); }
    S.shot([0, 3.4, 10], [0, 1, 2.6]);
    S.do(au, .4, 'kneel', 4); S.mood(au, .4, 'happy'); S.do(lac, .6, 'surprised', 1.4);
    S.at(2.2, () => { bag.visible = false; eggs.forEach(e => { e.visible = true; }); });
    S.cam(.4, 2.6, [0, 2.4, 6.4], [0, .6, 2.8]);
    S.help(4.7, 'Tap to hatch the eggs!', 'Chạm để trứng nở nào!', tt => {
      eggs.forEach((e, i) => S.scale(e, tt + i * .04, .3, 1, .01));
      const kids = KIDS.map((k, i) => S.person(k, Math.cos(i * 1.05) * 1.4, 2.8 + Math.sin(i * 1.05) * .9, i, .55));
      kids.forEach((k, i) => { k.o.scale.setScalar(.01); S.scale(k.o, tt + .2 + i * .1, .4, .01, .55); S.do(k, tt + .8, 'cheer', 1.4); S.mood(k, tt, 'happy'); });
      S.do(au, tt + .2, 'cheer', 1.6); S.do(lac, tt + .2, 'cheer', 1.6); S.mood(lac, tt, 'happy');
      S.cam(tt, 1.6, [0, 2, 5.6], [0, .8, 2.8]);
    }, [0, .4, 2.8], 2.3);
  },
  // 5. Fifty children went to the sea with their father, and fifty went to the mountains with their mother.
  S => {
    seaside(S); S.add(new THREE.Mesh(new THREE.ConeGeometry(22, 18, 10), new THREE.MeshToonMaterial({ color: '#7aa86a' })), -34, 0, -20);
    const lac = S.person(LAC, 0, 4, 0), au = S.person(AUCO, -1, 4, 0);
    const kids = KIDS.map((k, i) => S.person(k, -2 + i * .8, 5.4, 0, .6));
    S.shot([0, 3, 13], [0, 1.2, 3]);
    S.walk(lac, .4, [5, 1], 2.4); S.walk(au, .4, [-6, 1], 2.4);
    kids.forEach((k, i) => S.walk(k, .6 + i * .1, i % 2 ? [4 + i * .3, 2] : [-5 - i * .3, 2], 2.4));
    S.cam(.4, 4, [0, 5, 16], [0, 1, 0]);
    S.help(5.8, 'Tap to wave goodbye!', 'Chạm để vẫy tay chào nhé!', tt => {
      [lac, au, ...kids].forEach((a, i) => { S.face(a, tt + i * .05, [0, 8]); S.do(a, tt + .4, 'wave', 1.6); S.mood(a, tt, 'happy'); });
      S.cam(tt, 1.6, [0, 2.6, 10], [0, 1.2, 2]);
    }, null, 2.3);
  },
  // 6. That is why Vietnamese people call each other "đồng bào": we all came from the same bag of eggs!
  S => {
    village(S);
    const people = [VILLAGER('aodai', '#e86a8a'), VILLAGER('shirt', '#3b6fe0', 'nonla', 'short'), KID('dress', '#ffd23f', 'buns'), VILLAGER('tunic', '#4a9a5a', 'none', 'short'), KID('shirt', '#ff7e3a', 'spiky'), VILLAGER('aodai', '#7a5ad8', 'nonla')];
    const ring = people.map((l, i) => S.person(l, Math.cos(i / 6 * PI * 2) * 2.2, 2.6 + Math.sin(i / 6 * PI * 2) * 1.6, 0, i % 3 === 2 || i === 4 ? .7 : 1));
    ring.forEach((a, i) => { a.o.rotation.y = Math.atan2(-a.px, 2.6 - a.pz); a.yaw = a.o.rotation.y; });
    S.shot([0, 6, 11], [0, 1, 2.6]);
    ring.forEach((a, i) => { S.do(a, .4 + i * .1, 'wave', 2); S.mood(a, .4, 'happy'); });
    S.cam(.3, 4, [0, 3, 8.6], [0, 1.2, 2.6]);
    const sp = Pp.sparkle('#ffd23f'); S.add(sp, 0, .6, 2.6); S.show(sp, 2.4);
    S.say(6.8, 'Everyone in Vietnam is one big family.', 'Người Việt Nam mình là một đại gia đình.');
    ring.forEach((a, i) => S.do(a, 6.9, 'hug', 2.4));
    S.cam(6.8, 2.8, [4, 2.4, 6.4], [0, 1.2, 2.6]);
    S.at(9.8, () => { });
  }
] };
