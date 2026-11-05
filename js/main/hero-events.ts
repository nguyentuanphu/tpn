// (v1.07 split, pure move from js/main.ts) hero events: what happens when a child arrives somewhere, finds something,
// is hurt, eats, changes player, and the wanderers at home. js/main.ts calls installHeroEvents where this part stood;
// playing is set through setPlaying() (main.ts's own let).
import { THREE } from '../gfx.js';
import { withRideView } from '../rideview.js';
import { farm, profiles } from '../state.js';
import { T, nm } from '../i18n.js';
import { say } from '../voice.js';
import { SFX } from '../audio.js';
import { el, $, dist2, wait } from '../util.js';
import { heightAt, MARKET, CHINA, INDIA, VILLAGE, HOME, REVEAL_R, PLATEAU, TOWN, AUSSIE, ULURU, SHRINES, TOWERS } from '../world.js';
import { SCHOOL } from '../content/school-place.js';
import { landmarkAt } from '../content/map.js';
import { buildAvatar, cloneAvatarRoot } from '../avatar.js';
import { fogMapFor } from '../hud.js';
import { Net } from '../net.js';
import { showWho, reward, openPad } from '../ui.js';
import { dishInfo } from '../data.js';
import { LANDMARKS } from '../regions.js';
import type { SvMain } from '../main.js';

