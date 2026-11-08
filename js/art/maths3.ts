// (v1.08 maths) Drawings for the 21 new maths games (js/games/maths3.ts and maths4.ts): each game's own picture for
// its menu card and its How to play guide. Keys are not emoji (mx:<name>), so they only ever show through pic() / artSVG().
import { O, g, circ, dot, sparkle, star5, def, W, N } from './kit.js';

const txt = (x, y, s, t, f = '#fff') => `<text x="${x}" y="${y}" font-size="${s}" font-weight="900" fill="${f}" stroke="${O}" stroke-width="1.1" font-family="Fredoka,sans-serif">${t}</text>`;
const apple = (x, y, r = 4) => `${circ(x, y, r, '#e8433a')}<path d="M${x} ${y - r}q1-3 3-3" stroke="#3a8f3a" stroke-width="1.8" stroke-linecap="round" ${N}/>`;

// Number Bonds: a whole on top joined to its two parts
def('mx:bonds', `<path d="M24 14L13 33M24 14l11 19" ${W}/>` + circ(24, 13, 9, '#ffd23f') + txt(19.5, 18, 13, '5', '#3b2a4f') +
  g('a-bob', circ(12, 35, 8, '#5fb6ff') + txt(8, 40, 12, '2'), '12px 35px') + g('a-bob2', circ(36, 35, 8, '#ff7eb8') + txt(32, 40, 12, '3'), '36px 35px'));
// Take Away: a plate of apples, one rolling off with a minus sign
def('mx:takeaway', `<ellipse cx="20" cy="36" rx="16" ry="5" fill="#fff6e4" ${W}/>` + apple(13, 30) + apple(22, 30) + g('a-hop', apple(37, 22), '37px 26px') +
  `<path d="M30 10h10" stroke="#e8433a" stroke-width="4" stroke-linecap="round"/>`);
// Skip Counting: a kangaroo-sized hop over a number line in twos
def('mx:skip', `<path d="M4 38h40" ${W}/><path d="M8 35v6M18 35v6M28 35v6M38 35v6" ${W}/>` + txt(5, 31, 8, '2', '#3b6fe0') + txt(25, 31, 8, '6', '#3b6fe0') +
  g('a-hop', `<path d="M8 30q10-22 20 0" stroke="#ff7eb8" stroke-width="2.6" stroke-dasharray="3 3" ${N}/>` + circ(18, 12, 4.5, '#43c463') + dot(17, 11, 1.1), '18px 20px') + txt(37, 31, 8, '?', '#e8433a'));
// Patterns: red, blue, red, blue and a question tile
def('mx:patterns', circ(8, 24, 5, '#e8433a') + `<rect x="15" y="19" width="10" height="10" rx="2" fill="#3b6fe0" ${W}/>` + circ(32, 24, 5, '#e8433a') +
  g('a-pulse', `<rect x="38" y="18" width="8" height="12" rx="2" fill="#fff6e4" ${W}/>` + txt(39.5, 28, 9, '?', '#3b2a4f'), '42px 24px'));
// Shapes Hunt: a magnifying glass over a triangle among shapes
def('mx:shapehunt', circ(10, 12, 5, '#ffd23f') + `<rect x="31" y="6" width="11" height="11" rx="1.5" fill="#5fd36a" ${W}/><path d="M6 42l6-10 6 10z" fill="#ff7eb8" ${W}/>` +
  g('a-sway', `<circle cx="28" cy="28" r="9" fill="#dff4ff" ${W}/><path d="M24 31l4-7 4 7z" fill="#9a6bff" ${W}/><path d="M35 35l7 7" stroke="${O}" stroke-width="4" stroke-linecap="round"/>`, '28px 28px'));
// Symmetry: a butterfly whose two wings match across a dashed line
def('mx:symmetry', `<path d="M24 4v40" stroke="${O}" stroke-width="1.6" stroke-dasharray="3 3"/>` +
  g('a-pulse', `<path d="M23 22C14 6 4 10 6 20c1 6 8 7 17 4zM23 26c-8-2-15 2-13 9 2 6 9 4 13-5z" fill="#ff9f43" ${W}/>${circ(13, 18, 2.4, '#fff6b0')}`, '24px 24px') +
  g('a-pulse', `<path d="M25 22c9-16 19-12 17-2-1 6-8 7-17 4zM25 26c8-2 15 2 13 9-2 6-9 4-13-5z" fill="#ff9f43" ${W}/>${circ(35, 18, 2.4, '#fff6b0')}`, '24px 24px'));
// Heavier or Lighter: a balance tipped down by a heavy rock, a feather up high
def('mx:heavy', `<path d="M24 12v28M16 44h16" ${W}/><path d="M24 40l-5 4h10z" fill="#b07a4a" ${W}/>` +
  g('a-sway', `<path d="M6 14l36 6" ${W}/><path d="M6 14l-4 8h8zM42 20l-4 8h8z" fill="#ffd23f" ${W}/><ellipse cx="42" cy="25" rx="5" ry="3.4" fill="#9a8f87" ${W}/><path d="M4 18q3-5 6-2" stroke="#5fb6ff" stroke-width="2.4" ${N}/>`, '24px 17px') + circ(24, 12, 2.4, '#e8433a'));
