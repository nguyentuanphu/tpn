// Seeing landmarks properly. Two helpers:
// · Near a landmark, the easy camera pulls back and looks more level, so the whole building fits.
// · Tapping a landmark's ℹ️ sign first flies the camera slowly round it (tap to skip), then tells the fact.
import { LANDMARKS } from './regions.js';
import { heightAt } from './world.js';
import { clamp } from './util.js';
import { T } from './i18n.js';
import { el } from './util.js';

// roughly how big each landmark is (metres), so the camera knows how far back to stand
const SIZE = {
  opera: 22, harbour: 30, uluru: 58, banana: 12, bondi: 10, lighthouse: 16, turtle: 10, onepillar: 10, chuacau: 12, benthanh: 14,
  halong: 24, hue: 20, myson: 16, phongnha: 18, trangan: 16, reef: 14, sisters: 16, exhibition: 20, kakadu: 18,
  marble: 16, hoian: 16, thehuc: 18, cairang: 18, apostles: 20, storybridge: 24, sydneytower: 24, wheel: 18, lighthouse: 16, bnclock: 14, flinders: 16, cathedral: 16, postoffice: 16, dragonbridge: 26, goldenbridge: 20,
  forbidden: 20, heaven: 16, terracotta: 14, potala: 18, qutub: 22, redfort: 20, konark: 14, hampi: 16, mahabodhi: 20
};
export const landmarkCentre = lm => {
  const x = lm.mx ?? lm.x, z = lm.mz ?? lm.z, s = SIZE[lm.id] || 14;
  return { x, z, s, y: Math.max(heightAt(x, z), 0) };
};

