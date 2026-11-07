// Drawings (v1.08 english, owner's plan 3 Nov 2026 AEDT, part C): the English corner's own games, their English mode
// badge, and the pictures the games ask about that had no drawing yet (colour pots, shapes in every colour, counting
// cards and a xylophone). Keys that are not emoji only ever show through pic() / artSVG().
import { O, g, circ, dot, sparkle, star5, def, W, N, eyes, smile } from './kit.js';
const txt = (x: number, y: number, s: number, t: string, f = '#fff') => `<text x="${x}" y="${y}" font-size="${s}" font-weight="900" fill="${f}" stroke="${O}" stroke-width="1.1" font-family="Fredoka,sans-serif">${t}</text>`;
const bubble = (fill: string, inner: string) => `<path d="M6 8h36a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H22l-9 8v-8H6a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill="${fill}" ${W}/>` + inner;

// the badge: a little speech bubble with "EN" and a star
def('en:mode', bubble('#3b6fe0', txt(9, 27, 15, 'EN')) + g('a-twinkle', sparkle(40, 9, .9), '40px 9px'));
// Picture Words: a card with a cat and the word under it
def('en:words', `<rect x="6" y="4" width="36" height="40" rx="6" fill="#fff6e4" ${W}/>` + g('a-bob', `${circ(24, 19, 9, '#ffb347')}<path d="M16 13l2-7 5 5M32 13l-2-7-5 5" fill="#ffb347" ${W}/>${eyes(20.5, 27.5, 18, 1.5)}${smile(24, 22, 4)}`, '24px 20px') + `<rect x="11" y="32" width="26" height="8" rx="3" fill="#3b6fe0" ${W}/><path d="M15 36h18" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`);
// Listen and Choose: an ear and three cards
def('en:listen', `<path d="M14 6c-7 0-10 6-10 11 0 4 2 6 4 8s2 5 2 7c0 4 6 5 8 1" fill="#ffd6b8" ${W}/><path d="M10 16c0-4 6-5 7-1" ${W} ${N}/>` + g('a-pulse', `<path d="M21 12q3 4 0 8M25 9q5 7 0 14" stroke="#3b6fe0" stroke-width="2.6" stroke-linecap="round" ${N}/>`, '23px 16px') + `<rect x="22" y="28" width="7" height="12" rx="2" fill="#ff7eb8" ${W}/><rect x="31" y="28" width="7" height="12" rx="2" fill="#43c463" ${W}/><rect x="40" y="28" width="6" height="12" rx="2" fill="#ffd23f" ${W}/>` + `<path d="M34.5 22v4" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/>`);
// Say and Match: a smiling mouth saying a word to a picture card
def('en:say', bubble('#fff', txt(8, 27, 12, 'dog', '#3b6fe0')) + g('a-hop', `<rect x="30" y="30" width="15" height="15" rx="3" fill="#ffe3a3" ${W}/>${circ(37.5, 37.5, 4, '#b07a4a')}${dot(36, 37, 1)}${dot(39, 37, 1)}`, '37px 40px'));
// ABC Song: three letter blocks and a note
def('en:abc', `<rect x="3" y="24" width="13" height="16" rx="3" fill="#e8433a" ${W}/><rect x="17.5" y="20" width="13" height="16" rx="3" fill="#ffd23f" ${W}/><rect x="32" y="24" width="13" height="16" rx="3" fill="#43c463" ${W}/>` + txt(5.5, 37, 13, 'A') + txt(20.5, 33, 13, 'B', '#3b6fe0') + txt(34.5, 37, 13, 'C') + g('a-hop', `<path d="M30 4v10" stroke="${O}" stroke-width="2.4"/>${circ(27.5, 14.5, 3, O)}<path d="M30 4l6 2v4l-6-2" fill="#8a5cf6" ${W}/>`, '30px 12px'));
// Counting Song: 1 2 3 on blocks with a duck
def('en:count', txt(4, 22, 15, '1', '#ff7eb8') + txt(17, 22, 15, '2', '#3b6fe0') + txt(30, 22, 15, '3', '#43c463') + g('a-bob', `<path d="M10 36c0-6 12-6 14-2 4 0 6 2 6 5-3 4-17 5-20-3z" fill="#ffd23f" ${W}/>${circ(28, 30, 4.4, '#ffd23f')}<path d="M32 30l4 1-4 1.4" fill="#ff9f43" ${W}/>${dot(28.5, 29, 1.1)}`, '22px 36px') + g('a-hop2', `<path d="M40 26v9" stroke="${O}" stroke-width="2.2"/>${circ(38, 35, 2.4, O)}`, '40px 32px'));
// First Sentences: three word cards in a row with a full stop
def('en:sentence', `<rect x="3" y="18" width="10" height="12" rx="2.5" fill="#ff7eb8" ${W}/><rect x="15" y="18" width="12" height="12" rx="2.5" fill="#ffd23f" ${W}/><rect x="29" y="18" width="12" height="12" rx="2.5" fill="#5fb6ff" ${W}/>` + txt(6, 28, 10, 'I') + txt(16.5, 27.5, 8, 'see', '#3b2a4f') + dot(44.5, 29, 2) + g('a-hop', `<path d="M8 36q16 8 32 0" stroke="#43c463" stroke-width="2.6" stroke-linecap="round" ${N}/><path d="M37 33l3 3-4 1" stroke="#43c463" stroke-width="2.6" stroke-linecap="round" ${N}/>`, '24px 38px'));
// Greetings: a waving hand beside a "Hi!" bubble
def('en:greet', bubble('#ffe9a8', txt(10, 27, 15, 'Hi!', '#e8433a')) + g('a-wave', `<path d="M34 46c-5 0-8-4-8-9v-8a2 2 0 0 1 4 0v4-10a2 2 0 0 1 4 0v8-10a2 2 0 0 1 4 0v10-8a2 2 0 0 1 4 0v14c0 5-3 9-8 9z" fill="#ffd6b8" ${W}/>`, '36px 44px'));
// Colours and Shapes: a red circle, a blue square and a yellow triangle
def('en:colshape', g('a-bob', circ(13, 15, 9, '#e8433a'), '13px 15px') + `<rect x="27" y="7" width="16" height="16" rx="2" fill="#3b6fe0" ${W}/>` + g('a-hop', `<path d="M24 26l12 18H12z" fill="#ffd23f" ${W}/>`, '24px 40px'));

