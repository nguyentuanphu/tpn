// Treasure chests for two (round G, owner: "in-game quests with prizes"): six chests around the valley, each between two
// round stone plates. A chest only opens when two children stand on its two plates at the same time: two players on
// one device, or a child and a friend online (friends' positions already come over the network, so each device sees
// both plates taken and opens it for its own child). The prize: coins, a treat for the bag, and with the first chest a
// "best friends" sticker. Each child keeps which chests they opened (profile.chests); a child alone on a plate hears
// that a friend is needed on the other one. Finding them: Pad → Adventures lists how many are open.
import { THREE, P, merge, toonVC, sprite } from './gfx.js';
import { T } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { farm, saveFarm } from './state.js';
import { HOME, VILLAGE, LAKE, BAMBOO, PADDIES, roadDist, heightAt } from './world.js';
import { ITEMS } from './data.js';
import { events } from './core/events.js';
import { id as makeId } from './core/ids.js';
import { stream } from './core/rng.js';
import { pic } from './art.js';

// where the six chests are (near these places; each finds clear ground off the roads by itself)
const NEAR = [['farm', HOME.x + 14, HOME.z - 6], ['village', VILLAGE.x - 20, VILLAGE.z - 16], ['lake', LAKE.x - 30, LAKE.z - 30], ['bamboo', BAMBOO.x + 20, BAMBOO.z - 10], ['paddies', PADDIES.x - 22, PADDIES.z + 10], ['meadow', VILLAGE.x - 60, VILLAGE.z + 30]];
export const PLATE_R = 1.1, PRIZE_COINS = 20;
const TREATS = ['mango', 'banana', 'egg', 'fish', 'mushroom', 'bean'];

