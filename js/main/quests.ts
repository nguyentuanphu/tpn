// (v1.07 split, pure move from js/main.ts) objective helpers and quests: the goal shown and said, where it is, when a
// quest is done, the Lotus Statue and Ông Bầu. js/main.ts calls installQuests where this part stood; Ông Cú and whether
// a child is playing are read through theOwl() and isPlaying() (main.ts's own lets, set only there).
import { T } from '../i18n.js';
import { say } from '../voice.js';
import { fmt } from '../money.js';
import { $, dist2, wait } from '../util.js';
import { heightAt, MARKET, SHRINES, TOWERS, LEAFIES, AUSSIE } from '../world.js';
import { dialog, reward, toast } from '../ui.js';
import { QUESTS } from '../data.js';
import { gameOpen } from '../games/frame.js';
import { LANDMARKS } from '../regions.js';
import { storyCheck, showQuestTale, QUEST_TALES } from '../story.js';
import type { SvMain } from '../main.js';

export function installQuests(G: SvMain, D: { world: any, save: () => void, V: any, NPCS: any[], theOwl: () => any, addMoney: (p: any, xu: number) => void, isPlaying: () => boolean, hudFor: (h: { i: number }) => import('../hud.js').Hud, goAndDo: (h: any, it: any) => any, giveSticker: (p: any) => any }) {
  const { world, save, V, NPCS, theOwl, addMoney, isPlaying, hudFor, goAndDo, giveSticker } = D;
G.objectiveIcon = h => { const q = currentQuest(h.profile); return q ? q.icon : '🏆'; };
G.sayObjective = i => { const h = G.heroes[i]; if (!h) return; const q = currentQuest(h.profile); if (!q) return; const tale = q.tale || QUEST_TALES[q.id]; if (tale) say(tale[2], tale[3]); else say(q.title(), q.title()); };
// is there water, a wall or something big on the straight way between two spots? (the last 1.5 m, by the goal, is left out)
const wayBlocked = (x0, z0, x1, z1) => { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.2); for (let k = 1; k < n - 1; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n; if (!G.goodSpot(x, z)) return true; } return false; };
// "Go" button: walk to the goal (or fly there if it is far away) and start it on arrival.
G.goToObjective = async i => {
  const h = G.heroes[i]; if (!h || G.paused) return;
  const tg = questTarget(h); if (!tg) { G.sayObjective(i); return; }
  const it = G.interactables.filter(x => !x.auto && (!x.visible || x.visible(h))).sort((a, b) => dist2(a.x, a.z, tg.x, tg.z) - dist2(b.x, b.z, tg.x, tg.z))[0];
  const near = it && dist2(it.x, it.z, tg.x, tg.z) < 6 ? it : null;
  say('Let\u2019s go!', 'Đi thôi!');
  if (dist2(h.pos.x, h.pos.z, tg.x, tg.z) > 45) { await G.travel(h, tg.x - 1.5, tg.z + 2); }
  // (tester's notes, 12 Oct) a goal across water or past a wall (by Hồ Gươm: the bridge's rail, the lake): walking
  // straight there only slid along the rail in circles, so the child lands on open ground right beside it instead
  const dest = near || tg;
  if (dist2(h.pos.x, h.pos.z, dest.x, dest.z) > 3 && wayBlocked(h.pos.x, h.pos.z, dest.x, dest.z)) await G.landBy(h, dest.x, dest.z);
  if (near) goAndDo(h, near); else h.goal = { x: tg.x, z: tg.z };
};
const GOURD_GIFTS: [number, string, number][] = [[3, 'money', 15], [6, 'money', 25], [10, 'glider', 2], [15, 'money', 40], [20, 'money', 60], [24, 'glider', 4]];
async function gourdTalk(h) {
  const p = h.profile, n = Object.keys(p.leafies).length;
  const due = GOURD_GIFTS.filter(([need]) => n >= need && !p.quests['gourd' + need]);
  if (!due.length) {
    const next = GOURD_GIFTS.find(([need]) => n < need);
    await dialog('Ông Bầu', [['Yahoo! I love Leafies, the little spirits hiding all over the valley.', 'Ố là la! Ông thích các bạn Lá Lá lắm, chúng trốn khắp thung lũng.'],
      [next ? `You found ${n}. Find ${next[0]} and I will give you a present!` : 'You found every single Leafy! You are amazing!', next ? `Con tìm được ${n} bạn rồi. Tìm đủ ${next[0]} bạn, ông sẽ tặng quà!` : 'Con tìm được tất cả các bạn Lá Lá! Con giỏi quá!'],
      ['Look under odd rocks and touch sparkles on high places!', 'Nhìn dưới những hòn đá lạ và chạm vào tia lấp lánh ở chỗ cao nhé!'],
      ...(G.secrets.hint(h) ? [['Psst… a secret: ' + G.secrets.hint(h), 'Suỵt… bí mật nhé: ' + G.secrets.hint(h)]] : [])]);
    return;
  }
  for (const [need, kind, what] of due) {
    p.quests['gourd' + need] = true;
    if (kind === 'hat') { if (!p.owned.hats.includes(what)) p.owned.hats.push(what); await reward({ flower: '🌸', bunny: '🐰', crown: '👑' }[what], T('A new hat!', 'Mũ mới!'), T('Wear it from your Backpack', 'Đội mũ trong Ba lô nhé')); }
    if (kind === 'glider') { if (!p.owned.gliders.includes(what)) p.owned.gliders.push(what); await reward('🪂', T('A new glider colour!', 'Màu cánh lượn mới!'), ''); }
    if (kind === 'money') { addMoney(p, what); await reward('💰', '+' + fmt(what), ''); }
  }
  save(); say('Thank you for finding my Leafy friends!', 'Cảm ơn con đã tìm các bạn Lá Lá của ông!');
}
async function statueTalk(h) {
  const p = h.profile;
  if (world.isNight() && !(p.secrets || {}).wish) { G.fx(world.statue.x, heightAt(world.statue.x, world.statue.z) + 8, world.statue.z, '🌠'); await G.secrets.unlock(h, 'wish'); return; }
  if (p.orbs < 4) { await dialog(T('Lotus Statue', 'Tượng Sen'), [[`Bring me 4 Sparkle Orbs from the shrines and I will make you stronger. You have ${p.orbs}.`, `Hãy mang đến 4 Ngọc Lấp Lánh từ các ngôi đền, ta sẽ giúp con mạnh hơn. Con đang có ${p.orbs} viên.`]]); return; }
  const k = await dialog(T('Lotus Statue', 'Tượng Sen'), [['Four Sparkle Orbs! What would you like?', 'Bốn Ngọc Lấp Lánh! Con muốn gì nào?']], [['❤️ One more heart', '❤️ Thêm một trái tim'], ['💚 More stamina', '💚 Thêm sức bền'], ['Not now', 'Để sau']]);
  if (k === 0 || k === 1) {
    if (k === 1 && p.staminaMax >= 3) { toast(T('Your stamina is already the biggest!', 'Sức bền đã lớn nhất rồi!')); return; }
    p.orbs -= 4; if (k === 0) { p.hearts = Math.min(12, p.hearts + 1); h.hearts = p.hearts; } else { p.staminaMax = Math.min(3, p.staminaMax + .5); h.stamina = p.staminaMax; }
    p.quests.statue = true; save();
    await reward(k === 0 ? '❤️' : '💚', k === 0 ? T('One more heart!', 'Thêm một trái tim!') : T('More stamina!', 'Thêm sức bền!'), '');
    checkQuests(h);
  }
}

