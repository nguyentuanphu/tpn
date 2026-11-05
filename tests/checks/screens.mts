// Sparkle Valley checks: Simple screen, hub, HUD and layout on phone, tablet and computer.
// Run them through tests/run.mts (node run.mts <check>) or tests/suite.mts, not on their own.
// Moved unchanged from tests/run.mts (v1.07 split-tests, 2 Nov 2026 AEDT); see tests/checks/README.md.
import { fs, os, open, clear, start, openAllGamesFixture, only, want, pause, check, ok, b } from './shared.mts';

await check('spill', async () => {
  const bad = [];
  for (const lang of ['en', 'vi']) for (const [w, h, touch] of [[320, 640, true], [375, 812, true], [1024, 768, false]]) {
    const P = await open(b, { w, h, touch, lang }); await clear(P.page);
    // the keyboard badges poke out of the button corners on purpose
    await P.page.addStyleTag({ content: '.kb, .padkey { display: none !important; }' });
    const off = s => P.page.evaluate(sel => [...document.querySelectorAll(sel)].filter(e => e.offsetParent && (e.scrollWidth > e.clientWidth + 2 || e.getBoundingClientRect().right > innerWidth + 1 || e.getBoundingClientRect().left < -1)).map(e => (e.className || e.tagName) + ':' + e.textContent.trim().slice(0, 20)), s);
    bad.push(...(await off('.hud button, .hud .chip, .hud .q-text')).map(x => `${lang}${w} hud ${x}`));
    await P.page.evaluate(() => __sv.openPad(0, 'map')); await P.page.waitForTimeout(500);
    for (const t of ['map', 'bag', 'log', 'album', 'passport', 'games', 'cam', 'friend']) { await P.page.evaluate(t => document.querySelector(`.pad-tabs [data-t="${t}"]`)?.click(), t); await P.page.waitForTimeout(250); bad.push(...(await off('.pad-tabs small, .pad-body h3, .pad-body .btn')).map(x => `${lang}${w} pad-${t} ${x}`)); }
    await clear(P.page); await P.page.evaluate(() => __sv.openGamesHub(0)); await P.page.waitForTimeout(500);
    bad.push(...(await off('.hub .hcard b, .hub .talecard small, .hub h3')).map(x => `${lang}${w} hub ${x}`));
    await P.ctx.close();
  }
  ok(!bad.length, bad.slice(0, 8).join(' · '));
});

await check('language', async () => {
  const P = await open(b, { w: 1024, h: 768, lang: 'vi' }); await clear(P.page);
  const txt = async () => P.page.evaluate(() => document.body.innerText);
  let all = await txt();
  await P.page.evaluate(() => __sv.openGamesHub(0)); await P.page.waitForTimeout(500); all += await txt();
  const leftovers = ['Games', ' Map', ' Bag', 'Talk', 'Fairy tales', 'Tap a picture', 'In the cities', 'Run', 'Jump', 'Welcome'].filter(w => all.includes(w));
  await P.ctx.close();
  ok(!leftovers.length, 'English left in Vietnamese mode: ' + leftovers.join(', '));
});

await check('two-players', async () => {
  const P = await open(b, { w: 1280, h: 800, mode: 'split' }); await clear(P.page);
  const r = await P.page.evaluate(() => ({ heroes: __sv.heroes.length, huds: document.querySelectorAll('.hud').length, pets: __sv.pets.forHero(__sv.heroes[1]).length }));
  await P.page.screenshot({ path: 'out/two-players.png' }); await P.ctx.close();
  ok(r.heroes === 2 && r.huds === 2 && r.pets >= 1, JSON.stringify(r));
});

// Two players face to face (owner, round R): on a touch screen the far half (and the far player's controls and
// windows) are turned half a turn so each child at each end sees their half the right way up
await check('facetoface', async () => {
  const out = [];
  for (const [w, h] of [[820, 1180], [1180, 820]]) {
    const P = await open(b, { w, h, touch: true, mode: 'split' }); await clear(P.page);
    const r = await P.page.evaluate(async () => {
      const cv = __sv.renderer.domElement, I = await import('/js/input.js'), q = __sv.rects();
      const ev = (type, x, y, id) => cv.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: id, pointerType: 'touch', bubbles: true }));
      const far = q[1], near = q[0];
      ev('pointerdown', far.x + far.w - 60, far.y + far.h / 2, 7); ev('pointermove', far.x + far.w - 60, far.y + far.h / 2 + 40, 7); ev('pointermove', far.x + far.w - 60, far.y + far.h / 2 + 60, 7);
      const farMz = I.pads[1].mz; ev('pointerup', 0, 0, 7);
      ev('pointerdown', near.x + 60, near.y + near.h / 2, 8); ev('pointermove', near.x + 60, near.y + near.h / 2 - 40, 8); ev('pointermove', near.x + 60, near.y + near.h / 2 - 60, 8);
      const nearMz = I.pads[0].mz; ev('pointerup', 0, 0, 8);
      __sv.lastPlayer = 1; __sv.openPad(1, 'map'); await new Promise(r => setTimeout(r, 400));
      const turned = !!document.querySelector('.facewrap > *'); document.querySelectorAll('.modal').forEach(m => m.remove());
      return { rot: q.map(x => x.rot), farTop: far.y === 0, hudFar: __sv.huds[1].root.classList.contains('far'), farMz, nearMz, turned };
    });
    if (!(r.rot[0] === 0 && r.rot[1] === 180 && r.farTop && r.hudFar && r.farMz > .9 && r.nearMz > .9 && r.turned)) out.push(`${w}x${h} ${JSON.stringify(r)}`);
    if (P.errors.length) out.push(`${w}x${h}: ${P.errors.join(' | ')}`);
    await P.page.screenshot({ path: `out/facetoface-${w}.png` }); await P.ctx.close();
  }
  // the children choose: on "Who's playing?" with two players, and with the switch on the line while playing
  { const P = await open(b, { w: 820, h: 1180, touch: true, play: false });
    await P.page.click('.screen.title .press', { force: true }); await P.page.waitForSelector('.screen.who');
    await P.page.click('.modes button[data-m=split]');
    const views = await P.page.$$eval('.who .views button', bs => bs.map(x => x.dataset.v + (x.classList.contains('on') ? '*' : '')).join(','));
    await P.page.click('.who .views button[data-v=side]');
    const picked = await P.page.evaluate(async () => (await import('/js/state.js')).settings.twoView);
    if (views !== 'face*,side' || picked !== 'side') out.push(`who screen: ${views} → ${picked}`);
    await P.ctx.close(); }
  { const P = await open(b, { w: 820, h: 1180, touch: true, mode: 'split' }); await clear(P.page);
    const before = await P.page.evaluate(() => __sv.rects()[1].rot);
    await P.page.click('#split .viewsw'); await P.page.waitForTimeout(200);
    const after = await P.page.evaluate(() => __sv.rects().map(x => x.rot).join(','));
    await P.page.click('#split .viewsw'); await P.page.waitForTimeout(200);
    const back = await P.page.evaluate(() => __sv.rects()[1].rot);
    if (!(before === 180 && after === '0,0' && back === 180)) out.push(`switch: ${before} → ${after} → ${back}`);
    await P.ctx.close(); }
  // a computer keeps both halves the same way round, side by side
  const D = await open(b, { w: 1280, h: 800, mode: 'split' }); await clear(D.page);
  const side = await D.page.evaluate(() => __sv.rects().map(x => x.rot).join(',') + ' ' + __sv.rects()[1].x); await D.ctx.close();
  if (side !== '0,0 640') out.push('computer: ' + side);
  ok(!out.length, out.join(' · '));
  return 'tablet tall and wide: the far half, its buttons, joystick and windows face the far child; a computer stays side by side; children choose face to face or side by side on Who\'s playing? and with the switch on the line';
});

await check('features', async () => {
  const P = await open(b, { w: 1024, h: 768 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], W = await import('/js/world.js'), R = await import('/js/regions.js'), { farm } = await import('/js/state.js');
    const o = {};
    o.cities = W.CITIES.length; o.roads = W.ROADS.length; o.landmarks = R.LANDMARKS.length;
    o.kiosks = G.interactables.filter(i => /^v_k_/.test(i.id)).length;
    o.hosts = ['puppets', 'dongho', 'dragonfire', 'traffic', 'kite', 'ferries', 'tram', 'koala'].filter(g => G.gameSpot(g)).length;
    o.house8 = !!G.interactables.find(i => i.id === 'house8');
    o.tales = G.TALES.length; o.vnTales = G.TALES.filter(t => t.flag === '🇻🇳').length;
    // the Dragon Bridge deck is walkable over the river
    { const D = W.DRAGON, u = (D.a0 + D.a1) / 2, [dx, dz] = D.axis === 'z' ? [D.c, u] : [u, D.c]; // (round T: the middle of the Dragon Bridge, from the map)
      o.deck = +G.world.groundAt(dx, dz, 20).toFixed(1); o.river = +W.heightAt(dx, dz).toFixed(1); }
    // pets: adopt, send to the yard, bring back
    farm.coins = 500; window.confirm = () => true;
    G.pets.openAdopt(h); document.querySelector('[data-ad="kitty"]').click(); document.querySelectorAll('.modal').forEach(m => m.remove()); G.paused = false;
    G.pets.openAdopt(h); document.querySelector('[data-bye="0"]').click(); document.querySelector('[data-take="0"]').click(); document.querySelectorAll('.modal').forEach(m => m.remove()); G.paused = false;
    o.pets = h.profile.pets.map(p => p.kind).sort().join('+'); o.petsVisible = G.pets.forHero(h).every(L => L.obj.visible);
    // a conversation closes by itself when you walk away
    G.dialog('Test', [['Hello there', 'Chào']]); h.place(h.pos.x + 20, h.pos.z);
    return o;
  });
  await P.page.waitForTimeout(800);
  r.dialogClosed = await P.page.evaluate(() => !document.querySelector('.dialog:not(.out)'));
  // keyboard: M opens the map, digits switch tabs, Escape closes; +/- zoom
  await clear(P.page); await P.page.keyboard.press('KeyM'); await P.page.waitForTimeout(400);
  r.keyMap = await P.page.evaluate(() => !!document.querySelector('.pad'));
  await P.page.keyboard.press('Digit2'); await P.page.waitForTimeout(300);
  r.keyTab = await P.page.evaluate(() => document.querySelector('.pad-tabs .on')?.dataset.t);
  await P.page.keyboard.press('Escape'); await P.page.waitForTimeout(300);
  // (the keys only work once the window has gone and the game runs again: wait for that, not a fixed time)
  await P.page.waitForFunction(() => !document.querySelector('.modal, .storybook, .vc-pop') && !__sv.paused, null, { timeout: 15000 }).catch(() => { });
  const z0 = await P.page.evaluate(() => __sv.heroes[0].zoom || 1); await P.page.keyboard.press('Minus'); r.zoom = (await P.page.evaluate(() => __sv.heroes[0].zoom)) > z0;
  // a fairy tale from the Games hub: fly to the storyteller, the theatre opens
  await clear(P.page); await P.page.evaluate(() => __sv.openGamesHub(0)); await P.page.waitForTimeout(400);
  await P.page.evaluate(() => { document.querySelector('.hub [data-tab="tales"]').click(); document.querySelector('.hub [data-tale="tamcam"]').click(); }); await P.page.waitForTimeout(3500);
  r.theatre = await P.page.evaluate(() => !!document.querySelector('.theatre'));
  await P.page.evaluate(() => document.querySelector('.th-x')?.click());
  // tapping a game card flies to its host
  await clear(P.page); await P.page.evaluate(() => __sv.openGamesHub(0)); await P.page.waitForTimeout(400);
  await P.page.evaluate(() => { document.querySelector('.hub [data-tab="places"]').click(); document.querySelector('[data-play="traffic"]').click(); }); await P.page.waitForTimeout(3500);
  r.flewToHost = await P.page.evaluate(() => { const it = __sv.gameSpot('traffic'), h = __sv.heroes[0]; return Math.hypot(it.x - h.pos.x, it.z - h.pos.z) < 6 && !!document.querySelector('.gl'); });
  // folk-game friends chat: a bubble shows within a few seconds near the playground
  await P.page.evaluate(async () => { document.querySelector('.gl .gl-x')?.click(); const PG = (await import('/js/world.js')).PLAYGROUND; __sv.heroes[0].place(PG.x, PG.z + 4); });
  let seen = false; for (let k = 0; k < 14 && !seen; k++) { await P.page.waitForTimeout(500); seen = await P.page.evaluate(() => { let v = false; __sv.scene.traverse(o => { if (o.isSprite && o.renderOrder === 5 && o.visible) v = true; }); return v; }); }
  r.chatter = seen;
  const errs = P.errors.slice(); await P.ctx.close();
  const fails = [];
  // (round T3: Bà Rịa–Vũng Tàu is the eighth city, Anh Hai's kites its host; two more kiosks)
  if (r.cities !== 8) fails.push('cities'); if (r.kiosks < 28) fails.push('kiosks'); if (r.hosts !== 8) fails.push('hosts'); if (r.landmarks < 47) fails.push('landmarks');
  if (!r.house8) fails.push('house8'); if (r.tales < 32 || r.vnTales < 18) fails.push('tales'); if (!(r.deck > r.river + 3)) fails.push('dragon deck');
  if (r.pets !== 'kitty+puppy' && r.pets !== 'puppy+kitty' && r.pets.split('+').length !== 2) fails.push('pets ' + r.pets); if (!r.petsVisible) fails.push('pets hidden');
  for (const k of ['dialogClosed', 'keyMap', 'zoom', 'theatre', 'flewToHost', 'chatter']) if (!r[k]) fails.push(k);
  if (r.keyTab !== 'bag') fails.push('keyTab');
  if (errs.length) fails.push(errs.join(' | '));
  ok(!fails.length, fails.join(', ') + ' ' + JSON.stringify(r));
  return JSON.stringify(r);
});

await check('contract', async () => {
  const P = await open(b, { w: 1280, h: 800 }); await clear(P.page);
  const ui = await P.page.evaluate(async () => {
    const hud = [...document.querySelectorAll('.hud button')].map(b => b.className.split(' ')[0] + (b.className.split(' ')[1] ? '.' + b.className.split(' ')[1] : ''));
    __sv.openPad(0, 'map'); await new Promise(r => setTimeout(r, 300));
    const tabs = [...document.querySelectorAll('.pad-tabs button')].map(b => b.dataset.t);
    document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false;
    __sv.openGamesHub(0); await new Promise(r => setTimeout(r, 300));
    const hub = [...document.querySelectorAll('.hub h3')].map(h => h.textContent.slice(0, 2));
    return { hud, tabs, hubSections: hub.length };
  });
  await P.ctx.close();
  const file = 'ui-contract.json';
  if (process.argv.includes('--update-contract') || !fs.existsSync(file)) { fs.writeFileSync(file, JSON.stringify(ui, null, 1)); return 'recorded'; }
  const was = JSON.parse(fs.readFileSync(file, 'utf8'));
  ok(JSON.stringify(was) === JSON.stringify(ui), 'UI structure changed: ' + JSON.stringify(ui));
});

