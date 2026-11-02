// Drawings (v1.08 science, owner's plan 3 Nov 2026 AEDT, docs/plans/v108-owner-batch-20261103.md part D): the twelve
// new science experiments of Học vui › Khoa học (js/games/science2.ts), their game pictures and the things they show.
// Each is our own drawing; keys that are not emoji only ever show through pic() / artSVG().
import { O, g, circ, dot, sparkle, def, W, N } from './kit.js';

// ---------- small parts ----------
const pot = (inner = '') => `<path d="M12 30h24l-3 14H15z" fill="#d9774b" ${W}/><rect x="10" y="26" width="28" height="6" rx="2" fill="#e8925f" ${W}/>` + inner;
const soil = `<path d="M13 27h22" stroke="#6b4a2f" stroke-width="3" stroke-linecap="round"/>`;
const leaf = (x, y, r, f = '#5fd36a') => `<path d="M${x} ${y}c${-6 * r} ${-1 * r} ${-9 * r} ${-6 * r} ${-8 * r} ${-10 * r}c${5 * r} 0 ${9 * r} ${3 * r} ${8 * r} ${10 * r}z" fill="${f}" ${W}/>`;
const leafR = (x, y, r, f = '#5fd36a') => `<path d="M${x} ${y}c${6 * r} ${-1 * r} ${9 * r} ${-6 * r} ${8 * r} ${-10 * r}c${-5 * r} 0 ${-9 * r} ${3 * r} ${-8 * r} ${10 * r}z" fill="${f}" ${W}/>`;
const sunAt = (x, y, r) => `${Array.from({ length: 8 }, (_, k) => { const a = k * Math.PI / 4; return `<path d="M${(x + Math.cos(a) * (r + 2)).toFixed(1)} ${(y + Math.sin(a) * (r + 2)).toFixed(1)}L${(x + Math.cos(a) * (r + 6)).toFixed(1)} ${(y + Math.sin(a) * (r + 6)).toFixed(1)}" stroke="#ffb020" stroke-width="2.6" stroke-linecap="round"/>`; }).join('')}${circ(x, y, r, '#ffd23f')}`;
const cloud = (x, y, s = 1, f = '#fff') => `<path d="M${x - 10 * s} ${y + 5 * s}a${6 * s} ${6 * s} 0 0 1 ${2 * s}-${11 * s}a${7 * s} ${7 * s} 0 0 1 ${13 * s}-${2 * s}a${5 * s} ${5 * s} 0 0 1 ${7 * s} ${7 * s}a${3 * s} ${3 * s} 0 0 1 0 ${6 * s}z" fill="${f}" ${W}/>`;
const drop = (x, y, s = 1, f = '#5fb6ff') => `<path d="M${x} ${y - 5 * s}c${3 * s} ${4 * s} ${4 * s} ${6 * s} ${4 * s} ${8 * s}a${4 * s} ${4 * s} 0 0 1-${8 * s} 0c0-${2 * s} ${1 * s}-${4 * s} ${4 * s}-${8 * s}z" fill="${f}" ${W}/>`;
const wave = (y, f = '#7fd0f5') => `<path d="M2 ${y}q5-4 11 0t11 0 11 0 11 0V46H2z" fill="${f}" ${W}/>`;
const curl = (x, y) => `<path d="M${x} ${y}c-3-3 3-5 0-8s3-5 0-8" stroke="#9fb8d6" stroke-width="2.6" stroke-linecap="round" ${N}/>`;
const tree = (crown) => `<path d="M21 46V28h6v18" fill="#b07a4a" ${W}/>` + crown;
const gearPath = (cx, cy, r, n, f) => { let d = ''; for (let k = 0; k < n * 2; k++) { const a0 = k * Math.PI / n, a1 = (k + 1) * Math.PI / n, rr = k % 2 ? r : r + 3.2; d += `${k ? 'L' : 'M'}${(cx + Math.cos(a0) * rr).toFixed(1)} ${(cy + Math.sin(a0) * rr).toFixed(1)}L${(cx + Math.cos(a1) * rr).toFixed(1)} ${(cy + Math.sin(a1) * rr).toFixed(1)}`; } return `<path d="${d}z" fill="${f}" ${W}/>${circ(cx, cy, r * .32, '#fff')}`; };
const bin = (f, mark) => `<rect x="10" y="12" width="28" height="32" rx="4" fill="${f}" ${W}/><rect x="7" y="7" width="34" height="7" rx="3" fill="${f}" ${W}/><path d="M20 7V4h8v3" fill="none" ${W}/>` + mark;
const arrowRound = (cw) => cw
  ? `<path d="M10 26a14 14 0 1 1 6 11" stroke="#3b6fe0" stroke-width="4.4" stroke-linecap="round" ${N}/><path d="M10 33l6 5 2-8z" fill="#3b6fe0" stroke="#3b6fe0" stroke-width="2.4" stroke-linejoin="round"/>`
  : `<path d="M38 26a14 14 0 1 0-6 11" stroke="#e8433a" stroke-width="4.4" stroke-linecap="round" ${N}/><path d="M38 33l-6 5-2-8z" fill="#e8433a" stroke="#e8433a" stroke-width="2.4" stroke-linejoin="round"/>`;

