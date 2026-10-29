import { isHeld, isOpen, progressOf, secondSetOf } from './content/unlocks.js';
// Learning that feels like play:
// · Story time under the big banyan tree: short folk tales from Vietnam, Australia, China and India.
// · Counting hunts in each village: find 5 hidden things, counting out loud (and in Chinese or Hindi
//   when a grown-up has switched that on).
// · The Music Corner stall at the Three Regions Market.
// · A gentle rest timer: when the grown-up's time is up, the explorer yawns and says goodnight.
import { pic } from './art.js';
import { THREE, sprite, P, merge, toonVC, outline } from './gfx.js';
import { T } from './i18n.js';
import { say, sayIn } from './voice.js';
import { SFX } from './audio.js';
import { settings, saveSettings, saveProfiles, farm, saveFarm } from './state.js';
import { heightAt, VILLAGE, CHINA, INDIA, AUSSIE, WATER } from './world.js';
import { rowSlot } from './content/map.js';
import { LEARN } from './words2.js';
import { el, esc, dist2, shuffle } from './util.js';
import { modal } from './ui.js';
import { MORE_TALES } from './talesdata.js';
import { openTheatre } from './tales.js';
import { buildAvatar } from './avatar.js';
import { registerName, onLang } from './i18n.js';

// ---------- folk tales: pages are [pictures, English, Tiếng Việt] ----------
// the first pictures of a tale, drawn (whole emoji, so a person with a hat stays one picture)
const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
const shelfPics = (s: string) => (seg ? Array.from(seg.segment(s), x => x.segment) : Array.from(s)).filter(x => x.trim()).slice(0, 3).map(e => pic(e)).join('');
export const TALES = [
  { id: 'banhchung', flag: '🇻🇳', title: () => T('The Square Cake and the Round Cake', 'Sự tích Bánh Chưng Bánh Giầy'), pages: [
    ['👑🤴🤴🤴', 'Long ago, a king asked his sons: "Bring me the most special food in the land, for the New Year."', 'Ngày xưa, vua Hùng bảo các hoàng tử: "Hãy mang đến món ăn quý nhất để dâng lên ngày Tết."'],
    ['🦞🍯🍗', 'The older princes searched far and wide for rare treats from the sea and the mountains.', 'Các hoàng tử anh đi khắp nơi tìm của ngon vật lạ trên rừng dưới biển.'],
    ['🌾🫘🍃', 'The youngest prince, Lang Liêu, was poor. He only had rice, beans and leaves from his garden.', 'Hoàng tử út Lang Liêu nghèo, chỉ có gạo, đậu và lá trong vườn.'],
    ['🟩⚪', 'He made a square green cake for the earth and a round white cake for the sky.', 'Chàng làm bánh vuông màu xanh tượng trưng cho đất, và bánh tròn màu trắng tượng trưng cho trời.'],
    ['👑😊🎉', 'The king tasted them and smiled: "Simple food made with love is the best gift." That is why we make bánh chưng at Tết!', 'Vua nếm thử và mỉm cười: "Món ăn giản dị làm bằng tấm lòng là quý nhất." Vì thế ngày Tết mình gói bánh chưng!']] },
  { id: 'sontinh', flag: '🇻🇳', title: () => T('The Mountain Spirit and the Water Spirit', 'Sơn Tinh, Thủy Tinh'), pages: [
    ['👸🏔️🌊', 'Two spirits both wanted to marry Princess Mỵ Nương: Sơn Tinh of the mountains and Thủy Tinh of the waters.', 'Hai vị thần cùng muốn cưới công chúa Mỵ Nương: Sơn Tinh thần núi và Thủy Tinh thần nước.'],
    ['🐘🐓🍚', 'The king said: "Whoever brings the presents first can marry her." Sơn Tinh arrived first!', 'Vua phán: "Ai mang sính lễ đến trước sẽ được cưới công chúa." Sơn Tinh đến trước!'],
    ['🌧️🌊⛰️', 'Thủy Tinh was cross and sent rain and floods. But Sơn Tinh made the mountains grow higher and higher.', 'Thủy Tinh tức giận, dâng nước và làm mưa lũ. Nhưng Sơn Tinh làm núi cao lên mãi.'],
    ['🗓️🌧️', 'People say that is why there is a rainy season every year: Thủy Tinh still remembers!', 'Người ta kể rằng vì thế năm nào cũng có mùa mưa lũ: Thủy Tinh vẫn còn nhớ chuyện cũ!']] },
  { id: 'tiddalik', flag: '🇦🇺', title: () => T('Tiddalik the Thirsty Frog', 'Chú Ếch Khát Nước Tiddalik'), pages: [
    ['🐸💧', 'This is a story told by Aboriginal people of south-east Australia. One hot morning, Tiddalik the frog woke up very, very thirsty.', 'Đây là câu chuyện của người Thổ dân miền đông nam nước Úc. Một buổi sáng nóng nực, chú ếch Tiddalik thức dậy khát ơi là khát.'],
    ['🐸🌊😮', 'He drank a puddle. Then a pond. Then a whole river! Soon there was no water left for anyone.', 'Chú uống một vũng nước. Rồi một cái ao. Rồi cả một dòng sông! Chẳng mấy chốc chẳng còn giọt nước nào cho ai.'],
    ['🦘🐨🦉🐍', 'The animals had an idea: "If we make Tiddalik laugh, the water will come out!" They danced and pulled funny faces.', 'Các con vật nghĩ ra một cách: "Nếu làm Tiddalik cười, nước sẽ chảy ra!" Chúng nhảy múa và làm mặt xấu.'],
    ['🐍🌀😂', 'Nobody could do it, until the eel wiggled and twisted into silly knots. Tiddalik laughed and laughed!', 'Không ai làm được, cho đến khi con lươn uốn mình thành những cái nút buồn cười. Tiddalik cười mãi không thôi!'],
    ['🌊🐸🌈', 'Whoosh! All the water flowed back into the rivers and ponds. Everyone had a drink, and learned to share.', 'Ào! Nước chảy về sông và ao. Ai cũng được uống nước, và học cách chia sẻ.']] },
  { id: 'change', flag: '🇨🇳', title: () => T('Chang’e, the Lady in the Moon', 'Hằng Nga trên cung trăng'), pages: [
    ['🌕👩🐇', 'In China they tell of Chang’e, who floated all the way up to the moon and lives there with a white jade rabbit.', 'Ở Trung Quốc người ta kể về Hằng Nga, người đã bay lên tận cung trăng và sống ở đó với chú thỏ ngọc trắng.'],
    ['🐇🥣✨', 'The rabbit is always busy, mixing a magic medicine in a little pot.', 'Chú thỏ lúc nào cũng bận rộn giã thuốc thần trong một cái cối nhỏ.'],
    ['🏮🥮👨‍👩‍👧', 'At the Mid-Autumn Festival, families look up at the full moon, share mooncakes and carry lanterns.', 'Vào Tết Trung Thu, mọi nhà ngắm trăng rằm, chia nhau bánh trung thu và rước đèn.'],
    ['🇻🇳🌕', 'In Vietnam we call her Chị Hằng, and Chú Cuội sits under a big tree on the moon too!', 'Ở Việt Nam mình gọi là Chị Hằng, và Chú Cuội cũng ngồi dưới gốc cây đa trên cung trăng!']] },
  { id: 'monkey', flag: '🇮🇳', title: () => T('The Monkey and the Crocodile', 'Khỉ và Cá Sấu'), pages: [
    ['🐒🌳🐊', 'This story comes from the Panchatantra, very old tales from India. A monkey lived in a tree full of sweet fruit by a river.', 'Câu chuyện này trong tập Panchatantra, những truyện rất xưa của Ấn Độ. Một chú khỉ sống trên cây đầy quả ngọt bên bờ sông.'],
    ['🐒🍑🐊', 'Every day the monkey shared fruit with a crocodile, and they became friends.', 'Ngày nào khỉ cũng chia quả cho cá sấu, và hai bạn trở nên thân thiết.'],
    ['🐊😏🐒', 'One day the crocodile said: "Come for a ride on my back!" But in the middle of the river he wanted to trick the monkey.', 'Một hôm cá sấu nói: "Lên lưng tớ đi chơi nhé!" Nhưng giữa dòng sông, cá sấu lại muốn lừa khỉ.'],
    ['🐒💡🌳', 'The clever monkey said: "Oh! I left my heart in the tree. Take me back to get it!" And off he jumped to safety.', 'Khỉ thông minh nói: "Ôi! Tớ để quên trái tim trên cây rồi. Đưa tớ về lấy đã!" Rồi khỉ nhảy lên bờ an toàn.'],
    ['🧠😊', 'Thinking calmly helps us when we are in trouble, and real friends are kind to each other.', 'Bình tĩnh suy nghĩ giúp ta khi gặp khó khăn, và bạn thật sự thì luôn tốt với nhau.']] }
];
TALES.push(...MORE_TALES);
const TALE_FLAGS = [['🇻🇳', 'Vietnam', 'Việt Nam'], ['🇦🇺', 'Australia', 'Úc'], ['🇨🇳', 'China', 'Trung Quốc'], ['🇮🇳', 'India', 'Ấn Độ'], ['🌍', 'World', 'Thế giới']];