await check('phone', async () => {
  // every main screen opened on a desktop, a phone and a tablet side by side (rule UI-006, owner round P: always check
  // all three): nothing spills off the side, every button (close, play, next…) is fully on the screen, tab names are
  // never broken in the middle of a word, windows dim the game without blurring it, and nothing goes wrong
  const D = await open(b, { w: 1180, h: 760 }), M = await open(b, { w: 390, h: 760, touch: true, lang: 'vi' }), Tb = await open(b, { w: 820, h: 1180, touch: true });
  const SCREENS = [
    ['games hub', () => __sv.openGamesHub(0)], ['map', () => __sv.openPad(0, 'map')], ['bag', () => __sv.openPad(0, 'bag')], ['friends', () => __sv.openPad(0, 'friend')],
    ['quick settings', () => __sv.openQuick(0)], ['wardrobe', () => __sv.openWardrobe(0)],
    ['how to play', async () => { (await import('/js/howto.js')).openHowTo('oanquan', {}); }],
    ['tale', async () => { (await import('/js/tales.js')).openTheatre((await import('/js/learn.js')).TALES[0], {}); }],
    ['a game', () => { __sv.playGame(0, 'caro', 'replay'); }],
    ['dialog', () => { __sv.dialog('Bà Năm', [['Hello! Shall we play?', 'Chào cháu! Chơi nhé?']], [['▶ Play!', '▶ Chơi!'], ['👋 Later', '👋 Để sau']]); }]
  ];
  const bad = [];
  for (const P of [D, M, Tb]) await clear(P.page);
  for (const [name, fn] of SCREENS) {
    for (const [P, tag] of [[D, 'desktop'], [M, 'phone'], [Tb, 'tablet']]) {
      await P.page.evaluate(`(${fn.toString()})()`); await P.page.waitForTimeout(1400);
      const r = await P.page.evaluate(() => {
        const W = innerWidth, H = innerHeight, out = [];
        if (document.scrollingElement.scrollWidth > W + 1) out.push('page scrolls sideways (' + document.scrollingElement.scrollWidth + ' > ' + W + ')');
        const top = document.querySelector('.wardrobe, .hub, .pad, .howto, .theatre, .gl, .dialog:not(.out), .modal');
        if (top) for (const btn of top.querySelectorAll('button')) { const b = btn.getBoundingClientRect(), cs = getComputedStyle(btn); if (!b.width || cs.visibility === 'hidden' || btn.closest('[hidden]')) continue;
          if (/^(x|th-x|ht-x|gl-x|dch|ht-play|th-next|gl-next)$/.test(btn.className.split(' ')[0]) && (b.left < -1 || b.right > W + 1 || b.top < -1 || b.bottom > H + 1)) out.push(`button "${(btn.textContent || btn.getAttribute('aria-label') || btn.className).trim().slice(0, 20)}" off screen (${[b.left, b.top, b.right, b.bottom].map(Math.round)} in ${W}×${H}; on top: ${[...document.querySelectorAll('.dialog, .modal, .reward, .hub, .pad, .gl, .theatre, .songs')].map(e => e.className.split(' ').slice(0, 2).join('.')).join(',')})`); }
        for (const t of document.querySelectorAll('.pad-tabs small')) { const lh = parseFloat(getComputedStyle(t).lineHeight) || 13; if (t.getClientRects().length && t.getBoundingClientRect().height > lh * 1.6 + 2) out.push(`tab name "${t.firstChild && t.firstChild.textContent}" broken over lines`); }
        const md = document.querySelector('.modal'); if (md && /blur/.test(getComputedStyle(md).backdropFilter || '')) out.push('the window blurs the game behind it');
        const vs = [...document.querySelectorAll('.qsettings .seg.vstyle button')].map(b => b.getBoundingClientRect()).filter(b => b.width > 0);
        if (vs.length === 3 && (Math.max(...vs.map(b => b.top)) - Math.min(...vs.map(b => b.top)) > 4 || vs.some(b => b.height < 44))) out.push('voice style buttons wrapped or under 44px (' + JSON.stringify(vs.map(b => [Math.round(b.top), Math.round(b.height)])) + ')');
        return out;
      });
      r.forEach(x => bad.push(`${name} (${tag}): ${x}`));
      if (r.length) await P.page.screenshot({ path: `${os.tmpdir()}/sv-phone-${name.replace(/\W+/g, '-')}-${tag}.png` }).catch(() => { });
      await P.page.evaluate(() => { document.querySelectorAll('.modal, .hub, .pad, .howto, .theatre, .gl, .dialog, .storybook, .vc-pop, .wardrobe').forEach(e => e.remove()); __sv.paused = false; __sv.closeUp = null; });
    }
  }
  // (Online's request, 11 Oct) a friend's row: the Join button never lies over the friend's status, and every button is
  // 44 px or more, on the computer, the phone and the tablet
  for (const [tag, Q] of [['desktop', D], ['phone', M], ['tablet', Tb]]) {
    const fr = await Q.page.evaluate(async () => {
      const { settings } = await import('/js/state.js'), { Net } = await import('/js/net.js');
      settings.online = true; settings.friendsOn = true; settings.lang = 'vi'; settings.friends = [{ code: 'KIWI-2468', name: 'Bé Bin Nguyễn' }];   // (as reported: Vietnamese, a long status)
      Net.friends.status['KIWI-2468'] = { online: true, seen: Date.now(), name: 'Bé Bin Nguyễn', room: 'ROOM42', where: 'Thành phố Hồ Chí Minh' };
      const box = document.createElement('div'); box.className = 'modal pad'; box.innerHTML = '<div class="card"><div class="tbody"></div></div>'; document.body.appendChild(box);
      const body = box.querySelector('.tbody'); __sv.drawOnlinePanel(body, () => { }); await new Promise(r => setTimeout(r, 200));
      const row = body.querySelector('.flist .frow'), st = row.querySelector('.fst').getBoundingClientRect(), btns = [...row.querySelectorAll('.btn')].map(e => e.getBoundingClientRect());
      const out = { join: !!row.querySelector('[data-joinf]'), over: btns.filter(q => st.left < q.right && q.left < st.right && st.top < q.bottom && q.top < st.bottom).length, small: btns.filter(q => q.height < 44).length };
      box.remove(); return out;
    });
    if (!fr.join || fr.over || fr.small) bad.push(`${tag}: friends row: Join shown ${fr.join}, buttons over the status ${fr.over}, under 44 px ${fr.small}`);
  }
  const errs = D.errors.concat(M.errors, Tb.errors); await D.ctx.close(); await M.ctx.close(); await Tb.ctx.close();
  ok(!bad.length && !errs.length, JSON.stringify({ bad, errs }));
  return `${SCREENS.length} screens checked on desktop, phone and tablet; a friend's Join button clear of the status`;
});

await check('hubmap', async () => {
  // (round R, owner: "rearrange the games menu so it is more logical; also the map and its destinations") the Play hub:
  // every game in exactly one tab, grouped by kind; the Pad map: each country north to south, landmarks under their real place
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const ui = await import('/js/ui.js'); ui.openGamesHub(__sv, 0); await new Promise(r => setTimeout(r, 400));
    const seen = {}; for (const t of [...document.querySelectorAll('.hubtabs [data-tab]')].map(b => b.dataset.tab)) { document.querySelector(`.hubtabs [data-tab="${t}"]`).click(); await new Promise(r => setTimeout(r, 100)); document.querySelectorAll('.hubbody [data-play]').forEach(b => { seen[b.dataset.play] = (seen[b.dataset.play] || 0) + 1; }); }
    document.querySelectorAll('.modal').forEach(e => e.remove()); __sv.openPad(0, 'map'); await new Promise(r => setTimeout(r, 600));
    document.querySelector('.mapchips [data-g="vn"]').click(); await new Promise(r => setTimeout(r, 200));
    // (owner, bug #28, 11 Oct) a row of city buttons, north to south; the list shows the chosen city's places only
    const cities = [...document.querySelectorAll('.mapcities button')].map(b => b.innerText.trim());
    const placesOf = async name => { const c = [...document.querySelectorAll('.mapcities button')].find(b => b.innerText.includes(name)); if (!c) return null;
      c.click(); await new Promise(r => setTimeout(r, 200)); return [...document.querySelectorAll('.mapplaces .qbtn')].map(b => b.innerText.trim()); };
    const hanoi = (await placesOf('Hà Nội')) || (await placesOf('Hanoi')), danang = await placesOf('Đà Nẵng');
    // (v1.08b games, owner 3 Nov 2026 AEDT: one home per game) no link tiles in the Play hub, and on the Simple screen
    // each game is one stop across Học vui and Vui chơi together (a stop or a locked stop), never two
    const links = document.querySelectorAll('[data-link]').length;
    document.querySelectorAll('.modal').forEach(e => e.remove()); __sv.paused = false;
    const simple = {}; for (const t of ['learn', 'fun']) { __sv.simple.show(t); __sv.simple.openGroup(t, null); const v = __sv.simple.view; for (const id of v.stops.concat(v.locks)) simple[id] = (simple[id] || 0) + 1; }
    __sv.simple.hide();
    return { games: Object.keys(seen).length, dup: Object.entries(seen).filter(([, n]) => n > 1).map(([k]) => k), links, simpleDup: Object.entries(simple).filter(([, n]) => n > 1).map(([k]) => k), simple: Object.keys(simple).length, cities, hanoi, danang };
  });
  ok(!r.dup.length, 'games in two tabs: ' + r.dup.join(', ')); ok(r.games >= 60, 'games in the hub: ' + r.games);
  ok(!r.links, 'link tiles in the Play hub: ' + r.links);
  ok(!r.simpleDup.length, 'games twice on the Simple screen: ' + r.simpleDup.join(', '));
  const at = n => r.cities.findIndex(x => x.includes(n)), hn = at('Hà Nội') >= 0 ? at('Hà Nội') : at('Hanoi'), dn = at('Đà Nẵng');
  ok(hn >= 0 && dn > hn, 'map: the Vietnam cities are not north to south (Hà Nội before Đà Nẵng): ' + r.cities.join(' | '));
  ok(r.hanoi && r.hanoi.some(x => x.includes('Hạ Long')), 'map: Hạ Long should be under Hà Nội: ' + (r.hanoi || []).join(' | '));
  ok(r.danang && r.danang.some(x => x.includes('Huế')) && !r.hanoi.some(x => x.includes('Huế')), 'map: Huế should be under Đà Nẵng only: ' + (r.danang || []).join(' | '));
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  return `${r.games} games, each in one tab, no link tiles; ${r.simple} games once each on the Simple screen; the map's Vietnam cities run north to south, each with its landmarks (${r.cities.length} cities)`;
});

await check('gameplace', async () => {
  // (v1.08b games, owner's plan 3 Nov 2026 AEDT, docs/plans/links-rollout-install.md part 4) every switched-on game has a
  // place in the valley (its 📍 button walks there) and a host with a spoken line in English and Vietnamese; a host says
  // once, as the child walks past, that a game at their place has just opened, and never again for that game
  const P = await openAllGamesFixture(b, { w: 1180, h: 820 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const { GAMES } = await import('/js/games/frame.js'), A = await import('/js/content/activities.js'), GP = await import('/js/content/gameplace.js');
    const on = Object.keys(GAMES).filter(id => !A.gameInfo(id).hidden), none = on.filter(id => !__sv.gameSpot(id));
    const noHost = [...new Set(on.map(id => A.gameInfo(id).area))].filter(a => !GP.AREA_PLACE[a] || !GP.AREA_PLACE[a].line.every(x => x && x.length > 10));
    const missingSpot = Object.entries(GP.AREA_PLACE).filter(([, a]) => !__sv.interactables.some(it => it.id === a.spot)).map(([k]) => k);
    // the news: a game known as not yet seen, the child next to its place, then the host's line once
    const h = __sv.heroes[0], p = h.profile; delete p.hostNews; document.querySelectorAll('.modal').forEach(e => e.remove()); __sv.paused = false; await new Promise(r => setTimeout(r, 1100));
    __sv.hostNews(h); const seeded = !!p.hostNews && Object.keys(p.hostNews).length;
    const id = 'counting', it = __sv.gameSpot(id); delete p.hostNews[id];
    h.pos.x = it.x + 1; h.pos.z = it.z + 1; await new Promise(r => setTimeout(r, 1100));
    __sv.hostNews(h); const toast1 = [...document.querySelectorAll('.toast, .htoast, [class*=toast]')].map(e => e.textContent).join('|');
    const marked = !!p.hostNews[id];
    await new Promise(r => setTimeout(r, 1100)); const n1 = Object.keys(p.hostNews).length; __sv.hostNews(h); const n2 = Object.keys(p.hostNews).length;
    return { on: on.length, none, noHost, missingSpot, seeded, marked, again: n1 === n2, toast: /Count|Đếm/.test(toast1) };
  });
  ok(!r.none.length, 'switched-on games with no place in the valley: ' + r.none.join(', '));
  ok(!r.noHost.length, 'areas without a host and line: ' + r.noHost.join(', '));
  ok(!r.missingSpot.length, 'area places that do not stand in the valley: ' + r.missingSpot.join(', '));
  ok(r.seeded > 20 && r.marked && r.again, 'host news: ' + JSON.stringify(r));
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  return `${r.on} switched-on games, each with a place and a host; ${r.seeded} games already open counted as known; a host told about a new game once (name on screen: ${r.toast})`;
});

