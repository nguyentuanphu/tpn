// Drawings (v1.08d polish): the hands-on games' pictures (js/games/handson.ts). The Tết bánh chưng keeps its picture
// (fg:tet, js/art/games108b.ts); the Maze Builder: a grass grid, rocks, stepping stones from the duckling to its mother.
import { O, W, circ, def, dot } from './kit.js';
const cell = (x: number, y: number, f: string) => `<rect x="${x}" y="${y}" width="12" height="12" rx="2.5" fill="${f}" stroke="${O}" stroke-width="1.4"/>`;
const grid = [0, 1, 2].flatMap(r => [0, 1, 2].map(c => cell(6 + c * 13, 6 + r * 13, (r === 1 && c === 1) ? '#d8d0c0' : '#bfe6a6'))).join('');
def('ho:maze', grid + circ(25, 25, 3.4, '#a89a80') + [[12, 38], [12, 25], [12, 12], [25, 12]].map(([x, y]) => circ(x, y, 2.6, '#a8b8c8')).join('')
  + `<path d="M34 34q4-6 8 0q-4 4-8 0z" fill="#ffd23f" ${W}/>` + dot(38, 33, .9) + `<path d="M33 8q4-5 9 0q-4 5-9 0z" fill="#fff" ${W}/>` + dot(38, 7.5, .9));
