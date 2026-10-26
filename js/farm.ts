// Sunny Farm (Harvest Moon style): a 3×3 field that grows in real time, barn animals that need hay,
// pets that follow you, Mr. Bear's market and three daily jobs. The farm and coins are shared by everyone.
import { WILD } from './gather.js';
import { THREE, toon, toonVC, P, merge, sprite, blobShadow } from './gfx.js';
import { farm, saveFarm, saveProfiles } from './state.js';
import { T } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { fmt, spoken } from './money.js';
import { el, esc, pick, shuffle, wait } from './util.js';
import { heightAt, HOME } from './world.js';
import { modal, dialog, reward } from './ui.js';

export const CROPS = {
  carrot: { icon: '🥕', seed: 0, sell: 3, min: 1, name: () => T('Carrot', 'Cà rốt'), color: '#ff8a2a' },
  strawberry: { icon: '🍓', seed: 4, sell: 8, min: 2, name: () => T('Strawberry', 'Dâu tây'), color: '#e8333a' },
  tomato: { icon: '🍅', seed: 5, sell: 10, min: 3, name: () => T('Tomato', 'Cà chua'), color: '#e8433a' },
  corn: { icon: '🌽', seed: 6, sell: 12, min: 3, name: () => T('Corn', 'Bắp ngô'), color: '#ffd23f' },
  sunflower: { icon: '🌻', seed: 6, sell: 13, min: 4, name: () => T('Sunflower', 'Hoa hướng dương'), color: '#ffc21a' },
  pumpkin: { icon: '🎃', seed: 10, sell: 22, min: 5, name: () => T('Pumpkin', 'Bí ngô'), color: '#ff7a1a' }
};
export const ANIMALS = {
  chicken: { icon: '🐔', product: 'egg', every: 2, price: 20, snd: 'cluck', name: () => T('Chicken', 'Gà mái') },
  cow: { icon: '🐮', product: 'milk', every: 4, price: 40, snd: 'moo', name: () => T('Cow', 'Bò sữa') },
  sheep: { icon: '🐑', product: 'wool', every: 5, price: 40, snd: 'baa', name: () => T('Sheep', 'Cừu') },
  pig: { icon: '🐷', product: 'mushroom', every: 5, price: 40, snd: 'oink', name: () => T('Pig', 'Lợn') },
  unicorn: { icon: '🦄', product: 'sparkle', every: 8, price: 100, snd: 'neigh', name: () => T('Unicorn', 'Kỳ lân') }
};
export const PETS = {
  puppy: { icon: '🐶', price: 0, snd: 'woof', name: () => T('Puppy', 'Cún con') },
  kitty: { icon: '🐱', price: 30, snd: 'meow', name: () => T('Kitty', 'Mèo con') },
  bunny: { icon: '🐰', price: 30, snd: 'sniff', name: () => T('Bunny', 'Thỏ con') },
  panda: { icon: '🐼', price: 60, snd: 'bleat', name: () => T('Panda cub', 'Gấu trúc con') },
  joey: { icon: '🦘', price: 60, snd: 'chuff', name: () => T('Joey (baby kangaroo)', 'Kangaroo con') },
  calf: { icon: '🐃', price: 60, snd: 'calfmoo', name: () => T('Buffalo calf', 'Nghé con') }
};
export const PRODUCE = {
  egg: { icon: '🥚', sell: 4, name: () => T('Egg', 'Trứng') }, milk: { icon: '🥛', sell: 7, name: () => T('Milk', 'Sữa') },
  wool: { icon: '🧶', sell: 9, name: () => T('Wool', 'Len') }, mushroom: { icon: '🍄', sell: 8, name: () => T('Mushroom', 'Nấm') },
  sparkle: { icon: '✨', sell: 20, name: () => T('Sparkle dust', 'Bụi lấp lánh') }
};
const sellPrice = k => (CROPS[k] || PRODUCE[k] || {}).sell || 1;
const itemIcon = k => (CROPS[k] || PRODUCE[k] || {}).icon || '❔';
const itemName = k => ((CROPS[k] || PRODUCE[k] || {}).name || (() => k))();

// ---------- daily jobs ----------
const JOB_POOL = [
  { kind: 'harvest', n: 3, icon: '🧺', t: n => T(`Harvest ${n} crops`, `Thu hoạch ${n} cây`) },
  { kind: 'water', n: 3, icon: '💧', t: n => T(`Water ${n} plants`, `Tưới ${n} cây`) },
  { kind: 'collect', n: 2, icon: '🥚', t: n => T(`Collect ${n} things from the barn`, `Nhặt ${n} món ở chuồng`) },
  { kind: 'pet', n: 3, icon: '💕', t: n => T(`Pet ${n} animals`, `Vuốt ve ${n} con vật`) },
  { kind: 'fish', n: 1, icon: '🐟', t: () => T('Feed the fish', 'Cho cá ăn') },
  { kind: 'puzzle', n: 2, icon: '🧩', t: n => T(`Play ${n} games`, `Chơi ${n} trò chơi`) },
  { kind: 'bubbles', n: 1, icon: '🫧', t: () => T('Pop bubbles at the bubble machine', 'Chơi máy thổi bong bóng') },
  { kind: 'dance', n: 1, icon: '💃', t: () => T('Dance on the stage', 'Nhảy múa trên sân khấu') },
  { kind: 'fly', n: 1, icon: '🎈', t: () => T('Fly the hot-air balloon', 'Bay khinh khí cầu') },
  { kind: 'sell', n: 3, icon: '🐻', t: n => T(`Sell ${n} things to Mr. Bear`, `Bán ${n} món cho Bác Gấu`) },
  { kind: 'cook', n: 1, icon: '🍲', t: () => T('Cook a dish', 'Nấu một món ăn') },
  { kind: 'plant', n: 3, icon: '🌱', t: n => T(`Plant ${n} seeds`, `Gieo ${n} hạt giống`) }
];
const today = () => new Date().toISOString().slice(0, 10);
export function ensureJobs() {
  if (farm.jobs.day === today() && farm.jobs.list.length) return;
  farm.jobs = { day: today(), list: shuffle(JOB_POOL).slice(0, 3).map(j => ({ kind: j.kind, n: j.n, done: 0 })) };
  saveFarm();
}
export const jobText = j => { const d = JOB_POOL.find(x => x.kind === j.kind); return d ? d.t(j.n) : j.kind; };
export const jobIcon = j => (JOB_POOL.find(x => x.kind === j.kind) || {}).icon || '⭐';

