// Picture Sudoku's pure rules (js/games/more.ts): the grid and its empty squares, without a browser (tests/unit/rules-audit.test.mjs)
import { shuffle } from '../util.js';
export function latin(n) { // a random latin square: each picture once per row and column
  const base = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (r + c) % n));
  const rows = shuffle(base), perm = shuffle(Array.from({ length: n }, (_, i) => i)), cols = shuffle(Array.from({ length: n }, (_, i) => i));
  return rows.map(row => cols.map(c => perm[row[c]]));
}
// (v1.07 rules audit) how many ways the empty squares can be filled (stops at 2): random holes on a 4 x 4 could leave two
// pictures that both fit, and the game only took the one it had stored, so a right answer was called wrong
export function sudokuSolutions(sol: number[][], empty: Set<number>, limit = 2) {
  const n = sol.length, g = sol.map((row, r) => row.map((v, c) => empty.has(r * n + c) ? -1 : v)), holes = [...empty].sort((a, b) => a - b);
  let found = 0;
  const go = (k: number) => {
    if (found >= limit) return;
    if (k === holes.length) { found++; return; }
    const r = Math.floor(holes[k] / n), c = holes[k] % n;
    for (let v = 0; v < n; v++) {
      if (g[r].includes(v) || g.some(row => row[c] === v)) continue;
      g[r][c] = v; go(k + 1); g[r][c] = -1;
    }
  };
  go(0); return found;
}
export function sudokuHoles(sol: number[][], holes: number) {
  const n = sol.length;
  for (let tries = 0; ; tries++) {
    const empty = new Set(shuffle(Array.from({ length: n * n }, (_, i) => i)).slice(0, holes));
    if (sudokuSolutions(sol, empty) === 1 || tries > 400) return empty;
  }
}