export function installHeroEvents(G: SvMain, D: { renderer: any, scene: SvMain['scene'], world: any, save: () => void, hudFor: (h: { i: number }) => import('../hud.js').Hud, mapPic: any, checkQuests: (h: any) => Promise<void>, waterPic: any, twoHalves: () => boolean, startSession: (mode: any, chosen: any) => void, sendHello: () => any, setPlaying: (v: boolean) => void, nameTag: (name: string, color?: string) => any }) {
  const { renderer, scene, world, save, hudFor, mapPic, checkQuests, waterPic, twoHalves, startSession, sendHello, setPlaying, nameTag } = D;
G.onTowerTop = async (h, tw) => {
  const p = h.profile; if (p.towers[tw.id]) { hudFor(h).toast(T('What a view! Jump off and glide!', 'Đẹp quá! Nhảy xuống và lượn nào!')); return; }
  p.towers[tw.id] = true;
  [...SHRINES, ...TOWERS].forEach(s => { if (dist2(s.x, s.z, tw.x, tw.z) < REVEAL_R) p.discovered[s.id] = true; });
  save(); delete G.fogMaps[p.id]; world.setTowerDone(tw.id, true);
  SFX.tower(); h.cheerT = 2.5;
  await wait(1200);
  await reward('🗺️', T('Map updated!', 'Bản đồ đã cập nhật!'), tw.name());
  say(p.glider ? 'Now jump off and glide!' : 'Your map is lit up! Look for the orange shrines.', p.glider ? 'Giờ nhảy xuống và lượn nào!' : 'Bản đồ đã sáng lên! Tìm những ngôi đền màu cam nhé.');
  checkQuests(h);
};
G.onGlide = h => { if (!h.profile.quests.glided) { h.profile.quests.glided = true; save(); say('Wheee! You are flying!', 'Vút! Con đang bay rồi!'); } };
G.hint = (h, k) => { if (k === 'tired' && !h._tiredHint) { h._tiredHint = true; hudFor(h).toast(T('Too tired to climb. Rest a moment!', 'Mệt quá không leo được. Nghỉ một chút nhé!')); setTimeout(() => h._tiredHint = false, 6000); } };
G.stats = (h, sp) => { h.profile.stats.steps = (h.profile.stats.steps || 0) + 1; };
G.hurt = (h, n) => {
  // Falls never hurt little ones. Big kids on Hard lose a heart (food heals), and are carried to safety at zero.
  if (h.profile.age !== 'big' || (h.profile.difficulty !== 'hard' && h.profile.difficulty !== 'talent')) { SFX.bump && SFX.bump(); return; }
  h.hearts = Math.max(0, h.hearts - n); SFX.no(); hudFor(h).toast(T('Oof! Big fall!', 'Ui da! Ngã đau quá!'));
  if (h.hearts <= 0) G.rescue(h, true);
};
G.rescue = async (h, fainted) => {
  if (!fainted && G.pets && G.pets.rescue(h)) return; // a pet comes to pull them out of the water
  if (h._rescuing) return; h._rescuing = true;
  const f = el('div', 'fade white'); document.body.appendChild(f); SFX.travel();
  say(fainted ? 'Oh dear! Ông Cú carried you somewhere safe.' : 'Splash! Ông Cú helped you out of the water.', fainted ? 'Ôi! Ông Cú đã đưa con đến chỗ an toàn.' : 'Ùm! Ông Cú đã kéo con lên bờ.');
  await wait(700);
  h.place(h.lastSafe.x, h.lastSafe.z); h.stamina = h.staminaMax; h.exhausted = false; if (fainted) h.hearts = h.profile.hearts;
  f.classList.add('out'); setTimeout(() => f.remove(), 600); h._rescuing = false;
};
G.travel = async (h, x, z) => {
  if (!Number.isFinite(x) || !Number.isFinite(z)) { console.warn('travel: no place to go to'); return; } // never fly into nowhere (a black screen)
  const f = el('div', 'fade blue'); document.body.appendChild(f); SFX.travel();
  await Promise.all([wait(650), G.areas ? G.areas.near(x, z) : null]); if (h.riding) h.dismount(); // (v1.08d valley) the parts round the landing spot are built while the fade is up (js/areas.ts)
  if (h.cancelCarry) { h.cancelCarry(); h.cancelCarry = null; }
  h.place(x + 4.5, z + 1); h.gliding = false; h.camYaw = Math.PI;
  f.classList.add('out'); setTimeout(() => f.remove(), 700);
};
G.eat = (h, id) => {
  const p = h.profile; if (!p.dishes[id]) return;
  const r = dishInfo(id) || { heal: 1, bonus: 0, name: () => T('Mystery stew', 'Món hầm bí ẩn') };
  p.dishes[id]--; save();
  h.hearts = Math.min(p.hearts, h.hearts + r.heal); h.bonusStamina = r.bonus; h.stamina = p.staminaMax + r.bonus; h.exhausted = false;
  SFX.ok(); say(`Yum yum! ${r.name()}!`, `Măm măm! ${r.name()}!`); h.cheerT = 1.2;
};
G.onCooked = (h) => { checkQuests(h); G.job('cook', 1, h); };
G.rebuildHero = i => { const h = G.heroes[i]; if (h) { h.buildModel(); G.huds[i].refreshWho(); sendHello(); } };
G.fogMapFor = p => G.fogMaps[p.id] || (G.fogMaps[p.id] = fogMapFor(p, mapPic.now()));
G.mapPic = mapPic; G.waterPic = waterPic; // (the checks read where each picture came from)
G.avatarPreview = i => {
  const h = G.heroes[i]; if (!h) return '';
  const preview = new THREE.Scene(); preview.background = new THREE.Color('#f1eaff'); preview.environment = scene.environment;
  const avatar = cloneAvatarRoot(h.av.root); avatar.position.set(0, 0, 0); avatar.rotation.set(0, .12, 0); preview.add(avatar);
  preview.add(new THREE.HemisphereLight(0xffffff, 0xd9c79a, 1.8)); const sun = new THREE.DirectionalLight(0xffffff, 2); sun.position.set(3, 5, 4); preview.add(sun);
  // Hidden gliders/idle copies must not enlarge the bounds and shrink the outfit.
  avatar.updateMatrixWorld(true); const bounds=new THREE.Box3();
  avatar.traverseVisible(o=>{if(o instanceof THREE.Mesh&&o.geometry){if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});
  const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),width=260,height=320,aspect=width/height;
  const cam=new THREE.PerspectiveCamera(32,aspect,.1,100),distance=Math.max(size.y,size.x/aspect)/(2*Math.tan(THREE.MathUtils.degToRad(16)))*1.12;
  cam.position.set(center.x,center.y,center.z+distance+size.z/2);cam.lookAt(center);
  const target=new THREE.WebGLRenderTarget(width,height);target.texture.colorSpace=THREE.SRGBColorSpace;
  const previousTarget=renderer.getRenderTarget(),viewport=renderer.getViewport(new THREE.Vector4()),scissor=renderer.getScissor(new THREE.Vector4()),scissorTest=renderer.getScissorTest();
  try {
    // setViewport takes logical screen units even for a render target. The game's
    // adaptive pixel ratio can be below 1; compensate so the target is filled.
    const ratio=renderer.getPixelRatio();
    renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.setViewport(0,0,width/ratio,height/ratio);renderer.render(preview,cam);
    const bytes=new Uint8Array(width*height*4);renderer.readRenderTargetPixels(target,0,0,width,height,bytes);
    const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d'),data=ctx.createImageData(width,height);
    for(let y=0;y<height;y++)data.data.set(bytes.subarray((height-y-1)*width*4,(height-y)*width*4),y*width*4);
    ctx.putImageData(data,0,0);return c.toDataURL('image/jpeg',.85);
  } finally {renderer.setRenderTarget(previousTarget);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);target.dispose();}
};
G.snapshot = (i, max = 720, q = .8) => {
  const h = G.heroes[i] || G.heroes[0], w = renderer.domElement.width, hh = renderer.domElement.height;
  renderer.setScissorTest(false); renderer.setViewport(0, 0, w / renderer.getPixelRatio(), hh / renderer.getPixelRatio());
  h.cam.aspect = w / hh; h.cam.updateProjectionMatrix(); G.huds.forEach(x => x.root.style.visibility = 'hidden');
  withRideView(h, () => renderer.render(scene, h.cam));
  const c = document.createElement('canvas'), k = Math.min(1, max / Math.max(w, hh)); c.width = w * k; c.height = hh * k; c.getContext('2d').drawImage(renderer.domElement, 0, 0, c.width, c.height);
  G.huds.forEach(x => x.root.style.visibility = '');
  return c.toDataURL('image/jpeg', q);
};
G.LANDMARKS = LANDMARKS; // (round R) the Pad map lists each place's landmarks under it
G.PLACES = [
  { g: 'home', key: 'farm', icon: '🏡', name: () => T('Sunny Farm', 'Nông trại'), x: HOME.x - 4, z: HOME.z + 2 },
  { g: 'vn', key: 'village', icon: '🏮', name: () => T('Lotus Village', 'Làng Sen'), x: VILLAGE.x - VILLAGE.r + 6, z: VILLAGE.z },
  { g: 'asia', key: 'china', icon: '🐼', name: () => T('China Town', 'Làng Trung Hoa'), x: CHINA.x, z: CHINA.z + 12 },
  { g: 'asia', key: 'india', icon: '🐘', name: () => T('India Village', 'Làng Ấn Độ'), x: INDIA.x, z: INDIA.z + 15 },
  { g: 'home', icon: '🦉', name: () => T('Dawn Plateau (Ông Cú)', 'Cao nguyên Bình Minh (Ông Cú)'), x: PLATEAU.x - 2, z: PLATEAU.z - 3 },
  { g: 'vn', icon: '💃', name: () => T('Village festival stage (Lotus Village)', 'Sân khấu hội làng (Làng Sen)'), x: VILLAGE.x - 6, z: VILLAGE.z + 25, under: 'village' },
  { g: 'home', key: 'town', icon: '🏘️', name: () => T('Two Homes Street', 'Phố Hai Quê'), x: TOWN.x - 4, z: TOWN.z - 1 },
  { g: 'home', icon: '🏖️', name: () => T('Beach', 'Bãi biển'), x: landmarkAt('bondi')[0] + 6, z: landmarkAt('bondi')[1] - 4 },   // (round T: the southern beach)
  { g: 'vn', icon: '🏮', name: () => T('Three Regions Market', 'Chợ Ba Miền'), x: MARKET.x - 22, z: MARKET.z },
  { g: 'au', icon: '🍦', name: () => T('Aussie Corner', 'Góc Nước Úc'), x: AUSSIE.x - 4, z: AUSSIE.z },
  { g: 'au', icon: '🎭', name: () => T('Opera House', 'Nhà hát Opera'), x: landmarkAt('opera')[0] - 6, z: landmarkAt('opera')[1], under: 'sydney' },   // (the older Opera House stands here; listed under Sydney)
  { g: 'au', key: 'uluru', icon: '🪨', name: () => T('Uluru', 'Uluru'), x: ULURU.x, z: ULURU.z - 20 },
  { g: 'home', icon: '🐻', name: () => T('Mr. Bear’s shop (farm)', 'Cửa hàng Bác Gấu (nông trại)'), x: HOME.x - 21, z: HOME.z + 6, under: 'farm' },
  // (Học vui phase 4) the Fun Learning School on Two Homes Street: on the map under the street, and in "Where is…?"
  // (from the map; moved to where it really stands once it is built: js/school.js, below)
  { g: 'home', key: 'school', icon: '🏫', name: () => T('Fun Learning School', 'Trường Học Vui'), ...SCHOOL.place, under: 'town' }
];
G.changePlayer = () => {
  save(); Net.close(); Net.stopListening(); setPlaying(false); G.paused = true; $('#huds').hidden = true;
  G.heroes.forEach(h => { if (h.riding) h.dismount(); scene.remove(h.av.root); }); G.huds.forEach(h => h.destroy()); G.heroes = []; G.huds = [];
  showWho((mode, chosen) => startSession(mode, chosen));
};
// Children who are not playing right now still wander around the farm.
G.wanderers = [];
function setupWanderers(active) {
  G.wanderers.forEach(w => { scene.remove(w.av.root); scene.remove(w.tag); }); G.wanderers = [];
  for (let i = G.interactables.length - 1; i >= 0; i--) if (/^wander\d/.test(G.interactables[i].id)) G.interactables.splice(i, 1);
  profiles.filter(p => !active.includes(p)).slice(0, 4).forEach((p, k) => {
    const av = buildAvatar(p.look, p.photo), tag = nameTag(p.name); av.root.userData.own = true; // (Round V) another child of this device
    const x = HOME.x - 8 + k * 4, z = HOME.z + 4;
    av.root.position.set(x, heightAt(x, z), z); scene.add(av.root); scene.add(tag);
    const w = { av, tag, tx: x, tz: z, pos: av.root.position, yaw: 0, wave: 0 }; G.wanderers.push(w);
    G.interactables.push({ id: 'wander' + k, get x() { return w.pos.x; }, get z() { return w.pos.z; }, r: 2.5, icon: '👋', label: () => T('Say hi to ', 'Chào ') + nm(p.name),
      act: h => { SFX.ok(); w.wave = 2.5; w.tx = w.pos.x; w.tz = w.pos.z; w.yaw = Math.atan2(h.pos.x - w.pos.x, h.pos.z - w.pos.z); say('Hi! Want to play together later?', 'Chào bạn! Lát nữa mình chơi cùng nhau nhé?'); } });
  });
}
world.updaters.push((dt, t) => G.wanderers.forEach((w, k) => {
  const p = w.pos, dx = w.tx - p.x, dz = w.tz - p.z, d = Math.hypot(dx, dz);
  let st = 'idle', sp = 0;
  if (w.wave > 0) { w.wave -= dt; st = 'wave'; }
  else if (d < .3) { if (Math.random() < dt * .25) { const a = Math.random() * 6.28, r = 4 + Math.random() * 14; w.tx = HOME.x + Math.cos(a) * r; w.tz = HOME.z + Math.sin(a) * r; } }
  else { sp = 2.2; w.yaw = Math.atan2(dx, dz); p.x += dx / d * sp * dt; p.z += dz / d * sp * dt; st = 'walk'; }
  world.collide(p, .4); p.y = world.groundAt(p.x, p.z, p.y + 1); w.av.root.rotation.y = w.yaw; w.av.anim(st, t + k, sp); w.tag.position.set(p.x, p.y + 2, p.z);
}));
G.openPad = (i, tab) => { if (twoHalves()) G.lastPlayer = i; if (G.paused) return; G.paused = true; openPad(G, i, tab); };
G.closePad = () => { G.paused = false; };
// (Round V) close the Pad from outside it; (#740, v1.06, tester: "after accepting a game invite I stay on the Friends screen")
// with the Play together list and the level question opened from it, which stayed in front of the game
G.closePadNow = () => { const ms = document.querySelectorAll<HTMLElement>('.modal.pad, .modal.playtogether, .modal.gamelevel'); ms.forEach(m => m.remove()); if (ms.length) G.paused = false; };
  return { setupWanderers };
}
