// Sparkle Valley checks: Learning: Hoc vui, school, reading and thinking levels.
// Run them through tests/run.mts (node run.mts <check>) or tests/suite.mts, not on their own.
// Moved unchanged from tests/run.mts (v1.07 split-tests, 2 Nov 2026 AEDT); see tests/checks/README.md.
import { fs, open, clear, start, openAllGamesFixture, sampled, SEED, only, want, results, check, ok, b } from './shared.mts';

await check('hocvui', async () => {
  // (Học vui, owner's plan 1 Nov 2026 AEDT, docs/learn-tab/PLAN.md) the Fun learning tab in Play and its four corners
  // (Tiếng Việt, English, Maths, Science), with the corners' own games and the existing games linked in (each still in
  // its own tab; a link opens it); the same four areas on the Simple screen; and each of the eight new games played to
  // a win through real taps on the screen, at Easy and at Talent for a big kid, where Talent shows more than Easy
  const NEW = ['sci_float', 'sci_magnet', 'sci_ramp', 'sci_seesaw', 'sci_shadow', 'sci_sound', 'vi_tones', 'vi_build'];
  const MORE = { sci_float: '.sx-thing', sci_magnet: '.sx-thing', sci_ramp: '.sx-lane', sci_seesaw: 'button.sx-seat', sci_shadow: '.sx-ring', sci_sound: '.sx-bottle', vi_tones: '.choices .choice', vi_build: '.choices .choice' };
  // (v1.08 science) the twelve new science experiments (js/games/science2.ts), each also played to a win at Easy and Talent
  const SCI2 = ['sci_plant', 'sci_water', 'sci_daynight', 'sci_seasons', 'sci_homes', 'sci_body', 'sci_colours', 'sci_ice', 'sci_rainbow', 'sci_bulb', 'sci_gears', 'sci_recycle'];
  NEW.push(...SCI2); for (const id of SCI2) MORE[id] = '.sx-thing';
  const P = await openAllGamesFixture(b, { w: 390, h: 844, touch: true, settings: { voice: false } }); await clear(P.page);
  const fails = [];
  // the Play hub: the tab, its four corners, the new games as cards, existing games as links; Learning keeps its games
  const hub = await P.page.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    __sv.heroes[0].profile.age = 'big'; __sv.openGamesHub(0); await wait(400);
    const tabs = [...document.querySelectorAll('.hubtabs [data-tab]')].map(b => b.dataset.tab);
    document.querySelector('.hubtabs [data-tab="hocvui"]')?.click(); await wait(300);
    const heads = [...document.querySelectorAll('.hubbody .hubarea')].map(h => [...h.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim());
    const plays = [...document.querySelectorAll('.hubbody [data-play]')].map(b => b.dataset.play), links = [...document.querySelectorAll('.hubbody [data-link]')].map(b => b.dataset.link);
    const small = [...document.querySelectorAll('.hubbody .hplay')].filter(b => { const r = b.getBoundingClientRect(); return r.width < 64 || r.height < 64; }).length;
    const art = [...document.querySelectorAll('.hubtabs [data-tab="hocvui"] .art, .hubbody .hubarea .art')].length;
    document.querySelector('.hubtabs [data-tab="learn"]')?.click(); await wait(300);
    const learn = [...document.querySelectorAll('.hubbody [data-play]')].map(b => b.dataset.play);
    return { tabs, heads, plays, links, small, art, learn };
  });
  if (!hub.tabs.includes('hocvui') || hub.tabs[0] !== 'learn') fails.push('tabs ' + hub.tabs.join(','));
  if (JSON.stringify(hub.heads) !== JSON.stringify(['Vietnamese', 'English', 'Maths', 'Science'])) fails.push('corners ' + hub.heads.join(' | '));
  if (!NEW.every(id => hub.plays.includes(id)) || hub.plays.some(id => !NEW.includes(id))) fails.push('corner games ' + hub.plays.join(','));
  for (const id of ['words', 'phonics', 'opposites', 'firstwords', 'counting', 'sums', 'numline']) if (!hub.links.includes(id)) fails.push('no link to ' + id);
  for (const id of ['counting', 'sums', 'phonics', 'opposites', 'numline']) if (!hub.learn.includes(id)) fails.push(id + ' left the Learning tab');
  if (hub.small) fails.push(hub.small + ' hub cards under 64 px'); if (hub.art < 5) fails.push('tab and corner pictures not drawn: ' + hub.art);
  // a link opens the game it points to, by a real tap
  const link = await P.page.evaluate(() => { const b = document.querySelector('.hubtabs [data-tab="hocvui"]'); b.click(); return new Promise(r => setTimeout(() => { const l = document.querySelector('.hubbody [data-link="counting"]'); l.scrollIntoView({ block: 'center' }); const q = l.getBoundingClientRect(); r({ x: q.left + q.width / 2, y: q.top + q.height / 2 }); }, 300)); });
  await P.page.touchscreen.tap(link.x, link.y);
  if (!await P.page.waitForSelector('.gl[data-game-id="counting"]', { timeout: 10000 }).then(() => true, () => false)) fails.push('the Counting link did not open Counting');
  await P.page.evaluate(() => { document.querySelector('.gl .gl-x')?.click(); document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false; }); await P.page.waitForTimeout(500);
  // the Simple screen: the same four areas, in order, after the others; the new games in them and the links too
  const simple = await P.page.evaluate(() => { __sv.simple.show('games'); __sv.simple.openGroup('games', null); const v = __sv.simple.view, out = { cats: v.cats, stops: v.stops }; __sv.simple.hide(); return out; });
  const corners = simple.cats.filter(c => c.startsWith('hv_'));
  if (JSON.stringify(corners) !== JSON.stringify(['hv_vi', 'hv_en', 'hv_math', 'hv_sci']) || simple.cats.indexOf('hv_vi') < simple.cats.indexOf('money')) fails.push('Simple screen areas ' + simple.cats.join(','));
  if (!NEW.every(id => simple.stops.includes(id))) fails.push('Simple screen without ' + NEW.filter(id => !simple.stops.includes(id)).join(','));
  if (simple.stops.filter(id => id === 'counting').length !== 2) fails.push('Counting is not both in Numbers and in Maths on the Simple screen');
  // each new game: Easy and Talent, a big kid, played to the win by tapping what the game asks for (its plan, or the
  // right answer of the question on screen), like a child's finger; quicker with Reduce motion (the same steps)
  await P.page.emulateMedia({ reducedMotion: 'reduce' });
  const played = {};
  for (const id of NEW) for (const d of ['easy', 'talent']) {
    await P.page.evaluate(([id, d]) => { document.querySelectorAll('.gl, .modal').forEach(g => g.remove()); __sv.paused = false; const p = __sv.heroes[0].profile; p.age = 'big'; p.gameDiff = { ...(p.gameDiff || {}), [id]: d }; __sv.playGame(0, id, 'hub'); }, [id, d]);
    if (!await P.page.waitForSelector(`.gl[data-game-id="${id}"]:not(.out)`, { timeout: 10000 }).then(() => true, () => false)) { fails.push(`${id} ${d}: did not open`); continue; }
    let shown = 0, last = -1;
    for (let k = 0; k < 40; k++) { await P.page.waitForTimeout(150); shown = await P.page.evaluate(sel => document.querySelectorAll(`.gl:not(.out) ${sel}`).length, MORE[id]); if (shown > 0 && shown === last) break; last = shown; }
    const talent = await P.page.evaluate(() => !!document.querySelector('.gl:not(.out)')?.dataset.talent);
    let taps = 0, won = false, stuck = 0;
    for (let k = 0; k < 500 && !won; k++) {
      const t = await P.page.evaluate(async () => {
        const { playWatch } = await import('/js/games/frame.js'), gl = document.querySelector('.gl:not(.out)');
        if (!gl) return { gone: true }; if (gl.querySelector('.gl-win')) return { won: true };
        const ok = e => e && e.isConnected && !e.disabled && e.getBoundingClientRect().width > 0;
        let e = null; const a = playWatch.ask;
        if (a && a.els.some(ok)) e = a.els.find(x => ok(x) && a.check(x)); else if (playWatch.plan) e = playWatch.plan();
        if (!ok(e)) return { wait: true };
        e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, at = document.elementFromPoint(x, y);
        return { x, y, on: !!at && (at === e || e.contains(at)), what: (e.className || e.tagName) + ' under ' + (at ? (at.className && at.className.baseVal != null ? at.className.baseVal : at.className) || at.tagName : 'nothing') + ' at ' + Math.round(x) + ',' + Math.round(y) };
      });
      if (t.won) { won = true; break; } if (t.gone) break;
      if (t.wait) { if (++stuck > 120) break; await P.page.waitForTimeout(150); continue; }
      stuck = 0; if (!t.on) { fails.push(`${id} ${d}: something covers ${t.what}`); break; }
      await P.page.touchscreen.tap(t.x, t.y); taps++; await P.page.waitForTimeout(120);
    }
    played[id + ':' + d] = { shown, talent, taps, won };
    if (!won) fails.push(`${id} ${d}: not won (${taps} taps)`);
    await P.page.evaluate(() => { document.querySelector('.gl:not(.out) .gl-x')?.click(); }); await P.page.waitForTimeout(400);
  }
  await P.page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const id of NEW) { const e = played[id + ':easy'], t = played[id + ':talent']; if (e && t && !(t.shown > e.shown && t.talent && !e.talent)) fails.push(`${id}: Talent shows ${t.shown}, Easy ${e.shown}`); }
  // pictures for the owner and Release: the tab and one experiment on a phone, a tablet and a computer
  fs.mkdirSync('out/hocvui', { recursive: true });
  for (const [name, w, h, touch] of [['phone', 390, 844, true], ['tablet', 820, 1180, true], ['computer', 1366, 800, false]]) {
    await P.page.setViewportSize({ width: w, height: h });
    await P.page.evaluate(() => { document.querySelectorAll('.gl').forEach(g => g.remove()); document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false; __sv.openGamesHub(0); });
    await P.page.waitForTimeout(400); await P.page.evaluate(() => document.querySelector('.hubtabs [data-tab="hocvui"]')?.click()); await P.page.waitForTimeout(500);
    await P.page.screenshot({ path: `out/hocvui/tab-${name}.png` });
    await P.page.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false; const p = __sv.heroes[0].profile; p.gameDiff = { ...(p.gameDiff || {}), sci_float: 'talent' }; __sv.playGame(0, 'sci_float', 'hub'); });
    await P.page.waitForSelector('.gl:not(.out) .sx-thing', { timeout: 10000 }).catch(() => { }); await P.page.waitForTimeout(900);
    await P.page.screenshot({ path: `out/hocvui/float-${name}.png` });
    await P.page.evaluate(() => document.querySelector('.gl:not(.out) .gl-x')?.click()); await P.page.waitForTimeout(400);
  }
  const errs = P.errors.slice(); await P.ctx.close();
  if (errs.length) fails.push(...errs.slice(0, 3));
  ok(!fails.length, fails.slice(0, 12).join(' | ') + ' ' + JSON.stringify(played));
  return `Fun learning tab with four corners (${hub.plays.length} own games, ${hub.links.length} links; the linked games stay in their own tab and open from the link); the same four areas on the Simple screen; ${NEW.length} new games won by real taps at Easy and Talent (${NEW.map(id => `${id} ${played[id + ':easy'].shown}→${played[id + ':talent'].shown}`).join(', ')}); pictures in tests/out/hocvui`;
});