// a pot of paint in each colour (Picture Words: colours)
const SWATCH: Record<string, string> = { red: '#e8433a', blue: '#3b6fe0', yellow: '#ffd23f', green: '#43c463', orange: '#ff9f43', purple: '#8a5cf6', pink: '#ff7eb8', brown: '#9a6a3a', black: '#2b2233', white: '#ffffff' };
for (const [k, c] of Object.entries(SWATCH)) def('en:col:' + k, `<path d="M9 20h30v18a6 6 0 0 1-6 6H15a6 6 0 0 1-6-6z" fill="#e8f0f8" ${W}/><path d="M9 20c4-4 8 2 12-1s7-5 9-1 6 0 9 2v6H9z" fill="${c}" ${W}/>` + g('a-drop', `<path d="M14 26q2 6 0 8q-2-2 0-8z" fill="${c}" ${W}/>`, '14px 30px') + `<path d="M30 4l4 14" stroke="#b07a4a" stroke-width="4" stroke-linecap="round"/><path d="M32 16l3 6-6 1z" fill="${c}" ${W}/>`);
// the shapes, in every colour (Colours and Shapes): en:sh:<shape>:<colour>
const SHAPE_PATH: Record<string, (c: string) => string> = {
  circle: c => circ(24, 24, 17, c),
  square: c => `<rect x="8" y="8" width="32" height="32" rx="3" fill="${c}" ${W}/>`,
  triangle: c => `<path d="M24 6l19 34H5z" fill="${c}" ${W}/>`,
  star: c => star5(24, 25, 19, c),
  heart: c => `<path d="M24 42C10 32 5 25 5 17a9 9 0 0 1 19-4 9 9 0 0 1 19 4c0 8-5 15-19 25z" fill="${c}" ${W}/>`,
  rectangle: c => `<rect x="3" y="13" width="42" height="22" rx="3" fill="${c}" ${W}/>`,
  oval: c => `<ellipse cx="24" cy="24" rx="20" ry="13" fill="${c}" ${W}/>`,
  diamond: c => `<path d="M24 4l16 20-16 20L8 24z" fill="${c}" ${W}/>`
};
for (const [s, f] of Object.entries(SHAPE_PATH)) for (const [k, c] of Object.entries(SWATCH)) def(`en:sh:${s}:${k}`, f(c));
// counting cards with 1 to 10 dots (Picture Words: numbers)
const SPOTS: Record<number, [number, number][]> = { 1: [[24, 24]], 2: [[16, 24], [32, 24]], 3: [[14, 32], [24, 16], [34, 32]], 4: [[16, 16], [32, 16], [16, 32], [32, 32]], 5: [[15, 15], [33, 15], [24, 24], [15, 33], [33, 33]],
  6: [[16, 13], [32, 13], [16, 24], [32, 24], [16, 35], [32, 35]] };
const dotsOf = (n: number): [number, number][] => SPOTS[n] || Array.from({ length: n }, (_, i) => [10 + (i % 5) * 7, i < 5 ? 18 : 30] as [number, number]);
const DOT_COL = ['#e8433a', '#3b6fe0', '#43c463', '#ff9f43', '#8a5cf6', '#ff7eb8', '#ffb020', '#29b6f6', '#9a6a3a', '#5fd36a'];
for (let n = 1; n <= 10; n++) def('en:n:' + n, `<rect x="4" y="5" width="40" height="38" rx="7" fill="#fff6e4" ${W}/>` + dotsOf(n).map(([x, y]) => circ(x, y, n > 6 ? 3 : 4.4, DOT_COL[n - 1], 'stroke-width="1.6"')).join(''));
// a xylophone with its two sticks (the ABC Song's X)
def('en:xylo', `<path d="M6 34L42 30M6 42l36-4" ${W}/>` + ['#e8433a', '#ff9f43', '#ffd23f', '#43c463', '#3b6fe0', '#8a5cf6'].map((c, i) => `<rect x="${7 + i * 6}" y="${12 + i * 1.5}" width="5" height="${28 - i * 3}" rx="1.5" fill="${c}" ${W} stroke-width="1.6"/>`).join('') + g('a-hop', `<path d="M30 4l6 6" stroke="#b07a4a" stroke-width="2.6" stroke-linecap="round"/>${circ(29, 4, 2.6, '#ff7eb8')}`, '33px 7px'));
