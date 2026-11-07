// Sparkle Valley checks: Everyday play: bag, shop, clothes, photos, family, jobs and daily adventures.
// Run them through tests/run.mts (node run.mts <check>) or tests/suite.mts, not on their own.
// Moved unchanged from tests/run.mts (v1.07 split-tests, 2 Nov 2026 AEDT); see tests/checks/README.md.
import { adventureWalkSnapshot, adventureDaySnapshot, seedAdventureWalk, fs, open, clear, start, only, want, pause, check, ok, b } from './shared.mts';

await check('bagpals', async () => {
  // (issue #738, tester on an iPhone 430x517 in Vietnamese, 31 Oct 2026 AEDT: "in the Bag I can't see the pets; put the pets
  // and the companion in one place, where their accessories are bought and managed too, and give it one name") the pets
  // were a lone button above the coins with no heading, so the sticky jump row had no way back to them on a short phone,
  // and the companion's hats were only in the shop. Now "Pets & Buddy / Thú cưng & Bạn đồng hành" is the Bag's first
  // section and the first chip of its jump row, on a phone (the tester's 430x517 and 390x844), a tablet and a computer:
  // the companion, each pet and adopting in one row, every tile big enough to tap; their hats under it. A hat is bought
  // only with an explicit Buy, then put on the companion or on a pet (the 3D hat moves with it) and taken off again
  const rows = [];
  for (const [dev, w, h, lang] of [['tester-phone', 430, 517, 'vi'], ['phone', 390, 844, 'en'], ['tablet', 820, 1180, 'vi'], ['computer', 1366, 800, 'en']]) {
    const P = await open(b, { w, h, touch: w < 1000, lang }); await clear(P.page);
    const r = await P.page.evaluate(async () => {
      const G = __sv, hero = G.heroes[0], p = hero.profile, wt = t => new Promise(r => setTimeout(r, t)), S = await import('/js/state.js'), out = {};
      p.age = 'little'; p.lanterns = { companion: 'firefly', done: { p_owl: true }, chapters: {} }; p.pets = [{ kind: 'puppy', name: 'Mochi' }, { kind: 'kitty', name: '' }];
      G.pets.sync(); G.pets.refreshInteractables(); G.lanterns.companions.sync(); G.addCoins(100 - S.farm.coins); await wt(600);
      // (v1.08 companion, owner's plan E, 3 Nov 2026 AEDT) the section left the Bag for its own tab, Companions / Bạn đồng
      // hành, straight after the Backpack (and before the Shop): the Bag keeps food, things, clothes, kites and gliders
      G.openPad(0, 'bag'); await wt(900);
      out.tabs = [...document.querySelectorAll('.modal.pad .pad-tabs button')].map(x => x.dataset.t);
      out.bagHasPals = !!document.querySelector('.modal.pad .pad-body .bag-pals, .modal.pad .pad-body [data-phat]');
      const tabB = document.querySelector('.modal.pad .pad-tabs [data-t="pals"]'), tq = tabB ? tabB.getBoundingClientRect() : null;
      out.tabSize = tq ? Math.round(Math.min(tq.width, tq.height)) : 0; out.tabName = tabB ? tabB.textContent.replace(/\s+/g, ' ').trim() : '';
      tabB?.click(); await wt(900);
      const body = document.querySelector('.modal.pad .pad-body'), br = body.getBoundingClientRect(), hs = [...body.querySelectorAll('h3')];
      out.oldButton = !!body.querySelector('#bagPets');
      out.firstHeading = hs[0] ? hs[0].textContent.replace(/\s+/g, ' ').trim() : '';
      out.headings = hs.length;
      const tiles = [...body.querySelectorAll('.bag-pals .slot')];
      out.tiles = tiles.map(t => t.dataset.pal ?? (t.dataset.adopt ? 'adopt' : t.dataset.palfeed ? 'feed' : '?'));
      out.goal = body.querySelector('.pal-goal')?.textContent.replace(/\s+/g, ' ').trim() || '';
      out.goalSmall = (() => { const q = body.querySelector('.pal-goal')?.getBoundingClientRect(); return !q || q.height < 64; })();
      out.small = [...tiles, ...body.querySelectorAll('.bag-pal-hats .slot')].map(t => t.getBoundingClientRect()).filter(q => q.width < 64 || q.height < 64).length;
      // seen when the Bag opens, without scrolling: the first friend's tile starts inside the visible Bag
      out.seenAtOpen = tiles[0] ? tiles[0].getBoundingClientRect().top < br.bottom - 24 : false;
      // buy the first hat: a tap explains, only Buy spends
      const hatTile = id => body.querySelector(`.bag-pal-hats [data-phat="${id}"]`);
      out.lockedBuy = (() => { hatTile('crown').click(); return !!body.querySelector('.bag-help .bh-buy'); })();
      hatTile('party').click(); await wt(150); out.tapKeepsCoins = S.farm.coins === 100 && !(p.lanterns.pet && (p.lanterns.pet.hats || []).length);
      body.querySelector('.bag-help .bh-buy')?.click(); await wt(700);
      // (the companion is drawn while the valley runs: close the Bag to see its hat, then open it again)
      const reopen = async () => { document.querySelector('.modal.pad .pad-head .x')?.click(); await wt(900); const seen = !!G.lanterns.companions.of(hero).hat; G.openPad(0, 'pals'); await wt(900); return seen; };
      out.coinsAfter = S.farm.coins; out.hats = [...(p.lanterns.pet.hats || [])]; out.buddyHat = p.lanterns.pet.hat; out.buddy3d = await reopen();
      // put it on Mochi: it leaves the companion; the 3D hat is on the puppy
      const b2 = document.querySelector('.modal.pad .pad-body'); b2.querySelector('.bag-pal-hats [data-phat="party"]').click(); await wt(150);
      out.wearers = [...b2.querySelectorAll('.bag-help .bh-wear')].map(x => x.dataset.to);
      b2.querySelector('.bag-help .bh-wear[data-to="0"]')?.click(); await wt(700);
      out.badge = !!document.querySelector('.modal.pad .bag-pals [data-pal="0"] .pal-hat');
      out.petHat = p.pets[0].hat; out.buddyAfter = p.lanterns.pet.hat; out.pet3d = !!(G.pets.forHero(hero)[0]?.obj.userData.hat); out.buddy3dAfter = await reopen();
      // and take it off
      const b3 = document.querySelector('.modal.pad .pad-body'); b3.querySelector('.bag-pal-hats [data-phat="party"]').click(); await wt(150); b3.querySelector('.bag-help .bh-off')?.click(); await wt(500);
      out.offPet = p.pets[0].hat == null && !G.pets.forHero(hero)[0]?.obj.userData.hat;
      document.querySelector('.modal.pad .pad-body').scrollTop = 0; await wt(200);
      return out;
    });
    await P.page.screenshot({ path: `out/bagpals-${dev}.png` });
    const bad = [], heading = lang === 'vi' ? 'Bạn đồng hành' : 'Your companion', tabName = lang === 'vi' ? 'Bạn đồng hành' : 'Companions';
    if (r.oldButton) bad.push('the old lone pets button is still there');
    if (r.bagHasPals) bad.push('the Bag still holds the pets and hats');
    if (r.tabs.indexOf('pals') !== r.tabs.indexOf('bag') + 1 || (r.tabs.includes('shop') && r.tabs.indexOf('shop') !== r.tabs.indexOf('pals') + 1)) bad.push('the tabs are ' + r.tabs.join(','));
    if (!r.tabName.includes(tabName) || r.tabSize < 44) bad.push(`the Companions tab: "${r.tabName}", ${r.tabSize} px`);
    if (!r.firstHeading.includes(heading) || r.headings !== 3) bad.push(`"${heading}" is not the first of 3 sections: "${r.firstHeading}", ${r.headings}`);
    if (r.tiles.join(',') !== 'buddy,feed,0,1,adopt') bad.push('the friends rows are ' + r.tiles.join(','));
    if (!/(Party hat|Mũ sinh nhật)/.test(r.goal) || r.goalSmall) bad.push('the coin goal card: ' + r.goal);
    if (r.small) bad.push(r.small + ' tiles under 64 px for an under-5');
    if (!r.seenAtOpen) bad.push('the pets are not in sight when the tab opens');
    if (r.lockedBuy) bad.push('a locked hat can be bought before the ones before it');
    if (!r.tapKeepsCoins || r.coinsAfter !== 70 || r.hats.join() !== 'party' || r.buddyHat !== 'party' || !r.buddy3d) bad.push('buying the hat ' + JSON.stringify(r));
    if (r.wearers.join(',') !== 'buddy,0,1' || r.petHat !== 'party' || r.buddyAfter || !r.pet3d || r.buddy3dAfter || !r.badge) bad.push('putting the hat on a pet ' + JSON.stringify(r));
    if (!r.offPet) bad.push('the hat did not come off the pet');
    if (P.errors.length) bad.push(...P.errors.slice(0, 2));
    await P.ctx.close();
    if (bad.length) throw new Error(dev + ': ' + bad.join('; '));
    rows.push(`${dev} ${w}x${h}`);
  }
  return `The Companions tab after the Backpack (${rows.join(', ')}): companion, Feed and the coin goal, 2 pets and adopting, tiles 64 px+, none left in the Bag; a hat bought only with Buy (100 to 70), moved from the companion to a pet and off again, the 3D hat following; screenshots out/bagpals-*.png`;
});

await check('shop', async () => {
  // (round S, owner plan 8 Oct: Round R Part 2 item 6) the clothes shop stands by the market off the roads; the Bag button
  // takes the child there; the big card has picture tabs and coin prices (≥ 64 px for under-5s); buying takes game coins
  // and puts the thing on; the wardrobe shows what is owned; what a child already wore counts as owned; the 3D character
  // draws every new piece with few extra parts; the Studio switch puts the old Bag and wardrobe back
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, w = t => new Promise(r => setTimeout(r, t)), S = await import('/js/state.js'), W = await import('/js/world.js');
    const C = (await import('/js/custom.js')).CUSTOM, SH = await import('/js/content/shop.js'), { buildAvatar } = await import('/js/avatar.js');
    const out: Record<string, any> = {}, sp = G.shop.spot, rd = W.roadDist(sp.x, sp.z), M = W.MARKET;
    out.spot = [Math.round(sp.x), Math.round(sp.z)]; out.offRoad = !rd.road || rd.d > rd.road.w / 2 + 1.5;
    out.nearMarket = Math.hypot(Math.max(M.x0 - sp.x, 0, sp.x - M.x1), Math.max(M.z0 - sp.z, 0, sp.z - M.z1)) < 40;
    out.dry = W.heightAt(sp.x, sp.z) > W.WATER + .3; out.tap = !!G.interactables.find(i => i.id === 'shop_clothes');
    // the Bag button (Bug #29, owner 10 Oct: "bag is bag"): it opens the backpack, with one small shop button that opens the
    // shop right there, no travel; the stall in the valley stays
    p.age = 'big'; G.addCoins(500 - S.farm.coins); const pos0 = { x: h.pos.x, z: h.pos.z }; G.huds[0].root.querySelector('.dk.bag').click(); await w(500);
    // (Round V, owner 13 Oct: "the shop button should be within the bag right next to the bag icon") a Shop tab straight
    // after Backpack in the Pad; no Shop button in the dock. (v1.08 companion, owner's plan E) the Companions tab now sits
    // between them: Backpack, Companions, Shop
    const tabsK = [...document.querySelectorAll('.modal.pad .pad-tabs button')].map(b => b.dataset.t), sb = document.querySelector('.modal.pad .pad-tabs [data-t="shop"]');
    out.bagOpens = !!document.querySelector('.modal.pad') && !document.querySelector('.modal.shopk') && tabsK.indexOf('pals') === tabsK.indexOf('bag') + 1 && tabsK.indexOf('shop') === tabsK.indexOf('pals') + 1 && !G.huds[0].root.querySelector('.dk.shop');
    out.bagShopBtn = sb ? (() => { const q = sb.getBoundingClientRect(); return q.width >= 44 && q.height >= 44; })() : false;
    sb && sb.click(); await w(700);
    out.there = Math.hypot(h.pos.x - pos0.x, h.pos.z - pos0.z) < 1 && !!document.querySelector('.modal.pad'); const card = document.querySelector('.pad .shop-content');
    out.opened = !!card; out.tabs = card ? card.querySelectorAll('.ktab').length : 0; out.noBagTab = card ? !card.querySelector('[data-go="bag"]') : false;
    // (nothing to read: each thing is a drawing and a number; the words inside a drawing, like the coin's "$", are part
    // of the picture, so the text is read with the drawings taken out)
    const words = b => { const c = b.cloneNode(true); c.querySelectorAll('svg, .arti, .flagi').forEach(e => e.remove()); return c.textContent.replace(/\s/g, ''); };
    out.pics = card ? [...card.querySelectorAll('.kitem')].every(b => b.querySelector('svg') && /^\d*$/.test(words(b))) : false;
    out.small = card ? [...card.querySelectorAll('.ktab, .kitem, .x')].filter(b => { const q = b.getBoundingClientRect(); return q.width < 44 || q.height < 44; }).length : -1;
    // buy the tiara (hats tab), and it is worn
    // (Round V, owner 13 Oct: the shop sells the child's own set only) the tiara, or the first thing of the child's set
    const item = async id => card.querySelector(`[data-id="${id}"]`) || card.querySelector('.kitem:not(.have)');
    card.querySelector('[data-tab="hat"]').click(); await w(150); const hatB = await item('tiara'), hatId = hatB.dataset.id; hatB.click(); await w(150);
    const price = SH.priceOf(SH.ITEM[hatId]), c0 = S.farm.coins; card.querySelector('.kyes').click(); await w(300);
    out.bought = SH.owns(p, hatId) && p.look.hat === hatId && S.farm.coins === c0 - price; out.boughtId = hatId;
    // not enough coins: nothing is bought
    G.addCoins(-S.farm.coins); card.querySelector('[data-tab="back"]').click(); await w(150); const bkB = await item('dragon'), bkId = bkB.dataset.id; bkB.click(); await w(150); card.querySelector('.kyes').click(); await w(300);
    out.poorKept = !SH.owns(p, bkId) && S.farm.coins === 0;
    document.querySelector('.pad-head .x').click(); await w(400); out.closed = !document.querySelector('.modal.pad') && !G.paused;
    // under-5s: every button at least 64 px
    p.age = 'little'; G.shop.openShop(0); await w(400);
    out.little = [...document.querySelectorAll('.modal.shopk.little .ktab, .modal.shopk.little .kitem')].filter(b => { const q = b.getBoundingClientRect(); return q.width < 64 || q.height < 64; }).length;
    document.querySelector('.modal.shopk .x').click(); await w(400);
    // the wardrobe: what is owned, worn with a tap; no shop button on a row; the Done button covers no chip; no chip cut off or overlapping
    // (r79, owner points 18 and A4: the mirror is a big picture of the child with a tab for each kind and a grid of the child's
    // own clothes, tap to wear and tap again to take off, no Remove chip; the same checks on its tiles)
    G.openWardrobe(0); await w(400); const wd = document.querySelector('.wardrobe.kward');
    out.noRowShop = !wd.querySelector('.toshop, [data-shop]');
    { const dn = wd.querySelector('.x').getBoundingClientRect(), chips = [...wd.querySelectorAll('.wit, .ktab')].map(c => c.getBoundingClientRect()), box = wd.getBoundingClientRect();
      const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      out.wardClear = chips.every(c => !hit(c, dn)) && chips.every((c, k) => chips.every((d, j) => j <= k || !hit(c, d))) && wd.scrollWidth <= wd.clientWidth + 1;
      const grid = wd.querySelector('.wgrid').getBoundingClientRect();
      out.wardRowsFit = [...wd.querySelectorAll('.wit')].every(c => { const z = c.getBoundingClientRect(); return z.left >= grid.left - 1 && z.right <= grid.right + 1; }); }
    out.wardrobe = !!wd && wd.querySelectorAll('[data-wtab]').length === 7 && !!wd.querySelector('.wbig') && !!wd.querySelector('[data-v="tiara"]') && !wd.querySelector('[data-v="dragon"]') && !/\bRemove\b/.test(wd.textContent);
    wd.querySelector('.wit.on[data-k="hat"]').click(); await w(200); out.off = p.look.hat === 'none';
    document.querySelector('.wardrobe.kward .x').click(); await w(300);
    // a child who already wore wings and a crown keeps them (r79: a girl, in her own set's version of the crown)
    const old = { look: { style: 'dress', color: '#ff5fa2', back: 'wings', hat: 'crown' }, owned: { hats: ['none'] } }; SH.adoptWorn(old); out.kept = SH.owns(old, 'wings') && SH.owns(old, 'crown_g') && old.look.hat === 'crown_g';
    // the 3D character: every new piece, a few extra parts only (each new piece is one merged shape)
    const meshes = A => { let n = 0; A.root.traverse(o => { if (o.isMesh && !o.userData.outline) n++; }); return n; };
    const base = { style: 'shirt', color: '#3b6fe0', hat: 'none', back: 'none', hair: '#1d1412', hairStyle: 'short', skin: '#f6c7a5' }, n0 = meshes(buildAvatar(base));
    // (r67, owner's yes: the battery round merges the parts that move together into one shape, so a neck or back piece
    // adds triangles to the body's shape, not a separate part: "drawn" is counted in triangles, the "few extra parts" in parts)
    const tris = A => { let n = 0; A.root.traverse(o => { if (o.isMesh && !o.userData.outline && o.visible) { const g = o.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); return n; };
    const A0 = buildAvatar(base), t0 = tris(A0);
    out.drawn = {}; out.tri = {}; for (const it of SH.CLOTHES) { const L = Object.assign({}, base, { [it.slot]: it.id }), A = buildAvatar(L); out.drawn[it.id] = meshes(A) - n0; out.tri[it.id] = tris(A) - t0; }
    out.allDrawn = Object.entries(out.drawn).filter(([id, d]) => Math.abs(d) > 12 || (SH.ITEM[id].slot === 'neck' || SH.ITEM[id].slot === 'back') && out.tri[id] < 1).map(([id, d]) => id + ':' + d + ' parts, ' + out.tri[id] + ' triangles'); // (a top can drop the old sleeves and shorts)
    // the switch off: the Bag opens the backpack, the stall goes, the old wardrobe is back
    C.features = C.features || {}; C.features.shop = false; await w(300);
    G.huds[0].root.querySelector('.dk.bag').click(); await w(500); out.offBag = !!document.querySelector('.modal.pad') && !document.querySelector('.modal.shopk');
    out.offStall = !G.shop.stall.visible; document.querySelector('.modal.pad .x')?.click(); await w(400);
    G.openWardrobe(0); await w(300); out.offWard = !!document.querySelector('.wardrobe') && !document.querySelector('.wardrobe.kward'); document.querySelector('.wardrobe .x')?.click(); await w(300);
    delete C.features.shop;
    return out;
  });
  const errs = P.errors; await P.ctx.close(); const bad = [];
  if (!r.offRoad || !r.nearMarket || !r.dry || !r.tap) bad.push('the shop is not by the market on dry ground off the road ' + JSON.stringify(r.spot));
  if (!r.bagOpens || !r.bagShopBtn) bad.push('the Bag button does not open the backpack, or no Shop tab right after Backpack (or a Shop button still in the dock) ' + JSON.stringify({ o: r.bagOpens, b: r.bagShopBtn }));
  if (!r.there || !r.opened) bad.push('the shop button in the bag did not open the shop right there (no travel)');
  // (v1.08b friends) 9 tabs: the seven kinds (glasses and masks added), the friend's outfits and the mirror
  if (r.tabs !== 9 || !r.noBagTab || !r.pics || r.small) bad.push(`the shop card: ${r.tabs} tabs, pictures ${r.pics}, ${r.small} buttons under 44 px`);
  if (!r.bought || !r.poorKept || !r.closed) bad.push('buying ' + JSON.stringify({ bought: r.bought, poor: r.poorKept, closed: r.closed }));
  if (r.little) bad.push(`${r.little} buttons under 64 px for an under-5`);
  if (!r.wardrobe || !r.off) bad.push('the wardrobe does not show what is owned');
  if (!r.noRowShop || !r.wardClear || !r.wardRowsFit) bad.push('the wardrobe: shop button on a row, or items overlap, are cut off or sit under the Done button ' + JSON.stringify({ s: r.noRowShop, c: r.wardClear, f: r.wardRowsFit }));
  if (!r.kept) bad.push('what a child already wore is not owned');
  if (r.allDrawn.length) bad.push('3D pieces: ' + r.allDrawn.join(' '));
  if (!r.offBag || !r.offStall || !r.offWard) bad.push('the Studio switch did not put the old Bag and wardrobe back ' + JSON.stringify(r));
  if (errs.length) bad.push(...errs.slice(0, 2));
  if (bad.length) throw new Error(bad.join('; '));
  return `the shop at ${r.spot} by the market, off the road; the Bag opens the backpack and the Shop tab right after Backpack opens the shop without travel; 9 picture tabs, coin prices, 64 px for under-5s; bought ${r.boughtId}, could not buy without coins; the wardrobe; worn things kept; every piece drawn in 3D (at most ${Math.max(...(Object.values(r.drawn) as number[]))} extra parts); the switch puts the old Bag back`;
});

