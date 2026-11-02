// Sparkle Valley checks: Online and friends: playing together, rooms, cloud and messages.
// Run them through tests/run.mjs (node run.mjs <check>) or tests/suite.mjs, not on their own.
// Moved unchanged from tests/run.mjs (v1.07 split-tests, 2 Nov 2026 AEDT); see tests/checks/README.md.
import { fs, open, clear, start, withEmo, pairKeys, only, want, pause, check, ok, b } from './shared.mjs';

await check('multiplayer', async () => {
  const up = await fetch('http://127.0.0.1:9000/myapp/').then(r => r.ok).catch(() => false);
  if (!up) return 'skipped (no local PeerJS server on 127.0.0.1:9000)';
  // direct link through a local PeerJS server; the cloud relay runs alongside (local broker, or none)
  const peer = () => { window.SV_PEER = { host: '127.0.0.1', port: 9000, path: '/myapp', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; window.__micRequests = 0; const md = navigator.mediaDevices, request = md.getUserMedia.bind(md); md.getUserMedia = options => { window.__micRequests++; return request(options); }; };
  const A = await open(b, { pre: peer, w: 900, h: 640, lang: 'en' }), B = await open(b, { pre: peer, w: 390, h: 760, lang: 'vi', touch: true });
  for (const P of [A, B]) { await clear(P.page); await P.page.evaluate(async () => { window.__Net = (await import('/js/net.js')).Net; }); }
  const code = await A.page.evaluate(async () => __Net.host(__sv.sendHello()));
  await B.page.evaluate(c => { __Net.join(c, __sv.sendHello()); }, code);
  // B is not on A's friend list: B knocks, hears nothing with its microphone off, and A lets B in
  await A.page.waitForSelector('.knockpop [data-in]', { timeout: 60000 });
  await B.page.waitForFunction(() => __Net._heard > 0, null, { timeout: 15000 });
  const door = await B.page.evaluate(() => ({ knocking: __Net.knocking, partners: Object.keys(__sv.partners).length, mic: __Net.mic ? __Net.mic.getAudioTracks().some(t => t.enabled) : 'none' }));
  await A.page.evaluate(() => document.querySelector('.knockpop [data-in]').click());
  await B.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 60000 });
  const inside = await B.page.evaluate(() => ({ knocking: __Net.knocking, mic: __Net.mic ? __Net.mic.getAudioTracks().some(t => t.enabled) : 'none' }));
  // r63 / Round V: admission does not turn on the microphone; only the child's explicit tap may do that.
  const requests = await B.page.evaluate(() => window.__micRequests);
  ok(door.knocking && !door.partners && door.mic === 'none' && !inside.knocking && inside.mic === 'none' && requests === 0, 'knock privacy ' + JSON.stringify({ door, inside, requests }));
  await B.page.locator('.dk.call').click();
  await B.page.waitForFunction(() => __Net.micLive && !__Net.muted && __Net.mic.getAudioTracks()[0].enabled, null, { timeout: 15000 });
  ok(await B.page.evaluate(() => window.__micRequests === 1), 'Mic tap must make exactly one permission request');
  await B.page.locator('.dk.call').click();
  ok(await B.page.evaluate(() => __Net.muted && !__Net.mic.getAudioTracks()[0].enabled && window.__micRequests === 1), 'Mic off must silence the live track without another permission request');
  await A.page.evaluate(async () => { const PG = (await import('/js/world.js')).PLAYGROUND; __sv.heroes[0].place(PG.x, PG.z - 2); }); await B.page.evaluate(async () => { const [x, z] = (await import('/js/world.js')).CITIES.find(c => c.id === 'brisbane').gates[0]; __sv.heroes[0].place(x, z); }); await A.page.waitForTimeout(2500);
  const chip = await B.page.evaluate(() => document.querySelector('.fc-txt').textContent);
  await A.page.evaluate(() => __sv.askFriendToCome(__sv.heroes[0], Object.keys(__sv.partners)[0]));
  await B.page.waitForSelector('.dialog .dch', { timeout: 15000 }); await B.page.evaluate(() => document.querySelector('.dialog .dch').click());
  for (let k = 0; k < 40; k++) { const done = await B.page.evaluate(() => { const h = __sv.heroes[0]; if (!h.walkTo) return true; const dx = h.walkTo.x - h.pos.x, dz = h.walkTo.z - h.pos.z, d = Math.hypot(dx, dz); h.place(h.pos.x + dx / d * Math.min(d - 1, 6), h.pos.z + dz / d * Math.min(d - 1, 6)); return false; }); if (done) break; await B.page.waitForTimeout(250); }
  await B.page.waitForTimeout(1200);
  const d = await B.page.evaluate(() => { const P = Object.values(__sv.partners)[0], h = __sv.heroes[0]; return Math.hypot(P.pos.x - h.pos.x, P.pos.z - h.pos.z); });
  await B.page.evaluate(() => __sv.emote(0, 'hi')); await A.page.waitForTimeout(1200);
  const heard = await A.page.evaluate(() => __sv.bubbles.length);
  const errs = A.errors.concat(B.errors); await A.ctx.close(); await B.ctx.close();
  ok(/\d+ m/.test(chip) && d < 6 && heard > 0 && !errs.length, JSON.stringify({ chip, d, heard, errs }));
  return `knocked with the microphone off, let in, then met at ${d.toFixed(1)} m, talk bubble received`;
});

await check('friendgames', async () => {
  // (r63, owner: "all games of multiplayer should only be between the players"; "the Caro board can be bigger") on a
  // phone: Tiến Lên with one friend seats just the two children (no computer players); a 15 × 15 Caro board from the
  // inviter's choice has 225 squares, each at least 44 px, in a board that scrolls; the invitation window offers sizes
  const r = {};
  for (const [game, size] of [['tienlen', null], ['caro', 15]]) {
    const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
    r[game] = await P.page.evaluate(async ([game, size]) => {
      const G = __sv, wait = ms => new Promise(res => setTimeout(res, ms));
      const online = { mine: 0, names: ['Bé Na', 'Bé Bin'], seed: 'r63test', size: size || undefined, move() { }, next: () => new Promise(() => { }), onMove() { }, all: () => new Promise(() => { }) };
      G.playGameOnline(game, 2, online); await wait(2500);
      // (30 Oct 2026 AEDT) the cards are dealt one at a time now: wait for the deal to finish (up to 8 s more)
      if (game === 'tienlen') for (let k = 0; k < 40 && document.querySelectorAll('.tl-hand .tl-card').length < 13; k++) await wait(200);
      if (game === 'tienlen') { const opp = [...document.querySelectorAll('.tl-opp .tl-p b')].map(e => e.textContent), mine = document.querySelectorAll('.tl-hand .tl-card').length; return { opp, mine, text: document.body.textContent.includes('Anh Ba') || document.body.textContent.includes('Con Vật') }; }
      const cells = [...document.querySelectorAll('.caro-c')], w = cells.length ? cells[0].getBoundingClientRect().width : 0, wrap = document.querySelector('.caro-wrap');
      return { cells: cells.length, w, scrolls: !!wrap && wrap.scrollWidth > wrap.clientWidth, pageWide: document.documentElement.scrollWidth > innerWidth + 1 };
    }, [game, size]);
    r[game].errs = P.errors; await P.ctx.close();
  }
  // the invitation window: level and, for Caro, the board's size
  const Q = await open(b, { w: 390, h: 844, touch: true }); await clear(Q.page);
  const pick = await Q.page.evaluate(async () => { const G = __sv; G.inviteGame('caro', 'nobody'); await new Promise(res => setTimeout(res, 600));
    const sizes = [...document.querySelectorAll('[data-size]')].map(e => +e.dataset.size), lv = document.querySelectorAll('[data-lvl]').length, small = [...document.querySelectorAll('[data-size],[data-lvl]')].filter(e => { const q = e.getBoundingClientRect(); return q.width < 44 || q.height < 44; }).length;
    return { sizes, lv, small }; });
  await Q.page.screenshot({ path: 'out/friendgames-invite.png' }); const qerr = Q.errors; await Q.ctx.close();
  const t = r.tienlen, c = r.caro;
  ok(t.opp.length === 1 && t.opp[0] === 'Bé Bin' && !t.text && t.mine === 13, 'Tiến Lên with one friend: ' + JSON.stringify(t));
  ok(c.cells === 225 && c.w >= 44 && c.scrolls && !c.pageWide, 'Caro 15 × 15 on a phone: ' + JSON.stringify(c));
  ok(pick.sizes.join(',') === '3,6,9,13,15,19' && pick.lv === 5 && !pick.small, 'the invitation window: ' + JSON.stringify(pick));
  const errs = [...t.errs, ...c.errs, ...qerr]; ok(!errs.length, errs.join(' | '));
  return `Tiến Lên with one friend: 2 children, no computer players; Caro 15 × 15: 225 squares of ${c.w.toFixed(0)} px in a scrolling board; the invitation offers 5 levels and 6 board sizes`;
});

await check('joins', async () => {
  // ROAD-017 (Round U, owner 11 Oct: "they are not connecting smoothly, there are different elevations when connecting
  // roads or bridges"): walk the middle of every road in 25 cm steps (and 3 m on into a road it joins, 6 m through a gate): the ground under
  // a child's feet never jumps more than 6 cm, at a junction, a bridge deck or a place's flat level
  const P = await open(b, { w: 800, h: 600 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), G = __sv, out = []; let n = 0;
    for (const R of W.ROADS) {
      const pts = R.pts, ext = (a, b2, d) => { const L = Math.hypot(b2[0] - a[0], b2[1] - a[1]) || 1; return [a[0] + (a[0] - b2[0]) / L * d, a[1] + (a[1] - b2[1]) / L * d]; };
      const joins = q => { const d = W.roadDist(q[0], q[1]); return d.road && d.road !== R && d.d < d.road.w / 2 ? q : null; };
      // (and 6 m on through a gate into the place it leads to)
      const g = R.gates || [], into = (end, a, b2) => g[end] ? ext(a, b2, 6) : joins(ext(a, b2, 3));
      const line = R.loop ? pts.concat([pts[0]]) : [into(0, pts[0], pts[1]), ...pts, into(1, pts[pts.length - 1], pts[pts.length - 2])].filter(Boolean);
      let prev = null;
      for (let i = 0; i < line.length - 1; i++) { const [ax, az] = line[i], [bx, bz] = line[i + 1], m = Math.ceil(Math.hypot(bx - ax, bz - az) / .25);
        for (let k = 0; k <= m; k++) { const x = ax + (bx - ax) * k / m, z = az + (bz - az) * k / m, y = G.world.groundAt(x, z); n++; if (prev != null && Math.abs(y - prev) > .06) { out.push(`${R.id}: ${(Math.abs(y - prev) * 100).toFixed(0)} cm step at ${x.toFixed(0)},${z.toFixed(0)}`); prev = null; break; } prev = y; } }
    }
    return { out, n };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.out.length && r.n > 5000 && !errs.length, r.out.slice(0, 12).join(' | ') + JSON.stringify(errs));
  return `${r.n} steps along every road and into every junction and bridge: no step over 6 cm (ROAD-017)`;
});

