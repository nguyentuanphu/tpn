// The Rainbow Serpent (Rắn Cầu Vồng), a simple, respectful telling: the flat quiet land, the great serpent wakes and
// moves across it, hills, valleys and riverbeds form where she wriggles, she calls the rain, the animals come to the
// water, and the rainbow after rain. The child helps twice: the serpent wakes (page 2) and calls the rain (page 4).
import { L, Pp, THREE, P, mesh, PI, H, go, hop, serpent, slither, flat, toad, animal, bird, carp, rain, rock } from './kit.js';

const RAINBOW = ['#e8332a', '#ff8a2a', '#ffd23f', '#43c463', '#3cb0e8', '#7a5ad8'];
const land = (S, { hills = 0, water = false } = {}) => {
  S.sky('#5ab0f0', '#fff0d8'); L.sun(S, 50, 40, -160, 10, '#ffe08a'); L.ground(S, '#c8865a');
  if (hills) [[-14, -20, 8], [10, -24, 10], [24, -16, 6], [-28, -14, 7]].forEach(([x, z, h], i) => { const m = mesh([P(new THREE.SphereGeometry(h, 16, 10), i % 2 ? '#b8703a' : '#c8804a', [0, 0, 0], [0, 0, 0], [1.6, hills * .5, 1])]); S.add(m, x, 0, z); });
  const river = flat(3.2, 60, '#5ab0d0', .01); river.rotation.y = .3; river.visible = water; S.add(river, 0, 0, -4);
  return river;
};
const make = S => serpent(S, { n: 30, r: .6, colors: RAINBOW, head: '#3cb0e8', y: .5, waveAmp: 1.2 });