// (round S) surprises: at most 3 a session, only when free, never missed (they follow the child), each gives a sticker
// or a keepsake, calm mode keeps them still
await check('surprises', async () => {
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, w = t => new Promise(r => setTimeout(r, t)), C = (await import('/js/custom.js')).CUSTOM, S = await import('/js/state.js'), Sp = G.surprises;
    const { SURPRISES } = await import('/js/content/surprises.js'), { heightAt } = await import('/js/world.js');
    delete C.features.surprises; const out = { bad: [] }, near = c => Math.hypot(c.x - h.pos.x, c.z - h.pos.z);
    const tidy = () => { document.querySelectorAll('.dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; };
    // not while a window is open
    Sp.reset(); Sp.setPlay(1000); const m = document.createElement('div'); m.className = 'modal'; document.body.appendChild(m); await w(2500); out.whileBusy = !!Sp.current(); m.remove();
    // the limit: found as soon as each comes, at most 3
    // (the fairy glade starts with its first glowing stone in front of the child; the path leads ~14 m on to the ring)
    const start = c => c.id === 'glade' && c.parts[0] ? { x: c.parts[0].position.x, z: c.parts[0].position.z } : c;
    let n = 0; for (let k = 0; k < 6; k++) { Sp.setPlay(1000 + k * 400); await w(1600); const c = Sp.current(); if (c) { n++; if (near(start(c)) > 16 && c.id !== 'lotus') out.bad.push(c.id + ' far ' + near(start(c)).toFixed(0)); await Sp.found(h); tidy(); } }
    out.count = n; out.shown = Sp.state().shown;
    // every kind: placed, then found for its sticker or keepsake
    for (const s of SURPRISES) {
      Sp.reset(); const st0 = p.stickers.length, k0 = (p.keepsakes || []).length; if (s.id === 'chest') { p.surprises = { ...(p.surprises || {}), map: 3 }; }
      const c = Sp.place(s.id, h); if (!c) { out.bad.push('could not place ' + s.id); continue; }
      if (s.id === 'butterfly') { for (let k = 0; k < 3; k++) { h.pos.x = c.x; h.pos.z = c.z; h.pos.y = heightAt(c.x, c.z) + .1; await w(4500); } out.landed = c.hop >= 3 && c.it.visible(h); }
      if (!c.it.visible(h)) { out.bad.push(s.id + ' not tappable'); continue; }
      c.it.act(h); await w(400); tidy();
      const gave = p.stickers.length > st0 || (p.keepsakes || []).length > k0 || s.id === 'map' || p.stickers.length === G.STICKERS.length;
      if (!gave) out.bad.push(s.id + ' gave nothing'); if (Sp.current()) out.bad.push(s.id + ' still out after found');
    }
    out.mapPieces = p.surprises.map;
    // never missed: walk far away and it comes back near the child
    Sp.reset(); const c = Sp.place('butterfly', h); h.pos.x += 60; h.pos.y = heightAt(h.pos.x, h.pos.z) + .1; await w(5000); const c2 = Sp.current(); out.followed = !!c2 && near(c2) < 16;
    // calm: one slow shooting star
    S.settings.calm = true; Sp.reset(); const cs = Sp.place('stars', h); out.calmStreaks = cs ? cs.streaks.length : -1; S.settings.calm = false;
    // the Studio switch
    G.heroes.forEach(x => { delete x.profile.tried; });   // (batch rollout, owner 8 Oct rule: off keeps a feature for a child who used it; here the child never did, the check 'rollout' covers the keeping)
    // (v1.08 release) surprises has a release rule (content/custom.json, from 7 Nov 2026): Studio's Releases tab switches
    // it off (releases.surprises.on = false), which js/custom.ts featureOn reads before CUSTOM.features; both are off here
    const relWas = { ...(C.releases || {}) }; C.releases = { ...relWas };
    if (C.releases.surprises) C.releases.surprises = { ...C.releases.surprises, on: false };
    C.features.surprises = false; await w(1500); out.off = !Sp.current();
    C.releases = relWas;
    return out;
  });
  const errs = P.errors; await P.ctx.close(); const bad = [...r.bad];
  if (r.whileBusy) bad.push('a surprise came while a window was open');
  if (r.count !== 3 || r.shown !== 3) bad.push(`not 3 a session: ${r.count}/${r.shown}`);
  if (!r.landed) bad.push('the golden butterfly did not fly on three times and land');
  if (!r.followed) bad.push('a surprise left behind did not come back to the child');
  if (r.calmStreaks !== 1) bad.push('calm mode: ' + r.calmStreaks + ' shooting stars');
  if (!r.off) bad.push('the Studio switch does not take it away');
  if (errs.length) bad.push(...errs.slice(0, 2));
  if (bad.length) throw new Error(bad.join('; '));
  return `3 a session, none while busy; all ${10} kinds give a sticker or keepsake (map piece ${r.mapPieces}/3, chest); the butterfly lands after 3 hops; follows the child; calm: one star; switch off`;
});

// (round S) for grown-ups: a family mission written in Grown-ups, shown to the child, ticked with a press-and-hold;
// the weekly note; the certificate card saved as a picture (no print); the dance break and its Skip; bedtime (dim,
// lullaby, goodnight, hold for 10 more minutes); the birthday surprise; the switches
await check('parents', async () => {
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, w = t => new Promise(r => setTimeout(r, t)), C = (await import('/js/custom.js')).CUSTOM, S = await import('/js/state.js');
    const out = {}, tidy = () => { document.querySelectorAll('.dialog, .modal, .reward, .songs').forEach(e => e.remove()); document.body.classList.remove('songs-on'); G.paused = false; };
    const hold = async b => { const r = b.getBoundingClientRect(), o = { bubbles: true, clientX: r.x + 5, clientY: r.y + 5, pointerId: 3 }; b.dispatchEvent(new PointerEvent('pointerdown', o)); await w(2000); b.dispatchEvent(new PointerEvent('pointerup', o)); };
    // (Round U: this checks the family's own written missions, so the 15 ready-made ones are switched off and the family-play
    // guide counts as seen; check familymissions covers those)
    S.settings.readyMissions = Object.fromEntries((await import('/js/content/familymissions.js')).FAMILY_MISSIONS.map(m => [m.id, false])); p.familyGuideSeen = true;
    S.settings.missions = []; S.settings.bedtime = ''; p.stats.days = { [new Date().toISOString().slice(0, 10)]: { min: 30, games: 4 } };
    // Grown-ups: write a mission; the weekly note and the cards are there
    const { openGrownups } = await import('/js/ui.js'); await openGrownups(); await w(500);
    const g = document.querySelector('.modal.grownups'); g.querySelector('details[data-sec=family]').open = true;
    g.querySelector('#fmEn').value = 'Help set the table'; g.querySelector('#fmVi').value = 'Giúp dọn bàn ăn'; g.querySelector('#fmAdd').click(); await w(400);
    const g2 = document.querySelector('.modal.grownups'); out.listed = /Help set the table/.test(g2.textContent); out.note = !!g2.querySelector('.wknote p'); out.certBtn = !!g2.querySelector('[data-cert]');
    tidy(); await w(6000);
    // the child is told (a speech box with the family's words)
    out.told = [...document.querySelectorAll('.dialog')].some(d => /Help set the table/.test(d.textContent)); tidy();
    // Adventures: a grown-up holds ✓
    const c0 = S.farm.coins; G.openPad(0, 'log'); await w(600); const t = document.querySelector('.pad .missions [data-mtick]'); out.mtick = t ? Math.round(t.getBoundingClientRect().width) : 0;
    if (t) await hold(t); await w(500); out.coins = S.farm.coins - c0; out.open = G.parents.openFor(p).length; tidy();
    // the certificate card: a picture; opening it does not print by itself
    let printed = false; const pr = window.print; window.print = () => { printed = true; };
    const url = await G.parents.certificate(p); out.cert = url.startsWith('data:image/png') && url.length > 20000;
    await G.parents.openCertificate(p); out.saveBtn = !!document.querySelector('.certcard [data-save]'); out.printed = printed;
    // (r89, owner 23 Oct AEDT) Print: only the card, on its own page in a frame of its own (not the game's window)
    let framed = null; const mo = new MutationObserver(() => { const f = document.querySelector('iframe.printframe'); if (f && !f._watched) { f._watched = true; f.addEventListener('load', () => { f.contentWindow.print = () => { const im = f.contentDocument.querySelector('img'); framed = { w: im && im.naturalWidth, only: f.contentDocument.body.children.length }; }; }); } });
    mo.observe(document.body, { childList: true });
    document.querySelector('.certcard [data-print]')?.click(); for (let k = 0; k < 40 && !framed; k++) await new Promise(r => setTimeout(r, 100)); mo.disconnect();
    out.printBtn = !!document.querySelector('.certcard [data-print]'); out.framed = framed; out.printedGame = printed; window.print = pr; tidy();
    // the dance break after 20 minutes of play, with a big Skip
    delete C.features.danceBreak; G.parents.setPlayMin(21); await w(6500);
    const sk = document.querySelector('.dancebreak .db-skip'); out.dance = !!sk; out.skipH = sk ? Math.round(sk.getBoundingClientRect().height) : 0; sk?.click(); await w(300);
    out.danceGone = !document.querySelector('.dancebreak') && !G.paused;
    // bedtime 19:30 AEST: at 19:31 the valley dims and a lullaby plays; at 19:40 goodnight; hold for 10 more minutes
    const realNow = Date.now, at = s => { const ms = Date.parse(s + ':00+10:00'); Date.now = () => ms; };
    S.settings.bedtime = '19:30'; at('2026-10-10T19:31'); await w(9000); out.dim = !!document.querySelector('.bedtime-dim'); out.lullaby = !!document.querySelector('.songs');
    at('2026-10-10T19:40'); await w(6000); const gn = document.querySelector('.resttime.bedtime'); out.goodnight = !!gn;
    if (gn) await hold(gn.querySelector('.grownup')); await w(300); out.snoozed = !document.querySelector('.resttime.bedtime') && S.settings.bedSnooze - Date.now() === 10 * 60e3; // (10 Oct) against the pretend clock: the real one made this pass only before 19:50 AEST on 10 Oct 2026
    S.settings.bedtime = ''; S.settings.bedSnooze = 0; tidy(); document.querySelector('.bedtime-dim')?.remove();
    // the birthday: on the day (AEST), a surprise and a keepsake, once
    // (the reward pop-up closes itself after 2.6 s: watch for it during the wait rather than look once at the end)
    at('2026-10-10T10:00'); p.birthday = '10-10'; delete p.bdayDone; let pop = false; for (let k = 0; k < 26 && !pop; k++) { await w(250); pop = !!document.querySelector('.reward'); }
    await w(300); out.bday = pop && (p.keepsakes || []).includes('bd_cake'); tidy();
    Date.now = realNow;
    // the switches
    C.features.familyMissions = false; out.offMissions = G.parents.logHTML(p) === '' && !G.parents.openFor(p).length;
    for (const id of ['familyMissions', 'weeklyNote', 'certCard', 'danceBreak', 'bedtime', 'birthday']) C.features[id] = false;
    out.offGrownups = G.parents.grownupsHTML(true) === '';
    return out;
  });
  const errs = P.errors; await P.ctx.close(); const bad = [];
  if (!r.listed || !r.note || !r.certBtn) bad.push('Grown-ups: mission, weekly note or card missing ' + JSON.stringify(r));
  if (!r.told) bad.push('the child was not shown the new mission');
  if (r.mtick < 64 || r.coins !== 10 || r.open !== 0) bad.push('holding ✓ did not finish the mission ' + JSON.stringify([r.mtick, r.coins, r.open]));
  if (!r.cert || !r.saveBtn || r.printed) bad.push('the certificate card ' + JSON.stringify([r.cert, r.saveBtn, r.printed]));
  if (!r.printBtn || !r.framed || r.framed.w < 1000 || r.framed.only !== 1 || r.printedGame) bad.push('printing the certificate card ' + JSON.stringify([r.printBtn, r.framed, r.printedGame]));
  if (!r.dance || r.skipH < 64 || !r.danceGone) bad.push('the dance break ' + JSON.stringify([r.dance, r.skipH, r.danceGone]));
  if (!r.dim || !r.lullaby || !r.goodnight || !r.snoozed) bad.push('bedtime ' + JSON.stringify([r.dim, r.lullaby, r.goodnight, r.snoozed]));
  if (!r.bday) bad.push('no birthday surprise');
  if (!r.offMissions || !r.offGrownups) bad.push('the Studio switches do not turn them off');
  if (errs.length) bad.push(...errs.slice(0, 2));
  if (bad.length) throw new Error(bad.join('; '));
  return 'mission written, shown, ticked with a hold (+10); weekly note; certificate picture saved, and printed on its own page (only the card, not the game); dance break with a 64 px Skip; bedtime dims, lullaby, goodnight, hold for 10 more; birthday surprise; switches off';
});

// (round S, owner 9 Oct) the money follows the language (Vietnamese: đồng, English: dollars) until a grown-up picks one
await check('currency', async () => {
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const S = await import('/js/state.js'), M = await import('/js/money.js'), st = S.settings, out = {};
    st.curPinned = false; st.lang = 'en'; out.en = M.curCode() + ' ' + M.fmtMinor(250);
    st.lang = 'vi'; out.vi = M.curCode() + ' ' + M.fmtMinor(20000);
    st.currency = 'AUD'; st.curPinned = true; out.pinned = M.curCode();
    st.curPinned = false; st.lang = 'en';
    return out;
  });
  const errs = P.errors; await P.ctx.close(); const bad = [];
  if (r.en !== 'AUD $2.50') bad.push('English: ' + r.en);
  if (r.vi !== 'VND 20.000đ') bad.push('Vietnamese: ' + r.vi);
  if (r.pinned !== 'AUD') bad.push('a grown-up\'s pick did not stick: ' + r.pinned);
  if (errs.length) bad.push(...errs.slice(0, 2));
  if (bad.length) throw new Error(bad.join('; '));
  return `English ${r.en}, Vietnamese ${r.vi}, a grown-up's AUD stays ${r.pinned} in Vietnamese`;
});

