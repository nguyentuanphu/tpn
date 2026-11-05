// Drawings (v1.08d s2vn): Season 2, Vietnam. The regions' pictures (the place, its landmark, its food) and the pictures
// of their games, drawn here in the valley's style (48 by 48, a dark outline), never a phone emoji. Loaded after the
// start with the other new games' pictures (js/art/games108.ts).
import { O, g, circ, dot, def, W, N, eyes, smile } from './kit.js';

// ---------- shared bits ----------
const water = (y = 34) => `<path d="M2 ${y}q6-3 11 0t11 0 11 0 11 0v12H2z" fill="#4fa8d8" ${W}/>`;
const wave = (y: number) => `<path d="M6 ${y}q4-2 8 0t8 0M28 ${y}q4-2 8 0t8 0" stroke="#d8f0ff" stroke-width="2" stroke-linecap="round" ${N}/>`;
const sampan = (x: number, y: number, c = '#8a5a32') => `<path d="M${x - 16} ${y}h32l-5 7H${x - 11}z" fill="${c}" ${W}/><path d="M${x - 16} ${y}l-3-4M${x + 16} ${y}l3-4" ${W}/>`;
const nonla = (x: number, y: number) => `<path d="M${x - 8} ${y}L${x} ${y - 7}L${x + 8} ${y}z" fill="#f2d16b" ${W}/>`;
const person = (x: number, y: number, shirt: string) => `<path d="M${x - 4} ${y + 10}v-6a4 4 0 0 1 8 0v6z" fill="${shirt}" ${W}/>${circ(x, y, 3.6, '#e8b48c')}${nonla(x, y - 1.6)}`;
const fruitBall = (x: number, y: number, r: number, c: string) => circ(x, y, r, c);

// ---------- the Mekong floating market ----------
// the region: a boat on the river with the cây bẹo pole and fruit hung on top
def('s2:mekong', `${water(32)}${wave(40)}` + g('a-bob', `${sampan(22, 30)}<path d="M30 30V8" ${W}/>${fruitBall(30, 9, 4, '#ffd23f')}${fruitBall(25, 26, 3.4, '#ff9f43')}${fruitBall(18, 26, 3.4, '#5fd36a')}${person(12, 18, '#3cc7e8')}`, '22px 30px'));
// the landmark: a monkey bridge, a single bamboo pole with one handrail over the canal
def('s2:caukhi', `${water(34)}${wave(41)}<path d="M4 30L44 26" stroke="#c8a060" stroke-width="3.4" stroke-linecap="round"/><path d="M8 32l-3 12M18 31l2 13M30 29l-2 15M40 28l3 16" stroke="#a87a40" stroke-width="2.6" stroke-linecap="round"/><path d="M8 32l2-14M40 28l-1-14M10 18L39 14" stroke="#c8a060" stroke-width="2.6" stroke-linecap="round" ${N}/>` + g('a-bob', person(24, 16, '#e8433a'), '24px 24px'));
// the food: bánh xèo, a yellow half-moon pancake with prawns and bean sprouts, on a plate with lettuce
def('s2:banhxeo', `<ellipse cx="24" cy="34" rx="20" ry="7" fill="#fff" ${W}/><path d="M8 32q4-14 16-16q12 2 16 16z" fill="#7ac860" ${W}/><path d="M8 32a16 13 0 0 1 32 0z" fill="#f6c13a" ${W}/>${dot(17, 26, 1.6, '#e8a33a')}${dot(26, 24, 1.6, '#e8a33a')}${dot(32, 28, 1.6, '#e8a33a')}<path d="M18 30q3-4 6 0M28 30q2-3 5 0" stroke="#ff7a5a" stroke-width="2.4" stroke-linecap="round" ${N}/>` + g('a-smoke', `<path d="M20 12q-2-3 0-6M28 12q-2-3 0-6" stroke="#c8c0d0" stroke-width="2" stroke-linecap="round" ${N}/>`, '24px 10px'));
// the games' pictures
def('s2g:sampan', `${water(30)}${wave(40)}` + g('a-bob', `${sampan(24, 28, '#3b6fe0')}${person(14, 16, '#3cc7e8')}<path d="M18 22l14 14" stroke="#8a5a32" stroke-width="2.4" stroke-linecap="round"/>${fruitBall(26, 24, 3.4, '#ffd23f')}${fruitBall(32, 24, 3.4, '#5fd36a')}${fruitBall(29, 19, 3.4, '#e8433a')}`, '24px 28px'));
def('s2g:caybeo', `${water(36)}${sampan(24, 34)}<path d="M24 34V6" stroke="#8a5a32" stroke-width="3" stroke-linecap="round"/>` + g('a-sway', `<path d="M24 8l-6 4M24 8l6 4" ${W}/>${fruitBall(17, 14, 4, '#ffd23f')}${fruitBall(31, 14, 4, '#e8433a')}<path d="M28 4c4-2 7 1 6 4" stroke="#43c463" stroke-width="2.4" ${N}/>`, '24px 8px'));
def('s2g:count', `<rect x="6" y="20" width="36" height="20" rx="4" fill="#c8a060" ${W}/><path d="M6 28h36" stroke="${O}" stroke-width="1.6"/>${fruitBall(14, 18, 4.4, '#ffd23f')}${fruitBall(24, 16, 4.4, '#ff9f43')}${fruitBall(34, 18, 4.4, '#5fd36a')}` + g('a-pulse', `${circ(38, 38, 8, '#fff')}<text x="38" y="42" text-anchor="middle" font-size="11" font-weight="900" fill="${O}" font-family="Fredoka,sans-serif">3</text>`, '38px 38px'));

