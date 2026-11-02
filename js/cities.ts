// Cities of Vietnam and Australia, each a paved square with a golden welcome gate, landmarks with
// postcards, a friend who hosts a game, and kiosks selling local food or teaching a local saying:
//  Hà Nội, Bắc Ninh, Đà Nẵng, Hồ Chí Minh City, Sydney, Melbourne and Brisbane.
// Also more food and saying kiosks in every older village, and two Bà Rịa–Vũng Tàu landmarks on
// Two Homes Street: Bạch Dinh (the White Villa) and Nhà Tròn (the Round House water tower).
import { THREE, toonVC, P, merge, outline, sprite } from './gfx.js';
import { T, nm, onLang, registerName } from './i18n.js';
import { heightAt, CITIES, TOWN, BRIDGES } from './world.js';
import { landmarkAt, ROAD_WIDTH, rowSlot } from './content/map.js';
import { roadTexture } from './roads.js';
import { buildAvatar, nameAvatar } from './avatar.js';
import { LANDMARKS, VENDORS, postcard } from './regions.js';
import { PERSONAS } from './chat.js';
import { dialog, reward } from './ui.js';
import { farm, saveFarm } from './state.js';
import { say, sayIn } from './voice.js';
import { SFX, tone } from './audio.js';
import { dist2 } from './util.js';
import { buyFood, greetLine } from './snacks.js';

const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), C = (r1, r2, h, s = 14) => new THREE.CylinderGeometry(r1, r2, h, s), S = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h);
const look = (style, color, hair, hairStyle, hat = 'none', skin = '#e8b48c') => ({ style, color, hat, back: 'none', hair, hairStyle, skin, glider: 0 });

// ---------- landmark models (built around 0,0 facing +z, about 6–9 m across) ----------
const clockFace = () => { // a round white clock face with hands, as a little canvas
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.lineWidth = 6; g.strokeStyle = '#2b2238'; g.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillStyle = '#2b2238'; g.fillRect(64 + Math.cos(a) * 48 - 3, 64 + Math.sin(a) * 48 - 3, 6, 6); }
  g.lineWidth = 7; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 26); g.moveTo(64, 64); g.lineTo(92, 74); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshBasicMaterial({ map: t, transparent: true });
};
export const MODELS = {
  // Hà Nội: Khuê Văn Các, the pavilion at the Temple of Literature
  vanmieu: () => { const p = [P(B(7, .4, 5), '#b9ab8e', [0, .2, 0]), P(B(6, 3, 4), '#c9b48a', [0, 1.9, 0])]; for (const x of [-1.8, 0, 1.8]) p.push(P(B(1.1, 2, 4.1), '#5a3a2a', [x, 1.3, 0])); p.push(P(B(5.2, 2.4, 3.6), '#c0392b', [0, 4.6, 0]), P(new THREE.ConeGeometry(1, 1, 4), '#6a4a2a', [0, 6.6, 0], [0, Math.PI / 4, 0], [5.4, 1.6, 4.4]), P(new THREE.ConeGeometry(1, 1, 4), '#6a4a2a', [0, 3.6, 0], [0, Math.PI / 4, 0], [6.4, 1, 5])); p.push(P(new THREE.TorusGeometry(.7, .14, 6, 18), '#ffd23f', [0, 4.6, 1.82])); return p; },
  // Hà Nội: the water puppet stage (thủy đình) on a pond
  puppetstage: () => { const p = [P(C(4.6, 4.8, .3, 24), '#3d9fc9', [0, .1, 0]), P(B(4.6, 1.6, 2.6), '#c0392b', [0, 1.4, -1.6]), P(new THREE.ConeGeometry(1, 1, 4), '#a0522d', [0, 3.2, -1.6], [0, Math.PI / 4, 0], [4.4, 1.4, 2.8])]; for (const x of [-2, 2]) p.push(P(C(.15, .15, 2.2), '#8a1e1e', [x, 1.3, -.4])); p.push(P(B(4.4, .2, 1.6), '#7a4a2a', [0, .4, -.6])); return p; },
  // Bắc Ninh: the clock tower at the six-way roundabout, with a fountain ring
  bnclock: () => { const p = [P(C(3.6, 3.8, .5, 28), '#b9b2a4', [0, .25, 0]), P(C(3.1, 3.1, .35, 28), '#5fb3dc', [0, .55, 0]), P(C(1.6, 1.8, 1.4, 16), '#8f8a80', [0, 1.2, 0])]; for (const [x, z] of [[-.6, -.6], [.6, -.6], [-.6, .6], [.6, .6]]) p.push(P(B(.4, 7, .4), '#efe6d2', [x, 5.4, z])); p.push(P(B(2.1, 2.1, 2.1), '#efe6d2', [0, 9.8, 0]), P(B(2.4, .3, 2.4), '#c9a24a', [0, 10.95, 0]), P(new THREE.ConeGeometry(1.2, 1.8, 4), '#c9a24a', [0, 12, 0], [0, Math.PI / 4, 0]), P(C(.08, .08, 1), '#c9a24a', [0, 13.3, 0])); return p; },
  // Bắc Ninh: Chùa Dâu's Hòa Phong tower, old red brick
  chuadau: () => { const p = [P(B(7, .4, 5), '#b9ab8e', [0, .2, -1]), P(B(6, 2.4, 3), '#c9a07a', [0, 1.6, -2.5]), P(new THREE.ConeGeometry(1, 1, 4), '#7a3a2a', [0, 3.6, -2.5], [0, Math.PI / 4, 0], [6, 1.4, 3.6])]; for (let k = 0; k < 3; k++) { const w = 2.6 - k * .45; p.push(P(B(w, 1.7, w), '#b45a3a', [0, 1.2 + k * 2, 1.4]), P(new THREE.ConeGeometry(1, 1, 4), '#7a3a2a', [0, 2.2 + k * 2, 1.4], [0, Math.PI / 4, 0], [w * 1.05, .5, w * 1.05])); } return p; },
  // Bắc Ninh: Bút Tháp's Báo Nghiêm tower, grey stone, like a writing brush
  butthap: () => { const p = [P(B(5.4, .4, 5.4), '#a8a296', [0, .2, 0])]; for (let k = 0; k < 5; k++) { const r = 1.5 - k * .2; p.push(P(C(r, r + .1, 1.4, 8), '#9a958a', [0, 1.1 + k * 1.6, 0]), P(C(r + .4, r + .4, .2, 8), '#7f7a70', [0, 1.9 + k * 1.6, 0])); } p.push(P(new THREE.ConeGeometry(.5, 1.6, 8), '#7f7a70', [0, 9.4, 0])); return p; },
  // Bắc Ninh: the three-door gate (tam quan) of Đền Đô, the temple of the eight Lý kings
  dendo: () => { const p = []; [[-2.8, 1.6, 3.4], [0, 2.4, 4.4], [2.8, 1.6, 3.4]].forEach(([x, w, h]) => { p.push(P(B(w, h, 1.2), '#e8dcc0', [x, h / 2, 0]), P(B(w * .55, h * .65, 1.3), '#7a3a2a', [x, h * .33, 0]), P(new THREE.ConeGeometry(1, 1, 4), '#8a4a2a', [x, h + .5, 0], [0, Math.PI / 4, 0], [w * .9, 1, 1.8])); }); p.push(P(B(1.2, .4, .2), '#ffd23f', [0, 3.4, .65])); return p; },
  // Bắc Ninh: Quan họ singers' dragon boat on a little pond
  quanho: () => { const p = [P(C(4.4, 4.6, .3, 24), '#3d9fc9', [0, .1, 0]), P(B(4.6, .6, 1.6), '#8a5a3b', [0, .5, 0]), P(B(4.8, .2, 1.8), '#c0392b', [0, .85, 0]), P(S(.5), '#ffd23f', [2.6, 1.2, 0]), P(new THREE.ConeGeometry(.3, 1, 6), '#ffd23f', [-2.6, 1.3, 0], [0, 0, .8])]; return p; },
  // Đà Nẵng: Cầu Vàng, the Golden Bridge held up by two giant stone hands
  goldenbridge: () => { const p = []; for (let i = 0; i <= 16; i++) { const a = -1.1 + i / 16 * 2.2, x = Math.sin(a) * 4.5, z = (Math.cos(a) - .45) * 4.5; p.push(P(B(1.1, .3, 1.6), '#f2c230', [x, 3.4, z], [0, a, 0]), P(B(1.1, .5, .1), '#e8a51e', [x, 3.8, z + .8], [0, a, 0])); } for (const s of [-1, 1]) { p.push(P(B(1.6, 3.2, 1.2), '#8f8a80', [s * 2, 1.6, -.6], [0, 0, s * .15])); for (let f = 0; f < 4; f++) p.push(P(C(.22, .26, 1.6, 6), '#8f8a80', [s * (1.4 + f * .4), 3.2, .2 + f * .1], [Math.PI / 2.4, 0, 0])); } return p; },
  // Hồ Chí Minh City: Notre-Dame Cathedral, red brick with two spires
  cathedral: () => { const p = [P(B(6, 4, 7), '#c0553a', [0, 2, -1]), P(new THREE.ConeGeometry(1, 1, 4), '#8a8f94', [0, 5, -1], [0, Math.PI / 4, 0], [4.4, 2, 5.2])]; for (const s of [-1, 1]) p.push(P(B(1.8, 7, 1.8), '#c0553a', [s * 2.1, 3.5, 2.6]), P(new THREE.ConeGeometry(1.1, 3, 8), '#5a6a74', [s * 2.1, 8.5, 2.6]), P(B(.06, .9, .06), '#ffd23f', [s * 2.1, 10.4, 2.6])); p.push(P(C(.8, .8, .1, 16), '#f4ead2', [0, 4.6, 2.55], [Math.PI / 2, 0, 0]), P(B(1.4, 2.2, .2), '#6a3a2a', [0, 1.1, 2.55])); return p; },
  // Hồ Chí Minh City: the Central Post Office, yellow with a round-topped roof and a clock
  postoffice: () => { const p = [P(B(8, 4.4, 4), '#f2cf6a', [0, 2.2, 0]), P(B(8.4, .4, 4.4), '#efe6d2', [0, 4.6, 0]), P(new THREE.CylinderGeometry(2, 2, 7.8, 16, 1, false, 0, Math.PI), '#7a8a8a', [0, 4.8, 0], [0, 0, Math.PI / 2])]; for (let i = 0; i < 5; i++) p.push(P(B(.9, 2.2, .2), '#6a4a2a', [-3.2 + i * 1.6, 1.4, 2.05])); p.push(P(C(.7, .7, .1, 16), '#fffaf0', [0, 6.2, .05], [Math.PI / 2, 0, 0])); return p; },
  // Sydney: Sydney Tower Eye, a tall thin tower with a golden turret
  sydneytower: () => { const p = [P(C(2.2, 2.6, 1, 16), '#c9c4b8', [0, .5, 0]), P(C(.35, .35, 15, 10), '#d9d9d9', [0, 8, 0])]; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; p.push(P(C(.05, .05, 15, 4), '#9aa', [Math.cos(a) * .7, 8, Math.sin(a) * .7])); } p.push(P(C(1.6, 1.3, 2.4, 20), '#f2c230', [0, 16, 0]), P(C(1.7, 1.7, .3, 20), '#d9d9d9', [0, 17.3, 0]), P(C(.1, .1, 3, 6), '#d9d9d9', [0, 19, 0])); return p; },
  // Sydney: Luna Park's big smiling face entrance
  lunapark: () => { const p = [P(S(3.4, 20, 14), '#ffd6a5', [0, 3.4, 0], [0, 0, 0], [1, 1, .5]), P(S(.5), '#2b2238', [-1.2, 4.4, 1.6]), P(S(.5), '#2b2238', [1.2, 4.4, 1.6]), P(new THREE.TorusGeometry(1.6, .3, 8, 20, Math.PI), '#c62828', [0, 2.6, 1.5], [0, 0, Math.PI]), P(B(2, 2.4, 1), '#2b2238', [0, 1.2, 1.4])]; for (const s of [-1, 1]) p.push(P(C(.4, .5, 6, 10), '#ff7eb8', [s * 4, 3, 0]), P(S(.6), '#ffd23f', [s * 4, 6.3, 0])); return p; },
  // Melbourne: Flinders Street Station, yellow with a green dome and a row of clocks
  flinders: () => { const p = [P(B(9, 4, 4), '#f0c060', [0, 2, 0]), P(B(9.4, .4, 4.4), '#e8e4d8', [0, 4.2, 0]), P(C(1.8, 1.8, 1.6, 20), '#f0c060', [0, 5, .3]), P(new THREE.SphereGeometry(1.9, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), '#4f9a6a', [0, 5.8, .3]), P(B(3, 2.4, .3), '#6a4a2a', [0, 1.2, 2.05])]; for (const s of [-1, 1]) p.push(P(B(1.2, 6, 1.2), '#f0c060', [s * 4.2, 3, 1.4]), P(new THREE.ConeGeometry(.9, 1.4, 4), '#4f9a6a', [s * 4.2, 6.7, 1.4], [0, Math.PI / 4, 0])); return p; },
  // Melbourne: a green and cream W-class tram on its tracks
  wtram: () => { const p = [P(B(1.4, .1, 9), '#6f747a', [0, .05, 0]), P(B(2.2, 1.4, 7), '#2f7a4a', [0, 1.2, 0]), P(B(2.2, 1.1, 7), '#f4ead2', [0, 2.45, 0]), P(B(2.3, .25, 7.2), '#8a3a2a', [0, 3.1, 0]), P(B(.05, 1.4, .05), '#333', [0, 3.9, 0])]; for (let i = 0; i < 5; i++) for (const s of [-1, 1]) p.push(P(B(.05, .7, 1), '#9fd3e8', [s * 1.12, 2.45, -2.6 + i * 1.3])); for (const z of [-2.6, 2.6]) for (const s of [-1, 1]) p.push(P(C(.35, .35, .2, 10), '#2b2b2b', [s * .9, .4, z], [0, 0, Math.PI / 2])); return p; },
  // Brisbane: the Wheel of Brisbane (the wheel itself turns; see below)
  wheelbase: () => [P(B(5, .5, 3), '#c9c4b8', [0, .25, 0]), P(B(.4, 8.4, .4), '#e8e8e8', [-1.2, 4.2, 0], [0, 0, -.15]), P(B(.4, 8.4, .4), '#e8e8e8', [1.2, 4.2, 0], [0, 0, .15]), P(B(2.4, 1, 1.6), '#3a78c8', [0, .9, 1.6])],
  // Brisbane: Lone Pine Koala Sanctuary, gum trees with koalas
  lonepine: () => { const p = [P(C(4, 4.2, .2, 24), '#9ac06a', [0, .1, 0])]; [[-2, -1, 5.5], [1.8, .8, 6.5], [0, -2.6, 5]].forEach(([x, z, h]) => p.push(P(C(.25, .35, h, 8), '#e8e4dc', [x, h / 2, z]), P(S(1.6, 10, 8), '#6f9a7a', [x, h + .6, z], [0, 0, 0], [1, .8, 1]), P(S(.42, 10, 8), '#9a9a9e', [x + .35, h * .62, z + .2]), P(S(.28, 10, 8), '#9a9a9e', [x + .35, h * .62 + .5, z + .25]))); p.push(P(B(5, 1.2, .2), '#8a5a3b', [0, .6, 3.6])); return p; },
  // Vũng Tàu: Bạch Dinh, the White Villa (1898) with a red-tiled roof
  bachdinh: () => { const p = [P(B(9, .5, 6), '#d9cdb8', [0, .25, 0]), P(B(8, 3, 5), '#fbfaf4', [0, 2, 0]), P(B(8.2, .3, 5.2), '#e8e4d8', [0, 3.6, 0]), P(B(8, 2.8, 5), '#fbfaf4', [0, 5.1, 0]), P(new THREE.ConeGeometry(1, 1, 4), '#c0503a', [0, 7.4, 0], [0, Math.PI / 4, 0], [6.6, 1.8, 4.4])]; for (let k = 0; k < 2; k++) for (let i = 0; i < 4; i++) { p.push(P(B(.9, 1.6, .1), '#5a8ab0', [-2.7 + i * 1.8, 2 + k * 3.1, 2.52]), P(new THREE.CylinderGeometry(.45, .45, .1, 12, 1, false, 0, Math.PI), '#5a8ab0', [-2.7 + i * 1.8, 2.8 + k * 3.1, 2.52], [Math.PI / 2, 0, Math.PI / 2])); } p.push(P(B(8.2, .25, .6), '#3cc7e8', [0, 3.75, 2.6])); return p; },
  // Bà Rịa: Nhà Tròn, the round water tower (built in the early 1900s) on eight concrete legs
  nhatron: () => { const p = [P(C(3.4, 3.6, .4, 8), '#b9b2a4', [0, .2, 0])]; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; p.push(P(B(.45, 6, .45), '#e8e0cc', [Math.cos(a) * 2.6, 3.4, Math.sin(a) * 2.6])); } for (const y of [2.4, 4.8]) p.push(P(new THREE.TorusGeometry(2.6, .14, 6, 8), '#d9d0bc', [0, y, 0], [Math.PI / 2, 0, Math.PI / 8])); p.push(P(C(3.6, 3.4, 3.2, 24), '#f2ead6', [0, 8, 0]), P(C(3.8, 3.8, .3, 24), '#d9d0bc', [0, 9.7, 0]), P(new THREE.SphereGeometry(3.7, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), '#8a9aa4', [0, 9.8, 0], [0, 0, 0], [1, .45, 1]), P(C(.06, .06, 2.4, 6), '#6a6a6a', [0, 12.6, 0]), P(B(1, .6, .05), '#e8433a', [.55, 13.4, 0]), P(B(.9, 1.6, .1), '#6a4a2a', [0, 7.6, 3.55])); return p; }
};

