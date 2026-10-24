// The daily adventure (owner plan, 16 Oct 2026 AEDT, chat C; docs/plans-20261016/CHAT-C-DAILY-ADVENTURE-PROMPT.md;
// the design: docs/ui-redesign-20261016/canvas/Adventure.dc.html and HUD.dc.html). One adventure a day for each child,
// three steps, a chest at the end. The list and the choosing are js/content/adventures.js (unit tested); this is the
// valley side:
//   steps     listen for what already happens: walking into a place (PlayerEnteredVillage), talking to someone or
//             tapping something (InteractionStarted), a game finished (ActivityCompleted; for under-5s a game played
//             is enough: no losing), a dish cooked (G.onCooked). Things to find appear near their spot and wait there
//             until found, like the surprises, so they are never missed.
//   goal card on the game screen (js/hud.js): the step, progress dots, hear-again; a tap opens the window (HUD-4);
//             under the goal row, which stays as it was (owner, 17 Oct AEDT: "show both")
//   window    Grandpa Owl's (or the giver's) bubble, the 3 steps, the chest with the reward, the week stamps and one
//             green "Let's go!" that closes it and shows the way with sparkles (ADV-1 to ADV-6)
//   the end   the chest opens with chat A's confetti and ta-da (js/feel.js), the sticker through chat B's
//             stickers.give(id), the coins fly into the counter; big kids count them first (D12)
//   week      a stamp a day on a card of 7 that only fills up; a full card opens the week chest: a hat or a pet (D10)
//   Owl       remembers yesterday's adventure, never with the child's name (D11)
// Switches: Studio 'adventure' (js/content/releases.js); Grown-ups → Play time: on or off, when a new day starts, Gentle
// or Tricky (a sand timer for 5 and over, a bonus only). Kept in profile.adventure. Loaded by js/hud.js once.
import { THREE, sprite } from './gfx.js';
import { T } from './i18n.js';
import { say, onSpeaking } from './voice.js';
import { SFX } from './audio.js';
import { pic } from './art.js';
import { el, esc, dist2 } from './util.js';
import { modal } from './popups.js';
import * as feel from './feel.js';
import { give as giveSticker } from './stickers.js';
import { BY_ID as STICKERS } from './content/stickers.js';
import { events } from './core/events.js';
import { id as makeId } from './core/ids.js';
import { settings, saveProfiles, farm, saveFarm, reduceMotion } from './state.js';
import { heightAt, roadDist, WATER } from './world.js';
import { anchorOf } from './content/map.js';
import { roadGraph, route } from './wayfind.js';
import { festivalToday, FESTIVALS } from './festivals.js';
import { featureOn } from './custom.js';
import { gameOpen } from './games/frame.js';
import { BY_ID, GIVERS, ADV_LINES, WEEK, WEEKDAYS, TRICKY_SECONDS, TRICKY_BONUS, record, newDay, advance, stamp, openWeekChest, rememberLine,
  stepText, findCount, alsoOf, titleOf, sydneyDay, dayShift, weekday } from './content/adventures.js';

const FEST_NAMES = () => Object.fromEntries(Object.values(FESTIVALS).map(F => [F.id, [F.en, F.vi]]));
const tt = l => T(l[0], l[1]);
const sayL = l => l && say(l[0], l[1]);

