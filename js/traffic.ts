import { destinationStops } from './travel-stops.js';
const plainName = (s: string) => s.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
// Traffic of the two homes (round R, owner: vehicles on Vietnamese streets, Australian streets and farms, bicycles
// everywhere, children can ride them, all switchable in Sparkle Studio). Uses the models in js/vehicles.js.
//   · on the roads between places: motorbikes, taxis, buses and xe ba gác in Vietnam (riding on the right); cars, utes,
//     SUVs, buses and the postie bike in Australia (on the left). Each rides its road and back at a gentle speed and
//     stops while a child is in front of it.
//   · in the cities: rows of parked motorbikes and bicycles in Vietnam, parked cars and a bus at its stop in Australia;
//     a xích lô that gives rides in Sài Gòn and Hà Nội; the electric cart round Hà Nội; a modern tram in Melbourne.
//   · bicycles to ride in the villages, the farm, Two Homes Street and Aussie Corner (Jump gets off).
// Studio switches (CUSTOM.features): traffic, cityVehicles, rideBikes, xichloRides, realVehicles. Switching one off
// hides it for everyone; nothing a child owns depends on it.
// Under-5s see the toy look; when every child playing is 5 or older (and realVehicles is on) the real look is used.
// apply() rebuilds the meshes when the look changes (G.traffic.apply(real) at the start of each session).
import { THREE, blobShadow, P, merge, toonVC, sprite } from './gfx.js';
import { build, seatRider } from './vehicles.js';
import { CITIES, ROADS, VILLAGE, HOME, TOWN, AUSSIE, WATER, heightAt, roadDist } from './world.js';
import { WORLD as MAP_WORLD } from './content/map.js';
const KEEP_LEFT = MAP_WORLD.keepLeft;
import { buildAvatar } from './avatar.js';
import { featureOn } from './custom.js';
import { TOWN_PARKED } from './town.js';
import { T } from './i18n.js';
import { dialog, modal } from './popups.js';
import { pic } from './art.js';
import { esc } from './util.js';
import { farm, saveFarm } from './state.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
// (Round U, owner 11 Oct: "all vehicles can be ridden, public transport can get in with fares")
//   · every parked car, ute, SUV, taxi, scooter and motorbike can be driven like the bicycles (Jump gets off)
//   · buses, trams, taxis and the electric cart take a child as a passenger for a fare in coins (under-5s and a child
//     with too few coins ride free: never punished), to the next stop; Jump gets off sooner
//   · a moving private car or motorbike never gives a lift: children don't get into a stranger's vehicle
//   · every bus route has a stop with a shelter and a picture timetable at each end, where the bus waits
const DRIVE = new Set(['honda67', 'cub', 'dream', 'scooter', 'postie', 'sedan', 'suv', 'ute', 'taxi', 'miniBike', 'bmx', 'roadster', 'roadBike', 'kidsBike']);
const FARE = { bus: 2, busAU: 2, tramModern: 2, taxi: 4, touristCart: 2 };
const CARS = new Set(['sedan', 'suv', 'ute', 'taxi']);

const look = (style, color, hair, hairStyle, hat = 'none', skin = '#e0aa80') => ({ style, color, hair, hairStyle, hat, skin, back: 'none', glider: 0 });
const VN_RIDERS = [look('shirt', '#3a78c8', '#1d1412', 'short', 'cap'), look('aodai', '#ffffff', '#1d1412', 'long', 'nonla'), look('shirt', '#e8c25a', '#1d1412', 'short'), look('shirt', '#ff7eb8', '#1d1412', 'ponytail'), look('shirt', '#5a8a3a', '#1d1412', 'short', 'nonla')];
const AU_RIDERS = [look('shirt', '#ffd23f', '#6a4a2a', 'short', 'cap', '#f2c9a8'), look('shirt', '#3a78c8', '#a86a3a', 'short', 'cap', '#f2c9a8'), look('shirt', '#d8433a', '#2a1d18', 'ponytail', 'none', '#8a5a3a')];
const TWO_WHEEL = new Set(['honda67', 'cub', 'dream', 'scooter', 'postie', 'trailBike', 'quadBike', 'baGac', 'roadster', 'miniBike', 'roadBike', 'bmx', 'kidsBike', 'xichlo', 'touristCart']);
const VN_ROAD = ['honda67', 'cub', 'dream', 'scooter', 'taxi', 'cub', 'scooter', 'baGac', 'bus', 'dream', 'sedan', 'roadster'];
const AU_ROAD = ['sedan', 'ute', 'suv', 'busAU', 'postie', 'sedan', 'roadBike', 'ute'];
// (owner, 17 Oct AEDT) a trip to a chosen stop, in m/s: gentle, so the valley can be seen going by
const TRIP_SPEED = 6.5;
const SPEED = { bus: 4.2, busAU: 4.2, tramModern: 3.2, xichlo: 1.6, touristCart: 2.2, roadster: 2.6, miniBike: 2.4, roadBike: 3.6, baGac: 3.2, default: 4.6 };

