// Ganesha and the Magic Mango (Thần Ganesha và quả xoài thần), told gently and with respect: the one magic mango, the
// race around the world three times, Kartikeya flies off on his peacock, Ganesha on his little mouse walks around his
// mother and father three times, "you are my whole world", and the mango is his. The child helps twice: Ganesha's
// three slow circles (page 4) and giving the mango (page 6).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, go, hop, turn, speak, indiaVillage, animal, mouse, mango, board } from './kit.js';

const SHIVA = LOOK({ style: 'tunic', color: '#3a6ab0', hairStyle: 'short', skin: '#c8a888' });
const PARVATI = LOOK({ style: 'aodai', color: '#e8572a', hairStyle: 'long', skin: '#d8a070' });
const KARTIK = LOOK({ style: 'tunic', color: '#e8b62a', hat: 'crown', hairStyle: 'short', skin: '#d8a070' });
const SAGE = LOOK({ style: 'tunic', color: '#f2a03a', hairStyle: 'short', hair: '#f4f4f4', skin: '#c89070' });
const GAN = LOOK({ style: 'tunic', color: '#ffd23f', hairStyle: 'short', skin: '#e8b0a0' });
// Ganesha: a kind child with an elephant's head (soft pink-grey), big ears, a curling trunk and a little gold crown
function ganesha(S, x, z, yaw, scale = .9) {
  const a = S.person(GAN, x, z, yaw, scale), h = a.A.head;
  h.children.forEach(c => { c.visible = false; });
  h.add(mesh([P(new THREE.SphereGeometry(.42, 16, 12), '#e0a8a0', [0, .3, 0]), ...[-1, 1].map(s => P(new THREE.SphereGeometry(.32, 12, 10), '#e8b8b0', [s * .42, .32, -.05], [0, 0, 0], [.35, 1, .9])),
    P(new THREE.CylinderGeometry(.1, .06, .55, 8), '#e0a8a0', [0, .02, .38], [.5, 0, 0]), P(new THREE.CylinderGeometry(.06, .05, .25, 8), '#e0a8a0', [0, -.24, .52], [-.4, 0, 0]),
    ...[-1, 1].flatMap(s => [P(new THREE.SphereGeometry(.06, 8, 6), '#ffffff', [s * .16, .4, .36]), P(new THREE.SphereGeometry(.035, 6, 5), '#1a1a1a', [s * .16, .41, .41])]),
    P(new THREE.CylinderGeometry(.18, .26, .22, 8), '#ffcf33', [0, .76, 0]), P(new THREE.ConeGeometry(.08, .2, 6), '#ffcf33', [0, .95, 0])]));
  return a;
}

