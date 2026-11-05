// (v1.08e crowds, owner 6 Nov 2026 AEDT, pop-up: "Models near the child") The crowds keep the code builder far away, but
// a crowd person within 25 m of a child wears one of the 14 gallery neighbours as a Blender model
// (models/villager-<role>.glb, tools/make-villagers.mts), chosen by their side of the valley (Vietnam or Australia), age
// and whether they wear a dress, an ao dai or long hair: the same soft eyes, outline and rim light as the friends. A few
// swaps every half second; far away the code person's still copy is shown; a photo face, a stand-in not built yet, a
// named villager (js/main.ts) or a child's own character is never swapped. Blocked or not arrived: the code person.
// Loaded after the start (js/main.ts), so it is never in the first download.
import { loadFriendModels, wearVillagerModel, avatarOf } from './avatar.js';
import { regionOf } from './villagertalk.js';

const NEAR2 = 25 * 25, PER_TICK = 3;
/** the gallery neighbour a crowd person looks most like */
export function crowdRole(look, height: number, x: number, z: number): string {
  const au = regionOf(x, z) === 'au', style = look.style || '', hs = look.hairStyle || '';
  const f = /aodai|dress|skirt/.test(style) || ['long', 'buns', 'ponytail', 'bun'].includes(hs);
  const grey = /^#(8a8a8a|9a9a9a|aaaaaa|b0b0b0|c0c0c0|d0d0d0|dcdcdc|e0e0e0|eeeeee)$/i.test(look.hair || '');
  const age = look.age === 'elder' || grey ? 'elder' : look.age === 'adult' || height > 1.12 ? 'adult' : 'kid';
  if (au) return age === 'elder' ? (f ? 'au-grandma' : 'au-grandpa') : age === 'adult' ? (f ? 'au-mum' : 'au-dad') : f ? 'au-girl' : 'au-boy';
  if (age === 'elder') return f ? 'vn-grandma' : 'vn-grandpa';
  if (age === 'adult') return f ? (style === 'aodai' ? 'vn-aodai' : 'vn-vendor') : /tunic|shirt/.test(style) && (x + z) % 2 > 1 ? 'vn-farmer' : 'vn-dad';
  return f ? 'vn-schoolgirl' : 'vn-schoolboy';
}
export function createCrowdModels(G) {
  const named = () => new Set((G.npcs || []).map(n => n.obj)), tried = new WeakSet();
  let t = 0;
  const tick = dt => {
    if ((t -= dt) > 0) return; t = .5;
    const skip = named(), mine = new Set(G.heroes.map(h => h.av && h.av.root));
    let swaps = 0;
    for (const o of G.scene.children) {
      if (swaps >= PER_TICK) break;
      if (!o.userData.avatar || tried.has(o) || skip.has(o) || mine.has(o) || o.userData.own) continue;
      if (!G.heroes.some(h => (h.pos.x - o.position.x) ** 2 + (h.pos.z - o.position.z) ** 2 < NEAR2)) continue;
      const A = avatarOf(o); if (!A || A.late || A.model || !A.painted) continue;
      tried.add(o); swaps++;
      const key = 'villager-' + crowdRole(A.look || {}, A.height || 1, o.position.x, o.position.z);
      loadFriendModels(key).then(ok => { if (ok && o.parent) wearVillagerModel(A, key); });
    }
  };
  G.world.updaters.push(tick);
  return { tick, roleOf: crowdRole };
}
