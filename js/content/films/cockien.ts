// Cóc kiện trời (The Toad Who Sued the Sky): the long drought, Toad sets off for the sky, the bee, the rooster, the fox
// and the tiger join him, the drum at the sky palace, the Sky King's promise, and the rain when toads croak. The child
// helps twice: Toad's hops (page 2) and the big drum (page 4).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, go, hop, speak, turn, heaven, plain, toad, tiger, jackal, animal, bird, drum, rain, flat } from './kit.js';

const SKYKING = LOOK({ style: 'tunic', color: '#ffd23f', hat: 'crown', hairStyle: 'short', hair: '#f4f4f4', skin: '#e8c0a0' });
const GUARD = LOOK({ style: 'tunic', color: '#3a6ab0', hat: 'silkcap', skin: '#e0aa80' });
const bee = () => { const b = bird('#ffd23f', .7); b.children[0].add(mesh([P(new THREE.BoxGeometry(.2, .05, .3), '#2a2a2a', [0, .02, 0])])); return b; };
// the dry land: cracked brown earth, dead grass, a hot sun
const dry = S => { plain(S); L.ground(S, '#c8a068'); for (let i = 0; i < 14; i++) S.add(mesh([P(new THREE.BoxGeometry(1.4, .02, .04), '#8a6a3a', [0, .01, 0])]), Math.cos(i * 2.4) * 5, 0, Math.sin(i * 2.4) * 3 + 1, i, 0); };
const team = S => {
  const t = toad('#8a8a3a'); S.add(t, 0, 0, 2);
  const b = bee(); S.add(b, -1, 1.2, 1.6); const r = animal(S, 'chicken', -1.6, 1, 0, 1.2); const f = jackal('#e07a2a'); S.add(f, 1.6, 0, .8); const tg = tiger(); S.add(tg, -.2, 0, -.6);
  return { t, b, r, f, tg };
};