export default { pages: [
  // 1. Many Aboriginal peoples tell stories of the Rainbow Serpent. In the beginning, the land was flat and quiet.
  S => {
    land(S); [[-5, -6], [6, -10], [2, 2]].forEach(([x, z], i) => S.add(rock('#a8705a', .8 + i * .3), x, 0, z));
    S.shot([0, 6, 18], [0, 0, -10]);
    S.cam(.3, 8, [0, 3, 6], [0, 1, -30]);
    S.say(9.6, 'No hills, no rivers, no sound at all.', 'Không đồi núi, không sông suối, không một tiếng động.');
    S.cam(9.6, 3, [6, 8, 10], [0, 0, -14]);
    S.at(12.6, () => { });
  },
  // 2. The great Rainbow Serpent woke up and moved across the land.
  S => {
    land(S);
    const sn = make(S); sn.userData.lay(-6, 2, H);
    S.shot([0, 4, 12], [-2, .5, 2]);
    S.cam(.3, 3, [-2, 2, 8], [-5, .5, 2]);
    S.help(4.8, 'Tap to wake the Rainbow Serpent!', 'Chạm để đánh thức Rắn Cầu Vồng nào!', tt => {
      slither(S, sn, tt, 2.2, [6, .5, -4], .4);
      S.cam(tt, 2.2, [4, 5, 12], [2, .5, -2]);
    }, [-6, .8, 2], 2.3);
  },
  // 3. Where she wriggled, she made hills, valleys and riverbeds.
  S => {
    const river = land(S); river.visible = true; river.scale.set(1, 1, .01);
    const hills = [[-8, -10, 4], [8, -12, 5], [14, -6, 3]].map(([x, z, h], i) => { const m = mesh([P(new THREE.SphereGeometry(h, 16, 10), i % 2 ? '#b8703a' : '#c8804a', [0, 0, 0], [0, 0, 0], [1.6, .6, 1])]); m.scale.set(1, .01, 1); return S.add(m, x, 0, z); });
    const sn = make(S); sn.userData.lay(-14, 6, PI * .8);
    S.shot([0, 10, 18], [0, 0, -4]);
    slither(S, sn, .2, 2, [-6, .5, -2], .3); hills.forEach((h, i) => S.tw(1 + i * .9, 1.4, k => h.scale.set(1, k, 1)));
    slither(S, sn, 2.2, 2.4, [10, .5, -8], .3); S.tw(2.2, 2.4, k => river.scale.set(1, 1, Math.max(.01, k)));
    S.cam(.2, 4.6, [-4, 8, 14], [2, 0, -6]);
    S.say(5.1, 'The land was full of shapes and paths.', 'Mặt đất đầy những dáng hình và lối đi.');
    S.cam(5, 2.6, [10, 6, 10], [0, 0, -6]);
    S.at(7.8, () => { });
  },
  // 4. She called the rain, and the water filled the rivers and waterholes.
  S => {
    const river = land(S, { hills: 1, water: true }); river.material.color.set('#a8865a');
    const sn = make(S); sn.userData.lay(-3, 3, H);
    S.shot([0, 6, 14], [0, 1, -2]);
    S.tw(.4, 2, k => { sn.userData.head.position.y = .5 + Math.sin(k * PI) * 1.4; });
    S.cam(.3, 3, [2, 4, 10], [-2, 1, 0]);
    S.help(4.9, 'Tap to call the rain!', 'Chạm để gọi mưa về nào!', tt => {
      S.skyTo(tt, .8, '#6a7a90', '#b8c4d0'); rain(S, tt + .4, tt + 2.3, 0, -2, 30);
      S.tw(tt + .6, 1.6, k => river.material.color.set('#a8865a').lerp(new THREE.Color('#5ab0d0'), k));
      S.cam(tt, 2, [0, 8, 14], [0, 0, -4]);
    }, [-3, 1, 3], 2.3);
  },
  // 5. The frogs woke up, and all the animals came to drink and live by the water.
  S => {
    land(S, { hills: 1, water: true }); S.add(mesh([P(new THREE.CylinderGeometry(3, 3, .05, 24), '#5ab0d0', [0, .03, 0])]), 0, 0, 1);
    const frogs = [0, 1, 2].map(i => { const f = toad('#5ab84a', '#3a8a2a'); f.scale.setScalar(.6); return S.add(f, -1.6 + i * 1.4, 0, 3.6, PI); });
    const roo = animal(S, 'joey', -9, 4, H, 1.6), emu = animal(S, 'emu', 9, 3, -H, 1.2), b = bird('#ff7e3a', 1.4); S.add(b, -12, 6, -8);
    S.shot([0, 3, 11], [0, .6, 2]);
    frogs.forEach((f, i) => hop(S, f, .3 + i * .3, 3, .3));
    go(S, roo, .6, 3, [-3.2, 0, 2]); go(S, emu, .8, 3, [3.2, 0, 1.6]); go(S, b, 1, 3, [.6, 1.4, -1.6]);
    S.cam(.3, 4, [0, 2.4, 9], [0, .6, 1.6]);
    S.say(5.3, 'Splash, sip, hop! The land came alive.', 'Tõm, uống nước, nhảy tưng! Mặt đất bừng sống dậy.');
    S.tw(5.4, 2, k => { roo.userData.nod = Math.sin(k * PI) * .6; emu.userData.nod = Math.sin(k * PI) * .6; });
    S.cam(5.3, 2.6, [4, 1.6, 7], [0, .6, 1]);
    S.at(8, () => { });
  },
  // 6. When you see a rainbow after rain, think of the Rainbow Serpent who looks after the water. We must look after it too.
  S => {
    land(S, { hills: 1, water: true });
    const bow = new THREE.Group(); RAINBOW.forEach((c, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(30 - i * 1.2, .6, 6, 40, PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .7 })); m.material.userData.film = true; bow.add(m); });
    bow.scale.setScalar(.01); S.add(bow, 0, -2, -50);
    S.shot([0, 2, 14], [0, 8, -30]);
    S.scale(bow, .4, 3, .01, 1, k => k);
    S.cam(.3, 6, [0, 3, 10], [0, 12, -40]);
    S.say(8, 'Use water gently, and share it with everyone.', 'Hãy dùng nước nhẹ nhàng, và chia sẻ cho mọi người.');
    S.cam(8, 3, [0, 1.6, 8], [0, 6, -40]);
    S.at(11, () => { });
  }
] };