// ---------- quests ----------
const questDone = (p, q) => !!p.quests[q.id] || !!(q.check && q.check(p));
// (round R) the story's step comes first; when no chapter is open, the valley's adventure list as before
// (round R, owner 9 Oct) the goal bar follows the lantern story; a side story (bà Huệ and ông Nghi's yard) shows there only
// when the child chose to follow it on the Adventures page (profile.follow), or when the story has no step open right now
const sideQuest = p => G.yard && G.yard.quest(p);
// a quest step from the main list, the lantern story or a side story (js/yard.ts): the fields each may have
type QuestStep = { id: string; icon?: string; title: () => string; at?: string; check?: (p) => boolean; story?: boolean; tale?: string[]; target?: () => { x: number; z: number } };
function currentQuest(p): QuestStep | undefined {
  if (p.follow === 'yard' && sideQuest(p)) return sideQuest(p);
  if (p.follow === 'fq' && G.friendQuests && G.friendQuests.quest(p)) return G.friendQuests.quest(p); // (v1.08d polish) the friend's quest, when followed
  return (G.lanterns && G.lanterns.quest(p)) || sideQuest(p) || QUESTS.find(q => !questDone(p, q));
}
G.sideStories = () => [...(G.yard && G.keep('story_yard') ? [G.yard.side] : []), ...(G.friendQuests ? [G.friendQuests.side] : [])]; // (v1.08d polish: the friend's quest too)
G.currentQuest = currentQuest;
function questTarget(h) {
  const p = h.profile, q = currentQuest(p); if (!q) return null;
  if (q.target) return q.target();
  const near = list => list.slice().sort((a, b) => dist2(a.x, a.z, h.pos.x, h.pos.z) - dist2(b.x, b.z, h.pos.x, h.pos.z))[0];
  switch (q.at) {
    case 'owl': return { x: theOwl().x, z: theOwl().z };
    case 'tw_plateau': return TOWERS[0];
    case 'plateauShrine': return near(SHRINES.slice(0, 3).filter(s => !p.shrines[s.id]));
    case 'village': return { x: V.x - V.r + 2, z: V.z };
    case 'mai': return NPCS.find(n => n.id === 'mai');
    case 'pot': return near(world.pots);
    case 'kids': return NPCS.find(n => n.id === 'teo');
    case 'playground': return NPCS.find(n => n.id === 'jack');
    case 'market': return { x: MARKET.x - 22, z: MARKET.z };
    case 'aussie': return { x: AUSSIE.x - 4, z: AUSSIE.z };
    case 'postcard': return near(LANDMARKS.filter(l => !(p.postcards || {})[l.id]).map(l => ({ x: l.x, z: l.z + 2 })));
    case 'buffalo': return near(world.buffalo.map(b => ({ x: b.mesh.position.x, z: b.mesh.position.z })));
    case 'leafy': return near(LEAFIES.filter(l => !p.leafies[l.id]));
    case 'statue': return p.orbs >= 4 ? world.statue : near(SHRINES.filter(s => !p.shrines[s.id] && p.discovered[s.id])) || world.statue;
    case 'tower': return near(TOWERS.filter(t => !p.towers[t.id]));
    case 'shrine': return near(SHRINES.filter(s => !p.shrines[s.id] && p.discovered[s.id])) || near(SHRINES.filter(s => !p.shrines[s.id]));
  }
  return null;
}
G.questTarget = questTarget;
G.objective = h => { const q = currentQuest(h.profile); return q ? q.title() : T('You finished the adventure! Keep exploring!', 'Con đã hoàn thành cuộc phiêu lưu! Tiếp tục khám phá nhé!'); };
G.checkQuests = h => checkQuests(h);
G.save = save; G.addCoins = xu => addMoney(null, xu); G.giveSticker = p => giveSticker(p); G.reward = reward; G.fmt = fmt;
async function checkQuests(h) {
  const p = h.profile;
  G.boxes && G.boxes.questDone(h, QUESTS.filter(q => questDone(p, q)).length); // (round S, owner plan 8 Oct) a finished quest earns a mystery box (js/boxes.js)
  // story chapters open when their quest is done (pause the world while the book is open)
  if (!G._reading) { G._reading = true; try { await storyCheck(G, h, id => questDone(p, QUESTS.find(q => q.id === id))); } finally { G._reading = false; } }
  const k = 'seen_' + (currentQuest(p) || { id: 'all' }).id;
  if (!p.quests[k]) {
    p.quests[k] = true; save();
    const q = currentQuest(p);
    // every new goal is told as a little story; "Let's go!" walks there straight away
    if (q && q.id !== 'owl') setTimeout(async () => {
      // wait until no game, book, chat or menu is open
      for (let k = 0; k < 600 && (gameOpen() || document.querySelector<HTMLElement>('.storybook, .modal, .dialog, .reward, .howto')); k++) await wait(500);
      if (currentQuest(p) !== q || !isPlaying()) return;
      const was = G.paused; G.paused = true; const go = await showQuestTale(q, p.name); G.paused = was;
      if (go) G.goToObjective(h.i); else hudFor(h)?.toast(T('New goal: ', 'Mục tiêu mới: ') + q.title());
    }, 2600);
    if (!q) celebrateAll(h);
  }
}
async function celebrateAll(h) {
  await reward('🏆', T('You are a Sparkle Valley hero!', 'Con là anh hùng Thung Lũng Lấp Lánh!'), T('Every quest done. Amazing!', 'Hoàn thành mọi nhiệm vụ. Tuyệt vời!'));
  if (!h.profile.owned.hats.includes('crown')) { h.profile.owned.hats.push('crown'); save(); }
}
  return { statueTalk, questTarget, currentQuest, gourdTalk, checkQuests };
}