// ---------- the twelve game pictures ----------
def('sci:plant', pot(soil) + g('a-sway', `<path d="M24 27V13" stroke="#2e9b4a" stroke-width="3" stroke-linecap="round"/>${leaf(24, 18, 1)}${leafR(24, 15, 1)}`, '24px 27px') + g('a-bob', drop(40, 9, .7), '40px 9px'));
def('sci:water', `${sunAt(10, 10, 5)}${cloud(32, 12, .9)}` + g('a-rise', `<path d="M14 40c-2-3 2-5 0-8M20 40c-2-3 2-5 0-8" stroke="#9fb8d6" stroke-width="2.4" stroke-linecap="round" ${N}/>`, '17px 36px') + g('a-bob', `${drop(32, 26, .6)}${drop(38, 31, .6)}`, '35px 28px') + wave(40));
def('sci:daynight', `<circle cx="24" cy="24" r="18" fill="#5fb6ff" ${W}/><path d="M24 6a18 18 0 0 1 0 36z" fill="#2b2f6b" opacity=".75"/><path d="M14 16c4 2 6 6 4 10s-6 4-6 8" fill="#5fd36a" stroke="none"/><circle cx="24" cy="24" r="18" fill="none" ${W}/>` + g('a-twinkle', sparkle(34, 16, .8), '34px 16px') + g('a-pulse', sunAt(6, 7, 3.4), '6px 7px'));
def('sci:seasons', `<path d="M24 24L24 4A20 20 0 0 1 44 24z" fill="#ffd0e6" ${W}/><path d="M24 24L44 24A20 20 0 0 1 24 44z" fill="#bff0b8" ${W}/><path d="M24 24L24 44A20 20 0 0 1 4 24z" fill="#ffd2a1" ${W}/><path d="M24 24L4 24A20 20 0 0 1 24 4z" fill="#e3f2ff" ${W}/>` + circ(32, 15, 3, '#ff7eb8') + circ(33, 33, 3.4, '#43c463') + leaf(16, 36, .55, '#ff8c1a') + g('a-twinkle', sparkle(14, 15, .8, '#fff'), '14px 15px'));
def('sci:homes', `<path d="M4 44h40" ${W}/><path d="M6 44a10 9 0 0 1 20 0z" fill="#8a5a3a" ${W}/><path d="M12 44a4 4 0 0 1 8 0z" fill="#3b2a4f"/><path d="M28 30c0 6 4 9 8 9s8-3 8-9z" fill="#c9a05a" ${W}/><path d="M29 31c2 2 6 3 7 3s5-1 7-3" stroke="#8a5a3a" stroke-width="1.6" ${N}/>` + g('a-hop', `${circ(36, 25, 4.5, '#ffd23f')}${dot(37.5, 24, 1)}<path d="M40 25l3 1-3 1z" fill="#ff8c1a"/>`, '36px 29px'));
def('sci:body', `${circ(24, 11, 7, '#ffd0a8')}<path d="M14 44V26c0-5 4-8 10-8s10 3 10 8v18z" fill="#5fb6ff" ${W}/><path d="M14 26l-6 10M34 26l6 10" ${W}/>` + g('a-pulse', `<path d="M24 34c-6-4-8-7-5-10 2-2 4-1 5 1 1-2 3-3 5-1 3 3 1 6-5 10z" fill="#e8433a" ${W}/>`, '24px 29px'));
def('sci:colours', `<path d="M6 30c0-12 9-22 20-22 9 0 16 5 16 12 0 5-5 6-9 6-3 0-5 2-4 5 1 4-2 7-6 7C12 38 6 36 6 30z" fill="#fff3d0" ${W}/>${circ(15, 22, 3.6, '#e8433a')}${circ(23, 15, 3.6, '#ffd23f')}${circ(32, 16, 3.6, '#3b6fe0')}${circ(14, 31, 3.6, '#43c463')}` + g('a-bob', `<path d="M36 40l8-12" stroke="#b07a4a" stroke-width="3.4" stroke-linecap="round"/><path d="M34 44c-1-3 0-5 2-5s3 2 2 4z" fill="#8a4fd6" ${W}/>`, '40px 34px'));
def('sci:ice', `<rect x="6" y="14" width="16" height="16" rx="3" fill="#cfefff" ${W} transform="rotate(-8 14 22)"/><path d="M9 18l5-1" stroke="#fff" stroke-width="2"/>` + g('a-bob', drop(30, 26, .9), '30px 26px') + g('a-rise', `${curl(40, 30)}`, '40px 26px') + `<path d="M4 42h40" ${W}/>`);
def('sci:rainbow', `<path d="M4 38a20 20 0 0 1 40 0" stroke="#e8433a" stroke-width="4" ${N}/><path d="M8.5 38a15.5 15.5 0 0 1 31 0" stroke="#ffb020" stroke-width="4" ${N}/><path d="M13 38a11 11 0 0 1 22 0" stroke="#43c463" stroke-width="4" ${N}/><path d="M17.5 38a6.5 6.5 0 0 1 13 0" stroke="#3b6fe0" stroke-width="4" ${N}/>` + g('a-bob', `<path d="M20 44l4-9 4 9z" fill="#e8f6ff" ${W}/>`, '24px 40px') + g('a-twinkle', sparkle(38, 10, .8), '38px 10px'));
def('sci:bulb', `<rect x="4" y="30" width="14" height="10" rx="2" fill="#ffd23f" ${W}/><rect x="11" y="30" width="7" height="10" fill="#3b2a4f"/><path d="M18 35h6v-13M11 30v-4h0" fill="none" ${W}/>` + g('a-pulse', `<path d="M24 22c-6 0-9-4-9-8a9 9 0 0 1 18 0c0 4-3 8-9 8z" fill="#fff07a" ${W}/><path d="M21 15l3 3 3-3" stroke="#ff8c1a" stroke-width="1.8" ${N}/>`, '24px 14px') + `<rect x="20" y="22" width="8" height="5" rx="1.5" fill="#c9c9d6" ${W}/><path d="M24 27v13H36" fill="none" ${W}/>`);
def('sci:gears', g('a-spin', gearPath(17, 28, 10, 8, '#ffb020'), '17px 28px') + g('a-spin', gearPath(34, 14, 7, 6, '#5fb6ff'), '34px 14px'));
def('sci:recycle', `<path d="M24 6l7 11h-5l-2 3-6-10z" fill="#43c463" ${W}/><path d="M39 30l-6 11-2-5h-4l5-10z" fill="#43c463" ${W}/><path d="M9 33l7-11 2 5 4 1-6 9z" fill="#43c463" ${W}/>` + g('a-twinkle', sparkle(24, 30, .9), '24px 30px'));
def('sci2:fact', `<path d="M24 32c-8 0-12-6-12-12a12 12 0 0 1 24 0c0 6-4 12-12 12z" fill="#fff07a" ${W}/><rect x="19" y="32" width="10" height="7" rx="2" fill="#c9c9d6" ${W}/><path d="M21 43h6" ${W}/>` + g('a-twinkle', sparkle(40, 8, 1), '40px 8px') + g('a-twinkle2', sparkle(8, 10, .8), '8px 10px') + `<path d="M24 14v8M20 18h8" stroke="#ffb020" stroke-width="3" stroke-linecap="round"/>`);

