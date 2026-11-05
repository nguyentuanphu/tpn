// Drawings (v1.08b games): the pictures of the new corner games (js/content/games108b.ts), each its own drawing.
// Keys that are not emoji only ever show through pic() / artSVG().
import { O, g, circ, dot, sparkle, star5, def, add, W, N, eyes, smile } from "./kit.js";
const txt = (x: number, y: number, s: number, t: string, f = '#fff') => `<text x="${x}" y="${y}" font-size="${s}" font-weight="900" fill="${f}" stroke="${O}" stroke-width="1.1" font-family="Fredoka,sans-serif">${t}</text>`;
const face = (x: number, y: number, r: number, f: string, mouth: string) => circ(x, y, r, f) + eyes(x - r * .38, x + r * .38, y - r * .15, r * .12) + mouth;
const card = (fill: string) => `<rect x="4" y="6" width="40" height="36" rx="7" fill="${fill}" ${W}/>`;
const en = txt(30, 43, 9, 'EN', '#3b6fe0');

// ---------- Tiếng Anh ----------
// Who Says That?: a cow with a "moo" bubble
def('g8:animalsay', `<path d="M26 4h18v12H32l-4 4v-4h-2z" fill="#fff" ${W}/>` + txt(28, 13, 8, 'moo', '#e8433a') + g('a-bob', `<ellipse cx="18" cy="32" rx="13" ry="10" fill="#fff" ${W}/><circle cx="13" cy="30" r="3" fill="${O}"/><ellipse cx="18" cy="38" rx="7" ry="4" fill="#ffc2d1" ${W}/>${dot(16, 38, 1)}${dot(20, 38, 1)}<path d="M8 24l-4-4M28 24l4-4" ${W}/>`, '18px 40px'));
// Opposites in English: a big and a small ball with arrows
def('g8:enopp', g('a-pulse', circ(15, 22, 11, '#ff7eb8'), '15px 22px') + circ(37, 28, 5, '#5fb6ff') + `<path d="M20 40h10M27 37l3 3-3 3M22 37l-3 3 3 3" ${W} ${N}/>` + en);
// How Do You Feel?: a happy and a sad face
def('g8:enfeel', face(14, 18, 10, '#ffd23f', `<path d="M10 21q4 4 8 0" ${W} ${N}/>`) + face(34, 28, 10, '#9ad0ff', `<path d="M30 33q4-4 8 0" ${W} ${N}/>`) + en);
// Clothes and Weather: a cloud with rain and a coat
def('g8:enweather', `<path d="M8 20a7 7 0 0 1 7-9 9 9 0 0 1 17 2 6 6 0 0 1 2 11H11a5 5 0 0 1-3-4z" fill="#e8f0f8" ${W}/>` + g('a-drop', `<path d="M14 28l-2 5M22 28l-2 5M30 28l-2 5" stroke="#3b6fe0" stroke-width="2.4" stroke-linecap="round"/>`, '22px 30px') + `<path d="M34 30l-4 4 2 10h12l2-10-4-4-4 3z" fill="#ff9f43" ${W}/>`);
// My Daily Routine: a clock with a sun and a moon
def('g8:enroutine', circ(24, 24, 14, '#fffdf6') + `<path d="M24 14v10l7 4" ${W} ${N}/>` + g('a-spin', circ(8, 8, 5, '#ffd23f'), '8px 8px') + `<path d="M42 36a6 6 0 1 1-6-8 5 5 0 0 0 6 8z" fill="#ffe27a" ${W}/>`);
// In, On, Under: a box with a cat on top
def('g8:enwhere', `<path d="M8 26h32v16H8z" fill="#d9a066" ${W}/><path d="M8 26l4-6h24l4 6" fill="#e8b97a" ${W}/>` + g('a-bob', `${circ(24, 14, 7, '#ffb347')}<path d="M18 10l1-6 4 4M30 10l-1-6-4 4" fill="#ffb347" ${W}/>${eyes(21.5, 26.5, 13, 1.2)}`, '24px 18px'));
// Action Words: a running child with motion lines
def('g8:enverbs', g('a-hop', `${circ(28, 8, 5, '#ffd6b8')}<path d="M26 14l-4 12 8 6-2 10M22 26l-8 8M26 16l8 6 6-4M26 18l-8 2" ${W} ${N}/>`, '26px 30px') + `<path d="M4 20h8M2 28h8M6 36h6" stroke="#5fb6ff" stroke-width="2.6" stroke-linecap="round"/>`);
// At the Shop: a shop awning and a basket
def('g8:enshop', `<path d="M4 6h40l-2 10H6z" fill="#e8433a" ${W}/><path d="M12 6l-2 10M22 6v10M32 6l2 10" ${W}/><rect x="8" y="16" width="32" height="26" fill="#fff6e4" ${W}/>` + g('a-bob', `<path d="M14 30h20l-3 10H17z" fill="#d9a066" ${W}/><path d="M18 30q6-8 12 0" ${W} ${N}/>`, '24px 36px'));
// Numbers 11 to 20: "20" on a card
def('g8:enteens', card('#e8f4ff') + txt(9, 32, 20, '20', '#ff7eb8') + g('a-twinkle', sparkle(40, 10), '40px 10px'));
// Body Song: a child touching their head, with a note
def('g8:enbody', `${circ(22, 14, 8, '#ffd6b8')}${eyes(19.5, 24.5, 13, 1.2)}${smile(22, 17, 4)}<path d="M22 22v12M22 34l-6 10M22 34l6 10M22 26l-8-12M22 26l8-4" ${W} ${N}/>` + g('a-hop2', `<path d="M40 8v12" stroke="${O}" stroke-width="2.4"/>${circ(37.5, 20.5, 3, '#9a6bff')}`, '38px 20px'));
// Who, What, Where?: three question marks of three colours
def('g8:enwh', txt(4, 34, 22, '?', '#e8433a') + txt(17, 28, 22, '?', '#ffd23f') + txt(30, 38, 22, '?', '#43c463'));
// My Day Story: an open book with a sun
def('g8:enstory', `<path d="M4 14q10-4 20 2v26q-10-6-20-2z" fill="#fff" ${W}/><path d="M44 14q-10-4-20 2v26q10-6 20-2z" fill="#fff6e4" ${W}/>` + g('a-spin', circ(14, 26, 5, '#ffd23f'), '14px 26px') + `<path d="M29 24h10M29 30h8" ${W}/>`);

