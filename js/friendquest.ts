// (v1.08d polish) The friends' quests (data in js/content/friendquests.ts): each friend has three steps in the valley, at
// places that already stand there. A sparkle shows by the place of the step the child is on; a tap there plays its line,
// and the third step gives the friend's item (Finn's compass, Sol's sun crystal, Clara's flower staff, Lumi's star
// lantern): from then on the friend's 3D model carries it (js/friend-model.ts reads look.fitems). The quest of the friend a
// child plays as is a side story on the Adventures page; following it puts its step on the goal bar.
// Loaded after the valley is built (js/main.ts), never in the first download.
import './art/frienditems.js';
import { T } from './i18n.js';
import { FRIEND_QUESTS, questStep, hasItem, giveItem } from './content/friendquests.js';
import { friendOf } from './content/friends.js';
import { dist2 } from './util.js';

type Deps = { dialog: (who: string, lines: [string, string][], choices?: unknown) => Promise<unknown>, say: (en: string, vi: string) => void,
  reward: (big: string, line: string, sub?: string) => Promise<void>, save: () => void };
export function createFriendQuests(G, { dialog, say, reward, save }: Deps) {
  const spotOf = (id: string) => { const it = G.interactables.find(x => x.id === id); return it ? { x: it.x, z: it.z } : null; };
  // the sparkle stands beside the place (not on it), so the place's own button stays where it was
  const sparkAt = (id: string) => { const s = spotOf(id); return s ? { x: s.x + 1.6, z: s.z + 1.4 } : null; };
  const friendIn = p => (p && p.look && p.look.friend ? friendOf(p.look) : null);
  const on = () => true; // (always on: a short quest, nothing to switch off in Studio)
  const current = p => { const f = friendIn(p); if (!f) return null; const k = questStep(p, f); return k < 3 ? { f, k, q: FRIEND_QUESTS[f], s: FRIEND_QUESTS[f].steps[k] } : null; };
  let busy = false;
  async function doStep(h, f: string, k: number) {
    const p = h.profile, q = FRIEND_QUESTS[f], s = q.steps[k];
    if (busy || questStep(p, f) !== k) return; busy = true;
    try {
      const at = sparkAt(s.spot); if (at && G.fx) G.fx(at.x, (h.pos && h.pos.y || 0) + 2.2, at.z, '✨');
      await dialog(T(s.who[0], s.who[1]), [s.line]);
      p.friendQuest = Object.assign({}, p.friendQuest, { [f]: k + 1 });
      if (k + 1 >= 3) {
        giveItem(p, f); save();
        await reward(`<span class="fq-item">${(await import('./art.js')).pic(q.art)}</span>`, T(q.done[0], q.done[1]));
        say(q.done[0], q.done[1]);
        if (h.buildModel) h.buildModel(); // (the model is built again, now with the item in the hand)
        if (p.follow === 'fq') p.follow = null;
      } else save();
      G.checkQuests && G.checkQuests(h);
    } finally { busy = false; }
  }
  // one sparkle per friend and step; each shows only to a child playing as that friend who is on that step
  for (const [f, q] of Object.entries(FRIEND_QUESTS)) q.steps.forEach((s, k) => {
    G.interactables.push({ id: `fq_${f}_${k}`, get x() { const a = sparkAt(s.spot); return a ? a.x : 1e6; }, get z() { const a = sparkAt(s.spot); return a ? a.z : 1e6; }, r: 2.4, icon: '✨',
      label: () => T(s.goal[0], s.goal[1]), visible: h => on() && !busy && friendIn(h.profile) === f && questStep(h.profile, f) === k, act: h => doStep(h, f, k) });
  });
  const asQuest = c => ({ id: `FQ_${c.f}_${c.k}`, icon: '✨', story: true, title: () => T(c.s.goal[0], c.s.goal[1]), target: () => sparkAt(c.s.spot) });
  const side = {
    id: 'fq', icon: '✨',
    title: (p?) => { const f = friendIn(p || (G.heroes[0] && G.heroes[0].profile)); return f ? T(FRIEND_QUESTS[f].title[0], FRIEND_QUESTS[f].title[1]) : T('My friend’s item', 'Món đồ của bạn'); },
    status: p => { const c = current(p), f = friendIn(p); return { started: !!f, done: !!f && !c, step: c ? T(c.s.goal[0], c.s.goal[1]) : '' }; }
  };
  return {
    side, current, has: (p, f) => hasItem(p && p.look, f),
    quest: p => { if (!on()) return null; const c = current(p); return c ? asQuest(c) : null; },
    // (checks) the step's sparkle, and the nearest one to a spot
    sparkAt: (p) => { const c = current(p); return c ? sparkAt(c.s.spot) : null; }, doStep, _near: (x, z) => G.interactables.filter(i => /^fq_/.test(i.id)).sort((a, b) => dist2(a.x, a.z, x, z) - dist2(b.x, b.z, x, z))[0]
  };
}
