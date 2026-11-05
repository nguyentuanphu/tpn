// Sparkle Valley's illustrated icons for menus: drawn pictures in the game's own style (chunky shapes,
// soft dark outline) instead of phone emoji, and each one moves a little in a way that fits it: clock hands
// turn, a kite floats, a flame flickers, a puppy's tail wags, bubbles rise, a train puffs.
//   pic('🕒')  → the clock picture (or the emoji itself if there is no picture for it yet)
// The animations are CSS (css/style.css, .art .a-*), and stop when "calm mode" or reduced motion is on.
// (v1.07 split-code, 2 Nov 2026 AEDT) the drawings live in js/art/, in groups that run in this order (a later
// def() replaces an earlier one, add() only fills a gap, so the order matters); this file passes the exports on.
import './art/pad-and-games.js';
import './art/howto-tales.js';
import './art/people-food.js';
import './art/round30.js';
import './art/things-money.js';
import './art/r90-audits.js';
import './art/learning.js';
// (v1.08 companion) the companion hats after the crown and the "All hats!" picture
import './art/companion-hats.js';
export { hasArt, labelArt, pic, artSVG, ART_COUNT } from './art/lookup.js';
import './art/notify.js'; // (v1.08 notifications) the bell and the Home Screen phone
import './art/lumi.js'; // (v1.08b quality) Lumi the guide and Play with Mum and Dad
// (v1.08, PERF-001: the start-up download was 1091 KB against its 1071) the pictures and How to play guides of the v1.08
// games (science, English, Tiếng Việt, maths and money: about 80 KB) are not part of the start: they load just after it (js/main.ts),
// and the games list and the Simple screen wait for them (js/ui/hub.ts, js/simple.ts)
let morePics: Promise<unknown> | null = null, morePicsIn = false;
export const moreArt = () => morePics || (morePics = import('./art/games108.js').then(() => { morePicsIn = true; }));
export const moreArtReady = () => morePicsIn;
