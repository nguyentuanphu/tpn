// Ba lưỡi rìu (The Three Axes): the old iron axe falls into the river, Bụt brings up a golden axe, then a silver one,
// then the old iron one, and gives all three to the honest woodcutter. The child helps twice: "not mine!" (page 3) and
// taking the three axes (page 5).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, speak, turn, BUT, river, axe } from './kit.js';

const WOOD = LOOK({ style: 'shirt', color: '#7a6a4a', hat: 'nonla', hairStyle: 'short', skin: '#c89060' });
// Bụt rises from the river with an axe; the woodcutter on the bank
const scene = (S, color, shown = true) => {
  river(S);
  const w = S.person(WOOD, 0, 6, PI), but = S.person(BUT, 0, -2.6, 0); but.o.position.y = .1;
  const a = axe(color); a.scale.setScalar(1.4); S.grab(but, 0, a, [0, -.5, .1]); a.visible = shown;
  const sp = Pp.sparkle(color === '#9aa0a8' ? '#ffffff' : color); S.add(sp, .3, 1.6, -2.2);
  return { w, but, a, sp };
};
// "no": the head turns one way and the other
const no = (S, a, t) => { S.face(a, t, PI - .5, .3); S.face(a, t + .3, PI + .5, .3); S.face(a, t + .6, PI - .5, .3); return S.face(a, t + .9, PI, .3); };