await check('school', async () => {
  // (Học vui phase 4, owner's plan 1 Nov 2026 AEDT, docs/learn-tab/PLAN.md) Trường Học Vui on Two Homes Street: the
  // building and its yard stand on dry, level ground, off every road, street and verge, on nobody else's ground; a child
  // can walk to Cô Tam at the door from the middle of the street (the valley's own walking rule, G.goodSpot, after the
  // solid map is made); Cô Tam is there with her juice-cart look while the juice cart keeps its own Cô Tam; the school
  // is on the map and in "Where is…?"; and on a phone, a real tap on the Act button by her says her greeting and a tap on
  // "Yes, let's learn!" opens the Play hub on the Fun learning tab
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, W = await import('/js/world.js'); await G.schoolReady; const S = G.school, out = { bad: [] }; await G.solidsReady;
    // ("Where is…?" switched on as the wayfind check does: Studio switch 'wayfind')
    const C = await import('/js/custom.js'); C.CUSTOM.releases = { ...(C.CUSTOM.releases || {}), wayfind: { on: true, controlVersion: 1 } };
    for (let k = 0; k < 50 && !G.wayfind; k++) await new Promise(r => setTimeout(r, 100));
    if (!S || !S.house || !S.house.parent) return { bad: ['no school built'] };
    // the ground: the building and its yard, every half metre
    const { x, z, w, d, yard, front, box } = S; let n = 0;
    for (let px = x - w / 2 - .5; px <= x + w / 2 + .5; px += .5) for (let pz = front - yard; pz <= z + d / 2 + .5; pz += .5) { n++;
      const rd = W.roadDist(px, pz), h = W.heightAt(px, pz);
      if (rd.road && rd.d < rd.road.w / 2 + 1.5) { out.bad.push(`on ${rd.road.id} or its verge at ${px.toFixed(1)},${pz.toFixed(1)}`); break; }
      if (W.edgeDist(px, pz) < 1.5) { out.bad.push(`on a street at ${px.toFixed(1)},${pz.toFixed(1)}`); break; }
      if (h < W.WATER + .5) { out.bad.push(`in the water at ${px.toFixed(1)},${pz.toFixed(1)}`); break; }
      if (Math.abs(h - W.heightAt(x, z)) > .25) { out.bad.push(`not level at ${px.toFixed(1)},${pz.toFixed(1)}`); break; } }
    const others = G.world.boxes.filter(o => o !== box && !o.room && o.x0 < box.x1 && o.x1 > box.x0 && o.z0 < box.z1 && o.z1 > box.z0);
    if (others.length) out.bad.push(`overlaps ${others.length} other buildings`);
    if ((G.world.houses || []).some(hs => Math.hypot(hs.x - x, hs.z - z) < (w + d) / 2)) out.bad.push('a house stands on it');
    if (G.world.colliders.some(c => c.r > .45 && c.x > box.x0 && c.x < box.x1 && c.z > box.z0 && c.z < box.z1)) out.bad.push('a tree or post inside it');
    if (Math.hypot(x - W.TOWN.x, z - W.TOWN.z) > 45) out.bad.push('not on Two Homes Street');
    // walking: from the middle of the street to Cô Tam's spot, on the ground a child can stand on (0.5 m steps)
    const s = S.spot, s0 = { x: W.TOWN.x - 4, z: W.TOWN.roadZ }, x0 = Math.min(s0.x, s.x) - 12, z0 = Math.min(s0.z, s.z) - 12, x1 = Math.max(s0.x, s.x) + 12, z1 = Math.max(s0.z, s.z) + 12;
    const N = Math.ceil((x1 - x0) / .5) + 1, M = Math.ceil((z1 - z0) / .5) + 1, seen = new Uint8Array(N * M), q = [];
    const at = (i, j) => G.goodSpot(x0 + i * .5, z0 + j * .5), push = (i, j) => { if (i < 0 || j < 0 || i >= N || j >= M || seen[j * N + i]) return; seen[j * N + i] = 1; if (at(i, j)) q.push([i, j]); };
    push(Math.round((s0.x - x0) / .5), Math.round((s0.z - z0) / .5)); out.startOk = q.length === 1; let reached = false;
    while (q.length && !reached) { const [i, j] = q.shift(); if (Math.hypot(x0 + i * .5 - s.x, z0 + j * .5 - s.z) < .6) reached = true; push(i + 1, j); push(i - 1, j); push(i, j + 1); push(i, j - 1); }
    out.reached = reached; out.spotOk = G.goodSpot(s.x, s.z);
    // Cô Tam: at the door, named, facing the yard; the juice cart's Cô Tam still at the cart
    const A = S.avatar, t = S.teacher, cart = G.interactables.find(i => i.id === 'nuocmia');
    out.teacher = !!A.root.parent && Math.hypot(A.root.position.x - t.x, A.root.position.z - t.z) < .05 && Math.abs(A.root.position.z - front) < 1.5 && A.look.style === 'aodai';
    out.cart = !!cart && G.scene.children.some(o => o.userData && o.userData.townSeller === 'nuocmia');
    // the map and Where is…?
    const pl = G.PLACES.find(p => p.key === 'school'); out.place = !!pl && Math.hypot(pl.x - S.place.x, pl.z - S.place.z) < .01 && Math.hypot(pl.x - t.x, pl.z - t.z) < 6 && pl.name() === 'Fun Learning School';
    out.flyTo = G.npcNear(pl.x, pl.z)?.id;   // (flying there from the map lands by Cô Tam)
    out.where = !!(G.wayfind && G.wayfind.targets().some(o => o.id === 'school'));
    out.tris = (() => { let k = 0; for (const o of [S.house, S.yardMesh, S.flag, S.pole]) { const g = o.geometry; k += (g.index ? g.index.count : g.attributes.position.count) / 3; } return k; })();
    out.n = n; return out;
  });
  ok(!r.bad.length, 'where it stands: ' + r.bad.join('; '));
  ok(r.startOk && r.spotOk && r.reached, `a child can't walk to Cô Tam from the street (start ${r.startOk}, her spot ${r.spotOk}, reached ${r.reached})`);
  ok(r.teacher && r.cart, `Cô Tam at the school door ${r.teacher}, still at the juice cart ${r.cart}`);
  ok(r.place && r.where && r.flyTo === 'school', `on the map ${r.place}, in Where is ${r.where}, flying there lands by ${r.flyTo}`);
  ok(r.tris < 3000, `the school costs ${r.tris} triangles (want under 3000)`);
  // a real tap: walk up to her, tap the Act button, hear her greeting, tap "Yes, let's learn!"
  await P.page.evaluate(async () => { const G = __sv; await G.schoolReady; const h = G.heroes[0], s = G.school.spot; h.place(s.x, s.z - .6); h.yaw = 0; G.paused = false; });
  const act = await P.page.waitForFunction(() => { const b = document.querySelector('.hud .act'); return b && !b.hidden && /Tam/.test(b.textContent) && b.getBoundingClientRect(); }, null, { timeout: 15000 }).then(() => P.page.evaluate(() => { const q = document.querySelector('.hud .act').getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, w: q.width, h: q.height }; }), () => null);
  ok(act, 'no Act button by Cô Tam');
  ok(act.w >= 44 && act.h >= 44, `the Act button is ${Math.round(act.w)}×${Math.round(act.h)} px`);
  await P.page.touchscreen.tap(act.x, act.y);
  const box = await P.page.waitForSelector('.dialog:not(.out) .dch', { timeout: 10000 }).then(() => P.page.evaluate(() => { const D = document.querySelector('.dialog:not(.out)'), c = D.querySelector('.dch').getBoundingClientRect();
    return { name: D.querySelector('.dname').textContent, text: D.querySelector('.dtext').textContent, x: c.left + c.width / 2, y: c.top + c.height / 2, h: c.height, n: D.querySelectorAll('.dch').length }; }), () => null);
  ok(box, 'tapping Cô Tam opened no speech box');
  ok(/Tam/.test(box.name) && box.text === 'Welcome to the Fun Learning School! Shall we learn something fun today?' && box.n === 2 && box.h >= 44, 'her greeting: ' + JSON.stringify(box));
  await P.page.touchscreen.tap(box.x, box.y);
  const hub = await P.page.waitForSelector('.hub .hubtabs [data-tab="hocvui"].on', { timeout: 10000 }).then(() => P.page.evaluate(() => ({ title: document.querySelector('.hub .hubbody h3')?.textContent || '', areas: document.querySelectorAll('.hub .hubbody .hubarea').length })), () => null);
  ok(hub && /Fun learning/.test(hub.title) && hub.areas === 4, 'the tap did not open the Fun learning tab: ' + JSON.stringify(hub));
  // in Vietnamese too: her line and the sign's words
  const vi = await P.page.evaluate(async () => { document.querySelectorAll('.modal, .hub, .dialog').forEach(e => e.remove()); __sv.paused = false; const L = await import('/js/school.js'); return L.SCHOOL_GREETING[1]; });
  ok(vi === 'Chào mừng con đến Trường Học Vui! Hôm nay mình học điều gì vui nhé?', 'Vietnamese greeting ' + vi);
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  return `on dry level ground by Two Homes Street, off the roads (${r.n} spots); walkable from the street to Cô Tam; she stands at the door (the cart keeps hers); on the map and in Where is; ${r.tris} triangles; a tap on the phone says her greeting and opens the Fun learning tab`;
});

