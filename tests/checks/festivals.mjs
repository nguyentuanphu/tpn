// Sparkle Valley checks: Festivals.
// Run them through tests/run.mjs (node run.mjs <check>) or tests/suite.mjs, not on their own.
// Moved unchanged from tests/run.mjs (v1.07 split-tests, 2 Nov 2026 AEDT); see tests/checks/README.md.
import { open, clear, start, only, want, check, ok, b } from './shared.mjs';

await check('festivalbootstrap', async () => (await import('../festival-bootstrap.mts')).festivalBootstrapCheck(b));

await check('festivalsync', async () => (await import('../festival-sync.mts')).festivalSyncCheck(b));

await check('festcal', async () => {
  // (round R, owner) the festival calendar: real dates, 3 weeks of build-up that grows each week, two festivals at once
  // in their own places, quiet days only a few days before, the day's timetable, Halloween trick-or-treat and keepsake
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const F = await import('/js/festivals.js'), st = d => F.activeFestivals(new Date(d + 'T10:00:00')).map(a => a.F.id + ':' + a.stage).sort().join(' ');
    const out = { oct9: st('2026-10-09'), oct10: st('2026-10-10'), oct25: st('2026-10-25'), oct31: st('2026-10-31'), anzac20: st('2027-04-20'), anzac23: st('2027-04-23'), tet: st('2026-02-17') };
    // the calendar on the Pad
    __sv.openPad(0, 'cal'); await new Promise(r => setTimeout(r, 500));
    out.rows = document.querySelectorAll('.pad .fcal-row').length; document.querySelectorAll('.modal').forEach(e => e.remove()); __sv.paused = false;
    // Halloween: knock at five doors for a pumpkin lantern (owner, 10 Oct: children cannot start a festival, so the check
    // has an admin schedule it for today in Studio, as a grown-up would)
    const h = __sv.heroes[0], C = (await import('/js/custom.js')).CUSTOM, ymd = (await import('/js/content/festival-visibility.js')).sydneyFestivalDate();
    C.releases = { ...(C.releases || {}), fest_halloween: { on: true, start: ymd, days: 1 } }; __sv.festivals.rebuild(); await new Promise(r => setTimeout(r, 2500));
    document.querySelectorAll('.dialog, .reward, .modal').forEach(e => e.remove());
    const doors = __sv.interactables.filter(i => i.id.startsWith('trick_')); out.doors = doors.length;
    for (const d of doors.slice(0, 5)) { d.act(h); await new Promise(r => setTimeout(r, 100)); document.querySelectorAll('.reward').forEach(e => e.click()); }
    out.keepsake = (h.profile.keepsakes || []).includes('pumpkin'); out.treats = h.profile.halloween && h.profile.halloween.treats;
    return out;
  });
  ok(r.oct9 === '' || !r.oct9.includes('halloween'), 'Halloween decorated more than 3 weeks before: ' + r.oct9);
  ok(r.oct10.includes('halloween:1'), 'Halloween 3 weeks before should be stage 1: ' + r.oct10);
  ok(r.oct25.includes('halloween:3') && r.oct25.includes('diwali:2'), 'two festivals at once, each its own stage: ' + r.oct25);
  ok(r.oct31.includes('halloween:4'), 'Halloween day: ' + r.oct31);
  ok(!r.anzac20.includes('anzac') && r.anzac23.includes('anzac:2'), 'a quiet day shows only a few days before: ' + r.anzac20 + ' / ' + r.anzac23);
  ok(r.tet.includes('tet:4'), 'Tết on its lunar date: ' + r.tet);
  ok(r.rows >= 10, 'calendar rows: ' + r.rows); ok(r.doors >= 5, 'pumpkin doors: ' + r.doors); ok(r.keepsake && r.treats === 5, 'no pumpkin lantern after 5 treats');
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  return `build-up from 3 weeks before (stage 1→4), Halloween and Diwali at once, quiet days ${'3'} days before, ${r.rows} festivals coming up on the calendar, ${r.doors} pumpkin doors, a pumpkin lantern after 5 treats`;
});

