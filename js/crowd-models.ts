// (v1.08e crowds, owner 6 Nov 2026 AEDT, pop-up: "Models near the child") The crowds keep the code builder far away, but
// a crowd person within 12 m of a child wears one of the 14 gallery neighbours as a Blender model
// (models/villager-<role>.glb, tools/make-villagers.mts), chosen by their side of the valley (Vietnam or Australia), age
// and whether they wear a dress, an ao dai or long hair: the same soft eyes, outline and rim light as the friends. A few
// swaps every half second; far away the code person's still copy is shown; a photo face, a stand-in not built yet, a
// named villager (js/main.ts) or a child's own character is never swapped. Blocked or not arrived: the code person.
// Loaded after the start (js/main.ts), so it is never in the first download.
import { loadFriendModels, wearVillagerModel, unwearVillagerModel, OUTLINED } from './avatar.js';
import { THREE } from './gfx.js';
import { regionOf } from './villagertalk.js';

const _p = new THREE.Vector3(), NEAR2 = 12 * 12, PER_TICK = 2, MAX_NEAR = 3, NEAR_DRAWN2 = 25 * 25; // (check perf: swapped within 12 m, at most 3 crowd models within 25 m of a child; the farthest gives way)
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
  let next = 0;
  // (by the clock, not the frame times: late in the valley's long list of updaters, it is not called every frame)
  const tick = (_dt?: number) => {
    const now = performance.now(); if (now < next) return; next = now + 500;
    const skip = named(), mine = new Set(G.heroes.map(h => h.av && h.av.root));
    let swaps = 0;
    const d2 = (A: any) => { A.root.getWorldPosition(_p); return Math.min(...G.heroes.map(h => (h.pos.x - _p.x) ** 2 + (h.pos.z - _p.z) ** 2)); };
    // the crowd models worn within 25 m of a child (every person in the valley, js/avatar.ts OUTLINED, also those inside a
    // stall or a house group: their place in the world)
    const worn = (OUTLINED as any[]).filter(A => A.model && /villager-(vn|au)-/.test(A.root.userData.villagerModel || '') && A.root.parent).map(A => ({ A, d: d2(A) })).filter(w => w.d < NEAR_DRAWN2);
    for (const A of OUTLINED as any[]) {
      if (swaps >= PER_TICK) break;
      const o = A.root; if (!o.parent || tried.has(o) || skip.has(o) || mine.has(o) || o.userData.own || A.late || A.model || !A.painted) continue;
      const d = d2(A); if (d >= NEAR2) continue;
      // (Release, 6 Nov: the one beside the child comes first) at the limit, the farthest worn one beyond 12 m gives its
      // model up; if every worn one is nearer, this person waits
      if (worn.length >= MAX_NEAR) {
        const far = worn.filter(w => w.d >= NEAR2).sort((a, b) => b.d - a.d)[0]; if (!far) break;
        unwearVillagerModel(far.A); tried.delete(far.A.root); worn.splice(worn.indexOf(far), 1);
      }
      tried.add(o); swaps++; worn.push({ A, d });
      A.root.getWorldPosition(_p); const key = 'villager-' + crowdRole(A.look || {}, A.height || 1, _p.x, _p.z);
      loadFriendModels(key).then(ok => { if (ok && o.parent) wearVillagerModel(A, key); });
    }
  };
  G.world.updaters.push(tick);
  return { tick, roleOf: crowdRole, tried };
}