await check('padmap', async () => {
  // (round T4b) the Pad map is drawn from the map data: every place's name on it, names never overlapping at 390, 1180
  // and 1366 px wide; clouds over the places not visited yet, lifting once with a puff after a visit
  const out = [];
  for (const [w, h, touch] of [[390, 844, true], [1180, 760, false], [1366, 768, false]]) {
    const P = await open(b, { w, h, touch }); await clear(P.page);
    const r = await P.page.evaluate(async () => {
      __sv.openPad(0, 'map'); await new Promise(r => setTimeout(r, 500));
      const cv = document.querySelector('canvas.bigmap'), L = cv.labels || [], names = new Set(L.map(l => l.name));
      const missing = __sv.PLACES.map(p => p.name()).filter(n => !names.has(n));
      const hit = (a, q) => a.x < q.x + q.w && q.x < a.x + a.w && a.y < q.y + q.h && q.y < a.y + a.h, over = [];
      L.forEach((a, i) => L.slice(i + 1).forEach(q => { if (hit(a, q)) over.push(a.name + ' / ' + q.name); }));
      const clouds = cv.clouds.slice(), pic = !cv.toDataURL().startsWith('data:,');
      // visit the first clouded place, then open the map again: its cloud puffs away, once
      const h = __sv.heroes[0], c = clouds[0], W = await import('/js/world.js');
      h.profile.visited = h.profile.visited || {}; h.profile.visited[c.region] = true;
      document.querySelectorAll('.modal').forEach(e => e.remove()); __sv.paused = false; __sv.openPad(0, 'map'); await new Promise(r => setTimeout(r, 200));
      const after = document.querySelector('canvas.bigmap').clouds, puff = document.querySelectorAll('.mapcloud.puff').length;
      document.querySelectorAll('.modal').forEach(e => e.remove()); __sv.paused = false; __sv.openPad(0, 'map'); await new Promise(r => setTimeout(r, 200));
      const again = document.querySelectorAll('.mapcloud.puff').length;
      return { n: L.length, missing, over, clouds: clouds.length, region: c.region, still: after.some(o => o.region === c.region), puff, again, pic };
    });
    ok(r.pic && !r.missing.length, `${w}px: places missing from the drawn map: ${r.missing.join(', ')}`);
    ok(!r.over.length, `${w}px: map names overlap: ${r.over.join('; ')}`);
    ok(r.clouds > 0 && !r.still && r.puff > 0 && !r.again, `${w}px: clouds ${r.clouds}, after visiting ${r.region}: still clouded ${r.still}, puffs ${r.puff}, puffs again ${r.again}`);
    ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
    out.push(`${w}px ${r.n} names, ${r.clouds} clouds`);
  }
  return 'drawn from the map data: ' + out.join('; ') + '; a cloud lifts with one puff after a visit';
});

await check('twoplayerpick', async () => {
  // (owner, 1 Nov 2026 AEDT) Caro is for two: with two friends in the room, Play together asks who to play with and invites
  // that friend (it used to invite the first one); with one friend it invites straight away
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const { Net } = await import('/js/net.js'), G = __sv, wait = ms => new Promise(r => setTimeout(r, ms)), sent = [], inv = G.inviteGame, saved = Net.remotes;
    G.inviteGame = (g, to) => { sent.push([g, to]); }; Net.remotes = { aa: { name: 'Bin' }, bb: { name: 'Lan' } };
    try {
      G.openPlayTogether(); await wait(200); document.querySelector('.playtogether [data-g="caro"]').click(); await wait(400);
      const d = document.querySelector('.dialog'), choices = d ? [...d.querySelectorAll('.dch')].map(x => x.textContent.trim()) : [];
      const lan = d && [...d.querySelectorAll('.dch')].find(x => /Lan/.test(x.textContent)); lan?.click(); await wait(300);
      Net.remotes = { aa: { name: 'Bin' } }; G.openPlayTogether(); await wait(200); document.querySelector('.playtogether [data-g="caro"]').click(); await wait(300);
      return { choices, sent, dialogAfter: !!document.querySelector('.dialog') };
    } finally { G.inviteGame = inv; Net.remotes = saved; }
  });
  ok(r.choices.length === 2 && JSON.stringify(r.sent) === JSON.stringify([['caro', 'bb'], ['caro', 'aa']]) && !r.dialogAfter, JSON.stringify(r));
  await P.ctx.close();
  return 'two friends: "Play with whom?" lists both and invites the one chosen; one friend: invited straight away';
});

