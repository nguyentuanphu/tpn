// Sparkle Valley's own picture icons: chunky rounded shapes with a soft dark outline, in the game's
// colours, so the buttons look like they belong to the valley (and not like phone emoji).
const O = '#3b2a4f', W = 'stroke="' + O + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
const svg = body => `<svg class="ico" viewBox="0 0 48 48" aria-hidden="true">${body}</svg>`;
export const ICONS = {
  // two players: face to face (a tablet lying flat, one half turned to the far child) and side by side (round R, owner)
  faceView: svg(`<rect x="12" y="4" width="24" height="40" rx="5" fill="#bfe3f2" ${W}/><path d="M12 24h24" ${W}/><circle cx="24" cy="34" r="4.5" fill="#ffb37a" ${W}/><path d="M19.5 33q4.5 -7 9 0" fill="#3b2a4f"/><circle cx="24" cy="14" r="4.5" fill="#ffb37a" ${W}/><path d="M19.5 15q4.5 7 9 0" fill="#3b2a4f"/><path d="M41 18v12M38 21l3 -3l3 3M38 27l3 3l3 -3" stroke="#ff7eb8" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
  sideView: svg(`<rect x="4" y="11" width="40" height="26" rx="5" fill="#bfe3f2" ${W}/><path d="M24 11v26" ${W}/><circle cx="14" cy="26" r="4.5" fill="#ffb37a" ${W}/><path d="M9.5 25q4.5 -7 9 0" fill="#3b2a4f"/><circle cx="34" cy="26" r="4.5" fill="#ffb37a" ${W}/><path d="M29.5 25q4.5 -7 9 0" fill="#3b2a4f"/>`),
  // the Simple screen: four big picture tiles (round O, owner: the teddy did not say what it does)
  bigTiles: svg(`<rect x="6" y="6" width="16" height="16" rx="5" fill="#ff7eb8" ${W}/><rect x="26" y="6" width="16" height="16" rx="5" fill="#ffd23f" ${W}/><rect x="6" y="26" width="16" height="16" rx="5" fill="#5fd39a" ${W}/><rect x="26" y="26" width="16" height="16" rx="5" fill="#5fd3ff" ${W}/>`),
  games: svg(`<rect x="5" y="15" width="38" height="22" rx="11" fill="#ff7eb8" ${W}/><path d="M15 21v10M10 26h10" ${W} fill="none"/><circle cx="31" cy="23" r="3" fill="#ffd23f" ${W}/><circle cx="37" cy="29" r="3" fill="#5fd3ff" ${W}/><path d="M24 6l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z" fill="#ffd23f" ${W}/>`),
  map: svg(`<path d="M6 12l11-4 14 4 11-4v28l-11 4-14-4-11 4z" fill="#a8e6a1" ${W}/><path d="M17 8v28M31 12v28" ${W} fill="none"/><path d="M24 16c-4 0-6 3-6 6 0 4 6 10 6 10s6-6 6-10c0-3-2-6-6-6z" fill="#ff5f7e" ${W}/><circle cx="24" cy="22" r="2" fill="#fff"/>`),
  // (tester's notes, 12 Oct) the clothes shop, beside the Bag in the dock: a shopping bag with a smile
  shop: svg(`<path d="M17 17v-3a7 7 0 0 1 14 0v3" fill="none" ${W}/><path d="M9 16h30l-2 26H11z" fill="#a98bff" ${W}/><path d="M18 28q6 6 12 0" fill="none" ${W}/>`),
  bag: svg(`<path d="M14 16c0-6 4-9 10-9s10 3 10 9" fill="none" ${W}/><rect x="8" y="15" width="32" height="27" rx="10" fill="#ffb347" ${W}/><rect x="15" y="27" width="18" height="10" rx="4" fill="#ffd98a" ${W}/><path d="M24 18l1.6 3 3.4.4-2.5 2.3.7 3.3-3.2-1.7-3.2 1.7.7-3.3-2.5-2.3 3.4-.4z" fill="#fff" stroke="${O}" stroke-width="1.5" stroke-linejoin="round"/>`),
  ask: svg(`<rect x="17" y="6" width="14" height="22" rx="7" fill="#c8b6ff" ${W}/><path d="M11 22c0 7 6 12 13 12s13-5 13-12M24 34v7M17 42h14" fill="none" ${W}/>`),
  talk: svg(`<path d="M8 10h32a4 4 0 0 1 4 4v15a4 4 0 0 1-4 4H22l-9 8v-8H8a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4z" fill="#7fd8ff" ${W}/><circle cx="16" cy="21.5" r="2.4" fill="${O}"/><circle cx="24" cy="21.5" r="2.4" fill="${O}"/><circle cx="32" cy="21.5" r="2.4" fill="${O}"/>`),
  call: svg(`<path d="M14 6l6 8-4 4c2 5 6 9 11 11l4-4 8 6-3 6c-14 0-28-14-28-28z" fill="#5fd36a" ${W}/>`),
  callOff: svg(`<path d="M14 6l6 8-4 4c2 5 6 9 11 11l4-4 8 6-3 6c-14 0-28-14-28-28z" fill="#cfcfd8" ${W}/><path d="M8 8l32 32" ${W}/>`),
  music: svg(`<path d="M18 34V10l20-4v24" fill="none" ${W}/><ellipse cx="13" cy="35" rx="6" ry="5" fill="#ff7eb8" ${W}/><ellipse cx="33" cy="31" rx="6" ry="5" fill="#ffd23f" ${W}/>`),
  sound: svg(`<path d="M7 18h8l10-8v28l-10-8H7z" fill="#ffd23f" ${W}/><path d="M31 17c3 3 3 11 0 14M36 12c6 6 6 18 0 24" fill="none" ${W}/>`),
  soundOff: svg(`<path d="M7 18h8l10-8v28l-10-8H7z" fill="#cfcfd8" ${W}/><path d="M32 18l10 12M42 18L32 30" fill="none" ${W}/>`),
  run: svg(`<path d="M8 30c0-6 4-10 8-12l6 4 8-2 8 6c3 2 4 5 3 8H10a2 2 0 0 1-2-2z" fill="#5fd3ff" ${W}/><path d="M8 34h33" ${W}/><path d="M4 18h7M2 24h6M5 12h6" fill="none" stroke="#ff9f43" stroke-width="3" stroke-linecap="round"/>`),
  jump: svg(`<path d="M24 6l12 13h-7v10h-10V19h-7z" fill="#c8b6ff" ${W}/><path d="M14 36c3-3 6 3 10 0s7 3 10 0M14 42c3-3 6 3 10 0s7 3 10 0" fill="none" stroke="#ff7eb8" stroke-width="3" stroke-linecap="round"/>`),
  zoomIn: svg(`<circle cx="21" cy="21" r="13" fill="#fff6d8" ${W}/><path d="M31 31l10 10" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M21 15v12M15 21h12" ${W}/>`),
  zoomOut: svg(`<circle cx="21" cy="21" r="13" fill="#fff6d8" ${W}/><path d="M31 31l10 10" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M15 21h12" ${W}/>`),
  // (owner, 13 Oct AEDT) the View button: zoom, camera view and Where is folded behind one eye
  // (r79 A8, owner 16 Oct: the eye "looks very scary") a little round camera in the game's style, like the Pad's Camera tab
  view: svg(`<rect x="16" y="9" width="13" height="8" rx="3" fill="#c9bfff" ${W}/><rect x="5" y="14" width="38" height="26" rx="9" fill="#9a8cff" ${W}/><circle cx="24" cy="27" r="9.5" fill="#dff4ff" ${W}/><circle cx="24" cy="27" r="5" fill="#5fd3ff"/><circle cx="21.5" cy="24.5" r="2" fill="#fff"/><circle cx="36" cy="20" r="2.2" fill="#ffd23f"/>`),
  gear: svg(`<path d="M24 8l3 4 5-1 1 5 5 1-1 5 4 3-4 3 1 5-5 1-1 5-5-1-3 4-3-4-5 1-1-5-5-1 1-5-4-3 4-3-1-5 5-1 1-5 5 1z" fill="#ffd23f" ${W}/><circle cx="24" cy="24" r="5" fill="#fff" ${W}/>`),
  info: svg(`<circle cx="24" cy="24" r="19" fill="#5fd3ff" ${W}/><circle cx="24" cy="15" r="3" fill="${O}"/><path d="M24 22v13" stroke="${O}" stroke-width="5" stroke-linecap="round"/>`)
};

// Little flags drawn by the game (Windows shows flag emoji as two letters, e.g. "AU").
const flag = body => `<svg class="flag" viewBox="0 0 30 20" aria-hidden="true"><g>${body}</g><rect x=".5" y=".5" width="29" height="19" rx="3" fill="none" stroke="rgba(0,0,0,.25)"/></svg>`;
const star = (cx, cy, r, c) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r * .45 : r; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * k).toFixed(2) + ' ' + (cy + Math.sin(a) * k).toFixed(2); } return `<path d="${d}Z" fill="${c}"/>`; };
export const FLAGS = {
  gb: flag(`<rect width="30" height="20" rx="3" fill="#012169"/><path d="M0 0l30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0l30 20M30 0L0 20" stroke="#c8102e" stroke-width="1.6"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="#c8102e" stroke-width="3.6"/>`),
  vn: flag(`<rect width="30" height="20" rx="3" fill="#da251d"/>${star(15, 10.5, 6, '#ffde00')}`),
  au: flag(`<rect width="30" height="20" rx="3" fill="#012169"/><path d="M0 0l15 10M15 0L0 10" stroke="#fff" stroke-width="2.4"/><path d="M0 0l15 10M15 0L0 10" stroke="#c8102e" stroke-width="1"/><path d="M7.5 0v10M0 5h15" stroke="#fff" stroke-width="3.2"/><path d="M7.5 0v10M0 5h15" stroke="#c8102e" stroke-width="1.8"/>${star(7.5, 15, 2.6, '#fff')}${star(23, 5, 1.6, '#fff')}${star(19.5, 10, 1.6, '#fff')}${star(26.5, 9, 1.6, '#fff')}${star(23, 16, 1.6, '#fff')}`),
  cn: flag(`<rect width="30" height="20" rx="3" fill="#de2910"/>${star(6, 6, 3.4, '#ffde00')}${star(11.5, 2.5, 1.1, '#ffde00')}${star(13.5, 5, 1.1, '#ffde00')}${star(13.5, 8.5, 1.1, '#ffde00')}${star(11.5, 11, 1.1, '#ffde00')}`),
  in: flag(`<rect width="30" height="20" rx="3" fill="#fff"/><path d="M3 0h24a3 3 0 0 1 3 3v3.67H0V3a3 3 0 0 1 3-3z" fill="#ff9933"/><path d="M0 13.33h30V17a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3z" fill="#138808"/><circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" stroke-width=".8"/><circle cx="15" cy="10" r=".6" fill="#000080"/>`)
};
// the flags for a game's or a place's origin ('vn', 'au', 'cn', 'in' or 'both')
export const originFlags = o => (o === 'both' ? ['vn', 'au'] : [o]).map(k => FLAGS[k] || '').join('');