// ---------- animal models: js/animals.js (each kind its own shape, with moving legs, head and tail) ----------
export { animalModel } from './animals.js';
import { animalModel } from './animals.js';

function bearNPC() {
  const g = new THREE.Group();
  const M = new THREE.Mesh(merge([
    P(new THREE.CapsuleGeometry(.5, .6, 4, 12), '#8a5a3b', [0, 1.0, 0]), P(new THREE.SphereGeometry(.42, 16, 12), '#8a5a3b', [0, 2.0, 0]),
    P(new THREE.SphereGeometry(.16, 10, 8), '#8a5a3b', [.3, 2.35, 0]), P(new THREE.SphereGeometry(.16, 10, 8), '#8a5a3b', [-.3, 2.35, 0]),
    P(new THREE.SphereGeometry(.18, 10, 8), '#d9b58a', [0, 1.9, .34], [0, 0, 0], [1.2, .9, .8]), P(new THREE.SphereGeometry(.06, 8, 6), '#1a1a1a', [0, 1.96, .5]),
    P(new THREE.SphereGeometry(.05, 8, 6), '#1a1a1a', [.14, 2.1, .36]), P(new THREE.SphereGeometry(.05, 8, 6), '#1a1a1a', [-.14, 2.1, .36]),
    P(new THREE.CylinderGeometry(.52, .55, .7, 16, 1, true), '#3d7fd6', [0, 1.05, 0]), // apron
    P(new THREE.CapsuleGeometry(.14, .45, 4, 8), '#8a5a3b', [.55, 1.25, .1], [0, 0, .5]), P(new THREE.CapsuleGeometry(.14, .45, 4, 8), '#8a5a3b', [-.55, 1.25, .1], [0, 0, -.5]),
    P(new THREE.CylinderGeometry(.32, .32, .12, 16), '#e8c26a', [0, 2.42, 0]), P(new THREE.CylinderGeometry(.2, .22, .25, 16), '#e8c26a', [0, 2.55, 0]) // straw hat
  ]), toonVC({ roughness: .85 })); M.castShadow = true; g.add(M);
  const sh = blobShadow(); sh.scale.setScalar(1.6); g.add(sh);
  return g;
}

