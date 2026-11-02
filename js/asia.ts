// China Town and India Village, in the north of the valley, so children can meet friends from two more
// big neighbours of Vietnam and Australia. Each has its houses, a famous building to learn about,
// friends who host games and teach first words in Chinese or Hindi.
import { THREE, toon, toonVC, P, merge, outline } from './gfx.js';
import { T, nm, onLang, registerName } from './i18n.js';
import { settings } from './state.js';
import { sayIn } from './voice.js';
import { heightAt, CHINA, INDIA } from './world.js';
import { buildAvatar } from './avatar.js';
import { houseVillage, rbox } from './houses.js';
import { LEARN } from './words2.js';

const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), C = (r1, r2, h, s = 12) => new THREE.CylinderGeometry(r1, r2, h, s);
const L = (style, color, hair, hairStyle, hat = 'none', skin = '#f6c7a5') => ({ style, color, hat, back: 'none', hair, hairStyle, skin, glider: 0 });

export function createAsia(G) {
  const { scene, world } = G;
  const mesh = (parts, x, z, rot = 0, ol = true) => { const m = new THREE.Mesh(merge(parts), toonVC()); m.position.set(x, heightAt(x, z), z); m.rotation.y = rot; m.castShadow = m.receiveShadow = true; scene.add(m); if (ol) outline(m, .03, '#4a3a3f'); return m; };
  const tag = (text, x, y, z) => {
    registerName(text);
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const draw = () => { g.clearRect(0, 0, 256, 64); g.fillStyle = 'rgba(40,40,40,.55)'; g.beginPath(); g.roundRect(8, 10, 240, 46, 23); g.fill(); g.font = 'bold 28px Fredoka, "Baloo 2", sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(nm(text), 128, 34, 228); t.needsUpdate = true; };
    draw(); onLang(draw);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(3, .75, 1); s.position.set(x, y, z); scene.add(s);
  };
  const person = (look, x, z, face) => { const A = buildAvatar(look, null); A.root.position.set(x, heightAt(x, z), z); A.root.rotation.y = face; scene.add(A.root); world.colliders.push({ x, z, r: .6 }); return A; };
  const I = (id, x, z, r, icon, label, act) => G.interactables.push({ id, x, z, r, icon, label, act });
  // a greeting in the village's own language, said after the line (so children hear the real word)
  const greet = (lang, n) => setTimeout(() => sayIn(lang, LEARN[lang].words[n][3]), 300);

  // ================= China Town =================
  {
    const cx = CHINA.x, cz = CHINA.z;
    // houses with dark green tiled roofs, round the square
    [[-14, -6, Math.PI / 2], [14, -6, -Math.PI / 2], [-12, 10, Math.PI / 2 + .2], [13, 10, -Math.PI / 2 - .2]].forEach(([dx, dz, r], i) => {
      const h = houseVillage({ w: 7.5, d: 5, wall: i % 2 ? '#f6e7c8' : '#e9d3b0', tile: '#3f6f5f', palms: false }).obj;
      h.position.set(cx + dx, heightAt(cx + dx, cz + dz), cz + dz); h.rotation.y = r; scene.add(h); world.colliders.push({ x: cx + dx, z: cz + dz, r: 4.6 }); world.houses.push({ x: cx + dx, z: cz + dz, rot: r, d: 9.2, kind: 'china' });
    });
    // the pagoda: five roofs, red columns and a golden top
    {
      const p = [], x = cx + 1, z = cz - 15;
      p.push(P(rbox(7, .8, 7, .2), '#d9cdb8', [0, .4, 0]));
      for (let i = 0; i < 5; i++) {
        const w = 5 - i * .75, y = .8 + i * 2.3;
        p.push(P(rbox(w, 1.9, w, .1), i % 2 ? '#c62828' : '#d84a3a', [0, y + .95, 0]));
        p.push(P(new THREE.ConeGeometry((w + 2) * .72, .9, 4), '#3f6f5f', [0, y + 2.15, 0], [0, Math.PI / 4, 0]));
        [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => p.push(P(new THREE.ConeGeometry(.12, .6, 6), '#3f6f5f', [a * (w + 1.6) * .5, y + 1.95, b * (w + 1.6) * .5], [b * .7, 0, -a * .7])));
      }
      p.push(P(C(.06, .06, 2.2), '#ffd23f', [0, 13.6, 0]), P(new THREE.SphereGeometry(.35, 12, 10), '#ffd23f', [0, 12.9, 0]));
      mesh(p, x, z); world.colliders.push({ x, z, r: 3.8 });
      I('cn_pagoda', x, z + 5, 3.5, '🛕', () => T('The pagoda', 'Ngôi chùa tháp'), () => G.dialog && G.dialog(T('China Town', 'Làng Trung Hoa'), [['Pagodas are tall towers with many roofs. Each roof curls up at the corners!', 'Chùa tháp là tòa tháp cao có nhiều tầng mái. Góc mái nào cũng cong vút lên!']]));
    }
    // a little Great Wall along the hill behind the village, with a watchtower
    {
      const p = [], z0 = cz - 25;
      for (let k = -9; k <= 9; k++) {
        const x = k * 2.2, y = heightAt(cx + x, z0) - heightAt(cx, z0);
        p.push(P(B(2.25, 3, 3), '#b9ad98', [x, y + 1.5, 0]));
        [-1.25, 1.25].forEach(s => p.push(P(B(.9, .8, .4), '#a89c88', [x - .5, y + 3.4, s]), P(B(.5, .8, .4), '#a89c88', [x + .65, y + 3.4, s])));
      }
      p.push(P(B(4.4, 6, 4.4), '#b0a48e', [0, 3, 0]), P(new THREE.ConeGeometry(3.6, 1.6, 4), '#3f6f5f', [0, 6.8, 0], [0, Math.PI / 4, 0]));
      mesh(p, cx, z0); world.boxes.push({ x0: cx - 21, x1: cx + 21, z0: z0 - 1.6, z1: z0 + 1.6 });
      I('cn_wall', cx, z0 + 4, 4, '🧱', () => T('The Great Wall', 'Vạn Lý Trường Thành'), () => G.dialog && G.dialog(T('China Town', 'Làng Trung Hoa'), [['The real Great Wall of China is thousands of kilometres long. People built it a very, very long time ago to keep their towns safe.', 'Vạn Lý Trường Thành thật dài hàng nghìn ki-lô-mét. Người ta xây nó từ rất, rất lâu rồi để bảo vệ các thành phố.']]));
    }
    // lanterns strung across the square, and a panda statue
    {
      const p = [];
      for (let k = 0; k < 2; k++) for (let i = 0; i < 9; i++) { const x = -10 + i * 2.5, z = -2 + k * 7, sag = Math.sin(i / 8 * Math.PI) * .9; p.push(P(new THREE.SphereGeometry(.38, 12, 10), i % 3 === 1 ? '#ffd23f' : '#e8433a', [x, 5.2 - sag, z], [0, 0, 0], [1, 1.2, 1]), P(C(.2, .2, .12), '#ffd23f', [x, 5.7 - sag, z])); }
      [[-11, -2], [11, -2], [-11, 5], [11, 5]].forEach(([x, z]) => p.push(P(C(.12, .14, 5.8), '#8a2a1e', [x, 2.9, z])));
      mesh(p, cx, cz, 0, false);
      const q = [];
      q.push(P(new THREE.SphereGeometry(.9, 16, 12), '#ffffff', [0, .9, 0]), P(new THREE.SphereGeometry(.65, 16, 12), '#ffffff', [0, 2.1, 0]));
      [-1, 1].forEach(s => { q.push(P(new THREE.SphereGeometry(.22, 10, 8), '#2b2238', [s * .45, 2.65, 0]), P(new THREE.SphereGeometry(.17, 10, 8), '#2b2238', [s * .25, 2.15, .52], [0, 0, 0], [1, 1.3, .6]), P(new THREE.SphereGeometry(.3, 10, 8), '#2b2238', [s * .75, 1.2, .2])); });
      q.push(P(B(2.2, .4, 2.2), '#d9cdb8', [0, .2, 0]));
      mesh(q, cx - 5, cz + 4); world.colliders.push({ x: cx - 5, z: cz + 4, r: 1.3 });
    }
    // friends who host games
    const host = (game, name, look, dx, dz, face, line, lang) => {
      const x = cx + dx, z = cz + dz; const pA = person(look, x, z, face); tag(name, x, heightAt(x, z) + 2.5, z); if (G.hostChat && pA) G.hostChat(pA, game);
      I('g_' + game, x + Math.sin(face) * 2, z + Math.cos(face) * 2, 3, G.GAMES_ICON ? G.GAMES_ICON(game) : '🎮', () => nm(name), h => { G.kidTalk(h, game, name, line); if (lang) greet(lang, 0); });
    };
    host('firstwords', 'Cô Mei', L('aodai', '#c62828', '#1d1412', 'buns', 'none', '#f3d2b0'), 4, 2, 0, ['Nǐ hǎo! I teach first words. In Chinese, hello is "nǐ hǎo". Want to learn more words, in Chinese and Hindi?', 'Nǐ hǎo! Cô dạy những từ đầu tiên. Tiếng Trung "xin chào" là "nǐ hǎo". Con muốn học thêm từ tiếng Trung và tiếng Hindi không?'], 'zh');
    host('tangram', 'Jun', L('shirt', '#2d84d4', '#1d1412', 'short', 'none', '#f3d2b0'), -4, 3, .4, ['Nǐ hǎo! Let’s play tangram, the shape puzzle from China!', 'Nǐ hǎo! Chơi xếp hình Tangram của Trung Quốc với tớ nhé!'], 'zh');
    host('dragon', 'Bà Lin', L('tunic', '#c62828', '#d8d8d8', 'buns', 'none', '#f3d2b0'), 0, 8, Math.PI, ['Hello, little one! At Lunar New Year we dance the dragon dance. Will you join the dragon?', 'Chào cháu! Tết Nguyên Đán ở đây mọi người múa rồng. Cháu múa rồng với bà không?'], 'zh');
  }

  // ================= India Village =================
  {
    const cx = INDIA.x, cz = INDIA.z;
    // colourful flat-roofed houses with arched doors and marigold garlands
    const india = (wall, trim) => {
      const p = [], w = 6, d = 5, h = 3.6;
      p.push(P(rbox(w, h, d, .1), wall, [0, h / 2, 0]), P(rbox(w + .3, .35, d + .3, .08), trim, [0, h + .15, 0]));
      for (let i = -2; i <= 2; i++) p.push(P(B(.5, .5, .3), trim, [i * 1.25, h + .55, d / 2]));
      p.push(P(rbox(1.3, 2, .12, .04), '#7a4a2a', [0, 1, d / 2 + .02]), P(C(.65, .65, .12, 16), '#7a4a2a', [0, 2, d / 2 + .02], [Math.PI / 2, 0, 0], [1, 1, 1]));
      [-1.9, 1.9].forEach(x => { p.push(P(rbox(.9, 1, .12, .04), '#86bfd0', [x, 2, d / 2 + .03]), P(C(.45, .45, .12, 16, 1), trim, [x, 2.5, d / 2 + .02], [Math.PI / 2, 0, 0])); });
      for (let i = 0; i < 13; i++) { const x = -2.6 + i * .43, sag = Math.sin(i / 12 * Math.PI) * .35; p.push(P(new THREE.SphereGeometry(.13, 8, 6), i % 2 ? '#ff9f1a' : '#ffd23f', [x, 3.1 - sag, d / 2 + .15])); }
      p.push(P(C(.3, .25, .5), '#c97a4a', [2.4, .25, d / 2 + .6]), P(new THREE.IcosahedronGeometry(.4, 0), '#4f9a4a', [2.4, .8, d / 2 + .6]));
      return p;
    };
    [['#ff9fb8', '#ffffff', -13, -4, Math.PI / 2], ['#ffc46b', '#ffffff', 13, -4, -Math.PI / 2], ['#7fd6d0', '#ffffff', -12, 11, Math.PI / 2 + .25], ['#c6a8f0', '#ffffff', 12, 11, -Math.PI / 2 - .25]].forEach(([w, t, dx, dz, r]) => { mesh(india(w, t), cx + dx, cz + dz, r); world.colliders.push({ x: cx + dx, z: cz + dz, r: 3.9 }); world.houses.push({ x: cx + dx, z: cz + dz, rot: r, d: 7.8, kind: 'india' }); });
    // a little Taj Mahal with its reflecting pool
    {
      const p = [], x = cx, z = cz - 17;
      p.push(P(rbox(14, .8, 14, .2), '#f4efe6', [0, .4, 0]));
      p.push(P(rbox(7, 5, 7, .3), '#ffffff', [0, 3.3, 0]));
      [[0, 3.5], [0, -3.5], [3.5, 0], [-3.5, 0]].forEach(([a, b]) => p.push(P(rbox(a ? .2 : 2.4, 3.4, a ? 2.4 : .2, .08), '#e6dccb', [a, 3, b])));
      p.push(P(C(2.4, 2.6, 1, 24), '#ffffff', [0, 6.3, 0]), P(new THREE.SphereGeometry(3, 28, 20, 0, Math.PI * 2, 0, Math.PI * .62), '#ffffff', [0, 6.5, 0], [0, 0, 0], [1, 1.25, 1]));
      p.push(P(C(.06, .1, 1.6), '#ffd23f', [0, 11, 0]), P(new THREE.SphereGeometry(.22, 10, 8), '#ffd23f', [0, 10.4, 0]));
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => { p.push(P(new THREE.SphereGeometry(1, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), '#ffffff', [a * 2.6, 5.8, b * 2.6])); p.push(P(C(.38, .45, 7.5, 12), '#ffffff', [a * 6.3, 4.5, b * 6.3]), P(new THREE.SphereGeometry(.55, 12, 10), '#ffffff', [a * 6.3, 8.5, b * 6.3])); });
      p.push(P(B(2.4, .1, 9), '#6ab8e8', [0, .82, 11.5]), P(B(3, .3, 9.6), '#e6dccb', [0, .7, 11.5]));
      mesh(p, x, z); world.colliders.push({ x, z, r: 7.6 });
      I('in_taj', x, z + 9, 4, '🕌', () => T('The Taj Mahal', 'Đền Taj Mahal'), () => G.dialog && G.dialog(T('India Village', 'Làng Ấn Độ'), [['The real Taj Mahal is in Agra, in India. It is made of white marble that looks pink at sunrise and golden at sunset!', 'Đền Taj Mahal thật ở thành phố Agra, Ấn Độ. Nó làm bằng đá cẩm thạch trắng, lúc bình minh trông màu hồng, lúc hoàng hôn lại vàng óng!']]));
    }
    // a big rangoli painted on the ground of the square
    {
      const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
      const cols = ['#ff4f9a', '#ffd23f', '#3cc7e8', '#2fb04f', '#8a5cf6', '#ff9f43'];
      for (let ring = 6; ring >= 1; ring--) { g.fillStyle = cols[ring % cols.length]; g.beginPath(); for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2, r = ring * 38 * (1 + .12 * Math.cos(a * 8)); g.lineTo(256 + Math.cos(a) * r, 256 + Math.sin(a) * r); } g.fill(); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(256 + Math.cos(a) * 120, 256 + Math.sin(a) * 120, 26, 12, a, 0, 7); g.fill(); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.CircleGeometry(4.5, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }));
      m.position.set(cx, heightAt(cx, cz + 2) + .05, cz + 2); scene.add(m);
    }
    // an elephant statue with a painted blanket
    {
      const q = [];
      q.push(P(new THREE.SphereGeometry(1.3, 16, 12), '#9a98a8', [0, 2, 0], [0, 0, 0], [1.3, 1, 1]), P(new THREE.SphereGeometry(.8, 14, 12), '#9a98a8', [1.6, 2.6, 0]));
      [[-.8, -.6], [-.8, .6], [.8, -.6], [.8, .6]].forEach(([a, b]) => q.push(P(C(.32, .34, 1.4), '#8a8898', [a, .7, b])));
      q.push(P(C(.18, .1, 1.6), '#9a98a8', [2.3, 1.8, 0], [0, 0, .5]), P(new THREE.SphereGeometry(.55, 12, 10), '#b6b4c4', [1.5, 2.8, .65], [0, 0, 0], [.3, 1, 1]), P(new THREE.SphereGeometry(.55, 12, 10), '#b6b4c4', [1.5, 2.8, -.65], [0, 0, 0], [.3, 1, 1]));
      q.push(P(rbox(1.8, .15, 2.4, .05), '#c62828', [-.1, 3.1, 0]), P(rbox(1.4, .12, 2.5, .04), '#ffd23f', [-.1, 3.2, 0]), P(B(3.4, .4, 2.2), '#d9cdb8', [0, .2, 0]));
      mesh(q, cx + 6, cz + 6, -.6); world.colliders.push({ x: cx + 6, z: cz + 6, r: 2 });
    }
    const host = (game, name, look, dx, dz, face, line, lang) => {
      const x = cx + dx, z = cz + dz; const pA = person(look, x, z, face); tag(name, x, heightAt(x, z) + 2.5, z); if (G.hostChat && pA) G.hostChat(pA, game);
      I('g_' + game, x + Math.sin(face) * 2, z + Math.cos(face) * 2, 3, G.GAMES_ICON ? G.GAMES_ICON(game) : '🎮', () => nm(name), h => { G.kidTalk(h, game, name, line); if (lang) greet(lang, 0); });
    };
    host('snakes', 'Priya', L('dress', '#ff9f1a', '#1d1412', 'long', 'none', '#c99a76'), -4, 6, .3, ['Namaste! Snakes and ladders comes from India. Shall we play?', 'Namaste! Rắn và thang có từ Ấn Độ đó. Mình chơi nhé?'], 'hi');
    host('rangoli', 'Bà Asha', L('aodai', '#8a5cf6', '#d8d8d8', 'buns', 'none', '#b47a55'), 4, -2, Math.PI, ['Namaste, beta! For Diwali, the festival of lights, we draw rangoli with coloured powder. Help me finish mine?', 'Namaste cháu! Vào lễ Diwali, lễ hội ánh sáng, bà vẽ tranh rangoli bằng bột màu. Cháu giúp bà vẽ nốt nhé?'], 'hi');
    host('firstwords', 'Arjun', L('tunic', '#2fb04f', '#1d1412', 'short', 'none', '#c99a76'), 0, 12, Math.PI, ['Namaste! In Hindi, thank you is "dhanyavaad". Want to learn more words with me?', 'Namaste! Tiếng Hindi "cảm ơn" là "dhanyavaad". Học thêm từ với tớ nhé?'], 'hi');
  }
}
