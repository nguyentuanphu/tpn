// Village games time and village singers.
// · In every village the folk-game hosts take turns putting on their game, one after another in a fixed order:
//   friends run over and play with them for a while, then there is a short break before the next game.
//   A board on a post shows what is on now and counts down to the next one. Every host game is free to play any time
//   (round S, owner plan 8 Oct: the 3-coin skip is gone). The clock is the real one, so friends playing together see
//   the same time table. The three big village festivals a day (Hội làng) are js/hoilang.js.
// · Each village also has a singer on a little round stage: tap them and they sing a Vietnamese folk song
//   (traditional songs, played on the game's own synthesiser, with the words shown in a bubble).
//   Their names are in the villager list, so the grown-ups can rename them (Grown-ups, or Sparkle Studio).
import { THREE, P, merge, toonVC } from './gfx.js';
import { T, nm, onLang, registerName } from './i18n.js';
import { say } from './voice.js';
import { SFX, Music, tone, noise, ac } from './audio.js';
import { dialog, folkGames } from './ui.js';
import { dist2 } from './util.js';
import { heightAt, roadDist, WATER, VILLAGE, TOWN, AUSSIE, MARKET, CHINA, INDIA, CITIES } from './world.js';
import { buildAvatar, nameAvatar } from './avatar.js';
import { GAMES } from './games/frame.js';

export const SLOT = 150, ON = 75; // a game every two and a half minutes; friends play it for the first 75 s
// the village children in Lotus Village and at the playground (their talk opens the game)
const KIDS = { npc_teo: 'oanquan', npc_ti: 'hopscotch', npc_bong: 'caro', npc_su: 'tug', npc_jack: 'mrwolf', npc_mit: 'chuyen', npc_bom: 'dragon', npc_ruby: 'marbles', npc_lan: 'skipping' };
const gameOf = it => KIDS[it.id] || (/^g_/.test(it.id) ? it.id.slice(2) : /^pg_/.test(it.id) ? it.id.split('_')[1] : null);
// said aloud in round numbers, so the recorded voices have every line
const soon = s => s < 60 ? ['in less than a minute', 'chưa tới một phút nữa'] : [`in about ${Math.ceil(s / 60)} minutes`, `khoảng ${Math.ceil(s / 60)} phút nữa`];
const mmss = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