await check('friendstab', async () => {
  // (Round V, owner 13 Oct) Pad → Friends: "My friends" folds away and stays folded; a friend who accepts and comes into the
  // room closes the page (it stayed open in front of the valley); a game starting closes it too
  const P = await open(b, { w: 390, h: 760, touch: true, settings: { online: true } }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, wait = ms => new Promise(r => setTimeout(r, ms)), N = (await import('/js/net.js')).Net, S = await import('/js/state.js');
    let status; const share = N.friendsShare; S.settings.friendsOn = true;
    N.friendsShare = value => { status = value; }; G.shareStatus(); N.friendsShare = share;
    const sharedMap = status?.map === N.mapVersion;
    const oldFriends = S.settings.friends;
    S.settings.friends = [{ code: 'TEST01', name: 'Map friend' }];
    N.friends.status.TEST01 = { online: true, room: '123456', map: 'different-map', seen: Date.now() };
    const body = document.createElement('div'); document.body.appendChild(body);
    G.drawOnlinePanel(body, () => {});
    const mismatch = !body.querySelector('[data-joinf]') && !!body.querySelector('[data-mapdiff]');
    N.friends.status.TEST01.map = N.mapVersion; G.drawOnlinePanel(body, () => {});
    const same = !!body.querySelector('[data-joinf]') && !body.querySelector('[data-mapdiff]');
    body.remove(); delete N.friends.status.TEST01; S.settings.friends = oldFriends;
    G.openPad(0, 'friend'); await wait(700);
    const d = document.querySelector('.modal.pad details.friends'); if (!d) return { noBox: true };
    d.querySelector('summary').click(); await wait(200); const foldedSaved = S.settings.friendsFold === true && !d.open;
    document.querySelector('.modal.pad .x').click(); await wait(300); G.openPad(0, 'friend'); await wait(700);
    const stillFolded = !document.querySelector('.modal.pad details.friends').open;
    // a friend comes into the room
    N.remotes['peer-z'] = { name: 'Mít' }; G.onNet && G.onNet(); await wait(300); const closedOnJoin = !document.querySelector('.modal.pad'); delete N.remotes['peer-z'];
    // (Round V) Play together: the page of games with a friend in the room; a tap invites
    N.remotes['peer-z'] = { name: 'Mít' }; const pt = G.openPlayTogether(); await wait(300);
    const ptMade = [...pt.querySelectorAll('.pt-grid')][0], madeIds = ptMade ? [...ptMade.querySelectorAll('[data-g]')].map(x => x.dataset.g) : [], raceN = ([...pt.querySelectorAll('.pt-grid')][1] || { querySelectorAll: () => [] }).querySelectorAll('[data-g]').length;
    let invited = null; const inv0 = G.inviteGame; G.inviteGame = (g, to) => { invited = [g, to]; }; pt.querySelector('[data-g="tienlenbac"]')?.click(); G.inviteGame = inv0; delete N.remotes['peer-z'];
    const together = { made: madeIds.includes('caro') && madeIds.includes('tienlen') && madeIds.includes('tienlenbac'), raceN, invited: !!invited && invited[0] === 'tienlenbac' && invited[1] === 'peer-z' };
    // a game starting
    G.openPad(0, 'friend'); await wait(500); G.closePadNow(); const closedOnStart = !document.querySelector('.modal.pad') && !G.paused;
    S.settings.friendsFold = false;
    return { sharedMap, mismatch, same, foldedSaved, stillFolded, closedOnJoin, closedOnStart, together };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.sharedMap && r.mismatch && r.same && !r.noBox && r.foldedSaved && r.stillFolded && r.closedOnJoin && r.closedOnStart && r.together.made && r.together.raceN > 20 && r.together.invited && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return '"My friends" folds and stays folded; a friend coming into the room closes the Friends page; a game starting closes it; Play together lists the games for friends (Tiến Lên miền Bắc too) and every game to race side by side';
});

await check('tradeclothes', async () => {
  // (Round V, owner 13 Oct: "clothes can be gifted to the other sex or traded with the same sex") the market stall with a
  // friend in the room: to a boy, a girl can only give boys' clothes, as a gift (nothing asked back); with a girl friend
  // clothes trade both ways; what goes out leaves the wardrobe and what comes in is owned
  const P = await open(b, { w: 900, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, wait = ms => new Promise(r => setTimeout(r, ms)), { Net } = await import('/js/net.js'), SH = await import('/js/content/shop.js'), { openTrade } = await import('/js/trade.js'), h = G.heroes[0], p = h.profile;
    const g = SH.CLOTHES.find(it => it.for === 'g' && !it.tester && !Object.values(p.look).includes(it.id)), bo = SH.CLOTHES.find(it => it.for === 'b' && !it.tester && !Object.values(p.look).includes(it.id));
    // (r79, owner 16 Oct) a girl keeps boys' clothes only as wrapped gift boxes (owned.gifts), never in her own clothes
    p.look.set = 'girl'; p.owned.clothes = [...new Set([...(p.owned.clothes || []), g.id])]; p.owned.gifts = [bo.id];
    const sent = []; const send0 = Net.send; Net.send = d => { sent.push(d); };
    Object.defineProperty(Net, 'connected', { get: () => true, configurable: true });
    Net.remotes['peer-b'] = { name: 'Tí', look: { set: 'boy', style: 'shirt' } }; Net.remotes['peer-g'] = { name: 'Na', look: { set: 'girl', style: 'dress' } };
    openTrade(G, h, 'peer-b'); await wait(300);
    const toBoy = [...document.querySelectorAll('.trade [data-givec]')].map(x => x.dataset.givec), askBoy = document.querySelectorAll('.trade [data-wantc]').length, noteBoy = !!document.querySelector('.trade .note');
    document.querySelector(`.trade [data-givec="${bo.id}"]`)?.click(); await wait(100); document.querySelector('.trade [data-want="apple"]')?.click(); await wait(100);
    document.querySelector('#trSend').click(); await wait(200); const refusedAsk = !sent.some(d => d.t === 'offer');
    document.querySelector('#trClear')?.click(); await wait(100); document.querySelector(`.trade [data-givec="${bo.id}"]`)?.click(); await wait(100); document.querySelector('#trSend').click(); await wait(200);
    const gift = sent.find(d => d.t === 'offer'); document.querySelectorAll('.modal').forEach(m => m.remove());
    openTrade(G, h, 'peer-g'); await wait(300);
    const toGirl = [...document.querySelectorAll('.trade [data-givec]')].map(x => x.dataset.givec), askGirl = document.querySelectorAll('.trade [data-wantc]').length;
    document.querySelectorAll('.modal').forEach(m => m.remove()); G.paused = false;
    delete Net.remotes['peer-b']; delete Net.remotes['peer-g']; delete Net.connected; Net.send = send0;
    return { toBoyOnlyBoys: toBoy.length > 0 && toBoy.every(id => SH.forSet(SH.ITEM[id], 'boy')) && !toBoy.includes(g.id), askBoy, noteBoy, refusedAsk, gift: !!gift && (gift.give.clothes || []).includes(bo.id) && !Object.keys(gift.want.items || {}).length && !gift.want.coins, toGirl: toGirl.includes(g.id), askGirl };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.toBoyOnlyBoys && !r.askBoy && r.noteBoy && r.refusedAsk && r.gift && r.toGirl && r.askGirl > 0 && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return 'to a boy a girl can give boys\' clothes as a gift only (asking for something back is refused); with a girl friend clothes trade both ways';
});

await check('coop', async () => {
  // together quests (js/coop.js): in a room with a friend both devices get the same 3 places from the room code; a
  // place counts only with the friend within 15 m; all 3 give coins and the next quest. (A pretend friend here; the
  // real two-device path is the same positions the multiplayer and cloud checks already carry.)
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], N = (await import('/js/net.js')).Net, C = await import('/js/coop.js'), W = await import('/js/world.js'), S = await import('/js/state.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    const same = C.questFor('4321', 0).join() === C.questFor('4321', 0).join() && C.questFor('4321', 0).join() !== C.questFor('4321', 1).join();
    Object.defineProperty(N, 'connected', { get: () => true, configurable: true }); N.code = '4321';
    const friend = { id: 'peer-x', pos: { x: 0, y: 0, z: 0 } }; G.partners['peer-x'] = friend;
    G.coop.tick(); const quest = G.coop.quest, coins0 = S.farm.coins;
    const spot = id => { // a point inside the place, found from the map
      for (let r2 = 0; r2 < W.HALF; r2 += 4) for (let a = 0; a < 6.28; a += .5) { const x = Math.cos(a) * r2, z = Math.sin(a) * r2; if (W.regionAt(x, z) === id) return [x, z]; }
      for (let x = -W.HALF + 10; x < W.HALF - 10; x += 3) for (let z = -W.HALF + 10; z < W.HALF - 10; z += 3) if (W.regionAt(x, z) === id) return [x, z]; // (round T: the whole valley, from the map's size)
    };
    const [ax, az] = spot(quest[0]); h.place(ax, az); friend.pos = { x: ax + 40, y: h.pos.y, z: az }; await wait(200); G.coop.tick();
    const alone = !!G.coop.done[quest[0]];
    friend.pos = { x: ax + 5, y: h.pos.y, z: az }; G.coop.tick(); const together = !!G.coop.done[quest[0]];
    for (const id of quest.slice(1)) { const [x, z] = spot(id); h.place(x, z); friend.pos = { x: x + 3, y: h.pos.y, z }; await wait(150); G.coop.tick(); }
    const after = { coins: S.farm.coins - coins0, next: G.coop.count, newQuest: G.coop.quest.join() !== quest.join() };
    // (visiting the village can start a story scene; close it, as a child would, before opening the Pad)
    document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false;
    G.openPad(0, 'log'); await wait(400); const shown = !!document.querySelector('.pad-body') && /Together quest/.test(document.querySelector('.pad-body').textContent);
    document.querySelector('.modal .x')?.click();
    delete G.partners['peer-x']; delete N.connected; N.code = null;
    return { same, quest, alone, together, after, shown };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.same && r.quest.length === 3 && !r.alone && r.together && r.after.coins === 15 && r.after.next === 1 && r.after.newQuest && r.shown && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `room 4321's quest: ${r.quest.join(', ')}; a place counts only with the friend near (40 m away: no, 5 m: yes); all 3 gave coins and a new quest`;
});

await check('netgames', async () => {
  // games with friends online (js/netgames.js, round G), two devices through the cloud relay: A invites B to Caro from
  // Pad → Friends, B taps Play, both boards show each move, A wins on both screens; then Oẳn tù tì with everyone:
  // both pick, both see both hands, first to 3 points wins
  const up = await new Promise(r => { const ws = new WebSocket('ws://127.0.0.1:9001/', 'mqtt'); const t = setTimeout(() => r(false), 2000); ws.onopen = () => { clearTimeout(t); ws.close(); r(true); }; ws.onerror = () => { clearTimeout(t); r(false); }; });
  if (!up) return 'skipped (no local MQTT broker on 127.0.0.1:9001)';
  const pre = () => { window.SV_PEER = { host: '127.0.0.1', port: 9099, path: '/nope', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; };
  const A = await open(b, { pre, w: 900, h: 700, lang: 'en', settings: { friendCode: 'GAMEA2', friendsOn: true, autoMeet: false, friends: [{ code: 'GAMEB3', name: 'Bin' }] } });
  const B = await open(b, { pre, w: 390, h: 760, lang: 'vi', touch: true, settings: { friendCode: 'GAMEB3', friendsOn: true, autoMeet: false, friends: [{ code: 'GAMEA2', name: 'Na' }] } });
  await A.page.evaluate(() => { __sv.heroes[0].profile.name = 'Host Demo'; });
  await B.page.evaluate(() => { __sv.heroes[0].profile.name = 'Guest Demo'; });
  await pairKeys(A, B);
  for (const P of [A, B]) { await clear(P.page); await P.page.evaluate(async () => { window.__Net = (await import('/js/net.js')).Net; }); }
  await A.page.evaluate(async () => __Net.host(__sv.sendHello())); await A.page.evaluate(() => __sv.shareStatus());
  await B.page.waitForFunction(() => { const s = __Net.friends.status.GAMEA2; return s && s.online && s.room; }, null, { timeout: 30000 });
  await B.page.evaluate(() => { __sv.openPad(0, 'friend'); }); await B.page.waitForSelector('[data-joinf]'); await B.page.evaluate(() => document.querySelector('[data-joinf]').click());
  await B.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 45000 });
  await A.page.waitForFunction(() => Object.keys(__Net.remotes).length > 0, null, { timeout: 30000 });
  for (const P of [A, B]) await P.page.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false; });
  const waitInvitation=async stage=>{
    try{await B.page.waitForSelector('.dialog .dch',{timeout:20000});}
    catch(error){
      const peers=await Promise.all([A,B].map(async P=>P.page.evaluate(async()=>({session:__sv.netGames.session?{game:__sv.netGames.session.game,mine:__sv.netGames.session.mine,seats:__sv.netGames.session.seats.length}:null,frameOpen:(await import('/js/games/frame.js')).gameOpen(),visibleFrame:!!document.querySelector('.gl'),dialogs:document.querySelectorAll('.dialog').length,remotes:Object.keys(__Net.remotes).length,room:!!__Net.room}))));
      throw Error(stage+' invitation was not visible: '+JSON.stringify(peers)+'; '+error.message);
    }
  };
  // Caro: A asks from the Friends tab's Play together (#741, v1.06: every game with friends is inside it), B says yes
  await A.page.evaluate(async () => { __sv.openPad(0, 'friend'); await new Promise(r => setTimeout(r, 500)); document.querySelector('.pad [data-together]').click(); await new Promise(r => setTimeout(r, 300)); document.querySelector('.playtogether [data-g="caro"]').click(); await new Promise(r => setTimeout(r, 400)); document.querySelector('.gamelevel [data-size="3"]').click(); document.querySelector('.gamelevel [data-lvl="1"]').click(); });
  await waitInvitation('Caro'); const ask = await B.page.evaluate(() => document.querySelector('.dialog .dtext').textContent); await B.page.evaluate(() => document.querySelector('.dialog .dch').click());
  for (const P of [A, B]) { await P.page.waitForSelector('.gl .caro', { timeout: 20000 }); ok(await P.page.locator('.caro-c').count() === 9, 'Selected 3 × 3 board must reach both players'); }
  // (a placed piece is marked .put: its emoji is swapped for a drawing, so the text is empty)
  const tap = async (P, i) => { await P.page.waitForFunction(i => { const c = document.querySelectorAll('.caro-c')[i]; return c && !c.classList.contains('put'); }, i); await P.page.evaluate(i => document.querySelectorAll('.caro-c')[i].click(), i); };
  const seen = async (P, i) => P.page.waitForFunction(i => document.querySelectorAll('.caro-c')[i].classList.contains('put'), i, { timeout: 20000 });
  for (const [P, Q, i] of [[A, B, 0], [B, A, 3], [A, B, 1], [B, A, 4], [A, B, 2]]) {
    await tap(P, i); await seen(Q, i);
    const piece = P === A ? '🌸' : '🍀';
    for (const R of [A, B]) await R.page.waitForFunction(({i,piece}) => [...document.querySelectorAll('.caro-c')[i].querySelectorAll('[data-e]')].some(e => e.dataset.e === piece), {i,piece}, {timeout:10000});
  }
  for (const P of [A, B]) await P.page.waitForSelector('.gl-win', { timeout: 20000 });
  const caro = { a: await A.page.evaluate(() => document.querySelector('.gl-win p').textContent), b: await B.page.evaluate(() => document.querySelector('.gl-win p').textContent), wonCells: await B.page.evaluate(() => document.querySelectorAll('.caro-c.win').length) };
  ok(/Host Demo/.test(caro.a) && /Host Demo/.test(caro.b), 'Same assigned player must win on both boards: '+JSON.stringify(caro));
  // The celebration installs its outside-tap listener after400ms. Do not remove its DOM
  // before the real frame/session resolves, or the next invitation can be rejected as busy.
  for (const P of [A, B]) {
    await P.page.waitForTimeout(500);
    await P.page.evaluate(() => document.querySelector('.gl-tapout')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
    await P.page.waitForFunction(async()=>!(await import('/js/games/frame.js')).gameOpen()&&!__sv.netGames.session,null,{timeout:10000});
    await clear(P.page);
  }
  // Oẳn tù tì with everyone: A rock, B scissors, three times
  await A.page.evaluate(async () => { __sv.openPad(0, 'friend'); await new Promise(r => setTimeout(r, 500)); document.querySelector('.pad [data-together]').click(); await new Promise(r => setTimeout(r, 300)); document.querySelector('.playtogether [data-g="oantuti"]').click(); await new Promise(r => setTimeout(r, 400)); document.querySelector('.gamelevel [data-lvl="1"]')?.click(); });
  await waitInvitation('Oan tu ti'); await B.page.evaluate(() => document.querySelector('.dialog .dch').click());
  for (const P of [A, B]) await P.page.waitForSelector('.gl .rps-room', { timeout: 20000 });
  let hands = null;
  for (let round = 0; round < 3; round++) {
    for (const [P, k] of [[A, 0], [B, 2]]) { await P.page.waitForFunction(() => document.querySelectorAll('.gl .choice:not([disabled])').length === 3, null, { timeout: 20000 }); await P.page.evaluate(k => document.querySelectorAll('.gl .choice')[k].click(), k); }
    await A.page.waitForFunction(src => { eval(src); return [...document.querySelectorAll('.rps-p .h')].every(e => !/❔|✅/.test(window.withEmo(e))); }, withEmo, { timeout: 20000 });
    if (round === 0) hands = await B.page.evaluate(async src => { eval(src); await new Promise(r => setTimeout(r, 300)); return [...document.querySelectorAll('.rps-p .h')].map(e => window.withEmo(e)); }, withEmo);
  }
  for (const P of [A, B]) await P.page.waitForSelector('.gl-win', { timeout: 20000 });
  const rps = { a: await A.page.evaluate(() => document.querySelector('.gl-win p').textContent), b: await B.page.evaluate(() => document.querySelector('.gl-win p').textContent) };
  const errs = [...A.errors, ...B.errors]; await A.ctx.close(); await B.ctx.close();
  ok(/Caro/.test(ask) && /wins/.test(caro.a) && /thắng/.test(caro.b) && caro.wonCells === 3 && hands && hands.join('') === '✊✌️' && /champion/i.test(rps.a) && /thắng/.test(rps.b) && !errs.length, JSON.stringify({ ask, caro, hands, rps, errs }));
  return `Caro on two devices: "${ask.slice(0, 40)}…", every move on both boards, "${caro.a}" / "${caro.b}"; Oẳn tù tì: both hands shown (${hands.join(' ')}), "${rps.a}" / "${rps.b}"`;
});

await check('together', async () => {
  // playing together online (owner, round G/H), two devices through the cloud relay: a story read together (A turns the
  // page, B's page turns too); any game side by side with everyone's stars; following a friend; a pickup taken by one
  // is gone for the other ("… got it first"); and the real place opens inside the game, not in another app
  const up = await new Promise(r => { const ws = new WebSocket('ws://127.0.0.1:9001/', 'mqtt'); const t = setTimeout(() => r(false), 2000); ws.onopen = () => { clearTimeout(t); ws.close(); r(true); }; ws.onerror = () => { clearTimeout(t); r(false); }; });
  if (!up) return 'skipped (no local MQTT broker on 127.0.0.1:9001)';
  const pre = () => { window.SV_PEER = { host: '127.0.0.1', port: 9099, path: '/nope', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; };
  const A = await open(b, { pre, w: 900, h: 700, lang: 'en', settings: { friendCode: 'TOGA22', friendsOn: true, autoMeet: false, friends: [{ code: 'TOGB33', name: 'Bin' }] } });
  const B = await open(b, { pre, w: 900, h: 700, lang: 'en', settings: { friendCode: 'TOGB33', friendsOn: true, autoMeet: false, friends: [{ code: 'TOGA22', name: 'Na' }] } });
  await pairKeys(A, B);
  for (const P of [A, B]) { await clear(P.page); await P.page.evaluate(async () => { window.__Net = (await import('/js/net.js')).Net; }); }
  await A.page.evaluate(async () => __Net.host(__sv.sendHello())); await A.page.evaluate(() => __sv.shareStatus());
  await B.page.waitForFunction(() => { const s = __Net.friends.status.TOGA22; return s && s.online && s.room; }, null, { timeout: 30000 });
  await B.page.evaluate(() => { __sv.openPad(0, 'friend'); }); await B.page.waitForSelector('[data-joinf]'); await B.page.evaluate(() => document.querySelector('[data-joinf]').click());
  await B.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 45000 });
  await A.page.waitForFunction(() => Object.values(__sv.partners).some(P => P.pos.y > -40), null, { timeout: 30000 });
  const clean = async () => { for (const P of [A, B]) await P.page.evaluate(() => { document.querySelectorAll('.modal, .dialog, .gl, .theatre').forEach(m => m.remove()); __sv.paused = false; __sv.netGames.leave(); }); await A.page.waitForTimeout(600); };
  await clean();
  const accept = async () => { await B.page.waitForSelector('.dialog .dch', { timeout: 20000 }); await B.page.evaluate(() => document.querySelector('.dialog .dch').click()); };
  // 1. a story together
  await A.page.evaluate(() => __sv.inviteGame('tale-banhchung', null, 1)); await accept();
  for (const P of [A, B]) await P.page.waitForSelector('.theatre .th-text', { timeout: 20000 });
  await A.page.evaluate(() => document.querySelector('.theatre .th-next').click()); await A.page.waitForTimeout(400); await A.page.evaluate(() => document.querySelector('.theatre .th-next').click());
  await B.page.waitForFunction(() => /princes searched far and wide|youngest prince/.test(document.querySelector('.theatre .th-text').textContent), null, { timeout: 15000 }).catch(() => { });
  const tale = { a: await A.page.evaluate(() => document.querySelector('.theatre .th-text').textContent.slice(0, 40)), b: await B.page.evaluate(() => document.querySelector('.theatre .th-text').textContent.slice(0, 40)) };
  await clean();
  // 2. any game side by side: both see both names, and a star from A shows on B
  await A.page.evaluate(() => __sv.inviteGame('colors', null, 1)); await accept();
  for (const P of [A, B]) await P.page.waitForSelector('.gl .race', { timeout: 20000 });
  await A.page.evaluate(() => __sv.netGames.move(900, 3));
  await B.page.waitForFunction(() => /⭐3/.test(document.querySelector('.gl .race').textContent), null, { timeout: 15000 }).catch(() => { });
  // (10 Oct) only A's one move may be in the race: a story still winding down must not send its page turns into it
  const stray = await B.page.evaluate(() => [...__sv.netGames.session.moves.keys()].filter(n => n !== 900));
  const race = await B.page.evaluate(src => { eval(src); return window.withEmo(document.querySelector('.gl .race')).replace(/\s+/g, ' ').trim(); }, withEmo);
  await clean();
  // 3. follow a friend: A stands 25 m away, B follows
  await A.page.evaluate(() => { const h = __sv.heroes[0]; h.place(h.pos.x + 25, h.pos.z); });
  await B.page.waitForTimeout(1500);
  const idA = await B.page.evaluate(() => Object.keys(__sv.partners)[0]);
  await B.page.evaluate(id => __sv.followFriend(0, id), idA);
  await B.page.waitForFunction(() => { const P = Object.values(__sv.partners)[0], h = __sv.heroes[0]; return Math.hypot(P.pos.x - h.pos.x, P.pos.z - h.pos.z) < 6; }, null, { timeout: 30000 }).catch(() => { });
  const follow = await B.page.evaluate(() => { const P = Object.values(__sv.partners)[0], h = __sv.heroes[0]; return Math.round(Math.hypot(P.pos.x - h.pos.x, P.pos.z - h.pos.z)); });
  await B.page.evaluate(() => { __sv.heroes[0].followId = null; });
  // 4. first come, first served: A takes a pickup, B's is gone and says who got it
  const pick = await A.page.evaluate(() => { const it = __sv.interactables.find(i => /^g\d+$/.test(i.id) && i.visible()); it.act(__sv.heroes[0], __sv); return it.id; });
  await B.page.waitForFunction(id => { const it = __sv.interactables.find(i => i.id === id); return it && !it.visible() && it.st.by; }, pick, { timeout: 15000 }).catch(() => { });
  const claim = await B.page.evaluate(id => { const it = __sv.interactables.find(i => i.id === id); return { gone: !it.visible(), by: it.st.by || '' }; }, pick);
  // 5. the real place inside the game (playing online means a grown-up turned on Use the internet: no second gate, 10 Oct)
  // (round R privacy, 9 Oct) a grown-up's press and hold first, as it opens Google
  const real = await A.page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); (await import('/js/realworld.js')).openStreetView('opera'); await wait(300); const early = !!document.querySelector('.rvmap iframe'), g = document.querySelector('.rvgate .rv-ok'); if (g) { g.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await wait(1900); } const f = document.querySelector('.rvmap iframe'); return { gate: !!g && !early, direct: !g && early, inGame: !!f, src: f ? f.src.slice(0, 40) : '' }; });
  const errs = [...A.errors, ...B.errors].filter(e => !/maps\.google|google\.com/.test(e)); await A.ctx.close(); await B.ctx.close();
  ok(tale.a === tale.b && /prince/.test(tale.b) && /⭐3/.test(race) && !stray.length && follow < 6 && claim.gone && claim.by && real.direct && real.inGame && !errs.length, JSON.stringify({ tale, race, stray, follow, claim, real, errs }));
  return `story page turned on both ("${tale.b}…"); side by side: "${race}"; following ended ${follow} m behind; pickup ${pick} gone for B ("${claim.by} got it first"); the real place opens in the game straight away (Use the internet is on: owner, 10 Oct; the gate itself is checked by realphotos)`;
});

