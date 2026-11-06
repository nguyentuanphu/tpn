// (v1.08f bugs, #816: "every round of Bottle Music is the same") Bottle Music played as an under-5 and as a big kid at
// Easy: each round's question and bottles are written down as the child sees them, and no two rounds of a game may be the
// same. The roundvariety check plays big kids only, so it never saw the under-5s' level, where every round was the same.
// By hand: cd tests && node bottle-variety.mts
import { launch, open, clear } from './harness.mts';

type Round = { ask: string; bottles: string };
async function play(page, age: 'little' | 'big'): Promise<Round[]> {
  return page.evaluate(async age => {
    const w = t => new Promise(r => setTimeout(r, t)), p = window.__sv.heroes[0].profile;
    const { playWatch } = await import(String('/js/games/frame.js'));
    p.age = age; p.gameDiff = { ...(p.gameDiff || {}), sci_sound: 'easy' };
    window.__sv.playGame(0, 'sci_sound', 'hub');
    let gl = null; for (let k = 0; k < 60 && !gl; k++) { await w(100); gl = document.querySelector('.gl:not(.out)'); }
    if (!gl) return [];
    const out = []; let last = null; const t0 = Date.now();
    while (out.length < 3 && Date.now() - t0 < 60000 && gl.isConnected) {
      await w(150);
      document.querySelectorAll('.howto').forEach(h => h.remove());
      const pickLv = gl.querySelector('.gl-lvlpick'); if (pickLv) { (pickLv.querySelector('[data-l].on') || pickLv.querySelector('[data-l]'))?.click(); continue; }
      if (gl.querySelector('.gl-win')) break;
      // the guess before the experiment: the question and each bottle (its colour and how full it is, in screen order)
      const offer = playWatch.offer;
      if (offer && offer !== last && offer.some(e => e.isConnected && e.offsetWidth)) {
        last = offer; await w(150);
        const help = gl.querySelector('.gl-help')?.textContent || '';
        const bottles = [...gl.querySelectorAll('.sx-bottle')].map(b => (b.getAttribute('aria-label') || '') + ':' + (b.innerHTML.match(/<rect[^>]*>/g) || []).join('')).join(' | ');
        out.push({ ask: help, bottles });
        offer[0].click(); continue;
      }
      // the experiment: tap every bottle with the spoon
      for (const b of gl.querySelectorAll<HTMLElement>('.sx-bottle')) { b.click(); await w(120); }
      gl.querySelector<HTMLElement>('.sx-go, .gl-next')?.click();
    }
    gl.querySelector('.gl-x')?.click(); await w(300);
    return out;
  }, age);
}

export async function bottleVarietyCheck(b) {
  const fails: string[] = [], seen: string[] = [];
  for (const age of ['little', 'big'] as const) {
    const P = await open(b, { w: 1024, h: 768, settings: { voice: false } }); await clear(P.page);
    const r = await play(P.page, age); await P.ctx.close();
    if (r.length < 3) { fails.push(`${age}: only ${r.length} rounds read`); continue; }
    const keys = r.map(x => x.ask + ' || ' + x.bottles);
    keys.forEach((k, i) => { const j = keys.indexOf(k); if (j < i) fails.push(`${age}: round ${i + 1} = round ${j + 1} (${k.slice(0, 160)})`); });
    if (age === 'little' && new Set(r.map(x => x.ask)).size < 2) fails.push(`little: the same question every round: ${r[0].ask}`);
    seen.push(`${age}: ${r.length} rounds, ${new Set(r.map(x => x.ask)).size} questions`);
  }
  if (fails.length) throw new Error(fails.join(' | '));
  return `Bottle Music: no two rounds the same (${seen.join('; ')}); the under-5s are asked for the highest and the lowest note`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const b = await launch();
  try { console.log(await bottleVarietyCheck(b)); } catch (e) { console.log('FAIL ' + (e as Error).message); process.exitCode = 1; } finally { await b.close(); }
}
