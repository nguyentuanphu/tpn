// The Sparkle Pad (split from js/ui.ts, v1.07): map, backpack, adventures, album, games, camera and friends.
import { withSitePlaces } from '../content/activities.js';
import type { Profile } from '../../types/save.js';
import type { SvMain } from '../main.js';
import { T, nm } from '../i18n.js';
import { profiles, saveProfiles, HATS, GLIDERS, farm, saveFarm } from '../state.js';
import { say } from '../voice.js';
import { SFX } from '../audio.js';
import { fmt, cur, spoken as money } from '../money.js';
import { el, esc, $, wait, local } from '../util.js';
import { CLOTHES, ITEM, SLOTS as WEAR_SLOTS, owns, wear as wearItem, giveGift, setOf as setOfLook } from '../content/shop.js';
import { freshIds as sbFresh } from '../stickers.js';
import { ITEMS, RECIPES, HAT_ICON, HAT_NAME, REWARD_HATS, dishInfo, QUESTS } from '../data.js';
import { SIZE, HALF, SHRINES, TOWERS, regionAt } from '../world.js';
import { LANDMARK_HOME } from '../content/map.js';
import { GAMES } from '../games/frame.js';
import { WILD } from '../gather.js';
import { snackOf, eatSnack } from '../snacks.js';
import { saveToDevice, savesByShare } from '../photos.js';
import { pic } from '../art.js';
import { COMPANIONS } from '../content/companions.js';
import { modal } from '../popups.js';
import { PET_ICON, PAL_HAT_ICON, PALS_NAME, toast, foldHeadings, jumpNav } from './common.js';
import { festCalendarHTML } from './festivals-ui.js';
import { valleyPicture } from './pad-map.js';
import { albumTab } from './pad-album.js';
// ---------- the Sparkle Pad ----------
// which place each landmark belongs to in the real world (the Pad map lists it under that place): round T, in the map
// (js/content/map.js LANDMARK_HOME)