await check('talkonce', async () => {
  // (#339, r85) a second "Talk to Tèo" while his speech box is still open (the quest's Go button walking up, the Act key)
  // opened a second box; "Play!" on one opened the game and the other stayed under it, its "Play!" button covered.
  // One talk with a child at a time: the second ask is ignored, and nothing is left under the game
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const line = ['Want to play Ô ăn quan with me?', 'Chơi ô ăn quan với tớ không?'];
  const n = await P.page.evaluate(line => { const h = __sv.heroes[0]; __sv.kidTalk(h, 'oanquan', 'Tèo', line); __sv.kidTalk(h, 'oanquan', 'Tèo', line); return document.querySelectorAll('.dialog:not(.out)').length; }, line);
  ok(n === 1, `asking twice opened ${n} speech boxes`);
  await P.page.click('.dialog:not(.out) .dch'); await P.page.waitForSelector('.gl', { timeout: 15000 }); await P.page.waitForTimeout(600);
  const left = await P.page.evaluate(() => [...document.querySelectorAll('.dialog')].filter(d => !d.classList.contains('out')).map(d => d.textContent.slice(0, 40)));
  ok(!left.length, `a speech box left under the game: ${left.join(' | ')}`);
  await P.page.evaluate(() => document.querySelector('.gl .gl-x').click()); await P.page.waitForTimeout(500);
  const again = await P.page.evaluate(line => { __sv.kidTalk(__sv.heroes[0], 'oanquan', 'Tèo', line); return document.querySelectorAll('.dialog:not(.out)').length; }, line);
  ok(again === 1, `after the game, talking to Tèo again opened ${again} speech boxes`);
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  return 'a second ask while Tèo is talking is ignored; Play! leaves nothing under the game; he talks again afterwards';
});

await check('allphotos', async () => {
  // (owner, 1 Nov 2026 AEDT: "every landmark and information spot with pictures: fill in every one missing") every landmark
  // has its real place (photos and 360°) and photos listed; every symbol animal and every kind of house has photos too
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const R = await import('/js/regions.js'), W = await import('/js/realworld.js'), idx = await (await fetch('/photos/index.json')).json();
    const has = src => !!(src && Array.isArray(idx[W.photoKey(src)]) && idx[W.photoKey(src)].length);
    const sym = await (await fetch('/js/symbols.js')).text(), lists = [...sym.matchAll(/\[('(?:en|vi):[^']+'(?:,\s*'(?:en|vi):[^']+')*)\]/g)].map(m => [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]));
    return { landmarks: R.LANDMARKS.length, noReal: R.LANDMARKS.filter(l => !W.REAL[l.id]).map(l => l.id), noPhotos: R.LANDMARKS.filter(l => W.REAL[l.id] && !has(W.REAL[l.id][0])).map(l => l.id),
      symbols: lists.length, symbolsNone: lists.filter(s => !has(s)).map(s => s[0]), kindsNone: Object.entries(W.REAL_KINDS || {}).filter(([, s]) => !has(s)).map(([k]) => k) };
  });
  ok(!r.noReal.length && !r.noPhotos.length && r.symbols >= 10 && !r.symbolsNone.length && !r.kindsNone.length, JSON.stringify(r));
  await P.ctx.close();
  return `${r.landmarks} landmarks, ${r.symbols} symbol animals and every kind of house have real photos`;
});

await check('realphotos', async () => {
  // (owner, 17 Oct AEDT: "point photos to Wikimedia; if no internet, mention internet required"; replaces round R's
  // "served from our own site") the photos listed in photos/index.json are shown from Wikimedia or Flickr, or from
  // photos/ when Studio kept a copy; any other web address is left out; the credit is words, not a link; a place with
  // none says the photos are on their way; 360° (Google) opens only after a grown-up's press and hold.
  // (round O) 360° opens on top of the photos.
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const outside = []; P.page.on('request', q => { const u = q.url(); if (/^https?:/.test(u) && !u.startsWith(P.page.url().split('/').slice(0, 3).join('/')) && !/^https:\/\/((upload|thumb)\.wikimedia\.org|live\.staticflickr\.com|maps\.google\.com)\//.test(u)) outside.push(u); });
  await P.page.route(/^https:\/\/((upload|thumb)\.wikimedia\.org|live\.staticflickr\.com)\//, r => r.fulfill({ body: png, contentType: 'image/png' }));
  await P.page.route('**/photos/index.json*', r => r.fulfill({ json: { 'en-saigon-central-post-office': [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Lead.jpg/1280px-Lead.jpg', file: 'File:Lead photo.jpg', caption: 'The post office', credit: 'Photographer · CC BY 2.0 · Wikipedia' },
    { url: 'https://live.staticflickr.com/65535/123_abc_b.jpg', file: 'Inside the hall', caption: 'Inside the hall', credit: 'Someone · BY 2.0 · flickr' },
    { src: 'photos/en-saigon-central-post-office/2.jpg', file: 'File:Kept copy.jpg', caption: 'A copy Studio kept', credit: 'Someone · CC BY-SA 4.0' },
    { url: 'https://pics.example.com/elsewhere.jpg', file: 'Elsewhere', caption: 'not a photo site', credit: 'x' },
    { src: 'https://upload.wikimedia.org/a/elsewhere.jpg', file: 'File:Elsewhere.jpg', caption: 'a web address as a file', credit: 'x' }] } }));
  await P.page.route('**/photos/en-saigon-central-post-office/*.jpg', r => r.fulfill({ body: png, contentType: 'image/png' }));
  await P.page.route('https://maps.google.com/**', r => r.fulfill({ body: '<html><body>map</body></html>', contentType: 'text/html' }));
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/realworld.js'), wait = ms => new Promise(x => setTimeout(x, ms));
    W.openPhotos('Saigon Central Post Office', W.REAL.postoffice[0], { id: 'postoffice' });
    for (let k = 0; k < 40 && !document.querySelector('.rv-img'); k++) await wait(150);
    const v = document.querySelector('.realview'), cap = v.querySelector('.rv-credit') ? v.querySelector('.rv-credit').textContent : '', none = v.classList.contains('none'), dots = v.querySelectorAll('.rv-dots i').length;
    const srcs = [...v.querySelectorAll('.rv-img')].map(i => i.getAttribute('src')), links = v.querySelectorAll('.rv-cap a').length;
    // (10 Oct, owner) Use the internet off: a grown-up presses and holds first; on: the map opens straight away
    const S = await import('/js/state.js'); S.settings.online = false;
    v.querySelector('.rv-360').click(); await wait(400);
    const gate = document.querySelector('.modal.rvgate'), early = !!document.querySelector('.rvmap iframe'), says = gate ? /Google/.test(gate.textContent) : false;
    const btn = gate.querySelector('.rv-ok'), tap = Math.round(btn.getBoundingClientRect().height);
    btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await wait(1900);
    const map = document.querySelector('.modal.rvmap:not(.rvgate)'), q = map.querySelector('.card').getBoundingClientRect(), top = document.elementFromPoint(q.left + q.width / 2, q.top + 30);
    const opened = !!map.querySelector('iframe');
    document.querySelectorAll('.modal').forEach(e => e.remove());
    S.settings.online = true; v.querySelector('.rv-360').click(); await wait(400);
    const direct = !document.querySelector('.modal.rvgate') && !!document.querySelector('.rvmap iframe');
    document.querySelectorAll('.realview, .modal').forEach(e => e.remove());
    W.openPhotos('Uluru', W.REAL.uluru[0], { id: 'uluru' }); for (let k = 0; k < 30 && !document.querySelector('.realview.none'); k++) await wait(100);
    const empty = !!document.querySelector('.realview.none');
    return { none, dots, cap, srcs, links, gate: !!gate, early, says, tap, opened, onTop: !!(top && top.closest('.rvmap')), empty, direct };
  });
  // (owner, 17 Oct AEDT) no internet: every photo fails to come, so the viewer says the photos need the internet
  await P.page.route(/^https:\/\/((upload|thumb)\.wikimedia\.org|live\.staticflickr\.com)\//, r => r.abort('internetdisconnected'));
  await P.page.route('**/photos/en-saigon-central-post-office/*.jpg', r => r.abort('internetdisconnected'));
  const off = await P.page.evaluate(async () => {
    const W = await import('/js/realworld.js'), wait = ms => new Promise(x => setTimeout(x, ms));
    W.openPhotos('Saigon Central Post Office', W.REAL.postoffice[0], { id: 'postoffice' });
    for (let k = 0; k < 40 && !document.querySelector('.rv-nonet'); k++) await wait(150);
    const n = document.querySelector('.rv-nonet'), v = document.querySelector('.realview');
    const out = { note: n ? n.textContent.trim() : '', art: !!(n && n.querySelector('svg, .art')), arrows: v ? getComputedStyle(v.querySelector('.rv-next')).display : '', imgs: v ? v.querySelectorAll('.rv-img').length : -1 };
    document.querySelectorAll('.realview, .modal').forEach(e => e.remove()); return out;
  });
  const errs = P.errors; await P.ctx.close();
  ok(/internet/.test(off.note) && off.art && off.arrows === 'none' && !off.imgs, 'no internet: ' + JSON.stringify(off));
  ok(!r.none && r.dots === 3 && /Photographer/.test(r.cap) && r.srcs.length && r.srcs.every(x => /^(photos\/|https:\/\/((upload|thumb)\.wikimedia\.org|live\.staticflickr\.com)\/)/.test(x)) && !r.links && r.gate && !r.early && r.says && r.tap >= 44 && r.opened && r.onTop && r.direct && r.empty && !outside.length && !errs.length, JSON.stringify(Object.assign(r, { outside, errs })));
  return `3 photos from photos/index.json (Wikimedia, Flickr and a copy Studio kept; other web addresses left out), credit “${r.cap}” as words; nothing asked of any other site; no internet: “${off.note}”; a place with none says they are on their way; 360° asks a grown-up (says it opens Google) while Use the internet is off, then opens on top of the photos; with it on, opens straight away`;
});

await check('events', async () => {
  // architecture step 1: the event bus carries what happened, by id, alongside today's calls; the places sticker book
  // (js/placebook.js) only listens to it: walking into Lotus Village for the first time gives its sticker once
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], W = await import('/js/world.js'), I = await import('/js/i18n.js'), S = await import('/js/state.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    const seen = [], stickers = []; G.events.on('*', (p, n) => { seen.push(n); if (n === 'StickerEarned') stickers.push(p.placeId); });
    delete (h.profile.placeStickers || {}).village; delete (h.profile.visited || {}).village;
    h.place(W.VILLAGE.x, W.VILLAGE.z + 6);
    for (let k = 0; k < 8; k++) { await wait(300); document.querySelectorAll('.storybook, .dialog, .modal').forEach(e => e.remove()); G.paused = false; }
    const got = !!(h.profile.placeStickers || {}).village;
    h.place(W.VILLAGE.x - 40, W.VILLAGE.z + 40); await wait(900); h.place(W.VILLAGE.x, W.VILLAGE.z + 6); await wait(900);
    const earned = stickers.filter(x => x === 'place:village').length;
    G.playGame(0, 'colors', 'replay'); await wait(700); document.querySelector('.gl .gl-x')?.click(); await wait(500);
    S.settings.lang = 'vi'; I.applyLang(); S.settings.lang = 'en'; I.applyLang();
    // the album page shows the book
    G.openPad && G.openPad(0); await wait(300);
    return { got, earned, seen: [...new Set(seen)], recent: G.events.recent().slice(-3).map(e => e.name), ids: G.events.recent().filter(e => e.name === 'ActivityStarted').map(e => e.payload.defId) };
  });
  const errs = P.errors; await P.ctx.close();
  const need = ['PlayerEnteredVillage', 'PlayerLeftVillage', 'StickerEarned', 'ActivityStarted', 'ActivityAbandoned', 'LanguageChanged'];
  ok(r.got && r.earned === 1 && need.every(n => r.seen.includes(n)) && r.ids.includes('game:colors') && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `events seen: ${need.join(', ')}; Lotus Village sticker given once (a second visit gives none)`;
});

await check('postcards', async () => {
  // Studio → Family album → postcards (js/familycards.js): a family photo for Lotus Village arrives when the child walks
  // in (once), shows in the album page, and opens big; Studio's place list is the game's sticker-book place list
  const P = await open(b, { w: 900, h: 640, play: false });
  const jpg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
  await P.page.route('**/content/custom.json*', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ album: [{ id: 'f1', photo: 'content/album/f1.jpg', en: 'Grandma at the market', vi: 'Bà ở chợ', place: 'village' }, { id: 'f2', photo: 'content/album/f2.jpg', en: 'Our garden', vi: 'Vườn nhà mình', place: 'lake' }, { id: 'bad', photo: 'https://example.com/x.jpg', place: 'village' }] }) }));
  await P.page.route('**/content/album/*.jpg', r => r.fulfill({ contentType: 'image/jpeg', body: jpg }));
  await P.page.reload(); await start(P.page); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], W = await import('/js/world.js'), F = await import('/js/familycards.js'), C = await import('/js/custom.js'), PB = await import('/js/placebook.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    const got = []; G.events.on('PostcardEarned', p => got.push(p.postcardId));
    h.profile.familyCards = {}; delete (h.profile.visited || {}).village;
    if (G.regionOf[0] === 'village') { h.place(W.HOME.x, W.HOME.z); await wait(900); }
    h.place(W.VILLAGE.x, W.VILLAGE.z + 6); for (let k = 0; k < 6; k++) { await wait(300); document.querySelectorAll('.storybook, .dialog, .modal').forEach(e => e.remove()); G.paused = false; }
    h.place(W.HOME.x, W.HOME.z); await wait(900); h.place(W.VILLAGE.x, W.VILLAGE.z + 6); await wait(900);
    const box = document.createElement('div'); box.innerHTML = F.familyCardsHTML(h.profile); document.body.appendChild(box);
    const shown = { on: box.querySelectorAll('.famcard.on').length, waiting: box.querySelectorAll('.famcard:not(.on)').length };
    box.querySelector('[data-fam]') && F.bindFamilyCards(box, () => { }); box.querySelector('[data-fam]')?.click(); await wait(300);
    const big = document.querySelector('.famview img'), loaded = !!(big && big.complete && big.naturalWidth > 0); document.querySelector('.famview')?.click(); box.remove();
    const studio = await (await fetch('/studio/ui/app.js')).text(), ids = [...studio.slice(studio.indexOf('const ALBUM_PLACES')).split('];')[0].matchAll(/\['([a-z]+)'/g)].map(m => m[1]);
    return { got, shown, loaded, valid: C.customAlbum().length, studioSame: ids.slice().sort().join() === PB.PLACES.map(x => x.id).sort().join(), ids: ids.length };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.got.length === 1 && r.got[0] === 'postcard:family/f1' && r.shown.on === 1 && r.shown.waiting === 1 && r.loaded && r.valid === 2 && r.studioSame && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `a family photo for Lotus Village arrived once as a postcard, shows in the album and opens big; a photo from outside the game folder is ignored; Studio offers the same ${r.ids} places`;
});

await check('familyphotos', async () => {
  // (round R privacy, 9 Oct) family photos are family-only: custom.json names them family:<name>; without the family code
  // the game shows none (drawn faces stay); with it they come from api/family/<name> (the code in x-family-code), are kept
  // in the "sv-family" cache for offline days, and a code the website no longer takes clears them
  const P = await open(b, { w: 900, h: 640, play: false }), NAME = 'Abcdefghijklmnopqrstuvwx', CODE = 'ABCDEFGHJKMN';
  const jpg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
  let asked = [], good = CODE;
  await P.page.route('**/content/custom.json*', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ album: [{ id: 'f1', photo: 'family:' + NAME, en: 'Grandma', vi: 'Bà', place: 'village' }], faces: { 'Bà Năm': { photo: 'family:' + NAME, skin: '#f0c0a0' } } }) }));
  await P.page.route('**/api/family/*', r => { const c = r.request().headers()['x-family-code'] || ''; asked.push(c); return c === good ? r.fulfill({ contentType: 'image/jpeg', headers: { 'Cache-Control': 'private, no-store' }, body: jpg }) : r.fulfill({ status: 401, body: 'no' }); });
  await P.page.reload(); await start(P.page); await clear(P.page);
  const r1 = await P.page.evaluate(async () => { const C = await import('/js/custom.js'); return { album: C.customAlbum().length, face: !!C.customFace('Bà Năm') }; });
  const r2 = await P.page.evaluate(async code => { const C = await import('/js/custom.js'); const res = await C.setFamilyCode(code); const c = await caches.open('sv-family'), kept = (await c.keys()).length, swHas = (await Promise.all((await caches.keys()).filter(k => k !== 'sv-family').map(async k => (await (await caches.open(k)).keys()).some(q => /api\/family|__family/.test(q.url))))).some(Boolean);
    return { res, album: C.customAlbum().length, photo: (C.customAlbum()[0] || {}).photo || '', face: !!C.customFace('Bà Năm'), kept, swHas }; }, CODE.toLowerCase().replace(/(.{4})/g, '$1-'));
  good = 'SOMETHINGNEW';
  const r3 = await P.page.evaluate(async () => { const C = await import('/js/custom.js'); const res = await C.refreshFamilyPhotos({ all: true }); return { res, album: C.customAlbum().length, caches: (await caches.keys()).includes('sv-family') }; });
  const errs = P.errors; await P.ctx.close();
  ok(r1.album === 0 && !r1.face && r2.res.ok && r2.album === 1 && /^blob:/.test(r2.photo) && r2.face && r2.kept === 1 && !r2.swHas && asked.includes(CODE) && r3.res.bad && r3.album === 0 && !r3.caches && !errs.length, JSON.stringify({ r1, r2, r3, asked, errs }));
  return 'no code: no family photos; with the code: fetched with x-family-code, kept in sv-family (never the game cache), a changed code clears them';
});