// ---------- Em và gia đình ----------
// Family Tree: a tree with three little faces
def('g8:tree', `<path d="M22 44V30h4v14" fill="#b07a4a" ${W}/>` + circ(24, 18, 15, '#7ccb68') + face(17, 14, 4, '#ffd6b8', '') + face(31, 14, 4, '#ffd6b8', '') + face(24, 24, 4, '#ffd6b8', ''));
// Brush and Wash: a toothbrush and a bubble
def('g8:wash', `<path d="M8 40L34 14" stroke="#5fb6ff" stroke-width="5" stroke-linecap="round"/><rect x="30" y="6" width="12" height="7" rx="2" transform="rotate(45 36 10)" fill="#fff" ${W}/>` + g('a-bob', `${circ(14, 14, 6, '#e8f8ff')}${circ(24, 6, 3, '#e8f8ff')}`, '18px 12px'));
// Safe or Not Safe?: a shield with a tick
def('g8:safe', `<path d="M24 4l16 6v12c0 11-7 18-16 22C15 40 8 33 8 22V10z" fill="#43c463" ${W}/><path d="M16 24l6 6 11-12" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" ${N}/>`);
// Helping at Home: a broom by a little house
def('g8:help', `<path d="M4 22L18 10l14 12v20H4z" fill="#ffe3a3" ${W}/><rect x="14" y="30" width="8" height="12" fill="#b07a4a" ${W}/>` + g('a-sway', `<path d="M40 4L34 30" stroke="#b07a4a" stroke-width="3" stroke-linecap="round"/><path d="M30 30h10l2 12H28z" fill="#ffd23f" ${W}/>`, '36px 30px'));
// Calm Down Corner: a calm face breathing out a soft swirl
def('g8:calm', face(18, 26, 13, '#c9e7ff', `<path d="M14 31h8" ${W}/>`) + g('a-pulse', `<path d="M32 18q6-6 10 0t-6 6" stroke="#9a6bff" stroke-width="2.6" stroke-linecap="round" ${N}/>`, '37px 18px'));
// At the Table: a bowl of rice with chopsticks
def('g8:table', `<path d="M8 24h32a16 14 0 0 1-32 0z" fill="#fff" ${W}/><path d="M10 24q14-12 28 0" fill="#fffdf6" ${W}/><path d="M30 4l-6 20M36 6l-8 18" stroke="#b07a4a" stroke-width="2.6" stroke-linecap="round"/><path d="M14 40h20" ${W}/>`);

