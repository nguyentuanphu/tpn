// Secret side quests: nothing on the quest list points at these. Children find them by exploring,
// by trying things (shaking trees, visiting at night) or from gossip the villagers share.
import { THREE, sprite } from './gfx.js';
import { T } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { heightAt, VILLAGE, BAMBOO, LAKE, WATER } from './world.js';
import { WORLD as MAP_WORLD, landmarkAt } from './content/map.js';
import { dist2, pick } from './util.js';

export const SECRETS = [
  { id: 'golden', icon: '🍏', name: () => T('The Golden Apple', 'Quả Táo Vàng'), hint: () => T('Old trees sometimes drop something shiny when you shake them…', 'Cây táo già thỉnh thoảng rơi ra thứ gì đó lấp lánh khi rung…'),
    story: () => T('A golden apple! Grandma says it brings a whole year of sweet dreams.', 'Một quả táo vàng! Bà bảo nó mang lại cả năm giấc mơ ngọt ngào.') },
  { id: 'cat', icon: '🐈', name: () => T('The Rooftop Cat', 'Chú Mèo Trên Mái Nhà'), hint: () => T('Someone sleeps on a roof in Lotus Village. Look up!', 'Có ai đó đang ngủ trên mái nhà ở Làng Sen. Nhìn lên nhé!'),
    story: () => T('Meow! Mít the cat wakes up, stretches, and purrs. She has a new friend!', 'Meo! Mèo Mít thức dậy, vươn vai và rừ rừ. Mèo có bạn mới rồi!') },
  { id: 'bell', icon: '🔔', name: () => T('The Hidden Bell', 'Chiếc Chuông Bí Mật'), hint: () => T('Deep in the bamboo forest, a bell waits to be rung.', 'Sâu trong rừng tre có một chiếc chuông đang chờ được rung.'),
    story: () => T('Ding… dong… The bamboo whispers back. The forest says thank you.', 'Boong… boong… Rừng tre thì thầm đáp lại. Khu rừng cảm ơn con.') },
  { id: 'bottle', icon: '🍾', name: () => T('Message in a Bottle', 'Lá Thư Trong Chai'), hint: () => T('The waves bring presents to the beach of Mirror Lake.', 'Sóng mang quà đến bờ cát Hồ Gương.'),
    story: () => T('The letter says: "Hello from a child far across the sea in Australia! Let’s be friends!"', 'Lá thư viết: "Xin chào từ một bạn nhỏ ở nước Úc xa xôi bên kia biển! Mình làm bạn nhé!"') },
  { id: 'snowman', icon: '⛄', name: () => T('Snowman on the Peak', 'Người Tuyết Trên Đỉnh Núi'), hint: () => T('Someone built a snowman at the very top of Snowcap Peaks.', 'Ai đó đã đắp người tuyết trên đỉnh cao nhất Núi Tuyết.'),
    story: () => T('You found the snowman at the top of the world! He gives you a cold, happy hug.', 'Con tìm thấy người tuyết trên đỉnh cao nhất! Bạn ấy ôm con một cái thật mát và vui.') },
  { id: 'wish', icon: '🌠', name: () => T('A Wish on a Star', 'Điều Ước Sao Băng'), hint: () => T('The Lotus Statue listens to wishes… but only at night.', 'Tượng Sen lắng nghe điều ước… nhưng chỉ vào ban đêm.'),
    story: () => T('A shooting star zooms across the sky. Your wish is a secret between you and the stars.', 'Một ngôi sao băng vụt qua bầu trời. Điều ước của con là bí mật giữa con và các vì sao.') },
  { id: 'fireflies', icon: '✨', name: () => T('Firefly Friends', 'Bạn Đom Đóm'), hint: () => T('At night, tiny lights dance in the bamboo forest and the village. Tap five!', 'Ban đêm, những đốm sáng nhỏ nhảy múa trong rừng tre và trong làng. Chạm vào năm bạn nhé!'),
    story: () => T('Five fireflies glow around you like a little lantern. Then they fly home to bed.', 'Năm bạn đom đóm sáng quanh con như một chiếc đèn lồng nhỏ, rồi bay về nhà đi ngủ.') },
  { id: 'ducks', icon: '🦆', name: () => T('Duck Parade', 'Đoàn Vịt Diễu Hành'), hint: () => T('The ducks of Mirror Lake are always hungry. Feed them three times!', 'Đàn vịt ở Hồ Gương lúc nào cũng đói. Cho vịt ăn ba lần nhé!'),
    story: () => T('Quack quack! The ducks line up and march in a parade, just for you.', 'Cạp cạp! Đàn vịt xếp hàng diễu hành, chỉ để chào con.') },
  { id: 'moondance', icon: '🌙', name: () => T('Moonlight Dance', 'Điệu Nhảy Dưới Trăng'), hint: () => T('The stage is magical when the moon is up.', 'Sân khấu trở nên kỳ diệu khi trăng lên.'),
    story: () => T('You danced under the moon! Even the owls came out to watch.', 'Con nhảy múa dưới ánh trăng! Cả những chú cú cũng ra xem.') },
  { id: 'skyglide', icon: '🪂', name: () => T('Sky Explorer', 'Nhà Thám Hiểm Bầu Trời'), hint: () => T('Glide for a long, long time without touching the ground.', 'Lượn thật lâu, thật lâu mà không chạm đất.'),
    story: () => T('You glided like a bird over the whole valley. What a view!', 'Con lượn như chim bay qua cả thung lũng. Cảnh đẹp quá!') }
];