// (Play reading trial, owner 11 Oct 2026 AEDT; docs/cores/play-reading.md) the ten reading games behind Studio's readingTrial
await check('reading', async () => {
  const { solveReading } = await import('../readsolve.mts'), RD = await import('../../js/content/reading.js');
  const IDS = ['rd_listentouch', 'rd_storychoice', 'rd_trace', 'rd_sounds', 'rd_build', 'rd_rhyme', 'rd_sight', 'rd_tones', 'rd_syllable', 'rd_match', 'rd_sentence', 'rd_readalong'], BIG_ONLY = ['rd_sight', 'rd_match', 'rd_sentence'];
  // the word lists: both languages, every picture drawn, every line to record listed in both languages
  const lines = RD.readingLines(), en = lines.filter(l => l.lang === 'en').length, vi = lines.filter(l => l.lang === 'vi').length;
  ok(en > 150 && vi > 150, `lines to record: en ${en}, vi ${vi}`);
  for (const k of ['letters', 'build', 'rhyme', 'sight', 'syl', 'sent', 'books']) ok(RD.READ.en[k] && RD.READ.vi[k] && RD.READ.en[k].length && RD.READ.vi[k].length, 'a list missing in one language: ' + k);
  ok(['ă', 'â', 'đ', 'ê', 'ô', 'ơ', 'ư'].every(c => RD.READ.vi.letters.some(x => x[0] === c)), 'Vietnamese letters without ă â đ ê ô ơ ư');
  ok(RD.nameOf('en', 'z') === 'zed', 'Z is not said "zed"');
  ok(RD.READ.en.letters.slice(0, 6).map(x => x[0]).join('') === 'satpin', 'English sounds do not start s a t p i n');
  const allEn = JSON.stringify(RD.READ.en), us = ['color', ' mom', 'candy', 'Mom'].filter(w => allEn.includes(w)); ok(!us.length, 'American words in the English lists: ' + us.join(', '));
  // switch off (Studio's content pack sets it off; with no setting it is on, owner 12 Oct AEDT): nothing of the trial loads or shows
  const P = await open(b, { w: 1024, h: 768, play: false }); const asked = []; P.page.on('request', q => { if (/reading(menu)?\.js/.test(q.url())) asked.push(q.url().split('/').pop()); });
  await P.page.route('**/content/custom.json*', async r => { let j = {}; try { j = await (await r.fetch()).json(); } catch (e) { } j.features = { ...(j.features || {}), readingTrial: false }; await r.fulfill({ contentType: 'application/json', body: JSON.stringify(j) }); });
  await P.page.reload(); asked.length = 0; await start(P.page); await clear(P.page);
  const off = await P.page.evaluate(async () => { const F = await import('/js/games/frame.js'), A = await import('/js/content/activities.js'); __sv.openGamesHub(0); await new Promise(r => setTimeout(r, 300)); const hub = [...document.querySelectorAll('[data-play]')].map(b => b.dataset.play); document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false;
    return { games: Object.keys(F.GAMES).filter(k => /^rd_/.test(k)), inArea: A.gamesIn(F.GAMES, 'reading', false).length, hub: hub.filter(k => /^rd_/.test(k)) }; });
  await P.ctx.close();
  ok(!off.games.length && !off.inArea && !off.hub.length && !asked.length, 'with the switch off: ' + JSON.stringify({ off, asked }));
  // switch on (Studio's content pack): the ten games are in the Reading corner, in the Learning tab; their code loads only when one opens
  const Q = await open(b, { w: 1024, h: 768, play: false }); const asked2 = []; Q.page.on('request', q => { if (/reading(menu)?\.js/.test(q.url())) asked2.push(q.url().split('/').pop()); });
  await Q.page.route('**/content/custom.json*', async r => { let j = {}; try { j = await (await r.fetch()).json(); } catch (e) { } j.features = { ...(j.features || {}), readingTrial: true }; await r.fulfill({ contentType: 'application/json', body: JSON.stringify(j) }); });
  await Q.page.reload(); await start(Q.page); await clear(Q.page);
  await Q.page.waitForFunction(async () => Object.keys((await import('/js/games/frame.js')).GAMES).filter(k => /^rd_/.test(k)).length === 13, null, { timeout: 30000 }).catch(() => { });
  const on = await Q.page.evaluate(async () => { const F = await import('/js/games/frame.js'), A = await import('/js/content/activities.js'); __sv.openGamesHub(0); await new Promise(r => setTimeout(r, 300)); document.querySelector('.hubtabs [data-tab="learn"]')?.click(); await new Promise(r => setTimeout(r, 200));
    const hub = [...document.querySelectorAll('.hubbody [data-play]')].map(b => b.dataset.play), head = [...document.querySelectorAll('.hubbody .hubarea')].map(h => h.textContent); document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false;
    return { games: Object.keys(F.GAMES).filter(k => /^rd_/.test(k)), big: A.gamesIn(F.GAMES, 'reading', false).map(g => g.id), little: A.gamesIn(F.GAMES, 'reading', true).map(g => g.id), hub: hub.filter(k => /^rd_/.test(k)), head }; });
  // (owner, 18 Oct AEDT) Story Helpers joins the Reading corner too, for 2 to 8 (played through by its own check, storyhelp)
  ok([...IDS, 'rd_storyhelp'].every(id => on.games.includes(id) && on.big.includes(id) && on.hub.includes(id)) && on.head.some(h => /Reading corner/.test(h)), 'with the switch on: ' + JSON.stringify(on));
  ok(BIG_ONLY.every(id => !on.little.includes(id)) && on.little.length === IDS.length - BIG_ONLY.length + 1 && [...IDS.filter(id => !BIG_ONLY.includes(id)), 'rd_storyhelp'].every(id => on.little.includes(id)), 'under-5s see: ' + on.little.join(','));
  ok(!asked2.includes('reading.js'), 'the games\' code loaded before a game opened: ' + asked2.join(','));
  // every game finishes for an under-5 (no losing: three stars) and for a big kid at Easy, Medium and Hard, in both languages;
  // nothing is left behind when a game ends
  const bad = [], left = [];
  for (const lang of ['en', 'vi']) {
    await Q.page.evaluate(async lang => { const S = await import('/js/state.js'); S.settings.lang = lang; }, lang);
    for (const [gi, id] of IDS.entries()) for (const [vi, [level, little]] of [[1, true], [1, false], [2, false], [3, false]].entries()) {
      if (little && BIG_ONLY.includes(id)) continue;
      // (sample: each game once per language, a different level each run; all of them when the reading games changed)
      if (sampled('reading') && vi !== (SEED + gi + (lang === 'vi' ? 2 : 0)) % (BIG_ONLY.includes(id) ? 3 : 4) + (BIG_ONLY.includes(id) ? 1 : 0)) continue;
      const r = await solveReading(Q.page, id, { level, little, timeout: 90000 });
      console.log(`reading case: ${lang} ${id} ${little ? 'under-5' : 'level '+level}: ${r.ok && r.won && (!little || r.stars===3) ? 'PASS' : 'FAIL'} (${r.steps || 0} interactions)`);
      if (!r.ok || !r.won || (little && r.stars !== 3)) bad.push(`${lang} ${id} ${little ? 'under-5' : 'level ' + level}: ${JSON.stringify(r).slice(0, 160)}`);
      await Q.page.waitForTimeout(400);
      const rest = await Q.page.evaluate(() => document.querySelectorAll('.gl, .rd-lantern, .rd-pond, .rd-sky, .rd-train, .rd-page').length); if (rest) left.push(`${lang} ${id}`);
      await Q.page.evaluate(() => document.querySelectorAll('.gl').forEach(e => e.remove()));
    }
  }
  ok(!bad.length, bad.slice(0, 6).join(' | '));
  ok(!left.length, 'still on screen after the game ended: ' + left.join(', '));
  ok(asked2.includes('reading.js'), 'the games\' code never loaded');
  const errs = Q.errors.slice(); await Q.ctx.close();
  ok(!errs.length, errs.slice(0, 5).join(' | '));
  return `${sampled('reading') ? 'SAMPLE (each game once per language, level by turn; all when reading files change): ' : ''}switch off: nothing loads or shows; on: 12 games in the Reading corner (9 for under-5s), all finish at Easy, Medium, Hard and for under-5s in English and Vietnamese; ${en} English and ${vi} Vietnamese lines`;
});

