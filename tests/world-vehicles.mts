// Check `worldvehicles` (v1.08e vehicles, owner 6 Nov 2026 AEDT: every vehicle remade in Blender, loaded near the child):
//   1. every vehicle's model (models/world/veh-<id>.glb) loads and takes the code shape's place: the same size (within
//      4 cm), standing on the ground where the code shape stood, facing the same way (its box matches on every side);
//   2. each model wheel sits on its code wheel's hub and turns when the code turns the wheel;
//   3. a rider sits on the model's seat point with both hands on its handles (bicycle, motorbike, xích lô);
//   4. in the valley, the traffic near a child and the ferries' hulls are swapped once the models are woken;
//   5. blocked models (no network): the code shape stays, nothing breaks.
import { open, clear } from './harness.mts';

const ok = (c: unknown, msg: string) => { if (!c) throw new Error(msg); };

export async function worldVehiclesCheck(b) {
  const P = await open(b, { w: 1180, h: 760 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const V = await import(String('/js/vehicles.js')), K = await import(String('/js/modelkit.js')), A = await import(String('/js/avatar.js')), { THREE } = await import(String('/js/gfx.js'));
    const bad: string[] = [], ids = Object.keys(V.VEHICLES), sc = new THREE.Scene(), box = (o: any) => new THREE.Box3().setFromObject(o, true);
    const vs = ids.map(id => { const v = V.build(id); sc.add(v.o); v.o.position.set(Math.random() * 4, 0, 0); v.o.rotation.y = 1; V.wear(v); return v; });
    await new Promise(r => setTimeout(r, 50)); await K.wakeAllWorldModels();
    let wheels = 0, turned = 0;
    for (const v of vs) {
      if (!v.model) { bad.push(v.id + ': no model'); continue; }
      const body = v.o.getObjectByName('codeBody'); if (body.visible) bad.push(v.id + ': code body still shown');
      // the same box as the code shape (the code body and the code wheels, measured before the swap: from a fresh build)
      const c = V.build(v.id); c.o.position.copy(v.o.position); c.o.rotation.copy(v.o.rotation); sc.add(c.o); c.o.updateMatrixWorld(true); v.o.updateMatrixWorld(true);
      const a = box(c.o), m = box(v.model.obj); v.o.traverse((n: any) => { if (n.userData.fromModel) m.union(box(n)); });
      const d = Math.max(...['x', 'y', 'z'].flatMap(k => [Math.abs(a.min[k] - m.min[k]), Math.abs(a.max[k] - m.max[k])]));
      if (d > .04) bad.push(`${v.id}: box differs by ${d.toFixed(3)} m (${['x', 'y', 'z'].map(k => (m.min[k] - a.min[k]).toFixed(2) + '/' + (m.max[k] - a.max[k]).toFixed(2)).join(' ')})`);
      if (Math.abs(m.min.y - a.min.y) > .02) bad.push(`${v.id}: ${m.min.y < a.min.y ? 'sinks' : 'floats'} ${(m.min.y - a.min.y).toFixed(3)} m`);
      sc.remove(c.o);
      // each model wheel on its hub, turning with the code wheel
      v.wheels.forEach((w: any, i: number) => {
        const mw = w.children.find((n: any) => n.name === 'wheel' + i); wheels++;
        if (!mw) { bad.push(`${v.id}: wheel ${i} not fitted`); return; }
        const hub = w.getWorldPosition(new THREE.Vector3()), mc = box(mw).getCenter(new THREE.Vector3());
        if (hub.distanceTo(mc) > .05) bad.push(`${v.id}: wheel ${i} off its hub by ${hub.distanceTo(mc).toFixed(3)} m`);
        const q0 = mw.getWorldQuaternion(new THREE.Quaternion()); w.rotation.x += .7; w.updateMatrixWorld(true);
        if (mw.getWorldQuaternion(new THREE.Quaternion()).angleTo(q0) > .6) turned++; else bad.push(`${v.id}: wheel ${i} does not turn`);
      });
    }
    // a rider on the model's seat, hands on its handles (the hand is the arm's end, 0.42 m down the arm at scale 1)
    const riders: string[] = [];
    for (const id of ['roadster', 'honda67', 'scooter', 'xichlo', 'postie']) {
      const v = vs.find(x => x.id === id), av = A.buildAvatar({ skin: '#f2c9a8', hair: '#2a1d18', color: '#3b6fe0', style: 'shirt', hairStyle: 'short' }); V.seatRider(av, v, v.seat, v.grips, v.feet);
      v.o.updateMatrixWorld(true);
      const pt = (n: string) => v.model.obj.getObjectByName(n).getWorldPosition(new THREE.Vector3());
      const seatAt = v.o.localToWorld(new THREE.Vector3(...v.seat));
      if (seatAt.distanceTo(pt('seat')) > .01) bad.push(`${id}: seat is not the model's seat point`);
      for (const [arm, n] of [[av.armL, 'handleL'], [av.armR, 'handleR']] as [any, string][]) {
        const hand = arm.localToWorld(new THREE.Vector3(0, -.42, 0)), d = hand.distanceTo(pt(n));
        if (d > .12) bad.push(`${id}: ${n} hand ${d.toFixed(2)} m off`);
      }
      riders.push(id);
    }
    // the valley: traffic near a child and the ferries
    const G = (window as any).__sv, T = G.traffic, h = G.heroes[0], m = T.slots.find((s: any) => s.mover); const [mx, mz] = T.where(m); h.place(mx + 10, mz + 10);
    T.slots.forEach((sl: any) => { if (!sl.v) T.make(sl); }); await new Promise(r => setTimeout(r, 50)); await K.wakeAllWorldModels();
    const traffic = T.slots.filter((s: any) => s.v && s.v.model).length, ferries = G.ferries.ferries.filter((F: any) => F.model.children[0] && !F.model.children[0].visible).length;
    if (!traffic) bad.push('no traffic vehicle took its model'); if (ferries < G.ferries.ferries.length) bad.push(`${ferries}/${G.ferries.ferries.length} boats took their model`);
    return { bad, n: vs.length, wheels, turned, riders, traffic, ferries };
  });
  ok(!r.bad.length, r.bad.slice(0, 12).join('; '));
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  // blocked: no model can load, the code shapes stay
  const Q = await open(b, { w: 900, h: 640, route: async (ctx: any) => { await ctx.route('**/models/world/**', (rt: any) => rt.abort()); } } as any); await clear(Q.page);
  const q = await Q.page.evaluate(async () => {
    const V = await import(String('/js/vehicles.js')), K = await import(String('/js/modelkit.js')), { THREE } = await import(String('/js/gfx.js')), sc = new THREE.Scene();
    const v = V.build('sedan'); sc.add(v.o); V.wear(v); await new Promise(r => setTimeout(r, 50)); await K.wakeAllWorldModels(); await new Promise(r => setTimeout(r, 50));
    return { model: !!v.model, shown: v.o.getObjectByName('codeBody').visible, failed: K.worldModelFailed('veh-sedan') };
  });
  const errs = Q.errors.filter((e: string) => !/world model|Failed to load resource|ERR_FAILED/.test(e)); await Q.ctx.close();
  ok(!q.model && q.shown && q.failed, 'blocked: the code shape did not stay ' + JSON.stringify(q));
  ok(!errs.length, errs.join(' | '));
  return `${r.n} vehicle models in place (size, ground, facing); ${r.turned}/${r.wheels} wheels on their hubs and turning; riders seated with hands on the handles: ${r.riders.join(', ')}; ${r.traffic} traffic vehicles and ${r.ferries} boats swapped; blocked: the code shapes stay`;
}