const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const route = pts => { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, len: cum[cum.length - 1] }; };
const pointAt = (r, s) => { s = Math.max(0, Math.min(r.len, s)); let i = 1; while (i < r.cum.length - 1 && r.cum[i] < s) i++; const k = (s - r.cum[i - 1]) / (r.cum[i] - r.cum[i - 1] || 1), [ax, az] = r.pts[i - 1], [bx, bz] = r.pts[i]; return [ax + (bx - ax) * k, az + (bz - az) * k, Math.atan2(bx - ax, bz - az)]; };
// a city's main street: through its two gates, or from its gate through the middle and out the far side
const mainStreet = c => { const [g0, g1] = c.gates; const b = g1 || [2 * c.x - g0[0], 2 * c.z - g0[1]]; return [g0, b]; };

export function createTraffic(G) {
  const { scene, world } = G, W = world;
  const slots = [];        // every vehicle: { id, args, x, z, yaw, mover?, rider?, ride?, cc }
  const ground = (x, z) => (W.groundAt ? W.groundAt(x, z) : heightAt(x, z));
  const free = (x, z, r = 1.4) => heightAt(x, z) > WATER + .3 && !W.colliders.some(c => c.r > 0 && c.top == null && Math.hypot(c.x - x, c.z - z) < c.r + r) && !W.boxes.some(b => x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r);
  const ccAt = (x, z) => { let best = 'vn', bd = 1e9; for (const c of CITIES) { const d = Math.hypot(c.x - x, c.z - z); if (d < bd) { bd = d; best = c.cc; } } return KEEP_LEFT.some(([x0, x1, z0, z1]) => x > x0 && x < x1 && z > z0 && z < z1) ? 'au' : best; }; // (the map's Australian side, js/content/map.js)

  // ---------- the roads between places ----------
  if (featureOn('traffic', true)) {
    const R = rng(7);
    ROADS.filter(r => r.kind === 'asphalt').forEach((road, k) => {
      const rt = route(road.pts), mid = pointAt(rt, rt.len / 2), cc = ccAt(mid[0], mid[1]), list = cc === 'vn' ? VN_ROAD : AU_ROAD;
      const n = rt.len > 70 ? 2 : 1;
      for (let j = 0; j < n; j++) slots.push({ id: list[(k * 3 + j * 5) % list.length], cc, road, mover: { r: rt, s: rt.len * (j + .3) / (n + .2), dir: j % 2 ? -1 : 1, lane: cc === 'vn' ? 1.4 : -1.4, wait: 0, rest: /^bus/.test(list[(k * 3 + j * 5) % list.length]) ? 12 : 2 + R() * 3 } });
    });
  }
  // ---------- the cities ----------
  if (featureOn('cityVehicles', true)) for (const c of CITIES) {
    const [a, b] = mainStreet(c), len = Math.hypot(b[0] - a[0], b[1] - a[1]), fx = (b[0] - a[0]) / len, fz = (b[1] - a[1]) / len, yaw = Math.atan2(fx, fz);
    const inCity = (x, z) => x > c.x0 + 1 && x < c.x1 - 1 && z > c.z0 + 1 && z < c.z1 - 1;
    // parked along both kerbs, nose to the kerb in Vietnam (motorbikes side by side), along the kerb in Australia
    const VN_PARK = ['honda67', 'cub', 'dream', 'scooter', 'cub', 'miniBike', 'dream', 'scooter'], AU_PARK = ['sedan', 'suv', 'ute', 'sedan', 'bmx'];
    let n = 0;
    for (const side of [-1, 1]) for (let s = 6; s < len - 6 && n < 10; s += c.cc === 'vn' ? 1.1 : 5.2) {
      const x = a[0] + fx * s - fz * side * 4.4, z = a[1] + fz * s + fx * side * 4.4;
      if (!inCity(x, z) || !free(x, z, c.cc === 'vn' ? .7 : 1.6)) continue;
      const id = (c.cc === 'vn' ? VN_PARK : AU_PARK)[(n + (side > 0 ? 3 : 0)) % (c.cc === 'vn' ? VN_PARK : AU_PARK).length];
      slots.push({ id, cc: c.cc, x, z, yaw: c.cc === 'vn' ? yaw + side * Math.PI / 2 : yaw + (side > 0 ? Math.PI : 0) }); n++;
      if (c.cc === 'vn' && n % 4 === 0) s += 2.5;   // a gap between groups
    }
    // the city's own: a xích lô in Sài Gòn and Hà Nội, the electric cart round Hà Nội, a modern tram in Melbourne
    const street = route([[a[0] + fx * 3 - fz * 2, a[1] + fz * 3 + fx * 2], [b[0] - fx * 3 - fz * 2, b[1] - fz * 3 + fx * 2]]);
    if (c.id === 'saigon' || c.id === 'hanoi') slots.push({ id: 'xichlo', cc: 'vn', city: c, mover: { r: street, s: 2, dir: 1, lane: 0, wait: 0, rest: 6 }, rides: true });
    if (c.id === 'hanoi') slots.push({ id: 'touristCart', cc: 'vn', mover: { r: route([[a[0] - fz * -2.2 + fx * 3, a[1] + fx * -2.2 + fz * 3], [b[0] - fz * -2.2 - fx * 3, b[1] + fx * -2.2 - fz * 3]]), s: 5, dir: -1, lane: 0, wait: 0, rest: 8 } });
    if (c.id === 'melbourne') slots.push({ id: 'tramModern', cc: 'au', mover: { r: street, s: 1, dir: 1, lane: 0, wait: 0, rest: 10 } });
    if (c.id === 'sydney' || c.id === 'brisbane') { const x = a[0] + fx * (len * .3) + fz * 4.6, z = a[1] + fz * (len * .3) - fx * 4.6; if (free(x, z, 2.5)) slots.push({ id: 'busAU', cc: 'au', x, z, yaw }); }
  }
  if (featureOn('cityVehicles', true)) TOWN_PARKED.forEach(([x, z, r, id]) => slots.push({ id, cc: 'vn', x, z, yaw: r }));
  // (Round U) every parked car and motorbike can be driven (rollout: Studio switch 'rideAny')
  slots.forEach(sl => { if (!sl.mover && sl.rideable == null && DRIVE.has(sl.id)) { sl.rideable = true; sl.feat = 'rideAny'; } });
  // (batch rollout, owner 13 Oct AEDT) the bicycles, the xích lô, any vehicle and the fares can wait for their batch day in
  // Studio: off or not started yet, they stay hidden from children who never used them (G.keep, js/main.js)
  const keep = id => !G.keep || G.keep(id), tried = (h, id) => G.tried && G.tried(h, id);
  // ---------- bicycles to ride ----------
  const rideSpots = [];
  { const from = slots.length;   // (rollout: always placed; shown while 'rideBikes' is kept, see the updater below)
    // bicycles wait beside the road, never on it (tests: roads)
    const offRoad = (x, z, r) => { const d = roadDist(x, z); return !d.road || d.d > d.road.w / 2 + r; };
    const spot = (x0, z0, ids, cc, rideable = true) => { for (let k = 0; k < 24; k++) { const a = k * 2.4, d = 3 + k * .5, x = x0 + Math.cos(a) * d, z = z0 + Math.sin(a) * d; if (free(x, z, 1.2) && offRoad(x, z, 1.2)) { ids.forEach((id, j) => { const px = x + j * .9, pz = z; if (free(px, pz, .8) && offRoad(px, pz, .8)) slots.push({ id, cc, x: px, z: pz, yaw: Math.PI / 2, rideable }); }); return; } } };
    spot(VILLAGE.x - 6, VILLAGE.z + 8, ['miniBike', 'roadster'], 'vn');
    spot(HOME.x + 8, HOME.z - 6, ['kidsBike', 'bmx'], 'au');
    spot((TOWN.x0 + TOWN.x1) / 2, TOWN.roadZ + 4, ['miniBike', 'bmx'], 'vn');
    spot((AUSSIE.x0 + AUSSIE.x1) / 2, AUSSIE.roadZ + 5, ['roadBike', 'kidsBike'], 'au');
    // the farm's trail bike and quad bike (to look at; grown-ups' machines)
    spot(HOME.x - 10, HOME.z + 6, ['quadBike'], 'au', false);
    slots.slice(from).forEach(sl => { sl.feat = sl.hide = 'rideBikes'; });
  }

  // ---------- making the meshes (again when the look changes) ----------
  // Each model is built once per look and copied (the copies share its shapes), and a vehicle is only made when a child
  // comes within 150 m of it, so starting the game costs nothing (it took 1.4 s to make them all at once).
  let real = false;
  const R2 = rng(11), tpl = new Map(), NEAR = 150;
  const where = sl => sl.v ? [sl.v.o.position.x, sl.v.o.position.z] : sl.mover ? pointAt(sl.mover.r, sl.mover.s) : [sl.x, sl.z];
  function copy(id) {
    const k = id + (real ? '|real' : '');
    if (!tpl.has(k)) {
      const v = build(id, { real });
      // The legacy cart factory has an opaque painted windscreen but omitted the cabin description supplied by cars,
      // buses and trams. Give the camera its window bounds; withRideView opens it only for the rider's render.
      if (id === 'touristCart' && !v.cabin) v.cabin = { width: 1.5, length: 4.6, bottom: 1.05, top: 2.12, color: '#f4f4ee' };
      tpl.set(k, { v, wheelIdx: v.wheels.map(w => v.o.children.indexOf(w)) });
    }
    const { v, wheelIdx } = tpl.get(k), o = v.o.clone(true);
    return { ...v, o, wheels: wheelIdx.map(n => o.children[n]) };
  }
  function make(sl) {
    const at = where(sl), yaw0 = sl.v ? sl.v.o.rotation.y : sl.yaw || 0;
    if (sl.v) scene.remove(sl.v.o);
    const v = sl.v = copy(sl.id);
    if (TWO_WHEEL.has(sl.id) && !sl.rideable && v.seat && sl.mover) {
      const list = sl.cc === 'au' ? AU_RIDERS : VN_RIDERS, A = buildAvatar(list[Math.floor(R2() * list.length)]);
      A.anim('idle', 0, 0); seatRider(A, v, v.seat, v.grips, v.feet); sl.rider = A;
    }
    const sh = blobShadow(); sh.scale.set(1.2, 1, TWO_WHEEL.has(sl.id) ? 2 : 4); sh.position.y = .04; v.o.add(sh);
    scene.add(v.o);
    v.o.position.set(at[0], ground(at[0], at[1]), at[1]); v.o.rotation.y = sl.mover ? (sl.mover.dir > 0 ? at[2] : at[2] + Math.PI) || 0 : yaw0;
  }
  function apply(wantReal) {
    wantReal = !!wantReal && featureOn('realVehicles', true);
    if (wantReal === real) return; real = wantReal;
    slots.forEach(sl => { if (sl.v && !sl.taken && !sl.passenger) make(sl); });
  }
  // make the ones near a child, a few each frame
  let scan = 0;
  W.updaters.push(dt => {
    if ((scan -= dt) > 0) return; scan = .4;
    const H = G.heroes || []; if (!H.length) return;
    let n = 0;
    for (const sl of slots) { if (sl.v) continue; const [x, z] = where(sl); if (H.some(h => Math.hypot(h.pos.x - x, h.pos.z - z) < NEAR)) { make(sl); if (++n >= 4) { scan = 0; break; } } }
    // (Round V, owner 13 Oct: "all vehicles I can ride can go anywhere"; owner 17 Oct AEDT, #354: a vehicle left behind
    // "stays where left") a bicycle, motorbike or car stays where the child got off, so they can hop back on; it goes back
    // to its parking spot only once every child is far away (60 m), or once night has fallen since it was left and no
    // child is near it (20 m)
    for (const sl of slots) if (sl.hide && sl.v) sl.v.o.visible = !!sl.taken || keep(sl.hide);
    const night = !!(W.isNight && W.isNight());
    for (const sl of slots) { if (!sl.rideable || sl.mover || !sl.v || sl.taken || sl.x == null) continue; const o = sl.v.o.position;
      if (Math.hypot(o.x - sl.x, o.z - sl.z) <= 2) { sl.dusk = false; sl.wasNight = night; continue; }
      if (night && sl.wasNight === false) sl.dusk = true; sl.wasNight = night;
      const near = r => H.some(h => Math.hypot(h.pos.x - o.x, h.pos.z - o.z) < r);
      if (!near(60) || (sl.dusk && !near(20))) { o.set(sl.x, ground(sl.x, sl.z), sl.z); sl.v.o.rotation.y = sl.yaw || 0; sl.dusk = false; } }
  });

  // children ride the bicycles: Jump gets off (js/player.js riding, with the vehicle's own seat and grips)
  for (const sl of slots.filter(s => s.rideable)) {
    const bike = ['miniBike', 'bmx', 'roadster', 'roadBike', 'kidsBike'].includes(sl.id), car = CARS.has(sl.id);
    G.interactables.push({ id: (bike ? 'bike_' : 'drive_') + slots.indexOf(sl), get x() { return where(sl)[0]; }, get z() { return where(sl)[1]; }, r: car ? 2.8 : 2.2, icon: bike ? '🚲' : car ? '🚗' : '🛵',
      label: () => bike ? T('Ride the bicycle', 'Đạp xe') : car ? T('Drive the car', 'Lái xe hơi') : T('Ride the motorbike', 'Chạy xe máy'), visible: h => !sl.taken && !h.riding && !h.carry && (!sl.feat || keep(sl.feat)),
      act: (h, game) => { if (!sl.v) make(sl); sl.taken = h; if (sl.feat) tried(h, sl.feat); const v = sl.v; h.mount({ vehicle: v, mesh: v.o, shadow: { position: new THREE.Vector3() }, yaw: v.o.rotation.y, speed: sl.id === 'roadBike' ? 8 : car ? 9 : bike ? 6 : 8, slot: sl, quiet: true });
        const hud = G.huds && G.huds[G.heroes.indexOf(h)]; if (hud && hud.toast) hud.toast(T('Press Jump to get off', 'Bấm Nhảy để xuống xe')); } });
  }
  // a xích lô ride: sit in front while it rides the main street and back; Jump gets off
  for (const sl of slots.filter(s => s.rides)) {
    G.interactables.push({ id: 'xichlo_' + sl.city.id, get x() { return where(sl)[0]; }, get z() { return where(sl)[1]; }, r: 2.6, icon: '🚲',
      label: () => T('Ride the xích lô', 'Đi xích lô'), visible: h => !sl.passenger && !h.riding && !h.carry && keep('xichloRides'),
      act: h => { if (!sl.v) make(sl); sl.passenger = h; tried(h, 'xichloRides'); sl.mover.wait = 0; let left = sl.mover.r.len * 2 + 4;
        h.carry = (dt, t, pad) => {
          left -= dt * SPEED.xichlo; if (pad.jump() || left <= 0) { h.carry = null; sl.passenger = null; const o = sl.v.o; h.place(o.position.x + Math.cos(o.rotation.y) * 1.6, o.position.z - Math.sin(o.rotation.y) * 1.6); return null; }
          const p = sl.v.o.localToWorld(new THREE.Vector3(...sl.v.passenger)); return { x: p.x, y: p.y - .55, z: p.z, yaw: sl.v.o.rotation.y, state: 'sit', speed: 0, rest: true };
        };
      } });
  }

  // ---------- (Round U) public transport: a seat for a fare ----------
  const seatOf = (sl, v) => v.passenger || (/^(bus|tram)/.test(sl.id) ? [-.45, v.seat[1], 0] : [-v.seat[0] || .45, v.seat[1], v.seat[2] - (sl.id === 'touristCart' ? .9 : 0)]);
  const nameOf = sl => sl.id === 'taxi' ? T('the taxi', 'xe taxi') : /^tram/.test(sl.id) ? T('the tram', 'tàu điện') : sl.id === 'touristCart' ? T('the electric cart', 'xe điện') : T('the bus', 'xe buýt');
  for (const sl of slots.filter(s => s.mover && FARE[s.id])) {
    G.interactables.push({ id: 'ride_' + slots.indexOf(sl), walks: true, get x() { return where(sl)[0]; }, get z() { return where(sl)[1]; }, r: 3.2, icon: /^tram/.test(sl.id) ? '🚋' : sl.id === 'taxi' ? '🚕' : '🚌',
      label: () => T('Get on ', 'Lên ') + nameOf(sl), visible: h => !sl.passenger && !sl.trip && !h.riding && !h.carry && keep('busFares'),
      act: async h => {
        if (!sl.v) make(sl); const fare = FARE[sl.id], little = h.profile && h.profile.age !== 'big';
        sl.mover.wait = Math.max(sl.mover.wait, 30);   // it waits while the child decides
        const free = little || farm.coins < fare;
        const k = await dialog(T('Driver', 'Bác tài'), [free ? [`Hop on! It's a free ride for you today.`, 'Lên xe đi con! Hôm nay con đi miễn phí.'] : [`Hop on! The fare is ${fare} coins. We go to the next stop.`, `Lên xe đi con! Giá vé ${fare} đồng. Mình đi tới trạm sau nhé.`]],
          [[free ? '🚌 Get on' : `🪙 Pay ${fare} and get on`, free ? '🚌 Lên xe' : `🪙 Trả ${fare} đồng, lên xe`], ['👋 Not now', '👋 Để sau']]);
        sl.mover.wait = 0; if (k !== 0) return; tried(h, 'busFares');
        if (!free) { farm.coins -= fare; saveFarm(); SFX.chime(); }
        // (Round V, owner 13 Oct: "at all stations they can select a destination") where to: every stop in the valley
        const dest = await pickStop(h, sl);
        // (owner, 17 Oct AEDT: "travel time to different destinations are too quick, rider should be able to enjoy the real
        // view and distance") to a chosen stop the vehicle really drives there, along the roads (js/wayfind.js), at a
        // gentle speed: a long trip across the valley takes about a minute; it drives back to its own route afterwards
        const trip = dest ? await tripTo(sl, dest) : null;
        sl.passenger = h; let started = false, gone = 0;
        h.carry = (dt, t, pad) => {
          const m = sl.mover; if (m.wait <= 0) started = true; gone += dt;
          if (trip) {
            const off = () => { h.carry = null; sl.passenger = null; trip.back = true; };
            if (trip.arrived) { off(); say(`Here we are: ${dest.name()}! Bye bye!`, `Tới ${dest.name()} rồi! Tạm biệt!`); h.place(dest.x + 1.2, dest.z + 1.2); return null; }
            if (pad.jump()) { off(); const o = sl.v.o; h.place(o.position.x + Math.cos(o.rotation.y) * 2.6, o.position.z - Math.sin(o.rotation.y) * 2.6); say('Bye bye!', 'Tạm biệt con!'); return null; }
            const p = sl.v.o.localToWorld(new THREE.Vector3(...seatOf(sl, sl.v))); return { vehicle: sl.v, x: p.x, y: p.y - .55, z: p.z, yaw: sl.v.o.rotation.y, state: 'sit', speed: 0, rest: true };
          }
          // off at the next stop (the end of its route, where it rests), or when Jump is pressed
          if (pad.jump() || (started && m.wait > 0 && gone > 2)) { h.carry = null; sl.passenger = null; const o = sl.v.o; h.place(o.position.x + Math.cos(o.rotation.y) * 2.6, o.position.z - Math.sin(o.rotation.y) * 2.6); say('Here we are! Bye bye!', 'Tới nơi rồi! Tạm biệt con!'); return null; }
          const p = sl.v.o.localToWorld(new THREE.Vector3(...seatOf(sl, sl.v))); return { vehicle: sl.v, x: p.x, y: p.y - .55, z: p.z, yaw: sl.v.o.rotation.y, state: 'sit', speed: 0, rest: true };
        };
      } });
  }
  // (owner, 17 Oct AEDT) a trip to a chosen stop: the way along the roads from where the vehicle stands to the stop, driven
  // on its own side of the road at TRIP_SPEED (a little faster on a very long way, so no trip is over about 65 s: owner, "about 1 minute")
  let roadNet = null;
  async function tripTo(sl, dest) {
    const Wf = await import('./wayfind.js'); roadNet = roadNet || vehicleNet(Wf.roadGraph(G.PLACES || []));
    const o = sl.v.o.position, way = Wf.route(roadNet, o.x, o.z, dest.x, dest.z); if (!way || way.pts.length < 3) return null;
    const pts = way.pts.slice(0, -1), cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const len = cum[cum.length - 1]; if (len < 8) return null;
    const trip = { pts, cum, len, s: 0, back: false, arrived: false, speed: Math.max(TRIP_SPEED, len / 65), yaw: sl.v.o.rotation.y }; sl.trip = trip; return trip;
  }
  // the road network a vehicle may use: the walking links across a town's square stay only where nothing stands in the
  // way (no building, stall or other solid within 1.6 m of the line, sampled every metre): a bus never drives through a house
  function vehicleNet(g) {
    const solids = W.colliders.filter(c => c.r >= .8 && c.top == null), boxes = W.boxes || [];
    const blocked = (x, z) => solids.some(c => Math.hypot(c.x - x, c.z - z) < c.r + 1.6) || boxes.some(b => x > b.x0 - 1.6 && x < b.x1 + 1.6 && z > b.z0 - 1.6 && z < b.z1 + 1.6);
    const onRoad = (x, z) => { const d = roadDist(x, z); return d.road && d.d < d.road.w / 2 + .3; };
    const clearAt = ([ax, az], [bx, bz]) => { const n = Math.ceil(Math.hypot(bx - ax, bz - az)); for (let k = 0; k <= n; k++) { const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n; if (!onRoad(x, z) && blocked(x, z)) return false; } return true; };
    const nodes = g.nodes.slice(), edges = g.edges.map(() => []), len = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
    // a crossing with something in the way bends round it once (a point to one side, up to 18 m out), if both halves are clear
    g.edges.forEach((es, a) => es.forEach(([b, w]) => { if (b < a) return;
      const A = nodes[a], B = nodes[b]; if (clearAt(A, B)) { edges[a].push([b, w]); edges[b].push([a, w]); return; }
      const way = detour(A, B); if (!way) return;   // nothing clear: this crossing is not for vehicles
      let prev = a; for (const P2 of way) { const k = nodes.length; nodes.push(P2); edges.push([]); const d = len(nodes[prev], P2); edges[prev].push([k, d]); edges[k].push([prev, d]); prev = k; }
      const d = len(nodes[prev], B); edges[prev].push([b, d]); edges[b].push([prev, d]);
    }));
    // a way round: the shortest path on a 1 m grid in the area round A and B (keeping 1.6 m from anything solid, roads
    // always open), straightened to its corners; null if there is none within 24 m of the crossing
    function detour(A, B) {
      const pad = 24, x0 = Math.floor(Math.min(A[0], B[0]) - pad), z0 = Math.floor(Math.min(A[1], B[1]) - pad), nx = Math.ceil(Math.max(A[0], B[0]) + pad) - x0 + 1, nz = Math.ceil(Math.max(A[1], B[1]) + pad) - z0 + 1;
      const ok = new Uint8Array(nx * nz); for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = x0 + i, z = z0 + j; ok[j * nx + i] = onRoad(x, z) || !blocked(x, z) ? 1 : 0; }
      const cell = P => [Math.round(P[0]) - x0, Math.round(P[1]) - z0], [si, sj] = cell(A), [ei, ej] = cell(B), from = new Int32Array(nx * nz).fill(-1), q = [sj * nx + si]; from[q[0]] = q[0];
      ok[sj * nx + si] = ok[ej * nx + ei] = 1;
      for (let h = 0; h < q.length && from[ej * nx + ei] < 0; h++) { const c = q[h], i = c % nx, j = (c - i) / nx;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const a2 = i + di, b2 = j + dj, k = b2 * nx + a2; if (a2 < 0 || b2 < 0 || a2 >= nx || b2 >= nz || from[k] >= 0 || !ok[k]) continue; if (di && dj && (!ok[j * nx + a2] || !ok[b2 * nx + i])) continue; from[k] = c; q.push(k); } }
      if (from[ej * nx + ei] < 0) return null;
      const path = []; for (let c = ej * nx + ei; ; c = from[c]) { path.unshift([x0 + c % nx, z0 + Math.floor(c / nx)]); if (from[c] === c) break; }
      // straighten: from each corner, the farthest point still in a clear line
      const out = []; let at = A;
      for (let k = 1; k < path.length; ) { let far = k; while (far + 1 < path.length && clearAt(at, path[far + 1])) far++; if (far === path.length - 1 && clearAt(at, B)) break; out.push(path[far]); at = path[far]; k = far + 1; }
      return out;
    }
    return { nodes, edges };
  }
  // where a trip has got to: the point s metres along, its heading, and the lane offset to the right of the way it goes
  const tripAt = (sl, tr) => {
    const { pts, cum } = tr, s = Math.max(0, Math.min(tr.len, tr.s)); let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], k = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1), x = ax + (bx - ax) * k, z = az + (bz - az) * k;
    let hy = Math.atan2(bx - ax, bz - az); if (tr.back) hy += Math.PI;
    const lane = Math.abs(sl.mover.lane || 1.4) * (sl.cc === 'au' ? -1 : 1), rx = -Math.cos(hy), rz = Math.sin(hy);
    return [x + rx * lane, z + rz * lane, hy];
  };
  function driveTrip(sl, dt) {
    const tr = sl.trip, o = sl.v.o;
    if (!tr.back && tr.arrived) return;   // waiting at the stop while the rider gets off
    tr.s += (tr.back ? -1 : 1) * tr.speed * dt;
    if (!tr.back && tr.s >= tr.len) { tr.s = tr.len; tr.arrived = true; }
    if (tr.back && tr.s <= 0) { sl.trip = null; sl.mover.wait = 2; return; }   // home again: on with its own route
    const [x, z, hy] = tripAt(sl, tr);
    let d = hy - tr.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); tr.yaw += d * Math.min(1, dt * 4);   // (turns gently at the corners)
    o.position.set(x, ground(x, z), z); o.rotation.y = tr.yaw;
    sl.v.wheels.forEach(w => { w.rotation.x += tr.speed * dt / sl.v.wr; });
  }
  // (Round V) the stop picker: every bus stop by its place's picture and name; "Next stop" rides to the end of this route
  function pickStop(h, sl) {
    // (owner, 29 Oct 2026 AEDT: Brisbane showed twice) one card per name and picture as the child sees them, whatever the
    // stops were called inside (the nearest stop of each is kept)
    const seen = new Set<string>(), stops = destinationStops(W.busStops || [], h.pos).filter(b => { const k = plainName(b.name()) + '|' + b.icon; if (seen.has(k)) return false; seen.add(k); return true; });
    if (!stops.length) return Promise.resolve(null);
    return new Promise(res => {
      const m = modal('stoppick', `<h2>${pic('🚏')} ${T('Where shall we go?', 'Mình đi đâu nào?')}</h2><div class="wp-grid">${stops.map((b, k) => `<button class="wp-pick" data-k="${k}" aria-label="${esc(b.name())}">${pic(b.icon)}<b>${esc(b.name())}</b></button>`).join('')}</div>
        <div class="actions center"><button class="btn" data-next>${pic('🚌')} ${T('Just the next stop', 'Chỉ đến trạm sau')}</button></div>`);
      say('Where shall we go?', 'Mình đi đâu nào?');
      m.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { SFX.tap(); m.close(); res(stops[+b.dataset.k]); });
      m.querySelector('[data-next]').onclick = () => { SFX.tap(); m.close(); res(null); };
    });
  }
  // ---------- (Round U) bus stops with a picture timetable, at both ends of every bus route ----------
  const stopGeo = merge([P(new THREE.BoxGeometry(2.6, .1, 1.3), '#3a78c8', [0, 2.3, 0]), P(new THREE.BoxGeometry(.1, 2.3, .1), '#d8dde0', [-1.2, 1.15, -.5]), P(new THREE.BoxGeometry(.1, 2.3, .1), '#d8dde0', [1.2, 1.15, -.5]),
    P(new THREE.BoxGeometry(2.4, 1.6, .06), '#bfe4f2', [0, 1.4, -.6]), P(new THREE.BoxGeometry(2, .12, .45), '#8a5a3b', [0, .5, -.3]), P(new THREE.BoxGeometry(.08, .5, .08), '#6a4a32', [-.8, .25, -.3]), P(new THREE.BoxGeometry(.08, .5, .08), '#6a4a32', [.8, .25, -.3]),
    P(new THREE.BoxGeometry(.08, 2.8, .08), '#d8dde0', [1.6, 1.4, .2]), P(new THREE.BoxGeometry(.7, .7, .06), '#ffd23f', [1.6, 2.6, .2])]);
  W.busStops = []; const stopParts = [], stopCols = [];
  W.updaters.push(() => { const on = keep('busFares'); if (stopParts.length && stopParts[0].visible !== on) { stopParts.forEach(o => { o.visible = on; }); stopCols.forEach(c => { c.r = on ? .45 : 0; }); } });
  slots.filter(s => s.mover && /^bus/.test(s.id) && s.road).forEach((sl, n) => {
    const rt = sl.mover.r, hw = sl.road.w / 2 || 3.2;
    for (const s of [6, rt.len - 6]) {
      const [x, z, yaw] = pointAt(rt, s), side = sl.cc === 'vn' ? 1 : -1, rx = -Math.cos(yaw) * side, rz = Math.sin(yaw) * side, off = hw + 2.6, sx = x + rx * off, sz = z + rz * off;
      if (W.busStops.some(b => Math.hypot(b.x - sx, b.z - sz) < 8) || !free(sx, sz, 1.4)) continue;
      const m = new THREE.Mesh(stopGeo, toonVC()); m.position.set(sx, ground(sx, sz), sz); m.rotation.y = Math.atan2(-rx, -rz); m.castShadow = true; scene.add(m);
      const col = { x: sx, z: sz, r: .45 }; W.colliders.push(col); stopCols.push(col);
      const pic = sprite('🚌', .55), clock = sprite('⏰', .45); pic.position.set(sx, ground(sx, sz) + 3.1, sz); clock.position.set(sx, ground(sx, sz) + 2.55, sz); scene.add(pic, clock);
      stopParts.push(m, pic, clock);   // (rollout: shown while 'busFares' is kept)
      const near = (G.PLACES || []).reduce((a, p) => !a || Math.hypot(p.x - sx, p.z - sz) < Math.hypot(a.x - sx, a.z - sz) ? p : a, null);
      const stop = { x: sx, z: sz, cc: sl.cc, fare: FARE[sl.id], place: near, name: () => near ? near.name() : T('Bus stop', 'Trạm xe buýt'), icon: near ? near.icon : '🚏' }; W.busStops.push(stop);   // (Round V) named after the nearest place
      G.interactables.push({ id: 'busstop_' + W.busStops.length, x: sx, z: sz, r: 2.6, icon: '🚏', bubble: '🚌', label: () => T('Bus stop', 'Trạm xe buýt'), visible: () => keep('busFares'),
        act: () => { SFX.tap(); dialog(T('Bus stop', 'Trạm xe buýt'), [['🚌 ⏰ The bus comes along this road every few minutes and waits here at the stop. When it stops, tap the bus to get on.', '🚌 ⏰ Xe buýt chạy trên đường này vài phút một chuyến và dừng chờ ở trạm. Khi xe dừng, chạm vào xe để lên.'],
          [`🪙 The fare is ${stop.fare} coins. Little ones ride free!`, `🪙 Giá vé ${stop.fare} đồng. Các bé nhỏ đi miễn phí!`]]); } });
    }
  });

  // ---------- moving ----------
  const AHEAD = 5;
  W.updaters.push((dt, t) => {
    const H = G.heroes || [];
    for (const sl of slots) {
      const m = sl.mover; if (!m || !sl.v) continue;
      if (sl.trip) { driveTrip(sl, dt); continue; }   // (owner, 17 Oct AEDT) on a trip to a chosen stop, or on its way back
      // far from every child: nothing to update
      const o = sl.v.o; if (H.length && !H.some(h => Math.hypot(h.pos.x - o.position.x, h.pos.z - o.position.z) < 140)) continue;
      const sp = SPEED[sl.id] || SPEED.default;
      if (m.wait > 0) { m.wait -= dt; }
      else {
        const [x, z, yaw] = pointAt(m.r, m.s), hy = m.dir > 0 ? yaw : yaw + Math.PI, fx = Math.sin(hy), fz = Math.cos(hy);
        // a child (or the rider on a bike) in front: wait
        const blocked = H.some(h => h !== sl.passenger && (() => { const dx = h.pos.x - o.position.x, dz = h.pos.z - o.position.z, along = dx * fx + dz * fz; return along > 0 && along < AHEAD + (sl.id.startsWith('bus') || sl.id.startsWith('tram') ? 3 : 0) && Math.abs(dx * fz - dz * fx) < 1.8; })());
        if (!blocked) {
          m.s += m.dir * sp * dt;
          if (m.s >= m.r.len || m.s <= 0) { m.s = Math.max(0, Math.min(m.r.len, m.s)); m.dir *= -1; m.wait = m.rest; }
          const rx = -Math.cos(hy), rz = Math.sin(hy);   // to the right of the way it goes
          const px = x + rx * m.lane, pz = z + rz * m.lane;
          o.position.set(px, ground(px, pz), pz); o.rotation.y = hy;
          sl.v.wheels.forEach(w => { w.rotation.x += sp * dt / sl.v.wr; });
        }
      }
    }
  });
  const api = { apply, slots, where, make, vehicleNet, count: () => slots.length };
  G.traffic = api;
  return api;
}
