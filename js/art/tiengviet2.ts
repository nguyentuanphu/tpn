// Drawings (v1.08 vietnamese, owner's plan 3 Nov 2026 AEDT, docs/plans/v108-owner-batch-20261103.md part D): the icons
// of the ten new Tiếng Việt games (js/games/tiengviet2.ts), each a picture of its own. Keys that are not emoji only ever
// show through pic() / artSVG().
import { O, g, circ, dot, sparkle, def, W, N } from './kit.js';

const txt = (x: number, y: number, s: number, t: string, f = '#fff') => `<text x="${x}" y="${y}" font-size="${s}" font-weight="900" fill="${f}" stroke="${O}" stroke-width="1.1" font-family="Fredoka,sans-serif">${t}</text>`;

// One Word, Many Tones: a fish card under the letters "ca", the rising mark hopping over the a
def('vi:tonemean', `<rect x="4" y="4" width="40" height="40" rx="9" fill="#e8f6ff" ${W}/>` + txt(11, 25, 17, 'ca', '#3b6fe0') +
  g('a-hop', `<path d="M25 7l5-4" stroke="#e8433a" stroke-width="3.2" stroke-linecap="round"/>`, '27px 6px') +
  g('a-bob', `<path d="M12 36c4-6 14-6 18 0-4 6-14 6-18 0z" fill="#ff9f43" ${W}/><path d="M30 36l7-5v10z" fill="#ff9f43" ${W}/>${dot(16, 35, 1.4)}`, '22px 36px'));
// Rhyme Pairs: two word cards joined by a little rainbow, the shared rhyme in red on each
def('vi:rhyme', `<rect x="2" y="22" width="20" height="18" rx="4" fill="#fff6e4" ${W}/><rect x="26" y="22" width="20" height="18" rx="4" fill="#fff6e4" ${W}/>` +
  txt(5, 36, 11, 'm', '#3b2a4f') + txt(12, 36, 11, 'eo', '#e8433a') + txt(29, 36, 11, 'k', '#3b2a4f') + txt(35, 36, 11, 'eo', '#e8433a') +
  g('a-pulse', `<path d="M12 21c2-14 22-14 24 0" stroke="#ff7eb8" stroke-width="3.4" ${N}/><path d="M15 21c2-9 16-9 18 0" stroke="#ffd23f" stroke-width="3" ${N}/>`, '24px 16px'));
// Vietnamese Letters: a slate with ă, ơ and đ, the breve of the ă bobbing
def('vi:letters', `<rect x="3" y="6" width="42" height="34" rx="6" fill="#2f6b4f" ${W}/><path d="M14 40l-3 6M34 40l3 6" ${W} ${N}/>` +
  txt(7, 32, 17, 'a', '#fff') + g('a-hop', `<path d="M8 13q4 5 8 0" stroke="#ffd23f" stroke-width="2.6" stroke-linecap="round" ${N}/>`, '12px 13px') +
  txt(20, 32, 15, 'ơ', '#ffd23f') + txt(33, 32, 15, 'đ', '#7fd0f5'));
// Opposite Pairs: a sun and a moon on two cards, an arrow pointing both ways between them
def('vi:opposite', `<rect x="2" y="10" width="19" height="26" rx="5" fill="#fff3c4" ${W}/><rect x="27" y="10" width="19" height="26" rx="5" fill="#3a3f7a" ${W}/>` +
  g('a-pulse', circ(11.5, 23, 5.5, '#ffd23f'), '11.5px 23px') + `<path d="M11.5 13v2M11.5 31v2M3.5 23h2M17.5 23h2" stroke="#ff9f43" stroke-width="2" stroke-linecap="round"/>` +
  `<path d="M40 17a7 7 0 1 0 0 12 5.5 5.5 0 1 1 0-12z" fill="#fff6b0" ${W}/>` + g('a-twinkle', sparkle(32, 15, .7), '32px 15px') +
  `<path d="M16 42h16M19 39l-3 3 3 3M29 39l3 3-3 3" stroke="#e8433a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" ${N}/>`);