export function createAdventure(G) {
  if (G.adventure) return G.adventure;
  const { scene, world } = G;
  let speechBusy = false; onSpeaking(n => { speechBusy = n > 0; });
  const on = () => settings.dailyAdventure !== false && (G.keep ? G.keep('adventure') : featureOn('adventure', true));
  const big = h => h.profile.age === 'big';
  const tricky = h => big(h) && settings.advLevel === 'tricky';   // never for under-5s (ADV-5)
  const pid = h => makeId('player', h.profile.id || 'guest');
  const heroOf = playerId => G.heroes.find(h => pid(h) === playerId) || null;
  const firstDay = new Map();   // (owner: "when the child first plays") the day each child first played this time
  const live = new Map();       // hero -> { things: [...], giveIt, key }
  const pendingSteps = new WeakMap<object, { day: number; id: string; step: number; lines: string[][] }>();
  let lastTap = new Map();      // hero -> { it, t }

  // ---------- today ----------
  let dayMemo = { t: -1e9, mode: '', d: 0 };
  const dayNow = h => {
    const mode = settings.advDay || 'first';
    if (mode === 'first') { const k = h.profile.id || h.profile.name || 'p'; if (!firstDay.has(k)) firstDay.set(k, sydneyDay(Date.now())); return firstDay.get(k); }
    if (dayMemo.mode !== mode || performance.now() - dayMemo.t > 30000) dayMemo = { t: performance.now(), mode, d: sydneyDay(Date.now(), dayShift(mode)) };
    return dayMemo.d;
  };
  const norm = new WeakSet();   // a record is checked and mended once, not every frame
  const rec = p => { if (p.adventure && norm.has(p.adventure)) return p.adventure; const r = record(p); norm.add(r); return r; };
  function today(h) {
    const p = h.profile, r = rec(p), day = dayNow(h);
    if (r.day !== day) {
      let fest = null; try { fest = festivalToday(); } catch (e) { }
      newDay(r, { day, child: p.id || p.name, age: p.age, visited: p.visited, festival: fest });
      saveProfiles(); clearLive(h);
    }
    return r;
  }
  const adv = h => { const r = today(h); return r.id ? BY_ID[r.id] : null; };
  const step = h => { const r = today(h), a = adv(h); return a && !r.done && r.step < 3 ? a.steps[r.step] : null; };

  // ---------- where things are ----------
  function itPos(at) {
    if (!at) return null;
    if (at === 'storyteller') return G.storyteller ? { x: G.storyteller.x, z: G.storyteller.z } : null;
    const list = at.endsWith('*') ? G.interactables.filter(i => String(i.id).startsWith(at.slice(0, -1))) : G.interactables.filter(i => i.id === at);
    const it = list.find(i => Number.isFinite(i.x)); if (it) return { x: it.x, z: it.z, it };
    const a = anchorOf(at); return a ? { x: a[0], z: a[1] } : null;
  }
  const matches = (at, id) => at && id != null && (at.endsWith('*') ? String(id).startsWith(at.slice(0, -1)) : String(id) === at);
  /** where the current step wants the child to go (the way the sparkles show) */
  function stepPos(h) {
    const s = step(h); if (!s) return null;
    if (s.kind === 'go') { const a = anchorOf(s.place); return a ? { x: a[0], z: a[1] } : null; }
    if (s.kind === 'cook') { const pots = G.interactables.filter(i => /^pot\d/.test(i.id)); return pots.sort((a, b) => dist2(a.x, a.z, h.pos.x, h.pos.z) - dist2(b.x, b.z, h.pos.x, h.pos.z))[0] || null; }
    if (s.kind === 'find') { const L = live.get(h); const left = L && L.things.filter(t => !t.got); if (left && left.length) return left.sort((a, b) => dist2(a.x, a.z, h.pos.x, h.pos.z) - dist2(b.x, b.z, h.pos.x, h.pos.z))[0]; }
    if (s.at && s.at.endsWith('*')) { const near = G.interactables.filter(i => matches(s.at, i.id) && Number.isFinite(i.x)).sort((a, b) => dist2(a.x, a.z, h.pos.x, h.pos.z) - dist2(b.x, b.z, h.pos.x, h.pos.z))[0]; if (near) return near; }
    return itPos(s.at);
  }

  // ---------- things to find (they wait where they are until found) ----------
  const okAt = (x, z) => { const r = roadDist(x, z); return r.d > r.road.w / 2 + 1.2 && heightAt(x, z) > WATER + .4; };
  function spotsNear(c, n, seed) {
    const out = [];
    for (let k = 0; k < 160 && out.length < n; k++) {
      const a = seed + k * 2.399, d = 4 + (k % 7) * 1.1, [x, z] = G.clearSpot(c.x + Math.sin(a) * d, c.z + Math.cos(a) * d, .7);
      if (okAt(x, z) && out.every(o => dist2(o[0], o[1], x, z) > 4) && dist2(x, z, c.x, c.z) > 4) out.push([x, z]);
    }
    while (out.length < n) out.push([c.x + Math.sin(out.length * 2.1) * 3, c.z + Math.cos(out.length * 2.1) * 3]);
    return out;
  }
  const glowMat = new THREE.MeshBasicMaterial({ color: '#ffb020', transparent: true, opacity: .45, depthWrite: false });
  function thingMesh(icon) {
    const g = new THREE.Group(), s = sprite(icon, .9); s.position.y = .9; g.add(s);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.45, .7, 20).rotateX(-Math.PI / 2), glowMat); ring.position.y = .06; g.add(ring);   // gold glow (HUD-6)
    g.userData.bob = s; return g;
  }
  function clearLive(h) {
    const L = live.get(h); if (!L) return;
    for (const t of L.things) { scene.remove(t.g); const i = G.interactables.indexOf(t.it); if (i >= 0) G.interactables.splice(i, 1); }
    if (L.giveIt) { const i = G.interactables.indexOf(L.giveIt); if (i >= 0) G.interactables.splice(i, 1); }
    live.delete(h);
  }
  // build what the current step needs in the valley (things to find, the gift spot), once per step
  function sync(h) {
    const r = today(h), s = step(h), key = r.id + ':' + r.step + ':' + h.profile.age;
    const L = live.get(h); if (L && L.key === key) return; clearLive(h);
    if (!s || !on()) return;
    const N = { key, things: [], giveIt: null }; live.set(h, N);
    if (s.kind === 'find') {
      const c = itPos(s.at); if (!c) return;
      const also = alsoOf(s, h.profile.age), n = findCount(s, h.profile.age), want = [...Array(n)].map(() => s.thing).concat(also ? [...Array(also.n)].map(() => also) : []);
      const got = r.got | 0, got2 = r.got2 | 0, spots = spotsNear(c, want.length, (r.day % 13) + r.step);
      want.forEach((th, k) => {
        const isAlso = k >= n; if ((!isAlso && k < got) || (isAlso && k - n < got2)) return;
        const [x, z] = spots[k], g = thingMesh(th.icon); g.position.set(x, heightAt(x, z), z); scene.add(g);
        const t: { x: number; z: number; g: THREE.Group; th: typeof th; also: boolean; got: boolean; it?: { id: string; x: number; z: number; r: number; icon: string; bubble: string; visible: (hero: typeof h) => boolean; label: () => string; act: (hero: typeof h) => void } } = { x, z, g, th, also: isAlso, got: false };
        t.it = { id: 'adv_find', x, z, r: 2.4, icon: th.icon, bubble: th.icon, visible: hh => hh === h && on() && !t.got, label: () => T('Pick up', 'Nhặt') + ' ' + T(th.en, th.vi), act: hh => pickUp(hh, t) };
        G.interactables.push(t.it); N.things.push(t);
      });
    }
    if (s.kind === 'give') {
      const c = itPos(s.at); if (!c) return;
      // in front of the person, on the child's side, so it is the nearest thing to tap there
      const f = () => { const dx = h.pos.x - c.x, dz = h.pos.z - c.z, d = Math.hypot(dx, dz) || 1; return [c.x + dx / d * 1.3, c.z + dz / d * 1.3]; };
      const find = adv(h).steps.find(x => x.kind === 'find'), icon = find ? find.thing.icon : s.icon;
      N.giveIt = { id: 'adv_give', get x() { return f()[0]; }, get z() { return f()[1]; }, r: 3.4, icon, bubble: icon, visible: hh => hh === h && on() && step(h) === s,
        label: () => T(ADV_LINES.giveIt[0], ADV_LINES.giveIt[1]) + ' ' + (find ? T(find.thing.en, find.thing.vi) : ''), act: hh => giveTo(hh) };
      G.interactables.push(N.giveIt);
    }
  }
  function pickUp(h, t) {
    const r = today(h), s = step(h); if (!s || s.kind !== 'find' || t.got) return;
    t.got = true; scene.remove(t.g);
    if (t.also) r.got2 = (r.got2 | 0) + 1; else r.got = (r.got | 0) + 1;
    if (s.bag && !t.also) { h.profile.inv = h.profile.inv || {}; h.profile.inv[s.bag] = (h.profile.inv[s.bag] || 0) + 1; }
    SFX.pop && SFX.pop(r.got + (r.got2 | 0)); G.fx && G.fx(t.x, heightAt(t.x, t.z) + 1.2, t.z, t.th.icon);
    const also = alsoOf(s, h.profile.age), done = r.got >= findCount(s, h.profile.age) && (!also || (r.got2 | 0) >= also.n);
    saveProfiles();
    if (done) { sayL(ADV_LINES.allFound); if (r.timer && Date.now() < r.timer) { G.addCoins && G.addCoins(TRICKY_BONUS); sayL(ADV_LINES.beat); G.toast(h, tt(ADV_LINES.beat)); } r.timer = 0; next(h); }
    else { G.toast(h, `${T(t.th.en, t.th.vi)}: ${t.also ? r.got2 : r.got}`); }
  }
  async function giveTo(h) {
    const a = adv(h), s = step(h); if (!s || s.kind !== 'give') return;
    const find = a.steps.find(x => x.kind === 'find');
    if (big(h) && find) { const ok = await countAsk(h, find.thing.icon, findCount(find, h.profile.age), ADV_LINES.count); if (!ok) return; }
    SFX.ok && SFX.ok(); next(h);
  }

  // ---------- big kids count (D12): never a loss; a wrong number is a friendly boing and try again ----------
  function countAsk(h, icon, n, line) {
    return new Promise(res => {
      const opts = [...new Set([n, n - 1, n + 1].filter(x => x > 0))].sort(() => Math.random() - .5);
      const m = modal('advwin advcount', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>${esc(tt(line))}</h2>
        <div class="adv-pile">${[...Array(n)].map(() => pic(icon)).join('')}</div><div class="adv-nums">${opts.map(k => `<button class="adv-num" data-k="${k}">${k}</button>`).join('')}</div>`);
      const was = G.paused; G.paused = true; sayL(line);
      const close = ok => { G.paused = was; m.close(); res(ok); };
      m.querySelector('.x').onclick = () => close(false);
      m.querySelectorAll('.adv-num').forEach(b => b.onclick = () => { if (+b.dataset.k === n) { SFX.ok && SFX.ok(); close(true); } else { feel.nope(b); sayL(ADV_LINES.tryCount); } });
    });
  }

  // ---------- steps move on ----------
  function next(h) {
    const r = today(h), a = adv(h); if (!a || r.done) return;
    const all = advance(r); saveProfiles(); clearLive(h); stopTrail(h);
    if (all) { finish(h); return; }
    const s = a.steps[r.step], lines = [stepText(s, h.profile.age)];
    if (tricky(h) && s.kind === 'find') { r.timer = Date.now() + TRICKY_SECONDS * 1000; lines.push(ADV_LINES.hurry); }
    pendingSteps.set(h, { day: r.day, id: r.id, step: r.step, lines });
    sync(h); checkHere(h);
  }
  // a "go" step done already (the child is there), a talk to the one they are next to
  function checkHere(h) {
    const s = step(h); if (!s || s.kind !== 'go') return;
    const i = G.heroes.indexOf(h); if (G.regionOf && G.regionOf[i] === s.place) next(h);
  }
  events.on('PlayerEnteredVillage', e => { const h = heroOf(e.playerId), s = h && on() && step(h); if (s && s.kind === 'go' && e.villageId === makeId('place', s.place)) next(h); });
  events.on('InteractionStarted', e => {
    const h = heroOf(e.playerId); if (!h || !on()) return;
    lastTap.set(h, { it: e.it, t: Date.now() });
    const s = step(h); if (s && s.kind === 'talk' && matches(s.at, e.it)) setTimeout(() => next(h), 400);
  });
  const started = new Map();
  events.on('ActivityStarted', e => { for (const p of e.players || []) { const h = heroOf(p); if (h) started.set(h, { id: e.activityId, t: Date.now(), tap: lastTap.get(h) }); } });
  const played = (e, won) => {
    for (const p of e.players || G.heroes.map(pid)) {
      const h = heroOf(p); if (!h || !on()) continue;
      const st = started.get(h), s = step(h); if (!st || st.id !== e.activityId || !s || s.kind !== 'play') continue;
      const tap = st.tap; if (!tap || !matches(s.at, tap.it) || st.t - tap.t > 120000) continue;
      // under-5s: playing it is enough (no losing, ADV-5); 5 and over finish the game
      if (won || (!big(h) && Date.now() - st.t > 15000)) next(h);
    }
  };
  events.on('ActivityCompleted', e => played(e, true));
  events.on('ActivityAbandoned', e => { if (e.reason === 'level') return; const st = [...started.entries()].find(([, v]) => v.id === e.activityId); played({ ...e, players: st ? [pid(st[0])] : [] }, false); });
  { const prev = G.onCooked; G.onCooked = (h, rc) => { if (prev) prev(h, rc); const s = h && on() && step(h); if (s && s.kind === 'cook') next(h); }; }

  // the chest waits until the child is free: no game, film, story, speech box or other window open
  const busy = () => speechBusy || G.paused || gameOpen() || !!document.querySelector('.dialog, .chatbox, .modal, .reward, .howto, .theatre, .storybook, .songs, .resttime, .dancebreak, .bedtime');
  const waitFree = () => new Promise<void>(res => { const t = () => busy() ? setTimeout(t, 400) : res(); t(); });
  // ---------- the end: the chest (D6), the stamp and the week chest (D10) ----------
  async function finish(h) {
    const r = today(h), a = adv(h), p = h.profile, full = stamp(r, r.day); saveProfiles();
    G.tried && G.tried(h, 'adventure');
    await waitFree();
    sayL(ADV_LINES.done);
    await chest(h, a);
    if (full) { await waitFree(); await weekChest(h); }
    sayL(ADV_LINES.doneToday);
    void p;
  }
  // the prize, in one place (owner, 17 Oct AEDT): the sticker through chat B's stickers.give(id) (its effect flies it to
  // the Bag), the coins into the shared purse (js/hud.js flies them into the counter with chat A's feel.reward). A
  // sticker the child already has still flies, so a prize is never silent. No sounds or confetti of our own.
  function giveReward(h, reward, from) {
    let got = null; if (reward.sticker) try { got = giveSticker(reward.sticker, h, { from }); } catch (e) { console.warn('adventure sticker', e); }
    if (reward.sticker && (!got || (!got.first && !got.shiny))) { const H = G.huds && G.huds[G.heroes.indexOf(h)]; feel.reward('sticker', from || null, H ? H.q('.dk.bag') : null); }
    if (reward.coins && G.addCoins) G.addCoins(reward.coins);
    return got;
  }
  function chest(h, a) {
    return new Promise<void>(res => {
      const st = STICKERS[a.reward.sticker], little = !big(h);
      const m = modal('advwin advchest', `<h2>${esc(tt(titleOf(a, FEST_NAMES())))}</h2><div class="adv-bigchest shut">${pic('🧰')}</div>
        <div class="adv-prize" hidden><span class="adv-stk">${pic(st ? st.icon : '⭐')}</span><b>${esc(st ? T(st.en, st.vi) : '')}</b></div>
        <div class="adv-coins" hidden>${[...Array(a.reward.coins)].map((_, k) => `<button class="adv-coin" data-k="${k}" aria-label="${T('Coin', 'Đồng xu')}">${pic('🪙')}<i></i></button>`).join('')}</div>
        <p class="adv-countline" hidden>${esc(tt(ADV_LINES.countCoins))}</p><button class="adv-go" hidden>${esc(T('Hooray!', 'Hoan hô!'))}</button>`);
      const was = G.paused; G.paused = true;
      const box = m.querySelector('.adv-bigchest'), go = m.querySelector('.adv-go'), coins = m.querySelector('.adv-coins');
      const done = () => { G.paused = was; m.close(); res(); };
      const pay = () => { giveReward(h, { coins: a.reward.coins }, coins); go.hidden = false; };
      let opened = false;
      const open = () => {
        if (opened) return; opened = true; box.classList.remove('shut'); box.classList.add('open');
        feel.celebrate({ little });
        const prize = m.querySelector('.adv-prize'); prize.hidden = false;
        giveReward(h, { sticker: a.reward.sticker }, prize.querySelector('.adv-stk'));
        coins.hidden = false;
        if (little) { coins.classList.add('auto'); setTimeout(pay, 700); return; }
        // 5 and over count the coins: one tap each, the number on it (D12)
        m.querySelector('.adv-countline').hidden = false; sayL(ADV_LINES.countCoins);
        let n = 0; coins.querySelectorAll('.adv-coin').forEach(b => b.onclick = () => { if (b.classList.contains('on')) return; b.classList.add('on'); b.querySelector('i').textContent = ++n; SFX.pop && SFX.pop(n); if (n === a.reward.coins) pay(); });
      };
      box.onclick = open; setTimeout(open, 900);
      go.onclick = done;
    });
  }
  function weekChest(h) {
    const p = h.profile, r = rec(p), pet = p.lanterns && p.lanterns.pet;
    const prize = openWeekChest(r, { hats: (pet && pet.hats) || [], pets: (p.pets || []).map(x => x.kind).concat((farm.petYard || []).map(x => x.kind)) });
    if (!prize) return Promise.resolve();
    if ('hat' in prize && prize.hat) { const L = p.lanterns = p.lanterns || {}, s = L.pet = L.pet || {}; s.hats = s.hats || []; if (!s.hats.includes(prize.hat)) s.hats.push(prize.hat); s.hat = prize.hat; G.kidplay && G.kidplay.refresh && G.kidplay.refresh(); }
    else if ('pet' in prize && prize.pet) { p.pets = Array.isArray(p.pets) ? p.pets : []; if (p.pets.length < 2) p.pets.push({ kind: prize.pet, name: '' }); else { farm.petYard = farm.petYard || []; farm.petYard.push({ kind: prize.pet, name: '' }); saveFarm(); } G.pets && G.pets.sync && G.pets.sync(); }
    else if ('coins' in prize && prize.coins) G.addCoins && G.addCoins(prize.coins);
    saveProfiles();
    return new Promise<void>(res => {
      const m = modal('advwin advchest week', `<h2>${esc(tt(ADV_LINES.weekChest))}</h2><div class="adv-bigchest open">${pic('🧰')}</div><div class="adv-prize"><span class="adv-stk">${pic(prize.icon)}</span><b>${esc(T(prize.en, prize.vi))}</b></div><button class="adv-go">${esc(T('Hooray!', 'Hoan hô!'))}</button>`);
      const was = G.paused; G.paused = true; feel.celebrate({ little: !big(h) }); sayL(ADV_LINES.weekChest);
      m.querySelector('.adv-go').onclick = () => { G.paused = was; m.close(); res(); };
    });
  }

  // ---------- the way (ADV-6): sparkles along the roads to where the step is ----------
  const trails = new Map(); let graph = null;
  const pool = [...Array(24)].map(() => { const s = sprite('✨', 1.1); s.visible = false; scene.add(s); return s; });
  function stopTrail(h = undefined) {
    if (h) { const tr = trails.get(h); if (tr && tr.walk && !h.goalAct) h.goal = null; trails.delete(h); }
    else { for (const [hh, tr] of trails) if (tr && tr.walk && !hh.goalAct) hh.goal = null; trails.clear(); }
    if (!trails.size) pool.forEach(s => { s.visible = false; });
  }
  function stepTarget(h) {
    const s = step(h), t = stepPos(h); if (!s || !t) return null;
    if (s.kind === 'find') {
      const L = live.get(h), left = L && L.things.filter(x => !x.got);
      const th = left && left.sort((a, b) => dist2(a.x, a.z, h.pos.x, h.pos.z) - dist2(b.x, b.z, h.pos.x, h.pos.z))[0];
      return th && th.it ? th.it : null;
    }
    if (s.kind === 'give') {
      const L = live.get(h);
      return L && L.giveIt ? L.giveIt : null;
    }
    if (s.at) {
      return G.interactables.filter(it => matches(s.at, it.id) && Number.isFinite(it.x) && (!it.visible || it.visible(h))).sort((a, b) => dist2(a.x, a.z, t.x, t.z) - dist2(b.x, b.z, t.x, t.z))[0] || null;
    }
    return null;
  }
  function showWay(h, walk = false) {
    const t = stepPos(h); if (!t) return false;
    graph = graph || roadGraph(G.PLACES || []);
    let r = null; try { r = route(graph, h.pos.x, h.pos.z, t.x, t.z); } catch (e) { }
    const pts = r ? r.pts : [...Array(Math.max(2, Math.ceil(Math.hypot(t.x - h.pos.x, t.z - h.pos.z) / 4)))].map((_, k, A) => [h.pos.x + (t.x - h.pos.x) * k / (A.length - 1), h.pos.z + (t.z - h.pos.z) * k / (A.length - 1)]);
    trails.set(h, { t, pts, i: 0, key: today(h).step, walk });
    if (walk) { const wp = pts[Math.min(pts.length - 1, 2)] || [t.x, t.z]; h.goal = { x: wp[0], z: wp[1] }; }
    SFX.chime && SFX.chime(); return true;
  }
  function goToStep(i = 0) {
    const h = G.heroes[i] || G.heroes[0]; if (!h || !on()) return false;
    const r = today(h), s = step(h); if (!s || r.done) return false;
    sync(h); showWay(h, true); sayL(stepText(s, h.profile.age));
    const t = stepPos(h); if (!t) return false;
    if (G.closePopups) G.closePopups();
    if (h.indoors && G.exitHouse) G.exitHouse(h);
    if (h.riding && h.dismount) h.dismount();
    const d = Math.hypot(t.x - h.pos.x, t.z - h.pos.z);
    if (d > 45 && G.travel) G.travel(h, t.x, t.z);
    else if (G.blocked && G.landBy && G.blocked(h.pos.x, h.pos.z, t.x, t.z)) { const [lx, lz] = G.landBy(t.x, t.z, 3); h.place(lx, lz); }
    const target = stepTarget(h);
    if (target && G.goAndDo) G.goAndDo(h, target);
    else h.goal = { x: t.x, z: t.z };
    return true;
  }

  // ---------- the window (D5) ----------
  function dots(h) {
    const r = today(h);
    return [0, 1, 2].map(k => r.done || k < r.step ? 'done' : k === r.step ? 'now' : 'todo');
  }
  function stepsHTML(h) {
    const a = adv(h), r = today(h), st = dots(h);
    return a.steps.map((s, k) => {
      const [en, vi] = stepText(s, h.profile.age), cls = st[k];
      let extra = '';
      if (s.kind === 'find') {
        const n = findCount(s, h.profile.age), also = alsoOf(s, h.profile.age), got = cls === 'done' ? n : cls === 'now' ? r.got | 0 : 0, got2 = cls === 'done' && also ? also.n : cls === 'now' ? r.got2 | 0 : 0;
        extra = `<span class="adv-found">${[...Array(n)].map((_, j) => `<i class="${j < got ? 'have' : 'miss'}">${pic(s.thing.icon)}</i>`).join('')}${also ? [...Array(also.n)].map((_, j) => `<i class="${j < got2 ? 'have' : 'miss'}">${pic(also.icon)}</i>`).join('') : ''}</span>`;
      }
      return `${k ? '<div class="adv-line"></div>' : ''}<div class="adv-step ${cls}"><span class="adv-dot">${cls === 'done' ? '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 12l5 5 9-10" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>' : k + 1}</span><span class="adv-st"><span class="adv-pic">${pic(s.icon)}</span><span class="adv-tx"><b>${esc(T(en, vi))}</b>${extra}</span>${cls === 'now' ? `<button class="adv-step-go" type="button" aria-label="${esc(T('Go', 'Đi'))}">▶ ${esc(T('Go', 'Đi'))}</button>` : ''}</span></div>`;
    }).join('');
  }
  function weekHTML(h) {
    const r = today(h), today_ = r.day, stamps = r.stamps.slice();
    return [...Array(WEEK)].map((_, k) => {
      const d = stamps[k];
      if (d != null) return `<div class="adv-stamp got"><span>${pic('⭐')}</span>${esc(T(...WEEKDAYS[weekday(d)]))}</div>`;
      const now = k === stamps.length && !r.done;
      return `<div class="adv-stamp ${now ? 'now' : ''}"><span></span>${now ? esc(T(...WEEKDAYS[weekday(today_)])) : '&nbsp;'}</div>`;
    }).join('');
  }
  function openWindow(i = 0) {
    const h = G.heroes[i] || G.heroes[0]; if (!h || !on()) return null;
    const a = adv(h), r = today(h); if (!a) return null;
    const g = GIVERS[a.giver] || GIVERS.owl, st = STICKERS[a.reward.sticker];
    const m = modal('advwin', `<div class="adv-head"><h2>${esc(tt(ADV_LINES.title))}</h2><button class="x" aria-label="${T('Close', 'Đóng')}">✕</button></div>
      <div class="adv-giver"><span class="adv-face" aria-label="${esc(T(g.en, g.vi))}">${pic(g.icon)}</span><button class="adv-bubble" aria-label="${esc(tt(ADV_LINES.hear))}"><small>${esc(T(g.en, g.vi))}</small>${esc(tt(a.say))}</button></div>
      <section class="adv-steps">${stepsHTML(h)}</section>
      <section class="adv-chestrow"><span class="adv-chesticon">${pic('🧰')}</span><span class="adv-cx"><b>${esc(tt(ADV_LINES.chest))}</b><small>${esc(tt(ADV_LINES.chestSub))}</small></span><span class="adv-rew">${pic(st ? st.icon : '⭐')}${pic('🪙')}<b>${a.reward.coins}</b></span></section>
      <section class="adv-week" aria-label="${esc(tt(ADV_LINES.stamps))}">${weekHTML(h)}</section>
      <button class="adv-go" data-main>${esc(r.done ? T('All done today!', 'Hôm nay xong rồi!') : tt(ADV_LINES.go))}</button>`);
    const was = G.paused; G.paused = true; r.started = true; saveProfiles();
    sayL(r.done ? ADV_LINES.doneToday : a.say);
    const close = () => { G.paused = was; m.close(); };
    m.querySelector('.x').onclick = close;
    m.querySelector('.adv-bubble').onclick = () => sayL(a.say);
    const stepGo = m.querySelector('.adv-step-go'); if (stepGo instanceof HTMLElement) stepGo.onclick = () => { close(); if (!r.done) goToStep(i); };
    m.querySelector('.adv-go').onclick = () => { close(); if (r.done) return; sync(h); if (showWay(h, true)) sayL(stepText(step(h), h.profile.age)); };
    return m;
  }

  // ---------- the goal card (D4, HUD-4), inside js/hud.js's goal row ----------
  function hud(H) {
    const now = performance.now(); if (H._advT && now - H._advT < 250) return; H._advT = now;   // four times a second is plenty
    const h = H.hero, q = H.q('.quest'); if (!q) return;
    let card = H._adv; if (!card) {
      card = H._adv = el('div', 'advcard', `<button class="adv-open"><span class="adv-badge"></span><span class="adv-cx"><b class="adv-text"></b><span class="adv-dots"></span></span></button><button class="adv-walk" aria-label="${T('Go', 'Đi')}">▶ <span class="adv-wl">${T('Go', 'Đi')}</span></button><button class="adv-hear" aria-label="${T('Hear it again', 'Nghe lại')}"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#fff"/><path d="M17 8a5 5 0 0 1 0 8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg></button>`);
      q.appendChild(card);   // (owner, 17 Oct AEDT: "show both") under the goal row, which stays as it was
      card.querySelector('.adv-open').onclick = () => openWindow(H.i);
      card.querySelector('.adv-walk').onclick = e => { e.stopPropagation(); goToStep(H.i); };
      card.querySelector('.adv-hear').onclick = e => { e.stopPropagation(); const s = step(h), a = adv(h); if (s) sayL(stepText(s, h.profile.age)); else if (a) sayL(ADV_LINES.doneToday); };
    }
    const r = on() ? today(h) : null, a = r && r.id ? BY_ID[r.id] : null, show = !!(a && !r.done);
    // (owner, 17 Oct AEDT: "show both") the goal row stays, with its family mission line, so the card shows only the adventure
    const s = show ? a.steps[r.step] : null, txt = s ? tt(stepText(s, h.profile.age)) : '';
    const left = s && s.kind === 'find' ? ` ${r.got | 0}/${findCount(s, h.profile.age)}` : '';
    const timer = s && r.timer && r.timer > Date.now() ? ` · ${Math.ceil((r.timer - Date.now()) / 1000)}s` : '';
    const key = [show, txt, left, timer, dots(h).join(), T('e', 'v')].join('|');
    if (card._key === key) return; card._key = key;
    q.classList.toggle('adv', show); card.hidden = !show; H.root.classList.toggle('adv-on', show);
    if (!show) { H.fitQuest?.(); return; }   // (r80) the goal row's width changed: it stays clear of the corners
    card.querySelector('.adv-badge').innerHTML = pic((GIVERS[a.giver] || GIVERS.owl).icon);
    card.querySelector('.adv-text').textContent = txt + left + timer;
    card.querySelector('.adv-dots').innerHTML = dots(h).map(d => `<i class="${d}"></i>`).join('');
    card.querySelector('.adv-open').setAttribute('aria-label', tt(ADV_LINES.title));
    const wl = card.querySelector('.adv-wl'), wb = card.querySelector('.adv-walk'); if (wl) wl.textContent = T('Go', 'Đi'); if (wb) wb.setAttribute('aria-label', T('Go', 'Đi'));
    H.fitQuest?.();
  }

  // ---------- every frame: the things bob, the way moves on, the day turns, Owl remembers ----------
  let look = 0;
  world.updaters.push((dt, t) => {
    if (!G.heroes.length) return;
    if (!on()) { if (live.size) [...live.keys()].forEach(clearLive); if (trails.size) stopTrail(); return; }
    for (const L of live.values()) for (const th of L.things) if (!th.got && th.g.userData.bob) th.g.userData.bob.position.y = .9 + (reduceMotion() ? 0 : Math.sin(t * 2.4 + th.x) * .14);
    // the sparkles: a stretch at a time ahead of the child, gone on arrival or when the step changes
    let k0 = 0;
    for (const [h, tr] of trails) {
      if (tr.key !== today(h).step) { trails.delete(h); continue; }
      if (Math.hypot(h.pos.x - tr.t.x, h.pos.z - tr.t.z) < 9) { if (tr.walk && !G.paused) { const target = stepTarget(h); if (target && G.goAndDo) G.goAndDo(h, target); else h.goal = { x: tr.t.x, z: tr.t.z }; } trails.delete(h); continue; }
      let bi = tr.i, bd = 1e9; for (let k = Math.max(0, tr.i - 4); k < Math.min(tr.pts.length, tr.i + 40); k++) { const d = Math.hypot(tr.pts[k][0] - h.pos.x, tr.pts[k][1] - h.pos.z); if (d < bd) { bd = d; bi = k; } }
      if (bd > 25) { const w = tr.walk; trails.delete(h); showWay(h, w); continue; }
      tr.i = bi;
      if (tr.walk && !G.paused) { const hi = G.heroes.indexOf(h), pad = G.pads && G.pads[hi]; if (pad && Math.hypot(pad.mx || 0, pad.mz || 0) > .3) tr.walk = false; else if (!h.goalAct) { const wp = tr.pts[Math.min(tr.pts.length - 1, tr.i + 3)] || [tr.t.x, tr.t.z]; h.goal = { x: wp[0], z: wp[1] }; } }
      const share = Math.floor(pool.length / Math.max(1, trails.size));
      for (let k = 0; k < share; k++) { const p = tr.pts[tr.i + 1 + k], s = pool[k0 + k]; s.visible = !!p; if (p) s.position.set(p[0], heightAt(p[0], p[1]) + .7 + (reduceMotion() ? 0 : Math.sin(t * 4 + k * .7) * .15), p[1]); }
      k0 += share;
    }
    for (let k = k0; k < pool.length; k++) pool[k].visible = false;
    const now = performance.now(); if (now - look < 1000) return; look = now;
    for (const h of G.heroes) {
      const r = today(h); sync(h); checkHere(h);
      // Automatic adventure clues must not interrupt a child's current conversation or game.
      if (busy()) continue;
      const pending = pendingSteps.get(h);
      if (pending) {
        if (pending.day === r.day && pending.id === r.id && pending.step === r.step && !r.done && pending.lines.length) {
          const line = pending.lines.shift(); if (!pending.lines.length) pendingSteps.delete(h);
          G.toast(h, '✨ ' + tt(line)); sayL(line); continue;
        }
        pendingSteps.delete(h);
      }
      const line = rememberLine(r, r.day);
      if (line) { r.told = r.day; saveProfiles(); G.toast(h, tt(line)); sayL(line); }
    }
  });

  /** the Adventures tab's card (D7): today's adventure on top; the older lists go behind "More adventures" */
  function logHTML(p) {
    const h = G.heroes.find(x => x.profile === p) || G.heroes[0]; if (!h || !on()) return '';
    const a = adv(h), r = today(h); if (!a) return '';
    const g = GIVERS[a.giver] || GIVERS.owl, st = dots(h);
    return `<div class="adv-log"><button class="adv-logcard" data-advopen><span class="adv-face">${pic(g.icon)}</span><span class="adv-cx"><b>${esc(tt(ADV_LINES.title))}: ${esc(tt(titleOf(a, FEST_NAMES())))}</b>
      <span class="adv-dots">${st.map(d => `<i class="${d}"></i>`).join('')}</span><small>${esc(r.done ? tt(ADV_LINES.doneToday) : tt(stepText(a.steps[r.step], h.profile.age)))}</small></span></button>
      <div class="adv-week adv-mini">${weekHTML(h)}</div></div>`;
  }

  /** (tests and Grown-ups) give this child a chosen adventure for today, from its first step */
  function force(i, id) { const h = G.heroes[i] || G.heroes[0]; if (!h || !BY_ID[id]) return false; const r = today(h); clearLive(h); stopTrail(h); Object.assign(r, { id, step: 0, got: 0, got2: 0, done: false, timer: 0 }); saveProfiles(); sync(h); checkHere(h); return true; }
  G.adventure = { on, today, adv, step, openWindow, goToStep, force, giveReward, where: itPos, hud, logHTML, showWay, stepPos, sync, next, finish, clearLive,
    get trails() { return trails; }, live: h => live.get(h), lines: () => import('./content/adventures.js').then(m => m.spokenLines()) };
  return G.adventure;
}
