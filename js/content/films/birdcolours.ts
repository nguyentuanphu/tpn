// How the Birds Got Their Colours (Vì sao chim có nhiều màu), from the Dreaming: all the birds are plain brown, a little
// bird hurts its foot, the others bring it seeds and berries, it paints them to say thank you, red, green and blue
// parrots and the kookaburra's white chest. The child helps twice: bringing berries (page 3) and painting (page 4).
import { L, Pp, THREE, P, mesh, PI, H, go, hop, turn, bush, bird, gumTree } from './kit.js';

const BROWN = '#8a6a4a';
const flock = (S, n = 5, c = BROWN) => Array.from({ length: n }, (_, i) => { const b = bird(Array.isArray(c) ? c[i % c.length] : c, 2.2); b.userData.flap = .05; return S.add(b, -2.4 + i * 1.2, .35, 1.4 + (i % 2) * .6, PI * (i % 2 ? .9 : 1.1)); });
const little = S => { const b = bird(BROWN, 1.6); b.userData.flap = .05; return S.add(b, 0, .25, 3, PI); };
const berry = () => mesh([P(new THREE.SphereGeometry(.07, 8, 6), '#c8324a', [0, .07, 0])]);
// the colours a bird can be painted (parrots red, green, blue; the kookaburra brown with a white chest)
const PAINT = ['#e8332a', '#43c463', '#3cb0e8', '#ffd23f', '#ff7eb8'];
const kookaburra = () => { const b = bird('#a8865a', 2.2); b.userData.flap = .05; b.children[0].add(mesh([P(new THREE.SphereGeometry(.11, 8, 6), '#ffffff', [0, -.02, .12])])); return b; };

