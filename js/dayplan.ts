// (Round U, owner 11 Oct: a day plan for villagers, weather and night) The villagers (js/villagertalk.js) live by the
// valley's clock: in the day they potter about near their spot; at dusk the ones with a house nearby walk to its door
// and go inside, and come back out in the morning; the others light a lantern. In the rain they put up an umbrella, and
// at night a lantern glows over every stall. Nobody walks on a road or through a house. Loaded after the title.
import { sprite } from './gfx.js';
import { edgeDist } from './world.js';

const SPEED = 1.3;
export function createDayPlan(G) {
  const { scene, world } = G, V = (G.villagerTalk && G.villagerTalk.list) || [];
  const inBox = (x, z, m = .35) => world.boxes.some(b => x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m);
  const offRoad = (x, z) => edgeDist(x, z) > .3 && !inBox(x, z);
  // a straight walk from a to b that stays off roads and out of houses (the first metre may start on a street)
  const clear = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / .5), grace = offRoad(ax, az) ? -1 : 1; for (let i = 0; i <= n; i++) { const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n; if (i * .5 > grace && !offRoad(x, z)) return false; } return true; };
  const doors = ((G.homes && G.homes.list) || []).map(h => h.door).filter(Boolean);
  const prep = v => {
    const { x, z } = v.home;
    // (Round V, owner 13 Oct: a villager sitting in the air by the road) people seated on a stool stay seated: they do not
    // potter about or walk home (they would carry their sitting pose away from the table); at night they light a lantern
    const seated = !!v.o.userData.seated;
    v.door = seated ? null : doors.filter(d => Math.hypot(d.x - x, d.z - z) < 35).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z)).find(d => clear(x, z, d.x, d.z)) || null;
    v.free = !seated && offRoad(x, z);   // can potter about (only off the streets)
    v.goal = null; v.inside = false; v.wait = Math.random() * 6;
    v.umb = sprite('☂️', .9); v.umb.position.set(0, 3, 0); v.umb.visible = false; v.o.add(v.umb);
    v.lamp = sprite('🏮', .5); v.lamp.position.set(.45, 1.3, .2); v.lamp.visible = false; v.o.add(v.lamp);
    const talk = v.it.visible; v.it.visible = h => !v.inside && (!talk || talk(h));   // (no talking to someone who has gone home)
    v.ready = true; v.last = [v.o.position.x, v.o.position.z];
  };
  V.forEach(prep);
  const lights = (world.stalls || []).map(s => { const l = sprite('🏮', .7); l.position.set(s.x, (world.groundAt ? world.groundAt(s.x, s.z) : 0) + 3.1, s.z); l.visible = false; scene.add(l); return l; });
  let night = null;
  const step = (v, dt) => {
    const p = v.o.position, [gx, gz] = v.goal, d = Math.hypot(gx - p.x, gz - p.z);
    if (d < .15) { v.goal = null; return true; }
    const s = Math.min(d, SPEED * dt), nx = p.x + (gx - p.x) / d * s, nz = p.z + (gz - p.z) / d * s;
    // (Round V) something put down since the walk was chosen (a stall, a box, a parked vehicle): stop rather than walk into it
    if (offRoad(p.x, p.z) && !offRoad(nx, nz) && !(v.going === 'in' && v.door && Math.hypot(v.door.x - nx, v.door.z - nz) < .6)) { v.goal = null; return false; }
    p.x = nx; p.z = nz; v.o.rotation.y = Math.atan2(gx - p.x, gz - p.z);
    if (world.groundAt) p.y = world.groundAt(p.x, p.z);
    return false;
  };
  // (batch rollout) Studio switch 'dayPlan': off or not started yet, everyone stays at their spot as before the day plan
  // (nothing for a child to keep: it is the valley's own life)
  let was = true;
  const rest = () => { night = null; lights.forEach(l => { l.visible = false; });
    for (const v of V) { if (!v.ready) continue; v.goal = null; v.umb.visible = v.lamp.visible = false; if (v.inside) { v.inside = false; v.o.visible = true; }
      if (!v.external) { v.o.position.x = v.home.x; v.o.position.z = v.home.z; if (world.groundAt) v.o.position.y = world.groundAt(v.home.x, v.home.z); v.last = [v.home.x, v.home.z]; } } };
  world.updaters.push((dt, t) => {
    if (G.paused) return;
    const on = !G.keep || G.keep('dayPlan'); if (!on) { if (was) rest(); was = false; return; } was = true;
    for (const v of V) if (!v.ready) prep(v);   // (villagers who arrived later)
    const n = world.isNight(), rain = G.weather && G.weather.state && G.weather.state() === 'rain';
    if (n !== night) { night = n; lights.forEach(l => { l.visible = n; });
      for (const v of V) { if (v.external) continue; if (n && v.door) { v.goal = [v.door.x, v.door.z]; v.going = 'in'; } else if (!n && v.inside) { v.inside = false; v.o.visible = true; v.goal = [v.home.x, v.home.z]; v.going = 'out'; } else if (!n) { v.goal = [v.home.x, v.home.z]; v.going = 'out'; } } }
    for (const v of V) {
      // someone who moves on their own (a parade, a dance) keeps to it: no day plan for them
      if (!v.external && Math.hypot(v.o.position.x - v.last[0], v.o.position.z - v.last[1]) > .05) { v.external = true; v.goal = null; if (v.inside) { v.inside = false; v.o.visible = true; } }
      v.umb.visible = !!rain && !v.inside; v.lamp.visible = n && !v.inside && !v.door && !v.external;
      if (v.external) continue;
      if (v.inside) { continue; }
      if (v.goal) { if (step(v, Math.min(dt, .1)) && v.going === 'in') { v.inside = true; v.o.visible = false; } v.last = [v.o.position.x, v.o.position.z]; continue; }
      if (n || !v.free) continue;
      // in the day: a few steps about their spot now and then
      if ((v.wait -= dt) <= 0) { v.wait = 5 + Math.random() * 8; const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 1.5, gx = v.home.x + Math.sin(a) * r, gz = v.home.z + Math.cos(a) * r;
        if (offRoad(gx, gz) && clear(v.o.position.x, v.o.position.z, gx, gz)) v.goal = [gx, gz]; }
    }
  });
  G.dayPlan = { list: V, lights, offRoad, inBox };
  return G.dayPlan;
}
