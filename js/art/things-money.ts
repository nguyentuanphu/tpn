// Drawings (split from js/art.ts, v1.07): round 30 things, places, vehicles, weather and signs; the money
// games' coins and notes; the shop tabs, medals and decorations.
import { O, g, circ, dot, eyes, star5, sparkle, add, W, N } from './kit.js';
import { face } from './howto-tales.js';
// ---------- round 30: things, places, vehicles, weather and signs ----------
const house = (roof, wall, extra = '') => `<path d="M6 22L24 8l18 14z" fill="${roof}" ${W}/><rect x="10" y="22" width="28" height="18" fill="${wall}" ${W}/>${extra}`;
const wheel = (x, y, r = 4) => `${circ(x, y, r, '#2f3336')}${dot(x, y, 1.4, '#cfcfd8')}`;
add('🪣', g('a-swing', `<path d="M10 16h28l-4 26H14z" fill="#5fb6ff" ${W}/><path d="M10 16c0-10 28-10 28 0" ${W} ${N}/><path d="M12 22h24" stroke="#fff" stroke-width="2.4" opacity=".6"/>`, '24px 6px'));
// (owner, 30 Oct 2026 AEDT) move a decoration in My House: a little box hopping along a dotted arrow to its new spot
add('🔀', g('a-tap', `<rect x="6" y="24" width="14" height="14" rx="3" fill="#ffcf6b" ${W}/><path d="M14 18c4-10 18-12 24-4" stroke="#9b6bff" stroke-width="4" stroke-linecap="round" stroke-dasharray="4 5" ${N}/><path d="M33 9l7 6-8 3z" fill="#9b6bff" ${W}/><rect x="28" y="26" width="14" height="14" rx="3" fill="#fff6d6" stroke="#c9a24a" stroke-width="2.5" stroke-dasharray="3 3"/>`, '24px 30px'));
add('🔨', g('a-tap', `<path d="M22 20l16 20" stroke="#a8743a" stroke-width="5" stroke-linecap="round"/><path d="M6 14l14-10 8 10-14 10z" fill="#8a94a0" ${W}/>`, '38px 40px'));
add('⛏️ ⛏', g('a-tap', `<path d="M14 40L34 14" stroke="#a8743a" stroke-width="4" stroke-linecap="round"/><path d="M8 18c10-10 24-12 34-6-10-2-20 0-28 8z" fill="#8a94a0" ${W}/>`, '14px 40px'));
add('🪏', g('a-tap', `<path d="M10 40L32 12" stroke="#a8743a" stroke-width="4" stroke-linecap="round"/><path d="M30 6l12 8-6 8c-4 2-8 0-10-2z" fill="#8a94a0" ${W}/><path d="M6 36l8 8" stroke="${O}" stroke-width="4" stroke-linecap="round"/>`, '10px 40px'));
add('🧹', g('a-sway', `<path d="M34 4L22 26" stroke="#a8743a" stroke-width="4" stroke-linecap="round"/><path d="M18 24l10 6-6 14c-6 0-12-4-14-10z" fill="#f2d39a" ${W}/><path d="M14 36l4-6M20 40l2-6" ${W}/>`, '34px 4px'));
add('🪀', g('a-bob', `${circ(24, 30, 12, '#e8433a')}<path d="M12 30h24" ${W}/>${circ(24, 30, 3, '#ffd23f')}<path d="M24 18V4" ${W}/>`, '24px 4px'));
add('🧶 🧵', g('a-roll', `${circ(24, 26, 15, '#ff7ab0')}<path d="M12 18c8 4 16 4 22-4M10 28c10 2 20 0 28-8M14 38c8-2 16-8 22-14" stroke="#e8558a" stroke-width="2.4" ${N}/><path d="M38 34c4 2 6 6 4 8" ${W} ${N}/>`));
add('📌', g('a-bob', `<path d="M16 6h16l-2 4 4 10H14l4-10z" fill="#e8433a" ${W}/><path d="M24 20v22" stroke="${O}" stroke-width="2.4"/>`));
add('🚩', g('a-flag', `<path d="M10 4v40" stroke="${O}" stroke-width="3" stroke-linecap="round"/><path d="M12 6h26l-6 8 6 8H12z" fill="#e8433a" ${W}/>`, '10px 6px'));
add('📒 📕 📝', g('a-page', `<rect x="10" y="6" width="28" height="36" rx="3" fill="#ffd23f" ${W}/><path d="M16 6v36" ${W}/><path d="M20 16h12M20 22h12M20 28h8" stroke="${O}" stroke-width="1.8"/>`));
add('📂', g('a-bob', `<path d="M4 12h14l4 4h22v24H4z" fill="#ffc84a" ${W}/><path d="M4 20h40l-4 20H4z" fill="#ffd96a" ${W}/>`));
add('🗑️ 🗑', g('a-bob', `<path d="M12 14h24l-3 28H15z" fill="#8a94a0" ${W}/><path d="M8 14h32M20 14V8h8v6" ${W} ${N}/><path d="M20 20v16M28 20v16" stroke="${O}" stroke-width="1.8"/>`));
add('🔒', g('a-bob', `<rect x="10" y="20" width="28" height="22" rx="4" fill="#ffd23f" ${W}/><path d="M16 20v-6c0-6 4-9 8-9s8 3 8 9v6" ${W} ${N}/>${circ(24, 30, 3, O)}<path d="M24 31v5" ${W}/>`));
add('🔇', g('a-shake', `<path d="M6 18h8l10-8v28l-10-8H6z" fill="#8a94a0" ${W}/><path d="M30 18l10 12M40 18L30 30" stroke="#e8433a" stroke-width="3" stroke-linecap="round"/>`));
add('📨 💌', g('a-fly', `<rect x="6" y="12" width="36" height="24" rx="3" fill="#fff" ${W}/><path d="M6 14l18 12 18-12" ${W} ${N}/><path d="M22 24c-2-3-6-1-4 2l4 4 4-4c2-3-2-5-4-2z" fill="#ff5a8a" ${W}/>`));
add('📲 📱', g('a-bob', `<rect x="14" y="4" width="20" height="40" rx="4" fill="#3a3a55" ${W}/><rect x="17" y="9" width="14" height="26" rx="1" fill="#9ad8ff"/>${circ(24, 39, 1.8, '#fff')}`));
add('📶', g('a-pulse', [12, 20, 28, 36].map((x, i) => `<rect x="${x - 3}" y="${36 - i * 8}" width="6" height="${8 + i * 8}" rx="1" fill="#5fd36a" ${W}/>`).join('')));
add('📵', g('a-shake', `<rect x="14" y="6" width="20" height="36" rx="4" fill="#3a3a55" ${W}/>${circ(24, 24, 16, 'none', 'stroke="#e8433a" stroke-width="3.4"')}<path d="M12 12l24 24" stroke="#e8433a" stroke-width="3.4"/>`));
add('🔋', g('a-pulse', `<rect x="6" y="14" width="32" height="20" rx="3" fill="#fff" ${W}/><rect x="38" y="20" width="4" height="8" fill="${O}"/>${[10, 18, 26].map(x => `<rect x="${x}" y="18" width="6" height="12" fill="#5fd36a"/>`).join('')}`));
add('🩺', g('a-swing', `<path d="M12 6v14c0 6 4 10 10 10s10-4 10-10V6" ${W} ${N}/><path d="M22 30v6c0 4 4 6 8 6s8-2 8-6v-4" ${W} ${N}/>${circ(38, 28, 4, '#8a94a0')}`, '22px 6px'));
add('🔭', g('a-sway', `<path d="M6 22l30-12 4 8-30 12z" fill="#5a6ab8" ${W}/><path d="M22 26l-6 16M24 26l6 16" ${W}/>${circ(40, 14, 3, '#9ad8ff')}`, '24px 42px'));
add('🧭', g('a-bob', `${circ(24, 24, 18, '#fff')}${circ(24, 24, 14, '#f6efe0', 'stroke-width="1.6"')}` + g('a-pendulum', `<path d="M24 8l4 16h-8z" fill="#e8433a" ${W}/><path d="M24 40l4-16h-8z" fill="#8a94a0" ${W}/>`) + dot(24, 24, 2)));
add('⚖️ ⚖', g('a-swing', `<path d="M24 6v34M12 42h24M8 14h32" ${W}/><path d="M8 14l-4 12h8zM40 14l-4 12h8z" ${W} ${N}/><path d="M2 26c0 4 12 4 12 0zM34 26c0 4 12 4 12 0z" fill="#ffd23f" ${W}/>`, '24px 8px'));
add('🎼', g('a-sway', `${[12, 18, 24, 30, 36].map(y => `<path d="M4 ${y}h40" stroke="${O}" stroke-width="1.4"/>`).join('')}<path d="M10 40c6-2 6-12 0-16s-4-14 2-18" stroke="#8a5cf6" stroke-width="3" ${N}/>${circ(24, 30, 3, O)}<path d="M27 30V14" ${W}/>${circ(34, 26, 3, O)}<path d="M37 26V10" ${W}/>`));
add('🎻', g('a-sway', `<path d="M24 14c-6 0-10 4-8 10-4 4-4 12 2 16 4 2 8 2 12 0 6-4 6-12 2-16 2-6-2-10-8-10z" fill="#c9783a" ${W}/><path d="M24 4v30M20 30h8" ${W}/><path d="M6 10l34 20" stroke="#9a7a5a" stroke-width="2.4"/>`, '24px 42px'));
add('🪈', g('a-sway', `<path d="M6 38L40 8" stroke="#c9a26a" stroke-width="6" stroke-linecap="round"/>${[[18, 27], [24, 22], [30, 16]].map(([x, y]) => dot(x, y, 1.6)).join('')}` + g('a-rise', `<path d="M40 4l2-2M44 8l2-1" ${W}/>`)));
add('🪕', g('a-sway', `${circ(18, 32, 10, '#f6efe0')}<path d="M24 26L40 6" stroke="#a8743a" stroke-width="4" stroke-linecap="round"/><path d="M14 30l12-6" stroke="${O}" stroke-width="1.4"/>`, '18px 42px'));
add('🪭', g('a-fan', `<path d="M24 40L6 16c10-8 26-8 36 0z" fill="#e8433a" ${W}/>${[10, 17, 24, 31, 38].map(x => `<path d="M24 40L${x} ${x === 24 ? 8 : 12}" stroke="#ffd23f" stroke-width="1.6"/>`).join('')}`, '24px 40px'));
add('🧨', g('a-shake', `<rect x="14" y="14" width="20" height="26" rx="3" fill="#e8433a" ${W}/><path d="M14 22h20M14 32h20" stroke="#ffd23f" stroke-width="2.4"/><path d="M24 14c0-4 4-6 6-10" ${W} ${N}/>` + g('a-flicker', `<path d="M30 4l2-3 1 4z" fill="#ffb020"/>`)));
add('🎆 🌠', g('a-twinkle', `${[...Array(8)].map((_, i) => `<path d="M24 24L${24 + Math.cos(i * .785) * 18} ${24 + Math.sin(i * .785) * 18}" stroke="${['#ffd23f', '#ff5a8a', '#5fd3ff', '#8a5cf6'][i % 4]}" stroke-width="3" stroke-linecap="round"/>`).join('')}${circ(24, 24, 3, '#fff')}`));
add('⚡', g('a-flash', `<path d="M28 4L10 26h12l-4 18 20-24H26z" fill="#ffd23f" ${W}/>`));
add('❄️ ❄', g('a-spin-slow', `${[0, 1, 2].map(i => `<path d="M${24 + Math.cos(i * 1.047) * 18} ${24 + Math.sin(i * 1.047) * 18}L${24 - Math.cos(i * 1.047) * 18} ${24 - Math.sin(i * 1.047) * 18}" stroke="#7ad0ff" stroke-width="3.4" stroke-linecap="round"/>`).join('')}${circ(24, 24, 4, '#fff')}`));
add('⛄ ☃️', g('a-bob', `${circ(24, 32, 11, '#fff')}${circ(24, 15, 8, '#fff')}${eyes(21, 27, 13, 1.4)}<path d="M24 16l6 2-6 1z" fill="#ff9a2e"/><path d="M16 8h16l-2-6H18z" fill="#2a2a33" ${W}/>${dot(24, 28, 1.4)}${dot(24, 34, 1.4)}`));
add('⛅', g('a-float', `${circ(30, 16, 9, '#ffd23f')}<path d="M8 36c-6 0-6-10 2-10 0-6 10-8 14-2 6-2 12 2 10 8 4 0 4 6 0 6z" fill="#fff" ${W}/>`));
add('⛈️ ⛈', g('a-float', `<path d="M8 26c-6 0-6-10 2-10 0-6 10-8 14-2 6-2 12 2 10 8 4 0 4 6 0 6z" fill="#9aa4b8" ${W}/>` + g('a-flash', `<path d="M24 28l-6 8h6l-3 8 9-10h-6l3-6z" fill="#ffd23f" ${W}/>`)));
add('🌄 🌇 🏞️ 🏞 🏜️ 🏜', g('a-bob', `<rect x="4" y="8" width="40" height="32" rx="4" fill="#ffd9a0" ${W}/>${circ(24, 26, 7, '#ffb020')}<path d="M4 32l10-10 8 8 6-6 16 12v4H4z" fill="#5fbf4a" ${W}/>`));
add('🌌', g('a-glow', `<rect x="4" y="8" width="40" height="32" rx="4" fill="#2a2a5a" ${W}/><path d="M6 32c10-12 26-16 36-20" stroke="#8a7ad8" stroke-width="6" opacity=".6" ${N}/>${[[12, 16], [34, 30], [22, 22], [38, 14]].map(([x, y]) => star5(x, y, 2.4, '#fff6b0')).join('')}`));
add('🌍 🌐', g('a-spin-slow', `${circ(24, 24, 18, '#5fb6ff')}<path d="M12 14c4 0 6 4 4 8s4 6 2 10M30 10c-2 4 4 6 8 4M28 30c4 0 8 2 8 6" stroke="#5fbf4a" stroke-width="5" stroke-linecap="round" ${N}/>`));
add('♨️ ♨', g('a-rise', `<path d="M8 36c0 4 32 4 32 0s-8-4-16-4-16 0-16 4z" fill="#e8433a" ${W}/>${[16, 24, 32].map(x => `<path d="M${x} 28c-3-4 3-6 0-10s3-6 0-10" stroke="#e8433a" stroke-width="2.6" stroke-linecap="round" ${N}/>`).join('')}`));
add('🕳️ 🕳', g('a-pulse', `<ellipse cx="24" cy="28" rx="18" ry="9" fill="#2a2a33" ${W}/><ellipse cx="24" cy="26" rx="14" ry="5" fill="#141418"/>`));
add('🏪 🏤', g('a-bob', house('#5fb6ff', '#fff', `<path d="M10 22h28v5c-4 2-6 2-7 0-2 2-5 2-7 0-2 2-5 2-7 0-2 2-5 2-7 0z" fill="#e8433a" ${W}/><rect x="20" y="30" width="8" height="10" fill="#9ad8ff" ${W}/>`)));
add('⛪ 🕌', g('a-bob', `<path d="M24 2v8M20 6h8" ${W}/>${house('#c9783a', '#f6efe0', `<path d="M20 40v-8c0-4 8-4 8 0v8" fill="#a8743a" ${W}/>`)}`));
add('🏚️ 🏚 🛖', g('a-bob', house('#b5884a', '#c9a26a', `<rect x="20" y="30" width="8" height="10" fill="#6a4a2a" ${W}/><path d="M12 26l6 2M32 26l4 3" stroke="#8a5a2a" stroke-width="1.6"/>`)));
add('🚉', g('a-chug', `<rect x="6" y="10" width="36" height="26" rx="6" fill="#5fb6ff" ${W}/><rect x="10" y="14" width="12" height="9" rx="2" fill="#e8f6ff" ${W}/><rect x="26" y="14" width="12" height="9" rx="2" fill="#e8f6ff" ${W}/>${wheel(14, 38)}${wheel(34, 38)}<path d="M2 44h44" ${W}/>`));
add('🎡', g('a-spin-slow', `${circ(24, 22, 16, 'none', 'stroke="#8a5cf6" stroke-width="3"')}${[...Array(8)].map((_, i) => `<path d="M24 22L${24 + Math.cos(i * .785) * 16} ${22 + Math.sin(i * .785) * 16}" stroke="#8a5cf6" stroke-width="1.6"/>${circ(24 + Math.cos(i * .785) * 16, 22 + Math.sin(i * .785) * 16, 3, ['#ff5a8a', '#ffd23f', '#5fd3ff', '#5fd36a'][i % 4])}`).join('')}<path d="M18 44l6-22 6 22" ${W} ${N}/>`, '24px 22px'));
add('🎪', g('a-bob', `<path d="M4 22L24 6l20 16z" fill="#e8433a" ${W}/><path d="M14 14L12 22M24 6v16M34 14l2 8" stroke="#fff" stroke-width="3"/><rect x="8" y="22" width="32" height="18" fill="#fff" ${W}/><path d="M20 40l4-10 4 10" fill="#e8433a" ${W}/>`));
add('🗿', g('a-bob', `<path d="M14 42V14c0-6 4-10 10-10s10 4 10 10v28z" fill="#9a9aa4" ${W}/><path d="M16 18h16" ${W}/><path d="M22 20v12h6" ${W} ${N}/><path d="M20 36h10" ${W}/>`));
add('🚌 🚐', g('a-chug', `<rect x="4" y="12" width="40" height="24" rx="5" fill="#ffc83a" ${W}/>${[8, 18, 28].map(x => `<rect x="${x}" y="16" width="8" height="8" rx="1" fill="#e8f6ff" ${W}/>`).join('')}<rect x="36" y="16" width="6" height="12" rx="1" fill="#e8f6ff" ${W}/>${wheel(12, 38)}${wheel(34, 38)}`));
add('🚒', g('a-chug', `<rect x="4" y="16" width="40" height="20" rx="3" fill="#e8433a" ${W}/><rect x="30" y="18" width="10" height="8" fill="#e8f6ff" ${W}/><path d="M6 12l22-4M8 14l18-4" ${W}/>${wheel(12, 38)}${wheel(36, 38)}`));
add('🚚', g('a-chug', `<path d="M4 30l4-14h20l2 14z" fill="#d8a83a" ${W}/><path d="M28 30V18h8l6 6v6z" fill="#3a78c8" ${W}/><rect x="31" y="20" width="5" height="5" fill="#e8f6ff" ${W}/><path d="M10 16l3-5 6 2 5-3 3 6" fill="#8a7a68" ${W}/>${wheel(12, 36)}${wheel(22, 36)}${wheel(37, 36)}`));
add('👷', g('a-bob', face('#e8b088', '#3a2418', `<path d="M10 16c0-7 6-11 14-11s14 4 14 11z" fill="#ffc83a" ${W}/><path d="M7 16h34" ${W}/><path d="M24 5v6" stroke="#e8a020" stroke-width="2"/>`), '24px 42px'));
add('🛻', g('a-chug', `<path d="M4 34V24h16l4-8h12l6 8v10z" fill="#3a78c8" ${W}/><rect x="26" y="18" width="8" height="6" fill="#e8f6ff" ${W}/>${wheel(12, 36)}${wheel(36, 36)}`));
add('🚁', g('a-bob', `<path d="M4 8h40" stroke="${O}" stroke-width="3" class="a-spin3d"/><path d="M24 8v6" ${W}/><path d="M8 20c0-4 6-6 16-6s14 4 14 10-6 8-14 8H14c-4 0-6-4-6-12z" fill="#e8433a" ${W}/><path d="M38 24h8v-6" ${W} ${N}/><path d="M14 36h18" ${W}/><rect x="12" y="18" width="10" height="7" rx="2" fill="#e8f6ff" ${W}/>`));
add('✈️ ✈', g('a-fly', `<path d="M4 26l8-2 22-14c4-2 8 0 6 4L26 28l2 12-4 2-6-10-8 2-2 6-4 1z" fill="#e8f6ff" ${W}/>`));
add('🛼', g('a-roll', `<path d="M10 8h12v16h16c4 0 6 4 6 8H10z" fill="#ff7ab0" ${W}/>${wheel(14, 38)}${wheel(36, 38)}`));
add('🛗', g('a-bob', `<rect x="10" y="4" width="28" height="40" rx="2" fill="#c9c9d2" ${W}/><path d="M24 8v32" ${W}/><path d="M16 22l4-6 4 6M28 26l4 6 4-6" stroke="#5fb6ff" stroke-width="2.4" ${N}/>`));
add('⛽', g('a-bob', `<rect x="8" y="10" width="22" height="32" rx="3" fill="#e8433a" ${W}/><rect x="12" y="14" width="14" height="10" fill="#fff" ${W}/><path d="M30 18h6l4 6v12c0 3-4 3-4 0V28" ${W} ${N}/>`));
add('🛏️ 🛏', g('a-bob', `<path d="M4 20v20M44 28v12M4 30h40v6H4z" fill="#a8743a" ${W}/><rect x="8" y="22" width="10" height="8" rx="3" fill="#fff" ${W}/><path d="M18 22h22c3 0 4 2 4 6H18z" fill="#5fb6ff" ${W}/>`));
add('🧴', g('a-bob', `<rect x="14" y="16" width="20" height="26" rx="5" fill="#9ad8ff" ${W}/><rect x="18" y="10" width="12" height="6" fill="#fff" ${W}/><path d="M24 10V4h8" ${W} ${N}/><path d="M18 24h12" stroke="#fff" stroke-width="2.6"/>`));
add('🥄', g('a-wobble', `<ellipse cx="18" cy="14" rx="9" ry="11" fill="#cfcfd8" ${W} transform="rotate(-30 18 14)"/><path d="M24 22l16 20" stroke="#cfcfd8" stroke-width="5" stroke-linecap="round"/><path d="M24 22l16 20" ${W} ${N} opacity=".4"/>`));
add('⚽', g('a-roll', `${circ(24, 24, 18, '#fff')}<path d="M24 14l8 6-3 9h-10l-3-9z" fill="${O}"/><path d="M24 14V6M32 20l8-3M29 29l5 7M19 29l-5 7M16 20l-8-3" ${W}/>`));
add('⚾', g('a-roll', `${circ(24, 24, 18, '#fff')}<path d="M10 12c6 6 6 18 0 24M38 12c-6 6-6 18 0 24" stroke="#e8433a" stroke-width="2.4" ${N} stroke-dasharray="3 3"/>`));
add('🎾', g('a-hop', `${circ(24, 24, 18, '#d8f04a')}<path d="M8 16c10 4 10 12 0 18M40 16c-10 4-10 12 0 18" stroke="#fff" stroke-width="2.6" ${N}/>`));
add('🏉', g('a-roll', `<ellipse cx="24" cy="24" rx="20" ry="12" fill="#a8542a" ${W} transform="rotate(-30 24 24)"/><path d="M16 30l16-12" stroke="#fff" stroke-width="2.4"/>${[0, 1, 2].map(i => `<path d="M${19 + i * 5} ${24 - i * 4}l3 4" stroke="#fff" stroke-width="2"/>`).join('')}`));
add('🏅', g('a-swing', `<path d="M16 4l8 14 8-14" stroke="#e8433a" stroke-width="5" ${N}/>${circ(24, 30, 12, '#ffc83a')}${star5(24, 30, 6, '#fff3a0')}`, '24px 4px'));
add('🔶 💠', g('a-spin3d', `<path d="M24 4l18 20-18 20L6 24z" fill="#ff9a2e" ${W}/><path d="M24 12l10 12-10 12-10-12z" fill="#ffc06a"/>`));
add('🟫', `<rect x="8" y="8" width="32" height="32" rx="4" fill="#a8743a" ${W}/>`);
add('★', g('a-twinkle', star5(24, 24, 18, '#ffd23f')));
add('☸️ ☸', g('a-spin-slow', `${circ(24, 24, 16, 'none', 'stroke="#ffb020" stroke-width="3.4"')}${[...Array(8)].map((_, i) => `<path d="M24 24L${24 + Math.cos(i * .785) * 20} ${24 + Math.sin(i * .785) * 20}" stroke="#ffb020" stroke-width="3" stroke-linecap="round"/>`).join('')}${circ(24, 24, 4, '#ffb020')}`));
add('♾️ ♾', g('a-pulse', `<path d="M24 24c-6-8-16-8-16 0s10 8 16 0 16-8 16 0-10 8-16 0z" stroke="#8a5cf6" stroke-width="4" ${N}/>`));
add('🏷️ 🏷', g('a-swing', `<path d="M6 8h18l18 18-16 16L6 24z" fill="#ffd23f" ${W}/>${circ(14, 16, 3, '#fff')}`, '14px 16px'));
add('⚙️ ⚙', g('a-spin-slow', `${[...Array(8)].map((_, i) => `<rect x="21" y="2" width="6" height="8" rx="1" fill="#9aa4b8" ${W} transform="rotate(${i * 45} 24 24)"/>`).join('')}${circ(24, 24, 14, '#9aa4b8')}${circ(24, 24, 5, '#fff')}`));
add('🔠', `<rect x="4" y="8" width="40" height="32" rx="5" fill="#5fb6ff" ${W}/><path d="M10 34l6-18 6 18M12 28h8M26 16h10l-10 18h10" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" ${N}/>`);
add('🆘', g('a-pulse', `<rect x="4" y="12" width="40" height="24" rx="4" fill="#e8433a" ${W}/><text x="24" y="30" font-size="13" font-weight="bold" text-anchor="middle" fill="#fff" font-family="sans-serif">SOS</text>`));
add('🂠', `<rect x="10" y="4" width="28" height="40" rx="4" fill="#3a78c8" ${W}/><rect x="14" y="8" width="20" height="32" rx="2" fill="none" stroke="#fff" stroke-width="2"/><path d="M14 8l20 32M34 8L14 40" stroke="#fff" stroke-width="1.4" opacity=".6"/>`);
['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'].forEach((k, n) => { const P6 = [[[24, 24]], [[16, 16], [32, 32]], [[16, 16], [24, 24], [32, 32]], [[16, 16], [32, 16], [16, 32], [32, 32]], [[16, 16], [32, 16], [24, 24], [16, 32], [32, 32]], [[16, 14], [32, 14], [16, 24], [32, 24], [16, 34], [32, 34]]][n];
  add(k, g('a-roll', `<rect x="6" y="6" width="36" height="36" rx="8" fill="#fff" ${W}/>${P6.map(([x, y]) => dot(x, y, 3.4, n === 0 ? '#e8433a' : O)).join('')}`)); });
