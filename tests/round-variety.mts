// (v1.08 variety, owner 3 Nov 2026 AEDT: "in many games the rounds are all the same") every game that asks the child to
// pick the right one (untilRight, seen through playWatch.ask) is played for a few rounds in a row at Easy, Medium, Hard
// and Talent, always tapping the right answer. Each round is written down as what the child sees: the question line,
// the picture and the answers (ids and inline positions taken out, the order of the answers kept apart). The check fails
// a game when two rounds of one game show the same thing, or when the right answer sits in the same place every round.
//
// By hand, for the audit: node round-variety.mts [id ...]   (prints every game, its rounds and what repeats)
import { openAllGamesFixture, clear, launch } from './harness.mts';

const ok = (cond, msg) => { if (!cond) throw new Error(msg); };
const LEVELS = ['easy', 'medium', 'hard', 'talent'];
/** rounds looked at in a row, per game and level */
export const ROUNDS = 4;
// games that ask the same thing on purpose, with the reason; every other game must vary its rounds
export const VARIETY_EXEMPT: Record<string, string> = {
  crabwalk: 'left or right, step after step: with only two ways two steps can look the same; it never goes the same way three times in a row (js/games/animals2.ts)',
  loudquiet: 'the question is a sound (loud or quiet), not a picture; the screen is the same on purpose and the answer never stays the same three times in a row (js/games/music2.ts)'
};

// games where the right answer's place follows a rule on purpose (only the place check is left out for them)
export const PLACE_EXEMPT: Record<string, string> = {
  vi_readalong: 'tap the words of the sentence in reading order: the next word is always the first one left (js/games/tiengviet2.ts)'
};

