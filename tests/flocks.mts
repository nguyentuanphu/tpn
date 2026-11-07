// (v1.08g creatures, owner 6 Nov 2026 AEDT) The little flocks drawn with Blender models (js/flocks.ts,
// models/world/flock-*.glb): near a child each kind's model takes its pictures' place, one InstancedMesh per kind (the
// butterflies' and birds' wings their own); each copy stands where its picture is (feet on the ground, waterline on the
// water); the pictures are hidden but kept (taps); the new flock of little birds circles over home; with the models
// blocked, the pictures stay.
import type { Browser } from 'playwright';
import { open, clear, noWelcome } from './harness.mts';
const quiet = { voice: false, sound: false, autoPack: false, online: false, countPlayers: false };
const visit = async (page) => page.evaluate(async () => {
  const G = (window as any).__sv, W = await import(String('/js/world.js')), wait = (ms: number) => new Promise(r => setTimeout(r, ms));
  for (let k = 0; k < 60 && !G.flocks; k++) await wait(250);
  const spots: [number, number][] = [];
  const crit = G.world.critters || [], first = (f: (c: any) => boolean) => crit.find(f);
  for (const c of [first(c => !c.water && !c.fly), first(c => c.water), first(c => c.fly)]) if (c) spots.push([c.cx, c.cz]);
  if (G.farm && G.farm.fish[0]) spots.push([G.farm.fish[0].s.position.x, G.farm.fish[0].s.position.z]);
  spots.push([W.PLATEAU.x, W.PLATEAU.z]);
  for (const [x, z] of spots) { G.heroes[0].place(x + 3, z + 3); await wait(3000); document.querySelectorAll('.storybook, .dialog, .modal').forEach(e => e.remove()); G.paused = false; }
  return G.flocks ? true : false;
});
export async function flocksCheck(b: Browser) {
  const bad: string[] = [], notes: string[] = [];
  const P = await open(b, { w: 1024, h: 700, settings: quiet });
  try {
    await clear(P.page); await noWelcome(P.page); await visit(P.page);
    const r = await P.page.evaluate(async () => { const G = (window as any).__sv, out: Record<string, unknown> = {}, wrong: string[] = [], { THREE } = await import(String('/js/gfx.js')), W = await import(String('/js/world.js'));
      const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
      for (const [k, v] of Object.entries(G.flocks.kinds) as [string, any][]) {
        if (!v.members.length) continue;
        out[k] = { members: v.members.length, model: !!v.mesh, wings: !!v.wingMesh, count: v.mesh ? v.mesh.count : 0 };
        if (!v.mesh) continue;
        v.members.forEach((m: any, i: number) => { v.mesh.getMatrixAt(i, m4); m4.decompose(p, q, s); if (s.x < .5) return;
          const sp = m.s.position; if (Math.hypot(p.x - sp.x, p.z - sp.z) > .05) wrong.push(`${k} ${i}: not where its picture is`);
          if (!m.s.userData.circle && m.s.visible) wrong.push(`${k} ${i}: its picture still shows`);
          if (k === 'hen' || k === 'rooster') { const g = W.heightAt(p.x, p.z); if (Math.abs(p.y - g) > .25) wrong.push(`${k} ${i}: feet ${(p.y - g).toFixed(2)} m from the ground`); } });
      }
      const draws = Object.values(G.flocks.kinds).filter((v: any) => v.mesh).length + Object.values(G.flocks.kinds).filter((v: any) => v.wingMesh).length;
      return { out, wrong, draws, tappable: (G.world.critters || []).every((c: any) => c.s.parent) };
    });
    for (const k of ['hen', 'rooster', 'duck', 'butterfly', 'bird', 'fish', 'clownfish']) { const v: any = r.out[k]; if (!v || !v.model) bad.push(k + ': no model near the child'); }
    if (!(r.out as any).butterfly?.wings || !(r.out as any).bird?.wings) bad.push('the wings are missing');
    bad.push(...r.wrong.slice(0, 6)); if (!r.tappable) bad.push('a critter picture was removed (taps need it)');
    notes.push(`kinds ${Object.entries(r.out).map(([k, v]: any) => `${k} ${v.members}${v.model ? '' : ' (pictures)'}`).join(', ')}; ${r.draws} draws for all the flocks`);
    if (P.errors.length) bad.push('errors: ' + P.errors.slice(0, 3).join(' | '));
  } finally { await P.ctx.close(); }
  // (the page's own fetch refuses the flock models: a route would miss the game's service worker, which fetches for the page)
  const Q = await open(b, { w: 900, h: 640, settings: quiet, pre: () => { const f = window.fetch.bind(window); window.fetch = ((u: any, o?: any) => String(u && u.url || u).includes('/models/world/flock-') ? Promise.reject(new Error('blocked')) : f(u, o)) as typeof fetch; } });
  try {
    await clear(Q.page); await noWelcome(Q.page); await visit(Q.page);
    const q = await Q.page.evaluate(() => { const G = (window as any).__sv; return { models: Object.values(G.flocks.kinds).filter((v: any) => v.mesh).length, shown: (G.world.critters || []).filter((c: any) => c.s.visible).length, all: (G.world.critters || []).length }; });
    if (q.models || q.shown < q.all - 6) bad.push('blocked: ' + JSON.stringify(q));
    const errs = Q.errors.filter(e => !/world model/.test(e)); if (errs.length) bad.push('errors with the models blocked: ' + errs.slice(0, 3).join(' | '));
    notes.push(`blocked: pictures kept (${q.shown}/${q.all} showing)`);
  } finally { await Q.ctx.close(); }
  if (bad.length) throw new Error(bad.join('\n'));
  return notes.join('; ');
}
