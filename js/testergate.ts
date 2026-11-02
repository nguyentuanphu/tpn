// Tester reports (owner, 12 Oct 2026 AEDT): is this device a tester? Studio's Releases page switches `tester` on for
// every device or only the ticked ones, each at a level (auto reports only, or with the ladybird). Only a tester
// device ever downloads js/tester.js; when the switch goes off, everything stops at once.
import { releaseOn, liveRule, onLive } from './custom.js';
import { testerLevel } from './content/tester.js';

export function testerGate(G) {
  const check = async () => {
    let me = ''; try { me = localStorage.getItem('sv2_playerid') || ''; } catch (e) { }
    const lv = testerLevel(releaseOn('tester', false), liveRule('tester'), me);
    if (G.tester && G.tester.level === lv) return;
    if (G.tester) G.tester.unmount();
    if (lv) (await import('./tester.js')).mountTester(G, lv);
  };
  check(); onLive(check);
}