await check('togetheragain', async () => {
  // v1.05 tester reports, two devices through the cloud relay: #741 every game with friends is inside Play together (none
  // outside it on the Friends page) and Follow sits on the friend's own row of "Where are my friends?"; #740 saying yes
  // to an invitation goes straight into the game (no Friends page left in front); #742/#743 Play again after a game
  // with a friend starts another round together, whether one taps it first or both at once; #744 a friend riding a
  // bicycle or a buffalo is seen on it, and the ride moves with them and stays where they get off
  const up = await new Promise(r => { const ws = new WebSocket('ws://127.0.0.1:9001/', 'mqtt'); const t = setTimeout(() => r(false), 2000); ws.onopen = () => { clearTimeout(t); ws.close(); r(true); }; ws.onerror = () => { clearTimeout(t); r(false); }; });
  if (!up) return 'skipped (no local MQTT broker on 127.0.0.1:9001)';
  const pre = () => { window.SV_PEER = { host: '127.0.0.1', port: 9099, path: '/nope', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; };
  const A = await open(b, { pre, w: 900, h: 700, lang: 'en', settings: { friendCode: 'AGNA22', friendsOn: true, autoMeet: false, friends: [{ code: 'AGNB33', name: 'Bin' }] } });
  const B = await open(b, { pre, w: 430, h: 873, lang: 'vi', touch: true, settings: { friendCode: 'AGNB33', friendsOn: true, autoMeet: false, friends: [{ code: 'AGNA22', name: 'Na' }] } });
  await pairKeys(A, B);
  for (const P of [A, B]) { await clear(P.page); await P.page.evaluate(async () => { window.__Net = (await import('/js/net.js')).Net; window.__frame = await import('/js/games/frame.js'); }); }
  await A.page.evaluate(async () => __Net.host(__sv.sendHello())); await A.page.evaluate(() => __sv.shareStatus());
  await B.page.waitForFunction(() => { const s = __Net.friends.status.AGNA22; return s && s.online && s.room; }, null, { timeout: 60000 });
  await B.page.evaluate(() => { __sv.openPad(0, 'friend'); }); await B.page.waitForSelector('[data-joinf]', { timeout: 60000 }); await B.page.evaluate(() => document.querySelector('[data-joinf]').click());
  await B.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 60000 });
  await A.page.waitForFunction(() => Object.values(__sv.partners).some(P => P.pos.y > -40), null, { timeout: 60000 });
  await B.page.waitForFunction(() => Object.values(__sv.partners).some(P => P.pos.y > -40), null, { timeout: 60000 });
  const clean = async () => { for (const P of [A, B]) await P.page.evaluate(() => { document.querySelectorAll('.modal, .dialog, .gl, .theatre, .vc-pop').forEach(m => m.remove()); __sv.paused = false; __sv.netGames.leave(); }); await A.page.waitForTimeout(600); };
  await clean();
  const accept = async () => { await B.page.waitForSelector('.dialog .dch', { timeout: 20000 }); await B.page.evaluate(() => document.querySelector('.dialog .dch').click()); };
  // #741: the Friends page has Play together and no game buttons of its own; Play together holds them all
  const tab = await A.page.evaluate(async () => { __sv.openPad(0, 'friend'); await new Promise(r => setTimeout(r, 500)); const out = { outside: [...document.querySelectorAll('.pad [data-caro], .pad [data-rpsall], .pad [data-allg]')].length, together: !!document.querySelector('.pad [data-together]') };
    document.querySelector('.pad [data-together]').click(); await new Promise(r => setTimeout(r, 300)); out.inside = [...document.querySelectorAll('.playtogether [data-g]')].map(b => b.dataset.g); return out; });
  const need = ['caro', 'oantuti', 'memory', 'tienlen', 'tienlenbac'], missing = need.filter(id => !tab.inside.includes(id));
  await clean();
  const find = await B.page.evaluate(async () => { const r = __sv.findFriend(0); await new Promise(r => setTimeout(r, 200)); const rows = [...document.querySelectorAll('.friendfind .ff-row')]; const f = rows[0] && rows[0].querySelector('[data-follow]');
    const out = { said: r, rows: rows.length, follow: f ? f.textContent.trim() : null, big: f ? f.getBoundingClientRect().height : 0 }; if (f) f.click(); await new Promise(r => setTimeout(r, 200)); out.following = __sv.heroes[0].followId === Object.keys(__sv.partners)[0]; __sv.heroes[0].followId = null; __sv.heroes[0].goal = null; return out; });
  await clean();
  // #740: B has the Friends page open on its Play together list, says yes to Tiến Lên miền Bắc: the game is in front,
  // with no Friends page or Play together list left over it
  await B.page.evaluate(() => __sv.openPad(0, 'friend')); await B.page.waitForSelector('.modal.pad [data-together]'); await B.page.evaluate(() => document.querySelector('.pad [data-together]').click()); await B.page.waitForSelector('.modal.playtogether');
  await A.page.evaluate(() => __sv.inviteGame('tienlenbac', null, 1)); await accept();
  await B.page.waitForSelector('.gl', { timeout: 20000 }); await B.page.waitForTimeout(1500);
  const into = await B.page.evaluate(() => { const g = document.querySelector('.gl'), r = g.getBoundingClientRect(), top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { pads: document.querySelectorAll('.modal.pad').length, modals: [...document.querySelectorAll('.modal:not(.out)')].map(m => m.className), front: !!top && !!top.closest('.gl') }; });
  for (const P of [A, B]) { await P.page.evaluate(() => document.querySelector('.gl .gl-x')?.click()); await P.page.waitForFunction(() => !__frame.gameOpen(), null, { timeout: 10000 }).catch(() => { }); }
  await clean();
  // #742/#743: a 3 × 3 Caro the inviter wins, then Play again
  const idB = await A.page.evaluate(() => Object.keys(__sv.partners)[0]);
  const state = () => Promise.all([A, B].map(P => P.page.evaluate(() => ({ session: __sv.netGames.session && __sv.netGames.session.gid, open: __frame.gameOpen(), gl: document.querySelectorAll('.gl').length, dialogs: [...document.querySelectorAll('.dialog')].map(d => d.textContent.slice(0, 60)), toasts: [...document.querySelectorAll('.toast')].map(t => t.textContent.slice(0, 60)), again: __sv._again ? __sv._again.game : null }))));
  const caro = async () => {
    for (const P of [A, B]) { await P.page.waitForSelector('.gl .caro', { timeout: 25000 }).catch(async e => { throw Error('no Caro board: ' + JSON.stringify(await state())); }); await P.page.waitForFunction(() => document.querySelectorAll('.caro-c').length === 9 && !document.querySelector('.caro-c.put'), null, { timeout: 10000 }); }
    const [first, second] = (await A.page.evaluate(() => __sv.netGames.session.mine)) === 0 ? [A, B] : [B, A];   // the one who invited moves first
    const tap = async (P, i) => { await P.page.waitForFunction(i => { const c = document.querySelectorAll('.caro-c')[i]; return c && !c.classList.contains('put'); }, i); await P.page.evaluate(i => document.querySelectorAll('.caro-c')[i].click(), i); };
    for (const [P, Q, i] of [[first, second, 0], [second, first, 3], [first, second, 1], [second, first, 4], [first, second, 2]]) { await tap(P, i); await Q.page.waitForFunction(i => document.querySelectorAll('.caro-c')[i].classList.contains('put'), i, { timeout: 20000 }); }
    for (const P of [A, B]) { await P.page.waitForSelector('.gl-win .gl-nx.again', { timeout: 20000 }); await P.page.waitForTimeout(500); }
    return Promise.all([A, B].map(P => P.page.evaluate(() => __sv.netGames.session && __sv.netGames.session.gid)));
  };
  const playAgain = P => P.page.evaluate(() => document.querySelector('.gl-win .gl-nx.again').click());
  await A.page.evaluate(id => __sv.inviteGame('caro', id, 1, 3), idB); await accept();
  const g1 = await caro();
  // one taps Play again first (B), the other a few seconds later (A, its game still on the last screen when B asks)
  await playAgain(B); await B.page.waitForTimeout(3000);
  const waiting = await A.page.evaluate(() => ({ open: __frame.gameOpen(), dialogs: document.querySelectorAll('.dialog').length }));
  await playAgain(A);
  const g2 = await caro();
  // both at once
  await Promise.all([playAgain(A), playAgain(B)]);
  const g3 = await caro().catch(e => 'no third game: ' + e.message.split('\n')[0]);
  const after = await Promise.all([A, B].map(P => P.page.evaluate(() => ({ dialogs: document.querySelectorAll('.dialog').length, open: __frame.gameOpen() }))));
  for (const P of [A, B]) { await P.page.evaluate(() => document.querySelector('.gl .gl-x')?.click()); await P.page.waitForFunction(() => !__frame.gameOpen(), null, { timeout: 10000 }).catch(() => { }); }
  await clean();
  // #744: A rides a bicycle, then the buffalo; B sees A on it, the same ride moving with A, and it stays where A gets off
  const bike = await A.page.evaluate(async () => { const G = __sv, h = G.heroes[0], tr = G.traffic, idx = tr.slots.findIndex(s => s.rideable && s.x != null); const sl = tr.slots[idx], [x, z] = tr.where(sl);
    h.place(x + 1.5, z); await new Promise(r => setTimeout(r, 400)); G.interactables.find(i => i.id === 'bike_' + idx || i.id === 'drive_' + idx).act(h, G); await new Promise(r => setTimeout(r, 300));
    for (let k = 0; k < 10; k++) { h.pos.x += .8; await new Promise(r => setTimeout(r, 60)); } return { idx, id: sl.id, x, z, riding: !!h.riding }; });
  const seen = await B.page.waitForFunction(({ idx, x, z }) => { const P = Object.values(__sv.partners)[0], sl = __sv.traffic.slots[idx]; if (!P || !P.ride || !P.ride.v || !sl.v) return false;
    const o = sl.v.o.position, A = P.av.root.position; return P.ride.v === sl.v && sl.taken === P && Math.hypot(o.x - x, o.z - z) > 4 && Math.hypot(o.x - P.pos.x, o.z - P.pos.z) < .6 && Math.hypot(A.x - o.x, A.z - o.z) < 1.5 && A.y > o.y + .2 && { moved: +Math.hypot(o.x - x, o.z - z).toFixed(1), riderUp: +(A.y - o.y).toFixed(2) }; }, bike, { timeout: 20000 }).then(h => h.jsonValue()).catch(() => B.page.evaluate(idx => { const P = Object.values(__sv.partners)[0], sl = __sv.traffic.slots[idx], r = window.__Net.remotes[P.id];
    return { missed: true, s: r && r.s, ride: P.ride ? { key: P.ride.key, slot: !!P.ride.slot, own: !!P.ride.own } : null, slot: sl && { id: sl.id, v: !!sl.v, taken: !!sl.taken }, pos: [P.pos.x, P.pos.z] }; }, bike.idx));
  await A.page.evaluate(() => __sv.heroes[0].dismount());
  const left = await B.page.waitForFunction(({ idx, x, z }) => { const P = Object.values(__sv.partners)[0], sl = __sv.traffic.slots[idx]; return !P.ride && !sl.taken && sl.v && Math.hypot(sl.v.o.position.x - x, sl.v.o.position.z - z) > 4; }, bike, { timeout: 20000 }).then(() => true).catch(() => false);
  const cow = await A.page.evaluate(async () => { const G = __sv, h = G.heroes[0], b = G.world.rideAnimals[0]; h.place(b.mesh.position.x + 2, b.mesh.position.z); await new Promise(r => setTimeout(r, 400)); G.mount(h, b); return b.id; });
  const animal = await B.page.waitForFunction(id => { const P = Object.values(__sv.partners)[0]; if (!P || !P.ride || !P.ride.animal || P.ride.animal.id !== id) return false; const m = P.ride.animal.mesh.position, up = P.av.root.position.y - P.pos.y;
    return Math.hypot(m.x - P.pos.x, m.z - P.pos.z) < .6 && up > 1.4 && { up: +up.toFixed(2) }; }, cow, { timeout: 20000 }).then(h => h.jsonValue()).catch(() => null);
  await A.page.evaluate(() => __sv.heroes[0].dismount());
  const off = await B.page.waitForFunction(id => { const P = Object.values(__sv.partners)[0], b = __sv.world.rideAnimals.find(x => x.id === id); return !P.ride && !b.rider; }, cow, { timeout: 20000 }).then(() => true).catch(() => false);
  // (owner, 1 Nov 2026 AEDT) A rides a bus or tram as a passenger: B sees that vehicle where A sits, and it goes when A gets off
  const pas = await A.page.evaluate(() => { const G = __sv, h = G.heroes[0], sl = G.traffic.slots.find(s => /^(bus|tram)/.test(s.id) && s.v && !s.passenger); if (!sl) return null; sl.passenger = h; return { idx: G.traffic.slots.indexOf(sl), id: sl.id }; });
  const passengerSeen = pas && await B.page.waitForFunction(idx => { const P = Object.values(__sv.partners)[0], sl = __sv.traffic.slots[idx]; return !!P && !!P.ride && !!P.ride.v && sl && P.ride.v === sl.v && Math.hypot(sl.v.o.position.x - P.pos.x, sl.v.o.position.z - P.pos.z) < 3; }, pas.idx, { timeout: 20000 }).then(() => true).catch(() => false);
  if (pas) await A.page.evaluate(idx => { __sv.traffic.slots[idx].passenger = null; }, pas.idx);
  const passengerOff = pas && await B.page.waitForFunction(() => { const P = Object.values(__sv.partners)[0]; return !!P && !P.ride; }, null, { timeout: 20000 }).then(() => true).catch(() => false);
  const errs = [...A.errors, ...B.errors]; await A.ctx.close(); await B.ctx.close();
  const games = [g1, g2, g3];
  ok(!tab.outside && tab.together && !missing.length && find.rows === 1 && find.follow && find.big >= 44 && find.following
    && !into.pads && !into.modals.length && into.front
    && games.every(g => Array.isArray(g) && g[0] && g[0] === g[1]) && new Set(games.map(g => g[0])).size === 3 && waiting.open && !waiting.dialogs && after.every(a => !a.dialogs)
    && bike.riding && seen && !seen.missed && left && animal && off && pas && passengerSeen && passengerOff && !errs.length, JSON.stringify({ tab, missing, find, into, games, waiting, after, bike, seen, left, cow, animal, off, pas, passengerSeen, passengerOff, errs }));
  return `Friends page: no game buttons outside Play together (${tab.inside.length} inside, ${need.join(', ')} among them); "${find.follow}" on the friend's row (${Math.round(find.big)} px) follows; a yes to Tiến Lên miền Bắc leaves no Friends page in front; Play again tapped first by one, then by both at once: two more Caro rounds together; B sees A on the ${bike.id} (moved ${seen.moved} m, rider ${seen.riderUp} m up) and on the buffalo (${animal.up} m up), each left where A got off`;
});