// ---------- building the farm ----------
export function createFarm(G) {
  const { scene, world } = G, H = HOME;
  const y0 = H.h;
  type FarmScene = { plots: any[]; animals: any[]; pets: any[]; spots: Record<string, {x:number;z:number}>;
    crateIcon?: THREE.Sprite; bear?: THREE.Group; fish?: {s:THREE.Sprite;a:number;r:number;feed?:number}[]; duck?: THREE.Sprite;
    pondPos?: THREE.Vector3; balloon?: THREE.Group; syncAnimals?:()=>void; syncPets?:()=>void; animalObjs?:()=>THREE.Object3D[]; update?:(dt:number,t:number)=>void };
  const F: FarmScene = { plots: [], animals: [], pets: [], spots: {} };
  const at = (dx, dz) => ({ x: H.x + dx, z: H.z + dz });
  const add = (obj, x, z, rot = 0) => { obj.position.set(x, heightAt(x, z), z); obj.rotation.y = rot; scene.add(obj); return obj; };
  const solid = (x, z, r) => world.colliders.push({ x, z, r });

  // farmhouse with wardrobe and easel
  const house = at(0, 14);
  const hm = new THREE.Mesh(merge([
    P(new THREE.BoxGeometry(9, 4, 7), '#f6e3c0', [0, 2, 0]), P(new THREE.BoxGeometry(9.4, .5, 7.4), '#a08870', [0, .25, 0]),
    P(new THREE.ConeGeometry(1, 1, 4), '#c0503a', [0, 5.6, 0], [0, Math.PI / 4, 0], [7.4, 3.2, 6]),
    P(new THREE.BoxGeometry(1.6, 2.6, .2), '#7a4a2a', [0, 1.3, -3.55]), P(new THREE.SphereGeometry(.08, 6, 5), '#ffd23f', [.55, 1.3, -3.7]),
    P(new THREE.BoxGeometry(1.4, 1.2, .2), '#9ad0f0', [-2.8, 2.2, -3.55]), P(new THREE.BoxGeometry(1.4, 1.2, .2), '#9ad0f0', [2.8, 2.2, -3.55]),
    P(new THREE.BoxGeometry(1.6, .2, .4), '#ffffff', [-2.8, 1.5, -3.7]), P(new THREE.BoxGeometry(1.6, .2, .4), '#ffffff', [2.8, 1.5, -3.7]),
    P(new THREE.BoxGeometry(1, 2.4, 1), '#b0a090', [3, 6.5, 1.5]),
    // A crafted cottage: layered door surround, timber shutters, paved doorstep and flower boxes.
    P(new THREE.BoxGeometry(2, .18, .45), '#fff3d6', [0, 2.72, -3.68]),
    ...[-.94, .94].map(x => P(new THREE.BoxGeometry(.15, 2.7, .3), '#fff3d6', [x, 1.36, -3.66])),
    P(new THREE.BoxGeometry(2.8, .18, 1), '#c9baa0', [0, .09, -4.15]),
    P(new THREE.BoxGeometry(2.3, .14, .5), '#e6d9bd', [0, .23, -3.9]),
    ...[-2.8, 2.8].flatMap(x => [
      ...[-1, 1].map(side => P(new THREE.BoxGeometry(.38, 1.45, .16), '#6aa9a3', [x + side*.92, 2.2, -3.68])),
      P(new THREE.BoxGeometry(1.5, .12, .24), '#fff3d6', [x, 2.85, -3.7]),
      P(new THREE.BoxGeometry(.08, 1.2, .1), '#fff3d6', [x, 2.2, -3.72]),
      P(new THREE.BoxGeometry(1.45, .08, .1), '#fff3d6', [x, 2.2, -3.72]),
      P(new THREE.BoxGeometry(1.9, .36, .5), '#9d7353', [x, 1.28, -3.82]),
      ...[-.6, -.2, .2, .6].map((off,i) => P(new THREE.SphereGeometry(.15,8,6), i%2?'#ffd26b':'#f693bf',[x+off,1.57,-3.85]))
    ]),
    ...[-1.9, -1.2, 1.2, 1.9].map(x => P(new THREE.SphereGeometry(.35, 8, 6), x < 0 ? '#ff7eb8' : '#ffd23f', [x * 1.8, .45, -4.2]))
  ]), toonVC()); hm.castShadow = hm.receiveShadow = true; add(hm, house.x, house.z); solid(house.x, house.z, 5);
  const wardrobe = at(-3.2, 9.6), easel = at(5.6, 9.2), jobs = at(-6.4, 9.4);
  const easelM = new THREE.Mesh(merge([P(new THREE.BoxGeometry(1.4, 1.1, .08), '#ffffff', [0, 1.6, 0], [-.15, 0, 0]), P(new THREE.CylinderGeometry(.05, .05, 2, 5), '#8a5a3b', [-.5, 1, -.2], [.1, 0, .15]), P(new THREE.CylinderGeometry(.05, .05, 2, 5), '#8a5a3b', [.5, 1, -.2], [.1, 0, -.15]), P(new THREE.CylinderGeometry(.05, .05, 2, 5), '#8a5a3b', [0, 1, .45], [-.3, 0, 0])]), toonVC());
  add(easelM, easel.x, easel.z, Math.PI);
  const board = new THREE.Mesh(merge([P(new THREE.BoxGeometry(1.8, 1.2, .1), '#c9a05a', [0, 1.7, 0]), P(new THREE.CylinderGeometry(.07, .07, 1.8, 5), '#7a5236', [-.7, .9, 0]), P(new THREE.CylinderGeometry(.07, .07, 1.8, 5), '#7a5236', [.7, .9, 0]), P(new THREE.BoxGeometry(.4, .3, .02), '#ffffff', [-.4, 1.8, .06]), P(new THREE.BoxGeometry(.4, .3, .02), '#ffffff', [.1, 1.6, .06]), P(new THREE.BoxGeometry(.4, .3, .02), '#ffffff', [.5, 1.85, .06])]), toonVC());
  add(board, jobs.x, jobs.z, Math.PI); solid(jobs.x, jobs.z, .5);
  const wardM = new THREE.Mesh(merge([P(new THREE.BoxGeometry(1.4, 2.2, .7), '#b07a4a', [0, 1.1, 0]), P(new THREE.BoxGeometry(.05, 2, .02), '#6a4026', [0, 1.1, .36]), P(new THREE.SphereGeometry(.06, 6, 5), '#ffd23f', [.15, 1.2, .38]), P(new THREE.SphereGeometry(.06, 6, 5), '#ffd23f', [-.15, 1.2, .38])]), toonVC());
  add(wardM, wardrobe.x, wardrobe.z - .6, Math.PI); solid(wardrobe.x, wardrobe.z - .6, .7);

  // the 3×3 field
  const field = at(-11, -4);
  const soilGeo = new THREE.BoxGeometry(2.5, .25, 2.5);
  for (let i = 0; i < 9; i++) {
    const px = field.x + (i % 3 - 1) * 3, pz = field.z + (Math.floor(i / 3) - 1) * 3;
    const soil = new THREE.Mesh(soilGeo, new THREE.MeshStandardMaterial({ color: '#7a5236', roughness: 1 })); soil.receiveShadow = true;
    soil.position.set(px, heightAt(px, pz) + .08, pz); scene.add(soil);
    const crop = new THREE.Group(); crop.position.copy(soil.position); crop.position.y += .12; scene.add(crop);
    const drop = sprite('💧', .8); drop.position.set(px, soil.position.y + 1.6, pz); scene.add(drop);
    const shine = sprite('✨', .9); shine.position.set(px, soil.position.y + 1.7, pz); scene.add(shine);
    F.plots.push({ i, x: px, z: pz, soil, crop, drop, shine, key: '' });
    drop.scale.setScalar(1.25); shine.scale.setScalar(1.2);
  }
  // fence round the field
  const fenceParts = [];
  for (let k = 0; k < 4; k++) for (let j = 0; j < 6; j++) {
    const L = 10.5, a = -L / 2 + j * L / 5;
    const [x, z] = [[a, -L / 2], [a, L / 2], [-L / 2, a], [L / 2, a]][k];
    if (k === 1 && Math.abs(a) < 1.2) continue; // gate
    fenceParts.push(P(new THREE.BoxGeometry(.15, 1, .15), '#c9a05a', [x, .5, z]));
  }
  [[0, -5.25, 10.5, 0], [-5.25, 0, 10.5, Math.PI / 2], [5.25, 0, 10.5, Math.PI / 2]].forEach(([x, z, l, r]) => fenceParts.push(P(new THREE.BoxGeometry(l, .12, .08), '#e8c88a', [x, .75, z], [0, r, 0])));
  [[-3.4, 5.25], [3.4, 5.25]].forEach(([x, z]) => fenceParts.push(P(new THREE.BoxGeometry(3.7, .12, .08), '#e8c88a', [x, .75, z])));
  add(new THREE.Mesh(merge(fenceParts), toonVC()), field.x, field.z);

  // barn, pen and hay box
  const barn = at(17, 10), pen = at(15, -4), hay = at(9.5, 2), crate = at(12.5, 6.5);
  const bm = new THREE.Mesh(merge([
    P(new THREE.BoxGeometry(8, 4.5, 6), '#c0392b', [0, 2.25, 0]), P(new THREE.CylinderGeometry(4.3, 4.3, 6.2, 16, 1, false, 0, Math.PI), '#7a2a20', [0, 4.5, 0], [Math.PI / 2, Math.PI / 2, 0], [1, 1, .5]),
    P(new THREE.BoxGeometry(3, 3.4, .2), '#f6e3c0', [0, 1.7, -3.05]), P(new THREE.BoxGeometry(3.2, .2, .25), '#ffffff', [0, 1.7, -3.15], [0, 0, .85]), P(new THREE.BoxGeometry(3.2, .2, .25), '#ffffff', [0, 1.7, -3.15], [0, 0, -.85])
  ]), toonVC()); bm.castShadow = bm.receiveShadow = true; add(bm, barn.x, barn.z); solid(barn.x, barn.z, 4.6);
  const penParts = []; for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; if (k === 13) continue; penParts.push(P(new THREE.BoxGeometry(.15, 1, .15), '#c9a05a', [Math.cos(a) * 6.5, .5, Math.sin(a) * 6.5])); penParts.push(P(new THREE.BoxGeometry(2.3, .12, .08), '#e8c88a', [Math.cos(a + .17) * 6.4, .75, Math.sin(a + .17) * 6.4], [0, -a - .17 + Math.PI / 2, 0])); }
  add(new THREE.Mesh(merge(penParts), toonVC()), pen.x, pen.z);
  const hayM = new THREE.Mesh(merge([P(new THREE.BoxGeometry(1.6, .8, 1.1), '#8a5a3b', [0, .4, 0]), P(new THREE.BoxGeometry(1.4, .3, .9), '#f2d16b', [0, .85, 0])]), toonVC());
  add(hayM, hay.x, hay.z); solid(hay.x, hay.z, .9);
  const crateM = new THREE.Mesh(merge([P(new THREE.BoxGeometry(1.2, .7, 1), '#a9764a', [0, .35, 0])]), toonVC()); add(crateM, crate.x, crate.z); solid(crate.x, crate.z, .8);
  const crateIcon = sprite('🥚', .9); crateIcon.position.set(crate.x, heightAt(crate.x, crate.z) + 1.5, crate.z); scene.add(crateIcon); F.crateIcon = crateIcon;

  // Mr. Bear's market stall
  const mkt = at(-21, 12);
  const stallM = new THREE.Mesh(merge([P(new THREE.BoxGeometry(3.6, 1, 1.6), '#a9764a', [0, .5, .8]), P(new THREE.CylinderGeometry(.08, .08, 3, 5), '#7a5236', [-1.6, 1.5, 0]), P(new THREE.CylinderGeometry(.08, .08, 3, 5), '#7a5236', [1.6, 1.5, 0]),
    P(new THREE.BoxGeometry(3.8, .15, 2.2), '#ff6a5a', [0, 3, .5], [.2, 0, 0]), ...[-1.1, -.4, .3, 1].map((x, i) => P(new THREE.CylinderGeometry(.3, .25, .3, 10), ['#c98b4a', '#b07a4a', '#c98b4a', '#b07a4a'][i], [x, 1.15, .8])),
    ...[-1.1, -.4, .3, 1].map((x, i) => P(new THREE.SphereGeometry(.18, 8, 6), ['#ff8a2a', '#e8333a', '#ffd23f', '#5fd39a'][i], [x, 1.35, .8]))]), toonVC());
  stallM.castShadow = true; add(stallM, mkt.x, mkt.z, Math.PI); solid(mkt.x, mkt.z - .8, 1.9);
  const bear = bearNPC(); add(bear, mkt.x, mkt.z + .9, Math.PI); solid(mkt.x, mkt.z + .9, .8);
  F.bear = bear;
  const orderB = at(-24, 4);
  const ob = new THREE.Mesh(merge([P(new THREE.BoxGeometry(1.6, 1.2, .1), '#ffffff', [0, 1.7, 0]), P(new THREE.CylinderGeometry(.07, .07, 1.8, 5), '#7a5236', [0, .9, -.08])]), toonVC()); add(ob, orderB.x, orderB.z, Math.PI);
  const obIcon = sprite('🥕', .8); obIcon.position.set(orderB.x, heightAt(orderB.x, orderB.z) + 1.75, orderB.z - .1); scene.add(obIcon);

  // pond with fish, bunny hutch, balloon, bubble machine and block tower
  const pond = at(-6, -20);
  const pw = new THREE.Mesh(new THREE.CircleGeometry(5, 32).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#2f8fc8', roughness: .1, metalness: .2 }));
  pw.position.set(pond.x, heightAt(pond.x, pond.z) + .1, pond.z); scene.add(pw);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(5.1, .4, 6, 32).rotateX(Math.PI / 2), toon('#a8a296')); rim.position.copy(pw.position); scene.add(rim); solid(pond.x, pond.z, 5.3);
  F.fish = Array.from({ length: 6 }, (_, k) => { const f = sprite(k % 2 ? '🐟' : '🐠', .8); f.position.copy(pw.position); scene.add(f); return { s: f, a: k, r: 1.5 + k % 3 }; });
  const duck = sprite('🦆', 1.1); duck.position.copy(pw.position); scene.add(duck); F.duck = duck;
  F.pondPos = pw.position.clone();
  const hutch = at(-20, -14);
  const hu = new THREE.Mesh(merge([P(new THREE.BoxGeometry(2, 1.2, 1.4), '#d9b58a', [0, .9, 0]), P(new THREE.ConeGeometry(1.6, .8, 4), '#8a5a3b', [0, 1.9, 0], [0, Math.PI / 4, 0], [1, 1, .8]), P(new THREE.BoxGeometry(.7, .6, .05), '#3a2a20', [0, .9, .72]), ...[-.8, .8].flatMap(x => [P(new THREE.CylinderGeometry(.06, .06, .6, 4), '#7a5236', [x, .3, .55]), P(new THREE.CylinderGeometry(.06, .06, .6, 4), '#7a5236', [x, .3, -.55])])]), toonVC());
  add(hu, hutch.x, hutch.z); solid(hutch.x, hutch.z, 1.2);
  const hb = animalModel('bunny'); add(hb, hutch.x + 1.6, hutch.z + .6, .5); hb.userData.react = () => { SFX.sniff(); G.fx(hb.position.x, hb.position.y + 1, hb.position.z, '💕'); };
  const balloon = at(-27, -16);
  const balloonG = new THREE.Group();
  const env = new THREE.Mesh(new THREE.SphereGeometry(2.2, 20, 16), new THREE.MeshStandardMaterial({ color: '#ff5a6a', roughness: .5 })); env.scale.set(1, 1.2, 1); env.position.y = 6; balloonG.add(env);
  for (let k = 0; k < 6; k++) { const st = new THREE.Mesh(new THREE.SphereGeometry(2.22, 20, 16, k * 1.047, .35), new THREE.MeshStandardMaterial({ color: k % 2 ? '#ffd23f' : '#3cc7e8', roughness: .5 })); st.scale.set(1, 1.2, 1); st.position.y = 6; balloonG.add(st); }
  const basket = new THREE.Mesh(new THREE.BoxGeometry(1.4, .9, 1.4), toon('#a9764a')); basket.position.y = .45; balloonG.add(basket);
  [[.6, .6], [-.6, .6], [.6, -.6], [-.6, -.6]].forEach(([x, z]) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 3.6, 4), toon('#5a4030')); r.position.set(x * 1.3, 2.7, z * 1.3); r.rotation.set(z * .25, 0, -x * .25); balloonG.add(r); });
  balloonG.traverse((o: THREE.Mesh) => { if (o.isMesh) o.castShadow = true; });
  add(balloonG, balloon.x, balloon.z); solid(balloon.x, balloon.z, 1.1);
  F.balloon = balloonG;
  const bub = at(4, -12);
  const bubM = new THREE.Mesh(merge([P(new THREE.CylinderGeometry(.6, .7, 1.1, 14), '#9a6bff', [0, .55, 0]), P(new THREE.CylinderGeometry(.2, .2, .7, 10), '#ffd23f', [0, 1.4, .3], [.6, 0, 0]), P(new THREE.TorusGeometry(.3, .06, 6, 16), '#ff7eb8', [0, 1.8, .55], [.6, 0, 0])]), toonVC({ roughness: .4 }));
  add(bubM, bub.x, bub.z); solid(bub.x, bub.z, .8);
  const tower = at(11, 18);
  const tw = new THREE.Mesh(merge([0, 1, 2, 3, 4].map(k => P(new THREE.BoxGeometry(1.4 - k * .22, .45, 1.4 - k * .22), ['#e8434a', '#ffb52e', '#ffd23f', '#5fd39a', '#3d7fd6'][k], [0, .23 + k * .45, 0]))), toonVC({ roughness: .5 }));
  tw.castShadow = true; add(tw, tower.x, tower.z); solid(tower.x, tower.z, .9);

  // a little floating bubble over each fun thing (so children who can't read know where to go)
  F.spots = { house, wardrobe, easel, jobs, field, barn, pen, hay, crate, mkt, orderB, pond, hutch, balloon, bub, tower };

  // ---------- barn animals and pets ----------
  F.syncAnimals = () => {
    F.animals.forEach(a => scene.remove(a.obj)); F.animals = [];
    farm.animals.forEach((a, k) => {
      const obj = animalModel(a.kind); const ang = k * 1.7, r = 2 + (k % 3);
      obj.position.set(pen.x + Math.cos(ang) * r, heightAt(pen.x, pen.z), pen.z + Math.sin(ang) * r); scene.add(obj);
      const A = { a, obj, tx: obj.position.x, tz: obj.position.z, hop: 0 }; F.animals.push(A);
      obj.userData.react = () => { const d = ANIMALS[a.kind]; SFX[d.snd] && SFX[d.snd](); A.hop = .8; G.fx(obj.position.x, obj.position.y + 1.4, obj.position.z, '💕'); };
    });
  };
  F.syncPets = () => G.pets && G.pets.sync();
  F.animalObjs = () => F.animals.map(A => A.obj); // each child's pets follow them (js/pets.js)
  F.syncAnimals(); F.syncPets();

  // ---------- per-frame update ----------
  F.update = (dt, t) => {
    const now = Date.now();
    // crops
    F.plots.forEach((pl, i) => {
      const p = farm.plots[i];
      if (p && p.water && p.stage < 3 && now - p.t >= CROPS[p.crop].min * 60000) { p.stage++; p.water = p.stage >= 3; p.t = now; saveFarm(); }
      const key = p ? p.crop + p.stage + (p.water ? 'w' : '') : '';
      pl.drop.visible = !!p && !p.water && p.stage < 3; pl.shine.visible = !!p && p.stage >= 3;
      pl.drop.position.y = pl.soil.position.y + 1.5 + Math.sin(t * 3 + i) * .12;
      pl.soil.material.color.set(p && p.water ? '#4a3020' : '#7a5236');
      if (key === pl.key) return; pl.key = key;
      pl.crop.clear();
      if (!p) return;
      const c = CROPS[p.crop];
      if (p.stage === 0) { const m = new THREE.Mesh(new THREE.SphereGeometry(.12, 6, 5), toon('#5a3a22')); m.position.y = .05; pl.crop.add(m); }
      else {
        const n = p.stage === 1 ? 3 : 6, hgt = p.stage === 1 ? .35 : .7;
        for (let k = 0; k < n; k++) { const leaf = new THREE.Mesh(new THREE.ConeGeometry(.12, hgt, 4), toon('#4fae4a')); leaf.position.set(Math.cos(k * 2.1) * .25, hgt / 2, Math.sin(k * 2.1) * .25); leaf.rotation.set(Math.sin(k) * .3, 0, Math.cos(k) * .3); pl.crop.add(leaf); }
        if (p.stage >= 3) { const s = sprite(c.icon, 1.1); s.position.y = .9; pl.crop.add(s); const s2 = sprite(c.icon, .8); s2.position.set(.5, .6, .3); pl.crop.add(s2); }
        else if (p.stage === 2) { const bud = new THREE.Mesh(new THREE.SphereGeometry(.14, 8, 6), toon(c.color)); bud.position.y = .75; pl.crop.add(bud); }
      }
    });
    // barn animals produce things while there is hay
    if (farm.animals.length && farm.hay > 0) {
      farm.animals.forEach(a => {
        const d = ANIMALS[a.kind]; a.t = a.t || now;
        if (now - a.t >= d.every * 60000 && farm.hay > 0) { a.t = now; farm.products[d.product] = (farm.products[d.product] || 0) + 1; farm.hay--; saveFarm(); }
      });
    }
    const prodN = (Object.values(farm.products) as number[]).reduce((a, b) => a + b, 0);
    F.crateIcon.visible = prodN > 0; F.crateIcon.position.y = heightAt(crate.x, crate.z) + 1.5 + Math.sin(t * 3) * .1;
    F.animals.forEach(A => {
      const o = A.obj, dx = A.tx - o.position.x, dz = A.tz - o.position.z, d = Math.hypot(dx, dz);
      if (d < .2) { if (Math.random() < dt * .3) { const ang = Math.random() * 6.28, r = Math.random() * 4.5; A.tx = pen.x + Math.cos(ang) * r; A.tz = pen.z + Math.sin(ang) * r; } }
      else { o.rotation.y = Math.atan2(dx, dz); o.position.x += dx / d * dt * .8; o.position.z += dz / d * dt * .8; }
      o.position.y = heightAt(o.position.x, o.position.z) + (A.hop > 0 ? Math.abs(Math.sin(A.hop * 10)) * .4 : 0); A.hop = Math.max(0, A.hop - dt);
    });
    // pets follow the players (first pet with player 1, second with player 2, the rest tag along)
    F.pets.forEach((P2, j) => {
      const h = G.heroes[j % Math.max(1, G.heroes.length)]; if (!h) return;
      const o = P2.obj, back = 1.6 + Math.floor(j / Math.max(1, G.heroes.length)) * 1.2;
      const tx = h.pos.x - Math.sin(h.yaw) * back + (j % 2 ? .9 : -.9), tz = h.pos.z - Math.cos(h.yaw) * back;
      const dx = tx - o.position.x, dz = tz - o.position.z, d = Math.hypot(dx, dz);
      if (d > 40) { o.position.set(tx, h.pos.y, tz); }
      else if (d > .4) { const sp = Math.min(d * 2.5, 12); o.position.x += dx / d * sp * dt; o.position.z += dz / d * sp * dt; o.rotation.y = Math.atan2(dx, dz); }
      o.position.y = world.groundAt(o.position.x, o.position.z, h.pos.y + 1) + (d > .4 ? Math.abs(Math.sin(t * 12 + j)) * .12 : 0);
    });
    // fish and the duck
    F.fish.forEach((f, k) => { f.a += dt * (f.feed > 0 ? 1.6 : .6); f.feed = Math.max(0, (f.feed || 0) - dt); const r = f.feed > 0 ? .8 : f.r; f.s.position.set(F.pondPos.x + Math.cos(f.a) * r, F.pondPos.y + .15 + (f.feed > 0 ? Math.abs(Math.sin(t * 8 + k)) * .3 : 0), F.pondPos.z + Math.sin(f.a) * r); });
    F.duck.position.set(F.pondPos.x + Math.cos(t * .3) * 3.5, F.pondPos.y + .45, F.pondPos.z + Math.sin(t * .3) * 3.5);
    F.balloon.position.y = heightAt(balloon.x, balloon.z) + Math.sin(t * .8) * .15;
  };

  // ---------- things to do ----------
  const I = (id, spot, r, icon, label, act, extra = {}) => G.interactables.push(Object.assign({ id, x: spot.x, z: spot.z, r, icon, label, act, bubble: icon }, extra));
  G.tapTargets = G.tapTargets || [];
  F.plots.forEach((pl, i) => {
    // tap the 💧 to water, tap the ✨ to harvest, tap the soil to plant
    const it = { id: 'plot' + i, x: pl.x, z: pl.z, r: 1.7, plot: true, icon: '🌱',
      label: () => { const p = farm.plots[i]; return !p ? T('Plant', 'Gieo hạt') : p.stage >= 3 ? T('Harvest', 'Thu hoạch') : !p.water ? T('Water', 'Tưới nước') : T('Growing…', 'Đang lớn…'); },
      act: h => plotAction(G, h, i) };
    G.interactables.push(it);
    pl.drop.userData.it = pl.shine.userData.it = pl.soil.userData.it = it;
    G.tapTargets.push(pl.drop, pl.shine, pl.soil);
  });
  I('hay', hay, 2.2, '🌾', () => T('Fill the hay box', 'Đổ cỏ khô'), h => { farm.hay = 12; saveFarm(); SFX.plant(); G.fx(hay.x, heightAt(hay.x, hay.z) + 1.5, hay.z, '🌾'); say('The hay box is full! The animals are happy.', 'Hộp cỏ đầy rồi! Các con vật vui lắm.'); });
  I('crate', crate, 2, '🧺', () => T('Collect from the barn', 'Nhặt đồ ở chuồng'), h => collect(G, h));
  I('pen', pen, 7.2, '💕', () => T('Pet the animals', 'Vuốt ve các con vật'), h => petAnimal(G, h), { bubble: null });
  I('bear', mkt, 3.2, '🐻', () => T("Mr. Bear's market", 'Chợ của Bác Gấu'), h => bearTalk(G, h));
  I('order', orderB, 2.4, '📋', () => T('Order board', 'Bảng đặt hàng'), h => G.playGame(h.i, 'order', 'place'));
  I('jobs', jobs, 2.4, '📌', () => T('Daily jobs', 'Việc hằng ngày'), h => openJobs(G, h));
  I('wardrobe', wardrobe, 2.4, '👗', () => T('Wardrobe', 'Tủ quần áo'), h => G.openWardrobe(h.i));
  I('easel', easel, 2.4, '🖼️', () => T('Photo puzzle', 'Ghép ảnh'), h => G.playGame(h.i, 'jigsaw', 'place'));
  I('hutch', hutch, 3, '🥕', () => T('Feed the bunny', 'Cho thỏ ăn'), h => G.playGame(h.i, 'bunny', 'place'));
  I('balloon', balloon, 3, '🎈', () => T('Fly the balloon', 'Bay khinh khí cầu'), h => G.playGame(h.i, 'balloon', 'place'));
  I('bubbles', bub, 2.4, '🫧', () => T('Bubble machine', 'Máy thổi bong bóng'), h => G.playGame(h.i, 'bubbles', 'place'));
  I('blocks', tower, 2.4, '🧱', () => T('Build a tower', 'Xây tháp'), h => G.playGame(h.i, 'tower', 'place'));
  I('feedfish', { x: pond.x + 5.8, z: pond.z }, 2.4, '🐟', () => T('Feed the fish', 'Cho cá ăn'), h => { F.fish.forEach(f => f.feed = 6); SFX.splash(); G.fx(pond.x, F.pondPos.y + 1, pond.z, '🫧'); say('Yum yum! The fish love it!', 'Măm măm! Cá thích lắm!'); G.job('fish'); });
  I('duckmaze', { x: pond.x - 5.8, z: pond.z }, 2.4, '🦆', () => T('Help the duckling', 'Giúp vịt con'), h => G.playGame(h.i, 'duckmaze', 'place'));
  return F;
}

