// The game's import map, checked (architecture step 0, docs/ARCHITECTURE.md §12): which files import which, and the
// groups of files that import each other in a circle (each group is a "cycle"). Circles make the code hard to change
// one piece at a time, so their number is a ratchet: it may only go down. The allowed number is in
// tests/arch-baseline.json; when a round removes a circle, lower it there.
//   node tests/arch.mts            the report (exit 1 if there are more circles than allowed)
//   import { importGraph, cycles } from './arch.mts'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const walk = d => fs.readdirSync(d).flatMap(f => { const p = path.join(d, f); return fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : []; });
// static imports only (a dynamic import() is loaded later and does not make a circle at start)
export function importGraph() {
  const files = walk(path.join(ROOT, 'js')), graph = new Map();
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''), rel = path.relative(ROOT, f), out = new Set();
    for (const m of src.matchAll(/^\s*(?:import|export)\s[^'"]*?from\s*['"](\.{1,2}\/[^'"]+)['"]/gm)) { const to = path.relative(ROOT, path.resolve(path.dirname(f), m[1])); if (to.startsWith('js/')) out.add(to); }
    for (const m of src.matchAll(/^\s*import\s*['"](\.{1,2}\/[^'"]+)['"]/gm)) { const to = path.relative(ROOT, path.resolve(path.dirname(f), m[1])); if (to.startsWith('js/')) out.add(to); }
    graph.set(rel, out);
  }
  return graph;
}
// strongly connected groups bigger than one file (Tarjan)
export function cycles(graph) {
  let i = 0; const idx = new Map(), low = new Map(), stack = [], on = new Set(), out = [];
  const visit = v => {
    idx.set(v, i); low.set(v, i); i++; stack.push(v); on.add(v);
    for (const w of graph.get(v) || []) { if (!graph.has(w)) continue; if (!idx.has(w)) { visit(w); low.set(v, Math.min(low.get(v), low.get(w))); } else if (on.has(w)) low.set(v, Math.min(low.get(v), idx.get(w))); }
    if (low.get(v) === idx.get(v)) { const c = []; let w; do { w = stack.pop(); on.delete(w); c.push(w); } while (w !== v); if (c.length > 1) out.push(c.sort()); }
  };
  for (const v of graph.keys()) if (!idx.has(v)) visit(v);
  return out.sort((a, b) => b.length - a.length);
}
if (process.argv[1] && process.argv[1].endsWith('arch.mts')) {
  const g = importGraph(), c = cycles(g), base = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/arch-baseline.json'), 'utf8'));
  const inCycles = c.reduce((a, x) => a + x.length, 0);
  console.log(`${g.size} files, ${[...g.values()].reduce((a, s) => a + s.size, 0)} imports; ${c.length} circle groups (${inCycles} files in them); allowed: ${base.maxCycles} groups, ${base.maxFilesInCycles} files`);
  for (const x of c) console.log('  ' + x.join(' ↔ '));
  process.exitCode = c.length > base.maxCycles || inCycles > base.maxFilesInCycles ? 1 : 0;
}
