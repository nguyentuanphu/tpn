import type { StoryChapter, StoryStep, StoryCurrent, StoryActions, LanternProgress } from '../types/story.js';
import type { Profile } from '../types/save.js';
// Đèn Lồng Thung Lũng, the main story (round R): runs the chapters in js/content/chapters.js. The child's goal is the
// first step not yet done in the first chapter Studio has released (switches story_<chapter>); when none is open the
// valley's old adventure list (js/data.js QUESTS) is the goal as before. Progress: profile.lanterns =
// { companion, done: { stepId: true }, chapters: { ch1: true }, carrying }.
// Chapter 1 builds Làng Sen's đình (under soft mist until its lantern is hung, then lit) and drops the lantern among the
// lotus leaves by the pond. Each later chapter brings its own places file (LATER below), loaded once a child playing has
// found the chapter before's lantern; its file also brings the chapter's steps (only chapter 1's are in chapters.js). Chapter 2 (Hà Nội) has its places built by js/content/chapter2hanoi.js: the Thê Húc bridge by
// Hồ Gươm lights up red, and a Trung Thu parade walks round the lake. Each chapter's landmark, lantern spot, rope and
// lights are in places[chapter id]. Steps marked big are only for big kids (5 to 8); an under-5 skips them. Chapter 2's
// code and words are loaded only once a child playing has found chapter 1's lantern (PERF-001: the start-up download
// stays small).
import { THREE, glow } from './gfx.js';
import { T } from './i18n.js';
import { VILLAGE, heightAt, roadDist, WATER } from './world.js';
import { featureOn, keptOn, markTried, earlyDays, isPeek } from './custom.js';
import { inCalendar, calOpen } from './content/releasecal-core.js';
import { calMoves } from './content/secondset.js';
import { RELEASES } from './content/releases.js';
import { events } from './core/events.js';
import { CHAPTERS, STORY_TALES, COMPANIONS, STORY_LINES } from './content/chapters.js';
import { buildDinh, buildLantern } from './dinh.js';
import { createCompanions } from './companion.js';
import { openSpot } from './openspot.js';
import { pad, frames, slot, QUIT } from './handpad.js';

const V = VILLAGE;
// (each chapter's switch starts as its default in js/content/releases.js: chapter 2 is off until an admin switches it on or
// schedules it in Studio, owner 10 Oct)
// (batch rollout) a chapter held back or switched off stays open for a child who already played some of it
// (v1.08b story) chapters in the release calendar (4, 5 and the finale) also wait for their day there (testers 7 days early)
const released = ch => keptOn('story_' + ch.id, undefined, (RELEASES.find(r => r.id === 'story_' + ch.id) || { def: true }).def)
  && (!inCalendar('chapter:' + ch.id) || calOpen('chapter:' + ch.id, calMoves(), new Date(), earlyDays()) || isPeek('story_' + ch.id));
const st = (p: Profile): LanternProgress => { const s = p.lanterns = p.lanterns && typeof p.lanterns === 'object' ? p.lanterns : {}; s.done = s.done || {}; s.chapters = s.chapters || {}; return s; };
const unnamed = s => String(s).replace(/,?\s*\{name\}/g, '');
const big = p => p.age === 'big';
const chOf = id => (CHAPTERS.find(c => c.steps.some(s => s.id === id)) || {}).id; // (a step's chapter)
// the game a step waits for: an under-5 plays the one made for them (A11Y-006)
const gamesOf = (p: Profile, s: StoryStep) => (!big(p) && s.gameLittle) || s.game || [];
const fill = (s, p) => String(s).replace(/\{name\}/g, p.name || '').replace(/\{companion\}/g, COMPANIONS[st(p).companion || 'firefly'].name);

