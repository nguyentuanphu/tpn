// World Heritage around the valley: famous UNESCO places from Vietnam, Australia, China and India,
// each with an ℹ️ sign, a short true fact and a postcard to collect. Also: friends playing traditional
// games you can watch (and learn about), crops and fruit trees from each culture, and front doors
// to knock on.
import { THREE, toon, toonVC, P, merge, outline, sprite } from './gfx.js';
import { T, nm, registerName } from './i18n.js';
import { landmarkAt, inHeritageGrounds } from './content/map.js';
import { heightAt, oldHeightAt, roadDist, VILLAGE, MARKET, AUSSIE, CHINA, INDIA, LAKE, WATER, APOSTLES, FESTGROUNDS, LEAFIES, SHRINES, HALF } from './world.js';
import { buildAvatar } from './avatar.js';
import { LANDMARKS, postcard } from './regions.js';
import { ITEMS } from './data.js';
import { WILD } from './gather.js';
import { dist2 } from './util.js';
import { LINES as CHAT } from './chatter.js';
import { createHomes } from './homes.js';

const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), C = (r1, r2, h, s = 12) => new THREE.CylinderGeometry(r1, r2, h, s), S = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h);
const look = (style, color, hair, hairStyle, skin = '#f6c7a5', hat = 'none') => ({ style, color, hat, back: 'none', hair, hairStyle, skin, glider: 0 });

// ---------- the landmarks ----------
// [id, country, icon, name en/vi, fact en/vi, model]; where to start looking for a clear spot comes from the map
// (round T: js/content/map.js LANDMARK_AT)
type HeritageSite = [id: string, country: string, icon: string, name: [string, string], fact: [string, string], model: string];
const SITES: HeritageSite[] = [
  // Vietnam
  ['halong', 'vn', '⛰️', ['Hạ Long Bay', 'Vịnh Hạ Long'], ['Hạ Long Bay has almost two thousand limestone islands rising out of green water. It is a UNESCO World Heritage site. Legend says a dragon made it!', 'Vịnh Hạ Long có gần hai nghìn hòn đảo đá vôi nhô lên khỏi mặt nước xanh. Đây là Di sản Thế giới UNESCO. Truyền thuyết kể rằng rồng mẹ đã tạo nên vịnh!'], 'halong'],
  ['hue', 'vn', '🏯', ['Huế Imperial City', 'Kinh thành Huế'], ['Huế was the home of the last Vietnamese emperors. The palace has golden roofs, red columns and a big moat. UNESCO World Heritage.', 'Huế là nơi ở của các vị vua cuối cùng của Việt Nam. Cung điện có mái vàng, cột đỏ và hào nước lớn. Di sản Thế giới UNESCO.'], 'hue'],
  ['myson', 'vn', '🧱', ['Mỹ Sơn Sanctuary', 'Thánh địa Mỹ Sơn'], ['Mỹ Sơn has red brick towers built by the Cham people more than a thousand years ago, in the jungle of central Vietnam. UNESCO World Heritage.', 'Mỹ Sơn có những tháp gạch đỏ do người Chăm xây hơn một nghìn năm trước, giữa rừng miền Trung. Di sản Thế giới UNESCO.'], 'myson'],
  ['phongnha', 'vn', '🦇', ['Phong Nha caves', 'Hang động Phong Nha'], ['Phong Nha–Kẻ Bàng has huge caves with underground rivers. Sơn Đoòng, the biggest cave in the world, is there! UNESCO World Heritage.', 'Phong Nha–Kẻ Bàng có những hang động khổng lồ với sông ngầm. Hang Sơn Đoòng, hang động lớn nhất thế giới, nằm ở đây! Di sản Thế giới UNESCO.'], 'cave'],
  ['trangan', 'vn', '🛶', ['Tràng An', 'Tràng An'], ['In Tràng An, Ninh Bình, people row little boats with their feet between tall rocky hills and through caves. UNESCO World Heritage.', 'Ở Tràng An, Ninh Bình, người ta chèo thuyền bằng chân giữa những núi đá cao và xuyên qua hang. Di sản Thế giới UNESCO.'], 'trangan'],
  // Australia
  ['reef', 'au', '🐠', ['Great Barrier Reef', 'Rạn san hô Great Barrier'], ['The Great Barrier Reef is the biggest coral reef in the world. You can see it from space! Turtles, clownfish and dolphins live there. UNESCO World Heritage.', 'Rạn san hô Great Barrier là rạn san hô lớn nhất thế giới. Nhìn từ vũ trụ cũng thấy! Rùa biển, cá hề và cá heo sống ở đó. Di sản Thế giới UNESCO.'], 'reef'],
  ['sisters', 'au', '🏔️', ['The Three Sisters, Blue Mountains', 'Ba Chị Em, Núi Xanh'], ['In the Blue Mountains, three tall rocks called the Three Sisters stand together. The gum trees make a blue haze in the air. UNESCO World Heritage.', 'Ở dãy Núi Xanh, ba tảng đá cao tên là Ba Chị Em đứng cạnh nhau. Rừng bạch đàn tỏa hơi xanh trong không khí. Di sản Thế giới UNESCO.'], 'sisters'],
  ['exhibition', 'au', '🏛️', ['Royal Exhibition Building', 'Tòa nhà Triển lãm Hoàng gia'], ['The Royal Exhibition Building in Melbourne has a big dome. It was built in 1880 for a world fair. UNESCO World Heritage.', 'Tòa nhà Triển lãm Hoàng gia ở Melbourne có mái vòm lớn. Nó được xây năm 1880 cho một hội chợ thế giới. Di sản Thế giới UNESCO.'], 'exhibition'],
  ['kakadu', 'au', '🎨', ['Kakadu rock art', 'Tranh đá Kakadu'], ['In Kakadu, Aboriginal people have painted animals and stories on the rocks for tens of thousands of years. UNESCO World Heritage.', 'Ở Kakadu, người Thổ dân Úc đã vẽ con vật và câu chuyện lên vách đá từ hàng chục nghìn năm nay. Di sản Thế giới UNESCO.'], 'kakadu'],
  // China
  ['forbidden', 'cn', '🏯', ['The Forbidden City', 'Tử Cấm Thành'], ['The Forbidden City in Beijing was the emperors’ palace. It has almost a thousand buildings with golden roofs! UNESCO World Heritage.', 'Tử Cấm Thành ở Bắc Kinh là cung điện của các hoàng đế. Nó có gần một nghìn tòa nhà mái vàng! Di sản Thế giới UNESCO.'], 'forbidden'],
  ['heaven', 'cn', '⛩️', ['Temple of Heaven', 'Thiên Đàn'], ['The Temple of Heaven in Beijing is round with three blue roofs. Emperors prayed there for good harvests. UNESCO World Heritage.', 'Thiên Đàn ở Bắc Kinh hình tròn với ba tầng mái xanh. Các hoàng đế cầu mùa màng tốt tươi ở đó. Di sản Thế giới UNESCO.'], 'heaven'],
  ['terracotta', 'cn', '🗿', ['Terracotta Army', 'Đội quân đất nung'], ['In Xi’an there are thousands of clay soldiers, horses and chariots, made more than 2,000 years ago. Every face is different! UNESCO World Heritage.', 'Ở Tây An có hàng nghìn chiến binh, ngựa và xe bằng đất nung, làm từ hơn 2.000 năm trước. Mỗi khuôn mặt đều khác nhau! Di sản Thế giới UNESCO.'], 'terracotta'],
  ['potala', 'cn', '🏔️', ['Potala Palace', 'Cung điện Potala'], ['The Potala Palace in Lhasa sits high on a mountain, painted white and red. It has more than a thousand rooms. UNESCO World Heritage.', 'Cung điện Potala ở Lhasa nằm trên núi cao, sơn trắng và đỏ. Nó có hơn một nghìn căn phòng. Di sản Thế giới UNESCO.'], 'potala'],
  // India
  ['qutub', 'in', '🗼', ['Qutub Minar', 'Tháp Qutub Minar'], ['Qutub Minar in Delhi is a very tall brick tower with carved stripes, more than 800 years old. UNESCO World Heritage.', 'Tháp Qutub Minar ở Delhi là tòa tháp gạch rất cao có hoa văn khắc, hơn 800 năm tuổi. Di sản Thế giới UNESCO.'], 'qutub'],
  ['redfort', 'in', '🏰', ['Red Fort', 'Pháo đài Đỏ'], ['The Red Fort in Delhi has huge red sandstone walls and little domed pavilions. On India’s Independence Day the flag is raised there. UNESCO World Heritage.', 'Pháo đài Đỏ ở Delhi có tường đá sa thạch đỏ khổng lồ và những đình nhỏ mái vòm. Vào Ngày Độc lập của Ấn Độ, lá cờ được kéo lên ở đó. Di sản Thế giới UNESCO.'], 'redfort'],
  ['konark', 'in', '☸️', ['Konark Sun Temple', 'Đền Mặt Trời Konark'], ['The Konark Sun Temple is shaped like a giant stone chariot for the Sun, with 24 carved wheels and seven horses. UNESCO World Heritage.', 'Đền Mặt Trời Konark có hình cỗ xe đá khổng lồ của Thần Mặt Trời, với 24 bánh xe chạm khắc và bảy con ngựa. Di sản Thế giới UNESCO.'], 'konark'],
  ['hampi', 'in', '🛕', ['Hampi stone chariot', 'Cỗ xe đá Hampi'], ['In Hampi there is a chariot made completely of stone, among giant round boulders. Long ago its wheels could turn! UNESCO World Heritage.', 'Ở Hampi có một cỗ xe làm hoàn toàn bằng đá, giữa những tảng đá tròn khổng lồ. Ngày xưa bánh xe còn quay được! Di sản Thế giới UNESCO.'], 'hampi'],
  ['mahabodhi', 'in', '🙏', ['Mahabodhi Temple', 'Đền Mahabodhi'], ['The Mahabodhi Temple in Bodh Gaya has a tall tower. People say the Buddha sat under a tree there. UNESCO World Heritage.', 'Đền Mahabodhi ở Bồ Đề Đạo Tràng có một tòa tháp cao. Người ta kể Đức Phật đã ngồi dưới gốc cây ở đó. Di sản Thế giới UNESCO.'], 'mahabodhi']
];

