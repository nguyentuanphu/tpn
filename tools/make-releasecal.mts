// (v1.08b story) Writes js/content/releasecal-items.ts: the default release calendar (docs/plans/links-rollout-install.md
// "A slow rollout"). Every held-back game and story of js/content/secondset.ts gets a week (3 to 4 games and 1 story a
// week, areas mixed so a week is varied), with its English and Vietnamese name and picture read from the game catalogue
// and the tale tables. Run again after the second set changes: node tools/make-releasecal.mts
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const R = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const sec = R('js/content/secondset.ts');
const block = (name: string) => sec.slice(sec.indexOf(name), sec.indexOf('};', sec.indexOf(name)));
const lists = (src: string) => { const out: Record<string, string[]> = {}; for (const m of src.matchAll(/(['"]?)([^'":\s]+)\1:\s*\[([^\]]*)\]/g)) out[m[2]] = [...m[3].matchAll(/['"]([\w-]+)['"]/g)].map(x => x[1]); return out; };
const games = lists(block('SECOND_SET_GAMES')), tales = lists(block('SECOND_SET_TALES'));
const names: Record<string, [string, string, string]> = {};
const Q = `(?:'((?:[^'\\\\]|\\\\.)*)'|"((?:[^"\\\\]|\\\\.)*)")`, un = (s: string) => s.replace(/\\(['"])/g, '$1');
const GRE = new RegExp(`id:\\s*['"]([\\w-]+)['"],\\s*icon:\\s*${Q},(?:\\s*\\w+:\\s*[^,{}]+,)*\\s*name:\\s*\\(\\)\\s*=>\\s*T\\(${Q},\\s*${Q}\\)`, 'g');
for (const f of readdirSync(new URL('../js/games/', import.meta.url)).filter(f => f.endsWith('.ts')).sort((a, b) => a === 'catalog.ts' ? -1 : b === 'catalog.ts' ? 1 : a < b ? -1 : 1))
  for (const m of R('js/games/' + f).matchAll(GRE)) names['game:' + m[1]] ||= [un(m[4] ?? m[5]), un(m[6] ?? m[7]), m[2] ?? m[3]];
for (const f of ['js/talesdata.ts', 'js/tales-content.ts']) for (const m of R(f).matchAll(/tale\('([\w-]+)',\s*'([^']*)',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)'/g)) names['story:' + m[1]] ||= [m[3].replace(/\\'/g, "'"), m[4].replace(/\\'/g, "'"), m[2]];
// round robin over the areas so each week mixes them
const rr = (o: Record<string, string[]>) => { const qs = Object.values(o).map(a => a.slice()), out: string[] = []; while (qs.some(q => q.length)) for (const q of qs) if (q.length) out.push(q.shift()!); return out; };
const G = rr(games), S = rr(tales);
const day = (d: Date) => d.toISOString().slice(0, 10);
const first = new Date('2026-11-16T00:00:00Z'); // the first Monday after v1.08 ships
// 32 weeks (to the end of June 2027): about 3.5 games and 2 stories a week, spread evenly
const WEEKS = 32, rows: string[] = [], share = (n: number, w: number) => Math.floor((w + 1) * n / WEEKS) - Math.floor(w * n / WEEKS);
let gi = 0, si = 0;
for (let w = 0; w < WEEKS; w++) {
  const mon = day(new Date(+first + w * 7 * 864e5));
  const g: string[] = [], st: string[] = [];
  for (let k = share(G.length, w); k > 0; k--) g.push(G[gi++]);
  for (let k = share(S.length, w); k > 0; k--) st.push(S[si++]);
  rows.push(`  '${mon}': '${g.join(' ')}|${st.join(' ')}',`);
}
const w = WEEKS;
names['game:rongran'] ||= ['Dragon Snake', 'Rồng Rắn Lên Mây', '🐉']; // its catalogue line has no name of its own
const miss = [...G.map(g => 'game:' + g), ...S.map(s => 'story:' + s)].filter(k => !names[k]);
const nm = Object.entries(names).filter(([k]) => G.includes(k.slice(5)) && k.startsWith('game:') || S.includes(k.slice(6)) && k.startsWith('story:'))
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
writeFileSync(new URL('../js/content/releasecal-items.ts', import.meta.url), `// Made by tools/make-releasecal.mts (v1.08b story): do not edit by hand, run it again.
// The default week of each held-back game and story: Monday of its week (YYYY-MM-DD, Sydney) -> "games|stories" (ids
// separated by spaces). Kept small: it is read at start-up; the names are in releasecal-names.ts, loaded when shown.
export const CAL_WEEKS: Record<string, string> = {
${rows.join('\n')}
};
`);
writeFileSync(new URL('../js/content/releasecal-names.ts', import.meta.url), `// Made by tools/make-releasecal.mts (v1.08b story): do not edit by hand, run it again.
// The release calendar's names: English name, Vietnamese name, picture (drawn by js/art.ts). Loaded only when the
// calendar is shown (js/content/releasecal.ts loadCalNames), so the start-up download stays small.
export const CAL_NAMES: Record<string, [string, string, string]> = {
${nm.join('\n')}
};
`);
console.log(`${G.length} games, ${S.length} stories, ${w} weeks (last ${day(new Date(+first + (w - 1) * 7 * 864e5))}); names missing: ${miss.join(', ') || 'none'}`);