await check('capturefreeze', async () => {
  // (issue #745, a 3.0 s freeze on an Android tablet 1600x960 in "Con Gì Kêu Thế?", 31 Oct 2026 AEDT: the tester tool's
  // automatic report of a line with no recording copied the screen while the child played; the copy of the page ran as
  // one block of ~2 MB of styles and no frame was drawn until it ended, so the child's taps on the play button piled up)
  // the copy of the screen now yields to the browser and carries only the styles it needs: while a report's picture is
  // made over the open game, the frames keep coming (the longest gap stays well under the 2 s a tester calls a freeze)
  const P = await open(b, { w: 1600, h: 960, touch: true, lang: 'vi' }); await clear(P.page);
  await P.page.evaluate(() => { __sv.heroes[0].profile.age = 'little'; __sv.playGame(0, 'animalsounds', 'replay'); });
  await P.page.waitForSelector('.gl .choice', { timeout: 30000 }); await P.page.waitForTimeout(2500);
  const r = await P.page.evaluate(async () => {
    let last = performance.now(), max = 0, run = true; const tick = t => { max = Math.max(max, t - last); last = t; if (run) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    await new Promise(r => setTimeout(r, 300)); max = 0;
    const M = await import('/js/screencapture.js'), t0 = performance.now(), shot = await M.captureScreen(__sv.renderer.domElement), took = performance.now() - t0;
    await new Promise(r => setTimeout(r, 100)); run = false;
    return { nodes: document.querySelectorAll('.gl *').length, took: Math.round(took), gap: Math.round(max), jpeg: /^data:image\/jpeg;base64,/.test(shot) && shot.length > 3000, frames: document.querySelectorAll('iframe').length };
  });
  const errs = P.errors; await P.ctx.close(); const bad = [];
  if (!r.jpeg) bad.push('no picture was made');
  if (r.gap > 600) bad.push(`the game stopped drawing for ${r.gap} ms while the report's picture was made (${r.took} ms in all, ${r.nodes} nodes in the game)`);
  if (r.frames) bad.push('the empty frame used for default styles was left in the page');
  if (errs.length) bad.push(...errs.slice(0, 2));
  if (bad.length) throw new Error(bad.join('; '));
  return `a report's picture over "Con Gì Kêu Thế?" at 1600x960: ${r.took} ms in all, the longest pause between frames ${r.gap} ms (was about 1.3 s here and 3.0 s on the tester's tablet)`;
});

await check('dialogtap', async () => {
  // (round R, owner: "there shouldn't be any repeats, the child just taps the speech box as OK") a speech box has no
  // Hear-again or OK buttons for any age; a tap on the box goes on, and the last tap closes it
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  const r = [];
  for (const age of ['little', 'big']) {
    await P.page.evaluate(age => { __sv.heroes.forEach(h => { h.profile.age = age; }); __sv.dialog('Bà Năm', [['Hello!', 'Chào con!'], ['Shall we play?', 'Chơi nhé?']]); }, age);
    await P.page.waitForSelector('.dialog:not(.out)');
    const btns = await P.page.evaluate(() => [...document.querySelectorAll('.dialog:not(.out) button')].filter(e => !e.matches('.dask, .dch')).map(e => e.className));
    ok(!btns.length, `${age}: extra buttons ${btns.join(', ')}`);
    await P.page.click('.dialog:not(.out) .dtext'); await P.page.waitForTimeout(150);
    ok(await P.page.evaluate(() => document.querySelector('.dialog:not(.out) .dtext').textContent.includes('play')), `${age}: a tap did not go on`);
    await P.page.click('.dialog:not(.out) .dtext'); await P.page.waitForTimeout(400);
    ok(await P.page.evaluate(() => !document.querySelector('.dialog:not(.out)')), `${age}: the last tap did not close it`);
    r.push(age);
  }
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  return 'no repeat or OK buttons for under-5s or older children; tapping the box goes on and closes it';
});

await check('ages', async () => {
  // two age groups split at 5 (owner, round 30): under-5s get bigger answer buttons, and the right answer wiggles after
  // 10 s or two misses; 5 and up get no hint. Every game is open to both groups.
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const F = await import('/js/games/frame.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    const run = async little => {
      const els = [1, 2, 3].map(n => { const e = document.createElement('button'); e.className = 'choice'; e._v = n; document.body.appendChild(e); return e; });
      const api = { little, closed: false, right() { }, wrong() { } };
      const done = F.untilRight(api, els, e => e._v === 3);
      const hintAt = [];
      for (const k of [0, 1]) { els[k].click(); await wait(50); hintAt.push(els[2].classList.contains('hint')); }
      els[2].click(); await done; const after = els[2].classList.contains('hint'); els.forEach(e => e.remove());
      return { hintAt, after };
    };
    const small = await run(true), big = await run(false);
    const g = F.openGame('colors', { players: [{ name: 'A', levels: {} }], little: true }); await wait(300);
    const layer = !!document.querySelector('.gl.little'); document.querySelector('.gl-x').click(); await g;
    return { small, big, layer, hintMs: F.HINT_AFTER };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.small.hintAt[0] && r.small.hintAt[1] && !r.small.after && !r.big.hintAt.some(Boolean) && r.layer && r.hintMs === 10000 && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return 'under 5: big buttons, the right answer wiggles after two misses (or 10 s), and stops once tapped; 5 and up: no hint';
});

await check('simple', async () => {
  // the Simple screen (round I, js/simple.js): an under-5 starts on it; any game or story is one tap away (A11Y-003);
  // when the game ends the path comes back; 🌳 Valley switches to the 3D world and is remembered; a big kid starts in
  // the valley and can open it from the dock; two players on one device never see it
  const P = await open(b, { w: 390, h: 844, touch: true, screen: null });
  await P.page.waitForSelector('.simple-screen:not([hidden]) .sp-catcard, .simple-screen:not([hidden]) .sp-stop', { timeout: 20000 });
  await P.page.evaluate(() => document.querySelectorAll('.dialog').forEach(d => d.remove()));
  const r = { start: true };
  // (owner, 24 Oct AEDT) Home opens the family website floating over this screen, not a new tab (from the Home Screen app
  // that started the whole game again); its Play button reads "Back to game" and closes it: the Simple screen is still here
  r.home = await P.page.evaluate(async () => {
    const wait = ms => new Promise(res => setTimeout(res, ms)), tabs = [], wo = window.open; window.open = (...a) => { tabs.push(String(a[0])); return null; };
    try {
      document.querySelector('.simple-screen .sp-home')?.click();
      let frame = null, label = null;
      for (let k = 0; k < 80 && !label?.textContent?.trim(); k++) { await wait(250); frame = document.querySelector('.modal.website iframe'); label = frame?.contentDocument?.querySelector('.play-label'); }
      const text = label ? label.textContent.trim() : '', embed = !!frame && /embed=1/.test(frame.getAttribute('src') || '');
      frame?.contentDocument?.querySelector('[data-action=play]')?.click(); await wait(800);
      return { tabs, embed, text, closed: !document.querySelector('.modal.website'), still: !!document.querySelector('.simple-screen:not([hidden])') };
    } finally { window.open = wo; }
  });
  // (Round V, owner 13 Oct: "one screen and scroll down, each has a title then games in roads with them, similar to the
  // Khám phá tab"; replaces Round U's cards) every section of the tab on one page: its title, then its own road; the page scrolls
  r.groupsFirst = await P.page.evaluate(() => { const v = __sv.simple.view, back = document.querySelector('.sp-back'), sc = document.querySelector('.sp-scroll'); return v.cat === null && v.cats.length > 3 && v.secs === v.cats.length && v.stops.length > 10 && back.hidden && document.querySelectorAll('.sp-discover').length === 1 && sc.scrollHeight > sc.clientHeight * 2; });
  r.section = await P.page.evaluate(() => { const secs = [...document.querySelectorAll('.sp-sec')], t = secs[0] && secs[0].querySelector('.sp-sectitle'), tr = t && t.getBoundingClientRect(), first = secs[0] && secs[0].querySelector('.sp-stop'), fr = first && first.getBoundingClientRect();
    return { cat: secs[0] && secs[0].dataset.cat, stops: secs[0] ? secs[0].querySelectorAll('.sp-stop').length : 0, heads: secs.every(x => x.querySelectorAll('.sp-sectitle').length === 1 && x.querySelector('.sp-road')) ? 1 : 0, back: !!(tr && fr && fr.top >= tr.bottom - 30) }; });   // (the road begins under its title)
  r.backToCards = true;
  // round M: the game opens straight over the Simple screen (it never hides first, so the valley does not flash up)
  await P.page.evaluate(() => { window.__flash = false; const t = setInterval(() => { if (!__sv.simple.open) window.__flash = true; if (document.querySelector('.gl')) clearInterval(t); }, 20); });
  await P.page.locator('.sp-stop:not(.grp)').first().click(); await P.page.waitForSelector('.gl', { timeout: 10000 }); r.game = true; r.flash = await P.page.evaluate(() => window.__flash);
  await P.page.evaluate(() => document.querySelector('.gl-x').click());
  r.back = await P.page.waitForFunction(() => __sv.simple.open && !__sv.simple.busy && !document.querySelector('.gl'), null, { timeout: 8000 }).then(() => true, () => false); // free again at once
  await P.page.click('.sp-tabs [data-tab="tales"]'); await P.page.waitForTimeout(300); r.talesCards = await P.page.evaluate(() => __sv.simple.view.cat === null && __sv.simple.view.secs > 1);
  await P.page.locator('.sp-stop:not(.grp)').first().click();
  r.tale = await P.page.waitForSelector('.theatre', { timeout: 10000 }).then(() => true, () => false);
  await P.page.evaluate(() => document.querySelector('.theatre .th-x').click());
  for (let k=0;k<6;k++){ console.log('DBG', JSON.stringify(await P.page.evaluate(() => ({ open: __sv.simple.open, busy: __sv.simple.busy, th: document.querySelectorAll('.theatre').length, gl: !!document.querySelector('.gl'), paused: __sv.paused })))); await P.page.waitForTimeout(800);}
  await P.page.waitForFunction(() => __sv.simple.open && !__sv.simple.busy && !document.querySelector('.theatre'), null, { timeout: 8000 }).catch(() => { }); // (the story fades out first)
  await P.page.evaluate(() => document.querySelectorAll('.dialog, .reward').forEach(d => d.remove()));
  await P.page.click('.sp-valley'); await P.page.waitForTimeout(500);
  r.valley = await P.page.evaluate(() => ({ open: __sv.simple.open, screen: __sv.heroes[0].profile.screen, dock: !document.querySelector('.simplesw').hidden, paused: __sv.paused }));
  await P.page.click('.simplesw'); r.reopen = await P.page.evaluate(() => __sv.simple.open);
  const errs = P.errors; await P.ctx.close();
  // a big kid, and two players
  const B = await open(b, { w: 390, h: 844, touch: true, screen: null });
  await B.page.evaluate(() => { __sv.simple.hide(); __sv.heroes[0].profile.age = 'big'; delete __sv.heroes[0].profile.screen; __sv.simple.start(); });
  await B.page.waitForTimeout(1200); r.big = await B.page.evaluate(() => __sv.simple.open); await B.ctx.close();
  // a phone on its side: the bar is a rail on the left and the path scrolls sideways; every picture still ≥ 64 px
  const W = await open(b, { w: 844, h: 390, touch: true, screen: 'simple' });
  await W.page.waitForSelector('.simple-screen:not([hidden]) .sp-catcard, .simple-screen:not([hidden]) .sp-stop', { timeout: 20000 });
  r.wide = await W.page.evaluate(() => { const s = document.querySelector('.simple-screen'), t = s.querySelector('.sp-tabs').getBoundingClientRect(), sc = s.querySelector('.sp-scroll'), pics = [...s.querySelectorAll('.sp-pic')].map(e => e.getBoundingClientRect()), tabs = [...s.querySelectorAll('.sp-tabs button')].map(e => e.getBoundingClientRect());
    return { wide: s.classList.contains('wide'), rail: t.left < 5 && t.height > 300, sideways: sc.scrollWidth > sc.clientWidth && sc.scrollHeight <= sc.clientHeight + 2, inView: pics.slice(0, 3).every(p => p.top >= 0 && p.bottom <= innerHeight), big: pics.every(p => p.width >= 64) && tabs.every(p => Math.min(p.width, p.height) >= 64) }; });
  await W.ctx.close();
  const S = await open(b, { w: 1280, h: 800, mode: 'split', screen: null }); await S.page.waitForTimeout(1500);
  r.split = await S.page.evaluate(() => ({ open: __sv.simple.open, dock: [...document.querySelectorAll('.simplesw')].some(d => !d.hidden) })); await S.ctx.close();
  ok(r.groupsFirst && r.section.cat && r.section.stops >= 1 && r.section.heads === 1 && r.section.back && r.backToCards && r.talesCards && !r.flash && r.game && r.back && r.tale && !r.valley.open && r.valley.screen === 'valley' && r.valley.dock && !r.valley.paused && r.reopen && r.wide.wide && r.wide.rail && r.wide.sideways && r.wide.inView && r.wide.big && !r.big && !r.split.open && !r.split.dock && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  ok(!r.home.tabs.length && r.home.embed && /Back to game/.test(r.home.text) && r.home.closed && r.home.still, 'Home: ' + JSON.stringify(r.home));
  return 'Home floats the website over this screen and Back to game closes it; under 5 starts on one page of sections, each a title and its own road, scrolling down (like Khám phá); a game and a story each two taps away, the road comes back after; Valley remembered; the “Big pictures” switch reopens it; on its side a rail and a sideways path; big kid and two players start in the valley';
});

await check('adventure', async () => {
  // round J (owner's brief: "an adventure world containing places children want to visit"): one activity list places
  // every game; an under-5 sees one group at a time on one page that scrolls (round P, owner; it was six a page) and every one is a drawn picture; a tap answers at once and a
  // second tap can't start a game twice; a big kid taps once to look and again to play, sees ✨ on new games and can
  // search; Discover jumps to any area; Ông Cú cheers a new star; the landscape stands still in Calm mode; opening and
  // closing the screen 25 times leaves no extra listeners or elements behind
  const P = await openAllGamesFixture(b, { w: 390, h: 844, touch: true, screen: 'simple' });
  await P.page.waitForSelector('.simple-screen:not([hidden]) .sp-catcard, .simple-screen:not([hidden]) .sp-stop', { timeout: 20000 });
  await P.page.evaluate(() => document.querySelectorAll('.dialog').forEach(d => d.remove()));
  const r = {};   // (Round V, owner 13 Oct: one page that scrolls down, each section's title then its own road, like Khám phá)
  // the list: every game is placed exactly once, and nothing is listed that isn't a game
  r.list = await P.page.evaluate(async () => { const { GAMES } = await import('/js/games/registry.js'), A = await import('/js/content/activities.js'), ids = Object.keys(GAMES), keys = Object.keys(A.GAME_INFO);
    return { missing: ids.filter(i => !A.GAME_INFO[i]), extra: keys.filter(k => !GAMES[k] && k !== 'familyquiz') /* Family Quiz is there only once the family has written questions in Studio */, badArea: keys.filter(k => !A.AREAS.some(a => a.key === A.GAME_INFO[k][0])), games: ids.length }; });
  // every under-5 section on the one page: its title (drawn picture and name) and its road of drawn pictures
  r.walk = await P.page.evaluate(async () => {
    const { GAMES } = await import('/js/games/registry.js'), A = await import('/js/content/activities.js'), U = await import('/js/content/unlocks.js'), out = { notDrawn: [], tooBig: [] };
    const p = __sv.heroes[0].profile;
    __sv.simple.openGroup('games', null);
    const openWant = Object.keys(GAMES).filter(id => !A.gameInfo(id).hidden && U.isOpen(p, id, 'game', A.gameInfo(id).area));
    const initialStops = __sv.simple.view.stops.filter(id => id !== 'songs');
    if (openWant.some(id => !initialStops.includes(id)) || initialStops.some(id => !openWant.includes(id))) out.notDrawn.push('unlocks ' + initialStops.length + '/' + openWant.length);
    p.unlockAll = true; __sv.simple.openGroup('games', null);
    const v = __sv.simple.view, cats = v.cats, stops = v.stops.slice(), heads = document.querySelectorAll('.sp-sec .sp-sectitle').length;
    const secCats = [...document.querySelectorAll('.sp-sec')].map(x => x.dataset.cat);
    document.querySelectorAll('.sp-sectitle .sp-hpic, .sp-stop .sp-pic').forEach(p => { if (!p.querySelector('.art')) out.notDrawn.push((p.closest('[aria-label]') || p.parentElement).getAttribute('aria-label') || p.parentElement.textContent); });
    if (JSON.stringify(secCats) !== JSON.stringify(cats)) out.notDrawn.push('sections ' + secCats.join(','));
    // (owner, 1 Nov 2026 AEDT: "Hiện đủ nhưng để tag cho 5+") under-5s see every switched-on game, as Play does; each game for 5 and up wears a 5+ tag
    const plus = stops.filter(id => id !== 'songs' && A.gameInfo(id).ageMin >= 5).length, tags = document.querySelectorAll('.sp-stop .sp-age').length;
    if (!plus || tags !== plus) out.tooBig.push('5+ tags ' + tags + '/' + plus);
    const want = Object.keys(GAMES).filter(id => !A.gameInfo(id).hidden);
    const order = A.AREAS.map(a => a.key).filter(k => cats.includes(k));
    delete p.unlockAll; __sv.simple.openGroup('games', null);
    return { cats: cats.length, inOrder: JSON.stringify(order) === JSON.stringify(cats), heads, missed: want.filter(id => !stops.includes(id)), notDrawn: out.notDrawn, tooBig: out.tooBig, stops: stops.length };
  });
  // (v1.08 simple, owner 3 Nov 2026 AEDT) the games are in two big buttons, Học vui (learning) and Vui chơi (play): every
  // switched-on game is on one of them, as a stop or (still locked) as a stop of its own with a padlock and what to do;
  // the learning areas are all under Học vui and none under Vui chơi; Valley is in the top row, not the bottom bar
  r.reach = await P.page.evaluate(async () => {
    const { GAMES } = await import('/js/games/registry.js'), A = await import('/js/content/activities.js'), out = { missing: [], twoTabs: [], noPad: [], folded: 0, learnWrong: [], bar: '', top: false };
    const want = Object.keys(GAMES).filter(id => !A.gameInfo(id).hidden), seen = {};
    for (const t of ['learn', 'fun']) {
      __sv.simple.show(t); __sv.simple.openGroup(t, null); const v = __sv.simple.view;
      for (const id of new Set(v.stops.concat(v.locks))) (seen[id] = seen[id] || []).push(t);
      for (const c of v.cats) if ((t === 'learn') !== (A.LEARN_CORNERS.includes(c) || c.startsWith('hv_'))) out.learnWrong.push(t + ':' + c);
      document.querySelectorAll('.sp-stop.locked').forEach(b => { if (!b.querySelector('.sp-lockpad .art') || !b.querySelector('.sp-hint')?.textContent.trim()) out.noPad.push(b.getAttribute('aria-label')); });
      out.folded += [...document.querySelectorAll('.sp-stop')].filter(e => /more to unlock|trò để mở/.test(e.textContent)).length;
    }
    out.missing = want.filter(id => !seen[id]);
    out.twoTabs = want.filter(id => seen[id] && seen[id].length > 1);   // (v1.08b games: one home per game, no link stops)
    out.bar = [...document.querySelectorAll('.sp-tabs button')].map(b => b.dataset.tab || (b.classList.contains('sp-discover') ? 'discover' : '?')).join(',');
    out.top = !!document.querySelector('.sp-top .sp-tools .sp-valley') && !document.querySelector('.sp-tabs .sp-valley');
    out.games = want.length;
    __sv.simple.show('games'); __sv.simple.openGroup('games', null);
    return out;
  });
  // places: China and India (asia) always come last
  // (owner, 1 Nov 2026 AEDT) a lock stop says what to do: its guide lists each game to win 3 times with the stars so far
  r.guide = await P.page.evaluate(async () => { const s = document.querySelector('.sp-stop.locked') || [...document.querySelectorAll('.sp-stop')].find(e => /more to unlock|trò để mở/.test(e.textContent)); /* (v1.08: each locked game is its own stop) */ if (!s) return 'no lock stop'; s.click(); await new Promise(r => setTimeout(r, 200)); const g = document.querySelector('.sp-guide'), rows = g ? g.querySelectorAll('.sp-grow').length : 0, x = g && g.querySelector('.sp-gx'), xr = x && x.getBoundingClientRect(); x && x.click(); return rows && xr.width >= 64 && !document.querySelector('.sp-guide') ? 'ok' : 'guide rows ' + rows; });
  r.placesLast = await P.page.evaluate(() => { __sv.simple.show('places'); const c = __sv.simple.view.cats; return c[c.length - 1]; });
  await P.page.evaluate(() => __sv.simple.show('games'));
  // Discover: a big picture for every area; tapping Music goes there
  await P.page.click('.sp-discover'); await P.page.waitForSelector('.sp-find:not([hidden]) .sp-card');
  r.find = await P.page.evaluate(() => ({ cards: document.querySelectorAll('.sp-card').length, search: !!document.querySelector('.sp-q') }));
  await P.page.click('.sp-card[data-t="fun"][data-a="music"]'); await P.page.waitForTimeout(200); r.music = await P.page.evaluate(() => { const h = document.querySelector('.sp-sec[data-cat="music"] .sp-sectitle'), r = h && h.getBoundingClientRect(); return r && r.top >= 0 && r.top < innerHeight / 2 ? 'music' : 'lost'; });
  // a double tap starts the game once
  await P.page.evaluate(() => { window.__starts = 0; const pg = __sv.playGame; __sv.playGame = (...a) => { window.__starts++; return pg(...a); }; const s = [...document.querySelectorAll('.sp-stop:not(.grp)')].find(x => !/^(Songs|Bài hát)$/.test(x.getAttribute('aria-label'))); s.click(); s.click(); setTimeout(() => s.click(), 120); }); // (a game, not the Music group's 🎵 Songs)
  await P.page.waitForSelector('.gl', { timeout: 10000 }); await P.page.waitForTimeout(400);
  r.starts = await P.page.evaluate(() => window.__starts);
  await P.page.evaluate(() => document.querySelector('.gl-x').click());
  await P.page.waitForFunction(() => __sv.simple.open, null, { timeout: 8000 }).catch(() => { });
  await P.page.evaluate(() => document.querySelectorAll('.dialog, .reward').forEach(d => d.remove()));
  // Ông Cú is there, and cheers when a new star was won since the path was last open
  r.owl = await P.page.evaluate(async () => { const owl = !!document.querySelector('.sp-owl .art'); __sv.simple.hide(); const p = __sv.heroes[0].profile; p.wins = p.wins || {}; p.wins.bunny = (p.wins.bunny || 0) + 4; __sv.simple.show(); return { owl, cheer: document.querySelector('.sp-owl').classList.contains('cheer') }; });
  // Calm mode: the landscape stands still
  r.calm = await P.page.evaluate(() => { document.body.classList.add('calm'); const a = getComputedStyle(document.querySelector('.sp-cloud')).animationName; document.body.classList.remove('calm'); return a; });
  // 25 times open and closed: no more listeners, elements or screens than before
  const cdp = await P.ctx.newCDPSession(P.page);
  const listeners = async () => { const w = await cdp.send('Runtime.evaluate', { expression: 'window' }), d = await cdp.send('Runtime.evaluate', { expression: 'document' }); return (await cdp.send('DOMDebugger.getEventListeners', { objectId: w.result.objectId })).listeners.length + (await cdp.send('DOMDebugger.getEventListeners', { objectId: d.result.objectId })).listeners.length; };
  const nodes = () => P.page.evaluate(() => document.getElementsByTagName('*').length);
  const l0 = await listeners(), n0 = await nodes();
  for (let i = 0; i < 25; i++) await P.page.evaluate(() => { __sv.simple.hide(); __sv.simple.show(); });
  r.leak = { listeners: (await listeners()) - l0, nodes: (await nodes()) - n0, screens: await P.page.evaluate(() => document.querySelectorAll('.simple-screen').length) };
  const errs = P.errors; await P.ctx.close();
  // a big kid: the first tap shows, the second plays; ✨ on a game that came after the last look; search finds "Đập Niêu" without accents
  const B = await open(b, { w: 390, h: 844, touch: true, screen: 'simple' });
  await B.page.evaluate(() => { const p = __sv.heroes[0].profile; p.age = 'big'; p.unlockAll = true; p.seenActs = undefined; __sv.simple.hide(); __sv.simple.show(); p.seenActs = p.seenActs.filter(x => x !== 'game:bunny'); __sv.simple.hide(); __sv.simple.show('games'); __sv.simple.openGroup('games', 'animals'); document.querySelectorAll('.dialog').forEach(d => d.remove()); });
  r.big = await B.page.evaluate(() => ({ stops: __sv.simple.view.stops.length, newOn: [...document.querySelectorAll('.sp-stop')].filter(s => s.querySelector('.sp-new')).map(s => s.getAttribute('aria-label')), dots: document.querySelectorAll('.sp-level').length === 0 })); // stars only: no difficulty dots (owner)
  await B.page.locator('.sp-stop:not(.grp)').first().click(); await B.page.waitForTimeout(700);
  r.big.firstTap = await B.page.evaluate(() => ({ game: !!document.querySelector('.gl'), sel: !!document.querySelector('.sp-stop.sel .sp-play') }));
  await B.page.locator('.sp-stop.sel').click(); r.big.secondTap = await B.page.waitForSelector('.gl', { timeout: 10000 }).then(() => true, () => false);
  await B.page.evaluate(() => document.querySelector('.gl-x').click());
  await B.page.waitForFunction(() => __sv.simple.open, null, { timeout: 8000 }).catch(() => { });
  await B.page.evaluate(() => document.querySelectorAll('.dialog, .reward').forEach(d => d.remove()));
  await B.page.click('.sp-discover'); await B.page.fill('.sp-q', 'dap nieu'); await B.page.waitForTimeout(200);
  r.big.search = await B.page.evaluate(() => [...document.querySelectorAll('.sp-found .sp-card b')].map(b => b.textContent));
  errs.push(...B.errors); await B.ctx.close();
  ok(!r.list.missing.length && !r.list.extra.length && !r.list.badArea.length, 'activity list: ' + JSON.stringify(r.list));
  ok(r.guide === 'ok', 'lock guide: ' + r.guide);
  ok(!r.reach.missing.length && !r.reach.twoTabs.length && !r.reach.noPad.length && !r.reach.folded && !r.reach.learnWrong.length && r.reach.bar === 'learn,fun,tales,places,discover' && r.reach.top, 'Học vui / Vui chơi: ' + JSON.stringify(r.reach));
  ok(r.walk.cats >= 5 && r.walk.heads === r.walk.cats && r.walk.inOrder && r.placesLast === 'asia' && !r.walk.missed.length && !r.walk.notDrawn.length && !r.walk.tooBig.length, 'under-5 path: ' + JSON.stringify(r.walk));
  ok(r.find.cards >= 18 && !r.find.search && r.music === 'music', 'discover: ' + JSON.stringify(r.find) + ' ' + r.music);
  ok(r.starts === 1, 'a double tap started the game ' + r.starts + ' times');
  ok(r.owl.owl && r.owl.cheer, 'Ông Cú: ' + JSON.stringify(r.owl));
  ok(r.calm === 'none', 'the landscape still moves in Calm mode: ' + r.calm);
  ok(r.leak.listeners <= 0 && r.leak.nodes <= 5 && r.leak.screens === 1, 'after 25 opens: ' + JSON.stringify(r.leak));
  ok(r.big.stops > 6 && r.big.dots && r.big.newOn.includes('Feed the Bunny') && r.big.newOn.length === 1 && !r.big.firstTap.game && r.big.firstTap.sel && r.big.secondTap && r.big.search.some(t => /Smash the Pot/.test(t)), 'big kid: ' + JSON.stringify(r.big));
  ok(!errs.length, errs.join(' | '));
  return `${r.list.games} games in 11 areas; under-5: one page of ${r.walk.cats} sections, each a title and its own road (${r.walk.stops} stops), every one drawn, China and India last in places; Discover ${r.find.cards} areas; double tap starts once; big kid: two taps, ✨ new, search; Ông Cú cheers; still in Calm; 25 opens: +${r.leak.listeners} listeners, +${r.leak.nodes} elements`;
});

await check('quiet', async () => {
  // round M (owner: sound kept playing after leaving the game, until it was killed): when the game goes to the
  // background (another app, the lock screen) the audio engine sleeps, music stops scheduling and videos pause; when
  // it comes back, sound comes back
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  await P.page.mouse.click(200, 400); // a tap: iPhone-style, sound is allowed after one
  const r = await P.page.evaluate(async () => {
    const A = await import('/js/audio.js'), S = await import('/js/state.js'), wait = t => new Promise(res => setTimeout(res, t));
    S.settings.music = true; S.settings.sound = true; A.Music.stop(); A.Music.play('field'); const ctx = A.ac(); await ctx.resume().catch(() => { }); await wait(400);
    const v = document.createElement('video'); document.body.appendChild(v);
    const before = { state: ctx.state, next: A.Music.next };
    const hide = h => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => h }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => h ? 'hidden' : 'visible' }); document.dispatchEvent(new Event('visibilitychange')); };
    hide(true); await wait(500); const n1 = A.Music.next; A.SFX.tap && A.SFX.tap(); await wait(600);
    const away = { state: ctx.state, scheduling: A.Music.next !== n1, videoPaused: v.paused };
    hide(false); await wait(500);
    const back = { state: ctx.state }; delete document.hidden; delete document.visibilityState; v.remove(); A.Music.stop();
    return { before, away, back };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.before.state === 'running' && r.away.state === 'suspended' && !r.away.scheduling && r.away.videoPaused && r.back.state === 'running' && !errs.length, JSON.stringify({ r, errs }));
  return 'in the background: audio asleep, no music scheduled, videos paused (a sound effect does not wake it); back on screen: sound again';
});