type Seen = { q: string; pos: number; n: number }[];
/** play one game at one level in the page: up to `rounds` questions, the right answer each time */
async function probe(page, id: string, level: string, rounds: number): Promise<Seen | null> {
  return page.evaluate(async ([id, level, rounds]) => {
    // the game's own pauses (talk, cheers, the next round) run 8 times faster: only what is shown matters here
    if (!window.__rvSt) { const st = window.setTimeout.bind(window); window.__rvSt = st; window.setTimeout = ((f, t, ...a) => st(f, Math.min(+t || 0, 4000) / 8, ...a)) as typeof setTimeout; }
    const w = t => new Promise(r => window.__rvSt(r, t)), p = __sv.heroes[0].profile;
    const { playWatch, GAMES } = await import('/js/games/frame.js');
    // a choice where any answer goes on (tapOne) is a round only in a learning game (a guess before an experiment); in a
    // board, a pad or a drag game each tap is a move, not a round
    const guesses = !!GAMES[id]?.learn;
    p.age = 'big'; p.gameDiff = { ...(p.gameDiff || {}), [id]: level };
    __sv.playGame(0, id, 'hub');
    let gl = null; for (let k = 0; k < 40 && !gl; k++) { await w(100); gl = document.querySelector('.gl:not(.out)'); }
    if (!gl) return null;
    const shown = e => e && e.isConnected && (e.offsetWidth || e.getBBox?.()?.width);
    // what the child sees, without what only moves things about (ids, inline styles, the hint wiggle, the found mark)
    // (a thing placed by left/top keeps where it is, and a turned thing its turn: in a tap-the-thing game that is what changes)
    const where = st => { const x = /left:\s*(-?\d+)/.exec(st), y = /top:\s*(-?\d+)/.exec(st); const turn = /rotate\((-?\d+)/.exec(st); return (x && y ? ` at="${x[1]},${y[1]}"` : '') + (turn ? ` turn="${turn[1]}"` : ''); };
    const clean = h => String(h).replace(/\sstyle="([^"]*)"/g, (_, st) => where(st)).replace(/\s(id|data-v|aria-[a-z]+|tabindex)="[^"]*"/g, '').replace(/url\(#[^)]*\)/g, 'url()').replace(/\b(hint|found|on|picked|right|wrong|shake|pop|in|out|anim[a-z-]*)\b/g, '').replace(/\s+/g, ' ');
    const out = []; let lastEls = null, lastAt = Date.now();
    const t0 = Date.now();
    // a game with no choices to tap (a board, a pad, a drag game) is left after 5 s without a question
    while (out.length < rounds && Date.now() - t0 < 25000 && Date.now() - lastAt < 5000 && gl.isConnected) {
      await w(120);
      document.querySelectorAll('.howto').forEach(h => h.remove());
      const pickLv = gl.querySelector('.gl-lvlpick'); if (pickLv) { (pickLv.querySelector('[data-l].on') || pickLv.querySelector('[data-l]'))?.click(); continue; }
      if (gl.querySelector('.gl-win')) break;
      // a question with a right answer (untilRight), or else a choice where any answer goes on (tapOne: a guess)
      const ask = playWatch.ask || (guesses && playWatch.offer ? { els: playWatch.offer, check: null } : null);
      if (!ask || ask.els === lastEls || !ask.els.some(shown)) continue;
      await w(120); // let the round finish drawing
      if ((playWatch.ask || { els: guesses ? playWatch.offer : null }).els !== ask.els) continue;
      lastEls = ask.els; lastAt = Date.now();
      // in the order the child sees them (top to bottom, left to right), not the order the game made them
      const at = e => { const r = e.getBoundingClientRect(); return [Math.round(r.top / 8), r.left]; };
      const els = ask.els.filter(shown).sort((a, b) => { const [ay, ax] = at(a), [by, bx] = at(b); return ay - by || ax - bx; }), right = ask.check ? els.find(e => ask.check(e)) : els[0];
      if (!right) break;
      const stage = gl.querySelector('.gl-stage'), help = gl.querySelector('.gl-help')?.textContent || '';
      // the answers as a set (sorted), the picture without the answers' order, and the question line
      const answers = els.map(e => clean(e.outerHTML)).sort();
      const pic = clean(stage?.innerHTML || '').replace(/\d+(\.\d+)?(?=\s*(px|%))/g, '');
      const q = help + ' || ' + answers.join(' ¦ ') + ' || right=' + clean(right.outerHTML) + ' || ' + (pic.length > 4000 ? pic.length + ':' + pic.slice(0, 4000) : pic);
      // things placed about a scene (a fish, a swimmer) have no first or last place: only rows of answers are counted
      // (and a free choice, where every answer is right, has no right place at all)
      const row = ask.check && !els.some(e => getComputedStyle(e).position === 'absolute') && !els.every(e => ask.check(e));
      out.push({ q, pos: row ? els.indexOf(right) : -1, n: row ? els.length : 0 });
      right.click();
      await w(150);
    }
    gl.querySelector('.gl-x')?.click(); await w(300); document.querySelectorAll('.dialog,.reward,.modal').forEach(e => e.remove());
    return out;
  }, [id, level, rounds]).catch(() => null);
}

/** what repeats in one game's rounds at one level ('' when they all differ) */
export function repeats(r: Seen): string {
  if (!r || r.length < 2) return '';
  const why: string[] = [];
  const seen = new Map<string, number>();
  r.forEach((x, i) => { if (seen.has(x.q)) why.push(`round ${i + 1} = round ${seen.get(x.q) + 1}`); else seen.set(x.q, i); });
  return why.join(', ');
}
/** the right answer in the same place in every round at every level (a shuffle that never moves it); looked at over all
 * the levels together, so a fair shuffle that happens to land the same way a few times is never named */
export function stuck(levels: Record<string, Seen | null>): string {
  const multi = Object.values(levels).flatMap(r => r || []).filter(x => x.n > 1);
  return multi.length >= 8 && new Set(multi.map(x => x.pos)).size === 1 ? `right answer always in place ${multi[0].pos + 1} (${multi.length} rounds)` : '';
}

/** every game (or `only`) at the four levels, on `workers` pages side by side; returns the games and levels that repeat,
 * and the games with no choices to look at */
export async function roundVarietyScan(b, only: string[] | null = null, rounds = ROUNDS, workers = +(process.env.WORKERS || 3), sample: number | null = null) {
  // a sample (the suite's everyday run): two levels per game, a different pair each run; null: all four
  const fresh = async (tries = 2) => {
    for (let t = 1; ; t++) {
      try { const W = await openAllGamesFixture(b, { w: 1024, h: 768, settings: { voice: false } }); await clear(W.page); return W; } catch (e) { if (t >= tries) throw e; }
    }
  };
  const first = await fresh();
  const ids: string[] = only || await first.page.evaluate(async () => Object.keys((await import('/js/games/frame.js')).GAMES));
  const bad: Record<string, Record<string, string>> = {}, none: string[] = [], log: Record<string, Record<string, Seen | null>> = {}, errs: string[] = [];
  const queue = ids.slice(), levelsOf = (id: string) => sample == null ? LEVELS : [0, 2].map(k => LEVELS[(sample + ids.indexOf(id) + k) % 4]);
  const work = async (W) => {
    for (let id = queue.shift(); id; id = queue.shift()) {
      log[id] = {};
      for (const lv of levelsOf(id)) {
        const r = await Promise.race([probe(W.page, id, lv, rounds), new Promise<null>(res => setTimeout(() => res(null), 40000))]);
        log[id][lv] = r;
        if (W.page.isClosed()) { errs.push(...W.errors, `page closed during ${id}`); W = await fresh(); }
        const why = repeats(r);
        if (why) (bad[id] ||= {})[lv] = why;
      }
      const pos = PLACE_EXEMPT[id] ? '' : stuck(log[id]); if (pos) (bad[id] ||= {}).all = pos;
      if (process.env.RV_LOG) console.log(`${id}: ${bad[id] ? JSON.stringify(bad[id]) : 'ok'} (${levelsOf(id).map(lv => log[id][lv]?.length ?? 'x').join('/')})`);
      if (levelsOf(id).every(lv => !log[id][lv] || log[id][lv].length < 2)) none.push(id);
    }
    errs.push(...W.errors); await W.ctx.close().catch(() => { });
  };
  const pages = [first]; for (let i = 1; i < Math.min(workers, ids.length); i++) pages.push(await fresh());
  await Promise.all(pages.map(work));
  return { ids, bad, none, log, errs };
}

export async function roundVarietyCheck(b, { sample = null as number | null, only = null as string[] | null } = {}) {
  const { ids, bad, none, errs } = await roundVarietyScan(b, only, ROUNDS, 3, sample);
  const fails = Object.entries(bad).filter(([id]) => !VARIETY_EXEMPT[id]).map(([id, l]) => `${id}: ${Object.entries(l).map(([lv, w]) => `${lv} ${w}`).join('; ')}`);
  ok(!fails.length, `${fails.length} games repeat their rounds: ${fails.join(' | ')}`);
  return `${sample != null ? 'SAMPLE (two levels per game, a different pair each run; all four when the games change): ' : ''}${ids.length - none.length} games with choices played ${ROUNDS} rounds in a row at ${sample != null ? 'two of Easy, Medium, Hard and Talent' : 'Easy, Medium, Hard and Talent'}: no round repeats another and the right answer moves; ${none.length} games have no choice buttons to compare (boards, pads, drawing and drag games)${errs.length ? `; page notes: ${errs.slice(0, 3).join(' | ')}` : ''}`;
}

// by hand: the audit
if (import.meta.url === `file://${process.argv[1]}`) {
  const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
  const b = await launch();
  const { ids, bad, none, log, errs } = await roundVarietyScan(b, only.length ? only : null, +(process.env.ROUNDS || ROUNDS));
  await b.close();
  const fs = await import('node:fs');
  fs.mkdirSync('out', { recursive: true });
  fs.writeFileSync('out/round-variety.json', JSON.stringify({ bad, none, log }, null, 1));
  for (const [id, l] of Object.entries(bad)) console.log(`REPEAT ${id}: ${Object.entries(l).map(([lv, w]) => `${lv} ${w}`).join('; ')}`);
  console.log(`\n${ids.length} games; ${Object.keys(bad).length} repeat; ${none.length} with no choices: ${none.join(',')}`);
  if (errs.length) console.log('errors:', errs.slice(0, 10).join(' | '));
}