await check('ownertogetherstart', async () => {
  const up = await new Promise(r => { const ws = new WebSocket('ws://127.0.0.1:9001/', 'mqtt'); const t = setTimeout(() => r(false), 2000); ws.onopen = () => { clearTimeout(t); ws.close(); r(true); }; ws.onerror = () => { clearTimeout(t); r(false); }; });
  if (!up) return 'skipped (no local MQTT broker on 127.0.0.1:9001)';
  const pre = () => { window.SV_PEER = { host: '127.0.0.1', port: 9099, path: '/nope', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; };
  const A = await open(b, { pre, w: 900, h: 700, lang: 'en', settings: { friendCode: 'TGSA22', friendsOn: true, autoMeet: false, friends: [{ code: 'TGSB33', name: 'Bin' }] } });
  const B = await open(b, { pre, w: 900, h: 700, lang: 'en', settings: { friendCode: 'TGSB33', friendsOn: true, autoMeet: false, friends: [{ code: 'TGSA22', name: 'Na' }] } });
  await pairKeys(A, B);
  for (const P of [A, B]) { await clear(P.page); await P.page.evaluate(async () => { window.__Net = (await import('/js/net.js')).Net; }); }
  await A.page.evaluate(async () => __Net.host(__sv.sendHello())); await A.page.evaluate(() => __sv.shareStatus());
  await B.page.waitForFunction(() => { const s = __Net.friends.status.TGSA22; return s && s.online && s.room; }, null, { timeout: 30000 });
  await B.page.evaluate(() => { __sv.openPad(0, 'friend'); }); await B.page.waitForSelector('[data-joinf]'); await B.page.evaluate(() => document.querySelector('[data-joinf]').click());
  await B.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 45000 });
  await A.page.waitForFunction(() => Object.values(__sv.partners).some(P => P.pos.y > -40), null, { timeout: 30000 });
  const clean = async () => { for (const P of [A, B]) await P.page.evaluate(() => { document.querySelectorAll('.modal, .dialog, .gl, .theatre').forEach(m => m.remove()); __sv.paused = false; __sv.netGames.leave(); }); await A.page.waitForTimeout(600); };
  await clean();
  const accept = async () => { await B.page.waitForSelector('.dialog .dch', { timeout: 20000 }); await B.page.evaluate(() => document.querySelector('.dialog .dch').click()); };
  // Cloud sealing and multi-broker delivery can put an initial move before gstart.
  // Hold only the accepted start; ordinary real room messages still travel through the relay.
  await B.page.evaluate(() => { const g=__sv.netGames,receive=g.receive.bind(g);window.__storyRelease=()=>{const start=window.__storyStart;window.__storyStart=null;receive(start);};g.receive=d=>{if(d.t==='gstart'&&d.game==='tale-banhchung'){window.__storyStart=d;return;}if(d.t==='gmove'&&window.__storyStart)window.__earlyStoryMoves=(window.__earlyStoryMoves||0)+1;receive(d);}; });
  await A.page.evaluate(() => __sv.inviteGame('tale-banhchung', null, 1)); await accept();
  await B.page.waitForFunction(()=>!!window.__storyStart);
  await A.page.waitForFunction(()=>!!document.querySelector('.theatre .th-text')?.textContent.trim());
  await A.page.evaluate(()=>document.querySelector('.th-pause').click());
  await A.page.evaluate(()=>document.querySelector('.th-next').click());await A.page.waitForTimeout(400);await A.page.evaluate(()=>document.querySelector('.th-next').click());
  const expected=await A.page.evaluate(()=>__sv.TALES.find(t=>t.id==='banhchung').pages[2][1]);
  await A.page.waitForFunction(expected=>document.querySelector('.th-text')?.textContent.startsWith(expected),expected);
  await B.page.waitForFunction(()=>window.__earlyStoryMoves>=2);
  await B.page.evaluate(()=>window.__storyRelease());
  await B.page.waitForFunction(()=>!!document.querySelector('.theatre .th-text')?.textContent.trim());await B.page.waitForTimeout(2000);
  const states=[];for(const P of [A,B])states.push(await P.page.evaluate(()=>document.querySelector('.th-text p')?.textContent));
  const errs=[...A.errors,...B.errors];await A.ctx.close();await B.ctx.close();
  ok(states.every(s=>s===expected)&&!errs.length,JSON.stringify({expected,states,errs}));
  return 'An accepted delayed story start retains earlier page moves: both real relay peers stay on the inviter’s chosen page; no late initial-page rollback';
});

