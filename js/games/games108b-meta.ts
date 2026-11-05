// (v1.08b games) How to play for the new corner games, ready before a game opens (the guide film behind the TV button
// reads these steps aloud in both languages): the steps written with each game in js/content/games108b.ts, each with
// the game's own picture first.
import { HOWTO, type HowToGuide } from '../howto-registry.js';
import { QUIZ_GAMES } from '../content/games108b.js';
for (const G of QUIZ_GAMES) {
  const guide: HowToGuide = { steps: G.how.map(([en, vi], i) => ({ pic: i === 0 ? G.icon : '👆 ✅', en, vi })) };
  if (!HOWTO[G.id] || (HOWTO[G.id].steps || []).length <= 1) HOWTO[G.id] = guide;
}