await check('guide', async () => {
  // (Round U) Ông Cú as a guide: after his welcome, each visit he explains one new thing (money, the house, the bus, the
  // signposts, family missions, the job boards, talking to people, the sound button) on a page with a drawn picture,
  // read aloud; the next visit it is the next one, and after the last he starts again
  const P = await open(b, { w: 900, h: 640 });
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, wait = ms => new Promise(r => setTimeout(r, ms));
    const { OWL_LESSONS } = await import('/js/content/owllessons.js'), { pic } = await import('/js/art.js');
    const drawn = OWL_LESSONS.every(l => pic(l.icon).includes('class="art')), bothLangs = OWL_LESSONS.every(l => l.lines.every(([en, vi]) => en && vi && en !== vi));
    const story = G.lanterns; G.lanterns = { ...story, owl: async () => false };   // (past the story's prologue)
    p.quests.owl = true; p.owlLessons = [];
    const owl = G.interactables.find(i => i.id === 'npc_owl'), got = [];
    const visit = async () => {
      owl.act(h, G); let card = null;
      for (let k = 0; k < 40 && !card; k++) { await wait(150); const d = document.querySelector('.dialog:not(.out)'); if (d) { d.click(); await wait(200); } card = document.querySelector('.owl-lesson:not(.out)'); }
      if (!card) return null;
      const art = !!card.querySelector('.sb-art .art'), text = card.querySelector('.sb-text').textContent, paused = G.paused;
      for (let k = 0; k < 4 && document.querySelector('.owl-lesson:not(.out)'); k++) { document.querySelector('.owl-lesson:not(.out) .qt-go').click(); await wait(400); }
      await wait(300);
      return { art, text: text.slice(0, 30), paused, gone: !document.querySelector('.owl-lesson:not(.out)') };
    };
    for (let n = 0; n < OWL_LESSONS.length + 1; n++) { const v = await visit(); got.push(v && v.art && v.paused && v.gone ? p.owlLessons[p.owlLessons.length - 1] : JSON.stringify(v)); }
    G.lanterns = story;
    return { drawn, bothLangs, got, n: OWL_LESSONS.length, ids: OWL_LESSONS.map(l => l.id), paused: G.paused };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.drawn && r.bothLangs && r.got.slice(0, r.n).join() === r.ids.join() && r.got[r.n] === r.ids[0] && !r.paused && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.n} things Ông Cú explains, one per visit in order (${r.ids.join(', ')}), each with a drawn picture; then he starts again`;
});

await check('prices', async () => {
  // (Round U) price pictures and change, sellers remember you: every food stall and kiosk has a price sign (one coin
  // picture per coin, up to 10); paying with more counts the change on, one coin at a time; the next visit the seller
  // greets the child by name on screen, but the spoken words have no name (HANDOFF rule 11)
  const P = await open(b, { w: 900, h: 640 });
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, S = await import('/js/state.js'), V = await import('/js/voice.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    for (let k = 0; k < 40 && !G.world.priceTags; k++) await wait(100);
    const { VENDORS } = await import('/js/vendors.js');
    const food = G.world.stalls.filter(s => s.tap && VENDORS.some(v => 'v_' + v.id === s.tap && v.food));
    const tagged = food.filter(s => G.world.priceTags.some(t => 'v_' + t.id === s.tap)).length, maxPrice = Math.max(...VENDORS.map(v => v.food[3]));
    const said = []; const hear = t => said.push(t); V.spoken.push(hear);
    const v = VENDORS.find(x => x.id === 'bahai'); delete (p.regulars || {}).bahai; p.name = 'Kiwi';
    const it = G.interactables.find(i => i.id === 'v_bahai');
    const talk = async (buy) => { const lines = []; it.act(h, G); for (let k = 0; k < 20; k++) { await wait(250); const d = document.querySelector('.dialog:not(.out)'); if (!d) { if (lines.length) break; continue; } const t = d.querySelector('.dtext').textContent; if (lines[lines.length - 1] !== t) lines.push(t); const chs = d.querySelectorAll('.dch'); if (chs.length) { (buy && lines.length === 1 ? chs[0] : chs[chs.length - 1]).click(); } else d.click(); } return lines; };
    S.farm.coins = 50; const before = S.farm.coins; said.length = 0;
    const first = await talk(true); const paid = before - S.farm.coins;
    const changeLine = first.find(l => /change/i.test(l)) || '';
    said.length = 0; const second = await talk(false), spokeName = said.some(t => /Kiwi/.test(t));
    V.spoken.splice(V.spoken.indexOf(hear), 1);
    return { stalls: food.length, tagged, maxPrice, price: v.food[3], paid, changeLine, first: first.slice(0, 2), greet: second[0], spokeName, said: said.slice(0, 2), paused: G.paused };
  });
  const errs = P.errors; await P.ctx.close();
  const counted = (r.changeLine.match(/,/g) || []).length >= 3;   // price 6 paid with 10: 4 coins counted on
  ok(r.stalls >= 20 && r.tagged === r.stalls && r.maxPrice <= 10 && r.paid === r.price && counted && /Kiwi/.test(r.greet || '') && !r.spokeName && !r.paused && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.tagged} food stalls and kiosks have a coin-picture price; change counted on ("${r.changeLine.slice(0, 70)}…"); the seller greets Kiwi by name on screen, not out loud`;
});

await check('jobs', async () => {
  // (Round U) a job board in every place: off the roads; a child takes a job (find a lost hen near the farm, then take
  // eggs to a market stall), a bobbing picture shows where; tapping it gives coins and says what the place is for
  const P = await open(b, { w: 900, h: 640 });
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, S = await import('/js/state.js'), W = await import('/js/world.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    for (let k = 0; k < 50 && !G.jobs; k++) await wait(100);
    const { JOBS } = await import('/js/content/jobs.js'), { pic } = await import('/js/art.js');
    const want = G.PLACES.filter(pl => pl.key && JOBS[pl.key]).length, boards = G.jobs.boards.length;
    const offRoad = G.jobs.boards.every(B => W.edgeDist(B.x, B.z) > 2), drawn = Object.values(JOBS).every(J => J.jobs.every(j => pic(j.icon).includes('class="art')));
    const delivers = Object.values(JOBS).flatMap(J => J.jobs.filter(j => j.kind === 'deliver')), stallsFor = delivers.every(j => G.world.stalls.some(s => s.place === j.to));
    const close = async () => { for (let k = 0; k < 20; k++) { await wait(200); const rw = document.querySelector('.reward'); if (rw) { rw.click(); continue; } const d = document.querySelector('.dialog:not(.out)'); if (d) { const c = d.querySelectorAll('.dch'); c.length ? c[0].click() : d.click(); continue; } if (!G.paused) break; } };
    p.jobsDone = {}; const B = G.jobs.boards.find(x => x.key === 'farm'); const run = [];
    for (const step of [0, 1]) {
      const job = G.interactables.find(i => i.id === 'job_farm'); job.act(h, G); await close();
      const a = G.jobs.active.get(h), t = a && G.interactables.find(i => i.id === 'jobt_farm');
      const near = a && a.job.kind === 'deliver' ? G.world.stalls.some(s => s.place === 'market' && Math.hypot(s.x - t.x, s.z - t.z) < 4) : t && Math.hypot(t.x - B.x, t.z - B.z) >= 9.5;
      const coins = S.farm.coins; t && t.act(h, G); await close();
      run.push({ kind: a && a.job.kind, near, pay: S.farm.coins - coins, gone: !G.jobs.active.has(h) && !G.interactables.some(i => i.id === 'jobt_farm') });
    }
    return { want, boards, offRoad, drawn, stallsFor, run, done: p.jobsDone.farm, paused: G.paused };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.boards === r.want && r.want >= 14 && r.offRoad && r.drawn && r.stallsFor && r.run.map(x => x.kind).join() === 'find,deliver' && r.run.every(x => x.near && x.pay === 3 && x.gone) && r.done === 2 && !r.paused && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.boards} job boards off the roads; find the hen near the farm, then take eggs to a market stall: +3 coins each, and what the place is for`;
});

await check('dayplan', async () => {
  // (Round U) the villagers' day: a job picture over each head; at dusk the ones with a house nearby walk to its door and go
  // in, the rest light a lantern, lanterns glow over the stalls; in the morning everyone comes back out to their spot; an
  // umbrella in the rain; and nobody ever walks on a road or through a house
  const P = await open(b, { w: 900, h: 640 });
  const r = await P.page.evaluate(async () => {
    const G = __sv, W = G.world, wait = ms => new Promise(r => setTimeout(r, ms)), S = await import('/js/state.js'), { pic } = await import('/js/art.js');
    for (let k = 0; k < 80 && !G.dayPlan; k++) await wait(100);
    const D = G.dayPlan, all = D.list; G.paused = true; const V = { filter: f => all.filter(v => !v.external).filter(f), every: f => all.every(f), get length() { return all.filter(v => !v.external).length; }, [Symbol.iterator]: () => all.filter(v => !v.external)[Symbol.iterator]() };   // (people who move on their own, a parade, keep to it)   // (the checks drive the clock by hand)
    const jobs = V.every(v => v.tag && v.tag.parent === v.o && pic(v.job[0]).includes('class="art')), titled = V.every(v => v.job[1] && v.job[2]);
    const bad = new Set(); let t = 0;
    const run = (secs) => { G.paused = false; for (let i = 0; i < secs * 10; i++) { t += .1; W.update(.1, t); for (const v of V) { if (v.inside) continue; const p = v.o.position, moved = Math.hypot(p.x - v.home.x, p.z - v.home.z); if (moved > 1.1 && !D.offRoad(p.x, p.z)) bad.add(v.it.id); } } G.paused = true; };
    S.settings.alwaysDay = false;
    W.time = .86; run(40);
    const night = { inside: V.filter(v => v.inside).length, withDoor: V.filter(v => v.door).length, lamps: V.filter(v => !v.door && v.lamp.visible).length, noDoor: V.filter(v => !v.door).length, lights: D.lights.filter(l => l.visible).length, stalls: D.lights.length };
    W.time = .4; run(40);
    const day = { out: V.filter(v => !v.inside).length, home: V.filter(v => Math.hypot(v.o.position.x - v.home.x, v.o.position.z - v.home.z) < 3).length, lights: D.lights.filter(l => l.visible).length };
    G.weather.start(); run(1); const umb = V.filter(v => v.umb.visible).length; G.weather.stop(); run(1);
    G.paused = false;
    // (Round V, owner 13 Oct) people seated at the card tables never leave their stool (they sat in the air by the road)
    const seated = V.filter(v => v.o.userData.seated), sitMoved = seated.filter(v => Math.hypot(v.o.position.x - v.home.x, v.o.position.z - v.home.z) > .05 || v.inside).length;
    return { n: V.length, all: all.length, jobs, titled, night, day, umb, bad: [...bad].slice(0, 5), seated: seated.length, sitMoved };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.n > 10 && r.jobs && r.titled && r.night.withDoor > 0 && r.night.inside === r.night.withDoor && r.night.lamps === r.night.noDoor && r.night.lights === r.night.stalls && r.day.out === r.n && r.day.home === r.n && r.day.lights === 0 && r.umb === r.n && !r.bad.length && r.seated > 0 && !r.sitMoved && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.n} villagers with a job picture; at night ${r.night.inside} go home through their door, ${r.night.lamps} light a lantern, ${r.night.lights} stall lanterns; all back out in the morning; umbrellas in the rain; nobody on a road or in a house`;
});

