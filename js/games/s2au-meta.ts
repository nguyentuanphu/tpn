// (v1.08d s2au) How to play for the Season 2 Australia games (the guide film behind the TV button reads these steps
// aloud in both languages): the steps written with each game in js/content/s2au-games.ts, the game's picture first.
import { HOWTO, type HowToGuide } from '../howto-registry.js';
import { S2_GAMES } from '../content/s2au-games.js';
for (const G of S2_GAMES) {
  const guide: HowToGuide = { steps: G.how.map(([en, vi], i) => ({ pic: i === 0 ? G.icon : '👆 ✅', en, vi })) };
  if (!HOWTO[G.id] || (HOWTO[G.id].steps || []).length <= 1) HOWTO[G.id] = guide;
}
