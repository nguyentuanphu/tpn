// Chapter 3 of the lantern story, Sydney (Play core, owner's go 10 Oct): the places and things js/lanterns.js needs,
// loaded once a child playing has found chapter 2's lantern. Nothing here moves the map (CLAUDE.md, helper rule 4):
// everything stands round places already there (Sydney's square, Captain Molly's ferries, the Opera House on the lake's
// east beach from js/regions.js) on free ground off the roads and streets. Chi, Jack and Ruby stand in Sydney, and Bà Năm
// by the harbour, only while a child is in this chapter (as in chapter 2).
// Builds: the stand-ins, Chi's Aussie word game (pictures for an under-5, meanings for a big kid), Jack and Ruby's
// challenge (cricket for a big kid, tug of war for an under-5), the clues by the harbour (the lantern waits by the little
// ferry; an under-5's companion flies high and leads the way), the Opera House's mist and coloured sails (lit once a child
// hangs its lantern), fireworks over the harbour after, and the big kids' bonus secret: a koala in a gum tree.
import { THREE, glow } from '../gfx.js';
import { T } from '../i18n.js';
import { heightAt, roadDist, WATER, CITIES, LAKE } from '../world.js';
import { buildAvatar, nameAvatar } from '../avatar.js';
import { pic } from '../art.js';
import { pad, until, QUIT } from '../handpad.js';
import { buildLantern } from '../dinh.js';
import { CUSTOM } from '../custom.js';
import { buildSailLights, buildFerry, buildGumTree, buildKoala } from './chapter3props.js';
import { STORY_LINES, CHAPTERS } from './chapters.js';
import { WORDS } from './chapter3text.js'; // (also adds the chapter's words to its steps and STORY_LINES)

const LOOKS = {
  chi: { style: 'shirt', color: '#ffd23f', hat: 'none', back: 'none', hair: '#3b2618', hairStyle: 'ponytail', skin: '#f0c8a0', glider: 0 },
  jack: { style: 'shirt', color: '#3b6fe0', hat: 'cap', back: 'none', hair: '#e8c26a', hairStyle: 'short', skin: '#ffe3d1', glider: 0 },
  ruby: { style: 'overalls', color: '#a66bff', hat: 'bow', back: 'none', hair: '#a8432a', hairStyle: 'long', skin: '#ffe3d1', glider: 0 },
  nam: { style: 'aodai', color: '#8a4a8a', hat: 'none', back: 'none', hair: '#e8e8e8', hairStyle: 'buns', skin: '#e8b48c', glider: 0 }
};
// (owner, 10 Oct: "Chi's look can be changed in Studio") Studio's content pack may change Chi, Jack and Ruby's looks:
// looks: { chi: { style, color, hair, hairStyle, skin }, jack: {...}, ruby: {...} }, the same choices as a Studio villager;
// anything missing or not well formed keeps the look above
const hex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : null;
export function lookOf(id, looks = CUSTOM.looks) {
  const base = LOOKS[id], L = looks && typeof looks === 'object' && id !== 'nam' ? looks[id] : null;
  if (!L || typeof L !== 'object') return base;
  return { ...base, style: ['dress', 'shirt', 'aodai', 'tunic', 'overalls', 'hoodie'].includes(L.style) ? L.style : base.style, color: hex(L.color) || base.color,
    hair: hex(L.hair) || base.hair, hairStyle: ['buns', 'short', 'long', 'ponytail', 'spiky'].includes(L.hairStyle) ? L.hairStyle : base.hairStyle, skin: hex(L.skin) || base.skin };
}

