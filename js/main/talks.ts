// (v1.07 split, pure move from js/main.ts) NPC talks: Ông Cú, Cô Mai, Bác Ba and the children's games, Two Homes Street,
// chatting with villagers, the Games hub. js/main.ts calls installTalks where this part stood, with the names of its
// own it uses, and gets back the talks its villagers use.
import { farm } from '../state.js';
import { T } from '../i18n.js';
import { SFX } from '../audio.js';
import { fmt } from '../money.js';
import { $, dist2, wait } from '../util.js';
import { heightAt, SHRINES, WATER, HALF } from '../world.js';
import { dialog, dialogHooks, reward, openCooking, openShop } from '../ui.js';
import { openChat, personaByName, PERSONAS } from '../chat.js';
import { voiceCommand, voiceControlOn } from '../commands.js';
import { gameOpen, GAMES } from '../games/frame.js';
import { openHowTo } from '../howto.js';
import { solidCircleHit } from '../solids.js';
import { openGamesHub, openQuick } from '../ui.js';
import type { SvMain } from '../main.js';
import { SCIENCE_PLACES } from '../content/science-places.js';   // (v1.08 science)
import { areaSpot, AREA_PLACE } from '../content/gameplace.js';   // (v1.08b games) a place and a host for every game
import { gameInfo } from '../content/activities.js';
import { isOpen } from '../content/unlocks.js';
import { say } from '../voice.js';

