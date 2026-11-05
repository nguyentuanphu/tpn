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


// ---------- (v1.08b games) the learning journeys: the sticker book tab, a medal for each step, a badge per subject ----------
const PATHS: [string, string][] = [['vi', '#e8433a'], ['en', '#3b6fe0'], ['math', '#ff9f43'], ['shape', '#9a6bff'], ['money', '#43c463'], ['sci', '#3cc7e8'], ['read', '#ff7eb8'], ['me', '#ffd23f']];
const num = (n: number) => `<text x="24" y="31" text-anchor="middle" font-size="17" font-weight="900" fill="#fff" stroke="${O}" stroke-width="1.2" font-family="Fredoka,sans-serif">${n}</text>`;
const star = (cx: number, cy: number, r: number, f: string) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r * .45 : r; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * k).toFixed(1) + ' ' + (cy + Math.sin(a) * k).toFixed(1); } return `<path d="${d}z" fill="${f}" ${W}/>`; };
def('lp:tab', `<path d="M6 40q10-26 18-10t18-20" stroke="#b07a4a" stroke-width="3" stroke-dasharray="4 4" stroke-linecap="round" ${N}/>${circ(6, 40, 4, '#43c463')}` + g('a-twinkle', star(40, 10, 8, '#ffd23f'), '40px 10px'));
def('lp:mark', g('a-pulse', `${circ(24, 24, 18, '#3b6fe0')}${star(24, 24, 11, '#ffd23f')}`, '24px 24px'));
for (const [k, c] of PATHS) {
  for (let n = 1; n <= 9; n++) def(`lp:${k}:${n}`, `<path d="M16 4l-4 14M32 4l4 14" stroke="${c}" stroke-width="5" stroke-linecap="round"/>${circ(24, 27, 16, c)}${circ(24, 27, 11.5, '#fff8e0')}` + `<g opacity=".9">${star(24, 27, 10, c)}</g>` + num(n));
  def(`lp:badge:${k}`, `<path d="M14 30l-6 14 7-3 4 6 5-14M34 30l6 14-7-3-4 6-5-14" fill="${c}" ${W}/>` + [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return circ(24 + Math.cos(a) * 13, 20 + Math.sin(a) * 13, 5, c); }).join('') + circ(24, 20, 13, '#ffd23f') + g('a-twinkle', star(24, 20, 8, '#fff'), '24px 20px'));
}
// Santa for the Christmas game: a round face, a white beard and a red hat with a bobble
add('🎅', `<path d="M10 20q4-16 22-12l8 10H10z" fill="#e8433a" ${W}/>${circ(42, 20, 4, '#fff')}<rect x="8" y="18" width="30" height="6" rx="3" fill="#fff" ${W}/>${circ(23, 30, 9, '#ffd6b8')}${eyes(20, 26, 29, 1.3)}<path d="M12 32q11 20 22 0q-4 6-11 6t-11-6z" fill="#fff" ${W}/>`);