// ---------- Grow a Plant ----------
def('sci2:pot', pot(soil) + `<path d="M22 27c0-3 4-3 4 0" fill="#b07a4a" ${W}/>`);
def('sci2:grown', pot(soil) + g('a-sway', `<path d="M24 27V8" stroke="#2e9b4a" stroke-width="3.4" stroke-linecap="round"/>${leaf(24, 22, 1.2)}${leafR(24, 17, 1.2)}${leaf(24, 12, .9)}${circ(24, 7, 4, '#ff7eb8')}${dot(24, 7, 1.6, '#ffd23f')}`, '24px 27px'));
def('sci2:pale', pot(soil) + `<path d="M24 27c0-6 2-10 6-14" stroke="#d9d07a" stroke-width="2.4" stroke-linecap="round" ${N}/>${leafR(29, 15, .55, '#efe7a0')}${leaf(26, 21, .5, '#efe7a0')}`);
def('sci2:week', `<rect x="6" y="9" width="36" height="33" rx="4" fill="#fff" ${W}/><path d="M6 17h36" ${W}/><rect x="6" y="9" width="36" height="8" rx="4" fill="#e8433a" ${W}/><path d="M14 5v8M34 5v8" ${W}/>` + Array.from({ length: 7 }, (_, k) => dot(11 + (k % 4) * 8.5, 24 + Math.floor(k / 4) * 9, 2.2, k === 6 ? '#e8433a' : '#c9b8dc')).join('') + g('a-hop', `<path d="M34 34l4 4 6-9" stroke="#43c463" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" ${N}/>`, '38px 34px'));
def('sci2:dark', `<rect x="6" y="8" width="36" height="34" rx="4" fill="#2b2f6b" ${W}/><path d="M24 8v34" stroke="#55598f" stroke-width="2"/>${dot(20, 26, 1.8, '#c9b8dc')}${dot(28, 26, 1.8, '#c9b8dc')}` + g('a-twinkle', `<path d="M33 14a5 5 0 1 0 4 8 4 4 0 1 1-4-8z" fill="#ffd23f"/>`, '35px 18px'));