export function createLanterns(G, { dialog, say, reward, save, openTheatre }) {
  let choicePlan: (() => Element | null | undefined) | null = null;
  const plan = (next: NonNullable<typeof choicePlan>) => { choicePlan = next; return () => { if (choicePlan === next) choicePlan = null; }; };
  const mods: Record<string, ReturnType<typeof import('./content/chapter2hanoi.js').create>> = {}, loadingCh = {}; // (each later chapter's places, built when needed: loadCh below)
  const { scene, world } = G;
  const stepDone = (p, s) => {
    const L = st(p);
    if (L.done[s.id]) return true;
    if (s.big && !big(p)) return true; // (fewer steps for under-5s)
    if (s.owl) return !!L.companion;
    return false;
  };
  // the step a child is on (null when every released chapter is done, or the next chapter is not out yet)
  function current(p: Profile): StoryCurrent | null {
    for (const ch of CHAPTERS) {
      if (!released(ch)) return null;
      for (const s of ch.steps) if (!stepDone(p, s)) return { ch, s };
    }
    return null;
  }
  const isOn = (p, id) => { const c = current(p); return !!c && c.s.id === id; };
  const finish = (h, id) => {
    const p = h.profile, L = st(p); if (L.done[id]) return; L.done[id] = true; save();
    G.checkQuests && G.checkQuests(h);
  };

  // ---------- where things are ----------
  // (never on a road, a building or water)
  const free = (x, z, r) => heightAt(x, z) > WATER + .4 && !world.colliders.some(c => c.r > 0 && c.top == null && Math.hypot(c.x - x, c.z - z) < c.r + r)
    && !world.boxes.some(b => x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) && (d => !d.road || d.d > d.road.w / 2 + r)(roadDist(x, z));
  // the đình: the flat spot with the most room round it, in or at the edge of the village (Làng Sen is full of houses
  // and stalls, and many real đình stand at the village edge); a yard in front to stand and look at it
  const spot = openSpot(G, { cx: V.x, cz: V.z, rmax: V.r + 10, need: 6, flatR: 6, want: 10 });
  const dinhAt = spot ? [spot.x, spot.z] : [V.x + 14, V.z - 14];
  const dinh = buildDinh(), dy = heightAt(dinhAt[0], dinhAt[1]);
  const face = Math.atan2(V.x - dinhAt[0], V.z - dinhAt[1]); // the doors look towards the village middle
  dinh.position.set(dinhAt[0], dy, dinhAt[1]); dinh.rotation.y = face; scene.add(dinh);
  world.boxes.push({ x0: dinhAt[0] - 4.4, x1: dinhAt[0] + 4.4, z0: dinhAt[1] - 4.4, z1: dinhAt[1] + 4.4 });
  const front = [dinhAt[0] + Math.sin(face) * 6, dinhAt[1] + Math.cos(face) * 6];
  // the mist round it, and the lanterns that hang there once it is lit
  const mist = new THREE.Group(); mist.userData.noSolid = true; scene.add(mist); mist.position.copy(dinh.position);
  const mistMat = new THREE.MeshBasicMaterial({ color: '#f4f7fb', transparent: true, opacity: .28, depthWrite: false });
  for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(2.2 + (i % 3) * .6, 12, 8), mistMat); s.position.set(Math.cos(i * 2.4) * 3.4, 1.4 + (i % 3) * 1.2, Math.sin(i * 2.4) * 2.6); s.scale.y = .6; mist.add(s); }
  const lit = new THREE.Group(); lit.userData.noSolid = true; lit.visible = false; dinh.add(lit);
  dinh.userData.hooks.forEach(v => { const l = buildLantern(true); l.position.copy(v); l.scale.setScalar(.9); lit.add(l); });
  const setLit = on => { lit.visible = on; mist.visible = !on; };
  // the lantern among the lotus leaves at the pond's edge
  const pondAt = [V.x - 10, V.z + 4];
  let lanternAt = null;
  for (let k = 0; k < 60 && !lanternAt; k++) { const a = k * .42, x = pondAt[0] + Math.cos(a) * 7.5, z = pondAt[1] + Math.sin(a) * 7.5; if (heightAt(x, z) > WATER + .1 && free(x, z, .6)) lanternAt = [x, z]; }
  lanternAt = lanternAt || [pondAt[0] + 7, pondAt[1]];
  const found = buildLantern(true); found.position.set(lanternAt[0], heightAt(lanternAt[0], lanternAt[1]) + .45, lanternAt[1]); found.rotation.z = .5; found.visible = false; scene.add(found);
  const twinkle = new THREE.Mesh(new THREE.SphereGeometry(.7, 10, 8), glow('#ffcf6a', .25)); twinkle.material.depthWrite = false; found.add(twinkle);

  G.landmarksStory = { dinh: { x: front[0], z: front[1] } }; // (the arrow and the checks)
  const spots = {
    owl: () => G.npcAt && G.npcAt('owl'),
    storyteller: () => G.storyteller && { x: G.storyteller.x, z: G.storyteller.z },
    village: () => ({ x: V.x - V.r + 2, z: V.z }),
    teo: () => G.npcAt && G.npcAt('teo'),
    well: () => (i => i && { x: i.x, z: i.z })(G.interactables.find(i => i.id === 'lv_well')),
    lantern: () => ({ x: lanternAt[0], z: lanternAt[1] }),
    landmark: () => ({ x: front[0], z: front[1] })
  };

  // ---------- something to do on each step (Studio switch storyActions, owner 9 Oct) ----------
  const actions = () => featureOn('storyActions', true);
  const A = (p: Profile): StoryActions => { const L = st(p); L.act = L.act || {}; return L.act; };
  // each chapter's landmark: where the lantern is found, where it is hung (and the rope), its lights, and what follows
  const places = {
    ch1: { front, lanternAt, rope: { x: dinhAt[0] + Math.sin(face) * 3.1, z: dinhAt[1] + Math.cos(face) * 3.1, y0: heightAt(front[0], front[1]) + .5, y1: dinh.position.y + 3 }, paint: on => setLit(on) }
  };
  // the later chapters' places and words: chapter 2 Hà Nội (the Thê Húc bridge; Tèo, Cô Tam and Bà Năm there for Trung
  // Thu; stone turtles; clues), chapter 3 Sydney (Chi, Jack and Ruby; the Opera House; fireworks). [file, its festival film,
  // the step before (its lantern found: then this chapter loads, so its words are there when its first step is told)]
  const LATER = { ch2: [() => import('./content/chapter2hanoi.js'), () => import('./content/chapter2films.js'), 'c1_find'],
    ch3: [() => import('./content/chapter3sydney.js'), () => import('./content/chapter3films.js'), 'c2_find'],
    // (v1.08b story) chapters 4, 5 and the Tết finale, built by the shared kit (js/content/chapterkit.ts)
    ch4: [() => import('./content/chapter4.js'), () => import('./content/kitfilms.js'), 'c3_find'],
    ch5: [() => import('./content/chapter5.js'), () => import('./content/kitfilms.js'), 'c4_find'],
    finale: [() => import('./content/chapterfinale.js'), () => import('./content/kitfilms.js'), 'c5_find'],
    // (v1.08d s2au) Season 2, Australia: chapter 10 follows s2vn's chapter 9 (its lantern found: c9_find)
    ch10: [() => import('./content/chapter10.js'), () => import('./content/s2aufilms.js'), 'c9_find'],
    ch11: [() => import('./content/chapter11.js'), () => import('./content/s2aufilms.js'), 'c10_find'] };
  const loadCh = id => loadingCh[id] || (loadingCh[id] = LATER[id][0]().then(M => {
    const P = mods[id] = M.create(G, { current, isOn, A, st, big, gamesOf, say, save, dialog, reward, actions, plan, finish: (h, id) => finish(h, id), companions: () => companions });
    Object.assign(spots, P.spots); G.landmarksStory[id] = { x: P.front[0], z: P.front[1] }; addButtons(CHAPTERS.find(c => c.id === id));
    places[id] = { front: P.front, lanternAt: P.lanternAt, rope: P.rope, paint: P.paint, after: () => P.startParade(), film: LATER[id][1], revealed: P.revealed };
    for (const rs of CHAPTERS.find(c => c.id === id).steps.filter(s => s.lights)) addCatchers(rs);
    paint();
  }).catch(e => { loadingCh[id] = null; console.warn('chapter', id, e); }));
  const wanted = id => released({ id }) && G.heroes.some(h => st(h.profile).done[LATER[id][2]]);
  const onStreet = (x, z) => Object.values(mods).some(M => M.onStreet && M.onStreet(x, z, 1));
  const catching = (s: StoryStep) => actions() && !!(s.ribbons || s.lights);
  // wind ribbons on the way into the village (chapter 1) and lantern lights on the way to Hà Nội (chapter 2): walk
  // through them or tap them
  const ribbonStep = CHAPTERS.flatMap(c => c.steps).find(s => s.ribbons);
  const ribbons = [], rkey = s => s.lights ? 'rib_' + s.id : 'rib';
  function addCatchers(rs) {
    // (beside the road, never on it: ROAD-004)
    const offRoad = (x, z) => { const d = roadDist(x, z); return !d.road || d.d > d.road.w / 2 + 1.2; };
    const v = spots[rs.at](), okAt = (x, z) => free(x, z, 1.2) && offRoad(x, z) && !onStreet(x, z) && !world.solidAt?.(x, z) && ribbons.every(r => r.s !== rs || Math.hypot(r.x - x, r.z - z) > 3);
    for (let k = 0; k < (rs.ribbons || rs.lights); k++) {
      let at = null;
      for (let j = 0; j < 1200 && !at; j++) { const a = k * 2.1 + j * .7, d = 5 + k * 4 + (j % 7) + Math.max(0, j - 159) / 20, x = v.x + 4 + Math.cos(a) * d, z = v.z + Math.sin(a) * d; if (okAt(x, z)) at = [x, z]; }
      // Never put a required quest target inside a house as a fallback.
      if (!at) throw new Error('No reachable story target: ' + rs.id);
      const g = new THREE.Group(); g.userData.noSolid = true;
      if (rs.lights) { const l = buildLantern(true); l.scale.setScalar(.6); g.add(l); const halo = new THREE.Mesh(new THREE.SphereGeometry(.55, 10, 8), glow('#ffcf6a', .22)); halo.material.depthWrite = false; g.add(halo); }
      else { const colors = ['#ff5a7a', '#ffd23f', '#5fb6ff'];
        for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.22, 1.4), new THREE.MeshBasicMaterial({ color: colors[(k + i) % 3], side: THREE.DoubleSide })); m.position.set((i - 1) * .2, 0, 0); g.add(m); } }
      g.position.set(at[0], heightAt(at[0], at[1]) + 1.3, at[1]); g.visible = false; scene.add(g);
      const r = { s: rs, k, x: at[0], z: at[1], g, id: (rs.lights ? 'story_light' + (rs.id === 'c2_fly' ? '' : '_' + rs.id + '_') : 'story_ribbon') + k }; ribbons.push(r);
      G.interactables.push({ id: r.id, x: r.x, z: r.z, r: 2.2, icon: rs.lights ? '🏮' : '🎀', label: () => rs.lights ? T('Catch the light', 'Bắt đốm sáng') : T('Catch the ribbon', 'Bắt dải lụa'),
        visible: h => actions() && isOn(h.profile, rs.id) && ribbonsLeft(h.profile, rs).includes(r), act: h => catchRibbon(h, r) });
    }
  }
  const ribbonsLeft = (p, s = ribbonStep) => ribbons.filter(r => r.s === s && !(A(p)[rkey(s)] || []).includes(r.k));
  const catchRibbon = (h, r) => {
    const a = A(h.profile), key = rkey(r.s); a[key] = a[key] || []; if (a[key].includes(r.k)) return; a[key].push(r.k); save();
    G.fx && G.fx(r.x, r.g.position.y, r.z, '✨');
    if (!ribbonsLeft(h.profile, r.s).length) { say(...(r.s.lights ? r.s.lightsAll || STORY_LINES.lightsAll : STORY_LINES.ribbonsAll)); finish(h, r.s.id); } else say(...(r.s.lights ? r.s.light || STORY_LINES.light : STORY_LINES.ribbon));
  };
  // (chapter 1's ribbons now; chapter 2's lights come with its places)
  for (const rs of CHAPTERS.flatMap(c => c.steps).filter(s => s.ribbons)) addCatchers(rs);
  // lotus leaves by the pond: the lantern is under one of them (a different one each day)
  const leafStep = CHAPTERS.flatMap(c => c.steps).find(s => s.leaves);
  const leaves = [];
  if (leafStep) {
    const leafMat = new THREE.MeshToonMaterial({ color: '#3f9a4a', side: THREE.DoubleSide });
    for (let k = 0; k < leafStep.leaves; k++) {
      const a = k / leafStep.leaves * Math.PI * 2, x = lanternAt[0] + Math.cos(a) * 1.9, z = lanternAt[1] + Math.sin(a) * 1.9;
      const pivot = new THREE.Group(); pivot.position.set(x, Math.max(heightAt(x, z), WATER) + .06, z); pivot.rotation.y = -a;
      const m = new THREE.Mesh(new THREE.CircleGeometry(.75, 18, .3, Math.PI * 2 - .6), leafMat); m.rotation.x = -Math.PI / 2; m.position.x = .75; pivot.add(m);
      pivot.visible = false; pivot.userData.noSolid = true; scene.add(pivot); leaves.push({ k, x, z, pivot, lift: 0 });
    }
  }
  const dayNo = () => Math.floor((Date.now() + 10 * 3600e3) / 864e5); // (a day in AEST, like js/kidplay.js)
  const rightLeaf = () => dayNo() % Math.max(1, leaves.length);
  const revealed = p => !!A(p).found;
  // the lantern shows once the child has looked in the right place (lotus leaves in chapter 1, clue spots in chapter 2)
  const revealedFor = (p, s) => s.leaves ? revealed(p) : s.clues ? (pl => !!pl && pl.revealed(p))(places[chOf(s.id)]) : true;
  const liftLeaf = (h, L) => {
    const a = A(h.profile); a.lifted = a.lifted || []; if (!a.lifted.includes(L.k)) a.lifted.push(L.k);
    L.lift = 1;
    // (the right leaf is chosen once per child, so a new day never moves it under a leaf already lifted)
    if (a.right == null) a.right = rightLeaf();
    if (L.k === a.right || a.lifted.length >= leaves.length) { a.found = true; say(...STORY_LINES.leafFound); } else { say(...STORY_LINES.leafFrog); G.fx && G.fx(L.x, L.pivot.position.y + .4, L.z, '🐸'); }
    save();
  };
  for (const L of leaves) G.interactables.push({ id: 'story_leaf' + L.k, x: L.x, z: L.z, r: 1.6, icon: '🪷', label: () => T('Lift the leaf', 'Lật lá sen'),
    visible: h => actions() && isOn(h.profile, leafStep.id) && !revealed(h.profile) && !(A(h.profile).lifted || []).includes(L.k), act: h => liftLeaf(h, L) });
  world.updaters.push((dt, t) => {
    for (const r of ribbons) {
      r.g.visible = actions() && G.heroes.some(h => isOn(h.profile, r.s.id) && ribbonsLeft(h.profile, r.s).includes(r));
      if (!r.g.visible) continue;
      if (r.s.lights) r.g.rotation.z = Math.sin(t * 1.5 + r.k) * .15; else { r.g.rotation.y = t * .8 + r.k; r.g.children.forEach((m, i) => { m.rotation.z = Math.sin(t * 3 + i) * .4; }); }
      r.g.position.y = heightAt(r.x, r.z) + 1.3 + Math.sin(t * 2 + r.k) * .2;
      // walking through one catches it
      for (const h of G.heroes) if (isOn(h.profile, r.s.id) && Math.hypot(h.pos.x - r.x, h.pos.z - r.z) < 1.4 && ribbonsLeft(h.profile, r.s).includes(r)) catchRibbon(h, r);
    }
    const anyLeaf = actions() && leafStep && G.heroes.some(h => isOn(h.profile, leafStep.id));
    for (const L of leaves) {
      L.pivot.visible = anyLeaf || L.lift > 0 && anyLeaf;
      const want = G.heroes.some(h => (A(h.profile).lifted || []).includes(L.k) && isOn(h.profile, leafStep.id)) ? 1 : 0;
      L.lift += (want - L.lift) * Math.min(1, dt * 4); L.pivot.rotation.z = L.lift * 1.3;
    }
  });
  // hanging by hand: pull the rope and the lantern rises to its hook
  async function hangByHand(pl) {
    G.paused = false;
    const rope = buildLantern(true), { y0, y1 } = pl.rope; rope.position.set(pl.rope.x, y0, pl.rope.z); scene.add(rope);
    const p = pad(`<p>${T('Pull the rope to lift the lantern up!', 'Kéo dây để đưa đèn lồng lên cao!')}</p><div class="hp-slot" data-hp="rope"><b></b></div>`);
    say(...STORY_LINES.rope);
    const r = slot(p.querySelector('[data-hp=rope]'));
    try { await frames(() => { rope.position.y = y0 + (y1 - y0) * r.v; return r.v > .92; }, p); } finally { p.remove(); scene.remove(rope); }
  }

  // ---------- buttons the story puts in the valley (only for the child on that step) ----------
  // (chapter 1's now; each later chapter's when its file brings its steps: loadCh)
  const addButtons = (ch: StoryChapter) => { for (const s of ch.steps) {
    if (s.talk) {
      // (no spot yet: no position, so the button is never in reach)
      const near = () => { const q = spots[s.at] && spots[s.at](); return q || { x: NaN, z: NaN }; };
      G.interactables.push({ id: 'story_' + s.id, get x() { return near().x + .8; }, get z() { return near().z + .8; }, r: 3, icon: s.icon,
        label: () => T(...s.talk.label), visible: h => isOn(h.profile, s.id),
        act: async h => {
          const p = h.profile; G.paused = true;
          // (shown with the child's name; spoken without it, so the recorded voices can say it)
          // (Studio switch shortTalk) one line instead of a speech, when the step has a short version
          const lines = featureOn('shortTalk', true) && s.talk.short ? s.talk.short : s.talk.lines;
          await dialog(s.talk.who, lines.map(([en, vi]) => [fill(en, p), fill(vi, p), unnamed(en), unnamed(vi)]));
          if (s.tale_id) { let ok = true; try { const { MORE_TALES } = await import('./talesdata.js'); const tl = MORE_TALES.find(x => x.id === s.tale_id); ok = tl ? await openTheatre(tl, { name: p.name }) : true; } finally { G.paused = false; } if (ok) finish(h, s.id); return; }
          G.paused = false; finish(h, s.id);
        } });
    }
    // (chapter 2's places come later: its buttons wait for them)
    const pl = () => places[ch.id];
    // (chapter 2's challenge, job and lesson buttons come with its places: js/content/chapter2hanoi.js)
    if (s.find) G.interactables.push({ id: 'story_' + s.id, get x() { return pl() ? pl().lanternAt[0] : NaN; }, get z() { return pl() ? pl().lanternAt[1] : NaN; }, r: 2.6, icon: '🏮', label: () => T('Pick up the lantern', 'Nhặt đèn lồng lên'), visible: h => !!pl() && isOn(h.profile, s.id) && (!actions() || revealedFor(h.profile, s)),
      act: h => { st(h.profile).carrying = ch.id; say(`You found it! ${COMPANIONS[st(h.profile).companion || 'firefly'].name} will carry the lantern.`, `Tìm thấy rồi! ${COMPANIONS[st(h.profile).companion || 'firefly'].name} sẽ mang đèn lồng giúp con.`); finish(h, s.id); } });
    if (s.hang) G.interactables.push({ id: 'story_' + s.id, get x() { return pl() ? pl().front[0] : NaN; }, get z() { return pl() ? pl().front[1] : NaN; }, r: 3.4, icon: '🏮', label: () => T('Hang the lantern', 'Treo đèn lồng'), visible: h => !!pl() && isOn(h.profile, s.id) && !hanging.has(h.profile),
      act: h => hang(h, ch, s) });
  } };
  CHAPTERS.forEach(addButtons);
  // the village well (and anything else a step waits for): note it when the child uses it
  for (const ch of CHAPTERS) for (const s of ch.steps) if (s.act) {
    const it = G.interactables.find(i => i.id === s.act); if (!it) continue;
    const orig = it.act; it.act = (h, g) => { const r = orig(h, g); if (isOn(h.profile, s.id)) setTimeout(() => finish(h, s.id), 1200); return r; };
  }
  // games: a folk game finished (won) while that is the step
  events.on('ActivityCompleted', e => {
    const gid = String(e.defId || '').split(':').pop();
    for (const h of G.heroes) { const c = current(h.profile); if (c && c.s.game && gamesOf(h.profile, c.s).includes(gid)) finish(h, c.s.id); }
  });

  const hanging = new Set();
  async function hang(h, ch, s) {
    const p = h.profile, L = st(p);
    // (once: the rope panel lets the valley run, so ▶ Go or the action key could start it again)
    if (hanging.has(p)) return; hanging.add(p);
    try { await hangOnce(h, ch, s, p, L); } finally { hanging.delete(p); }
  }
  async function hangOnce(h, ch, s, p, L) {
    G.paused = true;
    // (✕ on the rope panel: nothing is lost, the child can hang it later)
    const pl = places[ch.id];
    if (actions()) try { await hangByHand(pl); } catch (e) { G.paused = false; if (e === QUIT) return; throw e; }
    const tl = STORY_TALES['lantern_' + ch.id];
    if (pl.film) try { await pl.film(); } catch (e) { console.warn('film', e); } // (its festival film is loaded only now)
    if (tl) await openTheatre(storyTale(tl, p), { name: p.name });
    L.carrying = null; L.chapters[ch.id] = true; L.done[s.id] = true; markTried(p, 'story_' + ch.id);
    if (ch.keepsake) { p.keepsakes = Array.isArray(p.keepsakes) ? p.keepsakes : []; if (!p.keepsakes.includes(ch.keepsake)) p.keepsakes.push(ch.keepsake); }
    save(); paint();
    if (pl.after) pl.after(h);
    await reward('🏮', T(`The lantern of ${ch.en} is home!`, `Đèn lồng ${ch.vi} đã về nhà!`), T('A lantern for your house is waiting in your room.', 'Một chiếc đèn lồng đang chờ con trong phòng.'));
    if (ch.reward && G.addCoins) G.addCoins(ch.reward);
    // the companion learns this chapter's trick (STORY.md: "learns a new trick each chapter")
    if (ch.trick) { L.tricks = Array.isArray(L.tricks) ? L.tricks : []; if (!L.tricks.includes(ch.trick)) { L.tricks.push(ch.trick); save(); companions.trick(h, 'loop'); await dialog(COMPANIONS[L.companion || 'firefly'].name, [STORY_LINES['trick_' + ch.trick] || STORY_LINES.trick]); } }
    G.paused = false;
    G.checkQuests && G.checkQuests(h);
  }
  // a story film as a tale for the theatre (titles in the child's language; the child's own look for the hero)
  const storyTale = (tl, p) => ({ id: tl.id, story: true, flag: tl.flag, title: () => T(...tl.title), pages: tl.pages, ctx: { look: p.look, name: p.name, companion: st(p).companion || 'firefly' } });

  // ---------- the prologue: Ông Cú tells what happened, then the child picks a friend ----------
  let telling = false;
  async function prologue(h) {
    if (telling) return; telling = true; // (Ông Cú can be reached twice at once: walking up to him, and a tap)
    try { await tell(h); } finally { telling = false; }
  }
  async function tell(h) {
    const p = h.profile, L = st(p);
    G.paused = true;
    await openTheatre(storyTale(STORY_TALES.lantern_prologue, p), { name: p.name });
    const k = await dialog('Ông Cú', [[`Who will fly with you, ${p.name}?`, `Ai sẽ bay cùng con, ${p.name}?`, 'Who will fly with you?', 'Ai sẽ bay cùng con?']],
      [[`${COMPANIONS.firefly.icon} ${COMPANIONS.firefly.en}`, `${COMPANIONS.firefly.icon} ${COMPANIONS.firefly.vi}`], [`${COMPANIONS.dragon.icon} ${COMPANIONS.dragon.en}`, `${COMPANIONS.dragon.icon} ${COMPANIONS.dragon.vi}`]]);
    L.companion = k === 1 ? 'dragon' : 'firefly'; L.done.p_owl = true; p.quests.owl = true; save();
    companions.sync();
    const C = COMPANIONS[L.companion];
    await dialog(C.name, [[`Hello ${p.name}! I will fly right beside you. Let's find the lanterns together!`, `Chào ${p.name}! Mình sẽ bay ngay bên cạnh bạn. Cùng đi tìm đèn lồng nhé!`, "Hello! I will fly right beside you. Let's find the lanterns together!", 'Chào bạn! Mình sẽ bay ngay bên cạnh bạn. Cùng đi tìm đèn lồng nhé!']]);
    G.paused = false;
    G.checkQuests && G.checkQuests(h);
  }

  const companions = createCompanions(G);
  // the đình is lit when any child playing has hung its lantern
  const paint = () => { for (const [id, pl] of Object.entries(places)) pl.paint(G.heroes.some(h => st(h.profile).chapters[id])); };
  // the lantern in the pond shows while a child is looking for it; the mist drifts
  world.updaters.push((dt, t) => {
    found.visible = G.heroes.some(h => isOn(h.profile, 'c1_find') && (!actions() || revealed(h.profile)));
    if (found.visible) { found.position.y = heightAt(lanternAt[0], lanternAt[1]) + .45 + Math.sin(t * 2) * .06; twinkle.scale.setScalar(1 + Math.sin(t * 4) * .15); }
    if (mist.visible) mist.rotation.y += dt * .05;
    if (!(t % 2 < dt)) return; paint();
    for (const id in LATER) if (!loadingCh[id] && wanted(id)) loadCh(id);
    // a place step: done when the child is there (also if they were already there when the step began)
    for (const h of G.heroes) { const c = current(h.profile); if (c && c.s.visit && !catching(c.s) && G.regionOf[h.i] === c.s.visit) finish(h, c.s.id); }
  });

  // the quest the game's goal bar, arrow, Pad and Simple screen show
  // (an under-5 is told the little ones' version when a step has one)
  const asQuest = (p: Profile, c: StoryCurrent) => { const tale = (!big(p) && c.s.taleLittle) || c.s.tale;
    return { id: 'L_' + c.s.id, icon: c.s.icon, story: true, title: () => fill(actions() && !big(p) && c.s.actL_en ? T(c.s.actL_en, c.s.actL_vi) : actions() && c.s.act_en ? T(c.s.act_en, c.s.act_vi) : T(c.s.en, c.s.vi), p),
      tale: tale ? [tale[0], fill(tale[1], p), tale[2], tale[3]] : null,
      // Successful intermediate actions count as progress, while a genuinely stalled quest keeps its retry limit.
      progress: () => { const a = A(p), s = c.s;
        if (s.lesson) return Number(!!a.lesson) + (a.counted || []).length;
        if (s.leaves) return (a.lifted || []).length + Number(!!a.found);
        if (s.ribbons || s.lights) return (a[rkey(s)] || []).length;
        if (s.clues) return s.id === 'c3_find' ? (a.looked3 || []).length + Number(!!a.clue3) : (a.looked || []).length + Number(!!a.clue);
        return 0;
      }, target: () => (catching(c.s) && ribbonsLeft(p, c.s)[0]) || (spots[c.s.at] && spots[c.s.at](p)) }; };
  return {
    dialogChoice: () => choicePlan?.() || null,
    busy: (p: Profile) => hanging.has(p),
    quest: p => { const c = current(p); return c ? asQuest(p, c) : null; },
    // the old "talk to Ông Cú" opens the story's prologue instead (once)
    owl: async h => { const c = current(h.profile); if (c && c.s.owl) { await prologue(h); return true; } return false; },
    // regions the child walks into
    onRegion: (h, rg) => { const c = current(h.profile); if (c && c.s.visit === rg && !catching(c.s)) finish(h, c.s.id); },
    current, companions, paint, dinh: { x: dinhAt[0], z: dinhAt[1], front }, lanternAt, get hanoi() { return mods.ch2; }, get sydney() { return mods.ch3; }, mods, // (v1.08b story: chapters 4, 5 and the finale by id, for checks)
    places, loadCh, loadHanoi: () => loadCh('ch2'),
    // (checks) do a step straight away
    _finish: finish
  };
}
