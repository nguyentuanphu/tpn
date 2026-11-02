// (v1.07 levels, owner's plan Focus 2, docs/levels/README.md) every game in Play plays differently at Easy, Medium, Hard and
// Talent. A big kid opens EVERY game at the four levels, and an under-5 opens it once; nothing is tapped. Each game writes
// the numbers it uses for its level on the frame: its own data-lv on the stage, and the values it picked through lv(...)
// as data-lvnote on the layer (js/games/frame.ts lvNote). The check fails a game when that is empty, when Easy and Talent
// are the same, when fewer than three of the four levels differ, when Talent is not marked only at Talent, or when an
// under-5 gets Talent, a tier above 0 or the Talent settings. Under-5s also never see Talent in the level picker.
import { clear, openAllGamesFixture } from './harness.mjs';

const ok = (cond, msg) => { if (!cond) throw new Error(msg); };
// games where the levels do not apply, with the reason (LV-004: a free pad with no goal and nothing to get right)
const PAD = 'free painting pad (js/games/art-pad.ts): any 12 marks, nothing to get right';
export const LEVEL_EXEMPT: Record<string, string> = {
  ...Object.fromEntries(['stamps', 'weave', 'mosaic', 'nonla', 'aodai', 'kitepaint', 'shades', 'scene', 'lacquer', 'scratch', 'bubblepaint',
    'fingerpaint', 'weatherpaint', 'thocam', 'pixelpic', 'fireworks', 'masks', 'makeface', 'gallery', 'leafrub'].map(id => [id, PAD])),
  rd_book: 'make your own book: no right answer',
  music: 'free music pad: play any notes, no goal',
  sparklefruitbar: 'a game of chance with fixed odds and 20 rounds that its rules promise (and online players share)'
};
const LEVELS = ['little', 'easy', 'medium', 'hard', 'talent'];

export async function levelsAllCheck(b, only: string[] | null = null) {
  const P = await openAllGamesFixture(b, { w: 390, h: 844, touch: true, settings: { voice: false } }); await clear(P.page);
  const ids: string[] = (only || await P.page.evaluate(async () => Object.keys((await import('/js/games/frame.js')).GAMES))).filter(id => !LEVEL_EXEMPT[id]);
  const seen: Record<string, Record<string, { sig: string; tier: string; talent: boolean } | null>> = {};
  // three pages side by side, each taking the next game from the list (one page for a game at a time); a page that
  // crashes is replaced, and its game is named as not opening instead of stopping the check
  const queue = ids.slice(), pages = [P], errs: string[] = [];
  const work = async (W) => {
    for (let id = queue.shift(); id; id = queue.shift()) {
      seen[id] = {};
      for (const d of LEVELS) {
        const step = W.page.evaluate(async ([id, d]) => {
          const w = t => new Promise(r => setTimeout(r, t)), p = __sv.heroes[0].profile;
          p.age = d === 'little' ? 'little' : 'big'; p.gameDiff = { ...(p.gameDiff || {}), [id]: d === 'little' ? 'easy' : d };
          __sv.playGame(0, id, 'hub');
          let gl = null; for (let k = 0; k < 40 && !gl; k++) { await w(100); gl = document.querySelector('.gl:not(.out)'); }
          if (!gl) return null;
          // wait until what the game wrote has settled (the same twice in a row, at most about 2 s)
          const sig = () => (gl.querySelector('.gl-stage')?.dataset.lv || '') + '|' + (gl.dataset.lvnote || '');
          let last = null, now = sig(); for (let k = 0; k < 10 && (now === '|' || now !== last); k++) { await w(200); last = now; now = sig(); }
          const r = { sig: now, tier: gl.dataset.tier || '', talent: gl.dataset.talent === '1' };
          gl.querySelector('.gl-x')?.click(); await w(300); document.querySelectorAll('.dialog,.reward,.modal').forEach(e => e.remove());
          return r;
        }, [id, d]).catch(() => null);
        seen[id][d] = await Promise.race([step, new Promise<null>(r => setTimeout(() => r(null), 12000))]);
        if (W.page.isClosed()) { errs.push(...W.errors, `page closed during ${id}`); W = await openAllGamesFixture(b, { w: 390, h: 844, touch: true, settings: { voice: false } }); await clear(W.page); pages.push(W); }
      }
    }
  };
  const more = await Promise.all([1, 2].map(async () => { const W = await openAllGamesFixture(b, { w: 390, h: 844, touch: true, settings: { voice: false } }); await clear(W.page); pages.push(W); return W; }));
  await Promise.all([P, ...more].map(work));
  // the level picker of an under-5: no Talent
  const picker = await P.page.evaluate(async () => {
    const w = t => new Promise(r => setTimeout(r, t)), p = __sv.heroes[0].profile; p.age = 'little'; p.gameDiff = { ...(p.gameDiff || {}), counting: 'easy' };
    __sv.playGame(0, 'counting', 'hub'); let gl = null; for (let k = 0; k < 40 && !gl; k++) { await w(100); gl = document.querySelector('.gl:not(.out)'); }
    gl?.querySelector('.gl-lvl')?.click(); await w(300);
    const opts = [...document.querySelectorAll('.gl-lvlpick [data-l]')].map(b => b.dataset.l);
    document.querySelector('.gl-lvlpick')?.remove(); gl?.querySelector('.gl-x')?.click(); await w(300);
    return opts;
  });
  for (const W of pages) { errs.push(...W.errors); if (W !== P) await W.ctx.close().catch(() => { }); }
  await P.ctx.close();
  const bad: string[] = [];
  for (const id of ids) {
    const s = seen[id], big = ['easy', 'medium', 'hard', 'talent'].map(d => s[d]);
    if (big.some(v => !v)) { bad.push(`${id}: did not open at ${['easy', 'medium', 'hard', 'talent'].filter((d, i) => !big[i]).join('/')}`); continue; }
    const sigs = big.map(v => v.sig);
    if (sigs.some(x => x === '|')) bad.push(`${id}: writes no level numbers (${sigs.join(' / ')})`);
    else if (sigs[0] === sigs[3]) bad.push(`${id}: Easy = Talent (${sigs[0]})`);
    else if (new Set(sigs).size < 3) bad.push(`${id}: only ${new Set(sigs).size} different levels (${sigs.join(' / ')})`);
    if (!big[3].talent || big.slice(0, 3).some(v => v.talent)) bad.push(`${id}: Talent marked wrong (${big.map(v => v.talent).join(',')})`);
    const l = s.little;
    if (l && (l.talent || l.tier !== '0' || (l.sig !== '|' && l.sig === sigs[3] && sigs[0] !== sigs[3]))) bad.push(`${id}: under-5 not gentle (${l.sig} tier ${l.tier}${l.talent ? ' talent' : ''})`);
  }
  if (picker.includes('talent') || !picker.includes('easy')) bad.push('under-5 level picker: ' + picker.join(','));
  ok(!bad.length && !errs.length, `${bad.length} problems: ${bad.join(' ; ')} ${errs.slice(0, 5).join(' | ')}`);
  return `${ids.length} games play differently at Easy, Medium, Hard and Talent (each writes its level numbers; Easy is never Talent; at least three levels differ); under-5s play gently with no Talent; ${Object.keys(LEVEL_EXEMPT).length} free pads exempt`;
}
