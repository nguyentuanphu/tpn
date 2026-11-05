// (v1.08d s2au) Season 2, Australia, in the valley: loaded 2 s after the start (js/main.ts), never in the first download.
// For each region (js/content/s2au.ts) it adds, once the region's day has come (the release calendar):
//   - its pin on the Pad map (G.PLACES), so a child can fly there;
//   - the friend, the food stand, the landmark's sign and the three game stands as things to tap (G.interactables), and
//     each game's place (G.GAME_SPOT), so "Go there" and the Play hub find them;
// and, before its day, a sign saying it is coming. The 3D models (js/s2au-region.ts) are built only when a child comes
// within 110 m (PERF-001: regions load when visited). The Southern Coast Boat (js/ferry.ts) runs there from Melbourne.
import { T } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { heightAt } from './world.js';
import { anchorOf } from './content/map.js';
import { calOpen, openDate } from './content/releasecal-core.js';
import { earlyDays } from './custom.js';
import { calMoves } from './content/secondset.js';
import { S2_REGIONS, type S2Region } from './content/s2au.js';
import { dishInfo } from './data.js';
import { postcard, LANDMARKS } from './regions.js';

export const regionOpen = (R: S2Region, now = new Date()): boolean => calOpen(R.key, calMoves(), now, earlyDays());
const dayKey = () => new Date().toDateString();

export function createS2au(G) {
  const built = new Set<string>(), building = new Map<string, Promise<unknown>>(), added = new Set<string>();
  const mods: Record<string, ReturnType<typeof import('./s2au-region.js').buildRegion>> = {};
  const at = (R: S2Region, d: [number, number]) => { const a = anchorOf(R.place)!; return { x: a[0] + d[0], z: a[1] + d[1] }; };
  G.GAME_SPOT = G.GAME_SPOT || {};

  // the friend gives the region's food once on the first meeting; the stand gives one a day
  const giveFood = (h, R: S2Region, line: [string, string]) => { const p = h.profile, d = dishInfo(R.food.id); if (!p || !d) return;
    p.dishes = p.dishes || {}; p.dishes[R.food.id] = (p.dishes[R.food.id] || 0) + 1; G.toast?.(h, `+1 ${d.name()}`); say(...line); G.save?.(); };
  const s2 = (p): Record<string, unknown> => { p.s2au = p.s2au && typeof p.s2au === 'object' ? p.s2au : {}; return p.s2au; };

  function addRegion(R: S2Region) {
    if (added.has(R.id)) return; added.add(R.id);
    const a = anchorOf(R.place)!, F = R.friend, f = at(R, F.at);
    G.PLACES.push({ g: 'au', key: R.place, icon: R.pin, name: () => T(R.name[0], R.name[1]), x: f.x + 1.5, z: f.z - 2.5 });
    G.interactables.push({ id: 's2f_' + F.id, x: f.x, z: f.z, r: 2.6, icon: '💬', label: () => T('Talk to ', 'Nói chuyện với ') + F.name,
      act: async h => { const p = h.profile, S = s2(p), met = !!S['met_' + F.id]; SFX.tap();
        const lines = [F.greet, F.lines[Math.floor(Math.random() * F.lines.length)]];
        await G.dialog(F.name, lines, [['🎮 Play a game', '🎮 Chơi trò chơi'], ['👋 Bye', '👋 Tạm biệt']]).then(k => {
          if (!met) { S['met_' + F.id] = true; giveFood(h, R, R.food.give); }
          if (k === 0) { const g = R.stands[Math.floor(Math.random() * R.stands.length)][0]; say(...F.host); G.playGame(h.i, g, 'place'); } }); } });
    const fd = at(R, R.food.at);
    G.interactables.push({ id: 's2food_' + R.id, x: fd.x, z: fd.z, r: 2.4, icon: R.food.id === 'prawns' ? 'au:prawns' : R.food.id === 'crumble' ? 'au:crumble' : 'au:fishchips', label: () => T(R.food.label[0], R.food.label[1]),
      act: h => { const S = s2(h.profile); SFX.tap(); if (S['food_' + R.id] === dayKey()) { say(...R.food.again); return; } S['food_' + R.id] = dayKey(); giveFood(h, R, R.food.give); } });
    const L = R.landmark, ls = at(R, L.sign), lm = { id: L.id, icon: R.pin, cc: 'au', x: ls.x, z: ls.z, mx: a[0] + L.at[0], mz: a[1] + L.at[1], name: () => T(L.name[0], L.name[1]), fact: L.fact };
    if (!LANDMARKS.some(l => l.id === L.id)) LANDMARKS.push(lm);
    G.interactables.push({ id: 'pc_' + L.id, x: ls.x, z: ls.z, r: 3, icon: 'ℹ️', label: () => T('About: ', 'Tìm hiểu: ') + lm.name(), act: h => postcard(G, h, lm) });
    for (const [gid, dx, dz] of R.stands) { const s = at(R, [dx, dz]), id = 's2g_' + gid; G.GAME_SPOT[gid] = id;
      G.interactables.push({ id, x: s.x, z: s.z, r: 2.4, icon: '🎮', label: () => T('Play with ', 'Chơi với ') + F.name, act: h => { SFX.tap(); say(...F.host); G.playGame(h.i, gid, 'place'); } }); }
  }
  // the sign before a region's day (shown only, with the day it opens)
  const soon = new Map<string, unknown>();
  function addSoon(R: S2Region) {
    if (soon.has(R.id)) return; const s = at(R, [0, 0]), day = openDate(R.key, calMoves());
    const it = { id: 's2soon_' + R.id, x: s.x, z: s.z, r: 3, icon: R.pin, label: () => T(R.soon[0], R.soon[1]) + ' · ' + day,
      visible: () => !regionOpen(R), act: h => { SFX.tap(); G.toast?.(h, T(R.soon[0], R.soon[1]) + ' · ' + day); } };
    G.interactables.push(it); soon.set(R.id, it);
  }
  const sync = () => { for (const R of S2_REGIONS) { if (regionOpen(R)) addRegion(R); else addSoon(R); } };
  sync();

  // build a region's models when a child comes near (and its art is in)
  const build = (R: S2Region) => building.get(R.id) || (building.set(R.id, Promise.all([import('./s2au-region.js'), import('./art.js').then(a => a.moreArt())])
    .then(([M]) => { mods[R.id] = M.buildRegion(G, R, { open: () => regionOpen(R), at: (d: [number, number]) => at(R, d) }); built.add(R.id); })
    .catch(e => { building.delete(R.id); console.warn('s2au region', R.id, e); })), building.get(R.id));
  let next = 0;
  G.world.updaters.push((dt: number, t: number) => {
    if (t < next) return; next = t + 1; sync();
    for (const R of S2_REGIONS) { if (built.has(R.id) || building.has(R.id)) continue; const a = anchorOf(R.place)!;
      if ((G.heroes || []).some(h => Math.hypot(h.pos.x - a[0], h.pos.z - a[1]) < 110)) build(R); }
  });
  const api = { regions: S2_REGIONS, regionOpen, build, built, mods, sync, ground: (x: number, z: number) => heightAt(x, z) };
  G.s2au = api;
  return api;
}
