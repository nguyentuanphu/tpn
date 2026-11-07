// Drawings (v1.08 companion, owner's plan B, 3 Nov 2026 AEDT): the four companion hats after the golden crown, and the
// "All hats!" picture on the coin goal chip once every hat is bought. Keys are not emoji, so they only ever show
// through pic() / artSVG(). The 3D hats are js/kidplay.ts buildHat.
import { O, W, N, g, circ, dot, sparkle, star5, def } from './kit.js';

// Woolly beanie: a blue knitted dome, a white folded rim, a pink pompom that bobs
def('palhat:beanie', `<path d="M9 31c0-11 7-18 15-18s15 7 15 18z" fill="#5fb6ff" ${W}/>` +
  `<path d="M17 16v15M24 13v18M31 16v15" stroke="#3f8fd8" stroke-width="1.6" ${N}/>` +
  `<rect x="7" y="29" width="34" height="8" rx="4" fill="#ffffff" ${W}/><path d="M12 33h24" stroke="#cfe6ff" stroke-width="1.6" stroke-dasharray="2 2"/>` +
  g('a-bob', circ(24, 10, 4.5, '#ff5a7a'), '24px 10px'));

// Captain's hat: white top, navy band, black visor, a gold anchor badge that twinkles
def('palhat:captain', `<path d="M8 21c0-5 7-8 16-8s16 3 16 8l-3 5H11z" fill="#ffffff" ${W}/>` +
  `<rect x="11" y="25" width="26" height="7" rx="2" fill="#24366b" ${W}/>` +
  `<path d="M10 32h28c0 4-6 7-14 7s-14-3-14-7z" fill="#1d2233" ${W}/>` +
  g('a-twinkle', `${circ(24, 20, 4.2, '#ffd23f')}<path d="M24 17.5v5M22 21.5q2 2 4 0" stroke="${O}" stroke-width="1.3" ${N}/>`, '24px 20px'));

// Wizard hat: a tall purple cone with a floppy tip, a wide brim, yellow stars
def('palhat:wizard', `<path d="M14 36L23 6q4-2 6 3l-2 0 6 27z" fill="#7b5cd6" ${W}/>` +
  `<path d="M5 37c0-3 9-4 19-4s19 1 19 4-9 4-19 4-19-1-19-4z" fill="#6346c0" ${W}/>` +
  star5(22, 24, 3.6, '#ffd23f') + g('a-twinkle', star5(27, 15, 2.6, '#fff6b0'), '27px 15px') + dot(19, 31, 1.6, '#ffd23f'));

// Lotus crown: pink lotus petals on a green leaf ring, a gold centre bud
def('palhat:lotus', `<path d="M6 36c4-3 10-4 18-4s14 1 18 4c-4 3-10 4-18 4s-14-1-18-4z" fill="#5fa860" ${W}/>` +
  `<path d="M10 33c-1-7 2-12 6-14 2 5 1 10-1 14z" fill="#ffb3d1" ${W}/><path d="M38 33c1-7-2-12-6-14-2 5-1 10 1 14z" fill="#ffb3d1" ${W}/>` +
  `<path d="M16 33c-1-9 3-16 8-19 5 3 9 10 8 19z" fill="#ff7eb8" ${W}/><path d="M24 15v17" stroke="#e8558f" stroke-width="1.6" ${N}/>` +
  g('a-bob', circ(24, 30, 3, '#ffd23f'), '24px 30px'));

// All hats!: a small stack of the hats with a sparkle, for the coin goal chip when nothing is left to buy
def('palhat:all', `<path d="M10 40c0-6 6-10 14-10s14 4 14 10z" fill="#5fb6ff" ${W}/><rect x="8" y="38" width="32" height="6" rx="3" fill="#ffffff" ${W}/>` +
  `<path d="M14 30l3-9 4 5 3-8 3 8 4-5 3 9z" fill="#f2c230" ${W}/>` +
  `<path d="M18 21L24 4l6 17z" fill="#ff5a7a" ${W}/>` + circ(24, 4, 2.4, '#ffd23f') +
  g('a-twinkle', sparkle(38, 12, 1.1), '38px 12px') + g('a-twinkle', sparkle(9, 18, .8), '9px 18px'));