// ---------- the cities ----------
// sites: [id, icon, u, v, model, name en/vi, fact en/vi]. u = across, v = towards the main gate (the gates are in world.js).
// Every city has the same tidy plan: a main street from the gate straight through the square, the landmarks
// set back on both sides facing the street, the kiosks on the street edges near the gate, the host by the street.
// Bắc Ninh (custom) keeps its own plan around the clock-tower roundabout.
const CITY_DATA = {
  hanoi: { host: ['puppets', 'Chú Tễu', look('tunic', '#e8433a', '#1d1412', 'short'), ['Hello! I am Chú Tễu, the cheekiest water puppet in Hà Nội. Want to make my friends dance?', 'Chào cháu! Chú là chú Tễu, con rối nghịch nhất Hà Nội đây. Cháu muốn làm các bạn rối múa không?'], 'the cheeky, laughing water puppet character Chú Tễu from Hà Nội’s water puppet theatre, who speaks with a northern accent'],
    sites: [['vanmieu', '📚', -6.5, -5, 'vanmieu', ['Temple of Literature', 'Văn Miếu – Quốc Tử Giám'], ['The Temple of Literature in Hà Nội was Vietnam’s first university, almost a thousand years old. Students still visit to wish for good marks!', 'Văn Miếu – Quốc Tử Giám ở Hà Nội là trường đại học đầu tiên của Việt Nam, gần một nghìn năm tuổi. Học sinh vẫn đến đây cầu mong học giỏi!']],
      ['puppettheatre', '🎎', 6.5, -5, 'puppetstage', ['Water Puppet Theatre', 'Nhà hát Múa rối nước'], ['In water puppet shows the stage is a pond! Puppeteers hide behind a curtain, standing in water, and make dragons, ducks and farmers dance.', 'Trong múa rối nước, sân khấu là một cái ao! Nghệ nhân đứng dưới nước sau tấm mành, điều khiển rồng, vịt và chú nông dân nhảy múa.']]] },
  bacninh: { custom: true, hostAt: [4.2, 3.5], host: ['dongho', 'Bà Đào', look('aodai', '#7a4a2a', '#d8d8d8', 'buns'), ['Welcome to Bắc Ninh! I print Đông Hồ paintings with wooden blocks. The colours come from flowers, leaves and sea shells. Shall we paint?', 'Chào cháu đến Bắc Ninh! Bà in tranh Đông Hồ bằng khuôn gỗ. Màu làm từ hoa, lá và vỏ sò điệp đấy. Mình cùng in tranh nhé?'], 'a grandmother who makes Đông Hồ folk paintings in Bắc Ninh, gentle and proud of the Kinh Bắc region'],
    sites: [['bnclock', '🕰️', 0, 0, 'bnclock', ['Bắc Ninh Clock Tower', 'Cột Đồng Hồ Bắc Ninh'], ['The clock tower stands in the middle of a roundabout where six roads meet in Bắc Ninh city. Its four clock faces look north, south, east and west.', 'Cột đồng hồ đứng giữa vòng xuyến nơi sáu con đường gặp nhau ở thành phố Bắc Ninh. Bốn mặt đồng hồ nhìn về bốn hướng.']],
      ['chuadau', '🧱', -10, -7, 'chuadau', ['Dâu Pagoda', 'Chùa Dâu'], ['Chùa Dâu in Bắc Ninh is one of the oldest pagodas in Vietnam. Its red brick tower, Hòa Phong, has stood for hundreds of years.', 'Chùa Dâu ở Bắc Ninh là một trong những ngôi chùa cổ nhất Việt Nam. Tháp gạch đỏ Hòa Phong đã đứng đó hàng trăm năm.']],
      ['butthap', '🖌️', 10, -7, 'butthap', ['Bút Tháp Pagoda', 'Chùa Bút Tháp'], ['Bút Tháp means "brush tower": its stone tower looks like a giant writing brush pointing at the sky!', 'Bút Tháp nghĩa là "tháp hình cây bút": ngọn tháp đá trông như một cây bút lông khổng lồ chỉ lên trời!']],
      ['dendo', '⛩️', 0, -10.5, 'dendo', ['Đô Temple', 'Đền Đô'], ['Đền Đô in Bắc Ninh remembers the eight kings of the Lý family, who moved the capital to Thăng Long, today’s Hà Nội, more than a thousand years ago.', 'Đền Đô ở Bắc Ninh thờ tám vị vua nhà Lý, những người đã dời đô về Thăng Long, Hà Nội ngày nay, hơn một nghìn năm trước.']],
      ['quanho', '🎶', -10, 6.5, 'quanho', ['Quan họ singing', 'Dân ca Quan họ'], ['Quan họ is Bắc Ninh’s folk singing: boys and girls take turns singing sweet songs to each other. UNESCO calls it a treasure of the world.', 'Quan họ là dân ca Bắc Ninh: liền anh liền chị hát đối đáp với nhau những câu hát ngọt ngào. UNESCO công nhận là di sản của nhân loại.']]] },
  danang: { host: ['dragonfire', 'Anh Long', look('shirt', '#f2c230', '#1d1412', 'spiky', 'cap'), ['Chào! I am Long, which means dragon! On weekend nights our Dragon Bridge breathes real fire and water. Let us count the puffs!', 'Chào em! Anh tên Long, nghĩa là rồng đó! Tối cuối tuần Cầu Rồng phun lửa phun nước thiệt. Mình đếm thử nghen!'], 'a cheerful young man from Đà Nẵng in central Vietnam who loves the Dragon Bridge and speaks with a central accent (mô, tê, răng, rứa)'],
    sites: [['goldenbridge', '🤲', -5, -5, 'goldenbridge', ['Golden Bridge', 'Cầu Vàng'], ['High on Bà Nà Hills near Đà Nẵng, the Golden Bridge is held up by two giant stone hands, as if the mountain is giving you a path in the clouds.', 'Trên núi Bà Nà gần Đà Nẵng, Cầu Vàng được nâng bởi hai bàn tay đá khổng lồ, như ngọn núi đang trao cho mình một lối đi giữa mây.']]], extra: [['dragonbridge', '🐉', 0, 0, ['Dragon Bridge', 'Cầu Rồng'], ['Đà Nẵng’s Dragon Bridge crosses the Hàn River. It is shaped like a golden dragon, and on weekend nights it breathes fire and water!', 'Cầu Rồng ở Đà Nẵng bắc qua sông Hàn. Cầu có hình con rồng vàng, và tối cuối tuần rồng phun lửa và phun nước!']]] },
  saigon: { host: ['traffic', 'Cô Lan', look('shirt', '#3a78c8', '#1d1412', 'ponytail', 'cap'), ['Hello! Sài Gòn has millions of scooters. I teach children to be safe on the road. Green means go, red means stop!', 'Chào con! Sài Gòn có cả triệu chiếc xe máy. Cô dạy các bạn nhỏ đi đường an toàn nè. Đèn xanh thì đi, đèn đỏ thì dừng nha!'], 'a friendly road-safety helper from Hồ Chí Minh City who speaks with a southern accent (nè, nha, dzậy)'],
    sites: [['cathedral', '⛪', -6, -5, 'cathedral', ['Notre-Dame Cathedral, Sài Gòn', 'Nhà thờ Đức Bà Sài Gòn'], ['Sài Gòn’s Notre-Dame Cathedral was built with red bricks brought all the way from France, more than 140 years ago. The bricks are still bright red!', 'Nhà thờ Đức Bà Sài Gòn được xây bằng gạch đỏ chở từ Pháp sang, hơn 140 năm trước. Đến giờ gạch vẫn còn đỏ tươi!']],
      ['postoffice', '📮', 6, -5, 'postoffice', ['Sài Gòn Central Post Office', 'Bưu điện Thành phố'], ['The Central Post Office is a yellow building with a big clock and a round roof. People still send postcards from there to the whole world!', 'Bưu điện Thành phố là tòa nhà màu vàng có đồng hồ lớn và mái vòm. Người ta vẫn gửi bưu thiếp từ đó đi khắp thế giới!']]] },
  // (round T3) Bà Rịa–Vũng Tàu: Anh Hai flies kites on Bãi Sau (he used to fly them at the Three Regions Market); the lighthouse
  // and Bạch Dinh stand round the town (js/regions.js, below)
  vungtau: { host: ['kite', 'Anh Hai', look('shirt', '#3cc7e8', '#1d1412', 'spiky', 'nonla', '#e0aa80'), ['The sea wind on Bãi Sau is perfect for flying kites! Shall we fly one together?', 'Gió biển Bãi Sau thả diều là nhất luôn! Mình cùng thả một con nha em?'], 'a young man from Vũng Tàu who flies kites on Bãi Sau beach and speaks with a southern accent (nha, nè)'],
    sites: [] },
  sydney: { host: ['ferries', 'Captain Molly', look('shirt', '#ffffff', '#c98b4a', 'ponytail', 'cap', '#ffe3d1'), ['G’day! I drive the green and yellow ferries round Sydney Harbour. Reckon you can send them to the right wharf?', 'Chào con! Cô lái những chiếc phà xanh vàng quanh Cảng Sydney. Con đưa phà đến đúng bến được không?'], 'a cheerful Sydney ferry captain who uses Aussie slang'],
    sites: [['sydneytower', '🗼', -6, -5, 'sydneytower', ['Sydney Tower Eye', 'Tháp Sydney'], ['Sydney Tower is the tallest building in Sydney. From the golden top you can see the Harbour Bridge, the beaches and even the Blue Mountains!', 'Tháp Sydney là tòa nhà cao nhất Sydney. Từ đỉnh tháp màu vàng, con nhìn thấy Cầu Cảng, các bãi biển và cả dãy Núi Xanh!']],
      ['lunapark', '😃', 6, -5, 'lunapark', ['Luna Park Sydney', 'Công viên Luna Sydney'], ['You enter Luna Park in Sydney through a giant smiling face! It is a fun park by the harbour, almost a hundred years old.', 'Con đi vào Công viên Luna ở Sydney qua một khuôn mặt khổng lồ đang cười! Đây là công viên vui chơi bên cảng, gần một trăm năm tuổi.']]] },
  melbourne: { host: ['tram', 'Conductor Sam', look('tunic', '#2f7a4a', '#3b2618', 'short', 'cap', '#e0aa80'), ['Ding ding! Welcome to Melbourne, the city with the most trams in the world. Help me ring the bell at the right stop!', 'Leng keng! Chào mừng đến Melbourne, thành phố có nhiều tàu điện nhất thế giới. Giúp chú bấm chuông đúng trạm nhé!'], 'a jolly Melbourne tram conductor who loves trams and coffee'],
    sites: [['flinders', '🚉', -6, -5, 'flinders', ['Flinders Street Station', 'Ga Flinders Street'], ['Flinders Street Station in Melbourne is yellow with a green dome and a row of clocks. People say "meet me under the clocks"!', 'Ga Flinders Street ở Melbourne màu vàng, có mái vòm xanh và một hàng đồng hồ. Người ta hay hẹn nhau "gặp dưới mấy cái đồng hồ"!']],
      ['wtram', '🚋', 6.5, -4, 'wtram', ['Melbourne trams', 'Tàu điện Melbourne'], ['Melbourne has the biggest tram network in the world. The old green and cream W-class trams go round the city, and some ride is free!', 'Melbourne có mạng lưới tàu điện lớn nhất thế giới. Những chiếc tàu điện cổ màu xanh kem chạy quanh thành phố, có chỗ còn đi miễn phí!']]] },
  brisbane: { host: ['koala', 'Ranger Tash', look('shirt', '#6f8a3a', '#e8c26a', 'ponytail', 'cap', '#ffe3d1'), ['Hooroo! I look after the koalas. They sleep almost all day and eat gum leaves. Can you help me feed them?', 'Chào con! Cô chăm sóc các bạn koala. Koala ngủ gần cả ngày và ăn lá bạch đàn. Con giúp cô cho koala ăn nhé?'], 'a friendly wildlife ranger at a koala sanctuary in Brisbane, Queensland'],
    sites: [['wheel', '🎡', -6, -5, 'wheelbase', ['Wheel of Brisbane', 'Vòng quay Brisbane'], ['The Wheel of Brisbane turns slowly by the river at South Bank. From the top you can see the whole city and the Story Bridge.', 'Vòng quay Brisbane quay chầm chậm bên sông ở South Bank. Từ trên cao con thấy cả thành phố và cầu Story.']],
      ['lonepine', '🐨', 6, -5, 'lonepine', ['Lone Pine Koala Sanctuary', 'Khu bảo tồn Koala Lone Pine'], ['Lone Pine in Brisbane is the oldest koala sanctuary in the world. More than a hundred koalas live there, snoozing in the gum trees.', 'Lone Pine ở Brisbane là khu bảo tồn koala lâu đời nhất thế giới. Hơn một trăm bạn koala sống ở đó, ngủ gà ngủ gật trên cây bạch đàn.']]] }
};