// models, built around (0,0) facing +z
const MODELS = {
  halong: () => { const p = []; [[-6, 0, 7], [0, -5, 10], [6, 2, 8], [-2, 7, 6], [9, -6, 5]].forEach(([x, z, h], i) => { p.push(P(new THREE.DodecahedronGeometry(2.2, 0), '#a8a092', [x, h * .45, z], [i, i * 2, 0], [1, h / 3.2, 1]), P(new THREE.IcosahedronGeometry(1.7, 0), '#4f8f42', [x, h * .9, z], [0, i, 0], [1.1, .5, 1.1])); }); return p; },
  hue: () => { const p = [P(B(18, 1, 11), '#d9cdb8', [0, .5, 0]), P(B(14, 3, 7), '#c62828', [0, 2.5, 0])]; for (let i = 0; i < 8; i++) p.push(P(C(.3, .3, 3), '#8e1e1e', [-6.3 + i * 1.8, 2.5, 3.8])); p.push(P(new THREE.ConeGeometry(1, 1, 4), '#f2c230', [0, 5.2, 0], [0, Math.PI / 4, 0], [12, 1.6, 7]), P(new THREE.ConeGeometry(1, 1, 4), '#f2c230', [0, 6.7, 0], [0, Math.PI / 4, 0], [8.5, 1.5, 5])); [-1, 1].forEach(s => p.push(P(new THREE.ConeGeometry(.2, 1, 6), '#f2c230', [s * 8.2, 5.4, 0], [0, 0, s * -.8]))); p.push(P(B(20, .25, 2), '#4f9ad8', [0, .05, 7.2])); return p; },
  myson: () => { const p = []; [[0, 0, 7], [-5, 2, 5], [5, 1.5, 5.5]].forEach(([x, z, h]) => { for (let k = 0; k < 4; k++) { const w = 3.2 - k * .7; p.push(P(B(w, h / 4 * (k ? .8 : 1.4), w), k % 2 ? '#b65a3a' : '#a14a30', [x, h / 4 * k * .95 + h / 8, z])); } p.push(P(new THREE.ConeGeometry(.6, 1.2, 4), '#8e3a24', [x, h + .2, z])); }); p.push(P(B(16, .4, 8), '#7aa36a', [0, .2, 1])); return p; },
  cave: () => { const p = [P(S(7, 16, 10), '#8f8a80', [0, 0, 0], [0, 0, 0], [1.3, .85, 1])]; p.push(P(C(3, 3, 6, 16), '#2b2238', [0, 2.2, 5.8], [Math.PI / 2, 0, 0], [1, 1, 1.1])); for (let i = 0; i < 6; i++) p.push(P(new THREE.ConeGeometry(.3, 1.4, 6), '#d9d4c8', [-2.2 + i * .9, 4.3, 8.4], [Math.PI, 0, 0])); p.push(P(B(5, .1, 8), '#4f9ad8', [0, .1, 11])); return p; },
  trangan: () => { const p = []; [[-5, -2, 7], [4, -3, 9], [0, -6, 6]].forEach(([x, z, h], i) => p.push(P(new THREE.DodecahedronGeometry(2.5, 0), '#9a9488', [x, h / 2 - 1, z], [i, i, 0], [1, h / 4, 1]), P(new THREE.IcosahedronGeometry(2, 0), '#4f8f42', [x, h - .8, z], [0, i, 0], [1, .5, 1]))); p.push(P(B(14, .1, 7), '#5fa8d8', [0, .1, 3]), P(B(2.6, .4, .9), '#8a5a3b', [0, .4, 3]), P(new THREE.ConeGeometry(.45, .35, 16), '#e8d27a', [.5, .9, 3])); return p; },
  // the reef (owner's screenshot, round N: a bright blue slab over the beach): a sandy shoal under the water, well out
  // in the lake, with corals rising a little above the surface; nothing flat sits on top of the water any more
  reef: () => { const p = [P(C(5, 5.4, .3, 18), '#e2cf9c', [0, -.32, 0])]; const cols = ['#ff7eb8', '#ff9f43', '#ffd23f', '#8a5cf6', '#ff4f5e', '#5fd36a']; for (let i = 0; i < 26; i++) { const a = i * 2.4, rr = .8 + (i % 6) * .65, x = Math.cos(a) * rr, z = Math.sin(a) * rr; p.push(i % 3 ? P(new THREE.IcosahedronGeometry(.4 + (i % 3) * .15, 0), cols[i % 6], [x, .05, z]) : P(C(.08, .15, 1 + (i % 4) * .3, 6), cols[i % 6], [x, .35, z], [0, 0, (i % 5 - 2) * .25])); } return p; },
  sisters: () => { const p = []; [[-3, 9], [0, 11], [3.2, 9.5]].forEach(([x, h], i) => p.push(P(new THREE.CylinderGeometry(1, 1.8, h, 7), '#c9a26a', [x, h / 2, 0], [0, i, 0]), P(new THREE.ConeGeometry(1.1, 1.5, 7), '#b88a52', [x, h + .7, 0]))); p.push(P(B(14, 2, 6), '#7aa36a', [0, 1, 3])); for (let i = 0; i < 6; i++) p.push(P(new THREE.IcosahedronGeometry(1.2, 0), '#7f9db8', [-6 + i * 2.4, 2.6, 4.5])); return p; },
  exhibition: () => { const p = [P(B(18, 5, 9), '#e8dcc4', [0, 2.5, 0]), P(B(19, .6, 10), '#c9b89a', [0, 5.2, 0]), P(C(3.6, 3.6, 2.2, 20), '#e8dcc4', [0, 6.6, 0]), P(new THREE.SphereGeometry(3.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), '#9fb8a8', [0, 7.6, 0]), P(C(.15, .15, 2), '#ffd23f', [0, 12, 0])]; for (let i = 0; i < 7; i++) p.push(P(B(1, 2, .2), '#86bfd0', [-6 + i * 2, 2.4, 4.6])); p.push(P(B(4, 3.5, 2), '#e8dcc4', [0, 1.75, 5])); return p; },
  kakadu: () => [P(new THREE.DodecahedronGeometry(4, 1), '#b0643a', [0, 2.4, -1], [0, 0, 0], [2.2, .9, .7])],
  forbidden: () => { const p = [P(B(18, 1.2, 12), '#f2efe6', [0, .6, 0]), P(B(17, .6, 11), '#e8e4d8', [0, 1.5, 0]), P(B(13, 3.5, 7), '#b8261c', [0, 3.6, 0])]; for (let i = 0; i < 6; i++) p.push(P(C(.3, .3, 3.5), '#8e1e1e', [-5.5 + i * 2.2, 3.6, 3.8])); p.push(P(new THREE.ConeGeometry(1, 1, 4), '#f2c230', [0, 6.3, 0], [0, Math.PI / 4, 0], [12, 1.8, 7]), P(new THREE.ConeGeometry(1, 1, 4), '#f2c230', [0, 7.9, 0], [0, Math.PI / 4, 0], [8, 1.6, 4.5])); [-1, 1].forEach(s => p.push(P(new THREE.ConeGeometry(.22, 1, 6), '#f2c230', [s * 8.3, 6.4, 0], [0, 0, s * -.8]))); p.push(P(B(5, .9, 2), '#f2efe6', [0, .45, 7])); return p; },
  heaven: () => { const p = [P(C(8, 8.5, .9, 32), '#f2efe6', [0, .45, 0]), P(C(6.5, 7, .9, 32), '#f2efe6', [0, 1.35, 0]), P(C(5, 5.5, .9, 32), '#f2efe6', [0, 2.25, 0]), P(C(3.2, 3.2, 3, 24), '#b8261c', [0, 4.2, 0])]; [[4.6, 5.8], [3.6, 7.4], [2.6, 8.9]].forEach(([r, y]) => p.push(P(new THREE.ConeGeometry(r, 1.4, 32), '#2b4fa8', [0, y, 0]), P(C(r * .62, r * .62, 1, 24), '#b8261c', [0, y - 1, 0]))); p.push(P(S(.5), '#f2c230', [0, 9.9, 0])); return p; },
  terracotta: () => { const p = [P(B(14, .3, 10), '#c9a26a', [0, -.1, 0])]; [-1, 1].forEach(s => p.push(P(B(14, 1.2, .6), '#b8915a', [0, .5, s * 5]))); for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { const x = -5 + c * 2, z = -3 + r * 3; p.push(P(C(.38, .45, 1.3, 8), '#b07a4f', [x, .7, z]), P(S(.28, 10, 8), '#b07a4f', [x, 1.6, z]), P(C(.3, .3, .15, 8), '#9a6a40', [x, 1.85, z])); } return p; },
  potala: () => { const p = [P(B(18, 3, 8), '#f4f1ea', [0, 1.5, 0]), P(B(14, 3, 6.5), '#f4f1ea', [0, 4.5, -.6]), P(B(7, 3.2, 5.5), '#a8282e', [0, 7.6, -1]), P(B(7.6, .5, 6), '#f2c230', [0, 9.4, -1])]; for (let k = 0; k < 3; k++) for (let i = 0; i < 8; i++) p.push(P(B(.6, .8, .1), '#3a2a28', [-6 + i * 1.7, 1.6 + k * 3, 4 - k * .6 + (k ? -.1 : 0)])); return p; },
  qutub: () => { const p = []; for (let k = 0; k < 5; k++) { const r = 1.9 - k * .3, h = 3.2, y = k * (h + .25); p.push(P(C(r * .9, r, h, 16), k % 2 ? '#c9874e' : '#b86a3c', [0, y + h / 2, 0]), P(C(r + .35, r + .35, .3, 16), '#e8d2b0', [0, y + h + .1, 0])); } p.push(P(C(.5, .6, 1.2, 10), '#e8d2b0', [0, 17.4, 0]), P(B(5, .6, 5), '#c9b89a', [0, .3, 0])); return p; },
  redfort: () => { const p = [P(B(20, 4.5, 2.4), '#b8483a', [0, 2.25, 0])]; for (let i = 0; i < 10; i++) p.push(P(B(1.1, .8, 2.5), '#a83a2e', [-9 + i * 2, 4.9, 0])); [-7, 7].forEach(x => { p.push(P(C(1.4, 1.6, 6, 12), '#b8483a', [x, 3, 1.2])); }); [-7, 0, 7].forEach(x => p.push(P(B(2.4, 1.4, 2.4), '#f4efe6', [x, 6.5, 0]), P(new THREE.SphereGeometry(1.1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), '#f4efe6', [x, 7.2, 0]))); p.push(P(B(3.2, 3.4, 2.6), '#2b2238', [0, 1.7, .3])); return p; },
  konark: () => { const p = [P(B(10, 3, 6), '#9a8070', [0, 1.5, 0]), P(new THREE.ConeGeometry(4, 5, 4), '#8a7060', [0, 5.5, 0], [0, Math.PI / 4, 0])]; [-1, 1].forEach(s => [-3, 0, 3].forEach(x => { p.push(P(new THREE.TorusGeometry(1.2, .25, 8, 18), '#7a6050', [x, 1.3, s * 3.15]), P(C(.08, .08, 2.4, 6), '#7a6050', [x, 1.3, s * 3.15], [Math.PI / 2, 0, 0]), P(C(.08, .08, 2.4, 6), '#7a6050', [x, 1.3, s * 3.15], [0, 0, Math.PI / 2])); })); for (let i = 0; i < 3; i++) p.push(P(B(.7, 1.6, 2), '#9a8070', [-2 + i * 2, .8, 4.6])); return p; },
  hampi: () => { const p = [P(B(5, .6, 6), '#b8a088', [0, .3, 0]), P(B(3.2, 2.8, 4), '#c9b098', [0, 2, 0]), P(new THREE.ConeGeometry(2.3, 2.6, 4), '#b8a088', [0, 4.7, 0], [0, Math.PI / 4, 0])]; [-1, 1].forEach(s => p.push(P(new THREE.TorusGeometry(1, .3, 8, 16), '#9a8270', [s * 2, 1.1, 1], [0, Math.PI / 2, 0]))); [[-7, 2, 2.6], [7, -1, 3.2], [-5, -5, 2], [6, 5, 2.2]].forEach(([x, z, r]) => p.push(P(S(r, 12, 10), '#c8a882', [x, r * .7, z]))); return p; },
  mahabodhi: () => { const p = [P(B(9, 1, 9), '#c9b89a', [0, .5, 0]), P(B(5.5, 4, 5.5), '#c9b089', [0, 3, 0]), P(new THREE.CylinderGeometry(.6, 2.6, 10, 4), '#d4ba90', [0, 10, 0], [0, Math.PI / 4, 0]), P(C(.5, .6, 1.4, 10), '#f2c230', [0, 15.6, 0])]; [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => p.push(P(new THREE.CylinderGeometry(.3, 1, 4, 4), '#d4ba90', [a * 3.3, 6.5, b * 3.3], [0, Math.PI / 4, 0]))); p.push(P(C(.4, .5, 3), '#7a5236', [6, 1.5, 3]), P(new THREE.IcosahedronGeometry(2.4, 1), '#4f9a4a', [6, 4.6, 3])); return p; }
};