// ---------- Suy nghĩ giỏi ----------
// Balance Puzzle: a balance with a heavy and a light weight
def('g8:balance', `<path d="M24 8v32M14 44h20" ${W}/>` + g('a-sway', `<path d="M6 18l36-6" ${W}/><path d="M6 18l-4 10h8zM42 12l-4 10h8z" fill="#ffe3a3" ${W}/>${circ(6, 25, 3, '#e8433a')}<rect x="38" y="16" width="8" height="5" fill="#3b6fe0" ${W}/>`, '24px 15px'));
// Clue Detective: a magnifying glass over a footprint
def('g8:clues', `<ellipse cx="18" cy="20" rx="5" ry="7" fill="#b07a4a" opacity=".5"/>` + g('a-bob', `${circ(20, 20, 12, '#e8f8ff')}<path d="M29 29l12 12" stroke="${O}" stroke-width="5" stroke-linecap="round"/>`, '24px 24px'));
// Code the Robot: a robot head and two arrows
def('g8:robot', `<rect x="6" y="10" width="22" height="20" rx="5" fill="#c9d6e8" ${W}/>${dot(13, 19, 2.2)}${dot(21, 19, 2.2)}<path d="M13 25h8M17 10V5" ${W}/>` + g('a-hop', `<path d="M30 36h12M38 32l4 4-4 4" stroke="#43c463" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" ${N}/>`, '36px 36px') + `<path d="M14 44V34M10 38l4-4 4 4" stroke="#e8433a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" ${N}/>`);
// What Changed?: two rows of dots, one dot a new colour
def('g8:changed', `<rect x="4" y="6" width="40" height="16" rx="5" fill="#fff3d6" ${W}/><rect x="4" y="26" width="40" height="16" rx="5" fill="#fff3d6" ${W}/>${circ(14, 14, 4, '#e8433a')}${circ(24, 14, 4, '#3b6fe0')}${circ(34, 14, 4, '#43c463')}${circ(14, 34, 4, '#e8433a')}${circ(34, 34, 4, '#43c463')}` + g('a-pulse', star5(24, 34, 6, '#ffd23f'), '24px 34px'));
// Hidden Counting: an eye over little stars
def('g8:howmany', `<path d="M4 18q20-16 40 0-20 16-40 0z" fill="#fff" ${W}/>${circ(24, 18, 6, '#5fb6ff')}${dot(24, 18, 2.4)}` + star5(10, 38, 5, '#ffd23f') + star5(24, 40, 5, '#ffd23f') + star5(38, 38, 5, '#ffd23f'));
// What Goes Together?: a sock and a shoe joined by a heart
def('g8:belong', `<path d="M6 8h10v18l6 6-4 6-12-10z" fill="#ff7eb8" ${W}/><path d="M26 30h10l6 8v4H26z" fill="#5fb6ff" ${W}/>` + g('a-pulse', `<path d="M30 14c0-4 6-4 6 0 0-4 6-4 6 0 0 4-6 8-6 8s-6-4-6-8z" fill="#e8433a" ${W}/>`, '36px 16px'));

