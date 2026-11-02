// Drawings (v1.08 money, owner's plan 3 Nov 2026 AEDT, part D): the eleven new money games' own pictures and the
// Vietnamese market stall (sạp) of Market Day. Each one is a new drawing in the valley's style (chunky shapes, the soft
// dark outline), never a phone emoji; the keys are not emoji, so they only ever show through pic() / artSVG().
import { O, g, circ, dot, sparkle, def, W, N } from './kit.js';

// a gold coin with a small mark on it, and a green note, used inside several of the pictures below
const coin = (x: number, y: number, r = 6, f = '#f5c842') => circ(x, y, r, f) + `<circle cx="${x}" cy="${y}" r="${(r * .62).toFixed(1)}" fill="none" stroke="#c48a1a" stroke-width="1.3" stroke-dasharray="2 1.6"/>`;
const note = (x: number, y: number, w = 18, h = 10, f = '#5fae6a') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${f}" ${W}/><circle cx="${x + w / 2}" cy="${y + h / 2}" r="${(h * .26).toFixed(1)}" fill="#fff" opacity=".8"/>`;
const tag = (x: number, y: number, f = '#ffd23f') => `<path d="M${x} ${y}h12l5 5-5 5H${x}z" fill="${f}" ${W}/>${dot(x + 13, y + 5, 1.4, '#fff')}`;

// Shop and Pay: a shopping basket with a price tag and a coin dropping into a hand
def('mn3:shoppay', `<path d="M7 20h34l-4 20a4 4 0 0 1-4 3H15a4 4 0 0 1-4-3z" fill="#ff9f43" ${W}/><path d="M15 20l6-11M33 20l-6-11" ${W} ${N}/><path d="M12 27h24M13 33h22" stroke="#c96a1c" stroke-width="2" stroke-linecap="round"/>`
  + `${circ(17, 17, 3.4, '#ff5a5a')}${circ(25, 15, 3.6, '#5fd36a')}` + g('a-bob', coin(36, 11, 6), '36px 11px') + tag(4, 6));
// Give Change: counting up along a little road of coins, from the price tag to the note
def('mn3:givechange', `<path d="M5 34q19-12 38 0" stroke="#c9a05a" stroke-width="3" stroke-dasharray="3 3" ${N}/>` + tag(2, 28, '#ffd23f')
  + g('a-hop', coin(18, 26, 4.6), '18px 26px') + g('a-hop2', coin(26, 24, 4.6), '26px 24px') + note(30, 28, 15, 9, '#4f8fd6')
  + `<path d="M14 12h20M28 7l6 5-6 5" ${W} ${N}/>`);
// Save for a Toy: a piggy bank under a teddy with a goal flag
def('mn3:toysave', `<ellipse cx="22" cy="32" rx="15" ry="10" fill="#ff9ec4" ${W}/><path d="M34 28l7-3v8l-6-1" fill="#ff9ec4" ${W}/><path d="M13 40v4M29 40v4" ${W}/><rect x="18" y="22" width="8" height="2.4" rx="1.2" fill="${O}"/>${dot(31, 29, 1.5)}`
  + g('a-bob', coin(22, 14, 5), '22px 14px') + `<path d="M40 4v16" ${W}/><path d="M40 4l6 3-6 3" fill="#5fd36a" ${W}/>`);
// Needs before Wants: a bowl of rice first (number 1) and a balloon after (number 2)
def('mn3:needsfirst', `<path d="M4 24h22a11 11 0 0 1-22 0z" fill="#fff" ${W}/><path d="M7 24c0-6 16-6 16 0" fill="#fff8e6" ${W}/>${circ(10, 10, 5, '#43c463')}<text x="10" y="13.4" font-size="8" font-weight="900" text-anchor="middle" fill="#fff" font-family="Fredoka,sans-serif">1</text>`
  + g('a-sway', `<ellipse cx="36" cy="17" rx="7" ry="8.5" fill="#ff7eb8" ${W}/><path d="M36 26q-2 6 1 12" ${W} ${N}/>`, '36px 30px') + `${circ(40, 38, 4.6, '#ffb020')}<text x="40" y="41" font-size="7" font-weight="900" text-anchor="middle" fill="#fff" font-family="Fredoka,sans-serif">2</text>`);
// Price Tag Line-up: three tags in a row on a string, small to big
def('mn3:pricesort', `<path d="M3 10q21 8 42 0" stroke="${O}" stroke-width="1.6" ${N}/>`
  + `<rect x="5" y="14" width="10" height="12" rx="2" fill="#a8e6a1" ${W}/><rect x="19" y="14" width="10" height="17" rx="2" fill="#ffd23f" ${W}/><rect x="33" y="14" width="10" height="23" rx="2" fill="#ff9f43" ${W}/>`
  + `${coin(10, 21, 2.6)}${coin(24, 21, 2.6)}${coin(24, 27, 2.6)}${coin(38, 21, 2.6)}${coin(38, 27, 2.6)}${coin(38, 33, 2.6)}`
  + g('a-pulse', `<path d="M6 43h34M35 39l5 4-5 4" ${W} ${N}/>`, '24px 43px'));