type CultureCrop = [key: string, icon: string, type: string, sell: number, name: [string, string], color: string];
export let CULTURE_CROPS: Record<string, CultureCrop[]> = {};
export function createHeritage(G, { give, sfx, say, toast }) {
  const { scene, world } = G;
  // find a clear, fairly flat spot near (x, z) (never over a hidden Leafy or another landmark's sign: round R, a landmark
  // covered two Leafies and Qutub Minar stood on Hampi's sign)
  const signs = [];
  const free = (x, z, r) => [APOSTLES, ...Object.values(FESTGROUNDS)].every(f => dist2(f.x, f.z, x, z) > 17 + r) && SHRINES.every(s => dist2(s.x, s.z, x, z) > r + 4) && LEAFIES.every(l => dist2(l.x, l.z, x, z) > r + 4) && signs.every(q => dist2(q.x, q.z, x, z) > r + 3) && world.colliders.every(c => dist2(c.x, c.z, x, z) > c.r + r) && world.boxes.every(b => x < b.x0 - r || x > b.x1 + r || z < b.z0 - r || z > b.z1 + r);
  function spot(x, z, r, water = false, ok = null, wide = false, territory: string | null = null) {
    for (let k = 0; k < (wide ? 1200 : 400); k++) {
      // (17 Oct AEDT, PERF-001) the same tests as before, cheapest first, each only when the ones before it passed (none of
      // them changes anything, so the first spot that passes them all is the same one)
      const a = k * 2.399, d = Math.sqrt(k) * 2.2, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, h = oldHeightAt(px, pz);
      if (territory && !inHeritageGrounds(territory, px, pz)) continue;
      if (!((water || h > WATER + 1.2) && h < 26)) continue;
      if (!(Math.abs(oldHeightAt(px + r * .6, pz) - oldHeightAt(px - r * .6, pz)) + Math.abs(oldHeightAt(px, pz + r * .6) - oldHeightAt(px, pz - r * .6)) < (water ? 99 : 3.5))) continue;
      if (!water) { const rd = roadDist(px, pz); if (!(rd.d > rd.road.w / 2 + Math.min(r, 7) + .5)) continue; } // never on a road
      if (free(px, pz, r) && (!ok || ok(px, pz))) return [px, pz];
    }
    // nothing clear close by (a crowded corner such as India Village): look further out with a little less room before
    // falling back to the spot on the plan (round R: Hampi fell back and its sign stood on another landmark)
    if (ok && !wide) return spot(x, z, r * .8, water, ok, true, territory);
    if (territory) return null; // Never relocate a country landmark into another district, even if its grounds are full.
    return [x, z];
  }
  const place = (parts, x, z, rot, ol = true) => { const m = new THREE.Mesh(merge(parts), toonVC()); const y = Math.min(heightAt(x, z), heightAt(x + 2, z), heightAt(x - 2, z), heightAt(x, z + 2), heightAt(x, z - 2)); m.position.set(x, y - .05, z); m.rotation.y = rot; m.castShadow = m.receiveShadow = true; scene.add(m); if (ol) outline(m, .03, '#4a3a3f'); return m; };
  // (tester's notes, 12 Oct) a floating (i) sign can be tapped: the child walks up to it and reads it
  const tappable = (sg, it) => { sg.userData.it = it; (G.tapTargets = G.tapTargets || []).push(sg); };
  // (owner, 30 Oct 2026 AEDT: "signs are hard to find; join them down to the ground so a child can run to them") the (i)
  // stands on a wooden post with a glowing ring at its foot, seen from afar, and bobs a little above the post
  const info = (x, y, z) => {
    const g0 = heightAt(x, z), s = sprite('ℹ️', 1.8); s.position.set(x, y + .4, z); scene.add(s);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, Math.max(.5, y - g0), 8), toon('#8a5a3b')); post.position.set(x, g0 + Math.max(.5, y - g0) / 2, z); scene.add(post);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.9, 1.3, 28), new THREE.MeshBasicMaterial({ color: '#ffd86b', transparent: true, opacity: .75, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, g0 + .06, z); scene.add(ring);
    world.updaters.push((dt, t) => { s.position.y = y + .4 + Math.sin(t * 2 + x) * .2; const k = 1 + .18 * Math.sin(t * 3 + x); ring.scale.set(k, k, k); ring.material.opacity = .5 + .3 * Math.sin(t * 3 + x); });
    return s;
  };
  const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

  // ---------- landmarks ----------
  const cen = { vn: [VILLAGE.x, VILLAGE.z], au: [(AUSSIE.x0 + AUSSIE.x1) / 2, (AUSSIE.z0 + AUSSIE.z1) / 2], cn: [CHINA.x, CHINA.z], in: [INDIA.x, INDIA.z] };
  for (const [id, cc, icon, name, fact, model] of SITES) {
    const [nx, nz] = landmarkAt(id);
    const water = id === 'halong' || id === 'reef';
    let x = nx, z = nz, mx, mz;
    if (water) { // in the lake's shallows, with the sign on the beach
      const a = Math.atan2(nz - LAKE.z, nx - LAKE.x); x = LAKE.x + Math.cos(a) * (LAKE.r * (id === 'halong' ? .3 : .55)); z = LAKE.z + Math.sin(a) * (LAKE.r * (id === 'halong' ? .3 : .55));
      (world.waterSites = world.waterSites || []).push({ id, x, z, r: id === 'halong' ? 11 : 5.4 }); // (checked: every part stays in the lake)
      const m = new THREE.Mesh(merge(MODELS[model]()), toonVC()); m.position.set(x, WATER - (id === 'halong' ? 2.2 : .12), z); m.rotation.y = a; scene.add(m); outline(m, .03, '#4a3a3f'); mx = x; mz = z;
      x = LAKE.x + Math.cos(a) * (LAKE.r + 3); z = LAKE.z + Math.sin(a) * (LAKE.r + 3); [x, z] = spot(x, z, 1.5);
    } else {
      // (and its sign, which stands in front facing the place it belongs to, is on open ground too)
      const out = model === 'cave' ? 13 : model === 'hue' || model === 'forbidden' || model === 'exhibition' ? 10 : 8.5;
      const signClear = (px, pz) => { const a = face(px, pz, cen[cc][0], cen[cc][1]), sx = px + Math.sin(a) * out, sz = pz + Math.cos(a) * out; return world.colliders.every(c => dist2(c.x, c.z, sx, sz) > c.r + 2); };
      const position = spot(nx, nz, 9, false, signClear, false, cc === 'cn' ? 'china' : cc === 'in' ? 'india' : null);
      if (!position) { console.warn(`No clear heritage ground for ${id}`); continue; }
      [x, z] = position; mx = x; mz = z;
      const rot = face(x, z, cen[cc][0], cen[cc][1]);
      place(MODELS[model](), x, z, rot); world.colliders.push({ x, z, r: id === 'kakadu' ? 5 : model === 'cave' ? 9.5 : 7 });
      if (id === 'kakadu') { // painted animals on the rock face
        const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
        g.fillStyle = '#b0643a'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#f4efe6'; g.strokeStyle = '#f4efe6'; g.lineWidth = 6;
        g.beginPath(); g.ellipse(140, 130, 70, 30, 0, 0, 7); g.stroke(); for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(90 + i * 20, 115); g.lineTo(90 + i * 20, 145); g.stroke(); } g.beginPath(); g.moveTo(210, 130); g.lineTo(250, 110); g.lineTo(250, 150); g.closePath(); g.fill();
        g.fillStyle = '#e8c070'; g.beginPath(); g.ellipse(360, 120, 40, 55, .3, 0, 7); g.fill(); g.beginPath(); g.ellipse(395, 60, 14, 26, .4, 0, 7); g.fill();
        g.fillStyle = '#f4efe6'; for (let i = 0; i < 70; i++) { g.beginPath(); g.arc((i * 73) % 512, 20 + (i * 37) % 220, 4, 0, 7); g.fill(); }
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(10, 4.4), new THREE.MeshBasicMaterial({ map: t })); pl.position.set(x + Math.sin(rot) * 2.75, heightAt(x, z) + 2.4, z + Math.cos(rot) * 2.75); pl.rotation.y = rot; scene.add(pl);
      }
      // the sign stands in front
      x += Math.sin(rot) * out; z += Math.cos(rot) * out;
    }
    const sg = info(x, heightAt(x, z) + 3.2, z); signs.push({ x, z });
    const lm = { id, icon, cc, x, z, mx, mz, name: () => T(name[0], name[1]), fact };
    LANDMARKS.push(lm);
    const pc = { id: 'pc_' + id, x, z, r: 3.4, icon: 'ℹ️', label: () => T('About: ', 'Tìm hiểu: ') + lm.name(), act: h => postcard(G, h, lm) };
    G.interactables.push(pc); tappable(sg, pc);
  }

  // ---------- friends playing traditional games (watch them, tap ℹ️ to learn) ----------
  const groups = [
    { cc: 'cn', c: [CHINA.x + 9, CHINA.z + 2], kind: 'shuttle', ppl: [look('shirt', '#e8433a', '#1d1412', 'short', '#f3d2b0'), look('dress', '#ffd23f', '#1d1412', 'buns', '#f3d2b0')], name: ['Jianzi (shuttlecock kicking)', 'Đá cầu Trung Quốc (Jianzi)'], fact: ['In China, children and grandparents kick a feathered shuttlecock called jianzi, and try not to let it touch the ground. It is like Vietnamese đá cầu!', 'Ở Trung Quốc, trẻ em và ông bà đá một quả cầu lông gọi là jianzi, cố không để rơi xuống đất. Giống đá cầu của Việt Nam!'] },
    { cc: 'cn', c: [CHINA.x - 9, CHINA.z - 4], kind: 'board', board: '#e8c070', ppl: [look('tunic', '#2d84d4', '#d8d8d8', 'short', '#f3d2b0'), look('tunic', '#6a4a8a', '#d8d8d8', 'short', '#f3d2b0')], name: ['Xiangqi (Chinese chess)', 'Cờ tướng'], fact: ['Grandpas in China play xiangqi in the park. The pieces are flat round discs with characters on them. Vietnamese cờ tướng is the same game!', 'Các ông ở Trung Quốc chơi cờ tướng trong công viên. Quân cờ là những đĩa tròn có chữ. Cờ tướng Việt Nam cũng là trò này!'] },
    { cc: 'in', c: [INDIA.x + 9, INDIA.z + 10], kind: 'board', board: '#f4e2b8', ppl: [look('shirt', '#ff9f1a', '#1d1412', 'short', '#c99a76'), look('dress', '#ff4f9a', '#1d1412', 'long', '#b47a55'), look('tunic', '#2fb04f', '#1d1412', 'short', '#c99a76'), look('dress', '#3cc7e8', '#1d1412', 'buns', '#c99a76')], name: ['Carrom', 'Cờ carrom'], fact: ['Carrom is a favourite family game in India. You flick a striker to knock the wooden discs into the corner pockets.', 'Carrom là trò chơi gia đình rất được yêu thích ở Ấn Độ. Búng quân đánh để đẩy các quân gỗ vào lỗ ở góc bàn.'] },
    { cc: 'in', c: [INDIA.x - 10, INDIA.z + 8], kind: 'kite', ppl: [look('shirt', '#8a5cf6', '#1d1412', 'short', '#c99a76'), look('dress', '#ffd23f', '#1d1412', 'long', '#c99a76')], name: ['Kite festival (Makar Sankranti)', 'Lễ hội thả diều (Makar Sankranti)'], fact: ['In January, the sky over India fills with kites for the festival of Makar Sankranti. Families fly kites from the rooftops!', 'Vào tháng Một, bầu trời Ấn Độ đầy diều trong lễ hội Makar Sankranti. Cả nhà thả diều trên mái nhà!'] },
    { cc: 'vn', c: [VILLAGE.x - 10, VILLAGE.z + 14], kind: 'rope', ppl: [look('dress', '#ff7eb8', '#1d1412', 'buns'), look('shirt', '#3cc7e8', '#1d1412', 'short'), look('aodai', '#ffd23f', '#1d1412', 'long')], name: ['Nhảy dây (jump rope)', 'Nhảy dây'], fact: ['In Vietnamese schoolyards, two friends swing a long rope and the others jump in, singing a counting rhyme.', 'Ở sân trường Việt Nam, hai bạn quay dây dài, các bạn khác nhảy vào và cùng hát đồng dao đếm số.'] },
    { cc: 'vn', c: [VILLAGE.x + 12, VILLAGE.z - 12], kind: 'board', board: '#d9a066', ppl: [look('tunic', '#c0392b', '#8a8a8a', 'short', '#e0aa80'), look('shirt', '#ffffff', '#8a8a8a', 'short', '#e0aa80')], name: ['Cờ tướng under the tree', 'Cờ tướng dưới gốc cây'], fact: ['In Vietnamese villages, grandpas play cờ tướng under a shady tree, and everyone gathers round to watch and give advice!', 'Ở làng quê Việt Nam, các ông chơi cờ tướng dưới gốc cây, mọi người xúm lại xem và góp ý!'] },
    { cc: 'au', c: [AUSSIE.x0 + 10, AUSSIE.z1 + 10], kind: 'footy', ppl: [look('shirt', '#1d3a7a', '#e8c26a', 'short', '#ffe3d1', 'cap'), look('shirt', '#e8433a', '#6b4226', 'long', '#ffe3d1')], name: ['Kick-to-kick (Aussie Rules footy)', 'Đá bóng bầu dục kiểu Úc'], fact: ['Australian Rules football uses an oval ball. Kids play “kick-to-kick” in the park and shout “Mark!” when they catch it.', 'Bóng bầu dục kiểu Úc dùng quả bóng hình bầu dục. Các bạn nhỏ đá chuyền nhau trong công viên và hô “Mark!” khi bắt được bóng.'] },
    { cc: 'au', c: [AUSSIE.x1 - 6, AUSSIE.z0 - 10], kind: 'bowls', ppl: [look('shirt', '#ffffff', '#d8d8d8', 'short', '#ffe3d1', 'cap'), look('dress', '#ffffff', '#d8d8d8', 'buns', '#ffe3d1')], name: ['Lawn bowls', 'Bowling trên cỏ'], fact: ['Lawn bowls is loved by grandparents in Australia. Players roll heavy balls across the grass to stop as close as they can to the little white “jack”.', 'Bowling trên cỏ được ông bà ở Úc rất yêu thích. Người chơi lăn những quả bóng nặng trên cỏ để dừng gần quả bóng trắng nhỏ “jack” nhất.'] }
  ];
  groups.forEach((gr, gi) => {
    const [x, z] = spot(gr.c[0], gr.c[1], 4), y = heightAt(x, z), n = gr.ppl.length, rad = gr.kind === 'board' ? 1.1 : gr.kind === 'rope' ? 2.2 : 2.6;
    const A = gr.ppl.map((l, i) => { const a = i / n * Math.PI * 2; const av = buildAvatar(l, null); const px = x + Math.cos(a) * rad, pz = z + Math.sin(a) * rad; av.root.position.set(px, heightAt(px, pz), pz); av.root.rotation.y = Math.atan2(x - px, z - pz); scene.add(av.root); return av; });
    world.colliders.push({ x, z, r: rad + .4 });
    if (G.chatGroup && CHAT[gr.kind]) G.chatGroup(A.map(av => av.root), CHAT[gr.kind], { face: false });
    let prop = null;
    if (gr.kind === 'board') { const t = new THREE.Mesh(merge([P(B(1.2, .1, 1.2), gr.board, [0, .75, 0]), P(C(.08, .1, .7), '#6a4a2a', [0, .37, 0])]), toonVC()); t.position.set(x, y, z); scene.add(t); for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(C(.07, .07, .04, 10), toon(i % 2 ? '#c62828' : '#2b2238')); d.position.set(x - .4 + (i % 3) * .4, y + .82, z - .3 + Math.floor(i / 3) * .6); scene.add(d); } }
    if (gr.kind === 'shuttle' || gr.kind === 'footy' || gr.kind === 'bowls') { prop = gr.kind === 'shuttle' ? sprite('🪶', .6) : new THREE.Mesh(gr.kind === 'footy' ? S(.22, 12, 10).scale(1, .7, .7) : S(.2), toon(gr.kind === 'footy' ? '#c0392b' : '#3a3a5a')); scene.add(prop); }
    if (gr.kind === 'kite') { prop = sprite('🪁', 1.4); scene.add(prop); }
    let rope = null; if (gr.kind === 'rope') { rope = new THREE.Mesh(new THREE.TorusGeometry(1.8, .04, 6, 24, Math.PI), toon('#ff4f5e')); rope.position.set(x, y + .2, z); scene.add(rope); }
    world.updaters.push((dt, t) => {
      t = Number.isFinite(t) ? Math.abs(t) : performance.now() / 1000;
      A.forEach((av, i) => av.anim(gr.kind === 'board' ? 'idle' : gr.kind === 'rope' && i === 2 ? (Math.sin(t * 6) > 0 ? 'cheer' : 'idle') : gr.kind === 'kite' ? 'wave' : (Math.floor(t * 1.2 + i) % 2 ? 'cheer' : 'idle'), t + i, 0));
      if (rope) rope.rotation.z = t * 6;
      if (prop) {
        if (gr.kind === 'kite') prop.position.set(x + Math.sin(t * .4) * 3, y + 12 + Math.sin(t * .9), z + Math.cos(t * .3) * 3);
        else if (gr.kind === 'bowls') { const k = (t * .25) % 1; prop.position.set(x - 2.4 + k * 4.8, y + .2, z); }
        else { const k = (t * .6) % 1, from = Math.floor(t * .6) % n, to = (from + 1) % n, a0 = A[from].root.position, a1 = A[to].root.position; prop.position.set(a0.x + (a1.x - a0.x) * k, a0.y + 1.2 + Math.sin(k * Math.PI) * 2.5, a0.z + (a1.z - a0.z) * k); }
      }
    });
    const sg = info(x, y + 3.3, z);
    G.interactables.push({ id: 'cult' + gi, x, z, r: rad + 2.6, icon: 'ℹ️', label: () => T('Learn about ', 'Tìm hiểu ') + T(gr.name[0], gr.name[1]), cc: gr.cc, act: h => { const p = h.profile; p.learned = p.learned || {}; if (!p.learned[gi]) { p.learned[gi] = gr.cc; G.save && G.save(); } G.dialog && G.dialog(T(gr.name[0], gr.name[1]), [gr.fact]); } });
    tappable(sg, G.interactables[G.interactables.length - 1]);
  });

  // ---------- crops and fruit trees from each culture ----------
  const CROPS: Record<string, CultureCrop[]> = CULTURE_CROPS = {
    vn: [['coconut', '🥥', 'tree', 9, ['Coconut', 'Dừa'], '#7a5236'], ['jackfruit', '🍈', 'tree', 10, ['Jackfruit', 'Mít'], '#9ccf5a'], ['chilli', '🌶️', 'veg', 4, ['Chilli', 'Ớt'], '#e8433a'], ['waterspinach', '🥬', 'veg', 4, ['Water spinach', 'Rau muống'], '#4f9a4a'], ['sweetpotato', '🍠', 'veg', 5, ['Sweet potato', 'Khoai lang'], '#a8433a']],
    au: [['macadamia', '🥜', 'tree', 9, ['Macadamia nuts', 'Hạt mắc ca'], '#c98a4a'], ['quandong', '🍑', 'tree', 8, ['Quandong (desert peach)', 'Quả quandong (đào sa mạc)'], '#e8433a'], ['fingerlime', '🍋', 'tree', 9, ['Finger lime', 'Chanh ngón tay'], '#9ccf5a'], ['bushtomato', '🍅', 'veg', 6, ['Bush tomato', 'Cà chua dại'], '#e8a33a']],
    cn: [['cnpeach', '🍑', 'tree', 8, ['Longevity peach', 'Đào tiên'], '#ffb3cf'], ['mandarin', '🍊', 'tree', 7, ['Mandarin', 'Quýt'], '#ff9f1a'], ['bokchoy', '🥬', 'veg', 4, ['Bok choy', 'Cải thìa'], '#7ac06a'], ['snowpea', '🫛', 'veg', 5, ['Snow peas', 'Đậu Hà Lan'], '#5fb04f']],
    in: [['mango', '🥭', 'tree', 8, ['Mango', 'Xoài'], '#ffb020'], ['brinjal', '🍆', 'veg', 5, ['Brinjal (eggplant)', 'Cà tím'], '#6a3a8a'], ['ginger', '🫚', 'veg', 6, ['Ginger', 'Gừng'], '#d9b86a'], ['marigold', '🌼', 'veg', 5, ['Marigold flowers', 'Hoa cúc vạn thọ'], '#ff9f1a']]
  };
  const near = { vn: [VILLAGE.x, VILLAGE.z, VILLAGE.r + 8], au: [(AUSSIE.x0 + AUSSIE.x1) / 2, AUSSIE.z1 + 14, 14], cn: [CHINA.x, CHINA.z, CHINA.r + 6], in: [INDIA.x, INDIA.z, INDIA.r + 6] };
  // one mesh for all of a group's parts, coloured as they were (a plant's trunk and leaves, or its fruit)
  const bake = grp => { const parts = []; for (const m of [...grp.children]) if (m.isMesh) { m.updateMatrix(); parts.push(P(m.geometry.clone().applyMatrix4(m.matrix), '#' + m.material.color.getHexString())); grp.remove(m); } if (parts.length) { const one = new THREE.Mesh(merge(parts), toonVC()); one.castShadow = true; grp.add(one); } };
  for (const [cc, list] of Object.entries(CROPS)) {
    list.forEach(([key, icon, type, sell, name, color], li) => {
      if (!WILD[key]) WILD[key] = { kind: 'crop', icon, sell, name: () => T(name[0], name[1]) };
      if (!ITEMS[key]) ITEMS[key] = { icon, name: WILD[key].name };
      for (let k = 0; k < 2; k++) {
        const a = (li * 2 + k) / (list.length * 2) * Math.PI * 2 + (cc === 'au' ? .5 : 0), [cx, cz, r] = near[cc];
        const inV = v => Math.max(-HALF + 14, Math.min(HALF - 14, v)); // (round T: never past the edge of the valley)
        const [x, z] = spot(inV(cx + Math.cos(a) * r), inV(cz + Math.sin(a) * r), 1.6);
        const g = new THREE.Group(), fruit = new THREE.Group();
        if (type === 'tree') {
          { const t = new THREE.Mesh(C(.18, .26, 2.6, 8), toon(key === 'coconut' ? '#9a7a52' : '#7a5236')); t.position.y = 1.3; g.add(t); }
          if (key === 'coconut') for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(.2, 2.2, 4), toon('#4f9a4a')); l.position.set(Math.cos(i * .9) * .9, 2.8, Math.sin(i * .9) * .9); l.rotation.set(Math.sin(i * .9) * 1.2, 0, -Math.cos(i * .9) * 1.2); g.add(l); }
          else for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(.9, 1), toon(i % 2 ? '#5fa04e' : '#4f8f42')); l.position.set(Math.cos(i * 1.6) * .5, 2.9 + (i % 2) * .4, Math.sin(i * 1.6) * .5); g.add(l); }
          for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(S(key === 'jackfruit' ? .28 : .17), toon(color)); f.position.set(Math.cos(i * 2.1) * 1.05, 2.4 + (i % 3) * .35, Math.sin(i * 2.1) * 1.05); fruit.add(f); }
          world.colliders.push({ x, z, r: .5 });
        } else {
          { const bed = new THREE.Mesh(B(2.4, .2, 1.6), toon('#8a5a3b')); bed.position.y = .1; g.add(bed); }
          for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(.3, 0), toon('#5fa04e')); l.position.set(-.9 + (i % 3) * .9, .35, i < 3 ? -.4 : .4); g.add(l); const f = new THREE.Mesh(key === 'brinjal' ? S(.16, 10, 8).scale(1, 1.6, 1) : S(.14, 10, 8), toon(color)); f.position.set(-.9 + (i % 3) * .9 + .15, .55, (i < 3 ? -.4 : .4) + .1); fruit.add(f); }
        }
        bake(g); bake(fruit); // (round T2) each plant drawn as two pieces, not up to eleven
        g.add(fruit); g.position.set(x, heightAt(x, z), z); scene.add(g);
        const st = { ready: 0 };
        world.updaters.push(() => { fruit.visible = performance.now() > st.ready; });
        G.interactables.push({ id: `crop_${key}_${k}`, x, z, r: 2.4, icon, label: () => T(type === 'tree' ? 'Pick ' : 'Harvest ', type === 'tree' ? 'Hái ' : 'Thu hoạch ') + WILD[key].name(), visible: () => performance.now() > st.ready,
          act: h => { st.ready = performance.now() + 150000; sfx.pop(); give(h, key, 2); const p = h.profile; p.found = p.found || {}; const first = !p.found[key]; p.found[key] = (p.found[key] || 0) + 2; if (first) toast(h, '✨ ' + T('New in your collection: ', 'Thêm vào bộ sưu tập: ') + icon + ' ' + WILD[key].name()); G.save(); } });
      }
    });
  }

  // ---------- knock on any front door ----------
  const KNOCK = {
    tube: [['Chào con! This is a nhà ống, a “tube house”: narrow at the front and very long inside. Our shop is downstairs and we live upstairs!', 'Chào con! Đây là nhà ống: mặt tiền hẹp mà bên trong rất dài. Tầng dưới bán hàng, tầng trên là nhà ở!'], ['Want some cold sugarcane juice? Have a lovely day, little one!', 'Uống ly nước mía mát không con? Chúc con một ngày vui nhé!']],
    villa: [['Bonjour! This old house was built in the French style, with tall shutters to keep it cool in the sun.', 'Chào cháu! Ngôi nhà cổ này xây theo kiểu Pháp, có cửa chớp cao để giữ mát khi trời nắng.']],
    cottage: [['G’day! This is a weatherboard cottage. The verandah keeps us cool, and we wave to the neighbours from here.', 'Chào bạn! Đây là nhà gỗ ván kiểu Úc. Hiên nhà giúp mát mẻ, và mình vẫy chào hàng xóm từ đây.'], ['Fancy a Tim Tam? Have a great day, mate!', 'Ăn bánh Tim Tam không? Chúc bạn một ngày vui nhé!']],
    village: [['Chào cháu! A nhà ba gian has three rooms: the middle one is for the family altar and for welcoming guests.', 'Chào cháu! Nhà ba gian có ba gian: gian giữa đặt bàn thờ tổ tiên và để tiếp khách.']],
    china: [['Nǐ hǎo! In China many families live round a courtyard, with grandparents, parents and children together.', 'Nǐ hǎo! Ở Trung Quốc nhiều gia đình sống quanh một khoảng sân, có ông bà, bố mẹ và các con cùng nhau.']],
    india: [['Namaste! Come in for a cup of chai. We hang marigold garlands on the door to welcome guests.', 'Namaste! Vào uống tách trà chai nhé. Nhà mình treo vòng hoa cúc vạn thọ trên cửa để đón khách.']]
  };
  const GIFTS = { tube: 'banana', villa: 'apple', cottage: 'apple', village: 'rice', china: 'mandarin', india: 'mango' };
  // every house: whose home it is, its family, About this house, and Go inside (js/homes.js)
  createHomes(G, { KNOCK, GIFTS, give, sfx, say });
}