add('↩️ ↩', `<path d="M38 36V22c0-6-4-8-10-8H12" stroke="#5fb6ff" stroke-width="5" stroke-linecap="round" ${N}/><path d="M18 6l-9 8 9 8z" fill="#5fb6ff" ${W}/>`);
add('↖️ ↖', `<path d="M40 40L12 12" stroke="#5fb6ff" stroke-width="5" stroke-linecap="round"/><path d="M8 8h16L8 24z" fill="#5fb6ff" ${W}/>`);
add('↙️ ↙', `<path d="M40 8L12 36" stroke="#5fb6ff" stroke-width="5" stroke-linecap="round"/><path d="M8 40h16L8 24z" fill="#5fb6ff" ${W}/>`);
add('⏩', g('a-nudge', `<path d="M6 10l18 14-18 14zM24 10l18 14-18 14z" fill="#5fd3ff" ${W}/>`));
add('⏭️', g('a-nudge', `<path d="M6 10l16 14-16 14zM22 10l16 14-16 14z" fill="#5fd3ff" ${W}/><rect x="38" y="10" width="5" height="28" fill="#5fd3ff" ${W}/>`));
add('⏹️', `<rect x="10" y="10" width="28" height="28" rx="4" fill="#e8433a" ${W}/>`);
add('✔️', g('a-check', `<path d="M8 26l10 10L40 12" stroke="#5fd36a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" ${N}/>`));
add('➖', `<path d="M10 24h28" stroke="#5fb6ff" stroke-width="6" stroke-linecap="round"/>`);
add('〰️ 〰', g('a-waveh', `<path d="M4 24c5-8 9-8 13 0s9 8 13 0 9-8 14 0" stroke="#5fb6ff" stroke-width="4" stroke-linecap="round" ${N}/>`));

