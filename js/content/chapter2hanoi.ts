import type { StoryContext } from '../../types/story.js';
// Chapter 2 of the lantern story, Hà Nội (Play core, owner's go 10 Oct): the places and things js/lanterns.js needs.
// Nothing here moves the map (CLAUDE.md, helper rule 4): everything stands round places already there (the Thê Húc
// bridge by Hồ Gươm from js/regionsites.js, Văn Miếu and Bà Lan's bún chả stall in Hà Nội) on free ground found with
// js/openspot.js. Tèo, Cô Tam and Bà Năm come to Hà Nội for Trung Thu: they stand there only while a child is in this
// chapter (owner's choice); their homes in Làng Sen and on Phố Hai Quê stay as they are.
// Builds: the bridge's mist and lights (lit once a child hangs its lantern), the stand-ins, the stone turtles of Cô Tam's
// lesson, the clue spots by the lake (the lantern rests by the stone turtle), the Trung Thu parade round the lake after
// the lantern is hung, and the big kids' bonus secret: a golden turtle in the lake.
import { THREE, glow } from '../gfx.js';
import { T } from '../i18n.js';
import { heightAt, roadDist, WATER, CITIES } from '../world.js';
import { buildAvatar, nameAvatar } from '../avatar.js';
import { openSpot } from '../openspot.js';
import { pic } from '../art.js';
import { pad, frames, holdable, until, QUIT } from '../handpad.js';
import { buildLantern } from '../dinh.js';
import { buildStarLantern, buildStoneTurtle, buildBridgeLights, bridgeY } from './chapter2props.js';
import { STORY_LINES, CHAPTERS } from './chapters.js';
import { COUNT } from './chapter2text.js'; // (also adds the chapter's words to STORY_LINES)

const LOOKS = {
  teo: { style: 'shirt', color: '#ffb52e', hat: 'none', back: 'none', hair: '#1d1412', hairStyle: 'spiky', skin: '#f6c7a5', glider: 0 },
  tam: { style: 'aodai', color: '#d94a6a', hat: 'nonla', back: 'none', hair: '#1d1412', hairStyle: 'long', skin: '#e8b48c', glider: 0 },
  nam: { style: 'aodai', color: '#8a4a8a', hat: 'none', back: 'none', hair: '#e8e8e8', hairStyle: 'buns', skin: '#e8b48c', glider: 0 }
};
const PARADE_KIDS = [['dress', '#ff7eb8', 'buns'], ['shirt', '#3b6fe0', 'short'], ['shirt', '#43c463', 'spiky'], ['dress', '#ffd23f', 'ponytail'], ['hoodie', '#9a6bff', 'short'], ['shirt', '#ff8a2a', 'buns']];
const STAR_COLORS = ['#ff4a3a', '#ffd23f', '#ff7eb8', '#ff4a3a', '#5fd3ff', '#ffb020'];

