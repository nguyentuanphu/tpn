// Weather and seasons. Now and then a gentle shower comes: the sky greys, rain falls around each
// player, puddles appear (jump in them!) and the farm crops get watered. When it stops, a rainbow
// shines for a while. The season adds drifting blossoms (January to March) or autumn leaves
// (September to November). Grown-ups can switch the rain off.
import { THREE, sprite } from './gfx.js';
import { T } from './i18n.js';
import { say } from './voice.js';
import { SFX, Rain } from './audio.js';
import { settings, farm, saveFarm } from './state.js';
import { heightAt, WATER } from './world.js';
import { dist2 } from './util.js';

export function createWeather(G) {
  const { scene, world } = G;
  const S = { state: 'clear', t: 150 + Math.random() * 150, rainbowT: 0, told: {} };
  // ---------- rain: falling streaks around each player ----------
  const N = 700, rains = [0, 1].map(() => {
    const pos = new Float32Array(N * 6);
    for (let i = 0; i < N; i++) { const x = (Math.random() - .5) * 44, y = Math.random() * 26, z = (Math.random() - .5) * 44; pos.set([x, y, z, x + .05, y - .7, z], i * 6); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#cfe6ff', transparent: true, opacity: 0, depthWrite: false }));
    m.frustumCulled = false; m.visible = false; scene.add(m); return m;
  });
  // ---------- the rainbow ----------
  const rainbow = new THREE.Group();
  ['#ff4f5e', '#ff9f43', '#ffd23f', '#5fd36a', '#3cc7e8', '#6a5cf6', '#b06af6'].forEach((c, i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(110 - i * 3.4, 1.8, 6, 64, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    rainbow.add(m);
  });
  rainbow.visible = false; scene.add(rainbow);
  // ---------- puddles ----------
  const puddleMat = new THREE.MeshBasicMaterial({ color: '#7fb6d8', transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const puddles = []; let pid = 0;
  const addPuddle = (x, z) => {
    if (puddles.length > 14 || heightAt(x, z) < WATER + .5) return;
    const sl = Math.abs(heightAt(x + 1, z) - heightAt(x - 1, z)) + Math.abs(heightAt(x, z + 1) - heightAt(x, z - 1)); if (sl > .5) return;
    const r = 1 + Math.random() * .9, m = new THREE.Mesh(new THREE.CircleGeometry(r, 20).rotateX(-Math.PI / 2), puddleMat.clone());
    m.scale.set(1, 1, .7 + Math.random() * .4); m.position.set(x, world.groundAt(x, z) + .04, z); scene.add(m); puddles.push({ m, r, x, z, a: 0, life: 1, id: ++pid });
  };
  // ---------- season sprites ----------
  const month = new Date().getMonth() + 1, season = month <= 3 ? '🌸' : month >= 9 && month <= 11 ? '🍂' : null;
  const petals = season ? Array.from({ length: 14 }, (_, i) => { const s = sprite(season, .55); s.material = s.material.clone(); scene.add(s); return { s, ox: (Math.random() - .5) * 30, oz: (Math.random() - .5) * 30, y: Math.random() * 8, sp: .6 + Math.random() * .6, ph: Math.random() * 6 }; }) : [];

  const start = () => { if (settings.noRain || S.state === 'rain') return; S.state = 'rain'; S.t = 60 + Math.random() * 40; S.told.rain = false;
    // (tester's notes, 12 Oct) a child inside a house is not told to look at the sky (rain, rainbow) or rained on
    const out = G.heroes.filter(h => !h.indoors);
    out.forEach(h => G.toast(h, '🌧️ ' + T('It is raining! Look for puddles to jump in.', 'Trời mưa rồi! Tìm vũng nước để nhảy nào.'))); if (out.length) say('Pitter patter, it is raining!', 'Tí tách tí tách, trời mưa rồi!'); };
  const stop = () => { if (S.state !== 'rain') return; S.state = 'after'; S.t = 50; S.rainbowT = 50;
    const out = G.heroes.filter(h => !h.indoors);
    out.forEach(h => G.toast(h, '🌈 ' + T('The rain stopped. Look, a rainbow!', 'Tạnh mưa rồi. Nhìn kìa, cầu vồng!'))); if (out.length) { say('Look up! A rainbow!', 'Nhìn lên kìa! Cầu vồng!'); SFX.chime(); G.lookUpT = 8; } };

  let cropT = 0, spawnT = 0;
  const _f = new THREE.Vector3();
  world.updaters.push((dt, t) => {
    if (!G.heroes.length) return;
    S.t -= dt;
    if (S.state === 'clear' && S.t <= 0) { if (settings.noRain) S.t = 120; else start(); }
    else if (S.state === 'rain' && (S.t <= 0 || settings.noRain)) stop();
    else if (S.state === 'after' && S.t <= 0) { S.state = 'clear'; S.t = 240 + Math.random() * 240; }
    const raining = S.state === 'rain';
    world.overcast += ((raining ? 1 : 0) - world.overcast) * Math.min(1, dt * .6);
    // rain streaks
    rains.forEach((m, i) => {
      const h = G.heroes[i]; m.visible = !!h && !h.indoors && world.overcast > .05;
      if (!m.visible) return;
      m.material.opacity = world.overcast * (settings.calm ? .35 : .6);
      m.position.set(h.pos.x, h.pos.y - 2 + 26 - ((t * 22 + i * 7) % 26), h.pos.z);
    });
    Rain.set(raining);
    if (raining) {
      // water the farm
      cropT -= dt; if (cropT <= 0) {
        cropT = 4; let n = 0; farm.plots.forEach(p => { if (p && !p.water && p.stage < 3) { p.water = true; p.t = Date.now(); n++; } });
        if (n) { saveFarm(); if (!S.told.rain) { S.told.rain = true; G.heroes.forEach(h => G.toast(h, '🌱 ' + T('The rain is watering your farm!', 'Mưa đang tưới nông trại của con!'))); } }
      }
      spawnT -= dt; if (spawnT <= 0) { spawnT = 1.5; G.heroes.filter(h => !h.indoors).forEach(h => { const a = Math.random() * 6.28, r = 4 + Math.random() * 14; addPuddle(h.pos.x + Math.cos(a) * r, h.pos.z + Math.sin(a) * r); }); }
    }
    // puddles: fill while raining, dry out afterwards; splash when walked or jumped in
    for (let i = puddles.length - 1; i >= 0; i--) {
      const P = puddles[i];
      P.a = Math.min(.55, P.a + dt * (raining ? .4 : 0)); if (!raining) P.life -= dt / 90;
      P.m.material.opacity = P.a * Math.min(1, P.life * 3);
      if (P.life <= 0) { scene.remove(P.m); puddles.splice(i, 1); continue; }
      G.heroes.forEach(h => {
        if (dist2(h.pos.x, h.pos.z, P.x, P.z) > P.r || Math.abs(h.pos.y - P.m.position.y) > .6) { h['_pd' + P.id] = false; return; }
        const landed = h.onGround && h._wasAir, moving = h.speed > 1;
        if ((landed || moving) && !h['_pd' + P.id]) {
          h['_pd' + P.id] = true; SFX.splash(); G.fx(h.pos.x, h.pos.y + .4, h.pos.z, '💦');
          if (landed) { h.cheerT = .8; const q = h.profile.quests || {}; if (!q.puddle) { q.puddle = true; G.toast(h, '💦 ' + T('Puddle jump! Splash!', 'Nhảy vũng nước! Tõm!')); G.save(); } }
        }
      });
    }
    G.heroes.forEach(h => { h._wasAir = !h.onGround; });
    // the rainbow, in front of the first player's camera
    S.rainbowT = Math.max(0, S.rainbowT - dt);
    const ra = Math.min(1, S.rainbowT / 6) * Math.min(1, (50 - S.rainbowT) / 4);
    rainbow.visible = ra > .01;
    if (rainbow.visible) {
      const h = G.heroes[0]; _f.set(-Math.sin(h.camYaw), 0, -Math.cos(h.camYaw));
      rainbow.position.set(h.pos.x + _f.x * 210, heightAt(h.pos.x, h.pos.z) - 12, h.pos.z + _f.z * 210); rainbow.rotation.y = h.camYaw;
      rainbow.children.forEach(m => m.material.opacity = ra * .55);
    }
    // drifting blossoms or leaves near the first player
    if (petals.length) {
      const h = G.heroes[0], on = !settings.calm && !raining;
      petals.forEach(p => {
        p.s.visible = on; if (!on) return;
        p.y -= dt * p.sp; if (p.y < -1) { p.y = 8; p.ox = (Math.random() - .5) * 30; p.oz = (Math.random() - .5) * 30; }
        p.s.position.set(h.pos.x + p.ox + Math.sin(t + p.ph) * 1.5, h.pos.y + p.y, h.pos.z + p.oz + Math.cos(t * .8 + p.ph));
      });
    }
  });
  return { start, stop, state: () => S.state };
}