// Full or Empty: a full glass beside an empty one
def('mx:full', `<path d="M6 10h14l-2 30H8z" fill="#e8f6ff" ${W}/><path d="M7 14h12l-1.6 25H8.6z" fill="#5fb6ff"/>` +
  `<path d="M28 10h14l-2 30H30z" fill="#e8f6ff" ${W}/>` + g('a-rise', `${circ(12, 30, 1.4, '#e6f7ff', 'stroke-width="0"')}${circ(15, 24, 1.1, '#e6f7ff', 'stroke-width="0"')}`, '13px 30px') + `<path d="M6 10h14M28 10h14" ${W}/>`);
// Pizza Fractions: a pizza in quarters with one slice lifted out
def('mx:pizza', circ(22, 26, 16, '#ffcf6b') + `<path d="M22 10v32M6 26h32" ${W}/>` + `${circ(15, 19, 2.4, '#e8433a')}${circ(14, 33, 2.4, '#e8433a')}${circ(29, 33, 2.4, '#e8433a')}` +
  g('a-hop', `<path d="M27 5a16 16 0 0 1 16 16H27z" fill="#ffcf6b" ${W}/>${circ(34, 13, 2.4, '#e8433a')}`, '35px 13px'));
// Picture Graph: three columns of counters, the tallest with a star
def('mx:graph', `<path d="M6 6v36h38" ${W} ${N}/>` + [0, 1].map(i => circ(14, 36 - i * 8, 3.4, '#e8433a')).join('') + [0, 1, 2, 3].map(i => circ(25, 36 - i * 8, 3.4, '#ffd23f')).join('') +
  [0, 1, 2].map(i => circ(36, 36 - i * 8, 3.4, '#43c463')).join('') + g('a-twinkle', sparkle(25, 6, .9), '25px 6px'));
// Calendar: a page with rings and today circled
def('mx:calendar', `<rect x="6" y="9" width="36" height="33" rx="4" fill="#fff" ${W}/><path d="M6 9h36v9H6z" fill="#e8433a" ${W}/><path d="M15 5v8M33 5v8" ${W}/>` +
  [0, 1, 2, 3].map(r => [0, 1, 2, 3, 4].map(c => dot(12 + c * 6, 23 + r * 5, 1.4, '#9a8f87')).join('')).join('') + g('a-pulse', `<circle cx="24" cy="28" r="3.6" fill="none" stroke="#3b6fe0" stroke-width="2.4"/>`, '24px 28px'));
// Quarter Past: a clock at quarter past three, the quarter shaded
def('mx:quarter', circ(24, 25, 19, '#fff6e4') + `<path d="M24 25V6a19 19 0 0 1 19 19z" fill="#bfe6ff"/>` + `<circle cx="24" cy="25" r="19" fill="none" ${W}/>` +
  [0, 1, 2, 3].map(i => { const a = i * Math.PI / 2; return `<path d="M${(24 + Math.sin(a) * 15).toFixed(1)} ${(25 - Math.cos(a) * 15).toFixed(1)}L${(24 + Math.sin(a) * 18).toFixed(1)} ${(25 - Math.cos(a) * 18).toFixed(1)}" ${W}/>`; }).join('') +
  `<path d="M24 25h8" stroke="${O}" stroke-width="3.4" stroke-linecap="round"/>` + g('a-spin', `<path d="M24 25h13" stroke="#e8433a" stroke-width="2.4" stroke-linecap="round"/>`, '24px 25px') + dot(24, 25, 2.2));
// Number Puzzle: a 3 by 3 grid with a glowing empty square
def('mx:sudoku', `<rect x="6" y="6" width="36" height="36" rx="3" fill="#fff" ${W}/><path d="M18 6v36M30 6v36M6 18h36M6 30h36" ${W}/>` +
  txt(9, 16, 10, '1', '#3b6fe0') + txt(21, 28, 10, '2', '#e8433a') + txt(33, 40, 10, '3', '#43c463') + txt(33, 16, 10, '2', '#e8433a') + txt(9, 40, 10, '3', '#43c463') +
  g('a-pulse', `<rect x="19" y="7" width="10" height="10" rx="2" fill="#fff6b0" stroke="#ffb020" stroke-width="2"/>`, '24px 12px'));
// Bigger Number Race: two little race cars with numbers, the bigger one ahead
def('mx:bigger', `<path d="M2 44h44" stroke="${O}" stroke-width="1.6" stroke-dasharray="4 3"/>` +
  g('a-push', `<path d="M14 18h18l5 6h6v7H9v-7z" fill="#e8433a" ${W}/>${circ(15, 31, 3.6, '#5b5268')}${circ(36, 31, 3.6, '#5b5268')}` + txt(20, 28, 9, '9'), '24px 26px') +
  `<path d="M4 35h14l3 4h4v4H1v-4z" fill="#5fb6ff" ${W}/>` + txt(8, 42, 6, '4'));