export function create(G, ctx) {
  const { scene, world } = G, { say, save, A, isOn, st, big } = ctx;
  const city = CITIES.find(c => c.id === 'sydney');
  const lm = (G.LANDMARKS || []).find(l => l.id === 'opera');
  const onStreet = (x, z, r) => CITIES.some(c => c.layout && x > c.x0 - 2 && x < c.x1 + 2 && z > c.z0 - 2 && z < c.z1 + 2
    && Math.abs((x - c.x) * Math.cos(c.layout.toward) - (z - c.z) * Math.sin(c.layout.toward)) < 2.6 + r);
  const held = [];
  const free = (x, z, r, ir = 2.2) => heightAt(x, z) > WATER + .4 && (d => !d.road || d.d > d.road.w / 2 + r)(roadDist(x, z)) && !onStreet(x, z, r)
    && !world.colliders.some(c => c.r > 0 && c.top == null && Math.hypot(c.x - x, c.z - z) < c.r + r)
    && !world.boxes.some(b => x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r)
    && G.interactables.every(i => !Number.isFinite(i.x) || Math.hypot(i.x - x, i.z - z) > Math.max(r, ir)) && held.every(q => Math.hypot(q.x - x, q.z - z) > Math.max(r, ir));
  // the nearest free spot round (cx, cz), from rmin to rmax away
  const near = (cx, cz, rmin, rmax, r = 1, ir = 3) => { for (let k = 0; k < 900; k++) { const a = k * 2.39996, d = rmin + k * ((rmax - rmin) / 900), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (free(x, z, r, ir)) { const q = { x, z }; held.push(q); return q; } } const q = { x: cx + rmin, z: cz }; held.push(q); return q; };

  // ---------- the Opera House on the lake's east beach ----------
  const ox = lm ? lm.mx ?? lm.x : 98, oz = lm ? lm.mz ?? lm.z : 128;
  const model = scene.children.find(o => o.isMesh && Math.abs(o.position.x - ox) < .01 && Math.abs(o.position.z - oz) < .01);
  const oy = model ? model.position.y : heightAt(ox, oz), rot = model ? model.rotation.y : -Math.PI / 2;
  const sign = lm ? { x: lm.x, z: lm.z } : { x: ox - 11, z: oz };
  const front = near(sign.x, sign.z, 4, 12, 1.2, 4.2);
  const namAt = near(front.x, front.z, 4, 12, .8, 4);
  // the lights on its sails (the same sails as the model), and the mist round it until it is lit
  const lights = buildSailLights(); lights.position.set(ox, oy, oz); lights.rotation.y = rot; lights.userData.noSolid = true; lights.visible = false; scene.add(lights);
  const hung = buildLantern(true); hung.scale.setScalar(.8); hung.position.set(-2, 7.6, .8); lights.add(hung);
  const mist = new THREE.Group(); mist.userData.noSolid = true; mist.position.set(ox, oy, oz); mist.rotation.y = rot; scene.add(mist);
  const mistMat = new THREE.MeshBasicMaterial({ color: '#f4f7fb', transparent: true, opacity: .3, depthWrite: false });
  for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(2.4 + (i % 3) * .5, 12, 8), mistMat); s.position.set(-6 + i * 1.5, 2.4 + (i % 3) * .8, Math.sin(i * 2.4) * 1.5); s.scale.y = .55; mist.add(s); }
  const paint = on => { lights.visible = on; mist.visible = !on; };
  const rope = { x: front.x + (ox - front.x) * .35, z: front.z + (oz - front.z) * .35, y0: heightAt(front.x, front.z) + .6, y1: oy + 7.4 };

  // ---------- three spots by the harbour: the little ferry (where the lantern waits), a gum tree, a beach umbrella ----------
  const clues = [];
  for (let k = 0; k < 80 && clues.length < 3; k++) {
    const a = k * 2.39996, R = 13 + (k % 6) * 1.5, x = ox + Math.cos(a) * R, z = oz + Math.sin(a) * R;
    if (Math.hypot(x - sign.x, z - sign.z) < 4 || [front, namAt, ...clues].some(c => Math.hypot(c.x - x, c.z - z) < 4.5) || !free(x, z, 1, 3.6)) continue;
    clues.push({ k: clues.length, x, z }); held.push({ x, z });
  }
  while (clues.length < 3) clues.push({ k: clues.length, x: front.x + 5 * (clues.length + 1), z: front.z });
  // (the little ferry, where the lantern waits, goes to the spot nearest the water)
  clues.sort((a, b) => Math.hypot(a.x - LAKE.x, a.z - LAKE.z) - Math.hypot(b.x - LAKE.x, b.z - LAKE.z)).forEach((c, k) => { c.k = k; });
  const RIGHT = 0, lanternAt = clues[RIGHT];
  const clueObjs = clues.map(c => {
    let o;
    if (c.k === RIGHT) { o = buildFerry(); o.scale.setScalar(.8); }
    else if (c.k === 1) { o = buildGumTree(.6); }
    else { o = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 2.2, 6), new THREE.MeshToonMaterial({ color: '#e8e4dc' })); pole.position.y = 1.1; o.add(pole);
      const top = new THREE.Mesh(new THREE.ConeGeometry(1.2, .5, 8), new THREE.MeshToonMaterial({ color: '#ff5fa2' })); top.position.y = 2.2; o.add(top); }
    o.position.set(c.x, heightAt(c.x, c.z), c.z); o.rotation.y = Math.atan2(ox - c.x, oz - c.z); o.userData.noSolid = true; o.visible = false; scene.add(o);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(.18, 8, 6), glow('#fff2a8', .8)); spark.material.depthWrite = false; spark.position.y = 2.6; o.add(spark);
    return { ...c, o, spark };
  });
  const found = buildLantern(true); found.userData.noSolid = true; found.visible = false; scene.add(found);
  found.position.set(lanternAt.x + 1, heightAt(lanternAt.x, lanternAt.z) + .45, lanternAt.z); found.rotation.z = .4;
  const clueFound = p => !!A(p).clue3, looked = p => A(p).looked3 || [];
  const lookAt = (h, c) => { const a = A(h.profile); a.looked3 = a.looked3 || []; if (!a.looked3.includes(c.k)) a.looked3.push(c.k);
    if (c.k === RIGHT) { a.clue3 = true; say(...STORY_LINES.c3found); } else say(...STORY_LINES.c3fish); save(); };

  // ---------- Chi, Jack and Ruby in Sydney; Bà Năm by the harbour ----------
  const chiAt = near(city.x, city.z, 3, 12, 1, 3);
  const jackAt = near(city.x + 6, city.z + 6, 3, 14, 1.4, 3);
  const host = G.interactables.find(i => i.id === 'g_ferries'), mollyAt = host ? { x: host.x, z: host.z } : { x: city.x, z: city.z };
  const people = [['chi', 'Chi', chiAt], ['jack', 'Jack', jackAt], ['ruby', 'Ruby', near(jackAt.x + 1.4, jackAt.z, 0, 5, .8, 1.2)], ['nam', 'Bà Năm', namAt]].map(([id, name, q]: [string, string, { x: number, z: number }]) => {
    const A_ = nameAvatar(buildAvatar(lookOf(id), null), name), x = q.x, z = q.z;
    A_.root.position.set(x, heightAt(x, z), z); A_.root.rotation.y = id === 'nam' ? Math.atan2(ox - x, oz - z) + Math.PI : Math.atan2(city.x - x, city.z - z) || 0;
    if (id !== 'nam') A_.root.scale.setScalar(.82); A_.root.visible = false; A_.root.userData.noSolid = true; scene.add(A_.root);
    return { id, x, z, A: A_ };
  });

  // ---------- fireworks over the harbour after the lantern is hung ----------
  const tex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const bursts = []; let showUntil = 0, nextBurst = 0;
  const startParade = () => { showUntil = performance.now() / 1000 + 60; say(...STORY_LINES.c3fireworks); };

  // ---------- the big kids' secret: a koala in a gum tree ----------
  const kAt = near(ox, oz, 12, 22, 1.2, 3), tree = buildGumTree(1); tree.position.set(kAt.x, heightAt(kAt.x, kAt.z), kAt.z); tree.userData.noSolid = true; tree.visible = false; scene.add(tree);
  const koala = buildKoala(); koala.position.set(.25, 2.6, .25); tree.add(koala);
  const secretFor = p => big(p) && st(p).chapters.ch3 && !(st(p).secret || {}).ch3;

  const inChapter = () => G.heroes.some(h => { const c = ctx.current(h.profile); return c && c.ch.id === 'ch3'; });
  world.updaters.push((dt, t) => {
    const on = inChapter();
    for (const q of people) { q.A.root.visible = on; if (on) q.A.anim(Math.floor(t * .4 + q.x) % 3 === 0 ? 'wave' : 'idle', t, 0); }
    const looking = G.heroes.filter(h => isOn(h.profile, 'c3_find'));
    clueObjs.forEach(c => { c.o.visible = looking.length > 0; c.spark.visible = looking.some(h => !looked(h.profile).includes(c.k) && !clueFound(h.profile)); c.spark.position.y = 2.6 + Math.sin(t * 3 + c.k) * .12; });
    found.visible = looking.some(h => clueFound(h.profile));
    // (an under-5's companion flies high up, as if looking from the sky, then down over the lantern: its new trick)
    for (const h of G.heroes) if (isOn(h.profile, 'c3_find') || ctx.companions().of(h)?.lead?.c3) ctx.companions().lead(h, isOn(h.profile, 'c3_find') && !big(h.profile) && !clueFound(h.profile) ? { x: lanternAt.x, y: heightAt(lanternAt.x, lanternAt.z) + 1.8, z: lanternAt.z, high: true, c3: true } : null);
    if (lights.visible) lights.userData.tint(t);
    if (mist.visible) mist.children.forEach((m, i) => { m.position.y = 2.4 + (i % 3) * .8 + Math.sin(t * .6 + i) * .15; });
    tree.visible = G.heroes.some(h => secretFor(h.profile)); if (tree.visible) koala.rotation.z = Math.sin(t * .8) * .08;
    // fireworks: a burst now and then over the water by the Opera House
    if (performance.now() / 1000 < showUntil && t > nextBurst) { nextBurst = t + .6 + Math.random() * .6;
      const col = ['#ff5fa2', '#ffd23f', '#5fb6ff', '#5fd36a', '#a66bff'][Math.floor(Math.random() * 5)], bx = ox + (Math.random() - .5) * 24 - Math.sin(rot) * 10, bz = oz + (Math.random() - .5) * 24, by = oy + 16 + Math.random() * 8;
      for (let i = 0; i < 14; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(1.2); s.position.set(bx, by, bz); scene.add(s);
        const a = i / 14 * Math.PI * 2; bursts.push({ s, v: new THREE.Vector3(Math.cos(a) * 6, (Math.random() - .5) * 6, Math.sin(a) * 6), life: 1.4 }); } }
    for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i]; b.life -= dt; b.v.y -= dt * 4; b.s.position.addScaledVector(b.v, dt); b.s.material.opacity = Math.max(0, b.life / 1.4); if (b.life <= 0) { scene.remove(b.s); b.s.material.dispose(); bursts.splice(i, 1); } }
  });

  // ---------- Chi's word game: pictures for an under-5 (two words), meanings for a big kid (four words) ----------
  async function words(h) {
    const p = h.profile, list = big(p) ? WORDS : WORDS.filter(w => w.pic === '👋' || w.pic === '🦘');
    for (const w of list) {
      const others = WORDS.filter(x => x !== w).slice(0, big(p) ? 2 : 1), opts = [w, ...others].sort((a, b) => (a.au + w.au).length % 3 - (b.au + w.au).length % 3 || a.au.localeCompare(b.au));
      // (a big kid reads the word and picks what it means; an under-5 hears it and taps the picture: no reading)
      const btn = (o, k) => big(p) ? `<button class="hp-big" data-hp="w${k}" style="width:auto;height:64px;border-radius:32px;padding:0 22px;font:700 19px/1 Fredoka,'Baloo 2',sans-serif;color:#3a2e4a">${T(o.en, o.vi)}</button>` : `<button class="hp-big" data-hp="w${k}">${pic(o.pic)}</button>`;
      const d = pad(`<p><b style="font-size:1.5em">${w.au}</b>${big(p) ? `<br>${T('What does it mean?', 'Nghĩa là gì?')}` : ''}</p><div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px">${opts.map(btn).join('')}</div>`);
      if (big(p)) say(`What does ${w.au} mean?`, `${w.au} nghĩa là gì?`); else say(`${w.au} means ${w.en}! ${STORY_LINES.c3word[0]}`, `${w.au} nghĩa là ${w.vi}! ${STORY_LINES.c3word[1]}`);
      try { await until(new Promise(res => opts.forEach((o, k) => { const b = d.querySelector<HTMLElement>(`[data-hp=w${k}]`); b.onclick = () => { if (o === w) { say(...STORY_LINES.c3right); setTimeout(res, 500); } else { say(...STORY_LINES.c3again); b.style.visibility = 'hidden'; } }; })), d); }
      finally { d.remove(); }
    }
    say(...STORY_LINES.c3wordsDone);
  }

  // ---------- the buttons (only for the child on that step) ----------
  for (const c of clueObjs) G.interactables.push({ id: 'story_clue3_' + c.k, x: c.x, z: c.z, r: 2.4, icon: c.k === RIGHT ? '⛴️' : c.k === 1 ? '🌳' : '🏖️', label: () => T('Look here', 'Tìm ở đây'),
    visible: h => ctx.actions() && isOn(h.profile, 'c3_find') && !clueFound(h.profile) && !looked(h.profile).includes(c.k), act: h => lookAt(h, c) });
  G.interactables.push({ id: 'story_c3_secret', x: kAt.x + 1.6, z: kAt.z + 1.6, r: 3, icon: '🐨', label: () => T('Say hello to the koala', 'Chào bạn koala'),
    visible: h => secretFor(h.profile), act: async h => { const L = st(h.profile); L.secret = { ...(L.secret || {}), ch3: true }; const p = h.profile; p.stickers = Array.isArray(p.stickers) ? p.stickers : []; if (!p.stickers.includes('🐨')) p.stickers.push('🐨'); save();
      await ctx.reward('🐨', T('A sleepy koala!', 'Bạn koala buồn ngủ!'), T(...STORY_LINES.c3secret)); } });
  const spots = {
    sydney: () => { const g = (city.gates || [])[0]; return g ? { x: g[0] + 4, z: g[1] } : { x: city.x1 + 4, z: city.z }; },
    chi3: () => ({ x: chiAt.x, z: chiAt.z }),
    molly: () => mollyAt,
    jack3: () => ({ x: jackAt.x, z: jackAt.z }),
    nam3: () => ({ x: namAt.x, z: namAt.z }),
    // (#735, as Hồ Gươm's #620 #647) a big kid's light shines on the nearest place still to look at, and after the clue is
    // found on the lantern, where "Pick up the lantern" waits: it shone on the harbour front, where nothing could be tapped
    clues3: p => { if (p && (!big(p) || clueFound(p))) return { x: lanternAt.x, z: lanternAt.z };
      const h = G.heroes.find(x => x.profile === p), left = p ? clueObjs.filter(c => !looked(p).includes(c.k)) : [];
      const c = h && left.length ? left.sort((a, b) => Math.hypot(a.x - h.pos.x, a.z - h.pos.z) - Math.hypot(b.x - h.pos.x, b.z - h.pos.z))[0] : left[0];
      return c ? { x: c.x, z: c.z } : { x: front.x, z: front.z }; },
    opera: () => ({ x: front.x, z: front.z })
  };
  // the steps' own buttons: Chi's words, and Jack and Ruby's challenge (their line, then Play, How to play or Later)
  const busy = new Set();
  for (const s of (CHAPTERS.find(c => c.id === 'ch3') || { steps: [] }).steps) {
    const at = spots[s.at] && spots[s.at](), base = { id: 'story_' + s.id, x: at.x + .8, z: at.z + .8, r: 3, icon: s.icon, label: () => T(s.en, s.vi) };
    if (s.words) G.interactables.push({ ...base, visible: h => isOn(h.profile, s.id) && !busy.has(h.profile),
      act: async h => { if (busy.has(h.profile)) return; busy.add(h.profile); try { await words(h); ctx.finish(h, s.id); } catch (e) { if (e !== QUIT) throw e; } finally { busy.delete(h.profile); G.paused = false; } } });
    if (s.challenge) G.interactables.push({ ...base, visible: h => isOn(h.profile, s.id), act: h => G.kidTalk(h, ctx.gamesOf(h.profile, s)[0], 'Jack', big(h.profile) ? s.challenge.big : s.challenge.little) });
  }
  return {
    spots, onStreet, front: [front.x, front.z], lanternAt: [lanternAt.x, lanternAt.z], rope, paint, revealed: clueFound, startParade,
    showOn: () => performance.now() / 1000 < showUntil, lit: () => lights.visible, opera: { x: ox, z: oz },
    clues: clueObjs.map(c => ({ k: c.k, x: c.x, z: c.z })), people: people.map(q => ({ id: q.id, x: q.x, z: q.z })), koala: { x: kAt.x, z: kAt.z }
  };
}
