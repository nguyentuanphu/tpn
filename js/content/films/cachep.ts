// Cá chép hóa rồng (The Carp Who Became a Dragon): the Vũ Môn waterfall, the fish leap, the little carp falls and her
// friends give up, she keeps practising, she leaps over and becomes a dragon, keep trying. The child helps twice: a
// practice leap (page 4) and the big leap (page 5).
import { L, Pp, THREE, P, mesh, PI, H, go, carp, serpent, slither, flat } from './kit.js';

// the river with the great waterfall at the back (a white wall of water falling from a cliff)
function falls(S) {
  S.sky('#7cc8f0', '#eaf7ff'); L.sun(S, 40, 40, -150, 8); L.sea(S, '#4fa8c8', -.3); L.mountains(S, -90);
  S.add(mesh([P(new THREE.BoxGeometry(30, 10, 6), '#7a8a7a', [0, 5, -14]), P(new THREE.BoxGeometry(30, .6, 7), '#5a9a4a', [0, 10.2, -14])]));
  const wf = new THREE.Mesh(new THREE.PlaneGeometry(6, 10, 1, 20), new THREE.MeshBasicMaterial({ color: '#e8f6ff', transparent: true, opacity: .85 })); wf.material.userData.film = true; S.add(wf, 0, 5, -10.9);
  const foam = Pp.sparkle('#ffffff'); S.add(foam, 0, 0, -10); foam.visible = true;
  [[-6, -6], [6, -5], [-9, 2]].forEach(([x, z]) => L.bamboo(S, x, z, '#5fae4a', 5, 5));
}
const fishes = (S, n = 5) => Array.from({ length: n }, (_, i) => { const f = carp(['#f0902a', '#e8c43a', '#d85a3a', '#f0a050', '#c8c8c8'][i % 5]); f.scale.setScalar(.5); S.add(f, -2 + i, -.1, -4 + (i % 2), PI); return f; });
// a leap: up out of the water towards the top of the falls, and back down (or over the top)
const leap = (S, f, t, h, over = false) => { const from = f.position.clone(); return S.tw(t, 1.4, k => { f.position.set(from.x, from.y + Math.sin(k * PI * (over ? .5 : 1)) * h, from.z - (over ? k * 6 : Math.sin(k * PI) * 2)); f.rotation.x = (over ? -.8 : -Math.cos(k * PI) * .8); }); };