// ---------- pictures inside the Mekong games ----------
// a customer's boat: a boat with a smiling customer (the colour changes per round)
export const customerBoat = (shirt: string) => `<svg class="art" viewBox="0 0 48 48" aria-hidden="true">${water(36)}${sampan(24, 34, '#8a5a32')}<path d="M18 34v-8a6 6 0 0 1 12 0v8z" fill="${shirt}" ${W}/>${circ(24, 20, 6, '#e8b48c')}${eyes(21.6, 26.4, 19.6, 1.1)}${smile(24, 23, 4)}${nonla(24, 16)}</svg>`;
// a boat with its cây bẹo pole and a thing (any drawing) hung on top
export const poleBoat = (thing: string, hull = '#8a5a32') => `<div class="s2-pole"><span class="s2-hang">${thing}</span><svg class="art" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 34V2" stroke="#8a5a32" stroke-width="3" stroke-linecap="round"/>${water(38)}${sampan(24, 36, hull)}</svg></div>`;
// a basket (with the fruit drawn over it by the game)
export const basket = `<svg class="art" viewBox="0 0 48 48" aria-hidden="true"><path d="M6 22h36l-5 20H11z" fill="#c8a060" ${W}/><path d="M9 30h30M11 37h26" stroke="${O}" stroke-width="1.6"/><path d="M12 22q12-16 24 0" stroke="#a87a40" stroke-width="3" ${N}/></svg>`;
// a coin
export const coin = `<svg class="art" viewBox="0 0 48 48" aria-hidden="true">${circ(24, 24, 16, '#ffd23f')}${circ(24, 24, 10, '#ffe680')}<path d="M24 17v14" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/></svg>`;
def('s2:coin', `${circ(24, 24, 16, '#ffd23f')}${circ(24, 24, 10, '#ffe680')}<path d="M24 17v14" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/>`);

