// The drawing kit (split from js/art.ts, v1.07): the outline, the small shapes, the picture table ART,
// def() (sets a picture) and add() (sets it only when it has none yet).
export const O = '#3b2a4f', W = `stroke="${O}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`, N = 'fill="none"';
export const svg = (body, cls = '') => `<svg class="art ${cls}" viewBox="0 0 48 48" aria-hidden="true">${body}</svg>`;
export const g = (cls, body, o = '24px 24px') => `<g class="${cls}" style="transform-origin:${o}">${body}</g>`;
export const circ = (x, y, r, f, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${W} ${extra}/>`;
export const dot = (x, y, r = 1.8, f = O) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/>`;
export const eyes = (x1, x2, y, r = 1.8) => `<g class="a-blink" style="transform-origin:24px ${y}px">${dot(x1, y, r)}${dot(x2, y, r)}</g>`;
export const smile = (x, y, w = 6) => `<path d="M${x - w / 2} ${y}q${w / 2} ${w / 2.2} ${w} 0" ${W} ${N}/>`;
export const star5 = (cx, cy, r, f) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r * .45 : r; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * k).toFixed(1) + ' ' + (cy + Math.sin(a) * k).toFixed(1); } return `<path d="${d}z" fill="${f}" ${W}/>`; };
export const sparkle = (x, y, s = 1, f = '#fff6b0') => `<path d="M${x} ${y - 4 * s}l${s} ${3 * s} ${3 * s} ${s}-${3 * s} ${s}-${s} ${3 * s}-${s}-${3 * s}-${3 * s}-${s} ${3 * s}-${s}z" fill="${f}" stroke="${O}" stroke-width="1.2" stroke-linejoin="round"/>`;

export const ART = {};
export const def = (keys: string, body: string, cls = '') => { for (const k of keys.split(' ')) ART[k] = svg(body, cls); };
export const add = (keys: string, body: string, cls = '') => { for (const k of keys.split(' ')) if (!ART[k]) ART[k] = svg(body, cls); };
