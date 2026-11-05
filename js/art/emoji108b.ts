// Drawings (v1.08b games): pictures the new corner and festival games ask about that had no drawing yet. They are
// part of the start (not js/art/games108b.ts), so every emoji in the game has its drawing from the first screen (the
// emoji check reads js/art.js).
import { O, g, circ, dot, add, def, W, N, eyes } from './kit.js';
const face = (x: number, y: number, r: number, f: string, mouth: string) => circ(x, y, r, f) + eyes(x - r * .38, x + r * .38, y - r * .15, r * .12) + mouth;
add('🩳', `<path d="M8 10h32l4 30H28l-4-16-4 16H4z" fill="#5fb6ff" ${W}/><path d="M8 16h32" ${W}/>`);
add('🧤', g('a-wave', `<path d="M14 44V20a3 3 0 0 1 6 0v-6a3 3 0 0 1 6 0v4a3 3 0 0 1 6 0v6a3 3 0 0 1 6 0v12c0 6-4 8-8 8z" fill="#e8433a" ${W}/><path d="M14 30l-6-6a3 3 0 0 1 4-4l2 2" fill="#e8433a" ${W}/><path d="M14 38h22" stroke="#fff" stroke-width="3"/>`, '24px 40px'));
add('🌬️', g('a-sway', `<path d="M4 16h26a6 6 0 1 0-6-6M4 26h34a6 6 0 1 1-6 6M4 36h18" stroke="#5fb6ff" stroke-width="3.4" stroke-linecap="round" ${N}/>`, '20px 24px'));
add('🚴', `${circ(12, 36, 8, 'none')}${circ(36, 36, 8, 'none')}<path d="M12 36l8-12h10l6 12M20 24l6 12" ${W} ${N}/>` + g('a-bob', `${circ(28, 8, 4.6, '#ffd6b8')}<path d="M27 13l-3 10 6 3M26 16l6 4" stroke="#e8433a" stroke-width="3" stroke-linecap="round" ${N}/>`, '28px 18px'));
add('🪮', `<rect x="6" y="10" width="36" height="10" rx="4" fill="#ff7eb8" ${W}/><path d="M10 20v18M15 20v18M20 20v18M25 20v18M30 20v18M35 20v18M40 20v14" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/>`);
add('🧻', `<path d="M10 10h22v30H10z" fill="#fff" ${W}/><ellipse cx="32" cy="14" rx="8" ry="6" fill="#fff" ${W}/>${circ(32, 14, 2.2, '#e0d6c8')}<path d="M10 40l4-4 4 4 4-4 4 4 4-4 2 2" ${W} ${N}/>`);
def('g8:can', `<path d="M10 18h22v20a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="#43c463" ${W}/><path d="M32 22l10-8" stroke="#43c463" stroke-width="5" stroke-linecap="round"/><path d="M14 18q7-10 14 0" ${W} ${N}/>` + g('a-drop', `<path d="M42 18l2 6M38 20l1 6" stroke="#3b6fe0" stroke-width="2.4" stroke-linecap="round"/>`, '42px 22px'));
add('😟', face(24, 24, 18, '#ffd23f', `<path d="M17 34q7-5 14 0" ${W} ${N}/><path d="M14 14l6 2M34 14l-6 2" ${W}/>`));
add('🤐', face(24, 24, 18, '#ffd23f', `<path d="M14 32h20" ${W}/><path d="M17 29v6M21 29v6M25 29v6M29 29v6" stroke="${O}" stroke-width="1.8"/>`));

