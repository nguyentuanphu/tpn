// Pets: every child can adopt up to two pets and give them names. Pets follow their owner, sniff out
// hidden Leafies, can be patted, and if their owner runs out of energy in deep water the child calls
// their pet, kicks their legs, and the pet pulls them back to the shore.
import { THREE, sprite } from './gfx.js';
import { T, onLang } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { profiles, saveProfiles, farm, saveFarm } from './state.js';
import { WATER, heightAt, LEAFIES, HOME } from './world.js';
import { animalModel, PETS } from './farm.js';
import { fmt, spoken } from './money.js';
import { el, esc, dist2, wait } from './util.js';
import { modal, toast } from './ui.js';
// (PERF-001) the hats' drawings (js/kidplay.js) load when a pet first wears one, not with the game's start
let buildHat = null;

export const MAX_PETS = 2;
// little pets were easy to lose in the grass: they are shown a bit bigger (the smallest the most)
const PET_SCALE = { puppy: 1.3, kitty: 1.45, bunny: 1.55, panda: 1.35, joey: 1.4, calf: 1.25 };
// (issue #738) a pet wears a hat from the child's hats (bought with the coin goal, chosen in the Backpack's "Pets & Buddy"):
// it sits on top of the head, at the front of the model, sized to the pet
const _box = new THREE.Box3();
export function putHat(obj, id) {
  if (id && !buildHat) { import('./kidplay.js').then(m => { buildHat = m.buildHat; if (obj.userData.wantHat === id) putHat(obj, id); }); obj.userData.wantHat = id; return null; }
  obj.userData.wantHat = id;
  if (obj.userData.hat) { obj.remove(obj.userData.hat); obj.userData.hat = null; }
  if (!id) return null;
  const at = obj.position.clone(), rot = obj.rotation.y; obj.position.set(0, 0, 0); obj.rotation.y = 0; obj.updateMatrixWorld(true);
  _box.setFromObject(obj); obj.position.copy(at); obj.rotation.y = rot;
  const s = obj.scale.x || 1, top = _box.max.y / s, front = _box.max.z / s, size = Math.max(.4, _box.max.y - _box.min.y);
  const hat = buildHat(id); hat.position.set(0, top - .04, front * .55); hat.scale.setScalar(size * 1.9 / s);
  obj.add(hat); obj.userData.hat = hat; return hat;
}
const NAME_IDEAS = ['Lucky', 'Mochi', 'Bông', 'Milo', 'Xoài', 'Coco', 'Bơ', 'Pepper', 'Mít', 'Biscuit', 'Kiwi', 'Tofu'];
export const petName = pt => pt.name || PETS[pt.kind].name();

// a name tag that follows the language when the pet has no name yet
function tag(textFn) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const draw = () => { const s = textFn(); x.clearRect(0, 0, 256, 64); x.font = 'bold 32px Fredoka, "Baloo 2", sans-serif'; const w = Math.min(250, x.measureText(s).width + 30); x.fillStyle = 'rgba(255,255,255,.92)'; x.beginPath(); x.roundRect((256 - w) / 2, 8, w, 46, 23); x.fill(); x.strokeStyle = '#ff9fc8'; x.lineWidth = 4; x.stroke(); x.fillStyle = '#5a2a4a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, 128, 32, 236); t.needsUpdate = true; };
  draw(); onLang(draw);
  const s: THREE.Sprite & { redraw?: () => void } = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(2.2, .55, 1); s.redraw = draw; return s;
}

