// Sự tích cây vú sữa (The Milk Fruit Tree), told gently: the cross boy runs away, his mother waits at the gate day
// after day, cold and hungry he runs home, the new tree in the garden, its sweet milk, and a big hug. The child helps
// twice: running home (page 3) and hugging the tree (page 5).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, speak, go, hop, village, night, milkFruit, rain } from './kit.js';

const BOY = LOOK({ style: 'shirt', color: '#43a8e8', hairStyle: 'spiky', skin: '#e0aa80' });
const MOM = LOOK({ style: 'aodai', color: '#7aa84a', hairStyle: 'buns', skin: '#e8b890' });
const ball = () => mesh([P(new THREE.SphereGeometry(.15, 12, 10), '#e8332a', [0, .15, 0]), P(new THREE.TorusGeometry(.15, .015, 4, 16), '#ffd23f', [0, .15, 0], [H, 0, 0])]);
const gate = () => mesh([P(new THREE.BoxGeometry(.2, 2, .2), '#8a5a32', [-1, 1, 0]), P(new THREE.BoxGeometry(.2, 2, .2), '#8a5a32', [1, 1, 0]), P(new THREE.BoxGeometry(2.4, .25, .3), '#8a5a32', [0, 2, 0])]);
// the milk fruit tree: wide shiny leaves (green on top, gold under), round purple-green fruit
const milkTree = (s = 1) => { const g = new THREE.Group(); g.add(mesh([P(new THREE.CylinderGeometry(.22, .3, 2, 8), '#7a5236', [0, 1, 0]), ...[0, 1, 2, 3, 4, 5, 6].map(i => P(new THREE.SphereGeometry(1, 10, 8), i % 2 ? '#3f8a3a' : '#c8a83a', [Math.cos(i * .9) * (i ? 1 : 0), 2.8 + (i % 3) * .3, Math.sin(i * .9) * (i ? 1 : 0)]))]));
  const fr = []; for (let i = 0; i < 7; i++) { const f = milkFruit(); f.position.set(Math.cos(i * 2.4) * 1.2, 1.9 + (i % 3) * .2, Math.sin(i * 2.4) * 1.2 + .3); g.add(f); fr.push(f); } g.userData.fruits = fr; g.scale.setScalar(s); return g; };