// round R: the last few pictures Sparkle Studio used as phone emoji (owner: "replace all emoji")
add('👥', `${circ(17, 16, 7, '#ffb37a')}<path d="M5 40c0-9 5-14 12-14s12 5 12 14z" fill="#5fb6ff" ${W}/>${circ(32, 18, 6, '#e8a070')}<path d="M24 40c1-8 4-12 9-12s10 4 10 12z" fill="#ff7eb8" ${W}/>`);
add('📸', `<rect x="4" y="14" width="40" height="26" rx="5" fill="#9aa4b8" ${W}/><path d="M16 14l3-5h10l3 5" fill="#9aa4b8" ${W}/>${circ(24, 27, 8, '#5fb6ff')}${circ(24, 27, 3.5, '#fff')}<path d="M38 6l2 4 4 1-4 2-2 4-2-4-4-2 4-1z" fill="#ffd23f" ${W}/>`);
add('⏰', g('a-wiggle', `${circ(24, 26, 15, '#fff')}<path d="M24 26V17M24 26l7 4" ${W} ${N}/>${circ(11, 10, 5, '#ff7eb8')}${circ(37, 10, 5, '#ff7eb8')}<path d="M14 41l-3 4M34 41l3 4" ${W}/>`));
add('🔑', g('a-swing', `${circ(14, 20, 9, '#ffd23f')}${circ(14, 20, 3, '#fff')}<path d="M22 22l20 12M34 27l-3 5M39 30l-3 5" stroke="#ffd23f" stroke-width="5" stroke-linecap="round"/><path d="M22 22l20 12" ${W} ${N}/>`, '14px 20px'));
add('🔗', `<rect x="4" y="18" width="22" height="12" rx="6" fill="none" stroke="#5fb6ff" stroke-width="5"/><rect x="22" y="18" width="22" height="12" rx="6" fill="none" stroke="#5fd39a" stroke-width="5"/>`);
add('📘', `<rect x="9" y="5" width="30" height="38" rx="4" fill="#5fb6ff" ${W}/><path d="M15 5v38" ${W}/><path d="M20 15h13M20 21h10" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`);
add('🔌', `<path d="M24 30v12" stroke="${O}" stroke-width="4" stroke-linecap="round"/><rect x="13" y="12" width="22" height="18" rx="5" fill="#9aa4b8" ${W}/><path d="M19 12V4M29 12V4" ${W}/>`);
add('📥', `<path d="M6 28h10l3 6h10l3-6h10v12a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill="#5fb6ff" ${W}/><path d="M24 5v19M17 17l7 7 7-7" ${W} ${N}/>`);
add('💻', `<rect x="8" y="9" width="32" height="22" rx="3" fill="#5fb6ff" ${W}/><rect x="12" y="13" width="24" height="14" rx="2" fill="#d8f4ff"/><path d="M3 35h42l-3 5H6z" fill="#9aa4b8" ${W}/>`);
add('📦', `<path d="M6 16l18-8 18 8v18l-18 9-18-9z" fill="#e8b46a" ${W}/><path d="M6 16l18 8 18-8M24 24v19" ${W} ${N}/><path d="M15 12l18 8" stroke="#fff" stroke-width="3" opacity=".6"/>`);
add('🏗️ 🏗', `<path d="M10 44V8M10 8h30M10 14l6-6M40 8v10" ${W} ${N}/><path d="M10 8l30 0" stroke="#ffd23f" stroke-width="4"/><rect x="34" y="18" width="12" height="10" rx="2" fill="#ff7eb8" ${W}/><rect x="16" y="30" width="16" height="14" fill="#e8b46a" ${W}/>`);
add('🆕', `<rect x="3" y="12" width="42" height="24" rx="5" fill="#5fd39a" ${W}/><text x="24" y="29" font-size="13" font-weight="bold" text-anchor="middle" fill="#fff" font-family="sans-serif">NEW</text>`);
add('📬', `<path d="M10 22a10 10 0 0 1 20 0v18H10z" fill="#5fb6ff" ${W}/><path d="M20 12h14a8 8 0 0 1 8 8v20H30" fill="#ff7eb8" ${W}/><path d="M24 30V6h10v6H24" fill="#ffd23f" ${W}/><path d="M20 40v6" ${W}/>`);
add('🕘', `${circ(24, 24, 18, '#fff')}<path d="M24 24V12M24 24H14" ${W} ${N}/>${dot(24, 24, 2.4)}`);
add('⏱️ ⏱', `${circ(24, 27, 16, '#fff')}<path d="M24 27l6-7" ${W} ${N}/><rect x="20" y="4" width="8" height="5" rx="2" fill="#ff7eb8" ${W}/><path d="M24 9v2M36 14l3-3" ${W}/>${dot(24, 27, 2.2)}`);
add('🎞️ 🎞', `<rect x="10" y="4" width="28" height="40" rx="3" fill="#3b2a4f"/><rect x="16" y="9" width="16" height="12" fill="#5fb6ff"/><rect x="16" y="27" width="16" height="12" fill="#ffd23f"/>${[8, 16, 24, 32, 40].map(y => `<rect x="11.5" y="${y - 1.5}" width="2.5" height="3" fill="#fff"/><rect x="34" y="${y - 1.5}" width="2.5" height="3" fill="#fff"/>`).join('')}`);
add('🔓', `<rect x="10" y="20" width="28" height="22" rx="4" fill="#5fd39a" ${W}/><path d="M16 20v-6c0-6 4-9 8-9s8 3 8 7" ${W} ${N}/>${circ(24, 30, 3, O)}<path d="M24 31v5" ${W}/>`);