// Doubles: a ladybird with the same spots on both wings
def('mx:doubles', `<path d="M24 12v32" ${W}/>` + g('a-bob', `<path d="M24 12C10 12 6 24 8 32c2 8 10 12 16 12z" fill="#e8433a" ${W}/><path d="M24 12c14 0 18 12 16 20-2 8-10 12-16 12z" fill="#e8433a" ${W}/>` +
  `${dot(15, 22, 2.6)}${dot(14, 32, 2.6)}${dot(33, 22, 2.6)}${dot(34, 32, 2.6)}`, '24px 30px') + circ(24, 9, 5, O) + `${dot(22, 8, 1.1, '#fff')}${dot(26, 8, 1.1, '#fff')}`);
// Tens and Ones: a bundle of ten sticks tied with a ribbon, and three single sticks
def('mx:tens', [0, 1, 2, 3, 4].map(i => `<rect x="${6 + i * 3.4}" y="8" width="3" height="32" rx="1.2" fill="#ffcf6b" stroke="${O}" stroke-width="1.2"/>`).join('') +
  `<path d="M5 22h19" stroke="#e8433a" stroke-width="4"/>` + g('a-bob', [0, 1, 2].map(i => `<rect x="${30 + i * 5}" y="14" width="3.4" height="26" rx="1.2" fill="#ffcf6b" stroke="${O}" stroke-width="1.2"/>`).join(''), '36px 40px'));
// Missing Number: three number stones and a gap with a question mark
def('mx:missing', `<rect x="3" y="16" width="12" height="14" rx="3" fill="#a8e6a1" ${W}/><rect x="33" y="16" width="12" height="14" rx="3" fill="#a8e6a1" ${W}/>` + txt(6, 27, 10, '4', '#3b2a4f') + txt(36, 27, 10, '6', '#3b2a4f') +
  g('a-pulse', `<rect x="18" y="16" width="12" height="14" rx="3" fill="#fff6b0" stroke="#ffb020" stroke-width="2.4" stroke-dasharray="3 2"/>` + txt(21, 27, 10, '?', '#e8433a'), '24px 23px') + `<path d="M10 36q14 8 28 0" stroke="#5fb6ff" stroke-width="2.4" ${N}/>`);
// Shapes in 3D: a cube, a cone and a ball
def('mx:solids3d', `<path d="M4 22l9-5 9 5v11l-9 5-9-5z" fill="#5fb6ff" ${W}/><path d="M4 22l9 5 9-5M13 27v11" ${W} ${N}/>` +
  `<path d="M34 6l9 24H25z" fill="#ffb347" ${W}/><ellipse cx="34" cy="30" rx="9" ry="3" fill="#ffcf6b" ${W}/>` + g('a-bob', circ(30, 40, 6, '#ff7eb8') + `<path d="M26 38q4 3 8 0" stroke="#fff" stroke-width="1.4" ${N}/>`, '30px 40px'));
// Left and Right: two hands with arrows pointing apart
def('mx:leftright', `<path d="M4 24l8-7v4h8v6h-8v4z" fill="#5fb6ff" ${W}/><path d="M44 24l-8-7v4h-8v6h8v4z" fill="#ff7eb8" ${W}/>` +
  g('a-hop', star5(24, 24, 6, '#ffd23f'), '24px 24px') + txt(6, 42, 8, 'L', '#3b6fe0') + txt(37, 42, 8, 'R', '#e8433a'));
// Mental Maths Sprint: a running shoe with speed lines and a plus sign
def('mx:sprint', `<path d="M3 16h10M2 22h9M4 28h8" stroke="#ffb020" stroke-width="2.4" stroke-linecap="round" class="a-dash"/>` +
  g('a-push', `<path d="M14 30c0-8 4-14 9-14l4 6c4 2 10 3 14 6 3 2 3 6 0 7H16c-2 0-2-2-2-5z" fill="#e8433a" ${W}/><path d="M14 35h29" ${W}/><path d="M24 22l3-2M26 26l3-2" stroke="#fff" stroke-width="1.6"/>`, '28px 30px') +
  txt(30, 14, 12, '+', '#43c463'));
// Count by Grouping: three rings, each holding two counters
def('mx:grouping', [[12, 15], [36, 15], [24, 35]].map(([x, y], i) => g(i % 2 ? 'a-bob2' : 'a-bob', `<circle cx="${x}" cy="${y}" r="9" fill="#fff6e4" stroke="${O}" stroke-width="2" stroke-dasharray="3 2"/>${circ(x - 3.4, y, 3, '#5fb6ff')}${circ(x + 3.4, y, 3, '#5fb6ff')}`, `${x}px ${y}px`)).join(''));