await check('meet', async () => {
  // friends are told, never moved (round O, owner): two friends on each other's list start playing; each gets a card
  // "🟢 … is playing" and nobody is put in a room by themselves; one taps 📨 Invite (a room starts), the other gets the
  // invitation, taps Join, and they are in one room seeing each other's names. One of them never switched "friends
  // can see me" on: having a friend on the list switches it on from round 28.
  const up = await fetch('http://127.0.0.1:9000/myapp/').then(r => r.ok).catch(() => false);
  if (!up) return 'skipped (no local PeerJS server on 127.0.0.1:9000)';
  const pre = () => { window.SV_PEER = { host: '127.0.0.1', port: 9000, path: '/myapp', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; };
  const A = await open(b, { pre, w: 700, h: 500, settings: { friendCode: 'MEETA2', friendsOn: false, friends: [{ code: 'MEETB3', name: 'Bin' }] } });
  const B = await open(b, { pre, w: 700, h: 500, lang: 'vi', settings: { friendCode: 'MEETB3', friendsOn: true, friends: [{ code: 'MEETA2', name: 'Na' }] } });
  await pairKeys(A, B);
  // (the friend's card is shown once and may already be up: tidy everything else, keep it)
  for (const P of [A, B]) await P.page.evaluate(async () => { document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); __sv.paused = false; window.__Net = (await import('/js/net.js')).Net; });
  await B.page.waitForSelector('.friendnote [data-inv]', { timeout: 90000 });
  const noteText = await B.page.textContent('.friendnote');
  await B.page.waitForTimeout(10000);
  const alone = await Promise.all([A, B].map(P => P.page.evaluate(() => ({ partners: Object.keys(__sv.partners).length, role: __Net.role }))));
  await B.page.click('.friendnote [data-inv]');
  await A.page.waitForSelector('.dialog .dchoices button', { timeout: 60000 }); await A.page.waitForTimeout(600); await A.page.evaluate(() => document.querySelector('.dialog .dchoices button').click()); // (the choices bounce in)
  const met = P => P.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 90000 });
  await Promise.all([met(A), met(B)]);
  const r = await Promise.all([A, B].map(P => P.page.evaluate(() => ({ role: __Net.role, code: __Net.code, names: Object.values(__sv.partners).map(p => p.name) }))));
  const errs = A.errors.concat(B.errors); await A.ctx.close(); await B.ctx.close();
  ok(alone.every(x => !x.partners && !x.role), 'friends were put in a room by themselves: ' + JSON.stringify(alone));
  ok(r[1].role === 'host' && r[0].role === 'guest' && r[0].code === r[1].code && !errs.length, JSON.stringify({ r, errs }));
  return `"${noteText.replace(/\s+/g, ' ').trim().slice(0, 60)}…"; nobody moved for 10 s; 📨 Invite → Join: room ${r[1].code}, names shown`;
});