// (round S, owner plan 8 Oct) the money games' coins and notes, drawn simply in the valley's style and never copied from
// real banknotes: silver and gold Australian coins (the 50c with twelve sides, the gold $2 smaller than the $1), notes in
// their colours with the clear window; Vietnamese notes in their colours, the window only on the plastic ones (10.000
// and up). Keys are the currency and the value in cents or đồng ('aud50', 'vnd20000'; js/games/moneylogic.js).
{
  const lbl = (t, y, size, fill = O, line = '') => `<text x="24" y="${y}" font-size="${size}" font-weight="900" text-anchor="middle" fill="${fill}" ${line} font-family="Fredoka,sans-serif"${t.length > 5 ? ` textLength="${Math.min(38, t.length * 5)}" lengthAdjust="spacingAndGlyphs"` : ''}>${t}</text>`;
  const poly = (r, sides) => [...Array(sides)].map((_, i) => { const a = i / sides * Math.PI * 2 - Math.PI / 2; return (i ? 'L' : 'M') + (24 + Math.cos(a) * r).toFixed(1) + ' ' + (24 + Math.sin(a) * r).toFixed(1); }).join('') + 'z';
  const coin = (k: string, r: number, fill: string, rim: string, t: string, sides = 0) => {
    const shape = (rr, f, extra) => sides ? `<path d="${poly(rr, sides)}" fill="${f}" ${extra}/>` : `<circle cx="24" cy="24" r="${rr}" fill="${f}" ${extra}/>`;
    add(k, shape(r, fill, W) + shape(r - 3.4, 'none', `stroke="${rim}" stroke-width="1.6" stroke-dasharray="2 2"`) + `<path d="M${(24 - r * .6).toFixed(1)} ${(24 - r * .3).toFixed(1)}q${(r * .2).toFixed(1)}-${(r * .4).toFixed(1)} ${(r * .6).toFixed(1)}-${(r * .5).toFixed(1)}" stroke="#fff" stroke-width="2.4" stroke-linecap="round" ${N} opacity=".8"/>` + lbl(t, 28.5, t.length > 2 ? 11 : 13));
  };
  const note = (k, fill, t, win) => add(k, `<rect x="2" y="11" width="44" height="26" rx="4" fill="${fill}" ${W}/><rect x="5" y="14" width="38" height="20" rx="2.5" fill="none" stroke="#fff" stroke-width="1.4" opacity=".7"/><circle cx="10.5" cy="29" r="4" fill="#fff" opacity=".55"/>`
    + (win ? `<rect x="35" y="15.5" width="6" height="7" rx="2" fill="#e8f8ff" stroke="${O}" stroke-width="1.2"/>` : '') + lbl(t, 28.5, t.length > 3 ? 10 : 13, '#fff', `stroke="${O}" stroke-width="1.1" paint-order="stroke"`));
  type Note = [number, string, string];
  const SILVER: [string, string] = ['#e3e7ec', '#9aa4b8'], GOLD: [string, string] = ['#f5c842', '#c48a1a'];
  coin('aud5', 15, ...SILVER, '5c'); coin('aud10', 17, ...SILVER, '10c'); coin('aud20', 19.5, ...SILVER, '20c'); coin('aud50', 21, ...SILVER, '50c', 12);
  coin('aud100', 18, ...GOLD, '$1'); coin('aud200', 15.5, ...GOLD, '$2');
  const AUD_NOTES: Note[] = [[500, '#d97fb8', '$5'], [1000, '#4f8fd6', '$10'], [2000, '#e0614a', '$20'], [5000, '#e6b422', '$50'], [10000, '#4fae62', '$100']];
  AUD_NOTES.forEach(([v, f, t]) => note('aud' + v, f, t, true));
  const VND_NOTES: Note[] = [[1000, '#9a8a5a', '1.000'], [2000, '#a4785a', '2.000'], [5000, '#6c78b8', '5.000'], [10000, '#c9a54a', '10.000'], [20000, '#4f8fd6', '20.000'], [50000, '#d36aa0', '50.000'],
    [100000, '#5fa86a', '100.000'], [200000, '#d7704a', '200.000'], [500000, '#3fa9b8', '500.000']];
  VND_NOTES.forEach(([v, f, t]) => note('vnd' + v, f, t + 'đ', v >= 10000));
  // a red lì xì envelope with a gold flower (the 🧧 key keeps its old party drawing)
  add('lixi', g('a-wiggle', `<rect x="10" y="5" width="28" height="38" rx="4" fill="#e8332a" ${W}/><path d="M10 9l14 10 14-10" fill="#c8241e" ${W}/>${[0, 1, 2, 3, 4].map(i => { const a = i * 1.2566 - 1.5708; return `<circle cx="${(24 + Math.cos(a) * 4.2).toFixed(1)}" cy="${(30 + Math.sin(a) * 4.2).toFixed(1)}" r="3" fill="#ffd23f" stroke="${O}" stroke-width="1.2"/>`; }).join('')}${circ(24, 30, 2.2, '#ff9f43')}`, '24px 43px'));
  // the money plant in its pot, and two things everyone needs
  add('🪴', g('a-sway', `<path d="M24 30V16" ${W}/><path d="M24 22c-8 0-12-5-12-11 7 0 12 4 12 11zM24 18c0-7 5-12 12-12 0 7-5 12-12 12z" fill="#5fd36a" ${W}/>`, '24px 30px') + `<path d="M12 30h24l-3 14H15z" fill="#d9774a" ${W}/><rect x="10" y="27" width="28" height="5" rx="2" fill="#e8925f" ${W}/>`);
  add('🧼', g('a-bob', `<rect x="8" y="20" width="32" height="20" rx="8" fill="#9ad8ff" ${W}/><path d="M14 26h10" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>${circ(16, 13, 4, '#e8f8ff')}${circ(27, 10, 3, '#e8f8ff')}${circ(35, 15, 2.4, '#e8f8ff')}`));
  add('🪥', g('a-wiggle', `<path d="M8 40L32 16" stroke="#ff7eb8" stroke-width="6" stroke-linecap="round"/><rect x="28" y="8" width="14" height="9" rx="2" fill="#fff" ${W} transform="rotate(-45 35 12)"/><path d="M31 6l3 3M35 3l3 3M39 7l3 3" stroke="#5fb6ff" stroke-width="2.4" stroke-linecap="round"/>`, '8px 40px'));
}