export default { pages: [
  // 1. A poor woodcutter dropped his old iron axe into the river. He sat down and cried.
  S => {
    river(S); L.banyan(S, 3, 9, .7);
    const w = S.person(WOOD, 0, 6, PI * .9), a = axe(); S.grab(w, 0, a, [0, -.5, .1]);
    const sp = Pp.sparkle('#cfeeff'); S.add(sp, 0, -.2, 2);
    S.shot([3, 2.4, 11], [0, 1, 4]);
    S.do(w, .3, 'swing', 2.2); S.drop(a, 2.5); S.move(a, 2.51, .9, [0, -.6, 2], k => k * k, .8); S.show(sp, 3.3); S.show(sp, 5, false);
    S.mood(w, 2.6, 'o'); S.do(w, 2.6, 'surprised', 1.2); S.cam(2.2, 1.6, [2, 1.6, 6.4], [0, .2, 3]);
    S.do(w, 4, 'sitground', 5); S.mood(w, 4, 'sad');
    S.say(6.2, 'Without his axe, he could not cut any wood.', 'Mất rìu rồi, chàng không thể đốn củi được nữa.');
    S.cam(6, 3, [1.4, 1.2, 8.6], [0, .6, 6]);
    S.at(9.2, () => { });
  },
  // 2. Bụt appeared and brought up a golden axe. "Is this yours?" "No," said the woodcutter.
  S => {
    const { w, but, a, sp } = scene(S, '#ffcf33', false); but.o.position.y = -2.4; S.do(w, 0, 'sitground', 3); S.mood(w, 0, 'sad');
    S.shot([3, 2, 10], [0, 1.4, 1]);
    S.move(but.o, .3, 1.6, [0, .1, -2.6]); S.mood(but, 1, 'happy'); S.show(a, 2); S.show(sp, 2); S.do(but, 2.2, 'throw', 2);
    S.cam(.3, 2.6, [1.6, 1.8, 4], [0, 1.6, -2]);
    speak(S, but, 3, 1.4); S.do(w, 3.2, 'idle'); S.mood(w, 3.4, 'o');
    S.cam(4.2, 1.6, [-2, 1.8, 9], [0, 1.2, 4]); no(S, w, 5.2);
    S.say(7.6, 'The golden axe shone like the sun.', 'Lưỡi rìu vàng sáng lấp lánh như mặt trời.');
    S.cam(7.6, 2.4, [.6, 2.2, 1.4], [.3, 2, -2.2]);
    S.at(10.6, () => { });
  },
  // 3. Next Bụt brought up a silver axe. "Is this yours?" "No, it is not," he said again.
  S => {
    const { w, but, a, sp } = scene(S, '#e8eef6', false);
    S.shot([3, 2, 10], [0, 1.4, 1]);
    S.show(a, .6); S.show(sp, .6); S.do(but, .8, 'throw', 2); speak(S, but, 1.6, 1.4);
    S.cam(.3, 2.4, [1.4, 2, 3.6], [0, 1.8, -2]);
    S.cam(3.4, 1.6, [-2, 1.8, 9], [0, 1.2, 4]); S.mood(w, 3.4, 'smile');
    S.help(6.4, 'Tap to say: not mine!', 'Chạm để nói: không phải của con!', tt => {
      no(S, w, tt); S.do(w, tt + 1.2, 'bow', 1); S.mood(but, tt + 1, 'happy');
      S.cam(tt, 1.4, [0, 2, 9], [0, 1.4, 2]);
    }, [0, 1.6, 6], 2.3);
  },
  // 4. Then Bụt brought up the old iron axe. "Yes! That is mine!" said the woodcutter happily.
  S => {
    const { w, but, a, sp } = scene(S, '#9aa0a8', false);
    S.shot([3, 2, 10], [0, 1.4, 1]);
    S.show(a, .6); S.show(sp, .6); S.do(but, .8, 'throw', 2);
    S.cam(.3, 2.4, [1.4, 2, 3.6], [0, 1.8, -2]);
    S.mood(w, 3, 'happy'); S.do(w, 3.2, 'cheer', 2); S.cam(3, 1.6, [-2, 1.8, 9], [0, 1.2, 4]);
    S.say(6.9, 'He held his old axe close. It was his!', 'Chàng ôm chặt lưỡi rìu sắt cũ. Đúng là của chàng!');
    S.walk(w, 6.9, [0, 1.6]); S.at(8.6, () => { a.visible = false; }); const mine = axe(); mine.visible = false; S.grab(w, 0, mine, [0, -.5, .1]); S.show(mine, 8.6); S.do(w, 8.7, 'hug', 1.4);
    S.cam(6.9, 2.4, [2, 1.6, 4.4], [0, 1.2, .6]);
    S.at(10, () => { });
  },
  // 5. Bụt smiled: "You are honest. Take all three axes as a gift!"
  S => {
    river(S);
    const w = S.person(WOOD, 0, 3, PI), but = S.person(BUT, 0, -2.6, 0);
    const axes = ['#ffcf33', '#e8eef6', '#9aa0a8'].map((c, i) => { const a = axe(c); a.scale.setScalar(1.4); S.add(a, -1 + i, 2, -2); return a; });
    const sp = Pp.sparkle('#ffe27a'); S.add(sp, 0, 1.6, -2); S.show(sp, .4);
    S.shot([3, 2, 10], [0, 1.4, 0]);
    S.mood(but, .2, 'happy'); speak(S, but, .4, 3); S.cam(.3, 3, [0, 2, 3], [0, 1.8, -2]);
    S.cam(3.6, 2, [3, 2.4, 9], [0, 1.4, .6]);
    S.help(6.7, 'Tap to take the three axes!', 'Chạm để nhận ba lưỡi rìu nào!', tt => {
      axes.forEach((a, i) => S.move(a, tt + i * .2, .9, [-.8 + i * .8, 0, 4], undefined, 1));
      S.mood(w, tt + .6, 'happy'); S.do(w, tt + 1, 'cheer', 1.2); S.do(but, tt + 1, 'wave', 1.2);
      S.cam(tt, 1.6, [2, 2, 8], [0, .6, 3.4]);
    }, [0, 2, -2], 2.3);
  },
  // 6. Telling the truth is always the best choice.
  S => {
    river(S); L.banyan(S, 5, 8, .8);
    const w = S.person(WOOD, -5, 6, H), axes = ['#ffcf33', '#e8eef6', '#9aa0a8'].map(c => axe(c));
    axes.forEach((a, i) => S.grab(w, 0, a, [0, -.5 + i * .12, .1 + i * .06], i === 1 ? 'armL' : 'armR'));
    S.shot([0, 2.4, 13], [0, 1, 6]);
    S.walk(w, .2, [4, 6], 1.8); S.mood(w, .2, 'happy'); S.cam(.2, 3, [0, 1.8, 10], [0, 1, 6]);
    S.say(3.1, 'Always tell the truth, like the honest woodcutter.', 'Hãy luôn nói thật, như chàng tiều phu thật thà.');
    S.face(w, 5.4, 0); S.do(w, 5.8, 'wave', 1.4);
    S.at(7.2, () => { });
  }
] };