// ---------- Water Cycle ----------
def('sci2:seawarm', sunAt(24, 11, 6) + wave(30) + g('a-rise', `${curl(14, 28)}${curl(34, 28)}`, '24px 24px'));
def('sci2:vapour', g('a-rise', `${curl(14, 40)}${curl(24, 36)}${curl(34, 40)}`, '24px 30px') + g('a-twinkle', `${dot(19, 14, 1.6, '#9fb8d6')}${dot(29, 10, 1.6, '#9fb8d6')}${dot(24, 20, 1.6, '#9fb8d6')}`, '24px 15px'));
def('sci2:hillrain', `<path d="M2 44c8-16 16-22 22-22s14 8 22 22z" fill="#8bd47a" ${W}/>${cloud(24, 10, .9, '#c9d3e6')}` + g('a-bob', `<path d="M16 20l-2 5M24 20l-2 5M32 20l-2 5" stroke="#3b6fe0" stroke-width="2.4" stroke-linecap="round"/>`, '24px 22px') + `<path d="M30 34c3 3 7 4 10 10" stroke="#5fb6ff" stroke-width="3" ${N}/>`);
def('sci2:puddle', `<path d="M4 42h40" ${W}/><ellipse cx="24" cy="38" rx="17" ry="5" fill="#7fd0f5" ${W}/><path d="M15 37q4-2 8 0" stroke="#e6f7ff" stroke-width="2" ${N}/>` + sunAt(36, 12, 5));
def('sci2:washing', `<path d="M4 8h40" ${W}/><path d="M8 8l3 4v18h10V12l3-4" fill="#ff9ecb" ${W}/><path d="M28 8h12v14l-6 4-6-4z" fill="#5fb6ff" ${W}/>` + g('a-rise', `${curl(16, 44)}${curl(34, 40)}`, '24px 36px'));
def('sci2:river', `<path d="M4 6c10 6 6 14 14 20s14 6 26 10v10H4z" fill="#8bd47a" ${W}/><path d="M10 6c8 8 2 14 12 20s14 8 22 12" stroke="#5fb6ff" stroke-width="6" stroke-linecap="round" ${N}/>` + g('a-bob', `<path d="M18 22l3 2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`, '19px 23px'));