// ---------- kiosks: local food, and a saying to learn ----------
// [id, place, name, look, food [icon, en, vi, price], saying [words, meaning en, meaning vi, language], greet [en, vi]]
const KIOSKS = [
  ['k_bunca', 'hanoi', 'Bà Lan', look('aodai', '#5a8ab0', '#d8d8d8', 'buns'), ['🍲', 'a bowl of bún chả (grilled pork with noodles)', 'bát bún chả', 6], ['Ăn quả nhớ kẻ trồng cây', 'When you eat the fruit, remember who planted the tree: always say thank you!', 'Khi ăn quả, nhớ người trồng cây: luôn biết ơn nhé!', 'vi'], ['Bún chả, the smell of Hà Nội! Sit down, little one.', 'Bún chả đây, thơm phức mùi Hà Nội! Ngồi xuống đây cháu.']],
  ['k_kemtt', 'hanoi', 'Chú Hùng', look('shirt', '#ffffff', '#1d1412', 'short'), ['🍦', 'a Tràng Tiền ice cream (Hà Nội\'s famous ice cream)', 'que kem Tràng Tiền', 3], ['Chậm mà chắc', 'Slow but sure: taking your time is fine!', 'Chậm mà chắc: từ từ mà làm cho tốt nhé!', 'vi'], ['Kem Tràng Tiền, famous since my grandpa was little!', 'Kem Tràng Tiền đây, nổi tiếng từ hồi ông chú còn bé cơ!']],
  ['k_phuthe', 'bacninh', 'Cô Mận', look('aodai', '#c0392b', '#1d1412', 'long', 'nonla'), ['🟩', 'a bánh phu thê (sweet wedding cake)', 'bánh phu thê', 4], ['Người ơi người ở đừng về', 'Dear friend, please stay, don’t go home yet! A famous Quan họ song.', 'Câu hát Quan họ nổi tiếng: mời bạn ở lại chơi, đừng về vội!', 'vi'], ['Bánh phu thê from Đình Bảng, wrapped in green leaves. Try one!', 'Bánh phu thê Đình Bảng gói lá xanh đây cháu ơi. Ăn thử một chiếc!']],
  ['k_dongho', 'bacninh', 'Ông Đồ', look('tunic', '#3b2618', '#e8e8e8', 'short'), ['🖼️', 'a little Đông Hồ painting (a folk woodblock print)', 'bức tranh Đông Hồ', 5], ['Uống nước nhớ nguồn', 'When you drink water, remember where it came from: remember the people who help you.', 'Khi uống nước, nhớ đến nguồn nước: nhớ ơn người giúp mình.', 'vi'], ['These Đông Hồ paintings bring luck for Tết: fat pigs, roosters and happy children.', 'Tranh Đông Hồ đón Tết đây: lợn béo, gà trống và em bé vui tươi.']],
  ['k_miquang', 'danang', 'Cô Hoa', look('aodai', '#ffd23f', '#1d1412', 'long', 'nonla'), ['🍜', 'a bowl of mì Quảng (turmeric noodles)', 'tô mì Quảng', 6], ['Mô, tê, răng, rứa', 'In central Vietnam: where, there, why, like that!', 'Tiếng miền Trung: đâu, kia, sao, vậy!', 'vi'], ['Mì Quảng here, so yummy! What would you like?', 'Mì Quảng đây, ngon lắm nờ! Em ăn chi?']],
  ['k_banhtrang', 'danang', 'Chú Sơn', look('shirt', '#3cc7e8', '#1d1412', 'short'), ['🌯', 'bánh tráng cuốn (rice paper rolls)', 'bánh tráng cuốn', 5], ['Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao', 'One tree can’t make a hill, but three trees together make a mountain: teamwork!', 'Một cây không làm nên núi, ba cây chụm lại thành núi cao: đoàn kết nhé!', 'vi'], ['Roll your own bánh tráng with herbs. Fun and yummy!', 'Tự cuốn bánh tráng với rau sống nè, vui mà ngon nữa!']],
  ['k_comtam', 'saigon', 'Cô Bảy', look('dress', '#ff7eb8', '#1d1412', 'ponytail'), ['🍚', 'a plate of cơm tấm (broken rice with grilled pork)', 'dĩa cơm tấm', 6], ['Dzui quá trời!', 'Southern Vietnamese for "So much fun!"', 'Tiếng miền Nam: vui quá trời luôn!', 'vi'], ['Cơm tấm with grilled pork: smell how good it is!', 'Cơm tấm sườn nướng nè con, thơm phức!']],
  ['k_banhxeo', 'saigon', 'Chú Ba', look('shirt', '#ffd23f', '#3b2618', 'short', 'cap'), ['🥞', 'a bánh xèo (crispy pancake)', 'cái bánh xèo', 5], ['Lá lành đùm lá rách', 'Whole leaves wrap the torn ones: we help people who need it.', 'Lá lành đùm lá rách: mình giúp đỡ người khó khăn.', 'vi'], ['Xèo xèo! Hear it sizzle? That is how bánh xèo got its name!', 'Xèo xèo! Nghe tiếng không? Vì vậy mới gọi là bánh xèo đó!']],
  ['k_banhkhot', 'vungtau', 'Cô Tư', look('dress', '#3cc7e8', '#1d1412', 'long', 'nonla'), ['🥞', 'a plate of bánh khọt (little crispy prawn pancakes from Vũng Tàu)', 'đĩa bánh khọt', 5], ['Có công mài sắt, có ngày nên kim', 'Keep rubbing an iron bar and one day it becomes a needle: keep trying!', 'Cứ chăm chỉ cố gắng thì việc khó mấy cũng làm được.', 'vi'], ['Hot, crispy bánh khọt! Eat them with fresh herbs.', 'Bánh khọt nóng giòn nè con, ăn với rau sống nha!']],
  ['k_dua', 'vungtau', 'Chú Sáu', look('shirt', '#ffffff', '#3b2618', 'short', 'cap'), ['🥥', 'a fresh coconut to drink', 'trái dừa tươi', 3], ['Đi một ngày đàng, học một sàng khôn', 'Travel one day and you learn a basket of wisdom.', 'Đi nhiều nơi thì học được nhiều điều hay.', 'vi'], ['An ice-cold coconut, it takes the thirst right away!', 'Dừa xiêm mát lạnh nè, uống đã khát luôn!']],
  ['k_anzac', 'sydney', 'Mia', look('dress', '#ffd23f', '#e8c26a', 'long', 'none', '#ffe3d1'), ['🍪', 'an Anzac biscuit', 'bánh quy Anzac', 3], ['No worries!', 'Aussie for "It’s okay, don’t worry!"', 'Tiếng Úc: "Không sao đâu, đừng lo!"', 'en'], ['Anzac biscuits, golden and chewy. Want one, mate?', 'Bánh quy Anzac vàng giòn đây. Ăn một cái nha!']],
  ['k_fairybread', 'sydney', 'Jack', look('shirt', '#3cc7e8', '#6b4226', 'spiky', 'cap', '#ffe3d1'), ['🍞', 'fairy bread with sprinkles', 'bánh mì rắc cốm màu', 2], ['She’ll be right', 'Aussie for "It will all be okay!"', 'Tiếng Úc: "Rồi sẽ ổn thôi!"', 'en'], ['Fairy bread: white bread, butter and hundreds and thousands. Every Aussie birthday has it!', 'Bánh mì phết bơ rắc cốm màu: sinh nhật nào ở Úc cũng có!']],
  ['k_babycino', 'melbourne', 'Nonna Rosa', look('dress', '#7a4a8a', '#e8e8e8', 'buns', 'none', '#ffe3d1'), ['☕', 'a babycino (warm milk froth)', 'ly sữa bọt ấm', 3], ['Four seasons in one day', 'Melbourne weather can be sunny, rainy, windy and cold all in one day!', 'Thời tiết Melbourne có thể nắng, mưa, gió, lạnh trong cùng một ngày!', 'en'], ['Melbourne loves coffee, so the kids get a babycino with a marshmallow!', 'Melbourne mê cà phê, nên các bạn nhỏ được ly sữa bọt với kẹo dẻo!']],
  ['k_dimsim', 'melbourne', 'Uncle Ray', look('tunic', '#c0392b', '#1d1412', 'short', 'none', '#f6c7a5'), ['🥟', 'a Melbourne dim sim', 'bánh dim sim', 3], ['Chockers', 'Aussie for "really, really full"!', 'Tiếng Úc: "no căng bụng"!', 'en'], ['Dim sims were invented right here in Melbourne. Steamed or fried?', 'Bánh dim sim được làm ra ở chính Melbourne đó. Hấp hay chiên nè?']],
  ['k_mango', 'brisbane', 'Aunty Grace', look('dress', '#ff9f43', '#1d1412', 'buns', 'none', '#7a4e33'), ['🥭', 'a juicy Queensland mango', 'trái xoài Queensland', 4], ['Hooroo!', 'A Queensland way to say goodbye!', 'Cách người Queensland nói "tạm biệt"!', 'en'], ['Queensland mangoes, sweet as! Messy fingers are part of the fun.', 'Xoài Queensland ngọt lịm! Dính tay mới vui.']],
  ['k_lamington', 'brisbane', 'Pete', look('overalls', '#3a78c8', '#c98b4a', 'short', 'cap', '#ffe3d1'), ['🍫', 'a lamington', 'bánh lamington', 4], ['Beautiful one day, perfect the next', 'Queensland’s happy saying about its sunny weather.', 'Câu nói vui của Queensland về trời nắng đẹp.', 'en'], ['Lamingtons were named after a Queensland governor. Chocolate and coconut, beauty!', 'Bánh lamington mang tên một thống đốc Queensland. Sô-cô-la và dừa, ngon tuyệt!']],
  // more kiosks in the older villages
  ['k_trongnuoc', 'village', 'Bà Tư', look('aodai', '#5fd39a', '#d8d8d8', 'buns'), ['🍡', 'bánh trôi nước (sweet rice balls)', 'bánh trôi nước', 3], ['Có công mài sắt, có ngày nên kim', 'Keep rubbing an iron bar and one day it becomes a needle: practice makes perfect!', 'Kiên trì mài sắt thì có ngày thành kim: chăm chỉ sẽ thành công!', 'vi'], ['Sweet rice balls floating in ginger syrup. Warm and yummy!', 'Bánh trôi nước chan nước gừng, ấm bụng lắm cháu ạ!']],
  ['k_banhduc', 'village', 'Cô Năm', look('dress', '#a66bff', '#1d1412', 'long', 'nonla'), ['🍮', 'a bowl of chè (sweet bean dessert)', 'chén chè', 3], ['Một con ngựa đau, cả tàu bỏ cỏ', 'When one horse is sick, the whole stable stops eating: we care about each other.', 'Một con ngựa đau cả tàu bỏ cỏ: mình thương yêu, lo cho nhau.', 'vi'], ['Chè with beans and coconut milk, nice and cool.', 'Chè đậu nước cốt dừa, mát lạnh nè!']],
  ['k_banhkhot', 'town', 'Chú Sáu', look('shirt', '#ff9f43', '#1d1412', 'short', 'cap'), ['🍳', 'bánh khọt from Vũng Tàu (little crispy pancakes)', 'bánh khọt Vũng Tàu', 5], ['Hổng sao đâu!', 'Southern Vietnamese for "No worries!"', 'Tiếng miền Nam: "Không sao đâu!"', 'vi'], ['Bánh khọt, little crispy cakes from Vũng Tàu, with a shrimp on top!', 'Bánh khọt Vũng Tàu nè, giòn rụm có con tôm trên mặt!']],
  ['k_vegemite', 'town', 'Aunty Sue', look('dress', '#5fd39a', '#c98b4a', 'buns', 'none', '#ffe3d1'), ['🍞', 'Vegemite toast', 'bánh mì phết Vegemite', 3], ['Fair go', 'Aussie for "Everyone gets a fair chance!"', 'Tiếng Úc: "Ai cũng có cơ hội công bằng!"', 'en'], ['Vegemite on toast: salty and very Aussie. Just a thin scrape!', 'Bánh mì phết Vegemite: mặn mặn, rất Úc. Phết mỏng thôi nha!']],
  ['k_tanghulu', 'china', 'Grandpa Wang', look('tunic', '#c0392b', '#e8e8e8', 'short', 'none', '#f6c7a5'), ['🍡', 'candied hawthorn (tanghulu)', 'kẹo hồ lô', 3], ['千里之行，始于足下', 'A journey of a thousand miles begins with one step.', 'Hành trình ngàn dặm bắt đầu từ một bước chân.', 'zh'], ['Tanghulu! Shiny sugar on red fruit, crunchy and sweet.', 'Kẹo hồ lô đây! Đường bóng loáng bọc quả đỏ, giòn và ngọt.']],
  ['k_baozi', 'china', 'Auntie Li', look('dress', '#ff7eb8', '#1d1412', 'buns', 'none', '#f6c7a5'), ['🥟', 'a fluffy bao bun', 'bánh bao', 3], ['熟能生巧', 'Practice makes perfect!', 'Luyện tập nhiều sẽ giỏi!', 'zh'], ['Steamed bao buns, soft as clouds!', 'Bánh bao hấp mềm như mây!']],
  ['k_samosa', 'india', 'Uncle Raj', look('tunic', '#ff9f43', '#1d1412', 'short', 'none', '#b47a55'), ['🥟', 'a samosa', 'bánh samosa', 3], ['अतिथि देवो भव', 'Treat every guest as someone very special.', 'Hãy đối xử với khách thật đặc biệt.', 'hi'], ['Hot samosas with potato and peas. Careful, they are crispy!', 'Bánh samosa nóng nhân khoai và đậu. Giòn lắm đó!']],
  ['k_lassi', 'india', 'Didi Meera', look('dress', '#ffd23f', '#1d1412', 'long', 'none', '#b47a55'), ['🥭', 'a mango lassi', 'sinh tố xoài sữa chua', 3], ['बूँद बूँद से सागर भरता है', 'Drop by drop, the ocean fills up: little by little you can do big things.', 'Từng giọt từng giọt làm đầy biển: góp gió thành bão.', 'hi'], ['Mango lassi, cool and creamy on a hot day!', 'Lassi xoài mát lạnh, béo ngậy cho ngày nóng!']],
  ['k_vanilla', 'aussie', 'Shazza', look('dress', '#ff7eb8', '#e8c26a', 'ponytail', 'none', '#ffe3d1'), ['🍰', 'a vanilla slice', 'bánh vanilla slice', 4], ['Good on ya!', 'Aussie for "Well done, you!"', 'Tiếng Úc: "Giỏi lắm!"', 'en'], ['Vanilla slice, wobbly custard and pink icing. Ripper!', 'Bánh vanilla slice, kem trứng rung rinh và đường hồng. Tuyệt cú mèo!']],
  ['k_pavlova', 'aussie', 'Aunty Jo', look('overalls', '#5fd3ff', '#3b2618', 'buns', 'none', '#ffe3d1'), ['🍓', 'a slice of pavlova', 'miếng bánh pavlova', 4], ['Ripper!', 'Aussie for "Excellent!"', 'Tiếng Úc: "Tuyệt vời!"', 'en'], ['Pavlova, crunchy outside, soft inside, with strawberries on top!', 'Bánh pavlova giòn ngoài mềm trong, có dâu tây ở trên!']],
  ['k_banhcuon', 'market', 'Bà Sáu', look('aodai', '#e8d27a', '#d8d8d8', 'buns'), ['🥢', 'bánh cuốn (steamed rice rolls)', 'đĩa bánh cuốn', 5], ['Không thầy đố mày làm nên', 'Without a teacher you can’t do it: say thank you to your teachers!', 'Không thầy đố mày làm nên: nhớ biết ơn thầy cô nhé!', 'vi'], ['Bánh cuốn, thin and soft, steamed fresh this morning.', 'Bánh cuốn tráng mỏng, mới hấp sáng nay đây cháu.']],
  ['k_banhbo', 'market', 'Chị Hai', look('dress', '#ff9f43', '#1d1412', 'ponytail', 'nonla'), ['🧁', 'a bánh bò (fluffy honeycomb cake)', 'cái bánh bò', 3], ['Gần mực thì đen, gần đèn thì sáng', 'Near the ink you get dark, near the lamp you shine: pick kind friends!', 'Gần mực thì đen, gần đèn thì sáng: chơi với bạn tốt nhé!', 'vi'], ['Bánh bò, spongy like honeycomb. Try one!', 'Bánh bò xốp như tổ ong nè. Ăn thử một cái!']]
];
export const KIOSK_IDS = KIOSKS.map(k => k[0]);