// ---------- Hạ Long Bay ----------
const karst = (x: number, w: number, h: number, c = '#a8a092', top = '#4f8f42') => `<path d="M${x - w / 2} 38q-1-${h * .6} ${w * .2}-${h}q${w * .3}-${h * .15} ${w * .6} 0q${w * .2} ${h * .4} ${w * .2} ${h}z" fill="${c}" ${W}/><path d="M${x - w * .28} ${38 - h + 2}q${w * .3}-5 ${w * .58} 0" stroke="${top}" stroke-width="3.4" stroke-linecap="round" ${N}/>`;
const junk = (x: number, y: number) => `<path d="M${x - 7} ${y}h14l-3 4h-8z" fill="#8a5a32" ${W}/><path d="M${x} ${y}V${y - 12}l7 9z" fill="#e07b26" ${W}/><path d="M${x - 1} ${y - 1}V${y - 9}l-6 7z" fill="#c8643a" ${W}/>`;
def('s2:halong', `${karst(12, 14, 26)}${karst(34, 16, 32)}${karst(24, 8, 14)}${water(38)}` + g('a-bob', junk(22, 36), '22px 36px'));
def('s2:trongmai', `${water(38)}<path d="M10 38q-2-14 4-20q4-6 8 0l-2 6q4 6 0 14z" fill="#a8a092" ${W}/><path d="M38 38q2-12-3-16q-4-5-7 0l2 6q-4 5-1 10z" fill="#a8a092" ${W}/><path d="M16 14l2-4 2 4M30 18l2-3 1 3" stroke="#e8433a" stroke-width="2.4" stroke-linecap="round" ${N}/>${dot(17, 19, 1.4)}${dot(31, 22, 1.4)}`);
def('s2:chamuc', `<ellipse cx="24" cy="34" rx="20" ry="7" fill="#fff" ${W}/>${circ(18, 28, 8, '#e8a33a')}${circ(30, 27, 8, '#f6c13a')}<path d="M14 26q4-3 8 0M26 25q4-3 8 0" stroke="#c87a20" stroke-width="2" stroke-linecap="round" ${N}/>` + g('a-smoke', `<path d="M20 14q-2-3 0-6M28 14q-2-3 0-6" stroke="#c8c0d0" stroke-width="2" stroke-linecap="round" ${N}/>`, '24px 10px'));
const caveMouth = (x: number, y: number) => `<path d="M${x - 4} ${y}q4-8 8 0z" fill="#3b2a4f"/>`;
def('s2g:cave', `${karst(24, 30, 32)}${caveMouth(24, 38)}${water(38)}` + g('a-twinkle', `<path d="M24 26l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#ffd23f"/>`, '24px 30px'));
def('s2g:rocks', `${water(38)}<path d="M8 38q0-12 8-14q2-6 8-4q4-6 8 0q8 2 8 18z" fill="#a8a092" ${W}/>${dot(30, 22, 1.6)}<path d="M33 18l3-3 1 4" stroke="#e8433a" stroke-width="2.4" stroke-linecap="round" ${N}/>` + g('a-pulse', `${circ(40, 10, 6, '#fff')}<text x="40" y="14" text-anchor="middle" font-size="10" font-weight="900" fill="${O}" font-family="Fredoka,sans-serif">?</text>`, '40px 10px'));
export const fishSVG = (c = '#ff9f43') => `<svg class="art" viewBox="0 0 48 48" aria-hidden="true"><path d="M8 24q12-14 28 0q-16 14-28 0z" fill="${c}" ${W}/><path d="M36 24l8-7v14z" fill="${c}" ${W}/>${dot(15, 22, 1.8)}</svg>`;
const fishPath = (x: number, y: number, c: string) => `<path d="M${x - 6} ${y}q6-6 12 0q-6 6-12 0z" fill="${c}" ${W}/><path d="M${x + 6} ${y}l4-3v6z" fill="${c}" ${W}/>`;
def('s2g:nets', `<path d="M6 10h36l-6 30H12z" fill="#e8dcc0" ${W}/><path d="M10 18h28M12 26h24M14 34h20M16 10l4 30M24 10v30M32 10l-4 30" stroke="#a87a40" stroke-width="1.4"/>${fishPath(18, 22, '#ff9f43')}${fishPath(30, 30, '#3cc7e8')}${fishPath(24, 14, '#e8433a')}`);
def('s2:fish', `<path d="M8 24q12-14 28 0q-16 14-28 0z" fill="#ff9f43" ${W}/><path d="M36 24l8-7v14z" fill="#ff9f43" ${W}/>${dot(15, 22, 1.8)}`);
/** an island of the hidden-cave game: tall or short, with a tree or a bird on top and a boat beside it (any of them) */
export function islandSVG(o: { tall: boolean; tree: boolean; bird: boolean; boat: boolean; tint: string }) {
  const h = o.tall ? 34 : 20, top = 40 - h;
  return `<svg class="art" viewBox="0 0 48 48" aria-hidden="true">${water(40)}<path d="M10 42q-2-${h * .6} 4-${h}q8-4 16 0q6 ${h * .4} 6 ${h}z" fill="${o.tint}" ${W}/><path d="M14 ${top + 4}q8-5 16 0" stroke="#4f8f42" stroke-width="3.4" stroke-linecap="round" ${N}/>`
    + (o.tree ? `<path d="M22 ${top + 2}v-6" ${W}/>${circ(22, top - 6, 4.4, '#43c463')}` : '')
    + (o.bird ? `<path d="M26 ${top - 2}q3-4 6 0q3-4 6 0" stroke="${O}" stroke-width="2.4" stroke-linecap="round" ${N}/>` : '')
    + (o.boat ? junk(40, 44) : '') + '</svg>';
}
/** a fishing net with n fish in it */
export function netSVG(n: number, cols = ['#ff9f43', '#3cc7e8', '#e8433a', '#43c463']) {
  const fish = Array.from({ length: n }, (_, i) => fishPath(14 + (i % 3) * 10, 16 + Math.floor(i / 3) * 8, cols[i % cols.length])).join('');
  return `<svg class="art" viewBox="0 0 48 48" aria-hidden="true"><path d="M4 8h40l-6 36H10z" fill="#f4ecd8" ${W}/><path d="M8 16h32M9 24h30M10 32h28M12 40h24M14 8l4 36M24 8v36M34 8l-4 36" stroke="#c8a060" stroke-width="1.2"/>${fish}</svg>`;
}