const openPadProperties: { mapLast?: string; mapCity?: number } = {};
export const openPad = Object.assign(function (game, i, tab) {
  tab = tab || 'map';
  const hero = game.heroes[i], p: Profile = hero.profile;
  const m = modal('pad', '');
  const card = m.querySelector('.card');
  const TABS = [['map', '🗺️', T('Map', 'Bản đồ')], ['bag', '🎒', T('Backpack', 'Ba lô')], ['log', '📜', T('Adventures', 'Nhiệm vụ')], ['album', '⭐', T('Stickers', 'Hình dán')], ['passport', '🛂', T('Passport', 'Hộ chiếu')], ['games', '🎲', T('Games', 'Trò chơi')], ['cam', '📷', T('Camera', 'Máy ảnh')], ['cal', '📅', T('Festivals', 'Lễ hội')]];
  if (game.mode === 'online' || game.mode === 'solo') TABS.push(['friend', '📞', T('Friend', 'Bạn bè')]);
  // (Round V, owner 13 Oct: "the shop button should be right next to the bag") a Shop tab straight after Backpack opens the
  // clothes shop right there (no travel); it replaces the dock's Shop button
  if (game.shop && game.shop.on() && game.heroes.length < 2) TABS.splice(TABS.findIndex(t => t[0] === 'bag') + 1, 0, ['shop', '🛍️', T('Shop', 'Cửa hàng')]);
  const pageCleanups: (() => void)[] = [];
  const cleanPage = () => { pageCleanups.splice(0).forEach(clean => clean()); };
  const draw = () => {
    cleanPage();
    const sl = card.querySelector('.pad-tabs') ? card.querySelector('.pad-tabs').scrollLeft : 0;
    card.innerHTML = `<div class="pad-head"><div class="pad-tabs">${TABS.map((t, k) => `<button data-t="${t[0]}" class="${t[0] === tab ? 'on' : ''}"><span>${pic(t[1])}${t[0] === 'album' && sbFresh(p).length ? `<i class="stk-count" aria-label="${T(`${sbFresh(p).length} new stickers`, `${sbFresh(p).length} hình dán mới`)}">${sbFresh(p).length}</i>` : ''}</span><small>${t[2]}<kbd class="padkey">${k + 1}</kbd></small></button>`).join('')}</div><button class="x" aria-label="${T('Close', 'Đóng')}">✕<kbd class="padkey">Esc</kbd></button></div><div class="pad-body"></div>`;
    card.querySelector('.pad-tabs').scrollLeft = sl;
    card.querySelectorAll('.pad-tabs button').forEach(b => b.onclick = () => { SFX.tap(); tab = b.dataset.t; draw(); });
    card.querySelector('.x').onclick = close;
    const body = card.querySelector('.pad-body');
    ({ shop: b => game.shop.openShop(i, b), map: drawMap, bag: drawBag, log: drawLog, album: drawAlbum, games: drawGames, cam: drawCam, friend: drawFriend, passport: b => game.drawPassport(b, hero), cal: drawCal })[tab](body);
    if (tab === 'bag' || tab === 'log' || tab === 'album') foldHeadings(body, tab); // (owner, 13 Oct) each part opens and closes
  };
  // computer keyboards: 1–8 pick a tab, ← → step through them, Esc closes
  const onKey = e => {
    if (!document.body.contains(m)) { removeEventListener('keydown', onKey, true); return; } // the pad was closed some other way
    if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
    let k = -1; const cur = TABS.findIndex(t => t[0] === tab);
    if (/^Digit[1-9]$/.test(e.code)) k = +e.code.slice(5) - 1;
    else if (e.code === 'ArrowRight' || e.code === 'BracketRight') k = (cur + 1) % TABS.length;
    else if (e.code === 'ArrowLeft' || e.code === 'BracketLeft') k = (cur + TABS.length - 1) % TABS.length;
    if (k >= 0 && TABS[k]) { e.preventDefault(); e.stopImmediatePropagation(); SFX.tap(); tab = TABS[k][0]; draw(); }
  };
  addEventListener('keydown', onKey, true);
  const close = () => { cleanPage(); removeEventListener('keydown', onKey, true); m.close(); game.closePad(i); };

  function drawMap(body) {
    withSitePlaces(game.PLACES);
    const mine = game.myHouse?.home;
    const mapPlaces = mine ? [...game.PLACES, { key: 'myhouse', g: 'home', icon: '🏠', name: mine.name, x: mine.door.x, z: mine.door.z }] : game.PLACES;
    const S = 600, wrap = el('div', 'mapwrap'), cv = el('canvas', 'bigmap'); cv.width = cv.height = S; wrap.appendChild(cv); body.appendChild(wrap);
    body.appendChild(el('p', 'note center', T('Tap any picture on the map, or a place below, to fly there.', 'Chạm vào bất kỳ hình nào trên bản đồ, hoặc một nơi bên dưới, để bay đến đó.')));
    // the places, grouped by country and listed from north to south, like a real map: one group at a time,
    // picked from chips (the full list was too long to scroll)
    const GROUPS = [['home', '🏡', T('Our valley', 'Thung lũng nhà mình')], ['vn', '🇻🇳', T('Vietnam', 'Việt Nam')], ['au', '🇦🇺', T('Australia', 'Nước Úc')], ['asia', '🌏', T('China and India', 'Trung Quốc và Ấn Độ')], ['homes', '🏠', T('Homes', 'Nhà')]];
    const named = game.homes ? game.homes.list.filter(hm => hm.H) : [];
    // (round R, owner: "the map and its destinations should be more logical") each country's places from north to south
    // like the real map; under each place, what really belongs to it: its landmarks by real geography (Hạ Long and Tràng
    // An with Hà Nội in the north, Huế and Hội An with Đà Nẵng in the centre, the Mekong with Sài Gòn), a shop or a stage
    const itemsOf = g => {
      if (g === 'homes') return named.map(hm => ({ icon: '🏠', name: hm.name, go: () => game.landBy(hero, hm.door.x, hm.door.z) }));
      const all = mapPlaces.filter(pl => (pl.g || 'home') === g), tops = all.filter(pl => !pl.under).sort((a, b) => a.z - b.z), lms = game.LANDMARKS || [], out = [];
      // a landmark that is now a place of its own (Hội An) is listed as that place, no longer under the city near it
      const homeOf = l => mapPlaces.some(pl => pl.key === l.id) ? l.id : LANDMARK_HOME[l.id];
      for (const t of tops) {
        out.push({ icon: t.icon, name: t.name, go: () => game.travelTo(hero, t.x, t.z, !['memory_e', 'memory_w', 'myhouse'].includes(t.key)) });
        all.filter(pl => pl.under && pl.under === t.key).forEach(pl => out.push({ sub: true, icon: pl.icon, name: pl.name, go: () => game.travelTo(hero, pl.x, pl.z) }));
        lms.filter(l => homeOf(l) === t.key).forEach(l => out.push({ sub: true, icon: l.icon, name: l.name, go: () => game.travelTo(hero, l.x, l.z) }));
      }
      return out;
    };
    // (bug 28, owner: "too many destinations in one list") each country shows a fixed row of city chips; only the
    // picked city's places show under it, and a swipe moves to the next or previous city
    const citiesOf = g => { const out = []; itemsOf(g).forEach(it => { if (!it.sub || !out.length) out.push({ top: it, places: [] }); else out[out.length - 1].places.push(it); }); return out; };
    const groups = GROUPS.filter(([g]) => itemsOf(g).length);
    let gsel = groups.find(([g]) => g === openPad.mapLast) ? openPad.mapLast : groups[0][0], csel = openPad.mapCity || 0;
    const chips = el('div', 'hubtabs mapchips'), cityRow = el('div', 'hubtabs mapcities'), list = el('div', 'quick mapplaces');
    // (r63, owner: the Back and Next buttons are no use: the city chips above and a swipe change the city)
    const nav = el('div', 'mapnav');
    groups.forEach(([g, gi, gname]) => { const c = el('button', '', `<span>${pic(gi)}</span><small>${esc(gname)}</small>`); c.dataset.g = g; c.onclick = () => { gsel = openPad.mapLast = g; csel = openPad.mapCity = 0; SFX.tap(); fill(); }; chips.appendChild(c); });
    const step = d => { const n = citiesOf(gsel).length; if (n < 2) return; csel = openPad.mapCity = (csel + d + n) % n; SFX.tap(); fill(); };
    const fill = () => {
      chips.querySelectorAll('button').forEach(c => c.classList.toggle('on', c.dataset.g === gsel)); list.innerHTML = ''; cityRow.innerHTML = '';
      const cities = citiesOf(gsel); if (csel >= cities.length) csel = openPad.mapCity = 0;
      const many = gsel !== 'homes' && cities.length > 1;
      cityRow.hidden = !many;
      if (many) cities.forEach((c, k) => { const b = el('button', k === csel ? 'on' : '', `<span>${pic(c.top.icon)}</span><small>${esc(c.top.name())}</small>`); b.onclick = () => { csel = openPad.mapCity = k; SFX.tap(); fill(); }; cityRow.appendChild(b); });
      const cur = many ? cities[csel] : null, items = many ? [cur.top].concat(cur.places) : itemsOf(gsel);
      items.forEach(it => { const b = el('button', 'qbtn', `<span>${pic(it.icon)}</span><small>${esc(it.name())}</small>`); b.onclick = () => { close(); it.go(); }; list.appendChild(b); });
      const on = cityRow.querySelector('.on'); if (on) cityRow.scrollLeft = on.offsetLeft - (cityRow.clientWidth - on.offsetWidth) / 2;
    };
    let sx = null;
    list.addEventListener('touchstart', e => { sx = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
    list.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1); }, { passive: true });
    nav.appendChild(list);
    body.appendChild(chips); body.appendChild(cityRow); body.appendChild(nav); fill();
    const x = cv.getContext('2d'); x.drawImage(valleyPicture(S), 0, 0, S, S);   // (round T4b) drawn from the map data, no longer a picture of the world
    const k = S / SIZE, pt = (wx, wz) => [(wx + HALF) * k, (wz + HALF) * k];
    const spots = [];
    const icon = (ch, wx, wz, sz = 26) => { const [a, b] = pt(wx, wz); x.font = sz + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, a, b); };
    SHRINES.forEach(s => { const done = p.shrines[s.id]; const [a, b] = pt(s.x, s.z); x.fillStyle = done ? '#38c8f0' : '#ff8a2a'; x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.arc(a, b, 11, 0, Math.PI * 2); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.font = 'bold 13px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(done ? '✓' : '?', a, b + 1); spots.push({ x: s.x, z: s.z, name: GAMES[s.game] ? GAMES[s.game].name() : '' }); });
    TOWERS.forEach(t => { icon('🗼', t.x, t.z, 28); spots.push({ x: t.x, z: t.z, name: t.name() }); });
    // every main place, with a picture and its name
    mapPlaces.forEach(pl => {
      const [a, b] = pt(pl.x, pl.z); x.fillStyle = 'rgba(255,255,255,.92)'; x.beginPath(); x.arc(a, b, 22, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#ffb020'; x.lineWidth = 3; x.stroke();
      icon(pl.icon, pl.x, pl.z, 26);
      spots.push({ x: pl.x, z: pl.z, name: pl.name(), r: 14, snapToNpc: !['memory_e', 'memory_w', 'myhouse'].includes(pl.key) });
    });
    // (Release request, T1) each name goes under its picture, or above, right or left of it when that spot would cover
    // another name or picture, so places close together (the festival stage by Đà Nẵng) stay readable
    x.font = 'bold 14px Fredoka, "Baloo 2", sans-serif';
    const dots = mapPlaces.map(pl => pt(pl.x, pl.z)), labels = [];
    const hits = (r, q) => r.x < q.x + q.w && q.x < r.x + r.w && r.y < q.y + q.h && q.y < r.y + r.h;
    const cost = r => labels.filter(q => hits(r, q)).length * 1000 + dots.filter(([a, b]) => hits(r, { x: a - 22, y: b - 22, w: 44, h: 44 })).length + (r.x < 0 || r.y < 0 || r.x + r.w > S || r.y + r.h > S ? 100000 : 0);
    mapPlaces.forEach((pl, i) => {
      const [a, b] = dots[i], w = x.measureText(pl.name()).width + 12;
      const tries = [[a - w / 2, b + 24], [a - w / 2, b - 44], [a + 25, b - 10], [a - 25 - w, b - 10], [a - w / 2, b + 46], [a - w / 2, b - 66]].map(([lx, ly]) => ({ x: lx, y: ly, w, h: 20 }));
      // Dense clusters (the family home beside the farm shop) need more than six offsets.
      // Search outward without moving the destination itself or hiding either name.
      for (let radius = 24; radius <= 160; radius += 22) for (let j = 0; j < 16; j++) {
        const angle = j * Math.PI / 8;
        tries.push({ x: Math.max(2, Math.min(S - w - 2, a + Math.cos(angle) * radius - w / 2)), y: Math.max(2, Math.min(S - 22, b + Math.sin(angle) * radius - 10)), w, h: 20 });
      }
      let best = tries[0], bc = Infinity; for (const r of tries) { const c = cost(r); if (c < bc) { best = r; bc = c; } if (!c) break; }
      labels.push(Object.assign(best, { name: pl.name() }));
    });
    // (round T4b) soft clouds over the places not visited yet, drawn under the names so every name stays readable;
    // the first time the map opens after a visit, that place's cloud lifts with a little puff (once: remembered)
    const vis = p.visited || {}, lifted = p.mapClouds = p.mapClouds || {}, puffs = [];
    cv.clouds = [];
    const cloud = (a, b, s = 1) => { x.save(); x.shadowColor = 'rgba(80,90,120,.3)'; x.shadowBlur = 6; x.shadowOffsetY = 2; x.fillStyle = 'rgba(255,255,255,.94)'; x.beginPath();
      for (const [dx, dy, r] of [[-14, 4, 11], [0, -4, 15], [14, 3, 11], [0, 8, 13]]) { x.moveTo(a + dx * s + r * s, b + dy * s); x.arc(a + dx * s, b + dy * s, r * s, 0, Math.PI * 2); }
      x.fill(); x.restore(); };
    mapPlaces.forEach(pl => {
      if (pl.under || pl.key === 'myhouse') return; const rg = regionAt(pl.x, pl.z), seen = !!vis[rg], [a, b] = pt(pl.x, pl.z);
      if (!seen) { cloud(a, b - 4); cv.clouds.push({ region: rg, name: pl.name() }); }
      else if (!lifted[rg]) { lifted[rg] = true; puffs.push([a, b - 4]); }
    });
    labels.forEach(r => { x.fillStyle = 'rgba(255,255,255,.92)'; x.fillRect(r.x, r.y, r.w, r.h); x.fillStyle = '#3b2558'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(r.name, r.x + r.w / 2, r.y + 10); });
    cv.labels = labels; // read by the hubmap check
    if (puffs.length) { const fog = el('div', 'mapclouds'); wrap.appendChild(fog); SFX.chime && SFX.chime(); saveProfiles();
      for (const [a, b] of puffs) { const c = el('div', 'mapcloud puff'); c.style.left = (a / S * 100) + '%'; c.style.top = (b / S * 100) + '%'; fog.appendChild(c); c.addEventListener('animationend', () => c.remove()); } }
    // every ferry and raft stop (tap one to go there and wait for the boat)
    if (game.ferries) game.ferries.ferries.forEach(F => F.stops.forEach(st => { const t = st.dock.pier.tip; icon('⛴️', t.x, t.z, 16); spots.push({ x: t.x, z: t.z, name: '⛴️ ' + st.name(), r: 10 }); }));
    const q = game.questTarget(hero); if (q) { const [a, b] = pt(q.x, q.z); x.fillStyle = '#ff3b6b'; x.beginPath(); x.arc(a, b - 14, 9, 0, Math.PI * 2); x.moveTo(a - 7, b - 9); x.lineTo(a, b); x.lineTo(a + 7, b - 9); x.fill(); }
    game.heroes.forEach((h, j) => { const [a, b] = pt(h.pos.x, h.pos.z); x.save(); x.translate(a, b); x.rotate(-h.yaw + Math.PI); x.fillStyle = j === 0 ? '#ffd23f' : '#5fe0ff'; x.strokeStyle = '#3a2a10'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -12); x.lineTo(9, 10); x.lineTo(0, 5); x.lineTo(-9, 10); x.closePath(); x.fill(); x.stroke(); x.restore(); });
    // every friend online, with their name (tap them to walk, fly or ask them to come)
    Object.values<NonNullable<SvMain['partners']>[string]>(game.partners || {}).forEach(P => {
      if (P.pos.y < -40) return; const [a, b] = pt(P.pos.x, P.pos.z);
      x.fillStyle = '#2fa8ff'; x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.arc(a, b, 13, 0, Math.PI * 2); x.fill(); x.stroke();
      icon('🧒', P.pos.x, P.pos.z, 18);
      x.font = 'bold 14px Fredoka, "Baloo 2", sans-serif'; const w = x.measureText(P.name).width + 12; x.fillStyle = '#2fa8ff'; x.fillRect(a - w / 2, b - 36, w, 20); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(P.name, a, b - 26);
      spots.push({ x: P.pos.x, z: P.pos.z, name: P.name, r: 16, friend: P.id });
    });
    cv.onclick = e => {
      const q = local(cv, e), r = q.r, wx = q.x / r.width * SIZE - HALF, wz = q.y / r.height * SIZE - HALF;
      const s = spots.slice().sort((a, b) => Math.hypot(a.x - wx, a.z - wz) - Math.hypot(b.x - wx, b.z - wz)).find(s => Math.hypot(s.x - wx, s.z - wz) < (s.r || 10)); if (!s) return;
      const ok = el('div', 'travel', `<p>${T('Travel to', 'Bay đến')} <b>${esc(s.name)}</b>?</p><button class="btn primary">✨ ${T('Fly there', 'Bay đến đó')}</button><button class="btn walk">👣 ${T('Walk there', 'Đi bộ đến đó')}</button><button class="btn no">${T('No', 'Không')}</button>`);
      body.appendChild(ok);
      if (s.friend) {
        ok.querySelector('.primary').onclick = () => { close(); game.flyToFriend(hero, s.friend); };
        ok.querySelector('.walk').onclick = () => { close(); game.walkToFriend(hero, s.friend); };
        const c = el('button', 'btn', '📣 ' + T('Ask to come', 'Gọi bạn đến')); c.onclick = () => { close(); game.askFriendToCome(hero, s.friend); }; ok.insertBefore(c, ok.querySelector('.no'));
        ok.querySelector('.no').onclick = () => ok.remove(); return;
      }
      ok.querySelector('.primary').onclick = () => { close(); game.travelTo(hero, s.x, s.z, s.snapToNpc !== false); };
      ok.querySelector('.walk').onclick = () => { close(); hero.walkTo = { x: s.x, z: s.z, name: s.name }; say(`Follow the footprints to ${s.name}!`, `Đi theo dấu chân đến ${s.name} nhé!`); };
      ok.querySelector('.no').onclick = () => ok.remove();
    };
  }
  function drawBag(body) {
    // (Round V) what an ingredient is for: the dishes it goes into at a cooking pot
    const ingInfo = id => { const it = ITEMS[id], uses = RECIPES.filter(r => r.need.includes(id)), names = uses.map(r => r.name());
      const en = `${it.name()}: an ingredient. ${uses.length ? 'Cook it at a cooking pot to make ' + names.join(', ') + '.' : 'Cook it at a cooking pot.'}`, vi = `${it.name()}: nguyên liệu. ${uses.length ? 'Nấu ở nồi để làm ' + names.join(', ') + '.' : 'Nấu ở nồi nhé.'}`;
      return [T(en, vi), en, vi]; };
    const isGem = id => WILD[id] && WILD[id].kind === 'gem';
    const items = Object.entries<number>(p.inv).filter(([id, n]) => n > 0 && ITEMS[id] && !isGem(id)), gems = Object.entries<number>(p.inv).filter(([id, n]) => n > 0 && isGem(id)).sort((a, b) => WILD[b[0]].sell - WILD[a[0]].sell);
    const bought = Object.entries<number>(p.bought || {}).filter(([id, n]) => n > 0 && snackOf(id));
    const dishes = Object.entries<number>(p.dishes).filter(([, n]) => n > 0);
    // (issue #738, tester on an iPhone 430x517, 31 Oct 2026 AEDT: "I can't see the pets in the Bag; put the pets and the
    // companion in one place, where their accessories are bought and managed too") the pets were one button above the coins:
    // no heading, so no chip in the sticky jump row and no fold, and on a short phone it scrolled away for good; the
    // companion and its hats were only in the shop. Now one section, first in the Bag and first in the jump row: the
    // companion, each pet, adopting, and the hats (put on whoever should wear it, or buy the next one)
    const pals = (() => {
      const kp = game.kidplay, comp = p.lanterns && p.lanterns.companion && COMPANIONS[p.lanterns.companion], pets = (p.pets || []).slice(0, game.pets?.max || 2), petNm = pt => game.pets?.nameOf ? game.pets.nameOf(pt) : (pt.name || '');
      const ps = (p.lanterns && p.lanterns.pet) || {}, owned = (ps.hats || []), next = kp && (comp || pets.length) ? kp.nextHat(hero) : null;
      const badge = id => id && PAL_HAT_ICON[id] ? `<i class="pal-hat">${pic(PAL_HAT_ICON[id])}</i>` : '';
      const friends = (comp ? `<button class="slot pal" data-pal="buddy" title="${esc(T(comp.en, comp.vi))}"><span>${pic(comp.icon)}</span>${badge(ps.hat)}<small>${esc(comp.name)}</small></button>` : '')
        + pets.map((pt, k) => `<button class="slot pal" data-pal="${k}" title="${esc(petNm(pt))}"><span>${pic(PET_ICON[pt.kind] || '🐾')}</span>${badge(pt.hat)}<small>${esc(petNm(pt))}</small></button>`).join('')
        + (() => { const yard = pets.length >= (game.pets?.max || 2), nm = yard ? T('Pet yard', 'Sân thú cưng') : T('Adopt a pet', 'Nhận nuôi'), tip = yard ? T('Pet yard: name and care for your pets', 'Sân thú cưng: đặt tên và chăm sóc thú cưng') : T('Adopt a pet: choose a friend to follow you', 'Nhận nuôi: chọn một bạn thú đi theo con');
          return `<button class="slot pal" data-adopt="1" title="${esc(tip)}"><span>${pic('🐾')}</span><small>${nm}</small></button>`; })();
      const hats = kp && (comp || pets.length) ? kp.HATS.map(x => { const have = owned.includes(x.id), buyable = next && next.id === x.id, who = have && kp.wearerOf ? kp.wearerOf(hero, x.id) : null;
        return `<button class="slot pal-hatslot ${who != null ? 'on' : ''} ${!have && !buyable ? 'locked' : ''}" data-phat="${x.id}" title="${esc(T(x.en, x.vi))}"><span>${pic(PAL_HAT_ICON[x.id] || '🎩')}</span>${have ? '' : buyable ? `<b class="pal-price">${fmt(x.price)}</b>` : `<i class="pal-lock">${pic('🔒')}</i>`}<small>${esc(T(x.en, x.vi))}</small></button>`; }).join('') : '';
      return `<h3 class="bag-pals-h">${pic('🐾')} ${PALS_NAME()} <small>${T('tap one', 'chạm để xem')}</small></h3>
      <div class="slots bag-pals">${friends}</div>${hats ? `<p class="note pal-hatnote">${T('Hats for your friends: tap one to put it on, or buy the next one.', 'Mũ cho các bạn: chạm để đội cho bạn nào, hoặc mua mũ tiếp theo.')}</p><div class="slots bag-pal-hats">${hats}</div>` : ''}`;
    })();
    body.innerHTML = `
      <div class="bag-top"><button class="chip bagc" data-chip="money" title="${T('Coins', 'Đồng xu')}"><i>💰</i><b>${fmt(farm.coins)}</b><small>${T('Coins', 'Đồng xu')}</small></button><button class="chip bagc" data-chip="orbs" title="${T('Sparkle Orbs', 'Ngọc Lấp Lánh')}"><i>🔮</i><b>${p.orbs}</b><small>${T('Sparkle Orbs', 'Ngọc Lấp Lánh')}</small></button><button class="chip bagc" data-chip="leafy" title="${T('Leafies', 'Bạn Lá')}"><i>🍃</i><b>${Object.keys(p.leafies).length}/24</b><small>${T('Leafies', 'Bạn Lá')}</small></button></div>
      ${pals}
      <h3>${T('Food', 'Món ăn')} <small>${T('tap to eat', 'chạm để ăn')}</small></h3>
      <div class="slots">${dishes.map(([id, n]) => { const r = dishInfo(id) || { icon: '🥘', name: () => T('Mystery stew', 'Món hầm bí ẩn') }; return `<button class="slot" data-eat="${id}" title="${esc(r.name() + ' · ' + T('tap to eat: hearts and energy back', 'chạm để ăn: thêm tim và sức'))}"><span>${r.icon}</span><b>${n}</b><small>${esc(r.name())}</small></button>`; }).join('') || `<p class="note">${T('Cook at a cooking pot to make food.', 'Nấu ăn ở nồi nấu để có món ăn.')}</p>`}</div>
      <h3>🛍️ ${T('From shops and stalls', 'Mua ở quán và sạp')} <small>${T('tap to eat', 'chạm để ăn')}</small></h3>
      <div class="slots">${bought.map(([id, n]) => { const v = snackOf(id); return `<button class="slot" data-snack="${id}" title="${esc(T(v.food[1], v.food[2]) + ' · ' + T('tap to eat', 'chạm để ăn'))}"><span>${v.food[0]}</span><b>${n}</b><small>${esc(T(v.food[1], v.food[2]))}</small></button>`; }).join('') || `<p class="note">${T('Buy food at kiosks, market stalls and from street sellers. It goes in here!', 'Mua đồ ăn ở quán, sạp chợ và các cô gánh hàng rong. Đồ mua sẽ nằm ở đây!')}</p>`}</div>
      <h3>💎 ${T('Treasures', 'Báu vật')} <small>${T('tap for help', 'chạm để xem hướng dẫn')}</small></h3>
      <div class="slots">${gems.map(([id, n]) => `<button class="slot gemslot" data-sellgem="${id}" title="${esc(WILD[id].name() + ' · ' + T('a treasure: choose Sell one in its help card', 'báu vật: chọn Bán một trong hướng dẫn'))}"><span>${WILD[id].icon}</span><b>${n}</b><small>${esc(WILD[id].name()) + ' · ' + fmt(WILD[id].sell)}</small></button>`).join('') || `<p class="note">${T('Dig at the sparkly mounds of earth and crack rocks open to find treasures!', 'Đào ở những ụ đất lấp lánh và gõ vỡ hòn đá để tìm báu vật!')}</p>`}</div>
      <h3>${T('Ingredients', 'Nguyên liệu')}</h3>
      <div class="slots">${items.map(([id, n]) => `<button class="slot" data-ing="${id}" title="${esc(ingInfo(id)[0])}"><span>${ITEMS[id].icon}</span><b>${n}</b><small>${esc(ITEMS[id].name())}</small></button>`).join('') || `<p class="note">${T('Empty! Shake apple trees and look for herbs and mushrooms.', 'Trống trơn! Rung cây táo và tìm rau thơm, nấm nhé.')}</p>`}</div>
      ${(() => { const SLOT_ICON = { hat: '👒', neck: '📿', top: '👕', bottom: '👖', feet: '👟', back: '🪽' }; // (Round U, owner 11 Oct: everything bought shows here until it is worn) the clothes and accessories the child owns
        const itemSVG = it => game.shop && game.shop.itemSVG ? game.shop.itemSVG(it) : pic(SLOT_ICON[it.slot] || '👕'), mine = CLOTHES.filter(it => owns(p, it.id) && it.for === (setOfLook(p.look) === 'girl' ? 'g' : 'b')), off = mine.filter(it => p.look[it.slot] !== it.id), on = mine.filter(it => p.look[it.slot] === it.id);
        const hats = HATS.concat(REWARD_HATS.filter(h => p.owned.hats.includes(h))).filter(h => h !== 'none' && !ITEM[h]);
        return `<h3>${pic('👕')} ${T('Clothes and accessories', 'Quần áo và phụ kiện')} <small>${T('tap to wear', 'chạm để mặc')}</small></h3>
      <div class="slots">${off.map(it => `<button class="slot" data-wear="${it.id}" title="${esc(T(it.en, it.vi))}">${itemSVG(it)}<small>${esc(T(it.en, it.vi))}</small></button>`).join('')}${hats.filter(h => p.look.hat !== h).map(h => `<button class="slot" data-hat="${h}"><span>${HAT_ICON[h]}</span><small>${esc(HAT_NAME[h]())}</small></button>`).join('')}${!off.length && !hats.filter(h => p.look.hat !== h).length ? `<p class="note">${T('Everything you have is on! Find more at the clothes shop.', 'Con đang mặc hết đồ rồi! Ghé cửa hàng quần áo để mua thêm nhé.')}</p>` : ''}</div>
      ${on.length || (p.look.hat && p.look.hat !== 'none' && !ITEM[p.look.hat]) ? `<h3>${T('Wearing now', 'Đang mặc')} <small>${T('tap to take off', 'chạm để cởi ra')}</small></h3>
      <div class="slots">${on.map(it => `<button class="slot on" data-unwear="${it.slot}" title="${esc(T(it.en, it.vi))}">${itemSVG(it)}<small>${esc(T(it.en, it.vi))}</small></button>`).join('')}${p.look.hat && p.look.hat !== 'none' && !ITEM[p.look.hat] && HAT_ICON[p.look.hat] ? `<button class="slot on" data-hat="none"><span>${HAT_ICON[p.look.hat]}</span><small>${esc(HAT_NAME[p.look.hat] ? HAT_NAME[p.look.hat]() : '')}</small></button>` : ''}</div>` : ''}`; })()}
      ${(() => { // (r79, owner 16 Oct) clothes of the other set, bought to give away: wrapped gift boxes, one tile for each kind
        const gifts = (p.owned && p.owned.gifts || []).filter(id => ITEM[id]), kinds = [...new Set(gifts)];
        return kinds.length ? `<h3>🎁 ${T('Gifts to give', 'Quà để tặng')} <small>${T('tap to give', 'chạm để tặng')}</small></h3>
      <div class="slots">${kinds.map(id => { const it = ITEM[id], n = gifts.filter(x => x === id).length; return `<button class="slot giftbox" data-gift="${id}" title="${esc(T(it.en, it.vi))}"><span>🎁</span>${n > 1 ? `<b>${n}</b>` : ''}<small>${esc(T(it.en, it.vi))}</small></button>`; }).join('')}</div>` : ''; })()}
      <h3>🪁 ${T('Whistling kite', 'Diều sáo')}</h3>
      <div class="slots">${p.kite ? `<button class="slot ${p.kiteOn !== false ? 'on' : ''}" data-kite="1"><span>🪁</span><small>${p.kiteOn !== false ? T('Flying', 'Đang bay') : T('Put away', 'Cất đi')}</small></button><button class="slot" data-whistle="1"><span>🎶</span><small>${T('Whistle!', 'Thổi sáo!')}</small></button>` : `<p class="note">${T('Win the Kite Flying game to get a kite with a bamboo flute that sings in the wind!', 'Thắng trò Thả Diều để nhận diều sáo hát vi vu trong gió!')}</p>`}</div>
      ${game.hoilang ? game.hoilang.bagHTML(p) : ''}
      <h3>${T('Glider', 'Cánh lượn')}</h3>
      <div class="slots">${p.glider ? p.owned.gliders.map(g => `<button class="slot ${p.look.glider === g ? 'on' : ''}" data-gl="${g}"><span class="sw big" style="background:${GLIDERS[g]}"></span></button>`).join('') : `<p class="note">${T('Not yet! Ông Cú has something for you…', 'Chưa có! Ông Cú có món quà cho con đấy…')}</p>`}</div>`;
    jumpNav(body, body.querySelector('.bag-top')); // (owner, 13 Oct AEDT: the Backpack's section-button row back, after the tester's notes took it out)
    // (Round V, owner 13 Oct) food asks first ("Eat it?"); an ingredient says what it is and which dishes it makes
    // (r79, owner point 14: the "Eat it?" question was too big) food asks in one small row: the picture, "Eat it?" and the
    // two buttons; what the food does is said aloud, not written out
    const helpCard = (name, art, en, vi, action, run, small: boolean | undefined = undefined) => {
      body.querySelector('.bag-help')?.remove();
      const c = small
        ? el('div', 'bag-help bag-ask' + (p.age !== 'big' ? ' little' : ''), `${art}<b><span class="nm">${esc(name)}</span><small>${T('Eat it?', 'Ăn nhé?')}</small></b><button class="btn primary bh-act">${action}</button><button class="btn bh-close">${T('Not now', 'Để sau')}</button>`)
        : el('div', 'bag-help', `<div>${art}<b>${esc(name)}</b></div><p>${esc(T(en, vi))}</p><div class="actions">${action ? `<button class="btn primary bh-act">${action}</button>` : ''}<button class="btn bh-close">${T('Not now', 'Để sau')}</button></div>`);
      c.setAttribute('role', 'region'); c.setAttribute('aria-label', name); body.appendChild(c); say(`${name}. ${en}`, `${name}. ${vi}`);
      c.querySelector('.bh-close').onclick = () => { c.remove(); run?.(false); };
      if (action) c.querySelector('.bh-act').onclick = () => { c.remove(); run?.(true); }; return c;
    };
    const askEat = (name, icon, en, vi) => new Promise(resolve => { SFX.tap(); helpCard(name, pic(icon), 'Eat it? ' + en, 'Ăn nhé? ' + vi, T('Eat', 'Ăn'), resolve, true); });
    body.querySelectorAll('[data-eat]').forEach(b => b.onclick = async () => { const r = dishInfo(b.dataset.eat) || { icon: '🥘', heal: 1, name: () => T('Mystery stew', 'Món hầm bí ẩn') };
      if (await askEat(r.name(), r.icon, `Restores up to ${r.heal} hearts and refills energy. Hearts only fall for older children on Hard.`, `Hồi tối đa ${r.heal} tim và nạp năng lượng. Chỉ trẻ lớn ở mức Khó mới mất tim.`)) game.eat(hero, b.dataset.eat); draw(); });
    body.querySelectorAll('[data-snack]').forEach(b => b.onclick = async () => { const v = snackOf(b.dataset.snack);
      if (await askEat(T(v.food[1], v.food[2]), v.food[0], 'a treat from the market.', 'một món ngon mua ở chợ.')) eatSnack(game, hero, b.dataset.snack, true); draw(); });
    body.querySelectorAll('[data-ing]').forEach(b => b.onclick = () => { SFX.tap(); const [line, en, vi] = ingInfo(b.dataset.ing); toast(line); say(en, vi); });
    body.querySelectorAll('[data-sellgem]').forEach(b => b.onclick = () => {
      const id = b.dataset.sellgem, w = WILD[id];
      if (!(p.inv[id] > 0)) return;
      p.inv[id]--; if (p.inv[id] <= 0) delete p.inv[id]; farm.coins += w.sell; saveFarm(); game.save(); SFX.coin();
      say(`Sold! Now you have ${money(farm.coins)}.`, `Bán rồi! Giờ con có ${money(farm.coins)}.`); game.job && game.job('sell', 1, hero); draw();
    });
    // (#738) Pets & Buddy: a friend says who it is and offers what it can do; a hat offers who can wear it, or Buy
    const toPets = () => { close(); setTimeout(() => game.pets.openAdopt(hero), 220); };
    body.querySelectorAll('[data-adopt]').forEach(b => b.onclick = () => { SFX.tap(); toPets(); });
    body.querySelectorAll('[data-pal]').forEach(b => b.onclick = () => { SFX.tap();
      const art = b.querySelector('svg, .art')?.outerHTML || '', name = b.querySelector('small')?.textContent || '';
      if (b.dataset.pal === 'buddy') { const canFeed = !!game.kidplay;
        helpCard(name, art, 'Your companion flies with you and lights the way. Feed it once a day and it grows. Choose a hat for it below.', 'Bạn đồng hành bay cùng con và soi đường. Cho bạn ăn mỗi ngày để bạn lớn lên. Chọn mũ cho bạn ở bên dưới.', canFeed ? T('Feed', 'Cho ăn') : '', ok => { if (ok) { game.kidplay.feed(hero); draw(); } }); return; }
      helpCard(name, art, 'Your pet follows you, sniffs out hidden Leafies and saves you in deep water. Choose a hat for it below.', 'Thú cưng đi theo con, tìm bạn Lá Lá đang trốn và cứu con dưới nước sâu. Chọn mũ cho bạn ở bên dưới.', T('Name and care', 'Đặt tên và chăm sóc'), ok => { if (ok) toPets(); }); });
    body.querySelectorAll('[data-phat]').forEach(b => b.onclick = () => {
      const kp = game.kidplay, id = b.dataset.phat, x = kp && kp.HATS.find(y => y.id === id); if (!x) return; SFX.tap();
      const ps = (p.lanterns && p.lanterns.pet) || {}, have = (ps.hats || []).includes(id), next = kp.nextHat(hero), name = T(x.en, x.vi), art = b.querySelector('svg, .art')?.outerHTML || '';
      body.querySelector('.bag-help')?.remove();
      let en, vi, btns = '';
      if (have) {
        const who = kp.wearerOf(hero, id), comp = p.lanterns && p.lanterns.companion && COMPANIONS[p.lanterns.companion];
        const opts = [...(comp ? [['buddy', comp.name]] : []), ...(p.pets || []).slice(0, game.pets?.max || 2).map((pt, k) => [String(k), game.pets.nameOf(pt)])];
        en = `${x.en}. Who should wear it?`; vi = `${x.vi}. Bạn nào đội mũ này?`;
        btns = opts.map(([k, nm]) => `<button class="btn ${String(who) === k ? 'on' : 'primary'} bh-wear" data-to="${k}" aria-pressed="${String(who) === k}">${esc(nm)}</button>`).join('') + (who != null ? `<button class="btn bh-off">${T('Take off', 'Cởi ra')}</button>` : '');
      } else if (next && next.id === id) {
        const can = farm.coins >= x.price;
        en = `${x.en} costs ${money(x.price)}. ${can ? 'Choose Buy when you are ready.' : 'Keep saving coins for it!'}`; vi = `${x.vi} giá ${money(x.price)}. ${can ? 'Chọn Mua khi con đã sẵn sàng.' : 'Để dành thêm tiền nhé!'}`;
        if (can) btns = `<button class="btn primary bh-buy">${T('Buy', 'Mua')} · ${fmt(x.price)}</button>`;
      } else { en = `${x.en}: buy the hats before it first.`; vi = `${x.vi}: mua những chiếc mũ trước nó trước nhé.`; }
      const c = el('div', 'bag-help', `<div>${art}<b>${esc(name)}</b></div><p>${esc(T(en, vi))}</p><div class="actions">${btns}<button class="btn bh-close">${T('Not now', 'Để sau')}</button></div>`);
      c.setAttribute('role', 'region'); c.setAttribute('aria-label', name); body.appendChild(c); say(en, vi);
      c.querySelector('.bh-close').onclick = () => c.remove();
      c.querySelectorAll('.bh-wear').forEach(w => w.onclick = () => { const k = w.dataset.to; if (kp.wearHat(hero, k === 'buddy' ? 'buddy' : +k, id)) { SFX.pop ? SFX.pop(1) : SFX.ok(); say('What a lovely hat!', 'Mũ đẹp quá!'); } draw(); });
      c.querySelector('.bh-off')?.addEventListener('click', () => { const who = kp.wearerOf(hero, id); if (who != null) kp.wearHat(hero, who, null); SFX.tap(); draw(); });
      c.querySelector('.bh-buy')?.addEventListener('click', () => { kp.buy(hero, id); draw(); });
    });
    body.querySelectorAll('[data-hat]').forEach(b => b.onclick = () => { p.look.hat = b.dataset.hat; saveProfiles(); game.rebuildHero(i); SFX.ok(); draw(); });
    body.querySelectorAll('[data-wear]').forEach(b => b.onclick = () => { const it = ITEM[b.dataset.wear]; if (it && wearItem(p, it.slot, it.id)) { saveProfiles(); game.rebuildHero(i); SFX.ok(); draw(); } });
    body.querySelectorAll('[data-unwear]').forEach(b => b.onclick = () => { if (wearItem(p, b.dataset.unwear, 'none')) { saveProfiles(); game.rebuildHero(i); SFX.tap(); draw(); } });
    // (r79) a gift box says what is inside and who it is for, and offers the players on this device it fits
    body.querySelectorAll('[data-gift]').forEach(b => b.onclick = () => {
      SFX.tap(); const id = b.dataset.gift, it = ITEM[id], girls = it.for === 'g', name = T(it.en, it.vi);
      const friends = profiles.filter(q => q.id !== p.id && setOfLook(q.look) === (girls ? 'girl' : 'boy'));
      const en = `A wrapped gift: ${it.en}, made for ${girls ? 'girls' : 'boys'}. ${friends.length ? 'Choose who to give it to.' : 'Give it to a friend when you play together: trade it at your market stall.'}`;
      const vi = `Một món quà đã gói: ${it.vi}, dành cho ${girls ? 'bé gái' : 'bé trai'}. ${friends.length ? 'Chọn bạn để tặng nhé.' : 'Khi chơi cùng bạn, tặng ở sạp hàng của con nhé.'}`;
      body.querySelector('.bag-help')?.remove();
      const c = el('div', 'bag-help', `<div>${b.querySelector('svg, .art')?.outerHTML || ''}<b>${esc(name)}</b></div><p>${esc(T(en, vi))}</p><div class="actions">${friends.map(q => `<button class="btn primary bh-give" data-to="${q.id}">${T('Give to', 'Tặng')} ${esc(q.name)}</button>`).join('')}<button class="btn bh-close">${T('Not now', 'Để sau')}</button></div>`);
      c.setAttribute('role', 'region'); c.setAttribute('aria-label', name); body.appendChild(c); say(en, vi);
      c.querySelector('.bh-close').onclick = () => c.remove();
      c.querySelectorAll('.bh-give').forEach(g => g.onclick = () => { const q = profiles.find(x => x.id === g.dataset.to), r = giveGift(p, q, id);
        if (r.ok) { saveProfiles(true); SFX.ok(); say(`You gave ${it.en} to ${q.name}. How kind!`, `Con đã tặng ${it.vi} cho ${q.name}. Con tốt bụng quá!`); toast(T(`Given to ${q.name}`, `Đã tặng ${q.name}`)); } draw(); });
    });
    body.querySelectorAll('[data-kite]').forEach(b => b.onclick = () => { p.kiteOn = p.kiteOn === false; saveProfiles(); game.kites.sync(); SFX.ok(); if (p.kiteOn) game.kites.whistle(hero); draw(); });
    body.querySelectorAll('[data-whistle]').forEach(b => b.onclick = () => { game.kites.whistle(hero); });
    game.hoilang && game.hoilang.bindBag(body, hero, draw); // (round S) carry a village festival prize, like the kite
    body.querySelectorAll('[data-gl]').forEach(b => b.onclick = () => { p.look.glider = +b.dataset.gl; saveProfiles(); game.rebuildHero(i); SFX.ok(); draw(); });
    // Help is the first tap; every change requires an explicit action inside the same Bag.
    for (const b of body.querySelectorAll('.slot')) {
      if (b.dataset.eat || b.dataset.snack || b.dataset.gift || b.dataset.pal || b.dataset.adopt || b.dataset.phat) continue;
      const oldAction = b.onclick, name = b.querySelector('small')?.textContent || b.title || T('Item', 'Đồ dùng');
      const it = ITEM[b.dataset.wear], ingredient = b.dataset.ing, treasure = WILD[b.dataset.sellgem];
      let en = 'Keep this item in your Backpack and use its action when you need it.', vi = 'Giữ món này trong Ba lô và chọn hành động khi cần.';
      // (r79, owner point 12) every kind of thing says what it is and what the button does
      if (it || b.dataset.hat || b.dataset.unwear) { en = 'Clothes and accessories change how your character looks.'; vi = 'Quần áo và phụ kiện thay đổi vẻ ngoài của nhân vật.'; }
      if (it) { const sl = WEAR_SLOTS.find(x => x.id === it.slot); en = `Clothes from the shop (${sl ? sl.en.toLowerCase() : 'clothes'}). Tap Wear to put it on; the mirror in the Shop shows everything you own.`; vi = `Quần áo mua ở cửa hàng (${sl ? sl.vi.toLowerCase() : 'quần áo'}). Chạm Mặc để mặc vào; cái gương trong Cửa hàng cho xem mọi đồ con có.`; }
      if (b.dataset.unwear) { en = 'You are wearing this now. Tap Take off to take it off; it stays in your Backpack.'; vi = 'Con đang mặc món này. Chạm Cởi ra để cởi; nó vẫn ở trong Ba lô.'; }
      if (b.dataset.hat && b.dataset.hat !== 'none' && !ITEM[b.dataset.hat]) { en = 'A hat you won on an adventure. Tap Wear to put it on.'; vi = 'Chiếc mũ con giành được trong chuyến phiêu lưu. Chạm Mặc để đội.'; }
      if (b.dataset.hat === 'none') { en = 'The hat you won, on your head now. Tap Take off to take it off.'; vi = 'Chiếc mũ con giành được, đang đội trên đầu. Chạm Cởi ra để bỏ mũ.'; }
      if (b.dataset.hlcarry) { en = 'A prize you won at the village festival. Carry it to show everyone, or put it away. It is a keepsake in your house too.'; vi = 'Phần quà con giành được ở hội làng. Mang theo cho mọi người xem, hoặc cất đi. Nó cũng là kỷ vật trong nhà con.'; }
      if (b.dataset.gl) { en = 'Choose the colour of your glider for flying safely from high places.'; vi = 'Chọn màu cánh lượn để bay an toàn từ nơi cao.'; }
      if (b.dataset.kite || b.dataset.whistle) { en = 'Your whistling kite follows you; its bamboo flute sings in the wind.'; vi = 'Diều sáo bay theo con; sáo tre hát trong gió.'; }
      if (ingredient) { const info = ingInfo(ingredient); en = info[1]; vi = info[2]; }
      if (treasure) { en = `A treasure you found. Sell one for ${money(treasure.sell)} or keep it.`; vi = `Báu vật con tìm được. Bán một món lấy ${money(treasure.sell)} hoặc giữ lại.`; }
      const action = treasure ? T('Sell one', 'Bán một') : b.dataset.unwear || b.dataset.hat === 'none' ? T('Take off', 'Cởi ra') : b.dataset.wear || b.dataset.hat ? T('Wear', 'Mặc') : b.dataset.kite ? (p.kiteOn !== false ? T('Put away', 'Cất đi') : T('Fly', 'Thả diều')) : b.dataset.hlcarry ? (p.hoilang?.carryOn !== false && p.hoilang?.carry === b.dataset.hlcarry ? T('Put away', 'Cất đi') : T('Carry', 'Mang theo')) : b.dataset.whistle ? T('Whistle', 'Thổi sáo') : b.dataset.gl !== undefined ? T('Choose', 'Chọn') : T('Use', 'Dùng');
      b.onclick = () => { const art = b.querySelector('svg, .art, .sw')?.outerHTML || ''; helpCard(name, art, en, vi, oldAction && !ingredient ? action : '', ok => { if (ok) { oldAction?.call(b); } }); };
    }

  }
  // (round R, owner 9 Oct) side stories in their own list: the child picks one to follow on the goal bar
  const sideHTML = () => { const list = game.sideStories ? game.sideStories() : []; if (!list.length) return '';
    return `<h3>${T('Side stories', 'Truyện phụ')}</h3><div class="sides">${list.map(sd => { const st = sd.status(p), on = p.follow === sd.id;
      return `<div class="side ${st.done ? 'done' : ''}"><span>${pic(sd.icon)}</span><div><b>${esc(sd.title())}</b><small>${st.done ? T('Finished!', 'Xong rồi!') : esc(st.step)}</small></div>${st.done || !st.started ? '' : `<button class="btn ${on ? 'on' : ''}" data-follow="${sd.id}">${on ? T('Following', 'Đang theo') : T('Follow', 'Theo truyện này')}</button>`}</div>`; }).join('')}</div>`; };
  // (tester's notes, 12 Oct) what a dish not cooked yet needs: every ingredient, the ones in the bag bright with a tick,
  // the ones still to find faded, so a child can see what is collected for which recipe
  const recNeed = r => r.need.map((n, k) => { const have = (p.inv[n] || 0) >= r.need.slice(0, k + 1).filter(x => x === n).length;
    return `<i class="${have ? 'have' : 'miss'}">${ITEMS[n].icon}${have ? '<b class="tick">✅</b>' : ''}</i>`; }).join(' + ');
  function drawLog(body) {
    const next = game.currentQuest(p);
    // (daily adventure, chat C, 16 Oct AEDT; ADV-1) today's adventure on top; everything else behind "More adventures"
    const advTop = game.adventure ? game.adventure.logHTML(p) : '';
    // (owner, 17 Oct AEDT: "show both") the family's missions stay in sight above the button: a grown-up holds ✓ there
    const famLog = game.parents ? game.parents.logHTML(p) : '';
    body.innerHTML = (advTop ? advTop + famLog + `<button class="adv-morebtn" aria-expanded="false">${esc(T('More adventures', 'Thêm phiêu lưu'))}</button><div class="adv-more" hidden>` : famLog) + sideHTML() + (game.coop ? game.coop.html() : '') + (game.chests ? game.chests.html(p) : '') + `<h3>${T('Main adventure', 'Cuộc phiêu lưu chính')}</h3><ol class="quests">${QUESTS.map(q => { const done = !!p.quests[q.id] || (q.check && q.check(p)); return `<li class="${done ? 'done' : q === next ? 'now' : ''}"><span>${done ? '✅' : q.icon}</span>${esc(q.title())}</li>`; }).join('')}</ol>
      <p class="note">✨ ${T('Shrines solved', 'Đền đã giải')}: ${Object.keys(p.shrines).length}/12 · 🗼 ${T('Towers', 'Tháp')}: ${Object.keys(p.towers).length}/4 · 🍳 ${T('Recipes', 'Công thức')}: ${Object.keys(p.dishes).length}/${RECIPES.length}</p>
      <h3>🍳 ${T('Cooking recipes', 'Sổ công thức nấu ăn')}</h3><div class="recipes">${RECIPES.map(r => { const known = p.dishes[r.id] != null; return `<div class="rec ${known ? '' : 'unk'}"><span>${known ? r.icon : '❔'}</span><small>${known ? esc(r.name()) : recNeed(r)}</small></div>`; }).join('')}</div>${advTop ? '</div>' : ''}`;
    if (advTop) {
      const more = body.querySelector('.adv-more'), mb = body.querySelector('.adv-morebtn');
      mb.onclick = () => { more.hidden = !more.hidden; mb.setAttribute('aria-expanded', String(!more.hidden)); };
      body.querySelector('[data-advopen]').onclick = () => { close(); game.adventure.openWindow(i); };
    }
    body.querySelectorAll('[data-follow]').forEach(b => b.onclick = () => { p.follow = p.follow === b.dataset.follow ? null : b.dataset.follow; saveProfiles(); SFX.ok(); game.checkQuests && game.checkQuests(hero); draw(); });
    game.parents && game.parents.bindLog(body, hero, draw); // (round S) a grown-up holds ✓ on a family mission
  }
  const drawAlbum = albumTab(game, i, hero, p, m, close, savePhoto); // (v1.07) the Album tab lives in js/ui/pad-album.ts
  function drawGames(body) {
    body.innerHTML = `<p class="note">${T('Play any game you have already found again. Every win makes the next one a little harder.', 'Chơi lại các trò con đã tìm thấy. Mỗi lần thắng, trò chơi sẽ khó hơn một chút.')}</p><div class="gamelist"></div>`;
    const list = body.querySelector('.gamelist');
    const found = new Set([...SHRINES.filter(s => p.shrines[s.id]).map(s => s.game), ...Object.keys(p.levels)]);
    (Object.values(GAMES) as { id: string; icon: string; name: () => string }[]).forEach(g => {
      const ok = found.has(g.id);
      const b = el('button', 'gcard' + (ok ? '' : ' locked'), `<span>${ok ? g.icon : '🔒'}</span><b>${esc(ok ? g.name() : '???')}</b>${ok ? `<small>${T('Level', 'Cấp')} ${p.levels[g.id] || 1}</small>` : ''}`);
      if (ok) b.onclick = () => { close(); game.playGame(i, g.id, 'pad'); }; // (r79 point 7: closing the game comes back here)
      list.appendChild(b);
    });
  }
  // a photo into the device's own Photos (js/photos.js): iPhone/iPad through the share sheet ("Save Image"),
  // Android and computers as a download
  async function savePhoto(src) {
    const how = await saveToDevice(src);
    if (how === 'downloaded') toast(T('Saved to the phone: look in Photos or Gallery (Downloads).', 'Đã lưu vào máy: xem trong Ảnh hoặc Thư viện (Tải về).'));
    if (how === 'failed') toast(T('Could not save the picture on this device.', 'Không lưu được ảnh trên máy này.'));
  }
  // the festival calendar (round R): only a calendar, nothing to visit from it
  function drawCal(body) {
    body.innerHTML = `<div class="fcal">${festCalendarHTML(game)}</div>`;
  }
  function drawCam(body) {
    const howTo = savesByShare() ? T('Then tap “Save to my photos” and choose “Save Image”.', 'Rồi chạm “Lưu vào ảnh của máy” và chọn “Lưu hình ảnh”.') : T('Then tap “Save to my photos”.', 'Rồi chạm “Lưu vào ảnh của máy”.');
    body.innerHTML = `<div class="cam-prev"></div><div class="actions center"><button class="btn primary big" id="snap">📷 ${T('Take picture', 'Chụp ảnh')}</button><button class="btn big" id="toPhone" hidden>📲 ${T('Save to my photos', 'Lưu vào ảnh của máy')}</button></div><p class="note center">${T('Pictures are kept in your Album.', 'Ảnh được giữ trong Bộ sưu tập.')} ${howTo}</p>`;
    let big = null;
    body.querySelector('#snap').onclick = async () => {
      m.style.visibility = 'hidden'; await wait(60);
      const shot = game.snapshot(i); big = game.snapshot(i, 1600, .9); m.style.visibility = '';
      SFX.chime();
      body.querySelector('.cam-prev').innerHTML = `<img src="${shot}" alt="">`;
      body.querySelector('#toPhone').hidden = false;
      p.album.push(shot); if (p.album.length > 12) p.album.shift(); saveProfiles();
      say('Click! What a lovely picture!', 'Tách! Bức ảnh đẹp quá!');
    };
    body.querySelector('#toPhone').onclick = () => { if (big) { SFX.tap(); savePhoto(big); } };
  }
  // Friends redraws only its own page, never the tabs and ✕; while a finger is down it waits (round O, owner: the
  // screen got stuck: it was rebuilt whole as the signal changed, so taps landed on buttons that had just gone)
  function drawFriend(body) {
    let down = false, again: ReturnType<typeof setTimeout> | 0 = 0;
    body.addEventListener('pointerdown', () => { down = true; }, true);
    const onUp = () => { down = false; };
    addEventListener('pointerup', onUp, true);
    const redraw = () => { clearTimeout(again); if (!body.isConnected) return; if (down) { again = setTimeout(redraw, 300); return; } game.drawOnlinePanel(body, redraw); };
    pageCleanups.push(() => { clearTimeout(again); removeEventListener('pointerup', onUp, true); if (game.onNet === redraw) game.onNet = null; });
    game.drawOnlinePanel(body, redraw);
  }
  draw();
  return { close };
}, openPadProperties);