add('⏮️ ⏮', g('a-nudge', `<rect x="5" y="10" width="5" height="28" fill="#5fd3ff" ${W}/><path d="M42 10L26 24l16 14zM26 10L10 24l16 14z" fill="#5fd3ff" ${W}/>`));
add('⏯️ ⏯', `<path d="M5 10l17 14L5 38z" fill="#5fd36a" ${W}/><rect x="27" y="10" width="6" height="28" rx="2" fill="#ffd23f" ${W}/><rect x="37" y="10" width="6" height="28" rx="2" fill="#ffd23f" ${W}/>`);

// (round S, owner plan 8 Oct) the clothes shop's tabs, the family rankings' medals and the collectibles' decorations
add('👟', g('a-hop', `<path d="M5 32c0-9 4-15 12-15 4 6 10 7 15 7 7 0 11 3 11 8z" fill="#5fb6ff" ${W}/><path d="M4 32h40v5H4z" fill="#fff8ee" ${W}/><path d="M17 21l4 4M21 19l4 4M25 18l3 4" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>`, '24px 37px'));
add('📿', g('a-swing', `<path d="M10 6c0 18 6 26 14 26s14-8 14-26" stroke="${O}" stroke-width="1.4" ${N}/>${[0, 1, 2, 3, 4, 5, 6].map(i => { const a = Math.PI * i / 6; return circ(24 - Math.cos(a) * 14, 6 + Math.sin(a) * 26, 3.4, i % 2 ? '#ff7eb8' : '#fff8ee'); }).join('')}${circ(24, 40, 5, '#ffd23f')}`, '24px 6px'));
const medal = (f, n) => g('a-swing', `<path d="M15 4l9 15 9-15" stroke="#5fb6ff" stroke-width="5" ${N}/><path d="M15 4l9 15 9-15" ${W} ${N}/>${circ(24, 31, 12, f)}<text x="24" y="37" font-size="15" font-weight="900" text-anchor="middle" fill="#fff" stroke="${O}" stroke-width="1" font-family="Fredoka,sans-serif">${n}</text>`, '24px 4px');
add('🥇', medal('#ffc83a', 1)); add('🥈', medal('#c8d0da', 2)); add('🥉', medal('#d98a4a', 3));
add('🎐', `<path d="M24 3v6" ${W}/>` + g('a-sway', `<path d="M13 20a11 11 0 0 1 22 0z" fill="#9fe0ff" ${W}/><path d="M24 20v8" ${W}/><rect x="19" y="28" width="10" height="15" rx="2" fill="#ff7eb8" ${W}/><path d="M22 33h4" stroke="#fff" stroke-width="2"/>`, '24px 9px'));
add('🪴', `<path d="M13 30h22l-3 14H16z" fill="#e0805a" ${W}/><path d="M11 27h26v5H11z" fill="#f0a070" ${W}/>` + g('a-sway', `<path d="M24 27V14" ${W}/><path d="M24 20c-8 0-12-6-12-11 6 0 12 4 12 11zM24 16c6-1 10-6 10-10-6 0-10 4-10 10zM24 24c5 0 9-3 10-7-5-1-9 2-10 7z" fill="#5fd36a" ${W}/>`, '24px 27px'));
// (round S, owner plan 8 Oct) Hội làng's carp lantern, the surprises' treasure chest and fairy wand, the dance break's stretch
add('🎏', `<path d="M10 4v40" ${W}/>` + g('a-sway', `<path d="M10 8c10-3 22 0 30 6-8 6-20 9-30 6z" fill="#ff5f7a" ${W}/><path d="M10 22c10-3 22 0 30 6-8 6-20 9-30 6z" fill="#5fb6ff" ${W}/>${dot(33, 13, 1.6)}${dot(33, 27, 1.6)}<path d="M18 11q3 3 0 6M18 25q3 3 0 6" ${W} ${N}/>`, '10px 24px'));
add('🧰', `<rect x="6" y="20" width="36" height="20" rx="3" fill="#b06a32" ${W}/><path d="M6 20c0-8 8-12 18-12s18 4 18 12z" fill="#c97a3a" ${W}/><path d="M6 20h36M24 8v32" stroke="#ffd23f" stroke-width="4"/><rect x="20" y="18" width="8" height="8" rx="2" fill="#ffd23f" ${W}/>` + g('a-twinkle', sparkle(40, 8, 1), '40px 8px'));
add('🪄', `<path d="M10 40L32 16" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M10 40L32 16" stroke="#8a5cf6" stroke-width="3" stroke-linecap="round"/>` + g('a-spin-slow', star5(35, 13, 9, '#ffd23f'), '35px 13px') + g('a-twinkle2', sparkle(14, 12, .9), '14px 12px'));
add('🤸', g('a-wiggle', `${circ(13, 30, 5, '#c98a5a')}<path d="M17 27l10-8 10 6M27 19l-4-10M27 19l12-10" ${W} ${N}/><path d="M20 26l-8-8" ${W} ${N}/><path d="M23 16l8 6" stroke="#ff5f7a" stroke-width="7" stroke-linecap="round"/>`, '24px 30px'));