await check('ownerlearningprogression', async () => {
  const rows=[];
  for(const lang of ['en','vi']) {
    const P=await open(b,{w:390,h:844,touch:true,lang});await clear(P.page);
    for(const id of ['patternpicnic','shapebuilders','remembergarden']) for(const [mode,little,level] of [['under-5',true,1],['Easy',false,1],['Medium',false,2],['Hard',false,3]]) {
      await P.page.evaluate(async({id,little,level})=>{
        const G=__sv,F=await import('/js/games/frame.js');G.paused=true;
        window.__learning=F.openGame(id,{players:[G.heroes[0].profile],little,level});
      },{id,little,level});await P.page.waitForSelector('.gl');
      const r=await P.page.evaluate(async()=>{
        const F=await import('/js/games/frame.js'),wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));let wrong=false,taps=0,ready=0;
        const until=Date.now()+30000;
        while(Date.now()<until&&!document.querySelector('.gl-win')) {
          const ask=F.playWatch.ask;
          if(ask) { const bad=ask.els.find(b=>!b.disabled&&!ask.check(b)); if(!wrong&&bad){bad.click();wrong=true;}else ask.els.find(ask.check)?.click();taps++; }
          else { const next=F.playWatch.plan?.();if(next&&!next.disabled){if(next.textContent.match(/Ready|Sẵn sàng/))ready++;next.click();taps++;} }
          await wait(60);
        }
        return {won:!!document.querySelector('.gl-win'),wrong,taps,ready,stars:document.querySelectorAll('.gl-stars i.on').length,sideways:document.scrollingElement.scrollWidth>innerWidth+1,
          small:[...document.querySelectorAll('.gl-stage button')].filter(b=>!b.disabled&&b.getClientRects().length&&Math.min(b.getBoundingClientRect().width,b.getBoundingClientRect().height)<63).map(b=>b.className)};
      });
      fs.mkdirSync('out/owner-learning',{recursive:true});await P.page.screenshot({path:`out/owner-learning/${id}-${lang}-${mode}.png`});
      rows.push({id,lang,mode,...r});ok(r.won&&r.wrong&&r.taps>2&&!r.sideways&&!r.small.length&&(!little||r.stars===3),JSON.stringify(rows.at(-1)));
      await P.page.waitForTimeout(650);await P.page.locator('.gl-win p').first().click();await P.page.waitForSelector('.gl',{state:'detached'});const completed=await P.page.evaluate(()=>window.__learning);ok(completed.won,'Reward finish must return a completed activity');await P.page.waitForTimeout(100);
    }
    // A real pointer drag must reject the wrong shape and place the correct shape in its outline.
    await P.page.evaluate(async()=>{const F=await import('/js/games/frame.js');window.__learning=F.openGame('shapebuilders',{players:[__sv.heroes[0].profile],little:true,level:1});});
    await P.page.waitForSelector('.bt-slot:not([disabled])');
    const slot=P.page.locator('.bt-slot:not([disabled])'),bad=P.page.locator('.bt-piece').filter({has:P.page.locator('svg circle')}).first(),good=P.page.locator('.bt-piece').filter({has:P.page.locator('svg path')}).first();
    const drag=async b=>{const a=await b.boundingBox(),target=await slot.boundingBox();await P.page.mouse.move(a.x+a.width/2,a.y+a.height/2);await P.page.mouse.down();await P.page.mouse.move(target.x+target.width/2,target.y+target.height/2,{steps:12});await P.page.mouse.up();await P.page.waitForTimeout(250);};
    await drag(bad);ok(await P.page.locator('.bt-slot[disabled]').count()===2,'wrong dragged shape must not fill the outline');
    await drag(good);ok(await P.page.locator('.bt-slot').first().isDisabled(),'correct pointer drag must place first piece');
    await P.page.locator('.gl-x').click();await P.page.waitForSelector('.gl',{state:'detached'});
    const cleanup=await P.page.evaluate(async()=>{const F=await import('/js/games/frame.js');return {plan:F.playWatch.plan,ask:F.playWatch.ask};});ok(!cleanup.plan&&!cleanup.ask,'Cancel must clean up pending choice/placement/plan');
    const errors=P.errors;await P.ctx.close();ok(!errors.length,errors.join(' | '));
  }
  return JSON.stringify(rows);
});

// (owner repair round, points 46-48, 16 Oct AEDT) the four reasoning games really change with the level: more choices,
// bigger boards and look-alike pictures on Hard; never a forced single choice; a wrong tap says why in EN and VI; Garden
// Steps never says the answer before the child chooses it.
await check('ownerthinkinglevels', async () => {
  const rows = [];
  for (const lang of ['en', 'vi']) {
    const P = await open(b, { w: 390, h: 844, touch: true, lang }); await clear(P.page);
    for (const id of ['rulefinder', 'gardenorder', 'steppingpath', 'remembergarden']) for (const [mode, little, level] of [['under-5', true, 1], ['Easy', false, 1], ['Medium', false, 2], ['Hard', false, 3]]) {
      await P.page.evaluate(async ({ id, little, level }) => { const G = __sv, F = await import('/js/games/frame.js'); G.paused = true; window.__thinking = F.openGame(id, { players: [G.heroes[0].profile], little, level }); }, { id, little, level });
      await P.page.waitForSelector('.gl');
      const r = await P.page.evaluate(async () => {
        const F = await import('/js/games/frame.js'), wait = ms => new Promise(res => setTimeout(res, ms));
        const help = () => document.querySelector('.gl-help').textContent.trim();
        let wrongHelp = null, asks = 0, minChoices = 99, maxChoices = 0, small = [], askHelp = new Set(), grid = 0, flowers = 0, puddles = 0;
        const until = Date.now() + 45000;
        while (Date.now() < until && !document.querySelector('.gl-win')) {
          const ask = F.playWatch.ask;
          if (ask) {
            const live = ask.els.filter(b => !b.disabled && b.getClientRects().length);
            if (live.length) {
              asks++; minChoices = Math.min(minChoices, live.length); maxChoices = Math.max(maxChoices, live.length); askHelp.add(help());
              const path = document.querySelector('.think-path');
              if (path) { grid = Math.max(grid, Math.round(Math.sqrt(path.children.length))); flowers = [...path.children].filter(c => /flower|hoa/i.test(c.getAttribute('aria-label'))).length; puddles = [...path.children].filter(c => /puddle|nước/i.test(c.getAttribute('aria-label'))).length; }
              for (const x of document.querySelectorAll('.gl-stage button')) { if (x.disabled || !x.getClientRects().length) continue; const q = x.getBoundingClientRect(); if (Math.min(q.width, q.height) < (document.querySelector('.gl.little') ? 63 : 44) || q.left < -1 || q.right > innerWidth + 1) small.push(x.className); }
              const bad = live.find(b => !ask.check(b));
              if (wrongHelp === null && bad) { bad.click(); await wait(120); wrongHelp = help(); }
              else live.find(ask.check)?.click();
            }
          } else { const next = F.playWatch.plan?.(); if (next && !next.disabled) next.click(); }
          await wait(70);
        }
        const path = document.querySelector('.think-path'), deadEnds = path ? [...path.children].filter(c => /flower|hoa/i.test(c.getAttribute('aria-label')) && !c.classList.contains('right')).length : 0;
        return { won: !!document.querySelector('.gl-win'), deadEnds, asks, minChoices, maxChoices, wrongHelp, askHelp: [...askHelp], grid, flowers, puddles, small: [...new Set(small)], sideways: document.scrollingElement.scrollWidth > innerWidth + 1 };
      });
      fs.mkdirSync('out/owner-thinking', { recursive: true }); await P.page.screenshot({ path: `out/owner-thinking/${id}-${lang}-${mode}.png` });
      const row = { id, lang, mode, ...r }; rows.push(row); const say = JSON.stringify(row);
      ok(r.won && r.asks > 1, 'did not finish: ' + say);
      ok(r.minChoices >= 2, 'a forced single choice: ' + say);
      ok(r.wrongHelp && !/^(Try again|Thử lại)/i.test(r.wrongHelp) , 'a wrong tap must say why: ' + say);
      ok(!r.small.length && !r.sideways, 'small buttons or sideways scroll: ' + say);
      if (lang === 'vi') ok(r.askHelp.every(t => /[ăâđêôơưàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/i.test(t)), 'English guidance in Vietnamese: ' + say);
      if (id === 'gardenorder') ok(r.askHelp.filter(t => t !== r.wrongHelp).every(t => /first|next|trước|tiếp theo/i.test(t)), 'Garden Steps must not name the answer before the choice: ' + say);
      await P.page.waitForTimeout(650); await P.page.locator('.gl-win p').first().click(); await P.page.waitForSelector('.gl', { state: 'detached' });
      ok((await P.page.evaluate(() => window.__thinking)).won, 'the reward must finish the game: ' + say);
    }
    ok(!P.errors.length, P.errors.join('\n')); await P.ctx.close();
  }
  // the levels really differ (under-5 < Easy < Hard in choices or board size; Medium adds dead-end flowers)
  const get = (id, mode) => rows.filter(x => x.id === id && x.mode === mode);
  for (const lang of ['en', 'vi']) {
    const one = (id, mode) => get(id, mode).find(x => x.lang === lang);
    ok(one('rulefinder', 'under-5').maxChoices === 2 && one('rulefinder', 'Easy').maxChoices === 3 && one('rulefinder', 'Hard').maxChoices === 4, 'Find the Rule choices by level: ' + JSON.stringify(get('rulefinder', 'Hard')));
    ok(one('steppingpath', 'under-5').grid === 3 && one('steppingpath', 'Easy').grid === 4 && one('steppingpath', 'Hard').grid === 5, 'Flower Path board by level');
    ok(one('steppingpath', 'Easy').deadEnds === 0 && one('steppingpath', 'Medium').deadEnds >= 1 && one('steppingpath', 'Hard').deadEnds >= 1, 'Flower Path dead ends from Medium: ' + JSON.stringify(get('steppingpath', 'Medium')));
    ok(one('gardenorder', 'Hard').maxChoices > one('gardenorder', 'under-5').maxChoices && one('remembergarden', 'Hard').maxChoices > one('remembergarden', 'Easy').maxChoices, 'Garden Steps and Remember the Garden choices grow');
  }
  // (owner, 16 Oct: "the flower path pictures overlap each other") on a tablet and a computer too, every square's picture
  // stays inside its square and the squares do not touch
  for (const [w, h, touch] of [[390, 844, true], [820, 1180, true], [1280, 800, false]]) {
    const P = await open(b, { w, h, touch }); await clear(P.page);
    for (const level of [1, 3]) {
      await P.page.evaluate(async level => { const F = await import('/js/games/frame.js'); __sv.paused = true; window.__thinking = F.openGame('steppingpath', { players: [__sv.heroes[0].profile], little: false, level }); }, level);
      await P.page.waitForSelector('.think-path'); await P.page.waitForTimeout(600);
      const bad = await P.page.evaluate(() => { const out = [], cells = [...document.querySelectorAll('.think-path button')];
        cells.forEach((c, i) => { const r = c.getBoundingClientRect(), a = c.querySelector('svg, .art, .emo')?.getBoundingClientRect(); if (a && (a.left < r.left - .5 || a.right > r.right + .5 || a.top < r.top - .5 || a.bottom > r.bottom + .5)) out.push(`picture ${i} ${Math.round(a.width)} in ${Math.round(r.width)}`);
          const n = cells[i + 1]; if (n && (i + 1) % Math.round(Math.sqrt(cells.length)) && n.getBoundingClientRect().left < r.right + 2) out.push(`squares ${i} and ${i + 1} touch`); });
        return out; });
      ok(!bad.length, `Flower Path at ${w}x${h}, level ${level}: ` + bad.slice(0, 4).join('; '));
      await P.page.locator('.gl-x').click(); await P.page.waitForSelector('.gl', { state: 'detached' });
    }
    await P.ctx.close();
  }
  fs.writeFileSync('out/owner-thinking/results.json', JSON.stringify(rows, null, 2));
});

await check('ownerlearninglayout', async () => {
  const rows=[];
  for(const [w,h,lang] of [[320,640,'en'],[320,640,'vi'],[390,844,'en'],[844,390,'vi'],[820,1180,'en'],[1280,800,'en']]) {
    const P=await open(b,{w,h,touch:w<1000,lang});await clear(P.page);
    for(const id of ['patternpicnic','shapebuilders','remembergarden']) {
      await P.page.evaluate(async id=>{const F=await import('/js/games/frame.js');__sv.paused=true;window.__learning=F.openGame(id,{players:[__sv.heroes[0].profile],little:true,level:1});},id);
      await P.page.waitForSelector('.gl-stage button');await P.page.evaluate(()=>document.fonts.ready);
      const panel=await P.page.locator('.gl').boundingBox(), controls=P.page.locator('.gl-stage button:not([disabled])');
      for(let i=0;i<await controls.count();i++) {
        const control=controls.nth(i);await control.scrollIntoViewIfNeeded();const r=await control.evaluate(e=>{const a=e.getBoundingClientRect(),top=document.elementFromPoint(a.x+a.width/2,a.y+a.height/2);return {w:a.width,h:a.height,x:a.x,y:a.y,right:a.right,bottom:a.bottom,hit:e===top||e.contains(top),label:e.getAttribute('aria-label')||e.textContent};});
        ok(r.w>=63&&r.h>=63&&r.x>=-1&&r.right<=w+1&&r.y>=-1&&r.bottom<=h+1&&r.hit,JSON.stringify({id,w,h,lang,r}));
      }
      const after=await P.page.locator('.gl').boundingBox();ok(Math.abs(panel.y-after.y)<1&&Math.abs(panel.height-after.height)<1,'Activity shell moved while scrolling controls');
      await P.page.evaluate(()=>{document.querySelector('.gl-stage').scrollTop=0;});fs.mkdirSync('out/owner-learning-stage',{recursive:true});await P.page.screenshot({path:`out/owner-learning-stage/${id}-${w}-${h}-${lang}.png`});rows.push({id,w,h,lang,controls:await controls.count()});
      await P.page.locator('.gl-x').click();await P.page.waitForSelector('.gl',{state:'detached'});
    }
    const errors=P.errors;await P.ctx.close();ok(!errors.length,errors.join(' | '));
  }
  // Touch sends implicit pointer capture; mouse-only drag proof does not cover that path.
  const P=await open(b,{w:390,h:844,touch:true,lang:'vi'});await clear(P.page);
  await P.page.evaluate(async()=>{const F=await import('/js/games/frame.js');__sv.paused=true;window.__learning=F.openGame('shapebuilders',{players:[__sv.heroes[0].profile],little:true,level:1});});
  const piece=P.page.locator('.bt-piece').filter({has:P.page.locator('svg path')}).first(),slot=P.page.locator('.bt-slot:not([disabled])');await piece.scrollIntoViewIfNeeded();
  const a=await piece.boundingBox(),target=await slot.boundingBox(),cdp=await P.ctx.newCDPSession(P.page);
  const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y,id:1}]});
  await touch('touchStart',a.x+a.width/2,a.y+a.height/2);for(let i=1;i<=12;i++)await touch('touchMove',a.x+a.width/2+(target.x+target.width/2-a.x-a.width/2)*i/12,a.y+a.height/2+(target.y+target.height/2-a.y-a.height/2)*i/12);await touch('touchEnd');
  await P.page.waitForTimeout(400);ok(await P.page.locator('.bt-slot').first().isDisabled(),'Real touch drag must place the matching shape with implicit pointer capture');
  await P.page.locator('.gl-x').click();const errors=P.errors;await P.ctx.close();ok(!errors.length,errors.join(' | '));return JSON.stringify(rows);
});