// ---------- Tiếng Việt ----------
// Little Poems: a scroll with lines and a flower
def('g8:poem', `<rect x="8" y="6" width="30" height="36" rx="3" fill="#fff6e4" ${W}/><path d="M14 14h18M14 21h16M14 28h18M14 35h10" ${W}/>` + g('a-sway', `${circ(38, 36, 4, '#ff7eb8')}${circ(38, 36, 1.6, '#ffd23f')}`, '38px 40px'));
// Echo Words: "xinh xinh" on two matching cards
def('g8:tulay', `<rect x="3" y="12" width="20" height="22" rx="5" fill="#ffe3a3" ${W}/><rect x="25" y="12" width="20" height="22" rx="5" fill="#ffe3a3" ${W}/>` + txt(5, 28, 9, 'xinh', '#e8433a') + txt(27, 28, 9, 'xinh', '#e8433a') + g('a-twinkle', sparkle(24, 8), '24px 8px'));
// S or X?: the letters S and X on a slate
def('g8:sx', `<rect x="4" y="8" width="40" height="32" rx="5" fill="#2f5d4a" ${W}/>` + txt(9, 32, 20, 's', '#fff') + txt(27, 32, 20, 'x', '#ffd23f') + `<path d="M24 14v20" stroke="#fff" stroke-width="1.6" stroke-dasharray="3 3"/>`);

// ---------- pictures the new games ask about that had no drawing yet ----------
add('🩳', `<path d="M8 10h32l4 30H28l-4-16-4 16H4z" fill="#5fb6ff" ${W}/><path d="M8 16h32" ${W}/>`);
add('🧤', g('a-wave', `<path d="M14 44V20a3 3 0 0 1 6 0v-6a3 3 0 0 1 6 0v4a3 3 0 0 1 6 0v6a3 3 0 0 1 6 0v12c0 6-4 8-8 8z" fill="#e8433a" ${W}/><path d="M14 30l-6-6a3 3 0 0 1 4-4l2 2" fill="#e8433a" ${W}/><path d="M14 38h22" stroke="#fff" stroke-width="3"/>`, '24px 40px'));
add('🌬️', g('a-sway', `<path d="M4 16h26a6 6 0 1 0-6-6M4 26h34a6 6 0 1 1-6 6M4 36h18" stroke="#5fb6ff" stroke-width="3.4" stroke-linecap="round" ${N}/>`, '20px 24px'));
add('🚴', `${circ(12, 36, 8, 'none')}${circ(36, 36, 8, 'none')}<path d="M12 36l8-12h10l6 12M20 24l6 12" ${W} ${N}/>` + g('a-bob', `${circ(28, 8, 4.6, '#ffd6b8')}<path d="M27 13l-3 10 6 3M26 16l6 4" stroke="#e8433a" stroke-width="3" stroke-linecap="round" ${N}/>`, '28px 18px'));
add('🪮', `<rect x="6" y="10" width="36" height="10" rx="4" fill="#ff7eb8" ${W}/><path d="M10 20v18M15 20v18M20 20v18M25 20v18M30 20v18M35 20v18M40 20v14" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/>`);
add('🧻', `<path d="M10 10h22v30H10z" fill="#fff" ${W}/><ellipse cx="32" cy="14" rx="8" ry="6" fill="#fff" ${W}/>${circ(32, 14, 2.2, '#e0d6c8')}<path d="M10 40l4-4 4 4 4-4 4 4 4-4 2 2" ${W} ${N}/>`);
def('g8:can', `<path d="M10 18h22v20a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="#43c463" ${W}/><path d="M32 22l10-8" stroke="#43c463" stroke-width="5" stroke-linecap="round"/><path d="M14 18q7-10 14 0" ${W} ${N}/>` + g('a-drop', `<path d="M42 18l2 6M38 20l1 6" stroke="#3b6fe0" stroke-width="2.4" stroke-linecap="round"/>`, '42px 22px'));
add('😟', face(24, 24, 18, '#ffd23f', `<path d="M17 34q7-5 14 0" ${W} ${N}/><path d="M14 14l6 2M34 14l-6 2" ${W}/>`));
add('🤐', face(24, 24, 18, '#ffd23f', `<path d="M14 32h20" ${W}/><path d="M17 29v6M21 29v6M25 29v6M29 29v6" stroke="${O}" stroke-width="1.8"/>`));