// Traditional Vietnamese songs (public domain). Melodies are simple renditions, one note per beat ('.' = hold);
// each line of words is shown while its bar is sung.
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const N = s => s.trim().split(/\s+/).map(t => { if (t === '.') return 0; const m = /^([A-G])(#?)(\d)$/.exec(t); return m ? 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] ? 1 : 0) : 0; });
export const SONGS = [
  { id: 'buom', title: ['Look, the yellow butterfly', 'Kìa con bướm vàng'], from: ['a children’s song everyone in Vietnam knows', 'bài hát thiếu nhi ai ở Việt Nam cũng biết'], bpm: 120,
    bars: [['C5 D5 E5 C5', 'Kìa con bướm vàng'], ['C5 D5 E5 C5', 'Kìa con bướm vàng'], ['E5 F5 G5 .', 'Xòe đôi cánh'], ['E5 F5 G5 .', 'Xòe đôi cánh'],
      ['G5 A5 G5 F5 E5 C5', 'Tung cánh bay lên trời'], ['G5 A5 G5 F5 E5 C5', 'Tung cánh bay lên trời'], ['C5 G4 C5 .', 'Em ngồi xem'], ['C5 G4 C5 .', 'Em ngồi xem']] },
  { id: 'colla', title: ['The flying stork (Cò lả)', 'Cò lả'], from: ['a folk song from the north, about a stork over the rice fields', 'dân ca đồng bằng Bắc Bộ, về con cò bay trên đồng lúa'], bpm: 104,
    bars: [['D5 F5 G5 A5 .', 'Con cò cò bay lả'], ['A5 G5 A5 C6 A5', 'Lả bay la'], ['G5 A5 G5 F5 D5', 'Bay qua, bay qua'], ['F5 G5 A5 G5 .', 'Ruộng lúa'],
      ['A5 C6 A5 G5 F5', 'Bay về, bay về'], ['G5 F5 D5 C5 D5 .', 'Đồng xanh'], ['D5 F5 G5 A5 G5 F5 D5 .', 'Tình tính tang, tang tính tình']] },
  { id: 'trongcom', title: ['The rice drum (Trống cơm)', 'Trống cơm'], from: ['a Quan họ song from Bắc Ninh', 'bài Quan họ Bắc Ninh'], bpm: 112,
    bars: [['A4 C5 D5 C5 D5 F5', 'Tình bằng có cái trống cơm'], ['G5 F5 G5 A5 G5 .', 'Khen ai khéo vỗ'], ['F5 G5 F5 D5 C5 D5 .', 'Ố mấy bông mà nên bông'],
      ['D5 F5 G5 A5 G5 F5', 'Một bầy tang tình con nhện'], ['D5 C5 D5 F5 D5 .', 'Ố mấy giăng tơ']] },
  { id: 'bacKimThang', title: ['Bắc kim thang', 'Bắc kim thang'], from: ['a playful folk song from the south', 'đồng dao vui nhộn miền Nam'], bpm: 132,
    bars: [['G4 C5 C5 D5 E5 . E5 .', 'Bắc kim thang'], ['E5 D5 C5 D5 E5 G5 E5 .', 'Cà lang bí rợ'], ['G5 E5 G5 A5 G5 E5 D5 .', 'Cột qua kèo là kèo qua cột'],
      ['E5 D5 C5 D5 E5 . C5 .', 'Chú bìm bịp kêu'], ['D5 E5 D5 C5 A4 . C5 .', 'Kêu chú bìm bịp']] },
  { id: 'nguao', title: ['The black horse (Lý ngựa ô)', 'Lý ngựa ô'], from: ['a folk song from the south and centre, sung to the trot of a horse', 'dân ca Nam Bộ và Trung Bộ, theo nhịp vó ngựa'], bpm: 128,
    bars: [['C5 D5 F5 . G5 F5 G5 .', 'Khớp con ngựa ngựa ô'], ['C5 D5 F5 . G5 F5 G5 .', 'Khớp con ngựa ngựa ô'], ['A5 G5 A5 C6 A5 G5 F5 .', 'Ngựa ô anh khớp'], ['G5 F5 D5 C5 D5 . . .', 'Cái kiệu vàng']] },
  { id: 'bacong', title: ['Old Granny goes to market in the rain', 'Bà còng đi chợ trời mưa'], from: ['an old rhyme children chant together', 'bài đồng dao xưa trẻ con hay hát cùng nhau'], bpm: 116,
    bars: [['C5 C5 E5 E5 G5 . G5 .', 'Bà còng đi chợ trời mưa'], ['A5 G5 E5 D5 C5 . . .', 'Cái tôm cái tép đi đưa bà còng'], ['E5 E5 G5 A5 G5 . E5 .', 'Đưa bà qua quãng đường đông'], ['D5 E5 D5 C5 C5 . . .', 'Đưa bà về tận ngõ trong nhà bà']] }
];
// The singers: bird nicknames, as Vietnamese stage singers often have (Sparkle Studio can give them other names)
export const SINGERS = [
  ['Vành Khuyên', 'f', '#ff6f9a', '#1d1412', 'long'], ['Chích Bông', 'f', '#ffd23f', '#3b2618', 'buns'], ['Sáo Nâu', 'm', '#2f7ac8', '#1d1412', 'short'],
  ['Chào Mào', 'm', '#e8433a', '#1d1412', 'spiky'], ['Bói Cá', 'f', '#3cc7e8', '#1d1412', 'ponytail'], ['Én Nhỏ', 'f', '#9a6bff', '#2a1d14', 'long'],
  ['Chim Sâu', 'm', '#5bbf6a', '#3b2618', 'short'], ['Sẻ Nâu', 'm', '#c98a4a', '#1d1412', 'spiky'], ['Hoàng Anh', 'f', '#ffb52e', '#1d1412', 'buns'], ['Cu Gáy', 'm', '#7a5236', '#1d1412', 'short']
];

function boardSprite() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 200; const x = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); s.scale.set(4.2, 1.64, 1); s.renderOrder = 4;
  let last = '';
  s.draw = (title, l1, l2, on) => {
    const key = title + l1 + l2 + on; if (key === last) return; last = key; s.text = [title, l1, l2];
    x.clearRect(0, 0, 512, 200);
    x.fillStyle = on ? '#fff3c4' : '#fffdf6'; x.strokeStyle = on ? '#e8901a' : '#3b2a4f'; x.lineWidth = 8; x.beginPath(); x.roundRect(6, 6, 500, 188, 30); x.fill(); x.stroke();
    x.fillStyle = '#3b2a4f'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const fit = (t, size, y, w = 470) => { let f = size; x.font = `bold ${f}px Fredoka, "Baloo 2", sans-serif`; while (x.measureText(t).width > w && f > 16) { f -= 2; x.font = `bold ${f}px Fredoka, "Baloo 2", sans-serif`; } x.fillText(t, 256, y); };
    fit(title, 32, 44); x.fillStyle = on ? '#c0392b' : '#2f6fb8'; fit(l1, 38, 104); x.fillStyle = '#5a4a6a'; fit(l2, 28, 156);
    tex.needsUpdate = true;
  };
  return s;
}
function textTag(scene) {
  const c = document.createElement('canvas'); c.width = 320; c.height = 64; const x = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); s.scale.set(2.9, .58, 1); scene.add(s);
  s.set = text => { x.clearRect(0, 0, 320, 64); x.font = 'bold 32px Fredoka, "Baloo 2", sans-serif'; const w = Math.min(316, x.measureText(text).width + 30);
    x.fillStyle = 'rgba(120,30,90,.8)'; x.beginPath(); x.roundRect((320 - w) / 2, 6, w, 50, 25); x.fill(); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 160, 32, 300); tex.needsUpdate = true; };
  return s;
}
function lyricBubble(scene) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); s.scale.set(3.6, .9, 1); s.visible = false; s.renderOrder = 5; scene.add(s);
  s.set = text => { x.clearRect(0, 0, 512, 128); let f = 40; x.font = `bold ${f}px Fredoka, "Baloo 2", sans-serif`; while (x.measureText('♪ ' + text + ' ♪').width > 460 && f > 18) { f -= 2; x.font = `bold ${f}px Fredoka, "Baloo 2", sans-serif`; }
    const w = Math.min(500, x.measureText('♪ ' + text + ' ♪').width + 40); x.fillStyle = '#fff0fa'; x.strokeStyle = '#b0307a'; x.lineWidth = 5; x.beginPath(); x.roundRect((512 - w) / 2, 6, w, 88, 36); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(238, 92); x.lineTo(256, 122); x.lineTo(274, 92); x.fill(); x.fillStyle = '#7a1a5a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('♪ ' + text + ' ♪', 256, 52); tex.needsUpdate = true; };
  return s;
}