// a floating name tag that follows the language (and the renamer)
function tagSprite(text) {
  registerName(text);
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  const draw = () => { g.clearRect(0, 0, 256, 64); g.fillStyle = 'rgba(40,40,40,.55)'; g.beginPath(); g.roundRect(8, 10, 240, 46, 23); g.fill(); g.font = 'bold 28px Fredoka, "Baloo 2", sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(nm(text), 128, 34, 228); };
  draw(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; onLang(() => { draw(); t.needsUpdate = true; });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(3, .75, 1); return s;
}
function kioskSign(text) {
  const c = document.createElement('canvas'); c.width = 384; c.height = 96; const g = c.getContext('2d');
  const draw = () => { const s = T(text[0], text[1]); g.fillStyle = '#fff6e0'; g.fillRect(0, 0, 384, 96); g.strokeStyle = '#c0392b'; g.lineWidth = 8; g.strokeRect(4, 4, 376, 88); let f = 46; g.font = `bold ${f}px Fredoka, "Baloo 2", sans-serif`; while (g.measureText(s).width > 350 && f > 14) { f -= 2; g.font = `bold ${f}px Fredoka, "Baloo 2", sans-serif`; } g.fillStyle = '#7a2a1a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 192, 50); };
  draw(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; onLang(() => { draw(); t.needsUpdate = true; });
  const m = new THREE.MeshBasicMaterial({ map: t }), grp = new THREE.Group(), a = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .65), m), b = a.clone(); b.rotation.y = Math.PI; b.position.z = -.02; grp.add(a, b); return grp;
}

export function createCities(G) {
  const { scene, world } = G;
  const people = [];
  const place = (parts, x, z, rot, y) => { const m = new THREE.Mesh(merge(parts), toonVC()); m.position.set(x, y ?? heightAt(x, z) - .05, z); m.rotation.y = rot; m.castShadow = m.receiveShadow = true; scene.add(m); outline(m, .025, '#4a3a3f'); return m; };
  const info = (x, y, z) => { const s = sprite('ℹ️', 1.5); s.position.set(x, y, z); scene.add(s); world.updaters.push((dt, t) => { s.position.y = y + Math.sin(t * 2 + x) * .25; }); };
  const person = (lk, x, z, face, name, tagH = 2.4) => { // tagH: lift a name tag so two people side by side don't overlap
    const A = nameAvatar(buildAvatar(lk, null), name); A.root.position.set(x, heightAt(x, z), z); A.root.rotation.y = face; scene.add(A.root); people.push(A);
    const tg = tagSprite(name); tg.position.set(x, heightAt(x, z) + tagH, z); scene.add(tg); world.colliders.push({ x, z, r: .45 }); return A;
  };
  // sellers and hosts breathe and sway only when a child is near enough to see them (saves work on phones)
  world.updaters.push((dt, t) => { const H = G.heroes || []; people.forEach((A, k) => { const p = A.root.getWorldPosition ? A.root.position : null; if (p && A.root.parent === scene && !H.some(h => Math.abs(h.pos.x - p.x) < 70 && Math.abs(h.pos.z - p.z) < 70)) return; A.anim('idle', t + k * .7, 0); }); });
  const persona = (id, emoji, name, about, role, region) => { PERSONAS[id] = { emoji, name, age: ['grown-up', 'người lớn'], about, likes: about, mood: ['Very well, thank you!', 'Khỏe lắm, cảm ơn con!'], role, region }; };
  const addLandmark = (id, icon, cc, x, z, mx, mz, name, fact) => {
    info(x, heightAt(x, z) + 3.2, z);
    const lm = { id, icon, cc, x, z, mx, mz, name: () => T(name[0], name[1]), fact }; LANDMARKS.push(lm);
    G.interactables.push({ id: 'pc_' + id, x, z, r: 3.4, icon: 'ℹ️', label: () => T('About: ', 'Tìm hiểu: ') + lm.name(), act: h => postcard(G, h, lm) });
    return lm;
  };
  G.GAME_SPOT = G.GAME_SPOT || {};
  const spinners = [];
  G.cityHosts = {};

  // ---------- each city ----------
  for (const c of CITIES) {
    const D = CITY_DATA[c.id]; if (!D) continue;
    const [gx, gz] = c.gates[0], toward = Math.atan2(gx - c.x, gz - c.z), fx = Math.sin(toward), fz = Math.cos(toward), px = fz, pz = -fx;
    const L = (u, v) => [c.x + px * u + fx * v, c.z + pz * u + fz * v], len = Math.hypot(gx - c.x, gz - c.z);
    const faceStreet = u => Math.atan2(-px * Math.sign(u), -pz * Math.sign(u)); // turned to look at the main street
    c.layout = { toward, len, L };
    // paving: warm stone tiles over the whole square
    {
      const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
      g.fillStyle = c.cc === 'vn' ? '#d9c4a0' : '#d2cbc0'; g.fillRect(0, 0, 128, 128); g.strokeStyle = 'rgba(90,70,50,.25)'; g.lineWidth = 2;
      for (let i = 0; i <= 128; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); }
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(c.w / 2, c.d / 2);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(c.w * 2 - 1, c.d * 2 - 1), new THREE.MeshToonMaterial({ map: t, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      m.rotation.x = -Math.PI / 2; m.position.set(c.x, c.h + .06, c.z); m.receiveShadow = true; scene.add(m);
    }
    // the main street, from the gate straight through the square (round T4a: a paved town street)
    {
      const t = roadTexture('asphalt', null, c.cc === 'vn' ? 'brick' : 'paving'); t.repeat.set(1, len * 2 / 9);   // (round T4a: brick in Vietnam's towns, paving in Australia's)
      const m = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH.asphalt, len * 2 - .4), new THREE.MeshToonMaterial({ map: t, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
      m.rotation.order = 'YXZ'; m.rotation.set(-Math.PI / 2, toward, 0); m.position.set(c.x, c.h + .08, c.z); m.receiveShadow = true; scene.add(m);
    }
    // landmarks: set back on both sides of the street (Bắc Ninh: around the roundabout)
    D.sites.forEach(([id, icon, u0, v0, model, name, fact], k) => {
      const u = D.custom ? u0 : (k % 2 ? 8.6 : -8.6), v = D.custom ? v0 : -4 - Math.floor(k / 2) * 9;   // (T1b: further back, clear of the kiosks and the sellers' footpath; TP. HCM's pier path keeps its corridor)
      const [x, z] = L(u, v), rot = D.custom || model === 'wtram' ? toward : faceStreet(u);
      const m = place(MODELS[model](), x, z, rot, c.h - .05);
      const r = model === 'bnclock' ? 4 : model === 'quanho' || model === 'puppetstage' ? 4.6 : model === 'wtram' ? 4.6 : 4.2;
      world.colliders.push({ x, z, r: Math.min(r, 3.8) });
      if (model === 'bnclock') { const cm = clockFace(); for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.CircleGeometry(.85, 24), cm); const a = k * Math.PI / 2; f.position.set(Math.sin(a) * 1.07, 9.8, Math.cos(a) * 1.07); f.rotation.y = a; m.add(f); } }
      if (model === 'wheelbase') { // the wheel turns
        const wp = [P(new THREE.TorusGeometry(4, .14, 6, 40), '#e8e8e8'), P(C(.4, .4, .6, 10), '#9aa', [0, 0, 0], [Math.PI / 2, 0, 0])];
        for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; wp.push(P(B(.06, 4, .06), '#cfd4d8', [Math.cos(a) * 2, Math.sin(a) * 2, 0], [0, 0, a - Math.PI / 2]), P(S(.42, 10, 8), k % 2 ? '#3cc7e8' : '#ffffff', [Math.cos(a) * 4, Math.sin(a) * 4, .3])); }
        const wm = new THREE.Mesh(merge(wp), toonVC()); wm.position.set(0, 8.6, 0); m.add(wm); spinners.push(wm);
      }
      if (model === 'quanho') { // two Quan họ singers on the boat, in áo tứ thân and a big flat hat
        [[-.9, look('aodai', '#7a4a8a', '#1d1412', 'buns', 'nonla'), 'Liền chị Thu'], [.9, look('tunic', '#3b2618', '#1d1412', 'short'), 'Liền anh Nam']].forEach(([dx, lk, nmn]) => { const A = buildAvatar(lk, null); A.root.position.set(dx, .95, 0); A.root.scale.setScalar(.9); m.add(A.root); people.push(A); registerName(nmn); });
        let sing = 0; world.updaters.push((dt, t) => { sing -= dt; const h0 = G.heroes[0]; if (sing <= 0 && h0 && dist2(h0.pos.x, h0.pos.z, x, z) < 9) { sing = 26; G.fx && G.fx(x, c.h + 3.4, z, '🎶'); say('Người ơi người ở đừng về… A song asking a friend to stay a little longer.', 'Người ơi người ở đừng về… người ơi người ở đừng về…'); } });
        G.interactables.push({ id: 'npc_quanho', x: x + fx * 4.6, z: z + fz * 4.6, r: 3, icon: '🎶', bubble: '🎶', label: () => T('Sing along with the Quan họ singers', 'Hát cùng liền anh liền chị Quan họ'), act: h => G.playGame(h.i, 'tune', 'place') });
      }
      // its ℹ️ sign stands at the street edge in front of it
      const [sx, sz] = D.custom ? [x + fx * (model === 'bnclock' ? 5.2 : 5.4), z + fz * (model === 'bnclock' ? 5.2 : 5.4)] : L(Math.sign(u) * 3.6, v);
      addLandmark(id, icon, c.cc, sx, sz, x, z, name, fact);
    });
    // a bridge landmark (Cầu Rồng): its ℹ️ sign on land by the bridge's far end, beside the road; the map points at the
    // middle of the bridge (owner, 18 Oct AEDT: the sign stood in Sông Hồng and the map sent children there, from an old layout)
    for (const [id, icon, x, z, name, fact] of D.extra || []) { const B = BRIDGES.find(B => B.landmark === id);
      if (!B) { addLandmark(id, icon, c.cc, x, z, x, z, name, fact); continue; }
      const u = B.a1 + 3, v = B.w / 2 + 2.6, m = (B.a0 + B.a1) / 2, [sx, sz] = B.axis === 'z' ? [B.c + v, u] : [u, B.c + v];
      addLandmark(id, icon, c.cc, sx, sz, B.axis === 'z' ? B.c : m, B.axis === 'z' ? m : B.c, name, fact); }
    // the host, who plays the city's game with you
    {
      const [game, name, lk, greet, role] = D.host, hu = (D.hostAt || [-4.2])[0], [x, z] = L(hu, (D.hostAt || [0, 1.5])[1]), hf = faceStreet(hu);
      person(lk, x, z, hf, name);
      const id = 'g_' + game; G.GAME_SPOT[game] = id; G.cityHosts[c.id] = { x, z, name, game };
      G.interactables.push({ id, x: x + Math.sin(hf) * 1.6, z: z + Math.cos(hf) * 1.6, r: 3, icon: '🎮', bubble: (GAMES_ICON[game] || '🎮'), label: () => nm(name), act: async h => { const k = await dialog(name, [greet], [['🎮 Let’s play!', '🎮 Chơi thôi!'], ['👋 Later', '👋 Để sau']]); if (k === 0) G.playGame(h.i, game, 'place'); } });
      persona(id, '🎮', name, greet, role, c.cc === 'au' ? 'au' : c.id === 'danang' ? 'trung' : c.id === 'saigon' || c.id === 'vungtau' ? 'nam' : 'bac');
    }
    // the city's name on the map, and in Travel
    G.PLACES.push({ g: c.cc, key: c.id, icon: c.icon, name: () => T(c.name[0], c.name[1]), x: gx + fx * 3, z: gz + fz * 3 });
  }
  world.updaters.push((dt, t) => spinners.forEach(w => { w.rotation.z = t * .12; }));
  // (round T3) Anh Hai's kite over Bãi Sau (it flew over the Three Regions Market before he moved to Vũng Tàu)
  if (G.cityHosts.vungtau) {
    const { x: hx, z: hz } = G.cityHosts.vungtau, hy = heightAt(hx, hz), kiteS = sprite('🪁', 1.6); scene.add(kiteS);
    const kline = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: '#5a4a3a' })); scene.add(kline);
    const k = new THREE.Vector3(), hand = new THREE.Vector3(hx, hy + 1.2, hz);
    world.updaters.push((dt, t) => { k.set(hx + 2 + Math.sin(t * .5) * 3, hy + 16 + Math.sin(t * .9) * 1.5, hz + 14 + Math.cos(t * .4) * 2); kiteS.position.copy(k); kline.geometry.setFromPoints([hand, k]); });
  }

  // ---------- kiosks, in the cities and in the older villages ----------
  // (T1b, owner 11 Oct) each kiosk takes the next slot of its place's one market row (js/content/map.js MARKET_ROWS,
  // rowSlot): on one side of the main street, facing it, 1.5 m back from its edge. SLOTS: which slots, where the row
  // also holds stalls (the market: north, centre and south dishes among the stalls; Aussie Corner: in metres, either side
  // of the crossing).
  const SLOTS = { market: [2, 7], aussie: [9.1, 24.9] };
  const counts = {};
  for (const [id, where, name, lk, food, saying, greet] of KIOSKS) {
    const n = counts[where] = (counts[where] || 0) + 1, sl = rowSlot(where, SLOTS[where] ? SLOTS[where][n - 1] : n - 1, 1.4), { x, z, face } = sl;
    // the kiosk: a little hut with a striped awning, a sign and its food on the counter
    const parts = [P(B(2.6, 1, 1.4), '#c98a4a', [0, .5, 0]), P(B(2.8, .1, 1.6), '#f6e7c8', [0, 1.05, 0])];
    for (const [ex, ez] of [[-1.25, -.6], [1.25, -.6], [-1.25, .6], [1.25, .6]]) parts.push(P(C(.06, .06, 2.4, 6), '#8a5a3b', [ex, 1.2, ez]));
    for (let k = 0; k < 6; k++) parts.push(P(B(.5, .08, 1.9), k % 2 ? '#ffffff' : (where === 'aussie' || where === 'sydney' || where === 'melbourne' || where === 'brisbane' ? '#2f7a4a' : where === 'china' ? '#c0392b' : where === 'india' ? '#ff9f43' : '#e8433a'), [-1.25 + k * .5, 2.45, 0], [.14, 0, 0]));
    const km = new THREE.Mesh(merge(parts), toonVC()); km.position.set(x, heightAt(x, z), z); km.rotation.y = face; km.castShadow = true; scene.add(km);
    world.colliders.push({ x, z, r: 1.3 }); world.stalls.push({ id, place: where, kind: 'kiosk', x, z, w: 2.6, d: 1.4, face, tap: 'v_' + id });
    const sg = kioskSign([food[1].replace(/^(a|an) /, '').replace(/^\w/, ch => ch.toUpperCase()), food[2].replace(/^\w/, ch => ch.toUpperCase())]); sg.position.set(0, 2.95, .5); km.add(sg);
    const goods = sprite(food[0], .9); goods.position.set(0, 1.55, .35); km.add(goods);
    // the seller stands behind the counter
    const bx = x - Math.sin(face) * 1.1, bz = z - Math.cos(face) * 1.1;
    person(lk, bx, bz, face, name);
    const ix = x + Math.sin(face) * 1.45, iz = z + Math.cos(face) * 1.45;   // (T1b) the customer's spot, in front of the counter
    const v = { id, name, region: saying[3] === 'en' ? 'au' : saying[3] === 'vi' ? 'nam' : saying[3], food, greet, saying, kiosk: true, x: ix, z: iz };
    VENDORS.push(v); // shows up in the food passport
    G.interactables.push({ id: 'v_' + id, x: ix, z: iz, r: 3, icon: food[0], bubble: food[0], label: () => nm(name), act: h => kioskTalk(G, h, v) });
    persona('v_' + id, food[0], name, greet, `a friendly kiosk seller who sells ${food[1]} and loves the saying "${saying[0]}" (${saying[1]})`, v.region);
  }

  // ---------- (round T3) Bạch Dinh above Vũng Tàu, facing its square; Two Homes Street: Nhà Tròn and house number 8 ----------
  {
    const VT = CITIES.find(c => c.id === 'vungtau'), [x, z] = landmarkAt('bachdinh'), rot = Math.atan2(VT.x - x, VT.z - z);
    place(MODELS.bachdinh(), x, z, rot); world.colliders.push({ x, z, r: 4.2 });
    addLandmark('bachdinh', '🏛️', 'vn', x + Math.sin(rot) * 6, z + Math.cos(rot) * 6, x, z, ['Bạch Dinh, the White Villa (Vũng Tàu)', 'Bạch Dinh (Vũng Tàu)'], ['Bạch Dinh, the White Villa, sits on a green hill above the sea in Vũng Tàu. It was built in 1898, all white with a red roof, and now it is a museum.', 'Bạch Dinh nằm trên đồi xanh nhìn ra biển Vũng Tàu. Biệt thự được xây năm 1898, sơn trắng mái ngói đỏ, nay là bảo tàng.']);
  }
  {
    const [x, z] = landmarkAt('nhatron'), rot = Math.atan2(TOWN.x - 4 - x, TOWN.z - 1 - z);
    place(MODELS.nhatron(), x, z, rot); world.colliders.push({ x, z, r: 3.4 });
    // at the top of every real hour its bell strikes the time (once at one o'clock … twelve times at twelve) and a
    // flock of swallows flies out from under the roof, circles and goes back in (a game hour is only 25 seconds)
    {
      const y0 = heightAt(x, z), bell = sprite('🔔', 1.1); bell.position.set(x, y0 + 11, z); scene.add(bell);
      const birdGeo = merge([P(new THREE.ConeGeometry(.12, .5, 6), '#1f2a4a', [0, 0, 0], [Math.PI / 2, 0, 0]), P(new THREE.BoxGeometry(.9, .03, .22), '#2a3560', [0, .02, .02]), P(new THREE.ConeGeometry(.06, .3, 4), '#1f2a4a', [.07, 0, -.35], [-Math.PI / 2, 0, .3]), P(new THREE.ConeGeometry(.06, .3, 4), '#1f2a4a', [-.07, 0, -.35], [-Math.PI / 2, 0, -.3]), P(new THREE.SphereGeometry(.09, 6, 4), '#f2e6d6', [0, -.04, .18])]);
      const birds = Array.from({ length: 7 }, (_, k) => { const m = new THREE.Mesh(birdGeo, toonVC()); m.visible = false; scene.add(m); return { m, k, ph: Math.random() * 6 }; });
      let lastHour = new Date().getHours(), strikes = 0, nextStrike = 0, flyT = -1, force = false;
      world.updaters.push((dt, t) => {
        const hr = new Date().getHours();
        if (hr !== lastHour || force) { lastHour = hr; force = false; strikes = hr % 12 || 12; nextStrike = 0; flyT = 0; }
        const near = G.heroes.some(h => Math.hypot(h.pos.x - x, h.pos.z - z) < 70);
        if (strikes > 0) { nextStrike -= dt; bell.material.rotation = Math.sin(t * 9) * .35; if (nextStrike <= 0) { strikes--; nextStrike = 1.1; if (near && !G.paused) { tone(659, 1.6, { type: 'sine', vol: .2 }); tone(1318, 1.2, { type: 'sine', vol: .07 }); tone(988, 1.4, { type: 'triangle', vol: .05, at: .02 }); } } }
        else bell.material.rotation *= .9;
        if (flyT >= 0) {
          flyT += dt; const life = 14;
          birds.forEach(B => { const u = Math.min(1, flyT / life), out = Math.sin(u * Math.PI), a = flyT * (1.1 + B.k * .07) + B.k * .9, r = 3 + out * (9 + B.k * 1.3);
            B.m.visible = flyT < life; B.m.position.set(x + Math.cos(a) * r, y0 + 7 + out * (5 + Math.sin(flyT * 2 + B.ph) * 1.5), z + Math.sin(a) * r); B.m.rotation.set(0, -a, Math.sin(t * 18 + B.ph) * .5); });
          if (flyT === dt && near && !G.paused) SFX.chirp && SFX.chirp();
          if (flyT >= life) { flyT = -1; birds.forEach(B => { B.m.visible = false; }); }
        }
      });
      G.nhaTronStrike = () => { force = true; }; // strike now (tests)
    }
    addLandmark('nhatron', '💧', 'vn', x + Math.sin(rot) * 5.5, z + Math.cos(rot) * 5.5, x, z, ['Nhà Tròn, the Round House (Bà Rịa)', 'Nhà Tròn Bà Rịa'], ['Nhà Tròn in Bà Rịa is a round water tower, about 20 metres tall, standing on eight legs. It was built more than a hundred years ago to keep the town’s water, and people could look out over all the roads from the top.', 'Nhà Tròn ở Bà Rịa là tháp nước hình tròn cao khoảng 20 mét, đứng trên tám cột. Tháp được xây hơn một trăm năm trước để chứa nước cho thị xã, và từ trên cao có thể nhìn khắp các ngả đường.']);
  }
  buildHueNghi(G, place, person, TOWN.x - 17, TOWN.z - 18.75);
  // house number 8: a Bà Rịa family home, only its number is shown
  {
    const [x, z] = [TOWN.x - 11.7, TOWN.z + 4.7], rot = Math.PI; // on the flat south side of the street, facing it (the west end is the foot of the Dawn Plateau)
    const parts = [
      P(B(6, .3, 7), '#b9b2a4', [0, .15, 0]),
      P(B(5.4, 3.2, 6), '#f6e3a8', [0, 1.75, -.3]), P(B(5.4, 3, 5.4), '#f6e3a8', [0, 4.85, -.6]),
      P(B(5.8, .25, 1.4), '#e8e0cc', [0, 3.42, 3.1]), // balcony floor
      P(B(5.6, .8, .08), '#3b6fe0', [0, 3.95, 3.75]), P(B(.08, .8, 1.3), '#3b6fe0', [-2.75, 3.95, 3.1]), P(B(.08, .8, 1.3), '#3b6fe0', [2.75, 3.95, 3.1]),
      P(B(2.6, 2.4, .1), '#8a9aa4', [-.9, 1.35, 2.72]), // roll-up shutter
      P(B(1, 2.2, .1), '#7a4a2a', [1.6, 1.25, 2.72]), // front door
      P(B(1.2, 1.4, .1), '#9fd3e8', [-1.2, 4.9, 2.42]), P(B(1.2, 1.4, .1), '#9fd3e8', [1.2, 4.9, 2.42]), P(B(1, 2.2, .1), '#7a4a2a', [0, 4.6, 2.43]),
      P(new THREE.ConeGeometry(1, 1, 4), '#c0503a', [0, 6.95, -.6], [0, Math.PI / 4, 0], [4.2, 1.2, 4.2]),
      P(B(5.6, .25, 5.6), '#e8e0cc', [0, 6.42, -.6]),
      // low front wall and gate
      P(B(2, .9, .2), '#f6e3a8', [-2, .45, 3.6]), P(B(1, .9, .2), '#f6e3a8', [2.3, .45, 3.6]), P(B(1.6, 1.2, .08), '#2b2238', [.9, .6, 3.6]),
      // pots of flowers on the balcony
      P(C(.25, .2, .35, 8), '#c0503a', [-2, 3.75, 3.4]), P(S(.3, 8, 6), '#ff5fa2', [-2, 4.1, 3.4]), P(C(.25, .2, .35, 8), '#c0503a', [2, 3.75, 3.4]), P(S(.3, 8, 6), '#5fd36a', [2, 4.1, 3.4])
    ];
    place(parts, x, z, rot); world.boxes.push({ x0: x - 2.9, x1: x + 2.9, z0: z - 3.4, z1: z + 3.4 });
    // the blue house-number plate (only the number)
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 96; const g = cv.getContext('2d');
    g.fillStyle = '#1f5fbf'; g.beginPath(); g.roundRect(4, 4, 120, 88, 12); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#fff'; g.font = 'bold 66px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('8', 64, 52);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(.7, .52), new THREE.MeshBasicMaterial({ map: t }));
    plate.position.set(x + Math.sin(rot) * 2.82 + Math.cos(rot) * 2.5, heightAt(x, z) + 2.2, z + Math.cos(rot) * 2.82 - Math.sin(rot) * 2.5); plate.rotation.y = rot; scene.add(plate);
    const big = plate.clone(); big.scale.setScalar(1.6); big.position.set(x + Math.sin(rot) * 3.82, heightAt(x, z) + 4.6, z + Math.cos(rot) * 3.82); scene.add(big);
    world.houses.push({ x, z, rot, d: 7, kind: 'home8' }); // its door, family and inside: js/homes.js
  }
}