// ---------- Day and Night ----------
def('sci2:house', `<path d="M10 22L24 9l14 13" fill="#e8433a" ${W}/><rect x="13" y="21" width="22" height="20" fill="#fff3d0" ${W}/><rect x="21" y="29" width="6" height="12" fill="#b07a4a" ${W}/><rect x="15" y="25" width="5" height="5" fill="#ffd23f" ${W}/>`);
def('sci2:sunset', `<path d="M4 34h40" ${W}/><path d="M12 34a12 12 0 0 1 24 0z" fill="#ff8c1a" ${W}/><path d="M24 14v4M10 20l3 3M38 20l-3 3" stroke="#ff8c1a" stroke-width="2.6" stroke-linecap="round"/><path d="M8 40h32M14 45h20" stroke="#ff9ecb" stroke-width="2.4" stroke-linecap="round"/>` + g('a-bob', `<path d="M20 28l4 4 4-4" stroke="${O}" stroke-width="2.4" ${N}/>`, '24px 30px'));

// ---------- Four Seasons ----------
def('sci2:tree', tree(`<circle cx="24" cy="18" r="14" fill="#cfe9c7" ${W}/>`));
def('sci2:spring', tree(`<circle cx="24" cy="18" r="14" fill="#a8e6a1" ${W}/>${circ(16, 14, 3, '#ff9ecb')}${circ(29, 11, 3, '#ff9ecb')}${circ(31, 22, 3, '#ff9ecb')}${circ(20, 24, 3, '#ff9ecb')}`) + g('a-twinkle', sparkle(42, 8, .8), '42px 8px'));
def('sci2:summer', tree(`<circle cx="24" cy="18" r="15" fill="#43c463" ${W}/>${circ(18, 15, 2.6, '#e8433a')}${circ(30, 20, 2.6, '#e8433a')}`) + sunAt(41, 7, 4));
def('sci2:autumn', tree(`<circle cx="24" cy="18" r="13" fill="#ff8c1a" ${W}/><path d="M16 14c3 2 6 2 9 0M22 23c3 1 6 1 8-1" stroke="#c4501c" stroke-width="1.8" ${N}/>`) + g('a-bob', `${leaf(8, 34, .5, '#ffb020')}${leafR(40, 40, .5, '#e8433a')}`, '24px 36px'));
def('sci2:winter', `<path d="M21 46V24h6v22" fill="#b07a4a" ${W}/><path d="M24 26l-9-11M24 28l9-12M18 19l-5 1M30 19l5-2" stroke="#8a5a3a" stroke-width="3" stroke-linecap="round" ${N}/><path d="M12 14q3-3 6 0M28 15q3-3 6 0" stroke="#fff" stroke-width="3" stroke-linecap="round" ${N}/><path d="M2 46c6-4 38-4 44 0z" fill="#fff" ${W}/>` + g('a-bob', `${dot(10, 30, 1.8, '#c9e6ff')}${dot(38, 28, 1.8, '#c9e6ff')}${dot(34, 8, 1.8, '#c9e6ff')}${dot(14, 6, 1.8, '#c9e6ff')}`, '24px 18px'));