// Folk Rhymes: a little stork on a bamboo stem, singing a note
def('vi:cadao', `<path d="M8 46V8M8 20h-4M8 32h-4" stroke="#43a047" stroke-width="4" stroke-linecap="round"/><path d="M8 18q10-6 14 0M8 30q8-3 12 2" stroke="#7bc96f" stroke-width="2.6" stroke-linecap="round" ${N}/>` +
  g('a-sway', `<path d="M16 26c0-6 8-9 13-6 4 2 5 7 2 10-3 3-11 3-15-4z" fill="#fff" ${W}/>${circ(29, 17, 4, '#fff')}<path d="M32 16l9 2-9 1" fill="#ffb020" ${W}/>${dot(29.5, 16.4, 1.2)}<path d="M22 32v8M26 32v8" ${W}/>`, '24px 30px') +
  g('a-rise', `<path d="M40 6v8" stroke="${O}" stroke-width="2"/>${circ(38, 14, 2.3, O)}`, '40px 10px'));
// Picture Sayings: an unrolled scroll with a tortoise on it
def('vi:tucngu', `<rect x="6" y="9" width="36" height="30" rx="3" fill="#fff3d0" ${W}/><rect x="3" y="6" width="6" height="36" rx="3" fill="#c98a4b" ${W}/><rect x="39" y="6" width="6" height="36" rx="3" fill="#c98a4b" ${W}/>` +
  g('a-bob', `<path d="M14 30c0-8 16-8 16 0z" fill="#5fb36a" ${W}/><path d="M18 26l4-3 4 3M22 23v7" stroke="#2f6b4f" stroke-width="1.6" ${N}/>${circ(32, 28, 3, '#9ccf7a')}${dot(33, 27.4, 1)}<path d="M16 30v3M28 30v3" ${W}/>`, '22px 28px') +
  `<path d="M13 15h22" stroke="#c9a06a" stroke-width="2" stroke-linecap="round"/>`);
// Read Along: an open book, a glowing finger under the word being read
def('vi:readalong', `<path d="M24 14c-6-4-14-4-20-2v26c6-2 14-2 20 2 6-4 14-4 20-2V12c-6-2-14-2-20 2z" fill="#fffdf6" ${W}/><path d="M24 14v26" ${W}/>` +
  `<path d="M9 19h10M9 24h10M29 19h10M29 24h7" stroke="#b29cc5" stroke-width="2.2" stroke-linecap="round"/>` +
  `<rect x="28" y="27.5" width="10" height="4" rx="2" fill="#ffd23f" opacity=".85"/>` +
  g('a-push', `<path d="M33 46v-9a2 2 0 0 1 4 0v5l4 1c2 .5 2 2.5 1.6 4" fill="#ffcf9e" ${W}/>`, '35px 40px'));
// Make a Sentence: three word blocks clicking into a line, the last one dropping in
def('vi:sentence', `<path d="M3 38h42" ${W}/><rect x="3" y="24" width="12" height="12" rx="3" fill="#5fb6ff" ${W}/><rect x="17" y="24" width="12" height="12" rx="3" fill="#ffd23f" ${W}/>` +
  dot(9, 30, 2, '#fff') + dot(23, 30, 2, O) +
  g('a-hop', `<rect x="31" y="14" width="13" height="12" rx="3" fill="#ff7eb8" ${W}/>${dot(37.5, 20, 2, '#fff')}`, '37px 20px') + g('a-twinkle', sparkle(28, 9, .8), '28px 9px'));
// Listen and Spell: an ear beside a pencil writing an a with its tone mark
def('vi:dictation', `<path d="M10 22a9 9 0 0 1 18 0c0 5-4 6-5 10s-3 6-6 6" fill="#ffcf9e" ${W}/><path d="M14 22a5 5 0 0 1 10 0c0 3-3 3-3 6" ${W} ${N}/>` +
  g('a-sway', `<path d="M42 10l4 4-14 14-5 1 1-5z" fill="#ffd23f" ${W}/><path d="M40 12l4 4" ${W}/><path d="M28 24l4 4" ${W}/>`, '36px 20px') +
  txt(27, 44, 13, 'á', '#3b6fe0'));
// Folk Riddles: a speech bubble with a big question mark, a little lantern swinging from it
def('vi:riddle', `<path d="M6 8h36a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H22l-8 8v-8H6a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill="#fff6e4" ${W}/>` +
  g('a-wiggle', txt(17, 31, 22, '?', '#9a6bff'), '22px 22px') +
  g('a-sway', `<path d="M38 34v4" ${W}/><rect x="34" y="38" width="8" height="8" rx="3" fill="#e8433a" ${W}/><path d="M36 46h4" stroke="#ffd23f" stroke-width="2"/>`, '38px 34px'));