await check('familymissions', async () => {
  // (Round U, owner 11 Oct: 15 tasks for family missions, week and bedtime, and a short guide) Grown-ups → Family lists 15
  // ready-made missions (day, week, bedtime) with switches and the family-play guide; the ones turned on (one of each kind
  // to start) show in the child's Adventures with a "?" guide; a done day mission comes back the next day
  const P = await open(b, { w: 900, h: 700 }); await clear(P.page); const page = P.page;
  const r = await page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], { settings } = await import('/js/state.js'), F = await import('/js/content/familymissions.js');
    const box = document.createElement('div'); box.innerHTML = G.parents.grownupsHTML(true); document.body.appendChild(box);
    const out = { ready: box.querySelectorAll('[data-fmready]').length, on: box.querySelectorAll('[data-fmready]:checked').length, guide: box.querySelectorAll('.fmguide .fmg').length };
    box.remove();
    const log = () => { const d = document.createElement('div'); d.innerHTML = G.parents.logHTML(h.profile); return d; };
    const L = log(); out.child = L.querySelectorAll('[data-mtick]').length; out.help = !!L.querySelector('.fmhelp');
    out.kinds = F.FAMILY_MISSIONS.reduce((a, m) => (a[m.kind] = (a[m.kind] || 0) + 1, a), {});
    // tick the day one: gone; a day later: back
    const id = 'r_f_table'; G.parents.tick ? 0 : 0; settings.missionsDone = { ...(settings.missionsDone || {}), [id]: { [h.profile.id]: Date.now() } };
    out.afterTick = log().querySelectorAll(`[data-mtick="${id}"]`).length;
    settings.missionsDone[id][h.profile.id] = Date.now() - 864e5 * 1.1; out.nextDay = log().querySelectorAll(`[data-mtick="${id}"]`).length;
    const bad = F.FAMILY_MISSIONS.filter(m => !m.en || !m.vi || /[ăâđêôơư]/i.test(m.en.replace(/"[^"]*"/g, ''))).map(m => m.id); out.bad = bad;
    return out;
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.ready === 15 && r.on === 3 && r.guide === 4 && r.child >= 3 && r.help && r.kinds.day === 5 && r.kinds.week === 5 && r.kinds.bedtime === 5 && r.afterTick === 0 && r.nextDay === 1 && !r.bad.length && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return '15 ready-made missions (5 day, 5 week, 5 bedtime) with switches, 3 on to start, the family-play guide for grown-ups and the child (?), a day mission back the next day';
});

await check('wearbag', async () => {
  // (Round U, owner 11 Oct: "all clothes and accessories when bought should show in the wear area unless they are worn;
  // clothes as per gender") the Backpack lists everything bought and not worn (tap to wear) and what is worn (tap to take
  // off); the shop shows a girl the girls' things and the ones for both first, the rest behind More
  const P = await open(b, { w: 900, h: 700 }); await clear(P.page); const page = P.page;
  const r = await page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, S = await import('/js/content/shop.js'), st = await import('/js/state.js'), w = t => new Promise(r => setTimeout(r, t));
    p.look.set = 'girl'; p.owned.clothes = []; const top = S.CLOTHES.find(it => it.slot === 'top' && it.for !== 'b'), feet = S.CLOTHES.find(it => it.slot === 'feet' && it.for !== 'b');
    st.farm.coins = 999; S.buy(p, 999, top.id); S.buy(p, 999, feet.id); S.wear(p, 'top', 'none'); S.wear(p, 'feet', 'none');
    const out = {};
    for (let k = 0; k < 20 && !document.querySelector('.pad [data-wear]'); k++) { if (!document.querySelector('.pad')) { G.paused = false; G.openPad(0, 'bag'); } await w(300); }
    const ids = () => [...document.querySelectorAll('.pad [data-wear]')].map(b => b.dataset.wear), worn = () => [...document.querySelectorAll('.pad [data-unwear]')].map(b => b.dataset.unwear);
    out.before = ids(); document.querySelector(`.pad [data-wear="${top.id}"]`)?.click(); await w(300);
    out.helpFirst=!!document.querySelector('.bag-help')&&p.look.top!==top.id;
    document.querySelector('.bag-help .bh-close')?.click();await w(100);out.cancelKept=p.look.top!==top.id&&ids().includes(top.id);
    document.querySelector(`.pad [data-wear="${top.id}"]`)?.click();await w(100);document.querySelector('.bag-help .bh-act')?.click();await w(300);
    out.after = ids(); out.worn = worn(); out.look = p.look.top === top.id;
    document.querySelector('.pad [data-unwear="top"]')?.click(); await w(100);out.removeHelp=p.look.top===top.id;document.querySelector('.bag-help .bh-act')?.click();await w(300);out.back=ids().includes(top.id);
    document.querySelectorAll('.modal').forEach(m => m.remove()); G.paused = false;
    // (Round V, owner 13 Oct) the shop: a girl sees no boys-only thing, and there is no More (the other set comes as a friend's gift)
    if (G.shop && G.shop.on()) { G.shop.openShop(0); await w(400); const boys = new Set(S.CLOTHES.filter(it => it.for === 'b').map(it => it.id));
      const seen = () => [...document.querySelectorAll('.shopk .kitem')].map(b => b.dataset.id);
      let any = false; for (const tab of document.querySelectorAll('.shopk [data-tab]')) { tab.click(); await w(150); if (seen().some(id => boys.has(id) && !S.owns(p, id))) any = true; }
      out.boysFirst = any; const more = document.querySelector('.shopk .kmore'); if (more) { more.click(); await w(200); } out.more = !!more;
      document.querySelector('.shopk [data-set="g"]')?.click();await w(100);document.querySelector('.shopk [data-tab="top"]')?.click();await w(100);out.ladiesCorrect=seen().length>0&&seen().every(id=>S.ITEM[id].for!=='b');
      document.querySelector('.shopk [data-set="b"]')?.click();await w(100);out.menCorrect=seen().length>0&&seen().every(id=>S.ITEM[id].for!=='g');
      document.querySelectorAll('.modal').forEach(m => m.remove()); G.paused = false; } else out.noShop = true;
    return { ...out, top: top.id, feet: feet.id };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.before.includes(r.top) && r.before.includes(r.feet) && r.helpFirst && r.cancelKept && r.removeHelp && !r.after.includes(r.top) && r.worn.includes('top') && r.look && r.back && (r.noShop || (!r.boysFirst && !r.more && r.ladiesCorrect && r.menCorrect)) && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return 'Bag help never wears an item; explicit confirmation wears/removes it; cancellation preserves it; both collection filters match their items';
});

await check('talk', async () => {
  // (Round U, owner 11 Oct: "all NPCs should be able to talk and should throw facts or slangs") every person standing in
  // the valley has a tap within reach; the villagers without words of their own tell a fact or a saying of their
  // region, in the chosen language
  const out = [];
  for (const lang of ['en', 'vi']) {
    const P = await open(b, { w: 800, h: 600, lang }); await clear(P.page); await P.page.waitForTimeout(1200);
    const r = await P.page.evaluate(async lang => {
      const G = __sv, me = new Set(G.heroes.map(h => h.av && h.av.root)), people = [];
      G.scene.traverse(o => { if (o.userData.avatar && !me.has(o) && o.parent === G.scene) people.push(o); });
      const silent = people.filter(o => !G.interactables.some(i => Number.isFinite(i.x) && Math.hypot(i.x - o.position.x, i.z - o.position.z) < 3)).map(o => [Math.round(o.position.x), Math.round(o.position.z)]);
      const v = G.interactables.find(i => /^villager_/.test(i.id)); let said = '';
      if (v) { v.act(G.heroes[0], G); await new Promise(r => setTimeout(r, 600)); said = (document.querySelector('.dialog .dtext') || {}).textContent || ''; document.querySelectorAll('.dialog').forEach(d => d.remove()); G.paused = false; }
      // (Round V, owner 13 Oct) a child's character rebuilt (new clothes) is never taken for a villager: no "Say hello" that
      // follows the child, no job picture over their head, and the old character's tap is gone
      const h = G.heroes[0]; h.buildModel(); G.villagerTalk.scan(); await new Promise(r => setTimeout(r, 200)); G.villagerTalk.scan();
      const onMe = G.interactables.filter(i => /^villager_/.test(i.id) && Math.hypot(i.x - h.pos.x, i.z - h.pos.z) < 1.5).length;
      let tagOnMe = 0; h.av.root.traverse(o => { if (o.isSprite) tagOnMe++; });
      const ghosts = G.villagerTalk.list.filter(e => e.o.parent !== G.scene).length;
      return { people: people.length, silent, villagers: G.interactables.filter(i => /^villager_/.test(i.id)).length, said, onMe, tagOnMe, ghosts };
    }, lang);
    if (r.silent.length || !r.villagers || r.said.length < 15 || (lang === 'en' && /[ăâđêơư]/i.test(r.said)) || r.onMe || r.tagOnMe || r.ghosts) out.push(lang + ' ' + JSON.stringify(r));
    const errs = P.errors; await P.ctx.close(); if (errs.length) out.push(errs.join(' '));
  }
  ok(!out.length, out.join(' | '));
  return 'every person in the valley answers a tap; the villagers without their own words tell a fact or a saying of their region, in English or Vietnamese; a child whose character is rebuilt gets no "Say hello" and no job picture';
});

await check('secondset', async () => {
  // (r90, owner 24 Oct AEDT) the second set of games and stories: held in Studio (New games / New stories off) it shows as
  // one "Coming soon" tile and can't be opened anywhere (the Simple screen and the story list leave it out); switched on,
  // the games still to unlock fold into one padlock tile that one tap opens, and the same on the story shelves
  const P = await open(b, { w: 820, h: 1180 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const C = (await import('/js/custom.js')).CUSTOM, U = await import('/js/content/unlocks.js'), A = await import('/js/content/activities.js'), F = await import('/js/games/frame.js');
    const p = __sv.heroes[0].profile, newIds = Object.values(U.SECOND_SET_GAMES).flat(), wait = ms => new Promise(r => setTimeout(r, ms));
    const shut = async () => { document.querySelectorAll('.modal.hub .x').forEach(x => x.click()); await wait(300); };
    const hub = async tab => { await shut(); __sv.openGamesHub(0); await wait(400); document.querySelector(`.hubtabs [data-tab="${tab}"]`)?.click(); await wait(300); return document.querySelector('.hubbody'); };
    const plays = root => [...root.querySelectorAll('[data-play]')].map(b => b.dataset.play);
    const out = {};
    C.releases = { ...(C.releases || {}), newGames: { on: false }, newStories: { on: false } };
    let body = await hub('hocvui');
    // (30 Oct 2026 AEDT) the Coming soon tile names its group now (data-soon="learn"), so it is found by its tile
    out.offSoon = !!body.querySelector('.hsoon [data-soon]'); out.offNoNew = !plays(body).some(id => newIds.includes(id)); out.offNoFold = !body.querySelector('[data-fold]');
    out.offSimple = !A.gamesIn(F.GAMES, 'numbers', false).some(g => newIds.includes(g.id)); out.offTales = !__sv.TALES.some(t => Object.values(U.SECOND_SET_TALES).flat().includes(t.id));
    out.offShut = !U.isOpen({ unlockAll: true }, 'solids', 'game', 'shapes');   // (v1.08 maths: the numbers set is switched on, so a shapes game is the sample)
    body = await hub('tales'); out.offTaleSoon = !!body.querySelector('[data-soon="tale"]');
    C.releases.newGames = { on: true }; C.releases.newStories = { on: true }; p.unlockAll = false; p.admin = false;
    body = await hub('hocvui');
    const fold = body.querySelector('[data-fold]'); out.onFold = !!fold; out.onHidden = !body.querySelector('.hcard.locked'); out.onNoSoon = !body.querySelector('.hsoon [data-soon]');
    fold?.click(); await wait(300); body = document.querySelector('.hubbody'); out.onShown = body.querySelectorAll('.hcard.locked').length; out.onGuide = body.querySelectorAll('.hlockguide .hsoonrow').length; // (owner, 1 Nov 2026 AEDT) the unfolded padlock says what to do first
    body = await hub('tales'); const tf = body.querySelector('[data-fold-tale]'); out.taleFold = !!tf; tf?.click(); await wait(300); out.taleShown = document.querySelectorAll('.hubbody .talecard.locked').length;
    await shut();
    return out;
  });
  await P.ctx.close();
  const bad = Object.entries(r).filter(([k, v]) => k === 'onShown' || k === 'taleShown' ? !(v > 0) : !v).map(([k]) => k);
  ok(!bad.length, 'failed: ' + bad.join(', ') + ' ' + JSON.stringify(r));
  return `held: one Coming soon tile (games and stories), no new game in the menu, the Simple screen or the story list, none can be opened; on: the games to unlock fold into one padlock tile (${r.onShown} shown on a tap), the stories too (${r.taleShown})`;
});

await check('familynote', async () => {
  // (13 Oct: the first family note published from Studio online) the grown-ups' note in content/custom.json shows once a
  // day as "From your family", in the child's language (the other language when one is empty), and not again that day
  const note = r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ message: { en: '', vi: 'Các con giỏi lắm' } }) });
  const P = await open(b, { w: 390, h: 844, touch: true, settings: { familyMsgDay: null }, route: ctx => ctx.route('**/content/custom.json*', note) });
  const shown = await P.page.waitForFunction(() => [...document.querySelectorAll('.dialog')].map(d => d.textContent).find(t => /From your family/.test(t)), null, { timeout: 30000 }).then(h => h.jsonValue()).catch(() => '');
  await P.page.evaluate(() => { document.querySelectorAll('.dialog').forEach(d => d.remove()); __sv.paused = false; });
  // seen today is saved (the next start checks it); a reload here would bring back the harness's own starting settings
  await P.page.waitForTimeout(4000);
  const again = await P.page.evaluate(() => [...document.querySelectorAll('.dialog')].some(d => /From your family/.test(d.textContent)) || JSON.parse(localStorage.getItem('sv2_settings') || '{}').familyMsgDay !== new Date().toDateString());
  const errs = P.errors; await P.ctx.close();
  ok(/From your family/.test(shown) && /Các con giỏi lắm/.test(shown) && !again && !errs.length, JSON.stringify({ shown, again, errs }));
  return 'the note shows once a day ("From your family"), the Vietnamese words when the English is empty; seen today is saved and it does not come back';
});

await check('chests', async () => {
  // treasure chests for two (round G): a child alone on a stone hears that a friend is needed; two children (split
  // screen here; a friend online works the same) on the two stones open it: coins, a treat, and the best-friends sticker
  const P = await open(b, { w: 1280, h: 800, mode: 'split' }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, S = await import('/js/state.js'), wait = ms => new Promise(r => setTimeout(r, ms)), [h0, h1] = G.heroes, c = G.chests.chests[0];
    h0.profile.chests = {}; h1.profile.chests = {}; const coins0 = S.farm.coins, n = G.chests.chests.length;
    h0.place(c.plates[0].x, c.plates[0].z); h1.place(c.x + 30, c.z + 30); await wait(300); G.chests.tick();
    const alone = !!h0.profile.chests[c.id];
    h1.place(c.plates[1].x, c.plates[1].z); await wait(300); G.chests.tick();
    return { n, alone, open0: !!h0.profile.chests[c.id], open1: !!h1.profile.chests[c.id], coins: S.farm.coins - coins0, sticker: h0.profile.stickers.includes('🤝'), page: G.chests.html(h0.profile).includes('1/') };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.n >= 5 && !r.alone && r.open0 && r.open1 && r.coins === 40 && r.sticker && r.page && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.n} chests; one child alone: shut; two on the stones: open for both (+${r.coins} coins, a treat each, the best-friends sticker)`;
});

/* daily adventure (chat C) */
// (owner plan 16 Oct AEDT; js/adventure.js, js/content/adventures.js) the goal card, the window (ADV-1 to ADV-6), every
// step's spot really in the valley, one adventure played from start to end by an under-5 on a phone in English and a
// big kid on a computer in Vietnamese (counting, D12), talk, play and cook steps, a missed day keeping its stamps,
// Grandpa Owl remembering yesterday (D11), the week chest (D10), the Tricky timer only for 5 and over, and the switch
await check('dailyadventure', async () => {
  for (const [w, h, touch, age, lang] of [[390, 844, true, 'little', 'en'], [1280, 800, false, 'big', 'vi']]) {
    const P = await open(b, { w, h, touch, lang }); await clear(P.page);
    await P.page.waitForFunction(() => window.__sv && __sv.adventure, null, { timeout: 30000 });
    await P.page.addStyleTag({ content: '.htoast { display: none !important; }' });
    const tag = `${w} ${age} ${lang}`;
    // every spot the adventures use is in this valley
    const miss = await P.page.evaluate(async () => { const { ADVENTURES } = await import('/js/content/adventures.js'), out = [];
      for (const a of ADVENTURES) for (const s of a.steps) if (s.at && !__sv.adventure.where(s.at)) out.push(a.id + ':' + s.at); return out; });
    ok(!miss.length, `${tag}: spots not in the valley: ${miss.join(', ')}`);
    await P.page.evaluate(seedAdventureWalk, age);
    await P.page.waitForTimeout(600);
    // HUD-4: the goal card shows the step, 3 dots, Go walk button and hear-again; a tap opens the window
    const card = await P.page.evaluate(() => { const c = document.querySelector('.hud .advcard'); if (!c || c.hidden) return null; const r = c.getBoundingClientRect(), hear = c.querySelector('.adv-hear').getBoundingClientRect(), walk = c.querySelector('.adv-walk').getBoundingClientRect();
      return { text: c.querySelector('.adv-text').textContent, dots: c.querySelectorAll('.adv-dots i').length, now: c.querySelectorAll('.adv-dots i.now').length, hear: Math.min(hear.width, hear.height), walk: Math.min(walk.width, walk.height), right: r.right, quest: getComputedStyle(document.querySelector('.hud .q-say')).display }; });
    ok(card && card.dots === 3 && card.now === 1 && card.hear >= 44 && card.walk >= 44 && card.right <= w + 1 && card.quest !== 'none', `${tag}: goal card under the goal row, which stays (owner, 17 Oct AEDT: "show both") ${JSON.stringify(card)}`);
    ok(lang === 'vi' ? /Phố Hai Quê/.test(card.text) : /Two Homes Street/.test(card.text), `${tag}: the step in the language (${card.text})`);
    await P.page.click('.hud .advcard .adv-open'); await P.page.waitForTimeout(500);
    const win = await P.page.evaluate(() => { const m = document.querySelector('.modal.advwin'); if (!m) return null; const R = e => e.getBoundingClientRect();
      const go = m.querySelector('.adv-go'), x = m.querySelector('.x'), stepGo = m.querySelector('.adv-step.now .adv-step-go');
      return { steps: m.querySelectorAll('.adv-step').length, stamps: m.querySelectorAll('.adv-stamp').length, chest: !!m.querySelector('.adv-chestrow .adv-rew'), mains: m.querySelectorAll('.adv-go').length, stepGo: stepGo ? Math.min(R(stepGo).width, R(stepGo).height) : 0, go: R(go).height, x: R(x).width, goBottom: R(go).bottom, wide: [...m.querySelectorAll('*')].some(e => R(e).right > innerWidth + 1), txt: m.innerText }; });
    ok(win && win.steps === 3 && win.stamps === 7 && win.chest && win.mains === 1 && win.stepGo >= 44, `${tag}: window ${JSON.stringify(win && { ...win, txt: '' })}`);
    ok(win.go >= 64 && win.x >= 56 && win.goBottom <= h + 1 && !win.wide, `${tag}: big buttons, all on screen (${win.go}, ${win.x}, ${win.goBottom})`);
    ok(lang === 'vi' ? win.txt.includes('Phiêu lưu hôm nay') && !win.txt.includes("Today's adventure") : win.txt.includes("Today's adventure"), `${tag}: the window in the language`);
    await P.page.screenshot({ path: `out/dailyadventure-window-${w}.png` });
    await P.page.click('.modal.advwin .adv-go'); await P.page.waitForTimeout(500);
    const walkSnapshot = await P.page.evaluate(adventureWalkSnapshot);
    ok(walkSnapshot.valid, `${tag}: Let's go closes the window, shows the way and starts walking ${JSON.stringify(walkSnapshot)}`);
    // play it: walk in, find, give (big kids count first), the chest
    const coins0 = await P.page.evaluate(async () => { const S = await import('/js/state.js'); return S.farm.coins; });
    await P.page.evaluate(async () => { const G = __sv, h = G.heroes[0], V = (await import('/js/content/map.js')).anchorOf('town'); h.pos.x = V[0]; h.pos.z = V[1] + 4; h.pos.y = (await import('/js/world.js')).heightAt(h.pos.x, h.pos.z); });
    await P.page.waitForFunction(() => __sv.adventure.today(__sv.heroes[0]).step === 1, null, { timeout: 15000 });
    const things = await P.page.evaluate(() => { const G = __sv, h = G.heroes[0], L = G.adventure.live(h); const n = L.things.length; L.things.forEach(t => t.it.act(h)); return n; });
    ok(things === (age === 'big' ? 5 : 3), `${tag}: ${things} things to find (D12: 3 for under-5s, 5 for big kids)`);
    ok(await P.page.evaluate(() => __sv.adventure.today(__sv.heroes[0]).step === 2), `${tag}: finding them all moves on`);
    await P.page.evaluate(() => { const G = __sv, it = G.interactables.find(i => i.id === 'adv_give'); it.act(G.heroes[0]); });
    await P.page.waitForTimeout(700);
    const counting = await P.page.evaluate(() => !!document.querySelector('.modal.advcount'));
    ok(counting === (age === 'big'), `${tag}: big kids count what they bring, under-5s do not (${counting})`);
    if (counting) {
      await P.page.click('.adv-num:not([data-k="5"])'); await P.page.waitForTimeout(400);
      ok(await P.page.evaluate(() => !!document.querySelector('.modal.advcount')), `${tag}: a wrong number is never a loss: count again`);
      await P.page.click('.adv-num[data-k="5"]');
    }
    await P.page.waitForSelector('.modal.advchest', { timeout: 10000 }); await P.page.waitForTimeout(1500);
    if (age === 'big') { const n = await P.page.$$eval('.adv-coin', c => c.length); for (let k = 0; k < n; k++) await P.page.click(`.adv-coin[data-k="${k}"]`); }
    await P.page.waitForSelector('.advchest .adv-go:not([hidden])', { timeout: 5000 });
    await P.page.screenshot({ path: `out/dailyadventure-chest-${w}.png` });
    await P.page.click('.advchest .adv-go'); await P.page.waitForTimeout(500);
    const end = await P.page.evaluate(async () => { const S = await import('/js/state.js'), p = __sv.heroes[0].profile; return { coins: S.farm.coins, sticker: !!(p.stickerBook && p.stickerBook.got.hue), r: p.adventure, card: !document.querySelector('.hud .advcard')?.hidden }; });
    ok(end.r.done && end.r.stamps.length === 1 && end.sticker && end.coins - coins0 === 10, `${tag}: the chest gives the sticker and 10 coins and a stamp (${end.coins - coins0}, ${end.sticker}, ${end.r.stamps})`);
    ok(!end.card, `${tag}: done for today: the usual goal row comes back`);
    // talk, play and cook steps listen for what already happens
    const kinds = await P.page.evaluate(async () => { const G = __sv, h = G.heroes[0], A = G.adventure, { events } = await import('/js/core/events.js'), { id } = await import('/js/core/ids.js'), me = id('player', h.profile.id || 'guest'), out = {};
      const pause = ms => new Promise(r => setTimeout(r, ms));
      // close each chest the way a child does (coins counted, Hooray); one may still be on its way (it waits until the child is free)
      const chests = async () => { for (let k = 0; k < 16; k++) { await pause(500); document.querySelectorAll('.advchest .adv-coin:not(.on)').forEach(c => c.click()); document.querySelectorAll('.advchest .adv-go:not([hidden])').forEach(b => b.click()); } };
      A.force(0, 'bunny'); events.emit('InteractionStarted', { playerId: me, entityId: 'interaction:bear', action: 'act', it: 'bear' }); await new Promise(r => setTimeout(r, 700)); out.talk = A.today(h).step;
      A.force(0, 'kite'); A.today(h).step = 2; A.sync(h); events.emit('InteractionStarted', { playerId: me, entityId: 'interaction:g-kite', action: 'act', it: 'g_kite' }); await new Promise(r => setTimeout(r, 500));
      events.emit('ActivityStarted', { activityId: 'act:kite/1', kind: 'game', defId: 'game:kite', players: [me], source: 'folk' }); events.emit('ActivityCompleted', { activityId: 'act:kite/1', defId: 'game:kite', players: [me], result: { won: true } }); out.play = A.today(h).done; await chests();
      A.force(0, 'supper'); A.today(h).step = 1; A.sync(h); const before = (h.profile.inv || {}).mushroom || 0; A.live(h).things.forEach(t => t.it.act(h)); out.bag = ((h.profile.inv || {}).mushroom || 0) - before;
      G.onCooked(h, { id: 'nam' }); out.cook = A.today(h).done; await chests(); out.paused = G.paused;
      return out; });
    ok(kinds.talk === 1 && kinds.play === true && kinds.bag >= 3 && kinds.cook === true && !kinds.paused, `${tag}: talk, play and cook steps ${JSON.stringify(kinds)}`);
    // the Tricky timer: only for 5 and over (ADV-5)
    const timer = await P.page.evaluate(async () => { const G = __sv, h = G.heroes[0], A = G.adventure, S = await import('/js/state.js'); S.settings.advLevel = 'tricky';
      A.force(0, 'house'); A.next(h); const t = A.today(h).timer; S.settings.advLevel = 'gentle'; return !!t; });
    ok(timer === (age === 'big'), `${tag}: a Tricky timer only for 5 and over (${timer})`);
    // a missed day keeps its stamps; Grandpa Owl remembers yesterday's (D11); 7 stamps open the week chest (D10)
    const days = await P.page.evaluate(adventureDaySnapshot);
    ok(days.kept === 2 && days.fresh, `${tag}: a missed day takes no stamp away; a new adventure today ${JSON.stringify(days)}`);
    ok(days.told, `${tag}: Grandpa Owl remembers yesterday's adventure ${JSON.stringify(days.diagnostic)}`);
    ok(days.chests === 1 && days.stamps === 0 && days.hat, `${tag}: seven stamps open the week chest: a hat ${JSON.stringify(days)}`);
    // the Adventures tab: today's on top, the rest behind "More adventures"; the switch off: as before
    await P.page.evaluate(() => __sv.openPad(0, 'log')); await P.page.waitForTimeout(500);
    const tab = await P.page.evaluate(() => ({ log: !!document.querySelector('.pad-body .adv-log'), more: !!document.querySelector('.adv-morebtn'), hidden: !!document.querySelector('.adv-more[hidden]') }));
    ok(tab.log && tab.more && tab.hidden, `${tag}: Adventures tab ${JSON.stringify(tab)}`);
    await P.page.screenshot({ path: `out/dailyadventure-tab-${w}.png` });
    await P.page.click('.adv-morebtn'); ok(await P.page.evaluate(() => !document.querySelector('.adv-more[hidden]')), `${tag}: More adventures opens the older lists`);
    await P.page.evaluate(async () => { (await import('/js/state.js')).settings.dailyAdventure = false; document.querySelector('.modal.pad .x').click(); });
    await P.page.waitForTimeout(500); await P.page.evaluate(() => __sv.openPad(0, 'log')); await P.page.waitForTimeout(500);
    const off = await P.page.evaluate(() => ({ tab: !!document.querySelector('.adv-log, .adv-morebtn'), card: !document.querySelector('.hud .advcard')?.hidden }));
    ok(!off.tab && !off.card, `${tag}: switched off in Grown-ups: no card, the tab as before ${JSON.stringify(off)}`);
    await P.page.evaluate(async () => { (await import('/js/state.js')).settings.dailyAdventure = true; });
    ok(!P.errors.length, `${tag}: ${P.errors.join(' | ')}`);
    await P.ctx.close();
  }
});