export function createTwinChests(G, { toast, save }) {
  const { scene } = G;
  const offRoad = (x, z) => { const d = roadDist(x, z); return !d.road || d.d > d.road.w / 2 + 1.2; };
  const chests = [];
  for (const [id, x0, z0] of NEAR) {
    // the chest and both plates on dry, clear ground, off every road
    let spot = null;
    for (let k = 0; k < 24 && !spot; k++) {
      const [cx, cz] = G.clearSpot(x0 + (k % 6) * 3, z0 + Math.floor(k / 6) * 3, 1.2), a = (k * 0.7) % Math.PI;
      const px = Math.cos(a) * 2.2, pz = Math.sin(a) * 2.2, plates = [[cx + px, cz + pz], [cx - px, cz - pz]];
      if ([[cx, cz], ...plates].every(([x, z]) => offRoad(x, z) && G.clearSpot(x, z, .8)[0] === x)) spot = { cx, cz, plates };
    }
    if (!spot) continue;
    const g = new THREE.Group(), y = heightAt(spot.cx, spot.cz);
    const body = new THREE.Mesh(merge([P(new THREE.BoxGeometry(1.2, .7, .8), '#a0662f', [0, .35, 0]), P(new THREE.BoxGeometry(1.24, .1, .84), '#f2c94c', [0, .2, 0]), P(new THREE.BoxGeometry(.16, .22, .06), '#f2c94c', [0, .55, .42])]), toonVC());
    const lid = new THREE.Mesh(merge([P(new THREE.BoxGeometry(1.24, .26, .84), '#b8743a', [0, .13, .42]), P(new THREE.BoxGeometry(1.26, .06, .86), '#f2c94c', [0, .02, .42])]), toonVC());
    lid.position.set(0, .7, -.42); g.add(body, lid); g.position.set(spot.cx, y, spot.cz); scene.add(g);
    const plates = spot.plates.map(([x, z]) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(PLATE_R, PLATE_R, .12, 24), new THREE.MeshStandardMaterial({ color: '#c9c3b6', emissive: '#ffd23f', emissiveIntensity: 0, roughness: .8 }));
      m.position.set(x, heightAt(x, z) + .06, z); scene.add(m); return { x, z, m };
    });
    const tag = sprite('🤝', 1); tag.position.set(spot.cx, y + 1.9, spot.cz); scene.add(tag);
    chests.push({ id, x: spot.cx, z: spot.cz, g, lid, plates, tag, open: 0 });
  }
  // who is standing on a plate: my heroes, and friends online
  const standers = () => [...G.heroes.map(h => ({ me: h, x: h.pos.x, z: h.pos.z })), ...Object.values(G.partners || {}).filter(p => p.pos && p.pos.y > -40).map(p => ({ me: null, x: p.pos.x, z: p.pos.z }))];
  const on = (pl, s) => Math.hypot(s.x - pl.x, s.z - pl.z) <= PLATE_R;
  let hintT = 0, t = 0;
  function step(dt) {
    t += dt; if (t < .25) return; t = 0; hintT -= .25;
    const all = standers();
    for (const c of chests) {
      const who = c.plates.map(pl => all.filter(s => on(pl, s)));
      c.plates.forEach((pl, k) => { pl.m.material.emissiveIntensity = who[k].length ? .6 : 0; });
      const mine = G.heroes.filter(h => c.plates.some(pl => on(pl, { x: h.pos.x, z: h.pos.z })));
      if (!mine.length) continue;
      // two different children, one on each plate
      const pairOk = who[0].length && who[1].length && (who[0].some(a => who[1].some(b => a !== b)) || who[0].length > 1 || who[1].length > 1);
      if (pairOk) { for (const h of mine) openFor(h, c); continue; }
      if (hintT <= 0 && !mine.every(h => (h.profile.chests || {})[c.id])) { hintT = 8; G.huds[mine[0].i] && G.huds[mine[0].i].toast(`🤝 ${T('A friend must stand on the other stone!', 'Cần một bạn đứng lên hòn đá kia!')}`); say('This chest needs two friends! Ask a friend to stand on the other stone.', 'Rương này cần hai bạn! Nhờ một bạn đứng lên hòn đá kia nhé.'); }
    }
    for (const c of chests) if (c.open > 0) { c.open = Math.max(0, c.open - .25); c.lid.rotation.x = -Math.min(1.2, (3 - c.open) * 1.2); }
  }
  function openFor(h, c) {
    const p = h.profile, got = p.chests = p.chests || {};
    if (got[c.id]) return;
    const first = !Object.keys(got).length; got[c.id] = Date.now();
    const r = stream('chest/' + c.id), treat = TREATS[r.int(0, TREATS.length - 1)];
    farm.coins += PRIZE_COINS; saveFarm(); p.inv[treat] = (p.inv[treat] || 0) + 2;
    if (first && !p.stickers.includes('🤝')) p.stickers.push('🤝');
    save(); c.open = 3; SFX.fanfare && SFX.fanfare(); G.celebrate && G.celebrate(h);
    toast(h, `🎁 ${T('Treasure!', 'Kho báu!')} +${PRIZE_COINS} 💰 · 2 ${ITEMS[treat].icon} ${ITEMS[treat].name()}${first ? ' · 🤝 ' + T('Best-friends sticker!', 'Hình dán bạn thân!') : ''}`);
    say('You opened the treasure chest together!', 'Các con đã cùng nhau mở rương kho báu!');
    events.emit('ProgressChanged', { profileId: makeId('player', p.id || 'guest'), what: 'chest', chestId: makeId('chest', c.id) });
  }
  G.world.updaters.push(step);
  return {
    chests,
    // Pad → Adventures: how many treasure chests this child opened
    html: p => `<h3>${pic('🎁')} ${T('Treasure chests for two', 'Rương kho báu cho hai bạn')} ${Object.keys(p.chests || {}).length}/${chests.length}</h3><p class="note">${T('Each chest opens when two friends stand on its two stones at the same time.', 'Mỗi rương mở khi hai bạn cùng đứng lên hai hòn đá của nó.')}</p>`,
    tick: () => { t = 1; step(0); }
  };
}
