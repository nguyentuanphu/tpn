// Sparkle Valley check `companiongoal` (v1.08 companion, owner's plan B, 3 Nov 2026 AEDT), run from tests/run.mts.
// (v1.08 companion, owner's plan B, 3 Nov 2026 AEDT) the owner saw no coin goal chip for "Henry N", whose companion wears
// the golden crown: the crown was the last of four hats, so with every hat bought there was no next hat and the chip hid.
// Now four more hats follow the crown (each its own drawing and 3D hat), and with every hat bought the chip stays and
// says "All hats! / Đủ mũ rồi!" (a tap opens the Companions tab). With no hat, some hats (Henry: the first four) and all
// hats, on a phone (the small chip under the clock), a tablet and a computer; a child with no companion has no chip
import { open, clear } from './checks/shared.mts';

export async function companionGoalCheck(b) {
  const rows = [];
  for (const [dev, w, h, lang] of [['phone', 390, 844, 'vi'], ['tablet', 820, 1180, 'en'], ['computer', 1366, 800, 'vi']]) {
    const P = await open(b, { w, h, touch: w < 1000, lang }); await clear(P.page);
    const r = await P.page.evaluate(async () => {
      const G = __sv, hero = G.heroes[0], p = hero.profile, wt = t => new Promise(r => setTimeout(r, t)), S = await import('/js/state.js'), KP = await import('/js/kidplay.js'), A = await import('/js/art.js'), U = await import('/js/ui/common.js'), out = {};
      const chip = () => G.huds[0].root.querySelector('.c-goal'), seen = () => { const c = chip(); if (!c || c.hidden) return null; const q = c.getBoundingClientRect(); return q.width > 0 && q.height > 0 ? { text: c.textContent.replace(/\s+/g, ' ').trim(), all: c.classList.contains('allhats'), w: Math.round(q.width), h: Math.round(q.height) } : null; };
      p.age = 'little'; G.addCoins(40 - S.farm.coins);
      // the hats: eight, in order, each with its own drawing and its own 3D hat
      out.hats = KP.HATS.map(x => x.id); out.prices = KP.HATS.map(x => x.price);
      out.art = KP.HATS.filter(x => U.PAL_HAT_ICON[x.id] && A.hasArt(U.PAL_HAT_ICON[x.id])).length + (A.hasArt('palhat:all') ? 1 : 0);
      out.icons = new Set(KP.HATS.map(x => U.PAL_HAT_ICON[x.id])).size;
      out.models = new Set(KP.HATS.map(x => { const g = KP.buildHat(x.id); let n = 0; g.traverse(o => { if (o.geometry) n += o.geometry.attributes.position.count; }); return n; })).size;
      out.names = KP.HATS.every(x => x.en && x.vi && x.en !== x.vi);
      // no companion: no chip
      p.lanterns = { done: { p_owl: true }, chapters: {} }; G.kidplay.refresh(); await wt(700); out.none = seen();
      // a companion and no hat: the party hat
      p.lanterns = { companion: 'firefly', done: { p_owl: true }, chapters: {}, pet: { hats: [], feeds: 0 } }; G.lanterns.companions.sync(); G.kidplay.refresh(); await wt(700); out.noHat = seen();
      // some hats: Henry's four, the crown on; the next goal is the beanie
      p.lanterns.pet = { hats: ['party', 'flower', 'nonla', 'crown'], hat: 'crown', feeds: 0 }; G.kidplay.refresh(); await wt(700); out.some = seen(); out.someNext = G.kidplay.nextHat(hero)?.id;
      // all hats: the chip stays and says so; a tap opens the Companions tab, no dialog, no coins spent
      p.lanterns.pet = { hats: KP.HATS.map(x => x.id), hat: 'lotus', feeds: 0 }; G.lanterns.companions.sync(); G.kidplay.refresh(); await wt(700); out.all = seen();
      const c0 = S.farm.coins; chip()?.click(); await wt(900);
      out.tab = document.querySelector('.modal.pad .pad-tabs .on')?.dataset.t || ''; out.dialog = !!document.querySelector('.dialog .dchoices');
      out.card = document.querySelector('.modal.pad .pal-goal.allhats')?.textContent.replace(/\s+/g, ' ').trim() || ''; out.spent = S.farm.coins !== c0;
      out.lotus3d = !!G.lanterns.companions.of(hero).hat;
      return out;
    });
    await P.page.screenshot({ path: `out/companiongoal-${dev}.png` });
    const bad = [], vi = lang === 'vi', next = vi ? 'Mũ sinh nhật' : 'Party hat', beanie = vi ? 'Mũ len' : 'Woolly beanie', allTxt = vi ? 'Đủ mũ rồi!' : 'All hats!';
    if (r.hats.join() !== 'party,flower,nonla,crown,beanie,captain,wizard,lotus' || r.prices.some((x, k) => k && x <= r.prices[k - 1])) bad.push('the hats ' + r.hats.join() + ' ' + r.prices.join());
    if (r.art !== 9 || r.icons !== 8 || r.models !== 8 || !r.names) bad.push(`drawings ${r.art}/9, icons ${r.icons}/8, 3D hats ${r.models}/8, names ${r.names}`);
    if (r.none) bad.push('a chip for a child with no companion: ' + JSON.stringify(r.none));
    const small = dev === 'phone';   // (the phone's small chip shows the picture and the count only)
    if (!r.noHat || !r.noHat.text.includes('0/30') || (!small && !r.noHat.text.includes(next))) bad.push('no hat: ' + JSON.stringify(r.noHat));
    if (!r.some || r.someNext !== 'beanie' || !r.some.text.includes('/100') || (!small && !r.some.text.includes(beanie))) bad.push('some hats: ' + JSON.stringify(r.some) + ' next ' + r.someNext);
    if (!r.all || !r.all.all || !r.all.text.includes(allTxt)) bad.push('all hats: ' + JSON.stringify(r.all));
    for (const k of ['noHat', 'some', 'all']) if (r[k] && r[k].h < 44) bad.push(`${k} chip ${r[k].h} px tall`);
    if (r.tab !== 'pals' || r.dialog || r.spent || !r.card.includes(allTxt)) bad.push(`the all-hats tap: tab ${r.tab}, dialog ${r.dialog}, coins spent ${r.spent}, card "${r.card}"`);
    if (!r.lotus3d) bad.push('the lotus crown is not drawn on the companion');
    if (P.errors.length) bad.push(...P.errors.slice(0, 2));
    await P.ctx.close();
    if (bad.length) throw new Error(dev + ': ' + bad.join('; '));
    rows.push(`${dev} ${w}x${h}`);
  }
  return `the coin goal chip with no hat (party hat 0/30), some hats (after the crown: the beanie, /100) and all 8 (All hats!, opens the Companions tab) on ${rows.join(', ')}; none without a companion; 4 new hats, each its own drawing and 3D hat; screenshots out/companiongoal-*.png`;
}
