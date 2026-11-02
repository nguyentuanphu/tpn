// Drawings for grown-ups' notifications (v1.08 notifications, 3 Nov 2026 AEDT): a bell with a little sparkle (Grown-ups →
// Notifications) and a phone showing the Home Screen with the game's icon (the iPhone/iPad note). Their own keys, shown
// only through pic() / artSVG().
import { O, g, circ, sparkle, def, W, N } from './kit.js';
def('push:bell', g('a-sway', `<path d="M24 7c-8 0-12 6-12 13v9l-4 6h32l-4-6v-9c0-7-4-13-12-13z" fill="#ffd23f" ${W}/><path d="M17 20c0-4 2-7 6-8" stroke="#fff3b0" stroke-width="2.4" ${N} stroke-linecap="round"/>` +
  `<path d="M8 35h32" ${W}/>${circ(24, 39.5, 3.4, '#ff9f43')}${circ(24, 6, 2.2, '#ffd23f')}`, '24px 6px') + g('a-twinkle', sparkle(39, 11, .9), '39px 11px'));
def('push:phone', `<rect x="13" y="4" width="22" height="40" rx="5" fill="#5b6bd6" ${W}/><rect x="16" y="9" width="16" height="28" rx="2" fill="#dff4ff" stroke="${O}" stroke-width="1.6"/>` +
  `<rect x="18.5" y="12" width="5" height="5" rx="1.4" fill="#ff8fb3"/><rect x="24.5" y="12" width="5" height="5" rx="1.4" fill="#7fd0f5"/><rect x="18.5" y="19" width="5" height="5" rx="1.4" fill="#a8e6a1"/>` +
  g('a-pulse', `<rect x="24.5" y="19" width="5" height="5" rx="1.4" fill="#ffd23f" stroke="${O}" stroke-width="1.2"/>`, '27px 21.5px') + `${circ(24, 40.5, 1.6, '#dff4ff')}`);