const camDist = c => c.s * 1.05 + 8, camHeight = c => c.y + c.s * .6 + 6;
export function createShowcase(G) {
  const W = G.world;
  // how much is in the way between a camera spot and the landmark: hills, houses and trees
  const blocked = (c, a) => {
    const D = camDist(c), px = c.x + Math.sin(a) * D, pz = c.z + Math.cos(a) * D, py = camHeight(c), ty = c.y + c.s * .3;
    let score = 0;
    for (let k = 1; k < 14; k++) {
      const f = k / 14, x = px + (c.x - px) * f, z = pz + (c.z - pz) * f, y = py + (ty - py) * f;
      if (Math.hypot(x - c.x, z - c.z) < c.s * .45) break; // reached the landmark itself
      if (heightAt(x, z) > y - .5) score += 3;
      for (const b of W.boxes) if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && y < 9) score += 2;
      for (const o of W.colliders) if (o.r > .4 && Math.hypot(x - o.x, z - o.z) < o.r + .6 && y < heightAt(o.x, o.z) + (o.r > 2 ? 8 : 7)) score += o.r > 2 ? 2 : 1;
    }
    return score;
  };
  // the most open direction to look from, preferring the side the child is standing on
  function clearestAngle(c, prefer) {
    let best = prefer, bs = 1e9;
    for (let k = 0; k < 24; k++) {
      const a = prefer + k / 24 * Math.PI * 2;
      const s = blocked(c, a - .5) + blocked(c, a) * 2 + blocked(c, a + .5) + Math.min(k, 24 - k) * .15;
      if (s < bs) { bs = s; best = a; }
    }
    return best;
  }
  // 0 (far away) .. 1 (right next to it): how much to pull the camera back for this explorer
  // Also remembers which landmark is nearest (h._lm), so the camera can turn to face it.
  G.landmarkFrame = h => {
    // the pull-back follows the biggest landmark around; the one to turn to is the closest for its size, so a
    // small landmark the child is standing at wins over a big bridge further away
    let best = 0, near = null, nf = 1;
    for (const lm of LANDMARKS) {
      const c = landmarkCentre(lm), d = Math.hypot(h.pos.x - c.x, h.pos.z - c.z), reach = c.s * 1.1 + 12;
      if (d < reach) { const k = clamp((reach - d) / (c.s * .6 + 6), 0, 1) * clamp(c.s / 20, .55, 1.3); if (k > best) best = k; if (d / reach < nf) { nf = d / reach; near = c; } }
    }
    h._lm = near;
    return best;
  };

  // the fly-around: a short swing past the landmark (about 2.5 s, or a tap), then its card opens
  G.showcase = (h, lm) => new Promise(res => {
    if (!h || G.show) return res();
    const c = landmarkCentre(lm), a0 = clearestAngle(c, Math.atan2(h.pos.x - c.x, h.pos.z - c.z));
    const wasPaused = G.paused; G.paused = true;
    const skip = el('button', 'sc-skip', '⏭️ ' + T('Skip', 'Bỏ qua'));
    const cap = el('div', 'sc-cap', `${lm.icon || '📍'} ${lm.name()}`);
    document.body.append(skip, cap); document.body.classList.add('showcasing');
    const done = () => { if (!G.show) return; G.show = null; skip.remove(); cap.remove(); document.body.classList.remove('showcasing'); G.paused = wasPaused; res(); };
    G.show = { i: h.i, c, a0, t: 0, len: 2.4 };
    skip.onclick = e => { e.stopPropagation(); done(); };
    G._showDone = done;
  });
  // the view from the top of a tall landmark (Sydney Tower, the Wheel of Brisbane…): the camera rides up and
  // turns slowly all the way round, looking out over the city and the land around it
  G.lookout = (h, x, y, z, title) => new Promise(res => {
    if (!h || G.show) return res();
    const wasPaused = G.paused; G.paused = true;
    const skip = el('button', 'sc-skip', '⏭️ ' + T('Back down', 'Xuống thôi'));
    const cap = el('div', 'sc-cap', title);
    document.body.append(skip, cap); document.body.classList.add('showcasing');
    const done = () => { if (!G.show) return; G.show = null; skip.remove(); cap.remove(); document.body.classList.remove('showcasing'); G.paused = wasPaused; res(); };
    G.show = { i: h.i, look: { x, y, z }, a0: Math.atan2(-x, -z), t: 0, len: 22 };
    skip.onclick = e => { e.stopPropagation(); done(); };
    G._showDone = done;
  });
  // called from the render loop: positions the camera while a fly-around is running
  G.showcaseCam = (i, h, dt) => {
    const S = G.show; if (!S || S.i !== i) return false;
    S.t += dt; if (S.t > S.len) { G._showDone(); return false; }
    if (S.look) { // riding up for the first 3 s, then turning right round
      // standing at the rail on the outside of the top, looking out and a little down over the land (from the
      // middle the tower's own top filled half the picture)
      const L = S.look, up = Math.min(1, S.t / 3), e = up * up * (3 - 2 * up), a = S.a0 + Math.max(0, S.t - 3) / (S.len - 3) * Math.PI * 2, R = 7;
      h.cam.position.set(L.x + Math.sin(a) * R, L.y + 3 - 14 * (1 - e), L.z + Math.cos(a) * R);
      h.cam.lookAt(L.x + Math.sin(a) * 60, L.y - 16 - 4 * (1 - e), L.z + Math.cos(a) * 60); h.camPos.copy(h.cam.position);
      return true;
    }
    const c = S.c, k = S.t / S.len, a = S.a0 + (k - .5) * (S.len > 4 ? 1.2 : .7), D = camDist(c), H = camHeight(c);
    h.cam.position.set(c.x + Math.sin(a) * D, H, c.z + Math.cos(a) * D);
    const gy = heightAt(h.cam.position.x, h.cam.position.z) + 1.5; if (h.cam.position.y < gy) h.cam.position.y = gy;
    h.cam.lookAt(c.x, c.y + c.s * .3, c.z);
    h.camPos.copy(h.cam.position);
    return true;
  };
}