export function createFolkShow(G, { looks = [] } = {}) {
  const { scene, world } = G;
  // ---- the villages: folk-game hosts within 45 m of each other belong to the same one ----
  const FOLK = new Set(folkGames());
  const hosts = G.interactables.filter(it => Number.isFinite(it.x) && gameOf(it) && GAMES[gameOf(it)] && FOLK.has(gameOf(it))).map(it => ({ it, game: gameOf(it), x: it.x, z: it.z }));
  const seen = new Set(hosts.map(h => h.game)), uniq = hosts.filter(h => seen.delete(h.game)); // one host per game
  // the villages and cities, to name each games ground after the one it is in
  const box = (b, en, vi) => ({ x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2, name: () => T(en, vi) });
  const places = [{ x: VILLAGE.x, z: VILLAGE.z, name: () => T('Lotus Village', 'Làng Sen') }, box(TOWN, 'Two Homes Street', 'Phố Hai Quê'), box(AUSSIE, 'Aussie Corner', 'Góc Nước Úc'),
    box(MARKET, 'Three Regions Market', 'Chợ Ba Miền'), { x: CHINA.x, z: CHINA.z, name: () => T('China Town', 'Làng Trung Hoa') }, { x: INDIA.x, z: INDIA.z, name: () => T('India Village', 'Làng Ấn Độ') },
    ...CITIES.map(c => ({ x: c.x, z: c.z, name: () => T(c.name[0], c.name[1]) }))];
  // each host belongs to the village or city nearest to them
  const groups = [];
  for (const h of uniq) {
    const pl = places.reduce((q, p) => !q || dist2(p.x, p.z, h.x, h.z) < dist2(q.x, q.z, h.x, h.z) ? p : q, null);
    const key = pl && dist2(pl.x, pl.z, h.x, h.z) < 70 ? pl : null;
    let g = groups.find(g => key ? g.place === key : !g.place && g.hosts.some(o => dist2(o.x, o.z, h.x, h.z) < 45));
    if (!g) groups.push(g = { place: key, hosts: [] }); g.hosts.push(h);
  }
  const offRoad = (x, z, pad) => { const r = roadDist(x, z); return r.d > r.road.w / 2 + pad; };
  const spot = (x, z, pad = 1.6) => { // open ground off the roads, near (x, z)
    for (let r = 0; r <= 16; r += 1.5) for (let k = 0; k < (r ? 16 : 1); k++) {
      const a = k / 16 * Math.PI * 2, [px, pz] = G.clearSpot(x + Math.cos(a) * r, z + Math.sin(a) * r, pad);
      if (offRoad(px, pz, pad + 1) && heightAt(px, pz) > WATER + .6 && !G.interactables.some(i => Number.isFinite(i.x) && dist2(i.x, i.z, px, pz) < 3.2)) return [px, pz];
    }
    return null;
  };
  const shows = [];
  G.folkShows = shows;
  groups.forEach((g, k) => {
    g.hosts.sort((a, b) => Math.atan2(a.z - cz(g), a.x - cx(g)) - Math.atan2(b.z - cz(g), b.x - cx(g)));
    const x = cx(g), z = cz(g), where = g.place ? g.place.name : () => T('the village', 'làng');
    const at = spot(x, z); if (!at) return;
    const [bx, bz] = at, y = heightAt(bx, bz);
    // the board on a post
    const post = new THREE.Mesh(merge([P(new THREE.CylinderGeometry(.09, .11, 3.4, 6), '#7a5236', [0, 1.7, 0]), P(new THREE.CylinderGeometry(.35, .45, .25, 8), '#8a6a4a', [0, .12, 0])]), toonVC());
    post.position.set(bx, y, bz); scene.add(post); world.colliders.push({ x: bx, z: bz, r: .35 });
    const board = boardSprite(); board.position.set(bx, y + 4.1, bz); scene.add(board);
    const S = { id: 'fs' + k, x: bx, z: bz, y, hosts: g.hosts, where, board, off: 0, live: -1 };
    shows.push(S);
    G.interactables.push({ id: 'fs' + k, x: bx, z: bz, r: 2.6, icon: '🕒', bubble: '🕒', label: () => T('Games time: ', 'Giờ chơi: ') + where(), act: h => openBoard(h, S) });
  });
  function cx(g) { return g.hosts.reduce((s, h) => s + h.x, 0) / g.hosts.length; }
  function cz(g) { return g.hosts.reduce((s, h) => s + h.z, 0) / g.hosts.length; }
  // where a village is in its time table: which game, and whether it is on now
  const state = S => { const p = Date.now() / 1000 + S.off + S.x * 7.3, n = S.hosts.length, i = Math.floor(p / SLOT); const into = p - i * SLOT;
    const cur = S.hosts[((i % n) + n) % n], next = S.hosts[(((i + 1) % n) + n) % n];
    return into < ON ? { on: true, host: cur, left: ON - into, next } : { on: false, host: null, left: SLOT - into, next }; };
  G.folkState = S => state(S);
  const gname = h => GAMES[h.game].name();
  // (round S, owner plan 8 Oct) every host game is free any time: the board offers the one on now, or any of the
  // village's games straight away (the 3-coin "start it now" is gone)
  async function openBoard(h, S) {
    const st = state(S), n = S.hosts.length, order = S.hosts.map(o => gname(o)).join(' → ');
    const w = soon(st.left), line = st.on ? [`Now playing: ${gname(st.host)}! Come and join in!`, `Đang chơi: ${gname(st.host)}! Lại chơi cùng nhé!`]
      : [`Next game: ${gname(st.next)}, ${w[0]}. Every game here is free: play any of them now!`, `Trò tiếp theo: ${gname(st.next)}, ${w[1]}. Mọi trò ở đây đều miễn phí: chơi trò nào ngay cũng được!`];
    if (n > 1) { line[0] += ` Games here, in turn: ${order}.`; line[1] += ` Các trò ở đây, lần lượt: ${order}.`; }
    const games = st.on ? [st.host, ...S.hosts.filter(o => o !== st.host)] : [st.next, ...S.hosts.filter(o => o !== st.next)];
    const choices = [...games.slice(0, 4).map((o, k) => k === 0 && st.on ? ['▶ Join in now', '▶ Vào chơi ngay'] : ['▶ ' + gname(o), '▶ ' + gname(o)]), ['👋 Okay', '👋 Được rồi']];
    const k = await dialog(T('Games time', 'Giờ chơi') + ' · ' + S.where(), [line], choices);
    if (k < 0 || k >= Math.min(4, games.length)) return;
    G.playGame(h.i, games[k].game, 'folk');
  }
  G.folkStartNow = S => { const st = state(S); if (!st.on) S.off += st.left + .01; }; // for the tests (moves the board's clock; nothing is paid)

  // ---- friends who come and play the game that is on: a few children dance round the host ----
  let crew = null; const ring = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.6, 32), new THREE.MeshBasicMaterial({ color: '#ffd23f', transparent: true, opacity: .75, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);
  const makeCrew = () => (crew = (looks.length ? looks : [null]).slice(0, 3).map((lk, i) => { const A = buildAvatar(lk || { style: 'shirt', color: ['#ff7eb8', '#3cc7e8', '#ffb52e'][i], hat: 'none', back: 'none', hair: '#1d1412', hairStyle: 'short', skin: '#f6c7a5', glider: 0 }, null); A.root.visible = false; scene.add(A.root); return A; }));
  let lastDraw = -1e9, cheered = null;
  world.updaters.push((dt, t) => {
    const hs = G.heroes; if (!hs || !hs.length) return;
    const now = performance.now(), redraw = now - lastDraw > 900;
    let best = null, bd = 1e9;
    for (const S of shows) {
      const d = Math.min(...hs.map(h => dist2(h.pos.x, h.pos.z, S.x, S.z)));
      if (d < 90 && (redraw || !S.st)) { const st = state(S); S.st = st;
        S.board.draw('🎪 ' + T('Games time', 'Giờ chơi') + ' · ' + S.where(), st.on ? '▶ ' + T('Now: ', 'Đang chơi: ') + gname(st.host) : '⏳ ' + T('Next: ', 'Tiếp theo: ') + gname(st.next),
          st.on ? T(`${mmss(st.left)} left · tap the board`, `còn ${mmss(st.left)} · chạm bảng`) : T(`in ${mmss(st.left)} · free, play any time`, `sau ${mmss(st.left)} · miễn phí, chơi lúc nào cũng được`), st.on); }
      S.board.visible = d < 90;
      if (S.st && S.st.on && d < bd) { bd = d; best = S; }
    }
    if (redraw) lastDraw = now;
    // the crew plays at the nearest village whose game is on
    const S = best && bd < 60 ? best : null;
    if (!S) { if (crew) crew.forEach(A => A.root.visible = false); ring.visible = false; cheered = null; return; }
    if (!crew) makeCrew();
    const H = S.st.host, hy = heightAt(H.x, H.z);
    ring.visible = true; ring.position.set(H.x, hy + .06, H.z); ring.material.opacity = .5 + Math.sin(t * 4) * .25;
    crew.forEach((A, i) => { const a = t * .7 + i * Math.PI * 2 / 3, x = H.x + Math.cos(a) * 1.9, z = H.z + Math.sin(a) * 1.9;
      A.root.visible = true; A.root.position.set(x, heightAt(x, z), z); A.root.rotation.y = a + Math.PI; A.anim ? A.anim(i === Math.floor(t / 2) % 3 ? 'cheer' : 'dance', t + i, 0) : null; });
    const key = S.id + H.game; if (cheered !== key) { cheered = key; if (bd < 30) [523, 659, 784].forEach((f, i) => tone(f, .25, { at: i * .12, type: 'triangle', vol: .12 })); }
  });

  // ---- one singer for every village, on a little round stage beside the board ----
  const singers = [];
  shows.forEach((S, k) => {
    const [name, gender, color, hair, hs] = SINGERS[k % SINGERS.length], song = SONGS[k % SONGS.length];
    const at = spot(S.x + 5, S.z + 3, 2.4); if (!at) return;
    const [x, z] = at, y = heightAt(x, z), face = Math.atan2(S.x - x, S.z - z) + Math.PI;
    const stage = new THREE.Mesh(merge([P(new THREE.CylinderGeometry(1.5, 1.6, .3, 20), '#7a3a8a', [0, .15, 0]), P(new THREE.CylinderGeometry(1.42, 1.42, .04, 20), '#ffd23f', [0, .31, 0]),
      P(new THREE.CylinderGeometry(.03, .03, 1.3, 6), '#444', [.5, .95, .5]), P(new THREE.SphereGeometry(.08, 8, 6), '#222', [.5, 1.64, .5]), P(new THREE.CylinderGeometry(.22, .25, .05, 10), '#444', [.5, .34, .5])]), toonVC());
    stage.position.set(x, y, z); scene.add(stage); const col = { x, z, r: 1.6 }; world.colliders.push(col);
    const look = { style: gender === 'f' ? 'aodai' : 'shirt', color, hat: 'none', back: 'none', hair, hairStyle: hs, skin: '#f2c19e', glider: 0 };
    const A = nameAvatar(buildAvatar(look, null), name); A.root.position.set(x, y + .33, z); A.root.rotation.y = face; scene.add(A.root);
    registerName(name, '🎤');
    const tag = textTag(scene); tag.position.set(x, y + 2.75, z); const draw = () => tag.set('🎤 ' + T('Singer ', 'Ca sĩ ') + nm(name)); draw(); onLang(draw);
    const bub = lyricBubble(scene); bub.position.set(x, y + 3.5, z);
    const Sg = { name, song, A, x, z, y, bub, singing: false, face, parts: [stage, A.root, tag], col };
    singers.push(Sg);
    G.interactables.push({ id: 'sing' + k, x: x + Math.sin(face) * 2.2, z: z + Math.cos(face) * 2.2, r: 2.8, icon: '🎤', bubble: '🎤', label: () => T('Ask ', 'Nhờ ') + T('singer ', 'ca sĩ ') + nm(name) + T(' to sing', ' hát'), visible: () => singOn(),
      act: h => { if (G.tried) G.tried(h, 'singers'); sing(Sg); } });
  });
  G.singers = singers;
  // (batch rollout) Studio switch 'singers': off or not started yet, the stages wait (hidden) for children who never asked
  // a singer to sing
  function singOn() { return !G.keep || G.keep('singers'); }
  world.updaters.push(() => { const on = singOn(); if (singers.length && singers[0].parts[0].visible !== on) singers.forEach(Sg => { Sg.parts.forEach(o => { o.visible = on; }); Sg.col.r = on ? 1.6 : 0; }); });   // (no wall where nothing shows)
  async function sing(Sg) {
    if (Sg.singing) return; Sg.singing = true;
    const s = Sg.song, beat = 60 / s.bpm;
    const who = nm(Sg.name);
    say(`Hello! I am ${who}. Here is ${s.title[0]}, ${s.from[0]}.`, `Chào các bạn! Mình là ${who}. Mình hát bài ${s.title[1]}, ${s.from[1]} nhé.`);
    await new Promise(r => setTimeout(r, 2600));
    const prev = Music.key; Music.stop();
    const a = ac(); const t0 = a ? a.currentTime + .15 : 0;
    let t = 0; const timeline = [];
    for (const [notes, words] of s.bars) {
      timeline.push([t, words]); const ns = N(notes);
      ns.forEach((m, i) => { if (!m) return; let len = 1; while (i + len < ns.length && !ns[i + len]) len++;
        const f = 440 * Math.pow(2, (m - 69) / 12), when = t0 + t + i * beat, dur = len * beat * .95;
        tone(f, dur, { when, vol: .14, vib: 4, vibRate: 5.2, attack: .06 }); tone(f * 2, dur * .8, { when, vol: .025, attack: .08 }); tone(f / 2, beat * .4, { when, vol: .06, type: 'triangle' });
        if (i % 2 === 0) noise(.04, { when, freq: 3200, vol: .02 }); });
      t += ns.length * beat + beat * .5;
    }
    const start = performance.now(); Sg.bub.visible = true;
    await new Promise(done => {
      const step = () => { const el = (performance.now() - start) / 1000; let w = null; for (const [at, words] of timeline) if (el >= at) w = words;
        if (el > t + .4) { Sg.bub.visible = false; done(); return; }
        if (w !== Sg.bub._w) { Sg.bub._w = w; Sg.bub.set(w); }
        Sg.A.anim && Sg.A.anim('dance', el, 0); requestAnimationFrame(step); };
      step();
    });
    Sg.A.anim && Sg.A.anim('wave', 0, 0); Sg.singing = false; Sg.bub._w = null;
    if (prev) Music.play(prev);
    say('Thank you for listening!', 'Cảm ơn các bạn đã nghe!');
  }
  return { shows, singers };
}