export function createPets(G) {
  const { scene, world } = G;
  // move older saves (one shared list of pets) onto the children: each child starts with a puppy
  // pets that are not following a child live in the pet yard on the farm (farm.petYard), so none are ever lost
  if (!Array.isArray(farm.petYard)) farm.petYard = [];
  profiles.forEach((p, i) => {
    if (Array.isArray(p.pets)) return;
    const old = (i === 0 && Array.isArray(farm.pets) ? farm.pets : ['puppy']).filter(k => PETS[k]);
    const kinds = old.slice(0, MAX_PETS);
    p.pets = (kinds.length ? kinds : ['puppy']).map(kind => ({ kind, name: '' }));
    // older saves could have bought more than two: the rest go to the yard instead of disappearing
    if (i === 0) old.slice(MAX_PETS).forEach(kind => farm.petYard.push({ kind, name: '' }));
  });
  saveProfiles(); saveFarm();

  let live = []; // { h, pt, obj, tag, sniff, j }
  const P: Record<string, any> = {};
  P.sync = () => {
    live.forEach(L => { scene.remove(L.obj); scene.remove(L.tag); scene.remove(L.sniff); });
    live = [];
    G.heroes.forEach(h => {
      if (!Array.isArray(h.profile.pets)) h.profile.pets = [{ kind: 'puppy', name: '' }];
      h.profile.pets.slice(0, MAX_PETS).forEach((pt, j) => {
        const obj = animalModel(pt.kind); obj.scale.multiplyScalar(PET_SCALE[pt.kind] || 1.3); if (pt.hat) putHat(obj, pt.hat); obj.position.set(h.pos.x - 1.5 + j * 3, h.pos.y, h.pos.z - 1.5); scene.add(obj);
        const tg = tag(() => petName(pt)); scene.add(tg);
        const sn = sprite('👃', .9); sn.visible = false; scene.add(sn);
        const L = { h, pt, obj, tag: tg, sniff: sn, j, barkT: 3 + j * 2, hop: 0 }; live.push(L);
        obj.userData.react = () => { const d = PETS[pt.kind]; SFX[d.snd] && SFX[d.snd](); L.hop = .8; G.fx(obj.position.x, obj.position.y + 1, obj.position.z, '💕'); };
      });
    });
  };
  P.forHero = h => live.filter(L => L.h === h);
  P.nameOf = petName; P.max = MAX_PETS;

  // ---------- the pet yard on the farm ----------
  const yardC = G.farm && G.farm.spots && G.farm.spots.hutch ? { x: G.farm.spots.hutch.x + 5, z: G.farm.spots.hutch.z + 4 } : { x: HOME.x - 14, z: HOME.z - 10 };
  let yard = []; // { pt, obj, tag, tx, tz, hop }
  {
    // a little picket fence and a sign
    const parts = [];
    for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; if (k === 5) continue; const m = new THREE.Mesh(new THREE.BoxGeometry(.14, .8, .14), new THREE.MeshToonMaterial({ color: '#ffffff' })); m.position.set(yardC.x + Math.cos(a) * 4.2, heightAt(yardC.x + Math.cos(a) * 4.2, yardC.z + Math.sin(a) * 4.2) + .4, yardC.z + Math.sin(a) * 4.2); scene.add(m); parts.push(m); }
    const sg = sprite('🐾', 1.3); sg.position.set(yardC.x, heightAt(yardC.x, yardC.z) + 2.6, yardC.z); scene.add(sg);
  }
  P.syncYard = () => {
    yard.forEach(Y => { scene.remove(Y.obj); scene.remove(Y.tag); }); yard = [];
    farm.petYard.forEach((pt, k) => {
      const obj = animalModel(pt.kind), a = k * 2.2; obj.scale.multiplyScalar(PET_SCALE[pt.kind] || 1.3); obj.position.set(yardC.x + Math.cos(a) * 2, heightAt(yardC.x, yardC.z), yardC.z + Math.sin(a) * 2); scene.add(obj);
      const tg = tag(() => petName(pt)); scene.add(tg);
      const Y = { pt, obj, tag: tg, tx: obj.position.x, tz: obj.position.z, hop: 0 }; yard.push(Y);
      obj.userData.react = () => { const d = PETS[pt.kind]; SFX[d.snd] && SFX[d.snd](); Y.hop = .8; G.fx(obj.position.x, obj.position.y + 1, obj.position.z, '💕'); };
    });
  };
  P.yardMeshes = () => yard.map(Y => Y.obj);
  world.updaters.push((dt, t) => yard.forEach(Y => {
    const o = Y.obj, dx = Y.tx - o.position.x, dz = Y.tz - o.position.z, d = Math.hypot(dx, dz);
    if (d < .2) { if (Math.random() < dt * .4) { const a = Math.random() * 6.28, r = Math.random() * 3.2; Y.tx = yardC.x + Math.cos(a) * r; Y.tz = yardC.z + Math.sin(a) * r; } }
    else { o.rotation.y = Math.atan2(dx, dz); o.position.x += dx / d * dt * 1.2; o.position.z += dz / d * dt * 1.2; }
    o.position.y = heightAt(o.position.x, o.position.z) + (Y.hop > 0 ? Math.abs(Math.sin(Y.hop * 9)) * .5 : d > .2 ? Math.abs(Math.sin(t * 10)) * .08 : 0); Y.hop = Math.max(0, Y.hop - dt);
    Y.tag.position.set(o.position.x, o.position.y + 1.4, o.position.z);
  }));
  G.interactables.push({ id: 'petyard', x: yardC.x, z: yardC.z, r: 5, icon: '🐾', bubble: '🐾', label: () => T('Pet yard: play with your pets', 'Sân thú cưng: chơi với thú cưng'), act: h => P.openAdopt(h) });


  // pat a pet: tap it (the bubble button), or press the action button next to it
  const patIts = [];
  P.refreshInteractables = () => {
    patIts.forEach(it => { const k = G.interactables.indexOf(it); if (k >= 0) G.interactables.splice(k, 1); }); patIts.length = 0;
    live.forEach((L, k) => {
      const it = { id: 'pat' + k, get x() { return L.obj.position.x; }, get z() { return L.obj.position.z; }, r: 1.8, icon: '💕',
        visible: h => h === L.h && !h.carry, label: () => T('Pat ', 'Vuốt ve ') + petName(L.pt),
        act: h => { const d = PETS[L.pt.kind]; SFX[d.snd] && SFX[d.snd](); L.hop = .8; G.fx(L.obj.position.x, L.obj.position.y + 1, L.obj.position.z, '💕'); G.job && G.job('pet');
          if (!L.pt.name) { setTimeout(() => P.openName(L.h, L.pt), 400); } else say(`${petName(L.pt)} loves you!`, `${petName(L.pt)} thương con lắm!`); } };
      patIts.push(it); G.interactables.push(it);
    });
  };
  P.react = obj => { const L = live.find(L => L.obj === obj || L.obj.getObjectById(obj.id)); if (!L) return false; const d = PETS[L.pt.kind]; SFX[d.snd] && SFX[d.snd](); L.hop = .8; G.fx(L.obj.position.x, L.obj.position.y + 1, L.obj.position.z, '💕'); return true; };
  P.meshes = () => live.map(L => L.obj);

  // ---------- following, swimming and sniffing ----------
  const _v = new THREE.Vector3();
  world.updaters.push((dt, t) => {
    live.forEach(L => {
      const h = L.h, o = L.obj;
      if (L.rescue) return; // the rescue moves this pet
      const back = 1.7, side = L.j ? 1 : -1;
      const tx = h.pos.x - Math.sin(h.yaw) * back + Math.cos(h.yaw) * side * .9, tz = h.pos.z - Math.cos(h.yaw) * back - Math.sin(h.yaw) * side * .9;
      const dx = tx - o.position.x, dz = tz - o.position.z, d = Math.hypot(dx, dz);
      if (d > 40) o.position.set(tx, h.pos.y, tz);
      else if (d > .4) { const sp = Math.min(d * 2.6, 13); o.position.x += dx / d * sp * dt; o.position.z += dz / d * sp * dt; o.rotation.y = Math.atan2(dx, dz); }
      const g = world.groundAt(o.position.x, o.position.z, h.pos.y + 1), swim = g < WATER - .5;
      o.position.y = (swim ? WATER - .35 : g) + (d > .4 && !swim ? Math.abs(Math.sin(t * 12 + L.j)) * .12 : 0) + (L.hop > 0 ? Math.abs(Math.sin(L.hop * 9)) * .5 : 0);
      L.hop = Math.max(0, L.hop - dt);
      o.children[1] && (o.children[1].visible = !swim);
      L.tag.position.set(o.position.x, o.position.y + 1.45, o.position.z);
      L.tag.visible = dist2(h.pos.x, h.pos.z, o.position.x, o.position.z) < 18;
      // a hidden Leafy nearby: the pet sniffs and barks to help
      const near = LEAFIES.some(lf => !h.profile.leafies[lf.id] && dist2(lf.x, lf.z, o.position.x, o.position.z) < 12);
      L.sniff.visible = near; if (near) { L.sniff.position.set(o.position.x, o.position.y + 2.1 + Math.sin(t * 5) * .1, o.position.z); L.barkT -= dt; if (L.barkT <= 0) { L.barkT = 7; const d2 = PETS[L.pt.kind]; SFX[d2.snd] && SFX[d2.snd](); L.hop = .5; if (!L.toldSniff) { L.toldSniff = true; G.toast(h, '👃 ' + T(`${petName(L.pt)} smells something! Look around for a hidden Leafy.`, `${petName(L.pt)} ngửi thấy gì đó! Tìm quanh đây xem có bạn Lá Lá nào trốn không.`)); } } }
    });
  });

  // ---------- naming ----------
  P.openName = (h, pt, after) => {
    G.paused = true;
    const m = modal('petname', ''), card = m.querySelector('.card');
    const close = () => { m.close(); G.paused = false; after && after(); };
    card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>${PETS[pt.kind].icon} ${T('Name your pet', 'Đặt tên cho thú cưng')}</h2>
      <p class="sub">${T('Type a name, or tap one of these:', 'Gõ một cái tên, hoặc chạm vào một tên dưới đây:')}</p>
      <div class="vrow"><input type="text" id="pnIn" maxlength="14" value="${esc(pt.name || '')}" placeholder="${esc(PETS[pt.kind].name())}" autocomplete="off"></div>
      <div class="nameideas">${NAME_IDEAS.map(n => `<button class="btn" data-n="${esc(n)}">${esc(n)}</button>`).join('')}</div>
      <button class="btn primary wide big" id="pnOk">✅ ${T('That’s the name!', 'Tên này nhé!')}</button>`;
    const input = card.querySelector('#pnIn');
    card.querySelector('.x').onclick = close;
    card.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { input.value = b.dataset.n; SFX.tap(); say(b.dataset.n, b.dataset.n); });
    card.querySelector('#pnOk').onclick = () => {
      const v = input.value.trim().slice(0, 14); pt.name = v; saveProfiles(); SFX.chime();
      live.forEach(L => L.tag.redraw()); const d = PETS[pt.kind]; SFX[d.snd] && setTimeout(() => SFX[d.snd](), 300);
      say(`Hello ${petName(pt)}! What a lovely name.`, `Chào ${petName(pt)}! Tên đẹp quá.`); close();
    };
    say('What will you call your pet?', 'Con muốn đặt tên thú cưng là gì?');
  };

  // ---------- adopting (at Mr. Bear's shop, and from the Backpack) ----------
  P.openAdopt = (h, after) => {
    G.paused = true;
    const m = modal('adopt', ''), card = m.querySelector('.card');
    const close = () => { m.close(); G.paused = false; after && after(); };
    const draw = () => {
      const mine = h.profile.pets;
      card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>🐾 ${T(`${h.profile.name}'s pets`, `Thú cưng của ${h.profile.name}`)}</h2>
        <p class="sub">${T(`Up to ${MAX_PETS} pets each. They follow you, find hidden Leafies, and save you if you get tired in the water!`, `Mỗi bạn được nuôi tối đa ${MAX_PETS} con. Chúng đi theo con, tìm bạn Lá Lá đang trốn, và cứu con khi con mệt dưới nước!`)}</p>
        <div class="mypets">${mine.map((pt, k) => `<div class="mypet"><span class="pi">${PETS[pt.kind].icon}</span><b>${esc(petName(pt))}</b><button class="btn" data-ren="${k}">✏️ ${T('Name', 'Đặt tên')}</button><button class="btn" data-bye="${k}" aria-label="${T('Let go', 'Cho đi')}">🏡</button></div>`).join('')}</div>
        ${farm.petYard.length ? `<h3>🐾 ${T('Living in the pet yard on the farm', 'Đang sống ở sân thú cưng trong nông trại')}</h3><div class="mypets">${farm.petYard.map((pt, k) => `<div class="mypet"><span class="pi">${PETS[pt.kind].icon}</span><b>${esc(petName(pt))}</b><button class="btn primary" data-take="${k}">🐾 ${T('Come with me', 'Đi với con')}</button></div>`).join('')}</div>` : ''}
        <h3>${T('Adopt a pet', 'Nhận nuôi thú cưng')}</h3>
        <div class="bigpick">${Object.entries(PETS).map(([k, d]) => `<button data-ad="${k}" class="${mine.length >= MAX_PETS ? 'owned' : farm.coins < d.price ? 'poor' : ''}"><span>${d.icon}</span><small>${d.price ? fmt(d.price) : T('Free', 'Miễn phí')}</small></button>`).join('')}</div>
        ${mine.length >= MAX_PETS ? `<p class="note">${T('You already have two pets. Tap 🏡 to send one to live on the farm if you want a different one.', 'Con đã có hai thú cưng rồi. Chạm 🏡 để gửi một bạn về sống ở nông trại nếu con muốn nuôi bạn khác.')}</p>` : ''}`;
      card.querySelector('.x').onclick = close;
      card.querySelectorAll('[data-ren]').forEach(b => b.onclick = () => { m.close(); G.paused = false; P.openName(h, mine[+b.dataset.ren], () => P.openAdopt(h, after)); });
      card.querySelectorAll('[data-bye]').forEach(b => b.onclick = () => {
        const pt = mine[+b.dataset.bye]; if (!confirm(T(`Send ${petName(pt)} to play in the pet yard on the farm? You can bring them back any time.`, `Gửi ${petName(pt)} về chơi ở sân thú cưng trong nông trại nhé? Con đón về lúc nào cũng được.`))) return;
        // (its hat stays with the child: #738)
        mine.splice(+b.dataset.bye, 1); delete pt.hat; farm.petYard.push(pt); saveProfiles(); saveFarm(); P.sync(); P.syncYard(); P.refreshInteractables(); SFX.tap(); draw();
      });
      card.querySelectorAll('[data-take]').forEach(b => b.onclick = () => {
        if (mine.length >= MAX_PETS) { SFX.no(); say('You already have two pets with you. Tap 🏡 to swap one.', 'Con đã có hai thú cưng đi cùng rồi. Chạm 🏡 để đổi nhé.'); return; }
        const pt = farm.petYard.splice(+b.dataset.take, 1)[0]; mine.push(pt); saveProfiles(); saveFarm();
        P.sync(); P.syncYard(); P.refreshInteractables(); const d = PETS[pt.kind]; SFX[d.snd] && SFX[d.snd](); say(`${petName(pt)} is coming with you!`, `${petName(pt)} đi cùng con nè!`); draw();
      });
      card.querySelectorAll('[data-ad]').forEach(b => b.onclick = () => {
        const k = b.dataset.ad, d = PETS[k];
        if (mine.length >= MAX_PETS) { SFX.no(); say('You already have two pets!', 'Con đã có hai thú cưng rồi!'); return; }
        if (farm.coins < d.price) { SFX.no(); say(`That costs ${spoken(d.price)}. Sell some things first!`, `Bạn này giá ${spoken(d.price)}. Bán bớt đồ trước nhé!`); return; }
        farm.coins -= d.price; saveFarm(); SFX.coin(); const pt = { kind: k, name: '' }; mine.push(pt); saveProfiles();
        P.sync(); P.refreshInteractables(); SFX[d.snd] && SFX[d.snd]();
        m.close(); G.paused = false; P.openName(h, pt, () => P.openAdopt(h, after));
      });
    };
    draw();
  };

  // ---------- the water rescue ----------
  // Returns true when a pet is coming to help (otherwise Ông Cú does it, as before).
  P.rescue = h => {
    if (h.carry) return true;
    const L = live.find(L => L.h === h); if (!L) return false;
    const hud = G.huds[h.i], name = petName(L.pt), pet = PETS[L.pt.kind];
    const R: { stage: string, t: number, x: number, z: number, kicks: number, push?: number } = { stage: 'call', t: 0, x: h.pos.x, z: h.pos.z, kicks: 0 };
    // which way is dry land? the last safe spot on the shore
    const shore = { x: h.lastSafe.x, z: h.lastSafe.z };
    SFX.splash(); say(`Oh no, you are too tired to swim! Call ${name} to help you!`, `Ôi, con mệt quá không bơi nổi! Gọi ${name} đến giúp nào!`);
    const call = () => {
      if (R.stage !== 'call') return; R.stage = 'coming'; R.t = 0; L.rescue = true; SFX[pet.snd] && SFX[pet.snd]();
      say(`${name}! Help!`, `${name} ơi! Cứu với!`);
      hud.bigPrompt(`<span>${pet.icon}</span><b>${esc(T(`${name} is coming!`, `${name} đang đến!`))}</b>`, null);
    };
    const kick = () => { if (R.stage !== 'tow') return; R.kicks++; R.push = .35; SFX.splash(); };
    hud.bigPrompt(`<span>🆘</span><b>${esc(T(`Call ${name}!`, `Gọi ${name}!`))}</b>`, call);
    h.cancelCarry = () => { h.carry = null; L.rescue = false; R.stage = 'done'; hud.bigPrompt(null); };
    h.carry = (dt, t, pad) => {
      R.t += dt;
      if (pad && pad.act && pad.act()) { if (R.stage === 'call') call(); else kick(); }
      if (R.stage === 'call' && R.t > 9) call(); // little ones who don't press anything still get saved
      const o = L.obj, y = WATER - .55 + Math.sin(t * 3) * .08;
      if (R.stage === 'coming') {
        const dx = R.x - o.position.x, dz = R.z - o.position.z, d = Math.hypot(dx, dz);
        if (d > .9) { const sp = Math.min(11, d * 3 + 3); o.position.x += dx / d * sp * dt; o.position.z += dz / d * sp * dt; o.rotation.y = Math.atan2(dx, dz); }
        const g = world.groundAt(o.position.x, o.position.z); o.position.y = g < WATER - .5 ? WATER - .35 : g;
        o.children[1] && (o.children[1].visible = g >= WATER - .5);
        if (d <= .9 || R.t > 6) {
          R.stage = 'tow'; R.t = 0; SFX[pet.snd] && SFX[pet.snd]();
          say(`${name} is here! Hold on and kick your legs: tap, tap, tap!`, `${name} đến rồi! Bám chặt và đạp chân nào: chạm, chạm, chạm!`);
          hud.bigPrompt(`<span>🦵</span><b>${esc(T('Kick! Kick!', 'Đạp chân! Đạp!'))}</b>`, kick);
        }
      }
      if (R.stage === 'tow') {
        const dx = shore.x - R.x, dz = shore.z - R.z, d = Math.hypot(dx, dz) || 1;
        R.push = Math.max(0, (R.push || 0) - dt);
        const sp = 2 + (R.push > 0 ? 6 : 0); // always moving a little; kicking makes it fast
        R.x += dx / d * sp * dt; R.z += dz / d * sp * dt;
        const yaw = Math.atan2(dx, dz);
        o.position.set(R.x + Math.sin(yaw) * 1.1, WATER - .35, R.z + Math.cos(yaw) * 1.1); o.rotation.y = yaw; o.children[1] && (o.children[1].visible = false);
        L.tag.position.set(o.position.x, o.position.y + 1.45, o.position.z);
        if (world.groundAt(R.x, R.z) > WATER - .6 || d < 1.5) { finish(); return null; }
        return { x: R.x, y, z: R.z, yaw, state: 'swim', speed: 2 };
      }
      L.tag.position.set(o.position.x, o.position.y + 1.45, o.position.z);
      return { x: R.x, y, z: R.z, state: 'swim', speed: 0 };
    };
    const finish = async () => {
      h.carry = null; h.cancelCarry = null; L.rescue = false; hud.bigPrompt(null);
      const g = world.groundAt(R.x, R.z); if (g < WATER - .2) h.place(shore.x, shore.z); else h.place(R.x, R.z);
      h.stamina = h.staminaMax; h.exhausted = false; h.cheerT = 2; L.hop = 1.2; SFX[pet.snd] && SFX[pet.snd](); SFX.fanfare();
      G.celebrate && G.celebrate(h);
      say(`You made it! ${name} saved you. Good ${L.pt.kind === 'puppy' ? 'dog' : 'friend'}, ${name}!`, `Con lên bờ rồi! ${name} đã cứu con. Giỏi lắm ${name}!`);
      const p = h.profile; p.quests = p.quests || {};
      if (!p.quests.petRescue) { p.quests.petRescue = true; saveProfiles(); await wait(1600); G.reward && G.reward('🦸', T(`${name} is a hero!`, `${name} là người hùng!`), T('Pets always come when you call them.', 'Thú cưng luôn đến khi con gọi.')); }
    };
    return true;
  };

  P.sync(); P.syncYard(); P.refreshInteractables();
  return P;
}