// ---------- Animal Homes ----------
def('sci2:hive', `<path d="M24 4v4" ${W}/><path d="M14 12h20a6 6 0 0 1 0 8 6 6 0 0 1 2 8 6 6 0 0 1-4 8H16a6 6 0 0 1-4-8 6 6 0 0 1 2-8 6 6 0 0 1 0-8z" fill="#ffc94a" ${W}/><path d="M13 20h22M12 28h24" stroke="#c98a1a" stroke-width="2"/><path d="M21 36a3 3 0 0 1 6 0z" fill="#3b2a4f"/>`);
def('sci2:burrow', `<path d="M2 26h44v20H2z" fill="#a8774f" ${W}/><path d="M2 26h44" stroke="#43c463" stroke-width="4"/><path d="M8 26c4 8 10 12 18 12s10 4 16 4" stroke="#6b4a2f" stroke-width="7" stroke-linecap="round" ${N}/><ellipse cx="10" cy="27" rx="6" ry="4" fill="#3b2a4f"/>${dot(36, 34, 1.4, '#6b4a2f')}${dot(18, 42, 1.4, '#6b4a2f')}`);
def('sci2:pond', `<ellipse cx="24" cy="32" rx="20" ry="11" fill="#7fd0f5" ${W}/><path d="M14 32q4-2 8 0t8 0" stroke="#e6f7ff" stroke-width="2" ${N}/><path d="M33 26a5 3 0 1 1 6 3l-4-1z" fill="#43c463" ${W}/><path d="M8 26V12M11 24V14" stroke="#2e9b4a" stroke-width="2.4" stroke-linecap="round"/><rect x="6.5" y="9" width="3" height="7" rx="1.5" fill="#8a5a3a"/>`);
def('sci2:cave', `<path d="M2 44c0-22 10-36 22-36s22 14 22 36z" fill="#a8a0b8" ${W}/><path d="M12 44c0-12 5-20 12-20s12 8 12 20z" fill="#3b2a4f"/><path d="M10 18l4 2M34 14l3 4" stroke="#7a7290" stroke-width="2" stroke-linecap="round"/>`);
def('sci2:treehole', `<path d="M14 46V4h20v42" fill="#b07a4a" ${W}/><path d="M18 10c2 4 2 8 0 12M30 30c-2 4-2 8 0 12" stroke="#8a5a3a" stroke-width="1.8" ${N}/><ellipse cx="24" cy="24" rx="5" ry="7" fill="#3b2a4f" ${W}/>`);
def('sci2:pouch', `<path d="M8 20c0-8 7-12 16-12s16 4 16 12v8c0 10-7 16-16 16S8 38 8 28z" fill="#c98a5a" ${W}/><path d="M14 30c2 6 6 9 10 9s8-3 10-9" fill="#e0a87a" ${W}/>` + g('a-hop', `${circ(24, 27, 5, '#c98a5a')}<path d="M21 22l-1-5M27 22l1-5" ${W}/>${dot(22.5, 27, 1)}${dot(25.5, 27, 1)}`, '24px 30px'));