// The Huệ Nghi shop on Two Homes Street, from the owner's photo: a one-storey pink Bà Rịa shophouse with a
// wide opening, the green roll-up shutter rolled up, red steel posts inside, and a white signboard.
// (No phone numbers or street number on the sign.) Bà Huệ and ông Nghi are at the door.
function hueNghiSign() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 300; const g = c.getContext('2d');
  g.fillStyle = '#f7f7f4'; g.fillRect(0, 0, 1024, 300);
  g.fillStyle = '#1f5fbf'; g.fillRect(0, 238, 1024, 62);
  g.fillStyle = '#2b3a8a'; g.font = '600 46px Fredoka, "Baloo 2", sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('TNHH', 40, 78);
  g.fillStyle = '#d2232a'; g.font = '900 150px Georgia, "Times New Roman", serif'; g.textAlign = 'center'; g.fillText('HUỆ NGHI', 580, 95);
  g.fillStyle = '#2b3a8a'; g.font = '700 46px "Baloo 2", Fredoka, sans-serif'; g.fillText('VẬN CHUYỂN HÀNG HÓA · SẮT THÉP CŨ VÀ MỚI', 512, 196);
  g.fillStyle = '#ffffff'; g.font = '600 38px "Baloo 2", Fredoka, sans-serif'; g.fillText('Bà Rịa', 512, 270);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function buildHueNghi(G, place, person, x, z) {
  const { scene, world } = G, w = 5.8, d = 7.5, pink = '#e9b7ae', y = heightAt(x, z);
  const persona = (id, emoji, name, about, role, region) => { PERSONAS[id] = { emoji, name, age: ['grown-up', 'người lớn'], about, likes: about, mood: ['Very well, thank you!', 'Khỏe lắm, cảm ơn con!'], role, region }; };
  const fz = d / 2; // the front is +z (facing the street)
  const parts = [
    P(B(w + .4, .25, d + 1.4), '#cfc8bd', [0, .12, .7]),                         // floor and the tiled step out front
    P(B(w, 4.3, d - .9), pink, [0, 2.15, -.45]), P(B(w, .9, .9), pink, [0, 3.85, fz - .45]), // the house (the shop front is set back under the beam)
    P(B(.75, 3.9, .5), pink, [-w / 2 + .38, 1.95, fz + .1]), P(B(.75, 3.9, .5), pink, [w / 2 - .38, 1.95, fz + .1]), // front pillars
    P(B(w, .7, .5), pink, [0, 3.6, fz + .1]),                                    // beam over the opening
    P(B(w - .6, 3.4, .1), '#2a2420', [0, 1.75, fz - .82]), P(B(w - .6, .05, .9), '#8f877c', [0, .27, fz - .45]), // the dark shop inside, and its floor
    P(B(w - 1.4, .45, .45), '#5d7562', [0, 3.05, fz]),                           // green roll-up shutter, rolled up
    P(B(.16, 3, .16), '#a8302a', [-w / 2 + 1.1, 1.6, fz - .3]), P(B(.16, 3, .16), '#a8302a', [w / 2 - 1.1, 1.6, fz - .3]), P(B(w - 2.2, .16, .16), '#a8302a', [0, 3.05, fz - .3]), // red steel frame
    P(B(w + .3, 1.95, .14), '#e8e8e2', [0, 4.95, fz + .25]),                      // signboard frame
    P(new THREE.ConeGeometry(1, 1, 4), '#8c939a', [0, 5.2, -.6], [0, Math.PI / 4, 0], [w * .78, 1.3, d * .7]), // grey tin roof behind the sign
    P(B(.42, .55, .2), '#d9d9d2', [-w / 2 + .38, 1.7, fz + .42]), P(B(.3, .18, .21), '#ff7a3a', [-w / 2 + .38, 1.25, fz + .42]), // electricity meter
    P(B(.12, 4.4, .12), '#9aa0a6', [w / 2 + .1, 2.2, fz + .3])                   // the downpipe on the corner
  ];
  const m = place(parts, x, z, 0, y - .02);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(w + .1, 1.75), new THREE.MeshBasicMaterial({ map: hueNghiSign() }));
  sign.position.set(0, 4.95, fz + .33); m.add(sign);
  // a parked motorbike and two little red plastic stools
  const bike = [P(new THREE.TorusGeometry(.32, .08, 6, 14), '#222', [0, .34, .6], [0, Math.PI / 2, 0]), P(new THREE.TorusGeometry(.32, .08, 6, 14), '#222', [0, .34, -.6], [0, Math.PI / 2, 0]),
    P(B(.34, .3, 1.1), '#2c2c34', [0, .62, 0]), P(B(.32, .14, .7), '#3a3a42', [0, .86, -.15]), P(B(.12, .7, .12), '#555', [0, .9, .55], [-.35, 0, 0]), P(B(.7, .06, .06), '#333', [0, 1.22, .66]), P(B(.3, .2, .05), '#eee', [0, .5, -.75])];
  place(bike, x + 2.6, z + fz + 1.4, .25, y);
  for (const [dx, dz] of [[-.7, 1.3], [-1.3, 1.6]]) place([P(B(.38, .3, .38), '#e8433a', [0, .15, 0])], x + dx, z + fz + dz, .3, y);
  world.boxes.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + fz + .2 });
  world.houses.push({ x, z, rot: 0, d, kind: 'tube' });
  // bà Huệ and ông Nghi at the door
  const hue = person(look('aodai', '#7a4a8a', '#d8d8d8', 'buns'), x - 1.9, z + fz + 1.9, .2, 'Bà Huệ');
  const nghi = person(look('shirt', '#d8d4c8', '#b8b8b8', 'short'), x + 1.1, z + fz + 1.8, -.3, 'Ông Nghi', 2.95);
  const talk = async who => {
    SFX.tap();
    const lines = who === 'hue'
      ? [['Hello, little one! Come in and have a cool drink with me. The Huệ Nghi shop opens early every morning.', 'Chào con! Vào đây uống ly nước mát với bà nè. Tiệm Huệ Nghi mở cửa từ sáng sớm đó con.'], ['What a good child! Here is a piece of cake for you.', 'Ngoan quá! Bà cho con miếng bánh nha.']]
      : [['Hello there! I carry goods all over Bà Rịa: steel, bricks, everything!', 'Chào con! Ông chở hàng đi khắp Bà Rịa đó: sắt thép, gạch, đủ thứ hết.'], ['When you grow up, you can help me carry the goods!', 'Lớn lên con giúp ông chở hàng nghen!']];
    const name = who === 'hue' ? 'Bà Huệ' : 'Ông Nghi';
    await dialog(name, lines);
  };
  G.interactables.push({ id: 'npc_bahue', x: x - 1.9, z: z + fz + 3.2, r: 2.2, icon: '👵', bubble: '👵', label: () => nm('Bà Huệ'), act: () => talk('hue') });
  G.interactables.push({ id: 'npc_ongnghi', x: x + 1.3, z: z + fz + 3.2, r: 2.2, icon: '👴', bubble: '👴', label: () => nm('Ông Nghi'), act: () => talk('nghi') });
  persona('npc_bahue', '👵', 'Bà Huệ', ['I am Bà Huệ. Ông Nghi and I keep the Huệ Nghi shop on this street.', 'Bà là bà Huệ. Bà với ông Nghi giữ tiệm Huệ Nghi trên con đường này.'], 'a warm, kind grandmother from Bà Rịa who runs the Huệ Nghi shop with her husband ông Nghi, and speaks with a southern accent', 'nam');
  persona('npc_ongnghi', '👴', 'Ông Nghi', ['I am Ông Nghi. I carry goods all over Bà Rịa.', 'Ông là ông Nghi. Ông chở hàng đi khắp Bà Rịa.'], 'a cheerful grandfather from Bà Rịa who runs the Huệ Nghi transport shop with his wife bà Huệ, and speaks with a southern accent', 'nam');
  void hue; void nghi;
}