// ---------- actions ----------
function plotAction(G, h, i) {
  const p = farm.plots[i];
  if (!p) return seedPicker(G, h, i);
  if (p.stage >= 3) {
    farm.plots[i] = null; farm.basket[p.crop] = (farm.basket[p.crop] || 0) + 1; saveFarm();
    SFX.harvest(); G.fx(G.farm.plots[i].x, heightAt(G.farm.plots[i].x, G.farm.plots[i].z) + 1.5, G.farm.plots[i].z, CROPS[p.crop].icon);
    say(`A ${CROPS[p.crop].name()}! Into the basket!`, `Một ${CROPS[p.crop].name()}! Cho vào giỏ nào!`); G.job('harvest'); return;
  }
  if (!p.water) { p.water = true; p.t = Date.now(); saveFarm(); SFX.water(); G.fx(G.farm.plots[i].x, heightAt(G.farm.plots[i].x, G.farm.plots[i].z) + 1.2, G.farm.plots[i].z, '💦'); say('Splish splash! Grow, little plant!', 'Tưới tưới! Lớn nhanh nhé cây ơi!'); G.job('water'); return; }
  const left = Math.max(0, Math.ceil((CROPS[p.crop].min * 60000 - (Date.now() - p.t)) / 1000));
  say(`It is growing. Come back in ${left > 60 ? Math.ceil(left / 60) + ' minutes' : left + ' seconds'}!`, `Cây đang lớn. Quay lại sau ${left > 60 ? Math.ceil(left / 60) + ' phút' : left + ' giây'} nhé!`);
}
function seedPicker(G, h, i) {
  G.paused = true;
  const m = modal('seeds', '');
  const card = m.querySelector('.card');
  const close = () => { m.close(); G.paused = false; };
  card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>🌱 ${T('Pick a seed', 'Chọn hạt giống')}</h2><div class="bigpick">${Object.entries(CROPS).map(([k, c]) => { const n = k === 'carrot' ? '∞' : farm.seeds[k] || 0; return `<button data-k="${k}" ${n === 0 ? 'class="none"' : ''}><span>${c.icon}</span><b>${n}</b></button>`; }).join('')}</div><p class="note center">${T('Buy more seeds from Mr. Bear.', 'Mua thêm hạt giống ở chỗ Bác Gấu.')}</p>`;
  card.querySelector('.x').onclick = close;
  card.querySelectorAll('[data-k]').forEach(b => {
    b.onclick = () => {
      const k = b.dataset.k, c = CROPS[k]; say(c.name(), c.name());
      if (k !== 'carrot' && !(farm.seeds[k] > 0)) { SFX.no(); say(`No ${c.name()} seeds. Mr. Bear sells them!`, `Hết hạt ${c.name()} rồi. Bác Gấu có bán đấy!`); return; }
      if (k !== 'carrot') farm.seeds[k]--;
      farm.plots[i] = { crop: k, stage: 0, water: false, t: Date.now() }; saveFarm(); SFX.plant(); G.job('plant');
      close(); setTimeout(() => say('Planted! Now give it some water.', 'Gieo xong rồi! Giờ tưới nước cho cây nhé.'), 300);
    };
  });
}
function collect(G, h) {
  const got = Object.entries<number>(farm.products).filter(([, n]) => n > 0);
  if (!got.length) { say(farm.hay > 0 ? 'Nothing yet. The animals are busy!' : 'The animals are hungry. Fill the hay box!', farm.hay > 0 ? 'Chưa có gì. Các con vật đang bận!' : 'Các con vật đói rồi. Đổ cỏ khô vào hộp nhé!'); return; }
  let n = 0; got.forEach(([k, c]) => { farm.basket[k] = (farm.basket[k] || 0) + c; n += c; }); farm.products = {}; saveFarm();
  SFX.harvest(); G.fx(h.pos.x, h.pos.y + 2, h.pos.z, got[0] ? PRODUCE[got[0][0]].icon : '🥚');
  say(`You collected ${n}! ${got.map(([k, c]) => c + ' ' + PRODUCE[k].name()).join(', ')}.`, `Con nhặt được ${n} món! ${got.map(([k, c]) => c + ' ' + PRODUCE[k].name()).join(', ')}.`);
  G.job('collect', n);
}
function petAnimal(G, h) {
  const A = G.farm.animals.slice().sort((a, b) => a.obj.position.distanceTo(h.pos) - b.obj.position.distanceTo(h.pos))[0];
  if (!A) { say('The barn is empty. Buy animals from Mr. Bear!', 'Chuồng trống. Mua con vật ở chỗ Bác Gấu nhé!'); return; }
  const d = ANIMALS[A.a.kind]; SFX[d.snd] && SFX[d.snd](); A.hop = .6; G.fx(A.obj.position.x, A.obj.position.y + 1.6, A.obj.position.z, '💕');
  say({ cluck: 'Cluck cluck!', moo: 'Moo!', baa: 'Baa baa!', oink: 'Oink oink!', neigh: 'Neigh! Sparkle sparkle!' }[d.snd], { cluck: 'Cục ta cục tác!', moo: 'Ụm bò!', baa: 'Be be!', oink: 'Ủn ỉn!', neigh: 'Hí hí! Lấp lánh!' }[d.snd]);
  G.job('pet');
}
export function petPet(G, P2) { const d = PETS[P2.kind]; SFX[d.snd] && SFX[d.snd](); G.fx(P2.obj.position.x, P2.obj.position.y + 1, P2.obj.position.z, '💕'); G.job('pet'); }

async function bearTalk(G, h) {
  const k = await dialog(T('Mr. Bear', 'Bác Gấu'), [['Hello, little farmer! What would you like to do today?', 'Chào bác nông dân nhí! Hôm nay con muốn làm gì nào?']],
    [['🧺 Sell my basket and treasures', '🧺 Bán giỏ hàng và báu vật'], ['🌱 Buy seeds and animals', '🌱 Mua hạt giống và con vật'], ['🧺 Sort the baskets (game)', '🧺 Xếp giỏ (trò chơi)'], ['👋 Bye', '👋 Tạm biệt']]);
  if (k === 0) openSell(G, h);
  if (k === 1) openBuy(G, h);
  if (k === 2) G.playGame(h.i, 'sortout', 'place');
}
function openSell(G, h) {
  G.paused = true;
  const m = modal('sell', ''), card = m.querySelector('.card');
  const close = () => { m.close(); G.paused = false; };
  const draw = () => {
    const items = Object.entries<number>(farm.basket).filter(([, n]) => n > 0);
    const wild = Object.entries<number>(h.profile.inv || {}).filter(([k, n]) => WILD[k] && n > 0);
    card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>🧺 ${T('Sell to Mr. Bear', 'Bán cho Bác Gấu')}</h2><p class="sub">💰 ${fmt(farm.coins)}</p>
      <div class="bigpick">${items.map(([k, n]) => `<button data-k="${k}"><span>${itemIcon(k)}</span><b>${n}</b><small>${fmt(sellPrice(k))}</small></button>`).join('') || `<p class="note">${T('Your basket is empty. Harvest crops and collect from the barn!', 'Giỏ trống rồi. Thu hoạch và nhặt đồ ở chuồng nhé!')}</p>`}</div>
      ${items.length ? `<button class="btn primary wide big" id="sellAll">💰 ${T('Sell everything', 'Bán hết')}</button>` : ''}
      <h3>💎 ${T('Treasures from the wild', 'Báu vật hái lượm')}</h3>
      <div class="bigpick">${wild.map(([k, n]) => `<button data-w="${k}"><span>${WILD[k].icon}</span><b>${n}</b><small>${fmt(WILD[k].sell)}</small></button>`).join('') || `<p class="note">${T('Pick wild fruit and flowers, or crack rocks open, then bring them here!', 'Hái quả, hái hoa dại hoặc đập đá rồi mang đến đây nhé!')}</p>`}</div>`;
    card.querySelector('.x').onclick = close;
    card.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      const k = b.dataset.k; farm.basket[k]--; const v = sellPrice(k); farm.coins += v; saveFarm(); SFX.coin();
      say(`${itemName(k)}: ${spoken(v)}! Now you have ${spoken(farm.coins)}.`, `${itemName(k)}: ${spoken(v)}! Giờ con có ${spoken(farm.coins)}.`); G.job('sell'); draw();
    });
    card.querySelectorAll('[data-w]').forEach(b => b.onclick = () => {
      const k = b.dataset.w, inv = h.profile.inv; inv[k]--; const v = WILD[k].sell; farm.coins += v; saveFarm(); SFX.coin(); G.save && G.save();
      say(`${WILD[k].name()}: ${spoken(v)}! Now you have ${spoken(farm.coins)}.`, `${WILD[k].name()}: ${spoken(v)}! Giờ con có ${spoken(farm.coins)}.`); G.job('sell'); draw();
    });
    const all = card.querySelector('#sellAll');
    if (all) all.onclick = () => { let v = 0, n = 0; for (const [k, c] of Object.entries<number>(farm.basket)) { v += sellPrice(k) * c; n += c; } farm.basket = {}; farm.coins += v; saveFarm(); SFX.coin(); setTimeout(SFX.coin, 150); say(`Thank you! That is ${spoken(v)}.`, `Cảm ơn con! Tất cả là ${spoken(v)}.`); G.job('sell', n); draw(); };
  };
  draw();
}
function openBuy(G, h) {
  G.paused = true;
  const m = modal('buy', ''), card = m.querySelector('.card');
  const close = () => { m.close(); G.paused = false; };
  const draw = () => {
    const seeds = Object.entries(CROPS).filter(([k]) => k !== 'carrot');
    card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>🌱 ${T("Mr. Bear's shop", 'Cửa hàng Bác Gấu')}</h2><p class="sub">💰 ${fmt(farm.coins)}</p>
      <h3>${T('Seeds', 'Hạt giống')}</h3><div class="bigpick">${seeds.map(([k, c]) => `<button data-s="${k}" class="${farm.coins < c.seed ? 'poor' : ''}"><span>${c.icon}</span><b>${farm.seeds[k] || 0}</b><small>${fmt(c.seed)}</small></button>`).join('')}</div>
      <h3>${T('Barn animals', 'Vật nuôi trong chuồng')}</h3><div class="bigpick">${Object.entries(ANIMALS).map(([k, a]) => `<button data-a="${k}" class="${farm.coins < a.price ? 'poor' : ''}"><span>${a.icon}</span><b>${farm.animals.filter(x => x.kind === k).length}</b><small>${fmt(a.price)}</small></button>`).join('')}</div>
      <h3>${T('Pets that follow you', 'Thú cưng đi theo con')}</h3><button class="btn wide big" id="adoptBtn">🐾 ${T('Adopt and name a pet (up to 2 each)', 'Nhận nuôi và đặt tên thú cưng (mỗi bạn tối đa 2)')}</button>`;
    card.querySelector('.x').onclick = close;
    const pay = (price, what) => { if (farm.coins < price) { SFX.no(); say(`That costs ${spoken(price)}. Sell some things first!`, `Món này giá ${spoken(price)}. Bán bớt đồ trước nhé!`); return false; } farm.coins -= price; SFX.coin(); say(`Here is your ${what}!`, `${what} của con đây!`); return true; };
    card.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { const k = b.dataset.s; if (pay(CROPS[k].seed, CROPS[k].name())) { farm.seeds[k] = (farm.seeds[k] || 0) + 1; saveFarm(); draw(); } });
    card.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const k = b.dataset.a; if (farm.animals.length >= 10) { say('The barn is full!', 'Chuồng đầy rồi!'); return; } if (pay(ANIMALS[k].price, ANIMALS[k].name())) { farm.animals.push({ kind: k, t: Date.now() }); saveFarm(); G.farm.syncAnimals(); SFX[ANIMALS[k].snd](); draw(); } });
    card.querySelector('#adoptBtn').onclick = () => { close(); G.pets.openAdopt(h); };
  };
  draw();
}
export function openJobs(G, h) {
  ensureJobs(); G.paused = true;
  const m = modal('jobs', ''), card = m.querySelector('.card');
  const close = () => { m.close(); G.paused = false; };
  card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>📌 ${T("Today's jobs", 'Việc hôm nay')}</h2><p class="sub">${T('Each finished job gives', 'Mỗi việc xong được')} ${fmt(5)} + ⭐</p>
    <div class="joblist">${farm.jobs.list.map(j => `<button class="job ${j.done >= j.n ? 'done' : ''}" data-say="${esc(jobText(j))}"><span class="ji">${j.done >= j.n ? '✅' : jobIcon(j)}</span><span class="jt">${esc(jobText(j))}</span><span class="jp">${Math.min(j.done, j.n)}/${j.n}</span></button>`).join('')}</div>`;
  card.querySelector('.x').onclick = close;
  card.querySelectorAll('[data-say]').forEach(b => b.onclick = () => say(b.dataset.say, b.dataset.say));
  say('Here are today’s jobs. Tap one to hear it.', 'Đây là việc hôm nay. Chạm vào để nghe nhé.');
}
// Count progress on a daily job; reward when one is finished.
export async function jobProgress(G, kind, n = 1, hero) {
  ensureJobs();
  const j = farm.jobs.list.find(x => x.kind === kind && x.done < x.n); if (!j) return;
  j.done = Math.min(j.n, j.done + n); saveFarm();
  if (j.done >= j.n) {
    farm.coins += 5; saveFarm();
    const p = (hero || G.heroes[0]).profile, left = G.STICKERS.filter(s => !p.stickers.includes(s));
    const st = left.length ? pick(left) : null; if (st) { p.stickers.push(st); saveProfiles(); }
    await wait(900);
    // (a game finished and the next one already opened: the reward waits until no activity covers the screen, never on its buttons)
    while (document.querySelector('.gl:not(.out), .theatre:not(.out)')) await wait(400);
    await reward(st || '⭐', T('Job done!', 'Xong việc rồi!'), T(`${jobText(j)} · +${fmt(5)}${st ? ' and a sticker!' : ''}`, `${jobText(j)} · +${fmt(5)}${st ? ' và một hình dán!' : ''}`));
  }
}
export { itemIcon, itemName };
