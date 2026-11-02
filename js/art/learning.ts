// Drawings (split from js/art.ts, v1.07): the r79 skill stickers and the Fun learning tab (Học vui).
import { O, g, circ, dot, sparkle, def, W, N } from './kit.js';
import { kid } from './round30.js';
// r79 learning (chat 2)
// (owner, 16 Oct AEDT, I4) the skill stickers for finishing Hard in each reasoning game: a gold rosette with ribbon tails
// and the skill's own little picture in the middle (Rule finder, Story sorter, Path planner, Pattern spotter, Shape
// builder, Memory keeper). Keys are not emoji, so they only ever show through pic() / artSVG().
const rosette = (fill, inner) => `<path d="M16 34l-5 11 6-2 3 5 4-12M32 34l5 11-6-2-3 5-4-12" fill="#ff6fae" ${W}/>` +
  `<path d="M24 3l4 3 5-1 2 4 5 2-1 5 3 4-3 4 1 5-5 2-2 4-5-1-4 3-4-3-5 1-2-4-5-2 1-5-3-4 3-4-1-5 5-2 2-4 5 1z" fill="#ffb020" ${W}/>` +
  circ(24, 21, 12.5, fill) + inner;
def('skill:rulefinder', rosette('#fff6e4', `${dot(17, 17, 2.4, '#ff5f7a')}${dot(23, 17, 2.4, '#ff5f7a')}${dot(17, 23, 2.4, '#ff5f7a')}` + g('a-bob', `<circle cx="25" cy="22" r="5.5" fill="#dff4ff" ${W}/><path d="M29 26l4 4" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`)));
def('skill:gardenorder', rosette('#fff6e4', `<rect x="14" y="16" width="6" height="9" rx="1.5" fill="#a8e6a1" ${W}/><rect x="21" y="14" width="6" height="11" rx="1.5" fill="#5fd3ff" ${W}/><rect x="28" y="12" width="6" height="13" rx="1.5" fill="#ff7eb8" ${W}/>` + g('a-sway', `<path d="M24 31v-5M24 28c-3 0-4-2-4-3 2 0 4 1 4 3zM24 27c2 0 4-1 4-3-2 0-4 1-4 3z" fill="#43c463" stroke="${O}" stroke-width="1.4"/>`, '24px 31px')));
def('skill:steppingpath', rosette('#a8e6a1', `${circ(16, 27, 2.6, '#ff6fae')}${circ(21, 22, 2.6, '#ff6fae')}${circ(26, 18, 2.6, '#ff6fae')}<path d="M30 10v12" ${W}/>` + g('a-sway', `<path d="M30 10l6 2.5-6 2.5z" fill="#ff5f7a" ${W}/>`, '30px 12px')));
def('skill:patternpicnic', rosette('#fff6e4', `${circ(15, 21, 3.4, '#e8433a')}${circ(22, 21, 3.4, '#ff9ed0')}${circ(29, 21, 3.4, '#e8433a')}` + g('a-twinkle', `<text x="33" y="25" font-size="9" font-weight="900" fill="${O}">?</text>`, '35px 21px')));
def('skill:shapebuilders', rosette('#dff4ff', `<path d="M24 11l7 7H17z" fill="#ff7a3a" ${W}/><rect x="18" y="18" width="12" height="10" fill="#ffd23f" ${W}/>` + g('a-bob', circ(24, 23, 2.6, '#5fb6ff'))));
def('skill:remembergarden', rosette('#fff6e4', `<rect x="15" y="13" width="18" height="15" rx="2.5" fill="#dff4ff" ${W}/><path d="M24 26v-5" stroke="#43c463" stroke-width="2"/>${circ(24, 19, 3.2, '#ff6fae')}` + g('a-twinkle', sparkle(33, 13, .8), '33px 13px')));