await check('grownupsui', async () => {
  // round P (owner): on a phone the action button sits on the right above Jump and Run (the left half is the joystick's)
  // and the spoken words near the top; Grown-ups in groups that open and close, no credits editor; (round R privacy, 9 Oct)
  // the privacy notice first and no voice engine or voice key
  const P = await open(b, { w: 390, h: 844, touch: true, lang: 'vi' }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const wait = ms => new Promise(x => setTimeout(x, ms)), h = __sv.huds[0];
    __sv.paused = true; h.setAction({ label: () => 'Nhặt Lá dong', icon: '🌿' }); await wait(300); // (paused: the valley's own loop would hide it again)
    const a = h.q('.act').getBoundingClientRect(), mv = h.q('.hud-br').getBoundingClientRect();
    const { say } = await import('/js/voice.js'); say('A test line.', 'Một câu thử.'); await wait(400);
    const cap = document.querySelector('.caption'), c = cap ? cap.getBoundingClientRect() : null;
    const { openGrownups } = await import('/js/ui.js'); await openGrownups(); await wait(400);
    const secs = [...document.querySelectorAll('.grownups details.gsec')].map(d => d.dataset.sec), open = [...document.querySelectorAll('.grownups details.gsec[open]')].map(d => d.dataset.sec);
    // (round R privacy, 9 Oct) no voice engine or voice key any more; the privacy notice is its own small block at the top
    const eng = document.querySelector('.grownups details.xeng, .grownups #xKey, .grownups #xTts, .grownups #xClone'), credits = !!document.querySelector('.grownups #crName');
    const priv = document.querySelector('.grownups details.g-priv'), firstSec = document.querySelector('.grownups details.gsec');
    const privLines = priv ? priv.querySelectorAll('li').length : 0;
    const privFirst = !!(priv && firstSec && priv.compareDocumentPosition(firstSec) & Node.DOCUMENT_POSITION_FOLLOWING);
    const privTap = priv ? Math.round(priv.querySelector('summary').getBoundingClientRect().height) : 0;
    const dataSec = document.querySelector('.grownups details.gsec[data-sec="data"]'); if (dataSec) dataSec.open = true; await wait(100);
    const famPriv = document.querySelector('.grownups .fam-privacy')?.textContent || '';
    document.querySelector('#gFamCodeMake')?.click(); await wait(150);
    const madeCode = document.querySelector('.grownups .fam-code-val')?.textContent || '', hasQr = !!document.querySelector('.grownups svg.fam-qr');
    document.querySelector('#gFamCodeLeave')?.click(); await wait(150);
    const famIn = document.querySelector('#gFamCodeIn'); if (famIn) { famIn.value = 'k7m4 p9q2'; document.querySelector('#gFamCodeJoin')?.click(); await wait(150); }
    const joinedCode = document.querySelector('.grownups .fam-code-val')?.textContent || '';
    document.querySelector('#gFamCodeLeave')?.click(); await wait(100);
    return { act: [a.left, a.top, a.right, a.bottom].map(Math.round), moves: Math.round(mv.top), w: innerWidth, cap: c ? [Math.round(c.top), Math.round(c.bottom)] : null, secs, open, engine: !!eng, privacy: privLines, privFirst, privTap, credits, famPriv, madeCode, hasQr, joinedCode };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.act[0] > r.w / 2 - 40 && r.act[3] <= r.moves + 2 && r.cap && r.cap[0] < 260, 'phone layout: ' + JSON.stringify(r));
  ok(r.secs.length >= 8 && r.secs.includes('sound') && r.secs.includes('online') && r.open.join() === 'players' && !r.engine && r.privacy === 6 && r.privFirst && r.privTap >= 44 && !r.credits && /không chia sẻ tiến trình hay ảnh/.test(r.famPriv) && /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(r.madeCode) && r.hasQr && r.joinedCode === 'K7M4-P9Q2' && !errs.length, 'grown-ups: ' + JSON.stringify(Object.assign(r, { errs })));
  return `action button on the right above Jump/Run (${r.act.join(',')}), words at the top (${r.cap.join('–')} px); Grown-ups: ${r.secs.length} groups (${r.secs.join(', ')}), the privacy notice first (${r.privacy} lines), no voice engine or voice key, no credits editor`;
});

await check('playhub', async () => {
  // round O (owner): the pink button is "Play" with a 🎵 Songs tab (songs belong with the games, not in Settings);
  // battery: on a phone the valley is drawn 30 times a second, and not at all behind the Simple screen or the Songs page
  const P = await open(b, { w: 390, h: 844, touch: true, lang: 'vi' }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, wait = ms => new Promise(x => setTimeout(x, ms)), R = G.renderer, orig = R.render; let n = 0; R.render = function (...a) { n++; return orig.apply(this, a); };
    const count = async ms => { n = 0; await wait(ms); return n; };
    const out = { label: document.querySelector('.dk.games small').textContent, perSec: await count(2000) / 2 };
    G.openQuick(0); await wait(300); out.settingsSongs = !!document.querySelector('#qSongs'); document.querySelectorAll('.modal').forEach(m => m.remove()); G.paused = false;
    G.openGamesHub(0); await wait(300); out.title = document.querySelector('.hub h2').textContent;
    document.querySelector('.hubtabs [data-tab="songs"]').click(); await wait(300);
    out.groups = [...document.querySelectorAll('[data-songs]')].map(b => b.dataset.songs);
    document.querySelector('[data-songs="lullaby"]').click(); await wait(600);
    out.songsPage = !!document.querySelector('.songs.night'); out.songsDraws = await count(1500);
    document.querySelector('.songs .sg-x').click(); await wait(300);
    G.simple.show(); await wait(400); out.simpleDraws = await count(1500); G.simple.hide(); await wait(300);
    out.backDraws = await count(1000);
    R.render = orig; return out;
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.label === 'Vui chơi' && /Vui chơi/.test(r.title) && !r.settingsSongs && r.groups.includes('lullaby') && r.groups.length >= 4 && r.songsPage, 'play hub: ' + JSON.stringify(r));
  ok(r.perSec <= 34 && r.songsDraws === 0 && r.simpleDraws === 0 && r.backDraws > 0 && !errs.length, 'battery: ' + JSON.stringify(Object.assign(r, { errs })));
  return `“${r.label}” with 🎵 ${r.groups.length} song groups (lullabies open the night page), none in Settings; phone draws ${r.perSec}/s, none behind the Songs page or the Simple screen`;
});