export function installTalks(G: SvMain, D: { playGame: (i: number, id: string, source: string, shrine?: any) => Promise<any>, twoHalves: () => boolean, save: () => void, checkQuests: (h: any) => Promise<void>, hudFor: (h: { i: number }) => import('../hud.js').Hud, goAndDo: (h: any, it: any) => any, currentQuest: (p: any) => any, addMoney: (p: any, xu: number) => void, NPCS: any[] }) {
  const { playGame, twoHalves, save, checkQuests, hudFor, goAndDo, currentQuest, addMoney, NPCS } = D;
async function owlTalk(h) {
  const p = h.profile; SFX.hoot();
  if (G.lanterns && await G.lanterns.owl(h)) return; // (round R) the story's prologue, once
  if (!p.quests.owl) {
    await dialog('Ông Cú', [
      [`Hoo hoo! Good morning, ${p.name}! Welcome to Sparkle Valley.`, `Hú hú! Chào buổi sáng, ${p.name}! Chào mừng con đến Thung Lũng Lấp Lánh.`, 'Hoo hoo! Good morning, little one! Welcome to Sparkle Valley.', 'Hú hú! Chào buổi sáng con! Chào mừng con đến Thung Lũng Lấp Lánh.'],
      ['I am Ông Cú, the wisest bird in the valley. This valley is full of puzzles, friends and secrets.', 'Ông là Ông Cú, chú cú già thông thái. Thung lũng này có rất nhiều câu đố, bạn bè và bí mật.'],
      ['See that tall tower glowing orange? Climb it, and your map will light up!', 'Con thấy cái tháp cao màu cam kia không? Leo lên đó, bản đồ của con sẽ sáng lên!'],
      ['Then solve the three shrines here on the plateau, and I will give you a special present.', 'Sau đó giải ba ngôi đền trên cao nguyên này, ông sẽ tặng con một món quà đặc biệt.']
    ]);
    G.heroes.forEach(x => { x.profile.quests.owl = true; }); save(); G.heroes.forEach(x => checkQuests(x)); return;
  }
  const done3 = ['sh_pattern', 'sh_count', 'sh_letters'].every(s => p.shrines[s]);
  if (done3 && !p.glider) {
    await dialog('Ông Cú', [
      ['Hoo! You solved all three shrines. How clever you are!', 'Hú! Con giải được cả ba đền rồi. Con thông minh quá!'],
      ['Here is your present: the Leaf Glider! Jump, then press Jump again in the air to float like a leaf.', 'Quà của con đây: Cánh Lá! Nhảy lên, rồi bấm Nhảy lần nữa trên không để bay như chiếc lá.'],
      ['Glide down to Lotus Village. My friends there would love to meet you!', 'Hãy lượn xuống Làng Sen. Các bạn ở đó rất muốn gặp con!']
    ]);
    p.glider = true; save(); h.buildModel();
    await reward('🪂', T('Leaf Glider!', 'Cánh Lá!'), T('Jump, then Jump again in the air', 'Nhảy, rồi bấm Nhảy lần nữa trên không'));
    checkQuests(h); return;
  }
  const q = currentQuest(p);
  const tips = {
    tower1: ['Climb the glowing tower right next to us. Walk up to it and press the action button.', 'Leo lên cái tháp phát sáng ngay cạnh đây. Đi đến gần và bấm nút hành động nhé.'],
    plateau: ['Look for the orange shrines with the beams of light. There are three on the plateau.', 'Tìm những ngôi đền màu cam có cột sáng. Trên cao nguyên có ba ngôi đền.'],
    village: ['Lotus Village is to the east, across the river bridge. Follow the red pin on your map!', 'Làng Sen ở phía đông, qua cây cầu bắc qua sông. Đi theo cái ghim đỏ trên bản đồ nhé!']
  };
  const tip = q && tips[q.id] || ['Explore everywhere! Climb high, look under rocks, and talk to everyone.', 'Khám phá khắp nơi nhé! Leo lên cao, nhìn dưới các hòn đá, và nói chuyện với mọi người.'];
  await dialog('Ông Cú', [['Hoo hoo! ' + tip[0], 'Hú hú! ' + tip[1]]]);
  // (Round U) then one new thing about the valley, on a picture page (loaded only now)
  if (!G.keep('owlGuide')) return;   // (rollout) Studio switch 'owlGuide'
  G.tried(h, 'owlGuide');
  const was = G.paused; G.paused = true; try { await (await import('../owlguide.js')).owlLesson(p); } finally { G.paused = was; }
}
async function maiTalk(h) {
  const k = await dialog('Cô Mai', [['Xin chào! Fresh fruit and pretty hats! Would you like to buy something, or help me sell?', 'Xin chào con! Trái cây tươi và mũ xinh đây! Con muốn mua gì, hay giúp cô bán hàng?']],
    [['🛒 Buy', '🛒 Mua'], ['💰 Help sell (earn money)', '💰 Giúp bán hàng (kiếm tiền)'], ['👋 Bye', '👋 Tạm biệt']]);
  if (k === 0) openShop(G, h.i);
  if (k === 1) playGame(h.i, 'market', 'folk');
}
async function baTalk(h) {
  const k = await dialog('Bác Ba', [['Ah, a young chef! Put ingredients in my pot and see what we can cook. Try rice with mango!', 'À, đầu bếp nhí đây rồi! Cho nguyên liệu vào nồi xem mình nấu được món gì. Thử gạo với xoài xem!']],
    [['🍲 Cook', '🍲 Nấu ăn'], ['👋 Bye', '👋 Tạm biệt']]);
  if (k === 0) openCooking(G, h.i);
}
async function kidTalk(h, game, name, line) {
  const k = await dialog(name, [line], [['▶ Play!', '▶ Chơi!'], ['📺 How to play', '📺 Xem cách chơi'], ['👋 Later', '👋 Để sau']]);
  if (k === 0) playGame(h.i, game, 'folk');
  if (k === 1) { G.paused = true; openHowTo(game, { onPlay: () => { G.paused = false; playGame(h.i, game, 'folk'); }, onClose: () => { if (!gameOpen()) G.paused = false; } }); }
}
// ---------- Two Homes Street: talking to the neighbours ----------
G.kidTalk = (h, game, name, line) => kidTalk(h, game, name, line);
G.townTalk = async (h, who) => {
  if (who === 'sau') {
    const k = await dialog('Cô Tam', [['School is out! Nước mía đây! Fresh sugarcane juice, cold and sweet. A glass gives you lots of energy!', 'Tan trường rồi! Nước mía đây con! Mát lạnh, ngọt lịm. Uống một ly là khỏe re!']],
      [[`🥤 Buy a glass (${fmt(5)})`, `🥤 Mua một ly (${fmt(5)})`], ['👋 Bye', '👋 Tạm biệt']]);
    if (k !== 0) return;
    if (farm.coins < 5) { await dialog('Cô Tam', [['Not enough money? Here, this one is on me. Have a nice day!', 'Không đủ tiền hả? Thôi cô mời con ly này. Chúc con vui nhé!']]); }
    else addMoney(null, -5);
    SFX.chime(); h.bonusStamina = Math.max(h.bonusStamina || 0, 1); // one extra stamina wheel h.stamina = h.staminaMax; h.hearts = Math.max(h.hearts, h.profile.hearts);
    await reward('🥤', T('Yum! Sugarcane juice!', 'Ngon quá! Nước mía!'), T('Full of energy: you can run and climb longer.', 'Tràn đầy năng lượng: chạy và leo được lâu hơn.'));
  }
  if (who === 'tu') {
    const k = await dialog('Bác 2', [['Hello little one! We are playing cards. Want to join? We can play Snap, an Aussie game my neighbour taught me!', 'Chào con! Tụi chú đang đánh bài. Con chơi không? Mình chơi Snap, trò của Úc mà ông hàng xóm dạy chú đó!']],
      [['▶ Play Snap!', '▶ Chơi Snap!'], ['📺 How to play', '📺 Xem cách chơi'], ['👋 Later', '👋 Để sau']]);
    if (k === 0) playGame(h.i, 'snap', 'folk');
    if (k === 1) { G.paused = true; openHowTo('snap', { onPlay: () => { G.paused = false; playGame(h.i, 'snap', 'folk'); }, onClose: () => { if (!gameOpen()) G.paused = false; } }); }
  }
  if (who === 'tienlen') {
    const k = await dialog('Anh Ba', [['Hey! Con Vật and I are playing Tiến Lên, southern style. Sit down, I’ll deal you thirteen cards!', 'Ê em! Anh với Con Vật đang đánh Tiến Lên miền Nam nè. Ngồi xuống, anh chia cho em mười ba lá!']],
      [['▶ Play Tiến Lên (southern rules)', '▶ Chơi Tiến Lên miền Nam'], ['▶ Play Tiến Lên (northern rules)', '▶ Chơi Tiến Lên miền Bắc'], ['📺 How to play', '📺 Xem cách chơi'], ['👋 Later', '👋 Để sau']]);   // (Round V, owner 13 Oct: miền Bắc too)
    if (k === 0) playGame(h.i, 'tienlen', 'folk');
    if (k === 1) playGame(h.i, 'tienlenbac', 'folk');
    if (k === 2) { G.paused = true; openHowTo('tienlen', { onPlay: () => { G.paused = false; playGame(h.i, 'tienlen', 'folk'); }, onClose: () => { if (!gameOpen()) G.paused = false; } }); }
  }
  if (who === 'tuan') {
    const k = await dialog('Anh Tuấn', [['Đá cầu! We kick the shuttlecock and never let it touch the ground. Want to try?', 'Đá cầu nè! Tụi anh đá quả cầu, không để nó rơi xuống đất. Em thử không?']],
      [['▶ Play!', '▶ Chơi!'], ['📺 How to play', '📺 Xem cách chơi'], ['👋 Later', '👋 Để sau']]);
    if (k === 0) playGame(h.i, 'dacau', 'folk');
    if (k === 1) { G.paused = true; openHowTo('dacau', { onPlay: () => { G.paused = false; playGame(h.i, 'dacau', 'folk'); }, onClose: () => { if (!gameOpen()) G.paused = false; } }); }
  }
};
// ---------- chatting with villagers ----------
G.chatWith = (i, pid, firstAsk) => { if (!PERSONAS[pid] || gameOpen()) return; const was = G.paused; G.paused = true; openChat(G, i, pid, () => { G.paused = was && !!document.querySelector<HTMLElement>('.modal'); }, firstAsk); };
G.voiceCommand = i => voiceCommand(G, i); G.voiceControlOn = voiceControlOn;
dialogHooks.canChat = name => !!personaByName(name);
dialogHooks.chat = name => {
  const [pid] = personaByName(name), n = NPCS.find(x => x.id === pid) || { x: 0, z: 0 };
  const h = G.heroes.slice().sort((a, b) => dist2(a.pos.x, a.pos.z, n.x, n.z) - dist2(b.pos.x, b.pos.z, n.x, n.z))[0];
  if (h) G.chatWith(h.i, pid);
};
// ---------- the Games hub: every game, by place, playable straight away ----------
const GAME_SPOT = { music: 'musiccorner', firstwords: 'g_firstwords', tangram: 'g_tangram', snakes: 'g_snakes', rangoli: 'g_rangoli', datnieu: 'g_datnieu', kite: 'g_kite', chichi: 'g_chichi', sackrace: 'g_sackrace', cricket: 'g_cricket', parcel: 'g_parcel', words: 'g_words', snap: 'cards', tienlen: 'tienlen', tienlenbac: 'tienlen', dacau: 'dacau', mrwolf: 'npc_jack', chuyen: 'npc_mit', dragon: 'npc_bom', marbles: 'npc_ruby', skipping: 'npc_lan', oanquan: 'npc_teo', hopscotch: 'npc_ti', caro: 'npc_bong', tug: 'npc_su', market: 'npc_mai', jigsaw: 'easel', bunny: 'hutch', balloon: 'balloon', bubbles: 'bubbles',
  tower: 'blocks', order: 'order', sortout: 'bear', duckmaze: 'duckmaze', memory: 'chest', tune: 'xylo', shapes: 'theatre', oddone: 'frog' };
// (v1.08 english) the English corner's own games are found at the Fun Learning School, with Cô Tam (js/school.ts)
const LEARN_SPOT = id => /^en_/.test(id) ? 'school' : '';
// (v1.08 money) the new money games' places: Cô Mai's market for buying and selling, the family's stall for sorting and
// making amounts, and home for saving and chores
const MONEY3_SPOT = { shoppay: 'npc_mai', givechange: 'npc_mai', needsfirst: 'npc_mai', pricesort: 'npc_mai', marketday: 'npc_mai', budgetpicnic: 'npc_mai', twomoney: 'npc_mai', coinsort: 'stall', makeamount: 'stall', toysave: 'myhouse_door', chores: 'myhouse_door' };
G.gameSpot = id => G.interactables.find(it => it.id === (GAME_SPOT[id] || MONEY3_SPOT[id] || (G.GAME_SPOT || {})[id] || SCIENCE_PLACES[id] || (SHRINES.find(s => s.game === id) || {}).id || LEARN_SPOT(id))) || G.interactables.find(it => it.id === areaSpot(gameInfo(id).area)); // (v1.08b games) else its area's place
// (v1.08b games, owner's plan: "when a game opens for the first time, its host says so once as the child passes") a
// child who walks past a game's place while a game there is newly open hears its host's line once, with the game's name
// on screen. The games already open the first time this runs are counted as known (no burst of news on an old save).
let newsAt = 0, spots: Map<string, string[]> | null = null, spotsAt = 0;
G.hostNews = h => {
  const now = performance.now(); if (now - newsAt < 1000 || gameOpen() || G.paused) return; newsAt = now;
  const p = h.profile; if (!p) return;
  if (!spots || now - spotsAt > 60000) { spots = new Map(); spotsAt = now; for (const id of Object.keys(GAMES)) { const it = G.gameSpot(id); if (it) spots.set(it.id, [...(spots.get(it.id) || []), id]); } }
  const openNow = id => { const g = gameInfo(id); return !g.hidden && isOpen(p, id, 'game', g.area); };
  if (!p.hostNews) { p.hostNews = {}; for (const ids of spots.values()) for (const id of ids) if (openNow(id)) p.hostNews[id] = 1; save(); return; }
  for (const it of G.interactables) {
    const ids = spots.get(it.id); if (!ids || dist2(h.pos.x, h.pos.z, it.x, it.z) > 64) continue;
    const fresh = ids.filter(id => !p.hostNews[id] && openNow(id)); if (!fresh.length) continue;
    fresh.forEach(id => { p.hostNews[id] = 1; }); save();
    const line = (AREA_PLACE[gameInfo(fresh[0]).area] || AREA_PLACE.words).line;
    say(line[0], line[1]); hudFor(h).toast('✨ ' + T('New: ', 'Trò mới: ') + fresh.map(id => GAMES[id]?.name?.() || id).join(', '));
    return;
  }
};
G.openQuick = i => { if (twoHalves()) G.lastPlayer = i; if (G.paused) return; G.paused = true; openQuick(G, i); };
G.openGamesHub = i => { if (twoHalves()) G.lastPlayer = i; if (G.paused) return; G.paused = true; openGamesHub(G, i, () => { G.paused = false; }); };
// Games hub / map: fly straight to the friend who runs a game (or a place), then start it there
const npcLike = it => /^(npc_|g_|v_|pc_|cards$|dacau$|musiccorner$|bear$|stall$|school$)/.test(it.id || ''); // (school: Cô Tam at the school door)
// the nearest open spot to (x, z): not inside a building, tree or stall, not in water. Travelling lands there.
G.clearSpot = (x, z, pad = .9) => {
  // (reports #251/#256) inside the valley's walkable edge, as G.goodSpot: past it the child is held at the edge beside what stands there
  const W = G.world, free = (px, pz) => Math.abs(px) <= HALF - 10 && Math.abs(pz) <= HALF - 10 && heightAt(px, pz) > WATER + .3 && !(W.solidAt && (W.solidAt(px, pz) || W.solidAt(px + .6, pz) || W.solidAt(px - .6, pz) || W.solidAt(px, pz + .6) || W.solidAt(px, pz - .6))) && !solidCircleHit(W, px, pz) && !W.colliders.some(c => c.r > 0 && Math.hypot(c.x - px, c.z - pz) < c.r + pad) && !W.boxes.some(b => px > b.x0 - pad && px < b.x1 + pad && pz > b.z0 - pad && pz < b.z1 + pad);
  if (free(x, z)) return [x, z];
  for (let r = 1.5; r <= 14; r += 1.25) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (free(px, pz)) return [px, pz]; }
  return [x, z];
};
G.landBy = async (h, x, z) => { const [sx, sz] = G.clearSpot(x + 1.8, z + 1.4); await G.travel(h, sx - 4.5, sz - 1); h.yaw = Math.atan2(x - h.pos.x, z - h.pos.z); h.camYaw = h.yaw + Math.PI; };
G.meetAndPlay = async (i, id, source = 'place') => {
  const h = G.heroes[i], it = G.gameSpot(id); if (!h) return;
  if (!it) { return G.playGame(i, id, source); return; }
  if (dist2(h.pos.x, h.pos.z, it.x, it.z) > 4) await G.landBy(h, it.x, it.z);
  G.fx && G.fx(it.x, heightAt(it.x, it.z) + 2.4, it.z, '🎮'); await wait(500);
  return G.playGame(i, id, source);
};
// the villager nearest to a place on the map (within 20 m), so travelling lands you right next to them
G.npcNear = (x, z, r = 20) => G.interactables.filter(it => npcLike(it) && Number.isFinite(it.x) && dist2(it.x, it.z, x, z) < r).sort((a, b) => dist2(a.x, a.z, x, z) - dist2(b.x, b.z, x, z))[0] || null;
G.travelTo = async (h, x, z, snapToNpc = true) => { const n = snapToNpc ? G.npcNear(x, z) : null; if (n) { await G.landBy(h, n.x, n.z); hudFor(h).toast('👋 ' + n.label()); } else await G.travel(h, x, z); };
G.goToGame = (i, id) => { const h = G.heroes[i], it = G.gameSpot(id); if (!h || !it) return; (async () => { if (dist2(h.pos.x, h.pos.z, it.x, it.z) > 45) await G.travel(h, it.x - 1.5, it.z + 2); goAndDo(h, it); })(); };
  return { GAME_SPOT, baTalk, maiTalk, kidTalk, owlTalk };
}