// ---------- counting hunts ----------
const HUNTS = [
  { id: 'lotus', c: () => VILLAGE, icon: '🪷', n: 5, name: () => T('lotus flowers', 'bông sen'), host: '🧑‍🌾' },
  { id: 'koala', c: () => ({ x: (AUSSIE.x0 + AUSSIE.x1) / 2, z: (AUSSIE.z0 + AUSSIE.z1) / 2 }), icon: '🐨', n: 5, name: () => T('sleepy koalas', 'chú gấu koala ngủ gật'), host: '🧢' },
  { id: 'lantern', c: () => CHINA, icon: '🏮', n: 5, name: () => T('red lanterns', 'đèn lồng đỏ'), host: '🐼' },
  { id: 'peacock', c: () => INDIA, icon: '🪶', n: 5, name: () => T('peacock feathers', 'lông công'), host: '🦚' }
];

export function createLearning(G) {
  const { scene, world } = G;
  const free = (x, z, r) => world.colliders.every(c => dist2(c.x, c.z, x, z) > c.r + r) && world.boxes.every(b => x < b.x0 - r || x > b.x1 + r || z < b.z0 - r || z > b.z1 + r);
  const spot = (x, z, r) => { for (let k = 0; k < 300; k++) { const a = k * 2.399, d = Math.sqrt(k) * 2, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; if (heightAt(px, pz) > WATER + .8 && free(px, pz, r)) return [px, pz]; } return [x, z]; };

  // story time under the banyan
  {
    const [x, z] = spot(VILLAGE.x + 6, VILLAGE.z + 10, 1.2);
    const mat = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, .06, 24), new THREE.MeshToonMaterial({ color: '#e8433a' })); mat.position.set(x, heightAt(x, z) + .04, z); scene.add(mat);
    const s = sprite('📖', 1.4); s.position.set(x, heightAt(x, z) + 2.2, z); scene.add(s); world.updaters.push((dt, t) => { s.position.y = heightAt(x, z) + 2.2 + Math.sin(t * 2) * .15; });
    G.interactables.push({ id: 'storytime', x, z, r: 3, icon: '📖', label: () => T('Story time under the banyan tree', 'Giờ kể chuyện dưới gốc đa'), act: h => openTales(h) });
    // Bà Năm, the storyteller grandma, sits by the mat. (tester's notes, 12 Oct) her name tag says Bà Năm, the name the
    // story uses ("Ask Bà Năm where the lantern went"); it said Bà Kể Chuyện, so children looked for her in the houses
    const sx = x - 1.9, sz = z - .4, A = buildAvatar({ style: 'aodai', color: '#8a4a8a', hat: 'none', back: 'none', hair: '#e8e8e8', hairStyle: 'buns', skin: '#e8b48c', glider: 0 }, null);
    A.root.position.set(sx, heightAt(sx, sz), sz); A.root.rotation.y = Math.atan2(x - sx, z - sz); scene.add(A.root); world.colliders.push({ x: sx, z: sz, r: .45 });
    registerName('Bà Kể Chuyện', '📖');
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    const drawTag = () => { g.clearRect(0, 0, 256, 64); g.fillStyle = 'rgba(40,40,40,.55)'; g.beginPath(); g.roundRect(8, 10, 240, 46, 23); g.fill(); g.font = 'bold 26px Fredoka, "Baloo 2", sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(T('Grandma Năm', 'Bà Năm'), 128, 34, 228); tx.needsUpdate = true; };
    drawTag(); onLang(drawTag);
    const tg = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false })); tg.scale.set(3, .75, 1); tg.position.set(sx, heightAt(sx, sz) + 2.4, sz); scene.add(tg);
    world.updaters.push((dt, t) => A.anim(Math.floor(t * .4) % 3 === 0 ? 'wave' : 'idle', t, 0));
    G.storyteller = { x: sx, z: sz };
  }
  // read one tale in the theatre, then remember it (three tales give a sticker)
  const readTale = async (h, t, sync = false) => {
    if (!isOpen(h.profile,t.id,'tale',t.flag)) return;
    const p = h.profile; p.tales = p.tales || {}; p.taleReads = p.taleReads || {};
    // friends in the room: read it together? (round H)
    if (!sync && G.together && G.together()) { const k = await G.dialog('Bà Năm', [['Shall we read it together with your friends?', 'Mình đọc cùng các bạn nhé?']], [['👫 Together', '👫 Cùng nhau'], ['🙂 Just me', '🙂 Mình con']]); if (k === 0) { G.inviteGame('tale-' + t.id, null, 1); return; } }
    G.paused = true;
    const completed = await openTheatre(t, { name: p.name, sync });
    if (completed === null) { G.paused = false; return; } // A missing download never earns a read/reward.
    const first = !p.tales[t.id]; p.tales[t.id] = true; p.taleReads[t.id] = (p.taleReads[t.id] || 0) + 1; saveProfiles(); G.paused = false;
    if (first && Object.keys(p.tales).length === 3) { const st = G.giveSticker(p); await G.reward(st || '📚', T('Story lover!', 'Bạn nhỏ mê truyện!'), T('You heard three folk tales.', 'Con đã nghe ba truyện cổ tích.')); }
    if (first && Object.keys(p.tales).length === 10) { const st = G.giveSticker(p); await G.reward(st || '📚', T('Ten tales!', 'Mười truyện rồi!'), T('You are a real story explorer.', 'Con là nhà thám hiểm truyện cổ tích thật sự.')); }
  };
  // from the Games hub (or anywhere): fly to the storyteller grandma, and she starts the tale
  // (r90) the stories a child can be offered: the second set is left out while Studio holds it (the Simple screen reads this)
  Object.defineProperty(G, 'TALES', { configurable: true, get: () => TALES.filter(t => !isHeld(t.id, 'tale')) }); G.readTaleNow = readTale;
  G.readTale = async (i, id) => {
    const h = G.heroes[i], t = TALES.find(x => x.id === id); if (!h || !t || !isOpen(h.profile,t.id,'tale',t.flag)) return;
    if (G.storyteller && dist2(h.pos.x, h.pos.z, G.storyteller.x, G.storyteller.z) > 5) await G.landBy(h, G.storyteller.x, G.storyteller.z);
    say(`Come and sit down. Here is ${t.title()}.`, `Lại đây ngồi với bà. Bà kể chuyện ${t.title()} nhé.`);
    await new Promise(r => setTimeout(r, 1300));
    readTale(h, t);
  };
  // (r90, owner 24 Oct AEDT) the stories still to unlock fold into one padlock tile per shelf (one tap shows them), and
  // the new stories held back in Studio (New stories off) into one "Coming soon" tile
  G.taleFolds = G.taleFolds || new Set();
  const taleCard = (t, open, read) => `<button class="talecard ${read ? 'read' : ''} ${open ? '' : 'locked'}" ${open ? `data-tale="${t.id}"` : `data-locked-tale="${t.id}"`}><span>${open ? shelfPics(t.pages[0][0]) : pic('\u{1F512}')}</span><small>${esc(t.title())}${read ? ' ' + pic('\u2705') : ''}</small></button>`;
  G.taleShelfHTML = p => TALE_FLAGS.map(([f, en, vi]) => {
    const shelf = TALES.filter(t => t.flag === f && !isHeld(t.id, 'tale')), reads = p.tales || {};
    const open = shelf.filter(t => isOpen(p, t.id, 'tale', f)), locked = shelf.filter(t => !open.includes(t));
    const held = secondSetOf('tale', f).filter(id => TALES.some(t => t.id === id) && isHeld(id, 'tale')).length, shown = G.taleFolds.has(f);
    const fold = locked.length ? `<button class="talecard talefold" data-fold-tale="${f}" aria-expanded="${shown}"><span>${pic('\u{1F512}')}</span><small>${shown ? T('Hide', 'Thu gọn') : T(`${locked.length} more to unlock · Read each story above 3 times`, `Còn ${locked.length} truyện để mở · Đọc mỗi truyện ở trên 3 lần`)}</small></button>` : '';
    const soon = held ? `<button class="talecard talesoon" data-soon="tale"><span>${pic('\u{1F51C}')}</span><small>${T(`Coming soon: ${held} new stories`, `Sắp ra mắt: ${held} truyện mới`)}</small></button>` : '';
    const cards = open.map(t => taleCard(t, true, reads[t.id])).join('') + fold + (shown ? locked.map(t => taleCard(t, false, reads[t.id])).join('') : '') + soon;
    if (!cards) return '';
    const progress = progressOf(p, 'tale', f);
    const note = progress.done >= 3 || !locked.length ? '' : `<div class="unlock-note">${T('To unlock more stories, finish each story here 3 times.', '\u0110\u1ec3 m\u1edf th\u00eam truy\u1ec7n, con h\u00e3y xem xong m\u1ed7i truy\u1ec7n \u1edf \u0111\u00e2y 3 l\u1ea7n.')}<small>${progress.done}/3</small></div>`;
    // (a flag is drawn by icons.js; the world shelf's globe is our drawing, never the phone emoji)
    return `<h3>${/\p{Regional_Indicator}/u.test(f) ? f : pic(f)} ${T('Tales from ' + en, 'Truy\u1ec7n ' + vi)}</h3><div class="talegrid">${cards}</div>${note}`;
  }).join('');
  /** the fold and Coming soon taps on a shelf; `redraw` paints the shelves again */
  G.bindTaleShelf = (root, redraw) => {
    root.querySelectorAll('[data-fold-tale]').forEach(b => b.onclick = () => { const f = b.dataset.foldTale; if (G.taleFolds.has(f)) G.taleFolds.delete(f); else { G.taleFolds.add(f); say('Finish each story in this shelf 3 times to unlock more.', '\u0110\u1ecdc xong m\u1ed7i truy\u1ec7n trong k\u1ec7 n\u00e0y 3 l\u1ea7n \u0111\u1ec3 m\u1edf th\u00eam nh\u00e9.'); } redraw(); });
    root.querySelectorAll('[data-soon="tale"]').forEach(b => b.onclick = () => say('New stories are coming soon!', 'Truyện mới sắp ra mắt rồi!'));
    root.querySelectorAll('[data-locked-tale]').forEach(b => b.onclick = () => say('Finish each story in this shelf 3 times to unlock more.', '\u0110\u1ecdc xong m\u1ed7i truy\u1ec7n trong k\u1ec7 n\u00e0y 3 l\u1ea7n \u0111\u1ec3 m\u1edf th\u00eam nh\u00e9.'));
  };
  const openTales = h => {
    G.paused = true;
    const m = modal('tales', ''), card = m.querySelector('.card'), p = h.profile; p.tales = p.tales || {};
    const close = () => { m.close(); G.paused = false; };
    card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>📖 ${T('Story time', 'Giờ kể chuyện')}</h2><p class="sub">${T('Folk tales from Vietnam, Australia, China and India. Tap a picture and Grandma reads it to you!', 'Truyện cổ tích Việt Nam, Úc, Trung Quốc và Ấn Độ. Chạm vào hình, bà sẽ kể cho con nghe!')}</p>
      <div class="talelib">${G.taleShelfHTML(p)}</div>`;
    card.querySelector('.x').onclick = close;
    const lib = card.querySelector('.talelib');
    const bindLib = () => { G.bindTaleShelf(lib, () => { lib.innerHTML = G.taleShelfHTML(p); bindLib(); }); lib.querySelectorAll('[data-tale]').forEach(b => b.onclick = () => { const t = TALES.find(x => x.id === b.dataset.tale); m.close(); readTale(h, t); }); };
    bindLib();
    say('Which story shall we read?', 'Mình đọc truyện nào nhỉ?');
  };

  // counting hunts: a board in each village; the hidden things appear when a hunt starts
  HUNTS.forEach(H => {
    const c = H.c(), [bx, bz] = spot(c.x + 7, c.z - 5, 1.2);
    const board = new THREE.Mesh(merge([P(new THREE.BoxGeometry(1.8, 1.2, .12), '#fff3c4', [0, 1.6, 0]), P(new THREE.CylinderGeometry(.07, .07, 1.6, 6), '#8a5a3b', [-.7, .8, 0]), P(new THREE.CylinderGeometry(.07, .07, 1.6, 6), '#8a5a3b', [.7, .8, 0])]), toonVC());
    board.position.set(bx, heightAt(bx, bz), bz); board.rotation.y = Math.atan2(c.x - bx, c.z - bz); scene.add(board); outline(board, .03, '#4a3a3f');
    const ic = sprite('🔎', 1.1); ic.position.set(bx, heightAt(bx, bz) + 2.9, bz); scene.add(ic);
    const S = { on: false, found: 0, items: [] };
    const finish = async h => {
      S.on = false; SFX.fanfare(); farm.coins += 5; saveFarm(); h.profile.hunts = h.profile.hunts || {}; h.profile.hunts[H.id] = (h.profile.hunts[H.id] || 0) + 1; saveProfiles();
      G.celebrate(h);
      await G.reward(H.icon, T(`You found all ${H.n} ${H.name()}!`, `Con tìm đủ ${H.n} ${H.name()} rồi!`), '+' + G.fmt(5));
    };
    const start = h => {
      if (S.on) { say(`You have found ${S.found}. Keep looking for ${H.name()}!`, `Con tìm được ${S.found} rồi. Tìm tiếp ${H.name()} nhé!`); return; }
      S.on = true; S.found = 0; S.items.forEach(it => scene.remove(it.s)); S.items = [];
      for (let k = 0; k < H.n; k++) {
        const a = Math.random() * 6.28, r = 8 + Math.random() * 14, [x, z] = spot(c.x + Math.cos(a) * r, c.z + Math.sin(a) * r, .8), y = heightAt(x, z) + (H.id === 'koala' || H.id === 'lantern' ? 2.2 : .6);
        const s = sprite(H.icon, 1); s.position.set(x, y, z); scene.add(s);
        const it = { s, x, z, y, got: false }; S.items.push(it);
        const ia = { id: `hunt_${H.id}_${k}`, x, z, r: 2, icon: H.icon, visible: () => S.on && !it.got, label: () => T('Count it!', 'Đếm nào!'), auto: true,
          act: hh => { if (it.got || !S.on) return; it.got = true; scene.remove(s); S.found++; SFX.pop(S.found);
            const n = S.found; G.fx(x, y + .6, z, String(n));
            say(['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'][n] + '!', ['', 'Một', 'Hai', 'Ba', 'Bốn', 'Năm', 'Sáu'][n] + '!');
            if (settings.learnLang && LEARN[settings.learnLang] && n <= 5) setTimeout(() => sayIn(settings.learnLang, LEARN[settings.learnLang].words[14 + n][3]), 900);
            if (n >= H.n) setTimeout(() => finish(hh), 1500); } };
        G.interactables.push(ia);
      }
      say(`Can you find ${H.n} ${H.name()} hiding around here? Let's count them together!`, `Con có tìm được ${H.n} ${H.name()} đang trốn quanh đây không? Mình cùng đếm nhé!`);
      G.toast(h, `🔎 ${T('Find', 'Tìm')} ${H.n} ${H.icon}`);
    };
    world.updaters.push((dt, t) => { ic.position.y = heightAt(bx, bz) + 2.9 + Math.sin(t * 2 + bx) * .15; S.items.forEach((it, k) => { if (!it.got) it.s.position.y = it.y + Math.sin(t * 3 + k) * .12; }); });
    G.interactables.push({ id: 'huntboard_' + H.id, x: bx, z: bz, r: 3, icon: '🔎', label: () => T(`Counting hunt: find ${H.n} ${H.name()}`, `Trò đếm: tìm ${H.n} ${H.name()}`), act: h => start(h) });
  });

  // the Music Corner stall at the market
  {
    const S = rowSlot('market', 5, 1.4), { x, z } = S, y = heightAt(x, z), p = [];   // (T1b) in the market row, among the centre's stalls
    p.push(P(new THREE.BoxGeometry(2.6, .9, 1.2), '#7a4ab0', [0, .45, 0]), P(new THREE.BoxGeometry(2.8, .1, 1.4), '#f6e7c8', [0, .95, 0]));
    [[-1.25, -.55], [1.25, -.55], [-1.25, .55], [1.25, .55]].forEach(([a, b]) => p.push(P(new THREE.CylinderGeometry(.06, .06, 2.3, 6), '#8a5a3b', [a, 1.15, b])));
    for (let i = 0; i < 6; i++) p.push(P(new THREE.BoxGeometry(.5, .08, 1.7), i % 2 ? '#ffd23f' : '#a66bff', [-1.25 + i * .5, 2.35, 0], [.12, 0, 0]));
    const m = new THREE.Mesh(merge(p), toonVC()); m.position.set(x, y, z); m.rotation.y = S.face; scene.add(m); world.colliders.push({ x, z, r: 1.4 }); world.stalls.push({ id: 'musiccorner', place: 'market', kind: 'stall', x, z, w: 2.8, d: 1.4, face: S.face, tap: 'musiccorner' });
    ['🎸', '🥁', '🪵', '🎼'].forEach((e, k) => { const s = sprite(e, .7); s.position.set(x + S.ax * (-.9 + k * .6), y + 1.35, z + S.az * (-.9 + k * .6)); scene.add(s); });
    G.interactables.push({ id: 'musiccorner', x: x + S.fx * 1.45, z: z + S.fz * 1.45, r: 3, icon: '🎶', label: () => T('Music Corner: instruments from 4 countries', 'Góc Âm Nhạc: nhạc cụ 4 nước'), act: h => G.playGame(h.i, 'music', 'place') });
  }

  // ---------- the gentle rest timer ----------
  // Minutes played today are counted on this device only (never sent anywhere).
  const today = () => new Date().toDateString();
  let tick = 0, shown = false;
  world.updaters.push(dt => {
    if (!G.heroes.length || G.paused) return;
    tick += dt; if (tick < 5) return;
    const add = tick / 60; tick = 0;
    if (settings.playDay !== today()) { settings.playDay = today(); settings.playMins = 0; shown = false; }
    settings.playMins = (settings.playMins || 0) + add; saveSettings();
    const lim = +settings.restMins || 0;
    if (lim && settings.playMins >= lim && !shown) { shown = true; restTime(); }
  });
  const restTime = () => {
    G.paused = true; G.world.time = .82;
    G.heroes.forEach(h => { h.cheerT = 0; h.emoteT = 2; });
    const m = el('div', 'resttime', `<div class="rt-card"><div class="rt-moon">🌙</div><h2>${T('Time to rest!', 'Đến giờ nghỉ rồi!')}</h2><p>${T('You played so well today. Your explorer is yawning… See you tomorrow!', 'Hôm nay con chơi giỏi lắm. Nhà thám hiểm của con ngáp rồi… Hẹn gặp lại ngày mai nhé!')}</p>
      <div class="rt-zz">😴 💤</div><button class="btn grownup"><span class="ring"></span>${T('Grown-ups: hold for 10 more minutes', 'Người lớn: giữ để chơi thêm 10 phút')}</button></div>`);
    document.body.appendChild(m); SFX.chime();
    say('You played so well today! Time to rest. See you tomorrow!', 'Hôm nay con chơi giỏi lắm! Đến giờ nghỉ rồi. Hẹn gặp lại ngày mai nhé!');
    const b = m.querySelector('.grownup'), ring = b.querySelector('.ring'); let t0 = 0, raf = 0;
    const tickH = () => { const k = Math.min(1, (performance.now() - t0) / 1800); ring.style.setProperty('--p', k * 100 + '%'); if (k >= 1) { settings.restMins = String((+settings.restMins || 0) + 10); saveSettings(); shown = false; m.remove(); G.paused = false; } else raf = requestAnimationFrame(tickH); };
    b.addEventListener('pointerdown', e => { e.preventDefault(); t0 = performance.now(); tickH(); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(k => b.addEventListener(k, () => { cancelAnimationFrame(raf); ring.style.setProperty('--p', '0%'); }));
  };
  G.restNow = restTime;
}