// ---------- My Body ----------
def('sci2:lungs', `<path d="M24 6v14" ${W}/><path d="M24 18l-4 4M24 18l4 4" ${W}/><path d="M20 16c-8 0-12 10-12 20 0 5 3 7 7 6 4-1 6-4 6-8V18z" fill="#ff9ecb" ${W}/><path d="M28 16c8 0 12 10 12 20 0 5-3 7-7 6-4-1-6-4-6-8V18z" fill="#ff9ecb" ${W}/>`);
def('sci2:stomach', `<path d="M18 6v8c0 4-8 6-8 16 0 8 6 14 16 14 8 0 12-6 12-12 0-8-6-12-10-10-3 2-4 0-4-4V6" fill="#ffb3a1" ${W}/><path d="M18 30c3 4 9 5 13 2" stroke="#d9705a" stroke-width="2" ${N}/>`);
const heartP = `<path d="M24 40c-12-8-16-14-11-20 4-4 9-3 11 1 2-4 7-5 11-1 5 6 1 12-11 20z" fill="#e8433a" ${W}/>`;
def('sci2:fastbeat', g('a-pulse', heartP, '24px 28px') + `<path d="M2 14h6l3-6 4 12 3-6h4M30 14h4l3-6 4 12 3-6h2" stroke="#3b6fe0" stroke-width="2.4" stroke-linejoin="round" ${N}/>`);
def('sci2:slowbeat', heartP + `<path d="M2 12h14l3-5 3 10 3-5h21" stroke="#3b6fe0" stroke-width="2.4" stroke-linejoin="round" ${N}/>` + g('a-bob', `<text x="34" y="44" font-size="9" font-weight="900" fill="#8a5cf6" font-family="Fredoka,sans-serif">z</text>`, '36px 40px'));
def('sci2:bigger', `${circ(24, 24, 16, '#bfe3ff')}<path d="M8 8l6 6M40 8l-6 6M8 40l6-6M40 40l-6-6" stroke="#43c463" stroke-width="3.4" stroke-linecap="round"/><path d="M8 8h5M8 8v5M40 8h-5M40 8v5M8 40h5M8 40v-5M40 40h-5M40 40v-5" stroke="#43c463" stroke-width="3" stroke-linecap="round"/>`);
def('sci2:smaller', `${circ(24, 24, 7, '#bfe3ff')}<path d="M6 6l8 8M42 6l-8 8M6 42l8-8M42 42l-8-8" stroke="#e8433a" stroke-width="3.4" stroke-linecap="round"/><path d="M14 14h-5M14 14v-5M34 14h5M34 14v-5M14 34h-5M14 34v5M34 34h5M34 34v5" stroke="#e8433a" stroke-width="3" stroke-linecap="round"/>`);

// ---------- Ice Melts ----------
def('sci2:freezer', `<rect x="8" y="4" width="32" height="40" rx="5" fill="#e8f6ff" ${W}/><path d="M8 18h32" ${W}/><path d="M34 9v5M34 23v8" ${W}/><path d="M20 26v10M15 28l10 6M25 28l-10 6" stroke="#5fb6ff" stroke-width="2.2" stroke-linecap="round"/>`);
def('sci2:melted', `<path d="M4 40c0-4 6-6 10-5 2-4 8-5 12-2 4-2 10-1 12 3 4 0 6 2 6 4 0 3-4 4-20 4S4 43 4 40z" fill="#c98a5a" ${W}/><path d="M12 38q4-2 8 0" stroke="#fff" stroke-width="2" opacity=".6" ${N}/>` + g('a-bob', drop(34, 24, .7, '#c98a5a'), '34px 24px'));

// ---------- Rainbow Light ----------
def('sci2:norainbow', `${cloud(24, 24, 1.2, '#c9c9d6')}<path d="M10 38l28-28" stroke="#e8433a" stroke-width="4" stroke-linecap="round"/>`);
def('sci2:prism', `<path d="M24 6l18 34H6z" fill="#e8f6ff" ${W}/><path d="M24 14l-10 20" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>`);
def('sci2:hose', `<path d="M4 44c8 0 6-12 14-12h6" stroke="#43c463" stroke-width="6" stroke-linecap="round" ${N}/><rect x="22" y="28" width="9" height="8" rx="2" fill="#ffb020" ${W}/>` + g('a-bob', `${drop(36, 26, .45)}${drop(41, 22, .45)}${drop(39, 32, .45)}${drop(44, 28, .45)}`, '40px 27px'));
def('sci2:torch', `<path d="M6 20h16l8-6v20l-8-6H6z" fill="#5f86b0" ${W}/><rect x="10" y="22" width="6" height="4" rx="1" fill="#ffd23f"/><path d="M32 16l12-6M32 24h12M32 32l12 6" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/>`);
def('sci2:disc', `<circle cx="24" cy="24" r="18" fill="#e6e6ef" ${W}/><path d="M12 14a16 16 0 0 1 12-6" stroke="#e8433a" stroke-width="3" ${N}/><path d="M10 20a16 16 0 0 1 8-10" stroke="#ffd23f" stroke-width="3" ${N}/><path d="M36 34a16 16 0 0 1-10 6" stroke="#43c463" stroke-width="3" ${N}/><path d="M38 28a16 16 0 0 1-6 10" stroke="#3b6fe0" stroke-width="3" ${N}/><circle cx="24" cy="24" r="5" fill="#fff" ${W}/>`);