export default { pages: [
  // 1. Once there was no rain for a very long time. Plants dried up, and animals were thirsty.
  S => {
    dry(S); L.sun(S, 0, 26, -60, 7, '#ffd070');
    const pd = S.add(mesh([P(new THREE.CylinderGeometry(2.4, 2.4, .05, 20), '#a88a5a', [0, .02, 0])]), 0, 0, 0);
    const dog = animal(S, 'puppy', -2, 1.4, .6), hen = animal(S, 'chicken', 2, 1.6, -.6), cow = animal(S, 'buffalo', 4, -2, -1);
    const tw = toad('#8a8a3a'); S.add(tw, .4, 0, 2.6, PI * .9);
    S.shot([0, 3, 10], [0, 1, 0]);
    S.cam(.2, 4, [0, 1.4, 7], [0, .4, 1]);
    S.tw(.6, 5, k => { dog.rotation.y = .6 + Math.sin(k * 6) * .3; }, k => k);
    S.say(6.6, 'The ponds were empty, and the fields cracked in the sun.', 'Ao hồ cạn khô, ruộng đồng nứt nẻ dưới nắng.');
    S.cam(6.6, 2.8, [3, 5, 9], [0, 0, 0]);
    S.at(9.6, () => { });
  },
  // 2. Little Toad decided to go up to the sky to ask the Sky King for rain.
  S => {
    dry(S); L.clouds(S, [[2, 6, -6, 1.2], [5, 9, -12, 1.4], [8, 12, -18, 1.6]]);
    const t = toad('#8a8a3a'); S.add(t, -2, 0, 2, .7);
    S.shot([-4, 2, 8], [0, 1, 0]);
    hop(S, t, .4, 2, .3); S.move(t, .4, .9, [-1, 0, 1.5]);
    S.cam(.3, 3, [-2, 1.4, 5], [0, 1.6, -2]);
    S.help(4.8, 'Tap to help Toad hop!', 'Chạm để Cóc nhảy nào!', tt => {
      hop(S, t, tt, 4, .6); S.move(t, tt, 1.8, [3, 0, -1.6]);
      S.cam(tt, 1.8, [0, 2.4, 6], [2, 1, -1]);
    }, [-1, .4, 1.5], 2.3);
  },
  // 3. On the way, a bee, a rooster, a fox and a tiger joined him.
  S => {
    dry(S);
    const { t, b, r, f, tg } = team(S);
    [b, r, f, tg].forEach((a, i) => { const to = a.position.clone(); a.position.x += i % 2 ? 9 : -9; go(S, a, .3 + i * .7, 1.4, [to.x, to.y, to.z]); });
    S.shot([0, 2.6, 8], [0, .8, 1]);
    S.cam(.2, 4, [3, 2, 6.4], [0, .6, 1]);
    S.say(5.4, 'Off they went together, all the way up to the sky.', 'Cả đoàn cùng nhau lên đường, đi mãi lên tận trời.');
    [t, b, r, f, tg].forEach((a, i) => go(S, a, 5.4 + i * .1, 2.6, [a.position.x + 2, a.position.y, a.position.z - 7]));
    hop(S, t, 5.4, 5, .3, .5);
    S.cam(5.4, 2.6, [0, 4, 9], [1, 1, -4]);
    S.at(8.4, () => { });
  },
  // 4. Toad beat the big drum at the sky palace. The Sky King's helpers tried to stop him, but his friends helped bravely.
  S => {
    heaven(S);
    const { t, b, r, f, tg } = team(S);
    const dr = drum(); dr.scale.setScalar(1.6); S.add(dr, 2.4, 0, -6);
    const guards = [0, 1].map(i => S.person(GUARD, -3 + i * 6, -9, 0));
    S.shot([0, 3, 10], [0, 1.4, -3]);
    go(S, t, .2, 1.4, [2.2, 0, -4.8]); hop(S, t, .2, 3, .3);
    S.cam(.3, 3, [4, 2.4, 2], [2, 1, -5]);
    guards.forEach((g, i) => { S.walk(g, 2.6, [i ? 3.6 : .8, -5.6]); S.mood(g, 2.6, 'sad'); });
    S.cam(3.4, 3, [0, 3, 9], [1, 1.2, -4]);
    S.help(7.7, 'Tap to beat the drum!', 'Chạm để đánh trống nào!', tt => {
      S.tw(tt, 1.2, k => { dr.scale.set(1.6, 1.6 * (1 - Math.abs(Math.sin(k * PI * 5)) * .08), 1.6); }, k => k);
      hop(S, t, tt, 2, .5); go(S, b, tt + .2, .6, [-2, 1.6, -5]); hop(S, r, tt + .2, 2, .5); hop(S, tg, tt + .3, 1, .6);
      guards.forEach((g, i) => { S.mood(g, tt + .5, 'o'); S.do(g, tt + .5, 'surprised', .6); S.walk(g, tt + 1, [i ? 6 : -4, -9], 5); });
      S.cam(tt, 1.6, [0, 3.4, 8], [1, 1, -5]);
    }, [2.4, 1.4, -6], 2.3);
  },
  // 5. The Sky King said: "You are brave, Toad. From now on, when you croak, I will send rain."
  S => {
    heaven(S);
    const king = S.person(SKYKING, 0, -8, 0, 1.3), { t, b, r, f, tg } = team(S);
    S.shot([0, 2.6, 9], [0, 2, -4]);
    S.cam(.2, 3, [0, 2.4, -1], [0, 2.4, -8]);
    speak(S, king, .6, 4.6); S.mood(king, .6, 'happy');
    S.cam(4, 2.4, [-3, 2.4, 6], [0, 1, -2]);
    S.say(7.6, 'Toad bowed low and thanked the Sky King.', 'Cóc cúi đầu cảm ơn Trời.');
    S.tw(7.6, 1.2, k => { t.rotation.x = Math.sin(k * PI) * .5; });
    [r, f, tg].forEach((a, i) => hop(S, a, 8.4 + i * .2, 2, .4));
    S.cam(7.6, 2.6, [2, 1.4, 5.6], [0, .4, 2]);
    S.at(10.6, () => { });
  },
  // 6. That is why, when toads croak, the rain comes! Being small does not mean you cannot be brave.
  S => {
    dry(S);
    const t = toad('#8a8a3a'); S.add(t, 0, 0, 2.6);
    const dog = animal(S, 'puppy', -2, 1.6, .6), hen = animal(S, 'chicken', 2.2, 1.6, -.6);
    const green = S.add(flat(80, 80, '#8fcf6a', .006)); green.visible = false;
    S.shot([0, 2, 7], [0, .6, 2]);
    S.tw(.4, 1.6, k => { t.scale.set(1 + Math.sin(k * PI * 4) * .1, 1, 1); });
    S.skyTo(1.4, 1.4, '#7a8aa0', '#c8d0d8'); rain(S, 2.4);
    S.at(4, () => { green.visible = true; }); S.skyTo(5, 1.4, '#7cc8f0', '#e8f6ff');
    S.cam(1.4, 3.4, [0, 3, 9], [0, 1, 0]);
    S.say(6.7, 'Splish, splash! Everyone danced in the rain.', 'Lách tách, lách tách! Ai cũng nhảy múa dưới mưa.');
    hop(S, t, 6.7, 4, .4); hop(S, dog, 6.9, 4, .3); hop(S, hen, 7, 4, .3);
    S.cam(6.6, 3, [2, 1.6, 6], [0, .6, 2]);
    S.at(9.8, () => { });
  }
] };