// ctx: { current(p) → { ch, s }, isOn(p, id), A(p) (the step actions' memory), st(p), say, save, big(p) }
export function createHanoi(G, ctx: StoryContext) {
  const { scene, world } = G, { say, save, A, isOn, st, big } = ctx;
  const city = CITIES.find(c => c.id === 'hanoi');
  const lm = (G.LANDMARKS || []).find(l => l.id === 'thehuc');
  const placeholders = []; // (keep each spot clear of the next one found)
  const hold = (x, z) => { const it = { id: 'story_c2_room' + placeholders.length, x, z, r: 0, visible: () => false, act: () => { } }; placeholders.push(it); G.interactables.push(it); };
  const offRoad = (x, z, r) => { const d = roadDist(x, z); return !d.road || d.d > d.road.w / 2 + r; };
  // (a city's main street is not in the road list: js/cities.js keeps its line in c.layout; 5.2 m wide)
  const onStreet = (x, z, r) => CITIES.some(c => c.layout && x > c.x0 - 2 && x < c.x1 + 2 && z > c.z0 - 2 && z < c.z1 + 2
    && Math.abs((x - c.x) * Math.cos(c.layout.toward) - (z - c.z) * Math.sin(c.layout.toward)) < 2.6 + r);
  const free = (x, z, r, ir = 2.2) => heightAt(x, z) > WATER + .4 && offRoad(x, z, r) && !onStreet(x, z, r)
    && !world.colliders.some(c => c.r > 0 && c.top == null && Math.hypot(c.x - x, c.z - z) < c.r + r)
    && !world.boxes.some(b => x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r)
    && G.interactables.every(i => !Number.isFinite(i.x) || Math.hypot(i.x - x, i.z - z) > Math.max(r, ir));
  // the nearest free spot round (cx, cz), at least rmin away (off the street, the roads, buildings and other buttons)
  const spotNear = (cx, cz, rmax, need, fallback, rmin = 0) => {
    for (let k = 0; k < 900; k++) { const a = k * 2.39996, d = rmin + k * ((rmax - rmin) / 900), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (free(x, z, need, 3)) { hold(x, z); return [x, z]; } }
    const s = openSpot(G, { cx, cz, rmax, need, flatR: 1.5, want: 3, distW: .6 }); const at = s ? [s.x, s.z] : fallback; hold(at[0], at[1]); return at; };

  // ---------- the bridge by Hồ Gươm ----------
  const mx = lm ? lm.mx : city.x + 27, mz = lm ? lm.mz : city.z + 29;
  const model = scene.children.find(o => o.isMesh && Math.abs(o.position.x - mx) < .01 && Math.abs(o.position.z - mz) < .01);
  const by = model ? model.position.y : heightAt(mx, mz), rot = model ? model.rotation.y : Math.atan2(city.x - mx, city.z - mz);
  // (local x runs along the bridge, local +z looks towards the city, like the model)
  const W = (lx, lz) => ({ x: mx + Math.cos(rot) * lx + Math.sin(rot) * lz, z: mz - Math.sin(rot) * lx + Math.cos(rot) * lz });
  const sign = lm ? { x: lm.x, z: lm.z } : W(0, 9);
  // (every button by the lake keeps 4 m from the others, so the right one comes up)
  const pick = (cands, r, away = []) => { for (const [lx, lz] of cands) { const q = W(lx, lz); if (Math.hypot(q.x - mx, q.z - mz) > 6.6 && Math.hypot(q.x - sign.x, q.z - sign.z) > 4 && away.every(a => Math.hypot(a.x - q.x, a.z - q.z) > 4) && free(q.x, q.z, r, 4.2)) return q; } return null; };
  const ring = (lz0, step = 1) => { const out = []; for (let lz = lz0; lz < lz0 + 8; lz += step) for (const lx of [-5, 5, -7, 7, -3, 3, -9, 9, 0]) out.push([lx, lz]); return out; };
  const front = pick(ring(7.5), 1.2) || W(-5, 9); hold(front.x, front.z);
  const namAt = pick(ring(7.5).map(([x, z]) => [-x, z]), .8, [front]) || W(6, 10); hold(namAt.x, namAt.z);
  // three spots round the lake: the stone turtle (where the lantern rests), a lotus pot, a little bush
  const clues = [];
  for (let k = 0; k < 60 && clues.length < 3; k++) {
    const a = k * 2.39996, R = 8 + (k % 5) * 1.2, q = W(Math.cos(a) * R * 1.25, Math.sin(a) * R * .9);
    if (Math.hypot(q.x - mx, q.z - mz) < 7 || Math.hypot(q.x - sign.x, q.z - sign.z) < 4 || [front, namAt, ...clues].some(c => Math.hypot(c.x - q.x, c.z - q.z) < 4.2) || !free(q.x, q.z, .9, 3.6)) continue;
    clues.push({ k: clues.length, x: q.x, z: q.z }); hold(q.x, q.z);
  }
  while (clues.length < 3) { const q = W(-8 + clues.length * 8, 11); clues.push({ k: clues.length, x: q.x, z: q.z }); }
  const RIGHT = 0;
  const rope = (() => { const t = 2.5 / 14, q = W(-7 + 14 * t, 1.25); return { x: q.x, z: q.z, y0: by + .6, y1: by + bridgeY(t) + 1.4 }; })();

  // the mist round it, and its lights
  const mist = new THREE.Group(); mist.userData.noSolid = true; mist.position.set(mx, by, mz); mist.rotation.y = rot; scene.add(mist);
  const mistMat = new THREE.MeshBasicMaterial({ color: '#f4f7fb', transparent: true, opacity: .3, depthWrite: false });
  for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(2.2 + (i % 3) * .5, 12, 8), mistMat); s.position.set(-6 + i * 1.5, 1.4 + (i % 3) * .7, Math.sin(i * 2.4) * 1.2); s.scale.y = .55; mist.add(s); }
  const rail = []; for (let i = 0; i <= 10; i++) for (const s of [-1, 1]) rail.push(new THREE.Vector3(-7 + i * 1.4, bridgeY(i / 10) + .7, s));
  const lights = buildBridgeLights(rail); lights.userData.noSolid = true; lights.position.set(mx, by - .05, mz); lights.rotation.y = rot; lights.visible = false; scene.add(lights);
  const hung = buildLantern(true); hung.scale.setScalar(.8); hung.position.set(0, bridgeY(.5) + 1.5, 0); lights.add(hung);
  const paint = on => { lights.visible = on; mist.visible = !on; };

  // ---------- the lantern by the stone turtle, and the three clue spots ----------
  const found = buildLantern(true); found.userData.noSolid = true; found.visible = false; scene.add(found);
  const lanternAt = clues[RIGHT];
  found.position.set(lanternAt.x + .9, heightAt(lanternAt.x, lanternAt.z) + .45, lanternAt.z); found.rotation.z = .4;
  const clueObjs = clues.map(c => {
    let o;
    if (c.k === RIGHT) { o = buildStoneTurtle(); o.scale.setScalar(.8); }
    else if (c.k === 1) { o = new THREE.Group(); const pot = new THREE.Mesh(new THREE.CylinderGeometry(.4, .3, .5, 12), new THREE.MeshToonMaterial({ color: '#b86a3a' })); pot.position.y = .25; o.add(pot);
      const leaf = new THREE.Mesh(new THREE.CircleGeometry(.45, 14), new THREE.MeshToonMaterial({ color: '#3f9a4a', side: THREE.DoubleSide })); leaf.rotation.x = -Math.PI / 2; leaf.position.y = .52; o.add(leaf);
      const lotus = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), new THREE.MeshToonMaterial({ color: '#ff8ab0' })); lotus.position.set(.1, .7, 0); lotus.scale.y = 1.3; o.add(lotus); }
    else { o = new THREE.Group(); for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.45 - i * .08, 10, 8), new THREE.MeshToonMaterial({ color: i % 2 ? '#4f9e42' : '#5fae4a' })); b.position.set((i - 1) * .35, .35, (i % 2) * .2); o.add(b); } }
    o.position.set(c.x, heightAt(c.x, c.z), c.z); o.rotation.y = Math.atan2(mx - c.x, mz - c.z); o.userData.noSolid = true; o.visible = false; scene.add(o);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(.18, 8, 6), glow('#fff2a8', .8)); spark.material.depthWrite = false; spark.position.y = 1.3; o.add(spark);
    return { ...c, o, spark };
  });
  const clueFound = p => !!A(p).clue;
  const looked = p => A(p).looked || [];
  const lookAt = (h, c) => {
    const a = A(h.profile); a.looked = a.looked || []; if (!a.looked.includes(c.k)) a.looked.push(c.k);
    if (c.k === RIGHT) { a.clue = true; say(...STORY_LINES.clueFound); } else { say(...STORY_LINES.fish); G.fx && G.fx(c.x, heightAt(c.x, c.z) + 1, c.z, '🐟'); }
    save();
  };

  // ---------- Tèo, Cô Tam and Bà Năm in Hà Nội ----------
  const teoAt = spotNear(city.x, city.z, 10, 1, [city.x + 2, city.z + 2]);
  const vm = (G.LANDMARKS || []).find(l => l.id === 'vanmieu');
  const tamAt = spotNear(vm ? vm.mx : city.x - 3, vm ? vm.mz : city.z + 3, 11, 1, [city.x - 3, city.z + 3], 4.6);
  const bun = G.interactables.find(i => i.id === 'v_k_bunca');
  const jobAt = spotNear(bun ? bun.x : city.x + 8, bun ? bun.z : city.z, 8, .8, [city.x + 7, city.z - 1], 2.5);
  const people = [['teo', 'Tèo', teoAt[0], teoAt[1]], ['tam', 'Cô Tam', tamAt[0], tamAt[1]], ['nam', 'Bà Năm', namAt.x, namAt.z]].map(([id, name, x, z]) => {
    const A_ = nameAvatar(buildAvatar(LOOKS[id], null), name, true, undefined);
    A_.root.position.set(x, heightAt(x, z), z); A_.root.rotation.y = id === 'nam' ? Math.atan2(mx - x, mz - z) + Math.PI : Math.atan2(city.x - x, city.z - z) || 0; if (id === 'teo') A_.root.scale.setScalar(.82);
    A_.root.visible = false; A_.root.userData.noSolid = true; scene.add(A_.root);
    return { id, name, x, z, A: A_ };
  });
  // the stone turtles of Cô Tam's lesson: in a row in front of her (3 for an under-5, 5 for a big kid)
  const turtles = [];
  { const fx = city.x - tamAt[0], fz = city.z - tamAt[1], fl = Math.hypot(fx, fz) || 1, ux = fx / fl, uz = fz / fl;
    for (let k = 0, j = 0; k < 5 && j < 600; j++) {
      const a = j * 2.39996, d = 1.8 + j * .012, x = tamAt[0] + Math.cos(a) * d, z = tamAt[1] + Math.sin(a) * d;
      if (!free(x, z, .55, 1.3) || turtles.some(t => Math.hypot(t.x - x, t.z - z) < 1.5)) continue;
      const o = buildStoneTurtle(); o.position.set(x, heightAt(x, z), z); o.rotation.y = Math.atan2(tamAt[0] - x, tamAt[1] - z); o.visible = false; o.userData.noSolid = true; scene.add(o);
      turtles.push({ k: k++, x, z, o }); hold(x, z);
    }
    while (turtles.length < 5) { const k = turtles.length, x = tamAt[0] + ux * 2.4 + (k - 2) * 1.4 * -uz, z = tamAt[1] + uz * 2.4 + (k - 2) * 1.4 * ux, o = buildStoneTurtle(); o.position.set(x, heightAt(x, z), z); o.visible = false; scene.add(o); turtles.push({ k, x, z, o }); }
  }
  const nTurtles = p => big(p) ? 5 : 3;
  const counted = p => A(p).counted || [];
  const lessonOn = p => isOn(p, 'c2_vanmieu') && !!A(p).lesson;

  // ---------- the Trung Thu parade round the lake (after a lantern is hung) ----------
  const path = [];
  for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, q = W(Math.cos(a) * 12.5, Math.sin(a) * 9.5); if (heightAt(q.x, q.z) > WATER + .3 && !world.colliders.some(c => c.r > .3 && c.top == null && Math.hypot(c.x - q.x, c.z - q.z) < c.r + .4)) path.push(q); }
  const parade = PARADE_KIDS.map(([style, color, hairStyle], i) => {
    const A_ = buildAvatar({ style, color, hat: 'none', back: 'none', hair: '#1d1412', hairStyle, skin: ['#f6c7a5', '#e0aa80', '#d8a070'][i % 3], glider: 0 }, null);
    A_.root.scale.setScalar(.8); const star = buildStarLantern(STAR_COLORS[i]); star.position.set(.25, 0, .25); star.scale.setScalar(.9); A_.root.add(star);
    A_.root.visible = false; A_.root.userData.noSolid = true; scene.add(A_.root); return { A: A_, star };
  });
  let paradeUntil = 0;
  const startParade = () => { paradeUntil = performance.now() / 1000 + 80; say(...STORY_LINES.parade); };

  // ---------- the bonus secret for big kids: a golden turtle comes up once ----------
  const gold = buildStoneTurtle(); const goldBody = gold.children[0]; if (goldBody instanceof THREE.Mesh) goldBody.material = new THREE.MeshToonMaterial({ color: '#ffcf3a', emissive: '#7a5200', emissiveIntensity: .5 }); gold.userData.noSolid = true; gold.visible = false; scene.add(gold);
  const goldAt = W(0, -3.2); gold.position.set(goldAt.x, by - .3, goldAt.z); gold.rotation.y = rot;
  const secretFor = p => big(p) && st(p).chapters.ch2 && !(st(p).secret || {}).ch2;

  const inChapter = () => G.heroes.some(h => { const c = ctx.current(h.profile); return c && c.ch.id === 'ch2'; });
  world.updaters.push((dt, t) => {
    const on = inChapter();
    for (const q of people) { q.A.root.visible = on; if (on) q.A.anim(q.id === 'teo' && Math.floor(t * .5) % 4 === 0 ? 'cheer' : Math.floor(t * .4) % 3 === 0 ? 'wave' : 'idle', t, 0); }
    const lesson = G.heroes.find(h => lessonOn(h.profile));
    turtles.forEach(T_ => { T_.o.visible = !!lesson && T_.k < nTurtles(lesson.profile); if (T_.o.visible) T_.o.position.y = heightAt(T_.x, T_.z) + (counted(lesson.profile).includes(T_.k) ? Math.abs(Math.sin(t * 4)) * .08 : 0); });
    const looking = G.heroes.filter(h => isOn(h.profile, 'c2_find'));
    clueObjs.forEach(c => { c.o.visible = looking.length > 0; c.spark.visible = looking.some(h => !looked(h.profile).includes(c.k) && !clueFound(h.profile)); c.spark.position.y = 1.3 + Math.sin(t * 3 + c.k) * .12; });
    found.visible = looking.some(h => clueFound(h.profile)); if (found.visible) found.position.y = heightAt(lanternAt.x, lanternAt.z) + .45 + Math.sin(t * 2) * .06;
    // (an under-5's companion flies over the right spot and glows: its new trick, lighting the way)
    // (only its own lead: chapter 3 leads the same companion later)
    for (const h of G.heroes) if (isOn(h.profile, 'c2_find') || ctx.companions().of(h)?.lead?.c2) ctx.companions().lead(h, isOn(h.profile, 'c2_find') && !big(h.profile) && !clueFound(h.profile) ? { x: lanternAt.x, y: heightAt(lanternAt.x, lanternAt.z) + 1.8, z: lanternAt.z, c2: true } : null);
    if (mist.visible) mist.children.forEach((m, i) => { m.position.y = 1.4 + (i % 3) * .7 + Math.sin(t * .6 + i) * .15; });
    if (lights.visible) lights.children.forEach((l, i) => { if (l instanceof THREE.Mesh && l.geometry.type === 'SphereGeometry') l.scale.setScalar(1 + Math.sin(t * 3 + i) * .08); });
    // the parade walks round the lake, star lanterns bobbing
    const going = t > 0 && performance.now() / 1000 < paradeUntil && path.length > 4;
    parade.forEach((k, i) => {
      k.A.root.visible = going; if (!going) return;
      const u = ((t * .045 + i * .035) % 1) * path.length, a = path[Math.floor(u) % path.length], b = path[(Math.floor(u) + 1) % path.length], f = u % 1;
      const x = a.x + (b.x - a.x) * f, z = a.z + (b.z - a.z) * f; k.A.root.position.set(x, heightAt(x, z), z); k.A.root.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      k.A.anim('walk', t, 1.6); k.star.rotation.z = Math.sin(t * 3 + i) * .15;
    });
    gold.visible = G.heroes.some(h => secretFor(h.profile)); if (gold.visible) { gold.position.y = by - .25 + Math.abs(Math.sin(t * 1.2)) * .25; gold.rotation.y = rot + Math.sin(t * .7) * .4; }
  });

  // ---------- the buttons (only for the child on that step) ----------
  for (const c of clueObjs) G.interactables.push({ id: 'story_clue' + c.k, x: c.x, z: c.z, r: 2.2, icon: c.k === RIGHT ? '🐢' : c.k === 1 ? '🪷' : '🌳', label: () => T('Look here', 'Tìm ở đây'),
    visible: h => ctx.actions() && isOn(h.profile, 'c2_find') && !clueFound(h.profile) && !looked(h.profile).includes(c.k), act: h => lookAt(h, c) });
  for (const tu of turtles) G.interactables.push({ id: 'story_turtle' + tu.k, x: tu.x, z: tu.z, r: 1.4, icon: '🐢', label: () => T('Count the turtle', 'Đếm rùa'),
    visible: h => lessonOn(h.profile) && tu.k < nTurtles(h.profile) && !counted(h.profile).includes(tu.k), act: h => countTurtle(h, tu) });
  G.interactables.push({ id: 'story_c2_secret', x: W(0, 6.8).x, z: W(0, 6.8).z, r: 3.4, icon: '🐢', label: () => T('Say hello to the golden turtle', 'Chào Rùa Vàng'),
    visible: h => secretFor(h.profile), act: async h => { const L = st(h.profile); L.secret = { ...(L.secret || {}), ch2: true }; const p = h.profile; p.stickers = Array.isArray(p.stickers) ? p.stickers : []; if (!p.stickers.includes('🐢')) p.stickers.push('🐢'); save();
      await ctx.reward('🐢', T('The golden turtle!', 'Rùa Vàng!'), T(...STORY_LINES.secret)); } });
  placeholders.forEach(i => { const k = G.interactables.indexOf(i); if (k >= 0) G.interactables.splice(k, 1); });

  // counting: each turtle says its number; then a big kid answers how many, and learns a word
  let asking = false;
  async function countTurtle(h, tu) {
    const p = h.profile, a = A(p); a.counted = a.counted || []; if (a.counted.includes(tu.k)) return;
    a.counted.push(tu.k); save();
    const n = a.counted.length; say(...COUNT[n - 1]); G.fx && G.fx(tu.x, heightAt(tu.x, tu.z) + 1.4, tu.z, '⭐');
    if (n < nTurtles(p) || asking) return;
    asking = true;
    try {
      if (!big(p)) { await ctx.dialog('Cô Tam', [STORY_LINES.countLittle]); ctx.finish(h, 'c2_vanmieu'); return; }
      for (let tries = 0; tries < 4; tries++) {
        // Offer the real answer button to autoplay; it still has to choose it through the visible dialogue.
        const unplan = ctx.plan(() => [...document.querySelectorAll('.dialog:not(.out) .dch')].find(b => b.textContent?.trim() === String(nTurtles(p))));
        let k: number;
        try { k = await ctx.dialog('Cô Tam', [STORY_LINES.countAsk], [['3', '3'], ['5', '5'], ['7', '7']]); } finally { unplan(); }
        if (k < 0) break; // (walked away: the turtles wait to be counted again)
        if (k === 1) { await ctx.dialog('Cô Tam', [STORY_LINES.word]); ctx.finish(h, 'c2_vanmieu'); return; }
        await ctx.dialog('Cô Tam', [STORY_LINES.countAgain]);
      }
      a.counted = []; save(); // (never stuck: count them again)
    } finally { asking = false; G.paused = false; }
  }
  async function lesson(h) {
    const a = A(h.profile); G.paused = true;
    await ctx.dialog('Cô Tam', [STORY_LINES.lessonStart]); G.paused = false;
    a.lesson = true; a.counted = []; save();
  }

  // Bà Lan's bún chả: hold the fan until the grill is ready, then carry three bowls to the tables
  async function job(_h?) {
    G.paused = false;
    let p = pad(`<p>${T(...STORY_LINES.fan)}</p><button class="hp-big hp-pedal" data-hp="fan">${pic('🔥')}</button><div class="hp-bar"><i></i></div>`);
    say(...STORY_LINES.fan);
    const fan = holdable(p.querySelector('[data-hp=fan]')); let u = 0;
    try { await frames(dt => { if (fan.down) u = Math.min(1, u + dt * .45); p.querySelector<HTMLElement>('.hp-bar i').style.width = (u * 100) + '%'; return u >= 1; }, p); } finally { p.remove(); }
    p = pad(`<p>${T(...STORY_LINES.grilled)}</p><button class="hp-big" data-hp="bowl">${pic('🍲')}</button><div class="hp-count">${'<i></i>'.repeat(3)}</div>`);
    say(...STORY_LINES.grilled);
    try { await until(new Promise(res => { let n = 0; p.querySelector<HTMLButtonElement>('[data-hp=bowl]').onclick = () => { n++; const d = p.querySelectorAll('.hp-count i'); if (d[n - 1]) d[n - 1].className = 'on'; say(...STORY_LINES.bowl); if (n >= 3) setTimeout(res, 300); }; }), p); } finally { p.remove(); }
    say(...STORY_LINES.jobDone);
  }

  const spots = {
    hanoi: () => { const g = (city.gates || [])[1]; return g ? { x: g[0] - 4, z: g[1] } : { x: city.x0 - 4, z: city.z }; },
    teo2: () => ({ x: teoAt[0], z: teoAt[1] }),
    tam2: p => {
      const h = p && G.heroes.find(h => h.profile === p), left = p && lessonOn(p) ? turtles.filter(t => t.k < nTurtles(p) && !counted(p).includes(t.k)) : [];
      const next = h && left.length ? left.sort((a, b) => Math.hypot(a.x - h.pos.x, a.z - h.pos.z) - Math.hypot(b.x - h.pos.x, b.z - h.pos.z))[0] : left[0];
      return next ? { x: next.x, z: next.z } : { x: tamAt[0], z: tamAt[1] };
    },
    nam2: () => ({ x: namAt.x, z: namAt.z }),
    bunca: () => ({ x: jobAt[0], z: jobAt[1] }),
    // (a big kid is pointed at the lake and reads the clue; an under-5 is pointed at the right spot)
    // (tester's notes, 12 Oct) a big kid's light shines on the nearest place still to look at (it shone on the shore,
    // where nothing could be tapped); after the clue is found, on the lantern by the stone turtle, where "Pick up the
    // lantern" waits (#620 #647: it shone on the shore again, where there was nothing to tap)
    clues: p => { if (p && (!big(p) || clueFound(p))) return { x: lanternAt.x, z: lanternAt.z };
      const h = G.heroes.find(x => x.profile === p), left = p && !clueFound(p) ? clueObjs.filter(c => !looked(p).includes(c.k)) : [];
      const c = h && left.length ? left.sort((a, b) => Math.hypot(a.x - h.pos.x, a.z - h.pos.z) - Math.hypot(b.x - h.pos.x, b.z - h.pos.z))[0] : left[0];
      return c ? { x: c.x, z: c.z } : { x: front.x, z: front.z }; },
    bridge: () => ({ x: front.x, z: front.z })
  };
  // the steps' own buttons: Tèo's challenge (his line, then Play, How to play (the guide film) or Later), Bà Lan's bún chả
  // by hand, and Cô Tam's lesson (she starts it, then the child counts the stone turtles)
  const jobbing = new Set();
  for (const s of (CHAPTERS.find(c => c.id === 'ch2') || { steps: [] }).steps) {
    const at = spots[s.at] && spots[s.at](), base = { id: 'story_' + s.id, x: at.x + (s.job ? 0 : .8), z: at.z + (s.job ? 0 : .8), r: 3, icon: s.icon, label: () => T(s.en, s.vi) };
    if (s.challenge) G.interactables.push({ ...base, visible: h => isOn(h.profile, s.id), act: h => G.kidTalk(h, ctx.gamesOf(h.profile, s)[0], 'Tèo', big(h.profile) ? s.challenge.big : s.challenge.little) });
    if (s.job) G.interactables.push({ ...base, visible: h => isOn(h.profile, s.id) && !jobbing.has(h.profile),
      act: async h => { if (jobbing.has(h.profile)) return; jobbing.add(h.profile); try { await job(h); ctx.finish(h, s.id); } catch (e) { if (e !== QUIT) throw e; } finally { jobbing.delete(h.profile); G.paused = false; } } });
    if (s.lesson) G.interactables.push({ ...base, visible: h => isOn(h.profile, s.id) && !A(h.profile).lesson, act: h => lesson(h) });
  }
  return {
    spots, onStreet, front: [front.x, front.z], lanternAt: [lanternAt.x, lanternAt.z], rope, paint, revealed: clueFound,
    job, lesson, startParade, paradeOn: () => performance.now() / 1000 < paradeUntil, lit: () => lights.visible,
    bridge: { x: mx, z: mz, y: by, rot }, clues: clueObjs.map(c => ({ k: c.k, x: c.x, z: c.z })), people: people.map(q => ({ id: q.id, x: q.x, z: q.z })), turtles: turtles.map(t => ({ k: t.k, x: t.x, z: t.z }))
  };
}
export const create = createHanoi; // (js/lanterns.js loads every later chapter the same way)