export default { pages: [
  // 1. A wise man brought one magic mango to Lord Shiva and Parvati. Their sons, Ganesha and Kartikeya, both wanted it.
  S => {
    indiaVillage(S, { well: false });
    const sh = S.person(SHIVA, -1, -1, .2), pa = S.person(PARVATI, 1, -1, -.2), g = ganesha(S, -2, 2.4, .4), k = S.person(KARTIK, 2, 2.4, -.4, .9), sage = S.person(SAGE, 6, 2, -H);
    const m = mango(); m.scale.setScalar(1.6); S.grab(sage, 0, m, [0, -.5, .15]);
    S.shot([0, 2.4, 9], [0, 1.2, 1]);
    S.walk(sage, .3, [0, 1.4]); S.do(sage, 3, 'give', 1.6); S.cam(.3, 3, [3, 2, 7], [1, 1.2, 1]);
    S.mood(g, 3.4, 'o'); S.mood(k, 3.4, 'o'); S.do(g, 4, 'point', 1.6); S.do(k, 4.2, 'point', 1.6);
    S.say(9.4, 'It glowed, sweet and golden.', 'Quả xoài sáng vàng, thơm ngọt.');
    S.cam(9.4, 2, [0, 1.6, 3.4], [0, 1, 1.4]);
    S.at(11.6, () => { });
  },
  // 2. "Whoever goes around the whole world three times first wins the mango," said their parents.
  S => {
    indiaVillage(S, { well: false });
    const sh = S.person(SHIVA, -1, -1, .2), pa = S.person(PARVATI, 1, -1, -.2), g = ganesha(S, -1.4, 2.4, PI * .9), k = S.person(KARTIK, 1.4, 2.4, -PI * .9, .9);
    S.shot([0, 2, 8], [0, 1.2, 0]);
    speak(S, sh, .3, 2.2); speak(S, pa, 2.6, 2); S.mood(sh, .3, 'happy'); S.mood(pa, .3, 'happy');
    S.cam(.3, 3, [0, 1.6, 4.4], [0, 1.3, -1]);
    S.say(5.8, 'The two brothers got ready to go.', 'Hai anh em chuẩn bị lên đường.');
    S.do(k, 5.9, 'stretch', 1.6); S.do(g, 5.9, 'bow', 1.4); S.cam(5.8, 2.4, [0, 1.6, 7.4], [0, 1, 2]);
    S.at(8.6, () => { });
  },
  // 3. Kartikeya jumped on his fast peacock and flew off at once!
  S => {
    indiaVillage(S, { well: false });
    const pc = animal(S, 'peacock', 1.6, 2, -.4, 3), k = S.person(KARTIK, 0, 0, 0, .9); board(k, pc.children[0], [0, .55, -.05], 0, .4);
    S.shot([0, 2.4, 9], [1, 1.4, 1]);
    S.mood(k, .2, 'happy'); S.move(pc, 1, 2.6, [12, 9, -16], k => k * k); S.cam(.3, 3.4, [-1, 2, 7], [3, 3, -3]);
    S.say(4.5, 'Whoosh! Over the hills and far away.', 'Vút! Bay qua đồi núi, xa thật xa.');
    S.cam(4.5, 2.6, [0, 3, 8], [6, 6, -12]);
    S.at(7.2, () => { });
  },
  // 4. Ganesha rode a little mouse. He walked slowly around his mother and father, three times.
  S => {
    indiaVillage(S, { well: false });
    const sh = S.person(SHIVA, -.6, 0, 0), pa = S.person(PARVATI, .6, 0, 0), ms = mouse('#a8a8b8'); ms.scale.setScalar(4); S.add(ms, 0, 0, 2.4, H);
    const g = ganesha(S, 0, 0, 0, .7); board(g, ms.children[0], [0, .9, 0], 0, .4);
    S.shot([0, 3, 8], [0, 1, 0]);
    S.mood(sh, 0, 'happy'); S.mood(pa, 0, 'happy'); S.cam(.3, 3, [2, 2.4, 6], [0, 1, 0]);
    S.help(5.8, 'Tap to walk around Mother and Father!', 'Chạm để đi vòng quanh cha mẹ nào!', tt => {
      S.tw(tt, 2.2, k => { const a = k * PI * 6 + H; ms.position.set(Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4); ms.rotation.y = -a; }, k => k);
      S.cam(tt, 2.2, [0, 5, 7], [0, .8, 0]);
    }, [0, 1, 2.4], 2.3);
  },
  // 5. "You are my whole world," Ganesha said.
  S => {
    indiaVillage(S, { well: false });
    const sh = S.person(SHIVA, -.8, 0, .2), pa = S.person(PARVATI, .8, 0, -.2), g = ganesha(S, 0, 1.8, PI);
    S.shot([0, 1.8, 6], [0, 1.2, .8]);
    speak(S, g, .3, 2.4); S.do(g, .3, 'hug', 2.4); S.cam(.3, 2.6, [3.2, 1.6, 1.4], [0, 1.2, .9]);
    S.say(4.4, 'Mother and Father hugged him close.', 'Cha mẹ ôm Ganesha thật chặt.');
    S.do(sh, 5.1, 'hug', 2.2); S.do(pa, 5.1, 'hug', 2.2); S.mood(sh, 5, 'happy'); S.mood(pa, 5, 'happy');
    S.cam(5, 2.4, [-3.2, 1.6, 1.6], [0, 1.2, .8]);
    S.at(7.8, () => { });
  },
  // 6. His parents smiled and gave him the mango. Love and wisdom matter more than speed.
  S => {
    indiaVillage(S, { well: false });
    const sh = S.person(SHIVA, -.8, 0, .2), pa = S.person(PARVATI, .8, 0, -.2), g = ganesha(S, 0, 1.8, PI), m = mango(); m.scale.setScalar(1.6); S.grab(pa, 0, m, [0, -.5, .15]);
    S.shot([0, 1.8, 6], [0, 1.2, .8]);
    S.mood(pa, 0, 'happy'); S.mood(sh, 0, 'happy'); S.cam(.3, 3, [0, 1.6, 4.6], [0, 1.2, 1]);
    S.help(5.8, 'Tap to give Ganesha the mango!', 'Chạm để trao xoài cho Ganesha nào!', tt => {
      S.do(pa, tt, 'give', 1); S.grab(g, tt + .8, m, [0, -.5, .15]); S.mood(g, tt + .8, 'happy'); S.do(g, tt + 1, 'cheer', 1.2);
      const sp = Pp.sparkle('#ffe27a'); S.add(sp, 0, .8, 1.4); S.show(sp, tt + .8); S.cam(tt, 1.8, [1.4, 1.6, 4.4], [0, 1.2, 1.4]);
    }, [.6, 1.2, .4], 2.3);
  }
] };