// Market Day: a woman's nón lá over a stall with a basket of mangoes and one note held up
def('mn3:marketday', `<rect x="5" y="26" width="38" height="16" rx="2" fill="#c98a4a" ${W}/><path d="M5 31h38" stroke="#a46a34" stroke-width="2"/><path d="M7 26l17-16 17 16z" fill="#f6d77a" ${W}/><path d="M12 22h24" stroke="#d9b24a" stroke-width="1.5"/>`
  + `<ellipse cx="17" cy="25" rx="5" ry="3.6" fill="#ffb020" ${W}/><ellipse cx="25" cy="24" rx="5" ry="3.6" fill="#ffc94a" ${W}/>` + g('a-wiggle', note(28, 32, 14, 8, '#d36aa0'), '35px 36px'));
// Coin Sort: two jars, one with silver coins and one with gold
def('mn3:coinsort', `<path d="M5 18h16v20a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4z" fill="#e8f6ff" ${W}/><path d="M27 18h16v20a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4z" fill="#e8f6ff" ${W}/>`
  + `${coin(13, 36, 4, '#e3e7ec')}${coin(13, 29, 4, '#e3e7ec')}${coin(35, 36, 4)}${coin(35, 29, 4)}`
  + g('a-hop', coin(24, 9, 5), '24px 9px') + `<path d="M19 12l-5 4M29 12l5 4" stroke="${O}" stroke-width="2" stroke-linecap="round" ${N}/>`);
// Make the Amount: coins adding up to an equals sign and a note
def('mn3:makeamount', `${coin(9, 18, 5.4)}${coin(20, 18, 5.4, '#e3e7ec')}${coin(14.5, 29, 5.4)}<path d="M24 26h6M24 31h6" ${W} ${N}/>` + g('a-pulse', note(31, 23, 14, 10, '#e0614a'), '38px 28px')
  + `<path d="M5 9h14" stroke="#43c463" stroke-width="3" stroke-linecap="round"/><path d="M12 4v10" stroke="#43c463" stroke-width="3" stroke-linecap="round"/>` + sparkle(40, 10, .9));
// Budget a Picnic: a checked picnic blanket with a basket and a small purse
def('mn3:budgetpicnic', `<path d="M3 34l12-10h30l-10 10z" fill="#ff7a7a" ${W}/><path d="M9 29h30M21 24l-6 10M33 24l-6 10" stroke="#fff" stroke-width="2.4"/>`
  + `<path d="M17 18h14l-2 9H19z" fill="#e8b46a" ${W}/><path d="M20 18q4-7 8 0" ${W} ${N}/>` + g('a-bob', `<rect x="34" y="6" width="11" height="9" rx="3" fill="#a77bff" ${W}/>${coin(39.5, 10.5, 2.4)}`, '39px 10px')
  + `<rect x="4" y="38" width="40" height="6" rx="3" fill="#a8e6a1" ${W}/>`);
// Earn by Chores: a broom and a watering can, with a coin as the reward
def('mn3:chores', `<path d="M12 4l6 22" stroke="#a46a34" stroke-width="3" stroke-linecap="round"/><path d="M12 24l12-3 6 14-14 4z" fill="#ffd23f" ${W}/><path d="M17 28l4 10M22 27l4 10" stroke="#c9a05a" stroke-width="1.6"/>`
  + `<path d="M30 14h12v12H30z" fill="#5fb6ff" ${W}/><path d="M30 17l-6-4" ${W} ${N}/><path d="M42 17q5 0 4 6" ${W} ${N}/>` + g('a-hop', coin(38, 37, 5.4), '38px 37px'));
// Two Homes Money: an Australian coin and a Vietnamese note, side by side, each with its own colour band
def('mn3:twomoney', `<rect x="3" y="6" width="20" height="5" rx="2" fill="#2f5fbf" ${W}/><rect x="25" y="6" width="20" height="5" rx="2" fill="#e8332a" ${W}/>${dot(35, 8.5, 1.6, '#ffd23f')}`
  + g('a-wiggle', coin(13, 27, 9), '13px 27px') + g('a-wiggle', note(25, 19, 20, 16, '#d36aa0'), '35px 27px') + `<path d="M8 42h32" stroke="#a8e6a1" stroke-width="3" stroke-linecap="round"/>`);
// the market stall (sạp) of Market Day, where the seller stands with her goods
def('mn3:sap', `<path d="M4 18l20-12 20 12z" fill="#e8433a" ${W}/><path d="M10 16h28" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/><path d="M8 18v24M40 18v24" ${W}/>`
  + `<rect x="6" y="28" width="36" height="8" rx="2" fill="#c98a4a" ${W}/><rect x="8" y="36" width="32" height="7" fill="#a46a34" ${W}/>`
  + `<ellipse cx="15" cy="27" rx="4.6" ry="3" fill="#ffb020" ${W}/><ellipse cx="24" cy="26" rx="4.6" ry="3" fill="#5fd36a" ${W}/><ellipse cx="33" cy="27" rx="4.6" ry="3" fill="#ff7a7a" ${W}/>`);
// a little purse with a clasp, for "money left" in Needs before Wants and Budget a Picnic
def('mn3:purse', `<path d="M8 20h32a3 3 0 0 1 3 3v16a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V23a3 3 0 0 1 3-3z" fill="#a77bff" ${W}/><path d="M16 20q8-12 16 0" ${W} ${N}/>${circ(21, 16, 2.4, '#ffd23f')}${circ(27, 16, 2.4, '#ffd23f')}`
  + `<path d="M5 28h38" stroke="#7d55d6" stroke-width="2"/>` + g('a-twinkle', sparkle(36, 34, .8), '36px 34px'));