await check('cloud', async () => {
  // two devices that can never link directly (the meeting service points nowhere), like far-away networks:
  // they must find each other through the cloud relay (a local MQTT broker on 127.0.0.1:9001 stands in for
  // the public ones), see each other's status, join from the friends list, move, meet and talk
  const up = await new Promise(r => { const ws = new WebSocket('ws://127.0.0.1:9001/', 'mqtt'); const t = setTimeout(() => r(false), 2000); ws.onopen = () => { clearTimeout(t); ws.close(); r(true); }; ws.onerror = () => { clearTimeout(t); r(false); }; });
  if (!up) return 'skipped (no local MQTT broker on 127.0.0.1:9001)';
  const pre = () => { window.SV_PEER = { host: '127.0.0.1', port: 9099, path: '/nope', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; };
  const A = await open(b, { pre, w: 900, h: 640, lang: 'en', settings: { friendCode: 'AAAAA2', friendsOn: true, autoMeet: false, friends: [{ code: 'BBBBB3', name: 'Bin' }] } });
  const B = await open(b, { pre, w: 390, h: 760, lang: 'vi', touch: true, settings: { friendCode: 'BBBBB3', friendsOn: true, autoMeet: false, friends: [{ code: 'AAAAA2', name: 'Na' }] } });
  await pairKeys(A, B);
  // each player has a photo: it must reach the friend through the cloud too (locked with their pair key)
  const photo = c => { const k = document.createElement('canvas'); k.width = k.height = 64; const g = k.getContext('2d'); g.fillStyle = c; g.fillRect(0, 0, 64, 64); __sv.heroes[0].profile.photo = k.toDataURL('image/jpeg', .8); __sv.rebuildHero(0); };
  for (const [P, c] of [[A, '#ff0000'], [B, '#0000ff']]) { await clear(P.page); await P.page.evaluate(async c => { window.__Net = (await import('/js/net.js')).Net; }, c); await P.page.evaluate(photo, c); }
  const code = await A.page.evaluate(async () => __Net.host(__sv.sendHello()));
  await A.page.evaluate(async () => { const S = (await import('/js/world.js')).CITIES.find(c => c.id === 'saigon'); __sv.heroes[0].place(S.x, S.z); __sv.shareStatus(); });
  await B.page.waitForFunction(() => { const s = __Net.friends.status.AAAAA2; return s && s.online && s.room; }, null, { timeout: 30000 });
  const status = await B.page.evaluate(() => { __sv.openPad(0, 'friend'); return new Promise(r => setTimeout(() => r(document.querySelector('.frow').innerText.replace(/\n+/g, ' ')), 600)); });
  await B.page.evaluate(() => document.querySelector('[data-joinf]').click());
  await B.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 45000 });
  await B.page.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false; });
  await A.page.waitForFunction(() => Object.values(__sv.partners).some(P => P.pos.y > -40), null, { timeout: 20000 });
  await B.page.waitForFunction(() => Object.values(__sv.partners).some(P => P.pos.y > -40), null, { timeout: 20000 });
  await A.page.waitForTimeout(3000);
  const q = await A.page.evaluate(() => __Net.quality(Object.keys(__Net.remotes)[0]));
  await A.page.evaluate(() => __sv.askFriendToCome(__sv.heroes[0], Object.keys(__sv.partners)[0]));
  await B.page.waitForSelector('.dialog .dch', { timeout: 15000 }); await B.page.evaluate(() => document.querySelector('.dialog .dch').click());
  for (let k = 0; k < 40; k++) { const done = await B.page.evaluate(() => { const h = __sv.heroes[0]; if (!h.walkTo) return true; const dx = h.walkTo.x - h.pos.x, dz = h.walkTo.z - h.pos.z, d = Math.hypot(dx, dz); h.place(h.pos.x + dx / d * Math.min(d - 1, 8), h.pos.z + dz / d * Math.min(d - 1, 8)); return false; }); if (done) break; await B.page.waitForTimeout(300); }
  await B.page.waitForTimeout(1500);
  const d = await B.page.evaluate(() => { const P = Object.values(__sv.partners)[0], h = __sv.heroes[0]; return Math.hypot(P.pos.x - h.pos.x, P.pos.z - h.pos.z); });
  await B.page.evaluate(() => __sv.emote(0, 'hi')); await A.page.waitForTimeout(1500);
  const heard = await A.page.evaluate(() => __sv.bubbles.length);
  // photos arrived both ways (red at B, blue at A)
  const pix = P => P.page.evaluate(() => new Promise(r => { const p = Object.values(__Net.remotes)[0]?.photo; if (!p) return r(null); const im = new Image(); im.onload = () => { const k = document.createElement('canvas'); k.width = k.height = 8; const g = k.getContext('2d'); g.drawImage(im, 0, 0, 8, 8); r([...g.getImageData(4, 4, 1, 1).data].slice(0, 3)); }; im.src = p; }));
  const photoAtB = await pix(B), photoAtA = await pix(A);
  // Each device must also retain its own photo after joining, including the rendered face texture.
  const ownPhotos = await Promise.all([A,B].map(P=>P.page.evaluate(()=>{const h=__sv.heroes[0],c=h.av.faceMat.map.image,g=c.getContext('2d');return {saved:!!h.profile.photo,pixel:[...g.getImageData(c.width/2,c.height/2,1,1).data].slice(0,3)}})));
  ok(ownPhotos[0].saved&&ownPhotos[0].pixel[0]>180&&ownPhotos[0].pixel[2]<80&&ownPhotos[1].saved&&ownPhotos[1].pixel[2]>180&&ownPhotos[1].pixel[0]<80,'own face missing after joining: '+JSON.stringify(ownPhotos));
  // a third friend comes in through the cloud: everyone must see everyone
  const C = await open(b, { pre, w: 600, h: 500, lang: 'en' }); await clear(C.page);
  await C.page.evaluate(async c => { window.__Net = (await import('/js/net.js')).Net; __Net.join(c, __sv.sendHello()); const S = (await import('/js/world.js')).CITIES.find(c => c.id === 'saigon'); __sv.heroes[0].place(S.x + 4, S.z - 6); }, code);
  // (B came straight in as a saved friend; C is not on the list, so C knocks through the cloud and A lets C in)
  await A.page.waitForSelector('.knockpop [data-in]', { timeout: 45000 }); await A.page.evaluate(() => document.querySelector('.knockpop [data-in]').click());
  await C.page.waitForFunction(() => Object.values(__sv.partners).filter(P => P.pos.y > -40).length >= 2, null, { timeout: 45000 }).catch(() => { });
  await B.page.waitForFunction(() => Object.values(__sv.partners).filter(P => P.pos.y > -40).length >= 2, null, { timeout: 20000 }).catch(() => { });
  const three = [await A.page.evaluate(() => Object.keys(__sv.partners).length), await B.page.evaluate(() => Object.values(__sv.partners).filter(P => P.pos.y > -40).length), await C.page.evaluate(() => Object.values(__sv.partners).filter(P => P.pos.y > -40).length)];
  await C.ctx.close();
  const bId = await B.page.evaluate(() => __Net.me);
  await B.page.evaluate(() => __Net.close()); await A.page.waitForTimeout(3000);
  const left = await A.page.evaluate(id => !__sv.partners[id], bId);
  const errs = A.errors.concat(B.errors, C.errors).filter(e => !/WebSocket|ERR_CONNECTION|peerjs/i.test(e)); await A.ctx.close(); await B.ctx.close();
  const red = photoAtB && photoAtB[0] > 180 && photoAtB[2] < 80, blue = photoAtA && photoAtA[2] > 180 && photoAtA[0] < 80;
  ok(/TP\. Hồ Chí Minh/.test(status) && /1\d{3}|[2-9]\d{3}/.test(status) && q && q.route === 'cloud' && q.rtt && d < 6 && heard > 0 && red && blue && three.every(n => n >= 2) && left && !errs.length, JSON.stringify({ status, q, d, heard, photoAtB, photoAtA, three, left, errs }));
  return `status "${status}", ping ${q.rtt} ms through the cloud, met at ${d.toFixed(1)} m, talk bubble received, photos both ways, 3 players all see each other, leaving noticed`;
});