await check('articentre', async () => {
  // (owner, 17 Oct AEDT: "not in centre and not balanced, please check everywhere") a drawn emoji comes wrapped in .arti; a
  // window rule that sizes the drawing but not its wrapper pushes it off centre (the Bag's food 13 px right, the Passport's
  // question marks out of their stamps). Every Pad tab, every part folded open, and the games hub, on a phone and a computer
  const rows = [];
  const scan = () => { const bad = new Set();
    for (const w of document.querySelectorAll('.arti')) { const g = w.querySelector(':scope > svg'); if (!g) continue;
      const a = w.getBoundingClientRect(), r = g.getBoundingClientRect(); if (!a.width || !r.width) continue;
      const dx = Math.round((r.left + r.right) / 2 - (a.left + a.right) / 2), dy = Math.round((r.top + r.bottom) / 2 - (a.top + a.bottom) / 2);
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) bad.add(w.parentElement.tagName.toLowerCase() + '.' + w.parentElement.className + ' in .' + (w.parentElement.parentElement || {}).className + ' (' + w.dataset.e + ' ' + dx + ',' + dy + ')'); }
    return [...bad]; };
  for (const [dev, w, h, touch, lang] of [['phone', 430, 873, true, 'vi'], ['computer', 1280, 800, false, 'en']]) {
    const P = await open(b, { w, h, touch, lang }); await clear(P.page);
    await P.page.evaluate(() => { const p = __sv.heroes[0].profile; p.bought = { h_tauhu: 1 }; p.dishes = { ...(p.dishes || {}), pho: 1 }; p.inv = { ...(p.inv || {}), ruby: 1, apple: 3, egg: 1 }; __sv.openPad(0, 'map'); });
    await P.page.waitForSelector('.pad-tabs button');
    const tabs = await P.page.evaluate(() => [...document.querySelectorAll('.pad-tabs button')].map(x => x.dataset.t)), bad = [];
    for (const t of tabs) {
      await P.page.evaluate(t => document.querySelector(`.pad-tabs button[data-t="${t}"]`).click(), t); await P.page.waitForTimeout(600);
      await P.page.evaluate(() => document.querySelectorAll('.pad-body [aria-expanded="false"]').forEach(x => x.click())); await P.page.waitForTimeout(300);
      bad.push(...(await P.page.evaluate(scan)).map(x => t + ': ' + x));
    }
    await P.page.evaluate(() => document.querySelector('.pad .x').click()); await P.page.waitForTimeout(400);
    await P.page.evaluate(() => __sv.openGamesHub(0, () => {})); await P.page.waitForTimeout(900);
    bad.push(...(await P.page.evaluate(scan)).map(x => 'games: ' + x));
    rows.push(dev + ': ' + tabs.length + ' tabs and the games hub');
    ok(!bad.length, dev + ': drawn pictures off their centre: ' + bad.slice(0, 8).join('; '));
    ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  }
  return rows.join(', ') + '; every drawn picture centred in its place';
});

await check('r79clothes', async () => {
  // (r79 points 6, 7, 12, 14, 17, 18 and A4; owner 16 Oct AEDT: "boy wears boys clothes ... other genders clothes for
  // gifting only") on a phone and a computer, as a little girl with clothes from an older save: the mirror shows a big
  // picture of her, a tab for each kind, only her own set's clothes, tap to wear and tap again to take off, no Remove;
  // Done goes back to the Shop at the same scroll; the Shop marks the boys' collection as gifts; a gift box in the Bag goes
  // to her brother; "Eat it?" is one small row; every Bag thing explains itself; a game from the Pad's Games page closes
  // back to that page
  const rows = [];
  for (const [dev, w, h, touch] of [['phone', 390, 844, true], ['computer', 1280, 800, false]]) {
    const P = await open(b, { w, h, touch }); await clear(P.page); const bad = [];
    await P.page.evaluate(async () => { const p = __sv.heroes[0].profile, C = await import('/js/content/shop.js');
      p.owned = { ...(p.owned || {}), clothes: ['bow', 'dress_yellow', 'jeans', 'sunhat', 'cap', 'pearls'], gifts: ['cape'] }; p.look.hat = 'bow'; C.adoptWorn(p);
      p.bought = { h_tauhu: 1 }; p.inv = { ...(p.inv || {}), crystal: 1 }; p.levels = { ...(p.levels || {}), counting: 1 }; });
    // the shop in the Pad, scrolled; then the mirror
    await P.page.evaluate(() => __sv.openPad(0, 'shop')); await P.page.waitForSelector('[data-go="wardrobe"]');
    const y0 = await P.page.evaluate(() => { const s = document.querySelector('.pad .pad-body'); s.scrollTop = 300; return s.scrollTop; });
    await P.page.evaluate(() => document.querySelector('[data-set="b"]').click()); await P.page.waitForTimeout(300);
    const giftTiles = await P.page.evaluate(() => [...document.querySelectorAll('.kitem')].map(k => k.classList.contains('gift')));
    if (!giftTiles.length || !giftTiles.every(Boolean)) bad.push('the boys\' collection is not marked as gifts for a girl');
    await P.page.evaluate(() => document.querySelector('[data-set="g"]').click()); await P.page.waitForTimeout(200);
    await P.page.evaluate(() => { const s = document.querySelector('.pad .pad-body'); s.scrollTop = 300; document.querySelector('[data-go="wardrobe"]').click(); });
    await P.page.waitForSelector('.mirror .wbig'); await P.page.waitForTimeout(400);
    const mr = await P.page.evaluate(() => { const M = document.querySelector('.mirror'), img = M.querySelector('.wbig').getBoundingClientRect();
      return { img: img.width, tabs: M.querySelectorAll('[data-wtab]').length, remove: /\bRemove\b|Bỏ ra/.test(M.textContent), items: [...M.querySelectorAll('.wit')].map(b => b.dataset.v) }; });
    if (mr.img < 150) bad.push('the mirror picture is small (' + Math.round(mr.img) + ' px)'); if (mr.tabs !== 7) bad.push('the mirror should have 7 tabs'); // (v1.08b friends: glasses and masks are the seventh kind) if (mr.remove) bad.push('the mirror still says Remove');
    if (mr.items.includes('cap')) bad.push('the boys\' cap shows in her mirror'); if (!mr.items.includes('bow')) bad.push('her bow is missing from the mirror');
    const t = await P.page.evaluate(async () => { const p = __sv.heroes[0].profile, w = ms => new Promise(r => setTimeout(r, ms)), pick = () => [...document.querySelectorAll('.mirror .wit')].find(b => b.dataset.v === 'sunhat');
      pick().click(); await w(200); const on = p.look.hat, tick = !!pick().querySelector('.ktick'); pick().click(); await w(200); const off = p.look.hat;
      document.querySelector('.mirror [data-wtab="bottom"]').click(); await w(200); const bottoms = [...document.querySelectorAll('.mirror .wit')].map(b => b.dataset.v);
      return { on, tick, off, bottoms }; });
    if (t.on !== 'sunhat' || !t.tick) bad.push('tapping the sun hat did not put it on'); if (t.off !== 'none') bad.push('tapping it again did not take it off');
    if (!t.bottoms.includes('jeans_g') || t.bottoms.includes('jeans')) bad.push('her old jeans did not become the girls\' version (' + t.bottoms + ')');
    await P.page.evaluate(() => document.querySelector('.mirror .x').click()); await P.page.waitForTimeout(400);
    const y1 = await P.page.evaluate(() => ({ y: document.querySelector('.pad .pad-body').scrollTop, shop: !!document.querySelector('.pad [data-go="wardrobe"]') }));
    if (!y1.shop) bad.push('Done did not go back to the Shop in the Pad'); if (Math.abs(y1.y - y0) > 6) bad.push('Done did not keep the Shop\'s place (' + y1.y + ' vs ' + y0 + ')');
    // the Bag: a gift box to her brother, the small "Eat it?", and a treasure that explains itself
    await P.page.evaluate(() => document.querySelector('.pad-tabs [data-t="bag"]').click()); await P.page.waitForSelector('[data-gift]');
    await P.page.evaluate(() => document.querySelector('[data-gift="cape"]').click()); await P.page.waitForSelector('.bh-give');
    await P.page.evaluate(() => document.querySelector('.bh-give').click()); await P.page.waitForTimeout(400);
    const gv = await P.page.evaluate(async () => { const S = await import('/js/state.js'), bin = S.profiles.find(q => q.id === 'kbin'); return { mine: __sv.heroes[0].profile.owned.gifts, his: bin.owned.clothes, box: !!document.querySelector('[data-gift="cape"]') }; });
    if (gv.mine.includes('cape') || !gv.his.includes('cape') || gv.box || !gv.mine.includes('cap')) bad.push('the gift box did not go to her brother: ' + JSON.stringify(gv));
    await P.page.evaluate(() => document.querySelector('[data-snack]').click()); await P.page.waitForSelector('.bag-ask');
    const ask = await P.page.evaluate(() => { const a = document.querySelector('.bag-ask'), r = a.getBoundingClientRect(); return { h: r.height, btn: Math.min(...[...a.querySelectorAll('button')].map(b => b.getBoundingClientRect().height)), text: a.textContent }; });
    if (ask.h > 96) bad.push('"Eat it?" is not small (' + Math.round(ask.h) + ' px tall)'); if (ask.btn < 64) bad.push('"Eat it?" buttons under 64 px for a little one'); if (!/Eat it\?/.test(ask.text)) bad.push('"Eat it?" is not asked');
    await P.page.evaluate(() => document.querySelector('.bag-ask .bh-close').click());
    const helps = await P.page.evaluate(async () => { const out = [], w = ms => new Promise(r => setTimeout(r, ms));
      for (const sel of ['[data-sellgem]', '[data-wear]', '[data-unwear]']) { const b = document.querySelector(sel); if (!b) { out.push(sel + ': missing'); continue; } b.click(); await w(150); const c = document.querySelector('.bag-help p'); if (!c || !c.textContent.trim() || /Keep this item in your Backpack/.test(c.textContent)) out.push(sel + ': no explanation'); document.querySelector('.bag-help .bh-close')?.click(); await w(80); }
      return out; });
    bad.push(...helps);
    // point 7: a game from the Pad's Games page closes back to that page
    await P.page.evaluate(() => document.querySelector('.pad-tabs [data-t="games"]').click()); await P.page.waitForSelector('.gcard:not(.locked)');
    await P.page.evaluate(() => document.querySelector('.gcard:not(.locked)').click()); await P.page.waitForSelector('.gl .gl-x', { timeout: 30000 });
    await P.page.waitForTimeout(500); await P.page.evaluate(() => document.querySelector('.gl .gl-x').click());
    const back = await P.page.waitForFunction(() => document.querySelector('.pad .gamelist') ? true : null, null, { timeout: 15000 }).then(() => true).catch(() => false);
    if (!back) bad.push('closing a game from the Pad\'s Games page did not go back to it');
    fs.mkdirSync('out/r79', { recursive: true }); await P.page.screenshot({ path: `out/r79/clothes-${dev}.png` });
    rows.push(dev); ok(!bad.length, dev + ': ' + bad.join('; ')); ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  }
  return rows.join(', ') + ': mirror (big picture, 7 tabs, own set only, tap on/off, no Remove, Done keeps the Shop\'s place); boys\' collection marked as gifts; gift box given to a brother; small "Eat it?"; Bag things explain themselves; Pad game returns to the Pad';
});

// (owner, 30 Oct 2026 AEDT: "where do I manage accessories for companions?") the companion's hats in the shop and the mirror
await check('companionhats', async () => {
  const P = await open(b, { w: 390, h: 844, touch: true, lang: 'vi' }); await clear(P.page);
  await P.page.evaluate(async () => { const G = __sv, h = G.heroes[0], S = await import('/js/state.js'); h.profile.lanterns = { ...(h.profile.lanterns || {}), companion: 'firefly', chapters: { ch1: true }, pet: { feeds: 0, hats: ['party'], hat: 'party' } }; S.farm.coins = 60; G.shop.openShop(0); });
  await P.page.locator('[data-ptab]').click();
  const locked = await P.page.locator('[data-pet="crown"]').isDisabled();
  await P.page.locator('[data-pet="flower"]').click();
  const bought = await P.page.evaluate(async () => { const p = __sv.heroes[0].profile, S = await import('/js/state.js'); return p.lanterns.pet.hats.includes('flower') && p.lanterns.pet.hat === 'flower' && S.farm.coins === 15; });
  await P.page.locator('[data-go="wardrobe"]').click(); await P.page.locator('[data-pwtab]').click();
  await P.page.locator('.wit[data-pet="flower"]').click(); const off = await P.page.evaluate(() => __sv.heroes[0].profile.lanterns.pet.hat == null);
  await P.page.locator('.wit[data-pet="party"]').click(); const on = await P.page.evaluate(() => __sv.heroes[0].profile.lanterns.pet.hat === 'party');
  const errors = P.errors.slice(); await P.ctx.close();
  ok(locked && bought && off && on && !errors.length, JSON.stringify({ locked, bought, off, on, errors }));
  return 'the shop sells the next hat (45 coins), later hats wait locked; the mirror takes a hat off and puts another on';
});