const GAMES_ICON = { puppets: '🎎', dongho: '🖼️', dragonfire: '🐉', traffic: '🚦', ferries: '⛴️', tram: '🚋', koala: '🐨' };

// talking to a kiosk seller: buy the food, or learn the saying
async function kioskTalk(G, h, v) {
  const p = h.profile;
  const k = await dialog(v.name, [greetLine(h, v)], [[`${v.food[0]} Buy ${v.food[1]} (${G.fmt(v.food[3])})`, `${v.food[0]} Mua ${v.food[2]} (${G.fmt(v.food[3])})`], ['🗣️ Teach me a saying!', '🗣️ Dạy con một câu nói!'], ['👋 Bye', '👋 Tạm biệt']]);
  if (k === 0) {
    await buyFood(G, h, v);
  }
  if (k === 1) {
    const [words, en, vi, lang] = v.saying;
    p.words = p.words || {}; p.words['say:' + v.id] = true; G.save();
    if (lang === 'zh' || lang === 'hi') { sayIn(lang, words); await new Promise(r => setTimeout(r, 1800)); }
    await dialog(v.name, [[`We say: "${words}". It means: ${en}`, `Ở đây người ta nói: "${words}". Nghĩa là: ${vi}`]]);
    await reward('📖', `“${words}”`, T(en, vi));
    G.job && G.job('puzzle', 1, h);
  }
}