await check('festivals', async () => {
  // (Play core, owner 10 Oct) festivals come only in their season (from 3 weeks before) or when an admin schedules them in
  // Studio; a child cannot start one (the calendar only tells about it); a festival decorates its whole place: pieces
  // along every street, more each week, never on a road, a city street or a place's own street.
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, F = await import('/js/festivals.js'), W = await import('/js/world.js'), C = (await import('/js/custom.js')).CUSTOM, { FESTCAL } = await import('/js/content/festcal.js');
    const wait = ms => new Promise(r => setTimeout(r, ms)), out = {};
    // a festival out of its season: the calendar tap tells about it and starts nothing
    const far = F.upcoming().filter(n => n.daysTo > 30).pop(); out.far = far && far.F.id;
    G.festivals.visit(0, far.F.id); await wait(800);
    out.toldDays = (document.querySelector('.dialog .dtext') || {}).textContent || '';
    document.querySelectorAll('.dialog').forEach(e => e.remove()); G.paused = false;
    out.startedByChild = G.festivals.active().some(a => a.F.id === far.F.id) || G.interactables.some(i => i.id === 'festival_' + far.F.id);
    __sv.openPad(0, 'cal'); await wait(500); out.calNote = (document.querySelector('.pad .note') || {}).textContent || ''; document.querySelectorAll('.modal').forEach(e => e.remove()); G.paused = false;
    // an admin schedules it for today in Studio: it is on, with its table
    const ymd = (await import('/js/content/festival-visibility.js')).sydneyFestivalDate();
    C.releases = { ...(C.releases || {}), ['fest_' + far.F.id]: { on: true, start: ymd, days: 1 } }; G.festivals.rebuild(); await wait(300);
    out.adminOn = G.festivals.active().some(a => a.F.id === far.F.id && a.on) && G.interactables.some(i => i.id === 'festival_' + far.F.id);
    // (owner, 11 Oct, #32) even on its day, a calendar tap only tells: nobody is sent to the festival
    { const h = G.heroes[0], p0 = { x: h.pos.x, z: h.pos.z }; G.festivals.visit(0, far.F.id); await wait(2500);
      out.toldToday = (document.querySelector('.dialog .dtext') || {}).textContent || ''; out.moved = Math.hypot(h.pos.x - p0.x, h.pos.z - p0.z);
      document.querySelectorAll('.dialog').forEach(e => e.remove()); G.paused = false; }
    delete C.releases['fest_' + far.F.id]; G.festivals.rebuild(); await wait(300);
    out.adminOff = !G.festivals.active().some(a => a.F.id === far.F.id);
    // whole places: every festival place with streets gets pieces spread along them, more each week
    const places = [...new Set(FESTCAL.flatMap(f => f.where))], bad = [], sizes = {};
    const streetOf = (x, z) => { for (const c of W.CITIES) if (c.layout && x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1 && Math.abs((x - c.x) * Math.cos(c.layout.toward) - (z - c.z) * Math.sin(c.layout.toward)) < 2.6 + 1.5) return c.id; return null; };
    const inner = [['town', W.TOWN, 6, 44, 3.5], ['aussie', W.AUSSIE, W.AUSSIE.x0, W.AUSSIE.x1, 3.5], ['market', W.MARKET, W.MARKET.x0, W.MARKET.x1, 4]];
    for (const key of places) {
      const f = FESTCAL.find(x => x.where.includes(key) && x.kind === 'party'); if (!f) continue;
      const s1 = G.festivals.plan(key, f.id, 1), s2 = G.festivals.plan(key, f.id, 2), s4 = G.festivals.plan(key, f.id, 4), all = G.festivals.streetSpots(key);
      sizes[key] = [s1.length, s2.length, s4.length, all.length];
      if (all.length < 6) continue; // (a place without streets keeps its ring of pieces round the middle)
      if (!(s1.length > 0 && s1.length < s2.length && s2.length < s4.length)) bad.push(`${key}: not more each week (${s1.length}, ${s2.length}, ${s4.length})`);
      // spread over the whole place, not bunched: the pieces reach far apart
      let span = 0; for (const a of s4) for (const q of s4) span = Math.max(span, Math.hypot(a.x - q.x, a.z - q.z));
      const o = { ...W.CITIES.reduce((m, c) => (m[c.id] = c, m), {}), village: W.VILLAGE, china: W.CHINA, india: W.INDIA, aussie: W.AUSSIE, town: W.TOWN, market: W.MARKET, home: W.HOME, hoian: W.HOIAN }[key];
      const size = o.x0 != null ? Math.hypot(o.x1 - o.x0, o.z1 - o.z0) : (o.r || 24) * 2;
      if (span < size * .4) bad.push(`${key}: pieces bunched in ${span.toFixed(0)} m of a ${size.toFixed(0)} m place`);
      for (const q of all) { const rd = W.roadDist(q.x, q.z); if (rd.road && rd.d < rd.road.w / 2 + 1.5) bad.push(`${key}: a piece on a road at ${q.x},${q.z}`);
        const st = streetOf(q.x, q.z); if (st) bad.push(`${key}: a piece on ${st}'s main street`);
        for (const [k, b, x0, x1, hw] of inner) if (q.x > x0 && q.x < x1 && Math.abs(q.z - b.roadZ) < hw + 1.5) bad.push(`${key}: a piece on ${k}'s street`);
        if (W.heightAt(q.x, q.z) < W.WATER + .3) bad.push(`${key}: a piece in the water`); }
    }
    out.bad = bad.slice(0, 6); out.sizes = sizes;
    return out;
  });
  const out = [];
  if (r.startedByChild) out.push(`a child's tap started ${r.far}`);
  if (!/\d/.test(r.toldDays)) out.push(`the calendar tap did not say how many days to ${r.far}: "${r.toldDays}"`);
  if (/visit it now/i.test(r.calNote)) out.push('the calendar still says "visit it now"');
  if (!r.adminOn) out.push(`an admin's schedule did not start ${r.far}`);
  if (r.moved > 1 || !/today|hôm nay/i.test(r.toldToday)) out.push(`a calendar tap on ${r.far}'s day sent the child ${r.moved.toFixed(1)} m or did not say it is today: "${r.toldToday}"`);
  if (!r.adminOff) out.push(`${r.far} stayed on after the admin's schedule was removed`);
  out.push(...r.bad);
  if (P.errors.length) out.push(...P.errors.slice(0, 2));
  await P.ctx.close();
  if (out.length) throw new Error(out.join('; '));
  const z = Object.entries(r.sizes).filter(([, v]) => v[3] >= 6);
  return `${r.far} out of season: told the days, not started by a child; on when an admin schedules it, and a tap on its day only tells (nobody travels), off again after; ${z.length} places decorated along their streets (week 1 → day: ${z.map(([k, v]) => `${k} ${v[0]}→${v[2]}`).join(', ')}), none on a road or street`;
});