await check('a11y', async () => {
  // accessibility rules (round I, ARCHITECTURE §9.6): UI-004 touch targets, A11Y-001 reduced motion, A11Y-002 readable
  // captions, A11Y-004 under-5s hear every game's instruction (A11Y-003 simple paths: the "simple" check)
  const P = await openAllGamesFixture(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  const small = (min, sel = 'button, a[href], [role=button], input[type=checkbox], select') => P.page.evaluate(([min, sel]) => {
    const out = [];
    for (const e of document.querySelectorAll(sel)) {
      const r = e.getBoundingClientRect(), s = getComputedStyle(e);
      if (!(r.width > 0 && r.height > 0) || s.visibility === 'hidden' || e.closest('[hidden]') || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) continue;
      if (Math.min(r.width, r.height) < min - .5) out.push(((e.className && String(e.className)) || e.tagName).split(' ')[0] + ':' + e.textContent.trim().slice(0, 10) + '=' + Math.round(Math.min(r.width, r.height)));
    }
    return out;
  }, [min, sel]);
  const bad = {};
  const at = async (name, fn, min = 44, sel) => { await fn(); await P.page.waitForTimeout(500); const s = await small(min, sel); if (s.length) bad[name] = s.slice(0, 6); await clear(P.page); };
  await at('valley', async () => { });
  for (const t of ['map', 'bag', 'log', 'album', 'passport', 'games', 'cam', 'friend']) await at('pad-' + t, () => P.page.evaluate(t => __sv.openPad(0, t), t));
  await at('games hub', () => P.page.evaluate(() => __sv.openGamesHub(0)));
  await at('quick settings', () => P.page.evaluate(() => __sv.openQuick(0)));
  // under 5: the answers in a game are at least 64 px; the Simple screen's pictures and bar too
  await P.page.evaluate(async () => { const F = await import('/js/games/frame.js'); window.__g = F.openGame('colors', { players: [__sv.heroes[0].profile], level: 1, little: true }); });
  await P.page.waitForTimeout(1200); { const s = await small(64, '.gl .choice'); if (s.length) bad['little answers'] = s; }
  await P.page.evaluate(() => document.querySelector('.gl-x').click()); await P.page.waitForTimeout(500); await clear(P.page);
  await at('simple screen', () => P.page.evaluate(() => __sv.simple.show()), 64, '.sp-pic, .sp-tabs button, .sp-again, .sp-grown');
  await P.page.evaluate(() => __sv.simple.hide());
  // readable captions: shown even with the voice off, ≥ 16 px, contrast ≥ 4.5 : 1 (on white behind, the worst case), ≥ 2.5 s
  const cap = await P.page.evaluate(async () => {
    const V = await import('/js/voice.js'); V.say('Look at the pretty kite!', 'Nhìn con diều đẹp chưa kìa!');
    await new Promise(r => setTimeout(r, 2400)); const c = document.querySelector('.caption'); if (!c) return null;
    const s = getComputedStyle(c), rgb = x => x.match(/[\d.]+/g).map(Number), fg = rgb(s.color), bg = rgb(s.backgroundColor), a = bg[3] ?? 1;
    const mix = bg.slice(0, 3).map((v, k) => v * a + 255 * (1 - a)), L = c3 => { const [r, g, b] = c3.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
    const l1 = L(fg.slice(0, 3)), l2 = L(mix);
    return { shown: c.classList.contains('show'), px: parseFloat(s.fontSize), contrast: +((Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05)).toFixed(1) };
  });
  // reduced motion: the device's "Reduce motion" turns on Calm mode and no animation runs for ever
  await P.page.emulateMedia({ reducedMotion: 'reduce' }); await P.page.waitForTimeout(300);
  await P.page.evaluate(() => __sv.simple.show()); await P.page.waitForTimeout(600);
  const motion = await P.page.evaluate(() => ({ calm: document.body.classList.contains('calm'), forever: document.getAnimations().filter(a => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations === Infinity).map(a => (a.animationName || '') + '@' + ((a.effect.target && a.effect.target.className && String(a.effect.target.className).split(' ')[0]) || '')).slice(0, 8) }));
  await P.page.evaluate(() => __sv.simple.hide()); await P.page.emulateMedia({ reducedMotion: 'no-preference' });
  // under 5: every game says what to do when it opens
  const quiet = await P.page.evaluate(async () => {
    const F = await import('/js/games/frame.js'), V = await import('/js/voice.js'), out = [];
    let heard = 0; V.spoken.push(() => { heard++; });
    for (const id of Object.keys(F.GAMES)) {
      heard = 0; const g = F.openGame(id, { players: [__sv.heroes[0].profile], level: 1, little: true });
      for (let k = 0; k < 30 && !heard; k++) await new Promise(r => setTimeout(r, 100));
      if (!heard) out.push(id);
      const x = document.querySelector('.gl-x'); if (x) x.click(); await Promise.race([g, new Promise(r => setTimeout(r, 1500))]);
      document.querySelectorAll('.gl, .modal, .dialog, .reward').forEach(e => e.remove());
    }
    return { n: Object.keys(F.GAMES).length, quiet: out };
  });
  const errs = P.errors.filter(e => !/getUserMedia|NotAllowed/.test(e)); await P.ctx.close();
  ok(!Object.keys(bad).length && cap && cap.shown && cap.px >= 16 && cap.contrast >= 4.5 && motion.calm && !motion.forever.length && !quiet.quiet.length && !errs.length,
    JSON.stringify({ bad, cap, motion, quiet: quiet.quiet, errs: errs.slice(0, 5) }));
  return `touch targets ≥ 44 px on 12 screens, ≥ 64 px for under-5 answers and the Simple screen; captions ${cap.px} px, contrast ${cap.contrast}:1, still up at 2.4 s; Reduce motion → Calm, nothing loops; all ${quiet.n} games speak their instruction to an under-5`;
});

await check('chips', async () => {
  // (Round U, owner 11 Oct: "these buttons should tell what they are when hover or tap") the coin, orb and Leafy chips on
  // the top bar and in the Backpack: each has a name to hover (title) and a tap shows a card with its name and what it is
  // for, in English and in Vietnamese
  const out = [];
  for (const lang of ['en', 'vi']) {
    const P = await open(b, { w: 820, h: 1180, touch: true, lang }); await clear(P.page); const page = P.page;
    for (const where of ['hud', 'bag']) {
      if (where === 'bag') { await page.evaluate(() => __sv.openPad(0, 'bag')); await page.waitForTimeout(600); }
      const scope = where === 'hud' ? '.hud' : '.bag-top';
      for (const k of ['money', 'orbs', 'leafy']) {
        const sel = `${scope} [data-chip="${k}"]`, title = await page.getAttribute(sel, 'title').catch(() => null);
        if (!title) { out.push(`${lang} ${where} ${k}: no name to hover`); continue; }
        await page.evaluate(() => document.querySelectorAll(".chipcard").forEach(c => c.classList.remove("on"))); await page.click(sel); await page.waitForFunction(() => document.querySelector(".chipcard.on"), null, { timeout: 3000 }).catch(() => {});
        const card = await page.evaluate(() => { const c = document.querySelector('.chipcard.on'); return c ? c.textContent : ''; });
        if (!card.includes(title)) out.push(`${lang} ${where} ${k}: a tap shows "${card.slice(0, 60)}"`);
        if (lang === 'en' && /[ăâđêôơư]/i.test(card)) out.push(`${where} ${k}: Vietnamese in English`);
      }
    }
    const errs = P.errors; await P.ctx.close(); if (errs.length) out.push(lang + ': ' + errs.join(' '));
  }
  ok(!out.length, out.join(' | '));
  return 'coins, Sparkle Orbs and Leafies: a name to hover and a card on tap, top bar and Backpack, English and Vietnamese';
});

await check('hscroll', async () => {
  // (Round U, owner 11 Oct: "I can't drag left and right on phone or desktop"; "on a tablet I can't scroll down the Map")
  // the Backpack's tab row moves sideways and the Pad's Map page moves down, on a phone and a tablet by finger (also with
  // the browser's own touch scrolling switched off, as strict as Safari: js/scrollhelp.js moves them by hand) and on a
  // computer by mouse drag and wheel
  const out = [];
  for (const [name, w, h, touch] of [['phone', 390, 760, true], ['tablet', 820, 1180, true], ['computer', 1280, 800, false]]) {
    const P = await open(b, { w, h, touch }); await clear(P.page); const page = P.page, cdp = await page.context().newCDPSession(page);
    await page.waitForTimeout(600);
    const at = sel => page.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return { x: q.x + q.width / 2, y: q.y + Math.min(q.height / 2, 300) }; }, sel);
    const finger = async (sel, dx, dy) => { const r = await at(sel); if (!r) return; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.x, y: r.y }] }); for (let k = 1; k <= 10; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: r.x + dx * k / 10, y: r.y + dy * k / 10 }] }); await page.waitForTimeout(20); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(250); };
    const mouse = async (sel, dx) => { const r = await at(sel); if (!r) return; await page.mouse.move(r.x, r.y); await page.mouse.down(); for (let k = 1; k <= 8; k++) await page.mouse.move(r.x + dx * k / 8, r.y); await page.mouse.up(); await page.waitForTimeout(200); };
    const read = () => page.evaluate(() => { const j = document.querySelector('.jumpnav'), b = document.querySelector('.pad-body'); return { jn: j ? Math.round(j.scrollLeft) : -1, jnMax: j ? j.scrollWidth - j.clientWidth : -1, body: b ? Math.round(b.scrollTop) : -1, bodyMax: b ? b.scrollHeight - b.clientHeight : -1 }; });
    for (const strict of touch ? [false, true] : [false]) {
      if (strict) await page.addStyleTag({ content: '.jumpnav, .pad-body, .modal, .jumpnav button { touch-action: none !important; }' });
      await page.evaluate(() => { document.querySelectorAll('.modal .x').forEach(x => x.click()); __sv.openPad(0, 'bag'); }); await page.waitForTimeout(700);
      if (touch) await finger('.jumpnav', -200, 0); else await mouse('.jumpnav', -200);
      const bag = await read();
      if (!touch) { await page.evaluate(() => { const j = document.querySelector('.jumpnav'); j.scrollLeft = 0; }); const r = await at('.jumpnav'); await page.mouse.move(r.x, r.y); await page.mouse.wheel(0, 200); await page.waitForTimeout(250); }
      const wheel = await read();
      await page.evaluate(() => { document.querySelectorAll('.modal .x').forEach(x => x.click()); __sv.openPad(0, 'map'); }); await page.waitForTimeout(700);
      if (touch) await finger('.pad-body', 0, -350); else { const r = await at('.pad-body'); await page.mouse.move(r.x, r.y); await page.mouse.wheel(0, 600); await page.waitForTimeout(300); }
      const map = await read();
      const tag = name + (strict ? ' (strict)' : '');
      if (bag.jnMax > 4 && bag.jn < 40) out.push(`${tag}: the Backpack row did not move (${JSON.stringify(bag)})`);
      if (!touch && bag.jnMax > 4 && wheel.jn < 40) out.push(`${tag}: the wheel did not move the Backpack row`);
      if (map.bodyMax > 4 && map.body < Math.min(60, map.bodyMax)) out.push(`${tag}: the Map page did not move down (${JSON.stringify(map)})`);
    }
    const errs = P.errors; await P.ctx.close(); if (errs.length) out.push(name + ': ' + errs.join(' '));
  }
  ok(!out.length, out.join(' | '));
  return 'the Backpack row moves by finger (phone, tablet, also as strict as Safari), by mouse drag and by wheel; the Map page moves down on every size';
});

await check('questbar', async () => {
  // (Round V, owner 13 Oct, iPhone notes) a tap on the quest folds it to a small chip and hides the yellow arrow and the
  // light; a second tap opens it again; a family mission the child has been told about shows under the quest too
  const out = [];
  for (const [name, w, h, touch] of [['phone', 390, 760, true], ['computer', 1280, 800, false]]) {
    const P = await open(b, { w, h, touch }); await clear(P.page); await P.page.waitForTimeout(800);
    const r = await P.page.evaluate(async () => {
      const G = __sv, wait = ms => new Promise(r => setTimeout(r, ms)), hud = G.huds[0].root, h = G.heroes[0];
      h.profile.questFold = false; h.place(h.pos.x + 30, h.pos.z + 30); await wait(400);
      const arrows = () => { let n = 0; G.scene.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'ConeGeometry' && o.material && o.material.color && o.material.color.getHexString() === 'ffd23f' && o.visible) n++; }); return n; };
      const before = { arrows: arrows(), text: !!hud.querySelector('.quest .q-text').offsetWidth };
      hud.querySelector('.q-say').click(); await wait(400);
      const folded = { fold: hud.querySelector('.quest').classList.contains('fold'), text: !!hud.querySelector('.quest .q-text').offsetWidth, arrows: arrows(), saved: h.profile.questFold === true, w: Math.round(hud.querySelector('.quest').getBoundingClientRect().width) };
      hud.querySelector('.q-say').click(); await wait(400);
      const open = { fold: hud.querySelector('.quest').classList.contains('fold'), arrows: arrows() };
      // a started family mission
      const m = G.parents.openFor(h.profile)[0]; if (m) { h.profile.missionsSeen = [...(h.profile.missionsSeen || []), m.id]; } await wait(600);
      const fam = hud.querySelector('.q-fam'), famShown = !!(fam && !fam.hidden && fam.offsetWidth), famText = fam ? fam.textContent : '', famH = fam ? Math.round(fam.getBoundingClientRect().height) : 0;
      return { before, folded, open, mission: !!m, famShown, famText: famText.slice(0, 60), famH };
    });
    const errs = P.errors; await P.ctx.close();
    const bad = !r.before.arrows || !r.before.text || !r.folded.fold || r.folded.text || r.folded.arrows || !r.folded.saved || r.folded.w > 80 || r.open.fold || !r.open.arrows || !r.mission || !r.famShown || r.famText.length < 15 || r.famH < 44;
    if (bad || errs.length) out.push(name + ' ' + JSON.stringify(r) + (errs.length ? ' ' + errs.join(' ') : ''));
  }
  ok(!out.length, out.join(' | '));
  return 'a tap folds the quest to a small chip and hides the arrow; a tap opens it again; a started family mission shows under the quest (44 px), on a phone and a computer';
});

await check('bagitems', async () => {
  // (Round V, owner 13 Oct) the Backpack: every item says what it is and what it is for (hover and tap); food asks "Eat it?"
  // first; the coins, Sparkle Orbs and Leafies sit in one tidy row of three cards
  const out = [];
  for (const [name, w, h, touch] of [['phone', 390, 760, true], ['computer', 1280, 800, false]]) {
    const P = await open(b, { w, h, touch }); await clear(P.page);
    const r = await P.page.evaluate(async () => {
      const G = __sv, wait = ms => new Promise(r => setTimeout(r, ms)), p = G.heroes[0].profile;
      p.inv.rice = 2; p.inv.mango = 1; p.dishes.pho = 2; G.openPad(0, 'bag'); await wait(600);
      const cards = [...document.querySelectorAll('.modal.pad .bag-top .chip')].map(c => c.getBoundingClientRect()), row = cards.length === 3 && cards.every(c => Math.abs(c.top - cards[0].top) < 2 && c.height >= 44), even = cards.length === 3 && Math.max(...cards.map(c => c.width)) - Math.min(...cards.map(c => c.width)) < 3;
      const titled = [...document.querySelectorAll('.modal.pad .slots .slot')].every(s => (s.getAttribute('title') || '').length > 3 || s.querySelector('.sw'));
      const ing = document.querySelector('.modal.pad [data-ing="rice"]'); ing.click(); await wait(300); const tip = (document.querySelector('.bag-help') || {}).textContent || '';
      const eat = () => document.querySelector('.modal.pad [data-eat="pho"]');
      eat().click(); await wait(500); const asked=!!document.querySelector('.bag-help .bh-act')&&!!document.querySelector('.bag-help .bh-close')&&!document.querySelector('.dialog');document.querySelector('.bag-help .bh-close')?.click();await wait(400);const kept=p.dishes.pho===2;
      eat().click();await wait(500);document.querySelector('.bag-help .bh-act')?.click();await wait(400);const ate=p.dishes.pho===1;
      document.querySelectorAll('.dialog').forEach(d => d.remove()); G.paused = false;
      return { row, even, titled, tip: tip.slice(0, 80), asked, kept, ate };
    });
    const errs = P.errors; await P.ctx.close();
    if (!r.row || !r.even || !r.titled || !/rice|gạo/i.test(r.tip) || !/xôi|bánh|cook|nấu/i.test(r.tip) || !r.asked || !r.kept || !r.ate || errs.length) out.push(name + ' ' + JSON.stringify(Object.assign(r, { errs })));
  }
  ok(!out.length, out.join(' | '));
  return 'the three counters in one row of cards; every item has its words on hover; an ingredient tap says which dishes it makes; food asks "Eat it?" (Not now keeps it, Yes eats it), on a phone and a computer';
});