// ---- (v1.08b friends) the four new friends: Welcome, old saves, changing friend, wearables on every friend ----
await check('newfriends', async () => {
  // (plan docs/plans/new-friends-characters.md, owner 3 Nov 2026 AEDT) a new player: name, "boy or girl?" (two big cards),
  // the two friends of that set, a skin tone (5), then the editor (age, start screen, difficulty) with the name filled in.
  // On a phone (both ways), a tablet and a computer every step fits on one screen with 44 px buttons and 16 px text.
  const rows = [], bad = [];
  for (const [dev, w, h, touch] of [['phone', 390, 844, true], ['phone-land', 844, 390, true], ['tablet', 1024, 768, true], ['computer', 1280, 800, false]]) {
    const P = await open(b, { w: w as number, h: h as number, touch: touch as boolean, play: false, pre: () => { localStorage.setItem('sv2_profiles', '[]'); } });
    await P.page.click('.screen.title .press', { force: true }); await P.page.waitForSelector('.screen.who');
    await P.page.click('.who .make'); await P.page.waitForSelector('.modal.friendpick .fr-name');
    const fit = () => P.page.evaluate(() => { const c = document.querySelector('.modal.friendpick .card'), r = c.getBoundingClientRect(), small = [], tiny = [];
      c.querySelectorAll('button, input').forEach((e: HTMLElement) => { const q = e.getBoundingClientRect(); if (q.width && (q.width < 44 || q.height < 44)) small.push(e.className + ' ' + Math.round(q.width) + 'x' + Math.round(q.height)); });
      c.querySelectorAll('h2, b, small, p, button, input').forEach((e: HTMLElement) => { if (e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 16) tiny.push(e.className || e.tagName); });
      return { inside: r.top >= 0 && r.bottom <= innerHeight + 1 && r.left >= 0 && r.right <= innerWidth + 1, scroll: c.scrollHeight > c.clientHeight + 2 || document.querySelector('.modal.friendpick').scrollHeight > innerHeight + 2, small, tiny }; });
    const steps = {};
    await P.page.fill('.fr-name', 'An'); steps['name'] = await fit();
    await P.page.click('.friendpick [data-go="next"]'); steps['gender'] = await fit();
    await P.page.click('.friendpick [data-set="boy"]');
    const boys = await P.page.$$eval('.friendpick [data-friend]', e => e.map((x: HTMLElement) => x.dataset.friend));
    await P.page.click('.friendpick [data-go="back"]'); await P.page.click('.friendpick [data-set="girl"]');
    const girls = await P.page.$$eval('.friendpick [data-friend]', e => e.map((x: HTMLElement) => x.dataset.friend));
    const doneOff = await P.page.$eval('.friendpick [data-go="done"]', (e: HTMLButtonElement) => e.disabled);
    await P.page.click('.friendpick [data-friend="lumi"]'); await P.page.click('.friendpick .fr-skin:nth-child(3)'); steps['friend'] = await fit();
    const side = await P.page.evaluate(() => { const c = [...document.querySelectorAll('.friendpick .fr-card')].map(e => e.getBoundingClientRect()); return c.length === 2 && Math.abs(c[0].top - c[1].top) < 2; });
    await P.page.click('.friendpick [data-go="done"]'); await P.page.waitForSelector('.modal.editor #nm');
    const ed = await P.page.evaluate(() => ({ name: (document.querySelector('#nm') as HTMLInputElement).value, friendRow: [...document.querySelectorAll('#cFriend [data-friend]')].map((e: HTMLElement) => e.dataset.friend + (e.classList.contains('on') ? '*' : '')) }));
    await P.page.evaluate(() => (document.querySelector('#eSave') as HTMLElement).click());
    await P.page.waitForSelector('.who .go:not([disabled])'); await P.page.evaluate(() => { window.__sv._owlAuto = true; }); await P.page.click('.who .go');
    await P.page.waitForFunction(() => window.__sv && window.__sv.heroes.length > 0);
    const r = await P.page.evaluate(async () => { const S = await import('/js/state.js'), p = __sv.heroes[0].profile; return { friend: p.look.friend, set: p.look.set, skin: p.look.skin === S.SKIN[2], card: p.friendCard, newCard: !!document.querySelector('.modal.newfriends'), name: p.name }; });
    const errs = P.errors; await P.ctx.close();
    for (const [k, v] of Object.entries<any>(steps)) if (!v.inside || v.scroll || v.small.length || v.tiny.length) bad.push(`${dev} ${k}: ${JSON.stringify(v)}`);
    if (boys.join() !== 'finn,sol' || girls.join() !== 'clara,lumi' || !doneOff || !side) bad.push(`${dev}: ${JSON.stringify({ boys, girls, doneOff, side })}`);
    if (ed.name !== 'An' || ed.friendRow.join() !== 'clara,lumi*') bad.push(`${dev} editor: ${JSON.stringify(ed)}`);
    if (r.friend !== 'lumi' || r.set !== 'girl' || !r.skin || r.card !== 'seen' || r.newCard || r.name !== 'An') bad.push(`${dev} saved: ${JSON.stringify(r)}`);
    if (errs.length) bad.push(`${dev} errors: ${errs.join(' | ')}`);
    rows.push(dev);
  }
  ok(!bad.length, bad.join('\n'));
  return `${rows.join(', ')}: name, boy or girl (Finn and Sol, Clara and Lumi side by side), Lumi with the third skin tone, then the editor; every step on one screen`;
});

await check('friendmigrate', async () => {
  // old saves move once: boys to Finn, girls to Clara, a save with no set guessed from its clothes; the skin tone and every
  // old field stay; tops and bottoms bought become free outfits of the same colour; the card shows once and lets the child
  // take the other friend; an online friend on an older version is drawn as the default friend of their set
  const P = await open(b, { w: 1180, h: 820, play: false, pre: () => { if (!sessionStorage.getItem('fm')) sessionStorage.setItem('fm', '1'), localStorage.setItem('sv2_profiles', JSON.stringify([
    { id: 'kg', name: 'Girl', photo: null, age: 'big', difficulty: 'easy', look: { style: 'shirt', color: '#3b6fe0', set: 'girl', hair: '#3b2618', hairStyle: 'long', skin: '#7a4e33', hat: 'bow', top: 'none' }, owned: { hats: ['none', 'bow'], clothes: ['bow'] }, stickers: ['s1'], created: 1 },
    { id: 'kb', name: 'Boy', photo: null, age: 'little', difficulty: 'easy', look: { style: 'shirt', color: '#3b6fe0', set: 'boy', skin: '#e0aa80' }, created: 2 },
    { id: 'kn', name: 'NoSet', photo: null, age: 'little', difficulty: 'easy', look: { style: 'dress', color: '#ff5fa2', skin: '#ffe3d1' }, created: 3 }])); } });
  const r = await P.page.evaluate(async () => {
    // (the friends' data loads as Who's playing opens, and moves every old save then)
    await (await import('/js/avatar.js')).friendsReady();
    const S = await import('/js/state.js'), F = await import('/js/content/friends.js'), C = await import('/js/content/shop.js');
    const g = S.profiles.find(p => p.id === 'kg'), bo = S.profiles.find(p => p.id === 'kb'), n = S.profiles.find(p => p.id === 'kn');
    const top = C.CLOTHES.find(it => it.slot === 'top' && it.for === 'g'), q = S.normalizeProfile({ id: 'kt', name: 'T', look: { set: 'girl', top: top.id }, owned: { clothes: [top.id] } });
    return { g: [g.look.friend, g.look.skin, g.look.hair, g.look.hairStyle, g.look.hat, g.owned.hats.join(), g.stickers.join(), g.friendCard], bo: [bo.look.friend, bo.look.skin, bo.friendCard], n: [n.look.friend, n.look.set],
      old: [q.look.top, q.owned.suits.join(), q.look.suit, q.newSuits, F.friendLook(q.look).color === top.color] };
  });
  await start(P.page, 'solo', 'valley'); // (the harness taps "Let's play" on the card: Finn stays)
  const after = await P.page.evaluate(() => ({ friend: __sv.heroes[0].profile.look.friend, card: __sv.heroes[0].profile.friendCard }));
  // the card again after a reload: not shown; a new child of the old save's set is not asked either
  await P.page.reload(); await P.page.waitForSelector('.screen.title'); await P.page.click('.screen.title .press', { force: true }); await P.page.waitForSelector('.screen.who');
  await P.page.locator('.pick[data-id]').nth(0).click(); await P.page.evaluate(() => { window.__sv._owlAuto = true; }); await P.page.click('.who .go');
  await P.page.waitForFunction(() => window.__sv && window.__sv.heroes.length > 0); const again = await P.page.evaluate(() => !!document.querySelector('.modal.newfriends'));
  // the card lets a child take the other friend
  const pick = await P.page.evaluate(async () => { const U = await import('/js/ui/friends-ui.js'), S = await import('/js/state.js'), p = S.profiles.find(x => x.id === 'kb'); p.friendCard = 'due';
    return new Promise(res => { U.newFriendsCard(p, () => res([p.look.friend, p.friendCard])); (document.querySelector('.newfriends [data-friend="sol"]') as HTMLElement).click(); (document.querySelector('.newfriends [data-go="play"]') as HTMLElement).click(); }); });
  // an online friend on an older version (a hello with no friend) is drawn as the default friend of their set
  const online = await P.page.evaluate(async () => { const F = await import('/js/content/friends.js'); return [F.friendOf({ style: 'dress', color: '#ff5fa2' }), F.friendOf({ set: 'boy' }), F.friendOf({ set: 'girl', friend: 'sol' })]; });
  const errs = P.errors; await P.ctx.close();
  const good = r.g.join('|') === 'clara|#7a4e33|#3b2618|long|bow|none,bow|s1|due' && r.bo.join('|') === 'finn|#e0aa80|due' && r.n.join('|') === 'clara|girl'
    && r.old[0] !== 'none' && /^c:/.test(r.old[1]) && r.old[2] === r.old[1] && r.old[3] === 1 && r.old[4] && after.card === 'seen' && !again && pick.join() === 'sol,seen' && online.join() === 'clara,finn,clara' && !errs.length;
  ok(good, JSON.stringify({ r, after, again, pick, online, errs }));
  return 'girls to Clara, boys to Finn, no set guessed from a dress; old fields, hats and stickers kept; an old top became a free outfit; the card once; old online looks as the default friend';
});

await check('friendswap', async () => {
  // the Backpack's "Character & Outfits": one tap changes friend (free, only the two of the child's set), the character is
  // drawn again with that friend's hair and clothes, and changing set is not offered there (Grown-ups › Children › Edit only)
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), G = __sv, p = G.heroes[0].profile, U = await import('/js/ui/friends-row.js'), F = await import('/js/content/friends.js');
    G.openPad(0, 'bag'); for (let k = 0; k < 20 && !document.querySelector('.pad [data-befriend]'); k++) await w(200);
    const row = [...document.querySelectorAll('.pad [data-befriend]')].map((e: HTMLElement) => e.dataset.befriend), set = p.look.set, other = F.friendsOf(set).find(id => id !== F.friendOf(p.look));
    const heading = [...document.querySelectorAll('.pad h3')].some(h => /Character & Outfits/.test(h.textContent));
    const before = G.heroes[0].av.root; (document.querySelector(`.pad [data-befriend="${other}"]`) as HTMLElement).click(); await w(300);
    // (the builder merges the parts into a few shapes coloured per corner, so the look it drew from is read back)
    const hairOf = av => av.look && av.look.hair === F.FRIENDS[other].hair && av.look.hairStyle === F.FRIENDS[other].hairStyle;
    const swapped = p.look.friend === other && G.heroes[0].av.root !== before && hairOf(G.heroes[0].av), on = !!document.querySelector(`.pad [data-befriend="${other}"].on`);
    const locked = !U.setFriend(p, set === 'girl' ? 'finn' : 'clara') && p.look.friend === other, suits = [...document.querySelectorAll('.pad [data-suit]')].map((e: HTMLElement) => e.dataset.suit);
    await w(1500); const saved = JSON.parse(localStorage.getItem('sv2_profiles')).find(x => x.id === p.id).look.friend === other;
    return { row, set, heading, swapped, on, locked, suits, saved };
  });
  const errs = P.errors; await P.ctx.close();
  const pair = r.set === 'girl' ? 'clara,lumi' : 'finn,sol';
  ok(r.row.join() === pair && r.heading && r.swapped && r.on && r.locked && r.saved && r.suits.length >= 1 && !errs.length, JSON.stringify({ r, errs }));
  return `the Bag shows ${pair}; one tap changed friend, drew the new hair and saved it; the other set cannot be chosen there`;
});

