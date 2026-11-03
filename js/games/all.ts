import './learning-meta.js';
// Keep menu metadata synchronous; fetch each implementation group only when a game opens.
import { register, GAMES } from './registry.js';
import { GAME_CATALOG, GAME_LOADERS } from './catalog.js';
const loads = new Map();
for (const group of Object.values(GAME_LOADERS)) {
  const load = () => {
    if (!loads.has(group)) loads.set(group, group.load().catch(e => { loads.delete(group); throw e; }));
    return loads.get(group);
  };
  for (const id of group.ids) {
    const def = GAME_CATALOG.find(d => d.id === id);
    if (!def) continue; // Family Quiz exists only when a grown-up supplied questions, as before.
    const lazy = async api => {
      await load();
      if (api.closed) return;
      const run = GAMES[id]?.run;
      if (!run || run === lazy) throw new Error('Game implementation unavailable: ' + id);
      return run(api);
    };
    register({ ...def, load, run: GAMES[id]?.run || lazy });
  }
}