await check('iphone', async () => {
  // the owner's iPhone screenshots (round F): (1) "no microphone" although the phone has one: friends meet with no tap
  // and iPhone opens the microphone only after a tap; now it says "tap to talk", opens it on the next tap and puts it
  // into the open calls; only a phone with really no microphone hears "no microphone". (2) Pad → Friends: the player's
  // buttons squeezed so their words broke into single letters. (3) The friend bar under the map lay on the round buttons.
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, N = (await import('/js/net.js')).Net, wait = ms => new Promise(r => setTimeout(r, ms)), said = [];
    N.on('status', s => said.push(s.key));
    // 1. the microphone: refused without a tap, works after one, goes into an open call
    let asks = 0, replaced = 0; const md = navigator.mediaDevices, real = md.getUserMedia.bind(md);
    md.getUserMedia = async c => { asks++; if (asks <= 1) { const e = new Error('needs a tap'); e.name = 'NotAllowedError'; throw e; } return real({ audio: true }); };
    N.calls.set('peer-y', { peerConnection: { getSenders: () => [{ track: { kind: 'audio' }, replaceTrack: async () => { replaced++; } }] } });
    N.mic = null; N.cloudOn = true; await N.getMic();
    const first = said.slice(), noMicYet = !N.mic;
    // round O: a tap anywhere no longer asks again (each ask could bring the iPhone's question up again)…
    document.body.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); await wait(400); const askedOnTap = asks;
    // …the 🎙️ Microphone on button (or the call button) does
    await N.getMic(); for (let k = 0; k < 50 && !(N.mic && said.includes('micon')); k++) await wait(100);
    const micAfterTap = !!N.mic, after = said.slice(), tapAsks = askedOnTap;
    md.getUserMedia = async () => { const e = new Error('none'); e.name = 'NotFoundError'; throw e; }; N.mic = null; said.length = 0; await N.getMic(); const reallyNone = said.slice();
    // bug #55 (owner's iPhone: a tap on the microphone did nothing): a try made without a tap hangs for ever; a tap
    // still asks afresh (says "Asking…", then "on"); when the old try answers late its microphone is stopped, not used
    const replacedFirst = replaced; md.getUserMedia = real; N.mic = null; said.length = 0;
    let late = null; md.getUserMedia = () => new Promise(res => { late = res; });
    const hung = N.getMic(); await wait(100);
    let fresh = 0; md.getUserMedia = c => { fresh++; return real({ audio: true }); };
    const tapMic = await N.getMic(true), tapSaid = said.slice();
    const extra = await real({ audio: true }); late(extra); const hungGot = await hung; await wait(100);
    const lateStopped = extra.getAudioTracks().every(t => t.readyState === 'ended'), kept = N.mic === tapMic && hungGot === tapMic, micons = said.filter(k => k === 'micon').length;
    // blocked after a tap (iPhone has no userActivation): how to allow it, not "tap Microphone on"
    N.mic.getTracks().forEach(t => t.stop()); N.mic = null; said.length = 0;
    md.getUserMedia = async () => { const e = new Error('blocked'); e.name = 'NotAllowedError'; throw e; }; await N.getMic(true); const blocked = said.slice();
    // (Round V, owner 13 Oct, a FaceTime call held the iPhone's microphone) busy: say a call or app is using it, asked once per tap
    said.length = 0; let busyAsks = 0; md.getUserMedia = async () => { busyAsks++; const e = new Error('busy'); e.name = 'NotReadableError'; throw e; }; await N.getMic(true); const busy = said.slice();
    // (Round V, owner 13 Oct: "when I tap on mic, nothing appears", no call anywhere) the iPhone ends the microphone when the
    // game goes to the background; the game kept the dead one, so a tap only flipped mute. Now it says so when it ends,
    // and the Mic button (G.toggleMute) asks afresh for a dead one, even if no "ended" ever came
    // (Round V, owner 13 Oct, every iPhone setting on "Ask" and still nothing) the game's sound mode was iPhone's play-only
    // "playback", where it never asks for the microphone: while asking and while the microphone is on it is
    // "play-and-record", and back to "playback" when the microphone is let go (the silent switch is still ignored)
    const fakeSess = { type: 'auto' }; Object.defineProperty(navigator, 'audioSession', { value: fakeSess, configurable: true });
    const A = await import('/js/audio.js'); A.micMode('probe', false); const atStart = fakeSess.type;
    let typeAtAsk = null; md.getUserMedia = c => { typeAtAsk = fakeSess.type; return real({ audio: true }); }; N.mic = null;
    await N.getMic(true); const whileOn = fakeSess.type; N._dropMic(); const afterOff = fakeSess.type;
    md.getUserMedia = async () => { typeAtAsk += '|' + fakeSess.type; const e = new Error('blocked'); e.name = 'NotAllowedError'; throw e; }; await N.getMic(true); const afterFail = fakeSess.type;
    const sess = { atStart, typeAtAsk, whileOn, afterOff, afterFail }; delete navigator.audioSession;
    md.getUserMedia = real; said.length = 0; const m1 = await N.getMic(true), t1 = m1.getAudioTracks()[0]; t1.stop(); t1.dispatchEvent(new Event('ended'));
    const endedSaid = said.includes('micstop'), endedDropped = !N.mic;
    const m2 = await N.getMic(true); m2.getAudioTracks()[0].stop(); said.length = 0; let deadAsks = 0; md.getUserMedia = c => { deadAsks++; return real({ audio: true }); };
    await G.toggleMute(); const deadTap = { asks: deadAsks, said: said.slice(), fresh: !!N.mic && N.mic !== m2 && N.micLive };
    N.mic.getTracks().forEach(t => t.stop()); N.mic = null; md.getUserMedia = real;
    // an iPhone home-screen game older than iOS 14.3 has no getUserMedia: say so, not "no microphone"
    said.length = 0; md.getUserMedia = undefined; Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', configurable: true });
    await N.getMic(true); const old = said.slice(); delete navigator.userAgent;
    // a status still tells friends (it was once cut off by a comment): 'left' shares the new status
    const share = G.shareStatus; let shared = 0; G.shareStatus = () => { shared++; }; N.emit('status', { key: 'left' }); G.shareStatus = share;
    md.getUserMedia = real; N.calls.delete('peer-y'); N.cloudOn = false; N.mic = null;
    // 2. Pad → Friends with a player in the room: no button taller than two lines, all inside the card
    Object.defineProperty(N, 'connected', { get: () => true, configurable: true }); N.code = '1234'; N.remotes['peer-z'] = { id: 'peer-z', name: 'Mít', look: {}, friend: 'ABCDE2' };
    G.openPad(0, 'friend'); await wait(500);
    const row = document.querySelector('.prow.roomp'), card = document.querySelector('.pad .card, .modal.pad .card') || document.querySelector('.pad');
    const btns = row ? [...row.querySelectorAll('.btn')] : [], lh = btns.length ? parseFloat(getComputedStyle(btns[0]).lineHeight) || 20 : 20;
    const tall = btns.filter(x => x.getBoundingClientRect().height > lh * 2 + 24).map(x => x.textContent.trim());
    const cr = row ? row.getBoundingClientRect() : null, outside = btns.filter(x => { const q = x.getBoundingClientRect(); return cr && (q.right > cr.right + 1 || q.left < cr.left - 1); }).length;
    // the 🎙️ button in Friends: what happened shows in the panel (blocked here)
    const mute = document.querySelector('#oMute'); md.getUserMedia = async () => { const e = new Error('blocked'); e.name = 'NotAllowedError'; throw e; };
    if (mute) mute.click(); await wait(400); md.getUserMedia = real; N.mic = null;
    const panelSays = (document.querySelector('.pad .online .status') || {}).textContent || '';
    document.querySelector('.modal .x')?.click(); await wait(300);
    delete N.remotes['peer-z']; delete N.connected; N.code = null;
    // 3. the friend bar and the round buttons under the map never overlap
    // (a pretend friend 13 m away: the game shows the bar by itself, as with a real friend)
    const hud = G.huds[0], chip = hud.q('.friendchip'), me = G.heroes[0].pos; G.partners['peer-q'] = { id: 'peer-q', name: 'Mít', pos: { x: me.x + 13, y: me.y, z: me.z } }; G.huds[0].setCall(true, false, false);
    await wait(600);
    const c = chip.getBoundingClientRect(), hit = [...document.querySelectorAll('.hud .tools .dk, .hud .zoomer button, .hud .mini-wrap, .hud .zoom')].filter(e => e.offsetParent).filter(e => { const q = e.getBoundingClientRect(); return q.left < c.right && c.left < q.right && q.top < c.bottom && c.top < q.bottom; }).map(e => e.className);
    const onScreen = c.width > 60 && c.height > 20 && c.right <= innerWidth + 1 && c.left >= 0, chipText = chip.textContent;
    delete G.partners['peer-q']; G.huds[0].setCall(false, false, false);
    return { first, noMicYet, micAfterTap, after, replaced: replacedFirst, reallyNone, tapAsks, fresh, tapSaid, lateStopped, kept, micons, blocked, busy, busyAsks, sess, endedSaid, endedDropped, deadTap, old, mute: !!mute, panelSays, shared, asksBefore: 1, buttons: btns.length, tall, outside, hit, onScreen, chipText, chip: [c.left, c.top, c.width, c.height].map(Math.round) };
  });
  const errs = P.errors; await P.ctx.close();
  ok((r.first.includes('mictap') || r.first.includes('micdenied')) && !r.first.includes('nomic') && r.noMicYet && r.tapAsks === 1 && r.micAfterTap && r.after.includes('micon') && r.replaced === 1 && r.reallyNone.includes('nomic')
    && r.fresh === 1 && r.tapSaid[0] === 'micask' && r.tapSaid.includes('micon') && r.lateStopped && r.kept && r.micons === 1 && r.blocked.includes('micdenied') && !r.blocked.includes('mictap') && r.busy.includes('micbusy') && !r.busy.includes('mictap') && r.busyAsks === 1
    && r.sess.atStart === 'playback' && r.sess.typeAtAsk === 'play-and-record|play-and-record' && r.sess.whileOn === 'play-and-record' && r.sess.afterOff === 'playback' && r.sess.afterFail === 'playback'
    && r.endedSaid && r.endedDropped && r.deadTap.asks === 1 && r.deadTap.said[0] === 'micask' && r.deadTap.said.includes('micon') && r.deadTap.fresh
    && r.old.includes('micold') && !r.old.includes('nomic') && r.mute && /Safari/.test(r.panelSays) && r.shared === 1
    && r.buttons >= 4 && !r.tall.length && !r.outside && !r.hit.length && r.onScreen && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return 'microphone: "tap 🎙️ Microphone on" (not "no microphone"), not asked again on every tap, on from the button and put into the open call; real "no microphone" still said; #55: a hung try does not block a tap (asks afresh, "Asking…" then on, the late answer stopped), blocked after a tap says how to allow it (also in the Friends panel), an iPhone older than 14.3 is told so; Friends: ' + r.buttons + ' buttons fit, no word broken; the friend bar touches no button';
});

await check('ownerhudocclusion', async () => {
  const rows=[]; const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
  for(const [w,h,lang] of [[320,640,'en'],[390,844,'en'],[320,640,'vi'],[390,844,'vi'],[844,390,'vi'],[820,1180,'en'],[1280,800,'en']]) {
    const P=await open(b,{w,h,lang,touch:true,pre:()=>{
      localStorage.setItem('sv2_playerid','tester000001');localStorage.setItem('sv2_tester',JSON.stringify({at:1,b:'r1'}));
      localStorage.setItem('sv2_live',JSON.stringify({releases:{tester:{on:true,devices:['tester000001']}},festivals:{}}));
    },route:async ctx=>{
      await ctx.route('**/api/live**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({releases:{tester:{on:true,devices:['tester000001']}},festivals:{}})}));
      await ctx.route('**/api/tester**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,k:'0123456789abcdef',rid:'hud-fixture',mine:[],open:[]})}));
    }});await clear(P.page);await P.page.waitForSelector('.testermark');await P.page.evaluate(()=>document.fonts.ready);await P.page.waitForTimeout(500);
    const r=await P.page.evaluate(()=>{
      const go=document.querySelector('.hud .q-go'),mini=document.querySelector('.hud .mini-wrap'),q=document.querySelector('.hud .quest'),a=go.getBoundingClientRect(),hits=[];
      for(const x of [.15,.5,.85])for(const y of [.15,.5,.85])hits.push(go.contains(document.elementFromPoint(a.x+a.width*x,a.y+a.height*y)));
      const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
      return {go:rect(go),mini:rect(mini),quest:rect(q),hits};
    });
    await P.page.evaluate(()=>__sv.openSound(document.querySelector('.dk.snd')));await P.page.waitForTimeout(300);
    r.audio=await P.page.locator('.audio-tray').boundingBox();r.w=w;r.h=h;r.lang=lang;rows.push(r);
    fs.mkdirSync('out/owner-hud-occlusion',{recursive:true});await P.page.screenshot({path:`out/owner-hud-occlusion/${w}-${h}-${lang}.png`});
    const errors=P.errors;await P.ctx.close();ok(!overlaps(r.go,r.mini)&&r.hits.every(Boolean)&&!overlaps(r.audio,r.quest)&&!errors.length,JSON.stringify({row:r,errors}));
  }
  return JSON.stringify(rows);
});

await check('ownerhudmic', async () => {
  const rows=[];
  for(const lang of ['en','vi']) {
    const P=await open(b,{w:320,h:640,lang,touch:true});await clear(P.page);
    await P.page.evaluate(()=>__sv.huds[0].setCall(true,false,true));await P.page.evaluate(()=>document.fonts.ready);await P.page.waitForTimeout(400);
    await P.page.evaluate(()=>__sv.openSound(document.querySelector('.dk.snd')));await P.page.waitForTimeout(250);
    const r=await P.page.evaluate(()=>{
      const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};};
      const q=rect('.hud .quest'),go=rect('.q-go'),mini=rect('.mini-wrap'),audio=rect('.audio-tray'),mic=rect('.dk.call');
      const overlap=(a,b)=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;
      return {questClear:!overlap(go,mini),audioClear:!overlap(q,audio),micBelow:mic.y>=mini.bottom};
    });rows.push({lang,...r});const errors=P.errors;await P.ctx.close();ok(r.questClear&&r.audioClear&&r.micBelow&&!errors.length,JSON.stringify({r,errors}));
  }
  return JSON.stringify(rows);
});