// ---------- Sapa ----------
const steps = (cols: string[]) => cols.map((c, i) => `<path d="M${4 + i * 4} ${42 - i * 7}h${40 - i * 8}v-7H${4 + i * 4}z" fill="${c}" ${W}/>`).join('');
def('s2:sapa', `<path d="M2 30L16 8l10 12 8-10 12 20z" fill="#9ab0c8" ${W}/>${steps(['#7ac860', '#5fae4a', '#8fd06a', '#4f9a3a'])}`);
def('s2:terraces', `${steps(['#4fa8d8', '#7ac860', '#f6c13a', '#5fae4a'])}<path d="M10 33h28M14 26h20" stroke="#d8f0ff" stroke-width="1.6" ${N}/>`);
def('s2:trungnuong', `<path d="M8 40L40 8" stroke="#a87a40" stroke-width="3" stroke-linecap="round"/><ellipse cx="18" cy="30" rx="7" ry="9" fill="#e8c890" ${W} transform="rotate(-45 18 30)"/><ellipse cx="30" cy="18" rx="7" ry="9" fill="#d8a860" ${W} transform="rotate(-45 30 18)"/>` + g('a-smoke', `<path d="M36 34q-2-3 0-6M42 30q-2-3 0-6" stroke="#c8c0d0" stroke-width="2" stroke-linecap="round" ${N}/>`, '38px 30px'));
const seedling = (x: number, y: number) => `<path d="M${x} ${y}v-6M${x} ${y - 3}l-3-3M${x} ${y - 4}l3-3" stroke="#2f8a4a" stroke-width="2" stroke-linecap="round" ${N}/>`;
def('s2g:terrace', `${steps(['#7ac860', '#4fa8d8', '#4fa8d8', '#4fa8d8'])}${seedling(10, 40)}${seedling(18, 40)}${seedling(28, 40)}` + g('a-bob', seedling(20, 33), '20px 30px'));
def('s2g:seasons', `${circ(14, 14, 9, '#4fa8d8')}${circ(34, 14, 9, '#7ac860')}${circ(14, 34, 9, '#f6c13a')}${circ(34, 34, 9, '#b08a5a')}<path d="M23 14h2M14 23v2M34 23v2M23 34h2" ${W}/>`);
def('s2g:brocade', `<rect x="4" y="10" width="40" height="28" rx="3" fill="#2a3a7a" ${W}/><path d="M8 24l5-6 5 6-5 6zM20 24l4-6 4 6-4 6zM30 24l5-6 5 6-5 6z" fill="#e8433a" ${W}/><path d="M6 14h36M6 34h36" stroke="#ffd23f" stroke-width="2.4"/>`);
/** the terraces of the planting game: rows (bottom first), each with its number of seedlings */
export function terraceSVG(rows: number[], cols = ['#7ac860', '#8fd06a', '#5fae4a', '#9ad870', '#6abf55']) {
  const n = rows.length, hh = 40 / n;
  return `<svg class="art s2-terr" viewBox="0 0 96 48" aria-hidden="true">${rows.map((c, i) => { const y = 46 - (i + 1) * hh, x0 = 2 + i * 6, w = 92 - i * 12;
    return `<path d="M${x0} ${y}h${w}v${hh}H${x0}z" fill="${c ? cols[i % cols.length] : '#4fa8d8'}" ${W}/>` + Array.from({ length: c }, (_, k) => seedling(x0 + 6 + k * Math.min(9, (w - 10) / Math.max(1, c)), y + hh - 1)).join(''); }).join('')}</svg>`;
}
/** one terrace in a season: water (spring), green (summer), gold (harvest), stubble (winter) */
export const seasonSVG = (k: number) => `<svg class="art" viewBox="0 0 48 48" aria-hidden="true">${steps([['#4fa8d8', '#7ac860', '#f6c13a', '#b08a5a'][k], ['#6ab8e0', '#5fae4a', '#e8b830', '#a07a4a'][k], ['#4fa8d8', '#8fd06a', '#f6c13a', '#b08a5a'][k]])}`
  + (k === 0 ? `<path d="M10 38h6M26 31h6" stroke="#d8f0ff" stroke-width="2" ${N}/>` : k === 1 ? seedling(14, 40) + seedling(26, 33) : k === 2 ? `<path d="M14 40q2-8 4-8M26 33q2-8 4-8" stroke="#c88a20" stroke-width="2.4" ${N}/>` : `<path d="M12 40v-3M18 40v-3M24 33v-3" stroke="#6a4a2a" stroke-width="2" ${N}/>`) + '</svg>';

