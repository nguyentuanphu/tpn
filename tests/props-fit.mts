// (v1.08g props) Every story and street prop's Blender model against its code shape: the same footprint and height,
// standing where the code shape stands (its lowest point at the same height) and turned the same way, so colliders, tap
// spots, the lights on the bridge rails and the story's steps stay true. The props are built in the page, their models
// swapped in at once, and each model's box compared with its code shape's (both in the code shape's parent's frame).
// By hand: cd tests && node props-fit.mts ; the check `propsfit` (tests/checks/world.mts) runs it.
import { launch, open, clear } from './harness.mts';

export async function propsFitCheck(b) {
  const P = await open(b, { w: 1024, h: 768 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const w = t => new Promise(res => setTimeout(res, t));
    const { THREE } = await import(String('/js/gfx.js'));
    const C2 = await import(String('/js/content/chapter2props.js')), C3 = await import(String('/js/content/chapter3props.js'));
    const K = await import(String('/js/modelkit.js'));
    const sv = (window as any).__sv, root = new THREE.Group(); root.position.set(3, 0, 3); sv.scene.add(root);
    // the story props, as the chapters and the films build them
    const built = [C2.buildStarLantern('#ff4a3a', true), C2.buildStoneTurtle(), C2.buildLionHead(), C2.buildMooncakes(), C2.buildBridge(),
      C3.buildOperaHouse(), C3.buildHarbourBridge(), C3.buildFerry(), C3.buildGumTree(1), C3.buildGumTree(.6), C3.buildKoala()];
    built.forEach((g, i) => { g.position.x = i * 40; root.add(g); });
    K.adoptWorldTags(); await K.wakeAllWorldModels();
    // the street props are in the valley already: their tags wait in the kit
    for (let k = 0; k < 40; k++) { await w(250); if (!K.worldModelsWaiting()) break; await K.wakeAllWorldModels(); }
    await w(2500);
    const out = [], boxOf = (o, own) => { o.updateMatrixWorld(true); const bx = new THREE.Box3();
      if (own) { o.geometry.computeBoundingBox(); bx.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); } else bx.setFromObject(o); return bx; };
    const models = []; sv.scene.traverse(o => { if (o.userData.fallback && o.userData.fallback.isMesh) models.push(o); });
    for (const m of models) {
      const fb = m.userData.fallback, name = String(m.userData.worldTag || '');
      // the star lantern's model is its stick and the star's bamboo frame: compared with the whole lantern (the paper star too)
      let a; if (name === 'pp-starlantern') { const par = fb.parent; par.remove(m); a = boxOf(par, false); par.add(m); } else a = boxOf(fb, true);
      const c = boxOf(m, false), sa = a.getSize(new THREE.Vector3()), sc = c.getSize(new THREE.Vector3());
      out.push({ name, a: [a.min.toArray(), a.max.toArray()].map(v => v.map(x => +x.toFixed(2))), c: [c.min.toArray(), c.max.toArray()].map(v => v.map(x => +x.toFixed(2))), sa: sa.toArray().map(x => +x.toFixed(2)), sc: sc.toArray().map(x => +x.toFixed(2)) });
    }
    root.removeFromParent();
    return { out, waiting: K.worldModelsWaiting(), n: models.length };
  });
  await P.ctx.close();
  const bad: string[] = [], seen = new Set<string>(), want = ['pp-starlantern', 'pp-stoneturtle', 'pp-lionhead', 'pp-mooncakes', 'pp-thehuc', 'lm-opera', 'pp-harbourbridge', 'pp-ferry', 'pp-gumtree', 'pp-koala',
    'pp-pole-traicay', 'pp-pole-tauhu', 'pp-pole-bunoc', 'pp-pole-bunrieu', 'pp-pole-banhda', 'pp-pole-cothu', 'pp-stall-bahai', 'pp-stall-olai', 'pp-stall-chunam', 'pp-stall-chutam', 'pp-stall-cout', 'pp-sizzle'];
  for (const x of r.out) {
    const n = want.find(k => x.name.startsWith(k)); if (!n) continue; seen.add(n);
    // each side of the box within 20 % of the shape's size on that axis (at least 0.15 m); the lowest point within 0.12 m
    for (let ax = 0; ax < 3; ax++) {
      const tol = Math.max(.15, x.sa[ax] * .2);
      if (Math.abs(x.a[0][ax] - x.c[0][ax]) > tol || Math.abs(x.a[1][ax] - x.c[1][ax]) > tol) bad.push(`${x.name}: ${'xyz'[ax]} code ${x.a[0][ax]}..${x.a[1][ax]} model ${x.c[0][ax]}..${x.c[1][ax]}`);
    }
    if (Math.abs(x.a[0][1] - x.c[0][1]) > .12) bad.push(`${x.name}: stands at ${x.c[0][1]}, the code shape at ${x.a[0][1]}`);
  }
  for (const n of want) if (!seen.has(n)) bad.push(n + ': no model swapped in');
  if (bad.length) throw new Error(`(${r.n} models found) ` + bad.join(' | '));
  return `${r.out.length} props swapped in (${seen.size} models): each within 20 % of its code shape's box on every side, standing at its height and turned its way`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const b = await launch();
  try { console.log(await propsFitCheck(b)); } catch (e) { console.log('FAIL ' + (e as Error).message); process.exitCode = 1; } finally { await b.close(); }
}