await check('owneractivityshell', async () => {
  const P=await open(b,{w:320,h:640,touch:true,lang:'vi'});await clear(P.page);
  await P.page.evaluate(async()=>{const V=await import('/js/voice.js');V.spoken.forEach(f=>f('A surprise gift is waiting in the valley.'));});await P.page.waitForSelector('.caption.show');
  await P.page.evaluate(async()=>{const F=await import('/js/games/frame.js');__sv.paused=true;window.__learning=F.openGame('shapebuilders',{players:[__sv.heroes[0].profile],little:true,level:1});});await P.page.waitForSelector('.bt-piece');await P.page.evaluate(()=>document.fonts.ready);
  const before=await P.page.locator('.gl-head').boundingBox();await P.page.locator('.bt-piece').last().scrollIntoViewIfNeeded();
  const r=await P.page.evaluate(()=>{const head=document.querySelector('.gl-head').getBoundingClientRect(),star=document.querySelector('.gl .starbox').getBoundingClientRect(),help=document.querySelector('.gl-help').getBoundingClientRect();return {headY:head.y,caption:!!document.querySelector('.caption.show'),starHelpOverlap:star.x<help.right&&star.right>help.x&&star.y<help.bottom&&star.bottom>help.y,scroll:document.querySelector('.gl').scrollTop};});
  fs.mkdirSync('out/owner-activity-shell',{recursive:true});await P.page.screenshot({path:'out/owner-activity-shell/phone-vi.png'});
  const errors=P.errors;await P.ctx.close();ok(!r.caption&&!r.starHelpOverlap&&r.headY>=0&&Math.abs(r.headY-before.y)<1&&!errors.length,JSON.stringify({r,before,errors}));
  return 'Small activity header stays visible while body scrolls; reward counter cannot cover guidance; queued valley captions are hidden on entry';
});

await check('ownerlearningcomposition', async () => {
  const bad=[],rows=[],P=await open(b,{w:320,h:640,touch:true,lang:'vi'});await clear(P.page);
  for(const id of ['patternpicnic','shapebuilders','remembergarden']) {
    await P.page.evaluate(id=>{const p=__sv.heroes[0].profile;p.age='little';p.gameDiff={...p.gameDiff,[id]:'easy'};window.__learning=__sv.playGame(0,id,'replay');},id);await P.page.waitForSelector('.gl-lvl');await P.page.evaluate(()=>document.fonts.ready);await P.page.waitForTimeout(400);
    const r=await P.page.evaluate(()=>{
      const rect=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
      const header=[...document.querySelectorAll('.gl-head button')].map(b=>({label:b.getAttribute('aria-label')||b.textContent,width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height}));
      const board=rect('.bt-picture'),repeat=rect('.bt-repeat'),palette=rect('.gl-stage .choices'),stage=rect('.gl-stage');
      const maxPieceBottom=board?Math.max(...[...document.querySelectorAll('.bt-slot')].map(b=>b.getBoundingClientRect().bottom)):null;
      return {header,board,repeat,palette,stage,maxPieceBottom};
    });rows.push({id,...r});if(r.header.some(b=>b.width<63||b.height<63))bad.push(id+': under-5 header target below64px');
    if(r.board&&(r.maxPieceBottom>r.board.bottom+1||r.maxPieceBottom>r.repeat.y-4||r.palette.bottom>r.stage.bottom+1))bad.push(id+': picture compresses/overlaps or palette cannot stay visible with the model');
    fs.mkdirSync('out/owner-learning-composition',{recursive:true});await P.page.screenshot({path:`out/owner-learning-composition/${id}.png`});await P.page.locator('.gl-x').click();await P.page.waitForSelector('.gl',{state:'detached'});await P.page.waitForTimeout(100);
  }
  await P.page.setViewportSize({width:844,height:390});
  await P.page.evaluate(async()=>{const F=await import('/js/games/frame.js');window.__learning=F.openGame('remembergarden',{players:[__sv.heroes[0].profile],little:true});});/* (r79 G2) under-5s: the line is hidden with its space kept, so wait for it on the page, not for it to show */await P.page.waitForSelector('.gl-help',{state:'attached'});await P.page.waitForTimeout(400);
  const overlap=await P.page.evaluate(()=>{const a=document.querySelector('.gl .starbox').getBoundingClientRect(),b=document.querySelector('.gl-help').getBoundingClientRect();return a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;});if(overlap)bad.push('landscape reward counter overlaps guidance');await P.page.locator('.gl-x').click();await P.page.waitForSelector('.gl',{state:'detached'});
  await P.page.setViewportSize({width:320,height:640});
  await P.page.evaluate(async()=>{const F=await import('/js/games/frame.js');F.register({id:'__guideprobe',icon:'🧩',name:()=> 'Guide probe',run(api){api.say('Choose the picture and think about what happens next. '.repeat(12),'Chọn hình và nghĩ xem chuyện gì xảy ra tiếp theo. '.repeat(12));const b=document.createElement('button');b.className='choice';b.textContent='Go';api.stage.appendChild(b);}});window.__learning=F.openGame('__guideprobe',{players:[__sv.heroes[0].profile],little:true});});await P.page.waitForSelector('.gl-stage .choice');await P.page.waitForTimeout(400);await P.page.locator('.gl-stage .choice').scrollIntoViewIfNeeded();
  const help=await P.page.evaluate(()=>{const h=document.querySelector('.gl-help'),s=document.querySelector('.gl-stage').getBoundingClientRect();return {height:h.getBoundingClientRect().height,scrollable:h.scrollHeight>h.clientHeight,stageHeight:s.height,viewportHeight:innerHeight};});if(help.stageHeight<104||help.height>help.viewportHeight*.35)bad.push('long guidance removes the playing field');
  const errors=P.errors;await P.ctx.close();ok(!bad.length&&!errors.length,JSON.stringify({bad,rows,help,errors}));return 'Real game entrance:64px header controls, complete picture and palette visible; landscape stars clear; long guidance scrolls without hiding play';
});