// ---------- the Central Highlands ----------
const gongArt = (x: number, y: number, r: number, c = '#e8b830') => `${circ(x, y, r, c)}${circ(x, y, r * .45, '#c89020')}`;
def('s2:taynguyen', `<path d="M16 40V20l8-16 8 16v20z" fill="#b08a5a" ${W}/><path d="M12 22l12-20 12 20z" fill="#8a6a3a" ${W}/><path d="M18 40v6M30 40v6" ${W}/>` + g('a-pulse', gongArt(40, 30, 6), '40px 30px'));
def('s2:nharong', `<path d="M10 30L24 2l14 28z" fill="#8a6a3a" ${W}/><rect x="14" y="30" width="20" height="8" fill="#b08a5a" ${W}/><path d="M16 38v8M24 38v8M32 38v8" ${W}/><path d="M24 2v-0" ${W}/><path d="M20 30v-6h8v6" fill="#5a3a1a" ${W}/>`);
def('s2:comlam', `<rect x="18" y="4" width="12" height="40" rx="5" fill="#8cc65a" ${W}/><path d="M18 14h12M18 30h12" stroke="#5f9a3a" stroke-width="2"/><ellipse cx="24" cy="6" rx="6" ry="3" fill="#fff" ${W}/>` + g('a-smoke', `<path d="M22 2q-2-3 0-6M27 2q-2-3 0-6" stroke="#c8c0d0" stroke-width="2" stroke-linecap="round" ${N}/>`, '24px 0px'));
def('s2g:gong', `<path d="M8 12h32" stroke="#8a5a32" stroke-width="3" stroke-linecap="round"/><path d="M14 12v4M34 12v4" ${W}/>` + gongArt(14, 26, 10) + g('a-swing', gongArt(34, 24, 7, '#f6c13a'), '34px 12px'));
def('s2g:nharong', `<path d="M10 30L24 2l14 28z" fill="#8a6a3a" ${W}/><rect x="14" y="30" width="20" height="8" fill="#b08a5a" ${W}/><path d="M16 38v8M24 38v8" ${W}/>` + g('a-pulse', `${circ(36, 42, 5, '#fff')}<text x="36" y="45.5" text-anchor="middle" font-size="9" font-weight="900" fill="${O}" font-family="Fredoka,sans-serif">?</text>`, '36px 42px'));
const elephant = (x: number, y: number, s = 1, c = '#9a9aa8') => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="12" ry="8" fill="${c}" ${W}/>${circ(-12, -4, 6, c)}<path d="M-16 -2q-4 6-2 12" stroke="${c}" stroke-width="3.4" stroke-linecap="round" ${N}/><path d="M-16 -2q-4 6-2 12" stroke="${O}" stroke-width="1" ${N}/><path d="M-6 6v6M6 6v6" stroke="${O}" stroke-width="3"/>${dot(-13, -6, 1.2)}</g>`;
def('s2g:elephant', elephant(26, 26) + `<path d="M36 10q4-6 8 0q-4 6-8 0z" fill="#ffd23f" ${W}/>`);
/** gongs: big (low), middle and small (high) */
export const GONG_SIZES = [16, 12, 8];
export const gongSVG = (k: number, lit = false) => `<svg class="art" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4v${24 - GONG_SIZES[k]}" ${W}/>${gongArt(24, 28, GONG_SIZES[k], lit ? '#ffe680' : ['#c89020', '#e8b830', '#f6d35a'][k])}</svg>`;
export const elephantSVG = (bananas: number) => `<svg class="art" viewBox="0 0 48 48" aria-hidden="true">${elephant(24, 30)}${Array.from({ length: bananas }, (_, i) => `<path d="M${6 + (i % 5) * 8} ${8 + Math.floor(i / 5) * 7}q3 5 7 0" stroke="#ffd23f" stroke-width="3.4" stroke-linecap="round" ${N}/>`).join('')}</svg>`;
/** the nhà rông with one part left out: roof, stilts, ladder, door or the roof's tip */
export const NHARONG_PARTS = ['roof', 'stilts', 'ladder', 'door', 'tip'];
export function nharongSVG(missing: string | null) {
  const p = { roof: `<path d="M14 28L24 4l10 24z" fill="#8a6a3a" ${W}/>`, tip: `<path d="M22 6l2-6 2 6" fill="#e8433a" ${W}/>`, door: `<rect x="21" y="30" width="6" height="7" fill="#5a3a1a" ${W}/>`,
    stilts: `<path d="M16 38v8M24 38v8M32 38v8" ${W}/>`, ladder: `<path d="M36 46l4-10M40 46l4-10M37 43h4M39 39h4" stroke="${O}" stroke-width="1.8" ${N}/>` };
  return `<svg class="art" viewBox="0 0 48 48" aria-hidden="true"><rect x="14" y="28" width="20" height="10" fill="#b08a5a" ${W}/>${NHARONG_PARTS.filter(k => k !== missing).map(k => p[k]).join('')}${missing ? `<circle cx="${({ roof: 24, tip: 24, door: 24, stilts: 24, ladder: 40 })[missing]}" cy="${({ roof: 16, tip: 3, door: 33, stilts: 42, ladder: 41 })[missing]}" r="5" fill="none" stroke="#e8433a" stroke-width="2" stroke-dasharray="3 2"/>` : ''}</svg>`;
}
export const partSVG = (k: string) => `<svg class="art" viewBox="0 0 48 48" aria-hidden="true">${({ roof: `<path d="M8 40L24 6l16 34z" fill="#8a6a3a" ${W}/>`, tip: `<path d="M18 36l6-26 6 26z" fill="#e8433a" ${W}/>`, door: `<rect x="16" y="10" width="16" height="28" fill="#5a3a1a" ${W}/>`,
  stilts: `<path d="M12 8v32M24 8v32M36 8v32" stroke="#8a5a32" stroke-width="5" stroke-linecap="round"/>`, ladder: `<path d="M16 42l8-36M28 42l8-36M18 34h12M20 24h12M22 14h12" stroke="#8a5a32" stroke-width="3" stroke-linecap="round" ${N}/>` })[k]}</svg>`;