export default { pages: [
  // 1. A little boy was told off for playing too much. He was cross and ran away from home.
  S => {
    village(S, { house: [0, -6] });
    const boy = S.person(BOY, 1.6, 2.4, 0), mom = S.person(MOM, -1, 1, .6), b = ball(); S.add(b, 2.4, 0, 2.6);
    S.shot([0, 2.4, 8.4], [0, 1, 1.4]);
    S.move(b, .2, .6, [2.6, 0, 3.4], undefined, 1); S.move(b, .8, .6, [2, 0, 2.4], undefined, 1); S.do(boy, .2, 'cheer', 1.2);
    speak(S, mom, 1.6, 2); S.do(mom, 1.6, 'point', 2); S.face(boy, 1.6, [-1, 1]);
    S.mood(boy, 2.8, 'sad'); S.do(boy, 3.2, 'sad', 1.2); S.cam(1.4, 2.4, [0, 1.8, 6], [.2, 1.2, 1.6]);
    S.walk(boy, 4.4, [10, 9], 2.4); S.mood(mom, 4.6, 'o');
    S.say(5.5, 'He ran far away, past the fields and the river.', 'Cậu chạy đi thật xa, qua cánh đồng, qua dòng sông.');
    S.cam(5.4, 3, [4, 3, 13], [8, 1, 7]);
    S.at(8.6, () => { });
  },
  // 2. His mother waited and waited at the gate, looking down the road every day.
  S => {
    village(S, { house: [0, -7] }); S.add(gate(), 0, 0, 5);
    const mom = S.person(MOM, 0, 4.4, 0);
    S.shot([3, 2, 10], [0, 1.2, 4]);
    S.mood(mom, 0, 'sad'); S.do(mom, .4, 'point', 1.4); S.cam(.2, 3, [1, 1.6, 7.4], [0, 1.4, 4.6]);
    S.say(4.2, 'Day after day, she waited for him to come home.', 'Ngày này qua ngày khác, mẹ vẫn đứng chờ con về.');
    { const a = 4.2, day = 1.4; for (let i = 0; i < 2; i++) { S.skyTo(a + i * day, day * .4, '#141a44', '#34406e'); S.lightTo(a + i * day, day * .4, .3, .4); S.skyTo(a + i * day + day * .5, day * .4, '#7cc8f0', '#e8f6ff'); S.lightTo(a + i * day + day * .5, day * .4, 1.05, .85); } }
    S.cam(4.2, 3, [-2, 2.6, 11], [0, 1.4, 4]);
    S.at(7.4, () => { });
  },
  // 3. When the boy was hungry and cold, he remembered his mother and ran home.
  S => {
    night(S, { ground: '#4a6a4a' }); L.bamboo(S, -6, -2); L.banyan(S, 6, -6, .8); rain(S, 0);
    const boy = S.person(BOY, 0, 2, 0); S.mood(boy, 0, 'sad'); S.do(boy, 0, 'hug', 3.4);
    S.shot([0, 1.8, 6], [0, 1, 2]);
    S.cam(.2, 3, [1.4, 1.4, 4.4], [0, 1.1, 2]);
    S.mood(boy, 3.6, 'o'); S.face(boy, 3.8, -H);
    S.help(5.3, 'Tap to help him run home!', 'Chạm để cậu chạy về nhà nào!', tt => {
      S.walk(boy, tt, [-8, 2], 3.6); S.mood(boy, tt, 'smile');
      S.cam(tt, 2, [-3, 2, 7], [-6, 1, 2]);
    }, [0, 1, 2], 2.3);
  },
  // 4. In the garden stood a new tree. A round green fruit fell into his hands.
  S => {
    village(S, { house: [-4, -8] }); S.add(gate(), 0, 0, 5);
    const tree = milkTree(); S.add(tree, 1.4, -1);
    const boy = S.person(BOY, 0, 6.4, PI), fr = tree.userData.fruits[0];
    S.shot([0, 2.6, 11], [1, 1.6, 1]);
    S.walk(boy, .2, [1.6, 1.4], 1.6); S.mood(boy, 3, 'o'); S.face(boy, 3.4, [1.4, -1]);
    S.cam(.2, 3.4, [3, 1.8, 5.4], [1.4, 1.8, 0]);
    S.do(boy, 4, 'give', 3.4); S.drop(fr, 4.2); S.move(fr, 4.21, 1, [1.6, 1.2, 1.9], k => k * k);
    S.say(5.9, 'Its leaves felt soft, like his mother’s hands.', 'Lá cây mềm mại, như bàn tay của mẹ.');
    S.tw(6, 3, k => { tree.rotation.z = Math.sin(k * PI * 3) * .02; }, k => k);
    S.cam(5.8, 3, [-1.6, 1.4, 4.4], [1.4, 1.6, .6]);
    S.at(9, () => { });
  },
  // 5. When he bit it, sweet white milk came out, as sweet as his mother's love. He hugged the tree.
  S => {
    village(S, { house: [-4, -8] });
    const tree = milkTree(); S.add(tree, 1.4, -1);
    const boy = S.person(BOY, 1.6, 1.4, PI), fr = milkFruit(); S.grab(boy, 0, fr, [0, -.5, .15]);
    const milk = Pp.drops(10, .06); milk.children.forEach(d => { d.material = new THREE.MeshBasicMaterial({ color: '#ffffff' }); d.material.userData.film = true; }); S.add(milk, 1.6, 1.4, 1.8);
    S.shot([3, 1.8, 5], [1.4, 1.3, 1]);
    S.do(boy, .3, 'eat', 2.4); S.show(milk, 1.4); S.show(milk, 3.4, false); S.mood(boy, 1.6, 'happy');
    S.cam(.3, 3, [2.6, 1.6, 3.6], [1.5, 1.5, 1.4]);
    S.show(fr, 4, false); S.walk(boy, 4.4, [1.5, .1], .8);
    S.help(7, 'Tap to give the tree a big hug!', 'Chạm để ôm cây thật chặt nào!', tt => {
      S.do(boy, tt, 'hug', 2.2); S.mood(boy, tt, 'happy');
      const sp = Pp.sparkle('#ff9ec8'); S.add(sp, 1.4, 1, -.4); S.show(sp, tt + .2);
      S.cam(tt, 1.8, [3, 2, 4], [1.4, 1.6, -.4]);
    }, [1.4, 1.4, -.6], 2.3);
  },
  // 6. The tree is called the milk fruit tree, vú sữa. Remember: say sorry, and hug the people who love you.
  S => {
    village(S, { house: [-4, -8] });
    const tree = milkTree(1.1); S.add(tree, 1.4, -1.6);
    const boy = S.person(BOY, -1.6, 2, H), mom = S.person(MOM, 2.4, 2, -H);
    S.shot([0, 2.4, 8.6], [.6, 1.6, 0]);
    S.cam(.2, 3.4, [0, 1.6, 6.4], [.4, 1.4, 1]);
    S.walk(boy, 1.4, [-.2, 2]); S.walk(mom, 1.4, [1, 2]); S.mood(boy, 2.6, 'happy'); S.mood(mom, 2.6, 'happy');
    S.say(7.6, 'He said: "Sorry, Mum! I love you."', 'Cậu nói: "Con xin lỗi mẹ! Con thương mẹ lắm."');
    speak(S, boy, 7.6, 1.6); S.do(boy, 9.2, 'hug', 1.4); S.do(mom, 9.2, 'hug', 1.4);
    S.cam(7.4, 3, [-1.6, 1.6, 4.6], [.4, 1.2, 2]);
    S.at(10.6, () => { });
  }
] };
