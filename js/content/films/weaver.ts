// The Cowherd and the Weaver Girl (Ngưu Lang Chức Nữ): Zhinü weaves clouds in the sky, Niulang looks after his old ox,
// they meet and marry, the Queen of Heaven's river of stars, the magpie bridge once a year, and the Ngâu rain. The
// child helps twice: the magpies' bridge (page 5) and the happy rain (page 6).
import { L, Pp, LOOK, THREE, P, mesh, PI, H, go, hop, speak, FAIRY, heaven, village, night, stars, animal, bird, rain } from './kit.js';

const ZHINU = FAIRY('#c8b0ff'), NIU = LOOK({ style: 'shirt', color: '#5a7a4a', hat: 'nonla', hairStyle: 'short', skin: '#c89060' });
const QUEEN = LOOK({ style: 'aodai', color: '#7a3a8a', hat: 'crown', hairStyle: 'buns', skin: '#e8c0a0' });
const loom = () => mesh([P(new THREE.BoxGeometry(1.6, .08, .08), '#8a5a32', [0, 1.2, 0]), ...[-.75, .75].map(x => P(new THREE.BoxGeometry(.08, 1.2, .08), '#8a5a32', [x, .6, 0])), P(new THREE.BoxGeometry(1.4, .8, .02), '#ffd0e8', [0, .75, 0])]);
// the river of stars: a band of little lights across the sky (or across the ground between them)
const milkyWay = (S, w = 4, len = 60, y = 0) => { const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: '#cfe0ff' }); m.userData.film = true; for (let i = 0; i < 260; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(.06 + (i % 3) * .03), m); s.position.set(((i * 37) % 100) / 100 * w - w / 2, y + ((i * 13) % 10) * .02, ((i * 71) % 100) / 100 * len - len / 2); g.add(s); } S.every((dt, time) => g.children.forEach((s, i) => { s.position.y = y + Math.sin(time * 2 + i) * .05; })); return S.add(g); };