export default { pages: [
  // 1. Long ago, in the Dreaming, all the birds of Australia were plain and brown.
  S => {
    bush(S);
    const fl = flock(S, 6);
    S.shot([0, 1.8, 7], [0, .6, 1.6]);
    fl.forEach((b, i) => hop(S, b, .4 + i * .3, 2, .2, .35)); S.cam(.3, 3.6, [2, 1.2, 5], [0, .5, 1.8]);
    S.say(5.8, 'Brown wings, brown tails, brown everything.', 'Cánh nâu, đuôi nâu, cái gì cũng nâu.');
    S.cam(5.8, 2.4, [-2, 2, 6], [0, .5, 1.6]);
    S.at(8.4, () => { });
  },
  // 2. One day a little bird hurt its foot and could not find food.
  S => {
    bush(S);
    const b = little(S); b.rotation.z = .3;
    S.shot([0, 1, 5], [0, .3, 3]);
    hop(S, b, .4, 1, .15); S.tw(1, 2, k => { b.rotation.z = .3 + Math.sin(k * PI * 2) * .1; });
    S.cam(.3, 3, [1, .6, 4.4], [0, .3, 3]);
    S.say(4.8, 'It sat alone, very hungry.', 'Chim nhỏ ngồi một mình, đói lắm.');
    S.cam(4.8, 2, [-1.4, 1.2, 5], [0, .3, 3]);
    S.at(7.2, () => { });
  },
  // 3. The other birds brought it seeds and berries, and stayed with it until it was well.
  S => {
    bush(S);
    const b = little(S), fl = flock(S, 4); fl.forEach((x, i) => { x.position.set(-8 + i, 4 + i * .4, -4); x.userData.flap = 1; });
    const bs = fl.map(() => { const x = berry(); x.visible = false; S.add(x, 0, .02, 2.4); return x; });
    S.shot([0, 1.6, 7], [0, .6, 2.4]);
    S.cam(.3, 3, [1.6, 1, 5.4], [0, .4, 2.6]);
    S.help(5.5, 'Tap to bring the little bird some berries!', 'Chạm để mang quả mọng cho chim nhỏ nào!', tt => {
      fl.forEach((x, i) => { const to = [-1.2 + i * .8, .35, 2.1 + (i % 2) * .3]; go(S, x, tt + i * .2, 1.2, to); S.at(tt + 1.2 + i * .2, () => { x.userData.flap = .05; }); S.show(bs[i], tt + 1.3 + i * .2); S.move(bs[i], tt + 1.3 + i * .2, .4, [-.3 + i * .2, .02, 2.7]); });
      S.cam(tt, 2, [0, 1.4, 5.4], [0, .4, 2.6]);
    }, [0, .4, 3], 2.3);
  },
  // 4. To say thank you, the little bird found coloured earth and flowers and painted its friends.
  S => {
    bush(S);
    const b = little(S), fl = flock(S, 4);
    const painted = fl.map((x, i) => { const p = bird(PAINT[i], 2.2); p.userData.flap = .05; p.visible = false; S.add(p, x.position.x, x.position.y, x.position.z, x.rotation.y); return p; });
    const pots = PAINT.slice(0, 4).map((c, i) => S.add(mesh([P(new THREE.CylinderGeometry(.14, .12, .12, 10), '#8a5a32', [0, .06, 0]), P(new THREE.CylinderGeometry(.12, .12, .02, 10), c, [0, .12, 0])]), -.9 + i * .6, 0, 3.6));
    S.shot([0, 1.8, 7], [0, .5, 2.4]);
    hop(S, b, .3, 3, .2); S.cam(.3, 2.6, [0, 1, 5.4], [0, .3, 3.4]);
    S.help(5.8, 'Tap to paint the birds!', 'Chạm để tô màu cho các bạn chim nào!', tt => {
      fl.forEach((x, i) => { S.show(x, tt + .3 + i * .3, false); S.show(painted[i], tt + .3 + i * .3); hop(S, painted[i], tt + .4 + i * .3, 1, .3); });
      const sp = Pp.sparkle('#ffe27a'); S.add(sp, 0, .4, 1.6); S.show(sp, tt);
      S.cam(tt, 2, [0, 1.6, 6], [0, .5, 1.8]);
    }, [0, .4, 2], 2.3);
  },
  // 5. The parrots became red and green and blue, and the kookaburra got a white chest.
  S => {
    bush(S);
    const tree = gumTree(1); S.add(tree, 0, 0, -1);
    const ps = ['#e8332a', '#43c463', '#3cb0e8'].map((c, i) => { const p = bird(c, 2); p.userData.flap = 1; return S.add(p, -8 + i, 5, 4); });
    const kb = kookaburra(); S.add(kb, 2.4, .35, 2, -.6);
    S.shot([0, 2.4, 9], [0, 2.4, 0]);
    ps.forEach((p, i) => { go(S, p, .3 + i * .3, 2.4, [-1 + i, 4.2 + (i % 2) * .4, -.4]); S.at(2.8 + i * .3, () => { p.userData.flap = .05; }); });
    S.cam(.3, 3.4, [1, 3.6, 6], [0, 4, -.4]);
    S.say(5.5, 'And the kookaburra laughed: ha-ha-ha!', 'Còn chim kookaburra cười vang: ha-ha-ha!');
    S.tw(5.6, 2, k => { kb.rotation.x = -Math.abs(Math.sin(k * PI * 5)) * .3; }); S.cam(5.5, 2.2, [3.6, 1.2, 4], [2.4, .6, 2]);
    S.at(8.4, () => { });
  },
  // 6. And that is why Australian birds are so bright: kindness made them colourful.
  S => {
    bush(S);
    const fl = PAINT.map((c, i) => { const b = bird(c, 2); b.userData.flap = 1; return S.add(b, -6 + i * 2, 3 + (i % 2), -2); });
    S.shot([0, 2, 10], [0, 3, -2]);
    fl.forEach((b, i) => S.move(b, .3 + i * .2, 5, [-8 + i * 4, 7 + (i % 2) * 2, -14], k => k, 1.6));
    S.cam(.3, 4.6, [0, 2, 8], [0, 5, -8]);
    S.say(5.3, 'Be kind, and the world gets brighter.', 'Hãy tốt bụng, thế giới sẽ rực rỡ hơn.');
    S.at(8.2, () => { });
  }
] };