export function createSecrets(G) {
  const { scene, world } = G;
  const S = { apples: [] };
  G.tapTargets = G.tapTargets || [];

  async function unlock(h, id) {
    const p = h.profile; p.secrets = p.secrets || {};
    if (p.secrets[id]) return false;
    p.secrets[id] = true; G.addCoins(15); const st = G.giveSticker(p); G.save();
    const s = SECRETS.find(x => x.id === id); SFX.secret();
    const n = Object.keys(p.secrets).length;
    await G.reward(s.icon, T('Secret found!', 'Tìm ra bí mật!') + ' ' + s.name(), s.story() + ' ' + T(`(${n}/${SECRETS.length} secrets)`, `(${n}/${SECRETS.length} bí mật)`) + (st ? ' ' + st : ''));
    say(s.story(), s.story());
    return true;
  }
  S.unlock = unlock;
  S.hint = h => { const left = SECRETS.filter(s => !(h.profile.secrets || {})[s.id]); return left.length ? pick(left).hint() : null; };

  // ---------- shaking a tree: apples really fall, bounce and roll; tap or walk over them to pick up ----------
  const appleGeo = new THREE.SphereGeometry(.22, 12, 10);
  const red = new THREE.MeshStandardMaterial({ color: '#e8333a', roughness: .35 }), gold = new THREE.MeshStandardMaterial({ color: '#ffcf3a', roughness: .2, metalness: .6, emissive: '#5a3b00' });
  G.shakeTree = (h, t) => {
    SFX.whoosh(); h.cheerT = .6;
    const n = 3 + Math.floor(Math.random() * 3), golden = Math.random() < .14 && !(h.profile.secrets || {}).golden;
    for (let k = 0; k < n; k++) {
      const isGold = golden && k === 0;
      const m = new THREE.Mesh(appleGeo, isGold ? gold : red); m.castShadow = true;
      const a = Math.random() * 6.28, r = .8 + Math.random() * 1.6;
      m.position.set(t.x + Math.cos(a) * r, heightAt(t.x, t.z) + 3.6 + Math.random(), t.z + Math.sin(a) * r);
      scene.add(m);
      const ap = { m, vy: 0, vx: Math.cos(a) * 1.5, vz: Math.sin(a) * 1.5, gold: isGold, life: 40, delay: k * .12 };
      m.userData.it = { x: m.position.x, z: m.position.z, r: 2.2, act: hh => pickApple(hh, ap) };
      S.apples.push(ap); G.tapTargets.push(m);
    }
    say('Shake shake! Apples are falling!', 'Rung rung! Táo rơi kìa!');
  };
  function pickApple(h, ap) {
    if (ap.gone) return; ap.gone = true; scene.remove(ap.m);
    G.tapTargets.splice(G.tapTargets.indexOf(ap.m), 1);
    if (ap.gold) { unlock(h, 'golden'); return; }
    h.profile.inv.apple = (h.profile.inv.apple || 0) + 1; G.save(); SFX.pop(3); G.fx(ap.m.position.x, ap.m.position.y + .6, ap.m.position.z, '🍎');
  }
  world.updaters.push((dt, t) => {
    S.apples = S.apples.filter(ap => {
      if (ap.gone) return false;
      if ((ap.delay -= dt) > 0) return true;
      const p = ap.m.position, g = heightAt(p.x, p.z) + .2;
      ap.vy -= 18 * dt; p.y += ap.vy * dt; p.x += ap.vx * dt; p.z += ap.vz * dt; ap.vx *= .98; ap.vz *= .98;
      if (p.y < g) { p.y = g; if (Math.abs(ap.vy) > 1.5) { ap.vy = -ap.vy * .45; SFX.bump(); } else ap.vy = 0; ap.vx *= .8; ap.vz *= .8; }
      ap.m.rotation.x += ap.vx * dt * 3; ap.m.rotation.z -= ap.vz * dt * 3;
      ap.m.userData.it.x = p.x; ap.m.userData.it.z = p.z;
      // walking over a fallen apple picks it up
      for (const h of G.heroes) if (ap.vy === 0 && dist2(h.pos.x, h.pos.z, p.x, p.z) < .9) pickApple(h, ap);
      if ((ap.life -= dt) < 0) { scene.remove(ap.m); G.tapTargets.splice(G.tapTargets.indexOf(ap.m), 1); return false; }
      return !ap.gone;
    });
  });

  // ---------- secret things placed in the world (no bubble icon - they are secrets!) ----------
  const hidden = (id, x, z, r, act, extra = {}) => G.interactables.push(Object.assign({ id: 'secret_' + id, x, z, r, icon: '❔', label: () => T('What is this?', 'Cái gì đây?'), act, visible: h => !(h.profile.secrets || {})[id] }, extra));
  // rooftop cat
  const V = VILLAGE, cx = V.x + 20, cz = V.z + 14;
  const cat = sprite('🐈', 1.3); cat.position.set(cx, heightAt(cx, cz) + 6.4, cz); scene.add(cat);
  cat.userData.it = { x: cx, z: cz, r: 9, act: h => { SFX.meow(); unlock(h, 'cat'); } }; G.tapTargets.push(cat);
  world.updaters.push((dt, t) => { cat.position.y = heightAt(cx, cz) + 6.4 + Math.abs(Math.sin(t * .8)) * .06; });
  // bell in the bamboo
  const bx = BAMBOO.x - 18, bz = BAMBOO.z - 14;
  const bell = sprite('🔔', 1.1); bell.position.set(bx, heightAt(bx, bz) + 2.2, bz); scene.add(bell);
  const post = new THREE.Mesh(new THREE.BoxGeometry(2.2, .15, .15), new THREE.MeshStandardMaterial({ color: '#7a5236' })); post.position.set(bx, heightAt(bx, bz) + 2.9, bz); scene.add(post);
  hidden('bell', bx, bz, 2.6, h => { [0, .6, 1.2].forEach(d => setTimeout(() => SFX.chime(), d * 1000)); unlock(h, 'bell'); });
  // bottle on the beach
  const [beachX, beachZ] = landmarkAt('bondi'), ox = beachX + 14, oz = beachZ + 4; // (round T: on the southern beach)
  const bottle = sprite('🍾', .9); bottle.position.set(ox, Math.max(heightAt(ox, oz), WATER) + .45, oz); scene.add(bottle);
  hidden('bottle', ox, oz, 2.4, h => unlock(h, 'bottle'));
  // snowman on the highest summit
  // (round T: where to look comes from the map, js/content/map.js WORLD.summit)
  const SU = MAP_WORLD.summit; let best = { h: -1e9, x: (SU.x0 + SU.x1) / 2, z: -150 };
  for (let x = SU.x0; x <= SU.x1; x += 6) for (let z = SU.z0; z <= SU.z1; z += 6) { const y = heightAt(x, z); if (y > best.h && x > SU.x0 && x < SU.x1 && z > SU.zMin) best = { h: y, x, z }; }
  const snow = sprite('⛄', 2); snow.position.set(best.x, best.h + 1.1, best.z); scene.add(snow);
  hidden('snowman', best.x, best.z, 3, h => unlock(h, 'snowman'), { y: best.h });
  S.summit = best;
  // ducks of Mirror Lake
  const dx = LAKE.x - LAKE.r * .78, dz = LAKE.z - LAKE.r * .78; // (on the shore, from the lake's own size)
  G.interactables.push({ id: 'secret_ducks', x: dx, z: dz, r: 3, icon: '🦆', label: () => T('Feed the ducks', 'Cho vịt ăn'), act: h => {
    SFX.quack(); G.fx(dx, heightAt(dx, dz) + 1, dz, '🍞'); h.profile.duckFeeds = (h.profile.duckFeeds || 0) + 1; G.save();
    if (h.profile.duckFeeds >= 3) unlock(h, 'ducks'); else say('Quack! More please!', 'Cạp cạp! Cho thêm nữa đi!');
  } });
  // fireflies at night (tap them)
  world.fireflies.forEach(f => { f.s.scale.setScalar(.45); f.s.userData.it = { x: f.ox, z: f.oz, r: 30, act: h => {
    if (!world.isNight() || f.caught > performance.now() / 1000) return;
    f.caught = performance.now() / 1000 + 60; SFX.sparkle ? SFX.sparkle() : SFX.chime();
    h.profile.fireflies = (h.profile.fireflies || 0) + 1; G.save(); if (h.profile.fireflies >= 5) unlock(h, 'fireflies'); else say(`${h.profile.fireflies}!`, `${h.profile.fireflies}!`);
  } }; G.tapTargets.push(f.s); });

  // ---------- secrets found by doing things ----------
  world.updaters.push((dt) => {
    G.heroes.forEach(h => {
      if (h._dancing && world.isNight()) unlock(h, 'moondance');
      if (h.gliding) { h._glideT = (h._glideT || 0) + dt; if (h._glideT > 18) unlock(h, 'skyglide'); } else h._glideT = 0;
    });
  });
  return S;
}