export default { pages: [
  // 1. Zhinü, the weaver girl in the sky, wove beautiful clouds.
  S => {
    heaven(S, { gate: false });
    const z = S.person(ZHINU, 0, 1.4, 0), lm = loom(); S.add(lm, 0, 0, 2.6);
    S.shot([0, 2, 7], [0, 1, 2]);
    S.do(z, .3, 'swing', 4); S.mood(z, .3, 'happy'); S.cam(.3, 3, [1.4, 1.6, 5], [0, 1, 2.4]);
    S.say(4.7, 'Pink clouds, gold clouds, soft white clouds.', 'Mây hồng, mây vàng, mây trắng bồng bềnh.');
    L.clouds(S, [[0, 2, 4, .3]]); S.cam(4.6, 2.6, [0, 3, 8], [0, 2, 0]);
    S.at(7.6, () => { });
  },
  // 2. On earth, Niulang the cowherd looked after his old ox.
  S => {
    village(S, { house: [-6, -8] });
    const n = S.person(NIU, -1, 2, .6), ox = animal(S, 'buffalo', 1.4, 1.4, -.6, 1.2);
    S.shot([0, 2.2, 8], [0, 1, 1.4]);
    S.walk(n, .3, [.2, 2.2]); S.do(n, 1.6, 'hug', 1.8); S.mood(n, 1.6, 'happy'); S.tw(1.6, 1.6, k => { ox.userData.nod = Math.sin(k * PI) * .3; });
    S.cam(.3, 3, [-1, 1.4, 5], [.6, 1, 1.6]);
    S.say(4.6, 'Every day they walked together in the green fields.', 'Ngày ngày chàng và trâu cùng đi trên cánh đồng xanh.');
    S.walk(n, 4.6, [6, 3], 2); go(S, ox, 4.8, 2.6, [7, 0, 1.8], k => k); S.cam(4.6, 3, [3, 2.4, 9], [5, 1, 2]);
    S.at(7.8, () => { });
  },
  // 3. They met, became best friends and got married, and were very happy.
  S => {
    village(S, { house: [0, -6] }); L.lantern(S, -2.4, 3, -3.2); L.lantern(S, 2.4, 3, -3.2, '#ffd23f');
    const z = S.person(ZHINU, 4, 2, -H), n = S.person(NIU, -4, 2, H);
    S.shot([0, 2.2, 8], [0, 1.2, 1.6]);
    S.walk(z, .2, [.7, 2]); S.walk(n, .2, [-.7, 2]); S.mood(z, 2, 'happy'); S.mood(n, 2, 'happy');
    S.cam(.3, 3, [0, 1.6, 5], [0, 1.2, 2]);
    S.say(5.1, 'They laughed, worked and sang together.', 'Hai người cùng cười, cùng làm, cùng hát.');
    S.do(z, 5.2, 'dance', 2.6); S.do(n, 5.2, 'dance', 2.6); S.cam(5.1, 2.6, [2.4, 1.8, 5], [0, 1.2, 2]);
    S.at(8, () => { });
  },
  // 4. But the Queen of Heaven made a river of stars between them, the Milky Way.
  S => {
    night(S, { moon: false, ground: '#2a3a5a' });
    const z = S.person(ZHINU, -4, 0, H), n = S.person(NIU, 4, 0, -H), q = S.person(QUEEN, 0, -8, 0, 1.3); q.o.position.y = 3;
    const mw = milkyWay(S, 3, 60); mw.scale.set(.01, 1, 1);
    S.shot([0, 3, 12], [0, 1, 0]);
    S.do(q, .3, 'point', 1.6); S.tw(1, 2.4, k => mw.scale.set(Math.max(.01, k), 1, 1));
    S.mood(z, 2, 'sad'); S.mood(n, 2, 'sad'); S.cam(.3, 3.4, [0, 6, 10], [0, 0, 0]);
    S.say(5.1, 'They waved to each other across the shining river.', 'Hai người vẫy nhau qua dòng sông lấp lánh.');
    S.do(z, 5.2, 'wave', 2.6); S.do(n, 5.2, 'wave', 2.6); S.cam(5.1, 2.6, [0, 1.6, 9], [0, 1, 0]);
    S.at(8.2, () => { });
  },
  // 5. Once a year, all the magpies fly up and make a bridge so they can meet!
  S => {
    night(S, { moon: false, ground: '#2a3a5a' });
    const z = S.person(ZHINU, -4, 0, H), n = S.person(NIU, 4, 0, -H); milkyWay(S, 3, 60);
    const birds = Array.from({ length: 9 }, (_, i) => { const b = bird(i % 2 ? '#2a2a32' : '#e8eef6', 2); return S.add(b, -12 + (i % 3), 6 + i * .3, -10 - i); });
    S.shot([0, 3, 12], [0, 1, 0]);
    S.cam(.3, 3, [0, 5, 12], [0, 2, -4]);
    S.help(5.7, 'Tap to call the magpies!', 'Chạm để gọi chim khách nào!', tt => {
      birds.forEach((b, i) => { S.move(b, tt + i * .1, 1.4, [-2.8 + i * .7, .9 + Math.sin(i / 8 * PI) * .5, 0]); S.at(tt + 1.5 + i * .1, () => { b.userData.flap = .2; }); });
      S.walk(z, tt + 1, [-.5, 0], 3); S.walk(n, tt + 1, [.5, 0], 3); S.mood(z, tt + 1, 'happy'); S.mood(n, tt + 1, 'happy');
      S.cam(tt, 2, [0, 2.4, 8], [0, 1, 0]);
    }, [0, 1, 0], 2.3);
  },
  // 6. In Vietnam we call it the Ngâu rain: the drizzle in the seventh month is their happy tears.
  S => {
    village(S, { house: [0, -6] }); S.sky('#8a9ab0', '#d0d8e0');
    const kids = [VILLAGER_KID('#ff7eb8'), VILLAGER_KID('#3b6fe0')].map((l, i) => S.person(l, -1 + i * 2, 3, PI * 0));
    S.shot([0, 2, 9], [0, 1.6, 1]);
    S.cam(.3, 3, [0, 1.6, 7], [0, 2, 0]);
    S.help(5.2, 'Tap for the gentle Ngâu rain!', 'Chạm để mưa ngâu rơi nào!', tt => {
      rain(S, tt, 1e9, 0, 2, 16, 80); kids.forEach((k, i) => { S.mood(k, tt, 'happy'); S.do(k, tt + .4, 'stretch', 1.6); });
      S.cam(tt, 2, [0, 1.4, 6], [0, 1.6, 3]);
    }, [0, 2, 0], 2.3);
  }
] };
function VILLAGER_KID(c) { return LOOK({ style: 'dress', color: c, hairStyle: 'buns', skin: '#e0aa80' }); }
