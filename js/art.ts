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
export { hasArt, labelArt, pic, artSVG, ART_COUNT } from './art/lookup.js';