await check('r79learning', async () => {
  // r79 learning (chat 2)
  // (r79 learning, chat 2, owner 16 Oct AEDT) the check `r79learning` (called from tests/run.mts):
  //  games  the four talk-and-touch games (Say It Find It, Market Counting, How Do They Feel?, First Sound Hunt) at
  //         under-5, Easy, Medium and Hard, in English and Vietnamese, on a phone: played to the end with one wrong tap
  //         each; never a single choice; every wrong tap says why (not just "Try again"); buttons 64 px for under-5s and
  //         44 px otherwise; nothing off screen; the levels differ
  //  E1     three right in a row in a learning game: one small reward banner under the top bar, never two, never over the
  //         puzzle, and no old stacked "Combo" banner
  //  E3     on a computer "Hear again" and "Ready to try" have 18 to 20 px text
  //  E4     "You did it!" has a dark layer behind it (dark, blurred background; the words on a dark band)
  //  I1     three right in a row make the next round one step harder; two misses one step easier; at most one step from
  //         the start; under-5s never change; Flower Path's step carries to "Play again" of the same game only
  //  I2     the rule a child missed most comes back first; a miss counts up and a clean answer counts down; old saves of
  //         any shape get a clean record; the record is kept after a reload
  //  I4     finishing Hard in a reasoning game gives its skill sticker once (not for under-5s); the sticker book draws it
  //  G2     under-5s: question line hidden (space kept), bigger pictures, and a hand shows the first move the first time
  //         only; bigger children see neither
  //  mic    Say It, Find It: without speech recognition there is no microphone button and tapping works; with it, saying
  //         the word counts like a tap, a refused microphone hides the button, and nothing breaks
  const NEW = ['sayfind', 'marketcount', 'feelings', 'soundhunt'];
  const MODES = [['under-5', true, 1], ['Easy', false, 1], ['Medium', false, 2], ['Hard', false, 3]];
  const VI_MARK = /[ăâđêôơưàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/i;
  const EN_WORDS = /\b(the|is|are|find|that|put|where|yes|we|need|take|add|feels|you|picture|starts|ends|basket|well done)\b/i;
  const openGame = (P, id, little, level, extra = {}) => P.page.evaluate(async ({ id, little, level, extra }) => { const F = await import('/js/games/frame.js'); __sv.paused = true; window.__r79 = F.openGame(id, { players: [__sv.heroes[0].profile], little, level, ...extra }); }, { id, little, level, extra });
  const finishWin = async P => { await P.page.waitForTimeout(650); await P.page.locator('.gl-win p').first().click(); await P.page.waitForSelector('.gl', { state: 'detached' }); return P.page.evaluate(() => window.__r79); };
  const leave = async P => { await P.page.locator('.gl-x').click(); await P.page.waitForSelector('.gl', { state: 'detached' }); };
  // play the open game through the auto play hooks with real taps: one wrong tap first (when there is a wrong choice),
  // then right ones; measures every question on the way
  const PLAY = async ({ wrongs = 1, rightsOnly = false } = {}) => {
    const F = await import('/js/games/frame.js'), wait = ms => new Promise(res => setTimeout(res, ms));
    const help = () => document.querySelector('.gl-help').textContent.trim();
    let wrongLeft = rightsOnly ? 0 : wrongs, asks = 0, minChoices = 99, maxChoices = 0, small = [], off = [], askHelp = new Set(), wrongHelp = [], banners = 0, stacked = 0, rounds = [];
    const until = Date.now() + 60000;
    while (Date.now() < until && !document.querySelector('.gl-win')) {
      banners = Math.max(banners, document.querySelectorAll('.gl-reward').length); stacked += document.querySelectorAll('.gl-combo').length;
      const ask = F.playWatch.ask;
      if (ask) {
        const live = ask.els.filter(b => b.isConnected && !b.disabled && b.getClientRects().length);
        if (live.length) {
          asks++; minChoices = Math.min(minChoices, live.length); maxChoices = Math.max(maxChoices, live.length); askHelp.add(help());
          rounds.push({ tier: +document.querySelector('.gl').dataset.tier, choices: live.length, examples: document.querySelectorAll('.gl-stage .seq .seq-item:not(.q)').length, stage: document.querySelectorAll('.gl-stage .choices .choice').length });
          const minSize = document.querySelector('.gl.little') ? 63 : 43.5;
          for (const x of document.querySelectorAll('.gl-stage button')) { if (x.disabled || !x.getClientRects().length) continue; const q = x.getBoundingClientRect(); if (Math.min(q.width, q.height) < minSize) small.push(x.className + ' ' + Math.round(q.width) + 'x' + Math.round(q.height)); if (q.left < -1 || q.right > innerWidth + 1) off.push(x.className); }
          // (in Market Counting moving a fruit is a move that is counted aloud, not an answer: the answer is "That's it!")
          const bad = live.find(b => !ask.check(b) && !b.classList.contains('mc-fruit')) || live.find(b => !ask.check(b));
          if (wrongLeft > 0 && bad) { wrongLeft--; bad.click(); await wait(150); wrongHelp.push(help()); }
          else live.find(ask.check)?.click();
        }
      } else { const next = F.playWatch.plan?.(); if (next && !next.disabled) next.click(); }
      await wait(70);
    }
    return { won: !!document.querySelector('.gl-win'), asks, minChoices, maxChoices, wrongHelp, askHelp: [...askHelp], small: [...new Set(small)], off: [...new Set(off)], sideways: document.scrollingElement.scrollWidth > innerWidth + 1, banners, stacked, rounds };
  };

  const notes = [], rows = [];
  fs.mkdirSync('out/r79-learning', { recursive: true });

  // ---------- the four new games, every level, both languages ----------
  for (const lang of ['en', 'vi']) {
    const P = await open(b, { w: 390, h: 844, touch: true, lang }); await clear(P.page);
    for (const id of NEW) for (const [mode, little, level] of MODES) {
      await openGame(P, id, little, level); await P.page.waitForSelector('.gl');
      const r = await P.page.evaluate(PLAY, { wrongs: 1 });
      await P.page.screenshot({ path: `out/r79-learning/${id}-${lang}-${mode}.png` });
      const row = { id, lang, mode, ...r, rounds: undefined, first: r.rounds[0] }; rows.push(row); const say = JSON.stringify(row);
      ok(r.won && r.asks > 1, 'did not finish: ' + say);
      ok(r.minChoices >= 2, 'a single-choice question: ' + say);
      ok(r.wrongHelp.length && r.wrongHelp.every(t => t && !/^(Try again|Thử lại)/i.test(t)), 'a wrong tap must say why: ' + say);
      ok(!r.small.length && !r.off.length && !r.sideways, 'small or off-screen buttons, or sideways scroll: ' + say);
      ok(r.banners <= 1 && !r.stacked, 'more than one reward banner: ' + say);
      // Vietnamese: the question has Vietnamese letters, and no line has English words (short Vietnamese words such as
      // "cua", "kem" or a counted "Hai" have no accent marks, so the other lines are checked for English instead)
      if (lang === 'vi') ok(VI_MARK.test(r.askHelp[0]) && [...r.askHelp, ...r.wrongHelp].every(t => !EN_WORDS.test(t)), 'English words in a Vietnamese game: ' + say);
      ok((await finishWin(P)).won, 'the reward must finish the game: ' + say);
    }
    ok(!P.errors.length, P.errors.join('\n')); await P.ctx.close();
  }
  // the levels differ: more pictures from under-5 to Easy to Medium; Hard asks for something harder
  for (const lang of ['en', 'vi']) {
    const one = (id, mode) => rows.find(x => x.id === id && x.mode === mode && x.lang === lang);
    ok(one('sayfind', 'under-5').first.choices === 2 && one('sayfind', 'Easy').first.choices === 4 && one('sayfind', 'Medium').first.choices === 6, 'Say It, Find It: 2, 4, 6 pictures: ' + lang);
    ok(one('sayfind', 'Hard').askHelp.some(t => /big|little| to | nhỏ/.test(t)), 'Say It, Find It Hard asks with two words: ' + JSON.stringify(one('sayfind', 'Hard').askHelp));
    ok(one('feelings', 'under-5').first.choices === 2 && one('feelings', 'Easy').first.choices === 4, 'How Do They Feel?: 2 then 4 faces: ' + lang);
    ok(one('feelings', 'Hard').askHelp.some(t => /What could you do|Con có thể làm gì/.test(t)), 'How Do They Feel? Hard asks what could help');
    ok(one('soundhunt', 'under-5').first.choices === 2 && one('soundhunt', 'Easy').first.choices === 4 && one('soundhunt', 'Medium').first.choices === 6, 'First Sound Hunt: 2, 4, 6 pictures: ' + lang);
    ok(one('soundhunt', 'Hard').askHelp.some(t => lang === 'vi' ? /dấu|thanh/.test(t) : /ends like/.test(t)), 'First Sound Hunt Hard: end sounds or tones: ' + JSON.stringify(one('soundhunt', 'Hard').askHelp));
    ok(one('marketcount', 'Hard').askHelp.some(t => /Add 2 more|Take 1 away|thêm hai|Lấy ra một/.test(t)), 'Market Counting Hard: add or take away');
  }
  notes.push(`games ${rows.length} runs`);

  const P = await open(b, { w: 390, h: 844, touch: true, lang: 'en' }); await clear(P.page);
  const prof = f => P.page.evaluate(f);
  // ---------- E1: one small banner under the top bar, not over the puzzle ----------
  await openGame(P, 'rulefinder', false, 1); await P.page.waitForSelector('.gl-stage .choice');
  const e1 = await P.page.evaluate(async () => {
    const F = await import('/js/games/frame.js'), wait = ms => new Promise(r => setTimeout(r, ms)); let k = 0, most = 0, over = [], old = 0;
    while (k < 3) { const ask = F.playWatch.ask; if (ask) { const e = ask.els.find(x => !x.disabled && ask.check(x)); if (e) { e.click(); k++; } } await wait(450); }
    for (let i = 0; i < 12; i++) {
      const bs = [...document.querySelectorAll('.gl-reward')]; most = Math.max(most, bs.length); old += document.querySelectorAll('.gl-combo').length;
      const head = document.querySelector('.gl-head').getBoundingClientRect(), keep = [...document.querySelectorAll('.gl-stage .seq, .gl-stage .choices, .gl-help, .gl-head button')].map(x => x.getBoundingClientRect());
      for (const b of bs) { const r = b.getBoundingClientRect(); if (r.top < head.top - 1 || r.bottom > head.bottom + 1 || keep.some(p => r.bottom > p.top && r.top < p.bottom && r.right > p.left && r.left < p.right) || r.height > 40) over.push(Math.round(r.top) + '/' + Math.round(r.height)); }
      await wait(60);
    }
    return { most, over: [...new Set(over)], old };
  });
  ok(e1.most === 1 && !e1.over.length && !e1.old, 'E1 reward banner: ' + JSON.stringify(e1));
  await P.page.screenshot({ path: 'out/r79-learning/e1-banner.png' }); await leave(P);

  // ---------- E4: the dark layer behind "You did it!" ----------
  await openGame(P, 'patternpicnic', true, 1); await P.page.waitForSelector('.gl');
  await P.page.evaluate(PLAY, { rightsOnly: true }); await P.page.waitForSelector('.gl-win'); await P.page.waitForTimeout(1700);
  const e4 = await P.page.evaluate(() => { const w = getComputedStyle(document.querySelector('.gl-win')), p = getComputedStyle(document.querySelector('.gl-win > p')); const a = +(w.backgroundColor.match(/[\d.]+\)$/) || ['1'])[0].replace(')', ''); return { alpha: a, blur: /blur/.test(w.backdropFilter || w.webkitBackdropFilter || ''), band: p.backgroundColor }; });
  ok(e4.alpha >= .75 && e4.blur && e4.band !== 'rgba(0, 0, 0, 0)', 'E4 win layer: ' + JSON.stringify(e4));
  await P.page.screenshot({ path: 'out/r79-learning/e4-win.png' }); await finishWin(P);

  // ---------- I1: the level follows the child ----------
  // Easy, all right: rounds 1-3 Easy (2 examples), round 4 one step harder (3 examples), never Hard (4 choices)
  await openGame(P, 'rulefinder', false, 1); await P.page.waitForSelector('.gl');
  const up = await P.page.evaluate(PLAY, { rightsOnly: true }); await finishWin(P);
  const ex = up.rounds.map(r => r.tier);
  ok(ex.join('') === '1112' && up.rounds.at(-1).examples === 3 && up.maxChoices <= 3, 'I1 three right in a row: one step harder, at most one step: ' + JSON.stringify(up.rounds));
  // Medium, two misses in round 1: round 2 one step easier (2 examples)
  await openGame(P, 'rulefinder', false, 2); await P.page.waitForSelector('.gl');
  const down = await P.page.evaluate(PLAY, { wrongs: 2 }); await finishWin(P);
  const dEx = down.rounds.map(r => r.tier).join('');
  ok(/^2+1+2*$/.test(dEx) && down.rounds.every(r => r.tier >= 1), 'I1 two misses: one step easier: ' + JSON.stringify(down.rounds) + dEx);
  // under-5: always 2 choices, however well they do
  await openGame(P, 'rulefinder', true, 1); await P.page.waitForSelector('.gl');
  const u5 = await P.page.evaluate(PLAY, { rightsOnly: true }); await finishWin(P);
  ok(u5.maxChoices === 2 && u5.minChoices === 2 && u5.rounds.every(r => r.tier === 0), 'I1 under-5s stay at their level: ' + JSON.stringify(u5.rounds));
  // Flower Path (one board): the step carries to "Play again" of the same game, and to nothing else
  // dead ends: flower squares (not the start) touching only one other flower or the flag (the path never touches itself)
  const deadEnds = () => P.page.evaluate(() => { const cells = [...document.querySelector('.think-path').children], n = Math.round(Math.sqrt(cells.length)), on = i => i >= 0 && i < cells.length && /flower|flag/i.test(cells[i].getAttribute('aria-label'));
    return cells.filter((c, i) => i > 0 && /flower/i.test(c.getAttribute('aria-label')) && [i - n, i + n, i % n ? i - 1 : -1, (i + 1) % n ? i + 1 : -1].filter(on).length === 1).length; });
  await openGame(P, 'steppingpath', false, 1); await P.page.waitForSelector('.think-path');
  const flowersEasy = await deadEnds();
  await P.page.evaluate(PLAY, { rightsOnly: true }); await P.page.waitForTimeout(1800);
  await P.page.locator('.gl-nx[data-n="again"]').click(); await P.page.waitForSelector('.gl', { state: 'detached' });
  const againRes = await P.page.evaluate(() => window.__r79); ok(againRes.next === 'again', 'Play again result: ' + JSON.stringify(againRes));
  await openGame(P, 'steppingpath', false, 1); await P.page.waitForSelector('.think-path');
  const carried = { size: await P.page.evaluate(() => Math.round(Math.sqrt(document.querySelector('.think-path').children.length))), deadEnds: await deadEnds() };
  await leave(P);
  await openGame(P, 'steppingpath', false, 1); await P.page.waitForSelector('.think-path');
  const fresh = { size: await P.page.evaluate(() => Math.round(Math.sqrt(document.querySelector('.think-path').children.length))), deadEnds: await deadEnds() }; await leave(P);
  ok(flowersEasy === 0 && carried.size === 4 && carried.deadEnds >= 1 && fresh.size === 4 && fresh.deadEnds === 0, 'I1 Flower Path: the step carries to Play again only: ' + JSON.stringify({ flowersEasy, carried, fresh }));
  notes.push(`I1 Easy tiers ${ex.join('')}, Medium with two misses ${dEx}`);

  // ---------- I2: the rule missed most comes back first ----------
  await prof(() => { const p = __sv.heroes[0].profile; p.learn = { v: 1, miss: { rulefinder: { clothes: 2, fruit: 1 } }, seen: {} }; });
  await openGame(P, 'rulefinder', false, 1); await P.page.waitForSelector('.gl');
  const i2 = await P.page.evaluate(async () => {
    const F = await import('/js/games/frame.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    while (!F.playWatch.ask) await wait(50);
    const ask = F.playWatch.ask; ask.els.find(b => !ask.check(b)).click(); await wait(150);
    return { help: document.querySelector('.gl-help').textContent, miss: JSON.parse(JSON.stringify(__sv.heroes[0].profile.learn.miss.rulefinder)) };
  });
  ok(/things to wear/.test(i2.help) && i2.miss.clothes === 3, 'I2 the missed rule comes first and counts up: ' + JSON.stringify(i2));
  await leave(P);
  // a clean answer counts it down
  await prof(() => { __sv.heroes[0].profile.learn.miss.rulefinder = { clothes: 1 }; });
  await openGame(P, 'rulefinder', false, 1); await P.page.waitForSelector('.gl');
  await P.page.evaluate(PLAY, { rightsOnly: true }); await finishWin(P);
  const after = await prof(() => __sv.heroes[0].profile.learn.miss.rulefinder || {});
  ok(!after.clothes, 'I2 a clean answer counts the miss down: ' + JSON.stringify(after));
  // old saves of any shape (stable saved data) and the record kept after a reload
  const mig = await P.page.evaluate(async () => {
    const S = await import('/js/state.js');
    const a = S.normalizeProfile({ name: 'Old', stickers: ['🦄'], levels: { counting: 3 } });
    const b2 = S.normalizeProfile({ name: 'Odd', learn: 'junk' });
    const c = S.normalizeProfile({ name: 'Mixed', learn: { miss: { rulefinder: { fly: '2', red: -1, x: 'no' }, bad: [] }, seen: { feelings: true, x: 0 } } });
    return { a: a.learn, kept: a.stickers.length === 1 && a.levels.counting === 3, b: b2.learn, c: c.learn };
  });
  ok(JSON.stringify(mig.a) === '{"v":1,"miss":{},"seen":{}}' && mig.kept && JSON.stringify(mig.b) === '{"v":1,"miss":{},"seen":{}}' && JSON.stringify(mig.c) === '{"v":1,"miss":{"rulefinder":{"fly":2}},"seen":{"feelings":1}}', 'I2 old saves: ' + JSON.stringify(mig));
  await prof(async () => { __sv.heroes[0].profile.learn.miss.gardenorder = { 'Snow falls.': 2 }; (await import('/js/state.js')).saveProfiles(true); });
  await P.page.waitForTimeout(300); await P.page.reload(); await P.page.waitForSelector('.screen.title', { timeout: 90000 });
  const kept = await P.page.evaluate(async () => (await import('/js/state.js')).profiles[0].learn.miss.gardenorder);
  ok(kept && kept['Snow falls.'] === 2, 'I2 the record is kept after a reload: ' + JSON.stringify(kept));
  ok(!P.errors.length, P.errors.join('\n')); await P.ctx.close();

  // ---------- I4: skill stickers ----------
  const Q = await open(b, { w: 390, h: 844, touch: true, lang: 'vi' }); await clear(Q.page);
  await Q.page.evaluate(() => { const p = __sv.heroes[0].profile; p.stickers = []; });
  await openGame(Q, 'rulefinder', true, 3); await Q.page.waitForSelector('.gl'); await Q.page.evaluate(PLAY, { rightsOnly: true }); await Q.page.waitForSelector('.gl-win');
  const littleSticker = await Q.page.evaluate(() => ({ shown: !!document.querySelector('.gl-skill'), has: __sv.heroes[0].profile.stickers.includes('skill:rulefinder') }));
  await finishWin(Q);
  ok(!littleSticker.shown && !littleSticker.has, 'I4 no skill sticker for under-5s: ' + JSON.stringify(littleSticker));
  await openGame(Q, 'rulefinder', false, 3); await Q.page.waitForSelector('.gl'); await Q.page.evaluate(PLAY, { rightsOnly: true }); await Q.page.waitForSelector('.gl-win'); await Q.page.waitForTimeout(1700);
  const won = await Q.page.evaluate(() => { const s = document.querySelector('.gl-skill'), r = s && s.getBoundingClientRect(); return { text: s && s.textContent.trim(), svg: !!(s && s.querySelector('svg')), inside: !!r && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, n: __sv.heroes[0].profile.stickers.filter(x => x === 'skill:rulefinder').length }; });
  await Q.page.screenshot({ path: 'out/r79-learning/i4-sticker-vi.png' }); await finishWin(Q);
  ok(won.text && /Tìm quy luật/.test(won.text) && won.svg && won.inside && won.n === 1, 'I4 the sticker at Hard: ' + JSON.stringify(won));
  await openGame(Q, 'rulefinder', false, 3); await Q.page.waitForSelector('.gl'); await Q.page.evaluate(PLAY, { rightsOnly: true }); await Q.page.waitForSelector('.gl-win');
  const twice = await Q.page.evaluate(() => ({ shown: !!document.querySelector('.gl-skill'), n: __sv.heroes[0].profile.stickers.filter(x => x === 'skill:rulefinder').length })); await finishWin(Q);
  ok(!twice.shown && twice.n === 1, 'I4 only once: ' + JSON.stringify(twice));
  // every reasoning game has a drawn sticker, and the sticker book draws it (never the key as words)
  const book = await Q.page.evaluate(async () => {
    const A = await import('/js/art.js'), R = await import('/js/games/registry.js');
    const drawn = Object.values(R.SKILLS).every(s => A.hasArt(s.key));
    __sv.heroes[0].profile.stickers.push('skill:gardenorder'); __sv.openScrapbook(__sv.heroes[0]);
    await new Promise(r => setTimeout(r, 400));
    const tray = document.querySelector('.sb-tray'), btn = tray && tray.querySelector('[data-s="skill:rulefinder"]');
    return { drawn, svg: !!(btn && btn.querySelector('svg')), words: /skill:/.test(tray ? tray.innerText : 'skill:'), label: btn && btn.getAttribute('aria-label'), size: btn ? Math.round(btn.getBoundingClientRect().width) : 0 };
  });
  ok(book.drawn && book.svg && !book.words && book.label === 'Tìm quy luật' && book.size >= 44, 'I4 sticker book: ' + JSON.stringify(book));
  await Q.page.screenshot({ path: 'out/r79-learning/i4-scrapbook-vi.png' });
  await Q.page.evaluate(() => document.querySelector('.modal.scrap .x, .scrap .x')?.click()); await Q.page.waitForTimeout(300);
  ok(!Q.errors.length, Q.errors.join('\n')); await Q.ctx.close();

  // ---------- G2: picture-only mode and the showing hand ----------
  const R = await open(b, { w: 390, h: 844, touch: true, lang: 'en' }); await clear(R.page);
  await R.page.evaluate(() => { __sv.heroes[0].profile.learn = { v: 1, miss: {}, seen: {} }; });
  await openGame(R, 'gardenorder', true, 1); await R.page.waitForSelector('.gl-stage .choice'); await R.page.waitForTimeout(500);
  const g2 = await R.page.evaluate(async () => {
    const F = await import('/js/games/frame.js'), layer = document.querySelector('.gl'), help = document.querySelector('.gl-help'), hand = document.querySelector('.gl-hand');
    const ask = F.playWatch.ask, right = ask && ask.els.find(ask.check), rr = right && right.getBoundingClientRect(), hr = hand && hand.getBoundingClientRect();
    const choice = document.querySelector('.gl-stage .choice').getBoundingClientRect();
    return { picOnly: layer.classList.contains('pic-only'), hidden: getComputedStyle(help).visibility === 'hidden', helpHeight: help.getBoundingClientRect().height, text: help.textContent.length,
      hand: !!hand, onRight: !!(hr && rr && hr.left + 28 > rr.left - 4 && hr.left + 28 < rr.right + 4 && hr.top > rr.top - 30 && hr.top < rr.bottom), choice: Math.round(choice.width), seen: __sv.heroes[0].profile.learn.seen.gardenorder };
  });
  await R.page.screenshot({ path: 'out/r79-learning/g2-hand.png' }); await leave(R);
  ok(g2.picOnly && g2.hidden && g2.helpHeight > 0 && g2.text > 0 && g2.hand && g2.onRight && g2.choice >= 112 && g2.seen === 1, 'G2 under-5 first time: ' + JSON.stringify(g2));
  await openGame(R, 'gardenorder', true, 1); await R.page.waitForSelector('.gl-stage .choice'); await R.page.waitForTimeout(500);
  const g2b = await R.page.evaluate(() => !!document.querySelector('.gl-hand')); await leave(R);
  ok(!g2b, 'G2 the hand shows only the first time');
  await openGame(R, 'rulefinder', false, 1); await R.page.waitForSelector('.gl-stage .choice'); await R.page.waitForTimeout(500);
  const g2c = await R.page.evaluate(() => ({ picOnly: document.querySelector('.gl').classList.contains('pic-only'), hand: !!document.querySelector('.gl-hand'), help: getComputedStyle(document.querySelector('.gl-help')).visibility }));
  await leave(R);
  ok(!g2c.picOnly && !g2c.hand && g2c.help === 'visible', 'G2 bigger children: words and no hand: ' + JSON.stringify(g2c));
  // Market Counting's first move is a fruit, shown by the hand too
  await openGame(R, 'marketcount', true, 1); await R.page.waitForSelector('.mc-fruit'); await R.page.waitForTimeout(400);
  const g2d = await R.page.evaluate(() => !!document.querySelector('.gl-hand')); await leave(R);
  ok(g2d, 'G2 Market Counting shows the hand the first time');
  ok(!R.errors.length, R.errors.join('\n')); await R.ctx.close();

  // ---------- E3: bigger button text on a computer ----------
  const C = await open(b, { w: 1280, h: 800, touch: false, lang: 'en' }); await clear(C.page);
  await openGame(C, 'remembergarden', false, 1); await C.page.waitForSelector('.bt-repeat');
  const e3 = await C.page.evaluate(() => [...document.querySelectorAll('.gl-stage .btn')].map(b => ({ t: b.textContent.trim(), px: parseFloat(getComputedStyle(b).fontSize) })));
  await C.page.screenshot({ path: 'out/r79-learning/e3-computer.png' }); await leave(C);
  ok(e3.length >= 2 && e3.every(x => x.px >= 18 && x.px <= 20), 'E3 computer button text: ' + JSON.stringify(e3));
  ok(!C.errors.length, C.errors.join('\n')); await C.ctx.close();
  // and on a phone the buttons keep their size (the rule is for computers only)
  const Pp = await open(b, { w: 390, h: 844, touch: true, lang: 'en' }); await clear(Pp.page);
  await openGame(Pp, 'remembergarden', false, 1); await Pp.page.waitForSelector('.bt-repeat');
  const e3p = await Pp.page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.bt-repeat')).fontSize)); await leave(Pp);
  ok(e3p < 18, 'E3 phone text unchanged: ' + e3p); await Pp.ctx.close();

  // ---------- the microphone in Say It, Find It ----------
  // no speech recognition: no button, tapping works (the game matrix above played every level by tapping)
  const N = await open(b, { w: 390, h: 844, touch: true, lang: 'en', pre: () => { for (const k of ['SpeechRecognition', 'webkitSpeechRecognition']) { try { delete window[k]; } catch (e) { } Object.defineProperty(window, k, { value: undefined, configurable: true }); } } });
  await clear(N.page); await openGame(N, 'sayfind', false, 1); await N.page.waitForSelector('.sf-pic');
  const noMic = await N.page.evaluate(() => !!document.querySelector('.sf-mic')); await leave(N);
  ok(!noMic, 'no microphone button without speech recognition');
  ok(!N.errors.length, N.errors.join('\n')); await N.ctx.close();
  // a pretend recogniser: hears the target's word (counts as the right tap), then refuses (the button goes, tapping still works)
  const M = await open(b, { w: 390, h: 844, touch: true, lang: 'en', pre: () => {
    class FakeSR { start() { setTimeout(() => { const w = window.__heard; if (w === 'deny') this.onerror && this.onerror({ error: 'not-allowed' }); else this.onresult && this.onresult({ results: [[{ transcript: w }]] }); this.onend && this.onend(); }, 60); } stop() { } abort() { } }
    window.webkitSpeechRecognition = FakeSR; window.SpeechRecognition = FakeSR;
  } });
  await clear(M.page); await openGame(M, 'sayfind', false, 1); await M.page.waitForSelector('.sf-mic');
  const mic = await M.page.evaluate(async () => {
    const F = await import('/js/games/frame.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    while (!F.playWatch.ask) await wait(50);
    const btn = document.querySelector('.sf-mic'), size = btn.getBoundingClientRect();
    const target = F.playWatch.ask.els.find(F.playWatch.ask.check), word = target.getAttribute('aria-label');
    const dotsBefore = document.querySelectorAll('.gl-dots i.on').length;
    window.__heard = 'it is the ' + word; btn.click();
    for (let i = 0; i < 60 && document.querySelectorAll('.gl-dots i.on').length === dotsBefore; i++) await wait(100);
    const counted = document.querySelectorAll('.gl-dots i.on').length > dotsBefore;
    for (let i = 0; i < 40 && !document.querySelector('.sf-mic'); i++) await wait(100);
    window.__heard = 'deny'; document.querySelector('.sf-mic').click(); await wait(500);
    return { word, counted, size: Math.round(Math.min(size.width, size.height)), gone: !document.querySelector('.sf-mic'), help: document.querySelector('.gl-help').textContent };
  });
  ok(mic.counted && mic.size >= 44 && mic.gone && /microphone is off/i.test(mic.help), 'microphone: ' + JSON.stringify(mic));
  const rest = await M.page.evaluate(PLAY, { rightsOnly: true });
  ok(rest.won, 'tapping still finishes after the microphone was refused: ' + JSON.stringify(rest));
  await finishWin(M);
  ok(!M.errors.length, M.errors.join('\n')); await M.ctx.close();

  fs.writeFileSync('out/r79-learning/results.json', JSON.stringify({ rows, e1, e3, e4, i2, mig, won, book, g2, mic }, null, 1));
  return notes.join('; ') + '; E1 E3 E4 I1 I2 I4 G2 mic pass';
});