await check('festhunt', async () => {
  // (owner, 13 Oct 2026 AEDT) festival decorations: 5 times r69's by default, as chosen in Studio per festival (as before,
  // 2x, 3x, 5x, 7x); pieces beside the streets, strings across them and every house front, never on a road; the festival
  // nearest its day also decorates the rest of the valley (other places, beside every road, every house outside); the phone
  // draws only the nearest patches, within a budget (PERF-003); and the festival hunt: five things hidden in every
  // festival's first place in its last week and on its day, the fifth giving a keepsake and the Passport badge.
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  // A full-suite share can cross midnight. Keep the one-day festival fixtures
  // on their original day while real timers continue running normally.
  const festivalDay = new Date(); festivalDay.setHours(12, 0, 0, 0);
  await P.page.clock.setFixedTime(festivalDay);
  const r = await P.page.evaluate(async () => {
    const G = __sv, W = await import('/js/world.js'), C = (await import('/js/custom.js')).CUSTOM, { FESTCAL } = await import('/js/content/festcal.js'), { HUNT } = await import('/js/content/festhunt.js');
    const wait = ms => new Promise(r => setTimeout(r, ms)), out = { bad: [] }, bad = out.bad;
    const ymd = (await import('/js/content/festival-visibility.js')).sydneyFestivalDate();
    for (let k = 0; k < 40 && !G.festivals.count('village', 'tet', 4); k++) { G.festivals.rebuild(); await wait(300); }
    // the amount: 5x by default, as before at 1, and 7x at least as much as 5x; never on a road or street
    const total = c => c.pieces + c.strings + 2 * c.fronts, base = c => c.base.pieces + c.base.strings; let places = 0;
    for (const F of FESTCAL) for (const key of F.where) {
      C.festivals = {}; const c5 = G.festivals.count(key, F.id, 4); if (!c5) continue; places++;
      const want = F.kind === 'quiet' ? 2.5 : 4.5; if (total(c5) < want * base(c5)) bad.push(`${F.id} in ${key}: ${total(c5)} pieces, ${(total(c5) / base(c5)).toFixed(1)} times before (want ${want})`);
      if (c5.onRoad) bad.push(`${F.id} in ${key}: ${c5.onRoad} pieces on a road or street`);
      C.festivals = { [F.id]: { deco: 1 } }; const c1 = G.festivals.count(key, F.id, 4); if (total(c1) !== base(c1)) bad.push(`${F.id} in ${key}: "as before" is ${total(c1)}, not ${base(c1)}`);
      C.festivals = { [F.id]: { deco: 7 } }; const c7 = G.festivals.count(key, F.id, 4); if (total(c7) < total(c5)) bad.push(`${F.id} in ${key}: 7x (${total(c7)}) less than 5x (${total(c5)})`);
      if (c7.onRoad) bad.push(`${F.id} in ${key}: ${c7.onRoad} pieces on a road at 7x`);
    }
    C.festivals = {}; out.places = places;
    // build-up: half in week 1, three quarters in week 2, all in the last week
    { const s = [1, 2, 3, 4].map(st => G.festivals.count('village', 'tet', st)).map(total); out.build = s; if (!(s[0] < s[1] && s[1] < s[2] && s[2] === s[3])) bad.push('build-up not half, three quarters, all: ' + s.join(', ')); }
    // Tết on (an admin's schedule): the whole valley, within the budget
    C.releases = { ...(C.releases || {}), fest_tet: { on: true, start: ymd, days: 1 } }; G.festivals.rebuild(); await wait(800);
    const PL = { village: W.VILLAGE, china: W.CHINA, market: W.MARKET, hoian: W.HOIAN, ...Object.fromEntries(W.CITIES.map(c => [c.id, c])) }, tetAt = FESTCAL.find(f => f.id === 'tet').where.map(k => PL[k]).filter(Boolean);
    const away = q => Math.min(...tetAt.map(o => o.x0 != null ? Math.max(0, Math.max(o.x0 - q.x, q.x - o.x1, o.z0 - q.z, q.z - o.z1)) : Math.max(0, Math.hypot(q.x - o.x, q.z - o.z) - (o.r || 24))));
    const patches = G.festivals.places3(); out.patches = patches.length; out.outside = patches.filter(q => away(q) > 40).length; out.road = G.festivals.roadSpots(5);
    if (out.outside < 20) bad.push(`only ${out.outside} decoration patches outside Tết's places: not over the whole valley`);
    if (out.road < 100) bad.push(`only ${out.road} spots beside the valley's roads`);
    for (const [x, z] of [[W.VILLAGE.x, W.VILLAGE.z + 6], [W.TOWN.x0 + 20, W.TOWN.roadZ], [(W.CITIES[0].x0 + W.CITIES[0].x1) / 2, W.CITIES[0].z]]) {
      G.heroes[0].place(x, z); await wait(1300); const dn = G.festivals.drawn(), bu = G.festivals.budget;
      if (dn.tris > bu.tris || dn.calls > bu.calls) bad.push(`drawn ${dn.tris} triangles, ${dn.calls} draw calls near ${x.toFixed(0)},${z.toFixed(0)} (budget ${bu.tris}, ${bu.calls})`);
      if (!dn.tris) bad.push(`no decorations drawn near ${x.toFixed(0)},${z.toFixed(0)}`); }
    // the hunt: every festival hides five things when it is on
    const H0 = () => G.festivals.hunt(); for (let k = 0; k < 20 && !(H0() && H0().items().length); k++) await wait(300);
    const hunted = [];
    // (1 Nov 2026 AEDT) the other festivals are switched off while one is tried: around 1 Nov the real Diwali build-up
    // filled India, Holi's place, so Holi (never at the same time in real life) had no room for its hunt
    for (const F of FESTCAL) { C.releases = Object.fromEntries(FESTCAL.map(x => ['fest_' + x.id, x === F ? { on: true, start: ymd, days: 1 } : { on: false }])); G.festivals.rebuild();
      // (1 Nov 2026 AEDT) the hunt is set after its module loads and the place is decorated: wait for it (up to 4 s) rather
      // than a fixed 250 ms, which was too short beside the real Diwali build-up around 1 Nov
      let n = 0; for (let k = 0; k < 16; k++) { await wait(250); n = H0() ? H0().items().filter(i => i.F === F.id).length : 0; if (n === 5) break; } if (n !== 5) bad.push(`${F.id}: ${n} hunt things, not 5`); else hunted.push(F.id);
      if (!HUNT[F.id]) bad.push(`${F.id}: nothing to hunt`); }
    out.hunted = hunted.length;
    // Tết's hunt: four say "keep looking", the fifth gives the keepsake and the badge; the Passport shows it
    C.releases = { fest_tet: { on: true, start: ymd, days: 1 } }; G.festivals.rebuild(); await wait(400);
    const p = G.heroes[0].profile; p.hunt = {}; p.festBadges = {}; p.keepsakes = (p.keepsakes || []).filter(k => k !== 'fh_tet');
    const its = H0().items().filter(i => i.F === 'tet');
    for (const it of its) { G.heroes[0].place(it.x + 1, it.z); await wait(200); const pr = H0().find(0, it.id); await wait(400); document.querySelectorAll('.reward').forEach(e => e.click()); await pr; }
    out.badge = p.festBadges && p.festBadges.tet; out.keep = (p.keepsakes || []).includes('fh_tet'); out.left = H0().items().filter(i => i.F === 'tet' && i.left).length;
    const { DECOR } = await import('/js/myhouse.js'); out.decor = !!(DECOR.fh_tet && DECOR.fh_tet.keepsake);
    const box = document.createElement('div'); G.drawPassport(box, G.heroes[0]); out.passport = box.querySelectorAll('.pfest .pst.on').length; out.passportAll = box.querySelectorAll('.pfest .pst').length;
    delete C.releases.fest_tet; G.festivals.rebuild();
    return out;
  });
  const out = [...r.bad.slice(0, 8)];
  if (!r.badge || !r.keep || !r.decor) out.push(`five Tết things found but badge ${r.badge}, keepsake ${r.keep}, in the house list ${r.decor}`);
  if (r.left) out.push(`${r.left} Tết things still shown after the only child found them`);
  if (r.passport !== 1 || r.passportAll < 24) out.push(`the Passport shows ${r.passport} festival badges of ${r.passportAll}`);
  if (P.errors.length) out.push(...P.errors.slice(0, 2));
  await P.ctx.close();
  if (out.length) throw new Error(out.join('; '));
  return `${r.places} festival places at 5x by default (as before at 1x, more at 7x), none on a road; build-up ${r.build.join(' → ')} in Lotus Village for Tết; Tết on: ${r.patches} patches, ${r.outside} outside its places, ${r.road} spots by the valley's roads, the nearest drawn within the budget; ${r.hunted} festivals hide 5 things each; Tết's five found: keepsake for the house and the Passport badge`;
});

await check('ownerfestplacement', async () => {
  const P=await open(b,{w:1280,h:800}); await clear(P.page);
  const r=await P.page.evaluate(async()=>{
    const {createDecor}=await import('/js/festdecor.js'), W=await import('/js/world.js'), C=(await import('/js/custom.js')).CUSTOM;
    C.festivals={...(C.festivals||{}),tet:{deco:5}};
    const D=createDecor(()=>true), F={id:'tet',kind:'festival'}, points=D.plan('town',W.TOWN,F,4);
    // Geometry from the rendered road in town.js, independent of festdecor's own onStreet/count predicate.
    const inTownRoad=p=>p.x>W.TOWN.x-26 && p.x<W.TOWN.x+12 && Math.abs(p.z-W.TOWN.roadZ)<3.5+1;
    const blocked=points.filter(inTownRoad);
    return {total:points.length,blocked:blocked.slice(0,12),blockedCount:blocked.length};
  });
  const errors=P.errors; await P.ctx.close();
  ok(r.total>0 && !r.blockedCount && !errors.length,JSON.stringify({...r,errors}));
  return `${r.total} planned town decorations respect the actual shifted town-road bounds, independent of their own mask`;
});