// ---------- Light the Bulb ----------
def('sci2:bulboff', `<path d="M24 32c-8 0-12-6-12-12a12 12 0 0 1 24 0c0 6-4 12-12 12z" fill="#d6d6e2" ${W}/><path d="M20 22l4 4 4-4" stroke="#8a8aa0" stroke-width="2" ${N}/><rect x="19" y="32" width="10" height="8" rx="2" fill="#9a9aa6" ${W}/>`);
def('sci2:rubber', `<path d="M8 30l14-16 18 10-14 16z" fill="#ff9ecb" ${W}/><path d="M8 30l6 4 12 6" fill="#5fb6ff" ${W}/><path d="M14 34l14-16" stroke="${O}" stroke-width="2" opacity=".4"/>`);
def('sci2:foil', `<path d="M8 12l30-4 4 26-30 6z" fill="#d9dbe6" ${W}/><path d="M14 16l10 8 8-10M16 32l8-6 10 6" stroke="#fff" stroke-width="2" ${N}/>` + g('a-twinkle', sparkle(36, 14, .7, '#fff'), '36px 14px'));

// ---------- Gears Turn ----------
def('sci2:cw', arrowRound(true) + circ(24, 24, 4, '#3b6fe0'));
def('sci2:ccw', arrowRound(false) + circ(24, 24, 4, '#e8433a'));
def('sci2:gearbig', gearPath(24, 24, 15, 12, '#ffb020'));
def('sci2:gearsmall', gearPath(24, 24, 8, 7, '#5fb6ff') + g('a-twinkle', `<path d="M38 10l4-4M40 16h5M34 6V2" stroke="#ffb020" stroke-width="2.4" stroke-linecap="round"/>`, '40px 10px'));

// ---------- Recycle Sort ----------
def('sci2:binpaper', bin('#3b6fe0', `<rect x="17" y="20" width="14" height="17" rx="1.5" fill="#fff" ${W}/><path d="M20 25h8M20 29h8M20 33h5" stroke="#3b6fe0" stroke-width="1.8"/>`));
def('sci2:binrecycle', bin('#ffd23f', `<path d="M24 18l5 8h-10z" fill="#43c463" ${W}/><path d="M18 30l-3 6h8zM30 30l3 6h-8z" fill="#43c463" ${W}/>`));
def('sci2:binfood', bin('#43c463', `<path d="M24 36c-6 0-8-6-6-11 2-4 6-4 6-4s4 0 6 4c2 5 0 11-6 11z" fill="#e8433a" ${W}/><path d="M24 21c0-3 2-4 4-5" stroke="${O}" stroke-width="2" ${N}/>`));
def('sci2:binrest', bin('#e8433a', `<path d="M17 22l14 14M31 22L17 36" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>`));
def('sci2:dropoff', `<path d="M6 18l18-12 18 12" fill="#ff8c1a" ${W}/><rect x="9" y="18" width="30" height="26" rx="2" fill="#fff3d0" ${W}/><rect x="14" y="24" width="20" height="5" rx="2" fill="#3b2a4f"/><rect x="20" y="31" width="8" height="12" rx="1.5" fill="#43c463" ${W}/><path d="M22 33v-2M26 33v-2" ${W}/><path d="M24 35l-1.5 3h3L24 41" stroke="#ffd23f" stroke-width="1.6" ${N}/>`);
def('sci2:chips', `<path d="M10 8l28 0-2 4 2 4-2 4 2 4-2 4 2 4-2 4 2 4H10l2-4-2-4 2-4-2-4 2-4-2-4 2-4-2-4z" fill="#e8433a" ${W}/><circle cx="24" cy="24" r="7" fill="#ffd23f" ${W}/><path d="M14 10h20" stroke="#e6e6ef" stroke-width="3"/>`);