await check('photo', async () => {
  // Camera → Take picture → "Save to my photos": on an iPhone the share sheet gets a full-size picture file (its
  // "Save Image" puts it in Photos); on a computer or Android the picture downloads. The Album's ⬇ does the same.
  const out = {};
  for (const kind of ['computer', 'iphone']) {
    const P = await open(b, kind === 'iphone' ? { w: 390, h: 760, touch: true, pre: () => { Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' }); navigator.canShare = d => !!(d && d.files); navigator.share = async d => { window.__shared = d.files.map(f => ({ name: f.name, type: f.type, size: f.size })); }; } } : { w: 1000, h: 700 });
    await clear(P.page);
    const before = await P.page.evaluate(() => __sv.heroes[0].profile.album.length);
    await P.page.evaluate(() => __sv.openPad(0, 'cam')); await P.page.waitForSelector('#snap'); await P.page.click('#snap');
    await P.page.waitForSelector('#toPhone:not([hidden])', { timeout: 5000 });
    const r = { added: (await P.page.evaluate(() => __sv.heroes[0].profile.album.length)) - before };
    if (kind === 'iphone') { await P.page.click('#toPhone'); await P.page.waitForFunction(() => window.__shared, null, { timeout: 5000 }); r.shared = await P.page.evaluate(() => window.__shared); await P.page.screenshot({ path: 'out/photo-iphone.png' }); }
    else {
      const [dl] = await Promise.all([P.page.waitForEvent('download', { timeout: 5000 }), P.page.click('#toPhone')]);
      const fp = await dl.path(); r.download = { name: dl.suggestedFilename(), size: fs.statSync(fp).size };
      await P.page.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false; __sv.openPad(0, 'album'); });
      await P.page.waitForSelector('[data-dl]', { state: 'attached' });
      const [dl2] = await Promise.all([P.page.waitForEvent('download', { timeout: 5000 }), P.page.evaluate(() => document.querySelector('[data-dl]').click())]);
      r.album = dl2.suggestedFilename();
    }
    r.errs = P.errors; await P.ctx.close(); out[kind] = r;
  }
  const c = out.computer, i = out.iphone;
  ok(c.added === 1 && /^sparkle-valley-\d{8}-\d{6}\.jpg$/.test(c.download.name) && c.download.size > 5000 && /\.jpg$/.test(c.album) && i.added === 1 && i.shared && i.shared.length === 1 && i.shared[0].type === 'image/jpeg' && i.shared[0].size > 5000 && !c.errs.length && !i.errs.length, JSON.stringify(out));
  return `computer: ${c.download.name} downloaded (${Math.round(c.download.size / 1024)} KB), Album ⬇ downloads too; iPhone: the share sheet got ${i.shared[0].name} (${Math.round(i.shared[0].size / 1024)} KB) for "Save Image"`;
});

await check('netmsg', async () => {
  // PRIV-003: every message from another device is checked in one place (js/netmsg.js) before the game sees it
  const P = await open(b, { w: 600, h: 400, play: false });
  const r = await P.page.evaluate(async () => {
    const M = await import('/js/netmsg.js'), c = (d, f = 'p1') => M.checkMsg(d, f), out = {};
    out.unknown = [c({ t: 'knock' }), c({ t: 'status', key: 'removed' }), c({ t: 'constructor' }), c({ t: '__proto__' })].every(x => x === null);
    out.badMove = c({ t: 's', x: NaN, y: 0, z: 0, yaw: 0 }) === null && c({ t: 's', x: 1e9, y: 0, z: 0, yaw: 0 }) === null && c({ t: 's', y: 0, z: 0, yaw: 0 }) === null;
    const okMove = c({ t: 's', x: 1, y: 2, z: 3, yaw: .5, st: 'run', sp: 3, evil: '<img>' }); out.extraRemoved = okMove && okMove.x === 1 && !('evil' in okMove);
    out.trade = c({ t: 'offer', id: 'o1', give: { coins: 1e9 }, want: {} }) === null && c({ t: 'offer', id: 'o2', give: { items: { apple: 2 } }, want: { coins: 5 } }) !== null && c({ t: 'offer', id: 'o3', give: { items: { 'a<b': 1 } }, want: {} }) === null;
    out.emote = c({ t: 'emote', id: 'x'.repeat(80) }) === null && c({ t: 'emote', id: 'hi' }, 'p2') !== null;
    M.resetRates(); let passed = 0; for (let i = 0; i < 100; i++) if (c({ t: 's', x: 0, y: 0, z: 0, yaw: 0 }, 'flood')) passed++; out.flood = passed;
    out.other = c({ t: 's', x: 0, y: 0, z: 0, yaw: 0 }, 'calm') !== null; // one player's flood doesn't block another
    out.bigHello = c({ t: 'hello', name: 'A', photo: 'x'.repeat(200000) }, 'p3') === null;
    out.relayFields = c({ t: 'ping', ts: Date.now(), mid: 'm1', _id: 'abcdefghijklmnop', _topic: 'sparklevalley/v2/room/' + 'f'.repeat(32) }, 'p4') !== null // (the relay's routing fields don't count)
      && c({ t: 'pong', from: 'sv-c-8rkqujds', to: 'sparkle-valley-v2-2505', ts: Date.now(), mid: 'm9505uqo14', _id: 'fm8qycc1mutbunog' }, 'p5') !== null; // (a real answer with long ids)
    return out;
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.unknown && r.badMove && r.extraRemoved && r.trade && r.emote && r.flood === 40 && r.other && r.bigHello && r.relayFields && !errs.length, JSON.stringify(r));
  return 'unknown kinds dropped (a stranger can no longer fake a knock or a status), bad moves and trades dropped, unknown fields removed, a flood of 100 moves cut to 40 a second';
});

await check('knock', async () => {
  // A room code can be guessed, so newcomers knock (6 digits from round R privacy, 9 Oct). Through the cloud relay only (the harder path):
  // the starter's panel shows the code as digits and animals (no QR code: owner, round 30); a child types the code with
  // the animal pad and knocks (microphone off, nothing of the room heard); "No thanks" sends them away for good; a
  // stranger who skips knocking and just sends moves is ignored; another child types the numbers and is let in.
  const up = await new Promise(r => { const ws = new WebSocket('ws://127.0.0.1:9001/', 'mqtt'); const t = setTimeout(() => r(false), 2000); ws.onopen = () => { clearTimeout(t); ws.close(); r(true); }; ws.onerror = () => { clearTimeout(t); r(false); }; });
  if (!up) return 'skipped (no local MQTT broker on 127.0.0.1:9001)';
  const pre = () => { window.SV_PEER = { host: '127.0.0.1', port: 9099, path: '/nope', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; };
  const A = await open(b, { pre, w: 900, h: 700, lang: 'en', settings: { autoMeet: false } });
  await clear(A.page); await A.page.evaluate(async () => { window.__Net = (await import('/js/net.js')).Net; });
  const code = await A.page.evaluate(async () => __Net.host(__sv.sendHello()));
  const panel = await A.page.evaluate(() => { __sv.openPad(0, 'friend'); return new Promise(r => setTimeout(() => { const c = document.querySelector('.rcode'); if (!c) return r(null); r({ digits: [...c.querySelectorAll('.rd b')].map(x => x.textContent).join(''), animals: c.querySelectorAll('.rd svg.art').length, qr: !!document.querySelector('.rqrb, .rqr') }); }, 700)); });
  await A.page.screenshot({ path: 'out/knock-code.png' });
  await A.page.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false; });
  // D types the code on the animal pad
  const D = await open(b, { pre, w: 390, h: 760, lang: 'vi', touch: true, settings: { autoMeet: false } });
  await clear(D.page); await D.page.evaluate(async () => { window.__Net = (await import('/js/net.js')).Net; __sv.openPad(0, 'friend'); });
  await D.page.waitForSelector('.padmode [data-mode=ani]'); await D.page.click('.padmode [data-mode=ani]');
  const aniKeys = await D.page.evaluate(() => document.querySelectorAll('.numpad.ani button svg.art').length);
  for (const d of code.slice(0, 2)) await D.page.click(`.numpad button[data-v="${d}"]`);
  await D.page.screenshot({ path: 'out/knock-pad.png' });
  for (const d of code.slice(2)) await D.page.click(`.numpad button[data-v="${d}"]`);
  await A.page.waitForSelector('.knockpop [data-no]', { timeout: 45000 });
  await D.page.waitForFunction(() => __Net._heard > 0, null, { timeout: 20000 });
  await D.page.waitForTimeout(1500);
  const atDoor = await D.page.evaluate(() => ({ knocking: __Net.knocking, partners: Object.keys(__sv.partners).length, mic: __Net.mic ? __Net.mic.getAudioTracks().some(t => t.enabled) : 'none', panel: !!document.querySelector('.knockwait') }));
  await D.page.screenshot({ path: 'out/knock-wait.png' }); await A.page.screenshot({ path: 'out/knock-door.png' });
  await A.page.evaluate(() => document.querySelector('.knockpop [data-no]').click());
  await D.page.waitForFunction(() => !__Net.role, null, { timeout: 20000 });
  const sentAway = await A.page.evaluate(() => ({ remotes: Object.keys(__Net.remotes).length, knocks: __Net.knocks.size, pop: !!document.querySelector('.knockpop') }));
  // a stranger skips the knock and just sends moves and a talk bubble through the cloud: nothing appears
  await D.page.evaluate(async c => { const { Channel } = await import('/js/relay.js'); const ch = new Channel({ kind: 'room', code: c, onMsg: () => { } }); await ch.start(); for (let i = 0; i < 6; i++) { ch.send({ t: 's', from: 'sv-c-stranger1', x: 1, y: 1, z: 1, yaw: 0, mid: 'x' + i }); ch.send({ t: 'emote', id: 'hi', from: 'sv-c-stranger1', mid: 'e' + i }); await new Promise(r => setTimeout(r, 200)); } }, code);
  await A.page.waitForTimeout(2000);
  const stranger = await A.page.evaluate(() => ({ remotes: Object.keys(__Net.remotes).length, partners: Object.keys(__sv.partners).length, bubbles: __sv.bubbles.length }));
  await D.ctx.close();
  // E types the numbers and knocks; A lets E in
  const E = await open(b, { pre, w: 390, h: 760, lang: 'en', touch: true, settings: { autoMeet: false } });
  await clear(E.page); await E.page.evaluate(() => __sv.openPad(0, 'friend')); await E.page.waitForSelector('.padmode [data-mode=num]'); await E.page.click('.padmode [data-mode=num]');
  for (const d of code) await E.page.click(`.numpad button[data-v="${d}"]`);
  await A.page.waitForSelector('.knockpop [data-in]', { timeout: 45000 }); await A.page.evaluate(() => document.querySelector('.knockpop [data-in]').click());
  await E.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 30000 });

  const errs = A.errors.concat(D.errors, E.errors).filter(e => !/WebSocket|ERR_CONNECTION|peerjs/i.test(e)); await A.ctx.close(); await E.ctx.close();
  ok(panel && panel.digits === code && panel.animals === 6 && !panel.qr && aniKeys === 10 && atDoor.knocking && !atDoor.partners && atDoor.mic === 'none' && atDoor.panel && !sentAway.remotes && !sentAway.knocks && !sentAway.pop && !stranger.remotes && !stranger.partners && !stranger.bubbles && !errs.length, JSON.stringify({ panel, aniKeys, atDoor, sentAway, stranger, errs }));
  return `code ${code} shown as digits and 6 animals (no QR code); typed on the animal pad, knocked with the microphone off and nothing heard; "No thanks" sent them away; a stranger's moves without knocking ignored; another child typed the numbers and was let in`;
});