// (Học vui, owner's plan 1 Nov 2026 AEDT, docs/learn-tab/PLAN.md) the Fun learning tab, its four corners, the six science
// experiments, the two Tiếng Việt games and the pictures they ask about: each one its own drawing. Keys that are not
// emoji only ever show through pic() / artSVG().
const board = (fill, inner) => `<rect x="6" y="9" width="36" height="27" rx="5" fill="${fill}" ${W}/><path d="M16 36l-4 8M32 36l4 8" ${W} ${N}/>` + inner;
const txt = (x, y, s, t, f = '#fff') => `<text x="${x}" y="${y}" font-size="${s}" font-weight="900" fill="${f}" stroke="${O}" stroke-width="1.1" font-family="Fredoka,sans-serif">${t}</text>`;
def('hv:tab', `<path d="M24 20c-5-4-12-4-18-2v22c6-2 13-2 18 2 5-4 12-4 18-2V18c-6-2-13-2-18 2z" fill="#fff3d0" ${W}/><path d="M24 20v22" ${W}/><path d="M10 25h9M10 30h8M29 25h9M29 30h8" stroke="#c9a05a" stroke-width="2" stroke-linecap="round"/>` + g('a-bob', `<path d="M24 4a7 7 0 0 0-4 12.6V19h8v-2.4A7 7 0 0 0 24 4z" fill="#ffd23f" ${W}/><path d="M21 19h6" ${W}/>`, '24px 19px') + g('a-twinkle', sparkle(37, 8, .9), '37px 8px') + g('a-twinkle2', sparkle(11, 9, .7, '#c8f0ff'), '11px 9px'));
def('hv:vi', board('#e8433a', g('a-hop', txt(11, 31, 18, 'Ă', '#ffd23f'), '17px 31px') + g('a-hop2', txt(25, 31, 18, 'ê', '#fff'), '30px 31px')));
def('hv:en', board('#3b6fe0', g('a-hop', txt(11, 31, 18, 'A', '#fff'), '17px 31px') + g('a-hop2', txt(26, 31, 18, 'b', '#ffd23f'), '30px 31px')));
def('hv:math', board('#43c463', txt(9, 30, 15, '1', '#fff') + g('a-pulse', txt(18, 30, 15, '+', '#ffd23f'), '22px 25px') + txt(28, 30, 15, '2', '#fff')));
def('hv:sci', `<path d="M19 6h10M20 6v12L9 37c-2 4 0 6 4 6h22c4 0 6-2 4-6L28 18V6" fill="#e8f6ff" ${W}/><path d="M13 31h22l4 6c1 3 0 6-4 6H13c-4 0-5-3-4-6z" fill="#5fd36a" ${W}/>` + g('a-rise', `${circ(20, 27, 2, '#c8f7c0')}${circ(27, 23, 1.6, '#c8f7c0')}${circ(24, 18, 1.3, '#c8f7c0')}`, '24px 30px'));
// the six experiments
const water = (y = 28) => `<path d="M6 ${y}h36v10a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6z" fill="#7fd0f5" ${W}/><path d="M10 ${y + 4}q4-2 8 0t8 0 8 0" stroke="#e6f7ff" stroke-width="2" ${N}/>`;
def('sci:float', `<path d="M4 20h40v18a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z" fill="#fff8e6" ${W}/>` + water(26) + g('a-bob', `<path d="M15 26c0-5 9-5 9 0z" fill="#ffd23f" ${W}/>${circ(23, 20, 4, '#ffd23f')}<path d="M26 20l4 1-4 1" fill="#ff9f43" ${W}/>${dot(23, 19, 1.2)}`, '20px 26px') + `<ellipse cx="33" cy="39" rx="5" ry="3.4" fill="#9a8f87" ${W}/>`);
def('🧲 sci:magnet', g('a-wiggle', `<path d="M10 8h10v16a4 4 0 0 0 8 0V8h10v16a14 14 0 0 1-28 0z" fill="#e8433a" ${W}/><path d="M10 8h10v7H10zM28 8h10v7H28z" fill="#e6e6ef" ${W}/>`, '24px 30px') + g('a-twinkle', sparkle(42, 34, .8), '42px 34px'));
def('sci:ramp', `<path d="M4 42L30 16v26z" fill="#ffb347" ${W}/><path d="M30 42h14" ${W}/>` + g('a-roll', `${circ(16, 25, 5, '#5fb6ff')}<path d="M14 23l4 4" stroke="#fff" stroke-width="1.6"/>`, '16px 25px') + `<path d="M34 34h8M36 38h6" stroke="#ff7eb8" stroke-width="2.4" stroke-linecap="round" class="a-dash"/>`);
def('sci:seesaw', `<path d="M24 30l-6 12h12z" fill="#b07a4a" ${W}/>` + g('a-sway', `<rect x="4" y="25" width="40" height="5" rx="2.5" fill="#ffd23f" ${W} transform="rotate(-14 24 28)"/>${circ(9, 23, 5, '#ff7eb8')}${circ(38, 14, 7, '#9a8cff')}`, '24px 28px'));
def('sci:shadow', `<path d="M2 40h44" ${W}/><path d="M24 40l18-2v4z" fill="#5b5268" opacity=".75"/><rect x="20" y="26" width="8" height="14" rx="3" fill="#ffb347" ${W}/>${circ(24, 22, 5, '#ffb347')}<path d="M6 6l6 6M10 3v5M3 10h5" stroke="#ffd23f" stroke-width="2.4" stroke-linecap="round"/>` + g('a-pulse', circ(9, 9, 4, '#fff6b0'), '9px 9px'));
const bottle = (x, lv, f) => `<path d="M${x + 3} 8h6v6l3 4v24a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V18l3-4z" fill="#e8f6ff" ${W}/><path d="M${x + 1.3} ${44 - lv}h9.4v${lv - 2}a2 2 0 0 1-2 2h-5.4a2 2 0 0 1-2-2z" fill="${f}"/>`;
def('sci:sound', bottle(2, 8, '#5fb6ff') + bottle(16, 16, '#5fd36a') + bottle(30, 24, '#ff7eb8') + g('a-rise', `<path d="M40 6v8" stroke="${O}" stroke-width="2"/>${circ(38, 14, 2.4, O)}`, '40px 12px'));
// the two Tiếng Việt games
def('vi:tones', `<rect x="5" y="10" width="38" height="32" rx="8" fill="#fff6e4" ${W}/>` + txt(14, 36, 22, 'a', '#e8433a') + g('a-hop', `<path d="M24 8l5-5" stroke="#3b6fe0" stroke-width="3.4" stroke-linecap="round"/>`, '26px 6px') + g('a-hop2', `<path d="M33 14l4 4" stroke="#43c463" stroke-width="3.2" stroke-linecap="round"/>`, '35px 16px') + dot(20, 45, 2.2, '#ff7eb8'));
def('vi:build', `<rect x="3" y="18" width="13" height="16" rx="3" fill="#5fb6ff" ${W}/><rect x="17.5" y="18" width="13" height="16" rx="3" fill="#ffd23f" ${W}/><rect x="32" y="18" width="13" height="16" rx="3" fill="#ff7eb8" ${W}/>` + txt(6, 31, 13, 'c') + txt(20.5, 31, 13, 'a', '#3b6fe0') + g('a-hop', `<path d="M36 25l5-5" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/><path d="M36 25l5-5" stroke="${O}" stroke-width="1.4" stroke-linecap="round"/>`, '38px 22px') + g('a-twinkle', sparkle(24, 9, .9), '24px 9px'));
// what the child guesses
def('sci:floats', water(24) + `<path d="M24 4v12M19 9l5-5 5 5" stroke="#43c463" stroke-width="3" stroke-linecap="round" ${N}/>` + g('a-bob', circ(24, 24, 6, '#ffb347'), '24px 24px'));
def('sci:sinks', water(14) + `<path d="M6 14v24M42 14v24" ${W}/><path d="M24 18v8M19 21l5 5 5-5" stroke="#e8433a" stroke-width="3" stroke-linecap="round" ${N}/>` + g('a-bob', circ(24, 36, 6, '#9a8f87'), '24px 36px'));
def('sci:pulls', `<path d="M4 14h8v10a3 3 0 0 0 6 0V14h8v10a11 11 0 0 1-22 0z" fill="#e8433a" ${W} transform="rotate(-90 15 24)"/>` + g('a-push', `<path d="M30 21h12M30 27h12" stroke="#c9ced8" stroke-width="3" stroke-linecap="round"/><path d="M28 21a3 3 0 0 0 0 6" stroke="#c9ced8" stroke-width="3" ${N}/>`, '36px 24px') + `<path d="M30 12l3 3M30 36l3-3" stroke="#ffd23f" stroke-width="2.4" stroke-linecap="round"/>`);
def('sci:nopull', `<path d="M4 14h8v10a3 3 0 0 0 6 0V14h8v10a11 11 0 0 1-22 0z" fill="#e8433a" ${W} transform="rotate(-90 15 24)"/><path d="M36 30c-4-1-6-7 0-10 6 3 4 9 0 10z" fill="#43c463" ${W}/><path d="M36 30v6" ${W}/><path d="M25 18l6 12M31 18l-6 12" stroke="#9a8f87" stroke-width="2.6" stroke-linecap="round"/>`);
const plank = (rot, kid) => `<path d="M24 34l-5 9h10z" fill="#b07a4a" ${W}/><g transform="rotate(${rot} 24 32)"><rect x="3" y="29" width="42" height="5" rx="2.5" fill="#ffd23f" ${W}/>${circ(7, 22, 6.5, '#9a8cff')}${kid}</g>`;
def('sci:near', plank(0, circ(29, 25, 4, '#ff7eb8')) + `<path d="M29 14v5M26.5 17l2.5 2.5 2.5-2.5" stroke="#43c463" stroke-width="2.4" stroke-linecap="round" ${N}/>`);
def('sci:far', plank(0, circ(41, 25, 4, '#ff7eb8')) + `<path d="M41 14v5M38.5 17l2.5 2.5 2.5-2.5" stroke="#43c463" stroke-width="2.4" stroke-linecap="round" ${N}/>`);
def('sci:longer', `<path d="M3 38h42" ${W}/><path d="M17 38h27v4H17z" fill="#5b5268" opacity=".8"/><rect x="11" y="22" width="6" height="16" rx="2" fill="#ffb347" ${W}/><path d="M22 30h16M34 27l4 3-4 3" stroke="#43c463" stroke-width="2.6" stroke-linecap="round" ${N}/>`);
def('sci:shorter', `<path d="M3 38h42" ${W}/><path d="M17 38h8v4h-8z" fill="#5b5268" opacity=".8"/><rect x="11" y="22" width="6" height="16" rx="2" fill="#ffb347" ${W}/><path d="M38 30H26M30 27l-4 3 4 3" stroke="#e8433a" stroke-width="2.6" stroke-linecap="round" ${N}/>`);
// the voice's path for each of the six Vietnamese tones (level, rising, falling, dipping, broken, heavy)
const tone = (d, f = '#3b6fe0') => `<rect x="4" y="6" width="40" height="36" rx="8" fill="#fff6e4" ${W}/><path d="${d}" stroke="${f}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" ${N}/>`;
def('tone:0', tone('M10 24h28'));
def('tone:1', tone('M10 34L38 14', '#e8433a'));
def('tone:2', tone('M10 16L38 34', '#43c463'));
def('tone:3', tone('M10 18q10 18 18 10t10-12', '#9a6bff'));
def('tone:4', tone('M10 26l9-6 3 8 16-16', '#ff9f43'));
def('tone:5', tone('M12 22l12 10', '#5b5268') + `<circle cx="30" cy="34" r="3" fill="#5b5268"/>`);
// objects the experiments test (none of these had a drawing)
def('📎', g('a-sway', `<path d="M18 40V14a6 6 0 0 1 12 0v22a3 3 0 0 1-6 0V16" stroke="${O}" stroke-width="6.4" stroke-linecap="round" ${N}/><path d="M18 40V14a6 6 0 0 1 12 0v22a3 3 0 0 1-6 0V16" stroke="#c9ced8" stroke-width="3" stroke-linecap="round" ${N}/>`, '24px 40px'));
def('🔩', `<path d="M14 8h20l3 7H11z" fill="#9aa3b5" ${W}/><rect x="20" y="15" width="8" height="27" rx="2" fill="#c9ced8" ${W}/><path d="M20 21l8-2M20 27l8-2M20 33l8-2M20 39l8-2" stroke="${O}" stroke-width="1.6"/>`);
def('🧽', g('a-bob', `<rect x="7" y="14" width="34" height="22" rx="6" fill="#ffd23f" ${W}/><rect x="7" y="29" width="34" height="7" rx="3" fill="#43c463" ${W}/>${circ(15, 20, 1.8, '#e0a800', 'stroke-width="0"')}${circ(24, 23, 2.2, '#e0a800', 'stroke-width="0"')}${circ(33, 19, 1.6, '#e0a800', 'stroke-width="0"')}`, '24px 36px'));
def('🧷', g('a-sway', `<path d="M12 36l20-22a5 5 0 1 1 6 6L16 40" stroke="${O}" stroke-width="6" stroke-linecap="round" ${N}/><path d="M12 36l20-22a5 5 0 1 1 6 6L16 40" stroke="#c9ced8" stroke-width="2.6" stroke-linecap="round" ${N}/>${circ(10, 39, 4, '#c9ced8')}<path d="M30 12l6-4 4 4-4 6z" fill="#ffd23f" ${W}/>`, '12px 38px'));
