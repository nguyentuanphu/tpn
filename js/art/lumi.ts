// (v1.08b quality) Lumi, the star gardener, as the guide's face: leaf hair, a round warm face and her star lantern
// (owner, 2 Nov 2026 AEDT: "Lumi theo kiểu Finn/Flora"), and the picture of Play with Mum and Dad: a grown-up and a
// child side by side. Their own keys, shown through pic() / artSVG().
import { O, W, N, g, circ, eyes, smile, star5, sparkle, def } from './kit.js';
const leaf = (x: number, y: number, r: number) => `<path d="M${x} ${y}c-5-1-8-5-7-10 5 0 8 4 7 10z" fill="#5cc46a" ${W} transform="rotate(${r} ${x} ${y})"/>`;
def('lumi', leaf(15, 19, -30) + leaf(24, 13, 0) + leaf(33, 19, 30) +
  `<path d="M12 26c0-8 5-13 12-13s12 5 12 13" fill="#3f8f4e" ${W}/>` + circ(24, 28, 11, '#ffd8b8') +
  `<path d="M13 25c3-5 7-7 11-7s8 2 11 7" fill="#3f8f4e" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>` +
  eyes(20, 28, 28) + smile(24, 32, 6) + circ(17.5, 32, 1.6, '#ff9fb2', 'stroke="none"') + circ(30.5, 32, 1.6, '#ff9fb2', 'stroke="none"') +
  g('a-sway', `<path d="M39 30v6" ${W} ${N}/>` + star5(39, 41, 5.4, '#ffd23f'), '39px 30px') + g('a-twinkle', sparkle(9, 12, .8), '9px 12px'));
def('lumi:together', circ(16, 14, 6, '#ffd8b8') + `<path d="M7 42c0-11 4-18 9-18s9 7 9 18z" fill="#7b4bd6" ${W}/>` + eyes(14, 18, 14, 1.2) +
  circ(33, 24, 4.6, '#f1c39c') + `<path d="M26 42c0-8 3-13 7-13s7 5 7 13z" fill="#ff8fb3" ${W}/>` + eyes(31.4, 34.6, 24, 1) +
  g('a-pulse', `<path d="M24 9c-1.6-2.4-5-1.4-4.4 1.2.4 1.8 2.6 3 4.4 4.4 1.8-1.4 4-2.6 4.4-4.4.6-2.6-2.8-3.6-4.4-1.2z" fill="#ff5f7e" stroke="${O}" stroke-width="1.4"/>`, '24px 11px'));
