// Thầy bói xem voi (The Blind Men and the Elephant): five friends who cannot see each touch one part of an elephant
// (the trunk, an ear, a leg, the tail), argue, and only together find the whole elephant. The child helps twice: the
// trunk wiggles (page 2) and the ear flaps (page 3).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, speak, village, animal } from './kit.js';

const MEN = ['#6a4a8a', '#3a6a8a', '#8a4a3a', '#4a7a4a', '#8a7a3a'].map(c => LOOK({ style: 'tunic', color: c, hat: 'nonla', hairStyle: 'short', hair: '#e8e8e8', skin: '#e0aa80' }));
const stick = () => mesh([P(new THREE.CylinderGeometry(.025, .025, 1.3, 5), '#8a5a32', [0, -.2, .1])]);
// the elephant in the middle of the yard, and the five men round it, eyes closed, each with a stick
const yard = S => {
  village(S, { house: [-6, -9], paddy: false });
  const el = animal(S, 'elephant', 0, 0, H, 1.7), rig = el.userData.rig;
  const spots = [[2.6, .2], [.8, 1.6], [-.6, 1.5], [-2.6, .3], [.4, -1.6]];
  const men = MEN.map((l, i) => { const a = S.person(l, spots[i][0], spots[i][1], Math.atan2(-spots[i][0], -spots[i][1])); S.mood(a, 0, 'sleep'); S.grab(a, 0, stick(), [0, -.45, .1], 'armL'); return a; });
  return { el, rig, men };
};

export default { pages: [
  // 1. Five friends who could not see wanted to know what an elephant looks like. So they touched one!
  S => {
    village(S, { house: [-6, -9], paddy: false });
    const el = animal(S, 'elephant', 0, 0, H, 1.7);
    const men = MEN.map((l, i) => { const a = S.person(l, -9 + i * .9, 4, H); S.mood(a, 0, 'sleep'); S.grab(a, 0, stick(), [0, -.45, .1], 'armL'); return a; });
    S.shot([0, 3, 11], [0, 1.4, 1]);
    men.forEach((a, i) => S.walk(a, .2 + i * .25, [-3.2 + i * 1.6, 2.6], .9));
    S.cam(.2, 4, [-4, 2.4, 9], [-1, 1.2, 2]);
    S.say(6.7, 'Step, step, step. They walked up close to the big elephant.', 'Bước, bước, bước. Các ông lần đến gần chú voi to.');
    men.forEach((a, i) => S.do(a, 6.8 + i * .1, 'give', 2.6)); S.cam(6.6, 3, [3, 3, 8], [0, 1.6, 1]);
    S.at(9.8, () => { });
  },
  // 2. One touched the trunk: "An elephant is like a snake!"
  S => {
    const { el, men } = yard(S);
    S.shot([5, 2, 4], [2.4, 1.6, .2]);
    S.do(men[0], .2, 'give', 4); S.cam(.2, 2, [4.4, 1.8, 2.4], [2.2, 1.4, .2]);
    speak(S, men[0], 1, 2); S.mood(men[0], 1, 'o');
    S.help(4.5, 'Tap to wiggle the trunk!', 'Chạm để vòi voi ngọ nguậy nào!', tt => {
      S.tw(tt, 2, k => { el.userData.nod = Math.sin(k * PI * 6) * .35; }, k => k);
      S.do(men[0], tt + .2, 'surprised', 1.4); S.mood(men[0], tt + .2, 'happy');
    }, [2.4, 1.6, .2], 2.3);
  },
  // 3. One touched the ear: "No, it is like a big fan!"
  S => {
    const { rig, men } = yard(S);
    S.shot([1.4, 2, 4.6], [.6, 1.8, 1]);
    S.do(men[1], .2, 'stretch', 3.6); S.cam(.2, 2, [1.8, 1.8, 4.4], [.6, 1.9, .8]);
    speak(S, men[1], 1, 2.4); S.mood(men[1], 1, 'happy');
    S.help(4.5, 'Tap to flap the big ear!', 'Chạm để tai voi phe phẩy nào!', tt => {
      S.tw(tt, 2, k => { (rig.ears || []).forEach((e, i) => { e.rotation.y = (i ? -1 : 1) * Math.sin(k * PI * 6) * .5; }); }, k => k);
      S.do(men[1], tt + .2, 'cheer', 1.4);
    }, [.6, 2, .6], 2.3);
  },
  // 4. One touched a leg: "No, it is like a tree trunk!" One touched the tail: "It is like a broom!"
  S => {
    const { men } = yard(S);
    S.shot([-1, 1.4, 5], [-.6, .8, 1]);
    S.do(men[2], .2, 'hug', 3.4); speak(S, men[2], .8, 2); S.cam(.2, 2.4, [-.4, 1.2, 4], [-.6, .8, 1.2]);
    S.do(men[3], 3.6, 'pull', 3.4); speak(S, men[3], 4.2, 2); S.cam(3.6, 1.8, [-5.4, 1.6, 2], [-2.4, 1, .2]);
    S.say(8.4, 'Each one was sure he was right.', 'Ông nào cũng chắc mình nói đúng.');
    men.forEach(a => S.mood(a, 8.4, 'happy')); S.cam(8.4, 2.6, [0, 3.6, 9], [0, 1.2, 0]);
    S.at(11.2, () => { });
  },
  // 5. They argued and argued, because each one only knew one part.
  S => {
    village(S, { house: [-6, -9], paddy: false });
    const men = MEN.map((l, i) => { const a = i / 5 * PI * 2, x = Math.cos(a) * 1.6, z = 2 + Math.sin(a) * 1.2; const m = S.person(l, x, z, Math.atan2(-x, 2 - z)); S.mood(m, 0, 'sad'); return m; });
    S.shot([0, 2.6, 8], [0, 1.2, 2]);
    men.forEach((a, i) => { speak(S, a, .2 + i * .6, 1.4); S.do(a, .2 + i * .6, 'point', 1.4); });
    S.cam(.2, 4, [3, 2, 6], [0, 1.4, 2]);
    S.say(4.9, 'Snake! Fan! Tree! Broom! Who was right?', 'Con đỉa! Cái quạt! Cái cột! Cái chổi! Ai đúng nhỉ?');
    men.forEach((a, i) => S.do(a, 5 + i * .1, 'surprised', 2.4)); S.cam(4.9, 2.4, [-3, 2.4, 6], [0, 1.2, 2]);
    S.at(7.8, () => { });
  },
  // 6. Put everyone's ideas together, and you can see the whole elephant!
  S => {
    const { el, men } = yard(S);
    S.shot([0, 6, 10], [0, 1, 0]);
    men.forEach((a, i) => { S.do(a, .3 + i * .1, 'give', 2.6); S.mood(a, .6, 'happy'); });
    S.cam(.2, 3.6, [6, 3, 7], [0, 1.4, 0]);
    S.say(4.7, 'Together they laughed: "It is an elephant!"', 'Các ông cùng cười vang: "Đây là con voi!"');
    men.forEach((a, i) => S.do(a, 4.8, 'cheer', 2.4));
    S.tw(4.8, 2, k => { el.userData.nod = -Math.sin(k * PI) * .4; });
    S.cam(4.7, 2.6, [0, 2.6, 8], [0, 1.4, 0]);
    S.at(7.6, () => { });
  }
] };
