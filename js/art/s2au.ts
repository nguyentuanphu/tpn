// Drawings (v1.08d s2au): the pictures of Season 2, Australia (the Great Barrier Reef, Tasmania, Perth and Rottnest
// Island): its games (js/content/s2au-games.ts), foods, places and calendar entries, each its own drawing.
// Keys that are not emoji only ever show through pic() / artSVG().
import { O, g, circ, dot, sparkle, def, W, N, eyes, smile } from './kit.js';

const fish = (body: string, tail: string, extra = '') => `<path d="M8 24c6-10 22-12 30 0-8 12-24 10-30 0z" fill="${body}" ${W}/><path d="M37 24l8-7v14z" fill="${tail}" ${W}/>${dot(15, 22, 2)}${extra}`;
const shell = (x: number, y: number, s: number, f: string) => `<ellipse cx="${x}" cy="${y}" rx="${10 * s}" ry="${7.5 * s}" fill="${f}" ${W}/><path d="M${x - 6 * s} ${y}h${12 * s}M${x} ${y - 7 * s}v${14 * s}" stroke="#4a6a2a" stroke-width="1.4" ${N}/>`;
const turtleBody = (s = 1, f = '#7cc35a') => `<g transform="translate(${24 - 24 * s} ${24 - 24 * s}) scale(${s})">${[[13, 16], [35, 16], [13, 33], [35, 33]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="${f}" ${W} transform="rotate(${x < 24 ? -30 : 30} ${x} ${y})"/>`).join('')}${circ(24, 9, 5, f)}${dot(22, 8, 1.2)}${dot(26, 8, 1.2)}${shell(24, 25, 1, '#4f9a3a')}</g>`;
const coral = (f: string) => `<path d="M24 44V30M24 32l-8-8V14M24 30l9-9V12M16 24l-5-4V12M33 21l5-5V9" stroke="${f}" stroke-width="5" stroke-linecap="round" ${N}/><path d="M24 44V30M24 32l-8-8V14M24 30l9-9V12M16 24l-5-4V12M33 21l5-5V9" stroke="${O}" stroke-width="1.2" stroke-linecap="round" ${N} opacity=".5"/>`;
const sea = `<rect x="2" y="2" width="44" height="44" rx="10" fill="#7fd8f0" ${W}/>`;

// ---------- the reef's animals ----------
def('s2:seaturtle', turtleBody(.95));
def('s2:babyturtle', g('a-bob', turtleBody(.75, '#a8d870')));
def('s2:clown', fish('#ff8a2a', '#ff8a2a', `<path d="M19 15v18M28 14v20" stroke="#fff" stroke-width="3"/><path d="M19 15v18M28 14v20" stroke="${O}" stroke-width=".8" opacity=".5"/>`));
def('s2:bluetang', fish('#3b6fe0', '#ffd23f', `<path d="M14 26c6 4 14 4 20-2" stroke="#1a2a6a" stroke-width="2.4" ${N}/>`));
def('s2:starfish', `<path d="M24 5l5 12 13 1-10 8 4 13-12-7-12 7 4-13-10-8 13-1z" fill="#ff7a5a" ${W}/>${dot(24, 20, 1.2, '#fff')}${dot(20, 25, 1.2, '#fff')}${dot(28, 25, 1.2, '#fff')}`);
def('s2:ray', `<path d="M24 10c8 0 18 8 20 16-8-2-14 0-20 6-6-6-12-8-20-6 2-8 12-16 20-16z" fill="#8a9ab8" ${W}/><path d="M24 32c1 6 4 10 8 12" stroke="${O}" stroke-width="2.4" ${N}/>${dot(20, 20, 1.6)}${dot(28, 20, 1.6)}`);
def('s2:octopus', `<path d="M10 40c2-6 4-10 4-14M18 42c0-6 1-10 2-14M30 42c0-6-1-10-2-14M38 40c-2-6-4-10-4-14" stroke="#c060c0" stroke-width="4.4" stroke-linecap="round" ${N}/><path d="M10 26c0-12 6-20 14-20s14 8 14 20c-8 4-20 4-28 0z" fill="#d070d0" ${W}/>` + eyes(19, 29, 18, 2) + smile(24, 23, 6));
def('s2:whale', `<path d="M4 28c4-10 18-14 30-10 6 2 8 6 8 10 0 6-8 10-20 10S6 36 4 28z" fill="#5a7ab0" ${W}/><path d="M42 26l4-8M42 26l4 6" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/><path d="M8 30c8 4 20 4 30 0" stroke="#e8eef8" stroke-width="2" ${N}/>${dot(14, 26, 1.8)}<path d="M20 12c-2-4 0-6 2-6M22 12c2-4 4-4 6-3" stroke="#7fd8f0" stroke-width="2.2" stroke-linecap="round" ${N}/>`);
def('s2:anemone', `<path d="M10 40c4-2 24-2 28 0" stroke="${O}" stroke-width="2.6" ${N}/>${[10, 15, 20, 25, 30, 35, 39].map((x, i) => `<path d="M${x} 40c-2-8 ${i % 2 ? 3 : -3}-14 ${i % 2 ? 1 : -1}-22" stroke="#ff9ec4" stroke-width="4" stroke-linecap="round" ${N}/>`).join('')}`);
def('s2:coral', coral('#ff6a8a'));
def('s2:whitecoral', coral('#f4f4f0'));
def('s2:weed', g('a-sway', `<path d="M16 46c-4-10 4-14 0-24s4-14 2-18M28 46c4-8-4-12 0-20s-2-12 2-16" stroke="#3f9a4a" stroke-width="4.4" stroke-linecap="round" ${N}/>`, '24px 46px'));
def('s2:rock', `<path d="M6 38c0-10 8-18 18-18s18 8 18 18z" fill="#9a9a96" ${W}/><path d="M16 30c2-3 6-4 9-3" stroke="#fff" stroke-width="2" opacity=".6" ${N}/>`);
def('s2:wave', `${sea}<path d="M6 20c4-4 8 4 12 0s8 4 12 0 8 4 12 0M6 32c4-4 8 4 12 0s8 4 12 0 8 4 12 0" stroke="#fff" stroke-width="3" stroke-linecap="round" ${N}/>`);
def('s2:sand', `<rect x="4" y="4" width="40" height="40" rx="9" fill="#f2d48a" ${W}/>${dot(14, 16, 1.6, '#c8a050')}${dot(30, 12, 1.4, '#c8a050')}${dot(22, 30, 1.6, '#c8a050')}${dot(36, 34, 1.4, '#c8a050')}<path d="M12 36l3-3 3 3M28 22l3-3 3 3" stroke="#c8a050" stroke-width="1.6" ${N}/>`);

// ---------- the reef: things to wear and do ----------
def('s2:mask', `<rect x="7" y="14" width="30" height="16" rx="7" fill="#7fd8f0" ${W}/><path d="M22 14v16" stroke="${O}" stroke-width="2"/><path d="M37 22h5V6" stroke="#ff8a2a" stroke-width="4" stroke-linecap="round" ${N}/><path d="M37 22h5V6" stroke="${O}" stroke-width="1" ${N}/><path d="M7 22H3" stroke="${O}" stroke-width="3"/>`);
def('s2:snorkel', `${sea}<path d="M4 18c6-3 10 3 16 0s10 3 16 0 8 2 8 2" stroke="#fff" stroke-width="2.4" ${N}/>${circ(20, 28, 9, '#ffd8b8')}<rect x="12" y="22" width="16" height="8" rx="4" fill="#7fd8f0" ${W}/><path d="M29 26h5V10" stroke="#ff8a2a" stroke-width="4" stroke-linecap="round" ${N}/>${g('a-bob', `<circle cx="38" cy="38" r="2.5" fill="#fff" ${W}/>`, '38px 38px')}`);
def('s2:turtle', `${sea}<path d="M2 34h44v10H2z" fill="#f2d48a"/>` + g('a-bob', turtleBody(.6, '#a8d870')));
def('s2:reefquiz', `${sea}${circ(16, 30, 9, '#ffd23f')}<text x="12" y="35" font-size="14" font-weight="900" fill="${O}" font-family="Fredoka,sans-serif">?</text><g transform="translate(14 -8) scale(.7)">${fish('#ff8a2a', '#ff8a2a', `<path d="M19 15v18M28 14v20" stroke="#fff" stroke-width="3"/>`)}</g>`);
def('s2:sunnies', `<rect x="5" y="18" width="16" height="11" rx="5" fill="#2a2a3a" ${W}/><rect x="27" y="18" width="16" height="11" rx="5" fill="#2a2a3a" ${W}/><path d="M21 22h6" stroke="${O}" stroke-width="2.6"/>`);
def('s2:sunhat', `<ellipse cx="24" cy="30" rx="20" ry="6" fill="#f2d48a" ${W}/><path d="M13 29c0-10 5-16 11-16s11 6 11 16z" fill="#f6dfa0" ${W}/><path d="M13 26h22" stroke="#e8433a" stroke-width="3"/>`);
def('s2:raincoat', `<path d="M16 8h16l8 10-4 4-2-3v23H14V19l-2 3-4-4z" fill="#ffd23f" ${W}/><path d="M24 8v34" stroke="${O}" stroke-width="1.6"/>${dot(27, 18, 1.4)}${dot(27, 26, 1.4)}`);
def('s2:look', `<path d="M4 24c6-10 14-14 20-14s14 4 20 14c-6 10-14 14-20 14S10 34 4 24z" fill="#fff" ${W}/>${circ(24, 24, 7, '#3b8fc8')}${dot(24, 24, 3)}`);
def('s2:rubbish', `<path d="M12 16h24l-3 28H15z" fill="#9aa0a8" ${W}/><path d="M9 16h30M20 12h8" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/><path d="M20 22v16M28 22v16" stroke="${O}" stroke-width="1.8"/>`);
def('s2:feet', `<ellipse cx="17" cy="28" rx="6" ry="10" fill="#ffd8b8" ${W}/><ellipse cx="31" cy="28" rx="6" ry="10" fill="#ffd8b8" ${W}/>${[13, 16, 19].map(x => dot(x, 16, 1.6, '#ffd8b8')).join('')}`);

// ---------- places (Pad map, calendar) ----------
def('s2:reef', `${sea}${coral('#ff6a8a').replace(/M24 44/g, 'M14 44')}<g transform="translate(18 -2) scale(.55)">${fish('#ff8a2a', '#ff8a2a')}</g>${sparkle(36, 34, 1)}`);
def('s2:cradle', `<rect x="2" y="2" width="44" height="44" rx="10" fill="#bfe4f2" ${W}/><path d="M4 40l10-18 6 8 8-20 6 12 4-4 6 22z" fill="#6a7a8a" ${W}/><path d="M24 14l3 6-3-1-3 3z" fill="#fff"/><path d="M2 40h44v6H2z" fill="#3f8a4a"/>${[8, 14, 38].map(x => `<path d="M${x} 42l3-8 3 8z" fill="#2f6a3a" ${W}/>`).join('')}`);
def('s2:quokka', `${circ(24, 28, 15, '#b08a5a')}${circ(13, 14, 5, '#b08a5a')}${circ(35, 14, 5, '#b08a5a')}${circ(13, 14, 2, '#e8b890')}${circ(35, 14, 2, '#e8b890')}<ellipse cx="24" cy="33" rx="8" ry="6" fill="#e8c8a0" ${W}/>` + eyes(18, 30, 25, 2) + dot(24, 30, 2) + `<path d="M18 35q6 6 12 0" fill="#fff" ${W}/>`);
def('s2:beach', `<rect x="2" y="2" width="44" height="44" rx="10" fill="#bfe4f2" ${W}/>${circ(36, 13, 6, '#ffd23f')}<path d="M2 30c8-3 14 3 22 0s14 3 22 0v16H2z" fill="#4fa8d8"/><path d="M2 38h44v8H2z" fill="#f2d48a"/><path d="M12 38V22" stroke="${O}" stroke-width="2"/><path d="M4 24c4-6 12-6 16 0z" fill="#e8433a" ${W}/>`);

// ---------- foods (each region's local food: js/data.ts FEAST) ----------
def('s2:prawns', `<ellipse cx="24" cy="34" rx="20" ry="7" fill="#fff" ${W}/>${[14, 26].map(x => `<path d="M${x} 32c-6-2-6-12 2-14 8-2 12 6 8 10" fill="#ff8a5a" ${W}/><path d="M${x + 2} 22l3 3M${x + 5} 20l1 4" stroke="${O}" stroke-width="1.6"/>`).join('')}<path d="M36 30l6-4" stroke="#7aa65a" stroke-width="3" stroke-linecap="round"/>`);
def('s2:crumble', `<path d="M6 26h36l-4 16H10z" fill="#f2f2f2" ${W}/><path d="M8 26c2-6 6-4 8-6s6 2 8 0 6-2 8 0 6-2 8 2z" fill="#d9a05a" ${W}/>${[14, 22, 30, 36].map((x, i) => dot(x, 23 - (i % 2), 1.6, '#a8702a')).join('')}${circ(34, 12, 6, '#e8433a')}<path d="M34 6V3" stroke="${O}" stroke-width="2"/>`);
def('s2:fishchips', `<path d="M8 20h32l-5 24H13z" fill="#fff" ${W}/><path d="M12 20l-2-10M18 20l0-12M24 20l2-11M30 20l3-9M36 20l4-8" stroke="#ffd23f" stroke-width="4" stroke-linecap="round"/><path d="M12 20l-2-10M18 20l0-12M24 20l2-11M30 20l3-9M36 20l4-8" stroke="${O}" stroke-width="1" stroke-linecap="round" opacity=".5"/><path d="M14 30c4-6 16-6 20 0-4 6-16 6-20 0z" fill="#d9a05a" ${W}/>`);

// ---------- Tasmania and Perth (their games' pictures come with parts 2 and 3) ----------
def('s2:wombat', `<ellipse cx="24" cy="30" rx="18" ry="12" fill="#8a6a4a" ${W}/>${circ(12, 24, 8, '#9a7a5a')}${circ(8, 17, 3, '#9a7a5a')}${circ(16, 16, 3, '#9a7a5a')}<ellipse cx="7" cy="27" rx="3" ry="2.4" fill="${O}"/>${dot(11, 22, 1.6)}<path d="M14 42v3M34 42v3" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`);
def('s2:devil', `<ellipse cx="26" cy="30" rx="16" ry="11" fill="#2a2a32" ${W}/>${circ(13, 22, 9, '#2a2a32')}<ellipse cx="8" cy="15" rx="3" ry="4" fill="#e88a9a" ${W}/><ellipse cx="18" cy="14" rx="3" ry="4" fill="#e88a9a" ${W}/><path d="M18 33h16" stroke="#fff" stroke-width="3"/>${dot(10, 21, 1.8, '#fff')}${dot(16, 21, 1.8, '#fff')}<path d="M8 27q4 3 8 0" stroke="#e88a9a" stroke-width="2" ${N}/>`);
def('s2:hike', `<path d="M14 8h20l4 30H10z" fill="#e8433a" ${W}/><rect x="16" y="16" width="16" height="10" rx="3" fill="#c0302a" ${W}/><path d="M18 8c0-5 12-5 12 0" stroke="${O}" stroke-width="2.6" ${N}/><path d="M10 44l6-6h16l6 6z" fill="#6a7a8a" ${W}/>`);
def('s2:camera', `<rect x="5" y="14" width="38" height="26" rx="6" fill="#5a6a8a" ${W}/><path d="M16 14l3-5h10l3 5" fill="#5a6a8a" ${W}/>${circ(24, 27, 8, '#bfe4f2')}${circ(24, 27, 4, '#3b6fe0')}${dot(36, 19, 1.8, '#ffd23f')}`);
def('s2:swan', `<path d="M8 32c0 6 8 10 20 10s16-6 16-10c-4 2-10 2-14-2-2-2 0-6 0-12 0-6-4-10-8-10s-6 4-4 8l4 0c0-2 2-4 3-2s1 6-1 12c-2 4-8 6-16 6z" fill="#2a2a32" ${W}/><path d="M12 10l-6 2 6 2" fill="#e8433a" ${W}/>${dot(16, 11, 1.4, '#fff')}`);

// ---------- Tasmania: the bush, its animals and the mountain walk ----------
def('s2:burrow', `<path d="M4 40c0-14 9-24 20-24s20 10 20 24z" fill="#8fcf6a" ${W}/><path d="M12 40c0-8 5-14 12-14s12 6 12 14z" fill="#3a2a1a" ${W}/>`);
def('s2:tunnel', `<rect x="4" y="4" width="40" height="40" rx="9" fill="#b08050" ${W}/><path d="M10 14c6 2 10-2 16 0M22 30c6 2 10-2 16 0" stroke="#8a5a32" stroke-width="2" ${N}/>${dot(14, 34, 1.6, '#8a5a32')}${dot(36, 12, 1.4, '#8a5a32')}`);
def('s2:fern', `<path d="M24 44V12" stroke="#3f7a3a" stroke-width="2.6"/>${[14, 20, 26, 32, 38].map((y, i) => `<path d="M24 ${y}c-6-2-10 0-14 4M24 ${y}c6-2 10 0 14 4" stroke="#5fa84a" stroke-width="${3.4 - i * .3}" stroke-linecap="round" ${N}/>`).join('')}`);
def('s2:log', `<rect x="6" y="22" width="34" height="14" rx="7" fill="#8a5a32" ${W}/><ellipse cx="40" cy="29" rx="5" ry="7" fill="#d9b080" ${W}/><circle cx="40" cy="29" r="2.4" ${W} ${N}/><path d="M14 24c2 4 6 4 8 0" stroke="#5fa84a" stroke-width="3" ${N}/>`);
def('s2:echidna', `<path d="M8 34c0-10 8-18 18-18s16 8 16 16z" fill="#6a4a32" ${W}/>${[[14, 20], [20, 16], [27, 15], [34, 18], [39, 24], [17, 26], [24, 22], [31, 23]].map(([x, y]) => `<path d="M${x} ${y}l-1-6 4 4z" fill="#f2e6c8" ${W}/>`).join('')}<path d="M8 32l-6 3" stroke="${O}" stroke-width="3" stroke-linecap="round"/>${dot(11, 30, 1.6)}`);
def('s2:platypus', `<ellipse cx="26" cy="28" rx="16" ry="9" fill="#8a5a3a" ${W}/><path d="M42 28l5-2v6z" fill="#8a5a3a" ${W}/><path d="M11 25c-6-2-10 0-9 4s5 4 9 2z" fill="#3a3a3a" ${W}/>${dot(15, 24, 1.6)}<path d="M20 36l-2 4M32 36l2 4" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/>`);
def('s2:possum', `${circ(24, 28, 12, '#9a9aa8')}${circ(14, 16, 5, '#9a9aa8')}${circ(34, 16, 5, '#9a9aa8')}${circ(14, 16, 2.4, '#ffc2d1')}${circ(34, 16, 2.4, '#ffc2d1')}` + eyes(19, 29, 26, 2.6) + dot(24, 32, 1.8, '#ff8aa0') + `<path d="M34 38c8 2 10 8 6 10" stroke="#5a5a68" stroke-width="3.4" stroke-linecap="round" ${N}/>`);
def('s2:pademelon', `<path d="M16 42c-6-4-6-16 2-22 4-3 10-2 12 2 4 6 2 16-4 20z" fill="#a87a50" ${W}/>${circ(20, 14, 6, '#a87a50')}<ellipse cx="17" cy="6" rx="2" ry="4" fill="#a87a50" ${W}/><ellipse cx="23" cy="6" rx="2" ry="4" fill="#a87a50" ${W}/>${dot(18, 13, 1.4)}<path d="M28 40c8 0 14-2 16-6" stroke="${O}" stroke-width="3" stroke-linecap="round" ${N}/>`);
def('s2:cube', `<path d="M10 18l14-8 14 8v16l-14 8-14-8z" fill="#8a6a4a" ${W}/><path d="M10 18l14 8 14-8M24 26v16" stroke="${O}" stroke-width="2" ${N}/>`);
def('s2:ball', circ(24, 26, 14, '#e8433a') + `<path d="M12 20c8 4 16 4 24 0" stroke="#fff" stroke-width="3" ${N}/>`);
def('s2:heart', `<path d="M24 40C10 30 6 22 10 16s12-6 14 2c2-8 10-8 14-2s0 14-14 24z" fill="#ff7eb8" ${W}/>`);
def('s2:star', `<path d="M24 6l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#ffd23f" ${W}/>`);
def('s2:apple', `<path d="M24 16c-6-4-16-2-16 10 0 10 7 17 11 17 2 0 3-1 5-1s3 1 5 1c4 0 11-7 11-17 0-12-10-14-16-10z" fill="#e8433a" ${W}/><path d="M24 16c0-4 1-7 3-9" stroke="${O}" stroke-width="2.4" ${N}/><path d="M26 10c4-4 8-3 10-2-3 3-6 4-10 2z" fill="#5fa84a" ${W}/>`);
def('s2:track', `<rect x="2" y="2" width="44" height="44" rx="10" fill="#8fcf6a" ${W}/><path d="M18 46c0-10 12-12 12-22S20 8 22 2" stroke="#d9b080" stroke-width="8" stroke-linecap="round" ${N}/>${[[8, 12], [38, 34], [40, 10]].map(([x, y]) => `<path d="M${x} ${y + 6}l3-8 3 8z" fill="#2f6a3a" ${W}/>`).join('')}`);
def('s2:wind', `<path d="M4 16h26a6 6 0 1 0-6-6M4 26h34a5 5 0 1 1-5 5M4 36h18" stroke="#7fb8e8" stroke-width="4" stroke-linecap="round" ${N}/><path d="M36 20l6-10 4 14z" fill="#e8f0f8" ${W}/>`);
def('s2:bottle', `<rect x="16" y="12" width="16" height="32" rx="6" fill="#5fc0e8" ${W}/><rect x="19" y="5" width="10" height="8" rx="2" fill="#3b6fe0" ${W}/><path d="M16 26h16" stroke="#fff" stroke-width="2"/>`);
def('s2:bucket', `<path d="M10 16h28l-4 26H14z" fill="#ff9f43" ${W}/><path d="M10 16c4-10 24-10 28 0" stroke="${O}" stroke-width="2.4" ${N}/><path d="M34 6l6 10" stroke="#3b6fe0" stroke-width="4" stroke-linecap="round"/>`);
def('s2:kite', `<path d="M24 4l14 16-14 16-14-16z" fill="#ff7eb8" ${W}/><path d="M24 4v32M10 20h28" stroke="${O}" stroke-width="1.6"/><path d="M24 36c-4 4 4 6 0 10" stroke="${O}" stroke-width="2" ${N}/>`);
