// Drawings (v1.08d polish): the four friends' items, earned from each friend's quest (js/friendquest.ts): Finn's compass,
// Sol's sun crystal, Clara's flower staff and Lumi's star lantern. Loaded with the quests, not in the first download.
import { O, W, N, g, circ, dot, def, star5, sparkle } from './kit.js';
def('fq:compass', `${circ(24, 26, 16, '#c98a3a')}${circ(24, 26, 12, '#fff8e0')}<path d="M24 4v6" stroke="${O}" stroke-width="3" stroke-linecap="round"/>${circ(24, 5, 3, '#ffd23f')}`
  + g('a-sway', `<path d="M24 15l4 11-4 11-4-11z" fill="#e8433a" ${W}/><path d="M24 26l4 0-4 11-4-11z" fill="#5fb6ff" ${W}/>`, '24px 26px') + dot(24, 26, 2) + sparkle(40, 10, 1.1));
def('fq:crystal', g('a-pulse', [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return `<path d="M${(24 + Math.cos(a) * 15).toFixed(1)} ${(24 + Math.sin(a) * 15).toFixed(1)}L${(24 + Math.cos(a) * 21).toFixed(1)} ${(24 + Math.sin(a) * 21).toFixed(1)}" stroke="#ffb020" stroke-width="3" stroke-linecap="round"/>`; }).join(''), '24px 24px')
  + `<path d="M24 8l9 10-9 22-9-22z" fill="#ffd23f" ${W}/><path d="M15 18h18M24 8v32" stroke="#fff6b0" stroke-width="1.6" ${N}/>` + sparkle(36, 34, 1));
def('fq:staff', `<path d="M22 46l6-30" stroke="#a0683a" stroke-width="4" stroke-linecap="round"/><path d="M25 32q-8-2-9-8 7 0 9 8z" fill="#5fbf4a" ${W}/>`
  + g('a-sway', [0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return circ(+(28 + Math.cos(a) * 7).toFixed(1), +(12 + Math.sin(a) * 7).toFixed(1), 5, '#ff7eb8'); }).join('') + circ(28, 12, 4, '#ffd23f'), '28px 14px') + sparkle(10, 10, 1));
def('fq:lantern', `<path d="M24 4v6" stroke="${O}" stroke-width="2.4"/><path d="M14 10h20" stroke="#a0683a" stroke-width="4" stroke-linecap="round"/><path d="M15 12h18l3 22H12z" fill="#ffe58a" ${W}/>`
  + g('a-pulse', star5(24, 23, 7, '#ff9f43'), '24px 23px') + `<path d="M12 34h24l-3 6H15z" fill="#7aa65a" ${W}/><path d="M22 40q2 5 0 6M26 40q-2 5 0 6" stroke="#5fbf4a" stroke-width="2" ${N}/>` + sparkle(41, 16, 1));