export default { pages: [
  // 1. Far upriver there was a great waterfall called the Vũ Môn gate.
  S => {
    falls(S);
    const f = fishes(S, 3);
    S.shot([0, 2, 16], [0, 4, -8]);
    S.cam(.3, 3.6, [3, 1.4, 6], [0, 6, -11]);
    S.say(4.5, 'The water roared down, white and tall.', 'Nước đổ ầm ầm, trắng xóa và cao vút.');
    S.cam(4.4, 3, [0, 9, 0], [0, 8, -12]);
    S.at(7.4, () => { });
  },
  // 2. Every year all the fish tried to jump to the top. Whoever made it would become a dragon!
  S => {
    falls(S);
    const f = fishes(S);
    S.shot([6, 2, 6], [0, 2.4, -6]);
    f.forEach((x, i) => leap(S, x, .4 + i * .8, 2 + (i % 3)));
    S.cam(.3, 4, [-5, 2, 5], [0, 2.6, -6]);
    S.say(6.6, 'Splash! Splash! Up they jumped, and down they fell.', 'Tõm! Tõm! Nhảy lên rồi lại rơi xuống.');
    f.forEach((x, i) => leap(S, x, 6.6 + i * .4, 3));
    S.at(9.8, () => { });
  },
  // 3. One little carp jumped and fell, and jumped and fell again. Her friends gave up and swam home.
  S => {
    falls(S);
    const me = carp('#e8572a', '#ffcf5a'); me.scale.setScalar(.4); S.add(me, 0, -.1, -5, PI);
    const fr = fishes(S, 3);
    S.shot([3, 1.4, 2], [0, 1.4, -5]);
    leap(S, me, .4, 3); leap(S, me, 2.2, 3.4); S.cam(.3, 3, [2, 1.2, 0], [0, 1.6, -5]);
    fr.forEach((x, i) => go(S, x, 4 + i * .2, 3, [-4 + i * 4, -.1, 10]));
    S.cam(4, 3, [0, 4, 8], [0, 0, 0]);
    S.say(7.9, 'But she did not give up.', 'Nhưng chú không bỏ cuộc.');
    leap(S, me, 8, 3.6); S.cam(7.9, 1.6, [2.4, 1.6, -1], [0, 1.6, -5]);
    S.at(10.4, () => { });
  },
  // 4. But the little carp kept practising, day after day.
  S => {
    falls(S);
    const me = carp('#e8572a', '#ffcf5a'); me.scale.setScalar(.4); S.add(me, 0, -.1, -5, PI);
    S.shot([3, 1.4, 2], [0, 1.6, -5]);
    leap(S, me, .3, 3.6); S.skyTo(1.4, 1, '#f09a5a', '#ffd8a8'); S.skyTo(2.6, 1, '#7cc8f0', '#eaf7ff');
    S.cam(.3, 3, [2.6, 2, 1], [0, 2, -5]);
    S.help(4.6, 'Tap to help her practise!', 'Chạm để giúp chú tập nhảy nào!', tt => {
      leap(S, me, tt, 5);
      S.cam(tt, 1.6, [3, 3, 2], [0, 3, -6]);
    }, [0, .6, -5], 2.3);
  },
  // 5. At last she leapt over the top, and turned into a shining dragon!
  S => {
    falls(S);
    const me = carp('#e8572a', '#ffcf5a'); me.scale.setScalar(.4); S.add(me, 0, -.1, -6, PI);
    const sp = Pp.sparkle('#ffe27a'); S.add(sp, 0, 10, -14);
    S.shot([4, 3, 6], [0, 4, -8]);
    S.cam(.3, 3, [2, 2, 2], [0, 2, -7]);
    S.help(5.3, 'Tap for the biggest leap!', 'Chạm để nhảy thật cao nào!', tt => {
      S.tw(tt, 1.2, k => { me.position.set(0, -.1 + k * 11, -6 - k * 7); me.rotation.x = -.9; });
      S.show(me, tt + 1.2, false); S.show(sp, tt + 1.2);
      const d = serpent(S, { n: 18, r: .4, colors: ['#e8572a', '#ffcf5a', '#e8b62a'], head: '#e8572a', horns: true, y: 11, waveAmp: .8 }); d.userData.lay(0, -14, 0); d.visible = false;
      S.show(d, tt + 1.2); slither(S, d, tt + 1.2, 1.1, [3, 13, -10], .6);
      S.cam(tt, 1.8, [0, 8, 8], [0, 10, -12]);
    }, [0, .8, -6], 2.3);
  },
  // 6. That is why we say: keep trying, and one day you will fly too.
  S => {
    S.sky('#86c0f0', '#fff4e0'); L.sun(S, 40, 30, -150, 10); L.clouds(S, [[-12, 4, -20, 2.4], [10, 2, -26, 2.8], [0, -3, -10, 2]]);
    const d = serpent(S, { n: 22, r: .45, colors: ['#e8572a', '#ffcf5a', '#e8b62a'], head: '#e8572a', horns: true, y: 2, waveAmp: 1 }); d.userData.lay(-12, 0, H);
    S.shot([0, 2, 12], [0, 2, 0]);
    slither(S, d, .2, 3, [0, 3, -2], 1); slither(S, d, 3.2, 2.4, [6, 5, -6], 1);
    S.cam(.2, 5, [-2, 3, 10], [2, 3, -2]);
    S.say(5.4, 'Up, up she flew, over the clouds.', 'Rồng bay vút lên, bay trên những đám mây.');
    slither(S, d, 5.6, 2.4, [12, 8, -14], 1);
    S.at(8.4, () => { });
  }
] };