await check('onlineoff', async () => {
  // PRIV-006 (round R privacy, 9 Oct, owner): a fresh device has online play off. The Friends tab says so with no Start or
  // Join, Net makes no connection (no PeerJS, no cloud relay, no friends' status), and Grown-ups turns it on.
  const P = await open(b, { w: 390, h: 760, touch: true, pre: () => { const s = JSON.parse(localStorage.getItem('sv2_settings') || '{}'); delete s.online; localStorage.setItem('sv2_settings', JSON.stringify(s)); window.__wsOpened = 0; const W = window.WebSocket; window.WebSocket = function (...a) { window.__wsOpened++; return new W(...a); }; window.WebSocket.prototype = W.prototype; } }); // (the harness turns it on; this device has never had the setting)
  await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const S = await import('/js/state.js'), N = (await import('/js/net.js')).Net, wait = ms => new Promise(r => setTimeout(r, ms));
    const setting = S.settings.online;
    __sv.openPad(0, 'friend'); await wait(500);
    const body = document.querySelector('.pad-body') || document.body, text = body.textContent;
    const off = /Playing with friends is off/.test(text), buttons = !!document.querySelector('#oHost, .padwrap, .numpad, [data-joinf]');
    // (bug #37) a grown-ups' note names the real section and switch in both languages, with a press-and-hold Grown-ups button
    const guide = {}, hold = document.querySelector('.gunote .gu-hold');
    guide.en = /Internet and playing online → tick Use the internet/.test(text) && !/Studio/.test(text);
    guide.hold = !!hold && hold.getBoundingClientRect().height >= 44 && !!hold.querySelector('.ring');
    hold.click(); await wait(200); guide.tapNoOpen = !document.querySelector('.modal.grownups'); // a plain tap opens nothing
    hold.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    for (let n = 0; n < 100 && !document.querySelector('.modal.grownups'); n++) await wait(100);
    await wait(300);
    const sec = document.querySelector('.modal.grownups details[data-sec="online"]'); guide.opens = !!sec && sec.open;
    S.settings.lang = 'vi'; const vbox = document.createElement('div'); __sv.drawOnlinePanel(vbox, () => { }); S.settings.lang = 'en';
    guide.vi = /Internet và chơi trực tuyến → chọn Dùng internet/.test(vbox.textContent) && !/Studio/.test(vbox.textContent);
    document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false;
    const code = await N.host({ name: 'X' }); await N.join('123456', { name: 'X' }); __sv.listenFriends(); await wait(1500);
    return { setting, off, buttons, guide, code, role: N.role, peer: !!N.peer, door: !!N.door, cloud: !!N.cloud, beacon: !!N.beacon, pres: !!N.friends.ch, peerLoaded: !!window.Peer, ws: window.__wsOpened };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.setting === false && r.off && !r.buttons && Object.values(r.guide).every(Boolean) && Object.keys(r.guide).length === 5 && r.code === null && !r.role && !r.peer && !r.door && !r.cloud && !r.beacon && !r.pres && !r.ws && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return 'a fresh device: "Playing with friends is off. Ask a grown-up to turn it on.", no Start or Join; a grown-ups\' note names Internet and playing online → Use the internet (EN and VI, no Studio) and its press-and-hold button opens that section (a tap does not); host, join and friends make no connection';
});

await check('roomstartup', async () => (await import('../room-startup.mts')).roomStartupCheck(b));