await check('wearfit', async () => {
  // every hat, pair of glasses, neck, back and shoe the shop sells (and the passport and tester hats) is drawn on each of the four friends
  // with no error, the hat sits on the head (above the eyes, not floating far above), and the back items sit behind
  const r = await (async () => { const P = await open(b, { w: 900, h: 700, play: false });
    const out = await P.page.evaluate(async () => {
      const A = await import('/js/avatar.js'), C = await import('/js/content/shop.js'), F = await import('/js/content/friends.js'), D = await import('/js/data.js'), THREE = (await import('/js/gfx.js')).THREE;
      const bad = [], n = { hat: 0, face: 0, neck: 0, back: 0, feet: 0 }, box = a => { a.root.updateMatrixWorld(true); return new THREE.Box3().setFromObject(a.head || a.root); };
      const hats = [...C.CLOTHES.filter(it => it.slot === 'hat').map(it => it.id), ...(D.REWARD_HATS || [])];
      for (const f of F.FRIEND_IDS) {
        const base = { set: F.FRIENDS[f].set, friend: f, skin: '#f6c7a5' }, plain = A.buildAvatar(base), h0 = box(plain);
        for (const slot of ['hat', 'face', 'neck', 'back', 'feet']) for (const id of (slot === 'hat' ? hats : C.CLOTHES.filter(it => it.slot === slot).map(it => it.id))) {
          try { const a = A.buildAvatar({ ...base, [slot]: id }); n[slot]++;
            if (slot === 'hat') { const hb = box(a); if (hb.max.y > h0.max.y + .9 || hb.max.y < h0.max.y - .05) bad.push(`${f} ${id}: hat top ${hb.max.y.toFixed(2)} vs head ${h0.max.y.toFixed(2)}`); }
          } catch (e) { bad.push(`${f} ${slot} ${id}: ${e.message}`); }
        }
      }
      return { bad, n };
    });
    const errs = P.errors; await P.ctx.close(); return { ...out, errs }; })();
  ok(!r.bad.length && !r.errs.length && r.n.hat > 18, JSON.stringify(r).slice(0, 1500));
  return `on Finn, Sol, Clara and Lumi: ${r.n.hat / 4} hats, ${r.n.face / 4} glasses and masks, ${r.n.neck / 4} neck things, ${r.n.back / 4} backs and ${r.n.feet / 4} shoes, all drawn and in place`;
});
await check('friendmodel', async () => {
  // the friends' light 3D models (models/<id>.glb): each loads after the start, is small (meshopt, under 500 KB), has its
  // eleven faces (v1.08e faces: half, lookL and lookR joined the eight moods), draws in a
  // few parts, takes the child's skin tone, follows the code person's joints and moods, and the child plays with it; when
  // a model cannot load, the code person in the friend's colours stays (no error). Triangles shown: about 8,200 for Finn,
  // Sol and Clara (limit 9,000); Lumi's hair is about a thousand felt leaves that cannot be thinned further, so about
  // 14,000 (limit 14,500; the owner chose that hair, docs/cores/tasks/v108/lumi.md).
  // (v1.08e faces, part 3, owner 6 Nov 2026 AEDT: sculpted faces, "a sculpted head adds about 2-4k triangles", faces-brief.md)
  // the face is one mesh of real shapes with 13 moods as shape keys (about 2,600 triangles): limits 12,000 and 17,500, and
  // one more draw (the face's own colours, and its lids in the child's skin tone)
  const fs2 = await import('fs'), sizes = ['finn', 'sol', 'clara', 'lumi'].map(id => fs2.statSync(new URL(`../../models/${id}.glb`, import.meta.url)).size);
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const A = await import('/js/avatar.js'), THREE = (await import('/js/gfx.js')).THREE, out: Record<string, any> = {};
    for (const id of ['finn', 'sol', 'clara', 'lumi']) {
      const ok = await A.loadFriendModels(id), av = A.buildAvatar({ set: id === 'clara' || id === 'lumi' ? 'girl' : 'boy', friend: id, skin: '#b47a55', hat: 'cap' });
      const m = av.model, meshes = []; let skin = null, faces = 0, tris = 0;
      m.obj.traverse((o: any) => { if (o.isMesh) { meshes.push(o); if (/^skin(-shade)?$/.test(o.material.name) && !o.userData.face3d) skin = '#' + o.material.color.getHexString(); if (/^face-/.test(o.material.name)) faces++; } });
      // (v1.08e faces, part 3) a sculpted face is one mesh whose moods are its shape keys: its mood count (12 keys and the rest smile)
      if (m.face3d) faces = Object.keys(m.face3d[0].morphTargetDictionary).length + 1;
      // a turn of the code person's arm and knee shows on the model's bones; a mood shows the matching face
      const bone = n => { let x = null; m.obj.traverse((o: any) => { if (o.isBone && o.name === n) x = o; }); return x; }, q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion();
      av.root.updateMatrixWorld(true); bone('armL').getWorldQuaternion(q0); av.armL.rotation.x = -1.2; av.life = av.life || ({} as typeof av.life); av.life.mood = 'happy'; av.root.updateMatrixWorld(true); bone('armL').getWorldQuaternion(q1);
      const turned = +q0.angleTo(q1).toFixed(2), face = m.face3d ? 'face-' + m.mood : meshes.filter(o => /^face-/.test(o.material.name) && o.visible).map(o => o.material.name).join();
      // (v1.08e faces, part 2) the thin outlines (one per part, the same shape drawn again) are counted on their own
      meshes.filter(o => o.visible && !o.userData.outline && (o.material.name !== 'skin-grip')).forEach(o => { tris += o.geometry.index.count / 3; });
      const hat = av.rig.getObjectByProperty('isMesh', true) && (() => { let n = 0; av.rig.traverse((o: any) => { if (o.isMesh && !o.isSkinnedMesh && o.parent && o.parent !== m.obj) n++; }); return n; })();
      out[id] = { ok, skin, faces, turned, face, tris, draws: meshes.filter(o => o.visible && !o.userData.outline).length, lines: meshes.filter(o => o.visible && o.userData.outline).length, hat };
    }
    // the child in the valley plays with the model once it has arrived
    const G = __sv; for (let k = 0; k < 40 && !G.heroes[0].av.model; k++) await new Promise(r => setTimeout(r, 250));
    out.hero = !!G.heroes[0].av.model;
    return out;
  });
  // no model (an old phone, no network): the code person stays, nothing breaks
  const Q = await open(b, { w: 900, h: 700, route: async ctx => { await ctx.route('**/models/*.glb', r => r.abort()); } }); await clear(Q.page);
  const f = await Q.page.evaluate(async () => { const A = await import('/js/avatar.js'), ok = await A.loadFriendModels('sol'), av = A.buildAvatar({ set: 'boy', friend: 'sol', skin: '#f6c7a5' }); await new Promise(r => setTimeout(r, 500)); return { ok, model: !!av.model, hero: !!__sv.heroes[0].av.model, look: av.look.hair }; });
  const errs = [...P.errors, ...Q.errors.filter(e => !/glb|friend model|Failed to fetch|aborted/i.test(e))]; await P.ctx.close(); await Q.ctx.close();
  const bad = [];
  sizes.forEach((n, i) => { if (n > 500 * 1024) bad.push(`model ${i} is ${Math.round(n / 1024)} KB`); });
  for (const id of ['finn', 'sol', 'clara', 'lumi']) { const x = r[id]; if (!x.ok || x.skin !== '#b47a55' || x.faces < 13 || x.turned < 1 || x.face !== 'face-happy' || x.tris > (id === 'lumi' ? 17500 : 12000) || x.draws > 7 || x.lines > 6 || !x.hat) bad.push(id + ' ' + JSON.stringify(x)); }
  if (!r.hero) bad.push('the child in the valley has no model'); if (f.ok || f.model || f.hero || f.look !== '#e0762a') bad.push('no model: ' + JSON.stringify(f));
  ok(!bad.length && !errs.length, JSON.stringify({ bad, errs, r }).slice(0, 2000));
  return `${sizes.map(n => Math.round(n / 1024)).join(', ')} KB; ${['finn', 'sol', 'clara', 'lumi'].map(id => `${id} ${r[id].tris} triangles in ${r[id].draws} parts (+${r[id].lines} outlines)`).join(', ')}; skin tone, joints and moods follow; the cap is worn; without the files the code person stays`;
});
await check('friendoutfits', async () => {
  // the shop's Outfits tab (a child with a friend): the friend's four outfits, the everyday one worn free, one tap shows a
  // price, a second buys it with game coins and puts it on; the character is drawn in it; glasses are bought and worn
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), G = __sv, p = G.heroes[0].profile, S = await import('/js/state.js'), F = await import('/js/content/friends.js');
    S.farm.coins = 500; G.shop.openShop(0); await w(400);
    const card = document.querySelector('.modal.shopk .card'); (card.querySelector('[data-stab]') as HTMLElement).click(); await w(200);
    // (v1.08 release fix 2) the Outfits tab draws when its code is in: waited for (200 ms was short on GitHub's machines)
    for (let k = 0; k < 50 && !card.querySelector('[data-suit]'); k++) await w(100);
    const ids = [...card.querySelectorAll('[data-suit]')].map((e: HTMLElement) => e.dataset.suit), f = F.friendOf(p.look), aodai = F.suitId(f, 'aodai');
    (card.querySelector(`[data-suit="${aodai}"]`) as HTMLElement).click(); await w(150); const afterOne = { coins: S.farm.coins, worn: p.look.suit };
    (card.querySelector(`[data-suit="${aodai}"]`) as HTMLElement).click(); await w(300);
    const bought = { coins: S.farm.coins, worn: p.look.suit, owned: (p.owned.suits || []).includes(aodai), drawn: G.heroes[0].av.look.style };
    (card.querySelector(`[data-suit="${F.suitId(f, 'everyday')}"]`) as HTMLElement).click(); await w(200); const back = p.look.suit;
    (card.querySelector('[data-tab="face"]') as HTMLElement).click(); await w(200); const faces = [...card.querySelectorAll('.kitem')].map((e: HTMLElement) => e.dataset.id);
    return { ids, f, afterOne, bought, back, faces };
  });
  const errs = P.errors; await P.ctx.close();
  const good = r.ids.length === 4 && r.afterOne.coins === 500 && r.afterOne.worn !== `${r.f}-aodai` && r.bought.coins === 380 && r.bought.worn === `${r.f}-aodai` && r.bought.owned && r.bought.drawn === 'aodai' && r.back === `${r.f}-everyday` && r.faces.length >= 3 && !errs.length;
  ok(good, JSON.stringify({ r, errs }));
  return `${r.f}: ${r.ids.length} outfits; the áo dài bought on the second tap (120 coins) and drawn; back to everyday free; ${r.faces.length} glasses and masks in the shop`;
});
// ---- (v1.08b friends) end ----
// ---- (v1.08d polish) the friends' quests and items ----
await check('frienditems', async () => {
  // each friend has a quest of three steps at places that stand in the valley (EN and VI); the model carries its item
  // (compass, sun crystal, flower staff, star lantern) only once the quest is done; the quest is a side story the child can
  // follow on the goal bar; shop shoes take the place of the model's boots
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), G = __sv, h = G.heroes[0], p = h.profile, Q = await import('/js/content/friendquests.js'), A = await import('/js/avatar.js');
    for (let k = 0; k < 60 && !(G.friendQuests && h.av.model); k++) await w(250);
    const item = av => { let v = null; av.model && av.model.obj.traverse(o => { if (o.isMesh && o.material.name === 'cloth-item') v = o.visible; }); return v; };
    const boots = av => { let v = null; av.model && av.model.obj.traverse(o => { if (o.isMesh && o.material.name === 'cloth-shoes') v = o.visible; }); return v; };
    const f = p.look.friend, out: any = { f, model: !!h.av.model };
    // every quest: three steps, each at a place that stands in the valley, lines in English and Vietnamese
    out.places = Object.values(Q.FRIEND_QUESTS).flatMap(q => q.steps.map(s => s.spot)).filter(id => !G.interactables.some(it => it.id === id));
    out.lines = Q.friendQuestLines().filter(([en, vi]) => !(en && vi && en.length > 10 && vi.length > 10 && en !== vi)).length;
    out.steps = Object.values(Q.FRIEND_QUESTS).map(q => q.steps.length);
    out.before = { item: item(h.av), side: G.sideStories().map(sd => sd.id).includes('fq'), started: G.friendQuests.side.status(p).started,
      spark: G.interactables.filter(it => /^fq_/.test(it.id) && it.visible(h)).map(it => it.id) };
    p.follow = 'fq'; out.goal = G.currentQuest(p) && G.currentQuest(p).id;
    const t = G.currentQuest(p).target(), s0 = G.friendQuests.sparkAt(p); out.target = !!t && t.x === s0.x && t.z === s0.z;
    // play the three steps, tapping through what is said
    const tap = setInterval(() => { const d = document.querySelector('.dialog:not(.out)') as HTMLElement, rw = document.querySelector('.reward:not(.out)') as HTMLElement; if (d) d.click(); else if (rw) rw.click(); }, 120);
    for (let k = 0; k < 3; k++) { await G.friendQuests.doStep(h, f, k); out['after' + k] = G.interactables.filter(it => /^fq_/.test(it.id) && it.visible(h)).map(it => it.id); }
    clearInterval(tap); await w(300);
    for (let k = 0; k < 40 && item(h.av) !== true; k++) await w(150);
    out.after = { item: item(h.av), fitems: p.look.fitems, step: p.friendQuest[f], done: G.friendQuests.side.status(p).done, follow: p.follow || null, goal: (G.currentQuest(p) || {}).id || '' };
    // the other friends' items stay hidden; their quests have not been played
    const set = f === 'clara' || f === 'lumi' ? 'girl' : 'boy', other = set === 'girl' ? (f === 'clara' ? 'lumi' : 'clara') : (f === 'finn' ? 'sol' : 'finn');
    await A.loadFriendModels(other); const o = A.buildAvatar({ set, friend: other, skin: '#f6c7a5', fitems: p.look.fitems });
    out.other = item(o);
    // shop shoes take the place of the model's boots; the model shows its own boots otherwise
    const sh = A.buildAvatar({ ...p.look, feet: 'sneakers_red' }); let codeShoes = 0; sh.rig.traverse((x: any) => { if (x.isMesh && !x.isSkinnedMesh && x.parent && x.parent !== sh.model.obj && (x.parent === sh.kneeL || x.parent === sh.kneeR || x.parent === sh.legL || x.parent === sh.legR)) codeShoes++; });
    out.shoes = { boots: boots(sh), code: codeShoes, plain: boots(h.av) };
    let draws = 0; h.av.model.obj.traverse(x => { if (x.isMesh && x.visible && !x.userData.outline && x.material.name !== 'skin-grip') draws++; }); out.draws = draws; // (v1.08e faces, part 2: outlines apart, friendmodel limits them)
    return out;
  });
  const errs = P.errors; await P.ctx.close();
  const bad = [];
  if (!r.model) bad.push('no model'); if (r.places.length) bad.push('places not in the valley: ' + r.places); if (r.lines) bad.push(r.lines + ' lines not in EN and VI');
  if (r.steps.some(n => n !== 3)) bad.push('steps ' + r.steps);
  if (r.before.item !== false || !r.before.side || !r.before.started || r.before.spark.join() !== `fq_${r.f}_0`) bad.push('before ' + JSON.stringify(r.before));
  if (r.goal !== `FQ_${r.f}_0` || !r.target) bad.push('goal ' + r.goal + ' ' + r.target);
  if (r.after0.join() !== `fq_${r.f}_1` || r.after1.join() !== `fq_${r.f}_2` || r.after2.length) bad.push('steps ' + JSON.stringify([r.after0, r.after1, r.after2]));
  if (r.after.item !== true || !String(r.after.fitems).split(' ').includes(r.f) || r.after.step !== 3 || !r.after.done || r.after.follow || /^FQ_/.test(r.after.goal)) bad.push('after ' + JSON.stringify(r.after));
  if (r.other !== false) bad.push('another friend carries an item not earned');
  if (r.shoes.boots !== false || r.shoes.code < 2 || r.shoes.plain !== true) bad.push('shoes ' + JSON.stringify(r.shoes));
  if (r.draws > 8) bad.push('draws ' + r.draws); // (v1.08e part 3: the sculpted face draws in two parts, its colours and its lids in the skin tone)
  ok(!bad.length && !errs.length, JSON.stringify({ bad, errs, r }).slice(0, 2000));
  return `${r.f}: three steps at places in the valley, followed on the goal bar; the item shows only after the third; shop shoes replace the boots; ${r.draws} parts drawn with the item`;
});
await check('handson', async () => {
  // the hands-on games: the Tết bánh chưng (leaves, filling in the real order, folding, the string) and the Maze Builder
  // (stepping stones round the rocks). Each level plays differently and is won by tapping what the game asks for, like
  // a child's finger; everything fits one screen with no scrolling on a phone (both ways), a tablet (both) and a computer
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  await P.page.emulateMedia({ reducedMotion: 'reduce' });
  const IDS = ['fg_tet', 'mazebuild'], bad = [], played = {};
  await P.page.evaluate(async () => { const C = (await import('/js/custom.js')).CUSTOM, d = new Date(); C.festivals = C.festivals || {};
    C.festivals.tet = { ...(C.festivals.tet || {}), date: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') }; await (await import('/js/art.js')).moreArt(); });
  const openGame = (id, d) => P.page.evaluate(([id, d]) => { document.querySelectorAll('.gl, .modal').forEach(g => g.remove()); __sv.paused = false; const p = __sv.heroes[0].profile; p.age = 'big'; p.gameDiff = { ...(p.gameDiff || {}), [id]: d }; __sv.playGame(0, id, 'hub'); }, [id, d]);
  for (const id of IDS) for (const d of ['easy', 'medium', 'hard', 'talent']) {
    await openGame(id, d);
    if (!await P.page.waitForSelector(`.gl[data-game-id="${id}"]:not(.out)`, { timeout: 10000 }).then(() => true, () => false)) { bad.push(`${id} ${d}: did not open`); continue; }
    let taps = 0, won = false, stuck = 0, lv = '';
    for (let k = 0; k < 600 && !won; k++) {
      const t = await P.page.evaluate(async () => {
        const { playWatch } = await import('/js/games/frame.js'), gl = document.querySelector('.gl:not(.out)');
        if (!gl) return { gone: true }; if (gl.querySelector('.gl-win')) return { won: true };
        const ok = e => e && e.isConnected && !e.disabled && e.getBoundingClientRect().width > 0;
        let e = null; const a = playWatch.ask;
        if (a && a.els.some(ok)) e = a.els.find(x => ok(x) && a.check(x)); else if (playWatch.plan) e = playWatch.plan();
        if (!ok(e)) return { wait: true };
        const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, at = document.elementFromPoint(x, y);
        return { x, y, lv: (gl.querySelector('.gl-stage') as HTMLElement)?.dataset.lv || '', on: !!at && (at === e || e.contains(at)), what: String(e.className) + ' at ' + Math.round(x) + ',' + Math.round(y) + ' under ' + (at ? String(at.className) : 'nothing') };
      });
      if (t.won) { won = true; break; } if (t.gone) break;
      if (t.wait) { if (++stuck > 150) break; await P.page.waitForTimeout(120); continue; }
      stuck = 0; lv = t.lv || lv; if (!t.on) { bad.push(`${id} ${d}: something covers ${t.what}`); break; }
      await P.page.touchscreen.tap(t.x, t.y); taps++; await P.page.waitForTimeout(90);
    }
    played[id + ':' + d] = { taps, won, lv };
    if (!won) bad.push(`${id} ${d}: not won (${taps} taps)`);
    await P.page.evaluate(() => { (document.querySelector('.gl:not(.out) .gl-x') as HTMLElement)?.click(); }); await P.page.waitForTimeout(500);
  }
  for (const id of IDS) { const l = ['easy', 'medium', 'hard', 'talent'].map(d => played[id + ':' + d]?.lv); if (new Set(l).size < 3) bad.push(`${id}: the levels play alike ${l}`); }
  // one screen, no scrolling, every button on screen and 44 px or more, text 16 px or more; pictures for the report
  fs.mkdirSync('out/handson', { recursive: true });
  for (const [name, w, h] of [['phone', 390, 844], ['phone-wide', 844, 390], ['tablet', 820, 1180], ['tablet-wide', 1180, 820], ['computer', 1366, 800]] as [string, number, number][]) {
    await P.page.setViewportSize({ width: w, height: h });
    for (const id of IDS) {
      await openGame(id, 'talent'); await P.page.waitForSelector(`.gl[data-game-id="${id}"]:not(.out)`, { timeout: 10000 }).catch(() => {});
      for (let k = 0; k < 30; k++) { await P.page.waitForTimeout(150); if (await P.page.evaluate(() => document.querySelectorAll('.gl:not(.out) .ho-leaf, .gl:not(.out) .ho-cell').length > 0)) break; }
      await P.page.waitForTimeout(300);
      const f = await P.page.evaluate(() => {
        const st = document.querySelector('.gl:not(.out) .gl-stage') as HTMLElement, out = [];
        if (!st) return ['no stage'];
        if (st.scrollHeight > st.clientHeight + 2 || document.scrollingElement.scrollHeight > innerHeight + 2) out.push(`scrolls ${st.scrollHeight}/${st.clientHeight}`);
        st.querySelectorAll('button').forEach((e: HTMLElement) => { const r = e.getBoundingClientRect(); if (r.width < 43 || r.height < 43) out.push(`small ${e.className} ${Math.round(r.width)}x${Math.round(r.height)}`); if (r.bottom > innerHeight + 1 || r.right > innerWidth + 1 || r.top < 0 || r.left < 0) out.push(`off screen ${e.className}`); });
        st.querySelectorAll('.ho-say, .ho-bowl span, .ho-left').forEach((e: HTMLElement) => { if (e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 16) out.push(`text ${e.className}`); });
        return out;
      });
      if (f.length) bad.push(`${id} ${name}: ${[...new Set(f)].slice(0, 4).join('; ')}`);
      await P.page.screenshot({ path: `out/handson/${id}-${name}.png` });
      await P.page.evaluate(() => { (document.querySelector('.gl:not(.out) .gl-x') as HTMLElement)?.click(); }); await P.page.waitForTimeout(500);
    }
  }
  const errs = P.errors; await P.ctx.close();
  ok(!bad.length && !errs.length, JSON.stringify({ bad, errs, played }).slice(0, 2000));
  return `${IDS.map(id => `${id}: ${['easy', 'medium', 'hard', 'talent'].map(d => played[id + ':' + d].lv).join(' / ')}`).join('; ')}; won at every level; one screen on phone, tablet and computer (out/handson)`;
});
// ---- (v1.08d polish) end ----