await check('r79bagtiles', async () => {
  // (r79 A1, A2) Bag tiles on a phone, the owner's phone, a computer and with the biggest text: every picture centred in
  // its tile and clear of its name, every name two lines at most; the voices note never shows over an open Pad
  const rows = [];
  for (const [dev, w, h, touch, textSize] of [['phone', 390, 844, true, 0], ['bigphone', 430, 932, true, 2], ['computer', 1280, 800, false, 0]]) {
    const P = await open(b, { w, h, touch, settings: { textSize } }); await clear(P.page);
    await P.page.evaluate(() => { const p = __sv.heroes[0].profile; p.bought = { h_tauhu: 1, h_traicay: 1 }; p.dishes = { ...(p.dishes || {}), pho: 1 }; p.inv = { ...(p.inv || {}), ruby: 1, crystal: 1, fossil: 1, bone: 2, pebble: 4, apple: 3 }; });
    await P.page.evaluate(() => { const n = document.createElement('div'); n.className = 'packbar'; n.innerHTML = '<span>Getting the voices ready… 6%</span><i><b></b></i>'; document.body.appendChild(n); });
    await P.page.evaluate(() => __sv.openPad(0, 'bag')); await P.page.waitForSelector('.pad .slot'); await P.page.waitForTimeout(900);
    const r = await P.page.evaluate(() => {
      const bad = [];
      for (const s of document.querySelectorAll('.pad .slot')) {
        const pic = s.querySelector(':scope > span:not(.sw), :scope > svg, :scope > .kpic, :scope > .art'), lab = s.querySelector(':scope > small');
        if (!pic || !lab) continue;
        const t = s.getBoundingClientRect(), a = pic.getBoundingClientRect(), l = lab.getBoundingClientRect(), name = lab.textContent.trim().slice(0, 24);
        // the drawn shape too (a picture can spill past its box)
        // (owner, 17 Oct AEDT: "the food items are not in centre") and its drawn middle: the box was centred while the drawing
        // inside spilled 13 px to the right
        let drawnBottom = a.bottom, drawnMid = (a.left + a.right) / 2; const g = pic.tagName === 'svg' ? pic : pic.querySelector('svg');
        try { if (g && g.getBBox) { const bb = g.getBBox(), m = g.getScreenCTM(); drawnBottom = Math.max(drawnBottom, (bb.y + bb.height) * m.d + m.f); drawnMid = (bb.x + bb.width / 2) * m.a + m.e; } } catch (e) { }
        const lines = Math.round(l.height / parseFloat(getComputedStyle(lab).lineHeight));
        if (drawnBottom > l.top + 1) bad.push(name + ': picture over name by ' + Math.round(drawnBottom - l.top) + ' px');
        if (lines > 2) bad.push(name + ': ' + lines + ' lines');
        if (Math.abs((a.left + a.right) / 2 - (t.left + t.right) / 2) > 2) bad.push(name + ': picture off centre');
        if (Math.abs(drawnMid - (t.left + t.right) / 2) > 4) bad.push(name + ': drawing ' + Math.round(drawnMid - (t.left + t.right) / 2) + ' px off centre');
        if (l.bottom > t.bottom + 1) bad.push(name + ': name spills out of its tile');
      }
      const pb = document.querySelector('.packbar'), pr = pb.getBoundingClientRect(), top = document.elementFromPoint(pr.left + pr.width / 2, pr.top + pr.height / 2);
      return { tiles: document.querySelectorAll('.pad .slot').length, bad, packbarOver: !!(top && top.closest('.packbar')) || getComputedStyle(pb).opacity !== '0' };
    });
    rows.push(dev + ': ' + r.tiles + ' tiles');
    ok(r.tiles >= 7, dev + ': the seeded Bag should show at least 7 tiles, got ' + r.tiles);
    ok(!r.bad.length, dev + ': ' + r.bad.join('; '));
    ok(!r.packbarOver, dev + ': the voices note shows over the open Pad');
    ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  }
  return rows.join(', ') + '; pictures centred and clear of names, names at most two lines, voices note hidden behind the Pad';
});

await check('r79albumwords', async () => {
  // (r79 A3) Album "Words I learned": each row holds its picture and its hear-again button (44 px or more) inside it, lined
  // up, with no empty white circles (a drawn picture inside the row must not get the row's own white box)
  const rows = [];
  for (const [dev, w, h, touch] of [['phone', 390, 844, true], ['computer', 1280, 800, false]]) {
    const P = await open(b, { w, h, touch }); await clear(P.page);
    await P.page.evaluate(() => { __sv.heroes[0].profile.words = { 'vn:bowl': true, 'vn:pineapple': true, 'vn:corn': true, "au:G'day": true, 'au:Mate': true, 'vs:Hết sảy': true }; __sv.openPad(0, 'album'); });
    await P.page.waitForSelector('.wordlist .wl-row'); await P.page.evaluate(() => document.querySelector('.wordlist').scrollIntoView({ block: 'center' })); await P.page.waitForTimeout(700);
    const r = await P.page.evaluate(() => [...document.querySelectorAll('.wordlist .wl-row')].map(row => {
      const R = row.getBoundingClientRect(), bad = [], name = row.textContent.trim().slice(0, 20);
      const inside = (e, what) => { const a = e.getBoundingClientRect(); if (a.top < R.top - 1 || a.bottom > R.bottom + 1 || a.left < R.left - 1 || a.right > R.right + 1) bad.push(name + ': ' + what + ' outside its row'); return a; };
      const pic = row.querySelector('.wl-pic svg'), say = row.querySelector('.wl-say');
      if (!pic) bad.push(name + ': no picture'); else { const a = inside(pic, 'picture'); if (Math.abs((a.top + a.bottom) / 2 - (R.top + R.bottom) / 2) > 4) bad.push(name + ': picture not lined up'); }
      if (!say) bad.push(name + ': no hear button'); else { const a = inside(say, 'hear button'); if (Math.min(a.width, a.height) < 44) bad.push(name + ': hear button under 44 px'); }
      for (const e of row.querySelectorAll('span, i')) { const cs = getComputedStyle(e); if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.boxShadow !== 'none') bad.push(name + ': a white box inside the row (' + e.className + ')'); }
      return bad;
    }));
    await P.page.locator('.wordlist .wl-say').first().click();
    rows.push(dev + ': ' + r.length + ' rows'); ok(r.length === 6, dev + ': 6 word rows expected, got ' + r.length); ok(!r.flat().length, dev + ': ' + r.flat().join('; '));
    ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  }
  return rows.join(', ') + '; pictures and 44 px hear buttons inside each row, lined up, no empty circles';
});

await check('r79hudtrays', async () => {
  // (r79 A5-A8) the top buttons and the two trays, on two phones, a tablet and a computer: the Audio row opens in one row
  // directly under the speaker (and the chat button beside it), each switch centred under a top button at their spacing; Big pictures and
  // Trick sit level with the player card on a phone and never under the map; zoom in, zoom out and camera view open in one
  // column just left of the View button, the middle one level with it (owner's drawing, 16 Oct); the View button is not the eye
  const rows = [];
  for (const [dev, w, h, touch] of [['phone', 390, 844, true], ['bigphone', 430, 932, true], ['tablet', 820, 1180, true], ['computer', 1280, 800, false]]) {
    const P = await open(b, { w, h, touch }); await clear(P.page);
    await P.page.evaluate(() => { const p = __sv.heroes[0].profile; p.lanterns = { ...(p.lanterns || {}), companion: 'dragon', pet: { feeds: 6, hats: [], fed: Math.floor((Date.now() + 10 * 3600e3) / 864e5) } }; });
    await P.page.waitForTimeout(1500);
    const bad = [];
    const box = (sel, root = document) => { const e = [...root.querySelectorAll(sel)].find(x => !x.hidden && x.getClientRects().length); return e ? e.getBoundingClientRect().toJSON() : null; };
    // A6: the chips beside the player card
    const top = await P.page.evaluate(() => { const H = document.querySelector('.hud'), r = s => { const e = [...H.querySelectorAll(s)].find(x => !x.hidden && x.getClientRects().length); return e && e.getBoundingClientRect().toJSON(); };
      return { small: H.classList.contains('small'), card: r('.pcard'), big: r('.simplesw'), chips: [...H.querySelectorAll('.kidrow .chip')].filter(x => !x.hidden && x.getClientRects().length).map(x => x.getBoundingClientRect().toJSON()), map: r('.mini-wrap') }; });
    if (top.small) {
      const mid = b => (b.top + b.bottom) / 2, c = mid(top.card);
      for (const x of [top.big, ...top.chips]) { if (Math.abs(mid(x) - c) > 3) bad.push('a top button is not level with the player card (' + Math.round(mid(x) - c) + ' px)'); if (x.right > top.map.left - 2 && x.top < top.map.bottom) bad.push('a top button runs under the map'); }
      if (!top.chips.length) bad.push('the Trick chip is missing');
    }
    // A5: the Audio row
    await P.page.locator('.hud .dk.snd').click(); await P.page.waitForSelector('.audio-tray'); await P.page.waitForTimeout(300);
    const au = await P.page.evaluate(() => { const r = e => e.getBoundingClientRect().toJSON(), snd = document.querySelector('.hud .dk.snd'), chat = [...snd.parentElement.querySelectorAll(':scope > .dk')].filter(b => b !== snd && !b.hidden && b.getClientRects().length).map(r).filter(b => Math.abs(b.top - r(snd).top) < 8 && Math.min(Math.abs(b.left - r(snd).right), Math.abs(r(snd).left - b.right)) < 24);
      return { snd: r(snd), mates: chat, sw: [...document.querySelectorAll('.audio-tray .ss-sw > span')].map(r), sideways: document.scrollingElement.scrollWidth > innerWidth + 1 || scrollX !== 0 }; });
    if (au.sideways) bad.push('the open Audio row makes the page scroll sideways');
    const rowR = Math.max(au.snd.right, ...au.mates.map(m => m.right)), rowB = Math.max(au.snd.bottom, ...au.mates.map(m => m.bottom));
    if (au.sw.length !== 3) bad.push('the Audio row should hold 3 switches'); else {
      if (au.sw.some(s => Math.abs(s.top - au.sw[0].top) > 1)) bad.push('the Audio switches are not in one row');
      if (Math.min(...au.sw.map(s => s.top)) < rowB) bad.push('the Audio row is not under the speaker');
      // (owner, 16 Oct, second drawing) each switch sits in a column with a top button: the last under the last top button,
      // the one before under the one before, at the same spacing
      const cx = b => (b.left + b.right) / 2, tops = [au.snd, ...au.mates].sort((p, q) => p.left - q.left).map(cx), sws = au.sw.map(cx).sort((p, q) => p - q);
      for (let k = 1; k <= tops.length; k++) { const d = sws[sws.length - k] - tops[tops.length - k]; if (Math.abs(d) > 2) bad.push('an Audio switch is not centred under its top button (' + Math.round(d) + ' px)'); }
      if (tops.length > 1 && Math.abs((sws[2] - sws[1]) - (tops[1] - tops[0])) > 2) bad.push('the Audio switches are not spaced like the top buttons');
      const xs = au.sw.map(s => s.left).sort((a, c) => a - c); if (Math.abs((xs[1] - xs[0]) - (xs[2] - xs[1])) > 1) bad.push('the Audio switches are not evenly spaced');
    }
    await P.page.keyboard.press('Escape'); await P.page.waitForTimeout(200);
    // A7, A8: the View column
    await P.page.locator('.hud .z-tray').click(); await P.page.waitForTimeout(400);
    const vw = await P.page.evaluate(() => { const r = e => e.getBoundingClientRect().toJSON(), t = document.querySelector('.hud .z-tray');
      return { tray: r(t), btns: [...document.querySelectorAll('.hud .zoomer .ztray > button')].filter(x => x.getClientRects().length).map(r), snd: r(document.querySelector('.hud .dk.snd')), eye: /M5 24c5-9/.test(t.innerHTML) }; });
    if (vw.eye) bad.push('the View button still shows the eye');
    if (vw.btns.length < 3) bad.push('the View column should hold zoom in, zoom out and camera view'); else for (const x of vw.btns) {
      if (x.right > vw.tray.left - 2) bad.push('a View button is not to the left of the View button');
      if (Math.abs((x.left + x.right) / 2 - (vw.btns[0].left + vw.btns[0].right) / 2) > 1) bad.push('the View buttons are not in one straight column');
      if (x.top < vw.snd.bottom && x.bottom > vw.snd.top && x.left < vw.snd.right && x.right > vw.snd.left) bad.push('the View column covers the speaker');
      if (x.top < 0) bad.push('the View column goes off the top');
    }
    // (owner's drawing) the middle one level with the View button, one above and one below
    if (vw.btns.length >= 3) { const mid = vw.btns[1], cy = b => (b.top + b.bottom) / 2; if (Math.abs(cy(mid) - cy(vw.tray)) > 2) bad.push('the middle View button is not level with the View button (' + Math.round(cy(mid) - cy(vw.tray)) + ' px)'); if (!(vw.btns[0].bottom <= vw.tray.top + vw.tray.height / 2 && vw.btns[2].top >= vw.tray.top + vw.tray.height / 2)) bad.push('the View column is not one above and one below'); }
    fs.mkdirSync('out/r79', { recursive: true }); await P.page.screenshot({ path: `out/r79/hudtrays-${dev}.png` });
    rows.push(dev); ok(!bad.length, dev + ': ' + [...new Set(bad)].join('; '));
    ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  }
  return rows.join(', ') + ': Audio switches each centred under a top button, at their spacing; Big pictures and Trick level with the card; View column left of the camera-icon View button, the middle one level with it';
});

await check('offscreenpanels', async () => {
  // (owner, 17 Oct AEDT) about 190 "button off the screen" tester issues came from devices on r69 to r74, each one window
  // whose buttons below the fold were all reported at once. The tester device's own detector (js/tester-detection.js),
  // run here on the real windows at those devices' sizes, reports none of them: every window's buttons can be scrolled to.
  const SIZES = [['phone', 390, 844, true], ['iPhone', 430, 873, true], ['tablet', 820, 1180, true], ['Android tablet', 1600, 960, true], ['computer', 1260, 1337, false]];
  const bad = [];
  for (const [name, w, h, touch] of SIZES) {
    const P = await open(b, { w, h, touch }); await clear(P.page);
    const r = await P.page.evaluate(async () => {
      const U = await import('/js/ui.js'), D = await import('/js/tester-detection.js'), G = window.__sv, out = {};
      const windows = { grownups: () => U.openGrownups(() => { }), settings: () => U.openQuick(G, 0), play: () => U.openGamesHub(G, 0, () => { }), pad: () => U.openPad(G, 0) };
      for (const [k, openIt] of Object.entries(windows)) {
        document.querySelectorAll('.modal').forEach(m => m.remove()); await openIt(); await new Promise(res => setTimeout(res, 900));
        const top = D.activeReportPanel(document), bs = [...document.querySelectorAll('.modal button, .hud button, .gl button, .dialog button')];
        out[k] = { top: top ? top.className : '', buttons: bs.length, off: bs.filter(x => D.unreachableControl(x, top)).map(x => (x.textContent || '').trim().slice(0, 30)) };
      }
      document.querySelectorAll('.modal').forEach(m => m.remove()); return out;
    });
    for (const [k, v] of Object.entries(r)) { if (!v.top || v.buttons < 3) bad.push(`${name} ${k}: did not open (${v.top || 'no window'}, ${v.buttons} buttons)`); if (v.off.length) bad.push(`${name} ${k}: ${v.off.length} off the screen: ${v.off.slice(0, 5).join(' | ')}`); }
    await P.ctx.close();
  }
  ok(!bad.length, bad.join(' · '));
  return `Grown-ups, Settings, Play and the Pad on 5 screens (phone to computer): every button can be reached`;
});
